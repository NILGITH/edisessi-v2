import Head from 'next/head'; import Link from 'next/link'; import { useRouter } from 'next/router'; import { useEffect, useState } from 'react';
import { useStore } from './store'; import Chat from './Chat'; import { T } from '../lib/i18n'; import { L, fmt } from '../lib/util';

export const Icon = ({ n }) => {
  const d = { cart: 'M6 6h15l-1.5 9h-12zM6 6L5 3H2M9 20a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z', heart: 'M12 21s-7-4.4-9.3-9A5.2 5.2 0 0112 6.3 5.2 5.2 0 0121.3 12c-2.3 4.6-9.3 9-9.3 9z', menu: 'M3 6h18M3 12h18M3 18h18', moon: 'M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z', sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5', x: 'M5 5l14 14M19 5L5 19', wa: 'M21 12a8.5 8.5 0 01-12.7 7.4L3 21l1.7-5A8.5 8.5 0 1121 12zM8.5 10h7M8.5 14h4.5', globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z' }[n];
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
};

export default function Layout({ common, title, description, image, children }) {
  const { s, pages, lang } = common; const t = T[lang]; const router = useRouter();
  const { count, added, setAdded } = useStore(); const [open, setOpen] = useState(false); const [sugg, setSugg] = useState([]);
  useEffect(() => { setOpen(false); }, [router.asPath]);
  useEffect(() => { if (!added) return setSugg([]); fetch(`/api/suggest?ids=${added.p.id}`).then((r) => r.json()).then((d) => setSugg(d.items || [])).catch(() => {}); }, [added]);
  const [dark, setDark] = useState(false);
  useEffect(() => { const a = document.documentElement.getAttribute('data-theme'); setDark(a ? a === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches); }, []);
  const toggleTheme = () => { const n = !dark; setDark(n); document.documentElement.setAttribute('data-theme', n ? 'dark' : 'light'); try { localStorage.setItem('es_theme', n ? 'dark' : 'light'); } catch {} };
  const other = lang === 'fr' ? 'en' : 'fr';
  const keepLang = () => { document.cookie = `NEXT_LOCALE=${other}; path=/; max-age=31536000`; };
  const nav = [['/boutique', t.shop], ['/collections', t.collections], ...pages.filter((p) => p.in_menu && p.slug !== 'contact').map((p) => ['/' + p.slug, L(p, 'title', lang)]), ['/galeries', t.looks], ['/coulisses', t.backstage], ['/contact', t.contact]];
  const full = `${title ? title + ' | ' : ''}EDI SESSI`;
  const path = router.asPath.split('?')[0]; const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  const wa = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}` : '/contact';
  return (
    <>
      <Head>
        <title>{full}</title>
        {description && <meta name="description" content={description} />}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={full} />{description && <meta property="og:description" content={description} />}
        {image && <meta property="og:image" content={image} />}
        <link rel="alternate" hrefLang="fr" href={`${base}${path}`} /><link rel="alternate" hrefLang="en" href={`${base}/en${path === '/' ? '' : path}`} />
      </Head>
      <header className="hd">
        <div className="wrap hd-in">
          <Link href="/" className="logo" aria-label="EDI SESSI">{s.logo ? <img src={s.logo} alt="Edi Sessi" /> : <span>Edi Sessi</span>}</Link>
          <nav className={'nav' + (open ? ' open' : '')}>{nav.map(([h, l]) => <Link key={h} href={h} className={path.startsWith(h) ? 'on' : ''}>{l}</Link>)}
            <Link href="/favoris" className="only-m">{t.favorites}</Link><Link href="/suivi" className="only-m">{t.track}</Link></nav>
          <div className="hd-act">
            <Link href={router.asPath} locale={other} onClick={keepLang} className="ic" title={other.toUpperCase()}><Icon n="globe" /><b>{other.toUpperCase()}</b></Link>
            <button className="ic" onClick={toggleTheme} aria-label={dark ? (lang === 'fr' ? 'Passer en mode jour' : 'Switch to day mode') : (lang === 'fr' ? 'Passer en mode nuit' : 'Switch to night mode')} title={dark ? '☀' : '☾'}><Icon n={dark ? 'sun' : 'moon'} /></button>
            <Link href="/favoris" className="ic no-m" aria-label={t.favorites}><Icon n="heart" /></Link>
            <Link href="/boutique" className="btn sm ghost only-m">{t.shop}</Link>
            <Link href="/panier" className="btn sm gold cartb" aria-label={t.cart}><Icon n="cart" /><span className="no-m">{t.cart}</span> <b>({count})</b></Link>
            <button className="ic burger" onClick={() => setOpen(!open)} aria-label={t.menu}><Icon n={open ? 'x' : 'menu'} /></button>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="ft">
        <div className="wrap ft-grid">
          <div><div className="logo">{s.logo ? <img src={s.logo} alt="Edi Sessi" /> : <span>Edi Sessi</span>}</div>
            <p>{lang === 'fr' ? 'Edi Sessi crée des tenues uniques pour hommes et femmes, alliant élégance, modernité et confort. Chaque pièce raconte une histoire et reflète l’authenticité du style béninois contemporain.' : 'Edi Sessi creates unique outfits for men and women, combining elegance, modernity and comfort. Each piece tells a story and reflects authentic contemporary Beninese style.'}</p>
            <div className="soc">{[['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['linkedin', 'LinkedIn']].filter(([k]) => s[k]).map(([k, l]) => <a key={k} href={s[k]} target="_blank" rel="noopener noreferrer">{l}</a>)}</div></div>
          <div><h4>{t.nav}</h4>{nav.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}</div>
          <div><h4>{lang === 'fr' ? 'Aide' : 'Help'}</h4><Link href="/suivi">{t.track}</Link><Link href="/rendez-vous">{t.appointment}</Link>{pages.filter((p) => p.in_footer && !p.in_menu).map((p) => <Link key={p.slug} href={'/' + p.slug}>{L(p, 'title', lang)}</Link>)}</div>
          <div><h4>{t.contact}</h4><a href={`tel:${(s.phone || '').replace(/\s/g, '')}`}>{s.phone}</a><a href={`mailto:${s.email}`}>{s.email}</a><span>{s.address}</span><span>{s['hours_' + lang] || s.hours_fr}</span></div>
        </div>
        <div className="wrap ft-b">© {new Date().getFullYear()} Edi Sessi. Made by AITECH. {t.rights}</div>
      </footer>
      <Chat faqs={common.faqs} lang={lang} wa={wa} />
      <a className="wa" href={wa} target="_blank" rel="noopener noreferrer" aria-label={t.whatsapp}><Icon n="wa" /></a>
      {added && (
        <div className="modal" onClick={() => setAdded(null)}>
          <div className="modal-b" onClick={(e) => e.stopPropagation()}>
            <button className="ic close" onClick={() => setAdded(null)} aria-label="Fermer"><Icon n="x" /></button>
            <h3>✓ {t.added}</h3><p className="mut">{L(added.p, 'name', lang)}{added.size ? ` · ${t.size} ${added.size}` : ''}</p>
            {sugg.length > 0 && (<><h4>{t.goes_with}</h4><div className="mini">{sugg.map((p) => <Link key={p.id} href={'/boutique/' + p.slug} onClick={() => setAdded(null)}><img src={(p.images || [])[0]} alt="" loading="lazy" /><span>{L(p, 'name', lang)}</span><b>{fmt(p.price)}</b></Link>)}</div></>)}
            <div className="row"><button className="btn ghost" onClick={() => setAdded(null)}>{t.continue}</button><Link href="/panier" className="btn gold" onClick={() => setAdded(null)}>{t.go_cart}</Link></div>
          </div>
        </div>
      )}
    </>
  );
}
