/**
 * PageDisparos.jsx — Bia v6 Enterprise
 * Monitor de disparos automáticos e gatilhos WhatsApp
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Zap, Send, AlertCircle, Clock, CheckCircle, RefreshCw,
  TrendingUp, Users, XCircle, BarChart3, Activity, Filter,
  ShoppingBag, Truck, CreditCard, Bell, Star, FileText,
  Package, ArrowUpRight, ArrowDownRight, Minus, Search,
  RotateCcw, ChevronLeft, ChevronRight, Eye, X, Navigation,
  Hash, Timer, AlertTriangle, ShieldCheck, ToggleLeft,
  ToggleRight, Download, Info, MessageSquare, ExternalLink,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie,
} from 'recharts'

const BASE = import.meta.env?.VITE_API_URL || ''

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

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KCard({icon:Ic, label, value, sub, cor='#7c6af7', trend, spark}) {
  return (
    <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,
      padding:'14px 16px',display:'flex',flexDirection:'column',gap:8,position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:0,right:0,width:70,height:70,
        background:`radial-gradient(circle at 100% 0%,${cor}18 0%,transparent 70%)`,pointerEvents:'none'}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div style={{width:32,height:32,borderRadius:9,background:`${cor}18`,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Ic size={15} style={{color:cor}}/>
        </div>
        {trend!==undefined && (
          <div style={{display:'flex',alignItems:'center',gap:3,fontSize:11,fontWeight:600,
            color:trend>0?'#22c55e':trend<0?'#ef4444':'var(--label-4)'}}>
            {trend>0?<ArrowUpRight size={11}/>:trend<0?<ArrowDownRight size={11}/>:<Minus size={11}/>}
            {trend!==0&&`${Math.abs(trend)}%`}
          </div>
        )}
      </div>
      <div>
        <div style={{fontSize:24,fontWeight:700,color:'var(--label)',lineHeight:1.1}}>{value??'—'}</div>
        <div style={{fontSize:11,color:'var(--label-4)',marginTop:2}}>{label}</div>
        {sub && <div style={{fontSize:10,color:'var(--label-4)',marginTop:1}}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── DRAWER LATERAL: detalhe do disparo OU perfil do cliente ──────────────────
function DrawerDetalhe({ tipo, dados, api, onClose, onVerPedido, onFiltrarGatilho, onReenviar }) {
  // tipo: 'disparo' (1 disparo) ou 'cliente' (timeline completa)
  const [cli, setCli]       = useState(null)
  const [loadCli, setLoad]  = useState(false)
  const [reenviados, setReenviados] = useState([])  // ids já reenviados nesta sessão

  useEffect(() => {
    if (tipo==='cliente' && dados?.telefone) {
      setLoad(true)
      fetch(`${api}/api/dashboard/disparos-cliente/${encodeURIComponent(dados.telefone)}`)
        .then(r=>r.json()).then(d=>{ setCli(d); setLoad(false) })
        .catch(()=>setLoad(false))
    }
  }, [tipo, dados, api])

  return (
    <>
      {/* fundo escuro */}
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:60,
        animation:'fadeIn .2s ease'}}/>
      {/* painel */}
      <div style={{position:'fixed',top:0,right:0,bottom:0,width:'min(440px,92vw)',zIndex:61,
        background:'var(--bg-2)',borderLeft:'1px solid var(--sep)',boxShadow:'-8px 0 40px rgba(0,0,0,.3)',
        display:'flex',flexDirection:'column',animation:'slideIn .28s cubic-bezier(.2,.8,.2,1)'}}>

        {/* header */}
        <div style={{padding:'16px 18px',borderBottom:'1px solid var(--sep)',background:'var(--bg-3)',
          display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:14,fontWeight:600,color:'var(--label)',display:'flex',alignItems:'center',gap:8}}>
            {tipo==='cliente'
              ? <><Users size={15}/>Perfil do cliente</>
              : <><Eye size={15}/>Detalhe do disparo</>}
          </span>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:4,display:'flex'}}>
            <X size={18}/>
          </button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'18px'}}>
          {tipo==='disparo' && dados && (() => {
            const meta = GATILHO_META[dados.gatilho]||{label:dados.gatilho,icon:Zap,cor:'#6b7280'}
            const smeta= STATUS_META[dados.status]||STATUS_META.ignorado
            const Ic=meta.icon, SIc=smeta.icon
            return (
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {/* topo */}
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:44,height:44,borderRadius:12,background:`${meta.cor}18`,
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Ic size={20} style={{color:meta.cor}}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:600,color:'var(--label)'}}>{meta.label}</div>
                    <div style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',
                      borderRadius:99,background:smeta.bg,marginTop:3}}>
                      <SIc size={9} style={{color:smeta.cor}}/>
                      <span style={{fontSize:10,fontWeight:600,color:smeta.cor}}>{smeta.label}</span>
                    </div>
                  </div>
                </div>
                {/* erro destacado */}
                {dados.erro_msg && (
                  <div style={{padding:'10px 12px',borderRadius:10,background:'rgba(239,68,68,.08)',
                    border:'1px solid rgba(239,68,68,.2)',display:'flex',gap:8,alignItems:'flex-start'}}>
                    <AlertCircle size={13} style={{color:'#ef4444',flexShrink:0,marginTop:1}}/>
                    <span style={{fontSize:12,color:'#ef4444',lineHeight:1.5}}>{dados.erro_msg}</span>
                  </div>
                )}
                {/* campos */}
                <div style={{display:'flex',flexDirection:'column',gap:0,border:'1px solid var(--sep)',borderRadius:12,overflow:'hidden'}}>
                  {[
                    ['Cliente', dados.nome_cliente||'—'],
                    ['Telefone', fmtTel(dados.telefone)],
                    ['Pedido', dados.numero_pedido?`#${dados.numero_pedido}`:'—'],
                    ['Template', dados.template_nome||dados.gatilho],
                    ['Gatilho (técnico)', dados.gatilho],
                    ['Origem', dados.origem||'bling'],
                    ['Delay', dados.delay_min>0?`${dados.delay_min} min`:'Imediato'],
                    ['Data/hora', new Date(dados.criado_em).toLocaleString('pt-BR')],
                    ['ID', `#${dados.id}`],
                  ].map(([k,v],i)=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'10px 12px',
                      borderBottom:i<8?'1px solid var(--sep)':'none',background:i%2?'var(--fill)':'transparent'}}>
                      <span style={{fontSize:11,color:'var(--label-4)'}}>{k}</span>
                      <span style={{fontSize:12,color:'var(--label)',fontWeight:500,textAlign:'right',wordBreak:'break-word'}}>{v}</span>
                    </div>
                  ))}
                </div>
                {/* ações */}
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {dados.numero_pedido && (
                    <button onClick={()=>onVerPedido?.(dados.numero_pedido)} style={{
                      display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px',borderRadius:10,
                      border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',cursor:'pointer',fontSize:12,fontWeight:600}}>
                      <Package size={13}/>Ver pedido #{dados.numero_pedido}
                    </button>
                  )}
                  {dados.telefone && (
                    <button onClick={()=>onFiltrarGatilho?.('__cliente__', dados.telefone)} style={{
                      display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px',borderRadius:10,
                      border:'1px solid rgba(124,106,247,.3)',background:'rgba(124,106,247,.08)',color:'#a78bfa',cursor:'pointer',fontSize:12,fontWeight:600}}>
                      <Users size={13}/>Ver timeline deste cliente
                    </button>
                  )}
                </div>
              </div>
            )
          })()}

          {tipo==='cliente' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {loadCli && <div style={{textAlign:'center',padding:40,color:'var(--label-4)'}}><RefreshCw size={20} style={{animation:'spin 1s linear infinite'}}/></div>}
              {cli && (
                <>
                  {/* cabeçalho do cliente */}
                  <div style={{padding:'14px',borderRadius:12,background:'var(--fill)',border:'1px solid var(--sep)'}}>
                    <div style={{fontSize:15,fontWeight:600,color:'var(--label)',marginBottom:4}}>
                      {cli.resumo?.nome||'Cliente'}
                    </div>
                    <div style={{fontSize:12,color:'var(--label-4)',fontFamily:'monospace'}}>{fmtTel(dados.telefone)}</div>
                    <div style={{display:'flex',gap:14,marginTop:12,flexWrap:'wrap'}}>
                      {[['Total',cli.resumo?.total||0,'var(--label)'],
                        ['Enviados',cli.resumo?.enviados||0,'#22c55e'],
                        ['Erros',cli.resumo?.erros||0,'#ef4444'],
                        ['Pedidos',cli.resumo?.pedidos?.length||0,'#a78bfa']].map(([k,v,c])=>(
                        <div key={k}>
                          <div style={{fontSize:18,fontWeight:700,color:c}}>{v}</div>
                          <div style={{fontSize:10,color:'var(--label-4)'}}>{k}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* timeline */}
                  <div>
                    <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',
                      color:'var(--label-4)',marginBottom:10}}>Linha do tempo</div>
                    <div style={{position:'relative',paddingLeft:30}}>
                      <div style={{position:'absolute',left:10,top:4,bottom:4,width:2,background:'var(--sep)'}}/>
                      {(cli.disparos||[]).map((d,i)=>{
                        const m=GATILHO_META[d.gatilho]||{label:d.gatilho,cor:'#6b7280',icon:Zap}
                        const s=STATUS_META[d.status]||STATUS_META.ignorado
                        const DIc=m.icon||Zap
                        const falhou = d.status==='erro'||d.status==='ignorado'
                        const jaReenv = reenviados.includes(d.id)
                        return (
                          <div key={d.id||i} style={{position:'relative',marginBottom:16}}>
                            {/* ícone da etapa no lugar do ponto */}
                            <div style={{position:'absolute',left:-24,top:0,width:22,height:22,borderRadius:'50%',
                              background:`${m.cor}22`,border:'2px solid var(--bg-2)',display:'flex',
                              alignItems:'center',justifyContent:'center'}}>
                              <DIc size={11} style={{color:m.cor}}/>
                            </div>
                            <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'baseline'}}>
                              <span style={{fontSize:12.5,fontWeight:600,color:'var(--label)'}}>{m.label}</span>
                              <span style={{fontSize:10,color:'var(--label-4)',flexShrink:0}}>{fmtDH(d.criado_em)}</span>
                            </div>
                            <div style={{fontSize:10.5,color:'var(--label-4)',marginTop:2}}>
                              {d.template_nome||d.gatilho}
                              {d.numero_pedido&&<span style={{marginLeft:6,color:'var(--label-3)'}}>· #{d.numero_pedido}</span>}
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:5}}>
                              <span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'1px 6px',
                                borderRadius:99,background:s.bg}}>
                                <span style={{fontSize:9,fontWeight:600,color:s.cor}}>{s.label}</span>
                              </span>
                              {falhou && (
                                <button disabled={jaReenv} onClick={async()=>{
                                  try { await onReenviar?.(d.id); setReenviados(r=>[...r,d.id]) } catch {}
                                }} style={{
                                  display:'inline-flex',alignItems:'center',gap:3,padding:'2px 8px',borderRadius:6,
                                  border:`1px solid ${jaReenv?'rgba(34,197,94,.4)':'rgba(167,139,250,.4)'}`,
                                  background:'transparent',color:jaReenv?'#22c55e':'#a78bfa',
                                  cursor:jaReenv?'default':'pointer',fontSize:10,fontWeight:600}}>
                                  {jaReenv?<><CheckCircle size={10}/>Reenviado</>:<><RotateCcw size={10}/>Reenviar</>}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {(!cli.disparos||cli.disparos.length===0)&&(
                        <div style={{fontSize:12,color:'var(--label-4)',padding:'12px 0'}}>Nenhum disparo registrado.</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── LINHA DO LOG ─────────────────────────────────────────────────────────────
function LinhaLog({row, onVerDisparo, onVerCliente}) {
  const meta  = GATILHO_META[row.gatilho] || {label:row.gatilho, icon:Zap, cor:'#6b7280'}
  const smeta = STATUS_META[row.status]   || STATUS_META.ignorado
  const Ic    = meta.icon
  const SIc   = smeta.icon

  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'32px 1fr 110px 100px 90px 80px 44px',
      gap:0,padding:'9px 12px',alignItems:'center',
      borderBottom:'1px solid var(--sep)',
      background:row.status==='erro'?'rgba(239,68,68,.03)':'transparent',
      transition:'background .1s',
    }}
      onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'}
      onMouseLeave={e=>e.currentTarget.style.background=row.status==='erro'?'rgba(239,68,68,.03)':'transparent'}
    >
      {/* Ícone gatilho */}
      <div style={{width:24,height:24,borderRadius:7,background:`${meta.cor}18`,
        display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <Ic size={11} style={{color:meta.cor}}/>
      </div>
      {/* Gatilho + cliente (cliente clicável → perfil) */}
      <div style={{minWidth:0,padding:'0 8px'}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
          <span style={{fontSize:12,fontWeight:600,color:'var(--label)'}}>{meta.label}</span>
          {row.delay_min>0&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:99,
            background:'rgba(245,158,11,.1)',color:'#f59e0b'}}>+{row.delay_min}min</span>}
          {row.origem==='rastreio_job'&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:99,
            background:'rgba(6,182,212,.1)',color:'#06b6d4'}}>job</span>}
          {row.origem==='manual_reenvio'&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:99,
            background:'rgba(167,139,250,.1)',color:'#a78bfa'}}>reenvio</span>}
        </div>
        <div onClick={()=>onVerCliente?.(row)} title="Ver timeline do cliente" style={{fontSize:10.5,color:'var(--label-4)',
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'pointer'}}
          onMouseEnter={e=>e.currentTarget.style.color='#a78bfa'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--label-4)'}>
          {row.nome_cliente||'—'}
          {row.numero_pedido&&<span style={{color:'var(--label-3)',marginLeft:4}}>· #{row.numero_pedido}</span>}
        </div>
      </div>
      {/* Telefone */}
      <div style={{padding:'0 6px'}}>
        <span style={{fontSize:11,color:'var(--label-4)',fontFamily:'monospace'}}>
          {fmtTel(row.telefone)}
        </span>
      </div>
      {/* Template */}
      <div style={{padding:'0 6px',overflow:'hidden'}}>
        <span style={{fontSize:10.5,color:'var(--label-3)',
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}>
          {row.template_nome||row.gatilho}
        </span>
      </div>
      {/* Status */}
      <div style={{padding:'0 6px'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',
          borderRadius:99,background:smeta.bg}}>
          <SIc size={9} style={{color:smeta.cor}}/>
          <span style={{fontSize:10,fontWeight:600,color:smeta.cor}}>{smeta.label}</span>
        </div>
      </div>
      {/* Hora */}
      <div style={{padding:'0 6px'}}>
        <span style={{fontSize:10,color:'var(--label-4)'}}>{fmtDH(row.criado_em)}</span>
      </div>
      {/* Olho → abre drawer com detalhe */}
      <div style={{display:'flex',justifyContent:'center'}}>
        <button onClick={()=>onVerDisparo?.(row)} title="Ver detalhes" style={{
          background:'none',border:'none',cursor:'pointer',padding:6,borderRadius:7,display:'flex'}}
          onMouseEnter={e=>e.currentTarget.style.background='var(--fill)'}
          onMouseLeave={e=>e.currentTarget.style.background='none'}>
          <Eye size={13} style={{color:'var(--label-3)'}}/>
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
        setLog(d.disparos||[])
        setLogTotal(d.total||0)
        setLogPgs(d.paginas||1)
        setLogPg(pg)
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

  const reenviar = async(id) => {
    const r = await fetch(`${api}/api/dashboard/disparos-reenviar/${id}`,{method:'POST'})
    if (!r.ok) throw new Error('Falha ao reenviar')
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
  const taxa       = total>0 ? Math.round(enviados/total*100) : 0
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
    cor:   GATILHO_META[g.gatilho]?.cor||'#6b7280',
  }))
  const gatilhosUsados = [...new Set((stats?.porGatilho||[]).map(g=>g.gatilho))]

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
  const funilTopo = funil[0]?.total || 0

  // INSIGHTS automáticos — lê os dados e gera avisos úteis.
  const insights = []
  ;(stats?.porGatilho||[]).forEach(g=>{
    const tot=parseInt(g.total)||0, env=parseInt(g.enviados)||0
    if (tot>=5) {
      const tx = Math.round(env/tot*100)
      if (tx < 70) insights.push({ tipo:'alerta', txt:`"${GATILHO_META[g.gatilho]?.label||g.gatilho}" com ${100-tx}% de falha (${tot-env} de ${tot}).` })
    }
  })
  if (taxa>=90) insights.push({ tipo:'bom', txt:`Taxa de entrega de ${taxa}% — comunicação saudável.` })
  else if (taxa>0 && taxa<70) insights.push({ tipo:'alerta', txt:`Taxa global de ${taxa}% está baixa — verifique os erros.` })
  if (funil.length>=2) {
    const queda = funilTopo>0 ? Math.round((1-(funil[funil.length-1].total/funilTopo))*100) : 0
    if (queda>0) insights.push({ tipo:'info', txt:`${queda}% dos pedidos ainda não chegaram à entrega (acompanhe o trânsito).` })
  }
  if ((parseInt(t.ultimas_24h)||0)===0 && total>0) insights.push({ tipo:'info', txt:'Nenhum disparo nas últimas 24h.' })
  // Mais insights: gatilho campeão, ignorados altos, melhor horário, volume do dia
  const _ord = [...(stats?.porGatilho||[])].sort((a,b)=>(parseInt(b.total)||0)-(parseInt(a.total)||0))
  if (_ord[0] && (parseInt(_ord[0].total)||0)>=10) {
    insights.push({ tipo:'info', txt:`Gatilho mais ativo: "${GATILHO_META[_ord[0].gatilho]?.label||_ord[0].gatilho}" (${_ord[0].total} disparos).` })
  }
  const ign = parseInt(t.ignorados)||0
  if (total>0 && ign/total>0.3) {
    insights.push({ tipo:'alerta', txt:`${Math.round(ign/total*100)}% dos disparos foram ignorados — veja se há gatilhos desativados ou sem telefone.` })
  }
  if (stats?.picoHora!=null) {
    insights.push({ tipo:'info', txt:`Horário de pico: a maioria dos disparos sai por volta das ${stats.picoHora}h.` })
  }
  const aguard = parseInt(t.aguardando)||0
  if (aguard>5) insights.push({ tipo:'alerta', txt:`${aguard} disparos aguardando há mais tempo que o esperado — verifique a fila.` })
  const INS_META = {
    alerta:{ cor:'#f59e0b', bg:'rgba(245,158,11,.1)', icon:AlertTriangle },
    bom:   { cor:'#22c55e', bg:'rgba(34,197,94,.1)',  icon:CheckCircle },
    info:  { cor:'#4a9fff', bg:'rgba(74,159,255,.1)', icon:Info },
  }

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg)'}}>

      {/* ── HEADER ── */}
      <div style={{padding:'12px 20px',flexShrink:0,borderBottom:'1px solid var(--sep)',
        background:'var(--bg-2)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:'rgba(124,106,247,.15)',
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Zap size={17} style={{color:'#7c6af7'}}/>
            </div>
            <div>
              <h2 style={{fontSize:18,fontWeight:700,color:'var(--label)',margin:0}}>Monitor de Disparos</h2>
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
          {/* Período */}
          <div style={{display:'flex',gap:2,padding:'3px',borderRadius:10,background:'var(--fill)',border:'1px solid var(--sep)'}}>
            {PERIODOS.map(p=>(
              <button key={p.id} onClick={()=>setPeriodo(p.id)} style={{
                padding:'4px 10px',borderRadius:7,border:'none',fontSize:11,cursor:'pointer',
                background:periodo===p.id?'var(--bg-2)':'transparent',
                color:periodo===p.id?'var(--label)':'var(--label-4)',
                fontWeight:periodo===p.id?600:400}}>
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

      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:16}}>

        {/* ── KPIs ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10}}>
          <KCard icon={Send}      label="Total disparos"     value={total}     cor="#7c6af7" sub={`últimos ${stats?.dias||7} dias`}/>
          <KCard icon={CheckCircle}label="Enviados"           value={enviados}  cor="#22c55e" sub={`taxa ${taxa}%`} trend={taxa>=90?5:taxa>=70?0:-5}/>
          <KCard icon={XCircle}   label="Erros"              value={erros}     cor="#ef4444" trend={erros>0?-1:0}/>
          <KCard icon={Users}     label="Clientes alcançados" value={parseInt(t.clientes_unicos)||0} cor="#4a9fff"/>
          <KCard icon={Activity}  label="Últimas 24h"        value={parseInt(t.ultimas_24h)||0} cor="#a78bfa"/>
          <KCard icon={Clock}     label="Aguardando"          value={parseInt(t.aguardando)||0} cor="#f59e0b"/>
        </div>

        {/* ── Taxa global ── */}
        <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'14px 18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontSize:13,fontWeight:600,color:'var(--label)',display:'flex',alignItems:'center',gap:7}}>
              <ShieldCheck size={14} style={{color:'#22c55e'}}/>Taxa de sucesso global
            </span>
            <span style={{fontSize:24,fontWeight:800,color:taxa>=90?'#22c55e':taxa>=70?'#f59e0b':'#ef4444'}}>
              {taxa}%
            </span>
          </div>
          <div style={{height:10,borderRadius:99,overflow:'hidden',background:'var(--fill)',marginBottom:10}}>
            <div style={{height:'100%',borderRadius:99,transition:'width 1s',
              width:`${taxa}%`,background:taxa>=90?'#22c55e':taxa>=70?'#f59e0b':'#ef4444'}}/>
          </div>
          <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
            {[
              {l:'Enviados',  v:t.enviados,  c:'#22c55e'},
              {l:'Erros',     v:t.erros,     c:'#ef4444'},
              {l:'Ignorados', v:t.ignorados, c:'#6b7280'},
              {l:'Aguardando',v:t.aguardando,c:'#f59e0b'},
            ].map(s=>(
              <div key={s.l} style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:s.c}}/>
                <span style={{fontSize:11,color:'var(--label-3)'}}>
                  {s.l}: <strong style={{color:'var(--label)'}}>{parseInt(s.v)||0}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Funil da jornada + Insights ── */}
        <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:14}}>
          {/* Funil */}
          <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'14px 18px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--label)',display:'flex',alignItems:'center',gap:7,marginBottom:14}}>
              <Filter size={14} style={{color:'#7c6af7'}}/>Funil da jornada
              <span style={{fontSize:10,color:'var(--label-4)',fontWeight:400,marginLeft:'auto'}}>onde estão seus clientes</span>
            </div>
            {funil.length===0
              ? <p style={{fontSize:12,color:'var(--label-4)',textAlign:'center',padding:20,margin:0}}>Sem dados de jornada no período</p>
              : <div style={{display:'flex',flexDirection:'column',gap:0}}>
                  {funil.map((e,i)=>{
                    const pct = funilTopo>0?Math.round(e.total/funilTopo*100):0
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
                              {i>0&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:99,
                                color:'var(--label-4)',background:'var(--fill)'}}>{pct}%</span>}
                            </div>
                          </div>
                          <div style={{height:4,borderRadius:99,background:'var(--fill)',overflow:'hidden'}}>
                            <div style={{height:'100%',borderRadius:99,background:e.cor,width:`${pct}%`,transition:'width .7s'}}/>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </div>
          {/* Insights */}
          <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'14px 18px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--label)',display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
              <Zap size={14} style={{color:'#f59e0b'}}/>Insights
            </div>
            {(() => {
              const visiveis = insights.filter(ins => !insDispensados.includes(ins.txt))
              return visiveis.length===0
              ? <p style={{fontSize:12,color:'var(--label-4)',textAlign:'center',padding:20,margin:0}}>
                  {insights.length>0?'Todos os alertas foram revisados ✓':'Tudo tranquilo por aqui.'}
                </p>
              : <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {visiveis.slice(0,5).map((ins,i)=>{
                    const m=INS_META[ins.tipo]||INS_META.info, MI=m.icon
                    return (
                      <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',padding:'8px 10px',
                        borderRadius:9,background:m.bg}}>
                        <MI size={13} style={{color:m.cor,flexShrink:0,marginTop:2}}/>
                        <span style={{flex:1,fontSize:11.5,color:'var(--label-3)',lineHeight:1.45}}>{ins.txt}</span>
                        <button onClick={()=>setInsDispensados(d=>[...d,ins.txt])}
                          title="Marcar como revisado" style={{
                          flexShrink:0,display:'flex',alignItems:'center',gap:3,padding:'2px 7px',borderRadius:6,
                          border:`1px solid ${m.cor}40`,background:'transparent',color:m.cor,cursor:'pointer',
                          fontSize:10,fontWeight:600}}>
                          <CheckCircle size={10}/>Entendi
                        </button>
                      </div>
                    )
                  })}
                </div>
            })()}
          </div>
        </div>

        {/* ── Horários de pico ── */}
        <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'14px 18px'}}>
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
          <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'14px 18px'}}>
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
          <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'14px 18px'}}>
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
                    const taxa = g.total>0?Math.round(g.enviados/g.total*100):0
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
                              <span style={{fontSize:9,padding:'1px 5px',borderRadius:99,
                                color:taxa>=90?'#22c55e':taxa>=70?'#f59e0b':'#ef4444',
                                background:taxa>=90?'rgba(34,197,94,.1)':taxa>=70?'rgba(245,158,11,.1)':'rgba(239,68,68,.1)'}}>
                                {taxa}%
                              </span>
                            </div>
                          </div>
                          <div style={{height:4,borderRadius:99,background:'var(--fill)',overflow:'hidden'}}>
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
        <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,overflow:'hidden'}}>

          {/* Header do log */}
          <div style={{padding:'12px 14px',borderBottom:'1px solid var(--sep)',
            background:'var(--bg-3)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:13,fontWeight:600,color:'var(--label)',display:'flex',alignItems:'center',gap:6}}>
                <FileText size={13}/>Log de disparos
              </span>
              <span style={{fontSize:10,padding:'1px 7px',borderRadius:99,
                background:'var(--fill)',color:'var(--label-4)',border:'1px solid var(--sep)'}}>
                {logTotal} total
              </span>
              {loadLog&&<RefreshCw size={11} style={{color:'var(--label-4)',animation:'spin 1s linear infinite'}}/>}
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              {/* Busca */}
              <div style={{position:'relative'}}>
                <Search size={11} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',
                  color:'var(--label-4)',pointerEvents:'none'}}/>
                <input value={buscaInput} onChange={e=>setBuscaInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&setBusca(buscaInput)}
                  placeholder="Nome, tel, pedido..." style={{
                    padding:'5px 8px 5px 26px',borderRadius:8,border:'1px solid var(--sep)',
                    background:'var(--fill)',color:'var(--label)',fontSize:11,width:160}}/>
                {buscaInput&&<button onClick={()=>{setBuscaInput('');setBusca('')}} style={{
                  position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',
                  background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:0}}>
                  <X size={10}/>
                </button>}
              </div>
              {/* Filtro status */}
              <select value={filtroSt} onChange={e=>setFiltroSt(e.target.value)} style={{
                fontSize:11,padding:'5px 8px',borderRadius:8,border:'1px solid var(--sep)',
                background:'var(--fill)',color:'var(--label-3)',cursor:'pointer'}}>
                <option value="todos">Todos status</option>
                {Object.entries(STATUS_META).map(([id,m])=>(
                  <option key={id} value={id}>{m.label}</option>
                ))}
              </select>
              {/* Filtro gatilho */}
              <select value={filtroGat} onChange={e=>setFiltroGat(e.target.value)} style={{
                fontSize:11,padding:'5px 8px',borderRadius:8,border:'1px solid var(--sep)',
                background:'var(--fill)',color:'var(--label-3)',cursor:'pointer'}}>
                <option value="todos">Todos gatilhos</option>
                {gatilhosUsados.map(g=>(
                  <option key={g} value={g}>{GATILHO_META[g]?.label||g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cabeçalho tabela */}
          <div style={{display:'grid',
            gridTemplateColumns:'32px 1fr 110px 100px 90px 80px 44px',
            padding:'6px 12px',borderBottom:'1px solid var(--sep)',background:'var(--bg-3)'}}>
            {['','Gatilho / Cliente','Telefone','Template','Status','Data/Hora',''].map((h,i)=>(
              <span key={i} style={{fontSize:10,fontWeight:700,textTransform:'uppercase',
                letterSpacing:'.05em',color:'var(--label-4)',padding:'0 6px'}}>{h}</span>
            ))}
          </div>

          {/* Linhas */}
          <div>
          {log.length===0&&!loadLog
            ? <div style={{padding:48,textAlign:'center',color:'var(--label-4)'}}>
                <Zap size={32} style={{opacity:.15,marginBottom:12}}/><br/>
                <p style={{fontSize:13,margin:0}}>Nenhum disparo encontrado.</p>
                <p style={{fontSize:11,margin:'6px 0 0'}}>Verifique os filtros ou aguarde novos eventos.</p>
              </div>
            : log.map((row,i)=>(
                <LinhaLog key={row.id||i} row={row}
                  onVerDisparo={r=>setDrawer({tipo:'disparo',dados:r})}
                  onVerCliente={r=>setDrawer({tipo:'cliente',dados:r})}/>
              ))
          }
          </div>

          {/* Paginação */}
          {logPgs>1&&(
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,
              padding:'12px',borderTop:'1px solid var(--sep)'}}>
              <button onClick={()=>carregarLog(logPg-1)} disabled={logPg===1} style={{
                padding:'5px 10px',borderRadius:8,border:'1px solid var(--sep)',
                background:'var(--fill)',cursor:logPg===1?'not-allowed':'pointer',
                color:'var(--label-3)',opacity:logPg===1?.5:1}}>
                <ChevronLeft size={14}/>
              </button>
              <span style={{fontSize:12,color:'var(--label-4)'}}>
                {logPg} de {logPgs} · {logTotal} disparos
              </span>
              <button onClick={()=>carregarLog(logPg+1)} disabled={logPg===logPgs} style={{
                padding:'5px 10px',borderRadius:8,border:'1px solid var(--sep)',
                background:'var(--fill)',cursor:logPg===logPgs?'not-allowed':'pointer',
                color:'var(--label-3)',opacity:logPg===logPgs?.5:1}}>
                <ChevronRight size={14}/>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Drawer lateral */}
      {drawer && (
        <DrawerDetalhe
          tipo={drawer.tipo}
          dados={drawer.dados}
          api={api}
          onClose={()=>setDrawer(null)}
          onVerPedido={num=>{ window.open(`https://rastreio.sostrass.com.br/pedido/${num}`,'_blank') }}
          onReenviar={reenviar}
          onFiltrarGatilho={(g,tel)=>{
            if (g==='__cliente__') { setDrawer({tipo:'cliente',dados:{telefone:tel}}) }
          }}
        />
      )}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
      `}</style>
    </div>
  )
}
