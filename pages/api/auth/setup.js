// Création du premier compte administrateur : possible uniquement tant qu'aucun utilisateur n'existe.
import { one } from '../../../lib/db'; import { hashPassword, makeSession, cookie, rateLimit } from '../../../lib/auth';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!(await rateLimit(req, 'setup', 5, 60))) return res.status(429).json({ error: 'Trop de tentatives.' });
  const { email, password, name } = req.body || {};
  if (!/^\S+@\S+\.\S+$/.test(email || '') || String(password || '').length < 10) return res.status(400).json({ error: 'Email valide et mot de passe de 10 caractères minimum.' });
  const u = await one(`insert into users(email,name,role,pass_hash) select $1,$2,'admin',$3 where not exists (select 1 from users) returning id, pass_hash`, [String(email).trim().toLowerCase(), String(name || 'Admin').slice(0, 80), hashPassword(String(password))]);
  if (!u) return res.status(403).json({ error: 'Un administrateur existe déjà.' });
  res.setHeader('Set-Cookie', cookie(await makeSession(u), 7 * 86400)); res.json({ ok: true });
}
