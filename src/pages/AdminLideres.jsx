import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsuarios, crearUsuario, actualizarUsuario, getGrupos, getMaterias } from '../services/pocketbase'
import { ToastContainer } from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'

const ROLES_IGLESIA = ['Líder', 'Maestro', 'Pastor', 'Diácono', 'Otro']

export default function AdminLideres() {
  const { toasts, toast } = useToast()
  const [usuarios, setUsuarios] = useState([])
  const [grupos, setGrupos] = useState([])
  const [materias, setMaterias] = useState([])
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ nombre: '', cedula: '', pin: '', rol: 'lider', rol_iglesia: 'Líder', grupo: '' })
  const [guardando, setGuardando] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  const toggle = (id) => setExpanded(p => ({...p, [id]: !p[id]}))

  async function cargar() {
    setLoading(true)
    try {
      const [u, g, m] = await Promise.all([getUsuarios(), getGrupos(), getMaterias()])
      setUsuarios(u)
      setGrupos(g)
      setMaterias(m)
      setLoading(false)
    } catch (e) { 
      if (e.isAbort) return;
      console.error(e)
      toast.error('Error cargando líderes: ' + e.message) 
      setLoading(false)
    }
  }

  function abrir(usuario = null, grupoId = '') {
    setForm(usuario
      ? { nombre: usuario.nombre, cedula: usuario.cedula, pin: usuario.pin, rol: usuario.rol, rol_iglesia: usuario.rol_iglesia || 'Líder', grupo: usuario.grupo || '' }
      : { nombre: '', cedula: '', pin: '', rol: 'lider', rol_iglesia: 'Líder', grupo: grupoId }
    )
    setModal(usuario || 'nuevo')
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.cedula.trim() || !form.pin.trim()) {
      toast.error('Nombre, cédula y PIN son requeridos'); return
    }
    setGuardando(true)
    try {
      if (modal === 'nuevo') { await crearUsuario({ ...form, activo: true }); toast.success('Líder creado') }
      else { await actualizarUsuario(modal.id, form); toast.success('Líder actualizado') }
      await cargar(); setModal(null)
    } catch { toast.error('Error guardando') }
    finally { setGuardando(false) }
  }

  async function toggleActivo(u) {
    try {
      await actualizarUsuario(u.id, { activo: !u.activo })
      toast.success(u.activo ? 'Líder desactivado' : 'Líder activado')
      await cargar()
    } catch { toast.error('Error') }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ fontSize: '1.2rem' }}>←</button>
          <h1 className="page-title">Líderes</h1>
        </div>
        <button className="btn btn-primary" style={{padding:'10px 16px'}} onClick={() => abrir()}>+ Nuevo</button>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:48}}>
          <div className="spinner" style={{width:32,height:32,borderWidth:3}} />
        </div>
      ) : usuarios.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◉</div>
          <div className="empty-state-text">No hay líderes aún</div>
        </div>
      ) : (
        <div className="anim-fade-in" style={{display:'flex',flexDirection:'column',gap:16}}>
          {materias.map(m => {
            const gruposM = grupos.filter(g => g.materia === m.id)
            return (
              <div key={m.id} style={{background:'var(--c-surface2)', borderRadius:'var(--radius-md)', padding:4}}>
                <div onClick={() => toggle(m.id)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',cursor:'pointer'}}>
                  <span style={{fontWeight:600,color:'var(--c-primary)'}}>📚 {m.nombre}</span>
                  <span style={{color:'var(--c-text-3)'}}>{expanded[m.id] ? '▼' : '▶'}</span>
                </div>
                {expanded[m.id] && (
                  <div style={{padding:'8px 12px 12px', display:'flex', flexDirection:'column', gap:10}}>
                    {gruposM.length === 0 && <div style={{fontSize:13, color:'var(--c-text-3)', padding:'0 4px'}}>Sin grupos asignados</div>}
                    {gruposM.map(g => {
                      const lideresG = usuarios.filter(u => u.grupo === g.id)
                      return (
                        <div key={g.id} style={{border:'1px solid var(--c-border)', borderRadius:'var(--radius-md)'}}>
                          <div onClick={() => toggle(g.id)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',cursor:'pointer',background:'var(--c-surface)', borderRadius:'var(--radius-md)'}}>
                            <span style={{fontWeight:600}}>◈ {g.nombre} <span style={{color:'var(--c-text-3)', fontWeight:400}}>({lideresG.length})</span></span>
                            <span style={{color:'var(--c-text-3)', fontSize:12}}>{expanded[g.id] ? '▼' : '▶'}</span>
                          </div>
                          {expanded[g.id] && (
                            <div style={{padding:'8px 12px 12px', display:'flex', flexDirection:'column', gap:8, background:'var(--c-bg)'}}>
                              {lideresG.length === 0 && <div style={{fontSize:13, color:'var(--c-text-3)'}}>No hay líderes en este grupo</div>}
                              {lideresG.map(u => (
                                <div key={u.id} className="card" style={{padding:'12px 14px', opacity: u.activo ? 1 : 0.5}}>
                                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                                    <div>
                                      <div style={{fontWeight:600}}>{u.nombre}</div>
                                      <div style={{fontSize:12,color:'var(--c-text-3)',fontFamily:'var(--font-mono)'}}>{u.cedula}</div>
                                      <span className="badge badge-primary" style={{marginTop:6}}>{u.rol_iglesia || 'Líder'}</span>
                                      {['admin', 'director'].includes(u.rol) && <span className="badge badge-warning" style={{marginLeft:6}}>Sys: {u.rol}</span>}
                                      {!u.activo && <span className="badge badge-danger" style={{marginLeft:6}}>Inactivo</span>}
                                    </div>
                                    <div style={{display:'flex',gap:4}}>
                                      <button className="icon-btn" onClick={() => abrir(u)}>✎</button>
                                      <button className="icon-btn" onClick={() => toggleActivo(u)}>{u.activo ? '○' : '●'}</button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <button className="btn btn-secondary" style={{padding:'6px', fontSize:12, marginTop:4}} onClick={() => abrir(null, g.id)}>+ Añadir líder a {g.nombre}</button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">{modal === 'nuevo' ? 'Nuevo Líder' : 'Editar Líder'}</div>

            <div className="form-group">
              <label className="label">Nombre completo *</label>
              <input className="input" value={form.nombre} placeholder="Nombre"
                onChange={e => setForm(p => ({...p, nombre: e.target.value}))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Cédula *</label>
                <input className="input" value={form.cedula} placeholder="Cédula"
                  onChange={e => setForm(p => ({...p, cedula: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="label">PIN *</label>
                <input className="input" type="password" value={form.pin} placeholder="PIN"
                  maxLength={6} onChange={e => setForm(p => ({...p, pin: e.target.value}))} />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Acceso al Sistema</label>
              <select className="input select" value={form.rol}
                onChange={e => setForm(p => ({...p, rol: e.target.value}))}>
                <option value="lider">Líder (App móvil)</option>
                <option value="director">Director (Panel Admin)</option>
                <option value="admin">Administrador (Total)</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Rol en iglesia</label>
                <select className="input select" value={form.rol_iglesia}
                  onChange={e => setForm(p => ({...p, rol_iglesia: e.target.value}))}>
                  {ROLES_IGLESIA.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Grupo</label>
                <select className="input select" value={form.grupo}
                  onChange={e => setForm(p => ({...p, grupo: e.target.value}))}>
                  <option value="">Sin grupo</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
            </div>

            <div style={{display:'flex',gap:10,marginTop:8}}>
              <button className="btn btn-secondary" style={{flex:1}} onClick={() => setModal(null)}>Cancelar</button>
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
