// PageConversas.jsx — Bia v6 · Enterprise Command Center · PowerBI Style
import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import {
  Send, Smile, Image, Video, Search, RefreshCw, User, Bot, Zap, X,
  MessageSquare, Package, ShoppingCart, Tag, Check, Truck,
  ChevronDown, ChevronUp, Star, FileText, Phone, Mail, MapPin,
  Sparkles, CheckCircle, CircleDot, XCircle, Clock, RotateCcw,
  AlertTriangle, Filter, Crown, AlertCircle, DollarSign, Bell,
  Hash, Layers, PenLine, Trash2, ChevronRight, Copy, Info,
  Timer, TrendingUp, ArrowUpRight, Eye, Plus, ChevronLeft,
  Inbox, Settings, MoreHorizontal, Activity, Globe, Building,
  BellOff, Volume2, Paperclip, AtSign, Mic, StickyNote,
} from 'lucide-react'

const BASE = import.meta.env?.VITE_API_URL || ''

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const REACOES = ['👍','❤️','😂','😮','😢','🙏']
const STATUS_CFG = {
  pendente:     {label:'Pendente',   Icon:CircleDot,   cor:'#f59e0b', bg:'rgba(245,158,11,.15)', bdr:'rgba(245,158,11,.3)'},
  em_andamento: {label:'Andamento',  Icon:RefreshCw,   cor:'#3b82f6', bg:'rgba(59,130,246,.15)', bdr:'rgba(59,130,246,.3)'},
  resolvido:    {label:'Resolvido',  Icon:CheckCircle, cor:'#10b981', bg:'rgba(16,185,129,.15)', bdr:'rgba(16,185,129,.3)'},
  aguardando:   {label:'Aguardando', Icon:Clock,       cor:'#8b5cf6', bg:'rgba(139,92,246,.15)', bdr:'rgba(139,92,246,.3)'},
  encerrado:    {label:'Encerrado',  Icon:XCircle,     cor:'#64748b', bg:'rgba(100,116,139,.15)',bdr:'rgba(100,116,139,.3)'},
}
const RFM_CFG = {
  vip:      {label:'VIP',      Icon:Crown,         cor:'#f59e0b'},
  fiel:     {label:'Fiel',     Icon:Star,          cor:'#22c55e'},
  novo:     {label:'Novo',     Icon:Zap,           cor:'#06b6d4'},
  em_risco: {label:'Em Risco', Icon:AlertTriangle, cor:'#f97316'},
  perdido:  {label:'Perdido',  Icon:Clock,         cor:'#6b7280'},
}
const RESPOSTAS_RAPIDAS = [
  {atalho:'/oi',       titulo:'Saudação',      texto:'Olá! Bem-vindo(a) à Só Strass. Como posso te ajudar hoje? 😊'},
  {atalho:'/nf',       titulo:'Nota Fiscal',   texto:'Para solicitar a nota fiscal, me informe o número do pedido ou seu CPF/CNPJ.'},
  {atalho:'/rastreio', titulo:'Rastreio',      texto:'Para consultar o rastreio, me informe o número do pedido ou seu CPF/CNPJ.'},
  {atalho:'/prazo',    titulo:'Prazo entrega', texto:'O prazo varia conforme sua região e modalidade de frete. Posso calcular para o seu CEP!'},
  {atalho:'/pix',      titulo:'Chave PIX',     texto:'Nossa chave PIX está disponível no checkout. Finalize o pedido e o código será gerado.'},
  {atalho:'/horario',  titulo:'Horário',       texto:'Atendimento: seg-sex 8h–18h, sáb 9h–13h.'},
  {atalho:'/aguarda',  titulo:'Aguardar',      texto:'Só um momento, estou verificando as informações do seu pedido. 🙏'},
  {atalho:'/obrigada', titulo:'Agradecimento', texto:'Muito obrigada pelo contato! Fico à disposição. Tenha um ótimo dia! 😊'},
]
const CANAL_CFG = {
  shopee:       {label:'Shopee',       cor:'#f97316', Icon:Globe},
  mercadolivre: {label:'Mercado Livre',cor:'#eab308', Icon:Globe},
  shein:        {label:'Shein',        cor:'#ec4899', Icon:Globe},
  tiktokshop:   {label:'TikTok',       cor:'#06b6d4', Icon:Globe},
  nuvemshop:    {label:'Nuvemshop',    cor:'#a78bfa', Icon:Globe},
  loja:         {label:'Loja',         cor:'#22c55e', Icon:Building},
  bling:        {label:'Bling',        cor:'#60a5fa', Icon:Hash},
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtR   = n => `R$ ${Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`
const fmtTel = t => { const n=(t||'').replace(/\D/g,'').replace(/^55/,''); return n.length===11?`(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`:t||'' }
const fmtRel = ts => { if(!ts)return ''; const m=Math.floor((Date.now()-new Date(ts))/60000); if(m<1)return 'agora'; if(m<60)return `${m}min`; if(m<1440)return `${Math.floor(m/60)}h`; return `${Math.floor(m/1440)}d` }
const fmtHora= ts => ts?new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):''
const fmtDH  = ts => ts?new Date(ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):''
const fmtData= ts => ts?new Date(ts).toLocaleDateString('pt-BR'):''
const initials=s=>(s||'?').trim().split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
const slaMin = ts => ts ? (Date.now()-new Date(ts).getTime())/60000 : 0
const slaColor=min=>min<5?'#22c55e':min<15?'#f59e0b':'#ef4444'

// ─── AVATAR ───────────────────────────────────────────────────────────────────
const AV_PAL=[['#1e3a5f','#60a5fa'],['#2d1b69','#a78bfa'],['#064e3b','#34d399'],['#78350f','#fbbf24'],['#500724','#f472b6'],['#134e4a','#2dd4bf']]
const avCol=s=>AV_PAL[(s||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%AV_PAL.length]
function Av({nome,foto,size=34,pulse,status}) {
  const [bg,fg]=avCol(nome)
  const sc = STATUS_CFG[status]
  return <div style={{position:'relative',flexShrink:0}}>
    {foto
      ? <img src={foto} alt={nome||''} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
      : <div style={{width:size,height:size,borderRadius:'50%',background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.34,fontWeight:700,color:fg,letterSpacing:'-0.5px'}}>
          {initials(nome)}
        </div>
    }
    {sc && <div style={{position:'absolute',bottom:-1,right:-1,width:Math.max(9,size*.28),height:Math.max(9,size*.28),borderRadius:'50%',
      background:sc.cor,border:`2px solid var(--bg-2)`,animation:pulse?'pulse 1.5s ease infinite':'none'}}/>}
  </div>
}

// ─── SLA BADGE ────────────────────────────────────────────────────────────────
function SlaBadge({ts,compact}) {
  const [min,setMin]=useState(0)
  useEffect(()=>{const calc=()=>setMin(slaMin(ts));calc();const t=setInterval(calc,10000);return()=>clearInterval(t)},[ts])
  const cor=slaColor(min)
  if (compact) return <div style={{width:6,height:6,borderRadius:'50%',background:cor,flexShrink:0,animation:min>15?'pulse 1.5s ease infinite':'none'}}/>
  return <span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:99,
    color:cor,background:`${cor}15`,border:`1px solid ${cor}25`,
    display:'inline-flex',alignItems:'center',gap:3,flexShrink:0,
    animation:min>15?'pulse 1.5s ease infinite':'none'}}>
    <Timer size={7}/>{min<1?'<1m':`${Math.round(min)}m`}
  </span>
}

// ─── CONV CARD ────────────────────────────────────────────────────────────────
const ConvCard = memo(function ConvCard({conv,sel,statusAtend,nomeIA,rfmMap,onClick}) {
  const S    = STATUS_CFG[statusAtend]||STATUS_CFG.pendente
  const man  = conv.modo_ia==='manual'||conv.modo_manual
  const cart = parseInt(conv.itens_carrinho||0)
  const rfm  = rfmMap?.[conv.telefone]
  const rfmC = rfm?(RFM_CFG[rfm.score]||RFM_CFG.novo):null
  const unread = parseInt(conv.msgs_nao_lidas||0)
  const canal = CANAL_CFG[conv.canal] || null

  return <div onClick={onClick} style={{
    display:'flex',gap:9,padding:'10px 14px',cursor:'pointer',
    background:sel?'rgba(124,106,247,.08)':'transparent',
    borderLeft:`3px solid ${sel?'var(--accent)':'transparent'}`,
    borderBottom:'1px solid var(--sep)',
    transition:'all .1s',
  }}
    onMouseEnter={e=>{if(!sel)e.currentTarget.style.background='var(--bg-3)'}}
    onMouseLeave={e=>{if(!sel)e.currentTarget.style.background='transparent'}}
  >
    <Av nome={conv.nome||conv.telefone} foto={conv.foto_url} size={36} status={statusAtend} pulse={unread>0}/>
    <div style={{flex:1,minWidth:0}}>
      {/* Linha 1: nome + hora + unread */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:2}}>
        <span style={{fontSize:12.5,fontWeight:sel?700:600,color:sel?'var(--accent)':'var(--label)',
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:140}}>
          {conv.nome||fmtTel(conv.telefone)}
        </span>
        <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
          {unread>0&&<span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:99,
            minWidth:16,textAlign:'center',background:'var(--accent)',color:'#fff'}}>{unread}</span>}
          <span style={{fontSize:9,color:'var(--label-4)'}}>{fmtRel(conv.ultima_atividade)}</span>
        </div>
      </div>
      {/* Linha 2: preview mensagem */}
      <p style={{fontSize:11,color:'var(--label-4)',overflow:'hidden',textOverflow:'ellipsis',
        whiteSpace:'nowrap',marginBottom:5,maxWidth:'100%',lineHeight:1.3}}>
        {conv.ultima_mensagem||'—'}
      </p>
      {/* Linha 3: badges */}
      <div style={{display:'flex',gap:3,alignItems:'center',flexWrap:'nowrap',overflow:'hidden'}}>
        <SlaBadge ts={conv.ultima_atividade} compact/>
        <span style={{fontSize:9,fontWeight:600,padding:'1px 5px',borderRadius:4,
          color:S.cor,background:S.bg,border:`1px solid ${S.bdr}`,whiteSpace:'nowrap'}}>
          {S.label}
        </span>
        <span style={{fontSize:9,padding:'1px 5px',borderRadius:4,whiteSpace:'nowrap',
          color:man?'#3b82f6':'#a78bfa',background:man?'rgba(59,130,246,.1)':'rgba(167,139,250,.1)'}}>
          {man?'Agente':nomeIA}
        </span>
        {cart>0&&<span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:4,
          color:'#f59e0b',background:'rgba(245,158,11,.12)',animation:'pulse 2s ease infinite',
          whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:2}}>
          <ShoppingCart size={7}/>{cart}
        </span>}
        {rfmC&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:4,
          color:rfmC.cor,background:`${rfmC.cor}15`,whiteSpace:'nowrap'}}>
          <rfmC.Icon size={7} style={{display:'inline',marginRight:2}}/>{rfmC.label}
        </span>}
        {canal&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:4,
          color:canal.cor,background:`${canal.cor}15`,whiteSpace:'nowrap'}}>
          {canal.label}
        </span>}
      </div>
    </div>
  </div>
})

// ─── BOLHA ────────────────────────────────────────────────────────────────────
const Bolha = memo(function Bolha({msg,nomeIA}) {
  const [reacao,setReacao]=useState(null)
  const [picker,setPicker]=useState(false)
  const entrada=msg.direcao==='entrada'
  const isNota =msg.modo==='nota'
  const isGat  =msg.modo==='transacional'
  const isMan  =msg.modo==='manual'||msg.modo==='humano'
  const texto  =(msg.conteudo||'').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g,'').trim()
  if (!texto) return null
  if (isGat) return <div style={{display:'flex',justifyContent:'center',margin:'4px 0'}}>
    <span style={{fontSize:9.5,color:'rgba(167,139,250,.5)',padding:'2px 10px',borderRadius:99,
      background:'rgba(167,139,250,.06)',border:'1px solid rgba(167,139,250,.1)'}}>
      <Zap size={7} style={{display:'inline',marginRight:3}}/>{texto.slice(0,70)}
    </span>
  </div>
  if (isNota) return <div style={{display:'flex',justifyContent:'center',margin:'4px 0'}}>
    <span style={{fontSize:11,color:'#f59e0b',padding:'4px 12px',borderRadius:8,
      background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.15)',fontStyle:'italic',
      display:'flex',alignItems:'center',gap:5}}>
      <StickyNote size={10}/>Nota: {texto}
    </span>
  </div>

  const bgBolha=entrada?'var(--bg-3)':isMan?'rgba(59,130,246,.1)':'rgba(124,106,247,.1)'
  const bdrBolha=entrada?'1px solid var(--sep)':isMan?'1px solid rgba(59,130,246,.15)':'1px solid rgba(124,106,247,.15)'
  const radBolha=entrada?'4px 16px 16px 14px':'16px 4px 14px 16px'
  const labelTxt=entrada?null:isMan?'Atendente':nomeIA
  const labelCor=isMan?'#3b82f6':'#22c55e'

  return <div style={{display:'flex',flexDirection:'column',marginBottom:6,alignItems:entrada?'flex-start':'flex-end'}}>
    {labelTxt&&<span style={{fontSize:9,fontWeight:700,marginBottom:2,paddingLeft:2,
      color:labelCor,display:'flex',alignItems:'center',gap:3}}>
      {isMan?<User size={8}/>:<Bot size={8}/>}{labelTxt}
    </span>}
    <div style={{display:'flex',alignItems:'flex-end',gap:5,flexDirection:entrada?'row':'row-reverse',maxWidth:'80%'}}>
      {entrada&&<div style={{width:18,height:18,borderRadius:'50%',background:'var(--fill)',
        display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:700,
        color:'var(--label-4)',flexShrink:0}}>{initials(msg.nome||'')}</div>}
      <div style={{padding:'8px 12px',borderRadius:radBolha,background:bgBolha,border:bdrBolha,
        position:'relative',maxWidth:'100%'}}>
        {msg.midia_tipo==='image'&&msg.midia_url&&
          <img src={msg.midia_url} alt="" style={{width:'100%',borderRadius:6,marginBottom:4,maxHeight:140,objectFit:'cover'}}
            onError={e=>e.target.style.display='none'}/>}
        <p style={{fontSize:12.5,lineHeight:1.55,color:'var(--label)',whiteSpace:'pre-wrap',wordBreak:'break-words',margin:0}}>{texto}</p>
        <div style={{display:'flex',alignItems:'center',gap:4,marginTop:3,justifyContent:entrada?'flex-start':'flex-end'}}>
          <span style={{fontSize:9,color:'var(--label-4)'}}>{fmtHora(msg.criado_em)}</span>
          {!entrada&&<Check size={9} style={{color:'#3b82f6'}}/>}
        </div>
        {reacao&&<button onClick={()=>setReacao(null)} style={{
          position:'absolute',bottom:-10,right:8,fontSize:12,background:'var(--bg-2)',
          border:'1px solid var(--sep)',borderRadius:99,padding:'0 4px',cursor:'pointer'}}>{reacao}</button>}
      </div>
      <div style={{position:'relative',flexShrink:0,opacity:.4,transition:'opacity .1s'}}
        onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=.4}>
        <button onClick={()=>setPicker(v=>!v)} style={{width:18,height:18,borderRadius:'50%',border:'1px solid var(--sep)',
          background:'var(--bg-3)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <Smile size={9} style={{color:'var(--label-4)'}}/>
        </button>
        {picker&&<div style={{position:'absolute',bottom:22,[entrada?'left':'right']:0,
          display:'flex',gap:3,background:'var(--bg-2)',border:'1px solid var(--sep)',
          borderRadius:99,padding:'5px 7px',boxShadow:'0 4px 16px rgba(0,0,0,.4)',zIndex:50,whiteSpace:'nowrap'}}>
          {REACOES.map(r=><button key={r} onClick={()=>{setReacao(r);setPicker(false)}}
            style={{fontSize:15,background:'none',border:'none',cursor:'pointer',padding:0,
              transition:'transform .1s'}}
            onMouseEnter={e=>e.target.style.transform='scale(1.4)'}
            onMouseLeave={e=>e.target.style.transform='scale(1)'}>{r}</button>)}
        </div>}
      </div>
    </div>
  </div>
})

function DateSep({date}) {
  return <div style={{display:'flex',alignItems:'center',gap:8,margin:'10px 0'}}>
    <div style={{flex:1,height:1,background:'var(--sep)'}}/>
    <span style={{fontSize:9.5,fontWeight:600,color:'var(--label-4)',padding:'2px 8px',
      borderRadius:99,background:'var(--fill)',border:'1px solid var(--sep)'}}>{date}</span>
    <div style={{flex:1,height:1,background:'var(--sep)'}}/>
  </div>
}

// ─── BARRA ENVIO ──────────────────────────────────────────────────────────────
function BarraEnvio({telefone,api,modoManual,onEnviou,onAssumirModo,nomeIA}) {
  const [texto,   setTexto]  = useState('')
  const [env,     setEnv]    = useState(false)
  const [anot,    setAnot]   = useState(false)
  const [sugest,  setSugest] = useState([])
  const [rrOpen,  setRROpen] = useState(false)
  const [rrF,     setRRF]    = useState('')
  const [ref,     setRef]    = useState(false)
  const [imgPrev, setImprev] = useState(null)
  const [vidPrev, setVidPrev]= useState(null)
  const [emojiOpen,setEmoji] = useState(false)
  const inputRef=useRef(null)
  const imgRef  =useRef(null)
  const vidRef  =useRef(null)

  useEffect(()=>{
    if(!telefone||!modoManual) return
    fetch(`${api}/api/sugestoes/${telefone}`)
      .then(r=>r.ok?r.json():null).then(d=>setSugest((d?.sugestoes||d||[]).slice(0,3))).catch(()=>{})
  },[telefone,modoManual])

  const enviar=async(msg)=>{
    const txt=(msg||texto).trim(); if(!txt||env) return
    setTexto(''); setSugest([]); setAnot(false); setRROpen(false)
    setEnv(true)
    await fetch(`${api}/api/dashboard/mensagem`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({telefone,mensagem:txt,anotacao:anot})
    }).catch(()=>{})
    setEnv(false); onEnviou?.(); inputRef.current?.focus()
  }

  const enviarMidia=async(file,tipo)=>{
    if(!file) return
    const reader=new FileReader()
    reader.onload=async()=>{
      await fetch(`${api}/api/dashboard/mensagem`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({telefone,tipo,midia_base64:reader.result.split(',')[1],midia_nome:file.name})
      }).catch(()=>{})
      onEnviou?.(); setImprev(null); setVidPrev(null)
    }
    reader.readAsDataURL(file)
  }

  const refinarIA=async()=>{
    if(!texto.trim()||ref) return; setRef(true)
    try {
      const r=await fetch(`${api}/api/ia/melhorar-texto`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({texto,contexto:'Atendimento WhatsApp'})
      })
      if(r.ok){const d=await r.json();if(d.texto)setTexto(d.texto)}
    } catch {}
    setRef(false)
  }

  const onKeyDown=e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar()}
    if(e.key==='Escape'){setRROpen(false);setEmoji(false);setImprev(null);setVidPrev(null)}
  }
  const onChange=e=>{
    const v=e.target.value; setTexto(v)
    if(v.startsWith('/')) {setRROpen(true);setRRF(v.slice(1).toLowerCase())} else setRROpen(false)
  }

  const rrFilt=RESPOSTAS_RAPIDAS.filter(r=>!rrF||r.atalho.slice(1).includes(rrF)||r.titulo.toLowerCase().includes(rrF))
  const EMOJIS=['😊','👍','🙏','❤️','✅','📦','💰','🚀','😅','🎉','😍','🔥','💬','⏳','👋','🎁','✨','💯','😇','🤝']

  if (!modoManual) return (
    <div style={{borderTop:'1px solid var(--sep)',background:'var(--bg-2)',flexShrink:0}}>
      {sugest.length>0&&<div style={{padding:'6px 12px',display:'flex',gap:5,flexWrap:'wrap',borderBottom:'1px solid var(--sep)'}}>
        <span style={{fontSize:9.5,color:'var(--label-4)',alignSelf:'center',display:'flex',alignItems:'center',gap:3}}>
          <Bot size={9} style={{color:'#a78bfa'}}/> Sugestões:
        </span>
        {sugest.map((s,i)=>{const txt=typeof s==='string'?s:s.mensagem||s.texto||''; return(
          <button key={i} onClick={()=>enviar(txt)}
            style={{fontSize:10,padding:'2px 8px',borderRadius:99,border:'1px solid rgba(167,139,250,.3)',
              background:'rgba(167,139,250,.08)',color:'#a78bfa',cursor:'pointer',maxWidth:160,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {txt.slice(0,30)}{txt.length>30?'...':''}
          </button>
        )})}
      </div>}
      <div style={{padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
        <Bot size={15} style={{color:'#a78bfa',flexShrink:0}}/>
        <span style={{fontSize:11.5,color:'var(--label-4)',flex:1}}>{nomeIA} está respondendo automaticamente.</span>
        <button onClick={onAssumirModo} style={{
          display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,
          border:'1px solid rgba(59,130,246,.35)',background:'rgba(59,130,246,.08)',
          color:'#3b82f6',cursor:'pointer',fontSize:11.5,fontWeight:600,flexShrink:0}}>
          <User size={12}/>Assumir
        </button>
      </div>
    </div>
  )

  return <div style={{borderTop:'1px solid var(--sep)',background:'var(--bg-2)',flexShrink:0}}>
    {/* Respostas rápidas */}
    {rrOpen&&rrFilt.length>0&&<div style={{maxHeight:160,overflowY:'auto',borderBottom:'1px solid var(--sep)'}}>
      {rrFilt.map((r,i)=><button key={i} onClick={()=>{setTexto(r.texto);setRROpen(false);inputRef.current?.focus()}}
        style={{display:'flex',gap:10,width:'100%',textAlign:'left',padding:'7px 14px',background:'none',
          border:'none',cursor:'pointer',borderBottom:'1px solid var(--sep)'}}
        onMouseEnter={e=>e.currentTarget.style.background='var(--fill)'}
        onMouseLeave={e=>e.currentTarget.style.background='none'}>
        <code style={{fontSize:9.5,color:'var(--accent)',background:'var(--fill)',padding:'1px 5px',borderRadius:4,flexShrink:0,marginTop:1}}>{r.atalho}</code>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:'var(--label)',marginBottom:1}}>{r.titulo}</div>
          <div style={{fontSize:10.5,color:'var(--label-4)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:300}}>{r.texto}</div>
        </div>
      </button>)}
    </div>}
    {/* Sugestões IA */}
    {sugest.length>0&&<div style={{padding:'5px 12px',display:'flex',gap:4,flexWrap:'wrap',borderBottom:'1px solid var(--sep)'}}>
      {sugest.map((s,i)=>{const txt=typeof s==='string'?s:s.mensagem||s.texto||''; return(
        <button key={i} onClick={()=>setTexto(txt)}
          style={{fontSize:10,padding:'2px 8px',borderRadius:99,border:'1px solid rgba(167,139,250,.3)',
            background:'rgba(167,139,250,.08)',color:'#a78bfa',cursor:'pointer'}}>
          {txt.slice(0,30)}{txt.length>30?'...':''}
        </button>
      )})}
    </div>}
    {/* Preview */}
    {imgPrev&&<div style={{padding:'6px 12px',display:'flex',alignItems:'center',gap:8,background:'var(--fill)',borderBottom:'1px solid var(--sep)'}}>
      <img src={imgPrev.url} alt="" style={{height:44,borderRadius:5,objectFit:'cover'}}/>
      <span style={{fontSize:11,color:'var(--label-3)',flex:1}}>{imgPrev.nome}</span>
      <button onClick={()=>setImprev(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)'}}><X size={13}/></button>
      <button onClick={()=>enviarMidia(imgPrev.file,'image')} style={{padding:'4px 10px',borderRadius:7,border:'none',background:'var(--accent)',color:'#fff',cursor:'pointer',fontSize:11,fontWeight:600,display:'flex',alignItems:'center',gap:4}}>
        <Send size={11}/>Enviar
      </button>
    </div>}
    {vidPrev&&<div style={{padding:'6px 12px',display:'flex',alignItems:'center',gap:8,background:'var(--fill)',borderBottom:'1px solid var(--sep)'}}>
      <Video size={18} style={{color:'var(--label-4)',flexShrink:0}}/>
      <span style={{fontSize:11,color:'var(--label-3)',flex:1}}>{vidPrev.nome}</span>
      <button onClick={()=>setVidPrev(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)'}}><X size={13}/></button>
      <button onClick={()=>enviarMidia(vidPrev.file,'video')} style={{padding:'4px 10px',borderRadius:7,border:'none',background:'var(--accent)',color:'#fff',cursor:'pointer',fontSize:11,fontWeight:600,display:'flex',alignItems:'center',gap:4}}>
        <Send size={11}/>Enviar
      </button>
    </div>}
    {/* Emoji picker */}
    {emojiOpen&&<div style={{padding:'8px 10px',borderBottom:'1px solid var(--sep)',display:'flex',flexWrap:'wrap',gap:2}}>
      {EMOJIS.map(e=><button key={e} onClick={()=>{setTexto(t=>t+e);setEmoji(false);inputRef.current?.focus()}}
        style={{fontSize:18,background:'none',border:'none',cursor:'pointer',padding:'2px',borderRadius:4,transition:'transform .1s'}}
        onMouseEnter={ev=>ev.target.style.transform='scale(1.3)'}
        onMouseLeave={ev=>ev.target.style.transform='scale(1)'}>{e}</button>)}
    </div>}
    {/* Input principal */}
    <div style={{padding:'8px 12px',display:'flex',flexDirection:'column',gap:6}}>
      {anot&&<div style={{fontSize:10,color:'#f59e0b',display:'flex',alignItems:'center',gap:4,padding:'2px 6px',borderRadius:5,background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)'}}>
        <StickyNote size={9}/> Nota interna — não enviada ao cliente
      </div>}
      <div style={{display:'flex',gap:6,alignItems:'flex-end'}}>
        <textarea value={texto} onChange={onChange} onKeyDown={onKeyDown} ref={inputRef}
          placeholder={anot?'Anotação interna...':'Digite a mensagem... (/ para atalhos)'}
          rows={texto.split('\n').length>2?3:2}
          style={{flex:1,padding:'8px 11px',borderRadius:10,resize:'none',
            border:`1px solid ${anot?'rgba(245,158,11,.4)':'var(--sep)'}`,
            background:anot?'rgba(245,158,11,.04)':'var(--fill)',
            color:'var(--label)',fontSize:12.5,lineHeight:1.5,fontFamily:'inherit',outline:'none'}}/>
        <button onClick={()=>enviar()} disabled={env||!texto.trim()} style={{
          width:38,height:38,borderRadius:10,border:'none',
          background:texto.trim()?'var(--accent)':'var(--fill)',
          color:texto.trim()?'#fff':'var(--label-4)',
          cursor:texto.trim()?'pointer':'not-allowed',
          display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .15s'}}>
          <Send size={15}/>
        </button>
      </div>
      {/* Toolbar */}
      <div style={{display:'flex',gap:4,alignItems:'center',flexWrap:'wrap'}}>
        {[
          {I:Smile,   act:emojiOpen, fn:()=>setEmoji(v=>!v),  tip:'Emoji'},
          {I:Image,   act:false,     fn:()=>imgRef.current?.click(), tip:'Imagem'},
          {I:Video,   act:false,     fn:()=>vidRef.current?.click(), tip:'Vídeo'},
          {I:StickyNote,act:anot,    fn:()=>setAnot(v=>!v),  tip:'Nota interna'},
        ].map(({I,act,fn,tip})=><button key={tip} onClick={fn} title={tip} style={{
          display:'flex',alignItems:'center',justifyContent:'center',
          width:26,height:26,borderRadius:6,border:'1px solid var(--sep)',
          background:act?'var(--fill)':'none',
          color:act?'var(--accent)':'var(--label-4)',cursor:'pointer',transition:'all .1s'}}>
          <I size={12}/>
        </button>)}
        <button onClick={refinarIA} disabled={!texto.trim()||ref} title="Refinar com IA" style={{
          display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:6,
          border:'1px solid rgba(167,139,250,.3)',background:'rgba(167,139,250,.06)',
          color:'#a78bfa',cursor:'pointer',fontSize:10.5,opacity:texto.trim()?1:0.4}}>
          <Sparkles size={10}/>{ref?'...':'Refinar'}
        </button>
        <button onClick={onAssumirModo} style={{
          marginLeft:'auto',display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:6,
          border:'1px solid rgba(239,68,68,.25)',background:'rgba(239,68,68,.05)',
          color:'#ef4444',cursor:'pointer',fontSize:10.5}}>
          <Bot size={10}/>Devolver IA
        </button>
        <input ref={imgRef} type="file" accept="image/*" style={{display:'none'}}
          onChange={e=>{const f=e.target.files[0];if(f){setImprev({url:URL.createObjectURL(f),nome:f.name,file:f});e.target.value=''}}}/>
        <input ref={vidRef} type="file" accept="video/*" style={{display:'none'}}
          onChange={e=>{const f=e.target.files[0];if(f){setVidPrev({nome:f.name,file:f});e.target.value=''}}}/>
      </div>
    </div>
  </div>
}

// ─── PAINEL LATERAL ───────────────────────────────────────────────────────────
function PainelLateral({conv,api,onClose}) {
  const [aba,    setAba]   = useState('resumo')
  const [perfil, setPerfil]= useState(null)
  const [pedidos,setPed]   = useState([])
  const [loadPed,setLPed]  = useState(false)
  const [ocors,  setOcors] = useState([])
  const [novaOc, setNOc]   = useState('')
  const [savOc,  setSavOc] = useState(false)
  const [avals,  setAvals] = useState([])
  const [notas,  setNotas] = useState([])
  const [novaNota,setNN]   = useState('')
  const [savNota,setSavN]  = useState(false)
  const [custo,  setCusto] = useState(null)
  const [catQ,   setCatQ]  = useState('')
  const [catProds,setCatP] = useState([])
  const [catLoad,setCatL]  = useState(false)
  const [catEnv, setCatEnv]= useState(null)

  const tel = conv?.telefone

  useEffect(()=>{
    if(!tel) return; let m=true
    fetch(`${api}/api/dashboard/historico/${tel}?limit=1`)
      .then(r=>r.ok?r.json():null).then(d=>{if(m&&d)setPerfil(p=>({...(p||{}),carrinho:d.carrinho||[],modo:d.modo||'ia'}))}).catch(()=>{})
    fetch(`${api}/api/contatos/${tel}`)
      .then(r=>r.ok?r.json():null).then(d=>{if(m&&d)setPerfil(p=>({...(p||{}),
        ...Object.fromEntries(Object.entries(d).filter(([,v])=>v!=null))
      }))}).catch(()=>{})
    fetch(`${api}/api/ia-custo/${tel.replace(/\D/g,'')}`)
      .then(r=>r.ok?r.json():null).then(d=>{if(m)setCusto(d)}).catch(()=>{})
    setLPed(true)
    fetch(`${api}/api/contatos/${tel}/pedidos`)
      .then(r=>r.ok?r.json():null).then(d=>{if(m)setPed(d?.pedidos||d||[])}).catch(()=>{})
      .finally(()=>{if(m)setLPed(false)})
    const telN=tel.replace(/\D/g,'')
    const t1=telN.startsWith('55')?telN.slice(2):telN
    const t2=telN.startsWith('55')?telN:'55'+telN
    Promise.allSettled([
      fetch(`${api}/api/ocorrencias?telefone=${t1}`).then(r=>r.ok?r.json():null),
      fetch(`${api}/api/ocorrencias?telefone=${t2}`).then(r=>r.ok?r.json():null),
    ]).then(rs=>{if(!m)return;const all=[...new Map(rs.flatMap(r=>r.value?.ocorrencias||[]).map(o=>[o.id,o])).values()];setOcors(all)}).catch(()=>{})
    fetch(`${api}/api/inteligencia/avaliacoes?telefone=${telN}`)
      .then(r=>r.ok?r.json():null).then(d=>{if(m)setAvals(d?.avaliacoes||[])}).catch(()=>{})
    fetch(`${api}/api/notas-internas/${telN}`)
      .then(r=>r.ok?r.json():null).then(d=>{if(m)setNotas(d?.notas||[])}).catch(()=>{})
    return()=>{m=false}
  },[tel,api])

  const criarOc=async()=>{
    if(!novaOc.trim()) return; setSavOc(true)
    await fetch(`${api}/api/ocorrencias`,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({telefone:tel,tipo:'suporte',descricao:novaOc})}).catch(()=>{})
    setNOc(''); setSavOc(false)
    const t=tel.replace(/\D/g,'')
    fetch(`${api}/api/ocorrencias?telefone=${t}`).then(r=>r.ok?r.json():null).then(d=>setOcors(d?.ocorrencias||[])).catch(()=>{})
  }

  const criarNota=async()=>{
    if(!novaNota.trim()) return; setSavN(true)
    await fetch(`${api}/api/notas-internas/${tel.replace(/\D/g,'')}`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({conteudo:novaNota})}).catch(()=>{})
    setNN(''); setSavN(false)
    fetch(`${api}/api/notas-internas/${tel.replace(/\D/g,'')}`)
      .then(r=>r.ok?r.json():null).then(d=>setNotas(d?.notas||[])).catch(()=>{})
  }

  const buscarCatalogo=async()=>{
    if(!catQ.trim()) return; setCatL(true); setCatP([])
    fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(catQ)}`)
      .then(r=>r.ok?r.json():null).then(d=>setCatP(d?.produtos||[])).catch(()=>{}).finally(()=>setCatL(false))
  }

  const enviarProduto=async(p)=>{
    if(!tel) return; setCatEnv(p.id||p.bling_id)
    const nome=p.nome||p.descricao||'Produto'
    const n=parseFloat(p.preco||p.precoVenda||0)
    const estoque=parseInt(p.estoque||0)
    let msg=`*${nome}*\n`
    if(p.descricao_curta) msg+=`\n${p.descricao_curta}\n`
    msg+=`\n💰 PIX: ${fmtR(n*.9)} _(10% off)_\n💳 Cartão: ${fmtR(n)}`
    if(estoque>0) msg+=`\n📦 Estoque: ${estoque} unidades`
    await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({telefone:tel,mensagem:msg})}).catch(()=>{})
    setTimeout(()=>setCatEnv(null),2000)
  }

  const enviarAviseme=async(p)=>{
    if(!tel) return
    const nome=p.nome||p.descricao||'Produto'
    const msg=`Olá! Pode me avisar quando o produto *${nome}* estiver disponível? 🙏`
    await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({telefone:tel,mensagem:msg})}).catch(()=>{})
    // Registra no gatilho avise-me
    await fetch(`${api}/api/templates/disparar-gatilho`,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({gatilho:'avise_me',telefone:tel,variaveis:{nome_produto:nome}})}).catch(()=>{})
  }

  const cart=perfil?.carrinho||[]
  const ltvTotal=pedidos.reduce((s,p)=>s+parseFloat(p.total||0),0)
  const ocAbertos=ocors.filter(o=>o.status!=='resolvido').length
  const mediaAval=avals.length?(avals.reduce((s,a)=>s+a.estrelas,0)/avals.length).toFixed(1):null

  const ABAS=[
    {id:'resumo',     label:'Resumo',   Icon:Info,         badge:null},
    {id:'pedidos',    label:'Pedidos',  Icon:Package,      badge:pedidos.length||null},
    {id:'catalogo',   label:'Catálogo', Icon:Tag,          badge:null},
    {id:'ocorrencias',label:'Ocorr.',   Icon:AlertCircle,  badge:ocAbertos||null, cor:'#ef4444'},
    {id:'avaliacoes', label:'Aval.',    Icon:Star,         badge:mediaAval?`${mediaAval}★`:null, cor:'#f59e0b'},
    {id:'notas',      label:'Notas',    Icon:StickyNote,   badge:notas.length||null},
  ]

  return <div style={{width:300,flexShrink:0,display:'flex',flexDirection:'column',
    borderLeft:'1px solid var(--sep)',background:'var(--bg-2)',overflow:'hidden',
    boxShadow:'-4px 0 16px rgba(0,0,0,.15)'}}>

    {/* Header painel */}
    <div style={{padding:'10px 14px',borderBottom:'1px solid var(--sep)',
      display:'flex',alignItems:'center',gap:9,background:'var(--bg-3)',flexShrink:0}}>
      <Av nome={conv?.nome||conv?.telefone} foto={conv?.foto_url} size={30}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,fontWeight:700,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {conv?.nome||fmtTel(conv?.telefone)}
        </div>
        <div style={{fontSize:9.5,color:'var(--label-4)'}}>{fmtTel(conv?.telefone)}</div>
      </div>
      <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:2}}>
        <X size={14}/>
      </button>
    </div>

    {/* Tabs */}
    <div style={{display:'flex',borderBottom:'1px solid var(--sep)',flexShrink:0,overflowX:'auto'}}>
      {ABAS.map(t=>{const Ic=t.Icon;const active=aba===t.id;return(
        <button key={t.id} onClick={()=>setAba(t.id)} title={t.label} style={{
          display:'flex',flexDirection:'column',alignItems:'center',gap:1,
          padding:'6px 0',flex:1,minWidth:40,border:'none',background:'none',cursor:'pointer',
          borderBottom:active?`2px solid ${t.cor||'var(--accent)'}`:' 2px solid transparent',
          color:active?(t.cor||'var(--accent)'):'var(--label-4)',transition:'all .1s',position:'relative'}}>
          <Ic size={13}/>
          {t.badge&&<span style={{position:'absolute',top:2,right:'15%',fontSize:8,fontWeight:700,
            padding:'0 3px',borderRadius:99,background:t.cor||'var(--accent)',color:'#fff',
            minWidth:13,textAlign:'center',lineHeight:'13px'}}>{t.badge}</span>}
        </button>
      )})}
    </div>

    {/* Conteúdo */}
    <div style={{flex:1,overflowY:'auto',padding:'10px 12px'}}>

      {/* RESUMO */}
      {aba==='resumo'&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
        {/* Contato */}
        {[['Tel',fmtTel(conv?.telefone),Phone],['Email',perfil?.email,Mail],['CPF',perfil?.cpf||perfil?.cpfCnpj,Hash]].filter(([,v])=>v).map(([k,v,Ic])=>(
          <div key={k} style={{display:'flex',alignItems:'center',gap:7,fontSize:11.5}}>
            <Ic size={11} style={{color:'var(--label-4)',flexShrink:0}}/>
            <span style={{color:'var(--label-4)',width:32,flexShrink:0,fontSize:10}}>{k}</span>
            <span style={{color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</span>
          </div>
        ))}
        {/* LTV */}
        {pedidos.length>0&&<div style={{background:'var(--fill)',borderRadius:8,padding:'9px 10px',marginTop:4}}>
          <div style={{fontSize:9.5,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>LTV do cliente</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
            {[['Pedidos',pedidos.length],['Total',fmtR(ltvTotal)],['Ticket médio',fmtR(ltvTotal/Math.max(pedidos.length,1))],['Último',pedidos[0]?.data?fmtData(pedidos[0].data):'—']].map(([k,v])=>(
              <div key={k}>
                <div style={{fontSize:9,color:'var(--label-4)',marginBottom:1}}>{k}</div>
                <div style={{fontSize:13,fontWeight:700,color:'var(--label)'}}>{v}</div>
              </div>
            ))}
          </div>
        </div>}
        {/* Carrinho ativo */}
        {cart.length>0&&<div style={{background:'rgba(245,158,11,.07)',border:'1px solid rgba(245,158,11,.2)',borderRadius:8,padding:'9px 10px'}}>
          <div style={{fontSize:10,fontWeight:700,color:'#f59e0b',marginBottom:6,display:'flex',alignItems:'center',gap:4}}>
            <ShoppingCart size={11}/>{cart.length} {cart.length===1?'item':'itens'} no carrinho
          </div>
          {cart.map((item,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--label-3)',marginBottom:3}}>
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{item.nome}</span>
            <span style={{color:'var(--label)',fontWeight:600,flexShrink:0}}>{item.quantidade}x</span>
          </div>)}
          <div style={{borderTop:'1px solid rgba(245,158,11,.2)',paddingTop:5,marginTop:4,
            display:'flex',justifyContent:'space-between',fontSize:11.5,fontWeight:700}}>
            <span style={{color:'#f59e0b'}}>PIX total:</span>
            <span style={{color:'#f59e0b'}}>{fmtR(cart.reduce((s,i)=>s+parseFloat(i.preco||0)*i.quantidade,0)*.9)}</span>
          </div>
        </div>}
        {/* Custo IA */}
        {custo&&parseFloat(custo.custo_brl)>0&&<div style={{
          display:'flex',alignItems:'center',gap:7,fontSize:11,
          background:'var(--fill)',borderRadius:7,padding:'6px 9px'}}>
          <DollarSign size={11} style={{color:'var(--label-4)',flexShrink:0}}/>
          <span style={{color:'var(--label-4)'}}>Custo IA (24h): </span>
          <span style={{color:'var(--label)',fontWeight:600}}>R$ {custo.custo_brl}</span>
          <span style={{color:'var(--label-4)',marginLeft:2}}>{custo.chamadas} calls</span>
        </div>}
      </div>}

      {/* PEDIDOS */}
      {aba==='pedidos'&&<div style={{display:'flex',flexDirection:'column',gap:6}}>
        {loadPed?<div style={{textAlign:'center',padding:20,color:'var(--label-4)',fontSize:11}}>
          <RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Carregando...
        </div>:pedidos.length===0?<p style={{color:'var(--label-4)',fontSize:11,textAlign:'center',padding:16,margin:0}}>
          Nenhum pedido encontrado.
        </p>:pedidos.map((p,i)=>{
          const sit=p.situacaoLabel||p.situacao_label||String(p.situacaoId||p.situacao?.id||'')
          return <div key={i} style={{background:'var(--bg)',border:'1px solid var(--sep)',borderRadius:8,padding:'8px 10px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:12,fontWeight:700,color:'var(--label)'}}>#{p.numero}</span>
              <span style={{fontSize:11.5,fontWeight:700,color:'var(--accent)'}}>{fmtR(p.total)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10.5}}>
              <span style={{color:'var(--label-4)'}}>{fmtData(p.data)}</span>
              <span style={{color:'var(--label-3)'}}>{sit}</span>
            </div>
          </div>
        })}
      </div>}

      {/* CATÁLOGO */}
      {aba==='catalogo'&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
        <div style={{display:'flex',gap:5}}>
          <input value={catQ} onChange={e=>setCatQ(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&buscarCatalogo()}
            placeholder="Buscar produto..." style={{flex:1,padding:'6px 9px',borderRadius:7,
              border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:11.5}}/>
          <button onClick={buscarCatalogo} disabled={catLoad} style={{
            padding:'6px 11px',borderRadius:7,border:'none',background:'var(--accent)',
            color:'#fff',cursor:'pointer',fontSize:11,display:'flex',alignItems:'center',gap:3}}>
            <Search size={11}/>{catLoad?'...':'Buscar'}
          </button>
        </div>
        {catProds.map((p,i)=>{
          const n=parseFloat(p.preco||p.precoVenda||0)
          const estoque=parseInt(p.estoque||0)
          const disponivel=p.disponivel&&estoque>0
          const enviado=catEnv===(p.id||p.bling_id)
          return <div key={i} style={{background:'var(--bg)',border:`1px solid ${disponivel?'var(--sep)':'rgba(239,68,68,.2)'}`,
            borderRadius:10,padding:'10px 11px'}}>
            {/* Nome do produto */}
            <div style={{fontSize:12,fontWeight:700,color:'var(--label)',marginBottom:4,lineHeight:1.4}}>
              {p.nome||p.descricao}
            </div>
            {/* Código */}
            {p.codigo&&<div style={{fontSize:10,color:'var(--label-4)',marginBottom:4,
              display:'flex',alignItems:'center',gap:4}}>
              <Hash size={9}/>{p.codigo}
            </div>}
            {/* Descrição completa */}
            {p.descricao_curta&&<p style={{fontSize:11,color:'var(--label-3)',margin:'0 0 8px',
              lineHeight:1.5,padding:'5px 7px',background:'var(--fill)',borderRadius:5}}>
              {p.descricao_curta}
            </p>}
            {/* Preços */}
            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:6,flexWrap:'wrap'}}>
              <span style={{fontSize:13,fontWeight:700,color:'#22c55e'}}>PIX {fmtR(n*.9)}</span>
              <span style={{fontSize:11,color:'var(--label-4)',textDecoration:'line-through'}}>{fmtR(n)}</span>
              <span style={{fontSize:9.5,padding:'1px 5px',borderRadius:99,background:'rgba(34,197,94,.1)',color:'#22c55e',fontWeight:700}}>10% off</span>
            </div>
            {/* Estoque */}
            <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:8}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:disponivel?'#22c55e':'#ef4444',flexShrink:0}}/>
              <span style={{fontSize:10.5,color:disponivel?'#22c55e':'#ef4444',fontWeight:600}}>
                {disponivel?`${estoque} em estoque`:'Fora de estoque'}
              </span>
            </div>
            {/* Ações */}
            {disponivel?(
              <button onClick={()=>enviarProduto(p)} style={{
                width:'100%',padding:'6px',borderRadius:7,border:'none',fontSize:11,fontWeight:600,
                background:enviado?'rgba(34,197,94,.15)':'var(--accent)',
                color:enviado?'#22c55e':'#fff',cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',gap:5,transition:'all .15s'}}>
                {enviado?<><Check size={12}/>Enviado ao cliente!</>:<><Send size={12}/>Enviar produto</>}
              </button>
            ):(
              <button onClick={()=>enviarAviseme(p)} style={{
                width:'100%',padding:'6px',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',
                border:'1px solid rgba(245,158,11,.4)',background:'rgba(245,158,11,.08)',color:'#f59e0b',
                display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                <Bell size={12}/>Avise-me quando chegar
              </button>
            )}
          </div>
        })}
      </div>}

      {/* OCORRÊNCIAS */}
      {aba==='ocorrencias'&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
        <div style={{display:'flex',gap:5}}>
          <input value={novaOc} onChange={e=>setNOc(e.target.value)} onKeyDown={e=>e.key==='Enter'&&criarOc()}
            placeholder="Descrever ocorrência..." style={{flex:1,padding:'6px 9px',borderRadius:7,
              border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:11.5}}/>
          <button onClick={criarOc} disabled={savOc||!novaOc.trim()} style={{
            padding:'6px 11px',borderRadius:7,border:'none',background:'var(--accent)',
            color:'#fff',cursor:'pointer',fontSize:11,fontWeight:600}}>
            {savOc?'...':'Abrir'}
          </button>
        </div>
        {ocors.length===0?<p style={{color:'var(--label-4)',fontSize:11,textAlign:'center',padding:16,margin:0}}>Nenhuma ocorrência.</p>
          :ocors.map((oc,i)=><div key={i} style={{
              background:'var(--bg)',border:`1px solid ${oc.status==='resolvido'?'rgba(34,197,94,.2)':'var(--sep)'}`,
              borderRadius:8,padding:'8px 10px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,alignItems:'flex-start'}}>
              <span style={{fontSize:11.5,fontWeight:600,color:'var(--label)'}}>{oc.tipo||'Suporte'}</span>
              <span style={{fontSize:9,padding:'1px 5px',borderRadius:99,
                color:oc.status==='resolvido'?'#22c55e':'#f59e0b',
                background:oc.status==='resolvido'?'rgba(34,197,94,.1)':'rgba(245,158,11,.1)'}}>{oc.status||'aberto'}</span>
            </div>
            <p style={{fontSize:11,color:'var(--label-3)',margin:0,lineHeight:1.5}}>{oc.descricao}</p>
            <div style={{fontSize:9.5,color:'var(--label-4)',marginTop:4}}>{fmtDH(oc.criado_em)}</div>
          </div>)
        }
      </div>}

      {/* AVALIAÇÕES */}
      {aba==='avaliacoes'&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
        {avals.length>0&&<div style={{background:'var(--fill)',borderRadius:8,padding:'9px 10px',textAlign:'center',marginBottom:4}}>
          <div style={{fontSize:26,fontWeight:700,color:'var(--label)'}}>{mediaAval}</div>
          <div style={{fontSize:16,margin:'3px 0'}}>{'⭐'.repeat(Math.round(parseFloat(mediaAval||0)))}</div>
          <div style={{fontSize:10,color:'var(--label-4)'}}>{avals.length} avaliação{avals.length!==1?'ões':''}</div>
        </div>}
        {avals.length===0?<p style={{color:'var(--label-4)',fontSize:11,textAlign:'center',padding:16,margin:0}}>Nenhuma avaliação.</p>
          :avals.map((av,i)=><div key={i} style={{background:'var(--bg)',border:'1px solid var(--sep)',borderRadius:8,padding:'8px 10px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:13}}>{'⭐'.repeat(av.estrelas)}</span>
              <span style={{fontSize:9,color:'var(--label-4)'}}>{fmtData(av.criado_em)}</span>
            </div>
            {av.comentario&&<p style={{fontSize:11,color:'var(--label-3)',margin:0,fontStyle:'italic'}}>"{av.comentario}"</p>}
          </div>)
        }
      </div>}

      {/* NOTAS */}
      {aba==='notas'&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
        <div style={{display:'flex',flexDirection:'column',gap:5}}>
          <textarea value={novaNota} onChange={e=>setNN(e.target.value)}
            placeholder="Anotação interna (visível só para agentes)..."
            rows={3} style={{padding:'7px 9px',borderRadius:7,resize:'none',
              border:'1px solid rgba(245,158,11,.3)',background:'rgba(245,158,11,.04)',
              color:'var(--label)',fontSize:11.5,fontFamily:'inherit'}}/>
          <button onClick={criarNota} disabled={savNota||!novaNota.trim()} style={{
            padding:'5px',borderRadius:7,border:'none',background:'var(--accent)',
            color:'#fff',cursor:'pointer',fontSize:11,fontWeight:600,
            display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
            <Plus size={11}/>{savNota?'Salvando...':'Salvar nota'}
          </button>
        </div>
        {notas.length===0?<p style={{color:'var(--label-4)',fontSize:11,textAlign:'center',padding:8,margin:0}}>Nenhuma nota.</p>
          :notas.map((n,i)=><div key={i} style={{
              background:'rgba(245,158,11,.05)',border:'1px solid rgba(245,158,11,.15)',
              borderRadius:8,padding:'8px 10px'}}>
            <p style={{fontSize:11.5,color:'var(--label)',margin:'0 0 4px',lineHeight:1.5}}>{n.conteudo}</p>
            <div style={{fontSize:9.5,color:'var(--label-4)',display:'flex',alignItems:'center',gap:4}}>
              <PenLine size={8}/>{n.agente||'atendente'} · {fmtDH(n.criado_em)}
            </div>
          </div>)
        }
      </div>}
    </div>
  </div>
}

// ─── CHAT AREA ────────────────────────────────────────────────────────────────
function ChatArea({conv,api,statusAtend,onStatusChange,modoManual,onToggleModo,nomeIA,painelAberto,onTogglePainel}) {
  const [msgs,   setMsgs]  = useState([])
  const [loading,setLoad]  = useState(true)
  const [hasMore,setHMore] = useState(false)
  const [offset, setOffset]= useState(0)
  const [searchOn,setSOn]  = useState(false)
  const [busca,  setBusca] = useState('')
  const bottomRef=useRef(null)
  const fetching =useRef(false)
  const polRef   =useRef(null)
  const atBottom =useRef(true)
  const tel=conv?.telefone

  const carregar=useCallback(async(off=0,sil=false)=>{
    if(!tel||fetching.current) return; fetching.current=true
    if(!sil) setLoad(true)
    try {
      const r=await fetch(`${api}/api/dashboard/historico/${tel}?limit=60&offset=${off}`)
      if(r.ok){const d=await r.json();const n=d.mensagens||[];if(off===0)setMsgs(n);else setMsgs(p=>[...n,...p]);setHMore(d.hasMore||false);setOffset(off)}
    } catch {}
    fetching.current=false; if(!sil)setLoad(false)
  },[tel,api])

  useEffect(()=>{
    if(!tel) return
    setMsgs([]); setOffset(0); setLoad(true); atBottom.current=true; carregar(0,false)
    clearInterval(polRef.current)
    polRef.current=setInterval(()=>carregar(0,true),6000)
    return()=>clearInterval(polRef.current)
  },[carregar])

  useEffect(()=>{if(atBottom.current)bottomRef.current?.scrollIntoView({behavior:'smooth'})},[msgs])

  const onScroll=e=>{const el=e.currentTarget;atBottom.current=(el.scrollHeight-el.scrollTop-el.clientHeight)<80}

  const resetarSessao=async()=>{
    await fetch(`${api}/api/dashboard/resetar-sessao`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:tel})}).catch(()=>{})
    carregar(0,false)
  }

  const msgsComData=useMemo(()=>{
    const result=[]; let lastD=''
    const filtradas=busca?msgs.filter(m=>(m.conteudo||'').toLowerCase().includes(busca.toLowerCase())):msgs
    filtradas.forEach(m=>{
      const d=new Date(m.criado_em).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})
      if(d!==lastD){result.push({type:'sep',date:d});lastD=d}
      result.push({type:'msg',msg:m})
    })
    return result
  },[msgs,busca])

  const S=STATUS_CFG[statusAtend]||STATUS_CFG.pendente

  return <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
    {/* Header chat */}
    <div style={{padding:'8px 14px',borderBottom:'1px solid var(--sep)',flexShrink:0,
      display:'flex',alignItems:'center',gap:9,background:'var(--bg-2)'}}>
      <Av nome={conv?.nome||tel} foto={conv?.foto_url} size={32} status={statusAtend}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {conv?.nome||fmtTel(tel)}
        </div>
        <div style={{fontSize:10,color:'var(--label-4)'}}>{fmtTel(tel)}</div>
      </div>
      {/* Controles */}
      <div style={{display:'flex',gap:5,alignItems:'center',flexShrink:0}}>
        <select value={statusAtend} onChange={e=>onStatusChange(tel,e.target.value)}
          style={{fontSize:10.5,padding:'3px 6px',borderRadius:7,border:`1px solid ${S.bdr}`,
            background:S.bg,color:S.cor,cursor:'pointer',outline:'none'}}>
          {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={()=>onToggleModo(tel)} style={{
          display:'flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:7,
          border:`1px solid ${modoManual?'rgba(59,130,246,.3)':'rgba(167,139,250,.3)'}`,
          background:modoManual?'rgba(59,130,246,.08)':'rgba(167,139,250,.08)',
          color:modoManual?'#3b82f6':'#a78bfa',cursor:'pointer',fontSize:10.5,fontWeight:600}}>
          {modoManual?<User size={11}/>:<Bot size={11}/>}
          {modoManual?'Manual':'IA'}
        </button>
        {[
          {I:Search,   fn:()=>{setSOn(v=>!v);if(searchOn)setBusca('')}, act:searchOn, tip:'Buscar'},
          {I:RotateCcw,fn:resetarSessao, act:false, tip:'Resetar sessão IA'},
          {I:painelAberto?ChevronRight:Info, fn:onTogglePainel, act:painelAberto, tip:'Painel cliente'},
        ].map(({I,fn,act,tip})=><button key={tip} onClick={fn} title={tip} style={{
          width:28,height:28,borderRadius:7,border:'1px solid var(--sep)',
          background:act?'var(--fill)':'none',color:act?'var(--accent)':'var(--label-4)',
          cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <I size={13}/>
        </button>)}
      </div>
    </div>
    {/* Barra busca */}
    {searchOn&&<div style={{padding:'6px 14px',borderBottom:'1px solid var(--sep)',flexShrink:0}}>
      <div style={{position:'relative'}}>
        <Search size={11} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'var(--label-4)'}}/>
        <input value={busca} onChange={e=>setBusca(e.target.value)} autoFocus
          placeholder="Buscar nesta conversa..." style={{width:'100%',padding:'5px 8px 5px 26px',
            borderRadius:7,border:'1px solid var(--sep)',background:'var(--fill)',
            color:'var(--label)',fontSize:11.5,boxSizing:'border-box',outline:'none'}}/>
        {busca&&<span style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',
          fontSize:9.5,color:'var(--label-4)'}}>
          {msgs.filter(m=>(m.conteudo||'').toLowerCase().includes(busca.toLowerCase())).length} resultado{msgs.filter(m=>(m.conteudo||'').toLowerCase().includes(busca.toLowerCase())).length!==1?'s':''}
        </span>}
      </div>
    </div>}
    {/* Mensagens */}
    <div onScroll={onScroll} style={{flex:1,overflowY:'auto',padding:'12px 16px',display:'flex',flexDirection:'column',
      backgroundImage:'radial-gradient(rgba(124,106,247,.03) 1px, transparent 1px)',
      backgroundSize:'20px 20px'}}>
      {loading?<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--label-4)',gap:8,fontSize:12}}>
        <RefreshCw size={14} style={{animation:'spin 1s linear infinite'}}/>Carregando...
      </div>:!tel?<div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'var(--label-4)',gap:12}}>
        <MessageSquare size={40} style={{opacity:.1}}/><p style={{fontSize:14,margin:0}}>Selecione uma conversa</p>
      </div>:<>
        {hasMore&&<button onClick={()=>carregar(offset+60,false)} style={{display:'block',margin:'0 auto 10px',
          padding:'4px 12px',borderRadius:99,border:'1px solid var(--sep)',background:'var(--fill)',
          color:'var(--label-3)',cursor:'pointer',fontSize:10.5}}>Carregar mensagens anteriores</button>}
        {msgsComData.map((item,i)=>item.type==='sep'?<DateSep key={`s${i}`} date={item.date}/>:<Bolha key={item.msg.id||i} msg={item.msg} nomeIA={nomeIA}/>)}
        {msgs.length===0&&!loading&&<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--label-4)',fontSize:12}}>Nenhuma mensagem.</div>}
        <div ref={bottomRef}/>
      </>}
    </div>
    {tel&&<BarraEnvio telefone={tel} api={api} modoManual={modoManual}
      onEnviou={()=>carregar(0,true)} onAssumirModo={()=>onToggleModo(tel)} nomeIA={nomeIA}/>}
  </div>
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function PageConversas({api: apiProp, onNavigate}) {
  const api=apiProp||BASE
  const [convs,   setConvs]  = useState([])
  const [selTel,  setSel]    = useState(null)
  const [statusMap,setStMap] = useState({})
  const [modoMap, setMM]     = useState({})
  const [statusSel,setSSel]  = useState(()=>sessionStorage.getItem('bia_cs_tab')||'pendente')
  const [busca,   setBusca]  = useState('')
  const [loading, setLoad]   = useState(true)
  const [nomeIA,  setNomeIA] = useState('Bia')
  const [fila,    setFila]   = useState([])
  const [rfmMap,  setRfm]    = useState({})
  const [painelOp,setPainel] = useState(true)
  const [bgQ,     setBGQ]    = useState('')
  const [bgRes,   setBGR]    = useState([])
  const [bgLoad,  setBGL]    = useState(false)
  const [bgOpen,  setBGO]    = useState(false)
  const [filtroCanal,setFC]  = useState('todos')
  const polRef=useRef(null)

  useEffect(()=>{sessionStorage.setItem('bia_cs_tab',statusSel)},[statusSel])

  useEffect(()=>{
    fetch(`${api}/api/ia/config`).then(r=>r.ok?r.json():null)
      .then(d=>{if(d?.config?.nomeIA)setNomeIA(d.config.nomeIA)}).catch(()=>{})
  },[api])

  const carregar=useCallback(async(sil=false)=>{
    if(!sil) setLoad(true)
    try {
      const [rc,rf]=await Promise.allSettled([
        fetch(`${api}/api/dashboard/conversas?aba=todas`).then(r=>r.ok?r.json():null),
        fetch(`${api}/api/fila`).then(r=>r.ok?r.json():null),
      ])
      if(rc.status==='fulfilled'&&rc.value){
        const novas=rc.value.conversas||[]
        setConvs(prev=>{
          const map=new Map(prev.map(c=>[c.telefone,c]))
          novas.forEach(c=>map.set(c.telefone,{...map.get(c.telefone)||{},...c}))
          return [...map.values()].sort((a,b)=>new Date(b.ultima_atividade)-new Date(a.ultima_atividade))
        })
      }
      if(rf.status==='fulfilled'&&rf.value) setFila(rf.value.fila||[])
    } catch {}
    if(!sil)setLoad(false)
  },[api])

  useEffect(()=>{carregar(false);polRef.current=setInterval(()=>carregar(true),8000);return()=>clearInterval(polRef.current)},[carregar])

  useEffect(()=>{
    fetch(`${api}/api/clientes-rfm`).then(r=>r.ok?r.json():null)
      .then(d=>{if(!d?.clientes)return;const m={};d.clientes.forEach(c=>{if(c.telefone)m[c.telefone]={score:c.rfm||c.score||'novo',ltv:c.ltv||0}});setRfm(m)}).catch(()=>{})
  },[api])

  const buscarGlobal=useCallback(async(q)=>{
    if(!q||q.length<2){setBGR([]);return}
    setBGL(true)
    fetch(`${api}/api/busca-conversas?q=${encodeURIComponent(q)}`)
      .then(r=>r.ok?r.json():null).then(d=>setBGR(d?.resultados||[])).catch(()=>{}).finally(()=>setBGL(false))
  },[api])

  useEffect(()=>{const t=setTimeout(()=>buscarGlobal(bgQ),400);return()=>clearTimeout(t)},[bgQ,buscarGlobal])

  const getStatus=tel=>statusMap[tel]||convs.find(c=>c.telefone===tel)?.status_atendimento||'pendente'
  const getModo  =tel=>modoMap[tel]!==undefined?modoMap[tel]:convs.find(c=>c.telefone===tel)?.modo_ia==='manual'

  const updateStatus=useCallback((tel,st)=>{
    setStMap(p=>({...p,[tel]:st}))
    fetch(`${api}/api/dashboard/status/${tel}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:st})}).catch(()=>{})
  },[api])

  const toggleModo=useCallback(tel=>{
    const novo=!getModo(tel)
    setMM(p=>({...p,[tel]:novo}))
    fetch(`${api}/api/dashboard/manual/${tel}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ativo:novo})}).catch(()=>{})
  },[api,modoMap])

  const contadores=useMemo(()=>{
    const c={pendente:0,em_andamento:0,resolvido:0,aguardando:0,encerrado:0}
    convs.forEach(cv=>{const s=getStatus(cv.telefone);if(c[s]!==undefined)c[s]++})
    return c
  },[convs,statusMap])

  const canais=useMemo(()=>[...new Set(convs.map(c=>c.canal||'').filter(Boolean))],[convs])

  const filtradas=useMemo(()=>convs.filter(c=>{
    if(getStatus(c.telefone)!==statusSel) return false
    if(filtroCanal!=='todos'&&c.canal!==filtroCanal) return false
    if(!busca) return true
    const b=busca.toLowerCase()
    return (c.nome||'').toLowerCase().includes(b)||(c.telefone||'').includes(busca)||(c.ultima_mensagem||'').toLowerCase().includes(b)
  }),[convs,statusSel,busca,statusMap,filtroCanal])

  const gruposPorData=useMemo(()=>{
    const hoje=new Date().toLocaleDateString('pt-BR')
    const ontem=new Date(Date.now()-86400000).toLocaleDateString('pt-BR')
    const g={'Hoje':[],'Ontem':[],'Esta semana':[],'Mais antigas':[]}
    filtradas.forEach(c=>{
      const ds=new Date(c.ultima_atividade||0).toLocaleDateString('pt-BR')
      const dias=(Date.now()-new Date(c.ultima_atividade||0).getTime())/86400000
      if(ds===hoje)g['Hoje'].push(c)
      else if(ds===ontem)g['Ontem'].push(c)
      else if(dias<=7)g['Esta semana'].push(c)
      else g['Mais antigas'].push(c)
    })
    return Object.entries(g).filter(([,v])=>v.length>0)
  },[filtradas])

  const convSel=convs.find(c=>c.telefone===selTel)||null
  const filaUrgente=fila.filter(f=>parseFloat(f.minutos_espera||0)>15)

  useEffect(()=>{
    const handler=e=>{
      if(e.key==='Escape')setBGO(false)
      if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();setBGO(v=>!v)}
    }
    window.addEventListener('keydown',handler); return()=>window.removeEventListener('keydown',handler)
  },[])

  return <div style={{display:'flex',height:'100%',overflow:'hidden',background:'var(--bg)'}}>

    {/* ── SIDEBAR CONVERSAS ── */}
    <div style={{width:270,flexShrink:0,display:'flex',flexDirection:'column',
      borderRight:'1px solid var(--sep)',background:'var(--bg-2)',overflow:'hidden'}}>

      {/* Header sidebar */}
      <div style={{padding:'10px 12px',borderBottom:'1px solid var(--sep)',flexShrink:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <span style={{fontSize:13.5,fontWeight:700,color:'var(--label)',display:'flex',alignItems:'center',gap:6}}>
            <MessageSquare size={14} style={{color:'var(--accent)'}}/>
            Conversas
            <span style={{fontSize:10,fontWeight:600,padding:'1px 6px',borderRadius:99,
              background:'var(--fill)',color:'var(--label-4)',border:'1px solid var(--sep)'}}>
              {filtradas.length}
            </span>
          </span>
          <button onClick={()=>carregar(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:2}}>
            <RefreshCw size={12} style={loading?{animation:'spin 1s linear infinite'}:{}}/>
          </button>
        </div>
        {/* Busca */}
        <div style={{position:'relative',marginBottom:6}}>
          <Search size={11} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--label-4)',pointerEvents:'none'}}/>
          <input value={busca} onChange={e=>setBusca(e.target.value)}
            placeholder="Buscar conversa..."
            style={{width:'100%',padding:'5px 9px 5px 26px',borderRadius:7,border:'1px solid var(--sep)',
              background:'var(--fill)',color:'var(--label)',fontSize:11.5,boxSizing:'border-box',outline:'none'}}/>
          {busca&&<button onClick={()=>setBusca('')} style={{position:'absolute',right:7,top:'50%',transform:'translateY(-50%)',
            background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:0}}><X size={10}/></button>}
        </div>
        {/* Busca global */}
        <button onClick={()=>setBGO(true)} style={{
          width:'100%',padding:'4px 9px',borderRadius:7,border:'1px solid var(--sep)',
          background:'var(--fill)',color:'var(--label-4)',cursor:'pointer',fontSize:10.5,
          display:'flex',alignItems:'center',gap:6,justifyContent:'space-between',marginBottom:6}}>
          <div style={{display:'flex',alignItems:'center',gap:5}}><Search size={10}/>Buscar em mensagens...</div>
          <kbd style={{fontSize:9,padding:'1px 4px',borderRadius:3,border:'1px solid var(--sep)',background:'var(--bg)',color:'var(--label-4)'}}>⌘K</kbd>
        </button>
        {/* Filtro canal */}
        {canais.length>0&&<div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
          {['todos',...canais].map(c=>{
            const cfg=CANAL_CFG[c]
            return <button key={c} onClick={()=>setFC(c)} style={{
              fontSize:9.5,padding:'2px 7px',borderRadius:99,border:'1px solid var(--sep)',
              background:filtroCanal===c?(cfg?.cor||'var(--accent)')+'18':'none',
              color:filtroCanal===c?(cfg?.cor||'var(--accent)'):'var(--label-4)',cursor:'pointer',
              fontWeight:filtroCanal===c?700:400}}>
              {c==='todos'?'Todos':cfg?.label||c}
            </button>
          })}
        </div>}
      </div>

      {/* Alerta fila */}
      {filaUrgente.length>0&&<div style={{
        margin:'6px 10px 0',padding:'6px 9px',borderRadius:7,
        background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',
        display:'flex',alignItems:'center',gap:6,fontSize:10.5,color:'#ef4444',flexShrink:0}}>
        <Bell size={10} style={{animation:'pulse 1.5s ease infinite',flexShrink:0}}/>
        {filaUrgente.length} aguardando +15min
      </div>}

      {/* Tabs status — ícones full width */}
      <div style={{display:'flex',borderBottom:'1px solid var(--sep)',flexShrink:0}}>
        {Object.entries(STATUS_CFG).map(([k,s])=>{
          const on=statusSel===k; const cnt=contadores[k]||0
          return <button key={k} onClick={()=>setSSel(k)} title={`${s.label}${cnt?` (${cnt})`:''}`} style={{
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,
            padding:'7px 0',flex:1,border:'none',background:'none',cursor:'pointer',
            borderBottom:on?`2px solid ${s.cor}`:'2px solid transparent',
            color:on?s.cor:'var(--label-4)',transition:'all .12s',position:'relative'}}>
            <s.Icon size={14}/>
            {cnt>0&&<span style={{position:'absolute',top:3,right:'10%',fontSize:8,fontWeight:700,
              padding:'0 3px',borderRadius:99,background:on?s.cor:'var(--label-4)',color:'#fff',
              minWidth:12,textAlign:'center',lineHeight:'12px'}}>{cnt}</span>}
          </button>
        })}
      </div>

      {/* Lista conversas */}
      <div style={{flex:1,overflowY:'auto'}}>
        {loading&&convs.length===0?<div style={{padding:24,textAlign:'center',color:'var(--label-4)',fontSize:11}}>
          <RefreshCw size={14} style={{animation:'spin 1s linear infinite',marginBottom:8}}/><br/>Carregando...
        </div>:gruposPorData.length===0?<div style={{padding:24,textAlign:'center',color:'var(--label-4)',fontSize:11}}>
          Nenhuma conversa em "{STATUS_CFG[statusSel]?.label}".
        </div>:gruposPorData.map(([grupo,lista])=><div key={grupo}>
          <div style={{padding:'5px 12px 3px',fontSize:9,fontWeight:700,color:'var(--label-4)',
            textTransform:'uppercase',letterSpacing:'.07em',background:'var(--bg-2)',
            position:'sticky',top:0,zIndex:1,borderBottom:'1px solid var(--sep)',
            display:'flex',justifyContent:'space-between'}}>
            <span>{grupo}</span><span>{lista.length}</span>
          </div>
          {lista.map(c=><ConvCard key={c.telefone}
            conv={c} sel={selTel===c.telefone}
            statusAtend={getStatus(c.telefone)} nomeIA={nomeIA} rfmMap={rfmMap}
            onClick={()=>setSel(c.telefone)}/>)}
        </div>)}
      </div>
    </div>

    {/* ── ÁREA CHAT + PAINEL ── */}
    {convSel?<>
      <ChatArea
        conv={convSel} api={api}
        statusAtend={getStatus(selTel)} onStatusChange={updateStatus}
        modoManual={getModo(selTel)} onToggleModo={toggleModo}
        nomeIA={nomeIA} painelAberto={painelOp} onTogglePainel={()=>setPainel(v=>!v)}
      />
      {painelOp&&<PainelLateral conv={convSel} api={api} onClose={()=>setPainel(false)}/>}
    </>:<div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
        justifyContent:'center',color:'var(--label-4)',gap:16}}>
      <MessageSquare size={52} style={{opacity:.08}}/>
      <div style={{textAlign:'center'}}>
        <p style={{fontSize:15,fontWeight:700,color:'var(--label)',margin:'0 0 6px'}}>Central de Atendimento</p>
        <p style={{fontSize:12,margin:0}}>Selecione uma conversa para começar</p>
      </div>
      <div style={{display:'flex',gap:16,marginTop:8}}>
        {Object.entries(contadores).filter(([,v])=>v>0).map(([k,v])=>{
          const s=STATUS_CFG[k]; return(
          <div key={k} style={{textAlign:'center',padding:'10px 16px',borderRadius:10,
            background:s.bg,border:`1px solid ${s.bdr}`}}>
            <div style={{fontSize:22,fontWeight:800,color:s.cor}}>{v}</div>
            <div style={{fontSize:10,color:s.cor,opacity:.8,marginTop:2}}>{s.label}</div>
          </div>
        )})}
      </div>
    </div>}

    {/* ── BUSCA GLOBAL MODAL ── */}
    {bgOpen&&<div style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.75)',backdropFilter:'blur(6px)',
      display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:80}}
      onClick={e=>{if(e.target===e.currentTarget)setBGO(false)}}>
      <div style={{width:580,background:'var(--bg-2)',borderRadius:14,border:'1px solid var(--sep)',
        overflow:'hidden',boxShadow:'0 24px 64px rgba(0,0,0,.5)'}}>
        <div style={{padding:'12px 16px',borderBottom:'1px solid var(--sep)',display:'flex',alignItems:'center',gap:9}}>
          <Search size={15} style={{color:'var(--label-4)',flexShrink:0}}/>
          <input value={bgQ} onChange={e=>setBGQ(e.target.value)} autoFocus
            placeholder="Buscar em todas as mensagens..." style={{
              flex:1,background:'none',border:'none',color:'var(--label)',fontSize:13.5,outline:'none'}}/>
          {bgLoad&&<RefreshCw size={13} style={{color:'var(--label-4)',animation:'spin 1s linear infinite',flexShrink:0}}/>}
          <button onClick={()=>setBGO(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',padding:2}}><X size={15}/></button>
        </div>
        <div style={{maxHeight:380,overflowY:'auto'}}>
          {bgRes.length===0&&bgQ.length>=2&&!bgLoad&&<p style={{padding:24,textAlign:'center',color:'var(--label-4)',fontSize:12,margin:0}}>
            Nenhum resultado para "{bgQ}".
          </p>}
          {bgRes.map((r,i)=><div key={i} onClick={()=>{setSel(r.telefone);setBGO(false)}}
            style={{padding:'10px 16px',borderBottom:'1px solid var(--sep)',cursor:'pointer'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--fill)'}
            onMouseLeave={e=>e.currentTarget.style.background='none'}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:12,fontWeight:600,color:'var(--label)'}}>{r.nome||fmtTel(r.telefone)}</span>
              <span style={{fontSize:10,color:'var(--label-4)'}}>{fmtDH(r.criado_em)}</span>
            </div>
            <p style={{fontSize:11.5,color:'var(--label-3)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {r.direcao==='saida'?`${nomeIA}: `:'Cliente: '}{r.mensagem_match}
            </p>
          </div>)}
        </div>
        {bgQ.length<2&&<p style={{padding:12,textAlign:'center',color:'var(--label-4)',fontSize:11,margin:0}}>
          Digite pelo menos 2 caracteres · <kbd style={{fontSize:9,padding:'1px 4px',borderRadius:3,border:'1px solid var(--sep)',background:'var(--bg)'}}>Esc</kbd> para fechar
        </p>}
      </div>
    </div>}

    <style>{`
      @keyframes spin  { to { transform: rotate(360deg) } }
      @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    `}</style>
  </div>
}
