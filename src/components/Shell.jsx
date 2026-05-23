import { useState, useEffect } from 'react'
import { useTheme } from '../App'
import { LayoutDashboard, ShoppingCart, Users, CreditCard, MessageSquare, Bot, Settings, Sun, Moon } from 'lucide-react'

// Lazy imports para isolar erros
import PageDashboard   from '../pages/PageDashboard'
import PageIAConfig    from '../pages/PageIAConfig'
import PagePedidos     from '../pages/PagePedidos'
import PageClientes    from '../pages/PageClientes'
import PageCaixa       from '../pages/PageCaixa'
import PageAtendimento from '../pages/PageAtendimento'

const API = import.meta.env.VITE_API_URL || ''

const NAV = [
  { id: 'dashboard',   icon: LayoutDashboard, label: 'Dashboard'      },
  { id: 'atendimento', icon: MessageSquare,   label: 'Atendimento'    },
  { id: 'pedidos',     icon: ShoppingCart,    label: 'Pedidos'        },
  { id: 'clientes',    icon: Users,           label: 'Clientes'       },
  { id: 'caixa',       icon: CreditCard,      label: 'Fluxo de Caixa' },
  { id: 'iaconfig',    icon: Bot,             label: 'Config IA'      },
  { id: 'config',      icon: Settings,        label: 'Configurações'  },
]

const AI_STATES = ['Processando...', 'Bling ERP...', 'Gemini AI...', 'Respondendo...']

export default function Shell() {
  const { theme, toggle } = useTheme()
  const [page,  setPage]  = useState('dashboard')
  const [aiIdx, setAiIdx] = useState(0)

  useEffect(() => {
    const i = setInterval(() => setAiIdx(x => (x + 1) % AI_STATES.length), 3500)
    return () => clearInterval(i)
  }, [])

  const renderPage = () => {
    try {
      switch (page) {
        case 'dashboard':   return <PageDashboard   api={API} />
        case 'atendimento': return <PageAtendimento api={API} />
        case 'pedidos':     return <PagePedidos     api={API} />
        case 'clientes':    return <PageClientes    api={API} />
        case 'caixa':       return <PageCaixa       api={API} />
        case 'iaconfig':    return <PageIAConfig    api={API} />
        default:            return (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--label-3)', fontSize:14 }}>
            Em desenvolvimento
          </div>
        )
      }
    } catch(e) {
      return (
        <div style={{ padding:32, color:'red', fontFamily:'monospace', fontSize:13 }}>
          <strong>Erro na página {page}:</strong><br />
          {String(e?.message)}<br /><br />
          {String(e?.stack)}
        </div>
      )
    }
  }

  return (
    <div style={{ display:'flex', height:'100%' }}>
      {/* Sidebar */}
      <aside style={{ width:200, flexShrink:0, display:'flex', flexDirection:'column', background:'var(--bg-2)', borderRight:'0.5px solid var(--sep)' }}>
        {/* Logo */}
        <div style={{ padding:'16px 14px 12px', borderBottom:'0.5px solid var(--sep)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:8 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#000' }}>S</div>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--label)' }}>Bia</div>
              <div style={{ fontSize:11, color:'var(--label-3)' }}>Só Strass</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 8px', borderRadius:7, background:'var(--accent-dim)' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', flexShrink:0 }} />
            <span style={{ fontSize:11, fontWeight:500, color:'var(--accent)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{AI_STATES[aiIdx]}</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
          {NAV.map(item => {
            const active = page === item.id
            return (
              <button key={item.id} onClick={() => setPage(item.id)} style={{
                width:'calc(100% - 12px)', margin:'0 6px 1px', display:'flex', alignItems:'center',
                gap:8, padding:'7px 9px', borderRadius:7, border:'none', cursor:'pointer', textAlign:'left',
                background: active ? 'var(--accent-dim)' : 'transparent',
                color:      active ? 'var(--accent)'     : 'var(--label-2)',
              }}>
                <item.icon size={14} strokeWidth={active ? 2.5 : 1.8} />
                <span style={{ fontSize:13, fontWeight: active ? 600 : 400 }}>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding:'10px 12px', borderTop:'0.5px solid var(--sep)' }}>
          <button onClick={toggle} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'6px 9px', borderRadius:7, border:'none', cursor:'pointer', background:'var(--fill)', color:'var(--label-2)' }}>
            {theme === 'dark' ? <Sun size={13}/> : <Moon size={13}/>}
            <span style={{ fontSize:12 }}>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, overflow:'hidden', background:'var(--bg)' }}>
        {renderPage()}
      </main>
    </div>
  )
}
