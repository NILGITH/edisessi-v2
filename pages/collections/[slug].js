import Link from 'next/link'; import Layout from '../../components/Layout'; import { Grid } from '../../components/ProductCard'; import { T } from '../../lib/i18n'; import { L } from '../../lib/util';
export async function getServerSideProps(ctx) {
  const { one, plain } = require('../../lib/db'); const { common, listProducts } = require('../../lib/shop');
  const c = await one("select * from collections where slug=$1 and status='active'", [ctx.params.slug]); if (!c) return { notFound: true };
  return { props: plain({ common: await common(ctx), c, items: await listProducts({ collection: c.slug }) }) };
}
// Page collection : le récit en haut, toutes les pièces achetables en dessous.
export default function Col({ common, c, items }) { const { lang } = common; const t = T[lang];
  return (<Layout common={common} title={L(c, 'name', lang)} description={L(c, 'description', lang)} image={c.image}>
    <section className="story" style={{ backgroundImage: `linear-gradient(rgba(10,10,10,.55),rgba(10,10,10,.75)),url(${c.image})` }}><div className="wrap"><span className="kick">{t.collection}</span><h1>{L(c, 'name', lang)}</h1>{(L(c, 'story', lang) || L(c, 'description', lang)).split('\n').map((x, i) => <p key={i}>{x}</p>)}<a href="#pieces" className="btn gold">{t.see_pieces} ↓</a></div></section>
    <div className="wrap page" id="pieces"><h2>{t.see_pieces} ({items.length})</h2>{items.length ? <Grid items={items} common={common} /> : <p className="empty">{t.none} <Link href="/boutique" className="lnk">{t.shop} →</Link></p>}</div></Layout>); }
