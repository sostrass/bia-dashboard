import { useState, useEffect } from 'react'
import { useTheme } from '../App'
import {
  LayoutDashboard, MessageSquare, Users, Package,
  Bot, Settings, Sun, Moon,
  Send, Zap, AlertCircle, ShoppingCart, CreditCard
} from 'lucide-react'

import PageDashboard  from '../pages/PageDashboard'
import PageIAConfig   from '../pages/PageIAConfig'
import PagePedidos    from '../pages/PagePedidos'
import PageClientes   from '../pages/PageClientes'
import PageCaixa      from '../pages/PageCaixa'
import PageAtendimento from '../pages/PageAtendimento'

// Páginas placeholder para não quebrar
const Placeholder = ({ title }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12 }}>
    <div style={{ fontSize:32 }}>🚧</div>
    <div style={{ fontSize:16, fontWeight:500, color:'var(--label)' }}>{title}</div>
    <div style={{ fontSize:13, color:'var(--label-3)' }}>Em desenvolvimento</div>
  </div>
)

const API = import.meta.env.VITE_API_URL || ''

const NAV = [
  // Principal
  { id:'dashboard',    icon:LayoutDashboard, label:'Dashboard',       group:'main' },
  { id:'atendimento',  icon:MessageSquare,   label:'Atendimento',     group:'main', badgeKey:'handoff' },
  { id:'pedidos',      icon:ShoppingCart,    label:'Pedidos',         group:'main' },
  { id:'clientes',     icon:Users,           label:'Clientes',        group:'main' },
  { id:'caixa',        icon:CreditCard,      label:'Fluxo de Caixa',  group:'main' },
  // Ferramentas
  { id:'disparos',     icon:Zap,             label:'Disparos',        group:'tools' },
  { id:'enviomassa',   icon:Send,            label:'Envio em Massa',  group:'tools' },
  { id:'estoque',      icon:Package,         label:'Avise-me',        group:'tools' },
  { id:'ocorrencias',  icon:AlertCircle,     label:'Ocorrências',     group:'tools', badgeKey:'ocorrencias' },
  // Config
  { id:'iaconfig',     icon:Bot,             label:'Config IA',       group:'config' },
  { id:'config',       icon:Settings,        label:'Configurações',   group:'config' },
]

const AI_STATES = ['Processando...','Bling ERP...','Gemini AI...','Respondendo...','Monitorando...']
const LOGO_KEY  = 'bia_logo_url'
const NOME_KEY  = 'bia_nome_empresa'

export default function Shell() {
  const { theme, toggle } = useTheme()
  const [page,         setPage]         = useState('dashboard')
  const [aiIdx,        setAiIdx]        = useState(0)
  const [online,       setOnline]       = useState(true)
  const [blingOk,      setBlingOk]      = useState(false)
  const [handoffCount, setHandoffCount] = useState(0)
  const [ocorrCount,   setOcorrCount]   = useState(0)
  const [logoUrl,      setLogoUrl]      = useState(() => localStorage.getItem(LOGO_KEY) || '')
  const [nomeEmpresa,  setNomeEmpresa]  = useState(() => localStorage.getItem(NOME_KEY) || 'Só Strass')

  useEffect(() => {
    const i = setInterval(() => setAiIdx(x => (x+1) % AI_STATES.length), 3500)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    const check = async () => {
      try {
        const [rb] = await Promise.all([
          fetch(`${API}/bling/catalogo-status`),
        ])
        if (rb.ok) setBlingOk(true)
        setOnline(true)
      } catch { setOnline(false) }
    }
    check()
    const i = setInterval(check, 15000)
    return () => clearInterval(i)
  }, [])

  const PAGES = {
    dashboard:   <PageDashboard   api={API} />,
    atendimento: <PageAtendimento api={API} />,
    pedidos:     <PagePedidos     api={API} />,
    clientes:    <PageClientes    api={API} />,
    caixa:       <PageCaixa       api={API} />,
    iaconfig:    <PageIAConfig    api={API} />,
    disparos:    <Placeholder title="Disparos" />,
    enviomassa:  <Placeholder title="Envio em Massa" />,
    estoque:     <Placeholder title="Avise-me (Estoque)" />,
    ocorrencias: <Placeholder title="Ocorrências" />,
    config:      <Placeholder title="Configurações" />,
  }

  const getGroups = () => [
    { label:'Principal',   items: NAV.filter(n => n.group === 'main')   },
    { label:'Ferramentas', items: NAV.filter(n => n.group === 'tools')  },
    { label:'Sistema',     items: NAV.filter(n => n.group === 'config') },
  ]

  const getBadge = key => {
    if (key === 'handoff')    return handoffCount
    if (key === 'ocorrencias') return ocorrCount
    return 0
  }

  return (
    <div style={{ display:'flex', height:'100%' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, flexShrink:0, display:'flex', flexDirection:'column',
        background:'var(--bg-2)', borderRight:'0.5px solid var(--sep)',
      }}>
        {/* Logo */}
        <div style={{ padding:'18px 16px 14px', borderBottom:'0.5px solid var(--sep)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ width:36, height:36, borderRadius:10, objectFit:'cover' }} />
              : <div style={{ width:36, height:36, borderRadius:10, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#000', flexShrink:0 }}>S</div>
            }
            <div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--label)', lineHeight:1.2 }}>Bia</div>
              <div style={{ fontSize:11, color:'var(--label-3)', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nomeEmpresa}</div>
            </div>
          </div>
          {/* Status AI */}
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', borderRadius:8, background:'var(--accent-dim)' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', flexShrink:0 }} />
            <span style={{ fontSize:11, fontWeight:500, color:'var(--accent)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{AI_STATES[aiIdx]}</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
          {getGroups().map(group => (
            <div key={group.label} style={{ marginBottom:4 }}>
              <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--label-3)', padding:'8px 16px 4px' }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const badge  = getBadge(item.badgeKey)
                const active = page === item.id
                return (
                  <button key={item.id} onClick={() => setPage(item.id)} style={{
                    width:'calc(100% - 16px)', margin:'0 8px 1px', display:'flex', alignItems:'center',
                    gap:9, padding:'7px 10px', borderRadius:8, border:'none', cursor:'pointer',
                    background: active ? 'var(--accent-dim)' : 'transparent',
                    color:      active ? 'var(--accent)'     : 'var(--label-2)',
                    textAlign:'left',
                  }}>
                    <item.icon size={15} strokeWidth={active ? 2.5 : 1.8} />
                    <span style={{ flex:1, fontSize:13, fontWeight: active ? 600 : 400 }}>{item.label}</span>
                    {badge > 0 && (
                      <span style={{ fontSize:10, fontWeight:700, minWidth:18, height:18, borderRadius:9, background:'var(--red)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding:'12px 14px', borderTop:'0.5px solid var(--sep)' }}>
          {/* Status */}
          <div style={{ marginBottom:10, display:'flex', flexDirection:'column', gap:5 }}>
            {[
              { n:'Gemini AI',  ok:online  },
              { n:'WhatsApp',   ok:online  },
              { n:'Bling ERP',  ok:blingOk },
              { n:'Mercado Pago', ok:online },
            ].map(s => (
              <div key={s.n} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:'var(--label-3)' }}>{s.n}</span>
                <span style={{ fontSize:10, fontWeight:600, color: s.ok ? 'var(--accent)' : 'var(--orange)' }}>
                  ● {s.ok ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
          {/* Toggle tema */}
          <button onClick={toggle} style={{
            width:'100%', display:'flex', alignItems:'center', gap:8,
            padding:'7px 10px', borderRadius:8, border:'none', cursor:'pointer',
            background:'var(--fill)', color:'var(--label-2)',
          }}>
            {theme === 'dark' ? <Sun size={13}/> : <Moon size={13}/>}
            <span style={{ fontSize:12 }}>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex:1, overflow:'hidden', background:'var(--bg)' }}>
        {PAGES[page] || PAGES.dashboard}
      </main>
    </div>
  )
}
