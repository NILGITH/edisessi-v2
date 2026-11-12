// Emails transactionnels via Resend (RESEND_API_KEY). Sans clé, l'envoi est simplement ignoré.
const { fmt } = require('./util');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
async function sendMail({ to, subject, html, replyTo }) {
  if (!process.env.RESEND_API_KEY || !to) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.MAIL_FROM || 'EDI SESSI <contact@edisessi.com>', to: [to], subject, html, reply_to: replyTo }) });
    if (!r.ok) console.error('[mail] refus Resend', r.status, (await r.text()).slice(0, 200));
    return r.ok;
  } catch (e) { console.error('[mail]', e.message); return false; }
}
const shell = (body) => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#141414"><div style="background:#141414;color:#ffd87d;padding:18px 22px;font-weight:bold;letter-spacing:3px">EDI SESSI</div><div style="padding:22px;border:1px solid #e7e2d6;border-top:0">${body}</div></div>`;
// Confirmation à la cliente (avec pièces liées = vente croisée après l'achat) + alerte à la boutique.
async function orderMails(o, sugg, s, base) {
  const en = o.lang === 'en'; const url = `${base}${en ? '/en' : ''}/commande/${o.number}`;
  const rows = (o.items || []).map((l) => `<tr><td style="padding:6px 0">${esc(en && l.name_en ? l.name_en : l.name_fr)}${l.size ? ' · ' + esc(l.size) : ''} × ${l.qty}</td><td align="right">${fmt(l.total)}</td></tr>`).join('');
  const more = sugg.length ? `<p style="margin-top:22px"><b>${en ? 'To complete your outfit' : 'Pour compléter votre tenue'}</b></p>` + sugg.map((p) => `<p style="margin:4px 0"><a href="${base}${en ? '/en' : ''}/boutique/${p.slug}" style="color:#e2501e">${esc(en && p.name_en ? p.name_en : p.name_fr)}</a> · ${fmt(p.price)}</p>`).join('') : '';
  const body = `<h2 style="margin-top:0">${en ? 'Thank you for your order' : 'Merci pour votre commande'}</h2><p>${en ? 'Order number' : 'Numéro de commande'} : <b>${esc(o.number)}</b></p><table width="100%" style="border-collapse:collapse;font-size:14px">${rows}<tr><td style="padding-top:8px">${en ? 'Delivery' : 'Livraison'}${o.zone_name ? ' · ' + esc(o.zone_name) : ''}</td><td align="right">${fmt(o.shipping)}</td></tr><tr><td style="padding-top:8px"><b>Total</b></td><td align="right"><b>${fmt(o.total)}</b></td></tr></table><p style="margin-top:18px"><a href="${url}" style="background:#c6a348;color:#1a1400;padding:11px 18px;border-radius:8px;text-decoration:none;font-weight:bold">${en ? 'View my order' : 'Voir ma commande'}</a></p>${more}`;
  if (o.email) await sendMail({ to: o.email, subject: `${en ? 'Your EDI SESSI order' : 'Votre commande EDI SESSI'} ${o.number}`, html: shell(body), replyTo: s.email });
  const shop = process.env.MAIL_ORDERS_TO || s.email;
  await sendMail({ to: shop, subject: `Nouvelle commande ${o.number} · ${fmt(o.total)}`, html: shell(`<p><b>${esc(o.last_name)} ${esc(o.first_name)}</b> · ${esc(o.phone)} · ${esc(o.country)}</p><table width="100%" style="font-size:14px">${rows}</table><p><b>Total : ${fmt(o.total)}</b> · paiement : ${esc(o.payment_method)}</p><p><a href="${base}/dashboard/commandes">Ouvrir le dashboard</a></p>`) });
}
async function notifyShop(subject, text, s) { await sendMail({ to: process.env.MAIL_ORDERS_TO || s.email, subject, html: shell(`<p>${esc(text).replace(/\n/g, '<br>')}</p>`) }); }
module.exports = { sendMail, orderMails, notifyShop };
