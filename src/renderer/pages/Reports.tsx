import { useEffect, useState } from 'react'
import { api } from '../hooks/useApi'
import { Transaction, Currency } from '../../shared/types'

const CURRENCY_LABELS: Record<Currency, string> = {
  TWD: '台幣', JPY_CASH: '日幣現金', JPY_CARD: '日幣信用卡'
}

export default function Reports() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tab, setTab] = useState<'category' | 'currency' | 'monthly'>('category')

  useEffect(() => {
    api.transactions.getAll().then(setTransactions)
  }, [])

  const expenses = transactions.filter(t => t.type === 'expense')
  const totalExpense = expenses.reduce((s, t) => s + t.amount_primary, 0)

  // 分類統計
  const byCategory = expenses.reduce<Record<string, { total: number; count: number }>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = { total: 0, count: 0 }
    acc[t.category].total += t.amount_primary
    acc[t.category].count++
    return acc
  }, {})
  const categoryList = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total)

  // 幣別統計
  const byCurrency = expenses.reduce<Record<string, { total: number; count: number }>>((acc, t) => {
    if (!acc[t.currency]) acc[t.currency] = { total: 0, count: 0 }
    acc[t.currency].total += t.amount_primary
    acc[t.currency].count++
    return acc
  }, {})
  const currencyList = Object.entries(byCurrency).sort((a, b) => b[1].total - a[1].total)

  // 月份統計
  const byMonth = expenses.reduce<Record<string, number>>((acc, t) => {
    const m = t.date.slice(0, 7)
    acc[m] = (acc[m] ?? 0) + t.amount_primary
    return acc
  }, {})
  const monthList = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12)
  const maxMonth = Math.max(...monthList.map(m => m[1]), 1)

  const maxCat = Math.max(...categoryList.map(c => c[1].total), 1)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">報表</div>
          <div className="page-subtitle">支出分析與統計</div>
        </div>
      </div>

      <div className="card-grid card-grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">總支出</div>
          <div className="stat-value expense">NT${totalExpense.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">記錄筆數</div>
          <div className="stat-value">{expenses.length} 筆</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">平均每筆</div>
          <div className="stat-value">
            {expenses.length ? `NT$${Math.round(totalExpense / expenses.length).toLocaleString()}` : '—'}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tab-bar">
          <button className={`tab-btn ${tab === 'category' ? 'active' : ''}`} onClick={() => setTab('category')}>分類統計</button>
          <button className={`tab-btn ${tab === 'currency' ? 'active' : ''}`} onClick={() => setTab('currency')}>幣別統計</button>
          <button className={`tab-btn ${tab === 'monthly' ? 'active' : ''}`} onClick={() => setTab('monthly')}>月份統計</button>
        </div>

        {tab === 'category' && (
          <div>
            {categoryList.length === 0
              ? <div className="empty-state"><div className="icon">📊</div><p>尚無資料</p></div>
              : categoryList.map(([cat, { total, count }]) => (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>{cat}</span>
                    <span style={{ color: 'var(--gray-500)', fontSize: 12 }}>{count} 筆｜{Math.round((total / totalExpense) * 100)}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${(total / maxCat) * 100}%` }} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14, minWidth: 90, textAlign: 'right' }}>NT${total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === 'currency' && (
          <div>
            {currencyList.length === 0
              ? <div className="empty-state"><div className="icon">💱</div><p>尚無資料</p></div>
              : currencyList.map(([cur, { total, count }]) => {
                const label = CURRENCY_LABELS[cur as Currency] ?? cur
                const symbol = cur === 'TWD' ? 'NT$' : '¥'
                return (
                  <div key={cur} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: cur === 'TWD' ? 'var(--blue-mid)' : cur === 'JPY_CASH' ? 'var(--yellow-light)' : 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {cur === 'TWD' ? '🇹🇼' : '🇯🇵'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{count} 筆交易</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{symbol}{total.toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{Math.round((total / totalExpense) * 100)}%</div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {tab === 'monthly' && (
          <div>
            {monthList.length === 0
              ? <div className="empty-state"><div className="icon">📅</div><p>尚無資料</p></div>
              : monthList.map(([month, total]) => (
                <div key={month} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>{month}</span>
                    <span style={{ fontWeight: 700 }}>NT${total.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(total / maxMonth) * 100}%` }} />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
