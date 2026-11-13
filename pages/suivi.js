import { useState } from 'react'; import Layout from '../components/Layout'; import { T } from '../lib/i18n'; import { fmt } from '../lib/util';
export async function getServerSideProps(ctx) { const { plain } = require('../lib/db'); const { common } = require('../lib/shop'); return { props: plain({ common: await common(ctx) }) }; }
const STEPS = ['en_attente_paiement', 'payee', 'en_preparation', 'expediee', 'livree'];
export default function Track({ common }) { const { lang } = common; const t = T[lang]; const [o, setO] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => { e.preventDefault(); setBusy(true); setErr(''); setO(null); const f = Object.fromEntries(new FormData(e.target));
    const r = await fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }); const d = await r.json().catch(() => ({}));
    if (r.ok) setO(d.order); else setErr(r.status === 429 ? d.error : t.not_found); setBusy(false); };
  return (<Layout common={common} title={t.track}><div className="wrap page narrow"><h1>{t.track}</h1><p className="lead">{t.track_intro}</p>
    <form className="form box" onSubmit={submit}><div className="two"><input name="n" placeholder={t.order_no + ' (ES…)'} required autoComplete="off" /><input name="tel" type="tel" placeholder={t.phone} required /></div><button className="btn gold" disabled={busy}>{t.track_btn}</button></form>
    {err && <p className="err">{err}</p>}
    {o && (<div className="box"><h2>{o.number} · {fmt(o.total)}</h2>{o.status === 'annulee' ? <p className="st annulee">{t.st_annulee}</p> : <ol className="steps">{STEPS.map((x, i) => <li key={x} className={STEPS.indexOf(o.status) >= i ? 'on' : ''}>{t['st_' + x]}</li>)}</ol>}{o.zone_name && <p className="mut">{t.shipping} : {o.zone_name}</p>}{o.tracking_note && <p className="note">{o.tracking_note}</p>}</div>)}
  </div></Layout>); }
