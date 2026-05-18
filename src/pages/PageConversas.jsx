import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Tema ─────────────────────────────────────────────────────────────────────
const V = {
  bg:     'var(--bg)',
  bg2:    'var(--bg-2)',
  bg3:    'var(--bg-3)',
  label:  'var(--label)',
  label2: 'var(--label-2)',
  label3: 'var(--label-3)',
  label4: 'var(--label-4)',
  sep:    'var(--sep)',
  fill:   'var(--fill)',
  accent: 'var(--accent, #059669)',
}

const STATUS_MAP = {
  pendente:     { label:'Pendente',     color:'#f59e0b', icon:'⏳' },
  em_andamento: { label:'Em andamento', color:'#3b82f6', icon:'💬' },
  resolvido:    { label:'Resolvido',    color:'#059669', icon:'✅' },
  encerrado:    { label:'Encerrado',    color:'#94a3b8', icon:'🔒' },
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ nome, size = 36 }) {
  const cores = ['#059669','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4']
  const letra = (nome || '?')[0].toUpperCase()
  const cor   = cores[(nome || '').charCodeAt(0) % cores.length]
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:`${cor}20`, color:cor,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:Math.round(size*0.38), fontWeight:700,
      border:`1.5px solid ${cor}40`,
    }}>
      {letra}
    </div>
  )
}

// ── Bolha de mensagem ─────────────────────────────────────────────────────────
function Bolha({ msg }) {
  const entrada = msg.direcao === 'entrada'
  const manual  = msg.modo === 'manual'
  const hora    = msg.criado_em
    ? new Date(msg.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    : ''

  // Extrai imagem se houver
  const imgMatch  = (msg.conteudo||'').match(/\[ENVIAR_IMAGEM:\s*([^\]]+)\]/)
  const imgUrl    = imgMatch?.[1]?.trim()
  const texto     = (msg.conteudo||'').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g,'').trim()

  // Cores por tipo — rgba para funcionar em claro e escuro
  const bg = entrada
    ? V.bg3
    : manual
    ? 'rgba(59,130,246,0.15)'
    : 'rgba(5,150,105,0.15)'
  const bord = entrada
    ? V.sep
    : manual
    ? 'rgba(59,130,246,0.35)'
    : 'rgba(5,150,105,0.35)'

  return (
    <div style={{
      display:'flex', justifyContent: entrada ? 'flex-start' : 'flex-end',
      marginBottom:8,
    }}>
      <div style={{
        maxWidth:'72%', borderRadius:12,
        borderBottomLeftRadius: entrada ? 3 : 12,
        borderBottomRightRadius: entrada ? 12 : 3,
        background:bg, border:`1px solid ${bord}`,
        padding:'8px 12px', fontSize:13, color:V.label, lineHeight:1.55,
      }}>
        {!entrada && (
          <div style={{ fontSize:10, color:V.label4, marginBottom:4 }}>
            {manual ? '👤 Atendente' : `🤖 ${msg.motor || 'Molise'}`}
          </div>
        )}
        {imgUrl && (
          <img src={imgUrl} alt="imagem"
            style={{ maxWidth:'100%', maxHeight:200, borderRadius:6, marginBottom:texto?4:0, display:'block' }}
            onError={e => e.target.style.display='none'}
          />
        )}
        {texto && (
          <div style={{ whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{texto}</div>
        )}
        <div style={{ fontSize:10, color:V.label4, textAlign:'right', marginTop:3 }}>{hora}</div>
      </div>
    </div>
  )
}

// ── Item da lista de conversas ────────────────────────────────────────────────
function ItemConversa({ conv, selecionado, onClick, status }) {
  const st   = STATUS_MAP[status] || STATUS_MAP.pendente
  const hora = conv.ultima_atividade
    ? new Date(conv.ultima_atividade).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    : ''

  return (
    <div onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
      cursor:'pointer', borderBottom:`1px solid ${V.sep}`,
      background: selecionado ? `${V.accent}12` : 'transparent',
      borderLeft: selecionado ? `2.5px solid ${V.accent}` : '2.5px solid transparent',
      transition:'background 0.15s',
    }}>
      <Avatar nome={conv.nome || conv.telefone} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:600, color:V.label, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140 }}>
            {conv.nome || conv.telefone}
          </span>
          <span style={{ fontSize:10, color:V.label4, flexShrink:0 }}>{hora}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:2 }}>
          <span style={{ fontSize:11, color:V.label3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140 }}>
            {conv.ultima_mensagem || '—'}
          </span>
          <span style={{ fontSize:10, color:st.color, flexShrink:0, marginLeft:4 }}>
            {st.icon}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PageConversas({ api: apiProp }) {
  const api = apiProp || BASE

  // Estado principal
  const [convs,      setConvs]      = useState([])
  const [selTel,     setSelTel]     = useState(null)
  const [msgs,       setMsgs]       = useState([])
  const [statusMap,  setStatusMap]  = useState({})
  const [carrinhoMap,setCarrinhoMap]= useState({})
  const [modoMap,    setModoMap]    = useState({})

  // UI
  const [statusSel,  setStatusSel]  = useState('pendente')
  const [busca,      setBusca]      = useState('')
  const [digitando,  setDigitando]  = useState('')
  const [enviando,   setEnviando]   = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs,  setLoadingMsgs]  = useState(false)
  const [hasMore,    setHasMore]    = useState(false)
  const [offset,     setOffset]     = useState(0)

  // Painel lateral
  const [abaLateral, setAbaLateral] = useState('perfil')
  const [buscaCat,   setBuscaCat]   = useState('')
  const [catalogo,   setCatalogo]   = useState([])
  const [sugestoes,  setSugestoes]  = useState([])
  const [perfilDados,setPerfilDados]= useState(null)

  const chatEndRef = useRef(null)
  const fetching   = useRef(false)

  // ── Carrega lista de conversas ──────────────────────────────────────────────
  const carregarConvs = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/dashboard/conversas`)
      if (!r.ok) return
      const d = await r.json()
      const lista = d.conversas || []
      setConvs(lista)
      setLoadingConvs(false)

      // Popula statusMap com valores do banco
      setStatusMap(prev => {
        const novo = { ...prev }
        lista.forEach(c => {
          if (c.status_atendimento && !novo[c.telefone]) {
            novo[c.telefone] = c.status_atendimento
          }
        })
        return novo
      })
    } catch (e) {
      console.error('Erro carregar conversas:', e.message)
      setLoadingConvs(false)
    }
  }, [api])

  useEffect(() => {
    carregarConvs()
    const t = setInterval(carregarConvs, 15000)
    return () => clearInterval(t)
  }, [carregarConvs])

  // ── Carrega histórico de mensagens ──────────────────────────────────────────
  const carregarMsgs = useCallback(async (tel, off = 0, silencioso = false) => {
    if (!tel || fetching.current) return
    fetching.current = true
    if (!silencioso) setLoadingMsgs(true)
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${tel}?limit=60&offset=${off}`)
      if (r.ok) {
        const d = await r.json()
        const novas = d.mensagens || []
        if (off === 0) setMsgs(novas)
        else setMsgs(prev => [...novas, ...prev])
        setHasMore(d.hasMore || false)
        setOffset(off === 0 ? novas.length : off + novas.length)

        // Atualiza carrinho e modo da sessão
        if (d.carrinho) setCarrinhoMap(prev => ({ ...prev, [tel]: d.carrinho }))
        if (d.modo)     setModoMap(prev => ({ ...prev, [tel]: d.modo }))
      }
    } catch (e) {
      console.error('Erro histórico:', e.message)
    } finally {
      if (!silencioso) setLoadingMsgs(false)
      fetching.current = false
    }
  }, [api])

  // Ao selecionar conversa
  useEffect(() => {
    if (!selTel) return
    setMsgs([])
    setOffset(0)
    carregarMsgs(selTel)
    carregarPerfil(selTel)
    carregarSugestoes(selTel)
  }, [selTel, carregarMsgs])

  // Scroll para o fim ao receber novas msgs
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  // Polling de novas mensagens na conversa aberta
  useEffect(() => {
    if (!selTel) return
    const t = setInterval(() => carregarMsgs(selTel, 0, true), 8000)
    return () => clearInterval(t)
  }, [selTel, carregarMsgs])

  // ── Carrega perfil do contato ───────────────────────────────────────────────
  const carregarPerfil = async (tel) => {
    try {
      const r = await fetch(`${api}/api/contatos/${tel}`)
      if (r.ok) setPerfilDados(await r.json())
    } catch {}
  }

  // ── Carrega sugestões IA ────────────────────────────────────────────────────
  const carregarSugestoes = async (tel) => {
    try {
      const r = await fetch(`${api}/api/sugestoes/${tel}`)
      if (r.ok) {
        const d = await r.json()
        setSugestoes(d.sugestoes || [])
      }
    } catch {}
  }

  // ── Busca catálogo ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!buscaCat.trim()) { setCatalogo([]); return }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(buscaCat)}`)
        if (r.ok) { const d = await r.json(); setCatalogo(d.produtos || []) }
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [buscaCat, api])

  // ── Envio manual de mensagem ────────────────────────────────────────────────
  const enviarMsg = async () => {
    if (!digitando.trim() || !selTel || enviando) return
    setEnviando(true)
    const texto = digitando.trim()
    setDigitando('')
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: selTel, mensagem: texto }),
      })
      await carregarMsgs(selTel, 0, true)
    } catch (e) {
      console.error('Erro enviar:', e.message)
      setDigitando(texto)
    } finally {
      setEnviando(false)
    }
  }

  // ── Altera status da conversa ───────────────────────────────────────────────
  const setStatus = async (tel, st) => {
    setStatusMap(prev => ({ ...prev, [tel]: st }))
    try {
      await fetch(`${api}/api/dashboard/status/${tel}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: st }),
      })
    } catch (e) {
      console.error('Erro status:', e.message)
    }
  }

  // ── Ativa/desativa modo manual ──────────────────────────────────────────────
  const toggleManual = async (tel) => {
    const atual  = modoMap[tel] === 'manual'
    const novoModo = atual ? 'ia' : 'manual'
    setModoMap(prev => ({ ...prev, [tel]: novoModo }))
    try {
      await fetch(`${api}/api/dashboard/manual/${tel}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !atual }),
      })
    } catch {}
  }

  // ── Envia produto ao cliente ────────────────────────────────────────────────
  const enviarProduto = async (produto) => {
    if (!selTel) return
    const msg = `*${produto.nome}*\n💳 R$ ${produto.preco} | 💰 PIX: R$ ${(parseFloat(produto.preco)*0.9).toFixed(2)}`
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: selTel, mensagem: msg }),
      })
      await carregarMsgs(selTel, 0, true)
    } catch {}
  }

  // ── Conversas filtradas ─────────────────────────────────────────────────────
  const convsFiltradas = useMemo(() => convs
    .filter(c => {
      const st = statusMap[c.telefone] || 'pendente'
      return st === statusSel
    })
    .filter(c => !busca || (c.nome||'').toLowerCase().includes(busca.toLowerCase()) || c.telefone.includes(busca))
  , [convs, statusSel, statusMap, busca])

  const convSel = convs.find(c => c.telefone === selTel)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden', background:V.bg }}>

      {/* ── COLUNA 1: Sidebar ───────────────────────────────────────────────── */}
      <div style={{ width:280, flexShrink:0, display:'flex', flexDirection:'column', borderRight:`1px solid ${V.sep}`, background:V.bg }}>

        {/* Abas de status */}
        <div style={{ padding:'10px 12px 0', borderBottom:`1px solid ${V.sep}` }}>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {Object.entries(STATUS_MAP).map(([key, info]) => {
              const count = convs.filter(c => (statusMap[c.telefone]||'pendente') === key).length
              return (
                <button key={key} onClick={() => setStatusSel(key)} style={{
                  display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
                  borderRadius:8, border:'none', cursor:'pointer',
                  background: statusSel === key ? `${info.color}18` : 'transparent',
                  color: statusSel === key ? info.color : V.label3,
                  fontSize:13, fontWeight: statusSel === key ? 600 : 400,
                  textAlign:'left',
                }}>
                  <span>{info.icon}</span>
                  <span style={{ flex:1 }}>{info.label}</span>
                  {count > 0 && (
                    <span style={{
                      background: statusSel === key ? info.color : V.fill,
                      color: statusSel === key ? '#fff' : V.label3,
                      fontSize:10, fontWeight:700, borderRadius:10,
                      padding:'1px 6px', minWidth:18, textAlign:'center',
                    }}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Busca */}
          <div style={{ position:'relative', marginTop:8, marginBottom:10 }}>
            <input
              value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar..."
              style={{
                width:'100%', padding:'7px 10px 7px 32px', borderRadius:8,
                border:`1px solid ${V.sep}`, background:V.fill, color:V.label,
                fontSize:12, outline:'none', boxSizing:'border-box',
              }}
            />
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:V.label4, fontSize:13 }}>🔍</span>
          </div>
        </div>

        {/* Lista de conversas */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loadingConvs ? (
            <div style={{ padding:20, textAlign:'center', color:V.label4, fontSize:12 }}>Carregando...</div>
          ) : convsFiltradas.length === 0 ? (
            <div style={{ padding:20, textAlign:'center', color:V.label4, fontSize:12 }}>
              Nenhuma conversa {statusSel}
            </div>
          ) : convsFiltradas.map(c => (
            <ItemConversa
              key={c.telefone}
              conv={c}
              selecionado={selTel === c.telefone}
              status={statusMap[c.telefone] || 'pendente'}
              onClick={() => setSelTel(c.telefone)}
            />
          ))}
        </div>
      </div>

      {/* ── COLUNA 2: Chat ──────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {!selTel ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:V.label4 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
              <div style={{ fontSize:14 }}>Selecione uma conversa</div>
              <div style={{ fontSize:12, marginTop:4 }}>{convsFiltradas.length} {statusSel}</div>
            </div>
          </div>
        ) : (
          <>
            {/* Header do chat */}
            <div style={{
              padding:'10px 16px', borderBottom:`1px solid ${V.sep}`,
              display:'flex', alignItems:'center', gap:12, background:V.bg, flexShrink:0,
            }}>
              <Avatar nome={convSel?.nome || selTel} size={36} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:V.label }}>
                  {convSel?.nome || selTel}
                </div>
                <div style={{ fontSize:11, color:V.label4 }}>{selTel}</div>
              </div>

              {/* Controles de status */}
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                {Object.entries(STATUS_MAP).map(([key, info]) => (
                  <button key={key} onClick={() => setStatus(selTel, key)} style={{
                    padding:'4px 10px', borderRadius:20, border:`1px solid ${info.color}40`,
                    background: (statusMap[selTel]||'pendente') === key ? info.color : 'transparent',
                    color: (statusMap[selTel]||'pendente') === key ? '#fff' : info.color,
                    fontSize:11, cursor:'pointer', fontWeight:500,
                  }}>
                    {info.label}
                  </button>
                ))}

                {/* Modo manual */}
                <button onClick={() => toggleManual(selTel)} title={modoMap[selTel]==='manual' ? 'IA pausada — clique para reativar' : 'Assumir atendimento'} style={{
                  padding:'4px 10px', borderRadius:20, border:`1px solid ${V.sep}`,
                  background: modoMap[selTel]==='manual' ? '#ef4444' : V.fill,
                  color: modoMap[selTel]==='manual' ? '#fff' : V.label3,
                  fontSize:11, cursor:'pointer',
                }}>
                  {modoMap[selTel]==='manual' ? '🔇 Manual' : '👤 Assumir'}
                </button>
              </div>
            </div>

            {/* Mensagens */}
            <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
              {hasMore && (
                <div style={{ textAlign:'center', marginBottom:8 }}>
                  <button onClick={() => carregarMsgs(selTel, offset)} style={{
                    fontSize:11, color:V.accent, background:'none', border:'none', cursor:'pointer',
                  }}>
                    Carregar mais
                  </button>
                </div>
              )}
              {loadingMsgs ? (
                <div style={{ textAlign:'center', color:V.label4, fontSize:12, padding:20 }}>Carregando...</div>
              ) : msgs.map(m => <Bolha key={m.id} msg={m} />)}
              <div ref={chatEndRef} />
            </div>

            {/* Sugestões */}
            {sugestoes.length > 0 && (
              <div style={{ padding:'6px 12px', borderTop:`1px solid ${V.sep}`, display:'flex', gap:6, flexWrap:'wrap' }}>
                {sugestoes.slice(0,3).map((s,i) => (
                  <button key={i} onClick={() => setDigitando(s)} style={{
                    fontSize:11, padding:'4px 10px', borderRadius:20,
                    border:`1px solid ${V.sep}`, background:V.fill,
                    color:V.label3, cursor:'pointer',
                  }}>{s}</button>
                ))}
              </div>
            )}

            {/* Input de envio */}
            <div style={{ padding:'10px 12px', borderTop:`1px solid ${V.sep}`, display:'flex', gap:8, background:V.bg, flexShrink:0 }}>
              <textarea
                value={digitando}
                onChange={e => setDigitando(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); enviarMsg() } }}
                placeholder="Digite uma mensagem... (Enter para enviar)"
                rows={2}
                style={{
                  flex:1, padding:'8px 12px', borderRadius:10,
                  border:`1px solid ${V.sep}`, background:V.fill, color:V.label,
                  fontSize:13, resize:'none', outline:'none', fontFamily:'inherit',
                  lineHeight:1.4,
                }}
              />
              <button onClick={enviarMsg} disabled={enviando || !digitando.trim()} style={{
                padding:'0 18px', borderRadius:10, border:'none',
                background: (!enviando && digitando.trim()) ? V.accent : V.fill,
                color: (!enviando && digitando.trim()) ? '#fff' : V.label4,
                cursor: (!enviando && digitando.trim()) ? 'pointer' : 'not-allowed',
                fontSize:18, flexShrink:0,
              }}>
                {enviando ? '...' : '➤'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── COLUNA 3: Painel lateral ────────────────────────────────────────── */}
      {selTel && (
        <div style={{ width:300, flexShrink:0, borderLeft:`1px solid ${V.sep}`, display:'flex', flexDirection:'column', background:V.bg }}>

          {/* Abas do painel */}
          <div style={{ display:'flex', borderBottom:`1px solid ${V.sep}`, flexShrink:0 }}>
            {[['perfil','👤','Perfil'],['catalogo','🛍️','Catálogo'],['carrinho','🛒','Carrinho']].map(([key,icon,label]) => (
              <button key={key} onClick={() => setAbaLateral(key)} style={{
                flex:1, padding:'10px 4px', border:'none', cursor:'pointer',
                background: abaLateral===key ? `${V.accent}12` : 'transparent',
                borderBottom: abaLateral===key ? `2px solid ${V.accent}` : '2px solid transparent',
                color: abaLateral===key ? V.accent : V.label3,
                fontSize:11, display:'flex', flexDirection:'column', alignItems:'center', gap:2,
              }}>
                <span style={{ fontSize:16 }}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>

            {/* ABA: Perfil */}
            {abaLateral === 'perfil' && (
              <div style={{ padding:16 }}>
                {perfilDados ? (
                  <>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                      <Avatar nome={perfilDados.nome || selTel} size={44} />
                      <div>
                        <div style={{ fontSize:14, fontWeight:600, color:V.label }}>{perfilDados.nome || 'Sem nome'}</div>
                        <div style={{ fontSize:11, color:V.label4 }}>{selTel}</div>
                      </div>
                    </div>
                    {[
                      ['📅 Cliente desde', perfilDados.criado_em ? new Date(perfilDados.criado_em).toLocaleDateString('pt-BR') : '—'],
                      ['💬 Total msgs', perfilDados.mensagens?.total || 0],
                      ['📥 Recebidas', perfilDados.mensagens?.recebidas || 0],
                      ['🤖 Modo', perfilDados.modo === 'manual' ? '👤 Manual' : '🤖 IA'],
                    ].map(([label, val]) => (
                      <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:`1px solid ${V.sep}` }}>
                        <span style={{ fontSize:12, color:V.label3 }}>{label}</span>
                        <span style={{ fontSize:12, color:V.label }}>{val}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ color:V.label4, fontSize:12, textAlign:'center', padding:20 }}>Carregando...</div>
                )}
              </div>
            )}

            {/* ABA: Catálogo */}
            {abaLateral === 'catalogo' && (
              <div style={{ padding:12 }}>
                <input
                  value={buscaCat} onChange={e => setBuscaCat(e.target.value)}
                  placeholder="Buscar produto..."
                  style={{
                    width:'100%', padding:'7px 10px', borderRadius:8, marginBottom:10,
                    border:`1px solid ${V.sep}`, background:V.fill, color:V.label,
                    fontSize:12, outline:'none', boxSizing:'border-box',
                  }}
                />
                {catalogo.map((p, i) => (
                  <div key={i} style={{
                    padding:'8px 10px', borderRadius:8, marginBottom:6,
                    border:`1px solid ${V.sep}`, background:V.bg2,
                  }}>
                    <div style={{ fontSize:12, fontWeight:600, color:V.label, marginBottom:4, lineHeight:1.3 }}>{p.nome}</div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontSize:11, color:V.label3 }}>💳 R$ {p.preco}</div>
                        <div style={{ fontSize:11, color:V.accent }}>💰 PIX: R$ {(parseFloat(p.preco||0)*0.9).toFixed(2)}</div>
                      </div>
                      <button onClick={() => enviarProduto(p)} style={{
                        padding:'4px 10px', borderRadius:8, border:'none',
                        background:`${V.accent}20`, color:V.accent,
                        fontSize:11, cursor:'pointer',
                      }}>
                        Enviar
                      </button>
                    </div>
                    {p.estoque > 0 && (
                      <div style={{ fontSize:10, color:'#059669', marginTop:3 }}>✓ {p.estoque} em estoque</div>
                    )}
                  </div>
                ))}
                {buscaCat && catalogo.length === 0 && (
                  <div style={{ color:V.label4, fontSize:12, textAlign:'center', padding:20 }}>Nenhum produto encontrado</div>
                )}
              </div>
            )}

            {/* ABA: Carrinho */}
            {abaLateral === 'carrinho' && (
              <div style={{ padding:12 }}>
                {(carrinhoMap[selTel]||[]).length === 0 ? (
                  <div style={{ color:V.label4, fontSize:12, textAlign:'center', padding:20 }}>
                    🛒 Carrinho vazio
                  </div>
                ) : (
                  <>
                    {carrinhoMap[selTel].map((item, i) => {
                      const sub    = (parseFloat(item.preco||0) * item.quantidade).toFixed(2)
                      const subPix = (parseFloat(item.preco||0) * item.quantidade * 0.9).toFixed(2)
                      return (
                        <div key={i} style={{ padding:'8px 10px', borderRadius:8, marginBottom:6, border:`1px solid ${V.sep}`, background:V.bg2 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:V.label, marginBottom:4 }}>{item.nome}</div>
                          <div style={{ fontSize:11, color:V.label3 }}>Qtd: {item.quantidade}</div>
                          <div style={{ fontSize:11, color:V.label3 }}>💳 R$ {sub}</div>
                          <div style={{ fontSize:11, color:V.accent }}>💰 PIX: R$ {subPix}</div>
                        </div>
                      )
                    })}
                    {/* Total */}
                    <div style={{ borderTop:`1px solid ${V.sep}`, marginTop:8, paddingTop:8 }}>
                      {(() => {
                        const tot    = carrinhoMap[selTel].reduce((s,i) => s+(parseFloat(i.preco||0)*i.quantidade),0)
                        const totPix = (tot*0.9).toFixed(2)
                        return (
                          <>
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:V.label3 }}>
                              <span>💳 Total cartão</span>
                              <span style={{ fontWeight:600, color:V.label }}>R$ {tot.toFixed(2)}</span>
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:V.accent, marginTop:4 }}>
                              <span>💰 Total PIX</span>
                              <span style={{ fontWeight:600 }}>R$ {totPix}</span>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
