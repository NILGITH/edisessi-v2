// Accès base de données : Supabase/PostgreSQL si DATABASE_URL est défini, sinon PGlite (Postgres embarqué, dossier ./data/pg).
const schema = require('./schema');
const g = globalThis;

async function connect() {
  const urls = [process.env.DATABASE_URL, process.env.DATABASE_URL_2].filter(Boolean);
  if (urls.length) {
    const { Pool } = require('pg'); let last;
    for (const url of urls) { // la seconde adresse sert de secours (autre hôte du pooler Supabase)
      const pool = new Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false }, max: 3, connectionTimeoutMillis: 8000 });
      try { await pool.query('select 1'); return { query: (s, p) => pool.query(s, p), exec: (s) => pool.query(s), pg: true }; } catch (e) { last = e; await pool.end().catch(() => {}); }
    }
    throw new Error('Connexion à la base impossible : ' + last.message);
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const path = require('path'); const fs = require('fs');
  const dir = path.join(process.cwd(), 'data', 'pg');
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  const db = new PGlite(dir);
  await db.waitReady;
  return { query: (s, p) => db.query(s, p), exec: (s) => db.exec(s) };
}

async function getDb() {
  if (!g.__es_db) {
    g.__es_db = (async () => {
      const db = await connect();
      const has = await db.query("select to_regclass('public.media_files') as t");
      if (!has.rows[0].t) await db.exec(schema);
      const r = await db.query("insert into settings(key,value) values('seeded','0') on conflict (key) do nothing returning key");
      if (r.rows.length) { await require('./seed')(db); await db.query("update settings set value='1' where key='seeded'"); }
      await require('./migrate')(db);
      return db;
    })().catch((e) => { g.__es_db = null; throw e; });
  }
  return g.__es_db;
}

async function q(sql, params = []) { const db = await getDb(); return (await db.query(sql, params)).rows; }
async function one(sql, params = []) { return (await q(sql, params))[0] || null; }
async function settings() { const o = {}; for (const r of await q('select key,value from settings')) o[r.key] = r.value; return o; }
// Sérialisation pour getServerSideProps (dates -> chaînes)
const plain = (v) => JSON.parse(JSON.stringify(v));

module.exports = { q, one, settings, plain, getDb };
