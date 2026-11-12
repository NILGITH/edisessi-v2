import { q, settings } from '../../lib/db'; import { notifyShop } from '../../lib/mail';
const cut = (v, n = 200) => String(v || '').trim().slice(0, n);
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const b = req.body || {};
  if (!cut(b.name) || !cut(b.phone)) return res.status(400).json({ error: 'Nom et téléphone obligatoires.' });
  if (b.kind === 'rdv') await q('insert into appointments(first_name,last_name,email,phone,requested_date,notes) values($1,$2,$3,$4,$5,$6)', [cut(b.first_name, 80), cut(b.name, 80), cut(b.email, 120), cut(b.phone, 30), /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : null, cut(b.message, 2000)]);
  else await q('insert into messages(kind,name,phone,email,message,product) values($1,$2,$3,$4,$5,$6)', [['sur-mesure', 'mesures'].includes(b.kind) ? b.kind : 'contact', cut([b.first_name, b.name].filter(Boolean).join(' '), 120), cut(b.phone, 30), cut(b.email, 120), cut(b.message, 2000), cut(b.product, 200)]);
  try { await notifyShop(b.kind === 'rdv' ? 'Nouvelle demande de rendez-vous' : 'Nouveau message du site', `${cut(b.name)} · ${cut(b.phone)}\n${cut(b.product)}\n${cut(b.message, 2000)}`, await settings()); } catch (e) { console.error(e); }
  res.json({ ok: true });
}
