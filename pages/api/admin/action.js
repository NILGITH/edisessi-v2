import { q, one } from '../../../lib/db'; import { E, ORDER_STATUS } from '../../../lib/entities'; import { guard, safeBack } from '../../../lib/adminApi';
// Actions rapides du backoffice : suppression, interrupteurs, statut de commande, réglages, médiathèque.
export default async function handler(req, res) {
  const b = req.body || {}; const user = await guard(req, res, b.csrf); if (!user) return;
  const back = (d) => res.redirect(303, safeBack(b.back, d)); const id = Number(b.id);
  if (b.do === 'delete') { const ent = E[b.entity]; if (!ent || !id) return res.status(400).end();
    if (ent.table === 'users' && id === user.id) return res.status(400).send('Vous ne pouvez pas supprimer votre propre compte.');
    if (ent.table === 'pages') { const p = await one('select is_system from pages where id=$1', [id]); if (p && p.is_system) return res.status(400).send('La page d’accueil ne peut pas être supprimée.'); await q('delete from blocks where page_id=$1', [id]); }
    await q(`delete from ${ent.table} where id=$1`, [id]); return back(`/dashboard/e/${ent.table}`); }
  if (b.do === 'toggle') { const ent = E[b.entity]; if (!ent || !(ent.toggles || []).concat(['visible', 'published']).includes(b.field) || !ent.fields.find((f) => f.n === b.field)) return res.status(400).end();
    await q(`update ${ent.table} set ${b.field} = not coalesce(${b.field},false) where id=$1`, [id]); return back(`/dashboard/e/${ent.table}`); }
  if (b.do === 'order') { if (!ORDER_STATUS.find((s) => s[0] === b.status)) return res.status(400).end();
    await q('update orders set status=$1, tracking_note=$2 where id=$3', [b.status, String(b.tracking_note || '').slice(0, 500), id]); return back('/dashboard/commandes?id=' + id); }
  if (b.do === 'settings') { for (const [k, v] of Object.entries(b)) if (k.startsWith('s_')) await q('insert into settings(key,value) values($1,$2) on conflict (key) do update set value=excluded.value', [k.slice(2), String(v).slice(0, 5000)]); return back('/dashboard/parametres?ok=1'); }
  if (b.do === 'media-delete') { await q('delete from media where id=$1', [id]); return back('/dashboard/medias'); }
  res.status(400).end();
}
