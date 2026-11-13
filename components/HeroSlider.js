import Link from 'next/link'; import { useEffect, useRef, useState, useCallback } from 'react';
import { L, fmt, safeHref } from '../lib/util';

// Bannière d'accueil en 4 slides : même logique sur chaque slide (badge, titre, texte, 2 boutons, éventail de cartes cliquables).
export default function HeroSlider({ slides, lang, social = [], delay = 7000 }) {
  const [i, setI] = useState(0); const [paused, setPaused] = useState(false); const [tick, setTick] = useState(0); const touch = useRef(null);
  const go = useCallback((n) => { setI((n + slides.length) % slides.length); setTick((t) => t + 1); }, [slides.length]);
  useEffect(() => { if (paused) return; const t = setTimeout(() => go(i + 1), delay); return () => clearTimeout(t); }, [i, paused, tick, delay, go]);
  useEffect(() => { const k = (e) => { if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [i, go]);
  const onTouchEnd = (e) => { if (touch.current === null) return; const d = e.changedTouches[0].clientX - touch.current; if (Math.abs(d) > 50) go(i + (d < 0 ? 1 : -1)); touch.current = null; };
  return (
    <section className={'hs' + (paused ? ' paused' : '')} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={(e) => (touch.current = e.touches[0].clientX)} onTouchEnd={onTouchEnd} aria-roledescription="carousel">
      {slides.map((s, n) => (
        <div key={n} className={'hs-slide' + (n === i ? ' on' : '')} style={{ '--accent': s.accent || '#ffd87d' }} aria-hidden={n !== i}>
          <div className="hs-bg" style={{ backgroundImage: `url(${s.image})` }} />
          <div className="hs-shade" />
          <div className="wrap hs-in">
            <div className="hs-t">
              <Link href={s.badgeUrl || s.ctaUrl} className="hs-badge" tabIndex={n === i ? 0 : -1}>✦ {s.badge} →</Link>
              <h2 className="hs-title">{s.title.split(' ').map((w, k) => <span key={k} style={{ '--d': `${120 + k * 55}ms` }}>{w}&nbsp;</span>)}</h2>
              <p className="hs-text">{s.text}</p>
              <div className="row hs-btns"><Link href={s.ctaUrl} className="btn gold lg" tabIndex={n === i ? 0 : -1}>{s.cta}</Link>{s.cta2 && <Link href={s.cta2Url} className="btn line lg" tabIndex={n === i ? 0 : -1}>{s.cta2}</Link>}</div>
              {n === 0 && social.length > 0 && <div className="soc light hs-soc">{social.map(([l, u]) => <a key={l} href={u} target="_blank" rel="noopener noreferrer">{l}</a>)}</div>}
            </div>
            <div className="hs-fan">{s.cards.slice(0, 4).map((c, k, a) => (
              <Link key={k} href={c.url} tabIndex={n === i ? 0 : -1} style={{ '--r': `${(k - (a.length - 1) / 2) * 9}deg`, '--x': `${(k - (a.length - 1) / 2) * 64}px`, '--d': `${350 + k * 110}ms` }}>
                <img src={c.image} alt={c.label} loading={n === 0 ? 'eager' : 'lazy'} /><span>{c.label}{c.price ? <small>{fmt(c.price)}</small> : null}</span></Link>))}</div>
          </div>
        </div>))}
      <div className="hs-nav wrap">
        <button className="hs-arrow" onClick={() => go(i - 1)} aria-label={lang === 'fr' ? 'Slide précédente' : 'Previous slide'}>←</button>
        <div className="hs-dots" style={{ gridTemplateColumns: `repeat(${slides.length},1fr)` }}>{slides.map((s, n) => <button key={n} className={n === i ? 'on' : ''} onClick={() => go(n)} aria-label={`Slide ${n + 1}`}><i key={n === i ? tick : 'x'} style={{ animationDuration: delay + 'ms' }} /><b>{String(n + 1).padStart(2, '0')}</b><span>{s.short}</span></button>)}</div>
        <button className="hs-arrow" onClick={() => go(i + 1)} aria-label={lang === 'fr' ? 'Slide suivante' : 'Next slide'}>→</button>
      </div>
    </section>
  );
}

// Construit les slides à partir des blocs « hero » et « slide » de la page d'accueil (modifiables dans le dashboard).
const ACCENTS = ['#ffd87d', '#ff9a6b', '#f3e3a8', '#ffb38a'];
export function buildSlides({ lang, blocks, collections, news, looks, fabrics }) {
  const fr = lang === 'fr'; const nc = collections.find((c) => c.is_new) || collections[0];
  const cards = {
    collections: () => collections.map((c) => ({ image: c.image, label: L(c, 'name', lang), url: `/boutique?collection=${c.slug}` })),
    nouveautes: () => news.map((p) => ({ image: (p.images || [])[0], label: L(p, 'name', lang), price: p.price, url: '/boutique/' + p.slug })),
    looks: () => looks.map((l) => ({ image: l.image, label: l.kind === 'homme' ? (fr ? 'Look homme' : 'Men’s look') : (fr ? 'Look femme' : 'Women’s look'), url: '/galeries' })),
    matieres: () => fabrics.map((f) => ({ image: f.image, label: L(f, 'name', lang), url: '/matieres/' + f.slug })),
  };
  return blocks.map((b, n) => {
    const auto = b.key === 'hero' && nc; const badge = L(b, 'badge', lang) || (auto ? `${fr ? 'Nouvelle Collection' : 'New Collection'} ${new Date().getFullYear()} · ${L(nc, 'name', lang)}` : L(b, 'title', lang));
    return { short: L(b, 'badge', lang) || (auto ? (fr ? 'Nouvelle collection' : 'New collection') : L(b, 'title', lang)), accent: ACCENTS[n % ACCENTS.length], image: b.image, badge, badgeUrl: auto && !L(b, 'badge', lang) ? `/boutique?collection=${nc.slug}` : safeHref(b.cta_url, '/boutique'),
      title: L(b, 'title', lang), text: L(b, 'text', lang), cta: L(b, 'cta', lang) || (fr ? 'Découvrir' : 'Discover'), ctaUrl: safeHref(b.cta_url, '/boutique'), cta2: L(b, 'cta2', lang), cta2Url: safeHref(b.cta2_url, '/rendez-vous'), cards: (cards[b.cards] || cards.collections)().filter((c) => c.image).slice(0, 4) };
  });
}
