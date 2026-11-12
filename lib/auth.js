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
async function makeSession(user) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, exp: Date.now() + 7 * 864e5, csrf: crypto.randomBytes(12).toString('hex') })).toString('base64url');
  return payload + '.' + sign(payload, await secret());
}
async function readSession(req) {
  const m = (req.headers.cookie || '').match(/(?:^|;\s*)es_session=([^;]+)/);
  if (!m) return null;
  const [payload, sig] = m[1].split('.');
  if (!payload || !sig || sign(payload, await secret()) !== sig) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (d.exp < Date.now()) return null;
    const { one } = require('./db');
    const u = await one('select id,email,name,role from users where id=$1', [d.id]);
    return u ? { ...u, csrf: d.csrf } : null;
  } catch { return null; }
}
const cookie = (v, maxAge) => `es_session=${v}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
// Garde pour getServerSideProps du dashboard
async function requireAdmin(ctx) {
  const user = await readSession(ctx.req);
  if (!user) return { redirect: { destination: '/login', permanent: false } };
  return { user };
}
module.exports = { hashPassword, checkPassword, makeSession, readSession, cookie, requireAdmin };
