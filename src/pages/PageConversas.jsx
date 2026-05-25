// PageConversas.jsx — Bia v6 · Enterprise CRM Chat
// Layout: narrow sidebar + list + chat + context panel (Tailwind full + lucide-react)

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import {
  Send, Smile, Image, Video, Mic, Search, RefreshCw,
  User, Bot, Zap, X, Lock, MessageSquare, Package,
  ShoppingCart, Tag, Check, Truck, AlertTriangle,
  ChevronDown, ChevronUp, Star, FileText, Phone, Mail,
  MapPin, Paperclip, Sparkles, CheckCircle, Circle,
  XCircle, History, RefreshCcw, RotateCcw, Plus,
  ChevronRight, MoreHorizontal, Home, Settings
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Constantes ────────────────────────────────────────────────────────────────
const REACOES = ['👍','❤️','😂','😮','😢','🙏']
const EMOJIS  = ['😊','👍','🙏','❤️','✅','📦','💰','🚀','😅','🎉','💬','⏳']

// ── Status do atendimento ─────────────────────────────────────────────────────
const STATUS_CFG = {
  pendente:     { label:'Pendente',     tw:'text-amber-400',   bg:'bg-amber-400/10',   border:'border-amber-400/30',   dot:'bg-amber-400'   },
  em_andamento: { label:'Em andamento', tw:'text-blue-400',    bg:'bg-blue-400/10',    border:'border-blue-400/30',    dot:'bg-blue-400'    },
  resolvido:    { label:'Resolvido',    tw:'text-emerald-400', bg:'bg-emerald-400/10', border:'border-emerald-400/30', dot:'bg-emerald-400' },
  aguardando:   { label:'Aguardando',  tw:'text-purple-400',  bg:'bg-purple-400/10',  border:'border-purple-400/30',  dot:'bg-purple-400'  },
  encerrado:    { label:'Encerrado',   tw:'text-[var(--label-4)]', bg:'bg-[var(--bg-3)]', border:'border-[var(--sep)]', dot:'bg-[var(--label-4)]' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtR   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmtTel = t => { const n=(t||'').replace(/\D/g,'').replace(/^55/,''); return n.length===11?`(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`:t||'' }
const fmtRel = ts => { if(!ts) return ''; const m=Math.floor((Date.now()-new Date(ts))/60000); if(m<1)return 'agora'; if(m<60)return `${m}min`; if(m<1440)return `${Math.floor(m/60)}h`; return `${Math.floor(m/1440)}d` }
const fmtHora = ts => ts ? new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : ''
const initials = s => (s||'?').trim().split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
const mapSit = s => { const id=typeof s==='object'?s?.id||s?.valor:s; return {6:'Aberto',9:'Atendido',12:'Cancelado',14:'Faturado',15:'Verificado',24:'NF emitida',27:'Em andamento',30:'Entregue',33:'Não entregue'}[id]||String(id||'—') }

// ── Avatar ────────────────────────────────────────────────────────────────────
const AV_PAL = [['#1e3a5f','#60a5fa'],['#2d1b69','#a78bfa'],['#064e3b','#34d399'],['#78350f','#fbbf24'],['#500724','#f472b6'],['#134e4a','#2dd4bf']]
const avCol = s => AV_PAL[(s||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%AV_PAL.length]
function Av({ nome, foto, size=32 }) {
  const [bg,fg] = avCol(nome)
  const st = { width:size, height:size, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*.38, fontWeight:700, background:bg, color:fg, overflow:'hidden' }
  return foto
    ? <img src={foto} alt={nome||''} style={{...st, objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
    : <div style={st}>{initials(nome)}</div>
}

// ── ConvCard ──────────────────────────────────────────────────────────────────
const ConvCard = memo(function ConvCard({ conv, sel, statusAtend, nomeIA, onClick }) {
  const S   = STATUS_CFG[statusAtend] || STATUS_CFG.pendente
  const man = conv.agente === 'humano' || conv.modo_manual
  const pre = conv.ultima_mensagem || conv.ultima_msg || '—'
  return (
    <div onClick={onClick}
      className={`flex gap-2.5 px-3 py-2.5 cursor-pointer border-l-2 transition-all border-b border-b-[var(--sep)] ${
        sel ? 'bg-[var(--accent-dim)] border-l-[var(--accent)]' : 'border-l-transparent hover:bg-[var(--bg-3)]'
      }`}>
      <Av nome={conv.nome||conv.telefone} foto={conv.foto_url||conv.fotoUrl} size={34}/>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-[12px] font-semibold truncate max-w-[145px] ${sel?'text-[var(--accent)]':'text-[var(--label)]'}`}>
            {conv.nome||fmtTel(conv.telefone)}
          </span>
          <span className="text-[9px] text-[var(--label-4)] flex-shrink-0">{fmtRel(conv.ultima_atividade||conv.hora)}</span>
        </div>
        <p className="text-[10.5px] text-[var(--label-3)] truncate max-w-[190px] mb-1.5">{pre}</p>
        <div className="flex gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${S.tw} ${S.bg} ${S.border}`}>
            <span className={`w-1 h-1 rounded-full ${S.dot}`}/>
            {S.label}
          </span>
          <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
            man ? 'text-blue-400 bg-blue-400/10 border-blue-400/25' : 'text-violet-400 bg-violet-400/10 border-violet-400/25'
          }`}>
            {man ? <User size={8}/> : <Bot size={8}/>}
            {man ? 'Atendente' : nomeIA}
          </span>
        </div>
      </div>
    </div>
  )
})

// ── Bolha ─────────────────────────────────────────────────────────────────────
const Bolha = memo(function Bolha({ msg, nomeIA }) {
  const [reacao, setReacao] = useState(null)
  const [picker, setPicker] = useState(false)
  const [hover,  setHover]  = useState(false)

  const entrada   = msg.direcao === 'entrada'
  const isGatilho = msg.modo === 'transacional'
  const isManual  = msg.modo === 'manual'
  const texto     = (msg.conteudo||'').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g,'').trim()
  if (!texto) return null

  const label = entrada ? null : isGatilho ? 'Gatilho' : isManual ? 'Atendente' : nomeIA
  const labelCls = isGatilho ? 'text-violet-400' : isManual ? 'text-blue-400' : 'text-emerald-400'
  const bubbleCls = entrada
    ? 'bg-[var(--bg-3)] border border-[var(--sep)] rounded-tl-sm'
    : isGatilho ? 'bg-violet-500/10 border border-violet-500/20 rounded-tr-sm'
    : isManual  ? 'bg-blue-500/10 border border-blue-500/20 rounded-tr-sm'
    : 'bg-emerald-500/10 border border-emerald-500/20 rounded-tr-sm'

  return (
    <div className={`flex flex-col mb-2.5 ${entrada?'items-start':'items-end'}`}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>{setHover(false);setPicker(false)}}>
      {label && (
        <span className={`text-[9px] font-semibold mb-0.5 px-1 flex items-center gap-1 ${labelCls}`}>
          {isManual?<User size={8}/>:isGatilho?<Zap size={8}/>:<Bot size={8}/>}{label}
        </span>
      )}
      <div className={`flex items-end gap-1.5 ${entrada?'flex-row':'flex-row-reverse'} relative`}>
        {entrada && (
          <div className="w-5 h-5 rounded-full bg-[var(--bg-4)] flex items-center justify-center text-[8px] text-[var(--label-3)] font-bold flex-shrink-0">
            {initials(msg.nome||'')||'C'}
          </div>
        )}
        <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${bubbleCls} relative`}>
          {msg.midia_tipo==='image' && msg.midia_url && (
            <img src={msg.midia_url} alt="" className="w-full rounded-lg mb-1.5 max-h-40 object-cover" onError={e=>e.target.style.display='none'}/>
          )}
          <p className="text-[12.5px] leading-relaxed text-[var(--label)] whitespace-pre-wrap break-words">{texto}</p>
          <div className={`flex items-center gap-1 mt-0.5 ${entrada?'justify-start':'justify-end'}`}>
            <span className="text-[9px] text-[var(--label-4)]">{fmtHora(msg.criado_em)}</span>
            {!entrada && <span className="text-[9px] text-blue-400">✓✓</span>}
          </div>
          {reacao && (
            <button onClick={()=>setReacao(null)}
              className="absolute -bottom-2.5 right-2 text-sm bg-[var(--bg-2)] border border-[var(--sep)] rounded-full px-1.5 py-0.5 leading-none">
              {reacao}
            </button>
          )}
        </div>
        {hover && (
          <div className="relative flex-shrink-0">
            <button onClick={()=>setPicker(v=>!v)}
              className="w-5 h-5 rounded-full border border-[var(--sep)] bg-[var(--bg-3)] flex items-center justify-center text-[10px] cursor-pointer">
              <Smile size={10} className="text-[var(--label-4)]"/>
            </button>
            {picker && (
              <div className={`absolute bottom-6 ${entrada?'left-0':'right-0'} flex gap-1 bg-[var(--bg-2)] border border-[var(--sep)] rounded-2xl px-2 py-1.5 shadow-xl z-50 whitespace-nowrap`}>
                {REACOES.map(r=>(
                  <button key={r} onClick={()=>{setReacao(r);setPicker(false)}} className="text-base hover:scale-125 transition-transform cursor-pointer">{r}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

// ── DateSep ───────────────────────────────────────────────────────────────────
function DateSep({ ts }) {
  const d=new Date(ts), hoje=new Date(); hoje.setHours(0,0,0,0)
  const dia=new Date(d); dia.setHours(0,0,0,0)
  const diff=Math.round((hoje-dia)/86400000)
  const label=diff===0?'Hoje':diff===1?'Ontem':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})
  return (
    <div className="flex items-center gap-2 my-4">
      <div className="flex-1 h-px bg-[var(--sep)]"/>
      <span className="text-[9px] font-semibold text-[var(--label-4)] bg-[var(--bg-3)] px-2.5 py-0.5 rounded-full border border-[var(--sep)] whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-[var(--sep)]"/>
    </div>
  )
}

// ── Status Dropdown ───────────────────────────────────────────────────────────
function StatusDropdown({ tel, api, statusAtend, modoManual, onStatusChange, onToggleModo, onReset, nomeIA }) {
  const [open, setOpen] = useState(false)
  const S = STATUS_CFG[statusAtend] || STATUS_CFG.pendente
  const ref = useRef(null)

  useEffect(()=>{
    const fn = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return ()=>document.removeEventListener('mousedown', fn)
  }, [])

  const pick = async (st) => {
    setOpen(false)
    if (st==='assumir') { onToggleModo(); return }
    if (st==='resetar') { onReset(); return }
    onStatusChange(st)
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={()=>setOpen(v=>!v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${S.tw} ${S.bg} ${S.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${S.dot}`}/>
        {S.label}
        <ChevronDown size={11} className={open?'rotate-180':''} style={{transition:'transform .15s'}}/>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-52 bg-[var(--bg-2)] border border-[var(--sep)] rounded-xl shadow-2xl z-50 overflow-hidden py-1">
          {Object.entries(STATUS_CFG).map(([key,s])=>(
            <button key={key} onClick={()=>pick(key)}
              className={`w-full flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-left transition-colors hover:bg-[var(--bg-3)] ${statusAtend===key?'opacity-40 cursor-default':'cursor-pointer'}`}>
              <span className={`w-2 h-2 rounded-full ${s.dot}`}/>
              <span className={s.tw}>{s.label}</span>
              {statusAtend===key && <Check size={10} className="ml-auto text-[var(--label-4)]"/>}
            </button>
          ))}
          <div className="my-1 h-px bg-[var(--sep)] mx-3"/>
          <button onClick={()=>pick('assumir')}
            className="w-full flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-left cursor-pointer transition-colors hover:bg-[var(--bg-3)]">
            <User size={13} className={modoManual?'text-blue-400':'text-[var(--label-3)]'}/>
            <span className={modoManual?'text-blue-400':'text-[var(--label-3)]'}>
              {modoManual ? `Devolver à ${nomeIA}` : 'Assumir conversa'}
            </span>
          </button>
          <button onClick={()=>pick('resetar')}
            className="w-full flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-left cursor-pointer transition-colors hover:bg-red-500/10">
            <RotateCcw size={13} className="text-red-400"/>
            <span className="text-red-400">Resetar sessão</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Catálogo overlay ──────────────────────────────────────────────────────────
function CatOverlay({ telefone, api, onClose }) {
  const [busca,    setBusca]    = useState('')
  const [prods,    setProds]    = useState([])
  const [loading,  setLoading]  = useState(false)
  const [enviando, setEnviando] = useState(null)
  const ref = useRef(null)

  useEffect(()=>{ ref.current?.focus() }, [])

  const buscar = async () => {
    if (!busca.trim()) return
    setLoading(true); setProds([])
    try {
      const r = await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(busca)}`)
      if (r.ok) { const d=await r.json(); setProds(d.produtos||[]) }
    } catch {}
    setLoading(false)
  }

  const enviar = async (p) => {
    setEnviando(p.id||p.nome)
    const n = parseFloat(p.preco||p.precoVenda||0)
    const msg = `*${p.nome||p.descricao}*\n💳 Cartão: ${fmtR(n)} | 💰 PIX: ${fmtR(n*.9)}\n${p.disponivel!==false?'✅ Disponível em estoque':'⚠️ Indisponível'}`
    try { await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone,mensagem:msg})}) } catch {}
    setEnviando(null); onClose()
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-[var(--bg-2)] border border-[var(--sep)] rounded-xl shadow-2xl z-50 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--sep)]">
        <ShoppingCart size={13} className="text-emerald-400 flex-shrink-0"/>
        <input ref={ref} value={busca} onChange={e=>setBusca(e.target.value)} onKeyDown={e=>e.key==='Enter'&&buscar()}
          placeholder="Buscar produto para enviar ao cliente..."
          className="flex-1 bg-transparent border-none outline-none text-[12.5px] text-[var(--label)] placeholder:text-[var(--label-4)]"/>
        <button onClick={buscar}
          className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/25 transition-colors flex-shrink-0">
          {loading ? <RefreshCw size={11} className="animate-spin"/> : 'Buscar'}
        </button>
        <button onClick={onClose} className="text-[var(--label-4)] hover:text-[var(--label-3)] transition-colors flex-shrink-0"><X size={14}/></button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {prods.length===0 && busca && !loading && (
          <p className="px-4 py-3 text-[11px] text-[var(--label-4)] text-center">Nenhum produto encontrado</p>
        )}
        {prods.slice(0,10).map((p,i)=>(
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--sep)] hover:bg-[var(--bg-3)] transition-colors group">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[var(--label)] truncate">{p.nome||p.descricao}</p>
              <p className="text-[10px] font-semibold text-emerald-400">{fmtR(p.preco||p.precoVenda||0)}</p>
            </div>
            <button onClick={()=>enviar(p)} disabled={enviando===(p.id||p.nome)}
              className="px-3 py-1 rounded-lg border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold hover:bg-emerald-500/20 transition-colors flex-shrink-0 disabled:opacity-50">
              {enviando===(p.id||p.nome)?'Enviando...':'Enviar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── BarraEnvio ────────────────────────────────────────────────────────────────
function BarraEnvio({ telefone, api, modoManual, onEnviou, nomeIA }) {
  const [texto,     setTexto]    = useState('')
  const [enviando,  setEnviando] = useState(false)
  const [anotacao,  setAnotacao] = useState(false)
  const [sugestoes, setSugestoes]= useState([])
  const [loadSug,   setLoadSug]  = useState(false)
  const [emojiOpen, setEmojiOpen]= useState(false)
  const [catOpen,   setCatOpen]  = useState(false)
  const [refining,  setRefining] = useState(false)
  const inputRef = useRef(null)
  const imgRef   = useRef(null)
  const vidRef   = useRef(null)

  const buscarSugestoes = useCallback(async () => {
    if (!telefone) return
    setLoadSug(true)
    try {
      const r = await fetch(`${api}/api/sugestoes/${telefone}`)
      if (r.ok) { const d=await r.json(); setSugestoes((d.sugestoes||d||[]).slice(0,3)) }
    } catch {}
    setLoadSug(false)
  }, [api, telefone])

  useEffect(()=>{ if(telefone) buscarSugestoes() }, [telefone])

  const enviar = async (msg) => {
    const txt = (msg||texto).trim()
    if (!txt||enviando) return
    setTexto(''); setSugestoes([])
    setEnviando(true)
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ telefone, mensagem:txt, anotacao })
      })
      onEnviou?.()
    } catch {}
    setEnviando(false)
    inputRef.current?.focus()
  }

  const enviarArquivo = (file, tipo) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]
      try {
        await fetch(`${api}/api/dashboard/mensagem`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ telefone, tipo, midia_base64:base64, midia_nome:file.name })
        })
        onEnviou?.()
      } catch {}
    }
    reader.readAsDataURL(file)
  }

  const refinarIA = async () => {
    if (!texto.trim()) return
    setRefining(true)
    try {
      const r = await fetch(`${api}/api/ia/melhorar-texto`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ texto, contexto:`Atendimento WhatsApp cliente ${fmtTel(telefone)}` })
      })
      if (r.ok) { const d=await r.json(); if(d.texto) setTexto(d.texto) }
    } catch {}
    setRefining(false)
  }

  // Modo IA: barra simplificada com sugestão e botão assumir
  if (!modoManual) return (
    <div className="border-t border-[var(--sep)] bg-[var(--bg-2)] flex-shrink-0">
      {sugestoes.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--sep)] bg-amber-500/5">
          <Zap size={11} className="text-amber-400 flex-shrink-0"/>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold text-amber-400 mb-0">Sugestão da IA</p>
            <p className="text-[11.5px] text-[var(--label)] truncate">{sugestoes[0]}</p>
          </div>
          <button onClick={()=>{ /* read-only no modo IA */ }}
            className="px-3 py-1 rounded-lg border border-amber-400/30 text-amber-400 text-[10px] font-bold hover:bg-amber-400/15 transition-colors flex-shrink-0">
            Usar
          </button>
          <button onClick={()=>setSugestoes([])} className="text-[var(--label-4)]"><X size={11}/></button>
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Zap size={12} className="text-emerald-400 flex-shrink-0"/>
        <p className="text-[11px] text-[var(--label-4)] flex-1">IA ativa — assuma para responder</p>
        <button onClick={buscarSugestoes} disabled={loadSug}
          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-amber-400/30 text-amber-400 bg-amber-400/5 hover:bg-amber-400/15 transition-colors flex items-center gap-1">
          <Sparkles size={10} className={loadSug?'animate-spin':''}/> Sugerir IA
        </button>
      </div>
      <div className="flex items-center gap-1.5 px-3 pb-3">
        {[
          { label:'Catálogo', icon:ShoppingCart, onClick:()=>setCatOpen(v=>!v), green:true },
          { label:'Imagem',   icon:Image,        onClick:()=>imgRef.current?.click() },
          { label:'Vídeo',    icon:Video,        onClick:()=>vidRef.current?.click() },
        ].map(({label,icon:Ic,onClick,green})=>(
          <button key={label} onClick={onClick}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
              green ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15'
                    : 'border-[var(--sep)] text-[var(--label-3)] hover:bg-[var(--bg-3)]'
            }`}>
            <Ic size={12}/>{label}
          </button>
        ))}
        <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e=>{if(e.target.files[0])enviarArquivo(e.target.files[0],'image');e.target.value=''}}/>
        <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={e=>{if(e.target.files[0])enviarArquivo(e.target.files[0],'video');e.target.value=''}}/>
        <div className="flex-1"/>
        <textarea disabled placeholder="Assuma o atendimento para digitar"
          className="flex-shrink-0 w-64 bg-[var(--bg-3)] border border-[var(--sep)] rounded-xl px-3 py-2 text-[11px] text-[var(--label-4)] placeholder:text-[var(--label-4)] resize-none outline-none h-8 leading-none flex items-center" rows={1}/>
      </div>
    </div>
  )

  return (
    <div className="border-t border-[var(--sep)] bg-[var(--bg-2)] flex-shrink-0 relative">

      {/* Catálogo overlay */}
      {catOpen && <CatOverlay telefone={telefone} api={api} onClose={()=>setCatOpen(false)}/>}

      {/* Sugestão IA banner */}
      {sugestoes.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-500/20 bg-amber-500/5">
          <Zap size={11} className="text-amber-400 flex-shrink-0"/>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold text-amber-400">Sugestão da IA</p>
            <p className="text-[11.5px] text-[var(--label)] truncate">{sugestoes[0]}</p>
          </div>
          <button onClick={()=>{ setTexto(typeof sugestoes[0]==='string'?sugestoes[0]:sugestoes[0].texto||sugestoes[0]); setSugestoes([]); inputRef.current?.focus() }}
            className="px-3 py-1 rounded-lg border border-amber-400/30 text-amber-400 text-[10px] font-bold hover:bg-amber-400/15 transition-colors flex-shrink-0">
            Usar
          </button>
          <button onClick={()=>setSugestoes([])} className="text-[var(--label-4)] hover:text-[var(--label-3)]"><X size={11}/></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--sep)]">
        {[{id:false,label:'Resposta pública',icon:MessageSquare},{id:true,label:'Anotação interna',icon:Lock}].map(a=>{
          const on=anotacao===a.id; const Ic=a.icon
          const col=on?(a.id?'text-amber-400 border-amber-400':'text-[var(--accent)] border-[var(--accent)]'):'text-[var(--label-4)] border-transparent'
          return (
            <button key={String(a.id)} onClick={()=>setAnotacao(a.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold border-b-2 transition-colors ${col}`}>
              <Ic size={12}/>{a.label}
            </button>
          )
        })}
      </div>

      {/* Emoji picker */}
      {emojiOpen && (
        <div className="px-3 py-2 border-b border-[var(--sep)] flex gap-2 flex-wrap">
          {EMOJIS.map(e=>(
            <button key={e} onClick={()=>{setTexto(t=>t+e);setEmojiOpen(false);inputRef.current?.focus()}}
              className="text-lg hover:scale-125 transition-transform cursor-pointer">{e}</button>
          ))}
        </div>
      )}

      {/* Nota badge */}
      {anotacao && (
        <div className="mx-3 mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-lg text-[10px] text-amber-400 font-semibold">
          <Lock size={9}/>Anotação interna — não enviada ao cliente
        </div>
      )}

      {/* Textarea */}
      <div className="px-3 pt-1.5 pb-1">
        <textarea ref={inputRef} value={texto} onChange={e=>setTexto(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar()}}}
          rows={2} placeholder={anotacao?'Anotação interna...':'Escrever mensagem...'}
          className="w-full bg-transparent border-none outline-none text-[13px] text-[var(--label)] placeholder:text-[var(--label-4)] resize-none leading-relaxed font-sans"
          style={{maxHeight:120, overflow:'auto'}}/>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 pb-3">
        {/* Catálogo */}
        <button onClick={()=>{setCatOpen(v=>!v);setEmojiOpen(false)}}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
            catOpen ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/15'
                    : 'border-[var(--sep)] text-[var(--label-3)] hover:bg-[var(--bg-3)]'
          }`}>
          <ShoppingCart size={12}/>Catálogo
        </button>

        {/* Imagem */}
        <label className="w-7 h-7 rounded-lg border border-[var(--sep)] flex items-center justify-center cursor-pointer text-[var(--label-3)] hover:bg-[var(--bg-3)] transition-colors" title="Enviar imagem">
          <Image size={14}/>
          <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e=>{if(e.target.files[0])enviarArquivo(e.target.files[0],'image');e.target.value=''}}/>
        </label>

        {/* Vídeo */}
        <label className="w-7 h-7 rounded-lg border border-[var(--sep)] flex items-center justify-center cursor-pointer text-[var(--label-3)] hover:bg-[var(--bg-3)] transition-colors" title="Enviar vídeo">
          <Video size={14}/>
          <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={e=>{if(e.target.files[0])enviarArquivo(e.target.files[0],'video');e.target.value=''}}/>
        </label>

        {/* Áudio */}
        <button className="w-7 h-7 rounded-lg border border-[var(--sep)] flex items-center justify-center text-[var(--label-3)] hover:bg-[var(--bg-3)] transition-colors" title="Áudio">
          <Mic size={14}/>
        </button>

        {/* Emoji */}
        <button onClick={()=>{setEmojiOpen(v=>!v);setCatOpen(false)}} title="Emoji"
          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
            emojiOpen ? 'border-amber-400/40 text-amber-400 bg-amber-400/10' : 'border-[var(--sep)] text-[var(--label-3)] hover:bg-[var(--bg-3)]'
          }`}>
          <Smile size={14}/>
        </button>

        {/* Anexo */}
        <button className="w-7 h-7 rounded-lg border border-[var(--sep)] flex items-center justify-center text-[var(--label-3)] hover:bg-[var(--bg-3)] transition-colors" title="Anexar">
          <Paperclip size={14}/>
        </button>

        {/* Molise IA */}
        <button onClick={refinarIA} disabled={!texto.trim()||refining}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-violet-500/30 text-violet-400 bg-violet-500/5 text-[10px] font-semibold hover:bg-violet-500/15 transition-colors disabled:opacity-40" title={`Refinar com ${nomeIA}`}>
          <Sparkles size={11} className={refining?'animate-spin':''}/>{refining?'Refinando...':nomeIA+' IA'}
        </button>

        <div className="flex-1"/>

        {/* Enviar */}
        <button onClick={()=>enviar()} disabled={!texto.trim()||enviando}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
            texto.trim()&&!enviando ? 'bg-[var(--accent)] text-white hover:opacity-90' : 'bg-[var(--bg-3)] text-[var(--label-4)]'
          }`}>
          <Send size={13}/>{enviando?'Enviando...':'Enviar'}
        </button>
      </div>
    </div>
  )
}

// ── PainelInfo (direita) ──────────────────────────────────────────────────────
function PainelInfo({ conv, api }) {
  const [aba,     setAba]    = useState('perfil')
  const [perfil,  setPerfil] = useState(null)
  const [pedidos, setPedidos]= useState([])
  const [loadPed, setLoadPed]= useState(false)
  const [pedAb,   setPedAb]  = useState({})
  const [catBusca,setCatBusca]=useState('')
  const [catProds,setCatProds]=useState([])
  const [catLoad, setCatLoad] = useState(false)

  useEffect(()=>{
    if (!conv?.telefone) return
    let m=true; setPerfil(null); setPedidos([])
    fetch(`${api}/api/contatos/${conv.telefone}`).then(r=>r.ok?r.json():null).then(d=>{if(m&&d)setPerfil(d)}).catch(()=>{})
    setLoadPed(true)
    fetch(`${api}/api/contatos/${conv.telefone}/pedidos`).then(r=>r.ok?r.json():null)
      .then(d=>{if(m){const l=Array.isArray(d)?d:d?.pedidos||[];setPedidos(l)}}).catch(()=>{}).finally(()=>{if(m)setLoadPed(false)})
    return ()=>{m=false}
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

  const enviarProd = async p => {
    if (!conv?.telefone) return
    const n=parseFloat(p.preco||p.precoVenda||0)
    const msg=`*${p.nome||p.descricao}*\n💳 Cartão: ${fmtR(n)} | 💰 PIX: ${fmtR(n*.9)}\n${p.disponivel!==false?'✅ Disponível':'⚠️ Indisponível'}`
    try { await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:conv.telefone,mensagem:msg})}) } catch {}
  }

  const totalGasto = useMemo(()=>{
    if (!pedidos.length) return null
    const total = pedidos.reduce((acc,p)=>acc+parseFloat(p.total||p.valor||0),0)
    return total > 0 ? fmtR(total) : null
  }, [pedidos])

  if (!conv) return <div className="w-[240px] flex-shrink-0 border-l border-[var(--sep)] bg-[var(--bg-2)]"/>

  const ABAS = [['perfil','Perfil'],['pedidos','Pedidos'],['catalogo','Catálogo']]

  // Campos do perfil
  const campoPerfil = [
    { l:'Nome',        v: perfil?.nome||conv.nome },
    { l:'Telefone',    v: fmtTel(perfil?.telefone||conv.telefone) },
    { l:'CPF/CNPJ',    v: perfil?.cpf||perfil?.cnpj },
    { l:'E-mail',      v: perfil?.email },
    { l:'Endereço',    v: [perfil?.logradouro, perfil?.numero].filter(Boolean).join(', ') || null },
    { l:'Complemento', v: perfil?.complemento },
    { l:'Bairro',      v: perfil?.bairro },
    { l:'Cidade / UF', v: [perfil?.cidade, perfil?.uf].filter(Boolean).join(' · ') || null },
    { l:'CEP',         v: perfil?.cep },
    { l:'Total gasto', v: totalGasto, accent:'text-emerald-400' },
  ].filter(c=>c.v)

  // Situação → cor
  const sitCor = (s) => {
    const m = {Aberto:'text-amber-400 bg-amber-400/10',Atendido:'text-emerald-400 bg-emerald-400/10',Verificado:'text-emerald-400 bg-emerald-400/10',Faturado:'text-blue-400 bg-blue-400/10',Cancelado:'text-red-400 bg-red-400/10',Entregue:'text-emerald-400 bg-emerald-400/10'}
    return m[s]||'text-[var(--label-4)] bg-[var(--bg-3)]'
  }

  return (
    <div className="w-[240px] flex-shrink-0 flex flex-col overflow-hidden border-l border-[var(--sep)] bg-[var(--bg-2)]">
      {/* Mini header */}
      <div className="px-3 py-3 border-b border-[var(--sep)] flex items-center gap-2.5 flex-shrink-0">
        <Av nome={conv.nome||conv.telefone} foto={conv.foto_url||conv.fotoUrl} size={32}/>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-[var(--label)] truncate">{conv.nome||fmtTel(conv.telefone)}</p>
          <p className="text-[10px] text-[var(--label-4)]">{fmtTel(conv.telefone)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--sep)] flex-shrink-0">
        {ABAS.map(([id,lbl])=>(
          <button key={id} onClick={()=>setAba(id)}
            className={`flex-1 py-2 text-[10px] font-semibold border-b-2 transition-colors ${
              aba===id ? 'text-[var(--accent)] border-[var(--accent)]' : 'text-[var(--label-4)] border-transparent hover:text-[var(--label-3)]'
            }`}>{lbl}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* PERFIL */}
        {aba==='perfil' && (
          <div className="px-3 py-3 space-y-3">
            {/* Dados do cliente */}
            <div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--label-4)] mb-2 flex items-center gap-1"><User size={8}/>Dados do cliente</p>
              <div className="space-y-0.5">
                {campoPerfil.map(({l,v,accent})=>(
                  <div key={l} className="flex justify-between gap-2 py-1 border-b border-[var(--sep)] last:border-0">
                    <span className="text-[9px] text-[var(--label-4)] whitespace-nowrap">{l}</span>
                    <span className={`text-[10px] font-medium text-right break-all leading-snug ${accent||'text-[var(--label)]'}`}>{v}</span>
                  </div>
                ))}
                {!campoPerfil.length && <p className="text-[10px] text-[var(--label-4)] text-center py-3">Carregando...</p>}
              </div>
            </div>

            {/* Pedido recente */}
            {pedidos.length > 0 && (
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--label-4)] mb-2 flex items-center gap-1"><Package size={8}/>Pedido recente</p>
                {(()=>{ const p=pedidos[0]; const sit=mapSit(p.situacao); return (
                  <div className="border border-[var(--sep)] rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-2.5 py-2 bg-[var(--bg-3)]">
                      <span className="text-[11px] font-bold text-[var(--label)]">#{p.numero||p.id}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${sitCor(sit)}`}>{sit}</span>
                    </div>
                    {p.rastreio && p.rastreio!=='—' && (
                      <div className="px-2.5 py-1.5 flex items-center gap-1 text-[9px] text-blue-400 font-medium bg-blue-500/5 border-b border-[var(--sep)]">
                        <Truck size={9}/>{p.rastreio}
                      </div>
                    )}
                    <div className="flex justify-between px-2.5 py-1.5 text-[10px]">
                      <span className="text-[var(--label-4)]">{p.data||'—'}</span>
                      <span className="font-bold text-[var(--label)]">{fmtR(p.total||p.valor)}</span>
                    </div>
                  </div>
                )})()}
              </div>
            )}

            {/* Ações rápidas */}
            <div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--label-4)] mb-2 flex items-center gap-1"><Zap size={8}/>Ações rápidas</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[{l:'Abrir ocorrência',ic:AlertTriangle},{l:'Ver catálogo',ic:ShoppingCart},{l:'Rastreio',ic:Truck},{l:'CSAT',ic:Star}].map(({l,ic:Ic})=>(
                  <button key={l} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-semibold border border-[var(--sep)] text-[var(--label-3)] hover:bg-[var(--bg-3)] transition-colors text-left">
                    <Ic size={10} className="flex-shrink-0"/>{l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PEDIDOS */}
        {aba==='pedidos' && (
          <div className="px-3 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--label-4)] flex items-center gap-1"><History size={8}/>Pedidos do cliente</p>
              {totalGasto && <span className="text-[9px] font-bold text-emerald-400">{totalGasto}</span>}
            </div>
            {loadPed ? (
              <div className="flex justify-center py-6"><RefreshCw size={14} className="animate-spin text-[var(--label-4)]"/></div>
            ) : pedidos.length===0 ? (
              <p className="text-[10px] text-[var(--label-4)] text-center py-6">Nenhum pedido encontrado</p>
            ) : pedidos.map((p,i)=>{
              const sit=mapSit(p.situacao); const open=pedAb[i]
              return (
                <div key={i} className="border border-[var(--sep)] rounded-lg overflow-hidden mb-2">
                  <div className="flex items-center justify-between px-2.5 py-2 bg-[var(--bg-3)] cursor-pointer"
                    onClick={()=>setPedAb(v=>({...v,[i]:!v[i]}))}>
                    <div>
                      <span className="text-[11px] font-bold text-[var(--label)]">#{p.numero||p.id}</span>
                      <span className="text-[9px] text-[var(--label-4)] ml-1.5">{p.data||'—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${sitCor(sit)}`}>{sit}</span>
                      {sit==='Verificado' && <span className="text-[8px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">✓ Verificado</span>}
                      {open?<ChevronUp size={10} className="text-[var(--label-4)]"/>:<ChevronDown size={10} className="text-[var(--label-4)]"/>}
                    </div>
                  </div>
                  {open && (
                    <div className="px-2.5 pb-2 pt-1.5 border-t border-[var(--sep)]">
                      {p.rastreio&&p.rastreio!=='—'&&<div className="text-[9px] text-blue-400 flex items-center gap-1 mb-1.5 font-medium"><Truck size={9}/>{p.rastreio}</div>}
                      {(p.itens||[]).map((it,j)=>(
                        <div key={j} className="flex justify-between text-[9px] py-0.5 border-b border-[var(--sep)] last:border-0">
                          <span className="text-[var(--label-3)] truncate flex-1">{it.nome||it.descricao}</span>
                          <span className="text-[var(--label-4)] ml-2 flex-shrink-0">{it.quantidade}x</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-[10px] font-bold mt-1.5 pt-1 border-t border-[var(--sep)]">
                        <span className="text-[var(--label-4)]">Total</span>
                        <span className="text-[var(--label)]">{fmtR(p.total||p.valor)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* CATÁLOGO */}
        {aba==='catalogo' && (
          <div className="px-3 py-3">
            <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--label-4)] mb-2 flex items-center gap-1"><ShoppingCart size={8}/>Enviar produto</p>
            <div className="flex gap-1.5 mb-3">
              <div className="flex-1 flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-[var(--sep)] bg-[var(--bg-3)]">
                <Search size={11} className="text-[var(--label-4)] flex-shrink-0"/>
                <input value={catBusca} onChange={e=>setCatBusca(e.target.value)} onKeyDown={e=>e.key==='Enter'&&buscarCat()}
                  placeholder="Buscar produto..." className="flex-1 bg-transparent border-none outline-none text-[11px] text-[var(--label)] placeholder:text-[var(--label-4)]"/>
              </div>
              <button onClick={buscarCat} className="px-2.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[10px] font-bold flex-shrink-0 hover:opacity-90 transition-opacity">
                {catLoad?<RefreshCw size={10} className="animate-spin"/>:'OK'}
              </button>
            </div>
            <div className="space-y-2">
              {catProds.map((p,i)=>(
                <div key={i} className="border border-[var(--sep)] rounded-lg overflow-hidden">
                  <div className="px-2.5 py-2 bg-[var(--bg-3)]">
                    <p className="text-[11px] font-medium text-[var(--label)] truncate">{p.nome||p.descricao}</p>
                    <p className="text-[10px] font-bold text-emerald-400">{fmtR(p.preco||p.precoVenda||0)}</p>
                  </div>
                  <button onClick={()=>enviarProd(p)} className="w-full py-1.5 bg-[var(--accent)] text-white text-[10px] font-bold hover:opacity-90 transition-opacity">
                    Enviar ao cliente
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── ChatArea ──────────────────────────────────────────────────────────────────
function ChatArea({ conv, api, statusAtend, onStatusChange, modoManual, onToggleModo, nomeIA }) {
  const [msgs,    setMsgs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset,  setOffset]  = useState(0)
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
        const d=await r.json(); const novas=d.mensagens||[]
        if (off===0) setMsgs(novas); else setMsgs(p=>[...novas,...p])
        setHasMore(d.hasMore||false)
        setOffset(off===0?novas.length:off+novas.length)
      }
    } catch {}
    fetching.current=false; setLoading(false)
  }, [tel, api])

  useEffect(()=>{
    if (!tel) return
    setMsgs([]); setOffset(0); setLoading(true); setHasMore(false)
    carregar(0)
    pollingRef.current = setInterval(()=>{ if(document.visibilityState!=='hidden') carregar(0,true) }, 4000)
    return ()=>clearInterval(pollingRef.current)
  }, [tel, carregar])

  useEffect(()=>{ if(msgs.length>0) bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [msgs.length])

  const resetarSessao = async () => {
    if (!confirm(`Resetar sessão de ${conv.nome||fmtTel(tel)}? O carrinho e histórico serão limpos.`)) return
    try {
      await fetch(`${api}/api/dashboard/resetar-sessao`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ telefone:tel })
      })
      carregar(0)
    } catch {}
  }

  const grouped = useMemo(()=>{
    if (!msgs.length) return []
    const out=[]; let lastDay=null
    msgs.forEach(m=>{
      const day=m.criado_em?new Date(m.criado_em).toDateString():null
      if(day&&day!==lastDay){out.push({type:'sep',ts:m.criado_em});lastDay=day}
      out.push({type:'msg',msg:m})
    })
    return out
  }, [msgs])

  if (!conv) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[var(--bg)]">
      <MessageSquare size={32} className="text-[var(--label-4)] opacity-20"/>
      <p className="text-[13px] text-[var(--label-4)]">Selecione uma conversa</p>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--sep)] bg-[var(--bg-2)] flex-shrink-0">
        <Av nome={conv.nome||tel} foto={conv.foto_url||conv.fotoUrl} size={32}/>
        <div>
          <p className="text-[13px] font-semibold text-[var(--label)] leading-none mb-0.5">{conv.nome||fmtTel(tel)}</p>
          <p className="text-[10px] text-[var(--label-4)]">{fmtTel(tel)} · {conv.total_msgs||0} msgs</p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {/* Status dropdown */}
          <StatusDropdown
            tel={tel} api={api}
            statusAtend={statusAtend}
            modoManual={modoManual}
            onStatusChange={onStatusChange}
            onToggleModo={onToggleModo}
            onReset={resetarSessao}
            nomeIA={nomeIA}/>
          {/* Refresh */}
          <button onClick={()=>carregar(0)} title="Atualizar"
            className="w-8 h-8 rounded-lg border border-[var(--sep)] flex items-center justify-center text-[var(--label-4)] hover:bg-[var(--bg-3)] transition-colors">
            <RefreshCw size={13}/>
          </button>
        </div>
      </div>

      {/* ── Mensagens ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 bg-[var(--bg)]">
        {hasMore && (
          <div className="text-center mb-4">
            <button onClick={()=>carregar(offset)}
              className="px-4 py-1.5 rounded-full text-[10px] font-semibold border border-[var(--sep)] text-[var(--label-4)] hover:bg-[var(--bg-3)] transition-colors">
              <History size={10} className="inline mr-1"/>Carregar anteriores
            </button>
          </div>
        )}
        {loading && msgs.length===0 ? (
          <div className="flex justify-center pt-12"><RefreshCw size={16} className="animate-spin text-[var(--label-4)]"/></div>
        ) : grouped.map((item,i)=>(
          item.type==='sep'
            ? <DateSep key={`sep-${i}`} ts={item.ts}/>
            : <Bolha key={item.msg.id||i} msg={item.msg} nomeIA={nomeIA}/>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* ── Barra de envio ── */}
      <BarraEnvio telefone={tel} api={api} modoManual={modoManual}
        onEnviou={()=>carregar(0,true)} nomeIA={nomeIA}/>
    </div>
  )
}

// ── Pipeline de status na lista ───────────────────────────────────────────────
function PipelineList({ sel, setSel, contadores }) {
  const ORDER = ['pendente','em_andamento','resolvido','aguardando','encerrado']
  const LABELS = {pendente:'Pendente',em_andamento:'Andamento',resolvido:'Resolvido',aguardando:'Aguardando',encerrado:'Encerrado'}
  return (
    <div className="flex gap-1 p-0.5 rounded-lg bg-[var(--bg-3)] border border-[var(--sep)]">
      {ORDER.map(key=>{
        const S=STATUS_CFG[key]; const on=sel===key; const cnt=contadores[key]||0
        return (
          <button key={key} onClick={()=>setSel(key)}
            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[9px] font-semibold transition-all ${
              on ? `${S.tw} ${S.bg} border ${S.border}` : 'text-[var(--label-4)] hover:text-[var(--label-3)]'
            }`}>
            <span className="hidden sm:block">{LABELS[key]}</span>
            {cnt>0 && <span className={`px-1 rounded-full text-[8px] font-bold ${on?'bg-white/10':'bg-[var(--bg)]'}`}>{cnt}</span>}
          </button>
        )
      })}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PageConversas({ api: apiProp }) {
  const api = apiProp || BASE
  const [convs,     setConvs]     = useState([])
  const [selTel,    setSelTel]    = useState(null)
  const [statusSel, setStatusSel] = useState(()=>sessionStorage.getItem('bia_conv_status')||'pendente')
  const [statusMap, setStatusMap] = useState({})
  const [modoMap,   setModoMap]   = useState({})
  const [busca,     setBusca]     = useState('')
  const [loading,   setLoading]   = useState(true)
  const [nomeIA,    setNomeIA]    = useState('Molise')
  const pollingRef = useRef(null)

  useEffect(()=>{ sessionStorage.setItem('bia_conv_status',statusSel) }, [statusSel])

  // Carrega nome do agente
  useEffect(()=>{
    fetch(`${api}/api/ia/config`).then(r=>r.ok?r.json():null).then(d=>{
      if (!d) return
      if (d.nome_ia) { setNomeIA(d.nome_ia); return }
      const m=(d.persona||'').match(/[Vv]oc[eê] [eé] (\w+)/)
      if (m?.[1]) setNomeIA(m[1])
    }).catch(()=>{})
  }, [api])

  const getStatus = tel => statusMap[tel] || 'pendente'
  const getModo   = tel => modoMap[tel]   || false

  const carregar = useCallback(async (sil=false)=>{
    if (!sil) setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/conversas?aba=todas`)
      if (r.ok) {
        const d=await r.json(); const novas=d.conversas||[]
        setConvs(prev=>{ const map=new Map(prev.map(c=>[c.telefone,c])); return novas.map(c=>({...map.get(c.telefone)||{},...c})) })
        setStatusMap(prev=>{ const n={...prev}; novas.forEach(c=>{ if(c.status_atendimento&&!n[c.telefone]) n[c.telefone]=c.status_atendimento }); return n })
        setModoMap(prev=>{ const n={...prev}; novas.forEach(c=>{ if(c.modo_manual!==undefined&&n[c.telefone]===undefined) n[c.telefone]=c.modo_manual }); return n })
      }
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(()=>{
    carregar()
    pollingRef.current = setInterval(()=>{ if(document.visibilityState!=='hidden') carregar(true) }, 6000)
    return ()=>clearInterval(pollingRef.current)
  }, [carregar])

  const updateStatus = useCallback((tel,st)=>{
    setStatusMap(p=>({...p,[tel]:st}))
    fetch(`${api}/api/dashboard/status/${tel}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:st})}).catch(()=>{})
    fetch(`${api}/api/contatos/${tel}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:st})}).catch(()=>{})
  }, [api])

  const toggleModo = useCallback(tel=>{
    const novo=!getModo(tel)
    setModoMap(p=>({...p,[tel]:novo}))
    fetch(`${api}/api/dashboard/manual/${tel}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ativo:novo})}).catch(()=>{})
  }, [api, modoMap])

  const contadores = useMemo(()=>{
    const c={pendente:0,em_andamento:0,resolvido:0,aguardando:0,encerrado:0}
    convs.forEach(cv=>{ const s=getStatus(cv.telefone); if(c[s]!==undefined) c[s]++ }); return c
  }, [convs, statusMap])

  const filtradas = useMemo(()=>convs.filter(c=>{
    if (getStatus(c.telefone)!==statusSel) return false
    if (!busca) return true
    const b=busca.toLowerCase()
    return (c.nome||'').toLowerCase().includes(b)||(c.telefone||'').includes(busca)||(c.ultima_mensagem||c.ultima_msg||'').toLowerCase().includes(b)
  }), [convs, statusSel, busca, statusMap])

  const convSel = convs.find(c=>c.telefone===selTel)||null

  return (
    <div className="flex h-full overflow-hidden bg-[var(--bg)]">

      {/* ── LISTA ── */}
      <div className="w-[270px] flex-shrink-0 flex flex-col overflow-hidden border-r border-[var(--sep)] bg-[var(--bg-2)]">
        <div className="px-3 py-3 border-b border-[var(--sep)] flex-shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[14px] font-bold text-[var(--label)]">Conversas</h2>
            <div className="flex gap-1 items-center">
              {loading && <RefreshCw size={11} className="animate-spin text-[var(--label-4)]"/>}
              <button onClick={()=>carregar()} className="w-7 h-7 rounded-lg border border-[var(--sep)] flex items-center justify-center text-[var(--label-4)] hover:bg-[var(--bg-3)] transition-colors">
                <RefreshCw size={12}/>
              </button>
            </div>
          </div>
          <div className="mb-2.5">
            <PipelineList sel={statusSel} setSel={setStatusSel} contadores={contadores}/>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-[var(--sep)] bg-[var(--bg-3)]">
            <Search size={12} className="text-[var(--label-4)] flex-shrink-0"/>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..."
              className="flex-1 bg-transparent border-none outline-none text-[11.5px] text-[var(--label)] placeholder:text-[var(--label-4)]"/>
            {busca && <button onClick={()=>setBusca('')} className="text-[var(--label-4)] hover:text-[var(--label-3)]"><X size={11}/></button>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtradas.length===0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <MessageSquare size={18} className="text-[var(--label-4)] opacity-30"/>
              <p className="text-[11px] text-[var(--label-4)]">{loading?'Carregando...':'Nenhuma conversa'}</p>
            </div>
          ) : filtradas.map(c=>(
            <ConvCard key={c.telefone} conv={c} sel={selTel===c.telefone}
              statusAtend={getStatus(c.telefone)} nomeIA={nomeIA}
              onClick={()=>setSelTel(c.telefone)}/>
          ))}
        </div>
      </div>

      {/* ── CHAT ── */}
      <ChatArea
        conv={convSel} api={api}
        statusAtend={convSel?getStatus(convSel.telefone):'pendente'}
        onStatusChange={st=>convSel&&updateStatus(convSel.telefone,st)}
        modoManual={convSel?getModo(convSel.telefone):false}
        onToggleModo={()=>convSel&&toggleModo(convSel.telefone)}
        nomeIA={nomeIA}/>

      {/* ── PAINEL DIREITO ── */}
      <PainelInfo conv={convSel} api={api}/>
    </div>
  )
}
