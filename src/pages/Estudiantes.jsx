import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getEstudiantesPorGrupo, crearEstudiante, actualizarEstudiante, inactivarEstudiante, getAsistenciaPorEstudiante } from '../services/pocketbase'
import { ToastContainer } from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'
import './Estudiantes.css'

export default function Estudiantes() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { toasts, toast } = useToast()
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null) // null | 'nuevo' | { ...estudiante }
  const [modalStats, setModalStats] = useState(null)
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const [form, setForm] = useState({ nombre: '', cedula: '', telefono: '', pin: '', rol_iglesia: '' })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    if (!usuario?.grupo) { setLoading(false); return; }
    setLoading(true)
    try {
      const data = await getEstudiantesPorGrupo(usuario.grupo, true)
      setLista(data)
      setLoading(false)
    } catch (e) {
      if (e.isAbort) return;
      console.error(e)
      toast.error('Error cargando estudiantes: ' + e.message)
      setLoading(false)
    }
  }

  async function verStats(e) {
    setModalStats({ estudiante: e, loading: true, data: [] })
    try {
      const data = await getAsistenciaPorEstudiante(e.id)
      setModalStats({ estudiante: e, loading: false, data })
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar historial')
      setModalStats(null)
    }
  }

  function abrirNuevo() {
    setForm({ nombre: '', cedula: '', telefono: '', pin: '', rol_iglesia: '' })
    setModal('nuevo')
  }

  function abrirEditar(e) {
    setForm({ nombre: e.nombre, cedula: e.cedula || '', telefono: e.telefono || '', pin: e.pin || '', rol_iglesia: e.rol_iglesia || '' })
    setModal(e)
  }

  function cerrarModal() { setModal(null) }

  async function guardar() {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return }
    setGuardando(true)
    try {
      if (modal === 'nuevo') {
        await crearEstudiante({ ...form, grupo: usuario.grupo, activo: true })
        toast.success('Estudiante agregado')
      } else {
        await actualizarEstudiante(modal.id, form)
        toast.success('Estudiante actualizado')
      }
      await cargar()
      cerrarModal()
    } catch (e) {
      console.error("Error al guardar estudiante:", e.response?.data || e)
      const camposConError = Object.keys(e.response?.data || {}).join(', ')
      toast.error(camposConError ? `Error en: ${camposConError}` : 'Error guardando')
    } finally {
      setGuardando(false)
    }
  }

  async function toggleActivo(e) {
    const accion = e.activo ? 'Inactivar' : 'Activar'
    if (!confirm(`¿${accion} a ${e.nombre}?`)) return
    try {
      await actualizarEstudiante(e.id, { activo: !e.activo })
      toast.success(e.activo ? 'Estudiante inactivado' : 'Estudiante reactivado')
      await cargar()
    } catch {
      toast.error('Error')
    }
  }

  const filtrados = lista.filter(e => {
    if (!mostrarInactivos && !e.activo) return false
    return e.nombre.toLowerCase().includes(busqueda.toLowerCase())
  })

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ fontSize: '1.2rem' }}>
            ←
          </button>
          <h1 className="page-title">Estudiantes</h1>
        </div>
        <button className="btn btn-primary" style={{padding:'10px 16px'}} onClick={abrirNuevo}>
          + Agregar
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: 16 }}>
        <input className="input" placeholder="Buscar estudiante..." value={busqueda}
          onChange={e => setBusqueda(e.target.value)} style={{ flex: 1 }} />
        <button className={`btn ${mostrarInactivos ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMostrarInactivos(!mostrarInactivos)} style={{ padding: '0 14px', fontSize: 13 }}>
          {mostrarInactivos ? 'Ocultar inactivos' : 'Ver inactivos'}
        </button>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:48}}>
          <div className="spinner" style={{width:32,height:32,borderWidth:3}} />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◉</div>
          <div className="empty-state-text">
            {busqueda ? 'Sin resultados' : 'Aún no hay estudiantes'}
          </div>
        </div>
      ) : (
        <div className="est-list anim-fade-in">
          <div className="est-count">{filtrados.length} estudiante{filtrados.length !== 1 ? 's' : ''}</div>
          {filtrados.map((e, i) => (
            <div key={e.id} className="est-card" style={{animationDelay:`${i*0.04}s`, opacity: e.activo ? 1 : 0.6}}>
              <div className="est-avatar">{e.nombre.charAt(0).toUpperCase()}</div>
              <div className="est-info">
                <div className="est-nombre">{e.nombre}</div>
                {e.cedula && <div className="est-cedula">{e.cedula}</div>}
              </div>
              <div className="est-actions">
                <button className="icon-btn" onClick={() => verStats(e)} title="Ver historial">📊</button>
                {!e.activo && <span className="badge badge-danger" style={{marginRight:8}}>Inactivo</span>}
                {e.rol_iglesia === 'Invitado' && <span className="badge badge-success" style={{marginRight:8}}>Invitado</span>}
              {e.pin && <span className="badge badge-warning" style={{marginRight:8}}>{e.rol_iglesia || 'Sub-líder'}</span>}
                <button className="icon-btn" onClick={() => abrirEditar(e)} title="Editar">✎</button>
                <button className={`icon-btn ${e.activo ? 'icon-btn-danger' : ''}`} onClick={() => toggleActivo(e)} title={e.activo ? 'Inactivar' : 'Activar'}>{e.activo ? '✕' : '✓'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Historial de Asistencia */}
      {modalStats && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalStats(null)}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title" style={{marginBottom: 8}}>Asistencia</div>
            <div style={{fontSize: 15, fontWeight: 600, color: 'var(--c-primary)', marginBottom: 16}}>{modalStats.estudiante.nombre}</div>
            
            {modalStats.loading ? (
              <div style={{display:'flex',justifyContent:'center',padding:32}}><div className="spinner" /></div>
            ) : (
              <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: '4px' }}>
                {modalStats.data.length === 0 ? (
                  <p style={{color: 'var(--c-text-3)', textAlign: 'center', padding: '20px 0'}}>No hay registros de asistencia</p>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    {modalStats.data.map(r => (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--c-surface2)', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--c-text-2)'}}>{r.fecha}</span>
                        <span className={`badge badge-${r.estado === 'presente' ? 'success' : r.estado === 'visita' ? 'warning' : 'danger'}`}>
                          {r.estado === 'presente' ? '✓ Presente' : r.estado === 'visita' ? '★ Visita' : '✕ Ausente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button className="btn btn-secondary btn-full" style={{marginTop: 24}} onClick={() => setModalStats(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && cerrarModal()}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">
              {modal === 'nuevo' ? 'Nuevo Estudiante' : 'Editar Estudiante'}
            </div>

            <div className="form-group">
              <label className="label">Nombre completo *</label>
              <input className="input" placeholder="Nombre" value={form.nombre}
                onChange={e => setForm(p => ({...p, nombre: e.target.value}))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Cédula</label>
                <input className="input" placeholder="000-0000000-0" value={form.cedula}
                  onChange={e => setForm(p => ({...p, cedula: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="label">Teléfono</label>
                <input className="input" type="tel" placeholder="809-000-0000" value={form.telefono}
                  onChange={e => setForm(p => ({...p, telefono: e.target.value}))} />
              </div>
            </div>
          
          <div className="divider" style={{margin:'20px 0 12px'}} />
          <div style={{fontSize:13,color:'var(--c-text-2)',marginBottom:12}}>Permisos (Opcional: Permite al estudiante tomar asistencia)</div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Rol / Cargo</label>
              <select className="input select" value={form.rol_iglesia}
                onChange={e => setForm(p => ({...p, rol_iglesia: e.target.value}))}>
                <option value="">Estudiante regular</option>
                <option value="Maestro">Maestro</option>
                <option value="Pastor">Pastor</option>
                <option value="Invitado">Invitado / Visita</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">PIN de acceso</label>
              <input className="input" type="password" placeholder="PIN secreto" maxLength={6} value={form.pin}
                onChange={e => setForm(p => ({...p, pin: e.target.value}))} />
            </div>
          </div>

            <div style={{display:'flex',gap:10,marginTop:8}}>
              <button className="btn btn-secondary" style={{flex:1}} onClick={cerrarModal}>Cancelar</button>
              <button className="btn btn-primary" style={{flex:2}} onClick={guardar} disabled={guardando}>
                {guardando ? <span className="spinner"/> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}
