// Shell.jsx atualizado — adiciona Handoff e Agentes Multi na navegação
// Substitui src/components/Shell.jsx no repositório bia-dashboard

import { useState, useEffect } from 'react'
import { useTheme } from '../App'
import {
  LayoutDashboard, MessageSquare, Bell, Users, Package,
  Bot, Settings, Sun, Moon, PhoneCall
} from 'lucide-react'
import { cn } from '../lib/utils'

import PageDashboard    from '../pages/PageDashboard'
import PageConversas    from '../pages/PageConversas'
import PageTransacional from '../pages/PageTransacional'
import PageContatos     from '../pages/PageContatos'
import PageEstoque      from '../pages/PageEstoque'
import PageAgentes      from '../pages/PageAgentes'
import PageAgentesMulti from '../pages/PageAgentesMulti'  // ← NOVO
import PageHandoff      from '../pages/PageHandoff'        // ← NOVO
import PageConfig       from '../pages/PageConfig'

const API = import.meta.env.VITE_API_URL || ''

const NAV = [
  { id:'dashboard',    icon:LayoutDashboard, label:'Dashboard',       group:'main' },
  { id:'conversas',    icon:MessageSquare,   label:'Conversas',        group:'main' },
  { id:'handoff',      icon:PhoneCall,       label:'Atendimento',      group:'main', badgeKey:'handoff' },
  { id:'transacional', icon:Bell,            label:'Transacionais',    group:'main' },
  { id:'contatos',     icon:Users,           label:'Contatos',         group:'main' },
  { id:'estoque',      icon:Package,         label:'Avise-me',         group:'main' },
  { id:'agentes',      icon:Bot,             label:'Config IA',        group:'config' },
  { id:'multiagentes', icon:Bot,             label:'Múltiplos Agentes',group:'config' },
  { id:'config',       icon:Settings,        label:'Configurações',    group:'config' },
]

const AI_STATES = [
  'Processando...','Nuvemshop...','Bling ERP...','Gerando RMA...','Respondendo...','Estoque...'
]

export default function Shell() {
  const { theme, toggle } = useTheme()
  const [page,         setPage]         = useState('dashboard')
  const [aiIdx,        setAiIdx]        = useState(0)
  const [online,       setOnline]       = useState(true)
  const [handoffCount, setHandoffCount] = useState(0)

  useEffect(() => {
    const i = setInterval(() => setAiIdx(x => (x+1) % AI_STATES.length), 3500)
    return () => clearInterval(i)
  }, [])

  // Polling de handoffs pendentes
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${API}/api/fase3/handoffs?status=aguardando`)
        if (r.ok) {
          const d = await r.json()
          setHandoffCount(d.total || 0)
        }
        setOnline(true)
      } catch { setOnline(false) }
    }
    check()
    const i = setInterval(check, 10000)
    return () => clearInterval(i)
  }, [])

  const PAGES = {
    dashboard:    <PageDashboard    api={API} />,
    conversas:    <PageConversas    api={API} />,
    handoff:      <PageHandoff      api={API} />,
    transacional: <PageTransacional api={API} />,
    contatos:     <PageContatos     api={API} />,
    estoque:      <PageEstoque      api={API} />,
    agentes:      <PageAgentes      api={API} />,
    multiagentes: <PageAgentesMulti api={API} />,
    config:       <PageConfig       api={API} onToggleTheme={toggle} currentTheme={theme} />,
  }

  const main   = NAV.filter(n => n.group === 'main')
  const config = NAV.filter(n => n.group === 'config')

  return (
    <div className="flex h-full">
      <aside className="w-[220px] flex-shrink-0 flex flex-col border-r"
        style={{ background:'var(--bg-2)', borderColor:'var(--sep)' }}>

        {/* Logo */}
        <div className="px-4 pt-5 pb-4" style={{ borderBottom:'1px solid var(--sep)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background:'var(--accent)', color:'#000' }}>B</div>
            <div>
              <div className="text-[15px] font-semibold tracking-tight" style={{ color:'var(--label)' }}>Bia</div>
              <div className="text-[11px]" style={{ color:'var(--label-3)' }}>Central de Atendimento</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[10px]"
            style={{ background:'var(--accent-dim)' }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background:'var(--accent)' }} />
            <span className="text-[11px] font-medium truncate" style={{ color:'var(--accent)' }}>
              {AI_STATES[aiIdx]}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="mb-1">
            <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color:'var(--label-4)' }}>Atendimento</p>
            {main.map(item => {
              const badge = item.badgeKey === 'handoff' ? handoffCount : 0
              return <NavItem key={item.id} item={item} current={page} onChange={setPage} badge={badge} />
            })}
          </div>
          <div className="pt-2 mt-1" style={{ borderTop:'1px solid var(--sep)' }}>
            <p className="px-4 mb-1 mt-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color:'var(--label-4)' }}>Sistema</p>
            {config.map(item => <NavItem key={item.id} item={item} current={page} onChange={setPage} />)}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3" style={{ borderTop:'1px solid var(--sep)' }}>
          <div className="space-y-2 mb-3">
            {[
              { n:'Gemini AI',  ok:true  },
              { n:'WhatsApp',   ok:true  },
              { n:'Nuvemshop',  ok:true  },
              { n:'Bling ERP',  ok:false, warn:'Auth pendente' },
            ].map(s => (
              <div key={s.n} className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color:'var(--label-3)' }}>{s.n}</span>
                <span className="text-[10px] font-semibold" style={{ color:s.ok?'var(--accent)':'var(--orange)' }}>
                  ● {s.ok ? 'Online' : s.warn||'Offline'}
                </span>
              </div>
            ))}
          </div>
          <button onClick={toggle}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] transition-all"
            style={{ background:'var(--fill)', color:'var(--label-2)' }}>
            {theme==='dark' ? <Sun size={13}/> : <Moon size={13}/>}
            <span className="text-[12px]">{theme==='dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            {!online && <span className="ml-auto text-[10px]" style={{ color:'var(--red)' }}>● Offline</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden" style={{ background:'var(--bg)' }}>
        {PAGES[page] || PAGES.dashboard}
      </main>
    </div>
  )
}

function NavItem({ item, current, onChange, badge = 0 }) {
  const isActive = current === item.id
  return (
    <button onClick={() => onChange(item.id)}
      className="w-full flex items-center gap-2.5 px-3 py-2 mx-1 rounded-[10px] transition-all text-left"
      style={{
        width:'calc(100% - 8px)',
        background: isActive ? 'var(--accent-dim)' : 'transparent',
        color:      isActive ? 'var(--accent)'     : 'var(--label-2)',
      }}>
      <item.icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
      <span className="flex-1 text-[13px]" style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
      {badge > 0 && (
        <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: badge > 0 ? 'var(--red)' : 'var(--accent)', color:'#fff' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}
