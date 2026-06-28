import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './BottomNav.css'

const NAV_ADMIN = [
  { path: '/admin',            icon: '⊞', label: 'Inicio'      },
  { path: '/admin/grupos',     icon: '◈', label: 'Grupos'      },
  { path: '/admin/lideres',    icon: '◉', label: 'Líderes'     },
  { path: '/admin/stats',      icon: '▣', label: 'Stats'       },
]

const NAV_LIDER = [
  { path: '/lider',            icon: '⊞', label: 'Inicio'      },
  { path: '/lider/asistencia', icon: '✓', label: 'Asistencia'  },
  { path: '/lider/estudiantes',icon: '◉', label: 'Estudiantes' },
]

const NAV_SUBLIDER = [
  { path: '/lider/asistencia', icon: '✓', label: 'Asistencia'  },
]

export function BottomNav() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!usuario) return null

  const items = ['admin', 'director'].includes(usuario.rol) ? NAV_ADMIN : usuario.rol === 'sublider' ? NAV_SUBLIDER : NAV_LIDER

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
      <button className="nav-item" onClick={logout}>
        <span className="nav-icon">⎋</span>
        <span className="nav-label">Salir</span>
      </button>
    </nav>
  )
}
