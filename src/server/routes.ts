import { Router, Request, Response } from 'express'
import pool from './db'

const router = Router()

// 交易
router.get('/transactions', async (req: Request, res: Response) => {
  const { type, projectId } = req.query
  let query = `SELECT t.*, p.name as "projectName" FROM transactions t LEFT JOIN projects p ON t.project_id = p.id WHERE 1=1`
  const params: unknown[] = []
  if (type === 'personal') {
    query += ' AND t.project_id IS NULL'
  } else if (type === 'project' && projectId) {
    params.push(projectId)
    query += ` AND t.project_id = $${params.length}`
  }
  query += ' ORDER BY t.date DESC, t.id DESC'
  const result = await pool.query(query, params)
  res.json(result.rows)
})

router.post('/transactions', async (req: Request, res: Response) => {
  const { date, type, currency, amountPrimary, amountSecondary, category, note, projectId } = req.body
  const result = await pool.query(
    `INSERT INTO transactions (date, type, currency, amount_primary, amount_secondary, category, note, project_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [date, type, currency, amountPrimary, amountSecondary ?? null, category, note ?? null, projectId ?? null]
  )
  res.json({ id: result.rows[0].id })
})

router.put('/transactions/:id', async (req: Request, res: Response) => {
  const { date, type, currency, amountPrimary, amountSecondary, category, note, projectId } = req.body
  await pool.query(
    `UPDATE transactions SET date=$1,type=$2,currency=$3,amount_primary=$4,amount_secondary=$5,category=$6,note=$7,project_id=$8 WHERE id=$9`,
    [date, type, currency, amountPrimary, amountSecondary ?? null, category, note ?? null, projectId ?? null, req.params.id]
  )
  res.json({ ok: true })
})

router.delete('/transactions/:id', async (req: Request, res: Response) => {
  await pool.query('DELETE FROM transactions WHERE id=$1', [req.params.id])
  res.json({ ok: true })
})

// 專案
router.get('/projects', async (_req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC')
  res.json(result.rows)
})

router.post('/projects', async (req: Request, res: Response) => {
  const { name, note } = req.body
  const result = await pool.query(
    'INSERT INTO projects (name, note) VALUES ($1,$2) RETURNING id',
    [name, note ?? null]
  )
  res.json({ id: result.rows[0].id })
})

router.put('/projects/:id', async (req: Request, res: Response) => {
  const { name, note } = req.body
  await pool.query('UPDATE projects SET name=$1, note=$2 WHERE id=$3', [name, note ?? null, req.params.id])
  res.json({ ok: true })
})

router.delete('/projects/:id', async (req: Request, res: Response) => {
  await pool.query('DELETE FROM transactions WHERE project_id=$1', [req.params.id])
  await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id])
  res.json({ ok: true })
})

// 統計
router.get('/stats/summary', async (_req: Request, res: Response) => {
  const [incRow, expRow, monthly, category, projects] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(amount_primary),0) as total FROM transactions WHERE type='income' AND project_id IS NULL AND currency='TWD'`),
    pool.query(`SELECT COALESCE(SUM(amount_primary),0) as total FROM transactions WHERE type='expense' AND project_id IS NULL AND currency='TWD'`),
    pool.query(`SELECT TO_CHAR(date,'YYYY-MM') as month, SUM(amount_primary) as total FROM transactions WHERE type='expense' AND currency='TWD' GROUP BY month ORDER BY month DESC LIMIT 6`),
    pool.query(`SELECT category, SUM(amount_primary) as total, COUNT(*) as count FROM transactions WHERE type='expense' AND project_id IS NULL GROUP BY category ORDER BY total DESC LIMIT 5`),
    pool.query(`SELECT p.id, p.name, COALESCE(SUM(t.amount_primary),0) as spent FROM projects p LEFT JOIN transactions t ON t.project_id=p.id AND t.type='expense' GROUP BY p.id ORDER BY p.created_at DESC`),
  ])
  res.json({
    personalIncome: parseFloat(incRow.rows[0].total),
    personalExpense: parseFloat(expRow.rows[0].total),
    monthlyExpenses: monthly.rows.map(r => ({ month: r.month, total: parseFloat(r.total) })),
    categoryStats: category.rows.map(r => ({ category: r.category, total: parseFloat(r.total), count: parseInt(r.count) })),
    projectStats: projects.rows.map(r => ({ id: r.id, name: r.name, budget: null, spent: parseFloat(r.spent) })),
  })
})

export default router
