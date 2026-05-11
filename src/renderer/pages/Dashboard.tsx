import { useEffect, useState } from 'react'
import { api } from '../hooks/useApi'
import { Stats } from '../../shared/types'

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.stats.getSummary().then(setStats)
  }, [])

  if (!stats) return <div className="empty-state"><div className="icon">⏳</div><p>載入中...</p></div>

  const balance = stats.personalIncome - stats.personalExpense
  const maxMonthly = Math.max(...stats.monthlyExpenses.map(m => m.total), 1)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">儀表板</div>
          <div className="page-subtitle">財務總覽</div>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="card-grid card-grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">個人結餘</div>
          <div className={`stat-value ${balance >= 0 ? 'income' : 'expense'}`}>
            NT${balance.toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">本月收入</div>
          <div className="stat-value income">NT${stats.personalIncome.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">本月支出</div>
          <div className="stat-value expense">NT${stats.personalExpense.toLocaleString()}</div>
        </div>
      </div>

      <div className="card-grid card-grid-2" style={{ marginBottom: 24 }}>
        {/* 近6月支出 */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--gray-800)' }}>近期支出趨勢</div>
          {stats.monthlyExpenses.length === 0
            ? <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>尚無資料</p>
            : stats.monthlyExpenses.map(m => (
              <div key={m.month} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--gray-600)' }}>{m.month}</span>
                  <span style={{ fontWeight: 600 }}>NT${m.total.toLocaleString()}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(m.total / maxMonthly) * 100}%` }} />
                </div>
              </div>
            ))}
        </div>

        {/* 支出分類 */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--gray-800)' }}>支出分類排行</div>
          {stats.categoryStats.length === 0
            ? <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>尚無資料</p>
            : stats.categoryStats.map((c, i) => (
              <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--blue-light)', color: 'var(--blue)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{c.category}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{c.count} 筆</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>NT${c.total.toLocaleString()}</div>
              </div>
            ))}
        </div>
      </div>

      {/* 專案進度 */}
      {stats.projectStats.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--gray-800)' }}>專案預算使用狀況</div>
          {stats.projectStats.map(p => {
            const pct = p.budget ? Math.min((p.spent / p.budget) * 100, 100) : 0
            const over = p.budget ? p.spent > p.budget : false
            return (
              <div key={p.id} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                  <span style={{ fontSize: 13, color: over ? 'var(--red)' : 'var(--gray-600)' }}>
                    NT${p.spent.toLocaleString()} {p.budget ? `/ NT$${p.budget.toLocaleString()}` : ''}
                  </span>
                </div>
                {p.budget && (
                  <div className="progress-bar">
                    <div className={`progress-fill ${over ? 'over' : ''}`} style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
