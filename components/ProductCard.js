import Link from 'next/link'; import { useState } from 'react';
import { useStore } from './store'; import { T } from '../lib/i18n'; import { L, fmt, alt } from '../lib/util'; import { Icon } from './Layout';

export const Price = ({ n, s, big }) => <div className={'price' + (big ? ' big' : '')}><b>{fmt(n)}</b><small>{alt(n, s)}</small></div>;

export default function ProductCard({ p, common }) {
  const { lang, s } = common; const t = T[lang]; const { add, fav, toggleFav } = useStore(); const [pick, setPick] = useState(false);
  const sizes = (p.sizes || '').split(/[,;]/).map((x) => x.trim()).filter(Boolean); const name = L(p, 'name', lang);
  const onAdd = () => { if (sizes.length > 1) setPick(!pick); else add(p, sizes[0] || ''); };
  return (
    <article className="card">
      <Link href={'/boutique/' + p.slug} className="card-img">
        {(p.images || [])[0] ? <img src={p.images[0]} alt={name} loading="lazy" /> : <div className="ph" />}
        {p.is_new && <span className="tag">{t.new}</span>}
      </Link>
      <button className={'favb' + (fav.includes(p.id) ? ' on' : '')} onClick={() => toggleFav(p.id)} aria-label={t.favorites}><Icon n="heart" /></button>
      <div className="card-b">
        <Link href={'/boutique/' + p.slug}><h3>{name}</h3></Link>
        <Price n={p.price} s={s} />
        {pick ? (<div className="sizes">{sizes.map((z) => <button key={z} onClick={() => { add(p, z); setPick(false); }}>{z}</button>)}</div>)
          : p.in_stock ? <button className="btn gold sm full" onClick={onAdd}><Icon n="cart" /> {sizes.length > 1 ? t.choose_size : t.add}</button> : <span className="btn sm full off">{t.sold_out}</span>}
      </div>
    </article>
  );
}
export const Grid = ({ items, common }) => <div className="grid">{items.map((p) => <ProductCard key={p.id} p={p} common={common} />)}</div>;
