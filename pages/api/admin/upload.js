import { q } from '../../../lib/db'; import { parseForm, guard, first } from '../../../lib/adminApi'; import { saveImage } from '../../../lib/storage'; import fs from 'fs';
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  let p; try { p = await parseForm(req); } catch { return res.status(400).send('Fichier trop lourd (12 Mo maximum par image).'); }
  if (!(await guard(req, res, first(p.fields.csrf)))) return;
  try { for (const f of p.files.files || []) if (f.size > 0 && /^image\//.test(f.mimetype || '')) { const url = await saveImage(fs.readFileSync(f.filepath), f.originalFilename); await q('insert into media(url,name) values($1,$2)', [url, (f.originalFilename || '').slice(0, 120)]); } }
  catch (e) { return res.status(500).send('Envoi impossible : ' + String(e.message).slice(0, 200)); }
  res.redirect(303, '/dashboard/medias');
}
