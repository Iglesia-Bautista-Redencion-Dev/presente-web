import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMaterias, crearMateria, actualizarMateria, eliminarMateria } from '../services/pocketbase'
import { ToastContainer } from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'

export default function AdminMaterias() {
  const navigate = useNavigate()
  const { toasts, toast } = useToast()
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ nombre: '', dia: '', horario: '' })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const data = await getMaterias()
      setLista(data)
      setLoading(false)
    } catch (e) {
      if (e.isAbort) return;
      console.error(e)
      toast.error('Error cargando materias: ' + e.message)
      setLoading(false)
    }
  }

  function abrirNuevo() {
    setForm({ nombre: '', dia: '', horario: '' })
    setModal('nuevo')
  }

  function abrirEditar(m) {
    setForm({ nombre: m.nombre, dia: m.dia || '', horario: m.horario || '' })
    setModal(m)
  }

  function cerrarModal() { setModal(null) }

  async function guardar() {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return }
    setGuardando(true)
    try {
      if (modal === 'nuevo') {
        await crearMateria(form)
        toast.success('Materia agregada')
      } else {
        await actualizarMateria(modal.id, form)
        toast.success('Materia actualizada')
      }
      await cargar()
      cerrarModal()
    } catch {
      toast.error('Error guardando')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(m) {
    if (!confirm(`¿Eliminar la materia ${m.nombre}?`)) return
    try {
      await eliminarMateria(m.id)
      toast.success('Materia eliminada')
      await cargar()
    } catch {
      toast.error('No se puede eliminar, puede que tenga grupos asignados')
    }
  }

  const filtradas = lista.filter(m =>
    m.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ fontSize: '1.2rem' }}>
            ←
          </button>
          <h1 className="page-title">Materias</h1>
        </div>
        <button className="btn btn-primary" style={{padding:'10px 16px'}} onClick={abrirNuevo}>
          + Agregar
        </button>
      </div>

      <input className="input" placeholder="Buscar materia..." value={busqueda}
        onChange={e => setBusqueda(e.target.value)} style={{ marginBottom: 16 }} />

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:48}}><div className="spinner" style={{width:32,height:32,borderWidth:3}} /></div>
      ) : filtradas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-text">{busqueda ? 'Sin resultados' : 'Aún no hay materias'}</div>
        </div>
      ) : (
        <div className="anim-fade-in" style={{display:'flex', flexDirection:'column', gap:8}}>
          {filtradas.map((m, i) => (
            <div key={m.id} className="card" style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', animationDelay:`${i*0.04}s`, animation:'fadeUp 0.3s ease both'}}>
              <div>
                <div style={{fontWeight:600, color:'var(--c-text)'}}>{m.nombre}</div>
                {(m.dia || m.horario) && (
                  <div style={{fontSize:13, color:'var(--c-text-2)', marginTop:4}}>
                    {m.dia} {m.horario && `• ${m.horario}`}
                  </div>
                )}
              </div>
              <div style={{display:'flex', gap:8}}>
                <button className="icon-btn" onClick={() => abrirEditar(m)} title="Editar">✎</button>
                <button className="icon-btn icon-btn-danger" onClick={() => eliminar(m)} title="Eliminar">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && cerrarModal()}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">{modal === 'nuevo' ? 'Nueva Materia' : 'Editar Materia'}</div>
            <div className="form-group">
              <label className="label">Nombre de la materia *</label>
              <input className="input" placeholder="Ej. Escuela Dominical" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Día de la semana</label>
                <select className="input select" value={form.dia} onChange={e => setForm({...form, dia: e.target.value})}>
                  <option value="">Selecciona...</option>
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Horario</label>
                <input className="input" placeholder="Ej. 10:00 AM" value={form.horario} onChange={e => setForm({...form, horario: e.target.value})} />
              </div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:24}}>
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