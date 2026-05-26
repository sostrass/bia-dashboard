import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, RefreshCw, X, Package, ExternalLink, Truck,
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
// ── GatilhosPanel — colapsável, evita hook em IIFE ───────────────────────────
function GatilhosPanel() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{borderRadius:10,border:'1px solid rgba(124,106,247,.2)',overflow:'hidden',marginBottom:16}}>
      <button onClick={() => setOpen(v=>!v)} style={{width:'100%',display:'flex',alignItems:'center',gap:7,padding:'9px 12px',background:'rgba(124,106,247,.04)',border:'none',cursor:'pointer',textAlign:'left'}}>
        <Zap size={12} style={{color:'#7c6af7'}}/>
        <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'#7c6af7',flex:1}}>Gatilhos de automação</span>
        <span style={{fontSize:10,color:'rgba(124,106,247,.6)',background:'rgba(124,106,247,.1)',padding:'1px 7px',borderRadius:99}}>12</span>
        {open ? <ChevronUp size={12} style={{color:'#7c6af7'}}/> : <ChevronDown size={12} style={{color:'#7c6af7'}}/>}
      </button>
      {open && <div style={{padding:'10px 12px',display:'flex',flexWrap:'wrap',gap:5}}>
        {ETAPAS_GATILHO.map(e => (
          <span key={e.id} style={{fontSize:11,fontWeight:500,padding:'3px 9px',borderRadius:99,background:`${e.cor}10`,color:e.cor,border:`1px solid ${e.cor}20`}}>
            {e.icone} {e.label}
          </span>
        ))}
      </div>}
    </div>
  )
}

function OrderSheet({pedRow, onClose, api, allPedidos}) {
  const [det,      setDet]      = useState(null)
  const [load,     setLoad]     = useState(true)
  const [tab,      setTab]      = useState('overview')
  const [sending,  setSend]     = useState(false)
  const [sent,     setSent]     = useState(false)
  const [cp,       setCp]       = useState('')
  const [trackEvs, setTrackEvs] = useState([])
  const [trackSt,  setTrackSt]  = useState(null)
  const [trackLoad,setTLoad]    = useState(false)

  const canal   = getCanal(pedRow)
  const Chi     = CH[canal] || CH.bling
  const sitId   = getSitId(pedRow)
  const sit     = SIT[sitId] || {label:'—', cor:'#888', bg:'var(--fill)', bdr:'var(--sep)'}
  const histLocal = allPedidos.filter(p => p.contato === pedRow.contato && p.numero !== pedRow.numero)
  const nComp   = histLocal.filter(p => p.numero < pedRow.numero).length + 1
  const isNew   = nComp === 1

  const p  = det?.pedido     || {}
  const c  = det?.contato    || {}
  const t  = det?.transporte || {}
  const r  = det?.rastreio   || {}
  const hD = det?.historico  || {}
  const ms = det?.mensagens  || {}
  const end = t.etiqueta || c.enderecoGeral || c.enderecos?.[0] || null
  const cod = r.codigo || null
  const ltv = (hD.gasto ?? (histLocal.reduce((s,p)=>s+Number(p.total||0),0) + Number(pedRow.total||0)))

  useEffect(() => {
    if (!pedRow?.numero) return
    setLoad(true); setDet(null); setTab('overview'); setTrackEvs([]); setTrackSt(null)
    fetch(`${api}/api/dashboard/pedido-completo/${pedRow.numero}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setDet(d); setLoad(false) })
      .catch(() => setLoad(false))
  }, [pedRow?.numero])

  useEffect(() => {
    if (tab !== 'rastreio' || !cod || trackEvs.length > 0) return
    setTLoad(true)
    fetch(`${api}/api/dashboard/rastreio/${cod}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const r0 = d?.resultados?.[0]
        if (r0) { setTrackEvs(r0.eventos || []); setTrackSt(r0.status || null) }
        setTLoad(false)
      }).catch(() => setTLoad(false))
  }, [tab, cod])

  const copy = (v, k) => { navigator.clipboard.writeText(String(v ?? '')); setCp(k); setTimeout(() => setCp(''), 1800) }

  const enviarWA = async () => {
    if (!det) return; setSend(true)
    const nome = (c.nome || pedRow.contato || '').split(' ')[0]
    const itens = (p.itens || []).map(i => `• ${i.descricao?.slice(0,40)} (${i.quantidade}x) — ${R((i.valor||0)*(i.quantidade||1))}`).join('\n')
    const msg = `✅ *Pedido #${pedRow.numero}*\n\nOlá, *${nome}*!\n\n${itens}\n\n💰 *Total: ${R(pedRow.total)}*\n📦 ${sit.label}\n\n_Só Strass 🥰_`
    try {
      const tel = (c.celular || c.telefone || '').replace(/\D/g, '')
      if (tel) await fetch(`${api}/api/dashboard/manual/${tel}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({mensagem:msg}) })
      setSent(true); setTimeout(() => setSent(false), 3000)
    } catch {}
    setSend(false)
  }

  const enviarRastreioWA = async () => {
    if (!cod) return
    const tel = (c.celular || c.telefone || '').replace(/\D/g, '')
    if (!tel) return
    const link = linkRastreio(cod)
    const msg = `📦 *Rastreio #${p.numero || pedRow.numero}*\n\n\`${cod}\`${trackSt ? `\n*${trackSt}*` : ''}\n\n${link}\n\n_Só Strass 🥰_`
    try { await fetch(`${api}/api/dashboard/manual/${tel}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({mensagem:msg}) }) } catch {}
  }

  // ── Tiny atoms ────────────────────────────────────────────────────────────
  const Lbl = ({children}) => (
    <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)'}}>{children}</span>
  )

  const Row = ({label, value, mono, cor, onCopy}) => {
    if (!value && value !== 0) return null
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--sep)'}}>
        <span style={{fontSize:12,color:'var(--label-4)',flexShrink:0,minWidth:120}}>{label}</span>
        <div style={{display:'flex',alignItems:'center',gap:6,minWidth:0}}>
          <span style={{fontSize:12.5,fontWeight:500,color:cor||'var(--label)',fontFamily:mono?'monospace':'inherit',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{value}</span>
          {onCopy && <button onClick={onCopy} style={{flexShrink:0,display:'flex',alignItems:'center',gap:2,padding:'1px 5px',borderRadius:4,border:'1px solid var(--sep)',background:'transparent',color:cp===label?'#22c55e':'var(--label-4)',cursor:'pointer',fontSize:9}}>
            {cp===label?<><Check size={8}/>ok</>:<><Copy size={8}/>copiar</>}
          </button>}
        </div>
      </div>
    )
  }

  const TABS = [
    {id:'overview', label:'Pedido'},
    {id:'cliente',  label:'Cliente'},
    {id:'rastreio', label:'Rastreio'},
    {id:'historico',label:`Histórico (${hD.total ?? histLocal.length})`},
    {id:'msgs',     label:'Msgs'},
  ]

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (load) return <>
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:40,backdropFilter:'blur(5px)'}}/>
    <div style={{position:'fixed',top:0,right:0,bottom:0,width:560,zIndex:50,background:'var(--bg-2)',borderLeft:'1px solid var(--sep)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:14}}>
      <div style={{width:40,height:40,borderRadius:'50%',border:'3px solid var(--sep)',borderTopColor:sit.cor,animation:'spin 1s linear infinite'}}/>
      <span style={{fontSize:12,color:'var(--label-4)'}}>#{pedRow.numero}</span>
    </div>
  </>

  return <>
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:40,backdropFilter:'blur(5px)'}}/>

    <div style={{
      position:'fixed', top:0, right:0, bottom:0, width:560, zIndex:50,
      background:'var(--bg-2)', borderLeft:'1px solid var(--sep)',
      display:'flex', flexDirection:'column', overflow:'hidden',
      boxShadow:'-20px 0 80px rgba(0,0,0,.35)'
    }}>

      {/* Accent stripe */}
      <div style={{height:2.5, background:`linear-gradient(90deg,${sit.cor},${Chi.cor})`, flexShrink:0}}/>

      {/* ── HEADER compacto ───────────────────────────────────────────────── */}
      <div style={{padding:'14px 20px 0', flexShrink:0, borderBottom:'1px solid var(--sep)'}}>

        {/* Linha 1: número + badges + fechar */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
          <span style={{fontSize:22,fontWeight:800,color:'var(--label)',letterSpacing:'-1px',lineHeight:1}}>#{pedRow.numero}</span>
          <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11.5,fontWeight:700,padding:'3px 10px',borderRadius:99,background:sit.bg,color:sit.cor,border:`1px solid ${sit.bdr}`}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:sit.cor,display:'inline-block'}}/>
            {sit.label}
          </span>
          {isNew && <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:99,background:'rgba(245,158,11,.1)',color:'#f59e0b',border:'1px solid rgba(245,158,11,.25)'}}>⭐ 1ª</span>}
          <div style={{flex:1}}/>
          {/* Links rápidos inline no header */}
          {p.linkBling && <a href={p.linkBling} target="_blank" rel="noreferrer" title="Ver no Bling"
            style={{display:'flex',alignItems:'center',padding:'4px 8px',borderRadius:7,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-4)',textDecoration:'none',fontSize:11,gap:4,fontWeight:500}}>
            <ExternalLink size={10}/> Bling
          </a>}
          {p.notaFiscal && <a href={`https://www.bling.com.br/notas-fiscais/${p.notaFiscal.id}`} target="_blank" rel="noreferrer" title="Nota Fiscal"
            style={{display:'flex',alignItems:'center',padding:'4px 8px',borderRadius:7,border:'1px solid rgba(34,197,94,.3)',background:'rgba(34,197,94,.07)',color:'#22c55e',textDecoration:'none',fontSize:11,gap:4,fontWeight:600}}>
            <FileText size={10}/> NF
          </a>}
          {c.linkBling && <a href={c.linkBling} target="_blank" rel="noreferrer" title="Cadastro do cliente"
            style={{display:'flex',alignItems:'center',padding:'4px 8px',borderRadius:7,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-4)',textDecoration:'none',fontSize:11,gap:4,fontWeight:500}}>
            <Users size={10}/> Cliente
          </a>}
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-4)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <X size={13}/>
          </button>
        </div>

        {/* Linha 2: canal + data + rastreio + valor */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          <CanalBadge canal={canal} size={13}/>
          <span style={{fontSize:11.5,color:'var(--label-4)'}}>{fmtDT(pedRow.data)}</span>
          {cod && <TraspBadge codigo={cod}/>}
          <div style={{flex:1}}/>
          <span style={{fontSize:18,fontWeight:800,color:'var(--accent)',letterSpacing:'-.3px'}}>{R(pedRow.total)}</span>
        </div>

        {/* Linha 3: métricas inline (sem cards pesados) */}
        <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:12,paddingBottom:12,borderBottom:'1px solid var(--sep)'}}>
          {[
            {l:'Compra', v:`${hD.nCompra ?? nComp}ª`, c:isNew?'#f59e0b':'var(--label-3)'},
            {l:'Pedidos', v:fmt(hD.total ?? (histLocal.length+1)), c:'var(--label-3)'},
            {l:'LTV', v:R(ltv), c:'var(--label-3)'},
          ].map(k => (
            <div key={k.l} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
              <span style={{fontSize:13,fontWeight:700,color:k.c,lineHeight:1}}>{k.v}</span>
              <span style={{fontSize:9.5,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em'}}>{k.l}</span>
            </div>
          ))}
          {p.numeroLoja && <>
            <div style={{width:1,height:28,background:'var(--sep)'}}/>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <Tag size={10} style={{color:'var(--label-4)'}}/>
              <span style={{fontSize:11,fontFamily:'monospace',color:'var(--label-4)'}}>{p.numeroLoja}</span>
            </div>
          </>}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:0,marginBottom:-1}}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{padding:'7px 14px',fontSize:12.5,fontWeight:tab===t.id?600:400,border:'none',borderBottom:`2px solid ${tab===t.id?'var(--accent)':'transparent'}`,background:'transparent',cursor:'pointer',color:tab===t.id?'var(--accent)':'var(--label-4)',whiteSpace:'nowrap',flexShrink:0,transition:'color .1s'}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTEÚDO ──────────────────────────────────────────────────────── */}
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>

        {/* ── PEDIDO (overview) ─────────────────────────────────────────── */}
        {tab === 'overview' && <>

          {/* Progress — horizontal compacto */}
          <ProgressSteps sitId={sitId} dataPedido={pedRow.data||p.data} dataSaida={p.dataSaida}/>
          <div style={{height:16}}/>

          {/* Financeiro — tabela limpa sem cards */}
          <Lbl>Financeiro</Lbl>
          <div style={{marginTop:6,marginBottom:16}}>
            {p.formaPagamento && p.formaPagamento !== '—' &&
              <Row label="Pagamento" value={p.formaPagamento}/>}
            <Row label="Frete" value={t.frete > 0 ? R(t.frete) : 'Grátis'} cor={t.frete > 0 ? 'var(--label)' : '#22c55e'}/>
            {p.totalDesconto > 0 && <Row label="Desconto" value={`- ${R(p.totalDesconto)}`} cor="#22c55e"/>}
            <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',marginTop:2}}>
              <span style={{fontSize:13,fontWeight:700,color:'var(--label)'}}>Total</span>
              <span style={{fontSize:16,fontWeight:800,color:'var(--accent)'}}>{R(pedRow.total)}</span>
            </div>
          </div>

          {/* Itens — lista densa */}
          {(p.itens||[]).length > 0 && <>
            <Lbl>Itens ({p.itens.length})</Lbl>
            <div style={{marginTop:6,marginBottom:16}}>
              {p.itens.map((item, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:i<p.itens.length-1?'1px solid var(--sep)':'none'}}>
                  <div style={{width:34,height:34,borderRadius:8,background:'var(--fill)',border:'1px solid var(--sep)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Package2 size={14} style={{color:'var(--label-4)'}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12.5,fontWeight:600,color:'var(--label)',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.descricao}</p>
                    <p style={{fontSize:11,color:'var(--label-4)',margin:0,fontFamily:'monospace'}}>{item.codigo} · {item.quantidade}× · {R(item.valor)}</p>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--label)',flexShrink:0}}>{R((item.valor||0)*(item.quantidade||1))}</span>
                </div>
              ))}
            </div>
          </>}

          {/* Gatilhos — sub-componente colapsável */}
          <GatilhosPanel/>

          {/* Obs */}
          {(p.observacoes||p.observacoesInt) && <>
            <Lbl>Observações</Lbl>
            <div style={{marginTop:6,marginBottom:16}}>
              {p.observacoes && <p style={{fontSize:12.5,color:'var(--label-2)',lineHeight:1.6,margin:'0 0 6px'}}>{p.observacoes}</p>}
              {p.observacoesInt && <p style={{fontSize:12,color:'var(--label-4)',background:'var(--fill)',padding:'7px 10px',borderRadius:8,margin:0}}>🔒 {p.observacoesInt}</p>}
            </div>
          </>}
        </>}

        {/* ── CLIENTE ───────────────────────────────────────────────────── */}
        {tab === 'cliente' && <>
          {/* Perfil compacto */}
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,padding:'12px 14px',borderRadius:10,background:'var(--fill)',border:'1px solid var(--sep)'}}>
            <Avatar nome={c.nome||pedRow.contato} size={44}/>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:15,fontWeight:700,color:'var(--label)',margin:'0 0 3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.nome||pedRow.contato||'—'}</p>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {c.fantasia?.trim() && <span style={{fontSize:11,color:'var(--label-4)',fontStyle:'italic'}}>{c.fantasia.trim()}</span>}
                <span style={{fontSize:11,color:'var(--label-4)'}}>{c.tipo==='J'?'PJ':'PF'}</span>
                {isNew && <span style={{fontSize:10.5,fontWeight:600,padding:'1px 7px',borderRadius:99,background:'rgba(245,158,11,.1)',color:'#f59e0b'}}>1ª compra</span>}
              </div>
            </div>
            {c.linkBling && <a href={c.linkBling} target="_blank" rel="noreferrer"
              style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-4)',textDecoration:'none',fontSize:11,flexShrink:0}}>
              <ExternalLink size={10}/> Bling
            </a>}
          </div>

          {/* Dados de contato — tabela limpa */}
          <Lbl>Contato</Lbl>
          <div style={{marginTop:6,marginBottom:16}}>
            <Row label="Celular"   value={c.celular||c.telefone} mono onCopy={() => copy(c.celular||c.telefone,'Celular')}/>
            <Row label="Email"     value={c.email}               mono onCopy={() => copy(c.email,'Email')}/>
            <Row label="CPF/CNPJ"  value={c.cpfCnpj||c.numeroDocumento} mono onCopy={() => copy(c.cpfCnpj||c.numeroDocumento,'CPF/CNPJ')}/>
            {c.ie && <Row label="IE" value={c.ie} mono/>}
          </div>

          {/* Endereço */}
          {end && <>
            <Lbl>Endereço de entrega</Lbl>
            <div style={{marginTop:6,marginBottom:16,fontSize:13,color:'var(--label)',lineHeight:1.9}}>
              <div>{end.logradouro||end.endereco||'—'}, {end.numero||''}{end.complemento?` — ${end.complemento}`:''}</div>
              <div style={{color:'var(--label-3)'}}>{end.bairro}{end.municipio?` · ${end.municipio}`:''}{end.uf?`/${end.uf}`:''}</div>
              {end.cep && <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                <span style={{fontSize:12,fontFamily:'monospace',color:'var(--accent)'}}>{fmtCEP(end.cep)}</span>
                <button onClick={() => copy(`${end.logradouro||end.endereco}, ${end.numero} - ${end.bairro}, ${end.municipio}/${end.uf}, CEP ${fmtCEP(end.cep)}`,'end')}
                  style={{fontSize:10,display:'flex',alignItems:'center',gap:3,padding:'1px 7px',borderRadius:4,border:'1px solid var(--sep)',background:'transparent',color:cp==='end'?'#22c55e':'var(--label-4)',cursor:'pointer'}}>
                  {cp==='end'?<><Check size={8}/> Copiado</>:<><Copy size={8}/> Copiar</>}
                </button>
              </div>}
            </div>
          </>}

          {/* Stats LTV */}
          <Lbl>Histórico de compras</Lbl>
          <div style={{display:'flex',gap:12,marginTop:8,padding:'12px 14px',borderRadius:10,background:'var(--fill)',border:'1px solid var(--sep)'}}>
            {[
              {l:'Pedidos', v:fmt(hD.total ?? (histLocal.length+1)), c:'var(--accent)'},
              {l:'LTV total', v:R(ltv), c:'var(--label)'},
              {l:'Ticket médio', v:R(ltv/Math.max(hD.total??(histLocal.length+1),1)), c:'var(--label-3)'},
              {l:'Esta compra', v:`${hD.nCompra??nComp}ª`, c:isNew?'#f59e0b':'var(--label-3)'},
            ].map(k => (
              <div key={k.l} style={{flex:1,textAlign:'center'}}>
                <div style={{fontSize:14,fontWeight:700,color:k.c,lineHeight:1,marginBottom:3}}>{k.v}</div>
                <div style={{fontSize:9.5,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em'}}>{k.l}</div>
              </div>
            ))}
          </div>
        </>}

        {/* ── RASTREIO ──────────────────────────────────────────────────── */}
        {tab === 'rastreio' && <>
          {cod ? <>
            {/* Enviar WA */}
            <button onClick={enviarRastreioWA} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'10px 14px',borderRadius:10,border:'1px solid rgba(37,211,102,.25)',background:'rgba(37,211,102,.05)',color:'#25D366',cursor:'pointer',fontSize:12.5,fontWeight:600,marginBottom:14}}>
              <MessageSquare size={14}/> Enviar rastreio no WhatsApp
              {r.msgEnviada && <span style={{marginLeft:'auto',fontSize:10.5,color:'rgba(37,211,102,.6)'}}>✓ {r.qtdMsgRastreio}x</span>}
            </button>

            {/* Código */}
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',borderRadius:9,background:'var(--fill)',border:'1px solid var(--sep)',marginBottom:10}}>
              <Truck size={13} style={{color:'var(--accent)',flexShrink:0}}/>
              <span style={{fontSize:13,fontFamily:'monospace',fontWeight:700,color:'var(--accent)',flex:1,letterSpacing:'.04em'}}>{cod}</span>
              <TraspBadge codigo={cod}/>
              <button onClick={() => copy(cod,'cod')} style={{display:'flex',alignItems:'center',gap:3,padding:'2px 7px',borderRadius:5,border:'1px solid var(--sep)',background:'transparent',color:cp==='cod'?'#22c55e':'var(--label-4)',cursor:'pointer',fontSize:10}}>
                {cp==='cod'?<><Check size={8}/>ok</>:<><Copy size={8}/>copiar</>}
              </button>
              <a href={linkRastreio(cod)} target="_blank" rel="noreferrer"
                style={{display:'flex',alignItems:'center',gap:3,padding:'2px 7px',borderRadius:5,border:'1px solid rgba(74,159,255,.3)',background:'rgba(74,159,255,.07)',color:'#4a9fff',textDecoration:'none',fontSize:10,fontWeight:600}}>
                <ExternalLink size={9}/> Ver
              </a>
            </div>

            {/* Status atual */}
            {(trackSt||r.status) && <div style={{display:'flex',alignItems:'center',gap:7,padding:'8px 12px',borderRadius:8,background:'rgba(0,212,170,.06)',border:'1px solid rgba(0,212,170,.15)',marginBottom:12}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:'#00d4aa',boxShadow:'0 0 0 3px rgba(0,212,170,.2)',flexShrink:0,display:'inline-block'}}/>
              <span style={{fontSize:12.5,fontWeight:600,color:'#00d4aa'}}>{trackSt||r.status}</span>
            </div>}

            {/* Timeline */}
            {trackLoad && <div style={{display:'flex',alignItems:'center',gap:8,padding:'16px',color:'var(--label-4)',fontSize:12}}>
              <RefreshCw size={13} style={{animation:'spin 1s linear infinite',color:'var(--accent)'}}/> Consultando...
            </div>}
            {!trackLoad && trackEvs.length === 0 && <div style={{padding:'24px',textAlign:'center',color:'var(--label-4)',fontSize:12,borderRadius:9,border:'1px dashed var(--sep)'}}>
              <Clock size={20} style={{display:'block',margin:'0 auto 8px',opacity:.25}}/> Sem movimentações ainda
            </div>}
            {trackEvs.length > 0 && <div style={{position:'relative',paddingLeft:18}}>
              <div style={{position:'absolute',left:6,top:6,bottom:6,width:1.5,background:'var(--sep)',borderRadius:99}}/>
              {trackEvs.map((ev, i) => (
                <div key={i} style={{position:'relative',paddingLeft:18,paddingBottom:i<trackEvs.length-1?12:0}}>
                  <div style={{position:'absolute',left:-4,top:4,width:11,height:11,borderRadius:'50%',background:i===0?'var(--accent)':'var(--fill)',border:`1.5px solid ${i===0?'var(--accent)':'var(--sep)'}`,zIndex:1}}/>
                  <p style={{fontSize:12.5,fontWeight:i===0?600:400,color:i===0?'var(--label)':'var(--label-3)',margin:'0 0 2px',lineHeight:1.3}}>{ev.status}</p>
                  {ev.detalhe && <p style={{fontSize:11,color:'var(--label-4)',margin:'0 0 1px'}}>{ev.detalhe}</p>}
                  {ev.local && <p style={{fontSize:11,color:'var(--label-4)',margin:'0 0 1px',display:'flex',alignItems:'center',gap:3}}><MapPin size={8}/>{ev.local}</p>}
                  <p style={{fontSize:10.5,color:'var(--label-4)',margin:0,fontFamily:'monospace',opacity:.7}}>{ev.data?fmtDT(ev.data):''}</p>
                </div>
              ))}
            </div>}
          </> : (
            <div style={{padding:'48px',textAlign:'center',color:'var(--label-4)'}}>
              <Truck size={32} style={{display:'block',margin:'0 auto 12px',opacity:.15}}/>
              <p style={{fontSize:13,margin:0,color:'var(--label-3)'}}>Sem código de rastreio</p>
              <p style={{fontSize:11,margin:'5px 0 0',opacity:.6}}>Aparece após a postagem</p>
            </div>
          )}
        </>}

        {/* ── HISTÓRICO ─────────────────────────────────────────────────── */}
        {tab === 'historico' && (
          (hD.pedidos||histLocal).length > 0 ? <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span style={{fontSize:12.5,color:'var(--label-3)'}}>{hD.total??histLocal.length} pedidos anteriores</span>
              <span style={{fontSize:12.5,fontWeight:700,color:'var(--accent)'}}>{R(hD.gasto ?? histLocal.reduce((s,p)=>s+Number(p.total||0),0))}</span>
            </div>
            {[...(hD.pedidos||histLocal)].sort((a,b)=>b.numero-a.numero).map((hp,i) => {
              const hSit = SIT[hp.situacaoId||getSitId(hp)] || {label:'—',cor:'#888',bg:'var(--fill)',bdr:'var(--sep)'}
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid var(--sep)'}}>
                  <span style={{fontSize:12,fontWeight:700,color:'var(--accent)',fontFamily:'monospace',flexShrink:0,minWidth:60}}>#{hp.numero}</span>
                  <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:99,background:hSit.bg,color:hSit.cor,border:`1px solid ${hSit.bdr}`,flexShrink:0}}>
                    <span style={{width:5,height:5,borderRadius:'50%',background:hSit.cor,display:'inline-block'}}/>{hSit.label}
                  </span>
                  <CanalBadge canal={hp.canal||getCanal(hp)} size={11}/>
                  <span style={{fontSize:11.5,color:'var(--label-4)',flex:1}}>{fmtD(hp.data)}</span>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--label)',flexShrink:0}}>{R(hp.total)}</span>
                </div>
              )
            })}
          </> : (
            <div style={{padding:'48px',textAlign:'center'}}>
              <Star size={28} style={{display:'block',margin:'0 auto 12px',color:'#f59e0b',opacity:.35}}/>
              <p style={{fontSize:14,fontWeight:600,color:'var(--label)',margin:'0 0 4px'}}>Primeira compra</p>
              <p style={{fontSize:12,color:'var(--label-4)',margin:0}}>Nenhum pedido anterior</p>
            </div>
          )
        )}

        {/* ── MENSAGENS ─────────────────────────────────────────────────── */}
        {tab === 'msgs' && (
          (ms.lista||[]).length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {ms.lista.slice(0,40).map((m,i) => {
                const entrada = m.direcao === 'entrada'
                return (
                  <div key={i} style={{display:'flex',gap:8,alignItems:'flex-end',flexDirection:entrada?'row':'row-reverse'}}>
                    <div style={{width:26,height:26,borderRadius:'50%',background:entrada?'var(--fill)':'var(--accent-dim)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {entrada?<Users size={11} style={{color:'var(--label-4)'}}/>:<Zap size={11} style={{color:'var(--accent)'}}/>}
                    </div>
                    <div style={{maxWidth:'78%',background:entrada?'var(--bg)':'var(--accent-dim)',borderRadius:entrada?'12px 12px 12px 3px':'12px 12px 3px 12px',padding:'8px 11px',border:`1px solid ${entrada?'var(--sep)':'var(--accent)25'}`}}>
                      <div style={{display:'flex',justifyContent:entrada?'flex-start':'flex-end',marginBottom:3}}>
                        <span style={{fontSize:10,color:entrada?'var(--label-4)':'var(--accent)',fontWeight:600}}>{entrada?'Cliente':'Bia'}</span>
                        <span style={{fontSize:10,color:'var(--label-4)',marginLeft:7,fontFamily:'monospace'}}>{fmtDT(m.criado_em)}</span>
                      </div>
                      <p style={{fontSize:12.5,color:'var(--label-2)',margin:0,lineHeight:1.5,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{(m.conteudo||'').slice(0,400)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{padding:'48px',textAlign:'center',color:'var(--label-4)'}}>
              <MessageSquare size={28} style={{display:'block',margin:'0 auto 12px',opacity:.15}}/>
              <p style={{fontSize:13,margin:0,color:'var(--label-3)'}}>Sem mensagens</p>
            </div>
          )
        )}

      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <div style={{flexShrink:0,borderTop:'1px solid var(--sep)',padding:'12px 20px',display:'flex',gap:7,background:'var(--bg-2)'}}>
        <button onClick={enviarWA} disabled={sending||!det}
          style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'10px',borderRadius:10,border:`1px solid ${sent?'rgba(34,197,94,.35)':'rgba(37,211,102,.3)'}`,background:sent?'rgba(34,197,94,.08)':'rgba(37,211,102,.06)',color:sent?'#22c55e':'#25D366',cursor:det?'pointer':'not-allowed',fontSize:13,fontWeight:700,opacity:!det?.5:1}}>
          {sent?<><CheckCircle size={15}/> Enviado!</>:sending?<><RefreshCw size={14} style={{animation:'spin 1s linear infinite'}}/> Enviando...</>:<><MessageSquare size={15}/> Enviar no WhatsApp</>}
        </button>
        {cod && <a href={linkRastreio(cod)} target="_blank" rel="noreferrer"
          style={{display:'flex',alignItems:'center',gap:6,padding:'10px 13px',borderRadius:10,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-3)',fontSize:12.5,textDecoration:'none',fontWeight:600,whiteSpace:'nowrap'}}>
          <Truck size={13}/> Rastrear
        </a>}
        {p.linkBling && <a href={p.linkBling} target="_blank" rel="noreferrer"
          style={{display:'flex',alignItems:'center',gap:6,padding:'10px 13px',borderRadius:10,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-3)',fontSize:12.5,textDecoration:'none',fontWeight:600,whiteSpace:'nowrap'}}>
          <ExternalLink size={13}/> Bling
        </a>}
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
