/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  i18n: { locales: ['fr', 'en'], defaultLocale: 'fr' },
  poweredByHeader: false,
  images: { unoptimized: true }, // l'optimiseur d'images de Next n'est pas utilisé : on ferme ce point d'entrée
  serverExternalPackages: ['@electric-sql/pglite', 'sharp', 'pg', 'formidable'],
  async headers() {
    if (process.env.NODE_ENV !== 'production') return [];
    const csp = ["default-src 'self'", "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://cdn.kkiapay.me", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:", "connect-src 'self' https://*.google-analytics.com https://*.googletagmanager.com https://*.kkiapay.me", "frame-src https://www.youtube-nocookie.com https://*.kkiapay.me", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'"].join('; ');
    const common = [{ key: 'Content-Security-Policy', value: csp }, { key: 'X-Frame-Options', value: 'DENY' }, { key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://cdn.kkiapay.me")' }, { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }, { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' }];
    return [{ source: '/:path*', headers: common }, { source: '/dashboard/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }, { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] }];
  },
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
