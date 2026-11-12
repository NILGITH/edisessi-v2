import { createContext, useContext, useEffect, useState, useCallback } from 'react';
const Ctx = createContext(null);
const load = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// Panier, favoris et « vus récemment » gardés dans le navigateur d'une visite à l'autre.
export function StoreProvider({ children }) {
  const [cart, setCart] = useState([]); const [fav, setFav] = useState([]); const [recent, setRecent] = useState([]);
  const [added, setAdded] = useState(null); const [ready, setReady] = useState(false);
  useEffect(() => { setCart(load('es_cart')); setFav(load('es_fav')); setRecent(load('es_recent')); setReady(true); }, []);
  const upd = (k, set) => (fn) => set((prev) => { const next = fn(prev); save(k, next); return next; });
  const uCart = upd('es_cart', setCart), uFav = upd('es_fav', setFav), uRecent = upd('es_recent', setRecent);
  const add = useCallback((p, size, qty = 1) => {
    uCart((c) => { const i = c.findIndex((x) => x.id === p.id && x.size === size); if (i >= 0) { const n = [...c]; n[i] = { ...n[i], qty: n[i].qty + qty }; return n; } return [...c, { id: p.id, size, qty }]; });
    setAdded({ p, size });
    if (typeof window !== 'undefined' && window.dataLayer) window.dataLayer.push({ event: 'add_to_cart', item_id: p.id, value: p.price, currency: 'XOF' });
  }, []);
  const setQty = (id, size, qty) => uCart((c) => c.map((x) => (x.id === id && x.size === size ? { ...x, qty: Math.max(1, qty) } : x)));
  const remove = (id, size) => uCart((c) => c.filter((x) => !(x.id === id && x.size === size)));
  const clear = () => uCart(() => []);
  const toggleFav = (id) => uFav((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const seen = useCallback((id) => uRecent((r) => [id, ...r.filter((x) => x !== id)].slice(0, 8)), []);
  const count = cart.reduce((a, x) => a + x.qty, 0);
  return <Ctx.Provider value={{ cart, fav, recent, ready, count, add, setQty, remove, clear, toggleFav, seen, added, setAdded }}>{children}</Ctx.Provider>;
}
export const useStore = () => useContext(Ctx);
