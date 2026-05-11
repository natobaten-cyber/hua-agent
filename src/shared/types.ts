export type Currency = 'TWD' | 'TWD_CARD' | 'JPY_CASH' | 'JPY_CARD'
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
  '餐飲', '交通', '購物', '娛樂', '住宿', '醫療', '日用品', '旅遊',
  '股票買入', '房貸', '基金', '其他投資',
  '其他'
]
export const PERSONAL_CATEGORIES_INCOME = [
  '薪資', '獎金', '兼職',
  '股票獲利', '股息', '基金獲利',
  '其他'
]

export const INVESTMENT_EXPENSE = ['股票買入', '房貸', '基金', '其他投資']
export const INVESTMENT_INCOME = ['股票獲利', '股息', '基金獲利']
export const PROJECT_CATEGORIES_INCOME = [
  '銷售收入', '外送收入', '活動收入', '其他收入'
]
export const PROJECT_CATEGORIES_EXPENSE = [
  '食材原料', '人事費用', '房租水電', '設備維護', '包裝耗材', '行銷費用', '交通運費', '其他支出'
]

export const CURRENCY_LABELS: Record<Currency, string> = {
  TWD: '台幣現金／轉帳',
  TWD_CARD: '台灣信用卡（刷台幣）',
  JPY_CASH: '日幣現金',
  JPY_CARD: '台灣信用卡（刷日幣）',
}
