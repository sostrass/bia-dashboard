import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare, ShoppingCart, Zap, Users, Activity,
  Wifi, WifiOff, ChevronUp, Circle, TrendingUp, Settings, X, Check, Eye, EyeOff
} from 'lucide-react'

const R = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmtNum = n => Number(n||0).toLocaleString('pt-BR')

// Sparkline mini de 20 pontos (histórico em memória)
function useSpark(value, size=20) {
  const hist = useRef(Array(size).fill(0))
  useEffect(() => {
    hist.current = [...hist.current.slice(1), value]
  }, [value])
  return hist.current
}

function Spark({ data, cor='#00d4aa', width=48, height=18 }) {
  if (!data || data.every(v => v === 0)) return null
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (v / max) * (height - 2) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={width} height={height} style={{ overflow:'visible', flexShrink:0 }}>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".8"/>
    </svg>
  )
}

// Indicador com pulse quando valor > 0
function LiveDot({ active, cor='#00d4aa' }) {
  return (
    <span style={{ position:'relative', display:'inline-flex', width:8, height:8, flexShrink:0 }}>
      {active && <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:cor, opacity:.5, animation:'ping 1.5s ease-out infinite' }}/>}
      <span style={{ width:8, height:8, borderRadius:'50%', background:active?cor:'var(--label-4)', display:'block' }}/>
    </span>
  )
}

// Métrica individual na barra
function Metric({ label, value, sub, cor, icon:Ic, spark, pulse=false, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:7, padding:'0 12px',
        borderRight:'1px solid var(--sep)', border:'none', background:'transparent',
        cursor:onClick?'pointer':'default', height:'100%', transition:'background .12s',
        ...(hov && onClick ? { background:'var(--fill)' } : {}),
      }}
    >
      <LiveDot active={pulse} cor={cor}/>
      <Ic size={12} style={{ color:cor, flexShrink:0 }}/>
      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:5 }}>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--label)', letterSpacing:'-.3px', lineHeight:1 }}>
            {value}
          </span>
          {sub && <span style={{ fontSize:10, color:'var(--label-4)', lineHeight:1 }}>{sub}</span>}
        </div>
        <span style={{ fontSize:9.5, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.06em', lineHeight:1.2 }}>
          {label}
        </span>
      </div>
      {spark && <Spark data={spark} cor={cor}/>}
    </button>
  )
}

// Separador
function Sep() {
  return <div style={{ width:1, height:20, background:'var(--sep)', flexShrink:0 }}/>
}

// ── Componente principal ───────────────────────────────────────────────────────
// Items configuráveis da barra
const DEFAULT_ITEMS = [
  {id:'conversas',  label:'Conversas ativas',  ativo:true},
  {id:'fila',       label:'Fila humano',        ativo:true},
  {id:'msgs',       label:'Msgs/hora',          ativo:true},
  {id:'carrinho',   label:'Com carrinho',       ativo:true},
  {id:'pedidos',    label:'Pedidos hoje',       ativo:true},
  {id:'receita',    label:'Receita hoje',       ativo:true},
]
function loadItems() {
  try { return JSON.parse(localStorage.getItem('lab_items') || 'null') || DEFAULT_ITEMS } catch { return DEFAULT_ITEMS }
}

export default function LiveActivityBar({ api, onNavigate }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)
  const [blink,   setBlink]   = useState(false)
  const [showCfg, setShowCfg] = useState(false)
  const [items,   setItems]   = useState(loadItems)
  const [expanded,setExpanded]= useState(false)
  const [lastMsg, setLastMsg] = useState(0)
  const prevRef = useRef(null)
  const timerRef = useRef()

  const buscar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/dashboard/live-activity`, { signal: AbortSignal.timeout(5000) })
      if (!r.ok) throw new Error()
      const d = await r.json()

      // Detecta nova mensagem → pulsa
      if (prevRef.current && d.msgs_hora > prevRef.current.msgs_hora) {
        setBlink(true)
        setTimeout(() => setBlink(false), 2000)
      }
      prevRef.current = d
      setData(d)
      setError(false)
    } catch {
      setError(true)
    }
    setLoading(false)
  }, [api])

  useEffect(() => {
    buscar()
    timerRef.current = setInterval(buscar, 30000)
    return () => clearInterval(timerRef.current)
  }, [buscar])

  // Sparks em memória
  const sparkMsgs     = useSpark(data?.msgs_hora || 0)
  const sparkSessoes  = useSpark(data?.sessoes_ativas || 0)
  const sparkReceita  = useSpark(data?.receita_hoje || 0)

  // Formata receita
  const receitaFmt = data?.receita_hoje > 0
    ? data.receita_hoje >= 1000
      ? `R$ ${(data.receita_hoje/1000).toFixed(1)}k`
      : `R$ ${data.receita_hoje.toFixed(0)}`
    : 'R$ 0'

  // Última atualização
  const ultimaAtt = data?.timestamp
    ? new Date(data.timestamp).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
    : '—'

  if (error && !data) return (
    <div style={{ height:34, background:'var(--bg-2)', borderTop:'1px solid var(--sep)', display:'flex', alignItems:'center', paddingInline:14, gap:8 }}>
      <WifiOff size={12} style={{ color:'var(--label-4)' }}/>
      <span style={{ fontSize:11, color:'var(--label-4)' }}>Live Activity offline</span>
    </div>
  )

  if (loading && !data) return (
    <div style={{ height:34, background:'var(--bg-2)', borderTop:'1px solid var(--sep)', display:'flex', alignItems:'center', paddingInline:14 }}>
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        {[...Array(4)].map((_,i) => (
          <div key={i} style={{ height:8, width:60+i*20, borderRadius:4, background:'var(--sep)', animation:`shimmer 1.4s ${i*.1}s ease-in-out infinite` }}/>
        ))}
      </div>
    </div>
  )

  const sessoesAtivas = data?.sessoes_ativas || 0
  const msgsHora      = data?.msgs_hora || 0
  const carrinho      = data?.com_carrinho || 0
  const pedidosHoje   = data?.pedidos_hoje || 0
  const taxaIA        = data?.taxa_ia ?? 100
  const iaOk          = data?.ia_ok !== false
  const humano        = data?.sessoes_humano || 0

  return (
    <>
      <style>{`
        @keyframes ping { 0% { transform:scale(1);opacity:.6 } 75%,100% { transform:scale(2.2);opacity:0 } }
        @keyframes shimmer { 0%,100% { opacity:.4 } 50% { opacity:.8 } }
        @keyframes fadeIn { from { opacity:0;transform:translateY(4px) } to { opacity:1;transform:translateY(0) } }
      `}</style>

      {/* Barra principal */}
      <div style={{
        height:36, background:'var(--bg-2)', borderTop:'1px solid var(--sep)',
        display:'flex', alignItems:'center', flexShrink:0, overflowX:'auto', overflowY:'visible',
        position:'relative', transition:'background .2s',
        ...(blink ? { background:'rgba(0,212,170,.04)' } : {}),
      }}>

        {/* Indicador live */}
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0 12px', height:'100%', borderRight:'1px solid var(--sep)', flexShrink:0 }}>
          <div style={{ position:'relative', width:8, height:8 }}>
            <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#00d4aa', opacity:.4, animation:'ping 2s ease-out infinite' }}/>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#00d4aa', display:'block' }}/>
          </div>
          <span style={{ fontSize:10, fontWeight:700, color:'#00d4aa', textTransform:'uppercase', letterSpacing:'.08em', whiteSpace:'nowrap' }}>Live</span>
        </div>

        {/* Conversas ativas */}
        <Metric
          label="Conversas ativas"
          value={fmtNum(sessoesAtivas)}
          sub={sessoesAtivas > 0 ? `${msgsHora}/h` : undefined}
          cor="#7c6af7"
          icon={MessageSquare}
          spark={sparkSessoes}
          pulse={sessoesAtivas > 0}
          onClick={() => onNavigate?.('conversas')}
        />

        {/* Fila humano — só mostra se > 0 */}
        {humano > 0 && <>
          <Sep/>
          <Metric
            label="Fila humano"
            value={fmtNum(humano)}
            cor="#ef4444"
            icon={Users}
            pulse={true}
            onClick={() => onNavigate?.('atendimento')}
          />
        </>}

        <Sep/>

        {/* Mensagens na última hora */}
        <Metric
          label="Msgs/hora"
          value={fmtNum(msgsHora)}
          sub={data?.msgs_hoje > 0 ? `${fmtNum(data.msgs_hoje)} hoje` : undefined}
          cor="#4a9fff"
          icon={Activity}
          spark={sparkMsgs}
          pulse={msgsHora > 0}
          onClick={() => onNavigate?.('conversas')}
        />

        {/* Carrinhos ativos — só se > 0 */}
        {carrinho > 0 && <>
          <Sep/>
          <Metric
            label="Com carrinho"
            value={fmtNum(carrinho)}
            cor="#f59e0b"
            icon={ShoppingCart}
            pulse={true}
            onClick={() => onNavigate?.('conversas')}
          />
        </>}

        <Sep/>

        {/* Pedidos / receita */}
        <Metric
          label="Pedidos hoje"
          value={fmtNum(pedidosHoje)}
          sub={data?.pedidos_hora > 0 ? `${data.pedidos_hora}/h` : undefined}
          cor="#22c55e"
          icon={ShoppingCart}
          spark={sparkReceita}
          onClick={() => onNavigate?.('pedidos')}
        />

        {data?.receita_hoje > 0 && <>
          <Sep/>
          <Metric
            label="Receita hoje"
            value={receitaFmt}
            cor="#00d4aa"
            icon={TrendingUp}
            onClick={() => onNavigate?.('caixa')}
          />
        </>}

        <Sep/>

        {/* IA status */}
        <div style={{ display:'flex', alignItems:'center', gap:7, padding:'0 12px', height:'100%', cursor:'pointer' }}
          onClick={() => onNavigate?.('llmconfig')}
          onMouseEnter={e=>e.currentTarget.style.background='var(--fill)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <LiveDot active={iaOk} cor={iaOk ? '#22c55e' : '#ef4444'}/>
          <Zap size={12} style={{ color:iaOk?'#22c55e':'#ef4444', flexShrink:0 }}/>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--label)', lineHeight:1 }}>{taxaIA}%</span>
            </div>
            <span style={{ fontSize:9.5, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.06em', lineHeight:1.2 }}>IA saúde</span>
          </div>
        </div>

        {/* Spacer + timestamp + expand */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:0, height:'100%', flexShrink:0 }}>
          <Sep/>
          <div style={{ padding:'0 10px', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:10, color:'var(--label-4)', fontFamily:'monospace', whiteSpace:'nowrap' }}>{ultimaAtt}</span>
          </div>
          <Sep/>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{ height:'100%', padding:'0 10px', border:'none', background:'transparent', cursor:'pointer', color:'var(--label-4)', display:'flex', alignItems:'center', gap:4, fontSize:10, transition:'color .15s' }}
            onMouseEnter={e=>e.currentTarget.style.color='var(--label)'}
            onMouseLeave={e=>e.currentTarget.style.color='var(--label-4)'}
            title={expanded ? 'Recolher' : 'Ver mais detalhes'}
          >
            <ChevronUp size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform .2s' }}/>
          </button>
        </div>
      </div>

      {/* Painel expandido */}
      {/* Painel de configuração */}
      {showCfg && (
        <div style={{
          position:'absolute',bottom:'100%',right:8,
          background:'var(--bg-2)',border:'1px solid var(--sep)',
          borderRadius:12,padding:'12px 14px',
          boxShadow:'0 -8px 24px rgba(0,0,0,.3)',
          zIndex:200,minWidth:220,
          animation:'fadeIn .15s ease-out',
        }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:700,color:'var(--label)'}}>Configurar barra</span>
            <button onClick={()=>setShowCfg(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:2}}>
              <X size={13}/>
            </button>
          </div>
          {items.map(item=>(
            <div key={item.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'6px 0',borderBottom:'1px solid var(--sep)'}}>
              <span style={{fontSize:12,color:'var(--label-3)'}}>{item.label}</span>
              <button onClick={()=>{
                const novo = items.map(i=>i.id===item.id?{...i,ativo:!i.ativo}:i)
                setItems(novo)
                try{localStorage.setItem('lab_items',JSON.stringify(novo))}catch{}
              }} style={{background:'none',border:'none',cursor:'pointer',
                color:item.ativo?'#22c55e':'var(--label-4)',padding:2,display:'flex',alignItems:'center',gap:4,fontSize:11}}>
                {item.ativo?<Check size={12}/>:<Eye size={12}/>}
                {item.ativo?'Visível':'Oculto'}
              </button>
            </div>
          ))}
          <button onClick={()=>{
            setItems(DEFAULT_ITEMS)
            try{localStorage.removeItem('lab_items')}catch{}
          }} style={{marginTop:8,width:'100%',padding:'5px',borderRadius:7,
            border:'1px solid var(--sep)',background:'var(--fill)',
            color:'var(--label-3)',cursor:'pointer',fontSize:11}}>
            Restaurar padrão
          </button>
        </div>
      )}

      {expanded && (
        <div style={{
          background:'var(--bg-2)', borderTop:'1px solid var(--sep)',
          padding:'12px 16px', animation:'fadeIn .15s ease-out',
          display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10,
        }}>
          {[
            { label:'Sessões 24h',    value:fmtNum(data?.sessoes_ativas), sub:'últ. 30min', cor:'#7c6af7', page:'conversas' },
            { label:'Mensagens hoje', value:fmtNum(data?.msgs_hoje),      sub:`${fmtNum(data?.respostas_hoje || 0)} respostas`, cor:'#4a9fff', page:'conversas' },
            { label:'Carrinhos ativos',value:fmtNum(carrinho),            sub:'no momento', cor:'#f59e0b', page:'conversas' },
            { label:'IA taxa',        value:`${taxaIA}%`,                  sub:'2h recentes', cor:iaOk?'#22c55e':'#ef4444', page:'llmconfig' },
          ].map(k => (
            <button key={k.label} onClick={() => { onNavigate?.(k.page); setExpanded(false) }}
              style={{ padding:'10px 12px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--sep)', cursor:'pointer', textAlign:'left', transition:'all .12s' }}
              onMouseEnter={e=>{ e.currentTarget.style.border=`1px solid ${k.cor}50`; e.currentTarget.style.background=`${k.cor}08` }}
              onMouseLeave={e=>{ e.currentTarget.style.border='1px solid var(--sep)'; e.currentTarget.style.background='var(--bg)' }}>
              <div style={{ fontSize:18, fontWeight:800, color:k.cor, letterSpacing:'-.4px', lineHeight:1, marginBottom:3 }}>{k.value}</div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--label-3)' }}>{k.label}</div>
              <div style={{ fontSize:10, color:'var(--label-4)', marginTop:1 }}>{k.sub}</div>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
