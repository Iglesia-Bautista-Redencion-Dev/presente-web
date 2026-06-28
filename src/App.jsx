import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { BottomNav } from './components/BottomNav'
import { ErrorBoundary } from './components/ErrorBoundary'

import Login             from './pages/Login'
import LiderHome         from './pages/LiderHome'
import Asistencia        from './pages/Asistencia'
import Estudiantes       from './pages/Estudiantes'
import AdminHome         from './pages/AdminHome'
import AdminGrupos       from './pages/AdminGrupos'
import AdminLideres      from './pages/AdminLideres'
import AdminStats        from './pages/AdminStats'
import AdminEstudiantes  from './pages/AdminEstudiantes'
import AdminMaterias     from './pages/AdminMaterias'

function RequireAuth({ children, role, roles = [] }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <div style={{display:'flex',height:'100dvh',alignItems:'center',justifyContent:'center'}}><div className="spinner" style={{width:36,height:36,borderWidth:3}}/></div>
  if (!usuario) return <Navigate to="/login" replace />
  
  const rolesPermitidos = role ? [role] : roles
  if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuario.rol)) {
    if (usuario.rol === 'sublider') return <Navigate to="/lider/asistencia" replace />
    return <Navigate to={['admin', 'director'].includes(usuario.rol) ? '/admin' : '/lider'} replace />
  }

  return children
}

function AppRoutes() {
  const { usuario } = useAuth() || {}

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Lider routes */}
        <Route path="/lider" element={<RequireAuth role="lider"><LiderHome /></RequireAuth>} />
        <Route path="/lider/asistencia" element={<RequireAuth roles={['lider', 'sublider']}><Asistencia /></RequireAuth>} />
        <Route path="/lider/estudiantes" element={<RequireAuth role="lider"><Estudiantes /></RequireAuth>} />

        {/* Admin routes */}
        <Route path="/admin" element={<RequireAuth roles={['admin', 'director']}><AdminHome /></RequireAuth>} />
        <Route path="/admin/grupos" element={<RequireAuth roles={['admin', 'director']}><AdminGrupos /></RequireAuth>} />
        <Route path="/admin/lideres" element={<RequireAuth roles={['admin', 'director']}><AdminLideres /></RequireAuth>} />
        <Route path="/admin/stats" element={<RequireAuth roles={['admin', 'director']}><AdminStats /></RequireAuth>} />
        <Route path="/admin/estudiantes" element={<RequireAuth roles={['admin', 'director']}><AdminEstudiantes /></RequireAuth>} />
        <Route path="/admin/materias" element={<RequireAuth roles={['admin', 'director']}><AdminMaterias /></RequireAuth>} />

        {/* Redirect raíz */}
        <Route path="/" element={
          usuario
            ? <Navigate to={['admin', 'director'].includes(usuario.rol) ? '/admin' : usuario.rol === 'sublider' ? '/lider/asistencia' : '/lider'} replace />
            : <Navigate to="/login" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {usuario && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
