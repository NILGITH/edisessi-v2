import { priceCart } from '../../lib/shop';
export default async function handler(req, res) { if (req.method !== 'POST') return res.status(405).end(); const { items, country, promo } = req.body || {}; res.json(await priceCart(items, { country, promo })); }
