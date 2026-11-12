import '../styles/site.css'; import '../styles/admin.css';
import Script from 'next/script'; import { StoreProvider } from '../components/store';
export default function App({ Component, pageProps }) {
  const gtm = pageProps.common && pageProps.common.s.gtm_id;
  return (
    <StoreProvider>
      {gtm && /^GTM-[A-Z0-9]+$/.test(gtm) && <Script id="gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}</Script>}
      <Component {...pageProps} />
    </StoreProvider>
  );
}
