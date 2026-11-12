import Link from 'next/link'; import { useEffect, useState } from 'react'; import Layout from '../components/Layout'; import { Grid } from '../components/ProductCard'; import { useStore } from '../components/store'; import { T } from '../lib/i18n';
export async function getServerSideProps(ctx) { const { plain } = require('../lib/db'); const { common } = require('../lib/shop'); return { props: plain({ common: await common(ctx) }) }; }
export default function Favs({ common }) { const t = T[common.lang]; const { fav, recent, ready } = useStore(); const [a, setA] = useState([]); const [b, setB] = useState([]);
  const get = (ids, set) => (ids.length ? fetch('/api/products?ids=' + ids.join(',')).then((r) => r.json()).then((d) => set(ids.map((i) => d.items.find((p) => p.id === i)).filter(Boolean))) : set([]));
  useEffect(() => { if (ready) { get(fav, setA); get(recent, setB); } }, [ready, fav.join(','), recent.join(',')]);
  return (<Layout common={common} title={t.favorites}><div className="wrap page"><h1>{t.favorites}</h1>{a.length ? <Grid items={a} common={common} /> : <p className="empty">{t.no_fav} <Link href="/boutique" className="lnk">{t.shop} →</Link></p>}
    {b.length > 0 && <section className="sub"><h2>{t.recent}</h2><Grid items={b} common={common} /></section>}</div></Layout>); }
