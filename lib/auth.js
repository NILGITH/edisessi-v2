const crypto = require('crypto');
const hashPassword = (pw) => { const salt = crypto.randomBytes(16).toString('hex'); return salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex'); };
const checkPassword = (pw, stored) => { const [salt, h] = String(stored).split(':'); if (!salt || !h) return false; const a = Buffer.from(h, 'hex'); const b = crypto.scryptSync(pw, salt, 64); return a.length === b.length && crypto.timingSafeEqual(a, b); };
async function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const { one, q } = require('./db');
  let r = await one("select value from settings where key='session_secret'");
  if (!r) { r = { value: crypto.randomBytes(32).toString('hex') }; await q("insert into settings(key,value) values('session_secret',$1) on conflict (key) do nothing", [r.value]); }
  return r.value;
}
const sign = (data, sec) => crypto.createHmac('sha256', sec).update(data).digest('hex');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const pv = (hash) => crypto.createHash('sha256').update(String(hash)).digest('hex').slice(0, 12); // change dès que le mot de passe change
async function makeSession(user) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, v: pv(user.pass_hash), exp: Date.now() + 7 * 864e5, csrf: crypto.randomBytes(16).toString('hex') })).toString('base64url');
  return payload + '.' + sign(payload, await secret());
}
async function readSession(req) {
  const m = (req.headers.cookie || '').match(/(?:^|;\s*)es_session=([^;]+)/);
  if (!m) return null;
  const [payload, sig] = m[1].split('.');
  if (!payload || !sig || !same(sign(payload, await secret()), sig)) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (d.exp < Date.now()) return null;
    const { one } = require('./db');
    const u = await one('select id,email,name,role,pass_hash from users where id=$1', [d.id]);
    if (!u || !same(pv(u.pass_hash), d.v || '')) return null; // session invalidée si le mot de passe a changé
    return { id: u.id, email: u.email, name: u.name, role: u.role, csrf: d.csrf };
  } catch { return null; }
}
const cookie = (v, maxAge) => `es_session=${v}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
// Garde pour getServerSideProps du dashboard
async function requireAdmin(ctx, opts = {}) {
  const user = await readSession(ctx.req);
  if (!user) return { redirect: { destination: '/login', permanent: false } };
  if (opts.admin && user.role !== 'admin') return { redirect: { destination: '/dashboard', permanent: false } }; // réservé au rôle Admin
  return { user };
}
// Limitation de débit partagée entre toutes les instances (table rate_hits)
async function rateLimit(req, name, max, minutes, extra = '') {
  const { q, one } = require('./db');
  const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '').split(',')[0].trim().slice(0, 60);
  const key = `${name}:${extra || ip}`;
  const r = await one(`select count(*)::int as n from rate_hits where key=$1 and at > now() - ($2 || ' minutes')::interval`, [key, String(minutes)]);
  if (r.n >= max) return false;
  await q('insert into rate_hits(key) values($1)', [key]);
  if (Math.random() < 0.02) await q("delete from rate_hits where at < now() - interval '2 days'");
  return true;
}
module.exports = { hashPassword, checkPassword, makeSession, readSession, cookie, requireAdmin, rateLimit };
