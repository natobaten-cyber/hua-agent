import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from './hooks/useApi'
import { Project } from '../shared/types'
import Dashboard from './pages/Dashboard'
import Personal from './pages/Personal'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Reports from './pages/Reports'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsOpen, setProjectsOpen] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [location.pathname]) // 每次換頁都重新拉，確保新增後側欄同步

  async function loadProjects() {
    const ps = await api.projects.getAll()
    setProjects(ps)
  }

  const isProjectActive = location.pathname.startsWith('/projects')

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>💰</span> 花帳
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">總覽</div>
          <NavLink to="/" end className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <span className="icon">📊</span> 儀表板
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">帳本</div>
          <NavLink to="/personal" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <span className="icon">👤</span> 個人帳本
          </NavLink>

          {/* 專案帳本可展開 */}
          <button
            className={`sidebar-item ${isProjectActive ? 'active' : ''}`}
            onClick={() => setProjectsOpen(o => !o)}
            style={{ width: '100%' }}
          >
            <span className="icon">📁</span>
            <span style={{ flex: 1, textAlign: 'left' }}>專案帳本</span>
            <span style={{ fontSize: 11, color: 'var(--gray-400)', transition: 'transform 0.2s', transform: projectsOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
          </button>

          {projectsOpen && (
            <div style={{ paddingLeft: 12 }}>
              {projects.map(p => (
                <NavLink
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  style={{ fontSize: 13, paddingLeft: 10 }}
                >
                  <span className="icon" style={{ fontSize: 13 }}>🏪</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                </NavLink>
              ))}
              <NavLink
                to="/projects"
                end
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                style={{ fontSize: 12, paddingLeft: 10, color: 'var(--gray-400)' }}
              >
                <span className="icon" style={{ fontSize: 12 }}>＋</span> 管理帳本
              </NavLink>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: '16px 12px 20px' }}>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => navigate('/personal?new=1')}>
            + 新增記錄
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/personal" element={<Personal />} />
          <Route path="/projects" element={<Projects onProjectsChange={loadProjects} />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  )
}
