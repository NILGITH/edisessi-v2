import Layout from '../../components/Layout'; import { Grid } from '../../components/ProductCard'; import { T } from '../../lib/i18n'; import { L } from '../../lib/util';
export async function getServerSideProps(ctx) {
  const { one, plain } = require('../../lib/db'); const { common, listProducts } = require('../../lib/shop');
  const f = await one('select * from fabrics where slug=$1 and published=true', [ctx.params.slug]); if (!f) return { notFound: true };
  return { props: plain({ common: await common(ctx), f, items: await listProducts({ fabric: f.slug }) }) };
}
export default function Fabric({ common, f, items }) { const { lang } = common; const t = T[lang];
  return (<Layout common={common} title={L(f, 'name', lang)} description={L(f, 'description', lang)} image={f.image}>
    <div className="wrap page"><div className="split">{f.image && <img src={f.image} alt="" />}<div><span className="kick">{t.fabric}</span><h1>{L(f, 'name', lang)}</h1><p>{L(f, 'description', lang)}</p><ul className="feat">{L(f, 'features', lang).split('\n').filter(Boolean).map((x, i) => <li key={i}>{x}</li>)}</ul></div></div>
      <section className="sub"><h2>{t.see_pieces} ({items.length})</h2>{items.length ? <Grid items={items} common={common} /> : <p className="empty">{t.none}</p>}</section></div></Layout>); }
