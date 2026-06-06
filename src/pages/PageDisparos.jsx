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
  ExternalLink, Radio, Settings,
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
function KCard({icon:Ic, label, value, sub, cor='#7c6af7', trend, spark}) {
  const numVal = (typeof value === 'number') ? value : (parseInt(String(value||''))||0)
  const [disp, setDisp] = useState(0)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (value === undefined || value === null) { setDisp(0); return }
    if (!numVal && numVal !== 0) { setReady(true); return }
    const t0 = Date.now(), dur = 700
    const tick = () => {
      const prog = Math.min((Date.now()-t0)/dur, 1)
      const ease = 1 - Math.pow(1-prog, 3)
      setDisp(Math.round(ease * numVal))
      if (prog < 1) requestAnimationFrame(tick)
      else setReady(true)
    }
    requestAnimationFrame(tick)
  }, [numVal]) // eslint-disable-line

  const displayVal = (typeof value === 'number' || (!isNaN(parseInt(String(value||''))) && value !== null && value !== ''))
    ? disp : (value ?? '—')

  return (
    <div style={{background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14,
      padding:'16px 16px', display:'flex', flexDirection:'column', gap:10,
      position:'relative', overflow:'hidden',
      boxShadow:'0 4px 24px rgba(0,0,0,.18), 0 1px 0 rgba(255,255,255,.04) inset'}}>
      <div style={{position:'absolute',top:0,right:0,width:80,height:80,
        background:`radial-gradient(circle at 100% 0%,${cor}22 0%,transparent 70%)`,pointerEvents:'none'}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div style={{width:34,height:34,borderRadius:10,background:`${cor}18`,
          border:`1px solid ${cor}30`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Ic size={16} style={{color:cor}}/>
        </div>
        {trend !== undefined && (
          <div style={{display:'flex',alignItems:'center',gap:3,fontSize:11,fontWeight:600,
            color:trend>0?'#22c55e':trend<0?'#ef4444':'var(--label-4)'}}>
            {trend>0?<ArrowUpRight size={11}/>:trend<0?<ArrowDownRight size={11}/>:<Minus size={11}/>}
            {trend!==0&&`${Math.abs(trend)}%`}
          </div>
        )}
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:26,fontWeight:700,color:'var(--label)',lineHeight:1.1,letterSpacing:'-.025em'}}>
          {displayVal}
        </div>
        <div style={{fontSize:11,color:'var(--label-4)',marginTop:3}}>{label}</div>
        {sub&&<div style={{fontSize:10,color:'var(--label-4)',marginTop:2}}>{sub}</div>}
      </div>
      {spark && spark.length > 1 && (
        <div style={{marginTop:'auto', paddingTop:4}}>
          <Spark7 data={spark} cor={cor} h={28} w={80}/>
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
  // Journey map: disparos do pedido para mostrar sequência no Modal 1
  const [ordemDisp, setOrdemDisp] = useState([])

  useEffect(() => {
    if (tipo==='cliente' && dados?.telefone) {
      setLoad(true); setCli(null)
      fetch(`${api}/api/dashboard/disparos-cliente/${encodeURIComponent(dados.telefone)}`)
        .then(r=>r.json()).then(d=>{ setCli(d); setLoad(false) }).catch(()=>setLoad(false))
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

  const meta = tipo==='disparo' ? (GATILHO_META[dados?.gatilho]||{label:dados?.gatilho,icon:Zap,cor:'#7c6af7'}) : null
  const smeta = tipo==='disparo' ? (STATUS_META[dados?.status]||STATUS_META.ignorado) : null

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:60,
        backdropFilter:'blur(2px)',WebkitBackdropFilter:'blur(2px)',animation:'fadeIn .2s ease'}}/>
      <div style={{position:'fixed',top:0,right:0,bottom:0,width:'min(480px,94vw)',zIndex:61,
        display:'flex',flexDirection:'column',animation:'slideIn .3s cubic-bezier(.2,.8,.2,1)',
        background:'var(--bg-2)',borderLeft:'0.5px solid var(--sep)',
        boxShadow:'-4px 0 60px rgba(0,0,0,.6), -24px 0 80px rgba(0,0,0,.4)'}}>

        {/* ── HEADER COM GRADIENTE ── */}
        <div style={{flexShrink:0,padding:'18px 20px 16px',
          background:tipo==='cliente'
            ?'linear-gradient(135deg,#12073a 0%,#1e0d5c 50%,#2a0e6b 100%)'
            :`linear-gradient(135deg,${meta?.cor}22 0%,var(--bg-3) 100%)`,
          borderBottom:'0.5px solid var(--sep)',position:'relative',overflow:'hidden'}}>
          {/* blob decorativo */}
          <div style={{position:'absolute',top:-30,right:-30,width:120,height:120,borderRadius:'50%',
            background:tipo==='cliente'?'rgba(124,106,247,.25)':`${meta?.cor}20`,
            filter:'blur(30px)',pointerEvents:'none'}}/>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              {tipo==='cliente'
                ? <div style={{width:32,height:32,borderRadius:9,background:'rgba(124,106,247,.2)',
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Users size={16} style={{color:'#a78bfa'}}/>
                  </div>
                : <div style={{width:32,height:32,borderRadius:9,background:`${meta?.cor}20`,
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {React.createElement(meta?.icon||Zap,{size:16,style:{color:meta?.cor}})}
                  </div>
              }
              <div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--label)'}}>
                  {tipo==='cliente'?'Perfil do cliente':'Detalhe do disparo'}
                </div>
                <div style={{fontSize:10.5,color:'var(--label-4)',marginTop:1}}>
                  {tipo==='cliente'?fmtTel(dados?.telefone):(meta?.label||dados?.gatilho)}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{width:28,height:28,borderRadius:8,
              display:'flex',alignItems:'center',justifyContent:'center',
              background:'rgba(255,255,255,.08)',border:'0.5px solid rgba(255,255,255,.1)',
              cursor:'pointer',color:'var(--label-3)'}}>
              <X size={14}/>
            </button>
          </div>
        </div>

        {/* ── CONTEÚDO SCROLL ── */}
        <div style={{flex:1,minHeight:0,overflowY:'auto',padding:'16px 20px'}}>

          {/* ── DETALHE DO DISPARO ── */}
          {tipo==='disparo' && dados && (() => {
            const Ic    = meta?.icon || Zap
            const SIc   = smeta?.icon || Minus
            const isIgn = dados.status === 'ignorado'
            const isErr = dados.status === 'erro'
            const isOk  = dados.status === 'enviado'
            const isAg  = dados.status === 'aguardando'

            // Insight do backend para este gatilho (para pegar clientes afetados)
            const gatInsight = (insights||[]).find(i=>i.gatilho===dados.gatilho)
            const tempoStr   = tempoRel(dados.criado_em) || fmtDH(dados.criado_em)

            // Taxa de entrega deste gatilho vs média do sistema
            const gatStats  = (stats?.porGatilho||[]).find(g=>g.gatilho===dados.gatilho)
            const envG      = parseInt(gatStats?.enviados||0)
            const errG      = parseInt(gatStats?.erros||0)
            const tentG     = envG + errG
            const taxaGat   = tentG > 0 ? Math.round(envG/tentG*100) : null
            const ativasMedia= (stats?.porGatilho||[]).filter(g=>{
              const e=parseInt(g.enviados||0),er=parseInt(g.erros||0); return (e+er)>0
            })
            const mediaSys  = ativasMedia.length > 0
              ? Math.round(ativasMedia.reduce((acc,g)=>{
                  const e=parseInt(g.enviados||0),er=parseInt(g.erros||0),t=e+er
                  return t>0 ? acc+e/t*100 : acc
                },0)/ativasMedia.length)
              : null

            // Intelligence contextual com impacto quantificado
            const intel = isIgn ? {
              sev:'critico',
              titulo:'Template inativo — cliente nunca notificado',
              msg: `${meta?.label} ${tempoStr} sem notificação.${
                gatInsight?.clientes ? ` Além deste, **${gatInsight.clientes}** pedidos nas últimas 2 semanas no mesmo estado.` : ''
              }`,
              acao:'Ativar template',
            } : isErr ? {
              sev:'erro',
              titulo:'Erro de envio',
              msg: dados.erro_msg || 'Falha na API WhatsApp.',
              acao:'Ver logs técnicos',
            } : isAg ? {
              sev:'aviso',
              titulo:'Aguardando envio',
              msg:`Agendado para +${dados.delay_min}min após o evento. Será enviado automaticamente.`,
              acao:null,
            } : isOk ? {
              sev:'ok',
              titulo:'Entregue com sucesso',
              msg:'Mensagem enviada e entregue ao cliente.',
              acao:null,
            } : null

            const intelCor = {
              critico:{cor:T.red,  dim:T.redDim,  bor:T.redBor,  Icon:AlertTriangle},
              erro:   {cor:T.red,  dim:T.redDim,  bor:T.redBor,  Icon:XCircle},
              aviso:  {cor:T.amber,dim:T.amberDim,bor:T.amberBor,Icon:Clock},
              ok:     {cor:T.green,dim:T.greenDim,bor:T.greenBor,Icon:CheckCircle},
            }[intel?.sev] || {cor:T.ink3,dim:T.gray,bor:T.grayBor,Icon:Info}

            // Journey stages com timestamps dos disparos reais
            const JOURNEY = [
              {id:'pagamento_aprovado', lbl:'Pago',     short:'Pago'},
              {id:'em_separacao',       lbl:'Separado', short:'Sep.'},
              {id:'pedido_enviado',     lbl:'Enviado',  short:'Env.'},
              {id:'pedido_entregue',    lbl:'Entregue', short:'Entregue'},
              {id:'avaliar_pedido',     lbl:'Avaliação',short:'Aval.'},
            ]
            const stSt   = sid => (ordemDisp||[]).find(x=>x.gatilho===sid)?.status || 'pendente'
            const stTime = sid => {
              const d = (ordemDisp||[]).find(x=>x.gatilho===sid)
              if (!d?.criado_em) return null
              return new Date(d.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
            }
            const stCor  = s => s==='enviado'?T.green:s==='ignorado'?T.amber:s==='erro'?T.red:null
            const stBor  = s => s==='enviado'?T.greenBor:s==='ignorado'?T.amberBor:s==='erro'?T.redBor:'rgba(255,255,255,.1)'
            const stDim  = s => s==='enviado'?T.greenDim:s==='ignorado'?T.amberDim:s==='erro'?T.redDim:'rgba(255,255,255,.04)'
            const curIdx = JOURNEY.findIndex(s=>s.id===dados.gatilho)

            // Linha de status da jornada (ex: "04/06 · ENTREGUE SEM NOTIF.")
            const journeyStatus = isIgn
              ? `${new Date(dados.criado_em).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} · ${meta?.label?.toUpperCase()} SEM NOTIF.`
              : isErr
              ? `${new Date(dados.criado_em).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} · ERRO NO ENVIO`
              : isOk
              ? `${new Date(dados.criado_em).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} · ENTREGUE`
              : null

            const doR = async () => { setEnvR(true); try{ await onReenviar?.(dados.id); setJaR(true) }catch{}; setEnvR(false) }

            return (
              <div style={{display:'flex',flexDirection:'column',animation:'fadeIn .25s ease',height:'100%'}}>

                {/* ── Header gradiente ── */}
                <div style={{padding:'16px',flexShrink:0,
                  background:`linear-gradient(135deg,${meta?.cor}18 0%,${T.bg3} 65%)`,
                  borderBottom:`1px solid ${meta?.cor}20`}}>
                  {/* Linha 1: ícone + título + tempo */}
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                    <div style={{width:44,height:44,borderRadius:12,flexShrink:0,
                      background:`${meta?.cor}18`,border:`1.5px solid ${meta?.cor}35`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      boxShadow:`0 4px 20px ${meta?.cor}20`}}>
                      <Ic size={22} style={{color:meta?.cor}}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:17,fontWeight:700,color:T.ink1,letterSpacing:'-.025em'}}>
                        {meta?.label}
                      </div>
                    </div>
                    <span style={{fontSize:10.5,color:T.ink4,flexShrink:0}}>
                      ● {tempoStr}
                    </span>
                  </div>
                  {/* Linha 2: badges */}
                  <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                    <span style={{fontSize:10,padding:'2px 8px',borderRadius:99,fontWeight:600,
                      background:smeta?.bg,color:smeta?.cor,border:`0.5px solid ${smeta?.cor}30`,
                      display:'flex',alignItems:'center',gap:4}}>
                      {React.createElement(SIc,{size:8})}
                      {smeta?.label}
                    </span>
                    {(dados.origem==='rastreio_job'||dados.origem==='job')&&(
                      <span style={{fontSize:10,padding:'2px 8px',borderRadius:99,fontWeight:600,
                        background:'rgba(6,182,212,.12)',color:'#06b6d4',border:'0.5px solid rgba(6,182,212,.3)'}}>
                        job auto
                      </span>
                    )}
                    {dados.numero_pedido&&(
                      <span style={{fontSize:10,padding:'2px 8px',borderRadius:99,fontWeight:700,
                        background:T.purpleDim,color:T.purple,border:`0.5px solid ${T.purpleBor}`}}>
                        #{dados.numero_pedido}
                      </span>
                    )}
                    {dados.nome_cliente&&(
                      <span style={{fontSize:10,padding:'2px 9px',borderRadius:99,fontWeight:600,
                        background:'rgba(251,146,60,.12)',color:'#fb923c',border:'0.5px solid rgba(251,146,60,.3)',
                        maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {dados.nome_cliente.split(' ').slice(0,2).join(' ')}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{flex:1,overflowY:'auto'}}>
                  <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:10}}>

                    {/* ── Intelligence card ── */}
                    {intel && (() => {
                      const {cor,dim,bor,Icon} = intelCor
                      // Parse bold em msg: **texto** → <strong>
                      const renderMsg = (txt) => {
                        const parts = txt.split(/(\*\*[^*]+\*\*)/)
                        return parts.map((p,i)=>
                          p.startsWith('**')
                            ? <strong key={i} style={{color:cor}}>{p.slice(2,-2)}</strong>
                            : p
                        )
                      }
                      return (
                        <div style={{borderRadius:11,padding:'13px 14px',background:dim,
                          border:`1px solid ${bor}`,display:'flex',gap:10,alignItems:'flex-start'}}>
                          <Icon size={18} style={{color:cor,flexShrink:0,marginTop:2}}/>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
                              <div style={{fontSize:13,fontWeight:700,color:cor,lineHeight:1.35}}>
                                {intel.titulo}
                              </div>
                              <span style={{fontSize:9,padding:'1px 7px',borderRadius:99,marginLeft:8,flexShrink:0,
                                background:`${cor}20`,color:cor,fontWeight:700,letterSpacing:'.05em'}}>
                                {intel.sev==='critico'?'CRÍTICO':intel.sev==='erro'?'ERRO':intel.sev==='aviso'?'AVISO':'OK'}
                              </span>
                            </div>
                            <div style={{fontSize:12,color:T.ink2,lineHeight:1.6,marginBottom:intel.acao?10:0}}>
                              {renderMsg(intel.msg)}
                            </div>
                            {intel.acao&&(
                              <div style={{display:'flex',gap:8}}>
                                <button style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
                                  gap:6,padding:'8px',borderRadius:8,
                                  border:`1px solid ${T.sep2}`,background:T.bg3,
                                  color:T.ink1,cursor:'pointer',fontSize:12,fontWeight:600}}>
                                  <Settings size={13}/>{intel.acao} ↗
                                </button>
                                <button disabled={jaReenv||enviandoR} onClick={doR}
                                  style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
                                  gap:6,padding:'8px',borderRadius:8,
                                  border:`1px solid ${T.sep2}`,background:T.bg3,
                                  color:jaReenv?T.green:T.ink1,cursor:'pointer',fontSize:12,fontWeight:600}}>
                                  {enviandoR?<RefreshCw size={12} style={{animation:'spin .7s linear infinite'}}/>
                                   :jaReenv?<><CheckCircle size={12}/>Enviado!</>
                                   :<><Send size={13}/>Enviar agora</>}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {/* ── Taxa de entrega vs média ── */}
                    {(taxaGat !== null || mediaSys !== null) && (
                      <div style={{borderRadius:10,padding:'10px 13px',
                        background:'rgba(79,142,247,.06)',border:'1px solid rgba(79,142,247,.18)',
                        display:'flex',alignItems:'center',gap:10}}>
                        <Activity size={14} style={{color:'#4f8ef7',flexShrink:0}}/>
                        <span style={{fontSize:12,color:T.ink2}}>
                          Taxa de entrega notificada este mês:&nbsp;
                          <strong style={{color:taxaGat===null?T.red:taxaGat>=70?T.green:T.amber}}>
                            {taxaGat===null?'0%':`${taxaGat}%`}
                          </strong>
                          {mediaSys!==null&&<>
                            &nbsp;·&nbsp;Média do sistema:&nbsp;
                            <strong style={{color:T.green}}>{mediaSys}%</strong>
                          </>}
                        </span>
                      </div>
                    )}

                    {/* ── Journey mini-map com timestamps ── */}
                    <div style={{padding:'12px 13px',borderRadius:10,background:T.bg3,border:`1px solid ${T.sep}`}}>
                      {/* Header da jornada */}
                      <div style={{display:'flex',alignItems:'center',
                        justifyContent:'space-between',marginBottom:12}}>
                        <div style={{display:'flex',alignItems:'center',gap:5,
                          fontSize:9,color:T.ink3,textTransform:'uppercase',letterSpacing:'.07em'}}>
                          <Navigation size={10}/>
                          JORNADA DO PEDIDO {dados.numero_pedido?`#${dados.numero_pedido}`:''}
                        </div>
                        {journeyStatus&&(
                          <span style={{fontSize:9,color:isIgn||isErr?T.amber:T.green,
                            fontWeight:600,letterSpacing:'.04em',textTransform:'uppercase'}}>
                            {journeyStatus}
                          </span>
                        )}
                      </div>
                      {/* Nós com timestamps */}
                      <div style={{display:'flex',alignItems:'flex-start'}}>
                        {JOURNEY.map((st,si)=>{
                          const s    = stSt(st.id)
                          const isCur= st.id === dados.gatilho
                          const cor2 = stCor(s) || (isCur ? T.amber : null)
                          const time = stTime(st.id)
                          const DotIc= s==='enviado'?CheckCircle:s==='erro'?XCircle:isCur?Navigation:null
                          // Label especial para o nó atual ignorado
                          const lblBottom = isCur && isIgn ? 'sem notif.' : null
                          const lineColor = si < curIdx
                            ? T.green
                            : 'rgba(255,255,255,.08)'
                          return (
                            <React.Fragment key={st.id}>
                              <div style={{display:'flex',flexDirection:'column',
                                alignItems:'center',gap:2,flex:1,minWidth:0}}>
                                {/* Nó */}
                                <div style={{width:24,height:24,borderRadius:'50%',
                                  background:stDim(s)||(isCur?T.amberDim:'rgba(255,255,255,.04)'),
                                  border:`2px solid ${stBor(s)||(isCur?T.amberBor:'rgba(255,255,255,.1)')}`,
                                  display:'flex',alignItems:'center',justifyContent:'center',
                                  animation:isCur&&!isOk?'pulse 2s ease-in-out infinite':undefined,
                                  boxShadow:cor2?`0 0 8px ${cor2}40`:undefined}}>
                                  {DotIc?<DotIc size={10} style={{color:cor2||T.ink4}}/>:null}
                                </div>
                                {/* Label */}
                                <span style={{fontSize:8.5,textAlign:'center',lineHeight:1.25,
                                  color:isCur?cor2||T.amber:cor2?cor2:T.ink4,
                                  fontWeight:isCur?700:400,maxWidth:48,
                                  overflow:'hidden',textOverflow:'ellipsis'}}>
                                  {st.lbl}
                                </span>
                                {/* Sub-label para ignorado */}
                                {lblBottom&&(
                                  <span style={{fontSize:7.5,color:T.amber,fontWeight:600,
                                    textAlign:'center',lineHeight:1.2}}>
                                    {lblBottom}
                                  </span>
                                )}
                                {/* Timestamp real */}
                                {time&&(
                                  <span style={{fontSize:8.5,color:T.ink4,fontFamily:'monospace',
                                    letterSpacing:'-.02em'}}>
                                    {time}
                                  </span>
                                )}
                              </div>
                              {si < JOURNEY.length-1 && (
                                <div style={{height:2,flex:1,alignSelf:'flex-start',marginTop:11,flexShrink:0,
                                  background:si < curIdx
                                    ? `linear-gradient(90deg,${T.green}80,${T.green}40)`
                                    : 'rgba(255,255,255,.07)',
                                  borderRadius:99}}/>
                              )}
                            </React.Fragment>
                          )
                        })}
                      </div>
                    </div>

                    {/* ── Diagnóstico técnico colapsável ── */}
                    <details style={{borderRadius:9,overflow:'hidden',border:`1px solid ${T.sep}`}}>
                      <summary style={{padding:'9px 12px',background:T.bg3,cursor:'pointer',
                        fontSize:10,color:T.ink3,textTransform:'uppercase',letterSpacing:'.07em',
                        display:'flex',alignItems:'center',gap:6,userSelect:'none',listStyle:'none'}}>
                        <ChevronRight size={10} style={{transition:'transform .2s'}}/>
                        DIAGNÓSTICO TÉCNICO
                        <ChevronDown size={10} style={{marginLeft:'auto'}}/>
                      </summary>
                      <div style={{background:T.bg2}}>
                        {[
                          {l:'Template',  v:dados.template_nome||dados.gatilho, ok:true},
                          {l:'Gatilho',   v:dados.gatilho,                      ok:true},
                          {l:'Origem',    v:dados.origem||'bling',              ok:true},
                          {l:'Status',    v:dados.status,                       ok:dados.status==='enviado'},
                          {l:'Erro',      v:dados.erro_msg||'—',               ok:!dados.erro_msg},
                          {l:'Delay',     v:dados.delay_min>0?`+${dados.delay_min}min`:'imediato', ok:true},
                        ].map((f,i)=>(
                          <div key={i} style={{display:'flex',alignItems:'center',gap:10,
                            padding:'7px 12px',borderTop:`1px solid ${T.sep}`}}>
                            <div style={{width:6,height:6,borderRadius:'50%',flexShrink:0,
                              background:f.ok?T.green:T.red}}/>
                            <span style={{fontSize:10.5,color:T.ink3,width:72,flexShrink:0}}>{f.l}</span>
                            <span style={{fontSize:10.5,color:T.ink2,fontFamily:'monospace',
                              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.v}</span>
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* ── Grid 2×2 ── */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,
                      borderRadius:10,overflow:'hidden',border:`1px solid ${T.sep}`}}>
                      {[
                        {l:'CLIENTE',       v:dados.nome_cliente||'—',                  bg:T.bg2},
                        {l:'TELEFONE',      v:fmtTel(dados.telefone||''),                bg:T.bg2, mono:true},
                        {l:'DATA / DELAY',  v:`${fmtDH(dados.criado_em)} · ${dados.delay_min>0?`+${dados.delay_min}min`:'imediato'}`, bg:T.bg0},
                        {l:'ID DO REGISTRO',v:`#${dados.id||'—'}`,                      bg:T.bg0, col:T.purple},
                      ].map((f,i)=>(
                        <div key={i} style={{padding:'9px 12px',background:f.bg,
                          display:'flex',flexDirection:'column',gap:2}}>
                          <span style={{fontSize:8.5,color:T.ink3,textTransform:'uppercase',
                            letterSpacing:'.06em'}}>{f.l}</span>
                          <span style={{fontSize:12,color:f.col||T.ink1,
                            fontFamily:f.mono?'monospace':'inherit',
                            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {f.v}
                          </span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                {/* ── Actions footer ── */}
                <div style={{flexShrink:0,padding:'12px 14px',borderTop:`1px solid ${T.sep}`,
                  background:T.bg2,display:'flex',flexDirection:'column',gap:8}}>
                  {/* Primário */}
                  <button disabled={jaReenv||enviandoR} onClick={doR}
                    style={{padding:'12px',borderRadius:10,
                    border:`1px solid ${jaReenv?T.greenBor:T.sep2}`,
                    background:jaReenv?T.greenDim:T.bg3,
                    color:jaReenv?T.green:T.ink1,fontSize:13,fontWeight:600,cursor:jaReenv?'default':'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                    {enviandoR?<><RefreshCw size={13} style={{animation:'spin .7s linear infinite'}}/>Enviando...</>
                     :jaReenv?<><CheckCircle size={13}/>Mensagem enviada!</>
                     :<><Send size={13}/>Enviar mensagem agora</>}
                  </button>
                  {/* Secundários */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <button onClick={()=>onVerPedido?.(dados.numero_pedido)}
                      style={{padding:'10px',borderRadius:9,
                      border:`1px solid ${T.sep2}`,background:T.bg3,
                      color:T.ink2,cursor:'pointer',fontSize:12,fontWeight:500,
                      display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                      <ExternalLink size={12}/>Ver pedido
                    </button>
                    <button onClick={()=>onFiltrarGatilho?.('__cliente__',dados.telefone)}
                      style={{padding:'10px',borderRadius:9,
                      border:`1px solid ${T.purpleBor}`,
                      background:'linear-gradient(135deg,rgba(91,33,182,.3),rgba(147,51,234,.2))',
                      color:T.purple,cursor:'pointer',fontSize:12,fontWeight:600,
                      display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                      <Users size={12}/>Ver perfil completo
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}


          {/* ── PERFIL DO CLIENTE — Ultra Premium ── */}
          {tipo==='cliente' && (() => {
            // ── Métricas base ─────────────────────────────────────────────
            const total    = cli?.resumo?.total    || 0
            const enviados = cli?.resumo?.enviados || 0
            const erros    = cli?.resumo?.erros    || 0
            const ignorados= total - enviados - erros
            const pedidos  = cli?.resumo?.pedidos  || []

            // Saúde: % de disparos enviados com sucesso
            const score    = total > 0 ? Math.round(enviados / total * 100) : 0
            const CIRC     = 138  // 2π × r(22)
            const dashOff  = Math.round(CIRC * (1 - score / 100))
            const rCor     = score > 70 ? T.green : score > 30 ? T.amber : T.red
            const rDim     = score > 70 ? T.greenDim : score > 30 ? T.amberDim : T.redDim
            const rBor     = score > 70 ? T.greenBor : score > 30 ? T.amberBor : T.redBor
            const scLbl    = score === 0 ? 'Crítico' : score < 30 ? 'Em risco' : score < 70 ? 'Atenção' : 'Saudável'

            // ── Journey helpers ───────────────────────────────────────────
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
            const ndCor = s => s==='enviado'?T.green : s==='ignorado'?T.amber : s==='erro'?T.red : null
            const ndBor = s => s==='enviado'?T.greenBor : s==='ignorado'?T.amberBor : s==='erro'?T.redBor : 'rgba(255,255,255,.1)'
            const ndDim = s => s==='enviado'?T.greenDim : s==='ignorado'?T.amberDim : s==='erro'?T.redDim : 'rgba(255,255,255,.04)'
            const ndIco = s => s==='enviado'?CheckCircle : s==='ignorado'?AlertTriangle : s==='erro'?XCircle : null

            // ── Insight cliente-específico ─────────────────────────────
            const todasIgn   = total > 0 && ignorados === total
            const nomeFirst  = (cli?.resumo?.nome||'Este cliente').split(' ')[0]
            // Gatilho mais ignorado para este cliente
            const maisIgnMap = (cli?.disparos||[]).reduce((acc,d)=>{
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
            // Para o render com code inline
            const insightRich = todasIgn && gatMaisIgn ? {
              nomeFirst,
              pedidos: pedidos.length,
              gatilho: gatMaisIgn,
            } : null

            // ── Timeline filtrada e agrupada ──────────────────────────────
            const dispFilt = selPed==='todos'
              ? (cli?.disparos||[])
              : (cli?.disparos||[]).filter(d=>String(d.numero_pedido)===String(selPed))

            const grpMap = {}
            dispFilt.forEach(d => {
              const dt = new Date(d.criado_em)
              const hoje  = new Date()
              const ontem = new Date(hoje); ontem.setDate(hoje.getDate()-1)
              const k = dt.toDateString()===hoje.toDateString() ? 'Hoje'
                : dt.toDateString()===ontem.toDateString() ? 'Ontem'
                : dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
              ;(grpMap[k] = grpMap[k]||[]).push(d)
            })
            const grps = Object.entries(grpMap)

            return (
              <div style={{display:'flex',flexDirection:'column',gap:0,animation:'fadeIn .25s ease'}}>
                {loadCli && (
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                    padding:'48px 0',color:T.ink3}}>
                    <RefreshCw size={18} style={{animation:'spin 1s linear infinite',color:T.purple}}/>
                    <span style={{fontSize:12}}>Carregando histórico...</span>
                  </div>
                )}
                {cli && (
                  <>
                    {/* ── HERO: anel de saúde + nome + badges ── */}
                    <div style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:14,
                      background:'linear-gradient(135deg,#0e0830,#160d4a,#111520)',
                      borderBottom:`1px solid rgba(167,139,250,.1)`}}>
                      {/* Anel SVG */}
                      <div style={{position:'relative',width:52,height:52,flexShrink:0}}>
                        <svg width="52" height="52" viewBox="0 0 52 52" aria-label={`Saúde do cliente: ${score}%`}>
                          <circle cx="26" cy="26" r="22" fill="none" stroke={T.bg4} strokeWidth="4.5"/>
                          <circle cx="26" cy="26" r="22" fill="none" stroke={rCor}
                            strokeWidth="4.5" strokeDasharray={`${CIRC}`} strokeDashoffset={`${dashOff}`}
                            strokeLinecap="round" transform="rotate(-90 26 26)"
                            style={{transition:'stroke-dashoffset .8s ease'}}/>
                        </svg>
                        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
                          alignItems:'center',justifyContent:'center'}}>
                          <span style={{fontSize:13,fontWeight:700,color:rCor,lineHeight:1}}>{score}%</span>
                          <span style={{fontSize:7,color:T.ink4,marginTop:1}}>{scLbl}</span>
                        </div>
                      </div>
                      {/* Nome + info */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:15,fontWeight:700,color:T.ink1,
                          letterSpacing:'-.025em',marginBottom:4}}>
                          {cli.resumo?.nome || 'Cliente'}
                        </div>
                        <div style={{fontSize:10.5,color:T.ink3,fontFamily:'monospace',marginBottom:6}}>
                          {fmtTel(dados.telefone)}
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                          {score===0&&<span style={{fontSize:9.5,padding:'2px 8px',borderRadius:99,
                            background:T.redDim,color:T.red,border:`1px solid ${T.redBor}`,fontWeight:600}}>
                            Cliente em risco
                          </span>}
                          {cli.resumo?.ultimo_contato&&<span style={{fontSize:9.5,color:T.ink4,
                            display:'flex',alignItems:'center',gap:4}}>
                            <Clock size={10}/>
                            {tempoRel(cli.resumo.ultimo_contato)||fmtDH(cli.resumo.ultimo_contato)}
                          </span>}
                        </div>
                      </div>
                    </div>

                    {/* ── STATS 4 colunas ── */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',
                      borderBottom:`1px solid ${T.sep}`}}>
                      {[
                        {lbl:'Disparos', val:total,    cor:T.ink1},
                        {lbl:'Enviados', val:enviados,  cor:enviados>0?T.green:T.red},
                        {lbl:'Ignorados',val:ignorados, cor:ignorados>0?T.amber:T.ink3},
                        {lbl:'Pedidos',  val:pedidos.length, cor:T.purple},
                      ].map((s,i)=>(
                        <div key={i} style={{padding:'10px 0',textAlign:'center',
                          borderRight:i<3?`1px solid rgba(255,255,255,.04)`:'none'}}>
                          <div style={{fontSize:20,fontWeight:700,color:s.cor,
                            letterSpacing:'-.03em',lineHeight:1}}>{s.val}</div>
                          <div style={{fontSize:8,color:T.ink3,textTransform:'uppercase',
                            letterSpacing:'.05em',marginTop:3}}>{s.lbl}</div>
                        </div>
                      ))}
                    </div>

                    {/* ── INSIGHT INTELIGENTE ── */}
                    {insightTxt && (
                      <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.sep}`}}>
                        <div style={{borderRadius:10,padding:'12px 14px',
                          background:T.amberDim,border:`1px solid ${T.amberBor}`,
                          display:'flex',gap:11,alignItems:'flex-start'}}>
                          {/* Brain icon */}
                          <div style={{width:30,height:30,borderRadius:9,flexShrink:0,
                            background:'rgba(251,146,60,.15)',border:'1px solid rgba(251,146,60,.3)',
                            display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>
                            🧠
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:700,color:T.amber,marginBottom:6,lineHeight:1.3}}>
                              {insightRich
                                ? `${insightRich.nomeFirst} nunca recebeu uma mensagem`
                                : 'Inteligência do disparo'}
                            </div>
                            <div style={{fontSize:12,color:T.ink2,lineHeight:1.65,marginBottom:10}}>
                              {insightRich ? (
                                <span>
                                  {insightRich.pedidos} pedido{insightRich.pedidos>1?'s':''} entregues, 0 notificações. O template{' '}
                                  <code style={{fontSize:11,padding:'1px 6px',borderRadius:4,
                                    background:'rgba(255,255,255,.1)',color:T.ink1,fontFamily:'monospace'}}>
                                    {insightRich.gatilho}
                                  </code>
                                  {' '}está inativo.
                                </span>
                              ) : insightTxt}
                            </div>
                            <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
                              <button onClick={async()=>{
                                const alvo=(cli?.disparos||[]).filter(d=>d.status==='ignorado'||d.status==='erro')
                                for(const d of alvo) await onReenviar?.(d.id)
                              }} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 13px',
                                borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,
                                background:'linear-gradient(135deg,#5b21b6,#9333ea)',color:'#fff'}}>
                                <Send size={11}/>Corrigir e reenviar tudo ↗
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── ORDER CARDS COM MINI JORNADA ── */}
                    {pedidos.length > 0 && (
                      <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.sep}`}}>
                        <div style={{fontSize:9,color:T.ink3,textTransform:'uppercase',
                          letterSpacing:'.07em',marginBottom:8}}>
                          Pedidos · toque para filtrar
                        </div>

                        {/* Card grande: pedido mais recente */}
                        {(() => {
                          const p0 = pedidos[0]
                          const isActive = selPed===String(p0)
                          const qtd = (cli.disparos||[]).filter(d=>String(d.numero_pedido)===String(p0)).length
                          return (
                            <div onClick={()=>setSelPed(isActive?'todos':String(p0))}
                              style={{background:isActive?`${T.purpleDim}`:`${T.bg2}`,
                                border:`1px solid ${isActive?T.purpleBor:T.sep}`,
                                borderRadius:12,padding:'10px 12px',cursor:'pointer',
                                transition:'all .15s',marginBottom:6}}>
                              <div style={{display:'flex',alignItems:'center',
                                justifyContent:'space-between',marginBottom:8}}>
                                <span style={{fontSize:12,fontWeight:700,
                                  color:isActive?T.purple:T.ink2}}>#{p0}</span>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <span style={{fontSize:9,padding:'1px 7px',borderRadius:99,
                                    background:enviados>0?T.greenDim:T.redDim,
                                    color:enviados>0?T.green:T.red,
                                    border:`1px solid ${enviados>0?T.greenBor:T.redBor}`}}>
                                    {(cli.disparos||[]).filter(d=>String(d.numero_pedido)===String(p0)&&d.status==='enviado').length}/{qtd} enviados
                                  </span>
                                </div>
                              </div>
                              {/* Mini jornada */}
                              <div style={{display:'flex',alignItems:'center',gap:0}}>
                                {STAGES.map((st,si)=>{
                                  const s = stFor(p0, st.id)
                                  const Ico = ndIco(s)
                                  return (
                                    <React.Fragment key={st.id}>
                                      <div style={{display:'flex',flexDirection:'column',
                                        alignItems:'center',gap:3,flex:1}}>
                                        <div style={{width:18,height:18,borderRadius:'50%',
                                          background:ndDim(s),
                                          border:`1.5px solid ${ndBor(s)}`,
                                          display:'flex',alignItems:'center',justifyContent:'center'}}>
                                          {Ico && <Ico size={8} style={{color:ndCor(s)}}/>}
                                        </div>
                                        <span style={{fontSize:7,color:ndCor(s)||T.ink4,
                                          textAlign:'center',lineHeight:1.2}}>{st.lbl}</span>
                                      </div>
                                      {si < STAGES.length-1 && (
                                        <div style={{width:8,height:1,
                                          background:ndCor(stFor(p0,st.id))
                                            ? `${ndCor(stFor(p0,st.id))}50`
                                            :'rgba(255,255,255,.06)',
                                          flexShrink:0,marginBottom:14}}/>
                                      )}
                                    </React.Fragment>
                                  )
                                })}
                              </div>
                              {/* Status text do pedido */}
                              {(() => {
                                const dispP0 = (cli?.disparos||[]).filter(d=>String(d.numero_pedido)===String(p0))
                                const lastEnv = dispP0.find(d=>d.status==='enviado')
                                const hasIgn  = dispP0.some(d=>d.status==='ignorado')
                                const lastGat = dispP0[0]?.gatilho
                                const lastMeta= GATILHO_META[lastGat]
                                if (!lastMeta) return null
                                const statusTxt = lastEnv
                                  ? `${lastMeta.label} · entregue`
                                  : hasIgn
                                  ? `${lastMeta.label} · aguardando notif.`
                                  : null
                                return statusTxt ? (
                                  <div style={{fontSize:9.5,color:hasIgn&&!lastEnv?T.amber:T.green,
                                    marginTop:6,fontWeight:500,textAlign:'center',lineHeight:1.3}}>
                                    {statusTxt}
                                  </div>
                                ) : null
                              })()}
                            </div>
                          )
                        })()}

                        {/* Cards menores: outros pedidos em grid 2 colunas */}
                        {pedidos.length > 1 && (
                          <div style={{display:'grid',
                            gridTemplateColumns:`repeat(${Math.min(pedidos.slice(1).length,2)},1fr)`,
                            gap:6}}>
                            {pedidos.slice(1,3).map(p=>{
                              const isA = selPed===String(p)
                              const qtd = (cli.disparos||[]).filter(d=>String(d.numero_pedido)===String(p)).length
                              const envP= (cli.disparos||[]).filter(d=>String(d.numero_pedido)===String(p)&&d.status==='enviado').length
                              return (
                                <div key={p} onClick={()=>setSelPed(isA?'todos':String(p))}
                                  style={{background:isA?T.purpleDim:T.bg2,
                                    border:`1px solid ${isA?T.purpleBor:T.sep}`,
                                    borderRadius:10,padding:'8px 10px',cursor:'pointer',
                                    transition:'all .15s'}}>
                                  <div style={{display:'flex',alignItems:'center',
                                    justifyContent:'space-between',marginBottom:5}}>
                                    <span style={{fontSize:11,fontWeight:700,
                                      color:isA?T.purple:T.ink3}}>#{p}</span>
                                    <span style={{fontSize:8.5,color:envP>0?T.green:T.red}}>
                                      {envP}/{qtd}
                                    </span>
                                  </div>
                                  {/* Mini jornada compacta */}
                                  <div style={{display:'flex',alignItems:'center',gap:2}}>
                                    {STAGES.map((st,si)=>{
                                      const s=stFor(p,st.id)
                                      return (
                                        <React.Fragment key={st.id}>
                                          <div style={{width:10,height:10,borderRadius:'50%',
                                            background:ndDim(s),
                                            border:`1px solid ${ndBor(s)}`,flexShrink:0}}/>
                                          {si<STAGES.length-1&&<div style={{flex:1,height:1,
                                            background:ndCor(s)?`${ndCor(s)}40`:'rgba(255,255,255,.05)'}}/>}
                                        </React.Fragment>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Chip "Todos" quando múltiplos pedidos */}
                        {pedidos.length > 1 && (
                          <button onClick={()=>setSelPed('todos')}
                            style={{marginTop:6,width:'100%',padding:'5px',borderRadius:8,
                              border:`1px solid ${selPed==='todos'?T.purpleBor:T.sep}`,
                              background:selPed==='todos'?T.purpleDim:'transparent',
                              color:selPed==='todos'?T.purple:T.ink4,
                              fontSize:10.5,cursor:'pointer',fontWeight:selPed==='todos'?600:400}}>
                            Todos os pedidos ({pedidos.length})
                          </button>
                        )}
                      </div>
                    )}

                    {/* ── TIMELINE ULTRA-COMPACTA AGRUPADA ── */}
                    <div style={{flex:1,overflowY:'auto'}}>
                      {grps.length===0 && (
                        <div style={{padding:'32px 0',textAlign:'center',color:T.ink4}}>
                          <MessageSquare size={24} style={{opacity:.2,marginBottom:8}}/>
                          <div style={{fontSize:12,color:T.ink3}}>Nenhum disparo para este pedido</div>
                        </div>
                      )}
                      {grps.map(([dt, evts])=>(
                        <div key={dt}>
                          {/* Cabeçalho de data */}
                          <div style={{padding:'6px 16px 3px',display:'flex',
                            alignItems:'center',justifyContent:'space-between',
                            position:'sticky',top:0,background:T.bg2,zIndex:1,
                            borderBottom:`1px solid ${T.sep}`}}>
                            <span style={{fontSize:8.5,color:T.ink4,textTransform:'uppercase',
                              letterSpacing:'.07em',display:'flex',alignItems:'center',gap:5}}>
                              <Clock size={9}/>{dt} · {evts.length} evento{evts.length>1?'s':''}
                            </span>
                            {evts.some(d=>d.status==='ignorado'||d.status==='erro')&&(
                              <button onClick={async()=>{
                                const al=evts.filter(d=>d.status==='ignorado'||d.status==='erro')
                                for(const d of al) await onReenviar?.(d.id)
                              }} style={{fontSize:9,color:T.purple,background:T.purpleDim,
                                border:`1px solid ${T.purpleBor}`,borderRadius:5,
                                padding:'2px 8px',cursor:'pointer',fontWeight:600}}>
                                ↗ Reenviar
                              </button>
                            )}
                          </div>

                          {/* Linhas de eventos */}
                          {evts.map((d,i)=>{
                            const m   = GATILHO_META[d.gatilho]||{label:d.gatilho,icon:Zap,cor:'#6b7294'}
                            const Ic  = m.icon
                            const sc  = d.status==='enviado'?T.green:d.status==='erro'?T.red:d.status==='aguardando'?T.amber:T.ink4
                            const sdim= d.status==='enviado'?T.greenDim:d.status==='erro'?T.redDim:d.status==='aguardando'?T.amberDim:T.gray
                            const sbr = d.status==='enviado'?T.greenBor:d.status==='erro'?T.redBor:d.status==='aguardando'?T.amberBor:T.grayBor
                            const sl  = d.status==='enviado'?'Enviado':d.status==='erro'?'Erro':d.status==='aguardando'?'Aguardando':'Ignorado'
                            const podeEnv = d.status==='ignorado'||d.status==='erro'
                            const jaEnv   = reenviados.includes(d.id)
                            return (
                              <div key={d.id||i}
                                style={{display:'flex',alignItems:'center',gap:8,
                                  padding:'7px 16px',borderBottom:`1px solid ${T.sep}`,
                                  background:'transparent',transition:'background .1s',cursor:'default'}}
                                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.02)'}
                                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                {/* Hora */}
                                <span style={{fontSize:9.5,color:T.ink4,width:42,flexShrink:0,
                                  fontFamily:'monospace'}}>
                                  {new Date(d.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
                                </span>
                                {/* Ícone */}
                                <div style={{width:22,height:22,borderRadius:7,flexShrink:0,
                                  background:`${m.cor}18`,border:`0.5px solid ${m.cor}28`,
                                  display:'flex',alignItems:'center',justifyContent:'center'}}>
                                  <Ic size={10} style={{color:m.cor}}/>
                                </div>
                                {/* Nome + pedido */}
                                <div style={{flex:1,minWidth:0}}>
                                  <span style={{fontSize:11.5,color:T.ink2,
                                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                                    display:'block'}}>{m.label}</span>
                                  {selPed==='todos'&&d.numero_pedido&&(
                                    <span style={{fontSize:9,color:T.ink4}}>#{d.numero_pedido}</span>
                                  )}
                                </div>
                                {/* Status pill */}
                                <div style={{display:'inline-flex',alignItems:'center',gap:3,
                                  padding:'2px 7px',borderRadius:99,flexShrink:0,
                                  background:sdim,border:`0.5px solid ${sbr}`}}>
                                  <span style={{fontSize:9,fontWeight:700,color:sc,
                                    textTransform:'uppercase',letterSpacing:'.03em'}}>{sl}</span>
                                </div>
                                {/* Botão enviar */}
                                {podeEnv && (
                                  jaEnv
                                  ? <span style={{fontSize:9.5,color:T.green,flexShrink:0,display:'flex',
                                      alignItems:'center',gap:3}}>
                                      <CheckCircle size={10}/>ok
                                    </span>
                                  : <button onClick={()=>onReenviar?.(d.id)}
                                      style={{padding:'4px 0 4px 12px',flexShrink:0,
                                        background:'transparent',border:'none',
                                        color:T.ink1,fontSize:14,fontWeight:700,
                                        cursor:'pointer',letterSpacing:'-.01em',
                                        borderLeft:`2px solid ${T.sep2}`}}>
                                      Enviar
                                    </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>

                    {/* ── FOOTER: envio manual compacto ── */}
                    <div style={{flexShrink:0,borderTop:`1px solid ${T.sep}`,
                      padding:'10px 14px',background:T.bg2,display:'flex',
                      flexDirection:'column',gap:8}}>
                      <div style={{display:'flex',gap:7}}>
                        <select value={gatManual} onChange={e=>setGatManual(e.target.value)}
                          style={{flex:1,padding:'8px 10px',borderRadius:9,fontSize:12,
                            border:`1px solid ${T.sep2}`,background:T.bg3,color:T.ink2,
                            outline:'none',appearance:'auto'}}>
                          <option value="">Selecione o gatilho...</option>
                          {Object.entries(GATILHO_META).map(([k,v])=>(
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                        <input value={pedManual} onChange={e=>setPedManual(e.target.value)}
                          placeholder="Pedido" style={{width:80,padding:'8px 10px',
                            borderRadius:9,fontSize:12,border:`1px solid ${T.sep2}`,
                            background:T.bg3,color:T.ink2,outline:'none'}}/>
                      </div>
                      <button disabled={!gatManual||enviandoMan} onClick={enviarManual}
                        style={{width:'100%',padding:'10px',borderRadius:10,border:'none',
                          fontSize:12.5,fontWeight:600,cursor:gatManual?'pointer':'not-allowed',
                          background:envManOk?T.greenDim:gatManual?'linear-gradient(135deg,#5b21b6,#9333ea)':T.bg4,
                          color:envManOk?T.green:gatManual?'#fff':T.ink4,
                          display:'flex',alignItems:'center',justifyContent:'center',gap:7,
                          opacity:!gatManual?.6:1,transition:'all .15s'}}>
                        {enviandoMan
                          ? <><RefreshCw size={12} style={{animation:'spin .7s linear infinite'}}/>Enviando...</>
                          : envManOk
                          ? <><CheckCircle size={12}/>Enviado com sucesso!</>
                          : <><Send size={12}/>Enviar para este cliente</>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })()}
        </div>
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

// ─── LINHA DO LOG com suporte a seleção (batch actions) ───────────────────────
function LinhaLog({row, onVerDisparo, onVerCliente, selecionado, onToggleSel}) {
  const meta  = GATILHO_META[row.gatilho] || {label:row.gatilho, icon:Zap, cor:'#6b7294'}
  const Ic    = meta.icon || Zap
  const rel   = tempoRel(row.criado_em)
  const statusCor = row.status==='enviado'?T.green:row.status==='erro'?T.red:row.status==='aguardando'?T.amber:'#6b7294'
  const statusDim = row.status==='enviado'?T.greenDim:row.status==='erro'?T.redDim:row.status==='aguardando'?T.amberDim:T.gray
  const statusBor = row.status==='enviado'?T.greenBor:row.status==='erro'?T.redBor:row.status==='aguardando'?T.amberBor:T.grayBor
  const statusLbl = row.status==='enviado'?'Enviado':row.status==='erro'?'Erro':row.status==='aguardando'?'Aguardando':'Ignorado'
  const SIc       = row.status==='enviado'?CheckCircle:row.status==='erro'?XCircle:row.status==='aguardando'?Clock:Minus
  const origem    = row.origem==='rastreio_job'||row.origem==='job'?'auto':row.origem==='manual_painel'?'manual':row.origem==='manual_reenvio'?'reenvio':null
  const ini       = (row.nome_cliente||'?').split(' ').slice(0,2).map(p=>p[0]||'').join('').toUpperCase()||'?'

  return (
    <div className="log-row" onClick={()=>selecionado!==undefined?onToggleSel?.(row.id):onVerDisparo?.(row)}
      style={{display:'flex',alignItems:'stretch',cursor:'pointer',
        borderBottom:`1px solid ${T.sep}`,transition:'background .1s',position:'relative',
        background:selecionado?`${T.purpleDim}`:'transparent'}}>

      {/* Barra de status lateral */}
      <div style={{width:3,flexShrink:0,alignSelf:'stretch',
        background:row.status==='enviado'?T.green:row.status==='erro'?T.red:'transparent',
        borderRadius:'0 2px 2px 0'}}/>

      {/* Checkbox (aparece no hover via CSS, sempre presente no DOM) */}
      <div className="row-checkbox" onClick={e=>{e.stopPropagation();onToggleSel?.(row.id)}}
        style={{width:32,flexShrink:0,display:'flex',alignItems:'center',
          justifyContent:'center',cursor:'pointer',opacity:selecionado?1:0,
          transition:'opacity .1s'}}>
        <div style={{width:15,height:15,borderRadius:4,transition:'all .12s',
          background:selecionado?T.purple:'transparent',
          border:`1.5px solid ${selecionado?T.purple:T.sep2}`,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          {selecionado&&<Check size={9} style={{color:'#fff'}}/>}
        </div>
      </div>

      {/* Avatar do cliente */}
      <div onClick={e=>{e.stopPropagation();onVerCliente?.(row)}} title="Ver perfil do cliente"
        style={{width:40,flexShrink:0,display:'flex',alignItems:'center',
          justifyContent:'center',padding:'0 4px',cursor:'pointer'}}>
        <div style={{width:30,height:30,borderRadius:'50%',background:`${meta.cor}22`,
          border:`1px solid ${meta.cor}35`,display:'flex',alignItems:'center',
          justifyContent:'center',fontSize:11,fontWeight:700,color:meta.cor}}>
          {ini}
        </div>
      </div>

      {/* Ícone do gatilho */}
      <div style={{width:36,flexShrink:0,display:'flex',alignItems:'center',
        justifyContent:'center',padding:'12px 0'}}>
        <div style={{width:28,height:28,borderRadius:8,background:`${meta.cor}18`,
          border:`0.5px solid ${meta.cor}30`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Ic size={13} style={{color:meta.cor}}/>
        </div>
      </div>

      {/* Info central */}
      <div style={{flex:1,minWidth:0,padding:'11px 10px 11px 6px'}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
          <span style={{fontSize:12.5,fontWeight:600,color:T.ink1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{meta.label}</span>
          {row.numero_pedido&&<span style={{fontSize:9.5,padding:'1px 7px',borderRadius:99,flexShrink:0,background:T.purpleDim,color:T.purple,border:`0.5px solid ${T.purpleBor}`,fontWeight:600}}>#{row.numero_pedido}</span>}
          {origem&&<span style={{fontSize:9,padding:'1px 6px',borderRadius:99,flexShrink:0,background:T.bg4,color:T.ink3,border:`0.5px solid ${T.sep2}`}}>{origem}</span>}
          {row.delay_min>0&&<span style={{fontSize:9,padding:'1px 6px',borderRadius:99,flexShrink:0,background:T.amberDim,color:T.amber}}>+{row.delay_min}min</span>}
          {(()=>{
            const cm = CANAL_META[row.canal]
            if (!cm) return null
            return (
              <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,
                padding:'1px 6px',borderRadius:99,flexShrink:0,
                background:cm.bg||`${cm.cor}18`,color:cm.cor,
                border:`0.5px solid ${cm.cor}35`,fontWeight:600}}>
                <PlataformaSVG canal={row.canal} size={10}/>
                {cm.label}
              </span>
            )
          })()}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:T.ink3}}>
          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:180}}>{row.nome_cliente||'—'}</span>
          {row.telefone&&<><span style={{color:T.ink4}}>·</span><span style={{fontFamily:'monospace',flexShrink:0,color:T.ink4}}>{fmtTel(row.telefone)}</span></>}
          {row.erro_msg&&<><span style={{color:T.ink4}}>·</span><span style={{color:T.red,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:200}}>{row.erro_msg}</span></>}
        </div>
      </div>

      {/* Status + tempo */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',
        justifyContent:'center',gap:5,padding:'0 14px',flexShrink:0}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 9px',
          borderRadius:99,background:statusDim,border:`0.5px solid ${statusBor}`}}>
          <SIc size={9} style={{color:statusCor}}/>
          <span style={{fontSize:9.5,fontWeight:700,color:statusCor,
            textTransform:'uppercase',letterSpacing:'.04em'}}>{statusLbl}</span>
        </div>
        <span style={{fontSize:10.5,color:T.ink4}}>{rel||fmtDH(row.criado_em)}</span>
      </div>

      {/* Ações hover */}
      <div className="log-actions" style={{display:'flex',alignItems:'center',
        padding:'0 10px 0 0',gap:4,opacity:0,transition:'opacity .1s',flexShrink:0}}>
        <button onClick={e=>{e.stopPropagation();onVerCliente?.(row)}} title="Perfil"
          style={{width:26,height:26,borderRadius:7,border:`1px solid ${T.sep2}`,
            background:T.bg3,cursor:'pointer',display:'flex',alignItems:'center',
            justifyContent:'center',color:T.ink3}}><Users size={11}/></button>
        <button onClick={e=>{e.stopPropagation();onVerDisparo?.(row)}} title="Detalhes"
          style={{width:26,height:26,borderRadius:7,border:`1px solid ${T.sep2}`,
            background:T.bg3,cursor:'pointer',display:'flex',alignItems:'center',
            justifyContent:'center',color:T.ink3}}><Eye size={11}/></button>
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
  const [insDispBE,    setInsDispBE]    = useState([])

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
  const carregarStats = useCallback(async(sil=false)=>{
    if(!sil) setLoadSt(true)
    try {
      const r = await fetch(`${api}/api/dashboard/disparos-stats?periodo=${periodo}`)
      if (r.ok) { const d=await r.json(); setStats(d); setLastUpd(new Date()) }
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

        {/* ── KPIs ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10}}>
          <KCard icon={Send}      label="Total disparos"     value={total}     cor="#7c6af7" sub={`últimos ${stats?.dias||7} dias`} spark={spark7.total}/>
          <KCard icon={CheckCircle}label="Enviados"           value={enviados}  cor="#22c55e" sub={taxa===null?'sem envios ainda':`taxa ${taxa}%`} trend={taxa===null?undefined:taxa>=90?5:taxa>=70?0:-5} spark={spark7.enviados}/>
          <KCard icon={XCircle}   label="Erros"              value={erros}     cor="#ef4444" trend={erros>0?-1:0} spark={spark7.erros}/>
          <KCard icon={Users}     label="Clientes alcançados" value={parseInt(t.clientes_unicos)||0} cor="#4a9fff" spark={spark7.clientes}/>
          <KCard icon={Activity}  label="Últimas 24h"        value={parseInt(t.ultimas_24h)||0} cor="#a78bfa"/>
          <KCard icon={Clock}     label="Aguardando"          value={aguardando} cor="#f59e0b"/>
        </div>

        {/* ── Taxa global ── */}
        <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 20px',boxShadow:'0 6px 32px rgba(0,0,0,.2), 0 1px 0 rgba(255,255,255,.05) inset',animation:'chartIn .4s ease'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontSize:13,fontWeight:600,color:'var(--label)',display:'flex',alignItems:'center',gap:7}}>
              <ShieldCheck size={14} style={{color:'#22c55e'}}/>Taxa de entrega
              <span style={{fontSize:10,color:'var(--label-4)',fontWeight:400}}>(dos que foram enviados)</span>
            </span>
            <span style={{fontSize:24,fontWeight:800,color:taxa===null?'var(--label-4)':taxa>=90?'#22c55e':taxa>=70?'#f59e0b':'#ef4444'}}>
              {taxa===null?'—':`${taxa}%`}
            </span>
          </div>
          <div style={{height:12,borderRadius:99,overflow:'hidden',background:'var(--fill)',marginBottom:10}}>
            <div style={{height:'100%',borderRadius:99,transition:'width 1s',
              width:`${taxa===null?0:taxa}%`,background:taxa>=90?'#22c55e':taxa>=70?'#f59e0b':'#ef4444'}}/>
          </div>
          {taxa===null && (
            <div style={{fontSize:11,color:'var(--label-4)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
              <Info size={12}/>Ainda não há envios efetivos — a maioria está como "ignorado" (gatilhos desativados). Quando ativar os templates, a taxa passa a contar.
            </div>
          )}
          <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
            {[
              {l:'Enviados',  v:enviados,  c:'#22c55e'},
              {l:'Erros',     v:erros,     c:'#ef4444'},
              {l:'Ignorados', v:ignorados, c:'#6b7280'},
              {l:'Aguardando',v:aguardando,c:'#f59e0b'},
            ].map(s=>(
              <div key={s.l} style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:s.c}}/>
                <span style={{fontSize:11,color:'var(--label-3)'}}>
                  {s.l}: <strong style={{color:'var(--label)'}}>{s.v}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Funil da jornada + Insights ── */}
        <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:14}}>
          {/* Funil */}
          <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 20px',boxShadow:'0 6px 32px rgba(0,0,0,.2), 0 1px 0 rgba(255,255,255,.05) inset',animation:'chartIn .4s ease'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--label)',display:'flex',alignItems:'center',gap:7,marginBottom:14}}>
              <Filter size={14} style={{color:'#7c6af7'}}/>Funil da jornada
              <span style={{fontSize:10,color:'var(--label-4)',fontWeight:400,marginLeft:'auto'}}>onde estão seus clientes</span>
            </div>
            {funil.length===0
              ? <p style={{fontSize:12,color:'var(--label-4)',textAlign:'center',padding:20,margin:0}}>Sem dados de jornada no período</p>
              : <div style={{display:'flex',flexDirection:'column',gap:0}}>
                  {funil.map((e,i)=>{
                    const pct = Math.round(e.total/funilMax*100)
                    const EIc = GATILHO_META[e.gat]?.icon || Zap
                    return (
                      <div key={e.gat} onClick={()=>{ setFiltroGat(e.gat); setLogPg(1) }}
                        title="Filtrar log por esta etapa" style={{display:'flex',alignItems:'center',gap:8,
                        padding:'6px 4px',borderRadius:7,cursor:'pointer',
                        borderBottom:i<funil.length-1?'1px solid var(--sep)':'none'}}
                        onMouseEnter={ev=>ev.currentTarget.style.background='var(--fill)'}
                        onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
                        <div style={{width:20,height:20,borderRadius:5,background:`${e.cor}18`,
                          display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <EIc size={10} style={{color:e.cor}}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                            <span style={{fontSize:11,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{e.label}</span>
                            <div style={{display:'flex',gap:6,flexShrink:0,alignItems:'center'}}>
                              <span style={{fontSize:11,fontWeight:700,color:'var(--label)'}}>{e.total}</span>
                            </div>
                          </div>
                          <div style={{height:5,borderRadius:99,background:'var(--fill)',overflow:'hidden'}}>
                            <div style={{height:'100%',borderRadius:99,background:e.cor,width:`${pct}%`,transition:'width .7s'}}/>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </div>
          {/* ── Insights inteligentes multi-nível ── */}
          <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,
            padding:'16px 20px',boxShadow:'0 6px 32px rgba(0,0,0,.2), 0 1px 0 rgba(255,255,255,.05) inset',
            animation:'chartIn .4s ease',display:'flex',flexDirection:'column',gap:10}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--label)',display:'flex',alignItems:'center',gap:7}}>
              <Activity size={14} style={{color:T.amber}}/>Insights
              {loadIns&&<RefreshCw size={11} style={{color:'var(--label-4)',animation:'spin 1s linear infinite'}}/>}
              {!loadIns&&insightsBE.filter(i=>!insDispBE.includes(i.id)).length>0&&(
                <span style={{fontSize:10,padding:'1px 7px',borderRadius:99,
                  background:T.redDim,color:T.red,border:`1px solid ${T.redBor}`,fontWeight:700}}>
                  {insightsBE.filter(i=>!insDispBE.includes(i.id)).length}
                </span>
              )}
            </div>
            {loadIns&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
              <Skeleton h={76} r={10}/><Skeleton h={76} r={10}/>
            </div>}
            {!loadIns&&insightsBE.filter(i=>!insDispBE.includes(i.id)).length===0&&(
              <p style={{fontSize:12,color:'var(--label-4)',textAlign:'center',padding:'16px 0',margin:0}}>
                {insightsBE.length>0?'✓ Todos os alertas foram revisados':'✓ Tudo tranquilo por aqui.'}
              </p>
            )}
            {!loadIns&&insightsBE
              .filter(i=>!insDispBE.includes(i.id))
              .map(ins=>(
                <InsightCard key={ins.id} ins={ins}
                  onDismiss={()=>setInsDispBE(d=>[...d,ins.id])}/>
              ))
            }
          </div>
        </div>

        {/* ── Horários de pico ── */}
        <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 20px',boxShadow:'0 6px 32px rgba(0,0,0,.2), 0 1px 0 rgba(255,255,255,.05) inset',animation:'chartIn .4s ease'}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--label)',display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
            <Clock size={14} style={{color:'#06b6d4'}}/>Horários de pico
            {stats?.picoHora!=null&&<span style={{fontSize:10,color:'var(--label-4)',fontWeight:400,marginLeft:'auto'}}>
              pico às {stats.picoHora}h
            </span>}
          </div>
          <div style={{height:120,marginTop:8}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.porHora||[]} margin={{top:4,right:4,left:-28,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sep)" vertical={false}/>
                <XAxis dataKey="hora" tick={{fontSize:9,fill:'var(--label-4)'}} interval={2}
                  tickFormatter={h=>`${h}h`} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:9,fill:'var(--label-4)'}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip {...TT} labelFormatter={h=>`${h}:00 - ${h}:59`} formatter={v=>[v,'disparos']}/>
                <Bar dataKey="total" radius={[3,3,0,0]}>
                  {(stats?.porHora||[]).map((h,i)=>(
                    <Cell key={i} fill={h.hora===stats?.picoHora?'#06b6d4':'#06b6d455'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Charts ── */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>

          {/* Evolução diária */}
          <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 20px',boxShadow:'0 6px 32px rgba(0,0,0,.2), 0 1px 0 rgba(255,255,255,.05) inset',animation:'chartIn .4s ease'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--label)',marginBottom:14,
              display:'flex',alignItems:'center',gap:7}}>
              <BarChart3 size={13} style={{color:'#7c6af7'}}/>Evolução diária
            </div>
            {porDiaChart.length===0
              ? <p style={{fontSize:12,color:'var(--label-4)',textAlign:'center',padding:24,margin:0}}>Sem dados no período</p>
              : <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={porDiaChart} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--sep)" vertical={false}/>
                    <XAxis dataKey="d" tick={{fontSize:9,fill:'var(--label-4)'}} tickLine={false} axisLine={false}/>
                    <YAxis tick={{fontSize:9,fill:'var(--label-4)'}} tickLine={false} axisLine={false}/>
                    <Tooltip {...TT} formatter={(v,n)=>[v,n==='enviados'?'Enviados':'Erros']}/>
                    <Bar dataKey="enviados" fill="#22c55e" radius={[3,3,0,0]} maxBarSize={20}/>
                    <Bar dataKey="erros"    fill="#ef4444" radius={[3,3,0,0]} maxBarSize={20}/>
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>

          {/* Por gatilho */}
          <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 20px',boxShadow:'0 6px 32px rgba(0,0,0,.2), 0 1px 0 rgba(255,255,255,.05) inset',animation:'chartIn .4s ease'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--label)',marginBottom:10,
              display:'flex',alignItems:'center',gap:7}}>
              <Zap size={13} style={{color:'#f59e0b'}}/>Por gatilho
            </div>
            {porGatChart.length===0
              ? <p style={{fontSize:12,color:'var(--label-4)',textAlign:'center',padding:24,margin:0}}>Nenhum disparo no período</p>
              : <div style={{display:'flex',flexDirection:'column',gap:0}}>
                  {porGatChart.slice(0,8).map((g,i)=>{
                    const maxG = Math.max(...porGatChart.map(x=>x.total),1)
                    const pct  = Math.round(g.total/maxG*100)
                    const tentadosG = g.enviados + g.erros
                    const taxaG = tentadosG>0 ? Math.round(g.enviados/tentadosG*100) : null
                    const gatKey = Object.keys(GATILHO_META).find(k=>GATILHO_META[k].label===g.name) || g.name
                    return (
                      <div key={i} onClick={()=>{ setFiltroGat(gatKey); setLogPg(1) }}
                        title="Filtrar o log por este gatilho" style={{display:'flex',alignItems:'center',gap:8,
                        padding:'6px 4px',borderRadius:7,cursor:'pointer',
                        borderBottom:i<porGatChart.length-1?'1px solid var(--sep)':'none'}}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--fill)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <div style={{width:20,height:20,borderRadius:5,background:`${g.cor}18`,
                          display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          {GATILHO_META[Object.keys(GATILHO_META).find(k=>GATILHO_META[k].label===g.name)]?.icon
                            ? (() => { const IC=GATILHO_META[Object.keys(GATILHO_META).find(k=>GATILHO_META[k].label===g.name)]?.icon||Zap; return <IC size={10} style={{color:g.cor}}/>; })()
                            : <Zap size={10} style={{color:g.cor}}/>
                          }
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                            <span style={{fontSize:11,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{g.name}</span>
                            <div style={{display:'flex',gap:6,flexShrink:0,alignItems:'center'}}>
                              <span style={{fontSize:11,fontWeight:700,color:'var(--label)'}}>{g.total}</span>
                              {taxaG===null
                                ? <span style={{fontSize:9,padding:'1px 5px',borderRadius:99,
                                    color:'var(--label-4)',background:'var(--fill)'}} title="Registrado, mas ainda não enviado (template off)">só log</span>
                                : <span style={{fontSize:9,padding:'1px 5px',borderRadius:99,
                                    color:taxaG>=90?'#22c55e':taxaG>=70?'#f59e0b':'#ef4444',
                                    background:taxaG>=90?'rgba(34,197,94,.1)':taxaG>=70?'rgba(245,158,11,.1)':'rgba(239,68,68,.1)'}}>
                                    {taxaG}%
                                  </span>
                              }
                            </div>
                          </div>
                          <div style={{height:5,borderRadius:99,background:'var(--fill)',overflow:'hidden'}}>
                            <div style={{height:'100%',borderRadius:99,background:g.cor,width:`${pct}%`,transition:'width .5s'}}/>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </div>
        </div>

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

          {/* ── LIVE FEED — disparos em tempo real ── */}
          <LiveFeed
            items={liveFeedItems}
            novos={novosCount}
            onVerNovos={()=>{ setNovos(0); carregarLog(1) }}
            onItemClick={r=>setDrawer({tipo:'disparo',dados:r})}
          />

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
            if (g==='__cliente__') { setDrawer({tipo:'cliente',dados:{telefone:tel}}) }
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
