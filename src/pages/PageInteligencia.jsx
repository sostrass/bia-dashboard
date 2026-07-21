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
// Aceita 'YYYY-MM-DD' E ISO completo ('...T00:00:00.000Z' — como o pg serializa
// DATE via JSON). O +'T12:00:00' cego gerava "Invalid Date" com ISO.
const fmtD  = d => {
  if (!d) return '—'
  const s = String(d).slice(0,10)
  const dt = new Date(s+'T12:00:00')
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})
}
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


// ── Painel de Campanhas (gestao do motor) ─────────────────────────────────────
// UI da fila: progresso ao vivo, pausar/retomar/cancelar. Poll de 5s enquanto
// houver campanha rodando — a fila e do servidor, a tela so observa.
function CampanhasPanel({ api }) {
  const [lista,   setLista]   = useState(null)
  const [agindo,  setAgindo]  = useState(0)

  const carregar = useCallback(()=>{
    fetch(`${api}/api/inteligencia/campanhas`).then(r=>r.json())
      .then(d=>setLista(Array.isArray(d)?d:[])).catch(()=>setLista([]))
  },[api])

  useEffect(()=>{
    carregar()
    const t = setInterval(carregar, 5000)
    return ()=>clearInterval(t)
  },[carregar])

  const acao = async (id, verbo) => {
    setAgindo(id)
    try { await fetch(`${api}/api/inteligencia/campanhas/${id}/${verbo}`,{method:'POST'}); carregar() } catch{}
    setAgindo(0)
  }

  const COR = { rodando:'#25D366', pausada:'#f59e0b', concluida:'#7c6af7', cancelada:'#6b7280' }

  if (lista===null) return <p style={{fontSize:12.5,color:'var(--label-4)',padding:'32px 0',textAlign:'center'}}>Carregando campanhas...</p>
  if (!lista.length) return (
    <div style={{textAlign:'center',padding:'56px 20px',color:'var(--label-4)'}}>
      <Send size={30} style={{opacity:.25}}/>
      <p style={{fontSize:14,fontWeight:700,color:'var(--label-3)',margin:'12px 0 6px'}}>Nenhuma campanha ainda</p>
      <p style={{fontSize:12.5,margin:0,lineHeight:1.6}}>Monte a audiência na aba <strong>Clientes</strong> (filtros de segmento/canal/dias)<br/>e clique em "Criar campanha com estes filtros".</p>
    </div>
  )

  return (
    <div>
      {lista.map(c=>{
        const done = (c.enviados||0)+(c.erros||0)
        const alvo = Math.max(1,(c.total||0)-(c.pulados||0))
        const pct  = Math.min(100, Math.round(done/alvo*100))
        const cor  = COR[c.status]||'#6b7280'
        return (
          <div key={c.id} style={{borderRadius:13,border:`1px solid ${c.status==='rodando'?cor+'40':'var(--sep)'}`,background:'var(--bg-2)',padding:'14px 18px',marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:10}}>
              <div style={{minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:3}}>
                  <span style={{fontSize:14.5,fontWeight:800,color:'var(--label)'}}>#{c.id} · {c.nome}</span>
                  <span style={{fontSize:10.5,fontWeight:800,textTransform:'uppercase',letterSpacing:'.05em',color:cor,background:cor+'14',border:`1px solid ${cor}30`,padding:'2px 8px',borderRadius:99}}>{c.status}</span>
                </div>
                <p style={{fontSize:11.5,color:'var(--label-4)',margin:0}}>
                  template <strong style={{color:'var(--label-3)'}}>{c.gatilho}</strong> · {c.ritmo_seg}s/envio · janela {c.janela_ini}h–{c.janela_fim}h · criada {String(c.criado_em).slice(0,10)}
                </p>
              </div>
              <div style={{display:'flex',gap:7,flexShrink:0}}>
                {c.status==='rodando' && <button disabled={agindo===c.id} onClick={()=>acao(c.id,'pausar')}  style={{padding:'6px 13px',borderRadius:8,border:'1px solid rgba(245,158,11,.35)',background:'rgba(245,158,11,.07)',color:'#f59e0b',cursor:'pointer',fontSize:11.5,fontWeight:700}}>Pausar</button>}
                {c.status==='pausada' && <button disabled={agindo===c.id} onClick={()=>acao(c.id,'retomar')} style={{padding:'6px 13px',borderRadius:8,border:'1px solid rgba(37,211,102,.35)',background:'rgba(37,211,102,.07)',color:'#25D366',cursor:'pointer',fontSize:11.5,fontWeight:700}}>Retomar</button>}
                {['rodando','pausada'].includes(c.status) && <button disabled={agindo===c.id} onClick={()=>{ if(confirm(`Cancelar a campanha #${c.id}? Os pendentes não serão enviados.`)) acao(c.id,'cancelar') }} style={{padding:'6px 13px',borderRadius:8,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-4)',cursor:'pointer',fontSize:11.5,fontWeight:700}}>Cancelar</button>}
              </div>
            </div>

            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{flex:1,height:9,background:'var(--sep)',borderRadius:99,overflow:'hidden'}}>
                <div style={{width:`${pct}%`,height:'100%',background:`linear-gradient(90deg,${cor},${cor}90)`,borderRadius:99,transition:'width .6s'}}/>
              </div>
              <span style={{fontSize:12,fontWeight:800,color:cor,width:44,textAlign:'right'}}>{pct}%</span>
            </div>
            <div style={{display:'flex',gap:16,marginTop:8,fontSize:11.5,color:'var(--label-4)',flexWrap:'wrap'}}>
              <span>✅ <strong style={{color:'var(--label-2)'}}>{(c.enviados||0).toLocaleString('pt-BR')}</strong> enviados</span>
              <span>⏳ <strong style={{color:'var(--label-2)'}}>{(c.pendentes||0).toLocaleString('pt-BR')}</strong> na fila</span>
              {c.erros>0   && <span>⚠️ <strong style={{color:'#ff4757'}}>{c.erros}</strong> erros</span>}
              {c.pulados>0 && <span>↷ <strong style={{color:'var(--label-2)'}}>{c.pulados}</strong> pulados (cooldown/blacklist)</span>}
              {c.status==='rodando' && c.pendentes>0 && (
                <span>≈ <strong style={{color:'var(--label-2)'}}>{Math.ceil(c.pendentes/(3600/c.ritmo_seg)/Math.max(1,c.janela_fim-c.janela_ini)*10)/10}</strong> dia(s) restantes</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Compositor de Campanha ────────────────────────────────────────────────────
// Substitui o "disparar para todos" cru. A audiencia e resolvida NO SERVIDOR a
// partir do filtro (o browser nunca carrega 40k clientes); o envio e uma FILA
// com ritmo + janela de horario, via template HSM da PageGatilhos — cliente
// frio esta fora da janela de 24h do WhatsApp, so template aprovado chega.
function CampanhaComposer({ api, filtro, onClose }) {
  const [preview,  setPreview]  = useState(null)
  const [gatilhos, setGatilhos] = useState([])
  const [nome,     setNome]     = useState('')
  const [gatilho,  setGatilho]  = useState('')
  const [ritmo,    setRitmo]    = useState(3)      // seg entre envios
  const [janIni,   setJanIni]   = useState(9)
  const [janFim,   setJanFim]   = useState(20)
  const [cooldown, setCooldown] = useState(7)
  const [ciente,   setCiente]   = useState(false)
  const [criando,  setCriando]  = useState(false)
  const [criada,   setCriada]   = useState(null)
  const [erro,     setErro]     = useState('')

  useEffect(()=>{
    fetch(`${api}/api/inteligencia/audiencia/preview`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({filtro, cooldownDias:cooldown})
    }).then(r=>r.json()).then(setPreview).catch(()=>{})
  },[cooldown])

  useEffect(()=>{
    fetch(`${api}/api/templates`).then(r=>r.json())
      .then(d=>{
        const ativos = (d.templates||[]).filter(t=>t.ativo)
        setGatilhos(ativos)
        const pref = ativos.find(t=>/reengaj|recuper|winback|volta/i.test(t.gatilho||t.nome||''))
        if (pref) setGatilho(pref.gatilho)
      }).catch(()=>{})
  },[])

  const enviaveis = preview ? preview.enviaveis : 0
  const msgsHora  = Math.round(3600/Math.max(1,ritmo))
  const horasJan  = Math.max(1, janFim - janIni)
  const diasEnvio = enviaveis ? (enviaveis/msgsHora/horasJan) : 0

  const criar = async () => {
    setErro(''); setCriando(true)
    try {
      const r = await fetch(`${api}/api/inteligencia/campanhas`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({nome:nome.trim(),gatilho,filtro,ritmoSeg:ritmo,janelaIni:janIni,janelaFim:janFim,cooldownDias:cooldown})
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro||'falha ao criar')
      setCriada(d)
    } catch(e){ setErro(e.message) }
    setCriando(false)
  }

  const Row = ({k,v}) => (
    <div style={{display:'flex',justifyContent:'space-between',fontSize:12.5,padding:'5px 0'}}>
      <span style={{color:'var(--label-3)'}}>{k}</span><span style={{color:'var(--label)',fontWeight:600}}>{v}</span>
    </div>
  )

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:60,background:'rgba(0,0,0,.5)',backdropFilter:'blur(2px)'}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:640,maxHeight:'88vh',zIndex:70,background:'var(--bg-2)',borderRadius:16,border:'1px solid var(--sep)',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 32px 80px rgba(0,0,0,.4)'}}>
        <div style={{height:2.5,background:'linear-gradient(90deg,#25D366,#25D36660)'}}/>
        <div style={{padding:'16px 22px 12px',borderBottom:'1px solid var(--sep)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <p style={{fontSize:16,fontWeight:800,color:'var(--label)',margin:0}}>Nova campanha</p>
            <p style={{fontSize:11.5,color:'var(--label-4)',margin:'3px 0 0'}}>Fila com ritmo controlado · templates aprovados da página de Gatilhos</p>
          </div>
          <button onClick={onClose} style={{background:'transparent',border:'none',color:'var(--label-4)',cursor:'pointer',fontSize:18}}>×</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'16px 22px'}}>
          {criada ? (
            <div style={{textAlign:'center',padding:'28px 10px'}}>
              <p style={{fontSize:34,margin:0}}>📣</p>
              <p style={{fontSize:16,fontWeight:800,color:'var(--label)',margin:'10px 0 6px'}}>Campanha #{criada.id} criada e rodando</p>
              <p style={{fontSize:13,color:'var(--label-3)',margin:0,lineHeight:1.6}}>
                {criada.pendentes} na fila · {criada.pulados} pulados (cooldown/blacklist)<br/>
                ~{msgsHora}/h dentro da janela {janIni}h–{janFim}h → ≈ <strong>{Math.ceil(diasEnvio||1)} dia(s)</strong> de envio.<br/>
                Sobrevive a restart; pause quando quiser em Campanhas.
              </p>
              <button onClick={onClose} style={{marginTop:18,padding:'9px 22px',borderRadius:10,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',cursor:'pointer',fontSize:13,fontWeight:700}}>Fechar</button>
            </div>
          ) : (
          <>
            {/* Audiência */}
            <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',margin:'0 0 8px'}}>Audiência (filtros atuais)</p>
            <div style={{borderRadius:12,border:'1px solid var(--sep)',background:'var(--fill)',padding:'12px 14px',marginBottom:16}}>
              {!preview ? <p style={{fontSize:12,color:'var(--label-4)',margin:0}}>Calculando audiência...</p> : (
                <>
                  <div style={{display:'flex',gap:18,marginBottom:10}}>
                    <div><p style={{fontSize:21,fontWeight:800,color:'#25D366',margin:0}}>{preview.enviaveis?.toLocaleString('pt-BR')}</p><p style={{fontSize:10.5,color:'var(--label-4)',margin:0}}>receberão</p></div>
                    <div><p style={{fontSize:21,fontWeight:800,color:'var(--label-3)',margin:0}}>{preview.em_cooldown?.toLocaleString('pt-BR')}</p><p style={{fontSize:10.5,color:'var(--label-4)',margin:0}}>em cooldown</p></div>
                    <div><p style={{fontSize:21,fontWeight:800,color:'#f59e0b',margin:0}}>R$ {Number(preview.receita_estimada||0).toLocaleString('pt-BR',{maximumFractionDigits:0})}</p><p style={{fontSize:10.5,color:'var(--label-4)',margin:0}}>receita estimada</p></div>
                  </div>
                  {(preview.por_segmento||[]).map(s=>(
                    <div key={s.segmento} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:11,color:'var(--label-3)',width:76,textTransform:'capitalize'}}>{s.segmento}</span>
                      <div style={{flex:1,height:5,background:'var(--sep)',borderRadius:99,overflow:'hidden'}}>
                        <div style={{width:`${preview.total?s.qtd/preview.total*100:0}%`,height:'100%',background:'#7c6af7',borderRadius:99}}/>
                      </div>
                      <span style={{fontSize:11,color:'var(--label-4)',width:52,textAlign:'right'}}>{s.qtd.toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Config */}
            <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',margin:'0 0 8px'}}>Mensagem e ritmo</p>
            <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome da campanha (ex: Win-back perdidos julho)"
              style={{width:'100%',boxSizing:'border-box',padding:'10px 12px',borderRadius:10,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:13,marginBottom:10}}/>
            <select value={gatilho} onChange={e=>setGatilho(e.target.value)}
              style={{width:'100%',boxSizing:'border-box',padding:'10px 12px',borderRadius:10,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:13,marginBottom:12}}>
              <option value="">— Template (gatilho HSM aprovado) —</option>
              {gatilhos.map(t=><option key={t.id} value={t.gatilho}>{t.nome||t.gatilho} ({t.gatilho})</option>)}
            </select>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:12}}>
              <label style={{fontSize:11,color:'var(--label-4)'}}>Ritmo
                <select value={ritmo} onChange={e=>setRitmo(Number(e.target.value))} style={{width:'100%',marginTop:4,padding:'8px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:12}}>
                  <option value={6}>10/min (cauteloso)</option>
                  <option value={3}>20/min (padrão)</option>
                  <option value={2}>30/min (rápido)</option>
                </select>
              </label>
              <label style={{fontSize:11,color:'var(--label-4)'}}>Início
                <select value={janIni} onChange={e=>setJanIni(Number(e.target.value))} style={{width:'100%',marginTop:4,padding:'8px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:12}}>
                  {[8,9,10].map(h=><option key={h} value={h}>{h}h</option>)}
                </select>
              </label>
              <label style={{fontSize:11,color:'var(--label-4)'}}>Fim
                <select value={janFim} onChange={e=>setJanFim(Number(e.target.value))} style={{width:'100%',marginTop:4,padding:'8px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:12}}>
                  {[18,19,20,21].map(h=><option key={h} value={h}>{h}h</option>)}
                </select>
              </label>
              <label style={{fontSize:11,color:'var(--label-4)'}}>Cooldown
                <select value={cooldown} onChange={e=>setCooldown(Number(e.target.value))} style={{width:'100%',marginTop:4,padding:'8px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:12}}>
                  {[3,7,14,30].map(d=><option key={d} value={d}>{d} dias</option>)}
                </select>
              </label>
            </div>

            {enviaveis>0 && (
              <div style={{borderRadius:10,background:'rgba(37,211,102,.05)',border:'1px solid rgba(37,211,102,.2)',padding:'10px 13px',marginBottom:12}}>
                <Row k="Velocidade" v={`${msgsHora}/hora, janela ${janIni}h–${janFim}h (Brasília)`}/>
                <Row k="Duração estimada" v={`≈ ${Math.ceil(diasEnvio)} dia(s) de envio`}/>
                <Row k="Proteções" v="dedup · cooldown · blacklist · retoma após restart"/>
              </div>
            )}

            {erro && <p style={{fontSize:12,color:'#ff4757',margin:'0 0 10px'}}>⚠️ {erro}</p>}

            <label style={{display:'flex',gap:8,alignItems:'flex-start',fontSize:12,color:'var(--label-3)',cursor:'pointer',marginBottom:14,lineHeight:1.5}}>
              <input type="checkbox" checked={ciente} onChange={e=>setCiente(e.target.checked)} style={{marginTop:2}}/>
              <span>Entendo que <strong style={{color:'var(--label)'}}>{enviaveis.toLocaleString('pt-BR')} mensagens de template</strong> serão enviadas ao longo de ~{Math.ceil(diasEnvio||1)} dia(s), e que volume alto com muitos bloqueios pode afetar a reputação do número no WhatsApp.</span>
            </label>

            <button disabled={!ciente||!nome.trim()||!gatilho||!enviaveis||criando} onClick={criar}
              style={{width:'100%',padding:'12px',borderRadius:11,border:'none',cursor:(!ciente||!nome.trim()||!gatilho||!enviaveis)?'not-allowed':'pointer',
                background:(!ciente||!nome.trim()||!gatilho||!enviaveis)?'var(--fill)':'#25D366',
                color:(!ciente||!nome.trim()||!gatilho||!enviaveis)?'var(--label-4)':'#04150b',fontSize:14,fontWeight:800}}>
              {criando?'Criando fila...':`Iniciar campanha para ${enviaveis.toLocaleString('pt-BR')} clientes`}
            </button>
          </>
          )}
        </div>
      </div>
    </>
  )
}

// ── Sheet lateral do cliente ──────────────────────────────────────────────────
function ClienteSheet({ cliente, onClose, api }) {
  const [tab,     setTab]     = useState('perfil')
  // Perfil RICO do servidor: pedidos reais (base local), TOP PRODUTOS que o
  // cliente compra (itens sob demanda do Bling, com cache) e historico de
  // disparos — a informacao estrategica que faltava no drawer.
  const [rico,     setRico]    = useState(null)
  const [loadRico, setLoadRico]= useState(true)
  const [erroRico, setErroRico]= useState('')
  useEffect(()=>{
    const tel = (cliente.telefone||'').replace(/\D/g,'')
    if (!tel) { setLoadRico(false); return }
    fetch(`${api}/api/inteligencia/cliente/${tel}`)
      .then(async r=>{
        if (r.ok) return r.json()
        const d = await r.json().catch(()=>({}))
        throw new Error(`${r.status}: ${d.erro||'endpoint indisponível'}`)
      })
      .then(d=>{ setRico(d); setLoadRico(false) })
      .catch(e=>{ setErroRico(String(e.message)); setLoadRico(false) })
  },[])

  // Fallback: se o objeto da LISTA vier sem os campos (cache do navegador com o
  // payload antigo), completa com o perfil do servidor — uma fonte cobre a outra.
  const pf = rico?.perfil || {}
  cliente = {
    ...cliente,
    pedidosTotal:   cliente.pedidosTotal   ?? pf.pedidos_total,
    cicloDias:      cliente.cicloDias      ?? pf.ciclo_dias,
    primeiroPedido: cliente.primeiroPedido ?? pf.primeiro_pedido,
    ultimoPedido:   cliente.ultimoPedido   ?? pf.ultimo_pedido,
  }
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
    // 1a fonte: pedidos reais da base local (por TELEFONE — inequivoco).
    // A busca antiga por NOME fica so como fallback: nome nao e chave.
    if (rico?.pedidos?.length) { setPedidos(rico.pedidos.map(p=>({numero:p.numero,data:p.data,total:p.total,situacao:p.situacao_id,canal:p.canal}))); return }
    setLoadPed(true)
    fetch(`${api}/api/dashboard/pedido-completo-by-contato/${encodeURIComponent(cliente.nome||'')}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(d?.pedidos) setPedidos(d.pedidos); setLoadPed(false)})
      .catch(()=>setLoadPed(false))
  },[tab, rico])

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
    {id:'perfil',  label:'Perfil'},
    {id:'rfm',     label:'Score RFM'},
    {id:'pedidos', label:'Pedidos'},
    {id:'produtos',label:'Produtos'},
    {id:'msg',     label:'Mensagem'},
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
              {pedidos.map((p,i)=>{
                const SIT = {6:['Em aberto','#f59e0b'],9:['Atendido','#22c55e'],12:['Cancelado','#ff4757'],15:['Em andamento','#60a5fa']}
                const sid = p.situacao ?? p.situacao_id
                const [sl,sc] = SIT[sid] || [sid!=null?`Sit. ${sid}`:'—','#6b7280']
                const det = rico?.pedidosDetalhe?.[String(p.id_bling||'')] || {}
                return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid var(--sep)',opacity:sid===12?.55:1}}>
                  <span style={{fontSize:12,fontWeight:600,color:'var(--accent)',fontFamily:'monospace',flexShrink:0,minWidth:60}}>#{p.numero}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,color:'var(--label)',margin:0,fontWeight:500}}>
                      {fmtD(p.data)}
                      {p.canal && <span style={{marginLeft:7,fontSize:10,color:'var(--label-4)',textTransform:'capitalize'}}>{p.canal}</span>}
                    </p>
                    <p style={{fontSize:11,color:'var(--label-4)',margin:'2px 0 0'}}>
                      {det.itens_qtd!=null ? `${det.itens_qtd} un` : '—'}
                      {det.servico && <> · {det.servico}</>}
                    </p>
                  </div>
                  <span style={{fontSize:10,fontWeight:800,color:sc,background:sc+'14',border:`1px solid ${sc}30`,padding:'2px 8px',borderRadius:99,flexShrink:0}}>{sl}</span>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--label)',flexShrink:0,minWidth:70,textAlign:'right'}}>{R(p.total)}</span>
                </div>
              )})}
              {pedidos.length>0 && (
                <p style={{fontSize:10.5,color:'var(--label-4)',marginTop:8,lineHeight:1.5}}>
                  Unidades e envio aparecem nos pedidos mais recentes (detalhados sob demanda).
                </p>
              )}
            </div>
          )}

          {/* Mensagem */}
          {tab==='produtos'&&(
            <div>
              {loadRico && <p style={{fontSize:12.5,color:'var(--label-4)'}}>Carregando produtos do cliente...</p>}
              {erroRico && <p style={{fontSize:12,color:'#ff4757',lineHeight:1.5}}>⚠️ Perfil rico indisponível ({erroRico}). Confira se o backend está no build LAYOUT-V2.</p>}
              {!loadRico && !(rico?.produtos?.length) && (
                <p style={{fontSize:12.5,color:'var(--label-4)',lineHeight:1.6}}>
                  Sem itens conhecidos ainda. Os itens são buscados dos pedidos mais recentes
                  quando o perfil é aberto — se este cliente comprou há muito tempo, o pedido
                  pode não estar mais detalhável no Bling.
                </p>
              )}
              {!loadRico && rico?.produtos?.length > 0 && (
                <>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',margin:0}}>O que este cliente compra</p>
                    <span style={{fontSize:10.5,color:'var(--label-4)'}}>{rico.produtos_cobertura}</span>
                  </div>
                  {rico.produtos.map((p,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 11px',borderRadius:9,background:'var(--fill)',border:'1px solid var(--sep)',marginBottom:6}}>
                      {p.imagem
                        ? <img src={p.imagem} alt="" style={{width:38,height:38,borderRadius:8,objectFit:'cover',flexShrink:0,border:'1px solid var(--sep)'}}
                            onError={e=>{e.currentTarget.style.display='none'}}/>
                        : <span style={{fontSize:11,fontWeight:800,color:'var(--label-4)',width:38,height:38,borderRadius:8,background:'var(--sep)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}º</span>}
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:12.5,fontWeight:600,color:'var(--label)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.descricao}</p>
                        <p style={{fontSize:11,color:'var(--label-4)',margin:'2px 0 0'}}>
                          <strong style={{color:'var(--label-2)'}}>{p.quantidade} un</strong> · {Rk(p.valor_total)}
                          {p.pedidos?.length>0 && <> · em {p.pedidos.map(n=>`#${n}`).join(', ')}</>}
                        </p>
                      </div>
                    </div>
                  ))}
                  <p style={{fontSize:11,color:'var(--label-4)',marginTop:10,lineHeight:1.5}}>
                    💡 Use na mensagem: cliente que compra <strong>{(rico.produtos[0]?.descricao||'').split(' ').slice(0,3).join(' ')}</strong> responde melhor a oferta do mesmo tipo de produto.
                  </p>
                </>
              )}
              {!loadRico && rico?.disparos_recentes?.length > 0 && (
                <div style={{marginTop:16}}>
                  <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',marginBottom:8}}>Últimos contatos automáticos</p>
                  {rico.disparos_recentes.map((d,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:11.5,padding:'5px 0',borderBottom:'1px solid var(--sep)'}}>
                      <span style={{color:'var(--label-3)'}}>{d.gatilho} <span style={{color:'var(--label-4)'}}>({d.origem})</span></span>
                      <span style={{color:d.status==='enviado'?'#22c55e':'var(--label-4)'}}>{d.status} · {String(d.criado_em).slice(0,10)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
  const [view,        setView]      = useState('overview')
  const [avaliacoes,    setAvaliacoes]    = useState([])  // overview | clientes | sugestoes | config
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
  const [showCampanha,setShowCamp]  = useState(false)
  const [diasMaxF,    setDiasMaxF]  = useState('')     // teto da faixa de dias ('' = aberto)
  const [totalFiltro, setTotalFlt]  = useState(0)      // total REAL do filtro (servidor)
  const [receitaFlt,  setReceitaFlt]= useState(0)
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

  const carregarClientes = useCallback(async (offset=0) => {
    setLoadCli(true)
    try {
      const qs = `dias=${diasFiltro}&diasMax=${diasMaxF}&segmento=${segFiltro}&canal=${canalFiltro}&busca=${encodeURIComponent(busca)}&offset=${offset}&sort=${sortBy}`
      const r = await fetch(`${api}/api/inteligencia/clientes?${qs}`)
      if (r.ok) {
        const d = await r.json()
        setClientes(prev => offset>0 ? [...prev, ...(d.clientes||[])] : (d.clientes||[]))
        setStats(d.stats || null)
        setTotalFlt(d.totalFiltro ?? (d.clientes||[]).length)
        setReceitaFlt(d.receitaFiltro ?? 0)
      }
    } catch {}
    setLoadCli(false)
  }, [api, diasFiltro, diasMaxF, segFiltro, canalFiltro, busca, sortBy])

  // Busca com debounce: refaz no servidor 400ms apos parar de digitar
  useEffect(()=>{ const t=setTimeout(()=>carregarClientes(0),400); return ()=>clearTimeout(t) },[busca])

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

  const carregarAvaliacoes = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/inteligencia/avaliacoes`)
      if (r.ok) { const d = await r.json(); setAvaliacoes(d.avaliacoes || []) }
    } catch {}
  }, [api])

  useEffect(() => { carregarClientes() }, [carregarClientes])
  useEffect(() => { carregarSugestoes(); carregarConfig(); carregarAvaliacoes() }, [carregarSugestoes, carregarConfig, carregarAvaliacoes])

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
  // Distribuicao da BASE INTEIRA (stats do servidor: 39.588), nao dos 200
  // carregados na pagina — era isso que fazia "Perdido 100%" na Visao Geral.
  const _statsTotal = Number(stats?.total||0)
  const distSeg = Object.entries(SEG).map(([key,s])=>({
    ...s, key,
    count: Number(stats?.[key]||0) || clientes.filter(c=>c.segmento===key).length,
    total: _statsTotal || clientes.length,
  })).filter(s=>s.count>0).sort((a,b)=>b.count-a.count)

  const urgentesCount = sugestoesFiltradas.filter(s=>s.prioridade==='alta').length


  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  // height:100% + overflowY:auto = padrao das paginas que rolam (PageDashboard,
  // PageClientes). minHeight:100vh dentro do <main overflow:hidden> do Shell
  // fazia a pagina crescer alem da janela e ser CORTADA sem barra de rolagem
  // em lugar nenhum — o "Avaliacoes sem scroll" (a lista mais longa, 49 itens).
  return (
    <div style={{height:'100%',overflowY:'auto',background:'var(--bg)',color:'var(--label)'}}>
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
            {id:'overview',   label:'Visão Geral', icon:BarChart3},
            {id:'sugestoes',  label:`Sugestões da Bia${sugestoesFiltradas.length?` (${sugestoesFiltradas.length})`:''}`, icon:Brain},
            {id:'clientes',   label:`Clientes${totalFiltro?` (${fmt(totalFiltro)})`:''}`, icon:Users},
            {id:'campanhas',  label:'Campanhas', icon:Send},
            {id:'avaliacoes', label:`Avaliações${avaliacoes.length?` (${avaliacoes.length})`:''}`, icon:Star},
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
                  {/* Faixas fechadas: "+15d" sozinho era so um PISO (>=15) e mostrava
                      cliente de 3 anos no topo — correto pela query, enganoso pra quem le.
                      Agora cada chip e uma FAIXA real; "+120d" segue aberto. */}
                  {[{v:'15',m:'30',l:'15–30d'},{v:'30',m:'60',l:'30–60d'},{v:'60',m:'90',l:'60–90d'},{v:'90',m:'120',l:'90–120d'},{v:'120',m:'',l:'+120d'}].map(f=>(
                    <button key={f.l} onClick={()=>{setDiasFiltro(f.v);setDiasMaxF(f.m);setPagina(1)}} style={{padding:'4px 10px',borderRadius:99,border:`1px solid ${(diasFiltro===f.v&&diasMaxF===f.m)?'var(--accent)':'var(--sep)'}`,background:(diasFiltro===f.v&&diasMaxF===f.m)?'var(--accent-dim)':'transparent',color:(diasFiltro===f.v&&diasMaxF===f.m)?'var(--accent)':'var(--label-4)',cursor:'pointer',fontSize:11.5,fontWeight:(diasFiltro===f.v&&diasMaxF===f.m)?700:400}}>
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
                  : `Mostrando ${fmt(clientesFiltrados.length)} de ${fmt(totalFiltro)} clientes do filtro · receita recuperável ${Rk(receitaFlt||receitaRecuperavel)} · a campanha alcança TODOS os ${fmt(totalFiltro)}`
                }
              </span>
              {/* O composer resolve a audiencia NO SERVIDOR pelos filtros atuais —
                  a lista da tela (200) e so amostra; a campanha alcanca TODOS os
                  clientes do filtro (ex: 10.963 perdidos), com fila, ritmo e janela. */}
              <button onClick={()=>setShowCamp(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:9,border:'1px solid rgba(37,211,102,.3)',background:'rgba(37,211,102,.06)',color:'#25D366',cursor:'pointer',fontSize:12,fontWeight:700}}>
                <Send size={12}/> Criar campanha com estes filtros
              </button>
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
                {clientes.length < totalFiltro && (
                  <button onClick={()=>carregarClientes(clientes.length)} disabled={loadClientes}
                    style={{padding:'6px 14px',borderRadius:8,border:'1px solid var(--accent)',background:'var(--accent-dim)',color:'var(--accent)',cursor:'pointer',fontSize:12,fontWeight:700}}>
                    {loadClientes?'Carregando...':`+ Carregar mais (${fmt(totalFiltro - clientes.length)} restantes)`}
                  </button>
                )}
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
      {/* ────────── VIEW: AVALIAÇÕES ──────────────────────────────────────────── */}
      {view === 'campanhas' && (
        <div style={{maxWidth:980,margin:'0 auto',padding:'0 4px'}}>
          <CampanhasPanel api={api}/>
        </div>
      )}

      {view === 'avaliacoes' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {/* Resumo */}
          {avaliacoes.length > 0 && (() => {
            const media = avaliacoes.reduce((s,a)=>s+a.estrelas,0)/avaliacoes.length
            const dist  = [5,4,3,2,1].map(n=>({n,count:avaliacoes.filter(a=>a.estrelas===n).length}))
            return (
              <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:16}}>
                <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'20px',textAlign:'center'}}>
                  <div style={{fontSize:48,fontWeight:700,color:'var(--label)',lineHeight:1}}>{media.toFixed(1)}</div>
                  <div style={{fontSize:20,margin:'6px 0'}}>{'⭐'.repeat(Math.round(media))}</div>
                  <div style={{fontSize:12,color:'var(--label-4)'}}>{avaliacoes.length} avaliação{avaliacoes.length!==1?'ões':''}</div>
                </div>
                <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'20px',display:'flex',flexDirection:'column',justifyContent:'center',gap:8}}>
                  {dist.map(({n,count})=>(
                    <div key={n} style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:12,color:'var(--label-3)',width:16,textAlign:'right'}}>{n}</span>
                      <Star size={12} style={{color:'#f59e0b',flexShrink:0}}/>
                      <div style={{flex:1,height:8,background:'var(--fill)',borderRadius:99,overflow:'hidden'}}>
                        <div style={{width:`${avaliacoes.length?count/avaliacoes.length*100:0}%`,height:'100%',background:'#f59e0b',borderRadius:99,transition:'width .3s'}}/>
                      </div>
                      <span style={{fontSize:11,color:'var(--label-4)',width:24,textAlign:'right'}}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
          {/* Lista de avaliações */}
          {avaliacoes.length === 0
            ? <div style={{textAlign:'center',padding:48,color:'var(--label-4)',fontSize:14}}>
                <Star size={32} style={{opacity:.2,marginBottom:12}}/>
                <p style={{margin:0}}>Nenhuma avaliação registrada ainda.</p>
                <p style={{margin:'6px 0 0',fontSize:12}}>As avaliações aparecem aqui quando clientes avaliam seus pedidos.</p>
              </div>
            : avaliacoes.map((av,i)=>(
                <div key={i} style={{background:'var(--bg-2)',border:`1px solid ${av.estrelas<=2?'rgba(239,68,68,.3)':av.estrelas>=4?'rgba(34,197,94,.2)':'var(--sep)'}`,borderRadius:12,padding:'14px 16px'}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:av.comentario?8:0}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                        <span style={{fontSize:16}}>{'⭐'.repeat(av.estrelas)}</span>
                        <span style={{fontSize:11,fontWeight:600,padding:'1px 7px',borderRadius:99,
                          background:av.estrelas<=2?'rgba(239,68,68,.1)':av.estrelas>=4?'rgba(34,197,94,.1)':'rgba(245,158,11,.1)',
                          color:av.estrelas<=2?'#ef4444':av.estrelas>=4?'#22c55e':'#f59e0b'
                        }}>{av.estrelas<=2?'Insatisfeito':av.estrelas>=4?'Satisfeito':'Neutro'}</span>
                        {av.estrelas<=2 && <span style={{fontSize:10,padding:'1px 6px',borderRadius:99,background:'rgba(239,68,68,.1)',color:'#ef4444',border:'1px solid rgba(239,68,68,.2)'}}>🔔 Ocorrência aberta</span>}
                      </div>
                      <div style={{fontSize:12,color:'var(--label-4)'}}>
                        <strong style={{color:'var(--label-3)'}}>{av.nome_cliente || av.telefone}</strong>
                        {av.nome_cliente && av.nome_cliente!==av.telefone && <span style={{color:'var(--label-4)'}}> · {av.telefone}</span>}
                        {av.numero_pedido && <> · Pedido #{av.numero_pedido}</>}
                        {av.canal && <span style={{marginLeft:6,fontSize:10,fontWeight:700,textTransform:'capitalize',color:'#22c55e',background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.25)',padding:'1px 7px',borderRadius:99}}>{av.canal}</span>}
                      </div>
                    </div>
                    <span style={{fontSize:11,color:'var(--label-4)',flexShrink:0}}>
                      {av.criado_em ? new Date(av.criado_em).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'}
                    </span>
                  </div>
                  {av.comentario && (
                    <p style={{fontSize:12.5,color:'var(--label-3)',margin:0,padding:'8px 12px',background:'var(--fill)',borderRadius:8,lineHeight:1.6,fontStyle:'italic'}}>
                      "{av.comentario}"
                    </p>
                  )}
                </div>
              ))
          }
        </div>
      )}

      {/* key = telefone: sem ela o React REUSA a instancia ao trocar de cliente
          e o perfil rico (useEffect []) fica preso no cliente anterior. */}
      {clienteSel && <ClienteSheet key={clienteSel.telefone||clienteSel.nome} cliente={clienteSel} onClose={()=>setCltSel(null)} api={api}/>}
      {showCampanha && <CampanhaComposer api={api} onClose={()=>setShowCamp(false)}
        filtro={{
          segmentos: segFiltro!=='todos' ? [segFiltro] : null,
          canais:    canalFiltro!=='todos' ? [canalFiltro] : null,
          diasMin:   parseInt(diasFiltro)||0,
          busca:     busca||null,
        }}/>}
      {showConfig  && <ConfigModal config={config} onSave={salvarConfig} onClose={()=>setShowCfg(false)}/>}

    </div>
  )
}
