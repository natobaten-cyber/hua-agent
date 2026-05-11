import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../hooks/useApi'
import { Project } from '../../shared/types'

interface ProjectFormData { name: string; note: string }

interface Props {
  onProjectsChange?: () => void
}

export default function Projects({ onProjectsChange }: Props) {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ProjectFormData>({ name: '', note: '' })
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  useEffect(() => { loadProjects() }, [])

  async function loadProjects() {
    const ps = await api.projects.getAll()
    setProjects(ps)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = { name: form.name, note: form.note || undefined }
    if (editingProject) {
      await api.projects.update(editingProject.id, data)
    } else {
      const newId = await api.projects.add(data)
      onProjectsChange?.()
      navigate(`/projects/${newId}`)
      return
    }
    setShowForm(false)
    setEditingProject(null)
    setForm({ name: '', note: '' })
    loadProjects()
    onProjectsChange?.()
  }

  async function handleDelete(id: number) {
    if (!confirm('刪除此帳本將同時刪除所有記錄，確定繼續？')) return
    await api.projects.delete(id)
    loadProjects()
    onProjectsChange?.()
  }

  function openEdit(p: Project) {
    setEditingProject(p)
    setForm({ name: p.name, note: p.note ?? '' })
    setShowForm(true)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">管理帳本</div>
          <div className="page-subtitle">新增、編輯或刪除專案帳本</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingProject(null); setForm({ name: '', note: '' }); setShowForm(true) }}>
          + 新增帳本
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">🏪</div>
            <p>尚無帳本，點擊「新增帳本」開始</p>
          </div>
        </div>
      ) : (
        <div className="card-grid card-grid-2">
          {projects.map(p => (
            <div key={p.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 4 }}>
                    🏪 {p.name}
                  </div>
                  {p.note && <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>{p.note}</div>}
                  <div style={{ fontSize: 12, color: 'var(--gray-300)', marginTop: 6 }}>建立於 {p.created_at.slice(0, 10)}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost" style={{ padding: '4px 8px' }}
                    onClick={e => { e.stopPropagation(); openEdit(p) }}>✏️</button>
                  <button className="btn btn-danger" style={{ padding: '4px 8px' }}
                    onClick={e => { e.stopPropagation(); handleDelete(p.id) }}>✕</button>
                </div>
              </div>
              <div style={{ marginTop: 12, color: 'var(--blue)', fontSize: 13, fontWeight: 500 }}>
                點擊查看收支 →
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-title">{editingProject ? '編輯帳本' : '新增帳本'}</div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">帳本名稱</label>
                <input className="form-input" type="text" placeholder="例：飲料店一號、咖啡廳"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">備註（選填）</label>
                <input className="form-input" type="text" placeholder="描述這個帳本..."
                  value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>取消</button>
                <button type="submit" className="btn btn-primary">儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
