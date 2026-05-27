/**
 * PagePedidos.jsx — Bia v6 Enterprise
 * Central de Pedidos — Command Center para agente de atendimento
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  ShoppingCart, Clock, CheckCircle, TrendingUp, TrendingDown,
  AlertTriangle, Search, Filter, X, ChevronDown, ChevronUp,
  RefreshCw, Download, Send, Copy, Check, ExternalLink,
  Package, Truck, FileText, MessageSquare, Star, Crown,
  AlertCircle, BarChart3, PieChart as PieIcon, Activity,
  ChevronLeft, ChevronRight, Eye, Bell, Zap, Users,
  MapPin, CreditCard, Phone, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, Circle, Navigation, Hash, Calendar,
  Info, Flame, ShieldCheck, DollarSign, Box, Layers,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

// ─── MAPAS DE DADOS ──────────────────────────────────────────────────────────
const LOJA_ID = {
  205946980:'shopee', 203414926:'mercadolivre', 204884434:'shein',
  205916963:'tiktokshop', 205693668:'nuvemshop', 0:'loja',
}
const CANAL_CFG = {
  shopee:       {label:'Shopee',       cor:'#f97316', bg:'rgba(249,115,22,.12)',  icon:'🛍️'},
  mercadolivre: {label:'Mercado Livre',cor:'#eab308', bg:'rgba(234,179,8,.12)',   icon:'🛒'},
  shein:        {label:'Shein',        cor:'#ec4899', bg:'rgba(236,72,153,.12)',  icon:'👗'},
  tiktokshop:   {label:'TikTok',       cor:'#06b6d4', bg:'rgba(6,182,212,.12)',   icon:'🎵'},
  nuvemshop:    {label:'Nuvemshop',    cor:'#a78bfa', bg:'rgba(167,139,250,.12)', icon:'☁️'},
  loja:         {label:'Loja Própria', cor:'#22c55e', bg:'rgba(34,197,94,.12)',   icon:'🏪'},
  bling:        {label:'Bling/Manual', cor:'#60a5fa', bg:'rgba(96,165,250,.12)',  icon:'📋'},
}
const SIT = {
  6:  {label:'Em Aberto',  cor:'#f59e0b', bg:'rgba(245,158,11,.12)', bdr:'rgba(245,158,11,.3)',  ordem:1},
  9:  {label:'Atendido',   cor:'#4a9fff', bg:'rgba(74,159,255,.12)', bdr:'rgba(74,159,255,.3)',  ordem:3},
  12: {label:'Cancelado',  cor:'#ef4444', bg:'rgba(239,68,68,.12)',  bdr:'rgba(239,68,68,.3)',   ordem:-1},
  15: {label:'Verificado', cor:'#22c55e', bg:'rgba(34,197,94,.12)',  bdr:'rgba(34,197,94,.3)',   ordem:4},
}
const RFM_BADGE = {
  vip:      {label:'VIP',        icon:'👑', cor:'#f59e0b', bg:'rgba(245,158,11,.15)'},
  fiel:     {label:'Fiel',       icon:'⭐', cor:'#22c55e', bg:'rgba(34,197,94,.15)'},
  novo:     {label:'Novo',       icon:'🌱', cor:'#06b6d4', bg:'rgba(6,182,212,.15)'},
  em_risco: {label:'Em Risco',   icon:'⚠️', cor:'#f97316', bg:'rgba(249,115,22,.15)'},
  perdido:  {label:'Perdido',    icon:'💤', cor:'#6b7280', bg:'rgba(107,114,128,.15)'},
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
function fmtMoeda(v) {
  return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}
function fmtData(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})
}
function fmtDataHora(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
}
function calcRFM(historico) {
  if (!historico?.length) return 'novo'
  const total = historico.reduce((s,p)=>s+parseFloat(p.total||0),0)
  const ultima = new Date(historico[0]?.data||Date.now())
  const diasSemCompra = (Date.now()-ultima.getTime())/(1000*60*60*24)
  if (historico.length >= 5 && total >= 3000) return 'vip'
  if (historico.length >= 3) return 'fiel'
  if (diasSemCompra > 90) return historico.length >= 2 ? 'em_risco' : 'perdido'
  return 'novo'
}

// ─── ATOMS ───────────────────────────────────────────────────────────────────
function Pill({label, cor, bg, bdr, size=11}) {
  return (
    <span style={{
      fontSize:size, fontWeight:700, padding:'2px 8px', borderRadius:99,
      color:cor, background:bg, border:`1px solid ${bdr||cor+'33'}`,
      whiteSpace:'nowrap', flexShrink:0,
    }}>{label}</span>
  )
}
function CanalBadge({canal, small}) {
  const c = CANAL_CFG[canal] || CANAL_CFG.bling
  return (
    <span style={{
      fontSize:small?9:10, fontWeight:700, padding:small?'1px 5px':'2px 8px',
      borderRadius:99, color:c.cor, background:c.bg, whiteSpace:'nowrap', flexShrink:0,
    }}>{c.icon} {c.label}</span>
  )
}
function CopyBtn({val, label}) {
  const [ok, setOk] = useState(false)
  return (
    <button onClick={()=>{navigator.clipboard?.writeText(val||'');setOk(true);setTimeout(()=>setOk(false),1500)}}
      title="Copiar" style={{
        display:'inline-flex',alignItems:'center',gap:4,
        padding:'3px 8px',borderRadius:6,border:'1px solid var(--sep)',
        background:'var(--fill)',color:'var(--label-3)',cursor:'pointer',fontSize:11,
      }}>
      {ok ? <Check size={11} style={{color:'#22c55e'}}/> : <Copy size={11}/>}
      {label||'Copiar'}
    </button>
  )
}
function SparkBar({data=[], cor='#7c6af7'}) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:2,height:28,flexShrink:0}}>
      {data.map((v,i)=>(
        <div key={i} style={{
          width:4, borderRadius:2,
          height:`${Math.max(4,(v/max)*28)}px`,
          background:i===data.length-1?cor:`${cor}55`,
          transition:'height .3s',
        }}/>
      ))}
    </div>
  )
}

// ─── KPI CARD ────────────────────────────────────────────────────────────────
function KCard({icon:Ic, label, value, sub, cor='#7c6af7', trend, spark, alert, onClick}) {
  return (
    <div onClick={onClick} style={{
      background:'var(--bg-2)', border:`1px solid var(--sep)`, borderRadius:14,
      padding:'14px 16px', display:'flex', flexDirection:'column', gap:8,
      cursor:onClick?'pointer':'default', transition:'border-color .15s',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{position:'absolute',top:0,right:0,width:80,height:80,
        background:`radial-gradient(circle at 100% 0%, ${cor}15 0%, transparent 70%)`,
        pointerEvents:'none'}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div style={{width:32,height:32,borderRadius:9,background:`${cor}18`,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Ic size={15} style={{color:cor}}/>
        </div>
        {trend !== undefined && (
          <div style={{display:'flex',alignItems:'center',gap:3,fontSize:11,fontWeight:600,
            color:trend>=0?'#22c55e':'#ef4444'}}>
            {trend>=0?<ArrowUpRight size={12}/>:<ArrowDownRight size={12}/>}
            {Math.abs(trend)}%
          </div>
        )}
        {alert && <Bell size={13} style={{color:'#f59e0b'}}/>}
      </div>
      <div>
        <div style={{fontSize:22,fontWeight:700,color:'var(--label)',lineHeight:1.1}}>{value}</div>
        <div style={{fontSize:11,color:'var(--label-4)',marginTop:2}}>{label}</div>
        {sub && <div style={{fontSize:10,color:'var(--label-4)',marginTop:1}}>{sub}</div>}
      </div>
      {spark && <SparkBar data={spark} cor={cor}/>}
    </div>
  )
}

// ─── ALERT BAR ───────────────────────────────────────────────────────────────
function AlertBar({pedidos, onFilter}) {
  const alertas = useMemo(()=>{
    const semEnvio = pedidos.filter(p=>{
      const sit = getSitId(p)
      const dias = (Date.now()-new Date(p.data||Date.now()).getTime())/(1000*60*60*24)
      return sit===9 && dias>3 && !p.codigoRastreio && !p.transporte?.volumes?.[0]?.codigoRastreamento
    })
    const emTransito = pedidos.filter(p=>{
      const sit = getSitId(p)
      const dias = (Date.now()-new Date(p.dataSaida||p.data||Date.now()).getTime())/(1000*60*60*24)
      return [27,33].includes(sit) && dias>15
    })
    const semNF = pedidos.filter(p=> getSitId(p)===9 && !p.notaFiscal?.id)
    const list = []
    if (semEnvio.length)   list.push({icon:Truck,    msg:`${semEnvio.length} pedido${semEnvio.length>1?'s':''} pagos há +3 dias sem envio`, cor:'#ef4444', key:'semEnvio'})
    if (emTransito.length) list.push({icon:AlertTriangle, msg:`${emTransito.length} pedido${emTransito.length>1?'s':''} em trânsito há +15 dias`, cor:'#f59e0b', key:'transito'})
    if (semNF.length)      list.push({icon:FileText,  msg:`${semNF.length} pedido${semNF.length>1?'s':''} atendidos sem NF emitida`, cor:'#f97316', key:'semNF'})
    return list
  },[pedidos])

  if (!alertas.length) return null
  return (
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
      {alertas.map(a=>(
        <div key={a.key} onClick={()=>onFilter?.(a.key)} style={{
          display:'flex',alignItems:'center',gap:7,padding:'6px 12px',
          borderRadius:99,background:`${a.cor}12`,border:`1px solid ${a.cor}30`,
          cursor:'pointer',fontSize:11.5,fontWeight:500,color:a.cor,
        }}>
          <a.icon size={12}/>{a.msg}
        </div>
      ))}
    </div>
  )
}

// ─── ANALYTICS VIEW ──────────────────────────────────────────────────────────
function AnalyticsView({pedidos}) {
  const faturamentoDias = useMemo(()=>{
    const mapa = {}
    pedidos.forEach(p=>{
      const d = fmtData(p.data)
      if (!mapa[d]) mapa[d] = 0
      mapa[d] += parseFloat(p.total||0)
    })
    return Object.entries(mapa).slice(-30).map(([d,v])=>({d,v:Math.round(v)}))
  },[pedidos])

  const porCanal = useMemo(()=>{
    const mapa = {}
    pedidos.forEach(p=>{
      const c = getCanal(p)
      if (!mapa[c]) mapa[c] = {n:0,v:0}
      mapa[c].n++
      mapa[c].v += parseFloat(p.total||0)
    })
    return Object.entries(mapa).map(([k,v])=>({
      name: CANAL_CFG[k]?.label||k,
      value: v.n, valor: Math.round(v.v),
      cor: CANAL_CFG[k]?.cor||'#888',
    }))
  },[pedidos])

  const horaCalor = useMemo(()=>{
    const grid = Array(7).fill(null).map(()=>Array(24).fill(0))
    pedidos.forEach(p=>{
      const dt = new Date(p.data||0)
      const dia = dt.getDay()
      const hr  = dt.getHours()
      grid[dia][hr]++
    })
    return grid
  },[pedidos])

  const maxCalor = Math.max(...horaCalor.flat(), 1)
  const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

  const TOOLTIP_STYLE = {
    background:'var(--bg-2)',border:'1px solid var(--sep)',
    borderRadius:8,fontSize:12,color:'var(--label)',
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Faturamento */}
      <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 20px'}}>
        <div style={{fontSize:13,fontWeight:600,color:'var(--label)',marginBottom:16}}>
          📈 Faturamento — últimos 30 dias
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={faturamentoDias}>
            <defs>
              <linearGradient id="gFat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c6af7" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#7c6af7" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--sep)" vertical={false}/>
            <XAxis dataKey="d" tick={{fontSize:9,fill:'var(--label-4)'}} tickLine={false} axisLine={false}/>
            <YAxis tick={{fontSize:9,fill:'var(--label-4)'}} tickLine={false} axisLine={false}
              tickFormatter={v=>v>=1000?`R$${(v/1000).toFixed(0)}k`:`R$${v}`}/>
            <Tooltip contentStyle={TOOLTIP_STYLE}
              formatter={v=>[fmtMoeda(v),'Faturamento']}/>
            <Area type="monotone" dataKey="v" stroke="#7c6af7" strokeWidth={2}
              fill="url(#gFat)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        {/* Por canal */}
        <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 20px'}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--label)',marginBottom:16}}>
            🛍️ Pedidos por canal
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={porCanal} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                dataKey="value" nameKey="name" paddingAngle={3}>
                {porCanal.map((e,i)=><Cell key={i} fill={e.cor}/>)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE}
                formatter={(v,n,p)=>[`${v} pedidos · ${fmtMoeda(p.payload.valor)}`,n]}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
            {porCanal.map(c=>(
              <div key={c.name} style={{display:'flex',alignItems:'center',gap:8,fontSize:11}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:c.cor,flexShrink:0}}/>
                <span style={{flex:1,color:'var(--label-3)'}}>{c.name}</span>
                <span style={{color:'var(--label)',fontWeight:600}}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mapa de calor */}
        <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 20px'}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--label)',marginBottom:12}}>
            🌡️ Horários de pico
          </div>
          <div style={{overflowX:'auto'}}>
            <div style={{display:'grid',gridTemplateColumns:'28px repeat(24,1fr)',gap:2,minWidth:420}}>
              <div/>
              {Array(24).fill(0).map((_,h)=>(
                <div key={h} style={{fontSize:7,color:'var(--label-4)',textAlign:'center'}}>{h}</div>
              ))}
              {horaCalor.map((row,d)=>(
                <>
                  <div key={`d${d}`} style={{fontSize:9,color:'var(--label-4)',display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:4}}>
                    {DIAS_SEMANA[d]}
                  </div>
                  {row.map((v,h)=>(
                    <div key={h} title={`${DIAS_SEMANA[d]} ${h}h: ${v} pedidos`} style={{
                      aspectRatio:'1',borderRadius:3,
                      background:v===0?'var(--fill)':`rgba(124,106,247,${0.15+0.85*(v/maxCalor)})`,
                      cursor:'default',
                    }}/>
                  ))}
                </>
              ))}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,marginTop:10,justifyContent:'flex-end'}}>
            <span style={{fontSize:9,color:'var(--label-4)'}}>Menos</span>
            {[0.15,0.35,0.55,0.75,1].map(o=>(
              <div key={o} style={{width:10,height:10,borderRadius:2,background:`rgba(124,106,247,${o})`}}/>
            ))}
            <span style={{fontSize:9,color:'var(--label-4)'}}>Mais</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── KANBAN VIEW ─────────────────────────────────────────────────────────────
function KanbanView({filtrados, onSelect}) {
  const cols = useMemo(()=>{
    const c = {}
    Object.entries(SIT).forEach(([id,s])=>{
      c[id] = {sit:s, items:[], total:0}
    })
    filtrados.forEach(p=>{
      const sid = String(getSitId(p))
      if (c[sid]) {
        c[sid].items.push(p)
        c[sid].total += parseFloat(p.total||0)
      }
    })
    return c
  },[filtrados])

  return (
    <div style={{display:'grid',gridTemplateColumns:`repeat(${Object.keys(cols).length},1fr)`,gap:12,alignItems:'start'}}>
      {Object.entries(cols).map(([sid,col])=>(
        <div key={sid} style={{display:'flex',flexDirection:'column',gap:8}}>
          {/* Header coluna */}
          <div style={{
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'8px 12px',borderRadius:10,
            background:col.sit.bg, border:`1px solid ${col.sit.bdr}`,
          }}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:col.sit.cor}}>{col.sit.label}</div>
              <div style={{fontSize:10,color:col.sit.cor+'aa'}}>{fmtMoeda(col.total)}</div>
            </div>
            <span style={{fontSize:18,fontWeight:800,color:col.sit.cor}}>{col.items.length}</span>
          </div>
          {/* Cards */}
          {col.items.slice(0,20).map(p=>{
            const canal = getCanal(p)
            const cc    = CANAL_CFG[canal] || CANAL_CFG.bling
            return (
              <div key={p.numero} onClick={()=>onSelect(p)} style={{
                background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:10,
                padding:'10px 12px',cursor:'pointer',transition:'border-color .15s',
              }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=col.sit.cor}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--sep)'}
              >
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                  <span style={{fontSize:12,fontWeight:600,color:'var(--label)'}}># {p.numero}</span>
                  <span style={{fontSize:10,color:cc.cor}}>{cc.icon}</span>
                </div>
                <div style={{fontSize:11,color:'var(--label-3)',marginBottom:4,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {p.contato||'—'}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:11,fontWeight:700,color:'var(--label)'}}>{fmtMoeda(p.total)}</span>
                  <span style={{fontSize:10,color:'var(--label-4)'}}>{fmtData(p.data)}</span>
                </div>
              </div>
            )
          })}
          {col.items.length > 20 && (
            <div style={{textAlign:'center',fontSize:11,color:'var(--label-4)',padding:'4px'}}>
              +{col.items.length-20} mais
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── ORDER SHEET (MODAL) ──────────────────────────────────────────────────────
function OrderSheet({pedRow, onClose, api, allPedidos}) {
  const [det,       setDet]    = useState(null)
  const [load,      setLoad]   = useState(true)
  const [tab,       setTab]    = useState('geral')
  const [trackEvs,  setTEvs]   = useState([])
  const [trackSt,   setTSt]    = useState(null)
  const [tLoad,     setTLoad]  = useState(false)
  const [sending,   setSend]   = useState(false)
  const [sent,      setSent]   = useState(false)
  const [msgTxt,    setMsgTxt] = useState('')
  const [sending2,  setSend2]  = useState(false)
  const [ocors,     setOcors]  = useState([])
  const [novaOc,    setNovaOc] = useState('')
  const [savingOc,  setSavOc]  = useState(false)
  const [cpOk,      setCpOk]   = useState('')

  const canal    = getCanal(pedRow)
  const sitId    = getSitId(pedRow)
  const sit      = SIT[sitId] || {label:'—',cor:'#888',bg:'var(--fill)',bdr:'var(--sep)'}
  const histCliente = allPedidos.filter(p=> p.contato===pedRow.contato && p.numero!==pedRow.numero)
  const rfm      = calcRFM([pedRow,...histCliente])
  const rfmCfg   = RFM_BADGE[rfm] || RFM_BADGE.novo
  const totalCliente = [pedRow,...histCliente].reduce((s,p)=>s+parseFloat(p.total||0),0)

  const cp = (val,key)=>{
    navigator.clipboard?.writeText(String(val||''))
    setCpOk(key); setTimeout(()=>setCpOk(''),1500)
  }

  // Carrega detalhes
  useEffect(()=>{
    setLoad(true)
    fetch(`${api}/api/dashboard/pedido-completo/${pedRow.numero}`)
      .then(r=>r.ok?r.json():null).then(d=>{ setDet(d); setLoad(false) }).catch(()=>setLoad(false))
    // Carrega ocorrências
    fetch(`${api}/api/dashboard/ocorrencias?telefone=${encodeURIComponent(pedRow.telefone||'')}`)
      .then(r=>r.ok?r.json():null).then(d=>setOcors(d?.ocorrencias||[])).catch(()=>{})
  },[pedRow.numero, api])

  // Carrega rastreio
  const carregarRastreio = useCallback(()=>{
    const cod = det?.transporte?.volumes?.[0]?.codigoRastreamento || det?.codigoRastreio || ''
    if (!cod) return
    setTLoad(true)
    fetch(`${api}/api/dashboard/rastreio/${cod}`)
      .then(r=>r.ok?r.json():null).then(d=>{
        if (d) { setTEvs(d.eventos||d.objetos?.[0]?.eventos||[]); setTSt(d.status||null) }
        setTLoad(false)
      }).catch(()=>setTLoad(false))
  },[det, api])

  useEffect(()=>{ if(tab==='rastreio') carregarRastreio() },[tab])

  const cod = det?.transporte?.volumes?.[0]?.codigoRastreamento || det?.codigoRasteio || ''
  const nfe = det?.notaFiscal
  const linkNF = det?.notaFiscal?.linkDanfe || det?.notaFiscal?.linkPDF || ''

  // Enviar NF para cliente
  const enviarNF = async()=>{
    if (!linkNF || !pedRow.telefone) return
    setSend(true)
    const msg = `📄 *Nota Fiscal — Pedido #${pedRow.numero}*\n\n🔗 Segue o link da sua NF-e:\n${linkNF}\n\n_Você pode baixar o PDF pelo link acima._ 😊`
    await fetch(`${api}/api/dashboard/manual/${pedRow.telefone.replace(/\D/g,'')}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({mensagem:msg})
    }).catch(()=>{})
    setSend(false); setSent(true); setTimeout(()=>setSent(false),2000)
  }

  // Enviar mensagem manual
  const enviarMensagem = async()=>{
    if (!msgTxt.trim() || !pedRow.telefone) return
    setSend2(true)
    await fetch(`${api}/api/dashboard/manual/${pedRow.telefone.replace(/\D/g,'')}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({mensagem:msgTxt})
    }).catch(()=>{})
    setSend2(false); setMsgTxt('')
  }

  // Nova ocorrência
  const criarOcorrencia = async()=>{
    if (!novaOc.trim()) return
    setSavOc(true)
    await fetch(`${api}/api/dashboard/ocorrencias`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({telefone:pedRow.telefone,tipo:'suporte',descricao:novaOc,numeroPedido:pedRow.numero})
    }).catch(()=>{})
    setNovaOc(''); setSavOc(false)
    fetch(`${api}/api/dashboard/ocorrencias?telefone=${encodeURIComponent(pedRow.telefone||'')}`)
      .then(r=>r.ok?r.json():null).then(d=>setOcors(d?.ocorrencias||[])).catch(()=>{})
  }

  const TABS = [
    {id:'geral',     label:'Visão Geral', icon:Info},
    {id:'itens',     label:'Itens',       icon:Box},
    {id:'rastreio',  label:'Rastreio',    icon:Navigation},
    {id:'nfe',       label:'Nota Fiscal', icon:FileText},
    {id:'historico', label:'Histórico',   icon:Layers},
    {id:'ocorrencias',label:'Ocorrências',icon:AlertCircle},
  ]

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:1000,display:'flex',
      background:'rgba(0,0,0,.6)',backdropFilter:'blur(4px)',
    }} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{
        marginLeft:'auto',width:720,maxWidth:'100%',height:'100%',
        background:'var(--bg)',borderLeft:'1px solid var(--sep)',
        display:'flex',flexDirection:'column',overflow:'hidden',
      }}>
        {/* ── Header ── */}
        <div style={{padding:'16px 20px',borderBottom:'1px solid var(--sep)',flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <button onClick={onClose} style={{
                background:'none',border:'none',cursor:'pointer',
                color:'var(--label-4)',padding:4,display:'flex',
              }}><X size={18}/></button>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:18,fontWeight:700,color:'var(--label)'}}>Pedido #{pedRow.numero}</span>
                  <Pill label={sit.label} cor={sit.cor} bg={sit.bg} bdr={sit.bdr}/>
                  <CanalBadge canal={canal}/>
                </div>
                <div style={{fontSize:12,color:'var(--label-4)',marginTop:2}}>
                  {fmtDataHora(pedRow.data)} · {pedRow.contato||'—'}
                </div>
              </div>
            </div>
            {/* RFM badge */}
            <div style={{
              display:'flex',alignItems:'center',gap:5,padding:'4px 10px',
              borderRadius:99,background:rfmCfg.bg,border:`1px solid ${rfmCfg.cor}30`,
              fontSize:11,fontWeight:700,color:rfmCfg.cor,flexShrink:0,
            }}>
              <span>{rfmCfg.icon}</span> {rfmCfg.label}
              <span style={{fontSize:10,color:rfmCfg.cor+'aa',marginLeft:4}}>
                · {[pedRow,...histCliente].length} pedidos · {fmtMoeda(totalCliente)}
              </span>
            </div>
          </div>

          {/* Ações rápidas */}
          <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
            {linkNF && (
              <button onClick={enviarNF} disabled={sending||sent} style={{
                display:'flex',alignItems:'center',gap:5,padding:'5px 11px',
                borderRadius:8,border:'1px solid rgba(34,197,94,.4)',
                background:sent?'rgba(34,197,94,.1)':'rgba(34,197,94,.08)',
                color:'#22c55e',cursor:'pointer',fontSize:11,fontWeight:600,
              }}>
                <Send size={11}/> {sent?'Enviada!':'Enviar NF ao cliente'}
              </button>
            )}
            {cod && (
              <button onClick={()=>cp(cod,'rastreio')} style={{
                display:'flex',alignItems:'center',gap:5,padding:'5px 11px',
                borderRadius:8,border:'1px solid var(--sep)',
                background:'var(--fill)',color:'var(--label-3)',cursor:'pointer',fontSize:11,
              }}>
                {cpOk==='rastreio'?<Check size={11} style={{color:'#22c55e'}}/>:<Copy size={11}/>}
                Copiar rastreio
              </button>
            )}
            {pedRow.telefone && (
              <button onClick={()=>window.open(`https://wa.me/${pedRow.telefone.replace(/\D/g,'')}`,`_blank`)} style={{
                display:'flex',alignItems:'center',gap:5,padding:'5px 11px',
                borderRadius:8,border:'1px solid rgba(37,211,102,.4)',
                background:'rgba(37,211,102,.08)',color:'#25d366',cursor:'pointer',fontSize:11,
              }}>
                <MessageSquare size={11}/> WhatsApp
              </button>
            )}
            {linkNF && (
              <a href={linkNF} target="_blank" rel="noreferrer" style={{
                display:'flex',alignItems:'center',gap:5,padding:'5px 11px',
                borderRadius:8,border:'1px solid var(--sep)',
                background:'var(--fill)',color:'var(--label-3)',cursor:'pointer',fontSize:11,
                textDecoration:'none',
              }}>
                <ExternalLink size={11}/> Abrir NF-e
              </a>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{display:'flex',borderBottom:'1px solid var(--sep)',flexShrink:0,overflowX:'auto'}}>
          {TABS.map(t=>{
            const Icon=t.icon; const active=tab===t.id
            return (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                display:'flex',alignItems:'center',gap:5,padding:'10px 14px',
                border:'none',background:'none',cursor:'pointer',
                fontSize:11.5,fontWeight:active?700:500,
                color:active?'var(--accent)':'var(--label-4)',
                borderBottom:active?'2px solid var(--accent)':'2px solid transparent',
                whiteSpace:'nowrap',
              }}>
                <Icon size={12}/>{t.label}
                {t.id==='ocorrencias' && ocors.length > 0 &&
                  <span style={{
                    fontSize:9,padding:'1px 5px',borderRadius:99,
                    background:'rgba(239,68,68,.15)',color:'#ef4444',fontWeight:700,
                  }}>{ocors.filter(o=>o.status!=='resolvido').length||''}</span>
                }
              </button>
            )
          })}
        </div>

        {/* ── Conteúdo ── */}
        <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
          {load ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,
              color:'var(--label-4)',gap:10,fontSize:13}}>
              <RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/> Carregando...
            </div>
          ) : <>
            {/* ── GERAL ── */}
            {tab==='geral' && (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {/* Grid dados */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  {/* Cliente */}
                  <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 14px'}}>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>
                      Cliente
                    </div>
                    {[
                      ['Nome', det?.contato?.nome || pedRow.contato],
                      ['Telefone', det?.contato?.telefone || det?.contato?.celular || pedRow.telefone],
                      ['Documento', det?.contato?.numeroDocumento],
                      ['Email', det?.contato?.email],
                    ].filter(([,v])=>v).map(([k,v])=>(
                      <div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:12}}>
                        <span style={{color:'var(--label-4)'}}>{k}</span>
                        <span style={{color:'var(--label)',fontWeight:500,textAlign:'right',maxWidth:220,
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {/* Endereço */}
                  <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 14px'}}>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>
                      Endereço de entrega
                    </div>
                    {(()=>{
                      const e = det?.transporte?.etiqueta || det?.enderecoEntrega
                      if (!e) return <p style={{fontSize:12,color:'var(--label-4)',margin:0}}>Não informado</p>
                      return (
                        <div style={{fontSize:12,color:'var(--label)',lineHeight:1.7}}>
                          <div>{e.endereco}{e.numero?`, ${e.numero}`:''}{e.complemento?` · ${e.complemento}`:''}</div>
                          <div>{e.bairro && `${e.bairro} · `}{e.municipio}/{e.uf}</div>
                          <div style={{color:'var(--label-4)'}}>CEP: {e.cep}</div>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Financeiro */}
                <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 14px'}}>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>
                    Resumo financeiro
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                    {[
                      ['Produtos', fmtMoeda(det?.totalProdutos||det?.totalVenda)],
                      ['Frete',    fmtMoeda(det?.transporte?.frete)],
                      ['Desconto', fmtMoeda(det?.desconto)],
                      ['Total',    fmtMoeda(det?.total||pedRow.total)],
                    ].map(([k,v])=>(
                      <div key={k} style={{textAlign:'center'}}>
                        <div style={{fontSize:10,color:'var(--label-4)',marginBottom:3}}>{k}</div>
                        <div style={{fontSize:14,fontWeight:700,color:k==='Total'?'var(--accent)':'var(--label)'}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {det?.parcelas?.[0] && (
                    <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid var(--sep)',fontSize:12,color:'var(--label-4)'}}>
                      💳 {det.parcelas[0].formaPagamento?.descricao || 'Forma de pagamento'} 
                      {det.parcelas[0].observacoes && ` · ${det.parcelas[0].observacoes.slice(0,50)}`}
                    </div>
                  )}
                </div>

                {/* Enviar mensagem manual */}
                <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 14px'}}>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>
                    Enviar mensagem ao cliente
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <input value={msgTxt} onChange={e=>setMsgTxt(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&enviarMensagem()}
                      placeholder="Digite a mensagem..." style={{
                        flex:1,padding:'8px 12px',borderRadius:8,
                        border:'1px solid var(--sep)',background:'var(--fill)',
                        color:'var(--label)',fontSize:12,
                      }}/>
                    <button onClick={enviarMensagem} disabled={sending2||!msgTxt.trim()} style={{
                      padding:'8px 14px',borderRadius:8,border:'none',
                      background:sending2?'var(--fill)':'var(--accent)',
                      color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,
                      display:'flex',alignItems:'center',gap:5,
                    }}>
                      <Send size={12}/>{sending2?'...':'Enviar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── ITENS ── */}
            {tab==='itens' && (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {(det?.itens||[]).length === 0
                  ? <p style={{color:'var(--label-4)',fontSize:13}}>Sem itens disponíveis.</p>
                  : (det?.itens||[]).map((item,i)=>(
                    <div key={i} style={{
                      display:'flex',alignItems:'center',gap:12,
                      background:'var(--bg-2)',border:'1px solid var(--sep)',
                      borderRadius:10,padding:'10px 12px',
                    }}>
                      <div style={{width:40,height:40,borderRadius:8,background:'var(--fill)',
                        display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <Box size={16} style={{color:'var(--label-4)'}}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12.5,fontWeight:600,color:'var(--label)',
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {item.descricao || item.nome || '—'}
                        </div>
                        <div style={{fontSize:11,color:'var(--label-4)',marginTop:2}}>
                          SKU: {item.codigo||'—'} · Unidade: {item.unidade||'UN'}
                        </div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontSize:12,color:'var(--label-4)'}}>
                          {item.quantidade}× {fmtMoeda(item.valor)}
                        </div>
                        <div style={{fontSize:13,fontWeight:700,color:'var(--label)'}}>
                          {fmtMoeda(item.valorTotal||(item.valor*item.quantidade))}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* ── RASTREIO ── */}
            {tab==='rastreio' && (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {/* Info transportadora */}
                <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 14px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em'}}>
                      Informações de envio
                    </div>
                    <button onClick={carregarRastreio} style={{
                      display:'flex',alignItems:'center',gap:4,padding:'3px 8px',
                      borderRadius:6,border:'1px solid var(--sep)',background:'var(--fill)',
                      color:'var(--label-3)',cursor:'pointer',fontSize:11,
                    }}>
                      <RefreshCw size={10} style={tLoad?{animation:'spin 1s linear infinite'}:{}}/> Atualizar
                    </button>
                  </div>
                  {[
                    ['Transportadora', det?.transporte?.contato?.nome || det?.transporte?.transportadora?.nome],
                    ['Serviço', det?.transporte?.volumes?.[0]?.servico],
                    ['Código', cod],
                    ['Data envio', fmtData(det?.dataSaida || det?.dataColeta)],
                    ['Previsão', fmtData(det?.dataPrevista)],
                  ].filter(([,v])=>v).map(([k,v])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:12}}>
                      <span style={{color:'var(--label-4)'}}>{k}</span>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        {k==='Código' && <CopyBtn val={v} label="Copiar"/>}
                        <span style={{color:'var(--label)',fontWeight:500}}>{v}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timeline de rastreio */}
                {tLoad ? (
                  <div style={{textAlign:'center',padding:32,color:'var(--label-4)',fontSize:13}}>
                    <RefreshCw size={16} style={{animation:'spin 1s linear infinite',marginBottom:8}}/><br/>
                    Consultando transportadora...
                  </div>
                ) : trackEvs.length > 0 ? (
                  <div style={{position:'relative'}}>
                    <div style={{position:'absolute',left:16,top:20,bottom:20,width:2,background:'var(--sep)'}}/>
                    {trackEvs.map((ev,i)=>(
                      <div key={i} style={{display:'flex',gap:14,marginBottom:14,position:'relative'}}>
                        <div style={{
                          width:32,height:32,borderRadius:'50%',flexShrink:0,
                          background:i===0?'var(--accent)':'var(--fill)',
                          border:`2px solid ${i===0?'var(--accent)':'var(--sep)'}`,
                          display:'flex',alignItems:'center',justifyContent:'center',
                          zIndex:1,
                        }}>
                          <Circle size={8} style={{color:i===0?'#fff':'var(--label-4)'}} fill={i===0?'#fff':'var(--label-4)'}/>
                        </div>
                        <div style={{flex:1,paddingTop:6,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:i===0?600:400,color:i===0?'var(--label)':'var(--label-3)'}}>
                            {ev.descricao||ev.evento||ev.status||'—'}
                          </div>
                          <div style={{fontSize:10.5,color:'var(--label-4)',marginTop:2}}>
                            {ev.data||ev.dtHrCriado||''} {ev.hora||''} · {ev.local||ev.unidade||ev.origem||''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !cod ? (
                  <p style={{color:'var(--label-4)',fontSize:13,textAlign:'center',padding:32}}>
                    Código de rastreio não disponível para este pedido.
                  </p>
                ) : (
                  <p style={{color:'var(--label-4)',fontSize:13,textAlign:'center',padding:32}}>
                    Nenhum evento de rastreio encontrado. Clique em Atualizar para tentar novamente.
                  </p>
                )}
              </div>
            )}

            {/* ── NOTA FISCAL ── */}
            {tab==='nfe' && (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {nfe ? (
                  <>
                    <div style={{background:'var(--bg-2)',border:`1px solid ${linkNF?'rgba(34,197,94,.3)':'var(--sep)'}`,borderRadius:12,padding:'16px 18px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                        <div style={{width:36,height:36,borderRadius:10,
                          background:linkNF?'rgba(34,197,94,.12)':'var(--fill)',
                          display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <FileText size={16} style={{color:linkNF?'#22c55e':'var(--label-4)'}}/>
                        </div>
                        <div>
                          <div style={{fontSize:14,fontWeight:700,color:'var(--label)'}}>
                            NF-e #{nfe.numero||nfe.id}
                          </div>
                          <div style={{fontSize:11,color:'var(--label-4)'}}>
                            {linkNF?'✅ Autorizada pela SEFAZ':'⏳ Em processamento'}
                          </div>
                        </div>
                      </div>
                      {[
                        ['Número', nfe.numero||nfe.id],
                        ['Data emissão', nfe.dataEmissao?fmtData(nfe.dataEmissao):'—'],
                        ['Chave', nfe.chaveAcesso],
                        ['Protocolo', nfe.numeroProtocolo],
                      ].filter(([,v])=>v).map(([k,v])=>(
                        <div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:12}}>
                          <span style={{color:'var(--label-4)'}}>{k}</span>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            {k==='Chave' && <CopyBtn val={v} label="Copiar"/>}
                            <span style={{color:'var(--label)',fontWeight:500,
                              overflow:'hidden',textOverflow:'ellipsis',maxWidth:280,
                              textAlign:'right',fontFamily:k==='Chave'?'monospace':undefined,
                              fontSize:k==='Chave'?10:12,
                            }}>{v}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{display:'flex',gap:10}}>
                      {linkNF && (
                        <>
                          <a href={linkNF} target="_blank" rel="noreferrer" style={{
                            display:'flex',alignItems:'center',gap:6,padding:'9px 16px',
                            borderRadius:9,border:'1px solid rgba(34,197,94,.4)',
                            background:'rgba(34,197,94,.08)',color:'#22c55e',
                            cursor:'pointer',fontSize:12,fontWeight:600,textDecoration:'none',
                          }}>
                            <ExternalLink size={13}/> Abrir PDF
                          </a>
                          <button onClick={enviarNF} disabled={sending||sent} style={{
                            display:'flex',alignItems:'center',gap:6,padding:'9px 16px',
                            borderRadius:9,border:'1px solid rgba(37,211,102,.4)',
                            background:sent?'rgba(37,211,102,.15)':'rgba(37,211,102,.08)',
                            color:'#25d366',cursor:'pointer',fontSize:12,fontWeight:600,
                          }}>
                            <Send size={13}/> {sent?'✅ Enviada!':'Enviar ao cliente (WA)'}
                          </button>
                          <CopyBtn val={linkNF} label="Copiar link"/>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{textAlign:'center',padding:40,color:'var(--label-4)'}}>
                    <FileText size={32} style={{opacity:.2,marginBottom:12}}/>
                    <p style={{fontSize:13,margin:'0 0 6px'}}>Nota fiscal não emitida para este pedido.</p>
                    <p style={{fontSize:11,margin:0}}>
                      Use a função de emissão automática pelo WhatsApp ou emita manualmente no Bling.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── HISTÓRICO ── */}
            {tab==='historico' && (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {/* Resumo LTV */}
                <div style={{
                  display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,
                  background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 14px',
                }}>
                  {[
                    ['Total pedidos',  `${[pedRow,...histCliente].length}`],
                    ['LTV total',       fmtMoeda(totalCliente)],
                    ['Ticket médio',    fmtMoeda(totalCliente/Math.max([pedRow,...histCliente].length,1))],
                  ].map(([k,v])=>(
                    <div key={k} style={{textAlign:'center'}}>
                      <div style={{fontSize:10,color:'var(--label-4)',marginBottom:3}}>{k}</div>
                      <div style={{fontSize:16,fontWeight:700,color:'var(--label)'}}>{v}</div>
                    </div>
                  ))}
                </div>
                {/* Gráfico LTV mensal */}
                {[pedRow,...histCliente].length > 1 && (()=>{
                  const mapa = {}
                  ;[pedRow,...histCliente].forEach(p=>{
                    const m = p.data ? new Date(p.data).toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}) : '—'
                    mapa[m] = (mapa[m]||0) + parseFloat(p.total||0)
                  })
                  const dados = Object.entries(mapa).map(([m,v])=>({m, v:Math.round(v)}))
                  return (
                    <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 14px'}}>
                      <div style={{fontSize:11,fontWeight:600,color:'var(--label-4)',marginBottom:10}}>
                        Compras por período
                      </div>
                      <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={dados}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--sep)" vertical={false}/>
                          <XAxis dataKey="m" tick={{fontSize:9,fill:'var(--label-4)'}} tickLine={false} axisLine={false}/>
                          <YAxis tick={{fontSize:9,fill:'var(--label-4)'}} tickLine={false} axisLine={false}
                            tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
                          <Tooltip contentStyle={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:8,fontSize:11}}
                            formatter={v=>[fmtMoeda(v)]}/>
                          <Bar dataKey="v" fill="var(--accent)" radius={[4,4,0,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                })()}
                {/* Lista pedidos */}
                {histCliente.length === 0
                  ? <p style={{color:'var(--label-4)',fontSize:12,textAlign:'center',padding:20}}>
                      Este é o primeiro pedido do cliente.
                    </p>
                  : histCliente.map(p=>{
                    const sid = getSitId(p); const s = SIT[sid]||{label:'—',cor:'#888'}
                    return (
                      <div key={p.numero} style={{
                        background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:10,
                        padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',
                      }}>
                        <div>
                          <div style={{fontSize:12.5,fontWeight:600,color:'var(--label)'}}># {p.numero}</div>
                          <div style={{fontSize:11,color:'var(--label-4)'}}>{fmtData(p.data)}</div>
                        </div>
                        <div style={{textAlign:'right',display:'flex',alignItems:'center',gap:10}}>
                          <Pill label={s.label} cor={s.cor} bg={s.bg} size={10}/>
                          <span style={{fontSize:13,fontWeight:700,color:'var(--label)'}}>{fmtMoeda(p.total)}</span>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            )}

            {/* ── OCORRÊNCIAS ── */}
            {tab==='ocorrencias' && (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {/* Nova ocorrência */}
                <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'12px 14px'}}>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--label)',marginBottom:8}}>
                    Abrir nova ocorrência
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <input value={novaOc} onChange={e=>setNovaOc(e.target.value)}
                      placeholder="Descreva o problema..." style={{
                        flex:1,padding:'7px 10px',borderRadius:8,
                        border:'1px solid var(--sep)',background:'var(--fill)',
                        color:'var(--label)',fontSize:12,
                      }}/>
                    <button onClick={criarOcorrencia} disabled={savingOc||!novaOc.trim()} style={{
                      padding:'7px 14px',borderRadius:8,border:'none',
                      background:'var(--accent)',color:'#fff',cursor:'pointer',fontSize:12,
                    }}>
                      {savingOc?'...':'Abrir'}
                    </button>
                  </div>
                </div>
                {/* Lista */}
                {ocors.length===0
                  ? <p style={{color:'var(--label-4)',fontSize:12,textAlign:'center',padding:24}}>
                      Nenhuma ocorrência registrada para este cliente.
                    </p>
                  : ocors.map((oc,i)=>(
                    <div key={i} style={{
                      background:'var(--bg-2)',border:`1px solid ${oc.status==='resolvido'?'rgba(34,197,94,.2)':'var(--sep)'}`,
                      borderRadius:10,padding:'10px 14px',
                    }}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                        <span style={{fontSize:11,fontWeight:600,color:'var(--label)'}}>{oc.tipo||'Suporte'}</span>
                        <span style={{fontSize:10,color:'var(--label-4)'}}>{fmtDataHora(oc.criado_em)}</span>
                      </div>
                      <p style={{fontSize:12,color:'var(--label-3)',margin:0,lineHeight:1.5}}>{oc.descricao}</p>
                      {oc.ticketId && (
                        <div style={{fontSize:10,color:'var(--label-4)',marginTop:5}}>
                          Protocolo: #{oc.ticketId}
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>
            )}
          </>}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function PagePedidos({api}) {
  const [pedidos,      setPedidos]   = useState([])
  const [loading,      setLoading]   = useState(true)
  const [loadMore,     setLoadMore]  = useState(false)
  const [pgAPI,        setPgAPI]     = useState(1)
  const [temMais,      setTemMais]   = useState(true)
  const [busca,        setBusca]     = useState('')
  const [filtroSit,    setFiltroSit] = useState('0')
  const [filtroCanal,  setFiltroC]   = useState('todos')
  const [filtroValMin, setValMin]    = useState('')
  const [filtroValMax, setValMax]    = useState('')
  const [dateRange,    setDate]      = useState({from:'',to:''})
  const [sortCol,      setSortCol]   = useState('numero')
  const [sortDir,      setSortDir]   = useState('desc')
  const [pgUI,         setPgUI]      = useState(1)
  const [sel,          setSel]       = useState(null)
  const [view,         setView]      = useState('lista')
  const [showF,        setShowF]     = useState(false)
  const [liveCount,    setLive]      = useState(0)
  const buscaRef = useRef(null)
  const POR_PAG  = 25

  const carregar = useCallback(async(pg=1,acum=false)=>{
    if(pg===1) setLoading(true); else setLoadMore(true)
    try{
      let url=`${api}/api/dashboard/pedidos?limite=100&pagina=${pg}`
      if(filtroSit!=='0') url+=`&situacao=${filtroSit}`
      if(dateRange.from)  url+=`&dataInicio=${dateRange.from}`
      if(dateRange.to)    url+=`&dataFim=${dateRange.to}`
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

  // Live activity polling
  useEffect(()=>{
    const t = setInterval(async()=>{
      try{
        const r = await fetch(`${api}/api/dashboard/live-activity`)
        if(r.ok){const d=await r.json();setLive(d.novos_10min||0)}
      }catch{}
    },30000)
    return ()=>clearInterval(t)
  },[api])

  // Exportar CSV
  const exportarCSV = ()=>{
    const rows = [
      ['Pedido','Data','Cliente','Telefone','Canal','Status','Total','Transportadora','Rastreio'],
      ...filtrados.map(p=>[
        p.numero, fmtData(p.data), p.contato||'', p.telefone||'',
        CANAL_CFG[getCanal(p)]?.label||'', SIT[getSitId(p)]?.label||'',
        parseFloat(p.total||0).toFixed(2),
        p.transporte?.contato?.nome||'',
        p.transporte?.volumes?.[0]?.codigoRastreamento||'',
      ])
    ]
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='pedidos.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // Filtros locais
  const filtrados = useMemo(()=>
    pedidos.filter(p=>{
      const c   = getCanal(p)
      const tot = parseFloat(p.total||0)
      const sit = getSitId(p)
      const txt = busca.toLowerCase()
      return (filtroCanal==='todos'||c===filtroCanal)
        && (filtroSit==='0'||String(sit)===filtroSit)
        && (!busca || String(p.numero).includes(busca)
          || (p.contato||'').toLowerCase().includes(txt)
          || (p.telefone||'').includes(busca))
        && (!filtroValMin||tot>=parseFloat(filtroValMin))
        && (!filtroValMax||tot<=parseFloat(filtroValMax))
    }).sort((a,b)=>{
      const mult = sortDir==='desc'?-1:1
      if(sortCol==='numero') return (b.numero-a.numero)*mult
      if(sortCol==='total')  return (parseFloat(b.total||0)-parseFloat(a.total||0))*mult
      if(sortCol==='data')   return (new Date(b.data)-new Date(a.data))*mult
      return 0
    })
  ,[pedidos,filtroCanal,filtroSit,busca,filtroValMin,filtroValMax,sortCol,sortDir])

  // KPIs
  const kpis = useMemo(()=>{
    const total = filtrados.length
    const fat   = filtrados.reduce((s,p)=>s+parseFloat(p.total||0),0)
    const abertos    = filtrados.filter(p=>getSitId(p)===6).length
    const atendidos  = filtrados.filter(p=>getSitId(p)===9).length
    const cancelados = filtrados.filter(p=>getSitId(p)===12).length
    const ticket     = total>0 ? fat/total : 0
    const taxaEntrega = total>0 ? Math.round(atendidos/total*100) : 0
    // Sparkline dos últimos 14 dias de faturamento
    const spark14 = Array(14).fill(0).map((_,i)=>{
      const d = new Date(); d.setDate(d.getDate()-13+i)
      const ds = fmtData(d)
      return filtrados.filter(p=>fmtData(p.data)===ds).reduce((s,p)=>s+parseFloat(p.total||0),0)
    }).map(v=>Math.round(v/1000))
    return {total,fat,abertos,atendidos,cancelados,ticket,taxaEntrega,spark14}
  },[filtrados])

  const sort = (col)=>{
    if(sortCol===col) setSortDir(d=>d==='desc'?'asc':'desc')
    else {setSortCol(col);setSortDir('desc')}
  }
  const SortIcon = ({col})=>{
    if(sortCol!==col) return <ChevronDown size={11} style={{opacity:.3}}/>
    return sortDir==='desc' ? <ChevronDown size={11}/> : <ChevronUp size={11}/>
  }

  const paginados = filtrados.slice((pgUI-1)*POR_PAG, pgUI*POR_PAG)
  const totalPgs  = Math.ceil(filtrados.length/POR_PAG)

  return (
    <div style={{display:'flex',height:'100%',overflow:'hidden'}}>

      {/* ── Sidebar Filtros ── */}
      <div style={{
        width:showF?240:0,flexShrink:0,overflow:'hidden',
        transition:'width .2s cubic-bezier(.4,0,.2,1)',
        borderRight:'1px solid var(--sep)',background:'var(--bg-2)',
        display:'flex',flexDirection:'column',
      }}>
        <div style={{padding:'14px 16px',borderBottom:'1px solid var(--sep)',
          display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
          <span style={{fontSize:12,fontWeight:700,color:'var(--label)'}}>Filtros</span>
          <button onClick={()=>setShowF(false)} style={{
            background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:2,
          }}><X size={14}/></button>
        </div>
        <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:12,overflowY:'auto'}}>
          {/* Período */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',
              letterSpacing:'.06em',marginBottom:6}}>Período</div>
            {[
              ['hoje',  'Hoje'],
              ['7d',   'Últimos 7 dias'],
              ['30d',  'Últimos 30 dias'],
              ['90d',  'Últimos 90 dias'],
            ].map(([val,label])=>(
              <button key={val} onClick={()=>{
                const d=new Date()
                if(val==='hoje') setDate({from:d.toISOString().split('T')[0],to:''})
                else if(val==='7d'){const f=new Date(d);f.setDate(d.getDate()-7);setDate({from:f.toISOString().split('T')[0],to:''})}
                else if(val==='30d'){const f=new Date(d);f.setDate(d.getDate()-30);setDate({from:f.toISOString().split('T')[0],to:''})}
                else if(val==='90d'){const f=new Date(d);f.setDate(d.getDate()-90);setDate({from:f.toISOString().split('T')[0],to:''})}
              }} style={{
                display:'block',width:'100%',textAlign:'left',padding:'6px 8px',
                borderRadius:7,border:'none',background:'none',cursor:'pointer',
                fontSize:12,color:'var(--label-3)',marginBottom:2,
              }}
                onMouseEnter={e=>e.target.style.background='var(--fill)'}
                onMouseLeave={e=>e.target.style.background='none'}
              >{label}</button>
            ))}
            <div style={{display:'flex',gap:6,marginTop:4}}>
              <input type="date" value={dateRange.from} onChange={e=>setDate(d=>({...d,from:e.target.value}))}
                style={{flex:1,padding:'5px 7px',borderRadius:7,border:'1px solid var(--sep)',
                  background:'var(--fill)',color:'var(--label)',fontSize:11}}/>
              <input type="date" value={dateRange.to} onChange={e=>setDate(d=>({...d,to:e.target.value}))}
                style={{flex:1,padding:'5px 7px',borderRadius:7,border:'1px solid var(--sep)',
                  background:'var(--fill)',color:'var(--label)',fontSize:11}}/>
            </div>
          </div>

          {/* Canal */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',
              letterSpacing:'.06em',marginBottom:6}}>Canal</div>
            {[['todos','Todos'],...Object.entries(CANAL_CFG).map(([k,v])=>[k,v.label])].map(([val,label])=>(
              <button key={val} onClick={()=>setFiltroC(val)} style={{
                display:'flex',alignItems:'center',gap:7,width:'100%',textAlign:'left',
                padding:'5px 8px',borderRadius:7,border:'none',
                background:filtroCanal===val?'var(--fill)':'none',
                cursor:'pointer',fontSize:12,
                color:filtroCanal===val?'var(--label)':'var(--label-3)',marginBottom:2,
              }}>
                {val!=='todos'&&<span style={{fontSize:14}}>{CANAL_CFG[val]?.icon}</span>}
                {label}
              </button>
            ))}
          </div>

          {/* Valor */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',
              letterSpacing:'.06em',marginBottom:6}}>Faixa de valor</div>
            <div style={{display:'flex',gap:6}}>
              <input placeholder="Mín" value={filtroValMin} onChange={e=>setValMin(e.target.value)}
                style={{flex:1,padding:'5px 7px',borderRadius:7,border:'1px solid var(--sep)',
                  background:'var(--fill)',color:'var(--label)',fontSize:11}}/>
              <input placeholder="Máx" value={filtroValMax} onChange={e=>setValMax(e.target.value)}
                style={{flex:1,padding:'5px 7px',borderRadius:7,border:'1px solid var(--sep)',
                  background:'var(--fill)',color:'var(--label)',fontSize:11}}/>
            </div>
          </div>

          {/* Limpar */}
          {(filtroCanal!=='todos'||filtroSit!=='0'||busca||filtroValMin||filtroValMax||dateRange.from) && (
            <button onClick={()=>{setFiltroC('todos');setFiltroSit('0');setBusca('');setValMin('');setValMax('');setDate({from:'',to:''})}}
              style={{
                padding:'7px',borderRadius:8,border:'1px solid var(--sep)',
                background:'none',color:'#ef4444',cursor:'pointer',fontSize:12,
                display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              }}>
              <X size={12}/> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Área principal ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* ── Topbar ── */}
        <div style={{
          padding:'12px 16px',borderBottom:'1px solid var(--sep)',
          display:'flex',alignItems:'center',gap:10,flexShrink:0,flexWrap:'wrap',
        }}>
          <button onClick={()=>setShowF(f=>!f)} style={{
            display:'flex',alignItems:'center',gap:5,padding:'6px 11px',
            borderRadius:8,border:'1px solid var(--sep)',background:showF?'var(--fill)':'none',
            color:'var(--label-3)',cursor:'pointer',fontSize:12,
          }}>
            <Filter size={13}/> Filtros
            {(filtroCanal!=='todos'||filtroSit!=='0'||filtroValMin||filtroValMax||dateRange.from) &&
              <span style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)'}}/>
            }
          </button>

          {/* Busca */}
          <div style={{position:'relative',flex:'1 1 200px',maxWidth:320}}>
            <Search size={13} style={{
              position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',
              color:'var(--label-4)',pointerEvents:'none',
            }}/>
            <input ref={buscaRef} value={busca} onChange={e=>{setBusca(e.target.value);setPgUI(1)}}
              placeholder="Buscar por número, nome ou telefone..."
              style={{
                width:'100%',padding:'6px 10px 6px 30px',borderRadius:8,
                border:'1px solid var(--sep)',background:'var(--fill)',
                color:'var(--label)',fontSize:12,boxSizing:'border-box',
              }}/>
            {busca && <button onClick={()=>setBusca('')} style={{
              position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',
              background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:0,
            }}><X size={12}/></button>}
          </div>

          {/* Filtro status rápido */}
          <div style={{display:'flex',gap:4}}>
            {[['0','Todos'],['6','Aberto'],['9','Atendido'],['12','Cancelado'],['15','Verificado']].map(([v,l])=>(
              <button key={v} onClick={()=>{setFiltroSit(v);setPgUI(1)}} style={{
                padding:'5px 10px',borderRadius:99,border:'1px solid var(--sep)',
                background:filtroSit===v?(SIT[Number(v)]?.bg||'var(--accent-dim)'):'none',
                color:filtroSit===v?(SIT[Number(v)]?.cor||'var(--accent)'):'var(--label-4)',
                cursor:'pointer',fontSize:11,fontWeight:filtroSit===v?700:400,
              }}>{l}</button>
            ))}
          </div>

          <div style={{marginLeft:'auto',display:'flex',gap:7,alignItems:'center'}}>
            {liveCount > 0 && (
              <div style={{
                display:'flex',alignItems:'center',gap:5,padding:'4px 10px',
                borderRadius:99,background:'rgba(124,106,247,.12)',
                border:'1px solid rgba(124,106,247,.3)',fontSize:11,color:'#7c6af7',
              }}>
                <span style={{width:6,height:6,borderRadius:'50%',background:'#7c6af7',
                  animation:'pulse 1.5s ease infinite'}}/>
                {liveCount} novos agora
              </div>
            )}
            {/* Views */}
            {[
              {id:'lista',     icon:Layers,   title:'Lista'},
              {id:'kanban',    icon:BarChart3, title:'Kanban'},
              {id:'analytics', icon:Activity,  title:'Analytics'},
            ].map(v=>(
              <button key={v.id} onClick={()=>setView(v.id)} title={v.title} style={{
                display:'flex',alignItems:'center',justifyContent:'center',
                width:32,height:32,borderRadius:8,
                border:'1px solid var(--sep)',
                background:view===v.id?'var(--fill)':'none',
                color:view===v.id?'var(--accent)':'var(--label-4)',cursor:'pointer',
              }}><v.icon size={15}/></button>
            ))}
            <button onClick={exportarCSV} title="Exportar CSV" style={{
              display:'flex',alignItems:'center',gap:5,padding:'6px 11px',
              borderRadius:8,border:'1px solid var(--sep)',background:'none',
              color:'var(--label-3)',cursor:'pointer',fontSize:12,
            }}>
              <Download size={13}/> CSV
            </button>
            <button onClick={()=>carregar(1,false)} title="Recarregar" style={{
              display:'flex',alignItems:'center',justifyContent:'center',
              width:32,height:32,borderRadius:8,border:'1px solid var(--sep)',
              background:'none',color:'var(--label-4)',cursor:'pointer',
            }}>
              <RefreshCw size={14} style={loading?{animation:'spin 1s linear infinite'}:{}}/>
            </button>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div style={{
          display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',
          gap:10,padding:'12px 16px',borderBottom:'1px solid var(--sep)',flexShrink:0,
        }}>
          <KCard icon={DollarSign}    label="Faturamento"    value={fmtMoeda(kpis.fat)}      cor="#7c6af7" spark={kpis.spark14}/>
          <KCard icon={ShoppingCart}  label="Total pedidos"  value={kpis.total}               cor="#06b6d4"/>
          <KCard icon={Clock}         label="Em aberto"      value={kpis.abertos}             cor="#f59e0b" alert={kpis.abertos>20}/>
          <KCard icon={CheckCircle}   label="Atendidos"      value={kpis.atendidos}           cor="#22c55e" sub={`${kpis.taxaEntrega}% do total`}/>
          <KCard icon={TrendingUp}    label="Ticket médio"   value={fmtMoeda(kpis.ticket)}    cor="#a78bfa"/>
          <KCard icon={AlertCircle}   label="Cancelados"     value={kpis.cancelados}          cor="#ef4444"/>
        </div>

        {/* ── Alertas ── */}
        <div style={{padding:'0 16px',flexShrink:0}}>
          <AlertBar pedidos={pedidos} onFilter={()=>{}}/>
        </div>

        {/* ── Conteúdo views ── */}
        <div style={{flex:1,overflowY:'auto',padding:'12px 16px'}}>
          {loading ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',
              height:300,color:'var(--label-4)',gap:12,fontSize:14}}>
              <RefreshCw size={20} style={{animation:'spin 1s linear infinite'}}/> Carregando pedidos...
            </div>
          ) : view==='analytics' ? (
            <AnalyticsView pedidos={filtrados}/>
          ) : view==='kanban' ? (
            <KanbanView filtrados={filtrados} onSelect={setSel}/>
          ) : (
            <>
              {/* Header tabela */}
              <div style={{
                display:'grid',
                gridTemplateColumns:'90px 90px 1fr 110px 90px 100px 80px 56px',
                gap:0,padding:'6px 10px',marginBottom:4,
              }}>
                {[
                  {label:'Pedido',  col:'numero'},
                  {label:'Data',    col:'data'},
                  {label:'Cliente', col:'contato'},
                  {label:'Canal',   col:null},
                  {label:'Status',  col:null},
                  {label:'Total',   col:'total'},
                  {label:'Rastreio',col:null},
                  {label:'',        col:null},
                ].map((h,i)=>(
                  <div key={i} onClick={h.col?()=>sort(h.col):undefined} style={{
                    display:'flex',alignItems:'center',gap:3,
                    fontSize:10,fontWeight:700,color:'var(--label-4)',
                    textTransform:'uppercase',letterSpacing:'.05em',
                    cursor:h.col?'pointer':'default',userSelect:'none',
                    padding:'0 6px',
                  }}>
                    {h.label}
                    {h.col && <SortIcon col={h.col}/>}
                  </div>
                ))}
              </div>

              {/* Linhas */}
              {paginados.length===0 ? (
                <div style={{textAlign:'center',padding:60,color:'var(--label-4)',fontSize:14}}>
                  <Package size={36} style={{opacity:.15,marginBottom:12}}/><br/>
                  Nenhum pedido encontrado com os filtros atuais.
                </div>
              ) : paginados.map(p=>{
                const canal  = getCanal(p)
                const sitId  = getSitId(p)
                const s      = SIT[sitId] || {label:'—',cor:'#888',bg:'var(--fill)'}
                const cc     = CANAL_CFG[canal] || CANAL_CFG.bling
                const temRas = !!(p.transporte?.volumes?.[0]?.codigoRastreamento || p.codigoRastreio)
                return (
                  <div key={p.numero} onClick={()=>setSel(p)} style={{
                    display:'grid',
                    gridTemplateColumns:'90px 90px 1fr 110px 90px 100px 80px 56px',
                    gap:0,padding:'9px 10px',marginBottom:3,
                    background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:10,
                    cursor:'pointer',transition:'border-color .12s',alignItems:'center',
                  }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=s.cor}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='var(--sep)'}
                  >
                    <div style={{padding:'0 6px'}}>
                      <span style={{fontSize:12.5,fontWeight:700,color:'var(--label)'}}>{p.numero}</span>
                    </div>
                    <div style={{padding:'0 6px'}}>
                      <span style={{fontSize:11,color:'var(--label-4)'}}>{fmtData(p.data)}</span>
                    </div>
                    <div style={{padding:'0 6px',overflow:'hidden'}}>
                      <div style={{fontSize:12.5,fontWeight:500,color:'var(--label)',
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {p.contato||'—'}
                      </div>
                      {p.telefone&&<div style={{fontSize:10,color:'var(--label-4)'}}>{p.telefone}</div>}
                    </div>
                    <div style={{padding:'0 6px'}}><CanalBadge canal={canal} small/></div>
                    <div style={{padding:'0 6px'}}>
                      <Pill label={s.label} cor={s.cor} bg={s.bg} size={10}/>
                    </div>
                    <div style={{padding:'0 6px'}}>
                      <span style={{fontSize:12.5,fontWeight:700,color:'var(--label)'}}>{fmtMoeda(p.total)}</span>
                    </div>
                    <div style={{padding:'0 6px',display:'flex',alignItems:'center'}}>
                      {temRas
                        ? <span style={{fontSize:10,color:'#22c55e',display:'flex',alignItems:'center',gap:3}}>
                            <Truck size={11}/> Sim
                          </span>
                        : <span style={{fontSize:10,color:'var(--label-4)'}}>—</span>
                      }
                    </div>
                    <div style={{padding:'0 6px',display:'flex',justifyContent:'flex-end'}}>
                      <Eye size={14} style={{color:'var(--label-4)'}}/>
                    </div>
                  </div>
                )
              })}

              {/* Paginação */}
              {totalPgs > 1 && (
                <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,marginTop:14,paddingBottom:8}}>
                  <button onClick={()=>setPgUI(p=>Math.max(1,p-1))} disabled={pgUI===1} style={{
                    padding:'5px 10px',borderRadius:8,border:'1px solid var(--sep)',
                    background:'var(--fill)',cursor:pgUI===1?'not-allowed':'pointer',
                    color:'var(--label-3)',opacity:pgUI===1?0.5:1,
                  }}><ChevronLeft size={14}/></button>
                  <span style={{fontSize:12,color:'var(--label-4)'}}>
                    {pgUI} de {totalPgs} · {filtrados.length} pedidos
                  </span>
                  <button onClick={()=>setPgUI(p=>Math.min(totalPgs,p+1))} disabled={pgUI===totalPgs} style={{
                    padding:'5px 10px',borderRadius:8,border:'1px solid var(--sep)',
                    background:'var(--fill)',cursor:pgUI===totalPgs?'not-allowed':'pointer',
                    color:'var(--label-3)',opacity:pgUI===totalPgs?0.5:1,
                  }}><ChevronRight size={14}/></button>
                  {temMais && pgUI===totalPgs && (
                    <button onClick={()=>carregar(pgAPI+1,true)} disabled={loadMore} style={{
                      padding:'5px 12px',borderRadius:8,border:'1px solid var(--sep)',
                      background:'var(--fill)',cursor:loadMore?'not-allowed':'pointer',
                      color:'var(--label-3)',fontSize:12,
                    }}>
                      {loadMore?<RefreshCw size={12} style={{animation:'spin 1s linear infinite'}}/>:'Carregar mais'}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {sel && <OrderSheet pedRow={sel} onClose={()=>setSel(null)} api={api} allPedidos={pedidos}/>}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }
      `}</style>
    </div>
  )
}
