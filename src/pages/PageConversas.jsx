/**
 * PageConversas v3
 * Fix: loop de polling | ModalPedido NIVELMAX | Carrinho | Reset | Catálogo melhorado
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, MessageSquare, Bot, User, Send, RefreshCw, X,
  ChevronDown, ChevronRight, Zap, Hash, Check,
  Package, Truck, ShoppingCart, ShoppingBag, CreditCard,
  Copy, Download, FileText, Image, Mic, Video,
  Bell, AlertTriangle, CheckCircle, Clock, Inbox,
  ArrowLeft, Trash2, RotateCcw, ExternalLink, Radio,
  MapPin, Tag, Banknote, TrendingUp,
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
  pendente:     { lbl:'Pendente',     cor:T.amber,  Icon:Clock       },
  em_andamento: { lbl:'Em andamento', cor:T.blue,   Icon:RefreshCw   },
  resolvido:    { lbl:'Resolvido',    cor:T.green,  Icon:CheckCircle },
  encerrado:    { lbl:'Encerrado',    cor:T.ink4,   Icon:X           },
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

// Jornada do pedido para timeline
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

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA
// ─────────────────────────────────────────────────────────────────────────────
function getMediaType(c='') {
  const s=c.toLowerCase()
  if(!c) return 'text'
  if(s.includes('[imagem]')||s.includes('[image]')) return 'img_ph'
  if(s.includes('[áudio]')||s.includes('[audio]'))  return 'aud_ph'
  if(s.includes('[vídeo]')||s.includes('[video]'))  return 'vid_ph'
  if(s.includes('[documento]')||s.includes('[document]')) return 'doc_ph'
  if(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(s)) return 'image'
  if(/\.(mp3|ogg|wav|m4a|opus)(\?.*)?$/i.test(s))  return 'audio'
  if(/\.(mp4|webm|mov)(\?.*)?$/i.test(s))           return 'video'
  if(/\.pdf(\?.*)?$/i.test(s))                       return 'pdf'
  return 'text'
}

function MediaContent({ content, tipo }) {
  const [err,setErr] = useState(false)
  const ph = {fontSize:12,color:T.ink3,display:'flex',alignItems:'center',gap:7,
    padding:'8px 10px',borderRadius:9,background:T.bg4,border:`1px solid ${T.sep}`,marginTop:4}
  if(tipo==='image'&&!err) return <img src={content} alt="" onError={()=>setErr(true)}
    style={{ maxWidth:220,maxHeight:180,borderRadius:9,display:'block',marginTop:4,
      border:`1px solid ${T.sep}`,cursor:'pointer' }} onClick={()=>window.open(content,'_blank')}/>
  if(tipo==='img_ph'||err) return <div style={ph}><Image size={13} style={{ color:T.cyan }}/> Imagem</div>
  if(tipo==='audio') return <audio controls src={content} style={{ width:200,height:32,marginTop:5 }}/>
  if(tipo==='aud_ph') return <div style={ph}><Mic size={13} style={{ color:T.green }}/> Áudio de voz</div>
  if(tipo==='video') return <video controls src={content} style={{ maxWidth:220,borderRadius:9,marginTop:4 }}/>
  if(tipo==='vid_ph') return <div style={ph}><Video size={13} style={{ color:T.purple }}/> Vídeo</div>
  if(tipo==='pdf') return <a href={content} target="_blank" rel="noreferrer"
    style={{ ...ph,color:T.blue,textDecoration:'none' }}><FileText size={13}/>Abrir PDF</a>
  if(tipo==='doc_ph') return <div style={ph}><FileText size={13} style={{ color:T.amber }}/> Documento</div>
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// BOLHA DE MENSAGEM
// ─────────────────────────────────────────────────────────────────────────────
function MsgBubble({ msg }) {
  const isEntrada = msg.direcao==='entrada'
  const isManual  = msg.modo==='manual'
  const isGatilho = !!msg.gatilho || (msg.modo==='auto'&&msg.motor&&!msg.motor.includes('gemini'))
  const isAI      = !isEntrada&&!isManual&&!isGatilho
  const tipo      = getMediaType(msg.conteudo||'')
  const isText    = tipo==='text'
  const hora      = msg.criado_em ? new Date(msg.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : ''

  // ── Mensagem de gatilho — banner, não bolha ──────────────────────────────
  if (isGatilho) {
    const gLabel = GATILHO_LABEL[msg.gatilho]||msg.template_nome||msg.gatilho||'Automação'
    return (
      <div style={{ padding:'4px 14px 8px',display:'flex',flexDirection:'column',alignItems:'center' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,width:'100%',marginBottom:6 }}>
          <div style={{ flex:1,height:1,background:`linear-gradient(90deg,transparent,${T.amber}35)` }}/>
          <span style={{ display:'flex',alignItems:'center',gap:5,padding:'2px 10px',
            borderRadius:99,background:T.amberDim,border:`1px solid ${T.amberBor}`,
            fontSize:9.5,fontWeight:700,color:T.amber }}>
            <Zap size={8}/> GATILHO · {gLabel.toUpperCase()} · {hora}
          </span>
          <div style={{ flex:1,height:1,background:`linear-gradient(270deg,transparent,${T.amber}35)` }}/>
        </div>
        {/* Corpo da mensagem enviada */}
        {msg.conteudo && (
          <div style={{ maxWidth:'82%',padding:'9px 13px',borderRadius:11,
            background:`linear-gradient(135deg,${T.amberDim},${T.bg3})`,
            border:`1px solid ${T.amberBor}60` }}>
            {isText
              ? <p style={{ margin:0,fontSize:12.5,lineHeight:1.65,color:T.ink2,
                  whiteSpace:'pre-wrap',wordBreak:'break-word' }}>{msg.conteudo}</p>
              : <MediaContent content={msg.conteudo} tipo={tipo}/>}
          </div>
        )}
      </div>
    )
  }

  // ── Bolha normal ─────────────────────────────────────────────────────────
  const bg  = isEntrada?`linear-gradient(135deg,${T.bg3},${T.bg4})`:isAI?`linear-gradient(135deg,${T.purple}28,${T.purple}14)`:`linear-gradient(135deg,${T.blue}28,${T.blue}14)`
  const bor = isEntrada?`1px solid ${T.sep2}`:isAI?`1px solid ${T.purple}28`:`1px solid ${T.blue}28`
  return (
    <div style={{ display:'flex',flexDirection:'column',
      alignItems:isEntrada?'flex-start':'flex-end',marginBottom:5,padding:'0 14px' }}>
      {!isEntrada&&(
        <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:3,
          fontSize:9.5,fontWeight:700,color:isAI?T.purple:T.blue }}>
          {isAI?<Bot size={9}/>:<User size={9}/>}{isAI?(msg.motor||'IA'):'Atendente'}
        </div>
      )}
      <div style={{ maxWidth:'76%',padding:'9px 12px',
        borderRadius:isEntrada?'4px 14px 14px 14px':'14px 4px 14px 14px',
        background:bg,border:bor,
        boxShadow:isEntrada?'0 2px 8px rgba(0,0,0,.2)':`0 2px 10px ${isAI?T.purple:T.blue}12` }}>
        {isText
          ? <p style={{ margin:0,fontSize:13.5,lineHeight:1.65,color:T.ink1,
              whiteSpace:'pre-wrap',wordBreak:'break-word' }}>{msg.conteudo}</p>
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
    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 14px',margin:'4px 0' }}>
      <div style={{ flex:1,height:1,background:T.sep }}/>
      <span style={{ fontSize:10,fontWeight:700,color:T.ink4,padding:'2px 10px',
        borderRadius:99,background:T.bg3,border:`1px solid ${T.sep}`,whiteSpace:'nowrap' }}>{lbl}</span>
      <div style={{ flex:1,height:1,background:T.sep }}/>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT BAR
// ─────────────────────────────────────────────────────────────────────────────
const RAPIDAS = [
  'Olá! Como posso ajudar?',
  'Vou verificar isso agora para você.',
  'Pode me informar o número do seu pedido?',
  'O prazo de entrega é de 3 a 7 dias úteis.',
  'Em breve nossa equipe vai te chamar.',
]
function InputBar({ onEnviar, enviando, disabled }) {
  const [txt,setTxt]=useState('')
  const [rp,setRp]=useState(false)
  const ref=useRef()
  const enviar=()=>{ if(!txt.trim()||enviando||disabled) return; onEnviar(txt.trim()); setTxt(''); ref.current?.focus() }
  return (
    <div style={{ padding:'10px 14px',borderTop:`1px solid ${T.sep}`,background:T.bg2,position:'relative' }}>
      {rp&&(
        <div style={{ position:'absolute',bottom:'100%',left:14,right:14,marginBottom:6,
          background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:14,overflow:'hidden',
          boxShadow:'0 -12px 32px rgba(0,0,0,.5)',animation:'cv-fadeUp .15s ease' }}>
          <div style={{ padding:'7px 12px',borderBottom:`1px solid ${T.sep}`,
            fontSize:9.5,fontWeight:700,color:T.ink4,textTransform:'uppercase',letterSpacing:'.08em' }}>
            Respostas rápidas
          </div>
          {RAPIDAS.map((r,i)=>(
            <button key={i} onClick={()=>{ setTxt(r); setRp(false); ref.current?.focus() }}
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
      <div style={{ display:'flex',alignItems:'flex-end',gap:7 }}>
        <button onClick={()=>setRp(v=>!v)}
          style={{ width:34,height:34,borderRadius:9,border:`1px solid ${rp?T.purpleBor:T.sep2}`,
            background:rp?T.purpleDim:'transparent',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
            color:rp?T.purple:T.ink4,flexShrink:0,transition:'all .14s' }}>
          <Zap size={13}/>
        </button>
        <textarea ref={ref} value={txt}
          onChange={e=>setTxt(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar()} }}
          onInput={e=>{ e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
          disabled={disabled} rows={1}
          placeholder={disabled?'IA está respondendo automaticamente...':'Mensagem...'}
          style={{ flex:1,padding:'9px 12px',borderRadius:10,resize:'none',background:T.bg1,
            border:`1px solid ${T.sep2}`,color:T.ink1,fontSize:13.5,lineHeight:1.5,outline:'none',
            fontFamily:'inherit',boxSizing:'border-box',maxHeight:120,overflowY:'auto',
            opacity:disabled?.5:1,transition:'border-color .15s' }}
          onFocus={e=>e.target.style.borderColor=`${T.purple}50`}
          onBlur={e=>e.target.style.borderColor=T.sep2}/>
        <button onClick={enviar} disabled={!txt.trim()||enviando||disabled}
          style={{ width:38,height:38,borderRadius:10,border:'none',cursor:'pointer',
            flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
            background:txt.trim()&&!disabled?`linear-gradient(135deg,${T.green},${T.green}cc)`:'rgba(255,255,255,.08)',
            color:txt.trim()&&!disabled?'#000':T.ink4,
            boxShadow:txt.trim()&&!disabled?`0 3px 14px ${T.green}35`:undefined,
            transition:'all .16s',opacity:(!txt.trim()||enviando||disabled)?.5:1 }}>
          {enviando?<RefreshCw size={14} style={{ animation:'cv-spin 1s linear infinite' }}/>:<Send size={14}/>}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL PEDIDO — slide-in NIVELMAX
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

  const isPendente = [6,24,'Em Aberto','Pag. pendente','pendente'].includes(pedido.situacao_id||pedido.situacao)
  const linkRastreio = `https://rastreio.sostrass.com.br/p/${pedido.rastreio}`
  const linkPedido   = `https://rastreio.sostrass.com.br/pedido/${pedido.numero}`

  const copiar=(txt,key)=>{ copyText(txt); setCopied(key); setTimeout(()=>setCopied(null),2000) }

  const gerarLinkMP=async()=>{
    setLinkLoad(true)
    try {
      const r=await fetch(`${api}/api/dashboard/mp-link-pagamento`,{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ telefone:tel,numero_pedido:pedido.numero,
          valor:parseFloat((pedido.total||'0').replace(/[R$\s]/g,'').replace(',','.').trim())||0,
          descricao:`Pedido #${pedido.numero}` })})
      const d=await r.json()
      if(d.init_point){ copyText(d.init_point); window.open(d.init_point,'_blank') }
    } catch {}
    setLinkLoad(false)
  }

  // Monta timeline de jornada
  const disparoMap = {}
  disparos.forEach(d=>{ disparoMap[d.gatilho]=d })

  const ActionBtn = ({ label, onClick, cor, icon:Ic, loading:ld }) => (
    <button onClick={onClick} disabled={ld}
      style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',
        borderRadius:10,border:`1px solid ${cor}40`,background:`${cor}12`,
        color:cor,cursor:'pointer',fontSize:11.5,fontWeight:700,
        boxShadow:`0 2px 8px ${cor}15`,transition:'all .14s',
        opacity:ld?.6:1,whiteSpace:'nowrap' }}
      onMouseEnter={e=>e.currentTarget.style.background=`${cor}22`}
      onMouseLeave={e=>e.currentTarget.style.background=`${cor}12`}>
      {ld?<RefreshCw size={12} style={{ animation:'cv-spin 1s linear infinite' }}/>:<Ic size={12}/>}
      {label}
    </button>
  )

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:8000,
        background:'rgba(0,0,0,.55)',backdropFilter:'blur(4px)',animation:'cv-bg .2s ease' }}/>
      {/* Drawer */}
      <div style={{ position:'fixed',top:0,right:0,bottom:0,zIndex:8001,
        width:480,display:'flex',flexDirection:'column',
        background:`linear-gradient(180deg,${T.bg2},${T.bg1})`,
        borderLeft:`1px solid ${T.sep2}`,
        boxShadow:'-24px 0 64px rgba(0,0,0,.6)',
        animation:'cv-slideIn .28s cubic-bezier(.2,.8,.2,1)' }}>

        {/* Header */}
        <div style={{ padding:'18px 20px',borderBottom:`1px solid ${T.sep}`,
          background:`linear-gradient(90deg,${T.green}08,transparent)`,flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <div style={{ width:36,height:36,borderRadius:10,
                background:T.greenDim,border:`1px solid ${T.greenBor}`,
                display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Package size={16} style={{ color:T.green }}/>
              </div>
              <div>
                <div style={{ fontSize:18,fontWeight:800,color:T.green,letterSpacing:'-.03em' }}>
                  #{pedido.numero}
                </div>
                <div style={{ fontSize:11,color:T.ink4 }}>{pedido.data}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:32,height:32,borderRadius:9,
              border:`1px solid ${T.sep2}`,background:T.gray,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',color:T.ink4,
              transition:'all .13s' }}
              onMouseEnter={e=>{ e.currentTarget.style.color=T.red; e.currentTarget.style.borderColor=T.redBor }}
              onMouseLeave={e=>{ e.currentTarget.style.color=T.ink4; e.currentTarget.style.borderColor=T.sep2 }}>
              <X size={14}/>
            </button>
          </div>

          {/* Status + valor */}
          <div style={{ display:'flex',alignItems:'center',gap:10,marginTop:10 }}>
            <span style={{ padding:'3px 12px',borderRadius:99,fontSize:11,fontWeight:700,
              background:T.bg3,border:`1px solid ${T.sep2}`,color:T.ink2 }}>
              {pedido.situacao}
            </span>
            <span style={{ fontSize:17,fontWeight:800,color:T.ink1,letterSpacing:'-.02em' }}>
              {pedido.total}
            </span>
            {pedido.forma_pagamento&&pedido.forma_pagamento!=='—'&&(
              <span style={{ fontSize:10.5,color:T.ink4 }}>{pedido.forma_pagamento}</span>
            )}
          </div>
        </div>

        {/* Conteúdo scrollável */}
        <div style={{ flex:1,overflowY:'auto',padding:'16px 20px',
          display:'flex',flexDirection:'column',gap:16 }}>

          {/* Botões de ação */}
          <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
            <ActionBtn label={copied==='link'?'Copiado!':'Link do pedido'}
              onClick={()=>copiar(linkPedido,'link')}
              cor={T.cyan} icon={copied==='link'?Check:Copy}/>
            {pedido.rastreio&&pedido.rastreio!=='—'&&(
              <ActionBtn label="Rastrear" onClick={()=>window.open(linkRastreio,'_blank')}
                cor={T.purple} icon={Truck}/>
            )}
            {pedido.nfe_link&&(
              <ActionBtn label="NF-e" onClick={()=>window.open(pedido.nfe_link,'_blank')}
                cor={T.blue} icon={FileText}/>
            )}
            {isPendente&&pixKey&&(
              <ActionBtn label={copied==='pix'?'Copiado!':'Copiar PIX'}
                onClick={()=>copiar(pixKey,'pix')}
                cor={T.green} icon={copied==='pix'?Check:Copy}/>
            )}
            {isPendente&&(
              <ActionBtn label={linkLoad?'Gerando...':'Cartão (MP)'}
                onClick={gerarLinkMP} loading={linkLoad}
                cor={T.amber} icon={CreditCard}/>
            )}
          </div>

          {/* Rastreio */}
          {pedido.rastreio&&pedido.rastreio!=='—'&&(
            <div style={{ padding:'12px 14px',borderRadius:12,
              background:T.bg3,border:`1px solid ${T.sep}` }}>
              <div style={{ fontSize:10,fontWeight:700,color:T.ink4,textTransform:'uppercase',
                letterSpacing:'.08em',marginBottom:6 }}>Código de rastreio</div>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <span style={{ fontFamily:'monospace',fontSize:14,fontWeight:700,color:T.purple }}>
                  {pedido.rastreio}
                </span>
                {pedido.transportadora&&pedido.transportadora!=='—'&&(
                  <span style={{ fontSize:11,color:T.ink4 }}>· {pedido.transportadora}</span>
                )}
              </div>
            </div>
          )}

          {/* Timeline de jornada */}
          <div>
            <div style={{ fontSize:11,fontWeight:700,color:T.ink4,textTransform:'uppercase',
              letterSpacing:'.08em',marginBottom:12 }}>Jornada do pedido</div>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute',left:14,top:8,bottom:8,width:2,
                background:`linear-gradient(180deg,${T.green}40,transparent)` }}/>
              <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                {JORNADA_STEPS.map((step,i)=>{
                  const disp=disparoMap[step.gatilho]
                  const feito=!!disp
                  return (
                    <div key={i} style={{ display:'flex',gap:12,alignItems:'flex-start' }}>
                      <div style={{ width:30,height:30,borderRadius:'50%',flexShrink:0,
                        background:feito?`${step.cor}25`:`${T.bg4}`,
                        border:`2px solid ${feito?step.cor:T.sep}`,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        boxShadow:feito?`0 0 12px ${step.cor}30`:undefined,
                        zIndex:1,transition:'all .2s' }}>
                        <step.Icon size={13} style={{ color:feito?step.cor:T.ink4 }}/>
                      </div>
                      <div style={{ flex:1,paddingTop:5,minWidth:0 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                          <span style={{ fontSize:12.5,fontWeight:feito?700:400,
                            color:feito?T.ink1:T.ink4 }}>{step.label}</span>
                          {feito&&(
                            <span style={{ fontSize:9.5,color:T.ink4 }}>
                              {disp.criado_em?new Date(disp.criado_em).toLocaleString('pt-BR',{
                                day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'
                              }):'—'}
                            </span>
                          )}
                        </div>
                        {feito&&disp.status&&(
                          <div style={{ fontSize:10,color:disp.status==='enviado'?T.green:T.red,
                            fontWeight:600,marginTop:2 }}>
                            {disp.status==='enviado'?'✓ Enviado ao cliente':'✗ '+disp.status}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Itens do pedido */}
          {pedido.itens?.length>0&&(
            <div>
              <div style={{ fontSize:11,fontWeight:700,color:T.ink4,textTransform:'uppercase',
                letterSpacing:'.08em',marginBottom:10 }}>Itens ({pedido.itens.length})</div>
              <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                {pedido.itens.map((it,i)=>(
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:10,
                    padding:'9px 12px',borderRadius:10,background:T.bg4,border:`1px solid ${T.sep}` }}>
                    <div style={{ width:28,height:28,borderRadius:7,flexShrink:0,
                      background:T.bg3,border:`1px solid ${T.sep}`,
                      display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <Package size={12} style={{ color:T.ink4 }}/>
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:12.5,color:T.ink1,overflow:'hidden',
                        textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{it.nome}</div>
                      <div style={{ fontSize:10.5,color:T.ink4 }}>
                        {it.codigo&&`${it.codigo} · `}{it.qtd}× · R$ {it.preco}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gatilhos disparados */}
          {disparos.length>0&&(
            <div>
              <div style={{ fontSize:11,fontWeight:700,color:T.ink4,textTransform:'uppercase',
                letterSpacing:'.08em',marginBottom:8 }}>Comunicações enviadas</div>
              <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
                {disparos.map((d,i)=>(
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:10,
                    padding:'8px 12px',borderRadius:10,
                    background:d.status==='enviado'?T.greenDim:T.redDim,
                    border:`1px solid ${d.status==='enviado'?T.greenBor:T.redBor}` }}>
                    <Zap size={11} style={{ color:d.status==='enviado'?T.green:T.red,flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <span style={{ fontSize:12,fontWeight:600,color:T.ink1 }}>
                        {GATILHO_LABEL[d.gatilho]||d.gatilho}
                      </span>
                      {d.template_nome&&(
                        <span style={{ fontSize:10.5,color:T.ink4,marginLeft:6 }}>{d.template_nome}</span>
                      )}
                    </div>
                    <span style={{ fontSize:10,color:T.ink4,flexShrink:0 }}>
                      {d.criado_em?new Date(d.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAINEL DIREITO — 4 abas
// ─────────────────────────────────────────────────────────────────────────────
function AbaContato({ conv, onModoChange }) {
  const cor=avatarCor(conv.nome||conv.telefone)
  const ini=initiais(conv.nome||conv.telefone)
  const isIA=conv.modo_ia!=='manual'
  const sc=STATUS_CFG[conv.status_atendimento]||STATUS_CFG.pendente
  return (
    <div style={{ padding:'14px 13px',overflowY:'auto',flex:1 }}>
      <div style={{ textAlign:'center',marginBottom:14 }}>
        <div style={{ width:52,height:52,borderRadius:'50%',margin:'0 auto 10px',
          background:`linear-gradient(135deg,${cor}35,${cor}15)`,border:`2px solid ${cor}50`,
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:17,fontWeight:800,color:cor }}>{ini}</div>
        <div style={{ fontSize:14,fontWeight:700,color:T.ink1 }}>{conv.nome||'Sem nome'}</div>
        <div style={{ fontFamily:'monospace',fontSize:11,color:T.ink4,marginTop:3 }}>{conv.telefone}</div>
      </div>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'8px 12px',borderRadius:10,marginBottom:12,
        background:isIA?T.purpleDim:T.blueDim,border:`1px solid ${isIA?T.purpleBor:T.blueBor}` }}>
        <div style={{ display:'flex',alignItems:'center',gap:7 }}>
          {isIA?<Bot size={12} style={{ color:T.purple }}/>:<User size={12} style={{ color:T.blue }}/>}
          <span style={{ fontSize:11.5,fontWeight:700,color:isIA?T.purple:T.blue }}>
            {isIA?'IA respondendo':'Atendimento humano'}
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
      try {
        const r=await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(busca)}&limit=20`)
        const d=await r.json(); setProds(d.produtos||[])
      } catch {} finally { setLoad(false) }
    },busca?350:0)
    return()=>clearTimeout(to.current)
  },[busca,api])

  const enviar=async(p)=>{
    setEnv(p.id)
    const preco=parseFloat(p.preco||p.precoVenda||0)
    const pix=(preco*.9).toFixed(2).replace('.',',')
    const msg=`🛍️ *${p.nome}*\n\n💰 PIX: R$ ${pix} *(10% desconto)*\n💳 Cartão: R$ ${preco.toFixed(2).replace('.',',')} em até 12x\n📦 ${p.disponivel?`Em estoque (${p.estoque} un.)`:'Fora de estoque'}\n🔑 Código: ${p.codigo||'—'}`
    await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({telefone:tel,mensagem:msg})}).catch(()=>{})
    setTimeout(()=>setEnv(null),2500)
  }

  const avise=async(p)=>{
    await fetch(`${api}/api/dashboard/avise-me`,{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({telefone:tel,produto_id:p.id,nome_produto:p.nome,codigo:p.codigo})}).catch(()=>{})
    setAvisei(prev=>({...prev,[p.id]:true}))
  }

  return (
    <div style={{ display:'flex',flexDirection:'column',flex:1,overflow:'hidden' }}>
      <div style={{ padding:'10px 12px',borderBottom:`1px solid ${T.sep}` }}>
        <div style={{ position:'relative' }}>
          <Search size={11} style={{ position:'absolute',left:9,top:'50%',
            transform:'translateY(-50%)',color:T.ink4,pointerEvents:'none' }}/>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar produto..."
            style={{ width:'100%',padding:'7px 9px 7px 27px',borderRadius:9,background:T.bg1,
              border:`1px solid ${T.sep2}`,color:T.ink1,fontSize:12,outline:'none',
              fontFamily:'inherit',boxSizing:'border-box' }}/>
        </div>
      </div>
      <div style={{ flex:1,overflowY:'auto' }}>
        {load&&<div style={{ textAlign:'center',padding:'20px 0',color:T.ink4 }}>
          <RefreshCw size={12} style={{ animation:'cv-spin 1s linear infinite' }}/>
        </div>}
        {!load&&prods.length===0&&<div style={{ textAlign:'center',padding:'24px 12px',color:T.ink4 }}>
          <Package size={18} style={{ display:'block',margin:'0 auto 8px',opacity:.12 }}/>
          <p style={{ fontSize:11,margin:0 }}>{busca?'Sem resultados':'Digite para buscar'}</p>
        </div>}
        {prods.map(p=>{
          const preco=parseFloat(p.preco||p.precoVenda||0)
          const pix=(preco*.9).toFixed(2).replace('.',',')
          const disp=p.disponivel&&parseInt(p.estoque||0)>0
          const jaAviso=avisei[p.id]
          return (
            <div key={p.id} style={{ padding:'10px 12px',borderBottom:`1px solid ${T.sep}`,
              display:'flex',gap:9 }}>
              {/* Imagem */}
              <div style={{ width:48,height:48,borderRadius:9,flexShrink:0,overflow:'hidden',
                background:T.bg3,border:`1px solid ${T.sep}`,
                display:'flex',alignItems:'center',justifyContent:'center' }}>
                {p.imagem
                  ?<img src={p.imagem} alt=""
                      onError={e=>{ e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
                      style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                  : null}
                <ShoppingBag size={16} style={{ color:T.ink4,display:p.imagem?'none':'flex' }}/>
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:12,fontWeight:600,color:T.ink1,lineHeight:1.4,marginBottom:2,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                  {p.nome}
                </div>
                {p.descricao&&(
                  <div style={{ fontSize:10.5,color:T.ink4,lineHeight:1.4,marginBottom:4 }}>
                    {p.descricao.slice(0,80)}{p.descricao.length>80?'…':''}
                  </div>
                )}
                <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:7 }}>
                  <span style={{ fontSize:12,fontWeight:800,color:T.green }}>R${pix}</span>
                  <span style={{ fontSize:8.5,padding:'1px 5px',borderRadius:99,fontWeight:700,
                    background:disp?T.greenDim:T.redDim,color:disp?T.green:T.red,
                    border:`1px solid ${disp?T.greenBor:T.redBor}` }}>
                    {disp?`${p.estoque}un`:'Sem estoque'}
                  </span>
                </div>
                <div style={{ display:'flex',gap:5 }}>
                  {disp?(
                    <button onClick={()=>env!==p.id&&enviar(p)} disabled={!!env}
                      style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 10px',
                        borderRadius:7,border:`1px solid ${T.sep2}`,
                        background:env===p.id?T.greenDim:T.bg4,
                        color:env===p.id?T.green:T.ink3,cursor:'pointer',
                        fontSize:10.5,fontWeight:600,transition:'all .13s',
                        opacity:env&&env!==p.id?.5:1 }}>
                      {env===p.id?<><Check size={9}/>Enviado!</>:<><Send size={9}/>Enviar</>}
                    </button>
                  ):(
                    <button onClick={()=>!jaAviso&&avise(p)}
                      style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 10px',
                        borderRadius:7,border:`1px solid ${T.amberBor}`,
                        background:jaAviso?T.amberDim:'transparent',
                        color:T.amber,cursor:'pointer',fontSize:10.5,fontWeight:600 }}>
                      {jaAviso?<><Check size={9}/>Ok!</>:<><Bell size={9}/>Avise-me</>}
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
  const [load,   setLoad]   =useState(true)
  const [modal,  setModal]  =useState(null)

  useEffect(()=>{
    fetch(`${api}/api/dashboard/contatos/${tel}/pedidos`)
      .then(r=>r.ok?r.json():null).then(d=>{ if(d) setPedidos(d.pedidos||[]); setLoad(false) })
      .catch(()=>setLoad(false))
  },[tel,api])

  if(load) return <div style={{ textAlign:'center',padding:'24px 0',color:T.ink4 }}>
    <RefreshCw size={13} style={{ animation:'cv-spin 1s linear infinite' }}/>
  </div>

  return (
    <div style={{ flex:1,overflowY:'auto' }}>
      {pedidos.length===0?<div style={{ textAlign:'center',padding:'24px 12px',color:T.ink4 }}>
        <Package size={18} style={{ display:'block',margin:'0 auto 8px',opacity:.12 }}/>
        <p style={{ fontSize:11,margin:0 }}>Nenhum pedido</p>
      </div>:pedidos.map((p,i)=>(
        <button key={p.id||i} onClick={()=>setModal(p)}
          style={{ width:'100%',display:'flex',alignItems:'center',gap:10,
            padding:'11px 13px',border:'none',cursor:'pointer',textAlign:'left',
            borderBottom:`1px solid ${T.sep}`,background:'transparent',
            transition:'background .12s' }}
          onMouseEnter={e=>e.currentTarget.style.background=T.gray}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <div style={{ width:8,height:8,borderRadius:'50%',flexShrink:0,
            background:T.green,boxShadow:`0 0 5px ${T.green}` }}/>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:3 }}>
              <span style={{ fontSize:13,fontWeight:700,color:T.green }}>#{p.numero}</span>
              <span style={{ fontSize:11.5,fontWeight:700,color:T.ink1 }}>{p.total}</span>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <span style={{ fontSize:10.5,color:T.ink4 }}>{p.data}</span>
              <span style={{ fontSize:10,padding:'1px 7px',borderRadius:99,fontWeight:600,
                background:T.bg4,border:`1px solid ${T.sep}`,color:T.ink3 }}>{p.situacao}</span>
              {p.rastreio&&p.rastreio!=='—'&&(
                <Truck size={10} style={{ color:T.purple,flexShrink:0 }}/>
              )}
            </div>
          </div>
          <ChevronRight size={12} style={{ color:T.ink4,flexShrink:0 }}/>
        </button>
      ))}

      {modal&&<ModalPedido pedido={modal} tel={tel} api={api}
        pixKey={pixKey} onClose={()=>setModal(null)}/>}
    </div>
  )
}

function AbaCarrinho({ carrinho=[] }) {
  if(carrinho.length===0) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',flex:1,color:T.ink4,padding:20 }}>
      <ShoppingCart size={28} style={{ opacity:.12,display:'block',margin:'0 auto 10px' }}/>
      <p style={{ fontSize:12,margin:0,textAlign:'center' }}>Carrinho vazio</p>
      <p style={{ fontSize:11,color:T.ink4,marginTop:5,textAlign:'center' }}>
        Os itens adicionados via WhatsApp aparecerão aqui
      </p>
    </div>
  )

  const total=carrinho.reduce((a,it)=>a+(parseFloat(it.preco||it.precoVenda||0)*parseInt(it.quantidade||it.qtd||1)),0)

  return (
    <div style={{ flex:1,overflowY:'auto' }}>
      <div style={{ padding:'10px 13px',borderBottom:`1px solid ${T.sep}`,
        display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <span style={{ fontSize:11.5,fontWeight:700,color:T.ink2 }}>
          {carrinho.length} {carrinho.length===1?'item':'itens'}
        </span>
        <span style={{ fontSize:14,fontWeight:800,color:T.green,letterSpacing:'-.02em' }}>
          R$ {total.toFixed(2).replace('.',',')}
        </span>
      </div>
      {carrinho.map((it,i)=>{
        const qtd=parseInt(it.quantidade||it.qtd||1)
        const preco=parseFloat(it.preco||it.precoVenda||0)
        const subtotal=(preco*qtd).toFixed(2).replace('.',',')
        return (
          <div key={i} style={{ padding:'10px 13px',borderBottom:`1px solid ${T.sep}`,
            display:'flex',gap:10,alignItems:'flex-start' }}>
            <div style={{ width:38,height:38,borderRadius:8,flexShrink:0,overflow:'hidden',
              background:T.bg3,border:`1px solid ${T.sep}`,
              display:'flex',alignItems:'center',justifyContent:'center' }}>
              {it.imagem?<img src={it.imagem} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                :<ShoppingBag size={14} style={{ color:T.ink4 }}/>}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:12,fontWeight:600,color:T.ink1,lineHeight:1.4,
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                {it.nome||it.descricao||'—'}
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginTop:3 }}>
                <span style={{ fontSize:10.5,color:T.ink4 }}>{qtd}× R$ {preco.toFixed(2).replace('.',',')}</span>
                <span style={{ fontSize:11,fontWeight:700,color:T.amber }}>= R$ {subtotal}</span>
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
    {id:'contato', lbl:'Contato',  Icon:User,        badge:null},
    {id:'catalogo',lbl:'Catálogo', Icon:ShoppingBag, badge:null},
    {id:'pedidos', lbl:'Pedidos',  Icon:Package,     badge:null},
    {id:'carrinho',lbl:'Carrinho', Icon:ShoppingCart,badge:carrinho?.length||null},
  ]
  if(!conv) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',height:'100%',color:T.ink4 }}>
      <MessageSquare size={20} style={{ opacity:.1,display:'block',margin:'0 auto 8px' }}/>
      <p style={{ fontSize:11.5,margin:0 }}>Selecione uma conversa</p>
    </div>
  )
  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%' }}>
      <div style={{ display:'flex',borderBottom:`1px solid ${T.sep}`,flexShrink:0 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setAba(t.id)}
            style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:4,
              padding:'8px 3px',border:'none',cursor:'pointer',
              background:'transparent',fontSize:10.5,fontWeight:aba===t.id?700:500,
              color:aba===t.id?T.green:T.ink4,
              borderBottom:`2px solid ${aba===t.id?T.green:'transparent'}`,transition:'all .13s',
              position:'relative' }}>
            <t.Icon size={11}/>{t.lbl}
            {t.badge&&<span style={{ position:'absolute',top:4,right:4,width:14,height:14,
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
// ITEM DA LISTA
// ─────────────────────────────────────────────────────────────────────────────
function ConversaItem({ c, ativo, onClick }) {
  const cor=avatarCor(c.nome||c.telefone)
  const ini=initiais(c.nome||c.telefone)
  const isIA=c.modo_ia!=='manual'
  const sc=STATUS_CFG[c.status_atendimento]||STATUS_CFG.pendente
  const isAtivo=c.ultima_atividade&&(Date.now()-new Date(c.ultima_atividade))<5*60*1000
  return (
    <button onClick={onClick} style={{ width:'100%',padding:'10px 13px',border:'none',cursor:'pointer',
      textAlign:'left',position:'relative',
      background:ativo?`linear-gradient(90deg,${cor}11,${T.bg3})`:'transparent',
      borderLeft:`3px solid ${ativo?cor:'transparent'}`,transition:'all .13s' }}
      onMouseEnter={e=>{ if(!ativo) e.currentTarget.style.background=T.gray }}
      onMouseLeave={e=>{ if(!ativo) e.currentTarget.style.background='transparent' }}>
      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
        <div style={{ position:'relative',flexShrink:0 }}>
          <div style={{ width:38,height:38,borderRadius:'50%',
            background:`linear-gradient(135deg,${cor}35,${cor}15)`,
            border:`2px solid ${cor}${ativo?'65':'30'}`,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:12,fontWeight:800,color:cor }}>{ini}</div>
          {isAtivo&&<div style={{ position:'absolute',bottom:0,right:0 }}><Dot cor={T.green} size={8}/></div>}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:2 }}>
            <span style={{ fontSize:12.5,fontWeight:ativo?700:600,color:T.ink1,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:120 }}>
              {c.nome||c.telefone}
            </span>
            <span style={{ fontSize:9.5,color:T.ink4,flexShrink:0 }}>{tempoRel(c.ultima_atividade)}</span>
          </div>
          <div style={{ fontSize:11,color:T.ink3,overflow:'hidden',textOverflow:'ellipsis',
            whiteSpace:'nowrap',marginBottom:4 }}>{c.ultima_mensagem||'—'}</div>
          <div style={{ display:'flex',gap:4 }}>
            <span style={{ display:'inline-flex',alignItems:'center',gap:2,padding:'1px 5px',
              borderRadius:99,fontSize:8,fontWeight:700,
              background:isIA?T.purpleDim:T.blueDim,color:isIA?T.purple:T.blue,
              border:`1px solid ${isIA?T.purpleBor:T.blueBor}` }}>
              {isIA?<Bot size={6}/>:<User size={6}/>}{isIA?'IA':'H'}
            </span>
            <span style={{ display:'inline-flex',alignItems:'center',gap:2,padding:'1px 5px',
              borderRadius:99,fontSize:8,fontWeight:700,
              background:`${sc.cor}12`,color:sc.cor,border:`1px solid ${sc.cor}25` }}>
              {sc.lbl}
            </span>
            {(c.itens_carrinho||0)>0&&(
              <span style={{ display:'inline-flex',alignItems:'center',gap:2,padding:'1px 5px',
                borderRadius:99,fontSize:8,fontWeight:700,
                background:T.amberDim,color:T.amber,border:`1px solid ${T.amberBor}` }}>
                <ShoppingCart size={6}/>{c.itens_carrinho}
              </span>
            )}
          </div>
        </div>
      </div>
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
  const [loadMsg,   setLoadMsg]   = useState(false)   // apenas 1ª carga
  const [enviando,  setEnviando]  = useState(false)
  const [busca,     setBusca]     = useState('')
  const [filtro,    setFiltro]    = useState('todos')
  const [showPanel, setShowPanel] = useState(true)
  const [statusMenu,setStatusMenu]= useState(false)
  const [pixKey,    setPixKey]    = useState('')
  const [toast,     setToast]     = useState(null)
  const [resetConf, setResetConf] = useState(false)
  const [resetting, setResetting] = useState(false)

  const firstLoadRef  = useRef(true)   // ← Fix do loop: só mostra loading na 1ª carga
  const prevStatusRef = useRef({})
  const bottomRef     = useRef()

  // ── Carrega PIX key uma vez ───────────────────────────────────────────────
  useEffect(()=>{
    fetch(`${api}/api/dashboard/pix-key`).then(r=>r.ok?r.json():null)
      .then(d=>{ if(d?.chave) setPixKey(d.chave) }).catch(()=>{})
  },[api])

  // ── Lista de conversas ────────────────────────────────────────────────────
  const fetchConversas = useCallback(async()=>{
    try {
      const r=await fetch(`${api}/api/dashboard/conversas`,{signal:AbortSignal.timeout(6000)})
      if(!r.ok) return
      const d=await r.json(); const lista=d.conversas||[]
      // Detecta reativações
      lista.forEach(c=>{
        const prev=prevStatusRef.current[c.telefone]; const curr=c.status_atendimento
        if(prev&&['resolvido','encerrado'].includes(prev)&&curr==='pendente'){
          setToast({tel:c.telefone,nome:c.nome||c.telefone})
          setTimeout(()=>setToast(null),5000)
        }
        prevStatusRef.current[c.telefone]=curr
      })
      setConversas(lista)
    } catch {} finally { setLoadConv(false) }
  },[api])

  // ── Mensagens da conversa ativa ───────────────────────────────────────────
  const fetchMensagens = useCallback(async(tel, mostrarLoader=false)=>{
    if(!tel) return
    if(mostrarLoader) setLoadMsg(true)
    try {
      const r=await fetch(`${api}/api/dashboard/historico/${tel}?limit=100`,{signal:AbortSignal.timeout(8000)})
      if(!r.ok) return
      const d=await r.json()
      setMensagens(d.mensagens||[])
      setCarrinho(d.carrinho||[])
      if(d.modo) setConversas(cs=>cs.map(c=>c.telefone===tel?{...c,modo_ia:d.modo}:c))
    } catch {} finally { if(mostrarLoader) setLoadMsg(false) }
  },[api])

  useEffect(()=>{ fetchConversas(); const iv=setInterval(fetchConversas,20000); return()=>clearInterval(iv) },[fetchConversas])

  // ── FIX DO LOOP: só mostra loading na 1ª abertura, polling silencioso ────
  useEffect(()=>{
    if(!sel){ setMensagens([]); setCarrinho([]); return }
    firstLoadRef.current=true
    fetchMensagens(sel, true)  // 1ª carga: mostra loading
    const iv=setInterval(()=>{
      fetchMensagens(sel, false)  // polls seguintes: silencioso
    },8000)
    return()=>clearInterval(iv)
  },[sel]) // eslint-disable-line — fetchMensagens é estável

  // Scroll para o final quando mensagens chegam
  useEffect(()=>{ if(mensagens.length) bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[mensagens.length])

  // ── Ações ─────────────────────────────────────────────────────────────────
  const enviar=async(txt)=>{
    if(!sel) return; setEnviando(true)
    const tmp={id:`tmp-${Date.now()}`,telefone:sel,conteudo:txt,direcao:'saida',modo:'manual',criado_em:new Date().toISOString()}
    setMensagens(p=>[...p,tmp])
    await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:sel,mensagem:txt})}).catch(()=>{})
    setTimeout(()=>fetchMensagens(sel,false),1500)
    setEnviando(false)
  }

  const toggleModo=async(ativarIA)=>{
    if(!sel) return
    setConversas(cs=>cs.map(c=>c.telefone===sel?{...c,modo_ia:ativarIA?'ia':'manual'}:c))
    await fetch(`${api}/api/dashboard/manual/${sel}`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({ativo:!ativarIA})}).catch(()=>{})
  }

  const mudarStatus=async(st)=>{
    if(!sel) return
    setConversas(cs=>cs.map(c=>c.telefone===sel?{...c,status_atendimento:st}:c))
    await fetch(`${api}/api/dashboard/status/${sel}`,{method:'PATCH',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({status:st})}).catch(()=>{})
    setStatusMenu(false)
  }

  const resetar=async()=>{
    if(!sel||resetting) return; setResetting(true)
    await fetch(`${api}/api/dashboard/resetar-sessao`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:sel})}).catch(()=>{})
    setMensagens([]); setCarrinho([]); setResetConf(false); setResetting(false)
  }

  // ── Filtros ───────────────────────────────────────────────────────────────
  const convFilt=conversas.filter(c=>{
    if(busca){ const q=busca.toLowerCase(); if(![(c.nome||'').toLowerCase(),c.telefone||'',(c.ultima_mensagem||'').toLowerCase()].some(s=>s.includes(q))) return false }
    if(filtro==='ia')       return c.modo_ia!=='manual'
    if(filtro==='manual')   return c.modo_ia==='manual'
    if(filtro==='pendente') return c.status_atendimento==='pendente'
    return true
  })

  const convAtiva=conversas.find(c=>c.telefone===sel)||null
  const isIA=convAtiva?.modo_ia!=='manual'
  const sc=STATUS_CFG[convAtiva?.status_atendimento]||STATUS_CFG.pendente
  const cor=convAtiva?avatarCor(convAtiva.nome||convAtiva.telefone):T.ink4
  const ini=convAtiva?initiais(convAtiva.nome||convAtiva.telefone):'?'

  // Agrupa por data
  const grouped=[]
  let lastDate=null
  mensagens.forEach(m=>{
    const d=new Date(m.criado_em).toDateString()
    if(d!==lastDate){ grouped.push({type:'date',date:m.criado_em}); lastDate=d }
    grouped.push({type:'msg',msg:m})
  })

  const FILTROS=[
    {id:'todos',lbl:'Todos',n:conversas.length},
    {id:'manual',lbl:'Humano',n:conversas.filter(c=>c.modo_ia==='manual').length},
    {id:'ia',lbl:'IA',n:conversas.filter(c=>c.modo_ia!=='manual').length},
    {id:'pendente',lbl:'Pendente',n:conversas.filter(c=>c.status_atendimento==='pendente').length},
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

      {/* Toast de reativação */}
      {toast&&(
        <div style={{ position:'fixed',bottom:24,right:24,zIndex:9999,
          display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderRadius:14,
          background:`linear-gradient(135deg,${T.amber}22,${T.bg3})`,
          border:`1px solid ${T.amberBor}`,boxShadow:'0 12px 36px rgba(0,0,0,.5)',
          animation:'cv-slideIn .3s cubic-bezier(.2,.8,.2,1)' }}>
          <MessageSquare size={14} style={{ color:T.amber,flexShrink:0 }}/>
          <div>
            <div style={{ fontSize:12,fontWeight:700,color:T.ink1,marginBottom:2 }}>Conversa reaberta</div>
            <div style={{ fontSize:11,color:T.amber }}><strong>{toast.nome}</strong> enviou nova mensagem</div>
          </div>
          <button onClick={()=>{ setSel(toast.tel); setToast(null) }}
            style={{ padding:'4px 10px',borderRadius:7,border:`1px solid ${T.amberBor}`,
              background:T.amberDim,color:T.amber,cursor:'pointer',fontSize:11,fontWeight:700 }}>
            Ver →
          </button>
          <button onClick={()=>setToast(null)}
            style={{ background:'none',border:'none',cursor:'pointer',color:T.ink4,display:'flex' }}>
            <X size={12}/>
          </button>
        </div>
      )}

      {/* ── LISTA ──────────────────────────────────────────────────────── */}
      <aside style={{ width:280,flexShrink:0,display:'flex',flexDirection:'column',
        background:`linear-gradient(180deg,${T.bg2},${T.bg1})`,borderRight:`1px solid ${T.sep}` }}>
        <div style={{ padding:'13px 13px 10px',borderBottom:`1px solid ${T.sep}` }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:9 }}>
            <div style={{ display:'flex',alignItems:'center',gap:6 }}>
              <MessageSquare size={13} style={{ color:T.purple }}/>
              <span style={{ fontSize:14.5,fontWeight:800,color:T.ink1,letterSpacing:'-.02em' }}>Conversas</span>
              {conversas.length>0&&<span style={{ fontSize:9.5,padding:'1px 6px',borderRadius:99,
                fontWeight:700,background:T.purpleDim,color:T.purple,border:`1px solid ${T.purpleBor}` }}>
                {conversas.length}
              </span>}
            </div>
            <button onClick={fetchConversas} style={{ width:26,height:26,borderRadius:7,
              border:`1px solid ${T.sep}`,background:'transparent',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',color:T.ink4 }}>
              <RefreshCw size={10}/>
            </button>
          </div>
          <div style={{ position:'relative',marginBottom:8 }}>
            <Search size={11} style={{ position:'absolute',left:9,top:'50%',
              transform:'translateY(-50%)',color:T.ink4,pointerEvents:'none' }}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..."
              style={{ width:'100%',padding:'7px 9px 7px 27px',borderRadius:8,background:T.bg1,
                border:`1px solid ${T.sep2}`,color:T.ink1,fontSize:12,outline:'none',
                fontFamily:'inherit',boxSizing:'border-box' }}/>
          </div>
          <div style={{ display:'flex',gap:3 }}>
            {FILTROS.map(f=>(
              <button key={f.id} onClick={()=>setFiltro(f.id)}
                style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',
                  padding:'4px 2px',borderRadius:7,border:'none',cursor:'pointer',
                  background:filtro===f.id?T.purpleDim:'transparent',
                  color:filtro===f.id?T.purple:T.ink4,transition:'all .12s' }}>
                <span style={{ fontSize:10,fontWeight:filtro===f.id?700:500 }}>{f.lbl}</span>
                {f.n>0&&<span style={{ fontSize:9,fontWeight:700 }}>{f.n}</span>}
              </button>
            ))}
          </div>
        </div>
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
          display:'flex',alignItems:'center',gap:5,fontSize:9.5,color:T.ink4 }}>
          <Dot cor={T.green} size={5}/> Atualiza a cada 20s
        </div>
      </aside>

      {/* ── THREAD ─────────────────────────────────────────────────────── */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',minWidth:0,
        borderRight:`1px solid ${T.sep}` }}>
        {!convAtiva?(
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',
            justifyContent:'center',height:'100%',gap:12,color:T.ink4 }}>
            <div style={{ width:60,height:60,borderRadius:18,background:T.purpleDim,
              border:`1px solid ${T.purpleBor}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <MessageSquare size={26} style={{ color:T.purple }}/>
            </div>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:14,fontWeight:700,color:T.ink2,margin:'0 0 5px' }}>Selecione uma conversa</p>
              <p style={{ fontSize:12,color:T.ink4,margin:0 }}>Escolha na lista à esquerda</p>
            </div>
          </div>
        ):(
          <>
            {/* Header */}
            <div style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 14px',
              borderBottom:`1px solid ${T.sep}`,flexShrink:0,
              background:`linear-gradient(90deg,${cor}06,${T.bg2})` }}>
              <div style={{ width:34,height:34,borderRadius:'50%',flexShrink:0,
                background:`linear-gradient(135deg,${cor}35,${cor}15)`,border:`2px solid ${cor}40`,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:11,fontWeight:800,color:cor }}>{ini}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <span style={{ fontSize:13.5,fontWeight:700,color:T.ink1,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                    {convAtiva.nome||convAtiva.telefone}
                  </span>
                  <span style={{ display:'inline-flex',alignItems:'center',gap:3,padding:'1px 6px',
                    borderRadius:99,fontSize:9,fontWeight:700,
                    background:isIA?T.purpleDim:T.blueDim,color:isIA?T.purple:T.blue,
                    border:`1px solid ${isIA?T.purpleBor:T.blueBor}` }}>
                    {isIA?<Bot size={8}/>:<User size={8}/>}{isIA?'IA':'Humano'}
                  </span>
                </div>
                <div style={{ fontSize:9.5,color:T.ink4,fontFamily:'monospace' }}>{convAtiva.telefone}</div>
              </div>
              <div style={{ display:'flex',gap:5,flexShrink:0 }}>
                {/* Toggle modo */}
                <button onClick={()=>toggleModo(!isIA)}
                  style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',
                    borderRadius:8,border:`1px solid ${isIA?T.purpleBor:T.blueBor}`,
                    background:isIA?T.purpleDim:T.blueDim,color:isIA?T.purple:T.blue,
                    cursor:'pointer',fontSize:11,fontWeight:700 }}>
                  {isIA?<><Bot size={11}/>IA</>:<><User size={11}/>Humano</>}
                </button>
                {/* Status */}
                <div style={{ position:'relative' }}>
                  <button onClick={()=>setStatusMenu(v=>!v)}
                    style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',
                      borderRadius:8,border:`1px solid ${sc.cor}40`,background:`${sc.cor}12`,
                      color:sc.cor,cursor:'pointer',fontSize:11,fontWeight:700 }}>
                    <sc.Icon size={11}/>{sc.lbl}<ChevronDown size={9}/>
                  </button>
                  {statusMenu&&(
                    <div style={{ position:'absolute',top:'calc(100% + 5px)',right:0,
                      background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
                      border:`1px solid ${T.sep2}`,borderRadius:12,overflow:'hidden',
                      boxShadow:'0 12px 36px rgba(0,0,0,.5)',zIndex:100,minWidth:150 }}
                      onMouseLeave={()=>setStatusMenu(false)}>
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
                {/* Reset */}
                {!resetConf?(
                  <button onClick={()=>setResetConf(true)} title="Resetar conversa"
                    style={{ width:32,height:32,borderRadius:8,border:`1px solid ${T.sep2}`,
                      background:'transparent',cursor:'pointer',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      color:T.ink4,transition:'all .13s' }}
                    onMouseEnter={e=>{ e.currentTarget.style.color=T.red; e.currentTarget.style.borderColor=T.redBor }}
                    onMouseLeave={e=>{ e.currentTarget.style.color=T.ink4; e.currentTarget.style.borderColor=T.sep2 }}>
                    <Trash2 size={13}/>
                  </button>
                ):(
                  <div style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 10px',
                    borderRadius:8,border:`1px solid ${T.redBor}`,background:T.redDim }}>
                    <span style={{ fontSize:10.5,color:T.red,fontWeight:600 }}>Apagar tudo?</span>
                    <button onClick={resetar} disabled={resetting}
                      style={{ padding:'2px 8px',borderRadius:6,border:'none',cursor:'pointer',
                        background:T.red,color:'#fff',fontSize:10,fontWeight:700 }}>
                      {resetting?'...':'Sim'}
                    </button>
                    <button onClick={()=>setResetConf(false)}
                      style={{ padding:'2px 8px',borderRadius:6,border:'none',cursor:'pointer',
                        background:T.gray,color:T.ink3,fontSize:10 }}>
                      Não
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Aviso gatilhos */}
            <div style={{ padding:'4px 14px',background:`${T.amber}09`,flexShrink:0,
              borderBottom:`1px solid ${T.amberBor}40`,
              display:'flex',alignItems:'center',gap:6 }}>
              <Zap size={9} style={{ color:T.amber,flexShrink:0 }}/>
              <span style={{ fontSize:9.5,color:T.amber }}>
                Mensagens com ⚡ são automações — visíveis só aqui
              </span>
            </div>

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

            <InputBar onEnviar={enviar} enviando={enviando} disabled={isIA}/>
          </>
        )}
      </div>

      {/* ── PAINEL DIREITO ─────────────────────────────────────────────── */}
      <div style={{ position:'relative',display:'flex' }}>
        <button onClick={()=>setShowPanel(v=>!v)}
          style={{ position:'absolute',left:-13,top:'50%',transform:'translateY(-50%)',
            width:24,height:24,borderRadius:'50%',zIndex:10,
            background:T.bg3,border:`1px solid ${T.sep2}`,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',color:T.ink4,
            boxShadow:'0 2px 8px rgba(0,0,0,.3)' }}>
          {showPanel?<ChevronRight size={10}/>:<ArrowLeft size={10}/>}
        </button>
        {showPanel&&(
          <div style={{ width:256,borderLeft:`1px solid ${T.sep}`,
            background:`linear-gradient(180deg,${T.bg2},${T.bg1})`,
            display:'flex',flexDirection:'column',overflow:'hidden' }}>
            <PainelDireito conv={convAtiva} api={api} pixKey={pixKey}
              carrinho={carrinho}
              onModoChange={ativarIA=>toggleModo(ativarIA)}/>
          </div>
        )}
      </div>
    </div>
  )
}
