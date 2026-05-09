import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Bot, User, Zap, Search, RefreshCw,
  Image, Paperclip, Mic, Smile, Phone, Video,
  CheckCheck, Clock, ChevronDown, X
} from 'lucide-react'

const AV_C = { MF:'#BF5AF2', JC:'#0A84FF', AS:'#FF453A', RP:'#FF9F0A', LM:'#32D74B', PT:'#FFD60A', CR:'#FF453A' }

const TIPO_CFG = {
  dev: { label:'Devolução', bg:'rgba(255,69,58,0.1)',  color:'#FF453A' },
  ped: { label:'Pedido',    bg:'rgba(10,132,255,0.1)', color:'#0A84FF' },
  duv: { label:'Dúvida',    bg:'rgba(50,215,75,0.1)',  color:'#32D74B' },
}

const CONVS = [
  { id:1, name:'Maria F.',   ph:'11999994821', prev:'Colar com defeito, quero devolver', tipo:'dev', status:'ok',   hora:'14:32', av:'MF', unread:0 },
  { id:2, name:'João C.',    ph:'21999993310', prev:'Linha de bordado nº8 em estoque?',  tipo:'duv', status:'ok',   hora:'14:18', av:'JC', unread:0 },
  { id:3, name:'Ana S.',     ph:'31999997744', prev:'Prazo de entrega para MG?',          tipo:'duv', status:'live', hora:'14:05', av:'AS', unread:2 },
  { id:4, name:'Ricardo P.', ph:'11999990092', prev:'Pedido chegou com defeito',          tipo:'dev', status:'live', hora:'13:47', av:'RP', unread:1 },
  { id:5, name:'Lucia M.',   ph:'85999995512', prev:'3 metros de renda chantilly',        tipo:'ped', status:'ok',   hora:'13:22', av:'LM', unread:0 },
]

const MSGS_BASE = {
  1: [
    { r:'u', t:'Oi! Colar chegou com defeito 😔', h:'14:18', status:'read' },
    { r:'b', t:'Olá Maria! 😊 Sinto muito! Me informa o número do pedido?', h:'14:18', ia:true },
    { r:'u', t:'#NS-8847', h:'14:19', status:'read' },
    { r:'b', t:'Encontrei! 🔍\n📦 #NS-8847 — Colar Dourado\n💰 R$ 89,90 | 12/01/2025\n\nDentro de 7 dias = reembolso ou troca. O que prefere?', h:'14:20', ia:true },
    { r:'u', t:'Reembolso completo por favor', h:'14:21', status:'read' },
    { r:'b', t:'━━━━━━━━━━━━━━\n🔖 AUTORIZAÇÃO DE DEVOLUÇÃO\nNº RMA-2025-4471\n━━━━━━━━━━━━━━\n👤 Maria F.\n📦 #NS-8847 | 💰 R$ 89,90\n✅ Aprovado — 5 dias úteis\n━━━━━━━━━━━━━━\n\nEtiqueta enviada por e-mail! 📬', h:'14:32', ia:true },
    { r:'u', t:'Muito rápido! Obrigada! 🙏', h:'14:33', status:'read' },
  ],
  3: [
    { r:'u', t:'Olá, qual o prazo para MG?', h:'14:03', status:'read' },
    { r:'b', t:'Olá Ana! Para Minas Gerais via Correios PAC: 5 a 8 dias úteis 📦\nDeseja calcular com seu CEP?', h:'14:04', ia:true },
    { r:'u', t:'Sim! CEP 30140-110', h:'14:05', status:'delivered' },
  ],
}

const SUGESTOES = {
  dev: ['Qual o número do pedido?', 'Pode enviar uma foto do defeito?', 'Vou abrir uma devolução agora!'],
  ped: ['Qual produto você procura?', 'Vou verificar o estoque!', 'Qual forma de pagamento prefere?'],
  duv: ['Claro, deixa eu verificar!', 'Pode me dar mais detalhes?', 'Vou te ajudar agora! 😊'],
}

const EMOJI_COMUNS = ['😊','👍','🙏','💚','📦','🔍','✅','❌','⏳','🎉','💰','📬','🚚','⭐']

function Avatar({ av, size=36, status }) {
  return (
    <div className="relative flex-shrink-0">
      <div className="rounded-full flex items-center justify-center font-semibold"
        style={{ width:size, height:size, background: AV_C[av]||'#636366', color:'#000', fontSize: size*0.32 }}>
        {av}
      </div>
      {status === 'live' && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
          style={{ background:'var(--accent)', borderColor:'var(--bg-2)' }} />
      )}
    </div>
  )
}

function MsgStatus({ status }) {
  if (status === 'read')      return <CheckCheck size={12} style={{ color:'var(--blue)' }} />
  if (status === 'delivered') return <CheckCheck size={12} style={{ color:'var(--label-3)' }} />
  return <Clock size={10} style={{ color:'var(--label-3)' }} />
}

export default function PageConversas({ api }) {
  const [sel,       setSel]       = useState(CONVS[0])
  const [tab,       setTab]       = useState('todas')
  const [busca,     setBusca]     = useState('')
  const [msgs,      setMsgs]      = useState(MSGS_BASE[1] || [])
  const [input,     setInput]     = useState('')
  const [mode,      setMode]      = useState({})
  const [sending,   setSending]   = useState(false)
  const [sugestoes, setSugestoes] = useState([])
  const [usedSugs,  setUsedSugs]  = useState(new Set())
  const [showEmoji, setShowEmoji] = useState(false)
  const [showMedia, setShowMedia] = useState(false)
  const [mediaUrl,  setMediaUrl]  = useState('')
  const [mediaTipo, setMediaTipo] = useState('image')
  const chatRef  = useRef(null)
  const inputRef = useRef(null)
  const fileRef  = useRef(null)

  const isManual = (mode[sel?.id] || 'auto') === 'manual'

  const selectConv = useCallback((c) => {
    setSel(c)
    setMsgs(MSGS_BASE[c.id] || [{ r:'u', t:'Olá!', h:'--:--' }])
    setInput('')
    setUsedSugs(new Set())
    setShowEmoji(false)
    setShowMedia(false)
  }, [])

  useEffect(() => {
    if (!isManual || !sel) { setSugestoes([]); return }
    setSugestoes(SUGESTOES[sel.tipo] || SUGESTOES.duv)
    setUsedSugs(new Set())
  }, [isManual, sel])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })
  }, [msgs])

  const toggleMode = () => setMode(m => ({ ...m, [sel.id]: isManual ? 'auto' : 'manual' }))

  const useSugestao = (t) => {
    setInput(t)
    setUsedSugs(prev => new Set([...prev, t]))
    inputRef.current?.focus()
  }

  const send = async (texto) => {
    const t = (texto || input).trim()
    if (!t || sending) return
    const hora = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
    setMsgs(prev => [...prev, { r:'m', t, h:hora, status:'sent' }])
    setInput('')
    setUsedSugs(new Set())
    setShowEmoji(false)
    setSending(true)
    try {
      await fetch(`${api}/webhook/manual`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ to: sel.ph, message: t })
      })
    } catch {}
    setSending(false)
  }

  const sendMedia = async () => {
    if (!mediaUrl.trim()) return
    setSending(true)
    try {
      await fetch(`${api}/webhook/manual`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ to: sel.ph, tipo: mediaTipo, url: mediaUrl })
      })
      const hora = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
      setMsgs(prev => [...prev, { r:'m', t:`[${mediaTipo}: ${mediaUrl.split('/').pop()}]`, h:hora, status:'sent', isMedia:true, mediaTipo }])
      setMediaUrl('')
      setShowMedia(false)
    } catch {}
    setSending(false)
  }

  const filtered = CONVS
    .filter(c => tab==='todas' || (tab==='live'&&c.status==='live') || c.tipo===tab)
    .filter(c => !busca || c.name.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="h-full flex overflow-hidden">

      {/* ── Lista ── */}
      <div className="w-[260px] flex-shrink-0 flex flex-col"
        style={{ background:'var(--bg-2)', borderRight:'1px solid var(--sep)' }}>

        <div className="px-4 pt-4 pb-3" style={{ borderBottom:'1px solid var(--sep)' }}>
          <h2 className="text-[17px] font-semibold mb-3" style={{ color:'var(--label)' }}>Conversas</h2>
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--label-3)' }} />
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..."
              className="w-full pl-8 pr-3 py-2 text-[13px] rounded-[10px] outline-none"
              style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }} />
          </div>
          <div className="flex gap-1 p-0.5 rounded-[10px]" style={{ background:'var(--fill)' }}>
            {[['todas','Todas'],['live','Ao vivo'],['dev','Devol.'],['ped','Pedidos']].map(([v,l])=>(
              <button key={v} onClick={()=>setTab(v)}
                className="flex-1 py-1.5 rounded-[8px] text-[11px] font-medium transition-all"
                style={{ background:tab===v?'var(--bg-2)':'transparent', color:tab===v?'var(--label)':'var(--label-3)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.map(c => {
            const tc = TIPO_CFG[c.tipo]
            const active = sel?.id === c.id
            return (
              <button key={c.id} onClick={()=>selectConv(c)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-l-2 transition-all"
                style={{ borderBottomColor:'var(--sep)', borderLeftColor:active?'var(--accent)':'transparent', background:active?'var(--accent-dim)':'transparent' }}>
                <Avatar av={c.av} size={40} status={c.status==='live'?'live':null} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold truncate" style={{ color:'var(--label)' }}>{c.name}</span>
                    <span className="text-[10px] flex-shrink-0 ml-2" style={{ color:'var(--label-3)' }}>{c.hora}</span>
                  </div>
                  <div className="text-[11px] truncate mt-0.5" style={{ color:'var(--label-3)' }}>{c.prev}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background:tc.bg, color:tc.color }}>{tc.label}</span>
                    {(mode[c.id]||'auto')==='manual' && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background:'rgba(10,132,255,0.1)', color:'var(--blue)' }}>Manual</span>
                    )}
                  </div>
                </div>
                {c.unread > 0 && (
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background:'var(--red)', color:'#fff' }}>{c.unread}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Chat ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {sel && <>

          {/* Header */}
          <div className="px-5 py-3 flex items-center gap-3 flex-shrink-0"
            style={{ background:'var(--bg-2)', borderBottom:'1px solid var(--sep)' }}>
            <Avatar av={sel.av} size={36} status={sel.status==='live'?'live':null} />
            <div className="flex-1">
              <div className="text-[15px] font-semibold" style={{ color:'var(--label)' }}>{sel.name}</div>
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color:'var(--label-3)' }}>{sel.ph}</span>
                {sel.status==='live' && (
                  <span className="text-[10px] font-medium flex items-center gap-1" style={{ color:'var(--accent)' }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:'var(--accent)' }} />online
                  </span>
                )}
              </div>
            </div>

            {/* Toggle modo */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-[10px]"
              style={{ background:'var(--fill)', border:`1px solid ${isManual?'rgba(10,132,255,0.25)':'var(--accent-border)'}` }}>
              <span className="text-[11px] font-medium" style={{ color:isManual?'var(--blue)':'var(--accent)' }}>
                {isManual ? <><User size={11} className="inline mr-1"/>Manual</> : <><Bot size={11} className="inline mr-1"/>IA Ativa</>}
              </span>
              <button onClick={toggleMode}
                className="relative flex-shrink-0"
                style={{ width:40, height:22, borderRadius:11, background:isManual?'var(--blue)':'var(--accent)', transition:'background .2s' }}>
                <span className="absolute top-0.5 h-[18px] w-[18px] bg-white rounded-full shadow transition-all duration-200"
                  style={{ left:isManual?'calc(100% - 20px)':'2px' }} />
              </button>
            </div>

            {(() => { const tc=TIPO_CFG[sel.tipo]; return (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background:tc.bg, color:tc.color }}>{tc.label}</span>
            )})()}
          </div>

          {/* Faixa de modo */}
          {isManual ? (
            <div className="px-5 py-2 flex items-center gap-2 text-[12px] flex-shrink-0"
              style={{ background:'rgba(10,132,255,0.06)', borderBottom:'1px solid rgba(10,132,255,0.12)', color:'var(--blue)' }}>
              <User size={12} />
              <span className="font-medium">Modo Manual — você está respondendo. IA em pausa.</span>
            </div>
          ) : (
            <div className="px-5 py-2 flex items-center gap-2 text-[12px] flex-shrink-0"
              style={{ background:'var(--accent-dim)', borderBottom:'1px solid var(--accent-border)', color:'var(--accent)' }}>
              <Bot size={12} />
              <span className="font-medium">IA gerenciando automaticamente.</span>
              <button onClick={toggleMode} className="ml-auto text-[11px] font-semibold underline">Assumir</button>
            </div>
          )}

          {/* Mensagens */}
          <div ref={chatRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-2"
            style={{ background:'var(--bg)' }}>
            {msgs.map((m,i) => {
              const isBot=m.r==='b', isUser=m.r==='u', isMe=m.r==='m'
              return (
                <div key={i} className={`flex gap-2 ${isUser||isMe?'justify-end':'justify-start'}`}>
                  {isBot && <Avatar av="IA" size={26} />}
                  <div className="max-w-[76%]">
                    {isBot && <div className="flex items-center gap-1.5 mb-1"><Zap size={9} style={{ color:'var(--accent)' }}/><span className="text-[10px] font-semibold" style={{ color:'var(--accent)' }}>IA Bia</span></div>}
                    {isMe  && <div className="flex items-center justify-end gap-1.5 mb-1"><span className="text-[10px] font-semibold" style={{ color:'var(--blue)' }}><User size={9} className="inline mr-0.5"/>Você</span></div>}
                    <div className="px-3.5 py-2.5 rounded-[18px] text-[13px] leading-relaxed whitespace-pre-line"
                      style={{
                        background:  isUser?'var(--blue)':isMe?'var(--bg-4)':'var(--bg-3)',
                        color:       isUser?'#fff':'var(--label)',
                        borderBottomLeftRadius:  isBot?4:18,
                        borderBottomRightRadius: (isUser||isMe)?4:18,
                        border: (isBot||isMe)?'1px solid var(--sep)':'none',
                      }}>
                      {m.t}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 px-1 ${isUser||isMe?'justify-end':''}`}>
                      <span className="text-[10px]" style={{ color:'var(--label-3)' }}>{m.h}</span>
                      {(isUser||isMe) && m.status && <MsgStatus status={m.status} />}
                    </div>
                  </div>
                  {isUser && <Avatar av={sel.av} size={26} />}
                </div>
              )
            })}
          </div>

          {/* Sugestões — FICAM VISÍVEIS após clicar */}
          {isManual && sugestoes.length > 0 && (
            <div className="flex-shrink-0 px-4 py-2" style={{ borderTop:'1px solid var(--sep)', background:'var(--bg-2)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap size={10} style={{ color:'var(--accent)' }} />
                <span className="text-[10px] font-semibold" style={{ color:'var(--label-3)' }}>Sugestões IA</span>
                <span className="text-[9px]" style={{ color:'var(--label-4)' }}>Clique para usar — ficam até você enviar</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth:'none' }}>
                {sugestoes.map((s,i) => {
                  const used = usedSugs.has(s)
                  return (
                    <button key={i} onClick={()=>useSugestao(s)}
                      className="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-full border transition-all whitespace-nowrap"
                      style={{ background:used?'var(--accent-dim)':'var(--fill)', borderColor:used?'var(--accent-border)':'var(--sep)', color:used?'var(--accent)':'var(--label-2)', fontWeight:used?600:400 }}>
                      {used?'✓ ':''}{s}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Modal de mídia */}
          {showMedia && (
            <div className="flex-shrink-0 px-4 py-3 space-y-2" style={{ borderTop:'1px solid var(--sep)', background:'var(--bg-3)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold" style={{ color:'var(--label)' }}>Enviar Mídia</span>
                <button onClick={()=>setShowMedia(false)} style={{ color:'var(--label-3)' }}><X size={14}/></button>
              </div>
              <div className="flex gap-2">
                {[['image','Imagem'],['video','Vídeo'],['document','Documento'],['audio','Áudio']].map(([v,l])=>(
                  <button key={v} onClick={()=>setMediaTipo(v)}
                    className="px-2.5 py-1.5 rounded-[8px] text-[11px] font-medium border transition-all"
                    style={{ background:mediaTipo===v?'var(--accent-dim)':'transparent', borderColor:mediaTipo===v?'var(--accent-border)':'var(--sep)', color:mediaTipo===v?'var(--accent)':'var(--label-2)' }}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={mediaUrl} onChange={e=>setMediaUrl(e.target.value)}
                  placeholder="URL da mídia (https://...)"
                  className="flex-1 px-3 py-2 rounded-[9px] text-[12px] outline-none"
                  style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', color:'var(--label)' }} />
                <button onClick={sendMedia} disabled={!mediaUrl.trim()||sending}
                  className="px-3 py-2 rounded-[9px] text-[12px] font-semibold transition-all"
                  style={{ background:'var(--accent)', color:'#000', opacity:(!mediaUrl.trim()||sending)?0.5:1 }}>
                  Enviar
                </button>
              </div>
            </div>
          )}

          {/* Picker de emoji */}
          {showEmoji && (
            <div className="flex-shrink-0 px-4 py-2" style={{ borderTop:'1px solid var(--sep)', background:'var(--bg-3)' }}>
              <div className="flex flex-wrap gap-2">
                {EMOJI_COMUNS.map(e=>(
                  <button key={e} onClick={()=>{ setInput(prev=>prev+e); setShowEmoji(false); inputRef.current?.focus() }}
                    className="text-lg hover:scale-125 transition-transform">
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 flex-shrink-0" style={{ background:'var(--bg-2)', borderTop:'1px solid var(--sep)' }}>
            {isManual ? (
              <div className="flex items-end gap-2">
                {/* Botões de mídia */}
                <div className="flex gap-1 pb-1">
                  <button onClick={()=>{setShowEmoji(v=>!v);setShowMedia(false)}}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                    style={{ color:'var(--label-3)', background:showEmoji?'var(--fill)':'transparent' }}>
                    <Smile size={17} />
                  </button>
                  <button onClick={()=>{setShowMedia(v=>!v);setShowEmoji(false)}}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                    style={{ color:'var(--label-3)', background:showMedia?'var(--fill)':'transparent' }}>
                    <Paperclip size={17} />
                  </button>
                </div>

                <div className="flex-1 flex items-end px-4 py-2.5 rounded-[22px]"
                  style={{ background:'var(--bg-3)', border:'1px solid var(--sep)' }}>
                  <textarea ref={inputRef}
                    value={input}
                    onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }}
                    placeholder="Mensagem... (Enter envia, Shift+Enter nova linha)"
                    rows={1}
                    className="flex-1 bg-transparent resize-none outline-none text-[13px] leading-relaxed"
                    style={{ color:'var(--label)', maxHeight:100, minHeight:22 }}
                    onInput={e=>{ e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,100)+'px' }}
                  />
                </div>

                <button onClick={()=>send()}
                  disabled={!input.trim()||sending}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background:input.trim()&&!sending?'var(--blue)':'var(--fill)', color:input.trim()&&!sending?'#fff':'var(--label-3)' }}>
                  {sending?<RefreshCw size={16} className="animate-spin"/>:<Send size={16}/>}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color:'var(--label-3)' }}>IA gerenciando — ative modo manual para responder</span>
                <button onClick={toggleMode}
                  className="px-3 py-1.5 rounded-[10px] text-[12px] font-semibold"
                  style={{ background:'rgba(10,132,255,0.1)', color:'var(--blue)' }}>
                  Assumir
                </button>
              </div>
            )}
          </div>
        </>}
      </div>
    </div>
  )
}
