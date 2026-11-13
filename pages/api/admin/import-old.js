// Import du catalogue de l'ancien site (produits et catégories), puis rapatriement des images par petits lots.
import { q, one } from '../../../lib/db'; import { guard, safeBack } from '../../../lib/adminApi'; import { slugify } from '../../../lib/util'; import { saveImage } from '../../../lib/storage';
export const config = { maxDuration: 60 };
const OLD = { test: (u) => { try { const h = new URL(u); return h.protocol === 'https:' && (h.hostname === 'www.edisessi.com' || h.hostname === 'edisessi.com' || h.hostname === 'nnussjkeoppiuhpzasxv.supabase.co'); } catch { return false; } } }; // hôtes autorisés uniquement
export default async function handler(req, res) {
  const b = req.body || {}; if (!(await guard(req, res, b.csrf, { admin: true }))) return;
  const done = (m) => res.redirect(303, safeBack('/dashboard/parametres?msg=' + encodeURIComponent(m), '/dashboard/parametres'));
  try {
    if (b.step === 'products') {
      const html = await (await fetch((process.env.OLD_SITE || 'https://www.edisessi.com') + '/boutique')).text();
      const m = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s); if (!m) return done('Catalogue introuvable sur l’ancien site.');
      const { initialProducts: products = [], initialCategories: cats = [] } = JSON.parse(m[1]).props.pageProps;
      const catId = {}; for (const c of cats) { const e = await one('select id from categories where lower(name_fr)=lower($1)', [c.name]); catId[c.id] = e ? e.id : (await one('insert into categories(name_fr) values($1) returning id', [c.name])).id; }
      const fabs = Object.fromEntries((await q('select id,slug from fabrics')).map((f) => [f.slug, f.id])); const cols = Object.fromEntries((await q('select id,slug from collections')).map((c) => [c.slug, c.id]));
      const have = new Set((await q("select images->>0 as u from products")).map((r) => r.u)); const slugs = new Set((await q('select slug from products')).map((r) => r.slug)); let added = 0;
      for (const p of products) {
        const images = p.image_urls || []; if (have.has(images[0])) continue; // déjà présent (même photo principale)
        const name = String(p.name).trim(); let base = slugify(name), slug = base, i = 2; while (slugs.has(slug)) slug = base + '-' + i++; slugs.add(slug);
        const txt = name + ' ' + (p.description || ''); const tutu = /t[uù]t[uù]/i.test(txt), kan = /kanvoh/i.test(txt);
        await q('insert into products(slug,name_fr,description_fr,price,gender,category_id,collection_id,fabric_id,sizes,images,in_stock) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
          [slug, name, p.description || '', p.price, /homme/i.test(name) ? 'homme' : 'femme', catId[p.category_id] || null, tutu ? cols['c-est-du-tutu'] || null : kan ? cols['tweed-kanvoh'] || null : null, tutu ? fabs.tutu || null : kan ? fabs['tweed-kanvoh'] || null : null, (p.available_sizes || []).join(',').replace(/;/g, ','), JSON.stringify(images), p.is_in_stock !== false]);
        added++;
      }
      return done(`${added} produits importés (${products.length} lus sur l’ancien site).`);
    }
    if (b.step === 'images') { // 6 images par clic pour rester sous la limite de durée
      let n = 0; const copy = async (u) => { if (n >= 6 || !u || !OLD.test(u)) return u; try { const r = await fetch(u); if (!r.ok) return u; const nu = await saveImage(Buffer.from(await r.arrayBuffer()), u.split('/').pop()); n++; return nu; } catch { return u; } };
      for (const [t, c] of [['settings', 'value'], ['collections', 'image'], ['fabrics', 'image'], ['looks', 'image'], ['posts', 'image'], ['pages', 'image'], ['blocks', 'image']]) {
        if (n >= 6) break; const idc = t === 'settings' ? 'key' : 'id';
        for (const r of await q(`select ${idc} as id, ${c} as u from ${t} where ${c} ~ 'edisessi\\.com|nnussjkeoppiuhpzasxv' ${t === 'settings' ? "and key='logo'" : ''} limit 6`)) { const nu = await copy(r.u); if (nu !== r.u) await q(`update ${t} set ${c}=$1 where ${idc}=$2`, [nu, r.id]); }
      }
      for (const r of await q("select id, images from products where images::text ~ 'edisessi\\.com|nnussjkeoppiuhpzasxv' limit 6")) { if (n >= 6) break; const out = []; for (const u of r.images || []) out.push(await copy(u)); await q('update products set images=$1 where id=$2', [JSON.stringify(out), r.id]); }
      const left = (await one("select (select count(*) from products where images::text ~ 'edisessi\\.com|nnussjkeoppiuhpzasxv') + (select count(*) from collections where image ~ 'edisessi\\.com|nnussjkeoppiuhpzasxv') + (select count(*) from looks where image ~ 'edisessi\\.com|nnussjkeoppiuhpzasxv') + (select count(*) from blocks where image ~ 'edisessi\\.com|nnussjkeoppiuhpzasxv') + (select count(*) from fabrics where image ~ 'edisessi\\.com|nnussjkeoppiuhpzasxv') + (select count(*) from pages where image ~ 'edisessi\\.com|nnussjkeoppiuhpzasxv') + (select count(*) from posts where image ~ 'edisessi\\.com|nnussjkeoppiuhpzasxv') as n")).n;
      return done(`${n} images rapatriées. Éléments restant à traiter : ${left}.`);
    }
  } catch (e) { console.error(e); return done('Import interrompu : ' + String(e.message).slice(0, 150)); }
  res.status(400).end();
}
