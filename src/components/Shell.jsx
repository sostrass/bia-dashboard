import { useState, useEffect, Suspense, lazy } from 'react'
import React from 'react'
import { useTheme } from '../App'
import { logout } from '../pages/PageLogin'
import {
  LayoutDashboard, ShoppingCart, Users, CreditCard,
  MessageSquare, Bot, Settings, Sun, Moon, Zap, Send, Package,
  AlertCircle, Activity, Search, Brain, Truck, BarChart2,
  ChevronRight,
Ticket, } from 'lucide-react'
import CommandPalette from './CommandPalette'
import LiveActivityBar from './LiveActivityBar'
import Sidebar from './Sidebar'

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
const PageCentralConfig  = lazy(()=>import('../pages/PageCentralConfig'))
const PageGatilhos       = lazy(()=>import('../pages/PageGatilhos'))
const PageConversas      = lazy(()=>import('../pages/PageConversas'))
const PageDisparos       = lazy(()=>import('../pages/PageDisparos'))
const PageCampanhas      = lazy(()=>import('../pages/PageCampanhas'))
const PageOcorrencias    = lazy(()=>import('../pages/PageOcorrencias'))
const PageCupons         = lazy(()=>import('../pages/PageCupons'))
const PageEstoque        = lazy(()=>import('../pages/PageEstoque'))
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
  { id:'cupons',            icon:Ticket,          label:'Cupons',           group:'tools',  cor:T.amber  },
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
      case 'config':          return <Page nome="Configurações"  comp={PageCentralConfig}/>
      case 'gatilhos':        return <Page nome="Gatilhos"      comp={PageGatilhos}/>
      case 'rastreio-config': return <Page nome="Rastreio"      comp={PageRastreioConfig}/>
      case 'campanhas':       return <Page nome="Campanhas"     comp={PageCampanhas}/>
      case 'cupons':          return <Page nome="Cupons"        comp={PageCupons}/>
      case 'avise-me':        return <Page nome="Avise-me"      comp={PageEstoque}/>
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
          <Sidebar page={page} onNavigate={setPage} api={API}/>

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
