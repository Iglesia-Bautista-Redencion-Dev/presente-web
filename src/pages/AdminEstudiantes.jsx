import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTodosEstudiantes, getGrupos, actualizarEstudiante, getMaterias, getUsuarios } from '../services/pocketbase'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/ToastContainer'

export default function AdminEstudiantes() {
  const { toasts, toast } = useToast()
  const [lista, setLista] = useState([])
  const [grupos, setGrupos] = useState([])
  const [materias, setMaterias] = useState([])
  const [lideres, setLideres] = useState([])
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  const toggle = (id) => setExpanded(p => ({...p, [id]: !p[id]}))

  async function cargar() {
    setLoading(true)
    try {
      const [e, g, m, u] = await Promise.all([getTodosEstudiantes(), getGrupos(), getMaterias(), getUsuarios()])
      setLista(e)
      setGrupos(g)
      setMaterias(m)
      setLideres(u.filter(x => x.rol === 'lider'))
      setLoading(false)
    } catch (e) { 
      if (e.isAbort) return;
      console.error(e)
      toast.error('Error cargando estudiantes: ' + e.message) 
      setLoading(false)
    }
  }

  async function moverGrupo() {
    if (!modal) return
    setGuardando(true)
    try {
      await actualizarEstudiante(modal.id, { grupo: modal.nuevoGrupo })
      toast.success('Estudiante movido')
      await cargar(); setModal(null)
    } catch { toast.error('Error') }
    finally { setGuardando(false) }
  }

  const filtrados = lista.filter(e => {
    const matchBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase())
    return matchBusqueda
  })

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ fontSize: '1.2rem' }}>←</button>
          <h1 className="page-title">Estudiantes</h1>
        </div>
      </div>

      <input className="input" placeholder="Buscar..." value={busqueda}
        onChange={e => setBusqueda(e.target.value)} style={{marginBottom:16}} />

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:48}}>
          <div className="spinner" style={{width:32,height:32,borderWidth:3}} />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◉</div>
          <div className="empty-state-text">Sin resultados</div>
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
                    {gruposM.map(g => {
                      const estG = filtrados.filter(e => e.grupo === g.id)
                      if (busqueda && estG.length === 0) return null;
                      const liderObj = lideres.find(l => l.grupo === g.id || l.id === g.lider)
                      
                      return (
                        <div key={g.id} style={{border:'1px solid var(--c-border)', borderRadius:'var(--radius-md)'}}>
                          <div onClick={() => toggle(g.id)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',cursor:'pointer',background:'var(--c-surface)', borderRadius:'var(--radius-md)'}}>
                            <span style={{fontWeight:600}}>◈ {g.nombre} {liderObj && <span style={{fontWeight:400, color:'var(--c-primary)', fontSize:12, marginLeft:4}}>(Líder: {liderObj.nombre})</span>}</span>
                            <span style={{color:'var(--c-text-3)', fontSize:12}}>{expanded[g.id] ? '▼' : '▶'}</span>
                          </div>
                          {expanded[g.id] && (
                            <div style={{padding:'8px 12px 12px', display:'flex', flexDirection:'column', gap:8, background:'var(--c-bg)'}}>
                              {estG.length === 0 && <div style={{fontSize:13, color:'var(--c-text-3)'}}>Sin estudiantes</div>}
                              {estG.map(e => (
                                <div key={e.id} className="card" style={{padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', background: e.rol_iglesia === 'Invitado' ? 'rgba(67, 233, 123, 0.05)' : 'var(--c-surface)', borderColor: e.rol_iglesia === 'Invitado' ? 'rgba(67, 233, 123, 0.3)' : 'var(--c-border)'}}>
                                  <div>
                                    <span style={{fontWeight:500, fontSize:14}}>{e.nombre}</span>
                                    {e.rol_iglesia === 'Invitado' && <span className="badge badge-success" style={{marginLeft:8, fontSize:10, padding:'2px 6px'}}>Invitado</span>}
                                  </div>
                                  <button className="icon-btn" onClick={() => setModal({...e, nuevoGrupo: e.grupo})} title="Mover de grupo">⇄</button>
                                </div>
                              ))}
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

      {/* Modal mover grupo */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">Mover a otro grupo</div>
            <p style={{fontSize:14,color:'var(--c-text-2)',marginBottom:16}}>{modal.nombre}</p>
            <div className="form-group">
              <label className="label">Grupo destino</label>
              <select className="input select" value={modal.nuevoGrupo}
                onChange={e => setModal(p => ({...p, nuevoGrupo: e.target.value}))}>
                <option value="">Sin grupo</option>
                {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:10,marginTop:8}}>
              <button className="btn btn-secondary" style={{flex:1}} onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{flex:2}} onClick={moverGrupo} disabled={guardando}>
                {guardando ? <span className="spinner"/> : 'Mover'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}
