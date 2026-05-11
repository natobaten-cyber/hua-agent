import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../hooks/useApi'
import { Project, Transaction, TransactionInput, Currency } from '../../shared/types'
import TransactionForm from '../components/TransactionForm'
import TransactionItem from '../components/TransactionItem'

const CURRENCY_LABELS: Record<Currency, string> = {
  TWD: '台幣 TWD',
  JPY_CASH: '日幣現金',
  JPY_CARD: '日幣信用卡',
}

type Tab = 'records' | 'reports'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState<Tab>('records')

  useEffect(() => {
    if (id) load(parseInt(id))
  }, [id])

  async function load(pid: number) {
    const [ps, txs] = await Promise.all([
      api.projects.getAll(),
      api.transactions.getAll({ type: 'project', projectId: pid }),
    ])
    setProjects(ps)
    setTransactions(txs)
    const found = ps.find(p => p.id === pid)
    if (!found) { navigate('/projects'); return }
    setProject(found)
  }

  async function handleAddTx(data: TransactionInput) {
    await api.transactions.add({ ...data, projectId: parseInt(id!) })
    setShowForm(false)
    load(parseInt(id!))
  }

  async function handleDeleteTx(txId: number) {
    if (!confirm('確定要刪除這筆記錄嗎？')) return
    await api.transactions.delete(txId)
    load(parseInt(id!))
  }

  if (!project) return <div className="empty-state"><div className="icon">⏳</div><p>載入中...</p></div>

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount_primary, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount_primary, 0)
  const balance = income - expense

  // 報表資料
  const expenseTxs = transactions.filter(t => t.type === 'expense')
  const incomeTxs = transactions.filter(t => t.type === 'income')

  // 分類統計（支出）
  const byCat = expenseTxs.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount_primary
    return acc
  }, {})
  const catList = Object.entries(byCat).sort((a, b) => b[1] - a[1])
  const maxCat = Math.max(...catList.map(c => c[1]), 1)

  // 收入分類統計
  const byIncCat = incomeTxs.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount_primary
    return acc
  }, {})
  const incCatList = Object.entries(byIncCat).sort((a, b) => b[1] - a[1])
  const maxIncCat = Math.max(...incCatList.map(c => c[1]), 1)

  // 幣別統計
  const byCurrency = transactions.reduce<Record<string, { income: number; expense: number; count: number }>>((acc, t) => {
    if (!acc[t.currency]) acc[t.currency] = { income: 0, expense: 0, count: 0 }
    if (t.type === 'income') acc[t.currency].income += t.amount_primary
    else acc[t.currency].expense += t.amount_primary
    acc[t.currency].count++
    return acc
  }, {})
  const currencyList = Object.entries(byCurrency)

  // 月份統計
  const byMonth = transactions.reduce<Record<string, { income: number; expense: number }>>((acc, t) => {
    const m = t.date.slice(0, 7)
    if (!acc[m]) acc[m] = { income: 0, expense: 0 }
    if (t.type === 'income') acc[m].income += t.amount_primary
    else acc[m].expense += t.amount_primary
    return acc
  }, {})
  const monthList = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12)
  const maxMonth = Math.max(...monthList.map(m => Math.max(m[1].income, m[1].expense)), 1)

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 13 }}
              onClick={() => navigate('/projects')}>← 帳本列表</button>
          </div>
          <div className="page-title" style={{ marginTop: 4 }}>🏪 {project.name}</div>
          {project.note && <div className="page-subtitle">{project.note}</div>}
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ 新增記錄</button>
      </div>

      {/* 統計卡片 */}
      <div className="card-grid card-grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">結餘</div>
          <div className={`stat-value ${balance >= 0 ? 'income' : 'expense'}`}>
            NT${balance.toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">總收入</div>
          <div className="stat-value income">NT${income.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">總支出</div>
          <div className="stat-value expense">NT${expense.toLocaleString()}</div>
        </div>
      </div>

      {/* Tab 切換 */}
      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'records' ? 'active' : ''}`} onClick={() => setTab('records')}>
          📋 收支記錄
        </button>
        <button className={`tab-btn ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>
          📊 報表分析
        </button>
      </div>

      {/* 收支記錄 */}
      {tab === 'records' && (
        <div className="card">
          {transactions.length === 0
            ? (
              <div className="empty-state">
                <div className="icon">📝</div>
                <p>尚無記錄，點擊右上角「新增記錄」開始</p>
              </div>
            )
            : (
              <div className="tx-list">
                {transactions.map(tx => (
                  <TransactionItem key={tx.id} tx={tx} onDelete={handleDeleteTx} />
                ))}
              </div>
            )}
        </div>
      )}

      {/* 報表 */}
      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 月份收支對比 */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>月份收支對比</div>
            {monthList.length === 0
              ? <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>尚無資料</p>
              : monthList.map(([month, { income: inc, expense: exp }]) => (
                <div key={month} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600 }}>{month}</span>
                    <span>
                      <span style={{ color: 'var(--green)', marginRight: 12 }}>+{inc.toLocaleString()}</span>
                      <span style={{ color: 'var(--red)' }}>-{exp.toLocaleString()}</span>
                    </span>
                  </div>
                  <div style={{ position: 'relative', height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(inc / maxMonth) * 100}%`, background: 'var(--green)', borderRadius: 4, opacity: 0.7 }} />
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(exp / maxMonth) * 100}%`, background: 'var(--red)', borderRadius: 4, opacity: 0.5 }} />
                  </div>
                </div>
              ))}
          </div>

          <div className="card-grid card-grid-2">
            {/* 支出分類 */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>支出分類</div>
              {catList.length === 0
                ? <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>尚無支出資料</p>
                : catList.map(([cat, total]) => (
                  <div key={cat} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{cat}</span>
                      <span style={{ fontWeight: 700, color: 'var(--red)' }}>
                        NT${total.toLocaleString()}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(total / maxCat) * 100}%`, background: 'var(--red)' }} />
                    </div>
                  </div>
                ))}
            </div>

            {/* 收入分類 */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>收入來源</div>
              {incCatList.length === 0
                ? <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>尚無收入資料</p>
                : incCatList.map(([cat, total]) => (
                  <div key={cat} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{cat}</span>
                      <span style={{ fontWeight: 700, color: 'var(--green)' }}>
                        NT${total.toLocaleString()}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(total / maxIncCat) * 100}%`, background: 'var(--green)' }} />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* 幣別明細 */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>幣別使用明細</div>
            {currencyList.length === 0
              ? <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>尚無資料</p>
              : currencyList.map(([cur, { income: inc, expense: exp, count }]) => {
                const label = CURRENCY_LABELS[cur as Currency] ?? cur
                const symbol = cur === 'TWD' ? 'NT$' : '¥'
                const flag = cur === 'TWD' ? '🇹🇼' : '🇯🇵'
                return (
                  <div key={cur} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {flag}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{count} 筆交易</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {inc > 0 && <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>+{symbol}{inc.toLocaleString()}</div>}
                      {exp > 0 && <div style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>-{symbol}{exp.toLocaleString()}</div>}
                    </div>
                  </div>
                )
              })}
          </div>

        </div>
      )}

      {showForm && (
        <TransactionForm
          onSubmit={handleAddTx}
          onClose={() => setShowForm(false)}
          projects={projects}
          initialProjectId={parseInt(id!)}
          mode="project"
          projectName={project.name}
        />
      )}
    </div>
  )
}
