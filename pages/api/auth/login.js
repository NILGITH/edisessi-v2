import { one } from '../../../lib/db'; import { checkPassword, makeSession, cookie } from '../../../lib/auth';
const tries = new Map(); // limitation simple des tentatives par adresse IP
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0]; const now = Date.now();
  const t = (tries.get(ip) || []).filter((x) => now - x < 15 * 60e3);
  if (t.length >= 8) return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' });
  const { email, password } = req.body || {};
  const u = await one('select * from users where lower(email)=lower($1)', [String(email || '').trim()]);
  if (!u || !checkPassword(String(password || ''), u.pass_hash)) { t.push(now); tries.set(ip, t); return res.status(401).json({ error: 'Email ou mot de passe incorrect.' }); }
  res.setHeader('Set-Cookie', cookie(await makeSession(u), 7 * 86400)); res.json({ ok: true });
}
