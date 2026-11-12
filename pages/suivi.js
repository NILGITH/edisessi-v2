import Layout from '../components/Layout'; import { T } from '../lib/i18n'; import { fmt } from '../lib/util';
export async function getServerSideProps(ctx) {
  const { one, plain } = require('../lib/db'); const { common } = require('../lib/shop'); let o = null, tried = false;
  const { n, tel } = ctx.query;
  if (n && tel) { tried = true; const digits = String(tel).replace(/\D/g, '').slice(-8);
    const r = await one('select number,status,total,zone_name,tracking_note,created_at,phone from orders where upper(number)=upper($1)', [String(n).trim()]);
    if (r && digits.length >= 8 && String(r.phone).replace(/\D/g, '').endsWith(digits)) { delete r.phone; o = r; } }
  return { props: plain({ common: await common(ctx), o, tried }) };
}
const STEPS = ['en_attente_paiement', 'payee', 'en_preparation', 'expediee', 'livree'];
export default function Track({ common, o, tried }) { const { lang } = common; const t = T[lang];
  return (<Layout common={common} title={t.track}><div className="wrap page narrow"><h1>{t.track}</h1><p className="lead">{t.track_intro}</p>
    <form className="form box" method="get"><div className="two"><input name="n" placeholder={t.order_no + ' (ES…)'} required /><input name="tel" type="tel" placeholder={t.phone} required /></div><button className="btn gold">{t.track_btn}</button></form>
    {tried && !o && <p className="err">{t.not_found}</p>}
    {o && (<div className="box"><h2>{o.number} · {fmt(o.total)}</h2>{o.status === 'annulee' ? <p className="st annulee">{t.st_annulee}</p> : <ol className="steps">{STEPS.map((x, i) => <li key={x} className={STEPS.indexOf(o.status) >= i ? 'on' : ''}>{t['st_' + x]}</li>)}</ol>}{o.zone_name && <p className="mut">{t.shipping} : {o.zone_name}</p>}{o.tracking_note && <p className="note">{o.tracking_note}</p>}</div>)}
  </div></Layout>); }
