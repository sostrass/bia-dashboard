import { useState, useEffect, Suspense, lazy } from 'react'
import React from 'react'
import { useTheme } from '../App'
import { logout } from '../pages/PageLogin'
import {
  LayoutDashboard, ShoppingCart, Users, CreditCard,
  MessageSquare, Bot, Settings, Sun, Moon, Zap, Send, Package,
  AlertCircle, Activity, Search, Brain, Truck, BarChart2,
  ChevronRight,
} from 'lucide-react'
import CommandPalette from './CommandPalette'
import LiveActivityBar from './LiveActivityBar'

// ── T system ──────────────────────────────────────────────────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#7b81a0', ink4:'#3a3f5c',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)', greenBor:'rgba(0,230,118,.25)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.08)', amberBor:'rgba(255,179,0,.25)',
  red:'#ff4757',  redDim:'rgba(255,71,87,.07)',   redBor:'rgba(255,71,87,.25)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.09)',purpleBor:'rgba(167,139,250,.25)',
  cyan:'#06b6d4', cyanDim:'rgba(6,182,212,.08)',   cyanBor:'rgba(6,182,212,.22)',
  blue:'#4f8ef7', blueDim:'rgba(79,142,247,.08)',  blueBor:'rgba(79,142,247,.25)',
  sep:'rgba(255,255,255,.05)', sep2:'rgba(255,255,255,.08)',
  gray:'rgba(255,255,255,.04)',
}

// ── Lazy pages ────────────────────────────────────────────────────────────────
const PageDebugPedido    = lazy(()=>import('../pages/PageDebugPedido'))
const PageDashboard      = lazy(()=>import('../pages/PageDashboard'))
const PagePedidosDebug   = lazy(()=>import('../pages/PagePedidosDebug'))
const PagePedidos        = lazy(()=>import('../pages/PagePedidos'))
const PageClientes       = lazy(()=>import('../pages/PageClientes'))
const PageInteligencia   = lazy(()=>import('../pages/PageInteligencia'))
const PageCaixa          = lazy(()=>import('../pages/PageCaixa'))
const PageAtendimento    = lazy(()=>import('../pages/PageAtendimento'))
const PageIAConfig       = lazy(()=>import('../pages/PageIAConfig'))
const PageLLMConfig      = lazy(()=>import('../pages/PageLLMConfig'))
const PageGatilhos       = lazy(()=>import('../pages/PageGatilhos'))
const PageConversas      = lazy(()=>import('../pages/PageConversas'))
const PageDisparos       = lazy(()=>import('../pages/PageDisparos'))
const PageCampanhas      = lazy(()=>import('../pages/PageCampanhas'))
const PageOcorrencias    = lazy(()=>import('../pages/PageOcorrencias'))
const PageRastreioConfig = lazy(()=>import('../pages/PageRastreioConfig'))

const API = import.meta.env.VITE_API_URL || ''

const NAV = [
  { id:'dashboard',         icon:LayoutDashboard, label:'Dashboard',        group:'main',   cor:T.purple },
  { id:'atendimento',       icon:MessageSquare,   label:'Atendimento',      group:'main',   cor:T.cyan   },
  { id:'conversas',         icon:MessageSquare,   label:'Conversas',        group:'main',   cor:T.cyan   },
  { id:'pedidos',           icon:ShoppingCart,    label:'Pedidos',          group:'main',   cor:T.green  },
  { id:'clientes',          icon:Users,           label:'Clientes',         group:'main',   cor:T.blue   },
  { id:'inteligencia',      icon:Brain,           label:'Inteligência IA',  group:'main',   cor:T.purple },
  { id:'caixa',             icon:CreditCard,      label:'Fluxo de Caixa',   group:'main',   cor:T.amber  },
  { id:'gatilhos',          icon:Zap,             label:'Gatilhos',         group:'tools',  cor:T.amber  },
  { id:'rastreio-config',   icon:Truck,           label:'Rastreio',         group:'tools',  cor:T.green  },
  { id:'campanhas',         icon:Send,            label:'Campanhas',        group:'tools',  cor:T.cyan   },
  { id:'disparos',          icon:BarChart2,       label:'Monitor Disparos', group:'tools',  cor:T.blue   },
  { id:'ocorrencias',       icon:AlertCircle,     label:'Ocorrências',      group:'tools',  cor:T.red    },
  { id:'debug-pedidos',     icon:Activity,        label:'Debug Pedidos',    group:'tools',  cor:T.ink3   },
  { id:'debug-pedido-raw',  icon:Activity,        label:'Debug Raw',        group:'tools',  cor:T.ink3   },
  { id:'iaconfig',          icon:Bot,             label:'Config IA',        group:'config', cor:T.purple },
  { id:'config',            icon:Settings,        label:'Configurações',    group:'config', cor:T.ink3   },
  { id:'llmconfig',         icon:Zap,             label:'LLM & Bypasses',   group:'config', cor:T.blue   },
]

const AI_STATES = [
  'Processando mensagens...',
  'Consultando Bling ERP...',
  'Gemini AI ativo...',
  'Respondendo clientes...',
  'Monitorando rastreios...',
]

const GRUPOS = [
  { key:'main',   label:'Principal'   },
  { key:'tools',  label:'Ferramentas' },
  { key:'config', label:'Sistema'     },
]

// ── Utilitários ────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display:'flex',alignItems:'center',justifyContent:'center',
    height:'100%',color:T.ink4,fontSize:13,gap:10,flexDirection:'column' }}>
    <div style={{ width:20,height:20,border:`2px solid ${T.sep}`,
      borderTop:`2px solid ${T.green}`,borderRadius:'50%',animation:'shell-spin .8s linear infinite' }}/>
    Carregando...
  </div>
)

const EmBreve = ({ title }) => (
  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',
    justifyContent:'center',height:'100%',gap:12,color:T.ink3 }}>
    <Settings size={32} style={{ opacity:.2 }}/>
    <div style={{ fontSize:15,fontWeight:600,color:T.ink2 }}>{title}</div>
    <div style={{ fontSize:13 }}>Em desenvolvimento</div>
  </div>
)

class ErroBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err:null } }
  static getDerivedStateFromError(e) { return { err:e } }
  render() {
    if (this.state.err) return (
      <div style={{ padding:32,color:T.red,fontFamily:'monospace',fontSize:12,overflowY:'auto' }}>
        <strong>Erro na página {this.props.nome}:</strong><br/><br/>
        {String(this.state.err?.message)}<br/><br/>
        <pre style={{ whiteSpace:'pre-wrap',color:T.ink3,fontSize:11 }}>
          {String(this.state.err?.stack||'').split('\n').slice(0,8).join('\n')}
        </pre>
      </div>
    )
    return this.props.children
  }
}

const Page = ({ nome, comp:Comp }) => (
  <ErroBoundary nome={nome}>
    <Suspense fallback={<Spinner/>}>
      <Comp api={API}/>
    </Suspense>
  </ErroBoundary>
)

// ── NavItem ───────────────────────────────────────────────────────────────────
function NavItem({ item, active, onClick }) {
  const [hov, setHov] = useState(false)
  const Icon = item.icon
  const cor  = item.cor || T.ink3
  const ativ = active || hov

  return (
    <button onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        width:'calc(100% - 10px)', margin:'0 5px 1px',
        display:'flex', alignItems:'center', gap:8,
        padding:'7px 9px', borderRadius:8,
        border:`1px solid ${active ? cor+'30' : 'transparent'}`,
        cursor:'pointer', textAlign:'left',
        background: active ? `${cor}12` : hov ? T.gray : 'transparent',
        color:  active ? cor : hov ? T.ink2 : T.ink3,
        transition:'all .12s',
      }}>
      <Icon size={14} strokeWidth={active ? 2.5 : 1.8}
        style={{ color: active ? cor : hov ? T.ink2 : T.ink3, flexShrink:0 }}/>
      <span style={{ fontSize:13, fontWeight: active ? 600 : 400, flex:1 }}>
        {item.label}
      </span>
      {active && (
        <div style={{ width:5, height:5, borderRadius:'50%',
          background:cor, boxShadow:`0 0 6px ${cor}`, flexShrink:0 }}/>
      )}
    </button>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────
export default function Shell() {
  const { theme, toggle } = useTheme()
  const [page,    setPage]    = useState('dashboard')
  const [aiIdx,   setAiIdx]   = useState(0)
  const [online,  setOnline]  = useState(true)
  const [blingOk, setBlingOk] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [hora,    setHora]    = useState(() =>
    new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}))

  useEffect(() => {
    const i = setInterval(() => {
      setAiIdx(x => (x+1) % AI_STATES.length)
      setHora(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}))
    }, 4000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    const fn = e => {
      if ((e.metaKey||e.ctrlKey) && e.key==='k') { e.preventDefault(); setCmdOpen(v=>!v) }
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
      case 'dashboard':       return <Page nome="Dashboard"     comp={PageDashboard}/>
      case 'atendimento':     return <Page nome="Atendimento"   comp={PageAtendimento}/>
      case 'pedidos':         return <Page nome="Pedidos"       comp={PagePedidos}/>
      case 'debug-pedidos':   return <Page nome="Debug Pedidos" comp={PagePedidosDebug}/>
      case 'debug-pedido-raw':return <Page nome="Debug Pedido"  comp={PageDebugPedido}/>
      case 'clientes':        return <Page nome="Clientes"      comp={PageClientes}/>
      case 'inteligencia':    return <Page nome="Inteligência"  comp={PageInteligencia}/>
      case 'caixa':           return <Page nome="Caixa"         comp={PageCaixa}/>
      case 'iaconfig':        return <Page nome="Config IA"     comp={PageIAConfig}/>
      case 'llmconfig':       return <Page nome="LLM"           comp={PageLLMConfig}/>
      case 'gatilhos':        return <Page nome="Gatilhos"      comp={PageGatilhos}/>
      case 'rastreio-config': return <Page nome="Rastreio"      comp={PageRastreioConfig}/>
      case 'campanhas':       return <Page nome="Campanhas"     comp={PageCampanhas}/>
      case 'disparos':        return <Page nome="Disparos"      comp={PageDisparos}/>
      case 'ocorrencias':     return <Page nome="Ocorrências"   comp={PageOcorrencias}/>
      case 'conversas': return (
        <ErroBoundary nome="Conversas">
          <Suspense fallback={<Spinner/>}>
            <PageConversas api={API} onNavigate={(dest,params={})=>{
              setPage(dest)
              if (params.novaOcorrencia && params.tel)
                sessionStorage.setItem('bia_nova_ocorrencia', JSON.stringify(params))
            }}/>
          </Suspense>
        </ErroBoundary>
      )
      default: return <EmBreve title={NAV.find(n=>n.id===page)?.label||page}/>
    }
  }

  const STATUS = [
    { n:'Bia WhatsApp', ok:online  },
    { n:'Bling ERP',    ok:blingOk },
    { n:'Gemini AI',    ok:online  },
  ]

  return (
    <>
      <style>{`
        @keyframes shell-spin { to{transform:rotate(360deg)} }
        @keyframes shell-ping { 0%{transform:scale(1);opacity:.5} 75%,100%{transform:scale(2);opacity:0} }
        @keyframes shell-fade { from{opacity:0;transform:translateY(2px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ display:'flex',flexDirection:'column',height:'100%',background:T.bg0 }}>

        {/* Live Activity Bar (topo) */}
        <LiveActivityBar api={API} onNavigate={setPage}/>

        <div style={{ display:'flex',flex:1,overflow:'hidden' }}>

          {/* ── SIDEBAR ────────────────────────────────────────────────── */}
          <aside style={{
            width:214, flexShrink:0,
            display:'flex', flexDirection:'column',
            background:`linear-gradient(180deg,${T.bg2} 0%,${T.bg1} 100%)`,
            borderRight:`1px solid ${T.sep}`,
            position:'relative', zIndex:10,
          }}>

            {/* Logo + AI status */}
            <div style={{ padding:'16px 14px 12px',borderBottom:`1px solid ${T.sep}` }}>
              {/* Logo */}
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:11 }}>
                <div style={{
                  width:36, height:36, borderRadius:11, flexShrink:0,
                  background:'linear-gradient(135deg,#7c5cfc,#a78bfa)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:15, fontWeight:800, color:'#fff',
                  boxShadow:`0 4px 16px rgba(124,92,252,.35)`,
                }}>B</div>
                <div>
                  <div style={{ fontSize:14.5,fontWeight:700,color:T.ink1,lineHeight:1.2,letterSpacing:'-.02em' }}>
                    Bia
                  </div>
                  <div style={{ fontSize:10.5,color:T.ink4 }}>Só Strass · Central IA</div>
                </div>
              </div>

              {/* AI status pill */}
              <div style={{ display:'flex',alignItems:'center',gap:7,
                padding:'6px 10px',borderRadius:9,
                background:T.greenDim,border:`1px solid ${T.greenBor}`,
                marginBottom:9 }}>
                <span style={{ position:'relative',display:'inline-flex',width:7,height:7,flexShrink:0 }}>
                  <span style={{ position:'absolute',inset:0,borderRadius:'50%',
                    background:T.green,opacity:.4,animation:'shell-ping 2s ease-out infinite' }}/>
                  <span style={{ width:7,height:7,borderRadius:'50%',background:T.green,display:'block' }}/>
                </span>
                <span style={{ fontSize:11,fontWeight:600,color:T.green,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                  {AI_STATES[aiIdx]}
                </span>
              </div>

              {/* Botão ⌘K */}
              <button onClick={()=>setCmdOpen(true)}
                style={{ display:'flex',alignItems:'center',gap:7,padding:'7px 10px',
                  borderRadius:9,border:`1px solid ${T.sep2}`,background:T.gray,
                  color:T.ink4,cursor:'pointer',width:'100%',fontSize:12,
                  transition:'all .12s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.purpleBor; e.currentTarget.style.color=T.purple }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.sep2; e.currentTarget.style.color=T.ink4 }}>
                <Search size={12} style={{ flexShrink:0 }}/>
                <span style={{ flex:1,textAlign:'left' }}>Buscar...</span>
                <kbd style={{ fontSize:10,padding:'1px 6px',borderRadius:5,
                  background:T.bg4,border:`1px solid ${T.sep2}`,
                  color:T.ink4,fontFamily:'inherit' }}>⌘K</kbd>
              </button>
            </div>

            {/* Navegação */}
            <nav style={{ flex:1,overflowY:'auto',padding:'6px 0' }}>
              {GRUPOS.map(g => {
                const items = NAV.filter(n=>n.group===g.key)
                if (!items.length) return null
                return (
                  <div key={g.key}>
                    <div style={{ fontSize:9.5,fontWeight:700,textTransform:'uppercase',
                      letterSpacing:'.09em',color:T.ink4,padding:'10px 14px 4px' }}>
                      {g.label}
                    </div>
                    {items.map(item => (
                      <NavItem key={item.id} item={item}
                        active={page===item.id}
                        onClick={()=>setPage(item.id)}/>
                    ))}
                  </div>
                )
              })}
            </nav>

            {/* Footer */}
            <div style={{ padding:'10px 12px 12px',borderTop:`1px solid ${T.sep}` }}>
              {/* Status integrações */}
              <div style={{ marginBottom:10 }}>
                {STATUS.map(s => (
                  <div key={s.n} style={{ display:'flex',justifyContent:'space-between',
                    alignItems:'center',marginBottom:5 }}>
                    <span style={{ fontSize:11,color:T.ink4 }}>{s.n}</span>
                    <div style={{ display:'flex',alignItems:'center',gap:4 }}>
                      <div style={{ width:5,height:5,borderRadius:'50%',
                        background:s.ok?T.green:T.amber,
                        boxShadow:s.ok?`0 0 5px ${T.green}`:undefined }}/>
                      <span style={{ fontSize:10,fontWeight:700,
                        color:s.ok?T.green:T.amber }}>
                        {s.ok?'OK':'Off'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controles */}
              <div style={{ display:'flex',gap:6 }}>
                <button onClick={toggle}
                  style={{ flex:1,display:'flex',alignItems:'center',gap:6,
                    padding:'7px 10px',borderRadius:8,border:`1px solid ${T.sep2}`,
                    background:T.gray,color:T.ink3,cursor:'pointer',fontSize:11,
                    transition:'all .12s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.color=T.ink1; e.currentTarget.style.borderColor=T.sep2 }}
                  onMouseLeave={e=>{ e.currentTarget.style.color=T.ink3 }}>
                  {theme==='dark' ? <Sun size={12}/> : <Moon size={12}/>}
                  {theme==='dark' ? 'Claro' : 'Escuro'}
                </button>
                <button onClick={logout}
                  style={{ padding:'7px 10px',borderRadius:8,border:`1px solid ${T.sep2}`,
                    background:T.gray,color:T.ink4,cursor:'pointer',fontSize:11,
                    transition:'all .12s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.color=T.red; e.currentTarget.style.borderColor=T.redBor }}
                  onMouseLeave={e=>{ e.currentTarget.style.color=T.ink4; e.currentTarget.style.borderColor=T.sep2 }}>
                  Sair
                </button>
              </div>

              {/* Versão + hora */}
              <div style={{ display:'flex',justifyContent:'space-between',
                marginTop:8,padding:'0 2px' }}>
                <span style={{ fontSize:10,color:T.ink4 }}>v2.0</span>
                <span style={{ fontFamily:'monospace',fontSize:10,color:T.ink4 }}>{hora}</span>
              </div>
            </div>
          </aside>

          {/* ── Main ───────────────────────────────────────────────────── */}
          <main style={{ flex:1,overflow:'hidden',position:'relative',background:T.bg0 }}>
            {conteudo()}
          </main>
        </div>
      </div>

      {/* Command Palette */}
      {cmdOpen && (
        <CommandPalette api={API}
          onNavigate={(dest,params={})=>{
            setPage(dest)
            if (params.telefone) sessionStorage.setItem('cmd_goto_tel',params.telefone)
          }}
          onClose={()=>setCmdOpen(false)}/>
      )}
    </>
  )
}
