# EDI SESSI — site v2 (boutique bilingue + backoffice)

Next.js 14 (pages router) + PostgreSQL (Supabase). Sans `DATABASE_URL`, le site tourne en local sur une base embarquée (PGlite, dossier `data/`).

## Lancer en local
```
npm install
npm run dev        # http://localhost:3000
```
À la première ouverture de `/login`, créez le compte administrateur. Le dashboard est sur `/dashboard`.

## Mise en ligne (Vercel + Supabase)
1. Variables d'environnement : voir `.env.example` (`DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, clés KKiaPay, `RESEND_API_KEY`, `MAIL_FROM`).
2. Au premier démarrage, le site crée ses tables (RLS activé sur toutes) et ses données de départ.
3. Images : Supabase Storage (bucket public `media`) si `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont définis ; sinon elles sont enregistrées en base.
4. Catalogue complet de l'ancien site : `npm run import:ancien-site` (avant de basculer le nom de domaine).

## Organisation
- `pages/` : site public (accueil, boutique, produit, collections, matières, galerie, coulisses, panier, commande, suivi) et `pages/dashboard/` (backoffice).
- `lib/entities.js` : description des modules du backoffice (ajouter un champ = une ligne).
- `lib/shop.js` : calcul du panier (ensembles, code promo, livraison par zone), suggestions de vente croisée.
- `lib/schema.js`, `lib/seed.js` : tables et données de départ.
- Pages et sections (textes et images) : Dashboard > Pages du site.
