import Link from 'next/link'; import Admin, { Csrf, money, day } from '../../../../components/Admin'; import { E } from '../../../../lib/entities';
export async function getServerSideProps(ctx) {
  const { requireAdmin } = require('../../../../lib/auth'); const a = await requireAdmin(ctx); if (a.redirect) return a;
  const { q, plain } = require('../../../../lib/db'); const ent = E[ctx.params.entity]; if (!ent || (ent.table === 'users' && a.user.role !== 'admin')) return { notFound: true };
  const w = []; const p = []; const s = String(ctx.query.q || '').trim();
  if (s && ent.search) { p.push(s); w.push('(' + ent.search.map((c) => `${c} ilike '%'||$1||'%'`).join(' or ') + ')'); }
  const rows = await q(`select * from ${ent.table} ${w.length ? 'where ' + w.join(' and ') : ''} order by ${ent.order || 'id desc'} limit 500`, p);
  const rels = {};
  for (const f of ent.fields.filter((f) => f.t === 'rel' && ent.list.includes(f.n))) rels[f.n] = Object.fromEntries((await q(`select id, ${f.relLabel || 'name_fr'} as l from ${f.rel}`)).map((r) => [r.id, r.l]));
  rows.forEach((r) => delete r.pass_hash);
  return { props: plain({ user: a.user, name: ent.table, rows, rels, s, ok: !!ctx.query.ok }) };
}
export default function List({ user, name, rows, rels, s, ok }) {
  const ent = E[name]; const F = Object.fromEntries(ent.fields.map((f) => [f.n, f])); const back = '/dashboard/e/' + name;
  const cell = (r, n) => { const f = F[n] || {}; const v = r[n];
    if ((ent.toggles || []).includes(n)) return <form method="post" action="/api/admin/action"><Csrf user={user} back={back} /><input type="hidden" name="do" value="toggle" /><input type="hidden" name="entity" value={name} /><input type="hidden" name="field" value={n} /><input type="hidden" name="id" value={r.id} /><button className={'sw' + (v ? ' on' : '')} aria-label={f.l} title={f.l} /></form>;
    if (f.t === 'bool') return v ? '✓' : '—'; if (f.t === 'rel') return rels[n] ? rels[n][v] || 'N/A' : v;
    if (f.t === 'select') return (f.o.find((o) => o[0] === v) || [0, v])[1]; if (['price', 'fee', 'unit_price'].includes(n)) return money(v);
    if (n === 'created_at' || f.t === 'date') return day(v); return String(v ?? '').slice(0, 70); };
  const thumb = (r) => { const v = r[ent.thumb]; const u = Array.isArray(v) ? v[0] : v; return u ? <img src={u} alt="" loading="lazy" /> : <span className="noimg" />; };
  return (<Admin user={user} title={'Gestion · ' + ent.label} actions={name !== 'messages' && <Link href={`/dashboard/e/${name}/new`} locale={false} className="btn gold sm">+ {ent.one}</Link>}>
    {ok && <p className="ok">Enregistré.</p>}
    <div className="panel"><div className="panel-h"><h3>{rows.length} {ent.label.toLowerCase()}</h3>{ent.search && <form method="get"><input name="q" defaultValue={s} placeholder="Rechercher…" /></form>}{name === 'clients' && <a className="btn ghost sm" href="/api/admin/export?what=clients">Exporter (Excel/CSV)</a>}</div>
      <div className="scroll"><table className="atbl"><thead><tr>{ent.thumb && <th />}{ent.list.map((n) => <th key={n}>{n === 'created_at' ? 'Date' : (F[n] || {}).l ? F[n].l.replace(' (Français)', '') : n}</th>)}<th>Actions</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}>{ent.thumb && <td className="th">{thumb(r)}</td>}{ent.list.map((n, i) => <td key={n}>{i === 0 ? <Link href={`/dashboard/e/${name}/${r.id}`} locale={false}><b>{cell(r, n) || '(sans titre)'}</b></Link> : cell(r, n)}</td>)}
          <td className="acts"><Link href={`/dashboard/e/${name}/${r.id}`} locale={false} className="btn ghost sm">Modifier</Link>
            <form method="post" action="/api/admin/action" onSubmit={(e) => { if (!window.confirm('Supprimer définitivement cet élément ?')) e.preventDefault(); }}><Csrf user={user} back={back} /><input type="hidden" name="do" value="delete" /><input type="hidden" name="entity" value={name} /><input type="hidden" name="id" value={r.id} /><button className="btn red sm">Suppr.</button></form></td></tr>)}</tbody></table></div>
      {!rows.length && <p className="mut pad">Aucun élément pour le moment.</p>}</div></Admin>);
}
