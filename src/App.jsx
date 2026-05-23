import { useState, createContext, useContext, useEffect } from 'react'
import Shell from './components/Shell'

export const ThemeCtx = createContext({ theme: 'dark', toggle: () => {} })
export const useTheme = () => useContext(ThemeCtx)

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('bia_theme') || 'dark')

  const toggle = () => setTheme(t => {
    const next = t === 'dark' ? 'light' : 'dark'
    localStorage.setItem('bia_theme', next)
    return next
  })

  // Aplica classe no root para dark mode funcionar com Tailwind
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <div
        className={theme}
        style={{
          height: '100dvh',
          overflow: 'hidden',
          background: 'var(--bg)',
          color: 'var(--label)',
        }}
      >
        <Shell />
      </div>
    </ThemeCtx.Provider>
  )
}
