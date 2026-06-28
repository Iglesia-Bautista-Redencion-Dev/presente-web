import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginWithCedulaPin } from '../services/pocketbase'
import './Login.css'

export default function Login() {
  const [cedula, setCedula] = useState('')
  const [pin, setPin]       = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  async function handleLogin() {
    if (!cedula.trim() || !pin.trim()) {
      setError('Ingresa tu cédula y PIN')
      return
    }
    setLoading(true)
    setError('')
    try {
      const user = await loginWithCedulaPin(cedula.trim(), pin.trim())
      setUser(user)
      navigate(['admin', 'director'].includes(user.rol) ? '/admin' : '/lider')
    } catch (e) {
      setError(e.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="login-page">
      {/* Fondo decorativo */}
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
      </div>

      <div className="login-content anim-fade-up">
        {/* Logo / marca */}
        <div className="login-brand">
          <div className="login-logo">✦</div>
          <h1 className="login-title">Presente</h1>
          <p className="login-subtitle">Control de asistencia</p>
        </div>

        {/* Formulario */}
        <div className="login-form">
          <div className="form-group">
            <label className="label">Cédula</label>
            <input
              className="input"
              type="tel"
              inputMode="numeric"
              placeholder="Tu número de cédula"
              value={cedula}
              onChange={e => setCedula(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="label">PIN</label>
            <input
              className="input"
              type="password"
              inputMode="numeric"
              placeholder="Tu PIN de acceso"
              value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={6}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error anim-fade-in">
              ✕ {error}
            </div>
          )}

          <button
            className="btn btn-primary btn-full login-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Ingresar'}
          </button>
        </div>

        <p className="login-footer">Iglesia Bautista Redención</p>
      </div>
    </div>
  )
}
