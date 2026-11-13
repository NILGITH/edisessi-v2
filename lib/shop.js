const { q, one, settings, plain } = require('./db'); const { safeHref } = require('./util');
const PUBLIC_SETTINGS = ['site_name', 'logo', 'phone', 'whatsapp', 'email', 'address', 'hours_fr', 'hours_en', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'usd_rate', 'gtm_id', 'kkiapay_public_key', 'kkiapay_sandbox', 'payments', 'stats', 'size_guide', 'gala_url', 'gala_label_fr', 'gala_label_en'];

const CARD = 'p.id,p.slug,p.name_fr,p.name_en,p.price,p.images,p.sizes,p.is_new,p.in_stock,p.category_id,p.collection_id,p.fabric_id,p.gender';
const LIVE = 'p.archived=false';

async function common(ctx) {
  const all = await settings(); const s = {}; // seuls les réglages utiles à l'affichage partent vers le navigateur
  for (const k of PUBLIC_SETTINGS) if (all[k] !== undefined) s[k] = all[k];
  for (const k of ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'gala_url']) if (s[k]) s[k] = safeHref(s[k], '');
  const pages = await q('select slug,title_fr,title_en,in_menu,in_footer from pages where published=true and is_system=false order by position,id');
  const faqs = await q('select question_fr,question_en,keywords,answer_fr,answer_en from faqs where published=true order by position,id');
  return { s, pages, faqs, lang: ctx.locale || 'fr' };
}

async function listProducts(f = {}) {
  const w = [LIVE]; const p = [];
  const add = (sql, v) => { p.push(v); w.push(sql.replace('?', '$' + p.length)); };
  if (f.category) add('p.category_id=?', Number(f.category));
  if (f.collection) add('p.collection_id=(select id from collections where slug=?)', f.collection);
  if (f.fabric) add('p.fabric_id=(select id from fabrics where slug=?)', f.fabric);
  if (f.genre) add('p.gender=?', f.genre);
  if (f.max) add('p.price<=?', Number(f.max));
  if (f.q) { p.push(String(f.q)); w.push(`(p.name_fr ilike '%'||$${p.length}||'%' or coalesce(p.name_en,'') ilike '%'||$${p.length}||'%')`); }
  if (f.ids) add('p.id = any(?::int[])', f.ids);
  const order = { prix_asc: 'p.price asc', prix_desc: 'p.price desc', nom: 'p.name_fr asc' }[f.tri] || 'p.featured desc, p.is_new desc, p.created_at desc, p.id desc';
  return plain(await q(`select ${CARD} from products p where ${w.join(' and ')} order by ${order} limit ${Number(f.limit) || 200}`, p));
}

// Suggestions de vente croisée : pièces saisies comme « va avec », puis même collection / même tissu.
async function suggestions(ids, limit = 3) {
  if (!ids.length) return [];
  const base = await q('select id,related,collection_id,fabric_id from products where id = any($1::int[])', [ids]);
  const rel = [...new Set(base.flatMap((b) => b.related || []))].filter((i) => !ids.includes(i));
  let out = rel.length ? await listProducts({ ids: rel }) : [];
  if (out.length < limit) {
    const cols = base.map((b) => b.collection_id).filter(Boolean); const fabs = base.map((b) => b.fabric_id).filter(Boolean);
    const more = plain(await q(`select ${CARD} from products p where ${LIVE} and p.in_stock and not (p.id = any($1::int[])) and (p.collection_id = any($2::int[]) or p.fabric_id = any($3::int[])) order by p.featured desc, p.id desc limit 6`, [[...ids, ...out.map((o) => o.id)], cols, fabs]));
    out = out.concat(more);
  }
  return out.slice(0, limit);
}

async function zoneFor(country) {
  const zones = await q('select * from zones order by position,id');
  return zones.find((z) => (z.countries || '').split(',').map((c) => c.trim().toUpperCase()).includes(String(country || '').toUpperCase())) || zones.find((z) => z.is_default) || zones[0] || null;
}

// Calcul du panier côté serveur (prix, ensembles, code promo, livraison). Les prix envoyés par le navigateur ne sont jamais utilisés.
async function priceCart(items, { country, promo } = {}) {
  const clean = (Array.isArray(items) ? items : []).map((i) => ({ id: Number(i.id), size: String(i.size || '').slice(0, 20), qty: Math.max(1, Math.min(20, Number(i.qty) || 1)) })).filter((i) => i.id).slice(0, 50);
  const ids = [...new Set(clean.map((i) => i.id))];
  const prods = ids.length ? await q(`select ${CARD} from products p where ${LIVE} and p.id = any($1::int[])`, [ids]) : [];
  const byId = Object.fromEntries(prods.map((p) => [p.id, p]));
  const linesOut = clean.filter((i) => byId[i.id]).map((i) => { const p = byId[i.id]; return { id: p.id, slug: p.slug, name_fr: p.name_fr, name_en: p.name_en, image: (p.images || [])[0] || null, price: p.price, size: i.size, qty: i.qty, total: p.price * i.qty }; });
  const subtotal = linesOut.reduce((a, l) => a + l.total, 0);
  // Prix d'ensemble
  const qty = {}; for (const l of linesOut) qty[l.id] = (qty[l.id] || 0) + l.qty;
  let bundleDiscount = 0; const bundles = [];
  for (const b of await q('select * from bundles where published=true order by id')) {
    const pids = b.products || []; if (pids.length < 2 || !pids.every((i) => qty[i] > 0)) continue;
    const n = Math.min(...pids.map((i) => qty[i])); const full = pids.reduce((a, i) => a + byId[i].price, 0);
    if (full > b.price) { bundleDiscount += (full - b.price) * n; bundles.push({ name_fr: b.name_fr, name_en: b.name_en, saving: (full - b.price) * n }); pids.forEach((i) => (qty[i] -= n)); }
  }
  let promoDiscount = 0, promoOk = null;
  if (promo) {
    const pr = await one("select * from promos where upper(code)=upper($1) and active=true and (expires_at is null or expires_at >= current_date)", [String(promo).trim()]);
    promoOk = !!pr;
    if (pr) promoDiscount = pr.kind === 'percent' ? Math.round(((subtotal - bundleDiscount) * Math.min(100, pr.value)) / 100) : Math.min(subtotal - bundleDiscount, pr.value);
  }
  const zone = country ? await zoneFor(country) : null;
  const shipping = zone && linesOut.length ? zone.fee : 0;
  const discount = bundleDiscount + promoDiscount;
  return plain({ lines: linesOut, subtotal, bundles, bundleDiscount, promoDiscount, promoOk, discount, shipping, zone: zone && { name_fr: zone.name_fr, name_en: zone.name_en, delay_fr: zone.delay_fr, delay_en: zone.delay_en, fee: zone.fee }, total: Math.max(0, subtotal - discount) + shipping, suggestions: await suggestions(ids) });
}

module.exports = { common, listProducts, suggestions, priceCart, zoneFor, CARD, LIVE };
