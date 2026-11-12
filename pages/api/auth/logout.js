import { cookie } from '../../../lib/auth';
export default function handler(req, res) { res.setHeader('Set-Cookie', cookie('', 0)); res.redirect(303, '/login'); }
