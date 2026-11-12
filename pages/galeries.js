import Link from 'next/link'; import { useState } from 'react'; import Layout from '../components/Layout'; import { T } from '../lib/i18n'; import { L, fmt } from '../lib/util';
export async function getServerSideProps(ctx) {
  const { q, plain } = require('../lib/db'); const { common, listProducts } = require('../lib/shop');
  const looks = await q('select * from looks where published=true order by position,id'); const ids = [...new Set(looks.flatMap((l) => l.products || []))];
  return { props: plain({ common: await common(ctx), looks, prods: ids.length ? await listProducts({ ids }) : [] }) };
}
// Galerie « looks à acheter » : chaque photo renvoie aux pièces portées.
export default function Gallery({ common, looks, prods }) { const { lang } = common; const t = T[lang]; const [k, setK] = useState('');
  const kinds = [['', t.all], ['femme', t.women], ['homme', t.men], ['defile', lang === 'fr' ? 'Nos défilés' : 'Our shows'], ['autre', lang === 'fr' ? 'Autres' : 'Other']];
  return (<Layout common={common} title={t.looks} description={lang === 'fr' ? 'Galerie EDI SESSI : les looks à acheter, pièce par pièce.' : 'EDI SESSI gallery: shop the looks, piece by piece.'}><div className="wrap page"><h1>{lang === 'fr' ? 'Galerie · Looks à acheter' : 'Gallery · Shop the looks'}</h1>
    <div className="row">{kinds.map(([v, l]) => <button key={v} className={'chip' + (k === v ? ' dark' : '')} onClick={() => setK(v)}>{l}</button>)}</div>
    <div className="looks big">{looks.filter((l) => !k || l.kind === k).map((l) => { const ps = (l.products || []).map((i) => prods.find((p) => p.id === i)).filter(Boolean); return (<div key={l.id} className="look"><img src={l.image} alt={L(l, 'title', lang)} loading="lazy" />{ps.length > 0 && <div className="look-p"><small>{t.pieces_worn}</small>{ps.map((p) => <Link key={p.id} href={'/boutique/' + p.slug}>{L(p, 'name', lang)} · {fmt(p.price)} →</Link>)}</div>}</div>); })}</div></div></Layout>); }
