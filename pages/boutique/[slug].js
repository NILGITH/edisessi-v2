import Link from 'next/link'; import Head from 'next/head'; import { useEffect, useState } from 'react';
import Layout, { Icon } from '../../components/Layout'; import { Grid, Price } from '../../components/ProductCard'; import { useStore } from '../../components/store';
import { T } from '../../lib/i18n'; import { L, lines, youtubeId, fmt } from '../../lib/util';

export async function getServerSideProps(ctx) {
  const { q, one, plain } = require('../../lib/db'); const { common, listProducts, CARD, LIVE } = require('../../lib/shop');
  const p = await one('select * from products where slug=$1 and archived=false', [ctx.params.slug]);
  if (!p) return { notFound: true };
  const rel = (p.related || []).length ? await listProducts({ ids: p.related }) : [];
  const same = p.fabric_id ? plain(await q(`select ${CARD} from products p where ${LIVE} and p.fabric_id=$1 and p.id<>$2 and not (p.id = any($3::int[])) order by p.id desc limit 4`, [p.fabric_id, p.id, p.related || []])) : [];
  let comp = rel;
  if (!comp.length && p.collection_id) comp = plain(await q(`select ${CARD} from products p where ${LIVE} and p.collection_id=$1 and p.id<>$2 and coalesce(p.category_id,0)<>$3 order by p.id desc limit 4`, [p.collection_id, p.id, p.category_id || 0]));
  return { props: plain({ common: await common(ctx), p, comp, same: same.filter((x) => !comp.find((c) => c.id === x.id)),
    col: p.collection_id ? await one('select slug,name_fr,name_en from collections where id=$1', [p.collection_id]) : null,
    fab: p.fabric_id ? await one('select slug,name_fr,name_en from fabrics where id=$1', [p.fabric_id]) : null,
    cat: p.category_id ? await one('select name_fr,name_en from categories where id=$1', [p.category_id]) : null }) };
}

export default function Product({ common, p, comp, same, col, fab, cat }) {
  const { lang, s } = common; const t = T[lang]; const { add, fav, toggleFav, seen, recent } = useStore();
  const sizes = (p.sizes || '').split(/[,;]/).map((x) => x.trim()).filter(Boolean);
  const [img, setImg] = useState(0); const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : ''); const [qty, setQty] = useState(1);
  const [err, setErr] = useState(false); const [panel, setPanel] = useState(null); const [sent, setSent] = useState(false); const [rec, setRec] = useState([]);
  const name = L(p, 'name', lang), desc = L(p, 'description', lang), imgs = p.images || [], yt = youtubeId(p.video_url);
  useEffect(() => { seen(p.id); setImg(0); setSize(sizes.length === 1 ? sizes[0] : ''); setPanel(null); setSent(false); }, [p.id]);
  useEffect(() => { const ids = recent.filter((i) => i !== p.id).slice(0, 4); if (!ids.length) return setRec([]); fetch('/api/products?ids=' + ids.join(',')).then((r) => r.json()).then((d) => setRec(d.items || [])); }, [recent.join(','), p.id]);
  const doAdd = () => { if (sizes.length && !size) return setErr(true); setErr(false); add(p, size, qty); };
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const sendMeasures = async (e) => { e.preventDefault(); const f = new FormData(e.target); await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: f.get('kind'), name: f.get('name'), phone: f.get('phone'), message: f.get('message'), product: p.name_fr }) }); setSent(true); };
  const guide = lines(s.size_guide);
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name, description: desc, image: imgs, brand: { '@type': 'Brand', name: 'EDI SESSI' }, offers: { '@type': 'Offer', price: p.price, priceCurrency: 'XOF', availability: p.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } };
  return (
    <Layout common={common} title={name} description={(desc || name).slice(0, 160)} image={imgs[0]}>
      <Head><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} /></Head>
      <div className="wrap page">
        <nav className="crumb"><Link href="/boutique">{t.shop}</Link>{col && <> / <Link href={`/boutique?collection=${col.slug}`}>{L(col, 'name', lang)}</Link></>} / <span>{name}</span></nav>
        <div className="pd">
          <div className="pd-g">
            <div className="pd-main">{img === 'v' && yt ? <iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title={name} allowFullScreen /> : imgs[img] ? <img src={imgs[img]} alt={name} /> : <div className="ph" />}</div>
            {(imgs.length > 1 || yt) && <div className="thumbs">{imgs.map((u, i) => <button key={i} className={img === i ? 'on' : ''} onClick={() => setImg(i)}><img src={u} alt="" loading="lazy" /></button>)}{yt && <button className={img === 'v' ? 'on' : ''} onClick={() => setImg('v')}><span>▶ {t.video}</span></button>}</div>}
          </div>
          <div className="pd-i">
            {p.is_new && <span className="tag st">{t.new}</span>}
            <h1>{name}</h1>{cat && <p className="mut">{L(cat, 'name', lang)}</p>}
            <Price n={p.price} s={s} big /><p className="mut xs">{t.indicative}</p>
            {desc && <p className="desc">{desc}</p>}
            <div className="links">{col && <Link href={`/collections/${col.slug}`}>{t.collection} : <b>{L(col, 'name', lang)}</b> →</Link>}{fab && <Link href={`/matieres/${fab.slug}`}>{t.fabric} : <b>{L(fab, 'name', lang)}</b> →</Link>}</div>
            {sizes.length > 0 && (<div><div className="row sb"><label>{t.size}</label><button className="lnk" onClick={() => setPanel(panel === 'guide' ? null : 'guide')}>{t.size_guide}</button></div>
              <div className="sizes lg">{sizes.map((z) => <button key={z} className={size === z ? 'on' : ''} onClick={() => { setSize(z); setErr(false); }}>{z}</button>)}</div>{err && <p className="err">{t.choose_size}</p>}</div>)}
            {panel === 'guide' && guide.length > 1 && <table className="tbl">{<thead><tr>{guide[0].map((h, i) => <th key={i}>{h}</th>)}</tr></thead>}<tbody>{guide.slice(1).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>}
            <div className="row"><div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(qty + 1)}>+</button></div>
              {p.in_stock ? <button className="btn gold lg grow" onClick={doAdd}><Icon n="cart" /> {t.add}</button> : <span className="btn lg grow off">{t.sold_out}</span>}
              <button className={'ic bd' + (fav.includes(p.id) ? ' on' : '')} onClick={() => toggleFav(p.id)} aria-label={t.favorites}><Icon n="heart" /></button></div>
            <div className="row"><button className="btn ghost grow" onClick={() => setPanel(panel === 'custom' ? null : 'custom')}>{t.custom}</button><button className="btn ghost grow" onClick={() => setPanel(panel === 'measures' ? null : 'measures')}>{t.send_measures}</button></div>
            {(panel === 'custom' || panel === 'measures') && (sent ? <p className="ok">{t.sent}</p> : (
              <form className="form box" onSubmit={sendMeasures}><input type="hidden" name="kind" value={panel === 'custom' ? 'sur-mesure' : 'mesures'} />
                <input name="name" placeholder={t.last_name} required /><input name="phone" placeholder={t.phone} required />
                <textarea name="message" rows="3" placeholder={panel === 'custom' ? t.message : t.measures_opt} required /><button className="btn dark">{t.send}</button></form>))}
            <ul className="reass"><li>🚚 {lang === 'fr' ? 'Livraison au Bénin et à l’international, frais affichés avant de payer' : 'Delivery in Benin and worldwide, fees shown before you pay'}</li><li>🔒 {lang === 'fr' ? 'Mobile Money et carte bancaire' : 'Mobile Money and bank card'}</li></ul>
            <a className="lnk" href={`https://wa.me/?text=${encodeURIComponent(name + ' · ' + fmt(p.price) + ' ' + url)}`} target="_blank" rel="noopener noreferrer">{t.share}</a>
          </div>
        </div>
        {comp.length > 0 && <section className="sub"><h2>{t.complete}</h2><Grid items={comp} common={common} /></section>}
        {same.length > 0 && <section className="sub"><h2>{t.same_fabric}</h2><Grid items={same} common={common} /></section>}
        {rec.length > 0 && <section className="sub"><h2>{t.recent}</h2><Grid items={rec} common={common} /></section>}
      </div>
    </Layout>
  );
}
