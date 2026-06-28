import PocketBase from 'pocketbase'

// 🔧 CAMBIA ESTA URL por la de tu Cloudflare Tunnel
// Ejemplo: https://xyz.trycloudflare.com
// En desarrollo local: http://localhost:8090
export const PB_URL = import.meta.env.DEV ? 'http://localhost:8090' : '/'

export const pb = new PocketBase(PB_URL)

// ─── AUTH ────────────────────────────────────────────────────────────────────

export async function loginWithCedulaPin(cedula, pin) {
  // Busca el usuario por cédula (campo username) y verifica PIN
  const records = await pb.collection('usuarios').getList(1, 1, {
    filter: `cedula = "${cedula}" && pin = "${pin}" && activo = true`
  })
  if (records.items.length > 0) {
    const usuario = records.items[0]
    localStorage.setItem('presente_user', JSON.stringify(usuario))
    return usuario
  }

  // Si no es un usuario/líder, buscar si es un estudiante con PIN (Sub-líder)
  const estRecords = await pb.collection('estudiantes').getList(1, 1, {
    filter: `cedula = "${cedula}" && pin = "${pin}" && activo = true`
  })
  if (estRecords.items.length > 0) {
    const estudiante = estRecords.items[0]
    const sublider = {
      ...estudiante,
      rol: 'sublider',
      rol_iglesia: estudiante.rol_iglesia || 'Estudiante (Apoyo)'
    }
    localStorage.setItem('presente_user', JSON.stringify(sublider))
    return sublider
  }

  throw new Error('Cédula o PIN incorrectos')
}

export function getUsuarioActual() {
  const data = localStorage.getItem('presente_user')
  return data ? JSON.parse(data) : null
}

export function logout() {
  localStorage.removeItem('presente_user')
  pb.authStore.clear()
}

// ─── MATERIAS ────────────────────────────────────────────────────────────────

export async function getMaterias() {
  return pb.collection('materias').getFullList({ sort: 'nombre' })
}

export async function crearMateria(data) {
  return pb.collection('materias').create(data)
}

export async function actualizarMateria(id, data) {
  return pb.collection('materias').update(id, data)
}

export async function eliminarMateria(id) {
  return pb.collection('materias').delete(id)
}

// ─── GRUPOS ──────────────────────────────────────────────────────────────────

export async function getGrupos() {
  return pb.collection('grupos').getFullList({ sort: 'nombre', expand: 'materia' })
}

export async function crearGrupo(data) {
  return pb.collection('grupos').create(data)
}

export async function actualizarGrupo(id, data) {
  return pb.collection('grupos').update(id, data)
}

export async function eliminarGrupo(id) {
  return pb.collection('grupos').delete(id)
}

// ─── ESTUDIANTES ─────────────────────────────────────────────────────────────

export async function getEstudiantesPorGrupo(grupoId, includeInactive = false) {
  let filter = `grupo = "${grupoId}"`
  if (!includeInactive) filter += ` && activo = true`
  return pb.collection('estudiantes').getFullList({
    filter: filter,
    sort: 'nombre'
  })
}

export async function getTodosEstudiantes() {
  return pb.collection('estudiantes').getFullList({
    sort: 'nombre',
    expand: 'grupo'
  })
}

export async function crearEstudiante(data) {
  return pb.collection('estudiantes').create(data)
}

export async function actualizarEstudiante(id, data) {
  return pb.collection('estudiantes').update(id, data)
}

export async function inactivarEstudiante(id) {
  return pb.collection('estudiantes').update(id, { activo: false })
}

// ─── USUARIOS (LÍDERES) ──────────────────────────────────────────────────────

export async function getUsuarios() {
  return pb.collection('usuarios').getFullList({
    sort: 'nombre',
    expand: 'grupo'
  })
}

export async function crearUsuario(data) {
  return pb.collection('usuarios').create(data)
}

export async function actualizarUsuario(id, data) {
  return pb.collection('usuarios').update(id, data)
}

// ─── ASISTENCIA ──────────────────────────────────────────────────────────────

export async function getAsistenciaPorFechaYGrupo(fecha, grupoId) {
  return pb.collection('asistencia').getFullList({
    filter: `fecha = "${fecha}" && grupo = "${grupoId}"`,
    expand: 'estudiante'
  })
}

export async function guardarAsistencia(registros) {
  // registros: array de { estudiante, grupo, fecha, estado }
  // Upsert: elimina los del día y crea nuevos
  const fecha = registros[0]?.fecha
  const grupoId = registros[0]?.grupo
  if (!fecha || !grupoId) return

  // Eliminar asistencia existente para este día/grupo
  const existentes = await getAsistenciaPorFechaYGrupo(fecha, grupoId)
  await Promise.all(existentes.map(r => pb.collection('asistencia').delete(r.id, { requestKey: null })))

  // Crear nuevos registros
  return Promise.all(registros.map(r => pb.collection('asistencia').create(r, { requestKey: null })))
}

export async function getEstadisticasPorGrupo(grupoId, fechaInicio, fechaFin) {
  return pb.collection('asistencia').getFullList({
    filter: `grupo = "${grupoId}" && fecha >= "${fechaInicio}" && fecha <= "${fechaFin}"`,
    expand: 'estudiante'
  })
}

export async function getTodasAsistencias(fechaInicio, fechaFin) {
  return pb.collection('asistencia').getFullList({
    filter: `fecha >= "${fechaInicio}" && fecha <= "${fechaFin}"`,
    expand: 'estudiante,grupo'
  })
}

export async function getAsistenciaPorEstudiante(estudianteId) {
  return pb.collection('asistencia').getFullList({
    filter: `estudiante = "${estudianteId}"`,
    sort: '-fecha'
  })
}
