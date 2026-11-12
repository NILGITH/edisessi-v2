import Link from 'next/link'; import { useEffect, useState } from 'react';
import Layout from '../components/Layout'; import { Grid } from '../components/ProductCard'; import { useStore } from '../components/store'; import { T } from '../lib/i18n'; import { L, fmt, alt } from '../lib/util';
export async function getServerSideProps(ctx) { const { plain } = require('../lib/db'); const { common } = require('../lib/shop'); return { props: plain({ common: await common(ctx) }) }; }
export function useCart(extra = {}) { const { cart, ready } = useStore(); const [data, setData] = useState(null); const key = JSON.stringify([cart, extra]);
  useEffect(() => { if (!ready) return; let on = true; fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart, ...extra }) }).then((r) => r.json()).then((d) => on && setData(d)); return () => { on = false; }; }, [key, ready]); return data; }
export function Totals({ data, lang, s, country }) { const t = T[lang]; return (<div className="totals">
  <div><span>{t.subtotal}</span><b>{fmt(data.subtotal)}</b></div>
  {data.bundles.map((b, i) => <div key={i} className="save"><span>{t.bundle} · {L(b, 'name', lang)}</span><b>− {fmt(b.saving)}</b></div>)}
  {data.promoDiscount > 0 && <div className="save"><span>{t.promo}</span><b>− {fmt(data.promoDiscount)}</b></div>}
  <div><span>{t.shipping}{data.zone ? ` · ${L(data.zone, 'name', lang)} (${L(data.zone, 'delay', lang)})` : ''}</span><b>{country && data.zone ? fmt(data.shipping) : <small>{t.shipping_choose}</small>}</b></div>
  <div className="tot"><span>{t.total}</span><b>{fmt(data.total)}<small>{alt(data.total, s)}</small></b></div></div>); }
export default function Cart({ common }) { const { lang, s } = common; const t = T[lang]; const { setQty, remove } = useStore(); const data = useCart();
  return (<Layout common={common} title={t.cart}><div className="wrap page"><h1>{t.cart}</h1>
    {!data ? <p className="mut">…</p> : !data.lines.length ? <p className="empty">{t.empty_cart} <Link href="/boutique" className="lnk">{t.shop} →</Link></p> : (
      <div className="cartg"><div>
        {data.lines.map((l) => (<div key={l.id + l.size} className="line"><Link href={'/boutique/' + l.slug}><img src={l.image} alt="" /></Link><div className="grow"><Link href={'/boutique/' + l.slug}><b>{L(l, 'name', lang)}</b></Link>{l.size && <p className="mut">{t.size} : {l.size}</p>}<p className="gold-t">{fmt(l.price)}</p></div>
          <div className="qty"><button onClick={() => setQty(l.id, l.size, l.qty - 1)}>−</button><span>{l.qty}</span><button onClick={() => setQty(l.id, l.size, l.qty + 1)}>+</button></div><button className="ic" onClick={() => remove(l.id, l.size)} aria-label="Retirer">✕</button></div>))}
        {data.suggestions.length > 0 && <section className="sub"><h2>{t.often}</h2><Grid items={data.suggestions} common={common} /></section>}
      </div>
      <aside className="box sticky"><Totals data={data} lang={lang} s={s} /><Link href="/commande" className="btn gold lg full">{t.checkout}</Link>
        <ul className="reass"><li>🚚 {lang === 'fr' ? 'Livraison Bénin et international' : 'Delivery in Benin and worldwide'}</li><li>🔒 Mobile Money · Visa · Mastercard</li></ul></aside></div>)}
  </div></Layout>); }
