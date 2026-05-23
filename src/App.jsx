import { useState, createContext, useContext } from 'react'
import Shell from './components/Shell'
import { NotifProvider, ToastContainer, SystemHealthMonitor } from './components/NotificationSystem'

export const ThemeCtx = createContext({ theme: 'dark', toggle: () => {} })
export const useTheme = () => useContext(ThemeCtx)

const API = import.meta.env.VITE_API_URL || ''

const mpWebhook = require('./routes/mp-webhook')
app.use('/mp-webhook', mpWebhook)

export default function App() {
  const [theme, setTheme] = useState('dark')
  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <NotifProvider>
        <div className={theme} style={{ height:'100dvh', overflow:'hidden', background:'var(--bg)', color:'var(--label)' }}>
          <Shell />
          <ToastContainer />
          <SystemHealthMonitor api={API} />
        </div>
      </NotifProvider>
    </ThemeCtx.Provider>
  )
}
