import Script from 'next/script'; import { useState } from 'react';
import Layout from '../../components/Layout'; import { Grid } from '../../components/ProductCard'; import { T } from '../../lib/i18n'; import { L, fmt } from '../../lib/util';
export async function getServerSideProps(ctx) {
  const { one, plain } = require('../../lib/db'); const { common, suggestions } = require('../../lib/shop');
  const o = await one('select number,status,items,subtotal,discount,shipping,total,payment_method,zone_name,created_at from orders where number=$1', [String(ctx.params.number).slice(0, 40)]);
  if (!o) return { notFound: true };
  const { phone, email, last_name, first_name, ...pub } = o; // la page publique n'expose ni nom, ni téléphone, ni adresse
  return { props: plain({ common: await common(ctx), o: pub, sugg: await suggestions((o.items || []).map((i) => i.id), 4) }) };
}
export default function Done({ common, o, sugg }) { const { lang, s } = common; const t = T[lang]; const [st, setSt] = useState(o.status); const [msg, setMsg] = useState('');
  const canPay = st === 'en_attente_paiement' && o.payment_method !== 'cod' && s.kkiapay_public_key;
  const payNow = () => { if (!window.openKkiapayWidget) return;
    window.addSuccessListener(async (r) => { const x = await fetch('/api/payment/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ number: o.number, transactionId: r.transactionId }) }); if (x.ok) { setSt('payee'); if (window.dataLayer) window.dataLayer.push({ event: 'purchase', transaction_id: o.number, value: o.total, currency: 'XOF' }); } else setMsg((await x.json()).error); });
    window.openKkiapayWidget({ amount: o.total, key: s.kkiapay_public_key, sandbox: s.kkiapay_sandbox === '1', reason: 'EDI SESSI ' + o.number }); };
  return (<Layout common={common} title={t.order + ' ' + o.number}>{canPay && <Script src="https://cdn.kkiapay.me/k.js" strategy="afterInteractive" />}
    <div className="wrap page narrow"><h1>{t.thanks}</h1><p className="lead">{t.order_no} : <b>{o.number}</b> · <span className={'st ' + st}>{t['st_' + st] || st}</span></p>
      <div className="box">{(o.items || []).map((l, i) => <div key={i} className="mline"><img src={l.image} alt="" /><span>{L(l, 'name', lang)}{l.size ? ` · ${l.size}` : ''} × {l.qty}</span><b>{fmt(l.total)}</b></div>)}
        <div className="totals"><div><span>{t.subtotal}</span><b>{fmt(o.subtotal)}</b></div>{o.discount > 0 && <div className="save"><span>{lang === 'fr' ? 'Réductions' : 'Discounts'}</span><b>− {fmt(o.discount)}</b></div>}<div><span>{t.shipping}{o.zone_name ? ' · ' + o.zone_name : ''}</span><b>{fmt(o.shipping)}</b></div><div className="tot"><span>{t.total}</span><b>{fmt(o.total)}</b></div></div>
        {canPay ? <button className="btn gold lg full" onClick={payNow}>{t.pay_now} · {fmt(o.total)}</button> : st === 'en_attente_paiement' && o.payment_method !== 'cod' ? <p className="note">{t.pay_later}</p> : null}
        {msg && <p className="err">{msg}</p>}<p className="mut xs">{lang === 'fr' ? 'Conservez ce numéro : il permet de suivre la commande depuis la page « Suivre ma commande ».' : 'Keep this number: it lets you track the order from the “Track my order” page.'}</p></div>
      {sugg.length > 0 && <section className="sub"><h2>{t.you_may_like}</h2><Grid items={sugg} common={common} /></section>}</div></Layout>); }
