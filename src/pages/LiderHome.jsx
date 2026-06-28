import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './LiderHome.css'

export default function LiderHome() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const hoy = new Date().toLocaleDateString('es-DO', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <div className="page">
      <div className="lider-home anim-fade-up">

        {/* Saludo */}
        <div className="lider-greeting">
          <p className="lider-date">{hoy}</p>
          <h2 className="lider-name">Hola, {usuario?.nombre?.split(' ')[0]} 👋</h2>
          <p className="lider-role-badge">
            <span className="badge badge-primary">{usuario?.rol_iglesia || 'Líder'}</span>
          </p>
        </div>

        {/* Acciones rápidas */}
        <div className="quick-actions">
          <button
            className="quick-card quick-card-primary"
            onClick={() => navigate('/lider/asistencia')}
          >
            <span className="quick-icon">✓</span>
            <div>
              <div className="quick-title">Tomar Asistencia</div>
              <div className="quick-desc">Registrar asistencia de hoy</div>
            </div>
          </button>

          <button
            className="quick-card"
            onClick={() => navigate('/lider/estudiantes')}
          >
            <span className="quick-icon">◉</span>
            <div>
              <div className="quick-title">Mis Estudiantes</div>
              <div className="quick-desc">Ver y gestionar tu grupo</div>
            </div>
          </button>
        </div>

        {/* Info del grupo */}
        {usuario?.grupo_nombre && (
          <div className="card lider-group-card">
            <div className="lider-group-label">Tu grupo</div>
            <div className="lider-group-name">{usuario.grupo_nombre}</div>
          </div>
        )}

      </div>
    </div>
  )
}
