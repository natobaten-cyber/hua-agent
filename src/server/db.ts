import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export default pool

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      currency TEXT NOT NULL CHECK(currency IN ('TWD','JPY_CASH','JPY_CARD')),
      amount_primary NUMERIC NOT NULL,
      amount_secondary NUMERIC,
      category TEXT NOT NULL,
      note TEXT,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_tx_project ON transactions(project_id);
  `)
}
