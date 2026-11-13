// Évolutions de la base appliquées au démarrage (sans effet si déjà faites).
const OLD = 'https://www.edisessi.com/images/';
module.exports = async function migrate(db) {
  // v1 : bannière d'accueil en 4 slides, modifiables depuis Dashboard > Pages du site > Accueil
  await db.exec(`alter table blocks add column if not exists badge_fr text; alter table blocks add column if not exists badge_en text; alter table blocks add column if not exists cta2_fr text; alter table blocks add column if not exists cta2_en text; alter table blocks add column if not exists cta2_url text; alter table blocks add column if not exists cards text;`);
  const first = await db.query("insert into settings(key,value) values('slides_v1','1') on conflict (key) do nothing returning key");
  if (!first.rows.length) return;
  const page = (await db.query("select id from pages where slug='accueil'")).rows[0]; if (!page) return;
  await db.query("update blocks set cards='collections', cta2_fr='Prendre rendez-vous', cta2_en='Book an appointment', cta2_url='/rendez-vous' where page_id=$1 and key='hero'", [page.id]);
  const S = [
    ['Nouveautés de l’atelier', 'Fresh from the workshop', 'Les dernières pièces, prêtes à être portées', 'The latest pieces, ready to wear', 'Chaque semaine, de nouvelles créations rejoignent la boutique. Prix affichés en FCFA, euros et dollars, livraison au Bénin et à l’international.', 'New creations join the shop every week. Prices in FCFA, euros and dollars, delivered in Benin and worldwide.', 'Voir les nouveautés', 'See new arrivals', '/boutique', 'Rayon Hommes', 'Menswear', '/boutique?genre=homme', 'nouveautes', 'store1.webp'],
    ['Sur-mesure et Grande Mesure', 'Made-to-measure and Bespoke', 'Une pièce pensée pour vous, et pour vous seule', 'A piece designed for you, and you alone', 'Choisissez un modèle à adapter à vos mesures, ou confiez-nous une création unique. À Cotonou ou à distance, nos stylistes vous accompagnent.', 'Pick a design adapted to your measurements, or entrust us with a one-of-a-kind creation. In Cotonou or remotely, our stylists guide you.', 'Prendre rendez-vous', 'Book an appointment', '/rendez-vous', 'Voir la galerie', 'See the gallery', '/galeries', 'looks', 'grande-mesure.jpeg'],
    ['30 ans de création', '30 years of creation', 'Trente ans d’élégance, et des tissus qui racontent le Bénin', 'Thirty years of elegance, and fabrics that tell Benin’s story', 'Depuis Windiya, son défilé fondateur, la Maison sublime les étoffes du pays et soutient les nouveaux créateurs. Découvrez nos matières signatures et les coulisses des 30 ans.', 'Since Windiya, her founding show, the House has elevated local cloths and supported new designers. Discover our signature fabrics and the 30th anniversary backstage.', 'Découvrir l’histoire', 'Discover the story', '/history', 'Les coulisses', 'Backstage', '/coulisses', 'matieres', 'history4.jpg'],
  ];
  for (const s of S) await db.query(`insert into blocks(page_id,key,badge_fr,badge_en,title_fr,title_en,text_fr,text_en,cta_fr,cta_en,cta_url,cta2_fr,cta2_en,cta2_url,cards,image,position,visible) values($1,'slide',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,0,true)`, [page.id, ...s.slice(0, 13), OLD + s[13]]);
};

// v2 : chatbot (questions/réponses) et calendrier de rendez-vous par pays
const prev = module.exports;
module.exports = async function migrate(db) {
  await prev(db);
  await db.exec(`create table if not exists faqs (id serial primary key, question_fr text not null, question_en text, keywords text, answer_fr text, answer_en text, position int default 0, published boolean default true);
create table if not exists rdv_countries (id serial primary key, code text unique not null, name_fr text not null, name_en text, enabled boolean default true, mode_fr text, mode_en text, days text default '1,2,3,4,5', slots text, tz_fr text, tz_en text, min_notice_days int default 2, closed_dates text, position int default 0);
alter table faqs enable row level security; alter table rdv_countries enable row level security;
alter table appointments add column if not exists country text; alter table appointments add column if not exists slot_time text;`);
  const first = await db.query("insert into settings(key,value) values('v2','1') on conflict (key) do nothing returning key");
  if (!first.rows.length) return;
  const F = [
    ['Livraison et délais', 'Delivery and timing', 'livraison,livrer,delai,frais,expedi,delivery,shipping', 'Nous livrons au Bénin (24 à 72 h) et à l’international (5 à 15 jours ouvrés selon la zone). Les frais exacts s’affichent dans le panier dès que vous choisissez votre pays.', 'We deliver in Benin (24 to 72 hours) and worldwide (5 to 15 business days depending on the zone). Exact fees appear in the cart once you choose your country.'],
    ['Choisir ma taille', 'Choosing my size', 'taille,mesure,guide,size,measure', 'Chaque page produit a un guide des tailles. Entre deux tailles ? Envoyez-nous vos mesures depuis la page produit : nous vous conseillons avant l’expédition.', 'Every product page has a size guide. Between two sizes? Send us your measurements from the product page and we will advise you before shipping.'],
    ['Moyens de paiement', 'Payment methods', 'paiement,payer,carte,mobile money,momo,payment,pay,card', 'Vous pouvez payer par Mobile Money (MTN, Moov, Celtiis) ou par carte bancaire internationale (Visa, Mastercard). Le paiement à la livraison est possible au Bénin.', 'You can pay by Mobile Money (MTN, Moov, Celtiis) or international bank card (Visa, Mastercard). Cash on delivery is available in Benin.'],
    ['Sur-mesure et rendez-vous', 'Made-to-measure and appointments', 'sur-mesure,sur mesure,rendez,rdv,grande mesure,appointment,bespoke,made-to-measure', 'Le sur-mesure démarre à 150 000 FCFA et la grande mesure à 250 000 FCFA. Choisissez un créneau sur la page « Prendre rendez-vous », au showroom de Cotonou ou en visio.', 'Made-to-measure starts at 150,000 FCFA and bespoke at 250,000 FCFA. Pick a slot on the “Book an appointment” page, at the Cotonou showroom or by video call.'],
    ['Suivre ma commande', 'Track my order', 'commande,suivi,colis,order,track,parcel', 'Ouvrez « Suivre ma commande » avec votre numéro (ES…) et le téléphone utilisé : vous verrez l’étape en cours et le message du transporteur.', 'Open “Track my order” with your order number (ES…) and the phone you used: you will see the current step and the carrier note.'],
    ['Retours et échanges', 'Returns and exchanges', 'retour,echange,rembours,return,exchange,refund', 'Une pièce de prêt-à-porter peut être échangée dans les 14 jours suivant sa réception, non portée et dans son état d’origine. Les créations sur-mesure et grande mesure, réalisées pour vous, ne sont pas reprises mais peuvent être retouchées. Écrivez-nous sur WhatsApp pour organiser l’échange.', 'A ready-to-wear piece can be exchanged within 14 days of receipt, unworn and in its original condition. Made-to-measure and bespoke creations, made for you, cannot be returned but can be altered. Message us on WhatsApp to arrange the exchange.'],
  ];
  for (const [i, f] of F.entries()) await db.query('insert into faqs(question_fr,question_en,keywords,answer_fr,answer_en,position) values($1,$2,$3,$4,$5,$6)', [...f, i]);
  const C = [
    ['BJ', 'Bénin', 'Benin', 'Au showroom de Camp Guézo, Cotonou', 'At the Camp Guézo showroom, Cotonou', '1,2,3,4,5,6', '09:00,10:00,11:00,14:00,15:00,16:00', 'heure de Cotonou', 'Cotonou time'],
    ['CI', 'Côte d’Ivoire', 'Côte d’Ivoire', 'En visio (WhatsApp ou Google Meet)', 'By video call (WhatsApp or Google Meet)', '2,4', '10:00,11:00,15:00,16:00', 'heure d’Abidjan', 'Abidjan time'],
    ['FR', 'France', 'France', 'En visio (WhatsApp ou Google Meet)', 'By video call (WhatsApp or Google Meet)', '2,4', '10:00,11:00,15:00,16:00', 'heure de Paris', 'Paris time'],
    ['SN', 'Sénégal', 'Senegal', 'En visio (WhatsApp ou Google Meet)', 'By video call (WhatsApp or Google Meet)', '2,4', '10:00,11:00,15:00,16:00', 'heure de Dakar', 'Dakar time'],
  ];
  for (const [i, c] of C.entries()) await db.query('insert into rdv_countries(code,name_fr,name_en,mode_fr,mode_en,days,slots,tz_fr,tz_en,position) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (code) do nothing', [...c, i]);
};
