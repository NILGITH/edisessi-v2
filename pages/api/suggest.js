import { suggestions } from '../../lib/shop';
export default async function handler(req, res) { const ids = String(req.query.ids || '').split(',').map(Number).filter(Boolean).slice(0, 20); res.json({ items: await suggestions(ids) }); }
