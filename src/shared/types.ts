export type Currency = 'TWD' | 'JPY_CASH' | 'JPY_CARD'
export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: number
  date: string
  type: TransactionType
  currency: Currency
  amount_primary: number
  amount_secondary: number | null
  category: string
  note: string | null
  project_id: number | null
  projectName: string | null
  created_at: string
}

export interface Project {
  id: number
  name: string
  budget: number | null
  note: string | null
  created_at: string
}

export interface TransactionInput {
  date: string
  type: TransactionType
  currency: Currency
  amountPrimary: number
  amountSecondary?: number
  category: string
  note?: string
  projectId?: number
}

export interface Stats {
  personalIncome: number
  personalExpense: number
  monthlyExpenses: { month: string; total: number }[]
  categoryStats: { category: string; total: number; count: number }[]
  projectStats: { id: number; name: string; budget: number | null; spent: number }[]
}

export const PERSONAL_CATEGORIES_EXPENSE = [
  '餐飲', '交通', '購物', '娛樂', '住宿', '醫療', '日用品', '旅遊', '其他'
]
export const PERSONAL_CATEGORIES_INCOME = [
  '薪資', '獎金', '投資', '兼職', '其他'
]
export const PROJECT_CATEGORIES_INCOME = [
  '銷售收入', '外送收入', '活動收入', '其他收入'
]
export const PROJECT_CATEGORIES_EXPENSE = [
  '食材原料', '人事費用', '房租水電', '設備維護', '包裝耗材', '行銷費用', '交通運費', '其他支出'
]

export const CURRENCY_LABELS: Record<Currency, string> = {
  TWD: '台幣 (TWD)',
  JPY_CASH: '日幣現金 (JPY)',
  JPY_CARD: '日幣信用卡',
}
