import { cookie } from '../../../lib/auth';
// Déconnexion par POST uniquement : un simple lien externe ne peut pas déconnecter l'administrateur.
export default function handler(req, res) { if (req.method !== 'POST') return res.status(405).end(); res.setHeader('Set-Cookie', cookie('', 0)); res.redirect(303, '/login'); }
