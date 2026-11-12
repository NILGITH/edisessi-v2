/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  i18n: { locales: ['fr', 'en'], defaultLocale: 'fr' },
  experimental: { serverComponentsExternalPackages: ['@electric-sql/pglite', 'sharp', 'pg'] },
  async redirects() {
    const m = { produits: 'products', categories: 'categories', collections: 'collections', clients: 'clients', 'rendez-vous': 'appointments', mesures: 'mensurations', stock: 'stock_items', admin: 'users' };
    return [...Object.entries(m).map(([a, b]) => ({ source: '/dashboard/' + a, destination: '/dashboard/e/' + b, permanent: false })),
      { source: '/dashboard/commandes-en-ligne', destination: '/dashboard/commandes', permanent: false }];
  },
  webpack: (config, { isServer }) => {
    if (isServer) config.externals.push('@electric-sql/pglite', 'sharp', 'pg', 'formidable');
    return config;
  },
};
