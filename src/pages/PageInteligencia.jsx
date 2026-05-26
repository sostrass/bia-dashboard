import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Brain, Zap, Users, TrendingUp, TrendingDown, AlertTriangle,
  RefreshCw, Search, Filter, X, ChevronDown, ChevronUp,
  MessageSquare, Send, Star, Crown, Activity, Package,
  ShoppingCart, Clock, Target, Sparkles, BarChart3, Settings,
  Check, Copy, ExternalLink, ArrowRight, Bell, Eye, EyeOff,
  UserX, DollarSign, Flame, Shield, Award, Heart, Boxes,
  ChevronRight, MoreHorizontal, Play, Pause, RotateCcw,
  Radio, Wifi, AlertCircle, CheckCircle, Info, Lightbulb,
  Layers, SlidersHorizontal, Calendar, Hash, Phone, Mail,
  Package2, Tag, Archive, Repeat, Percent, CircleOff, Lock
} from 'lucide-react'

// ── Utilitários ────────────────────────────────────────────────────────────────
const R   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const Rk  = n => n >= 1000 ? `R$ ${(n/1000).toFixed(1).replace('.',',')}k` : R(n)
const fmt = n => Number(n||0).toLocaleString('pt-BR')
const fmtD  = d => d ? new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}) : '—'
const fmtDT = d => d ? new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'
const diasAtras = d => {
  if (!d) return 999
  const diff = (Date.now() - new Date(d).getTime()) / 86400000
  return Math.floor(diff)
}
const pluralize = (n, s, p) => `${fmt(n)} ${n === 1 ? s : p}`

// ── Paleta de cores do sistema ────────────────────────────────────────────────
const COR = {
  vip:       '#f59e0b',
  fiel:      '#22c55e',
  potencial: '#7c6af7',
  novo:      '#4a9fff',
  regular:   '#00d4aa',
  em_risco:  '#f97316',
  perdido:   '#ef4444',
  urgente:   '#ef4444',
  oportunidade: '#7c6af7',
  estoque:   '#f97316',
  posVenda:  '#4a9fff',
  comportamento: '#00d4aa',
}

// ── Segmentos RFM completos ───────────────────────────────────────────────────
const SEG = {
  vip:       { label:'VIP',       cor:COR.vip,       Icon:Crown,         desc:'Frequente, alto valor, recente' },
  fiel:      { label:'Fiel',      cor:COR.fiel,      Icon:Star,          desc:'Compra regularmente' },
  potencial: { label:'Potencial', cor:COR.potencial, Icon:TrendingUp,    desc:'Alto valor, baixa frequência' },
  novo:      { label:'Novo',      cor:COR.novo,      Icon:Sparkles,      desc:'1ª ou 2ª compra' },
  regular:   { label:'Regular',   cor:COR.regular,   Icon:Activity,      desc:'Padrão médio de compra' },
  em_risco:  { label:'Em risco',  cor:COR.em_risco,  Icon:AlertTriangle, desc:'Sumindo progressivamente' },
  perdido:   { label:'Perdido',   cor:COR.perdido,   Icon:UserX,         desc:'Sem comprar há muito tempo' },
}

// ── Tipos de sugestão da Bia ─────────────────────────────────────────────────
const TIPO_SUGESTAO = {
  urgente:      { label:'Urgente',      cor:'#ef4444', bg:'rgba(239,68,68,.08)',   Icon:AlertTriangle },
  oportunidade: { label:'Oportunidade', cor:'#7c6af7', bg:'rgba(124,106,247,.08)', Icon:Lightbulb },
  estoque:      { label:'Estoque',      cor:'#f97316', bg:'rgba(249,115,22,.08)',   Icon:Boxes },
  posVenda:     { label:'Pós-venda',    cor:'#4a9fff', bg:'rgba(74,159,255,.08)',   Icon:Heart },
  comportamento:{ label:'Padrão',       cor:'#00d4aa', bg:'rgba(0,212,170,.08)',    Icon:BarChart3 },
}

// ── Canais ────────────────────────────────────────────────────────────────────
const CANAL = {
  shopee:       { label:'Shopee',        cor:'#EE4D2D' },
  mercadolivre: { label:'Mercado Livre', cor:'#f5a623' },
  nuvemshop:    { label:'Nuvemshop',     cor:'#0070f3' },
  tiktokshop:   { label:'TikTok',        cor:'#222' },
  shein:        { label:'Shein',         cor:'#c0392b' },
  whatsapp:     { label:'WhatsApp',      cor:'#25D366' },
  loja:         { label:'Loja',          cor:'#10b981' },
}


// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ nome, size=36, cor, foto }) {
  const init = (nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const pal  = ['#7c6af7','#00d4aa','#f59e0b','#22c55e','#4a9fff','#e879f9','#fb923c']
  const c    = cor || pal[(nome||'?').charCodeAt(0) % pal.length]
  if (foto) return (
    <div style={{width:size,height:size,borderRadius:'50%',overflow:'hidden',flexShrink:0,border:`2px solid ${c}40`}}>
      <img src={foto} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
    </div>
  )
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:`${c}18`,border:`1.5px solid ${c}45`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.36,fontWeight:800,color:c,flexShrink:0,letterSpacing:'-.5px'}}>
      {init}
    </div>
  )
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size=48, strokeWidth=4 }) {
  const r   = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const cor  = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} style={{transform:'rotate(-90deg)',flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--fill)" strokeWidth={strokeWidth}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={cor} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{transition:'stroke-dasharray .8s cubic-bezier(.4,0,.2,1)'}}/>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{transform:'rotate(90deg)',transformOrigin:`${size/2}px ${size/2}px`,fontSize:size*.28,fontWeight:800,fill:cor}}>
        {score}
      </text>
    </svg>
  )
}

// ── Mini sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data=[], cor='#7c6af7', height=28, width=80 }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const pts = data.map((v,i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / (max - min || 1)) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} style={{flexShrink:0}}>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points={`0,${height} ${pts} ${width},${height}`} fill={`${cor}15`} stroke="none"/>
    </svg>
  )
}

// ── Barra de progresso ────────────────────────────────────────────────────────
function ProgressBar({ value, max, cor, height=5 }) {
  const pct = Math.min(100, (value/max)*100)
  return (
    <div style={{height,borderRadius:99,background:'var(--fill)',overflow:'hidden',flex:1}}>
      <div style={{height:'100%',borderRadius:99,background:cor,width:`${pct}%`,transition:'width .8s cubic-bezier(.4,0,.2,1)'}}/>
    </div>
  )
}

// ── Chip de segmento ──────────────────────────────────────────────────────────
function SegChip({ seg }) {
  const s = SEG[seg] || SEG.regular
  const I = s.Icon
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10.5,fontWeight:700,padding:'2px 8px',borderRadius:99,background:`${s.cor}15`,color:s.cor,border:`1px solid ${s.cor}30`,whiteSpace:'nowrap'}}>
      <I size={9}/>{s.label}
    </span>
  )
}

// ── Canal chip ────────────────────────────────────────────────────────────────
function CanalChip({ canal }) {
  const c = CANAL[canal] || CANAL.loja
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:10,fontWeight:600,padding:'1px 7px',borderRadius:99,background:`${c.cor}15`,color:c.cor,border:`1px solid ${c.cor}30`,whiteSpace:'nowrap'}}>
      {c.label}
    </span>
  )
}


// ── Card de Sugestão da Bia ───────────────────────────────────────────────────
function BiaCard({ sug, onAction, onDismiss, api }) {
  const [expanded, setExpanded] = useState(false)
  const [acting,   setActing]   = useState(false)
  const [done,     setDone]     = useState(false)
  const tipo = TIPO_SUGESTAO[sug.tipo] || TIPO_SUGESTAO.oportunidade
  const Icon = tipo.Icon

  const agir = async () => {
    if (acting || done) return
    setActing(true)
    try {
      if (sug.acao?.endpoint) {
        await fetch(`${api}${sug.acao.endpoint}`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify(sug.acao.payload||{})
        })
      }
      setDone(true)
    } catch {}
    setActing(false)
  }

  return (
    <div style={{
      borderRadius:12, border:`1px solid ${tipo.cor}25`,
      background:tipo.bg, overflow:'hidden',
      transition:'all .2s', opacity: done ? .6 : 1,
    }}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',gap:12,padding:'13px 15px'}}>
        {/* Ícone tipo */}
        <div style={{width:34,height:34,borderRadius:9,background:`${tipo.cor}20`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:`1px solid ${tipo.cor}30`}}>
          <Icon size={16} style={{color:tipo.cor}}/>
        </div>

        {/* Conteúdo */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4,flexWrap:'wrap'}}>
            <span style={{fontSize:12,fontWeight:700,padding:'1px 7px',borderRadius:99,background:`${tipo.cor}20`,color:tipo.cor}}>{tipo.label}</span>
            {sug.prioridade === 'alta' && <span style={{fontSize:10.5,fontWeight:700,color:'#ef4444'}}>● urgente</span>}
            <span style={{fontSize:11,color:'var(--label-4)',marginLeft:'auto'}}>{fmtDT(sug.criado_em)}</span>
          </div>
          <p style={{fontSize:13.5,fontWeight:600,color:'var(--label)',margin:'0 0 4px',lineHeight:1.3}}>{sug.titulo}</p>
          <p style={{fontSize:12.5,color:'var(--label-3)',margin:0,lineHeight:1.6}}>{sug.descricao}</p>

          {/* Clientes afetados */}
          {sug.clientes?.length > 0 && (
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:8}}>
              <div style={{display:'flex'}}>
                {sug.clientes.slice(0,4).map((c,i)=>(
                  <div key={i} style={{marginLeft:i>0?-8:0,zIndex:4-i,position:'relative'}}>
                    <Avatar nome={c.nome} size={24}/>
                  </div>
                ))}
              </div>
              <span style={{fontSize:11.5,color:'var(--label-4)'}}>
                {sug.clientes.length > 4
                  ? `${sug.clientes.slice(0,3).map(c=>c.nome.split(' ')[0]).join(', ')} +${sug.clientes.length-3}`
                  : sug.clientes.map(c=>c.nome.split(' ')[0]).join(', ')
                }
              </span>
              {sug.valor_estimado > 0 && (
                <span style={{fontSize:11.5,fontWeight:700,color:'#22c55e',marginLeft:'auto'}}>{Rk(sug.valor_estimado)}</span>
              )}
            </div>
          )}

          {/* Detalhes expandidos */}
          {expanded && sug.detalhes && (
            <div style={{marginTop:10,padding:'10px 12px',borderRadius:9,background:'var(--fill)',border:'1px solid var(--sep)'}}>
              <pre style={{fontSize:12,color:'var(--label-3)',margin:0,whiteSpace:'pre-wrap',fontFamily:'inherit',lineHeight:1.6}}>{sug.detalhes}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Footer ações */}
      {!done && (
        <div style={{display:'flex',alignItems:'center',gap:7,padding:'10px 15px',borderTop:`1px solid ${tipo.cor}15`}}>
          {sug.acao && (
            <button onClick={agir} disabled={acting} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:8,border:`1px solid ${tipo.cor}40`,background:`${tipo.cor}15`,color:tipo.cor,cursor:'pointer',fontSize:12.5,fontWeight:700,transition:'all .15s'}}>
              {acting ? <RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> : <Send size={13}/>}
              {acting ? 'Enviando...' : sug.acao.label}
            </button>
          )}
          {sug.detalhes && (
            <button onClick={()=>setExpanded(v=>!v)} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 11px',borderRadius:8,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-4)',cursor:'pointer',fontSize:12}}>
              {expanded ? <><ChevronUp size={12}/> Menos</> : <><ChevronDown size={12}/> Mais</>}
            </button>
          )}
          <button onClick={()=>onDismiss(sug.id)} style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-4)',cursor:'pointer',fontSize:11.5}}>
            <X size={11}/> Ignorar
          </button>
        </div>
      )}
      {done && (
        <div style={{padding:'10px 15px',borderTop:`1px solid ${tipo.cor}15`,display:'flex',alignItems:'center',gap:6}}>
          <CheckCircle size={13} style={{color:'#22c55e'}}/>
          <span style={{fontSize:12,color:'#22c55e',fontWeight:600}}>Ação executada</span>
        </div>
      )}
    </div>
  )
}


// ── Sheet lateral do cliente ──────────────────────────────────────────────────
function ClienteSheet({ cliente, onClose, api }) {
  const [tab,     setTab]     = useState('perfil')
  const [pedidos, setPedidos] = useState([])
  const [loadPed, setLoadPed] = useState(false)
  const [cp,      setCp]      = useState('')
  const [sending, setSend]    = useState(false)
  const [sent,    setSent]    = useState(false)
  const [msg,     setMsg]     = useState('')
  const s = SEG[cliente.segmento] || SEG.regular
  const Icon = s.Icon

  const copy = (v,k) => { navigator.clipboard.writeText(String(v??'')); setCp(k); setTimeout(()=>setCp(''),2000) }

  useEffect(()=>{
    if (tab !== 'pedidos') return
    if (pedidos.length) return
    setLoadPed(true)
    fetch(`${api}/api/dashboard/pedido-completo-by-contato/${encodeURIComponent(cliente.nome||'')}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(d?.pedidos) setPedidos(d.pedidos); setLoadPed(false)})
      .catch(()=>setLoadPed(false))
  },[tab])

  const enviarWA = async () => {
    if (!msg.trim() || !cliente.telefone) return
    setSend(true)
    try {
      await fetch(`${api}/api/dashboard/manual/${cliente.telefone.replace(/\D/g,'')}`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({mensagem: msg.trim()})
      })
      setSent(true); setMsg('')
      setTimeout(()=>setSent(false), 3000)
    } catch {}
    setSend(false)
  }

  const TABS = [
    {id:'perfil', label:'Perfil'},
    {id:'rfm',    label:'Score RFM'},
    {id:'pedidos',label:'Pedidos'},
    {id:'msg',    label:'Mensagem'},
  ]

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:40,backdropFilter:'blur(4px)'}}/>
      <div style={{position:'fixed',top:0,right:0,bottom:0,width:480,zIndex:50,background:'var(--bg-2)',borderLeft:'1px solid var(--sep)',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'-16px 0 48px rgba(0,0,0,.25)'}}>

        {/* Accent */}
        <div style={{height:2.5,background:`linear-gradient(90deg,${s.cor},${s.cor}60)`,flexShrink:0}}/>

        {/* Header */}
        <div style={{padding:'16px 20px 0',flexShrink:0,borderBottom:'1px solid var(--sep)'}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:14}}>
            <Avatar nome={cliente.nome} size={52}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                <span style={{fontSize:17,fontWeight:700,color:'var(--label)',letterSpacing:'-.3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cliente.nome||'—'}</span>
                <SegChip seg={cliente.segmento}/>
              </div>
              <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                {cliente.canal && <CanalChip canal={cliente.canal}/>}
                {cliente.telefone && (
                  <button onClick={()=>copy(cliente.telefone,'tel')} style={{display:'flex',alignItems:'center',gap:4,fontSize:11.5,color:'var(--label-4)',background:'transparent',border:'none',cursor:'pointer',padding:0}}>
                    <Phone size={10}/>{cliente.telefone}
                    {cp==='tel'?<Check size={9} style={{color:'#22c55e'}}/>:<Copy size={9}/>}
                  </button>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-4)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <X size={13}/>
            </button>
          </div>

          {/* KPIs inline */}
          <div style={{display:'flex',gap:0,marginBottom:12,padding:'10px 0',borderTop:'1px solid var(--sep)'}}>
            {[
              {l:'Pedidos',      v:fmt(cliente.pedidosTotal||0),    c:'var(--label)'},
              {l:'LTV total',    v:Rk(cliente.totalGasto||0),       c:s.cor},
              {l:'Ticket médio', v:Rk(cliente.ticketMedio||0),      c:'var(--label-3)'},
              {l:'Sem comprar',  v:`${cliente.diasSemComprar||0}d`,  c: cliente.diasSemComprar > 45 ? '#ef4444' : cliente.diasSemComprar > 25 ? '#f97316' : '#22c55e'},
            ].map((k,i,arr)=>(
              <div key={k.l} style={{flex:1,textAlign:'center',paddingRight:i<arr.length-1?8:0,marginRight:i<arr.length-1?8:0,borderRight:i<arr.length-1?'1px solid var(--sep)':'none'}}>
                <div style={{fontSize:14,fontWeight:700,color:k.c,lineHeight:1}}>{k.v}</div>
                <div style={{fontSize:9.5,color:'var(--label-4)',marginTop:3,textTransform:'uppercase',letterSpacing:'.06em'}}>{k.l}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{display:'flex',marginBottom:-1}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'7px 14px',fontSize:12,border:'none',background:'transparent',cursor:'pointer',color:tab===t.id?s.cor:'var(--label-4)',borderBottom:`2px solid ${tab===t.id?s.cor:'transparent'}`,fontWeight:tab===t.id?600:400,transition:'color .1s'}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>

          {/* Perfil */}
          {tab==='perfil'&&(
            <div>
              <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',marginBottom:8}}>Dados</p>
              {[
                {l:'Email',      v:cliente.email},
                {l:'Telefone',   v:cliente.telefone,  cp:'tel2'},
                {l:'CPF/CNPJ',   v:cliente.documento, cp:'doc'},
                {l:'Canal',      v:CANAL[cliente.canal]?.label},
                {l:'Última compra', v:fmtD(cliente.ultimoPedido)},
                {l:'1ª compra',  v:fmtD(cliente.primeiroPedido)},
              ].filter(r=>r.v).map(row=>(
                <div key={row.l} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--sep)'}}>
                  <span style={{fontSize:12,color:'var(--label-4)'}}>{row.l}</span>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <span style={{fontSize:12.5,color:'var(--label)',fontWeight:500}}>{row.v}</span>
                    {row.cp&&<button onClick={()=>copy(row.v,row.cp)} style={{display:'flex',alignItems:'center',padding:'1px 5px',borderRadius:4,border:'1px solid var(--sep)',background:'transparent',color:cp===row.cp?'#22c55e':'var(--label-4)',cursor:'pointer',fontSize:10}}>
                      {cp===row.cp?<Check size={8}/>:<Copy size={8}/>}
                    </button>}
                  </div>
                </div>
              ))}

              {/* Padrão de ciclo */}
              {cliente.cicloDias > 0 && (
                <div style={{marginTop:14,padding:'11px 13px',borderRadius:10,background:'rgba(124,106,247,.07)',border:'1px solid rgba(124,106,247,.2)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}>
                    <Repeat size={12} style={{color:'#7c6af7'}}/>
                    <span style={{fontSize:11.5,fontWeight:700,color:'#7c6af7'}}>Ciclo de compra detectado</span>
                  </div>
                  <p style={{fontSize:12.5,color:'var(--label-3)',margin:0,lineHeight:1.5}}>
                    Compra a cada <strong style={{color:'#7c6af7'}}>{cliente.cicloDias} dias</strong> em média.
                    {cliente.diasSemComprar >= cliente.cicloDias * .8
                      ? <span style={{color:'#f97316'}}> Está no prazo de recompra!</span>
                      : <span style={{color:'var(--label-4)'}}> Próxima compra estimada em {Math.max(0, cliente.cicloDias - cliente.diasSemComprar)} dias.</span>
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Score RFM */}
          {tab==='rfm'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:18,padding:'14px',borderRadius:12,background:'var(--fill)',border:'1px solid var(--sep)'}}>
                <ScoreRing score={cliente.scoreRFM||0} size={56}/>
                <div>
                  <p style={{fontSize:15,fontWeight:700,color:'var(--label)',margin:'0 0 4px'}}>Score RFM: {cliente.scoreRFM||0}/100</p>
                  <p style={{fontSize:12,color:'var(--label-3)',margin:0,lineHeight:1.5}}>{s.desc}</p>
                  <p style={{fontSize:12,color:s.cor,fontWeight:600,marginTop:3}}>{s.Icon&&<Icon size={11} style={{marginRight:4}}/>}{s.label}</p>
                </div>
              </div>
              <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',marginBottom:10}}>Dimensões</p>
              {[
                {label:'R — Recência',   value:cliente.rfm?.r||0, desc:`Última compra: ${cliente.diasSemComprar||0} dias atrás`},
                {label:'F — Frequência', value:cliente.rfm?.f||0, desc:`${cliente.pedidosTotal||0} pedidos no histórico`},
                {label:'M — Valor',      value:cliente.rfm?.m||0, desc:`Ticket médio: ${Rk(cliente.ticketMedio||0)}`},
              ].map(dim=>(
                <div key={dim.label} style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:12.5,fontWeight:600,color:'var(--label)'}}>{dim.label}</span>
                    <span style={{fontSize:11.5,color:'var(--label-4)'}}>{dim.desc}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <ProgressBar value={dim.value} max={5} cor={s.cor}/>
                    <span style={{fontSize:13,fontWeight:700,color:s.cor,minWidth:16}}>{dim.value}</span>
                  </div>
                </div>
              ))}
              <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',marginBottom:8,marginTop:14}}>Ação recomendada</p>
              <div style={{padding:'11px 13px',borderRadius:9,background:`${s.cor}10`,border:`1px solid ${s.cor}25`}}>
                <p style={{fontSize:12.5,color:'var(--label-2)',margin:0,lineHeight:1.5}}>{cliente.acaoRecomendada || 'Envie uma mensagem personalizada baseada no histórico deste cliente.'}</p>
              </div>
            </div>
          )}

          {/* Pedidos */}
          {tab==='pedidos'&&(
            <div>
              {loadPed && <div style={{display:'flex',alignItems:'center',gap:8,padding:'16px 0',color:'var(--label-4)',fontSize:12}}><RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Carregando...</div>}
              {!loadPed && pedidos.length===0 && (
                <div style={{padding:'32px 0',textAlign:'center',color:'var(--label-4)'}}>
                  <Package size={28} style={{display:'block',margin:'0 auto 10px',opacity:.2}}/>
                  <p style={{fontSize:13,margin:0}}>Histórico não disponível</p>
                </div>
              )}
              {pedidos.map((p,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid var(--sep)'}}>
                  <span style={{fontSize:12,fontWeight:600,color:'var(--accent)',fontFamily:'monospace',flexShrink:0,minWidth:60}}>#{p.numero}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,color:'var(--label)',margin:0,fontWeight:500}}>{fmtD(p.data)}</p>
                    <p style={{fontSize:11,color:'var(--label-4)',margin:0}}>{p.itens?.length||0} item{p.itens?.length!==1?'s':''}</p>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--label)',flexShrink:0}}>{R(p.total)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Mensagem */}
          {tab==='msg'&&(
            <div>
              <p style={{fontSize:12,color:'var(--label-3)',marginBottom:12,lineHeight:1.5}}>
                {cliente.telefone ? `Enviar para ${cliente.telefone}` : <span style={{color:'#ef4444'}}>⚠ Sem telefone cadastrado — mensagem não disponível</span>}
              </p>
              <textarea
                value={msg}
                onChange={e=>setMsg(e.target.value)}
                placeholder={`Olá ${(cliente.nome||'').split(' ')[0]}! ✨\n\nSentimos sua falta! Você tem um cupom especial esperando por você...`}
                rows={6}
                disabled={!cliente.telefone}
                style={{width:'100%',resize:'vertical',border:'1px solid var(--sep)',borderRadius:9,padding:'10px 12px',fontSize:13,background:'var(--fill)',color:'var(--label)',fontFamily:'inherit',outline:'none',lineHeight:1.6,boxSizing:'border-box',opacity:!cliente.telefone?.5:1}}
              />
              <div style={{display:'flex',gap:7,marginTop:8}}>
                <button onClick={enviarWA} disabled={sending||!msg.trim()||!cliente.telefone}
                  style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'10px',borderRadius:9,border:'1px solid rgba(37,211,102,.3)',background:'rgba(37,211,102,.07)',color:'#25D366',cursor:(msg.trim()&&cliente.telefone)?'pointer':'not-allowed',fontSize:13,fontWeight:700,opacity:(!msg.trim()||!cliente.telefone)?.5:1}}>
                  {sent?<><CheckCircle size={14}/> Enviado!</>:sending?<><RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Enviando...</>:<><MessageSquare size={14}/> Enviar no WhatsApp</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}


// ── Modal de Configurações ────────────────────────────────────────────────────
function ConfigModal({ config, onSave, onClose }) {
  const [cfg, setCfg] = useState(config || {
    analises: {
      vip_sumido:         { ativo:true,  dias:35,   label:'VIP sem comprar' },
      primeira_compra:    { ativo:true,  dias:20,   label:'1ª compra sem retorno' },
      ciclo_recompra:     { ativo:true,  margem:80, label:'Ciclo de recompra' },
      produto_alta:       { ativo:true,  min:3,     label:'Produto em alta' },
      estoque_critico:    { ativo:true,  limite:10, label:'Estoque crítico' },
      avise_me:           { ativo:true,              label:'Produto voltou ao estoque' },
      entregue_semfeedback:{ativo:true,  dias:7,    label:'Entregue sem avaliação' },
      rastreio_parado:    { ativo:true,  dias:5,    label:'Rastreio sem movimento' },
      ocorrencia_pendente:{ ativo:true,  horas:48,  label:'Ocorrência sem resolução' },
    },
    segmentos: {
      dias_risco:   30,
      dias_perdido: 90,
      vip_min_pedidos: 3,
      vip_min_valor: 500,
    },
    job_frequencia: '4h',
    canais_excluidos: [],
  })

  const toggle = (key) => setCfg(p => ({
    ...p, analises: { ...p.analises, [key]: { ...p.analises[key], ativo: !p.analises[key].ativo } }
  }))

  const setParam = (key, param, val) => setCfg(p => ({
    ...p, analises: { ...p.analises, [key]: { ...p.analises[key], [param]: val } }
  }))

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:60,backdropFilter:'blur(4px)'}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:580,maxHeight:'80vh',zIndex:70,background:'var(--bg-2)',borderRadius:16,border:'1px solid var(--sep)',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 32px 80px rgba(0,0,0,.35)'}}>
        {/* Header */}
        <div style={{padding:'18px 24px',borderBottom:'1px solid var(--sep)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,borderRadius:9,background:'rgba(124,106,247,.12)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <SlidersHorizontal size={16} style={{color:'#7c6af7'}}/>
            </div>
            <div>
              <p style={{fontSize:15,fontWeight:700,color:'var(--label)',margin:0}}>Configurações da Inteligência</p>
              <p style={{fontSize:11.5,color:'var(--label-4)',margin:0}}>Controle quais análises a Bia executa</p>
            </div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-4)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <X size={13}/>
          </button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>

          {/* Análises automáticas */}
          <p style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',marginBottom:12}}>Análises automáticas</p>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
            {Object.entries(cfg.analises).map(([key, analise])=>{
              const tipo = key.includes('estoque')||key.includes('avise') ? 'estoque'
                : key.includes('rastreio')||key.includes('entregue')||key.includes('ocorrencia') ? 'posVenda'
                : key.includes('produto') ? 'oportunidade' : 'urgente'
              const t = TIPO_SUGESTAO[tipo] || TIPO_SUGESTAO.oportunidade
              const Icon = t.Icon
              return (
                <div key={key} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 13px',borderRadius:10,background:analise.ativo?`${t.cor}05`:'var(--fill)',border:`1px solid ${analise.ativo?t.cor+'25':'var(--sep)'}`,transition:'all .2s'}}>
                  <div style={{width:30,height:30,borderRadius:8,background:`${t.cor}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Icon size={14} style={{color:t.cor}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:600,color:'var(--label)',margin:'0 0 2px'}}>{analise.label}</p>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      {analise.dias!==undefined&&<span style={{fontSize:11.5,color:'var(--label-4)'}}>Alertar após <input type="number" value={analise.dias} onChange={e=>setParam(key,'dias',Number(e.target.value))} style={{width:40,textAlign:'center',border:'1px solid var(--sep)',borderRadius:5,padding:'1px 4px',fontSize:11.5,background:'var(--fill)',color:'var(--label)'}} /> dias</span>}
                      {analise.horas!==undefined&&<span style={{fontSize:11.5,color:'var(--label-4)'}}>Alertar após <input type="number" value={analise.horas} onChange={e=>setParam(key,'horas',Number(e.target.value))} style={{width:40,textAlign:'center',border:'1px solid var(--sep)',borderRadius:5,padding:'1px 4px',fontSize:11.5,background:'var(--fill)',color:'var(--label)'}} /> horas</span>}
                      {analise.limite!==undefined&&<span style={{fontSize:11.5,color:'var(--label-4)'}}>Alertar abaixo de <input type="number" value={analise.limite} onChange={e=>setParam(key,'limite',Number(e.target.value))} style={{width:40,textAlign:'center',border:'1px solid var(--sep)',borderRadius:5,padding:'1px 4px',fontSize:11.5,background:'var(--fill)',color:'var(--label)'}} /> unidades</span>}
                      {analise.min!==undefined&&<span style={{fontSize:11.5,color:'var(--label-4)'}}>Mínimo <input type="number" value={analise.min} onChange={e=>setParam(key,'min',Number(e.target.value))} style={{width:40,textAlign:'center',border:'1px solid var(--sep)',borderRadius:5,padding:'1px 4px',fontSize:11.5,background:'var(--fill)',color:'var(--label)'}} /> clientes</span>}
                    </div>
                  </div>
                  {/* Toggle */}
                  <button onClick={()=>toggle(key)} style={{width:40,height:22,borderRadius:99,border:'none',cursor:'pointer',background:analise.ativo?'#22c55e':'var(--sep)',position:'relative',flexShrink:0,transition:'background .2s'}}>
                    <div style={{width:16,height:16,borderRadius:'50%',background:'white',position:'absolute',top:3,left:analise.ativo?21:3,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}/>
                  </button>
                </div>
              )
            })}
          </div>

          {/* Critérios de segmentação */}
          <p style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',marginBottom:12}}>Critérios de segmentação</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
            {[
              {label:'Dias para "Em risco"',    key:'dias_risco',     unit:'dias'},
              {label:'Dias para "Perdido"',     key:'dias_perdido',   unit:'dias'},
              {label:'Pedidos mínimos p/ VIP',  key:'vip_min_pedidos',unit:'pedidos'},
              {label:'Valor mínimo p/ VIP',     key:'vip_min_valor',  unit:'R$'},
            ].map(f=>(
              <div key={f.key} style={{padding:'10px 12px',borderRadius:9,background:'var(--fill)',border:'1px solid var(--sep)'}}>
                <p style={{fontSize:11,color:'var(--label-4)',margin:'0 0 5px'}}>{f.label}</p>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <input type="number" value={cfg.segmentos[f.key]||0}
                    onChange={e=>setCfg(p=>({...p,segmentos:{...p.segmentos,[f.key]:Number(e.target.value)}}))}
                    style={{flex:1,border:'1px solid var(--sep)',borderRadius:6,padding:'4px 8px',fontSize:13,fontWeight:600,background:'var(--bg)',color:'var(--label)',textAlign:'center'}}/>
                  <span style={{fontSize:11,color:'var(--label-4)',flexShrink:0}}>{f.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Frequência do job */}
          <p style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',marginBottom:8}}>Frequência da análise automática</p>
          <div style={{display:'flex',gap:7,marginBottom:20}}>
            {['1h','2h','4h','8h','24h'].map(f=>(
              <button key={f} onClick={()=>setCfg(p=>({...p,job_frequencia:f}))} style={{flex:1,padding:'7px',borderRadius:8,border:`1px solid ${cfg.job_frequencia===f?'var(--accent)':'var(--sep)'}`,background:cfg.job_frequencia===f?'var(--accent-dim)':'transparent',color:cfg.job_frequencia===f?'var(--accent)':'var(--label-4)',cursor:'pointer',fontSize:12.5,fontWeight:cfg.job_frequencia===f?700:400}}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:'14px 24px',borderTop:'1px solid var(--sep)',display:'flex',gap:8,flexShrink:0}}>
          <button onClick={onClose} style={{flex:1,padding:'10px',borderRadius:9,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-3)',cursor:'pointer',fontSize:13,fontWeight:500}}>
            Cancelar
          </button>
          <button onClick={()=>onSave(cfg)} style={{flex:2,padding:'10px',borderRadius:9,border:'none',background:'var(--accent)',color:'white',cursor:'pointer',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
            <Check size={14}/> Salvar configurações
          </button>
        </div>
      </div>
    </>
  )
}


// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL — PageInteligencia
// ══════════════════════════════════════════════════════════════════════════════
export default function PageInteligencia({ api }) {

  // ── Estado global ──────────────────────────────────────────────────────────
  const [view,        setView]      = useState('overview')  // overview | clientes | sugestoes | config
  const [loadSug,     setLoadSug]   = useState(true)
  const [loadClientes,setLoadCli]   = useState(true)
  const [sugestoes,   setSugestoes] = useState([])
  const [clientes,    setClientes]  = useState([])
  const [stats,       setStats]     = useState(null)
  const [clienteSel,  setCltSel]    = useState(null)
  const [showConfig,  setShowCfg]   = useState(false)
  const [config,      setConfig]    = useState(null)
  const [analisando,  setAnalisando]= useState(false)
  const [ultimaAnal,  setUltimaAnal]= useState(null)

  // ── Filtros da lista de clientes ───────────────────────────────────────────
  const [segFiltro,   setSegFiltro] = useState('todos')
  const [canalFiltro, setCanalFlt]  = useState('todos')
  const [diasFiltro,  setDiasFiltro]= useState('30')
  const [busca,       setBusca]     = useState('')
  const [sortBy,      setSortBy]    = useState('dias_desc')
  const [paginaAtual, setPagina]    = useState(1)
  const POR_PAGINA = 20

  // ── Filtros de sugestões ───────────────────────────────────────────────────
  const [tipoFiltro,  setTipoFlt]   = useState('todos')
  const [dismissed,   setDismissed] = useState(new Set())

  const carregarClientes = useCallback(async () => {
    setLoadCli(true)
    try {
      const r = await fetch(`${api}/api/inteligencia/clientes?dias=${diasFiltro}&segmento=${segFiltro}&canal=${canalFiltro}`)
      if (r.ok) {
        const d = await r.json()
        setClientes(d.clientes || [])
        setStats(d.stats || null)
      }
    } catch {}
    setLoadCli(false)
  }, [api, diasFiltro, segFiltro, canalFiltro])

  const carregarSugestoes = useCallback(async () => {
    setLoadSug(true)
    try {
      const r = await fetch(`${api}/api/inteligencia/sugestoes`)
      if (r.ok) {
        const d = await r.json()
        setSugestoes(d.sugestoes || [])
        setUltimaAnal(d.ultima_analise)
      }
    } catch {}
    setLoadSug(false)
  }, [api])

  const carregarConfig = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/inteligencia/config`)
      if (r.ok) { const d = await r.json(); setConfig(d.config) }
    } catch {}
  }, [api])

  useEffect(() => { carregarClientes() }, [carregarClientes])
  useEffect(() => { carregarSugestoes(); carregarConfig() }, [carregarSugestoes, carregarConfig])

  const analisarAgora = async () => {
    setAnalisando(true)
    try {
      await fetch(`${api}/api/inteligencia/analisar`, { method:'POST' })
      await Promise.all([carregarSugestoes(), carregarClientes()])
    } catch {}
    setAnalisando(false)
  }

  const salvarConfig = async (novaCfg) => {
    try {
      await fetch(`${api}/api/inteligencia/config`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ config: novaCfg })
      })
      setConfig(novaCfg)
      setShowCfg(false)
      analisarAgora()
    } catch {}
  }

  const dispensarSugestao = (id) => setDismissed(p => new Set([...p, id]))

  const dispararLote = async (clientesFiltrados) => {
    const selecionados = clientesFiltrados.filter(c => c.telefone)
    if (!selecionados.length) return
    if (!confirm(`Enviar mensagem de reengajamento para ${selecionados.length} clientes?`)) return
    try {
      await fetch(`${api}/api/inteligencia/disparar-lote`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ clientes: selecionados.map(c=>({telefone:c.telefone, nome:c.nome, segmento:c.segmento})) })
      })
      alert(`Disparo agendado para ${selecionados.length} clientes`)
    } catch {}
  }

  // ── Dados derivados ────────────────────────────────────────────────────────
  const sugestoesFiltradas = sugestoes.filter(s =>
    !dismissed.has(s.id) &&
    (tipoFiltro === 'todos' || s.tipo === tipoFiltro)
  )

  const clientesFiltrados = clientes.filter(c => {
    if (segFiltro !== 'todos' && c.segmento !== segFiltro) return false
    if (canalFiltro !== 'todos' && c.canal !== canalFiltro) return false
    if (busca && !c.nome?.toLowerCase().includes(busca.toLowerCase()) &&
        !c.telefone?.includes(busca)) return false
    return true
  }).sort((a,b) => {
    if (sortBy==='dias_desc') return (b.diasSemComprar||0)-(a.diasSemComprar||0)
    if (sortBy==='dias_asc')  return (a.diasSemComprar||0)-(b.diasSemComprar||0)
    if (sortBy==='valor_desc') return (b.totalGasto||0)-(a.totalGasto||0)
    if (sortBy==='ticket_desc') return (b.ticketMedio||0)-(a.ticketMedio||0)
    if (sortBy==='score_desc') return (b.scoreRFM||0)-(a.scoreRFM||0)
    return 0
  })

  const clientesPaginados = clientesFiltrados.slice((paginaAtual-1)*POR_PAGINA, paginaAtual*POR_PAGINA)
  const totalPaginas = Math.ceil(clientesFiltrados.length / POR_PAGINA)

  const receitaRecuperavel = clientesFiltrados.reduce((s,c) => s + (c.ticketMedio||0), 0)

  // ── Distribuição por segmento ──────────────────────────────────────────────
  const distSeg = Object.entries(SEG).map(([key,s])=>({
    ...s, key,
    count: clientes.filter(c=>c.segmento===key).length,
    total: clientes.length,
  })).filter(s=>s.count>0).sort((a,b)=>b.count-a.count)

  const urgentesCount = sugestoesFiltradas.filter(s=>s.prioridade==='alta').length


  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',color:'var(--label)'}}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .bia-row:hover { background: var(--fill) !important; }
        .bia-row { transition: background .1s; }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{background:'var(--bg-2)',borderBottom:'1px solid var(--sep)',padding:'16px 24px',position:'sticky',top:0,zIndex:20}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,maxWidth:1400,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:42,height:42,borderRadius:12,background:'linear-gradient(135deg,rgba(124,106,247,.2),rgba(0,212,170,.15))',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid rgba(124,106,247,.3)',flexShrink:0}}>
              <Brain size={20} style={{color:'#7c6af7'}}/>
            </div>
            <div>
              <h1 style={{fontSize:18,fontWeight:700,color:'var(--label)',margin:0,letterSpacing:'-.4px',display:'flex',alignItems:'center',gap:9}}>
                Inteligência de Clientes
                {urgentesCount > 0 && (
                  <span style={{fontSize:11,fontWeight:800,padding:'2px 8px',borderRadius:99,background:'rgba(239,68,68,.15)',color:'#ef4444',border:'1px solid rgba(239,68,68,.3)',animation:'pulse 2s infinite'}}>
                    {urgentesCount} urgente{urgentesCount!==1?'s':''}
                  </span>
                )}
              </h1>
              <p style={{fontSize:12,color:'var(--label-4)',margin:0,display:'flex',alignItems:'center',gap:6}}>
                <Radio size={10} style={{color:'#22c55e'}}/>
                {ultimaAnal ? `Última análise: ${fmtDT(ultimaAnal)}` : 'Análise automática ativa'}
                {loadSug||loadClientes ? <RefreshCw size={10} style={{color:'var(--label-4)',animation:'spin 1s linear infinite'}}/> : null}
              </p>
            </div>
          </div>

          {/* Ações do header */}
          <div style={{display:'flex',gap:7,alignItems:'center',flexShrink:0}}>
            <button onClick={()=>setShowCfg(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 13px',borderRadius:9,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-3)',cursor:'pointer',fontSize:12.5,fontWeight:500}}>
              <SlidersHorizontal size={13}/> Configurar
            </button>
            <button onClick={analisarAgora} disabled={analisando} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:9,border:'1px solid rgba(124,106,247,.3)',background:'rgba(124,106,247,.1)',color:'#7c6af7',cursor:'pointer',fontSize:12.5,fontWeight:700,opacity:analisando?.7:1}}>
              {analisando ? <><RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Analisando...</> : <><Brain size={13}/> Analisar agora</>}
            </button>
          </div>
        </div>

        {/* Tabs de navegação */}
        <div style={{display:'flex',gap:0,marginTop:14,maxWidth:1400,margin:'14px auto 0'}}>
          {[
            {id:'overview',  label:'Visão Geral', icon:BarChart3},
            {id:'sugestoes', label:`Sugestões da Bia${sugestoesFiltradas.length?` (${sugestoesFiltradas.length})`:''}`, icon:Brain},
            {id:'clientes',  label:`Clientes${clientesFiltrados.length?` (${clientesFiltrados.length})`:''}`, icon:Users},
          ].map(t=>{
            const Icon = t.icon
            return (
              <button key={t.id} onClick={()=>setView(t.id)} style={{display:'flex',alignItems:'center',gap:7,padding:'8px 16px',fontSize:12.5,border:'none',background:'transparent',cursor:'pointer',color:view===t.id?'var(--accent)':'var(--label-4)',borderBottom:`2px solid ${view===t.id?'var(--accent)':'transparent'}`,fontWeight:view===t.id?700:400,transition:'color .1s',whiteSpace:'nowrap'}}>
                <Icon size={13}/>{t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── CONTEÚDO ───────────────────────────────────────────────────────── */}
      <div style={{maxWidth:1400,margin:'0 auto',padding:'24px'}}>

        {/* ────────── VIEW: OVERVIEW ────────────────────────────────────────── */}
        {view === 'overview' && (
          <div style={{display:'flex',flexDirection:'column',gap:20}}>

            {/* KPIs principais */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {[
                { label:'Score de saúde',   value: stats?.scoreBase||0,     unit:'',   cor:'#7c6af7', sub:'da base de clientes',  big:true, ring:true },
                { label:'Clientes em risco',value: stats?.emRisco||0,       unit:'',   cor:'#f97316', sub:`${stats?.pctRisco||0}% da base` },
                { label:'Receita recuperável',value: Rk(receitaRecuperavel),unit:'',   cor:'#22c55e', sub:`${fmt(clientesFiltrados.length)} clientes inativos` },
                { label:'Sugestões ativas',  value: sugestoesFiltradas.length,unit:'', cor:'#7c6af7', sub:`${urgentesCount} urgentes` },
              ].map(k=>(
                <div key={k.label} style={{padding:'16px 18px',borderRadius:14,background:'var(--bg-2)',border:`1px solid ${k.ring?`${k.cor}30`:'var(--sep)'}`,position:'relative',overflow:'hidden'}}>
                  {k.ring && <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${k.cor},${k.cor}60)`}}/>}
                  <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',margin:'0 0 8px'}}>{k.label}</p>
                  {k.ring
                    ? <div style={{display:'flex',alignItems:'center',gap:12}}><ScoreRing score={k.value} size={52}/><div><p style={{fontSize:11.5,color:'var(--label-3)',margin:0,lineHeight:1.4}}>{k.sub}</p></div></div>
                    : <><p style={{fontSize:26,fontWeight:800,color:k.cor,margin:'0 0 3px',letterSpacing:'-1px',lineHeight:1}}>{k.value}</p><p style={{fontSize:11.5,color:'var(--label-4)',margin:0}}>{k.sub}</p></>
                  }
                </div>
              ))}
            </div>

            {/* 2 colunas: distribuição + top sugestões */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1.6fr',gap:16}}>

              {/* Distribuição de segmentos */}
              <div style={{borderRadius:14,background:'var(--bg-2)',border:'1px solid var(--sep)',overflow:'hidden'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid var(--sep)',display:'flex',alignItems:'center',gap:8}}>
                  <Layers size={13} style={{color:'var(--label-4)'}}/>
                  <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--label-4)'}}>Segmentos RFM</span>
                  <span style={{marginLeft:'auto',fontSize:12,color:'var(--label-4)'}}>{fmt(clientes.length)} clientes</span>
                </div>
                <div style={{padding:'12px 18px'}}>
                  {distSeg.length === 0 && loadClientes && (
                    <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 0',color:'var(--label-4)',fontSize:12}}>
                      <RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Carregando...
                    </div>
                  )}
                  {distSeg.map(s=>{
                    const pct = s.total > 0 ? Math.round((s.count/s.total)*100) : 0
                    const Icon = s.Icon
                    return (
                      <div key={s.key} onClick={()=>{setSegFiltro(s.key);setView('clientes')}}
                        className="bia-row"
                        style={{display:'flex',alignItems:'center',gap:10,padding:'9px 8px',borderRadius:8,cursor:'pointer',marginBottom:3}}>
                        <div style={{width:28,height:28,borderRadius:8,background:`${s.cor}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <Icon size={13} style={{color:s.cor}}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                            <span style={{fontSize:12.5,fontWeight:600,color:'var(--label)'}}>{s.label}</span>
                            <span style={{fontSize:12,color:'var(--label-4)'}}>{fmt(s.count)}</span>
                          </div>
                          <ProgressBar value={s.count} max={s.total} cor={s.cor}/>
                        </div>
                        <span style={{fontSize:11,fontWeight:700,color:s.cor,minWidth:30,textAlign:'right'}}>{pct}%</span>
                        <ChevronRight size={11} style={{color:'var(--label-4)',flexShrink:0}}/>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Top 3 sugestões urgentes */}
              <div style={{borderRadius:14,background:'var(--bg-2)',border:'1px solid var(--sep)',overflow:'hidden'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid var(--sep)',display:'flex',alignItems:'center',gap:8}}>
                  <Brain size={13} style={{color:'#7c6af7'}}/>
                  <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--label-4)'}}>Sugestões prioritárias</span>
                  <button onClick={()=>setView('sugestoes')} style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,fontSize:12,color:'var(--accent)',background:'transparent',border:'none',cursor:'pointer',fontWeight:600}}>
                    Ver todas <ArrowRight size={11}/>
                  </button>
                </div>
                <div style={{padding:'12px 18px',display:'flex',flexDirection:'column',gap:10}}>
                  {loadSug && <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 0',color:'var(--label-4)',fontSize:12}}><RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Carregando análises...</div>}
                  {!loadSug && sugestoesFiltradas.length === 0 && (
                    <div style={{padding:'24px 0',textAlign:'center'}}>
                      <CheckCircle size={28} style={{display:'block',margin:'0 auto 10px',color:'#22c55e',opacity:.5}}/>
                      <p style={{fontSize:13,color:'var(--label-3)',margin:'0 0 4px',fontWeight:500}}>Tudo em dia!</p>
                      <p style={{fontSize:12,color:'var(--label-4)',margin:0}}>Nenhuma ação necessária no momento</p>
                    </div>
                  )}
                  {sugestoesFiltradas.slice(0,3).map(sug=>(
                    <BiaCard key={sug.id} sug={sug} api={api} onDismiss={dispensarSugestao} onAction={()=>{}}/>
                  ))}
                  {sugestoesFiltradas.length > 3 && (
                    <button onClick={()=>setView('sugestoes')} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'9px',borderRadius:9,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-4)',cursor:'pointer',fontSize:12.5}}>
                      Ver mais {sugestoesFiltradas.length - 3} sugestões <ArrowRight size={12}/>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Linha de métricas de comportamento */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {[
                { label:'Tempo médio entre compras', value:`${stats?.cicloMedio||0} dias`,      sub:'média da base',           Icon:Clock,  cor:'#4a9fff' },
                { label:'Taxa de retenção (90d)',    value:`${stats?.taxaRetencao||0}%`,         sub:'compraram novamente',     Icon:Repeat, cor:'#22c55e' },
                { label:'Clientes com ciclo regular',value:`${stats?.clientesCiclo||0}`,         sub:'padrão de recompra',      Icon:Activity,cor:'#7c6af7' },
              ].map(m=>{
                const Icon = m.Icon
                return (
                  <div key={m.label} style={{padding:'14px 16px',borderRadius:12,background:'var(--bg-2)',border:'1px solid var(--sep)',display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:40,height:40,borderRadius:10,background:`${m.cor}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <Icon size={18} style={{color:m.cor}}/>
                    </div>
                    <div>
                      <p style={{fontSize:18,fontWeight:800,color:m.cor,margin:'0 0 2px',letterSpacing:'-.5px',lineHeight:1}}>{m.value}</p>
                      <p style={{fontSize:11,color:'var(--label-4)',margin:'0 0 1px',textTransform:'uppercase',letterSpacing:'.06em'}}>{m.label}</p>
                      <p style={{fontSize:11.5,color:'var(--label-3)',margin:0}}>{m.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}


        {/* ────────── VIEW: SUGESTÕES ─────────────────────────────────────── */}
        {view === 'sugestoes' && (
          <div>
            {/* Toolbar */}
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,flexWrap:'wrap'}}>
              <div style={{display:'flex',gap:6}}>
                {[{id:'todos',l:'Todas'}, ...Object.entries(TIPO_SUGESTAO).map(([id,t])=>({id,l:t.label}))].map(f=>(
                  <button key={f.id} onClick={()=>setTipoFlt(f.id)} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:99,border:`1px solid ${tipoFiltro===f.id?'var(--accent)':'var(--sep)'}`,background:tipoFiltro===f.id?'var(--accent-dim)':'transparent',color:tipoFiltro===f.id?'var(--accent)':'var(--label-4)',cursor:'pointer',fontSize:12,fontWeight:tipoFiltro===f.id?700:400,whiteSpace:'nowrap'}}>
                    {f.l}
                    {f.id!=='todos'&&<span style={{fontSize:10,padding:'0 4px',borderRadius:99,background:`${tipoFiltro===f.id?'var(--accent)':'var(--sep)'}40`}}>
                      {sugestoes.filter(s=>!dismissed.has(s.id)&&s.tipo===f.id).length}
                    </span>}
                  </button>
                ))}
              </div>
              <span style={{marginLeft:'auto',fontSize:12,color:'var(--label-4)'}}>
                {sugestoesFiltradas.length} sugestões
              </span>
            </div>

            {loadSug && (
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,padding:'60px 0',color:'var(--label-4)'}}>
                <RefreshCw size={18} style={{animation:'spin 1s linear infinite',color:'#7c6af7'}}/>
                <span style={{fontSize:14}}>Analisando padrões...</span>
              </div>
            )}

            {!loadSug && sugestoesFiltradas.length === 0 && (
              <div style={{padding:'80px 0',textAlign:'center'}}>
                <div style={{width:64,height:64,borderRadius:20,background:'rgba(124,106,247,.1)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                  <CheckCircle size={28} style={{color:'#7c6af7'}}/>
                </div>
                <p style={{fontSize:16,fontWeight:600,color:'var(--label)',margin:'0 0 6px'}}>Nenhuma sugestão pendente</p>
                <p style={{fontSize:13,color:'var(--label-4)',margin:'0 0 20px'}}>Sua base de clientes está saudável!</p>
                <button onClick={analisarAgora} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 18px',borderRadius:10,border:'1px solid rgba(124,106,247,.3)',background:'rgba(124,106,247,.1)',color:'#7c6af7',cursor:'pointer',fontSize:13,fontWeight:600}}>
                  <Brain size={14}/> Analisar novamente
                </button>
              </div>
            )}

            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {sugestoesFiltradas.map((sug,i)=>(
                <div key={sug.id} style={{animation:`fadeIn .3s ease ${i*.05}s both`}}>
                  <BiaCard sug={sug} api={api} onDismiss={dispensarSugestao} onAction={()=>{}}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ────────── VIEW: CLIENTES ──────────────────────────────────────── */}
        {view === 'clientes' && (
          <div>
            {/* Toolbar de filtros */}
            <div style={{background:'var(--bg-2)',borderRadius:12,border:'1px solid var(--sep)',padding:'14px 16px',marginBottom:16}}>
              {/* Linha 1: busca + sort */}
              <div style={{display:'flex',gap:10,marginBottom:12}}>
                <div style={{flex:1,display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:9,border:'1px solid var(--sep)',background:'var(--fill)'}}>
                  <Search size={14} style={{color:'var(--label-4)',flexShrink:0}}/>
                  <input value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1)}} placeholder="Buscar cliente ou telefone..." style={{flex:1,border:'none',background:'transparent',color:'var(--label)',fontSize:13,outline:'none'}}/>
                  {busca && <button onClick={()=>setBusca('')} style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--label-4)',padding:0,display:'flex'}}><X size={13}/></button>}
                </div>
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:'8px 12px',borderRadius:9,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:12.5,cursor:'pointer',outline:'none'}}>
                  <option value="dias_desc">Mais tempo sem comprar</option>
                  <option value="dias_asc">Comprou mais recentemente</option>
                  <option value="valor_desc">Maior gasto total</option>
                  <option value="ticket_desc">Maior ticket médio</option>
                  <option value="score_desc">Maior score RFM</option>
                </select>
              </div>
              {/* Linha 2: chips de filtro */}
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {/* Segmento */}
                <div style={{display:'flex',gap:5,alignItems:'center'}}>
                  <span style={{fontSize:11,color:'var(--label-4)',fontWeight:600}}>Segmento:</span>
                  {[{id:'todos',l:'Todos'}, ...Object.entries(SEG).map(([id,s])=>({id,l:s.label,cor:s.cor}))].map(f=>(
                    <button key={f.id} onClick={()=>{setSegFiltro(f.id);setPagina(1)}} style={{padding:'4px 10px',borderRadius:99,border:`1px solid ${segFiltro===f.id?(f.cor||'var(--accent)'):'var(--sep)'}`,background:segFiltro===f.id?`${f.cor||'var(--accent)'}15`:'transparent',color:segFiltro===f.id?(f.cor||'var(--accent)'):'var(--label-4)',cursor:'pointer',fontSize:11.5,fontWeight:segFiltro===f.id?700:400}}>
                      {f.l}
                    </button>
                  ))}
                </div>
              </div>
              {/* Linha 3: dias + canal */}
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:9}}>
                <div style={{display:'flex',gap:5,alignItems:'center'}}>
                  <span style={{fontSize:11,color:'var(--label-4)',fontWeight:600}}>Sem comprar:</span>
                  {[{v:'15',l:'+15d'},{v:'30',l:'+30d'},{v:'60',l:'+60d'},{v:'90',l:'+90d'},{v:'120',l:'+120d'}].map(f=>(
                    <button key={f.v} onClick={()=>{setDiasFiltro(f.v);carregarClientes();setPagina(1)}} style={{padding:'4px 10px',borderRadius:99,border:`1px solid ${diasFiltro===f.v?'var(--accent)':'var(--sep)'}`,background:diasFiltro===f.v?'var(--accent-dim)':'transparent',color:diasFiltro===f.v?'var(--accent)':'var(--label-4)',cursor:'pointer',fontSize:11.5,fontWeight:diasFiltro===f.v?700:400}}>
                      {f.l}
                    </button>
                  ))}
                </div>
                <div style={{display:'flex',gap:5,alignItems:'center',marginLeft:8}}>
                  <span style={{fontSize:11,color:'var(--label-4)',fontWeight:600}}>Canal:</span>
                  {[{id:'todos',l:'Todos'}, ...Object.keys(CANAL).map(id=>({id,l:CANAL[id].label}))].map(f=>(
                    <button key={f.id} onClick={()=>{setCanalFlt(f.id);setPagina(1)}} style={{padding:'4px 10px',borderRadius:99,border:`1px solid ${canalFiltro===f.id?'var(--accent)':'var(--sep)'}`,background:canalFiltro===f.id?'var(--accent-dim)':'transparent',color:canalFiltro===f.id?'var(--accent)':'var(--label-4)',cursor:'pointer',fontSize:11.5,fontWeight:canalFiltro===f.id?700:400}}>
                      {f.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cabeçalho da lista + ações em lote */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,padding:'0 4px'}}>
              <span style={{fontSize:12.5,color:'var(--label-4)'}}>
                {loadClientes ? <><RefreshCw size={12} style={{animation:'spin 1s linear infinite',marginRight:6}}/> Carregando...</>
                  : `${fmt(clientesFiltrados.length)} clientes · receita recuperável estimada ${Rk(receitaRecuperavel)}`
                }
              </span>
              {clientesFiltrados.filter(c=>c.telefone).length > 0 && (
                <button onClick={()=>dispararLote(clientesFiltrados)} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:9,border:'1px solid rgba(37,211,102,.3)',background:'rgba(37,211,102,.06)',color:'#25D366',cursor:'pointer',fontSize:12,fontWeight:700}}>
                  <Send size={12}/> Disparar para {fmt(clientesFiltrados.filter(c=>c.telefone).length)} com telefone
                </button>
              )}
            </div>

            {/* Tabela de clientes */}
            <div style={{borderRadius:12,border:'1px solid var(--sep)',overflow:'hidden',background:'var(--bg-2)'}}>
              {/* Header */}
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr 100px',gap:0,padding:'9px 16px',borderBottom:'1px solid var(--sep)',background:'var(--fill)'}}>
                {['Cliente','Segmento','Canal','Sem comprar','LTV','Ticket médio','Ação'].map(h=>(
                  <span key={h} style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--label-4)',paddingRight:8}}>{h}</span>
                ))}
              </div>

              {loadClientes && !clientes.length && (
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'48px',color:'var(--label-4)'}}>
                  <RefreshCw size={16} style={{animation:'spin 1s linear infinite',color:'#7c6af7'}}/> <span style={{fontSize:13}}>Carregando clientes...</span>
                </div>
              )}

              {!loadClientes && clientesPaginados.length === 0 && (
                <div style={{padding:'48px',textAlign:'center',color:'var(--label-4)'}}>
                  <Users size={28} style={{display:'block',margin:'0 auto 12px',opacity:.2}}/>
                  <p style={{fontSize:14,margin:0,color:'var(--label-3)'}}>Nenhum cliente encontrado</p>
                  <p style={{fontSize:12,margin:'6px 0 0',opacity:.7}}>Tente ajustar os filtros</p>
                </div>
              )}

              {clientesPaginados.map((c,i)=>{
                const s   = SEG[c.segmento] || SEG.regular
                const SIcon = s.Icon
                const corDias = c.diasSemComprar > 60 ? '#ef4444' : c.diasSemComprar > 30 ? '#f97316' : '#22c55e'
                return (
                  <div key={i} className="bia-row"
                    style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr 100px',gap:0,padding:'11px 16px',borderBottom:'1px solid var(--sep)',cursor:'pointer',alignItems:'center'}}
                    onClick={()=>setCltSel(c)}>

                    {/* Nome */}
                    <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0,paddingRight:8}}>
                      <Avatar nome={c.nome} size={32}/>
                      <div style={{minWidth:0}}>
                        <p style={{fontSize:13,fontWeight:600,color:'var(--label)',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.nome||'—'}</p>
                        {c.telefone && <p style={{fontSize:11,color:'var(--label-4)',margin:0,fontFamily:'monospace'}}>{c.telefone}</p>}
                      </div>
                    </div>

                    {/* Segmento */}
                    <div style={{paddingRight:8}}><SegChip seg={c.segmento}/></div>

                    {/* Canal */}
                    <div style={{paddingRight:8}}>{c.canal && <CanalChip canal={c.canal}/>}</div>

                    {/* Dias */}
                    <div style={{paddingRight:8}}>
                      <span style={{fontSize:13,fontWeight:700,color:corDias}}>{c.diasSemComprar||0}d</span>
                      {c.cicloDias > 0 && c.diasSemComprar >= c.cicloDias*.8 && (
                        <span style={{display:'block',fontSize:10,color:'#f97316'}}>⚡ hora de recomprar</span>
                      )}
                    </div>

                    {/* LTV */}
                    <span style={{fontSize:13,fontWeight:600,color:'var(--label)',paddingRight:8}}>{Rk(c.totalGasto||0)}</span>

                    {/* Ticket */}
                    <div style={{paddingRight:8}}>
                      <span style={{fontSize:13,color:'var(--label-3)'}}>{Rk(c.ticketMedio||0)}</span>
                      {c.scoreRFM > 0 && <Sparkline data={c.historicoPedidos||[]} cor={s.cor} height={16} width={50}/>}
                    </div>

                    {/* Ação */}
                    <button
                      onClick={e=>{e.stopPropagation();setCltSel(c)}}
                      style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:7,border:`1px solid ${s.cor}30`,background:`${s.cor}10`,color:s.cor,cursor:'pointer',fontSize:11.5,fontWeight:600}}>
                      <MessageSquare size={11}/> Contatar
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,marginTop:16}}>
                <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={paginaAtual===1}
                  style={{padding:'6px 12px',borderRadius:8,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-3)',cursor:paginaAtual===1?'not-allowed':'pointer',opacity:paginaAtual===1?.4:1,fontSize:12}}>
                  ←
                </button>
                {Array.from({length:Math.min(7,totalPaginas)},(_, i)=>{
                  const p = i+1
                  return (
                    <button key={p} onClick={()=>setPagina(p)}
                      style={{padding:'6px 11px',borderRadius:8,border:`1px solid ${paginaAtual===p?'var(--accent)':'var(--sep)'}`,background:paginaAtual===p?'var(--accent-dim)':'transparent',color:paginaAtual===p?'var(--accent)':'var(--label-3)',cursor:'pointer',fontSize:12,fontWeight:paginaAtual===p?700:400}}>
                      {p}
                    </button>
                  )
                })}
                {totalPaginas > 7 && <span style={{color:'var(--label-4)',fontSize:12}}>... {totalPaginas}</span>}
                <button onClick={()=>setPagina(p=>Math.min(totalPaginas,p+1))} disabled={paginaAtual===totalPaginas}
                  style={{padding:'6px 12px',borderRadius:8,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-3)',cursor:paginaAtual===totalPaginas?'not-allowed':'pointer',opacity:paginaAtual===totalPaginas?.4:1,fontSize:12}}>
                  →
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── MODAIS ─────────────────────────────────────────────────────────── */}
      {clienteSel && <ClienteSheet cliente={clienteSel} onClose={()=>setCltSel(null)} api={api}/>}
      {showConfig  && <ConfigModal config={config} onSave={salvarConfig} onClose={()=>setShowCfg(false)}/>}

    </div>
  )
}

