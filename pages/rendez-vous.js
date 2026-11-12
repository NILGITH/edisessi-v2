import Layout from '../components/Layout'; import { ContactForm } from './[slug]'; import { T } from '../lib/i18n';
export async function getServerSideProps(ctx) { const { plain } = require('../lib/db'); const { common } = require('../lib/shop'); return { props: plain({ common: await common(ctx) }) }; }
export default function Rdv({ common }) { const t = T[common.lang]; return (<Layout common={common} title={t.appointment}><div className="wrap page narrow"><h1>{t.rdv_title}</h1><p className="lead">{t.rdv_intro}</p><ContactForm lang={common.lang} kind="rdv" /></div></Layout>); }
