/**
 * Sidebar NIVELMAX
 * - Ícone em container colorido com glow quando ativo
 * - Barra lateral 3px com gradiente e box-shadow
 * - Badges ao vivo (conversas, atendimento)
 * - AI status com animação de digitação
 * - Status de integrações com dots animados
 * - Grupos colapsáveis (Ferramentas)
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LayoutDashboard, ShoppingCart, Users, CreditCard,
  MessageSquare, Bot, Settings, Zap, Send, Package,
  AlertCircle, Activity, Search, Brain, Truck, BarChart2,
  Sun, Moon, ChevronDown, ChevronRight, Bell, Ticket,
} from 'lucide-react'
import { useTheme } from '../App'
import { logout } from '../pages/PageLogin'
import CommandPalette from './CommandPalette'

// ── T system ──────────────────────────────────────────────────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#7b81a0', ink4:'#3a3f5c',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)', greenBor:'rgba(0,230,118,.25)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.08)', amberBor:'rgba(255,179,0,.25)',
  red:'#ff4757',  redDim:'rgba(255,71,87,.07)',   redBor:'rgba(255,71,87,.25)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.09)',purpleBor:'rgba(167,139,250,.25)',
  blue:'#4f8ef7', blueDim:'rgba(79,142,247,.08)',  blueBor:'rgba(79,142,247,.25)',
  cyan:'#06b6d4', cyanDim:'rgba(6,182,212,.08)',   cyanBor:'rgba(6,182,212,.22)',
  orange:'#fb923c',
  sep:'rgba(255,255,255,.05)', sep2:'rgba(255,255,255,.08)',
  gray:'rgba(255,255,255,.04)',
}

// ── Mapa de navegação ─────────────────────────────────────────────────────────
export const NAV = [
  { id:'dashboard',       icon:LayoutDashboard, label:'Dashboard',       group:'main',   cor:T.purple, desc:'Visão geral e métricas'       },
  { id:'atendimento',     icon:MessageSquare,   label:'Atendimento',     group:'main',   cor:T.cyan,   desc:'Fila de atendimento humano'   },
  { id:'conversas',       icon:MessageSquare,   label:'Conversas',       group:'main',   cor:T.cyan,   desc:'Todas as conversas WhatsApp'  },
  { id:'pedidos',         icon:ShoppingCart,    label:'Pedidos',         group:'main',   cor:T.green,  desc:'Pedidos, kanban e rastreio'   },
  { id:'clientes',        icon:Users,           label:'Clientes',        group:'main',   cor:T.blue,   desc:'CRM e histórico de clientes'  },
  { id:'inteligencia',    icon:Brain,           label:'Inteligência IA', group:'main',   cor:T.purple, desc:'Análises e insights da IA'    },
  { id:'caixa',           icon:CreditCard,      label:'Fluxo de Caixa',  group:'main',   cor:T.amber,  desc:'Financeiro e receita'         },
  { id:'gatilhos',        icon:Zap,             label:'Gatilhos',        group:'tools',  cor:T.amber,  desc:'Automações e templates'       },
  { id:'rastreio-config', icon:Truck,           label:'Rastreio',        group:'tools',  cor:T.green,  desc:'Canais de rastreio'           },
  { id:'campanhas',       icon:Send,            label:'Campanhas',       group:'tools',  cor:T.cyan,   desc:'Disparos em massa'            },
  { id:'cupons',          icon:Ticket,          label:'Cupons',          group:'tools',  cor:T.amber,  desc:'Cupons e frete grátis'        },
  { id:'avise-me',        icon:Bell,            label:'Avise-me',        group:'tools',  cor:T.orange, desc:'Fila de reposição de estoque' },
  { id:'estoque',         icon:Package,         label:'Estoque',         group:'tools',  cor:T.green,  desc:'Gestão de estoque do catálogo'} ,
  { id:'disparos',        icon:BarChart2,       label:'Monitor Disparos',group:'tools',  cor:T.blue,   desc:'Histórico e analytics'        },
  { id:'ocorrencias',     icon:AlertCircle,     label:'Ocorrências',     group:'tools',  cor:T.red,    desc:'Tickets e problemas'          },
  { id:'iaconfig',        icon:Bot,             label:'Config IA',       group:'config', cor:T.purple, desc:'Personalidade e integrações'  },
  { id:'config',          icon:Settings,        label:'Configurações',   group:'config', cor:T.ink3,   desc:'Preferências do sistema'      },
  { id:'llmconfig',       icon:Zap,             label:'LLM & Bypasses',  group:'config', cor:T.blue,   desc:'Modelo e métricas'            },
]

const GRUPOS = [
  { key:'main',   label:'Principal',   colapsavel:false },
  { key:'tools',  label:'Ferramentas', colapsavel:true  },
  { key:'config', label:'Sistema',     colapsavel:true  },
]

const AI_STATES = [
  'Processando mensagens...',
  'Consultando Bling ERP...',
  'Gemini AI ativo...',
  'Respondendo clientes...',
  'Monitorando rastreios...',
  'Analisando pedidos...',
]

// ── NavItem ───────────────────────────────────────────────────────────────────
function NavItem({ item, active, onClick, badge }) {
  const [hov, setHov] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const tipTimer = useRef()
  const Icon = item.icon
  const cor  = item.cor || T.ink3

  const onEnter = () => {
    setHov(true)
    tipTimer.current = setTimeout(() => setShowTip(true), 600)
  }
  const onLeave = () => {
    setHov(false); setShowTip(false)
    clearTimeout(tipTimer.current)
  }

  return (
    <div style={{ position:'relative', margin:'1px 0' }}>
      <button onClick={onClick} onMouseEnter={onEnter} onMouseLeave={onLeave}
        style={{
          width:'100%', display:'flex', alignItems:'center', gap:9,
          padding:'6px 10px 6px 12px',
          border:'none', cursor:'pointer', textAlign:'left',
          background:'transparent', position:'relative',
          transition:'all .14s',
        }}>

        {/* Barra lateral ativa */}
        <div style={{
          position:'absolute', left:0, top:'15%', bottom:'15%',
          width:3, borderRadius:'0 3px 3px 0',
          background: active
            ? `linear-gradient(180deg,${cor},${cor}80)`
            : 'transparent',
          boxShadow: active ? `0 0 10px ${cor}60` : undefined,
          transition:'all .2s',
        }}/>

        {/* Ícone em container */}
        <div style={{
          width:30, height:30, borderRadius:9, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          background: active
            ? `linear-gradient(135deg,${cor}30,${cor}15)`
            : hov
            ? 'rgba(255,255,255,.06)'
            : 'rgba(255,255,255,.03)',
          border: `1px solid ${active ? cor+'40' : hov ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.05)'}`,
          boxShadow: active ? `0 2px 12px ${cor}25, 0 0 0 1px ${cor}15 inset` : undefined,
          transition:'all .18s',
        }}>
          <Icon size={13} strokeWidth={active ? 2.5 : 1.8}
            style={{ color: active ? cor : hov ? T.ink2 : T.ink3, transition:'color .14s' }}/>
        </div>

        {/* Label */}
        <span style={{
          fontSize:13, flex:1, textAlign:'left',
          fontWeight: active ? 600 : hov ? 500 : 400,
          color: active ? cor : hov ? T.ink2 : T.ink3,
          letterSpacing: active ? '-.01em' : 0,
          transition:'all .14s',
        }}>
          {item.label}
        </span>

        {/* Badge ao vivo */}
        {badge > 0 && (
          <span style={{
            minWidth:18, height:18, borderRadius:99,
            padding:'0 5px',
            background: badge > 5 ? T.redDim : T.greenDim,
            border: `1px solid ${badge > 5 ? T.redBor : T.greenBor}`,
            color: badge > 5 ? T.red : T.green,
            fontSize:9.5, fontWeight:700,
            display:'flex', alignItems:'center', justifyContent:'center',
            animation: badge > 5 ? 'sb-pulse 2s ease-in-out infinite' : undefined,
          }}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}

        {/* Dot ativo (sem badge) */}
        {active && !badge && (
          <div style={{
            width:5, height:5, borderRadius:'50%', flexShrink:0,
            background:cor, boxShadow:`0 0 8px ${cor}`,
          }}/>
        )}
      </button>

      {/* Tooltip */}
      {showTip && !active && item.desc && (
        <div style={{
          position:'absolute', left:'calc(100% + 8px)', top:'50%',
          transform:'translateY(-50%)',
          background:T.bg3, border:`1px solid ${T.sep2}`,
          borderRadius:9, padding:'7px 11px', zIndex:200,
          pointerEvents:'none', whiteSpace:'nowrap',
          boxShadow:'0 8px 24px rgba(0,0,0,.5)',
          animation:'sb-fadein .15s ease',
        }}>
          <div style={{ fontSize:12,fontWeight:600,color:T.ink1,marginBottom:2 }}>{item.label}</div>
          <div style={{ fontSize:10.5,color:T.ink4 }}>{item.desc}</div>
          {/* Seta */}
          <div style={{ position:'absolute',left:-5,top:'50%',transform:'translateY(-50%)',
            width:8,height:8,background:T.bg3,border:`1px solid ${T.sep2}`,
            borderRight:'none',borderTop:'none',rotate:'-45deg' }}/>
        </div>
      )}
    </div>
  )
}

// ── Grupo de navegação colapsável ─────────────────────────────────────────────
function NavGrupo({ grupo, items, page, onSelect, badges }) {
  const [aberto, setAberto] = useState(true)
  const temAtivo = items.some(i => i.id === page)

  return (
    <div>
      {/* Label do grupo */}
      <button onClick={()=>grupo.colapsavel&&setAberto(v=>!v)}
        style={{
          width:'100%', display:'flex', alignItems:'center',
          padding:'9px 12px 4px',
          background:'none', border:'none', cursor:grupo.colapsavel?'pointer':'default',
          gap:5,
        }}>
        <span style={{ fontSize:9.5,fontWeight:700,textTransform:'uppercase',
          letterSpacing:'.1em',color:T.ink4, flex:1, textAlign:'left' }}>
          {grupo.label}
        </span>
        {grupo.colapsavel && (
          <div style={{ transition:'transform .2s',
            transform:aberto?'rotate(0)':'rotate(-90deg)',color:T.ink4 }}>
            <ChevronDown size={10}/>
          </div>
        )}
        {!aberto && temAtivo && (
          <div style={{ width:5,height:5,borderRadius:'50%',
            background:T.amber,boxShadow:`0 0 6px ${T.amber}` }}/>
        )}
      </button>

      {/* Items */}
      {aberto && (
        <div style={{ animation:'sb-fadein .18s ease' }}>
          {items.map(item => (
            <NavItem key={item.id} item={item}
              active={page===item.id}
              onClick={()=>onSelect(item.id)}
              badge={badges?.[item.id]||0}/>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function Sidebar({ page, onNavigate, api='' }) {
  const { theme, toggle } = useTheme()
  const [aiIdx,     setAiIdx]     = useState(0)
  const [aiChar,    setAiChar]    = useState(0)    // efeito de digitação
  const [hora,      setHora]      = useState(()=>new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}))
  const [online,    setOnline]    = useState(true)
  const [blingOk,   setBlingOk]   = useState(false)
  const [badges,    setBadges]    = useState({})   // { conversas: 3, atendimento: 1 }
  const [cmdOpen,   setCmdOpen]   = useState(false)

  // ── AI status com efeito de digitação ──────────────────────────────────────
  useEffect(() => {
    const str  = AI_STATES[aiIdx]
    let frame  = 0
    const iv   = setInterval(() => {
      frame++
      setAiChar(Math.min(frame * 2, str.length))
      if (frame * 2 >= str.length) {
        clearInterval(iv)
        // Pausa 2.5s depois troca
        setTimeout(() => {
          setAiIdx(x => (x+1) % AI_STATES.length)
          setAiChar(0)
        }, 2500)
      }
    }, 28)
    return () => clearInterval(iv)
  }, [aiIdx])

  // ── Hora ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(()=>
      setHora(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}))
    , 30000)
    return () => clearInterval(iv)
  }, [])

  // ── Status do Bling ────────────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try { const r = await fetch(`${api}/bling/catalogo-status`); setBlingOk(r.ok); setOnline(true) }
      catch { setOnline(false) }
    }
    check(); const iv = setInterval(check, 15000); return () => clearInterval(iv)
  }, [api])

  // ── Badges ao vivo (conversas, atendimento) ────────────────────────────────
  useEffect(() => {
    const buscar = async () => {
      try {
        const r = await fetch(`${api}/api/dashboard/live-activity`, { signal:AbortSignal.timeout(4000) })
        if (!r.ok) return
        const d = await r.json()
        setBadges({
          conversas:   d.sessoes_ativas||0,
          atendimento: d.sessoes_humano||0,
        })
      } catch {}
    }
    buscar(); const iv = setInterval(buscar, 30000); return () => clearInterval(iv)
  }, [api])

  // ── ⌘K ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = e => { if ((e.metaKey||e.ctrlKey) && e.key==='k') { e.preventDefault(); setCmdOpen(v=>!v) } }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  const STATUS = [
    { n:'WhatsApp',  ok:online,  cor:T.green  },
    { n:'Bling ERP', ok:blingOk, cor:blingOk?T.green:T.amber },
    { n:'Gemini AI', ok:online,  cor:T.purple },
  ]

  return (
    <>
      <style>{`
        @keyframes sb-ping   { 0%{transform:scale(1);opacity:.5} 75%,100%{transform:scale(2.2);opacity:0} }
        @keyframes sb-pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes sb-fadein { from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:translateX(0)} }
        @keyframes sb-blink  { 0%,100%{opacity:1} 49%{opacity:1} 50%{opacity:0} }
      `}</style>

      <aside style={{
        width:220, flexShrink:0,
        display:'flex', flexDirection:'column',
        background:`linear-gradient(180deg,${T.bg2} 0%,${T.bg1} 60%,${T.bg0} 100%)`,
        borderRight:`1px solid ${T.sep}`,
        position:'relative', zIndex:10,
        boxShadow:`4px 0 24px rgba(0,0,0,.3)`,
      }}>

        {/* ── LOGO + AI ─────────────────────────────────────────────── */}
        <div style={{ padding:'18px 14px 14px',borderBottom:`1px solid ${T.sep}` }}>

          {/* Logo */}
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:13 }}>
            <div style={{
              width:38, height:38, borderRadius:12, flexShrink:0,
              background:'linear-gradient(135deg,#7c5cfc 0%,#a78bfa 100%)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:16, fontWeight:900, color:'#fff',
              boxShadow:`0 4px 20px rgba(124,92,252,.4), 0 0 0 1px rgba(255,255,255,.15) inset`,
              letterSpacing:'-.02em',
            }}>B</div>
            <div>
              <div style={{ fontSize:15,fontWeight:800,color:T.ink1,
                letterSpacing:'-.03em',lineHeight:1.2 }}>Bia</div>
              <div style={{ fontSize:10,color:T.ink4,marginTop:2 }}>Só Strass · Central IA</div>
            </div>
            {/* Status dot no logo */}
            <div style={{ marginLeft:'auto', position:'relative',width:8,height:8 }}>
              <span style={{ position:'absolute',inset:0,borderRadius:'50%',
                background:T.green,opacity:.4,animation:'sb-ping 2.5s ease-out infinite' }}/>
              <span style={{ width:8,height:8,borderRadius:'50%',
                background:T.green,display:'block',
                boxShadow:`0 0 8px ${T.green}` }}/>
            </div>
          </div>

          {/* AI Status — typing effect */}
          <div style={{ display:'flex',alignItems:'center',gap:8,
            padding:'7px 10px',borderRadius:10,
            background:T.greenDim,border:`1px solid ${T.greenBor}`,
            marginBottom:10,minHeight:30 }}>
            <Zap size={11} style={{ color:T.green,flexShrink:0 }}/>
            <span style={{ fontSize:11,fontWeight:500,color:T.green,flex:1,
              overflow:'hidden',whiteSpace:'nowrap',letterSpacing:'-.01em' }}>
              {AI_STATES[aiIdx].slice(0,aiChar)}
              <span style={{ animation:'sb-blink .8s step-end infinite',
                opacity:aiChar < AI_STATES[aiIdx].length ? 1 : 0 }}>|</span>
            </span>
          </div>

          {/* ⌘K button */}
          <button onClick={()=>setCmdOpen(true)}
            style={{ display:'flex',alignItems:'center',gap:7,padding:'7px 10px',
              borderRadius:10,border:`1px solid ${T.sep2}`,background:T.gray,
              color:T.ink4,cursor:'pointer',width:'100%',
              transition:'all .15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.purpleBor; e.currentTarget.style.color=T.purple; e.currentTarget.style.background=T.purpleDim }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.sep2; e.currentTarget.style.color=T.ink4; e.currentTarget.style.background=T.gray }}>
            <Search size={12} style={{ flexShrink:0 }}/>
            <span style={{ flex:1,textAlign:'left',fontSize:12 }}>Buscar...</span>
            <kbd style={{ fontSize:10,padding:'1px 6px',borderRadius:5,
              background:T.bg4,border:`1px solid ${T.sep2}`,
              color:T.ink4,fontFamily:'inherit' }}>⌘K</kbd>
          </button>
        </div>

        {/* ── NAVEGAÇÃO ──────────────────────────────────────────────── */}
        <nav style={{ flex:1,overflowY:'auto',padding:'8px 0',
          /* Scrollbar invisível */
          scrollbarWidth:'none' }}>
          {GRUPOS.map(g => {
            const items = NAV.filter(n=>n.group===g.key)
            if (!items.length) return null
            return (
              <NavGrupo key={g.key} grupo={g} items={items}
                page={page} onSelect={onNavigate} badges={badges}/>
            )
          })}
        </nav>

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <div style={{ borderTop:`1px solid ${T.sep}`,padding:'12px 14px' }}>

          {/* Status integrações */}
          <div style={{ marginBottom:12,display:'flex',flexDirection:'column',gap:5 }}>
            {STATUS.map(s => (
              <div key={s.n} style={{ display:'flex',alignItems:'center',
                justifyContent:'space-between' }}>
                <span style={{ fontSize:11,color:T.ink4 }}>{s.n}</span>
                <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                  <div style={{ position:'relative',width:7,height:7 }}>
                    {s.ok && (
                      <span style={{ position:'absolute',inset:0,borderRadius:'50%',
                        background:s.cor,opacity:.4,
                        animation:'sb-ping 3s ease-out infinite' }}/>
                    )}
                    <span style={{ width:7,height:7,borderRadius:'50%',display:'block',
                      background:s.ok?s.cor:T.red,
                      boxShadow:s.ok?`0 0 6px ${s.cor}`:undefined }}/>
                  </div>
                  <span style={{ fontSize:10,fontWeight:700,color:s.ok?s.cor:T.red }}>
                    {s.ok?'OK':'Off'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Separador */}
          <div style={{ height:1,background:T.sep,marginBottom:10 }}/>

          {/* Controles */}
          <div style={{ display:'flex',gap:6,marginBottom:8 }}>
            <button onClick={toggle}
              style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                padding:'7px',borderRadius:9,border:`1px solid ${T.sep2}`,
                background:T.gray,color:T.ink3,cursor:'pointer',fontSize:11.5,
                transition:'all .15s' }}
              onMouseEnter={e=>{ e.currentTarget.style.color=T.ink1; e.currentTarget.style.borderColor=T.sep2 }}
              onMouseLeave={e=>{ e.currentTarget.style.color=T.ink3 }}>
              {theme==='dark' ? <Sun size={12}/> : <Moon size={12}/>}
              {theme==='dark' ? 'Claro' : 'Escuro'}
            </button>
            <button onClick={logout}
              style={{ padding:'7px 11px',borderRadius:9,border:`1px solid ${T.sep2}`,
                background:T.gray,color:T.ink4,cursor:'pointer',fontSize:11.5,
                transition:'all .15s' }}
              onMouseEnter={e=>{ e.currentTarget.style.color=T.red; e.currentTarget.style.borderColor=T.redBor; e.currentTarget.style.background=T.redDim }}
              onMouseLeave={e=>{ e.currentTarget.style.color=T.ink4; e.currentTarget.style.borderColor=T.sep2; e.currentTarget.style.background=T.gray }}>
              Sair
            </button>
          </div>

          {/* Versão + hora */}
          <div style={{ display:'flex',justifyContent:'space-between',padding:'0 1px' }}>
            <span style={{ fontSize:10,color:T.ink4 }}>v2.0</span>
            <span style={{ fontFamily:'monospace',fontSize:10,color:T.ink4 }}>{hora}</span>
          </div>
        </div>
      </aside>

      {cmdOpen && (
        <CommandPalette
          api={api}
          onNavigate={(dest)=>{ setCmdOpen(false); onNavigate?.(dest) }}
          onClose={()=>setCmdOpen(false)}
        />
      )}
    </>
  )
}
