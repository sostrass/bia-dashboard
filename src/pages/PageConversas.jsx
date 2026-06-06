/**
 * PageConversas v2 — NIVELMAX
 * · Gatilhos identificados no thread (apenas no dashboard)
 * · Media: imagem, vídeo, áudio, documento
 * · Painel direito com 3 abas: Contato · Catálogo · Pedidos
 * · Catálogo: busca + enviar ao cliente + Avise-me
 * · Pedidos: NF-e · PIX · MP Link · Cartão
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, MessageSquare, Bot, User, Send, MoreVertical,
  CheckCircle, Clock, ShoppingCart, RefreshCw, X, ChevronDown,
  Zap, Users, Hash, Check, ChevronRight, AlertTriangle,
  Package, Truck, ArrowRight, Inbox, ArrowLeft,
  Image, Mic, Video, FileText, Link, PlayCircle,
  Copy, Download, CreditCard, Banknote, ExternalLink,
  Bell, BellOff, Star, ShoppingBag, TrendingUp,
  Phone, Tag,
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
const PAL = [T.purple,T.green,T.amber,T.cyan,T.blue,'#f87171','#ff9f0a']
const avatarCor = s => PAL[(s||'?').charCodeAt(0) % PAL.length]
const initiais  = s => (s||'?').split(' ').map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase()

const tempoRel = iso => {
  if (!iso) return ''
  const m = Math.floor((Date.now()-new Date(iso))/60000)
  if (m<1) return 'agora'; if(m<60) return `${m}min`
  if (m<1440) return `${Math.floor(m/60)}h`
  const d=Math.floor(m/1440); if(d===1) return 'ontem'; if(d<7) return `${d}d`
  return new Date(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
}

const copyText = txt => navigator.clipboard?.writeText(txt).catch(()=>{})

const STATUS_CFG = {
  pendente:     { lbl:'Pendente',    cor:T.amber,  Icon:Clock        },
  em_andamento: { lbl:'Em andamento',cor:T.blue,   Icon:RefreshCw    },
  resolvido:    { lbl:'Resolvido',   cor:T.green,  Icon:CheckCircle  },
  encerrado:    { lbl:'Encerrado',   cor:T.ink4,   Icon:X            },
}

// Mapeamento humanizado de gatilhos
const GATILHO_LABEL = {
  pedido_criado:'Pedido criado', pagamento_aprovado:'Pagamento aprovado',
  pagamento_pendente:'Pagamento pendente', em_separacao:'Em separação',
  nfe_emitida:'NF-e emitida', pedido_enviado:'Pedido enviado',
  pedido_coletado:'Coletado', rastreio_em_transito:'Em trânsito',
  saiu_entrega:'Saiu para entrega', tentativa_entrega:'Tentativa de entrega',
  pedido_entregue:'Entregue', nao_entregue:'Não entregue',
  cancelamento:'Cancelado', avaliar_pedido:'Avaliação pós-venda',
  reengajamento:'Reengajamento IA', boas_vindas:'Boas-vindas',
  pix_pendente:'PIX pendente', estorno_realizado:'Estorno',
}

// ── Dot pulsante ──────────────────────────────────────────────────────────────
function Dot({ cor=T.green, size=8 }) {
  return (
    <span style={{ position:'relative',display:'inline-flex',width:size,height:size,flexShrink:0 }}>
      <span style={{ position:'absolute',inset:0,borderRadius:'50%',
        background:cor,opacity:.4,animation:'cv-ping 2s ease-out infinite' }}/>
      <span style={{ width:size,height:size,borderRadius:'50%',background:cor,
        display:'block',boxShadow:`0 0 ${size}px ${cor}` }}/>
    </span>
  )
}

// ── Toggle premium ────────────────────────────────────────────────────────────
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

// ── Detecção de tipo de mídia ─────────────────────────────────────────────────
function getMediaType(content='') {
  const c = content.toLowerCase()
  if (!content) return 'text'
  // Placeholders textuais
  if (c.includes('[imagem]')||c.includes('[image]')) return 'image_placeholder'
  if (c.includes('[áudio]')||c.includes('[audio]')) return 'audio_placeholder'
  if (c.includes('[vídeo]')||c.includes('[video]')) return 'video_placeholder'
  if (c.includes('[documento]')||c.includes('[document]')) return 'doc_placeholder'
  if (c.includes('[sticker]')) return 'sticker'
  // URLs reais
  if (/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(c)) return 'image'
  if (/\.(mp3|ogg|wav|m4a|opus)(\?.*)?$/i.test(c)) return 'audio'
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(c)) return 'video'
  if (/\.pdf(\?.*)?$/i.test(c)) return 'pdf'
  return 'text'
}

// ── Renderização de mídia ─────────────────────────────────────────────────────
function MediaContent({ content, tipo }) {
  const [imgErr, setImgErr] = useState(false)
  const s = { fontSize:12,color:T.ink3,display:'flex',alignItems:'center',gap:7,
    padding:'8px 10px',borderRadius:9,background:T.bg4,border:`1px solid ${T.sep}`,marginTop:4 }

  if ((tipo==='image'||tipo==='image_placeholder') && !imgErr) {
    return tipo==='image'
      ? <img src={content} alt="imagem" onError={()=>setImgErr(true)}
          style={{ maxWidth:240,maxHeight:200,borderRadius:9,display:'block',marginTop:4,
            border:`1px solid ${T.sep}`,cursor:'pointer' }}
          onClick={()=>window.open(content,'_blank')}/>
      : <div style={s}><Image size={14} style={{ color:T.cyan }}/> Imagem enviada pelo cliente</div>
  }
  if (tipo==='audio') return (
    <audio controls src={content}
      style={{ width:220,height:36,marginTop:6,filter:'invert(.8) hue-rotate(180deg)' }}/>
  )
  if (tipo==='audio_placeholder') return (
    <div style={s}><Mic size={14} style={{ color:T.green }}/> Áudio de voz</div>
  )
  if (tipo==='video') return (
    <video controls src={content}
      style={{ maxWidth:240,maxHeight:180,borderRadius:9,marginTop:4 }}/>
  )
  if (tipo==='video_placeholder') return (
    <div style={s}><Video size={14} style={{ color:T.purple }}/> Vídeo enviado</div>
  )
  if (tipo==='pdf') return (
    <a href={content} target="_blank" rel="noreferrer"
      style={{ ...s,color:T.blue,textDecoration:'none' }}>
      <FileText size={14}/>Abrir PDF
    </a>
  )
  if (tipo==='doc_placeholder') return (
    <div style={s}><FileText size={14} style={{ color:T.amber }}/> Documento</div>
  )
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// BOLHA DE MENSAGEM — com identificação de gatilho
// ─────────────────────────────────────────────────────────────────────────────
function MsgBubble({ msg }) {
  const isEntrada  = msg.direcao === 'entrada'
  const isManual   = msg.modo === 'manual'
  const isGatilho  = !!msg.gatilho || (msg.modo === 'auto' && msg.motor && !msg.motor.includes('gemini'))
  const isAI       = !isEntrada && !isManual && !isGatilho
  const tipoMidia  = getMediaType(msg.conteudo)
  const temTexto   = tipoMidia === 'text'

  const hora = msg.criado_em
    ? new Date(msg.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    : ''

  // ── Gatilho: banner separado, não uma bolha ──────────────────────────────
  if (isGatilho) {
    const gatilhoLabel = GATILHO_LABEL[msg.gatilho] || msg.template_nome || msg.gatilho || 'Automação'
    return (
      <div style={{ padding:'6px 16px',display:'flex',flexDirection:'column',
        alignItems:'center',gap:4,marginBottom:6 }}>
        {/* Linha com ícone — SOMENTE NO DASHBOARD */}
        <div style={{ display:'flex',alignItems:'center',gap:8,width:'100%' }}>
          <div style={{ flex:1,height:1,background:`linear-gradient(90deg,transparent,${T.amber}40)` }}/>
          <div style={{ display:'flex',alignItems:'center',gap:5,
            padding:'3px 10px',borderRadius:99,
            background:T.amberDim,border:`1px solid ${T.amberBor}` }}>
            <Zap size={9} style={{ color:T.amber }}/>
            <span style={{ fontSize:9.5,fontWeight:700,color:T.amber }}>
              GATILHO: {gatilhoLabel.toUpperCase()}
            </span>
            <span style={{ fontSize:9,color:T.ink4 }}>{hora}</span>
          </div>
          <div style={{ flex:1,height:1,background:`linear-gradient(270deg,transparent,${T.amber}40)` }}/>
        </div>
        {/* Conteúdo da mensagem */}
        <div style={{ maxWidth:'80%',padding:'9px 12px',borderRadius:11,
          background:`linear-gradient(135deg,${T.amberDim},${T.bg3})`,
          border:`1px solid ${T.amberBor}`,
          boxShadow:`0 2px 10px ${T.amber}10` }}>
          {temTexto
            ? <p style={{ margin:0,fontSize:12.5,lineHeight:1.6,color:T.ink2,
                whiteSpace:'pre-wrap',wordBreak:'break-word' }}>
                {msg.conteudo}
              </p>
            : <MediaContent content={msg.conteudo} tipo={tipoMidia}/>}
        </div>
      </div>
    )
  }

  // ── Bubble normal ────────────────────────────────────────────────────────
  const bubbleBg = isEntrada
    ? `linear-gradient(135deg,${T.bg3},${T.bg4})`
    : isAI
    ? `linear-gradient(135deg,${T.purple}30,${T.purple}15)`
    : `linear-gradient(135deg,${T.blue}30,${T.blue}15)`
  const bubbleBor = isEntrada
    ? `1px solid ${T.sep2}`
    : isAI ? `1px solid ${T.purple}30` : `1px solid ${T.blue}30`

  return (
    <div style={{ display:'flex',flexDirection:'column',
      alignItems:isEntrada?'flex-start':'flex-end',
      marginBottom:6,padding:'0 16px' }}>
      {!isEntrada && (
        <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:3,
          fontSize:9.5,fontWeight:700,color:isAI?T.purple:T.blue }}>
          {isAI?<Bot size={9}/>:<User size={9}/>}
          {isAI?(msg.motor||'IA'):'Atendente'}
        </div>
      )}
      <div style={{ maxWidth:'75%',padding:'10px 13px',
        borderRadius:isEntrada?'4px 14px 14px 14px':'14px 4px 14px 14px',
        background:bubbleBg,border:bubbleBor,
        boxShadow:isEntrada?'0 2px 8px rgba(0,0,0,.2)':`0 2px 12px ${isAI?T.purple:T.blue}15` }}>
        {temTexto
          ? <p style={{ margin:0,fontSize:13.5,lineHeight:1.65,
              color:T.ink1,whiteSpace:'pre-wrap',wordBreak:'break-word' }}>
              {msg.conteudo}
            </p>
          : <MediaContent content={msg.conteudo} tipo={tipoMidia}/>}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'flex-end',
          gap:4,marginTop:5 }}>
          <span style={{ fontSize:9.5,color:T.ink4 }}>{hora}</span>
          {!isEntrada&&<Check size={11} style={{ color:T.ink4 }}/>}
        </div>
      </div>
    </div>
  )
}

// ── Separador de data ─────────────────────────────────────────────────────────
function DateSep({ date }) {
  const d=new Date(date),n=new Date()
  const diff=Math.floor((n-d)/86400000)
  const label=diff===0?'Hoje':diff===1?'Ontem':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 16px',margin:'4px 0' }}>
      <div style={{ flex:1,height:1,background:T.sep }}/>
      <span style={{ fontSize:10,fontWeight:700,color:T.ink4,padding:'2px 10px',
        borderRadius:99,background:T.bg3,border:`1px solid ${T.sep}`,whiteSpace:'nowrap' }}>
        {label}
      </span>
      <div style={{ flex:1,height:1,background:T.sep }}/>
    </div>
  )
}

// ── Barra de input ────────────────────────────────────────────────────────────
const RAPIDAS = [
  'Olá! Como posso ajudar?',
  'Vou verificar isso agora para você.',
  'Seu pedido está confirmado! Em breve você receberá atualizações.',
  'O prazo de entrega é de 3 a 7 dias úteis.',
  'Pode me informar o número do seu pedido?',
]
function InputBar({ onEnviar, enviando, disabled }) {
  const [texto,setTexto]=useState('')
  const [showRP,setShowRP]=useState(false)
  const ref=useRef()
  const enviar=()=>{ if(!texto.trim()||enviando||disabled) return; onEnviar(texto.trim()); setTexto(''); ref.current?.focus() }
  return (
    <div style={{ padding:'12px 16px',borderTop:`1px solid ${T.sep}`,
      background:T.bg2,position:'relative' }}>
      {showRP&&(
        <div style={{ position:'absolute',bottom:'100%',left:16,right:16,marginBottom:6,
          background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:14,overflow:'hidden',
          boxShadow:'0 -12px 32px rgba(0,0,0,.5)',animation:'cv-fadeUp .15s ease' }}>
          <div style={{ padding:'7px 12px',borderBottom:`1px solid ${T.sep}`,
            fontSize:9.5,fontWeight:700,color:T.ink4,textTransform:'uppercase',letterSpacing:'.08em' }}>
            Respostas rápidas
          </div>
          {RAPIDAS.map((r,i)=>(
            <button key={i} onClick={()=>{ setTexto(r); setShowRP(false); ref.current?.focus() }}
              style={{ display:'block',width:'100%',padding:'10px 14px',textAlign:'left',
                border:'none',cursor:'pointer',background:'transparent',color:T.ink2,fontSize:12.5,
                borderBottom:i<RAPIDAS.length-1?`1px solid ${T.sep}`:'none',transition:'background .1s' }}
              onMouseEnter={e=>e.currentTarget.style.background=T.gray}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              {r}
            </button>
          ))}
        </div>
      )}
      <div style={{ display:'flex',alignItems:'flex-end',gap:8 }}>
        <button onClick={()=>setShowRP(v=>!v)} title="Respostas rápidas"
          style={{ width:36,height:36,borderRadius:10,border:`1px solid ${showRP?T.purpleBor:T.sep2}`,
            background:showRP?T.purpleDim:'transparent',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
            color:showRP?T.purple:T.ink4,flexShrink:0,transition:'all .15s' }}>
          <Zap size={14}/>
        </button>
        <textarea ref={ref} value={texto}
          onChange={e=>setTexto(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); enviar() } }}
          onInput={e=>{ e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
          disabled={disabled} rows={1}
          placeholder={disabled?'IA está respondendo automaticamente...':'Mensagem... (Enter para enviar)'}
          style={{ flex:1,padding:'10px 13px',borderRadius:11,resize:'none',background:T.bg1,
            border:`1px solid ${T.sep2}`,color:T.ink1,fontSize:13.5,lineHeight:1.5,
            outline:'none',fontFamily:'inherit',boxSizing:'border-box',maxHeight:120,
            overflowY:'auto',opacity:disabled?.5:1,transition:'border-color .18s' }}
          onFocus={e=>e.target.style.borderColor=`${T.purple}50`}
          onBlur={e=>e.target.style.borderColor=T.sep2}/>
        <button onClick={enviar} disabled={!texto.trim()||enviando||disabled}
          style={{ width:40,height:40,borderRadius:11,border:'none',cursor:'pointer',
            flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
            background:texto.trim()&&!disabled?`linear-gradient(135deg,${T.green},${T.green}cc)`:'rgba(255,255,255,.08)',
            color:texto.trim()&&!disabled?'#000':T.ink4,
            boxShadow:texto.trim()&&!disabled?`0 4px 16px ${T.green}35`:undefined,
            transition:'all .18s',opacity:(!texto.trim()||enviando||disabled)?.5:1 }}>
          {enviando?<RefreshCw size={15} style={{ animation:'cv-spin 1s linear infinite' }}/>:<Send size={15}/>}
        </button>
      </div>
      {disabled&&(
        <div style={{ marginTop:6,fontSize:10.5,color:T.ink4,textAlign:'center' }}>
          Modo IA ativo — Bia está respondendo
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAINEL DIREITO — 3 abas: Contato · Catálogo · Pedidos
// ─────────────────────────────────────────────────────────────────────────────

// ── Aba Contato ───────────────────────────────────────────────────────────────
function AbaContato({ conv, api, onModoChange }) {
  const cor  = avatarCor(conv.nome||conv.telefone)
  const inil = initiais(conv.nome||conv.telefone)
  const isIA = conv.modo_ia !== 'manual'
  const sc   = STATUS_CFG[conv.status_atendimento]||STATUS_CFG.pendente
  return (
    <div style={{ padding:'16px 14px 0' }}>
      {/* Avatar */}
      <div style={{ textAlign:'center',marginBottom:14 }}>
        <div style={{ width:56,height:56,borderRadius:'50%',margin:'0 auto 10px',
          background:`linear-gradient(135deg,${cor}35,${cor}15)`,border:`2px solid ${cor}50`,
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:18,fontWeight:800,color:cor }}>{inil}</div>
        <div style={{ fontSize:14,fontWeight:700,color:T.ink1 }}>{conv.nome||'Sem nome'}</div>
        <div style={{ fontFamily:'monospace',fontSize:11,color:T.ink4,marginTop:3 }}>{conv.telefone}</div>
      </div>

      {/* Toggle modo */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'9px 13px',borderRadius:10,marginBottom:12,
        background:isIA?T.purpleDim:T.blueDim,border:`1px solid ${isIA?T.purpleBor:T.blueBor}` }}>
        <div style={{ display:'flex',alignItems:'center',gap:7 }}>
          {isIA?<Bot size={13} style={{ color:T.purple }}/>:<User size={13} style={{ color:T.blue }}/>}
          <span style={{ fontSize:12,fontWeight:700,color:isIA?T.purple:T.blue }}>
            {isIA?'IA respondendo':'Atendimento humano'}
          </span>
        </div>
        <Toggle value={isIA} onChange={v=>onModoChange(v)} cor={isIA?T.purple:T.blue}/>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,marginBottom:12 }}>
        {[
          { l:'Mensagens', v:conv.total_msgs||0,        cor:T.purple },
          { l:'Do cliente',v:conv.msgs_entrada||0,      cor:T.cyan   },
          { l:'Carrinho',  v:conv.itens_carrinho||0,    cor:T.amber  },
          { l:'Status',    v:sc.lbl,                    cor:sc.cor   },
        ].map(s=>(
          <div key={s.l} style={{ padding:'9px 10px',borderRadius:10,
            background:T.bg4,border:`1px solid ${T.sep}`,textAlign:'center' }}>
            <div style={{ fontSize:17,fontWeight:800,color:s.cor,letterSpacing:'-.02em' }}>{s.v}</div>
            <div style={{ fontSize:9.5,color:T.ink4,marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Última atividade */}
      <div style={{ fontSize:10.5,color:T.ink4,textAlign:'center' }}>
        Última atividade: {tempoRel(conv.ultima_atividade)||'—'}
      </div>
    </div>
  )
}

// ── Aba Catálogo ──────────────────────────────────────────────────────────────
function AbaCatalogo({ tel, api }) {
  const [busca,    setBusca]    = useState('')
  const [produtos, setProdutos] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [avisei,   setAvisei]   = useState({}) // produto_id → true
  const [enviando, setEnviando] = useState(null)
  const [enviado,  setEnviado]  = useState(null)
  const to = useRef()

  useEffect(()=>{
    clearTimeout(to.current)
    setLoading(true)
    to.current=setTimeout(async()=>{
      try {
        const r=await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(busca)}&limit=20`)
        const d=await r.json()
        setProdutos(d.produtos||[])
      } catch {} finally { setLoading(false) }
    }, busca?350:0)
    return()=>clearTimeout(to.current)
  },[busca,api])

  const enviarProduto=async(p)=>{
    setEnviando(p.id)
    const preco=parseFloat(p.preco||p.precoVenda||0)
    const pix=(preco*0.9).toFixed(2)
    const msg=`🛍️ *${p.nome}*\n💰 PIX: R$ ${pix.replace('.',',')} (10% desc)\n💳 Cartão: R$ ${preco.toFixed(2).replace('.',',')} em até 12x\n📦 ${p.disponivel?`Disponível — ${p.estoque} un.`:'Fora de estoque'}\n🔑 Código: ${p.codigo||'—'}`
    await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ telefone:tel,mensagem:msg })}).catch(()=>{})
    setEnviado(p.id);setTimeout(()=>setEnviado(null),3000);setEnviando(null)
  }

  const avisarQuandoDisponivel=async(p)=>{
    await fetch(`${api}/api/dashboard/avise-me`,{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ telefone:tel,produto_id:p.id,nome_produto:p.nome,codigo:p.codigo })}).catch(()=>{})
    setAvisei(prev=>({...prev,[p.id]:true}))
  }

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%' }}>
      <div style={{ padding:'12px 14px',borderBottom:`1px solid ${T.sep}` }}>
        <div style={{ position:'relative' }}>
          <Search size={12} style={{ position:'absolute',left:10,top:'50%',
            transform:'translateY(-50%)',color:T.ink4,pointerEvents:'none' }}/>
          <input value={busca} onChange={e=>setBusca(e.target.value)}
            placeholder="Buscar produto..."
            style={{ width:'100%',padding:'8px 10px 8px 30px',borderRadius:9,background:T.bg1,
              border:`1px solid ${T.sep2}`,color:T.ink1,fontSize:12.5,outline:'none',
              fontFamily:'inherit',boxSizing:'border-box' }}/>
        </div>
      </div>

      <div style={{ flex:1,overflowY:'auto' }}>
        {loading&&<div style={{ textAlign:'center',padding:'24px 0',color:T.ink4 }}>
          <RefreshCw size={13} style={{ animation:'cv-spin 1s linear infinite' }}/>
        </div>}
        {!loading&&produtos.length===0&&(
          <div style={{ textAlign:'center',padding:'28px 14px',color:T.ink4 }}>
            <Package size={20} style={{ display:'block',margin:'0 auto 8px',opacity:.15 }}/>
            <p style={{ fontSize:11.5,margin:0 }}>{busca?'Nenhum produto':'Digite para buscar'}</p>
          </div>
        )}
        {produtos.map(p=>{
          const preco=parseFloat(p.preco||p.precoVenda||0)
          const pix=(preco*0.9).toFixed(2).replace('.',',')
          const disp=p.disponivel&&parseInt(p.estoque||0)>0
          const jaAvisou=avisei[p.id]
          return (
            <div key={p.id} style={{ padding:'10px 14px',borderBottom:`1px solid ${T.sep}`,
              display:'flex',gap:9,alignItems:'flex-start' }}>
              {/* Imagem / placeholder */}
              <div style={{ width:44,height:44,borderRadius:9,flexShrink:0,overflow:'hidden',
                background:T.bg3,border:`1px solid ${T.sep}`,
                display:'flex',alignItems:'center',justifyContent:'center' }}>
                {p.imagem
                  ?<img src={p.imagem} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                  :<ShoppingBag size={16} style={{ color:T.ink4 }}/>}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:12,fontWeight:600,color:T.ink1,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3 }}>
                  {p.nome}
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
                  <span style={{ fontSize:12,fontWeight:800,color:T.green }}>
                    PIX R${pix}
                  </span>
                  <span style={{ fontSize:9.5,padding:'1px 6px',borderRadius:99,fontWeight:700,
                    background:disp?T.greenDim:T.redDim,color:disp?T.green:T.red,
                    border:`1px solid ${disp?T.greenBor:T.redBor}` }}>
                    {disp?`${p.estoque} un.`:'Sem estoque'}
                  </span>
                </div>
                <div style={{ display:'flex',gap:5 }}>
                  {disp ? (
                    <button onClick={()=>enviarProduto(p)} disabled={!!enviando||enviado===p.id}
                      style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,
                        padding:'5px 8px',borderRadius:8,border:'none',cursor:'pointer',fontSize:10.5,fontWeight:700,
                        background:enviado===p.id?T.greenDim:`linear-gradient(135deg,${T.green},${T.green}cc)`,
                        color:enviado===p.id?T.green:'#000',
                        boxShadow:enviado===p.id?undefined:`0 3px 10px ${T.green}30`,
                        opacity:enviando&&enviando!==p.id?.5:1,transition:'all .15s' }}>
                      {enviando===p.id?<RefreshCw size={10} style={{ animation:'cv-spin 1s linear infinite' }}/>
                        :enviado===p.id?<><Check size={10}/>Enviado!</>
                        :<><Send size={10}/>Enviar</>}
                    </button>
                  ) : (
                    <button onClick={()=>!jaAvisou&&avisarQuandoDisponivel(p)}
                      style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,
                        padding:'5px 8px',borderRadius:8,border:`1px solid ${T.amberBor}`,cursor:'pointer',
                        fontSize:10.5,fontWeight:700,
                        background:jaAvisou?T.amberDim:'transparent',
                        color:T.amber,transition:'all .15s' }}>
                      {jaAvisou?<><Check size={10}/>Registrado!</>:<><Bell size={10}/>Avise-me</>}
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

// ── Aba Pedidos ───────────────────────────────────────────────────────────────
function AbaPedidos({ tel, api }) {
  const [pedidos,  setPedidos]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [pixKey,   setPixKey]   = useState('')
  const [pixCopied,setPixCopied]= useState(null)
  const [linkLoading,setLinkLoad]=useState(null)

  useEffect(()=>{
    Promise.all([
      fetch(`${api}/api/dashboard/contatos/${tel}/pedidos`).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(`${api}/api/dashboard/pix-key`).then(r=>r.ok?r.json():null).catch(()=>null),
    ]).then(([d,pk])=>{
      if(d) setPedidos(d.pedidos||[])
      if(pk) setPixKey(pk.chave||'')
      setLoading(false)
    })
  },[tel,api])

  const copiarPedido=(n)=>{ copyText(`#${n}`); }

  const abrirNFe=async(pedidoId)=>{
    try {
      const r=await fetch(`${api}/api/dashboard/nfe-link/${pedidoId}`)
      const d=await r.json()
      if(d.linkDanfe) window.open(d.linkDanfe,'_blank')
      else alert('NF-e não disponível para este pedido')
    } catch {}
  }

  const copiarPix=()=>{ copyText(pixKey); setPixCopied(true); setTimeout(()=>setPixCopied(null),2500) }

  const gerarLinkMP=async(p)=>{
    setLinkLoad(p.numero)
    try {
      const r=await fetch(`${api}/api/dashboard/mp-link-pagamento`,{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ telefone:tel,numero_pedido:p.numero,valor:parseFloat(p.total.replace(',','.'))||0,
          descricao:`Pedido #${p.numero} - Só Strass` })})
      const d=await r.json()
      if(d.init_point) {
        copyText(d.init_point)
        window.open(d.init_point,'_blank')
      }
    } catch {}
    setLinkLoad(null)
  }

  if(loading) return <div style={{ textAlign:'center',padding:'28px 0',color:T.ink4 }}>
    <RefreshCw size={13} style={{ animation:'cv-spin 1s linear infinite' }}/>
  </div>

  if(pedidos.length===0) return (
    <div style={{ textAlign:'center',padding:'28px 14px',color:T.ink4 }}>
      <Package size={20} style={{ display:'block',margin:'0 auto 8px',opacity:.15 }}/>
      <p style={{ fontSize:11.5,margin:0 }}>Nenhum pedido encontrado</p>
    </div>
  )

  return (
    <div style={{ overflowY:'auto' }}>
      {/* PIX global */}
      {pixKey&&(
        <div style={{ margin:'10px 14px',padding:'9px 12px',borderRadius:10,
          background:T.greenDim,border:`1px solid ${T.greenBor}`,
          display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:9.5,fontWeight:700,color:T.ink4,textTransform:'uppercase',letterSpacing:'.07em' }}>Chave PIX</div>
            <div style={{ fontSize:11.5,fontFamily:'monospace',color:T.green,marginTop:2 }}>
              {pixKey.slice(0,20)}{pixKey.length>20?'…':''}
            </div>
          </div>
          <button onClick={copiarPix}
            style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',
              borderRadius:8,border:'none',cursor:'pointer',fontSize:11,fontWeight:700,
              background:pixCopied?T.green:`linear-gradient(135deg,${T.green},${T.green}cc)`,
              color:'#000',boxShadow:`0 3px 10px ${T.green}30` }}>
            {pixCopied?<><Check size={11}/>Copiado!</>:<><Copy size={11}/>Copiar PIX</>}
          </button>
        </div>
      )}

      {pedidos.map((p,i)=>{
        const isPendente=['Em Aberto','Pendente','pendente','6'].includes(String(p.status||p.situacao||''))
        return (
          <div key={p.id||i} style={{ margin:'6px 14px 0',borderRadius:12,overflow:'hidden',
            background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
            border:`1px solid ${T.sep2}` }}>
            {/* Header do pedido */}
            <div style={{ padding:'10px 12px',display:'flex',
              alignItems:'center',justifyContent:'space-between',
              borderBottom:`1px solid ${T.sep}`,
              background:`linear-gradient(90deg,${T.green}08,transparent)` }}>
              <div>
                <span style={{ fontSize:13,fontWeight:700,color:T.green }}>#{p.numero}</span>
                <span style={{ fontSize:10.5,color:T.ink4,marginLeft:8 }}>{p.data}</span>
              </div>
              <span style={{ fontSize:12,fontWeight:700,color:T.ink1 }}>
                R$ {p.total}
              </span>
            </div>

            {/* Itens resumidos */}
            {p.itens&&(
              <div style={{ padding:'6px 12px',borderBottom:`1px solid ${T.sep}`,
                fontSize:10.5,color:T.ink4 }}>{p.itens}</div>
            )}

            {/* Botões de ação */}
            <div style={{ padding:'8px 12px',display:'flex',flexWrap:'wrap',gap:5 }}>
              {/* Copiar número */}
              <button onClick={()=>copiarPedido(p.numero)}
                style={{ display:'flex',alignItems:'center',gap:4,padding:'5px 9px',
                  borderRadius:7,border:`1px solid ${T.sep2}`,background:T.gray,
                  color:T.ink3,cursor:'pointer',fontSize:10.5,fontWeight:600,transition:'all .12s' }}
                onMouseEnter={e=>{ e.currentTarget.style.color=T.ink1; e.currentTarget.style.borderColor=T.sep2 }}
                onMouseLeave={e=>{ e.currentTarget.style.color=T.ink3; e.currentTarget.style.borderColor=T.sep2 }}>
                <Copy size={10}/> #cópia
              </button>

              {/* NF-e */}
              <button onClick={()=>abrirNFe(p.id)}
                style={{ display:'flex',alignItems:'center',gap:4,padding:'5px 9px',
                  borderRadius:7,border:`1px solid ${T.cyanBor}`,background:T.cyanDim,
                  color:T.cyan,cursor:'pointer',fontSize:10.5,fontWeight:600 }}>
                <FileText size={10}/> NF-e
              </button>

              {/* PIX (para pedidos pendentes) */}
              {isPendente&&pixKey&&(
                <button onClick={copiarPix}
                  style={{ display:'flex',alignItems:'center',gap:4,padding:'5px 9px',
                    borderRadius:7,border:`1px solid ${T.greenBor}`,background:T.greenDim,
                    color:T.green,cursor:'pointer',fontSize:10.5,fontWeight:600 }}>
                  <Copy size={10}/> PIX
                </button>
              )}

              {/* Link MP / cartão */}
              {isPendente&&(
                <button onClick={()=>gerarLinkMP(p)} disabled={linkLoading===p.numero}
                  style={{ display:'flex',alignItems:'center',gap:4,padding:'5px 9px',
                    borderRadius:7,border:`1px solid ${T.blueBor}`,background:T.blueDim,
                    color:T.blue,cursor:'pointer',fontSize:10.5,fontWeight:600,
                    opacity:linkLoading===p.numero?.6:1 }}>
                  {linkLoading===p.numero
                    ?<RefreshCw size={10} style={{ animation:'cv-spin 1s linear infinite' }}/>
                    :<><CreditCard size={10}/> Link MP</>}
                </button>
              )}

              {/* Rastreio (se tiver código) */}
              {p.rastreio&&p.rastreio!=='—'&&(
                <button onClick={()=>window.open(`https://rastreamento.correios.com.br/app/index.php?objetos=${p.rastreio}`,'_blank')}
                  style={{ display:'flex',alignItems:'center',gap:4,padding:'5px 9px',
                    borderRadius:7,border:`1px solid ${T.purpleBor}`,background:T.purpleDim,
                    color:T.purple,cursor:'pointer',fontSize:10.5,fontWeight:600 }}>
                  <Truck size={10}/> Rastrear
                </button>
              )}
            </div>
          </div>
        )
      })}
      <div style={{ height:16 }}/>
    </div>
  )
}

// ── Painel direito unificado ──────────────────────────────────────────────────
function PainelDireito({ conv, api, onModoChange }) {
  const [aba, setAba] = useState('contato')
  const TABS = [
    { id:'contato',  lbl:'Contato',  icon:User     },
    { id:'catalogo', lbl:'Catálogo', icon:ShoppingBag },
    { id:'pedidos',  lbl:'Pedidos',  icon:Package  },
  ]
  if (!conv) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',height:'100%',color:T.ink4 }}>
      <MessageSquare size={22} style={{ opacity:.12,display:'block',margin:'0 auto 8px' }}/>
      <p style={{ fontSize:12,margin:0 }}>Selecione uma conversa</p>
    </div>
  )
  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%' }}>
      {/* Tabs */}
      <div style={{ display:'flex',borderBottom:`1px solid ${T.sep}`,flexShrink:0 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setAba(t.id)}
            style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,
              padding:'9px 4px',border:'none',cursor:'pointer',
              background:'transparent',fontSize:11,fontWeight:aba===t.id?700:500,
              color:aba===t.id?T.green:T.ink4,
              borderBottom:`2px solid ${aba===t.id?T.green:'transparent'}`,
              transition:'all .15s' }}>
            <t.icon size={12}/>{t.lbl}
          </button>
        ))}
      </div>
      {/* Conteúdo da aba */}
      <div style={{ flex:1,overflow:'hidden',display:'flex',flexDirection:'column' }}>
        {aba==='contato' &&<AbaContato conv={conv} api={api} onModoChange={onModoChange}/>}
        {aba==='catalogo'&&<AbaCatalogo tel={conv.telefone} api={api}/>}
        {aba==='pedidos' &&<AbaPedidos  tel={conv.telefone} api={api}/>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM DA LISTA
// ─────────────────────────────────────────────────────────────────────────────
function ConversaItem({ c, ativo, onClick }) {
  const cor   = avatarCor(c.nome||c.telefone)
  const inil  = initiais(c.nome||c.telefone)
  const isIA  = c.modo_ia !== 'manual'
  const sc    = STATUS_CFG[c.status_atendimento]||STATUS_CFG.pendente
  const isAtivo = c.ultima_atividade&&(Date.now()-new Date(c.ultima_atividade))<5*60*1000
  return (
    <button onClick={onClick} style={{
      width:'100%',padding:'11px 14px',border:'none',cursor:'pointer',
      textAlign:'left',position:'relative',
      background:ativo?`linear-gradient(90deg,${cor}12,${T.bg3})`:'transparent',
      borderLeft:`3px solid ${ativo?cor:'transparent'}`,
      transition:'all .15s' }}
      onMouseEnter={e=>{ if(!ativo) e.currentTarget.style.background=T.gray }}
      onMouseLeave={e=>{ if(!ativo) e.currentTarget.style.background='transparent' }}>
      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
        <div style={{ position:'relative',flexShrink:0 }}>
          <div style={{ width:40,height:40,borderRadius:'50%',
            background:`linear-gradient(135deg,${cor}35,${cor}15)`,
            border:`2px solid ${cor}${ativo?'70':'35'}`,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:13,fontWeight:800,color:cor }}>{inil}</div>
          {isAtivo&&(
            <div style={{ position:'absolute',bottom:0,right:0 }}>
              <Dot cor={T.green} size={9}/>
            </div>
          )}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:3 }}>
            <span style={{ fontSize:13,fontWeight:ativo?700:600,color:T.ink1,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:130 }}>
              {c.nome||c.telefone}
            </span>
            <span style={{ fontSize:10,color:T.ink4,flexShrink:0 }}>{tempoRel(c.ultima_atividade)}</span>
          </div>
          <div style={{ fontSize:11.5,color:T.ink3,overflow:'hidden',textOverflow:'ellipsis',
            whiteSpace:'nowrap',marginBottom:4 }}>
            {c.ultima_mensagem||'Sem mensagens'}
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:4,flexWrap:'wrap' }}>
            <span style={{ display:'inline-flex',alignItems:'center',gap:3,padding:'1px 6px',
              borderRadius:99,fontSize:8.5,fontWeight:700,
              background:isIA?T.purpleDim:T.blueDim,color:isIA?T.purple:T.blue,
              border:`1px solid ${isIA?T.purpleBor:T.blueBor}` }}>
              {isIA?<Bot size={7}/>:<User size={7}/>}{isIA?'IA':'Humano'}
            </span>
            <span style={{ display:'inline-flex',alignItems:'center',gap:3,padding:'1px 6px',
              borderRadius:99,fontSize:8.5,fontWeight:700,
              background:`${sc.cor}12`,color:sc.cor,border:`1px solid ${sc.cor}28` }}>
              {sc.lbl}
            </span>
            {(c.itens_carrinho||0)>0&&(
              <span style={{ display:'inline-flex',alignItems:'center',gap:3,padding:'1px 6px',
                borderRadius:99,fontSize:8.5,fontWeight:700,
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
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function PageConversas({ api='', onNavigate }) {
  const [conversas,setConversas]=useState([])
  const [sel,      setSel]     =useState(null)
  const [mensagens,setMensagens]=useState([])
  const [loadConv, setLoadConv]=useState(true)
  const [loadMsg,  setLoadMsg] =useState(false)
  const [enviando, setEnviando]=useState(false)
  const [busca,    setBusca]   =useState('')
  const [filtro,   setFiltro]  =useState('todos')
  const [showPanel,setShowPanel]=useState(true)
  const [statusMenu,setStatusMenu]=useState(false)
  const [toast, setToast] = useState(null) // { tel, nome }
  const prevStatusRef = useRef({})         // { [tel]: status }

  // Carrega lista
  const fetchConversas=useCallback(async()=>{
    try {
      const r=await fetch(`${api}/api/dashboard/conversas`,{signal:AbortSignal.timeout(6000)})
      if(!r.ok) return
      const d=await r.json()
      const lista=d.conversas||[]

      // Detecta conversas que voltaram de resolvido/encerrado para pendente
      lista.forEach(c=>{
        const prev = prevStatusRef.current[c.telefone]
        const curr = c.status_atendimento
        if (prev && ['resolvido','encerrado'].includes(prev) && curr === 'pendente') {
          setToast({ tel:c.telefone, nome:c.nome||c.telefone })
          setTimeout(() => setToast(null), 5000)
        }
        prevStatusRef.current[c.telefone] = curr
      })

      prevCount.current=lista.length
      setConversas(lista)
    } catch {} finally { setLoadConv(false) }
  },[api])

  // Carrega mensagens da conversa ativa
  const fetchMensagens=useCallback(async(tel)=>{
    if(!tel) return
    setLoadMsg(true)
    try {
      const r=await fetch(`${api}/api/dashboard/historico/${tel}?limit=100`,{signal:AbortSignal.timeout(8000)})
      if(!r.ok) return
      const d=await r.json()
      setMensagens(d.mensagens||[])
      if(d.modo) setConversas(cs=>cs.map(c=>c.telefone===tel?{...c,modo_ia:d.modo}:c))
    } catch {} finally { setLoadMsg(false) }
  },[api])

  useEffect(()=>{
    fetchConversas()
    const iv=setInterval(fetchConversas,20000)
    return()=>clearInterval(iv)
  },[fetchConversas])

  useEffect(()=>{
    if(!sel) return
    fetchMensagens(sel)
    const iv=setInterval(()=>fetchMensagens(sel),8000)
    return()=>clearInterval(iv)
  },[sel,fetchMensagens])

  const enviarMensagem=async(texto)=>{
    if(!sel) return
    setEnviando(true)
    const msg={id:`tmp-${Date.now()}`,telefone:sel,conteudo:texto,
      direcao:'saida',modo:'manual',criado_em:new Date().toISOString()}
    setMensagens(p=>[...p,msg])
    await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({telefone:sel,mensagem:texto})}).catch(()=>{})
    setTimeout(()=>fetchMensagens(sel),1200)
    setEnviando(false)
  }

  const toggleModo=async(ativarIA)=>{
    if(!sel) return
    const modo=ativarIA?'ia':'manual'
    setConversas(cs=>cs.map(c=>c.telefone===sel?{...c,modo_ia:modo}:c))
    await fetch(`${api}/api/dashboard/manual/${sel}`,{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ativo:!ativarIA})}).catch(()=>{})
  }

  const mudarStatus=async(status)=>{
    if(!sel) return
    setConversas(cs=>cs.map(c=>c.telefone===sel?{...c,status_atendimento:status}:c))
    await fetch(`${api}/api/dashboard/status/${sel}`,{method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({status})}).catch(()=>{})
  }

  // Filtros
  const convFiltradas=conversas.filter(c=>{
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
  const inil=convAtiva?initiais(convAtiva.nome||convAtiva.telefone):'?'

  // Agrupa mensagens com separadores de data
  const grouped=[]
  let lastDate=null
  mensagens.forEach(m=>{
    const d=new Date(m.criado_em).toDateString()
    if(d!==lastDate){ grouped.push({type:'date',date:m.criado_em}); lastDate=d }
    grouped.push({type:'msg',msg:m})
  })

  const FILTROS=[
    { id:'todos',lbl:'Todos',n:conversas.length },
    { id:'manual',lbl:'Humano',n:conversas.filter(c=>c.modo_ia==='manual').length },
    { id:'ia',lbl:'IA',n:conversas.filter(c=>c.modo_ia!=='manual').length },
    { id:'pendente',lbl:'Pendente',n:conversas.filter(c=>c.status_atendimento==='pendente').length },
  ]

  const bottomRef=useRef()
  useEffect(()=>{ if(mensagens.length) bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[mensagens.length])

  return (
    <div style={{ display:'flex',height:'100%',background:T.bg0,overflow:'hidden',
      fontFamily:'system-ui,sans-serif' }}>
      <style>{`
        @keyframes cv-spin   { to{transform:rotate(360deg)} }
        @keyframes cv-ping   { 0%{transform:scale(1);opacity:.5} 75%,100%{transform:scale(2.2);opacity:0} }
        @keyframes cv-fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cv-slideIn{ from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      {/* Toast de reativação */}
      {toast && (
        <div style={{
          position:'fixed', bottom:24, right:24, zIndex:9999,
          display:'flex', alignItems:'center', gap:12,
          padding:'13px 18px', borderRadius:14,
          background:`linear-gradient(135deg,${T.amber}22,${T.bg3})`,
          border:`1px solid ${T.amberBor}`,
          boxShadow:`0 12px 36px rgba(0,0,0,.5), 0 0 0 1px ${T.amber}15 inset`,
          animation:'cv-slideIn .3s cubic-bezier(.2,.8,.2,1)',
        }}>
          <div style={{ width:34,height:34,borderRadius:10,flexShrink:0,
            background:T.amberDim,border:`1px solid ${T.amberBor}`,
            display:'flex',alignItems:'center',justifyContent:'center' }}>
            <MessageSquare size={15} style={{ color:T.amber }}/>
          </div>
          <div>
            <div style={{ fontSize:12.5,fontWeight:700,color:T.ink1,marginBottom:2 }}>
              Conversa reaberta
            </div>
            <div style={{ fontSize:11,color:T.amber }}>
              <strong>{toast.nome}</strong> enviou nova mensagem
            </div>
          </div>
          <button onClick={()=>{ setSel(toast.tel); setToast(null) }}
            style={{ padding:'5px 12px',borderRadius:8,border:`1px solid ${T.amberBor}`,
              background:T.amberDim,color:T.amber,cursor:'pointer',
              fontSize:11,fontWeight:700,flexShrink:0 }}>
            Ver →
          </button>
          <button onClick={()=>setToast(null)}
            style={{ background:'none',border:'none',cursor:'pointer',color:T.ink4,
              padding:2,display:'flex',flexShrink:0 }}>
            <X size={13}/>
          </button>
        </div>
      )}

      {/* ── LISTA ─────────────────────────────────────────────────────── */}
      <aside style={{ width:286,flexShrink:0,display:'flex',flexDirection:'column',
        background:`linear-gradient(180deg,${T.bg2},${T.bg1})`,borderRight:`1px solid ${T.sep}` }}>
        <div style={{ padding:'14px 14px 10px',borderBottom:`1px solid ${T.sep}` }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
            <div style={{ display:'flex',alignItems:'center',gap:7 }}>
              <MessageSquare size={14} style={{ color:T.purple }}/>
              <span style={{ fontSize:15,fontWeight:800,color:T.ink1,letterSpacing:'-.02em' }}>Conversas</span>
              {conversas.length>0&&<span style={{ fontSize:10,padding:'1px 7px',borderRadius:99,fontWeight:700,
                background:T.purpleDim,color:T.purple,border:`1px solid ${T.purpleBor}` }}>{conversas.length}</span>}
            </div>
            <button onClick={fetchConversas} style={{ width:28,height:28,borderRadius:8,
              border:`1px solid ${T.sep}`,background:'transparent',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',color:T.ink4 }}>
              <RefreshCw size={11}/>
            </button>
          </div>
          <div style={{ position:'relative',marginBottom:9 }}>
            <Search size={11} style={{ position:'absolute',left:10,top:'50%',
              transform:'translateY(-50%)',color:T.ink4,pointerEvents:'none' }}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..."
              style={{ width:'100%',padding:'7px 10px 7px 28px',borderRadius:9,background:T.bg1,
                border:`1px solid ${T.sep2}`,color:T.ink1,fontSize:12,outline:'none',
                fontFamily:'inherit',boxSizing:'border-box' }}/>
          </div>
          <div style={{ display:'flex',gap:3 }}>
            {FILTROS.map(f=>(
              <button key={f.id} onClick={()=>setFiltro(f.id)}
                style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',
                  padding:'4px 3px',borderRadius:8,border:'none',cursor:'pointer',
                  background:filtro===f.id?T.purpleDim:'transparent',
                  color:filtro===f.id?T.purple:T.ink4,transition:'all .13s' }}>
                <span style={{ fontSize:10.5,fontWeight:filtro===f.id?700:500 }}>{f.lbl}</span>
                {f.n>0&&<span style={{ fontSize:9,fontWeight:700,color:filtro===f.id?T.purple:T.ink4 }}>{f.n}</span>}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex:1,overflowY:'auto',scrollbarWidth:'none' }}>
          {loadConv?<div style={{ textAlign:'center',padding:'32px 0',color:T.ink4 }}>
            <RefreshCw size={13} style={{ animation:'cv-spin 1s linear infinite' }}/>
          </div>:convFiltradas.length===0?<div style={{ textAlign:'center',padding:'32px 14px',color:T.ink4 }}>
            <Inbox size={20} style={{ display:'block',margin:'0 auto 8px',opacity:.12 }}/>
            <p style={{ fontSize:12,margin:0 }}>{busca?'Nenhuma encontrada':'Sem conversas'}</p>
          </div>:convFiltradas.map(c=>(
            <ConversaItem key={c.telefone} c={c} ativo={sel===c.telefone}
              onClick={()=>{ setSel(c.telefone); setMensagens([]) }}/>
          ))}
        </div>
        <div style={{ padding:'7px 14px',borderTop:`1px solid ${T.sep}`,
          display:'flex',alignItems:'center',gap:5,fontSize:9.5,color:T.ink4 }}>
          <Dot cor={T.green} size={5}/> Atualiza a cada 20s
        </div>
      </aside>

      {/* ── THREAD ────────────────────────────────────────────────────── */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',minWidth:0,
        borderRight:`1px solid ${T.sep}` }}>
        {!convAtiva?(
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',
            justifyContent:'center',height:'100%',gap:14,color:T.ink4 }}>
            <div style={{ width:64,height:64,borderRadius:20,background:T.purpleDim,
              border:`1px solid ${T.purpleBor}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <MessageSquare size={28} style={{ color:T.purple }}/>
            </div>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:15,fontWeight:700,color:T.ink2,margin:'0 0 6px' }}>Selecione uma conversa</p>
              <p style={{ fontSize:12.5,color:T.ink4,margin:0 }}>Escolha um contato na lista à esquerda</p>
            </div>
          </div>
        ):(
          <>
            {/* Header do chat */}
            <div style={{ display:'flex',alignItems:'center',gap:11,padding:'10px 16px',
              borderBottom:`1px solid ${T.sep}`,flexShrink:0,
              background:`linear-gradient(90deg,${cor}07,${T.bg2})` }}>
              <div style={{ width:36,height:36,borderRadius:'50%',flexShrink:0,
                background:`linear-gradient(135deg,${cor}35,${cor}15)`,border:`2px solid ${cor}45`,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:12,fontWeight:800,color:cor }}>{inil}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                  <span style={{ fontSize:14,fontWeight:700,color:T.ink1,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                    {convAtiva.nome||convAtiva.telefone}
                  </span>
                  <span style={{ display:'inline-flex',alignItems:'center',gap:3,padding:'1px 7px',
                    borderRadius:99,fontSize:9,fontWeight:700,
                    background:isIA?T.purpleDim:T.blueDim,color:isIA?T.purple:T.blue,
                    border:`1px solid ${isIA?T.purpleBor:T.blueBor}` }}>
                    {isIA?<Bot size={8}/>:<User size={8}/>}{isIA?'IA':'Humano'}
                  </span>
                </div>
                <div style={{ fontSize:10,color:T.ink4,fontFamily:'monospace' }}>{convAtiva.telefone}</div>
              </div>
              <div style={{ display:'flex',gap:6,flexShrink:0 }}>
                {/* Toggle IA */}
                <button onClick={()=>toggleModo(!isIA)}
                  style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 12px',
                    borderRadius:9,border:`1px solid ${isIA?T.purpleBor:T.blueBor}`,
                    background:isIA?T.purpleDim:T.blueDim,
                    color:isIA?T.purple:T.blue,cursor:'pointer',fontSize:11,fontWeight:700 }}>
                  {isIA?<><Bot size={12}/>IA ativo</>:<><User size={12}/>Humano ativo</>}
                </button>
                {/* Status */}
                <div style={{ position:'relative' }}>
                  <button onClick={()=>setStatusMenu(v=>!v)}
                    style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',
                      borderRadius:9,border:`1px solid ${sc.cor}40`,background:`${sc.cor}12`,
                      color:sc.cor,cursor:'pointer',fontSize:11,fontWeight:700 }}>
                    <sc.Icon size={12}/>{sc.lbl}<ChevronDown size={10}/>
                  </button>
                  {statusMenu&&(
                    <div style={{ position:'absolute',top:'calc(100% + 6px)',right:0,
                      background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
                      border:`1px solid ${T.sep2}`,borderRadius:12,overflow:'hidden',
                      boxShadow:'0 12px 36px rgba(0,0,0,.5)',zIndex:100,minWidth:160 }}
                      onMouseLeave={()=>setStatusMenu(false)}>
                      {Object.entries(STATUS_CFG).map(([k,v])=>(
                        <button key={k} onClick={()=>{ mudarStatus(k); setStatusMenu(false) }}
                          style={{ display:'flex',alignItems:'center',gap:8,width:'100%',
                            padding:'10px 14px',border:'none',cursor:'pointer',
                            background:'transparent',color:v.cor,fontSize:12,fontWeight:600,
                            textAlign:'left' }}
                          onMouseEnter={e=>e.currentTarget.style.background=T.gray}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <v.Icon size={12}/>{v.lbl}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Aviso visual de gatilhos */}
            <div style={{ padding:'5px 14px',background:T.amberDim,
              borderBottom:`1px solid ${T.amberBor}`,flexShrink:0,
              display:'flex',alignItems:'center',gap:7 }}>
              <Zap size={10} style={{ color:T.amber,flexShrink:0 }}/>
              <span style={{ fontSize:10,color:T.amber,fontWeight:600 }}>
                Mensagens com ⚡ são automações de gatilhos — visíveis apenas aqui, não para o cliente
              </span>
            </div>

            {/* Mensagens */}
            <div style={{ flex:1,overflowY:'auto',padding:'12px 0',background:T.bg0 }}
              onClick={()=>statusMenu&&setStatusMenu(false)}>
              {loadMsg?<div style={{ textAlign:'center',padding:'32px 0',color:T.ink4 }}>
                <RefreshCw size={14} style={{ animation:'cv-spin 1s linear infinite' }}/>
              </div>:grouped.length===0?<div style={{ textAlign:'center',padding:'40px 14px',color:T.ink4 }}>
                <MessageSquare size={22} style={{ display:'block',margin:'0 auto 10px',opacity:.12 }}/>
                <p style={{ fontSize:13,margin:0 }}>Nenhuma mensagem ainda</p>
              </div>:grouped.map((item,i)=>(
                item.type==='date'
                  ?<DateSep key={`d${i}`} date={item.date}/>
                  :<MsgBubble key={item.msg.id||i} msg={item.msg}/>
              ))}
              <div ref={bottomRef}/>
            </div>

            <InputBar onEnviar={enviarMensagem} enviando={enviando} disabled={isIA}/>
          </>
        )}
      </div>

      {/* ── PAINEL DIREITO ────────────────────────────────────────────── */}
      <div style={{ position:'relative',display:'flex' }}>
        <button onClick={()=>setShowPanel(v=>!v)}
          style={{ position:'absolute',left:-14,top:'50%',transform:'translateY(-50%)',
            width:26,height:26,borderRadius:'50%',zIndex:10,
            background:T.bg3,border:`1px solid ${T.sep2}`,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
            color:T.ink4,boxShadow:'0 2px 8px rgba(0,0,0,.3)' }}>
          {showPanel?<ChevronRight size={11}/>:<ArrowLeft size={11}/>}
        </button>
        {showPanel&&(
          <div style={{ width:262,borderLeft:`1px solid ${T.sep}`,
            background:`linear-gradient(180deg,${T.bg2},${T.bg1})`,
            display:'flex',flexDirection:'column',overflow:'hidden' }}>
            <PainelDireito conv={convAtiva} api={api} onModoChange={ativarIA=>toggleModo(ativarIA)}/>
          </div>
        )}
      </div>
    </div>
  )
}
