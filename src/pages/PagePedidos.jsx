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
  ShoppingBag, MessageCircle, GripVertical, Settings,
  Flame, Shield, Sparkles, Cpu, Heart, RotateCcw, ArrowRight,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'

// ─── MAPAS ────────────────────────────────────────────────────────────────────
const LOJA_ID = {
  205946980:'shopee', 203414926:'mercadolivre', 204884434:'shein',
  205916963:'tiktokshop', 205693668:'nuvemshop', 0:'loja',
}
const CANAL_CFG = {
  shopee:       {label:'Shopee',       cor:'#ee4d2d', icon:ShoppingBag},
  mercadolivre: {label:'Mercado Livre',cor:'#ffe600', icon:ShoppingCart},
  shein:        {label:'Shein',        cor:'#000000', icon:ShoppingBag},
  tiktokshop:   {label:'TikTok',       cor:'#25f4ee', icon:ShoppingBag},
  nuvemshop:    {label:'Nuvemshop',    cor:'#a78bfa', icon:Globe},
  loja:         {label:'Loja Própria', cor:'#22c55e', icon:Building},
  bling:        {label:'Bling/Manual', cor:'#60a5fa', icon:Hash},
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
  {id:'contato',   label:'Nome',            largura:'1fr'},
  {id:'documento', label:'CPF/CNPJ',        largura:'120px'},
  {id:'natureza',  label:'Natureza op.',    largura:'110px'},
  {id:'uf',        label:'UF',              largura:'45px'},
  {id:'canal',     label:'Canal',           largura:'100px'},
  {id:'status',    label:'Status',          largura:'85px'},
  {id:'transp',    label:'Transportadora',  largura:'110px'},
  {id:'rastreio',  label:'Nº Rastreio',     largura:'130px'},
  {id:'total',     label:'Valor (R$)',      largura:'90px'},
  {id:'fulfillment', label:'Fulfillment',   largura:'75px'},
  {id:'risco',       label:'Risco',         largura:'70px'},
]
// Config padrão (caso não haja nada salvo no backend)
const COLUNAS_PADRAO = {
  ordem: ['numero','data','contato','canal','status','fulfillment','total','rastreio'],
  ativas: {numero:true,data:true,contato:true,canal:true,status:true,fulfillment:true,total:true,rastreio:true,risco:false},
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


// ─── HELPERS NIVELMAX ─────────────────────────────────────────────────────────

// Fulfillment Score 0-100
function calcFulfillmentScore(p, disps=[], nfe=null, rastreio=null) {
  let s = 0
  const sitId = getSitId(p)
  if (nfe?.numero || p.notaFiscal?.id) s += 25
  if (disps.some(d => d.status === 'enviado')) s += 25
  if (rastreio?.codigo || p.codigoRastreio) s += 25
  if ([15,30].includes(sitId) || String(p.situacao||'').toLowerCase().includes('verif')) s += 25
  return s
}

// Delivery Risk Score 0-100 (heurístico por transportadora + UF)
function calcDeliveryRisk(p) {
  let r = 10
  const uf    = (p.ufEntrega || p.transporte?.etiqueta?.uf || p.uf || '').toUpperCase()
  const transp = (p.transportadora || '').toLowerCase()
  const dias   = p.dataSaida ? Math.floor((Date.now()-new Date(p.dataSaida))/86400000) : 0
  // Regiões com maior índice histórico de atraso
  if (['AM','PA','AC','RR','AP','RO','TO'].includes(uf)) r += 30
  else if (['MA','PI','CE','RN','PB','PE','AL','SE','BA'].includes(uf)) r += 15
  if (transp.includes('correios')||transp.includes('pac')||transp.includes('sedex')) r += 12
  if (dias > 7) r += 20
  if (dias > 12) r += 15
  return Math.min(98, r)
}

// Complaint Risk Score 0-100
function calcComplaintRisk(p) {
  let r = 5
  const sitId = getSitId(p)
  const dias  = p.dataSaida ? Math.floor((Date.now()-new Date(p.dataSaida))/86400000) : 0
  if (sitId === 6 && dias > 3) r += 25     // em aberto há muito tempo
  if (!p.codigoRastreio && dias > 2) r += 20  // sem rastreio
  if (dias > 10 && sitId !== 15) r += 30   // muito tempo sem entregar
  if (sitId === 12) r = 90                 // cancelado
  return Math.min(95, r)
}

// Churn Risk (baseado no ciclo de compra)
function calcChurnRisk(hist=[]) {
  if (!hist.length) return 0
  const datas = hist.map(p => new Date(p.data||0)).filter(d=>!isNaN(d)).sort((a,b)=>b-a)
  if (datas.length < 2) return 0
  const ints = datas.slice(0,-1).map((d,i) => (d-datas[i+1])/86400000)
  const med  = ints.reduce((a,b)=>a+b,0)/ints.length
  const dias = (Date.now()-datas[0])/86400000
  if (dias > med * 2) return 85
  if (dias > med * 1.5) return 60
  if (dias > med * 1.2) return 35
  return 10
}

// Smart Alerts automáticos
function getSmartAlerts(pedidos=[]) {
  const alerts = []
  const semRastreio = pedidos.filter(p => {
    const sitId = getSitId(p)
    const dias = p.dataSaida ? Math.floor((Date.now()-new Date(p.dataSaida))/86400000) : 0
    return !p.codigoRastreio && dias > 48/24 && ![12,15].includes(sitId)
  })
  if (semRastreio.length) alerts.push({
    id:'sem_rastreio', tipo:'warning', icon:Navigation,
    titulo:`${semRastreio.length} pedido${semRastreio.length>1?'s':''} sem rastreio`,
    desc:`Enviados há mais de 2 dias sem código de rastreamento`,
    cor:'#f59e0b', filtro:{campo:'semRastreio',valor:true},
    count: semRastreio.length,
  })

  const pagPendente = pedidos.filter(p => getSitId(p) === 6)
  if (pagPendente.length) {
    const tot = pagPendente.reduce((s,p)=>s+parseFloat(p.total||0),0)
    alerts.push({
      id:'pag_pendente', tipo:'alert', icon:CreditCard,
      titulo:`${pagPendente.length} pagamento${pagPendente.length>1?'s':''} pendente${pagPendente.length>1?'s':''}`,
      desc:`R$ ${tot.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,'.')} aguardando confirmação`,
      cor:'#ef4444', filtro:{campo:'situacao',valor:'6'}, count: pagPendente.length,
    })
  }

  const semNFe = pedidos.filter(p => {
    const sitId = getSitId(p)
    return [9,15].includes(sitId) && !p.notaFiscal?.id && !p.nfeNumero
  })
  if (semNFe.length) alerts.push({
    id:'sem_nfe', tipo:'info', icon:FileText,
    titulo:`${semNFe.length} pedido${semNFe.length>1?'s':''} sem NF-e`,
    desc:'Atendidos/Verificados mas sem nota fiscal emitida',
    cor:'#06b6d4', filtro:{campo:'semNFe',valor:true}, count: semNFe.length,
  })

  const atrasados = pedidos.filter(p => {
    const sitId = getSitId(p)
    const dias = p.dataSaida ? Math.floor((Date.now()-new Date(p.dataSaida))/86400000) : 0
    return p.codigoRastreio && dias > 8 && ![15,12].includes(sitId)
  })
  if (atrasados.length) alerts.push({
    id:'atrasados', tipo:'critical', icon:Clock,
    titulo:`${atrasados.length} pedido${atrasados.length>1?'s':''} em atraso`,
    desc:'Com rastreio, enviados há mais de 8 dias sem confirmar entrega',
    cor:'#f97316', filtro:{campo:'atrasado',valor:true}, count: atrasados.length,
  })

  return alerts.sort((a,b) => {
    const ord = {critical:0, alert:1, warning:2, info:3}
    return (ord[a.tipo]||3) - (ord[b.tipo]||3)
  })
}

// Carrier Scorecard a partir dos pedidos
function calcCarrierStats(pedidos=[]) {
  const map = {}
  pedidos.forEach(p => {
    const t = p.transportadora || 'Não informada'
    if (!map[t]) map[t] = { nome:t, total:0, entregues:0, totalVal:0 }
    map[t].total++
    map[t].totalVal += parseFloat(p.total||0)
    if (getSitId(p) === 15) map[t].entregues++
  })
  return Object.values(map)
    .map(c => ({ ...c, taxa: c.total>0?Math.round(c.entregues/c.total*100):0,
      ticket: c.total>0?c.totalVal/c.total:0 }))
    .sort((a,b) => b.total-a.total)
    .slice(0,8)
}

// Análise geográfica por UF
function calcGeoStats(pedidos=[]) {
  const map = {}
  pedidos.forEach(p => {
    const uf = (p.ufEntrega || p.transporte?.etiqueta?.uf || p.uf || '?').toUpperCase()
    if (!map[uf]) map[uf] = { uf, total:0, val:0 }
    map[uf].total++
    map[uf].val += parseFloat(p.total||0)
  })
  return Object.values(map).sort((a,b)=>b.total-a.total)
}

// Revenue Forecast (projeção linear 30d)
function calcRevenueForecast(pedidos=[]) {
  const today = Date.now()
  const dias90 = pedidos.filter(p => p.data && (today-new Date(p.data))/(86400000) <= 90)
  if (!dias90.length) return { dias30:0, tendencia:'estável' }
  const fat90 = dias90.reduce((s,p)=>s+parseFloat(p.total||0),0)
  const mediaD = fat90 / 90
  const fat30  = dias90.filter(p=>(today-new Date(p.data))/(86400000)<=30)
    .reduce((s,p)=>s+parseFloat(p.total||0),0)
  const mediaM = fat30 / 30
  const delta  = mediaM > 0 ? ((mediaM - mediaD) / mediaD * 100) : 0
  return {
    dias30: Math.round(mediaM * 30),
    dias7:  Math.round(mediaM * 7),
    tendencia: delta > 5 ? 'crescendo' : delta < -5 ? 'caindo' : 'estável',
    variacao: Math.round(Math.abs(delta)),
  }
}

// Market Basket (produtos comprados juntos)
function calcMarketBasket(pedidos=[]) {
  const pares = {}
  pedidos.forEach(p => {
    const itens = p.itens || []
    if (itens.length < 2) return
    for (let i=0; i<itens.length; i++) {
      for (let j=i+1; j<itens.length; j++) {
        const key = [itens[i].codigo||itens[i].descricao, itens[j].codigo||itens[j].descricao]
          .sort().join(' + ')
        pares[key] = (pares[key]||0) + 1
      }
    }
  })
  return Object.entries(pares)
    .map(([par, freq]) => ({ par, freq }))
    .sort((a,b)=>b.freq-a.freq)
    .slice(0,10)
}

// Channel Quality
function calcChannelQuality(pedidos=[]) {
  const map = {}
  pedidos.forEach(p => {
    const c = getCanal(p)
    if (!map[c]) map[c] = { canal:c, total:0, val:0, clientes:new Set(), repete:0 }
    map[c].total++
    map[c].val += parseFloat(p.total||0)
    const tel = p.telefone||p.contato
    if (tel) {
      if (map[c].clientes.has(tel)) map[c].repete++
      map[c].clientes.add(tel)
    }
  })
  return Object.values(map).map(c => ({
    ...c,
    clientes: c.clientes.size,
    ticket: c.total>0?c.val/c.total:0,
    ltv: c.clientes.size>0?c.val/c.clientes.size:0,
    taxaRepete: c.clientes.size>0?Math.round(c.repete/c.clientes.size*100):0,
  })).sort((a,b)=>b.val-a.val)
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
    {data.map((v,i)=><div key={i} style={{width:4,borderRadius:2,
      height:`${Math.max(4,(v/max)*28)}px`,background:i===data.length-1?cor:`${cor}55`}}/>)}
  </div>
}
const TT = {contentStyle:{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:8,fontSize:11,color:'var(--label)'}}


// ─── NIVELMAX COMPONENTS ──────────────────────────────────────────────────────

// Fulfillment Score Ring
function FulfillmentRing({ score=0, size=48 }) {
  const r = (size-6)/2, circ = 2*Math.PI*r, fill = circ*(score/100)
  const cor = score===100?'#00e676':score>=75?'#4a9fff':score>=50?'#f59e0b':'#ef4444'
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={5}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={cor} strokeWidth={5}
          strokeLinecap="round" strokeDasharray={`${fill} ${circ}`}
          style={{ filter:`drop-shadow(0 0 4px ${cor}80)`, transition:'stroke-dasharray .6s ease' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:size>40?11:9, fontWeight:800, color:cor }}>
        {score}
      </div>
    </div>
  )
}

// Risk Badge
function RiskBadge({ risk=0, label='Risco', small=false }) {
  const cor = risk>=70?'#ef4444':risk>=40?'#f97316':'#22c55e'
  const lbl = risk>=70?'Alto':risk>=40?'Médio':'Baixo'
  if (small) return (
    <span style={{ fontSize:8, padding:'1px 5px', borderRadius:99,
      background:`${cor}18`, color:cor, border:`1px solid ${cor}30`, fontWeight:700 }}>
      {lbl}
    </span>
  )
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 8px',
      borderRadius:8, background:`${cor}12`, border:`1px solid ${cor}25` }}>
      <div style={{ width:5, height:5, borderRadius:'50%', background:cor,
        boxShadow:`0 0 6px ${cor}` }}/>
      <span style={{ fontSize:10.5, fontWeight:700, color:cor }}>{label}: {lbl}</span>
      <span style={{ fontSize:10, color:`${cor}99` }}>{risk}%</span>
    </div>
  )
}

// Live Counter animado
function LiveCounter({ value=0, prefix='R$ ', decimals=0 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const target = value
    const step = Math.max(1, Math.floor(target / 60))
    let cur = 0
    const timer = setInterval(() => {
      cur = Math.min(cur + step, target)
      setDisplay(cur)
      if (cur >= target) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [value])
  return (
    <span>
      {prefix}
      {decimals > 0
        ? display.toLocaleString('pt-BR', { minimumFractionDigits:decimals })
        : display.toLocaleString('pt-BR')}
    </span>
  )
}

// Command Center Header — Mission Control
function CommandCenter({ pedidos=[], filtrados=[], kpis={}, onAlertClick, api }) {
  const [fat7, setFat7] = useState(0)
  const [liveRev, setLiveRev] = useState(0)
  const alerts = useMemo(() => getSmartAlerts(pedidos), [pedidos])
  const forecast = useMemo(() => calcRevenueForecast(pedidos), [pedidos])

  useEffect(() => {
    const hoje = new Date()
    const fat = filtrados
      .filter(p => p.data && (Date.now()-new Date(p.data))/(86400000) <= 1)
      .reduce((s,p) => s+parseFloat(p.total||0), 0)
    setLiveRev(Math.round(fat))
    const fat7d = filtrados
      .filter(p => p.data && (Date.now()-new Date(p.data))/(86400000) <= 7)
      .reduce((s,p) => s+parseFloat(p.total||0), 0)
    setFat7(Math.round(fat7d))
  }, [filtrados])

  return (
    <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--sep)',
      background:'linear-gradient(180deg,var(--bg-2),var(--bg))',
      flexShrink:0 }}>
      {/* Linha 1: KPIs principais */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: alerts.length>0?8:0,
        flexWrap:'wrap' }}>
        {/* Revenue do dia */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px',
          borderRadius:10, background:'rgba(0,230,118,.08)',
          border:'1px solid rgba(0,230,118,.2)' }}>
          <DollarSign size={13} style={{ color:'#00e676' }}/>
          <div>
            <div style={{ fontSize:9, color:'rgba(0,230,118,.6)', fontWeight:700,
              textTransform:'uppercase', letterSpacing:'.05em' }}>Hoje</div>
            <div style={{ fontSize:15, fontWeight:900, color:'#00e676', lineHeight:1.2 }}>
              R$ {liveRev.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Revenue 7d */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px',
          borderRadius:10, background:'rgba(79,142,247,.08)', border:'1px solid rgba(79,142,247,.2)' }}>
          <TrendingUp size={13} style={{ color:'#4f8ef7' }}/>
          <div>
            <div style={{ fontSize:9, color:'rgba(79,142,247,.6)', fontWeight:700,
              textTransform:'uppercase', letterSpacing:'.05em' }}>7 dias</div>
            <div style={{ fontSize:15, fontWeight:900, color:'#4f8ef7', lineHeight:1.2 }}>
              R$ {fat7.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Forecast */}
        {forecast.dias30 > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px',
            borderRadius:10, background:'rgba(167,139,250,.08)', border:'1px solid rgba(167,139,250,.2)' }}>
            <Target size={13} style={{ color:'#a78bfa' }}/>
            <div>
              <div style={{ fontSize:9, color:'rgba(167,139,250,.6)', fontWeight:700,
                textTransform:'uppercase', letterSpacing:'.05em' }}>Previsão 30d</div>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:13, fontWeight:800, color:'#a78bfa' }}>
                  R$ {forecast.dias30.toLocaleString('pt-BR')}
                </span>
                {forecast.tendencia !== 'estável' && (
                  <span style={{ fontSize:9, padding:'1px 5px', borderRadius:99,
                    background: forecast.tendencia==='crescendo'?'rgba(0,230,118,.15)':'rgba(239,68,68,.15)',
                    color: forecast.tendencia==='crescendo'?'#00e676':'#ef4444', fontWeight:700 }}>
                    {forecast.tendencia==='crescendo'?'↑':'↓'} {forecast.variacao}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:11, color:'var(--label-4)' }}>
            {filtrados.length.toLocaleString()} pedidos
          </span>
          {alerts.length > 0 && (
            <span style={{ width:18, height:18, borderRadius:'50%', background:'#ef4444',
              fontSize:10, fontWeight:800, color:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center',
              animation:'pedido-ping 2s ease infinite' }}>
              {alerts.length}
            </span>
          )}
        </div>
      </div>

      {/* Linha 2: Smart Alerts */}
      {alerts.length > 0 && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {alerts.map(a => {
            const AIc = a.icon
            return (
              <button key={a.id} onClick={() => onAlertClick && onAlertClick(a)}
                style={{ display:'inline-flex', alignItems:'center', gap:5,
                  padding:'4px 10px', borderRadius:99, cursor:'pointer',
                  border:`1px solid ${a.cor}40`, background:`${a.cor}10`,
                  color:a.cor, fontSize:10.5, fontWeight:700,
                  transition:'all .15s' }}>
                <AIc size={10}/>
                {a.titulo}
                <span style={{ fontSize:9, opacity:.7 }}>→</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Bulk Action Bar
function BulkActionBar({ selecionados=[], pedidos=[], onClear, api }) {
  const [enviando, setEnviando] = useState(null)
  if (!selecionados.length) return null

  const totalSel = pedidos.filter(p => selecionados.includes(p.numero))
    .reduce((s,p) => s+parseFloat(p.total||0), 0)

  const enviarLote = async (gatilho) => {
    setEnviando(gatilho)
    const pSel = pedidos.filter(p => selecionados.includes(p.numero) && p.telefone)
    await Promise.allSettled(pSel.map(p =>
      fetch(`${api}/api/templates/disparar-gatilho`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ gatilho, telefone:p.telefone,
          variaveis: { '{{numero_pedido}}':p.numero, '{{nome_cliente}}':p.contato||'',
            '{{valor_total}}':fmt(p.total) }
        })
      })
    ))
    setEnviando(null); onClear()
  }

  return (
    <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)',
      zIndex:500, display:'flex', alignItems:'center', gap:10,
      padding:'10px 16px', borderRadius:16,
      background:'linear-gradient(135deg,#1c2238,#161b2c)',
      border:'1px solid rgba(167,139,250,.4)',
      boxShadow:'0 8px 32px rgba(0,0,0,.7), 0 0 0 1px rgba(167,139,250,.2)',
      animation:'pedido-slideUp .2s ease' }}>
      <div style={{ fontSize:12, fontWeight:700, color:'#a78bfa' }}>
        {selecionados.length} selecionado{selecionados.length>1?'s':''}
      </div>
      <div style={{ fontSize:11, color:'rgba(255,255,255,.5)' }}>·</div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,.6)' }}>
        {fmt(totalSel)}
      </div>
      <div style={{ width:1, height:20, background:'rgba(255,255,255,.1)' }}/>
      {[
        { g:'pedido_criado',       l:'📦 Enviar resumo',  cor:'#06b6d4' },
        { g:'rastreio_em_transito', l:'🚚 Enviar rastreio', cor:'#a78bfa' },
        { g:'avaliar_pedido',       l:'⭐ Pedir avaliação', cor:'#f59e0b' },
      ].map(({ g, l, cor }) => (
        <button key={g} onClick={() => enviarLote(g)}
          disabled={!!enviando}
          style={{ padding:'5px 11px', borderRadius:9, cursor:'pointer',
            border:`1px solid ${cor}40`, background:`${cor}15`,
            color:cor, fontSize:11, fontWeight:700,
            opacity:enviando===g?0.6:1 }}>
          {enviando===g ? <RefreshCw size={10} style={{ animation:'spin 1s linear infinite' }}/> : l}
        </button>
      ))}
      <button onClick={onClear}
        style={{ padding:'5px 10px', borderRadius:9, cursor:'pointer',
          border:'1px solid rgba(255,255,255,.15)', background:'transparent',
          color:'rgba(255,255,255,.5)', fontSize:11 }}>
        Cancelar
      </button>
    </div>
  )
}

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

// ─── ANALYTICS VIEW ──────────────────────────────────────────────────────────
function AnalyticsView({ pedidos, api }) {
  const [geo, setGeo] = useState(null)
  const [geoLoad, setGL] = useState(false)
  const [abaAn, setAbaAn] = useState('overview')

  const TABS_AN = [
    { id:'overview',  label:'Visão Geral' },
    { id:'carriers',  label:'Transportadoras' },
    { id:'channels',  label:'Canais' },
    { id:'geo',       label:'Geografia' },
    { id:'products',  label:'Produtos' },
    { id:'forecast',  label:'Previsão' },
  ]

  const forecast = useMemo(() => calcRevenueForecast(pedidos), [pedidos])

  // ── Visão geral: mantém os gráficos existentes ──────────────────────────
  const byStatus = useMemo(() => {
    const m = {}
    pedidos.forEach(p => {
      const s = SIT[getSitId(p)]?.label || 'Outros'
      m[s] = (m[s]||0) + 1
    })
    return Object.entries(m).map(([name,value]) => ({ name, value }))
  }, [pedidos])

  const byCanal = useMemo(() => {
    const m = {}
    pedidos.forEach(p => {
      const c = CANAL_CFG[getCanal(p)]?.label || 'Outros'
      m[c] = (m[c]||0) + parseFloat(p.total||0)
    })
    return Object.entries(m).map(([name, value]) => ({ name, value:Math.round(value) }))
      .sort((a,b)=>b.value-a.value)
  }, [pedidos])

  const byDia = useMemo(() => {
    const m = {}
    pedidos.forEach(p => {
      if (!p.data) return
      const d = fmtD(p.data)
      m[d] = (m[d]||0) + parseFloat(p.total||0)
    })
    return Object.entries(m).slice(-30)
      .map(([d,v]) => ({ d, v:Math.round(v) }))
  }, [pedidos])

  const PIE_COLORS = ['#4a9fff','#f59e0b','#22c55e','#ef4444','#a78bfa','#06b6d4','#f97316']
  const TT2 = { contentStyle:{ background:'var(--bg-2)', border:'1px solid var(--sep)',
    borderRadius:8, fontSize:11, color:'var(--label)' }}

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:16 }}>
      {/* Tabs Analytics */}
      <div style={{ display:'flex', gap:4, borderBottom:'1px solid var(--sep)', paddingBottom:8,
        overflowX:'auto', flexShrink:0 }}>
        {TABS_AN.map(t => (
          <button key={t.id} onClick={() => setAbaAn(t.id)}
            style={{ padding:'5px 12px', borderRadius:99, border:'none', cursor:'pointer',
              fontSize:11, fontWeight:abaAn===t.id?700:500, flexShrink:0,
              background:abaAn===t.id?'var(--accent-dim)':'transparent',
              color:abaAn===t.id?'var(--accent)':'var(--label-4)',
              outline:abaAn===t.id?'1px solid var(--accent-bor)':'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {abaAn === 'overview' && (<>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {/* Revenue por dia */}
          <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)',
            borderRadius:12, padding:'14px 16px', gridColumn:'span 2' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--label-4)', marginBottom:10,
              display:'flex', alignItems:'center', gap:5 }}>
              <Activity size={11}/>Receita dos últimos 30 dias
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={byDia}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sep)" vertical={false}/>
                <XAxis dataKey="d" tick={{ fontSize:8, fill:'var(--label-4)' }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontSize:8, fill:'var(--label-4)' }} tickLine={false} axisLine={false}
                  tickFormatter={v=>`R$${v>999?`${(v/1000).toFixed(0)}k`:v}`}/>
                <Tooltip {...TT2} formatter={v=>[fmt(v),'Receita']}/>
                <Area type="monotone" dataKey="v" stroke="var(--accent)" fill="url(#gRev)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status */}
          <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--label-4)', marginBottom:10,
              display:'flex', alignItems:'center', gap:5 }}>
              <BarChart3 size={11}/>Por Status
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={byStatus} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({name,percent})=>`${name} ${Math.round(percent*100)}%`}
                  labelLine={false} fontSize={9}>
                  {byStatus.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip {...TT2}/>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Por canal */}
          <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--label-4)', marginBottom:10,
              display:'flex', alignItems:'center', gap:5 }}>
              <Globe size={11}/>Receita por Canal
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={byCanal} layout="vertical">
                <XAxis type="number" tick={{ fontSize:8, fill:'var(--label-4)' }} tickLine={false} axisLine={false}
                  tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
                <YAxis type="category" dataKey="name" tick={{ fontSize:9, fill:'var(--label-4)' }} width={70}
                  tickLine={false} axisLine={false}/>
                <Tooltip {...TT2} formatter={v=>[fmt(v),'Receita']}/>
                <Bar dataKey="value" radius={[0,4,4,0]}>
                  {byCanal.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>)}

      {/* Carriers */}
      {abaAn === 'carriers' && <CarrierScorecard pedidos={pedidos}/>}

      {/* Channels */}
      {abaAn === 'channels' && <ChannelQuality pedidos={pedidos}/>}

      {/* Geo */}
      {abaAn === 'geo' && <GeoView pedidos={pedidos}/>}

      {/* Products */}
      {abaAn === 'products' && <MarketBasketView pedidos={pedidos}/>}

      {/* Forecast */}
      {abaAn === 'forecast' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--label-4)',
            textTransform:'uppercase', letterSpacing:'.06em' }}>
            Previsão de Receita
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            {[
              { l:'Próximos 7 dias', v:forecast.dias7,  c:'#4f8ef7' },
              { l:'Próximos 30 dias',v:forecast.dias30, c:'#a78bfa' },
              { l:'Tendência',       v:forecast.tendencia==='crescendo'?`↑ +${forecast.variacao}%`:
                                       forecast.tendencia==='caindo'?`↓ -${forecast.variacao}%`:'→ Estável',
                c:forecast.tendencia==='crescendo'?'#00e676':forecast.tendencia==='caindo'?'#ef4444':'#f59e0b' },
            ].map(({l,v,c}) => (
              <div key={l} style={{ padding:'16px', borderRadius:12,
                background:'var(--bg-2)', border:`1px solid ${c}20`, textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:900, color:c, marginBottom:4 }}>
                  {l==='Tendência' ? v : `R$ ${Number(v).toLocaleString('pt-BR')}`}
                </div>
                <div style={{ fontSize:11, color:'var(--label-4)' }}>{l}</div>
                <div style={{ fontSize:9.5, color:'var(--label-4)', marginTop:4 }}>
                  Baseado nos últimos 90 dias
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding:'14px', borderRadius:12, background:'var(--bg-2)',
            border:'1px solid var(--sep)' }}>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={Array.from({length:30},(_,i)=>({
                d:`+${i+1}d`,
                v: Math.round(forecast.dias30/30 * (1 + (Math.random()-.5)*.2))
              }))}>
                <defs>
                  <linearGradient id="gFc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sep)" vertical={false}/>
                <XAxis dataKey="d" tick={{ fontSize:8, fill:'var(--label-4)' }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontSize:8, fill:'var(--label-4)' }} tickLine={false} axisLine={false}
                  tickFormatter={v=>`R$${v}`}/>
                <Tooltip {...TT2} formatter={v=>[fmt(v),'Projeção']}/>
                <Area type="monotone" dataKey="v" stroke="#a78bfa" fill="url(#gFc)" strokeWidth={2}
                  strokeDasharray="5 3"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}


// ─── CARRIER SCORECARD ────────────────────────────────────────────────────────
function CarrierScorecard({ pedidos=[] }) {
  const stats = useMemo(() => calcCarrierStats(pedidos), [pedidos])
  if (!stats.length) return (
    <div style={{ textAlign:'center', padding:32, color:'var(--label-4)', fontSize:12 }}>
      <Truck size={28} style={{ opacity:.1, display:'block', margin:'0 auto 10px' }}/>
      Dados insuficientes para análise de transportadoras.
    </div>
  )
  const maxTotal = Math.max(...stats.map(s=>s.total), 1)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--label-4)',
        textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>
        Performance por Transportadora
      </div>
      {stats.map((s, i) => (
        <div key={s.nome} style={{ padding:'12px 14px', borderRadius:12,
          background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, flexShrink:0,
              background:'rgba(79,142,247,.12)', border:'1px solid rgba(79,142,247,.2)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Truck size={13} style={{ color:'#4f8ef7' }}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:'var(--label)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {s.nome}
              </div>
              <div style={{ fontSize:10, color:'var(--label-4)', marginTop:1 }}>
                {s.total} pedidos · Ticket: {fmt(s.ticket)}
              </div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:18, fontWeight:900,
                color: s.taxa>=90?'#00e676':s.taxa>=70?'#f59e0b':'#ef4444' }}>
                {s.taxa}%
              </div>
              <div style={{ fontSize:9, color:'var(--label-4)' }}>no prazo</div>
            </div>
          </div>
          {/* Barra de volume */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ flex:1, height:6, borderRadius:99, background:'var(--fill)',
              overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:99,
                width:`${(s.total/maxTotal)*100}%`,
                background: s.taxa>=90 ? 'linear-gradient(90deg,#00e676,#06b6d4)' :
                            s.taxa>=70 ? 'linear-gradient(90deg,#f59e0b,#f97316)' :
                            'linear-gradient(90deg,#ef4444,#f97316)',
                transition:'width .6s ease' }}/>
            </div>
            <span style={{ fontSize:10, color:'var(--label-4)', minWidth:40 }}>
              R$ {(s.totalVal/1000).toFixed(0)}k
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── CHANNEL QUALITY ──────────────────────────────────────────────────────────
function ChannelQuality({ pedidos=[] }) {
  const stats = useMemo(() => calcChannelQuality(pedidos), [pedidos])
  if (!stats.length) return null
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--label-4)',
        textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>
        Qualidade por Canal
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10 }}>
        {stats.map(s => {
          const cfg = CANAL_CFG[s.canal] || { label:s.canal, cor:'#888', icon:Globe }
          const CIc = cfg.icon
          return (
            <div key={s.canal} style={{ padding:'12px 14px', borderRadius:12,
              background:'var(--bg-2)', border:`1px solid ${cfg.cor}20` }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
                <CIc size={14} style={{ color:cfg.cor }}/>
                <span style={{ fontSize:12, fontWeight:700, color:'var(--label)' }}>{cfg.label}</span>
              </div>
              {[
                ['Pedidos',      s.total],
                ['Clientes',     s.clientes],
                ['LTV médio',    fmt(s.ltv)],
                ['Ticket médio', fmt(s.ticket)],
                ['Recompra',     `${s.taxaRepete}%`],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between',
                  fontSize:11, marginBottom:4 }}>
                  <span style={{ color:'var(--label-4)' }}>{k}</span>
                  <span style={{ color:'var(--label)', fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── GEO VIEW ────────────────────────────────────────────────────────────────
function GeoView({ pedidos=[] }) {
  const stats = useMemo(() => calcGeoStats(pedidos).slice(0,15), [pedidos])
  const max = Math.max(...stats.map(s=>s.total), 1)
  if (!stats.length) return null
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--label-4)',
        textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>
        Distribuição Geográfica (Top 15 estados)
      </div>
      {stats.map(s => (
        <div key={s.uf} style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:28, fontSize:11, fontWeight:700,
            color:'var(--label)', textAlign:'center', flexShrink:0 }}>
            {s.uf}
          </div>
          <div style={{ flex:1, height:20, borderRadius:99, background:'var(--fill)',
            overflow:'hidden', position:'relative' }}>
            <div style={{ height:'100%', width:`${(s.total/max)*100}%`, borderRadius:99,
              background:'linear-gradient(90deg,#4a9fff,#7c6af7)',
              transition:'width .6s ease', display:'flex', alignItems:'center',
              paddingLeft:8 }}>
              <span style={{ fontSize:9, color:'rgba(0,0,0,.7)', fontWeight:700,
                whiteSpace:'nowrap' }}>
                {s.total}
              </span>
            </div>
          </div>
          <div style={{ width:80, textAlign:'right', flexShrink:0,
            fontSize:11, color:'var(--label-4)' }}>
            {fmt(s.val)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── MARKET BASKET ───────────────────────────────────────────────────────────
function MarketBasketView({ pedidos=[] }) {
  const basket = useMemo(() => calcMarketBasket(pedidos), [pedidos])
  if (!basket.length) return (
    <div style={{ textAlign:'center', padding:24, color:'var(--label-4)', fontSize:12 }}>
      Dados insuficientes (mín. 10 pedidos com 2+ itens)
    </div>
  )
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--label-4)',
        textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>
        Produtos Comprados Juntos (Top 10)
      </div>
      {basket.map((b,i) => (
        <div key={b.par} style={{ display:'flex', alignItems:'center', gap:10,
          padding:'9px 12px', borderRadius:10, background:'var(--bg-2)',
          border:'1px solid var(--sep)' }}>
          <span style={{ fontSize:13, fontWeight:800, color:'var(--label-4)',
            minWidth:20, textAlign:'center' }}>#{i+1}</span>
          <span style={{ flex:1, fontSize:11.5, color:'var(--label)', lineHeight:1.4 }}>{b.par}</span>
          <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
            <span style={{ fontSize:14, fontWeight:800, color:'#a78bfa' }}>{b.freq}</span>
            <span style={{ fontSize:9, color:'var(--label-4)' }}>pedidos</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── KANBAN ────────────────────────────────────────────────────────────────────
function KanbanView({filtrados, onSel}) {
  const cols = useMemo(()=>{
    const c={}
    Object.entries(SIT).forEach(([id,s])=>{c[id]={sit:s,items:[],total:0}})
    filtrados.forEach(p=>{const sid=String(getSitId(p));if(c[sid]){c[sid].items.push(p);c[sid].total+=parseFloat(p.total||0)}})
    return c
  },[filtrados])
  return <div style={{display:'grid',gridTemplateColumns:`repeat(${Object.keys(cols).length},1fr)`,gap:12,alignItems:'start'}}>
    {Object.entries(cols).map(([sid,col])=><div key={sid} style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',
        borderRadius:10,background:col.sit.bg,border:`1px solid ${col.sit.bdr}`}}>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:col.sit.cor}}>{col.sit.label}</div>
          <div style={{fontSize:10,color:col.sit.cor+'aa'}}>{fmt(col.total)}</div>
        </div>
        <span style={{fontSize:18,fontWeight:800,color:col.sit.cor}}>{col.items.length}</span>
      </div>
      {col.items.slice(0,15).map(p=>{
        const cc=CANAL_CFG[getCanal(p)]||CANAL_CFG.bling; const Ic=cc.icon
        return <div key={p.numero} onClick={()=>onSel(p)}
          style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:10,
            padding:'10px 12px',cursor:'pointer'}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=col.sit.cor}
          onMouseLeave={e=>e.currentTarget.style.borderColor='var(--sep)'}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
            <span style={{fontSize:12,fontWeight:600,color:'var(--label)'}}>#{p.numero}</span>
            <Ic size={12} style={{color:cc.cor}}/>
          </div>
          <div style={{fontSize:11,color:'var(--label-3)',marginBottom:4,
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.contato||'—'}</div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:11,fontWeight:700,color:'var(--label)'}}>{fmt(p.total)}</span>
            <span style={{fontSize:10,color:'var(--label-4)'}}>{fmtD(p.data)}</span>
          </div>
        </div>
      })}
      {col.items.length>15&&<div style={{textAlign:'center',fontSize:11,color:'var(--label-4)',padding:4}}>
        +{col.items.length-15} mais
      </div>}
    </div>)}
  </div>
}

// ─── ORDER SHEET NIVELMAX ────────────────────────────────────────────────────
// Scroll contínuo sem abas — Linear/Salesforce style
function OrderSheet({ pedRow, onClose, api, allPedidos }) {
  const [det,      setDet]     = useState(null)
  const [load,     setLoad]    = useState(true)
  const [nfe,      setNfe]     = useState(null)
  const [foto,     setFoto]    = useState(null)
  const [ocors,    setOcors]   = useState([])
  const [disps,    setDisps]   = useState([])
  const [novaOc,   setNOc]     = useState('')
  const [savOc,    setSavOc]   = useState(false)
  const [msgTxt,   setMsgT]    = useState('')
  const [snd2,     setSnd2]    = useState(false)
  const [sentNF,   setSetNF]   = useState(false)
  const [sentRas,  setSentRas] = useState(false)
  const [cpOk,     setCpOk]    = useState('')
  const [enviando, setEnv]     = useState(null)
  const [envRes,   setEnvRes]  = useState({})

  const canal  = getCanal(pedRow)
  const sitId  = getSitId(pedRow)
  const sit    = SIT[sitId] || { label:'—', cor:'#888', bg:'var(--fill)', bdr:'var(--sep)' }

  useEffect(() => {
    setLoad(true)
    fetch(`${api}/api/dashboard/pedido-completo/${pedRow.numero}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setDet(d); setLoad(false)
        const tel = d?.mensagens?.lista?.[0]?.telefone || pedRow.telefone || ''
        if (tel) {
          fetch(`${api}/api/dashboard/foto-perfil/${tel.replace(/\D/g,'')}`)
            .then(r=>r.ok?r.json():null).then(f=>f?.url&&setFoto(f.url)).catch(()=>{})
        }
        const nfId = d?.pedido?.notaFiscal?.id && Number(d.pedido.notaFiscal.id)>0 ? d.pedido.notaFiscal.id : null
        if (nfId) {
          fetch(`${api}/api/dashboard/nfe-link/${nfId}`)
            .then(r=>r.ok?r.json():null).then(n=>setNfe(n)).catch(()=>{})
        }
      }).catch(() => setLoad(false))
    const tel = (pedRow.telefone||'').replace(/\D/g,'')
    if (tel) {
      fetch(`${api}/api/dashboard/ocorrencias?telefone=${tel}`)
        .then(r=>r.ok?r.json():null).then(d=>setOcors(d?.ocorrencias||[])).catch(()=>{})
    }
    fetch(`${api}/api/dashboard/disparos-pedido/${pedRow.numero}`)
      .then(r=>r.ok?r.json():null).then(d=>setDisps(d?.disparos||[])).catch(()=>{})
  }, [pedRow.numero, api])

  const ped        = det?.pedido
  const contato    = det?.contato
  const rastreio   = det?.rastreio
  const hist       = det?.historico?.pedidos || []
  const mensagens  = det?.mensagens?.lista   || []
  const transporte = det?.transporte
  const rfmScore   = calcRFM([pedRow,...hist])
  const rfmCfg     = RFM[rfmScore] || RFM.novo
  const RFMIcon    = rfmCfg.icon
  const ltvTotal   = [pedRow,...hist].reduce((s,p)=>s+parseFloat(p.total||0),0)
  const codRas     = rastreio?.codigo || transporte?.volumes?.[0]?.codigo
                  || transporte?.volumes?.[0]?.codigoRastreamento || pedRow?.codigoRastreio || ''
  const linkRas    = rastreio?.link || rastreio?.linkCorreios || rastreio?.linkMelhorRastreio || ''
  const transpNome = rastreio?.transportadora || transporte?.transportadora?.nome || ''
  const fulfScore  = calcFulfillmentScore(pedRow, disps, nfe, rastreio)
  const riskDel    = calcDeliveryRisk(pedRow)
  const ocAbertos  = ocors.filter(o=>o.status!=='resolvido').length

  const cp = (v,k) => { navigator.clipboard?.writeText(String(v||'')); setCpOk(k); setTimeout(()=>setCpOk(''),1500) }

  const enviarNF = async () => {
    const link = nfe?.linkDanfe || nfe?.linkPDF || ''
    if (!link || !pedRow.telefone) return
    setSnd2(true)
    const msg = `*Nota Fiscal — Pedido #${pedRow.numero}*\n\nSua NF-e foi emitida:\n${link}`
    await fetch(`${api}/api/dashboard/manual/${pedRow.telefone.replace(/\D/g,'')}`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({mensagem:msg})
    }).catch(()=>{})
    setSnd2(false); setSetNF(true); setTimeout(()=>setSetNF(false),2500)
  }

  const enviarMsg = async () => {
    if (!msgTxt.trim() || !pedRow.telefone) return
    setSnd2(true)
    await fetch(`${api}/api/dashboard/manual/${pedRow.telefone.replace(/\D/g,'')}`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({mensagem:msgTxt})
    }).catch(()=>{})
    setSnd2(false); setMsgT('')
  }

  const criarOc = async () => {
    if (!novaOc.trim()) return
    setSavOc(true)
    await fetch(`${api}/api/dashboard/ocorrencias`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ telefone:pedRow.telefone, tipo:'suporte',
        descricao:novaOc, numero_pedido:String(pedRow.numero) })
    }).catch(()=>{})
    setNOc(''); setSavOc(false)
    const tel = (pedRow.telefone||'').replace(/\D/g,'')
    fetch(`${api}/api/dashboard/ocorrencias?telefone=${tel}`)
      .then(r=>r.ok?r.json():null).then(d=>setOcors(d?.ocorrencias||[])).catch(()=>{})
  }

  const enviarTemplate = async (gatilho) => {
    if (!pedRow.telefone) return
    setEnv(gatilho)
    try {
      const r = await fetch(`${api}/api/templates/disparar-gatilho`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ gatilho, telefone:pedRow.telefone,
          variaveis: { '{{numero_pedido}}':pedRow.numero, '{{nome_cliente}}':pedRow.contato||contato?.nome||'',
            '{{primeiro_nome}}':(pedRow.contato||contato?.nome||'').split(' ')[0],
            '{{valor_total}}':fmt(pedRow.total), '{{codigo_rastreio}}':codRas,
            '{{transportadora}}':transpNome,
            '{{link_acompanhamento}}':codRas?`https://rastreio.sostrass.com.br/p/${codRas}`:'',
            '{{link_nfe}}':nfe?.linkDanfe||'', '{{numero_nfe}}':nfe?.numero||'' }
        })
      })
      const d = await r.json()
      setEnvRes(p=>({...p,[gatilho]:d.ok?'ok':'erro'}))
    } catch { setEnvRes(p=>({...p,[gatilho]:'erro'})) }
    setTimeout(()=>setEnvRes(p=>{const n={...p};delete n[gatilho];return n}),3500)
    setEnv(null)
  }

  // ── Seção colapsável ──────────────────────────────────────────────────────
  function Sec({ title, icon:Ic, cor='var(--label-4)', children, open:defOpen=true, badge=null }) {
    const [open, setOpen] = useState(defOpen)
    return (
      <div style={{ borderBottom:'1px solid var(--sep)' }}>
        <button onClick={()=>setOpen(v=>!v)}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:7,
            padding:'10px 20px', background:'transparent', border:'none', cursor:'pointer' }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--fill)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <Ic size={11} style={{ color:cor }}/>
          <span style={{ flex:1, fontSize:10, fontWeight:700, color:'var(--label-4)',
            textTransform:'uppercase', letterSpacing:'.06em', textAlign:'left' }}>
            {title}
          </span>
          {badge!==null && badge>0 && (
            <span style={{ fontSize:9, fontWeight:800, padding:'1px 5px', borderRadius:99,
              background:`${cor}18`, color:cor }}>{badge}</span>
          )}
          {open ? <ChevronUp size={10} style={{color:'var(--label-4)'}}/> : <ChevronDown size={10} style={{color:'var(--label-4)'}}/>}
        </button>
        {open && (
          <div style={{ padding:'0 20px 14px' }}>{children}</div>
        )}
      </div>
    )
  }

  // ── Jornada horizontal ─────────────────────────────────────────────────────
  const STEPS_H = [
    { g:'pedido_criado',       lbl:'Criado',    cor:'#00d4aa', Icon:ShoppingCart  },
    { g:'pagamento_aprovado',  lbl:'Pago',      cor:'#4a9fff', Icon:CreditCard    },
    { g:'em_separacao',        lbl:'Separação', cor:'#8b5cf6', Icon:Package       },
    { g:'nfe_emitida',         lbl:'NF-e',      cor:'#06b6d4', Icon:FileText      },
    { g:'pedido_enviado',      lbl:'Enviado',   cor:'#a78bfa', Icon:Truck         },
    { g:'rastreio_em_transito',lbl:'Trânsito',  cor:'#4a9fff', Icon:Navigation    },
    { g:'saiu_entrega',        lbl:'Saiu',      cor:'#f59e0b', Icon:Truck         },
    { g:'pedido_entregue',     lbl:'Entregue',  cor:'#22c55e', Icon:CheckCircle   },
  ]
  const dispMap = {}
  disps.forEach(d => { dispMap[d.gatilho] = d })
  const stepAtual = (() => {
    if ([15].includes(sitId) || String(pedRow.situacao||'').includes('verif')) return 7
    if (codRas && String(pedRow.situacao||'').toLowerCase().includes('saiu')) return 6
    if (codRas) return 5
    if ([27,24].includes(sitId)) return 4
    if ([14].includes(sitId)) return 3
    if ([9].includes(sitId))  return 2
    if ([15].includes(sitId)) return 1
    return 0
  })()

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex',
      background:'rgba(0,0,0,.65)', backdropFilter:'blur(6px)' }}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{ marginLeft:'auto', width:820, maxWidth:'100%', height:'100%',
        background:'var(--bg)', borderLeft:'1px solid var(--sep)',
        display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* ── HEADER ────────────────────────────────────────────── */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--sep)',
          flexShrink:0, background:'linear-gradient(180deg,var(--bg-2),var(--bg))' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {/* Avatar */}
              <div style={{ position:'relative', flexShrink:0 }}>
                {foto
                  ? <img src={foto} style={{ width:48,height:48,borderRadius:12,objectFit:'cover' }}/>
                  : <div style={{ width:48,height:48,borderRadius:12,background:'var(--fill)',
                      display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <Users size={20} style={{color:'var(--label-4)'}}/>
                    </div>}
                <div style={{ position:'absolute',bottom:-4,right:-4,width:18,height:18,
                  borderRadius:'50%',background:sit.cor,border:'2px solid var(--bg)',
                  display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <div style={{ width:6,height:6,borderRadius:'50%',background:'#fff' }}/>
                </div>
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:20, fontWeight:900, color:'var(--label)', letterSpacing:'-.03em' }}>
                    #{pedRow.numero}
                  </span>
                  <Pill label={sit.label} cor={sit.cor} bg={sit.bg} bdr={sit.bdr}/>
                  <CanalBadge canal={canal}/>
                </div>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--label-3)' }}>
                  {contato?.nome || pedRow.contato || '—'}
                </div>
                <div style={{ fontSize:11, color:'var(--label-4)', marginTop:2 }}>
                  {fmtDH(pedRow.data)}
                  {ped?.numeroLoja && ` · Loja #${ped.numeroLoja}`}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
              <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',
                color:'var(--label-4)',padding:4 }}><X size={18}/></button>
              {/* RFM + Fulfillment */}
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 9px',
                  borderRadius:99, background:rfmCfg.bg, border:`1px solid ${rfmCfg.cor}30`,
                  fontSize:11, fontWeight:700, color:rfmCfg.cor }}>
                  <RFMIcon size={10}/>{rfmCfg.label}
                  <span style={{ fontWeight:400, fontSize:10 }}>
                    · {hist.length+1} ped · {fmt(ltvTotal)}
                  </span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <FulfillmentRing score={fulfScore} size={42}/>
                  <span style={{ fontSize:8, color:'var(--label-4)', marginTop:1 }}>fulfillment</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Horizontal Timeline ─────────────────────── */}
          <div style={{ overflowX:'auto', paddingBottom:2 }}>
            <div style={{ display:'flex', alignItems:'flex-start', minWidth:'max-content', gap:0 }}>
              {STEPS_H.map((step, i) => {
                const feito = i <= stepAtual, atual = i === stepAtual
                const d = dispMap[step.g]
                const Ic = step.Icon
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:60 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%',
                        background:feito?`${step.cor}20`:'var(--fill)',
                        border:`2px solid ${feito?step.cor:'var(--sep)'}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:atual?`0 0 12px ${step.cor}70`:'none', transition:'all .3s' }}>
                        <Ic size={11} style={{ color:feito?step.cor:'var(--label-4)' }}/>
                      </div>
                      <span style={{ fontSize:8, color:feito?step.cor:'var(--label-4)',
                        fontWeight:atual?700:400, whiteSpace:'nowrap', textAlign:'center' }}>
                        {step.lbl}
                      </span>
                      {d && <span style={{ fontSize:7, color:d.status==='enviado'?'#22c55e':'#ef4444',
                        fontWeight:700 }}>
                        {d.status==='enviado'?'✓':'✗'} WA
                      </span>}
                    </div>
                    {i < STEPS_H.length-1 && (
                      <div style={{ width:16, height:2, margin:'0 1px', marginBottom:20, flexShrink:0,
                        background:i<stepAtual?`linear-gradient(90deg,${step.cor},${STEPS_H[i+1].cor})`:'var(--sep)',
                        borderRadius:99, transition:'background .3s' }}/>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Badges de envio de template ─────────────── */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
            {[
              { g:'pedido_criado',        l:'📦 Resumo',         show:true              },
              { g:'nfe_emitida',          l:'📄 NF-e',           show:!!nfe?.linkDanfe  },
              { g:'rastreio_em_transito', l:'🚚 Rastreio',       show:!!codRas          },
              { g:'pedido_entregue',      l:'✅ Entregue',       show:stepAtual>=7      },
              { g:'avaliar_pedido',       l:'⭐ Avaliação',      show:stepAtual>=7      },
              { g:'pagamento_pendente',   l:'💳 Lembrar pag.',   show:sitId===6         },
            ].filter(b=>b.show).map(({g,l}) => {
              const res=envRes[g], sending=enviando===g
              const cor = res==='ok'?'#22c55e':res==='erro'?'#ef4444':'#7c6af7'
              return (
                <button key={g} onClick={()=>!sending&&!res&&enviarTemplate(g)}
                  disabled={sending||!!res}
                  style={{ display:'flex', alignItems:'center', gap:5,
                    padding:'5px 11px', borderRadius:8, cursor:'pointer',
                    border:`1px solid ${cor}40`, background:`${cor}10`,
                    color:cor, fontSize:11, fontWeight:700, transition:'all .15s' }}>
                  {sending ? <RefreshCw size={10} style={{animation:'spin 1s linear infinite'}}/> :
                   res==='ok'?<Check size={10}/>:res==='erro'?<X size={10}/>:<Send size={10}/>}
                  {sending?'Enviando...':res==='ok'?'Enviado!':res==='erro'?'Falhou':l}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── SCROLL CONTÍNUO ─────────────────────────────────────── */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {load ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
              height:200, color:'var(--label-4)', gap:10, fontSize:13 }}>
              <RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/>Carregando...
            </div>
          ) : <>

            {/* 1. Fulfillment + Riscos */}
            <Sec title="Saúde do Pedido" icon={Award} cor="#a78bfa">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { l:'NF-e emitida',      ok:!!(nfe?.numero||ped?.notaFiscal?.id) },
                  { l:'Cliente notificado', ok:disps.some(d=>d.status==='enviado')  },
                  { l:'Rastreio ativo',     ok:!!codRas                             },
                  { l:'Entregue',           ok:[15].includes(sitId)                 },
                ].map(({l,ok}) => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:7,
                    padding:'8px 10px', borderRadius:8,
                    background:ok?'rgba(34,197,94,.08)':'var(--fill)',
                    border:`1px solid ${ok?'rgba(34,197,94,.2)':'var(--sep)'}` }}>
                    {ok
                      ? <CheckCircle size={12} style={{color:'#22c55e',flexShrink:0}}/>
                      : <Circle size={12} style={{color:'var(--label-4)',flexShrink:0}}/>}
                    <span style={{ fontSize:11, color:ok?'var(--label)':'var(--label-4)' }}>{l}</span>
                  </div>
                ))}
              </div>
              {riskDel > 40 && (
                <div style={{ marginTop:8, padding:'8px 10px', borderRadius:9,
                  background:'rgba(249,115,22,.08)', border:'1px solid rgba(249,115,22,.2)' }}>
                  <div style={{ fontSize:11, color:'#f97316', fontWeight:600,
                    display:'flex', alignItems:'center', gap:5 }}>
                    <AlertTriangle size={11}/>
                    Risco de atraso: {riskDel}% — {riskDel>=70?'Alto':'Médio'}
                  </div>
                </div>
              )}
            </Sec>

            {/* 2. Cliente */}
            <Sec title="Dados do Cliente" icon={Users} cor="#4a9fff" open={false}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  {[
                    ['Nome',      contato?.nome],
                    ['Telefone',  contato?.celular||contato?.telefone||pedRow.telefone],
                    ['Documento', contato?.cpfCnpj],
                    ['Email',     contato?.email],
                  ].filter(([,v])=>v).map(([k,v])=>(
                    <div key={k} style={{ display:'flex', justifyContent:'space-between',
                      marginBottom:5, fontSize:12 }}>
                      <span style={{ color:'var(--label-4)' }}>{k}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        {k==='Documento'&&<Cp val={v} label=""/>}
                        <span style={{ color:'var(--label)', fontWeight:500 }}>{v}</span>
                      </div>
                    </div>
                  ))}
                  {contato?.linkBling&&(
                    <a href={contato.linkBling} target="_blank" rel="noreferrer"
                      style={{ fontSize:10, color:'var(--accent)', textDecoration:'none',
                        display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
                      <ExternalLink size={9}/>Ver no Bling
                    </a>
                  )}
                </div>
                <div>
                  {(()=>{
                    const e = transporte?.etiqueta||ped?.transporte?.etiqueta||contato?.enderecos?.[0]
                    if(!e) return <p style={{fontSize:11,color:'var(--label-4)',margin:0}}>Endereço não disponível</p>
                    return (
                      <div style={{ fontSize:12, color:'var(--label)', lineHeight:1.7 }}>
                        <div>{e.endereco}{e.numero?`, ${e.numero}`:''}{e.complemento?` · ${e.complemento}`:''}</div>
                        <div style={{color:'var(--label-3)'}}>{e.bairro&&`${e.bairro} · `}{e.municipio}/{e.uf}</div>
                        <div style={{color:'var(--label-4)',fontSize:11}}>CEP: {e.cep}</div>
                        {transporte?.transportadora&&(
                          <div style={{marginTop:6,display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--label-3)'}}>
                            <Truck size={10}/>{transporte.transportadora}
                            {transporte?.frete>0&&<span style={{color:'var(--label-4)'}}>· {fmt(transporte.frete)}</span>}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </Sec>

            {/* 3. Financeiro */}
            <Sec title="Resumo Financeiro" icon={DollarSign} cor="#22c55e" open={false}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:10 }}>
                {[
                  ['Produtos', ped?.totalProdutos||pedRow.total],
                  ['Frete',    transporte?.frete],
                  ['Desconto', ped?.totalDesconto],
                  ['Total',    ped?.total||pedRow.total],
                ].map(([k,v])=>(
                  <div key={k} style={{ textAlign:'center', padding:'8px',
                    borderRadius:9, background:'var(--fill)' }}>
                    <div style={{ fontSize:10, color:'var(--label-4)', marginBottom:3 }}>{k}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:k==='Total'?'#22c55e':'var(--label)' }}>
                      {fmt(v)}
                    </div>
                  </div>
                ))}
              </div>
              {ped?.formaPagamento && (
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12,
                  color:'var(--label-4)', paddingTop:8, borderTop:'1px solid var(--sep)' }}>
                  <CreditCard size={11}/>{ped.formaPagamento}
                </div>
              )}
            </Sec>

            {/* 4. Itens */}
            <Sec title="Produtos" icon={Package} cor="#06b6d4"
              badge={ped?.itens?.length||0}>
              {(!ped?.itens||!ped.itens.length) ? (
                <p style={{color:'var(--label-4)',fontSize:12,margin:0,textAlign:'center',padding:'12px 0'}}>
                  Itens não disponíveis
                </p>
              ) : (
                <>
                  {ped.itens.map((item,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10,
                      padding:'8px 10px', borderRadius:9, marginBottom:6,
                      background:'var(--fill)', border:'1px solid var(--sep)' }}>
                      <div style={{ width:40, height:40, borderRadius:8, flexShrink:0,
                        background:'var(--bg-2)', overflow:'hidden',
                        display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {(item._img||item.imagem||item.imagemURL)
                          ? <img src={item._img||item.imagem||item.imagemURL} alt=""
                              style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          : <Box size={15} style={{color:'var(--label-4)'}}/>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12.5, fontWeight:600, color:'var(--label)',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {item.descricao||item.nome||'—'}
                        </div>
                        <div style={{ fontSize:10, color:'var(--label-4)', marginTop:2 }}>
                          {item.codigo&&`SKU: ${item.codigo} · `}
                          {item.quantidade}× {fmt(item.valor)}
                        </div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--label)' }}>
                          {fmt(item.valorTotal||(parseFloat(item.valor||0)*parseInt(item.quantidade||1)))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'flex-end',
                    paddingTop:6, borderTop:'1px solid var(--sep)' }}>
                    <span style={{ fontSize:16, fontWeight:900, color:'#22c55e' }}>
                      {fmt(ped.total||pedRow.total)}
                    </span>
                  </div>
                </>
              )}
            </Sec>

            {/* 5. Rastreio */}
            <Sec title="Rastreio" icon={Navigation} cor="#f59e0b">
              {codRas ? (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <span style={{ fontFamily:'monospace', fontSize:15, fontWeight:800,
                      color:'#f59e0b' }}>{codRas}</span>
                    <button onClick={()=>cp(codRas,'codras')}
                      style={{ background:'none', border:'none', cursor:'pointer',
                        color:cpOk==='codras'?'#22c55e':'var(--label-4)' }}>
                      {cpOk==='codras'?<Check size={12}/>:<Copy size={12}/>}
                    </button>
                    {linkRas && (
                      <a href={linkRas} target="_blank" rel="noreferrer"
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px',
                          borderRadius:7, border:'1px solid rgba(6,182,212,.3)',
                          background:'rgba(6,182,212,.08)', color:'#06b6d4',
                          fontSize:10, textDecoration:'none' }}>
                        <ExternalLink size={10}/>Rastrear
                      </a>
                    )}
                    {pedRow.telefone && (
                      <button onClick={async()=>{
                        const msg=`📦 Pedido #${pedRow.numero} — rastreio:\nhttps://rastreio.sostrass.com.br/p/${codRas}`
                        await fetch(`${api}/api/dashboard/manual/${pedRow.telefone.replace(/\D/g,'')}`,{
                          method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mensagem:msg})
                        }).catch(()=>{})
                        setSentRas(true); setTimeout(()=>setSentRas(false),2500)
                      }} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px',
                        borderRadius:8, border:`1px solid ${sentRas?'rgba(34,197,94,.4)':'rgba(37,211,102,.3)'}`,
                        background:sentRas?'rgba(34,197,94,.15)':'rgba(37,211,102,.08)',
                        color:sentRas?'#22c55e':'#25d366', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                        {sentRas?<Check size={11}/>:<MessageCircle size={11}/>}
                        {sentRas?'Enviado!':'Enviar WA'}
                      </button>
                    )}
                  </div>
                  {transpNome && (
                    <div style={{ fontSize:11, color:'var(--label-4)', marginBottom:10 }}>
                      <Truck size={10} style={{marginRight:4}}/>{transpNome}
                    </div>
                  )}
                  {/* Timeline eventos */}
                  {(rastreio?.eventos||[]).length > 0 && (
                    <div style={{ position:'relative', paddingLeft:4 }}>
                      {rastreio.eventos.map((ev,i)=>{
                        const atual=i===0, ult=i===rastreio.eventos.length-1
                        return (
                          <div key={i} style={{ display:'flex', gap:12, position:'relative',
                            paddingBottom:ult?0:16 }}>
                            {!ult&&<div style={{ position:'absolute', left:6, top:16, bottom:0,
                              width:1.5, background:'linear-gradient(var(--accent),var(--sep))',
                              opacity:.4 }}/>}
                            <div style={{ width:13, height:13, borderRadius:'50%', flexShrink:0,
                              marginTop:3, zIndex:1,
                              background:atual?'var(--accent)':'var(--fill)',
                              border:`2px solid ${atual?'var(--accent)':'var(--sep)'}`,
                              boxShadow:atual?'0 0 0 4px color-mix(in srgb, var(--accent) 20%, transparent)':'none' }}/>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12.5, fontWeight:atual?600:500,
                                color:atual?'var(--accent)':'var(--label)', lineHeight:1.35 }}>
                                {ev.status||ev.descricao||ev.raw||'—'}
                              </div>
                              {(ev.local||ev.unidade)&&(
                                <div style={{ fontSize:11, color:'var(--label-3)', marginTop:2 }}>
                                  {ev.local||ev.unidade}
                                </div>
                              )}
                              <div style={{ fontSize:10, color:'var(--label-4)', marginTop:2 }}>
                                <Clock size={9} style={{marginRight:3}}/>{ev.data||ev.dtHrCriado||''}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign:'center', padding:'16px 0', color:'var(--label-4)', fontSize:12 }}>
                  <Navigation size={24} style={{opacity:.1,display:'block',margin:'0 auto 8px'}}/>
                  Código de rastreio não disponível
                </div>
              )}
            </Sec>

            {/* 6. NF-e */}
            {(ped?.notaFiscal?.id || nfe) && (
              <Sec title="Nota Fiscal" icon={FileText} cor="#22c55e">
                <div style={{ padding:'12px 14px', borderRadius:10,
                  background:nfe?.linkDanfe?'rgba(34,197,94,.06)':'var(--fill)',
                  border:`1px solid ${nfe?.linkDanfe?'rgba(34,197,94,.3)':'var(--sep)'}` }}>
                  {[
                    ['Número',      nfe?.numero||ped.notaFiscal.id],
                    ['Data emissão',nfe?.dataEmissao?fmtD(nfe.dataEmissao):'—'],
                    ['Chave NF-e',  nfe?.chaveAcesso],
                  ].filter(([,v])=>v).map(([k,v])=>(
                    <div key={k} style={{ display:'flex', justifyContent:'space-between',
                      marginBottom:6, fontSize:12 }}>
                      <span style={{ color:'var(--label-4)' }}>{k}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        {['Chave NF-e'].includes(k)&&<Cp val={v} label=""/>}
                        <span style={{ color:'var(--label)', fontWeight:500,
                          fontFamily:k==='Chave NF-e'?'monospace':undefined,
                          fontSize:k==='Chave NF-e'?9.5:12 }}>{v}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {(nfe?.linkDanfe||nfe?.xml) && (
                  <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                    {nfe.linkDanfe&&(
                      <>
                        <a href={nfe.linkDanfe} target="_blank" rel="noreferrer"
                          style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px',
                            borderRadius:8, border:'1px solid rgba(34,197,94,.35)',
                            background:'rgba(34,197,94,.08)', color:'#22c55e',
                            fontSize:11, fontWeight:600, textDecoration:'none' }}>
                          <ExternalLink size={11}/>Abrir PDF / DANFE
                        </a>
                        <button onClick={enviarNF} disabled={snd2||sentNF}
                          style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px',
                            borderRadius:8, border:'1px solid rgba(37,211,102,.35)',
                            background:sentNF?'rgba(37,211,102,.15)':'rgba(37,211,102,.08)',
                            color:'#25d366', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                          <Send size={11}/>{sentNF?'Enviada!':'Enviar ao cliente (WA)'}
                        </button>
                      </>
                    )}
                    {nfe.xml&&(
                      <a href={nfe.xml} target="_blank" rel="noreferrer"
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px',
                          borderRadius:8, border:'1px solid var(--sep)', background:'var(--fill)',
                          color:'var(--label-3)', fontSize:11, textDecoration:'none' }}>
                        <Download size={11}/>Baixar XML
                      </a>
                    )}
                  </div>
                )}
              </Sec>
            )}

            {/* 7. Histórico do cliente */}
            <Sec title="Histórico do Cliente" icon={Layers} cor="#a78bfa" open={false}
              badge={hist.length}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10,
                marginBottom:12, padding:'10px 12px', borderRadius:10, background:'var(--fill)' }}>
                {[
                  ['Pedidos',    hist.length+1],
                  ['LTV',        fmt(ltvTotal)],
                  ['Ticket méd.',fmt(ltvTotal/Math.max(hist.length+1,1))],
                  ['Desde',      hist.length>0?fmtD(hist[hist.length-1]?.data):'—'],
                ].map(([k,v])=>(
                  <div key={k} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'var(--label-4)', marginBottom:2 }}>{k}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--label)' }}>{v}</div>
                  </div>
                ))}
              </div>
              {hist.length===0
                ? <p style={{fontSize:12,color:'var(--label-4)',textAlign:'center',padding:'12px 0'}}>Primeiro pedido.</p>
                : hist.map(p=>{
                    const sid=getSitId(p); const s=SIT[sid]||{label:'—',cor:'#888'}
                    return (
                      <div key={p.numero} style={{ display:'flex', alignItems:'center',
                        justifyContent:'space-between', padding:'8px 10px', borderRadius:9,
                        marginBottom:5, background:'var(--fill)', border:'1px solid var(--sep)' }}>
                        <div>
                          <div style={{ fontSize:12, fontWeight:600, color:'var(--label)' }}>#{p.numero}</div>
                          <div style={{ fontSize:10, color:'var(--label-4)' }}>{fmtD(p.data)}</div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <Pill label={s.label} cor={s.cor} bg={`${s.cor}12`} sz={10}/>
                          <span style={{ fontSize:13, fontWeight:700, color:'var(--label)' }}>{fmt(p.total)}</span>
                        </div>
                      </div>
                    )
                  })
              }
            </Sec>

            {/* 8. Disparos WA */}
            <Sec title="Disparos WhatsApp" icon={Zap} cor="#7c6af7"
              open={false} badge={disps.length}>
              {disps.length===0
                ? <p style={{color:'var(--label-4)',fontSize:12,textAlign:'center',padding:'12px 0'}}>
                    Nenhum disparo registrado.
                  </p>
                : disps.map((d,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10,
                      padding:'8px 10px', marginBottom:5, borderRadius:9,
                      background:'var(--fill)',
                      border:`1px solid ${d.status==='enviado'?'rgba(34,197,94,.2)':d.status==='erro'?'rgba(239,68,68,.2)':'var(--sep)'}` }}>
                      <div style={{ width:7,height:7,borderRadius:'50%',flexShrink:0,
                        background:d.status==='enviado'?'#22c55e':d.status==='erro'?'#ef4444':'#f59e0b' }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12,fontWeight:600,color:'var(--label)' }}>
                          {d.template_nome||d.gatilho||'—'}
                        </div>
                        <div style={{ fontSize:10,color:'var(--label-4)',marginTop:1 }}>
                          {fmtDH(d.criado_em)}
                        </div>
                      </div>
                      <Pill label={d.status||'—'}
                        cor={d.status==='enviado'?'#22c55e':d.status==='erro'?'#ef4444':'#f59e0b'}
                        bg={d.status==='enviado'?'rgba(34,197,94,.1)':d.status==='erro'?'rgba(239,68,68,.1)':'rgba(245,158,11,.1)'}
                        sz={10}/>
                    </div>
                  ))
              }
            </Sec>

            {/* 9. Enviar mensagem */}
            <Sec title="Enviar Mensagem Direta" icon={MessageSquare} cor="#25d366" open={false}>
              <div style={{ display:'flex', gap:8 }}>
                <input value={msgTxt} onChange={e=>setMsgT(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&enviarMsg()}
                  placeholder="Digite a mensagem... (Enter para enviar)"
                  style={{ flex:1,padding:'8px 12px',borderRadius:9,
                    border:'1px solid var(--sep)',background:'var(--fill)',
                    color:'var(--label)',fontSize:12 }}/>
                <button onClick={enviarMsg} disabled={snd2||!msgTxt.trim()}
                  style={{ padding:'8px 14px',borderRadius:9,border:'none',
                    background:snd2?'var(--fill)':'#25d366',
                    color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,
                    display:'flex',alignItems:'center',gap:5 }}>
                  <Send size={12}/>{snd2?'...':'Enviar'}
                </button>
              </div>
            </Sec>

            {/* 10. Ocorrências */}
            <Sec title="Ocorrências" icon={AlertCircle} cor="#ef4444"
              open={false} badge={ocAbertos}>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <input value={novaOc} onChange={e=>setNOc(e.target.value)}
                  placeholder="Descreva o problema..."
                  style={{ flex:1,padding:'7px 10px',borderRadius:9,
                    border:'1px solid var(--sep)',background:'var(--fill)',
                    color:'var(--label)',fontSize:12 }}/>
                <button onClick={criarOc} disabled={savOc||!novaOc.trim()}
                  style={{ padding:'7px 14px',borderRadius:9,border:'none',
                    background:'var(--accent)',color:'#fff',cursor:'pointer',
                    fontSize:12,fontWeight:600 }}>
                  {savOc?'...':'Abrir'}
                </button>
              </div>
              {ocors.length===0
                ? <p style={{color:'var(--label-4)',fontSize:12,textAlign:'center',padding:'12px 0'}}>
                    Sem ocorrências.
                  </p>
                : ocors.map((oc,i)=>(
                    <div key={i} style={{ padding:'9px 11px', borderRadius:9, marginBottom:5,
                      background:'var(--fill)',
                      border:`1px solid ${oc.status==='resolvido'?'rgba(34,197,94,.25)':'var(--sep)'}` }}>
                      <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                          <span style={{ fontSize:11,fontWeight:600,color:'var(--label)' }}>{oc.tipo||'Suporte'}</span>
                          <Pill label={oc.status||'aberto'}
                            cor={oc.status==='resolvido'?'#22c55e':oc.status==='em_atendimento'?'#4a9fff':'#f59e0b'}
                            bg={oc.status==='resolvido'?'rgba(34,197,94,.1)':oc.status==='em_atendimento'?'rgba(74,159,255,.1)':'rgba(245,158,11,.1)'}
                            sz={9}/>
                        </div>
                        <span style={{ fontSize:10,color:'var(--label-4)' }}>{fmtDH(oc.criado_em)}</span>
                      </div>
                      <p style={{ fontSize:12,color:'var(--label-3)',margin:0,lineHeight:1.5 }}>{oc.descricao}</p>
                    </div>
                  ))
              }
            </Sec>

            {/* Últimas mensagens */}
            {mensagens.length > 0 && (
              <Sec title="Últimas mensagens WhatsApp" icon={MessageCircle} cor="#a78bfa" open={false}>
                <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:240, overflowY:'auto' }}>
                  {mensagens.slice(-10).map((m,i)=>{
                    const isIn = m.direcao==='entrada'
                    return (
                      <div key={i} style={{ display:'flex', gap:7, alignItems:'flex-start',
                        flexDirection:isIn?'row':'row-reverse' }}>
                        <div style={{ maxWidth:'80%', padding:'6px 10px',
                          borderRadius:isIn?'4px 10px 10px 10px':'10px 4px 10px 10px',
                          background:isIn?'var(--fill)':'rgba(124,106,247,.12)',
                          border:`1px solid ${isIn?'var(--sep)':'rgba(124,106,247,.2)'}` }}>
                          <p style={{ fontSize:11.5,color:'var(--label)',margin:0,lineHeight:1.5 }}>
                            {m.conteudo||m.texto||'—'}
                          </p>
                          <div style={{ fontSize:9,color:'var(--label-4)',marginTop:2,textAlign:'right' }}>
                            {fmtDH(m.criado_em)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Sec>
            )}

            <div style={{ height:20 }}/>
          </>}
        </div>
      </div>
    </div>
  )
}


// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
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
  const [live,      setLive]   = useState(0)
  const [selecionados, setSel2] = useState([])  // bulk actions
  const [viewAN,    setViewAN]  = useState('overview')
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
        &&(!busca||String(p.numero).includes(busca)||(p.contato||'').toLowerCase().includes(txt)||(p.telefone||'').includes(busca))
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

  const srt=(col)=>{ if(sortCol===col)setSDir(d=>d==='desc'?'asc':'desc');else{setSort(col);setSDir('desc')} }
  const SI=({col})=>sortCol!==col?<ChevronDown size={11} style={{opacity:.3}}/>:sortDir==='desc'?<ChevronDown size={11}/>:<ChevronUp size={11}/>
  const pg=filtrados.slice((pgUI-1)*POR_PAG,pgUI*POR_PAG)
  const totalPgs=Math.ceil(filtrados.length/POR_PAG)

  return <div style={{display:'flex',height:'100%',overflow:'hidden'}}>

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
          {[['todos','Todos',null],...Object.entries(CANAL_CFG).map(([k,v])=>[k,v.label,v.icon])].map(([v,l,Ic])=>(
            <button key={v} onClick={()=>setFC(v)} style={{
              display:'flex',alignItems:'center',gap:7,width:'100%',textAlign:'left',
              padding:'5px 8px',borderRadius:7,border:'none',marginBottom:2,cursor:'pointer',fontSize:12,
              background:filtroC===v?'var(--fill)':'none',color:filtroC===v?'var(--label)':'var(--label-3)'}}>
              {Ic&&<Ic size={11} style={{color:CANAL_CFG[v]?.cor||'var(--label-4)'}}/>}{l}
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
        {/* Busca */}
        <div style={{position:'relative',flex:'1 1 200px',maxWidth:300}}>
          <Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',
            color:'var(--label-4)',pointerEvents:'none'}}/>
          <input value={busca} onChange={e=>{
          const v=e.target.value; setBusca(v); setPgUI(1)
          // Se é número, busca direto no backend
          const num=v.replace(/[^\d]/g,'')
          if(num.length>=5) buscarPorNumero(num)
          else if(!v) carregar(1,false)
        }}
            placeholder="Buscar por número, nome, telefone..."
            style={{width:'100%',padding:'6px 10px 6px 30px',borderRadius:8,
              border:'1px solid var(--sep)',background:'var(--fill)',
              color:'var(--label)',fontSize:12,boxSizing:'border-box'}}/>
          {busca&&<button onClick={()=>setBusca('')} style={{position:'absolute',right:8,top:'50%',
            transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',
            color:'var(--label-4)',padding:0}}><X size={12}/></button>}
        </div>
        {/* Filtro status rápido */}
        <div style={{display:'flex',gap:3}}>
          {[['0','Todos'],['6','Aberto'],['9','Atendido'],['12','Cancelado'],['15','Verificado']].map(([v,l])=>(
            <button key={v} onClick={()=>{setFS(v);setPgUI(1)}} style={{
              padding:'5px 9px',borderRadius:99,border:'1px solid var(--sep)',
              background:filtroSit===v?(SIT[Number(v)]?.bg||'var(--fill)'):'none',
              color:filtroSit===v?(SIT[Number(v)]?.cor||'var(--accent)'):'var(--label-4)',
              cursor:'pointer',fontSize:11,fontWeight:filtroSit===v?700:400}}>{l}</button>
          ))}
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:6,alignItems:'center'}}>
          {live>0&&<div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',
            borderRadius:99,background:'rgba(124,106,247,.12)',border:'1px solid rgba(124,106,247,.3)',
            fontSize:11,color:'#7c6af7'}}>
            <Bell size={11}/>{live} novos
          </div>}
          {[{id:'lista',I:Layers,t:'Lista'},{id:'kanban',I:BarChart3,t:'Kanban'},{id:'analytics',I:Activity,t:'Analytics'},{id:'timeline',I:Calendar,t:'Timeline'}].map(v=>(
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
          : view==='timeline'  ? (
            <div style={{flex:1,overflowY:'auto',padding:16}}>
              {Object.entries(filtrados.reduce((m,p)=>{
                const d=fmtD(p.data)||'Sem data';if(!m[d])m[d]=[];m[d].push(p);return m
              },{})).slice(0,60).map(([dia,peds])=>(
                <div key={dia} style={{marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--label-4)',
                    display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <Calendar size={10}/>{dia}
                    <span style={{fontSize:10,padding:'1px 7px',borderRadius:99,
                      background:'var(--fill)',border:'1px solid var(--sep)'}}>
                      {peds.length} ped · {fmt(peds.reduce((s,p)=>s+parseFloat(p.total||0),0))}
                    </span>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    {peds.map(p=>{
                      const sid=getSitId(p),s=SIT[sid]||{label:'—',cor:'#888'},r=calcDeliveryRisk(p)
                      return(
                        <div key={p.numero} onClick={()=>setSel(p)}
                          style={{display:'flex',alignItems:'center',gap:10,padding:'7px 12px',
                            borderRadius:9,cursor:'pointer',background:'var(--bg-2)',
                            border:'1px solid var(--sep)',transition:'border-color .12s'}}
                          onMouseEnter={e=>e.currentTarget.style.borderColor=s.cor}
                          onMouseLeave={e=>e.currentTarget.style.borderColor='var(--sep)'}>
                          <div style={{width:6,height:6,borderRadius:'50%',flexShrink:0,
                            background:s.cor,boxShadow:`0 0 4px ${s.cor}`}}/>
                          <span style={{fontSize:12,fontWeight:700,color:'var(--label)',minWidth:55}}>#{p.numero}</span>
                          <span style={{fontSize:11,color:'var(--label-3)',flex:1,
                            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.contato||'—'}</span>
                          <CanalBadge canal={getCanal(p)} small/>
                          <Pill label={s.label} cor={s.cor} bg={`${s.cor}12`} sz={9}/>
                          {r>50&&<RiskBadge risk={r} small/>}
                          <span style={{fontSize:13,fontWeight:700,color:'var(--label)',minWidth:65,textAlign:'right'}}>
                            {fmt(p.total)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
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

    <BulkActionBar
        selecionados={selecionados}
        pedidos={filtrados}
        onClear={()=>setSel2([])}
        api={api}
      />
      {sel&&<OrderSheet pedRow={sel} onClose={()=>setSel(null)} api={api} allPedidos={pedidos}/>}
    <style>{`@keyframes spin         { to{transform:rotate(360deg)} }
    @keyframes pedido-ping  { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:.7} }
    @keyframes pedido-slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>
  </div>
}
      {view==='timeline'&&(
        <div style={{flex:1,overflowY:'auto',padding:16}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--label-4)',marginBottom:12,
            textTransform:'uppercase',letterSpacing:'.06em'}}>
            Timeline · {filtrados.length} pedidos
          </div>
          {Object.entries(filtrados.reduce((m,p)=>{
            const d=fmtD(p.data)||'Sem data';if(!m[d])m[d]=[];m[d].push(p);return m
          },{})).slice(0,60).map(([dia,peds])=>(
            <div key={dia} style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--label-4)',
                display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                <Calendar size={10}/>{dia}
                <span style={{fontSize:10,padding:'1px 6px',borderRadius:99,
                  background:'var(--fill)',border:'1px solid var(--sep)',fontWeight:400}}>
                  {peds.length} pedido{peds.length>1?'s':''} · {fmt(peds.reduce((s,p)=>s+parseFloat(p.total||0),0))}
                </span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                {peds.map(p=>{
                  const sid=getSitId(p),s=SIT[sid]||{label:'—',cor:'#888'},r=calcDeliveryRisk(p)
                  return(
                    <div key={p.numero} onClick={()=>setSel(p)} style={{
                      display:'flex',alignItems:'center',gap:10,padding:'7px 12px',
                      borderRadius:9,cursor:'pointer',background:'var(--bg-2)',
                      border:'1px solid var(--sep)',transition:'border-color .12s'}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=s.cor}
                      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--sep)'}>
                      <div style={{width:6,height:6,borderRadius:'50%',flexShrink:0,
                        background:s.cor,boxShadow:`0 0 4px ${s.cor}`}}/>
                      <span style={{fontSize:12,fontWeight:700,color:'var(--label)',minWidth:55}}>#{p.numero}</span>
                      <span style={{fontSize:11,color:'var(--label-3)',flex:1,
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {p.contato||'—'}
                      </span>
                      <CanalBadge canal={getCanal(p)} small/>
                      <Pill label={s.label} cor={s.cor} bg={`${s.cor}12`} sz={9}/>
                      {r>50&&<RiskBadge risk={r} small/>}
                      <span style={{fontSize:13,fontWeight:700,color:'var(--label)',minWidth:65,textAlign:'right'}}>
                        {fmt(p.total)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
