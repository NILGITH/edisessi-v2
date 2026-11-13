import Link from 'next/link'; import { useState } from 'react'; import Admin, { Csrf } from '../../../../components/Admin'; import { E, BLOCK_KEYS } from '../../../../lib/entities';
export async function getServerSideProps(ctx) {
  const { requireAdmin } = require('../../../../lib/auth'); const a = await requireAdmin(ctx); if (a.redirect) return a;
  const { q, one, plain } = require('../../../../lib/db'); const ent = E[ctx.params.entity]; if (!ent || (ent.table === 'users' && a.user.role !== 'admin')) return { notFound: true };
  const isNew = ctx.params.id === 'new'; let row = {};
  if (!isNew) { row = await one(`select * from ${ent.table} where id=$1`, [Number(ctx.params.id) || 0]); if (!row) return { notFound: true }; delete row.pass_hash; }
  else { for (const f of ent.fields) if (f.def !== undefined) row[f.n] = f.def; if (ent.parent && ctx.query[ent.parent]) row[ent.parent] = Number(ctx.query[ent.parent]); }
  const opts = {};
  for (const f of ent.fields.filter((f) => f.t === 'rel' || f.t === 'multi')) opts[f.n] = await q(`select id, ${f.relLabel || 'name_fr'} as l from ${f.rel} ${f.rel === ent.table && !isNew ? 'where id<>' + Number(row.id) : ''} order by 2 limit 1000`);
  const blocks = ent.table === 'pages' && !isNew ? await q('select id,key,title_fr,image,position,visible from blocks where page_id=$1 order by position,id', [row.id]) : null;
  return { props: plain({ user: a.user, name: ent.table, row, isNew, opts, blocks, ok: !!ctx.query.ok }) };
}
function Multi({ f, value, options }) { const [s, setS] = useState(''); const sel = new Set(value || []);
  return (<div className="multi"><input placeholder="Filtrer la liste…" value={s} onChange={(e) => setS(e.target.value)} /><div className="multi-l">{options.map((o) => <label key={o.id} style={{ display: !s || String(o.l).toLowerCase().includes(s.toLowerCase()) ? '' : 'none' }}><input type="checkbox" name={f.n} value={o.id} defaultChecked={sel.has(o.id)} /> {o.l}</label>)}</div></div>); }
export default function Edit({ user, name, row, isNew, opts, blocks, ok }) {
  const ent = E[name]; const back = name === 'blocks' && row.page_id ? `/dashboard/e/pages/${row.page_id}` : null; const d = (v) => (v ? String(v).slice(0, 10) : '');
  const field = (f) => { const v = row[f.n];
    switch (f.t) {
      case 'area': return <textarea name={f.n} rows={f.rows || 4} defaultValue={v || ''} />;
      case 'num': return <input name={f.n} type="number" step="any" defaultValue={v ?? ''} required={f.req} />;
      case 'bool': return <label className="chk"><input type="checkbox" name={f.n} defaultChecked={!!v} /> Oui</label>;
      case 'date': return <input name={f.n} type="date" defaultValue={d(v)} />;
      case 'select': return <select name={f.n} defaultValue={v ?? f.o[0][0]}>{f.o.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>;
      case 'rel': return <select name={f.n} defaultValue={v || ''} required={f.req}><option value="">Aucune</option>{opts[f.n].map((o) => <option key={o.id} value={o.id}>{o.l}</option>)}</select>;
      case 'multi': return <Multi f={f} value={v} options={opts[f.n]} />;
      case 'password': return <input name={f.n} type="password" autoComplete="new-password" minLength="8" />;
      case 'image': return (<div className="imgf">{v && <img src={v} alt="" />}<div><input type="file" name={f.n + '__file'} accept="image/*" /><input name={f.n} defaultValue={v || ''} placeholder="ou adresse d’une image (Médiathèque)" />{v && <label className="chk"><input type="checkbox" name={f.n + '__del'} /> Retirer l’image</label>}</div></div>);
      case 'images': return (<div className="imgs">{(v || []).map((u) => <label key={u} className="imgk"><img src={u} alt="" /><span><input type="checkbox" name={f.n + '__keep'} value={u} defaultChecked /> garder</span></label>)}<div><input type="file" name={f.n + '__file'} accept="image/*" multiple /><input name={f.n + '__url'} placeholder="ou adresses d’images de la Médiathèque, séparées par un espace" /><small>Décochez « garder » pour retirer une image. Les images sont compressées automatiquement.</small></div></div>);
      default: return <input name={f.n} defaultValue={v ?? ''} required={f.req} />;
    } };
  return (<Admin user={user} title={(isNew ? 'Ajouter : ' : 'Modifier : ') + ent.one} actions={<Link href={back || `/dashboard/e/${name}`} locale={false} className="btn ghost sm">← Retour</Link>}>
    {ok && <p className="ok">Enregistré.</p>}
    <form className="panel aform" method="post" encType="multipart/form-data" action={`/api/admin/save?entity=${name}${isNew ? '' : '&id=' + row.id}`}><Csrf user={user} back={back} />
      {ent.fields.map((f) => <div key={f.n} className={'fld' + (['area', 'images', 'multi', 'image'].includes(f.t) ? ' wide' : '')}><label>{f.l}{f.req ? ' *' : ''}</label>{field(f)}{f.help && <small>{f.help}</small>}</div>)}
      <div className="fld wide"><button className="btn gold lg">{isNew ? 'Créer' : 'Enregistrer'}</button></div></form>
    {blocks && (<div className="panel"><div className="panel-h"><div><h3>Sections de la page (contenus et images)</h3><p className="mut xs">Chaque section a son titre, son texte, son bouton et son image. L’ordre d’affichage suit la colonne « Ordre ».</p></div><Link href={`/dashboard/e/blocks/new?page_id=${row.id}`} locale={false} className="btn gold sm">+ Ajouter une section</Link></div>
      <table className="atbl"><thead><tr><th /><th>Section</th><th>Type</th><th>Ordre</th><th>Visible</th><th>Actions</th></tr></thead><tbody>{blocks.map((b) => <tr key={b.id}><td className="th">{b.image ? <img src={b.image} alt="" /> : <span className="noimg" />}</td><td><Link href={`/dashboard/e/blocks/${b.id}`} locale={false}><b>{b.title_fr || '(sans titre)'}</b></Link></td><td>{(BLOCK_KEYS.find((k) => k[0] === b.key) || [0, b.key])[1]}</td><td>{b.position}</td>
        <td><form method="post" action="/api/admin/action"><Csrf user={user} back={`/dashboard/e/pages/${row.id}`} /><input type="hidden" name="do" value="toggle" /><input type="hidden" name="entity" value="blocks" /><input type="hidden" name="field" value="visible" /><input type="hidden" name="id" value={b.id} /><button className={'sw' + (b.visible ? ' on' : '')} aria-label="Visible" /></form></td>
        <td className="acts"><Link href={`/dashboard/e/blocks/${b.id}`} locale={false} className="btn ghost sm">Modifier</Link><form method="post" action="/api/admin/action" onSubmit={(e) => { if (!window.confirm('Supprimer cette section ?')) e.preventDefault(); }}><Csrf user={user} back={`/dashboard/e/pages/${row.id}`} /><input type="hidden" name="do" value="delete" /><input type="hidden" name="entity" value="blocks" /><input type="hidden" name="id" value={b.id} /><button className="btn red sm">Suppr.</button></form></td></tr>)}</tbody></table>
      {!blocks.length && <p className="mut pad">Aucune section. Le texte principal de la page s’affiche seul.</p>}</div>)}
  </Admin>);
}
