import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare, ShoppingCart, Zap, Users, Activity,
  WifiOff, ChevronUp, TrendingUp, X, Check,
} from 'lucide-react'

// ── T system ──────────────────────────────────────────────────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#7b81a0', ink4:'#3a3f5c',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)', greenBor:'rgba(0,230,118,.25)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.08)', amberBor:'rgba(255,179,0,.25)',
  red:'#ff4757',  redDim:'rgba(255,71,87,.08)',   redBor:'rgba(255,71,87,.25)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.09)',purpleBor:'rgba(167,139,250,.25)',
  cyan:'#06b6d4', cyanDim:'rgba(6,182,212,.08)',   cyanBor:'rgba(6,182,212,.22)',
  blue:'#4f8ef7', blueDim:'rgba(79,142,247,.08)',  blueBor:'rgba(79,142,247,.25)',
  sep:'rgba(255,255,255,.05)', sep2:'rgba(255,255,255,.08)',
  gray:'rgba(255,255,255,.04)',
}

const fmtNum = n => Number(n||0).toLocaleString('pt-BR')

// ── Spark histórico em memória (sem localStorage) ─────────────────────────────
function useSpark(value, size=20) {
  const hist = useRef(Array(size).fill(0))
  useEffect(() => {
    hist.current = [...hist.current.slice(1), value]
  }, [value])
  return hist.current
}

// ── Sparkline SVG com gradiente ───────────────────────────────────────────────
function Spark({ data=[], cor=T.green, width=52, height=20 }) {
  if (!data || data.every(v=>v===0)) return null
  const max  = Math.max(...data, 1)
  const W=width, H=height
  const pts  = data.map((v,i)=>{
    const x = (i/(data.length-1))*W
    const y = H-2-(v/max)*(H-6)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const areaTop = pts
  const areaBot = `${W},${H} 0,${H}`
  const gid = `sg-${cor.replace(/[^a-z0-9]/gi,'').slice(0,8)}`
  return (
    <svg width={W} height={H} style={{ overflow:'visible',flexShrink:0 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity=".35"/>
          <stop offset="100%" stopColor={cor} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`${areaTop} ${areaBot}`} fill={`url(#${gid})`}/>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ filter:`drop-shadow(0 0 3px ${cor}60)` }}/>
    </svg>
  )
}

// ── Dot vivo pulsante ──────────────────────────────────────────────────────────
function LiveDot({ active=true, cor=T.green, size=7 }) {
  return (
    <span style={{ position:'relative',display:'inline-flex',width:size,height:size,flexShrink:0 }}>
      {active && (
        <span style={{ position:'absolute',inset:0,borderRadius:'50%',
          background:cor,opacity:.4,animation:'lab-ping 1.8s ease-out infinite' }}/>
      )}
      <span style={{ width:size,height:size,borderRadius:'50%',
        background:active?cor:T.ink4,display:'block',
        boxShadow:active?`0 0 6px ${cor}80`:undefined }}/>
    </span>
  )
}

// ── Métrica individual ──────────────────────────────────────────────────────────
function Metric({ label, value, sub, cor, icon:Ic, spark, pulse=false, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:'flex',alignItems:'center',gap:7,
        padding:'0 13px',height:'100%',
        border:'none',borderRight:`1px solid ${T.sep}`,
        background:hov&&onClick?T.gray:'transparent',
        cursor:onClick?'pointer':'default',
        transition:'background .12s' }}>
      <LiveDot active={pulse} cor={cor}/>
      <Ic size={12} style={{ color:cor,flexShrink:0 }}/>
      <div style={{ display:'flex',flexDirection:'column',gap:0 }}>
        <div style={{ display:'flex',alignItems:'baseline',gap:5 }}>
          <span style={{ fontSize:13.5,fontWeight:800,color:T.ink1,
            letterSpacing:'-.4px',lineHeight:1,
            textShadow:`0 0 12px ${cor}30` }}>
            {value}
          </span>
          {sub&&<span style={{ fontSize:10,color:T.ink4,lineHeight:1 }}>{sub}</span>}
        </div>
        <span style={{ fontSize:9.5,color:T.ink4,textTransform:'uppercase',
          letterSpacing:'.07em',lineHeight:1.3 }}>
          {label}
        </span>
      </div>
      {spark && <Spark data={spark} cor={cor}/>}
    </button>
  )
}

const Sep = () => <div style={{ width:1,height:20,background:T.sep,flexShrink:0 }}/>

// ── Itens configuráveis (estado em memória — sem localStorage) ─────────────────
const DEFAULT_ITEMS = [
  { id:'conversas', label:'Conversas ativas', ativo:true  },
  { id:'fila',      label:'Fila humano',       ativo:true  },
  { id:'msgs',      label:'Msgs/hora',         ativo:true  },
  { id:'carrinho',  label:'Com carrinho',      ativo:true  },
  { id:'pedidos',   label:'Pedidos hoje',      ativo:true  },
  { id:'receita',   label:'Receita hoje',      ativo:true  },
]

// ── Componente principal ───────────────────────────────────────────────────────
export default function LiveActivityBar({ api, onNavigate }) {
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)
  const [blink,    setBlink]    = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [items,    setItems]    = useState(DEFAULT_ITEMS)
  const [showCfg,  setShowCfg]  = useState(false)
  const prevRef = useRef(null)

  const buscar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/dashboard/live-activity`, { signal:AbortSignal.timeout(5000) })
      if (!r.ok) throw new Error()
      const d = await r.json()
      if (prevRef.current && d.msgs_hora > prevRef.current.msgs_hora) {
        setBlink(true); setTimeout(()=>setBlink(false), 2000)
      }
      prevRef.current = d
      setData(d); setError(false)
    } catch { setError(true) }
    setLoading(false)
  }, [api])

  useEffect(() => {
    buscar()
    const iv = setInterval(buscar, 30000)
    return () => clearInterval(iv)
  }, [buscar])

  const sparkMsgs    = useSpark(data?.msgs_hora||0)
  const sparkSessoes = useSpark(data?.sessoes_ativas||0)
  const sparkReceita = useSpark(data?.receita_hoje||0)

  const receitaFmt = data?.receita_hoje > 0
    ? data.receita_hoje >= 1000 ? `R$${(data.receita_hoje/1000).toFixed(1)}k` : `R$${data.receita_hoje.toFixed(0)}`
    : 'R$0'

  const ultimaAtt = data?.timestamp
    ? new Date(data.timestamp).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
    : '—'

  const sessoesAtivas = data?.sessoes_ativas||0
  const msgsHora      = data?.msgs_hora||0
  const carrinho      = data?.com_carrinho||0
  const pedidosHoje   = data?.pedidos_hoje||0
  const taxaIA        = data?.taxa_ia??100
  const iaOk          = data?.ia_ok!==false
  const humano        = data?.sessoes_humano||0

  if (error && !data) return (
    <div style={{ height:36,background:T.bg2,borderBottom:`1px solid ${T.sep}`,
      display:'flex',alignItems:'center',paddingInline:14,gap:8,flexShrink:0 }}>
      <WifiOff size={12} style={{ color:T.ink4 }}/>
      <span style={{ fontSize:11,color:T.ink4 }}>Live Activity offline</span>
    </div>
  )

  if (loading && !data) return (
    <div style={{ height:36,background:T.bg2,borderBottom:`1px solid ${T.sep}`,
      display:'flex',alignItems:'center',paddingInline:14,gap:10,flexShrink:0 }}>
      {[48,64,52,80].map((w,i) => (
        <div key={i} style={{ height:8,width:w,borderRadius:4,
          background:T.sep,animation:`lab-shimmer 1.4s ${i*.12}s ease-in-out infinite` }}/>
      ))}
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes lab-ping    { 0%{transform:scale(1);opacity:.6} 75%,100%{transform:scale(2.4);opacity:0} }
        @keyframes lab-shimmer { 0%,100%{opacity:.3} 50%{opacity:.7} }
        @keyframes lab-fadeUp  { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Barra principal ── */}
      <div style={{
        height:36, flexShrink:0,
        background: blink ? `linear-gradient(90deg,${T.green}08,${T.bg2})` : T.bg2,
        borderBottom:`1px solid ${T.sep}`,
        display:'flex', alignItems:'center', overflowX:'auto', overflowY:'visible',
        transition:'background .4s',
      }}>

        {/* Live indicator */}
        <div style={{ display:'flex',alignItems:'center',gap:6,padding:'0 12px',
          height:'100%',borderRight:`1px solid ${T.sep}`,flexShrink:0 }}>
          <LiveDot active cor={T.green} size={8}/>
          <span style={{ fontSize:10,fontWeight:800,color:T.green,
            textTransform:'uppercase',letterSpacing:'.1em',whiteSpace:'nowrap',
            textShadow:`0 0 10px ${T.green}50` }}>Live</span>
        </div>

        {/* Conversas */}
        <Metric label="Conversas" value={fmtNum(sessoesAtivas)}
          sub={sessoesAtivas>0?`${msgsHora}/h`:undefined}
          cor={T.purple} icon={MessageSquare} spark={sparkSessoes}
          pulse={sessoesAtivas>0} onClick={()=>onNavigate?.('conversas')}/>

        {/* Fila humano — só se > 0 */}
        {humano > 0 && <><Sep/>
          <Metric label="Fila humano" value={fmtNum(humano)}
            cor={T.red} icon={Users} pulse onClick={()=>onNavigate?.('atendimento')}/>
        </>}

        <Sep/>

        {/* Msgs/hora */}
        <Metric label="Msgs/hora" value={fmtNum(msgsHora)}
          sub={data?.msgs_hoje>0?`${fmtNum(data.msgs_hoje)} hoje`:undefined}
          cor={T.blue} icon={Activity} spark={sparkMsgs}
          pulse={msgsHora>0} onClick={()=>onNavigate?.('conversas')}/>

        {/* Carrinhos — só se > 0 */}
        {carrinho > 0 && <><Sep/>
          <Metric label="Carrinho" value={fmtNum(carrinho)}
            cor={T.amber} icon={ShoppingCart}
            pulse onClick={()=>onNavigate?.('conversas')}/>
        </>}

        <Sep/>

        {/* Pedidos */}
        <Metric label="Pedidos hoje" value={fmtNum(pedidosHoje)}
          sub={data?.pedidos_hora>0?`${data.pedidos_hora}/h`:undefined}
          cor={T.green} icon={ShoppingCart} spark={sparkReceita}
          onClick={()=>onNavigate?.('pedidos')}/>

        {data?.receita_hoje > 0 && <><Sep/>
          <Metric label="Receita" value={receitaFmt}
            cor={T.cyan} icon={TrendingUp} onClick={()=>onNavigate?.('caixa')}/>
        </>}

        <Sep/>

        {/* IA status */}
        <button onClick={()=>onNavigate?.('llmconfig')}
          style={{ display:'flex',alignItems:'center',gap:7,padding:'0 12px',
            height:'100%',border:'none',background:'transparent',cursor:'pointer',
            borderRight:`1px solid ${T.sep}`,transition:'background .12s' }}
          onMouseEnter={e=>e.currentTarget.style.background=T.gray}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <LiveDot active={iaOk} cor={iaOk?T.green:T.red}/>
          <Zap size={12} style={{ color:iaOk?T.green:T.red,flexShrink:0 }}/>
          <div style={{ display:'flex',flexDirection:'column' }}>
            <span style={{ fontSize:13.5,fontWeight:800,color:T.ink1,lineHeight:1,
              textShadow:`0 0 10px ${iaOk?T.green:T.red}30` }}>{taxaIA}%</span>
            <span style={{ fontSize:9.5,color:T.ink4,textTransform:'uppercase',letterSpacing:'.07em',lineHeight:1.3 }}>IA saúde</span>
          </div>
        </button>

        {/* Spacer + timestamp + controles */}
        <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',height:'100%',flexShrink:0 }}>
          <div style={{ padding:'0 10px' }}>
            <span style={{ fontSize:10,color:T.ink4,fontFamily:'monospace',whiteSpace:'nowrap' }}>
              {ultimaAtt}
            </span>
          </div>
          <Sep/>
          {/* Configurar */}
          <div style={{ position:'relative' }}>
            <button onClick={()=>setShowCfg(v=>!v)}
              style={{ height:36,padding:'0 10px',border:'none',
                background:showCfg?T.gray:'transparent',cursor:'pointer',
                color:showCfg?T.ink2:T.ink4,display:'flex',alignItems:'center',
                fontSize:9.5,fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase',
                transition:'all .12s' }}>
              cfg
            </button>

            {/* Painel de configuração */}
            {showCfg && (
              <div style={{ position:'absolute',bottom:'calc(100% + 4px)',right:0,
                background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
                border:`1px solid ${T.sep2}`,borderRadius:12,padding:'10px 12px',
                boxShadow:'0 -12px 32px rgba(0,0,0,.5)',
                zIndex:200,minWidth:210,
                animation:'lab-fadeUp .15s ease' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
                  <span style={{ fontSize:12,fontWeight:700,color:T.ink1 }}>Configurar barra</span>
                  <button onClick={()=>setShowCfg(false)}
                    style={{ background:'none',border:'none',cursor:'pointer',color:T.ink4,padding:2,display:'flex' }}>
                    <X size={13}/>
                  </button>
                </div>
                {items.map(item => (
                  <div key={item.id} style={{ display:'flex',alignItems:'center',
                    justifyContent:'space-between',padding:'6px 0',
                    borderBottom:`1px solid ${T.sep}` }}>
                    <span style={{ fontSize:11.5,color:T.ink3 }}>{item.label}</span>
                    <button onClick={()=>setItems(prev=>prev.map(i=>i.id===item.id?{...i,ativo:!i.ativo}:i))}
                      style={{ background:'none',border:'none',cursor:'pointer',
                        display:'flex',alignItems:'center',gap:4,fontSize:10.5,
                        fontWeight:600,padding:2,
                        color:item.ativo?T.green:T.ink4 }}>
                      <Check size={11}/> {item.ativo?'Visível':'Oculto'}
                    </button>
                  </div>
                ))}
                <button onClick={()=>setItems(DEFAULT_ITEMS)}
                  style={{ marginTop:8,width:'100%',padding:'5px',borderRadius:7,
                    border:`1px solid ${T.sep}`,background:T.gray,
                    color:T.ink3,cursor:'pointer',fontSize:11 }}>
                  Restaurar padrão
                </button>
              </div>
            )}
          </div>
          <Sep/>
          {/* Expandir */}
          <button onClick={()=>setExpanded(v=>!v)}
            title={expanded?'Recolher':'Ver mais'}
            style={{ height:36,padding:'0 10px',border:'none',
              background:'transparent',cursor:'pointer',
              color:expanded?T.green:T.ink4,display:'flex',alignItems:'center',gap:3,
              fontSize:10,transition:'color .15s' }}
            onMouseEnter={e=>e.currentTarget.style.color=T.ink1}
            onMouseLeave={e=>e.currentTarget.style.color=expanded?T.green:T.ink4}>
            <ChevronUp size={12} style={{ transform:expanded?'rotate(180deg)':'rotate(0)',transition:'transform .2s' }}/>
          </button>
        </div>
      </div>

      {/* ── Painel expandido ── */}
      {expanded && (
        <div style={{
          background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
          borderBottom:`1px solid ${T.sep}`,
          padding:'12px 16px',
          display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,
          animation:'lab-fadeUp .18s ease',
        }}>
          {[
            { label:'Sessões 30min',    value:fmtNum(sessoesAtivas),  sub:'ativas agora',       cor:T.purple, page:'conversas' },
            { label:'Mensagens hoje',   value:fmtNum(data?.msgs_hoje),sub:`${fmtNum(data?.respostas_hoje||0)} respostas`, cor:T.blue,   page:'conversas' },
            { label:'Carrinhos ativos', value:fmtNum(carrinho),       sub:'no momento',         cor:T.amber,  page:'conversas' },
            { label:'IA / saúde',       value:`${taxaIA}%`,           sub:'últimas 2h',         cor:iaOk?T.green:T.red, page:'llmconfig' },
          ].map(k => (
            <button key={k.label} onClick={()=>{ onNavigate?.(k.page); setExpanded(false) }}
              style={{ padding:'11px 13px',borderRadius:12,textAlign:'left',cursor:'pointer',
                background:T.gray,border:`1px solid ${T.sep}`,
                transition:'all .15s' }}
              onMouseEnter={e=>{ e.currentTarget.style.border=`1px solid ${k.cor}45`; e.currentTarget.style.background=`${k.cor}09` }}
              onMouseLeave={e=>{ e.currentTarget.style.border=`1px solid ${T.sep}`; e.currentTarget.style.background=T.gray }}>
              <div style={{ fontSize:22,fontWeight:800,color:k.cor,letterSpacing:'-.4px',
                lineHeight:1,marginBottom:4,textShadow:`0 0 16px ${k.cor}40` }}>
                {k.value}
              </div>
              <div style={{ fontSize:11.5,fontWeight:700,color:T.ink2,marginBottom:2 }}>{k.label}</div>
              <div style={{ fontSize:10,color:T.ink4 }}>{k.sub}</div>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
