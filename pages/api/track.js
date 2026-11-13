import { one } from '../../lib/db'; import { rateLimit } from '../../lib/auth';
// Suivi de commande : numéro + téléphone envoyés dans le corps de la requête (jamais dans l'adresse), tentatives limitées.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!(await rateLimit(req, 'track', 15, 15))) return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' });
  const { n, tel } = req.body || {}; const digits = String(tel || '').replace(/\D/g, '').slice(-8);
  const r = await one('select number,status,total,zone_name,tracking_note,phone from orders where upper(number)=upper($1)', [String(n || '').trim().slice(0, 40)]);
  if (!r || digits.length < 8 || !String(r.phone).replace(/\D/g, '').endsWith(digits)) return res.status(404).json({ error: 'not_found' });
  delete r.phone; res.json({ order: r });
}
