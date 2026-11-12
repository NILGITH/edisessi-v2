import Link from 'next/link'; import Layout from '../../components/Layout'; import { Grid } from '../../components/ProductCard'; import { T } from '../../lib/i18n'; import { L, youtubeId } from '../../lib/util';
export async function getServerSideProps(ctx) {
  const { one, plain } = require('../../lib/db'); const { common, listProducts } = require('../../lib/shop');
  const p = await one('select * from posts where slug=$1 and published=true', [ctx.params.slug]); if (!p) return { notFound: true };
  return { props: plain({ common: await common(ctx), p, news: await listProducts({ limit: 4 }) }) };
}
export default function Post({ common, p, news }) { const { lang } = common; const t = T[lang]; const yt = youtubeId(p.video_url);
  return (<Layout common={common} title={L(p, 'title', lang)} description={L(p, 'excerpt', lang)} image={p.image}><div className="wrap page narrow"><nav className="crumb"><Link href="/coulisses">{t.backstage}</Link> / <span>{L(p, 'title', lang)}</span></nav>
    <h1>{L(p, 'title', lang)}</h1><p className="lead">{L(p, 'excerpt', lang)}</p>{p.image && <img className="wide" src={p.image} alt="" />}
    {L(p, 'body', lang).split('\n').map((x, i) => <p key={i}>{x}</p>)}
    {yt && <div className="video"><iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title={L(p, 'title', lang)} allowFullScreen /></div>}</div>
    <div className="wrap page"><section className="sub"><h2>{t.sort_new}</h2><Grid items={news} common={common} /></section></div></Layout>); }
