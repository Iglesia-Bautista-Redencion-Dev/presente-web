import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { getGrupos, getTodasAsistencias, getMaterias, getTodosEstudiantes } from '../services/pocketbase'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/ToastContainer'
import './AdminStats.css'

const PERIODOS = [
  { label: 'Esta semana', value: 'semana' },
  { label: 'Este mes',    value: 'mes'    },
  { label: 'Trimestre',   value: 'trimestre' },
  { label: 'Semestre',    value: 'semestre'  },
  { label: 'Anual',       value: 'anual'     },
]

function getRango(periodo) {
  const hoy = new Date()
  let inicio = new Date()
  if (periodo === 'semana') { inicio.setDate(hoy.getDate() - 7) }
  else if (periodo === 'mes') { inicio.setDate(1) }
  else if (periodo === 'trimestre') { inicio.setMonth(hoy.getMonth() - 3) }
  else if (periodo === 'semestre') { inicio.setMonth(hoy.getMonth() - 6) }
  else if (periodo === 'anual') { inicio.setMonth(0, 1) } // 1 de enero de este año
  return {
    inicio: inicio.toISOString().split('T')[0],
    fin: hoy.toISOString().split('T')[0]
  }
}

export default function AdminStats() {
  const navigate = useNavigate()
  const { toasts, toast } = useToast()
  const [periodo, setPeriodo] = useState('mes')
  const [grupos, setGrupos] = useState([])
  const [materias, setMaterias] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  const toggle = (id) => setExpanded(p => ({...p, [id]: !p[id]}))

  useEffect(() => { cargar() }, [periodo])

  async function cargar() {
    setLoading(true)
    try {
      const { inicio, fin } = getRango(periodo)
      const [g, a, m, e] = await Promise.all([
        getGrupos(),
        getTodasAsistencias(inicio, fin),
        getMaterias(),
        getTodosEstudiantes()
      ])
      setGrupos(g)
      setAsistencias(a)
      setMaterias(m)
      setEstudiantes(e)
      setLoading(false)
    } catch (err) { 
      if (err.isAbort) return;
      console.error(err)
      toast.error('Error cargando stats: ' + err.message) 
      setLoading(false)
    }
  }

  // Calcular stats agrupadas por Materia
  const statsPorMateria = materias.map(m => {
    const gruposMateria = grupos.filter(g => g.materia === m.id)
    const statsGrupos = gruposMateria.map(g => {
      const registros = asistencias.filter(a => a.grupo === g.id)
      const presentes = registros.filter(a => a.estado === 'presente').length
      const visitas   = registros.filter(a => a.estado === 'visita').length
      const ausentes  = registros.filter(a => a.estado === 'ausente').length
      const total     = registros.length
      const pct       = total > 0 ? Math.round((presentes / total) * 100) : 0
      return { ...g, presentes, visitas, ausentes, total, pct }
    }).filter(g => g.total > 0).sort((a, b) => b.pct - a.pct)

    const presentes = statsGrupos.reduce((acc, g) => acc + g.presentes, 0)
    const visitas   = statsGrupos.reduce((acc, g) => acc + g.visitas, 0)
    const ausentes  = statsGrupos.reduce((acc, g) => acc + g.ausentes, 0)
    const total     = statsGrupos.reduce((acc, g) => acc + g.total, 0)
    const pct       = total > 0 ? Math.round((presentes / total) * 100) : 0
    return { ...m, grupos: statsGrupos, presentes, visitas, ausentes, total, pct }
  }).filter(m => m.total > 0).sort((a, b) => b.pct - a.pct)

  // Calcular stats para grupos sin materia asignada
  const statsGruposSinMateria = grupos.filter(g => !g.materia).map(g => {
    const registros = asistencias.filter(a => a.grupo === g.id)
    const presentes = registros.filter(a => a.estado === 'presente').length
    const visitas   = registros.filter(a => a.estado === 'visita').length
    const ausentes  = registros.filter(a => a.estado === 'ausente').length
    const total     = registros.length
    const pct       = total > 0 ? Math.round((presentes / total) * 100) : 0
    return { ...g, presentes, visitas, ausentes, total, pct }
  }).filter(g => g.total > 0).sort((a, b) => b.pct - a.pct)

  const sinMateriaPresentes = statsGruposSinMateria.reduce((acc, g) => acc + g.presentes, 0)
  const sinMateriaVisitas   = statsGruposSinMateria.reduce((acc, g) => acc + g.visitas, 0)
  const sinMateriaAusentes  = statsGruposSinMateria.reduce((acc, g) => acc + g.ausentes, 0)
  const sinMateriaTotal     = statsGruposSinMateria.reduce((acc, g) => acc + g.total, 0)
  const sinMateriaPct       = sinMateriaTotal > 0 ? Math.round((sinMateriaPresentes / sinMateriaTotal) * 100) : 0

  const totalPresentes = asistencias.filter(a => a.estado === 'presente').length
  const totalVisitas   = asistencias.filter(a => a.estado === 'visita').length
  const totalRegistros = asistencias.length
  const pctGlobal      = totalRegistros > 0 ? Math.round((totalPresentes / totalRegistros) * 100) : 0

  function exportarExcel() {
    const wb = XLSX.utils.book_new()

    // 1. Crear una hoja en Excel por cada Materia
    materias.forEach(m => {
      const dataHoja = [["Grupo", "Estudiante", "Rol", "Presentes", "Visitas", "Ausentes", "Asistencia (%)"]]
      const gruposMateria = grupos.filter(g => g.materia === m.id)
      
      gruposMateria.forEach(g => {
        const ests = estudiantes.filter(e => e.grupo === g.id)
        ests.forEach(est => {
          const asists = asistencias.filter(a => a.estudiante === est.id)
          const pres = asists.filter(a => a.estado === 'presente').length
          const vis = asists.filter(a => a.estado === 'visita').length
          const aus = asists.filter(a => a.estado === 'ausente').length
          const total = pres + vis + aus
          const pct = total > 0 ? Math.round((pres / total) * 100) : 0
          dataHoja.push([g.nombre, est.nombre, est.rol_iglesia || 'Regular', pres, vis, aus, `${pct}%`])
        })
      })

      if (dataHoja.length > 1) {
        const ws = XLSX.utils.aoa_to_sheet(dataHoja)
        // Limpiar nombre de hoja (Excel prohíbe ciertos símbolos y tiene máximo 31 letras)
        const nombreHoja = m.nombre.substring(0, 31).replace(/[\\/?*[\]:]/g, '') || "Materia"
        XLSX.utils.book_append_sheet(wb, ws, nombreHoja)
      }
    })

    // 2. Crear una hoja adicional para los grupos que no tienen materia asignada
    const gruposSin = grupos.filter(g => !g.materia)
    if (gruposSin.length > 0) {
      const dataSin = [["Grupo", "Estudiante", "Rol", "Presentes", "Visitas", "Ausentes", "Asistencia (%)"]]
      gruposSin.forEach(g => {
        const ests = estudiantes.filter(e => e.grupo === g.id)
        ests.forEach(est => {
          const asists = asistencias.filter(a => a.estudiante === est.id)
          const pres = asists.filter(a => a.estado === 'presente').length
          const vis = asists.filter(a => a.estado === 'visita').length
          const aus = asists.filter(a => a.estado === 'ausente').length
          const total = pres + vis + aus
          const pct = total > 0 ? Math.round((pres / total) * 100) : 0
          dataSin.push([g.nombre, est.nombre, est.rol_iglesia || 'Regular', pres, vis, aus, `${pct}%`])
        })
      })
      if (dataSin.length > 1) {
        const ws = XLSX.utils.aoa_to_sheet(dataSin)
        XLSX.utils.book_append_sheet(wb, ws, "Otros Grupos")
      }
    }

    // 3. Por seguridad, si no hay absolutamente ningún dato, crear hoja vacía
    if (wb.SheetNames.length === 0) {
      const ws = XLSX.utils.aoa_to_sheet([["Sin datos para exportar en este período"]])
      XLSX.utils.book_append_sheet(wb, ws, "Sin Datos")
    }

    XLSX.writeFile(wb, `Estadisticas_${periodo}.xlsx`)
  }

  // Helper para renderizar la tarjeta del grupo y sus estudiantes
  const renderGrupoCard = (g, i) => (
    <div key={g.id} className="grupo-stat-card card" style={{animationDelay:`${i*0.04}s`,animation:'fadeUp 0.3s ease both', display: 'block', padding: '16px'}}>
      <div onClick={() => toggle(g.id)} style={{cursor: 'pointer'}}>
        <div className="grupo-stat-top" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div className="grupo-stat-nombre" style={{fontWeight: 600}}>{g.nombre}</div>
          <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
            <div className="grupo-stat-pct" style={{color: g.pct >= 70 ? 'var(--c-success)' : g.pct >= 50 ? 'var(--c-warning)' : 'var(--c-accent)', fontWeight: 700}}>{g.pct}%</div>
            <span style={{color:'var(--c-text-3)', fontSize: 12}}>{expanded[g.id] ? '▼' : '▶'}</span>
          </div>
        </div>
        <div className="stat-bar" style={{marginTop: 10, marginBottom: 10}}>
          <div className="stat-bar-fill" style={{width: `${g.pct}%`, background: g.pct >= 70 ? 'var(--c-success)' : g.pct >= 50 ? 'var(--c-warning)' : 'var(--c-accent)'}} />
        </div>
        <div className="grupo-stat-detail" style={{display: 'flex', gap: '12px', fontSize: 13}}>
          <span style={{color:'var(--c-success)'}}>✓ {g.presentes}</span>
          <span style={{color:'var(--c-warning)'}}>★ {g.visitas}</span>
          <span style={{color:'var(--c-text-3)'}}>✕ {g.ausentes}</span>
        </div>
      </div>

      {expanded[g.id] && (
        <div style={{marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', gap: '8px'}}>
          {(() => {
            const ests = estudiantes.filter(est => est.grupo === g.id);
            if (ests.length === 0) return <div style={{fontSize:13, color:'var(--c-text-3)'}}>Sin estudiantes</div>;
            return ests.map(est => {
              const estAsist = asistencias.filter(a => a.estudiante === est.id);
              const ePres = estAsist.filter(a => a.estado === 'presente').length;
              const eVis = estAsist.filter(a => a.estado === 'visita').length;
              const eAus = estAsist.filter(a => a.estado === 'ausente').length;
              return (
                <div key={est.id} style={{background: est.rol_iglesia === 'Invitado' ? 'rgba(67, 233, 123, 0.08)' : 'var(--c-bg)', borderRadius: 'var(--radius-sm)', padding: '10px 12px'}}>
                  <div onClick={() => toggle(`est-${est.id}`)} style={{display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center'}}>
                    <div>
                      <span style={{fontWeight: 600, fontSize: 13}}>{est.nombre}</span>
                      {est.rol_iglesia === 'Invitado' && <span className="badge badge-success" style={{marginLeft:6, fontSize:9, padding:'2px 4px'}}>Invitado</span>}
                    </div>
                    <div style={{display: 'flex', gap: '8px', alignItems: 'center', fontSize: 12}}>
                      <span style={{color:'var(--c-success)'}}>✓ {ePres}</span>
                      <span style={{color:'var(--c-warning)'}}>★ {eVis}</span>
                      <span style={{color:'var(--c-text-3)'}}>✕ {eAus}</span>
                      <span style={{color:'var(--c-text-3)', marginLeft: 4}}>{expanded[`est-${est.id}`] ? '▼' : '▶'}</span>
                    </div>
                  </div>
                  {expanded[`est-${est.id}`] && (
                    <div style={{marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                      {estAsist.length === 0 ? <span style={{fontSize:12, color:'var(--c-text-3)'}}>Sin registros en este periodo</span> :
                        estAsist.sort((a,b) => a.fecha < b.fecha ? 1 : -1).map(a => (
                          <div key={a.id} style={{display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0'}}>
                            <span style={{fontFamily: 'var(--font-mono)', color: 'var(--c-text-2)'}}>{a.fecha}</span>
                            <span style={{fontWeight: 600, color: a.estado === 'presente' ? 'var(--c-success)' : a.estado === 'visita' ? 'var(--c-warning)' : 'var(--c-accent)'}}>
                              {a.estado === 'presente' ? 'Presente' : a.estado === 'visita' ? 'Visita' : 'Ausente'}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )
            })
          })()}
        </div>
      )}
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ fontSize: '1.2rem' }}>
            ←
          </button>
          <h1 className="page-title">Estadísticas</h1>
        </div>
      </div>

      {/* Selector de período */}
      <div style={{display:'flex', gap:10, marginBottom:20, alignItems:'center', justifyContent:'space-between', flexWrap:'wrap'}}>
        <div className="periodo-tabs" style={{margin:0}}>
          {PERIODOS.map(p => (
            <button
              key={p.value}
              className={`periodo-tab ${periodo === p.value ? 'active' : ''}`}
              onClick={() => setPeriodo(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary" style={{padding:'8px 12px', fontSize:13}} onClick={exportarExcel}>
          📥 Exportar a Excel
        </button>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:48}}>
          <div className="spinner" style={{width:32,height:32,borderWidth:3}} />
        </div>
      ) : (
        <div className="anim-fade-in">
          {/* Resumen global */}
          <div className="stats-global card">
            <div className="stats-global-pct" style={{
              color: pctGlobal >= 70 ? 'var(--c-success)' : pctGlobal >= 50 ? 'var(--c-warning)' : 'var(--c-accent)'
            }}>
              {pctGlobal}%
            </div>
            <div className="stats-global-label">Asistencia global</div>
            <div className="stats-global-detail">
              {totalPresentes} presentes · {totalVisitas} visitas · {totalRegistros} registros
            </div>
          </div>

          {/* Agrupadas por Materia */}
          {statsPorMateria.length === 0 && statsGruposSinMateria.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">▣</div>
              <div className="empty-state-text">Sin datos para este período</div>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {statsPorMateria.map((materia) => (
                <div key={materia.id} style={{background:'var(--c-surface2)', borderRadius:'var(--radius-md)', padding:4}}>
                  <div onClick={() => toggle(materia.id)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',cursor:'pointer'}}>
                    <div>
                      <div style={{fontWeight:600,color:'var(--c-primary)', marginBottom:4}}>📚 {materia.nombre}</div>
                      <div style={{fontSize:12, display:'flex', gap:12}}>
                        <span style={{color:'var(--c-success)'}}>✓ {materia.presentes}</span>
                        <span style={{color:'var(--c-warning)'}}>★ {materia.visitas}</span>
                        <span style={{color:'var(--c-text-3)'}}>✕ {materia.ausentes}</span>
                      </div>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:12}}>
                      <span style={{fontWeight:700, color: materia.pct >= 70 ? 'var(--c-success)' : materia.pct >= 50 ? 'var(--c-warning)' : 'var(--c-accent)'}}>{materia.pct}%</span>
                      <span style={{color:'var(--c-text-3)'}}>{expanded[materia.id] ? '▼' : '▶'}</span>
                    </div>
                  </div>
                  
                  {expanded[materia.id] && (
                    <div style={{padding:'8px 12px 12px', display:'flex', flexDirection:'column', gap:10}}>
                      {materia.grupos.map(renderGrupoCard)}
                    </div>
                  )}
                </div>
              ))}

              {/* Acordeón para Grupos sin Materia */}
              {statsGruposSinMateria.length > 0 && (
                <div style={{background:'var(--c-surface2)', borderRadius:'var(--radius-md)', padding:4}}>
                  <div onClick={() => toggle('sin-materia')} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',cursor:'pointer'}}>
                    <div>
                      <div style={{fontWeight:600,color:'var(--c-text-2)', marginBottom:4}}>▣ Grupos sin materia</div>
                      <div style={{fontSize:12, display:'flex', gap:12}}>
                        <span style={{color:'var(--c-success)'}}>✓ {sinMateriaPresentes}</span>
                        <span style={{color:'var(--c-warning)'}}>★ {sinMateriaVisitas}</span>
                        <span style={{color:'var(--c-text-3)'}}>✕ {sinMateriaAusentes}</span>
                      </div>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:12}}>
                      <span style={{fontWeight:700, color: sinMateriaPct >= 70 ? 'var(--c-success)' : sinMateriaPct >= 50 ? 'var(--c-warning)' : 'var(--c-accent)'}}>{sinMateriaPct}%</span>
                      <span style={{color:'var(--c-text-3)'}}>{expanded['sin-materia'] ? '▼' : '▶'}</span>
                    </div>
                  </div>
                  
                  {expanded['sin-materia'] && (
                    <div style={{padding:'8px 12px 12px', display:'flex', flexDirection:'column', gap:10}}>
                      {statsGruposSinMateria.map(renderGrupoCard)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}
