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
  ChevronDown, ChevronRight, Zap, Check, Package, Truck,
  ShoppingCart, ShoppingBag, CreditCard, Copy, FileText,
  Image, Mic, Video, Bell, AlertTriangle, CheckCircle,
  Clock, Inbox, ArrowLeft, Trash2, ExternalLink, Radio,
  Lightbulb, Paperclip, Camera, Volume2, Film, Tag,
  RotateCcw, TrendingUp, Hash, Users, Filter,
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
        <span style={{ marginLeft:'auto',fontSize:9,color:T.ink4,
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
const RAPIDAS = [
  'Olá! Como posso ajudar?',
  'Vou verificar isso agora para você.',
  'Pode me informar o número do seu pedido?',
  'O prazo de entrega é de 3 a 7 dias úteis.',
  'Pagando via PIX você tem 10% de desconto automático! 💰',
]

function InputBar({ api, tel, onEnviar, onEnviarMidia, enviando, disabled }) {
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
          {RAPIDAS.map((r,i)=>(
            <button key={i} onClick={()=>{ setTxt(r); setRp(false); setSug([]); ref.current?.focus() }}
              style={{ display:'block',width:'100%',padding:'9px 14px',textAlign:'left',border:'none',
                cursor:'pointer',background:'transparent',color:T.ink2,fontSize:12,
                borderBottom:i<RAPIDAS.length-1?`1px solid ${T.sep}`:'none',transition:'background .1s' }}
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

// ─────────────────────────────────────────────────────────────────────────────
// MODAL PEDIDO
// ─────────────────────────────────────────────────────────────────────────────
function ModalPedido({ pedido, tel, api, onClose, pixKey }) {
  const [disparos,setDisparos]=useState([])
  const [copied,  setCopied]  =useState(null)
  const [linkLoad,setLinkLoad]=useState(false)

  useEffect(()=>{
    if(!pedido) return
    fetch(`${api}/api/dashboard/disparos-pedido/${pedido.numero}`)
      .then(r=>r.ok?r.json():null).then(d=>{ if(d) setDisparos(d.disparos||[]) }).catch(()=>{})
  },[pedido?.numero,api])

  if(!pedido) return null

  const isPendente = [6,24,'Em Aberto','Pag. pendente','pendente','aberto'].includes(String(pedido.situacao_id||pedido.situacao||'').toLowerCase())
  const copiar=(txt,k)=>{ copyText(txt); setCopied(k); setTimeout(()=>setCopied(null),2000) }

  const gerarLinkMP=async()=>{
    setLinkLoad(true)
    try {
      const r=await fetch(`${api}/api/dashboard/mp-link-pagamento`,{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ telefone:tel,numero_pedido:pedido.numero,
          valor:parseFloat((pedido.total||'0').replace(/[R$\s.]/g,'').replace(',','.').trim())||0,
          descricao:`Pedido #${pedido.numero}` })})
      const d=await r.json()
      if(d.init_point){ copyText(d.init_point); window.open(d.init_point,'_blank') }
    } catch {}
    setLinkLoad(false)
  }

  const disparoMap={}; disparos.forEach(d=>{ disparoMap[d.gatilho]=d })

  const Btn=({label,onClick,cor,Icon,ld})=>(
    <button onClick={onClick} disabled={ld}
      style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 13px',borderRadius:9,
        border:`1px solid ${cor}40`,background:`${cor}12`,color:cor,cursor:'pointer',
        fontSize:11,fontWeight:700,transition:'all .13s',opacity:ld?.6:1,whiteSpace:'nowrap' }}>
      {ld?<RefreshCw size={11} style={{ animation:'cv-spin 1s linear infinite' }}/>:<Icon size={11}/>}
      {label}
    </button>
  )

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:8000,
        background:'rgba(0,0,0,.55)',backdropFilter:'blur(4px)',animation:'cv-bg .2s ease' }}/>
      <div style={{ position:'fixed',top:0,right:0,bottom:0,zIndex:8001,
        width:480,display:'flex',flexDirection:'column',
        background:`linear-gradient(180deg,${T.bg2},${T.bg1})`,
        borderLeft:`1px solid ${T.sep2}`,
        boxShadow:'-24px 0 64px rgba(0,0,0,.6)',
        animation:'cv-slideIn .28s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ padding:'18px 20px',borderBottom:`1px solid ${T.sep}`,
          background:`linear-gradient(90deg,${T.green}08,transparent)`,flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <div style={{ width:36,height:36,borderRadius:10,background:T.greenDim,
                border:`1px solid ${T.greenBor}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Package size={16} style={{ color:T.green }}/>
              </div>
              <div>
                <div style={{ fontSize:18,fontWeight:800,color:T.green }}>#{pedido.numero}</div>
                <div style={{ fontSize:11,color:T.ink4 }}>{pedido.data}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:30,height:30,borderRadius:8,
              border:`1px solid ${T.sep2}`,background:T.gray,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',color:T.ink4 }}>
              <X size={13}/>
            </button>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:9 }}>
            <span style={{ padding:'3px 11px',borderRadius:99,fontSize:11,fontWeight:700,
              background:T.bg3,border:`1px solid ${T.sep2}`,color:T.ink2 }}>{pedido.situacao}</span>
            <span style={{ fontSize:17,fontWeight:800,color:T.ink1 }}>{pedido.total}</span>
            {pedido.forma_pagamento&&pedido.forma_pagamento!=='—'&&(
              <span style={{ fontSize:10.5,color:T.ink4 }}>{pedido.forma_pagamento}</span>
            )}
          </div>
        </div>
        <div style={{ flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
            <Btn label={copied==='link'?'Copiado!':'Link do pedido'}
              onClick={()=>copiar(`https://rastreio.sostrass.com.br/pedido/${pedido.numero}`,'link')}
              cor={T.cyan} Icon={copied==='link'?Check:Copy}/>
            {pedido.rastreio&&pedido.rastreio!=='—'&&(
              <Btn label="Rastrear"
                onClick={()=>window.open(`https://rastreio.sostrass.com.br/p/${pedido.rastreio}`,'_blank')}
                cor={T.purple} Icon={Truck}/>
            )}
            {pedido.nfe_link&&(
              <Btn label="NF-e" onClick={()=>window.open(pedido.nfe_link,'_blank')} cor={T.blue} Icon={FileText}/>
            )}
            {isPendente&&pixKey&&(
              <Btn label={copied==='pix'?'Copiado!':'Copiar PIX'}
                onClick={()=>copiar(pixKey,'pix')} cor={T.green} Icon={copied==='pix'?Check:Copy}/>
            )}
            {isPendente&&(
              <Btn label={linkLoad?'Gerando...':'Cartão (MP)'}
                onClick={gerarLinkMP} ld={linkLoad} cor={T.amber} Icon={CreditCard}/>
            )}
          </div>

          {pedido.rastreio&&pedido.rastreio!=='—'&&(
            <div style={{ padding:'11px 14px',borderRadius:11,background:T.bg3,border:`1px solid ${T.sep}` }}>
              <div style={{ fontSize:9.5,fontWeight:700,color:T.ink4,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:5 }}>Rastreio</div>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <span style={{ fontFamily:'monospace',fontSize:14,fontWeight:700,color:T.purple }}>{pedido.rastreio}</span>
                {pedido.transportadora&&pedido.transportadora!=='—'&&<span style={{ fontSize:11,color:T.ink4 }}>{pedido.transportadora}</span>}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <div style={{ fontSize:10,fontWeight:700,color:T.ink4,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:10 }}>Jornada</div>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute',left:14,top:8,bottom:8,width:2,background:`linear-gradient(180deg,${T.green}40,transparent)` }}/>
              {JORNADA_STEPS.map((step,i)=>{
                const d = disparoMap[step.gatilho]
                // Inferência por status do pedido quando não há disparo registrado
                const sitId = pedido.situacao_id
                const infere = !d && (
                  (step.gatilho==='pedido_criado') ||
                  (step.gatilho==='pagamento_aprovado' && [15,27,14,30].includes(sitId)) ||
                  (step.gatilho==='em_separacao'       && [27,14,30].includes(sitId)) ||
                  (step.gatilho==='nfe_emitida'        && [14,30].includes(sitId)) ||
                  (step.gatilho==='pedido_enviado'     && [30].includes(sitId)) ||
                  (step.gatilho==='pedido_entregue'    && [30].includes(sitId))
                )
                const feito = !!d || infere
                return (
                  <div key={i} style={{ display:'flex',gap:12,alignItems:'flex-start',marginBottom:5 }}>
                    <div style={{ width:30,height:30,borderRadius:'50%',flexShrink:0,
                      background:feito?`${step.cor}22`:T.bg4,
                      border:`2px solid ${feito?step.cor:T.sep}`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      boxShadow:feito&&d?`0 0 10px ${step.cor}30`:undefined,zIndex:1 }}>
                      <step.Icon size={13} style={{ color:feito?step.cor:T.ink4 }}/>
                    </div>
                    <div style={{ flex:1,paddingTop:5 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                        <span style={{ fontSize:12.5,fontWeight:feito?700:400,color:feito?T.ink1:T.ink4 }}>{step.label}</span>
                        {d?.criado_em&&<span style={{ fontSize:9.5,color:T.ink4 }}>
                          {new Date(d.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                        </span>}
                        {infere&&!d&&<span style={{ fontSize:9,color:T.ink4,fontStyle:'italic' }}>pelo status</span>}
                      </div>
                      {d&&<div style={{ fontSize:9.5,fontWeight:600,marginTop:1,
                        color:d.status==='enviado'?T.green:T.red }}>
                        {d.status==='enviado'?'✓ Notificado':'✗ '+d.status}
                      </div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Itens */}
          {pedido.itens?.length>0&&(
            <div>
              <div style={{ fontSize:10,fontWeight:700,color:T.ink4,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8 }}>Itens</div>
              {pedido.itens.map((it,i)=>(
                <div key={i} style={{ display:'flex',alignItems:'center',gap:9,padding:'8px 11px',
                  borderRadius:9,marginBottom:5,background:T.bg4,border:`1px solid ${T.sep}` }}>
                  <Package size={12} style={{ color:T.ink4,flexShrink:0 }}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:12,color:T.ink1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{it.nome}</div>
                    <div style={{ fontSize:10,color:T.ink4 }}>{it.codigo&&`${it.codigo} · `}{it.qtd}× · R$ {it.preco}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ABAS DO PAINEL DIREITO
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

function PainelDireito({ conv, api, pixKey, carrinho, onModoChange }) {
  const [aba,setAba]=useState('contato')
  const TABS=[
    {id:'contato', lbl:'Info',     Icon:User,        badge:null},
    {id:'catalogo',lbl:'Catálogo', Icon:ShoppingBag, badge:null},
    {id:'pedidos', lbl:'Pedidos',  Icon:Package,     badge:null},
    {id:'carrinho',lbl:'Carrinho', Icon:ShoppingCart,badge:carrinho?.length||null},
  ]
  if(!conv) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:T.ink4 }}>
      <MessageSquare size={18} style={{ opacity:.1,display:'block',margin:'0 auto 7px' }}/>
      <p style={{ fontSize:11,margin:0 }}>Selecione uma conversa</p>
    </div>
  )
  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%' }}>
      <div style={{ display:'flex',borderBottom:`1px solid ${T.sep}`,flexShrink:0 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setAba(t.id)}
            style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:4,
              padding:'8px 3px',border:'none',cursor:'pointer',background:'transparent',
              fontSize:10,fontWeight:aba===t.id?700:500,
              color:aba===t.id?T.green:T.ink4,
              borderBottom:`2px solid ${aba===t.id?T.green:'transparent'}`,
              transition:'all .13s',position:'relative' }}>
            <t.Icon size={10}/>{t.lbl}
            {t.badge&&<span style={{ position:'absolute',top:3,right:4,width:14,height:14,
              borderRadius:'50%',background:T.amber,fontSize:8,fontWeight:800,
              color:'#000',display:'flex',alignItems:'center',justifyContent:'center' }}>{t.badge}</span>}
          </button>
        ))}
      </div>
      <div style={{ flex:1,overflow:'hidden',display:'flex',flexDirection:'column' }}>
        {aba==='contato' &&<AbaContato conv={conv} onModoChange={onModoChange}/>}
        {aba==='catalogo'&&<AbaCatalogo tel={conv.telefone} api={api}/>}
        {aba==='pedidos' &&<AbaPedidos  tel={conv.telefone} api={api} pixKey={pixKey}/>}
        {aba==='carrinho'&&<AbaCarrinho carrinho={carrinho}/>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM DA LISTA — com avatar WA
// ─────────────────────────────────────────────────────────────────────────────
function ConversaItem({ c, ativo, onClick }) {
  const cor=avatarCor(c.nome||c.telefone)
  const isIA=c.modo_ia!=='manual'
  const sc=STATUS_CFG[c.status_atendimento]||STATUS_CFG.pendente
  const isAtivo=c.ultima_atividade&&(Date.now()-new Date(c.ultima_atividade))<5*60*1000
  const nome=c.nome_wa||c.nome||c.telefone
  return (
    <button onClick={onClick} style={{ width:'100%',padding:'10px 13px',border:'none',cursor:'pointer',
      textAlign:'left',position:'relative',
      background:ativo?`linear-gradient(90deg,${cor}10,${T.bg3})`:'transparent',
      borderLeft:`3px solid ${ativo?cor:'transparent'}`,transition:'all .13s' }}
      onMouseEnter={e=>{ if(!ativo) e.currentTarget.style.background=T.gray }}
      onMouseLeave={e=>{ if(!ativo) e.currentTarget.style.background='transparent' }}>
      <div style={{ display:'flex',alignItems:'center',gap:9 }}>
        <div style={{ position:'relative',flexShrink:0 }}>
          <WaAvatar nome={nome} foto={c.foto_perfil||''} size={38} cor={cor}/>
          {isAtivo&&<div style={{ position:'absolute',bottom:0,right:0 }}><Dot cor={T.green} size={8}/></div>}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:2 }}>
            <span style={{ fontSize:12.5,fontWeight:ativo?700:600,color:T.ink1,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:115 }}>
              {nome}
            </span>
            <span style={{ fontSize:9.5,color:T.ink4,flexShrink:0 }}>{tempoRel(c.ultima_atividade)}</span>
          </div>
          <div style={{ fontSize:11,color:T.ink3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:4 }}>
            {c.ultima_mensagem||'—'}
          </div>
          <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
            <span style={{ display:'inline-flex',alignItems:'center',gap:2,padding:'1px 5px',borderRadius:99,fontSize:8,fontWeight:700,
              background:isIA?T.purpleDim:T.blueDim,color:isIA?T.purple:T.blue,border:`1px solid ${isIA?T.purpleBor:T.blueBor}` }}>
              {isIA?<Bot size={6}/>:<User size={6}/>}{isIA?'Molise':'H'}
            </span>
            <span style={{ display:'inline-flex',alignItems:'center',gap:2,padding:'1px 5px',borderRadius:99,fontSize:8,fontWeight:700,
              background:`${sc.cor}12`,color:sc.cor,border:`1px solid ${sc.cor}22` }}>{sc.lbl}</span>
            {(c.itens_carrinho||0)>0&&<span style={{ display:'inline-flex',alignItems:'center',gap:2,padding:'1px 5px',borderRadius:99,fontSize:8,fontWeight:700,
              background:T.amberDim,color:T.amber,border:`1px solid ${T.amberBor}` }}>
              <ShoppingCart size={6}/>{c.itens_carrinho}
            </span>}
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
  const CORS = { todos:T.purple, ia:T.blue, manual:T.cyan, pendente:T.amber, resolvido:T.green, encerrado:T.ink4 }
  const cor = CORS[id] || T.purple
  return (
    <button onClick={onClick}
      style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3,
        padding:'8px 6px',borderRadius:11,border:'none',cursor:'pointer',
        background:ativo?`rgba(255,255,255,.08)`:'transparent',
        backdropFilter:ativo?'blur(10px)':undefined,
        WebkitBackdropFilter:ativo?'blur(10px)':undefined,
        boxShadow:ativo?`0 4px 16px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.1)`:undefined,
        outline:`1px solid ${ativo?cor+'50':'transparent'}`,
        transition:'all .18s', flex:1 }}>
      <div style={{ width:26,height:26,borderRadius:9,flexShrink:0,
        background:ativo?`${cor}25`:'rgba(255,255,255,.05)',
        border:`1px solid ${ativo?cor+'50':'rgba(255,255,255,.08)'}`,
        display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:ativo?`0 0 12px ${cor}40`:undefined,transition:'all .18s' }}>
        <Icon size={12} style={{ color:ativo?cor:T.ink4 }}/>
      </div>
      <span style={{ fontSize:9.5,fontWeight:ativo?700:500,color:ativo?cor:T.ink4,
        transition:'color .15s' }}>{lbl}</span>
      {n>0&&<span style={{ fontSize:9,fontWeight:800,color:ativo?cor:T.ink4,
        lineHeight:1 }}>{n>999?'999+':n}</span>}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
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
  const [resetting, setResetting] = useState(false)

  const prevStatusRef = useRef({})
  const bottomRef     = useRef()

  useEffect(()=>{
    fetch(`${api}/api/dashboard/pix-key`).then(r=>r.ok?r.json():null)
      .then(d=>{ if(d?.chave) setPixKey(d.chave) }).catch(()=>{})
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
  useEffect(()=>{
    if(!sel){ setMensagens([]); setCarrinho([]); return }
    fetchMensagens(sel,true)
    const iv=setInterval(()=>fetchMensagens(sel,false),8000)
    return()=>clearInterval(iv)
  },[sel]) // eslint-disable-line

  useEffect(()=>{ if(mensagens.length) bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[mensagens.length])

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
  ]

  return (
    <div style={{ display:'flex',height:'100%',background:T.bg0,overflow:'hidden',fontFamily:'system-ui,sans-serif' }}>
      <style>{`
        @keyframes cv-spin   { to{transform:rotate(360deg)} }
        @keyframes cv-ping   { 0%{transform:scale(1);opacity:.5} 75%,100%{transform:scale(2.2);opacity:0} }
        @keyframes cv-fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cv-slideIn{ from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes cv-bg     { from{opacity:0} to{opacity:1} }
      `}</style>

      {/* Toast */}
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

          {/* Filtros glassmorphism */}
          <div style={{ display:'flex',gap:4,background:'rgba(255,255,255,.03)',
            borderRadius:13,padding:4,border:`1px solid rgba(255,255,255,.06)`,
            backdropFilter:'blur(8px)' }}>
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

            <InputBar api={api} tel={sel} onEnviar={enviar} onEnviarMidia={enviarMidia}
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
            <PainelDireito conv={convAtiva} api={api} pixKey={pixKey}
              carrinho={carrinho} onModoChange={v=>toggleModo(v)}/>
          </div>
        )}
      </div>
    </div>
  )
}
