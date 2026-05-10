import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Bot, User, Zap, Search, RefreshCw, Image,
  Paperclip, Smile, Phone, CheckCheck, Clock, X, Package,
  ShoppingBag, ChevronRight, Star, Truck, CreditCard, Tag
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const TIPO_CFG = {
  dev: { label:'Devolução', bg:'rgba(226,75,74,0.1)',   color:'var(--red)'    },
  ped: { label:'Pedido',    bg:'rgba(74,159,255,0.1)',   color:'var(--blue)'   },
  duv: { label:'Dúvida',    bg:'rgba(0,212,170,0.1)',    color:'var(--accent)' },
}

const SUGESTOES = {
  dev: ['Qual o número do pedido?','Pode enviar uma foto?','Vou abrir a devolução agora!'],
  ped: ['Qual produto você procura?','Vou verificar o estoque!','Qual forma de pagamento prefere?'],
  duv: ['Claro, deixa eu verificar!','Pode me dar mais detalhes?','Vou te ajudar agora! 😊'],
}

const EMOJI_COMUNS = ['😊','👍','🙏','💚','📦','🔍','✅','❌','⏳','🎉','💰','📬','🚚','⭐']

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
function PainelCliente({ sel, api }) {
  const [aba,      setAba]      = useState('pedidos')
  const [pedidos,  setPedidos]  = useState([])
  const [produtos, setProdutos] = useState([])
  const [buscaProd,setBuscaProd]= useState('')
  const [loading,  setLoading]  = useState(false)

  // Busca pedidos do Bling via backend
  useEffect(() => {
    if (!sel?.telefone) return
    setLoading(true)
    fetch(`${api}/api/contatos/${sel.telefone}/pedidos`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setPedidos(d?.pedidos || d || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sel?.telefone, api])

  // Busca catálogo Nuvemshop
  useEffect(() => {
    if (aba !== 'catalogo' || !buscaProd.trim()) return
    const t = setTimeout(() => {
      fetch(`${api}/api/fase5/portfolio?q=${encodeURIComponent(buscaProd)}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => setProdutos(d?.produtos || []))
        .catch(() => {})
    }, 400)
    return () => clearTimeout(t)
  }, [buscaProd, aba, api])

  const statusCfg = (s) => STATUS_PEDIDO[s] || { label: s || 'Desconhecido', color: 'var(--label-3)', bg: 'var(--fill)' }

  return (
    <div className="flex flex-col overflow-hidden" style={{ background: 'var(--bg-2)', borderLeft: '1px solid var(--sep)', width: 210 }}>
      {/* Abas */}
      <div className="flex border-b flex-shrink-0" style={{ borderColor: 'var(--sep)' }}>
        {[['pedidos','Pedidos'],['catalogo','Catálogo'],['perfil','Perfil']].map(([v,l]) => (
          <button key={v} onClick={() => setAba(v)}
            className="flex-1 py-2 text-[10px] font-semibold transition-all"
            style={{
              color: aba === v ? 'var(--accent)' : 'var(--label-4)',
              borderBottom: `2px solid ${aba === v ? 'var(--accent)' : 'transparent'}`,
              background: 'transparent',
            }}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scroll-hidden">

        {/* PEDIDOS */}
        {aba === 'pedidos' && (
          <div className="p-0">
            {loading && (
              <div className="flex justify-center py-6" style={{ color: 'var(--label-3)' }}>
                <RefreshCw size={13} className="animate-spin" />
              </div>
            )}
            {!loading && pedidos.length === 0 && (
              <div className="flex flex-col items-center py-8 px-4 text-center">
                <ShoppingBag size={22} className="mb-2 opacity-30" style={{ color: 'var(--label-3)' }} />
                <p className="text-[11px]" style={{ color: 'var(--label-3)' }}>Nenhum pedido encontrado</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--label-4)' }}>Verifique a integração Bling</p>
              </div>
            )}
            {pedidos.map((p, i) => {
              const sc = statusCfg(p.status || p.status_pagamento || 'open')
              return (
                <div key={p.id || i} className="mx-3 my-2 rounded-[10px] p-3"
                  style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold" style={{ color: 'var(--label)' }}>
                      #{p.numero || p.number || p.id}
                    </span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-[4px]"
                      style={{ background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {[
                      { icon: CreditCard, l: 'Valor',     v: `R$ ${parseFloat(p.total || 0).toFixed(2)}` },
                      { icon: CreditCard, l: 'Pagamento', v: p.forma_pagamento || p.payment_status || '—' },
                      { icon: Truck,      l: 'Envio',     v: p.transportadora || p.shipping_method || '—' },
                      { icon: Package,    l: 'Rastreio',  v: p.rastreio || p.tracking_number || '—', link: true },
                      { icon: ShoppingBag,l: 'Itens',    v: p.itens || p.items_count || (p.produtos?.length ? `${p.produtos.length} produto(s)` : '—') },
                      { icon: Clock,      l: 'Data',      v: p.data || (p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—') },
                    ].map((row, j) => (
                      <div key={j} className="flex justify-between items-center">
                        <span className="text-[9px]" style={{ color: 'var(--label-4)' }}>{row.l}</span>
                        <span className="text-[9px] font-medium max-w-[100px] truncate text-right"
                          style={{ color: row.link && row.v !== '—' ? 'var(--blue)' : 'var(--label-2)' }}>
                          {row.v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* CATÁLOGO */}
        {aba === 'catalogo' && (
          <div>
            <div className="p-2 border-b" style={{ borderColor: 'var(--sep)' }}>
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--label-3)' }} />
                <input value={buscaProd} onChange={e => setBuscaProd(e.target.value)}
                  placeholder="Buscar produto..."
                  className="w-full pl-7 pr-2 py-1.5 rounded-[8px] text-[10px] outline-none"
                  style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)', color: 'var(--label)' }} />
              </div>
            </div>
            {produtos.length === 0 && (
              <div className="flex flex-col items-center py-8 px-4 text-center">
                <Package size={22} className="mb-2 opacity-30" style={{ color: 'var(--label-3)' }} />
                <p className="text-[11px]" style={{ color: 'var(--label-3)' }}>
                  {buscaProd ? 'Nenhum produto encontrado' : 'Digite para buscar'}
                </p>
              </div>
            )}
            {produtos.map((p, i) => (
              <div key={p.id || i} className="flex items-center gap-2 px-3 py-2.5 border-b"
                style={{ borderColor: 'var(--sep)' }}>
                <div className="w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)' }}>
                  {p.imagem ? (
                    <img src={p.imagem} alt="" className="w-full h-full object-cover rounded-[6px]" />
                  ) : (
                    <Package size={12} style={{ color: 'var(--label-3)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium truncate" style={{ color: 'var(--label)' }}>{p.nome}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>
                      R$ {parseFloat(p.preco || 0).toFixed(2)}
                    </span>
                    <span className="text-[9px]" style={{ color: p.disponivel ? 'var(--accent)' : 'var(--red)' }}>
                      {p.disponivel ? `${p.estoque} un.` : 'Sem estoque'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PERFIL */}
        {aba === 'perfil' && sel && (
          <div className="p-3 space-y-3">
            <div className="rounded-[10px] p-3 text-center" style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)' }}>
              <Avatar nome={sel.nome} telefone={sel.telefone} size={44} />
              <div className="text-[12px] font-semibold mt-2" style={{ color: 'var(--label)' }}>
                {sel.nome || 'Sem nome'}
              </div>
              <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--label-3)' }}>
                {sel.telefone}
              </div>
            </div>
            <div className="space-y-2">
              {[
                { l: 'Total mensagens', v: sel.total_msgs || 0 },
                { l: 'Última interação', v: sel.ultima_msg ? new Date(sel.ultima_msg).toLocaleDateString('pt-BR') : '—' },
              ].map((r, i) => (
                <div key={i} className="flex justify-between px-1">
                  <span className="text-[10px]" style={{ color: 'var(--label-4)' }}>{r.l}</span>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--label-2)' }}>{r.v}</span>
                </div>
              ))}
            </div>
            {(sel.tags || []).length > 0 && (
              <div>
                <div className="text-[9px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--label-4)' }}>Tags</div>
                <div className="flex flex-wrap gap-1">
                  {sel.tags.map((t, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-[4px]"
                      style={{ background: 'var(--fill)', color: 'var(--label-3)', border: '1px solid var(--sep)' }}>
                      {t}
                    </span>
                  ))}
                </div>
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
  const [sending,    setSending]    = useState(false)
  const [sugestoes,  setSugestoes]  = useState([])
  const [usedSugs,   setUsedSugs]   = useState(new Set())
  const [showEmoji,  setShowEmoji]  = useState(false)
  const [loadingH,   setLoadingH]   = useState(false)
  const chatRef  = useRef(null)
  const inputRef = useRef(null)

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
      if (r.ok) {
        const d = await r.json()
        const conv = (d.mensagens || []).map(m => ({
          r: m.direcao === 'entrada' ? 'u' : m.modo === 'manual' ? 'm' : 'b',
          t: m.mensagem || '',
          h: m.hora || '--:--',
          status: m.direcao === 'saida' ? 'delivered' : undefined,
        }))
        setMsgs(prev => {
          if (conv.length !== prev.length) {
            if (inicial || conv.length > prev.length)
              setTimeout(() => chatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 80)
            return conv
          }
          return prev
        })
      }
    } catch {}
    if (inicial) setLoadingH(false)
  }, [api])

  useEffect(() => {
    if (!sel) return
    const i = setInterval(() => carregarHistorico(sel.telefone, false), 5000)
    return () => clearInterval(i)
  }, [sel?.telefone, carregarHistorico])

  useEffect(() => { chatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }) }, [msgs])

  const isManual = (modeMap[sel?.telefone] || 'auto') === 'manual'

  const selecionarConv = useCallback((c) => {
    setSel(c); carregarHistorico(c.telefone, true)
    setInput(''); setUsedSugs(new Set()); setShowEmoji(false)
  }, [carregarHistorico])

  useEffect(() => {
    if (!isManual || !sel) { setSugestoes([]); return }
    const tipo = detectarTipo(sel.tags || [])
    setSugestoes(SUGESTOES[tipo] || SUGESTOES.duv)
    setUsedSugs(new Set())
  }, [isManual, sel])

  const toggleMode = () => setModeMap(m => ({ ...m, [sel.telefone]: isManual ? 'auto' : 'manual' }))

  const send = async (texto) => {
    const t = (texto || input).trim()
    if (!t || sending || !sel) return
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setMsgs(prev => [...prev, { r: 'm', t, h: hora, status: 'sent' }])
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
                <button key={s} onClick={() => setStatusMap(m => ({...m,[sel.telefone]:s}))}
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
          {showEmoji && (
            <div className="flex-shrink-0 px-3 py-2" style={{ borderTop:'1px solid var(--sep)', background:'var(--bg-3)' }}>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_COMUNS.map(e => (
                  <button key={e} onClick={() => { setInput(p=>p+e); setShowEmoji(false); inputRef.current?.focus() }}
                    className="text-lg hover:scale-125 transition-transform">{e}</button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-2.5 flex-shrink-0" style={{ background:'var(--bg-2)', borderTop:'1px solid var(--sep)' }}>
            {isManual ? (
              <div className="flex items-end gap-2">
                <button onClick={() => {setShowEmoji(v=>!v)}}
                  className="p-1.5 rounded-[7px] flex-shrink-0"
                  style={{ color:'var(--label-3)', background:showEmoji?'var(--fill)':'transparent' }}>
                  <Smile size={15}/>
                </button>
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
