/**
 * PageConversas v4 — HARD LEVEL
 * · Nome real WhatsApp + foto de perfil
 * · "Molise" no lugar do nome do modelo
 * · Upload de mídia (imagem/vídeo/áudio)
 * · Sugestão de resposta por IA com revisão
 * · Banner de carrinho ativo
 * · Filtros glassmorphism com ícones
 * · Painel lateral completo para atendimento autônomo
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, MessageSquare, Bot, User, Send, RefreshCw, X,
  ChevronDown, ChevronRight, ChevronUp, Zap, Check, Package, Truck,
  ShoppingCart, ShoppingBag, CreditCard, Copy, FileText,
  Image, Mic, Video, Bell, AlertTriangle, CheckCircle,
  Clock, Inbox, Trash2, ExternalLink, Radio,
  Lightbulb, Paperclip, Camera, Volume2, Film, Tag,
  RotateCcw, TrendingUp, TrendingDown, Hash, Users, Filter,
  Star, Target, Activity, Flame, Shield, Award, Sparkles,
  DollarSign, Heart, BarChart2, Navigation, Layers, Command,
  Cpu, Calendar, MousePointer, ArrowLeft, Phone,
} from 'lucide-react'

// ── T system ──────────────────────────────────────────────────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#7b81a0', ink4:'#3a3f5c',
  green:'#00e676', greenDim:'rgba(0,230,118,.09)', greenBor:'rgba(0,230,118,.28)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.09)', amberBor:'rgba(255,179,0,.28)',
  red:'#ff4757',  redDim:'rgba(255,71,87,.09)',   redBor:'rgba(255,71,87,.28)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.1)',purpleBor:'rgba(167,139,250,.28)',
  cyan:'#06b6d4', cyanDim:'rgba(6,182,212,.09)',   cyanBor:'rgba(6,182,212,.25)',
  blue:'#4f8ef7', blueDim:'rgba(79,142,247,.09)',  blueBor:'rgba(79,142,247,.25)',
  sep:'rgba(255,255,255,.05)', sep2:'rgba(255,255,255,.09)',
  gray:'rgba(255,255,255,.04)',
}

const PAL = [T.purple,T.green,T.amber,T.cyan,T.blue,'#f87171','#ff9f0a']
const avatarCor = s => PAL[(s||'?').charCodeAt(0)%PAL.length]
const initiais  = s => (s||'?').split(' ').map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase()
const copyText  = t => navigator.clipboard?.writeText(t).catch(()=>{})
const tempoRel  = iso => {
  if (!iso) return ''
  const m = Math.floor((Date.now()-new Date(iso))/60000)
  if(m<1) return 'agora'; if(m<60) return `${m}min`
  if(m<1440) return `${Math.floor(m/60)}h`
  const d=Math.floor(m/1440); return d===1?'ontem':d<7?`${d}d`:new Date(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
}


// ── Análise de sentimento client-side ─────────────────────────────────────────
const SENT_POS = ['obrigad','ótim','perfeito','adorei','gostei','excelente','maravilh','top','amei','lindo','satisfeit','feliz','show','nota 10']
const SENT_NEG = ['péssim','horrível','terrível','problema','errado','não recebi','cancelar','devolução','reclamação','demor','absurd','ridícul','decepcionado','indignado','urgente','revoltado']
const calcSentimento = (msgs=[]) => {
  const ultimas = msgs.filter(m=>m.direcao==='entrada').slice(-5)
  if (!ultimas.length) return 0
  let score = 0
  ultimas.forEach(m => {
    const txt = (m.conteudo||'').toLowerCase()
    SENT_POS.forEach(p => { if (txt.includes(p)) score += 20 })
    SENT_NEG.forEach(p => { if (txt.includes(p)) score -= 20 })
  })
  return Math.max(-100, Math.min(100, score))
}

const calcPropensidade = (carrinho=[], msgs=[], pedidos=[]) => {
  let score = 15
  if (carrinho.length > 0) score += 40
  if (carrinho.length > 2) score += 15
  const ultMsgs = msgs.slice(-10).map(m=>(m.conteudo||'').toLowerCase())
  if (ultMsgs.some(m => /preço|valor|quanto|comprar|pagar|disponível|frete/.test(m))) score += 15
  if (ultMsgs.some(m => /foto|imagem|ver|como é|quero|gostei/.test(m))) score += 10
  if (pedidos.length > 0) score += 15
  if (pedidos.length > 2) score += 10
  const sent = calcSentimento(msgs)
  if (sent > 0) score += 10
  if (sent < -30) score -= 20
  return Math.max(0, Math.min(100, score))
}

const calcClienteScore = (pedidos=[], ltv=0) => {
  let s = 0
  if (ltv > 500) s += 30; else if (ltv > 200) s += 20; else if (ltv > 50) s += 10
  if (pedidos.length > 5) s += 25; else if (pedidos.length > 2) s += 15; else if (pedidos.length > 0) s += 5
  if (pedidos.length > 0) {
    const dias = (Date.now() - new Date(pedidos[0].data||Date.now())) / 86400000
    if (dias < 30) s += 25; else if (dias < 90) s += 15; else if (dias < 180) s += 5
  }
  return Math.min(100, s)
}

const getSegmento = (score, ltv, pedidos=[]) => {
  if (score >= 70 && ltv > 300) return { label:'VIP',        cor:'#ffb300', Icon:Award,    desc:'Cliente de alto valor' }
  if (pedidos.length >= 3)      return { label:'Recorrente', cor:'#00e676', Icon:Heart,    desc:'Compra regularmente' }
  if (score >= 40)              return { label:'Ativo',      cor:'#4f8ef7', Icon:Activity, desc:'Engajado' }
  if (pedidos.length === 0)     return { label:'Novo',       cor:'#a78bfa', Icon:Star,     desc:'Primeiro contato' }
  return                               { label:'Em risco',   cor:'#ff4757', Icon:Shield,   desc:'Inativo há algum tempo' }
}

const STATUS_CFG = {
  pendente:     { lbl:'Pendente',     cor:T.amber,  Icon:Clock,        glass:'rgba(255,179,0,.12)'    },
  em_andamento: { lbl:'Em andamento', cor:T.blue,   Icon:RefreshCw,    glass:'rgba(79,142,247,.12)'   },
  resolvido:    { lbl:'Resolvido',    cor:T.green,  Icon:CheckCircle,  glass:'rgba(0,230,118,.12)'    },
  encerrado:    { lbl:'Encerrado',    cor:T.ink4,   Icon:X,            glass:'rgba(255,255,255,.06)'  },
}

const GATILHO_LABEL = {
  pedido_criado:'Pedido criado', pagamento_aprovado:'Pagamento aprovado',
  pagamento_pendente:'Pag. pendente', em_separacao:'Em separação',
  nfe_emitida:'NF-e emitida', pedido_enviado:'Pedido enviado',
  pedido_coletado:'Coletado', rastreio_em_transito:'Em trânsito',
  saiu_entrega:'Saiu p/ entrega', tentativa_entrega:'Tentativa entrega',
  pedido_entregue:'Entregue', nao_entregue:'Não entregue',
  cancelamento:'Cancelado', avaliar_pedido:'Avaliação',
  boas_vindas:'Boas-vindas', pix_pendente:'PIX pendente',
  estorno_realizado:'Estorno', reengajamento:'Reengajamento',
}

const JORNADA_STEPS = [
  { gatilho:'pedido_criado',        label:'Pedido criado',       cor:'#00d4aa', Icon:ShoppingBag  },
  { gatilho:'pagamento_aprovado',   label:'Pagamento aprovado',  cor:T.blue,   Icon:CreditCard   },
  { gatilho:'em_separacao',         label:'Em separação',        cor:T.purple, Icon:Package      },
  { gatilho:'nfe_emitida',          label:'NF-e emitida',        cor:T.cyan,   Icon:FileText     },
  { gatilho:'pedido_enviado',       label:'Enviado',             cor:'#a78bfa',Icon:Send         },
  { gatilho:'rastreio_em_transito', label:'Em trânsito',         cor:T.blue,   Icon:Radio        },
  { gatilho:'saiu_entrega',         label:'Saiu p/ entrega',     cor:T.amber,  Icon:Truck        },
  { gatilho:'pedido_entregue',      label:'Entregue',            cor:T.green,  Icon:CheckCircle  },
]

// ─────────────────────────────────────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────────────────────────────────────
function Dot({ cor=T.green, size=8 }) {
  return (
    <span style={{ position:'relative',display:'inline-flex',width:size,height:size,flexShrink:0 }}>
      <span style={{ position:'absolute',inset:0,borderRadius:'50%',background:cor,
        opacity:.4,animation:'cv-ping 2s ease-out infinite' }}/>
      <span style={{ width:size,height:size,borderRadius:'50%',background:cor,
        display:'block',boxShadow:`0 0 ${size}px ${cor}` }}/>
    </span>
  )
}

function Toggle({ value, onChange, cor=T.green }) {
  return (
    <button onClick={()=>onChange(!value)}
      style={{ position:'relative',width:40,height:22,borderRadius:99,border:'none',
        cursor:'pointer',flexShrink:0,
        background:value?`linear-gradient(90deg,${cor},${cor}cc)`:'rgba(255,255,255,.1)',
        boxShadow:value?`0 0 14px ${cor}50`:undefined,
        transition:'all .22s cubic-bezier(.4,0,.2,1)' }}>
      <span style={{ position:'absolute',top:3,height:16,width:16,borderRadius:'50%',
        background:'#fff',left:value?'calc(100% - 19px)':'3px',
        transition:'left .2s cubic-bezier(.4,0,.2,1)',
        boxShadow:'0 1px 4px rgba(0,0,0,.3)' }}/>
    </button>
  )
}

// ── Avatar com foto de perfil WhatsApp ────────────────────────────────────────
function WaAvatar({ nome='', foto='', size=38, cor }) {
  const [imgOk, setImgOk] = useState(!!foto)
  const c   = cor || avatarCor(nome)
  const ini = initiais(nome)
  const fs  = size > 44 ? 17 : size > 34 ? 12 : 10
  useEffect(()=>setImgOk(!!foto),[foto])
  return (
    <div style={{ width:size,height:size,borderRadius:'50%',flexShrink:0,
      background:imgOk?'transparent':`linear-gradient(135deg,${c}35,${c}15)`,
      border:`2px solid ${c}45`,overflow:'hidden',
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:fs,fontWeight:800,color:c }}>
      {foto && imgOk
        ? <img src={foto} alt="" onError={()=>setImgOk(false)}
            style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
        : ini}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MÍDIA
// ─────────────────────────────────────────────────────────────────────────────
function getMediaType(c='') {
  const s=c.toLowerCase()
  if(!c) return 'text'
  if(s.includes('[imagem]')||s.includes('[image]')) return 'img_ph'
  if(s.includes('[áudio]')||s.includes('[audio]'))  return 'aud_ph'
  if(s.includes('[vídeo]')||s.includes('[video]'))  return 'vid_ph'
  if(s.includes('[documento]')||s.includes('[doc]')) return 'doc_ph'
  if(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(s)) return 'image'
  if(/\.(mp3|ogg|wav|m4a|opus)(\?.*)?$/i.test(s))  return 'audio'
  if(/\.(mp4|webm|mov)(\?.*)?$/i.test(s))           return 'video'
  if(/\.pdf(\?.*)?$/i.test(s))                       return 'pdf'
  return 'text'
}

function MediaContent({ content, tipo }) {
  const [err,setErr]=useState(false)
  const ph={fontSize:11.5,color:T.ink3,display:'flex',alignItems:'center',gap:7,
    padding:'8px 11px',borderRadius:9,background:T.bg4,border:`1px solid ${T.sep}`,marginTop:4}
  if(tipo==='image'&&!err) return <img src={content} alt="" onError={()=>setErr(true)}
    style={{ maxWidth:220,maxHeight:180,borderRadius:9,display:'block',marginTop:4,
      border:`1px solid ${T.sep}`,cursor:'pointer' }} onClick={()=>window.open(content,'_blank')}/>
  if(tipo==='img_ph'||err) return <div style={ph}><Image size={13} style={{ color:T.cyan }}/> Imagem</div>
  if(tipo==='audio') return <audio controls src={content} style={{ width:200,height:32,marginTop:5 }}/>
  if(tipo==='aud_ph') return <div style={ph}><Mic size={13} style={{ color:T.green }}/> Áudio</div>
  if(tipo==='video') return <video controls src={content} style={{ maxWidth:220,borderRadius:9,marginTop:4 }}/>
  if(tipo==='vid_ph') return <div style={ph}><Video size={13} style={{ color:T.purple }}/> Vídeo</div>
  if(tipo==='pdf') return <a href={content} target="_blank" rel="noreferrer"
    style={{ ...ph,color:T.blue,textDecoration:'none' }}><FileText size={13}/>Abrir PDF</a>
  if(tipo==='doc_ph') return <div style={ph}><FileText size={13} style={{ color:T.amber }}/> Documento</div>
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATADOR DE TEXTO WHATSAPP (bold, italic, variáveis)
// ─────────────────────────────────────────────────────────────────────────────
function WaText({ text='' }) {
  // Remove prefixo [Gatilho: xxx] que pode estar salvo no banco
  const clean = text.replace(/^\[Gatilho:[^\]]+\]\s*/i, '').trim()
  if (!clean) return null

  // Tokeniza em segmentos
  const tokens = clean.split(/(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|{{[^}]+}}|\n)/g)
  return (
    <span>
      {tokens.map((t, i) => {
        if (t === '\n') return <br key={i}/>
        if (t.startsWith('*') && t.endsWith('*') && t.length > 2)
          return <strong key={i} style={{ fontWeight:700, color:T.ink1 }}>{t.slice(1,-1)}</strong>
        if (t.startsWith('_') && t.endsWith('_') && t.length > 2)
          return <em key={i} style={{ fontStyle:'italic', color:T.ink2 }}>{t.slice(1,-1)}</em>
        if (t.startsWith('~') && t.endsWith('~') && t.length > 2)
          return <span key={i} style={{ textDecoration:'line-through', color:T.ink4 }}>{t.slice(1,-1)}</span>
        if (t.startsWith('{{') && t.endsWith('}}'))
          return <span key={i} style={{ display:'inline-flex',alignItems:'center',
            background:T.amberDim,color:T.amber,borderRadius:4,
            padding:'0 4px',fontSize:'0.88em',fontFamily:'monospace',
            border:`1px solid ${T.amberBor}`,verticalAlign:'baseline' }}>{t}</span>
        return <span key={i}>{t}</span>
      })}
    </span>
  )
}

// Preview estilo WhatsApp Business (simulação do que o cliente recebe)
function WaPreview({ content='', gatilhoLabel='' }) {
  const clean = content.replace(/^\[Gatilho:[^\]]+\]\s*/i, '').trim()
  return (
    <div style={{ padding:'12px 14px',
      background:`linear-gradient(135deg,${T.bg1},${T.bg2})`,
      border:`1px solid ${T.sep2}`,borderRadius:14,
      boxShadow:'0 8px 24px rgba(0,0,0,.4)',
      animation:'cv-fadeUp .18s ease' }}>

      {/* Header do preview */}
      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10,
        paddingBottom:8,borderBottom:`1px solid ${T.sep}` }}>
        <div style={{ width:28,height:28,borderRadius:'50%',flexShrink:0,
          background:`linear-gradient(135deg,${T.green}35,${T.green}15)`,
          border:`1.5px solid ${T.greenBor}`,
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:10,fontWeight:800,color:T.green }}>SS</div>
        <div>
          <div style={{ fontSize:11.5,fontWeight:700,color:T.ink1 }}>Só Strass</div>
          <div style={{ fontSize:9.5,color:T.green }}>● Conta Business verificada</div>
        </div>
        <span style={{ marginLeft:'auto',fontSize:9,
          padding:'1px 7px',borderRadius:99,background:T.amberDim,
          border:`1px solid ${T.amberBor}`,color:T.amber,fontWeight:700 }}>
          ⚡ {gatilhoLabel}
        </span>
      </div>

      {/* Conteúdo como o cliente vê */}
      <div style={{ fontSize:13,lineHeight:1.7,color:T.ink2,wordBreak:'break-word' }}>
        <WaText text={clean}/>
      </div>

      <div style={{ display:'flex',justifyContent:'flex-end',marginTop:8,
        paddingTop:6,borderTop:`1px solid ${T.sep}` }}>
        <span style={{ fontSize:9.5,color:T.ink4 }}>Visualização do cliente ↑</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BOLHA DE MENSAGEM
// ─────────────────────────────────────────────────────────────────────────────
function MsgBubble({ msg }) {
  const [open, setOpen] = useState(false)   // gatilho: expandido?
  const isEntrada = msg.direcao==='entrada'
  const isManual  = msg.modo==='manual'
  const isGatilho = !!msg.gatilho || (msg.modo==='auto'&&msg.motor&&!msg.motor.includes('gemini'))
  const isAI      = !isEntrada&&!isManual&&!isGatilho
  const tipo      = getMediaType(msg.conteudo||'')
  const hora      = msg.criado_em ? new Date(msg.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : ''

  // ── Mensagem de GATILHO — compacta por padrão, expande ao clicar ──────────
  if (isGatilho) {
    const gLabel = GATILHO_LABEL[msg.gatilho]||msg.template_nome||msg.gatilho||'Automação'
    return (
      <div style={{ padding:'2px 14px 6px' }}>
        {/* Badge compacto clicável */}
        <div style={{ display:'flex',alignItems:'center',gap:8,width:'100%',cursor:'pointer' }}
          onClick={()=>setOpen(v=>!v)}>
          <div style={{ flex:1,height:1,background:`linear-gradient(90deg,transparent,${T.amber}25)` }}/>
          <button style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'2px 9px',
            borderRadius:99,background:open?`${T.amber}22`:T.amberDim,
            border:`1px solid ${T.amberBor}`,
            fontSize:9,fontWeight:700,color:T.amber,cursor:'pointer',
            boxShadow:open?`0 0 10px ${T.amber}25`:undefined,transition:'all .15s' }}>
            <Zap size={7}/>
            ⚡ {gLabel} · {hora}
            <span style={{ marginLeft:2,fontSize:8,opacity:.7 }}>{open?'▲':'▼'}</span>
          </button>
          <div style={{ flex:1,height:1,background:`linear-gradient(270deg,transparent,${T.amber}25)` }}/>
        </div>

        {/* Preview expandido — formato WhatsApp Business */}
        {open && msg.conteudo && (
          <div style={{ marginTop:8,maxWidth:480,marginLeft:'auto',marginRight:'auto' }}>
            <WaPreview content={msg.conteudo} gatilhoLabel={gLabel}/>
          </div>
        )}
      </div>
    )
  }

  const bg  = isEntrada?`linear-gradient(135deg,${T.bg3},${T.bg4})`:isAI?`linear-gradient(135deg,${T.purple}28,${T.purple}14)`:`linear-gradient(135deg,${T.blue}28,${T.blue}14)`
  const bor = isEntrada?`1px solid ${T.sep2}`:isAI?`1px solid ${T.purple}28`:`1px solid ${T.blue}28`

  return (
    <div style={{ display:'flex',flexDirection:'column',
      alignItems:isEntrada?'flex-start':'flex-end',marginBottom:5,padding:'0 14px' }}>
      {!isEntrada && (
        <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:3,
          fontSize:9.5,fontWeight:700,color:isAI?T.purple:T.blue }}>
          {isAI ? <><Bot size={9}/> Molise</> : <><User size={9}/> Atendente</>}
        </div>
      )}
      <div style={{ maxWidth:'76%',padding:'9px 12px',
        borderRadius:isEntrada?'4px 14px 14px 14px':'14px 4px 14px 14px',
        background:bg,border:bor,
        boxShadow:isEntrada?'0 2px 8px rgba(0,0,0,.2)':`0 2px 10px ${isAI?T.purple:T.blue}12` }}>
        {tipo==='text'
          ? <p style={{ margin:0,fontSize:13.5,lineHeight:1.65,color:T.ink1,
              whiteSpace:'pre-wrap',wordBreak:'break-word' }}>
              {isEntrada ? msg.conteudo : <WaText text={msg.conteudo}/>}
            </p>
          : <MediaContent content={msg.conteudo} tipo={tipo}/>}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'flex-end',gap:4,marginTop:4 }}>
          <span style={{ fontSize:9.5,color:T.ink4 }}>{hora}</span>
          {!isEntrada&&<Check size={10} style={{ color:T.ink4 }}/>}
        </div>
      </div>
    </div>
  )
}


function DateSep({ date }) {
  const d=new Date(date),n=new Date()
  const diff=Math.floor((n-d)/86400000)
  const lbl=diff===0?'Hoje':diff===1?'Ontem':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'6px 14px',margin:'4px 0' }}>
      <div style={{ flex:1,height:1,background:T.sep }}/>
      <span style={{ fontSize:9.5,fontWeight:700,color:T.ink4,padding:'2px 9px',
        borderRadius:99,background:T.bg3,border:`1px solid ${T.sep}`,whiteSpace:'nowrap' }}>{lbl}</span>
      <div style={{ flex:1,height:1,background:T.sep }}/>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BANNER DE CARRINHO ATIVO
// ─────────────────────────────────────────────────────────────────────────────
function CartBanner({ carrinho=[], onVerCarrinho }) {
  if (!carrinho.length) return null
  const total = carrinho.reduce((a,it)=>a+(parseFloat(it.preco||it.precoVenda||0)*parseInt(it.quantidade||it.qtd||1)),0)
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'7px 14px',
      background:`linear-gradient(90deg,${T.amber}12,${T.bg2})`,
      borderBottom:`1px solid ${T.amberBor}`,flexShrink:0 }}>
      <ShoppingCart size={13} style={{ color:T.amber,flexShrink:0 }}/>
      <span style={{ fontSize:11.5,color:T.amber,fontWeight:600,flex:1 }}>
        🛒 Carrinho ativo — {carrinho.length} {carrinho.length===1?'item':'itens'} ·{' '}
        <strong>R$ {total.toFixed(2).replace('.',',')}</strong> — Cliente não finalizou
      </span>
      <button onClick={onVerCarrinho}
        style={{ padding:'3px 10px',borderRadius:7,border:`1px solid ${T.amberBor}`,
          background:T.amberDim,color:T.amber,cursor:'pointer',fontSize:10.5,fontWeight:700 }}>
        Ver →
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT BAR com upload de mídia + sugestão de IA
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SCORE RING — gauge SVG animado para o score do cliente
// ─────────────────────────────────────────────────────────────────────────────
function ScoreRing({ score=0, size=80, strokeW=7 }) {
  const r = (size - strokeW) / 2
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const cor = score >= 70 ? T.green : score >= 40 ? T.amber : T.red
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.bg4} strokeWidth={strokeW}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={cor} strokeWidth={strokeW} strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          style={{ filter:`drop-shadow(0 0 6px ${cor})`, transition:'stroke-dasharray .8s ease' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:size>70?20:14, fontWeight:800, color:cor, lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:8, color:T.ink4, marginTop:2, textTransform:'uppercase', letterSpacing:'.04em' }}>score</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPENSITY BAR — inédito no Brasil: propensidade de compra em tempo real
// ─────────────────────────────────────────────────────────────────────────────
function PropensityBar({ score=0 }) {
  const cor = score >= 70 ? T.green : score >= 40 ? T.amber : T.ink4
  const lbl = score >= 70 ? 'Alta' : score >= 40 ? 'Média' : 'Baixa'
  return (
    <div style={{ padding:'10px 14px', borderRadius:10, background:T.bg3, border:`1px solid ${T.sep}` }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <Target size={11} style={{ color:cor }}/>
          <span style={{ fontSize:10, fontWeight:700, color:T.ink3, textTransform:'uppercase', letterSpacing:'.04em' }}>Propensidade de Compra</span>
        </div>
        <span style={{ fontSize:14, fontWeight:800, color:cor }}>{score}%</span>
      </div>
      <div style={{ height:6, borderRadius:99, background:T.bg4, overflow:'hidden', marginBottom:5 }}>
        <div style={{ height:'100%', borderRadius:99, width:`${score}%`,
          background: score>=70 ? `linear-gradient(90deg,${T.green},${T.cyan})` :
                      score>=40 ? `linear-gradient(90deg,${T.amber},${T.green})` : T.ink4,
          boxShadow: score>=40 ? `0 0 8px ${cor}60` : 'none',
          transition:'width .8s ease' }}/>
      </div>
      <div style={{ fontSize:9, color:T.ink4 }}>
        {score >= 70 ? '✨ Cliente pronto para comprar' :
         score >= 40 ? '📊 Interesse moderado detectado' :
                       '💤 Pouco engajamento no momento'}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND PALETTE — ⌘K para ações rápidas sem sair da conversa
// ─────────────────────────────────────────────────────────────────────────────
function CommandPalette({ conversas=[], selTel, onSelect, onStatus, onToggleModo, onClose }) {
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => { setTimeout(()=>inputRef.current?.focus(), 50) }, [])

  const ACOES = [
    { id:'resolve',  label:'Resolver conversa',    desc:'Marcar como resolvido',        icon:CheckCircle, cor:T.green  },
    { id:'pending',  label:'Marcar como pendente',  desc:'Abrir para atendimento',       icon:Clock,       cor:T.amber  },
    { id:'ia_on',    label:'Ativar Molise',          desc:'Passar para atendimento IA',   icon:Bot,         cor:T.purple },
    { id:'ia_off',   label:'Desativar Molise',       desc:'Passar para humano',           icon:User,        cor:T.blue   },
    { id:'close',    label:'Encerrar conversa',      desc:'Finalizar atendimento',        icon:X,           cor:T.ink4   },
  ]

  const convFilt = conversas.filter(c => {
    if (!q) return true
    const nome = (c.nome_wa||c.nome||c.telefone||'').toLowerCase()
    return nome.includes(q.toLowerCase()) || (c.telefone||'').includes(q)
  }).slice(0, 6)

  const acoesFilt = ACOES.filter(a => !q || a.label.toLowerCase().includes(q.toLowerCase()))

  const allItems = [
    ...convFilt.map(c => ({ type:'conv', data:c })),
    ...acoesFilt.map(a => ({ type:'acao', data:a })),
  ]

  useEffect(() => { setIdx(0) }, [q])

  useEffect(() => {
    const fn = e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i=>Math.min(i+1, allItems.length-1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i=>Math.max(i-1, 0)) }
      if (e.key === 'Escape')    onClose()
      if (e.key === 'Enter') {
        const item = allItems[idx]
        if (!item) return
        if (item.type === 'conv') { onSelect(item.data.telefone); onClose() }
        else {
          if (item.data.id === 'resolve')  onStatus('resolvido')
          if (item.data.id === 'pending')  onStatus('pendente')
          if (item.data.id === 'close')    onStatus('encerrado')
          if (item.data.id === 'ia_on')    onToggleModo(true)
          if (item.data.id === 'ia_off')   onToggleModo(false)
          onClose()
        }
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [idx, allItems, onSelect, onStatus, onToggleModo, onClose])

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9000,
        background:'rgba(0,0,0,.6)', backdropFilter:'blur(8px)', animation:'cv-bg .15s ease' }}/>
      <div style={{ position:'fixed', top:'20%', left:'50%', transform:'translateX(-50%)',
        zIndex:9001, width:520, borderRadius:16,
        background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
        border:`1px solid ${T.purpleBor}`,
        boxShadow:`0 24px 64px rgba(0,0,0,.8), 0 0 0 1px ${T.purpleBor}`,
        overflow:'hidden', animation:'cv-slideIn .2s cubic-bezier(.2,.8,.2,1)' }}>
        {/* Input */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px',
          borderBottom:`1px solid ${T.sep}` }}>
          <Command size={16} style={{ color:T.purple, flexShrink:0 }}/>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Buscar conversa ou ação..."
            style={{ flex:1, background:'transparent', border:'none', outline:'none',
              color:T.ink1, fontSize:15, fontFamily:'inherit' }}/>
          <kbd style={{ fontSize:10, color:T.ink4, padding:'2px 6px', borderRadius:5,
            background:T.bg4, border:`1px solid ${T.sep2}` }}>ESC</kbd>
        </div>
        {/* Results */}
        <div style={{ maxHeight:340, overflowY:'auto' }}>
          {allItems.length === 0 && (
            <div style={{ padding:'24px', textAlign:'center', color:T.ink4, fontSize:12 }}>
              Nenhum resultado para "{q}"
            </div>
          )}
          {convFilt.length > 0 && (
            <div>
              <div style={{ padding:'8px 16px 4px', fontSize:9, fontWeight:700, color:T.ink4,
                textTransform:'uppercase', letterSpacing:'.06em' }}>Conversas</div>
              {convFilt.map((c, i) => {
                const gi = allItems.findIndex(x=>x.type==='conv'&&x.data.telefone===c.telefone)
                const ativo = gi === idx
                const cor = avatarCor(c.nome_wa||c.nome||c.telefone)
                return (
                  <button key={c.telefone}
                    onMouseEnter={()=>setIdx(gi)}
                    onClick={()=>{ onSelect(c.telefone); onClose() }}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:10,
                      padding:'9px 16px', border:'none', cursor:'pointer', textAlign:'left',
                      background: ativo ? `${T.purple}15` : 'transparent',
                      borderLeft:`2px solid ${ativo?T.purple:'transparent'}`,
                      transition:'all .08s' }}>
                    <WaAvatar nome={c.nome_wa||c.nome||c.telefone} foto={c.foto_perfil||''} size={28} cor={cor}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:T.ink1 }}>{c.nome_wa||c.nome||c.telefone}</div>
                      <div style={{ fontSize:10, color:T.ink4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {c.ultima_mensagem||'—'}
                      </div>
                    </div>
                    <span style={{ fontSize:9, color:T.ink4 }}>{tempoRel(c.ultima_atividade)}</span>
                  </button>
                )
              })}
            </div>
          )}
          {acoesFilt.length > 0 && selTel && (
            <div>
              <div style={{ padding:'8px 16px 4px', fontSize:9, fontWeight:700, color:T.ink4,
                textTransform:'uppercase', letterSpacing:'.06em', marginTop:4 }}>Ações</div>
              {acoesFilt.map((a) => {
                const gi = allItems.findIndex(x=>x.type==='acao'&&x.data.id===a.id)
                const ativo = gi === idx
                const Ic = a.icon
                return (
                  <button key={a.id}
                    onMouseEnter={()=>setIdx(gi)}
                    onClick={()=>{
                      if (a.id==='resolve')  onStatus('resolvido')
                      if (a.id==='pending')  onStatus('pendente')
                      if (a.id==='close')    onStatus('encerrado')
                      if (a.id==='ia_on')    onToggleModo(true)
                      if (a.id==='ia_off')   onToggleModo(false)
                      onClose()
                    }}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:10,
                      padding:'9px 16px', border:'none', cursor:'pointer', textAlign:'left',
                      background: ativo ? `${a.cor}12` : 'transparent',
                      borderLeft:`2px solid ${ativo?a.cor:'transparent'}`,
                      transition:'all .08s' }}>
                    <div style={{ width:28, height:28, borderRadius:8, flexShrink:0,
                      background:`${a.cor}18`, border:`1px solid ${a.cor}30`,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Ic size={12} style={{ color:a.cor }}/>
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:T.ink1 }}>{a.label}</div>
                      <div style={{ fontSize:10, color:T.ink4 }}>{a.desc}</div>
                    </div>
                    {ativo && <kbd style={{ marginLeft:'auto', fontSize:9, color:T.ink4,
                      padding:'2px 6px', borderRadius:5, background:T.bg4,
                      border:`1px solid ${T.sep2}` }}>↵</kbd>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div style={{ padding:'8px 16px', borderTop:`1px solid ${T.sep}`, display:'flex',
          gap:12, fontSize:9, color:T.ink4 }}>
          <span>↑↓ navegar</span>
          <span>↵ selecionar</span>
          <span>ESC fechar</span>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER CONTEXT BANNER — jornada do pedido ativo dentro do chat
// ─────────────────────────────────────────────────────────────────────────────
function OrderContextBanner({ tel, api, pedidos=[] }) {
  const [aberto, setAberto] = useState(true)
  const ativo = pedidos.find(p => {
    const sit = String(p.situacao_id||p.situacao||'')
    return !['30','36','12','Entregue','Cancelado','Devolvido'].includes(sit)
  }) || pedidos[0]
  if (!ativo || pedidos.length === 0) return null

  const sitId = ativo.situacao_id || 0
  const sitStr = String(ativo.situacao||'').toLowerCase()
  const temRas = ativo.rastreio && ativo.rastreio !== '—'
  const temNFe = !!ativo.nfe_link

  // Avaliação independente — cada step tem sua própria condição
  const PAGO_SITS = [9, 15, 24, 27, 30, 14]
  const stepFeito = [
    true,                                                          // 0 pedido_criado — sempre
    PAGO_SITS.includes(sitId),                                    // 1 pagamento_aprovado
    [9,24,27,30].includes(sitId),                                 // 2 em_separacao
    temNFe || sitId === 24,                                       // 3 nfe_emitida — só se NF-e existe
    temRas || [27,30].includes(sitId),                            // 4 pedido_enviado
    temRas && (sitStr.includes('transito')||sitStr.includes('trânsito')||[27].includes(sitId)), // 5 em_transito
    temRas && (sitStr.includes('saiu')||sitStr.includes('entrega')),   // 6 saiu_entrega
    sitId === 30 || sitStr.includes('entregue'),                  // 7 pedido_entregue
  ]

  // stepAtual = último step concluído
  let stepAtual = 0
  stepFeito.forEach((feito, i) => { if (feito) stepAtual = i })

  const cor = JORNADA_STEPS[stepAtual]?.cor || T.ink4

  return (
    <div style={{ flexShrink:0, borderBottom:`1px solid ${T.sep}`,
      background:`linear-gradient(90deg,${cor}08,transparent)`,
      transition:'all .2s' }}>
      <button onClick={()=>setAberto(v=>!v)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:8,
          padding:'7px 14px', background:'transparent', border:'none', cursor:'pointer' }}>
        <div style={{ width:18, height:18, borderRadius:6, flexShrink:0,
          background:`${cor}20`, border:`1px solid ${cor}40`,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Package size={9} style={{ color:cor }}/>
        </div>
        <span style={{ fontSize:10.5, fontWeight:700, color:cor }}>#{ativo.numero}</span>
        <span style={{ fontSize:10, color:T.ink4 }}>{ativo.situacao}</span>
        {ativo.total && <span style={{ fontSize:10.5, fontWeight:700, color:T.ink2, marginLeft:'auto' }}>{ativo.total}</span>}
        {aberto ? <ChevronUp size={10} style={{ color:T.ink4 }}/> : <ChevronDown size={10} style={{ color:T.ink4 }}/>}
      </button>
      {aberto && (
        <div style={{ padding:'4px 14px 10px', overflowX:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:0, minWidth:'max-content' }}>
            {JORNADA_STEPS.map((step, i) => {
              const feito = stepFeito[i] ?? false
              const atual = i === stepAtual
              const Ic = step.Icon
              return (
                <div key={i} style={{ display:'flex', alignItems:'center' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%',
                      background: feito ? `${step.cor}20` : T.bg4,
                      border:`2px solid ${feito ? step.cor : T.sep}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow: atual ? `0 0 10px ${step.cor}60` : 'none',
                      transition:'all .3s' }}>
                      <Ic size={10} style={{ color: feito ? step.cor : T.ink4 }}/>
                    </div>
                    <span style={{ fontSize:8, color: feito ? step.cor : T.ink4,
                      fontWeight: atual ? 700 : 400, whiteSpace:'nowrap' }}>
                      {step.label}
                    </span>
                  </div>
                  {i < JORNADA_STEPS.length-1 && (
                    <div style={{ width:20, height:2, margin:'0 2px', marginBottom:14,
                      background: i < stepAtual ? `linear-gradient(90deg,${step.cor},${JORNADA_STEPS[i+1].cor})` : T.sep,
                      borderRadius:99, transition:'background .3s', flexShrink:0 }}/>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAINEL DE OCORRÊNCIAS — componente próprio para respeitar regras de Hooks
// ─────────────────────────────────────────────────────────────────────────────
function OcorrenciasPanel({ tel, api, Secao }) {
  const [ocors,  setOcors]  = useState([])
  const [novaOc, setNovaOc] = useState('')
  const [savOc,  setSavOc]  = useState(false)
  const [loadOc, setLoadOc] = useState(false)

  const carregarOcs = () => {
    if (!tel) return
    setLoadOc(true)
    fetch(`${api}/api/dashboard/ocorrencias?telefone=${tel.replace(/\D/g,'')}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setOcors(d?.ocorrencias||[]); setLoadOc(false) })
      .catch(() => setLoadOc(false))
  }

  useEffect(() => { carregarOcs() }, [tel])

  const criarOc = async () => {
    if (!novaOc.trim() || !tel) return
    setSavOc(true)
    await fetch(`${api}/api/dashboard/ocorrencias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone: tel, tipo: 'suporte', descricao: novaOc.trim() })
    }).catch(() => {})
    setNovaOc('')
    setSavOc(false)
    carregarOcs()
  }

  const ocAbertos = ocors.filter(o => o.status !== 'resolvido').length

  return (
    <Secao title="Ocorrências" icon={AlertTriangle} cor={T.red}
      defaultOpen={false} badge={ocAbertos}>

      {/* Form nova ocorrência */}
      <div style={{ display:'flex', gap:7, marginBottom:10 }}>
        <input
          value={novaOc}
          onChange={e => setNovaOc(e.target.value)}
          onKeyDown={e => e.key==='Enter' && criarOc()}
          placeholder="Descreva o problema... (Enter para abrir)"
          style={{ flex:1, padding:'7px 10px', borderRadius:9,
            border:`1px solid ${T.sep2}`, background:T.bg4,
            color:T.ink1, fontSize:12, fontFamily:'inherit', outline:'none' }}
          onFocus={e => e.target.style.borderColor=T.redBor}
          onBlur={e  => e.target.style.borderColor=T.sep2}
        />
        <button onClick={criarOc} disabled={savOc || !novaOc.trim()}
          style={{ padding:'7px 14px', borderRadius:9, border:'none',
            background:T.red, color:'#fff', cursor:'pointer',
            fontSize:12, fontWeight:700,
            opacity:!novaOc.trim() ? 0.4 : 1 }}>
          {savOc ? '...' : 'Abrir'}
        </button>
      </div>

      {/* Lista */}
      {loadOc ? (
        <div style={{ textAlign:'center', padding:'12px 0', color:T.ink4 }}>
          <RefreshCw size={12} style={{ animation:'cv-spin 1s linear infinite' }}/>
        </div>
      ) : ocors.length === 0 ? (
        <div style={{ textAlign:'center', padding:'12px 0', color:T.ink4, fontSize:11 }}>
          Nenhuma ocorrência registrada
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {ocors.map((oc, i) => {
            const corStatus = oc.status==='resolvido' ? T.green
              : oc.status==='em_atendimento' ? T.blue : T.amber
            return (
              <div key={i} style={{ padding:'9px 11px', borderRadius:9,
                background:T.bg4,
                border:`1px solid ${oc.status==='resolvido' ? T.greenBor : T.sep}` }}>
                <div style={{ display:'flex', alignItems:'center',
                  justifyContent:'space-between', marginBottom:5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:T.ink2 }}>
                      {oc.tipo || 'Suporte'}
                    </span>
                    <span style={{ fontSize:9, padding:'1px 6px', borderRadius:99,
                      background:`${corStatus}15`, color:corStatus,
                      border:`1px solid ${corStatus}30`, fontWeight:700 }}>
                      {oc.status || 'aberto'}
                    </span>
                  </div>
                  <span style={{ fontSize:9.5, color:T.ink4 }}>
                    {oc.criado_em
                      ? new Date(oc.criado_em).toLocaleString('pt-BR', {
                          day:'2-digit', month:'2-digit',
                          hour:'2-digit', minute:'2-digit'
                        })
                      : '—'}
                  </span>
                </div>
                <p style={{ fontSize:11.5, color:T.ink3, margin:0, lineHeight:1.5 }}>
                  {oc.descricao}
                </p>
                {oc.numero_pedido && (
                  <div style={{ fontSize:10, color:T.ink4, marginTop:4,
                    display:'flex', alignItems:'center', gap:4 }}>
                    <Hash size={9}/>Pedido #{oc.numero_pedido}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Secao>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INTELLIGENCE CARD — Scroll único sem abas. Nível Linear / Salesforce
// ─────────────────────────────────────────────────────────────────────────────

// Seção colapsável reutilizável
function Secao({ title, icon:Ic, cor=T.ink4, children, defaultOpen=true, badge=null }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom:`1px solid ${T.sep}` }}>
      <button onClick={()=>setOpen(v=>!v)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:7,
          padding:'10px 14px', background:'transparent', border:'none',
          cursor:'pointer', transition:'background .1s' }}
        onMouseEnter={e=>e.currentTarget.style.background=T.gray}
        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
        <Ic size={11} style={{ color:cor, flexShrink:0 }}/>
        <span style={{ flex:1, fontSize:10, fontWeight:700, color:T.ink3,
          textTransform:'uppercase', letterSpacing:'.06em', textAlign:'left' }}>
          {title}
        </span>
        {badge !== null && badge > 0 && (
          <span style={{ fontSize:9, fontWeight:800, padding:'1px 6px', borderRadius:99,
            background:`${cor}18`, color:cor, border:`1px solid ${cor}30` }}>{badge}</span>
        )}
        {open
          ? <ChevronUp size={10} style={{ color:T.ink4, flexShrink:0 }}/>
          : <ChevronDown size={10} style={{ color:T.ink4, flexShrink:0 }}/>}
      </button>
      {open && (
        <div style={{ padding:'0 14px 12px', animation:'cv-fadeUp .12s ease' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// Linha de propriedade estilo Notion / Linear
function Prop({ icon:Ic, label, value, cor, mono, action, copyVal }) {
  const [copied, setCopied] = useState(false)
  if (!value || value === '—') return null
  const copy = () => {
    copyText(copyVal || value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'4px 0',
      borderBottom:`1px solid ${T.sep}` }}>
      {Ic && <Ic size={11} style={{ color:T.ink4, flexShrink:0, marginTop:2 }}/>}
      <span style={{ fontSize:10.5, color:T.ink4, minWidth:80, flexShrink:0 }}>{label}</span>
      <span style={{ flex:1, fontSize:11, color:cor||T.ink2, lineHeight:1.5,
        fontFamily: mono ? 'monospace' : 'inherit', fontWeight: mono ? 600 : 400 }}>
        {value}
      </span>
      {copyVal !== undefined && (
        <button onClick={copy} style={{ background:'none', border:'none',
          cursor:'pointer', color:copied ? T.green : T.ink4, flexShrink:0, display:'flex',
          padding:2, borderRadius:4 }}>
          {copied ? <Check size={10}/> : <Copy size={10}/>}
        </button>
      )}
      {action && (
        <button onClick={action.fn} style={{ fontSize:9.5, padding:'1px 7px',
          borderRadius:6, border:`1px solid ${T.sep2}`, background:T.bg4,
          color:T.ink3, cursor:'pointer' }}>
          {action.label}
        </button>
      )}
    </div>
  )
}

function IntelligenceCard({ conv, api, mensagens=[], carrinho=[], onModoChange, pixKey }) {
  const [pedidos,   setPedidos]   = useState([])
  const [loadPed,   setLoadPed]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [nota,      setNota]      = useState('')
  const [notaSalva, setNotaSalva] = useState(false)
  const [enviando,  setEnviando]  = useState(null)
  const [envRes,    setEnvRes]    = useState({})

  useEffect(() => {
    if (!conv?.telefone) return
    setLoadPed(true)
    fetch(`${api}/api/dashboard/contatos/${conv.telefone}/pedidos`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPedidos(d.pedidos || []); setLoadPed(false) })
      .catch(() => setLoadPed(false))
  }, [conv?.telefone, api])

  // Carregar nota do operador
  useEffect(() => {
    if (!conv?.telefone) return
    fetch(`${api}/api/ia/config`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.[`nota_${conv.telefone}`]) setNota(d[`nota_${conv.telefone}`]) })
      .catch(() => {})
  }, [conv?.telefone, api])

  const salvarNota = async () => {
    await fetch(`${api}/api/ia/config`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ chave:`nota_${conv.telefone}`, valor:nota })
    }).catch(() => {})
    setNotaSalva(true); setTimeout(() => setNotaSalva(false), 2000)
  }

  if (!conv) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', height:'100%', color:T.ink4, gap:10 }}>
      <Layers size={20} style={{ opacity:.12 }}/>
      <span style={{ fontSize:11 }}>Selecione uma conversa</span>
    </div>
  )

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const ltv     = pedidos.reduce((s,p) => s + parseFloat((p.total||'0').replace(/[R$\s.]/g,'').replace(',','.')||0), 0)
  const score   = calcClienteScore(pedidos, ltv)
  const propens = calcPropensidade(carrinho, mensagens, pedidos)
  const sent    = calcSentimento(mensagens)
  const seg     = getSegmento(score, ltv, pedidos)
  const SegIc   = seg.Icon
  const nome    = conv.nome_wa || conv.nome || conv.telefone
  const cor     = avatarCor(nome)
  const isIA    = conv.modo_ia !== 'manual'
  const pedidoAtivo = pedidos.find(p => {
    const sit = String(p.situacao_id||p.situacao||'')
    return !['30','Entregue','36','Cancelado'].includes(sit)
  }) || pedidos[0]

  // ── Next Best Actions rankeadas ────────────────────────────────────────────
  const acoes = []
  const minutosInativo = conv.ultima_atividade
    ? Math.floor((Date.now()-new Date(conv.ultima_atividade))/60000) : 0

  if (pedidos.length > 0) {
    const datas = pedidos.map(p => new Date(p.data||0)).filter(d=>!isNaN(d)).sort((a,b)=>b-a)
    const mediaInt = datas.length >= 2
      ? Math.round(datas.slice(0,-1).reduce((s,d,i)=>(s+(d-datas[i+1])/(86400000)),0)/(datas.length-1))
      : 45
    const diasUlt = Math.floor((Date.now()-datas[0])/(86400000))
    if (diasUlt >= mediaInt * 0.9) {
      acoes.push({ score:82, icon:ShoppingBag, cor:T.green,
        titulo:'Sugerir recompra',
        desc:`Ciclo médio ${mediaInt}d — ${diasUlt}d sem comprar`, gatilho:'reengajamento' })
    }
  }
  if (pedidoAtivo?.situacao?.includes('Entregue') || pedidoAtivo?.situacao_id===30) {
    const diffH = pedidoAtivo.data_entrega
      ? Math.floor((Date.now()-new Date(pedidoAtivo.data_entrega))/3600000) : 0
    if (diffH >= 12 && diffH <= 72) {
      acoes.push({ score:84, icon:Star, cor:T.amber,
        titulo:'Pedir avaliação',
        desc:`Entregue há ${diffH}h — janela ideal`, gatilho:'avaliar_pedido' })
    }
  }
  if (carrinho.length > 0 && minutosInativo > 25) {
    acoes.push({ score:77, icon:Flame, cor:'#ff9f0a',
      titulo:'Recuperar carrinho',
      desc:`${carrinho.length} iten(s) — inativo há ${minutosInativo}min`, gatilho:'recuperacao_carrinho' })
  }
  if (sent < -30) {
    acoes.push({ score:71, icon:AlertTriangle, cor:T.red,
      titulo:'Atenção: cliente insatisfeito',
      desc:'Sentimento negativo detectado — agir agora', gatilho:null })
  }
  acoes.sort((a,b) => b.score - a.score)

  const enviarTemplate = async (gatilho) => {
    if (!gatilho) return
    setEnviando(gatilho)
    try {
      const r = await fetch(`${api}/api/templates/disparar-gatilho`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ gatilho, telefone:conv.telefone,
          variaveis: {
            '{{nome_cliente}}': nome, '{{primeiro_nome}}': nome.split(' ')[0],
            '{{numero_pedido}}': pedidoAtivo?.numero || '',
            '{{valor_total}}':   pedidoAtivo?.total || '',
          }
        })
      })
      const d = await r.json()
      setEnvRes(p => ({...p,[gatilho]:d.ok?'ok':'erro'}))
    } catch { setEnvRes(p=>({...p,[gatilho]:'erro'})) }
    setTimeout(() => setEnvRes(p=>{const n={...p};delete n[gatilho];return n}), 3500)
    setEnviando(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%',
      background:`linear-gradient(180deg,${T.bg2},${T.bg1})` }}>

      {/* ── IDENTITY HEADER ─────────────────────────────────────── */}
      <div style={{ padding:'14px 14px 10px', flexShrink:0,
        background:`linear-gradient(135deg,${cor}08,transparent)`,
        borderBottom:`1px solid ${T.sep}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <WaAvatar nome={nome} foto={conv.foto_perfil||''} size={44} cor={cor}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13.5, fontWeight:800, color:T.ink1, letterSpacing:'-.02em',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nome}</div>
            <div style={{ fontSize:9.5, color:T.ink4, fontFamily:'monospace', marginTop:1 }}>
              {conv.telefone}
            </div>
            <div style={{ display:'flex', gap:4, marginTop:5, flexWrap:'wrap' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:3,
                padding:'2px 7px', borderRadius:99, fontSize:9, fontWeight:700,
                background:`${seg.cor}18`, border:`1px solid ${seg.cor}30`, color:seg.cor }}>
                <SegIc size={8}/>{seg.label}
              </span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:3,
                padding:'2px 7px', borderRadius:99, fontSize:9, fontWeight:700,
                background: isIA ? T.purpleDim : T.blueDim,
                border:`1px solid ${isIA ? T.purpleBor : T.blueBor}`,
                color: isIA ? T.purple : T.blue }}>
                {isIA ? <><Bot size={8}/> Molise</> : <><User size={8}/> Humano</>}
              </span>
            </div>
          </div>
          <ScoreRing score={score} size={54} strokeW={5}/>
        </div>

        {/* Stats compactos */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5 }}>
          {[
            { l:'LTV',       v:`R$${ltv>0?ltv.toFixed(0):'0'}`, c:T.green   },
            { l:'Pedidos',   v:pedidos.length,                   c:T.blue    },
            { l:'Ticket',    v:`R$${pedidos.length?Math.round(ltv/pedidos.length):0}`, c:T.purple },
          ].map(({l,v,c}) => (
            <div key={l} style={{ padding:'6px 8px', borderRadius:8,
              background:T.bg4, border:`1px solid ${T.sep}`, textAlign:'center' }}>
              <div style={{ fontSize:14, fontWeight:800, color:c }}>{v}</div>
              <div style={{ fontSize:8.5, color:T.ink4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SCROLL CONTÍNUO ─────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none' }}>

        {/* 1. NEXT BEST ACTIONS ──────────────────────────────────── */}
        {acoes.length > 0 && (
          <Secao title="Próximas Ações" icon={Sparkles} cor={T.amber} badge={acoes.length}>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {acoes.map((a,i) => {
                const AIc = a.icon
                const res = envRes[a.gatilho]
                const sending = enviando === a.gatilho
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:9,
                    padding:'9px 10px', borderRadius:10,
                    background:`${a.cor}08`, border:`1px solid ${a.cor}20` }}>
                    <div style={{ width:28, height:28, borderRadius:8, flexShrink:0,
                      background:`${a.cor}18`, border:`1px solid ${a.cor}30`,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <AIc size={12} style={{ color:a.cor }}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11.5, fontWeight:700, color:T.ink1 }}>{a.titulo}</div>
                      <div style={{ fontSize:10, color:T.ink4, marginTop:1 }}>{a.desc}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                      <span style={{ fontSize:11, fontWeight:800, color:a.cor }}>{a.score}%</span>
                      {a.gatilho && (
                        <button onClick={() => enviarTemplate(a.gatilho)}
                          disabled={sending || !!res}
                          style={{ padding:'4px 10px', borderRadius:7, cursor:'pointer',
                            border:`1px solid ${res==='ok'?T.greenBor:res==='erro'?T.redBor:a.cor+'40'}`,
                            background: res==='ok'?T.greenDim:res==='erro'?T.redDim:`${a.cor}12`,
                            color: res==='ok'?T.green:res==='erro'?T.red:a.cor,
                            fontSize:10, fontWeight:700, transition:'all .15s' }}>
                          {sending ? <RefreshCw size={9} style={{ animation:'cv-spin 1s linear infinite' }}/> :
                           res==='ok' ? '✓' : res==='erro' ? '✗' : '→'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Secao>
        )}

        {/* 2. INTELIGÊNCIA ───────────────────────────────────────── */}
        <Secao title="Inteligência" icon={Cpu} cor={T.purple}>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>

            {/* Propensidade */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontSize:10, color:T.ink4 }}>Propensidade de compra</span>
                <span style={{ fontSize:11, fontWeight:800,
                  color:propens>=70?T.green:propens>=40?T.amber:T.ink4 }}>{propens}%</span>
              </div>
              <div style={{ height:5, borderRadius:99, background:T.bg4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${propens}%`, borderRadius:99, transition:'width .8s ease',
                  background:propens>=70?`linear-gradient(90deg,${T.green},${T.cyan})`:
                             propens>=40?`linear-gradient(90deg,${T.amber},${T.green})`:T.ink4 }}/>
              </div>
            </div>

            {/* Sentimento */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontSize:10, color:T.ink4 }}>Sentimento da conversa</span>
                <span style={{ fontSize:11, fontWeight:700,
                  color:sent>20?T.green:sent<-20?T.red:T.amber }}>
                  {sent>20?'Positivo':sent<-20?'Negativo':'Neutro'}
                </span>
              </div>
              <div style={{ height:5, borderRadius:99, background:T.bg4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(sent+100)/2}%`, borderRadius:99,
                  background:sent>20?T.green:sent<-20?T.red:T.amber, transition:'width .8s ease' }}/>
              </div>
            </div>

            {/* Previsão de recompra */}
            {pedidos.length >= 2 && (() => {
              const datas = pedidos.map(p=>new Date(p.data||0)).filter(d=>!isNaN(d)).sort((a,b)=>b-a)
              if (datas.length < 2) return null
              const ints = []; for(let i=0;i<datas.length-1;i++) ints.push((datas[i]-datas[i+1])/86400000)
              const med = Math.round(ints.reduce((a,b)=>a+b)/ints.length)
              const prox = new Date(datas[0].getTime()+med*86400000)
              const dias = Math.round((prox-Date.now())/86400000)
              const urgente = dias <= 7
              return (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'7px 9px', borderRadius:8,
                  background:urgente?T.amberDim:T.bg4,
                  border:`1px solid ${urgente?T.amberBor:T.sep}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <Calendar size={11} style={{ color:urgente?T.amber:T.ink4 }}/>
                    <span style={{ fontSize:10.5, color:urgente?T.amber:T.ink3 }}>
                      Recompra prevista
                    </span>
                  </div>
                  <span style={{ fontSize:12, fontWeight:800,
                    color:dias<0?T.red:urgente?T.amber:T.ink1 }}>
                    {dias<0?'Atrasada':dias===0?'Hoje':`em ${dias}d`}
                  </span>
                </div>
              )
            })()}

            {/* DNA comportamental */}
            {pedidos.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                {pedidos[0]?.forma_pagamento && (
                  <Prop icon={CreditCard} label="Pag. favorito" value={pedidos[0].forma_pagamento}/>
                )}
                <Prop icon={Clock} label="Pico de atividade" value="19h–21h" cor={T.ink2}/>
                <Prop icon={TrendingUp} label="Freq. de compra"
                  value={pedidos.length>=2?`~${Math.round(
                    pedidos.slice(0,-1).reduce((s,p,i)=>{
                      const a=new Date(p.data||0),b=new Date(pedidos[i+1]?.data||0)
                      return s+(a-b)/86400000
                    },0)/(pedidos.length-1)
                  )}d entre pedidos`:'Primeiro pedido'}/>
              </div>
            )}
          </div>
        </Secao>

        {/* 3. PEDIDO ATIVO ────────────────────────────────────────── */}
        {pedidoAtivo && (
          <Secao title="Pedido Ativo" icon={Package} cor={T.green}>
            <div style={{ padding:'10px', borderRadius:10,
              background:`linear-gradient(135deg,${T.green}08,${T.bg4})`,
              border:`1px solid ${T.greenBor}`, marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:15, fontWeight:900, color:T.green }}>
                  #{pedidoAtivo.numero}
                </span>
                <span style={{ fontSize:13, fontWeight:800, color:T.ink1 }}>
                  {pedidoAtivo.total}
                </span>
              </div>
              <span style={{ fontSize:10.5, color:T.ink3 }}>{pedidoAtivo.situacao}</span>

              {/* Mini timeline horizontal */}
              {(() => {
                const MINI = [
                  { lbl:'Criado',  cor:'#00d4aa', Icon:ShoppingBag  },
                  { lbl:'Pago',    cor:T.blue,    Icon:CreditCard   },
                  { lbl:'Enviado', cor:'#a78bfa', Icon:Truck        },
                  { lbl:'Trânsito',cor:T.cyan,    Icon:Radio        },
                  { lbl:'Entregue',cor:T.green,   Icon:CheckCircle  },
                ]
                const sitId = pedidoAtivo.situacao_id
                const step = pedidoAtivo.rastreio&&pedidoAtivo.situacao?.includes('Entregue')?4:
                  pedidoAtivo.rastreio?3:[27,24].includes(sitId)?2:[15].includes(sitId)?1:0
                return (
                  <div style={{ display:'flex', alignItems:'center', marginTop:10, overflowX:'auto' }}>
                    {MINI.map((s,i) => {
                      const feito = i<=step; const atual=i===step; const Ic=s.Icon
                      return (
                        <div key={i} style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                            <div style={{ width:22, height:22, borderRadius:'50%',
                              background:feito?`${s.cor}20`:T.bg4,
                              border:`2px solid ${feito?s.cor:T.sep}`,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              boxShadow:atual?`0 0 10px ${s.cor}60`:'none' }}>
                              <Ic size={9} style={{ color:feito?s.cor:T.ink4 }}/>
                            </div>
                            <span style={{ fontSize:7.5, color:feito?s.cor:T.ink4,
                              fontWeight:atual?700:400, whiteSpace:'nowrap' }}>{s.lbl}</span>
                          </div>
                          {i<4&&<div style={{ width:14, height:2, margin:'0 1px', marginBottom:12, flexShrink:0,
                            background:i<step?`linear-gradient(90deg,${s.cor},${MINI[i+1].cor})`:T.sep,
                            borderRadius:99 }}/>}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
            <button onClick={() => setModal(pedidoAtivo)}
              style={{ width:'100%', padding:'7px', borderRadius:8, cursor:'pointer',
                border:`1px solid ${T.sep}`, background:T.bg4, color:T.ink3,
                fontSize:11, fontWeight:600, display:'flex', alignItems:'center',
                justifyContent:'center', gap:5 }}>
              <ExternalLink size={10}/> Ver detalhes completos
            </button>
          </Secao>
        )}

        {/* 4. CARRINHO ATIVO ──────────────────────────────────────── */}
        {carrinho.length > 0 && (
          <Secao title="Carrinho" icon={ShoppingCart} cor={T.amber} badge={carrinho.length}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {carrinho.map((it,i) => {
                const qtd = parseInt(it.quantidade||it.qtd||1)
                const preco = parseFloat(it.preco||it.precoVenda||0)
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8,
                    padding:'7px 9px', borderRadius:8, background:T.bg4, border:`1px solid ${T.sep}` }}>
                    <div style={{ width:32, height:32, borderRadius:7, flexShrink:0,
                      overflow:'hidden', background:T.bg3,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {it.imagem
                        ? <img src={it.imagem} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}
                            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}/>
                        : null}
                      <ShoppingBag size={12} style={{ color:T.ink4, display:it.imagem?'none':'flex' }}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:T.ink2,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {it.nome||it.descricao||'—'}
                      </div>
                      <div style={{ fontSize:9.5, color:T.ink4 }}>
                        {qtd}× R${preco.toFixed(2).replace('.',',')}
                      </div>
                    </div>
                    <span style={{ fontSize:12, fontWeight:800, color:T.amber, flexShrink:0 }}>
                      R${(preco*qtd).toFixed(2).replace('.',',')}
                    </span>
                  </div>
                )
              })}
              <div style={{ display:'flex', justifyContent:'space-between',
                padding:'7px 9px', borderRadius:8,
                background:T.amberDim, border:`1px solid ${T.amberBor}` }}>
                <span style={{ fontSize:11, fontWeight:700, color:T.amber }}>Total</span>
                <span style={{ fontSize:13, fontWeight:900, color:T.amber }}>
                  R${carrinho.reduce((a,it)=>a+(parseFloat(it.preco||it.precoVenda||0)*parseInt(it.quantidade||it.qtd||1)),0).toFixed(2).replace('.',',')}
                </span>
              </div>
            </div>
          </Secao>
        )}

        {/* 5. INFORMAÇÕES DO CLIENTE ──────────────────────────────── */}
        {/* Catálogo */}
        <Secao title="Catálogo de Produtos" icon={ShoppingBag} cor={T.purple} defaultOpen={false}>
          <AbaCatalogo tel={conv.telefone} api={api}/>
        </Secao>

        <Secao title="Dados do Cliente" icon={User} cor={T.blue} defaultOpen={true}>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <Prop icon={Phone} label="Telefone" value={conv.telefone} mono copyVal={conv.telefone}/>
            {(pedidos[0]?.cliente || conv.nome_wa || conv.nome) && (
              <Prop icon={User} label="Nome" value={pedidos[0]?.cliente || conv.nome_wa || conv.nome}/>
            )}
            {(pedidos[0]?.email || conv.email) && (
              <Prop icon={MessageSquare} label="E-mail" value={pedidos[0]?.email || conv.email}/>
            )}
            {pedidos[0]?.endereco && (
              <Prop icon={Navigation} label="Endereço" value={pedidos[0].endereco}/>
            )}
            {pedidos[0]?.numero_loja && (
              <Prop icon={Hash} label="Nº Loja" value={`#${pedidos[0].numero_loja}`} mono/>
            )}
            {pedidos[0]?.forma_pagamento && (
              <Prop icon={CreditCard} label="Forma pag." value={pedidos[0].forma_pagamento}/>
            )}
            {pedidos[0]?.status_pagamento && (
              <Prop icon={CreditCard} label="Último pag." value={pedidos[0].status_pagamento}
                cor={pedidos[0].status_pagamento==='Pago'?T.green:T.amber}/>
            )}
            {!pedidos.length && loadPed && (
              <div style={{ fontSize:11, color:T.ink4, display:'flex', alignItems:'center', gap:5 }}>
                <RefreshCw size={10} style={{ animation:'cv-spin 1s linear infinite' }}/>
                Carregando dados do Bling...
              </div>
            )}
            {!pedidos.length && !loadPed && (
              <div style={{ fontSize:11, color:T.ink4 }}>
                Sem pedidos vinculados a este contato
              </div>
            )}
          </div>
        </Secao>

        {/* 6. NOTAS DO OPERADOR ───────────────────────────────────── */}
        <Secao title="Notas Privadas" icon={FileText} cor={T.cyan} defaultOpen={false}>
          <div>
            <textarea value={nota} onChange={e => setNota(e.target.value)}
              placeholder="Anotações sobre o cliente (visíveis só para a equipe)&#10;Ex: Prefere contato após 19h. Já reclamou de atraso."
              rows={4}
              style={{ width:'100%', padding:'9px 10px', borderRadius:9, resize:'vertical',
                background:T.bg4, border:`1px solid ${T.sep2}`,
                color:T.ink2, fontSize:11.5, fontFamily:'inherit',
                outline:'none', boxSizing:'border-box', lineHeight:1.6,
                transition:'border-color .15s' }}
              onFocus={e => e.target.style.borderColor = T.cyanBor}
              onBlur={e  => e.target.style.borderColor = T.sep2}/>
            <button onClick={salvarNota} disabled={!nota.trim()}
              style={{ marginTop:6, padding:'6px 14px', borderRadius:8, cursor:'pointer',
                border:`1px solid ${notaSalva?T.greenBor:T.cyanBor}`,
                background:notaSalva?T.greenDim:T.cyanDim,
                color:notaSalva?T.green:T.cyan, fontSize:11, fontWeight:700,
                opacity:!nota.trim()?0.4:1 }}>
              {notaSalva ? '✅ Salvo!' : 'Salvar nota'}
            </button>
            {nota.trim() && (
              <div style={{ marginTop:5, fontSize:9.5, color:T.ink4 }}>
                Ctrl+Enter para salvar
              </div>
            )}
          </div>
        </Secao>

        {/* OCORRÊNCIAS DO CLIENTE */}
        <OcorrenciasPanel tel={conv.telefone} api={api} Secao={Secao}/>

                {/* 7. TODOS OS PEDIDOS ────────────────────────────────────── */}
        <Secao title="Histórico de Pedidos" icon={Package} cor={T.ink3}
          badge={pedidos.length} defaultOpen={false}>
          {loadPed ? (
            <div style={{ textAlign:'center', padding:16, color:T.ink4 }}>
              <RefreshCw size={12} style={{ animation:'cv-spin 1s linear infinite' }}/>
            </div>
          ) : pedidos.length === 0 ? (
            <div style={{ textAlign:'center', padding:12, color:T.ink4, fontSize:11 }}>
              Nenhum pedido encontrado
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {pedidos.map((p,i) => (
                <button key={p.id||i} onClick={() => setModal(p)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 10px',
                    borderRadius:9, border:`1px solid ${T.sep}`, background:T.bg4,
                    cursor:'pointer', textAlign:'left', transition:'background .1s' }}
                  onMouseEnter={e=>e.currentTarget.style.background=T.bg3}
                  onMouseLeave={e=>e.currentTarget.style.background=T.bg4}>
                  <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0,
                    background:T.green, boxShadow:`0 0 4px ${T.green}` }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:12, fontWeight:700, color:T.green }}>
                        #{p.numero}
                      </span>
                      <span style={{ fontSize:11, fontWeight:700, color:T.ink1 }}>{p.total}</span>
                    </div>
                    <div style={{ fontSize:10, color:T.ink4, marginTop:1 }}>
                      {p.data} · {p.situacao}
                      {p.rastreio && <Truck size={9} style={{ color:T.purple, marginLeft:5 }}/>}
                    </div>
                  </div>
                  <ChevronRight size={10} style={{ color:T.ink4, flexShrink:0 }}/>
                </button>
              ))}
            </div>
          )}
        </Secao>

        {/* 8. AÇÕES RÁPIDAS ───────────────────────────────────────── */}
        <Secao title="Ações Rápidas" icon={Zap} cor={T.purple} defaultOpen={false}>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <button onClick={() => onModoChange && onModoChange(!isIA)}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px',
                borderRadius:9, border:`1px solid ${isIA?T.purpleBor:T.blueBor}`,
                background:isIA?T.purpleDim:T.blueDim, cursor:'pointer' }}>
              {isIA ? <><User size={12} style={{color:T.blue}}/> <span style={{fontSize:11,fontWeight:600,color:T.blue}}>Assumir atendimento</span></>
                    : <><Bot size={12} style={{color:T.purple}}/> <span style={{fontSize:11,fontWeight:600,color:T.purple}}>Devolver para Molise</span></>}
            </button>
          </div>
        </Secao>

        <div style={{ height:24 }}/>
      </div>

      {modal && (
        <ModalPedido pedido={modal} tel={conv.telefone} api={api}
          pixKey={pixKey} onClose={() => setModal(null)}/>
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// ITEM DA LISTA — com avatar WA
// ─────────────────────────────────────────────────────────────────────────────
function ConversaItem({ c, ativo, onClick }) {
  const cor=avatarCor(c.nome_wa||c.nome||c.telefone)
  const isIA=c.modo_ia!=='manual'
  const sc=STATUS_CFG[c.status_atendimento]||STATUS_CFG.pendente
  const isAtivo=c.ultima_atividade&&(Date.now()-new Date(c.ultima_atividade))<5*60*1000
  const nome=c.nome_wa||c.nome||c.telefone
  const minutosInativo = c.ultima_atividade ? Math.floor((Date.now()-new Date(c.ultima_atividade))/60000) : 999
  const riscoAbandono = (c.itens_carrinho||0)>0 && minutosInativo>25 && c.status_atendimento!=='resolvido'
  return (
    <button onClick={onClick}
      style={{ width:'100%',padding:'10px 13px',border:'none',cursor:'pointer',
        textAlign:'left',position:'relative',
        background:ativo?`linear-gradient(90deg,${cor}10,${T.bg3})`:riscoAbandono?'rgba(255,159,10,.04)':'transparent',
        borderLeft:`3px solid ${ativo?cor:riscoAbandono?'#ff9f0a':'transparent'}`,transition:'all .13s' }}
      onMouseEnter={e=>{ if(!ativo) e.currentTarget.style.background=riscoAbandono?'rgba(255,159,10,.07)':T.gray }}
      onMouseLeave={e=>{ if(!ativo) e.currentTarget.style.background=riscoAbandono?'rgba(255,159,10,.04)':'transparent' }}>
      <div style={{ display:'flex',alignItems:'center',gap:9 }}>
        <div style={{ position:'relative',flexShrink:0 }}>
          <WaAvatar nome={nome} foto={c.foto_perfil||''} size={38} cor={cor}/>
          {isAtivo&&<div style={{ position:'absolute',bottom:0,right:0 }}><Dot cor={T.green} size={8}/></div>}
          {riscoAbandono&&!isAtivo&&(
            <div style={{ position:'absolute',bottom:-2,right:-2,
              background:'#ff9f0a',borderRadius:'50%',width:13,height:13,
              display:'flex',alignItems:'center',justifyContent:'center',
              border:`2px solid ${T.bg2}` }}>
              <Flame size={7} style={{ color:'#000' }}/>
            </div>
          )}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2 }}>
            <span style={{ fontSize:12.5,fontWeight:ativo?700:600,color:T.ink1,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:108 }}>
              {nome}
            </span>
            <div style={{ display:'flex',alignItems:'center',gap:4 }}>
              {(c.nao_lidas||0)>0&&(
                <span style={{ minWidth:16,height:16,borderRadius:99,background:T.green,
                  color:'#000',fontSize:8,fontWeight:800,
                  display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px' }}>
                  {c.nao_lidas>9?'9+':c.nao_lidas}
                </span>
              )}
              <span style={{ fontSize:9.5,color:T.ink4,flexShrink:0 }}>{tempoRel(c.ultima_atividade)}</span>
            </div>
          </div>
          <div style={{ fontSize:11,color:T.ink3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:4 }}>
            {c.ultima_mensagem||'—'}
          </div>
          <div style={{ display:'flex',gap:4,flexWrap:'wrap',alignItems:'center' }}>
            <span style={{ display:'inline-flex',alignItems:'center',gap:2,padding:'1px 5px',borderRadius:99,fontSize:8,fontWeight:700,
              background:isIA?T.purpleDim:T.blueDim,color:isIA?T.purple:T.blue,border:`1px solid ${isIA?T.purpleBor:T.blueBor}` }}>
              {isIA?<><Bot size={6}/> Molise</>:<><User size={6}/> H</>}
            </span>
            <span style={{ display:'inline-flex',alignItems:'center',gap:2,padding:'1px 5px',borderRadius:99,fontSize:8,fontWeight:700,
              background:`${sc.cor}12`,color:sc.cor,border:`1px solid ${sc.cor}22` }}>{sc.lbl}</span>
            {(c.itens_carrinho||0)>0&&!riscoAbandono&&(
              <span style={{ display:'inline-flex',alignItems:'center',gap:2,padding:'1px 5px',borderRadius:99,fontSize:8,fontWeight:700,
                background:T.amberDim,color:T.amber,border:`1px solid ${T.amberBor}` }}>
                <ShoppingCart size={6}/>{c.itens_carrinho}
              </span>
            )}
            {riscoAbandono&&(
              <span style={{ display:'inline-flex',alignItems:'center',gap:2,padding:'1px 5px',borderRadius:99,fontSize:8,fontWeight:700,
                background:'rgba(255,159,10,.15)',color:'#ff9f0a',border:'1px solid rgba(255,159,10,.3)' }}>
                <Flame size={6}/> Abandono
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTROS GLASSMORPHISM
// ─────────────────────────────────────────────────────────────────────────────
function GlassFilter({ id, lbl, Icon, n, ativo, onClick }) {
  const CORS = { todos:T.purple, ia:T.blue, manual:T.cyan, pendente:T.amber, resolvido:T.green, encerrado:T.ink4, risco:'#ff9f0a' }
  const cor = CORS[id] || T.purple
  return (
    <button onClick={onClick}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:3, padding:'6px 4px', borderRadius:10, border:'none', cursor:'pointer',
        transition:'all .15s', flex:1, minWidth:0,
        background: ativo ? `${cor}18` : 'rgba(255,255,255,.03)',
        outline: `1px solid ${ativo ? cor+'50' : 'rgba(255,255,255,.06)'}`,
        boxShadow: ativo ? `0 2px 12px ${cor}20` : 'none' }}>
      <div style={{ display:'flex', alignItems:'center', gap:3 }}>
        <Icon size={11} style={{ color: ativo ? cor : T.ink4, flexShrink:0 }}/>
        {n > 0 && (
          <span style={{ fontSize:9, fontWeight:800, color: ativo ? cor : T.ink4,
            lineHeight:1 }}>{n > 99 ? '99+' : n}</span>
        )}
      </div>
      <span style={{ fontSize:9.5, fontWeight: ativo ? 700 : 500,
        color: ativo ? cor : T.ink4, lineHeight:1, whiteSpace:'nowrap',
        overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%', textAlign:'center' }}>
        {lbl}
      </span>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 2: DETECTOR DE INTENÇÃO + EMENDA DE PEDIDO VIA CHAT
// Inédito no Brasil: detecta pedido de alteração e edita no Bling direto do chat
// ─────────────────────────────────────────────────────────────────────────────
const INTENCOES = [
  { re:/(?:trocar?|mudar?|alterar?|corrigir?).*(?:endere[cç]o|cep|rua|avenida|bairro)/i, tipo:'endereco', label:'Alteração de Endereço', icon:Navigation, cor:'#4f8ef7' },
  { re:/(?:trocar?|mudar?|alterar?).*(?:cor\b|tamanho|modelo|variante|versão)/i,          tipo:'variante', label:'Troca de Variante',     icon:Layers,     cor:'#a78bfa' },
  { re:/(?:cancelar?|quero cancelar|não quero mais)/i,                                    tipo:'cancel',   label:'Pedido de Cancelamento',icon:X,          cor:'#ff4757' },
  { re:/(?:trocar?|mudar?|alterar?).*(?:pagamento|forma de pag|pix|cartão|boleto)/i,      tipo:'payment',  label:'Troca de Pagamento',    icon:CreditCard, cor:'#ffb300' },
]

function detectarIntencao(msgs=[]) {
  const ultimas = msgs.filter(m=>m.direcao==='entrada').slice(-3)
  for (const m of ultimas) {
    const txt = m.conteudo || ''
    for (const int of INTENCOES) {
      if (int.re.test(txt)) return { ...int, mensagem: txt }
    }
  }
  return null
}

function PainelEmendaPedido({ intencao, pedidos=[], tel, api, onClose }) {
  const [pedidoSel, setPedidoSel] = useState(pedidos[0]?.numero||'')
  const [campo,     setCampo]     = useState('')
  const [salvando,  setSalv]      = useState(false)
  const [resultado, setResultado] = useState(null)
  const IntIc = intencao?.icon || Package

  const salvar = async () => {
    if (!pedidoSel || !campo.trim()) return
    setSalv(true)
    try {
      const r = await fetch(`${api}/api/dashboard/emendar-pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone: tel, numero_pedido: pedidoSel,
          tipo: intencao?.tipo, valor: campo.trim()
        })
      })
      const d = await r.json()
      setResultado(d.ok ? 'ok' : (d.erro || 'Erro ao atualizar'))
    } catch (e) { setResultado('Erro de conexão') }
    setSalv(false)
  }

  if (!intencao) return null
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:8000,
        background:'rgba(0,0,0,.5)', backdropFilter:'blur(4px)' }}/>
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        zIndex:8001, width:420, borderRadius:16,
        background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
        border:`1px solid ${intencao.cor}40`,
        boxShadow:`0 24px 64px rgba(0,0,0,.7)`,
        padding:'20px', animation:'cv-slideIn .2s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ width:36, height:36, borderRadius:10, flexShrink:0,
            background:`${intencao.cor}15`, border:`1px solid ${intencao.cor}30`,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <IntIc size={16} style={{ color:intencao.cor }}/>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:T.ink1 }}>{intencao.label}</div>
            <div style={{ fontSize:10, color:T.ink4 }}>Detectado na conversa · atualiza no Bling</div>
          </div>
          <button onClick={onClose} style={{ marginLeft:'auto', width:28, height:28, borderRadius:7,
            border:`1px solid ${T.sep}`, background:'transparent', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', color:T.ink4 }}>
            <X size={12}/>
          </button>
        </div>

        {/* Mensagem detectada */}
        <div style={{ padding:'10px 12px', borderRadius:9, background:T.bg4,
          border:`1px solid ${T.sep}`, marginBottom:14, fontSize:12, color:T.ink3,
          fontStyle:'italic', lineHeight:1.5 }}>
          "{(intencao.mensagem||'').slice(0,120)}"
        </div>

        {resultado ? (
          <div style={{ padding:'16px', borderRadius:10, textAlign:'center',
            background: resultado==='ok' ? T.greenDim : T.redDim,
            border:`1px solid ${resultado==='ok' ? T.greenBor : T.redBor}` }}>
            <div style={{ fontSize:16, fontWeight:800, color:resultado==='ok'?T.green:T.red, marginBottom:6 }}>
              {resultado==='ok' ? '✅ Pedido atualizado!' : '❌ ' + resultado}
            </div>
            {resultado==='ok' && <p style={{ fontSize:11, color:T.ink4, margin:0 }}>
              Alteração aplicada no Bling. Avise o cliente.
            </p>}
            <button onClick={onClose} style={{ marginTop:12, padding:'7px 18px', borderRadius:8,
              border:`1px solid ${T.sep}`, background:T.bg4, color:T.ink3, cursor:'pointer', fontSize:11 }}>
              Fechar
            </button>
          </div>
        ) : (
          <>
            {/* Pedido */}
            {pedidos.length > 1 && (
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:10, fontWeight:700, color:T.ink4,
                  textTransform:'uppercase', letterSpacing:'.04em', display:'block', marginBottom:5 }}>
                  Pedido
                </label>
                <select value={pedidoSel} onChange={e=>setPedidoSel(e.target.value)}
                  style={{ width:'100%', padding:'8px 10px', borderRadius:8, background:T.bg4,
                    border:`1px solid ${T.sep2}`, color:T.ink1, fontSize:12, fontFamily:'inherit' }}>
                  {pedidos.map(p=>(
                    <option key={p.numero} value={p.numero}>#{p.numero} — {p.situacao} — {p.total}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Campo da alteração */}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:10, fontWeight:700, color:T.ink4,
                textTransform:'uppercase', letterSpacing:'.04em', display:'block', marginBottom:5 }}>
                {intencao.tipo==='endereco' ? 'Novo endereço completo' :
                 intencao.tipo==='variante' ? 'Nova variante/cor/tamanho' :
                 intencao.tipo==='payment'  ? 'Nova forma de pagamento' : 'Observação'}
              </label>
              <textarea value={campo} onChange={e=>setCampo(e.target.value)}
                placeholder={
                  intencao.tipo==='endereco' ? 'Ex: Rua das Flores, 123 — Apto 4 — Centro — São Paulo/SP — 01000-000' :
                  intencao.tipo==='variante' ? 'Ex: Tamanho M, Cor Azul Marinho' : 'Digite aqui...'
                }
                rows={3}
                style={{ width:'100%', padding:'9px 12px', borderRadius:8, resize:'vertical',
                  background:T.bg4, border:`1px solid ${intencao.cor}40`,
                  color:T.ink1, fontSize:12, fontFamily:'inherit', outline:'none',
                  boxSizing:'border-box' }}/>
            </div>

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={onClose}
                style={{ flex:1, padding:'10px', borderRadius:9, border:`1px solid ${T.sep}`,
                  background:'transparent', color:T.ink4, cursor:'pointer', fontSize:12 }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={!campo.trim()||salvando}
                style={{ flex:2, padding:'10px', borderRadius:9,
                  border:`1px solid ${intencao.cor}60`,
                  background:`${intencao.cor}15`, color:intencao.cor,
                  cursor:'pointer', fontSize:12, fontWeight:700,
                  opacity:!campo.trim()?0.5:1 }}>
                {salvando ? 'Atualizando Bling...' : '✅ Aplicar alteração no Bling'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 4: HEATMAP DE RECEITA POR DIA/HORA
// Inédito no Brasil: visualização de quando o WhatsApp gera mais conversões
// ─────────────────────────────────────────────────────────────────────────────
function HeatmapReceita({ api, onClose }) {
  const [dados,  setDados]  = useState(null)
  const [load,   setLoad]   = useState(true)
  const [view,   setView]   = useState('hora') // hora | dia

  useEffect(() => {
    fetch(`${api}/api/dashboard/heatmap-receita`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if(d) setDados(d); setLoad(false) })
      .catch(() => setLoad(false))
  }, [api])

  const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const HORAS = Array.from({length:24}, (_,i)=>i)

  // Fallback: dados simulados se backend não tiver o endpoint
  const matrix = dados?.matrix || (() => {
    const m = {}
    DIAS.forEach((d,di) => {
      HORAS.forEach(h => {
        // Simular padrão: mais vendas de ter-sex, 9-12h e 19-22h
        const base = (di>=2&&di<=5)?0.6:0.2
        const pico = ((h>=9&&h<=12)||(h>=19&&h<=22))?0.8:0.2
        m[`${di}-${h}`] = Math.random() < (base+pico)/2 ? Math.floor(Math.random()*5) : 0
      })
    })
    return m
  })()

  const maxVal = Math.max(...Object.values(matrix), 1)
  const cellColor = (v) => {
    if (v === 0) return T.bg3
    const intensity = v / maxVal
    if (intensity > 0.7) return '#00e676'
    if (intensity > 0.4) return '#ffb300'
    if (intensity > 0.1) return '#4f8ef7'
    return '#1c2238'
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:8000,
        background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)' }}/>
      <div style={{ position:'fixed', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)', zIndex:8001,
        width:'min(760px,95vw)', maxHeight:'85vh', overflowY:'auto',
        borderRadius:18, background:`linear-gradient(160deg,${T.bg1},${T.bg2})`,
        border:`1px solid ${T.sep2}`,
        boxShadow:'0 32px 80px rgba(0,0,0,.8)',
        animation:'cv-slideIn .25s ease' }}>

        {/* Header */}
        <div style={{ padding:'18px 22px', borderBottom:`1px solid ${T.sep}`,
          display:'flex', alignItems:'center', gap:12, position:'sticky', top:0,
          background:`linear-gradient(90deg,${T.bg1},${T.bg2})`, zIndex:1 }}>
          <div style={{ width:36, height:36, borderRadius:10,
            background:T.greenDim, border:`1px solid ${T.greenBor}`,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <BarChart2 size={16} style={{ color:T.green }}/>
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:T.ink1 }}>Heatmap de Receita via WhatsApp</div>
            <div style={{ fontSize:10, color:T.ink4 }}>
              Quando seus clientes mais compram · {dados ? 'dados reais' : 'dados simulados'}
            </div>
          </div>
          <button onClick={onClose} style={{ marginLeft:'auto', width:30, height:30,
            borderRadius:8, border:`1px solid ${T.sep}`, background:T.bg4,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.ink4 }}>
            <X size={13}/>
          </button>
        </div>

        <div style={{ padding:'20px 22px' }}>
          {load ? (
            <div style={{ textAlign:'center', padding:'48px 0', color:T.ink4 }}>
              <RefreshCw size={18} style={{ animation:'cv-spin 1s linear infinite', display:'block', margin:'0 auto 12px' }}/>
              Carregando dados...
            </div>
          ) : (
            <>
              {/* Legenda */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, justifyContent:'flex-end' }}>
                <span style={{ fontSize:10, color:T.ink4 }}>Nenhum</span>
                {['#1c2238','#4f8ef7','#ffb300','#00e676'].map((c,i)=>(
                  <div key={i} style={{ width:16, height:16, borderRadius:4, background:c, border:`1px solid ${T.sep}` }}/>
                ))}
                <span style={{ fontSize:10, color:T.ink4 }}>Muito</span>
              </div>

              {/* Grid: Dia × Hora */}
              <div style={{ overflowX:'auto' }}>
                <div style={{ display:'grid',
                  gridTemplateColumns:`40px repeat(24, 1fr)`,
                  gap:3, minWidth:600 }}>
                  {/* Header de horas */}
                  <div/>
                  {HORAS.map(h => (
                    <div key={h} style={{ fontSize:8, color:T.ink4, textAlign:'center',
                      paddingBottom:3 }}>
                      {h}h
                    </div>
                  ))}
                  {/* Linhas por dia */}
                  {DIAS.map((dia, di) => (
                    <>
                      <div key={`d${di}`} style={{ fontSize:9, color:T.ink3, fontWeight:600,
                        display:'flex', alignItems:'center', paddingRight:6 }}>
                        {dia}
                      </div>
                      {HORAS.map(h => {
                        const v = matrix[`${di}-${h}`] || 0
                        return (
                          <div key={`${di}-${h}`} title={`${dia} ${h}h: ${v} pedido${v!==1?'s':''}`}
                            style={{ height:22, borderRadius:4,
                              background:cellColor(v),
                              border:`1px solid rgba(255,255,255,.04)`,
                              transition:'transform .1s',
                              cursor:'default' }}
                            onMouseEnter={e=>e.currentTarget.style.transform='scale(1.3)'}
                            onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}/>
                        )
                      })}
                    </>
                  ))}
                </div>
              </div>

              {/* Insights do heatmap */}
              {!dados && (
                <div style={{ marginTop:16, padding:'12px 14px', borderRadius:10,
                  background:T.amberDim, border:`1px solid ${T.amberBor}` }}>
                  <p style={{ fontSize:11, color:T.amber, margin:0, lineHeight:1.6 }}>
                    ⚠️ Exibindo dados simulados. Para dados reais, adicione o endpoint
                    <code style={{ background:T.bg4, padding:'1px 5px', borderRadius:4, margin:'0 3px', fontSize:10 }}>
                      GET /api/dashboard/heatmap-receita
                    </code>
                    no backend retornando <code style={{ background:T.bg4, padding:'1px 5px', borderRadius:4, fontSize:10 }}>{`{ matrix: { "0-9": 3, ... } }`}</code>
                  </p>
                </div>
              )}

              <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                {[
                  { lbl:'Melhor dia',  val:dados?.melhor_dia||'Terça-feira', icon:TrendingUp, cor:T.green },
                  { lbl:'Melhor hora', val:dados?.melhor_hora||'19h–21h',    icon:Clock,      cor:T.amber },
                  { lbl:'Pico semanal',val:dados?.pico||'Qui às 20h',        icon:Star,       cor:T.purple },
                ].map(({lbl,val,icon:Ic,cor:c})=>(
                  <div key={lbl} style={{ padding:'10px 12px', borderRadius:9,
                    background:`${c}08`, border:`1px solid ${c}20`, textAlign:'center' }}>
                    <Ic size={14} style={{ color:c, display:'block', margin:'0 auto 5px' }}/>
                    <div style={{ fontSize:13, fontWeight:800, color:c, marginBottom:2 }}>{val}</div>
                    <div style={{ fontSize:9, color:T.ink4 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
function AbaContato({ conv, onModoChange }) {
  const cor=avatarCor(conv.nome||conv.telefone)
  const isIA=conv.modo_ia!=='manual'
  const sc=STATUS_CFG[conv.status_atendimento]||STATUS_CFG.pendente
  return (
    <div style={{ padding:'14px 13px',overflowY:'auto',flex:1 }}>
      <div style={{ textAlign:'center',marginBottom:12 }}>
        <WaAvatar nome={conv.nome_wa||conv.nome||conv.telefone}
          foto={conv.foto_perfil||''} size={52} cor={cor}/>
        <div style={{ fontSize:14,fontWeight:700,color:T.ink1,marginTop:8 }}>
          {conv.nome_wa||conv.nome||'Sem nome'}
        </div>
        {conv.nome_wa&&conv.nome&&conv.nome_wa!==conv.nome&&(
          <div style={{ fontSize:10.5,color:T.ink4,marginTop:2 }}>Bling: {conv.nome}</div>
        )}
        <div style={{ fontFamily:'monospace',fontSize:11,color:T.ink4,marginTop:3 }}>{conv.telefone}</div>
      </div>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'8px 12px',borderRadius:10,marginBottom:12,
        background:isIA?T.purpleDim:T.blueDim,border:`1px solid ${isIA?T.purpleBor:T.blueBor}` }}>
        <div style={{ display:'flex',alignItems:'center',gap:6 }}>
          {isIA?<Bot size={12} style={{ color:T.purple }}/>:<User size={12} style={{ color:T.blue }}/>}
          <span style={{ fontSize:11.5,fontWeight:700,color:isIA?T.purple:T.blue }}>
            {isIA?'Molise respondendo':'Atendimento humano'}
          </span>
        </div>
        <Toggle value={isIA} onChange={v=>onModoChange(v)} cor={isIA?T.purple:T.blue}/>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:7 }}>
        {[
          { l:'Mensagens',v:conv.total_msgs||0,    cor:T.purple },
          { l:'Do cliente',v:conv.msgs_entrada||0, cor:T.cyan   },
          { l:'Carrinho',  v:conv.itens_carrinho||0,cor:T.amber },
          { l:'Status',    v:sc.lbl,               cor:sc.cor   },
        ].map(s=>(
          <div key={s.l} style={{ padding:'9px 10px',borderRadius:10,
            background:T.bg4,border:`1px solid ${T.sep}`,textAlign:'center' }}>
            <div style={{ fontSize:17,fontWeight:800,color:s.cor,letterSpacing:'-.02em' }}>{s.v}</div>
            <div style={{ fontSize:9.5,color:T.ink4,marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


function AbaCatalogo({ tel, api }) {
  const [busca,setBusca]=useState('')
  const [prods,setProds]=useState([])
  const [load,setLoad]=useState(false)
  const [avisei,setAvisei]=useState({})
  const [env,setEnv]=useState(null)
  const to=useRef()

  useEffect(()=>{
    clearTimeout(to.current);setLoad(true)
    to.current=setTimeout(async()=>{
      try { const r=await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(busca)}&limit=20`); const d=await r.json(); setProds(d.produtos||[]) }
      catch{} finally{setLoad(false)}
    },busca?350:0)
    return()=>clearTimeout(to.current)
  },[busca,api])

  const enviar=async(p)=>{
    setEnv(p.id)
    const preco=parseFloat(p.preco||p.precoVenda||0)
    const pix=(preco*.9).toFixed(2).replace('.',',')
    const msg=`🛍️ *${p.nome}*\n\n💰 PIX: R$ ${pix} *(10% off)*\n💳 Cartão: R$ ${preco.toFixed(2).replace('.',',')} em até 12x\n📦 ${p.disponivel?`✅ Em estoque (${p.estoque} un.)`:'❌ Fora de estoque'}\n🔑 Ref: ${p.codigo||'—'}`
    await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:tel,mensagem:msg})}).catch(()=>{})
    setTimeout(()=>setEnv(null),2500)
  }

  const avise=async(p)=>{
    await fetch(`${api}/api/dashboard/avise-me`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:tel,produto_id:p.id,nome_produto:p.nome,codigo:p.codigo})}).catch(()=>{})
    setAvisei(prev=>({...prev,[p.id]:true}))
  }

  return (
    <div style={{ display:'flex',flexDirection:'column',flex:1,overflow:'hidden' }}>
      <div style={{ padding:'9px 12px',borderBottom:`1px solid ${T.sep}` }}>
        <div style={{ position:'relative' }}>
          <Search size={11} style={{ position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:T.ink4,pointerEvents:'none' }}/>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar produto..."
            style={{ width:'100%',padding:'7px 9px 7px 27px',borderRadius:9,background:T.bg1,border:`1px solid ${T.sep2}`,color:T.ink1,fontSize:12,outline:'none',fontFamily:'inherit',boxSizing:'border-box' }}/>
        </div>
      </div>
      <div style={{ flex:1,overflowY:'auto' }}>
        {load&&<div style={{ textAlign:'center',padding:'18px 0',color:T.ink4 }}><RefreshCw size={12} style={{ animation:'cv-spin 1s linear infinite' }}/></div>}
        {!load&&prods.length===0&&<div style={{ textAlign:'center',padding:'20px 12px',color:T.ink4 }}>
          <Package size={16} style={{ display:'block',margin:'0 auto 7px',opacity:.12 }}/>
          <p style={{ fontSize:11,margin:0 }}>{busca?'Sem resultados':'Digite para buscar'}</p>
        </div>}
        {prods.map(p=>{
          const preco=parseFloat(p.preco||p.precoVenda||0)
          const disp=p.disponivel&&parseInt(p.estoque||0)>0
          return (
            <div key={p.id} style={{ padding:'9px 12px',borderBottom:`1px solid ${T.sep}`,display:'flex',gap:9 }}>
              <div style={{ width:44,height:44,borderRadius:8,flexShrink:0,overflow:'hidden',
                background:T.bg3,border:`1px solid ${T.sep}`,
                display:'flex',alignItems:'center',justifyContent:'center' }}>
                {p.imagem&&<img src={p.imagem} alt="" onError={e=>{e.target.style.display='none';e.target.nextSibling&&(e.target.nextSibling.style.display='flex')}} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>}
                <ShoppingBag size={15} style={{ color:T.ink4,display:p.imagem?'none':'flex' }}/>
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:11.5,fontWeight:600,color:T.ink1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:2 }}>{p.nome}</div>
                {p.descricao&&<div style={{ fontSize:10,color:T.ink4,lineHeight:1.35,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.descricao}</div>}
                <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
                  <span style={{ fontSize:12,fontWeight:800,color:T.green }}>R${(preco*.9).toFixed(2).replace('.',',')}</span>
                  <span style={{ fontSize:8.5,padding:'1px 5px',borderRadius:99,fontWeight:700,
                    background:disp?T.greenDim:T.redDim,color:disp?T.green:T.red,
                    border:`1px solid ${disp?T.greenBor:T.redBor}` }}>
                    {disp?`${p.estoque}un`:'Esgotado'}
                  </span>
                </div>
                <div style={{ display:'flex',gap:5 }}>
                  {disp?(
                    <button onClick={()=>env!==p.id&&enviar(p)} disabled={!!env}
                      style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:7,
                        border:`1px solid ${T.sep2}`,background:env===p.id?T.greenDim:T.bg4,
                        color:env===p.id?T.green:T.ink3,cursor:'pointer',fontSize:10,fontWeight:600,
                        opacity:env&&env!==p.id?.4:1,transition:'all .12s' }}>
                      {env===p.id?<><Check size={9}/>Ok!</>:<><Send size={9}/>Enviar</>}
                    </button>
                  ):(
                    <button onClick={()=>!avisei[p.id]&&avise(p)}
                      style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:7,
                        border:`1px solid ${T.amberBor}`,background:avisei[p.id]?T.amberDim:'transparent',
                        color:T.amber,cursor:'pointer',fontSize:10,fontWeight:600 }}>
                      {avisei[p.id]?<><Check size={9}/>Ok!</>:<><Bell size={9}/>Avise-me</>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


function AbaPedidos({ tel, api, pixKey }) {
  const [pedidos,setPedidos]=useState([])
  const [load,setLoad]=useState(true)
  const [modal,setModal]=useState(null)

  useEffect(()=>{
    fetch(`${api}/api/dashboard/contatos/${tel}/pedidos`).then(r=>r.ok?r.json():null)
      .then(d=>{ if(d) setPedidos(d.pedidos||[]); setLoad(false) }).catch(()=>setLoad(false))
  },[tel,api])

  if(load) return <div style={{ textAlign:'center',padding:'20px 0',color:T.ink4 }}>
    <RefreshCw size={12} style={{ animation:'cv-spin 1s linear infinite' }}/></div>

  return (
    <div style={{ flex:1,overflowY:'auto' }}>
      {pedidos.length===0?<div style={{ textAlign:'center',padding:'20px 12px',color:T.ink4 }}>
        <Package size={16} style={{ display:'block',margin:'0 auto 7px',opacity:.12 }}/>
        <p style={{ fontSize:11,margin:0 }}>Nenhum pedido</p>
      </div>:pedidos.map((p,i)=>(
        <button key={p.id||i} onClick={()=>setModal(p)}
          style={{ width:'100%',display:'flex',alignItems:'center',gap:9,padding:'10px 13px',
            border:'none',cursor:'pointer',textAlign:'left',
            borderBottom:`1px solid ${T.sep}`,background:'transparent',transition:'background .12s' }}
          onMouseEnter={e=>e.currentTarget.style.background=T.gray}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <div style={{ width:7,height:7,borderRadius:'50%',flexShrink:0,background:T.green,boxShadow:`0 0 4px ${T.green}` }}/>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:2 }}>
              <span style={{ fontSize:12.5,fontWeight:700,color:T.green }}>#{p.numero}</span>
              <span style={{ fontSize:11,fontWeight:700,color:T.ink1 }}>{p.total}</span>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:7 }}>
              <span style={{ fontSize:10,color:T.ink4 }}>{p.data}</span>
              <span style={{ fontSize:9.5,padding:'1px 6px',borderRadius:99,background:T.bg4,
                border:`1px solid ${T.sep}`,color:T.ink3,fontWeight:600 }}>{p.situacao}</span>
              {p.rastreio&&p.rastreio!=='—'&&<Truck size={9} style={{ color:T.purple }}/>}
            </div>
          </div>
          <ChevronRight size={11} style={{ color:T.ink4,flexShrink:0 }}/>
        </button>
      ))}
      {modal&&<ModalPedido pedido={modal} tel={tel} api={api} pixKey={pixKey} onClose={()=>setModal(null)}/>}
    </div>
  )
}


function AbaCarrinho({ carrinho=[] }) {
  if(carrinho.length===0) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',flex:1,color:T.ink4,padding:20,textAlign:'center' }}>
      <ShoppingCart size={26} style={{ opacity:.1,display:'block',margin:'0 auto 10px' }}/>
      <p style={{ fontSize:12,margin:'0 0 5px' }}>Carrinho vazio</p>
      <p style={{ fontSize:10.5,color:T.ink4,margin:0 }}>Itens adicionados via WhatsApp aparecem aqui</p>
    </div>
  )
  const total=carrinho.reduce((a,it)=>a+(parseFloat(it.preco||it.precoVenda||0)*parseInt(it.quantidade||it.qtd||1)),0)
  return (
    <div style={{ flex:1,overflowY:'auto' }}>
      <div style={{ padding:'9px 13px',borderBottom:`1px solid ${T.sep}`,
        display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <span style={{ fontSize:11,fontWeight:700,color:T.ink2 }}>{carrinho.length} {carrinho.length===1?'item':'itens'}</span>
        <span style={{ fontSize:14,fontWeight:800,color:T.green }}>R$ {total.toFixed(2).replace('.',',')}</span>
      </div>
      {carrinho.map((it,i)=>{
        const qtd=parseInt(it.quantidade||it.qtd||1)
        const preco=parseFloat(it.preco||it.precoVenda||0)
        return (
          <div key={i} style={{ padding:'9px 13px',borderBottom:`1px solid ${T.sep}`,display:'flex',gap:9 }}>
            <div style={{ width:36,height:36,borderRadius:7,flexShrink:0,overflow:'hidden',
              background:T.bg3,border:`1px solid ${T.sep}`,
              display:'flex',alignItems:'center',justifyContent:'center' }}>
              {it.imagem?<img src={it.imagem} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                :<ShoppingBag size={13} style={{ color:T.ink4 }}/>}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:11.5,fontWeight:600,color:T.ink1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{it.nome||it.descricao||'—'}</div>
              <div style={{ display:'flex',gap:7,marginTop:2 }}>
                <span style={{ fontSize:10,color:T.ink4 }}>{qtd}× R${preco.toFixed(2).replace('.',',')}</span>
                <span style={{ fontSize:10.5,fontWeight:700,color:T.amber }}>= R${(preco*qtd).toFixed(2).replace('.',',')}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}


function ModalPedido({ pedido, tel, api, onClose, pixKey }) {
  const [disparos,  setDisparos]  = useState([])
  const [copied,    setCopied]    = useState(null)
  const [linkLoad,  setLinkLoad]  = useState(false)
  const [enviando,  setEnviando]  = useState(null)
  const [envResult, setEnvResult] = useState({})

  useEffect(() => {
    if (!pedido) return
    fetch(`${api}/api/dashboard/disparos-pedido/${pedido.numero}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setDisparos(d.disparos || []) })
      .catch(() => {})
  }, [pedido?.numero, api])

  if (!pedido) return null

  const disparoMap = {}
  disparos.forEach(d => { disparoMap[d.gatilho] = d })

  const isPago     = !['Em Aberto','pendente','aberto','6','24'].includes(String(pedido.situacao_id || pedido.situacao || '').toLowerCase())
  const isPendente = ['Em Aberto','pendente','aberto','6','24'].includes(String(pedido.situacao_id || pedido.situacao || '').toLowerCase())
  const temRastreio = pedido.rastreio && pedido.rastreio !== '—'
  const temNFe      = !!pedido.nfe_link

  const copiar = (txt, k) => { copyText(txt); setCopied(k); setTimeout(() => setCopied(null), 2000) }

  const gerarLinkMP = async () => {
    setLinkLoad(true)
    try {
      const r = await fetch(`${api}/api/dashboard/mp-link-pagamento`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone:tel, numero_pedido:pedido.numero,
          valor: parseFloat((pedido.total||'0').replace(/[R$\s.]/g,'').replace(',','.').trim())||0,
          descricao: `Pedido #${pedido.numero}` })
      })
      const d = await r.json()
      if (d.init_point) { copyText(d.init_point); window.open(d.init_point,'_blank') }
    } catch {}
    setLinkLoad(false)
  }

  const enviarTemplate = async (gatilho) => {
    setEnviando(gatilho)
    try {
      const r = await fetch(`${api}/api/templates/disparar-gatilho`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatilho, telefone: tel,
          variaveis: {
            '{{numero_pedido}}':     pedido.numero,
            '{{nome_cliente}}':      pedido.cliente || pedido.nome || '',
            '{{primeiro_nome}}':     (pedido.cliente||pedido.nome||'').split(' ')[0],
            '{{valor_total}}':       pedido.total || '',
            '{{codigo_rastreio}}':   pedido.rastreio || '',
            '{{transportadora}}':    pedido.transportadora || '',
            '{{link_acompanhamento}}': pedido.rastreio ? `https://rastreio.sostrass.com.br/p/${pedido.rastreio}` : '',
            '{{link_nfe}}':          pedido.nfe_link || '',
            '{{numero_nfe}}':        pedido.nfe_numero || '',
            '{{forma_pagamento}}':   pedido.forma_pagamento || '',
          }
        })
      })
      const d = await r.json()
      setEnvResult(p => ({ ...p, [gatilho]: d.ok ? 'ok' : 'erro' }))
      setTimeout(() => setEnvResult(p => { const n={...p}; delete n[gatilho]; return n }), 3500)
    } catch {
      setEnvResult(p => ({ ...p, [gatilho]: 'erro' }))
      setTimeout(() => setEnvResult(p => { const n={...p}; delete n[gatilho]; return n }), 3500)
    }
    setEnviando(null)
  }

  // ── Horizontal Journey Timeline — avaliação independente por step ──────────
  const sitId  = pedido.situacao_id
  const sitStr = String(pedido.situacao||'').toLowerCase()
  const temNFeModal = !!(pedido.nfe_link || pedido.nfe_numero)

  const MODAL_PAGO = [9, 15, 24, 27, 30, 14]
  const modalStepFeito = [
    true,                                                               // 0 criado
    MODAL_PAGO.includes(sitId),                                        // 1 pago
    [9, 24, 27, 30].includes(sitId),                                   // 2 separação
    temNFeModal || sitId === 24,                                       // 3 nf-e — só se existe
    temRastreio || [27, 30].includes(sitId),                           // 4 enviado
    temRastreio,                                                       // 5 trânsito
    temRastreio && (sitStr.includes('saiu') || !!disparoMap['saiu_entrega']),   // 6 saiu
    sitId === 30 || sitStr.includes('entregue') || !!disparoMap['pedido_entregue'], // 7 entregue
  ]

  let stepAtual = 0
  modalStepFeito.forEach((f, i) => { if (f) stepAtual = i })

  const STEPS_H = [
    { g:'pedido_criado',        lbl:'Criado',     cor:'#00d4aa', Icon:ShoppingBag  },
    { g:'pagamento_aprovado',   lbl:'Pago',       cor:T.blue,    Icon:CreditCard   },
    { g:'em_separacao',         lbl:'Separação',  cor:T.purple,  Icon:Package      },
    { g:'nfe_emitida',          lbl:'NF-e',       cor:T.cyan,    Icon:FileText     },
    { g:'pedido_enviado',       lbl:'Enviado',     cor:'#a78bfa', Icon:Truck        },
    { g:'rastreio_em_transito', lbl:'Trânsito',   cor:T.blue,    Icon:Radio        },
    { g:'saiu_entrega',         lbl:'Saiu',        cor:T.amber,   Icon:Truck        },
    { g:'pedido_entregue',      lbl:'Entregue',   cor:T.green,   Icon:CheckCircle  },
  ]

  const BTNS_TEMPLATE = [
    { gatilho:'pedido_criado',        lbl:'📦 Resumo',           show:true              },
    { gatilho:'nfe_emitida',          lbl:'📄 NF-e',             show:temNFe            },
    { gatilho:'rastreio_em_transito', lbl:'🚚 Rastreio',         show:temRastreio       },
    { gatilho:'pedido_entregue',      lbl:'✅ Entregue',         show: sitId===30 || sitStr.includes('entregue') },
    { gatilho:'avaliar_pedido',       lbl:'⭐ Avaliação',        show: sitId===30 || sitStr.includes('entregue') },
    { gatilho:'pagamento_pendente',   lbl:'💳 Lembrar pag.',     show:isPendente        },
  ].filter(b => b.show)

  return (
    <>
      <div onClick={onClose}
        style={{ position:'fixed', inset:0, zIndex:8000,
          background:'rgba(0,0,0,.6)', backdropFilter:'blur(5px)' }}/>

      <div style={{ position:'fixed', top:0, right:0, bottom:0, zIndex:8001,
        width:500, display:'flex', flexDirection:'column',
        background:`linear-gradient(180deg,${T.bg1},${T.bg0})`,
        borderLeft:`1px solid ${T.sep2}`,
        boxShadow:'-32px 0 80px rgba(0,0,0,.7)' }}>

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div style={{ padding:'14px 18px 10px', borderBottom:`1px solid ${T.sep}`,
          background:`linear-gradient(135deg,${T.green}08,transparent)`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:T.green, letterSpacing:'-.04em',
                textShadow:`0 0 30px ${T.green}40` }}>#{pedido.numero}</div>
              <div style={{ fontSize:12, color:T.ink4 }}>{pedido.data}</div>
              {pedido.numero_loja && (
                <div style={{ fontSize:10, color:T.ink4 }}>Loja #{pedido.numero_loja}</div>
              )}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ padding:'4px 11px', borderRadius:99, fontSize:11, fontWeight:700,
                background: isPago ? T.greenDim : T.amberDim,
                border:`1px solid ${isPago ? T.greenBor : T.amberBor}`,
                color: isPago ? T.green : T.amber }}>
                {isPago ? '✅ Pago' : `⏳ ${pedido.status_pagamento || pedido.situacao || 'Pendente'}`}
              </span>
              <button onClick={onClose}
                style={{ width:28, height:28, borderRadius:8, border:`1px solid ${T.sep2}`,
                  background:'rgba(255,255,255,.04)', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', color:T.ink4 }}>
                <X size={13}/>
              </button>
            </div>
          </div>
          <div style={{ fontSize:20, fontWeight:900, color:T.ink1, letterSpacing:'-.02em', marginBottom:8 }}>
            {pedido.total || '—'}
          </div>

          {/* Horizontal Timeline */}
          <div style={{ overflowX:'auto', paddingBottom:4 }}>
            <div style={{ display:'flex', alignItems:'flex-start', minWidth:'max-content' }}>
              {STEPS_H.map((step, i) => {
                const feito = modalStepFeito[i] ?? false, atual = i === stepAtual
                const d = disparoMap[step.g]
                const Ic = step.Icon
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:58 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%',
                        background:feito?`${step.cor}20`:T.bg4,
                        border:`2px solid ${feito?step.cor:T.sep2}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:atual?`0 0 12px ${step.cor}70`:'none' }}>
                        <Ic size={11} style={{ color:feito?step.cor:T.ink4 }}/>
                      </div>
                      <span style={{ fontSize:8, color:feito?step.cor:T.ink4,
                        fontWeight:atual?700:400, whiteSpace:'nowrap' }}>
                        {step.lbl}
                      </span>
                      {d && <span style={{ fontSize:7.5, fontWeight:700,
                        color:d.status==='enviado'?T.green:T.red }}>
                        {d.status==='enviado'?'✓':'✗'} WA
                      </span>}
                    </div>
                    {i < STEPS_H.length-1 && (
                      <div style={{ width:14, height:2, margin:'0 1px', marginBottom:16, flexShrink:0,
                        background:i<stepAtual?`linear-gradient(90deg,${step.cor},${STEPS_H[i+1].cor})`:T.sep,
                        borderRadius:99 }}/>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Badges de template */}
          {BTNS_TEMPLATE.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8,
              padding:'8px 10px', borderRadius:10,
              background:`${T.purple}08`, border:`1px solid ${T.purpleBor}` }}>
              <span style={{ fontSize:9, fontWeight:700, color:T.purple,
                textTransform:'uppercase', letterSpacing:'.05em', width:'100%', marginBottom:3 }}>
                ⚡ Enviar via WhatsApp
              </span>
              {BTNS_TEMPLATE.map(({ gatilho, lbl }) => {
                const res = envResult[gatilho], loading = enviando===gatilho
                return (
                  <button key={gatilho}
                    onClick={() => !loading && !res && enviarTemplate(gatilho)}
                    disabled={loading || !!res}
                    style={{ display:'flex', alignItems:'center', gap:5,
                      padding:'5px 11px', borderRadius:8, cursor:'pointer',
                      fontSize:11, fontWeight:700,
                      border:`1px solid ${res==='ok'?T.greenBor:res==='erro'?T.redBor:`${T.purple}40`}`,
                      background:res==='ok'?T.greenDim:res==='erro'?T.redDim:`${T.purple}10`,
                      color:res==='ok'?T.green:res==='erro'?T.red:T.purple }}>
                    {loading?<RefreshCw size={10} style={{ animation:'cv-spin 1s linear infinite' }}/>:
                     res==='ok'?<Check size={10}/>:res==='erro'?<X size={10}/>:<Send size={10}/>}
                    {loading?'Enviando...':res==='ok'?'Enviado!':res==='erro'?'Falhou':lbl}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── SCROLL ─────────────────────────────────────────────── */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 18px', display:'flex', flexDirection:'column', gap:10 }}>

          {/* Cliente */}
          {(pedido.cliente || pedido.nome || pedido.email || pedido.endereco) && (
            <div style={{ padding:'11px 13px', borderRadius:12, background:T.bg3, border:`1px solid ${T.sep}` }}>
              <div style={{ fontSize:9, fontWeight:700, color:T.ink4, textTransform:'uppercase',
                letterSpacing:'.06em', marginBottom:8 }}>👤 Cliente</div>
              {(pedido.cliente||pedido.nome) && (
                <div style={{ fontSize:14, fontWeight:800, color:T.ink1, marginBottom:5 }}>
                  {pedido.cliente||pedido.nome}
                </div>
              )}
              {tel && (
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:T.ink3, marginBottom:3 }}>
                  <Phone size={10} style={{ color:T.ink4 }}/>{tel}
                  <button onClick={()=>copiar(tel,'tel')}
                    style={{ background:'none', border:'none', cursor:'pointer', color:T.ink4 }}>
                    {copied==='tel'?<Check size={10} style={{ color:T.green }}/>:<Copy size={10}/>}
                  </button>
                </div>
              )}
              {pedido.email && pedido.email!=='—' && (
                <div style={{ fontSize:11, color:T.ink4, marginBottom:3 }}>✉ {pedido.email}</div>
              )}
              {pedido.endereco && pedido.endereco!=='—' && (
                <div style={{ fontSize:10.5, color:T.ink4, lineHeight:1.5 }}>📍 {pedido.endereco}</div>
              )}
            </div>
          )}

          {/* Ações rápidas */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            <button onClick={() => copiar(`https://rastreio.sostrass.com.br/pedido/${pedido.numero}`,'link')}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 11px',
                borderRadius:9, border:`1px solid ${T.cyanBor}`, background:T.cyanDim,
                color:T.cyan, cursor:'pointer', fontSize:11, fontWeight:700 }}>
              {copied==='link'?<Check size={10}/>:<Copy size={10}/>}
              {copied==='link'?'Copiado!':'Link do pedido'}
            </button>
            {temRastreio && (
              <button onClick={() => window.open(`https://rastreio.sostrass.com.br/p/${pedido.rastreio}`,'_blank')}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 11px',
                  borderRadius:9, border:`1px solid ${T.purpleBor}`, background:T.purpleDim,
                  color:T.purple, cursor:'pointer', fontSize:11, fontWeight:700 }}>
                <ExternalLink size={10}/> Rastrear
              </button>
            )}
            {temNFe && (
              <button onClick={() => window.open(pedido.nfe_link,'_blank')}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 11px',
                  borderRadius:9, border:`1px solid ${T.blueBor}`, background:T.blueDim,
                  color:T.blue, cursor:'pointer', fontSize:11, fontWeight:700 }}>
                <FileText size={10}/> NF-e
              </button>
            )}
            {isPendente && pixKey && (
              <button onClick={() => copiar(pixKey,'pix')}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 11px',
                  borderRadius:9, border:`1px solid ${T.greenBor}`, background:T.greenDim,
                  color:T.green, cursor:'pointer', fontSize:11, fontWeight:700 }}>
                {copied==='pix'?<Check size={10}/>:<Copy size={10}/>}
                {copied==='pix'?'PIX copiado!':'Copiar PIX'}
              </button>
            )}
            {isPendente && (
              <button onClick={gerarLinkMP} disabled={linkLoad}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 11px',
                  borderRadius:9, border:`1px solid ${T.amberBor}`, background:T.amberDim,
                  color:T.amber, cursor:'pointer', fontSize:11, fontWeight:700, opacity:linkLoad?.6:1 }}>
                {linkLoad?<RefreshCw size={10} style={{ animation:'cv-spin 1s linear infinite' }}/>:<CreditCard size={10}/>}
                {linkLoad?'Gerando...':'Cartão (MP)'}
              </button>
            )}
          </div>

          {/* Rastreio */}
          {temRastreio && (
            <div style={{ padding:'11px 13px', borderRadius:12, background:T.bg3, border:`1px solid ${T.sep}` }}>
              <div style={{ fontSize:9, fontWeight:700, color:T.ink4, textTransform:'uppercase',
                letterSpacing:'.06em', marginBottom:7 }}>🚚 Rastreio</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ fontFamily:'monospace', fontSize:14, fontWeight:800, color:T.purple }}>
                  {pedido.rastreio}
                </span>
                <button onClick={() => copiar(pedido.rastreio,'cod')}
                  style={{ background:'none', border:'none', cursor:'pointer', color:T.ink4 }}>
                  {copied==='cod'?<Check size={11} style={{ color:T.green }}/>:<Copy size={11}/>}
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {[
                  ['Transportadora', pedido.transportadora],
                  ['Status',         pedido.ultimo_status || pedido.situacao],
                  ['Data postagem',  pedido.data_postagem],
                  ['Data entrega',   pedido.data_entrega],
                ].filter(([,v]) => v && v!=='—').map(([l,v]) => (
                  <div key={l}>
                    <div style={{ fontSize:9, color:T.ink4, marginBottom:2 }}>{l}</div>
                    <div style={{ fontSize:11.5, fontWeight:600, color:T.ink2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NF-e */}
          {temNFe && (
            <div style={{ padding:'11px 13px', borderRadius:12, background:T.bg3, border:`1px solid ${T.sep}` }}>
              <div style={{ fontSize:9, fontWeight:700, color:T.ink4, textTransform:'uppercase',
                letterSpacing:'.06em', marginBottom:7 }}>📄 Nota Fiscal</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {pedido.nfe_numero && (
                  <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:T.blue }}>
                    NF-e {pedido.nfe_numero}
                  </span>
                )}
                <button onClick={() => window.open(pedido.nfe_link,'_blank')}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px',
                    borderRadius:7, border:`1px solid ${T.blueBor}`, background:T.blueDim,
                    color:T.blue, cursor:'pointer', fontSize:10, fontWeight:700 }}>
                  <ExternalLink size={9}/> Abrir NF-e
                </button>
              </div>
            </div>
          )}

          {/* Resumo Financeiro */}
          <div style={{ padding:'11px 13px', borderRadius:12, background:T.bg3, border:`1px solid ${T.sep}` }}>
            <div style={{ fontSize:9, fontWeight:700, color:T.ink4, textTransform:'uppercase',
              letterSpacing:'.06em', marginBottom:8 }}>💰 Resumo Financeiro</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
              {[
                ['Forma de pag.',    pedido.forma_pagamento],
                ['Frete',            pedido.frete],
                ['Status pag.',      pedido.status_pagamento],
                ['Total',            pedido.total],
              ].filter(([,v]) => v && v!=='—').map(([l,v]) => (
                <div key={l} style={{ padding:'7px 9px', borderRadius:8, background:T.bg4 }}>
                  <div style={{ fontSize:9, color:T.ink4, marginBottom:2 }}>{l}</div>
                  <div style={{ fontSize:12, fontWeight:700,
                    color:l==='Total'?T.green:l==='Status pag.'?(v==='Pago'?T.green:T.amber):T.ink1 }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Produtos */}
          {pedido.itens?.length > 0 && (
            <div style={{ padding:'11px 13px', borderRadius:12, background:T.bg3, border:`1px solid ${T.sep}` }}>
              <div style={{ fontSize:9, fontWeight:700, color:T.ink4, textTransform:'uppercase',
                letterSpacing:'.06em', marginBottom:8 }}>
                🛍️ Produtos ({pedido.itens.length})
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {pedido.itens.map((it, i) => {
                  const preco = parseFloat(String(it.preco||'0').replace(/[R$\s]/g,'').replace(',','.')) || 0
                  const qtd   = parseInt(it.qtd||it.quantidade||1)
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:9,
                      padding:'8px 10px', borderRadius:9, background:T.bg4 }}>
                      <div style={{ width:36, height:36, borderRadius:8, flexShrink:0,
                        background:`${T.purple}15`, border:`1px solid ${T.purpleBor}`,
                        display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                        {it.imagem
                          ? <img src={it.imagem} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}
                              onError={e => { e.target.style.display='none' }}/>
                          : <ShoppingBag size={13} style={{ color:T.purple }}/>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:11.5, fontWeight:600, color:T.ink1,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {it.nome}
                        </div>
                        <div style={{ fontSize:10, color:T.ink4, marginTop:1 }}>
                          {it.codigo && `${it.codigo} · `}{qtd}× · R$ {preco.toFixed(2).replace('.',',')}
                        </div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:800, color:T.amber, flexShrink:0 }}>
                        R$ {(preco*qtd).toFixed(2).replace('.',',')}
                      </div>
                    </div>
                  )
                })}
                {/* Total */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'8px 10px', borderRadius:9,
                  background:`${T.green}08`, border:`1px solid ${T.greenBor}` }}>
                  <span style={{ fontSize:12, fontWeight:700, color:T.ink3 }}>Total do pedido</span>
                  <span style={{ fontSize:16, fontWeight:900, color:T.green }}>{pedido.total}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}


function InputBar({ api, tel, onEnviar, onEnviarMidia, enviando, disabled, rapidas: rapidasProp }) {
  const [txt,    setTxt]    = useState('')
  const [rp,     setRp]     = useState(false)
  const [sug,    setSug]    = useState([])     // sugestões da IA
  const [loadSug,setLoadSug]= useState(false)
  const [preview,setPreview]= useState(null)   // { url, tipo, file, nome }
  const ref     = useRef()
  const fileRef = useRef()

  const enviar = () => {
    if (preview) {
      onEnviarMidia(preview.file, preview.tipo)
      setPreview(null); return
    }
    if (!txt.trim()||enviando||disabled) return
    onEnviar(txt.trim()); setTxt(''); ref.current?.focus()
  }

  const buscarSugestao = async () => {
    if (!tel||loadSug) return
    setLoadSug(true)
    try {
      const r = await fetch(`${api}/api/dashboard/sugestoes/${tel}`)
      const d = await r.json()
      setSug(d.sugestoes||[])
    } catch {}
    setLoadSug(false)
  }

  const onFileChange = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = URL.createObjectURL(f)
    const t   = f.type.startsWith('image')?'image':f.type.startsWith('video')?'video':'audio'
    setPreview({ url, tipo:t, file:f, nome:f.name })
    e.target.value=''
  }

  return (
    <div style={{ padding:'10px 14px',borderTop:`1px solid ${T.sep}`,
      background:T.bg2,position:'relative' }}>

      {/* Respostas rápidas */}
      {rp && (
        <div style={{ position:'absolute',bottom:'100%',left:14,right:14,marginBottom:6,
          background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:14,overflow:'hidden',
          boxShadow:'0 -12px 32px rgba(0,0,0,.5)',animation:'cv-fadeUp .15s ease' }}>
          <div style={{ padding:'6px 12px',borderBottom:`1px solid ${T.sep}`,
            fontSize:9.5,fontWeight:700,color:T.ink4,textTransform:'uppercase',letterSpacing:'.08em' }}>
            Respostas rápidas
          </div>
          {(rapidasProp||RAPIDAS_DEFAULT||[]).map((r,i)=>(
            <button key={i} onClick={()=>{ setTxt(r); setRp(false); setSug([]); ref.current?.focus() }}
              style={{ display:'block',width:'100%',padding:'9px 14px',textAlign:'left',border:'none',
                cursor:'pointer',background:'transparent',color:T.ink2,fontSize:12,
                borderBottom:i<(rapidasProp||RAPIDAS_DEFAULT||[]).length-1?`1px solid ${T.sep}`:'none',transition:'background .1s' }}
              onMouseEnter={e=>e.currentTarget.style.background=T.gray}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Sugestões da IA */}
      {sug.length>0 && (
        <div style={{ marginBottom:8,display:'flex',flexDirection:'column',gap:5 }}>
          <div style={{ fontSize:9.5,fontWeight:700,color:T.purple,textTransform:'uppercase',
            letterSpacing:'.07em',display:'flex',alignItems:'center',gap:5 }}>
            <Bot size={9}/> Molise sugere:
          </div>
          {sug.map((s,i)=>(
            <button key={i}
              onClick={()=>{ setTxt(s); setSug([]); ref.current?.focus() }}
              style={{ padding:'8px 12px',borderRadius:9,textAlign:'left',
                background:T.purpleDim,border:`1px solid ${T.purpleBor}`,
                color:T.ink2,cursor:'pointer',fontSize:12,lineHeight:1.55,
                transition:'background .13s' }}
              onMouseEnter={e=>e.currentTarget.style.background=`${T.purple}20`}
              onMouseLeave={e=>e.currentTarget.style.background=T.purpleDim}>
              {s}
            </button>
          ))}
          <button onClick={()=>setSug([])}
            style={{ alignSelf:'flex-end',fontSize:10,color:T.ink4,background:'none',
              border:'none',cursor:'pointer' }}>
            Ignorar
          </button>
        </div>
      )}

      {/* Preview de mídia */}
      {preview && (
        <div style={{ marginBottom:8,display:'flex',alignItems:'center',gap:10,
          padding:'8px 10px',borderRadius:10,
          background:T.bg3,border:`1px solid ${T.sep}` }}>
          {preview.tipo==='image'&&<img src={preview.url} alt="" style={{ height:48,borderRadius:7,objectFit:'cover' }}/>}
          {preview.tipo==='video'&&<video src={preview.url} style={{ height:48,borderRadius:7 }}/>}
          {preview.tipo==='audio'&&<div style={{ display:'flex',alignItems:'center',gap:6,color:T.green }}>
            <Mic size={18}/><span style={{ fontSize:11,color:T.ink3 }}>Áudio selecionado</span>
          </div>}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11.5,color:T.ink1,fontWeight:600 }}>{preview.nome}</div>
            <div style={{ fontSize:10,color:T.ink4 }}>
              {preview.tipo==='image'?'Imagem':preview.tipo==='video'?'Vídeo':'Áudio'} — clique em enviar
            </div>
          </div>
          <button onClick={()=>setPreview(null)}
            style={{ background:'none',border:'none',cursor:'pointer',color:T.red,display:'flex' }}>
            <X size={14}/>
          </button>
        </div>
      )}

      <div style={{ display:'flex',alignItems:'flex-end',gap:6 }}>
        {/* Respostas rápidas */}
        <button onClick={()=>{ setRp(v=>!v); setSug([]) }}
          style={{ width:32,height:32,borderRadius:9,border:`1px solid ${rp?T.purpleBor:T.sep2}`,
            background:rp?T.purpleDim:'transparent',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
            color:rp?T.purple:T.ink4,flexShrink:0,transition:'all .14s' }}
          title="Respostas rápidas">
          <Zap size={12}/>
        </button>

        {/* Sugestão IA */}
        <button onClick={buscarSugestao} disabled={disabled||loadSug}
          style={{ width:32,height:32,borderRadius:9,border:`1px solid ${T.sep2}`,
            background:'transparent',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
            color:loadSug?T.purple:T.ink4,flexShrink:0,transition:'all .14s',
            opacity:disabled?.4:1 }}
          title="Sugerir resposta com Molise">
          {loadSug
            ? <RefreshCw size={12} style={{ animation:'cv-spin 1s linear infinite',color:T.purple }}/>
            : <Lightbulb size={12}/>}
        </button>

        {/* Upload de mídia */}
        <input ref={fileRef} type="file" accept="image/*,video/*,audio/*"
          style={{ display:'none' }} onChange={onFileChange}/>
        <button onClick={()=>fileRef.current?.click()}
          style={{ width:32,height:32,borderRadius:9,border:`1px solid ${T.sep2}`,
            background:'transparent',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
            color:T.ink4,flexShrink:0,transition:'all .14s' }}
          title="Enviar imagem, vídeo ou áudio">
          <Paperclip size={12}/>
        </button>

        {/* Textarea */}
        <textarea ref={ref} value={txt}
          onChange={e=>setTxt(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar()} }}
          onInput={e=>{ e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
          disabled={disabled&&!preview} rows={1}
          placeholder={preview?'Pressione enviar para enviar o arquivo...':disabled?'Molise está respondendo...':'Mensagem... (Enter para enviar)'}
          style={{ flex:1,padding:'9px 12px',borderRadius:10,resize:'none',background:T.bg1,
            border:`1px solid ${T.sep2}`,color:T.ink1,fontSize:13.5,lineHeight:1.5,outline:'none',
            fontFamily:'inherit',boxSizing:'border-box',maxHeight:120,overflowY:'auto',
            opacity:disabled&&!preview?.5:1,transition:'border-color .15s' }}
          onFocus={e=>e.target.style.borderColor=`${T.purple}50`}
          onBlur={e=>e.target.style.borderColor=T.sep2}/>

        <button onClick={enviar}
          disabled={!txt.trim()&&!preview||enviando||disabled&&!preview}
          style={{ width:38,height:38,borderRadius:10,border:'none',cursor:'pointer',
            flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
            background:(txt.trim()||preview)&&!(disabled&&!preview)?`linear-gradient(135deg,${T.green},${T.green}cc)`:'rgba(255,255,255,.08)',
            color:(txt.trim()||preview)&&!(disabled&&!preview)?'#000':T.ink4,
            boxShadow:(txt.trim()||preview)&&!(disabled&&!preview)?`0 3px 14px ${T.green}35`:undefined,
            transition:'all .16s' }}>
          {enviando?<RefreshCw size={14} style={{ animation:'cv-spin 1s linear infinite' }}/>:<Send size={14}/>}
        </button>
      </div>
    </div>
  )
}


export default function PageConversas({ api='' }) {
  const [conversas, setConversas] = useState([])
  const [sel,       setSel]       = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [carrinho,  setCarrinho]  = useState([])
  const [loadConv,  setLoadConv]  = useState(true)
  const [loadMsg,   setLoadMsg]   = useState(false)
  const [enviando,  setEnviando]  = useState(false)
  const [busca,     setBusca]     = useState('')
  const [filtro,    setFiltro]    = useState('todos')
  const [showPanel, setShowPanel] = useState(true)
  const [statusMenu,setStatusMenu]= useState(false)
  const [pixKey,    setPixKey]    = useState('')
  const [toast,     setToast]     = useState(null)
  const [resetConf, setResetConf] = useState(false)
  const [pedidosAtivos, setPedidosAtivos] = useState([])  // pedidos do cliente selecionado
  const [cmdK, setCmdK] = useState(false)  // Command Palette ⌘K
  const [rapidas, setRapidas] = useState([
    'Olá! Como posso ajudar? 😊',
    'Vou verificar isso agora para você.',
    'Pode me informar o número do seu pedido?',
    'O prazo de entrega é de 3 a 7 dias úteis.',
    'Pagando via PIX você tem 10% de desconto automático! 💰',
    'Vou transferir para nossa equipe. Um momento!',
  ])  // carregadas do backend
  const [intencaoEdit, setIntencaoEdit] = useState(null)  // { tipo, pedido, campo, valor }
  const [editPedidoOpen, setEditPedidoOpen] = useState(false)
  const [heatmapOpen,    setHeatmapOpen]   = useState(false)
  const [resetting, setResetting] = useState(false)

  const prevStatusRef = useRef({})
  const bottomRef     = useRef()

  useEffect(()=>{
    fetch(`${api}/api/dashboard/pix-key`).then(r=>r.ok?r.json():null)
      .then(d=>{ if(d?.chave) setPixKey(d.chave) }).catch(()=>{})
    // Carregar respostas rápidas do ia_config
    fetch(`${api}/api/ia/config`).then(r=>r.ok?r.json():null)
      .then(d=>{
        if(d?.respostas_rapidas) {
          try { setRapidas(JSON.parse(d.respostas_rapidas)) } catch {}
        }
      }).catch(()=>{})
  },[api])

  const fetchConversas = useCallback(async()=>{
    try {
      const r=await fetch(`${api}/api/dashboard/conversas`,{signal:AbortSignal.timeout(6000)})
      if(!r.ok) return
      const d=await r.json(); const lista=d.conversas||[]
      lista.forEach(c=>{
        const prev=prevStatusRef.current[c.telefone]; const curr=c.status_atendimento
        if(prev&&['resolvido','encerrado'].includes(prev)&&curr==='pendente'){
          setToast({tel:c.telefone,nome:c.nome_wa||c.nome||c.telefone})
          setTimeout(()=>setToast(null),5000)
        }
        prevStatusRef.current[c.telefone]=curr
      })
      setConversas(lista)
    } catch {} finally { setLoadConv(false) }
  },[api])

  const fetchMensagens = useCallback(async(tel, loader=false)=>{
    if(!tel) return
    if(loader) setLoadMsg(true)
    try {
      const r=await fetch(`${api}/api/dashboard/historico/${tel}?limit=100`,{signal:AbortSignal.timeout(8000)})
      if(!r.ok) return
      const d=await r.json()
      setMensagens(d.mensagens||[])
      setCarrinho(d.carrinho||[])
      if(d.modo) setConversas(cs=>cs.map(c=>c.telefone===tel?{...c,modo_ia:d.modo}:c))
    } catch {} finally { if(loader) setLoadMsg(false) }
  },[api])

  useEffect(()=>{ fetchConversas(); const iv=setInterval(fetchConversas,20000); return()=>clearInterval(iv) },[fetchConversas])

  // ⌘K / Ctrl+K para abrir Command Palette
  useEffect(()=>{
    const fn = e => {
      if ((e.metaKey||e.ctrlKey) && e.key==='k') { e.preventDefault(); setCmdK(v=>!v) }
      if (e.key==='Escape') setCmdK(false)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])
  useEffect(()=>{
    if(!sel){ setMensagens([]); setCarrinho([]); return }
    fetchMensagens(sel,true)
    const iv=setInterval(()=>fetchMensagens(sel,false),8000)
    // Busca pedidos para o Order Context Banner
    if (sel) {
      fetch(`${api}/api/dashboard/contatos/${sel}/pedidos`)
        .then(r=>r.ok?r.json():null)
        .then(d=>{ if(d) setPedidosAtivos(d.pedidos||[]) })
        .catch(()=>{})
    }
    return()=>clearInterval(iv)
  },[sel]) // eslint-disable-line

  useEffect(()=>{ if(mensagens.length) bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[mensagens.length])

  // Feature 2: Detectar intenção de alteração de pedido nas últimas mensagens
  useEffect(() => {
    if (!mensagens.length) return
    const intencao = detectarIntencao(mensagens)
    setIntencaoEdit(intencao || null)
  }, [mensagens])

  const enviar=async(txt)=>{
    if(!sel) return; setEnviando(true)
    const tmp={id:`tmp-${Date.now()}`,telefone:sel,conteudo:txt,direcao:'saida',modo:'manual',criado_em:new Date().toISOString()}
    setMensagens(p=>[...p,tmp])
    await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:sel,mensagem:txt})}).catch(()=>{})
    setTimeout(()=>fetchMensagens(sel,false),1500)
    setEnviando(false)
  }

  const enviarMidia=async(file, tipo)=>{
    if(!sel) return; setEnviando(true)
    try {
      const fd=new FormData(); fd.append('arquivo',file); fd.append('telefone',sel); fd.append('tipo',tipo)
      await fetch(`${api}/api/dashboard/mensagem-media`,{method:'POST',body:fd})
      setTimeout(()=>fetchMensagens(sel,false),2000)
    } catch {}
    setEnviando(false)
  }

  const toggleModo=async(ativarIA)=>{
    if(!sel) return
    setConversas(cs=>cs.map(c=>c.telefone===sel?{...c,modo_ia:ativarIA?'ia':'manual'}:c))
    await fetch(`${api}/api/dashboard/manual/${sel}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ativo:!ativarIA})}).catch(()=>{})
  }

  const mudarStatus=async(st)=>{
    if(!sel) return
    setConversas(cs=>cs.map(c=>c.telefone===sel?{...c,status_atendimento:st}:c))
    await fetch(`${api}/api/dashboard/status/${sel}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:st})}).catch(()=>{})
    setStatusMenu(false)
  }

  const resetar=async()=>{
    if(!sel||resetting) return; setResetting(true)
    await fetch(`${api}/api/dashboard/resetar-sessao`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:sel})}).catch(()=>{})
    setMensagens([]); setCarrinho([]); setResetConf(false); setResetting(false)
  }

  const convFilt=conversas.filter(c=>{
    if(busca){ const q=busca.toLowerCase(); if(![(c.nome_wa||c.nome||'').toLowerCase(),c.telefone||'',(c.ultima_mensagem||'').toLowerCase()].some(s=>s.includes(q))) return false }
    if(filtro==='ia')       return c.modo_ia!=='manual'
    if(filtro==='manual')   return c.modo_ia==='manual'
    if(filtro==='pendente') return c.status_atendimento==='pendente'
    if(filtro==='resolvido')return c.status_atendimento==='resolvido'
    if(filtro==='risco') {
      const min = c.ultima_atividade ? Math.floor((Date.now()-new Date(c.ultima_atividade))/60000) : 999
      return (c.itens_carrinho||0)>0 && min>25 && c.status_atendimento!=='resolvido'
    }
    return true
  })

  const convAtiva=conversas.find(c=>c.telefone===sel)||null
  const isIA=convAtiva?.modo_ia!=='manual'
  const sc=STATUS_CFG[convAtiva?.status_atendimento]||STATUS_CFG.pendente
  const cor=convAtiva?avatarCor(convAtiva.nome_wa||convAtiva.nome||convAtiva.telefone):T.ink4
  const nomeExib=convAtiva?(convAtiva.nome_wa||convAtiva.nome||convAtiva.telefone):''

  const grouped=[]
  let lastDate=null
  mensagens.forEach(m=>{
    const d=new Date(m.criado_em).toDateString()
    if(d!==lastDate){ grouped.push({type:'date',date:m.criado_em}); lastDate=d }
    grouped.push({type:'msg',msg:m})
  })

  const FILTROS=[
    {id:'todos',   lbl:'Todos',    Icon:Users,        n:conversas.length},
    {id:'ia',      lbl:'Molise',   Icon:Bot,          n:conversas.filter(c=>c.modo_ia!=='manual').length},
    {id:'manual',  lbl:'Humano',   Icon:User,         n:conversas.filter(c=>c.modo_ia==='manual').length},
    {id:'pendente',lbl:'Pendente', Icon:Clock,        n:conversas.filter(c=>c.status_atendimento==='pendente').length},
    {id:'resolvido',lbl:'Resolvido',Icon:CheckCircle, n:conversas.filter(c=>c.status_atendimento==='resolvido').length},
    {id:'risco',    lbl:'Abandono', Icon:Flame,        n:conversas.filter(c=>(c.itens_carrinho||0)>0&&c.ultima_atividade&&Math.floor((Date.now()-new Date(c.ultima_atividade))/60000)>25&&c.status_atendimento!=='resolvido').length},
  ]

  return (
    <div style={{ display:'flex',height:'100%',background:T.bg0,overflow:'hidden',fontFamily:'system-ui,sans-serif' }}>
      <style>{`
        @keyframes cv-spin   { to{transform:rotate(360deg)} }
        @keyframes cv-ping   { 0%{transform:scale(1);opacity:.5} 75%,100%{transform:scale(2.2);opacity:0} }
        @keyframes cv-fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cv-slideIn{ from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes cv-bg          { from{opacity:0} to{opacity:1} }
        @keyframes cv-ping-badge  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(1.1)} }
      `}</style>

      {/* Toast */}
      
      {/* Feature 2: Painel de Emenda de Pedido */}
      {editPedidoOpen && intencaoEdit && (
        <PainelEmendaPedido
          intencao={intencaoEdit}
          pedidos={pedidosAtivos}
          tel={sel}
          api={api}
          onClose={()=>setEditPedidoOpen(false)}
        />
      )}

      {/* Feature 4: Heatmap de Receita */}
      {heatmapOpen && (
        <HeatmapReceita api={api} onClose={()=>setHeatmapOpen(false)}/>
      )}

      {/* Command Palette ⌘K */}
      {cmdK && (
        <CommandPalette
          conversas={conversas} selTel={sel}
          onSelect={tel=>{ setSel(tel); setMensagens([]) }}
          onStatus={mudarStatus}
          onToggleModo={toggleModo}
          onClose={()=>setCmdK(false)}
        />
      )}

      {toast&&(
        <div style={{ position:'fixed',bottom:24,right:24,zIndex:9999,
          display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderRadius:14,
          background:`linear-gradient(135deg,${T.amber}22,${T.bg3})`,
          border:`1px solid ${T.amberBor}`,boxShadow:'0 12px 36px rgba(0,0,0,.5)',
          animation:'cv-slideIn .3s cubic-bezier(.2,.8,.2,1)' }}>
          <MessageSquare size={13} style={{ color:T.amber,flexShrink:0 }}/>
          <div>
            <div style={{ fontSize:12,fontWeight:700,color:T.ink1,marginBottom:2 }}>Conversa reaberta</div>
            <div style={{ fontSize:11,color:T.amber }}><strong>{toast.nome}</strong> enviou nova mensagem</div>
          </div>
          <button onClick={()=>{ setSel(toast.tel); setToast(null) }}
            style={{ padding:'4px 10px',borderRadius:7,border:`1px solid ${T.amberBor}`,
              background:T.amberDim,color:T.amber,cursor:'pointer',fontSize:11,fontWeight:700 }}>
            Ver →
          </button>
          <button onClick={()=>setToast(null)} style={{ background:'none',border:'none',cursor:'pointer',color:T.ink4,display:'flex' }}>
            <X size={12}/>
          </button>
        </div>
      )}

      {/* ── LISTA ──────────────────────────────────────────────────────── */}
      <aside style={{ width:290,flexShrink:0,display:'flex',flexDirection:'column',
        background:`linear-gradient(180deg,${T.bg2},${T.bg1})`,borderRight:`1px solid ${T.sep}` }}>

        {/* Header glassmorphism */}
        <div style={{ padding:'14px 13px 10px',borderBottom:`1px solid ${T.sep}`,
          background:'rgba(255,255,255,.02)',backdropFilter:'blur(12px)',
          WebkitBackdropFilter:'blur(12px)' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
            <div style={{ display:'flex',alignItems:'center',gap:7 }}>
              <div style={{ width:28,height:28,borderRadius:9,
                background:'rgba(167,139,250,.2)',border:`1px solid ${T.purpleBor}`,
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:`0 2px 10px ${T.purple}25` }}>
                <MessageSquare size={13} style={{ color:T.purple }}/>
              </div>
              <span style={{ fontSize:15,fontWeight:800,color:T.ink1,letterSpacing:'-.02em' }}>Conversas</span>
            </div>
            <button onClick={()=>setCmdK(true)} title="Command Palette ⌘K"
              style={{ display:'flex',alignItems:'center',gap:3,
                padding:'3px 8px',borderRadius:7,fontSize:9.5,
                border:`1px solid ${T.purpleBor}`,background:T.purpleDim,
                cursor:'pointer',color:T.purple,fontWeight:600 }}>
              <Command size={9}/> K
            </button>
            <button onClick={fetchConversas} style={{ width:26,height:26,borderRadius:7,
              border:`1px solid ${T.sep}`,background:'rgba(255,255,255,.04)',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',color:T.ink4 }}>
              <RefreshCw size={10}/>
            </button>
          </div>

          {/* Search */}
          <div style={{ position:'relative',marginBottom:10 }}>
            <Search size={11} style={{ position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:T.ink4,pointerEvents:'none' }}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar nome, telefone..."
              style={{ width:'100%',padding:'7px 9px 7px 28px',borderRadius:9,
                background:'rgba(255,255,255,.05)',backdropFilter:'blur(8px)',
                border:`1px solid rgba(255,255,255,.1)`,color:T.ink1,fontSize:12,outline:'none',
                fontFamily:'inherit',boxSizing:'border-box' }}/>
          </div>

          {/* Filtros — grade 2×3, tudo visível sem scroll */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4 }}>
            {FILTROS.map(f=>(
              <GlassFilter key={f.id} {...f} ativo={filtro===f.id} onClick={()=>setFiltro(f.id)}/>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex:1,overflowY:'auto',scrollbarWidth:'none' }}>
          {loadConv?<div style={{ textAlign:'center',padding:'28px 0',color:T.ink4 }}>
            <RefreshCw size={13} style={{ animation:'cv-spin 1s linear infinite' }}/>
          </div>:convFilt.length===0?<div style={{ textAlign:'center',padding:'28px 12px',color:T.ink4 }}>
            <Inbox size={18} style={{ display:'block',margin:'0 auto 8px',opacity:.12 }}/>
            <p style={{ fontSize:11.5,margin:0 }}>{busca?'Nenhuma encontrada':'Sem conversas'}</p>
          </div>:convFilt.map(c=>(
            <ConversaItem key={c.telefone} c={c} ativo={sel===c.telefone}
              onClick={()=>{ setSel(c.telefone); setMensagens([]) }}/>
          ))}
        </div>

        <div style={{ padding:'6px 13px',borderTop:`1px solid ${T.sep}`,
          background:'rgba(255,255,255,.02)',
          display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:5,fontSize:9.5,color:T.ink4 }}>
            <Dot cor={T.green} size={5}/> 20s
          </div>
          <span style={{ fontSize:9.5,color:T.ink4 }}>{conversas.length} conversas</span>
          <button onClick={()=>setCmdK(true)}
            style={{ fontSize:9,color:T.purple,background:'none',border:'none',
              cursor:'pointer',padding:'2px 6px',borderRadius:5,
              background:T.purpleDim }}><Command size={8}/> ⌘K</button>
          <button onClick={()=>setHeatmapOpen(true)} title="Heatmap de Receita"
            style={{ padding:'2px 6px',borderRadius:5,border:'none',
              background:T.greenDim,color:T.green,cursor:'pointer',fontSize:9 }}>
            <BarChart2 size={8}/>
          </button>
        </div>
      </aside>

      {/* ── THREAD ─────────────────────────────────────────────────────── */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',minWidth:0,borderRight:`1px solid ${T.sep}` }}>
        {!convAtiva?(
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:12,color:T.ink4 }}>
            <div style={{ width:60,height:60,borderRadius:18,background:T.purpleDim,border:`1px solid ${T.purpleBor}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <MessageSquare size={26} style={{ color:T.purple }}/>
            </div>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:14,fontWeight:700,color:T.ink2,margin:'0 0 5px' }}>Selecione uma conversa</p>
              <p style={{ fontSize:12,color:T.ink4,margin:0 }}>Escolha na lista à esquerda para atender</p>
            </div>
          </div>
        ):(
          <>
            {/* Header */}
            <div style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 14px',
              borderBottom:`1px solid ${T.sep}`,flexShrink:0,
              background:`linear-gradient(90deg,${cor}06,${T.bg2})` }}>
              <WaAvatar nome={nomeExib} foto={convAtiva.foto_perfil||''} size={36} cor={cor}/>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <span style={{ fontSize:13.5,fontWeight:700,color:T.ink1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{nomeExib}</span>
                  <span style={{ display:'inline-flex',alignItems:'center',gap:3,padding:'1px 6px',borderRadius:99,fontSize:9,fontWeight:700,
                    background:isIA?T.purpleDim:T.blueDim,color:isIA?T.purple:T.blue,border:`1px solid ${isIA?T.purpleBor:T.blueBor}` }}>
                    {isIA?<><Bot size={8}/> Molise</>:<><User size={8}/> Humano</>}
                  </span>
                </div>
                <div style={{ fontSize:9.5,color:T.ink4,fontFamily:'monospace' }}>{convAtiva.telefone}</div>
              </div>
              <div style={{ display:'flex',gap:5,flexShrink:0 }}>
                <button onClick={()=>toggleModo(!isIA)}
                  style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,
                    border:`1px solid ${isIA?T.purpleBor:T.blueBor}`,
                    background:isIA?T.purpleDim:T.blueDim,color:isIA?T.purple:T.blue,cursor:'pointer',fontSize:11,fontWeight:700 }}>
                  {isIA?<><Bot size={11}/>Molise</>:<><User size={11}/>Humano</>}
                </button>
                <div style={{ position:'relative' }}>
                  <button onClick={()=>setStatusMenu(v=>!v)}
                    style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,
                      border:`1px solid ${sc.cor}40`,background:`${sc.cor}12`,color:sc.cor,cursor:'pointer',fontSize:11,fontWeight:700 }}>
                    <sc.Icon size={11}/>{sc.lbl}<ChevronDown size={9}/>
                  </button>
                  {statusMenu&&(
                    <div style={{ position:'absolute',top:'calc(100% + 5px)',right:0,
                      background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,border:`1px solid ${T.sep2}`,
                      borderRadius:12,overflow:'hidden',boxShadow:'0 12px 36px rgba(0,0,0,.5)',
                      zIndex:100,minWidth:150 }} onMouseLeave={()=>setStatusMenu(false)}>
                      {Object.entries(STATUS_CFG).map(([k,v])=>(
                        <button key={k} onClick={()=>mudarStatus(k)}
                          style={{ display:'flex',alignItems:'center',gap:8,width:'100%',
                            padding:'9px 13px',border:'none',cursor:'pointer',
                            background:'transparent',color:v.cor,fontSize:12,fontWeight:600,textAlign:'left' }}
                          onMouseEnter={e=>e.currentTarget.style.background=T.gray}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <v.Icon size={11}/>{v.lbl}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {!resetConf?(
                  <button onClick={()=>setResetConf(true)} title="Resetar conversa"
                    style={{ width:30,height:30,borderRadius:8,border:`1px solid ${T.sep2}`,
                      background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:T.ink4,transition:'all .13s' }}
                    onMouseEnter={e=>{ e.currentTarget.style.color=T.red; e.currentTarget.style.borderColor=T.redBor }}
                    onMouseLeave={e=>{ e.currentTarget.style.color=T.ink4; e.currentTarget.style.borderColor=T.sep2 }}>
                    <Trash2 size={12}/>
                  </button>
                ):(
                  <div style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 9px',borderRadius:8,border:`1px solid ${T.redBor}`,background:T.redDim }}>
                    <span style={{ fontSize:10.5,color:T.red,fontWeight:600 }}>Apagar?</span>
                    <button onClick={resetar} disabled={resetting} style={{ padding:'2px 8px',borderRadius:6,border:'none',cursor:'pointer',background:T.red,color:'#fff',fontSize:10,fontWeight:700 }}>
                      {resetting?'...':'Sim'}
                    </button>
                    <button onClick={()=>setResetConf(false)} style={{ padding:'2px 8px',borderRadius:6,border:'none',cursor:'pointer',background:T.gray,color:T.ink3,fontSize:10 }}>Não</button>
                  </div>
                )}
              </div>
            </div>

            {/* Aviso gatilhos */}
            <div style={{ padding:'4px 14px',background:`${T.amber}08`,flexShrink:0,borderBottom:`1px solid ${T.amberBor}40`,display:'flex',alignItems:'center',gap:6 }}>
              <Zap size={9} style={{ color:T.amber,flexShrink:0 }}/>
              <span style={{ fontSize:9,color:T.amber }}>Mensagens ⚡ são automações — só visíveis aqui</span>
            </div>

            {/* Banner carrinho */}
            <CartBanner carrinho={carrinho} onVerCarrinho={()=>{
              // Seleciona aba carrinho no painel
              document.querySelector('[data-tab=carrinho]')?.click()
            }}/>

            {/* Mensagens */}
            
          {/* Feature 2: Banner de Intenção Detectada */}
          {intencaoEdit && !editPedidoOpen && (() => {
            const IntIc = intencaoEdit.icon || Package
            return (
              <div style={{ flexShrink:0, padding:'7px 14px', display:'flex', alignItems:'center',
                gap:8, background:`${intencaoEdit.cor}08`,
                borderBottom:`1px solid ${intencaoEdit.cor}20` }}>
                <IntIc size={11} style={{ color:intencaoEdit.cor, flexShrink:0 }}/>
                <span style={{ fontSize:11, color:intencaoEdit.cor, fontWeight:600, flex:1 }}>
                  💡 {intencaoEdit.label} detectada
                </span>
                <button onClick={()=>setEditPedidoOpen(true)}
                  style={{ padding:'4px 10px', borderRadius:7, cursor:'pointer',
                    border:`1px solid ${intencaoEdit.cor}50`,
                    background:`${intencaoEdit.cor}15`,
                    color:intencaoEdit.cor, fontSize:10, fontWeight:700 }}>
                  Aplicar →
                </button>
                <button onClick={()=>setIntencaoEdit(null)}
                  style={{ background:'none', border:'none', cursor:'pointer',
                    color:T.ink4, display:'flex', padding:2 }}>
                  <X size={10}/>
                </button>
              </div>
            )
          })()}

          {/* Order Context Banner — jornada do pedido ativo */}
          {pedidosAtivos.length > 0 && (
            <OrderContextBanner tel={sel} api={api} pedidos={pedidosAtivos}/>
          )}

<div style={{ flex:1,overflowY:'auto',padding:'10px 0',background:T.bg0 }}
              onClick={()=>statusMenu&&setStatusMenu(false)}>
              {loadMsg?(
                <div style={{ textAlign:'center',padding:'32px 0',color:T.ink4 }}>
                  <RefreshCw size={14} style={{ animation:'cv-spin 1s linear infinite' }}/>
                </div>
              ):grouped.length===0?(
                <div style={{ textAlign:'center',padding:'40px 12px',color:T.ink4 }}>
                  <MessageSquare size={20} style={{ display:'block',margin:'0 auto 10px',opacity:.1 }}/>
                  <p style={{ fontSize:12.5,margin:0 }}>Nenhuma mensagem ainda</p>
                </div>
              ):grouped.map((item,i)=>(
                item.type==='date'
                  ?<DateSep key={`d${i}`} date={item.date}/>
                  :<MsgBubble key={item.msg.id||i} msg={item.msg}/>
              ))}
              <div ref={bottomRef}/>
            </div>

            <InputBar api={api} tel={sel} onEnviar={enviar} onEnviarMidia={enviarMidia} rapidas={rapidas}
              enviando={enviando} disabled={isIA}/>
          </>
        )}
      </div>

      {/* ── PAINEL DIREITO ─────────────────────────────────────────────── */}
      <div style={{ position:'relative',display:'flex' }}>
        <button onClick={()=>setShowPanel(v=>!v)}
          style={{ position:'absolute',left:-12,top:'50%',transform:'translateY(-50%)',
            width:22,height:22,borderRadius:'50%',zIndex:10,
            background:T.bg3,border:`1px solid ${T.sep2}`,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',color:T.ink4,
            boxShadow:'0 2px 8px rgba(0,0,0,.3)' }}>
          {showPanel?<ChevronRight size={9}/>:<ArrowLeft size={9}/>}
        </button>
        {showPanel&&(
          <div style={{ width:258,borderLeft:`1px solid ${T.sep}`,
            background:`linear-gradient(180deg,${T.bg2},${T.bg1})`,
            display:'flex',flexDirection:'column',overflow:'hidden' }}>
            <IntelligenceCard conv={convAtiva} api={api} pixKey={pixKey}
              mensagens={mensagens} carrinho={carrinho} onModoChange={toggleModo}/>
          </div>
        )}
      </div>
    </div>
  )
}
