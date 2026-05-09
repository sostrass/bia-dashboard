import { useState, useEffect } from 'react'
import { useTheme } from '../App'
import {
  LayoutDashboard, MessageSquare, Bell, Users, Package,
  Bot, Settings, Sun, Moon, Wifi, WifiOff
} from 'lucide-react'
import { cn } from '../lib/utils'

import PageDashboard    from '../pages/PageDashboard'
import PageConversas    from '../pages/PageConversas'
import PageTransacional from '../pages/PageTransacional'
import PageContatos     from '../pages/PageContatos'
import PageEstoque      from '../pages/PageEstoque'
import PageAgentes      from '../pages/PageAgentes'
import PageConfig       from '../pages/PageConfig'

const API = import.meta.env.VITE_API_URL || ''

const NAV = [
  { id: 'dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'conversas',    icon: MessageSquare,   label: 'Conversas',     badge: '3' },
  { id: 'transacional', icon: Bell,            label: 'Transacionais' },
  { id: 'contatos',     icon: Users,           label: 'Contatos' },
  { id: 'estoque',      icon: Package,         label: 'Avise-me' },
  { id: 'agentes',      icon: Bot,             label: 'Agentes IA' },
  { id: 'config',       icon: Settings,        label: 'Configurações' },
]

const AI_STATES = [
  'Processando...', 'Nuvemshop', 'Bling ERP',
  'Gerando RMA...', 'Respondendo...', 'Estoque'
]

export default function Shell() {
  const { theme, toggle } = useTheme()
  const [page, setPage] = useState('dashboard')
  const [aiIdx, setAiIdx] = useState(0)
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const i = setInterval(() => setAiIdx(x => (x + 1) % AI_STATES.length), 3500)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    const check = async () => {
      try { await fetch(`${API}/health`); setOnline(true) }
      catch { setOnline(false) }
    }
    check()
    const i = setInterval(check, 30000)
    return () => clearInterval(i)
  }, [])

  const PAGES = {
    dashboard:    <PageDashboard api={API} />,
    conversas:    <PageConversas api={API} />,
    transacional: <PageTransacional api={API} />,
    contatos:     <PageContatos api={API} />,
    estoque:      <PageEstoque api={API} />,
    agentes:      <PageAgentes api={API} />,
    config:       <PageConfig api={API} onToggleTheme={toggle} currentTheme={theme} />,
  }

  const isDark = theme === 'dark'

  return (
    <div className="flex h-full">
      {/* ── SIDEBAR ── */}
      <aside className="w-[220px] flex-shrink-0 flex flex-col border-r"
        style={{ background: 'var(--bg-2)', borderColor: 'var(--sep)' }}>

        {/* Logo */}
        <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid var(--sep)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'var(--accent)', color: '#000' }}>B</div>
            <div>
              <div className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--label)' }}>Bia</div>
              <div className="text-[11px]" style={{ color: 'var(--label-3)' }}>Central de Atendimento</div>
            </div>
          </div>

          {/* AI live status */}
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-[10px]"
            style={{ background: 'var(--accent-dim)' }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
            <span className="text-[11px] font-medium truncate" style={{ color: 'var(--accent)' }}>
              {AI_STATES[aiIdx]}
            </span>
            <span className="ml-auto text-[10px]" style={{ color: 'var(--accent)' }}>IA</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scroll-hidden py-2">
          {NAV.map(item => {
            const active = page === item.id
            return (
              <button key={item.id} onClick={() => setPage(item.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 mx-1 rounded-[10px] transition-all duration-100 text-left"
                style={{
                  width: 'calc(100% - 8px)',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--label-2)',
                }}>
                <item.icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                <span className="flex-1 text-[13px]" style={{ fontWeight: active ? 600 : 400 }}>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--red)', color: '#fff' }}>{item.badge}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid var(--sep)' }}>
          {/* Integrations */}
          <div className="space-y-2 mb-3">
            {[
              { n: 'Gemini AI',  ok: true },
              { n: 'WhatsApp',   ok: true },
              { n: 'Nuvemshop',  ok: true },
              { n: 'Bling ERP',  ok: false, warn: 'Auth pendente' },
            ].map(s => (
              <div key={s.n} className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: 'var(--label-3)' }}>{s.n}</span>
                <span className="text-[10px] font-semibold" style={{ color: s.ok ? 'var(--accent)' : 'var(--orange)' }}>
                  {s.ok ? '● Online' : '● ' + (s.warn || 'Offline')}
                </span>
              </div>
            ))}
          </div>

          {/* Theme toggle */}
          <button onClick={toggle}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] transition-all"
            style={{ background: 'var(--fill)', color: 'var(--label-2)' }}>
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
            <span className="text-[12px]">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            {!online && <WifiOff size={11} className="ml-auto" style={{ color: 'var(--red)' }} />}
          </button>
        </div>
      </aside>

      {/* ── CONTENT ── */}
      <main className="flex-1 overflow-hidden" style={{ background: 'var(--bg)' }}>
        {PAGES[page]}
      </main>
    </div>
  )
}
