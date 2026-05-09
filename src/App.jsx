import { useState } from 'react'
import Sidebar from './components/Sidebar'
import PageDashboard from './pages/PageDashboard'
import PageConversas from './pages/PageConversas'
import PageTransacional from './pages/PageTransacional'
import PageContatos from './pages/PageContatos'
import PageEstoque from './pages/PageEstoque'
import PageAgentes from './pages/PageAgentes'
import PageConfig from './pages/PageConfig'

const API = import.meta.env.VITE_API_URL || ''

export default function App() {
  const [page, setPage] = useState('dashboard')

  const pages = {
    dashboard: <PageDashboard api={API} />,
    conversas: <PageConversas api={API} />,
    transacional: <PageTransacional api={API} />,
    contatos: <PageContatos api={API} />,
    estoque: <PageEstoque api={API} />,
    agentes: <PageAgentes api={API} />,
    config: <PageConfig api={API} />,
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,92,252,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(184,255,87,0.05) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 -left-20 w-[300px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,229,180,0.04) 0%, transparent 70%)' }} />
      </div>

      <Sidebar current={page} onChange={setPage} />

      <main className="flex-1 overflow-hidden relative z-10">
        {pages[page] || pages.dashboard}
      </main>
    </div>
  )
}
