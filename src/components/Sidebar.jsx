import { cn } from '@/lib/utils'
import {
  LayoutDashboard, MessageSquare, Bell, Users, Package,
  Bot, Settings, Zap, ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { id: 'conversas', label: 'Conversas', icon: MessageSquare, group: 'main', badge: '12' },
  { id: 'transacional', label: 'Transacionais', icon: Bell, group: 'main' },
  { id: 'contatos', label: 'Contatos', icon: Users, group: 'main' },
  { id: 'estoque', label: 'Avise-me', icon: Package, group: 'main' },
  { id: 'agentes', label: 'Agentes IA', icon: Bot, group: 'config' },
  { id: 'config', label: 'Configurações', icon: Settings, group: 'config' },
]

const AI_STATES = [
  'Processando mensagens...', 'Consultando Nuvemshop...', 'Verificando Bling...',
  'Gerando autorizações...', 'Respondendo clientes...', 'Monitorando estoque...',
]

export default function Sidebar({ current, onChange }) {
  const [aiIdx, setAiIdx] = useState(0)
  const [time, setTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))

  useEffect(() => {
    const i = setInterval(() => {
      setAiIdx(x => (x + 1) % AI_STATES.length)
      setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    }, 4000)
    return () => clearInterval(i)
  }, [])

  const main = NAV.filter(n => n.group === 'main')
  const config = NAV.filter(n => n.group === 'config')

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col border-r border-border/50 relative z-10"
      style={{ background: 'rgba(10,12,20,0.95)', backdropFilter: 'blur(24px)' }}>

      {/* Logo */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-black text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c5cfc, #b8ff57)', color: '#0a0a12' }}>
            B
          </div>
          <div>
            <div className="font-display font-bold text-sm text-white leading-none">Bia</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-none">Central IA</div>
          </div>
        </div>

        {/* AI Status */}
        <div className="mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
          style={{ background: 'rgba(184,255,87,0.07)', border: '1px solid rgba(184,255,87,0.15)' }}>
          <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: '#b8ff57' }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#b8ff57' }} />
          </span>
          <span className="text-[10px] font-medium truncate" style={{ color: '#b8ff57' }}>
            {AI_STATES[aiIdx]}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <div className="mb-1">
          <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Atendimento
          </p>
          {main.map(item => (
            <NavItem key={item.id} item={item} current={current} onChange={onChange} />
          ))}
        </div>
        <div className="pt-3">
          <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Sistema
          </p>
          {config.map(item => (
            <NavItem key={item.id} item={item} current={current} onChange={onChange} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 space-y-3">
        {/* Integrations mini status */}
        <div className="space-y-1.5">
          {[
            { n: 'Gemini AI', ok: true },
            { n: 'Nuvemshop', ok: true },
            { n: 'Bling ERP', ok: false },
            { n: 'WhatsApp', ok: true },
          ].map(s => (
            <div key={s.n} className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{s.n}</span>
              <span className={cn('text-[10px] font-semibold flex items-center gap-1',
                s.ok ? 'text-lime-400' : 'text-amber-400')}>
                <span className={cn('w-1.5 h-1.5 rounded-full inline-block',
                  s.ok ? 'bg-lime-400' : 'bg-amber-400')} />
                {s.ok ? 'Online' : 'Auth'}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-muted-foreground/50">v2.0</span>
          <span className="font-mono text-[10px] text-muted-foreground/50">{time}</span>
        </div>
      </div>
    </aside>
  )
}

function NavItem({ item, current, onChange }) {
  const isActive = current === item.id
  return (
    <button onClick={() => onChange(item.id)}
      className={cn(
        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 group relative',
        isActive
          ? 'text-white'
          : 'text-muted-foreground hover:text-white hover:bg-white/5'
      )}
      style={isActive ? {
        background: 'rgba(184,255,87,0.1)',
        border: '1px solid rgba(184,255,87,0.2)',
        color: '#b8ff57',
      } : {}}>
      <item.icon size={15} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
      <span className="flex-1 text-left text-[13px]">{item.label}</span>
      {item.badge && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(184,255,87,0.2)', color: '#b8ff57' }}>
          {item.badge}
        </span>
      )}
      {isActive && <ChevronRight size={12} style={{ color: '#b8ff57' }} />}
    </button>
  )
}
