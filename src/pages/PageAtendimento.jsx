import { useState, useEffect, useCallback, useRef, memo } from 'react'

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtR   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmtHora= ts => ts ? new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : ''
const fmtRel = ts => {
  if (!ts) return '—'
  const s = Math.floor((Date.now()-new Date(ts).getTime())/1000)
  if (s < 60)   return `${s}s`
  if (s < 3600) return `${Math.floor(s/60)}m`
  if (s < 86400)return `${Math.floor(s/3600)}h`
  return `${Math.floor(s/86400)}d`
}
const fmtTel = tel => {
  const t = (tel||'').replace(/\D/g,'').replace(/^55/,'')
  return t.length === 11 ? `(${t.slice(0,2)}) ${t.slice(2,7)}-${t.slice(7)}` : tel
}
const iniciais = n => (n||'?').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?'
const CORES    = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ec4899','#06b6d4','#ef4444']
const cor      = s => CORES[(s||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % CORES.length]
const ativo    = s => Date.now()-new Date(s?.atualizado_em||0).getTime() < 30*60*1000

const STATUS_CORES = {
  aberto:     { bg:'bg-amber-500/10',    text:'text-amber-400',  dot:'bg-amber-400',  label:'Aberto'       },
  andamento:  { bg:'bg-blue-500/10',     text:'text-blue-400',   dot:'bg-blue-400',   label:'Em andamento' },
  resolvido:  { bg:'bg-emerald-500/10',  text:'text-emerald-400',dot:'bg-emerald-400',label:'Resolvido'    },
  aguardando: { bg:'bg-purple-500/10',   text:'text-purple-400', dot:'bg-purple-400', label:'Aguardando'   },
}

// ── Avatar com foto real do WhatsApp ──────────────────────────────────────────
function Avatar({ sessao, size = 38 }) {
  const [err, setErr] = useState(false)
  const nome = sessao?.nome || sessao?.telefone || '?'
  const foto = sessao?.foto_url || sessao?.fotoUrl || null
  const bg   = cor(nome)
  const s    = { width: size, height: size }

  return (
    <div className="relative flex-shrink-0 rounded-full overflow-hidden" style={s}>
      {foto && !err
        ? <img src={foto} alt={nome} className="w-full h-full object-cover"
            onError={() => setErr(true)} />
        : <div className="w-full h-full flex items-center justify-center text-white font-bold"
            style={{ background: bg, fontSize: Math.round(size * 0.35) }}>
            {iniciais(nome)}
          </div>
      }
      {/* bolinha status online */}
      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-2)] ${ativo(sessao) ? 'bg-emerald-400' : 'bg-gray-500'}`} />
    </div>
  )
}

// ── Bolha de mensagem ──────────────────────────────────────────────────────────
const Bolha = memo(function Bolha({ msg }) {
  const entrada = msg.direcao === 'entrada'
  const texto   = (msg.conteudo || '').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g, '').trim()
  const label   = !entrada ? (msg.modo==='transacional'?'⚡ Gatilho': msg.modo==='manual'?'👤 Atendente':'🤖 Bia') : null
  const bubbleBg = entrada
    ? 'bg-[var(--bg-3)] border border-[var(--sep)]'
    : msg.modo==='transacional' ? 'bg-violet-500/10 border border-violet-500/20'
    : msg.modo==='manual'       ? 'bg-blue-500/10 border border-blue-500/20'
    : 'bg-emerald-500/10 border border-emerald-500/20'

  return (
    <div className={`flex flex-col mb-2 ${entrada ? 'items-start' : 'items-end'}`}>
      {label && (
        <span className={`text-[9px] font-semibold mb-1 px-1.5 ${
          msg.modo==='transacional' ? 'text-violet-400' :
          msg.modo==='manual'       ? 'text-blue-400'   : 'text-emerald-400'
        }`}>{label}</span>
      )}
      <div className={`flex items-end gap-1.5 ${entrada ? 'flex-row' : 'flex-row-reverse'}`}>
        {entrada && (
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[8px] text-emerald-400 font-bold flex-shrink-0">C</div>
        )}
        <div className={`max-w-[72%] rounded-2xl px-3 py-2 ${bubbleBg} ${entrada ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}>
          {msg.midia_tipo === 'image' && msg.midia_url && (
            <img src={msg.midia_url} alt="" className="w-full rounded-lg mb-1.5 max-h-36 object-cover"
              onError={e => e.target.style.display='none'} />
          )}
          {texto && (
            <p className="text-[12.5px] leading-relaxed text-[var(--label)] whitespace-pre-wrap break-words">{texto}</p>
          )}
          <p className={`text-[9px] mt-1 text-[var(--label-3)] ${entrada ? 'text-left' : 'text-right'}`}>
            {fmtHora(msg.criado_em)}
            {!entrada && <span className="ml-1">✓✓</span>}
          </p>
        </div>
      </div>
    </div>
  )
})

// ── Separador de data ──────────────────────────────────────────────────────────
function DateSep({ data }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[var(--sep)]" />
      <span className="text-[10px] text-[var(--label-4)] font-medium px-2 py-0.5 rounded-full border border-[var(--sep)] bg-[var(--bg-2)]">
        {new Date(data).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}
      </span>
      <div className="flex-1 h-px bg-[var(--sep)]" />
    </div>
  )
}

// ── Painel Direito: Info do cliente ───────────────────────────────────────────
function PainelInfo({ sessao, api, pedidosCliente, statusAtend, setStatusAtend }) {
  const [aba, setAba] = useState('perfil')
  const [perfil, setPerfil] = useState(null)
  const [busca, setBusca] = useState('')
  const [produtos, setProdutos] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [enviando, setEnviando] = useState(null)
  const nome = sessao?.nome || fmtTel(sessao?.telefone)
  const c    = cor(nome)

  // Carrega perfil do cliente
  useEffect(() => {
    if (!sessao?.telefone) return
    let mounted = true
    fetch(`${api}/api/contatos/${sessao.telefone}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (mounted && d) setPerfil(d) })
      .catch(() => {})
    return () => { mounted = false }
  }, [api, sessao?.telefone])

  const buscarProdutos = async () => {
    if (!busca.trim()) return
    setBuscando(true); setProdutos([])
    try {
      const r = await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(busca)}`)
      if (r.ok) { const d = await r.json(); setProdutos(d.produtos || []) }
    } catch {}
    setBuscando(false)
  }

  const enviarProduto = async prod => {
    setEnviando(prod.id || prod.nome)
    const pix = (parseFloat(prod.preco || prod.precoVenda || 0) * 0.9).toFixed(2)
    const msg = `*${prod.nome || prod.descricao}*\n💳 Cartão: ${fmtR(prod.preco || prod.precoVenda || 0)} | 💰 PIX: R$ ${pix}\n${prod.disponivel !== false ? '✅ Disponível' : '⚠️ Indisponível'}`
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: sessao.telefone, mensagem: msg })
      })
    } catch {}
    setEnviando(null)
  }

  const mapSit = s => {
    const id = typeof s==='object' ? s?.id||s?.valor : s
    return {6:'Aberto',9:'Atendido',12:'Cancelado',14:'Faturado',15:'Verificado'}[id] || String(id||'—')
  }

  const ABAS = [
    { id:'perfil',   label:'Perfil'    },
    { id:'pedidos',  label:'Pedidos'   },
    { id:'catalogo', label:'Catálogo'  },
  ]

  return (
    <div className="w-56 flex-shrink-0 flex flex-col overflow-hidden border-l border-[var(--sep)] bg-[var(--bg-2)]">

      {/* Mini header do cliente */}
      <div className="px-3 py-3 border-b border-[var(--sep)] flex items-center gap-2.5 flex-shrink-0">
        <Avatar sessao={sessao} size={32} />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-[var(--label)] truncate">{nome}</p>
          <p className="text-[10px] text-[var(--label-4)]">{fmtTel(sessao?.telefone)}</p>
        </div>
      </div>

      {/* Status atendimento */}
      <div className="px-3 py-2.5 border-b border-[var(--sep)] flex-shrink-0">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--label-4)] mb-1.5">Status</p>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(STATUS_CORES).map(([key, st]) => (
            <button key={key} onClick={() => setStatusAtend(key)}
              className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-[9px] font-semibold border transition-all ${
                statusAtend === key
                  ? `${st.bg} ${st.text} border-current`
                  : 'border-transparent text-[var(--label-4)] hover:bg-[var(--bg-3)]'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusAtend===key ? st.dot : 'bg-[var(--label-4)]'}`} />
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--sep)] flex-shrink-0">
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`flex-1 py-2 text-[10px] font-semibold transition-colors border-b-2 ${
              aba === a.id
                ? 'text-[var(--accent)] border-[var(--accent)]'
                : 'text-[var(--label-4)] border-transparent hover:text-[var(--label-3)]'
            }`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das abas */}
      <div className="flex-1 overflow-y-auto p-3">

        {/* ABA: Perfil */}
        {aba === 'perfil' && (
          <div className="space-y-2">
            {perfil ? [
              { label: 'Nome',        value: perfil.nome },
              { label: 'Telefone',    value: fmtTel(perfil.telefone || sessao?.telefone) },
              { label: 'E-mail',      value: perfil.email },
              { label: 'Cidade',      value: perfil.cidade },
              { label: 'Documento',   value: perfil.cpf || perfil.cnpj },
              { label: 'Total gasto', value: perfil.total_gasto ? fmtR(perfil.total_gasto) : null },
            ].filter(i => i.value).map((item, i) => (
              <div key={i}>
                <p className="text-[9px] text-[var(--label-4)] uppercase tracking-wider mb-0.5">{item.label}</p>
                <p className="text-[11px] font-medium text-[var(--label)]">{item.value}</p>
              </div>
            )) : (
              <div className="py-6 text-center">
                <p className="text-[11px] text-[var(--label-4)]">Sem cadastro vinculado</p>
              </div>
            )}

            {/* Carrinho */}
            {(sessao?.carrinho?.length > 0) && (
              <div className="mt-3 pt-3 border-t border-[var(--sep)]">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--label-4)] mb-2">🛒 Carrinho</p>
                {sessao.carrinho.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-[var(--sep)] last:border-0">
                    <span className="text-[10px] text-[var(--label-2)] truncate flex-1 mr-2">{item.quantidade}× {(item.nome||'').slice(0,20)}</span>
                    <span className="text-[10px] font-semibold text-amber-400">{fmtR(item.preco * item.quantidade)}</span>
                  </div>
                ))}
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-[var(--label-3)]">Total</span>
                  <span className="text-[11px] font-bold text-amber-400">{fmtR(sessao.carrinho.reduce((s,i)=>s+(i.preco*i.quantidade),0))}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA: Pedidos */}
        {aba === 'pedidos' && (
          <div className="space-y-2">
            {pedidosCliente.length === 0
              ? <p className="text-[11px] text-[var(--label-4)] text-center py-6">Nenhum pedido</p>
              : pedidosCliente.map((p, i) => {
                  const sit = mapSit(p.situacao)
                  const sitCor = {Atendido:'text-emerald-400',Verificado:'text-emerald-400',Aberto:'text-amber-400',Cancelado:'text-red-400',Faturado:'text-blue-400'}[sit] || 'text-[var(--label-3)]'
                  return (
                    <div key={i} className="rounded-xl p-2.5 bg-[var(--bg)] border border-[var(--sep)]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold text-[var(--accent)]">#{p.numero}</span>
                        <span className={`text-[9px] font-semibold ${sitCor}`}>{sit}</span>
                      </div>
                      <p className="text-[9px] text-[var(--label-4)] mb-1">{p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '—'}</p>
                      <p className="text-[12px] font-semibold text-[var(--label)]">{fmtR(p.total)}</p>
                    </div>
                  )
                })
            }
          </div>
        )}

        {/* ABA: Catálogo */}
        {aba === 'catalogo' && (
          <div className="space-y-2">
            <div className="flex gap-1.5">
              <input value={busca} onChange={e=>setBusca(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&buscarProdutos()}
                placeholder="Buscar produto..."
                className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--sep)] text-[var(--label)] outline-none focus:border-[var(--accent)] transition-colors"
              />
              <button onClick={buscarProdutos} disabled={buscando}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--accent)] text-black text-[10px] font-bold disabled:opacity-50">
                {buscando ? '…' : '↵'}
              </button>
            </div>
            {produtos.length === 0
              ? <p className="text-[10px] text-[var(--label-4)] text-center py-4">Digite e pressione Enter</p>
              : produtos.map((p, i) => (
                <div key={i} className="rounded-xl p-2.5 bg-[var(--bg)] border border-[var(--sep)]">
                  <p className="text-[11px] font-semibold text-[var(--label)] mb-1 leading-tight">{p.nome || p.descricao}</p>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] font-bold text-[var(--accent)]">{fmtR(p.preco || p.precoVenda || 0)}</span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${p.disponivel !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {p.disponivel !== false ? '✓ Disponível' : '✗ Indisponível'}
                    </span>
                  </div>
                  <button onClick={() => enviarProduto(p)} disabled={enviando === (p.id||p.nome)}
                    className="w-full py-1 rounded-lg border border-[var(--accent)] text-[var(--accent)] text-[10px] font-semibold hover:bg-[var(--accent)] hover:text-black transition-all disabled:opacity-50 flex items-center justify-center gap-1">
                    {enviando === (p.id||p.nome) ? 'Enviando…' : '↗ Enviar ao cliente'}
                  </button>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}

// ── Barra de envio Enterprise ─────────────────────────────────────────────────
function BarraEnvio({ telefone, api, modoManual, onEnviou, onAssumirIA }) {
  const [texto,     setTexto]     = useState('')
  const [enviando,  setEnviando]  = useState(false)
  const [anotacao,  setAnotacao]  = useState(false)
  const [sugestoes, setSugestoes] = useState([])
  const [loadSug,   setLoadSug]   = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const inputRef = useRef(null)
  const imgRef   = useRef(null)
  const vidRef   = useRef(null)

  const EMOJIS = ['😊','👍','🙏','❤️','✅','📦','💰','🚀','😅','🎉','💬','⏳']

  const buscarSugestoes = useCallback(async () => {
    setLoadSug(true)
    try {
      const r = await fetch(`${api}/api/sugestoes/${telefone}`)
      if (r.ok) { const d = await r.json(); setSugestoes(d.sugestoes || []) }
    } catch {}
    setLoadSug(false)
  }, [api, telefone])

  useEffect(() => {
    if (modoManual && telefone) buscarSugestoes()
    else setSugestoes([])
  }, [modoManual, telefone])

  const enviar = async (msg) => {
    const txt = (msg || texto).trim()
    if (!txt || enviando) return
    setTexto(''); setSugestoes([])
    setEnviando(true)
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone, mensagem: txt })
      })
      onEnviou?.()
    } catch {}
    setEnviando(false)
    inputRef.current?.focus()
  }

  const enviarArquivo = async (file, tipo) => {
    if (!file) return
    // Converte para base64 e envia via API
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]
      try {
        await fetch(`${api}/api/dashboard/mensagem`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telefone,
            tipo: tipo,
            midia_base64: base64,
            midia_nome: file.name,
          })
        })
        onEnviou?.()
      } catch(e) { console.error('Upload:', e) }
    }
    reader.readAsDataURL(file)
  }

  if (!modoManual) return (
    <div className="px-4 py-3 border-t border-[var(--sep)] bg-[var(--bg-2)] flex items-center justify-between gap-3 flex-shrink-0">
      <p className="text-[11px] text-[var(--label-4)]">IA respondendo automaticamente</p>
      <button onClick={onAssumirIA}
        className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-semibold hover:bg-blue-500/20 transition-colors flex items-center gap-1.5">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        Assumir conversa
      </button>
    </div>
  )

  return (
    <div className="border-t border-[var(--sep)] bg-[var(--bg-2)] flex-shrink-0">
      {/* Abas resposta / anotação */}
      <div className="flex border-b border-[var(--sep)]">
        {[{id:false,label:'Resposta pública'},{id:true,label:'Anotação interna'}].map(a => (
          <button key={String(a.id)} onClick={() => setAnotacao(a.id)}
            className={`px-3 py-2 text-[11px] font-semibold border-b-2 transition-all ${
              anotacao === a.id
                ? 'text-[var(--accent)] border-[var(--accent)]'
                : 'text-[var(--label-4)] border-transparent hover:text-[var(--label-3)]'
            }`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Sugestões da IA */}
      {sugestoes.length > 0 && (
        <div className="px-3 py-2 flex gap-1.5 flex-wrap border-b border-[var(--sep)] items-center">
          <svg className="w-3 h-3 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.3A7 7 0 0 1 5 9a7 7 0 0 1 7-7zm-2 18h4v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1z"/></svg>
          {sugestoes.slice(0, 3).map((s, i) => (
            <button key={i} onClick={() => enviar(s)}
              className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[var(--label-2)] hover:bg-amber-500/20 max-w-[220px] truncate transition-colors">
              {s}
            </button>
          ))}
          <button onClick={buscarSugestoes} className="ml-auto text-[10px] text-[var(--label-4)] hover:text-[var(--label-3)]">
            {loadSug ? '…' : '↻'}
          </button>
        </div>
      )}

      {/* Picker emoji */}
      {emojiOpen && (
        <div className="px-3 py-2 flex flex-wrap gap-1.5 border-b border-[var(--sep)]">
          {EMOJIS.map(e => (
            <button key={e} onClick={() => { setTexto(t => t + e); setEmojiOpen(false); inputRef.current?.focus() }}
              className="text-lg hover:scale-125 transition-transform">
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Input principal */}
      <div className="px-3 pt-2 pb-1">
        {anotacao && (
          <div className="text-[9px] font-bold text-violet-400 mb-1.5 flex items-center gap-1">
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Anotação interna — não enviada ao cliente
          </div>
        )}
        <textarea ref={inputRef} value={texto} onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
          placeholder={anotacao ? 'Escreva uma anotação interna...' : 'Escreva uma mensagem...'}
          rows={2}
          className="w-full bg-transparent text-[13px] text-[var(--label)] resize-none outline-none leading-relaxed placeholder:text-[var(--label-4)]"
        />
      </div>

      {/* Toolbar de ações */}
      <div className="px-3 pb-2.5 flex items-center gap-1">
        {/* Emoji */}
        <button onClick={() => setEmojiOpen(v => !v)} title="Emoji"
          className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center ${emojiOpen ? 'border-[var(--accent)] bg-[var(--accent-dim)]' : 'border-[var(--sep)] hover:bg-[var(--bg-3)]'}`}>
          <svg className={`w-3.5 h-3.5 ${emojiOpen ? 'text-[var(--accent)]' : 'text-[var(--label-3)]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        </button>

        {/* Imagem */}
        <label title="Enviar imagem" className="w-7 h-7 rounded-lg border border-[var(--sep)] hover:bg-[var(--bg-3)] transition-all flex items-center justify-center cursor-pointer">
          <svg className="w-3.5 h-3.5 text-[var(--label-3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <input ref={imgRef} type="file" accept="image/*" className="hidden"
            onChange={e => { if (e.target.files[0]) enviarArquivo(e.target.files[0], 'image'); e.target.value = '' }} />
        </label>

        {/* Vídeo */}
        <label title="Enviar vídeo" className="w-7 h-7 rounded-lg border border-[var(--sep)] hover:bg-[var(--bg-3)] transition-all flex items-center justify-center cursor-pointer">
          <svg className="w-3.5 h-3.5 text-[var(--label-3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          <input ref={vidRef} type="file" accept="video/*" className="hidden"
            onChange={e => { if (e.target.files[0]) enviarArquivo(e.target.files[0], 'video'); e.target.value = '' }} />
        </label>

        {/* Áudio */}
        <button title="Gravar áudio"
          className="w-7 h-7 rounded-lg border border-[var(--sep)] hover:bg-[var(--bg-3)] transition-all flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-[var(--label-3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </button>

        {/* Sugerir IA */}
        <button onClick={buscarSugestoes} title="Sugestões da IA" disabled={loadSug}
          className="w-7 h-7 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 transition-all flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.3A7 7 0 0 1 5 9a7 7 0 0 1 7-7z"/></svg>
        </button>

        <div className="flex-1" />

        {/* Botão enviar */}
        <button onClick={() => enviar()} disabled={!texto.trim() || enviando}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
            texto.trim() && !enviando
              ? 'bg-[var(--accent)] text-black hover:opacity-90'
              : 'bg-[var(--fill)] text-[var(--label-4)] cursor-default'
          }`}>
          {enviando ? (
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          ) : (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          )}
          Enviar
        </button>
      </div>
    </div>
  )
}

// ── Chat central ──────────────────────────────────────────────────────────────
function Chat({ sessao, api, onClose }) {
  const [msgs,       setMsgs]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [hasMore,    setHasMore]    = useState(false)
  const [offset,     setOffset]     = useState(0)
  const [modo,       setModo]       = useState(sessao?.modo || 'ia')
  const [ctxData,    setCtxData]    = useState(null)
  const [statusAtend,setStatusAtend]= useState('aberto')
  const [pedidos,    setPedidos]    = useState([])
  const bottomRef   = useRef(null)
  const prevLenRef  = useRef(0)
  const pollingRef  = useRef(null)

  const nome = sessao?.nome || fmtTel(sessao?.telefone)
  const c    = cor(nome)

  // Carrega histórico — sem loop: só roda quando telefone ou offset mudam
  const carregarHistorico = useCallback(async (off = 0, silencioso = false) => {
    if (!sessao?.telefone) return
    if (!silencioso) setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${sessao.telefone}?limit=60&offset=${off}`)
      if (!r.ok) return
      const d = await r.json()
      const novas = d.mensagens || []
      if (off === 0) setMsgs(novas)
      else setMsgs(prev => [...novas, ...prev])
      setHasMore(d.hasMore || false)
      setOffset(off === 0 ? novas.length : off + novas.length)
      setCtxData({ carrinho: d.carrinho || [], modo: d.modo || 'ia' })
      setModo(d.modo || sessao?.modo || 'ia')
    } catch {}
    if (!silencioso) setLoading(false)
  }, [api, sessao?.telefone])

  // Carrega pedidos do cliente — uma vez
  useEffect(() => {
    if (!sessao?.telefone) return
    let mounted = true
    fetch(`${api}/api/contatos/${sessao.telefone}/pedidos`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (mounted && d?.pedidos) setPedidos(d.pedidos) })
      .catch(() => {})
    return () => { mounted = false }
  }, [api, sessao?.telefone])

  // Carga inicial + polling controlado
  useEffect(() => {
    if (!sessao?.telefone) return
    prevLenRef.current = 0
    setMsgs([]); setOffset(0); setLoading(true)
    carregarHistorico(0, false)

    // Polling apenas quando visível — intervalo lento (12s)
    pollingRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        carregarHistorico(0, true)
      }
    }, 12000)

    return () => {
      clearInterval(pollingRef.current)
    }
  }, [sessao?.telefone]) // Só re-executa quando muda o telefone

  // Scroll automático apenas quando chega mensagem nova
  useEffect(() => {
    if (msgs.length > prevLenRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: prevLenRef.current === 0 ? 'instant' : 'smooth' })
    }
    prevLenRef.current = msgs.length
  }, [msgs.length])

  // Agrupamento por data — memoized
  const grupos = (() => {
    const g = []; let dAtual = null
    for (const m of msgs) {
      const d = new Date(m.criado_em).toDateString()
      if (d !== dAtual) { g.push({ tipo: 'sep', data: m.criado_em }); dAtual = d }
      g.push({ tipo: 'msg', msg: m })
    }
    return g
  })()

  const alternarModo = async novoModo => {
    try {
      await fetch(`${api}/api/dashboard/manual/${sessao.telefone}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo: novoModo })
      })
      setModo(novoModo)
    } catch {}
  }

  const resetarSessao = async () => {
    if (!confirm(`Resetar sessão de ${nome}? O carrinho será limpo.`)) return
    try {
      await fetch(`${api}/api/dashboard/resetar-sessao?telefone=${sessao.telefone}&confirmar=sim`)
      carregarHistorico(0, false)
    } catch {}
  }

  const sessaoComCtx = { ...sessao, carrinho: ctxData?.carrinho || sessao?.carrinho || [] }

  return (
    <div className="flex flex-1 overflow-hidden min-w-0">

      {/* ── Área da conversa ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--sep)] bg-[var(--bg-2)] flex-shrink-0">
          {/* Voltar */}
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg border border-[var(--sep)] flex items-center justify-center hover:bg-[var(--bg-3)] transition-colors">
            <svg className="w-3.5 h-3.5 text-[var(--label-3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <Avatar sessao={sessao} size={34} />

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[var(--label)] truncate">{nome}</p>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] ${ativo(sessao) ? 'text-emerald-400' : 'text-[var(--label-4)]'}`}>
                {ativo(sessao) ? '● online' : '○ inativo'} · {fmtRel(sessao?.atualizado_em)}
              </span>
            </div>
          </div>

          {/* Modo IA/Manual */}
          <button onClick={() => alternarModo(modo === 'manual' ? 'ia' : 'manual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
              modo === 'manual'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                : 'bg-[var(--fill)] border-[var(--sep)] text-[var(--label-3)] hover:bg-[var(--bg-3)]'
            }`}>
            {modo === 'manual'
              ? <><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M8 12h8"/></svg> Devolver à IA</>
              : <><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> Assumir</>
            }
          </button>

          {/* Atualizar */}
          <button onClick={() => carregarHistorico(0, false)}
            className="w-7 h-7 rounded-lg border border-[var(--sep)] flex items-center justify-center hover:bg-[var(--bg-3)] transition-colors">
            <svg className="w-3.5 h-3.5 text-[var(--label-3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-.96-7.3"/></svg>
          </button>

          {/* Resetar */}
          <button onClick={resetarSessao}
            className="w-7 h-7 rounded-lg border border-red-500/20 bg-red-500/5 flex items-center justify-center hover:bg-red-500/15 transition-colors" title="Resetar sessão">
            <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>

        {/* Banner carrinho */}
        {sessaoComCtx.carrinho.length > 0 && (
          <div className="px-4 py-2 bg-amber-500/8 border-b border-amber-500/20 flex-shrink-0">
            <p className="text-[10px] font-semibold text-amber-400 mb-0.5">🛒 {sessaoComCtx.carrinho.length} item{sessaoComCtx.carrinho.length > 1 ? 's' : ''} no carrinho</p>
            <p className="text-[10px] text-[var(--label-3)] truncate">
              {sessaoComCtx.carrinho.slice(0, 2).map(i => `${i.quantidade}× ${i.nome}`).join(' · ')}
              {sessaoComCtx.carrinho.length > 2 ? ` +${sessaoComCtx.carrinho.length - 2}` : ''}
            </p>
          </div>
        )}

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-4 py-3 bg-[var(--bg)]">
          {hasMore && (
            <div className="text-center pb-3">
              <button onClick={() => carregarHistorico(offset)}
                className="text-[10px] text-[var(--accent)] border border-[var(--sep)] rounded-full px-3 py-1 hover:bg-[var(--bg-2)] transition-colors">
                Carregar anteriores
              </button>
            </div>
          )}
          {loading && msgs.length === 0
            ? <div className="flex items-center justify-center h-full text-[var(--label-4)] text-[12px]">Carregando...</div>
            : grupos.length === 0
              ? <div className="flex items-center justify-center h-full text-[var(--label-4)] text-[12px]">Nenhuma mensagem</div>
              : grupos.map((g, i) =>
                  g.tipo === 'sep'
                    ? <DateSep key={`s${i}`} data={g.data} />
                    : <Bolha key={g.msg.id || i} msg={g.msg} />
                )
          }
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <BarraEnvio
          telefone={sessao?.telefone}
          api={api}
          modoManual={modo === 'manual'}
          onEnviou={() => carregarHistorico(0, true)}
          onAssumirIA={() => alternarModo('manual')}
        />
      </div>

      {/* ── Painel direito ── */}
      <PainelInfo
        sessao={sessaoComCtx}
        api={api}
        pedidosCliente={pedidos}
        statusAtend={statusAtend}
        setStatusAtend={setStatusAtend}
      />
    </div>
  )
}

// ── Card de sessão na lista ────────────────────────────────────────────────────
const SessaoCard = memo(function SessaoCard({ sessao, selecionada, onClick }) {
  const nome     = sessao.nome || fmtTel(sessao.telefone)
  const selected = selecionada?.telefone === sessao.telefone
  const carrinho = parseInt(sessao.itens_carrinho) || 0
  const online   = ativo(sessao)

  return (
    <div onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-l-2 transition-all ${
        selected
          ? 'bg-[var(--accent-dim)] border-l-[var(--accent)]'
          : 'border-l-transparent hover:bg-[var(--bg-3)]'
      } border-b border-b-[var(--sep)]`}>

      <Avatar sessao={sessao} size={36} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-[12px] font-semibold truncate max-w-[140px] ${selected ? 'text-[var(--accent)]' : 'text-[var(--label)]'}`}>
            {nome}
          </span>
          <span className="text-[9px] text-[var(--label-4)] flex-shrink-0">{fmtRel(sessao.atualizado_em)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {online && <span className="text-[9px] text-emerald-400">● ativo</span>}
          {carrinho > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">
              🛒 {carrinho}
            </span>
          )}
          {sessao.modo === 'manual' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-medium">
              Manual
            </span>
          )}
        </div>
      </div>
    </div>
  )
})

// ── Página principal ───────────────────────────────────────────────────────────
export default function PageAtendimento({ api }) {
  const [sessoes,     setSessoes]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selecionada, setSelecionada] = useState(null)
  const [online,      setOnline]      = useState(true)
  const [ultimaSync,  setUltimaSync]  = useState(null)
  const [busca,       setBusca]       = useState('')
  const [filtro,      setFiltro]      = useState('todas')
  const pollingRef = useRef(null)

  const carregar = useCallback(async (silencioso = false) => {
    try {
      const r = await fetch(`${api}/api/dashboard/sessoes`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setSessoes(d.sessoes || [])
      setOnline(true)
      setUltimaSync(new Date())
    } catch { setOnline(false) }
    finally { if (!silencioso) setLoading(false) }
  }, [api])

  // Polling da lista — controlado, sem re-render cascata
  useEffect(() => {
    carregar(false)
    pollingRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') carregar(true)
    }, 15000)
    return () => clearInterval(pollingRef.current)
  }, []) // Sem dependências — roda uma vez

  // Atualiza sessão selecionada quando lista muda
  useEffect(() => {
    if (!selecionada) return
    const nova = sessoes.find(s => s.telefone === selecionada.telefone)
    if (nova && nova !== selecionada) setSelecionada(nova)
  }, [sessoes])

  const ativas      = sessoes.filter(s => ativo(s))
  const comCarrinho = sessoes.filter(s => parseInt(s.itens_carrinho) > 0)
  const manuais     = sessoes.filter(s => s.modo === 'manual')

  const filtradas = sessoes.filter(s => {
    const matchBusca = !busca || (s.nome||'').toLowerCase().includes(busca.toLowerCase()) || s.telefone?.includes(busca)
    const matchFiltro = filtro === 'todas' ? true
      : filtro === 'ativas'   ? ativo(s)
      : filtro === 'carrinho' ? parseInt(s.itens_carrinho) > 0
      : filtro === 'manual'   ? s.modo === 'manual'
      : true
    return matchBusca && matchFiltro
  })

  return (
    <div className="h-full flex overflow-hidden">

      {/* ── Sidebar de sessões ── */}
      <div className={`${selecionada ? 'w-72' : 'w-full max-w-lg'} flex-shrink-0 flex flex-col overflow-hidden border-r border-[var(--sep)] transition-all duration-200`}>

        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-[var(--sep)] flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[18px] font-bold text-[var(--label)]">Atendimento</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                {online
                  ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /><span className="text-[10px] text-[var(--label-4)]">{ativas.length} ativas · sync 15s</span></>
                  : <span className="text-[10px] text-red-400">● Sem conexão</span>
                }
              </div>
            </div>
            <button onClick={() => carregar(false)}
              className="w-8 h-8 rounded-lg border border-[var(--sep)] flex items-center justify-center hover:bg-[var(--bg-3)] transition-colors">
              <svg className="w-3.5 h-3.5 text-[var(--label-3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-.96-7.3"/></svg>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Ativas',    value: ativas.length,      color: 'text-emerald-400' },
              { label: 'Carrinho',  value: comCarrinho.length, color: 'text-amber-400'   },
              { label: 'Manual',    value: manuais.length,     color: 'text-blue-400'    },
              { label: 'Total 24h', value: sessoes.length,     color: 'text-[var(--label-3)]' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl bg-[var(--bg)] border border-[var(--sep)] p-2.5 text-center">
                <p className={`text-[18px] font-bold ${color}`}>{value}</p>
                <p className="text-[9px] text-[var(--label-4)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Busca */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--sep)] focus-within:border-[var(--accent)] transition-colors">
            <svg className="w-3.5 h-3.5 text-[var(--label-4)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="flex-1 bg-transparent text-[12px] text-[var(--label)] outline-none placeholder:text-[var(--label-4)]" />
            {busca && (
              <button onClick={() => setBusca('')} className="text-[var(--label-4)] hover:text-[var(--label-3)]">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-1 px-4 py-2 border-b border-[var(--sep)] flex-shrink-0 flex-wrap">
          {[
            { id:'todas',    label:`Todas (${sessoes.length})`       },
            { id:'ativas',   label:`Ativas (${ativas.length})`       },
            { id:'carrinho', label:`Carrinho (${comCarrinho.length})` },
            { id:'manual',   label:`Manual (${manuais.length})`      },
          ].map(f => (
            <button key={f.id} onClick={() => setFiltro(f.id)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                filtro === f.id
                  ? 'bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent)]'
                  : 'text-[var(--label-4)] border border-transparent hover:border-[var(--sep)]'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {loading
            ? <div className="p-8 text-center text-[12px] text-[var(--label-4)]">Carregando sessões...</div>
            : filtradas.length === 0
              ? <div className="p-8 text-center text-[12px] text-[var(--label-4)]">{busca ? 'Nenhum resultado' : 'Nenhuma sessão nas últimas 24h'}</div>
              : filtradas.map(s => (
                  <SessaoCard
                    key={s.telefone}
                    sessao={s}
                    selecionada={selecionada}
                    onClick={() => setSelecionada(s.telefone === selecionada?.telefone ? null : s)}
                  />
                ))
          }
        </div>

        {ultimaSync && (
          <div className="px-4 py-2 border-t border-[var(--sep)] flex-shrink-0">
            <p className="text-[9px] text-[var(--label-4)]">Último sync: {ultimaSync.toLocaleTimeString('pt-BR')}</p>
          </div>
        )}
      </div>

      {/* ── Painel de conversa ── */}
      {selecionada
        ? <Chat key={selecionada.telefone} sessao={selecionada} api={api} onClose={() => setSelecionada(null)} />
        : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[var(--bg-3)]">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-2)] border border-[var(--sep)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--label-4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p className="text-[14px] font-medium text-[var(--label)]">Selecione uma conversa</p>
            <p className="text-[12px] text-[var(--label-4)]">{ativas.length} conversa{ativas.length !== 1 ? 's' : ''} ativa{ativas.length !== 1 ? 's' : ''} agora</p>
          </div>
        )
      }
    </div>
  )
}
