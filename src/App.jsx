import { useState, createContext, useContext } from 'react'
import Shell from './components/Shell'
import PageOcorrencias from './pages/PageOcorrencias'

export const ThemeCtx = createContext({ theme: 'dark', toggle: () => {} })
export const useTheme = () => useContext(ThemeCtx)

export default function App() {
  const [theme, setTheme] = useState('dark')
  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <div className={theme} style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)', color: 'var(--label)' }}>
        <Shell />
      </div>
    </ThemeCtx.Provider>
  )
}
