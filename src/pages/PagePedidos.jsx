/**
 * PagePedidos.jsx — Bia v6 Enterprise
 * Central de Pedidos — Command Center completo para agente de atendimento
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  ShoppingCart, Clock, CheckCircle, TrendingUp, TrendingDown,
  AlertTriangle, Search, Filter, X, ChevronDown, ChevronUp,
  RefreshCw, Download, Send, Copy, Check, ExternalLink,
  Package, Truck, FileText, MessageSquare, Star, Crown,
  AlertCircle, BarChart3, Activity, ChevronLeft, ChevronRight,
  Bell, Zap, Users, MapPin, CreditCard, Phone, ArrowUpRight,
  ArrowDownRight, Eye, Circle, Navigation, Hash, Calendar,
  Info, DollarSign, Box, Layers, Timer, Award, Map,
  ShieldCheck, Building, Globe, Percent, Target,
  ShoppingBag, MessageCircle, GripVertical, Settings, History, Route, Brain,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'

// ─── LOGOS SVG REAIS DOS MARKETPLACES ─────────────────────────────────────────
const LogoShopee=({size=14})=><svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#EE4D2D"/><path d="M8.5 10.5c0-1.933 1.567-3.5 3.5-3.5s3.5 1.567 3.5 3.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none"/><rect x="6.5" y="10.5" width="11" height="7" rx="1.5" fill="#fff" opacity=".95"/><circle cx="9.5" cy="14" r="1" fill="#EE4D2D"/><circle cx="14.5" cy="14" r="1" fill="#EE4D2D"/></svg>
const LogoML=({size=14})=><svg width={size} height={size} viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="10" fill="#FFE600"/><path d="M7 12.5c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#333" strokeWidth="1.6" strokeLinecap="round" fill="none"/><circle cx="12" cy="14.5" r="2" fill="#333"/></svg>
const LogoShein=({size=14})=><svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#000"/><text x="12" y="9.5" textAnchor="middle" fontSize="4.5" fill="#fff" fontWeight="bold">SHEIN</text><path d="M7 13.5c.5-2 2-3.5 4-3.5s3.2 1.2 3 3c-.2 1.5-1.5 2.5-3 2.5-1 0-1.8-.5-2-1.5" stroke="#e91e8c" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg>
const LogoTikTok=({size=14})=><svg width={size} height={size} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#010101"/><path d="M14.5 7.5c.9.7 2 1.1 3.2 1.1V6.4c-.7 0-1.3-.2-1.8-.5v6.5c0 2.5-2 4.6-4.4 4.6S7.1 14.9 7.1 12.4s2-4.6 4.4-4.6V4.6C8.2 4.6 5.5 7.3 5.5 11.7s2.7 6.1 6 6.1 6-2.7 6-6.1V7.5z" fill="#25F4EE"/><path d="M13.5 6.5c.9.7 2 1.1 3.2 1.1V5.4c-.7 0-1.3-.2-1.8-.5v6.5c0 2.5-2 4.6-4.4 4.6S6.1 13.9 6.1 11.4s2-4.6 4.4-4.6V4.6C7.2 4.6 4.5 7.3 4.5 10.7s2.7 6.1 6 6.1 6-2.7 6-6.1V6.5z" fill="#FE2C55" opacity=".7"/></svg>
const LogoNuvemshop=({size=14})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#9B51E0"/><path d="M7.5 14.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="14.5" r="1.5" fill="#fff"/></svg>
const LogoLoja=({size=14})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#22c55e" strokeWidth="1.5" fill="rgba(34,197,94,.2)" strokeLinejoin="round"/><path d="M9 22V12h6v10" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round"/></svg>
const LogoBling=({size=14})=><svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1176AE"/><text x="12" y="16" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">B</text></svg>
const CANAL_LOGO = {shopee:LogoShopee,mercadolivre:LogoML,shein:LogoShein,tiktokshop:LogoTikTok,nuvemshop:LogoNuvemshop,loja:LogoLoja,bling:LogoBling}

// ─── MAPAS ────────────────────────────────────────────────────────────────────
const LOJA_ID = {
  205946980:'shopee', 203414926:'mercadolivre', 204884434:'shein',
  205916963:'tiktokshop', 205693668:'nuvemshop', 0:'loja',
}
const CANAL_CFG = {
  shopee:       {label:'Shopee',       cor:'#ee4d2d', Logo:LogoShopee},
  mercadolivre: {label:'Mercado Livre',cor:'#ffe600', Logo:LogoML},
  shein:        {label:'Shein',        cor:'#e91e8c', Logo:LogoShein},
  tiktokshop:   {label:'TikTok',       cor:'#25f4ee', Logo:LogoTikTok},
  nuvemshop:    {label:'Nuvemshop',    cor:'#9b51e0', Logo:LogoNuvemshop},
  loja:         {label:'Loja Própria', cor:'#22c55e', Logo:LogoLoja},
  bling:        {label:'Bling/Manual', cor:'#60a5fa', Logo:LogoBling},
}
const SIT = {
  6:  {label:'Em Aberto',  cor:'#f59e0b', bg:'rgba(245,158,11,.12)', bdr:'rgba(245,158,11,.3)'},
  9:  {label:'Atendido',   cor:'#4a9fff', bg:'rgba(74,159,255,.12)', bdr:'rgba(74,159,255,.3)'},
  12: {label:'Cancelado',  cor:'#ef4444', bg:'rgba(239,68,68,.12)',  bdr:'rgba(239,68,68,.3)'},
  15: {label:'Verificado', cor:'#22c55e', bg:'rgba(34,197,94,.12)',  bdr:'rgba(34,197,94,.3)'},
}
// Colunas disponíveis na listagem (toggle + arrastar ordem; salvas no backend)
const COLUNAS_DISP = [
  {id:'numero',    label:'Número da venda', largura:'80px'},
  {id:'serie',     label:'Série',           largura:'60px'},
  {id:'data',      label:'Data de emissão', largura:'90px'},
  {id:'dataSaida', label:'Data de saída',   largura:'90px'},
  {id:'produto',   label:'Produtos',        largura:'100px'},
  {id:'contato',   label:'Nome',            largura:'1fr'},
  {id:'documento', label:'CPF/CNPJ',        largura:'120px'},
  {id:'natureza',  label:'Natureza op.',    largura:'110px'},
  {id:'uf',        label:'UF',              largura:'45px'},
  {id:'canal',     label:'Canal',           largura:'100px'},
  {id:'status',    label:'Status',          largura:'85px'},
  {id:'transp',    label:'Transportadora',  largura:'110px'},
  {id:'rastreio',  label:'Nº Rastreio',     largura:'130px'},
  {id:'total',     label:'Valor (R$)',      largura:'90px'},
]
// Config padrão (caso não haja nada salvo no backend)
const COLUNAS_PADRAO = {
  ordem: ['numero','data','produto','contato','canal','status','total','rastreio'],
  ativas: {numero:true,data:true,produto:true,contato:true,canal:true,status:true,total:true,rastreio:true},
}
const RFM = {
  vip:      {label:'VIP',      icon:Crown,      cor:'#f59e0b', bg:'rgba(245,158,11,.15)'},
  fiel:     {label:'Fiel',     icon:Star,       cor:'#22c55e', bg:'rgba(34,197,94,.15)'},
  novo:     {label:'Novo',     icon:Zap,        cor:'#06b6d4', bg:'rgba(6,182,212,.15)'},
  em_risco: {label:'Em Risco', icon:AlertTriangle,cor:'#f97316',bg:'rgba(249,115,22,.15)'},
  perdido:  {label:'Perdido',  icon:Clock,      cor:'#6b7280', bg:'rgba(107,114,128,.15)'},
}

function getCanal(p) {
  const lid = p.lojaId ?? p.loja?.id ?? 0
  return LOJA_ID[lid] ?? (p.canal || 'bling')
}
function getSitId(p) {
  return typeof p.situacao==='object'
    ? p.situacao?.id ?? p.situacao?.valor
    : p.situacaoId ?? p.situacao
}
function fmt(v) {
  return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}
function fmtD(d) {
  if (!d || d==='0000-00-00' || d==='0000-00-00 00:00:00') return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''  // data inválida → não mostra (evita "Invalid Date")
  return dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})
}
function fmtDH(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
}
function calcRFM(hist) {
  if (!hist?.length) return 'novo'
  const total = hist.reduce((s,p)=>s+parseFloat(p.total||0),0)
  const dias = (Date.now()-new Date(hist[0]?.data||Date.now()).getTime())/(86400000)
  if (hist.length>=5 && total>=3000) return 'vip'
  if (hist.length>=3) return 'fiel'
  if (dias>90) return hist.length>=2?'em_risco':'perdido'
  return 'novo'
}

// ─── ATOMS ────────────────────────────────────────────────────────────────────
function Pill({label,cor,bg,bdr,sz=10}) {
  return <span style={{fontSize:sz,fontWeight:700,padding:'2px 8px',borderRadius:99,
    color:cor,background:bg,border:`1px solid ${bdr||cor+'33'}`,whiteSpace:'nowrap',flexShrink:0}}>{label}</span>
}
function CanalBadge({canal,small}) {
  const c = CANAL_CFG[canal]||CANAL_CFG.bling
  const Ic = c.icon
  return <span style={{fontSize:small?9:10,fontWeight:700,padding:small?'1px 5px':'2px 8px',
    borderRadius:99,color:c.cor,background:c.cor+'18',whiteSpace:'nowrap',flexShrink:0,
    display:'inline-flex',alignItems:'center',gap:3}}>
    <Ic size={small?8:10}/>{c.label}</span>
}
function Cp({val,label}) {
  const [ok,setOk]=useState(false)
  return <button onClick={()=>{navigator.clipboard?.writeText(String(val||''));setOk(true);setTimeout(()=>setOk(false),1500)}}
    style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:6,
      border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-3)',cursor:'pointer',fontSize:11}}>
    {ok?<Check size={11} style={{color:'#22c55e'}}/>:<Copy size={11}/>}{label||'Copiar'}
  </button>
}
function Spark({data=[],cor='#7c6af7'}) {
  const max=Math.max(...data,1)
  return <div style={{display:'flex',alignItems:'flex-end',gap:2,height:28}}>
    {data.map((v,i)=>{
      const isLast=i===data.length-1
      return <div key={i} style={{width:4,borderRadius:2,
        height:`${Math.max(4,(v/max)*28)}px`,
        background:isLast?cor:`${cor}55`,
        boxShadow:isLast?`0 0 7px ${cor}90`:'none',
        transition:'height .3s'}}/>
    })}
  </div>
}

// ─── PRODUCT THUMB ──────────────────────────────────────────────────────────
function ProductThumb({item,size=28}) {
  const name=(item?.descricao||item?.nome||'').slice(0,4).toUpperCase()
  const colors=['#7c6af7','#06b6d4','#22c55e','#f59e0b','#f97316','#a78bfa']
  const cor=colors[(name.charCodeAt(0)||0)%colors.length]
  const [err,setErr]=useState(false)
  if(item?.foto&&!err)return <img src={item.foto} alt={name} onError={()=>setErr(true)}
    style={{width:size,height:size,borderRadius:5,objectFit:'cover',flexShrink:0,border:'0.5px solid var(--sep)'}}/>
  return <div style={{width:size,height:size,borderRadius:5,flexShrink:0,
    background:`${cor}18`,border:`0.5px solid ${cor}35`,
    display:'flex',alignItems:'center',justifyContent:'center',
    fontSize:size>26?8:7,fontWeight:700,color:cor}}>{name.slice(0,4)||'?'}</div>
}
const TT = {contentStyle:{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:8,fontSize:11,color:'var(--label)'}}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KCard({icon:Ic,label,value,sub,cor='#7c6af7',trend,spark,alert}) {
  return <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,
    padding:'14px 16px',display:'flex',flexDirection:'column',gap:8,position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',top:0,right:0,width:80,height:80,
      background:`radial-gradient(circle at 100% 0%, ${cor}15 0%, transparent 70%)`,pointerEvents:'none'}}/>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
      <div style={{width:32,height:32,borderRadius:9,background:`${cor}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Ic size={15} style={{color:cor}}/>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        {trend!==undefined&&<div style={{display:'flex',alignItems:'center',gap:3,fontSize:11,fontWeight:600,
          color:trend>=0?'#22c55e':'#ef4444'}}>
          {trend>=0?<ArrowUpRight size={12}/>:<ArrowDownRight size={12}/>}{Math.abs(trend)}%
        </div>}
        {alert&&<Bell size={12} style={{color:'#f59e0b'}}/>}
      </div>
    </div>
    <div>
      <div style={{fontSize:22,fontWeight:700,color:'var(--label)',lineHeight:1.1}}>{value}</div>
      <div style={{fontSize:11,color:'var(--label-4)',marginTop:2}}>{label}</div>
      {sub&&<div style={{fontSize:10,color:'var(--label-4)',marginTop:1}}>{sub}</div>}
    </div>
    {spark&&<Spark data={spark} cor={cor}/>}
  </div>
}

// ─── ALERT BAR ────────────────────────────────────────────────────────────────
function AlertBar({pedidos}) {
  const alerts = useMemo(()=>{
    const semEnvio = pedidos.filter(p=>{
      const sit = getSitId(p); const dias=(Date.now()-new Date(p.data||0).getTime())/86400000
      return sit===9 && dias>3 && !p.codigoRastreio
    })
    const longTransit = pedidos.filter(p=>{
      const sit=getSitId(p); const dias=(Date.now()-new Date(p.data||0).getTime())/86400000
      return [27,33].includes(sit) && dias>15
    })
    const semNF = pedidos.filter(p=>getSitId(p)===9&&!p.notaFiscal?.id)
    const r=[]
    if(semEnvio.length)    r.push({I:Truck,       msg:`${semEnvio.length} pedido${semEnvio.length>1?'s':''} pagos +3 dias sem envio`,cor:'#ef4444'})
    if(longTransit.length) r.push({I:AlertTriangle,msg:`${longTransit.length} em trânsito +15 dias — possível extravio`,cor:'#f59e0b'})
    if(semNF.length)       r.push({I:FileText,     msg:`${semNF.length} pedido${semNF.length>1?'s':''} atendidos sem NF-e`,cor:'#f97316'})
    return r
  },[pedidos])
  if(!alerts.length) return null
  return <div style={{display:'flex',gap:8,flexWrap:'wrap',padding:'8px 16px',borderBottom:'1px solid var(--sep)',flexShrink:0}}>
    {alerts.map((a,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',
      borderRadius:99,background:`${a.cor}12`,border:`1px solid ${a.cor}30`,fontSize:11.5,fontWeight:500,color:a.cor}}>
      <a.I size={12}/>{a.msg}
    </div>)}
  </div>
}

// ─── ANALYTICS VIEW ───────────────────────────────────────────────────────────

// ─── ANALYTICS VIEW — Business Dense ─────────────────────────────────────────
function AnalyticsView({pedidos, api}) {
  const [geo, setGeo] = useState(null)

  useEffect(()=>{
    fetch(`${api}/api/dashboard/stats-geo`)
      .then(r=>r.ok?r.json():null).then(setGeo).catch(()=>{})
  },[api])

  const hoje = useMemo(()=> new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}),[])

  // ── TOP PRODUTOS HOJE ────────────────────────────────────────────────
  const prodHoje = useMemo(()=>{
    const m={}
    pedidos.filter(p=>fmtD(p.data)===hoje).forEach(p=>{
      ;(p.itens||[]).forEach(it=>{
        const k=it.descricao||it.nome||'Produto'
        if(!m[k])m[k]={nome:k,qtd:0,valor:0,foto:it.foto||null,codigo:it.codigo||''}
        m[k].qtd+=(it.quantidade||1); m[k].valor+=parseFloat(it.valor||0)*(it.quantidade||1)
      })
    })
    return Object.values(m).sort((a,b)=>b.valor-a.valor).slice(0,8)
  },[pedidos,hoje])

  // ── TODOS OS PRODUTOS (período filtrado) ────────────────────────────
  const prodTodos = useMemo(()=>{
    const m={}
    pedidos.forEach(p=>{
      ;(p.itens||[]).forEach(it=>{
        const k=it.descricao||it.nome||'Produto'
        if(!m[k])m[k]={nome:k,qtd:0,valor:0,pedidos:0,foto:it.foto||null}
        m[k].qtd+=(it.quantidade||1); m[k].valor+=parseFloat(it.valor||0)*(it.quantidade||1); m[k].pedidos++
      })
    })
    return Object.values(m).sort((a,b)=>b.valor-a.valor).slice(0,10)
  },[pedidos])

  // ── PRODUTOS EM PEDIDOS PENDENTES (alerta de estoque) ───────────────
  const prodPendentes = useMemo(()=>{
    const m={}
    pedidos.filter(p=>[6,9,15].includes(getSitId(p))).forEach(p=>{
      ;(p.itens||[]).forEach(it=>{
        const k=it.descricao||it.nome||'Produto'
        if(!m[k])m[k]={nome:k,qtd:0,pedidos:0,foto:it.foto||null}
        m[k].qtd+=(it.quantidade||1); m[k].pedidos++
      })
    })
    return Object.values(m).sort((a,b)=>b.qtd-a.qtd).slice(0,6)
  },[pedidos])

  // ── MÉTRICAS DE OPERAÇÃO ─────────────────────────────────────────────
  const ops = useMemo(()=>{
    const now=Date.now()
    const por_sit={}
    ;[6,9,12,15,24,27,30,33].forEach(id=>{por_sit[id]={n:0,valor:0}})
    pedidos.forEach(p=>{const s=getSitId(p);if(por_sit[s]){por_sit[s].n++;por_sit[s].valor+=parseFloat(p.total||0)}})

    const abertos    = pedidos.filter(p=>getSitId(p)===6)
    const atendidos  = pedidos.filter(p=>getSitId(p)===9)
    const enviados   = pedidos.filter(p=>getSitId(p)===27)
    const entregues  = pedidos.filter(p=>[30,33].includes(getSitId(p)))
    const cancelados = pedidos.filter(p=>getSitId(p)===12)

    const semEnvio   = atendidos.filter(p=>(now-new Date(p.data||0))/86400000>3&&!p.codigoRastreio)
    const extraviados= enviados.filter(p=>(now-new Date(p.data||0))/86400000>15)
    const atrasados  = abertos.filter(p=>(now-new Date(p.data||0))/86400000>2)

    const totalItens = pedidos.reduce((s,p)=>s+(p.itens||[]).reduce((a,it)=>a+(it.quantidade||1),0),0)
    const avgItens   = pedidos.length>0?(totalItens/pedidos.length).toFixed(1):0
    const totalFatura= pedidos.reduce((s,p)=>s+parseFloat(p.total||0),0)
    const fulfillRate= pedidos.length>0?Math.round((entregues.length/pedidos.length)*100):0
    const cancelRate = pedidos.length>0?Math.round((cancelados.length/pedidos.length)*100):0

    const porCanal={}
    pedidos.forEach(p=>{const c=getCanal(p);if(!porCanal[c])porCanal[c]={n:0,v:0};porCanal[c].n++;porCanal[c].v+=parseFloat(p.total||0)})

    return{por_sit,abertos,atendidos,enviados,entregues,cancelados,semEnvio,extraviados,atrasados,avgItens,totalItens,totalFatura,fulfillRate,cancelRate,porCanal}
  },[pedidos])

  // ── FATURAMENTO 30 DIAS ──────────────────────────────────────────────
  const fatDias = useMemo(()=>{
    const m={}
    pedidos.forEach(p=>{const d=fmtD(p.data);m[d]=(m[d]||0)+parseFloat(p.total||0)})
    return Object.entries(m).slice(-30).map(([d,v])=>({d,v:Math.round(v)}))
  },[pedidos])

  // ── HEATMAP ──────────────────────────────────────────────────────────
  const calor=useMemo(()=>{
    const g=Array(7).fill(null).map(()=>Array(24).fill(0))
    pedidos.forEach(p=>{const dt=new Date(p.data||0);g[dt.getDay()][dt.getHours()]++})
    return g
  },[pedidos])
  const maxC=Math.max(...calor.flat(),1)
  const DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

  const TT={contentStyle:{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:8,fontSize:11,color:'var(--label)'}}
  const card={background:'var(--bg-2)',border:'0.5px solid var(--sep)',borderRadius:14,padding:'14px 16px'}
  const maxProd=Math.max(...prodTodos.map(p=>p.valor),1)
  const maxHoje=Math.max(...prodHoje.map(p=>p.valor),1)
  const maxPend=Math.max(...prodPendentes.map(p=>p.qtd),1)

  return(
    <div style={{display:'flex',flexDirection:'column',gap:12}}>

      {/* ── LINHA 1: Produtos hoje + Operações ao vivo ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>

        {/* TOP PRODUTOS HOJE */}
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:7}}>
              <Package size={13} style={{color:'#7c6af7'}}/>
              <span style={{fontSize:12,fontWeight:600,color:'var(--label)'}}>Top produtos hoje</span>
            </div>
            <span style={{fontSize:10,color:'var(--label-4)'}}>
              {prodHoje.reduce((s,p)=>s+p.qtd,0)} itens · {fmt(prodHoje.reduce((s,p)=>s+p.valor,0))}
            </span>
          </div>
          {prodHoje.length===0
            ?<div style={{textAlign:'center',padding:'24px 0',fontSize:11,color:'var(--label-4)'}}>Nenhuma venda hoje ainda</div>
            :<div style={{display:'flex',flexDirection:'column',gap:7}}>
              {prodHoje.map((p,i)=>(
                <div key={p.nome}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                    {p.foto&&<img src={p.foto} alt="" style={{width:20,height:20,borderRadius:4,objectFit:'cover',flexShrink:0,border:'0.5px solid var(--sep)'}} onError={e=>{e.target.style.display='none'}}/>}
                    <span style={{fontSize:10,color:'var(--label)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:i<3?600:400}}>{p.nome}</span>
                    <span style={{fontSize:9,color:'var(--label-4)',flexShrink:0,marginRight:4}}>{p.qtd}×</span>
                    <span style={{fontSize:10,fontWeight:600,color:'var(--label)',flexShrink:0,minWidth:60,textAlign:'right'}}>{fmt(p.valor)}</span>
                  </div>
                  <div style={{height:3,background:'var(--fill)',borderRadius:99,overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:99,
                      width:`${(p.valor/maxHoje*100).toFixed(0)}%`,
                      background:i===0?'linear-gradient(90deg,#7c6af7,#a78bfa)':'#7c6af750',
                      boxShadow:i===0?'0 0 6px rgba(124,106,247,.5)':'none'}}/>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>

        {/* OPERAÇÕES AO VIVO */}
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
            <Activity size={13} style={{color:'#06b6d4'}}/>
            <span style={{fontSize:12,fontWeight:600,color:'var(--label)'}}>Operações ao vivo</span>
            <span style={{marginLeft:'auto',fontSize:10,color:'var(--label-4)'}}>{pedidos.length} pedidos</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
            {[
              {sid:6, label:'Em Aberto',  cor:'#f59e0b', alerta:ops.atrasados.length},
              {sid:9, label:'Atendido',   cor:'#4a9fff', alerta:ops.semEnvio.length},
              {sid:27,label:'Enviado',    cor:'#06b6d4', alerta:ops.extraviados.length},
              {sid:30,label:'Entregue',   cor:'#22c55e', alerta:0},
            ].map(s=>{
              const d=ops.por_sit[s.sid]||{n:0,valor:0}
              return(
                <div key={s.sid} style={{background:'var(--fill)',borderRadius:8,padding:'8px 10px',borderLeft:`2px solid ${s.cor}`}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:2}}>
                    <span style={{fontSize:9,color:'var(--label-4)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em'}}>{s.label}</span>
                    {s.alerta>0&&<span style={{fontSize:8,color:'#ef4444',fontWeight:700}}>⚠ {s.alerta}</span>}
                  </div>
                  <div style={{fontSize:18,fontWeight:700,color:s.cor,lineHeight:1}}>{d.n}</div>
                  <div style={{fontSize:9,color:'var(--label-4)',marginTop:2}}>{fmt(d.valor)}</div>
                </div>
              )
            })}
          </div>
          {/* Métricas de operação */}
          <div style={{borderTop:'0.5px solid var(--sep)',paddingTop:8,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
            {[
              {label:'Fulfillment',  value:`${ops.fulfillRate}%`,   cor:ops.fulfillRate>70?'#22c55e':'#f59e0b'},
              {label:'Cancelamento', value:`${ops.cancelRate}%`,    cor:ops.cancelRate>10?'#ef4444':'#22c55e'},
              {label:'Itens/pedido', value:ops.avgItens,            cor:'var(--label)'},
              {label:'Sem envio',    value:ops.semEnvio.length,     cor:ops.semEnvio.length>0?'#ef4444':'#22c55e'},
              {label:'Possível extrav.',value:ops.extraviados.length,cor:ops.extraviados.length>0?'#f59e0b':'#22c55e'},
              {label:'Atrasados',    value:ops.atrasados.length,    cor:ops.atrasados.length>0?'#f59e0b':'#22c55e'},
            ].map(m=>(
              <div key={m.label} style={{background:'var(--fill)',borderRadius:6,padding:'5px 7px'}}>
                <div style={{fontSize:8,color:'var(--label-4)',marginBottom:1}}>{m.label}</div>
                <div style={{fontSize:13,fontWeight:700,color:m.cor}}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── LINHA 2: Análise completa de produtos ── */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>

        {/* TOP PRODUTOS (período) — V-bars horizontais densas */}
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
            <TrendingUp size={13} style={{color:'#22c55e'}}/>
            <span style={{fontSize:12,fontWeight:600,color:'var(--label)'}}>Produtos — período filtrado</span>
            <span style={{marginLeft:'auto',fontSize:10,color:'var(--label-4)'}}>{prodTodos.length} SKUs</span>
          </div>
          {prodTodos.length===0
            ?<div style={{textAlign:'center',padding:'16px 0',fontSize:11,color:'var(--label-4)'}}>Sem itens nos pedidos deste período</div>
            :<div style={{display:'flex',flexDirection:'column',gap:0}}>
              {/* cabeçalho */}
              <div style={{display:'grid',gridTemplateColumns:'24px 1fr 60px 40px 70px',gap:6,padding:'4px 0',borderBottom:'0.5px solid var(--sep)',marginBottom:4}}>
                {['#','Produto','Receita','Qtd','Pedidos'].map(h=>(
                  <span key={h} style={{fontSize:8,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em'}}>{h}</span>
                ))}
              </div>
              {prodTodos.map((p,i)=>(
                <div key={p.nome} style={{display:'grid',gridTemplateColumns:'24px 1fr 60px 40px 70px',gap:6,alignItems:'center',padding:'5px 0',borderBottom:'0.5px solid var(--sep)',opacity:1}}>
                  <span style={{fontSize:10,fontWeight:700,color:'var(--label-4)'}}>{i+1}</span>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:10,fontWeight:i<3?600:400,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nome}</div>
                    <div style={{height:3,background:'var(--fill)',borderRadius:99,overflow:'hidden',marginTop:3}}>
                      <div style={{height:'100%',borderRadius:99,width:`${(p.valor/maxProd*100).toFixed(0)}%`,
                        background:i<3?`linear-gradient(90deg,${'#22c55e'},#22c55e88)`:'#22c55e30'}}/>
                    </div>
                  </div>
                  <span style={{fontSize:10,fontWeight:600,color:'var(--label)'}}>{fmt(p.valor)}</span>
                  <span style={{fontSize:10,color:'var(--label-3)'}}>{p.qtd}</span>
                  <div style={{display:'flex',alignItems:'center',gap:3}}>
                    <div style={{flex:1,height:4,background:'var(--fill)',borderRadius:99,overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:99,background:'#a78bfa',
                        width:`${(p.pedidos/Math.max(...prodTodos.map(x=>x.pedidos),1)*100).toFixed(0)}%`}}/>
                    </div>
                    <span style={{fontSize:9,color:'var(--label-4)',flexShrink:0}}>{p.pedidos}</span>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>

        {/* PRODUTOS EM PEDIDOS PENDENTES */}
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
            <AlertCircle size={13} style={{color:'#f59e0b'}}/>
            <span style={{fontSize:12,fontWeight:600,color:'var(--label)'}}>Estoque em risco</span>
          </div>
          <div style={{fontSize:10,color:'var(--label-4)',marginBottom:10}}>
            Produtos em pedidos ainda abertos/atendidos
          </div>
          {prodPendentes.length===0
            ?<div style={{textAlign:'center',padding:'16px 0',fontSize:11,color:'var(--label-4)'}}>Sem pedidos pendentes</div>
            :<div style={{display:'flex',flexDirection:'column',gap:7}}>
              {prodPendentes.map((p,i)=>(
                <div key={p.nome}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                    {p.foto&&<img src={p.foto} alt="" style={{width:18,height:18,borderRadius:3,objectFit:'cover',flexShrink:0,border:'0.5px solid var(--sep)'}} onError={e=>{e.target.style.display='none'}}/>}
                    <span style={{fontSize:10,color:'var(--label)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nome}</span>
                    <span style={{fontSize:10,fontWeight:700,color:p.qtd>=10?'#ef4444':p.qtd>=5?'#f59e0b':'var(--label)',flexShrink:0}}>{p.qtd} un</span>
                  </div>
                  <div style={{height:4,background:'var(--fill)',borderRadius:99,overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:99,
                      width:`${(p.qtd/maxPend*100).toFixed(0)}%`,
                      background:p.qtd>=10?'#ef4444':p.qtd>=5?'#f59e0b':'#4a9fff'}}/>
                  </div>
                  <div style={{fontSize:8,color:'var(--label-4)',marginTop:1}}>{p.pedidos} pedido{p.pedidos>1?'s':''} aguardando</div>
                </div>
              ))}
            </div>
          }
          {/* Ticket médio + total itens */}
          <div style={{marginTop:12,borderTop:'0.5px solid var(--sep)',paddingTop:10,display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
            <div style={{background:'var(--fill)',borderRadius:7,padding:'7px 9px'}}>
              <div style={{fontSize:8,color:'var(--label-4)',marginBottom:2}}>ITENS/PEDIDO</div>
              <div style={{fontSize:18,fontWeight:700,color:'var(--label)'}}>{ops.avgItens}</div>
            </div>
            <div style={{background:'var(--fill)',borderRadius:7,padding:'7px 9px'}}>
              <div style={{fontSize:8,color:'var(--label-4)',marginBottom:2}}>TOTAL ITENS</div>
              <div style={{fontSize:18,fontWeight:700,color:'var(--label)'}}>{ops.totalItens}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── LINHA V-BARS: Pipeline por situação + Receita por canal ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>

        {/* PIPELINE — V-bars verticais por situação */}
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
            <Layers size={13} style={{color:'#06b6d4'}}/>
            <span style={{fontSize:12,fontWeight:600,color:'var(--label)'}}>Pipeline de pedidos</span>
            <span style={{marginLeft:'auto',fontSize:10,color:'var(--label-4)'}}>{pedidos.length} total</span>
          </div>
          {(()=>{
            const cols=[
              {sid:6, label:'Aberto',  cor:'#f59e0b'},
              {sid:9, label:'Atendido',cor:'#4a9fff'},
              {sid:27,label:'Enviado', cor:'#06b6d4'},
              {sid:30,label:'Entregue',cor:'#22c55e'},
              {sid:12,label:'Cancelado',cor:'#ef4444'},
            ]
            const maxN=Math.max(...cols.map(s=>ops.por_sit[s.sid]?.n||0),1)
            const total=Math.max(pedidos.length,1)
            return(
              <div>
                <div style={{display:'flex',alignItems:'flex-end',gap:8,height:90,marginBottom:10}}>
                  {cols.map(s=>{
                    const d=ops.por_sit[s.sid]||{n:0,valor:0}
                    const h=Math.max(4,(d.n/maxN)*90)
                    return(
                      <div key={s.sid} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                        <span style={{fontSize:11,fontWeight:700,color:s.cor,textShadow:`0 0 8px ${s.cor}60`}}>{d.n}</span>
                        <div style={{width:'100%',borderRadius:'4px 4px 0 0',height:h,
                          background:`linear-gradient(180deg,${s.cor},${s.cor}99)`,
                          boxShadow:`0 0 8px ${s.cor}40`,transition:'height .5s ease'}}/>
                      </div>
                    )
                  })}
                </div>
                <div style={{display:'flex',gap:8,borderTop:'0.5px solid var(--sep)',paddingTop:8}}>
                  {cols.map(s=>{
                    const d=ops.por_sit[s.sid]||{n:0,valor:0}
                    return(
                      <div key={s.sid} style={{flex:1,textAlign:'center'}}>
                        <div style={{fontSize:9,color:s.cor,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.label}</div>
                        <div style={{fontSize:8,color:'var(--label-4)'}}>{total>0?((d.n/total)*100).toFixed(0):0}%</div>
                      </div>
                    )
                  })}
                </div>
                {/* barra de proporção */}
                <div style={{display:'flex',height:5,borderRadius:99,overflow:'hidden',marginTop:8,gap:1}}>
                  {cols.filter(s=>(ops.por_sit[s.sid]?.n||0)>0).map(s=>(
                    <div key={s.sid} style={{flex:ops.por_sit[s.sid]?.n||1,background:s.cor,transition:'flex .5s ease'}}/>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>

        {/* RECEITA POR CANAL — V-bars verticais */}
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
            <BarChart3 size={13} style={{color:'#f97316'}}/>
            <span style={{fontSize:12,fontWeight:600,color:'var(--label)'}}>Receita por canal</span>
            <span style={{marginLeft:'auto',fontSize:10,color:'var(--label-4)'}}>{fmt(Object.values(ops.porCanal).reduce((s,d)=>s+d.v,0))}</span>
          </div>
          {(()=>{
            const canais=Object.entries(ops.porCanal).sort((a,b)=>b[1].v-a[1].v)
            const maxV=Math.max(...canais.map(([,d])=>d.v),1)
            return(
              <div>
                <div style={{display:'flex',alignItems:'flex-end',gap:8,height:90,marginBottom:10}}>
                  {canais.map(([k,d])=>{
                    const cfg=CANAL_CFG[k]||CANAL_CFG.bling
                    const Logo=CANAL_LOGO[k]||LogoBling
                    const h=Math.max(4,(d.v/maxV)*90)
                    return(
                      <div key={k} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                        <span style={{fontSize:9,fontWeight:600,color:cfg.cor,whiteSpace:'nowrap'}}>{d.v>=1000?`R$${(d.v/1000).toFixed(0)}k`:fmt(d.v)}</span>
                        <div style={{width:'100%',borderRadius:'4px 4px 0 0',height:h,position:'relative',
                          background:`linear-gradient(180deg,${cfg.cor},${cfg.cor}88)`,
                          boxShadow:`0 0 8px ${cfg.cor}40`,transition:'height .5s ease'}}>
                          <div style={{position:'absolute',top:-16,left:'50%',transform:'translateX(-50%)'}}>
                            <Logo size={12}/>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{display:'flex',gap:8,borderTop:'0.5px solid var(--sep)',paddingTop:8}}>
                  {canais.map(([k,d])=>{
                    const cfg=CANAL_CFG[k]||CANAL_CFG.bling
                    return(
                      <div key={k} style={{flex:1,textAlign:'center'}}>
                        <div style={{fontSize:9,color:cfg.cor,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cfg.label.split(' ')[0]}</div>
                        <div style={{fontSize:8,color:'var(--label-4)'}}>{d.n} ped.</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── LINHA 3: Faturamento + Por canal ── */}
      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:12}}>

        <div style={card}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--label)',marginBottom:10,display:'flex',alignItems:'center',gap:7}}>
            <TrendingUp size={13} style={{color:'#7c6af7'}}/>Faturamento — 30 dias
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={fatDias} margin={{top:4,right:0,bottom:0,left:0}}>
              <defs><linearGradient id="gFat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c6af7" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#7c6af7" stopOpacity={0}/>
              </linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--sep)" vertical={false}/>
              <XAxis dataKey="d" tick={{fontSize:8,fill:'var(--label-4)'}} tickLine={false} axisLine={false} interval={4}/>
              <YAxis tick={{fontSize:8,fill:'var(--label-4)'}} tickLine={false} axisLine={false} tickFormatter={v=>v>=1000?`R$${(v/1000).toFixed(0)}k`:`R$${v}`}/>
              <Tooltip {...TT} formatter={v=>[fmt(v),'Faturamento']}/>
              <Area type="monotone" dataKey="v" stroke="#7c6af7" strokeWidth={2} fill="url(#gFat)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Por canal — tabela densa */}
        <div style={card}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--label)',marginBottom:10,display:'flex',alignItems:'center',gap:7}}>
            <BarChart3 size={13} style={{color:'#f97316'}}/>Receita por canal
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:0}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 50px 50px 55px',gap:4,padding:'3px 0',borderBottom:'0.5px solid var(--sep)',marginBottom:4}}>
              {['Canal','Pedidos','Itens','Receita'].map(h=>(
                <span key={h} style={{fontSize:8,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase'}}>{h}</span>
              ))}
            </div>
            {Object.entries(ops.porCanal).sort((a,b)=>b[1].v-a[1].v).map(([canal,d])=>{
              const cfg=CANAL_CFG[canal]||CANAL_CFG.bling
              const Logo=CANAL_LOGO[canal]||LogoBling
              const itensCanal=pedidos.filter(p=>getCanal(p)===canal).reduce((s,p)=>s+(p.itens||[]).reduce((a,it)=>a+(it.quantidade||1),0),0)
              return(
                <div key={canal} style={{display:'grid',gridTemplateColumns:'1fr 50px 50px 55px',gap:4,alignItems:'center',padding:'5px 0',borderBottom:'0.5px solid var(--sep)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <Logo size={12}/>
                    <span style={{fontSize:10,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cfg.label}</span>
                  </div>
                  <span style={{fontSize:10,color:'var(--label-3)'}}>{d.n}</span>
                  <span style={{fontSize:10,color:'var(--label-3)'}}>{itensCanal}</span>
                  <span style={{fontSize:10,fontWeight:600,color:'var(--label)'}}>{fmt(d.v)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── LINHA FRETE: Análise por transportadora ── */}
      {geo&&(geo.transpStats||[]).length>0&&(
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
            <Truck size={13} style={{color:'#f59e0b'}}/>
            <span style={{fontSize:12,fontWeight:600,color:'var(--label)'}}>Análise de frete por transportadora</span>
            <span style={{marginLeft:'auto',fontSize:10,color:'var(--label-4)'}}>{(geo.transpStats||[]).length} transportadoras</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
            {(geo.transpStats||[]).map(t=>{
              const cor=t.tempoMedio<=3?'#22c55e':t.tempoMedio<=7?'#f59e0b':'#ef4444'
              const prazoBar=Math.min(100,(t.tempoMedio/14)*100)
              return(
                <div key={t.nome} style={{background:'var(--fill)',borderRadius:10,padding:'10px 12px',border:`0.5px solid ${cor}30`}}>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:8}}>{t.nome}</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5,marginBottom:8}}>
                    <div>
                      <div style={{fontSize:8,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>Tempo médio</div>
                      <div style={{fontSize:15,fontWeight:700,color:cor}}>{t.tempoMedio}<span style={{fontSize:10,fontWeight:400}}> dias</span></div>
                    </div>
                    <div>
                      <div style={{fontSize:8,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>Pedidos</div>
                      <div style={{fontSize:15,fontWeight:700,color:'var(--label)'}}>{t.pedidos||'—'}</div>
                    </div>
                    {t.custoMedio>0&&<div>
                      <div style={{fontSize:8,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>Custo médio</div>
                      <div style={{fontSize:12,fontWeight:600,color:'var(--label)'}}>{fmt(t.custoMedio)}</div>
                    </div>}
                    {t.taxaExtravio>0&&<div>
                      <div style={{fontSize:8,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>Extravio</div>
                      <div style={{fontSize:12,fontWeight:700,color:'#ef4444'}}>{t.taxaExtravio}%</div>
                    </div>}
                  </div>
                  <div style={{height:5,background:'var(--bg-2)',borderRadius:99,overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:99,width:`${prazoBar}%`,background:cor,boxShadow:`0 0 5px ${cor}60`,transition:'width .5s ease'}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:3}}>
                    <span style={{fontSize:8,color:'var(--label-4)'}}>0d</span>
                    <span style={{fontSize:8,color:cor,fontWeight:600}}>meta: 7d</span>
                    <span style={{fontSize:8,color:'var(--label-4)'}}>14d</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── LINHA 4: Heatmap + Mapa Brasil + Geo ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr .7fr 1.3fr',gap:12}}>
        <div style={card}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--label)',marginBottom:10,display:'flex',alignItems:'center',gap:7}}>
            <Clock size={13} style={{color:'#06b6d4'}}/>Horários de pico
          </div>
          <div style={{overflowX:'auto'}}>
            <div style={{display:'grid',gridTemplateColumns:'24px repeat(24,1fr)',gap:2,minWidth:400}}>
              <div/>{Array(24).fill(0).map((_,h)=><div key={h} style={{fontSize:7,color:'var(--label-4)',textAlign:'center'}}>{h}</div>)}
              {calor.map((row,d)=>[
                <div key={`l${d}`} style={{fontSize:9,color:'var(--label-4)',display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:3}}>{DIAS[d]}</div>,
                ...row.map((v,h)=><div key={h} title={`${DIAS[d]} ${h}h: ${v}`} style={{aspectRatio:'1',borderRadius:2,background:v===0?'var(--fill)':`rgba(6,182,212,${0.1+0.9*(v/maxC)})`}}/>)
              ])}
            </div>
          </div>
        </div>

        {/* Mapa heatmap vendas Brasil */}
        <div style={card}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--label)',marginBottom:8,display:'flex',alignItems:'center',gap:7}}>
            <MapPin size={13} style={{color:'#22c55e'}}/>Vendas por estado
          </div>
          {(()=>{
            const geoData={}
            ;(geo?.topEstados||[]).forEach(e=>{geoData[e.uf]={valor:e.valor,n:e.pedidos||1}})
            return pedidos.length>0
              ?<BrasilMapHeat data={geoData} size={200}/>
              :<div style={{textAlign:'center',padding:'32px 0',fontSize:11,color:'var(--label-4)'}}>Sem dados de vendas</div>
          })()}
        </div>

        {/* Geo — tabela densa + transportadoras */}
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {geo&&(
            <>
              <div style={{...card,flex:1}}>
                <div style={{display:'flex',gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:600,color:'var(--label)',marginBottom:6,display:'flex',alignItems:'center',gap:5}}>
                      <MapPin size={11} style={{color:'#22c55e'}}/>Top estados
                    </div>
                    {(geo.topEstados||[]).slice(0,5).map((e,i)=>(
                      <div key={e.uf} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                        <span style={{fontSize:9,fontWeight:700,color:'var(--label-4)',width:12}}>{i+1}</span>
                        <span style={{fontSize:10,fontWeight:700,color:'var(--label)',width:24}}>{e.uf}</span>
                        <div style={{flex:1,height:4,background:'var(--fill)',borderRadius:99,overflow:'hidden'}}>
                          <div style={{height:'100%',borderRadius:99,background:'#22c55e',width:`${(e.valor/((geo.topEstados||[])[0]?.valor||1)*100).toFixed(0)}%`}}/>
                        </div>
                        <span style={{fontSize:9,color:'var(--label-4)',flexShrink:0,minWidth:50,textAlign:'right'}}>{fmt(e.valor)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:600,color:'var(--label)',marginBottom:6,display:'flex',alignItems:'center',gap:5}}>
                      <Navigation size={11} style={{color:'#a78bfa'}}/>Top cidades
                    </div>
                    {(geo.topCidades||[]).slice(0,5).map((c,i)=>(
                      <div key={c.cidade} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                        <span style={{fontSize:9,fontWeight:700,color:'var(--label-4)',width:12}}>{i+1}</span>
                        <span style={{fontSize:10,color:'var(--label)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.cidade}</span>
                        <span style={{fontSize:9,color:'var(--label-4)',flexShrink:0}}>{fmt(c.valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transportadoras — tempo + custo + risco */}
              {(geo.transpStats||[]).length>0&&(
                <div style={card}>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--label)',marginBottom:8,display:'flex',alignItems:'center',gap:5}}>
                    <Truck size={11} style={{color:'#f59e0b'}}/>Transportadoras
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 32px 45px 45px',gap:4,padding:'2px 0',borderBottom:'0.5px solid var(--sep)',marginBottom:4}}>
                    {['Transportadora','Ped.','T.Médio','Prazo'].map(h=>(
                      <span key={h} style={{fontSize:8,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase'}}>{h}</span>
                    ))}
                  </div>
                  {(geo.transpStats||[]).map(t=>(
                    <div key={t.nome} style={{display:'grid',gridTemplateColumns:'1fr 32px 45px 45px',gap:4,alignItems:'center',padding:'4px 0',borderBottom:'0.5px solid var(--sep)'}}>
                      <span style={{fontSize:10,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.nome}</span>
                      <span style={{fontSize:10,color:'var(--label-3)'}}>{t.pedidos||'—'}</span>
                      <span style={{fontSize:10,fontWeight:600,color:t.tempoMedio<=3?'#22c55e':t.tempoMedio<=7?'#f59e0b':'#ef4444'}}>{t.tempoMedio}d</span>
                      <div style={{height:4,background:'var(--fill)',borderRadius:99,overflow:'hidden'}}>
                        <div style={{height:'100%',borderRadius:99,width:`${Math.min(100,(t.tempoMedio/14)*100)}%`,background:t.tempoMedio<=3?'#22c55e':t.tempoMedio<=7?'#f59e0b':'#ef4444'}}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {!geo&&<div style={{...card,textAlign:'center',padding:'32px',color:'var(--label-4)',fontSize:11}}>Carregando dados geográficos...</div>}
        </div>
      </div>

    </div>
  )
}


// ─── KANBAN NivelMax ─────────────────────────────────────────────────────────
const SIT_KANBAN_IDS = [6, 9, 27, 30, 12]

function KanbanCard({p, sit, onSel}) {
  const canal = getCanal(p)
  const Logo  = CANAL_LOGO[canal] || LogoBling
  const itens = p.itens || []
  const rs    = p.rastreioStatus || ''
  const pct   = [30,33].includes(getSitId(p)) ? 100 : rs==='saiu_entrega' ? 85 : rs.includes('transito') ? 55 : rs==='pedido_coletado' ? 35 : p.codigoRastreio ? 20 : 0
  const isAlt = [9,15].includes(getSitId(p)) && (Date.now()-new Date(p.data||0))/86400000>3 && !p.codigoRastreio
  return (
    <div onClick={()=>onSel(p)}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=`${sit.cor}60`;e.currentTarget.style.transform='translateY(-2px)'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=isAlt?'rgba(239,68,68,.3)':'rgba(255,255,255,.09)';e.currentTarget.style.transform='translateY(0)'}}
      style={{background:isAlt?'rgba(239,68,68,.05)':'rgba(255,255,255,.04)',
        border:`0.5px solid ${isAlt?'rgba(239,68,68,.3)':'rgba(255,255,255,.09)'}`,
        borderRadius:12,padding:'10px 12px',cursor:'pointer',transition:'border-color .15s,transform .12s'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:5}}>
        <div>
          <span style={{fontSize:11,fontWeight:600,color:isAlt?'#ef4444':sit.cor}}>#{p.numero}</span>
          {isAlt&&<div style={{fontSize:8,color:'#ef4444',marginTop:1}}>⚠ +3d sem envio</div>}
        </div>
        <Logo size={13}/>
      </div>
      <div style={{fontSize:10,color:'rgba(255,255,255,.65)',marginBottom:itens.length?6:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
        {p.contato||'—'}
      </div>
      {itens.length>0&&(
        <div style={{display:'flex',gap:3,marginBottom:7}}>
          {itens.slice(0,3).map((it,i)=><ProductThumb key={i} item={it} size={26}/>)}
          {itens.length>3&&<div style={{width:26,height:26,borderRadius:5,background:'rgba(255,255,255,.07)',border:'0.5px solid rgba(255,255,255,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'rgba(255,255,255,.4)'}}>+{itens.length-3}</div>}
        </div>
      )}
      {pct>0&&(
        <div style={{height:3,background:'rgba(255,255,255,.08)',borderRadius:99,overflow:'hidden',marginBottom:7}}>
          <div style={{height:'100%',borderRadius:99,width:`${pct}%`,
            background:pct===100?'#22c55e':'linear-gradient(90deg,#4a9fff,#06b6d4)',
            boxShadow:pct===100?'0 0 4px rgba(34,197,94,.6)':'0 0 4px rgba(6,182,212,.5)',
            transition:'width .5s ease'}}/>
        </div>
      )}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.9)'}}>{fmt(p.total)}</span>
        <span style={{fontSize:9,color:'rgba(255,255,255,.28)'}}>{fmtD(p.data)}</span>
      </div>
    </div>
  )
}

function KanbanView({filtrados, onSel}) {
  const cols = useMemo(()=>{
    const c = {}
    SIT_KANBAN_IDS.forEach(id=>{c[id]={sit:SIT[id]||{label:`${id}`,cor:'#888',bg:'#8882',bdr:'#888'},items:[],total:0}})
    filtrados.forEach(p=>{const sid=getSitId(p); if(c[sid]){c[sid].items.push(p);c[sid].total+=parseFloat(p.total||0)}})
    return c
  },[filtrados])
  return <div style={{display:'grid',gridTemplateColumns:`repeat(${SIT_KANBAN_IDS.length},1fr)`,gap:10,alignItems:'start'}}>
    {SIT_KANBAN_IDS.map(sid=>{
      const col=cols[sid]
      return <div key={sid} style={{display:'flex',flexDirection:'column',gap:6}}>
        <div style={{padding:'8px 12px',borderRadius:10,background:`${col.sit.cor}12`,border:`0.5px solid ${col.sit.cor}35`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:col.sit.cor}}>{col.sit.label}</div>
            <div style={{fontSize:9,color:`${col.sit.cor}90`}}>{fmt(col.total)}</div>
          </div>
          <span style={{fontSize:18,fontWeight:700,color:col.sit.cor,textShadow:`0 0 10px ${col.sit.cor}60`}}>{col.items.length}</span>
        </div>
        {col.items.slice(0,14).map(p=><KanbanCard key={p.numero} p={p} sit={col.sit} onSel={onSel}/>)}
        {col.items.length>14&&<div style={{textAlign:'center',fontSize:10,color:'var(--label-4)',padding:'3px 0'}}>+{col.items.length-14} mais</div>}
        {col.items.length===0&&<div style={{padding:'16px',borderRadius:10,border:`0.5px dashed ${col.sit.cor}25`,textAlign:'center',fontSize:10,color:'rgba(255,255,255,.2)'}}>Nenhum pedido</div>}
      </div>
    })}
  </div>
}


// ─── ORDER SHEET ───────────────────────────────────────────────────────────────

// ─── BRASIL MAP HEAT ─────────────────────────────────────────────────────────
// Mapa SVG simplificado do Brasil com heatmap de vendas por estado
const BRASIL_OUTLINE = "M185,5 L210,8 L240,18 L260,35 L275,55 L282,80 L285,95 L278,120 L268,140 L258,160 L255,180 L250,198 L245,212 L235,225 L222,242 L210,255 L200,270 L193,286 L186,300 L178,308 L168,304 L155,298 L145,290 L132,285 L118,278 L108,272 L98,262 L88,248 L76,232 L62,215 L50,200 L42,182 L36,165 L30,148 L28,132 L28,116 L32,100 L38,86 L45,73 L54,62 L64,52 L76,44 L92,36 L112,26 L132,18 L152,10 L170,6 Z"

const ESTADOS = [
  {uf:'SP',cx:208,cy:218},{uf:'RJ',cx:242,cy:210},{uf:'MG',cx:218,cy:192},{uf:'PR',cx:188,cy:242},
  {uf:'RS',cx:175,cy:282},{uf:'SC',cx:182,cy:258},{uf:'BA',cx:228,cy:162},{uf:'GO',cx:190,cy:178},
  {uf:'MS',cx:162,cy:225},{uf:'MT',cx:145,cy:162},{uf:'PA',cx:152,cy:100},{uf:'AM',cx:90,cy:128},
  {uf:'MA',cx:212,cy:110},{uf:'PE',cx:260,cy:128},{uf:'CE',cx:250,cy:115},{uf:'PI',cx:228,cy:130},
  {uf:'TO',cx:183,cy:148},{uf:'RN',cx:272,cy:108},{uf:'PB',cx:270,cy:118},{uf:'AL',cx:270,cy:138},
  {uf:'SE',cx:265,cy:148},{uf:'ES',cx:248,cy:192},{uf:'RO',cx:82,cy:180},{uf:'AC',cx:38,cy:175},
  {uf:'RR',cx:85,cy:72},{uf:'AP',cx:188,cy:52},{uf:'DF',cx:200,cy:182},
]

function BrasilMapHeat({ data = {}, onClick, activeUf, size = 300 }) {
  const [hover, setHover] = useState(null)
  const maxVal = Math.max(...Object.values(data).map(d => d.valor || 0), 1)

  return (
    <div style={{ position: 'relative' }}>
      <svg width={size} height={size * 1.08} viewBox="0 0 310 330">
        {/* Sombra/fundo */}
        <path d={BRASIL_OUTLINE} fill="var(--fill)" stroke="var(--sep)" strokeWidth="1"/>
        {/* Dots por estado */}
        {ESTADOS.map(e => {
          const d = data[e.uf] || { valor: 0, n: 0 }
          const intensity = d.valor / maxVal
          const r = Math.max(3, intensity * 18)
          const isHover = hover === e.uf
          const isActive = activeUf === e.uf
          return (
            <g key={e.uf} style={{ cursor: 'pointer' }} onClick={() => onClick?.(e.uf)}
              onMouseEnter={() => setHover(e.uf)} onMouseLeave={() => setHover(null)}>
              {intensity > 0 && (
                <>
                  <circle cx={e.cx} cy={e.cy} r={r * 1.8}
                    fill={`rgba(34,197,94,${intensity * 0.15})`} />
                  <circle cx={e.cx} cy={e.cy} r={r}
                    fill={`rgba(34,197,94,${0.3 + intensity * 0.7})`}
                    stroke="rgba(34,197,94,.5)" strokeWidth="0.5"/>
                </>
              )}
              {(isHover || isActive || intensity > 0.3) && (
                <text x={e.cx} y={e.cy - r - 4} textAnchor="middle"
                  fontSize={isHover ? 10 : 8} fontWeight={isHover ? 600 : 400}
                  fill="var(--label)">
                  {e.uf}
                </text>
              )}
            </g>
          )
        })}
        {/* Tooltip hover */}
        {hover && data[hover] && (
          <g>
            <rect x={Math.min(250, (ESTADOS.find(e=>e.uf===hover)?.cx||150) + 8)} y={(ESTADOS.find(e=>e.uf===hover)?.cy||150) - 22} width="80" height="28" rx="4" fill="var(--bg-2)" stroke="var(--sep)" strokeWidth="0.5"/>
            <text x={Math.min(290, (ESTADOS.find(e=>e.uf===hover)?.cx||150) + 48)} y={(ESTADOS.find(e=>e.uf===hover)?.cy||150) - 13} textAnchor="middle" fontSize={9} fill="var(--label)" fontWeight={600}>{hover}</text>
            <text x={Math.min(290, (ESTADOS.find(e=>e.uf===hover)?.cx||150) + 48)} y={(ESTADOS.find(e=>e.uf===hover)?.cy||150) - 3} textAnchor="middle" fontSize={8} fill="var(--label-3)">{fmt(data[hover].valor||0)}</text>
          </g>
        )}
      </svg>
      {/* legenda */}
      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:9, color:'var(--label-4)', marginTop:4 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'rgba(34,197,94,.2)' }}/>
        <span>baixo</span>
        <div style={{ flex:1, height:3, borderRadius:99, background:'linear-gradient(90deg,rgba(34,197,94,.2),rgba(34,197,94,.9))' }}/>
        <span>alto</span>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'rgba(34,197,94,.9)' }}/>
      </div>
    </div>
  )
}

// ─── PACKAGE MINI MAP ────────────────────────────────────────────────────────
// Mini mapa de rota do pacote com posição atual animada
const UF_COORDS = {
  SP:{cx:208,cy:218},RJ:{cx:242,cy:210},MG:{cx:218,cy:192},PR:{cx:188,cy:242},
  RS:{cx:175,cy:282},SC:{cx:182,cy:258},BA:{cx:228,cy:162},GO:{cx:190,cy:178},
  MS:{cx:162,cy:225},MT:{cx:145,cy:162},PA:{cx:152,cy:100},AM:{cx:90,cy:128},
  MA:{cx:212,cy:110},PE:{cx:260,cy:128},CE:{cx:250,cy:115},PI:{cx:228,cy:130},
  TO:{cx:183,cy:148},RN:{cx:272,cy:108},PB:{cx:270,cy:118},AL:{cx:270,cy:138},
  SE:{cx:265,cy:148},ES:{cx:248,cy:192},RO:{cx:82,cy:180},AC:{cx:38,cy:175},
  DF:{cx:200,cy:182},RR:{cx:85,cy:72},AP:{cx:188,cy:52},
}

function PackageMiniMap({ origem = 'SP', destino, atual, pct = 0 }) {
  const o  = UF_COORDS[origem]  || { cx:208, cy:218 }
  const d  = UF_COORDS[destino] || null
  const a  = UF_COORDS[atual]   || null

  // ponto atual interpolado na rota
  const pos = d && pct > 0 ? {
    cx: o.cx + (d.cx - o.cx) * (pct / 100),
    cy: o.cy + (d.cy - o.cy) * (pct / 100),
  } : (a || o)

  return (
    <svg width="100%" viewBox="0 0 310 330" style={{ maxHeight:160, display:'block' }}>
      <path d={BRASIL_OUTLINE} fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.2)" strokeWidth="0.8"/>
      {/* rota */}
      {d && (
        <line x1={o.cx} y1={o.cy} x2={d.cx} y2={d.cy}
          stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 3" opacity=".6"/>
      )}
      {/* origem */}
      <circle cx={o.cx} cy={o.cy} r="4" fill="#7c6af7"/>
      <text x={o.cx} y={o.cy - 8} textAnchor="middle" fontSize="8" fill="#a78bfa">{origem}</text>
      {/* destino */}
      {d && <>
        <circle cx={d.cx} cy={d.cy} r="4" fill="#22c55e"/>
        <text x={d.cx} y={d.cy - 8} textAnchor="middle" fontSize="8" fill="#22c55e">{destino}</text>
      </>}
      {/* posição atual */}
      <circle cx={pos.cx} cy={pos.cy} r="7" fill="rgba(6,182,212,.2)" stroke="#06b6d4" strokeWidth="1">
        <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx={pos.cx} cy={pos.cy} r="4" fill="#06b6d4"/>
    </svg>
  )
}

// ─── SMART ORDER CARD — MODO IMERSIVO ────────────────────────────────────────
function SmartOrderCard({pedRow, onClose, api, allPedidos}) {
  const [det,      setDet   ] = useState(null)
  const [load,     setLoad  ] = useState(true)
  const [nfe,      setNfe   ] = useState(null)
  const [disps,    setDisps ] = useState([])
  const [foto,     setFoto  ] = useState(null)
  const [msgs,     setMsgs  ] = useState([])
  const [hist,     setHist  ] = useState([])
  const [copied,   setCpOk  ] = useState('')
  const [expanded, setExp   ] = useState(false)
  const [sending,  setSend  ] = useState(false)
  const [sentNF,   setStNF  ] = useState(false)
  const [msgTxt,   setMsgT  ] = useState('')

  useEffect(()=>{
    setLoad(true); setDet(null); setNfe(null); setFoto(null); setDisps([]); setMsgs([]); setHist([])
    fetch(`${api}/api/dashboard/pedido-completo/${pedRow.numero}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        setDet(d); setLoad(false)
        setMsgs(d?.mensagens?.lista||[])
        setHist(d?.historico?.pedidos||[])
        const tel=d?.mensagens?.lista?.[0]?.telefone||pedRow.telefone||''
        if(tel) fetch(`${api}/api/dashboard/foto-perfil/${tel.replace(/\D/g,'')}`)
          .then(r=>r.ok?r.json():null).then(f=>f?.url&&setFoto(f.url)).catch(()=>{})
        const nfId=Number(d?.pedido?.notaFiscal?.id||0)
        if(nfId>0) fetch(`${api}/api/dashboard/nfe-link/${nfId}`)
          .then(r=>r.ok?r.json():null).then(setNfe).catch(()=>{})
      }).catch(()=>setLoad(false))
    fetch(`${api}/api/dashboard/disparos-pedido/${pedRow.numero}`)
      .then(r=>r.ok?r.json():null).then(d=>{if(d?.disparos)setDisps(d.disparos)}).catch(()=>{})
  },[pedRow.numero,api])

  const ped       = det?.pedido||pedRow
  const contato   = det?.contato
  const rastreio  = det?.rastreio
  const transporte= det?.transporte
  const sitId     = getSitId(ped)
  const sit       = SIT[sitId]||{label:'—',cor:'#888',bg:'var(--fill)',bdr:'var(--sep)'}
  const canal     = getCanal(pedRow)
  const itens     = ped?.itens||[]
  const codRas    = rastreio?.codigo||transporte?.volumes?.[0]?.codigo||pedRow?.codigoRastreio||''
  const linkRas   = rastreio?.link||rastreio?.linkCorreios||''
  const evts      = rastreio?.eventos||[]
  const rfmScore  = calcRFM(hist)
  const rfmCfg    = RFM[rfmScore]||RFM.novo
  const RFMIcon   = rfmCfg.icon
  const ltvTotal  = hist.reduce((s,p)=>s+parseFloat(p.total||0),0)+parseFloat(ped.total||0)
  const ticketMed = hist.length>0 ? (hist.reduce((s,p)=>s+parseFloat(p.total||0),0)/hist.length) : parseFloat(ped.total||0)
  const pedTotal  = parseFloat(ped.total||pedRow.total||0)
  const vsMedia   = ticketMed>0 ? ((pedTotal/ticketMed-1)*100).toFixed(0) : 0

  // risco: pagamento não confirmado + sem rastreio + prazo excedido
  const diasPedido = (Date.now()-new Date(ped.data||0))/86400000
  const riskScore = (([9,15].includes(sitId)&&!codRas&&diasPedido>3)?40:0)
    + (sitId===27&&diasPedido>15?35:0)
    + (sitId===6&&diasPedido>2?25:0)
  const riskLabel = riskScore>=60?'Alto':riskScore>=25?'Médio':'Baixo'
  const riskCor   = riskScore>=60?'#ef4444':riskScore>=25?'#f59e0b':'#22c55e'

  // previsão entrega
  const rastreioPct=()=>{
    if([30,33].includes(sitId))return 100
    const rs=rastreio?.ultimoStatus||pedRow?.rastreioStatus||''
    if(rs==='saiu_entrega')return 90
    if(rs.includes('transito'))return 55
    if(rs==='pedido_coletado')return 35
    if(codRas)return 20
    return 0
  }
  const pct      = rastreioPct()
  const originUF = rastreio?.origemUF||'SP'
  const destUF   = contato?.uf||rastreio?.destinoUF||''
  const curUF    = rastreio?.estadoAtual||destUF

  // steps rastreio visuais
  const STEPS = [
    {key:'postado',   label:'Postado',    icon:Package,  sids:[9,15,24,27,30,33]},
    {key:'coletado',  label:'Coletado',   icon:Truck,    sids:[27,30,33], rs:['pedido_coletado','em_transito','saiu_entrega','entregue']},
    {key:'transito',  label:'Em Trânsito',icon:Navigation,sids:[27,30,33], rs:['em_transito','saiu_entrega','entregue']},
    {key:'rota',      label:'Em Rota',    icon:MapPin,   sids:[30,33], rs:['saiu_entrega','entregue']},
    {key:'entregue',  label:'Entregue',   icon:CheckCircle,sids:[30,33], rs:['entregue']},
  ]
  const rs = rastreio?.ultimoStatus||pedRow?.rastreioStatus||''
  const stepDone = (s)=> s.sids.includes(sitId)||(s.rs&&s.rs.some(r=>rs===r||rs.includes(r.split('_')[0])))
  const stepAtivo = STEPS.findIndex((s,i)=>!stepDone(s)&&(i===0||stepDone(STEPS[i-1])))
  const stepAtivoIdx = stepAtivo===-1?STEPS.length-1:stepAtivo

  const cp=(v,k)=>{navigator.clipboard?.writeText(String(v||''));setCpOk(k);setTimeout(()=>setCpOk(''),1500)}
  const enviarNF=async()=>{
    const link=nfe?.linkDanfe||nfe?.linkPDF||''; if(!link||!pedRow.telefone)return
    setSend(true)
    const msg=`*Nota Fiscal — Pedido #${pedRow.numero}*\n\nSua NF-e foi emitida:\n${link}`
    await fetch(`${api}/api/dashboard/manual/${pedRow.telefone.replace(/\D/g,'')}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mensagem:msg})}).catch(()=>{})
    setSend(false);setStNF(true);setTimeout(()=>setStNF(false),2000)
  }
  const enviarMsg=async()=>{
    if(!msgTxt.trim()||!pedRow.telefone)return
    setSend(true)
    await fetch(`${api}/api/dashboard/manual/${pedRow.telefone.replace(/\D/g,'')}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mensagem:msgTxt})}).catch(()=>{})
    setSend(false);setMsgT('')
  }

  const S={
    sec:{background:'var(--bg-2)',border:'0.5px solid var(--sep)',borderRadius:12,padding:'12px 14px'},
    sub:{background:'var(--fill)',borderRadius:8,padding:'8px 10px'},
    lbl:{fontSize:9,color:'var(--label-4)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3},
    val:{fontSize:11,color:'var(--label)'},
    row:{display:'flex',alignItems:'center',gap:8},
  }
  const cc=CANAL_CFG[canal]||CANAL_CFG.bling; const CIc=cc.Logo||cc.icon

  return (
    <div style={{
      width:expanded?'100%':'920px', flexShrink:0,
      borderLeft:'0.5px solid var(--sep)',
      background:'var(--bg-2)',
      display:'flex',flexDirection:'column',
      overflowY:'auto',
      transition:'width .25s ease',
    }}>
      {/* HEADER */}
      <div style={{padding:'14px 20px',borderBottom:'0.5px solid var(--sep)',
        display:'flex',alignItems:'center',gap:10,flexShrink:0,
        background:`linear-gradient(135deg,${sit.cor}0c,transparent)`}}>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:20,fontWeight:700,color:sit.cor}}>#{ped.numero||pedRow.numero}</span>
            <SitBadge sitId={sitId}/>
            <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:9,fontWeight:600,padding:'2px 7px',borderRadius:99,color:cc.cor,background:`${cc.cor}18`,border:`0.5px solid ${cc.cor}40`}}>
              {CIc&&<CIc size={10}/>}{cc.label}
            </span>
            {riskScore>0&&<span style={{fontSize:9,fontWeight:600,padding:'1px 7px',borderRadius:99,color:riskCor,background:`${riskCor}18`,border:`0.5px solid ${riskCor}40`}}>
              Risco {riskLabel}
            </span>}
          </div>
          <div style={{fontSize:10,color:'var(--label-4)',marginTop:2}}>
            {fmtD(ped.data||pedRow.data)} · {ped.formaPagamento||ped.forma_pagamento||'—'} · {ped.nomeLoja||'Só Strass'}
          </div>
        </div>
        {codRas&&(
          <button onClick={()=>cp(codRas,'ras')} style={{padding:'5px 10px',borderRadius:7,border:'0.5px solid var(--sep)',background:'var(--fill)',cursor:'pointer',color:'var(--label-3)',fontSize:10,display:'flex',alignItems:'center',gap:4}}>
            {copied==='ras'?<Check size={11} style={{color:'#22c55e'}}/>:<Copy size={11}/>}
            {codRas.slice(0,20)}
          </button>
        )}
        <button onClick={()=>setExp(v=>!v)} title={expanded?"Compactar":"Expandir"} style={{padding:6,borderRadius:7,border:'0.5px solid var(--sep)',background:'var(--fill)',cursor:'pointer',color:'var(--label-3)',display:'flex'}}>
          <ArrowUpRight size={14} style={{transform:expanded?'rotate(180deg)':'none'}}/>
        </button>
        <button onClick={onClose} style={{background:'var(--fill)',border:'0.5px solid var(--sep)',borderRadius:8,padding:6,cursor:'pointer',color:'var(--label-3)',display:'flex'}}><X size={14}/></button>
      </div>

      {load?(
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--label-4)',gap:8}}>
          <RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/>Carregando...
        </div>
      ):(
        <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:14}}>

          {/* JORNADA + RASTREIO STEPS */}
          <div style={S.sec}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <span style={{fontSize:11,fontWeight:600,color:'var(--label)',display:'flex',alignItems:'center',gap:6}}>
                <Route size={12} style={{color:'#06b6d4'}}/>Jornada do Pedido
              </span>
              {codRas&&<span style={{fontSize:9,fontFamily:'monospace',color:'var(--label-3)'}}>{codRas}</span>}
            </div>
            {/* Steps visuais de rastreio */}
            <div style={{display:'flex',alignItems:'flex-start',gap:0}}>
              {STEPS.map((s,i)=>{
                const done=stepDone(s); const ativo=i===stepAtivoIdx; const Ic=s.icon
                return(
                  <div key={s.key} style={{display:'flex',alignItems:'center',flex:i<STEPS.length-1?1:'0 0 auto'}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                      <div style={{width:32,height:32,borderRadius:'50%',
                        background:done?`${sit.cor}18`:ativo?`${sit.cor}10`:'var(--fill)',
                        border:`2px solid ${done||ativo?sit.cor:'var(--sep)'}`,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        boxShadow:ativo?`0 0 0 4px ${sit.cor}18`:'none',
                        transition:'all .3s',flexShrink:0}}>
                        <Ic size={14} style={{color:done||ativo?sit.cor:'var(--label-4)'}}/>
                      </div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:9,fontWeight:ativo?700:done?500:400,color:done||ativo?sit.cor:'var(--label-4)',whiteSpace:'nowrap'}}>{s.label}</div>
                        {evts[STEPS.length-1-i]&&<div style={{fontSize:8,color:'var(--label-4)',whiteSpace:'nowrap'}}>{fmtD(evts[STEPS.length-1-i]?.data)}</div>}
                      </div>
                    </div>
                    {i<STEPS.length-1&&(
                      <div style={{flex:1,height:2,margin:'0 4px',marginBottom:20,background:done?sit.cor:'var(--sep)',transition:'background .3s'}}/>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Barra de progresso */}
            <div style={{marginTop:8}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                <span style={{fontSize:9,color:'var(--label-4)'}}>Progresso da entrega</span>
                <span style={{fontSize:10,fontWeight:700,color:pct===100?'#22c55e':'#06b6d4'}}>{pct}%</span>
              </div>
              <div style={{height:5,background:'var(--fill)',borderRadius:99,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:99,width:`${pct}%`,
                  background:pct===100?'#22c55e':'linear-gradient(90deg,#7c6af7,#4a9fff,#06b6d4)',
                  boxShadow:pct===100?'0 0 6px rgba(34,197,94,.5)':'0 0 6px rgba(6,182,212,.4)',
                  transition:'width .6s ease'}}/>
              </div>
            </div>
          </div>

          {/* MAPA DE ROTA (se tiver código de rastreio) */}
          {codRas&&(
            <div style={{...S.sec,padding:'10px 14px',background:'var(--bg)',border:'0.5px solid var(--sep)'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                <Navigation size={12} style={{color:'#06b6d4'}}/>
                <span style={{fontSize:11,fontWeight:600,color:'var(--label)'}}>Rota do pacote</span>
                {destUF&&<span style={{fontSize:9,color:'var(--label-4)',marginLeft:'auto'}}>{originUF} → {destUF}</span>}
              </div>
              <PackageMiniMap origem={originUF} destino={destUF||undefined} atual={curUF} pct={pct}/>
            </div>
          )}

          {/* 3 COLUNAS */}
          <div style={{display:'grid',gridTemplateColumns:expanded?'1fr 1fr 1fr 1fr':'1fr 1fr 1fr',gap:12}}>

            {/* COL 1 — DNA do Cliente */}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>

              {/* KPIs do pedido + análise financeira */}
              <div style={{...S.sec,background:`linear-gradient(135deg,${sit.cor}09,transparent)`,borderColor:`${sit.cor}28`}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  <div style={S.sub}>
                    <div style={S.lbl}>Total</div>
                    <div style={{fontSize:15,fontWeight:700,color:sit.cor}}>{fmt(ped.total||pedRow.total)}</div>
                    {ticketMed>0&&<div style={{fontSize:9,color:Number(vsMedia)>=0?'#22c55e':'#ef4444',marginTop:1}}>
                      {Number(vsMedia)>=0?'↑':'↓'}{Math.abs(Number(vsMedia))}% vs média
                    </div>}
                  </div>
                  <div style={S.sub}>
                    <div style={S.lbl}>Itens</div>
                    <div style={{fontSize:15,fontWeight:700,color:'var(--label)'}}>{itens.length||'—'}</div>
                  </div>
                  <div style={S.sub}>
                    <div style={S.lbl}>Frete</div>
                    <div style={{fontSize:13,color:'#22c55e'}}>{ped.frete>0?fmt(ped.frete):'Grátis'}</div>
                  </div>
                  <div style={S.sub}>
                    <div style={S.lbl}>Pagamento</div>
                    <div style={{fontSize:11,color:'#06b6d4',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ped.formaPagamento||ped.forma_pagamento||'—'}</div>
                  </div>
                </div>
                {/* Risk indicator */}
                {riskScore>0&&(
                  <div style={{marginTop:8,padding:'5px 8px',borderRadius:7,background:`${riskCor}12`,border:`0.5px solid ${riskCor}30`,display:'flex',alignItems:'center',gap:6}}>
                    <AlertTriangle size={11} style={{color:riskCor,flexShrink:0}}/>
                    <span style={{fontSize:10,color:riskCor}}>Risco {riskLabel}</span>
                    <div style={{flex:1,height:3,background:'var(--fill)',borderRadius:99,overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:99,width:`${Math.min(100,riskScore)}%`,background:riskCor}}/>
                    </div>
                    <span style={{fontSize:9,color:riskCor,flexShrink:0}}>{riskScore}%</span>
                  </div>
                )}
              </div>

              {/* Cliente DNA */}
              <div style={S.sec}>
                <div style={{...S.row,marginBottom:10}}>
                  <div style={{width:44,height:44,borderRadius:'50%',flexShrink:0,padding:3,
                    background:`conic-gradient(${rfmCfg.cor} ${Math.min(100,(hist.length+1)*12.5)}%, var(--sep) 0%)`}}>
                    <div style={{width:'100%',height:'100%',borderRadius:'50%',overflow:'hidden',
                      background:'linear-gradient(135deg,#7c6af7,#06b6d4)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      border:'2px solid var(--bg-2)'}}>
                      {foto
                        ?<img src={foto} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        :<span style={{fontSize:13,fontWeight:700,color:'#fff'}}>{(contato?.nome||pedRow.contato||'?').split(' ').map(w=>w[0]).slice(0,2).join('')}</span>}
                    </div>
                  </div>
                  <div style={{flex:1,overflow:'hidden'}}>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {contato?.nome||pedRow.contato||'—'}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:5,marginTop:3}}>
                      <span style={{fontSize:9,fontWeight:600,padding:'1px 6px',borderRadius:99,color:rfmCfg.cor,background:`${rfmCfg.cor}18`,border:`0.5px solid ${rfmCfg.cor}40`,display:'inline-flex',alignItems:'center',gap:2}}>
                        <RFMIcon size={8}/>{rfmCfg.label}
                      </span>
                      <span style={{fontSize:9,color:'var(--label-4)'}}>{hist.length+1} pedidos</span>
                    </div>
                  </div>
                </div>
                {/* Análise financeira do cliente */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
                  <div style={S.sub}><div style={S.lbl}>LTV Total</div><div style={{fontSize:12,fontWeight:600,color:'#22c55e'}}>{fmt(ltvTotal)}</div></div>
                  <div style={S.sub}><div style={S.lbl}>Ticket Médio</div><div style={{fontSize:12,fontWeight:600,color:'#7c6af7'}}>{fmt(ticketMed)}</div></div>
                  {(contato?.telefone||pedRow.telefone)&&<div style={{...S.sub,gridColumn:'span 2'}}>
                    <div style={S.lbl}>Telefone</div>
                    <div style={{...S.row,justifyContent:'space-between'}}>
                      <span style={S.val}>{contato?.telefone||pedRow.telefone}</span>
                      <button onClick={()=>cp(contato?.telefone||pedRow.telefone,'tel')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:0}}>
                        {copied==='tel'?<Check size={10} style={{color:'#22c55e'}}/>:<Copy size={10}/>}
                      </button>
                    </div>
                  </div>}
                  {(ped.enderecoEntrega||contato?.endereco)&&<div style={{...S.sub,gridColumn:'span 2'}}>
                    <div style={S.lbl}>Endereço</div>
                    <div style={{fontSize:10,color:'var(--label)',lineHeight:1.4}}>{ped.enderecoEntrega||contato?.endereco}</div>
                  </div>}
                </div>
              </div>

              {/* Produtos */}
              {itens.length>0&&(
                <div style={S.sec}>
                  <div style={{...S.row,marginBottom:8}}><Package size={12} style={{color:'#7c6af7'}}/><span style={{fontSize:11,fontWeight:600,color:'var(--label)'}}>Produtos</span></div>
                  <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    {itens.slice(0,4).map((it,i)=>(
                      <div key={i} style={{...S.sub,display:'flex',alignItems:'center',gap:8}}>
                        {it.foto&&<img src={it.foto} alt="" style={{width:32,height:32,borderRadius:6,objectFit:'cover',flexShrink:0,border:'0.5px solid var(--sep)'}} onError={e=>{e.target.style.display='none'}}/>}
                        <div style={{flex:1,overflow:'hidden'}}>
                          <div style={{fontSize:10,fontWeight:500,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.descricao||it.nome}</div>
                          <div style={{fontSize:9,color:'var(--label-4)'}}>{it.quantidade}× · {fmt(it.valor||0)}</div>
                        </div>
                        <span style={{fontSize:11,fontWeight:600,color:'var(--label)',flexShrink:0}}>{fmt((it.valor||0)*(it.quantidade||1))}</span>
                      </div>
                    ))}
                    {itens.length>4&&<div style={{fontSize:10,color:'var(--label-4)',textAlign:'center'}}>+{itens.length-4} mais</div>}
                  </div>
                  <div style={{borderTop:'0.5px solid var(--sep)',marginTop:8,paddingTop:8,display:'flex',justifyContent:'space-between',fontSize:12,fontWeight:700,color:'var(--label)'}}>
                    <span>Total</span><span style={{color:sit.cor}}>{fmt(ped.total||pedRow.total)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* COL 2 — Rastreio ao Vivo + NF-e Expandida */}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>

              {/* Rastreio ao vivo — todos os eventos */}
              <div style={S.sec}>
                <div style={{...S.row,marginBottom:10}}>
                  <Truck size={12} style={{color:'#06b6d4'}}/>
                  <span style={{fontSize:11,fontWeight:600,color:'var(--label)'}}>Rastreio ao Vivo</span>
                  {rastreio?.transportadora&&<span style={{marginLeft:'auto',fontSize:9,color:'var(--label-3)',background:'var(--fill)',padding:'2px 7px',borderRadius:99}}>{rastreio.transportadora}</span>}
                </div>
                {codRas?(
                  <div>
                    <div style={{...S.sub,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <span style={{fontSize:9,color:'var(--label-3)',fontFamily:'monospace'}}>{codRas}</span>
                      <button onClick={()=>cp(codRas,'cod')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:0}}>
                        {copied==='cod'?<Check size={10} style={{color:'#22c55e'}}/>:<Copy size={10}/>}
                      </button>
                    </div>
                    {linkRas&&<a href={linkRas} target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:'#7c6af7',marginBottom:8,textDecoration:'none'}}>
                      <ExternalLink size={10}/>Acompanhar rastreio externo
                    </a>}
                    {evts.length>0?(
                      <div style={{display:'flex',flexDirection:'column',gap:0,maxHeight:240,overflowY:'auto'}}>
                        {evts.map((ev,i)=>(
                          <div key={i} style={{display:'flex',gap:8,padding:'6px 0',borderBottom:i<evts.length-1?'0.5px solid var(--sep)':'none'}}>
                            <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0,marginTop:2}}>
                              <div style={{width:8,height:8,borderRadius:'50%',
                                background:i===0?'#06b6d4':'var(--sep)',
                                boxShadow:i===0?'0 0 5px #06b6d490':'none'}}/>
                              {i<evts.length-1&&<div style={{width:1,height:16,background:'var(--sep)',margin:'2px 0'}}/>}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:10,fontWeight:i===0?600:400,color:i===0?'#06b6d4':'var(--label-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                {ev.descricao||ev.evento}
                              </div>
                              <div style={{fontSize:9,color:'var(--label-4)'}}>{fmtDH(ev.data)} · {ev.local||ev.origem||''}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ):(rastreio?.ultimoEvento&&(
                      <div style={S.sub}>
                        <div style={{fontSize:9,color:'#06b6d4',fontWeight:600,marginBottom:2}}>Último evento</div>
                        <div style={{fontSize:10,color:'var(--label)'}}>{rastreio.ultimoEvento}</div>
                        {rastreio.dataUltimoEvento&&<div style={{fontSize:9,color:'var(--label-4)',marginTop:1}}>{fmtDH(rastreio.dataUltimoEvento)}</div>}
                      </div>
                    ))}
                  </div>
                ):(
                  <div style={{padding:'16px 0',textAlign:'center',fontSize:10,color:'var(--label-4)'}}>Sem código de rastreio</div>
                )}
              </div>

              {/* NF-e EXPANDIDA — todos os dados inline, sem botão */}
              <div style={{...S.sec,borderColor:nfe?.linkDanfe?'rgba(34,197,94,.25)':'rgba(245,158,11,.2)',background:nfe?.linkDanfe?'rgba(34,197,94,.03)':'rgba(245,158,11,.02)'}}>
                <div style={{...S.row,marginBottom:10}}>
                  <FileText size={12} style={{color:nfe?.linkDanfe?'#22c55e':'#f59e0b'}}/>
                  <span style={{fontSize:11,fontWeight:600,color:'var(--label)'}}>Nota Fiscal</span>
                  {nfe?.linkDanfe
                    ?<span style={{marginLeft:'auto',fontSize:9,color:'#22c55e',background:'rgba(34,197,94,.12)',border:'0.5px solid rgba(34,197,94,.3)',padding:'1px 7px',borderRadius:99}}>Emitida</span>
                    :<span style={{marginLeft:'auto',fontSize:9,color:'#f59e0b',background:'rgba(245,158,11,.1)',border:'0.5px solid rgba(245,158,11,.3)',padding:'1px 7px',borderRadius:99}}>Pendente</span>}
                </div>
                {nfe?.linkDanfe?(
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
                      <div style={S.sub}><div style={S.lbl}>Número</div><div style={S.val}>#{nfe.numero}</div></div>
                      <div style={S.sub}><div style={S.lbl}>Série</div><div style={S.val}>{nfe.serie||'1'}</div></div>
                    </div>
                    {nfe.chave&&(
                      <div style={S.sub}>
                        <div style={S.lbl}>Chave de Acesso</div>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{fontSize:9,color:'var(--label-3)',fontFamily:'monospace',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nfe.chave}</span>
                          <button onClick={()=>cp(nfe.chave,'nfe')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:0,flexShrink:0}}>
                            {copied==='nfe'?<Check size={10} style={{color:'#22c55e'}}/>:<Copy size={10}/>}
                          </button>
                        </div>
                      </div>
                    )}
                    <div style={{display:'flex',gap:6}}>
                      <a href={nfe.linkDanfe} target="_blank" rel="noopener noreferrer" style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontSize:10,color:'#7c6af7',padding:'6px',borderRadius:7,background:'rgba(124,106,247,.08)',border:'0.5px solid rgba(124,106,247,.2)',textDecoration:'none'}}>
                        <ExternalLink size={10}/>Ver DANFE
                      </a>
                      {(contato?.telefone||pedRow.telefone)&&(
                        <button onClick={enviarNF} disabled={sending||sentNF} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontSize:10,padding:'6px',borderRadius:7,cursor:'pointer',background:sentNF?'rgba(34,197,94,.1)':'rgba(34,197,94,.08)',border:`0.5px solid ${sentNF?'rgba(34,197,94,.3)':'rgba(34,197,94,.2)'}`,color:sentNF?'#22c55e':'#22c55e'}}>
                          {sentNF?<><Check size={10}/>Enviada!</>:<><Send size={10}/>Enviar WA</>}
                        </button>
                      )}
                    </div>
                  </div>
                ):(
                  <div>
                    <div style={{fontSize:10,color:'var(--label-4)',marginBottom:8}}>Situação: <span style={{color:sit.cor}}>{sit.label}</span></div>
                    {ped.enderecoEntrega&&<div style={S.sub}><div style={S.lbl}>Endereço de entrega</div><div style={{fontSize:10,color:'var(--label)',lineHeight:1.4}}>{ped.enderecoEntrega}</div></div>}
                  </div>
                )}
              </div>

              {/* Histórico financeiro */}
              {hist.length>0&&(
                <div style={S.sec}>
                  <div style={{...S.row,marginBottom:8}}><History size={12} style={{color:'#f59e0b'}}/><span style={{fontSize:11,fontWeight:600,color:'var(--label)'}}>Histórico</span><span style={{marginLeft:'auto',fontSize:9,color:'var(--label-4)'}}>{hist.length+1} pedidos</span></div>
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    <div style={{...S.sub,display:'flex',justifyContent:'space-between',alignItems:'center',background:`${sit.cor}12`,borderColor:`${sit.cor}35`,border:`0.5px solid ${sit.cor}35`}}>
                      <div><span style={{fontSize:10,fontWeight:600,color:sit.cor}}>#{pedRow.numero}</span><span style={{fontSize:9,color:'var(--label-4)',marginLeft:6}}>atual</span></div>
                      <span style={{fontSize:11,fontWeight:600,color:'var(--label)'}}>{fmt(pedRow.total)}</span>
                    </div>
                    {hist.slice(0,4).map((h,i)=>(
                      <div key={i} style={{...S.sub,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div><span style={{fontSize:10,color:'var(--label)'}}>{h.numero}</span><span style={{fontSize:9,color:'var(--label-4)',marginLeft:6}}>{fmtD(h.data)}</span></div>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:40,height:3,background:'var(--fill)',borderRadius:99,overflow:'hidden'}}>
                            <div style={{height:'100%',background:'#7c6af7',borderRadius:99,width:`${Math.min(100,(parseFloat(h.total||0)/Math.max(pedTotal,parseFloat(h.total||0),1)*100)).toFixed(0)}%`}}/>
                          </div>
                          <span style={{fontSize:11,fontWeight:600,color:'var(--label)'}}>{fmt(h.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COL 3 — WhatsApp inline + Disparos + AI */}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>

              {/* Conversa WhatsApp completa */}
              <div style={{...S.sec,padding:'12px'}}>
                <div style={{...S.row,justifyContent:'space-between',marginBottom:10}}>
                  <div style={S.row}><MessageSquare size={12} style={{color:'#22c55e'}}/><span style={{fontSize:11,fontWeight:600,color:'var(--label)'}}>WhatsApp</span></div>
                  {pedRow.statusAtendimento&&<span style={{fontSize:9,padding:'1px 7px',borderRadius:99,color:pedRow.statusAtendimento==='resolvido'?'#22c55e':'#f59e0b',background:pedRow.statusAtendimento==='resolvido'?'rgba(34,197,94,.12)':'rgba(245,158,11,.12)',border:`0.5px solid ${pedRow.statusAtendimento==='resolvido'?'rgba(34,197,94,.3)':'rgba(245,158,11,.3)'}`}}>{pedRow.statusAtendimento}</span>}
                </div>
                {msgs.length>0?(
                  <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:180,overflowY:'auto'}}>
                    {msgs.slice(-6).map((m,i)=>{
                      const isBot=m.role==='assistant'||m.direcao==='saida'
                      const isSys=m.tipo==='gatilho'||m.tipo==='sistema'
                      if(isSys)return <div key={i} style={{fontSize:9,color:'#06b6d4',background:'rgba(6,182,212,.06)',border:'0.5px solid rgba(6,182,212,.2)',borderRadius:6,padding:'3px 7px',textAlign:'center'}}>⚡ {m.conteudo||m.content}</div>
                      return(
                        <div key={i} style={{display:'flex',justifyContent:isBot?'flex-end':'flex-start'}}>
                          <div style={{maxWidth:'85%',padding:'5px 9px',borderRadius:isBot?'8px 8px 2px 8px':'8px 8px 8px 2px',background:isBot?'rgba(124,106,247,.12)':'var(--fill)',border:`0.5px solid ${isBot?'rgba(124,106,247,.25)':'var(--sep)'}`}}>
                            <div style={{fontSize:10,color:isBot?'#a78bfa':'var(--label)',lineHeight:1.4}}>{(m.conteudo||m.content||'').slice(0,120)}{(m.conteudo||m.content||'').length>120?'…':''}</div>
                            <div style={{fontSize:8,color:'var(--label-4)',textAlign:'right',marginTop:2}}>{isBot?'Bia · ':''}{fmtDH(m.createdAt||m.created_at||m.data)}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ):(
                  <div style={{fontSize:10,color:'var(--label-4)',textAlign:'center',padding:'10px 0'}}>{pedRow.telefone?'Sem mensagens':'Telefone não cadastrado'}</div>
                )}
                {pedRow.telefone&&(
                  <div style={{marginTop:8,display:'flex',gap:5}}>
                    <input value={msgTxt} onChange={e=>setMsgT(e.target.value)} onKeyDown={e=>e.key==='Enter'&&enviarMsg()} placeholder="Responder..." style={{flex:1,background:'var(--fill)',border:'0.5px solid var(--sep)',borderRadius:7,padding:'5px 8px',fontSize:10,color:'var(--label)',outline:'none'}}/>
                    <button onClick={enviarMsg} disabled={!msgTxt.trim()||sending} style={{padding:'5px 10px',borderRadius:7,border:'0.5px solid rgba(124,106,247,.4)',background:'rgba(124,106,247,.1)',color:'#7c6af7',cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',gap:4}}>
                      <Send size={10}/>
                    </button>
                  </div>
                )}
              </div>

              {/* Disparos */}
              {disps.length>0&&(
                <div style={S.sec}>
                  <div style={{...S.row,marginBottom:8}}><Send size={12} style={{color:'#a78bfa'}}/><span style={{fontSize:11,fontWeight:600,color:'var(--label)'}}>Gatilhos</span><span style={{marginLeft:'auto',fontSize:9,color:'var(--label-4)'}}>{disps.length}</span></div>
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    {disps.slice(0,5).map((d,i)=>(
                      <div key={i} style={{...S.sub,display:'flex',alignItems:'center',gap:7}}>
                        <div style={{width:6,height:6,borderRadius:'50%',flexShrink:0,background:d.status==='enviado'?'#22c55e':'#ef4444',boxShadow:d.status==='enviado'?'0 0 4px #22c55e80':'none'}}/>
                        <span style={{fontSize:10,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--label)'}}>{d.gatilho||d.tipo_gatilho}</span>
                        <span style={{fontSize:9,color:'var(--label-4)',flexShrink:0}}>{fmtD(d.created_at||d.criado_em)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recomendações IA */}
              <div style={{...S.sec,borderColor:'rgba(124,106,247,.3)',background:'rgba(124,106,247,.03)'}}>
                <div style={{...S.row,marginBottom:8}}>
                  <Brain size={12} style={{color:'#7c6af7'}}/>
                  <span style={{fontSize:11,fontWeight:600,color:'var(--label)'}}>Análise IA</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                  {[
                    riskScore>=40&&{cor:'#ef4444',msg:`Pedido há ${Math.floor(diasPedido)}d sem movimentação — verificar transportadora`},
                    hist.length>=3&&{cor:'#22c55e',msg:`Cliente fiel (${hist.length+1}× compras) — candidato a programa VIP`},
                    Number(vsMedia)>50&&{cor:'#f59e0b',msg:`Pedido ${vsMedia}% acima do ticket médio — validar se intencional`},
                    !codRas&&[9,15].includes(sitId)&&{cor:'#f97316',msg:`Pedido pago sem rastreio — adicionar código Correios`},
                    sitId===27&&diasPedido>10&&{cor:'#f59e0b',msg:`Em trânsito há ${Math.floor(diasPedido)}d — verificar entrega`},
                  ].filter(Boolean).slice(0,3).map((r,i)=>(
                    <div key={i} style={{fontSize:10,color:r.cor,background:`${r.cor}0c`,border:`0.5px solid ${r.cor}30`,borderRadius:7,padding:'6px 9px',lineHeight:1.4}}>
                      {r.msg}
                    </div>
                  ))}
                  {riskScore===0&&hist.length<3&&!codRas&&<div style={{fontSize:10,color:'var(--label-4)',textAlign:'center',padding:'8px 0'}}>Nenhuma recomendação no momento</div>}
                </div>
              </div>

              {/* Ações rápidas */}
              <div style={S.sec}>
                <div style={{...S.lbl,marginBottom:8}}>Ações rápidas</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  {[
                    {Ic:MessageSquare,label:'Conversa',cor:'#22c55e',href:pedRow.telefone?`https://wa.me/${pedRow.telefone}`:null},
                    {Ic:Send,label:'Disparar',cor:'#7c6af7'},
                    {Ic:ExternalLink,label:'Bling',cor:'#60a5fa',href:`https://app.bling.com.br/vendas.php#id=${pedRow.numero}`},
                    {Ic:Copy,label:'Copiar nº',cor:'var(--label-3)',onClick:()=>cp(pedRow.numero,'num')},
                  ].map(({Ic,label,cor,href,onClick})=>
                    href
                      ?<a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'7px',borderRadius:8,fontSize:11,color:cor,background:`${cor}18`,border:`0.5px solid ${cor}40`,cursor:'pointer',textDecoration:'none'}}><Ic size={12}/>{label}</a>
                      :<button key={label} onClick={onClick} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'7px',borderRadius:8,fontSize:11,color:cor,background:`${cor}18`,border:`0.5px solid ${cor}40`,cursor:'pointer'}}>
                        {label==='Copiar nº'&&copied==='num'?<Check size={12} style={{color:'#22c55e'}}/>:<Ic size={12}/>}{label}
                      </button>
                  )}
                </div>
              </div>

            </div>

            {/* COL 4 — só no modo expandido: análise de frete + mapa regiões */}
            {expanded&&(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <div style={S.sec}>
                  <div style={{...S.row,marginBottom:10}}>
                    <Timer size={12} style={{color:'#f59e0b'}}/>
                    <span style={{fontSize:11,fontWeight:600,color:'var(--label)'}}>Análise de Frete</span>
                  </div>
                  {det?.transpStats?.length>0?(
                    det.transpStats.map(t=>(
                      <div key={t.nome} style={{marginBottom:10}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                          <span style={{fontSize:10,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:130}}>{t.nome}</span>
                          <div style={{display:'flex',gap:8,flexShrink:0}}>
                            <span style={{fontSize:10,fontWeight:700,color:t.tempoMedio<=3?'#22c55e':t.tempoMedio<=7?'#f59e0b':'#ef4444'}}>{t.tempoMedio}d</span>
                            <span style={{fontSize:10,color:'var(--label-4)'}}>{fmt(t.custoMedio||0)}</span>
                          </div>
                        </div>
                        <div style={{height:5,background:'var(--fill)',borderRadius:99,overflow:'hidden'}}>
                          <div style={{height:'100%',borderRadius:99,width:`${Math.min(100,(t.tempoMedio/14)*100)}%`,background:t.tempoMedio<=3?'#22c55e':t.tempoMedio<=7?'#f59e0b':'#ef4444'}}/>
                        </div>
                        {t.taxaExtravio>0&&<div style={{fontSize:9,color:'#ef4444',marginTop:2}}>{t.taxaExtravio}% taxa de extravio</div>}
                      </div>
                    ))
                  ):(
                    <div style={{fontSize:10,color:'var(--label-4)',textAlign:'center',padding:'12px 0'}}>Dados de frete não disponíveis</div>
                  )}
                </div>
                {/* Mini mapa cliente */}
                <div style={S.sec}>
                  <div style={{...S.row,marginBottom:8}}><MapPin size={12} style={{color:'#22c55e'}}/><span style={{fontSize:11,fontWeight:600,color:'var(--label)'}}>Localização</span></div>
                  <PackageMiniMap origem={originUF} destino={destUF||undefined} atual={curUF} pct={pct}/>
                  <div style={{marginTop:8,display:'flex',gap:8,fontSize:9,color:'var(--label-4)'}}>
                    <span style={{display:'flex',alignItems:'center',gap:3}}><span style={{width:6,height:6,borderRadius:'50%',background:'#7c6af7',display:'inline-block'}}/> Origem: {originUF}</span>
                    {destUF&&<span style={{display:'flex',alignItems:'center',gap:3}}><span style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',display:'inline-block'}}/> Destino: {destUF}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PagePedidos({api}) {
  const [pedidos,   setPed]   = useState([])
  const [loading,   setLoad]  = useState(true)
  const [loadMore,  setLM]    = useState(false)
  const [pgAPI,     setPgAPI] = useState(1)
  const [temMais,    setTM]     = useState(true)
  const [totalBling, setTotalBling] = useState(0)
  const [busca,     setBusca] = useState('')
  const [filtroSit, setFS]    = useState('0')
  const [filtroC,   setFC]    = useState('todos')
  const [filtroTr,  setFTr]   = useState('todos')
  const [valMin,    setVMin]  = useState('')
  const [valMax,    setVMax]  = useState('')
  const [date,      setDate]  = useState({from:'',to:''})
  const [sortCol,   setSort]  = useState('numero')
  const [sortDir,   setSDir]  = useState('desc')
  const [pgUI,      setPgUI]  = useState(1)
  const [sel,       setSel]   = useState(null)
  const [view,      setView]  = useState('lista')
  const [showF,     setShowF] = useState(false)
  const [colCfg,    setColCfg]= useState(COLUNAS_PADRAO)
  const [showCols,  setShowCols]= useState(false)
  const [dragId,    setDragId]= useState(null)
  const [live,      setLive]  = useState(0)
  const searchRef = useRef(null)
  const POR_PAG = 25

  // Busca por número específico direto no backend
  const buscarPorNumero = useCallback(async(num)=>{
    setLoad(true)
    try{
      // Busca sem filtro de situação para achar qualquer pedido
      const numLimpo = num.replace(/\D/g,'')
      const r=await fetch(`${api}/api/dashboard/pedidos?numeroPedido=${numLimpo}&limite=5`)
      if(r.ok){
        const d=await r.json()
        const lista = d.pedidos||[]
        if(lista.length){
          setPed(lista)
          setFS('0') // reset filtro status para mostrar o resultado
          setBusca(numLimpo)
        } else {
          // Fallback: tenta como id do pedido no Bling
          const r2=await fetch(`${api}/api/dashboard/pedidos?numeroPedido=${numLimpo}&situacao=todos&limite=5`)
          if(r2.ok){const d2=await r2.json(); if(d2.pedidos?.length)setPed(d2.pedidos)}
        }
      }
    }catch{}
    setLoad(false)
  },[api])

  const carregar = useCallback(async(pg=1,acum=false)=>{
    if(pg===1)setLoad(true);else setLM(true)
    try{
      let url=`${api}/api/dashboard/pedidos?limite=100&pagina=${pg}`
      if(filtroSit!=='0') url+=`&situacao=${filtroSit}`
      if(date.from) url+=`&dataInicio=${date.from}`
      if(date.to)   url+=`&dataFim=${date.to}`
      const r=await fetch(url)
      if(r.ok){
        const d=await r.json()
        const n=d.pedidos||[]
        setPed(p=>acum?[...p,...n]:n)
        setTM(n.length>=100)
        setPgAPI(pg)
        if(d.total) setTotalBling(d.total)
      }
    }catch{}
    if(pg===1)setLoad(false);else setLM(false)
  },[api,filtroSit,date])

  useEffect(()=>{carregar(1,false);setPgUI(1)},[carregar])

  // Carrega a config de colunas salva no backend (config única do painel)
  useEffect(()=>{
    fetch(`${api}/api/dashboard/config-colunas`)
      .then(r=>r.ok?r.json():null)
      .then(c=>{ if(c&&c.ordem?.length) setColCfg({ordem:c.ordem, ativas:c.ativas||{}}) })
      .catch(()=>{})
  },[api])

  // Salva a config de colunas no backend
  const salvarColunas = useCallback(async(cfg)=>{
    setColCfg(cfg)
    try{
      await fetch(`${api}/api/dashboard/config-colunas`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cfg)
      })
    }catch{}
  },[api])

  // Colunas ativas, na ordem definida
  const colunasAtivas = useMemo(()=>
    colCfg.ordem.filter(id=>colCfg.ativas[id]!==false).map(id=>COLUNAS_DISP.find(c=>c.id===id)).filter(Boolean)
  ,[colCfg])

  useEffect(()=>{
    const h=(e)=>{
      if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();searchRef.current?.focus()}
      if(e.key==='Escape'&&document.activeElement===searchRef.current){searchRef.current?.blur();setBusca('')}
    }
    window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h)
  },[])

  useEffect(()=>{
    const t=setInterval(async()=>{
      try{const r=await fetch(`${api}/api/dashboard/live-activity`);if(r.ok){const d=await r.json();setLive(d.novos_10min||0)}}catch{}
    },30000)
    return()=>clearInterval(t)
  },[api])

  const exportCSV=()=>{
    const rows=[
      ['Pedido','Data','Cliente','Telefone','Canal','Status','Total','Transportadora','Rastreio','NF'],
      ...filtrados.map(p=>[p.numero,fmtD(p.data),p.contato||'',p.telefone||'',
        CANAL_CFG[getCanal(p)]?.label||'',SIT[getSitId(p)]?.label||'',
        parseFloat(p.total||0).toFixed(2),p.transportadora||'',
        p.codigoRastreio||'',p.notaFiscal?.numero||''])
    ]
    const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='pedidos.csv';a.click()
  }

  const filtrados = useMemo(()=>
    pedidos.filter(p=>{
      const c=getCanal(p),tot=parseFloat(p.total||0),sit=String(getSitId(p)),txt=busca.toLowerCase()
      const tr=(p.transportadora||'').toLowerCase()
      return (filtroC==='todos'||c===filtroC)&&(filtroSit==='0'||sit===filtroSit)
        &&(filtroTr==='todos'||tr.includes(filtroTr.toLowerCase()))
        &&(!busca||String(p.numero).includes(busca)||(p.contato||'').toLowerCase().includes(txt)||(p.telefone||'').includes(busca)||(p.codigoRastreio||'').toLowerCase().includes(txt)||((p.itens||[]).some(i=>(i.descricao||i.nome||'').toLowerCase().includes(txt))))
        &&(!valMin||tot>=parseFloat(valMin))&&(!valMax||tot<=parseFloat(valMax))
    }).sort((a,b)=>{
      const m=sortDir==='desc'?-1:1
      if(sortCol==='numero') return(b.numero-a.numero)*m
      if(sortCol==='total')  return(parseFloat(b.total||0)-parseFloat(a.total||0))*m
      if(sortCol==='data')   return(new Date(b.data)-new Date(a.data))*m
      return 0
    })
  ,[pedidos,filtroC,filtroTr,filtroSit,busca,valMin,valMax,sortCol,sortDir])

  // Lista de transportadoras presentes nos pedidos (para o filtro)
  const transportadoras = useMemo(()=>{
    const set = new Set()
    pedidos.forEach(p=>{ if(p.transportadora) set.add(p.transportadora) })
    return Array.from(set).sort()
  },[pedidos])

  const kpis=useMemo(()=>{
    const fat=filtrados.reduce((s,p)=>s+parseFloat(p.total||0),0)
    const abertos=filtrados.filter(p=>getSitId(p)===6).length
    const atendidos=filtrados.filter(p=>getSitId(p)===9).length
    const cancelados=filtrados.filter(p=>getSitId(p)===12).length
    const spark=Array(14).fill(0).map((_,i)=>{
      const d=new Date();d.setDate(d.getDate()-13+i)
      return filtrados.filter(p=>fmtD(p.data)===fmtD(d)).reduce((s,p)=>s+parseFloat(p.total||0),0)
    }).map(v=>Math.round(v/1000))
    return{fat,total:filtrados.length,abertos,atendidos,cancelados,ticket:filtrados.length>0?fat/filtrados.length:0,spark,
      taxaEnt:filtrados.length>0?Math.round(atendidos/filtrados.length*100):0}
  },[filtrados])

  const sitCounts = useMemo(()=>{
    const m={}; pedidos.forEach(p=>{const s=String(getSitId(p));m[s]=(m[s]||0)+1}); return m
  },[pedidos])
  const canalCounts = useMemo(()=>{
    const m={}; pedidos.forEach(p=>{const c=getCanal(p);m[c]=(m[c]||0)+1}); return m
  },[pedidos])

  const srt=(col)=>{ if(sortCol===col)setSDir(d=>d==='desc'?'asc':'desc');else{setSort(col);setSDir('desc')} }
  const SI=({col})=>sortCol!==col?<ChevronDown size={11} style={{opacity:.3}}/>:sortDir==='desc'?<ChevronDown size={11}/>:<ChevronUp size={11}/>
  const pg=filtrados.slice((pgUI-1)*POR_PAG,pgUI*POR_PAG)
  const totalPgs=Math.ceil(filtrados.length/POR_PAG)

  return <div style={{display:'flex',height:'100%',overflow:'hidden',background:'linear-gradient(160deg,var(--bg) 0%,var(--bg-2) 55%,var(--bg) 100%)',position:'relative'}}>
    <div style={{position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,106,247,.05),transparent 70%)',top:-200,left:-100,pointerEvents:'none',zIndex:0}}/>
    <div style={{position:'absolute',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(6,182,212,.04),transparent 70%)',bottom:-100,right:0,pointerEvents:'none',zIndex:0}}/>

    {/* ── Sidebar filtros ── */}
    <div style={{width:showF?240:0,flexShrink:0,overflow:'hidden',transition:'width .2s',
      borderRight:'1px solid var(--sep)',background:'var(--bg-2)',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'14px 16px',borderBottom:'1px solid var(--sep)',
        display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
        <span style={{fontSize:12,fontWeight:700,color:'var(--label)',display:'flex',alignItems:'center',gap:6}}>
          <Filter size={12}/>Filtros
        </span>
        <button onClick={()=>setShowF(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:2}}><X size={14}/></button>
      </div>
      <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:14,overflowY:'auto'}}>
        {/* Período rápido */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8,
            display:'flex',alignItems:'center',gap:5}}><Calendar size={10}/>Período</div>
          {[['hoje','Hoje'],['7d','Últimos 7 dias'],['30d','Últimos 30 dias'],['90d','Últimos 90 dias']].map(([v,l])=>(
            <button key={v} onClick={()=>{const d=new Date();const f=new Date(d);
              if(v==='hoje')f.setDate(d.getDate());
              else if(v==='7d')f.setDate(d.getDate()-7);
              else if(v==='30d')f.setDate(d.getDate()-30);
              else f.setDate(d.getDate()-90);
              setDate({from:f.toISOString().split('T')[0],to:''})}}
              style={{display:'block',width:'100%',textAlign:'left',padding:'6px 8px',borderRadius:7,
                border:'none',background:'none',cursor:'pointer',fontSize:12,color:'var(--label-3)',marginBottom:2}}
              onMouseEnter={e=>e.target.style.background='var(--fill)'}
              onMouseLeave={e=>e.target.style.background='none'}>{l}</button>
          ))}
          <div style={{display:'flex',gap:6,marginTop:4}}>
            <input type="date" value={date.from} onChange={e=>setDate(d=>({...d,from:e.target.value}))}
              style={{flex:1,padding:'5px',borderRadius:7,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:10}}/>
            <input type="date" value={date.to} onChange={e=>setDate(d=>({...d,to:e.target.value}))}
              style={{flex:1,padding:'5px',borderRadius:7,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:10}}/>
          </div>
        </div>
        {/* Canal */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8,
            display:'flex',alignItems:'center',gap:5}}><Globe size={10}/>Canal</div>
          {[['todos','Todos',null],...Object.entries(CANAL_CFG).map(([k,v])=>[k,v.label,v.Logo])].map(([v,l,Ic])=>(
            <button key={v} onClick={()=>setFC(v)} style={{
              display:'flex',alignItems:'center',gap:7,width:'100%',textAlign:'left',
              padding:'5px 8px',borderRadius:7,border:'none',marginBottom:2,cursor:'pointer',fontSize:12,
              background:filtroC===v?'var(--fill)':'none',color:filtroC===v?'var(--label)':'var(--label-3)'}}>
              {Ic&&<Ic size={11} style={{flexShrink:0}}/>}{l}
            </button>
          ))}
        </div>
        {/* Faixa de valor */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8,
            display:'flex',alignItems:'center',gap:5}}><Truck size={10}/>Transportadora</div>
          <select value={filtroTr} onChange={e=>setFTr(e.target.value)}
            style={{width:'100%',padding:'6px 8px',borderRadius:7,border:'1px solid var(--sep)',
              background:'var(--fill)',color:'var(--label)',fontSize:12,marginBottom:14,cursor:'pointer'}}>
            <option value="todos">Todas</option>
            {transportadoras.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {/* Faixa de valor */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8,
            display:'flex',alignItems:'center',gap:5}}><DollarSign size={10}/>Faixa de valor</div>
          <div style={{display:'flex',gap:6}}>
            <input placeholder="Mín" value={valMin} onChange={e=>setVMin(e.target.value)}
              style={{flex:1,padding:'5px 7px',borderRadius:7,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:11}}/>
            <input placeholder="Máx" value={valMax} onChange={e=>setVMax(e.target.value)}
              style={{flex:1,padding:'5px 7px',borderRadius:7,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:11}}/>
          </div>
        </div>
        {(filtroC!=='todos'||filtroTr!=='todos'||filtroSit!=='0'||busca||valMin||valMax||date.from)&&(
          <button onClick={()=>{setFC('todos');setFTr('todos');setFS('0');setBusca('');setVMin('');setVMax('');setDate({from:'',to:''})}}
            style={{padding:'7px',borderRadius:8,border:'1px solid rgba(239,68,68,.3)',
              background:'none',color:'#ef4444',cursor:'pointer',fontSize:12,
              display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
            <X size={12}/>Limpar filtros
          </button>
        )}
      </div>
    </div>

    {/* ── Área principal ── */}
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* Topbar */}
      <div style={{padding:'10px 16px',borderBottom:'1px solid var(--sep)',
        display:'flex',alignItems:'center',gap:8,flexShrink:0,flexWrap:'wrap'}}>
        <button onClick={()=>setShowF(f=>!f)} style={{
          display:'flex',alignItems:'center',gap:5,padding:'6px 11px',borderRadius:8,
          border:'1px solid var(--sep)',background:showF?'var(--fill)':'none',
          color:'var(--label-3)',cursor:'pointer',fontSize:12}}>
          <Filter size={13}/>Filtros
          {(filtroC!=='todos'||filtroSit!=='0'||valMin||valMax||date.from)&&
            <div style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)'}}/>}
        </button>
        {/* Canal pills com logos SVG + contagem */}
        <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0,flexWrap:'nowrap'}}>
          <button onClick={()=>setFC('todos')} style={{display:'flex',alignItems:'center',gap:3,padding:'4px 9px',borderRadius:99,border:`1px solid ${filtroC==='todos'?'var(--accent)':'var(--sep)'}`,background:filtroC==='todos'?'var(--fill)':'none',cursor:'pointer',fontSize:10,fontWeight:filtroC==='todos'?600:400,color:filtroC==='todos'?'var(--label)':'var(--label-4)',whiteSpace:'nowrap'}}>
            Todos{pedidos.length>0&&<span style={{fontSize:9,color:'var(--label-4)',marginLeft:3}}>{pedidos.length}</span>}
          </button>
          {Object.entries(CANAL_CFG).filter(([k])=>canalCounts[k]>0).map(([k,cfg])=>{
            const Logo=CANAL_LOGO[k]||LogoBling; const ativo=filtroC===k
            return(
              <button key={k} onClick={()=>setFC(ativo?'todos':k)} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:99,border:`1px solid ${ativo?cfg.cor:'var(--sep)'}`,background:ativo?`${cfg.cor}18`:'none',cursor:'pointer',fontSize:10,fontWeight:ativo?600:400,color:ativo?cfg.cor:'var(--label-4)',whiteSpace:'nowrap',transition:'all .15s'}}>
                <Logo size={12}/>{cfg.label.split(' ')[0]}<span style={{fontSize:9,color:ativo?cfg.cor:'var(--label-4)',marginLeft:1}}>{canalCounts[k]}</span>
              </button>
            )
          })}
        </div>
        {/* Busca */}
        <div style={{position:'relative',flex:'1 1 200px',maxWidth:300}}>
          <Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',
            color:'var(--label-4)',pointerEvents:'none'}}/>
          <input ref={searchRef} value={busca} onChange={e=>{
          const v=e.target.value; setBusca(v); setPgUI(1)
          // Se é número, busca direto no backend
          const num=v.replace(/[^\d]/g,'')
          if(num.length>=5) buscarPorNumero(num)
          else if(!v) carregar(1,false)
        }}
            placeholder="Buscar pedido, cliente, produto, rastreio… ⌘K"
            style={{width:'100%',padding:'6px 10px 6px 30px',borderRadius:8,
              border:'1px solid var(--sep)',background:'var(--fill)',
              color:'var(--label)',fontSize:12,boxSizing:'border-box'}}/>
          {busca
            ?<button onClick={()=>setBusca('')} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:0}}><X size={12}/></button>
            :<kbd style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',fontSize:9,color:'var(--label-4)',background:'var(--fill)',border:'1px solid var(--sep)',borderRadius:4,padding:'1px 5px',pointerEvents:'none'}}>⌘K</kbd>}
        </div>
        {/* Filtro status rápido */}
        <div style={{display:'flex',gap:3}}>
          {[['0','Todos',null],['6','Aberto','#f59e0b'],['9','Atendido','#4a9fff'],['27','Enviado','#06b6d4'],['30','Entregue','#22c55e'],['12','Cancelado','#ef4444']].map(([v,l,cor])=>{
            const n=v==='0'?pedidos.length:(sitCounts[v]||0)
            const ativo=filtroSit===v
            return(
              <button key={v} onClick={()=>{setFS(v);setPgUI(1)}} style={{
                display:'flex',alignItems:'center',gap:4,
                padding:'4px 9px',borderRadius:99,
                border:`1px solid ${ativo?(cor||'var(--accent)'):'var(--sep)'}`,
                background:ativo?(cor?`${cor}18`:'var(--fill)'):'none',
                color:ativo?(cor||'var(--accent)'):'var(--label-4)',
                cursor:'pointer',fontSize:11,fontWeight:ativo?700:400,
                transition:'all .15s',whiteSpace:'nowrap'}}>
                {l}
                {n>0&&<span style={{fontSize:9,fontWeight:700,color:ativo?(cor||'var(--accent)'):'var(--label-4)',background:ativo?`${cor||'#888'}20`:'var(--fill)',borderRadius:99,padding:'0 4px',minWidth:16,textAlign:'center'}}>{n}</span>}
              </button>
            )
          })}
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:6,alignItems:'center'}}>
          {live>0&&<div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',
            borderRadius:99,background:'rgba(124,106,247,.12)',border:'1px solid rgba(124,106,247,.3)',
            fontSize:11,color:'#7c6af7'}}>
            <Bell size={11}/>{live} novos
          </div>}
          {[{id:'lista',I:Layers,t:'Lista'},{id:'kanban',I:BarChart3,t:'Kanban'},{id:'analytics',I:Activity,t:'Analytics'}].map(v=>(
            <button key={v.id} onClick={()=>setView(v.id)} title={v.t} style={{
              width:32,height:32,borderRadius:8,border:'1px solid var(--sep)',display:'flex',alignItems:'center',justifyContent:'center',
              background:view===v.id?'var(--fill)':'none',color:view===v.id?'var(--accent)':'var(--label-4)',cursor:'pointer'}}>
              <v.I size={15}/>
            </button>
          ))}
          <button onClick={exportCSV} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 11px',
            borderRadius:8,border:'1px solid var(--sep)',background:'none',color:'var(--label-3)',cursor:'pointer',fontSize:12}}>
            <Download size={13}/>CSV
          </button>
          <button onClick={()=>setShowCols(s=>!s)} title="Colunas" style={{width:32,height:32,borderRadius:8,
            border:'1px solid var(--sep)',background:showCols?'var(--fill)':'none',color:showCols?'var(--accent)':'var(--label-4)',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Settings size={14}/>
          </button>
          <button onClick={()=>carregar(1,false)} style={{width:32,height:32,borderRadius:8,
            border:'1px solid var(--sep)',background:'none',color:'var(--label-4)',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <RefreshCw size={14} style={loading?{animation:'spin 1s linear infinite'}:{}}/>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',
        gap:10,padding:'10px 16px',borderBottom:'1px solid var(--sep)',flexShrink:0}}>
        <KCard icon={DollarSign} label="Faturamento"  value={fmt(kpis.fat)}               cor="#7c6af7" spark={kpis.spark}/>
        <KCard icon={ShoppingCart}label="Total"       value={kpis.total}                   cor="#06b6d4"/>
        <KCard icon={Clock}       label="Em aberto"   value={kpis.abertos}                cor="#f59e0b" alert={kpis.abertos>20}/>
        <KCard icon={CheckCircle} label="Atendidos"   value={kpis.atendidos}              cor="#22c55e" sub={`${kpis.taxaEnt}% do total`}/>
        <KCard icon={TrendingUp}  label="Ticket médio"value={fmt(kpis.ticket)}             cor="#a78bfa"/>
        <KCard icon={AlertCircle} label="Cancelados"  value={kpis.cancelados}             cor="#ef4444"/>
      </div>

      {/* Alertas */}
      <AlertBar pedidos={pedidos}/>

      {/* Conteúdo */}
      <div style={{flex:1,overflowY:'auto',padding:'12px 16px'}}>
        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,
            color:'var(--label-4)',gap:12,fontSize:14}}>
            <RefreshCw size={20} style={{animation:'spin 1s linear infinite'}}/>Carregando pedidos...
          </div>
        ) : view==='analytics' ? <AnalyticsView pedidos={filtrados} api={api}/>
          : view==='kanban'    ? <KanbanView filtrados={filtrados} onSel={setSel}/>
          : <>
            {showCols&&<div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'14px 16px',marginBottom:12}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                <div style={{fontSize:13,fontWeight:700,color:'var(--label)'}}>Colunas customizadas</div>
                <button onClick={()=>setShowCols(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',display:'flex'}}><X size={15}/></button>
              </div>
              <div style={{fontSize:11,color:'var(--label-4)',marginBottom:12}}>Selecione quais colunas ficam visiveis e arraste para reordenar. A config e salva automaticamente.</div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                {colCfg.ordem.map(id=>{
                  const c=COLUNAS_DISP.find(x=>x.id===id); if(!c) return null
                  const ativa=colCfg.ativas[id]!==false
                  return <div key={id} draggable
                    onDragStart={()=>setDragId(id)}
                    onDragOver={e=>e.preventDefault()}
                    onDrop={()=>{
                      if(!dragId||dragId===id){setDragId(null);return}
                      const ord=[...colCfg.ordem]
                      const from=ord.indexOf(dragId),to=ord.indexOf(id)
                      ord.splice(from,1);ord.splice(to,0,dragId)
                      salvarColunas({...colCfg,ordem:ord});setDragId(null)
                    }}
                    style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,background:dragId===id?'var(--fill)':'var(--bg)',border:'1px solid var(--sep)',cursor:'grab',opacity:ativa?1:.5}}>
                    <GripVertical size={14} style={{color:'var(--label-4)',flexShrink:0}}/>
                    <span style={{flex:1,fontSize:12.5,color:'var(--label)'}}>{c.label}</span>
                    <button onClick={()=>salvarColunas({...colCfg,ativas:{...colCfg.ativas,[id]:!ativa}})} style={{width:38,height:21,borderRadius:99,border:'none',cursor:'pointer',position:'relative',background:ativa?'#22c55e':'var(--sep)',transition:'.15s',flexShrink:0}}>
                      <div style={{position:'absolute',top:2,left:ativa?19:2,width:17,height:17,borderRadius:'50%',background:'#fff',transition:'.15s'}}/>
                    </button>
                  </div>
                })}
              </div>
            </div>}
            <div style={{display:'grid',gridTemplateColumns:colunasAtivas.map(c=>c.largura).join(' ')+' 56px',gap:0,padding:'5px 8px',marginBottom:4}}>
              {colunasAtivas.map(c=>{
                const sortable=['numero','data','total'].includes(c.id)
                return <div key={c.id} onClick={sortable?()=>srt(c.id):undefined} style={{display:'flex',alignItems:'center',gap:3,fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.05em',cursor:sortable?'pointer':'default',userSelect:'none',padding:'0 6px'}}>
                  {c.label}{sortable&&<SI col={c.id}/>}
                </div>
              })}
              <div/>
            </div>
            <div style={{display:'none',gridTemplateColumns:'80px 80px 1fr 100px 85px 90px 130px 56px',gap:0,padding:'5px 8px',marginBottom:4}}>
              {[['Pedido','numero'],['Data','data'],['Cliente','contato'],['Canal',null],['Status',null],['Total','total'],['Transp / Rastreio',null],[null,null]].map(([h,col],i)=>(
                <div key={i} onClick={col?()=>srt(col):undefined} style={{
                  display:'flex',alignItems:'center',gap:3,fontSize:10,fontWeight:700,
                  color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.05em',
                  cursor:col?'pointer':'default',userSelect:'none',padding:'0 6px'}}>
                  {h}{col&&<SI col={col}/>}
                </div>
              ))}
            </div>
            {/* Linhas */}
            {pg.length===0
              ? <div style={{textAlign:'center',padding:60,color:'var(--label-4)',fontSize:13}}>
                  <Package size={36} style={{opacity:.15,marginBottom:12}}/><br/>Nenhum pedido encontrado.
                </div>
              : pg.map(p=>{
                const canal=getCanal(p),sid=getSitId(p),s=SIT[sid]||{label:'—',cor:'#888',bg:'var(--fill)'}
                const temRas=!!(p.codigoRastreio||p.transporte?.volumes?.[0]?.codigoRastreamento)
                const temNF=!!p.notaFiscal?.id
                const cod=p.codigoRastreio||p.transporte?.volumes?.[0]?.codigoRastreamento||''
                const cell=(colId)=>{
                  switch(colId){
                    case 'numero':   return <span style={{fontSize:12.5,fontWeight:700,color:'var(--label)'}}>{p.numero}</span>
                    case 'serie':    return <span style={{fontSize:11,color:'var(--label-4)'}}>{p.serie||p.notaFiscal?.serie||'—'}</span>
                    case 'data':     return <span style={{fontSize:11,color:'var(--label-4)'}}>{fmtD(p.data)}</span>
                    case 'dataSaida':return <span style={{fontSize:11,color:'var(--label-4)'}}>{fmtD(p.dataSaida)||'—'}</span>
                    case 'contato':  return <div style={{overflow:'hidden'}}><div style={{fontSize:12.5,fontWeight:500,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.contato||'—'}</div>{p.telefone&&<div style={{fontSize:10,color:'var(--label-4)'}}>{p.telefone}</div>}</div>
                    case 'documento':return <span style={{fontSize:11,color:'var(--label-3)'}}>{p.documento||p.cpfCnpj||p.contatoDoc||'—'}</span>
                    case 'natureza': return <span style={{fontSize:10.5,color:'var(--label-4)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}} title={p.naturezaOperacao||''}>{p.naturezaOperacao||'—'}</span>
                    case 'uf':       return <span style={{fontSize:11,color:'var(--label-3)'}}>{p.uf||p.transporte?.etiqueta?.uf||'—'}</span>
                    case 'canal':    return <CanalBadge canal={canal} small/>
                    case 'status':   return <Pill label={s.label} cor={s.cor} bg={s.bg} sz={10}/>
                    case 'produto':  return <div style={{display:'flex',gap:2}}>
                      {(p.itens||[]).slice(0,3).map((it,i)=><ProductThumb key={i} item={it} size={24}/>)}
                      {(p.itens||[]).length>3&&<div style={{width:24,height:24,borderRadius:4,background:'var(--fill)',border:'0.5px solid var(--sep)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,color:'var(--label-4)'}}>+{(p.itens||[]).length-3}</div>}
                      {!(p.itens||[]).length&&<span style={{fontSize:10,color:'var(--label-4)'}}>—</span>}
                    </div>
                    case 'transp':   return <span style={{fontSize:10.5,color:'var(--label-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}} title={p.transportadora||''}>{p.transportadora||'—'}</span>
                    case 'rastreio': return cod?<div style={{display:'flex',alignItems:'center',gap:4,minWidth:0}}><Truck size={10} style={{color:'#22c55e',flexShrink:0}}/><span style={{fontSize:9.5,fontFamily:'monospace',color:'var(--label-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:88}} title={cod}>{cod}</span><button onClick={e=>{e.stopPropagation();navigator.clipboard?.writeText(cod)}} title="Copiar" style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:0,display:'flex',alignItems:'center'}}><Copy size={9}/></button></div>:<span style={{fontSize:10,color:'var(--label-4)'}}>—</span>
                    case 'total':    return <span style={{fontSize:12.5,fontWeight:700,color:'var(--label)'}}>{fmt(p.total)}</span>
                    default:         return null
                  }
                }
                return <div key={p.numero} onClick={()=>setSel(p)} style={{
                  display:'grid',gridTemplateColumns:colunasAtivas.map(x=>x.largura).join(' ')+' 56px',
                  gap:0,padding:'9px 8px',marginBottom:3,background:'var(--bg-2)',
                  border:'1px solid var(--sep)',borderRadius:10,cursor:'pointer',
                  transition:'border-color .12s',alignItems:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=s.cor}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--sep)'}>
                  {colunasAtivas.map(col=><div key={col.id} style={{padding:'0 6px',minWidth:0}}>{cell(col.id)}</div>)}
                  {/* coluna fixa antiga abaixo (oculta) */}
                  <div style={{display:'none'}}>
                  <div style={{padding:'0 6px'}}><span style={{fontSize:12.5,fontWeight:700,color:'var(--label)'}}>{p.numero}</span></div>
                  <div style={{padding:'0 6px'}}><span style={{fontSize:11,color:'var(--label-4)'}}>{fmtD(p.data)}</span></div>
                  <div style={{padding:'0 6px',overflow:'hidden'}}>
                    <div style={{fontSize:12.5,fontWeight:500,color:'var(--label)',
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.contato||'—'}</div>
                    {p.telefone&&<div style={{fontSize:10,color:'var(--label-4)'}}>{p.telefone}</div>}
                  </div>
                  <div style={{padding:'0 6px'}}><CanalBadge canal={canal} small/></div>
                  <div style={{padding:'0 6px'}}><Pill label={s.label} cor={s.cor} bg={s.bg} sz={10}/></div>
                  <div style={{padding:'0 6px'}}><span style={{fontSize:12.5,fontWeight:700,color:'var(--label)'}}>{fmt(p.total)}</span></div>
                  <div style={{display:'flex',flexDirection:'column',gap:3,padding:'0 6px',minWidth:0}}>
                    {p.codigoRastreio ? (
                      <div style={{display:'flex',alignItems:'center',gap:4,minWidth:0}}>
                        <Truck size={10} style={{color:'#22c55e',flexShrink:0}}/>
                        <span style={{fontSize:9.5,fontFamily:'monospace',color:'var(--label-3)',
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:88}}
                          title={p.codigoRastreio}>{p.codigoRastreio}</span>
                        <button onClick={e=>{e.stopPropagation();navigator.clipboard?.writeText(p.codigoRastreio)}}
                          title="Copiar" style={{flexShrink:0,background:'none',border:'none',
                            cursor:'pointer',color:'var(--label-4)',padding:0,display:'flex',alignItems:'center'}}>
                          <Copy size={9}/>
                        </button>
                      </div>
                    ) : (
                      <span style={{fontSize:10,color:'var(--label-4)'}}>—</span>
                    )}
                    {p.transportadora&&(
                      <span style={{fontSize:9,color:'var(--label-4)',overflow:'hidden',
                        textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:120}}
                        title={p.transportadora}>{p.transportadora}</span>
                    )}
                    {p.notaFiscal?.id>0&&!p.codigoRastreio&&(
                      <div style={{display:'flex',alignItems:'center',gap:3}}>
                        <FileText size={9} style={{color:'#4a9fff',flexShrink:0}}/>
                        <span style={{fontSize:9,color:'#4a9fff'}}>NF</span>
                      </div>
                    )}
                  </div>
                  </div>{/* fim div-none células antigas */}
                  <div style={{padding:'0 4px',display:'flex',justifyContent:'center',alignItems:'center',gap:6}}>
                    {p.telefone&&<button
                      onClick={e=>{e.stopPropagation();window.open(`https://wa.me/${String(p.telefone).replace(/\D/g,'')}`,'_blank')}}
                      title="Falar no WhatsApp"
                      style={{background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center'}}>
                      <MessageCircle size={13} style={{color:'#22c55e'}}/>
                    </button>}
                    <Eye size={13} style={{color:'var(--label-4)'}}/>
                  </div>
                </div>
              })
            }
            {/* Paginação */}
            {totalPgs>1&&<div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,marginTop:14,paddingBottom:8}}>
              <button onClick={()=>setPgUI(p=>Math.max(1,p-1))} disabled={pgUI===1}
                style={{padding:'5px 10px',borderRadius:8,border:'1px solid var(--sep)',
                  background:'var(--fill)',cursor:pgUI===1?'not-allowed':'pointer',
                  color:'var(--label-3)',opacity:pgUI===1?0.5:1,display:'flex',alignItems:'center'}}>
                <ChevronLeft size={14}/>
              </button>
              <span style={{fontSize:11,color:'var(--label-4)',userSelect:'none'}}>
                {pgUI}/{totalPgs} · <strong style={{color:'var(--label)'}}>{filtrados.length}</strong> pedidos
                {totalBling>0&&<span style={{marginLeft:4,opacity:.6}}>de {totalBling} no Bling</span>}
              </span>
              <button onClick={()=>setPgUI(p=>Math.min(totalPgs,p+1))} disabled={pgUI===totalPgs}
                style={{padding:'5px 10px',borderRadius:8,border:'1px solid var(--sep)',
                  background:'var(--fill)',cursor:pgUI===totalPgs?'not-allowed':'pointer',
                  color:'var(--label-3)',opacity:pgUI===totalPgs?0.5:1,display:'flex',alignItems:'center'}}>
                <ChevronRight size={14}/>
              </button>
              {temMais&&pgUI===totalPgs&&(
                <button onClick={()=>carregar(pgAPI+1,true)} disabled={loadMore}
                  style={{padding:'5px 12px',borderRadius:8,border:'1px solid var(--sep)',
                    background:'var(--fill)',cursor:loadMore?'not-allowed':'pointer',
                    color:'var(--label-3)',fontSize:11,display:'flex',alignItems:'center',gap:5,
                    opacity:loadMore?0.5:1}}>
                  {loadMore ? <><RefreshCw size={11} style={{animation:'spin 1s linear infinite'}}/>Carregando...</> : <>+ Carregar 100</>}
                </button>
              )}
            </div>}
          </>
        }
      </div>
    </div>

    {sel&&<SmartOrderCard pedRow={sel} onClose={()=>setSel(null)} api={api} allPedidos={pedidos}/>}
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
}
