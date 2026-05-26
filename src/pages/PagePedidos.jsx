import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, RefreshCw, X, Package, ExternalLink, Truck, MoreHorizontal,
  MapPin, Star, ChevronDown, ChevronUp, Calendar, SlidersHorizontal,
  MessageSquare, CheckCircle, XCircle, Clock, Copy, Check, Hash,
  ArrowUpDown, Phone, Mail, Tag, TrendingUp, TrendingDown, Minus,
  DollarSign, ShoppingCart, Users, Activity, BarChart3, Banknote,
  Package2, Wallet, Layers, Zap, FileText, ChevronRight,
  AlertTriangle, Send, Eye, Home, CreditCard, Building2,
  Navigation, Bell, Sparkles, Filter, LayoutGrid, List,
  ArrowRight, Info, Globe, Receipt
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts'

// ─────────────────────────────────────────────────────────────────────────────
// MAPEAMENTO DEFINITIVO — debug 25/05/2026 confirmado
// ─────────────────────────────────────────────────────────────────────────────
const LOJA_ID = {
  205946980: 'shopee',       // Shopee Xpress (DDMMYY prefix)
  203414926: 'mercadolivre', // Melhor Envio
  204884434: 'shein',        // Shein / GSH prefix — Logistica Shein confirmado
  205916963: 'tiktokshop',   // TikTok LSV-Standard
  205693668: 'nuvemshop',    // Nuvemshop SEDEX
  0:         'loja',         // Loja própria / manual
}

// Detecta transportadora pelo código de rastreio
const detectTransp = cod => {
  if (!cod) return null
  if (/^[A-Z]{2}\d{9}BR$/.test(cod)) return 'correios'
  if (cod.startsWith('MEL'))          return 'melhorenvio'
  if (/^BR\d+Y$/.test(cod))          return 'shopee'
  if (cod.startsWith('999'))          return 'tiktok'
  return 'outro'
}

const linkRastreio = cod => {
  if (!cod) return null
  const t = detectTransp(cod)
  if (t === 'correios')    return `https://rastreamento.correios.com.br/app/index.php?objetos=${cod}`
  if (t === 'melhorenvio') return `https://melhorenvio.com.br/rastreamento/${cod}`
  return `https://melhorrastreio.com.br/rastreio/${cod}`
}

// ─────────────────────────────────────────────────────────────────────────────
// CANAIS — SVG com identidade visual real
// ─────────────────────────────────────────────────────────────────────────────
const CH = {
  shopee: {
    label:'Shopee', cor:'#EE4D2D', corBg:'#FFF0EE',
    icon:({s=14})=><svg width={s} height={s} viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#EE4D2D"/><path d="M16 6c-2.76 0-5 2.24-5 5h10c0-2.76-2.24-5-5-5z" fill="rgba(255,255,255,.5)"/><rect x="6" y="12" width="20" height="14" rx="3" fill="rgba(255,255,255,.15)"/><text x="16" y="23.5" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="white" fontFamily="Arial">SHOPEE</text></svg>
  },
  mercadolivre: {
    label:'Mercado Livre', cor:'#F5A623', corBg:'#FFFBF0',
    icon:({s=14})=><svg width={s} height={s} viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#FFF159"/><ellipse cx="16" cy="13" rx="8" ry="5.5" fill="#F5A623"/><text x="16" y="26" textAnchor="middle" fontSize="5" fontWeight="900" fill="#1a1a1a" fontFamily="Arial">MERCADO LIVRE</text></svg>
  },
  nuvemshop: {
    label:'Nuvemshop', cor:'#1B96FF', corBg:'#EEF6FF',
    icon:({s=14})=><svg width={s} height={s} viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1B96FF"/><path d="M8 22a6 6 0 010-12 6.5 6.5 0 0111.5-1.5A5 5 0 0124 22H8z" fill="white" opacity=".95"/></svg>
  },
  tiktokshop: {
    label:'TikTok Shop', cor:'#010101', corBg:'#F0F0F0',
    icon:({s=14})=><svg width={s} height={s} viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#010101"/><path d="M19 7.5c1 1.3 2.7 2.1 4.3 2.1v3c-1.5 0-2.9-.5-4-1.3v6.2a5.5 5.5 0 11-5.5-5.5h.5v3.2h-.5a2.3 2.3 0 100 4.5 2.3 2.3 0 002.4-2.4V7.5H19z" fill="#69C9D0"/></svg>
  },
  shein: {
    label:'Shein', cor:'#c0392b', corBg:'#FEF0EF',
    icon:({s=14})=><svg width={s} height={s} viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#c0392b"/><text x="16" y="21" textAnchor="middle" fontSize="9" fontWeight="900" fill="white" fontFamily="Arial">SHEIN</text></svg>
  },
  loja: {
    label:'Loja Própria', cor:'#10b981', corBg:'#ECFDF5',
    icon:({s=14})=><svg width={s} height={s} viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#10b981"/><path d="M5 14l11-9 11 9v14a2 2 0 01-2 2H7a2 2 0 01-2-2V14z" fill="none" stroke="white" strokeWidth="2"/><path d="M12 28V19h8v9" stroke="white" strokeWidth="2"/></svg>
  },
  bling: {
    label:'Bling/Manual', cor:'#1D9E75', corBg:'#ECFDF5',
    icon:({s=14})=><svg width={s} height={s} viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1D9E75"/><text x="16" y="22" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="Arial">B</text></svg>
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────────────────────────────────────
const SIT = {
  6:  {label:'Em Aberto', cor:'#f59e0b', bg:'rgba(245,158,11,.12)', bdr:'rgba(245,158,11,.3)', ordem:0},
  9:  {label:'Atendido',  cor:'#4a9fff', bg:'rgba(74,159,255,.12)', bdr:'rgba(74,159,255,.3)', ordem:2},
  12: {label:'Cancelado', cor:'#ef4444', bg:'rgba(239,68,68,.12)',  bdr:'rgba(239,68,68,.3)',  ordem:-1},
  15: {label:'Verificado',cor:'#22c55e', bg:'rgba(34,197,94,.12)',  bdr:'rgba(34,197,94,.3)',  ordem:3},
}

// Etapas do gatilho (para automação futura)
const ETAPAS_GATILHO = [
  {id:'pedido_criado',       label:'Pedido Criado',         icone:'📦', cor:'#7c6af7'},
  {id:'pgto_pendente',       label:'Pagamento Pendente',    icone:'⏳', cor:'#f59e0b'},
  {id:'pgto_aprovado',       label:'Pagamento Aprovado',    icone:'✅', cor:'#22c55e'},
  {id:'em_separacao',        label:'Em Separação',          icone:'📋', cor:'#00d4aa'},
  {id:'embalado',            label:'Pedido Embalado',       icone:'📦', cor:'#4a9fff'},
  {id:'aguard_retirada',     label:'Aguardando Retirada',   icone:'🏪', cor:'#e879f9'},
  {id:'enviado',             label:'Pedido Enviado',        icone:'🚀', cor:'#0070f3'},
  {id:'em_movimentacao',     label:'Rastreio em Movimento', icone:'🔄', cor:'#EE4D2D'},
  {id:'saiu_entrega',        label:'Saiu Para Entrega',     icone:'🏠', cor:'#f97316'},
  {id:'lembrete_rastreio',   label:'Lembrete de Rastreio',  icone:'📍', cor:'#a78bfa'},
  {id:'nao_entregue',        label:'Pedido Não Entregue',   icone:'❌', cor:'#ef4444'},
  {id:'entregue',            label:'Entrega Realizada',     icone:'🎉', cor:'#22c55e'},
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const R   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const Rk  = n => n >= 1000 ? `R$ ${(n/1000).toFixed(1)}k` : R(n)
const fmt = n => Number(n||0).toLocaleString('pt-BR')
const fmtD  = d => { if(!d||d.startsWith('0000')) return '—'; const s=d.length===10?d+'T12:00:00':d; return new Date(s).toLocaleDateString('pt-BR') }
const fmtDT = d => d ? new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'
const fmtCEP = c => (c||'').replace(/\D/g,'').replace(/(\d{5})(\d{3})/,'$1-$2')

function getCanal(p) {
  const lid = p.lojaId ?? p.loja?.id ?? 0
  return LOJA_ID[lid] ?? (p.canal || 'bling')
}
function getSitId(p) {
  return typeof p.situacao==='object' ? p.situacao?.id??p.situacao?.valor : p.situacaoId??p.situacao
}

// ─────────────────────────────────────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────────────────────────────────────
function StatusPill({sitId}) {
  const s = SIT[sitId]||{label:String(sitId??'—'),cor:'#888',bg:'var(--fill)',bdr:'var(--sep)'}
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11.5,fontWeight:700,padding:'3px 10px',borderRadius:99,background:s.bg,color:s.cor,border:`1px solid ${s.bdr}`,whiteSpace:'nowrap'}}>
    <span style={{width:6,height:6,borderRadius:'50%',background:s.cor,display:'inline-block',flexShrink:0}}/>
    {s.label}
  </span>
}

function CanalBadge({canal,size=14,showLabel=true}) {
  const c = CH[canal]||CH.bling
  const I = c.icon
  return <span style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12,fontWeight:700,padding:'4px 10px',borderRadius:9,background:`${c.cor}15`,color:c.cor,border:`1px solid ${c.cor}28`,whiteSpace:'nowrap',lineHeight:1}}>
    <I s={size}/>{showLabel&&c.label}
  </span>
}

function TraspBadge({codigo}) {
  const t = detectTransp(codigo)
  const labels = {correios:'🇧🇷 Correios',melhorenvio:'📦 Melhor Envio',shopee:'🛍️ Shopee Express',tiktok:'🎵 TikTok Logistics',outro:'📦 Transportadora'}
  const cors   = {correios:'#f5a623',melhorenvio:'#00d4aa',shopee:'#EE4D2D',tiktok:'#69C9D0',outro:'#888'}
  if (!t||!codigo) return null
  return <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:6,background:`${cors[t]||'#888'}15`,color:cors[t]||'#888',border:`1px solid ${cors[t]||'#888'}28`}}>
    {labels[t]||'—'}
  </span>
}

function Avatar({nome,size=32}) {
  const init=(nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const pal=['#7c6af7','#00d4aa','#f59e0b','#22c55e','#4a9fff','#e879f9','#fb923c']
  const c=pal[(nome||'?').charCodeAt(0)%pal.length]
  return <div style={{width:size,height:size,borderRadius:'50%',background:`${c}20`,border:`1.5px solid ${c}50`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.35,fontWeight:800,color:c,flexShrink:0}}>{init}</div>
}

function CopyBtn({value,small}) {
  const [ok,setOk]=useState(false)
  const cp=()=>{navigator.clipboard.writeText(String(value??''));setOk(true);setTimeout(()=>setOk(false),1800)}
  return <button onClick={cp} style={{display:'inline-flex',alignItems:'center',gap:3,padding:small?'1px 5px':'2px 7px',borderRadius:5,border:'1px solid var(--sep)',background:'transparent',color:ok?'#22c55e':'var(--label-4)',cursor:'pointer',fontSize:small?9:10,flexShrink:0,whiteSpace:'nowrap'}}>
    {ok?<><Check size={small?8:9}/> Ok</>:<><Copy size={small?8:9}/> Copiar</>}
  </button>
}

// ─────────────────────────────────────────────────────────────────────────────
// DATEPICKER
// ─────────────────────────────────────────────────────────────────────────────
function DateRange({value,onChange}) {
  const [open,setOpen]=useState(false)
  const ref=useRef()
  useEffect(()=>{const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',fn);return()=>document.removeEventListener('mousedown',fn)},[])
  const preset=days=>{const to=new Date().toISOString().split('T')[0];const from=days===0?to:new Date(Date.now()-days*86400000).toISOString().split('T')[0];onChange({from,to});setOpen(false)}
  const lbl=value.from&&value.to?`${fmtD(value.from)} – ${fmtD(value.to)}`:value.from?`De ${fmtD(value.from)}`:'Período'
  const has=value.from||value.to
  return <div ref={ref} style={{position:'relative'}}>
    <button onClick={()=>setOpen(v=>!v)} style={{display:'flex',alignItems:'center',gap:7,padding:'8px 12px',borderRadius:9,border:`1px solid ${has?'var(--accent)':'var(--sep)'}`,background:has?'var(--accent-dim)':'var(--bg-2)',color:has?'var(--accent)':'var(--label-3)',fontSize:12.5,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap'}}>
      <Calendar size={13}/>{lbl}
      {has&&<button onClick={e=>{e.stopPropagation();onChange({from:'',to:''})}} style={{border:'none',background:'transparent',color:'inherit',cursor:'pointer',display:'flex',padding:0,marginLeft:2}}><X size={11}/></button>}
    </button>
    {open&&<div style={{position:'absolute',top:'calc(100% + 6px)',left:0,zIndex:300,background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:18,boxShadow:'0 16px 48px rgba(0,0,0,.35)',minWidth:320}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:14}}>
        {[['Hoje',0],['7d',7],['30d',30],['90d',90]].map(([lb,d])=><button key={lb} onClick={()=>preset(d)} style={{padding:'6px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-3)',fontSize:12,cursor:'pointer',fontWeight:500}}>{lb}</button>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {[['De','from'],['Até','to']].map(([lb,k])=><div key={k}>
          <label style={{display:'block',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--label-4)',marginBottom:5}}>{lb}</label>
          <input type="date" value={value[k]||''} onChange={e=>onChange({...value,[k]:e.target.value})} style={{width:'100%',padding:'7px 9px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--bg)',color:'var(--label)',fontSize:12.5,outline:'none',boxSizing:'border-box'}}/>
        </div>)}
      </div>
    </div>}
  </div>
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS STEPS (corrigido)
// ─────────────────────────────────────────────────────────────────────────────
function ProgressSteps({sitId,dataPedido,dataSaida}) {
  const STEPS = [
    {k:'criado',    lb:'Recebido',  sub:fmtD(dataPedido),                          done:true,                                cor:'#7c6af7'},
    {k:'confirmado',lb:'Confirmado',sub:'Pagamento aprovado',                       done:[9,15].includes(sitId),             cor:'#22c55e'},
    {k:'enviado',   lb:'Enviado',   sub:dataSaida&&!dataSaida.startsWith('0000')?`Saiu ${fmtD(dataSaida)}`:'Aguardando postagem', done:[9,15].includes(sitId)&&!!dataSaida&&!dataSaida.startsWith('0000'), cor:'#4a9fff'},
    {k:'entregue',  lb:'Entregue',  sub:'Confirmado',                               done:sitId===15,                         cor:'#22c55e'},
  ]
  if(sitId===12) return <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderRadius:12,background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.2)'}}>
    <XCircle size={16} style={{color:'#ef4444',flexShrink:0}}/><div><p style={{fontSize:13,fontWeight:700,color:'#ef4444',margin:0}}>Pedido cancelado</p></div>
  </div>
  return <div style={{display:'flex',alignItems:'flex-start'}}>
    {STEPS.map((s,i)=>(
      <div key={s.k} style={{display:'flex',alignItems:'flex-start',flex:i<STEPS.length-1?1:'none'}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:s.done?s.cor:'var(--bg)',border:`2px solid ${s.done?s.cor:'var(--sep)'}`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:s.done&&i===STEPS.filter(x=>x.done).length-1?`0 0 0 5px ${s.cor}20, 0 0 0 9px ${s.cor}08`:'none',transition:'all .4s'}}>
            {s.done?<Check size={14} style={{color:'#fff',strokeWidth:3}}/>:<span style={{width:8,height:8,borderRadius:'50%',background:'var(--sep)',display:'block'}}/>}
          </div>
          <div style={{textAlign:'center',marginTop:6,width:76}}>
            <p style={{fontSize:11,fontWeight:s.done?700:400,color:s.done?s.cor:'var(--label-4)',margin:'0 0 2px',lineHeight:1.2}}>{s.lb}</p>
            <p style={{fontSize:9.5,color:'var(--label-4)',margin:0,lineHeight:1.3}}>{s.sub}</p>
          </div>
        </div>
        {i<STEPS.length-1&&<div style={{flex:1,height:2,marginTop:15,marginInline:4,background:STEPS[i+1]?.done?`linear-gradient(90deg,${s.cor},${STEPS[i+1].cor})`:'var(--sep)',borderRadius:99,transition:'background .4s'}}/>}
      </div>
    ))}
  </div>
}

// ─────────────────────────────────────────────────────────────────────────────
// RASTREIO TIMELINE
// ─────────────────────────────────────────────────────────────────────────────
function TrackTimeline({codigo,api,linkExterno}) {
  const [evs,setEvs]=useState([])
  const [status,setStatus]=useState(null)
  const [loading,setLoad]=useState(false)
  const [err,setErr]=useState(null)
  const [cp,setCp]=useState(false)

  const buscar=useCallback(async()=>{
    if(!codigo) return
    setLoad(true);setErr(null)
    try{
      const r=await fetch(`${api}/api/dashboard/rastreio/${codigo}`)
      if(r.ok){const d=await r.json();const r0=d.resultados?.[0];if(r0){setEvs(r0.eventos||[]);setStatus(r0.status||null)}}
      else setErr('Erro ao consultar rastreio')
    }catch(e){setErr(e.message)}
    setLoad(false)
  },[codigo,api])

  useEffect(()=>{if(codigo)buscar()},[buscar])

  const copy=()=>{navigator.clipboard.writeText(codigo);setCp(true);setTimeout(()=>setCp(false),2000)}

  if(!codigo) return <div style={{padding:'32px',textAlign:'center',borderRadius:12,border:'1px dashed var(--sep)',color:'var(--label-4)'}}>
    <Truck size={28} style={{display:'block',margin:'0 auto 10px',opacity:.2}}/>
    <p style={{fontSize:13,margin:'0 0 4px'}}>Sem código de rastreio</p>
    <p style={{fontSize:11,margin:0,opacity:.6}}>O código aparece após a postagem do objeto</p>
  </div>

  const link = linkExterno || linkRastreio(codigo)
  const transp = detectTransp(codigo)

  return <div>
    {/* Header código */}
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:11,background:'var(--bg)',border:'1px solid var(--sep)',marginBottom:10}}>
      <Truck size={14} style={{color:'var(--accent)',flexShrink:0}}/>
      <span style={{fontSize:13.5,fontFamily:'monospace',fontWeight:700,color:'var(--accent)',flex:1,letterSpacing:'.04em'}}>{codigo}</span>
      <TraspBadge codigo={codigo}/>
      <button onClick={copy} style={{display:'flex',alignItems:'center',gap:3,padding:'3px 8px',borderRadius:6,border:'1px solid var(--sep)',background:'transparent',color:cp?'#22c55e':'var(--label-4)',cursor:'pointer',fontSize:10}}>
        {cp?<><Check size={9}/>Copiado</>:<><Copy size={9}/>Copiar</>}
      </button>
      {link&&<a href={link} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:4,padding:'3px 9px',borderRadius:6,border:'1px solid rgba(74,159,255,.3)',background:'rgba(74,159,255,.08)',color:'#4a9fff',textDecoration:'none',fontSize:11,fontWeight:600}}>
        <ExternalLink size={10}/> Rastrear
      </a>}
      <button onClick={buscar} disabled={loading} style={{display:'flex',alignItems:'center',padding:'3px 8px',borderRadius:6,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-4)',cursor:'pointer'}}>
        <RefreshCw size={10} style={{animation:loading?'spin .8s linear infinite':undefined}}/>
      </button>
    </div>

    {/* Status atual */}
    {status&&<div style={{padding:'10px 14px',borderRadius:10,background:'rgba(0,212,170,.07)',border:'1px solid rgba(0,212,170,.2)',marginBottom:12}}>
      <p style={{fontSize:13,fontWeight:700,color:'#00d4aa',margin:0}}>{status}</p>
    </div>}

    {err&&<div style={{padding:'8px 12px',borderRadius:9,background:'rgba(239,68,68,.07)',border:'1px solid rgba(239,68,68,.2)',marginBottom:10,fontSize:12,color:'#ef4444'}}>{err}</div>}

    {/* Timeline */}
    {evs.length>0?(
      <div style={{position:'relative',paddingLeft:22}}>
        <div style={{position:'absolute',left:9,top:8,bottom:8,width:2,background:'var(--sep)',borderRadius:99}}/>
        {evs.map((ev,i)=><div key={i} style={{position:'relative',paddingLeft:20,paddingBottom:14}}>
          <div style={{position:'absolute',left:-4,top:5,width:14,height:14,borderRadius:'50%',background:i===0?'var(--accent)':'var(--fill)',border:`2px solid ${i===0?'var(--accent)':'var(--sep)'}`,zIndex:1}}/>
          <div style={{background:'var(--bg)',borderRadius:10,padding:'9px 12px',border:`1px solid ${i===0?'var(--accent)30':'var(--sep)'}`}}>
            <p style={{fontSize:12.5,fontWeight:i===0?700:500,color:i===0?'var(--label)':'var(--label-3)',margin:'0 0 3px'}}>{ev.status}</p>
            {ev.detalhe&&<p style={{fontSize:11,color:'var(--label-4)',margin:'0 0 2px'}}>{ev.detalhe}</p>}
            {ev.local&&<p style={{fontSize:11,color:'var(--label-4)',margin:'0 0 2px',display:'flex',alignItems:'center',gap:4}}><MapPin size={9}/>{ev.local}</p>}
            <p style={{fontSize:10.5,color:'var(--label-4)',margin:0,fontFamily:'monospace'}}>{ev.data?fmtDT(ev.data):ev.data}</p>
          </div>
        </div>)}
      </div>
    ):!loading&&<div style={{padding:'20px',textAlign:'center',color:'var(--label-4)',fontSize:12,borderRadius:10,border:'1px dashed var(--sep)'}}>
      <Clock size={18} style={{display:'block',margin:'0 auto 8px',opacity:.3}}/>
      Sem eventos de rastreio ainda
    </div>}
  </div>
}

// ─────────────────────────────────────────────────────────────────────────────
// SHEET LATERAL — 5 abas
// ─────────────────────────────────────────────────────────────────────────────
// ── Helpers de estilo compartilhados ─────────────────────────────────────────
const pill = (bg, color, border) => ({
  display:'inline-flex', alignItems:'center', gap:5,
  fontSize:11, fontWeight:500, padding:'2px 9px',
  borderRadius:99, background:bg, color, border:`0.5px solid ${border}`,
  whiteSpace:'nowrap',
})

const iconBtn = (extra={}) => ({
  display:'flex', alignItems:'center', justifyContent:'center',
  width:34, height:34, borderRadius:8,
  border:'0.5px solid var(--sep)', background:'var(--fill)',
  color:'var(--label-3)', cursor:'pointer', flexShrink:0, ...extra,
})

const qlink = (extra={}) => ({
  display:'inline-flex', alignItems:'center', gap:4,
  fontSize:11, color:'var(--label-3)', padding:'3px 8px',
  borderRadius:6, border:'0.5px solid var(--sep)',
  background:'var(--fill)', textDecoration:'none',
  fontWeight:400, whiteSpace:'nowrap', ...extra,
})

// ── Canal SVGs corretos com identidade visual real ────────────────────────────
// (Apenas o ícone pequeno para o badge — 16px max)
const CANAL_ICON = {
  shopee: () => (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <rect width="14" height="14" rx="3" fill="#EE4D2D"/>
      <path d="M7 2.5A2 2 0 015 4.5h4A2 2 0 007 2.5z" fill="rgba(255,255,255,.6)"/>
      <rect x="2.5" y="5" width="9" height="6" rx="1.5" fill="rgba(255,255,255,.18)"/>
      <text x="7" y="10" textAnchor="middle" fontSize="3.5" fontWeight="800" fill="white" fontFamily="sans-serif">SHOPEE</text>
    </svg>
  ),
  mercadolivre: () => (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <rect width="14" height="14" rx="3" fill="#FFF159"/>
      <ellipse cx="7" cy="5.5" rx="3.5" ry="2.2" fill="#F5A623"/>
      <text x="7" y="12" textAnchor="middle" fontSize="3" fontWeight="800" fill="#5c3d00" fontFamily="sans-serif">MERCADO</text>
    </svg>
  ),
  nuvemshop: () => (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <rect width="14" height="14" rx="3" fill="#1B96FF"/>
      <path d="M3.5 10a2.5 2.5 0 010-5A2.8 2.8 0 018.8 4 2.2 2.2 0 0110.5 10H3.5z" fill="white"/>
    </svg>
  ),
  shein: () => (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <rect width="14" height="14" rx="3" fill="#c0392b"/>
      <text x="7" y="9.5" textAnchor="middle" fontSize="4.5" fontWeight="800" fill="white" fontFamily="sans-serif">SHEIN</text>
    </svg>
  ),
  tiktokshop: () => (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <rect width="14" height="14" rx="3" fill="#010101"/>
      <path d="M8.5 3.5c.4.55 1.1.9 1.8.9v1.2c-.6 0-1.2-.2-1.7-.55v2.6a2.3 2.3 0 11-2.3-2.3h.2v1.35h-.2a.95.95 0 100 1.9.95.95 0 001-1V3.5h1z" fill="#69C9D0"/>
    </svg>
  ),
  loja: () => (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <rect width="14" height="14" rx="3" fill="#10b981"/>
      <path d="M2.5 6.5L7 2.5l4.5 4V12a.5.5 0 01-.5.5H3a.5.5 0 01-.5-.5V6.5z" fill="none" stroke="white" strokeWidth="1.1"/>
      <path d="M5.5 12.5V9h3v3.5" stroke="white" strokeWidth="1.1"/>
    </svg>
  ),
  bling: () => (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <rect width="14" height="14" rx="3" fill="#1D9E75"/>
      <text x="7" y="10" textAnchor="middle" fontSize="7" fontWeight="800" fill="white" fontFamily="sans-serif">B</text>
    </svg>
  ),
}

const CANAL_STYLE = {
  shopee:       { label:'Shopee',       bg:'#FFF0EE', color:'#8B1A0A', border:'#F5A99A' },
  mercadolivre: { label:'Mercado Livre',bg:'#FFFBEC', color:'#7A4500', border:'#EFD28A' },
  nuvemshop:    { label:'Nuvemshop',    bg:'#EEF6FF', color:'#0C4D8A', border:'#85B7EB' },
  shein:        { label:'Shein',        bg:'#FDEEEE', color:'#7A1A1A', border:'#F09595' },
  tiktokshop:   { label:'TikTok Shop',  bg:'#F0F0F0', color:'#1a1a1a', border:'#C0C0C0' },
  loja:         { label:'Loja Própria', bg:'#ECFDF5', color:'#065F46', border:'#5DCAA5' },
  bling:        { label:'Manual',       bg:'#ECFDF5', color:'#065F46', border:'#5DCAA5' },
}

function CanalBadgeSmall({ canal }) {
  const s = CANAL_STYLE[canal] || CANAL_STYLE.bling
  const Icon = CANAL_ICON[canal] || CANAL_ICON.bling
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:500,padding:'2px 8px',borderRadius:6,background:s.bg,color:s.color,border:`0.5px solid ${s.border}`,whiteSpace:'nowrap'}}>
      <Icon/>{s.label}
    </span>
  )
}

// ── GatilhosPanel colapsável ──────────────────────────────────────────────────
function GatilhosPanel() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{border:'0.5px solid var(--sep)',borderRadius:8,overflow:'hidden',marginBottom:14}}>
      <button onClick={() => setOpen(v=>!v)} style={{width:'100%',display:'flex',alignItems:'center',gap:7,padding:'8px 12px',background:'var(--fill)',border:'none',cursor:'pointer',textAlign:'left'}}>
        <Zap size={12} style={{color:'var(--label-4)',flexShrink:0}}/>
        <span style={{fontSize:11,color:'var(--label-4)',flex:1,letterSpacing:'.02em'}}>Gatilhos de automação</span>
        <span style={{fontSize:10,color:'var(--label-4)',background:'var(--bg)',border:'0.5px solid var(--sep)',padding:'0 6px',borderRadius:99}}>{ETAPAS_GATILHO.length}</span>
        {open ? <ChevronUp size={11} style={{color:'var(--label-4)'}}/> : <ChevronDown size={11} style={{color:'var(--label-4)'}}/>}
      </button>
      {open && (
        <div style={{padding:'8px 12px',display:'flex',flexWrap:'wrap',gap:5,borderTop:'0.5px solid var(--sep)'}}>
          {ETAPAS_GATILHO.map(e => (
            <span key={e.id} style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:'var(--fill)',color:'var(--label-3)',border:'0.5px solid var(--sep)'}}>
              {e.icone} {e.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── NotaPanel — nota interna com histórico ────────────────────────────────────
function NotaPanel({ pedidoNumero }) {
  const [texto, setTexto] = useState('')
  const [notas, setNotas] = useState([])
  const [saving, setSaving] = useState(false)

  const salvar = () => {
    if (!texto.trim()) return
    setSaving(true)
    const nova = { texto: texto.trim(), criado_em: new Date().toISOString(), autor: 'Você' }
    setNotas(prev => [nova, ...prev])
    setTexto('')
    setSaving(false)
  }

  return (
    <div>
      {notas.map((n,i) => (
        <div key={i} style={{display:'flex',gap:8,padding:'8px 0',borderBottom:'0.5px solid var(--sep)'}}>
          <div style={{width:2,borderRadius:99,background:'var(--accent)',flexShrink:0,alignSelf:'stretch'}}/>
          <div style={{flex:1}}>
            <p style={{fontSize:12.5,color:'var(--label-2)',lineHeight:1.5,margin:'0 0 3px'}}>{n.texto}</p>
            <p style={{fontSize:10.5,color:'var(--label-4)',margin:0,fontFamily:'monospace'}}>{n.autor} · {new Date(n.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</p>
          </div>
        </div>
      ))}
      <textarea
        value={texto}
        onChange={e => setTexto(e.target.value)}
        onKeyDown={e => { if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)) salvar() }}
        placeholder="Nota interna… (Cmd+Enter para salvar)"
        rows={2}
        style={{width:'100%',resize:'none',marginTop:10,border:'0.5px solid var(--sep)',borderRadius:8,padding:'8px 10px',fontSize:12.5,background:'var(--fill)',color:'var(--label)',fontFamily:'var(--font-sans)',outline:'none',lineHeight:1.5,boxSizing:'border-box'}}
      />
      {texto.trim() && (
        <button onClick={salvar} disabled={saving} style={{marginTop:6,padding:'5px 14px',borderRadius:7,border:'0.5px solid var(--sep)',background:'var(--bg-2)',color:'var(--label-3)',cursor:'pointer',fontSize:12,fontWeight:500,display:'flex',alignItems:'center',gap:5}}>
          <Check size={12}/> Salvar nota
        </button>
      )}
    </div>
  )
}

// ── OrderSheet ENTERPRISE ─────────────────────────────────────────────────────
function OrderSheet({pedRow, onClose, api, allPedidos}) {
  const [det,      setDet]   = useState(null)
  const [load,     setLoad]  = useState(true)
  const [tab,      setTab]   = useState('pedido')
  const [sending,  setSend]  = useState(false)
  const [sent,     setSent]  = useState(false)
  const [cp,       setCp]    = useState('')
  const [trackEvs, setTEvs]  = useState([])
  const [trackSt,  setTSt]   = useState(null)
  const [tLoad,    setTLoad] = useState(false)
  const [pfp,      setPfp]   = useState(null) // foto de perfil WA

  const canal = getCanal(pedRow)
  const sitId = getSitId(pedRow)
  const sit   = SIT[sitId] || {label:'—',cor:'#888',bg:'var(--fill)',bdr:'var(--sep)'}
  const histLocal = allPedidos.filter(p => p.contato===pedRow.contato && p.numero!==pedRow.numero)
  const nComp = histLocal.filter(p => p.numero<pedRow.numero).length+1
  const isNew = nComp===1
  const ltv   = histLocal.reduce((s,p)=>s+Number(p.total||0),0)+Number(pedRow.total||0)

  const p  = det?.pedido     || {}
  const c  = det?.contato    || {}
  const t  = det?.transporte || {}
  const r  = det?.rastreio   || {}
  const hD = det?.historico  || {}
  const ms = det?.mensagens  || {}
  const end = t.etiqueta || c.enderecoGeral || c.enderecos?.[0] || null
  const cod = r.codigo || null
  const nf  = p.notaFiscal
  const total = Number(pedRow.total||0)
  const parcelas = det?.pedido?.parcelas || []
  const forma = parcelas[0]?.formaPagamento?.descricao || p.formaPagamento || null
  const isPix = parcelas[0]?.formaPagamento?.id === 1896170
  const isCard = parcelas[0]?.formaPagamento?.id === 3938183
  const nParcelas = parcelas.length > 0 ? parcelas.length : null

  useEffect(() => {
    if (!pedRow?.numero) return
    setLoad(true); setDet(null); setTab('pedido'); setTEvs([]); setTSt(null); setPfp(null)
    fetch(`${api}/api/dashboard/pedido-completo/${pedRow.numero}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setDet(d); setLoad(false) })
      .catch(() => setLoad(false))
  }, [pedRow?.numero])

  // Busca foto de perfil WA
  useEffect(() => {
    if (!det) return
    const tel = (c.celular||c.telefone||'').replace(/\D/g,'')
    if (!tel) return
    fetch(`${api}/api/dashboard/foto-perfil/${tel}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if(d?.url) setPfp(d.url) })
      .catch(() => {})
  }, [det])

  // Busca rastreio ao entrar na aba
  useEffect(() => {
    if (tab!=='rastreio'||!cod||trackEvs.length>0) return
    setTLoad(true)
    fetch(`${api}/api/dashboard/rastreio/${cod}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { const r0=d?.resultados?.[0]; if(r0){setTEvs(r0.eventos||[]);setTSt(r0.status||null)} setTLoad(false) })
      .catch(() => setTLoad(false))
  }, [tab, cod])

  const copy = (v,k) => { navigator.clipboard.writeText(String(v??'')); setCp(k); setTimeout(()=>setCp(''),1800) }

  const enviarWA = async () => {
    if(!det) return; setSend(true)
    const nome = (c.nome||pedRow.contato||'').split(' ')[0]
    const itens = (p.itens||[]).map(i=>`• ${i.descricao?.slice(0,40)} (${i.quantidade}x) — ${R((i.valor||0)*(i.quantidade||1))}`).join('
')
    const msg = `✅ *Pedido #${pedRow.numero}*

Olá, *${nome}*!

${itens}

💰 *Total: ${R(pedRow.total)}*
📦 ${sit.label}

_Só Strass 🥰_`
    try {
      const tel = (c.celular||c.telefone||'').replace(/\D/g,'')
      if(tel) await fetch(`${api}/api/dashboard/manual/${tel}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mensagem:msg})})
      setSent(true); setTimeout(()=>setSent(false),3000)
    } catch {}
    setSend(false)
  }

  const enviarRastreioWA = async () => {
    if(!cod) return
    const tel = (c.celular||c.telefone||'').replace(/\D/g,'')
    if(!tel) return
    const link = linkRastreio(cod)
    const msg = `📦 *Rastreio #${p.numero||pedRow.numero}*

\`${cod}\`${trackSt?`
*${trackSt}*`:''}

${link}

_Só Strass 🥰_`
    try { await fetch(`${api}/api/dashboard/manual/${tel}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mensagem:msg})}) } catch {}
  }

  // ── Micro-componentes internos ─────────────────────────────────────────────
  const SectionLabel = ({children}) => (
    <p style={{fontSize:10,fontWeight:500,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',margin:'0 0 7px'}}>{children}</p>
  )

  const FinRow = ({icon:Ic, label, value, cor, badge}) => {
    if(!value&&value!==0) return null
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'0.5px solid var(--sep)'}}>
        <span style={{display:'flex',alignItems:'center',gap:6,fontSize:12.5,color:'var(--label-3)'}}>
          <Ic size={13} style={{color:'var(--label-4)',flexShrink:0}}/>{label}
        </span>
        {badge
          ? <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11.5,padding:'2px 9px',borderRadius:6,background:'var(--fill)',border:'0.5px solid var(--sep)',color:'var(--label-2)'}}>{badge}</span>
          : <span style={{fontSize:12.5,color:cor||'var(--label)'}}>{value}</span>
        }
      </div>
    )
  }

  const DataRow = ({label,value,mono,onCopy}) => {
    if(!value) return null
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'0.5px solid var(--sep)'}}>
        <span style={{fontSize:12,color:'var(--label-4)',flexShrink:0,minWidth:110}}>{label}</span>
        <div style={{display:'flex',alignItems:'center',gap:6,minWidth:0}}>
          <span style={{fontSize:12.5,color:'var(--label)',fontFamily:mono?'monospace':'inherit',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{value}</span>
          {onCopy && <button onClick={onCopy} style={{display:'flex',alignItems:'center',gap:3,padding:'1px 6px',borderRadius:4,border:'0.5px solid var(--sep)',background:'transparent',color:cp===label?'#22c55e':'var(--label-4)',cursor:'pointer',fontSize:10,flexShrink:0}}>
            {cp===label?<><Check size={8}/>ok</>:<><Copy size={8}/>copiar</>}
          </button>}
        </div>
      </div>
    )
  }

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (load) return <>
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:40,backdropFilter:'blur(4px)'}}/>
    <div style={{position:'fixed',top:0,right:0,bottom:0,width:480,zIndex:50,background:'var(--bg-2)',borderLeft:'0.5px solid var(--sep)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}>
      <div style={{width:36,height:36,borderRadius:'50%',border:`2px solid var(--sep)`,borderTopColor:sit.cor,animation:'spin 1s linear infinite'}}/>
      <span style={{fontSize:12,color:'var(--label-4)'}}>#{pedRow.numero}</span>
    </div>
  </>

  // ── Tabs config ────────────────────────────────────────────────────────────
  const TABS = [
    {id:'pedido',   label:'Pedido'},
    {id:'cliente',  label:'Cliente'},
    {id:'rastreio', label:'Rastreio'},
    {id:'historico',label:`Histórico (${hD.total??histLocal.length})`},
    {id:'conversa', label:'Conversa'},
    {id:'nota',     label:'+ Nota'},
  ]

  return <>
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:40,backdropFilter:'blur(4px)'}}/>

    <div style={{position:'fixed',top:0,right:0,bottom:0,width:480,zIndex:50,background:'var(--bg-2)',borderLeft:'0.5px solid var(--sep)',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'-16px 0 48px rgba(0,0,0,.25)'}}>

      {/* Accent stripe */}
      <div style={{height:2,background:`linear-gradient(90deg,${sit.cor}99,${(CANAL_STYLE[canal]||CANAL_STYLE.bling).border})`,flexShrink:0}}/>

      {/* ═══ HEADER ═══════════════════════════════════════════════════════════ */}
      <div style={{padding:'13px 16px 0',flexShrink:0,borderBottom:'0.5px solid var(--sep)'}}>

        {/* Linha 1 */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:9}}>
          <span style={{fontSize:20,fontWeight:500,color:'var(--label)',letterSpacing:'-.5px',lineHeight:1}}>#{pedRow.numero}</span>
          <span style={pill(sit.bg,sit.cor,sit.bdr)}>
            <span style={{width:5,height:5,borderRadius:'50%',background:sit.cor,display:'inline-block'}}/>
            {sit.label}
          </span>
          {isNew && <span style={pill('#FAEEDA','#633806','#EFD28A')}>⭐ 1ª compra</span>}
          <div style={{flex:1}}/>
          {/* Links rápidos — discretos */}
          {p.linkBling && <a href={p.linkBling} target="_blank" rel="noreferrer" style={qlink()}>
            <ExternalLink size={10}/> Bling
          </a>}
          {nf && <a href={`https://www.bling.com.br/notas-fiscais/${nf.id}`} target="_blank" rel="noreferrer" style={qlink({color:'#0F6E56',background:'#E1F5EE',border:'0.5px solid #5DCAA5'})}>
            <FileText size={10}/> NF {nf.numero?`#${nf.numero}`:''}
          </a>}
          {c.linkBling && <a href={c.linkBling} target="_blank" rel="noreferrer" style={qlink()}>
            <Users size={10}/> Cadastro
          </a>}
          <button onClick={onClose} style={iconBtn({width:28,height:28,borderRadius:7})}>
            <X size={12}/>
          </button>
        </div>

        {/* Linha 2: canal + data + rastreio + valor */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <CanalBadgeSmall canal={canal}/>
          <span style={{fontSize:11.5,color:'var(--label-4)'}}>{fmtDT(pedRow.data)}</span>
          {cod && <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10.5,padding:'1px 7px',borderRadius:5,background:'var(--fill)',border:'0.5px solid var(--sep)',color:'var(--label-4)',fontFamily:'monospace'}}>
            <Truck size={10}/>{cod.slice(0,12)}…
          </span>}
          <div style={{flex:1}}/>
          <span style={{fontSize:16,fontWeight:500,color:'var(--label)'}}>{R(total)}</span>
        </div>

        {/* Linha 3: métricas inline — sem cards */}
        <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:10,paddingTop:8,borderTop:'0.5px solid var(--sep)'}}>
          {[
            {l:'compra',       v:`${hD.nCompra??nComp}ª`,                                     c:isNew?'#854F0B':'var(--label-3)'},
            {l:'pedidos',      v:fmt(hD.total??(histLocal.length+1)),                          c:'var(--label-3)'},
            {l:'LTV',          v:R(hD.gasto??ltv),                                             c:'var(--label-3)'},
            {l:'ticket médio', v:R((hD.gasto??ltv)/Math.max(hD.total??(histLocal.length+1),1)),c:'var(--label-4)'},
          ].map((k,i,arr) => (
            <div key={k.l} style={{flex:1,textAlign:'center',paddingRight:i<arr.length-1?8:0,marginRight:i<arr.length-1?8:0,borderRight:i<arr.length-1?'0.5px solid var(--sep)':'none'}}>
              <div style={{fontSize:12.5,fontWeight:500,color:k.c,lineHeight:1}}>{k.v}</div>
              <div style={{fontSize:9.5,color:'var(--label-4)',marginTop:2,textTransform:'uppercase',letterSpacing:'.06em'}}>{k.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:0,marginBottom:-1,overflowX:'auto'}}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'7px 12px',fontSize:12,border:'none',background:'transparent',cursor:'pointer',
              color: tab===t.id ? 'var(--accent)' : 'var(--label-4)',
              borderBottom: `2px solid ${tab===t.id ? 'var(--accent)' : 'transparent'}`,
              whiteSpace:'nowrap',flexShrink:0,fontWeight:tab===t.id?500:400,transition:'color .1s',
              ...(t.id==='nota'?{marginLeft:'auto',color:'var(--label-4)'}:{}),
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ CONTENT ══════════════════════════════════════════════════════════ */}
      <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>

        {/* ── PEDIDO ──────────────────────────────────────────────────────── */}
        {tab==='pedido' && <>
          {/* Progress compacto */}
          <div style={{display:'flex',alignItems:'flex-start',marginBottom:18}}>
            {[
              {l:'Recebido',   done:true,                                             data:fmtD(pedRow.data||p.data)},
              {l:'Confirmado', done:[9,15].includes(sitId),                           data:'pagamento aprovado'},
              {l:'Enviado',    done:[9,15].includes(sitId)&&!!p.dataSaida&&!p.dataSaida?.startsWith('0000'), data:p.dataSaida?fmtD(p.dataSaida):'aguardando'},
              {l:'Entregue',   done:sitId===15,                                       data:'confirmado'},
            ].map((s,i,arr) => (
              <div key={s.l} style={{display:'flex',alignItems:'flex-start',flex:i<arr.length-1?1:'none'}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0}}>
                  <div style={{width:22,height:22,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:s.done?sit.cor:'var(--fill)',border:`1.5px solid ${s.done?sit.cor:'var(--sep)'}`,transition:'all .3s'}}>
                    {s.done?<Check size={11} style={{color:'white',strokeWidth:3}}/>:<span style={{width:6,height:6,borderRadius:'50%',background:'var(--sep)',display:'block'}}/>}
                  </div>
                  <p style={{fontSize:9.5,margin:'4px 0 0',color:s.done?sit.cor:'var(--label-4)',fontWeight:s.done?500:400,textAlign:'center',whiteSpace:'nowrap',lineHeight:1.2}}>{s.l}</p>
                  <p style={{fontSize:9,margin:'2px 0 0',color:'var(--label-4)',textAlign:'center',whiteSpace:'nowrap'}}>{s.data}</p>
                </div>
                {i<arr.length-1 && <div style={{flex:1,height:1.5,marginTop:10,marginInline:4,background:arr[i+1]?.done?`${sit.cor}60`:'var(--sep)',transition:'background .3s'}}/>}
              </div>
            ))}
          </div>

          {/* Financeiro */}
          <SectionLabel>Financeiro</SectionLabel>
          <div style={{marginBottom:16}}>
            <FinRow icon={CreditCard} label="Pagamento"
              badge={
                isPix ? '💰 PIX' :
                isCard && nParcelas ? `💳 Cartão · ${nParcelas}× s/juros` :
                isCard ? '💳 Cartão' :
                forma && forma!=='—' ? forma : null
              }
            />
            <FinRow icon={Truck}    label="Frete"      value={t.frete>0?R(t.frete):'Grátis'} cor={t.frete>0?'var(--label)':'#0F6E56'}/>
            {p.totalDesconto>0 && <FinRow icon={Tag} label="Desconto" value={`− ${R(p.totalDesconto)}`} cor='#0F6E56'/>}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',marginTop:2}}>
              <span style={{fontSize:13,fontWeight:500,color:'var(--label)'}}>Total</span>
              <span style={{fontSize:15,fontWeight:500,color:'var(--label)'}}>{R(total)}</span>
            </div>
          </div>

          {/* Itens */}
          {(p.itens||[]).length>0 && <>
            <SectionLabel>Itens ({p.itens.length})</SectionLabel>
            <div style={{marginBottom:16}}>
              {p.itens.map((item,i) => {
                const imgArr = Array.isArray(item.imagens)?item.imagens:(typeof item.imagens==='string'?JSON.parse(item.imagens||'[]'):[])
                const imgUrl = imgArr?.[0]?.link || imgArr?.[0] || null
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<p.itens.length-1?'0.5px solid var(--sep)':'none'}}>
                    <div style={{width:36,height:36,borderRadius:7,background:'var(--fill)',border:'0.5px solid var(--sep)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
                      {imgUrl
                        ? <img src={imgUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                        : <Package2 size={15} style={{color:'var(--label-4)'}}/>
                      }
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:12.5,fontWeight:500,color:'var(--label)',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.descricao}</p>
                      <p style={{fontSize:10.5,color:'var(--label-4)',margin:0,fontFamily:'monospace'}}>{item.codigo} · {item.quantidade}× · {R(item.valor)}/un</p>
                    </div>
                    <span style={{fontSize:13,fontWeight:500,color:'var(--label)',flexShrink:0}}>{R((item.valor||0)*(item.quantidade||1))}</span>
                  </div>
                )
              })}
            </div>
          </>}

          {/* Automações */}
          <GatilhosPanel/>

          {/* Obs */}
          {(p.observacoes||p.observacoesInt) && <>
            <SectionLabel>Observações</SectionLabel>
            {p.observacoes && <p style={{fontSize:12.5,color:'var(--label-2)',lineHeight:1.6,margin:'0 0 8px'}}>{p.observacoes}</p>}
            {p.observacoesInt && <p style={{fontSize:12,color:'var(--label-4)',background:'var(--fill)',padding:'7px 10px',borderRadius:7,border:'0.5px solid var(--sep)',margin:0}}>🔒 {p.observacoesInt}</p>}
          </>}
        </>}

        {/* ── CLIENTE ─────────────────────────────────────────────────────── */}
        {tab==='cliente' && <>
          {/* Perfil */}
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,padding:'12px',borderRadius:9,background:'var(--fill)',border:'0.5px solid var(--sep)'}}>
            {/* Avatar — foto WA se disponível, senão iniciais */}
            <div style={{width:46,height:46,borderRadius:'50%',background:'var(--bg)',border:'0.5px solid var(--sep)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
              {pfp
                ? <img src={pfp} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : <span style={{fontSize:16,fontWeight:500,color:'var(--label-3)'}}>{(c.nome||pedRow.contato||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</span>
              }
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:14,fontWeight:500,color:'var(--label)',margin:'0 0 3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.nome||pedRow.contato||'—'}</p>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                {c.fantasia?.trim() && <span style={{fontSize:11,color:'var(--label-4)'}}>{c.fantasia.trim()}</span>}
                <span style={{fontSize:11,color:'var(--label-4)'}}>{c.tipo==='J'?'Pessoa Jurídica':'Pessoa Física'}</span>
                {isNew && <span style={{...pill('#FAEEDA','#633806','#EFD28A'),fontSize:10}}>1ª compra</span>}
              </div>
            </div>
          </div>

          <SectionLabel>Contato</SectionLabel>
          <div style={{marginBottom:16}}>
            <DataRow label="Celular"   value={c.celular||c.telefone} mono onCopy={()=>copy(c.celular||c.telefone,'Celular')}/>
            <DataRow label="Email"     value={c.email}               mono onCopy={()=>copy(c.email,'Email')}/>
            <DataRow label="CPF / CNPJ" value={c.cpfCnpj||c.numeroDocumento} mono onCopy={()=>copy(c.cpfCnpj||c.numeroDocumento,'CPF / CNPJ')}/>
            {c.tipo==='J' && <DataRow label="IE" value={c.ie} mono/>}
          </div>

          {end && <>
            <SectionLabel>Endereço de entrega</SectionLabel>
            <div style={{marginBottom:16,fontSize:13,color:'var(--label)',lineHeight:1.9}}>
              <div>{end.logradouro||end.endereco||'—'}, {end.numero||''}{end.complemento?` · ${end.complemento}`:''}</div>
              <div style={{color:'var(--label-3)'}}>{end.bairro}{end.municipio?` · ${end.municipio}`:''}{end.uf?`/${end.uf}`:''}</div>
              {end.cep && <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                <span style={{fontSize:12,fontFamily:'monospace',color:'var(--label-3)'}}>{fmtCEP(end.cep)}</span>
                <button onClick={()=>copy(`${end.logradouro||end.endereco}, ${end.numero} - ${end.bairro}, ${end.municipio}/${end.uf} - CEP ${fmtCEP(end.cep)}`,'end')} style={{display:'flex',alignItems:'center',gap:3,padding:'1px 7px',borderRadius:4,border:'0.5px solid var(--sep)',background:'transparent',color:cp==='end'?'#22c55e':'var(--label-4)',cursor:'pointer',fontSize:10}}>
                  {cp==='end'?<><Check size={8}/> Copiado</>:<><Copy size={8}/> Copiar endereço</>}
                </button>
              </div>}
            </div>
          </>}

          <SectionLabel>Histórico de compras</SectionLabel>
          <div style={{display:'flex',padding:'10px 12px',borderRadius:8,background:'var(--fill)',border:'0.5px solid var(--sep)',gap:0}}>
            {[
              {l:'pedidos',      v:fmt(hD.total??(histLocal.length+1))},
              {l:'LTV total',    v:R(hD.gasto??ltv)},
              {l:'ticket médio', v:R((hD.gasto??ltv)/Math.max(hD.total??(histLocal.length+1),1))},
              {l:'esta compra',  v:`${hD.nCompra??nComp}ª`, c:isNew?'#854F0B':'var(--label-3)'},
            ].map((k,i,arr)=>(
              <div key={k.l} style={{flex:1,textAlign:'center',paddingRight:i<arr.length-1?8:0,marginRight:i<arr.length-1?8:0,borderRight:i<arr.length-1?'0.5px solid var(--sep)':'none'}}>
                <div style={{fontSize:13,fontWeight:500,color:k.c||'var(--label)',lineHeight:1}}>{k.v}</div>
                <div style={{fontSize:9.5,color:'var(--label-4)',marginTop:3,textTransform:'uppercase',letterSpacing:'.06em'}}>{k.l}</div>
              </div>
            ))}
          </div>
        </>}

        {/* ── RASTREIO ────────────────────────────────────────────────────── */}
        {tab==='rastreio' && <>
          {cod ? <>
            <button onClick={enviarRastreioWA} style={{display:'flex',alignItems:'center',gap:7,width:'100%',padding:'9px 12px',borderRadius:8,border:'0.5px solid var(--sep)',background:'var(--fill)',color:'var(--label-3)',cursor:'pointer',fontSize:12,fontWeight:400,marginBottom:14,textAlign:'left'}}>
              <MessageSquare size={13}/> Enviar código no WhatsApp
              {r.msgEnviada && <span style={{marginLeft:'auto',fontSize:10.5,color:'var(--label-4)'}}>✓ enviado {r.qtdMsgRastreio}×</span>}
            </button>

            <div style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',borderRadius:8,background:'var(--fill)',border:'0.5px solid var(--sep)',marginBottom:12}}>
              <Truck size={13} style={{color:'var(--label-4)',flexShrink:0}}/>
              <span style={{fontSize:12.5,fontFamily:'monospace',color:'var(--label)',flex:1,letterSpacing:'.04em'}}>{cod}</span>
              <TraspBadge codigo={cod}/>
              <button onClick={()=>copy(cod,'cod')} style={{display:'flex',alignItems:'center',gap:3,padding:'2px 7px',borderRadius:5,border:'0.5px solid var(--sep)',background:'transparent',color:cp==='cod'?'#22c55e':'var(--label-4)',cursor:'pointer',fontSize:10}}>
                {cp==='cod'?<><Check size={8}/>ok</>:<><Copy size={8}/>copiar</>}
              </button>
              <a href={linkRastreio(cod)} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:3,padding:'2px 7px',borderRadius:5,border:'0.5px solid var(--sep)',background:'transparent',color:'var(--label-3)',textDecoration:'none',fontSize:10}}>
                <ExternalLink size={9}/> ver
              </a>
            </div>

            {(trackSt||r.status) && <div style={{padding:'7px 12px',borderRadius:7,background:'var(--fill)',border:'0.5px solid var(--sep)',marginBottom:12,display:'flex',alignItems:'center',gap:7}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#1D9E75',display:'inline-block',flexShrink:0}}/>
              <span style={{fontSize:12.5,color:'var(--label)'}}>{trackSt||r.status}</span>
            </div>}

            {tLoad && <p style={{fontSize:12,color:'var(--label-4)',display:'flex',alignItems:'center',gap:7,padding:'12px 0'}}>
              <RefreshCw size={12} style={{animation:'spin 1s linear infinite',color:'var(--label-4)'}}/> Consultando transportadora...
            </p>}
            {!tLoad && trackEvs.length===0 && <p style={{fontSize:12,color:'var(--label-4)',padding:'16px 0',textAlign:'center'}}>Sem movimentações registradas ainda.</p>}
            {trackEvs.length>0 && <div style={{position:'relative',paddingLeft:16}}>
              <div style={{position:'absolute',left:5,top:6,bottom:6,width:1,background:'var(--sep)',borderRadius:99}}/>
              {trackEvs.map((ev,i)=>(
                <div key={i} style={{position:'relative',paddingLeft:16,paddingBottom:i<trackEvs.length-1?12:0}}>
                  <div style={{position:'absolute',left:-4,top:4,width:10,height:10,borderRadius:'50%',background:i===0?'#1D9E75':'var(--fill)',border:`1.5px solid ${i===0?'#1D9E75':'var(--sep)'}`,zIndex:1}}/>
                  <p style={{fontSize:12.5,fontWeight:i===0?500:400,color:i===0?'var(--label)':'var(--label-3)',margin:'0 0 2px',lineHeight:1.3}}>{ev.status}</p>
                  {ev.detalhe && <p style={{fontSize:11.5,color:'var(--label-4)',margin:'0 0 1px'}}>{ev.detalhe}</p>}
                  {ev.local && <p style={{fontSize:11.5,color:'var(--label-4)',margin:'0 0 1px',display:'flex',alignItems:'center',gap:3}}><MapPin size={8}/>{ev.local}</p>}
                  <p style={{fontSize:10.5,color:'var(--label-4)',margin:0,fontFamily:'monospace',opacity:.7}}>{ev.data?fmtDT(ev.data):''}</p>
                </div>
              ))}
            </div>}
          </> : (
            <div style={{padding:'40px 0',textAlign:'center',color:'var(--label-4)'}}>
              <Truck size={28} style={{display:'block',margin:'0 auto 10px',opacity:.2}}/>
              <p style={{fontSize:13,margin:'0 0 4px',color:'var(--label-3)'}}>Sem código de rastreio</p>
              <p style={{fontSize:11.5,margin:0,opacity:.7}}>Aparece após a postagem do objeto</p>
            </div>
          )}
        </>}

        {/* ── HISTÓRICO ───────────────────────────────────────────────────── */}
        {tab==='historico' && (
          (hD.pedidos||histLocal).length>0 ? <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span style={{fontSize:12,color:'var(--label-4)'}}>{hD.total??histLocal.length} pedido{(hD.total??histLocal.length)!==1?'s':''} anteriores</span>
              <span style={{fontSize:12,fontWeight:500,color:'var(--label)'}}>{R(hD.gasto??histLocal.reduce((s,p)=>s+Number(p.total||0),0))}</span>
            </div>
            {[...(hD.pedidos||histLocal)].sort((a,b)=>b.numero-a.numero).map((hp,i)=>{
              const hSit=SIT[hp.situacaoId||getSitId(hp)]||{label:'—',cor:'#888',bg:'var(--fill)',bdr:'var(--sep)'}
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'0.5px solid var(--sep)'}}>
                  <span style={{fontSize:12,fontWeight:500,color:'var(--label-3)',fontFamily:'monospace',flexShrink:0,minWidth:64}}>#{hp.numero}</span>
                  <span style={pill(hSit.bg,hSit.cor,hSit.bdr)}>
                    <span style={{width:5,height:5,borderRadius:'50%',background:hSit.cor,display:'inline-block'}}/>{hSit.label}
                  </span>
                  <CanalBadgeSmall canal={hp.canal||getCanal(hp)}/>
                  <span style={{fontSize:11.5,color:'var(--label-4)',flex:1}}>{fmtD(hp.data)}</span>
                  <span style={{fontSize:12.5,fontWeight:500,color:'var(--label)',flexShrink:0}}>{R(hp.total)}</span>
                </div>
              )
            })}
          </> : (
            <div style={{padding:'40px 0',textAlign:'center'}}>
              <Star size={24} style={{display:'block',margin:'0 auto 10px',color:'#854F0B',opacity:.4}}/>
              <p style={{fontSize:13,fontWeight:500,color:'var(--label)',margin:'0 0 4px'}}>Primeira compra</p>
              <p style={{fontSize:12,color:'var(--label-4)',margin:0}}>Nenhum pedido anterior</p>
            </div>
          )
        )}

        {/* ── CONVERSA ────────────────────────────────────────────────────── */}
        {tab==='conversa' && (
          (ms.lista||[]).length>0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {ms.lista.slice(0,40).map((m,i)=>{
                const entrada = m.direcao==='entrada'
                return (
                  <div key={i} style={{display:'flex',gap:8,alignItems:'flex-end',flexDirection:entrada?'row':'row-reverse'}}>
                    <div style={{width:24,height:24,borderRadius:'50%',background:'var(--fill)',border:'0.5px solid var(--sep)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {entrada?<Users size={11} style={{color:'var(--label-4)'}}/>:<Zap size={11} style={{color:'var(--label-4)'}}/>}
                    </div>
                    <div style={{maxWidth:'80%',background:entrada?'var(--bg)':'var(--fill)',borderRadius:entrada?'10px 10px 10px 3px':'10px 10px 3px 10px',padding:'8px 10px',border:'0.5px solid var(--sep)'}}>
                      <div style={{display:'flex',justifyContent:entrada?'flex-start':'flex-end',marginBottom:3,gap:8}}>
                        <span style={{fontSize:10.5,color:'var(--label-4)',fontWeight:500}}>{entrada?'Cliente':'Bia'}</span>
                        <span style={{fontSize:10,color:'var(--label-4)',fontFamily:'monospace'}}>{fmtDT(m.criado_em)}</span>
                      </div>
                      <p style={{fontSize:12.5,color:'var(--label-2)',margin:0,lineHeight:1.5,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{(m.conteudo||'').slice(0,400)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{padding:'40px 0',textAlign:'center',color:'var(--label-4)'}}>
              <MessageSquare size={24} style={{display:'block',margin:'0 auto 10px',opacity:.2}}/>
              <p style={{fontSize:13,margin:0,color:'var(--label-3)'}}>Sem mensagens</p>
            </div>
          )
        )}

        {/* ── NOTA ────────────────────────────────────────────────────────── */}
        {tab==='nota' && (
          <NotaPanel pedidoNumero={pedRow.numero}/>
        )}

      </div>

      {/* ═══ FOOTER ══════════════════════════════════════════════════════════ */}
      <div style={{flexShrink:0,borderTop:'0.5px solid var(--sep)',padding:'10px 16px',display:'flex',gap:7,background:'var(--bg-2)',alignItems:'center'}}>
        <button onClick={enviarWA} disabled={sending||!det} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'9px',borderRadius:8,border:'0.5px solid var(--sep)',background:'var(--fill)',color:sent?'#0F6E56':'var(--label-3)',cursor:det?'pointer':'not-allowed',fontSize:12.5,fontWeight:400,opacity:!det?.5:1,transition:'color .2s'}}>
          {sent?<><CheckCircle size={14}/> Enviado!</>:sending?<><RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Enviando...</>:<><MessageSquare size={14}/> Enviar mensagem</>}
        </button>
        {cod && <a href={linkRastreio(cod)} target="_blank" rel="noreferrer" style={iconBtn({textDecoration:'none'})} title="Rastrear envio">
          <Truck size={14}/>
        </a>}
        {p.linkBling && <a href={p.linkBling} target="_blank" rel="noreferrer" style={iconBtn({textDecoration:'none'})} title="Abrir no Bling">
          <ExternalLink size={14}/>
        </a>}
        <button style={iconBtn()} title="Mais ações">
          <MoreHorizontal size={14}/>
        </button>
      </div>

    </div>
  </>
}


// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────
function KCard({icon:Ic,label,value,sub,cor,trend,spark=[],destaque}) {
  const max=Math.max(...spark,1)
  const pts=spark.map((v,i)=>`${(i/(spark.length-1||1))*100},${100-(v/max)*80}`)
  return <div style={{background:'var(--bg-2)',border:`1px solid ${destaque?`${cor}40`:'var(--sep)'}`,borderRadius:14,padding:'16px 18px',position:'relative',overflow:'hidden'}}>
    {destaque&&<div style={{position:'absolute',top:0,left:0,right:0,height:3,background:cor,borderRadius:'14px 14px 0 0'}}/>}
    {spark.length>1&&<svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position:'absolute',bottom:0,left:0,right:0,height:48,opacity:.07,pointerEvents:'none'}}>
      <polyline points={pts.join(' ')} fill="none" stroke={cor} strokeWidth="3"/>
    </svg>}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12,position:'relative'}}>
      <div style={{width:34,height:34,borderRadius:9,background:`${cor}18`,display:'flex',alignItems:'center',justifyContent:'center'}}><Ic size={15} style={{color:cor}}/></div>
      {trend!==undefined&&<div style={{display:'flex',alignItems:'center',gap:3,fontSize:11.5,fontWeight:700,padding:'2px 8px',borderRadius:99,background:trend>0?'rgba(34,197,94,.1)':trend<0?'rgba(239,68,68,.1)':'var(--fill)',color:trend>0?'#22c55e':trend<0?'#ef4444':'var(--label-4)'}}>
        {trend>0?<TrendingUp size={11}/>:trend<0?<TrendingDown size={11}/>:<Minus size={11}/>}{trend>0?'+':''}{trend}%
      </div>}
    </div>
    <div style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--label-4)',marginBottom:6,position:'relative'}}>{label}</div>
    <div style={{fontSize:24,fontWeight:800,color:cor,letterSpacing:'-.5px',lineHeight:1,marginBottom:4,position:'relative'}}>{value}</div>
    {sub&&<div style={{fontSize:11.5,color:'var(--label-4)',position:'relative'}}>{sub}</div>}
  </div>
}

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function PagePedidos({api}) {
  const [pedidos,    setPedidos]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [loadMore,   setLoadMore]   = useState(false)
  const [pgAPI,      setPgAPI]      = useState(1)
  const [temMais,    setTemMais]    = useState(true)
  const [busca,      setBusca]      = useState('')
  const [filtroSit,  setFiltroSit]  = useState('0')
  const [filtroCanal,setFiltroCanal]= useState('todos')
  const [dateRange,  setDateRange]  = useState({from:'',to:''})
  const [sortCol,    setSortCol]    = useState('numero')
  const [sortDir,    setSortDir]    = useState('desc')
  const [pgUI,       setPgUI]       = useState(1)
  const [sel,        setSel]        = useState(null)
  const [view,       setView]       = useState('tabela')
  const [showFilters,setShowF]      = useState(false)
  const POR_PAG = 20

  const SITS_LABEL = {0:'Todos',6:'Em Aberto',9:'Atendido',12:'Cancelado',15:'Verificado'}

  const carregar=useCallback(async(pg=1,acum=false)=>{
    if(pg===1) setLoading(true); else setLoadMore(true)
    try{
      let url=`${api}/api/dashboard/pedidos?limite=100&pagina=${pg}`
      if(filtroSit!=='0') url+=`&situacao=${filtroSit}`
      if(dateRange.from) url+=`&dataInicio=${dateRange.from}`
      if(dateRange.to)   url+=`&dataFim=${dateRange.to}`
      const r=await fetch(url)
      if(r.ok){
        const d=await r.json()
        const novos=d.pedidos||[]
        setPedidos(prev=>acum?[...prev,...novos]:novos)
        setTemMais(novos.length>=100)
        setPgAPI(pg)
      }
    }catch{}
    if(pg===1) setLoading(false); else setLoadMore(false)
  },[api,filtroSit,dateRange])

  useEffect(()=>{carregar(1,false);setPgUI(1)},[carregar])

  // Filtro local
  const filtrados=pedidos.filter(p=>{
    const c=getCanal(p)
    return (filtroCanal==='todos'||c===filtroCanal)
      &&(!busca||String(p.numero).includes(busca)||(p.contato||'').toLowerCase().includes(busca.toLowerCase()))
  }).sort((a,b)=>{
    let va=a[sortCol],vb=b[sortCol]
    if(['total','numero'].includes(sortCol)){va=Number(va);vb=Number(vb)}
    if(sortCol==='data'){va=new Date(va);vb=new Date(vb)}
    return sortDir==='asc'?(va>vb?1:-1):(va<vb?1:-1)
  })

  const total=filtrados.length
  const inicio=(pgUI-1)*POR_PAG
  const pgData=filtrados.slice(inicio,inicio+POR_PAG)
  const totalPgs=Math.ceil(total/POR_PAG)

  const toggleSort=col=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc')}
  const SortIco=({col})=>sortCol===col?(sortDir==='asc'?<ChevronUp size={10}/>:<ChevronDown size={10}/>):<ArrowUpDown size={9} style={{opacity:.25}}/>

  // Métricas
  const totalVal   =filtrados.reduce((s,p)=>s+Number(p.total||0),0)
  const countSit   =pedidos.reduce((a,p)=>{const s=getSitId(p);a[s]=(a[s]||0)+1;return a},{})
  const countCanal =pedidos.reduce((a,p)=>{const c=getCanal(p);a[c]=(a[c]||0)+1;return a},{})
  const novos      =pedidos.filter(p=>pedidos.filter(x=>x.contato===p.contato&&x.numero<p.numero).length===0).length
  const verificados=countSit[15]||0
  const abertos    =countSit[6]||0
  const taxaEntrega=pedidos.length>0?Math.round(verificados/pedidos.length*100):0

  // Sparkline 7 dias
  const spark=Array.from({length:7},(_,i)=>{
    const dia=new Date(Date.now()-(6-i)*86400000).toISOString().split('T')[0]
    return {dia:dia.slice(5), v:pedidos.filter(p=>(p.data||'').startsWith(dia)).reduce((s,p)=>s+Number(p.total||0),0)}
  })

  // Canal breakdown para o mini gráfico
  const canalData=Object.entries(countCanal).map(([canal,count])=>({
    canal, count, receita:pedidos.filter(p=>getCanal(p)===canal).reduce((s,p)=>s+Number(p.total||0),0),
    cor:(CH[canal]||CH.bling).cor, label:(CH[canal]||CH.bling).label,
  })).sort((a,b)=>b.receita-a.receita)

  const temFiltros=busca||filtroCanal!=='todos'||dateRange.from||dateRange.to
  const limpar=()=>{setBusca('');setFiltroCanal('todos');setDateRange({from:'',to:''});setPgUI(1)}

  const KANBAN=[
    {sitId:6,  label:'Em Aberto',  cor:SIT[6].cor,  Ic:Clock},
    {sitId:9,  label:'Atendido',   cor:SIT[9].cor,  Ic:Truck},
    {sitId:15, label:'Verificado', cor:SIT[15].cor, Ic:CheckCircle},
    {sitId:12, label:'Cancelado',  cor:SIT[12].cor, Ic:XCircle},
  ]

  return <div style={{height:'100%',overflowY:'auto',background:'var(--bg)',padding:'24px 28px'}}>
    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

    {/* ── HEADER ── */}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:20}}>
      <div>
        <h1 style={{fontSize:26,fontWeight:800,color:'var(--label)',margin:0,letterSpacing:'-.5px'}}>Central de Vendas</h1>
        <p style={{fontSize:12.5,color:'var(--label-4)',margin:'4px 0 0'}}>
          {loading?'Carregando...':`${fmt(total)} resultado${total!==1?'s':''} · ${fmt(pedidos.length)} pedidos carregados`}
          {temMais&&!loading&&<button onClick={()=>carregar(pgAPI+1,true)} disabled={loadMore} style={{marginLeft:8,fontSize:12,color:'var(--accent)',border:'none',background:'transparent',cursor:'pointer',fontWeight:600}}>{loadMore?'Carregando...':'+ Carregar mais'}</button>}
        </p>
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <div style={{display:'flex',borderRadius:10,border:'1px solid var(--sep)',overflow:'hidden'}}>
          {[['tabela',List,'Tabela'],['kanban',LayoutGrid,'Kanban']].map(([v,Ic,lb])=><button key={v} onClick={()=>setView(v)} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',border:'none',background:view===v?'var(--accent-dim)':'transparent',color:view===v?'var(--accent)':'var(--label-3)',cursor:'pointer',fontSize:12.5,fontWeight:view===v?700:400}}><Ic size={14}/>{lb}</button>)}
        </div>
        <button onClick={()=>setShowF(v=>!v)} style={{display:'flex',alignItems:'center',gap:7,padding:'7px 14px',borderRadius:10,border:'1px solid var(--sep)',background:temFiltros||showFilters?'var(--accent-dim)':'var(--bg-2)',color:temFiltros||showFilters?'var(--accent)':'var(--label-3)',cursor:'pointer',fontSize:12.5,fontWeight:500}}>
          <Filter size={14}/> Filtros {temFiltros&&<span style={{width:7,height:7,borderRadius:'50%',background:'var(--accent)',flexShrink:0}}/>}
        </button>
        <button onClick={()=>carregar(1,false)} style={{width:38,height:38,borderRadius:10,border:'1px solid var(--sep)',background:'var(--bg-2)',cursor:'pointer',color:'var(--label-3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <RefreshCw size={15} style={{animation:loading?'spin 1s linear infinite':undefined}}/>
        </button>
      </div>
    </div>

    {/* ── KPIs 5 colunas ── */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:18}}>
      <KCard icon={ShoppingCart}   label="Total pedidos"    value={fmt(pedidos.length)}   cor="#7c6af7"  sub={`${fmt(total)} filtrados`}            spark={spark.map(v=>v.v>0?1:0)} destaque/>
      <KCard icon={DollarSign}     label="Valor filtrado"   value={Rk(totalVal)}          cor="#00d4aa"  sub={`Ticket: ${Rk(totalVal/Math.max(total,1))}`} spark={spark.map(s=>s.v)}/>
      <KCard icon={Clock}          label="Em aberto"        value={fmt(abertos)}           cor="#f59e0b"  sub="aguardando processamento"             trend={abertos>0?-5:5}/>
      <KCard icon={Users}          label="Novas compras"    value={fmt(novos)}             cor="#e879f9"  sub={`${Math.round(novos/Math.max(pedidos.length,1)*100)}% do total`}/>
      <KCard icon={CheckCircle}    label="Taxa entregues"   value={`${taxaEntrega}%`}      cor="#22c55e"  sub={`${fmt(verificados)} pedidos`}         trend={taxaEntrega>=80?8:-5}/>
    </div>

    {/* ── DASH: sparkline + canal breakdown ── */}
    <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:14,marginBottom:18}}>
      {/* Sparkline */}
      <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 18px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <BarChart3 size={13} style={{color:'var(--label-4)'}}/>
            <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--label-4)'}}>Receita — últimos 7 dias</span>
          </div>
          <span style={{fontSize:13,fontWeight:700,color:'var(--accent)'}}>{Rk(spark.reduce((s,d)=>s+d.v,0))}</span>
        </div>
        <ResponsiveContainer width="100%" height={70}>
          <AreaChart data={spark} margin={{top:4,right:0,left:0,bottom:0}}>
            <defs><linearGradient id="gsp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4aa" stopOpacity={.35}/><stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="dia" tick={{fontSize:10,fill:'var(--label-4)'}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:9,fontSize:12}} formatter={v=>[`R$ ${Number(v).toFixed(0)}`,'Receita']}/>
            <Area type="monotone" dataKey="v" stroke="#00d4aa" strokeWidth={2.5} fill="url(#gsp)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Canal breakdown */}
      <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
          <Globe size={13} style={{color:'var(--label-4)'}}/>
          <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--label-4)'}}>Receita por canal</span>
        </div>
        {canalData.slice(0,5).map(c=>{
          const pct=totalVal>0?Math.round(c.receita/totalVal*100):0
          return <div key={c.canal} style={{marginBottom:9}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                {(CH[c.canal]||CH.bling).icon({s:12})}
                <span style={{fontSize:12,fontWeight:500,color:'var(--label-2)'}}>{c.label}</span>
              </div>
              <div style={{display:'flex',gap:10}}>
                <span style={{fontSize:11,color:'var(--label-4)'}}>{c.count} ped.</span>
                <span style={{fontSize:12,fontWeight:700,color:c.cor,minWidth:36,textAlign:'right'}}>{pct}%</span>
              </div>
            </div>
            <div style={{height:5,borderRadius:99,background:'var(--fill)',overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:99,background:c.cor,width:`${pct}%`,transition:'width .8s'}}/>
            </div>
          </div>
        })}
      </div>
    </div>

    {/* ── PIPELINE STATUS BAR ── */}
    <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 16px',marginBottom:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <span style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--label-4)'}}>Pipeline operacional</span>
        <div style={{display:'flex',gap:14,fontSize:11,color:'var(--label-4)'}}>
          {[[6,'Em Aberto','#f59e0b'],[9,'Atendido','#4a9fff'],[15,'Verificado','#22c55e'],[12,'Cancelado','#ef4444']].map(([id,lb,cor])=>(countSit[id]||0)>0&&<span key={id} style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:7,height:7,borderRadius:'50%',background:cor,display:'inline-block'}}/>{lb}: <b style={{color:'var(--label)'}}>{countSit[id]}</b></span>)}
        </div>
      </div>
      <div style={{display:'flex',gap:2,height:8,borderRadius:99,overflow:'hidden'}}>
        {[[6,'#f59e0b'],[9,'#4a9fff'],[15,'#22c55e'],[12,'#ef4444']].map(([id,cor])=>{
          const pct=pedidos.length>0?(countSit[id]||0)/pedidos.length*100:0
          return pct>0?<div key={id} style={{height:'100%',width:`${pct}%`,background:cor,borderRadius:2,transition:'width .6s'}}/>:null
        })}
      </div>
    </div>

    {/* ── FILTROS ── */}
    {showFilters&&<div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 18px',marginBottom:16,display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
      <div style={{flex:2,minWidth:220}}>
        <label style={{display:'block',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--label-4)',marginBottom:6}}>Buscar</label>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:10,border:'1px solid var(--sep)',background:'var(--bg)'}}>
          <Search size={13} style={{color:'var(--label-4)',flexShrink:0}}/>
          <input value={busca} onChange={e=>{setBusca(e.target.value);setPgUI(1)}} placeholder="Número ou nome do cliente..." style={{flex:1,border:'none',background:'transparent',outline:'none',fontSize:13,color:'var(--label)'}}/>
          {busca&&<button onClick={()=>setBusca('')} style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--label-4)',display:'flex'}}><X size={12}/></button>}
        </div>
      </div>
      <div style={{flex:1,minWidth:150}}>
        <label style={{display:'block',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--label-4)',marginBottom:6}}>Status</label>
        <select value={filtroSit} onChange={e=>{setFiltroSit(e.target.value);setPgUI(1)}} style={{width:'100%',padding:'8px 11px',borderRadius:10,border:'1px solid var(--sep)',background:'var(--bg)',color:'var(--label)',fontSize:13,cursor:'pointer',outline:'none'}}>
          {Object.entries(SITS_LABEL).map(([id,nm])=><option key={id} value={id}>{nm}{countSit[id]?` (${countSit[id]})`:''}</option>)}
        </select>
      </div>
      <div>
        <label style={{display:'block',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--label-4)',marginBottom:6}}>Período</label>
        Change={v=>{setDateRange(v);setPgUI(1)}}/>
      </div>
      {temFiltros&&<button onClick={limpar} style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:10,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-3)',cursor:'pointer',fontSize:12.5,alignSelf:'flex-end',whiteSpace:'nowrap'}}><X size={12}/> Limpar</button>}
    </div>}

    {/* CANAL CHIPS */}
    <div style={{display:'flex',gap:7,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
      <span style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--label-4)',marginRight:4}}>Canal:</span>
      {[['todos','Todos',pedidos.length,null],
        ...Object.entries(CH).filter(([k])=>(countCanal[k]||0)>0).map(([k,v])=>[k,v.label,countCanal[k]||0,v])
      ].map(([key,label,count,chi])=>{
        const ativo=filtroCanal===key
        const cor=chi?.cor||'#888'
        const Ic=chi?.icon
        return <button key={key} onClick={()=>{setFiltroCanal(ativo&&key!=='todos'?'todos':key);setPgUI(1)}}
          style={{display:'flex',alignItems:'center',gap:7,padding:'6px 14px',borderRadius:99,fontSize:12.5,fontWeight:ativo?700:500,cursor:'pointer',border:`1px solid ${ativo?cor:'var(--sep)'}`,background:ativo?`${cor}18`:'var(--bg-2)',color:ativo?cor:'var(--label-3)',transition:'all .1s'}}>
          {Ic&&<Ic s={15}/>}{label}
          {count>0&&<span style={{fontSize:11,fontWeight:700,padding:'0 5px',borderRadius:99,background:ativo?`${cor}28`:'var(--fill)',color:ativo?cor:'var(--label-4)',minWidth:18,textAlign:'center'}}>{count}</span>}
        </button>
      })}
    </div>

    {/* KANBAN */}
    {view==='kanban'&&<div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,alignItems:'start'}}>
      {KANBAN.map(col=>{
        const colPeds=filtrados.filter(p=>getSitId(p)===col.sitId)
        const colVal=colPeds.reduce((s,p)=>s+Number(p.total||0),0)
        return <div key={col.sitId} style={{background:'var(--bg-2)',border:`1px solid ${col.cor}35`,borderRadius:14,overflow:'hidden'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--sep)',background:`${col.cor}08`}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <col.Ic size={14} style={{color:col.cor}}/>
              <span style={{fontSize:13,fontWeight:700,color:col.cor}}>{col.label}</span>
              <span style={{marginLeft:'auto',fontSize:13,fontWeight:800,background:`${col.cor}20`,color:col.cor,padding:'2px 9px',borderRadius:99}}>{colPeds.length}</span>
            </div>
            {colVal>0&&<p style={{fontSize:13,fontWeight:700,color:col.cor,margin:0}}>{Rk(colVal)}</p>}
          </div>
          <div style={{padding:'10px',display:'flex',flexDirection:'column',gap:6,maxHeight:520,overflowY:'auto'}}>
            {colPeds.slice(0,15).map((p,i)=><button key={i} onClick={()=>setSel(p)}
              style={{display:'flex',alignItems:'flex-start',gap:9,padding:'9px 11px',borderRadius:10,background:'var(--bg)',border:'1px solid var(--sep)',cursor:'pointer',textAlign:'left',width:'100%',transition:'border .1s'}}
              onMouseEnter={e=>e.currentTarget.style.border=`1px solid ${col.cor}50`}
              onMouseLeave={e=>e.currentTarget.style.border='1px solid var(--sep)'}>
              <Avatar nome={p.contato} size={26}/>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:11.5,fontWeight:700,color:'var(--accent)',margin:'0 0 2px'}}>#{p.numero}</p>
                <p style={{fontSize:11.5,color:'var(--label-2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',margin:'0 0 4px'}}>{p.contato||'—'}</p>
                <CanalBadge canal={getCanal(p)} size={11}/>
              </div>
              <p style={{fontSize:13,fontWeight:700,color:'var(--label)',whiteSpace:'nowrap',margin:0}}>{Rk(p.total)}</p>
            </button>)}
            {colPeds.length===0&&<div style={{padding:'24px',textAlign:'center',color:'var(--label-4)',fontSize:12}}>Nenhum pedido</div>}
            {colPeds.length>15&&<div style={{padding:'10px',textAlign:'center',color:'var(--label-4)',fontSize:12}}>+{colPeds.length-15} mais</div>}
          </div>
        </div>
      })}
    </div>}

    {/* TABELA */}
    {view==='tabela'&&<div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,overflow:'hidden'}}>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'var(--fill)'}}>
              {[['numero','N',true,80],['contato','Cliente',true,210],['total','Total',true,120],['sit','Status',false,130],['canal','Canal',false,160],['compra','Compra',false,95],['data','Data',true,125]].map(([k,lb,sort,w])=>(
                <th key={k} onClick={sort?()=>toggleSort(k):undefined} style={{textAlign:'left',padding:'11px 16px',fontSize:10.5,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em',borderBottom:'1px solid var(--sep)',whiteSpace:'nowrap',cursor:sort?'pointer':'default',userSelect:'none',minWidth:w}}>
                  <div style={{display:'flex',alignItems:'center',gap:4}}>{lb}{sort&&<SortIco col={k}/>}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading?(
              <tr><td colSpan={7} style={{padding:56,textAlign:'center'}}>
                <RefreshCw size={22} style={{color:'var(--accent)',animation:'spin 1s linear infinite',display:'block',margin:'0 auto 12px'}}/>
                <span style={{fontSize:13,color:'var(--label-4)'}}>Carregando pedidos...</span>
              </td></tr>
            ):pgData.length===0?(
              <tr><td colSpan={7} style={{padding:56,textAlign:'center'}}>
                <Package size={32} style={{display:'block',margin:'0 auto 12px',opacity:.2}}/>
                <span style={{fontSize:13,color:'var(--label-4)'}}>Nenhum pedido encontrado</span>
              </td></tr>
            ):pgData.map((p,i)=>{
              const canal=getCanal(p)
              const sitId=getSitId(p)
              const nC=pedidos.filter(x=>x.contato===p.contato&&x.numero<p.numero).length+1
              return <tr key={i} onClick={()=>setSel(p)}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--fill)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}
                style={{borderTop:'1px solid var(--sep)',cursor:'pointer',transition:'background .08s'}}>
                <td style={{padding:'12px 16px'}}><span style={{fontSize:14,fontWeight:800,color:'var(--accent)'}}>#{p.numero}</span></td>
                <td style={{padding:'12px 16px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <Avatar nome={p.contato} size={30}/>
                    <span style={{fontSize:13,color:'var(--label-2)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:170}}>{p.contato||'—'}</span>
                  </div>
                </td>
                <td style={{padding:'12px 16px'}}><span style={{fontSize:14,fontWeight:700,color:'var(--label)'}}>R$ {Number(p.total||0).toFixed(2).replace('.',',')}</span></td>
                <td style={{padding:'12px 16px'}}><StatusPill sitId={sitId}/></td>
                <td style={{padding:'12px 16px'}}><CanalBadge canal={canal}/></td>
                <td style={{padding:'12px 16px'}}>
                  {nC===1
                    ? <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:99,background:'rgba(245,158,11,.12)',color:'#f59e0b',border:'1px solid rgba(245,158,11,.3)'}}><Star size={9} style={{fill:'#f59e0b',strokeWidth:0}}/> 1</span>
                    : <span style={{fontSize:12,color:'var(--label-4)',fontWeight:500}}>{nC}</span>}
                </td>
                <td style={{padding:'12px 16px',color:'var(--label-4)',fontSize:12.5,whiteSpace:'nowrap'}}>{fmtD(p.data)}</td>
              </tr>
            })}
          </tbody>
        </table>
      </div>

      {total>0&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderTop:'1px solid var(--sep)',fontSize:12.5,color:'var(--label-4)'}}>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <span style={{fontWeight:500}}>{inicio+1}&#8211;{Math.min(inicio+POR_PAG,total)} de {total}</span>
          {temMais&&<button onClick={()=>carregar(pgAPI+1,true)} disabled={loadMore} style={{fontSize:12,color:'var(--accent)',border:'1px solid rgba(124,106,247,.3)',background:'rgba(124,106,247,.07)',borderRadius:8,padding:'4px 11px',cursor:'pointer',fontWeight:600}}>{loadMore?'..':'+ 100 pedidos'}</button>}
        </div>
        {totalPgs>1&&<div style={{display:'flex',gap:4,alignItems:'center'}}>
          <button onClick={()=>setPgUI(1)} disabled={pgUI===1} style={{padding:'5px 10px',borderRadius:7,border:'1px solid var(--sep)',background:'transparent',cursor:pgUI===1?'default':'pointer',color:'var(--label-3)',opacity:pgUI===1?.35:1,fontSize:12}}>&#171;</button>
          <button onClick={()=>setPgUI(p=>Math.max(1,p-1))} disabled={pgUI===1} style={{padding:'5px 10px',borderRadius:7,border:'1px solid var(--sep)',background:'transparent',cursor:pgUI===1?'default':'pointer',color:'var(--label-3)',opacity:pgUI===1?.35:1,fontSize:12}}>&#8249;</button>
          {Array.from({length:Math.min(totalPgs,7)},(_,i)=>{
            const pg=totalPgs<=7?i+1:pgUI<=4?i+1:pgUI>=(totalPgs-3)?totalPgs-6+i:pgUI-3+i
            return <button key={pg} onClick={()=>setPgUI(pg)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${pgUI===pg?'var(--accent)':'var(--sep)'}`,background:pgUI===pg?'var(--accent)':'transparent',color:pgUI===pg?'#000':'var(--label-3)',fontSize:12.5,cursor:'pointer',fontWeight:pgUI===pg?700:400}}>{pg}</button>
          })}
          <button onClick={()=>setPgUI(p=>Math.min(totalPgs,p+1))} disabled={pgUI===totalPgs} style={{padding:'5px 10px',borderRadius:7,border:'1px solid var(--sep)',background:'transparent',cursor:pgUI===totalPgs?'default':'pointer',color:'var(--label-3)',opacity:pgUI===totalPgs?.35:1,fontSize:12}}>&#8250;</button>
          <button onClick={()=>setPgUI(totalPgs)} disabled={pgUI===totalPgs} style={{padding:'5px 10px',borderRadius:7,border:'1px solid var(--sep)',background:'transparent',cursor:pgUI===totalPgs?'default':'pointer',color:'var(--label-3)',opacity:pgUI===totalPgs?.35:1,fontSize:12}}>&#187;</button>
        </div>}
      </div>}
    </div>}

    {sel&&<OrderSheet pedRow={sel} onClose={()=>setSel(null)} api={api} allPedidos={pedidos}/>}
  </div>
}
