import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { initDatabase, getDb } from './database'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#F8F9FA',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  initDatabase()
  registerIpcHandlers()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

function registerIpcHandlers() {
  const db = getDb()

  // 交易相關
  ipcMain.handle('transactions:getAll', (_e, filters: { type?: string; projectId?: number }) => {
    let query = 'SELECT t.*, p.name as projectName FROM transactions t LEFT JOIN projects p ON t.project_id = p.id WHERE 1=1'
    const params: unknown[] = []
    if (filters?.type === 'personal') {
      query += ' AND t.project_id IS NULL'
    } else if (filters?.type === 'project' && filters.projectId) {
      query += ' AND t.project_id = ?'
      params.push(filters.projectId)
    }
    query += ' ORDER BY t.date DESC, t.id DESC'
    return db.prepare(query).all(...params)
  })

  ipcMain.handle('transactions:add', (_e, data: TransactionInput) => {
    const stmt = db.prepare(`
      INSERT INTO transactions (date, type, currency, amount_primary, amount_secondary, category, note, project_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      data.date, data.type, data.currency,
      data.amountPrimary, data.amountSecondary ?? null,
      data.category, data.note ?? null, data.projectId ?? null
    )
    return result.lastInsertRowid
  })

  ipcMain.handle('transactions:delete', (_e, id: number) => {
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
    return true
  })

  ipcMain.handle('transactions:update', (_e, id: number, data: TransactionInput) => {
    db.prepare(`
      UPDATE transactions SET date=?, type=?, currency=?, amount_primary=?, amount_secondary=?, category=?, note=?, project_id=?
      WHERE id=?
    `).run(
      data.date, data.type, data.currency,
      data.amountPrimary, data.amountSecondary ?? null,
      data.category, data.note ?? null, data.projectId ?? null, id
    )
    return true
  })

  // 專案相關
  ipcMain.handle('projects:getAll', () => {
    return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all()
  })

  ipcMain.handle('projects:add', (_e, data: { name: string; budget?: number; note?: string }) => {
    const result = db.prepare('INSERT INTO projects (name, budget, note) VALUES (?, ?, ?)').run(
      data.name, data.budget ?? null, data.note ?? null
    )
    return result.lastInsertRowid
  })

  ipcMain.handle('projects:delete', (_e, id: number) => {
    db.prepare('DELETE FROM transactions WHERE project_id = ?').run(id)
    db.prepare('DELETE FROM projects WHERE id = ?').run(id)
    return true
  })

  ipcMain.handle('projects:update', (_e, id: number, data: { name: string; budget?: number; note?: string }) => {
    db.prepare('UPDATE projects SET name=?, budget=?, note=? WHERE id=?').run(
      data.name, data.budget ?? null, data.note ?? null, id
    )
    return true
  })

  // 統計
  ipcMain.handle('stats:getSummary', () => {
    const personalIncome = db.prepare("SELECT COALESCE(SUM(amount_primary),0) as total FROM transactions WHERE type='income' AND project_id IS NULL AND currency='TWD'").get() as { total: number }
    const personalExpense = db.prepare("SELECT COALESCE(SUM(amount_primary),0) as total FROM transactions WHERE type='expense' AND project_id IS NULL AND currency='TWD'").get() as { total: number }
    const monthlyExpenses = db.prepare(`
      SELECT strftime('%Y-%m', date) as month, SUM(amount_primary) as total
      FROM transactions WHERE type='expense' AND currency='TWD'
      GROUP BY month ORDER BY month DESC LIMIT 6
    `).all()
    const categoryStats = db.prepare(`
      SELECT category, SUM(amount_primary) as total, COUNT(*) as count
      FROM transactions WHERE type='expense' AND project_id IS NULL
      GROUP BY category ORDER BY total DESC LIMIT 5
    `).all()
    const projectStats = db.prepare(`
      SELECT p.id, p.name, p.budget, COALESCE(SUM(t.amount_primary),0) as spent
      FROM projects p LEFT JOIN transactions t ON t.project_id = p.id AND t.type='expense'
      GROUP BY p.id ORDER BY p.created_at DESC
    `).all()
    return { personalIncome: personalIncome.total, personalExpense: personalExpense.total, monthlyExpenses, categoryStats, projectStats }
  })
}

interface TransactionInput {
  date: string
  type: 'income' | 'expense'
  currency: 'TWD' | 'JPY_CASH' | 'JPY_CARD'
  amountPrimary: number
  amountSecondary?: number
  category: string
  note?: string
  projectId?: number
}
