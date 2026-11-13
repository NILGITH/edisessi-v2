import Head from 'next/head'; import Layout from '../components/Layout'; import HeroSlider, { buildSlides } from '../components/HeroSlider';
// Page de proposition (non reliée au menu, non indexée) : bannière d'accueil en 4 slides, à valider avant mise en place.
export async function getServerSideProps(ctx) {
  const { q, one, plain } = require('../lib/db'); const { common, listProducts, CARD, LIVE } = require('../lib/shop');
  let news = plain(await q(`select ${CARD} from products p where ${LIVE} and p.in_stock and p.is_new order by p.featured desc, p.created_at desc, p.id desc limit 4`)); if (news.length < 4) news = await listProducts({ limit: 4 });
  return { props: plain({ common: await common(ctx), news, hero: await one("select b.* from blocks b join pages p on p.id=b.page_id where p.slug='accueil' and b.key='hero' limit 1"),
    collections: await q("select * from collections where status='active' order by position,id"), looks: await q('select * from looks where published=true order by position,id limit 4'), fabrics: await q('select * from fabrics where published=true order by position,id limit 3') }) };
}
export default function Preview({ common, hero, collections, news, looks, fabrics }) {
  const { lang, s } = common; const slides = buildSlides({ lang, hero, collections, news, looks, fabrics });
  return (<Layout common={common} title="Proposition : bannière en 4 slides"><Head><meta name="robots" content="noindex" /></Head>
    <HeroSlider slides={slides} lang={lang} social={[['Instagram', s.instagram], ['Facebook', s.facebook], ['TikTok', s.tiktok], ['YouTube', s.youtube]].filter((x) => x[1])} />
    <div className="wrap page narrow"><h1>Proposition : bannière d’accueil en 4 slides</h1><p className="lead">Page de démonstration, non visible dans le menu. Elle remplacera la bannière actuelle de l’accueil après validation.</p>
      <table className="tbl"><thead><tr><th>Slide</th><th>Objectif</th><th>Bouton principal</th><th>Cartes de l’éventail</th></tr></thead><tbody>
        <tr><td>01 Nouvelle collection</td><td>Vendre la collection du moment</td><td>Acheter la collection</td><td>Les collections</td></tr>
        <tr><td>02 Nouveautés</td><td>Montrer des pièces avec leur prix</td><td>Voir les nouveautés</td><td>4 dernières pièces</td></tr>
        <tr><td>03 Sur-mesure</td><td>Générer des rendez-vous</td><td>Prendre rendez-vous</td><td>Looks de la galerie</td></tr>
        <tr><td>04 30 ans</td><td>Raconter la Maison et ses tissus</td><td>Découvrir l’histoire</td><td>Matières signatures</td></tr></tbody></table>
      <p><b>Animations :</b> fondu entre slides avec zoom lent de la photo de fond ; badge, titre (mot par mot), texte et boutons qui montent l’un après l’autre ; cartes distribuées en éventail une à une ; barre de progression sous chaque numéro. Défilement automatique toutes les 7 secondes, en pause au survol ; flèches, clavier et glissement du doigt sur mobile. Animations réduites pour les visiteurs qui l’ont demandé dans leur système.</p></div></Layout>);
}
