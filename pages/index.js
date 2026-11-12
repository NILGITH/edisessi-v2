import Link from 'next/link';
import Layout from '../components/Layout'; import { Grid } from '../components/ProductCard';
import { T } from '../lib/i18n'; import { L, lines, youtubeId } from '../lib/util';

export async function getServerSideProps(ctx) {
  const { q, one, plain } = require('../lib/db'); const { common, listProducts, CARD, LIVE } = require('../lib/shop');
  const page = await one("select * from pages where slug='accueil'");
  const blocks = await q('select * from blocks where page_id=$1 and visible=true order by position,id', [page.id]);
  let news = plain(await q(`select ${CARD} from products p where ${LIVE} and p.in_stock and p.is_new order by p.featured desc, p.created_at desc, p.id desc limit 8`));
  if (news.length < 4) news = await listProducts({ limit: 8 });
  const looks = await q('select * from looks where published=true order by position,id limit 6');
  const lp = [...new Set(looks.flatMap((l) => l.products || []))];
  return { props: plain({ common: await common(ctx), page, blocks, news,
    collections: await q("select * from collections where status='active' order by position,id"),
    fabrics: await q('select * from fabrics where published=true order by position,id'),
    looks, lookProducts: lp.length ? await listProducts({ ids: lp }) : [],
    avis: await q('select * from testimonials where published=true order by id desc limit 6'),
    partners: await q('select * from partners where published=true order by position,id'),
    videos: await q("select slug,title_fr,title_en,video_url from posts where published=true and coalesce(video_url,'')<>'' order by created_at desc limit 3") }) };
}

export default function Home(props) {
  const { common, page, blocks, news, collections, fabrics, looks, lookProducts, avis, partners, videos } = props;
  const { lang, s } = common; const t = T[lang]; const newCol = collections.find((c) => c.is_new) || collections[0];
  const Head2 = ({ b, kicker }) => (<div className="sec-h">{kicker && <span className="kick">{kicker}</span>}<h2>{L(b, 'title', lang)}</h2>{L(b, 'text', lang) && !['facons', 'livraison'].includes(b.key) && <p>{L(b, 'text', lang).split('\n')[0]}</p>}</div>);
  const Cta = ({ b, cls = 'btn ghost' }) => (b.cta_url && L(b, 'cta', lang) ? <Link href={b.cta_url} className={cls}>{L(b, 'cta', lang)}</Link> : null);
  const R = {
    hero: (b) => (
      <section className="hero" key={b.id} style={b.image ? { backgroundImage: `linear-gradient(90deg,rgba(10,10,10,.82),rgba(10,10,10,.35)),url(${b.image})` } : null}>
        <div className="wrap hero-in">
          <div className="hero-t">
            {newCol && <Link href={`/boutique?collection=${newCol.slug}`} className="badge">✦ {lang === 'fr' ? 'Nouvelle Collection' : 'New Collection'} {new Date().getFullYear()} · {L(newCol, 'name', lang)} →</Link>}
            <h1>{L(b, 'title', lang)}</h1><p>{L(b, 'text', lang)}</p>
            <div className="row"><Cta b={b} cls="btn gold lg" /><Link href="/rendez-vous" className="btn line lg">{t.appointment}</Link></div>
            <div className="soc light">{[['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['youtube', 'YouTube']].filter(([k]) => s[k]).map(([k, l]) => <a key={k} href={s[k]} target="_blank" rel="noopener noreferrer">{l}</a>)}</div>
          </div>
          <div className="fan" aria-label={t.collections}>{collections.slice(0, 5).map((c, i, a) => <Link key={c.id} href={`/boutique?collection=${c.slug}`} style={{ '--r': `${(i - (a.length - 1) / 2) * 9}deg`, '--x': `${(i - (a.length - 1) / 2) * 62}px` }}><img src={c.image} alt={L(c, 'name', lang)} /><span>{L(c, 'name', lang)}</span></Link>)}</div>
        </div>
      </section>),
    nouveautes: (b) => (<section className="sec" key={b.id}><div className="wrap"><div className="sec-top"><Head2 b={b} /><div className="row"><Link href="/boutique?genre=femme" className="chip">{t.women}</Link><Link href="/boutique?genre=homme" className="chip">{t.men}</Link><Cta b={b} cls="chip dark" /></div></div><Grid items={news} common={common} /></div></section>),
    facons: (b) => (<section className="sec alt" key={b.id}><div className="wrap"><Head2 b={b} /><div className="three">{lines(L(b, 'text', lang)).map((l, i) => <div key={i} className="way"><h3>{l[0]}</h3><p>{l[1]}</p><b>{l[2]}</b>{l[4] && <Link href={l[4]} className="btn ghost sm">{l[3]}</Link>}</div>)}</div></div></section>),
    collections: (b) => (<section className="sec" key={b.id} id="collections"><div className="wrap"><Head2 b={b} kicker={t.collections} /><div className="cols">{collections.map((c) => <div key={c.id} className="col"><img src={c.image} alt={L(c, 'name', lang)} loading="lazy" /><div className="col-b"><h3>{L(c, 'name', lang)}</h3><p>{L(c, 'description', lang)}</p><div className="row"><Link href={`/boutique?collection=${c.slug}`} className="btn gold sm">{t.see_pieces}</Link><Link href={`/collections/${c.slug}`} className="btn line sm">{t.see_story}</Link></div></div></div>)}</div></div></section>),
    maison: (b) => (<section className="sec alt" key={b.id} id="about"><div className="wrap split">{b.image && <img src={b.image} alt="" loading="lazy" />}<div><span className="kick">{lang === 'fr' ? 'La Maison' : 'The House'}</span><h2>{L(b, 'title', lang)}</h2>{L(b, 'text', lang).split('\n').map((x, i) => <p key={i}>{x}</p>)}<div className="stats">{lines(s.stats).map((l, i) => <div key={i}><b>{l[0]}</b><span>{lang === 'en' && l[2] ? l[2] : l[1]}</span></div>)}</div><Cta b={b} /></div></div></section>),
    legacy: (b) => (<section className="sec dark" key={b.id}><div className="wrap split">{b.image && <img src={b.image} alt="" loading="lazy" />}<div><span className="kick">30 ans · 30 years</span><h2>{L(b, 'title', lang)}</h2>{L(b, 'text', lang).split('\n').map((x, i) => <p key={i}>{x}</p>)}
      {partners.length > 0 && (<><h4>{t.partners}</h4><div className="partners">{partners.map((p) => <a key={p.id} href={p.instagram || '#'} target="_blank" rel="noopener noreferrer">{p.image && <img src={p.image} alt="" loading="lazy" />}<span><b>{p.name}</b>{L(p, 'role', lang)}</span></a>)}</div></>)}
      {videos.length > 0 && (<><h4>{t.videos}</h4><div className="vids">{videos.map((v) => youtubeId(v.video_url) && <Link key={v.slug} href={'/coulisses/' + v.slug}><img src={`https://i.ytimg.com/vi/${youtubeId(v.video_url)}/hqdefault.jpg`} alt="" loading="lazy" /><span>▶ {L(v, 'title', lang)}</span></Link>)}</div></>)}
      <div className="row"><Cta b={b} cls="btn gold" />{s.gala_url && <a href={s.gala_url} className="btn red" target="_blank" rel="noopener noreferrer">{s['gala_label_' + lang] || s.gala_label_fr}</a>}</div></div></div></section>),
    matieres: (b) => (<section className="sec" key={b.id}><div className="wrap"><Head2 b={b} /><div className="three">{fabrics.map((f) => <Link key={f.id} href={`/matieres/${f.slug}`} className="fab"><img src={f.image} alt="" loading="lazy" /><h3>{L(f, 'name', lang)}</h3><p>{L(f, 'description', lang).slice(0, 150)}…</p><span className="lnk">{t.see_pieces} →</span></Link>)}</div></div></section>),
    looks: (b) => (<section className="sec alt" key={b.id}><div className="wrap"><div className="sec-top"><Head2 b={b} /><Cta b={b} cls="chip dark" /></div><div className="looks">{looks.map((l) => { const ps = (l.products || []).map((i) => lookProducts.find((p) => p.id === i)).filter(Boolean); return (<div key={l.id} className="look"><img src={l.image} alt={L(l, 'title', lang)} loading="lazy" /><div className="look-p">{ps.map((p) => <Link key={p.id} href={'/boutique/' + p.slug}>{L(p, 'name', lang)} →</Link>)}</div></div>); })}</div></div></section>),
    avis: (b) => (avis.length ? <section className="sec" key={b.id}><div className="wrap"><Head2 b={b} /><div className="three">{avis.map((a) => <blockquote key={a.id} className="avis"><div className="stars">{'★'.repeat(a.rating || 5)}</div><p>“{L(a, 'text', lang)}”</p><footer><b>{a.author}</b> {L(a, 'role', lang)}</footer></blockquote>)}</div></div></section> : null),
    livraison: (b) => (<section className="sec gold-b" key={b.id}><div className="wrap"><Head2 b={b} /><div className="four">{lines(L(b, 'text', lang)).map((l, i) => <div key={i}><h3>{l[0]}</h3><p>{l[1]}</p></div>)}</div><div className="row c"><Cta b={b} cls="btn dark" /><a className="btn line-d" href={s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}` : '/contact'} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a></div></div></section>),
  };
  const Generic = (b) => (<section className="sec" key={b.id}><div className={'wrap' + (b.image ? ' split' : '')}>{b.image && <img src={b.image} alt="" loading="lazy" />}<div><h2>{L(b, 'title', lang)}</h2>{L(b, 'text', lang).split('\n').map((x, i) => <p key={i}>{x}</p>)}<Cta b={b} /></div></div></section>);
  return <Layout common={common} title={lang === 'fr' ? 'Mode Béninoise et Africaine' : 'Beninese and African Fashion'} description={L(page, 'meta', lang)} image={blocks[0] && blocks[0].image}>{blocks.map((b) => (R[b.key] || Generic)(b))}</Layout>;
}
