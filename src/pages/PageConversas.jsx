import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, ToggleLeft, ToggleRight, Zap, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

const AV_C = { MF:'#BF5AF2', JC:'#0A84FF', AS:'#FF453A', RP:'#FF9F0A', LM:'#32D74B', PT:'#FFD60A', CR:'#FF453A' }
const TIPO_CFG = {
  dev:  { label:'Devolução', bg:'rgba(255,69,58,0.12)',   color:'var(--red)'    },
  ped:  { label:'Pedido',    bg:'rgba(10,132,255,0.12)',  color:'var(--blue)'   },
  duv:  { label:'Dúvida',    bg:'rgba(50,215,75,0.12)',   color:'var(--accent)' },
}

const CONVS = [
  { id:1, name:'Maria F.', ph:'11 9xxxx-4821', prev:'Colar com defeito, quero devolver', tipo:'dev', status:'ok',   hora:'14:32', av:'MF', unread:0 },
  { id:2, name:'João C.',  ph:'21 9xxxx-3310', prev:'Linha de bordado nº8 em estoque?',  tipo:'duv', status:'ok',   hora:'14:18', av:'JC', unread:0 },
  { id:3, name:'Ana S.',   ph:'31 9xxxx-7744', prev:'Prazo de entrega para MG?',          tipo:'duv', status:'live', hora:'14:05', av:'AS', unread:2 },
  { id:4, name:'Ricardo P.', ph:'11 9xxxx-0092', prev:'Pedido chegou com defeito',       tipo:'dev', status:'live', hora:'13:47', av:'RP', unread:1 },
  { id:5, name:'Lucia M.', ph:'85 9xxxx-5512', prev:'3 metros de renda chantilly',       tipo:'ped', status:'ok',   hora:'13:22', av:'LM', unread:0 },
  { id:6, name:'Pedro T.', ph:'48 9xxxx-8831', prev:'Zíper invisível nº60?',             tipo:'duv', status:'ok',   hora:'13:10', av:'PT', unread:0 },
  { id:7, name:'Carla R.', ph:'11 9xxxx-2255', prev:'Pedido atacado 50 unidades',        tipo:'ped', status:'ok',   hora:'12:55', av:'CR', unread:0 },
]

// Messages per conversation
const MESSAGES = {
  1: [
    { r:'u', t:'Oi! Comprei um colar e chegou com defeito, quero devolver', h:'14:18' },
    { r:'b', t:'Olá, Maria! 😊 Sinto muito pelo inconveniente. Vou resolver agora mesmo! Me informa o número do pedido?', h:'14:18', ia:true },
    { r:'u', t:'Pedido #NS-8847', h:'14:19' },
    { r:'b', t:'Encontrei! 🔍\n📦 #NS-8847 — Colar Dourado Trançado\n📅 Entregue: 12/01/2025\n💰 R$ 89,90\n\nDentro de 7 dias = direito a reembolso ou troca. O que prefere?', h:'14:20', ia:true },
    { r:'u', t:'Reembolso completo', h:'14:21' },
    { r:'b', t:'━━━━━━━━━━━━━━\n🔖 AUTORIZAÇÃO DE DEVOLUÇÃO\nNº RMA-2025-4471\n━━━━━━━━━━━━━━\n👤 Maria F.\n📦 #NS-8847 | 💰 R$ 89,90\n✅ Aprovado — 5 dias úteis\n━━━━━━━━━━━━━━\n\nEtiqueta enviada por e-mail! 📬', h:'14:32', ia:true },
    { r:'u', t:'Muito rápido! Obrigada! 🙏', h:'14:33' },
  ],
  3: [
    { r:'u', t:'Olá, qual o prazo de entrega para Minas Gerais?', h:'14:03' },
    { r:'b', t:'Olá! Para Minas Gerais, o prazo via Correios PAC é de 5 a 8 dias úteis. Deseja calcular o frete com o seu CEP?', h:'14:04', ia:true },
    { r:'u', t:'Sim! Meu CEP é 30140-110', h:'14:05' },
  ],
  4: [
    { r:'u', t:'Meu pedido #NS-9012 chegou com defeito, o elástico veio rasgado', h:'13:45' },
    { r:'b', t:'Olá Ricardo! Que situação chata 😟 Vou verificar seu pedido agora. Um momento!', h:'13:46', ia:true },
    { r:'u', t:'Tá bom obrigado', h:'13:47' },
  ],
}

const DEFAULT_MSGS = id => MESSAGES[id] || [{ r:'u', t:'Olá, tudo bem?', h:'--:--' }]

function Avatar({ av, size=34 }) {
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
      style={{ width:size, height:size, background: AV_C[av]||'#636366', color:'#000' }}>
      {av}
    </div>
  )
}

export default function PageConversas({ api }) {
  const [sel, setSel]   = useState(CONVS[0])
  const [tab, setTab]   = useState('todas')
  const [msgs, setMsgs] = useState(DEFAULT_MSGS(1))
  const [input, setInput] = useState('')
  const [mode, setMode] = useState({}) // { [id]: 'auto'|'manual' }
  const [sending, setSending] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const chatRef = useRef(null)

  const currentMode = mode[sel?.id] || 'auto'
  const isManual = currentMode === 'manual'

  useEffect(() => {
    setSel(CONVS[0])
    setMsgs(DEFAULT_MSGS(1))
  }, [])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })
  }, [msgs])

  // When switching to manual, generate AI suggestions
  useEffect(() => {
    if (!isManual) { setSuggestions([]); return }
    const lastUser = [...msgs].reverse().find(m => m.r === 'u')
    if (lastUser) {
      setSuggestions([
        'Claro! Vou verificar isso para você agora mesmo.',
        'Entendido. Pode me passar mais detalhes?',
        'Sem problema, vou resolver isso rapidinho! 😊',
      ])
    }
  }, [isManual, sel])

  const selectConv = (c) => {
    setSel(c)
    setMsgs(DEFAULT_MSGS(c.id))
    setInput('')
    setSuggestions([])
  }

  const toggleMode = () => {
    setMode(m => ({ ...m, [sel.id]: isManual ? 'auto' : 'manual' }))
  }

  const send = async (text) => {
    if (!text?.trim()) return
    const newMsg = { r:'m', t: text, h: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) }
    setMsgs(prev => [...prev, newMsg])
    setInput('')
    setSuggestions([])
    setSending(true)
    try {
      await fetch(`${api}/webhook/manual`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ to: sel.ph, message: text })
      })
    } catch {}
    setSending(false)
  }

  const filtered = tab === 'todas' ? CONVS
    : CONVS.filter(c => c.tipo === tab || (tab === 'live' && c.status === 'live'))

  return (
    <div className="h-full flex overflow-hidden">

      {/* ── LIST ── */}
      <div className="w-[260px] flex-shrink-0 flex flex-col" style={{ background:'var(--bg-2)', borderRight:'1px solid var(--sep)' }}>
        <div className="px-4 pt-4 pb-3" style={{ borderBottom:'1px solid var(--sep)' }}>
          <h2 className="text-[17px] font-semibold mb-3" style={{ color:'var(--label)' }}>Conversas</h2>
          {/* Filter tabs */}
          <div className="flex gap-1 p-0.5 rounded-[10px]" style={{ background:'var(--fill)' }}>
            {[['todas','Todas'],['live','Ao vivo'],['dev','Devol.'],['ped','Pedidos']].map(([v,l]) => (
              <button key={v} onClick={() => setTab(v)}
                className="flex-1 py-1 rounded-[8px] text-[11px] font-medium transition-all"
                style={{ background: tab===v ? 'var(--bg-2)' : 'transparent', color: tab===v ? 'var(--label)' : 'var(--label-3)', boxShadow: tab===v ? 'var(--shadow)' : 'none' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 scroll-hidden">
          {filtered.map(c => {
            const tc = TIPO_CFG[c.tipo]
            const active = sel?.id === c.id
            const cm = mode[c.id] || 'auto'
            return (
              <button key={c.id} onClick={() => selectConv(c)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b"
                style={{ background: active ? 'var(--accent-dim)' : 'transparent', borderColor:'var(--sep)' }}>
                <div className="relative">
                  <Avatar av={c.av} size={38} />
                  {c.status === 'live' && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                      style={{ background:'var(--accent)', borderColor:'var(--bg-2)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold truncate" style={{ color:'var(--label)' }}>{c.name}</span>
                    <span className="text-[10px] flex-shrink-0" style={{ color:'var(--label-3)' }}>{c.hora}</span>
                  </div>
                  <div className="text-[11px] truncate mt-0.5" style={{ color:'var(--label-3)' }}>{c.prev}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="badge text-[9px]" style={{ background:tc.bg, color:tc.color }}>{tc.label}</span>
                    {cm === 'manual' && (
                      <span className="badge text-[9px]" style={{ background:'rgba(10,132,255,0.12)', color:'var(--blue)' }}>
                        👤 Manual
                      </span>
                    )}
                  </div>
                </div>
                {c.unread > 0 && (
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background:'var(--red)', color:'#fff' }}>{c.unread}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── CHAT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {sel && <>
          {/* Chat header */}
          <div className="px-5 py-3 flex items-center gap-3 flex-shrink-0" style={{ background:'var(--bg-2)', borderBottom:'1px solid var(--sep)' }}>
            <Avatar av={sel.av} size={36} />
            <div className="flex-1">
              <div className="text-[15px] font-semibold" style={{ color:'var(--label)' }}>{sel.name}</div>
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color:'var(--label-3)' }}>{sel.ph}</span>
                {sel.status === 'live' && (
                  <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color:'var(--accent)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background:'var(--accent)' }} /> Ao vivo
                  </span>
                )}
              </div>
            </div>

            {/* Mode toggle — THE KEY FEATURE */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-[10px]"
              style={{ background:'var(--fill)', border:`1px solid ${isManual ? 'var(--blue)' : 'var(--accent)'}20` }}>
              <span className="text-[11px] font-medium" style={{ color: isManual ? 'var(--blue)' : 'var(--accent)' }}>
                {isManual ? <><User size={11} className="inline mr-1" />Manual</> : <><Bot size={11} className="inline mr-1" />Automático</>}
              </span>
              <button onClick={toggleMode}
                className="relative w-10 h-6 rounded-full transition-all"
                style={{ background: isManual ? 'var(--blue)' : 'var(--accent)' }}>
                <span className="absolute top-0.5 h-5 w-5 bg-white rounded-full shadow transition-all duration-200"
                  style={{ left: isManual ? 'calc(100% - 22px)' : '2px' }} />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {(() => { const tc = TIPO_CFG[sel.tipo]; return (
                <span className="badge" style={{ background:tc.bg, color:tc.color }}>{tc.label}</span>
              )})()}
            </div>
          </div>

          {/* Mode banner */}
          {isManual && (
            <div className="px-5 py-2 flex items-center gap-2 text-[12px]"
              style={{ background:'rgba(10,132,255,0.08)', borderBottom:'1px solid rgba(10,132,255,0.15)', color:'var(--blue)' }}>
              <User size={12} />
              <span className="font-medium">Modo Manual ativo — você está respondendo. A IA está em pausa para esta conversa.</span>
            </div>
          )}
          {!isManual && (
            <div className="px-5 py-2 flex items-center gap-2 text-[12px]"
              style={{ background:'var(--accent-dim)', borderBottom:'1px solid var(--accent-border)', color:'var(--accent)' }}>
              <Bot size={12} />
              <span className="font-medium">Modo Automático — a IA está gerenciando esta conversa.</span>
              <button onClick={toggleMode} className="ml-auto text-[11px] font-semibold underline">Assumir</button>
            </div>
          )}

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto scroll-hidden px-5 py-4 space-y-3"
            style={{ background:'var(--bg)' }}>
            {msgs.map((m, i) => {
              const isBot  = m.r === 'b'
              const isUser = m.r === 'u'
              const isMe   = m.r === 'm'
              return (
                <div key={i} className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}>
                  {isBot && <Avatar av="IA" size={28} />}
                  <div className="max-w-[75%]">
                    {isBot && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-semibold" style={{ color:'var(--accent)' }}>
                          <Zap size={9} className="inline" /> IA Bia
                        </span>
                      </div>
                    )}
                    {isMe && (
                      <div className="flex items-center justify-end gap-1.5 mb-1">
                        <span className="text-[10px] font-semibold" style={{ color:'var(--blue)' }}>
                          <User size={9} className="inline" /> Você (atendente)
                        </span>
                      </div>
                    )}
                    <div className="px-3.5 py-2.5 rounded-[18px] text-[13px] leading-relaxed whitespace-pre-line"
                      style={{
                        background: isUser ? 'var(--blue)' : isMe ? 'var(--bg-4)' : 'var(--bg-3)',
                        color: isUser ? '#fff' : 'var(--label)',
                        borderBottomLeftRadius: isBot ? 4 : 18,
                        borderBottomRightRadius: (isUser||isMe) ? 4 : 18,
                        border: (isBot||isMe) ? '1px solid var(--sep)' : 'none',
                      }}>
                      {m.t}
                    </div>
                    <div className="text-[10px] mt-1 px-1" style={{ color:'var(--label-3)', textAlign: isUser||isMe ? 'right' : 'left' }}>
                      {m.h}
                    </div>
                  </div>
                  {(isUser) && <Avatar av={sel.av} size={28} />}
                </div>
              )
            })}
          </div>

          {/* AI suggestions (manual mode) */}
          {isManual && suggestions.length > 0 && (
            <div className="px-4 py-2 flex gap-2 overflow-x-auto scroll-hidden" style={{ borderTop:'1px solid var(--sep)' }}>
              <span className="text-[11px] flex-shrink-0 py-1" style={{ color:'var(--label-3)' }}>
                <Zap size={10} className="inline mr-1" />Sugestões IA:
              </span>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setInput(s)}
                  className="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-full border transition-all whitespace-nowrap"
                  style={{ background:'var(--fill)', borderColor:'var(--sep)', color:'var(--label-2)' }}>
                  {s.slice(0,40)}{s.length>40?'…':''}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="px-4 py-3 flex-shrink-0" style={{ background:'var(--bg-2)', borderTop:'1px solid var(--sep)' }}>
            {isManual ? (
              <div className="flex items-end gap-2">
                <div className="flex-1 px-4 py-2.5 rounded-[22px] flex items-center gap-2 border"
                  style={{ background:'var(--bg-3)', borderColor:'var(--sep)' }}>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
                    placeholder="Digite sua mensagem..."
                    rows={1}
                    className="flex-1 bg-transparent resize-none outline-none text-[13px] leading-relaxed"
                    style={{ color:'var(--label)', maxHeight:100 }}
                  />
                </div>
                <button onClick={() => send(input)} disabled={!input.trim() || sending}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: input.trim() ? 'var(--blue)' : 'var(--fill)', color: input.trim() ? '#fff' : 'var(--label-4)' }}>
                  <Send size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color:'var(--label-3)' }}>
                  🤖 IA gerenciando — clique em "Assumir" para responder manualmente
                </span>
                <button onClick={toggleMode}
                  className="px-3 py-1.5 rounded-[10px] text-[12px] font-semibold transition-all"
                  style={{ background:'rgba(10,132,255,0.12)', color:'var(--blue)' }}>
                  Assumir conversa
                </button>
              </div>
            )}
          </div>
        </>}
      </div>
    </div>
  )
}
