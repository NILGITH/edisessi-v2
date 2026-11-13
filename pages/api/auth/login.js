import { one } from '../../../lib/db'; import { checkPassword, makeSession, cookie, rateLimit } from '../../../lib/auth';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password } = req.body || {}; const mail = String(email || '').trim().toLowerCase().slice(0, 120);
  // 10 essais par adresse IP et 8 par compte sur 15 minutes (compteur en base, valable sur toutes les instances)
  if (!(await rateLimit(req, 'login', 10, 15)) || !(await rateLimit(req, 'login-mail', 8, 15, mail))) return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' });
  const u = await one('select * from users where lower(email)=$1', [mail]);
  if (!u || !checkPassword(String(password || ''), u.pass_hash)) return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  res.setHeader('Set-Cookie', cookie(await makeSession(u), 7 * 86400)); res.json({ ok: true });
}
