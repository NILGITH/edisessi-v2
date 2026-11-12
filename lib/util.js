const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'element';
const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)).replace(/ | /g, ' ') + ' FCFA';
// Prix indicatifs : 1 EUR = 655,957 FCFA (parité fixe) ; taux USD réglable dans Paramètres.
const alt = (n, s) => { const eur = n / 655.957; const usd = n / (Number(s && s.usd_rate) || 600); return `≈ ${Math.round(eur)} € · ${Math.round(usd)} $`; };
const L = (o, f, lang) => (o && (o[f + '_' + lang] || o[f + '_fr'])) || '';
const lines = (t) => String(t || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.split('|').map((x) => x.trim()));
const youtubeId = (u) => { const m = String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : null; };
module.exports = { slugify, fmt, alt, L, lines, youtubeId };
