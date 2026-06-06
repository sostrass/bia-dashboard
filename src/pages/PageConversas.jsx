/**
 * PageConversas — NIVELMAX
 * Three-column layout: Lista · Thread · Contato
 * Polling adaptativo · Modo IA↔Humano · Templates rápidos · Status workflow
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, MessageSquare, Bot, User, Send,
  Phone, MoreVertical, CheckCircle, Clock,
  ShoppingCart, RefreshCw, X, ChevronDown,
  Zap, Users, Filter, Hash, Check, ChevronRight,
  AlertTriangle, Package, Truck, ArrowRight,
  ToggleLeft, ToggleRight, Inbox, Circle,
  PanelRightOpen, PanelRightClose, ArrowLeft,
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const PAL = [T.purple,T.green,T.amber,T.cyan,T.blue,'#f87171',T.orange||'#ff9f0a']
const avatarCor = (str='') => PAL[str.charCodeAt(0)%PAL.length]
const initiais   = (str='') => str.split(' ').map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase()||'?'

const tempoRel = (iso) => {
  if (!iso) return ''
  const d = new Date(iso), n = new Date()
  const m = Math.floor((n-d)/60000)
  if (m < 1)    return 'agora'
  if (m < 60)   return `${m}min`
  if (m < 1440) return `${Math.floor(m/60)}h`
  const dias = Math.floor(m/1440)
  if (dias === 1) return 'ontem'
  if (dias < 7)   return `${dias}d`
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
}

const STATUS_CFG = {
  pendente:     { lbl:'Pendente',    cor:T.amber,  icon:Clock        },
  em_andamento: { lbl:'Em andamento',cor:T.blue,   icon:Activity     },
  resolvido:    { lbl:'Resolvido',   cor:T.green,  icon:CheckCircle  },
  encerrado:    { lbl:'Encerrado',   cor:T.ink4,   icon:X            },
}
const Activity = RefreshCw // alias

function PulsingDot({ cor=T.green, size=8 }) {
  return (
    <span style={{ position:'relative',display:'inline-flex',width:size,height:size,flexShrink:0 }}>
      <span style={{ position:'absolute',inset:0,borderRadius:'50%',
        background:cor,opacity:.4,animation:'cv-ping 2s ease-out infinite' }}/>
      <span style={{ width:size,height:size,borderRadius:'50%',background:cor,
        display:'block',boxShadow:`0 0 ${size}px ${cor}` }}/>
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM DA LISTA DE CONVERSAS
// ─────────────────────────────────────────────────────────────────────────────
function ConversaItem({ c, ativo, onClick }) {
  const cor   = avatarCor(c.nome||c.telefone)
  const inil  = initiais(c.nome||c.telefone)
  const isIA  = c.modo_ia !== 'manual'
  const sc    = STATUS_CFG[c.status_atendimento] || STATUS_CFG.pendente
  const ativid= c.ultima_atividade
  const isAtivo = ativid && (Date.now()-new Date(ativid))<5*60*1000

  return (
    <button onClick={onClick} style={{
      width:'100%', padding:'12px 14px', border:'none', cursor:'pointer',
      textAlign:'left', position:'relative',
      background: ativo
        ? `linear-gradient(90deg,${cor}12,${T.bg3})`
        : 'transparent',
      borderLeft: `3px solid ${ativo ? cor : 'transparent'}`,
      transition:'all .15s',
    }}
    onMouseEnter={e=>{ if(!ativo) e.currentTarget.style.background=T.gray }}
    onMouseLeave={e=>{ if(!ativo) e.currentTarget.style.background='transparent' }}>

      <div style={{ display:'flex',alignItems:'center',gap:11 }}>
        {/* Avatar + status dot */}
        <div style={{ position:'relative',flexShrink:0 }}>
          <div style={{ width:40,height:40,borderRadius:'50%',
            background:`linear-gradient(135deg,${cor}35,${cor}15)`,
            border:`2px solid ${cor}${ativo?'70':'35'}`,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:13,fontWeight:800,color:cor }}>
            {inil}
          </div>
          {isAtivo && (
            <div style={{ position:'absolute',bottom:0,right:0 }}>
              <PulsingDot cor={T.green} size={9}/>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',
            justifyContent:'space-between',marginBottom:3 }}>
            <span style={{ fontSize:13,fontWeight:ativo?700:600,
              color:T.ink1,overflow:'hidden',textOverflow:'ellipsis',
              whiteSpace:'nowrap',maxWidth:130 }}>
              {c.nome||c.telefone}
            </span>
            <span style={{ fontSize:10,color:T.ink4,flexShrink:0 }}>
              {tempoRel(ativid)}
            </span>
          </div>

          <div style={{ fontSize:11.5,color:T.ink3,overflow:'hidden',
            textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:5 }}>
            {c.ultima_mensagem||'Sem mensagens'}
          </div>

          {/* Badges */}
          <div style={{ display:'flex',alignItems:'center',gap:5,flexWrap:'wrap' }}>
            {/* IA / Humano */}
            <span style={{ display:'inline-flex',alignItems:'center',gap:3,
              padding:'1px 6px',borderRadius:99,fontSize:8.5,fontWeight:700,
              background:isIA?T.purpleDim:T.blueDim,
              color:isIA?T.purple:T.blue,
              border:`1px solid ${isIA?T.purpleBor:T.blueBor}` }}>
              {isIA?<Bot size={7}/>:<User size={7}/>}
              {isIA?'IA':'Humano'}
            </span>

            {/* Status */}
            <span style={{ display:'inline-flex',alignItems:'center',gap:3,
              padding:'1px 6px',borderRadius:99,fontSize:8.5,fontWeight:700,
              background:`${sc.cor}15`,color:sc.cor,border:`1px solid ${sc.cor}30` }}>
              {sc.lbl}
            </span>

            {/* Carrinho */}
            {(c.itens_carrinho||0) > 0 && (
              <span style={{ display:'inline-flex',alignItems:'center',gap:3,
                padding:'1px 6px',borderRadius:99,fontSize:8.5,fontWeight:700,
                background:T.amberDim,color:T.amber,border:`1px solid ${T.amberBor}` }}>
                <ShoppingCart size={7}/>{c.itens_carrinho}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BOLHA DE MENSAGEM
// ─────────────────────────────────────────────────────────────────────────────
function MsgBubble({ msg }) {
  const isEntrada = msg.direcao === 'entrada'
  const isManual  = msg.modo === 'manual'
  const isAI      = !isEntrada && !isManual

  const bubbleBg = isEntrada
    ? `linear-gradient(135deg,${T.bg3},${T.bg4})`
    : isAI
    ? `linear-gradient(135deg,${T.purple}35,${T.purple}18)`
    : `linear-gradient(135deg,${T.blue}35,${T.blue}18)`

  const bubbleBor = isEntrada
    ? `1px solid ${T.sep2}`
    : isAI
    ? `1px solid ${T.purple}35`
    : `1px solid ${T.blue}35`

  const hora = msg.criado_em
    ? new Date(msg.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    : ''

  return (
    <div style={{ display:'flex',flexDirection:'column',
      alignItems:isEntrada?'flex-start':'flex-end',
      marginBottom:8,padding:'0 16px' }}>

      {/* Agente tag */}
      {!isEntrada && (
        <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:3,
          fontSize:9.5,fontWeight:700,color:isAI?T.purple:T.blue }}>
          {isAI ? <Bot size={9}/> : <User size={9}/>}
          {isAI ? (msg.motor||'IA') : 'Atendente'}
        </div>
      )}

      {/* Bubble */}
      <div style={{
        maxWidth:'72%', padding:'10px 13px',
        borderRadius: isEntrada ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        background: bubbleBg,
        border: bubbleBor,
        boxShadow: isEntrada
          ? '0 2px 8px rgba(0,0,0,.2)'
          : `0 2px 12px ${isAI?T.purple:T.blue}20`,
        position:'relative',
      }}>
        <p style={{ margin:0, fontSize:13.5, lineHeight:1.6,
          color:T.ink1, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
          {msg.conteudo}
        </p>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'flex-end',
          gap:4,marginTop:5 }}>
          <span style={{ fontSize:9.5,color:T.ink4 }}>{hora}</span>
          {!isEntrada && <Check size={11} style={{ color:T.ink4 }}/>}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SEPARADOR DE DATA
// ─────────────────────────────────────────────────────────────────────────────
function DateSep({ date }) {
  const d = new Date(date)
  const hoje = new Date()
  const diff = Math.floor((hoje-d)/86400000)
  const label = diff===0?'Hoje':diff===1?'Ontem':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,
      padding:'8px 16px',margin:'4px 0' }}>
      <div style={{ flex:1,height:1,background:T.sep }}/>
      <span style={{ fontSize:10,fontWeight:700,color:T.ink4,
        padding:'2px 10px',borderRadius:99,background:T.bg3,
        border:`1px solid ${T.sep}`,whiteSpace:'nowrap' }}>{label}</span>
      <div style={{ flex:1,height:1,background:T.sep }}/>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BARRA DE INPUT
// ─────────────────────────────────────────────────────────────────────────────
const RESPOSTAS_RAPIDAS = [
  'Olá! Como posso ajudar?',
  'Vou verificar isso para você agora.',
  'Pedido confirmado! Em breve você receberá atualizações.',
  'O prazo de entrega é de 3 a 7 dias úteis.',
  'Para mais informações, entre em contato novamente.',
]

function InputBar({ onEnviar, enviando, disabled }) {
  const [texto,    setTexto]    = useState('')
  const [showRP,   setShowRP]   = useState(false)
  const inputRef  = useRef()

  const enviar = () => {
    if (!texto.trim() || enviando || disabled) return
    onEnviar(texto.trim())
    setTexto('')
    inputRef.current?.focus()
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  return (
    <div style={{ padding:'12px 16px',borderTop:`1px solid ${T.sep}`,
      background:T.bg2,position:'relative' }}>

      {/* Respostas rápidas */}
      {showRP && (
        <div style={{ position:'absolute',bottom:'100%',left:16,right:16,marginBottom:8,
          background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:14,overflow:'hidden',
          boxShadow:'0 -12px 32px rgba(0,0,0,.5)',animation:'cv-fadeUp .15s ease' }}>
          <div style={{ padding:'8px 12px',borderBottom:`1px solid ${T.sep}`,
            fontSize:10,fontWeight:700,color:T.ink4,textTransform:'uppercase',letterSpacing:'.08em' }}>
            Respostas rápidas
          </div>
          {RESPOSTAS_RAPIDAS.map((r,i)=>(
            <button key={i} onClick={()=>{ setTexto(r); setShowRP(false); inputRef.current?.focus() }}
              style={{ display:'block',width:'100%',padding:'10px 14px',
                textAlign:'left',border:'none',cursor:'pointer',
                background:'transparent',color:T.ink2,fontSize:12.5,
                borderBottom:i<RESPOSTAS_RAPIDAS.length-1?`1px solid ${T.sep}`:'none',
                transition:'background .1s' }}
              onMouseEnter={e=>e.currentTarget.style.background=T.gray}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              {r}
            </button>
          ))}
        </div>
      )}

      <div style={{ display:'flex',alignItems:'flex-end',gap:8 }}>
        {/* Respostas rápidas toggle */}
        <button onClick={()=>setShowRP(v=>!v)} title="Respostas rápidas"
          style={{ width:36,height:36,borderRadius:10,border:`1px solid ${showRP?T.purpleBor:T.sep2}`,
            background:showRP?T.purpleDim:'transparent',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
            color:showRP?T.purple:T.ink4,flexShrink:0,transition:'all .15s' }}>
          <Zap size={14}/>
        </button>

        {/* Input */}
        <div style={{ flex:1,position:'relative' }}>
          <textarea ref={inputRef} value={texto} onChange={e=>setTexto(e.target.value)}
            onKeyDown={onKey} disabled={disabled}
            placeholder={disabled?'Selecione uma conversa para responder...'
              :'Mensagem... (Enter para enviar, Shift+Enter para nova linha)'}
            rows={1}
            style={{ width:'100%',padding:'10px 13px',borderRadius:11,resize:'none',
              background:T.bg1,border:`1px solid ${T.sep2}`,color:T.ink1,
              fontSize:13.5,lineHeight:1.5,outline:'none',fontFamily:'inherit',
              boxSizing:'border-box',maxHeight:120,overflowY:'auto',
              opacity:disabled?.5:1,transition:'border-color .18s' }}
            onFocus={e=>e.target.style.borderColor=`${T.purple}50`}
            onBlur={e=>e.target.style.borderColor=T.sep2}
            onInput={e=>{ e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}/>
          {texto.length>0 && (
            <div style={{ position:'absolute',right:10,bottom:8,
              fontSize:9.5,color:T.ink4 }}>{texto.length}</div>
          )}
        </div>

        {/* Send */}
        <button onClick={enviar}
          disabled={!texto.trim()||enviando||disabled}
          style={{ width:40,height:40,borderRadius:11,border:'none',cursor:'pointer',
            flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
            background:texto.trim()&&!disabled
              ?`linear-gradient(135deg,${T.green},${T.green}cc)`
              :'rgba(255,255,255,.08)',
            color:texto.trim()&&!disabled?'#000':T.ink4,
            boxShadow:texto.trim()&&!disabled?`0 4px 16px ${T.green}35`:undefined,
            transition:'all .18s',
            opacity:(!texto.trim()||enviando||disabled)?.5:1 }}>
          {enviando ? <RefreshCw size={15} style={{ animation:'cv-spin 1s linear infinite' }}/>
            : <Send size={15}/>}
        </button>
      </div>

      {disabled && (
        <div style={{ marginTop:6,fontSize:10.5,color:T.ink4,textAlign:'center' }}>
          Modo IA ativo — a Bia está respondendo automaticamente
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAINEL DIREITO — info do contato
// ─────────────────────────────────────────────────────────────────────────────
function ContatoPanel({ conv, api, onModoChange }) {
  const [pedidos,  setPedidos]  = useState([])
  const [expanded, setExpanded] = useState(false)

  useEffect(()=>{
    if (!conv?.telefone) return
    fetch(`${api}/api/dashboard/contatos/${conv.telefone}/pedidos`)
      .then(r=>r.ok?r.json():null).then(d=>{ if(d) setPedidos(d.pedidos||[]) }).catch(()=>{})
  },[conv?.telefone,api])

  if (!conv) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',height:'100%',gap:10,color:T.ink4 }}>
      <MessageSquare size={24} style={{ opacity:.15 }}/>
      <p style={{ fontSize:12,margin:0 }}>Selecione uma conversa</p>
    </div>
  )

  const cor  = avatarCor(conv.nome||conv.telefone)
  const inil = initiais(conv.nome||conv.telefone)
  const isIA = conv.modo_ia !== 'manual'

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%',overflowY:'auto' }}>
      {/* Avatar + nome */}
      <div style={{ padding:'20px 16px 16px',borderBottom:`1px solid ${T.sep}`,
        background:`linear-gradient(180deg,${cor}08,transparent)`,textAlign:'center' }}>
        <div style={{ width:56,height:56,borderRadius:'50%',margin:'0 auto 10px',
          background:`linear-gradient(135deg,${cor}35,${cor}15)`,
          border:`2px solid ${cor}50`,display:'flex',alignItems:'center',
          justifyContent:'center',fontSize:18,fontWeight:800,color:cor }}>
          {inil}
        </div>
        <div style={{ fontSize:14,fontWeight:700,color:T.ink1,marginBottom:3 }}>
          {conv.nome||'Sem nome'}
        </div>
        <div style={{ fontFamily:'monospace',fontSize:11.5,color:T.ink4,marginBottom:10 }}>
          {conv.telefone}
        </div>

        {/* Toggle modo IA / Humano */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10,
          padding:'8px 14px',borderRadius:10,
          background:isIA?T.purpleDim:T.blueDim,
          border:`1px solid ${isIA?T.purpleBor:T.blueBor}` }}>
          <span style={{ fontSize:11,fontWeight:600,color:isIA?T.purple:T.blue }}>
            {isIA?'IA respondendo':'Atendimento humano'}
          </span>
          <button onClick={()=>onModoChange(!isIA)}
            style={{ position:'relative',width:38,height:22,borderRadius:99,
              border:'none',cursor:'pointer',
              background:isIA?`linear-gradient(90deg,${T.purple},${T.purple}cc)`
                :`linear-gradient(90deg,${T.blue},${T.blue}cc)`,
              boxShadow:`0 0 12px ${isIA?T.purple:T.blue}40`,transition:'all .22s' }}>
            <span style={{ position:'absolute',top:3,height:16,width:16,borderRadius:'50%',
              background:'#fff',left:isIA?'calc(100% - 19px)':'3px',
              transition:'left .2s cubic-bezier(.4,0,.2,1)',
              boxShadow:'0 1px 4px rgba(0,0,0,.3)' }}/>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding:'12px 14px',borderBottom:`1px solid ${T.sep}` }}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
          {[
            { l:'Mensagens',v:conv.total_msgs||0,       cor:T.purple },
            { l:'Do cliente',v:conv.msgs_entrada||0,    cor:T.cyan   },
            { l:'Carrinho',  v:conv.itens_carrinho||0,  cor:T.amber  },
            { l:'Status',    v:(STATUS_CFG[conv.status_atendimento]||STATUS_CFG.pendente).lbl, cor:T.green },
          ].map(s=>(
            <div key={s.l} style={{ padding:'8px 10px',borderRadius:9,
              background:T.bg4,border:`1px solid ${T.sep}`,textAlign:'center' }}>
              <div style={{ fontSize:16,fontWeight:800,color:s.cor,letterSpacing:'-.03em' }}>{s.v}</div>
              <div style={{ fontSize:9.5,color:T.ink4,marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Últimos pedidos */}
      {pedidos.length > 0 && (
        <div style={{ padding:'12px 14px',borderBottom:`1px solid ${T.sep}` }}>
          <button onClick={()=>setExpanded(v=>!v)}
            style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
              width:'100%',background:'none',border:'none',cursor:'pointer',marginBottom:8 }}>
            <span style={{ fontSize:11,fontWeight:700,color:T.ink4,
              textTransform:'uppercase',letterSpacing:'.08em' }}>
              Pedidos ({pedidos.length})
            </span>
            <ChevronDown size={11} style={{ color:T.ink4,
              transform:expanded?'rotate(180deg)':'rotate(0)',transition:'transform .2s' }}/>
          </button>
          {expanded && pedidos.slice(0,3).map((p,i)=>(
            <div key={i} style={{ padding:'8px 10px',borderRadius:9,marginBottom:6,
              background:T.bg4,border:`1px solid ${T.sep}` }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:3 }}>
                <span style={{ fontSize:11.5,fontWeight:700,color:T.green }}>#{p.numero}</span>
                <span style={{ fontSize:10.5,fontWeight:600,color:T.ink1 }}>
                  R$ {p.total}
                </span>
              </div>
              <div style={{ fontSize:10.5,color:T.ink4 }}>{p.data}</div>
            </div>
          ))}
        </div>
      )}

      {/* Última atividade */}
      <div style={{ padding:'12px 14px' }}>
        <div style={{ fontSize:9.5,fontWeight:700,color:T.ink4,textTransform:'uppercase',
          letterSpacing:'.08em',marginBottom:6 }}>Última atividade</div>
        <div style={{ fontSize:12,color:T.ink3 }}>
          {conv.ultima_atividade ? tempoRel(conv.ultima_atividade)||'—' : '—'}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// THREAD DE CHAT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
function ChatThread({ conv, mensagens, api, onModoChange, onStatusChange, loading, onEnviar, enviando }) {
  const bottomRef = useRef()
  const isIA      = conv?.modo_ia !== 'manual'
  const sc        = STATUS_CFG[conv?.status_atendimento] || STATUS_CFG.pendente
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(()=>{
    if (mensagens?.length) {
      bottomRef.current?.scrollIntoView({ behavior:'smooth' })
    }
  },[mensagens?.length])

  if (!conv) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',height:'100%',gap:14,color:T.ink4 }}>
      <div style={{ width:64,height:64,borderRadius:20,
        background:T.purpleDim,border:`1px solid ${T.purpleBor}`,
        display:'flex',alignItems:'center',justifyContent:'center' }}>
        <MessageSquare size={28} style={{ color:T.purple }}/>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:15,fontWeight:700,color:T.ink2,margin:'0 0 6px' }}>
          Selecione uma conversa
        </p>
        <p style={{ fontSize:12.5,color:T.ink4,margin:0 }}>
          Escolha um contato na lista para ver o histórico
        </p>
      </div>
    </div>
  )

  const cor  = avatarCor(conv.nome||conv.telefone)
  const inil = initiais(conv.nome||conv.telefone)

  // Agrupa mensagens por data para separadores
  const grouped = []
  let lastDate = null
  ;(mensagens||[]).forEach(m=>{
    const d = new Date(m.criado_em).toDateString()
    if (d !== lastDate) { grouped.push({ type:'date', date:m.criado_em }); lastDate=d }
    grouped.push({ type:'msg', msg:m })
  })

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%' }}>

      {/* Header do chat */}
      <div style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',
        borderBottom:`1px solid ${T.sep}`,flexShrink:0,
        background:`linear-gradient(90deg,${cor}08,${T.bg2})` }}>

        <div style={{ width:36,height:36,borderRadius:'50%',flexShrink:0,
          background:`linear-gradient(135deg,${cor}35,${cor}15)`,
          border:`2px solid ${cor}45`,display:'flex',alignItems:'center',
          justifyContent:'center',fontSize:12,fontWeight:800,color:cor }}>
          {inil}
        </div>

        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:7 }}>
            <span style={{ fontSize:14,fontWeight:700,color:T.ink1,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
              {conv.nome||conv.telefone}
            </span>
            {/* Mode badge */}
            <span style={{ display:'inline-flex',alignItems:'center',gap:3,
              padding:'1px 7px',borderRadius:99,fontSize:9,fontWeight:700,
              background:isIA?T.purpleDim:T.blueDim,
              color:isIA?T.purple:T.blue,
              border:`1px solid ${isIA?T.purpleBor:T.blueBor}` }}>
              {isIA?<Bot size={8}/>:<User size={8}/>}
              {isIA?'IA':'Humano'}
            </span>
          </div>
          <div style={{ fontSize:10.5,color:T.ink4,fontFamily:'monospace' }}>
            {conv.telefone}
          </div>
        </div>

        {/* Ações rápidas */}
        <div style={{ display:'flex',alignItems:'center',gap:6,flexShrink:0 }}>
          {/* Toggle IA/Humano */}
          <button onClick={()=>onModoChange(!isIA)}
            title={isIA?'Transferir para humano':'Devolver para IA'}
            style={{ display:'flex',alignItems:'center',gap:6,
              padding:'6px 12px',borderRadius:9,border:`1px solid ${isIA?T.purpleBor:T.blueBor}`,
              background:isIA?T.purpleDim:T.blueDim,
              color:isIA?T.purple:T.blue,cursor:'pointer',fontSize:11,fontWeight:700,
              transition:'all .15s' }}>
            {isIA?<><Bot size={12}/>IA ativo</>:<><User size={12}/>Humano ativo</>}
          </button>

          {/* Status / resolver */}
          <div style={{ position:'relative' }}>
            <button onClick={()=>setMenuAberto(v=>!v)}
              style={{ display:'flex',alignItems:'center',gap:5,
                padding:'6px 12px',borderRadius:9,border:`1px solid ${sc.cor}40`,
                background:`${sc.cor}12`,color:sc.cor,cursor:'pointer',
                fontSize:11,fontWeight:700,transition:'all .15s' }}>
              <sc.icon size={12}/>{sc.lbl}
              <ChevronDown size={10}/>
            </button>
            {menuAberto && (
              <div style={{ position:'absolute',top:'calc(100% + 6px)',right:0,
                background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
                border:`1px solid ${T.sep2}`,borderRadius:12,overflow:'hidden',
                boxShadow:'0 12px 36px rgba(0,0,0,.5)',zIndex:100,minWidth:160 }}>
                {Object.entries(STATUS_CFG).map(([k,v])=>(
                  <button key={k} onClick={()=>{ onStatusChange(k); setMenuAberto(false) }}
                    style={{ display:'flex',alignItems:'center',gap:8,
                      width:'100%',padding:'10px 14px',border:'none',cursor:'pointer',
                      background:'transparent',color:v.cor,fontSize:12,fontWeight:600,
                      textAlign:'left',transition:'background .1s' }}
                    onMouseEnter={e=>e.currentTarget.style.background=T.gray}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <v.icon size={12}/>{v.lbl}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <div style={{ flex:1,overflowY:'auto',padding:'12px 0',
        background:T.bg0 }}
        onClick={()=>menuAberto&&setMenuAberto(false)}>
        {loading ? (
          <div style={{ display:'flex',justifyContent:'center',padding:'40px 0',color:T.ink4 }}>
            <RefreshCw size={16} style={{ animation:'cv-spin 1s linear infinite' }}/>
          </div>
        ) : grouped.length === 0 ? (
          <div style={{ textAlign:'center',padding:'48px 16px',color:T.ink4 }}>
            <MessageSquare size={24} style={{ display:'block',margin:'0 auto 10px',opacity:.15 }}/>
            <p style={{ fontSize:13,margin:0 }}>Nenhuma mensagem ainda</p>
          </div>
        ) : (
          grouped.map((item,i)=>(
            item.type==='date'
              ? <DateSep key={`d-${i}`} date={item.date}/>
              : <MsgBubble key={item.msg.id||i} msg={item.msg}/>
          ))
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <InputBar onEnviar={onEnviar} enviando={enviando} disabled={isIA}/>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function PageConversas({ api='', onNavigate }) {
  const [conversas,  setConversas]  = useState([])
  const [sel,        setSel]        = useState(null)      // telefone selecionado
  const [mensagens,  setMensagens]  = useState([])
  const [loadConv,   setLoadConv]   = useState(true)
  const [loadMsg,    setLoadMsg]    = useState(false)
  const [enviando,   setEnviando]   = useState(false)
  const [busca,      setBusca]      = useState('')
  const [filtro,     setFiltro]     = useState('todos')   // todos|ia|manual|pendente|resolvido
  const [showPanel,  setShowPanel]  = useState(true)
  const [newMsgFlash,setFlash]      = useState(false)
  const prevCountRef = useRef(0)
  const pollRef      = useRef()

  // ── Carrega lista de conversas ────────────────────────────────────────────
  const fetchConversas = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/dashboard/conversas`, { signal:AbortSignal.timeout(6000) })
      if (!r.ok) return
      const d = await r.json()
      const lista = d.conversas || []
      if (lista.length > prevCountRef.current && prevCountRef.current > 0) {
        setFlash(true); setTimeout(()=>setFlash(false), 2000)
      }
      prevCountRef.current = lista.length
      setConversas(lista)
    } catch {} finally { setLoadConv(false) }
  }, [api])

  // ── Carrega mensagens da conversa selecionada ──────────────────────────────
  const fetchMensagens = useCallback(async (tel) => {
    if (!tel) return
    setLoadMsg(true)
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${tel}?limit=80`, { signal:AbortSignal.timeout(8000) })
      if (!r.ok) return
      const d = await r.json()
      setMensagens(d.mensagens||[])
      // Atualiza modo na conversa ativa
      if (d.modo) setConversas(cs=>cs.map(c=>c.telefone===tel?{...c,modo_ia:d.modo}:c))
    } catch {} finally { setLoadMsg(false) }
  }, [api])

  useEffect(() => {
    fetchConversas()
    pollRef.current = setInterval(fetchConversas, 20000)
    return () => clearInterval(pollRef.current)
  }, [fetchConversas])

  useEffect(() => {
    if (!sel) return
    fetchMensagens(sel)
    const iv = setInterval(()=>fetchMensagens(sel), 8000)
    return () => clearInterval(iv)
  }, [sel, fetchMensagens])

  // ── Ações ─────────────────────────────────────────────────────────────────
  const selecionar = (tel) => {
    setSel(tel)
    setMensagens([])
  }

  const enviarMensagem = async (texto) => {
    if (!sel) return
    setEnviando(true)
    const msg = { id:`tmp-${Date.now()}`, telefone:sel, conteudo:texto,
      direcao:'saida', modo:'manual', criado_em:new Date().toISOString() }
    setMensagens(prev=>[...prev, msg])
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ telefone:sel, mensagem:texto }),
      })
      setTimeout(()=>fetchMensagens(sel), 1000)
    } catch {}
    setEnviando(false)
  }

  const toggleModo = async (ativarIA) => {
    if (!sel) return
    const novoModo = ativarIA ? 'ia' : 'manual'
    setConversas(cs=>cs.map(c=>c.telefone===sel?{...c,modo_ia:novoModo}:c))
    await fetch(`${api}/api/dashboard/manual/${sel}`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ ativo:!ativarIA }),
    }).catch(()=>{})
  }

  const mudarStatus = async (status) => {
    if (!sel) return
    setConversas(cs=>cs.map(c=>c.telefone===sel?{...c,status_atendimento:status}:c))
    await fetch(`${api}/api/dashboard/status/${sel}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ status }),
    }).catch(()=>{})
  }

  // ── Filtros ───────────────────────────────────────────────────────────────
  const conversasFiltradas = conversas.filter(c => {
    if (busca) {
      const q = busca.toLowerCase()
      if (!(c.nome||'').toLowerCase().includes(q) &&
          !(c.telefone||'').includes(q) &&
          !(c.ultima_mensagem||'').toLowerCase().includes(q)) return false
    }
    if (filtro === 'ia')       return c.modo_ia !== 'manual'
    if (filtro === 'manual')   return c.modo_ia === 'manual'
    if (filtro === 'pendente') return c.status_atendimento === 'pendente'
    if (filtro === 'resolvido')return c.status_atendimento === 'resolvido'
    return true
  })

  const convAtiva = conversas.find(c=>c.telefone===sel) || null

  const FILTROS = [
    { id:'todos',    lbl:'Todos',   n:conversas.length },
    { id:'manual',   lbl:'Humano',  n:conversas.filter(c=>c.modo_ia==='manual').length },
    { id:'ia',       lbl:'IA',      n:conversas.filter(c=>c.modo_ia!=='manual').length },
    { id:'pendente', lbl:'Pendente',n:conversas.filter(c=>c.status_atendimento==='pendente').length },
  ]

  return (
    <div style={{ display:'flex',height:'100%',background:T.bg0,overflow:'hidden',
      fontFamily:'system-ui,sans-serif' }}>
      <style>{`
        @keyframes cv-spin   { to{transform:rotate(360deg)} }
        @keyframes cv-ping   { 0%{transform:scale(1);opacity:.5} 75%,100%{transform:scale(2.2);opacity:0} }
        @keyframes cv-fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cv-flash  { 0%,100%{background:transparent} 50%{background:rgba(0,230,118,.06)} }
      `}</style>

      {/* ── LISTA DE CONVERSAS ─────────────────────────────────────────── */}
      <aside style={{ width:290,flexShrink:0,display:'flex',flexDirection:'column',
        background:`linear-gradient(180deg,${T.bg2},${T.bg1})`,
        borderRight:`1px solid ${T.sep}` }}>

        {/* Header */}
        <div style={{ padding:'16px 14px 12px',borderBottom:`1px solid ${T.sep}`,
          animation:newMsgFlash?'cv-flash .8s ease':undefined }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <MessageSquare size={15} style={{ color:T.purple }}/>
              <span style={{ fontSize:15,fontWeight:800,color:T.ink1,letterSpacing:'-.02em' }}>
                Conversas
              </span>
              {conversas.length>0&&(
                <span style={{ fontSize:10,padding:'1px 7px',borderRadius:99,fontWeight:700,
                  background:T.purpleDim,color:T.purple,border:`1px solid ${T.purpleBor}` }}>
                  {conversas.length}
                </span>
              )}
            </div>
            <button onClick={fetchConversas}
              style={{ width:28,height:28,borderRadius:8,border:`1px solid ${T.sep}`,
                background:'transparent',cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',color:T.ink4 }}>
              <RefreshCw size={12}/>
            </button>
          </div>

          {/* Search */}
          <div style={{ position:'relative',marginBottom:10 }}>
            <Search size={12} style={{ position:'absolute',left:10,top:'50%',
              transform:'translateY(-50%)',color:T.ink4,pointerEvents:'none' }}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)}
              placeholder="Buscar conversa..."
              style={{ width:'100%',padding:'8px 10px 8px 30px',borderRadius:9,
                background:T.bg1,border:`1px solid ${T.sep2}`,
                color:T.ink1,fontSize:12.5,outline:'none',fontFamily:'inherit',
                boxSizing:'border-box' }}/>
          </div>

          {/* Filtros */}
          <div style={{ display:'flex',gap:4,overflow:'auto' }}>
            {FILTROS.map(f=>(
              <button key={f.id} onClick={()=>setFiltro(f.id)}
                style={{ display:'flex',alignItems:'center',gap:4,
                  padding:'4px 9px',borderRadius:99,border:'none',cursor:'pointer',
                  fontSize:10.5,fontWeight:filtro===f.id?700:500,whiteSpace:'nowrap',
                  background:filtro===f.id?T.purpleDim:'transparent',
                  color:filtro===f.id?T.purple:T.ink4,
                  border:`1px solid ${filtro===f.id?T.purpleBor:'transparent'}`,
                  transition:'all .14s' }}>
                {f.lbl}
                {f.n>0&&<span style={{ fontSize:9,fontWeight:700 }}>{f.n}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex:1,overflowY:'auto',scrollbarWidth:'none' }}>
          {loadConv ? (
            <div style={{ display:'flex',justifyContent:'center',padding:'40px 0',color:T.ink4 }}>
              <RefreshCw size={14} style={{ animation:'cv-spin 1s linear infinite' }}/>
            </div>
          ) : conversasFiltradas.length === 0 ? (
            <div style={{ textAlign:'center',padding:'40px 16px',color:T.ink4 }}>
              <Inbox size={22} style={{ display:'block',margin:'0 auto 10px',opacity:.15 }}/>
              <p style={{ fontSize:12,margin:0 }}>
                {busca?'Nenhuma conversa encontrada':'Sem conversas ativas'}
              </p>
            </div>
          ) : (
            conversasFiltradas.map(c=>(
              <ConversaItem key={c.telefone} c={c}
                ativo={sel===c.telefone}
                onClick={()=>selecionar(c.telefone)}/>
            ))
          )}
        </div>

        {/* Footer info */}
        <div style={{ padding:'8px 14px',borderTop:`1px solid ${T.sep}`,
          display:'flex',alignItems:'center',gap:6,fontSize:10,color:T.ink4 }}>
          <div style={{ width:5,height:5,borderRadius:'50%',background:T.green,
            boxShadow:`0 0 5px ${T.green}` }}/>
          Atualiza a cada 20s
        </div>
      </aside>

      {/* ── THREAD ──────────────────────────────────────────────────────── */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',
        minWidth:0,borderRight:`1px solid ${T.sep}` }}>
        <ChatThread conv={convAtiva} mensagens={mensagens} api={api}
          loading={loadMsg} onEnviar={enviarMensagem} enviando={enviando}
          onModoChange={ativarIA=>toggleModo(ativarIA)}
          onStatusChange={mudarStatus}/>
      </div>

      {/* ── PAINEL CONTATO ─────────────────────────────────────────────── */}
      <div style={{ position:'relative',display:'flex' }}>
        {/* Toggle botão */}
        <button onClick={()=>setShowPanel(v=>!v)}
          style={{ position:'absolute',left:-16,top:'50%',transform:'translateY(-50%)',
            width:28,height:28,borderRadius:'50%',zIndex:10,
            background:T.bg3,border:`1px solid ${T.sep2}`,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
            color:T.ink4,boxShadow:'0 2px 8px rgba(0,0,0,.3)',transition:'all .15s' }}>
          {showPanel ? <ChevronRight size={12}/> : <ArrowLeft size={12}/>}
        </button>

        {showPanel && (
          <div style={{ width:256,borderLeft:`1px solid ${T.sep}`,
            background:`linear-gradient(180deg,${T.bg2},${T.bg1})`,
            overflow:'hidden' }}>
            <ContatoPanel conv={convAtiva} api={api}
              onModoChange={ativarIA=>toggleModo(ativarIA)}/>
          </div>
        )}
      </div>
    </div>
  )
}
