import { q } from '../../../lib/db'; import { readSession } from '../../../lib/auth';
// Export CSV (s'ouvre dans Excel) des commandes ou des clients.
export default async function handler(req, res) {
  const u = await readSession(req); if (!u) return res.status(401).end();
  if (req.query.what === 'clients' && u.role !== 'admin') return res.status(403).end();
  const what = req.query.what === 'clients' ? 'clients' : 'orders';
  const rows = what === 'clients' ? await q('select last_name,first_name,phone,email,address,profession,created_at from clients order by last_name')
    : await q("select number,created_at,status,last_name,first_name,phone,email,country,city,subtotal,discount,shipping,total,payment_method,promo_code from orders order by created_at desc");
  const esc = (v) => { let s = v instanceof Date ? v.toISOString().slice(0, 16).replace('T', ' ') : String(v ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const csv = '﻿' + [Object.keys(rows[0] || { vide: '' }).join(';'), ...rows.map((r) => Object.values(r).map(esc).join(';'))].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="${what === 'clients' ? 'clients' : 'commandes'}-edisessi.csv"`); res.send(csv);
}
