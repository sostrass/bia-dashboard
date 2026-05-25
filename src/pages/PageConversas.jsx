// PageConversas.jsx — Bia v6 · Enterprise · Multi-Column Shell
import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import {
  Send, Smile, Image, Video, Mic, Search, RefreshCw,
  User, Bot, Zap, X, Lock, MessageSquare, Package,
  ShoppingCart, Tag, Check, Truck, AlertTriangle,
  ChevronDown, ChevronUp, Star, FileText, Phone, Mail,
  MapPin, Paperclip, Sparkles, CheckCircle, CircleDot,
  XCircle, History, RotateCcw, Clock, Circle,
  ArrowRight, AlertOctagon, Filter
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Constantes ────────────────────────────────────────────────────────────────
const REACOES = ['👍','❤️','😂','😮','😢','🙏']
const EMOJIS  = ['😊','👍','🙏','❤️','✅','📦','💰','🚀','😅','🎉','💬','⏳']

// ── Status config — Tailwind classes para dark mode perfeito ─────────────────
const STATUS_CFG = {
  pendente:     { label:'Pendente',     icon:CircleDot,    tw:'text-amber-400',   bg:'bg-amber-400/10',   border:'border-amber-400/30',   dot:'bg-amber-400'   },
  em_andamento: { label:'Andamento',    icon:RefreshCw,    tw:'text-blue-400',    bg:'bg-blue-400/10',    border:'border-blue-400/30',    dot:'bg-blue-400'    },
  resolvido:    { label:'Resolvido',    icon:CheckCircle,  tw:'text-emerald-400', bg:'bg-emerald-400/10', border:'border-emerald-400/30', dot:'bg-emerald-400' },
  aguardando:   { label:'Aguardando',   icon:Clock,        tw:'text-purple-400',  bg:'bg-purple-400/10',  border:'border-purple-400/30',  dot:'bg-purple-400'  },
  encerrado:    { label:'Encerrado',    icon:XCircle,      tw:'text-slate-400',   bg:'bg-slate-400/10',   border:'border-slate-400/30',   dot:'bg-slate-400'   },
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
  if (foto) return <img src={foto} alt={nome||''} style={{width:size,height:size,borderRadius:'50%',flexShrink:0,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
  return <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.37,fontWeight:700,background:bg,color:fg}}>{initials(nome)}</div>
}

// ── ConvCard ──────────────────────────────────────────────────────────────────
const ConvCard = memo(function ConvCard({ conv, sel, statusAtend, nomeIA, onClick }) {
  const S   = STATUS_CFG[statusAtend] || STATUS_CFG.pendente
  const SIc = S.icon
  const man = conv.agente==='humano' || conv.modo_manual
  return (
    <div onClick={onClick}
      className={`flex gap-2.5 px-3 py-2.5 cursor-pointer border-l-2 border-b border-b-[var(--sep)] transition-colors ${
        sel ? 'bg-[var(--accent-dim)] border-l-[var(--accent)]' : 'border-l-transparent hover:bg-[var(--bg-3)]'
      }`}>
      <Av nome={conv.nome||conv.telefone} foto={conv.foto_url||conv.fotoUrl} size={34}/>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-0.5">
          <span className={`text-[12px] font-semibold truncate mr-1 ${sel?'text-[var(--accent)]':'text-[var(--label)]'}`}
            style={{maxWidth:120}}>{conv.nome||fmtTel(conv.telefone)}</span>
          <span className="text-[9px] text-[var(--label-4)] flex-shrink-0">{fmtRel(conv.ultima_atividade||conv.hora)}</span>
        </div>
        <p className="text-[10.5px] text-[var(--label-3)] truncate mb-1.5" style={{maxWidth:180}}>{conv.ultima_mensagem||conv.ultima_msg||'—'}</p>
        <div className="flex gap-1.5">
          <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${S.tw} ${S.bg} ${S.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${S.dot}`}/>
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

// ── Bolha — SEM hover state que cause tremor ──────────────────────────────────
// O tremor vinha de onMouseEnter/Leave no container do flex que muda tamanho
// Solução: usar CSS :hover via className estática, sem state React
const Bolha = memo(function Bolha({ msg, nomeIA, mostrarGatilho }) {
  const [reacao, setReacao] = useState(null)
  const [picker, setPicker] = useState(false)

  const entrada   = msg.direcao === 'entrada'
  const isGatilho = msg.modo === 'transacional'
  const isManual  = msg.modo === 'manual'
  const texto     = (msg.conteudo||'').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g,'').trim()
  if (!texto) return null

  // Gatilhos ficam separados como notas — colapsável
  if (isGatilho && !mostrarGatilho) return null

  if (isGatilho) return (
    <div className="flex justify-center my-1">
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/8 border border-violet-500/15 text-[9px] text-violet-400/70 max-w-[85%]">
        <Zap size={8} className="flex-shrink-0"/>
        <span className="truncate font-medium">{texto.slice(0,80)}{texto.length>80?'...':''}</span>
      </div>
    </div>
  )

  const labelTxt  = entrada ? null : isManual ? 'Atendente' : nomeIA
  const labelCls  = isManual ? 'text-blue-400' : 'text-emerald-400'

  const bubbleCls = entrada
    ? 'bg-[var(--bg-3)] border border-[var(--sep)] rounded-tl-sm'
    : isManual
      ? 'bg-blue-500/10 border border-blue-500/20 rounded-tr-sm'
      : 'bg-emerald-500/10 border border-emerald-500/20 rounded-tr-sm'

  return (
    <div className={`flex flex-col mb-2 ${entrada?'items-start':'items-end'} group`}>
      {labelTxt && (
        <span className={`text-[9px] font-semibold mb-0.5 px-0.5 flex items-center gap-1 ${labelCls}`}>
          {isManual?<User size={8}/>:<Bot size={8}/>}{labelTxt}
        </span>
      )}
      <div className={`flex items-end gap-1.5 ${entrada?'flex-row':'flex-row-reverse'}`}>
        {entrada && (
          <div className="w-5 h-5 rounded-full bg-[var(--bg-4,#2a3549)] flex items-center justify-center text-[8px] text-[var(--label-4)] font-bold flex-shrink-0">
            {initials(msg.nome||'')||'C'}
          </div>
        )}
        <div className={`max-w-[74%] rounded-2xl px-3 py-2 relative ${bubbleCls}`}>
          {msg.midia_tipo==='image'&&msg.midia_url&&(
            <img src={msg.midia_url} alt="" className="w-full rounded-lg mb-1 max-h-36 object-cover" onError={e=>e.target.style.display='none'}/>
          )}
          <p className="text-[12.5px] leading-relaxed text-[var(--label)] whitespace-pre-wrap break-words">{texto}</p>
          <div className={`flex items-center gap-1 mt-0.5 ${entrada?'justify-start':'justify-end'}`}>
            <span className="text-[9px] text-[var(--label-4)]">{fmtHora(msg.criado_em)}</span>
            {!entrada && <span className="text-[9px] text-blue-400">✓✓</span>}
          </div>
          {reacao && (
            <button onClick={()=>setReacao(null)}
              className="absolute -bottom-2 right-2 text-[13px] bg-[var(--bg-2)] border border-[var(--sep)] rounded-full px-1.5 leading-none">
              {reacao}
            </button>
          )}
        </div>
        {/* Picker — visível apenas no hover via CSS group */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 relative">
          <button onClick={()=>setPicker(v=>!v)}
            className="w-5 h-5 rounded-full border border-[var(--sep)] bg-[var(--bg-3)] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-4)]">
            <Smile size={10} className="text-[var(--label-4)]"/>
          </button>
          {picker && (
            <div className={`absolute bottom-6 ${entrada?'left-0':'right-0'} flex gap-1 bg-[var(--bg-2)] border border-[var(--sep)] rounded-2xl px-2 py-1.5 shadow-2xl z-50 whitespace-nowrap`}>
              {REACOES.map(r=>(
                <button key={r} onClick={()=>{setReacao(r);setPicker(false)}}
                  className="text-base hover:scale-125 transition-transform cursor-pointer">{r}</button>
              ))}
            </div>
          )}
        </div>
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
      <span className="text-[9px] font-semibold text-[var(--label-4)] bg-[var(--bg-3)] px-3 py-0.5 rounded-full border border-[var(--sep)] whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-[var(--sep)]"/>
    </div>
  )
}

// ── StatusDropdown ─────────────────────────────────────────────────────────────
function StatusDropdown({ statusAtend, modoManual, onStatusChange, onToggleModo, onReset, nomeIA }) {
  const [open, setOpen] = useState(false)
  const S   = STATUS_CFG[statusAtend] || STATUS_CFG.pendente
  const SIc = S.icon
  const ref = useRef(null)

  useEffect(()=>{
    const fn = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn); return ()=>document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={()=>setOpen(v=>!v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${S.tw} ${S.bg} ${S.border}`}>
        <SIc size={12}/>
        {S.label}
        <ChevronDown size={11} className={`transition-transform ${open?'rotate-180':''}`}/>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-52 bg-[var(--bg-2)] border border-[var(--sep)] rounded-xl shadow-2xl z-50 overflow-hidden py-1.5">
          {/* Status items */}
          {Object.entries(STATUS_CFG).map(([key,s])=>{
            const Ic=s.icon; const on=statusAtend===key
            return (
              <button key={key} onClick={()=>{ onStatusChange(key); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-left transition-colors hover:bg-[var(--bg-3)]"
                style={{opacity: on ? .45 : 1, cursor: on ? 'default' : 'pointer'}}>
                <Ic size={13} className={s.tw}/>
                <span className={s.tw}>{s.label}</span>
                {on && <Check size={10} className="ml-auto text-[var(--label-4)]"/>}
              </button>
            )
          })}
          <div className="my-1 h-px bg-[var(--sep)] mx-3"/>
          {/* Assumir / Devolver */}
          <button onClick={()=>{ onToggleModo(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-left transition-colors hover:bg-[var(--bg-3)] cursor-pointer">
            <User size={13} className={modoManual?'text-blue-400':'text-[var(--label-3)]'}/>
            <span className={modoManual?'text-blue-400':'text-[var(--label-3)]'}>
              {modoManual ? `Devolver à ${nomeIA}` : 'Assumir conversa'}
            </span>
          </button>
          {/* Resetar sessão */}
          <button onClick={()=>{ onReset(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-left transition-colors hover:bg-red-500/10 cursor-pointer">
            <RotateCcw size={13} className="text-red-400"/>
            <span className="text-red-400">Resetar sessão</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ── CatOverlay ─────────────────────────────────────────────────────────────────
function CatOverlay({ telefone, api, onClose }) {
  const [busca, setBusca]    = useState('')
  const [prods, setProds]    = useState([])
  const [load,  setLoad]     = useState(false)
  const [env,   setEnv]      = useState(null)
  const ref = useRef(null)
  useEffect(()=>{ ref.current?.focus() }, [])

  const buscar = async () => {
    if (!busca.trim()) return
    setLoad(true); setProds([])
    try {
      const r = await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(busca)}`)
      if (r.ok) { const d=await r.json(); setProds(d.produtos||[]) }
    } catch {}
    setLoad(false)
  }

  const enviar = async p => {
    setEnv(p.id||p.nome)
    const n    = parseFloat(p.preco||p.precoVenda||0)
    const nome = p.nome||p.descricao||'Produto'
    const vars = {
      nome_produto:      nome,
      preco_cartao:      fmtR(n),
      preco_pix:         fmtR(n*.9),
      foto_produto:      (Array.isArray(p.imagens)?p.imagens[0]:p.imagens)||'',
      descricao_produto: p.descricao||p.descricao_curta||'',
      codigo_produto:    p.sku||p.codigo||'',
    }
    try {
      // 1. Tenta disparar via template editável
      const rT = await fetch(`${api}/api/templates/disparar-gatilho`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ gatilho:'catalogo_produto', telefone, variaveis:vars })
      })
      const dT = await rT.json()
      if (!dT.ok) {
        // 2. Fallback com botões interativos
        const bodyRaw = `✨ *${nome}*\n\n💳 Cartão: *${fmtR(n)}* | 💰 PIX: *${fmtR(n*.9)}*${vars.descricao_produto?'\n\n'+vars.descricao_produto.slice(0,200):''}\n\nEscolha uma opção 👇`
        const bodyText = bodyRaw.slice(0, 1000) || `${nome} disponível. Escolha uma opção 👇`
        const interactive = {
          type:'button',
          body:{ text: bodyText },
          action:{ buttons:[
            { type:'reply', reply:{ id:'btn_carrinho', title:'🛒 Ao Carrinho' } },
            { type:'reply', reply:{ id:'btn_foto',     title:'📸 Ver Foto'             } },
            { type:'reply', reply:{ id:'btn_duvidas',  title:'💬 Tirar Dúvidas'        } },
          ]},
        }
        if (vars.foto_produto) interactive.header = { type:'image', image:{ link:vars.foto_produto } }
        interactive.footer = { text:'Só Strass — Atendimento ao Cliente' }
        await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone,interactive})})
      }
    } catch {}
    setEnv(null); onClose()
  }

  const avisar = async p => {
    setEnv('aviso_'+(p.id||p.nome))
    try {
      await fetch(`${api}/api/avise-me`,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ telefone, produto_nome:p.nome||p.descricao, bling_id:p.bling_id||p.id })
      })
      const msg = `⏰ *Produto cadastrado na lista de espera!*\n\n*${p.nome||p.descricao}*\n\nAssim que este produto chegar ao estoque, você será avisado automaticamente. 😊\n\n_Só Strass — Atendimento ao Cliente_`
      await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone,mensagem:msg})})
    } catch {}
    setEnv(null); onClose()
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-[var(--bg-2)] border border-[var(--sep)] rounded-xl shadow-2xl z-50 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--sep)]">
        <ShoppingCart size={13} className="text-emerald-400 flex-shrink-0"/>
        <input ref={ref} value={busca} onChange={e=>setBusca(e.target.value)} onKeyDown={e=>e.key==='Enter'&&buscar()}
          placeholder="Buscar produto para enviar ao cliente..."
          className="flex-1 bg-transparent border-none outline-none text-[12.5px] text-[var(--label)] placeholder:text-[var(--label-4)]"/>
        {busca && <button onClick={()=>{setBusca('');setProds([])}} className="text-[var(--label-4)] hover:text-[var(--label-3)]"><X size={13}/></button>}
        <button onClick={buscar}
          className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/25 transition-colors flex-shrink-0 flex items-center gap-1.5">
          {load ? <RefreshCw size={11} className="animate-spin"/> : 'Buscar'}
        </button>
        <button onClick={onClose} className="text-[var(--label-4)] hover:text-[var(--label-3)]"><X size={14}/></button>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {prods.length===0 && busca && !load && (
          <p className="px-4 py-3 text-[11px] text-[var(--label-4)] text-center">Nenhum produto encontrado</p>
        )}
        {prods.slice(0,12).map((p,i)=>{
          const disp = parseInt(p.estoque||0) > 0 || (p.disponivel === true && p.estoque === undefined)
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--sep)] hover:bg-[var(--bg-3)] transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[var(--label)] truncate">{p.nome||p.descricao}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] font-semibold text-emerald-400">{fmtR(p.preco||p.precoVenda||0)}</p>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${disp?'text-emerald-400 bg-emerald-400/10':'text-red-400 bg-red-400/10'}`}>
                    {disp ? (p.estoque!==undefined ? `✓ Est: ${parseInt(p.estoque||0)}` : '✓ Disponível') : '✗ Sem estoque'}
                  </span>
                </div>
              </div>
              {disp
                ? <button onClick={()=>enviar(p)} disabled={env===(p.id||p.nome)}
                    className="px-3 py-1 rounded-lg border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold hover:bg-emerald-500/20 transition-colors flex-shrink-0 disabled:opacity-50">
                    {env===(p.id||p.nome)?'Enviando...':'Enviar'}
                  </button>
                : <button onClick={()=>avisar(p)} disabled={env===('aviso_'+(p.id||p.nome))}
                    className="px-3 py-1 rounded-lg border border-amber-500/30 text-amber-400 text-[10px] font-semibold hover:bg-amber-500/15 transition-colors flex-shrink-0 disabled:opacity-50 flex items-center gap-1">
                    ⏰ Avise-me
                  </button>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── BarraEnvio ────────────────────────────────────────────────────────────────
function BarraEnvio({ telefone, api, modoManual, onEnviou, onAssumirModo, nomeIA }) {
  const [texto,     setTexto]     = useState('')
  const [enviando,  setEnviando]  = useState(false)
  const [anotacao,  setAnotacao]  = useState(false)
  const [sugestoes, setSugestoes] = useState([])
  const [loadSug,   setLoadSug]   = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [catOpen,   setCatOpen]   = useState(false)
  const [refining,  setRefining]  = useState(false)
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
    const txt=(msg||texto).trim()
    if (!txt||enviando) return
    setTexto(''); setSugestoes([])
    setEnviando(true)
    try {
      await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone,mensagem:txt,anotacao})})
      onEnviou?.()
    } catch {}
    setEnviando(false); inputRef.current?.focus()
  }

  const enviarArquivo = (file, tipo) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]
      try {
        await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone,tipo,midia_base64:base64,midia_nome:file.name})})
        onEnviou?.()
      } catch {}
    }
    reader.readAsDataURL(file)
  }

  const refinarIA = async () => {
    if (!texto.trim()||refining) return
    setRefining(true)
    try {
      const r = await fetch(`${api}/api/ia/melhorar-texto`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({texto,contexto:`Atendimento WhatsApp ${fmtTel(telefone)}`})})
      if (r.ok) { const d=await r.json(); if(d.texto) setTexto(d.texto) }
    } catch {}
    setRefining(false)
  }

  // ── Modo IA: barra read-only com sugestão e ações ──────────────────────────
  if (!modoManual) return (
    <div className="border-t border-[var(--sep)] bg-[var(--bg-2)] flex-shrink-0">
      {sugestoes.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-500/15 bg-amber-500/5">
          <Zap size={11} className="text-amber-400 flex-shrink-0"/>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold text-amber-400 leading-none mb-0.5">Sugestão da IA</p>
            <p className="text-[11.5px] text-[var(--label)] truncate">{typeof sugestoes[0]==='string'?sugestoes[0]:sugestoes[0]?.texto||''}</p>
          </div>
          <button onClick={()=>{ onAssumirModo?.(); setTimeout(()=>{ setTexto(typeof sugestoes[0]==='string'?sugestoes[0]:sugestoes[0]?.texto||'') }, 100) }}
            className="px-3 py-1 rounded-lg border border-amber-400/30 text-amber-400 text-[10px] font-bold hover:bg-amber-400/15 transition-colors flex-shrink-0">Usar</button>
          <button onClick={()=>setSugestoes([])} className="text-[var(--label-4)] hover:text-[var(--label-3)]"><X size={11}/></button>
        </div>
      )}
      <div className="flex items-center gap-2 px-4 py-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"/>
        <p className="text-[11px] text-[var(--label-4)] flex-1">IA ativa — assuma para responder</p>
        <button onClick={buscarSugestoes} disabled={loadSug}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-400/30 text-amber-400 bg-amber-400/5 text-[10px] font-semibold hover:bg-amber-400/15 transition-colors disabled:opacity-50">
          <Sparkles size={10} className={loadSug?'animate-spin':''}/> Sugerir IA
        </button>
      </div>
      <div className="flex items-center gap-2 px-4 pb-3">
        {[
          { label:'Catálogo', icon:ShoppingCart, onClick:()=>setCatOpen(v=>!v), emerald:true },
          { label:'Imagem',   icon:Image,        onClick:()=>imgRef.current?.click() },
          { label:'Vídeo',    icon:Video,        onClick:()=>vidRef.current?.click() },
        ].map(({label,icon:Ic,onClick,emerald})=>(
          <button key={label} onClick={onClick}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
              emerald ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15'
                      : 'border-[var(--sep)] text-[var(--label-3)] hover:bg-[var(--bg-3)]'
            }`}>
            <Ic size={12}/>{label}
          </button>
        ))}
        <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e=>{if(e.target.files[0])enviarArquivo(e.target.files[0],'image');e.target.value=''}}/>
        <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={e=>{if(e.target.files[0])enviarArquivo(e.target.files[0],'video');e.target.value=''}}/>
      </div>
    </div>
  )

  // ── Modo manual: composer completo ─────────────────────────────────────────
  return (
    <div className="border-t border-[var(--sep)] bg-[var(--bg-2)] flex-shrink-0 relative">

      {catOpen && <CatOverlay telefone={telefone} api={api} onClose={()=>setCatOpen(false)}/>}

      {/* Sugestão IA banner */}
      {sugestoes.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-500/15 bg-amber-500/5">
          <Zap size={11} className="text-amber-400 flex-shrink-0"/>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold text-amber-400 leading-none mb-0.5">Sugestão da IA</p>
            <p className="text-[11.5px] text-[var(--label)] truncate">{typeof sugestoes[0]==='string'?sugestoes[0]:sugestoes[0]?.texto||''}</p>
          </div>
          <button onClick={()=>{ const s=sugestoes[0]; setTexto(typeof s==='string'?s:s?.texto||''); setSugestoes([]); inputRef.current?.focus() }}
            className="px-3 py-1 rounded-lg border border-amber-400/30 text-amber-400 text-[10px] font-bold hover:bg-amber-400/15 transition-colors flex-shrink-0">Usar</button>
          <button onClick={()=>setSugestoes([])} className="text-[var(--label-4)] hover:text-[var(--label-3)]"><X size={11}/></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--sep)]">
        {[{id:false,label:'Resposta pública',Ic:MessageSquare},{id:true,label:'Anotação interna',Ic:Lock}].map(a=>{
          const on=anotacao===a.id; const Ic=a.Ic
          const col = on ? (a.id ? 'text-amber-400 border-amber-400' : 'text-[var(--accent)] border-[var(--accent)]') : 'text-[var(--label-4)] border-transparent'
          return (
            <button key={String(a.id)} onClick={()=>setAnotacao(a.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold border-b-2 transition-colors ${col}`}>
              <Ic size={12}/>{a.label}
            </button>
          )
        })}
      </div>

      {/* Nota badge */}
      {anotacao && (
        <div className="flex items-center gap-1.5 mx-4 mt-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-lg text-[10px] text-amber-400 font-semibold w-fit">
          <Lock size={9}/>Anotação interna — não enviada ao cliente
        </div>
      )}

      {/* Emoji picker */}
      {emojiOpen && (
        <div className="px-4 pt-2 pb-1 border-b border-[var(--sep)] flex gap-2 flex-wrap">
          {EMOJIS.map(e=>(
            <button key={e} onClick={()=>{setTexto(t=>t+e);setEmojiOpen(false);inputRef.current?.focus()}}
              className="text-lg hover:scale-125 transition-transform cursor-pointer">{e}</button>
          ))}
        </div>
      )}

      {/* Textarea */}
      <div className="px-4 pt-2 pb-1">
        <textarea ref={inputRef} value={texto} onChange={e=>setTexto(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar()}}}
          rows={2} placeholder={anotacao?'Anotação interna...':'Escrever mensagem...'}
          className="w-full bg-transparent border-none outline-none text-[13px] text-[var(--label)] placeholder:text-[var(--label-4)] resize-none leading-relaxed font-sans"
          style={{maxHeight:120,overflow:'auto'}}/>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-4 pb-3 pt-0.5">
        <button onClick={()=>{setCatOpen(v=>!v);setEmojiOpen(false)}}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
            catOpen?'border-emerald-500/40 text-emerald-400 bg-emerald-500/15':'border-[var(--sep)] text-[var(--label-3)] hover:bg-[var(--bg-3)]'
          }`}><ShoppingCart size={12}/>Catálogo</button>

        <label className="w-7 h-7 rounded-lg border border-[var(--sep)] flex items-center justify-center cursor-pointer text-[var(--label-3)] hover:bg-[var(--bg-3)] transition-colors" title="Enviar imagem">
          <Image size={14}/><input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e=>{if(e.target.files[0])enviarArquivo(e.target.files[0],'image');e.target.value=''}}/>
        </label>
        <label className="w-7 h-7 rounded-lg border border-[var(--sep)] flex items-center justify-center cursor-pointer text-[var(--label-3)] hover:bg-[var(--bg-3)] transition-colors" title="Enviar vídeo">
          <Video size={14}/><input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={e=>{if(e.target.files[0])enviarArquivo(e.target.files[0],'video');e.target.value=''}}/>
        </label>
        <button className="w-7 h-7 rounded-lg border border-[var(--sep)] flex items-center justify-center text-[var(--label-3)] hover:bg-[var(--bg-3)] transition-colors" title="Áudio"><Mic size={14}/></button>
        <button onClick={()=>{setEmojiOpen(v=>!v);setCatOpen(false)}} title="Emoji"
          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${emojiOpen?'border-amber-400/40 text-amber-400 bg-amber-400/10':'border-[var(--sep)] text-[var(--label-3)] hover:bg-[var(--bg-3)]'}`}>
          <Smile size={14}/>
        </button>
        <button className="w-7 h-7 rounded-lg border border-[var(--sep)] flex items-center justify-center text-[var(--label-3)] hover:bg-[var(--bg-3)] transition-colors" title="Anexar"><Paperclip size={14}/></button>
        <button onClick={refinarIA} disabled={!texto.trim()||refining}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-violet-500/30 text-violet-400 bg-violet-500/5 text-[10px] font-semibold hover:bg-violet-500/15 transition-colors disabled:opacity-40">
          <Sparkles size={11} className={refining?'animate-spin':''}/>{refining?'Refinando...':nomeIA+' IA'}
        </button>
        <div className="flex-1"/>
        <button onClick={()=>enviar()} disabled={!texto.trim()||enviando}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
            texto.trim()&&!enviando?'bg-[var(--accent)] text-white hover:opacity-90':'bg-[var(--bg-3)] text-[var(--label-4)]'
          }`}>
          <Send size={13}/>{enviando?'Enviando...':'Enviar'}
        </button>
      </div>
    </div>
  )
}

// ── PainelInfo ─────────────────────────────────────────────────────────────────
function PainelInfo({ conv, api }) {
  const [aba,     setAba]    = useState('perfil')
  const [perfil,  setPerfil] = useState(null)
  const [pedidos, setPedidos]= useState([])
  const [loadPed, setLoadPed]= useState(false)
  const [pedAb,   setPedAb]  = useState({})
  const [catBusca,setCatBusca]=useState('')
  const [catProds,setCatProds]=useState([])
  const [catLoad, setCatLoad] = useState(false)
  const [errPerfil, setErrPerfil] = useState(false)

  useEffect(()=>{
    if (!conv?.telefone) return
    let m=true; setPerfil(null); setPedidos([]); setErrPerfil(false)

    fetch(`${api}/api/contatos/${conv.telefone}`)
      .then(r=>r.ok?r.json():Promise.reject('err'))
      .then(d=>{ if(m) { if(d.nome||d.cpf||d.email) setPerfil(d); else setErrPerfil(true) } })
      .catch(()=>{ if(m) setErrPerfil(true) })

    setLoadPed(true)
    fetch(`${api}/api/contatos/${conv.telefone}/pedidos`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(m){const l=Array.isArray(d)?d:d?.pedidos||[];setPedidos(l)} })
      .catch(()=>{}).finally(()=>{ if(m) setLoadPed(false) })

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
    const n    = parseFloat(p.preco||p.precoVenda||0)
    const nome = p.nome||p.descricao||'Produto'
    const vars = {
      nome_produto:      nome,
      preco_cartao:      fmtR(n),
      preco_pix:         fmtR(n*.9),
      foto_produto:      (Array.isArray(p.imagens)?p.imagens[0]:p.imagens)||'',
      descricao_produto: p.descricao||p.descricao_curta||'',
      codigo_produto:    p.sku||p.codigo||'',
    }
    try {
      // 1. Tenta disparar via template editável (Gatilhos → Produto do Catálogo)
      const rTmpl = await fetch(`${api}/api/templates/disparar-gatilho`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ gatilho:'catalogo_produto', telefone:conv.telefone, variaveis:vars })
      })
      const dTmpl = await rTmpl.json()
      if (dTmpl.ok) return  // Template enviado com sucesso

      // 2. Fallback: envia mensagem interativa com botões hardcoded
      const bodyRaw = `✨ *${nome}*\n\n💳 Cartão: *${fmtR(n)}* | 💰 PIX: *${fmtR(n*.9)}*${vars.descricao_produto ? '\n\n'+vars.descricao_produto.slice(0,200) : ''}\n\nEscolha uma opção 👇`
      const bodyText = bodyRaw.slice(0, 1000) || `${nome} disponível. Escolha uma opção 👇`
      const interactive = {
        type:'button',
        body:{ text: bodyText },
        action:{ buttons:[
          { type:'reply', reply:{ id:'btn_carrinho', title:'🛒 Ao Carrinho' } },
          { type:'reply', reply:{ id:'btn_foto',     title:'📸 Ver Foto'             } },
          { type:'reply', reply:{ id:'btn_duvidas',  title:'💬 Tirar Dúvidas'        } },
        ]},
      }
      if (vars.foto_produto) {
        interactive.header = { type:'image', image:{ link: vars.foto_produto } }
      }
      interactive.footer = { text:'Só Strass — Atendimento ao Cliente' }
      await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ telefone:conv.telefone, interactive })
      })
    } catch {}
  }

  const avisarQuandoChegar = async p => {
    if (!conv?.telefone) return
    try {
      // Registra na lista "Avise-me" do backend
      await fetch(`${api}/api/avise-me`,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ telefone:conv.telefone, produto_nome:p.nome||p.descricao, bling_id:p.bling_id||p.id })
      })
      // Informa o cliente via WhatsApp
      const msg = `⏰ *Produto cadastrado na lista de espera!*\n\n*${p.nome||p.descricao}*\n\nAssim que este produto chegar ao estoque, você será avisado automaticamente. 😊\n\n_Só Strass — Atendimento ao Cliente_`
      await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:conv.telefone,mensagem:msg})})
    } catch {}
  }

  const totalGasto = useMemo(()=>{
    if (!pedidos.length) return null
    const t=pedidos.reduce((a,p)=>a+parseFloat(p.total||p.valor||0),0)
    return t>0 ? fmtR(t) : null
  }, [pedidos])

  if (!conv) return <div className="w-56 flex-shrink-0 border-l border-[var(--sep)] bg-[var(--bg-2)]"/>

  const campoPerfil = [
    {l:'Nome',        v:perfil?.nome||conv.nome},
    {l:'Telefone',    v:fmtTel(perfil?.telefone||conv.telefone)},
    {l:'CPF/CNPJ',    v:perfil?.cpf||perfil?.cnpj},
    {l:'E-mail',      v:perfil?.email},
    {l:'Endereço',    v:[perfil?.logradouro,perfil?.numero].filter(Boolean).join(', ')||null},
    {l:'Complemento', v:perfil?.complemento},
    {l:'Bairro',      v:perfil?.bairro},
    {l:'Cidade/UF',   v:[perfil?.cidade,perfil?.uf].filter(Boolean).join(' · ')||null},
    {l:'CEP',         v:perfil?.cep},
    {l:'Total gasto', v:totalGasto, accent:true},
  ].filter(c=>c.v)

  const sitCls = s => ({Aberto:'text-amber-400 bg-amber-400/10',Atendido:'text-emerald-400 bg-emerald-400/10',Verificado:'text-emerald-400 bg-emerald-400/10',Faturado:'text-blue-400 bg-blue-400/10',Cancelado:'text-red-400 bg-red-400/10',Entregue:'text-emerald-400 bg-emerald-400/10'}[s]||'text-slate-400 bg-slate-400/10')

  // Ações rápidas — com navegação real
  const acoesRapidas = [
    {
      l:'Abrir ocorrência', ic:AlertTriangle,
      action:()=>{
        if (onNavigate) {
          onNavigate('ocorrencias', { novaOcorrencia: true, tel: conv.telefone, nome: conv.nome })
        } else {
          // fallback: CustomEvent para o Shell
          window.dispatchEvent(new CustomEvent('bia:navigate', { detail:{ page:'ocorrencias', tel:conv.telefone } }))
        }
      }
    },
    { l:'Ver catálogo', ic:ShoppingCart, action:()=>setAba('catalogo') },
    {
      l:'Ver rastreio', ic:Truck,
      action:()=>{
        const ped = pedidos[0]
        const cod = ped?.rastreio && ped.rastreio!=='—' ? ped.rastreio : ''
        const url = cod
          ? `https://www.linketrack.com/trace/busca?user=linketrack&token=1abcd&codigo=${cod}`
          : 'https://www.linketrack.com'
        window.open(url, '_blank')
      }
    },
    {
      l:'Enviar CSAT', ic:Star,
      action:async ()=>{
        if (!conv?.telefone) return
        try {
          // Busca a ocorrência mais recente deste telefone e dispara CSAT
          const r = await fetch(`${api}/api/ocorrencias?telefone=${conv.telefone}&limit=1`)
          if (r.ok) {
            const d = await r.json()
            const oc = (d.ocorrencias||[])[0]
            if (oc) {
              const rc = await fetch(`${api}/api/ocorrencias/${oc.id}/csat`, { method:'POST' })
              if (rc.ok) alert('✅ Pesquisa CSAT enviada para ' + (conv.nome||conv.telefone))
              else alert('⚠️ Abra uma ocorrência primeiro para enviar o CSAT.')
            } else {
              alert('⚠️ Nenhuma ocorrência encontrada. Abra um chamado primeiro.')
            }
          }
        } catch { alert('Erro ao enviar CSAT') }
      }
    },
  ]

  return (
    <div className="w-56 flex-shrink-0 flex flex-col overflow-hidden border-l border-[var(--sep)] bg-[var(--bg-2)]">
      {/* Mini header */}
      <div className="px-3 py-2.5 border-b border-[var(--sep)] flex items-center gap-2 flex-shrink-0">
        <Av nome={conv.nome||conv.telefone} foto={conv.foto_url||conv.fotoUrl} size={30}/>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-[var(--label)] truncate">{conv.nome||fmtTel(conv.telefone)}</p>
          <p className="text-[9px] text-[var(--label-4)]">{fmtTel(conv.telefone)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--sep)] flex-shrink-0">
        {[['perfil','Perfil'],['pedidos','Pedidos'],['catalogo','Catálogo']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setAba(id)}
            className={`flex-1 py-2 text-[10px] font-semibold border-b-2 transition-colors ${
              aba===id?'text-[var(--accent)] border-[var(--accent)]':'text-[var(--label-4)] border-transparent hover:text-[var(--label-3)]'
            }`}>{lbl}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── PERFIL ── */}
        {aba==='perfil' && (
          <div className="px-3 py-3 space-y-4">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--label-4)] mb-1.5">Dados do cliente</p>
              {errPerfil ? (
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--label-4)] py-2">
                  <AlertTriangle size={11}/> Não encontrado no Bling
                </div>
              ) : !perfil ? (
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--label-4)] py-2">
                  <RefreshCw size={10} className="animate-spin"/> Carregando...
                </div>
              ) : campoPerfil.length===0 ? (
                <p className="text-[10px] text-[var(--label-4)]">Sem dados cadastrados</p>
              ) : (
                <div className="space-y-0">
                  {campoPerfil.map(({l,v,accent})=>(
                    <div key={l} className="flex justify-between gap-1 py-1 border-b border-[var(--sep)] last:border-0">
                      <span className="text-[9px] text-[var(--label-4)] whitespace-nowrap flex-shrink-0">{l}</span>
                      <span className={`text-[10px] font-medium text-right break-all leading-snug ${accent?'text-emerald-400':'text-[var(--label)]'}`}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pedido recente */}
            {pedidos.length>0 && (
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--label-4)] mb-1.5">Pedido recente</p>
                {(()=>{const p=pedidos[0];const sit=mapSit(p.situacao);return(
                  <div className="border border-[var(--sep)] rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-2 py-1.5 bg-[var(--bg-3)]">
                      <span className="text-[11px] font-bold text-[var(--label)]">#{p.numero||p.id}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${sitCls(sit)}`}>{sit}</span>
                    </div>
                    {p.rastreio&&p.rastreio!=='—'&&(
                      <div className="px-2 py-1 flex items-center gap-1 text-[9px] text-blue-400 font-medium bg-blue-400/5 border-b border-[var(--sep)]">
                        <Truck size={8}/>{p.rastreio}
                      </div>
                    )}
                    <div className="flex justify-between px-2 py-1.5 text-[10px]">
                      <span className="text-[var(--label-4)]">{p.data||'—'}</span>
                      <span className="font-bold text-[var(--label)]">{fmtR(p.total||p.valor)}</span>
                    </div>
                  </div>
                )})()}
              </div>
            )}

            {/* Ações rápidas — interativas */}
            <div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--label-4)] mb-1.5">Ações rápidas</p>
              <div className="grid grid-cols-2 gap-1">
                {acoesRapidas.map(({l,ic:Ic,action})=>(
                  <button key={l} onClick={action}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-semibold border border-[var(--sep)] text-[var(--label-3)] hover:bg-[var(--bg-3)] hover:text-[var(--label)] hover:border-[var(--sep2)] transition-all cursor-pointer text-left active:scale-95">
                    <Ic size={10} className="flex-shrink-0"/>{l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PEDIDOS ── */}
        {aba==='pedidos' && (
          <div className="px-3 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--label-4)]">Pedidos</p>
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
                  <div className="flex items-center justify-between px-2.5 py-2 bg-[var(--bg-3)] cursor-pointer hover:bg-[var(--bg-4)] transition-colors"
                    onClick={()=>setPedAb(v=>({...v,[i]:!v[i]}))}>
                    <div>
                      <span className="text-[11px] font-bold text-[var(--label)]">#{p.numero||p.id}</span>
                      <span className="text-[9px] text-[var(--label-4)] ml-1.5">{p.data||'—'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {sit==='Verificado'&&<span className="text-[8px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">✓</span>}
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${sitCls(sit)}`}>{sit}</span>
                      {open?<ChevronUp size={10} className="text-[var(--label-4)]"/>:<ChevronDown size={10} className="text-[var(--label-4)]"/>}
                    </div>
                  </div>
                  {open&&(
                    <div className="px-2.5 pb-2 pt-1.5 border-t border-[var(--sep)]">
                      {p.rastreio&&p.rastreio!=='—'&&<div className="text-[9px] text-blue-400 flex items-center gap-1 mb-1 font-medium"><Truck size={9}/>{p.rastreio}</div>}
                      {(p.itens||[]).map((it,j)=>(
                        <div key={j} className="flex justify-between text-[9px] py-0.5 border-b border-[var(--sep)] last:border-0">
                          <span className="text-[var(--label-3)] truncate flex-1">{it.nome||it.descricao}</span>
                          <span className="text-[var(--label-4)] ml-1 flex-shrink-0">{it.quantidade}x</span>
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

        {/* ── CATÁLOGO ── */}
        {aba==='catalogo' && (
          <div className="px-3 py-3">
            <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--label-4)] mb-2">Enviar produto</p>
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
            {catProds.map((p,i)=>{
              const estoque = parseInt(p.estoque||0)
              const disp    = estoque > 0 || (p.disponivel === true && p.estoque === undefined)
              return (
                <div key={i} className="border border-[var(--sep)] rounded-lg overflow-hidden mb-2">
                  <div className="px-2.5 py-2 bg-[var(--bg-3)]">
                    <p className="text-[11px] font-medium text-[var(--label)] truncate">{p.nome||p.descricao}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] font-bold text-emerald-400">{fmtR(p.preco||p.precoVenda||0)}</p>
                      <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${disp?'text-emerald-400 bg-emerald-400/10':'text-red-400 bg-red-400/10'}`}>
                        {disp ? (p.estoque!==undefined ? `✓ Est: ${estoque}` : '✓ Disponível') : '✗ Sem estoque'}
                      </span>
                    </div>
                  </div>
                  {disp
                    ? <button onClick={()=>enviarProd(p)} className="w-full py-1.5 bg-[var(--accent)] text-white text-[10px] font-bold hover:opacity-90 transition-opacity">Enviar ao cliente</button>
                    : <button onClick={()=>avisarQuandoChegar(p)} className="w-full py-1.5 bg-amber-500/15 text-amber-400 text-[10px] font-bold hover:bg-amber-500/25 transition-colors border-t border-amber-500/20 flex items-center justify-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1v4l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="5" cy="5" r="4.2" stroke="currentColor" strokeWidth="1.3"/></svg>
                        Avise-me quando chegar
                      </button>
                  }
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── ChatArea ──────────────────────────────────────────────────────────────────
function ChatArea({ conv, api, statusAtend, onStatusChange, modoManual, onToggleModo, nomeIA, listMode, onToggleList }) {
  const [msgs,          setMsgs]         = useState([])
  const [loading,       setLoading]      = useState(true)
  const [hasMore,       setHasMore]      = useState(false)
  const [offset,        setOffset]       = useState(0)
  const [mostrarGatilho,setMostrarGat]   = useState(false)
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
    if (!confirm(`Resetar sessão de ${conv.nome||fmtTel(tel)}? O carrinho será limpo.`)) return
    try {
      await fetch(`${api}/api/dashboard/resetar-sessao`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:tel})})
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

  // Conta gatilhos nas mensagens visíveis
  const nGatilhos = useMemo(()=>msgs.filter(m=>m.modo==='transacional').length, [msgs])

  if (!conv) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[var(--bg)]">
      <MessageSquare size={32} className="text-[var(--label-4)] opacity-20"/>
      <p className="text-[13px] text-[var(--label-4)]">Selecione uma conversa</p>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--sep)] bg-[var(--bg-2)] flex-shrink-0">

        <Av nome={conv.nome||tel} foto={conv.foto_url||conv.fotoUrl} size={30}/>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[var(--label)] leading-none mb-0.5 truncate" style={{maxWidth:200}}>{conv.nome||fmtTel(tel)}</p>
          <p className="text-[10px] text-[var(--label-4)]">{fmtTel(tel)} · {conv.total_msgs||0} msgs</p>
        </div>

        {/* Gatilhos toggle */}
        {nGatilhos > 0 && (
          <button onClick={()=>setMostrarGat(v=>!v)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-semibold border transition-all ${
              mostrarGatilho?'border-violet-400/40 text-violet-400 bg-violet-400/10':'border-[var(--sep)] text-[var(--label-4)] hover:bg-[var(--bg-3)]'
            }`}>
            <Zap size={10}/>{mostrarGatilho?'Ocultar':'Gatilhos'} ({nGatilhos})
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <StatusDropdown
            statusAtend={statusAtend}
            modoManual={modoManual}
            onStatusChange={onStatusChange}
            onToggleModo={onToggleModo}
            onReset={resetarSessao}
            nomeIA={nomeIA}/>
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
        {loading&&msgs.length===0 ? (
          <div className="flex justify-center pt-12"><RefreshCw size={16} className="animate-spin text-[var(--label-4)]"/></div>
        ) : grouped.map((item,i)=>(
          item.type==='sep'
            ? <DateSep key={`sep-${i}`} ts={item.ts}/>
            : <Bolha key={item.msg.id||i} msg={item.msg} nomeIA={nomeIA} mostrarGatilho={mostrarGatilho}/>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* ── Barra de envio ── */}
      <BarraEnvio telefone={tel} api={api} modoManual={modoManual}
        onEnviou={()=>carregar(0,true)} nomeIA={nomeIA}
        onAssumirModo={onToggleModo}/>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PageConversas({ api: apiProp, onNavigate }) {
  const api = apiProp || BASE
  const [convs,     setConvs]     = useState([])
  const [selTel,    setSelTel]    = useState(null)
  const [statusSel, setStatusSel] = useState(()=>sessionStorage.getItem('bia_conv_status')||'pendente')
  const [statusMap, setStatusMap] = useState({})
  const [modoMap,   setModoMap]   = useState({})
  const [busca,     setBusca]     = useState('')
  const [loading,   setLoading]   = useState(true)
  const [nomeIA,    setNomeIA]    = useState('Molise')
  const [listMode,  setListMode]  = useState('open') // 'open' | 'collapsed'
  const pollingRef = useRef(null)

  useEffect(()=>{ sessionStorage.setItem('bia_conv_status',statusSel) }, [statusSel])

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

      {/* ── SIDEBAR — retrátil: collapsed=48px ícones / open=260px lista ── */}
      <div style={{
        flexShrink:0, display:'flex', flexDirection:'row', overflow:'visible',
        position:'relative', zIndex:10
      }}>

        {/* Coluna de ícones sempre visível (48px) */}
        <div style={{
          width:48, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center',
          borderRight:'1px solid var(--sep)', background:'var(--bg-2)', paddingTop:8, gap:2
        }}>
          {/* Botão toggle */}
          <button onClick={()=>setListMode(m=>m==='open'?'collapsed':'open')}
            title={listMode==='open'?'Recolher':'Expandir lista'}
            style={{
              width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
              border:'1px solid var(--sep)', background:'transparent', cursor:'pointer', marginBottom:8,
              color:'var(--label-4)', transition:'background .12s'
            }}>
            {listMode==='open'
              ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L6 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2L8 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
          </button>

          {/* Ícones de status — clique muda aba e abre lista */}
          {[
            {key:'pendente',     Ic:CircleDot,   tw:'#f59e0b'},
            {key:'em_andamento', Ic:RefreshCw,   tw:'#3b82f6'},
            {key:'resolvido',    Ic:CheckCircle, tw:'#10b981'},
            {key:'aguardando',   Ic:Clock,       tw:'#8b5cf6'},
            {key:'encerrado',    Ic:XCircle,     tw:'#94a3b8'},
          ].map(({key,Ic,tw})=>{
            const on=statusSel===key; const cnt=contadores[key]||0
            return (
              <button key={key}
                onClick={()=>{setStatusSel(key);setListMode('open')}}
                title={STATUS_CFG[key]?.label}
                style={{
                  position:'relative', width:32, height:32, borderRadius:8, display:'flex',
                  alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer',
                  background: on ? tw+'20' : 'transparent',
                  transition:'background .12s', marginBottom:2
                }}>
                <Ic size={16} style={{color: on ? tw : 'var(--label-4)', transition:'color .12s'}}/>
                {cnt>0 && (
                  <span style={{
                    position:'absolute', top:2, right:2, width:14, height:14, borderRadius:'50%',
                    background: on ? tw : '#4b5563', color:'#fff', fontSize:8, fontWeight:700,
                    display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1
                  }}>{cnt>9?'9+':cnt}</span>
                )}
              </button>
            )
          })}

          {/* Refresh */}
          <div style={{flex:1}}/>
          <button onClick={()=>carregar()} title="Atualizar"
            style={{
              width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
              border:'1px solid var(--sep)', background:'transparent', cursor:'pointer', marginBottom:8,
              color:'var(--label-4)'
            }}>
            {loading ? <RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> : <RefreshCw size={13}/>}
          </button>
        </div>

        {/* Painel de lista — expande/retrai */}
        <div style={{
          width: listMode==='open' ? 212 : 0,
          minWidth: listMode==='open' ? 212 : 0,
          overflow:'hidden',
          display:'flex', flexDirection:'column',
          background:'var(--bg-2)',
          borderRight: listMode==='open' ? '1px solid var(--sep)' : 'none',
          transition:'width 220ms cubic-bezier(0.4,0,0.2,1), min-width 220ms cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px 6px',borderBottom:'1px solid var(--sep)',flexShrink:0}}>
            <span style={{fontSize:13,fontWeight:700,color:'var(--label)',whiteSpace:'nowrap'}}>Conversas</span>
          </div>

          {/* Status pills */}
          <div style={{padding:'6px 8px',borderBottom:'1px solid var(--sep)',flexShrink:0,display:'flex',flexDirection:'column',gap:2}}>
            {[
              {key:'pendente',     label:'Pendente',    Ic:CircleDot,   color:'#f59e0b', bg:'rgba(245,158,11,0.12)',  bor:'rgba(245,158,11,0.3)'},
              {key:'em_andamento', label:'Em andamento',Ic:RefreshCw,   color:'#3b82f6', bg:'rgba(59,130,246,0.12)', bor:'rgba(59,130,246,0.3)'},
              {key:'resolvido',    label:'Resolvido',   Ic:CheckCircle, color:'#10b981', bg:'rgba(16,185,129,0.12)', bor:'rgba(16,185,129,0.3)'},
              {key:'aguardando',   label:'Aguardando',  Ic:Clock,       color:'#8b5cf6', bg:'rgba(139,92,246,0.12)', bor:'rgba(139,92,246,0.3)'},
              {key:'encerrado',    label:'Encerrado',   Ic:XCircle,     color:'#94a3b8', bg:'rgba(148,163,184,0.1)', bor:'rgba(148,163,184,0.3)'},
            ].map(({key,label,Ic,color,bg,bor})=>{
              const on=statusSel===key; const cnt=contadores[key]||0
              return (
                <button key={key} onClick={()=>setStatusSel(key)}
                  style={{
                    display:'flex',alignItems:'center',gap:6,padding:'5px 8px',borderRadius:7,
                    border:`1px solid ${on?bor:'transparent'}`,
                    background:on?bg:'transparent',cursor:'pointer',textAlign:'left',
                    transition:'all .12s', whiteSpace:'nowrap'
                  }}>
                  <Ic size={12} style={{color:on?color:'var(--label-4)',flexShrink:0}}/>
                  <span style={{flex:1,fontSize:11.5,fontWeight:600,color:on?color:'var(--label-3)'}}>{label}</span>
                  {cnt>0 && (
                    <span style={{
                      padding:'1px 6px',borderRadius:99,fontSize:9,fontWeight:700,
                      background:on?color+'25':'var(--bg-3)',
                      color:on?color:'var(--label-4)',
                    }}>{cnt}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Busca */}
          <div style={{padding:'6px 8px',borderBottom:'1px solid var(--sep)',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 8px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--bg-3)'}}>
              <Search size={11} style={{color:'var(--label-4)',flexShrink:0}}/>
              <input value={busca} onChange={e=>setBusca(e.target.value)}
                placeholder="Buscar..." style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:11.5,color:'var(--label)'}}/>
              {busca && <button onClick={()=>setBusca('')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--label-4)',display:'flex'}}><X size={11}/></button>}
            </div>
          </div>

          {/* Lista */}
          <div style={{flex:1,overflowY:'auto'}}>
            {filtradas.length===0 ? (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:120,gap:6}}>
                <MessageSquare size={16} style={{color:'var(--label-4)',opacity:.25}}/>
                <p style={{fontSize:11,color:'var(--label-4)'}}>{loading?'Carregando...':'Nenhuma conversa'}</p>
              </div>
            ) : filtradas.map(conv=>(
              <ConvCard key={conv.telefone} conv={conv} sel={selTel===conv.telefone}
                statusAtend={getStatus(conv.telefone)} nomeIA={nomeIA}
                onClick={()=>setSelTel(conv.telefone)}/>
            ))}
          </div>
        </div>
      </div>


      {/* ── CHAT (centro) ── */}
      <ChatArea conv={convSel} api={api}
        statusAtend={convSel?getStatus(convSel.telefone):'pendente'}
        onStatusChange={st=>convSel&&updateStatus(convSel.telefone,st)}
        modoManual={convSel?getModo(convSel.telefone):false}
        onToggleModo={()=>convSel&&toggleModo(convSel.telefone)}
        nomeIA={nomeIA}
        listMode={listMode}
        onToggleList={()=>setListMode(m=>m==='open'?'collapsed':'open')}/>

      {/* ── PAINEL DIREITO ── */}
      <PainelInfo conv={convSel} api={api}/>
    </div>
  )
}
