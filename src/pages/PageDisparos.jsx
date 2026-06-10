/**
 * PageDisparos.jsx — Bia v6 Enterprise
 * Monitor de disparos automáticos e gatilhos WhatsApp
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import React from 'react'
import {
  Zap, Send, AlertCircle, Clock, CheckCircle, RefreshCw, Check,
  TrendingUp, Users, XCircle, BarChart3, Activity, Filter,
  ShoppingBag, Truck, CreditCard, Bell, Star, FileText,
  Package, ArrowUpRight, ArrowDownRight, Minus, Search,
  RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Eye, X, Navigation, Hash, Timer, AlertTriangle, ShieldCheck, MapPin,
  ToggleLeft, ToggleRight, Download, Info, MessageSquare,
  ExternalLink, Radio, Settings, MoreVertical, Brain, Phone,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie,
} from 'recharts'

const BASE = import.meta.env?.VITE_API_URL || ''

// ─── Paleta dark enterprise (mesma base do PageCampanhas) ─────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#6b7294', ink4:'#3a3f5c',
  sep:'rgba(255,255,255,0.05)', sep2:'rgba(255,255,255,0.08)',
  green:'#00e676', greenDim:'rgba(0,230,118,0.08)', greenBor:'rgba(0,230,118,0.2)',
  blue:'#4f8ef7',  blueDim:'rgba(79,142,247,0.08)',  blueBor:'rgba(79,142,247,0.2)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,0.08)',  amberBor:'rgba(255,179,0,0.2)',
  red:'#ff4757',   redDim:'rgba(255,71,87,0.08)',    redBor:'rgba(255,71,87,0.2)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,0.08)',purpleBor:'rgba(167,139,250,0.2)',
  cyan:'#06b6d4',  cyanDim:'rgba(6,182,212,0.08)',   cyanBor:'rgba(6,182,212,0.2)',
  gray:'rgba(107,114,128,.15)', grayBor:'rgba(107,114,128,.2)',
}

// ─── METADADOS DOS GATILHOS ───────────────────────────────────────────────────
const GATILHO_META = {
  pagamento_aprovado:       { label:'Pagamento Aprovado',       icon:CreditCard,    cor:'#4a9fff' },
  pedido_criado:            { label:'Pedido Criado',            icon:ShoppingBag,   cor:'#00d4aa' },
  pedido_aguardando_pagamento:{ label:'Aguardando Pagamento',   icon:Clock,         cor:'#f59e0b' },
  em_separacao:             { label:'Em Separação',             icon:Activity,      cor:'#8b5cf6' },
  produto_embalado:         { label:'Produto Embalado',         icon:Package,       cor:'#06b6d4' },
  nfe_pendente:             { label:'NF-e Pendente',            icon:FileText,      cor:'#f97316' },
  nfe_emitida:              { label:'NF-e Emitida',             icon:FileText,      cor:'#f59e0b' },
  pedido_enviado:           { label:'Pedido Enviado',           icon:Truck,         cor:'#a78bfa' },
  rastreio_em_transito:     { label:'Em Trânsito',              icon:Navigation,    cor:'#06b6d4' },
  saiu_entrega:             { label:'Saiu p/ Entrega',          icon:Truck,         cor:'#22c55e' },
  pedido_entregue:          { label:'Pedido Entregue',          icon:Package,       cor:'#22c55e' },
  nao_entregue:             { label:'Não Entregue',             icon:XCircle,       cor:'#ef4444' },
  cancelamento:             { label:'Cancelamento',             icon:XCircle,       cor:'#ef4444' },
  devolucao:                { label:'Devolução',                icon:RotateCcw,     cor:'#f97316' },
  avise_me:                 { label:'Avise-me',                 icon:Bell,          cor:'#fb923c' },
  boas_vindas:              { label:'Boas-vindas',              icon:Star,          cor:'#e879f9' },
  avaliar_pedido:           { label:'Avaliação',                icon:Star,          cor:'#f87171' },
  estorno_realizado:        { label:'Estorno',                  icon:RotateCcw,     cor:'#f97316' },
  pix_pendente:             { label:'PIX Pendente',             icon:CreditCard,    cor:'#22c55e' },
  // Gatilhos de rastreio adicionais
  pagamento_pendente:       { label:'Pag. Pendente',            icon:CreditCard,    cor:'#f59e0b' },
  pedido_coletado:          { label:'Pedido Coletado',          icon:Package,       cor:'#4a9fff' },
  nao_entrou_unidade:       { label:'Não Entrou Unidade',       icon:AlertTriangle, cor:'#f97316' },
  tentativa_entrega:        { label:'Tentativa Entrega',        icon:Clock,         cor:'#f59e0b' },
  aguardando_retirada:      { label:'Aguardando Retirada',      icon:Navigation,    cor:'#8b5cf6' },
  pacote_devolvido:         { label:'Pacote Devolvido',         icon:RotateCcw,     cor:'#ef4444' },
  reengajamento:            { label:'Reengajamento',            icon:RefreshCw,     cor:'#a78bfa' },
}

const CANAL_META = {
  loja:         { label:'Loja',       cor:'#00d4aa', emoji:'🛍️' },
  bling:        { label:'Loja',       cor:'#00d4aa', emoji:'🛍️' },
  nuvemshop:    { label:'Nuvemshop',  cor:'#4a9fff', emoji:'🌐' },
  shopee:       { label:'Shopee',     cor:'#f97316', emoji:'🟠' },
  mercadolivre: { label:'Merc.Livre', cor:'#f59e0b', emoji:'🛒' },
  shein:        { label:'Shein',      cor:'#ec4899', emoji:'🌸' },
  tiktokshop:   { label:'TikTok',     cor:'#6b7280', emoji:'🎵' },
  rastreio:     { label:'Rastreio',   cor:'#06b6d4', emoji:'📡' },
  rastreio_job: { label:'Rastreio',   cor:'#06b6d4', emoji:'📡' },
}

function PlataformaSVG({ canal, size=14 }) {
  const c = canal==='shopee'?'#f97316':canal==='mercadolivre'?'#f59e0b':canal==='shein'?'#ec4899':canal==='tiktokshop'?'#94a3b8':canal==='nuvemshop'?'#4a9fff':'#00d4aa'
  if (canal==='shopee') return <svg width={size} height={size} viewBox="0 0 24 24" fill={c}><path d="M12 2C9.5 2 7.5 4 7.5 6.5h-3l-1 15h17l-1-15h-3C16.5 4 14.5 2 12 2zm0 2c1.4 0 2.5 1.1 2.5 2.5h-5C9.5 5.1 10.6 4 12 4z"/></svg>
  if (canal==='mercadolivre') return <svg width={size} height={size} viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#f59e0b"/><text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="800">ML</text></svg>
  if (canal==='nuvemshop') return <svg width={size} height={size} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#4a9fff18"/><path d="M6 16a4 4 0 010-8 4 4 0 017.6-1.5A3.5 3.5 0 1119.5 10H17a2 2 0 00-2-2 2 2 0 00-2 2H7a1 1 0 000 2h9a2 2 0 002 2h-2.1a2 2 0 01-3.8 0H6z" fill="#4a9fff"/></svg>
  if (canal==='shein') return <svg width={size} height={size} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#ec489918"/><text x="12" y="16" textAnchor="middle" fill="#ec4899" fontSize="10" fontWeight="800">S</text></svg>
  if (canal==='tiktokshop') return <svg width={size} height={size} viewBox="0 0 24 24" fill="#94a3b8"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.85a8.16 8.16 0 004.77 1.52V6.9a4.85 4.85 0 01-1-.21z"/></svg>
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#00d4aa18"/><path d="M20 7H4a1 1 0 00-1 1v1a3 3 0 003 3v6a1 1 0 001 1h10a1 1 0 001-1v-6a3 3 0 003-3V8a1 1 0 00-1-1zM4 9h16v1a1 1 0 01-1 1H5a1 1 0 01-1-1V9zm2 4h12v5H6v-5z" fill="#00d4aa"/></svg>
}


const STATUS_META = {
  enviado:    { label:'Enviado',    cor:'#22c55e', bg:'rgba(34,197,94,.12)',    icon:CheckCircle },
  erro:       { label:'Erro',       cor:'#ef4444', bg:'rgba(239,68,68,.12)',    icon:XCircle },
  ignorado:   { label:'Ignorado',   cor:'#6b7280', bg:'rgba(107,114,128,.12)', icon:Minus },
  aguardando: { label:'Aguardando', cor:'#f59e0b', bg:'rgba(245,158,11,.12)',  icon:Clock },
}

const PERIODOS = [
  {id:'1d',label:'Hoje'},{id:'7d',label:'7 dias'},
  {id:'30d',label:'30 dias'},{id:'90d',label:'90 dias'},
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtTel = t => {
  const n=(t||'').replace(/\D/g,'').replace(/^55/,'')
  return n.length===11?`(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`:t||''
}
const fmtDH = ts => ts ? new Date(ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'
const fmtD  = ts => ts ? new Date(ts).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) : '—'

const TT = {contentStyle:{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:8,fontSize:11,color:'var(--label)'}}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function Skeleton({w='100%', h=20, r=8}) {
  return (
    <div style={{width:w, height:h, borderRadius:r, overflow:'hidden',
      background:`linear-gradient(90deg,${T.bg3} 25%,${T.bg4} 50%,${T.bg3} 75%)`,
      backgroundSize:'200% 100%', animation:'shimmer 1.5s ease-in-out infinite'}}/>
  )
}

// ─── SPARKLINE 7 DIAS ─────────────────────────────────────────────────────────
function Spark7({data=[], cor='#a78bfa', h=28, w=72}) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h-2-(v/max)*(h-6)+2}`).join(' ')
  const area = `0,${h} ${pts} ${w},${h}`
  const gid = `sg${cor.replace(/[^a-z0-9]/gi,'')}`
  const lastX = w, lastY = h-2-(data[data.length-1]/max)*(h-6)+2
  return (
    <svg width={w} height={h} style={{display:'block', flexShrink:0}}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity=".35"/>
          <stop offset="100%" stopColor={cor} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`}/>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lastX} cy={lastY} r="2.5" fill={cor}/>
    </svg>
  )
}

// ─── KCARD ATUALIZADO com countUp + sparkline ─────────────────────────────────
function KCard({icon:Ic, label, value, sub, cor='#7c6af7', trend, spark, alert=false}) {
  const numVal = typeof value==='number' ? value : (parseInt(String(value||''))||0)
  const [disp, setDisp] = useState(0)
  useEffect(() => {
    if (!numVal && numVal!==0) return
    const t0=Date.now(), dur=800
    const tick=()=>{
      const p=Math.min((Date.now()-t0)/dur,1)
      setDisp(Math.round((1-Math.pow(1-p,4))*numVal))
      if(p<1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  },[numVal])
  const displayVal = (typeof value==='number'||(!isNaN(parseInt(String(value||'')))&&value!==null&&value!==''))
    ? disp : (value??'—')

  return (
    <div style={{
      background:`linear-gradient(135deg,${T.bg2} 0%,${T.bg3} 100%)`,
      border:`1px solid ${alert?cor+'55':T.sep2}`,
      borderRadius:16, padding:'18px 16px',
      display:'flex', flexDirection:'column', gap:12,
      position:'relative', overflow:'hidden',
      boxShadow:alert
        ?`0 0 0 1px ${cor}22, 0 8px 32px rgba(0,0,0,.3), 0 0 40px ${cor}10`
        :`0 8px 32px rgba(0,0,0,.25), 0 1px 0 rgba(255,255,255,.04) inset`,
      transition:'transform .2s, box-shadow .2s',
    }}
    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 16px 48px rgba(0,0,0,.4), 0 0 40px ${cor}18`}}
    onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=alert?`0 0 0 1px ${cor}22, 0 8px 32px rgba(0,0,0,.3)`:`0 8px 32px rgba(0,0,0,.25), 0 1px 0 rgba(255,255,255,.04) inset`}}>

      {/* Blob decorativo */}
      <div style={{position:'absolute',top:-24,right:-24,width:100,height:100,borderRadius:'50%',
        background:`radial-gradient(circle,${cor}25 0%,transparent 70%)`,pointerEvents:'none',filter:'blur(8px)'}}/>

      {/* Topo: ícone + trend */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',position:'relative'}}>
        <div style={{width:36,height:36,borderRadius:11,
          background:`linear-gradient(135deg,${cor}28,${cor}14)`,
          border:`1px solid ${cor}35`,
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:`0 4px 12px ${cor}20`}}>
          <Ic size={17} style={{color:cor}}/>
        </div>
        {trend!==undefined&&(
          <div style={{display:'flex',alignItems:'center',gap:3,fontSize:11,fontWeight:700,
            padding:'3px 8px',borderRadius:99,
            background:trend>0?T.greenDim:trend<0?T.redDim:T.gray,
            border:`1px solid ${trend>0?T.greenBor:trend<0?T.redBor:T.grayBor}`,
            color:trend>0?T.green:trend<0?T.red:T.ink4}}>
            {trend>0?<ArrowUpRight size={10}/>:trend<0?<ArrowDownRight size={10}/>:<Minus size={10}/>}
            {trend!==0&&`${Math.abs(trend)}%`}
          </div>
        )}
        {alert&&<span style={{fontSize:8,padding:'2px 7px',borderRadius:99,
          background:`${cor}18`,color:cor,border:`1px solid ${cor}35`,fontWeight:700,letterSpacing:'.06em'}}>
          ATENÇÃO
        </span>}
      </div>

      {/* Valor + label */}
      <div style={{position:'relative'}}>
        <div style={{fontSize:32,fontWeight:800,letterSpacing:'-.04em',lineHeight:1,
          color:T.ink1,
          textShadow:`0 0 32px ${cor}35`}}>
          {displayVal}
        </div>
        <div style={{fontSize:11,color:T.ink3,marginTop:5,fontWeight:500}}>{label}</div>
        {sub&&<div style={{fontSize:10,color:T.ink4,marginTop:2}}>{sub}</div>}
      </div>

      {/* Sparkline expandida */}
      {spark&&spark.length>1&&(
        <div style={{marginTop:'auto',height:36,position:'relative'}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark.map((v,i)=>({i,v}))} margin={{top:4,right:0,left:0,bottom:0}}>
              <defs>
                <linearGradient id={`sk-${label.replace(/\s/g,'')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={cor} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={cor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area dataKey="v" stroke={cor} strokeWidth={1.5} dot={false}
                fill={`url(#sk-${label.replace(/\s/g,'')})`} fillOpacity={1}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─── INSIGHT CARD multi-nível ─────────────────────────────────────────────────
function InsightCard({ins, onDismiss}) {
  const [detail, setDetail] = useState(false)
  const cfg = {
    critico:     {cor:T.red,   dim:T.redDim,   bor:T.redBor,   icon:AlertTriangle, lbl:'CRÍTICO'},
    aviso:       {cor:T.amber, dim:T.amberDim, bor:T.amberBor, icon:Clock,         lbl:'ATENÇÃO'},
    oportunidade:{cor:T.blue,  dim:T.blueDim,  bor:T.blueBor,  icon:Star,          lbl:'OPORTUNIDADE'},
    positivo:    {cor:T.green, dim:T.greenDim, bor:T.greenBor, icon:TrendingUp,    lbl:'POSITIVO'},
  }[ins.tipo] || {cor:T.ink3, dim:T.gray, bor:T.grayBor, icon:Info, lbl:'INFO'}
  const Ic = cfg.icon
  return (
    <div style={{borderRadius:11,padding:'12px 14px',background:cfg.dim,
      border:`1px solid ${cfg.bor}`,animation:'fadeIn .3s ease'}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
        <div style={{width:32,height:32,borderRadius:9,background:`${cfg.cor}18`,
          border:`1px solid ${cfg.bor}`,display:'flex',alignItems:'center',
          justifyContent:'center',flexShrink:0,marginTop:1}}>
          <Ic size={15} style={{color:cfg.cor}}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5,flexWrap:'wrap'}}>
            <span style={{fontSize:9,padding:'1px 7px',borderRadius:99,
              background:`${cfg.cor}20`,color:cfg.cor,fontWeight:700,letterSpacing:'.04em'}}>
              {cfg.lbl}
            </span>
            {ins.clientes>0&&(
              <span style={{fontSize:10,color:T.ink3,display:'flex',alignItems:'center',gap:3}}>
                <Users size={9}/>{ins.clientes} clientes
              </span>
            )}
            {ins.total>0&&!ins.clientes&&(
              <span style={{fontSize:10,color:T.ink4}}>{ins.total} disparos</span>
            )}
          </div>
          <div style={{fontSize:12.5,fontWeight:600,color:T.ink1,marginBottom:5,lineHeight:1.4}}>
            {ins.titulo}
          </div>
          {detail&&(
            <div style={{fontSize:11,color:T.ink2,lineHeight:1.6,marginBottom:8,
              animation:'fadeIn .2s ease'}}>
              {ins.desc}
            </div>
          )}
          <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap',marginTop:7}}>
            {ins.acao&&(
              <button style={{display:'inline-flex',alignItems:'center',gap:5,
                padding:'5px 11px',borderRadius:7,border:'none',cursor:'pointer',
                fontSize:11,fontWeight:600,
                background:'linear-gradient(135deg,#5b21b6,#9333ea)',color:'#fff'}}>
                <Zap size={10}/>Resolver agora
              </button>
            )}
            <button onClick={()=>setDetail(v=>!v)} style={{display:'inline-flex',
              alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,cursor:'pointer',
              fontSize:10.5,background:'transparent',border:`1px solid ${cfg.bor}`,
              color:cfg.cor,fontWeight:500}}>
              {detail?<ChevronUp size={10}/>:<ChevronDown size={10}/>}
              {detail?'Menos':'Detalhes'}
            </button>
            <button onClick={onDismiss} style={{marginLeft:'auto',display:'inline-flex',
              alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,cursor:'pointer',
              fontSize:10.5,background:'transparent',border:`1px solid ${T.sep}`,
              color:T.ink3,fontWeight:500}}>
              <CheckCircle size={10}/>Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── COMMAND PALETTE ──────────────────────────────────────────────────────────
function CmdPalette({open, onClose, log=[], onOpenDisparo, onOpenCliente,
  onReload, onExport, onFiltrarErros}) {
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) { setQ(''); setTimeout(()=>inputRef.current?.focus(),50) }
  }, [open])

  const results = useMemo(() => {
    if (!q.trim()) return []
    const term = q.toLowerCase()
    const seen = new Set()
    return log.filter(r => {
      const key = r.telefone
      if (seen.has(key)) return false
      seen.add(key)
      return (r.nome_cliente||'').toLowerCase().includes(term)
        || (r.telefone||'').includes(term)
        || (r.numero_pedido||'').includes(term)
    }).slice(0,7)
  }, [q, log])

  const acoes = [
    {icon:RefreshCw, label:'Recarregar dados', kbd:'R', fn:()=>{onReload?.();onClose()}},
    {icon:Download,  label:'Exportar CSV',     kbd:'E', fn:()=>{onExport?.();onClose()}},
    {icon:Filter,    label:'Filtrar só erros', kbd:'', fn:()=>{onFiltrarErros?.();onClose()}},
  ]

  if (!open) return null
  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:200,
        background:'rgba(0,0,0,.65)',
        backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)'}}/>
      <div style={{position:'fixed',top:'18%',left:'50%',transform:'translateX(-50%)',
        width:'min(560px,94vw)',zIndex:201,
        background:'rgba(13,16,23,0.94)',
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        border:`1px solid ${T.sep2}`,borderRadius:16,
        boxShadow:'0 40px 100px rgba(0,0,0,.85), 0 0 0 1px rgba(255,255,255,.05) inset',
        animation:'slideup .2s ease'}}>

        {/* Busca */}
        <div style={{padding:'12px 14px',borderBottom:`1px solid ${T.sep}`,
          display:'flex',alignItems:'center',gap:10}}>
          <Search size={16} style={{color:T.ink3,flexShrink:0}}/>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Buscar cliente, pedido, número..."
            onKeyDown={e=>{
              if(e.key==='Escape') onClose()
              if(e.key==='Enter' && results.length) { onOpenDisparo?.(results[0]); onClose() }
            }}
            style={{flex:1,border:'none',background:'transparent',color:T.ink1,
              fontSize:15,outline:'none',fontFamily:'inherit'}}/>
          <kbd style={{fontSize:10,padding:'2px 6px',borderRadius:5,flexShrink:0,
            background:T.bg4,color:T.ink3,border:`1px solid ${T.sep2}`}}>Esc</kbd>
        </div>

        {/* Resultados */}
        <div style={{maxHeight:340,overflowY:'auto'}}>
          {!q && (
            <div style={{padding:'8px 10px'}}>
              <div style={{fontSize:9,color:T.ink4,textTransform:'uppercase',
                letterSpacing:'.07em',padding:'4px 4px 8px'}}>Ações rápidas</div>
              {acoes.map((a,i)=>(
                <div key={i} onClick={a.fn}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'9px 10px',
                    borderRadius:8,cursor:'pointer',transition:'background .1s'}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.bg3}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{width:28,height:28,borderRadius:8,background:T.bg3,
                    display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <a.icon size={13} style={{color:T.ink3}}/>
                  </div>
                  <span style={{flex:1,fontSize:13,color:T.ink2}}>{a.label}</span>
                  {a.kbd&&<kbd style={{fontSize:10,padding:'1px 6px',borderRadius:4,
                    background:T.bg4,color:T.ink3,border:`1px solid ${T.sep2}`}}>{a.kbd}</kbd>}
                </div>
              ))}
            </div>
          )}
          {q && results.length===0&&(
            <div style={{padding:'32px 0',textAlign:'center',color:T.ink3,fontSize:13}}>
              Nenhum resultado para "{q}"
            </div>
          )}
          {results.map((r,i)=>{
            const meta = GATILHO_META[r.gatilho]||{label:r.gatilho,icon:Zap,cor:'#6b7294'}
            const Ic2 = meta.icon
            return (
              <div key={i} onClick={()=>{onOpenDisparo?.(r);onClose()}}
                style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
                  cursor:'pointer',borderTop:`1px solid ${T.sep}`,transition:'background .1s'}}
                onMouseEnter={e=>e.currentTarget.style.background=T.bg3}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{width:34,height:34,borderRadius:9,background:`${meta.cor}18`,
                  border:`0.5px solid ${meta.cor}28`,display:'flex',alignItems:'center',
                  justifyContent:'center',flexShrink:0}}>
                  <Ic2 size={15} style={{color:meta.cor}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:T.ink1,fontWeight:500,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {r.nome_cliente||'—'}
                  </div>
                  <div style={{fontSize:11,color:T.ink3,display:'flex',gap:8,marginTop:2}}>
                    <span>{meta.label}</span>
                    {r.numero_pedido&&<span>· #{r.numero_pedido}</span>}
                    <span style={{marginLeft:'auto',color:T.ink4}}>{tempoRel(r.criado_em)}</span>
                  </div>
                </div>
                <ChevronRight size={14} style={{color:T.ink4,flexShrink:0}}/>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{padding:'8px 14px',borderTop:`1px solid ${T.sep}`,
          display:'flex',gap:10,alignItems:'center'}}>
          <kbd style={{fontSize:10,padding:'1px 6px',borderRadius:4,
            background:T.bg4,color:T.ink4,border:`1px solid ${T.sep2}`}}>↑↓</kbd>
          <span style={{fontSize:10,color:T.ink4}}>navegar</span>
          <kbd style={{fontSize:10,padding:'1px 6px',borderRadius:4,
            background:T.bg4,color:T.ink4,border:`1px solid ${T.sep2}`}}>↵</kbd>
          <span style={{fontSize:10,color:T.ink4}}>abrir</span>
          <span style={{marginLeft:'auto',fontSize:10,color:T.ink4}}>⌘K para fechar</span>
        </div>
      </div>
    </>
  )
}



// ─── DRAWER LATERAL: detalhe do disparo OU perfil do cliente ──────────────────
// ─── DRAWER ENTERPRISE ────────────────────────────────────────────────────────
function Iniciais({nome, size=44}) {
  const ini = (nome||'?').split(' ').slice(0,2).map(p=>p[0]||'').join('').toUpperCase()||'?'
  return (
    <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,
      background:'linear-gradient(135deg,#7c6af7,#a855f7)',
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:size*.38,fontWeight:700,color:'#fff',letterSpacing:'.5px'}}>
      {ini}
    </div>
  )
}

function StatCard({label, value, cor='var(--label)'}) {
  return (
    <div style={{flex:1,background:'var(--bg-3)',borderRadius:10,padding:'10px 8px',textAlign:'center',border:'0.5px solid var(--sep)'}}>
      <div style={{fontSize:20,fontWeight:700,color:cor,lineHeight:1}}>{value}</div>
      <div style={{fontSize:9.5,color:'var(--label-4)',marginTop:3,textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// NIVELMAX v2 — Funil da jornada, preview da mensagem real, fila de saída,
// saúde do motor, erros por motivo e SLA por transportadora.
// Alimentados por /api/dashboard/disparos/painel + variaveis JSONB (webhook v4)
// ═══════════════════════════════════════════════════════════════════════════

// Cache de templates (corpo das mensagens) — 1 fetch por sessão
let _tplCache = null
async function _carregarTemplates(api) {
  if (_tplCache) return _tplCache
  try {
    const r = await fetch(`${api}/api/templates`)
    if (r.ok) {
      const d = await r.json()
      const map = {}
      for (const t of (d.templates||d||[])) {
        const corpo = (t.blocos||[]).filter(b=>b.tipo==='texto').map(b=>b.conteudo).join('\n')
        if (corpo) map[t.gatilho] = corpo
      }
      _tplCache = map
    }
  } catch {}
  return _tplCache || {}
}

// Formata corpo estilo WhatsApp: *negrito*, quebras de linha
function FmtWa({txt}) {
  return (txt||'').split('\n').map((ln,i)=>(
    <div key={i} style={{minHeight: ln ? undefined : 8}}>
      {ln.split(/(\*[^*\n]+\*)/g).map((p,j)=>
        p.length>2 && p.startsWith('*') && p.endsWith('*')
          ? <b key={j} style={{color:T.ink1,fontWeight:700}}>{p.slice(1,-1)}</b>
          : <span key={j}>{p}</span>
      )}
    </div>
  ))
}

// ── Preview da mensagem REAL enviada (template + variáveis salvas do disparo) ─
function PreviewMensagem({api, gatilho, variaveis, status}) {
  const [corpo, setCorpo] = useState(null)
  const vars = useMemo(()=>{
    let v = variaveis
    if (typeof v === 'string') { try { v = JSON.parse(v) } catch { v = null } }
    return v && typeof v === 'object' ? v : null
  },[variaveis])

  useEffect(()=>{ let on=true
    _carregarTemplates(api).then(m=>{ if(on) setCorpo(m[gatilho]||null) })
    return ()=>{ on=false }
  },[api,gatilho])

  if (!vars || Object.keys(vars).length===0) return null
  const rv = k => { const s = vars[k] ?? vars[`{{${k}}}`]; return (s===undefined||s===null||s==='') ? null : String(s) }
  const renderizado = corpo
    ? corpo.replace(/\{\{(\w+)\}\}/g, (m,k)=> rv(k) ?? m)
    : null

  return (
    <div className="modal-wc-sec">
      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
        <MessageSquare size={13} style={{color:T.green}}/>
        <span style={{fontSize:11,fontWeight:700,color:T.ink2,letterSpacing:'.02em'}}>
          {status==='enviado' ? 'Mensagem enviada ao cliente' : status==='aguardando' ? 'Mensagem que será enviada' : 'Mensagem do disparo'}
        </span>
        <span style={{fontSize:8.5,color:T.ink4,marginLeft:'auto'}}>renderizada das variáveis salvas</span>
      </div>
      {renderizado ? (
        <div style={{
          background:'#0b141a',border:`1px solid ${T.sep2}`,
          borderRadius:'12px 12px 12px 3px',padding:'10px 13px',
          fontSize:11.5,lineHeight:1.55,color:T.ink2,maxWidth:420,
          boxShadow:'0 2px 12px rgba(0,0,0,.3)',
        }}>
          <FmtWa txt={renderizado}/>
          <div style={{textAlign:'right',fontSize:8.5,color:T.ink4,marginTop:5,display:'flex',justifyContent:'flex-end',alignItems:'center',gap:3}}>
            {status==='enviado' && <Check size={10} style={{color:T.cyan}}/>}
            {status==='enviado' && <Check size={10} style={{color:T.cyan,marginLeft:-7}}/>}
            WhatsApp
          </div>
        </div>
      ) : (
        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
          {Object.entries(vars).slice(0,10).map(([k,v])=>(
            <span key={k} style={{fontSize:9.5,padding:'3px 8px',borderRadius:7,
              background:T.bg3,border:`1px solid ${T.sep2}`,color:T.ink3}}>
              <span style={{color:T.ink4}}>{String(k).replace(/[{}]/g,'')}:</span>{' '}
              <span style={{color:T.ink2,fontWeight:600}}>{String(v).slice(0,38)||'—'}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Funil da Jornada ao vivo ──────────────────────────────────────────────────
function FunilJornada({painel, onFiltrarGatilho}) {
  if (!painel?.funil?.length) return null
  const f = painel.funil
  const maxQ = Math.max(...f.map(e=>e.passaram), 1)
  const CORES = ['#a78bfa','#06b6d4','#4f8ef7','#ffb300','#00e676']
  // Gargalo = menor conversão entre etapas
  let gargalo = null
  for (const e of f) if (e.conversao!==null && (gargalo===null || e.conversao < gargalo.conversao)) gargalo = e
  const LBL = {pedido_enviado:'Enviado',pedido_coletado:'Coletado',rastreio_em_transito:'Em Trânsito',saiu_entrega:'Saiu p/ Entrega',pedido_entregue:'Entregue'}

  return (
    <div style={{background:`linear-gradient(135deg,${T.bg2} 0%,${T.bg3} 100%)`,
      border:`1px solid ${T.sep2}`,borderRadius:18,padding:'18px 20px 14px',
      boxShadow:'0 12px 48px rgba(0,0,0,.35), 0 1px 0 rgba(255,255,255,.05) inset'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:10,
            background:'linear-gradient(135deg,rgba(167,139,250,.2),rgba(167,139,250,.08))',
            border:'1px solid rgba(167,139,250,.3)',display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 4px 16px rgba(167,139,250,.15)'}}>
            <Navigation size={16} style={{color:T.purple}}/>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.ink1,letterSpacing:'-.02em'}}>Funil da Jornada — ao vivo</div>
            <div style={{fontSize:10.5,color:T.ink4,marginTop:1}}>Pedidos por etapa · conversão · tempo médio — últimos {painel.dias} dias</div>
          </div>
        </div>
        {painel.paradosTransito>0 && (
          <div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:99,
            background:T.amberDim,border:`1px solid ${T.amberBor}`}}>
            <AlertTriangle size={11} style={{color:T.amber}}/>
            <span style={{fontSize:10,color:T.amber,fontWeight:700}}>{painel.paradosTransito} parados em trânsito há +5d</span>
          </div>
        )}
      </div>

      <div style={{display:'flex',alignItems:'flex-end',gap:4}}>
        {f.map((e,i)=>{
          const cor = CORES[i%CORES.length]
          const h = 26 + Math.round((e.passaram/maxQ)*46)
          return (
            <React.Fragment key={e.gatilho}>
              {i>0 && (
                <div style={{paddingBottom:34,whiteSpace:'nowrap'}}>
                  <span style={{fontSize:10.5,fontWeight:700,
                    color: e.conversao===null ? T.ink4 : e.conversao>=90 ? T.green : e.conversao>=70 ? T.amber : T.red}}>
                    {e.conversao===null ? '—' : `${e.conversao}%`} →
                  </span>
                </div>
              )}
              <div onClick={()=>onFiltrarGatilho?.(e.gatilho)} style={{flex:1,textAlign:'center',cursor:'pointer'}}>
                <div style={{fontSize:19,fontWeight:800,color:cor,letterSpacing:'-.02em'}}>{e.atuais}</div>
                <div style={{height:h,background:`linear-gradient(180deg,${cor}30,${cor}0a)`,
                  borderTop:`2px solid ${cor}`,borderRadius:'5px 5px 0 0',marginTop:3}}/>
                <div style={{fontSize:10,color:T.ink2,fontWeight:600,marginTop:5}}>{LBL[e.gatilho]||e.gatilho}</div>
                <div style={{fontSize:8.5,color:T.ink4}}>{e.tempoMedioDias!==null?`média ${String(e.tempoMedioDias).replace('.',',')}d`:'—'}</div>
              </div>
            </React.Fragment>
          )
        })}
      </div>

      {gargalo && gargalo.conversao!==null && gargalo.conversao<90 && (
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:8,paddingTop:8,borderTop:`1px solid ${T.sep}`}}>
          <span style={{fontSize:10,color:T.red,fontWeight:600}}>
            gargalo: {(LBL[f[gargalo.nivel-1]?.gatilho]||'')} → {LBL[gargalo.gatilho]||gargalo.gatilho} ({gargalo.conversao}%)
          </span>
        </div>
      )}
    </div>
  )
}

// ── Fila de saída — agendados com countdown ───────────────────────────────────
function FilaSaida({items=[], onVerDisparo}) {
  const [,setTick] = useState(0)
  useEffect(()=>{ const t=setInterval(()=>setTick(x=>x+1),30000); return ()=>clearInterval(t) },[])
  const fmtEta = (iso) => {
    const s = Math.round((new Date(iso).getTime()-Date.now())/1000)
    if (s <= 0)    return {txt:'agora',         cor:T.green}
    if (s < 3600)  return {txt:`em ${Math.max(1,Math.round(s/60))} min`, cor:T.amber}
    return {txt:`em ${Math.round(s/3600)}h`, cor:T.ink3}
  }
  return (
    <div style={{background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:14,padding:'13px 14px'}}>
      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
        <Timer size={13} style={{color:T.amber}}/>
        <span style={{fontSize:12,fontWeight:700,color:T.ink1}}>Fila de saída</span>
        <span style={{fontSize:9,color:T.ink4,marginLeft:'auto'}}>{items.length} agendado{items.length!==1?'s':''}</span>
      </div>
      {items.length===0
        ? <div style={{fontSize:10.5,color:T.ink4,padding:'14px 0',textAlign:'center'}}>Nenhum disparo agendado</div>
        : <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {items.slice(0,5).map(it=>{
              const eta = fmtEta(it.agendado_para)
              const gm = GATILHO_META[it.gatilho]||{}
              return (
                <div key={it.id} onClick={()=>onVerDisparo?.(it)} style={{display:'flex',alignItems:'center',gap:7,
                  padding:'7px 9px',borderRadius:9,background:T.bg3,cursor:'pointer'}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:gm.cor||T.amber,flexShrink:0,
                    boxShadow:`0 0 6px ${gm.cor||T.amber}`}}/>
                  <span style={{fontSize:10.5,color:T.ink2,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {gm.label||it.gatilho}
                  </span>
                  <span style={{fontSize:9.5,color:T.ink4}}>#{it.numero_pedido}</span>
                  <span style={{fontSize:10,color:eta.cor,fontWeight:700,marginLeft:'auto',whiteSpace:'nowrap'}}>{eta.txt}</span>
                </div>
              )
            })}
          </div>}
    </div>
  )
}

// ── Saúde do motor ────────────────────────────────────────────────────────────
function SaudeMotor({saude, taxa}) {
  if (!saude) return null
  const prox = saude.ultimoCicloJob
    ? Math.max(0, 60 - Math.round((Date.now()-new Date(saude.ultimoCicloJob).getTime())/60000))
    : null
  const linhas = [
    {lbl:'Suprimidos (anti-atropelo)', val:saude.suprimidos,         cor:T.purple},
    {lbl:'Retries recuperados',        val:saude.retriesRecuperados,  cor:T.green},
    {lbl:'Fila de rastreio ativa',     val:saude.filaRastreioAtivos,  cor:T.ink1},
    {lbl:'Processando agora',          val:saude.processando,         cor:T.cyan},
  ]
  return (
    <div style={{background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:14,padding:'13px 14px'}}>
      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
        <ShieldCheck size={13} style={{color:T.purple}}/>
        <span style={{fontSize:12,fontWeight:700,color:T.ink1}}>Saúde do motor</span>
        {prox!==null && <span style={{fontSize:9,color:T.blue,marginLeft:'auto',fontWeight:600}}>próx. ciclo ~{prox} min</span>}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {linhas.map(l=>(
          <div key={l.lbl} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:10.5,color:T.ink3}}>{l.lbl}</span>
            <span style={{fontSize:11.5,fontWeight:800,color:l.cor}}>{l.val}</span>
          </div>
        ))}
        {taxa!==null && taxa!==undefined && (
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:7,borderTop:`1px solid ${T.sep}`}}>
            <span style={{fontSize:10.5,color:T.ink3}}>Taxa de entrega</span>
            <span style={{fontSize:11.5,fontWeight:800,color:taxa>=90?T.green:taxa>=70?T.amber:T.red}}>{taxa}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Erros por motivo ──────────────────────────────────────────────────────────
function ErrosMotivo({lista=[]}) {
  const total = lista.reduce((a,e)=>a+e.qtd,0)
  return (
    <div style={{background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:14,padding:'13px 14px'}}>
      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
        <AlertTriangle size={13} style={{color:T.red}}/>
        <span style={{fontSize:12,fontWeight:700,color:T.ink1}}>Erros por motivo</span>
        <span style={{fontSize:9,color:T.ink4,marginLeft:'auto'}}>{total} no período</span>
      </div>
      {lista.length===0
        ? <div style={{fontSize:10.5,color:T.green,padding:'14px 0',textAlign:'center',fontWeight:600}}>✓ Nenhum erro no período</div>
        : <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {lista.slice(0,4).map(e=>{
              const pct = total ? Math.round(e.qtd/total*100) : 0
              const cor = pct>=50 ? T.red : pct>=25 ? T.amber : T.ink3
              return (
                <div key={e.motivo}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                    <span style={{fontSize:10,color:T.ink2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'78%'}}>{e.motivo}</span>
                    <span style={{fontSize:10,fontWeight:700,color:cor}}>{e.qtd}</span>
                  </div>
                  <div style={{height:4,background:T.bg4,borderRadius:99,overflow:'hidden'}}>
                    <div style={{width:`${pct}%`,height:'100%',background:cor,borderRadius:99,boxShadow:`0 0 6px ${cor}60`}}/>
                  </div>
                </div>
              )
            })}
          </div>}
    </div>
  )
}

// ── SLA por transportadora ────────────────────────────────────────────────────
function SlaTransportadora({lista=[]}) {
  if (!lista.length) return null
  const fmt = d => d===null ? '—' : `${String(d).replace('.',',')}d`
  return (
    <div style={{background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:14,padding:'14px 16px'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <Truck size={14} style={{color:T.cyan}}/>
        <span style={{fontSize:12.5,fontWeight:700,color:T.ink1}}>SLA por transportadora</span>
        <span style={{fontSize:9.5,color:T.ink4,marginLeft:'auto'}}>etiqueta → coleta → entrega · medido pelos disparos</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
        {lista.map(s=>{
          const cor = s.totalDias===null ? T.ink3 : s.totalDias<=3 ? T.green : s.totalDias<=6 ? T.amber : T.red
          const cParte = s.coletaDias||0, tParte = s.transitoDias||0
          const soma = cParte+tParte || 1
          return (
            <div key={s.nome}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:11.5,fontWeight:700,color:T.ink1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'70%'}}>{s.nome}</span>
                <span style={{fontSize:11,fontWeight:800,color:cor}}>{fmt(s.totalDias)}</span>
              </div>
              <div style={{display:'flex',height:7,borderRadius:99,overflow:'hidden',background:T.bg4}}>
                <div style={{width:`${Math.round(cParte/soma*100)}%`,background:`${cor}70`}}/>
                <div style={{width:`${Math.round(tParte/soma*100)}%`,background:cor,boxShadow:`0 0 8px ${cor}50`}}/>
              </div>
              <div style={{fontSize:8.5,color:T.ink4,marginTop:3}}>
                coleta {fmt(s.coletaDias)} · trânsito {fmt(s.transitoDias)} · {s.entregues} entregue{s.entregues!==1?'s':''}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Pulse strip — micro-KPIs em 1 linha (substitui os 6 KCards no Pulso) ─────
function PulseStrip({total, taxa, u24, clientes, aguardando, erros, onErros}) {
  const Item = ({lbl, val, cor=T.ink1, onClick}) => (
    <div onClick={onClick} style={{display:'flex',alignItems:'baseline',gap:6,cursor:onClick?'pointer':'default'}}>
      <span style={{fontSize:10,color:T.ink4}}>{lbl}</span>
      <span style={{fontSize:14,fontWeight:800,color:cor,letterSpacing:'-.02em'}}>{val}</span>
    </div>
  )
  return (
    <div style={{display:'flex',alignItems:'center',gap:22,flexWrap:'wrap',
      background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:12,padding:'9px 16px'}}>
      <Item lbl="Total" val={total}/>
      <Item lbl="Taxa" val={taxa===null?'—':`${taxa}%`} cor={taxa===null?T.ink3:taxa>=90?T.green:taxa>=70?T.amber:T.red}/>
      <Item lbl="24h" val={u24}/>
      <Item lbl="Clientes" val={clientes}/>
      <Item lbl="Aguardando" val={aguardando} cor={aguardando>0?T.amber:T.ink1}/>
      <Item lbl="Erros" val={erros} cor={erros>0?T.red:T.ink1} onClick={erros>0?onErros:undefined}/>
    </div>
  )
}

// ── Precisa de ação — erros por motivo + parados, tudo clicável ───────────────
function PrecisaDeAcao({painel, onErros, onParados}) {
  const erros = painel?.errosMotivo||[]
  const parados = painel?.paradosTransito||0
  const nada = erros.length===0 && parados===0
  return (
    <div style={{background:T.bg2,border:`1px solid ${nada?T.sep2:T.redBor}`,borderRadius:14,padding:'13px 14px'}}>
      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
        <AlertTriangle size={13} style={{color:nada?T.green:T.red}}/>
        <span style={{fontSize:12,fontWeight:700,color:T.ink1}}>Precisa de ação</span>
      </div>
      {nada
        ? <div style={{fontSize:11,color:T.green,fontWeight:600,padding:'12px 0',textAlign:'center'}}>✓ Tudo em dia — nenhuma pendência</div>
        : <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {parados>0 && (
              <div onClick={onParados} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',
                borderRadius:9,background:T.amberDim,border:`1px solid ${T.amberBor}`,cursor:'pointer'}}>
                <Truck size={12} style={{color:T.amber,flexShrink:0}}/>
                <span style={{fontSize:11,color:T.ink2,flex:1}}><b style={{color:T.amber}}>{parados}</b> parados em trânsito há +5 dias</span>
                <ChevronRight size={12} style={{color:T.ink4}}/>
              </div>
            )}
            {erros.slice(0,3).map(e=>(
              <div key={e.motivo} onClick={onErros} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',
                borderRadius:9,background:T.redDim,border:`1px solid ${T.redBor}`,cursor:'pointer'}}>
                <XCircle size={12} style={{color:T.red,flexShrink:0}}/>
                <span style={{fontSize:11,color:T.ink2,flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                  <b style={{color:T.red}}>{e.qtd}</b> — {e.motivo}
                </span>
                <ChevronRight size={12} style={{color:T.ink4}}/>
              </div>
            ))}
          </div>}
    </div>
  )
}

// ── Saindo agora — fila de saída (futuro) + últimos envios (passado) ─────────
// Um único fluxo temporal: agendados em countdown no topo, recém-enviados embaixo
function SaindoAgora({fila=[], recentes=[], onVerDisparo}) {
  const [,setTick] = useState(0)
  useEffect(()=>{ const t=setInterval(()=>setTick(x=>x+1),30000); return ()=>clearInterval(t) },[])
  const eta = (iso) => {
    const s = Math.round((new Date(iso).getTime()-Date.now())/1000)
    if (s <= 0)   return {txt:'agora',   cor:T.green}
    if (s < 3600) return {txt:`em ${Math.max(1,Math.round(s/60))}m`, cor:T.amber}
    return {txt:`em ${Math.round(s/3600)}h`, cor:T.ink3}
  }
  const Linha = ({r, dir}) => {
    const gm = GATILHO_META[r.gatilho]||{}
    const sm = STATUS_META[r.status]||{}
    return (
      <div onClick={()=>onVerDisparo?.(r)} style={{display:'flex',alignItems:'center',gap:7,
        padding:'6px 9px',borderRadius:8,background:T.bg3,cursor:'pointer'}}>
        <span style={{width:6,height:6,borderRadius:'50%',background:gm.cor||T.ink3,flexShrink:0,
          boxShadow:dir==='out'?`0 0 6px ${gm.cor||T.ink3}`:'none'}}/>
        <span style={{fontSize:10.5,color:T.ink2,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',flex:1}}>
          {gm.label||r.gatilho} <span style={{color:T.ink4,fontWeight:400}}>#{r.numero_pedido}</span>
        </span>
        {dir==='out'
          ? <span style={{fontSize:10,fontWeight:700,color:eta(r.agendado_para).cor,whiteSpace:'nowrap'}}>{eta(r.agendado_para).txt}</span>
          : <span style={{fontSize:9.5,color:sm.cor||T.ink4,whiteSpace:'nowrap'}}>{tempoRel(r.criado_em)||''}</span>}
      </div>
    )
  }
  return (
    <div style={{background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:14,padding:'13px 14px'}}>
      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
        <Radio size={13} style={{color:T.cyan}}/>
        <span style={{fontSize:12,fontWeight:700,color:T.ink1}}>Saindo agora</span>
        <span style={{fontSize:9,color:T.ink4,marginLeft:'auto'}}>{fila.length} na fila</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:5}}>
        {fila.slice(0,4).map(r=><Linha key={`f${r.id}`} r={r} dir="out"/>)}
        {fila.length>0 && recentes.length>0 &&
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'2px 0'}}>
            <div style={{flex:1,height:1,background:T.sep2}}/>
            <span style={{fontSize:8.5,color:T.ink4}}>enviados</span>
            <div style={{flex:1,height:1,background:T.sep2}}/>
          </div>}
        {recentes.slice(0,4).map(r=><Linha key={`r${r.id}`} r={r} dir="in"/>)}
        {fila.length===0 && recentes.length===0 &&
          <div style={{fontSize:10.5,color:T.ink4,padding:'12px 0',textAlign:'center'}}>Sem movimentação recente</div>}
      </div>
    </div>
  )
}

function EventoCard({d, onReenviar, reenviados, setReenviados}) {
  const m = GATILHO_META[d.gatilho]||{label:d.gatilho,icon:Zap,cor:'#6b7280'}
  const s = STATUS_META[d.status]||STATUS_META.ignorado
  const DIc = m.icon||Zap
  const falhou = d.status==='erro'
  const ignorado = d.status==='ignorado'
  const jaReenv = reenviados.includes(d.id)
  const [enviando, setEnviando] = useState(false)
  const doReenviar = async () => {
    setEnviando(true)
    try { await onReenviar?.(d.id); setReenviados(r=>[...r,d.id]) } catch {}
    setEnviando(false)
  }
  return (
    <div style={{display:'flex',gap:12,padding:'12px 14px',borderRadius:12,
      background:falhou?'rgba(239,68,68,.04)':ignorado?'var(--bg-3)':'var(--bg-3)',
      border:`0.5px solid ${falhou?'rgba(239,68,68,.2)':'var(--sep)'}`,
      marginBottom:10}}>
      {/* ícone */}
      <div style={{width:36,height:36,borderRadius:10,flexShrink:0,
        background:`linear-gradient(135deg,${m.cor}25,${m.cor}10)`,
        border:`1.5px solid ${m.cor}35`,
        display:'flex',alignItems:'center',justifyContent:'center'}}>
        <DIc size={16} style={{color:m.cor}}/>
      </div>
      {/* conteúdo */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
          <span style={{fontSize:12.5,fontWeight:600,color:'var(--label)',lineHeight:1.3}}>{m.label}</span>
          <span style={{fontSize:10,color:'var(--label-4)',flexShrink:0,marginTop:1}}>{fmtDH(d.criado_em)}</span>
        </div>
        <div style={{fontSize:10.5,color:'var(--label-4)',marginTop:3}}>
          {d.template_nome&&d.template_nome!==d.gatilho?d.template_nome:d.gatilho}
          {d.numero_pedido&&<span style={{marginLeft:6,color:'var(--label-3)',fontWeight:500}}>· #{d.numero_pedido}</span>}
        </div>
        {d.erro_msg&&(
          <div style={{marginTop:6,padding:'5px 8px',borderRadius:6,background:'rgba(239,68,68,.08)',
            fontSize:10.5,color:'#ef4444',lineHeight:1.4}}>{d.erro_msg}</div>
        )}
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:7}}>
          {/* badge status */}
          <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',
            borderRadius:99,background:s.bg,border:`0.5px solid ${s.cor}30`}}>
            {React.createElement(s.icon,{size:8,style:{color:s.cor}})}
            <span style={{fontSize:9,fontWeight:700,color:s.cor,textTransform:'uppercase',letterSpacing:'.04em'}}>{s.label}</span>
          </span>
          {/* reenviar (erro) */}
          {falhou && (
            <button disabled={jaReenv||enviando} onClick={doReenviar} style={{
              display:'inline-flex',alignItems:'center',gap:4,padding:'2px 10px',borderRadius:99,
              border:`0.5px solid ${jaReenv?'#22c55e60':'#a78bfa60'}`,
              background:jaReenv?'rgba(34,197,94,.08)':'rgba(167,139,250,.08)',
              color:jaReenv?'#22c55e':'#a78bfa',cursor:jaReenv?'default':'pointer',
              fontSize:9.5,fontWeight:600}}>
              {enviando?<><RefreshCw size={9} style={{animation:'spin .7s linear infinite'}}/>Enviando...</>
               :jaReenv?<><CheckCircle size={9}/>Reenviado</>
               :<><RotateCcw size={9}/>Reenviar</>}
            </button>
          )}
          {/* enviar (ignorado) */}
          {ignorado && !jaReenv && (
            <button onClick={doReenviar} disabled={enviando} style={{
              display:'inline-flex',alignItems:'center',gap:4,padding:'2px 10px',borderRadius:99,
              border:'0.5px solid rgba(245,158,11,.5)',background:'rgba(245,158,11,.08)',
              color:'#f59e0b',cursor:'pointer',fontSize:9.5,fontWeight:600}}>
              {enviando?<><RefreshCw size={9} style={{animation:'spin .7s linear infinite'}}/>Enviando...</>
               :<><Send size={9}/>Enviar agora</>}
            </button>
          )}
          {ignorado && jaReenv && (
            <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:9.5,color:'#22c55e'}}>
              <CheckCircle size={9}/>Enviado
            </span>
          )}
        </div>
      </div>
    </div>
  )
}


// ─── MODAL WORLD-CLASS — Detalhe do Disparo & Perfil do Cliente ──────────────
// Keyframes injetados via <style> no render do modal

const MODAL_CSS = `
@keyframes drawLine  { from{stroke-dashoffset:200} to{stroke-dashoffset:0} }
@keyframes ringLoad  { from{stroke-dashoffset:220} to{stroke-dashoffset:var(--ring-end,55)} }
@keyframes scanline  { 0%{opacity:.08}50%{opacity:.03}100%{opacity:.08} }
@keyframes glowNode  { 0%,100%{box-shadow:0 0 6px rgba(255,179,0,.3)} 50%{box-shadow:0 0 14px rgba(255,179,0,.7)} }
@keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn    { from{opacity:0} to{opacity:1} }
@keyframes spin      { to{transform:rotate(360deg)} }
@keyframes slideIn   { from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
@keyframes pulse     { 0%,100%{opacity:1}50%{opacity:.35} }
.modal-wc {
  background: #0d1017;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 40px 100px rgba(0,0,0,.85), 0 0 0 1px rgba(255,255,255,.04) inset;
}
.modal-wc-sec { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,.05); }
.modal-wc-badge {
  display:inline-flex;align-items:center;gap:3px;padding:2px 9px;
  border-radius:99px;font-size:9.5px;font-weight:700;letter-spacing:.03em;
}
.modal-wc-btn-p {
  display:flex;align-items:center;justify-content:center;gap:7px;
  border-radius:11px;font-size:12px;font-weight:600;cursor:pointer;
  border:none;font-family:inherit;letter-spacing:-.01em;
  background:linear-gradient(135deg,#5b21b6,#9333ea);color:#fff;
  box-shadow:0 4px 16px rgba(147,51,234,.35);transition:all .18s;
}
.modal-wc-btn-p:hover { transform:translateY(-1px);box-shadow:0 8px 24px rgba(147,51,234,.5); }
.modal-wc-btn-p:active { transform:translateY(0); }
.modal-wc-btn-s {
  display:flex;align-items:center;justify-content:center;gap:7px;
  border-radius:11px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;
  background:rgba(255,255,255,.06);color:#b8bdd4;border:1px solid rgba(255,255,255,.08);
  transition:all .15s;
}
.modal-wc-btn-s:hover { background:rgba(255,255,255,.1);color:#eef0f6; }
.modal-wc-tl-row {
  display:flex;align-items:center;gap:9px;padding:7px 16px;
  border-bottom:1px solid rgba(255,255,255,.03);transition:background .1s;cursor:pointer;
}
.modal-wc-tl-row:hover { background:rgba(255,255,255,.025); }
.modal-wc-tl-row:last-child { border-bottom:none; }
.modal-wc-order-card {
  background:#111520;border:1px solid rgba(255,255,255,.05);border-radius:12px;
  padding:10px 12px;cursor:pointer;transition:all .15s;
}
.modal-wc-order-card:hover { border-color:rgba(255,255,255,.09);transform:translateY(-1px); }
.modal-wc-order-card.active { border-color:rgba(167,139,250,.35);background:rgba(167,139,250,.05); }
.modal-wc-env-btn {
  padding:3px 9px;border-radius:6px;background:rgba(167,139,250,.1);
  border:1px solid rgba(167,139,250,.25);color:#a78bfa;font-size:9.5px;font-weight:600;
  cursor:pointer;transition:all .12s;flex-shrink:0;
}
.modal-wc-env-btn:hover { background:rgba(167,139,250,.2); }
.modal-wc-diag-row {
  display:flex;align-items:center;gap:8px;padding:5px 10px;
  border-bottom:1px solid rgba(255,255,255,.03);
}
.modal-wc-diag-row:last-child { border:none; }
`

function DrawerDetalhe({ tipo, dados, api, onClose, onVerPedido, onFiltrarGatilho, onReenviar, stats, insights }) {
  const [cli, setCli]             = useState(null)
  const [loadCli, setLoad]        = useState(false)
  const [reenviados, setReenviados] = useState([])
  const [jaReenv,    setJaR]      = useState(false)
  const [enviandoR,  setEnvR]     = useState(false)
  const [selPed,     setSelPed]   = useState('todos')
  const [gatManual, setGatManual] = useState('')
  const [pedManual, setPedManual] = useState(dados?.numero_pedido||'')
  const [enviandoMan, setEnvMan]  = useState(false)
  const [envManOk, setEnvManOk]   = useState(false)
  const [ordemDisp, setOrdemDisp] = useState([])
  const [ringReady,  setRingReady] = useState(false)
  const [tplsCorpo,  setTplsCorpo] = useState(null)   // corpo dos templates p/ bolhas
  useEffect(()=>{ let on=true; _carregarTemplates(api).then(m=>{ if(on) setTplsCorpo(m) }); return ()=>{on=false} },[api])

  // Anima o ring do perfil após carregar (precisa de 1 frame para CSS transition funcionar)
  useEffect(() => {
    if (cli && !loadCli) {
      const t = setTimeout(() => setRingReady(true), 80)
      return () => clearTimeout(t)
    } else {
      setRingReady(false)
    }
  }, [cli, loadCli])

  useEffect(() => {
    if (tipo==='cliente' && dados?.telefone) {
      const ctrl = new AbortController()
      setLoad(true); setCli(null); setRingReady(false)

      fetch(`${api}/api/dashboard/disparos-cliente/${encodeURIComponent(dados.telefone)}`,
        { signal: ctrl.signal }
      )
        .then(r => r.json())
        .then(d => {
          if (ctrl.signal.aborted) return
          if (d && d.resumo) {
            setCli(d)
          } else if (d && Array.isArray(d.disparos)) {
            const dis = d.disparos
            const enviados  = dis.filter(x=>x.status==='enviado').length
            const erros     = dis.filter(x=>x.status==='erro').length
            const pedidos   = [...new Set(dis.map(x=>x.numero_pedido).filter(Boolean))]
            setCli({
              disparos: dis,
              resumo: {
                nome:           dis.find(x=>x.nome_cliente)?.nome_cliente || '',
                total:          dis.length,
                enviados, erros,
                ignorados:      dis.length - enviados - erros,
                pedidos,
                telefone:       dados.telefone,
                ultimo_contato: dis[0]?.criado_em || null,
              }
            })
          } else {
            setCli({ disparos:[], resumo:{ nome:'', total:0, enviados:0, erros:0, ignorados:0, pedidos:[], telefone:dados.telefone, ultimo_contato:null } })
          }
          setLoad(false)
        })
        .catch(e => {
          if (e?.name === 'AbortError') return
          setCli({ disparos:[], resumo:{ nome:'', total:0, enviados:0, erros:0, ignorados:0, pedidos:[], telefone:dados.telefone, ultimo_contato:null } })
          setLoad(false)
        })

      return () => ctrl.abort()
    }
    if (tipo==='disparo' && dados?.numero_pedido) {
      setOrdemDisp([])
      fetch(`${api}/api/dashboard/disparos-pedido/${dados.numero_pedido}`)
        .then(r=>r.json()).then(d=>setOrdemDisp(d.disparos||[])).catch(()=>{})
    }
    if (dados?.numero_pedido) setPedManual(dados.numero_pedido)
  }, [tipo, dados, api])

  const enviarManual = async () => {
    if (!gatManual || !dados?.telefone) return
    setEnvMan(true)
    try {
      await fetch(`${api}/api/dashboard/disparos-reenviar/manual`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ gatilho:gatManual, telefone:dados.telefone,
          numero_pedido:pedManual, nome_cliente:cli?.resumo?.nome||dados?.nome_cliente||'' })
      })
      setEnvManOk(true); setTimeout(()=>setEnvManOk(false), 3000)
    } catch {}
    setEnvMan(false)
  }

  const meta  = tipo==='disparo' ? (GATILHO_META[dados?.gatilho]||{label:dados?.gatilho,icon:Zap,cor:'#7c6af7'}) : null
  const smeta = tipo==='disparo' ? (STATUS_META[dados?.status]||STATUS_META.ignorado) : null

  return (
    <>
      <style>{MODAL_CSS}</style>

      {/* Overlay */}
      <div onClick={onClose} style={{
        position:'fixed',inset:0,zIndex:60,
        background:'rgba(0,0,0,.72)',
        backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',
        animation:'fadeIn .25s ease'
      }}/>

      {/* Side panel — desliza da direita */}
      <div className="modal-wc" style={{
        position:'fixed',
        top:0, right:0, bottom:0,
        width:'min(500px,96vw)',
        zIndex:61,
        display:'flex', flexDirection:'column',
        borderRadius:0,
        borderLeft:'1px solid rgba(255,255,255,.08)',
        animation:'slideIn .3s cubic-bezier(.2,.8,.2,1)',
        boxShadow:'-8px 0 60px rgba(0,0,0,.7), -24px 0 80px rgba(0,0,0,.4)',
      }}>

          {/* ══════════════════════════════════════
              MODAL 1 — DETALHE DO DISPARO
          ══════════════════════════════════════ */}
          {tipo==='disparo' && dados && (() => {
            const Ic    = meta?.icon || Zap
            const SIc   = smeta?.icon || Minus
            const isIgn = dados.status === 'ignorado'
            const isErr = dados.status === 'erro'
            const isOk  = dados.status === 'enviado'
            const isAg  = dados.status === 'aguardando'
            const gatInsight = (insights||[]).find(i=>i.gatilho===dados.gatilho)
            const tempoStr   = tempoRel(dados.criado_em) || fmtDH(dados.criado_em)
            const gatStats  = (stats?.porGatilho||[]).find(g=>g.gatilho===dados.gatilho)
            const envG      = parseInt(gatStats?.enviados||0)
            const errG      = parseInt(gatStats?.erros||0)
            const tentG     = envG + errG
            const taxaGat   = tentG > 0 ? Math.round(envG/tentG*100) : null
            const ativasMedia= (stats?.porGatilho||[]).filter(g=>{
              const e=parseInt(g.enviados||0),er=parseInt(g.erros||0); return (e+er)>0
            })
            const mediaSys = ativasMedia.length > 0
              ? Math.round(ativasMedia.reduce((acc,g)=>{
                  const e=parseInt(g.enviados||0),er=parseInt(g.erros||0),t=e+er
                  return t>0 ? acc+e/t*100 : acc
                },0)/ativasMedia.length)
              : null

            // Intelligence
            const intel = isIgn ? {
              sev:'critico',
              titulo:'Template inativo — cliente nunca notificado',
              msg: `${meta?.label} ${tempoStr} sem notificação.${
                gatInsight?.clientes ? ` Além deste, **${gatInsight.clientes}** pedidos nas últimas 2 semanas no mesmo estado.` : ''
              }`,
            } : isErr ? (()=>{
              // Diagnóstico acionável — motivo normalizado + próximo passo (Nivelmax)
              const em = (dados.erro_msg||'').toLowerCase()
              const diag =
                em.includes('132000')||em.includes('param') ? {t:'Parâmetros do template (Meta #132000)', a:'O nº de variáveis não bate com o template aprovado — ajuste o template na página Gatilhos e reenvie.'} :
                em.includes('cota')||em.includes('limit')||em.includes('131048')||em.includes('131056') ? {t:'Cota da Meta excedida', a:'Limite diário de conversas atingido — aguarde o reset (~24h do 1º envio) e use Reenviar.'} :
                em.includes('timeout')||em.includes('econn')||em.includes('network') ? {t:'Timeout / conexão', a:'Falha temporária de rede — o motor re-tenta sozinho até 3×; ou use Reenviar agora.'} :
                em.includes('telefone')||em.includes('phone')||em.includes('131026') ? {t:'Telefone inválido', a:'Número não tem WhatsApp ativo — confira o cadastro do cliente no Bling.'} :
                em.includes('inativ')||em.includes('não encontrado')||em.includes('nao encontrado') ? {t:'Template inativo ou ausente', a:'Ative o template na página Gatilhos e use Reenviar.'} :
                {t:'Erro de envio', a: dados.erro_msg || 'Falha na API WhatsApp — use Reenviar para tentar de novo.'}
              return { sev:'erro', titulo: diag.t, msg: diag.a }
            })() : isAg ? {
              sev:'aviso',
              titulo:'Aguardando envio',
              msg:`Agendado para +${dados.delay_min}min após o evento. Será enviado automaticamente.`,
            } : isOk ? {
              sev:'ok',
              titulo:'Entregue com sucesso',
              msg:'Mensagem enviada e entregue ao cliente.',
            } : null

            const intelCor = {
              critico:{ cor:'#ff4757', dim:'rgba(255,71,87,.06)',  bor:'rgba(255,71,87,.22)',  Icon:AlertTriangle },
              erro:   { cor:'#ff4757', dim:'rgba(255,71,87,.06)',  bor:'rgba(255,71,87,.22)',  Icon:XCircle },
              aviso:  { cor:'#ffb300', dim:'rgba(255,179,0,.06)',  bor:'rgba(255,179,0,.22)',  Icon:Clock },
              ok:     { cor:'#00e676', dim:'rgba(0,230,118,.06)',  bor:'rgba(0,230,118,.22)',  Icon:CheckCircle },
            }[intel?.sev] || { cor:T.ink3, dim:T.gray, bor:T.grayBor, Icon:Info }

            // ── Journey de Rastreio ─────────────────────────────────────────────────────
            // 5 etapas do ciclo de vida físico do pedido
            const JOURNEY = [
              {id:'pagamento_aprovado', alt:['pedido_criado'],                     lbl:'Pago',       icon:Check,   step:0},
              {id:'em_separacao',       alt:[],                                    lbl:'Separado',   icon:Package, step:1},
              {id:'pedido_enviado',     alt:['pedido_coletado'],                   lbl:'Enviado',    icon:Truck,   step:2},
              {id:'rastreio_em_transito',alt:['saiu_entrega','nao_entrou_unidade'],lbl:'Em Trânsito',icon:Radio,   step:3},
              {id:'pedido_entregue',    alt:['nao_entregue','pacote_devolvido'],   lbl:'Entregue',   icon:MapPin,  step:4},
            ]
            // Mapeia qualquer gatilho para um step (0-4) do ciclo
            const GATILHO_STEP = {
              'pedido_criado':0,'pagamento_aprovado':0,'pagamento_pendente':0,'pix_pendente':0,
              'em_separacao':1,'nfe_emitida':1,
              'pedido_enviado':2,'pedido_coletado':2,
              'rastreio_em_transito':3,'saiu_entrega':3,'nao_entrou_unidade':3,
              'tentativa_entrega':3,'endereco_incorreto':3,
              'pedido_entregue':4,'nao_entregue':4,'pacote_devolvido':4,'pedido_devolvido':4,
              'avaliar_pedido':4,
              // gatilhos pós-venda / especiais: assume início
              'reengajamento':0,'estorno_realizado':4,
            }
            const curStep = GATILHO_STEP[dados.gatilho] ?? 0  // fallback = step 0

            // Busca status / hora nos ordemDisp para todos os IDs de uma etapa
            const stSt   = sid => (ordemDisp||[]).find(x=>x.gatilho===sid)?.status || 'pendente'
            const stTime = sid => {
              const d = (ordemDisp||[]).find(x=>x.gatilho===sid)
              if (!d?.criado_em) return null
              return new Date(d.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
            }
            const stepStatus = st => {
              for (const id of [st.id,...(st.alt||[])]) {
                const s = stSt(id); if (s !== 'pendente') return s
              }; return 'pendente'
            }
            const stepTime = st => {
              for (const id of [st.id,...(st.alt||[])]) {
                const t = stTime(id); if (t) return t
              }; return null
            }

            const journeyStatus = isIgn
              ? `${new Date(dados.criado_em).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} · Sem notif.`
              : isErr
              ? `${new Date(dados.criado_em).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} · Erro no envio`
              : isOk
              ? `${new Date(dados.criado_em).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} · Entregue`
              : null

            const doR = async () => { setEnvR(true); try{ await onReenviar?.(dados.id); setJaR(true) }catch{}; setEnvR(false) }

            // Linha SVG: preenche proporcionalmente ao step atual
            // Para step=0 mostra pequeno trecho para indicar início do ciclo
            const lineProgress = Math.round((curStep / (JOURNEY.length-1)) * 200)

            return (
              <>
                {/* ─── HEADER GLASS com scanline ─── */}
                <div style={{
                  padding:'16px',flexShrink:0,
                  background:`linear-gradient(135deg,${meta?.cor}18 0%,#0c1520 55%)`,
                  borderBottom:`1px solid ${meta?.cor}20`,
                  position:'relative',overflow:'hidden'
                }}>
                  {/* scanline overlay */}
                  <div style={{
                    position:'absolute',inset:0,pointerEvents:'none',
                    backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 24px,${meta?.cor}05 24px,${meta?.cor}05 25px)`,
                    animation:'scanline 4s ease infinite'
                  }}/>
                  <div style={{position:'relative',display:'flex',alignItems:'flex-start',gap:13}}>
                    {/* Ícone do gatilho */}
                    <div style={{
                      width:44,height:44,borderRadius:13,flexShrink:0,
                      background:`${meta?.cor}18`,border:`1.5px solid ${meta?.cor}38`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      boxShadow:`0 4px 20px ${meta?.cor}25`
                    }}>
                      <Ic size={22} style={{color:meta?.cor}}/>
                    </div>
                    {/* Título + badges */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:16,fontWeight:700,color:'#eef0f6',
                        letterSpacing:'-.025em',marginBottom:7}}>
                        {meta?.label}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                        <span className="modal-wc-badge" style={{
                          background:`${smeta?.bg}`,color:smeta?.cor,border:`1px solid ${smeta?.cor}30`}}>
                          {React.createElement(SIc,{size:8})} {smeta?.label}
                        </span>
                        {(dados.origem==='rastreio_job'||dados.origem==='job')&&(
                          <span className="modal-wc-badge" style={{
                            background:'rgba(6,182,212,.1)',color:'#06b6d4',border:'1px solid rgba(6,182,212,.25)'}}>
                            job auto
                          </span>
                        )}
                        {dados.numero_pedido&&(
                          <span className="modal-wc-badge" style={{
                            background:'rgba(167,139,250,.12)',color:'#a78bfa',border:'1px solid rgba(167,139,250,.25)'}}>
                            #{dados.numero_pedido}
                          </span>
                        )}
                        {dados.nome_cliente&&(
                          <span className="modal-wc-badge" style={{
                            background:'rgba(251,146,60,.12)',color:'#fb923c',border:'1px solid rgba(251,146,60,.25)',
                            maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {dados.nome_cliente.split(' ').slice(0,2).join(' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Tempo + fechar */}
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:7,flexShrink:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:4,fontSize:9.5,color:'#3a3f5c'}}>
                        <span style={{width:5,height:5,borderRadius:'50%',background:'#3a3f5c',
                          animation:'pulse 2.5s ease-in-out infinite',display:'block'}}/>
                        {tempoStr}
                      </div>
                      <button onClick={onClose} style={{
                        padding:'4px 8px',borderRadius:7,
                        background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.08)',
                        color:'#6b7294',cursor:'pointer',fontSize:10.5,
                        display:'flex',alignItems:'center',gap:4
                      }}>
                        <X size={12}/> Esc
                      </button>
                    </div>
                  </div>
                </div>

                {/* ─── SCROLL ─── */}
                <div style={{flex:1,overflowY:'auto',minHeight:0}}>

                  {/* Mensagem real enviada — renderizada das variáveis salvas (v4) */}
                  <PreviewMensagem api={api} gatilho={dados.gatilho} variaveis={dados.variaveis} status={dados.status}/>

                  {/* Intelligence multi-nível */}
                  {intel && (() => {
                    const {cor,dim,bor,Icon} = intelCor
                    const renderMsg = (txt) => {
                      const parts = txt.split(/(\*\*[^*]+\*\*)/)
                      return parts.map((p,i)=>
                        p.startsWith('**')
                          ? <strong key={i} style={{color:cor}}>{p.slice(2,-2)}</strong>
                          : p
                      )
                    }
                    return (
                      <div className="modal-wc-sec" style={{display:'flex',flexDirection:'column',gap:8}}>
                        {/* Bloco crítico / aviso / ok */}
                        <div style={{borderRadius:10,padding:'11px 13px',background:dim,border:`1px solid ${bor}`,
                          display:'flex',gap:10,alignItems:'flex-start'}}>
                          <Icon size={17} style={{color:cor,flexShrink:0,marginTop:1}}/>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                              <span style={{fontSize:12,fontWeight:700,color:cor}}>{intel.titulo}</span>
                              <span style={{fontSize:8.5,color:cor,fontWeight:700,opacity:.7,
                                padding:'1px 6px',borderRadius:99,background:`${cor}15`,flexShrink:0,marginLeft:8}}>
                                {intel.sev==='critico'?'CRÍTICO':intel.sev==='erro'?'ERRO':intel.sev==='aviso'?'AVISO':'OK'}
                              </span>
                            </div>
                            <div style={{fontSize:11,color:'#b8bdd4',lineHeight:1.6,
                              marginBottom:(isIgn||isErr)?9:0}}>
                              {renderMsg(intel.msg)}
                            </div>
                            {(isIgn||isErr) && (
                              <div style={{display:'flex',gap:7}}>
                                <button className="modal-wc-btn-p" style={{padding:'6px 12px',fontSize:11}}>
                                  <Settings size={11}/>Ativar template ↗
                                </button>
                                <button disabled={jaReenv||enviandoR} onClick={doR}
                                  className="modal-wc-btn-s" style={{padding:'6px 12px',fontSize:11}}>
                                  {enviandoR
                                    ? <RefreshCw size={11} style={{animation:'spin .7s linear infinite'}}/>
                                    : jaReenv
                                    ? <><CheckCircle size={11} style={{color:'#00e676'}}/>Enviado!</>
                                    : <><Send size={11}/>Enviar agora</>}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Taxa vs média */}
                        {(taxaGat !== null || mediaSys !== null) && (
                          <div style={{borderRadius:9,padding:'8px 12px',
                            background:'rgba(79,142,247,.06)',border:'1px solid rgba(79,142,247,.18)',
                            display:'flex',alignItems:'center',gap:9}}>
                            <BarChart3 size={14} style={{color:'#4f8ef7',flexShrink:0}}/>
                            <span style={{fontSize:11,color:'#b8bdd4'}}>
                              Taxa de entrega este mês:{' '}
                              <strong style={{color:taxaGat===null?'#ff4757':taxaGat>=70?'#00e676':'#ffb300'}}>
                                {taxaGat===null?'0%':`${taxaGat}%`}
                              </strong>
                              {mediaSys!==null&&<>
                                {' '}·{' '}Média do sistema:{' '}
                                <strong style={{color:'#00e676'}}>{mediaSys}%</strong>
                              </>}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* Journey map com SVG animado */}
                  <div className="modal-wc-sec">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                      marginBottom:12,fontSize:9,color:'#6b7294',textTransform:'uppercase',letterSpacing:'.07em'}}>
                      <span style={{display:'flex',alignItems:'center',gap:5}}>
                        <span style={{fontFamily:'monospace',fontSize:13,lineHeight:1,color:'#6b7294',letterSpacing:'-1px'}}>⇌</span>
                        Jornada {dados.numero_pedido?`#${dados.numero_pedido}`:'do pedido'}
                      </span>
                      {journeyStatus&&(
                        <span style={{fontSize:9,fontWeight:600,letterSpacing:'.04em',
                          color:isIgn||isErr?'#ffb300':'#00e676'}}>
                          {journeyStatus}
                        </span>
                      )}
                    </div>
                    {/* Nós com conectores inline */}
                    <div style={{display:'flex',alignItems:'flex-start'}}>

                      {/* Nós com conector entre eles */}
                      {JOURNEY.map((st,si)=>{
                        const step       = st.step
                        const isDone     = step < curStep
                        const isCur      = step === curStep
                        const s          = stepStatus(st)
                        const time       = stepTime(st)

                        const nodeColor  = isDone             ? '#00e676'
                          : isCur && isOk                     ? '#00e676'
                          : isCur && (isIgn||isErr)           ? '#ffb300'
                          : 'rgba(255,255,255,.28)'

                        const nodeBg     = isDone             ? 'rgba(0,230,118,.16)'
                          : isCur && isOk                     ? 'rgba(0,230,118,.16)'
                          : isCur && (isIgn||isErr)           ? 'rgba(255,179,0,.16)'
                          : 'rgba(255,255,255,.05)'

                        const nodeBorder = isDone             ? 'rgba(0,230,118,.6)'
                          : isCur && isOk                     ? 'rgba(0,230,118,.6)'
                          : isCur && (isIgn||isErr)           ? '#ffb300'
                          : 'rgba(255,255,255,.15)'

                        const NdIc = isDone ? Check : st.icon

                        return (
                          <React.Fragment key={st.id}>
                            <div style={{display:'flex',flexDirection:'column',
                              alignItems:'center',gap:3,flexShrink:0,
                              width: si===0||si===JOURNEY.length-1 ? 42 : 44}}>
                              {/* Círculo nó */}
                              <div style={{
                                width:28,height:28,borderRadius:'50%',
                                background:nodeBg,
                                border:`2px solid ${nodeBorder}`,
                                display:'flex',alignItems:'center',justifyContent:'center',
                                boxShadow:isDone||isOk?`0 0 14px ${nodeColor}40`:undefined,
                                animation:isCur&&(isIgn||isErr)?'glowNode 2s ease-in-out infinite':undefined,
                                position:'relative',zIndex:1,
                                transition:'all .4s ease',flexShrink:0
                              }}>
                                <NdIc size={isDone?11:12} style={{color:nodeColor}}/>
                              </div>
                              {/* Label */}
                              <span style={{fontSize:8,textAlign:'center',lineHeight:1.3,
                                color:isDone||isCur?nodeColor:'rgba(255,255,255,.3)',
                                fontWeight:isCur?700:isDone?600:400,
                                maxWidth:44,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                {st.lbl}
                              </span>
                              {isCur&&isIgn&&(
                                <span style={{fontSize:7,color:'rgba(255,179,0,.65)',fontWeight:600,
                                  textAlign:'center',lineHeight:1.1}}>sem notif.</span>
                              )}
                              {time&&(
                                <span style={{fontSize:7.5,color:'#3a3f5c',fontFamily:'monospace'}}>
                                  {time}
                                </span>
                              )}
                            </div>
                            {/* Conector horizontal entre nós */}
                            {si < JOURNEY.length-1 && (
                              <div style={{flex:1,height:2,alignSelf:'flex-start',
                                marginTop:13,flexShrink:0,borderRadius:99,
                                background: step < curStep
                                  ? 'linear-gradient(90deg,rgba(0,230,118,.7),rgba(0,230,118,.4))'
                                  : 'rgba(255,255,255,.07)'
                              }}/>
                            )}
                          </React.Fragment>
                        )
                      })}

                    </div>
                  </div>

                  {/* Tempos da jornada — timestamps e durações reais (Nivelmax) */}
                  {(()=>{
                    if (!ordemDisp?.length) return null
                    const minPor = {}
                    for (const d of ordemDisp) {
                      if (d.status!=='enviado') continue
                      const st = GATILHO_STEP[d.gatilho]; if (st===undefined) continue
                      const t = new Date(d.criado_em).getTime()
                      if (!minPor[st] || t < minPor[st]) minPor[st] = t
                    }
                    const steps = Object.keys(minPor).map(Number).sort((a,b)=>a-b)
                    if (steps.length < 2) return null
                    const fmtD = ms => { const d = ms/86400000
                      return d >= 1 ? `+${d.toFixed(1).replace('.',',')}d` : `+${Math.max(1,Math.round(ms/3600000))}h` }
                    const fmtT = t => new Date(t).toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','') + ' ' +
                      new Date(t).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
                    return (
                      <div className="modal-wc-sec" style={{padding:'8px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:6,
                          fontSize:9.5,color:'#6b7294'}}>
                          {steps.map((st,i)=>(
                            <React.Fragment key={st}>
                              {i>0 && <span style={{color:'#00e676',fontWeight:700,fontSize:9.5}}>
                                {fmtD(minPor[st]-minPor[steps[i-1]])} →</span>}
                              <span>
                                <span style={{color:'#b8bdd4',fontWeight:600}}>{JOURNEY[st]?.lbl||`Etapa ${st}`}</span>{' '}
                                <span style={{fontFamily:'monospace',fontSize:9}}>{fmtT(minPor[st])}</span>
                              </span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Tentativas deste gatilho — prova do retry do motor (Nivelmax) */}
                  {(()=>{
                    const tent = (ordemDisp||[]).filter(d=>d.gatilho===dados.gatilho)
                      .sort((a,b)=>new Date(a.criado_em)-new Date(b.criado_em))
                    if (tent.length < 2) return null
                    return (
                      <div className="modal-wc-sec" style={{padding:'8px 16px'}}>
                        <div style={{fontSize:9,color:'#6b7294',textTransform:'uppercase',
                          letterSpacing:'.07em',marginBottom:6}}>Tentativas deste gatilho</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:5,alignItems:'center'}}>
                          {tent.map((d,i)=>{
                            const ok = d.status==='enviado'
                            const hora = new Date(d.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
                            return (
                              <React.Fragment key={d.id||i}>
                                {i>0 && <span style={{color:'#3a3f5c',fontSize:9}}>·</span>}
                                <span style={{fontSize:10,fontWeight:600,
                                  color: ok?'#00e676':d.status==='erro'?'#ff4757':'#ffb300'}}>
                                  {ok?'✓':d.status==='erro'?'✕':'…'} {hora} {d.status}
                                  {ok && i>0 && tent.slice(0,i).some(x=>x.status==='erro') &&
                                    <span style={{color:'#6b7294',fontWeight:400}}> (retry do motor)</span>}
                                </span>
                              </React.Fragment>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Diagnóstico técnico colapsável */}
                  <div className="modal-wc-sec" style={{padding:'10px 16px'}}>
                    <details>
                      <summary style={{
                        cursor:'pointer',listStyle:'none',userSelect:'none',
                        display:'flex',alignItems:'center',justifyContent:'space-between',
                        fontSize:9.5,color:'#6b7294',textTransform:'uppercase',letterSpacing:'.07em'
                      }}>
                        <span style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{fontFamily:'monospace',fontSize:11,color:'#6b7294',
                            letterSpacing:'-1px',lineHeight:1}}>{'>'}_</span>
                          Diagnóstico técnico
                        </span>
                        <ChevronDown size={11}/>
                      </summary>
                      <div style={{marginTop:9,borderRadius:9,overflow:'hidden',
                        border:'1px solid rgba(255,255,255,.05)'}}>
                        {[
                          {l:'Template',  v:dados.template_nome||dados.gatilho, ok:true},
                          {l:'Gatilho',   v:dados.gatilho,                      ok:true},
                          {l:'Origem',    v:dados.origem||'bling',              ok:true},
                          {l:'Status',    v:dados.status,                       ok:dados.status==='enviado'},
                          {l:'Erro',      v:dados.erro_msg||'—',               ok:!dados.erro_msg},
                          {l:'Delay',     v:dados.delay_min>0?`+${dados.delay_min}min`:'imediato', ok:true},
                        ].map((f,i)=>(
                          <div key={i} className="modal-wc-diag-row"
                            style={{background:i%2===0?'#111520':'#0d1017'}}>
                            <div style={{width:5,height:5,borderRadius:'50%',flexShrink:0,
                              background:f.ok?'#00e676':'#ff4757'}}/>
                            <span style={{fontSize:10.5,color:'#b8bdd4',flex:1}}>{f.l}</span>
                            <span style={{fontSize:10.5,color:f.ok?'#6b7294':'#ff4757',
                              fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',
                              whiteSpace:'nowrap',maxWidth:180}}>{f.v}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>

                  {/* Grid 2×2 */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,
                    background:'rgba(255,255,255,.05)',margin:'0 14px 12px',
                    borderRadius:11,overflow:'hidden',border:'1px solid rgba(255,255,255,.05)'}}>
                    {[
                      {l:'CLIENTE',       v:dados.nome_cliente||'—',   bg:'#111520'},
                      {l:'TELEFONE',      v:fmtTel(dados.telefone||''), bg:'#111520', mono:true},
                      {l:'DATA / DELAY',  v:`${fmtDH(dados.criado_em)} · ${dados.delay_min>0?`+${dados.delay_min}min`:'imediato'}`, bg:'#08090f'},
                      {l:'ID DO REGISTRO',v:`#${dados.id||'—'}`,        bg:'#08090f', col:'#a78bfa'},
                    ].map((f,i)=>(
                      <div key={i} style={{padding:'9px 12px',background:f.bg,
                        display:'flex',flexDirection:'column',gap:2}}>
                        <span style={{fontSize:9,color:'#6b7294',textTransform:'uppercase',
                          letterSpacing:'.06em'}}>{f.l}</span>
                        <span style={{fontSize:12,color:f.col||'#eef0f6',
                          fontFamily:f.mono?'monospace':'inherit',
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {f.v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ─── ACTIONS FOOTER ─── */}
                <div style={{flexShrink:0,padding:'12px 14px',
                  borderTop:'1px solid rgba(255,255,255,.05)',
                  background:'#0d1017',display:'flex',flexDirection:'column',gap:8}}>
                  <button disabled={jaReenv||enviandoR} onClick={doR}
                    className="modal-wc-btn-p" style={{width:'100%',padding:12}}>
                    {enviandoR
                      ? <><RefreshCw size={13} style={{animation:'spin .7s linear infinite'}}/>Enviando...</>
                      : jaReenv
                      ? <><CheckCircle size={13}/>Mensagem enviada!</>
                      : <><Send size={13}/>Enviar mensagem agora</>}
                  </button>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                    <button onClick={()=>onVerPedido?.(dados.numero_pedido)}
                      className="modal-wc-btn-s" style={{padding:10}}>
                      <ExternalLink size={12}/>Ver pedido
                    </button>
                    <button onClick={()=>onFiltrarGatilho?.('__cliente__',dados.telefone)}
                      style={{padding:10,borderRadius:11,fontSize:12,fontWeight:600,cursor:'pointer',
                        background:'rgba(167,139,250,.1)',color:'#a78bfa',
                        border:'1px solid rgba(167,139,250,.22)',fontFamily:'inherit',
                        display:'flex',alignItems:'center',justifyContent:'center',gap:7,
                        transition:'all .15s'}}>
                      <Users size={12}/>Perfil
                    </button>
                    <button onClick={()=>{ try{navigator.clipboard.writeText(dados.telefone||'')}catch{} }}
                      className="modal-wc-btn-s" style={{padding:10}}>
                      <Hash size={12}/>Copiar tel
                    </button>
                  </div>
                </div>
              </>
            )
          })()}


          {/* ══════════════════════════════════════
              MODAL 2 — PERFIL DO CLIENTE
          ══════════════════════════════════════ */}
          {tipo==='cliente' && (() => {
            const total     = cli?.resumo?.total    || 0
            const enviados  = cli?.resumo?.enviados || 0
            const erros     = cli?.resumo?.erros    || 0
            const ignorados = total - enviados - erros
            const pedidos   = cli?.resumo?.pedidos  || []

            const score   = total > 0 ? Math.round(enviados / total * 100) : 0
            const CIRC    = 138
            const dashOff = Math.round(CIRC * (1 - score / 100))
            const rCor    = score > 70 ? '#00e676' : score > 30 ? '#ffb300' : '#ff4757'
            const rDim    = score > 70 ? T.greenDim : score > 30 ? T.amberDim : T.redDim
            const rBor    = score > 70 ? T.greenBor : score > 30 ? T.amberBor : T.redBor
            const scLbl   = score === 0 ? 'Crítico' : score < 30 ? 'Em risco' : score < 70 ? 'Atenção' : 'Saudável'

            const STAGES = [
              {id:'pedido_criado',      lbl:'Criado'},
              {id:'pagamento_aprovado', lbl:'Pago'},
              {id:'em_separacao',       lbl:'Sep.'},
              {id:'pedido_enviado',     lbl:'Enviado'},
              {id:'pedido_entregue',    lbl:'Entregue'},
            ]
            const stFor = (pid, sid) => {
              const d = (cli?.disparos||[]).find(x=>String(x.numero_pedido)===String(pid)&&x.gatilho===sid)
              return d ? d.status : 'pendente'
            }
            const ndCor2 = s => s==='enviado'?'#00e676':s==='ignorado'?'#ffb300':s==='erro'?'#ff4757':null
            const ndBor2 = s => s==='enviado'?'rgba(0,230,118,.45)':s==='ignorado'?'rgba(255,179,0,.5)':s==='erro'?'rgba(255,71,87,.4)':'rgba(255,255,255,.1)'
            const ndDim2 = s => s==='enviado'?'rgba(0,230,118,.12)':s==='ignorado'?'rgba(255,179,0,.1)':s==='erro'?'rgba(255,71,87,.1)':'rgba(255,255,255,.04)'
            const ndIco2 = s => s==='enviado'?Check:s==='ignorado'?AlertTriangle:s==='erro'?XCircle:null

            // Insight
            const todasIgn  = total > 0 && ignorados === total
            const nomeFirst = (cli?.resumo?.nome||'Este cliente').split(' ')[0]
            const maisIgnMap= (cli?.disparos||[]).reduce((acc,d)=>{
              if (d.status==='ignorado') acc[d.gatilho]=(acc[d.gatilho]||0)+1
              return acc
            },{})
            const gatMaisIgn = Object.entries(maisIgnMap).sort((a,b)=>b[1]-a[1])[0]?.[0]
            const insightTxt = todasIgn
              ? `${nomeFirst} nunca recebeu uma mensagem — ${pedidos.length} pedido${pedidos.length>1?'s':''}, 0 notificações.`
              : erros > 0
              ? `${erros} erro${erros>1?'s':''} de envio para ${nomeFirst}. Verifique a API WhatsApp.`
              : score < 50
              ? `Taxa de entrega baixa (${score}%) para ${nomeFirst}. Revise os templates ativos.`
              : null
            const insightRich = todasIgn && gatMaisIgn ? {nomeFirst, pedidos:pedidos.length, gatilho:gatMaisIgn} : null

            // Timeline
            const dispFilt = selPed==='todos'
              ? (cli?.disparos||[])
              : (cli?.disparos||[]).filter(d=>String(d.numero_pedido)===String(selPed))
            const grpMap = {}
            dispFilt.forEach(d => {
              const dt  = new Date(d.criado_em)
              const hoje= new Date()
              const ont = new Date(hoje); ont.setDate(hoje.getDate()-1)
              const k   = dt.toDateString()===hoje.toDateString() ? 'Hoje'
                : dt.toDateString()===ont.toDateString() ? 'Ontem'
                : dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
              ;(grpMap[k] = grpMap[k]||[]).push(d)
            })
            const grps = Object.entries(grpMap)

            return (
              <>
                {/* ─── HERO com anel de saúde ─── */}
                <div style={{
                  padding:'14px 16px',flexShrink:0,
                  background:'linear-gradient(135deg,#0e0830,#160d4a,#111520)',
                  borderBottom:'1px solid rgba(167,139,250,.1)'
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:13}}>
                    {/* Ring SVG animado */}
                    <div style={{position:'relative',width:54,height:54,flexShrink:0}}>
                      <svg width="54" height="54" viewBox="0 0 54 54"
                        aria-label={`Saúde do cliente: ${score}%`}>
                        <circle cx="27" cy="27" r="22" fill="none"
                          stroke="rgba(255,255,255,.06)" strokeWidth="4.5"/>
                        <circle cx="27" cy="27" r="22" fill="none"
                          stroke={rCor} strokeWidth="4.5"
                          strokeDasharray={`${CIRC}`}
                          strokeLinecap="round"
                          transform="rotate(-90 27 27)"
                          style={{
                            transition:'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1) .1s',
                            strokeDashoffset: ringReady ? dashOff : CIRC
                          }}/>
                      </svg>
                      <div style={{position:'absolute',inset:0,display:'flex',
                        flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                        <span style={{fontSize:13,fontWeight:700,color:rCor,lineHeight:1}}>{score}%</span>
                        <span style={{fontSize:7,color:'#3a3f5c',marginTop:1}}>{scLbl}</span>
                      </div>
                    </div>
                    {/* Nome + info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:700,color:'#eef0f6',
                        letterSpacing:'-.025em',marginBottom:3}}>
                        {loadCli
                          ? (dados?.nome_cliente || '...')
                          : (cli?.resumo?.nome || dados?.nome_cliente || 'Cliente')}
                      </div>
                      <div style={{fontSize:10.5,color:'#6b7294',fontFamily:'monospace',marginBottom:6}}>
                        {fmtTel(dados.telefone)}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
                        {!loadCli && (()=>{
                          // Telefone validado = nenhum erro de número no histórico (Nivelmax)
                          const telRuim = (cli?.disparos||[]).some(d=>{
                            const em=(d.erro_msg||'').toLowerCase()
                            return em.includes('131026')||em.includes('telefone')||em.includes('phone')
                          })
                          const temEnvio = enviados>0
                          if (telRuim) return (
                            <span style={{fontSize:9.5,padding:'2px 9px',borderRadius:99,
                              background:'rgba(255,71,87,.12)',color:'#ff4757',
                              border:'1px solid rgba(255,71,87,.22)',fontWeight:600}}>
                              ⚠ telefone com falhas
                            </span>)
                          if (temEnvio) return (
                            <span style={{fontSize:9.5,padding:'2px 9px',borderRadius:99,
                              background:'rgba(0,230,118,.1)',color:'#00e676',
                              border:'1px solid rgba(0,230,118,.22)',fontWeight:600}}>
                              ✓ tel validado
                            </span>)
                          return null
                        })()}
                        {score===0&&!loadCli&&(
                          <span style={{fontSize:9.5,padding:'2px 9px',borderRadius:99,
                            background:'rgba(255,71,87,.12)',color:'#ff4757',
                            border:'1px solid rgba(255,71,87,.22)',fontWeight:600}}>
                            Cliente em risco
                          </span>
                        )}
                        {cli?.resumo?.ultimo_contato&&(
                          <span style={{fontSize:9.5,color:'#3a3f5c',
                            display:'flex',alignItems:'center',gap:4}}>
                            <Clock size={10}/>
                            {tempoRel(cli.resumo.ultimo_contato)||fmtDH(cli.resumo.ultimo_contato)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={onClose} style={{
                      width:28,height:28,borderRadius:8,flexShrink:0,alignSelf:'flex-start',
                      background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.1)',
                      color:'#6b7294',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'
                    }}>
                      <X size={13}/>
                    </button>
                  </div>
                </div>

                {/* ─── STATS 4 colunas — relacionamento (Nivelmax) ─── */}
                {!loadCli && cli && (()=>{
                  const tentC  = enviados + erros
                  const taxaC  = tentC > 0 ? Math.round(enviados/tentC*100) : null
                  const ultimo = (cli?.disparos||[])[0]?.criado_em
                  const ultStr = ultimo ? (tempoRel(ultimo)||'—').replace('há ','') : '—'
                  return (
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',
                    flexShrink:0,borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                    {[
                      {lbl:'Pedidos',     val:pedidos.length, cor:'#a78bfa'},
                      {lbl:'Disparos',    val:total,          cor:'#eef0f6'},
                      {lbl:'Taxa entrega',val:taxaC===null?'—':`${taxaC}%`, cor:taxaC===null?'#6b7294':taxaC>=90?'#00e676':taxaC>=70?'#ffb300':'#ff4757'},
                      {lbl:'Últ. contato',val:ultStr,         cor:'#4f8ef7', small:true},
                    ].map((s,i)=>(
                      <div key={i} style={{padding:'10px 0',textAlign:'center',
                        borderRight:i<3?'1px solid rgba(255,255,255,.04)':'none'}}>
                        <div style={{fontSize:s.small?13:22,fontWeight:700,color:s.cor,
                          letterSpacing:'-.03em',lineHeight:s.small?1.7:1}}>{s.val}</div>
                        <div style={{fontSize:8,color:'#6b7294',textTransform:'uppercase',
                          letterSpacing:'.05em',marginTop:3}}>{s.lbl}</div>
                      </div>
                    ))}
                  </div>
                  )
                })()}

                {/* ─── Pressão de mensagens — anti-fadiga (Nivelmax) ─── */}
                {!loadCli && cli && (()=>{
                  const seteD = Date.now() - 7*86400000
                  const msgs7 = (cli?.disparos||[]).filter(d=>d.status==='enviado' && new Date(d.criado_em).getTime()>seteD).length
                  const nivel = msgs7<=3 ? {cor:'#00e676',dim:T.greenDim,lbl:'saudável — espaço para comunicar'}
                            : msgs7<=6 ? {cor:'#ffb300',dim:T.amberDim,lbl:'moderado — evite disparos promocionais esta semana'}
                            :            {cor:'#ff4757',dim:T.redDim,  lbl:'alto — risco de fadiga, só transacionais essenciais'}
                  const pct = Math.min(100, Math.round(msgs7/8*100))
                  return (
                    <div style={{padding:'9px 16px',flexShrink:0,borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:8.5,color:'#6b7294',textTransform:'uppercase',
                          letterSpacing:'.06em',whiteSpace:'nowrap'}}>Pressão de msgs</span>
                        <div style={{flex:1,height:5,background:T.bg4,borderRadius:99,overflow:'hidden'}}>
                          <div style={{width:`${pct}%`,height:'100%',background:nivel.cor,borderRadius:99,
                            boxShadow:`0 0 6px ${nivel.cor}60`,transition:'width .4s'}}/>
                        </div>
                        <span style={{fontSize:10,fontWeight:700,color:nivel.cor,whiteSpace:'nowrap'}}>{msgs7} / 7d</span>
                      </div>
                      <div style={{fontSize:8.5,color:'#6b7294',marginTop:3}}>{nivel.lbl}</div>
                    </div>
                  )
                })()}

                {/* ─── Pedido ativo — jornada em dots (Nivelmax) ─── */}
                {!loadCli && cli && pedidos.length>0 && (()=>{
                  const STEP_CLI = {
                    pedido_criado:0,pagamento_aprovado:0,pagamento_pendente:0,pix_pendente:0,
                    em_separacao:1,nfe_emitida:1,produto_embalado:1,
                    pedido_enviado:2,pedido_coletado:2,
                    rastreio_em_transito:3,saiu_entrega:3,tentativa_entrega:3,nao_entrou_unidade:3,endereco_incorreto:3,
                    pedido_entregue:4,nao_entregue:4,pacote_devolvido:4,avaliar_pedido:4,
                  }
                  const pedAtivo = String(pedidos[0])
                  const dispPed  = (cli?.disparos||[]).filter(d=>String(d.numero_pedido)===pedAtivo && d.status==='enviado')
                  if (!dispPed.length) return null
                  const cur = Math.max(...dispPed.map(d=>STEP_CLI[d.gatilho] ?? -1))
                  if (cur < 0) return null
                  const LBLS = ['Pago','Separado','Enviado','Trânsito','Entregue']
                  return (
                    <div style={{padding:'9px 16px',flexShrink:0,borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                        <span style={{fontSize:8.5,color:'#6b7294',textTransform:'uppercase',letterSpacing:'.06em'}}>
                          Pedido ativo #{pedAtivo}
                        </span>
                        <span style={{fontSize:9,fontWeight:700,color:cur>=4?'#00e676':'#4f8ef7'}}>{LBLS[cur]}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center'}}>
                        {LBLS.map((_,i)=>(
                          <React.Fragment key={i}>
                            {i>0 && <div style={{flex:1,height:2,background:i<=cur?'#00e676':'rgba(255,255,255,.07)'}}/>}
                            <span style={{width:8,height:8,borderRadius:'50%',flexShrink:0,
                              background:i<cur?'#00e676':i===cur?'#4f8ef7':'rgba(255,255,255,.12)',
                              boxShadow:i===cur?'0 0 8px #4f8ef7':'none',
                              outline:i===cur?'3px solid rgba(79,142,247,.18)':'none'}}/>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* ─── SCROLL ─── */}
                <div style={{flex:1,overflowY:'auto',minHeight:0}}>
                  {loadCli && (
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',
                      gap:10,padding:'48px 0',color:'#6b7294'}}>
                      <RefreshCw size={18} style={{animation:'spin 1s linear infinite',color:'#a78bfa'}}/>
                      <span style={{fontSize:12}}>Carregando histórico...</span>
                    </div>
                  )}

                  {cli && (<>
                    {/* Insight */}
                    {insightTxt && (
                      <div className="modal-wc-sec">
                        <div style={{borderRadius:10,padding:'11px 13px',
                          background:'rgba(255,179,0,.05)',border:'1px solid rgba(255,179,0,.18)',
                          display:'flex',gap:11,alignItems:'flex-start'}}>
                          <div style={{width:32,height:32,borderRadius:9,flexShrink:0,
                            background:'rgba(255,179,0,.15)',border:'1px solid rgba(255,179,0,.25)',
                            display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <Brain size={17} style={{color:'#ffb300'}}/>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:700,color:'#ffb300',marginBottom:5}}>
                              {insightRich
                                ? `${insightRich.nomeFirst} nunca recebeu uma mensagem`
                                : 'Inteligência do cliente'}
                            </div>
                            <div style={{fontSize:11,color:'#b8bdd4',lineHeight:1.65,marginBottom:9}}>
                              {insightRich ? (
                                <span>
                                  {insightRich.pedidos} pedido{insightRich.pedidos>1?'s':''} entregues, 0 notificações. O template{' '}
                                  <code style={{fontSize:10.5,padding:'1px 5px',borderRadius:4,
                                    background:'rgba(255,255,255,.08)',color:'#eef0f6',fontFamily:'monospace'}}>
                                    {insightRich.gatilho}
                                  </code>{' '}está inativo.
                                </span>
                              ) : insightTxt}
                            </div>
                            <button onClick={async()=>{
                              const alvo=(cli?.disparos||[]).filter(d=>d.status==='ignorado'||d.status==='erro')
                              for(const d of alvo) await onReenviar?.(d.id)
                            }} className="modal-wc-btn-p" style={{padding:'6px 13px',fontSize:11}}>
                              <Zap size={11}/>Corrigir e reenviar tudo ↗
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order cards */}
                    {pedidos.length > 0 && (
                      <div className="modal-wc-sec" style={{padding:'10px 14px'}}>
                        <div style={{fontSize:9,color:'#6b7294',textTransform:'uppercase',
                          letterSpacing:'.07em',marginBottom:9}}>
                          Pedidos · toque para filtrar
                        </div>

                        {/* Card grande: mais recente */}
                        {(() => {
                          const p0 = pedidos[0]
                          const isActive = selPed===String(p0)
                          const disp0 = (cli.disparos||[]).filter(d=>String(d.numero_pedido)===String(p0))
                          const env0  = disp0.filter(d=>d.status==='enviado').length
                          return (
                            <div className={`modal-wc-order-card${isActive?' active':''}`}
                              onClick={()=>setSelPed(isActive?'todos':String(p0))}
                              style={{marginBottom:7}}>
                              <div style={{display:'flex',alignItems:'center',
                                justifyContent:'space-between',marginBottom:8}}>
                                <span style={{fontSize:12,fontWeight:700,
                                  color:isActive?'#a78bfa':'#b8bdd4'}}>#{p0}</span>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <span className="modal-wc-badge" style={{
                                    background:env0>0?'rgba(0,230,118,.1)':'rgba(255,71,87,.1)',
                                    color:env0>0?'#00e676':'#ff4757',
                                    border:`1px solid ${env0>0?'rgba(0,230,118,.2)':'rgba(255,71,87,.2)'}`}}>
                                    {env0}/{disp0.length} enviados
                                  </span>
                                </div>
                              </div>
                              {/* Mini journey visual */}
                              <div style={{display:'flex',alignItems:'center',gap:0}}>
                                {STAGES.map((st,si)=>{
                                  const s  = stFor(p0,st.id)
                                  const Ic = ndIco2(s)
                                  return (
                                    <React.Fragment key={st.id}>
                                      <div style={{display:'flex',flexDirection:'column',
                                        alignItems:'center',gap:2,flex:1}}>
                                        <div style={{width:18,height:18,borderRadius:'50%',
                                          background:ndDim2(s),border:`1.5px solid ${ndBor2(s)}`,
                                          display:'flex',alignItems:'center',justifyContent:'center'}}>
                                          {Ic&&<Ic size={8} style={{color:ndCor2(s)}}/>}
                                        </div>
                                        <span style={{fontSize:7,color:ndCor2(s)||'#3a3f5c',textAlign:'center'}}>
                                          {st.lbl}
                                        </span>
                                      </div>
                                      {si<STAGES.length-1&&(
                                        <div style={{height:1,width:8,flexShrink:0,marginBottom:14,
                                          background:ndCor2(stFor(p0,st.id))?`${ndCor2(stFor(p0,st.id))}40`:'rgba(255,255,255,.06)'}}/>
                                      )}
                                    </React.Fragment>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })()}

                        {/* Cards menores: outros pedidos */}
                        {pedidos.length > 1 && (
                          <div style={{display:'grid',
                            gridTemplateColumns:`repeat(${Math.min(pedidos.slice(1).length,2)},1fr)`,gap:7}}>
                            {pedidos.slice(1,3).map(p=>{
                              const isA = selPed===String(p)
                              const disp = (cli.disparos||[]).filter(d=>String(d.numero_pedido)===String(p))
                              const envP = disp.filter(d=>d.status==='enviado').length
                              return (
                                <div key={p} className={`modal-wc-order-card${isA?' active':''}`}
                                  onClick={()=>setSelPed(isA?'todos':String(p))}
                                  style={{padding:'8px 10px'}}>
                                  <div style={{display:'flex',alignItems:'center',
                                    justifyContent:'space-between',marginBottom:5}}>
                                    <span style={{fontSize:11,fontWeight:700,
                                      color:isA?'#a78bfa':'#6b7294'}}>#{p}</span>
                                    <span style={{fontSize:9,color:envP>0?'#00e676':'#ff4757'}}>
                                      {envP}/{disp.length}
                                    </span>
                                  </div>
                                  <div style={{display:'flex',alignItems:'center',gap:2}}>
                                    {STAGES.map((st,si)=>{
                                      const s=stFor(p,st.id)
                                      return (
                                        <React.Fragment key={st.id}>
                                          <div style={{width:9,height:9,borderRadius:'50%',
                                            background:ndDim2(s),border:`1px solid ${ndBor2(s)}`,flexShrink:0}}/>
                                          {si<STAGES.length-1&&<div style={{flex:1,height:1,
                                            background:ndCor2(s)?`${ndCor2(s)}35`:'rgba(255,255,255,.05)'}}/>}
                                        </React.Fragment>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {pedidos.length > 1 && (
                          <button onClick={()=>setSelPed('todos')}
                            style={{marginTop:7,width:'100%',padding:'5px',borderRadius:8,fontSize:10.5,
                              cursor:'pointer',fontFamily:'inherit',transition:'all .15s',
                              border:`1px solid ${selPed==='todos'?'rgba(167,139,250,.3)':'rgba(255,255,255,.05)'}`,
                              background:selPed==='todos'?'rgba(167,139,250,.08)':'transparent',
                              color:selPed==='todos'?'#a78bfa':'#6b7294',fontWeight:selPed==='todos'?600:400}}>
                            Todos os pedidos ({pedidos.length})
                          </button>
                        )}
                      </div>
                    )}

                    {/* Timeline ultra-compacta agrupada */}
                    <div>
                      {grps.length===0 && (
                        <div style={{padding:'32px 0',textAlign:'center',color:'#6b7294'}}>
                          <MessageSquare size={22} style={{opacity:.2,marginBottom:8}}/>
                          <div style={{fontSize:12}}>Nenhum disparo para este pedido</div>
                        </div>
                      )}
                      {grps.map(([dt,evts])=>(
                        <div key={dt}>
                          {/* Cabeçalho de data */}
                          <div style={{padding:'6px 16px 4px',display:'flex',
                            alignItems:'center',justifyContent:'space-between',
                            position:'sticky',top:0,zIndex:2,
                            background:'#0d1017',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                            <span style={{fontSize:8.5,color:'#3a3f5c',textTransform:'uppercase',
                              letterSpacing:'.07em',display:'flex',alignItems:'center',gap:5}}>
                              <Clock size={9}/>
                              {dt}{selPed!=='todos'?` · #${selPed}`:''} · {evts.length} evento{evts.length>1?'s':''}
                            </span>
                            {evts.some(d=>d.status==='ignorado'||d.status==='erro')&&(
                              <button onClick={async()=>{
                                const al=evts.filter(d=>d.status==='ignorado'||d.status==='erro')
                                for(const d of al) await onReenviar?.(d.id)
                              }} style={{fontSize:9,color:'#a78bfa',
                                background:'rgba(167,139,250,.1)',border:'1px solid rgba(167,139,250,.22)',
                                borderRadius:5,padding:'2px 9px',cursor:'pointer',fontWeight:600}}>
                                ↗ Reenviar todos
                              </button>
                            )}
                          </div>
                          {/* Linhas */}
                          {evts.map((d,i)=>{
                            const m   = GATILHO_META[d.gatilho]||{label:d.gatilho,icon:Zap,cor:'#6b7294'}
                            const Ic  = m.icon
                            const sc  = d.status==='enviado'?'#00e676':d.status==='erro'?'#ff4757':d.status==='aguardando'?'#ffb300':'#6b7294'
                            const sdim= d.status==='enviado'?T.greenDim:d.status==='erro'?T.redDim:d.status==='aguardando'?T.amberDim:T.gray
                            const sbr = d.status==='enviado'?T.greenBor:d.status==='erro'?T.redBor:d.status==='aguardando'?T.amberBor:T.grayBor
                            const sl  = d.status==='enviado'?'Enviado':d.status==='erro'?'Erro':d.status==='aguardando'?'Aguardando':'Ignorado'
                            const podeEnv = d.status==='ignorado'||d.status==='erro'
                            const jaEnv   = reenviados.includes(d.id)
                            return (
                              <div key={d.id||i} className="modal-wc-tl-row"
                                onClick={()=>{}} style={{cursor:'default'}}>
                                <span style={{fontSize:9.5,color:'#3a3f5c',width:44,
                                  flexShrink:0,fontFamily:'monospace'}}>
                                  {new Date(d.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
                                </span>
                                <div style={{width:22,height:22,borderRadius:7,flexShrink:0,
                                  background:`${m.cor}18`,border:`0.5px solid ${m.cor}28`,
                                  display:'flex',alignItems:'center',justifyContent:'center'}}>
                                  <Ic size={10} style={{color:m.cor}}/>
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:11.5,color:'#b8bdd4',
                                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                    {m.label}
                                    {selPed==='todos'&&d.numero_pedido&&(
                                      <span style={{fontSize:9,color:'#3a3f5c',marginLeft:5}}>#{d.numero_pedido}</span>
                                    )}
                                  </div>
                                  {/* Mini-bolha: trecho da mensagem real (variáveis salvas v4) */}
                                  {(()=>{
                                    let v = d.variaveis
                                    if (typeof v==='string') { try{v=JSON.parse(v)}catch{v=null} }
                                    const corpo = tplsCorpo?.[d.gatilho]
                                    if (!v || !corpo) return null
                                    const rend = corpo.replace(/\{\{(\w+)\}\}/g,(mm,k)=>{
                                      const s=v[k]??v[`{{${k}}}`]; return (s===undefined||s===null||s==='')?mm:String(s)
                                    }).replace(/\*/g,'').split('\n').filter(Boolean).slice(0,2).join(' ')
                                    if (!rend) return null
                                    return (
                                      <div style={{fontSize:9.5,color:'#6b7294',fontStyle:'italic',
                                        background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.05)',
                                        borderRadius:'8px 8px 8px 2px',padding:'3px 8px',marginTop:3,
                                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'96%'}}>
                                        "{rend.slice(0,92)}{rend.length>92?'…':''}"
                                      </div>
                                    )
                                  })()}
                                </div>
                                <div style={{display:'inline-flex',alignItems:'center',gap:3,
                                  padding:'2px 7px',borderRadius:99,flexShrink:0,
                                  background:sdim,border:`0.5px solid ${sbr}`}}>
                                  <span style={{fontSize:9,fontWeight:700,color:sc,
                                    textTransform:'uppercase',letterSpacing:'.03em'}}>{sl}</span>
                                </div>
                                {podeEnv&&(
                                  jaEnv
                                  ? <span style={{fontSize:9.5,color:'#00e676',flexShrink:0,
                                      display:'flex',alignItems:'center',gap:3}}>
                                      <CheckCircle size={10}/>ok
                                    </span>
                                  : <button className="modal-wc-env-btn"
                                      onClick={e=>{e.stopPropagation();onReenviar?.(d.id);setReenviados(p=>[...p,d.id])}}>
                                      Enviar
                                    </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </>)}
                </div>

                {/* ─── FOOTER ─── */}
                <div style={{flexShrink:0,padding:'10px 14px',
                  borderTop:'1px solid rgba(255,255,255,.05)',
                  background:'#0d1017',display:'flex',flexDirection:'column',gap:9}}>
                  {/* Disparo manual: select + pedido */}
                  {cli && (
                    <div style={{display:'flex',gap:7}}>
                      <select value={gatManual} onChange={e=>setGatManual(e.target.value)}
                        style={{flex:1,padding:'8px 10px',borderRadius:9,fontSize:12,
                          border:'1px solid rgba(255,255,255,.08)',background:'#161b2c',
                          color:'#b8bdd4',outline:'none',appearance:'auto'}}>
                        <option value="">Selecione o gatilho...</option>
                        {Object.entries(GATILHO_META).map(([k,v])=>(
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      <input value={pedManual} onChange={e=>setPedManual(e.target.value)}
                        placeholder="Pedido" style={{width:78,padding:'8px 10px',
                          borderRadius:9,fontSize:12,border:'1px solid rgba(255,255,255,.08)',
                          background:'#161b2c',color:'#b8bdd4',outline:'none'}}/>
                    </div>
                  )}
                  {/* Botões */}
                  <div style={{display:'flex',gap:7}}>
                    <button disabled={!gatManual||enviandoMan} onClick={enviarManual}
                      className="modal-wc-btn-p" style={{flex:1,padding:11}}>
                      {enviandoMan
                        ? <><RefreshCw size={12} style={{animation:'spin .7s linear infinite'}}/>Enviando...</>
                        : envManOk
                        ? <><CheckCircle size={12}/>Enviado!</>
                        : <><Send size={12}/>Enviar para este cliente ↗</>}
                    </button>
                    <button className="modal-wc-btn-s"
                      style={{padding:'11px 14px',border:'1px solid rgba(255,255,255,.08)'}}>
                      <MoreVertical size={15}/>
                    </button>
                  </div>
                </div>
              </>
            )
          })()}

      </div>
    </>
  )
}
function tempoRel(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff/60000)
  if (min < 1)  return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min/60)
  if (h < 24)  return `${h}h`
  const d = Math.floor(h/24)
  if (d === 1) return 'ontem'
  return `${d}d`
}

// ─── LINHA DO LOG — Enterprise Dark (sistema T) ─────────────────────────────
// ─── LIVE FEED ────────────────────────────────────────────────────────────────
function LiveFeed({items=[], novos=0, onVerNovos, onItemClick}) {
  if (!items.length) return null
  return (
    <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.sep}`,
      background:`linear-gradient(180deg,${T.bg3} 0%,${T.bg2} 100%)`}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:T.green,
            display:'block',animation:'pulse 2s ease-in-out infinite'}}/>
          <span style={{fontSize:10,fontWeight:700,color:T.green,
            textTransform:'uppercase',letterSpacing:'.07em'}}>Ao vivo</span>
        </div>
        <span style={{fontSize:10,color:T.ink4}}>últimos disparos</span>
        {novos > 0 && (
          <button onClick={onVerNovos} style={{
            display:'inline-flex',alignItems:'center',gap:4,
            padding:'2px 9px',borderRadius:99,cursor:'pointer',
            background:T.greenDim,border:`1px solid ${T.greenBor}`,
            color:T.green,fontSize:10,fontWeight:700,animation:'fadeIn .3s ease'}}>
            ↑ {novos} novo{novos>1?'s':''}
          </button>
        )}
      </div>
      {/* Rows compactas */}
      <div style={{display:'flex',flexDirection:'column',gap:3}}>
        {items.slice(0,3).map((row,i)=>{
          const meta = GATILHO_META[row.gatilho]||{label:row.gatilho,icon:Zap,cor:'#6b7294'}
          const Ic   = meta.icon||Zap
          const sCor = row.status==='enviado'?T.green:row.status==='erro'?T.red:T.ink4
          return (
            <div key={row.id||i} onClick={()=>onItemClick?.(row)}
              style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',
                borderRadius:8,cursor:'pointer',transition:'background .1s',
                animation:`slideup .3s ease ${i*0.05}s both`}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.04)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              {/* Status dot */}
              <div style={{width:6,height:6,borderRadius:'50%',background:sCor,flexShrink:0}}/>
              {/* Gatilho icon tiny */}
              <div style={{width:20,height:20,borderRadius:6,flexShrink:0,
                background:`${meta.cor}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Ic size={10} style={{color:meta.cor}}/>
              </div>
              {/* Info */}
              <span style={{fontSize:11.5,color:T.ink2,fontWeight:500,flexShrink:0}}>{meta.label}</span>
              {row.numero_pedido&&<span style={{fontSize:9.5,color:T.purple,flexShrink:0}}>#{row.numero_pedido}</span>}
              <span style={{fontSize:11,color:T.ink3,overflow:'hidden',textOverflow:'ellipsis',
                whiteSpace:'nowrap',flex:1}}>{row.nome_cliente||''}</span>
              {/* Status + tempo */}
              <span style={{fontSize:10,color:sCor,flexShrink:0,fontWeight:600}}>
                {row.status==='enviado'?'✓':row.status==='erro'?'✗':'—'}
              </span>
              <span style={{fontSize:10,color:T.ink4,flexShrink:0}}>{tempoRel(row.criado_em)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── LINHA DO LOG — layout badge compacto ────────────────────────────────────
// Cada campo como ícone + badge para facilitar leitura rápida
function LinhaLog({row, onVerDisparo, onVerCliente, selecionado, onToggleSel}) {
  const meta = GATILHO_META[row.gatilho] || {label:row.gatilho, icon:Zap, cor:'#6b7294'}
  const Ic   = meta.icon || Zap
  const rel  = tempoRel(row.criado_em)

  // Status
  const isEnv  = row.status === 'enviado'
  const isIgn  = row.status === 'ignorado'
  const isErr  = row.status === 'erro'
  const isAgu  = row.status === 'aguardando'

  // Gatilho ativo ou inativo (inativo = ignorado por "Gatilho inativo")
  const isGatInativo = isIgn && (row.erro_msg||'').toLowerCase().includes('inativ')
  const isGatAtivo   = isEnv || (!isGatInativo && isIgn===false && isErr===false)

  const sCor = isEnv?T.green:isErr?T.red:isAgu?T.amber:'#6b7294'
  const sDim = isEnv?T.greenDim:isErr?T.redDim:isAgu?T.amberDim:T.gray
  const sBor = isEnv?T.greenBor:isErr?T.redBor:isAgu?T.amberBor:T.grayBor

  // Origem
  const isAuto   = row.origem==='rastreio_job' || row.origem==='job'
  const isManual = row.origem==='manual_painel' || row.origem==='manual'
  const isReenv  = row.origem==='manual_reenvio' || row.origem==='reenvio'

  // Canal
  const canalEfetivo = row.canal || (isAuto ? 'rastreio' : null)
  const cm = canalEfetivo ? CANAL_META[canalEfetivo] : null

  // Chip helper — ícone + label em pill
  const Chip = ({Icon, label, cor='#6b7294', dim='rgba(255,255,255,.04)', bor='rgba(255,255,255,.07)', mono=false, title}) => (
    <span title={title} style={{display:'inline-flex',alignItems:'center',gap:3,
      padding:'2px 7px',borderRadius:99,fontSize:9.5,fontWeight:600,
      background:dim,border:`0.5px solid ${bor}`,color:cor,flexShrink:0,
      fontFamily:mono?'monospace':'inherit',letterSpacing:mono?'-.02em':'.02em',
      maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
      <Icon size={8} style={{color:cor,flexShrink:0}}/>
      {label}
    </span>
  )

  return (
    <div className="log-row"
      onClick={()=>selecionado!==undefined?onToggleSel?.(row.id):onVerDisparo?.(row)}
      style={{display:'flex',alignItems:'center',cursor:'pointer',
        borderBottom:`1px solid ${T.sep}`,transition:'background .1s',position:'relative',
        background:selecionado?`${T.purpleDim}`:'transparent',
        padding:'9px 12px 9px 0'}}>

      {/* Barra lateral de status */}
      <div style={{width:3,alignSelf:'stretch',flexShrink:0,
        background:isEnv?T.green:isErr?T.red:isAgu?T.amber:'transparent',
        borderRadius:'0 2px 2px 0',marginRight:8}}/>

      {/* Checkbox */}
      <div onClick={e=>{e.stopPropagation();onToggleSel?.(row.id)}}
        style={{width:28,flexShrink:0,display:'flex',alignItems:'center',
          justifyContent:'center',cursor:'pointer',
          opacity:selecionado?1:0,transition:'opacity .1s'}}
        className="log-cb">
        <div style={{width:14,height:14,borderRadius:4,
          background:selecionado?T.purple:'transparent',
          border:`1.5px solid ${selecionado?T.purple:T.sep2}`,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          {selecionado&&<Check size={8} style={{color:'#fff'}}/>}
        </div>
      </div>

      {/* Ícone do gatilho */}
      <div style={{width:32,height:32,borderRadius:9,flexShrink:0,
        background:`${meta.cor}18`,border:`0.5px solid ${meta.cor}28`,
        display:'flex',alignItems:'center',justifyContent:'center',marginRight:10}}>
        <Ic size={14} style={{color:meta.cor}}/>
      </div>

      {/* Conteúdo central */}
      <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:5}}>

        {/* Linha 1: nome do gatilho + pedido + canal */}
        <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
          <span style={{fontSize:12.5,fontWeight:700,color:T.ink1,
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>
            {meta.label}
          </span>

          {row.numero_pedido&&(
            <Chip Icon={Hash} label={`#${row.numero_pedido}`}
              cor={T.purple} dim={T.purpleDim} bor={T.purpleBor}/>
          )}

          {cm&&(
            <span style={{display:'inline-flex',alignItems:'center',gap:3,
              padding:'2px 7px',borderRadius:99,fontSize:9.5,fontWeight:600,flexShrink:0,
              background:cm.bg||`${cm.cor}18`,color:cm.cor,border:`0.5px solid ${cm.cor}35`}}>
              <PlataformaSVG canal={canalEfetivo} size={9}/>
              {cm.label}
            </span>
          )}

          {row.nome_cliente&&(
            <span style={{fontSize:10.5,color:T.ink3,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:120}}>
              {row.nome_cliente.split(' ').slice(0,2).join(' ')}
            </span>
          )}
        </div>

        {/* Linha 2: badges de contexto */}
        <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap'}}>

          {/* Telefone */}
          {row.telefone&&(
            <Chip Icon={Phone} label={fmtTel(row.telefone)} mono
              cor={T.ink3} title={row.telefone}/>
          )}

          {/* Transportadora (canal de rastreio) */}
          {(row.template_nome && row.template_nome !== row.gatilho) && (
            <Chip Icon={FileText} label={row.template_nome}
              cor={T.ink4} dim='rgba(255,255,255,.03)' bor='rgba(255,255,255,.06)'/>
          )}

          {/* Gatilho ativo/inativo */}
          {isGatInativo
            ? <Chip Icon={Minus}      label="Inativo"  cor='#6b7294' dim={T.gray} bor={T.grayBor}/>
            : <Chip Icon={CheckCircle} label="Ativo"   cor={T.green} dim={T.greenDim} bor={T.greenBor}/>
          }

          {/* Origem do disparo */}
          {isAuto   &&<Chip Icon={Zap}       label="Auto"    cor={T.cyan}   dim={T.cyanDim}   bor={T.cyanBor}/>}
          {isManual &&<Chip Icon={Settings}  label="Manual"  cor={T.purple} dim={T.purpleDim} bor={T.purpleBor}/>}
          {isReenv  &&<Chip Icon={RotateCcw} label="Reenvio" cor={T.amber}  dim={T.amberDim}  bor={T.amberBor}/>}

          {/* Status do disparo */}
          <span style={{display:'inline-flex',alignItems:'center',gap:3,
            padding:'2px 7px',borderRadius:99,fontSize:9.5,fontWeight:700,flexShrink:0,
            background:sDim,border:`0.5px solid ${sBor}`,color:sCor,
            textTransform:'uppercase',letterSpacing:'.04em'}}>
            {isEnv?<CheckCircle size={8}/>:isErr?<XCircle size={8}/>:isAgu?<Clock size={8}/>:<AlertTriangle size={8}/>}
            {isEnv?'Enviado':isErr?'Erro':isAgu?'Aguard.':'Ignorado'}
          </span>

          {/* Tempo */}
          <Chip Icon={Clock} label={rel||fmtDH(row.criado_em)} cor={T.ink4}/>

          {/* Erro msg compacto */}
          {isErr&&row.erro_msg&&(
            <span style={{fontSize:9.5,color:T.red,overflow:'hidden',
              textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160,fontStyle:'italic'}}>
              {row.erro_msg}
            </span>
          )}
        </div>
      </div>

      {/* Botões — sempre visíveis */}
      <div style={{display:'flex',alignItems:'center',gap:4,marginLeft:8,flexShrink:0}}>
        <button onClick={e=>{e.stopPropagation();onVerCliente?.(row)}} title="Perfil do cliente"
          style={{width:28,height:28,borderRadius:8,border:`1px solid ${T.sep2}`,
            background:T.bg3,cursor:'pointer',display:'flex',alignItems:'center',
            justifyContent:'center',color:T.ink3,transition:'all .15s'}}
          onMouseEnter={e=>{e.currentTarget.style.background=T.bg4;e.currentTarget.style.color=T.purple}}
          onMouseLeave={e=>{e.currentTarget.style.background=T.bg3;e.currentTarget.style.color=T.ink3}}>
          <Users size={12}/>
        </button>
        <button onClick={e=>{e.stopPropagation();onVerDisparo?.(row)}} title="Detalhe do disparo"
          style={{width:28,height:28,borderRadius:8,border:`1px solid ${T.sep2}`,
            background:T.bg3,cursor:'pointer',display:'flex',alignItems:'center',
            justifyContent:'center',color:T.ink3,transition:'all .15s'}}
          onMouseEnter={e=>{e.currentTarget.style.background=T.bg4;e.currentTarget.style.color=T.ink1}}
          onMouseLeave={e=>{e.currentTarget.style.background=T.bg3;e.currentTarget.style.color=T.ink3}}>
          <Eye size={12}/>
        </button>
      </div>
    </div>
  )
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function PageDisparos({api: apiProp}) {
  const api = apiProp || BASE

  // Stats gerais
  const [stats,   setStats]   = useState(null)
  const [loadSt,  setLoadSt]  = useState(true)
  const [periodo, setPeriodo] = useState('7d')

  // Insights inteligentes
  const [insightsBE,   setInsightsBE]   = useState([])
  const [loadIns,      setLoadIns]      = useState(false)
  const [insDispBE,    setInsDispBE]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('bia_ins_dismiss')||'[]') } catch { return [] }
  })

  // Command palette
  const [cmdOpen, setCmdOpen] = useState(false)

  // Batch actions — seleção multi-linha no log
  const [selecionados, setSelecionados] = useState(new Set())
  const [reenviandoLote, setReenvLote]  = useState(false)

  // Live feed — rastrea novos disparos entre polls
  const [liveFeedItems,  setLiveFeed]   = useState([])
  const [novosCount,     setNovos]      = useState(0)
  const prevLogIds = useRef(new Set())

  // Drawer lateral (detalhe do disparo OU perfil do cliente)
  const [drawer, setDrawer] = useState(null)  // {tipo:'disparo'|'cliente', dados}
  const [aba, setAba] = useState('pulso')     // 'pulso' | 'analytics' | 'log'
  // Insights dispensados (marcados como "entendi") — por texto
  const [insDispensados, setInsDispensados] = useState([])

  // Log paginado
  const [log,       setLog]      = useState([])
  const [logTotal,  setLogTotal] = useState(0)
  const [logPgs,    setLogPgs]   = useState(1)
  const [logPg,     setLogPg]    = useState(1)
  const [loadLog,   setLoadLog]  = useState(false)
  const [filtroSt,  setFiltroSt] = useState('todos')
  const [filtroGat, setFiltroGat]= useState('todos')
  const [busca,     setBusca]    = useState('')
  const [buscaInput,setBuscaInput]=useState('')

  // Auto-refresh
  const [autoRef,  setAutoRef]  = useState(true)
  const [lastUpd,  setLastUpd]  = useState(null)
  const polRef = useRef(null)

  // Carrega stats
  const [painel, setPainel] = useState(null)   // Nivelmax: funil/fila/saúde/erros/SLA
  const carregarStats = useCallback(async(sil=false)=>{
    if(!sil) setLoadSt(true)
    try {
      const [r, rp] = await Promise.all([
        fetch(`${api}/api/dashboard/disparos-stats?periodo=${periodo}`),
        fetch(`${api}/api/dashboard/disparos/painel?periodo=${periodo}`).catch(()=>null),
      ])
      if (r.ok) { const d=await r.json(); setStats(d); setLastUpd(new Date()) }
      if (rp?.ok) { const dp=await rp.json(); if(dp?.funil) setPainel(dp) }
    } catch {}
    if(!sil) setLoadSt(false)
  },[api,periodo])

  // Carrega log
  const carregarLog = useCallback(async(pg=1)=>{
    setLoadLog(true)
    try {
      const params = new URLSearchParams({
        periodo, pagina:pg, limite:50,
        ...(filtroSt!=='todos'&&{status:filtroSt}),
        ...(filtroGat!=='todos'&&{gatilho:filtroGat}),
        ...(busca&&{busca}),
      })
      const r = await fetch(`${api}/api/dashboard/disparos-log?${params}`)
      if (r.ok) {
        const d = await r.json()
        const novos = d.disparos||[]
        setLog(novos)
        setLogTotal(d.total||0)
        setLogPgs(d.paginas||1)
        setLogPg(pg)
        // Live feed: top 3 da página 1
        if (pg === 1) {
          setLiveFeed(novos.slice(0,3))
          // Detectar novos itens desde o último load
          const novosIds = new Set(novos.map(r=>r.id))
          const qtdNovos = novos.filter(r=>!prevLogIds.current.has(r.id)).length
          if (prevLogIds.current.size > 0 && qtdNovos > 0) {
            setNovos(v => v + qtdNovos)
          }
          prevLogIds.current = novosIds
        }
      }
    } catch {}
    setLoadLog(false)
  },[api,periodo,filtroSt,filtroGat,busca])

  useEffect(()=>{ carregarStats(); carregarLog(1) },[carregarStats])
  useEffect(()=>{ carregarLog(1) },[filtroSt,filtroGat,busca,periodo])

  // Auto-refresh
  useEffect(()=>{
    if(!autoRef) { clearInterval(polRef.current); return }
    polRef.current = setInterval(()=>{ carregarStats(true); carregarLog(logPg) },15000)
    return()=>clearInterval(polRef.current)
  },[autoRef,carregarStats,carregarLog,logPg])

  // Buscar insights inteligentes do backend
  useEffect(()=>{
    setLoadIns(true)
    fetch(`${api}/api/dashboard/insights`)
      .then(r=>r.json())
      .then(d=>{ setInsightsBE(d.insights||[]); setLoadIns(false) })
      .catch(()=>setLoadIns(false))
  },[api,periodo])

  // Keyboard shortcuts
  useEffect(()=>{
    const handler = e => {
      // ⌘K / Ctrl+K — command palette
      if ((e.metaKey||e.ctrlKey) && e.key==='k') {
        e.preventDefault()
        setCmdOpen(v=>!v)
        return
      }
      if (e.key==='Escape') { setCmdOpen(false); return }
      // Só quando NÃO está em input/textarea
      const inInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement
      if (inInput) return
      if (e.key==='r'||e.key==='R') { carregarStats(); carregarLog(1) }
      if (e.key==='e'||e.key==='E') exportarCSV()
    }
    window.addEventListener('keydown', handler)
    return ()=>window.removeEventListener('keydown', handler)
  },[carregarStats,carregarLog]) // eslint-disable-line

  const reenviar = async(id) => {
    const r = await fetch(`${api}/api/dashboard/disparos-reenviar/${id}`,{method:'POST'})
    if (!r.ok) throw new Error('Falha ao reenviar')
    await carregarLog(logPg)
  }

  // Batch actions
  const toggleSel = (id) => setSelecionados(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const selecionarTodos = () => {
    const reenviaveis = log.filter(r=>r.status==='ignorado'||r.status==='erro')
    setSelecionados(new Set(reenviaveis.map(r=>r.id)))
  }

  const limparSelecao = () => setSelecionados(new Set())

  const reenviarLote = async () => {
    if (!selecionados.size) return
    setReenvLote(true)
    for (const id of selecionados) {
      await fetch(`${api}/api/dashboard/disparos-reenviar/${id}`,{method:'POST'}).catch(()=>{})
    }
    setSelecionados(new Set())
    setReenvLote(false)
    await carregarLog(logPg)
  }

  const exportarCSV = () => {
    const rows = [
      ['ID','Gatilho','Cliente','Telefone','Pedido','Template','Status','Origem','Data/Hora'],
      ...log.map(r=>[r.id,r.gatilho,r.nome_cliente||'',r.telefone,r.numero_pedido||'',
        r.template_nome||'',r.status,r.origem||'',r.criado_em])
    ]
    const csv = rows.map(r=>r.map(c=>`"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    a.download=`disparos-${periodo}-${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  // Dados derivados
  const t          = stats?.totais||{}
  const total      = parseInt(t.total)||0
  const enviados   = parseInt(t.enviados)||0
  const erros      = parseInt(t.erros)||0
  const ignorados  = parseInt(t.ignorados)||0
  const aguardando = parseInt(t.aguardando)||0
  // TAXA DE SUCESSO: dos que o sistema TENTOU enviar (enviados+erros), quantos
  // deram certo. "Ignorado" (template off / sem telefone) é NEUTRO, não entra.
  const tentados   = enviados + erros
  const taxa       = tentados>0 ? Math.round(enviados/tentados*100) : null  // null = nada tentado ainda
  const porDiaChart= (stats?.porDia||[]).map(d=>({
    d: fmtD(d.dia),
    enviados: parseInt(d.enviados)||0,
    erros:    parseInt(d.erros)||0,
    total:    parseInt(d.total)||0,
  }))
  const porGatChart= (stats?.porGatilho||[]).map(g=>({
    name:  GATILHO_META[g.gatilho]?.label||g.gatilho,
    total: parseInt(g.total)||0,
    enviados: parseInt(g.enviados)||0,
    erros: parseInt(g.erros)||0,
    cor:   GATILHO_META[g.gatilho]?.cor||'#6b7280',
  }))
  const gatilhosUsados = [...new Set((stats?.porGatilho||[]).map(g=>g.gatilho))]

  // Dados de sparkline: série dos últimos 7 dias por métrica
  const spark7 = useMemo(() => {
    const dias = (stats?.porDia||[]).slice(-7)
    return {
      total:    dias.map(d=>(parseInt(d.enviados)||0)+(parseInt(d.erros)||0)+(parseInt(d.ignorados)||0)),
      enviados: dias.map(d=>parseInt(d.enviados)||0),
      erros:    dias.map(d=>parseInt(d.erros)||0),
      clientes: dias.map(d=>parseInt(d.clientes_unicos)||0),
      ultimas:  [],
      aguardando:[],
    }
  },[stats])

  // FUNIL DA JORNADA — etapas na ordem do fluxo físico do pedido.
  const _byGat = Object.fromEntries((stats?.porGatilho||[]).map(g=>[g.gatilho,{total:parseInt(g.total)||0,enviados:parseInt(g.enviados)||0}]))
  const ETAPAS_FUNIL = [
    { gat:'pedido_criado',       label:'Pedido criado',       cor:'#00d4aa' },
    { gat:'pagamento_aprovado',  label:'Pagamento aprovado',  cor:'#4a9fff' },
    { gat:'pedido_enviado',      label:'Enviado',             cor:'#a78bfa' },
    { gat:'rastreio_em_transito',label:'Em trânsito',         cor:'#06b6d4' },
    { gat:'saiu_entrega',        label:'Saiu p/ entrega',     cor:'#22c55e' },
    { gat:'pedido_entregue',     label:'Entregue',            cor:'#22c55e' },
  ]
  const funil = ETAPAS_FUNIL.map(e=>({ ...e, total:_byGat[e.gat]?.total||0 })).filter(e=>e.total>0)
  // Base do funil = a MAIOR etapa (evita percentuais absurdos quando as etapas
  // iniciais ainda não disparam). A barra é proporcional ao maior volume.
  const funilMax = Math.max(...funil.map(e=>e.total), 1)

  // Insights vindos do backend (/api/dashboard/insights)
  // insightsBE é atualizado no useEffect acima
  // insDispBE armazena IDs de insights dispensados pelo usuário

  return (
    <div style={{position:'absolute',inset:0,overflowY:'auto',overflowX:'hidden',background:'var(--bg)',fontFamily:'"DM Sans", system-ui, sans-serif'}}>

      {/* ── HEADER ── */}
      <div style={{padding:'12px 20px',position:'sticky',top:0,zIndex:10,borderBottom:'1px solid var(--sep)',
        background:'var(--bg-2)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:'rgba(124,106,247,.15)',
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Zap size={17} style={{color:'#7c6af7'}}/>
            </div>
            <div>
              <h2 style={{fontSize:18,fontWeight:700,color:'var(--label)',margin:0,letterSpacing:'-.02em'}}>Monitor de Disparos</h2>
              <p style={{fontSize:11,color:'var(--label-4)',margin:0}}>
                Gatilhos automáticos WhatsApp
                {lastUpd&&<span style={{marginLeft:8}}>· atualizado {lastUpd.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>}
              </p>
            </div>
            {/* Pill do motor — sempre visível, em qualquer aba */}
            {painel?.saude && (()=>{
              const s = painel.saude
              const prox = s.ultimoCicloJob ? Math.max(0, 60 - Math.round((Date.now()-new Date(s.ultimoCicloJob).getTime())/60000)) : null
              return (
                <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:99,
                  background:T.greenDim,border:`1px solid ${T.greenBor}`,marginLeft:6}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:T.green,
                    boxShadow:`0 0 8px ${T.green}`,animation:'pulse 2s ease infinite'}}/>
                  <span style={{fontSize:10,color:T.green,fontWeight:700,whiteSpace:'nowrap'}}>
                    motor operando{prox!==null && ` · ciclo ~${prox}min`} · {s.filaRastreioAtivos} na fila
                  </span>
                </div>
              )
            })()}
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          {/* Auto-refresh */}
          <button onClick={()=>setAutoRef(v=>!v)} style={{
            display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,fontSize:11,
            border:`1px solid ${autoRef?'rgba(34,197,94,.35)':'var(--sep)'}`,
            background:autoRef?'rgba(34,197,94,.08)':'none',
            color:autoRef?'#22c55e':'var(--label-4)',cursor:'pointer'}}>
            {autoRef?<ToggleRight size={13}/>:<ToggleLeft size={13}/>}
            Live {autoRef&&<span style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',animation:'pulse 1.5s ease infinite'}}/>}
          </button>
          {/* ⌘K Command Palette */}
          <button onClick={()=>setCmdOpen(true)} title="Command palette (⌘K)" style={{
            display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,fontSize:11,
            border:'1px solid var(--sep)',background:'none',color:'var(--label-4)',cursor:'pointer'}}>
            <Search size={12}/>
            <span>Buscar</span>
            <kbd style={{fontSize:9,padding:'1px 5px',borderRadius:4,marginLeft:2,
              background:'var(--fill)',border:'1px solid var(--sep)',color:'var(--label-4)'}}>⌘K</kbd>
          </button>
          {/* Período */}
          <div style={{display:'flex',gap:2,padding:'3px',borderRadius:10,background:'var(--fill)',border:'1px solid var(--sep)',boxShadow:'0 1px 4px rgba(0,0,0,.12)'}}>
            {PERIODOS.map(p=>(
              <button key={p.id} onClick={()=>setPeriodo(p.id)} style={{
                padding:'5px 12px',borderRadius:7,border:'none',fontSize:11,cursor:'pointer',
                transition:'all .15s',
                background:periodo===p.id?'var(--bg)':'transparent',
                color:periodo===p.id?'var(--label)':'var(--label-4)',
                fontWeight:periodo===p.id?600:400,
                boxShadow:periodo===p.id?'0 1px 6px rgba(0,0,0,.2)':undefined}}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={()=>{carregarStats();carregarLog(1)}} style={{
            width:32,height:32,borderRadius:8,border:'1px solid var(--sep)',
            background:'none',color:'var(--label-4)',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <RefreshCw size={13} style={loadSt?{animation:'spin 1s linear infinite'}:{}}/>
          </button>
          <button onClick={exportarCSV} style={{
            display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,
            border:'1px solid var(--sep)',background:'none',color:'var(--label-3)',cursor:'pointer',fontSize:11}}>
            <Download size={12}/>CSV
          </button>
        </div>
      </div>

      <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:16}}>

        {/* ── Abas: Pulso · Analytics · Log ── */}
        <div style={{display:'flex',gap:6}}>
          {[
            {id:'pulso',     lbl:'⚡ Pulso'},
            {id:'analytics', lbl:'Analytics'},
            {id:'log',       lbl:`Log${logTotal?` · ${logTotal}`:''}`},
          ].map(tb=>(
            <button key={tb.id} onClick={()=>setAba(tb.id)} style={{
              padding:'6px 16px',borderRadius:99,fontSize:11.5,fontWeight:600,cursor:'pointer',
              border:`1px solid ${aba===tb.id?T.purpleBor:T.sep2}`,
              background:aba===tb.id?T.purpleDim:'transparent',
              color:aba===tb.id?T.purple:T.ink3,transition:'all .15s'}}>
              {tb.lbl}
            </button>
          ))}
        </div>

        {/* ════════════ ABA PULSO — operação ao vivo ════════════ */}
        {aba==='pulso' && (<>
        {/* ── Funil da Jornada — hero ── */}
        <FunilJornada painel={painel} onFiltrarGatilho={g=>{ setFiltroGat(g); setLogPg(1); setAba('log') }}/>

        {/* ── Pulse strip — micro-KPIs ── */}
        <PulseStrip total={total} taxa={taxa} u24={parseInt(t.ultimas_24h)||0}
          clientes={parseInt(t.clientes_unicos)||0} aguardando={aguardando} erros={erros}
          onErros={()=>{ setFiltroSt('erro'); setLogPg(1); setAba('log') }}/>

        {/* ── Precisa de ação · Saindo agora ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10}}>
          <PrecisaDeAcao painel={painel}
            onErros={()=>{ setFiltroSt('erro'); setLogPg(1); setAba('log') }}
            onParados={()=>{ setFiltroGat('rastreio_em_transito'); setLogPg(1); setAba('log') }}/>
          <SaindoAgora fila={painel?.filaSaida||[]} recentes={liveFeedItems||[]}
            onVerDisparo={r=>setDrawer({tipo:'disparo',dados:r})}/>
        </div>
        </>)}

        {/* ════════════ ABA ANALYTICS — desempenho ════════════ */}
        {aba==='analytics' && (<>
        {/* ── SLA por transportadora ── */}
        <SlaTransportadora lista={painel?.slaTransportadora||[]}/>

        {/* ── Saúde do motor + erros (visão completa) ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:10}}>
          <SaudeMotor saude={painel?.saude} taxa={taxa}/>
          <ErrosMotivo lista={painel?.errosMotivo||[]}/>
          <FilaSaida items={painel?.filaSaida||[]} onVerDisparo={r=>setDrawer({tipo:'disparo',dados:r})}/>
        </div>

        {/* ═══════════════════════════════════════════════════
            ANALYTICS NIVELMAX — Gráficos + Decisão de Gatilhos
        ═══════════════════════════════════════════════════ */}

        {/* ── LINHA PRINCIPAL: Area chart com shadow ── */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2} 0%,${T.bg3} 100%)`,
          border:`1px solid ${T.sep2}`,borderRadius:18,
          padding:'20px 20px 14px',
          boxShadow:'0 12px 48px rgba(0,0,0,.35), 0 1px 0 rgba(255,255,255,.05) inset',
        }}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:34,height:34,borderRadius:10,
                background:'linear-gradient(135deg,rgba(0,230,118,.2),rgba(0,230,118,.08))',
                border:'1px solid rgba(0,230,118,.3)',
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:'0 4px 16px rgba(0,230,118,.15)'}}>
                <TrendingUp size={16} style={{color:T.green}}/>
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.ink1,letterSpacing:'-.02em'}}>
                  Evolução de Disparos
                </div>
                <div style={{fontSize:10.5,color:T.ink4,marginTop:1}}>
                  Enviados · Ignorados · Erros — por dia
                </div>
              </div>
            </div>
            {/* Legenda */}
            <div style={{display:'flex',gap:14,alignItems:'center'}}>
              {[
                {cor:T.green, lbl:'Enviados'},
                {cor:T.amber, lbl:'Ignorados'},
                {cor:T.red,   lbl:'Erros'},
              ].map(s=>(
                <div key={s.lbl} style={{display:'flex',alignItems:'center',gap:5}}>
                  <div style={{width:20,height:2,borderRadius:99,background:s.cor,
                    boxShadow:`0 0 6px ${s.cor}`}}/>
                  <span style={{fontSize:10,color:T.ink3,fontWeight:600}}>{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {porDiaChart.length===0
            ? <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:T.ink4,fontSize:12}}>
                Sem dados no período
              </div>
            : <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={porDiaChart} margin={{top:8,right:4,left:-20,bottom:0}}>
                  <defs>
                    {/* Gradientes com glow shadow */}
                    <linearGradient id="grad-env" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={T.green} stopOpacity={0.35}/>
                      <stop offset="100%" stopColor={T.green} stopOpacity={0.02}/>
                    </linearGradient>
                    <linearGradient id="grad-ign" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={T.amber} stopOpacity={0.25}/>
                      <stop offset="100%" stopColor={T.amber} stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="grad-err" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={T.red} stopOpacity={0.25}/>
                      <stop offset="100%" stopColor={T.red} stopOpacity={0.01}/>
                    </linearGradient>
                    {/* Filtro de glow nas linhas */}
                    <filter id="glow-env"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    <filter id="glow-ign"><feGaussianBlur stdDeviation="2"   result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,.04)" vertical={false}/>
                  <XAxis dataKey="d" tick={{fontSize:9.5,fill:T.ink4}} axisLine={false} tickLine={false}
                    interval={Math.max(0,Math.floor(porDiaChart.length/7)-1)}/>
                  <YAxis tick={{fontSize:9.5,fill:T.ink4}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip
                    contentStyle={{background:T.bg3,border:`1px solid ${T.sep2}`,borderRadius:10,
                      fontSize:11,boxShadow:'0 8px 32px rgba(0,0,0,.5)'}}
                    labelStyle={{color:T.ink2,fontWeight:700,marginBottom:4}}
                    itemStyle={{color:T.ink2}}
                    formatter={(v,n)=>[v,n==='enviados'?'Enviados':n==='ignorados'?'Ignorados':'Erros']}/>
                  {/* Área ignorados (fundo, menor destaque) */}
                  <Area dataKey="ignorados" stackId="no" type="monotone"
                    stroke={T.amber} strokeWidth={2} strokeOpacity={0.8}
                    fill="url(#grad-ign)" fillOpacity={1} dot={false}
                    filter="url(#glow-ign)"/>
                  {/* Área erros */}
                  <Area dataKey="erros" stackId="no2" type="monotone"
                    stroke={T.red} strokeWidth={1.5} strokeOpacity={0.7}
                    fill="url(#grad-err)" fillOpacity={1} dot={false}/>
                  {/* Área enviados (frente, com mais glow) */}
                  <Area dataKey="enviados" stackId="no3" type="monotone"
                    stroke={T.green} strokeWidth={2.5}
                    fill="url(#grad-env)" fillOpacity={1}
                    dot={{r:0}} activeDot={{r:5,fill:T.green,stroke:'#08090f',strokeWidth:2}}
                    filter="url(#glow-env)"/>
                </AreaChart>
              </ResponsiveContainer>
          }
        </div>

        {/* ── LINHA 2: Matriz de Gatilhos + Pico de horas ── */}
        <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:14}}>

          {/* MATRIZ DE DECISÃO DE GATILHOS */}
          <div style={{
            background:`linear-gradient(135deg,${T.bg2} 0%,${T.bg3} 100%)`,
            border:`1px solid ${T.sep2}`,borderRadius:18,padding:'18px 18px',
            boxShadow:'0 12px 48px rgba(0,0,0,.35), 0 1px 0 rgba(255,255,255,.05) inset',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:16}}>
              <div style={{width:32,height:32,borderRadius:10,
                background:'linear-gradient(135deg,rgba(167,139,250,.2),rgba(167,139,250,.08))',
                border:'1px solid rgba(167,139,250,.3)',
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:'0 4px 16px rgba(167,139,250,.15)'}}>
                <Zap size={15} style={{color:T.purple}}/>
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.ink1,letterSpacing:'-.02em'}}>
                  Painel de Decisão — Gatilhos
                </div>
                <div style={{fontSize:10,color:T.ink4,marginTop:1}}>
                  Volume · taxa de entrega · ação necessária
                </div>
              </div>
            </div>

            {porGatChart.length===0
              ? <p style={{fontSize:12,color:T.ink4,textAlign:'center',padding:'24px 0',margin:0}}>
                  Nenhum disparo no período
                </p>
              : <div style={{display:'flex',flexDirection:'column',gap:2}}>
                  {porGatChart.map((g,i)=>{
                    const maxG     = Math.max(...porGatChart.map(x=>x.total),1)
                    const pct      = g.total / maxG * 100
                    const tentados = g.enviados + g.erros
                    const taxaG    = tentados>0 ? Math.round(g.enviados/tentados*100) : null
                    const isInativo= taxaG===null && g.total>0
                    const isAlerta = taxaG!==null && taxaG<70
                    const isCritico= isInativo && g.total>=3
                    const statusCor= isCritico?T.red:isAlerta?T.amber:T.green
                    const statusDim= isCritico?T.redDim:isAlerta?T.amberDim:T.greenDim
                    const statusBor= isCritico?T.redBor:isAlerta?T.amberBor:T.greenBor
                    const statusLbl= isCritico?'Inativo':isAlerta?`${taxaG}%`:taxaG===null?'—':`${taxaG}%`
                    const gatKey   = Object.keys(GATILHO_META).find(k=>GATILHO_META[k].label===g.name)||g.name
                    const GIc      = GATILHO_META[gatKey]?.icon||Zap

                    return (
                      <div key={i}
                        onClick={()=>{ setFiltroGat(gatKey); setLogPg(1) }}
                        title="Filtrar o log por este gatilho"
                        style={{display:'flex',alignItems:'center',gap:10,
                          padding:'9px 10px',borderRadius:11,cursor:'pointer',
                          transition:'all .15s',
                          background:isCritico?'rgba(255,71,87,.04)':'transparent',
                          border:`1px solid ${isCritico?'rgba(255,71,87,.12)':'transparent'}`}}
                        onMouseEnter={e=>{e.currentTarget.style.background=isCritico?'rgba(255,71,87,.08)':`${T.bg4}`;e.currentTarget.style.borderColor=isCritico?'rgba(255,71,87,.2)':T.sep2}}
                        onMouseLeave={e=>{e.currentTarget.style.background=isCritico?'rgba(255,71,87,.04)':'transparent';e.currentTarget.style.borderColor=isCritico?'rgba(255,71,87,.12)':'transparent'}}>

                        {/* Ícone do gatilho */}
                        <div style={{width:28,height:28,borderRadius:8,flexShrink:0,
                          background:`${g.cor}18`,border:`1px solid ${g.cor}30`,
                          display:'flex',alignItems:'center',justifyContent:'center',
                          boxShadow:isCritico?`0 0 12px ${T.red}20`:undefined}}>
                          <GIc size={13} style={{color:g.cor}}/>
                        </div>

                        {/* Nome + barra */}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
                            <span style={{fontSize:11.5,fontWeight:600,color:T.ink1,
                              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>
                              {g.name}
                            </span>
                            <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                              <span style={{fontSize:12,fontWeight:700,color:T.ink2}}>{g.total}</span>
                              <span style={{fontSize:9,padding:'2px 8px',borderRadius:99,fontWeight:700,
                                background:statusDim,border:`1px solid ${statusBor}`,color:statusCor,
                                letterSpacing:'.04em'}}>
                                {statusLbl}
                              </span>
                              {isCritico&&(
                                <span style={{fontSize:8,padding:'1px 6px',borderRadius:99,
                                  background:T.redDim,border:`1px solid ${T.redBor}`,color:T.red,
                                  fontWeight:700,letterSpacing:'.06em'}}>ATIVAR</span>
                              )}
                            </div>
                          </div>
                          {/* Barra dupla: enviados + ignorados */}
                          <div style={{height:5,borderRadius:99,background:T.bg4,overflow:'hidden',position:'relative'}}>
                            <div style={{position:'absolute',left:0,top:0,height:'100%',
                              width:`${pct}%`,
                              background:`linear-gradient(90deg,${g.cor},${g.cor}88)`,
                              borderRadius:99,
                              boxShadow:`0 0 8px ${g.cor}50`,
                              transition:'width .7s cubic-bezier(.4,0,.2,1)'}}/>
                            {tentados>0&&g.erros>0&&(
                              <div style={{position:'absolute',right:0,top:0,height:'100%',
                                width:`${Math.round(g.erros/g.total*pct)}%`,
                                background:T.red,borderRadius:'0 99px 99px 0'}}/>
                            )}
                          </div>
                          {/* Sub-linha de contexto */}
                          {isCritico&&(
                            <div style={{fontSize:9,color:T.red,marginTop:3,opacity:.8}}>
                              {g.total} disparos perdidos — template inativo
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </div>

          {/* COLUNA DIREITA: Pico de horas + Taxa */}
          <div style={{display:'flex',flexDirection:'column',gap:14}}>

            {/* Taxa de entrega — gauge ring */}
            <div style={{
              background:`linear-gradient(135deg,${T.bg2} 0%,${T.bg3} 100%)`,
              border:`1px solid ${T.sep2}`,borderRadius:18,padding:'18px',
              boxShadow:'0 12px 48px rgba(0,0,0,.35)',
            }}>
              <div style={{fontSize:13,fontWeight:700,color:T.ink1,
                display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                <ShieldCheck size={14} style={{color:taxa>=70?T.green:T.amber}}/>
                Taxa de entrega
              </div>
              <div style={{display:'flex',alignItems:'center',gap:16}}>
                {/* Ring SVG */}
                <div style={{position:'relative',width:80,height:80,flexShrink:0}}>
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke={T.bg4} strokeWidth="8"/>
                    <circle cx="40" cy="40" r="32" fill="none"
                      stroke={taxa===null?T.ink4:taxa>=90?T.green:taxa>=70?T.amber:T.red}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="201"
                      strokeDashoffset={taxa===null?201:Math.round(201*(1-(taxa/100)))}
                      transform="rotate(-90 40 40)"
                      style={{transition:'stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)',
                        filter:`drop-shadow(0 0 6px ${taxa===null?'transparent':taxa>=90?T.green:taxa>=70?T.amber:T.red})`}}/>
                  </svg>
                  <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
                    alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:18,fontWeight:800,letterSpacing:'-.03em',
                      color:taxa===null?T.ink4:taxa>=90?T.green:taxa>=70?T.amber:T.red}}>
                      {taxa===null?'—':`${taxa}%`}
                    </span>
                  </div>
                </div>
                {/* Legenda */}
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
                  {[
                    {l:'Enviados',  v:enviados,  c:T.green},
                    {l:'Ignorados', v:ignorados, c:T.amber},
                    {l:'Erros',     v:erros,     c:T.red},
                    {l:'Aguardando',v:aguardando,c:T.ink4},
                  ].map(s=>(
                    <div key={s.l} style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:s.c,flexShrink:0,
                        boxShadow:`0 0 4px ${s.c}`}}/>
                      <span style={{fontSize:10.5,color:T.ink3,flex:1}}>{s.l}</span>
                      <span style={{fontSize:11,fontWeight:700,color:T.ink2}}>{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Horário de pico — heatmap vertical */}
            <div style={{
              background:`linear-gradient(135deg,${T.bg2} 0%,${T.bg3} 100%)`,
              border:`1px solid ${T.sep2}`,borderRadius:18,padding:'18px',
              flex:1,
              boxShadow:'0 12px 48px rgba(0,0,0,.35)',
            }}>
              <div style={{fontSize:13,fontWeight:700,color:T.ink1,
                display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                <Clock size={14} style={{color:T.cyan}}/>
                Pico de horário
                {stats?.picoHora!=null&&(
                  <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:99,
                    marginLeft:'auto',background:T.cyanDim,color:T.cyan,border:`1px solid ${T.cyanBor}`}}>
                    pico às {stats.picoHora}h
                  </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={stats?.porHora||[]} margin={{top:4,right:4,left:-28,bottom:0}}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={T.cyan} stopOpacity={0.9}/>
                      <stop offset="100%" stopColor={T.cyan} stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,.04)" vertical={false}/>
                  <XAxis dataKey="hora" tick={{fontSize:8.5,fill:T.ink4}} interval={3}
                    tickFormatter={h=>`${h}h`} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:8.5,fill:T.ink4}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip
                    contentStyle={{background:T.bg3,border:`1px solid ${T.sep2}`,borderRadius:10,
                      fontSize:11,boxShadow:'0 8px 32px rgba(0,0,0,.5)'}}
                    labelStyle={{color:T.ink2,fontWeight:700}}
                    labelFormatter={h=>`${h}:00h`}
                    formatter={v=>[v,'disparos']}/>
                  <Bar dataKey="total" radius={[4,4,0,0]} maxBarSize={14}>
                    {(stats?.porHora||[]).map((h,i)=>(
                      <Cell key={i}
                        fill={h.hora===stats?.picoHora?T.cyan:`${T.cyan}45`}
                        style={{filter:h.hora===stats?.picoHora?`drop-shadow(0 0 6px ${T.cyan})`:'none'}}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>

        {/* ── LINHA 3: Funil da jornada + Insights ── */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>

          {/* Funil */}
          <div style={{
            background:`linear-gradient(135deg,${T.bg2} 0%,${T.bg3} 100%)`,
            border:`1px solid ${T.sep2}`,borderRadius:18,padding:'18px',
            boxShadow:'0 12px 48px rgba(0,0,0,.35)',
          }}>
            <div style={{fontSize:13,fontWeight:700,color:T.ink1,
              display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
              <Filter size={14} style={{color:T.blue}}/>
              Funil da jornada
              <span style={{fontSize:10,color:T.ink4,fontWeight:400,marginLeft:'auto'}}>
                onde estão seus clientes
              </span>
            </div>
            {funil.length===0
              ? <p style={{fontSize:12,color:T.ink4,textAlign:'center',padding:20,margin:0}}>
                  Sem dados de jornada no período
                </p>
              : <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  {funil.map((e,i)=>{
                    const pct = Math.round(e.total/funilMax*100)
                    const EIc = GATILHO_META[e.gat]?.icon || Zap
                    return (
                      <div key={e.gat}
                        onClick={()=>{ setFiltroGat(e.gat); setLogPg(1) }}
                        style={{display:'flex',alignItems:'center',gap:9,
                          padding:'8px 10px',borderRadius:10,cursor:'pointer',transition:'background .12s'}}
                        onMouseEnter={ev=>ev.currentTarget.style.background=T.bg4}
                        onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
                        <div style={{width:26,height:26,borderRadius:7,flexShrink:0,
                          background:`${e.cor}18`,border:`1px solid ${e.cor}30`,
                          display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <EIc size={11} style={{color:e.cor}}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                            <span style={{fontSize:11.5,color:T.ink1,fontWeight:600,
                              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>
                              {e.label}
                            </span>
                            <span style={{fontSize:12,fontWeight:700,color:T.ink1,flexShrink:0}}>{e.total}</span>
                          </div>
                          <div style={{height:5,borderRadius:99,background:T.bg4,overflow:'hidden'}}>
                            <div style={{height:'100%',borderRadius:99,
                              background:`linear-gradient(90deg,${e.cor},${e.cor}80)`,
                              width:`${pct}%`,transition:'width .8s cubic-bezier(.4,0,.2,1)',
                              boxShadow:`0 0 8px ${e.cor}40`}}/>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </div>

          {/* Insights */}
          <div style={{
            background:`linear-gradient(135deg,${T.bg2} 0%,${T.bg3} 100%)`,
            border:`1px solid ${T.sep2}`,borderRadius:18,padding:'18px',
            boxShadow:'0 12px 48px rgba(0,0,0,.35)',
            display:'flex',flexDirection:'column',gap:10
          }}>
            <div style={{fontSize:13,fontWeight:700,color:T.ink1,
              display:'flex',alignItems:'center',gap:8}}>
              <Activity size={14} style={{color:T.amber}}/>
              Insights da IA
              {loadIns&&<RefreshCw size={11} style={{color:T.ink4,animation:'spin 1s linear infinite'}}/>}
              {!loadIns&&insightsBE.filter(i=>!insDispBE.includes(i.id)).length>0&&(
                <span style={{fontSize:9,padding:'2px 8px',borderRadius:99,marginLeft:'auto',
                  background:T.redDim,color:T.red,border:`1px solid ${T.redBor}`,fontWeight:700}}>
                  {insightsBE.filter(i=>!insDispBE.includes(i.id)).length} alertas
                </span>
              )}
            </div>
            {loadIns&&<><Skeleton h={72} r={10}/><Skeleton h={72} r={10}/></>}
            {!loadIns&&insightsBE.filter(i=>!insDispBE.includes(i.id)).length===0&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',
                justifyContent:'center',flex:1,gap:8,padding:'16px 0'}}>
                <div style={{width:40,height:40,borderRadius:12,
                  background:T.greenDim,border:`1px solid ${T.greenBor}`,
                  display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <ShieldCheck size={18} style={{color:T.green}}/>
                </div>
                <span style={{fontSize:12,color:T.ink4,textAlign:'center'}}>
                  {insightsBE.length>0?'✓ Todos revisados':'✓ Tudo tranquilo'}
                </span>
              </div>
            )}
            {!loadIns&&insightsBE
              .filter(i=>!insDispBE.includes(i.id))
              .map(ins=>(
                <InsightCard key={ins.id} ins={ins}
                  onDismiss={()=>setInsDispBE(d=>{
                    const next=[...d,ins.id]
                    try{localStorage.setItem('bia_ins_dismiss',JSON.stringify(next))}catch{}
                    return next
                  })}/>
              ))
            }
          </div>
        </div>


        </>)}

        {/* ════════════ ABA LOG — auditoria ════════════ */}
        {aba==='log' && (<>
        {/* ── Log de disparos ── */}
        <div style={{background:T.bg1,border:`1px solid ${T.sep2}`,borderRadius:14,
          overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,.5)'}}>

          {/* Header */}
          <div style={{padding:'14px 16px',borderBottom:`1px solid ${T.sep}`,
            background:T.bg2,display:'flex',flexDirection:'column',gap:10}}>

            {/* Título + busca */}
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <Activity size={14} style={{color:T.purple}}/>
              <span style={{fontSize:13,fontWeight:600,color:T.ink1,letterSpacing:'-.01em'}}>
                Log de disparos
              </span>
              <span style={{fontSize:10,padding:'2px 8px',borderRadius:99,
                background:T.purpleDim,color:T.purple,border:`0.5px solid ${T.purpleBor}`,fontWeight:600}}>
                {logTotal}
              </span>
              {loadLog&&<RefreshCw size={11} style={{color:T.ink4,animation:'spin 1s linear infinite'}}/>}
              <div style={{flex:1}}/>
              {/* Busca */}
              <div style={{position:'relative',boxShadow:`0 0 0 1px ${T.sep2},0 2px 12px rgba(0,0,0,.3)`}}>
                <Search size={12} style={{position:'absolute',left:10,top:'50%',
                  transform:'translateY(-50%)',color:T.ink4,pointerEvents:'none'}}/>
                <input value={buscaInput} onChange={e=>setBuscaInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&setBusca(buscaInput)}
                  placeholder="Nome, tel, pedido..." style={{
                    padding:'7px 30px 7px 30px',borderRadius:9,
                    border:`1px solid ${T.sep2}`,background:T.bg3,
                    color:T.ink1,fontSize:12,width:200,outline:'none',
                    fontFamily:'"DM Sans",system-ui'}}/>
                {buscaInput&&(
                  <button onClick={()=>{setBuscaInput('');setBusca('')}} style={{
                    position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',
                    background:'none',border:'none',cursor:'pointer',color:T.ink4,padding:0,display:'flex'}}>
                    <X size={11}/>
                  </button>
                )}
              </div>
            </div>

            {/* Filtros: chips status + select gatilho (corrigido) */}
            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              {[
                {id:'todos',     label:'Todos'},
                {id:'enviado',   label:'Enviados',   cor:T.green,  dim:T.greenDim,  bor:T.greenBor},
                {id:'ignorado',  label:'Ignorados',  cor:'#6b7294',dim:T.gray,       bor:T.grayBor},
                {id:'erro',      label:'Erros',      cor:T.red,    dim:T.redDim,    bor:T.redBor},
                {id:'aguardando',label:'Aguardando', cor:T.amber,  dim:T.amberDim,  bor:T.amberBor},
              ].map(chip=>{
                const ativo = filtroSt===chip.id
                return (
                  <button key={chip.id} onClick={()=>setFiltroSt(chip.id)} style={{
                    display:'inline-flex',alignItems:'center',gap:4,
                    padding:'4px 11px',borderRadius:99,cursor:'pointer',
                    border:`1px solid ${ativo?(chip.bor||T.sep2):T.sep}`,
                    background:ativo?(chip.dim||T.bg4):T.bg3,
                    color:ativo?(chip.cor||T.ink1):T.ink3,
                    fontSize:11,fontWeight:ativo?600:400,
                    transition:'all .12s'}}>
                    {chip.label}
                  </button>
                )
              })}
              <div style={{width:'1px',height:14,background:T.sep2,margin:'0 4px'}}/>
              {/* Select de gatilho — CORRIGIDO (com background e cor visíveis) */}
              <select value={filtroGat} onChange={e=>setFiltroGat(e.target.value)} style={{
                fontSize:11,padding:'4px 10px',borderRadius:8,
                border:`1px solid ${filtroGat!=='todos'?T.purpleBor:T.sep}`,
                background:filtroGat!=='todos'?T.purpleDim:T.bg3,
                color:filtroGat!=='todos'?T.purple:T.ink3,
                cursor:'pointer',outline:'none',appearance:'auto'}}>
                <option value="todos">Todos gatilhos</option>
                {gatilhosUsados.map(g=>(
                  <option key={g} value={g}>{GATILHO_META[g]?.label||g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Live feed migrou para o card "Saindo agora" da aba Pulso */}

          {/* ── Linhas do log ── */}
          <div style={{minHeight:120,maxHeight:'calc(100vh - 440px)',overflowY:'auto',
            overflowX:'hidden',background:T.bg1,position:'relative'}}>

            {log.length===0&&!loadLog&&(
              <div style={{padding:48,textAlign:'center',color:T.ink4}}>
                <Zap size={32} style={{opacity:.15,marginBottom:12}}/><br/>
                <p style={{fontSize:13,margin:0,color:T.ink3}}>Nenhum disparo encontrado.</p>
                <p style={{fontSize:11,margin:'6px 0 0'}}>Verifique os filtros ou aguarde novos eventos.</p>
              </div>
            )}

            {log.map((row,i)=>(
              <LinhaLog key={row.id||i} row={row}
                onVerDisparo={r=>setDrawer({tipo:'disparo',dados:r})}
                onVerCliente={r=>setDrawer({tipo:'cliente',dados:r})}
                selecionado={selecionados.has(row.id)}
                onToggleSel={toggleSel}/>
            ))}

            {/* ── Batch toolbar flutuante (aparece quando há seleção) ── */}
            {selecionados.size > 0 && (
              <div style={{position:'sticky',bottom:0,left:0,right:0,zIndex:10,
                display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',
                padding:'10px 16px',
                background:`rgba(13,16,23,0.96)`,
                backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',
                borderTop:`1px solid ${T.purpleBor}`,
                boxShadow:`0 -6px 24px rgba(0,0,0,.5), 0 0 0 1px ${T.purpleBor} inset`,
                animation:'slideup .2s ease'}}>

                {/* Count badge */}
                <div style={{display:'flex',alignItems:'center',gap:7,flexShrink:0}}>
                  <div style={{width:22,height:22,borderRadius:7,background:T.purple,
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:11,fontWeight:700,color:'#fff'}}>{selecionados.size}</span>
                  </div>
                  <span style={{fontSize:12,color:T.ink2,fontWeight:500}}>
                    selecionado{selecionados.size>1?'s':''}
                  </span>
                </div>

                <button onClick={selecionarTodos} style={{
                  display:'flex',alignItems:'center',gap:5,padding:'5px 11px',
                  borderRadius:8,border:`1px solid ${T.sep2}`,background:T.bg3,
                  color:T.ink3,cursor:'pointer',fontSize:11,fontWeight:500}}>
                  Todos reenvíaveis
                </button>

                <div style={{flex:1}}/>

                <button disabled={reenviandoLote} onClick={reenviarLote} style={{
                  display:'flex',alignItems:'center',gap:6,padding:'7px 14px',
                  borderRadius:9,border:'none',cursor:reenviandoLote?'wait':'pointer',
                  background:reenviandoLote?T.purpleDim:'linear-gradient(135deg,#5b21b6,#9333ea)',
                  color:reenviandoLote?T.purple:'#fff',fontSize:12,fontWeight:600,
                  transition:'all .15s'}}>
                  {reenviandoLote
                    ? <><RefreshCw size={12} style={{animation:'spin .7s linear infinite'}}/>Enviando...</>
                    : <><Send size={12}/>Reenviar {selecionados.size} selecionado{selecionados.size>1?'s':''}</>}
                </button>

                <button onClick={limparSelecao} style={{
                  width:30,height:30,borderRadius:8,border:`1px solid ${T.sep2}`,
                  background:T.bg3,color:T.ink3,cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  flexShrink:0}}>
                  <X size={13}/>
                </button>
              </div>
            )}
          </div>

          {/* ── Paginação ── */}
          {logPgs>1&&(
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,
              padding:'12px',borderTop:`1px solid ${T.sep}`}}>
              <button onClick={()=>carregarLog(logPg-1)} disabled={logPg===1} style={{
                padding:'5px 10px',borderRadius:8,border:`1px solid ${T.sep}`,
                background:T.bg3,cursor:logPg===1?'not-allowed':'pointer',
                color:T.ink2,opacity:logPg===1?.5:1}}>
                <ChevronLeft size={14}/>
              </button>
              <span style={{fontSize:12,color:T.ink3}}>
                {logPg} de {logPgs} · {logTotal} disparos
              </span>
              <button onClick={()=>carregarLog(logPg+1)} disabled={logPg===logPgs} style={{
                padding:'5px 10px',borderRadius:8,border:`1px solid ${T.sep}`,
                background:T.bg3,cursor:logPg===logPgs?'not-allowed':'pointer',
                color:T.ink2,opacity:logPg===logPgs?.5:1}}>
                <ChevronRight size={14}/>
              </button>
            </div>
          )}
        </div>

        </>)}

        {/* respiro final — garante que o log seja totalmente visível ao rolar */}
        <div style={{height:24,flexShrink:0}}/>

      </div>

      {/* ── Command Palette ⌘K ── */}
      <CmdPalette
        open={cmdOpen}
        onClose={()=>setCmdOpen(false)}
        log={log}
        onOpenDisparo={r=>{ setCmdOpen(false); setDrawer({tipo:'disparo',dados:r}) }}
        onOpenCliente={r=>{ setCmdOpen(false); setDrawer({tipo:'cliente',dados:r}) }}
        onReload={()=>{ carregarStats(); carregarLog(1) }}
        onExport={exportarCSV}
        onFiltrarErros={()=>{ setFiltroSt('erro'); setLogPg(1) }}
      />

      {/* ── Drawer lateral ── */}
      {drawer && (
        <DrawerDetalhe
          tipo={drawer.tipo}
          dados={drawer.dados}
          api={api}
          stats={stats}
          insights={insightsBE}
          onClose={()=>setDrawer(null)}
          onVerPedido={num=>{ window.open(`https://whatsapp-sostrass.up.railway.app/pedido/${num}`,'_blank') }}
          onReenviar={reenviar}
          onFiltrarGatilho={(g,tel)=>{
            if (g==='__cliente__') { setDrawer({tipo:'cliente',dados:{
              telefone:tel,
              nome_cliente: drawer?.dados?.nome_cliente || '',
              numero_pedido: drawer?.dados?.numero_pedido || '',
            }}) }
          }}
        />
      )}

      <style>{`
        @keyframes spin     { to { transform: rotate(360deg) } }
        @keyframes pulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }
        @keyframes slideIn  { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes slideup  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes chartIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        ::-webkit-scrollbar       { width:4px; height:4px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.1); border-radius:99px }
        .log-row:hover { background:rgba(255,255,255,.028) !important }
        .log-row:hover .log-actions { opacity:1 !important }
        .log-row:hover .row-checkbox { opacity:1 !important }
        .gat-bar:hover { background:var(--fill) !important; border-radius:7px }
        details summary::-webkit-details-marker { display:none }
      `}</style>
    </div>
  )
}
