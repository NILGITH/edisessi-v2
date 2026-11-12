// Confirmation de paiement KKiaPay : la transaction est vérifiée côté serveur avant de marquer la commande « payée ».
// Variables requises : KKIAPAY_PRIVATE_KEY et KKIAPAY_SECRET (la clé publique se règle dans Dashboard > Paramètres).
import { q, one, settings } from '../../../lib/db';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { number, transactionId } = req.body || {};
  const o = await one('select id,total,status from orders where number=$1', [String(number || '')]);
  if (!o || !transactionId) return res.status(400).json({ error: 'Commande introuvable.' });
  if (o.status !== 'en_attente_paiement') return res.json({ ok: true });
  const s = await settings();
  if (!s.kkiapay_public_key || !process.env.KKIAPAY_PRIVATE_KEY || !process.env.KKIAPAY_SECRET) return res.status(503).json({ error: 'Paiement en ligne non configuré.' });
  const host = s.kkiapay_sandbox === '1' ? 'https://api-sandbox.kkiapay.me' : 'https://api.kkiapay.me';
  try {
    const r = await fetch(host + '/api/v1/transactions/status', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'x-api-key': s.kkiapay_public_key, 'x-private-key': process.env.KKIAPAY_PRIVATE_KEY, 'x-secret-key': process.env.KKIAPAY_SECRET }, body: JSON.stringify({ transactionId: String(transactionId) }) });
    const d = await r.json();
    if (d.status === 'SUCCESS' && Number(d.amount) >= o.total) { await q("update orders set status='payee', payment_ref=$1 where id=$2", [String(transactionId).slice(0, 80), o.id]); return res.json({ ok: true }); }
    return res.status(402).json({ error: 'Paiement non confirmé.' });
  } catch (e) { return res.status(502).json({ error: 'Vérification du paiement impossible pour le moment.' }); }
}
