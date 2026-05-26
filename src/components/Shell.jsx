import { useState, useEffect, Suspense, lazy } from 'react'
import React from 'react'
import { useTheme } from '../App'
import { logout } from '../pages/PageLogin'
import {
  LayoutDashboard, ShoppingCart, Users, CreditCard,
  MessageSquare, Bot, Settings, Sun, Moon, Zap, Send, Package,
  AlertCircle, Activity, Construction, Search
} from 'lucide-react'
import CommandPalette from './CommandPalette'
import LiveActivityBar from './LiveActivityBar'

const PageDebugPedido = lazy(() => import('../pages/PageDebugPedido'))
const PageDashboard   = lazy(() => import('../pages/PageDashboard'))
const PagePedidosDebug= lazy(() => import('../pages/PagePedidosDebug'))
const PagePedidos     = lazy(() => import('../pages/PagePedidos'))
const PageClientes    = lazy(() => import('../pages/PageClientes'))
const PageInteligencia = lazy(() => import('../pages/PageInteligencia'))
const PageCaixa       = lazy(() => import('../pages/PageCaixa'))
const PageAtendimento = lazy(() => import('../pages/PageAtendimento'))
const PageIAConfig    = lazy(() => import('../pages/PageIAConfig'))
const PageLLMConfig   = lazy(() => import('../pages/PageLLMConfig'))
const PageGatilhos    = lazy(() => import('../pages/PageGatilhos'))
const PageConversas   = lazy(() => import('../pages/PageConversas'))
const PageDisparos    = lazy(() => import('../pages/PageDisparos'))
const PageOcorrencias = lazy(() => import('../pages/PageOcorrencias'))

const API = import.meta.env.VITE_API_URL || ''

const NAV = [
  { id:'dashboard',   icon:LayoutDashboard, label:'Dashboard',      group:'main'   },
  { id:'atendimento', icon:MessageSquare,   label:'Atendimento',    group:'main'   },
  { id:'conversas',   icon:MessageSquare,   label:'Conversas',      group:'main'   },
  { id:'debug-pedidos', icon:Activity, label:'Debug Pedidos', group:'tools' },
  { id:'debug-pedido-raw', icon:Activity, label:'Debug Pedido Raw', group:'tools' },
  { id:'pedidos',     icon:ShoppingCart,    label:'Pedidos',        group:'main'   },
  { id:'clientes',    icon:Users,           label:'Clientes',       group:'main'   },
  { id:'inteligencia',icon:Brain,           label:'Inteligência IA',group:'main'   },
  { id:'caixa',       icon:CreditCard,      label:'Fluxo de Caixa', group:'main'   },
  { id:'gatilhos',    icon:Zap,             label:'Gatilhos',       group:'tools'  },
  { id:'disparos',    icon:Activity,        label:'Disparos',       group:'tools'  },
  { id:'ocorrencias', icon:AlertCircle,     label:'Ocorrências',    group:'tools'  },
  { id:'enviomassa',  icon:Send,            label:'Envio em Massa', group:'tools'  },
  { id:'avise',       icon:Package,         label:'Avise-me',       group:'tools'  },
  { id:'iaconfig',    icon:Bot,             label:'Config IA',      group:'config' },
  { id:'config',      icon:Settings,        label:'Configurações',  group:'config' },
  { id:'llmconfig',   icon:Zap,             label:'LLM & Bypasses',  group:'config' },
]

const AI_STATES = ['Processando...','Bling ERP...','Gemini AI...','Respondendo...']

const Spinner = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--label-3)', fontSize:13, gap:10, flexDirection:'column' }}>
    <div style={{ width:20, height:20, border:'2px solid var(--sep)', borderTop:'2px solid var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    Carregando...
  </div>
)

const EmBreve = ({ title }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, color:'var(--label-3)' }}>
    <Construction size={32} style={{opacity:.3}}/>
    <div style={{ fontSize:15, fontWeight:500, color:'var(--label)' }}>{title}</div>
    <div style={{ fontSize:13 }}>Em desenvolvimento</div>
  </div>
)

class ErroBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null } }
  static getDerivedStateFromError(e) { return { err: e } }
  render() {
    if (this.state.err) return (
      <div style={{ padding:32, color:'#ff6666', fontFamily:'monospace', fontSize:12, overflowY:'auto' }}>
        <strong>Erro na página {this.props.nome}:</strong><br /><br />
        {String(this.state.err?.message)}<br /><br />
        <pre style={{ whiteSpace:'pre-wrap', color:'#888', fontSize:11 }}>
          {String(this.state.err?.stack || '').split('\n').slice(0,8).join('\n')}
        </pre>
      </div>
    )
    return this.props.children
  }
}

const Page = ({ nome, comp: Comp }) => (
  <ErroBoundary nome={nome}>
    <Suspense fallback={<Spinner />}>
      <Comp api={API} />
    </Suspense>
  </ErroBoundary>
)

export default function Shell() {
  const { theme, toggle } = useTheme()
  const [page,   setPage]   = useState('dashboard')
  const [aiIdx,  setAiIdx]  = useState(0)
  const [online, setOnline] = useState(true)
  const [blingOk,setBlingOk]= useState(false)
  const [cmdOpen,setCmdOpen]= useState(false)

  useEffect(() => {
    const i = setInterval(() => setAiIdx(x => (x + 1) % AI_STATES.length), 3500)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    const fn = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(v => !v)
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  useEffect(() => {
    const check = async () => {
      try { const r = await fetch(`${API}/bling/catalogo-status`); setBlingOk(r.ok); setOnline(true) }
      catch { setOnline(false) }
    }
    check(); const i = setInterval(check, 15000); return () => clearInterval(i)
  }, [])

  const conteudo = () => {
    switch(page) {
      case 'dashboard':   return <Page nome="Dashboard"   comp={PageDashboard}   />
      case 'atendimento': return <Page nome="Atendimento" comp={PageAtendimento} />
      case 'pedidos':     return <Page nome="Pedidos"     comp={PagePedidos}     />
      case 'debug-pedidos': return <Page nome="Debug Pedidos" comp={PagePedidosDebug} />
      case 'debug-pedido-raw': return <Page nome="Debug Pedido" comp={PageDebugPedido} />
      case 'clientes':    return <Page nome="Clientes"    comp={PageClientes}    />
      case 'inteligencia': return <Page nome="Inteligência" comp={PageInteligencia} />
      case 'caixa':       return <Page nome="Caixa"       comp={PageCaixa}       />
      case 'iaconfig':    return <Page nome="Config IA"   comp={PageIAConfig}    />
      case 'llmconfig':   return <Page nome="LLM & Bypasses" comp={PageLLMConfig}  />
      case 'gatilhos':    return <Page nome="Gatilhos"       comp={PageGatilhos}   />
      case 'conversas':    return (
        <ErroBoundary nome="Conversas">
          <Suspense fallback={<Spinner />}>
            <PageConversas api={API} onNavigate={(destino, params={}) => {
              setPage(destino)
              if (params.novaOcorrencia && params.tel) {
                sessionStorage.setItem('bia_nova_ocorrencia', JSON.stringify(params))
              }
            }}/>
          </Suspense>
        </ErroBoundary>
      )
      case 'disparos':     return <Page nome="Disparos"       comp={PageDisparos}    />
      case 'ocorrencias':  return <Page nome="Ocorrências"    comp={PageOcorrencias} />      default: return <EmBreve title={NAV.find(n => n.id === page)?.label || page} />
    }
  }

  const grupos = [
    { label:'Principal',   items: NAV.filter(n => n.group === 'main')   },
    { label:'Ferramentas', items: NAV.filter(n => n.group === 'tools')  },
    { label:'Sistema',     items: NAV.filter(n => n.group === 'config') },
  ]

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* Sidebar */}
        <aside style={{ width:210, flexShrink:0, display:'flex', flexDirection:'column', background:'var(--bg-2)', borderRight:'0.5px solid var(--sep)' }}>

          {/* Logo */}
          <div style={{ padding:'16px 14px 12px', borderBottom:'0.5px solid var(--sep)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#000', flexShrink:0 }}>S</div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--label)', lineHeight:1.2 }}>Bia</div>
                <div style={{ fontSize:11, color:'var(--label-3)' }}>Só Strass</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 8px', borderRadius:7, background:'var(--accent-dim)' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', flexShrink:0 }} />
              <span style={{ fontSize:11, fontWeight:500, color:'var(--accent)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{AI_STATES[aiIdx]}</span>
            </div>
            {/* Botão ⌘K */}
            <button onClick={() => setCmdOpen(true)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 10px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', width:'100%', marginTop:7, fontSize:12 }}>
              <Search size={12} style={{ flexShrink:0 }}/>
              <span style={{ flex:1, textAlign:'left', color:'var(--label-4)', fontSize:12 }}>Buscar...</span>
              <kbd style={{ fontSize:10, padding:'1px 5px', borderRadius:4, background:'var(--bg-2)', border:'1px solid var(--sep)', color:'var(--label-4)', fontFamily:'inherit' }}>⌘K</kbd>
            </button>
          </div>

          {/* Nav */}
          <nav style={{ flex:1, overflowY:'auto', padding:'6px 0' }}>
            {grupos.map(g => (
              <div key={g.label}>
                <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--label-3)', padding:'8px 14px 3px' }}>{g.label}</div>
                {g.items.map(item => {
                  const ativo = page === item.id
                  return (
                    <button key={item.id} onClick={() => setPage(item.id)} style={{
                      width:'calc(100% - 10px)', margin:'0 5px 1px', display:'flex', alignItems:'center',
                      gap:8, padding:'7px 9px', borderRadius:7, border:'none', cursor:'pointer', textAlign:'left',
                      background: ativo ? 'var(--accent-dim)' : 'transparent',
                      color:      ativo ? 'var(--accent)'     : 'var(--label-2)',
                    }}>
                      <item.icon size={14} strokeWidth={ativo ? 2.5 : 1.8} />
                      <span style={{ fontSize:13, fontWeight: ativo ? 600 : 400 }}>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div style={{ padding:'10px 12px', borderTop:'0.5px solid var(--sep)' }}>
            <div style={{ marginBottom:8 }}>
              {[
                { n:'Bia WhatsApp', ok:online  },
                { n:'Bling ERP',    ok:blingOk },
                { n:'Mercado Pago', ok:online  },
              ].map(s => (
                <div key={s.n} style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:11, color:'var(--label-3)' }}>{s.n}</span>
                  <span style={{ fontSize:10, fontWeight:600, color: s.ok ? 'var(--accent)' : '#EF9F27' }}>● {s.ok ? 'OK' : 'Off'}</span>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:6 }}>
            <button onClick={toggle} style={{ flex:1, display:'flex', alignItems:'center', gap:6, padding:'6px 9px', borderRadius:7, border:'none', cursor:'pointer', background:'var(--fill)', color:'var(--label-2)' }}>
              {theme === 'dark' ? <Sun size={13}/> : <Moon size={13}/>}
              <span style={{ fontSize:11 }}>{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
            </button>
            <button onClick={logout} style={{ padding:'6px 9px', borderRadius:7, border:'none', cursor:'pointer', background:'var(--fill)', color:'var(--label-3)', fontSize:11 }} title="Sair">
              Sair
            </button>
          </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex:1, overflow:'hidden', background:'var(--bg)' }}>
          {conteudo()}
        </main>

      </div>
        </div>
        {/* Live Activity Bar — sempre visível na base */}
        <LiveActivityBar api={API} onNavigate={setPage}/>

      {/* Command Palette */}
      {cmdOpen && (
        <CommandPalette
          api={API}
          onNavigate={(page, params={}) => {
            setPage(page)
            if (params.telefone) sessionStorage.setItem('cmd_goto_tel', params.telefone)
          }}
          onClose={() => setCmdOpen(false)}
        />
      )}
    </>
  )
}
