import { q, settings } from '../../lib/db'; import { notifyShop } from '../../lib/mail';
const cut = (v, n = 200) => String(v || '').trim().slice(0, n);
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const b = req.body || {};
  if (!cut(b.name) || !cut(b.phone)) return res.status(400).json({ error: 'Nom et téléphone obligatoires.' });
  if (b.kind === 'rdv') {
    let country = null, date = null, time = null;
    if (b.country && b.date && b.time) { // créneau choisi dans le calendrier : vérifié côté serveur
      const { availability } = require('../../lib/rdv'); const a = await availability(b.country, String(b.date).slice(0, 7));
      if (!a || !(a.days[b.date] || []).includes(b.time)) return res.status(409).json({ error: 'Ce créneau n’est plus disponible. Merci d’en choisir un autre.' });
      country = a.country.code; date = b.date; time = b.time;
    }
    await q('insert into appointments(first_name,last_name,email,phone,kind,requested_date,appointment_date,country,slot_time,notes) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [cut(b.first_name, 80), cut(b.name, 80), cut(b.email, 120), cut(b.phone, 30), ['grande-mesure', 'sur-mesure', 'essayage'].includes(b.type) ? b.type : 'grande-mesure', date || (/^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : null), date, country, time, cut(b.message, 2000)]);
  }
  else await q('insert into messages(kind,name,phone,email,message,product) values($1,$2,$3,$4,$5,$6)', [['sur-mesure', 'mesures'].includes(b.kind) ? b.kind : 'contact', cut([b.first_name, b.name].filter(Boolean).join(' '), 120), cut(b.phone, 30), cut(b.email, 120), cut(b.message, 2000), cut(b.product, 200)]);
  try { await notifyShop(b.kind === 'rdv' ? 'Nouvelle demande de rendez-vous' : 'Nouveau message du site', `${cut(b.name)} · ${cut(b.phone)}\n${b.kind === 'rdv' && b.time ? cut(b.country, 2) + ' · ' + cut(b.date, 10) + ' à ' + cut(b.time, 5) : cut(b.product)}\n${cut(b.message, 2000)}`, await settings()); } catch (e) { console.error(e); }
  res.json({ ok: true });
}
