const { q, one } = require('./db');
const iso = (d) => d.toISOString().slice(0, 10);
// Créneaux libres d'un pays pour un mois : jours ouverts, délai minimum, dates fermées, créneaux déjà réservés retirés.
async function availability(code, ym) {
  const c = await one('select * from rdv_countries where code=$1 and enabled=true', [String(code || '').toUpperCase()]);
  if (!c || !/^\d{4}-\d{2}$/.test(ym || '')) return null;
  const [y, m] = ym.split('-').map(Number); const days = String(c.days || '').split(',').map((x) => Number(x.trim())).filter(Boolean);
  const slots = String(c.slots || '').split(',').map((x) => x.trim()).filter((x) => /^\d{2}:\d{2}$/.test(x)); const closed = String(c.closed_dates || '').split(/[,\s]+/).filter(Boolean);
  const now = new Date(); const min = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (c.min_notice_days ?? 2));
  const taken = {}; for (const r of await q("select appointment_date::text as d, slot_time from appointments where country=$1 and status<>'annule' and appointment_date >= $2::date and appointment_date < ($2::date + interval '1 month')", [c.code, `${ym}-01`])) (taken[r.d.slice(0, 10)] ||= []).push(r.slot_time);
  const out = {}; const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  for (let d = 1; d <= n; d++) { const dt = new Date(Date.UTC(y, m - 1, d)); const key = iso(dt); const wd = ((dt.getUTCDay() + 6) % 7) + 1;
    if (dt.getTime() < min || !days.includes(wd) || closed.includes(key)) continue; const free = slots.filter((s) => !(taken[key] || []).includes(s)); if (free.length) out[key] = free; }
  return { country: c, days: out };
}
module.exports = { availability };
