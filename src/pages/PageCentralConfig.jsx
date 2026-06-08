/**
 * PageCentralConfig v3 — ABSOLUTE NIVELMAX
 * Cockpit de monitoramento · Integrações · SLA cirúrgico ·
 * Gestão de contatos · Auditoria com diff · Rastreio unificado
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Settings2, Zap, Truck, Clock, ShieldOff, Download, History,
  LayoutDashboard, Lock, Save, RefreshCw, Check, X, Plus,
  ChevronRight, ChevronDown, Activity, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Minus, Info, Moon, Sun, FileDown,
  Bell, Shield, Package, ShoppingBag, CreditCard, Brain, Star,
  Radio, AlertCircle, XCircle, FileText, Users, MessageSquare,
  Search, Wifi, WifiOff, Database, Globe, Cpu, BarChart2,
  ArrowRight, Eye, Send, Hash, Calendar, Filter, MoreHorizontal,
  PhoneOff, Phone, Bot, UserCheck, UserX, Tag, Layers,
  GitCommit, GitBranch, RotateCcw, ExternalLink, Zap as ZapIcon,
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, Tooltip,
  XAxis, YAxis, CartesianGrid, BarChart, Bar, Cell,
} from 'recharts'

const API = import.meta.env.VITE_API_URL || ''

const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#7b81a0', ink4:'#3a3f5c',
  green:'#00e676', greenDim:'rgba(0,230,118,.09)', greenBor:'rgba(0,230,118,.3)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.09)', amberBor:'rgba(255,179,0,.3)',
  red:'#ff4757',  redDim:'rgba(255,71,87,.09)',   redBor:'rgba(255,71,87,.3)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.1)',purpleBor:'rgba(167,139,250,.3)',
  cyan:'#06b6d4', cyanDim:'rgba(6,182,212,.09)',   cyanBor:'rgba(6,182,212,.28)',
  blue:'#4f8ef7', blueDim:'rgba(79,142,247,.09)',  blueBor:'rgba(79,142,247,.28)',
  orange:'#ff9f0a',orangeDim:'rgba(255,159,10,.09)',
  sep:'rgba(255,255,255,.05)', sep2:'rgba(255,255,255,.09)',
  gray:'rgba(255,255,255,.04)',
}

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const ALWAYS_ON = new Set(['pedido_criado','pagamento_aprovado','pagamento_pendente','cancelamento','boas_vindas'])

const GATILHOS_DEF = [
  { id:'pedido_criado',      label:'Pedido Criado',        grupo:'Compra & Pagamento', cor:'#00d4aa', icon:ShoppingBag   },
  { id:'pagamento_aprovado', label:'Pagamento Aprovado',   grupo:'Compra & Pagamento', cor:'#4a9fff', icon:CreditCard    },
  { id:'pagamento_pendente', label:'Pagamento Pendente',   grupo:'Compra & Pagamento', cor:'#f59e0b', icon:Clock         },
  { id:'pix_pendente',       label:'PIX Pendente',         grupo:'Compra & Pagamento', cor:'#06b6d4', icon:CreditCard    },
  { id:'em_separacao',       label:'Em Separação',         grupo:'Preparação & Nota',  cor:'#8b5cf6', icon:Package       },
  { id:'nfe_emitida',        label:'NF-e Emitida',         grupo:'Preparação & Nota',  cor:'#06b6d4', icon:FileText      },
  { id:'pedido_enviado',     label:'Pedido Enviado',       grupo:'Envio & Rastreio',   cor:'#a78bfa', icon:Truck         },
  { id:'pedido_coletado',    label:'Pedido Coletado',      grupo:'Envio & Rastreio',   cor:'#06b6d4', icon:Package       },
  { id:'rastreio_em_transito',label:'Em Trânsito',         grupo:'Envio & Rastreio',   cor:'#4a9fff', icon:Radio         },
  { id:'saiu_entrega',       label:'Saiu para Entrega',    grupo:'Envio & Rastreio',   cor:'#f59e0b', icon:Truck         },
  { id:'tentativa_entrega',  label:'Tentativa de Entrega', grupo:'Envio & Rastreio',   cor:'#f59e0b', icon:AlertTriangle },
  { id:'pedido_entregue',    label:'Pedido Entregue',      grupo:'Envio & Rastreio',   cor:'#22c55e', icon:Package       },
  { id:'nao_entregue',       label:'Não Entregue',         grupo:'Envio & Rastreio',   cor:'#ef4444', icon:AlertCircle   },
  { id:'cancelamento',       label:'Pedido Cancelado',     grupo:'Pós-venda',          cor:'#6b7280', icon:XCircle       },
  { id:'avaliar_pedido',     label:'Avaliação Pós-venda',  grupo:'Pós-venda',          cor:'#f87171', icon:Star          },
  { id:'estorno_realizado',  label:'Estorno Realizado',    grupo:'Pós-venda',          cor:'#f97316', icon:RefreshCw     },
  { id:'reengajamento',      label:'Reengajamento IA',     grupo:'Inteligência',       cor:'#7c6af7', icon:Brain         },
]

const CANAL_META = {
  loja:         { cor:'#1D9E75', lbl:'Loja Própria',  desc:'Monitorado ativamente',          mktp:false },
  nuvemshop:    { cor:'#4f46e5', lbl:'Nuvemshop',     desc:'Integração nativa',              mktp:false },
  mercadolivre: { cor:'#f5a623', lbl:'Mercado Livre', desc:'Rastreio próprio do marketplace', mktp:true  },
  shopee:       { cor:'#ee4d2d', lbl:'Shopee',        desc:'Rastreio próprio do marketplace', mktp:true  },
  shein:        { cor:'#a0a0a0', lbl:'Shein',         desc:'Rastreio via API externa',        mktp:true  },
  tiktokshop:   { cor:'#ff0050', lbl:'TikTok Shop',   desc:'Rastreio próprio do marketplace', mktp:true  },
}

const tempoRel = (iso) => {
  if (!iso) return null
  const m = Math.floor((Date.now()-new Date(iso))/60000)
  if (m<1) return 'agora'; if(m<60) return `${m}min`
  if (m<1440) return `${Math.floor(m/60)}h`; return `${Math.floor(m/1440)}d`
}

// ═══════════════════════════════════════════════════
// ATOMS
// ═══════════════════════════════════════════════════

function PulsingDot({ cor=T.green, size=8 }) {
  return (
    <span style={{ position:'relative',display:'inline-flex',width:size,height:size,flexShrink:0 }}>
      <span style={{ position:'absolute',inset:0,borderRadius:'50%',
        background:cor,opacity:.4,animation:'cfg-ping 2s ease-out infinite' }}/>
      <span style={{ width:size,height:size,borderRadius:'50%',background:cor,
        display:'block',boxShadow:`0 0 ${size}px ${cor}` }}/>
    </span>
  )
}

function PremiumToggle({ value, onChange, cor=T.green, size='md', disabled }) {
  const w=size==='sm'?38:48, h=size==='sm'?22:28, th=size==='sm'?16:22
  return (
    <button onClick={()=>!disabled&&onChange(!value)} disabled={disabled}
      style={{ position:'relative',width:w,height:h,borderRadius:99,border:'none',
        cursor:disabled?'not-allowed':'pointer',flexShrink:0,
        background:value?`linear-gradient(90deg,${cor},${cor}cc)`:'rgba(255,255,255,.1)',
        boxShadow:value?`0 0 18px ${cor}55,inset 0 1px 0 rgba(255,255,255,.2)`:undefined,
        transition:'all .25s cubic-bezier(.4,0,.2,1)',opacity:disabled?.5:1 }}>
      <span style={{ position:'absolute',top:(h-th)/2,height:th,width:th,borderRadius:'50%',
        background:'#fff',left:value?w-th-(h-th)/2:(h-th)/2,
        transition:'left .22s cubic-bezier(.4,0,.2,1)',
        boxShadow:'0 2px 8px rgba(0,0,0,.35)' }}/>
    </button>
  )
}

function GlowCard({ children, cor, style={}, onClick, top=true }) {
  const [hov,setHov]=useState(false)
  return (
    <div onClick={onClick} onMouseEnter={()=>onClick&&setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
        border:`1px solid ${hov&&cor?cor+'40':cor?cor+'20':T.sep2}`,
        borderRadius:16,overflow:'hidden',cursor:onClick?'pointer':'default',
        boxShadow:hov&&cor?`0 20px 60px rgba(0,0,0,.45),0 0 0 1px ${cor}12 inset`
          :`0 8px 28px rgba(0,0,0,.25),0 1px 0 rgba(255,255,255,.04) inset`,
        transform:hov&&onClick?'translateY(-2px)':'translateY(0)',
        transition:'all .22s cubic-bezier(.4,0,.2,1)', ...style }}>
      {top&&cor&&<div style={{ height:2.5,background:`linear-gradient(90deg,${cor},${cor}50,transparent)`,
        boxShadow:`0 0 14px ${cor}60` }}/>}
      {children}
    </div>
  )
}

function Chip({ label, cor, icon:Ic, pulse, xs }) {
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:4,
      padding:xs?'1px 6px':'3px 9px',borderRadius:99,
      background:`${cor}15`,color:cor,border:`1px solid ${cor}30`,
      fontSize:xs?8.5:10,fontWeight:700,flexShrink:0,letterSpacing:'.03em' }}>
      {pulse&&<PulsingDot cor={cor} size={5}/>}
      {Ic&&<Ic size={8} style={{ flexShrink:0 }}/>}
      {label}
    </span>
  )
}

function PInput({ value,onChange,placeholder,type='text',min,max,rows,mono,small }) {
  const [foc,setFoc]=useState(false)
  const s={width:'100%',background:T.bg1,border:`1px solid ${foc?T.purple+'60':T.sep2}`,
    borderRadius:10,color:T.ink1,fontSize:small?11.5:13,outline:'none',
    fontFamily:mono?'monospace':'inherit',transition:'all .18s',
    boxShadow:foc?`0 0 0 3px ${T.purple}12`:undefined}
  const p={value,onChange,placeholder,onFocus:()=>setFoc(true),onBlur:()=>setFoc(false)}
  if(rows) return <textarea rows={rows} {...p} style={{...s,padding:'10px 13px',resize:'vertical',minHeight:70,lineHeight:1.65}}/>
  return <input type={type} {...p} min={min} max={max} style={{...s,padding:small?'7px 10px':'9px 13px'}}/>
}

// ═══════════════════════════════════════════════════
// HEALTH RING SVG
// ═══════════════════════════════════════════════════
function HealthRing({ score=0, size=130 }) {
  const r=48,cx=size/2,cy=size/2,circ=2*Math.PI*r
  const cor=score>=85?T.green:score>=60?T.amber:T.red
  const off=circ-(circ*(score/100))
  return (
    <svg width={size} height={size} style={{ flexShrink:0 }}>
      <defs>
        <filter id="ring-glow"><feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={10}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={cor} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ filter:`drop-shadow(0 0 8px ${cor}80)`,transition:'stroke-dashoffset 1s ease' }}/>
      <text x={cx} y={cy-6} textAnchor="middle" fill={cor} fontSize={26} fontWeight={900}
        fontFamily="system-ui">{score}</text>
      <text x={cx} y={cy+14} textAnchor="middle" fill={T.ink4} fontSize={10}
        fontFamily="system-ui">/ 100</text>
    </svg>
  )
}

// ═══════════════════════════════════════════════════
// 1. MONITORAMENTO CENTRAL — cockpit
// ═══════════════════════════════════════════════════
function SecaoMonitoramento({ api }) {
  const [mon,  setMon]   = useState(null)
  const [live, setLive]  = useState(null)
  const [ind,  setInd]   = useState({})
  const [spark,setSpark]  = useState(Array(20).fill(0))
  const [feed, setFeed]   = useState([])
  const [tick, setTick]   = useState(0)

  const buscar = useCallback(async () => {
    try {
      const [rm,rl,ri] = await Promise.all([
        fetch(`${api}/api/dashboard/monitoramento`).then(r=>r.ok?r.json():null).catch(()=>null),
        fetch(`${api}/api/dashboard/live-activity`).then(r=>r.ok?r.json():null).catch(()=>null),
        fetch(`${api}/api/dashboard/gatilhos-indicadores`).then(r=>r.ok?r.json():null).catch(()=>null),
      ])
      if(rm&&!rm.erro) setMon(rm)
      if(rl) {
        setLive(rl)
        setSpark(p=>[...p.slice(1),rl.msgs_hora||0])
        if(rl.msgs_hora>0) setFeed(f=>[{
          ts:new Date(),label:`${rl.msgs_hora} msgs/h · ${rl.sessoes_ativas||0} sessões`,
          cor:T.green,tipo:'live'
        },...f].slice(0,12))
      }
      if(ri) setInd(ri.indicadores||{})
      setTick(t=>t+1)
    } catch {}
  },[api])

  useEffect(()=>{ buscar(); const iv=setInterval(buscar,15000); return()=>clearInterval(iv) },[buscar])

  const hs=mon?.health?.score
  const hCor=hs==null?T.ink3:hs>=85?T.green:hs>=60?T.amber:T.red
  const isAtivo=(live?.msgs_hora||0)>0||(live?.sessoes_ativas||0)>0

  const sparkData=spark.map((v,i)=>({i:`${i}`,v}))

  const SUBSYSTEMS=[
    { id:'wa',     lbl:'WhatsApp',    cor:T.green,  icon:MessageSquare, val:live?.ia_ok!==false?'OK':'Erro',   ok:live?.ia_ok!==false },
    { id:'meta',   lbl:'Meta API',    cor:T.blue,   icon:Globe,         val:`${mon?.funilMeta?.taxa||0}%`,     ok:(mon?.funilMeta?.taxa||100)>60 },
    { id:'bling',  lbl:'Bling ERP',   cor:T.amber,  icon:Database,      val:'Sincronizado',                    ok:true },
    { id:'gemini', lbl:'Gemini AI',   cor:T.purple, icon:Brain,         val:`${live?.taxa_ia??100}%`,          ok:(live?.taxa_ia??100)>70 },
    { id:'rastreio',lbl:'Rastreio',   cor:T.cyan,   icon:Truck,         val:'Ativo',                           ok:true },
    { id:'conv',   lbl:'Conversas',   cor:T.green,  icon:Users,         val:`${live?.sessoes_ativas||0}`,      ok:true },
  ]

  const METRICAS=[
    { lbl:'Msgs/hora',    val:live?.msgs_hora||0,             sub:'agora',         cor:T.blue   },
    { lbl:'Sessões',      val:live?.sessoes_ativas||0,        sub:'ativas',        cor:T.purple },
    { lbl:'Disparos 7d',  val:mon?.health?.env7||0,           sub:'enviados',      cor:T.green  },
    { lbl:'Taxa entrega', val:`${mon?.health?.taxa7||0}%`,    sub:'última semana', cor:T.amber  },
    { lbl:'Anomalias',    val:mon?.anomalias?.length||0,      sub:'detectadas',    cor:mon?.anomalias?.length?T.red:T.green },
    { lbl:'Fila humano',  val:live?.sessoes_humano||0,        sub:'aguardando',    cor:live?.sessoes_humano?T.red:T.ink3 },
  ]

  return (
    <div>
      {/* COCKPIT HERO */}
      <div style={{ display:'grid',gridTemplateColumns:'auto 1fr',gap:20,marginBottom:20 }}>
        {/* Health Ring + status */}
        <GlowCard cor={hCor} style={{ padding:'24px 28px',display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',gap:10,minWidth:220 }}>
          <HealthRing score={hs??0}/>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:13,fontWeight:700,color:hCor }}>
              {hs==null?'Sem dados':hs>=85?'Sistema saudável':hs>=60?'Atenção necessária':'Estado crítico'}
            </div>
            <div style={{ fontSize:10.5,color:T.ink4,marginTop:3,display:'flex',alignItems:'center',
              justifyContent:'center',gap:6 }}>
              <PulsingDot cor={isAtivo?T.green:T.ink4} size={6}/>
              {isAtivo?'Ativo agora':'Sistema em espera'}
            </div>
          </div>
        </GlowCard>

        {/* Métricas grid */}
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8 }}>
            {METRICAS.map(m=>(
              <GlowCard key={m.lbl} cor={m.cor}>
                <div style={{ padding:'12px 14px' }}>
                  <div style={{ fontSize:22,fontWeight:800,color:m.cor,
                    letterSpacing:'-.04em',lineHeight:1,
                    textShadow:`0 0 20px ${m.cor}40` }}>{m.val}</div>
                  <div style={{ fontSize:11,fontWeight:600,color:T.ink2,marginTop:3 }}>{m.lbl}</div>
                  <div style={{ fontSize:9.5,color:T.ink4 }}>{m.sub}</div>
                </div>
              </GlowCard>
            ))}
          </div>
          {/* Sparkline live */}
          <GlowCard cor={T.blue} top={false} style={{ padding:'10px 14px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
              <Activity size={11} style={{ color:T.blue }}/>
              <span style={{ fontSize:10,fontWeight:700,color:T.ink4,
                textTransform:'uppercase',letterSpacing:'.07em' }}>
                Mensagens — últimas {spark.length} leituras
              </span>
              <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:5 }}>
                <PulsingDot cor={T.blue} size={6}/>
                <span style={{ fontSize:9.5,color:T.blue,fontWeight:600 }}>15s</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={52}>
              <AreaChart data={sparkData} margin={{top:2,right:0,left:-36,bottom:0}}>
                <defs>
                  <linearGradient id="sg-blue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.blue} stopOpacity={.3}/>
                    <stop offset="100%" stopColor={T.blue} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area dataKey="v" type="monotone" stroke={T.blue} strokeWidth={2}
                  fill="url(#sg-blue)" dot={false}
                  style={{ filter:`drop-shadow(0 0 4px ${T.blue}60)` }}/>
                <YAxis tick={{fontSize:8,fill:T.ink4}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background:T.bg3,border:`1px solid ${T.sep2}`,
                  borderRadius:8,fontSize:10 }} labelStyle={{ display:'none' }}
                  formatter={v=>[`${v} msgs/h`]}/>
              </AreaChart>
            </ResponsiveContainer>
          </GlowCard>
        </div>
      </div>

      {/* SUBSISTEMAS */}
      <div style={{ fontSize:11,fontWeight:700,color:T.ink4,textTransform:'uppercase',
        letterSpacing:'.09em',marginBottom:10 }}>Estado dos subsistemas</div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:20 }}>
        {SUBSYSTEMS.map(s=>(
          <GlowCard key={s.id} cor={s.ok?s.cor:T.red}>
            <div style={{ padding:'12px 14px',display:'flex',alignItems:'center',gap:10 }}>
              <div style={{ width:34,height:34,borderRadius:10,flexShrink:0,
                background:`${s.ok?s.cor:T.red}18`,border:`1px solid ${s.ok?s.cor:T.red}30`,
                display:'flex',alignItems:'center',justifyContent:'center' }}>
                <s.icon size={15} style={{ color:s.ok?s.cor:T.red }}/>
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:12,fontWeight:700,color:T.ink1 }}>{s.lbl}</div>
                <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:2 }}>
                  <PulsingDot cor={s.ok?s.cor:T.red} size={5}/>
                  <span style={{ fontSize:10.5,color:s.ok?s.cor:T.red,fontWeight:600 }}>
                    {s.val}
                  </span>
                </div>
              </div>
            </div>
          </GlowCard>
        ))}
      </div>

      {/* LIVE FEED */}
      <GlowCard cor={T.green} top={false}>
        <div style={{ padding:'14px 16px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
            <PulsingDot cor={T.green} size={7}/>
            <span style={{ fontSize:11,fontWeight:700,color:T.ink3,
              textTransform:'uppercase',letterSpacing:'.08em' }}>Feed de atividade</span>
            <span style={{ marginLeft:'auto',fontSize:10,color:T.ink4 }}>
              Atualiza a cada 15s · leitura #{tick}
            </span>
          </div>
          {feed.length===0 ? (
            <div style={{ fontSize:12,color:T.ink4,textAlign:'center',padding:'12px 0' }}>
              Aguardando atividade...
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
              {feed.map((f,i)=>(
                <div key={i} style={{ display:'flex',alignItems:'center',gap:10,
                  padding:'7px 10px',borderRadius:9,
                  background:i===0?`${f.cor}09`:T.gray,
                  border:`1px solid ${i===0?f.cor+'25':T.sep}`,
                  opacity:1-(i*0.07),transition:'opacity .3s' }}>
                  <div style={{ width:5,height:5,borderRadius:'50%',flexShrink:0,
                    background:f.cor,boxShadow:`0 0 6px ${f.cor}` }}/>
                  <span style={{ flex:1,fontSize:11.5,color:T.ink2 }}>{f.label}</span>
                  <span style={{ fontSize:10,color:T.ink4 }}>{tempoRel(f.ts)||'agora'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlowCard>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 2. INTEGRAÇÕES
// ═══════════════════════════════════════════════════
function SecaoIntegracoes({ api }) {
  const [data,setData]=useState({})
  const [loading,setLoading]=useState(true)
  const [meStatus,setMeStatus]=useState(null)
  const [meUser,setMeUser]=useState('')
  const [meConect,setMeConect]=useState(false)

  const checarME = () => {
    fetch(`${api}/bling-webhook/me-status`)
      .then(r=>r.json())
      .then(d=>{ setMeStatus(d.status); setMeUser(d.usuario||'') })
      .catch(()=>setMeStatus('erro'))
  }

  const abrirOAuthME = async () => {
    setMeConect(true)
    try {
      const r = await fetch(`${api}/bling-webhook/me-oauth-url`)
      const d = await r.json()
      if (d.erro) { alert('Erro: ' + d.erro); setMeConect(false); return }
      const popup = window.open(d.url, 'me-oauth', 'width=620,height=720,scrollbars=yes')
      const timer = setInterval(()=>{
        if (!popup || popup.closed) {
          clearInterval(timer); setMeConect(false); setTimeout(checarME, 1500)
        }
      }, 600)
    } catch(e) {
      alert('Erro ao obter URL OAuth: ' + e.message)
      setMeConect(false)
    }
  }

  useEffect(()=>{
    checarME()
    Promise.all([
      fetch(`${api}/api/dashboard/monitoramento`).then(r=>r.json()).catch(()=>null),
      fetch(`${api}/api/ia/config`).then(r=>r.json()).catch(()=>null),
    ]).then(([mon,cfg])=>{
      setData({ mon, cfg:cfg?.config||{} })
      setLoading(false)
    })
  },[api])

  const cfg=data.cfg||{}
  const mon=data.mon||{}

  const blingExp=cfg.bling_expires_at?Math.floor((new Date(cfg.bling_expires_at)-new Date())/86400000):null
  const refreshExp=cfg.bling_refresh_expires_at?Math.floor((new Date(cfg.bling_refresh_expires_at)-new Date())/86400000):null

  const INTEGRACOES=[
    {
      id:'whatsapp', lbl:'WhatsApp Business API', cor:'#25d366',
      icon:MessageSquare, status:true,
      metricas:[
        { lbl:'Health Score', val:`${mon?.health?.score||0}/100`, cor:mon?.health?.score>=85?T.green:T.amber },
        { lbl:'Taxa entrega', val:`${mon?.funilMeta?.taxa||0}%`,  cor:T.green },
        { lbl:'Templates',    val:`${mon?.funilMeta?.aprovados||0} aprovados`, cor:T.blue },
        { lbl:'Rejeitados',   val:mon?.funilMeta?.rejeitados||0, cor:T.red },
      ],
      actions:[{ lbl:'Ver templates', href:null }],
    },
    {
      id:'meta', lbl:'Meta API', cor:T.blue, icon:Globe,
      status:true,
      metricas:[
        { lbl:'Limite diário',  val:`${mon?.funilMeta?.enviados||0}/1000`, cor:T.cyan },
        { lbl:'Tx rejeição',    val:`${mon?.funilMeta?.rejeitados||0}%`,   cor:T.amber },
        { lbl:'Custo estimado', val:`US$ ${((mon?.health?.env7||0)*0.0085).toFixed(2)}/sem`, cor:T.green },
      ],
      actions:[{ lbl:'Abrir Meta Business', href:'https://business.facebook.com' }],
    },
    {
      id:'bling', lbl:'Bling ERP', cor:T.amber, icon:Database,
      status:blingExp==null||blingExp>0,
      metricas:[
        { lbl:'Token acesso',  val:blingExp!=null?blingExp>0?`${blingExp}d`:'Expirado':'Verificar', cor:blingExp!=null&&blingExp>5?T.green:T.red },
        { lbl:'Refresh token', val:refreshExp!=null?`${refreshExp}d restantes`:'—', cor:refreshExp!=null&&refreshExp>5?T.green:T.amber },
        { lbl:'Último sync',   val:cfg.catalogo_ultimo_sync?tempoRel(cfg.catalogo_ultimo_sync)||'—':'—', cor:T.ink3 },
      ],
      actions:[
        { lbl:'Sincronizar catálogo', handler:async()=>{ await fetch(`${api}/bling/sync-catalogo`,{method:'POST'}) } },
        { lbl:'Reautorizar', href:`${api}/bling/auth` },
      ],
    },
    {
      id:'gemini', lbl:'Gemini AI', cor:T.purple, icon:Brain,
      status:true,
      metricas:[
        { lbl:'Modelo',     val:cfg.modelo_ia||'gemini-pro',  cor:T.purple },
        { lbl:'Temp.',      val:cfg.temperatura_ia||'0.7',    cor:T.cyan   },
        { lbl:'Saúde IA',   val:`${cfg.health_score||100}%`,  cor:T.green  },
      ],
      actions:[{ lbl:'Configurar IA', href:null }],
    },
    {
      id:'nuvemshop', lbl:'Nuvemshop', cor:'#4f46e5', icon:ShoppingBag,
      status:true,
      metricas:[
        { lbl:'Webhooks',   val:'Ativos',    cor:T.green  },
        { lbl:'Canal',      val:'Monitorado',cor:T.green  },
      ],
      actions:[{ lbl:'Painel Nuvemshop', href:'https://www.nuvemshop.com.br' }],
    },
    {
      id:'marketplaces', lbl:'Marketplaces (ML/Shopee/Shein)', cor:T.orange, icon:Layers,
      status:true,
      metricas:[
        { lbl:'Canais',      val:'3 ativos',      cor:T.orange },
        { lbl:'Rastreio',    val:'Via API',        cor:T.ink3   },
        { lbl:'Notificações',val:'WhatsApp ativo', cor:T.green  },
      ],
      actions:[],
    },
    {
      id:'melhorenvio', lbl:'MelhorEnvio', cor:'#009c3b', icon:Truck,
      status: meStatus==='ativo',
      _meCard: true,
      metricas:[
        { lbl:'Status',    val: meStatus==='ativo' ? 'Token ativo' : meStatus==='expirado' ? 'Expirado' : meStatus==='sem_token' ? 'Sem token' : 'Verificando', cor: meStatus==='ativo' ? T.green : T.amber },
        { lbl:'Conta',     val: meUser||'—',                               cor:T.ink3 },
        { lbl:'Rastreio',  val:'LGI-* / ME*',                              cor:T.ink3 },
        { lbl:'Callback',  val:'whatsapp-sostrass…',                       cor:T.ink4 },
      ],
      actions:[],
    },
  ]

  if(loading) return <div style={{ textAlign:'center',padding:40,color:T.ink4 }}>Carregando integrações...</div>

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
      {INTEGRACOES.map(intg=>(
        <GlowCard key={intg.id} cor={intg.status?intg.cor:T.red}>
          <div style={{ padding:'18px 20px' }}>
            <div style={{ display:'flex',alignItems:'flex-start',gap:14,marginBottom:16 }}>
              {/* Ícone + status */}
              <div style={{ position:'relative',flexShrink:0 }}>
                <div style={{ width:44,height:44,borderRadius:13,
                  background:`linear-gradient(135deg,${intg.cor}30,${intg.cor}12)`,
                  border:`1.5px solid ${intg.cor}40`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  boxShadow:`0 4px 20px ${intg.cor}25` }}>
                  <intg.icon size={20} style={{ color:intg.cor }}/>
                </div>
                <div style={{ position:'absolute',bottom:-3,right:-3,
                  width:14,height:14,borderRadius:'50%',
                  background:intg.status?T.green:T.red,
                  border:`2px solid ${T.bg2}`,
                  boxShadow:`0 0 8px ${intg.status?T.green:T.red}` }}/>
              </div>

              <div style={{ flex:1 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                  <span style={{ fontSize:15,fontWeight:800,color:T.ink1,letterSpacing:'-.02em' }}>
                    {intg.lbl}
                  </span>
                  <Chip label={intg.status?'Conectado':'Desconectado'}
                    cor={intg.status?T.green:T.red} pulse={intg.status}/>
                </div>
              </div>

              {/* Ações */}
              <div style={{ display:'flex',gap:6,flexShrink:0,flexWrap:'wrap' }}>
                {/* Botão especial MelhorEnvio OAuth */}
                {intg._meCard && (
                  <>
                    <button onClick={abrirOAuthME} disabled={meConect}
                      style={{ display:'flex',alignItems:'center',gap:5,
                        padding:'6px 14px',borderRadius:9,border:'none',
                        cursor:meConect?'wait':'pointer',fontSize:11,fontWeight:700,
                        background: meStatus==='ativo'
                          ? `rgba(0,156,59,.15)` : `linear-gradient(135deg,#ffb300,#ffb300cc)`,
                        color: meStatus==='ativo' ? '#00e676' : '#000',
                        boxShadow: meStatus!=='ativo' ? '0 3px 12px rgba(255,179,0,.35)' : undefined,
                        opacity: meConect ? .7 : 1 }}>
                      {meConect
                        ? <><RefreshCw size={10} style={{ animation:'spin-me 1s linear infinite' }}/>Aguardando...</>
                        : meStatus==='ativo'
                          ? <><RefreshCw size={10}/>Re-autenticar</>
                          : <><ExternalLink size={10}/>{meStatus==='expirado'?'Reconectar':'Conectar'}</>
                      }
                    </button>
                    <button onClick={checarME}
                      style={{ display:'flex',alignItems:'center',gap:4,
                        padding:'6px 10px',borderRadius:9,fontSize:10,fontWeight:600,
                        border:`1px solid rgba(0,156,59,.3)`,background:'transparent',
                        color:T.ink3,cursor:'pointer' }}>
                      <RefreshCw size={9}/>Status
                    </button>
                  </>
                )}
                {/* Botões normais */}
                {intg.actions.map((a,i)=>(
                  <button key={i} onClick={()=>{ if(a.href) window.open(a.href,'_blank'); a.handler?.() }}
                    style={{ display:'flex',alignItems:'center',gap:5,
                      padding:'6px 12px',borderRadius:9,
                      border:`1px solid ${intg.cor}35`,background:`${intg.cor}12`,
                      color:intg.cor,cursor:'pointer',fontSize:11,fontWeight:600,
                      transition:'all .15s' }}>
                    {a.href&&<ExternalLink size={10}/>}
                    {a.lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Métricas */}
            <div style={{ display:'grid',
              gridTemplateColumns:`repeat(${Math.min(intg.metricas.length,4)},1fr)`,gap:8 }}>
              {intg.metricas.map((m,i)=>(
                <div key={i} style={{ padding:'10px 12px',borderRadius:10,
                  background:T.bg4,border:`1px solid ${T.sep}` }}>
                  <div style={{ fontSize:14,fontWeight:800,color:m.cor,
                    letterSpacing:'-.03em',textShadow:`0 0 14px ${m.cor}35` }}>
                    {m.val}
                  </div>
                  <div style={{ fontSize:10,color:T.ink4,marginTop:3 }}>{m.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </GlowCard>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 3. GATILHOS & HORÁRIOS (schedule calendar)
// ═══════════════════════════════════════════════════
function ScheduleCalendar({ schedule }) {
  const { enabled=false,start_h=8,end_h=21,days=[1,2,3,4,5] }=schedule||{}
  if(!enabled) return (
    <div style={{ padding:'10px 12px',borderRadius:9,background:T.bg4,border:`1px solid ${T.sep}`,
      fontSize:11,color:T.ink4,textAlign:'center' }}>
      Sem janela — dispara a qualquer hora
    </div>
  )
  const HOURS=Array.from({length:24},(_,i)=>i)
  return (
    <div>
      <div style={{ display:'grid',
        gridTemplateColumns:`22px repeat(7,1fr)`,gap:1.5,alignItems:'center' }}>
        <div/>
        {DIAS.map((d,i)=>(
          <div key={d} style={{ fontSize:8,fontWeight:700,textAlign:'center',
            color:days.includes(i)?T.amber:T.ink4,textTransform:'uppercase' }}>{d}</div>
        ))}
        {HOURS.map(h=>(
          <>{h%3===0
            ?<div key={`h${h}`} style={{ fontSize:7.5,color:T.ink4,textAlign:'right',paddingRight:3 }}>{h}h</div>
            :<div key={`h${h}`}/>}
            {DIAS.map((_,di)=>{
              const on=days.includes(di)&&h>=start_h&&h<end_h
              return (
                <div key={`${h}-${di}`} style={{ height:9,borderRadius:2,
                  background:on?T.green:T.bg4,
                  border:`1px solid ${on?T.green+'40':T.sep}`,
                  boxShadow:on?`0 0 3px ${T.green}30`:undefined,
                  transition:'all .12s' }}/>
              )
            })}
          </>
        ))}
      </div>
      <div style={{ marginTop:8,padding:'6px 10px',borderRadius:7,
        background:T.amberDim,border:`1px solid ${T.amberBor}`,
        fontSize:10,color:T.amber,fontWeight:600 }}>
        ⏰ {days.filter(d=>d>0&&d<7).length}d úteis · {start_h}h–{end_h}h
        · {((end_h-start_h)*days.length)}h/sem ativas
      </div>
    </div>
  )
}

function HourDayPicker({ schedule,onChange }) {
  const { enabled=false,start_h=8,end_h=21,days=[1,2,3,4,5] }=schedule||{}
  const upd=p=>onChange({ enabled,start_h,end_h,days,...p })
  const RANGE_H=Array.from({length:25},(_,i)=>i) // 0–24
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'10px 14px',borderRadius:10,background:enabled?T.amberDim:T.gray,
        border:`1px solid ${enabled?T.amberBor:T.sep}`,transition:'all .2s' }}>
        <div>
          <div style={{ fontSize:12.5,fontWeight:700,color:T.ink1 }}>Janela de horário</div>
          <div style={{ fontSize:10.5,color:T.ink4,marginTop:2 }}>
            {enabled?'Só dispara no período':'Dispara 24h por dia'}
          </div>
        </div>
        <PremiumToggle value={enabled} onChange={v=>upd({enabled:v})} cor={T.amber}/>
      </div>
      {enabled&&(<>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          {[{l:'Início',k:'start_h',v:start_h},{l:'Fim',k:'end_h',v:end_h}].map(f=>(
            <div key={f.k}>
              <div style={{ fontSize:9.5,fontWeight:700,color:T.ink4,textTransform:'uppercase',
                letterSpacing:'.08em',marginBottom:6 }}>{f.l}</div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:3 }}>
                {RANGE_H.map(h=>(
                  <button key={h} onClick={()=>upd({[f.k]:h})}
                    style={{ width:30,height:24,borderRadius:6,border:'none',cursor:'pointer',
                      fontSize:9.5,fontWeight:700,transition:'all .12s',
                      background:f.v===h?T.amber:T.bg4,
                      color:f.v===h?'#000':T.ink4,
                      boxShadow:f.v===h?`0 0 8px ${T.amber}50`:undefined }}>
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize:9.5,fontWeight:700,color:T.ink4,textTransform:'uppercase',
            letterSpacing:'.08em',marginBottom:6 }}>Dias ativos</div>
          <div style={{ display:'flex',gap:5 }}>
            {DIAS.map((d,i)=>{
              const a=days.includes(i)
              return <button key={i} onClick={()=>upd({days:a?days.filter(x=>x!==i):[...days,i].sort()})}
                style={{ width:36,height:32,borderRadius:8,border:'none',cursor:'pointer',
                  fontSize:10.5,fontWeight:700,transition:'all .15s',
                  background:a?T.amber:T.bg4,color:a?'#000':T.ink4,
                  boxShadow:a?`0 0 10px ${T.amber}50`:undefined }}>{d}</button>
            })}
          </div>
        </div>
      </>)}
    </div>
  )
}

function GatilhoCard({ g,schedule,indicador,onSave }) {
  const [open,setOpen]=useState(false)
  const [local,setLocal]=useState(schedule||{})
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)
  const isLocked=ALWAYS_ON.has(g.id)
  const Ic=g.icon||Zap
  const temJanela=local.enabled&&!isLocked
  const env7=indicador?.enviados||0
  const tot7=indicador?.total||0
  const taxa=tot7>0?Math.round(env7/tot7*100):null

  const handleSave=async()=>{
    setSaving(true);await onSave(g.id,local)
    setSaved(true);setTimeout(()=>setSaved(false),2000);setSaving(false)
  }

  return (
    <div style={{ borderRadius:14,overflow:'hidden',
      background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
      border:`1.5px solid ${open?g.cor+'50':isLocked?T.sep:temJanela?g.cor+'28':T.sep2}`,
      boxShadow:open?`0 16px 48px rgba(0,0,0,.4),0 0 0 1px ${g.cor}08 inset`:`0 4px 18px rgba(0,0,0,.2)`,
      transition:'all .22s cubic-bezier(.4,0,.2,1)' }}>
      <div style={{ height:2,background:isLocked?'transparent':temJanela
        ?`linear-gradient(90deg,${g.cor},${g.cor}50,transparent)`:'transparent',
        boxShadow:temJanela?`0 0 12px ${g.cor}50`:undefined,transition:'all .3s' }}/>
      <div onClick={()=>!isLocked&&setOpen(v=>!v)}
        style={{ display:'flex',alignItems:'center',gap:12,padding:'13px 16px',
          cursor:isLocked?'default':'pointer',userSelect:'none' }}>
        <div style={{ width:36,height:36,borderRadius:11,flexShrink:0,
          background:`linear-gradient(135deg,${g.cor}28,${g.cor}10)`,
          border:`1.5px solid ${g.cor}38`,display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:open?`0 4px 18px ${g.cor}30`:undefined,transition:'all .2s' }}>
          <Ic size={15} style={{ color:g.cor }}/>
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:3 }}>
            <span style={{ fontSize:13.5,fontWeight:700,color:T.ink1,letterSpacing:'-.02em' }}>
              {g.label}
            </span>
            {isLocked&&<Chip label="SEMPRE ATIVO" cor={T.ink3} icon={Lock}/>}
            {temJanela&&<Chip label={`${local.start_h}h–${local.end_h}h`} cor={g.cor}/>}
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            {taxa!==null&&<span style={{ fontSize:10.5,fontWeight:700,
              color:taxa>=80?T.green:taxa>=50?T.amber:T.red,
              display:'flex',alignItems:'center',gap:3 }}>
              {taxa>=80?<TrendingUp size={9}/>:taxa<50?<TrendingDown size={9}/>:<Minus size={9}/>}
              {taxa}% (7d)
            </span>}
            {env7>0&&<span style={{ fontSize:10,color:T.ink4 }}>{env7} enviados</span>}
            {isLocked&&<span style={{ fontSize:10.5,color:T.ink4 }}>Resposta imediata obrigatória</span>}
          </div>
        </div>
        {!isLocked&&(
          <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
            <PremiumToggle value={local.enabled||false}
              onChange={v=>setLocal(s=>({...s,enabled:v}))} cor={g.cor} size="sm"/>
            <ChevronRight size={14} style={{ color:T.ink4,
              transform:open?'rotate(90deg)':'rotate(0)',transition:'transform .2s' }}/>
          </div>
        )}
      </div>
      {open&&!isLocked&&(
        <div style={{ borderTop:`1px solid ${g.cor}18`,
          background:`linear-gradient(135deg,${g.cor}04,transparent)` }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:0 }}>
            <div style={{ padding:'16px',borderRight:`1px solid ${g.cor}12` }}>
              <div style={{ fontSize:10,fontWeight:700,color:T.ink4,textTransform:'uppercase',
                letterSpacing:'.08em',marginBottom:10 }}>Configurar janela</div>
              <HourDayPicker schedule={local} onChange={setLocal}/>
            </div>
            <div style={{ padding:'16px' }}>
              <div style={{ fontSize:10,fontWeight:700,color:T.ink4,textTransform:'uppercase',
                letterSpacing:'.08em',marginBottom:10 }}>Preview semanal ao vivo</div>
              <ScheduleCalendar schedule={local}/>
              {local.enabled&&indicador&&(
                <div style={{ marginTop:8,padding:'7px 10px',borderRadius:8,
                  background:T.redDim,border:`1px solid ${T.redBor}`,
                  fontSize:10,color:T.red,fontWeight:600 }}>
                  ⚠ ~{Math.round(tot7*(1-(local.days?.length||5)/7*
                    ((local.end_h||21)-(local.start_h||8))/24))} msgs/sem bloqueadas
                </div>
              )}
            </div>
          </div>
          <div style={{ padding:'12px 16px',borderTop:`1px solid ${g.cor}12`,
            display:'flex',justifyContent:'flex-end',gap:8 }}>
            <button onClick={()=>setOpen(false)}
              style={{ padding:'7px 14px',borderRadius:9,border:`1px solid ${T.sep2}`,
                background:'transparent',color:T.ink4,cursor:'pointer',fontSize:12 }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ display:'flex',alignItems:'center',gap:7,padding:'8px 18px',
                borderRadius:9,border:'none',cursor:'pointer',fontSize:12.5,fontWeight:700,
                background:`linear-gradient(135deg,${g.cor},${g.cor}cc)`,color:'#000',
                boxShadow:`0 4px 16px ${g.cor}35`,opacity:saving?.6:1 }}>
              {saved?<><Check size={13}/>Salvo!</>:saving?
                <><RefreshCw size={13} style={{ animation:'cfg-spin 1s linear infinite' }}/>Salvando...</>
                :<><Save size={13}/>Salvar</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SecaoGatilhosHorarios({ api }) {
  const [schedules,setSchedules]=useState({})
  const [indicadores,setIndicadores]=useState({})
  const [loading,setLoading]=useState(true)
  const [busca,setBusca]=useState('')
  const [grupoAberto,setGrupoAberto]=useState('Compra & Pagamento')

  useEffect(()=>{
    Promise.all([
      fetch(`${api}/api/dashboard/config/schedules`).then(r=>r.json()).catch(()=>({})),
      fetch(`${api}/api/dashboard/gatilhos-indicadores`).then(r=>r.json()).catch(()=>({})),
    ]).then(([s,ind])=>{ setSchedules(s.schedules||{}); setIndicadores(ind.indicadores||{}); setLoading(false) })
  },[api])

  const salvar=async(id,schedule)=>{
    await fetch(`${api}/api/dashboard/config/schedules`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({gatilho:id,schedule})}).catch(()=>{})
    setSchedules(p=>({...p,[id]:schedule}))
  }

  const grupos={}
  GATILHOS_DEF.forEach(g=>{ if(!grupos[g.grupo]) grupos[g.grupo]=[]; if(!grupos[g.grupo].find(x=>x.id===g.id)) grupos[g.grupo].push(g) })
  const filtrados=busca?GATILHOS_DEF.filter(g=>g.label.toLowerCase().includes(busca.toLowerCase())):null
  const comJanela=GATILHOS_DEF.filter(g=>schedules[g.id]?.enabled&&!ALWAYS_ON.has(g.id)).length

  return (
    <div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20 }}>
        {[{l:'Com janela',v:comJanela,cor:T.amber},{l:'Sempre ativos',v:ALWAYS_ON.size,cor:T.ink3},{l:'Total',v:GATILHOS_DEF.length,cor:T.purple}].map(s=>(
          <GlowCard key={s.l} cor={s.cor}>
            <div style={{ padding:'14px 16px' }}>
              <div style={{ fontSize:26,fontWeight:800,color:s.cor,letterSpacing:'-.04em',
                textShadow:`0 0 20px ${s.cor}40` }}>{s.v}</div>
              <div style={{ fontSize:10.5,color:T.ink4,marginTop:3 }}>{s.l}</div>
            </div>
          </GlowCard>
        ))}
      </div>
      <div style={{ display:'flex',gap:10,padding:'12px 16px',borderRadius:12,
        background:T.amberDim,border:`1px solid ${T.amberBor}`,marginBottom:16 }}>
        <Lock size={13} style={{ color:T.amber,flexShrink:0,marginTop:1 }}/>
        <div style={{ fontSize:11.5,color:T.amber,lineHeight:1.6 }}>
          <strong>Sempre imediatos (sem janela):</strong> Pedido Criado, Pagamento Aprovado/Pendente, Cancelamento, Boas-vindas.
        </div>
      </div>
      <div style={{ position:'relative',marginBottom:14 }}>
        <Search size={13} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:T.ink4,pointerEvents:'none' }}/>
        <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar gatilho..."
          style={{ width:'100%',padding:'9px 12px 9px 35px',borderRadius:10,background:T.bg2,
            border:`1px solid ${T.sep2}`,color:T.ink1,fontSize:13,outline:'none',
            fontFamily:'inherit',boxSizing:'border-box' }}/>
      </div>
      {loading?<div style={{ textAlign:'center',padding:32,color:T.ink4 }}>Carregando...</div>
        :filtrados?(
          <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
            {filtrados.map(g=><GatilhoCard key={g.id} g={g} schedule={schedules[g.id]} indicador={indicadores[g.id]} onSave={salvar}/>)}
          </div>
        ):(
          Object.entries(grupos).map(([grupo,items])=>(
            <div key={grupo} style={{ marginBottom:14 }}>
              <button onClick={()=>setGrupoAberto(v=>v===grupo?null:grupo)}
                style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8,background:'none',
                  border:'none',cursor:'pointer',padding:'4px 0',width:'100%' }}>
                <div style={{ fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:T.ink4 }}>{grupo}</div>
                <div style={{ flex:1,height:1,background:T.sep }}/>
                <ChevronDown size={11} style={{ color:T.ink4,transform:grupoAberto===grupo?'rotate(180deg)':'rotate(0)',transition:'transform .2s' }}/>
              </button>
              {grupoAberto===grupo&&(
                <div style={{ display:'flex',flexDirection:'column',gap:6,animation:'cfg-fadeIn .2s ease' }}>
                  {items.map(g=><GatilhoCard key={g.id} g={g} schedule={schedules[g.id]} indicador={indicadores[g.id]} onSave={salvar}/>)}
                </div>
              )}
            </div>
          ))
        )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 4. RASTREIO UNIFICADO
// ═══════════════════════════════════════════════════
function SecaoRastreio({ api }) {
  const [canais,setCanais]=useState([])
  const [stats,setStats]=useState({})
  const [loading,setLoading]=useState(true)
  const [salvando,setSalvando]=useState(false)
  const [ok,setOk]=useState(false)

  useEffect(()=>{
    Promise.all([
      fetch(`${api}/api/dashboard/operacao/canais`).then(r=>r.json()).catch(()=>({canais:[]})),
      fetch(`${api}/api/dashboard/monitoramento`).then(r=>r.json()).catch(()=>({})),
    ]).then(([c,m])=>{ setCanais(c.canais||[]); setStats(m); setLoading(false) })
  },[api])

  const salvar=async()=>{
    setSalvando(true)
    const p={}; canais.forEach(c=>{p[c.id]=c.ativo})
    await fetch(`${api}/api/dashboard/operacao/canais`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({canais:p})}).catch(()=>{})
    setOk(true);setTimeout(()=>setOk(false),2500);setSalvando(false)
  }

  const proprios=canais.filter(c=>!CANAL_META[c.id]?.mktp)
  const mktps=canais.filter(c=>CANAL_META[c.id]?.mktp)
  const ativos=canais.filter(c=>c.ativo).length
  const totalFila=canais.reduce((a,c)=>a+(c.naFila||0),0)

  const CanalCard=({c})=>{
    const m=CANAL_META[c.id]||{cor:T.ink3,lbl:c.nome||c.id,desc:'Canal de rastreio',mktp:false}
    return (
      <GlowCard cor={c.ativo?m.cor:undefined}>
        <div style={{ padding:'14px 16px',display:'flex',alignItems:'center',gap:12 }}>
          <div style={{ flexShrink:0 }}>
            <PulsingDot cor={c.ativo?m.cor:T.ink4} size={9}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
              <span style={{ fontSize:13.5,fontWeight:700,color:T.ink1 }}>{m.lbl}</span>
              {m.mktp&&<Chip label="Marketplace" cor={T.ink3} xs/>}
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <span style={{ fontSize:11,color:T.ink4 }}>{m.desc}</span>
              {(c.naFila||0)>0&&<Chip label={`${c.naFila} na fila`} cor={T.amber}/>}
              {c.ultimoRastreio&&<span style={{ fontSize:10,color:T.ink4 }}>
                Último: {tempoRel(c.ultimoRastreio)||'—'}
              </span>}
            </div>
          </div>
          <PremiumToggle value={c.ativo}
            onChange={v=>setCanais(cs=>cs.map(x=>x.id===c.id?{...x,ativo:v}:x))}
            cor={m.cor}/>
        </div>
      </GlowCard>
    )
  }

  if(loading) return <div style={{ textAlign:'center',padding:32,color:T.ink4 }}>Carregando...</div>

  return (
    <div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20 }}>
        {[{l:'Canais ativos',v:ativos,cor:T.green},{l:'Na fila',v:totalFila,cor:totalFila>0?T.amber:T.ink3},
          {l:'Transportadoras',v:stats?.transportadoras?.length||0,cor:T.cyan}].map(s=>(
          <GlowCard key={s.l} cor={s.cor}>
            <div style={{ padding:'14px 16px' }}>
              <div style={{ fontSize:26,fontWeight:800,color:s.cor,
                textShadow:`0 0 18px ${s.cor}35` }}>{s.v}</div>
              <div style={{ fontSize:10.5,color:T.ink4,marginTop:3 }}>{s.l}</div>
            </div>
          </GlowCard>
        ))}
      </div>

      {proprios.length>0&&(<>
        <div style={{ fontSize:10,fontWeight:700,color:T.ink4,textTransform:'uppercase',
          letterSpacing:'.09em',marginBottom:8 }}>Canais Próprios</div>
        <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:16 }}>
          {proprios.map(c=><CanalCard key={c.id} c={c}/>)}
        </div>
      </>)}

      {mktps.length>0&&(<>
        <div style={{ fontSize:10,fontWeight:700,color:T.ink4,textTransform:'uppercase',
          letterSpacing:'.09em',marginBottom:6 }}>Marketplaces</div>
        <div style={{ fontSize:11.5,color:T.ink4,marginBottom:10,lineHeight:1.6 }}>
          Marketplaces têm rastreio próprio. Ative se quiser acompanhar via Bia também.
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:16 }}>
          {mktps.map(c=><CanalCard key={c.id} c={c}/>)}
        </div>
      </>)}

      <button onClick={salvar} disabled={salvando} style={{
        display:'flex',alignItems:'center',gap:8,padding:'10px 22px',borderRadius:11,
        border:'none',cursor:'pointer',fontSize:13,fontWeight:700,
        background:`linear-gradient(135deg,${T.green},${T.green}cc)`,color:'#000',
        boxShadow:`0 4px 18px ${T.green}35`,opacity:salvando?.6:1 }}>
        {ok?<><Check size={14}/>Salvo!</>:<><Save size={14}/>Salvar canais</>}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 5. ATENDIMENTO & SLA — NIVELMAX
// ═══════════════════════════════════════════════════
function SecaoSLA({ api }) {
  const [sla,setSla]=useState({
    horario_inicio:8,horario_fim:22,dias:[1,2,3,4,5,6],
    sla_primeira_resposta_min:5,sla_resolucao_h:24,
    sla_vip_min:2,sla_vip_resolucao_h:4,
    limiar_vip_reais:500,
    escalacao_sem_resposta_min:15,
    escalacao_reclamacoes_n:3,
    auto_close_horas:72,
    bot_handoff_min:3,
    fora_horario_msg:'Olá! Nosso atendimento funciona das 8h às 22h. Em breve retornaremos!',
    aguardando_humano_msg:'Já recebi sua mensagem e vou transferir para um atendente. Aguarde um momento.',
    sla_breach_msg:'Pedimos desculpas pela demora. Nossa equipe está te atendendo agora.',
  })
  const [tab,setTab]=useState('horario')
  const [salvando,setSalvando]=useState(false)
  const [ok,setOk]=useState(false)

  useEffect(()=>{
    fetch(`${api}/api/dashboard/config/sla`).then(r=>r.json())
      .then(d=>{ if(d.sla) setSla(prev=>({...prev,...d.sla})) }).catch(()=>{})
  },[api])

  const salvar=async()=>{
    setSalvando(true)
    await fetch(`${api}/api/dashboard/config/sla`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({sla})}).catch(()=>{})
    setOk(true);setTimeout(()=>setOk(false),2500);setSalvando(false)
  }

  const TABS=[
    {id:'horario',lbl:'Horário',icon:Clock},
    {id:'tiers',lbl:'Tiers de SLA',icon:Shield},
    {id:'escalacao',lbl:'Escalonamento',icon:Bell},
    {id:'msgs',lbl:'Mensagens',icon:MessageSquare},
  ]

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:'flex',gap:4,marginBottom:20,
        background:T.bg2,borderRadius:12,padding:4,border:`1px solid ${T.sep}` }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              padding:'8px',borderRadius:9,border:'none',cursor:'pointer',
              fontSize:11.5,fontWeight:tab===t.id?700:500,
              background:tab===t.id?T.bg3:'transparent',
              color:tab===t.id?T.cyan:T.ink4,
              boxShadow:tab===t.id?`0 2px 12px rgba(0,0,0,.3)`:undefined,
              transition:'all .15s' }}>
            <t.icon size={12}/> {t.lbl}
          </button>
        ))}
      </div>

      {/* TAB: Horário */}
      {tab==='horario'&&(
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <GlowCard cor={T.cyan}>
            <div style={{ padding:'18px 20px' }}>
              <div style={{ fontSize:13,fontWeight:700,color:T.ink1,marginBottom:16,
                display:'flex',alignItems:'center',gap:8 }}>
                <Clock size={14} style={{ color:T.cyan }}/> Horário de funcionamento
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16 }}>
                {[{l:'Abertura',k:'horario_inicio',r:Array.from({length:13},(_,i)=>i+5)},
                  {l:'Fechamento',k:'horario_fim',r:[...Array.from({length:7},(_,i)=>i+18),24]}].map(f=>(
                  <div key={f.k}>
                    <div style={{ fontSize:9.5,fontWeight:700,color:T.ink4,textTransform:'uppercase',
                      letterSpacing:'.08em',marginBottom:8 }}>{f.l}</div>
                    <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
                      {f.r.map(h=>(
                        <button key={h} onClick={()=>setSla(s=>({...s,[f.k]:h}))}
                          style={{ width:38,height:28,borderRadius:7,border:'none',cursor:'pointer',
                            fontSize:10,fontWeight:700,transition:'all .13s',
                            background:sla[f.k]===h?T.cyan:T.bg4,
                            color:sla[f.k]===h?'#000':T.ink4,
                            boxShadow:sla[f.k]===h?`0 0 10px ${T.cyan}50`:undefined }}>
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize:9.5,fontWeight:700,color:T.ink4,textTransform:'uppercase',
                  letterSpacing:'.08em',marginBottom:8 }}>Dias de atendimento</div>
                <div style={{ display:'flex',gap:5 }}>
                  {DIAS.map((d,i)=>{
                    const a=sla.dias?.includes(i)
                    return <button key={i} onClick={()=>setSla(s=>({...s,
                      dias:a?s.dias.filter(x=>x!==i):[...(s.dias||[]),i].sort()}))}
                      style={{ width:40,height:34,borderRadius:9,border:'none',cursor:'pointer',
                        fontSize:10.5,fontWeight:700,transition:'all .14s',
                        background:a?T.cyan:T.bg4,color:a?'#000':T.ink4,
                        boxShadow:a?`0 0 10px ${T.cyan}50`:undefined }}>{d}</button>
                  })}
                </div>
              </div>
              {/* Preview */}
              <div style={{ marginTop:14,padding:'10px 14px',borderRadius:10,
                background:T.bg4,border:`1px solid ${T.sep}` }}>
                <div style={{ fontSize:11,color:T.cyan,fontWeight:600 }}>
                  📅 {sla.dias?.filter(d=>d>0&&d<7).length||0} dias úteis ·
                  {' '}{sla.horario_inicio}h–{sla.horario_fim}h ·
                  {' '}~{((sla.horario_fim-sla.horario_inicio)*(sla.dias?.filter(d=>d>0&&d<7).length||5))}h/sem
                </div>
              </div>
            </div>
          </GlowCard>
        </div>
      )}

      {/* TAB: Tiers */}
      {tab==='tiers'&&(
        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
          {/* Standard */}
          <GlowCard cor={T.blue}>
            <div style={{ padding:'18px 20px' }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
                <Chip label="STANDARD" cor={T.blue}/>
                <span style={{ fontSize:13,fontWeight:700,color:T.ink1 }}>Clientes padrão</span>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {[{l:'1ª resposta (min)',k:'sla_primeira_resposta_min',max:60},
                  {l:'Resolução (horas)',k:'sla_resolucao_h',max:168}].map(f=>(
                  <div key={f.k}>
                    <div style={{ fontSize:9.5,color:T.ink4,textTransform:'uppercase',
                      letterSpacing:'.07em',marginBottom:6,fontWeight:700 }}>{f.l}</div>
                    <PInput type="number" value={sla[f.k]} min={1} max={f.max}
                      onChange={e=>setSla(s=>({...s,[f.k]:parseInt(e.target.value)||0}))}/>
                  </div>
                ))}
              </div>
            </div>
          </GlowCard>

          {/* VIP */}
          <GlowCard cor={T.amber}>
            <div style={{ padding:'18px 20px' }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
                <Chip label="VIP 🔥" cor={T.amber}/>
                <span style={{ fontSize:13,fontWeight:700,color:T.ink1 }}>
                  Clientes com compra acima de
                </span>
                <PInput type="number" value={sla.limiar_vip_reais} small
                  onChange={e=>setSla(s=>({...s,limiar_vip_reais:parseInt(e.target.value)||0}))}
                  style={{ width:80 }}/>
                <span style={{ fontSize:13,color:T.ink3 }}>reais</span>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {[{l:'1ª resposta VIP (min)',k:'sla_vip_min',max:30},
                  {l:'Resolução VIP (horas)',k:'sla_vip_resolucao_h',max:48}].map(f=>(
                  <div key={f.k}>
                    <div style={{ fontSize:9.5,color:T.ink4,textTransform:'uppercase',
                      letterSpacing:'.07em',marginBottom:6,fontWeight:700 }}>{f.l}</div>
                    <PInput type="number" value={sla[f.k]} min={1} max={f.max}
                      onChange={e=>setSla(s=>({...s,[f.k]:parseInt(e.target.value)||0}))}/>
                  </div>
                ))}
              </div>
            </div>
          </GlowCard>
        </div>
      )}

      {/* TAB: Escalonamento */}
      {tab==='escalacao'&&(
        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
          <GlowCard cor={T.red}>
            <div style={{ padding:'18px 20px' }}>
              <div style={{ fontSize:13,fontWeight:700,color:T.ink1,marginBottom:16,
                display:'flex',alignItems:'center',gap:8 }}>
                <AlertTriangle size={14} style={{ color:T.red }}/> Regras de escalonamento
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                {[{l:'Transferir para humano após',k:'escalacao_sem_resposta_min',unit:'min sem resposta',max:120},
                  {l:'Marcar como VIP após',k:'escalacao_reclamacoes_n',unit:'reclamações',max:10},
                  {l:'Bot handoff após',k:'bot_handoff_min',unit:'min de espera',max:30},
                  {l:'Fechar ticket inativo após',k:'auto_close_horas',unit:'horas',max:168},
                ].map(f=>(
                  <div key={f.k} style={{ display:'flex',alignItems:'center',gap:12,
                    padding:'10px 14px',borderRadius:10,background:T.bg4,border:`1px solid ${T.sep}` }}>
                    <ArrowRight size={12} style={{ color:T.red,flexShrink:0 }}/>
                    <span style={{ flex:1,fontSize:12.5,color:T.ink2 }}>{f.l}</span>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <input type="number" value={sla[f.k]} min={1} max={f.max}
                        onChange={e=>setSla(s=>({...s,[f.k]:parseInt(e.target.value)||0}))}
                        style={{ width:64,padding:'5px 8px',borderRadius:8,background:T.bg2,
                          border:`1px solid ${T.sep2}`,color:T.ink1,fontSize:13,fontWeight:700,
                          outline:'none',textAlign:'center' }}/>
                      <span style={{ fontSize:11,color:T.ink4,whiteSpace:'nowrap' }}>{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlowCard>
        </div>
      )}

      {/* TAB: Mensagens automáticas */}
      {tab==='msgs'&&(
        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
          {[
            {k:'fora_horario_msg',lbl:'Fora do horário',cor:T.amber,icon:Moon,
              desc:'Enviada quando o cliente contata fora do horário de atendimento'},
            {k:'aguardando_humano_msg',lbl:'Aguardando humano',cor:T.cyan,icon:Users,
              desc:'Enviada quando o cliente está na fila para atendimento humano'},
            {k:'sla_breach_msg',lbl:'SLA em risco',cor:T.red,icon:AlertTriangle,
              desc:'Enviada quando o tempo de resposta excede o SLA configurado'},
          ].map(f=>(
            <GlowCard key={f.k} cor={f.cor}>
              <div style={{ padding:'16px 18px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
                  <f.icon size={14} style={{ color:f.cor }}/>
                  <span style={{ fontSize:13,fontWeight:700,color:T.ink1 }}>{f.lbl}</span>
                </div>
                <div style={{ fontSize:11,color:T.ink4,marginBottom:10 }}>{f.desc}</div>
                <PInput rows={2} value={sla[f.k]}
                  onChange={e=>setSla(s=>({...s,[f.k]:e.target.value}))}
                  placeholder={`Mensagem de ${f.lbl.toLowerCase()}...`}/>
              </div>
            </GlowCard>
          ))}
        </div>
      )}

      <button onClick={salvar} disabled={salvando} style={{
        display:'flex',alignItems:'center',gap:8,marginTop:16,
        padding:'10px 22px',borderRadius:11,border:'none',cursor:'pointer',
        fontSize:13,fontWeight:700,
        background:`linear-gradient(135deg,${T.cyan},${T.cyan}cc)`,color:'#000',
        boxShadow:`0 4px 18px ${T.cyan}35`,opacity:salvando?.6:1 }}>
        {ok?<><Check size={14}/>Salvo!</>:<><Save size={14}/>Salvar SLA</>}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 6. GESTÃO DE CONTATOS (substituiu Blacklist simples)
// ═══════════════════════════════════════════════════
function SecaoContatos({ api }) {
  const [contatos,setContatos]=useState([])
  const [loading,setLoading]=useState(true)
  const [busca,setBusca]=useState('')
  const [filtro,setFiltro]=useState('todos')
  const [phones,setPhones]=useState([])
  const [keywords,setKeywords]=useState([])
  const [novoTel,setNovoTel]=useState('')
  const [novaKw,setNovaKw]=useState('')
  const [salvandoBl,setSalvandoBl]=useState(false)
  const [okBl,setOkBl]=useState(false)
  const [aba,setAba]=useState('contatos')

  useEffect(()=>{
    Promise.all([
      fetch(`${api}/api/dashboard/contatos`).then(r=>r.ok?r.json():{contatos:[]}).catch(()=>({contatos:[]})),
      fetch(`${api}/api/dashboard/config/blacklist`).then(r=>r.ok?r.json():{phones:[],keywords:[]}).catch(()=>({phones:[],keywords:[]})),
    ]).then(([c,bl])=>{
      setContatos(c.contatos||[])
      setPhones(bl.phones||[])
      setKeywords(bl.keywords||[])
      setLoading(false)
    })
  },[api])

  const toggleBlacklist=async(tel,in_list)=>{
    const next=in_list?phones.filter(p=>p!==tel):[...phones,tel]
    setPhones(next)
    await fetch(`${api}/api/dashboard/config/blacklist`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({phones:next})}).catch(()=>{})
  }

  const patchContato=async(tel,patch)=>{
    setContatos(cs=>cs.map(c=>c.telefone===tel?{...c,...patch}:c))
    await fetch(`${api}/api/contatos/${tel}`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)}).catch(()=>{})
  }

  const salvarBl=async()=>{
    setSalvandoBl(true)
    await fetch(`${api}/api/dashboard/config/blacklist`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({phones,keywords})}).catch(()=>{})
    setOkBl(true);setTimeout(()=>setOkBl(false),2000);setSalvandoBl(false)
  }

  const filtrados=contatos.filter(c=>{
    const ql=(c.nome||c.telefone||'').toLowerCase()
    if(busca&&!ql.includes(busca.toLowerCase())&&!c.telefone?.includes(busca)) return false
    if(filtro==='blacklist') return phones.includes(c.telefone)
    if(filtro==='manual') return c.modo==='manual'
    if(filtro==='ia') return c.modo!=='manual'
    return true
  })

  const pal=[T.purple,T.green,T.amber,T.cyan,T.blue,T.orange]
  const avatarCor=(nome)=>pal[(nome||'?').charCodeAt(0)%pal.length]

  const TABS_C=[{id:'contatos',lbl:'Contatos'},{id:'blacklist',lbl:'Blacklist'}]

  return (
    <div>
      {/* Mini tabs */}
      <div style={{ display:'flex',gap:4,marginBottom:16,
        background:T.bg2,borderRadius:10,padding:3,border:`1px solid ${T.sep}` }}>
        {TABS_C.map(t=>(
          <button key={t.id} onClick={()=>setAba(t.id)}
            style={{ flex:1,padding:'7px',borderRadius:8,border:'none',cursor:'pointer',
              fontSize:12,fontWeight:aba===t.id?700:500,
              background:aba===t.id?T.bg3:'transparent',
              color:aba===t.id?T.red:T.ink4,transition:'all .15s' }}>
            {t.lbl}
          </button>
        ))}
      </div>

      {/* ABA: Contatos */}
      {aba==='contatos'&&(
        <>
          {/* Filtros */}
          <div style={{ display:'flex',gap:8,marginBottom:14 }}>
            <div style={{ position:'relative',flex:1 }}>
              <Search size={12} style={{ position:'absolute',left:10,top:'50%',
                transform:'translateY(-50%)',color:T.ink4,pointerEvents:'none' }}/>
              <input value={busca} onChange={e=>setBusca(e.target.value)}
                placeholder="Buscar por nome ou telefone..."
                style={{ width:'100%',padding:'8px 10px 8px 32px',borderRadius:9,background:T.bg2,
                  border:`1px solid ${T.sep2}`,color:T.ink1,fontSize:12.5,outline:'none',
                  fontFamily:'inherit',boxSizing:'border-box' }}/>
            </div>
            {['todos','ia','manual','blacklist'].map(f=>(
              <button key={f} onClick={()=>setFiltro(f)}
                style={{ padding:'7px 12px',borderRadius:9,border:`1px solid ${filtro===f?T.red+'40':T.sep}`,
                  background:filtro===f?T.redDim:'transparent',
                  color:filtro===f?T.red:T.ink4,cursor:'pointer',fontSize:11,
                  fontWeight:filtro===f?700:400,transition:'all .14s',whiteSpace:'nowrap' }}>
                {f==='todos'?'Todos':f==='ia'?'IA':f==='manual'?'Humano':'🚫 Blacklist'}
              </button>
            ))}
          </div>

          {loading?<div style={{ textAlign:'center',padding:32,color:T.ink4 }}>Carregando contatos...</div>
            :filtrados.length===0?<div style={{ textAlign:'center',padding:32,color:T.ink4 }}>
                <Users size={24} style={{ display:'block',margin:'0 auto 8px',opacity:.15 }}/>
                <p style={{ margin:0,fontSize:12 }}>Nenhum contato encontrado</p>
              </div>
            :(
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {filtrados.slice(0,30).map(c=>{
                  const isBlocked=phones.includes(c.telefone)
                  const isManual=c.modo==='manual'
                  const cor=avatarCor(c.nome||c.telefone)
                  const init=(c.nome||c.telefone||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
                  return (
                    <GlowCard key={c.telefone} cor={isBlocked?T.red:isManual?T.blue:undefined}>
                      <div style={{ padding:'13px 16px' }}>
                        <div style={{ display:'flex',alignItems:'flex-start',gap:13 }}>
                          {/* Avatar */}
                          <div style={{ width:40,height:40,borderRadius:'50%',flexShrink:0,
                            background:`${cor}20`,border:`2px solid ${cor}40`,
                            display:'flex',alignItems:'center',justifyContent:'center',
                            fontSize:13,fontWeight:800,color:cor }}>
                            {init}
                          </div>

                          {/* Info */}
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:4 }}>
                              <span style={{ fontSize:13.5,fontWeight:700,color:T.ink1,
                                textDecoration:isBlocked?'line-through':undefined,
                                opacity:isBlocked?.6:1 }}>
                                {c.nome||'Sem nome'}
                              </span>
                              {isBlocked&&<Chip label="BLOQUEADO" cor={T.red} icon={PhoneOff} xs/>}
                              {isManual&&!isBlocked&&<Chip label="HUMANO" cor={T.blue} icon={UserCheck} xs/>}
                              {!isManual&&!isBlocked&&<Chip label="IA" cor={T.green} icon={Bot} xs/>}
                            </div>
                            <div style={{ fontFamily:'monospace',fontSize:11,color:T.ink4,marginBottom:6 }}>
                              {c.telefone}
                            </div>
                            <div style={{ display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
                              {c.total_msgs>0&&(
                                <span style={{ fontSize:10.5,color:T.ink3,display:'flex',alignItems:'center',gap:3 }}>
                                  <MessageSquare size={10}/> {c.total_msgs} mensagens
                                </span>
                              )}
                              {c.ultima_msg&&(
                                <span style={{ fontSize:10.5,color:T.ink4 }}>
                                  Último: {tempoRel(c.ultima_msg)||'—'}
                                </span>
                              )}
                              {c.ltv>0&&(
                                <span style={{ fontSize:10.5,color:T.green,fontWeight:600 }}>
                                  LTV: R${parseFloat(c.ltv).toFixed(0)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Controles */}
                          <div style={{ display:'flex',flexDirection:'column',gap:10,flexShrink:0,alignItems:'flex-end' }}>
                            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                              <span style={{ fontSize:10,color:T.ink4 }}>Recebe notif.</span>
                              <PremiumToggle value={!isBlocked}
                                onChange={v=>toggleBlacklist(c.telefone,v)}
                                cor={T.green} size="sm"/>
                            </div>
                            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                              <span style={{ fontSize:10,color:T.ink4 }}>Modo IA</span>
                              <PremiumToggle value={!isManual}
                                onChange={v=>patchContato(c.telefone,{modo:v?'auto':'manual'})}
                                cor={T.purple} size="sm"/>
                            </div>
                          </div>
                        </div>
                      </div>
                    </GlowCard>
                  )
                })}
                {filtrados.length>30&&(
                  <div style={{ textAlign:'center',padding:'12px 0',fontSize:11.5,color:T.ink4 }}>
                    + {filtrados.length-30} contatos · use a busca para filtrar
                  </div>
                )}
              </div>
            )}
        </>
      )}

      {/* ABA: Blacklist */}
      {aba==='blacklist'&&(
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <GlowCard cor={T.red}>
            <div style={{ padding:'18px 20px' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <PhoneOff size={15} style={{ color:T.red }}/>
                  <span style={{ fontSize:14,fontWeight:700,color:T.ink1 }}>Números bloqueados</span>
                </div>
                <Chip label={`${phones.length}`} cor={T.red}/>
              </div>
              <div style={{ display:'flex',gap:8,marginBottom:12 }}>
                <PInput value={novoTel} onChange={e=>setNovoTel(e.target.value)}
                  placeholder="55119... (com DDI)" mono/>
                <button onClick={()=>{
                  const t=novoTel.replace(/\D/g,'')
                  if(t.length>=10&&!phones.includes(t)){setPhones(p=>[...p,t]);setNovoTel('')}
                }} style={{ padding:'9px 16px',borderRadius:10,border:'none',cursor:'pointer',
                  background:T.red,color:'#fff',fontWeight:700,flexShrink:0,
                  boxShadow:`0 3px 12px ${T.red}35` }}><Plus size={14}/></button>
              </div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                {phones.map(p=>(
                  <span key={p} style={{ display:'inline-flex',alignItems:'center',gap:5,
                    padding:'3px 10px',borderRadius:99,background:T.redDim,color:T.red,
                    border:`1px solid ${T.redBor}`,fontSize:11,fontFamily:'monospace',fontWeight:600 }}>
                    {p}
                    <button onClick={()=>setPhones(prev=>prev.filter(x=>x!==p))}
                      style={{ background:'none',border:'none',cursor:'pointer',color:T.red,padding:0,display:'flex' }}>
                      <X size={10}/>
                    </button>
                  </span>
                ))}
                {phones.length===0&&<span style={{ fontSize:11.5,color:T.ink4 }}>Nenhum número</span>}
              </div>
            </div>
          </GlowCard>
          <GlowCard cor={T.amber}>
            <div style={{ padding:'18px 20px' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <Bell size={15} style={{ color:T.amber }}/>
                  <span style={{ fontSize:14,fontWeight:700,color:T.ink1 }}>Palavras de opt-out</span>
                </div>
                <Chip label={`${keywords.length}`} cor={T.amber}/>
              </div>
              <div style={{ fontSize:11.5,color:T.ink4,marginBottom:12,lineHeight:1.6 }}>
                Se o cliente enviar estas palavras, os disparos pausam automaticamente.
              </div>
              <div style={{ display:'flex',gap:8,marginBottom:12 }}>
                <PInput value={novaKw} onChange={e=>setNovaKw(e.target.value)} placeholder="Ex: sair, parar"/>
                <button onClick={()=>{
                  const k=novaKw.trim().toLowerCase()
                  if(k&&!keywords.includes(k)){setKeywords(p=>[...p,k]);setNovaKw('')}
                }} style={{ padding:'9px 16px',borderRadius:10,border:'none',cursor:'pointer',
                  background:T.amber,color:'#000',fontWeight:700,flexShrink:0 }}><Plus size={14}/></button>
              </div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                {keywords.map(k=>(
                  <span key={k} style={{ display:'inline-flex',alignItems:'center',gap:5,
                    padding:'3px 10px',borderRadius:99,background:T.amberDim,color:T.amber,
                    border:`1px solid ${T.amberBor}`,fontSize:11,fontWeight:600 }}>
                    {k}
                    <button onClick={()=>setKeywords(prev=>prev.filter(x=>x!==k))}
                      style={{ background:'none',border:'none',cursor:'pointer',color:T.amber,padding:0,display:'flex' }}>
                      <X size={10}/>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </GlowCard>
          <button onClick={salvarBl} disabled={salvandoBl} style={{
            display:'flex',alignItems:'center',gap:8,alignSelf:'flex-start',
            padding:'10px 22px',borderRadius:11,border:'none',cursor:'pointer',
            fontSize:13,fontWeight:700,
            background:`linear-gradient(135deg,${T.red},${T.red}cc)`,color:'#fff',
            boxShadow:`0 4px 18px ${T.red}35`,opacity:salvandoBl?.6:1 }}>
            {okBl?<><Check size={14}/>Salvo!</>:<><Save size={14}/>Salvar</>}
          </button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 7. AUDITORIA NIVELMAX — timeline com diff
// ═══════════════════════════════════════════════════
function SecaoAuditoria({ api }) {
  const [audit,setAudit]=useState(null)
  const [loading,setLoading]=useState(true)
  const [expandido,setExpandido]=useState(null)
  const [filtro,setFiltro]=useState('todos')

  useEffect(()=>{
    fetch(`${api}/api/dashboard/config/audit`).then(r=>r.json())
      .then(d=>{ setAudit(d); setLoading(false) }).catch(()=>setLoading(false))
  },[api])

  if(loading) return <div style={{ textAlign:'center',padding:40,color:T.ink4 }}>
    <RefreshCw size={16} style={{ display:'block',margin:'0 auto 10px',
      animation:'cfg-spin 1s linear infinite',color:T.purple }}/>Carregando auditoria...
  </div>

  const tplChanges=(audit?.template_changes||[]).map(t=>({
    tipo:'template',subtipo:t.ativo?'ativado':'desativado',
    label:t.nome||t.gatilho,desc:t.gatilho,
    cor:t.ativo?T.green:T.red,
    icon:t.ativo?CheckCircle:XCircle,
    ts:t.atualizado_em,
    antes:t.ativo?'inativo':'ativo',
    depois:t.ativo?'ativo':'inativo',
  }))

  const cfgChanges=(audit?.config_changes||[]).map(c=>({
    tipo:'config',subtipo:'alteração',
    label:c.chave,desc:'Configuração atualizada',
    cor:T.purple,icon:Settings2,
    ts:c.dados?.ts||null,
    antes:c.dados?.antes||'—',
    depois:JSON.stringify(c.dados?.schedule||c.dados||'').slice(0,60),
  }))

  const all=[...tplChanges,...cfgChanges]
    .sort((a,b)=>new Date(b.ts)-new Date(a.ts))
    .filter(item=>filtro==='todos'||item.tipo===filtro||item.subtipo===filtro)

  const TIPO_ICONES={
    ativado:CheckCircle,desativado:XCircle,alteração:Settings2,
  }

  return (
    <div>
      {/* Filtros */}
      <div style={{ display:'flex',gap:6,marginBottom:16,flexWrap:'wrap' }}>
        {[
          {id:'todos',lbl:'Todos',cor:T.ink3},
          {id:'template',lbl:'Templates',cor:T.amber},
          {id:'config',lbl:'Configurações',cor:T.purple},
          {id:'ativado',lbl:'Ativações',cor:T.green},
          {id:'desativado',lbl:'Desativações',cor:T.red},
        ].map(f=>(
          <button key={f.id} onClick={()=>setFiltro(f.id)}
            style={{ padding:'5px 12px',borderRadius:99,border:`1px solid ${filtro===f.id?f.cor+'50':T.sep}`,
              background:filtro===f.id?`${f.cor}15`:'transparent',
              color:filtro===f.id?f.cor:T.ink4,cursor:'pointer',fontSize:11,fontWeight:600,
              transition:'all .14s' }}>
            {f.lbl}
          </button>
        ))}
        <div style={{ marginLeft:'auto',fontSize:11,color:T.ink4,display:'flex',alignItems:'center' }}>
          {all.length} registros
        </div>
      </div>

      {all.length===0?(
        <div style={{ textAlign:'center',padding:'48px 0',color:T.ink4 }}>
          <History size={28} style={{ opacity:.15,display:'block',margin:'0 auto 12px' }}/>
          <p style={{ fontSize:13,margin:0 }}>Nenhuma alteração encontrada</p>
        </div>
      ):(
        <div style={{ position:'relative' }}>
          {/* Linha da timeline */}
          <div style={{ position:'absolute',left:17,top:8,bottom:8,width:2,
            background:`linear-gradient(180deg,${T.purple}50,transparent)` }}/>

          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {all.map((item,i)=>{
              const Ic=TIPO_ICONES[item.subtipo]||Settings2
              const isOpen=expandido===i
              return (
                <div key={i} style={{ display:'flex',gap:12 }}>
                  {/* Node da timeline */}
                  <div style={{ width:36,height:36,borderRadius:'50%',flexShrink:0,
                    background:`${item.cor}18`,border:`2px solid ${item.cor}40`,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    boxShadow:`0 0 12px ${item.cor}30`,zIndex:1 }}>
                    <Ic size={14} style={{ color:item.cor }}/>
                  </div>

                  {/* Card do evento */}
                  <GlowCard cor={item.cor} style={{ flex:1 }}>
                    <div style={{ padding:'12px 14px',cursor:'pointer' }}
                      onClick={()=>setExpandido(isOpen?null:i)}>
                      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                        <span style={{ fontSize:13,fontWeight:700,color:T.ink1 }}>{item.label}</span>
                        <Chip label={item.subtipo} cor={item.cor} xs/>
                      </div>
                      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                        <span style={{ fontSize:10.5,color:T.ink4 }}>{item.desc}</span>
                        <span style={{ marginLeft:'auto',fontSize:10.5,color:T.ink4,flexShrink:0 }}>
                          {item.ts?tempoRel(item.ts)||new Date(item.ts).toLocaleString('pt-BR'):'—'}
                        </span>
                        <ChevronDown size={12} style={{ color:T.ink4,flexShrink:0,
                          transform:isOpen?'rotate(180deg)':'rotate(0)',transition:'transform .2s' }}/>
                      </div>
                    </div>

                    {/* Diff expandido */}
                    {isOpen&&(
                      <div style={{ borderTop:`1px solid ${item.cor}20`,
                        padding:'12px 14px',animation:'cfg-fadeIn .2s ease' }}>
                        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                          <div style={{ padding:'10px 12px',borderRadius:9,
                            background:T.redDim,border:`1px solid ${T.redBor}` }}>
                            <div style={{ fontSize:9,fontWeight:700,color:T.red,
                              textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6 }}>
                              ANTES
                            </div>
                            <div style={{ fontSize:12,color:T.ink2,fontFamily:'monospace',
                              wordBreak:'break-all' }}>
                              {item.antes||'—'}
                            </div>
                          </div>
                          <div style={{ padding:'10px 12px',borderRadius:9,
                            background:T.greenDim,border:`1px solid ${T.greenBor}` }}>
                            <div style={{ fontSize:9,fontWeight:700,color:T.green,
                              textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6 }}>
                              DEPOIS
                            </div>
                            <div style={{ fontSize:12,color:T.ink2,fontFamily:'monospace',
                              wordBreak:'break-all' }}>
                              {item.depois||'—'}
                            </div>
                          </div>
                        </div>
                        {item.ts&&(
                          <div style={{ marginTop:8,fontSize:10,color:T.ink4 }}>
                            {new Date(item.ts).toLocaleString('pt-BR',{
                              dateStyle:'full',timeStyle:'medium'})}
                          </div>
                        )}
                      </div>
                    )}
                  </GlowCard>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 8. EXPORTAÇÃO
// ═══════════════════════════════════════════════════
function SecaoExportacao({ api }) {
  const hoje=new Date().toISOString().split('T')[0]
  const [from,setFrom]=useState(new Date(Date.now()-30*86400000).toISOString().split('T')[0])
  const [to,setTo]=useState(hoje)
  const [fmt,setFmt]=useState('csv')
  const [gat,setGat]=useState('')
  const [baixando,setBaix]=useState(false)

  const exportar=async()=>{
    setBaix(true)
    const p=new URLSearchParams({from,to,formato:fmt})
    if(gat) p.set('gatilho',gat)
    try {
      const r=await fetch(`${api}/api/dashboard/config/export?${p}`)
      const blob=await r.blob()
      const url=URL.createObjectURL(blob)
      const a=document.createElement('a')
      a.href=url;a.download=`disparos_${from}_${to}.${fmt}`;a.click()
      URL.revokeObjectURL(url)
    } catch {}
    setBaix(false)
  }

  return (
    <GlowCard cor={T.blue}>
      <div style={{ padding:'20px' }}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16 }}>
          {[{l:'De',v:from,s:setFrom},{l:'Até',v:to,s:setTo}].map(f=>(
            <div key={f.l}>
              <div style={{ fontSize:10,color:T.ink4,marginBottom:6,textTransform:'uppercase',
                letterSpacing:'.07em',fontWeight:700 }}>{f.l}</div>
              <PInput type="date" value={f.v} onChange={e=>f.s(e.target.value)}/>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10,color:T.ink4,marginBottom:6,textTransform:'uppercase',
            letterSpacing:'.07em',fontWeight:700 }}>Gatilho (opcional)</div>
          <select value={gat} onChange={e=>setGat(e.target.value)}
            style={{ width:'100%',padding:'9px 13px',borderRadius:10,background:T.bg1,
              border:`1px solid ${T.sep2}`,color:T.ink1,fontSize:13,outline:'none',fontFamily:'inherit' }}>
            <option value="">Todos os gatilhos</option>
            {GATILHOS_DEF.map(g=><option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:10,color:T.ink4,marginBottom:8,textTransform:'uppercase',
            letterSpacing:'.07em',fontWeight:700 }}>Formato</div>
          <div style={{ display:'flex',gap:8 }}>
            {['csv','json'].map(f=>(
              <button key={f} onClick={()=>setFmt(f)}
                style={{ padding:'8px 24px',borderRadius:9,border:'none',cursor:'pointer',
                  fontSize:12.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',
                  transition:'all .15s',background:fmt===f?T.blue:T.bg4,
                  color:fmt===f?'#fff':T.ink4,boxShadow:fmt===f?`0 4px 14px ${T.blue}35`:undefined }}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <button onClick={exportar} disabled={baixando} style={{
          display:'flex',alignItems:'center',gap:8,padding:'10px 22px',borderRadius:11,
          border:'none',cursor:'pointer',fontSize:13,fontWeight:700,
          background:`linear-gradient(135deg,${T.blue},${T.blue}cc)`,color:'#fff',
          boxShadow:`0 4px 18px ${T.blue}35`,opacity:baixando?.6:1 }}>
          {baixando?<><RefreshCw size={13} style={{ animation:'cfg-spin 1s linear infinite' }}/>Baixando...</>
            :<><FileDown size={13}/>Exportar {fmt.toUpperCase()}</>}
        </button>
      </div>
    </GlowCard>
  )
}

// ═══════════════════════════════════════════════════
// NAVEGAÇÃO LATERAL
// ═══════════════════════════════════════════════════
// ═══ Seção: Variáveis Estáticas Customizadas ══════════════════════════════════
// Variáveis de texto fixo salvas em ia_config.
// São substituídas automaticamente em qualquer mensagem antes do envio.
// Exemplos: {{instagram_loja}}, {{link_whatsapp}}, {{horario_atendimento}}

// ═══════════════════════════════════════════════════
// SEÇÃO: RESPOSTAS RÁPIDAS
// ═══════════════════════════════════════════════════
function SecaoRespostasRapidas({ api }) {
  const [lista,   setLista]   = useState([])
  const [novoTxt, setNovoTxt] = useState('')
  const [editIdx, setEditIdx] = useState(null)  // índice sendo editado
  const [editTxt, setEditTxt] = useState('')
  const [salvando,setSalv]    = useState(false)
  const [toast,   setToast]   = useState(null)

  const DEFAULTS = [
    'Olá! Como posso ajudar? 😊',
    'Vou verificar isso agora para você.',
    'Pode me informar o número do seu pedido?',
    'O prazo de entrega é de 3 a 7 dias úteis.',
    'Pagando via PIX você tem 10% de desconto automático! 💰',
    'Vou transferir para nossa equipe. Um momento!',
    'Pedido confirmado! Você receberá atualizações por aqui.',
  ]

  useEffect(() => {
    fetch(`${api}/api/ia/config`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.respostas_rapidas) {
          try { setLista(JSON.parse(d.respostas_rapidas)) } catch { setLista(DEFAULTS) }
        } else {
          setLista(DEFAULTS)
        }
      }).catch(() => setLista(DEFAULTS))
  }, [api])

  const salvar = async (novaLista) => {
    setSalv(true)
    await fetch(`${api}/api/ia/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chave: 'respostas_rapidas', valor: JSON.stringify(novaLista) })
    }).catch(() => {})
    setSalv(false)
    setToast('Salvo!')
    setTimeout(() => setToast(null), 2000)
  }

  const adicionar = () => {
    if (!novoTxt.trim()) return
    const nova = [...lista, novoTxt.trim()]
    setLista(nova); setNovoTxt(''); salvar(nova)
  }

  const remover = (idx) => {
    const nova = lista.filter((_,i) => i !== idx)
    setLista(nova); salvar(nova)
  }

  const salvarEdicao = () => {
    if (editIdx === null || !editTxt.trim()) return
    const nova = lista.map((t,i) => i === editIdx ? editTxt.trim() : t)
    setLista(nova); setEditIdx(null); setEditTxt(''); salvar(nova)
  }

  const mover = (idx, dir) => {
    const nova = [...lista]
    const t = idx + dir
    if (t < 0 || t >= nova.length) return
    ;[nova[idx], nova[t]] = [nova[t], nova[idx]]
    setLista(nova); salvar(nova)
  }

  const cS = { // cardStyle
    padding: '12px 14px', borderRadius: 10, background: T.bg3,
    border: `1px solid ${T.sep2}`, marginBottom: 8,
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.ink1, margin: '0 0 6px' }}>
          Respostas Rápidas
        </h2>
        <p style={{ fontSize: 12, color: T.ink4, margin: 0, lineHeight: 1.6 }}>
          Textos pré-definidos que aparecem no botão ⚡ dentro do chat.
          O operador clica uma vez e a mensagem é inserida no campo de texto.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          padding: '10px 18px', borderRadius: 10, background: T.greenDim,
          border: `1px solid ${T.greenBor}`, color: T.green, fontSize: 12, fontWeight: 700 }}>
          ✅ {toast}
        </div>
      )}

      {/* Lista de respostas */}
      {lista.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: T.ink4 }}>
          <Zap size={20} style={{ opacity: .12, display: 'block', margin: '0 auto 10px' }}/>
          <p style={{ fontSize: 12, margin: 0 }}>Nenhuma resposta rápida. Adicione abaixo.</p>
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          {lista.map((txt, i) => (
            <div key={i} style={cS}>
              {editIdx === i ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea value={editTxt} onChange={e => setEditTxt(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, resize: 'vertical',
                      background: T.bg4, border: `1px solid ${T.purpleBor}`,
                      color: T.ink1, fontSize: 13, fontFamily: 'inherit', outline: 'none',
                      boxSizing: 'border-box' }}/>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={salvarEdicao}
                      style={{ padding: '6px 14px', borderRadius: 7, border: `1px solid ${T.greenBor}`,
                        background: T.greenDim, color: T.green, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                      ✅ Salvar
                    </button>
                    <button onClick={() => { setEditIdx(null); setEditTxt('') }}
                      style={{ padding: '6px 14px', borderRadius: 7, border: `1px solid ${T.sep2}`,
                        background: 'transparent', color: T.ink4, cursor: 'pointer', fontSize: 11 }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {/* Número */}
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.ink4,
                    minWidth: 20, marginTop: 2 }}>{i + 1}</span>
                  {/* Texto */}
                  <span style={{ flex: 1, fontSize: 13, color: T.ink2, lineHeight: 1.55 }}>{txt}</span>
                  {/* Ações */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => mover(i, -1)} disabled={i === 0}
                      style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${T.sep}`,
                        background: 'transparent', color: T.ink4, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: i === 0 ? .3 : 1 }}>
                      <ChevronUp size={11}/>
                    </button>
                    <button onClick={() => mover(i, 1)} disabled={i === lista.length - 1}
                      style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${T.sep}`,
                        background: 'transparent', color: T.ink4, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: i === lista.length - 1 ? .3 : 1 }}>
                      <ChevronDown size={11}/>
                    </button>
                    <button onClick={() => { setEditIdx(i); setEditTxt(txt) }}
                      style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${T.sep}`,
                        background: 'transparent', color: T.ink3, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit3 size={10}/>
                    </button>
                    <button onClick={() => remover(i)}
                      style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${T.redBor}`,
                        background: T.redDim, color: T.red, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={10}/>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Adicionar nova */}
      <div style={{ padding: '14px', borderRadius: 12, border: `1px dashed ${T.purpleBor}`,
        background: T.purpleDim }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.purple, marginBottom: 8,
          textTransform: 'uppercase', letterSpacing: '.05em' }}>
          + Nova resposta rápida
        </div>
        <textarea value={novoTxt} onChange={e => setNovoTxt(e.target.value)}
          placeholder="Digite a resposta... ex: Oi! Tudo bem? Como posso ajudar hoje? 😊"
          rows={3}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) adicionar() }}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, resize: 'vertical',
            background: T.bg4, border: `1px solid ${T.sep2}`,
            color: T.ink1, fontSize: 13, fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box', marginBottom: 8 }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: T.ink4 }}>Ctrl+Enter para adicionar rápido</span>
          <button onClick={adicionar} disabled={!novoTxt.trim() || salvando}
            style={{ padding: '7px 16px', borderRadius: 8,
              border: `1px solid ${T.purpleBor}`, background: T.purpleDim,
              color: T.purple, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              opacity: !novoTxt.trim() ? .5 : 1 }}>
            {salvando ? 'Salvando...' : '+ Adicionar'}
          </button>
        </div>
      </div>

      {/* Tip */}
      <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8,
        background: T.amberDim, border: `1px solid ${T.amberBor}` }}>
        <p style={{ fontSize: 11, color: T.amber, margin: 0, lineHeight: 1.6 }}>
          💡 As respostas aparecem no chat quando o operador clica no botão ⚡.
          Suporta emojis. A ordem aqui é a ordem que aparece no chat.
        </p>
      </div>
    </div>
  )
}

function SecaoVariaveis({ api }) {
  const [vars,    setVars]    = useState({})  // { "{{nome}}": "valor" }
  const [loading, setLoading] = useState(true)
  const [novaChave, setNovCh] = useState('')
  const [novaValor, setNovVl] = useState('')
  const [salvando,  setSalv]  = useState(null)
  const [editando,  setEdit]  = useState(null) // chave sendo editada
  const [editVal,   setEditV] = useState('')
  const [erro,      setErro]  = useState('')

  useEffect(() => {
    fetch(`${api}/api/ia/config`)
      .then(r => r.json())
      .then(d => {
        const cv = d['custom_vars']
        if (cv) { try { setVars(JSON.parse(cv)) } catch {} }
        setLoading(false)
      }).catch(() => setLoading(false))
  }, [api])

  const salvarTudo = async (novasVars) => {
    await fetch(`${api}/api/ia/config`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ chave:'custom_vars', valor:JSON.stringify(novasVars) })
    }).catch(() => {})
  }

  const adicionar = async () => {
    const chave = novaChave.trim()
    const valor = novaValor.trim()
    if (!chave || !valor) { setErro('Preencha o nome e o valor'); return }
    const fmtChave = chave.startsWith('{{') ? chave : `{{${chave.replace(/[{}]/g,'')}}}`
    if (vars[fmtChave]) { setErro('Variável já existe'); return }
    const novas = { ...vars, [fmtChave]: valor }
    setSalv('add')
    setVars(novas)
    await salvarTudo(novas)
    setNovCh(''); setNovVl(''); setErro(''); setSalv(null)
  }

  const remover = async (chave) => {
    const novas = {...vars}; delete novas[chave]
    setSalv(chave); setVars(novas)
    await salvarTudo(novas); setSalv(null)
  }

  const salvarEdicao = async (chave) => {
    const novas = {...vars, [chave]: editVal}
    setSalv(chave); setVars(novas)
    await salvarTudo(novas)
    setSalv(null); setEdit(null); setEditV('')
  }

  const entries = Object.entries(vars)

  return (
    <GlowCard cor={T.purple} style={{animation:'cfg-fadeIn .3s ease'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
        <Hash size={18} style={{color:T.purple}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:700,color:T.ink1}}>Variáveis Customizadas</div>
          <div style={{fontSize:11,color:T.ink4,marginTop:1}}>
            Texto estático substituído automaticamente em todas as mensagens da Bia
          </div>
        </div>
        <Chip label={`${entries.length} vars`} cor={T.purple} icon={Hash}/>
      </div>

      {/* Aviso sobre variáveis dinâmicas */}
      <div style={{padding:'10px 14px',borderRadius:9,background:'rgba(74,159,255,.06)',
        border:'0.5px solid rgba(74,159,255,.2)',marginBottom:16,marginTop:10}}>
        <p style={{fontSize:11,color:'#4a9fff',margin:0,lineHeight:1.6}}>
          <b>Variáveis estáticas</b> são textos fixos que a Bia substitui antes de enviar (ex: {'{{nome_loja}}'} → "Só Strass"). 
          Variáveis dinâmicas como {'{{codigo_rastreio}}'} e {'{{valor_total}}'} são calculadas pelo sistema e não podem ser criadas aqui.
        </p>
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:'20px 0',color:T.ink4,fontSize:12}}>Carregando…</div>
      ) : (
        <>
          {/* Tabela de variáveis */}
          {entries.length > 0 && (
            <div style={{borderRadius:10,border:`1px solid ${T.sep}`,overflow:'hidden',marginBottom:14}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',
                padding:'7px 14px',background:T.bg3,borderBottom:`1px solid ${T.sep}`,gap:8}}>
                <span style={{fontSize:10,fontWeight:700,color:T.ink4,textTransform:'uppercase',letterSpacing:'.05em'}}>Variável</span>
                <span style={{fontSize:10,fontWeight:700,color:T.ink4,textTransform:'uppercase',letterSpacing:'.05em'}}>Valor</span>
                <span/>
              </div>
              {entries.map(([ch, vl], i) => (
                <div key={ch} style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',
                  padding:'9px 14px',gap:8,alignItems:'center',
                  borderBottom: i < entries.length-1 ? `1px solid ${T.sep}` : 'none',
                  background:'transparent'}}>
                  <span style={{fontSize:11,color:T.cyan,fontFamily:'monospace',fontWeight:600}}>{ch}</span>
                  {editando === ch ? (
                    <input value={editVal} onChange={e=>setEditV(e.target.value)}
                      autoFocus
                      style={{fontSize:11,padding:'4px 8px',borderRadius:6,
                        border:`1px solid ${T.purpleBor}`,background:T.bg1,
                        color:T.ink1,outline:'none'}}
                      onKeyDown={e=>{if(e.key==='Enter')salvarEdicao(ch); if(e.key==='Escape'){setEdit(null);setEditV('')}}}
                    />
                  ) : (
                    <span style={{fontSize:11,color:T.ink2}}>{vl}</span>
                  )}
                  <div style={{display:'flex',gap:4}}>
                    {editando === ch ? (
                      <>
                        <button onClick={()=>salvarEdicao(ch)}
                          disabled={salvando===ch}
                          style={{padding:'3px 8px',borderRadius:6,border:'none',
                            background:T.greenDim,color:T.green,cursor:'pointer',fontSize:11,fontWeight:600}}>
                          {salvando===ch?'…':'✓'}
                        </button>
                        <button onClick={()=>{setEdit(null);setEditV('')}}
                          style={{padding:'3px 8px',borderRadius:6,border:`1px solid ${T.sep}`,
                            background:'transparent',color:T.ink4,cursor:'pointer',fontSize:11}}>
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={()=>{setEdit(ch);setEditV(vl)}}
                          style={{padding:'3px 8px',borderRadius:6,border:`1px solid ${T.sep}`,
                            background:'transparent',color:T.ink3,cursor:'pointer',fontSize:11}}>
                          Editar
                        </button>
                        <button onClick={()=>remover(ch)} disabled={salvando===ch}
                          style={{padding:'3px 8px',borderRadius:6,border:`1px solid ${T.redBor}`,
                            background:T.redDim,color:T.red,cursor:'pointer',fontSize:11}}>
                          {salvando===ch?'…':'−'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {entries.length === 0 && (
            <div style={{textAlign:'center',padding:'20px',color:T.ink4,fontSize:12,
              borderRadius:10,border:`1px dashed ${T.sep}`,marginBottom:14}}>
              Nenhuma variável customizada ainda. Adicione abaixo.
            </div>
          )}

          {/* Formulário de adição */}
          <div style={{borderRadius:10,border:`1px solid ${T.sep}`,padding:'12px 14px',background:T.bg2}}>
            <p style={{fontSize:11,fontWeight:600,color:T.ink2,margin:'0 0 10px'}}>Nova variável</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              <div>
                <label style={{fontSize:10,color:T.ink4,display:'block',marginBottom:3}}>Nome da variável</label>
                <input value={novaChave}
                  onChange={e=>{setNovCh(e.target.value);setErro('')}}
                  placeholder="link_instagram ou {{link_instagram}}"
                  style={{width:'100%',padding:'7px 10px',borderRadius:7,fontSize:11,
                    background:T.bg1,border:`1px solid ${T.sep2}`,color:T.ink1,
                    outline:'none',boxSizing:'border-box',fontFamily:'monospace'}}
                />
              </div>
              <div>
                <label style={{fontSize:10,color:T.ink4,display:'block',marginBottom:3}}>Valor (texto fixo)</label>
                <input value={novaValor}
                  onChange={e=>{setNovVl(e.target.value);setErro('')}}
                  placeholder="https://instagram.com/sostrass"
                  style={{width:'100%',padding:'7px 10px',borderRadius:7,fontSize:11,
                    background:T.bg1,border:`1px solid ${T.sep2}`,color:T.ink1,
                    outline:'none',boxSizing:'border-box'}}
                  onKeyDown={e=>e.key==='Enter'&&adicionar()}
                />
              </div>
            </div>
            {erro && <p style={{fontSize:11,color:T.red,margin:'0 0 8px'}}>{erro}</p>}
            <button onClick={adicionar} disabled={salvando==='add'}
              style={{display:'inline-flex',alignItems:'center',gap:6,
                padding:'7px 16px',borderRadius:8,border:'none',cursor:'pointer',
                background:`linear-gradient(135deg,${T.purple},#7c3aed)`,
                color:'#fff',fontSize:12,fontWeight:700}}>
              {salvando==='add' ? 'Salvando…' : '+ Adicionar variável'}
            </button>
          </div>
        </>
      )}
    </GlowCard>
  )
}

const SECOES=[
  { id:'monitor',   label:'Monitoramento',      icon:Activity,       cor:T.green,  desc:'Cockpit do sistema'     },
  { id:'integracoes',label:'Integrações',        icon:Globe,          cor:T.blue,   desc:'WhatsApp, Bling, Meta'  },
  { id:'gatilhos',  label:'Gatilhos & Horários', icon:Zap,            cor:T.amber,  desc:'Schedules',badge:'novo' },
  { id:'rastreio',  label:'Rastreio por Canal',  icon:Truck,          cor:T.green,  desc:'Canais unificados'      },
  { id:'sla',       label:'Atendimento & SLA',   icon:Clock,          cor:T.cyan,   desc:'Tiers + escalonamento'  },
  { id:'contatos',  label:'Contatos & Blacklist', icon:Users,          cor:T.red,    desc:'Gestão de contatos'     },
  { id:'export',    label:'Exportação',           icon:Download,       cor:T.ink3,   desc:'CSV / JSON'             },
  { id:'auditoria', label:'Auditoria',            icon:History,        cor:T.purple, desc:'Timeline de mudanças'   },
  { id:'variaveis',  label:'Variáveis Custom',    icon:Hash,           cor:T.purple, desc:'Substituições estáticas' },
  { id:'rapidas',    label:'Respostas Rápidas',   icon:Zap,            cor:T.amber,  desc:'Textos pré-definidos do chat' },
]

// ═══════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════
export default function PageCentralConfig({ api=API }) {
  const [secao,setSecao]=useState('monitor')
  const mainRef=useRef()

  const goTo=(id)=>{ setSecao(id); mainRef.current?.scrollTo({top:0,behavior:'smooth'}) }
  const current=SECOES.find(s=>s.id===secao)

  const renderSecao=()=>{
    switch(secao){
      case 'monitor':    return <SecaoMonitoramento api={api}/>
      case 'integracoes':return <SecaoIntegracoes api={api}/>
      case 'gatilhos':   return <SecaoGatilhosHorarios api={api}/>
      case 'rastreio':   return <SecaoRastreio api={api}/>
      case 'sla':        return <SecaoSLA api={api}/>
      case 'contatos':   return <SecaoContatos api={api}/>
      case 'export':     return <SecaoExportacao api={api}/>
      case 'auditoria':  return <SecaoAuditoria api={api}/>
      case 'variaveis':  return <SecaoVariaveis api={api}/>
      case 'rapidas':    return <SecaoRespostasRapidas api={api}/>
      default: return null
    }
  }

  return (
    <div style={{ display:'flex',height:'100%',background:T.bg0,overflow:'hidden',fontFamily:'system-ui,sans-serif' }}>
      <style>{`
        @keyframes cfg-spin   { to{transform:rotate(360deg)} }
        @keyframes spin-me      { to{transform:rotate(360deg)} }
        @keyframes cfg-ping   { 0%{transform:scale(1);opacity:.5} 75%,100%{transform:scale(2.2);opacity:0} }
        @keyframes cfg-fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cfg-slideR { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      {/* SIDE PANEL */}
      <aside style={{ width:268,flexShrink:0,display:'flex',flexDirection:'column',
        background:`linear-gradient(180deg,${T.bg2} 0%,${T.bg1} 100%)`,
        borderRight:`1px solid ${T.sep}`,boxShadow:`6px 0 32px rgba(0,0,0,.4)` }}>

        <div style={{ padding:'22px 16px 16px',borderBottom:`1px solid ${T.sep}` }}>
          <div style={{ display:'flex',alignItems:'center',gap:11 }}>
            <div style={{ width:40,height:40,borderRadius:13,flexShrink:0,
              background:'linear-gradient(135deg,rgba(167,139,250,.25),rgba(167,139,250,.1))',
              border:`1.5px solid ${T.purpleBor}`,display:'flex',alignItems:'center',
              justifyContent:'center',boxShadow:`0 4px 20px ${T.purple}25` }}>
              <Settings2 size={18} style={{ color:T.purple }}/>
            </div>
            <div>
              <div style={{ fontSize:15.5,fontWeight:800,color:T.ink1,letterSpacing:'-.03em' }}>
                Configurações
              </div>
              <div style={{ fontSize:10,color:T.ink4,marginTop:1 }}>Central de controle</div>
            </div>
          </div>
        </div>

        <nav style={{ flex:1,overflowY:'auto',padding:'8px 8px',scrollbarWidth:'none' }}>
          {SECOES.map(s=>{
            const ativa=secao===s.id
            return (
              <button key={s.id} onClick={()=>goTo(s.id)}
                style={{ width:'100%',display:'flex',alignItems:'center',gap:11,
                  padding:'9px 12px',borderRadius:12,border:'none',cursor:'pointer',
                  marginBottom:3,textAlign:'left',position:'relative',
                  background:ativa?`${s.cor}14`:'transparent',transition:'all .16s' }}
                onMouseEnter={e=>{ if(!ativa) e.currentTarget.style.background=T.gray }}
                onMouseLeave={e=>{ if(!ativa) e.currentTarget.style.background='transparent' }}>
                <div style={{ position:'absolute',left:0,top:'18%',bottom:'18%',width:3,
                  borderRadius:'0 3px 3px 0',
                  background:ativa?`linear-gradient(180deg,${s.cor},${s.cor}60)`:'transparent',
                  boxShadow:ativa?`0 0 12px ${s.cor}70`:undefined,transition:'all .2s' }}/>
                <div style={{ width:32,height:32,borderRadius:10,flexShrink:0,
                  background:ativa?`${s.cor}22`:'rgba(255,255,255,.04)',
                  border:`1px solid ${ativa?s.cor+'45':'rgba(255,255,255,.06)'}`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  boxShadow:ativa?`0 2px 14px ${s.cor}25`:undefined,transition:'all .18s' }}>
                  <s.icon size={14} style={{ color:ativa?s.cor:T.ink4,transition:'color .15s' }}/>
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:2 }}>
                    <span style={{ fontSize:12.5,fontWeight:ativa?700:500,
                      color:ativa?s.cor:T.ink3,letterSpacing:'-.01em',transition:'all .15s' }}>
                      {s.label}
                    </span>
                    {s.badge&&<span style={{ fontSize:8,padding:'1px 6px',borderRadius:99,
                      background:`${s.cor}20`,color:s.cor,border:`1px solid ${s.cor}35`,
                      fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em' }}>{s.badge}</span>}
                  </div>
                  <div style={{ fontSize:10,color:T.ink4 }}>{s.desc}</div>
                </div>
              </button>
            )
          })}
        </nav>

        <div style={{ padding:'12px 16px 14px',borderTop:`1px solid ${T.sep}` }}>
          <div style={{ fontSize:10.5,color:T.ink4,lineHeight:1.6 }}>
            Mudanças salvas em tempo real. Aplicadas no próximo ciclo (≤30 min).
          </div>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
        {current&&(
          <div style={{ flexShrink:0,padding:'20px 36px 16px',
            borderBottom:`1px solid ${T.sep}`,
            background:`linear-gradient(90deg,${current.cor}07,transparent 50%)` }}>
            <div style={{ display:'flex',alignItems:'center',gap:13,
              animation:'cfg-slideR .22s ease' }} key={secao}>
              <div style={{ width:44,height:44,borderRadius:13,flexShrink:0,
                background:`${current.cor}20`,border:`1.5px solid ${current.cor}40`,
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:`0 4px 20px ${current.cor}25` }}>
                <current.icon size={20} style={{ color:current.cor }}/>
              </div>
              <div>
                <h1 style={{ margin:0,fontSize:20,fontWeight:800,color:T.ink1,letterSpacing:'-.03em' }}>
                  {current.label}
                </h1>
                <p style={{ margin:0,fontSize:12,color:T.ink4,marginTop:3 }}>{current.desc}</p>
              </div>
            </div>
          </div>
        )}
        <main ref={mainRef} style={{ flex:1,overflowY:'auto',padding:'28px 36px' }}>
          <div style={{ maxWidth:860,margin:'0 auto',animation:'cfg-fadeIn .3s ease' }} key={secao}>
            {renderSecao()}
          </div>
        </main>
      </div>
    </div>
  )
}
