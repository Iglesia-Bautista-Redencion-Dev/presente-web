import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getGrupos, getTodosEstudiantes, getUsuarios, getMaterias } from '../services/pocketbase'
import './AdminHome.css'

export default function AdminHome() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ materias: 0, grupos: 0, estudiantes: 0, lideres: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const [materias, grupos, estudiantes, usuarios] = await Promise.all([
          getMaterias(),
          getGrupos(),
          getTodosEstudiantes(),
          getUsuarios(),
        ])
        const lideres = usuarios.filter(u => u.rol === 'lider')
        setStats({ materias: materias.length, grupos: grupos.length, estudiantes: estudiantes.length, lideres: lideres.length })
      } catch {}
      finally { setLoading(false) }
    }
    cargar()
  }, [])

  const hoy = new Date().toLocaleDateString('es-DO', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  const acciones = [
    { icon: '📚', label: 'Materias',     desc: 'Gestionar áreas de estudio', path: '/admin/materias' },
    { icon: '◈', label: 'Grupos',      desc: 'Crear y gestionar grupos', path: '/admin/grupos' },
    { icon: '◉', label: 'Líderes',     desc: 'Administrar líderes',      path: '/admin/lideres' },
    { icon: '▣', label: 'Estadísticas',desc: 'Ver reportes de asistencia',path: '/admin/stats' },
    { icon: '✦', label: 'Estudiantes', desc: 'Ver todos los estudiantes', path: '/admin/estudiantes' },
  ]

  return (
    <div className="page">
      <div className="admin-home anim-fade-up">

        <div className="admin-greeting">
          <p className="lider-date">{hoy}</p>
          <h2 className="lider-name">Panel Admin</h2>
          <p style={{fontSize:13,color:'var(--c-text-2)',marginTop:4}}>{usuario?.nombre}</p>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          {[
            { num: stats.materias,     label: 'Materias',    color: 'var(--c-primary-d)' },
            { num: stats.grupos,      label: 'Grupos',      color: 'var(--c-primary)' },
            { num: stats.lideres,     label: 'Líderes',     color: 'var(--c-success)' },
            { num: stats.estudiantes, label: 'Estudiantes', color: 'var(--c-warning)' },
          ].map(s => (
            <div key={s.label} className="admin-stat-card">
              <span className="admin-stat-num" style={{color: s.color}}>
                {loading ? '—' : s.num}
              </span>
              <span className="admin-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Navegación */}
        <div className="admin-grid">
          {acciones.map(a => (
            <button key={a.path} className="admin-nav-card" onClick={() => navigate(a.path)}>
              <span className="admin-nav-icon">{a.icon}</span>
              <span className="admin-nav-label">{a.label}</span>
              <span className="admin-nav-desc">{a.desc}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
