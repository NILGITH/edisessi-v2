import { Html, Head, Main, NextScript } from 'next/document';
export default function Document() {
  return (<Html><Head>
    <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&family=Jost:wght@400;500;600&display=swap" rel="stylesheet" />
    {/* Mode jour/nuit : choix enregistré de la visiteuse, sinon celui de son appareil (appliqué avant l'affichage) */}
    <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('es_theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}" }} />
  </Head><body><Main /><NextScript /></body></Html>);
}
