import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error crítico capturado:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: 'var(--c-accent)', marginBottom: '8px' }}>¡Ups! Algo falló.</h2>
          <p style={{ color: 'var(--c-text-2)', marginBottom: '24px' }}>La aplicación encontró un error inesperado que interrumpió su funcionamiento.</p>
          <pre style={{ background: 'var(--c-surface2)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'left', overflowX: 'auto', fontSize: '12px', color: 'var(--c-accent)', marginBottom: '24px', border: '1px solid var(--c-border)' }}>{this.state.error?.toString()}</pre>
          <button className="btn btn-primary btn-full" onClick={() => window.location.reload()}>Recargar página</button>
        </div>
      )
    }
    return this.props.children
  }
}