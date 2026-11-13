import { q, one } from '../../../lib/db'; import { E } from '../../../lib/entities'; import { parseForm, guard, first, safeBack } from '../../../lib/adminApi';
import { saveImage } from '../../../lib/storage'; import { slugify, safeHref } from '../../../lib/util'; import { hashPassword } from '../../../lib/auth'; import fs from 'fs';
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  let parsed; try { parsed = await parseForm(req); } catch (e) { return res.status(400).send('Envoi refusé : fichier trop lourd ou formulaire invalide.'); }
  const { fields, files } = parsed; const F = (n) => first(fields[n]);
  if (!(await guard(req, res, F('csrf')))) return;
  const ent = E[String(req.query.entity)]; if (!ent) return res.status(404).end();
  if (ent.table === 'users' && !(await guard(req, res, F('csrf'), { admin: true }))) return; // comptes : rôle Admin uniquement
  const id = Number(req.query.id) || null; const row = {};
  const upload = async (file) => { const url = await saveImage(fs.readFileSync(file.filepath), file.originalFilename || 'image'); await q('insert into media(url,name) values($1,$2)', [url, (file.originalFilename || '').slice(0, 120)]); return url; };
  const isImg = (f) => f && f.size > 0 && /^image\//.test(f.mimetype || '');
  try {
    for (const f of ent.fields) {
      const v = F(f.n);
      if (f.t === 'num') row[f.n] = v === undefined || v === '' ? 0 : Number(String(v).replace(',', '.')) || 0;
      else if (f.t === 'bool') row[f.n] = v === 'on' || v === 'true';
      else if (f.t === 'rel') row[f.n] = Number(v) || null;
      else if (f.t === 'date') row[f.n] = /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : null;
      else if (f.t === 'multi') row[f.n] = JSON.stringify((fields[f.n] || []).map(Number).filter(Boolean));
      else if (f.t === 'image') { const file = first(files[f.n + '__file']); row[f.n] = isImg(file) ? await upload(file) : F(f.n + '__del') ? null : (safeHref(v, null)); }
      else if (f.t === 'images') { const keep = (fields[f.n + '__keep'] || []).filter(Boolean); const extra = String(F(f.n + '__url') || '').split(/\s+/).filter((u) => safeHref(u, null)); const added = []; for (const file of files[f.n + '__file'] || []) if (isImg(file)) added.push(await upload(file)); row[f.n] = JSON.stringify([...keep, ...extra, ...added]); }
      else if (f.t === 'password') { if (v) { if (String(v).length < 8) return res.status(400).send('Mot de passe : 8 caractères minimum.'); row[f.n] = hashPassword(String(v)); } else if (!id) return res.status(400).send('Mot de passe obligatoire.'); }
      else row[f.n] = v === undefined ? null : String(v).trim();
      if (/(_url|^instagram)$/.test(f.n) && row[f.n] && safeHref(row[f.n], null) === null) return res.status(400).send(`Lien non valide : ${f.l} (attendu : /page ou https://…)`);
      if (f.req && f.t !== 'password' && (row[f.n] === null || row[f.n] === '')) return res.status(400).send(`Champ obligatoire : ${f.l}`);
    }
    if (ent.slugFrom) { let base = slugify(row.slug || row[ent.slugFrom]); let s = base, i = 2; while (await one(`select id from ${ent.table} where slug=$1 and id<>$2`, [s, id || 0])) s = base + '-' + i++; row.slug = s; }
    const keys = Object.keys(row); const vals = keys.map((k) => row[k]);
    let newId = id;
    if (id) await q(`update ${ent.table} set ${keys.map((k, i) => `${k}=$${i + 1}`).join(',')} where id=$${keys.length + 1}`, [...vals, id]);
    else newId = (await one(`insert into ${ent.table}(${keys.join(',')}) values(${keys.map((_, i) => '$' + (i + 1)).join(',')}) returning id`, vals)).id;
    const dflt = ent.table === 'blocks' ? `/dashboard/e/pages/${row.page_id}` : ent.table === 'pages' ? `/dashboard/e/pages/${newId}?ok=1` : `/dashboard/e/${ent.table}?ok=1`;
    res.redirect(303, safeBack(F('back'), dflt));
  } catch (e) { console.error(e); res.status(500).send('Enregistrement impossible : ' + String(e.message).slice(0, 200)); }
}
