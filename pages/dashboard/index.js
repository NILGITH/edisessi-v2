import Link from 'next/link'; import Admin, { money, day } from '../../components/Admin';
export async function getServerSideProps(ctx) {
  const { requireAdmin } = require('../../lib/auth'); const a = await requireAdmin(ctx); if (a.redirect) return a;
  const { q, one, plain } = require('../../lib/db');
  const k = await one(`select count(*) filter (where status not in ('annulee','en_attente_paiement'))::int as paid, coalesce(sum(total) filter (where status not in ('annulee','en_attente_paiement')),0)::int as ca,
    count(*) filter (where status='en_attente_paiement' and created_at < now() - interval '1 hour')::int as abandoned, count(*) filter (where status='en_attente_paiement')::int as pending,
    count(*) filter (where status not in ('annulee','en_attente_paiement') and country<>'BJ')::int as abroad from orders`);
  const pcs = await one(`select coalesce(sum((i->>'qty')::int),0)::int as n from orders o, jsonb_array_elements(o.items) i where o.status not in ('annulee','en_attente_paiement')`);
  return { props: plain({ user: a.user, k, pcs: pcs.n, clients: (await one('select count(*)::int n from clients')).n, products: (await one('select count(*)::int n from products where archived=false')).n,
    rdv: (await one("select count(*)::int n from appointments where status='en_attente'")).n, msgs: (await one('select count(*)::int n from messages where handled=false')).n,
    recent: await q('select id,number,created_at,last_name,first_name,total,status from orders order by created_at desc limit 5') }) };
}
export default function Dash({ user, k, pcs, clients, products, rdv, msgs, recent }) {
  const Card = ({ l, v, s, h }) => <Link href={h} className="kpi"><span>{l}</span><b>{v}</b><small>{s}</small></Link>;
  return (<Admin user={user} title="Tableau de bord"><div className="adm-hero"><h2>Tableau de bord</h2><p>Aperçu de votre activité EDI SESSI</p></div>
    <div className="kpis"><Card l="Chiffre d’affaires" v={money(k.ca)} s={`${k.paid} commandes validées`} h="/dashboard/commandes" /><Card l="Panier moyen" v={money(k.paid ? Math.round(k.ca / k.paid) : 0)} s={`${k.paid ? (pcs / k.paid).toFixed(1) : 0} pièces par commande`} h="/dashboard/rapports" />
      <Card l="Commandes hors Bénin" v={k.paid ? Math.round((k.abroad / k.paid) * 100) + ' %' : '—'} s={`${k.abroad} commandes internationales`} h="/dashboard/rapports" /><Card l="En attente de paiement" v={k.pending} s={`${k.abandoned} paniers abandonnés (+1 h)`} h="/dashboard/commandes?tab=abandon" />
      <Card l="Rendez-vous à confirmer" v={rdv} s="Sur-mesure et grande mesure" h="/dashboard/e/appointments" /><Card l="Messages non traités" v={msgs} s="Contact, sur-mesure, mesures" h="/dashboard/e/messages" /><Card l="Clients" v={clients} s="Fiches clients" h="/dashboard/e/clients" /><Card l="Produits" v={products} s="Au catalogue" h="/dashboard/e/products" /></div>
    <div className="panel"><div className="panel-h"><h3>Commandes récentes</h3><Link href="/dashboard/commandes" className="btn ghost sm">Voir tout</Link></div>
      {recent.length ? <table className="atbl"><thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Total</th><th>Statut</th></tr></thead><tbody>{recent.map((o) => <tr key={o.id}><td><Link href={'/dashboard/commandes?id=' + o.id}>{o.number}</Link></td><td>{day(o.created_at)}</td><td>{o.last_name} {o.first_name}</td><td>{money(o.total)}</td><td><span className={'st ' + o.status}>{o.status.replace(/_/g, ' ')}</span></td></tr>)}</tbody></table> : <p className="mut pad">Aucune commande pour le moment.</p>}</div>
    <p className="mut xs">Taux de conversion, durée des visites et pages vues se lisent dans Google Analytics (identifiant réglable dans Paramètres du site).</p></Admin>);
}
