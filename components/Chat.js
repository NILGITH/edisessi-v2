import { useEffect, useRef, useState } from 'react'; import { L } from '../lib/util';
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Assistante à réponses automatiques : sujets et réponses gérés dans Dashboard > Chatbot.
export default function Chat({ faqs, lang, wa }) {
  const fr = lang === 'fr'; const [open, setOpen] = useState(false); const [v, setV] = useState(''); const box = useRef(null);
  const [msgs, setMsgs] = useState([{ b: 1, t: fr ? 'Bonjour 👋 Je suis l’assistante EDI SESSI. Choisissez un sujet ou écrivez votre question.' : 'Hello 👋 I am the EDI SESSI assistant. Pick a topic or type your question.' }]);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [msgs, open]);
  if (!faqs || !faqs.length) return null;
  const answer = (text) => { const n = norm(text); const f = faqs.find((x) => norm(x.keywords).split(',').map((k) => k.trim()).filter(Boolean).some((k) => n.includes(k)) || norm(L(x, 'question', lang)) === n);
    setMsgs((m) => [...m, { t: text }]); setTimeout(() => setMsgs((m) => [...m, f ? { b: 1, t: L(f, 'answer', lang) } : { b: 1, wa: 1, t: fr ? 'Je préfère vous mettre en relation avec une conseillère pour cette question.' : 'Let me put you in touch with an advisor for this question.' }]), 450); };
  return (<div className="chat">{open && <div className="chat-p" role="dialog" aria-label="Chat EDI SESSI"><header><b>EDI SESSI</b><span>{fr ? 'Réponses automatiques · 24 h/24' : 'Automatic answers · 24/7'}</span><button onClick={() => setOpen(false)} aria-label={fr ? 'Fermer' : 'Close'}>✕</button></header>
    <div className="chat-m" ref={box}>{msgs.map((m, i) => <p key={i} className={m.b ? 'b' : 'u'}>{m.t}{m.wa && <a href={wa} target="_blank" rel="noopener noreferrer">{fr ? 'Continuer sur WhatsApp →' : 'Continue on WhatsApp →'}</a>}</p>)}</div>
    <div className="chat-chips">{faqs.map((f, i) => <button key={i} onClick={() => answer(L(f, 'question', lang))}>{L(f, 'question', lang)}</button>)}</div>
    <form onSubmit={(e) => { e.preventDefault(); if (v.trim()) { answer(v.trim()); setV(''); } }}><input value={v} onChange={(e) => setV(e.target.value)} placeholder={fr ? 'Écrivez votre question…' : 'Type your question…'} aria-label="Message" /><button aria-label={fr ? 'Envoyer' : 'Send'}>➤</button></form></div>}
    <button className="chat-b" onClick={() => setOpen(!open)} aria-label={fr ? 'Ouvrir l’assistante' : 'Open the assistant'}>{open ? '✕' : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9.5h8M8 12.5h5" /></svg>}</button></div>);
}
