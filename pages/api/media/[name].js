import fs from 'fs'; import path from 'path';
export default async function handler(req, res) {
  const name = path.basename(String(req.query.name));
  const type = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif' }[path.extname(name).toLowerCase()];
  if (!type) return res.status(404).end();
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  if (process.env.DATABASE_URL) { const { one } = require('../../../lib/db'); const f = await one('select type,data from media_files where name=$1', [name]); if (!f) return res.status(404).end(); res.setHeader('Content-Type', f.type); return res.send(Buffer.from(f.data)); }
  const file = path.join(process.cwd(), 'data', 'uploads', name);
  if (!fs.existsSync(file)) return res.status(404).end();
  res.setHeader('Content-Type', type); fs.createReadStream(file).pipe(res);
}
