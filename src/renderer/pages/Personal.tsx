import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../hooks/useApi'
import { Transaction, Project, TransactionInput } from '../../shared/types'
import TransactionForm from '../components/TransactionForm'
import TransactionItem from '../components/TransactionItem'

export default function Personal() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    load()
    if (searchParams.get('new') === '1') {
      setShowForm(true)
      setSearchParams({})
    }
  }, [])

  async function load() {
    const [txs, projs] = await Promise.all([
      api.transactions.getAll({ type: 'personal' }),
      api.projects.getAll(),
    ])
    setTransactions(txs)
    setProjects(projs)
  }

  async function handleAdd(data: TransactionInput) {
    await api.transactions.add(data)
    setShowForm(false)
    load()
  }

  async function handleDelete(id: number) {
    if (!confirm('確定要刪除這筆記錄嗎？')) return
    await api.transactions.delete(id)
    load()
  }

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount_primary, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount_primary, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">個人帳本</div>
          <div className="page-subtitle">個人收支記錄</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ 新增</button>
      </div>

      <div className="card-grid card-grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">結餘</div>
          <div className={`stat-value ${income - expense >= 0 ? 'income' : 'expense'}`}>
            NT${(income - expense).toLocaleString()}
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

      <div className="card">
        {transactions.length === 0
          ? <div className="empty-state"><div className="icon">📝</div><p>還沒有任何記錄，點擊「新增」開始記帳</p></div>
          : <div className="tx-list">
              {transactions.map(tx => <TransactionItem key={tx.id} tx={tx} onDelete={handleDelete} />)}
            </div>
        }
      </div>

      {showForm && (
        <TransactionForm
          onSubmit={handleAdd}
          onClose={() => setShowForm(false)}
          projects={projects}
          mode="personal"
        />
      )}
    </div>
  )
}
