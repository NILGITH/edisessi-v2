import { availability } from '../../lib/rdv';
export default async function handler(req, res) { const a = await availability(req.query.country, req.query.ym); if (!a) return res.status(404).json({ days: {} }); res.json({ days: a.days }); }
