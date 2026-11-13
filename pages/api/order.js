import crypto from 'crypto'; import { priceCart } from '../../lib/shop'; import { q, one, settings } from '../../lib/db'; import { orderMails } from '../../lib/mail'; import { rateLimit } from '../../lib/auth';
const cut = (v, n = 300) => String(v || '').trim().slice(0, n);
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const b = req.body || {};
  if (!(await rateLimit(req, 'order', 8, 60))) return res.status(429).json({ error: 'Trop de commandes en peu de temps. Réessayez plus tard ou écrivez-nous sur WhatsApp.' });
  if (!cut(b.last_name) || cut(b.phone).replace(/\D/g, '').length < 8 || !cut(b.country, 2)) return res.status(400).json({ error: 'Nom, téléphone et pays sont obligatoires.' });
  const cart = await priceCart(b.items, { country: b.country, promo: b.promo });
  if (!cart.lines.length) return res.status(400).json({ error: 'Panier vide.' });
  const method = ['momo', 'card', 'cod'].includes(b.payment) ? b.payment : 'momo';
  if (method === 'cod' && String(b.country).toUpperCase() !== 'BJ') return res.status(400).json({ error: 'Le paiement à la livraison est réservé au Bénin.' });
  const d = new Date(); const number = 'ES' + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  await q(`insert into orders(number,status,last_name,first_name,phone,email,country,address,city,notes,measurements,items,subtotal,discount,shipping,total,payment_method,promo_code,zone_name,lang)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
    [number, method === 'cod' ? 'en_preparation' : 'en_attente_paiement', cut(b.last_name, 80), cut(b.first_name, 80), cut(b.phone, 30), (/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(cut(b.email, 120)) ? cut(b.email, 120) : ''), cut(b.country, 2).toUpperCase(), cut(b.address), cut(b.city, 80), cut(b.notes, 1000), cut(b.measurements, 1000),
      JSON.stringify(cart.lines), cart.subtotal, cart.discount, cart.shipping, cart.total, method, cart.promoOk ? cut(b.promo, 40).toUpperCase() : null, cart.zone ? cart.zone.name_fr : null, b.lang === 'en' ? 'en' : 'fr']);
  try { const o = await one('select * from orders where number=$1', [number]); const proto = req.headers['x-forwarded-proto'] || 'http';
    await orderMails(o, cart.suggestions, await settings(), process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${req.headers.host}`); } catch (e) { console.error(e); }
  res.json({ number });
}
