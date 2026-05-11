import { Transaction, Project, TransactionInput, Stats } from '../../shared/types'

const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function put(path: string, body: unknown): Promise<void> {
  const res = await fetch(BASE + path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(await res.text())
}

async function del(path: string): Promise<void> {
  const res = await fetch(BASE + path, { method: 'DELETE' })
  if (!res.ok) throw new Error(await res.text())
}

export const api = {
  transactions: {
    getAll: (filters?: { type?: string; projectId?: number }): Promise<Transaction[]> => {
      const params = new URLSearchParams()
      if (filters?.type) params.set('type', filters.type)
      if (filters?.projectId) params.set('projectId', String(filters.projectId))
      const qs = params.toString()
      return get<Transaction[]>(`/transactions${qs ? '?' + qs : ''}`)
    },
    add: (data: TransactionInput): Promise<number> =>
      post<{ id: number }>('/transactions', {
        ...data,
        amountPrimary: data.amountPrimary,
        amountSecondary: data.amountSecondary,
      }).then(r => r.id),
    update: (id: number, data: TransactionInput): Promise<boolean> =>
      put(`/transactions/${id}`, data).then(() => true),
    delete: (id: number): Promise<boolean> =>
      del(`/transactions/${id}`).then(() => true),
  },
  projects: {
    getAll: (): Promise<Project[]> =>
      get<Project[]>('/projects'),
    add: (data: { name: string; budget?: number; note?: string }): Promise<number> =>
      post<{ id: number }>('/projects', data).then(r => r.id),
    update: (id: number, data: { name: string; budget?: number; note?: string }): Promise<boolean> =>
      put(`/projects/${id}`, data).then(() => true),
    delete: (id: number): Promise<boolean> =>
      del(`/projects/${id}`).then(() => true),
  },
  stats: {
    getSummary: (): Promise<Stats> =>
      get<Stats>('/stats/summary'),
  },
}
