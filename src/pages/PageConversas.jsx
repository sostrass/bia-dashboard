// PageConversas.jsx — Bia v6 · Enterprise Command Center
import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import {
  Send, Smile, Image, Video, Search, RefreshCw, User, Bot, Zap, X,
  MessageSquare, Package, ShoppingCart, Tag, Check, Truck,
  ChevronDown, ChevronUp, Star, FileText, Phone, Mail, MapPin,
  Sparkles, CheckCircle, CircleDot, XCircle, Clock, RotateCcw,
  AlertTriangle, Filter, Crown, AlertCircle, DollarSign, Bell,
  Hash, Layers, PenLine, Trash2, ChevronRight, Copy, Info,
  Timer, TrendingUp, ArrowUpRight, Eye, EyeOff, Plus,
} from 'lucide-react'

const BASE = import.meta.env?.VITE_API_URL || ''

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const REACOES = ['👍','❤️','😂','😮','😢','🙏']
const STATUS_CFG = {
  pendente:     {label:'Pendente',   Icon:CircleDot,   cor:'#f59e0b', bg:'rgba(245,158,11,.12)', bdr:'rgba(245,158,11,.3)'},
  em_andamento: {label:'Andamento',  Icon:RefreshCw,   cor:'#3b82f6', bg:'rgba(59,130,246,.12)', bdr:'rgba(59,130,246,.3)'},
  resolvido:    {label:'Resolvido',  Icon:CheckCircle, cor:'#10b981', bg:'rgba(16,185,129,.12)', bdr:'rgba(16,185,129,.3)'},
  aguardando:   {label:'Aguardando', Icon:Clock,       cor:'#8b5cf6', bg:'rgba(139,92,246,.12)', bdr:'rgba(139,92,246,.3)'},
  encerrado:    {label:'Encerrado',  Icon:XCircle,     cor:'#64748b', bg:'rgba(100,116,139,.12)',bdr:'rgba(100,116,139,.3)'},
}
const RFM_CFG = {
  vip:      {label:'VIP',      Icon:Crown,         cor:'#f59e0b'},
  fiel:     {label:'Fiel',     Icon:Star,          cor:'#22c55e'},
  novo:     {label:'Novo',     Icon:Zap,           cor:'#06b6d4'},
  em_risco: {label:'Em Risco', Icon:AlertTriangle, cor:'#f97316'},
  perdido:  {label:'Perdido',  Icon:Clock,         cor:'#6b7280'},
}
const RESPOSTAS_RAPIDAS = [
  {atalho:'/oi',       titulo:'Saudação',         texto:'Olá! Bem-vindo(a) à Só Strass. Como posso te ajudar hoje? 😊'},
  {atalho:'/nf',       titulo:'Nota Fiscal',       texto:'Para solicitar a nota fiscal, me informe o número do pedido ou seu CPF/CNPJ.'},
  {atalho:'/rastreio', titulo:'Rastreio',          texto:'Para consultar o rastreio, me informe o número do pedido ou seu CPF/CNPJ.'},
  {atalho:'/prazo',    titulo:'Prazo entrega',     texto:'O prazo de entrega varia conforme sua região e a modalidade de frete escolhida. Posso calcular para o seu CEP!'},
  {atalho:'/pix',      titulo:'Chave PIX',         texto:'Nossa chave PIX está disponível no momento do checkout. Finalize seu pedido e o código será gerado automaticamente.'},
  {atalho:'/horario',  titulo:'Horário',           texto:'Nosso atendimento é de segunda a sexta, das 8h às 18h, e aos sábados das 9h às 13h.'},
  {atalho:'/aguarda',  titulo:'Aguardar',          texto:'Só um momento, estou verificando as informações do seu pedido. 🙏'},
  {atalho:'/obrigada', titulo:'Agradecimento',     texto:'Muito obrigada pelo contato! Fico à disposição para qualquer dúvida. Tenha um ótimo dia! 😊'},
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtR   = n => `R$ ${Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`
const fmtTel = t => { const n=(t||'').replace(/\D/g,'').replace(/^55/,''); return n.length===11?`(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`:t||'' }
const fmtRel = ts => { if(!ts)return ''; const m=Math.floor((Date.now()-new Date(ts))/60000); if(m<1)return 'agora'; if(m<60)return `${m}min`; if(m<1440)return `${Math.floor(m/60)}h`; return `${Math.floor(m/1440)}d` }
const fmtHora= ts => ts?new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):''
const fmtDH  = ts => ts?new Date(ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):''
const fmtData= ts => ts?new Date(ts).toLocaleDateString('pt-BR'):''
const initials=s=>(s||'?').trim().split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
const slaColor=min=>min<5?'#22c55e':min<15?'#f59e0b':'#ef4444'
const slaLabel=min=>min<1?'<1min':`${Math.round(min)}min`

// ─── AVATAR ───────────────────────────────────────────────────────────────────
const AV_PAL=[['#1e3a5f','#60a5fa'],['#2d1b69','#a78bfa'],['#064e3b','#34d399'],['#78350f','#fbbf24'],['#500724','#f472b6'],['#134e4a','#2dd4bf']]
const avCol=s=>AV_PAL[(s||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%AV_PAL.length]
function Av({nome,foto,size=32,pulse}) {
  const [bg,fg]=avCol(nome)
  return <div style={{position:'relative',flexShrink:0}}>
    {foto
      ? <img src={foto} alt={nome||''} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
      : <div style={{width:size,height:size,borderRadius:'50%',background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.35,fontWeight:700,color:fg,flexShrink:0}}>
          {initials(nome)}
        </div>
    }
    {pulse&&<div style={{position:'absolute',bottom:0,right:0,width:10,height:10,borderRadius:'50%',
      background:'#22c55e',border:'2px solid var(--bg)',animation:'pulse 1.5s ease infinite'}}/>}
  </div>
}

// ─── SLA BADGE ────────────────────────────────────────────────────────────────
function SlaBadge({ultimaAtividade}) {
  const [min, setMin] = useState(0)
  useEffect(()=>{
    const calc=()=>setMin((Date.now()-new Date(ultimaAtividade||Date.now()).getTime())/60000)
    calc(); const t=setInterval(calc,10000); return()=>clearInterval(t)
  },[ultimaAtividade])
  const cor = slaColor(min)
  return <span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:99,
    color:cor,background:`${cor}18`,border:`1px solid ${cor}30`,
    animation:min>15?'pulse 1.5s ease infinite':'none',flexShrink:0}}>
    <Timer size={7} style={{display:'inline',marginRight:2}}/>{slaLabel(min)}
  </span>
}

// ─── CONV CARD ────────────────────────────────────────────────────────────────
const ConvCard = memo(function ConvCard({conv, sel, statusAtend, nomeIA, rfmMap, onClick}) {
  const S    = STATUS_CFG[statusAtend] || STATUS_CFG.pendente
  const SIc  = S.Icon
  const man  = conv.agente==='humano' || conv.modo_ia==='manual' || conv.modo_manual
  const cart = parseInt(conv.itens_carrinho||0)
  const rfm  = rfmMap?.[conv.telefone]
  const rfmC = rfm ? (RFM_CFG[rfm.score]||RFM_CFG.novo) : null
  const unread = parseInt(conv.msgs_nao_lidas||0)

  return <div onClick={onClick} style={{
    display:'flex',gap:10,padding:'10px 12px',cursor:'pointer',
    borderLeft:`2px solid ${sel?'var(--accent)':'transparent'}`,
    borderBottom:'1px solid var(--sep)',
    background:sel?'var(--accent-dim)':'transparent',
    transition:'background .1s',
  }}
    onMouseEnter={e=>!sel&&(e.currentTarget.style.background='var(--bg-3)')}
    onMouseLeave={e=>!sel&&(e.currentTarget.style.background='transparent')}
  >
    <Av nome={conv.nome||conv.telefone} foto={conv.foto_url||conv.fotoUrl} size={36} pulse={conv.ativo_agora}/>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:2}}>
        <span style={{fontSize:12.5,fontWeight:600,color:sel?'var(--accent)':'var(--label)',
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:130}}>
          {conv.nome||fmtTel(conv.telefone)}
        </span>
        <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
          {unread>0&&<span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:99,
            background:'var(--accent)',color:'#fff',minWidth:16,textAlign:'center'}}>{unread}</span>}
          <span style={{fontSize:9,color:'var(--label-4)'}}>{fmtRel(conv.ultima_atividade)}</span>
        </div>
      </div>
      <p style={{fontSize:10.5,color:'var(--label-3)',overflow:'hidden',textOverflow:'ellipsis',
        whiteSpace:'nowrap',marginBottom:5,maxWidth:180}}>
        {conv.ultima_mensagem||'—'}
      </p>
      <div style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>
        {/* Status */}
        <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,fontWeight:700,
          padding:'1px 6px',borderRadius:99,color:S.cor,background:S.bg,border:`1px solid ${S.bdr}`}}>
          <SIc size={7}/>{S.label}
        </span>
        {/* IA/Manual */}
        <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,fontWeight:700,
          padding:'1px 6px',borderRadius:99,
          color:man?'#3b82f6':'#a78bfa',
          background:man?'rgba(59,130,246,.1)':'rgba(167,139,250,.1)',
          border:`1px solid ${man?'rgba(59,130,246,.25)':'rgba(167,139,250,.25)'}`}}>
          {man?<User size={7}/>:<Bot size={7}/>}
          {man?'Atendente':nomeIA}
        </span>
        {/* Carrinho */}
        {cart>0&&<span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,fontWeight:700,
          padding:'1px 6px',borderRadius:99,color:'#f59e0b',
          background:'rgba(245,158,11,.12)',border:'1px solid rgba(245,158,11,.3)',
          animation:'pulse 2s ease infinite'}}>
          <ShoppingCart size={7}/>{cart} {cart===1?'item':'itens'}
        </span>}
        {/* RFM */}
        {rfmC&&<span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,fontWeight:700,
          padding:'1px 6px',borderRadius:99,color:rfmC.cor,background:`${rfmC.cor}18`,border:`1px solid ${rfmC.cor}30`}}>
          <rfmC.Icon size={7}/>{rfmC.label}
        </span>}
        {/* SLA */}
        <SlaBadge ultimaAtividade={conv.ultima_atividade}/>
      </div>
    </div>
  </div>
})

// ─── BOLHA ────────────────────────────────────────────────────────────────────
const Bolha = memo(function Bolha({msg, nomeIA}) {
  const [reacao, setReacao] = useState(null)
  const [picker, setPicker] = useState(false)
  const entrada   = msg.direcao==='entrada'
  const isGatilho = msg.modo==='transacional'
  const isManual  = msg.modo==='manual' || msg.modo==='humano'
  const isNota    = msg.modo==='nota'
  const texto     = (msg.conteudo||'').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g,'').trim()
  if (!texto) return null
  if (isGatilho) return (
    <div style={{display:'flex',justifyContent:'center',margin:'4px 0'}}>
      <div style={{display:'flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:99,
        background:'rgba(167,139,250,.08)',border:'1px solid rgba(167,139,250,.15)',
        fontSize:9,color:'rgba(167,139,250,.7)',maxWidth:'85%'}}>
        <Zap size={8} style={{flexShrink:0}}/><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{texto.slice(0,80)}</span>
      </div>
    </div>
  )
  if (isNota) return (
    <div style={{display:'flex',justifyContent:'center',margin:'4px 0'}}>
      <div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 12px',borderRadius:8,
        background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',
        fontSize:11,color:'#f59e0b',maxWidth:'85%',fontStyle:'italic'}}>
        <PenLine size={9} style={{flexShrink:0}}/>Nota: {texto}
      </div>
    </div>
  )
  const bgBolha = entrada
    ? 'var(--bg-3)'
    : isManual
      ? 'rgba(59,130,246,.1)'
      : 'rgba(167,139,250,.12)'
  const borderBolha = entrada
    ? '1px solid var(--sep)'
    : isManual
      ? '1px solid rgba(59,130,246,.2)'
      : '1px solid rgba(167,139,250,.2)'
  const labelTxt = entrada ? null : isManual ? 'Atendente' : nomeIA
  const labelCor = isManual ? '#3b82f6' : '#10b981'

  return <div style={{display:'flex',flexDirection:'column',marginBottom:8,alignItems:entrada?'flex-start':'flex-end'}}
    className="group">
    {labelTxt&&<span style={{fontSize:9,fontWeight:700,marginBottom:2,paddingLeft:4,
      color:labelCor,display:'flex',alignItems:'center',gap:4}}>
      {isManual?<User size={8}/>:<Bot size={8}/>}{labelTxt}
    </span>}
    <div style={{display:'flex',alignItems:'flex-end',gap:6,flexDirection:entrada?'row':'row-reverse'}}>
      {entrada&&<div style={{width:20,height:20,borderRadius:'50%',background:'var(--fill)',
        display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,
        color:'var(--label-4)',fontWeight:700,flexShrink:0}}>
        {initials(msg.nome||'')||'C'}
      </div>}
      <div style={{maxWidth:'74%',borderRadius:entrada?'4px 16px 16px 16px':'16px 4px 16px 16px',
        padding:'8px 12px',background:bgBolha,border:borderBolha,position:'relative'}}>
        {msg.midia_tipo==='image'&&msg.midia_url&&(
          <img src={msg.midia_url} alt="" style={{width:'100%',borderRadius:8,marginBottom:4,maxHeight:160,objectFit:'cover'}}
            onError={e=>e.target.style.display='none'}/>
        )}
        <p style={{fontSize:12.5,lineHeight:1.55,color:'var(--label)',whiteSpace:'pre-wrap',
          wordBreak:'break-words',margin:0}}>{texto}</p>
        <div style={{display:'flex',alignItems:'center',gap:4,marginTop:3,
          justifyContent:entrada?'flex-start':'flex-end'}}>
          <span style={{fontSize:9,color:'var(--label-4)'}}>{fmtHora(msg.criado_em)}</span>
          {!entrada&&<Check size={9} style={{color:'#3b82f6'}}/>}
        </div>
        {reacao&&<button onClick={()=>setReacao(null)} style={{
          position:'absolute',bottom:-10,right:8,fontSize:13,background:'var(--bg-2)',
          border:'1px solid var(--sep)',borderRadius:99,padding:'0 5px',
          lineHeight:'18px',cursor:'pointer'}}>{reacao}</button>}
      </div>
      {/* Emoji picker on hover */}
      <div style={{opacity:0,transition:'opacity .15s',flexShrink:0}} className="group-hover:opacity-100">
        <div style={{position:'relative'}}>
          <button onClick={()=>setPicker(v=>!v)} style={{
            width:20,height:20,borderRadius:'50%',border:'1px solid var(--sep)',
            background:'var(--bg-3)',display:'flex',alignItems:'center',
            justifyContent:'center',cursor:'pointer'}}>
            <Smile size={10} style={{color:'var(--label-4)'}}/>
          </button>
          {picker&&<div style={{
            position:'absolute',bottom:24,[entrada?'left':'right']:0,
            display:'flex',gap:4,background:'var(--bg-2)',border:'1px solid var(--sep)',
            borderRadius:99,padding:'6px 8px',boxShadow:'0 8px 24px rgba(0,0,0,.3)',
            zIndex:50,whiteSpace:'nowrap'}}>
            {REACOES.map(r=><button key={r} onClick={()=>{setReacao(r);setPicker(false)}}
              style={{fontSize:16,background:'none',border:'none',cursor:'pointer',
                transition:'transform .1s',padding:0}}
              onMouseEnter={e=>e.target.style.transform='scale(1.3)'}
              onMouseLeave={e=>e.target.style.transform='scale(1)'}>{r}</button>)}
          </div>}
        </div>
      </div>
    </div>
  </div>
})

// ─── DATE SEP ─────────────────────────────────────────────────────────────────
function DateSep({date}) {
  return <div style={{display:'flex',alignItems:'center',gap:10,margin:'12px 0',padding:'0 4px'}}>
    <div style={{flex:1,height:1,background:'var(--sep)'}}/>
    <span style={{fontSize:10,fontWeight:600,color:'var(--label-4)',padding:'2px 10px',
      borderRadius:99,background:'var(--fill)',border:'1px solid var(--sep)'}}>{date}</span>
    <div style={{flex:1,height:1,background:'var(--sep)'}}/>
  </div>
}

// ─── BARRA DE ENVIO ───────────────────────────────────────────────────────────
function BarraEnvio({telefone, api, modoManual, onEnviou, onAssumirModo, nomeIA}) {
  const [texto,    setTexto]   = useState('')
  const [enviando, setEnv]     = useState(false)
  const [anotacao, setAnot]    = useState(false)
  const [sugest,   setSugest]  = useState([])
  const [loadSug,  setLSug]    = useState(false)
  const [rrOpen,   setRROpen]  = useState(false)
  const [rrFiltro, setRRF]     = useState('')
  const [refining, setRef]     = useState(false)
  const [imgPrev,  setImgPrev] = useState(null)
  const [vidPrev,  setVidPrev] = useState(null)
  const [emojiOpen,setEmojiOpen]=useState(false)
  const inputRef = useRef(null)
  const imgRef   = useRef(null)
  const vidRef   = useRef(null)

  // Sugestões da IA
  useEffect(()=>{
    if (!telefone||!modoManual) return
    setLSug(true)
    fetch(`${api}/api/sugestoes/${telefone}`)
      .then(r=>r.ok?r.json():null).then(d=>setSugest((d?.sugestoes||d||[]).slice(0,3))).catch(()=>{})
      .finally(()=>setLSug(false))
  },[telefone,modoManual])

  const enviar = async(msg) => {
    const txt=(msg||texto).trim()
    if (!txt||enviando) return
    setTexto(''); setSugest([]); setAnot(false); setRROpen(false)
    setEnv(true)
    try {
      await fetch(`${api}/api/dashboard/mensagem`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({telefone,mensagem:txt,anotacao})
      })
      onEnviou?.()
    } catch {}
    setEnv(false); inputRef.current?.focus()
  }

  const enviarVideo = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async() => {
      const base64=reader.result.split(',')[1]
      try {
        await fetch(`${api}/api/dashboard/mensagem`,{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({telefone,tipo:'video',midia_base64:base64,midia_nome:file.name})
        })
        onEnviou?.()
      } catch {}
      setVidPrev(null)
    }
    reader.readAsDataURL(file)
  }

  const enviarImagem = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async() => {
      const base64=reader.result.split(',')[1]
      try {
        await fetch(`${api}/api/dashboard/mensagem`,{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({telefone,tipo:'image',midia_base64:base64,midia_nome:file.name})
        })
        onEnviou?.()
      } catch {}
      setImgPrev(null)
    }
    reader.readAsDataURL(file)
  }

  const refinarIA = async() => {
    if (!texto.trim()||refining) return
    setRef(true)
    try {
      const r=await fetch(`${api}/api/ia/melhorar-texto`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({texto,contexto:'Atendimento WhatsApp'})
      })
      if(r.ok){const d=await r.json();if(d.texto)setTexto(d.texto)}
    } catch {}
    setRef(false)
  }

  // Detecta "/" para respostas rápidas
  const onKeyDown = e => {
    if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar()}
    if (e.key==='Escape'){setRROpen(false);setImgPrev(null)}
  }
  const onChange = e => {
    const v=e.target.value
    setTexto(v)
    if (v.startsWith('/')) { setRROpen(true); setRRF(v.slice(1).toLowerCase()) }
    else setRROpen(false)
  }

  const rrFiltradas = RESPOSTAS_RAPIDAS.filter(r=>
    !rrFiltro||r.atalho.slice(1).includes(rrFiltro)||r.titulo.toLowerCase().includes(rrFiltro)
  )

  // Modo IA — read-only com sugestões
  if (!modoManual) return (
    <div style={{borderTop:'1px solid var(--sep)',background:'var(--bg-2)',flexShrink:0}}>
      {sugest.length>0&&(
        <div style={{padding:'8px 12px',display:'flex',gap:6,flexWrap:'wrap',borderBottom:'1px solid var(--sep)'}}>
          <span style={{fontSize:10,color:'var(--label-4)',alignSelf:'center',flexShrink:0}}>Sugestões IA:</span>
          {sugest.map((s,i)=><button key={i} onClick={()=>enviar(typeof s==='string'?s:s.mensagem||s.texto)}
            style={{fontSize:11,padding:'3px 10px',borderRadius:99,border:'1px solid rgba(167,139,250,.3)',
              background:'rgba(167,139,250,.08)',color:'#a78bfa',cursor:'pointer'}}>
            {(typeof s==='string'?s:s.mensagem||s.texto||'').slice(0,40)}
          </button>)}
        </div>
      )}
      <div style={{padding:'12px',display:'flex',alignItems:'center',gap:10}}>
        <Bot size={16} style={{color:'#a78bfa',flexShrink:0}}/>
        <span style={{fontSize:12,color:'var(--label-4)',flex:1}}>
          {nomeIA} está gerenciando este atendimento.
        </span>
        <button onClick={onAssumirModo} style={{
          display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,
          border:'1px solid rgba(59,130,246,.35)',background:'rgba(59,130,246,.08)',
          color:'#3b82f6',cursor:'pointer',fontSize:12,fontWeight:600}}>
          <User size={12}/>Assumir atendimento
        </button>
      </div>
    </div>
  )

  return (
    <div style={{borderTop:'1px solid var(--sep)',background:'var(--bg-2)',flexShrink:0}}>
      {/* Respostas rápidas */}
      {rrOpen&&rrFiltradas.length>0&&(
        <div style={{borderBottom:'1px solid var(--sep)',maxHeight:180,overflowY:'auto'}}>
          {rrFiltradas.map((r,i)=><button key={i} onClick={()=>{setTexto(r.texto);setRROpen(false);inputRef.current?.focus()}}
            style={{display:'flex',alignItems:'flex-start',gap:10,width:'100%',textAlign:'left',
              padding:'8px 14px',background:'none',border:'none',cursor:'pointer',
              borderBottom:'1px solid var(--sep)'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--fill)'}
            onMouseLeave={e=>e.currentTarget.style.background='none'}>
            <code style={{fontSize:10,color:'var(--accent)',background:'var(--fill)',
              padding:'1px 6px',borderRadius:4,flexShrink:0,marginTop:1}}>{r.atalho}</code>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:'var(--label)',marginBottom:2}}>{r.titulo}</div>
              <div style={{fontSize:11,color:'var(--label-4)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:340}}>{r.texto}</div>
            </div>
          </button>)}
        </div>
      )}
      {/* Sugestões IA */}
      {sugest.length>0&&(
        <div style={{padding:'6px 12px',display:'flex',gap:6,flexWrap:'wrap',borderBottom:'1px solid var(--sep)'}}>
          <span style={{fontSize:10,color:'var(--label-4)',alignSelf:'center',flexShrink:0,display:'flex',alignItems:'center',gap:4}}>
            <Bot size={10} style={{color:'#a78bfa'}}/>Sugestões:
          </span>
          {sugest.map((s,i)=>{const txt=typeof s==='string'?s:s.mensagem||s.texto||''; return(
            <button key={i} onClick={()=>setTexto(txt)}
              style={{fontSize:11,padding:'3px 10px',borderRadius:99,border:'1px solid rgba(167,139,250,.3)',
                background:'rgba(167,139,250,.08)',color:'#a78bfa',cursor:'pointer',maxWidth:200,
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {txt.slice(0,35)}{txt.length>35?'...':''}
            </button>
          )})}
        </div>
      )}
      {/* Preview vídeo */}
      {vidPrev&&(
        <div style={{padding:'8px 12px',display:'flex',alignItems:'center',gap:10,
          background:'var(--fill)',borderBottom:'1px solid var(--sep)'}}>
          <Video size={20} style={{color:'var(--label-4)',flexShrink:0}}/>
          <span style={{fontSize:11,color:'var(--label-3)',flex:1}}>{vidPrev.nome}</span>
          <button onClick={()=>setVidPrev(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)'}}><X size={14}/></button>
          <button onClick={()=>enviarVideo(vidPrev.file)} style={{
            padding:'5px 12px',borderRadius:8,border:'none',background:'var(--accent)',
            color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5}}>
            <Send size={12}/>Enviar
          </button>
        </div>
      )}
      {/* Preview imagem */}
      {imgPrev&&(
        <div style={{padding:'8px 12px',display:'flex',alignItems:'center',gap:10,
          background:'var(--fill)',borderBottom:'1px solid var(--sep)'}}>
          <img src={imgPrev.url} alt="" style={{height:48,borderRadius:6,objectFit:'cover'}}/>
          <span style={{fontSize:11,color:'var(--label-3)',flex:1}}>{imgPrev.nome}</span>
          <button onClick={()=>setImgPrev(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)'}}><X size={14}/></button>
          <button onClick={()=>enviarImagem(imgPrev.file)} style={{
            padding:'5px 12px',borderRadius:8,border:'none',background:'var(--accent)',
            color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5}}>
            <Send size={12}/>Enviar
          </button>
        </div>
      )}
      {/* Barra principal */}
      <div style={{padding:'10px 12px',display:'flex',flexDirection:'column',gap:8}}>
        {/* Toggle anotação */}
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <button onClick={()=>setAnot(v=>!v)} style={{
            display:'flex',alignItems:'center',gap:4,fontSize:10,padding:'2px 8px',borderRadius:99,
            border:`1px solid ${anotacao?'rgba(245,158,11,.4)':'var(--sep)'}`,
            background:anotacao?'rgba(245,158,11,.08)':'none',
            color:anotacao?'#f59e0b':'var(--label-4)',cursor:'pointer'}}>
            <PenLine size={9}/>Nota interna
          </button>
          <span style={{fontSize:10,color:'var(--label-4)'}}>· Ctrl+Enter envia · / para atalhos</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
          <textarea value={texto} onChange={onChange} onKeyDown={onKeyDown} ref={inputRef}
            placeholder={anotacao?'Anotação interna (não enviada ao cliente)...':'Digite a mensagem...'}
            rows={texto.split('\n').length>2?3:2}
            style={{flex:1,padding:'8px 12px',borderRadius:10,resize:'none',
              border:`1px solid ${anotacao?'rgba(245,158,11,.4)':'var(--sep)'}`,
              background:anotacao?'rgba(245,158,11,.04)':'var(--fill)',
              color:'var(--label)',fontSize:12.5,lineHeight:1.5,fontFamily:'inherit'}}/>
          <div style={{display:'flex',flexDirection:'column',gap:5,flexShrink:0}}>
            {/* Enviar */}
            <button onClick={()=>enviar()} disabled={enviando||!texto.trim()} style={{
              width:36,height:36,borderRadius:10,border:'none',
              background:texto.trim()?'var(--accent)':'var(--fill)',
              color:texto.trim()?'#fff':'var(--label-4)',cursor:texto.trim()?'pointer':'not-allowed',
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Send size={15}/>
            </button>
          </div>
        </div>
        {/* Ações extras */}
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {/* Emoji picker */}
          <div style={{position:'relative'}}>
            <button onClick={()=>setEmojiOpen(v=>!v)} title="Emoji" style={{
              padding:'4px 8px',borderRadius:7,border:'1px solid var(--sep)',
              background:emojiOpen?'var(--fill)':'none',color:emojiOpen?'var(--accent)':'var(--label-4)',
              cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11}}>
              <Smile size={12}/>
            </button>
            {emojiOpen&&(
              <div style={{position:'absolute',bottom:'100%',left:0,zIndex:100,
                background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:10,
                padding:'8px',display:'flex',flexWrap:'wrap',gap:4,width:200,
                boxShadow:'0 -4px 16px rgba(0,0,0,.3)'}}>
                {['😊','👍','🙏','❤️','✅','📦','💰','🚀','😅','🎉','😍','🔥','💬','⏳','👋','🎁','✨','💯'].map(e=>(
                  <button key={e} onClick={()=>{
                    setTexto(t=>t+e); setEmojiOpen(false); inputRef.current?.focus()
                  }} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,padding:2,borderRadius:5}}
                    onMouseEnter={ev=>ev.target.style.background='var(--fill)'}
                    onMouseLeave={ev=>ev.target.style.background='none'}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={()=>imgRef.current?.click()} title="Enviar imagem" style={{
            padding:'4px 8px',borderRadius:7,border:'1px solid var(--sep)',
            background:'none',color:'var(--label-4)',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11}}>
            <Image size={12}/>Imagem
          </button>
          <button onClick={()=>vidRef.current?.click()} title="Enviar vídeo" style={{
            padding:'4px 8px',borderRadius:7,border:'1px solid var(--sep)',
            background:'none',color:'var(--label-4)',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11}}>
            <Video size={12}/>Vídeo
          </button>
          <button onClick={refinarIA} disabled={!texto.trim()||refining} title="Refinar com IA" style={{
            padding:'4px 8px',borderRadius:7,border:'1px solid rgba(167,139,250,.3)',
            background:'rgba(167,139,250,.06)',color:'#a78bfa',cursor:'pointer',
            display:'flex',alignItems:'center',gap:4,fontSize:11,
            opacity:texto.trim()?1:0.4}}>
            <Sparkles size={12}/>{refining?'Refinando...':'Refinar IA'}
          </button>
          <button onClick={onAssumirModo} style={{
            marginLeft:'auto',padding:'4px 8px',borderRadius:7,
            border:'1px solid rgba(239,68,68,.3)',background:'rgba(239,68,68,.06)',
            color:'#ef4444',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11}}>
            <Bot size={12}/>Devolver para IA
          </button>
          <input ref={imgRef} type="file" accept="image/*" style={{display:'none'}}
            onChange={e=>{const f=e.target.files[0];if(f){setImgPrev({url:URL.createObjectURL(f),nome:f.name,file:f});e.target.value=''}}}/>
          <input ref={vidRef} type="file" accept="video/*" style={{display:'none'}}
            onChange={e=>{const f=e.target.files[0];if(f){setVidPrev({nome:f.name,file:f});e.target.value=''}}}/>
        </div>
      </div>
    </div>
  )
}

// ─── PAINEL LATERAL ────────────────────────────────────────────────────────────
function PainelLateral({conv, api, onClose, onAbrirPedido}) {
  const [aba,     setAba]    = useState('resumo')
  const [perfil,  setPerfil] = useState(null)
  const [pedidos, setPedidos]= useState([])
  const [loadPed, setLoadPed]= useState(false)
  const [ocors,   setOcors]  = useState([])
  const [novaOc,  setNovaOc] = useState('')
  const [savOc,   setSavOc]  = useState(false)
  const [avals,   setAvals]  = useState([])
  const [notas,   setNotas]  = useState([])
  const [novaNota,setNovaNota]=useState('')
  const [savNota, setSavNota]=useState(false)
  const [custo,   setCusto]  = useState(null)
  const [catQ,    setCatQ]   = useState('')
  const [catProds,setCatProds]=useState([])
  const [catLoad, setCatLoad]=useState(false)
  const [catEnv,  setCatEnv] = useState(null)

  const tel = conv?.telefone

  useEffect(()=>{
    if (!tel) return
    let m=true
    // Perfil + sessão
    fetch(`${api}/api/dashboard/historico/${tel}?limit=1`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(m&&d)setPerfil(p=>({...(p||{}),carrinho:d.carrinho||[],modo:d.modo||'ia'}))})
      .catch(()=>{})
    // Dados do Bling
    fetch(`${api}/api/contatos/${tel}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(m&&d)setPerfil(p=>({...(p||{}), ...Object.fromEntries(Object.entries(d).filter(([,v])=>v!=null))}))})
      .catch(()=>{})
    // Custo IA
    fetch(`${api}/api/ia-custo/${tel.replace(/\D/g,'')}`)
      .then(r=>r.ok?r.json():null).then(d=>{if(m)setCusto(d)}).catch(()=>{})
    // Pedidos
    setLoadPed(true)
    fetch(`${api}/api/contatos/${tel}/pedidos`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(m)setPedidos(d?.pedidos||d||[])})
      .catch(()=>{}).finally(()=>{if(m)setLoadPed(false)})
    // Ocorrências
    // Busca ocorrências tentando com e sem 55
    const telNum = tel.replace(/\D/g,'')
    const telSem55 = telNum.startsWith('55') ? telNum.slice(2) : telNum
    const telCom55 = telNum.startsWith('55') ? telNum : '55'+telNum
    Promise.allSettled([
      fetch(`${api}/api/ocorrencias?telefone=${telSem55}`).then(r=>r.ok?r.json():null),
      fetch(`${api}/api/ocorrencias?telefone=${telCom55}`).then(r=>r.ok?r.json():null),
    ]).then(results=>{
      if(!m) return
      const todos = results.flatMap(r=>r.value?.ocorrencias||[])
      // Deduplica por id
      const uniq = [...new Map(todos.map(o=>[o.id,o])).values()]
        .sort((a,b)=>new Date(b.criado_em)-new Date(a.criado_em))
      setOcors(uniq)
    }).catch(()=>{})
    // Avaliações
    fetch(`${api}/api/inteligencia/avaliacoes?telefone=${tel.replace(/\D/g,'')}`)
      .then(r=>r.ok?r.json():null).then(d=>{if(m)setAvals(d?.avaliacoes||[])}).catch(()=>{})
    // Notas internas
    fetch(`${api}/api/notas-internas/${tel.replace(/\D/g,'')}`)
      .then(r=>r.ok?r.json():null).then(d=>{if(m)setNotas(d?.notas||[])}).catch(()=>{})
    return()=>{m=false}
  },[tel, api])

  const criarOc = async() => {
    if (!novaOc.trim()) return
    setSavOc(true)
    await fetch(`${api}/api/ocorrencias`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({telefone:tel,tipo:'suporte',descricao:novaOc})
    }).catch(()=>{})
    setNovaOc(''); setSavOc(false)
    fetch(`${api}/api/ocorrencias?telefone=${tel.replace(/\D/g,'')}`)
      .then(r=>r.ok?r.json():null).then(d=>setOcors(d?.ocorrencias||[])).catch(()=>{})
  }

  const criarNota = async() => {
    if (!novaNota.trim()) return
    setSavNota(true)
    await fetch(`${api}/api/notas-internas/${tel.replace(/\D/g,'')}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({conteudo:novaNota})
    }).catch(()=>{})
    setNovaNota(''); setSavNota(false)
    fetch(`${api}/api/notas-internas/${tel.replace(/\D/g,'')}`)
      .then(r=>r.ok?r.json():null).then(d=>setNotas(d?.notas||[])).catch(()=>{})
  }

  const buscarCatalogo = async() => {
    if (!catQ.trim()) return
    setCatLoad(true); setCatProds([])
    fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(catQ)}`)
      .then(r=>r.ok?r.json():null).then(d=>setCatProds(d?.produtos||[])).catch(()=>{})
      .finally(()=>setCatLoad(false))
  }

  const enviarProduto = async(p) => {
    if (!tel) return
    setCatEnv(p.id||p.bling_id)
    const nome=p.nome||p.descricao||'Produto'
    const n=parseFloat(p.preco||p.precoVenda||0)
    const msg=`*${nome}*\n\nPIX: ${fmtR(n*.9)} _(10% off)_\nCartão: ${fmtR(n)}`
    await fetch(`${api}/api/dashboard/mensagem`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({telefone:tel,mensagem:msg})
    }).catch(()=>{})
    setTimeout(()=>setCatEnv(null),2000)
  }

  const ABAS = [
    {id:'resumo',     label:'Resumo',     Icon:Info},
    {id:'pedidos',    label:'Pedidos',    Icon:Package},
    {id:'catalogo',   label:'Catálogo',   Icon:Tag},
    {id:'ocorrencias',label:'Ocorrências',Icon:AlertCircle},
    {id:'avaliacoes', label:'Avaliações', Icon:Star},
    {id:'notas',      label:'Notas',      Icon:PenLine},
  ]
  const ocAbertos = ocors.filter(o=>o.status!=='resolvido').length
  const mediaAval = avals.length ? (avals.reduce((s,a)=>s+a.estrelas,0)/avals.length).toFixed(1) : null
  const cart = perfil?.carrinho||[]
  const ltvTotal = pedidos.reduce((s,p)=>s+parseFloat(p.total||0),0)

  return <div style={{width:300,flexShrink:0,display:'flex',flexDirection:'column',
    borderLeft:'1px solid var(--sep)',background:'var(--bg-2)',overflow:'hidden'}}>
    {/* Header painel */}
    <div style={{padding:'10px 14px',borderBottom:'1px solid var(--sep)',
      display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
      <span style={{fontSize:12,fontWeight:700,color:'var(--label)',display:'flex',alignItems:'center',gap:6}}>
        <Av nome={conv?.nome||conv?.telefone} foto={conv?.foto_url} size={22}/>
        <div style={{minWidth:0}}>
          <div style={{fontSize:11.5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{conv?.nome||fmtTel(conv?.telefone)}</div>
          <div style={{fontSize:9.5,color:'var(--label-4)'}}>{fmtTel(conv?.telefone)}</div>
        </div>
      </span>
      <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:2}}><X size={14}/></button>
    </div>

    {/* Abas */}
    <div style={{display:'flex',borderBottom:'1px solid var(--sep)',overflowX:'auto',flexShrink:0}}>
      {ABAS.map(t=>{const Ic=t.Icon;const active=aba===t.id; return(
        <button key={t.id} onClick={()=>setAba(t.id)} title={t.label} style={{
          display:'flex',alignItems:'center',gap:4,padding:'7px 10px',border:'none',
          background:'none',cursor:'pointer',fontSize:10,fontWeight:active?700:400,
          color:active?'var(--accent)':'var(--label-4)',whiteSpace:'nowrap',
          borderBottom:active?'2px solid var(--accent)':'2px solid transparent',
          position:'relative'}}>
          <Ic size={11}/>{t.label}
          {t.id==='ocorrencias'&&ocAbertos>0&&<span style={{position:'absolute',top:4,right:2,
            width:8,height:8,borderRadius:'50%',background:'#ef4444'}}/>}
          {t.id==='avaliacoes'&&mediaAval&&<span style={{fontSize:8,color:'#f59e0b',marginLeft:2}}>{mediaAval}</span>}
        </button>
      )})}
    </div>

    {/* Conteúdo */}
    <div style={{flex:1,overflowY:'auto',padding:'12px 14px'}}>

      {/* RESUMO */}
      {aba==='resumo'&&<div style={{display:'flex',flexDirection:'column',gap:10}}>
        {/* Dados do cliente */}
        {[
          ['Tel',   conv?.telefone ? fmtTel(conv.telefone) : null, Phone],
          ['Email', perfil?.email, Mail],
          ['CPF',   perfil?.cpf||perfil?.cpfCnpj, Hash],
          ['Cidade',perfil?.cidade, MapPin],
        ].filter(([,v])=>v).map(([k,v,Ic])=>(
          <div key={k} style={{display:'flex',alignItems:'center',gap:8,fontSize:11.5}}>
            <Ic size={11} style={{color:'var(--label-4)',flexShrink:0}}/>
            <span style={{color:'var(--label-4)',width:36,flexShrink:0}}>{k}:</span>
            <span style={{color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</span>
          </div>
        ))}
        {/* LTV */}
        {pedidos.length>0&&<div style={{background:'var(--fill)',borderRadius:10,padding:'10px',marginTop:4}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[
              ['Pedidos',      pedidos.length],
              ['LTV',          fmtR(ltvTotal)],
              ['Ticket médio', fmtR(ltvTotal/Math.max(pedidos.length,1))],
              ['Último pedido',pedidos[0]?.data?fmtData(pedidos[0].data):'—'],
            ].map(([k,v])=><div key={k} style={{textAlign:'center'}}>
              <div style={{fontSize:9,color:'var(--label-4)',marginBottom:2}}>{k}</div>
              <div style={{fontSize:13,fontWeight:700,color:'var(--label)'}}>{v}</div>
            </div>)}
          </div>
        </div>}
        {/* Carrinho ativo */}
        {cart.length>0&&<div style={{background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.25)',
          borderRadius:10,padding:'10px'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#f59e0b',marginBottom:8,
            display:'flex',alignItems:'center',gap:5}}>
            <ShoppingCart size={12}/>Carrinho ativo ({cart.length} {cart.length===1?'item':'itens'})
          </div>
          {cart.map((item,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',
            fontSize:11,color:'var(--label-3)',marginBottom:4}}>
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{item.nome}</span>
            <span style={{color:'var(--label)',fontWeight:600,flexShrink:0}}>{item.quantidade}x</span>
          </div>)}
          <div style={{borderTop:'1px solid rgba(245,158,11,.2)',paddingTop:6,marginTop:4,
            display:'flex',justifyContent:'space-between',fontSize:11.5,fontWeight:700}}>
            <span style={{color:'#f59e0b'}}>Total PIX:</span>
            <span style={{color:'#f59e0b'}}>{fmtR(cart.reduce((s,i)=>s+parseFloat(i.preco||0)*i.quantidade,0)*.9)}</span>
          </div>
        </div>}
        {/* Custo IA */}
        {custo&&(parseFloat(custo.custo_usd)>0)&&<div style={{
          background:'var(--fill)',borderRadius:10,padding:'8px 10px',
          display:'flex',alignItems:'center',gap:8,fontSize:11}}>
          <DollarSign size={12} style={{color:'var(--label-4)',flexShrink:0}}/>
          <div>
            <span style={{color:'var(--label-4)'}}>Custo IA (24h): </span>
            <span style={{color:'var(--label)',fontWeight:600}}>R$ {custo.custo_brl}</span>
            <span style={{color:'var(--label-4)',marginLeft:6}}>{custo.chamadas} chamadas</span>
          </div>
        </div>}
      </div>}

      {/* PEDIDOS */}
      {aba==='pedidos'&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
        {loadPed ? <div style={{textAlign:'center',padding:24,color:'var(--label-4)',fontSize:12}}>
          <RefreshCw size={14} style={{animation:'spin 1s linear infinite'}}/> Carregando...
        </div> : pedidos.length===0 ? <p style={{color:'var(--label-4)',fontSize:12,textAlign:'center',padding:20}}>
          Nenhum pedido encontrado.
        </p> : pedidos.map((p,i)=>{
          const sit=p.situacaoLabel||p.situacao_label||String(p.situacaoId||'')
          return <div key={i} onClick={()=>onAbrirPedido?.(p)} style={{
            background:'var(--bg)',border:'1px solid var(--sep)',borderRadius:10,padding:'10px 12px',
            cursor:onAbrirPedido?'pointer':'default'}}
            onMouseEnter={e=>onAbrirPedido&&(e.currentTarget.style.borderColor='var(--accent)')}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--sep)'}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:700,color:'var(--label)'}}>#{p.numero}</span>
              <span style={{fontSize:11,fontWeight:700,color:'var(--accent)'}}>{fmtR(p.total)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10.5}}>
              <span style={{color:'var(--label-4)'}}>{fmtData(p.data)}</span>
              <span style={{color:'var(--label-3)'}}>{sit}</span>
            </div>
          </div>
        })}
      </div>}

      {/* CATÁLOGO */}
      {aba==='catalogo'&&<div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'flex',gap:6}}>
          <input value={catQ} onChange={e=>setCatQ(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&buscarCatalogo()}
            placeholder="Buscar produto..." style={{flex:1,padding:'7px 10px',borderRadius:8,
              border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:12}}/>
          <button onClick={buscarCatalogo} disabled={catLoad} style={{
            padding:'7px 12px',borderRadius:8,border:'none',background:'var(--accent)',
            color:'#fff',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',gap:4}}>
            <Search size={12}/>{catLoad?'...':'Buscar'}
          </button>
        </div>
        {catProds.map((p,i)=>{
          const n=parseFloat(p.preco||p.precoVenda||0)
          const enviado=catEnv===(p.id||p.bling_id)
          return <div key={i} style={{background:'var(--bg)',border:'1px solid var(--sep)',
            borderRadius:10,padding:'9px 11px'}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--label)',marginBottom:3,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nome||p.descricao}</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <span style={{fontSize:11,color:'#22c55e',fontWeight:700}}>PIX {fmtR(n*.9)}</span>
                <span style={{fontSize:10,color:'var(--label-4)',marginLeft:6}}>Cartão {fmtR(n)}</span>
              </div>
              <button onClick={()=>enviarProduto(p)} style={{
                padding:'4px 10px',borderRadius:7,border:'none',fontSize:11,fontWeight:600,
                background:enviado?'rgba(34,197,94,.15)':'var(--accent)',
                color:enviado?'#22c55e':'#fff',cursor:'pointer',
                display:'flex',alignItems:'center',gap:4}}>
                {enviado?<Check size={11}/>:<Send size={11}/>}{enviado?'Enviado!':'Enviar'}
              </button>
            </div>
          </div>
        })}
      </div>}

      {/* OCORRÊNCIAS */}
      {aba==='ocorrencias'&&<div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'flex',gap:6}}>
          <input value={novaOc} onChange={e=>setNovaOc(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&criarOc()}
            placeholder="Descrever ocorrência..." style={{flex:1,padding:'7px 10px',borderRadius:8,
              border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:12}}/>
          <button onClick={criarOc} disabled={savOc||!novaOc.trim()} style={{
            padding:'7px 11px',borderRadius:8,border:'none',background:'var(--accent)',
            color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600}}>
            {savOc?'...':'Abrir'}
          </button>
        </div>
        {ocors.length===0
          ? <p style={{color:'var(--label-4)',fontSize:12,textAlign:'center',padding:16}}>Nenhuma ocorrência.</p>
          : ocors.map((oc,i)=><div key={i} style={{
              background:'var(--bg)',border:`1px solid ${oc.status==='resolvido'?'rgba(34,197,94,.2)':'var(--sep)'}`,
              borderRadius:10,padding:'9px 11px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:11,fontWeight:600,color:'var(--label)'}}>{oc.tipo||'Suporte'}</span>
                <span style={{fontSize:9,padding:'1px 6px',borderRadius:99,
                  color:oc.status==='resolvido'?'#22c55e':'#f59e0b',
                  background:oc.status==='resolvido'?'rgba(34,197,94,.1)':'rgba(245,158,11,.1)'}}>{oc.status||'aberto'}</span>
              </div>
              <p style={{fontSize:11.5,color:'var(--label-3)',margin:0,lineHeight:1.5}}>{oc.descricao}</p>
              <div style={{fontSize:9,color:'var(--label-4)',marginTop:4}}>{fmtDH(oc.criado_em)}</div>
            </div>)
        }
      </div>}

      {/* AVALIAÇÕES */}
      {aba==='avaliacoes'&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
        {avals.length>0&&<div style={{background:'var(--fill)',borderRadius:10,padding:'10px',
          textAlign:'center',marginBottom:4}}>
          <div style={{fontSize:28,fontWeight:700,color:'var(--label)'}}>{mediaAval}</div>
          <div style={{fontSize:16,margin:'4px 0'}}>{'⭐'.repeat(Math.round(parseFloat(mediaAval||0)))}</div>
          <div style={{fontSize:10,color:'var(--label-4)'}}>{avals.length} avaliação{avals.length!==1?'ões':''}</div>
        </div>}
        {avals.length===0
          ? <p style={{color:'var(--label-4)',fontSize:12,textAlign:'center',padding:16}}>Nenhuma avaliação.</p>
          : avals.map((av,i)=><div key={i} style={{
              background:'var(--bg)',border:'1px solid var(--sep)',borderRadius:10,padding:'9px 11px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:14}}>{'⭐'.repeat(av.estrelas)}</span>
                <span style={{fontSize:9,color:'var(--label-4)'}}>{fmtData(av.criado_em)}</span>
              </div>
              {av.comentario&&<p style={{fontSize:11.5,color:'var(--label-3)',margin:0,
                fontStyle:'italic',lineHeight:1.5}}>"{av.comentario}"</p>}
            </div>)
        }
      </div>}

      {/* NOTAS INTERNAS */}
      {aba==='notas'&&<div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          <textarea value={novaNota} onChange={e=>setNovaNota(e.target.value)}
            placeholder="Anotação interna (visível apenas para agentes)..."
            rows={3} style={{padding:'8px 10px',borderRadius:8,resize:'none',
              border:'1px solid rgba(245,158,11,.3)',background:'rgba(245,158,11,.04)',
              color:'var(--label)',fontSize:12,fontFamily:'inherit'}}/>
          <button onClick={criarNota} disabled={savNota||!novaNota.trim()} style={{
            padding:'6px',borderRadius:8,border:'none',background:'var(--accent)',
            color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,
            display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
            <Plus size={12}/>{savNota?'Salvando...':'Salvar nota'}
          </button>
        </div>
        {notas.length===0
          ? <p style={{color:'var(--label-4)',fontSize:12,textAlign:'center',padding:8}}>Nenhuma nota registrada.</p>
          : notas.map((n,i)=><div key={i} style={{
              background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.2)',
              borderRadius:10,padding:'9px 11px'}}>
              <p style={{fontSize:12,color:'var(--label)',margin:'0 0 5px',lineHeight:1.5}}>{n.conteudo}</p>
              <div style={{fontSize:9,color:'var(--label-4)',display:'flex',alignItems:'center',gap:5}}>
                <PenLine size={8}/>{n.agente||'atendente'} · {fmtDH(n.criado_em)}
              </div>
            </div>)
        }
      </div>}

    </div>
  </div>
}

// ─── CHAT AREA ────────────────────────────────────────────────────────────────
function ChatArea({conv, api, statusAtend, onStatusChange, modoManual, onToggleModo, nomeIA, onAbrirPainel}) {
  const [msgs,    setMsgs]   = useState([])
  const [loading, setLoad]   = useState(true)
  const [hasMore, setHasMore]= useState(false)
  const [offset,  setOffset] = useState(0)
  const [busca,   setBusca]  = useState('')
  const [searchOn,setSearchOn]=useState(false)
  const bottomRef = useRef(null)
  const fetching  = useRef(false)
  const polRef    = useRef(null)
  const atBottom  = useRef(true)
  const tel = conv?.telefone

  const carregar = useCallback(async(off=0, sil=false) => {
    if (!tel||fetching.current) return
    fetching.current=true
    if (!sil) setLoad(true)
    try {
      const r=await fetch(`${api}/api/dashboard/historico/${tel}?limit=60&offset=${off}`)
      if (r.ok) {
        const d=await r.json(); const novas=d.mensagens||[]
        if (off===0) setMsgs(novas); else setMsgs(p=>[...novas,...p])
        setHasMore(d.hasMore||false); setOffset(off)
      }
    } catch {}
    fetching.current=false
    if (!sil) setLoad(false)
  },[tel,api])

  useEffect(()=>{
    if (!tel) return
    setMsgs([]); setOffset(0); setLoad(true); atBottom.current=true
    carregar(0,false)
    clearInterval(polRef.current)
    polRef.current=setInterval(()=>carregar(0,true),6000)
    return()=>clearInterval(polRef.current)
  },[carregar])

  useEffect(()=>{
    if (atBottom.current) bottomRef.current?.scrollIntoView({behavior:'smooth'})
  },[msgs])

  // Detecta se está no fim
  const onScroll = e => {
    const el=e.currentTarget
    atBottom.current=(el.scrollHeight-el.scrollTop-el.clientHeight)<80
  }

  // Agrupa mensagens por data
  const msgsComData = useMemo(()=>{
    const result=[]; let lastDate=''
    const filtradas = busca ? msgs.filter(m=>(m.conteudo||'').toLowerCase().includes(busca.toLowerCase())) : msgs
    filtradas.forEach(m=>{
      const d=new Date(m.criado_em).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})
      if (d!==lastDate){result.push({type:'sep',date:d});lastDate=d}
      result.push({type:'msg',msg:m})
    })
    return result
  },[msgs,busca])

  const S = STATUS_CFG[statusAtend]||STATUS_CFG.pendente

  return <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
    {/* Header chat */}
    <div style={{padding:'10px 16px',borderBottom:'1px solid var(--sep)',flexShrink:0,
      display:'flex',alignItems:'center',gap:10}}>
      <Av nome={conv?.nome||tel} foto={conv?.foto_url} size={34}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13.5,fontWeight:700,color:'var(--label)',
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {conv?.nome||fmtTel(tel)}
        </div>
        <div style={{fontSize:10.5,color:'var(--label-4)'}}>{fmtTel(tel)}</div>
      </div>
      <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
        {/* Status dropdown */}
        <select value={statusAtend} onChange={e=>onStatusChange(tel,e.target.value)}
          style={{fontSize:11,padding:'4px 8px',borderRadius:8,
            border:`1px solid ${S.bdr}`,background:S.bg,color:S.cor,cursor:'pointer'}}>
          {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        {/* IA/Manual toggle */}
        <button onClick={()=>onToggleModo(tel)} style={{
          display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:8,
          border:`1px solid ${modoManual?'rgba(59,130,246,.3)':'rgba(167,139,250,.3)'}`,
          background:modoManual?'rgba(59,130,246,.08)':'rgba(167,139,250,.08)',
          color:modoManual?'#3b82f6':'#a78bfa',cursor:'pointer',fontSize:11,fontWeight:600}}>
          {modoManual?<User size={12}/>:<Bot size={12}/>}
          {modoManual?'Manual':'IA'}
        </button>
        {/* Busca */}
        <button onClick={()=>{setSearchOn(v=>!v);if(searchOn)setBusca('')}} style={{
          width:30,height:30,borderRadius:8,border:'1px solid var(--sep)',
          background:searchOn?'var(--fill)':'none',color:searchOn?'var(--accent)':'var(--label-4)',
          cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Search size={13}/>
        </button>
        {/* Painel info */}
        <button onClick={onAbrirPainel} style={{
          width:30,height:30,borderRadius:8,border:'1px solid var(--sep)',
          background:'none',color:'var(--label-4)',cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Info size={13}/>
        </button>
        {/* Resetar sessão */}
        <button onClick={async()=>{
          await fetch(`${api}/api/dashboard/resetar-sessao`,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({telefone:tel})
          }).catch(()=>{})
          carregar(0,false)
        }} title="Resetar sessão IA" style={{
          width:30,height:30,borderRadius:8,border:'1px solid var(--sep)',
          background:'none',color:'var(--label-4)',cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <RotateCcw size={13}/>
        </button>
      </div>
    </div>
    {/* Barra de busca no chat */}
    {searchOn&&<div style={{padding:'8px 16px',borderBottom:'1px solid var(--sep)',flexShrink:0}}>
      <div style={{position:'relative'}}>
        <Search size={12} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--label-4)'}}/>
        <input value={busca} onChange={e=>setBusca(e.target.value)} autoFocus
          placeholder="Buscar nesta conversa..." style={{width:'100%',padding:'6px 10px 6px 28px',
            borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',
            color:'var(--label)',fontSize:12,boxSizing:'border-box'}}/>
        {busca&&<span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
          fontSize:10,color:'var(--label-4)'}}>
          {msgs.filter(m=>(m.conteudo||'').toLowerCase().includes(busca.toLowerCase())).length} resultado{msgs.filter(m=>(m.conteudo||'').toLowerCase().includes(busca.toLowerCase())).length!==1?'s':''}
        </span>}
      </div>
    </div>}
    {/* Mensagens */}
    <div onScroll={onScroll} style={{flex:1,overflowY:'auto',padding:'12px 16px',display:'flex',flexDirection:'column'}}>
      {loading ? (
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
          color:'var(--label-4)',gap:10,fontSize:13}}>
          <RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/>Carregando...
        </div>
      ) : !tel ? (
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
          justifyContent:'center',color:'var(--label-4)',gap:12}}>
          <MessageSquare size={40} style={{opacity:.15}}/>
          <p style={{fontSize:14,margin:0}}>Selecione uma conversa</p>
        </div>
      ) : <>
        {hasMore&&<button onClick={()=>carregar(offset+60,false)} style={{
          display:'block',margin:'0 auto 12px',padding:'5px 14px',borderRadius:99,
          border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-3)',
          cursor:'pointer',fontSize:11}}>
          Carregar mensagens anteriores
        </button>}
        {msgsComData.map((item,i)=>
          item.type==='sep'
            ? <DateSep key={`sep-${i}`} date={item.date}/>
            : <Bolha key={item.msg.id||i} msg={item.msg} nomeIA={nomeIA}/>
        )}
        {msgs.length===0&&!loading&&<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
          color:'var(--label-4)',fontSize:13}}>Nenhuma mensagem nesta conversa.</div>}
        <div ref={bottomRef}/>
      </>}
    </div>
    {/* Barra de envio */}
    {tel&&<BarraEnvio
      telefone={tel} api={api} modoManual={modoManual}
      onEnviou={()=>carregar(0,true)}
      onAssumirModo={()=>onToggleModo(tel)}
      nomeIA={nomeIA}
    />}
  </div>
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function PageConversas({api: apiProp, onNavigate}) {
  const api = apiProp || BASE
  const [convs,    setConvs]  = useState([])
  const [selTel,   setSel]    = useState(null)
  const [statusMap,setStMap]  = useState({})
  const [modoMap,  setModoMap]= useState({})
  const [statusSel,setSSel]   = useState(()=>sessionStorage.getItem('bia_cs_status')||'pendente')
  const [busca,    setBusca]  = useState('')
  const [loading,  setLoad]   = useState(true)
  const [nomeIA,   setNomeIA] = useState('Bia')
  const [fila,     setFila]   = useState([])
  const [rfmMap,   setRfmMap] = useState({})
  const [painelOp, setPainel] = useState(true)
  const [buscaGlobal,setBG]   = useState('')
  const [bgResults, setBGR]   = useState([])
  const [bgLoad,    setBGL]   = useState(false)
  const [bgOpen,    setBGO]   = useState(false)
  const polRef = useRef(null)

  useEffect(()=>{ sessionStorage.setItem('bia_cs_status',statusSel) },[statusSel])

  // Carrega nome da IA
  useEffect(()=>{
    fetch(`${api}/api/ia/config`).then(r=>r.ok?r.json():null)
      .then(d=>{if(d?.config?.nomeIA)setNomeIA(d.config.nomeIA)}).catch(()=>{})
  },[api])

  // Carrega conversas + fila + RFM
  const carregar = useCallback(async(sil=false)=>{
    if (!sil) setLoad(true)
    try {
      const [rc, rf] = await Promise.allSettled([
        fetch(`${api}/api/dashboard/conversas?aba=todas`).then(r=>r.ok?r.json():null),
        fetch(`${api}/api/fila`).then(r=>r.ok?r.json():null),
      ])
      if (rc.status==='fulfilled'&&rc.value) {
        const novas=rc.value.conversas||[]
        setConvs(prev=>{
          const map=new Map(prev.map(c=>[c.telefone,c]))
          novas.forEach(c=>map.set(c.telefone,{...map.get(c.telefone)||{},...c}))
          return [...map.values()].sort((a,b)=>new Date(b.ultima_atividade)-new Date(a.ultima_atividade))
        })
      }
      if (rf.status==='fulfilled'&&rf.value) setFila(rf.value.fila||[])
    } catch {}
    if (!sil) setLoad(false)
  },[api])

  useEffect(()=>{
    carregar(false)
    polRef.current=setInterval(()=>carregar(true),8000)
    return()=>clearInterval(polRef.current)
  },[carregar])

  // RFM em segundo plano
  useEffect(()=>{
    fetch(`${api}/api/clientes-rfm`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        if (!d?.clientes) return
        const m={}; d.clientes.forEach(c=>{if(c.telefone)m[c.telefone]={score:c.rfm||c.score||'novo',ltv:c.ltv||0}})
        setRfmMap(m)
      }).catch(()=>{})
  },[api])

  // Busca global
  const buscarGlobal = useCallback(async(q)=>{
    if (!q||q.length<2) { setBGR([]); return }
    setBGL(true)
    fetch(`${api}/api/busca-conversas?q=${encodeURIComponent(q)}`)
      .then(r=>r.ok?r.json():null).then(d=>setBGR(d?.resultados||[])).catch(()=>{})
      .finally(()=>setBGL(false))
  },[api])

  useEffect(()=>{
    const t=setTimeout(()=>buscarGlobal(buscaGlobal),400)
    return()=>clearTimeout(t)
  },[buscaGlobal,buscarGlobal])

  const getStatus = tel => statusMap[tel] || convs.find(c=>c.telefone===tel)?.status_atendimento || 'pendente'
  const getModo   = tel => modoMap[tel]!==undefined ? modoMap[tel] : convs.find(c=>c.telefone===tel)?.modo_ia==='manual'

  const updateStatus = useCallback((tel,st)=>{
    setStMap(p=>({...p,[tel]:st}))
    fetch(`${api}/api/dashboard/status/${tel}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:st})}).catch(()=>{})
  },[api])

  const toggleModo = useCallback(tel=>{
    const novo=!getModo(tel)
    setModoMap(p=>({...p,[tel]:novo}))
    fetch(`${api}/api/dashboard/manual/${tel}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ativo:novo})}).catch(()=>{})
  },[api,modoMap])

  // Contadores
  const contadores = useMemo(()=>{
    const c={pendente:0,em_andamento:0,resolvido:0,aguardando:0,encerrado:0}
    convs.forEach(cv=>{const s=getStatus(cv.telefone);if(c[s]!==undefined)c[s]++})
    return c
  },[convs,statusMap])

  // Filtro + agrupamento por data
  const filtradas = useMemo(()=>convs.filter(c=>{
    if (getStatus(c.telefone)!==statusSel) return false
    if (!busca) return true
    const b=busca.toLowerCase()
    return (c.nome||'').toLowerCase().includes(b)||(c.telefone||'').includes(busca)||(c.ultima_mensagem||'').toLowerCase().includes(b)
  }),[convs,statusSel,busca,statusMap])

  const gruposPorData = useMemo(()=>{
    const hoje = new Date().toLocaleDateString('pt-BR')
    const ontem = new Date(Date.now()-86400000).toLocaleDateString('pt-BR')
    const grupos = {'Hoje':[],'Ontem':[],'Esta semana':[],'Mais antigas':[]}
    filtradas.forEach(c=>{
      const d=new Date(c.ultima_atividade||0)
      const ds=d.toLocaleDateString('pt-BR')
      const dias=(Date.now()-d.getTime())/86400000
      if (ds===hoje) grupos['Hoje'].push(c)
      else if (ds===ontem) grupos['Ontem'].push(c)
      else if (dias<=7) grupos['Esta semana'].push(c)
      else grupos['Mais antigas'].push(c)
    })
    return Object.entries(grupos).filter(([,v])=>v.length>0)
  },[filtradas])

  const convSel = convs.find(c=>c.telefone===selTel)||null
  const filaUrgente = fila.filter(f=>parseFloat(f.minutos_espera||0)>15)

  // Atalhos de teclado
  useEffect(()=>{
    const handler = e => {
      if (e.key==='Escape') setBGO(false)
      if ((e.ctrlKey||e.metaKey)&&e.key==='k') { e.preventDefault(); setBGO(v=>!v) }
    }
    window.addEventListener('keydown',handler)
    return()=>window.removeEventListener('keydown',handler)
  },[])

  return <div style={{display:'flex',height:'100%',overflow:'hidden',background:'var(--bg)'}}>

    {/* ── SIDEBAR CONVERSAS ── */}
    <div style={{width:280,flexShrink:0,display:'flex',flexDirection:'column',
      borderRight:'1px solid var(--sep)',background:'var(--bg-2)',overflow:'hidden'}}>

      {/* Header */}
      <div style={{padding:'12px 14px',borderBottom:'1px solid var(--sep)',flexShrink:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <span style={{fontSize:14,fontWeight:700,color:'var(--label)',display:'flex',alignItems:'center',gap:7}}>
            <MessageSquare size={15} style={{color:'var(--accent)'}}/>Conversas
          </span>
          <button onClick={()=>carregar(false)} style={{background:'none',border:'none',cursor:'pointer',
            color:'var(--label-4)',padding:4,display:'flex'}}>
            <RefreshCw size={13} style={loading?{animation:'spin 1s linear infinite'}:{}}/>
          </button>
        </div>
        {/* Busca */}
        <div style={{position:'relative',marginBottom:8}}>
          <Search size={12} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',
            color:'var(--label-4)',pointerEvents:'none'}}/>
          <input value={busca} onChange={e=>setBusca(e.target.value)}
            placeholder="Buscar conversa..." style={{width:'100%',padding:'6px 10px 6px 28px',
              borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',
              color:'var(--label)',fontSize:12,boxSizing:'border-box'}}/>
          {busca&&<button onClick={()=>setBusca('')} style={{position:'absolute',right:8,top:'50%',
            transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',
            color:'var(--label-4)',padding:0}}><X size={11}/></button>}
        </div>
        {/* Busca global Ctrl+K */}
        <button onClick={()=>setBGO(true)} style={{
          width:'100%',padding:'5px 10px',borderRadius:8,border:'1px solid var(--sep)',
          background:'var(--fill)',color:'var(--label-4)',cursor:'pointer',fontSize:11,
          display:'flex',alignItems:'center',gap:6,justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <Search size={11}/>Busca global em mensagens...
          </div>
          <kbd style={{fontSize:9,padding:'1px 5px',borderRadius:4,border:'1px solid var(--sep)',
            background:'var(--bg)',color:'var(--label-4)'}}>⌘K</kbd>
        </button>
      </div>

      {/* Alerta fila urgente */}
      {filaUrgente.length>0&&<div style={{
        margin:'8px 10px 0',padding:'7px 10px',borderRadius:8,
        background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.25)',
        display:'flex',alignItems:'center',gap:7,fontSize:11,color:'#ef4444',flexShrink:0}}>
        <Bell size={11} style={{animation:'pulse 1.5s ease infinite',flexShrink:0}}/>
        {filaUrgente.length} aguardando +15min
      </div>}

      {/* Tabs de status */}
      <div style={{display:'flex',borderBottom:'1px solid var(--sep)',flexShrink:0,overflowX:'auto'}}>
        {Object.entries(STATUS_CFG).map(([k,s])=>{
          const on=statusSel===k; const cnt=contadores[k]||0
          return <button key={k} onClick={()=>setSSel(k)} title={s.label} style={{
            display:'flex',alignItems:'center',justifyContent:'center',gap:4,
            padding:'7px 0',flex:1,minWidth:0,
            border:'none',background:'none',cursor:'pointer',
            borderBottom:on?`2px solid ${s.cor}`:'2px solid transparent',
            color:on?s.cor:'var(--label-4)',
            transition:'all .12s',
          }}>
            <s.Icon size={13}/>
            {cnt>0&&<span style={{fontSize:9,fontWeight:700,padding:'1px 4px',borderRadius:99,
              background:on?s.cor+'25':'var(--fill)',color:on?s.cor:'var(--label-4)',minWidth:14,textAlign:'center'}}>{cnt}</span>}
          </button>
        })}
      </div>

      {/* Lista com grupos de data */}
      <div style={{flex:1,overflowY:'auto'}}>
        {loading&&convs.length===0
          ? <div style={{padding:32,textAlign:'center',color:'var(--label-4)',fontSize:12}}>
              <RefreshCw size={16} style={{animation:'spin 1s linear infinite',marginBottom:8}}/><br/>Carregando...
            </div>
          : gruposPorData.length===0
          ? <div style={{padding:32,textAlign:'center',color:'var(--label-4)',fontSize:12}}>
              Nenhuma conversa em "{STATUS_CFG[statusSel]?.label}".
            </div>
          : gruposPorData.map(([grupo,convLista])=><div key={grupo}>
              <div style={{padding:'6px 14px 4px',fontSize:9.5,fontWeight:700,
                color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em',
                background:'var(--bg-2)',position:'sticky',top:0,zIndex:1,
                borderBottom:'1px solid var(--sep)',display:'flex',justifyContent:'space-between'}}>
                <span>{grupo}</span>
                <span>{convLista.length}</span>
              </div>
              {convLista.map(c=><ConvCard key={c.telefone}
                conv={c} sel={selTel===c.telefone}
                statusAtend={getStatus(c.telefone)}
                nomeIA={nomeIA} rfmMap={rfmMap}
                onClick={()=>setSel(c.telefone)}
              />)}
            </div>)
        }
      </div>
    </div>

    {/* ── ÁREA CHAT ── */}
    {convSel
      ? <ChatArea
          conv={convSel} api={api}
          statusAtend={getStatus(selTel)}
          onStatusChange={updateStatus}
          modoManual={getModo(selTel)}
          onToggleModo={toggleModo}
          nomeIA={nomeIA}
          onAbrirPainel={()=>setPainel(v=>!v)}
        />
      : <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
          justifyContent:'center',color:'var(--label-4)',gap:16}}>
          <MessageSquare size={56} style={{opacity:.1}}/>
          <div style={{textAlign:'center'}}>
            <p style={{fontSize:15,fontWeight:600,color:'var(--label)',margin:'0 0 6px'}}>Central de Atendimento</p>
            <p style={{fontSize:13,margin:0}}>Selecione uma conversa para começar</p>
          </div>
          <div style={{display:'flex',gap:20,marginTop:8}}>
            {Object.entries(contadores).filter(([,v])=>v>0).map(([k,v])=>{
              const s=STATUS_CFG[k]; return(
              <div key={k} style={{textAlign:'center'}}>
                <div style={{fontSize:24,fontWeight:700,color:s.cor}}>{v}</div>
                <div style={{fontSize:11,color:'var(--label-4)'}}>{s.label}</div>
              </div>
            )})}
          </div>
        </div>
    }

    {/* ── PAINEL LATERAL ── */}
    {convSel&&painelOp&&<PainelLateral
      conv={convSel} api={api}
      onClose={()=>setPainel(false)}
      onAbrirPedido={()=>{}}
    />}

    {/* ── BUSCA GLOBAL MODAL ── */}
    {bgOpen&&<div style={{position:'fixed',inset:0,zIndex:2000,
      background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)',
      display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:80}}
      onClick={e=>{if(e.target===e.currentTarget)setBGO(false)}}>
      <div style={{width:600,background:'var(--bg-2)',borderRadius:16,
        border:'1px solid var(--sep)',overflow:'hidden',boxShadow:'0 24px 64px rgba(0,0,0,.5)'}}>
        <div style={{padding:'14px 16px',borderBottom:'1px solid var(--sep)',display:'flex',alignItems:'center',gap:10}}>
          <Search size={16} style={{color:'var(--label-4)',flexShrink:0}}/>
          <input value={buscaGlobal} onChange={e=>setBG(e.target.value)} autoFocus
            placeholder="Buscar em todas as mensagens..." style={{
              flex:1,background:'none',border:'none',color:'var(--label)',fontSize:14,outline:'none'}}/>
          {bgLoad&&<RefreshCw size={14} style={{color:'var(--label-4)',animation:'spin 1s linear infinite',flexShrink:0}}/>}
          <button onClick={()=>setBGO(false)} style={{background:'none',border:'none',cursor:'pointer',
            color:'var(--label-4)',padding:2}}><X size={16}/></button>
        </div>
        <div style={{maxHeight:400,overflowY:'auto'}}>
          {bgResults.length===0&&buscaGlobal.length>=2&&!bgLoad&&(
            <p style={{padding:24,textAlign:'center',color:'var(--label-4)',fontSize:13,margin:0}}>
              Nenhuma mensagem encontrada para "{buscaGlobal}".
            </p>
          )}
          {bgResults.map((r,i)=><div key={i} onClick={()=>{setSel(r.telefone);setBGO(false)}}
            style={{padding:'12px 16px',borderBottom:'1px solid var(--sep)',cursor:'pointer'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--fill)'}
            onMouseLeave={e=>e.currentTarget.style.background='none'}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontSize:12.5,fontWeight:600,color:'var(--label)'}}>{r.nome||fmtTel(r.telefone)}</span>
              <span style={{fontSize:10,color:'var(--label-4)'}}>{fmtDH(r.criado_em)}</span>
            </div>
            <p style={{fontSize:12,color:'var(--label-3)',margin:0,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {r.direcao==='saida'?`${nomeIA}: `:'Cliente: '}{r.mensagem_match}
            </p>
          </div>)}
        </div>
        {buscaGlobal.length<2&&<p style={{padding:16,textAlign:'center',color:'var(--label-4)',fontSize:12,margin:0}}>
          Digite pelo menos 2 caracteres para buscar · <kbd style={{fontSize:10,padding:'1px 5px',borderRadius:4,
            border:'1px solid var(--sep)',background:'var(--bg)'}}>Esc</kbd> para fechar
        </p>}
      </div>
    </div>}

    <style>{`
      @keyframes spin  { to { transform: rotate(360deg) } }
      @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }
      .group-hover\\:opacity-100:hover > * { opacity: 1 !important; }
    `}</style>
  </div>
}
