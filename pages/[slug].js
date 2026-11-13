import Link from 'next/link'; import { useState } from 'react'; import Layout from '../components/Layout'; import { T } from '../lib/i18n'; import { L, lines, safeHref } from '../lib/util';
// Pages de contenu gérées depuis le dashboard (Notre Histoire, Contact, Livraison, Guide des tailles, pages libres…).
export async function getServerSideProps(ctx) {
  const { q, one, plain } = require('../lib/db'); const { common } = require('../lib/shop');
  const page = await one('select * from pages where slug=$1 and published=true and is_system=false', [ctx.params.slug]); if (!page) return { notFound: true };
  return { props: plain({ common: await common(ctx), page, blocks: await q('select * from blocks where page_id=$1 and visible=true order by position,id', [page.id]),
    zones: page.slug === 'livraison' ? await q('select name_fr,name_en,fee,delay_fr,delay_en from zones order by position,id') : [] }) };
}
export function ContactForm({ lang, kind = 'contact' }) { const t = T[lang]; const [sent, setSent] = useState(false);
  const submit = async (e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, kind }) }); if (r.ok) setSent(true); };
  if (sent) return <p className="ok">{t.sent}</p>;
  return (<form className="form box" onSubmit={submit}><div className="two"><input name="first_name" placeholder={t.first_name} /><input name="name" placeholder={t.last_name + ' *'} required /></div><div className="two"><input name="phone" placeholder={t.phone + ' *'} required /><input name="email" type="email" placeholder={t.email} /></div>
    {kind === 'rdv' && <label>{t.date_wanted}<input name="date" type="date" /></label>}<textarea name="message" rows="4" placeholder={t.message} /><button className="btn gold">{t.send}</button></form>); }
export default function Page({ common, page, blocks, zones }) { const { lang, s } = common; const t = T[lang]; const guide = lines(s.size_guide);
  return (<Layout common={common} title={L(page, 'title', lang)} description={L(page, 'meta', lang) || L(page, 'intro', lang)} image={page.image}>
    {page.image && <section className="story sm" style={{ backgroundImage: `linear-gradient(rgba(10,10,10,.5),rgba(10,10,10,.7)),url(${page.image})` }}><div className="wrap"><h1>{L(page, 'title', lang)}</h1><p>{L(page, 'intro', lang)}</p></div></section>}
    <div className="wrap page narrow">{!page.image && <><h1>{L(page, 'title', lang)}</h1><p className="lead">{L(page, 'intro', lang)}</p></>}
      {L(page, 'body', lang).split('\n').filter(Boolean).map((x, i) => <p key={i}>{x}</p>)}
      {page.slug === 'guide-des-tailles' && guide.length > 1 && <table className="tbl"><thead><tr>{guide[0].map((h, i) => <th key={i}>{h}</th>)}</tr></thead><tbody>{guide.slice(1).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>}
      {zones.length > 0 && <table className="tbl"><thead><tr><th>Zone</th><th>{t.shipping}</th><th>{lang === 'fr' ? 'Délai' : 'Delivery time'}</th></tr></thead><tbody>{zones.map((z, i) => <tr key={i}><td>{L(z, 'name', lang)}</td><td>{z.fee.toLocaleString('fr-FR')} FCFA</td><td>{L(z, 'delay', lang)}</td></tr>)}</tbody></table>}
      {page.slug === 'contact' && (<div className="two top"><div className="box"><p><b>{s.address}</b></p><p>WhatsApp : <a className="lnk" href={`https://wa.me/${(s.whatsapp || '').replace(/\D/g, '')}`}>{s.phone}</a></p><p><a className="lnk" href={`mailto:${s.email}`}>{s.email}</a></p><p>{s['hours_' + lang] || s.hours_fr}</p><Link href="/rendez-vous" className="btn dark">{t.appointment}</Link></div><ContactForm lang={lang} /></div>)}
    </div>
    {blocks.map((b, i) => (<section className={'sec' + (i % 2 ? ' alt' : '')} key={b.id}><div className={'wrap' + (b.image ? ' split' + (i % 2 ? ' rev' : '') : ' narrow')}>{b.image && <img src={b.image} alt="" loading="lazy" />}<div><h2>{L(b, 'title', lang)}</h2>{L(b, 'text', lang).split('\n').map((x, j) => <p key={j}>{x}</p>)}{(b.images || []).length > 0 && <div className="gal">{b.images.map((u) => <img key={u} src={u} alt="" loading="lazy" />)}</div>}{b.cta_url && L(b, 'cta', lang) && <Link href={safeHref(b.cta_url)} className="btn ghost">{L(b, 'cta', lang)}</Link>}</div></div></section>))}
  </Layout>); }
