/**
 * LiveActivityBar — NIVELMAX v3
 *
 * Novidades vs versão anterior:
 *  1. Trend arrows (↑↓) — compara valor atual com poll anterior
 *  2. Thresholds de alerta — configurable por métrica, cor muda automaticamente
 *  3. Hover popover — mini card com sparkline + contexto ao passar o mouse
 *  4. Expanded panel com AreaChart recharts real (não só 4 números)
 *  5. Drag-to-reorder — arrastar métricas para trocar a ordem
 *  6. Polling adaptativo — 10s quando há msgs, 45s quando quieto
 *  7. Estado expanded persistido em sessionStorage
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare, ShoppingCart, Zap, Users, Activity,
  WifiOff, ChevronUp, TrendingUp, TrendingDown,
  X, Check, GripVertical, Settings2, Minus,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

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
const fmtR   = n => n >= 1000 ? `R$${(n/1000).toFixed(1)}k` : `R$${Number(n||0).toFixed(0)}`

// ── Histórico em memória ───────────────────────────────────────────────────────
function useSpark(value, size=24) {
  const hist = useRef(Array(size).fill(0))
  useEffect(() => { hist.current = [...hist.current.slice(1), value] }, [value])
  return hist.current
}

// ── Sparkline SVG mini ────────────────────────────────────────────────────────
function Spark({ data=[], cor=T.green, w=52, h=20 }) {
  if (!data || data.every(v=>v===0)) return null
  const max  = Math.max(...data, 1)
  const pts  = data.map((v,i)=>{
    const x = (i/(data.length-1))*w
    const y = h-2-(v/max)*(h-6)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const gid = `sg${cor.replace(/[^a-z0-9]/gi,'').slice(0,6)}`
  return (
    <svg width={w} height={h} style={{ overflow:'visible',flexShrink:0 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={cor} stopOpacity=".35"/>
          <stop offset="100%" stopColor={cor} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`${pts} ${w},${h} 0,${h}`} fill={`url(#${gid})`}/>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ filter:`drop-shadow(0 0 3px ${cor}70)` }}/>
    </svg>
  )
}

// ── Dot vivo ──────────────────────────────────────────────────────────────────
function LiveDot({ active=true, cor=T.green, size=7 }) {
  return (
    <span style={{ position:'relative',display:'inline-flex',width:size,height:size,flexShrink:0 }}>
      {active && (
        <span style={{ position:'absolute',inset:0,borderRadius:'50%',
          background:cor,opacity:.4,animation:'lab-ping 1.8s ease-out infinite' }}/>
      )}
      <span style={{ width:size,height:size,borderRadius:'50%',
        background:active?cor:T.ink4,display:'block',
        boxShadow:active?`0 0 6px ${cor}`:undefined }}/>
    </span>
  )
}

// ── Trend arrow ───────────────────────────────────────────────────────────────
function Trend({ spark }) {
  if (!spark || spark.length < 4) return null
  const prev  = spark[spark.length-4] || 0
  const curr  = spark[spark.length-1] || 0
  if (prev === 0 && curr === 0) return null
  if (curr > prev)  return <TrendingUp  size={9} style={{ color:T.green,flexShrink:0 }}/>
  if (curr < prev)  return <TrendingDown size={9} style={{ color:T.red,  flexShrink:0 }}/>
  return                           <Minus size={9} style={{ color:T.ink4, flexShrink:0 }}/>
}

// ── Separador ────────────────────────────────────────────────────────────────
const Sep = () => <div style={{ width:1,height:20,background:T.sep,flexShrink:0 }}/>

// ─────────────────────────────────────────────────────────────────────────────
// MÉTRICA com popover ao hover e threshold de alerta
// ─────────────────────────────────────────────────────────────────────────────
function Metric({
  id, label, value, numValue, sub, cor: corBase,
  icon:Ic, spark=[], pulse=false, onClick,
  threshold, dragging, dragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
}) {
  const [hov, setHov]       = useState(false)
  const [popPos, setPopPos] = useState(null)
  const btnRef = useRef()

  // Threshold: se valor excede, cor vira vermelha (ou âmbar)
  const over = threshold && numValue >= threshold.max
  const cor  = over ? T.red : corBase

  const onEnter = () => {
    setHov(true)
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPopPos({ left: r.left, bottom: window.innerHeight - r.top + 6 })
    }
  }
  const onLeave = () => { setHov(false); setPopPos(null) }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{ display:'flex',alignItems:'center',position:'relative',
        opacity: dragging ? .4 : 1,
        outline: dragOver ? `1px dashed ${cor}60` : 'none',
        borderRadius:4, transition:'opacity .15s' }}>

      {/* Drag handle */}
      <div style={{ padding:'0 4px',cursor:'grab',color:T.ink4,
        display:'flex',alignItems:'center',opacity:hov?.6:0,
        transition:'opacity .15s' }}>
        <GripVertical size={10}/>
      </div>

      <button ref={btnRef} onClick={onClick}
        onMouseEnter={onEnter} onMouseLeave={onLeave}
        style={{ display:'flex',alignItems:'center',gap:7,
          padding:'0 10px 0 2px',height:'100%',
          border:'none',
          background: over ? T.redDim : hov && onClick ? T.gray : 'transparent',
          cursor:onClick?'pointer':'default',
          transition:'background .12s',
          position:'relative' }}>

        {/* Alert border bottom quando threshold excedido */}
        {over && (
          <div style={{ position:'absolute',bottom:0,left:0,right:0,height:2,
            background:T.red,boxShadow:`0 0 8px ${T.red}` }}/>
        )}

        <LiveDot active={pulse} cor={cor}/>
        <Ic size={12} style={{ color:cor,flexShrink:0 }}/>

        <div style={{ display:'flex',flexDirection:'column',gap:0 }}>
          <div style={{ display:'flex',alignItems:'baseline',gap:4 }}>
            <span style={{ fontSize:13.5,fontWeight:800,color:over?T.red:T.ink1,
              letterSpacing:'-.4px',lineHeight:1,
              textShadow:`0 0 12px ${cor}30` }}>
              {value}
            </span>
            <Trend spark={spark}/>
            {sub && <span style={{ fontSize:10,color:T.ink4,lineHeight:1 }}>{sub}</span>}
          </div>
          <span style={{ fontSize:9.5,color:over?T.red:T.ink4,
            textTransform:'uppercase',letterSpacing:'.07em',lineHeight:1.3 }}>
            {label}{over && ' ⚠'}
          </span>
        </div>

        {spark.some(v=>v>0) && <Spark data={spark} cor={cor} w={44} h={18}/>}
      </button>

      {/* Popover ao hover */}
      {hov && popPos && spark.some(v=>v>0) && (
        <div style={{
          position:'fixed',
          left:popPos.left,
          bottom:popPos.bottom,
          zIndex:9900,
          width:200,
          background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${cor}35`,
          borderRadius:13,
          padding:'12px 14px',
          boxShadow:`0 -12px 36px rgba(0,0,0,.6), 0 0 0 1px ${cor}12 inset`,
          pointerEvents:'none',
          animation:'lab-popIn .15s cubic-bezier(.2,.8,.2,1)',
        }}>
          <div style={{ display:'flex',justifyContent:'space-between',
            alignItems:'baseline',marginBottom:8 }}>
            <span style={{ fontSize:11,fontWeight:700,color:T.ink3,
              textTransform:'uppercase',letterSpacing:'.07em' }}>{label}</span>
            <span style={{ fontSize:20,fontWeight:800,color:cor,
              letterSpacing:'-.03em',textShadow:`0 0 16px ${cor}50` }}>{value}</span>
          </div>
          <Spark data={spark} cor={cor} w={172} h={36}/>
          <div style={{ marginTop:8,display:'flex',justifyContent:'space-between' }}>
            <span style={{ fontSize:9.5,color:T.ink4 }}>mín: {Math.min(...spark.filter(v=>v>0))}</span>
            <span style={{ fontSize:9.5,color:T.ink4 }}>máx: {Math.max(...spark)}</span>
          </div>
          {threshold && (
            <div style={{ marginTop:6,padding:'4px 8px',borderRadius:6,
              background:over?T.redDim:T.amberDim,
              fontSize:9.5,color:over?T.red:T.amber,fontWeight:600 }}>
              Threshold: {threshold.max} · {over?'⚠ Excedido':'OK'}
            </div>
          )}
          {/* Seta para baixo */}
          <div style={{ position:'absolute',bottom:-5,left:20,
            width:8,height:8,background:T.bg3,
            border:`1px solid ${cor}35`,borderLeft:'none',borderTop:'none',
            rotate:'45deg' }}/>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const THRESHOLDS = {
  fila:      { max:5,  label:'Fila crítica se > 5'   },
  conversas: { max:30, label:'Alto volume se > 30'    },
  msgs:      { max:50, label:'Alta atividade se > 50' },
}

const DEFAULT_ORDER = ['conversas','fila','msgs','carrinho','pedidos','receita','ia']

export default function LiveActivityBar({ api, onNavigate }) {
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)
  const [blink,    setBlink]    = useState(false)
  const [expanded, setExpanded] = useState(() => {
    try { return sessionStorage.getItem('lab_expanded') === '1' } catch { return false }
  })
  const [showCfg,  setShowCfg]  = useState(false)
  const [order,    setOrder]    = useState(DEFAULT_ORDER) // ordem das métricas
  const [hidden,   setHidden]   = useState(new Set())     // métricas ocultas
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const prevRef    = useRef(null)
  const intervalRef  = useRef(null)
  const delayRef     = useRef(30000)   // rastreia o intervalo atual separadamente

  // ── Busca com polling adaptativo ──────────────────────────────────────────
  const buscar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/dashboard/live-activity`,
        { signal:AbortSignal.timeout(5000) })
      if (!r.ok) throw new Error()
      const d = await r.json()
      if (prevRef.current && d.msgs_hora > prevRef.current.msgs_hora) {
        setBlink(true); setTimeout(()=>setBlink(false), 2000)
      }
      prevRef.current = d
      setData(d); setError(false)

      // Adapta o intervalo de polling (delayRef evita atribuir em número primitivo)
      const ativo = (d.msgs_hora||0) > 0 || (d.sessoes_ativas||0) > 0
      const novoDelay = ativo ? 10000 : 45000
      if (delayRef.current !== novoDelay) {
        delayRef.current = novoDelay
        clearInterval(intervalRef.current)
        intervalRef.current = setInterval(buscar, novoDelay)
      }
    } catch { setError(true) }
    setLoading(false)
  }, [api])

  useEffect(() => {
    buscar()
    delayRef.current = 30000
    intervalRef.current = setInterval(buscar, 30000)
    return () => clearInterval(intervalRef.current)
  }, [buscar])

  // Persiste estado expandido
  useEffect(() => {
    try { sessionStorage.setItem('lab_expanded', expanded ? '1' : '0') } catch {}
  }, [expanded])

  // Sparks
  const sparkSessoes = useSpark(data?.sessoes_ativas||0)
  const sparkMsgs    = useSpark(data?.msgs_hora||0)
  const sparkReceita = useSpark(data?.receita_hoje||0)
  const sparkPedidos = useSpark(data?.pedidos_hoje||0)
  const sparkHumano  = useSpark(data?.sessoes_humano||0)
  const sparkCarr    = useSpark(data?.com_carrinho||0)

  const sessoesAtivas = data?.sessoes_ativas||0
  const msgsHora      = data?.msgs_hora||0
  const carrinho      = data?.com_carrinho||0
  const pedidosHoje   = data?.pedidos_hoje||0
  const taxaIA        = data?.taxa_ia??100
  const iaOk          = data?.ia_ok !== false
  const humano        = data?.sessoes_humano||0

  const ultimaAtt = data?.timestamp
    ? new Date(data.timestamp).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
    : '—'
  const isAtivo = msgsHora > 0 || sessoesAtivas > 0

  // ── Configuração de métricas ──────────────────────────────────────────────
  const METRICS_DEF = {
    conversas: {
      id:'conversas', label:'Conversas', cor:T.purple,
      icon:MessageSquare, page:'conversas', pulse:sessoesAtivas>0,
      value:fmtNum(sessoesAtivas), numValue:sessoesAtivas,
      sub:sessoesAtivas>0?`${msgsHora}/h`:undefined,
      spark:sparkSessoes, threshold:THRESHOLDS.conversas,
    },
    fila: {
      id:'fila', label:'Fila humano', cor:T.red,
      icon:Users, page:'atendimento', pulse:humano>0,
      value:fmtNum(humano), numValue:humano,
      spark:sparkHumano, threshold:THRESHOLDS.fila,
      hideWhenZero:true,
    },
    msgs: {
      id:'msgs', label:'Msgs/hora', cor:T.blue,
      icon:Activity, page:'conversas', pulse:msgsHora>0,
      value:fmtNum(msgsHora), numValue:msgsHora,
      sub:data?.msgs_hoje>0?`${fmtNum(data.msgs_hoje)} hoje`:undefined,
      spark:sparkMsgs, threshold:THRESHOLDS.msgs,
    },
    carrinho: {
      id:'carrinho', label:'Carrinho', cor:T.amber,
      icon:ShoppingCart, page:'conversas', pulse:carrinho>0,
      value:fmtNum(carrinho), numValue:carrinho,
      spark:sparkCarr, hideWhenZero:true,
    },
    pedidos: {
      id:'pedidos', label:'Pedidos hoje', cor:T.green,
      icon:ShoppingCart, page:'pedidos',
      value:fmtNum(pedidosHoje), numValue:pedidosHoje,
      sub:data?.pedidos_hora>0?`${data.pedidos_hora}/h`:undefined,
      spark:sparkPedidos,
    },
    receita: {
      id:'receita', label:'Receita', cor:T.cyan,
      icon:TrendingUp, page:'caixa',
      value:fmtR(data?.receita_hoje||0), numValue:data?.receita_hoje||0,
      spark:sparkReceita,
    },
    ia: {
      id:'ia', label:'IA saúde', cor:iaOk?T.green:T.red,
      icon:Zap, page:'llmconfig', pulse:true,
      value:`${taxaIA}%`, numValue:taxaIA,
    },
  }

  // ── Drag and drop ─────────────────────────────────────────────────────────
  const handleDragStart = (id) => (e) => {
    e.dataTransfer.setData('text', id)
    setDraggingId(id)
  }
  const handleDragOver = (id) => (e) => {
    e.preventDefault(); setDragOverId(id)
  }
  const handleDrop = (targetId) => (e) => {
    e.preventDefault()
    const srcId = e.dataTransfer.getData('text')
    if (srcId === targetId) { setDraggingId(null); setDragOverId(null); return }
    setOrder(prev => {
      const next = [...prev]
      const si   = next.indexOf(srcId)
      const ti   = next.indexOf(targetId)
      next.splice(si, 1)
      next.splice(ti, 0, srcId)
      return next
    })
    setDraggingId(null); setDragOverId(null)
  }
  const handleDragEnd = () => { setDraggingId(null); setDragOverId(null) }

  // Métricas ordenadas e filtradas
  const metricsOrdenadas = order
    .filter(id => !hidden.has(id))
    .map(id => METRICS_DEF[id])
    .filter(Boolean)
    .filter(m => !(m.hideWhenZero && m.numValue === 0))

  // ── Dados para o gráfico expandido ────────────────────────────────────────
  const expandedData = sparkSessoes.map((v,i) => ({
    i: `${i}`,
    sessoes:  sparkSessoes[i]  || 0,
    msgs:     Math.round((sparkMsgs[i]    || 0) / 3),  // escala para caber junto
    pedidos:  sparkPedidos[i]  || 0,
  }))

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (error && !data) return (
    <div style={{ height:36,background:T.bg2,borderBottom:`1px solid ${T.sep}`,
      display:'flex',alignItems:'center',paddingInline:14,gap:8,flexShrink:0 }}>
      <WifiOff size={12} style={{ color:T.red }}/>
      <span style={{ fontSize:11,color:T.ink4 }}>Live Activity offline</span>
    </div>
  )

  if (loading && !data) return (
    <div style={{ height:36,background:T.bg2,borderBottom:`1px solid ${T.sep}`,
      display:'flex',alignItems:'center',paddingInline:14,gap:10,flexShrink:0 }}>
      {[48,64,52,80,56].map((w,i) => (
        <div key={i} style={{ height:8,width:w,borderRadius:4,
          background:T.sep,animation:`lab-shimmer 1.4s ${i*.1}s ease-in-out infinite` }}/>
      ))}
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes lab-ping   { 0%{transform:scale(1);opacity:.6} 75%,100%{transform:scale(2.4);opacity:0} }
        @keyframes lab-shimmer{ 0%,100%{opacity:.3} 50%{opacity:.7} }
        @keyframes lab-fadeUp { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lab-popIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lab-blink  { 0%,49%{background:rgba(0,230,118,.06)} 50%,100%{background:rgba(10,9,15,1)} }
      `}</style>

      {/* ── BARRA PRINCIPAL ─────────────────────────────────────────────── */}
      <div style={{
        height:40, flexShrink:0, display:'flex', alignItems:'center',
        overflowX:'auto', overflowY:'visible',
        background: blink ? `linear-gradient(90deg,${T.green}07,${T.bg2})` : T.bg2,
        borderBottom:`1px solid ${T.sep}`,
        transition:'background .5s',
      }}>

        {/* Indicador Live */}
        <div style={{ display:'flex',alignItems:'center',gap:6,
          padding:'0 12px',height:'100%',
          borderRight:`1px solid ${T.sep}`,flexShrink:0 }}>
          <LiveDot active={isAtivo} cor={isAtivo?T.green:T.ink4} size={8}/>
          <span style={{ fontSize:9.5,fontWeight:800,
            color:isAtivo?T.green:T.ink4,
            textTransform:'uppercase',letterSpacing:'.12em',
            textShadow:isAtivo?`0 0 10px ${T.green}50`:undefined,
            whiteSpace:'nowrap' }}>
            {isAtivo ? 'Live' : 'Idle'}
          </span>
        </div>

        {/* Métricas reordenáveis */}
        {metricsOrdenadas.map((m, i) => (
          <div key={m.id} style={{ display:'flex',alignItems:'center',height:'100%' }}>
            {i > 0 && <Sep/>}
            <Metric
              {...m}
              onClick={()=>onNavigate?.(m.page)}
              dragging={draggingId===m.id}
              dragOver={dragOverId===m.id}
              onDragStart={handleDragStart(m.id)}
              onDragOver={handleDragOver(m.id)}
              onDrop={handleDrop(m.id)}
              onDragEnd={handleDragEnd}
            />
          </div>
        ))}

        {/* Spacer + controles */}
        <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',
          height:'100%',flexShrink:0 }}>
          <Sep/>
          {/* Timestamp + intervalo */}
          <div style={{ padding:'0 10px',display:'flex',flexDirection:'column',
            alignItems:'center',gap:0 }}>
            <span style={{ fontSize:10,color:T.ink4,fontFamily:'monospace',whiteSpace:'nowrap' }}>
              {ultimaAtt}
            </span>
            <span style={{ fontSize:8.5,color:T.ink4,textTransform:'uppercase',letterSpacing:'.04em' }}>
              {isAtivo ? '10s' : '45s'}
            </span>
          </div>
          <Sep/>

          {/* Configurar */}
          <div style={{ position:'relative' }}>
            <button onClick={()=>setShowCfg(v=>!v)}
              style={{ height:40,padding:'0 11px',border:'none',
                background:showCfg?T.purpleDim:'transparent',cursor:'pointer',
                color:showCfg?T.purple:T.ink4,display:'flex',alignItems:'center',gap:5,
                transition:'all .12s' }}
              title="Configurar métricas">
              <Settings2 size={13}/>
            </button>

            {showCfg && (
              <div style={{ position:'absolute',bottom:'calc(100% + 6px)',right:0,
                zIndex:9999,width:240,
                background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
                border:`1px solid ${T.sep2}`,borderRadius:14,
                boxShadow:'0 -16px 40px rgba(0,0,0,.6)',
                animation:'lab-fadeUp .15s ease',overflow:'hidden' }}>
                <div style={{ display:'flex',justifyContent:'space-between',
                  alignItems:'center',padding:'12px 14px',
                  borderBottom:`1px solid ${T.sep}` }}>
                  <span style={{ fontSize:12.5,fontWeight:700,color:T.ink1 }}>
                    Configurar barra
                  </span>
                  <button onClick={()=>setShowCfg(false)}
                    style={{ background:'none',border:'none',cursor:'pointer',
                      color:T.ink4,display:'flex',padding:2 }}>
                    <X size={13}/>
                  </button>
                </div>
                <div style={{ padding:'8px 0' }}>
                  {order.map(id => {
                    const m = METRICS_DEF[id]
                    if (!m) return null
                    const vis = !hidden.has(id)
                    return (
                      <div key={id} style={{ display:'flex',alignItems:'center',
                        gap:9,padding:'7px 14px',
                        borderBottom:`1px solid ${T.sep}` }}>
                        <div style={{ width:22,height:22,borderRadius:7,flexShrink:0,
                          background:`${m.cor}18`,border:`1px solid ${m.cor}28`,
                          display:'flex',alignItems:'center',justifyContent:'center' }}>
                          <m.icon size={11} style={{ color:m.cor }}/>
                        </div>
                        <span style={{ flex:1,fontSize:11.5,color:vis?T.ink2:T.ink4 }}>
                          {m.label}
                        </span>
                        {THRESHOLDS[id] && (
                          <span style={{ fontSize:9,color:T.ink4,padding:'1px 6px',
                            borderRadius:99,background:T.gray,border:`1px solid ${T.sep}` }}>
                            {'>'}{THRESHOLDS[id].max}
                          </span>
                        )}
                        <button onClick={()=>setHidden(prev=>{
                          const next = new Set(prev)
                          next.has(id) ? next.delete(id) : next.add(id)
                          return next
                        })} style={{ background:'none',border:'none',cursor:'pointer',
                          display:'flex',alignItems:'center',gap:3,
                          color:vis?T.green:T.ink4,fontSize:10,fontWeight:600 }}>
                          <Check size={11}/>
                        </button>
                      </div>
                    )
                  })}
                </div>
                <div style={{ padding:'10px 14px',borderTop:`1px solid ${T.sep}`,
                  display:'flex',gap:8 }}>
                  <button onClick={()=>{ setOrder(DEFAULT_ORDER); setHidden(new Set()) }}
                    style={{ flex:1,padding:'5px',borderRadius:8,
                      border:`1px solid ${T.sep}`,background:T.gray,
                      color:T.ink3,cursor:'pointer',fontSize:11 }}>
                    Restaurar padrão
                  </button>
                </div>
                <div style={{ padding:'6px 14px 10px',
                  display:'flex',alignItems:'center',gap:5 }}>
                  <GripVertical size={10} style={{ color:T.ink4 }}/>
                  <span style={{ fontSize:10,color:T.ink4 }}>
                    Arraste as métricas para reordenar
                  </span>
                </div>
              </div>
            )}
          </div>
          <Sep/>

          {/* Expandir */}
          <button onClick={()=>setExpanded(v=>!v)}
            style={{ height:40,padding:'0 11px',border:'none',
              background:'transparent',cursor:'pointer',
              color:expanded?T.green:T.ink4,display:'flex',alignItems:'center',gap:3,
              transition:'color .15s' }}
            onMouseEnter={e=>e.currentTarget.style.color=T.ink1}
            onMouseLeave={e=>e.currentTarget.style.color=expanded?T.green:T.ink4}>
            <ChevronUp size={13} style={{ transform:expanded?'rotate(180deg)':'rotate(0)',
              transition:'transform .2s' }}/>
          </button>
        </div>
      </div>

      {/* ── PAINEL EXPANDIDO com recharts ────────────────────────────────── */}
      {expanded && (
        <div style={{
          background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
          borderBottom:`1px solid ${T.sep}`,
          padding:'14px 20px',
          animation:'lab-fadeUp .18s ease',
          display:'grid', gridTemplateColumns:'1fr 340px', gap:16,
        }}>
          {/* Gráfico de área */}
          <div>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
              <Activity size={12} style={{ color:T.blue }}/>
              <span style={{ fontSize:11.5,fontWeight:700,color:T.ink2 }}>
                Atividade — últimas {sparkSessoes.length} leituras
              </span>
              <div style={{ marginLeft:'auto',display:'flex',gap:12 }}>
                {[
                  {cor:T.purple, lbl:'Sessões'},
                  {cor:T.blue,   lbl:'Msgs÷3'},
                  {cor:T.green,  lbl:'Pedidos'},
                ].map(s=>(
                  <div key={s.lbl} style={{ display:'flex',alignItems:'center',gap:4 }}>
                    <div style={{ width:16,height:2,borderRadius:99,background:s.cor,
                      boxShadow:`0 0 5px ${s.cor}` }}/>
                    <span style={{ fontSize:9.5,color:T.ink4 }}>{s.lbl}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart data={expandedData} margin={{top:4,right:4,left:-28,bottom:0}}>
                <defs>
                  {[
                    {id:'ep',cor:T.purple,key:'sessoes'},
                    {id:'eb',cor:T.blue,  key:'msgs'},
                    {id:'eg',cor:T.green, key:'pedidos'},
                  ].map(g=>(
                    <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={g.cor} stopOpacity={0.3}/>
                      <stop offset="100%" stopColor={g.cor} stopOpacity={0.01}/>
                    </linearGradient>
                  ))}
                  <filter id="ef-glow">
                    <feGaussianBlur stdDeviation="2" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="2 6"
                  stroke="rgba(255,255,255,.04)" vertical={false}/>
                <XAxis dataKey="i" hide/>
                <YAxis tick={{fontSize:8,fill:T.ink4}} axisLine={false}
                  tickLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{ background:T.bg3,border:`1px solid ${T.sep2}`,
                  borderRadius:9,fontSize:10.5,boxShadow:'0 8px 24px rgba(0,0,0,.5)' }}
                  labelStyle={{ display:'none' }} itemStyle={{ color:T.ink2 }}
                  formatter={(v,n)=>[v,n==='sessoes'?'Sessões':n==='msgs'?'Msgs÷3':'Pedidos']}/>
                <Area dataKey="pedidos" type="monotone"
                  stroke={T.green} strokeWidth={1.5}
                  fill="url(#eg)" fillOpacity={1} dot={false}/>
                <Area dataKey="msgs" type="monotone"
                  stroke={T.blue} strokeWidth={1.5}
                  fill="url(#eb)" fillOpacity={1} dot={false}/>
                <Area dataKey="sessoes" type="monotone"
                  stroke={T.purple} strokeWidth={2}
                  fill="url(#ep)" fillOpacity={1} dot={false}
                  filter="url(#ef-glow)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Cards laterais */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
            {[
              { label:'Receita hoje',   value:fmtR(data?.receita_hoje||0), sub:`${fmtNum(pedidosHoje)} pedidos`, cor:T.cyan,   page:'caixa'     },
              { label:'Msgs hoje',      value:fmtNum(data?.msgs_hoje),      sub:`${fmtNum(data?.respostas_hoje||0)} respostas`, cor:T.blue, page:'conversas' },
              { label:'IA / taxa',      value:`${taxaIA}%`,                 sub:'últimas 2h',              cor:iaOk?T.green:T.red, page:'llmconfig' },
              { label:'Em carrinho',    value:fmtNum(carrinho),             sub:'agora',                   cor:T.amber, page:'conversas' },
            ].map(k=>(
              <button key={k.label}
                onClick={()=>{ onNavigate?.(k.page); setExpanded(false) }}
                style={{ padding:'10px 12px',borderRadius:11,textAlign:'left',
                  cursor:'pointer',background:T.gray,border:`1px solid ${T.sep}`,
                  transition:'all .15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.border=`1px solid ${k.cor}45`; e.currentTarget.style.background=`${k.cor}09` }}
                onMouseLeave={e=>{ e.currentTarget.style.border=`1px solid ${T.sep}`; e.currentTarget.style.background=T.gray }}>
                <div style={{ fontSize:20,fontWeight:800,color:k.cor,
                  letterSpacing:'-.4px',lineHeight:1,marginBottom:4,
                  textShadow:`0 0 16px ${k.cor}40` }}>{k.value}</div>
                <div style={{ fontSize:11,fontWeight:600,color:T.ink3,marginBottom:2 }}>{k.label}</div>
                <div style={{ fontSize:10,color:T.ink4 }}>{k.sub}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
