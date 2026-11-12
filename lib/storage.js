// Stockage des images : Supabase Storage (bucket public « media ») si la clé de service est fournie, sinon la base de données, sinon ./data/uploads en local.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
async function saveImage(buffer, originalName = 'image') {
  let out = buffer, ext = (path.extname(originalName) || '.jpg').toLowerCase(), type = 'image/jpeg';
  try { // compression + redimensionnement (chargement plus rapide)
    const sharp = require('sharp');
    out = await sharp(buffer).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    ext = '.webp'; type = 'image/webp';
  } catch (e) { if (!/\.(jpe?g|png|webp|gif)$/.test(ext)) throw new Error('Format d’image non pris en charge'); }
  const name = Date.now().toString(36) + '-' + crypto.randomBytes(5).toString('hex') + ext;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const bucket = process.env.SUPABASE_BUCKET || 'media';
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${name}`, { method: 'POST', headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': type, 'cache-control': '31536000' }, body: out });
    if (!r.ok) throw new Error('Envoi Supabase Storage refusé : ' + (await r.text()).slice(0, 200));
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${name}`;
  }
  if (process.env.DATABASE_URL) { // repli : image enregistrée en base et servie par /api/media
    const { q } = require('./db'); await q('insert into media_files(name,type,data) values($1,$2,$3)', [name, type, out]); return '/api/media/' + name;
  }
  const dir = path.join(process.cwd(), 'data', 'uploads'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), out);
  return '/api/media/' + name;
}
module.exports = { saveImage };
