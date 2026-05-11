import { Transaction, Currency } from '../../shared/types'

interface Props {
  tx: Transaction
  onDelete: (id: number) => void
}

const CATEGORY_ICONS: Record<string, string> = {
  '餐飲': '🍱', '交通': '🚌', '購物': '🛍️', '娛樂': '🎮', '住宿': '🏨',
  '醫療': '💊', '日用品': '🧴', '旅遊': '✈️', '薪資': '💼', '獎金': '🎁',
  '兼職': '💻', '材料': '🔧', '人力': '👷', '設備': '⚙️', '其他': '📌',
  '股票買入': '📉', '股票獲利': '📈', '股息': '💹', '基金': '🏦', '基金獲利': '💰', '房貸': '🏠', '其他投資': '📊',
}

const CURRENCY_BADGE: Record<Currency, { label: string; cls: string }> = {
  TWD: { label: 'NT$ 現金', cls: 'badge-twd' },
  TWD_CARD: { label: 'NT$ 信用卡', cls: 'badge-twd' },
  JPY_CASH: { label: '¥ 現金', cls: 'badge-jpy-cash' },
  JPY_CARD: { label: '¥ 信用卡', cls: 'badge-jpy-card' },
}

function formatAmount(amount: number, currency: Currency) {
  if (currency === 'TWD') return `NT$${amount.toLocaleString()}`
  return `¥${amount.toLocaleString()}`
}

export default function TransactionItem({ tx, onDelete }: Props) {
  const icon = CATEGORY_ICONS[tx.category] ?? '📌'
  const badge = CURRENCY_BADGE[tx.currency]
  const isIncome = tx.type === 'income'

  return (
    <div className="tx-item">
      <div className={`tx-icon ${tx.type}`}>{icon}</div>
      <div className="tx-info">
        <div className="tx-category">{tx.category}</div>
        <div className="tx-meta">
          <span>{tx.date}</span>
          <span className={`badge ${badge.cls}`}>{badge.label}</span>
          {tx.projectName && <span style={{ color: 'var(--blue)', fontWeight: 500 }}>{tx.projectName}</span>}
          {tx.note && <span>{tx.note}</span>}
        </div>
      </div>
      <div className="tx-amount">
        <div className={`tx-amount-main ${tx.type}`}>
          {isIncome ? '+' : '-'}{formatAmount(tx.amount_primary, tx.currency)}
        </div>
        {tx.currency === 'JPY_CARD' && tx.amount_secondary && (
          <div className="tx-amount-sub">≈ NT${tx.amount_secondary.toLocaleString()}</div>
        )}
      </div>
      <button className="btn btn-danger" style={{ marginLeft: 8, padding: '6px 8px' }}
        onClick={() => onDelete(tx.id)} title="刪除">✕</button>
    </div>
  )
}
