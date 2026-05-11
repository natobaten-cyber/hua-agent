import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database

export function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'hua-agent.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  createTables()
}

export function getDb() {
  return db
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      budget REAL,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      currency TEXT NOT NULL CHECK(currency IN ('TWD', 'JPY_CASH', 'JPY_CARD')),
      amount_primary REAL NOT NULL,
      amount_secondary REAL,
      category TEXT NOT NULL,
      note TEXT,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions(project_id);
  `)
}
