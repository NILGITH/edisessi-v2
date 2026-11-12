// Données de départ, reprises du site edisessi.com actuel (textes, collections, matières, extrait du catalogue).
const { slugify } = require('./util');
const { hashPassword } = require('./auth');
const OLD = 'https://www.edisessi.com';
const PI = 'https://nnussjkeoppiuhpzasxv.supabase.co/storage/v1/object/public/product-images/products/';
const CI = 'https://nnussjkeoppiuhpzasxv.supabase.co/storage/v1/object/public/collection-images/collections/';

module.exports = async function seed(db) {
  const ins = async (table, row) => {
    const keys = Object.keys(row);
    const vals = keys.map((k) => (row[k] !== null && typeof row[k] === 'object' ? JSON.stringify(row[k]) : row[k]));
    const r = await db.query(`insert into ${table}(${keys.join(',')}) values(${keys.map((_, i) => '$' + (i + 1)).join(',')}) returning id`, vals);
    return r.rows[0].id;
  };

  // --- Administrateur initial : créé ici si ADMIN_EMAIL/ADMIN_PASSWORD sont définis, sinon depuis la page /login au premier accès
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) await ins('users', { email: process.env.ADMIN_EMAIL, name: 'Admin', role: 'admin', pass_hash: hashPassword(process.env.ADMIN_PASSWORD) });

  // --- Paramètres
  const S = {
    site_name: 'EDI SESSI', logo: OLD + '/images/logo-edi-sessi.png', phone: '+229 97 15 99 00', whatsapp: '22997159900', email: 'contact@edisessi.com',
    address: 'Camp Guézo, Cotonou, Bénin', hours_fr: 'Tous les jours · 9h00 - 18h00', hours_en: 'Every day · 9am - 6pm',
    facebook: 'https://www.facebook.com/SessiEdi', instagram: 'https://www.instagram.com/edisessi_couture/', tiktok: '', youtube: '', linkedin: '',
    usd_rate: '600', gtm_id: 'GTM-T5LR6F4C', ga_id: 'G-NVG0KVJYD8',
    kkiapay_public_key: '', kkiapay_sandbox: '1',
    payments: 'momo | Mobile Money (MTN, Moov, Celtiis) | Mobile Money (MTN, Moov, Celtiis)\ncard | Carte bancaire internationale (Visa, Mastercard) | International bank card (Visa, Mastercard)\ncod | Paiement à la livraison (Bénin uniquement) | Cash on delivery (Benin only)',
    stats: '30+ | Années de création | Years of creation\n1 000+ | Clients satisfaits | Happy clients',
    size_guide: 'Taille | Poitrine (cm) | Taille (cm) | Hanches (cm)\n36 | 82-85 | 62-65 | 88-91\n38 | 86-89 | 66-69 | 92-95\n40 | 90-93 | 70-73 | 96-99\n42 | 94-97 | 74-77 | 100-103\n44 | 98-102 | 78-82 | 104-108\n46 | 103-107 | 83-87 | 109-113',
    gala_url: '', gala_label_fr: 'Réserver mes tickets pour le Gala des 30 ans', gala_label_en: 'Book my tickets for the 30th anniversary Gala',
  };
  for (const [k, v] of Object.entries(S)) await db.query('insert into settings(key,value) values($1,$2) on conflict (key) do nothing', [k, v]);

  // --- Catégories (celles du site actuel)
  const cat = {};
  for (const [i, n] of ['Robe', 'Jupe', 'Jupe longue', 'Corsage', 'Chemise', 'Pantalon', 'Combinaison', 'Ensemble', 'Veste', 'Gilet', 'Bustier', 'T-shirt', 'Short'].entries()) cat[n] = await ins('categories', { name_fr: n, name_en: { Robe: 'Dress', Jupe: 'Skirt', 'Jupe longue': 'Long skirt', Corsage: 'Blouse', Chemise: 'Shirt', Pantalon: 'Trousers', Combinaison: 'Jumpsuit', Ensemble: 'Set', Veste: 'Jacket', Gilet: 'Waistcoat', Bustier: 'Bustier', 'T-shirt': 'T-shirt', Short: 'Shorts' }[n], position: i });

  // --- Collections
  const col = {};
  const cols = [
    ['Roi d’Été', 'King of Summer', 'Ligne masculine estivale : des coupes fluides, des couleurs vives, un style relax mais sophistiqué, parfait pour la saison chaude.', 'A summer menswear line: fluid cuts, vivid colours, a relaxed yet sophisticated style made for the warm season.', 'simy8y787wp_1769696605231.jpg', false],
    ['Tweed Kanvoh', 'Tweed Kanvoh', 'Utilisation du kanvoh béninois revisité de façon contemporaine. Une ligne signature alliant tradition textile et créativité moderne.', 'Beninese kanvoh revisited in a contemporary way. A signature line blending textile tradition and modern creativity.', 'ennn40fw0xh_1769696422572.jpeg', false],
    ['C’EST DU TùTù', "IT'S TùTù", 'Créations modernes réalisées à partir du tissu TùTù, un coton artisanal teint à la main et orné de motifs uniques (feuilles Tutu, fleurs Tutu, étoiles Tutu). Une célébration de la mode locale et inspirée.', 'Modern creations made from TùTù fabric, a hand-dyed artisanal cotton with unique patterns (Tutu leaves, flowers and stars). A celebration of local, inspired fashion.', 'rrri9avuxs_1769611499699.jpg', true],
    ['Le Rituel', 'The Ritual', 'Une collection où le patrimoine culturel béninois rencontre le design moderne. Des pièces intemporelles, élégantes et raffinées, adaptées à toutes les occasions.', 'A collection where Beninese cultural heritage meets modern design. Timeless, elegant and refined pieces for every occasion.', '66md3lg17z9_1769611338730.jpg', false],
  ];
  for (const [i, c] of cols.entries()) col[c[0]] = await ins('collections', { slug: slugify(c[0]), name_fr: c[0], name_en: c[1], description_fr: c[2], description_en: c[3], story_fr: c[2], story_en: c[3], image: CI + c[4], is_new: c[5], position: i });

  // --- Matières signatures (page Histoire du site actuel)
  const fab = {};
  const fabs = [
    ['Tweed Kanvoh', 'Le Kanvô est un pagne tissé béninois composé de lin, de chanvre et de coton, entièrement fabriqué à la main. Edi Sessi a créé un tweed Kanvoh : un tissage serré qui marie la structure du tweed occidental et la noblesse du Kanvô.', 'Kanvô is a Beninese hand-woven cloth made of linen, hemp and cotton. Edi Sessi created a Kanvoh tweed: a tight weave marrying the structure of Western tweed with the nobility of Kanvô.', 'Tissage serré artisanal\nLin, chanvre et coton\nTexture riche et graphique\nGammes sobres : noir, crème, indigo', OLD + '/images/tweed_kanvoh_collection.jpeg'],
    ['TùTù', 'Introduit en décembre 2023, le TuTu est une toile de coton teintée artisanalement. Son nom yoruba owo tùtù signifie « feuille de coton ». Chaque pièce est une œuvre d’art inspirée par la culture locale.', 'Introduced in December 2023, TuTu is a hand-dyed cotton canvas. Its Yoruba name owo tùtù means “cotton leaf”. Each piece is a work of art inspired by local culture.', 'Coton léger et respirant\nMotifs : Tutu Leaf, Flower, Stars\nTeinture artisanale\nCouleurs : indigo, rouge, marron', OLD + '/images/tutu_collection.jpg'],
    ['Fiocco di Legno', 'Textile italien innovant de Tessitura Bortolotto : doux comme la soie, délicat comme le cachemire. Fibre naturelle produite à partir de cellulose de bois de pin blanc.', 'An innovative Italian textile by Tessitura Bortolotto: soft as silk, delicate as cashmere. A natural fibre made from white pine wood cellulose.', 'Thermorégulateur\nRespirant et anti-odeur\nChaud en hiver, frais en été\nÉcoresponsable et durable', OLD + '/images/le_rituel_collection.jpg'],
  ];
  for (const [i, f] of fabs.entries()) fab[f[0]] = await ins('fabrics', { slug: slugify(f[0]), name_fr: f[0], name_en: f[0], description_fr: f[1], description_en: f[2], features_fr: f[3], image: f[4], position: i });

  // --- Extrait du catalogue actuel (le reste s'importe avec `npm run import:ancien-site`)
  const P = [
    ['Robe paysanne Tùtù leaf marron', 71000, 'Robe', '38,40,42', ['wt8u390n63c_1772110007340.jpeg'], 'Robe longue sans manches mêlant plusieurs imprimés : haut à fleurs blanches sur fond marron, jupe à carreaux, pois et volants crème.', 'femme'],
    ['Boubou Tùtù leaf marron', 51500, 'Robe', 'TU', ['r6lhnl7h3n_1772114969567.jpeg'], 'Robe ample de couleur marron chocolat, dotée de manches courtes et ornée de grands motifs floraux blancs stylisés sur la partie supérieure.', 'femme'],
    ['Jupe droite courte Tùtù leaf marron', 43500, 'Jupe', '38,44,46', ['582glizrq5g_1772114698244.jpeg'], 'Jupe taille haute arrivant au genou avec motifs floraux.', 'femme'],
    ['Bolero LOLA', 112000, 'Gilet', '40,42', ['29freyu0aaj_1780326563399.jpeg'], '', 'femme'],
    ['Bustier', 22000, 'Bustier', '38,40,42', ['4c4rdfhc9ir_1772209317181.png', 'ghhpgwxhywa_1772209323319.jpeg', 'isbf5hk7pfb_1772209323887.jpeg'], 'Top jaune structuré sans manches.', 'femme'],
    ['Pantalon Sarouel blanc', 46500, 'Pantalon', '40,42,44', ['g1iqx5uo9rp_1772114336973.jpeg'], 'Pantalon blanc ajusté taille haute.', 'femme'],
    ['Corsage Corine', 73000, 'Corsage', '38,40,42,44', ['2qkws95763o_1780330614715.jpeg'], '', 'femme'],
    ['Jupe Corine', 81700, 'Jupe longue', '38,40,42,44', ['7ftccsa4fd9_1780330928508.jpeg'], '', 'femme'],
    ['Robe Rosine', 140000, 'Robe', '38,40,42', ['9htbu3tju1_1776171426630.png'], 'Robe midi blanche sans manches, confectionnée en kanvoh blanc, une matière textile artisanale élégante et structurée. Encolure arrondie ornée de petites pierres décoratives, taille structurée et fente frontale subtile.', 'femme'],
    ['Robe Rolande', 107000, 'Robe', '40,42', ['75l83289paf_1776168589539.jpeg'], 'Robe longue sans manches en tissu blanc, structurée au centre par des empiècements en kanvoh rayé bleu et jaune.', 'femme'],
    ['Ensemble Jupe et bustier Kanvoh', 67000, 'Ensemble', '36,38,40,42,44', ['i7c9wbczie_1772201870490.png'], 'Ensemble composé d’un bustier sans bretelles et d’une jupe courte assortie, ornés de rayures verticales multicolores et d’une boutonnière centrale.', 'femme'],
    ['Chemise Cyriaque', 86000, 'Chemise', 'M,L,XL', ['19p6a8hgalq_1775904820200.jpeg'], 'Chemise en percale blanchie avec deux poches en kanvoh et une fermeture devant.', 'homme'],
    ['Chemise Luc', 57000, 'Chemise', 'L', ['16b17vng6ac_1775905485102.png'], 'Chemise en indigo avec une poche en kanvoh au niveau de la poitrine.', 'homme'],
    ['Chemise John', 57000, 'Chemise', 'S,M,XL', ['grc5fq64jyt_1775910276775.png'], 'Chemise en jeans avec des manches en tutu camaïeu.', 'homme'],
    ['Pantalon homme noir', 49000, 'Pantalon', 'M,L', ['hhk6zk0bp9j_1772116335069.jpeg'], 'Pantalon noir à coupe droite.', 'homme'],
    ["T-shirt L'Initié", 25000, 'T-shirt', 'L,XL,XXL,XXXL', ['6ttszkl691u_1780332804493.png'], '', 'homme'],
  ];
  const pid = {};
  for (const [i, p] of P.entries()) {
    const tutu = /t[uù]t[uù]/i.test(p[0] + p[5]), kan = /kanvoh/i.test(p[0] + p[5]);
    pid[p[0]] = await ins('products', { slug: slugify(p[0]), name_fr: p[0], description_fr: p[5], price: p[1], gender: p[6], category_id: cat[p[2]], collection_id: tutu ? col['C’EST DU TùTù'] : kan ? col['Tweed Kanvoh'] : null, fabric_id: tutu ? fab['TùTù'] : kan ? fab['Tweed Kanvoh'] : null, sizes: p[3], images: p[4].map((x) => PI + x), is_new: i < 8, featured: i < 4 });
  }
  // Pièces qui vont ensemble (vente croisée) + un ensemble à prix groupé
  const rel = async (a, bs) => db.query('update products set related=$1 where id=$2', [JSON.stringify(bs.map((b) => pid[b])), pid[a]]);
  await rel('Bolero LOLA', ['Pantalon Sarouel blanc', 'Bustier']);
  await rel('Bustier', ['Pantalon Sarouel blanc', 'Bolero LOLA']);
  await rel('Corsage Corine', ['Jupe Corine']); await rel('Jupe Corine', ['Corsage Corine']);
  await rel('Chemise Cyriaque', ['Pantalon homme noir']); await rel('Chemise Luc', ['Pantalon homme noir']);
  await ins('bundles', { name_fr: 'Ensemble Corine (corsage + jupe)', name_en: 'Corine set (blouse + skirt)', products: [pid['Corsage Corine'], pid['Jupe Corine']], price: 145000 });

  // --- Looks à acheter (galerie)
  const looks = [['femme1.jpg', 'femme', ['Bolero LOLA', 'Pantalon Sarouel blanc']], ['femme2.jpg', 'femme', ['Robe paysanne Tùtù leaf marron']], ['homme1.jpg', 'homme', ['Chemise Cyriaque', 'Pantalon homme noir']], ['homme2.jpg', 'homme', ['Chemise Luc']], ['femme3.jpg', 'femme', ['Corsage Corine', 'Jupe Corine']], ['femme4.jpg', 'femme', ['Robe Rosine']]];
  for (const [i, l] of looks.entries()) await ins('looks', { title_fr: 'Look ' + (i + 1), title_en: 'Look ' + (i + 1), image: OLD + '/galeries/' + l[0], kind: l[1], products: l[2].map((n) => pid[n]), position: i });

  // --- Témoignages repris du site actuel : non publiés tant qu'ils ne sont pas confirmés comme de vrais avis
  for (const t of [['Aminata Houngbedji', 'Entrepreneuse, Cotonou', "Chaque création EDI SESSI raconte une histoire. Les motifs et les couleurs reflètent parfaitement l'âme africaine tout en restant modernes."], ['Chantal Adjavon', 'Designer Graphique, Porto-Novo', 'Je me sens unique dans chaque pièce. EDI SESSI a su allier élégance et confort, rendant chaque tenue exceptionnelle.'], ['Koffi Agbessi', 'Influenceuse Mode, Abomey', "J’adore la créativité et l’authenticité de chaque tenue. EDI SESSI transforme le style traditionnel en quelque chose de contemporain et raffiné."]]) await ins('testimonials', { author: t[0], role_fr: t[1], text_fr: t[2], published: false });

  // --- Livraison par zone (montants indicatifs à ajuster) et code promo d'exemple inactif
  const Z = [['Bénin', 'Benin', 'BJ', 2000, '24 à 72 h', '24 to 72 hours', false], ["Afrique de l'Ouest", 'West Africa', 'TG,NG,CI,GH,SN,BF,NE,ML,GN', 15000, '5 à 8 jours ouvrés', '5 to 8 business days', false], ['Europe', 'Europe', 'FR,BE,CH,DE,GB,IT,ES,NL,PT,LU,IE,AT,SE,DK,NO', 35000, '7 à 10 jours ouvrés', '7 to 10 business days', false], ['Amérique du Nord', 'North America', 'US,CA', 45000, '8 à 12 jours ouvrés', '8 to 12 business days', false], ['Reste du monde', 'Rest of the world', '', 50000, '10 à 15 jours ouvrés', '10 to 15 business days', true]];
  for (const [i, z] of Z.entries()) await ins('zones', { name_fr: z[0], name_en: z[1], countries: z[2], fee: z[3], delay_fr: z[4], delay_en: z[5], is_default: z[6], position: i });
  await ins('promos', { code: 'EDISESSI10', kind: 'percent', value: 10, active: false });
  for (const [i, s] of ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44', '46', 'TU'].entries()) await ins('sizes', { name: s, code: s, category: /^\d/.test(s) ? 'Femme' : 'Standard', position: i });
  for (const [i, c] of [['Noir', '#141414'], ['Blanc', '#ffffff'], ['Indigo', '#2b3a67'], ['Marron', '#6b4226'], ['Jaune', '#e8c547'], ['Rouge', '#c0392b']].entries()) await ins('colors', { name: c[0], code: c[1], position: i });

  // --- Coulisses et actualités
  await ins('posts', { slug: '30-ans-de-la-maison', kind: '30ans', title_fr: 'EDI SESSI fête ses 30 ans', title_en: 'EDI SESSI turns 30', excerpt_fr: 'Trente années de créativité, de savoir-faire et de transmission. Programme, collaborations et Gala : tout se prépare ici.', excerpt_en: 'Thirty years of creativity, craftsmanship and transmission. Programme, collaborations and Gala: it all takes shape here.', body_fr: 'Depuis le milieu des années 1990, la Maison réinvente la couture béninoise et sublime les tissus du pays.\nCette rubrique accueillera le programme des 30 ans, les collaborations avec de jeunes créateurs et les images des coulisses.\n(Texte à compléter depuis le dashboard.)', image: OLD + '/images/history2.jpg' });
  await ins('posts', { slug: 'dans-latelier-le-tissage-du-kanvoh', kind: 'coulisses', title_fr: 'Dans l’atelier : le tissage du Kanvoh', title_en: 'In the workshop: weaving Kanvoh', excerpt_fr: 'La Maison collabore avec des tisserands béninois pour moderniser les étoffes traditionnelles.', excerpt_en: 'The House works with Beninese weavers to modernise traditional cloths.', body_fr: 'Le Kanvô est un pagne tissé béninois composé de lin, de chanvre et de coton, entièrement fabriqué à la main.\nEdi Sessi en a tiré un tweed : un tissage serré qui marie la structure du tweed occidental et la noblesse du Kanvô.\n(Ajoutez ici photos et vidéo de l’atelier depuis le dashboard.)', image: OLD + '/images/tweed_kanvoh_collection.jpeg' });

  // --- Pages
  const page = async (p, blocks = []) => { const id = await ins('pages', p); for (const [i, b] of blocks.entries()) await ins('blocks', { page_id: id, position: i, ...b }); return id; };
  await page({ slug: 'accueil', title_fr: 'Accueil', title_en: 'Home', meta_fr: 'EDI SESSI, maison de mode béninoise : design contemporain et savoir-faire artisanal africain.', meta_en: 'EDI SESSI, a Beninese fashion house: contemporary design and African craftsmanship.', is_system: true, in_footer: false }, [
    { key: 'hero', title_fr: 'L’élégance béninoise et africaine, réinventée', title_en: 'Beninese and African elegance, reinvented', text_fr: 'Découvrez une mode qui célèbre le savoir-faire local et sublime chaque silhouette. EDI SESSI, l’harmonie parfaite entre tradition et modernité.', text_en: 'Discover fashion that celebrates local craftsmanship and flatters every silhouette. EDI SESSI, the perfect harmony between tradition and modernity.', cta_fr: 'Acheter la collection', cta_en: 'Shop the collection', cta_url: '/boutique?collection=c-est-du-tutu', image: OLD + '/images/hero2.webp' },
    { key: 'nouveautes', title_fr: 'Nouveautés', title_en: 'New arrivals', text_fr: 'Les dernières pièces de l’atelier, prêtes à être portées.', text_en: 'The latest pieces from the workshop, ready to wear.', cta_fr: 'Voir toute la boutique', cta_en: 'See the whole shop', cta_url: '/boutique' },
    { key: 'facons', title_fr: 'Trois façons d’acheter', title_en: 'Three ways to buy', text_fr: 'Prêt-à-Porter | Tailles standards, expédié sous 24h | À partir de 25 000 FCFA | Parcourir la boutique | /boutique\nSur-Mesure | Un modèle adapté à vos mesures, 1 essayage, dès 72h | À partir de 150 000 FCFA | Choisir un modèle | /boutique\nGrande Mesure | Création unique, 2 à 3 essayages, 2 semaines | À partir de 250 000 FCFA | Prendre rendez-vous | /rendez-vous', text_en: 'Ready-to-wear | Standard sizes, shipped within 24h | From 25,000 FCFA | Browse the shop | /boutique\nMade-to-measure | A design adapted to your measurements, 1 fitting, from 72h | From 150,000 FCFA | Choose a design | /boutique\nBespoke | One-of-a-kind creation, 2 to 3 fittings, 2 weeks | From 250,000 FCFA | Book an appointment | /rendez-vous' },
    { key: 'collections', title_fr: 'L’Art du Style Panafricain et contemporain', title_en: 'The Art of Pan-African, contemporary Style', text_fr: 'Explorez des collections qui célèbrent créativité, authenticité et élégance. Des pièces pour hommes et femmes, pensées pour sublimer chaque silhouette.', text_en: 'Explore collections celebrating creativity, authenticity and elegance. Pieces for men and women, designed to flatter every silhouette.' },
    { key: 'maison', title_fr: 'La Maison EDI SESSI', title_en: 'The House of EDI SESSI', text_fr: 'Edith Bidossessi Daassounon, connue sous le nom d’Edi Sessi, est l’une des pionnières de la couture béninoise. Windiya, son défilé fondateur de 1997, mettait déjà à l’honneur le raphia et la percale teinte.\nDepuis le Bénin, la Maison conçoit des pièces qui racontent une histoire, celle de l’élégance africaine modernisée.', text_en: 'Edith Bidossessi Daassounon, known as Edi Sessi, is one of the pioneers of Beninese couture. Windiya, her founding 1997 show, already honoured raffia and dyed percale.\nFrom Benin, the House designs pieces that tell a story: African elegance, modernised.', cta_fr: 'Découvrir l’histoire', cta_en: 'Discover the story', cta_url: '/history', image: OLD + '/images/history2.jpg' },
    { key: 'legacy', title_fr: '30 ans : la vision legacy de Sessi', title_en: '30 years: Sessi’s legacy vision', text_fr: 'Trente ans de création, et une conviction : transmettre. La Maison soutient les nouveaux créateurs et fait vivre ses partenariats avec les tisserands et artisans du Bénin.', text_en: 'Thirty years of creation, and one conviction: passing it on. The House supports new designers and keeps its partnerships with Benin’s weavers and artisans alive.', cta_fr: 'Suivre les 30 ans', cta_en: 'Follow the 30 years', cta_url: '/coulisses', image: OLD + '/images/history3.jpeg' },
    { key: 'matieres', title_fr: 'Nos matières signatures', title_en: 'Our signature fabrics', text_fr: 'L’âme de nos créations.', text_en: 'The soul of our creations.' },
    { key: 'looks', title_fr: 'Looks à acheter', title_en: 'Shop the looks', text_fr: 'Chaque photo mène aux pièces portées.', text_en: 'Each photo leads to the pieces worn.', cta_fr: 'Toute la galerie', cta_en: 'Full gallery', cta_url: '/galeries' },
    { key: 'avis', title_fr: 'Ce que nos clientes racontent', title_en: 'What our clients say' },
    { key: 'livraison', title_fr: 'Livraison internationale et conseil sur WhatsApp', title_en: 'International delivery and advice on WhatsApp', text_fr: 'Livraison au Bénin et à l’international | Frais et délais affichés avant de payer\nPaiement sécurisé | Mobile Money et carte bancaire internationale\nUne question de taille ? | Guide des tailles et envoi de vos mesures\nConseil personnalisé | Notre équipe vous répond sur WhatsApp', text_en: 'Delivery in Benin and worldwide | Fees and delivery times shown before you pay\nSecure payment | Mobile Money and international bank card\nSize question? | Size guide and send-your-measurements option\nPersonal advice | Our team answers on WhatsApp', cta_fr: 'Livraison et retours', cta_en: 'Delivery and returns', cta_url: '/livraison' },
  ]);
  await page({ slug: 'history', title_fr: 'Notre Histoire', title_en: 'Our Story', intro_fr: 'La Maison EDI SESSI. L’élégance comme héritage. La modernité comme vision.', intro_en: 'The House of EDI SESSI. Elegance as heritage. Modernity as vision.', in_menu: true, image: OLD + '/images/history4.jpg', position: 1,
    body_fr: 'Avant d’être une marque, EDI SESSI est une intuition. À l’adolescence, Edith Bidossessi Daassounon fait l’expérience d’un manque : celle d’une mode capable d’écouter, de comprendre et de traduire le désir féminin avec justesse. C’est dans cet instant que naît une conviction : le vêtement doit être une réponse, jamais une approximation.\nElle lance sa maison à Cotonou au milieu des années 1990 pour « réinventer » la couture locale. Cette volonté de sublimer les tissus du pays est restée la signature de sa marque.\nEn 2014, elle lance ses premières lignes prêt-à-porter (GO !, Kadara Mi!, Hunhle, Sweet Cotton…). En 2021, elle ouvre un showroom à Camp Guézo regroupant ateliers, bureaux et boutique, et y propose sa première ligne masculine, Roi d’Été, suivie de Aurore Indigo et Le Rituel. Une deuxième boutique de prêt-à-porter a ouvert à Cadjehoun en mars 2024.' }, [
    { key: 'texte', title_fr: '1997 · Windiya, l’acte fondateur', text_fr: 'Un défilé inaugural, pensé comme une ode à une féminité libre, urbaine et souveraine. Les matières locales — raphia, percale teintée — dialoguent avec des coupes résolument contemporaines.', image: OLD + '/images/history2.jpg' },
    { key: 'texte', title_fr: '1998 · Les Ateliers Sessi', text_fr: 'À Étoile Rouge, Edith fonde Les Ateliers Sessi, premier écrin de création : des silhouettes de ville, de travail et de soirée, principalement en wax.' },
    { key: 'texte', title_fr: '2005 · Une maison de référence', text_fr: 'Installation à Saint Michel, au cœur de Cotonou, dans un espace de 300 m² dédié à la création. Le style EDI SESSI s’impose : un classique chic maîtrisé.', image: OLD + '/images/history3.jpeg' },
    { key: 'texte', title_fr: '2012 · Les Noces de Cristal', text_fr: 'Pour ses quinze ans, la maison présente 120 pièces capsules en cire Vlisco lors d’un défilé à ciel ouvert à Saint Michel.' },
    { key: 'texte', title_fr: '2014 · Le prêt-à-porter', text_fr: 'Après dix-sept années de couture sur mesure, EDI SESSI lance sa ligne Prêt-à-Porter : des créations pensées pour le climat, le mouvement, la vie réelle.' },
    { key: 'texte', title_fr: '2022 · L’essor du Tweed Kanvoh', text_fr: 'Edi Sessi réinvente le Kanvoh traditionnel. Le Tweed Kanvoh devient une matière signature de la Maison.' },
  ]);
  await page({ slug: 'livraison', title_fr: 'Livraison et paiement', title_en: 'Delivery and payment', intro_fr: 'Nous livrons au Bénin et à l’international. Les frais et délais s’affichent dans le panier selon votre pays.', intro_en: 'We deliver in Benin and worldwide. Fees and delivery times appear in the cart according to your country.', position: 2, body_fr: 'Votre commande est préparée dans notre atelier de Cotonou puis expédiée avec un numéro de suivi.\nPaiement par Mobile Money ou carte bancaire internationale.\nUne question ? Écrivez-nous sur WhatsApp.' });
  await page({ slug: 'guide-des-tailles', title_fr: 'Guide des tailles', title_en: 'Size guide', intro_fr: 'Mesurez-vous par-dessus des sous-vêtements fins. En cas de doute entre deux tailles, envoyez-nous vos mesures depuis la page produit.', intro_en: 'Measure over light underwear. If you are between two sizes, send us your measurements from the product page.', position: 3 });
  await page({ slug: 'contact', title_fr: 'Contact', title_en: 'Contact', intro_fr: 'Visitez notre Maison à Cotonou ou écrivez-nous : nous vous accompagnons dans votre démarche de style.', intro_en: 'Visit our House in Cotonou or write to us: we guide you in your style journey.', in_menu: true, position: 4 });
  await page({ slug: 'mentions-legales', title_fr: 'Mentions légales', title_en: 'Legal notice', body_fr: '(À compléter depuis le dashboard.)', position: 5 });
};
