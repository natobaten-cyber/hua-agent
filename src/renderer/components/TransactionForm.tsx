import { useState, useEffect } from 'react'
import { TransactionInput, Currency, PERSONAL_CATEGORIES_EXPENSE, PERSONAL_CATEGORIES_INCOME, PROJECT_CATEGORIES_INCOME, PROJECT_CATEGORIES_EXPENSE, INVESTMENT_EXPENSE, INVESTMENT_INCOME, CURRENCY_LABELS } from '../../shared/types'
import { Project } from '../../shared/types'

interface Props {
  onSubmit: (data: TransactionInput) => void
  onClose: () => void
  projects: Project[]
  initialProjectId?: number
  mode: 'personal' | 'project'
  projectName?: string
}

const today = () => new Date().toISOString().slice(0, 10)

export default function TransactionForm({ onSubmit, onClose, projects, initialProjectId, mode, projectName }: Props) {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [currency, setCurrency] = useState<Currency>('TWD')
  const [date, setDate] = useState(today())
  const [amountPrimary, setAmountPrimary] = useState('')
  const [amountSecondary, setAmountSecondary] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [projectId, setProjectId] = useState<number | undefined>(initialProjectId)
  const [errors, setErrors] = useState<{ amount?: string; category?: string }>({})

  useEffect(() => {
    if (mode === 'project' && initialProjectId) setProjectId(initialProjectId)
  }, [initialProjectId, mode])

  const categories = mode === 'project'
    ? (type === 'income' ? PROJECT_CATEGORIES_INCOME : PROJECT_CATEGORIES_EXPENSE)
    : (type === 'income' ? PERSONAL_CATEGORIES_INCOME : PERSONAL_CATEGORIES_EXPENSE)

  useEffect(() => { setCategory('') }, [type, currency])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: { amount?: string; category?: string } = {}
    if (!amountPrimary) newErrors.amount = '請輸入金額'
    if (!category) newErrors.category = '請選擇分類'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setErrors({})
    onSubmit({
      date, type, currency,
      amountPrimary: parseFloat(amountPrimary),
      amountSecondary: currency === 'JPY_CARD' && amountSecondary ? parseFloat(amountSecondary) : undefined,
      category,
      note: note || undefined,
      projectId: mode === 'project' ? projectId : undefined,
    })
  }

  const isJpyCard = currency === 'JPY_CARD'
  const isIncomeOnly = type === 'income'

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">
          {mode === 'project' && projectName
            ? `新增記錄 — ${projectName}`
            : '新增記錄'}
        </div>

        <form onSubmit={handleSubmit}>
          {/* 收入/支出切換（個人和專案都有） */}
          <div className="form-group">
            <div className="type-toggle">
              <button type="button"
                className={`type-toggle-btn ${type === 'income' ? 'active-income' : ''}`}
                onClick={() => setType('income')}>收入</button>
              <button type="button"
                className={`type-toggle-btn ${type === 'expense' ? 'active-expense' : ''}`}
                onClick={() => setType('expense')}>支出</button>
            </div>
          </div>

          {/* 幣別 */}
          <div className="form-group">
            <label className="form-label">幣別</label>
            <select className="form-select" value={currency} onChange={e => setCurrency(e.target.value as Currency)}>
              {(isIncomeOnly
                ? (['TWD', 'TWD_CARD'] as Currency[])
                : (['TWD', 'TWD_CARD', 'JPY_CASH', 'JPY_CARD'] as Currency[])
              ).map(c => <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>)}
            </select>
          </div>

          {/* 金額 */}
          <div className="form-group">
            <label className="form-label">
              {isJpyCard ? '實際花費（日幣 ¥）' : currency === 'JPY_CASH' ? '金額（日幣 ¥）' : '金額（台幣 NT$）'}
              {currency === 'TWD_CARD' && <span style={{ color: 'var(--gray-400)', fontSize: 11, marginLeft: 4 }}>對帳單金額</span>}
            </label>
            <input className="form-input" type="number" min="0" step="1"
              placeholder="0" value={amountPrimary}
              style={errors.amount ? { borderColor: 'var(--red)' } : {}}
              onChange={e => { setAmountPrimary(e.target.value); setErrors(ev => ({ ...ev, amount: undefined })) }} />
            {errors.amount && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.amount}</div>}
          </div>

          {/* 信用卡台幣欄位 */}
          {isJpyCard && (
            <div className="form-group">
              <label className="form-label">信用卡收取台幣（NT$）</label>
              <input className="form-input" type="number" min="0" step="1"
                placeholder="0（填入對帳單金額）" value={amountSecondary}
                onChange={e => setAmountSecondary(e.target.value)} />
              {amountPrimary && amountSecondary && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                  匯率約 {(parseFloat(amountSecondary) / parseFloat(amountPrimary)).toFixed(3)} TWD/JPY
                </div>
              )}
            </div>
          )}

          <div className="form-row">
            {/* 分類 */}
            <div className="form-group">
              <label className="form-label">分類</label>
              <select className="form-select" value={category}
                style={errors.category ? { borderColor: 'var(--red)' } : {}}
                onChange={e => { setCategory(e.target.value); setErrors(ev => ({ ...ev, category: undefined })) }}>
                <option value="">選擇分類</option>
                {mode === 'personal' ? (
                  type === 'expense' ? (
                    <>
                      <optgroup label="日常支出">
                        {PERSONAL_CATEGORIES_EXPENSE.filter(c => !INVESTMENT_EXPENSE.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                      <optgroup label="📈 投資">
                        {INVESTMENT_EXPENSE.map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                    </>
                  ) : (
                    <>
                      <optgroup label="收入">
                        {PERSONAL_CATEGORIES_INCOME.filter(c => !INVESTMENT_INCOME.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                      <optgroup label="📈 投資收益">
                        {INVESTMENT_INCOME.map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                    </>
                  )
                ) : (
                  categories.map(c => <option key={c} value={c}>{c}</option>)
                )}
              </select>
              {errors.category && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.category}</div>}
            </div>

            {/* 日期 */}
            <div className="form-group">
              <label className="form-label">日期</label>
              <input className="form-input" type="date" value={date}
                onChange={e => setDate(e.target.value)} required />
            </div>
          </div>

          {/* 專案選擇（僅個人帳本） */}
          {mode === 'personal' && projects.length > 0 && (
            <div className="form-group">
              <label className="form-label">歸屬專案（選填）</label>
              <select className="form-select" value={projectId ?? ''} onChange={e => setProjectId(e.target.value ? parseInt(e.target.value) : undefined)}>
                <option value="">不歸屬專案（個人）</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {/* 備註 */}
          <div className="form-group">
            <label className="form-label">備註（選填）</label>
            <input className="form-input" type="text" placeholder="描述這筆交易..."
              value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary">儲存</button>
          </div>
        </form>
      </div>
    </div>
  )
}
