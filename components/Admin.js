import Head from 'next/head'; import Link from 'next/link'; import { useRouter } from 'next/router'; import { useState } from 'react';
import { E, GROUPS } from '../lib/entities';
export default function Admin({ user, title, children, actions }) {
  const r = useRouter(); const [open, setOpen] = useState(false); const on = (h) => (r.asPath.split('?')[0] === h || (h !== '/dashboard' && r.asPath.startsWith(h)) ? 'on' : '');
  const item = (h, l) => <Link key={h} href={h} locale={false} className={on(h)}>{l}</Link>;
  return (<div className="adm"><Head><title>{title} · Dashboard EDI SESSI</title><meta name="robots" content="noindex" /><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <aside className={'adm-side' + (open ? ' open' : '')}><div className="adm-logo">EDI SESSI</div>
      {item('/dashboard', 'Vue d’ensemble')}{item('/dashboard/commandes', 'Commandes')}
      {GROUPS.map((g) => <div key={g}><h5>{g}</h5>{Object.values(E).filter((e) => e.group === g && !e.hidden).map((e) => item('/dashboard/e/' + e.table, e.label))}{g === 'Contenus' && item('/dashboard/medias', 'Médiathèque')}{g === 'Ventes' && item('/dashboard/rapports', 'Rapports')}{g === 'Réglages' && item('/dashboard/parametres', 'Paramètres du site')}</div>)}
      <div className="adm-user"><b>{user.name || user.email}</b><span>Rôle : {user.role}</span><a href="/" target="_blank" rel="noreferrer">Voir le site ↗</a><form method="post" action="/api/auth/logout"><button className="adm-out">Déconnexion</button></form></div></aside>
    <div className="adm-main"><header className="adm-top"><button className="adm-burger" onClick={() => setOpen(!open)} aria-label="Menu">☰</button><h1>{title}</h1><div className="adm-act">{actions}</div></header><div className="adm-body">{children}</div></div></div>);
}
export const Csrf = ({ user, back }) => (<><input type="hidden" name="csrf" value={user.csrf} />{back && <input type="hidden" name="back" value={back} />}</>);
export const money = (n) => new Intl.NumberFormat('fr-FR').format(n || 0) + ' FCFA';
export const day = (d) => (d ? String(d).slice(0, 10).split('-').reverse().join('/') : '—');
