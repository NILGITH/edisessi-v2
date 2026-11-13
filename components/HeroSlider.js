import Link from 'next/link'; import { useEffect, useRef, useState, useCallback } from 'react';
import { L, fmt } from '../lib/util';

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
              <div className="row hs-btns"><Link href={s.ctaUrl} className="btn gold lg" tabIndex={n === i ? 0 : -1}>{s.cta}</Link><Link href={s.cta2Url} className="btn line lg" tabIndex={n === i ? 0 : -1}>{s.cta2}</Link></div>
              {n === 0 && social.length > 0 && <div className="soc light hs-soc">{social.map(([l, u]) => <a key={l} href={u} target="_blank" rel="noopener noreferrer">{l}</a>)}</div>}
            </div>
            <div className="hs-fan">{s.cards.slice(0, 4).map((c, k, a) => (
              <Link key={k} href={c.url} tabIndex={n === i ? 0 : -1} style={{ '--r': `${(k - (a.length - 1) / 2) * 9}deg`, '--x': `${(k - (a.length - 1) / 2) * 64}px`, '--d': `${350 + k * 110}ms` }}>
                <img src={c.image} alt={c.label} loading={n === 0 ? 'eager' : 'lazy'} /><span>{c.label}{c.price ? <small>{fmt(c.price)}</small> : null}</span></Link>))}</div>
          </div>
        </div>))}
      <div className="hs-nav wrap">
        <button className="hs-arrow" onClick={() => go(i - 1)} aria-label={lang === 'fr' ? 'Slide précédente' : 'Previous slide'}>←</button>
        <div className="hs-dots">{slides.map((s, n) => <button key={n} className={n === i ? 'on' : ''} onClick={() => go(n)} aria-label={`Slide ${n + 1}`}><i key={n === i ? tick : 'x'} style={{ animationDuration: delay + 'ms' }} /><b>{String(n + 1).padStart(2, '0')}</b><span>{s.short}</span></button>)}</div>
        <button className="hs-arrow" onClick={() => go(i + 1)} aria-label={lang === 'fr' ? 'Slide suivante' : 'Next slide'}>→</button>
      </div>
    </section>
  );
}

// Construit les 4 slides à partir des données du site (collections, nouveautés, looks, matières).
export function buildSlides({ lang, hero, collections, news, looks, fabrics }) {
  const fr = lang === 'fr'; const OLD = 'https://www.edisessi.com/images/'; const nc = collections.find((c) => c.is_new) || collections[0];
  return [
    { short: fr ? 'Nouvelle collection' : 'New collection', accent: '#ffd87d', image: (hero && hero.image) || OLD + 'hero2.webp', badge: `${fr ? 'Nouvelle Collection' : 'New Collection'} ${new Date().getFullYear()} · ${L(nc, 'name', lang)}`, badgeUrl: `/boutique?collection=${nc.slug}`,
      title: hero ? L(hero, 'title', lang) : '', text: hero ? L(hero, 'text', lang) : '', cta: fr ? 'Acheter la collection' : 'Shop the collection', ctaUrl: `/boutique?collection=${nc.slug}`, cta2: fr ? 'Prendre rendez-vous' : 'Book an appointment', cta2Url: '/rendez-vous',
      cards: collections.map((c) => ({ image: c.image, label: L(c, 'name', lang), url: `/boutique?collection=${c.slug}` })) },
    { short: fr ? 'Nouveautés' : 'New arrivals', accent: '#ff9a6b', image: OLD + 'store1.webp', badge: fr ? 'Nouveautés de l’atelier' : 'Fresh from the workshop', badgeUrl: '/boutique',
      title: fr ? 'Les dernières pièces, prêtes à être portées' : 'The latest pieces, ready to wear', text: fr ? 'Chaque semaine, de nouvelles créations rejoignent la boutique. Prix affichés en FCFA, euros et dollars, livraison au Bénin et à l’international.' : 'New creations join the shop every week. Prices in FCFA, euros and dollars, delivered in Benin and worldwide.',
      cta: fr ? 'Voir les nouveautés' : 'See new arrivals', ctaUrl: '/boutique', cta2: fr ? 'Rayon Hommes' : 'Menswear', cta2Url: '/boutique?genre=homme',
      cards: news.map((p) => ({ image: (p.images || [])[0], label: L(p, 'name', lang), price: p.price, url: '/boutique/' + p.slug })) },
    { short: fr ? 'Sur-mesure' : 'Made-to-measure', accent: '#f3e3a8', image: OLD + 'grande-mesure.jpeg', badge: fr ? 'Sur-mesure et Grande Mesure' : 'Made-to-measure and Bespoke', badgeUrl: '/rendez-vous',
      title: fr ? 'Une pièce pensée pour vous, et pour vous seule' : 'A piece designed for you, and you alone', text: fr ? 'Choisissez un modèle à adapter à vos mesures, ou confiez-nous une création unique. À Cotonou ou à distance, nos stylistes vous accompagnent.' : 'Pick a design adapted to your measurements, or entrust us with a one-of-a-kind creation. In Cotonou or remotely, our stylists guide you.',
      cta: fr ? 'Prendre rendez-vous' : 'Book an appointment', ctaUrl: '/rendez-vous', cta2: fr ? 'Voir la galerie' : 'See the gallery', cta2Url: '/galeries',
      cards: looks.map((l) => ({ image: l.image, label: l.kind === 'homme' ? (fr ? 'Look homme' : 'Men’s look') : (fr ? 'Look femme' : 'Women’s look'), url: '/galeries' })) },
    { short: fr ? '30 ans de la Maison' : '30 years', accent: '#ffb38a', image: OLD + 'history4.jpg', badge: fr ? '30 ans de création' : '30 years of creation', badgeUrl: '/coulisses',
      title: fr ? 'Trente ans d’élégance, et des tissus qui racontent le Bénin' : 'Thirty years of elegance, and fabrics that tell Benin’s story', text: fr ? 'Depuis Windiya, son défilé fondateur, la Maison sublime les étoffes du pays et soutient les nouveaux créateurs. Découvrez nos matières signatures et les coulisses des 30 ans.' : 'Since Windiya, her founding show, the House has elevated local cloths and supported new designers. Discover our signature fabrics and the 30th anniversary backstage.',
      cta: fr ? 'Découvrir l’histoire' : 'Discover the story', ctaUrl: '/history', cta2: fr ? 'Les coulisses' : 'Backstage', cta2Url: '/coulisses',
      cards: [...fabrics.map((f) => ({ image: f.image, label: L(f, 'name', lang), url: '/matieres/' + f.slug })), { image: OLD + 'history2.jpg', label: fr ? 'Notre histoire' : 'Our story', url: '/history' }] },
  ];
}
