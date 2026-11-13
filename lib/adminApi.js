const { readSession } = require('./auth');
const first = (v) => (Array.isArray(v) ? v[0] : v);
async function parseForm(req) {
  const { formidable } = require('formidable');
  const form = formidable({ multiples: true, maxFileSize: 12 * 1024 * 1024, maxTotalFileSize: 80 * 1024 * 1024, allowEmptyFiles: true, minFileSize: 0 });
  const [fields, files] = await form.parse(req);
  return { fields, files };
}
// Vérifie la session et le jeton CSRF (champ caché « csrf » ou en-tête x-csrf).
async function guard(req, res, token, opts = {}) {
  const user = await readSession(req);
  if (!user) { res.status(401).json({ error: 'Session expirée, reconnectez-vous.' }); return null; }
  if (req.method !== 'POST' || (token || req.headers['x-csrf']) !== user.csrf) { res.status(403).json({ error: 'Requête refusée.' }); return null; }
  if (opts.admin && user.role !== 'admin') { res.status(403).json({ error: 'Réservé au rôle Admin.' }); return null; }
  return user;
}
const safeBack = (b, d) => (typeof b === 'string' && b.startsWith('/dashboard') && !b.startsWith('//') ? b : d);
module.exports = { parseForm, guard, first, safeBack };
