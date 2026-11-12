import { useRouter } from 'next/router'; import { useState } from 'react';
import Layout from '../../components/Layout'; import { Grid } from '../../components/ProductCard';
import { T } from '../../lib/i18n'; import { L } from '../../lib/util';

export async function getServerSideProps(ctx) {
  const { q, plain } = require('../../lib/db'); const { common, listProducts } = require('../../lib/shop');
  const f = ctx.query;
  return { props: plain({ common: await common(ctx), f, items: await listProducts(f),
    cats: await q('select c.* from categories c where exists (select 1 from products p where p.category_id=c.id and p.archived=false) order by position,name_fr'),
    cols: await q("select slug,name_fr,name_en from collections where status='active' order by position"),
    fabs: await q('select slug,name_fr,name_en from fabrics where published=true order by position') }) };
}

export default function Shop({ common, f, items, cats, cols, fabs }) {
  const { lang } = common; const t = T[lang]; const router = useRouter(); const [open, setOpen] = useState(false);
  const set = (k, v) => { const n = { ...f, [k]: v }; Object.keys(n).forEach((x) => !n[x] && delete n[x]); router.push({ pathname: '/boutique', query: n }, undefined, { scroll: false }); };
  const col = cols.find((c) => c.slug === f.collection);
  const title = col ? L(col, 'name', lang) : f.genre === 'homme' ? t.men : f.genre === 'femme' ? t.women : t.shop;
  const active = ['category', 'collection', 'fabric', 'max', 'q'].filter((k) => f[k]).length;
  return (
    <Layout common={common} title={title} description={lang === 'fr' ? 'Boutique en ligne EDI SESSI : prêt-à-porter béninois livré au Bénin et à l’international.' : 'EDI SESSI online shop: Beninese ready-to-wear delivered in Benin and worldwide.'}>
      <div className="wrap page">
        <div className="sec-top"><h1>{title}</h1><div className="row">{[['', t.all], ['femme', t.women], ['homme', t.men]].map(([v, l]) => <button key={v} className={'chip' + ((f.genre || '') === v ? ' dark' : '')} onClick={() => set('genre', v)}>{l}</button>)}</div></div>
        <div className="fbar">
          <button className="btn ghost sm only-m" onClick={() => setOpen(!open)}>{t.filter}{active ? ` (${active})` : ''}</button>
          <select className="only-m" value={f.tri || ''} onChange={(e) => set('tri', e.target.value)} aria-label="Tri"><option value="">{t.sort_new}</option><option value="prix_asc">{t.sort_asc}</option><option value="prix_desc">{t.sort_desc}</option><option value="nom">{t.sort_name}</option></select>
          <div className={'filters' + (open ? ' open' : '')}>
            <form onSubmit={(e) => { e.preventDefault(); set('q', e.target.q.value); }}><input name="q" defaultValue={f.q || ''} placeholder={t.search} /></form>
            <select value={f.category || ''} onChange={(e) => set('category', e.target.value)}><option value="">{t.all_cats}</option>{cats.map((c) => <option key={c.id} value={c.id}>{L(c, 'name', lang)}</option>)}</select>
            <select value={f.collection || ''} onChange={(e) => set('collection', e.target.value)}><option value="">{t.all_cols}</option>{cols.map((c) => <option key={c.slug} value={c.slug}>{L(c, 'name', lang)}</option>)}</select>
            <select value={f.fabric || ''} onChange={(e) => set('fabric', e.target.value)}><option value="">{t.all_fabs}</option>{fabs.map((c) => <option key={c.slug} value={c.slug}>{L(c, 'name', lang)}</option>)}</select>
            <select value={f.max || ''} onChange={(e) => set('max', e.target.value)}><option value="">{t.all_prices}</option>{[50000, 80000, 120000, 200000].map((m) => <option key={m} value={m}>≤ {m.toLocaleString('fr-FR')} FCFA</option>)}</select>
            <select className="no-m" value={f.tri || ''} onChange={(e) => set('tri', e.target.value)} aria-label="Tri"><option value="">{t.sort_new}</option><option value="prix_asc">{t.sort_asc}</option><option value="prix_desc">{t.sort_desc}</option><option value="nom">{t.sort_name}</option></select>
          </div>
        </div>
        <p className="mut">{items.length} {t.results}</p>
        {items.length ? <Grid items={items} common={common} /> : <p className="empty">{t.none}</p>}
      </div>
    </Layout>
  );
}
