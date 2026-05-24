import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import {
  Send, Smile, Image, Video, Mic, Search, RefreshCw,
  User, Bot, Zap, X, Lock, MessageSquare, Package,
  ShoppingCart, Tag, Check, Truck, AlertTriangle,
  ChevronDown, ChevronUp, Plus, Star, FileText,
  Phone, Mail, MapPin, ExternalLink, Copy, Sparkles,
  CircleDot, RefreshCcw, CheckCircle, Circle, XCircle,
  History, Paperclip, ArrowUpRight, MoreHorizontal
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtR   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmtRel = ts => {
  if (!ts) return ''
  const m = Math.floor((Date.now()-new Date(ts))/60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  if (m < 1440) return `${Math.floor(m/60)}h`
  return `${Math.floor(m/1440)}d`
}
const fmtHora = ts => ts ? new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : ''
const fmtData = ts => ts ? new Date(ts).toLocaleDateString('pt-BR') : ''
const initials = s => (s||'?').trim().split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()

// avatar palette
const AV_COLORS = [
  {bg:'#ede9fe',fg:'#5b21b6'},{bg:'#dbeafe',fg:'#1e40af'},{bg:'#d1fae5',fg:'#065f46'},
  {bg:'#fef3c7',fg:'#92400e'},{bg:'#fce7f3',fg:'#9d174d'},{bg:'#ccfbf1',fg:'#0f766e'},
]
const avColor = str => AV_COLORS[(str||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % AV_COLORS.length]

// ── STATUS config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pendente:     { label:'Pendente',     color:'#92400e', bg:'#fef3c7', border:'#fde68a', dot:'#f59e0b', icon:Circle       },
  em_andamento: { label:'Em andamento', color:'#1e40af', bg:'#dbeafe', border:'#bfdbfe', dot:'#3b82f6', icon:RefreshCcw   },
  resolvido:    { label:'Resolvido',    color:'#065f46', bg:'#d1fae5', border:'#a7f3d0', dot:'#10b981', icon:CheckCircle  },
  encerrado:    { label:'Encerrado',    color:'#374151', bg:'#f3f4f6', border:'#d1d5db', dot:'#9ca3af', icon:XCircle      },
}

// ── Avatar component ──────────────────────────────────────────────────────────
function Av({ nome, foto, size=32 }) {
  const { bg, fg } = avColor(nome)
  const ini = initials(nome)
  const st = { width:size, height:size, borderRadius:'50%', flexShrink:0, overflow:'hidden', background:bg, color:fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.38, fontWeight:700 }
  return foto
    ? <img src={foto} alt={nome} style={{...st, objectFit:'cover'}}/>
    : <div style={st}>{ini}</div>
}

// ── ConvCard ──────────────────────────────────────────────────────────────────
const ConvCard = memo(function ConvCard({ conv, selecionado, statusAtend, onClick, nomeIA }) {
  const st = STATUS_CFG[statusAtend] || STATUS_CFG.pendente
  const manual = conv.agente === 'humano' || conv.modo_manual
  const preview = conv.ultima_mensagem || conv.ultima_msg || ''

  return (
    <div onClick={onClick}
      className="px-3 py-3 cursor-pointer transition-colors"
      style={{
        borderBottom:'0.5px solid var(--color-border-tertiary)',
        borderLeft: selecionado ? '3px solid #4f6ef7' : '3px solid transparent',
        background: selecionado ? 'rgba(79,110,247,0.06)' : 'transparent',
      }}
      onMouseEnter={e=>{ if (!selecionado) e.currentTarget.style.background='var(--color-background-secondary)' }}
      onMouseLeave={e=>{ if (!selecionado) e.currentTarget.style.background='transparent' }}>

      <div className="flex items-center gap-2.5 mb-1.5">
        <Av nome={conv.nome||conv.telefone} foto={conv.foto_url||conv.fotoUrl} size={34}/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[12.5px] font-semibold truncate" style={{color:'var(--color-text-primary)',maxWidth:150}}>
              {conv.nome || conv.telefone}
            </span>
            <span className="text-[10px] flex-shrink-0 ml-1" style={{color:'var(--color-text-tertiary)'}}>
              {fmtRel(conv.ultima_atividade||conv.hora)}
            </span>
          </div>
          <p className="text-[11px] truncate" style={{color:'var(--color-text-secondary)',maxWidth:190}}>
            {preview.slice(0,55)||'—'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap pl-[42px]">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{background:st.bg, color:st.color, border:`1px solid ${st.border}`}}>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:st.dot}}/>
          {st.label}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={manual
            ? {background:'#dbeafe', color:'#1e40af', border:'1px solid #bfdbfe'}
            : {background:'#ede9fe', color:'#5b21b6', border:'1px solid #c4b5fd'}}>
          {manual ? <User size={9}/> : <Bot size={9}/>}
          {manual ? 'Atendente' : nomeIA}
        </span>
      </div>
    </div>
  )
})

// ── Bolha de mensagem ─────────────────────────────────────────────────────────
const Bolha = memo(function Bolha({ msg, nomeIA }) {
  const entrada   = msg.direcao === 'entrada'
  const isGatilho = msg.modo === 'transacional'
  const isManual  = msg.modo === 'manual'
  const texto     = (msg.conteudo||'').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g,'').trim()
  if (!texto) return null

  // Label do remetente
  const labelTxt   = entrada ? null : isGatilho ? 'Gatilho' : isManual ? 'Atendente' : nomeIA
  const labelColor = isGatilho ? '#b45309' : isManual ? '#1d4ed8' : '#5b21b6'

  // Estilos da bolha
  let bubbleStyle, textColor
  if (entrada) {
    bubbleStyle = { background:'var(--color-background-primary)', border:'1px solid var(--color-border-tertiary)', borderRadius:'14px 14px 14px 4px', color:'var(--color-text-primary)' }
    textColor   = 'var(--color-text-primary)'
  } else if (isGatilho) {
    bubbleStyle = { background:'#451a03', borderRadius:'14px 14px 4px 14px', border:'none', color:'#fde68a' }
    textColor   = '#fde68a'
  } else if (isManual) {
    bubbleStyle = { background:'#1e3a5f', borderRadius:'14px 14px 4px 14px', border:'none', color:'#bfdbfe' }
    textColor   = '#bfdbfe'
  } else {
    bubbleStyle = { background:'#1e1b4b', borderRadius:'14px 14px 4px 14px', border:'none', color:'#e0e7ff' }
    textColor   = '#e0e7ff'
  }

  return (
    <div className={`flex flex-col mb-3 ${entrada ? 'items-start' : 'items-end'}`}>
      {labelTxt && (
        <span className="text-[10px] font-semibold mb-1 px-0.5" style={{color:labelColor}}>
          {labelTxt}
        </span>
      )}
      <div style={{...bubbleStyle, maxWidth:'72%', padding:'10px 13px', fontSize:12.5, lineHeight:1.55, wordBreak:'break-word'}}>
        {texto.split('\n').map((l,i)=>(
          <span key={i}>{l}{i<texto.split('\n').length-1&&<br/>}</span>
        ))}
      </div>
      <div className={`flex items-center gap-1 mt-1 px-0.5 text-[10px] ${entrada?'':'flex-row-reverse'}`}
        style={{color:'var(--color-text-tertiary)'}}>
        <span>{fmtHora(msg.criado_em)}</span>
        {!entrada && <Check size={12} style={{color:'#60a5fa'}}/>}
      </div>
    </div>
  )
})

// ── DateSep ───────────────────────────────────────────────────────────────────
function DateSep({ ts }) {
  const label = (() => {
    const d = new Date(ts)
    const hoje = new Date(); hoje.setHours(0,0,0,0)
    const dia  = new Date(d); dia.setHours(0,0,0,0)
    const diff = Math.round((hoje-dia)/86400000)
    if (diff === 0) return 'Hoje'
    if (diff === 1) return 'Ontem'
    return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})
  })()
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px" style={{background:'var(--color-border-tertiary)'}}/>
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{color:'var(--color-text-tertiary)', background:'var(--color-background-secondary)', border:'1px solid var(--color-border-tertiary)'}}>
        {label} · {fmtHora(ts)}
      </span>
      <div className="flex-1 h-px" style={{background:'var(--color-border-tertiary)'}}/>
    </div>
  )
}

// ── Composer ──────────────────────────────────────────────────────────────────
function Composer({ telefone, api, onEnviou, modoManual, nomeIA }) {
  const [texto,    setTexto]   = useState('')
  const [tab,      setTab]     = useState('publica')
  const [sending,  setSending] = useState(false)
  const [sugs,     setSugs]    = useState([])
  const [loadSug,  setLoadSug] = useState(false)
  const [refining, setRefining]= useState(false)
  const taRef = useRef(null)

  // Busca sugestões ao montar
  useEffect(() => {
    if (!telefone) return
    let m = true
    setLoadSug(true)
    fetch(`${api}/api/sugestoes/${telefone}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(m&&d) setSugs((d.sugestoes||d||[]).slice(0,3)) })
      .catch(()=>{})
      .finally(()=>{ if(m) setLoadSug(false) })
    return ()=>{ m=false }
  }, [telefone, api])

  const enviar = async () => {
    const msg = texto.trim()
    if (!msg || sending) return
    setSending(true)
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ telefone, mensagem:msg, anotacao: tab==='nota' })
      })
      setTexto('')
      onEnviou?.()
    } catch {}
    setSending(false)
  }

  const refinarIA = async () => {
    if (!texto.trim()) return
    setRefining(true)
    try {
      const r = await fetch(`${api}/api/ia/melhorar-texto`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ texto, contexto:`Atendimento WhatsApp cliente ${telefone}` })
      })
      if (r.ok) { const d=await r.json(); if(d.texto) setTexto(d.texto) }
    } catch {}
    setRefining(false)
  }

  const onKey = e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }

  const isNota = tab === 'nota'
  const accentColor = isNota ? '#d97706' : '#4f6ef7'
  const borderFocus = isNota ? '#fde68a' : '#6366f1'

  return (
    <div className="flex-shrink-0" style={{background:'var(--color-background-primary)', borderTop:'1px solid var(--color-border-tertiary)'}}>

      {/* Sugestões IA */}
      {sugs.length > 0 && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto" style={{borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
          {sugs.map((s,i)=>(
            <button key={i} onClick={()=>{ setTexto(typeof s==='string'?s:s.texto||s); taRef.current?.focus() }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium flex-shrink-0 transition-colors"
              style={{background:'var(--color-background-secondary)', border:'1px solid var(--color-border-tertiary)', color:'var(--color-text-secondary)'}}>
              <Sparkles size={11} style={{color:'#8b5cf6'}}/>
              {(typeof s==='string'?s:s.texto||'').slice(0,40)}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex" style={{borderBottom:'1px solid var(--color-border-tertiary)', paddingLeft:16}}>
        {[['publica','Resposta pública','MessageSquare'],['nota','Anotação interna','Lock']].map(([id,label,ic])=>{
          const Ic = {MessageSquare, Lock}[ic]
          const on = tab===id
          const tabColor = on ? (id==='nota'?'#d97706':'#4f6ef7') : 'var(--color-text-tertiary)'
          const tabBorder = on ? (id==='nota'?'#d97706':'#4f6ef7') : 'transparent'
          return (
            <button key={id} onClick={()=>setTab(id)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-all"
              style={{color:tabColor, borderBottom:`2px solid ${tabBorder}`, background:'transparent', border:'none', cursor:'pointer', borderBottomWidth:2, borderBottomStyle:'solid', borderBottomColor:tabBorder}}>
              <Ic size={13}/>{label}
            </button>
          )
        })}
      </div>

      {/* Textarea */}
      <div className="mx-4 my-2 rounded-xl overflow-hidden transition-all"
        style={{border:`1px solid ${isNota?'#fde68a':'var(--color-border-tertiary)'}`, background: isNota?'#fffbeb':'var(--color-background-primary)'}}>
        <textarea ref={taRef} value={texto} onChange={e=>setTexto(e.target.value)} onKeyDown={onKey}
          rows={3}
          placeholder={isNota ? 'Anotação interna — visível apenas para a equipe...' : 'Escrever mensagem...'}
          className="w-full text-[13px] outline-none resize-none px-3 pt-2.5"
          style={{background:'transparent', color:'var(--color-text-primary)', border:'none', fontFamily:'inherit', lineHeight:1.5}}/>
        <div className="flex items-center justify-between px-3 pb-2.5"
          style={{background: isNota ? '#fef9ee' : 'transparent'}}>
          <div className="flex items-center gap-1">
            {[
              { ic:Image,    label:'Imagem' },
              { ic:Video,    label:'Vídeo'  },
              { ic:Mic,      label:'Áudio'  },
              { ic:Smile,    label:'Emoji'  },
              { ic:Paperclip,label:'Anexo'  },
            ].map(({ic:Ic,label})=>(
              <button key={label} title={label}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{background:'transparent', border:'none', cursor:'pointer', color:'var(--color-text-tertiary)'}}>
                <Ic size={15}/>
              </button>
            ))}
            {!isNota && (
              <button onClick={refinarIA} disabled={!texto.trim()||refining}
                className="flex items-center gap-1 ml-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold disabled:opacity-40 transition-colors"
                style={{background:'#f5f3ff', border:'1px solid #c4b5fd', color:'#7c3aed', cursor:'pointer'}}>
                <Sparkles size={11} className={refining?'animate-spin':''}/>{refining?'Refinando...':nomeIA+' IA'}
              </button>
            )}
          </div>
          <button onClick={enviar} disabled={!texto.trim()||sending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 transition-colors"
            style={{background: isNota ? '#d97706' : '#4f6ef7', color:'#fff', border:'none', cursor:'pointer'}}>
            {isNota ? <FileText size={13}/> : <Send size={13}/>}
            {sending ? 'Enviando...' : isNota ? 'Salvar nota' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Chat area ─────────────────────────────────────────────────────────────────
function ChatArea({ conv, api, statusAtend, onStatusChange, modoManual, onToggleModo, nomeIA }) {
  const [msgs,    setMsgs]   = useState([])
  const [loading, setLoading]= useState(true)
  const [hasMore, setHasMore]= useState(false)
  const [offset,  setOffset] = useState(0)
  const [catBusca,setCatBusca]=useState('')
  const [catProds,setCatProds]=useState([])
  const [catLoad, setCatLoad]= useState(false)
  const bottomRef  = useRef(null)
  const fetching   = useRef(false)
  const pollingRef = useRef(null)
  const tel = conv?.telefone

  const carregar = useCallback(async (off=0, sil=false) => {
    if (!tel||fetching.current) return
    fetching.current=true
    if (!sil) setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${tel}?limit=60&offset=${off}`)
      if (r.ok) {
        const d = await r.json()
        const novas = d.mensagens||[]
        if (off===0) setMsgs(novas); else setMsgs(p=>[...novas,...p])
        setHasMore(d.hasMore||false)
        setOffset(off===0?novas.length:off+novas.length)
      }
    } catch {}
    fetching.current=false
    setLoading(false)
  }, [tel, api])

  useEffect(() => {
    if (!tel) return
    setMsgs([]); setOffset(0); setLoading(true); setHasMore(false)
    carregar(0)
    pollingRef.current = setInterval(()=>{ if(document.visibilityState!=='hidden') carregar(0,true) }, 4000)
    return () => clearInterval(pollingRef.current)
  }, [tel, carregar])

  useEffect(() => {
    if (msgs.length > 0) bottomRef.current?.scrollIntoView({behavior:'smooth'})
  }, [msgs.length])

  // Catálogo
  const buscarCat = async () => {
    if (!catBusca.trim()) return
    setCatLoad(true); setCatProds([])
    try {
      const r = await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(catBusca)}`)
      if (r.ok) { const d=await r.json(); setCatProds(d.produtos||[]) }
    } catch {}
    setCatLoad(false)
  }

  const enviarProd = async prod => {
    const n = parseFloat(prod.preco||prod.precoVenda||0)
    const msg = `*${prod.nome||prod.descricao}*\n💳 Cartão: ${fmtR(n)} | 💰 PIX: ${fmtR(n*.9)}\n${prod.disponivel!==false?'✅ Disponível':'⚠️ Indisponível'}`
    try { await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:tel,mensagem:msg})}) } catch {}
    carregar(0,true)
  }

  // Agrupa msgs por dia para DateSep
  const grouped = useMemo(() => {
    if (!msgs.length) return []
    const out = []
    let lastDay = null
    msgs.forEach(m => {
      const day = m.criado_em ? new Date(m.criado_em).toDateString() : null
      if (day && day !== lastDay) { out.push({type:'sep',ts:m.criado_em}); lastDay=day }
      out.push({type:'msg', msg:m})
    })
    return out
  }, [msgs])

  if (!conv) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3"
      style={{background:'var(--color-background-secondary)'}}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{background:'var(--color-background-tertiary)'}}>
        <MessageSquare size={24} style={{color:'var(--color-text-tertiary)',opacity:.4}}/>
      </div>
      <p className="text-sm font-medium" style={{color:'var(--color-text-tertiary)'}}>Selecione uma conversa</p>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Header do chat ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 h-[52px]"
        style={{background:'var(--color-background-primary)', borderBottom:'1px solid var(--color-border-tertiary)'}}>
        <Av nome={conv.nome||conv.telefone} foto={conv.foto_url||conv.fotoUrl} size={32}/>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold leading-none mb-0.5" style={{color:'var(--color-text-primary)'}}>
            {conv.nome||conv.telefone}
          </p>
          <p className="text-[10px]" style={{color:'var(--color-text-tertiary)'}}>
            {conv.telefone} · {conv.total_msgs||0} msgs
          </p>
        </div>

        {/* Pipeline de status */}
        <div className="flex items-center gap-1 px-1 py-1 rounded-xl"
          style={{background:'var(--color-background-secondary)', border:'1px solid var(--color-border-tertiary)'}}>
          {Object.entries(STATUS_CFG).map(([key,s])=>{
            const ativo = statusAtend===key
            const Sic = s.icon
            return (
              <button key={key} onClick={()=>onStatusChange(key)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all"
                style={ativo
                  ? {background:s.bg, color:s.color, boxShadow:`0 0 0 1.5px ${s.border} inset`, border:'none', cursor:'pointer'}
                  : {background:'transparent', color:'var(--color-text-tertiary)', border:'none', cursor:'pointer'}}>
                <Sic size={10}/>{s.label}
              </button>
            )
          })}
        </div>

        {/* Botão assumir/devolver */}
        <button onClick={onToggleModo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
          style={modoManual
            ? {background:'#dbeafe', border:'1px solid #93c5fd', color:'#1e40af', cursor:'pointer'}
            : {background:'#ede9fe', border:'1px solid #c4b5fd', color:'#5b21b6', cursor:'pointer'}}>
          {modoManual ? <><User size={12}/>Assumindo</> : <><Bot size={12}/>Devolver à {nomeIA}</>}
        </button>
      </div>

      {/* ── Barra do catálogo ── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2"
        style={{background:'var(--color-background-primary)', borderBottom:'1px solid var(--color-border-tertiary)'}}>
        <ShoppingCart size={14} style={{color:'var(--color-text-tertiary)', flexShrink:0}}/>
        <div className="flex-1 flex items-center gap-2 rounded-lg overflow-hidden"
          style={{background:'var(--color-background-secondary)', border:'1px solid var(--color-border-tertiary)'}}>
          <Search size={12} className="ml-2 flex-shrink-0" style={{color:'var(--color-text-tertiary)'}}/>
          <input value={catBusca} onChange={e=>setCatBusca(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&buscarCat()}
            placeholder="Buscar produto para enviar ao cliente..."
            className="flex-1 text-xs py-1.5 outline-none bg-transparent pr-2"
            style={{color:'var(--color-text-primary)'}}/>
          {catLoad && <RefreshCw size={11} className="animate-spin mr-2" style={{color:'var(--color-text-tertiary)'}}/>}
        </div>
        {catBusca && (
          <button onClick={buscarCat}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
            style={{background:'#4f6ef7', color:'#fff', border:'none', cursor:'pointer'}}>
            Buscar
          </button>
        )}
      </div>

      {/* ── Resultados do catálogo ── */}
      {catProds.length > 0 && (
        <div className="flex-shrink-0 flex gap-2 px-5 py-2 overflow-x-auto"
          style={{background:'var(--color-background-secondary)', borderBottom:'1px solid var(--color-border-tertiary)'}}>
          {catProds.slice(0,6).map((p,i)=>(
            <div key={i} className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{width:200, border:'1px solid var(--color-border-tertiary)', background:'var(--color-background-primary)'}}>
              <div className="px-3 py-2" style={{borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
                <p className="text-[11px] font-semibold truncate" style={{color:'var(--color-text-primary)'}}>{p.nome||p.descricao}</p>
                <p className="text-[11px] font-bold mt-0.5" style={{color:'#059669'}}>{fmtR(p.preco||p.precoVenda)}</p>
              </div>
              <button onClick={()=>enviarProd(p)}
                className="w-full py-1.5 text-[11px] font-bold transition-colors"
                style={{background:'#4f6ef7', color:'#fff', border:'none', cursor:'pointer'}}>
                Enviar ao cliente
              </button>
            </div>
          ))}
          <button onClick={()=>{ setCatProds([]); setCatBusca('') }}
            className="flex-shrink-0 w-7 h-7 rounded-full self-center flex items-center justify-center"
            style={{background:'var(--color-background-tertiary)', border:'1px solid var(--color-border-tertiary)', cursor:'pointer'}}>
            <X size={12} style={{color:'var(--color-text-tertiary)'}}/>
          </button>
        </div>
      )}

      {/* ── Mensagens ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4"
        style={{background:'var(--color-background-secondary)'}}>
        {hasMore && (
          <div className="flex justify-center mb-4">
            <button onClick={()=>carregar(offset)}
              className="px-4 py-1.5 rounded-full text-[11px] font-semibold"
              style={{background:'var(--color-background-primary)', border:'1px solid var(--color-border-tertiary)', color:'var(--color-text-secondary)', cursor:'pointer'}}>
              <History size={11} className="inline mr-1"/>Carregar anteriores
            </button>
          </div>
        )}
        {loading && msgs.length===0 ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw size={16} className="animate-spin" style={{color:'var(--color-text-tertiary)'}}/>
          </div>
        ) : grouped.length===0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <MessageSquare size={24} style={{color:'var(--color-text-tertiary)',opacity:.3}}/>
            <p className="text-xs" style={{color:'var(--color-text-tertiary)'}}>Nenhuma mensagem ainda</p>
          </div>
        ) : (
          grouped.map((item,i)=>(
            item.type==='sep'
              ? <DateSep key={`sep-${i}`} ts={item.ts}/>
              : <Bolha key={item.msg.id||i} msg={item.msg} nomeIA={nomeIA}/>
          ))
        )}
        <div ref={bottomRef}/>
      </div>

      {/* ── Composer ── */}
      <Composer telefone={tel} api={api} onEnviou={()=>carregar(0,true)}
        modoManual={modoManual} nomeIA={nomeIA}/>
    </div>
  )
}

// ── Painel de contexto direito ────────────────────────────────────────────────
function PainelContexto({ conv, api }) {
  const [aba,      setAba]    = useState('perfil')
  const [perfil,   setPerfil] = useState(null)
  const [pedidos,  setPedidos]= useState([])
  const [loadPed,  setLoadPed]= useState(false)
  const [catBusca, setCatBusca]=useState('')
  const [catProds, setCatProds]=useState([])
  const [catLoad,  setCatLoad]= useState(false)
  const [pedAberto,setPedAberto]=useState({})

  useEffect(() => {
    if (!conv?.telefone) return
    let m = true
    setPerfil(null); setPedidos([])
    fetch(`${api}/api/contatos/${conv.telefone}`)
      .then(r=>r.ok?r.json():null).then(d=>{ if(m&&d) setPerfil(d) }).catch(()=>{})
    setLoadPed(true)
    fetch(`${api}/api/contatos/${conv.telefone}/pedidos`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(m){ const l=Array.isArray(d)?d:d?.pedidos||[]; setPedidos(l) } })
      .catch(()=>{}).finally(()=>{ if(m) setLoadPed(false) })
    return ()=>{ m=false }
  }, [conv?.telefone, api])

  const buscarCat = async () => {
    if (!catBusca.trim()) return
    setCatLoad(true); setCatProds([])
    try {
      const r = await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(catBusca)}`)
      if (r.ok) { const d=await r.json(); setCatProds(d.produtos||[]) }
    } catch {}
    setCatLoad(false)
  }

  const enviarProd = async prod => {
    if (!conv?.telefone) return
    const n = parseFloat(prod.preco||prod.precoVenda||0)
    const msg = `*${prod.nome||prod.descricao}*\n💳 Cartão: ${fmtR(n)} | 💰 PIX: ${fmtR(n*.9)}\n${prod.disponivel!==false?'✅ Disponível':'⚠️ Indisponível'}`
    try { await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:conv.telefone,mensagem:msg})}) } catch {}
  }

  if (!conv) return (
    <div className="w-[280px] flex-shrink-0" style={{background:'var(--color-background-primary)', borderLeft:'1px solid var(--color-border-tertiary)'}}/>
  )

  const tabColor = (id) => aba===id ? '#4f6ef7' : 'var(--color-text-tertiary)'
  const tabBorder = (id) => aba===id ? '#4f6ef7' : 'transparent'

  return (
    <div className="w-[280px] flex-shrink-0 flex flex-col overflow-hidden"
      style={{background:'var(--color-background-primary)', borderLeft:'1px solid var(--color-border-tertiary)'}}>

      {/* ── Header do painel ── */}
      <div className="flex-shrink-0 px-4 pt-4" style={{borderBottom:'1px solid var(--color-border-tertiary)'}}>
        <div className="flex items-center gap-2.5 mb-3">
          <Av nome={conv.nome||conv.telefone} foto={conv.foto_url||conv.fotoUrl} size={36}/>
          <div className="min-w-0">
            <p className="text-[13px] font-bold leading-none mb-0.5 truncate" style={{color:'var(--color-text-primary)'}}>
              {conv.nome||conv.telefone}
            </p>
            <p className="text-[10px]" style={{color:'var(--color-text-tertiary)'}}>{conv.telefone}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex" style={{marginBottom:-1}}>
          {[['perfil','Perfil'],['pedidos','Pedidos'],['catalogo','Catálogo']].map(([id,label])=>(
            <button key={id} onClick={()=>setAba(id)}
              className="flex-1 py-2 text-[11px] font-semibold transition-all text-center"
              style={{color:tabColor(id), borderBottom:`2px solid ${tabBorder(id)}`, background:'transparent', border:'none', cursor:'pointer', borderBottomWidth:2, borderBottomStyle:'solid', borderBottomColor:tabBorder(id)}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Aba: Perfil ── */}
      {aba==='perfil' && (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

          {/* Dados */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1"
              style={{color:'var(--color-text-tertiary)'}}>
              <User size={10}/>Dados do cliente
            </p>
            {[
              ['Nome',          perfil?.nome || conv.nome || '—'],
              ['Telefone',      conv.telefone],
              ['Cidade',        perfil?.cidade ? `${perfil.cidade}${perfil.uf?' · '+perfil.uf:''}` : '—'],
              ['E-mail',        perfil?.email||'—'],
              ['CPF/CNPJ',      perfil?.cpf_cnpj||'—'],
            ].map(([l,v])=>(
              <div key={l} className="flex items-center justify-between py-1.5"
                style={{borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
                <span className="text-[11px]" style={{color:'var(--color-text-tertiary)'}}>{l}</span>
                <span className="text-[11px] font-medium text-right truncate ml-2" style={{color:'var(--color-text-primary)',maxWidth:140}}>{v||'—'}</span>
              </div>
            ))}
          </div>

          {/* Pedido recente */}
          {pedidos.length > 0 && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1"
                style={{color:'var(--color-text-tertiary)'}}>
                <Package size={10}/>Pedido recente
              </p>
              {(() => {
                const p = pedidos[0]
                const stColor = {Atendido:'#065f46',Faturado:'#1e40af',Cancelado:'#991b1b','Em andamento':'#1e40af',Entregue:'#065f46','Não entregue':'#991b1b'}
                const stBg    = {Atendido:'#d1fae5',Faturado:'#dbeafe',Cancelado:'#fee2e2','Em andamento':'#dbeafe',Entregue:'#d1fae5','Não entregue':'#fee2e2'}
                const cor = stColor[p.situacao]||'#374151'
                const bg  = stBg[p.situacao]||'#f3f4f6'
                return (
                  <div className="rounded-xl overflow-hidden" style={{border:'1px solid var(--color-border-tertiary)'}}>
                    <div className="flex items-center justify-between px-3 py-2"
                      style={{background:'var(--color-background-secondary)', borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
                      <span className="text-[12px] font-bold flex items-center gap-1" style={{color:'var(--color-text-primary)'}}>
                        <Package size={12} style={{color:'#1d4ed8'}}/> #{p.numero||p.id}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{background:bg, color:cor}}>{p.situacao||'—'}</span>
                    </div>
                    {p.rastreio && p.rastreio!=='—' && (
                      <div className="px-3 py-1.5 flex items-center gap-2"
                        style={{background:'#eff6ff', borderBottom:'0.5px solid #bfdbfe'}}>
                        <Truck size={11} style={{color:'#1d4ed8'}}/>
                        <span className="text-[10px] font-mono font-semibold" style={{color:'#1e40af'}}>{p.rastreio}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-[11px]" style={{color:'var(--color-text-tertiary)'}}>{p.data||'—'}</span>
                      <span className="text-[12px] font-bold" style={{color:'var(--color-text-primary)'}}>{fmtR(p.total||p.valor)}</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Ações rápidas */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1"
              style={{color:'var(--color-text-tertiary)'}}>
              <Zap size={10}/>Ações rápidas
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label:'Abrir ocorrência', ic:AlertTriangle },
                { label:'Enviar catálogo',  ic:ShoppingCart  },
                { label:'Ver rastreio',     ic:Truck         },
                { label:'Enviar CSAT',      ic:Star          },
              ].map(({label,ic:Ic})=>(
                <button key={label}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[10px] font-semibold transition-colors text-left"
                  style={{background:'var(--color-background-secondary)', border:'1px solid var(--color-border-tertiary)', color:'var(--color-text-secondary)', cursor:'pointer'}}>
                  <Ic size={12} style={{flexShrink:0}}/>{label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Aba: Pedidos ── */}
      {aba==='pedidos' && (
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1"
            style={{color:'var(--color-text-tertiary)'}}>
            <History size={10}/>Histórico de pedidos
          </p>
          {loadPed ? (
            <div className="flex justify-center py-8">
              <RefreshCw size={14} className="animate-spin" style={{color:'var(--color-text-tertiary)'}}/>
            </div>
          ) : pedidos.length===0 ? (
            <p className="text-xs text-center py-8" style={{color:'var(--color-text-tertiary)'}}>Nenhum pedido encontrado</p>
          ) : (
            <div className="space-y-2">
              {pedidos.map((p,i)=>{
                const stColor = {Atendido:'#065f46',Faturado:'#1e40af',Cancelado:'#991b1b','Em andamento':'#1e40af',Entregue:'#065f46','Não entregue':'#991b1b'}
                const stBg    = {Atendido:'#d1fae5',Faturado:'#dbeafe',Cancelado:'#fee2e2','Em andamento':'#dbeafe',Entregue:'#d1fae5','Não entregue':'#fee2e2'}
                const cor = stColor[p.situacao]||'#374151'
                const bg  = stBg[p.situacao]||'#f3f4f6'
                const open = pedAberto[i]
                const itens = p.itens||[]
                return (
                  <div key={i} className="rounded-xl overflow-hidden"
                    style={{border:'1px solid var(--color-border-tertiary)'}}>
                    <div className="flex items-center justify-between px-3 py-2 cursor-pointer"
                      style={{background:'var(--color-background-secondary)'}}
                      onClick={()=>setPedAberto(v=>({...v,[i]:!v[i]}))}>
                      <div>
                        <span className="text-[11px] font-bold" style={{color:'var(--color-text-primary)'}}>#{p.numero||p.id}</span>
                        <span className="text-[10px] ml-2" style={{color:'var(--color-text-tertiary)'}}>{p.data||'—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{background:bg, color:cor}}>{p.situacao||'—'}</span>
                        {open ? <ChevronUp size={11} style={{color:'var(--color-text-tertiary)'}}/> : <ChevronDown size={11} style={{color:'var(--color-text-tertiary)'}}/>}
                      </div>
                    </div>
                    {open && (
                      <div className="px-3 py-2" style={{borderTop:'0.5px solid var(--color-border-tertiary)'}}>
                        {p.rastreio && p.rastreio!=='—' && (
                          <div className="flex items-center gap-1.5 mb-2 text-[10px] font-semibold" style={{color:'#1e40af'}}>
                            <Truck size={10}/>{p.rastreio}
                          </div>
                        )}
                        {itens.map((it,j)=>(
                          <div key={j} className="flex justify-between text-[10px] py-0.5" style={{color:'var(--color-text-secondary)'}}>
                            <span className="truncate flex-1">{it.nome||it.descricao}</span>
                            <span className="ml-2 flex-shrink-0">{it.quantidade}x {fmtR(it.valor)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-[11px] font-bold mt-1.5 pt-1.5"
                          style={{borderTop:'0.5px solid var(--color-border-tertiary)', color:'var(--color-text-primary)'}}>
                          <span>Total</span><span>{fmtR(p.total||p.valor)}</span>
                        </div>
                        <button onClick={async ()=>{
                          const rastr=p.rastreio&&p.rastreio!=='—'?`\n📦 Rastreio: ${p.rastreio}`:''
                          const msg=`📋 *Pedido #${p.numero||p.id}*\nData: ${p.data||'—'}\nStatus: ${p.situacao||p.status||'—'}${rastr}\nTotal: ${fmtR(p.total||p.valor)}`
                          if(conv?.telefone){
                            try{await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:conv.telefone,mensagem:msg})})}catch{}
                          }
                        }}
                          className="w-full mt-2 py-1.5 rounded-lg text-[10px] font-bold"
                          style={{background:'#4f6ef7', color:'#fff', border:'none', cursor:'pointer'}}>
                          Enviar ao cliente
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Aba: Catálogo ── */}
      {aba==='catalogo' && (
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1"
            style={{color:'var(--color-text-tertiary)'}}>
            <ShoppingCart size={10}/>Enviar produto
          </p>
          <div className="flex gap-1.5 mb-3">
            <div className="flex-1 flex items-center gap-1.5 rounded-lg overflow-hidden px-2"
              style={{background:'var(--color-background-secondary)', border:'1px solid var(--color-border-tertiary)', height:32}}>
              <Search size={12} style={{color:'var(--color-text-tertiary)', flexShrink:0}}/>
              <input value={catBusca} onChange={e=>setCatBusca(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&buscarCat()}
                placeholder="Buscar produto..." className="flex-1 text-[11px] outline-none bg-transparent"
                style={{color:'var(--color-text-primary)'}}/>
            </div>
            <button onClick={buscarCat} className="px-2.5 rounded-lg text-[11px] font-bold"
              style={{background:'#4f6ef7', color:'#fff', border:'none', cursor:'pointer', height:32}}>
              {catLoad ? <RefreshCw size={11} className="animate-spin"/> : 'Buscar'}
            </button>
          </div>
          <div className="space-y-2">
            {catProds.map((p,i)=>(
              <div key={i} className="rounded-xl overflow-hidden"
                style={{border:'1px solid var(--color-border-tertiary)'}}>
                <div className="px-3 py-2" style={{background:'var(--color-background-secondary)'}}>
                  <p className="text-[11px] font-semibold" style={{color:'var(--color-text-primary)'}}>{p.nome||p.descricao}</p>
                  <p className="text-[11px] font-bold" style={{color:'#059669'}}>{fmtR(p.preco||p.precoVenda)}</p>
                  <p className="text-[10px]" style={{color:p.disponivel!==false?'#059669':'#dc2626'}}>
                    {p.disponivel!==false?'✓ Disponível':'✗ Indisponível'}
                  </p>
                </div>
                <button onClick={()=>enviarProd(p)}
                  className="w-full py-1.5 text-[11px] font-bold"
                  style={{background:'#4f6ef7', color:'#fff', border:'none', cursor:'pointer'}}>
                  Enviar ao cliente
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pipeline de status (lista) ────────────────────────────────────────────────
function PipelineList({ statusSel, setStatusSel, contadores }) {
  const STATUS_ORDER = ['pendente','em_andamento','resolvido','encerrado']
  const LABELS = { pendente:'Pendente', em_andamento:'Andamento', resolvido:'Resolvido', encerrado:'Encerrado' }
  return (
    <div className="flex gap-1 p-1 rounded-xl"
      style={{background:'var(--color-background-secondary)', border:'1px solid var(--color-border-tertiary)'}}>
      {STATUS_ORDER.map(key=>{
        const s = STATUS_CFG[key]||STATUS_CFG.pendente
        const on = statusSel===key
        const cnt = contadores[key]||0
        return (
          <button key={key} onClick={()=>setStatusSel(key)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={on
              ? {background:s.bg, color:s.color, border:'none', cursor:'pointer'}
              : {background:'transparent', color:'var(--color-text-tertiary)', border:'none', cursor:'pointer'}}>
            {LABELS[key]}
            {cnt > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={{background: on ? 'rgba(0,0,0,0.12)' : 'var(--color-background-tertiary)', color: on ? s.color : 'var(--color-text-tertiary)'}}>
                {cnt}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PageConversas({ api: apiProp }) {
  const api = apiProp || BASE

  const [convs,      setConvs]      = useState([])
  const [selTel,     setSelTel]     = useState(null)
  const [statusSel,  setStatusSel]  = useState(()=>sessionStorage.getItem('bia_conv_status')||'pendente')
  const [statusMap,  setStatusMap]  = useState({})
  const [modoMap,    setModoMap]    = useState({})
  const [busca,      setBusca]      = useState('')
  const [loading,    setLoading]    = useState(true)
  const [nomeIA,     setNomeIA]     = useState('Molise')
  const pollingRef   = useRef(null)

  useEffect(()=>{ sessionStorage.setItem('bia_conv_status',statusSel) },[statusSel])

  // Lê nome do agente da config
  useEffect(()=>{
    fetch(`${api}/api/ia/config`).then(r=>r.ok?r.json():null).then(d=>{
      if (d?.persona) {
        const match = (d.persona||'').match(/[Vv]oc[eê] [eé] (\w+)/)
        if (match?.[1]) setNomeIA(match[1])
      }
      if (d?.nome_ia) setNomeIA(d.nome_ia)
    }).catch(()=>{})
  }, [api])

  const getStatus  = tel => statusMap[tel] || 'pendente'
  const getModo    = tel => modoMap[tel]   || false

  const carregar = useCallback(async (sil=false)=>{
    if (!sil) setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/conversas?aba=todas`)
      if (r.ok) {
        const d = await r.json()
        const novas = d.conversas||[]
        setConvs(prev=>{
          const map = new Map(prev.map(c=>[c.telefone,c]))
          return novas.map(c=>({...map.get(c.telefone)||{},...c}))
        })
        // Atualiza statusMap e modoMap
        setStatusMap(prev=>{
          const next={...prev}
          novas.forEach(c=>{ if(c.status_atendimento) next[c.telefone]=c.status_atendimento })
          return next
        })
        setModoMap(prev=>{
          const next={...prev}
          novas.forEach(c=>{ if(c.modo_manual!==undefined) next[c.telefone]=c.modo_manual })
          return next
        })
      }
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(()=>{
    carregar()
    pollingRef.current = setInterval(()=>{ if(document.visibilityState!=='hidden') carregar(true) }, 6000)
    return ()=>clearInterval(pollingRef.current)
  }, [carregar])

  const updateConvStatus = useCallback((tel, st)=>{
    setStatusMap(prev=>({...prev,[tel]:st}))
    fetch(`${api}/api/dashboard/status/${tel}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:st})}).catch(()=>{})
    fetch(`${api}/api/contatos/${tel}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:st})}).catch(()=>{})
  }, [api])

  const toggleModo = useCallback((tel)=>{
    const novoModo = !getModo(tel)
    setModoMap(prev=>({...prev,[tel]:novoModo}))
    fetch(`${api}/api/dashboard/manual/${tel}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ativo:novoModo})}).catch(()=>{})
  }, [api, modoMap])

  // Filtra conversas pela aba de status + busca
  const filtradas = useMemo(()=>{
    return convs.filter(c=>{
      const st = getStatus(c.telefone)
      const matchSt = statusSel==='todos' || st===statusSel
      if (!matchSt) return false
      if (!busca) return true
      const b = busca.toLowerCase()
      return (c.nome||'').toLowerCase().includes(b)
        || (c.telefone||'').includes(busca)
        || (c.ultima_mensagem||c.ultima_msg||'').toLowerCase().includes(b)
    })
  }, [convs, statusSel, busca, statusMap])

  // Contadores por status
  const contadores = useMemo(()=>{
    const cnt = {pendente:0,em_andamento:0,resolvido:0,encerrado:0}
    convs.forEach(c=>{ const st=getStatus(c.telefone); if(cnt[st]!==undefined) cnt[st]++ })
    return cnt
  }, [convs, statusMap])

  const convSel = convs.find(c=>c.telefone===selTel)||null

  return (
    <div className="flex h-full overflow-hidden" style={{background:'var(--color-background-secondary)'}}>

      {/* ── LISTA DE CONVERSAS ── */}
      <div className="w-[300px] flex-shrink-0 flex flex-col overflow-hidden"
        style={{background:'var(--color-background-primary)', borderRight:'1px solid var(--color-border-tertiary)'}}>

        {/* Header lista */}
        <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{borderBottom:'1px solid var(--color-border-tertiary)'}}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold" style={{color:'var(--color-text-primary)'}}>Conversas</h2>
            <div className="flex items-center gap-1.5">
              {loading && <RefreshCw size={12} className="animate-spin" style={{color:'var(--color-text-tertiary)'}}/>}
              <button onClick={()=>carregar()} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{background:'var(--color-background-secondary)', border:'1px solid var(--color-border-tertiary)', cursor:'pointer', color:'var(--color-text-tertiary)'}}>
                <RefreshCw size={13}/>
              </button>
            </div>
          </div>

          {/* Pipeline de status */}
          <div className="mb-3">
            <PipelineList statusSel={statusSel} setStatusSel={setStatusSel} contadores={contadores}/>
          </div>

          {/* Busca */}
          <div className="flex items-center gap-2 rounded-xl px-3 h-[34px]"
            style={{background:'var(--color-background-secondary)', border:'1px solid var(--color-border-tertiary)'}}>
            <Search size={13} style={{color:'var(--color-text-tertiary)', flexShrink:0}}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)}
              placeholder="Buscar..." className="flex-1 text-xs outline-none bg-transparent"
              style={{color:'var(--color-text-primary)'}}/>
            {busca && <button onClick={()=>setBusca('')} style={{color:'var(--color-text-tertiary)', background:'none', border:'none', cursor:'pointer'}}><X size={12}/></button>}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {filtradas.length===0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <MessageSquare size={20} style={{color:'var(--color-text-tertiary)',opacity:.3}}/>
              <p className="text-xs" style={{color:'var(--color-text-tertiary)'}}>
                {loading ? 'Carregando...' : 'Nenhuma conversa'}
              </p>
            </div>
          ) : filtradas.map(c=>(
            <ConvCard key={c.telefone} conv={c} selecionado={selTel===c.telefone}
              statusAtend={getStatus(c.telefone)} nomeIA={nomeIA}
              onClick={()=>setSelTel(c.telefone)}/>
          ))}
        </div>
      </div>

      {/* ── ÁREA DO CHAT ── */}
      <ChatArea
        conv={convSel}
        api={api}
        statusAtend={convSel ? getStatus(convSel.telefone) : 'pendente'}
        onStatusChange={st=>convSel && updateConvStatus(convSel.telefone, st)}
        modoManual={convSel ? getModo(convSel.telefone) : false}
        onToggleModo={()=>convSel && toggleModo(convSel.telefone)}
        nomeIA={nomeIA}
      />

      {/* ── PAINEL CONTEXTUAL ── */}
      <PainelContexto conv={convSel} api={api}/>
    </div>
  )
}
