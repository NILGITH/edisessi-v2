import Link from 'next/link'; import { useRouter } from 'next/router'; import { useState } from 'react';
import Layout from '../../components/Layout'; import { useStore } from '../../components/store'; import { useCart, Totals } from '../panier'; import { T, COUNTRIES } from '../../lib/i18n'; import { L, lines, fmt } from '../../lib/util';
export async function getServerSideProps(ctx) { const { plain } = require('../../lib/db'); const { common } = require('../../lib/shop'); return { props: plain({ common: await common(ctx) }) }; }
export default function Checkout({ common }) {
  const { lang, s } = common; const t = T[lang]; const router = useRouter(); const { cart, clear } = useStore();
  const [country, setCountry] = useState('BJ'); const [promo, setPromo] = useState(''); const [code, setCode] = useState(''); const [pay, setPay] = useState('momo'); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const data = useCart({ country, promo });
  const names = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames([lang], { type: 'region' }) : null;
  const pays = lines(s.payments).filter((p) => p[0] !== 'cod' || country === 'BJ');
  const submit = async (e) => { e.preventDefault(); setBusy(true); setErr('');
    const f = Object.fromEntries(new FormData(e.target));
    const r = await fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, items: cart, country, promo, payment: pays.find((p) => p[0] === pay) ? pay : pays[0][0], lang }) });
    const d = await r.json(); if (!r.ok) { setErr(d.error || 'Erreur'); setBusy(false); return; }
    if (window.dataLayer) window.dataLayer.push({ event: 'purchase_started', value: data.total, currency: 'XOF' });
    clear(); router.push('/commande/' + d.number); };
  return (<Layout common={common} title={t.order}><div className="wrap page"><h1>{t.order}</h1>
    {!data ? <p className="mut">…</p> : !data.lines.length ? <p className="empty">{t.empty_cart} <Link href="/boutique" className="lnk">{t.shop} →</Link></p> : (
      <form className="cartg" onSubmit={submit}><div className="form">
        <h2>1. {t.your_details}</h2>
        <div className="two"><label>{t.last_name} *<input name="last_name" required autoComplete="family-name" /></label><label>{t.first_name}<input name="first_name" autoComplete="given-name" /></label></div>
        <div className="two"><label>{t.phone} *<input name="phone" type="tel" required minLength="8" autoComplete="tel" placeholder="+229 …" /></label><label>{t.email}<input name="email" type="email" autoComplete="email" /></label></div>
        <h2>2. {t.delivery}</h2>
        <label>{t.country} *<select value={country} onChange={(e) => setCountry(e.target.value)}>{COUNTRIES.map((c) => <option key={c} value={c}>{names ? names.of(c) : c}</option>)}<option value="ZZ">{lang === 'fr' ? 'Autre pays' : 'Other country'}</option></select></label>
        {data.zone && <p className="note">🚚 <b>{L(data.zone, 'name', lang)}</b> · {fmt(data.zone.fee)} · {L(data.zone, 'delay', lang)}</p>}
        <div className="two"><label>{t.address}<input name="address" autoComplete="street-address" /></label><label>{t.city}<input name="city" autoComplete="address-level2" /></label></div>
        <label>{t.measures_opt}<textarea name="measurements" rows="2" /></label><label>{t.notes}<textarea name="notes" rows="2" /></label>
        <h2>3. {t.payment}</h2>
        <div className="pays">{pays.map((p) => <label key={p[0]} className={'payo' + (pay === p[0] ? ' on' : '')}><input type="radio" name="pm" checked={pay === p[0]} onChange={() => setPay(p[0])} /> {lang === 'en' && p[2] ? p[2] : p[1]}</label>)}</div>
      </div>
      <aside className="box sticky"><h3>{data.lines.reduce((a, l) => a + l.qty, 0)} {t.results}</h3>
        {data.lines.map((l) => <div key={l.id + l.size} className="mline"><img src={l.image} alt="" /><span>{L(l, 'name', lang)}{l.size ? ` · ${l.size}` : ''} × {l.qty}</span><b>{fmt(l.total)}</b></div>)}
        <div className="promo"><input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t.promo} /><button type="button" className="btn ghost sm" onClick={() => setPromo(code.trim())}>{t.apply}</button></div>
        {promo && data.promoOk === false && <p className="err">{t.promo_bad}</p>}
        <Totals data={data} lang={lang} s={s} country={country} />
        {err && <p className="err">{err}</p>}
        <button className="btn gold lg full" disabled={busy}>{pay === 'cod' ? t.confirm : t.pay} · {fmt(data.total)}</button>
      </aside></form>)}
  </div></Layout>);
}
