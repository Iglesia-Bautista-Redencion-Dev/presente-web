import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGrupos, crearGrupo, actualizarGrupo, eliminarGrupo, getUsuarios, getMaterias } from '../services/pocketbase'
import { ToastContainer } from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'

export default function AdminGrupos() {
  const { toasts, toast } = useToast()
  const [grupos, setGrupos] = useState([])
  const [lideres, setLideres] = useState([])
  const [materias, setMaterias] = useState([])
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', lider: '', materia: '' })
  const [guardando, setGuardando] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  const toggle = (id) => setExpanded(p => ({...p, [id]: !p[id]}))

  async function cargar() {
    setLoading(true)
    try {
      const [g, u, m] = await Promise.all([getGrupos(), getUsuarios(), getMaterias()])
      setGrupos(g)
      setLideres(u.filter(x => x.rol === 'lider'))
      setMaterias(m)
      setLoading(false)
    } catch (e) { 
      if (e.isAbort) return;
      console.error(e)
      toast.error('Error cargando grupos: ' + e.message) 
      setLoading(false)
    }
  }

  function abrir(grupo = null, materiaId = '') {
    setForm(grupo
      ? { nombre: grupo.nombre, descripcion: grupo.descripcion || '', lider: grupo.lider || '', materia: grupo.materia || '' }
      : { nombre: '', descripcion: '', lider: '', materia: materiaId }
    )
    setModal(grupo || 'nuevo')
  }

  async function guardar() {
    if (!form.nombre.trim()) { toast.error('Nombre requerido'); return }
    setGuardando(true)
    try {
      if (modal === 'nuevo') { await crearGrupo(form); toast.success('Grupo creado') }
      else { await actualizarGrupo(modal.id, form); toast.success('Grupo actualizado') }
      await cargar(); setModal(null)
    } catch { toast.error('Error guardando') }
    finally { setGuardando(false) }
  }

  async function eliminar(g) {
    if (!confirm(`¿Eliminar el grupo "${g.nombre}"?`)) return
    try { await eliminarGrupo(g.id); toast.success('Grupo eliminado'); await cargar() }
    catch { toast.error('Error eliminando') }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ fontSize: '1.2rem' }}>←</button>
          <h1 className="page-title">Grupos</h1>
        </div>
        <button className="btn btn-primary" style={{padding:'10px 16px'}} onClick={() => abrir()}>
          + Nuevo
        </button>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:48}}>
          <div className="spinner" style={{width:32,height:32,borderWidth:3}} />
        </div>
      ) : grupos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◈</div>
          <div className="empty-state-text">No hay grupos aún</div>
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
                    {gruposM.length === 0 && <div style={{fontSize:13, color:'var(--c-text-3)', padding:'0 4px'}}>Sin grupos en esta materia</div>}
                    {gruposM.map((g, i) => {
                      const liderObj = lideres.find(l => l.id === g.lider)
                      return (
                        <div key={g.id} className="card" style={{animationDelay:`${i*0.04}s`,animation:'fadeUp 0.3s ease both', padding:'12px 16px'}}>
                          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:15,fontWeight:600,marginBottom:4}}>{g.nombre}</div>
                              {g.descripcion && <div style={{fontSize:13,color:'var(--c-text-2)',marginBottom:6}}>{g.descripcion}</div>}
                              {liderObj && <span className="badge badge-primary">Líder: {liderObj.nombre}</span>}
                            </div>
                            <div style={{display:'flex',gap:8,flexShrink:0}}>
                              <button className="icon-btn" onClick={() => abrir(g)}>✎</button>
                              <button className="icon-btn icon-btn-danger" onClick={() => eliminar(g)}>✕</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <button className="btn btn-secondary" style={{padding:'8px', fontSize:13, marginTop:4}} onClick={() => abrir(null, m.id)}>+ Añadir grupo a {m.nombre}</button>
                  </div>
                )}
              </div>
            )
          })}

          {grupos.filter(g => !g.materia).length > 0 && (
             <div style={{background:'var(--c-surface2)', borderRadius:'var(--radius-md)', padding:4}}>
                <div onClick={() => toggle('sin')} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',cursor:'pointer'}}>
                  <span style={{fontWeight:600,color:'var(--c-text-2)'}}>▣ Grupos sin materia</span>
                  <span style={{color:'var(--c-text-3)'}}>{expanded['sin'] ? '▼' : '▶'}</span>
                </div>
                {expanded['sin'] && (
                  <div style={{padding:'8px 12px 12px', display:'flex', flexDirection:'column', gap:10}}>
                    {grupos.filter(g => !g.materia).map((g, i) => (
                      <div key={g.id} className="card" style={{padding:'12px 16px'}}>
                        <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:600}}>{g.nombre}</span> <button className="icon-btn" onClick={() => abrir(g)}>✎</button></div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          )}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">{modal === 'nuevo' ? 'Nuevo Grupo' : 'Editar Grupo'}</div>
            <div className="form-group">
              <label className="label">Nombre *</label>
              <input className="input" placeholder="Nombre del grupo" value={form.nombre}
                onChange={e => setForm(p => ({...p, nombre: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="label">Materia</label>
              <select className="input select" value={form.materia}
                onChange={e => setForm(p => ({...p, materia: e.target.value}))}>
                <option value="">Sin materia</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Descripción</label>
              <input className="input" placeholder="Descripción opcional" value={form.descripcion}
                onChange={e => setForm(p => ({...p, descripcion: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="label">Líder asignado</label>
              <select className="input select" value={form.lider}
                onChange={e => setForm(p => ({...p, lider: e.target.value}))}>
                <option value="">Sin líder</option>
                {lideres.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
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
