import Admin, { Csrf } from '../../components/Admin';
export async function getServerSideProps(ctx) { const { requireAdmin } = require('../../lib/auth'); const a = await requireAdmin(ctx); if (a.redirect) return a; const { settings, plain } = require('../../lib/db'); const s = await settings(); delete s.session_secret; return { props: plain({ user: a.user, s, ok: !!ctx.query.ok, msg: String(ctx.query.msg || '').slice(0, 300) }) }; }
const G = [
  ['Coordonnées', [['phone', 'Téléphone affiché'], ['whatsapp', 'Numéro WhatsApp (chiffres, avec indicatif)'], ['email', 'Email'], ['address', 'Adresse'], ['hours_fr', 'Horaires (Français)'], ['hours_en', 'Horaires (English)'], ['logo', 'Adresse du logo']]],
  ['Réseaux sociaux (accueil et bas de page)', [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['linkedin', 'LinkedIn']]],
  ['30 ans de la Maison', [['gala_url', 'Lien de réservation des tickets du Gala'], ['gala_label_fr', 'Libellé du bouton (Français)'], ['gala_label_en', 'Libellé du bouton (English)']]],
  ['Vente internationale', [['usd_rate', 'Taux indicatif : FCFA pour 1 dollar'], ['payments', 'Moyens de paiement (une ligne : code | libellé FR | libellé EN)', 4], ['size_guide', 'Guide des tailles (une ligne par taille, colonnes séparées par « | »)', 8], ['stats', 'Chiffres clés de l’accueil (valeur | libellé FR | libellé EN)', 3]]],
  ['Paiement en ligne KKiaPay', [['kkiapay_public_key', 'Clé publique KKiaPay'], ['kkiapay_sandbox', 'Mode test (1 = test, 0 = production)']]],
  ['Mesure d’audience', [['gtm_id', 'Identifiant Google Tag Manager (GTM-…)'], ['ga_id', 'Identifiant Google Analytics (G-…)']]],
];
export default function Settings({ user, s, ok, msg }) {
  return (<Admin user={user} title="Paramètres du site">{ok && <p className="ok">Paramètres enregistrés.</p>}{msg && <p className="ok">{msg}</p>}
    <div className="panel pad"><h3>Reprise de l’ancien site</h3><p className="mut xs">1. Importe tous les produits et catégories de l’ancien edisessi.com (sans doublon). 2. Copie leurs photos dans le nouveau site, 6 par clic : recliquez jusqu’à « 0 restant ». À faire avant de basculer le nom de domaine.</p>
      <div className="row"><form method="post" action="/api/admin/import-old"><Csrf user={user} /><input type="hidden" name="step" value="products" /><button className="btn dark">1. Importer le catalogue</button></form>
        <form method="post" action="/api/admin/import-old"><Csrf user={user} /><input type="hidden" name="step" value="images" /><button className="btn ghost">2. Rapatrier 6 images</button></form></div></div>
    <form method="post" action="/api/admin/action"><Csrf user={user} /><input type="hidden" name="do" value="settings" />
      {G.map(([title, fields]) => <div className="panel aform" key={title}><h3 className="fld wide">{title}</h3>{fields.map(([k, l, rows]) => <div key={k} className={'fld' + (rows ? ' wide' : '')}><label>{l}</label>{rows ? <textarea name={'s_' + k} rows={rows} defaultValue={s[k] || ''} /> : <input name={'s_' + k} defaultValue={s[k] || ''} />}</div>)}</div>)}
      <p className="mut xs">Les clés privées KKiaPay ne se saisissent pas ici : elles se règlent dans les variables d’environnement de l’hébergement (KKIAPAY_PRIVATE_KEY, KKIAPAY_SECRET).</p>
      <button className="btn gold lg">Enregistrer les paramètres</button></form></Admin>);
}
