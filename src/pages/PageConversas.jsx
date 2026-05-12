import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Bot, User, Zap, Search, RefreshCw, Image,
  Paperclip, Smile, Phone, CheckCheck, Clock, X, Package,
  ShoppingBag, ChevronRight, ChevronDown, Truck, CreditCard, Tag
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const TIPO_CFG = {
  dev: { label:'Devolução', bg:'rgba(226,75,74,0.1)',   color:'var(--red)'    },
  ped: { label:'Pedido',    bg:'rgba(74,159,255,0.1)',   color:'var(--blue)'   },
  duv: { label:'Dúvida',    bg:'rgba(0,212,170,0.1)',    color:'var(--accent)' },
}

const EMOJI_CATEGORIAS = [
  { label:'😊 Expressões', emojis:['😊','😃','😄','🤩','😍','🥰','😂','🤣','😅','😁','🙂','🤗','😌','🤔','😐','🙄','😒','😔','😟','😕','😣','😫','😩','😤','😠','😡','😱','😨','😰','😥','😴','😵','🤢','🤧','😷'] },
  { label:'👍 Gestos',     emojis:['👍','👎','👌','✌️','🤞','🤙','👈','👉','👆','👇','✋','🖐️','👋','💪','🙌','👐','🤝','🙏','✍️','👏','🤏','🫶','🫂'] },
  { label:'❤️ Amor',       emojis:['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','💋','🫀'] },
  { label:'📦 Negócios',   emojis:['📦','🛍️','🛒','💳','💰','💵','🏷️','📋','📄','📊','📈','📉','📆','📌','📎','✂️','🖊️','📝','💼','🗂️','📁','📂'] },
  { label:'✅ Símbolos',   emojis:['✅','❌','⭕','🚫','⛔','💯','⚠️','♻️','✔️','❎','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🔶','🔷','🔸','🔹','🔺','🔻','💠','🔘','🔲','🔳'] },
  { label:'🚚 Entrega',    emojis:['🚚','🚛','🚜','🚗','🚕','🚌','✈️','🚀','🛸','🚁','🚢','🚤','🚂','📬','📮','📪','📫','📭','📦','🏠','🏢','🏪','🏬'] },
  { label:'⭐ Especiais',  emojis:['⭐','🌟','💫','✨','🎉','🎊','🎈','🎁','🏆','🥇','🔔','💡','🔥','❄️','🌈','☀️','🌙','⚡','🎯','🎲','🎮','🧩','🪄','🎪'] },
]

const STATUS_PEDIDO = {
  'pending':     { label: 'Pendente',      color: 'var(--orange)', bg: 'rgba(245,158,11,0.1)'  },
  'authorized':  { label: 'Autorizado',    color: 'var(--blue)',   bg: 'rgba(74,159,255,0.1)'  },
  'paid':        { label: 'Pago',          color: 'var(--accent)', bg: 'rgba(0,212,170,0.1)'   },
  'voided':      { label: 'Cancelado',     color: 'var(--red)',    bg: 'rgba(226,75,74,0.1)'   },
  'refunded':    { label: 'Reembolsado',   color: 'var(--purple)', bg: 'rgba(167,139,250,0.1)' },
  'open':        { label: 'Em aberto',     color: 'var(--orange)', bg: 'rgba(245,158,11,0.1)'  },
  'closed':      { label: 'Entregue',      color: 'var(--accent)', bg: 'rgba(0,212,170,0.1)'   },
  'cancelled':   { label: 'Cancelado',     color: 'var(--red)',    bg: 'rgba(226,75,74,0.1)'   },
  'shipped':     { label: 'Enviado',       color: 'var(--blue)',   bg: 'rgba(74,159,255,0.1)'  },
}

// Gera sugestões de resposta via IA com base no contexto
async function gerarSugestoesIA(api, telefone, ultimaMensagemCliente) {
  try {
    const r = await fetch(`${api}/api/sugestoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone, mensagem: ultimaMensagemCliente })
    })
    if (r.ok) {
      const d = await r.json()
      return d.sugestoes || []
    }
  } catch {}
  return []
}

function detectarTipo(tags = []) {
  if (tags.some(t => t.includes('devolucao'))) return 'dev'
  if (tags.some(t => t.includes('comprador') || t.includes('pedido'))) return 'ped'
  return 'duv'
}

function avatarCor(tel) {
  const cores = ['#00d4aa','#4a9fff','#a78bfa','#f59e0b','#22d3ee','#e24b4a']
  let h = 0; for (let c of (tel||'')) h = (h*31 + c.charCodeAt(0)) % cores.length
  return cores[Math.abs(h)]
}

function Avatar({ nome, telefone, size = 36, online = false }) {
  const cor = avatarCor(telefone)
  const letras = (nome && nome !== telefone) ? nome.slice(0, 2).toUpperCase() : '?'
  return (
    <div className="relative flex-shrink-0">
      <div className="rounded-full flex items-center justify-center font-bold"
        style={{ width: size, height: size, background: `${cor}20`, color: cor, fontSize: size * 0.33 }}>
        {letras}
      </div>
      {online && <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full border"
        style={{ background: 'var(--accent)', borderColor: 'var(--bg-2)' }} />}
    </div>
  )
}

// Painel lateral direito — pedidos Bling + catálogo
function PedidoCard({ pedido, telefone, api, onEnviar }) {
  const [expandido, setExpandido] = useState(false)
  const [enviando,  setEnviando]  = useState(null)

  const STATUS_CFG = {
    open:      { label:'Em aberto',    color:'var(--orange)', bg:'rgba(245,158,11,0.1)'  },
    closed:    { label:'Entregue',     color:'var(--accent)', bg:'rgba(0,212,170,0.1)'   },
    cancelled: { label:'Cancelado',    color:'var(--red)',    bg:'rgba(226,75,74,0.1)'   },
    refunded:  { label:'Devolvido',    color:'var(--purple)', bg:'rgba(167,139,250,0.1)' },
    invoiced:  { label:'NFe emitida',  color:'var(--blue)',   bg:'rgba(74,159,255,0.1)'  },
    shipped:   { label:'Enviado',      color:'var(--blue)',   bg:'rgba(74,159,255,0.1)'  },
    progress:  { label:'Em andamento', color:'var(--blue)',   bg:'rgba(74,159,255,0.1)'  },
    failed:    { label:'Não entregue', color:'var(--red)',    bg:'rgba(226,75,74,0.1)'   },
  }
  const sc = STATUS_CFG[pedido.status] || STATUS_CFG.open

  const enviar = async (acao) => {
    setEnviando(acao)
    try {
      const r = await fetch(`${api}/api/contatos/${telefone}/pedidos/${pedido.id}/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao })
      })
      const d = await r.json()
      if (d.ok) onEnviar?.(d.mensagem)
    } catch {}
    setEnviando(null)
  }

  return (
    <div className="mx-2 my-2 rounded-[10px] overflow-hidden"
      style={{ background:'var(--bg-3)', border:'1px solid var(--sep)' }}>
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <span className="text-[12px] font-bold" style={{ color:'var(--label)' }}>#{pedido.numero}</span>
            {pedido.numero_loja !== '—' && <span className="text-[9px]" style={{ color:'var(--label-4)' }}>· #{pedido.numero_loja}</span>}
          </div>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-[4px]"
            style={{ background:sc.bg, color:sc.color }}>{sc.label}</span>
        </div>
        <div className="space-y-1">
          {[
            { l:'Total',     v:`R$ ${pedido.total}`,      show:true },
            { l:'Data',      v:pedido.data,                show:true },
            { l:'Pagamento', v:pedido.forma_pagamento,     show:pedido.forma_pagamento!=='—' },
            { l:'Frete',     v:pedido.frete,               show:pedido.frete!=='—' },
            { l:'Envio',     v:pedido.transportadora,      show:pedido.transportadora!=='—' },
            { l:'Prazo',     v:pedido.prazo,               show:pedido.prazo!=='—' },
          ].filter(r=>r.show).map((r,i) => (
            <div key={i} className="flex justify-between">
              <span className="text-[9px]" style={{ color:'var(--label-4)' }}>{r.l}</span>
              <span className="text-[9px] font-medium" style={{ color:'var(--label-2)' }}>{r.v}</span>
            </div>
          ))}
          {pedido.rastreio !== '—' && (
            <div className="flex justify-between items-center pt-1 mt-1" style={{ borderTop:'1px solid var(--sep)' }}>
              <span className="text-[9px]" style={{ color:'var(--label-4)' }}>Rastreio</span>
              <span className="text-[9px] font-bold font-mono" style={{ color:'var(--blue)' }}>{pedido.rastreio}</span>
            </div>
          )}
        </div>
        {pedido.produtos?.length > 0 && (
          <button onClick={() => setExpandido(v=>!v)}
            className="w-full flex items-center justify-between mt-2 pt-2 text-[9px]"
            style={{ borderTop:'1px solid var(--sep)', color:'var(--label-3)' }}>
            <span>{pedido.itens}</span>
            {expandido ? <ChevronDown size={10}/> : <ChevronDown size={10} style={{ transform:'rotate(-90deg)' }}/>}
          </button>
        )}
        {expandido && pedido.produtos?.map((prod,i) => (
          <div key={i} className="mt-1.5 p-2 rounded-[7px]" style={{ background:'var(--bg-2)' }}>
            <div className="text-[9px] leading-tight" style={{ color:'var(--label)' }}>{prod.nome}</div>
            <div className="text-[8px] mt-0.5" style={{ color:'var(--label-4)' }}>{prod.qtd}x · R$ {prod.preco}</div>
          </div>
        ))}
      </div>
      {/* Botões de ação */}
      <div className="px-2 pb-2 flex gap-1">
        <button onClick={() => enviar('resumo')} disabled={!!enviando}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-[7px] text-[9px] font-semibold"
          style={{ background:'rgba(0,212,170,0.1)', color:'var(--accent)', border:'1px solid rgba(0,212,170,0.2)' }}>
          {enviando==='resumo' ? <RefreshCw size={9} className="animate-spin"/> : <Send size={9}/>} Resumo
        </button>
        {pedido.rastreio !== '—' && (
          <button onClick={() => enviar('rastreio')} disabled={!!enviando}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-[7px] text-[9px] font-semibold"
            style={{ background:'rgba(74,159,255,0.1)', color:'var(--blue)', border:'1px solid rgba(74,159,255,0.2)' }}>
            {enviando==='rastreio' ? <RefreshCw size={9} className="animate-spin"/> : <Truck size={9}/>} Rastreio
          </button>
        )}
        {pedido.produtos?.length > 0 && (
          <button onClick={() => enviar('produtos')} disabled={!!enviando}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-[7px] text-[9px] font-semibold"
            style={{ background:'rgba(167,139,250,0.1)', color:'var(--purple)', border:'1px solid rgba(167,139,250,0.2)' }}>
            {enviando==='produtos' ? <RefreshCw size={9} className="animate-spin"/> : <Package size={9}/>} Produtos
          </button>
        )}
      </div>
    </div>
  )
}

function PainelCliente({ sel, api }) {
  const [aba,       setAba]      = useState('pedidos')
  const [pedidos,   setPedidos]  = useState([])
  const [produtos,  setProdutos] = useState([])
  const [buscaProd, setBuscaProd]= useState('')
  const [loading,   setLoading]  = useState(false)
  const [aviso,     setAviso]    = useState('')
  const [enviado,   setEnviado]  = useState('')

  useEffect(() => {
    if (!sel?.telefone) return
    setLoading(true); setPedidos([]); setAviso('')
    fetch(`${api}/api/contatos/${sel.telefone}/pedidos`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setPedidos(d?.pedidos||[]); setAviso(d?.aviso||''); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sel?.telefone, api])

  useEffect(() => {
    if (aba !== 'catalogo' || !buscaProd.trim()) return
    const t = setTimeout(() => {
      fetch(`${api}/api/fase5/portfolio?q=${encodeURIComponent(buscaProd)}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => setProdutos(d?.produtos||[]))
        .catch(() => {})
    }, 400)
    return () => clearTimeout(t)
  }, [buscaProd, aba, api])

  return (
    <div className="flex flex-col overflow-hidden" style={{ background:'var(--bg-2)', borderLeft:'1px solid var(--sep)', width:210, flexShrink:0 }}>
      <div className="flex border-b flex-shrink-0" style={{ borderColor:'var(--sep)' }}>
        {[['pedidos','Pedidos'],['catalogo','Catálogo'],['perfil','Perfil']].map(([v,l]) => (
          <button key={v} onClick={() => setAba(v)}
            className="flex-1 py-2 text-[10px] font-semibold transition-all"
            style={{ color:aba===v?'var(--accent)':'var(--label-4)', borderBottom:`2px solid ${aba===v?'var(--accent)':'transparent'}`, background:'transparent' }}>
            {l}
          </button>
        ))}
      </div>
      {enviado && (
        <div className="px-3 py-1.5 text-[10px] font-semibold text-center"
          style={{ background:'rgba(0,212,170,0.1)', color:'var(--accent)' }}>{enviado}</div>
      )}
      <div className="flex-1 overflow-y-auto scroll-hidden">
        {aba === 'pedidos' && (
          <div>
            {aviso && (
              <div className="mx-2 mt-2 px-3 py-2 rounded-[8px] text-[9px]"
                style={{ background:'rgba(245,158,11,0.1)', color:'var(--orange)', border:'1px solid rgba(245,158,11,0.2)' }}>
                {aviso}
              </div>
            )}
            {loading && <div className="flex justify-center py-6" style={{ color:'var(--label-3)' }}><RefreshCw size={13} className="animate-spin"/></div>}
            {!loading && pedidos.length === 0 && (
              <div className="flex flex-col items-center py-8 px-4 text-center">
                <ShoppingBag size={22} className="mb-2 opacity-30" style={{ color:'var(--label-3)' }}/>
                <p className="text-[11px]" style={{ color:'var(--label-3)' }}>Nenhum pedido encontrado</p>
                <p className="text-[10px] mt-1" style={{ color:'var(--label-4)' }}>Vincule CPF ao contato para filtrar</p>
              </div>
            )}
            {pedidos.map((p,i) => (
              <PedidoCard key={p.id||i} pedido={p} telefone={sel.telefone} api={api}
                onEnviar={msg => { setEnviado('✓ Enviado no chat!'); setTimeout(()=>setEnviado(''),3000) }} />
            ))}
          </div>
        )}
        {aba === 'catalogo' && (
          <div>
            <div className="p-2 border-b" style={{ borderColor:'var(--sep)' }}>
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color:'var(--label-3)' }}/>
                <input value={buscaProd} onChange={e=>setBuscaProd(e.target.value)} placeholder="Buscar produto..."
                  className="w-full pl-7 pr-2 py-1.5 rounded-[8px] text-[10px] outline-none"
                  style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
              </div>
            </div>
            {produtos.length === 0 && (
              <div className="flex flex-col items-center py-8 px-4 text-center">
                <Package size={22} className="mb-2 opacity-30" style={{ color:'var(--label-3)' }}/>
                <p className="text-[11px]" style={{ color:'var(--label-3)' }}>{buscaProd?'Nenhum produto':'Digite para buscar'}</p>
              </div>
            )}
            {produtos.map((p,i) => (
              <div key={p.id||i} className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor:'var(--sep)' }}>
                <div className="w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0"
                  style={{ background:'var(--bg-3)', border:'1px solid var(--sep)' }}>
                  {p.imagem ? <img src={p.imagem} alt="" className="w-full h-full object-cover rounded-[6px]"/>
                            : <Package size={12} style={{ color:'var(--label-3)' }}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium truncate" style={{ color:'var(--label)' }}>{p.nome}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold" style={{ color:'var(--accent)' }}>R$ {parseFloat(p.preco||0).toFixed(2)}</span>
                    <span className="text-[9px]" style={{ color:p.disponivel?'var(--accent)':'var(--red)' }}>{p.disponivel?`${p.estoque} un.`:'Sem estoque'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {aba === 'perfil' && sel && (
          <div className="p-3 space-y-3">
            <div className="rounded-[10px] p-3 text-center" style={{ background:'var(--bg-3)', border:'1px solid var(--sep)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] mx-auto mb-2"
                style={{ background:'rgba(0,212,170,0.15)', color:'var(--accent)' }}>
                {(sel.nome||sel.telefone).slice(0,2).toUpperCase()}
              </div>
              <div className="text-[12px] font-semibold" style={{ color:'var(--label)' }}>{sel.nome||'Sem nome'}</div>
              <div className="text-[10px] font-mono mt-0.5" style={{ color:'var(--label-3)' }}>{sel.telefone}</div>
            </div>
            {[{l:'Total msgs',v:sel.total_msgs||0},{l:'Última',v:sel.ultima_msg?new Date(sel.ultima_msg).toLocaleDateString('pt-BR'):'—'}].map((r,i)=>(
              <div key={i} className="flex justify-between px-1">
                <span className="text-[10px]" style={{ color:'var(--label-4)' }}>{r.l}</span>
                <span className="text-[10px] font-medium" style={{ color:'var(--label-2)' }}>{r.v}</span>
              </div>
            ))}
            {(sel.tags||[]).length>0&&(
              <div className="flex flex-wrap gap-1">
                {sel.tags.map((t,i)=>(
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-[4px]"
                    style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PageConversas({ api: apiProp }) {
  const api = apiProp || BASE
  const [convs,      setConvs]      = useState([])
  const [sel,        setSel]        = useState(null)
  const [tab,        setTab]        = useState('todas')
  const [busca,      setBusca]      = useState('')
  const [msgs,       setMsgs]       = useState([])
  const [input,      setInput]      = useState('')
  const [modeMap,    setModeMap]    = useState({})
  const [statusMap,  setStatusMap]  = useState({})
  const [sending,      setSending]      = useState(false)
  const [pollingPausado, setPollingPausado] = useState(false)
  const [sugestoes,  setSugestoes]  = useState([])
  const [usedSugs,   setUsedSugs]   = useState(new Set())
  const [showEmoji,  setShowEmoji]  = useState(false)
  const [emojiCat,    setEmojiCat]    = useState(0)
  const [showMedia,  setShowMedia]  = useState(false)
  const [mediaUrl,   setMediaUrl]   = useState('')
  const [mediaTipo,  setMediaTipo]  = useState('image')
  const [loadingH,   setLoadingH]   = useState(false)
  const chatRef  = useRef(null)
  const inputRef = useRef(null)
  const fileRef  = useRef(null)

  const carregarConvs = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/dashboard/conversas`)
      if (r.ok) { const d = await r.json(); setConvs(d.conversas || []) }
    } catch {}
  }, [api])

  useEffect(() => {
    carregarConvs()
    const i = setInterval(carregarConvs, 8000)
    return () => clearInterval(i)
  }, [carregarConvs])

  const carregarHistorico = useCallback(async (telefone, inicial = false) => {
    if (inicial) { setLoadingH(true); setMsgs([]) }
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${telefone}`)
      if (!r.ok) return
      const d = await r.json()
      const conv = (d.mensagens || []).map(m => ({
        id: String(m.id),
        r:  m.direcao === 'entrada' ? 'u' : m.modo === 'manual' ? 'm' : 'b',
        t:  m.mensagem || '',
        h:  m.hora || '--:--',
      }))
      setMsgs(prev => {
        // Só atualiza se mudou algo
        const ultimaBanco = conv[conv.length-1]?.t || ''
        const ultimaLocal = prev.filter(m=>!String(m.id||'').startsWith('local-')).slice(-1)[0]?.t || ''
        const mesmoConteudo = conv.length === prev.filter(m=>!String(m.id||'').startsWith('local-')).length && ultimaBanco === ultimaLocal
        if (mesmoConteudo && !inicial) return prev

        // Mantém mensagens locais pendentes que ainda não chegaram no banco
        const idsBanco  = new Set(conv.map(m => m.id))
        const txtBanco  = new Set(conv.map(m => m.t?.trim()))
        const pendentes = prev.filter(m =>
          String(m.id||'').startsWith('local-') && !txtBanco.has(m.t?.trim())
        )
        const resultado = [...conv, ...pendentes]
        if (resultado.length > prev.length || inicial) {
          setTimeout(() => chatRef.current?.scrollTo({ top:99999, behavior:'smooth' }), 80)
          // Se chegou mensagem nova do cliente, volta status para pendente
          const ultimaMsg = conv[conv.length-1]
          if (ultimaMsg?.r === 'u' && !inicial) {
            setStatusMap(m => ({ ...m, [telefone]: 'pendente' }))
          }
        }
        return resultado
      })
    } catch {}
    if (inicial) setLoadingH(false)
  }, [api])

  useEffect(() => {
    if (!sel) return
    carregarHistorico(sel.telefone, true)
    const i = setInterval(() => carregarHistorico(sel.telefone, false), 3000)
    return () => clearInterval(i)
  }, [sel?.telefone])

  useEffect(() => { chatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }) }, [msgs])

  const isManual = (modeMap[sel?.telefone] || 'auto') === 'manual'

  const selecionarConv = useCallback(async (c) => {
    setSel(c); carregarHistorico(c.telefone, true)
    setInput(''); setUsedSugs(new Set()); setShowEmoji(false)
    // Carrega modo atual do banco
    try {
      const r = await fetch(`${api}/api/contatos/${c.telefone}`)
      if (r.ok) {
        const d = await r.json()
        if (d.modo) setModeMap(m => ({ ...m, [c.telefone]: d.modo }))
      }
    } catch {}
    // Carrega status atual
    try {
      const r2 = await fetch(`${api}/api/fase5/conversas/${c.telefone}/status`)
      if (r2.ok) {
        const d2 = await r2.json()
        if (d2.status) setStatusMap(m => ({ ...m, [c.telefone]: d2.status }))
      }
    } catch {}
  }, [carregarHistorico, api])

  useEffect(() => {
    if (!isManual || !sel) { setSugestoes([]); return }
    setUsedSugs(new Set())
    // Busca sugestões dinâmicas baseadas na última mensagem do cliente
    const ultimaDoCliente = msgs.filter(m => m.r === 'u').slice(-1)[0]?.t
    if (ultimaDoCliente) {
      gerarSugestoesIA(api, sel.telefone, ultimaDoCliente)
        .then(sugs => { if (sugs.length > 0) setSugestoes(sugs) })
    }
  }, [isManual, sel, msgs])

  const toggleMode = async () => {
    const novoModo = isManual ? 'auto' : 'manual'
    setModeMap(m => ({ ...m, [sel.telefone]: novoModo }))
    // Persiste no banco
    try {
      await fetch(`${api}/api/contatos/${sel.telefone}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo: novoModo })
      })
    } catch {}
  }

  const send = async (texto) => {
    const t = (texto || input).trim()
    if (!t || sending || !sel) return
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setMsgs(prev => [...prev, { id: `local-${Date.now()}`, r: 'm', t, h: hora }])
    setInput(''); setUsedSugs(new Set()); setShowEmoji(false)
    setSending(true)
    try {
      await fetch(`${api}/api/dashboard/enviar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: sel.telefone, mensagem: t })
      })
      setTimeout(() => carregarHistorico(sel.telefone, false), 1500)
    } catch {}
    setSending(false)
  }

  const filtered = convs
    .filter(c => {
      const tipo = detectarTipo(c.tags || [])
      if (tab === 'dev') return tipo === 'dev'
      if (tab === 'ped') return tipo === 'ped'
      return true
    })
    .filter(c => !busca ||
      (c.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
      c.telefone.includes(busca))

  const convStatus = (tel) => statusMap[tel] || 'pendente'

  return (
    <div className="h-full flex overflow-hidden">

      {/* Lista */}
      <div className="w-[240px] flex-shrink-0 flex flex-col" style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--sep)' }}>
        <div className="px-3 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--sep)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--label)' }}>Conversas</h2>
            <button onClick={carregarConvs} style={{ color: 'var(--label-3)' }}><RefreshCw size={12} /></button>
          </div>
          <div className="relative mb-2.5">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--label-3)' }} />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..."
              className="w-full pl-7 pr-2 py-1.5 rounded-[8px] text-[11px] outline-none"
              style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)', color: 'var(--label)' }} />
          </div>
          <div className="flex p-0.5 rounded-[8px]" style={{ background: 'var(--fill)' }}>
            {[['todas','Todas'],['ped','Pedidos'],['dev','Devol.']].map(([v,l]) => (
              <button key={v} onClick={() => setTab(v)}
                className="flex-1 py-1 rounded-[6px] text-[10px] font-medium transition-all"
                style={{ background: tab===v?'var(--bg-2)':'transparent', color: tab===v?'var(--label)':'var(--label-4)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-hidden">
          {filtered.map(c => {
            const tc  = TIPO_CFG[detectarTipo(c.tags||[])]
            const ac  = sel?.telefone === c.telefone
            const cor = avatarCor(c.telefone)
            const st  = convStatus(c.telefone)
            return (
              <button key={c.telefone} onClick={() => selecionarConv(c)}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-l-2 transition-all"
                style={{ borderBottomColor:'var(--sep)', borderLeftColor: ac?'var(--accent)':'transparent', background: ac?'rgba(0,212,170,0.05)':'transparent' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                  style={{ background: `${cor}20`, color: cor }}>
                  {(c.nome||c.telefone).slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--label)' }}>
                      {c.nome || c.telefone}
                    </span>
                    <span className="text-[9px] flex-shrink-0" style={{ color: 'var(--label-4)' }}>
                      {c.ultima_msg ? new Date(c.ultima_msg).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : ''}
                    </span>
                  </div>
                  <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--label-3)' }}>
                    {c.ultima_direcao==='saida'?'↩ ':''}{c.ultima_mensagem?.slice(0,38) || `${c.total_msgs||0} msgs`}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-[3px]"
                      style={{ background: tc.bg, color: tc.color }}>{tc.label}</span>
                    <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-[3px]"
                      style={{ background: st==='concluida'?'rgba(0,212,170,0.1)':'rgba(245,158,11,0.1)', color: st==='concluida'?'var(--accent)':'var(--orange)' }}>
                      {st==='concluida'?'✓ Concluída':'⏳ Pendente'}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-[12px]" style={{ color: 'var(--label-3)' }}>
              Nenhuma conversa
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!sel ? (
          <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
            <div className="text-center" style={{ color: 'var(--label-3)' }}>
              <Phone size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-[13px]" style={{ color: 'var(--label-2)' }}>Selecione uma conversa</p>
            </div>
          </div>
        ) : <>
          {/* Header chat */}
          <div className="px-4 py-2.5 flex items-center gap-3 flex-shrink-0"
            style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--sep)' }}>
            <Avatar nome={sel.nome} telefone={sel.telefone} size={34} online />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold" style={{ color: 'var(--label)' }}>{sel.nome||'Cliente'}</div>
              <div className="text-[10px] font-mono" style={{ color: 'var(--label-4)' }}>
                {sel.telefone} · {sel.total_msgs||0} msgs
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-1.5">
              {['pendente','concluida'].map(s => (
                <button key={s} onClick={async () => {
                  setStatusMap(m => ({...m,[sel.telefone]:s}))
                  try {
                    await fetch(`${api}/api/fase5/conversas/${sel.telefone}/status`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: s })
                    })
                  } catch {}
                }}
                  className="text-[9px] font-bold px-2 py-1 rounded-[5px] transition-all"
                  style={{
                    background: convStatus(sel.telefone)===s
                      ? s==='concluida' ? 'rgba(0,212,170,0.15)' : 'rgba(245,158,11,0.15)'
                      : 'var(--fill)',
                    color: convStatus(sel.telefone)===s
                      ? s==='concluida' ? 'var(--accent)' : 'var(--orange)'
                      : 'var(--label-4)',
                    border: `1px solid ${convStatus(sel.telefone)===s
                      ? s==='concluida' ? 'rgba(0,212,170,0.3)' : 'rgba(245,158,11,0.3)'
                      : 'var(--sep)'}`,
                  }}>
                  {s==='concluida'?'✓ Concluída':'⏳ Pendente'}
                </button>
              ))}
            </div>

            {/* Toggle IA/Manual */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px]"
              style={{ background: 'var(--fill)', border:`1px solid ${isManual?'rgba(74,159,255,0.25)':'rgba(0,212,170,0.2)'}` }}>
              <span className="text-[10px] font-semibold" style={{ color: isManual?'var(--blue)':'var(--accent)' }}>
                {isManual ? '👤 Manual' : '🤖 IA ativa'}
              </span>
              <button onClick={toggleMode}
                style={{ width:36, height:20, borderRadius:10, background:isManual?'var(--blue)':'var(--accent)', transition:'background .2s', position:'relative' }}>
                <span style={{
                  position:'absolute', top:2, width:16, height:16, background:'#fff',
                  borderRadius:8, transition:'left .2s', left:isManual?'calc(100% - 18px)':'2px'
                }}/>
              </button>
            </div>
          </div>

          {/* Faixa modo */}
          {isManual ? (
            <div className="px-4 py-1.5 flex items-center gap-2 text-[10px] flex-shrink-0"
              style={{ background:'rgba(74,159,255,0.05)', borderBottom:'1px solid rgba(74,159,255,0.1)', color:'var(--blue)' }}>
              <User size={10} /> Modo Manual — você está respondendo. IA em pausa.
            </div>
          ) : (
            <div className="px-4 py-1.5 flex items-center gap-2 text-[10px] flex-shrink-0"
              style={{ background:'rgba(0,212,170,0.04)', borderBottom:'1px solid rgba(0,212,170,0.1)', color:'var(--accent)' }}>
              <Bot size={10} /> IA gerenciando automaticamente.
              <button onClick={toggleMode} className="ml-auto text-[10px] underline font-semibold">Assumir</button>
            </div>
          )}

          {/* Mensagens */}
          <div ref={chatRef} className="flex-1 overflow-y-auto scroll-hidden px-4 py-3 space-y-2"
            style={{ background: 'var(--bg)' }}>
            {loadingH && (
              <div className="flex justify-center py-4" style={{ color:'var(--label-3)' }}>
                <RefreshCw size={13} className="animate-spin" />
              </div>
            )}
            {msgs.map((m, i) => {
              const isBot=m.r==='b', isUser=m.r==='u', isMe=m.r==='m'
              return (
                <div key={i} className={`flex gap-2 ${isUser||isMe?'justify-end':'justify-start'}`}>
                  {isBot && (
                    <div className="rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 mt-auto"
                      style={{ width:22, height:22, background:'rgba(0,212,170,0.15)', color:'var(--accent)' }}>IA</div>
                  )}
                  <div className="max-w-[74%]">
                    {isBot && <div className="flex items-center gap-1 mb-0.5"><Zap size={8} style={{color:'var(--accent)'}}/><span className="text-[9px] font-bold" style={{color:'var(--accent)'}}>Bia IA</span></div>}
                    {isMe  && <div className="flex items-center justify-end gap-1 mb-0.5"><span className="text-[9px] font-bold" style={{color:'var(--blue)'}}>Você</span></div>}
                    <div className="px-3 py-2 text-[12px] leading-relaxed whitespace-pre-line rounded-[16px]"
                      style={{
                        background: isUser?'rgba(74,159,255,0.15)': isMe?'rgba(74,159,255,0.1)':'var(--bg-2)',
                        color: isUser?'#c0d8ff': isMe?'var(--blue)':'var(--label)',
                        borderBottomLeftRadius:  isBot?3:16,
                        borderBottomRightRadius: (isUser||isMe)?3:16,
                        border: (isBot||isMe)?'1px solid var(--sep)':'1px solid rgba(74,159,255,0.15)',
                      }}>
                      {m.t}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 px-1 ${isUser||isMe?'justify-end':''}`}>
                      <span className="text-[9px]" style={{color:'var(--label-4)'}}>{m.h}</span>
                    </div>
                  </div>
                  {isUser && <Avatar nome={sel.nome} telefone={sel.telefone} size={22} />}
                </div>
              )
            })}
          </div>

          {/* Sugestões IA */}
          {isManual && sugestoes.length > 0 && (
            <div className="flex-shrink-0 px-3 py-2" style={{ borderTop:'1px solid var(--sep)', background:'var(--bg-2)' }}>
              <div className="flex items-center gap-1 mb-1.5">
                <Zap size={9} style={{color:'var(--accent)'}}/><span className="text-[9px] font-semibold" style={{color:'var(--label-4)'}}>Sugestões IA</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto scroll-hidden pb-0.5">
                {sugestoes.map((s, i) => {
                  const used = usedSugs.has(s)
                  return (
                    <button key={i} onClick={() => { setInput(s); setUsedSugs(p => new Set([...p, s])); inputRef.current?.focus() }}
                      className="flex-shrink-0 text-[10px] px-2.5 py-1.5 rounded-full border transition-all whitespace-nowrap"
                      style={{ background:used?'rgba(0,212,170,0.08)':'var(--fill)', borderColor:used?'rgba(0,212,170,0.3)':'var(--sep)', color:used?'var(--accent)':'var(--label-3)', fontWeight:used?600:400 }}>
                      {used?'✓ ':''}{s}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Emoji picker */}
          {/* Modal de mídia */}
          {showMedia && (
            <div className="flex-shrink-0 px-4 py-3 space-y-2" style={{ borderTop:'1px solid var(--sep)', background:'var(--bg-3)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-semibold" style={{ color:'var(--label)' }}>Enviar Mídia</span>
                <button onClick={() => setShowMedia(false)} style={{ color:'var(--label-3)' }}><X size={14}/></button>
              </div>
              <div className="flex gap-2">
                {[['image','🖼️ Imagem'],['video','🎥 Vídeo'],['document','📄 Documento'],['audio','🎵 Áudio']].map(([v,l])=>(
                  <button key={v} onClick={() => setMediaTipo(v)}
                    className="px-2.5 py-1.5 rounded-[8px] text-[11px] font-medium border transition-all"
                    style={{ background:mediaTipo===v?'var(--accent-dim)':'transparent', borderColor:mediaTipo===v?'var(--accent-border)':'var(--sep)', color:mediaTipo===v?'var(--accent)':'var(--label-2)' }}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)}
                  placeholder="URL da mídia (https://...)"
                  className="flex-1 px-3 py-2 rounded-[9px] text-[12px] outline-none"
                  style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', color:'var(--label)' }} />
                <button onClick={async () => {
                  if (!mediaUrl.trim() || !sel) return
                  const msg = `[${mediaTipo}: ${mediaUrl}]`
                  await fetch(`${api}/api/dashboard/enviar`, {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({ telefone:sel.telefone, mensagem:mediaUrl })
                  })
                  setMsgs(prev => [...prev, { r:'m', t:msg, h:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), status:'sent' }])
                  setMediaUrl(''); setShowMedia(false)
                }} disabled={!mediaUrl.trim()}
                  className="px-3 py-2 rounded-[9px] text-[12px] font-semibold"
                  style={{ background:'var(--accent)', color:'#000', opacity:!mediaUrl.trim()?0.5:1 }}>
                  Enviar
                </button>
              </div>
              <p className="text-[10px]" style={{ color:'var(--label-4)' }}>
                Cole a URL da mídia. Para imagens locais, use um serviço como imgur.com ou imgbb.com
              </p>
            </div>
          )}

          {showEmoji && (
            <div className="flex-shrink-0" style={{ borderTop:'1px solid var(--sep)', background:'var(--bg-3)', maxHeight:220, overflow:'hidden', display:'flex', flexDirection:'column' }}>
              {/* Abas de categoria */}
              <div className="flex overflow-x-auto scroll-hidden px-2 pt-2 gap-1 flex-shrink-0">
                {EMOJI_CATEGORIAS.map((cat, ci) => (
                  <button key={ci}
                    onClick={() => setEmojiCat(ci)}
                    className="flex-shrink-0 text-[11px] px-2 py-1 rounded-[6px] transition-all"
                    style={{ background: emojiCat===ci ? 'var(--accent-dim)' : 'var(--fill)', color: emojiCat===ci ? 'var(--accent)' : 'var(--label-3)' }}>
                    {cat.label.split(' ')[0]}
                  </button>
                ))}
              </div>
              {/* Emojis da categoria selecionada */}
              <div className="flex flex-wrap gap-1 p-2 overflow-y-auto scroll-hidden">
                {(EMOJI_CATEGORIAS[emojiCat]?.emojis || []).map(e => (
                  <button key={e} onClick={() => { setInput(p=>p+e); inputRef.current?.focus() }}
                    className="text-[18px] w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-[var(--fill)] transition-all">
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-2.5 flex-shrink-0" style={{ background:'var(--bg-2)', borderTop:'1px solid var(--sep)' }}>
            {isManual ? (
              <div className="flex items-end gap-2">
                <button onClick={() => { setShowEmoji(v=>!v); setShowMedia(false) }}
                  className="p-1.5 rounded-[7px] flex-shrink-0"
                  style={{ color:'var(--label-3)', background:showEmoji?'var(--fill)':'transparent' }}>
                  <Smile size={15}/>
                </button>
                <button onClick={() => { setShowMedia(v=>!v); setShowEmoji(false) }}
                  className="p-1.5 rounded-[7px] flex-shrink-0"
                  title="Enviar mídia por URL"
                  style={{ color:'var(--label-3)', background:showMedia?'var(--fill)':'transparent' }}>
                  <Paperclip size={15}/>
                </button>
                <button onClick={() => fileRef.current?.click()}
                  className="p-1.5 rounded-[7px] flex-shrink-0"
                  title="Enviar arquivo local"
                  style={{ color:'var(--label-3)' }}>
                  <Image size={15}/>
                </button>
                <input ref={fileRef} type="file" accept="image/*,video/*,application/pdf,.doc,.docx"
                  className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    // Mostra nome do arquivo no chat localmente
                    const msg = `[Arquivo: ${file.name}]`
                    setMsgs(prev => [...prev, { r:'m', t:msg, h:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), status:'sent' }])
                    setInput(prev => prev + (prev ? '\n' : '') + msg)
                    e.target.value = ''
                  }}
                />
                <div className="flex-1 flex items-end px-3 py-2 rounded-[14px]"
                  style={{ background:'var(--bg-3)', border:'1px solid var(--sep)' }}>
                  <textarea ref={inputRef} value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }}
                    placeholder="Mensagem manual... (Enter envia)"
                    rows={1}
                    className="flex-1 bg-transparent resize-none outline-none text-[12px] leading-relaxed scroll-hidden"
                    style={{ color:'var(--label)', maxHeight:90, minHeight:20 }}
                    onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,90)+'px' }}
                  />
                </div>
                <button onClick={() => send()}
                  disabled={!input.trim()||sending}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background:input.trim()&&!sending?'var(--accent)':'var(--fill)', color:input.trim()&&!sending?'#000':'var(--label-3)' }}>
                  {sending?<RefreshCw size={14} className="animate-spin"/>:<Send size={14}/>}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color:'var(--label-3)' }}>IA gerenciando — ative manual para responder</span>
                <button onClick={toggleMode}
                  className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold"
                  style={{ background:'rgba(74,159,255,0.1)', color:'var(--blue)', border:'1px solid rgba(74,159,255,0.2)' }}>
                  Assumir
                </button>
              </div>
            )}
          </div>
        </>}
      </div>

      {/* Painel lateral Bling/Catálogo */}
      {sel && <PainelCliente sel={sel} api={api} />}
    </div>
  )
}
