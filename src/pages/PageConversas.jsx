import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Bot, User, Zap, Search, RefreshCw,
  Image, Paperclip, Mic, Smile, Phone, Video,
  CheckCheck, Clock, ChevronDown, X
} from 'lucide-react'

const TIPO_CFG = {
  dev: { label:'Devolução', bg:'rgba(255,69,58,0.1)',  color:'#FF453A' },
  ped: { label:'Pedido',    bg:'rgba(10,132,255,0.1)', color:'#0A84FF' },
  duv: { label:'Dúvida',    bg:'rgba(50,215,75,0.1)',  color:'#32D74B' },
}

const SUGESTOES = {
  dev: ['Qual o número do pedido?', 'Pode enviar uma foto do defeito?', 'Vou abrir uma devolução agora!'],
  ped: ['Qual produto você procura?', 'Vou verificar o estoque!', 'Qual forma de pagamento prefere?'],
  duv: ['Claro, deixa eu verificar!', 'Pode me dar mais detalhes?', 'Vou te ajudar agora! 😊'],
}

const EMOJI_COMUNS = ['😊','👍','🙏','💚','📦','🔍','✅','❌','⏳','🎉','💰','📬','🚚','⭐']

// Gera iniciais/avatar de um nome ou telefone
function avatarLetras(nome, telefone) {
  if (nome && nome !== telefone) return nome.slice(0,2).toUpperCase()
  return '?'
}

// Cor do avatar baseada no telefone
function avatarCor(telefone) {
  const cores = ['#BF5AF2','#0A84FF','#FF453A','#FF9F0A','#32D74B','#FFD60A']
  let h = 0
  for (let c of (telefone||'')) h = (h*31 + c.charCodeAt(0)) % cores.length
  return cores[Math.abs(h)]
}

function Avatar({ nome, telefone, size=36, online=false }) {
  const letras = avatarLetras(nome, telefone)
  const cor    = avatarCor(telefone)
  return (
    <div className="relative flex-shrink-0">
      <div className="rounded-full flex items-center justify-center font-semibold"
        style={{ width:size, height:size, background:cor, color:'#000', fontSize:size*0.32 }}>
        {letras}
      </div>
      {online && (
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

// Detecta tipo da conversa pelas tags
function detectarTipo(tags=[]) {
  if (tags.some(t => t.includes('devolucao'))) return 'dev'
  if (tags.some(t => t.includes('comprador') || t.includes('pedido'))) return 'ped'
  return 'duv'
}

export default function PageConversas({ api }) {
  const [convs,     setConvs]     = useState([])
  const [sel,       setSel]       = useState(null)
  const [tab,       setTab]       = useState('todas')
  const [busca,     setBusca]     = useState('')
  const [msgs,      setMsgs]      = useState([])
  const [input,     setInput]     = useState('')
  const [mode,      setMode]      = useState({})
  const [sending,   setSending]   = useState(false)
  const [sugestoes, setSugestoes] = useState([])
  const [usedSugs,  setUsedSugs]  = useState(new Set())
  const [showEmoji, setShowEmoji] = useState(false)
  const [showMedia, setShowMedia] = useState(false)
  const [mediaUrl,  setMediaUrl]  = useState('')
  const [mediaTipo, setMediaTipo] = useState('image')
  const [loadingHist, setLoadingHist] = useState(false)
  const chatRef  = useRef(null)
  const inputRef = useRef(null)

  // Carrega lista de conversas do banco
  const carregarConversas = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/dashboard/conversas`)
      if (r.ok) {
        const d = await r.json()
        setConvs(d.conversas || [])
      }
    } catch {}
  }, [api])

  useEffect(() => {
    carregarConversas()
    const i = setInterval(carregarConversas, 8000)
    return () => clearInterval(i)
  }, [carregarConversas])

  // Carrega histórico de um contato
  const carregarHistorico = useCallback(async (telefone, inicial = false) => {
    if (inicial) { setLoadingHist(true); setMsgs([]) }
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${telefone}`)
      if (r.ok) {
        const d = await r.json()
        const convertidas = (d.mensagens || []).map(m => ({
          // direcao='entrada' = cliente (u), direcao='saida' + modo='auto' = IA (b), saida + modo='manual' = atendente (m)
          r: m.direcao === 'entrada' ? 'u' : m.modo === 'manual' ? 'm' : 'b',
          t: m.mensagem || '',
          h: m.hora || '--:--',
          ia: m.direcao === 'saida' && m.modo !== 'manual',
          status: m.direcao === 'saida' ? 'delivered' : undefined,
        }))
        setMsgs(prev => {
          if (convertidas.length !== prev.length) {
            if (inicial || convertidas.length > prev.length) {
              setTimeout(() => chatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 100)
            }
            return convertidas
          }
          return prev
        })
      }
    } catch (e) {
      console.error('Erro historico:', e)
    } finally {
      if (inicial) setLoadingHist(false)
    }
  }, [api])

  // Atualiza histórico automaticamente
  useEffect(() => {
    if (!sel) return
    const i = setInterval(() => carregarHistorico(sel.telefone, false), 5000)
    return () => clearInterval(i)
  }, [sel?.telefone, carregarHistorico])

  const isManual = (mode[sel?.telefone] || 'auto') === 'manual'

  const selectConv = useCallback((c) => {
    setSel(c)
    carregarHistorico(c.telefone, true)
    setInput('')
    setUsedSugs(new Set())
    setShowEmoji(false)
    setShowMedia(false)
  }, [carregarHistorico])

  useEffect(() => {
    if (!isManual || !sel) { setSugestoes([]); return }
    const tipo = detectarTipo(sel.tags || [])
    setSugestoes(SUGESTOES[tipo] || SUGESTOES.duv)
    setUsedSugs(new Set())
  }, [isManual, sel])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })
  }, [msgs])

  const toggleMode = () => setMode(m => ({ ...m, [sel.telefone]: isManual ? 'auto' : 'manual' }))

  const useSugestao = (t) => {
    setInput(t)
    setUsedSugs(prev => new Set([...prev, t]))
    inputRef.current?.focus()
  }

  const send = async (texto) => {
    const t = (texto || input).trim()
    if (!t || sending || !sel) return
    const hora = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
    setMsgs(prev => [...prev, { r:'m', t, h:hora, status:'sent' }])
    setInput('')
    setUsedSugs(new Set())
    setShowEmoji(false)
    setSending(true)
    try {
      await fetch(`${api}/api/dashboard/enviar`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ telefone: sel.telefone, mensagem: t })
      })
      setTimeout(() => carregarHistorico(sel.telefone, false), 1500)
    } catch {}
    setSending(false)
  }

  const sendMedia = async () => {
    if (!mediaUrl.trim() || !sel) return
    setSending(true)
    try {
      await fetch(`${api}/api/dashboard/enviar`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ telefone: sel.telefone, mensagem: `[Mídia: ${mediaUrl}]` })
      })
      const hora = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
      setMsgs(prev => [...prev, { r:'m', t:`[${mediaTipo}: ${mediaUrl.split('/').pop()}]`, h:hora, status:'sent' }])
      setMediaUrl('')
      setShowMedia(false)
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
    .filter(c => !busca || (c.nome||'').toLowerCase().includes(busca.toLowerCase()) || c.telefone.includes(busca))

  return (
    <div className="h-full flex overflow-hidden">

      {/* ── Lista ── */}
      <div className="w-[260px] flex-shrink-0 flex flex-col"
        style={{ background:'var(--bg-2)', borderRight:'1px solid var(--sep)' }}>

        <div className="px-4 pt-4 pb-3" style={{ borderBottom:'1px solid var(--sep)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[17px] font-semibold" style={{ color:'var(--label)' }}>Conversas</h2>
            <button onClick={carregarConversas} className="p-1" style={{ color:'var(--label-3)' }}>
              <RefreshCw size={13} />
            </button>
          </div>
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--label-3)' }} />
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..."
              className="w-full pl-8 pr-3 py-2 text-[13px] rounded-[10px] outline-none"
              style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }} />
          </div>
          <div className="flex gap-1 p-0.5 rounded-[10px]" style={{ background:'var(--fill)' }}>
            {[['todas','Todas'],['dev','Devol.'],['ped','Pedidos']].map(([v,l])=>(
              <button key={v} onClick={()=>setTab(v)}
                className="flex-1 py-1.5 rounded-[8px] text-[11px] font-medium transition-all"
                style={{ background:tab===v?'var(--bg-2)':'transparent', color:tab===v?'var(--label)':'var(--label-3)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-[12px]" style={{ color:'var(--label-3)' }}>
              Nenhuma conversa ainda
            </div>
          )}
          {filtered.map(c => {
            const tipo   = detectarTipo(c.tags || [])
            const tc     = TIPO_CFG[tipo]
            const active = sel?.telefone === c.telefone
            const hora   = c.ultima_msg ? new Date(c.ultima_msg).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : ''
            return (
              <button key={c.telefone} onClick={()=>selectConv(c)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-l-2 transition-all"
                style={{ borderBottomColor:'var(--sep)', borderLeftColor:active?'var(--accent)':'transparent', background:active?'var(--accent-dim)':'transparent' }}>
                <Avatar nome={c.nome} telefone={c.telefone} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold truncate" style={{ color:'var(--label)' }}>
                      {c.nome || c.telefone}
                    </span>
                    <span className="text-[10px] flex-shrink-0 ml-2" style={{ color:'var(--label-3)' }}>{hora}</span>
                  </div>
                  <div className="text-[11px] truncate mt-0.5" style={{ color:'var(--label-3)' }}>
                    {c.ultima_direcao === 'saida' ? '↩ ' : ''}{c.ultima_mensagem ? c.ultima_mensagem.slice(0,45) : `${c.total_msgs} mensagens`}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background:tc.bg, color:tc.color }}>{tc.label}</span>
                    {(mode[c.telefone]||'auto')==='manual' && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background:'rgba(10,132,255,0.1)', color:'var(--blue)' }}>Manual</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Chat ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!sel ? (
          <div className="flex-1 flex items-center justify-center" style={{ background:'var(--bg)' }}>
            <div className="text-center" style={{ color:'var(--label-3)' }}>
              <Phone size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-[14px]" style={{ color:'var(--label-2)' }}>Selecione uma conversa</p>
            </div>
          </div>
        ) : <>

          {/* Header */}
          <div className="px-5 py-3 flex items-center gap-3 flex-shrink-0"
            style={{ background:'var(--bg-2)', borderBottom:'1px solid var(--sep)' }}>
            <Avatar nome={sel.nome} telefone={sel.telefone} size={36} />
            <div className="flex-1">
              <div className="text-[15px] font-semibold" style={{ color:'var(--label)' }}>{sel.nome || sel.telefone}</div>
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color:'var(--label-3)' }}>{sel.telefone}</span>
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

            {(() => { const tc=TIPO_CFG[detectarTipo(sel.tags||[])]; return (
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
            {loadingHist && (
              <div className="flex justify-center py-4" style={{ color:'var(--label-3)' }}>
                <RefreshCw size={14} className="animate-spin" />
              </div>
            )}
            {msgs.map((m,i) => {
              const isBot=m.r==='b', isUser=m.r==='u', isMe=m.r==='m'
              return (
                <div key={i} className={`flex gap-2 ${isUser||isMe?'justify-end':'justify-start'}`}>
                  {isBot && (
                    <div className="rounded-full flex items-center justify-center font-semibold flex-shrink-0"
                      style={{ width:26, height:26, background:'var(--accent)', color:'#000', fontSize:9 }}>IA</div>
                  )}
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
                  {isUser && <Avatar nome={sel.nome} telefone={sel.telefone} size={26} />}
                </div>
              )
            })}
          </div>

          {/* Sugestões */}
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
