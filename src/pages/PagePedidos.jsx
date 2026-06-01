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
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'

// ─── MAPAS ────────────────────────────────────────────────────────────────────
const LOJA_ID = {
  205946980:'shopee', 203414926:'melhorenvio', 204884434:'shein',
  205916963:'tiktokshop', 205693668:'nuvemshop', 0:'loja',
}
const CANAL_CFG = {
  shopee:       {label:'Shopee',       cor:'#ee4d2d', icon:ShoppingBag},
  mercadolivre: {label:'Mercado Livre',cor:'#ffe600', icon:ShoppingCart},
  melhorenvio:  {label:'Melhor Envio', cor:'#0bb07b', icon:Truck},
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
    {data.map((v,i)=><div key={i} style={{width:4,borderRadius:2,
      height:`${Math.max(4,(v/max)*28)}px`,background:i===data.length-1?cor:`${cor}55`}}/>)}
  </div>
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
function AnalyticsView({pedidos, api}) {
  const [geo, setGeo] = useState(null)
  const [geoLoad, setGL] = useState(false)

  useEffect(()=>{
    setGL(true)
    fetch(`${api}/api/dashboard/stats-geo`)
      .then(r=>r.ok?r.json():null).then(d=>{setGeo(d);setGL(false)}).catch(()=>setGL(false))
  },[api])

  const fatDias = useMemo(()=>{
    const m={}; pedidos.forEach(p=>{const d=fmtD(p.data); m[d]=(m[d]||0)+parseFloat(p.total||0)})
    return Object.entries(m).slice(-30).map(([d,v])=>({d,v:Math.round(v)}))
  },[pedidos])

  const porCanal = useMemo(()=>{
    const m={}; pedidos.forEach(p=>{const c=getCanal(p);if(!m[c])m[c]={n:0,v:0};m[c].n++;m[c].v+=parseFloat(p.total||0)})
    return Object.entries(m).map(([k,v])=>({name:CANAL_CFG[k]?.label||k,value:v.n,valor:Math.round(v.v),cor:CANAL_CFG[k]?.cor||'#888'}))
  },[pedidos])

  const calor = useMemo(()=>{
    const g=Array(7).fill(null).map(()=>Array(24).fill(0))
    pedidos.forEach(p=>{const dt=new Date(p.data||0);g[dt.getDay()][dt.getHours()]++})
    return g
  },[pedidos])
  const maxC = Math.max(...calor.flat(),1)
  const DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    {/* Faturamento 30 dias */}
    <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 20px'}}>
      <div style={{fontSize:13,fontWeight:600,color:'var(--label)',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
        <TrendingUp size={14} style={{color:'#7c6af7'}}/>Faturamento — últimos 30 dias
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={fatDias}>
          <defs><linearGradient id="gFat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c6af7" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#7c6af7" stopOpacity={0}/>
          </linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--sep)" vertical={false}/>
          <XAxis dataKey="d" tick={{fontSize:9,fill:'var(--label-4)'}} tickLine={false} axisLine={false}/>
          <YAxis tick={{fontSize:9,fill:'var(--label-4)'}} tickLine={false} axisLine={false}
            tickFormatter={v=>v>=1000?`R$${(v/1000).toFixed(0)}k`:`R$${v}`}/>
          <Tooltip {...TT} formatter={v=>[fmt(v),'Faturamento']}/>
          <Area type="monotone" dataKey="v" stroke="#7c6af7" strokeWidth={2} fill="url(#gFat)" dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      {/* Por canal */}
      <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 20px'}}>
        <div style={{fontSize:13,fontWeight:600,color:'var(--label)',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
          <ShoppingCart size={14} style={{color:'#f97316'}}/>Pedidos por canal
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={porCanal} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
              dataKey="value" paddingAngle={3}>
              {porCanal.map((e,i)=><Cell key={i} fill={e.cor}/>)}
            </Pie>
            <Tooltip {...TT} formatter={(v,n,p)=>[`${v} · ${fmt(p.payload.valor)}`,n]}/>
          </PieChart>
        </ResponsiveContainer>
        {porCanal.map(c=><div key={c.name} style={{display:'flex',alignItems:'center',gap:8,fontSize:11,marginBottom:4}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:c.cor,flexShrink:0}}/>
          <span style={{flex:1,color:'var(--label-3)'}}>{c.name}</span>
          <span style={{color:'var(--label)',fontWeight:600}}>{c.value}</span>
          <span style={{color:'var(--label-4)'}}>{fmt(c.valor)}</span>
        </div>)}
      </div>

      {/* Mapa de calor */}
      <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 20px'}}>
        <div style={{fontSize:13,fontWeight:600,color:'var(--label)',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
          <Activity size={14} style={{color:'#06b6d4'}}/>Horários de pico
        </div>
        <div style={{overflowX:'auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'24px repeat(24,1fr)',gap:2,minWidth:400}}>
            <div/>{Array(24).fill(0).map((_,h)=><div key={h} style={{fontSize:7,color:'var(--label-4)',textAlign:'center'}}>{h}</div>)}
            {calor.map((row,d)=>[
              <div key={`l${d}`} style={{fontSize:9,color:'var(--label-4)',display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:3}}>{DIAS[d]}</div>,
              ...row.map((v,h)=><div key={h} title={`${DIAS[d]} ${h}h: ${v}`} style={{
                aspectRatio:'1',borderRadius:2,
                background:v===0?'var(--fill)':`rgba(6,182,212,${0.15+0.85*(v/maxC)})`,
              }}/>)
            ])}
          </div>
        </div>
      </div>
    </div>

    {/* Stats Geo + Transportadoras */}
    {geoLoad ? (
      <div style={{textAlign:'center',padding:32,color:'var(--label-4)',fontSize:12}}>
        <RefreshCw size={16} style={{animation:'spin 1s linear infinite',marginBottom:8}}/><br/>
        Carregando dados geográficos...
      </div>
    ) : geo && <>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
        {/* Top estados */}
        <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 18px'}}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--label)',marginBottom:12,display:'flex',alignItems:'center',gap:7}}>
            <Map size={13} style={{color:'#22c55e'}}/>Top estados por faturamento
          </div>
          {(geo.topEstados||[]).map((e,i)=><div key={e.uf} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
            <span style={{fontSize:10,fontWeight:700,color:'var(--label-4)',width:16}}>{i+1}</span>
            <span style={{fontSize:11,fontWeight:700,color:'var(--label)',width:28}}>{e.uf}</span>
            <div style={{flex:1,height:4,background:'var(--fill)',borderRadius:99,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:99,background:'#22c55e',
                width:`${(e.valor/(geo.topEstados[0]?.valor||1)*100).toFixed(0)}%`}}/>
            </div>
            <span style={{fontSize:10,color:'var(--label-4)'}}>{fmt(e.valor)}</span>
          </div>)}
        </div>

        {/* Top cidades */}
        <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 18px'}}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--label)',marginBottom:12,display:'flex',alignItems:'center',gap:7}}>
            <MapPin size={13} style={{color:'#a78bfa'}}/>Top cidades por faturamento
          </div>
          {(geo.topCidades||[]).map((c,i)=><div key={c.cidade} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
            <span style={{fontSize:10,fontWeight:700,color:'var(--label-4)',width:16}}>{i+1}</span>
            <span style={{fontSize:11,color:'var(--label)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.cidade}</span>
            <span style={{fontSize:10,color:'var(--label-4)',flexShrink:0}}>{fmt(c.valor)}</span>
          </div>)}
        </div>

        {/* Transportadoras — tempo médio */}
        <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 18px'}}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--label)',marginBottom:12,display:'flex',alignItems:'center',gap:7}}>
            <Timer size={13} style={{color:'#f59e0b'}}/>Tempo médio por transportadora
          </div>
          {(geo.transpStats||[]).length===0
            ? <p style={{fontSize:11,color:'var(--label-4)',margin:0}}>Dados insuficientes</p>
            : (geo.transpStats||[]).map(t=><div key={t.nome} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:11,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:140}}>{t.nome}</span>
                <span style={{fontSize:11,fontWeight:700,color:t.tempoMedio<=3?'#22c55e':t.tempoMedio<=7?'#f59e0b':'#ef4444',flexShrink:0}}>
                  {t.tempoMedio}d
                </span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{flex:1,height:5,background:'var(--fill)',borderRadius:99,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:99,
                    background:t.tempoMedio<=3?'#22c55e':t.tempoMedio<=7?'#f59e0b':'#ef4444',
                    width:`${Math.min(100,(t.tempoMedio/14)*100)}%`}}/>
                </div>
                <span style={{fontSize:9,color:'var(--label-4)',flexShrink:0}}>{t.pedidos} pedidos</span>
              </div>
            </div>)
          }
        </div>
      </div>
    </>}
  </div>
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

// ─── ORDER SHEET ───────────────────────────────────────────────────────────────
function OrderSheet({pedRow, onClose, api, allPedidos}) {
  const [det,    setDet]   = useState(null)
  const [load,   setLoad]  = useState(true)
  const [tab,    setTab]   = useState('geral')
  const [nfe,    setNfe]   = useState(null)
  const [nfLoad, setNFL]   = useState(false)
  const [foto,   setFoto]  = useState(null)
  const [ocors,  setOcors] = useState([])
  const [disps,  setDisps] = useState([])
  const [novaOc, setNOc]   = useState('')
  const [savOc,  setSavOc] = useState(false)
  const [msgTxt, setMsgT]  = useState('')
  const [snd2,   setSnd2]  = useState(false)
  const [sndNF,  setSNF]   = useState(false)
  const [sentNF, setSetNF] = useState(false)
  const [cpOk,   setCpOk]  = useState('')
  const [trackLoad,setTL]  = useState(false)

  const canal = getCanal(pedRow)
  const sitId = getSitId(pedRow)
  const sit   = SIT[sitId]||{label:'—',cor:'#888',bg:'var(--fill)',bdr:'var(--sep)'}

  // Carrega pedido-completo
  useEffect(()=>{
    setLoad(true)
    fetch(`${api}/api/dashboard/pedido-completo/${pedRow.numero}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        setDet(d)
        setLoad(false)
        // Carrega foto de perfil
        const tel = d?.mensagens?.lista?.[0]?.telefone || pedRow.telefone || ''
        if (tel) {
          fetch(`${api}/api/dashboard/foto-perfil/${tel.replace(/\D/g,'')}`)
            .then(r=>r.ok?r.json():null).then(f=>f?.url&&setFoto(f.url)).catch(()=>{})
        }
        // Carrega NF se tiver id
        const nfId = (d?.pedido?.notaFiscal?.id && Number(d.pedido.notaFiscal.id)>0) ? d.pedido.notaFiscal.id : null
        if (nfId) {
          setNFL(true)
          fetch(`${api}/api/dashboard/nfe-link/${nfId}`)
            .then(r=>r.ok?r.json():null).then(n=>{setNfe(n);setNFL(false)}).catch(()=>setNFL(false))
        }
      }).catch(()=>setLoad(false))

    // Ocorrências do cliente (pelo telefone)
    const tel = (pedRow.telefone||'').replace(/\D/g,'')
    if (tel) {
      fetch(`${api}/api/dashboard/ocorrencias?telefone=${tel}`)
        .then(r=>r.ok?r.json():null).then(d=>setOcors(d?.ocorrencias||[])).catch(()=>{})
      fetch(`${api}/api/dashboard/ocorrencias?telefone=55${tel}`)
        .then(r=>r.ok?r.json():null).then(d=>{ if(d?.ocorrencias?.length) setOcors(d.ocorrencias) }).catch(()=>{})
    }
    // Disparos do pedido
    fetch(`${api}/api/dashboard/disparos-pedido/${pedRow.numero}`)
      .then(r=>r.ok?r.json():null).then(d=>setDisps(d?.disparos||[])).catch(()=>{})
  },[pedRow.numero, api])

  const ped       = det?.pedido
  const contato   = det?.contato
  const rastreio  = det?.rastreio
  const hist      = det?.historico?.pedidos || []
  const mensagens = det?.mensagens?.lista   || []
  const transporte= det?.transporte
  const rfmScore  = calcRFM([pedRow,...hist])
  const rfmCfg    = RFM[rfmScore]||RFM.novo
  const RFMIcon   = rfmCfg.icon
  const ltvTotal  = [pedRow,...hist].reduce((s,p)=>s+parseFloat(p.total||0),0)
  const codRas    = rastreio?.codigo 
                    || transporte?.volumes?.[0]?.codigo 
                    || transporte?.volumes?.[0]?.codigoRastreamento
                    || pedRow?.codigoRastreio
                    || ''
  // Usa o link da transportadora correta (detectada pelo backend). Fallback por compatibilidade.
  const linkRas   = rastreio?.link || rastreio?.linkCorreios || rastreio?.linkMelhorRastreio || ''
  const transpNome = rastreio?.transportadora || transporte?.transportadora?.nome || ''

  const cp = (v,k)=>{ navigator.clipboard?.writeText(String(v||'')); setCpOk(k); setTimeout(()=>setCpOk(''),1500) }

  const enviarNF = async()=>{
    const link = nfe?.linkDanfe||nfe?.linkPDF||''
    if (!link||!pedRow.telefone) return
    setSNF(true)
    const msg = `*Nota Fiscal — Pedido #${pedRow.numero}*\n\nSua NF-e foi emitida. Acesse pelo link:\n${link}`
    await fetch(`${api}/api/dashboard/manual/${pedRow.telefone.replace(/\D/g,'')}`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mensagem:msg})
    }).catch(()=>{})
    setSNF(false); setSetNF(true); setTimeout(()=>setSetNF(false),2000)
  }

  const enviarMsg = async()=>{
    if(!msgTxt.trim()||!pedRow.telefone) return
    setSnd2(true)
    await fetch(`${api}/api/dashboard/manual/${pedRow.telefone.replace(/\D/g,'')}`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mensagem:msgTxt})
    }).catch(()=>{})
    setSnd2(false); setMsgT('')
  }

  const criarOc = async()=>{
    if(!novaOc.trim()) return
    setSavOc(true)
    await fetch(`${api}/api/dashboard/ocorrencias`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({telefone:pedRow.telefone,tipo:'suporte',descricao:novaOc,numero_pedido:String(pedRow.numero)})
    }).catch(()=>{})
    setNOc(''); setSavOc(false)
    const tel=(pedRow.telefone||'').replace(/\D/g,'')
    fetch(`${api}/api/dashboard/ocorrencias?telefone=${tel}`)
      .then(r=>r.ok?r.json():null).then(d=>setOcors(d?.ocorrencias||[])).catch(()=>{})
  }

  const TABS = [
    {id:'geral',      label:'Visão Geral',  icon:Info},
    {id:'itens',      label:'Itens',        icon:Box},
    {id:'rastreio',   label:'Rastreio',     icon:Navigation},
    {id:'nfe',        label:'Nota Fiscal',  icon:FileText},
    {id:'historico',  label:'Histórico',    icon:Layers},
    {id:'disparos',   label:'Disparos',     icon:Zap},
    {id:'ocorrencias',label:'Ocorrências',  icon:AlertCircle},
  ]
  const ocAbertos = ocors.filter(o=>o.status!=='resolvido').length

  return <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',
    background:'rgba(0,0,0,.65)',backdropFilter:'blur(6px)'}}
    onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div style={{marginLeft:'auto',width:760,maxWidth:'100%',height:'100%',
      background:'var(--bg)',borderLeft:'1px solid var(--sep)',display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* ── HEADER ── */}
      <div style={{padding:'16px 20px',borderBottom:'1px solid var(--sep)',flexShrink:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
            {/* Foto de perfil */}
            <div style={{flexShrink:0,position:'relative'}}>
              {foto
                ? <img src={foto} style={{width:48,height:48,borderRadius:12,objectFit:'cover'}}/>
                : <div style={{width:48,height:48,borderRadius:12,background:'var(--fill)',
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Users size={20} style={{color:'var(--label-4)'}}/>
                  </div>
              }
              <div style={{position:'absolute',bottom:-4,right:-4,width:18,height:18,borderRadius:'50%',
                background:sit.cor,border:'2px solid var(--bg)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'#fff'}}/>
              </div>
            </div>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontSize:18,fontWeight:700,color:'var(--label)'}}>#{pedRow.numero}</span>
                <Pill label={sit.label} cor={sit.cor} bg={sit.bg} bdr={sit.bdr}/>
                <CanalBadge canal={canal}/>
              </div>
              <div style={{fontSize:12.5,fontWeight:500,color:'var(--label-3)'}}>
                {contato?.nome || pedRow.contato || '—'}
              </div>
              <div style={{fontSize:11,color:'var(--label-4)',marginTop:2}}>
                {fmtDH(pedRow.data)}
                {ped?.numeroLoja && ` · Loja #${ped.numeroLoja}`}
                {ped?.linkBling && <a href={ped.linkBling} target="_blank" rel="noreferrer"
                  style={{color:'var(--accent)',marginLeft:6,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:3}}>
                  <ExternalLink size={10}/> Bling
                </a>}
              </div>
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',
              color:'var(--label-4)',padding:4,display:'flex'}}><X size={18}/></button>
            {/* Badge RFM */}
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',
              borderRadius:99,background:rfmCfg.bg,border:`1px solid ${rfmCfg.cor}30`,
              fontSize:11,fontWeight:700,color:rfmCfg.cor}}>
              <RFMIcon size={11}/>{rfmCfg.label}
              <span style={{fontWeight:400,color:rfmCfg.cor+'99',fontSize:10}}>
                · {hist.length+1} pedidos · {fmt(ltvTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Ações rápidas */}
        <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
          {(nfe?.linkDanfe||nfe?.linkPDF) && <>
            <button onClick={enviarNF} disabled={sndNF||sentNF} style={{
              display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,
              border:`1px solid ${sentNF?'rgba(34,197,94,.5)':'rgba(34,197,94,.35)'}`,
              background:sentNF?'rgba(34,197,94,.15)':'rgba(34,197,94,.08)',
              color:'#22c55e',cursor:'pointer',fontSize:11,fontWeight:600}}>
              <Send size={11}/>{sentNF?'NF enviada!':'Enviar NF ao cliente'}
            </button>
            <a href={nfe.linkDanfe||nfe.linkPDF} target="_blank" rel="noreferrer"
              style={{display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,
                border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-3)',
                cursor:'pointer',fontSize:11,textDecoration:'none'}}>
              <ExternalLink size={11}/>Abrir NF-e
            </a>
          </>}
          {codRas && <button onClick={()=>cp(codRas,'ras')} style={{
            display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,
            border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-3)',cursor:'pointer',fontSize:11}}>
            {cpOk==='ras'?<Check size={11} style={{color:'#22c55e'}}/>:<Copy size={11}/>}Copiar rastreio
          </button>}
          {linkRas && <a href={linkRas} target="_blank" rel="noreferrer"
            style={{display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,
              border:'1px solid rgba(6,182,212,.35)',background:'rgba(6,182,212,.08)',
              color:'#06b6d4',cursor:'pointer',fontSize:11,textDecoration:'none'}}>
            <Navigation size={11}/>Rastrear
          </a>}
          {pedRow.telefone && <button onClick={()=>window.open(`https://wa.me/${pedRow.telefone.replace(/\D/g,'')}`,`_blank`)}
            style={{display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,
              border:'1px solid rgba(37,211,102,.35)',background:'rgba(37,211,102,.08)',
              color:'#25d366',cursor:'pointer',fontSize:11}}>
            <MessageSquare size={11}/>WhatsApp
          </button>}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{display:'flex',borderBottom:'1px solid var(--sep)',flexShrink:0,overflowX:'auto'}}>
        {TABS.map(t=>{const Ic=t.icon;const active=tab===t.id;return(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            display:'flex',alignItems:'center',gap:5,padding:'10px 14px',
            border:'none',background:'none',cursor:'pointer',fontSize:11.5,
            fontWeight:active?700:500,whiteSpace:'nowrap',
            color:active?'var(--accent)':'var(--label-4)',
            borderBottom:active?'2px solid var(--accent)':'2px solid transparent'}}>
            <Ic size={12}/>{t.label}
            {t.id==='ocorrencias'&&ocAbertos>0&&<span style={{fontSize:9,padding:'1px 5px',
              borderRadius:99,background:'rgba(239,68,68,.15)',color:'#ef4444',fontWeight:700}}>{ocAbertos}</span>}
            {t.id==='disparos'&&disps.length>0&&<span style={{fontSize:9,padding:'1px 5px',
              borderRadius:99,background:'rgba(124,106,247,.15)',color:'#7c6af7',fontWeight:700}}>{disps.length}</span>}
          </button>
        )})}
      </div>

      {/* ── CONTEÚDO ── */}
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
        {load ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,
            color:'var(--label-4)',gap:10,fontSize:13}}>
            <RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/>Carregando pedido...
          </div>
        ) : <>

          {/* GERAL */}
          {tab==='geral'&&<div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {/* Dados do cliente */}
              <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 14px'}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',
                  letterSpacing:'.06em',marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
                  <Users size={10}/>Cliente
                </div>
                {[
                  ['Nome',      contato?.nome],
                  ['Telefone',  contato?.celular||contato?.telefone||pedRow.telefone],
                  ['Documento', contato?.cpfCnpj],
                  ['Email',     contato?.email],
                  ['Nascimento',contato?.nascimento?fmtD(contato.nascimento):null],
                ].filter(([,v])=>v).map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:12}}>
                  <span style={{color:'var(--label-4)'}}>{k}</span>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    {k==='Documento'&&<Cp val={v} label=""/>}
                    <span style={{color:'var(--label)',fontWeight:500,textAlign:'right',maxWidth:200,
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</span>
                  </div>
                </div>)}
                {contato?.linkBling&&<a href={contato.linkBling} target="_blank" rel="noreferrer"
                  style={{fontSize:10,color:'var(--accent)',textDecoration:'none',display:'flex',alignItems:'center',gap:4,marginTop:4}}>
                  <ExternalLink size={9}/>Ver no Bling
                </a>}
              </div>

              {/* Endereço */}
              <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 14px'}}>
                <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',
                  letterSpacing:'.06em',marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
                  <MapPin size={10}/>Entrega
                </div>
                {(()=>{
                  const e = transporte?.etiqueta || ped?.transporte?.etiqueta || contato?.enderecos?.[0]
                  if(!e) return <p style={{fontSize:12,color:'var(--label-4)',margin:0}}>Não informado</p>
                  return <div style={{fontSize:12,color:'var(--label)',lineHeight:1.8}}>
                    <div>{e.endereco}{e.numero?`, ${e.numero}`:''}{e.complemento?` · ${e.complemento}`:''}</div>
                    <div style={{color:'var(--label-3)'}}>{e.bairro&&`${e.bairro} · `}{e.municipio}/{e.uf}</div>
                    <div style={{color:'var(--label-4)',fontSize:11}}>CEP: {e.cep}</div>
                  </div>
                })()}
                {transporte?.transportadora&&<div style={{marginTop:10,paddingTop:10,borderTop:'1px solid var(--sep)',
                  display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--label-3)'}}>
                  <Truck size={11}/>{transporte.transportadora}
                  {transporte?.frete>0&&<span style={{color:'var(--label-4)'}}>· Frete: {fmt(transporte.frete)}</span>}
                </div>}
              </div>
            </div>

            {/* Resumo financeiro */}
            <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 16px'}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',
                letterSpacing:'.06em',marginBottom:12,display:'flex',alignItems:'center',gap:5}}>
                <DollarSign size={10}/>Resumo financeiro
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:10}}>
                {[
                  ['Produtos',  ped?.totalProdutos],
                  ['Frete',     transporte?.frete],
                  ['Desconto',  ped?.totalDesconto],
                  ['Total',     ped?.total||pedRow.total],
                ].map(([k,v])=><div key={k} style={{textAlign:'center'}}>
                  <div style={{fontSize:10,color:'var(--label-4)',marginBottom:3}}>{k}</div>
                  <div style={{fontSize:15,fontWeight:700,color:k==='Total'?'var(--accent)':'var(--label)'}}>{fmt(v)}</div>
                </div>)}
              </div>
              {ped?.formaPagamento&&<div style={{borderTop:'1px solid var(--sep)',paddingTop:8,
                display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--label-4)'}}>
                <CreditCard size={11}/>{ped.formaPagamento}
              </div>}
            </div>

            {/* Enviar mensagem */}
            <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 14px'}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',
                letterSpacing:'.06em',marginBottom:8,display:'flex',alignItems:'center',gap:5}}>
                <MessageSquare size={10}/>Enviar mensagem ao cliente
              </div>
              <div style={{display:'flex',gap:8}}>
                <input value={msgTxt} onChange={e=>setMsgT(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&enviarMsg()}
                  placeholder="Digite a mensagem e pressione Enter..." style={{
                    flex:1,padding:'8px 12px',borderRadius:8,
                    border:'1px solid var(--sep)',background:'var(--fill)',
                    color:'var(--label)',fontSize:12}}/>
                <button onClick={enviarMsg} disabled={snd2||!msgTxt.trim()} style={{
                  padding:'8px 14px',borderRadius:8,border:'none',
                  background:snd2?'var(--fill)':'var(--accent)',
                  color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,
                  display:'flex',alignItems:'center',gap:5}}>
                  <Send size={12}/>{snd2?'...':'Enviar'}
                </button>
              </div>
            </div>

            {/* Conversa recente */}
            {mensagens.length>0&&<div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 14px'}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',
                letterSpacing:'.06em',marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
                <MessageSquare size={10}/>Últimas mensagens WhatsApp
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:200,overflowY:'auto'}}>
                {mensagens.slice(-10).map((m,i)=>{
                  const isIn=m.direcao==='entrada'
                  return <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',
                    flexDirection:isIn?'row':'row-reverse'}}>
                    <div style={{maxWidth:'80%',padding:'6px 10px',borderRadius:isIn?'4px 12px 12px 12px':'12px 4px 12px 12px',
                      background:isIn?'var(--fill)':'rgba(124,106,247,.12)',
                      border:`1px solid ${isIn?'var(--sep)':'rgba(124,106,247,.2)'}`}}>
                      <p style={{fontSize:11.5,color:'var(--label)',margin:0,lineHeight:1.5}}>{m.conteudo||m.texto||'—'}</p>
                      <div style={{fontSize:9,color:'var(--label-4)',marginTop:3,textAlign:'right'}}>
                        {fmtDH(m.criado_em)}
                      </div>
                    </div>
                  </div>
                })}
              </div>
            </div>}
          </div>}

          {/* ITENS */}
          {tab==='itens'&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
            {(!ped?.itens||ped.itens.length===0)
              ? <div style={{textAlign:'center',padding:48,color:'var(--label-4)'}}>
                  <Package size={32} style={{opacity:.15,marginBottom:12}}/><br/>
                  <p style={{fontSize:13,margin:'0 0 4px'}}>Itens não carregados.</p>
                  <p style={{fontSize:11,margin:0}}>O pedido pode estar em processamento.</p>
                </div>
              : ped.itens.map((item,i)=><div key={i} style={{
                  display:'flex',alignItems:'center',gap:12,
                  background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:10,padding:'10px 12px'}}>
                  <div style={{width:42,height:42,borderRadius:8,background:'var(--fill)',
                    display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
                    {(item._img||item.imagem||item.imagemURL)
                      ? <img src={item._img||item.imagem||item.imagemURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      : <Box size={16} style={{color:'var(--label-4)'}}/>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12.5,fontWeight:600,color:'var(--label)',
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {item.descricao||item.nome||'—'}
                    </div>
                    <div style={{display:'flex',gap:10,marginTop:3}}>
                      {item.codigo&&<span style={{fontSize:10,color:'var(--label-4)'}}>SKU: {item.codigo}</span>}
                      <span style={{fontSize:10,color:'var(--label-4)'}}>Unid: {item.unidade||'UN'}</span>
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:11,color:'var(--label-4)'}}>{item.quantidade}× {fmt(item.valor)}</div>
                    <div style={{fontSize:14,fontWeight:700,color:'var(--label)'}}>
                      {fmt(item.valorTotal||(parseFloat(item.valor||0)*parseInt(item.quantidade||1)))}
                    </div>
                  </div>
                </div>)
            }
            {/* Totais */}
            {ped?.itens?.length>0&&<div style={{
              display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:4,
              background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:10,padding:'12px 14px'}}>
              {[
                ['Produtos', fmt(ped.totalProdutos)],
                ['Frete',    fmt(transporte?.frete)],
                ['Total',    fmt(ped.total||pedRow.total)],
              ].map(([k,v])=><div key={k} style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'var(--label-4)',marginBottom:2}}>{k}</div>
                <div style={{fontSize:14,fontWeight:700,color:k==='Total'?'var(--accent)':'var(--label)'}}>{v}</div>
              </div>)}
            </div>}
          </div>}

          {/* RASTREIO */}
          {tab==='rastreio'&&<div style={{display:'flex',flexDirection:'column',gap:12}}>
            {/* Info envio */}
            <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 14px'}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',
                letterSpacing:'.06em',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:5}}><Truck size={10}/>Informações de envio</div>
                {linkRas&&<a href={linkRas} target="_blank" rel="noreferrer"
                  style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'var(--accent)',textDecoration:'none'}}>
                  <ExternalLink size={10}/>Rastrear online
                </a>}
              </div>
              {[
                ['Transportadora', transporte?.transportadora],
                ['Código', codRas],
                ['Data envio', fmtD(ped?.dataSaida)],
                ['Previsão',   fmtD(ped?.dataPrevista)],
                ['Status', rastreio?.status],
              ].filter(([,v])=>v).map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:12}}>
                <span style={{color:'var(--label-4)'}}>{k}</span>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  {k==='Código'&&<Cp val={v} label=""/>}
                  <span style={{color:'var(--label)',fontWeight:500}}>{v}</span>
                </div>
              </div>)}
            </div>

            {/* Timeline eventos */}
            {trackLoad ? (
              <div style={{textAlign:'center',padding:32,color:'var(--label-4)',fontSize:12}}>
                <RefreshCw size={14} style={{animation:'spin 1s linear infinite'}}/><br/>Consultando...
              </div>
            ) : (rastreio?.eventos||[]).length>0 ? (
              <div style={{position:'relative'}}>
                <div style={{position:'absolute',left:15,top:16,bottom:16,width:2,background:'var(--sep)'}}/>
                {rastreio.eventos.map((ev,i)=><div key={i} style={{display:'flex',gap:12,marginBottom:14,position:'relative'}}>
                  <div style={{width:30,height:30,borderRadius:'50%',flexShrink:0,zIndex:1,
                    background:i===0?'var(--accent)':'var(--fill)',
                    border:`2px solid ${i===0?'var(--accent)':'var(--sep)'}`,
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Circle size={7} fill={i===0?'#fff':'var(--label-4)'} style={{color:i===0?'#fff':'var(--label-4)'}}/>
                  </div>
                  <div style={{flex:1,paddingTop:5,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:i===0?600:400,color:i===0?'var(--label)':'var(--label-3)'}}>
                      {ev.status||ev.descricao||ev.evento||ev.raw||'—'}
                    </div>
                    <div style={{fontSize:10.5,color:'var(--label-4)',marginTop:2}}>
                      {ev.data||ev.dtHrCriado||ev.happened_at||''}
                      {ev.local||ev.unidade||ev.origem ? ` · ${ev.local||ev.unidade||ev.origem}` : ''}
                      {ev.detalhe ? ` · ${ev.detalhe}` : ''}
                    </div>
                  </div>
                </div>)}
              </div>
            ) : !codRas ? (
              <div style={{textAlign:'center',padding:40,color:'var(--label-4)'}}>
                <Navigation size={32} style={{opacity:.15,marginBottom:12}}/><br/>
                <p style={{fontSize:13,margin:0}}>Código de rastreio não disponível.</p>
                <p style={{fontSize:11,margin:'6px 0 0',color:'var(--label-4)'}}>
                  Este pedido ainda não possui código de rastreio no Bling.
                </p>
              </div>
            ) : (
              <div style={{padding:24,background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                  <Navigation size={18} style={{color:'#f59e0b',flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--label)'}}>Aguardando movimentação</div>
                    <div style={{fontSize:11,color:'var(--label-4)',marginTop:2}}>
                      O pacote foi postado mas ainda sem eventos registrados.
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,
                  padding:'8px 12px',background:'var(--fill)',borderRadius:8}}>
                  <span style={{fontSize:11,color:'var(--label-4)'}}>Código:</span>
                  <span style={{fontSize:12,fontFamily:'monospace',fontWeight:600,color:'var(--label)'}}>{codRas}</span>
                  <button onClick={()=>cp(codRas,'codras')} style={{
                    marginLeft:'auto',background:'none',border:'none',cursor:'pointer',
                    color:'var(--label-4)',display:'flex',alignItems:'center'}}>
                    {cpOk==='codras'?<Check size={12} style={{color:'#22c55e'}}/>:<Copy size={12}/>}
                  </button>
                </div>
                {linkRas&&<a href={linkRas} target="_blank" rel="noreferrer"
                  style={{display:'flex',alignItems:'center',gap:5,marginTop:10,
                    padding:'7px 12px',borderRadius:8,border:'1px solid rgba(6,182,212,.3)',
                    background:'rgba(6,182,212,.06)',color:'#06b6d4',fontSize:12,textDecoration:'none',
                    justifyContent:'center'}}>
                  <ExternalLink size={12}/>Rastrear no site da transportadora
                </a>}
              </div>
            )}
          </div>}

          {/* NOTA FISCAL */}
          {tab==='nfe'&&<div style={{display:'flex',flexDirection:'column',gap:12}}>
            {nfLoad ? (
              <div style={{textAlign:'center',padding:40,color:'var(--label-4)',fontSize:12}}>
                <RefreshCw size={16} style={{animation:'spin 1s linear infinite',marginBottom:8}}/><br/>
                Buscando nota fiscal...
              </div>
            ) : !ped?.notaFiscal?.id ? (
              <div style={{textAlign:'center',padding:48,color:'var(--label-4)'}}>
                <FileText size={36} style={{opacity:.15,marginBottom:12}}/><br/>
                <p style={{fontSize:13,margin:'0 0 4px'}}>Nota fiscal não emitida para este pedido.</p>
                <p style={{fontSize:11,margin:0}}>Use a IA para emitir via WhatsApp ou acesse o Bling.</p>
              </div>
            ) : <>
              {/* Card NF */}
              <div style={{background:'var(--bg-2)',
                border:`1px solid ${nfe?.linkDanfe?'rgba(34,197,94,.35)':'var(--sep)'}`,
                borderRadius:12,padding:'16px 18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                  <div style={{width:40,height:40,borderRadius:10,
                    background:nfe?.linkDanfe?'rgba(34,197,94,.12)':'var(--fill)',
                    display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <FileText size={18} style={{color:nfe?.linkDanfe?'#22c55e':'var(--label-4)'}}/>
                  </div>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:'var(--label)'}}>
                      NF-e #{nfe?.numero||ped.notaFiscal.id}
                    </div>
                    <div style={{fontSize:11,color:nfe?.situacao?.includes('autoriz')?'#22c55e':'var(--label-4)',
                      display:'flex',alignItems:'center',gap:5,marginTop:2}}>
                      <ShieldCheck size={11}/>
                      {nfe?.situacao==='autorizada'?'Autorizada pela SEFAZ':nfe?.situacao||'Em processamento'}
                    </div>
                  </div>
                </div>
                {[
                  ['Número',     nfe?.numero||ped.notaFiscal.id],
                  ['Data emissão', nfe?.dataEmissao?fmtD(nfe.dataEmissao):'—'],
                  ['Protocolo',  nfe?.protocolo],
                  ['Chave NF-e', nfe?.chaveAcesso],
                ].filter(([,v])=>v).map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:12}}>
                  <span style={{color:'var(--label-4)'}}>{k}</span>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    {['Chave NF-e','Protocolo'].includes(k)&&<Cp val={v} label=""/>}
                    <span style={{color:'var(--label)',fontWeight:500,textAlign:'right',maxWidth:300,
                      overflow:'hidden',textOverflow:'ellipsis',
                      fontFamily:k==='Chave NF-e'?'monospace':undefined,
                      fontSize:k==='Chave NF-e'?9.5:12}}>{v}</span>
                  </div>
                </div>)}
              </div>
              {/* Ações NF */}
              {(nfe?.linkDanfe||nfe?.xml) && <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                {nfe.linkDanfe&&<>
                  <a href={nfe.linkDanfe} target="_blank" rel="noreferrer"
                    style={{display:'flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:9,
                      border:'1px solid rgba(34,197,94,.35)',background:'rgba(34,197,94,.08)',
                      color:'#22c55e',fontSize:12,fontWeight:600,textDecoration:'none',cursor:'pointer'}}>
                    <ExternalLink size={13}/>Abrir PDF / DANFE
                  </a>
                  <button onClick={enviarNF} disabled={sndNF||sentNF} style={{
                    display:'flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:9,
                    border:'1px solid rgba(37,211,102,.35)',
                    background:sentNF?'rgba(37,211,102,.15)':'rgba(37,211,102,.08)',
                    color:'#25d366',cursor:'pointer',fontSize:12,fontWeight:600}}>
                    <Send size={13}/>{sentNF?'Enviada ao cliente!':'Enviar ao cliente (WA)'}
                  </button>
                  <Cp val={nfe.linkDanfe} label="Copiar link"/>
                </>}
                {nfe.xml&&<a href={nfe.xml} target="_blank" rel="noreferrer"
                  style={{display:'flex',alignItems:'center',gap:6,padding:'9px 14px',borderRadius:9,
                    border:'1px solid var(--sep)',background:'var(--fill)',
                    color:'var(--label-3)',fontSize:12,textDecoration:'none',cursor:'pointer'}}>
                  <Download size={13}/>Baixar XML
                </a>}
              </div>}
            </>}
          </div>}

          {/* HISTÓRICO */}
          {tab==='historico'&&<div style={{display:'flex',flexDirection:'column',gap:12}}>
            {/* LTV */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,
              background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'14px 16px'}}>
              {[
                ['Total pedidos', `${hist.length+1}`],
                ['LTV total',     fmt(ltvTotal)],
                ['Ticket médio',  fmt(ltvTotal/Math.max(hist.length+1,1))],
                ['Desde',         det?.historico?.pedidos?.length>0?fmtD(hist[hist.length-1]?.data):'—'],
              ].map(([k,v])=><div key={k} style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'var(--label-4)',marginBottom:3}}>{k}</div>
                <div style={{fontSize:15,fontWeight:700,color:'var(--label)'}}>{v}</div>
              </div>)}
            </div>
            {/* Gráfico por mês */}
            {hist.length>0&&(()=>{
              const m={}
              ;[pedRow,...hist].forEach(p=>{
                const mes=p.data?new Date(p.data).toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}):'—'
                m[mes]=(m[mes]||0)+parseFloat(p.total||0)
              })
              const dados=Object.entries(m).map(([mes,v])=>({mes,v:Math.round(v)}))
              return <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'14px 16px'}}>
                <div style={{fontSize:11,fontWeight:600,color:'var(--label-4)',marginBottom:10,
                  display:'flex',alignItems:'center',gap:5}}><BarChart3 size={11}/>Compras por período</div>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={dados}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--sep)" vertical={false}/>
                    <XAxis dataKey="mes" tick={{fontSize:9,fill:'var(--label-4)'}} tickLine={false} axisLine={false}/>
                    <YAxis tick={{fontSize:9,fill:'var(--label-4)'}} tickLine={false} axisLine={false}
                      tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
                    <Tooltip {...TT} formatter={v=>[fmt(v)]}/>
                    <Bar dataKey="v" fill="var(--accent)" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            })()}
            {/* Lista */}
            {hist.length===0
              ? <p style={{color:'var(--label-4)',fontSize:12,textAlign:'center',padding:20}}>Primeiro pedido do cliente.</p>
              : hist.map(p=>{const sid=getSitId(p);const s=SIT[sid]||{label:'—',cor:'#888'}
                return <div key={p.numero} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                  background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:10,padding:'10px 14px'}}>
                  <div>
                    <div style={{fontSize:12.5,fontWeight:600,color:'var(--label)'}}>#{p.numero}</div>
                    <div style={{fontSize:11,color:'var(--label-4)'}}>{fmtD(p.data)}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <CanalBadge canal={p.canal||getCanal(p)} small/>
                    <Pill label={s.label} cor={s.cor} bg={s.bg} sz={10}/>
                    <span style={{fontSize:13,fontWeight:700,color:'var(--label)'}}>{fmt(p.total)}</span>
                  </div>
                </div>}
              )
            }
          </div>}

          {/* DISPAROS */}
          {tab==='disparos'&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
            {disps.length===0
              ? <div style={{textAlign:'center',padding:40,color:'var(--label-4)'}}>
                  <Zap size={32} style={{opacity:.15,marginBottom:12}}/><br/>
                  <p style={{fontSize:13,margin:0}}>Nenhum disparo automático registrado para este pedido.</p>
                </div>
              : disps.map((d,i)=><div key={i} style={{
                  display:'flex',alignItems:'center',gap:12,
                  background:'var(--bg-2)',border:`1px solid ${d.status==='enviado'?'rgba(34,197,94,.2)':d.status==='erro'?'rgba(239,68,68,.2)':'var(--sep)'}`,
                  borderRadius:10,padding:'10px 14px'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',flexShrink:0,
                    background:d.status==='enviado'?'#22c55e':d.status==='erro'?'#ef4444':'#f59e0b'}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:'var(--label)'}}>{d.template_nome||d.gatilho||'—'}</div>
                    <div style={{fontSize:10,color:'var(--label-4)',marginTop:2}}>
                      {d.gatilho} · {fmtDH(d.criado_em)}
                    </div>
                  </div>
                  <Pill label={d.status||'—'}
                    cor={d.status==='enviado'?'#22c55e':d.status==='erro'?'#ef4444':'#f59e0b'}
                    bg={d.status==='enviado'?'rgba(34,197,94,.1)':d.status==='erro'?'rgba(239,68,68,.1)':'rgba(245,158,11,.1)'}
                    sz={10}/>
                </div>)
            }
          </div>}

          {/* OCORRÊNCIAS */}
          {tab==='ocorrencias'&&<div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 14px'}}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--label)',marginBottom:8,
                display:'flex',alignItems:'center',gap:6}}><AlertCircle size={12}/>Abrir nova ocorrência</div>
              <div style={{display:'flex',gap:8}}>
                <input value={novaOc} onChange={e=>setNOc(e.target.value)}
                  placeholder="Descreva o problema deste cliente..." style={{
                    flex:1,padding:'7px 10px',borderRadius:8,
                    border:'1px solid var(--sep)',background:'var(--fill)',
                    color:'var(--label)',fontSize:12}}/>
                <button onClick={criarOc} disabled={savOc||!novaOc.trim()} style={{
                  padding:'7px 14px',borderRadius:8,border:'none',
                  background:'var(--accent)',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600}}>
                  {savOc?'...':'Abrir'}
                </button>
              </div>
            </div>
            {ocors.length===0
              ? <div style={{textAlign:'center',padding:32,color:'var(--label-4)'}}>
                  <AlertCircle size={28} style={{opacity:.15,marginBottom:10}}/><br/>
                  <p style={{fontSize:12,margin:0}}>Nenhuma ocorrência registrada para este cliente.</p>
                </div>
              : ocors.map((oc,i)=><div key={i} style={{
                  background:'var(--bg-2)',
                  border:`1px solid ${oc.status==='resolvido'?'rgba(34,197,94,.25)':oc.status==='em_atendimento'?'rgba(74,159,255,.25)':'var(--sep)'}`,
                  borderRadius:10,padding:'10px 14px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:11,fontWeight:600,color:'var(--label)'}}>
                        {oc.tipo||'Suporte'}
                      </span>
                      <Pill label={oc.status||'aberto'}
                        cor={oc.status==='resolvido'?'#22c55e':oc.status==='em_atendimento'?'#4a9fff':'#f59e0b'}
                        bg={oc.status==='resolvido'?'rgba(34,197,94,.1)':oc.status==='em_atendimento'?'rgba(74,159,255,.1)':'rgba(245,158,11,.1)'}
                        sz={9}/>
                    </div>
                    <span style={{fontSize:10,color:'var(--label-4)'}}>{fmtDH(oc.criado_em)}</span>
                  </div>
                  <p style={{fontSize:12,color:'var(--label-3)',margin:0,lineHeight:1.6}}>{oc.descricao}</p>
                  {oc.ticketId&&<div style={{fontSize:10,color:'var(--label-4)',marginTop:6,
                    display:'flex',alignItems:'center',gap:4}}><Hash size={9}/>Protocolo: {oc.ticketId}</div>}
                </div>)
            }
          </div>}

        </>}
      </div>
    </div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
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
  const [live,      setLive]  = useState(0)
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
            {/* Header tabela */}
            <div style={{display:'grid',gridTemplateColumns:'80px 80px 1fr 100px 85px 90px 130px 56px',
              gap:0,padding:'5px 8px',marginBottom:4}}>
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
                return <div key={p.numero} onClick={()=>setSel(p)} style={{
                  display:'grid',gridTemplateColumns:'80px 80px 1fr 100px 85px 90px 130px 56px',
                  gap:0,padding:'9px 8px',marginBottom:3,background:'var(--bg-2)',
                  border:'1px solid var(--sep)',borderRadius:10,cursor:'pointer',
                  transition:'border-color .12s',alignItems:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=s.cor}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--sep)'}>
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

    {sel&&<OrderSheet pedRow={sel} onClose={()=>setSel(null)} api={api} allPedidos={pedidos}/>}
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
}
