import Admin, { money } from '../../components/Admin';
export async function getServerSideProps(ctx) {
  const { requireAdmin } = require('../../lib/auth'); const a = await requireAdmin(ctx); if (a.redirect) return a; const { q, one, plain } = require('../../lib/db');
  const days = [7, 30, 90, 365].includes(Number(ctx.query.p)) ? Number(ctx.query.p) : 30; const W = `status not in ('annulee','en_attente_paiement') and created_at >= now() - interval '${days} days'`;
  const k = await one(`select count(*)::int n, coalesce(sum(total),0)::int ca, count(*) filter (where country<>'BJ')::int abroad from orders where ${W}`);
  const all = await one(`select count(*)::int n, count(*) filter (where status='en_attente_paiement')::int ab from orders where created_at >= now() - interval '${days} days'`);
  return { props: plain({ user: a.user, days, k, all,
    pcs: (await one(`select coalesce(sum((i->>'qty')::int),0)::int n from orders o, jsonb_array_elements(o.items) i where ${W}`)).n,
    top: await q(`select i->>'name_fr' as name, sum((i->>'qty')::int)::int as qty, sum((i->>'total')::int)::int as ca from orders o, jsonb_array_elements(o.items) i where ${W} group by 1 order by 2 desc limit 10`),
    countries: await q(`select country, count(*)::int n, sum(total)::int ca from orders where ${W} group by 1 order by 2 desc`),
    stock: await q('select name,quantity,unit,alert_level from stock_items where alert_level>0 and quantity<=alert_level order by name'),
    newClients: (await one(`select count(*)::int n from clients where created_at >= now() - interval '${days} days'`)).n }) };
}
export default function Reports({ user, days, k, all, pcs, top, countries, stock, newClients }) {
  return (<Admin user={user} title="Rapports" actions={<><form method="get"><select name="p" defaultValue={days} onChange={(e) => e.target.form.submit()}><option value="7">7 derniers jours</option><option value="30">30 derniers jours</option><option value="90">3 mois</option><option value="365">12 mois</option></select></form><button className="btn ghost sm" onClick={() => window.print()}>PDF / Imprimer</button></>}>
    <div className="kpis"><div className="kpi"><span>Ventes</span><b>{money(k.ca)}</b><small>{k.n} commandes validées</small></div><div className="kpi"><span>Panier moyen</span><b>{money(k.n ? Math.round(k.ca / k.n) : 0)}</b><small>{k.n ? (pcs / k.n).toFixed(1) : 0} pièces par commande (vente croisée)</small></div>
      <div className="kpi"><span>Abandon du panier</span><b>{all.n ? Math.round((all.ab / all.n) * 100) : 0} %</b><small>{all.ab} commandes non payées sur {all.n}</small></div><div className="kpi"><span>Part hors Bénin</span><b>{k.n ? Math.round((k.abroad / k.n) * 100) : 0} %</b><small>{k.abroad} commandes internationales</small></div><div className="kpi"><span>Nouveaux clients</span><b>{newClients}</b><small>Fiches créées sur la période</small></div></div>
    <div className="two top"><div className="panel"><div className="panel-h"><h3>Pièces les plus vendues</h3></div><table className="atbl"><thead><tr><th>Pièce</th><th>Quantité</th><th>Ventes</th></tr></thead><tbody>{top.map((t) => <tr key={t.name}><td>{t.name}</td><td>{t.qty}</td><td>{money(t.ca)}</td></tr>)}</tbody></table>{!top.length && <p className="mut pad">Aucune vente sur la période.</p>}</div>
      <div><div className="panel"><div className="panel-h"><h3>Ventes par pays</h3></div><table className="atbl"><thead><tr><th>Pays</th><th>Commandes</th><th>Ventes</th></tr></thead><tbody>{countries.map((c) => <tr key={c.country}><td>{c.country}</td><td>{c.n}</td><td>{money(c.ca)}</td></tr>)}</tbody></table>{!countries.length && <p className="mut pad">Aucune vente sur la période.</p>}</div>
        <div className="panel"><div className="panel-h"><h3>Production : stocks sous le seuil d’alerte</h3></div>{stock.length ? <table className="atbl"><tbody>{stock.map((s) => <tr key={s.name}><td>{s.name}</td><td>{s.quantity} {s.unit}</td><td>seuil {s.alert_level}</td></tr>)}</tbody></table> : <p className="mut pad">Aucune alerte de stock.</p>}</div></div></div></Admin>);
}
