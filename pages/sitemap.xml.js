export async function getServerSideProps({ res, req }) {
  const { q } = require('../lib/db'); const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://' + req.headers.host;
  const paths = ['', '/boutique', '/collections', '/galeries', '/coulisses', '/rendez-vous',
    ...(await q('select slug from products where archived=false')).map((r) => '/boutique/' + r.slug), ...(await q("select slug from collections where status='active'")).map((r) => '/collections/' + r.slug),
    ...(await q('select slug from fabrics where published=true')).map((r) => '/matieres/' + r.slug), ...(await q('select slug from posts where published=true')).map((r) => '/coulisses/' + r.slug),
    ...(await q('select slug from pages where published=true and is_system=false')).map((r) => '/' + r.slug)];
  const url = (p) => `<url><loc>${base}${p}</loc><xhtml:link rel="alternate" hreflang="fr" href="${base}${p}"/><xhtml:link rel="alternate" hreflang="en" href="${base}/en${p}"/></url>`;
  res.setHeader('Content-Type', 'application/xml');
  res.write(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${paths.map(url).join('')}</urlset>`); res.end();
  return { props: {} };
}
export default function Sitemap() { return null; }
