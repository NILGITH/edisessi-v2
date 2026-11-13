import Head from 'next/head'; import { useState, useRef, useEffect } from 'react'; import Layout from '../components/Layout'; import { fmt } from '../lib/util';
// Page de proposition (hors menu, non indexée) : police, modes jour/nuit, chatbot, calendrier de rendez-vous par pays.
export async function getServerSideProps(ctx) { const { plain } = require('../lib/db'); const { common, listProducts } = require('../lib/shop'); return { props: plain({ common: await common(ctx), items: await listProducts({ limit: 3 }) }) }; }

const FONTS = [
  { id: 'a', name: 'Cormorant Garamond + Jost', tag: 'Recommandée · esprit maison de couture', t: '"Cormorant Garamond",serif', b: 'Jost,sans-serif', w: 600, ls: '0' },
  { id: 'b', name: 'Playfair Display + DM Sans', tag: 'Éditorial, plus affirmé', t: '"Playfair Display",serif', b: '"DM Sans",sans-serif', w: 600, ls: '-.01em' },
  { id: 'c', name: 'Bodoni Moda + Manrope', tag: 'Magazine de mode, très contrasté', t: '"Bodoni Moda",serif', b: 'Manrope,sans-serif', w: 600, ls: '-.01em' },
  { id: 'z', name: 'Geist (actuelle)', tag: 'Moderne, mais peu « luxe »', t: 'Geist,sans-serif', b: 'Geist,sans-serif', w: 700, ls: '-.01em' },
];
// Réponses automatiques du chatbot (dans la version finale : gérées dans le dashboard, en français et en anglais)
const FAQ = [
  { k: ['livraison', 'livrer', 'délai', 'frais', 'expédi'], q: 'Livraison et délais', a: 'Nous livrons au Bénin (24 à 72 h) et à l’international (7 à 12 jours ouvrés selon la zone). Les frais exacts s’affichent dans le panier dès que vous choisissez votre pays.' },
  { k: ['taille', 'mesure', 'guide'], q: 'Choisir ma taille', a: 'Chaque page produit a un guide des tailles. Entre deux tailles ? Envoyez-nous vos mesures depuis la page produit, nous vous conseillons avant l’expédition.' },
  { k: ['paiement', 'payer', 'carte', 'mobile money', 'momo'], q: 'Moyens de paiement', a: 'Vous pouvez payer par Mobile Money (MTN, Moov, Celtiis) ou par carte bancaire internationale (Visa, Mastercard). Le paiement à la livraison est possible au Bénin.' },
  { k: ['sur-mesure', 'sur mesure', 'rendez', 'rdv', 'grande mesure'], q: 'Sur-mesure et rendez-vous', a: 'Le sur-mesure démarre à 150 000 FCFA et la grande mesure à 250 000 FCFA. Choisissez un créneau dans le calendrier de rendez-vous, au showroom de Cotonou ou en visio.' },
  { k: ['commande', 'suivi', 'colis', 'où en est'], q: 'Suivre ma commande', a: 'Rendez-vous sur « Suivre ma commande » avec votre numéro (ES…) et le téléphone utilisé : vous verrez l’étape en cours et le message du transporteur.' },
  { k: ['retour', 'échange', 'rembours'], q: 'Retours et échanges', a: 'Réponse à définir par la Maison (délai de retour, conditions pour le sur-mesure). Elle sera modifiable dans le dashboard.' },
];
// Disponibilités d'exemple : dans la version finale, définies dans le dashboard pays par pays
const RDV = {
  BJ: { name: 'Bénin', on: true, mode: 'Au showroom de Camp Guézo, Cotonou', days: [1, 2, 3, 4, 5, 6], slots: ['09:30', '11:00', '14:30', '16:00'], tz: 'heure de Cotonou' },
  FR: { name: 'France', on: true, mode: 'En visio (WhatsApp ou Google Meet)', days: [2, 4], slots: ['10:00', '15:00', '17:30'], tz: 'heure de Paris' },
  US: { name: 'États-Unis', on: true, mode: 'En visio (WhatsApp ou Google Meet)', days: [3], slots: ['17:00', '18:30'], tz: 'heure de New York' },
  CI: { name: 'Côte d’Ivoire', on: true, mode: 'En visio, ou à Abidjan lors des ventes privées', days: [2, 5], slots: ['10:00', '14:00'], tz: 'heure d’Abidjan' },
  CA: { name: 'Canada', on: false }, GB: { name: 'Royaume-Uni', on: false },
};
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']; const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function Calendar() {
  const [c, setC] = useState('BJ'); const now = new Date(); const [ym, setYm] = useState([now.getFullYear(), now.getMonth()]); const [day, setDay] = useState(null); const [slot, setSlot] = useState(null); const [done, setDone] = useState(false);
  const r = RDV[c]; const [y, m] = ym; const first = (new Date(y, m, 1).getDay() + 6) % 7; const n = new Date(y, m + 1, 0).getDate(); const min = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  const ok = (d) => { const dt = new Date(y, m, d); return r.on && dt >= min && r.days.includes(dt.getDay()); };
  const pick = (code) => { setC(code); setDay(null); setSlot(null); setDone(false); }; const move = (k) => { const d = new Date(y, m + k, 1); setYm([d.getFullYear(), d.getMonth()]); setDay(null); setSlot(null); };
  return (<div className="pv-cal"><div className="pv-cal-l"><label>Votre pays<select value={c} onChange={(e) => pick(e.target.value)}>{Object.entries(RDV).map(([k, v]) => <option key={k} value={k}>{v.name}{v.on ? '' : ' (non ouvert)'}</option>)}</select></label>
    {!r.on ? <p className="pv-note">La prise de rendez-vous en ligne n’est pas encore ouverte pour ce pays. Écrivez-nous sur WhatsApp : nous trouverons un créneau ensemble.</p> : (<>
      <p className="pv-mode">📍 {r.mode}</p>
      <div className="pv-cal-h"><button onClick={() => move(-1)} aria-label="Mois précédent">←</button><b>{MONTHS[m]} {y}</b><button onClick={() => move(1)} aria-label="Mois suivant">→</button></div>
      <div className="pv-grid">{DAYS.map((d) => <i key={d}>{d}</i>)}{Array.from({ length: first }).map((_, k) => <span key={'e' + k} />)}{Array.from({ length: n }).map((_, k) => { const d = k + 1; return <button key={d} disabled={!ok(d)} className={day === d ? 'on' : ''} onClick={() => { setDay(d); setSlot(null); setDone(false); }}>{d}</button>; })}</div>
      <p className="pv-leg"><em className="a" /> disponible <em className="b" /> indisponible · réservation au moins 48 h à l’avance</p></>)}</div>
    <div className="pv-cal-r">{r.on && !day && <p className="pv-hint">Choisissez une date disponible pour voir les horaires.</p>}
      {r.on && day && !done && (<><h4>{day} {MONTHS[m]} · horaires ({r.tz})</h4><div className="pv-slots">{r.slots.map((s) => <button key={s} className={slot === s ? 'on' : ''} onClick={() => setSlot(s)}>{s}</button>)}</div>
        {slot && <form className="pv-form" onSubmit={(e) => { e.preventDefault(); setDone(true); }}><input placeholder="Nom *" required /><input placeholder="Téléphone (WhatsApp) *" required /><select defaultValue="grande"><option value="grande">Grande mesure</option><option value="sur">Sur-mesure</option><option value="essayage">Essayage</option></select><button className="pv-btn">Confirmer le {day} {MONTHS[m]} à {slot}</button></form>}</>)}
      {done && <p className="pv-ok">✓ Démonstration : la demande serait enregistrée pour le {day} {MONTHS[m]} à {slot} ({r.name}), visible dans Dashboard &gt; Rendez-vous, avec email de confirmation.</p>}</div></div>);
}

function Chat({ wa }) {
  const [open, setOpen] = useState(true); const [msgs, setMsgs] = useState([{ b: 1, t: 'Bonjour 👋 Je suis l’assistante EDI SESSI. Choisissez un sujet ou écrivez votre question.' }]); const [v, setV] = useState(''); const end = useRef(null);
  useEffect(() => { if (end.current) end.current.scrollTop = end.current.scrollHeight; }, [msgs]);
  const answer = (text) => { const f = FAQ.find((x) => x.k.some((k) => text.toLowerCase().includes(k))); setMsgs((m) => [...m, { t: text }]);
    setTimeout(() => setMsgs((m) => [...m, f ? { b: 1, t: f.a } : { b: 1, t: 'Je préfère vous mettre en relation avec une conseillère pour cette question.', wa: 1 }]), 500); };
  return (<div className="pv-chat">{open && <div className="pv-chat-p"><header><b>EDI SESSI</b><span>Réponses automatiques · 24 h/24</span><button onClick={() => setOpen(false)} aria-label="Fermer">✕</button></header>
    <div className="pv-chat-m" ref={end}>{msgs.map((m, i) => <p key={i} className={m.b ? 'b' : 'u'}>{m.t}{m.wa && <a href={wa} target="_blank" rel="noopener noreferrer">Continuer sur WhatsApp →</a>}</p>)}</div>
    <div className="pv-chips">{FAQ.map((f) => <button key={f.q} onClick={() => answer(f.q)}>{f.q}</button>)}</div>
    <form onSubmit={(e) => { e.preventDefault(); if (v.trim()) { answer(v.trim()); setV(''); } }}><input value={v} onChange={(e) => setV(e.target.value)} placeholder="Écrivez votre question…" /><button aria-label="Envoyer">➤</button></form></div>}
    <button className="pv-chat-b" onClick={() => setOpen(!open)} aria-label="Ouvrir le chat">{open ? '✕' : '💬'}</button></div>);
}

export default function Apercu({ common, items }) {
  const [f, setF] = useState(FONTS[0]); const [dark, setDark] = useState(false); const wa = `https://wa.me/${(common.s.whatsapp || '').replace(/\D/g, '')}`;
  return (<Layout common={common} title="Propositions : police, jour/nuit, chatbot, rendez-vous"><Head><meta name="robots" content="noindex" />
    <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600&family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;700&family=Jost:wght@400;500;600&family=Manrope:wght@400;500;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet" /></Head>
    <div className={'pv' + (dark ? ' dark' : '')} style={{ '--pt': f.t, '--pb': f.b, '--pw': f.w, '--pls': f.ls }}>
      <div className="wrap">
        <div className="pv-bar"><div><b>1. Police</b>{FONTS.map((x) => <button key={x.id} className={f.id === x.id ? 'on' : ''} onClick={() => setF(x)}>{x.name}</button>)}</div>
          <div><b>2. Mode</b><button className={!dark ? 'on' : ''} onClick={() => setDark(false)}>☀ Jour</button><button className={dark ? 'on' : ''} onClick={() => setDark(true)}>☾ Nuit</button></div></div>
        <p className="pv-tag">{f.name} — {f.tag}</p>
        <section className="pv-sec"><span className="pv-kick">Nouvelle collection</span><h1>L’élégance béninoise et africaine, réinventée</h1><p className="pv-lead">Découvrez une mode qui célèbre le savoir-faire local et sublime chaque silhouette. EDI SESSI, l’harmonie parfaite entre tradition et modernité.</p>
          <div className="pv-row"><span className="pv-btn">Acheter la collection</span><span className="pv-btn line">Prendre rendez-vous</span></div>
          <div className="pv-cards">{items.map((p) => <article key={p.id}><img src={(p.images || [])[0]} alt="" loading="lazy" /><div><h3>{p.name_fr}</h3><b>{fmt(p.price)}</b><span className="pv-btn sm">Ajouter au panier</span></div></article>)}</div></section>
        <section className="pv-sec"><span className="pv-kick">4. Rendez-vous</span><h2>Un calendrier de disponibilités par pays</h2><p className="pv-lead">La cliente choisit son pays, voit uniquement les jours et horaires ouverts pour ce pays, puis confirme. Essayez : changez de pays, puis cliquez sur une date.</p><Calendar />
          <h3>Ce que vous réglerez dans le dashboard</h3><div className="pv-scroll"><table className="pv-tbl"><thead><tr><th>Pays</th><th>Rendez-vous ouverts</th><th>Mode</th><th>Jours</th><th>Horaires</th><th>Jours fermés</th></tr></thead><tbody>
            {Object.entries(RDV).map(([k, v]) => <tr key={k}><td>{v.name}</td><td><i className={'pv-sw' + (v.on ? ' on' : '')} /></td><td>{v.on ? v.mode : '—'}</td><td>{v.on ? v.days.map((d) => DAYS[(d + 6) % 7]).join(', ') : '—'}</td><td>{v.on ? v.slots.join(' · ') : '—'}</td><td>{v.on ? 'Dates au choix (fériés, défilés…)' : '—'}</td></tr>)}</tbody></table></div>
          <p className="pv-small">Réglages prévus par pays : ouvert ou non, mode (showroom ou visio), jours de la semaine, horaires, durée d’un créneau, délai minimum, dates fermées. Un créneau déjà réservé disparaît du calendrier. Les pays non listés ne peuvent pas réserver et sont orientés vers WhatsApp.</p></section>
        <section className="pv-sec"><span className="pv-kick">3. Chatbot</span><h2>Une assistante qui répond tout de suite</h2><p className="pv-lead">La bulle en bas à droite est fonctionnelle sur cette page : cliquez sur un sujet ou tapez « livraison », « taille », « paiement »… Les questions et réponses seront modifiables dans le dashboard, en français et en anglais. Sans réponse trouvée, elle propose de continuer sur WhatsApp.</p></section>
      </div><Chat wa={wa} /></div></Layout>);
}
