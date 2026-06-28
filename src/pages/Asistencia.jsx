import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getEstudiantesPorGrupo, getAsistenciaPorFechaYGrupo, guardarAsistencia } from '../services/pocketbase'
import { ToastContainer } from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'
import './Asistencia.css'

const ESTADOS = {
  presente: { label: 'Presente',  color: 'success', icon: '✓' },
  ausente:  { label: 'Ausente',   color: 'danger',  icon: '✕' },
  visita:   { label: 'Visita',    color: 'warning', icon: '★' },
}

export default function Asistencia() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { toasts, toast } = useToast()
  const [estudiantes, setEstudiantes] = useState([])
  const [asistencia, setAsistencia] = useState({}) // { estudianteId: 'presente'|'ausente'|'visita' }
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [yaGuardado, setYaGuardado] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [fecha])

  async function cargarDatos() {
    if (!usuario?.grupo) { setLoading(false); return; }
    setLoading(true)
    try {
      const [alumnos, registros] = await Promise.all([
        getEstudiantesPorGrupo(usuario.grupo),
        getAsistenciaPorFechaYGrupo(fecha, usuario.grupo)
      ])
      setEstudiantes(alumnos)

      setYaGuardado(registros.length > 0)

      // Armar mapa de asistencia existente
      const mapa = {}
      registros.forEach(r => { mapa[r.estudiante] = r.estado })

      // Poner "ausente" por defecto a los que no tienen registro
      alumnos.forEach(a => {
        if (!mapa[a.id]) mapa[a.id] = 'ausente'
      })
      setAsistencia(mapa)
      setLoading(false)
    } catch (e) {
      if (e.isAbort) return; // Ignorar peticiones canceladas por el navegador
      console.error(e);
      toast.error('Error cargando datos: ' + e.message)
      setLoading(false)
    }
  }

  function changeDate(days) {
    const d = new Date(fecha + 'T12:00:00') // Prevenir salto de zona horaria
    d.setDate(d.getDate() + days)
    setFecha(d.toISOString().split('T')[0])
  }

  function toggleEstado(estudianteId) {
    setAsistencia(prev => {
      const actual = prev[estudianteId] || 'ausente'
      const ciclo = { ausente: 'presente', presente: 'visita', visita: 'ausente' }
      return { ...prev, [estudianteId]: ciclo[actual] }
    })
  }

  function setEstado(estudianteId, estado) {
    setAsistencia(prev => ({ ...prev, [estudianteId]: estado }))
  }

  async function guardar() {
    setGuardando(true)
    try {
      const registros = estudiantes.map(e => {
        const data = {
          estudiante: e.id,
          grupo: usuario.grupo,
          fecha,
          estado: asistencia[e.id] || 'ausente',
        }
        if (usuario.rol !== 'sublider') data.registrado_por = usuario.id
        return data
      })
      await guardarAsistencia(registros)
      setYaGuardado(true)
      toast.success(yaGuardado ? 'Asistencia actualizada' : 'Asistencia guardada')
    } catch (e) {
      console.error("Error al guardar asistencia:", e.response?.data || e)
      const camposConError = Object.keys(e.response?.data || {}).join(', ')
      toast.error(camposConError ? `Error en: ${camposConError}` : 'Error guardando asistencia')
    } finally {
      setGuardando(false)
    }
  }

  const presentes = Object.values(asistencia).filter(e => e === 'presente').length
  const visitas   = Object.values(asistencia).filter(e => e === 'visita').length
  const total     = estudiantes.length

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ fontSize: '1.2rem' }}>
            ←
          </button>
          <h1 className="page-title">Asistencia</h1>
        </div>
      </div>

      {/* Selector de fecha */}
      <div className="fecha-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
        <button className="icon-btn" style={{ background: 'var(--c-surface2)' }} onClick={() => changeDate(-1)}>◀</button>
        <input
          type="date"
          className="input fecha-input"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          style={{ width: 'auto', margin: 0 }}
        />
        <button className="icon-btn" style={{ background: 'var(--c-surface2)' }} onClick={() => changeDate(1)}>▶</button>
      </div>

      {yaGuardado && !loading && estudiantes.length > 0 && (
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: 13 }}>✓ Asistencia registrada para este día</span>
        </div>
      )}

      {/* Resumen */}
      <div className="asist-resumen">
        <div className="resumen-stat">
          <span className="resumen-num" style={{color:'var(--c-success)'}}>{presentes}</span>
          <span className="resumen-label">Presentes</span>
        </div>
        <div className="resumen-divider" />
        <div className="resumen-stat">
          <span className="resumen-num" style={{color:'var(--c-warning)'}}>{visitas}</span>
          <span className="resumen-label">Visitas</span>
        </div>
        <div className="resumen-divider" />
        <div className="resumen-stat">
          <span className="resumen-num">{total}</span>
          <span className="resumen-label">Total</span>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" style={{width:32,height:32,borderWidth:3}} />
        </div>
      ) : estudiantes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◉</div>
          <div className="empty-state-text">No hay estudiantes en este grupo</div>
        </div>
      ) : (
        <div className="estudiantes-list anim-fade-in">
          {estudiantes.map((e, i) => {
            const estado = asistencia[e.id] || 'ausente'
            const info = ESTADOS[estado]
            return (
              <div
                key={e.id}
                className={`estudiante-row estado-${estado}`}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="estudiante-info" onClick={() => toggleEstado(e.id)}>
                  <div className="estudiante-avatar">
                    {e.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="estudiante-nombre">{e.nombre}</div>
                </div>

                <div className="estado-btns">
                  {Object.entries(ESTADOS).map(([key, val]) => (
                    <button
                      key={key}
                      className={`estado-btn estado-btn-${val.color} ${estado === key ? 'active' : ''}`}
                      onClick={() => setEstado(e.id, key)}
                      title={val.label}
                    >
                      {val.icon}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Botón guardar */}
      {!loading && estudiantes.length > 0 && (
        <div className="guardar-bar">
          <button
            className="btn btn-primary btn-full"
            onClick={guardar}
            disabled={guardando}
          >
            {guardando ? <span className="spinner" /> : `${yaGuardado ? 'Actualizar' : 'Guardar'} Asistencia (${presentes + visitas}/${total})`}
          </button>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}
