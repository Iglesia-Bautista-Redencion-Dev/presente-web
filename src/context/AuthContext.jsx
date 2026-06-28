import { createContext, useContext, useState, useEffect } from 'react'
import { getUsuarioActual, logout as pbLogout } from '../services/pocketbase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const u = getUsuarioActual()
    setUsuario(u)
    setCargando(false)
  }, [])

  function setUser(u) {
    setUsuario(u)
  }

  function logout() {
    pbLogout()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, setUser, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
