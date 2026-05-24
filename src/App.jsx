import { useState, createContext, useContext, useEffect, Component } from 'react'
import Shell from './components/Shell'
import PageLogin, { verificarAuth } from './pages/PageLogin'

export const ThemeCtx = createContext({ theme: 'dark', toggle: () => {} })
export const useTheme = () => useContext(ThemeCtx)

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return (
      <div style={{ padding:40, fontFamily:'monospace', color:'#ff4444', background:'#1a1a1a', minHeight:'100vh' }}>
        <h2 style={{ color:'#ff6666', marginBottom:16 }}>Erro de renderização</h2>
        <pre style={{ whiteSpace:'pre-wrap', fontSize:13, color:'#ffaaaa' }}>
          {this.state.error?.message}{'\n\n'}{this.state.error?.stack}
        </pre>
        <button onClick={() => this.setState({ error: null })} style={{ marginTop:16, padding:'8px 16px', background:'#333', color:'#fff', border:'none', borderRadius:8, cursor:'pointer' }}>
          Tentar novamente
        </button>
      </div>
    )
    return this.props.children
  }
}

export default function App() {
  const [theme,   setTheme]   = useState(() => { try { return localStorage.getItem('bia_theme') || 'dark' } catch { return 'dark' } })
  const [logado,  setLogado]  = useState(() => verificarAuth())

  const toggle = () => setTheme(t => {
    const next = t === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem('bia_theme', next) } catch {}
    return next
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  if (!logado) {
    return (
      <ThemeCtx.Provider value={{ theme, toggle }}>
        <div className={theme} style={{ height:'100dvh', background:'var(--bg)', color:'var(--label)' }}>
          <PageLogin onLogin={() => setLogado(true)} />
        </div>
      </ThemeCtx.Provider>
    )
  }

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <ErrorBoundary>
        <div className={theme} style={{ height:'100dvh', overflow:'hidden', background:'var(--bg)', color:'var(--label)' }}>
          <Shell />
        </div>
      </ErrorBoundary>
    </ThemeCtx.Provider>
  )
}
