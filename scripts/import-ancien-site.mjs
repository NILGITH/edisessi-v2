// Importe le catalogue complet de l'ancien site edisessi.com dans la nouvelle base, puis rapatrie les images.
// Usage : DATABASE_URL=... [SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...] npm run import:ancien-site
// À lancer AVANT de basculer le nom de domaine (le script lit le site en ligne).
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { q, one } = require('../lib/db'); const { slugify } = require('../lib/util'); const { saveImage } = require('../lib/storage');
const SITE = process.env.OLD_SITE || 'https://www.edisessi.com';
const html = await (await fetch(SITE + '/boutique')).text();
const m = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
if (!m) { console.error('Catalogue introuvable sur ' + SITE); process.exit(1); }
const { initialProducts: products = [], initialCategories: cats = [] } = JSON.parse(m[1]).props.pageProps;
const catId = {};
for (const c of cats) { const e = await one('select id from categories where lower(name_fr)=lower($1)', [c.name]); catId[c.id] = e ? e.id : (await one('insert into categories(name_fr) values($1) returning id', [c.name])).id; }
let added = 0;
for (const p of products) {
  const name = p.name.trim(); const images = p.image_urls || [];
  if (await one('select id from products where name_fr=$1 and images->>0=$2', [name, images[0] || ''])) continue;
  let base = slugify(name), slug = base, i = 2; while (await one('select id from products where slug=$1', [slug])) slug = base + '-' + i++;
  const txt = name + ' ' + (p.description || ''); const fab = /t[uù]t[uù]/i.test(txt) ? 'tutu' : /kanvoh/i.test(txt) ? 'tweed-kanvoh' : null;
  const f = fab && (await one('select id from fabrics where slug=$1', [fab]));
  await q('insert into products(slug,name_fr,description_fr,price,gender,category_id,fabric_id,sizes,images,in_stock) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [slug, name, p.description || '', p.price, /homme/i.test(name) ? 'homme' : 'femme', catId[p.category_id] || null, f ? f.id : null, (p.available_sizes || []).join(',').replace(/;/g, ','), JSON.stringify(images), p.is_in_stock !== false]);
  added++;
}
console.log(`${added} produits ajoutés (${products.length} lus).`);
// Rapatriement des images encore hébergées par l'ancien site ou son ancien stockage
const cache = {};
const copy = async (u) => { if (!u || !/edisessi\.com|nnussjkeoppiuhpzasxv/.test(u)) return u; if (cache[u]) return cache[u];
  try { const r = await fetch(u); if (!r.ok) return u; cache[u] = await saveImage(Buffer.from(await r.arrayBuffer()), u.split('/').pop()); return cache[u]; } catch { return u; } };
for (const [t, col] of [['collections', 'image'], ['fabrics', 'image'], ['looks', 'image'], ['posts', 'image'], ['pages', 'image'], ['blocks', 'image']]) for (const r of await q(`select id, ${col} as u from ${t}`)) { const n = await copy(r.u); if (n !== r.u) await q(`update ${t} set ${col}=$1 where id=$2`, [n, r.id]); }
for (const r of await q('select id, images from products')) { const n = []; for (const u of r.images || []) n.push(await copy(u)); if (JSON.stringify(n) !== JSON.stringify(r.images)) await q('update products set images=$1 where id=$2', [JSON.stringify(n), r.id]); }
const logo = await one("select value from settings where key='logo'"); if (logo) await q("update settings set value=$1 where key='logo'", [await copy(logo.value)]);
console.log(`${Object.keys(cache).length} images rapatriées.`); process.exit(0);
