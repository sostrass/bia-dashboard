import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RefreshCw, Send, MessageSquare, Search, X,
  ShoppingCart, User, Clock, Zap, AlertCircle,
  MoreVertical, CheckCircle, Circle, Wifi, WifiOff
} from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtTempo = ts => {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)   return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60)   return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24)   return `${h}h`
  return `${Math.floor(h/24)}d`
}

const fmtHora = ts => {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
}

const fmtTel = tel => {
  const t = (tel || '').replace(/\D/g,'').replace(/^55/,'')
  if (t.length === 11) return `(${t.slice(0,2)}) ${t.slice(2,7)}-${t.slice(7)}`
  return tel
}

const iniciais = nome => (nome||'?').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()
const cores    = ['#1D9E75','#378ADD','#534AB7','#e65100','#EF9F27','#993556','#25D366']
const cor      = str  => cores[(str||'').charCodeAt(0) % cores.length]

const ehAtiva  = s => Date.now() - new Date(s.atualizado_em).getTime() < 30 * 60 * 1000

// ── Bolha de mensagem ──────────────────────────────────────────────────────────
function Bolha({ msg }) {
  const entrada = msg.direcao === 'entrada'
  return (
    <div style={{
      display:'flex', flexDirection: entrada ? 'row' : 'row-reverse',
      alignItems:'flex-end', gap:6, marginBottom:6,
    }}>
      {entrada && (
        <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, background:'#25D36620', color:'#25D366', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700 }}>
          C
        </div>
      )}
      <div style={{
        maxWidth:'72%', padding:'8px 12px', borderRadius: entrada ? '2px 12px 12px 12px' : '12px 2px 12px 12px',
        background: entrada ? 'var(--bg-2)' : '#1D9E7520',
        border: `0.5px solid ${entrada ? 'var(--sep)' : '#1D9E7540'}`,
      }}>
        {msg.midia_tipo === 'image' && msg.midia_url && (
          <img src={msg.midia_url} alt="" style={{ width:'100%', borderRadius:6, marginBottom:4, maxHeight:160, objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
        )}
        <div style={{ fontSize:12, color: entrada ? 'var(--label)' : 'var(--label)', lineHeight:1.5, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
          {msg.conteudo || (msg.midia_tipo ? `[${msg.midia_tipo}]` : '—')}
        </div>
        <div style={{ fontSize:10, color:'var(--label-3)', marginTop:3, textAlign: entrada ? 'left' : 'right' }}>
          {fmtHora(msg.criado_em)}
          {!entrada && <span style={{ marginLeft:4 }}>✓✓</span>}
        </div>
      </div>
    </div>
  )
}

// ── Card de sessão na lista ────────────────────────────────────────────────────
function SessaoCard({ sessao, ativa, selecionada, onClick }) {
  const nome     = sessao.nome && sessao.nome !== sessao.telefone ? sessao.nome : fmtTel(sessao.telefone)
  const c        = cor(nome)
  const carrinho = parseInt(sessao.itens_carrinho) || 0
  const manual   = sessao.modo === 'manual'
  const selected = selecionada?.telefone === sessao.telefone

  return (
    <div onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
      borderBottom:'0.5px solid var(--sep)', cursor:'pointer',
      background: selected ? 'var(--accent-dim)' : 'transparent',
      transition:'background .1s',
    }}
    onMouseEnter={e => { if(!selected) e.currentTarget.style.background='var(--bg-3)' }}
    onMouseLeave={e => { if(!selected) e.currentTarget.style.background='transparent' }}>

      {/* Avatar */}
      <div style={{ width:38, height:38, borderRadius:'50%', flexShrink:0, background:`${c}20`, color:c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, position:'relative' }}>
        {iniciais(nome)}
        <span style={{ position:'absolute', bottom:0, right:0, width:10, height:10, borderRadius:'50%', background: ativa ? '#1D9E75' : 'var(--label-3)', border:'2px solid var(--bg-2)' }} />
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
          <span style={{ fontSize:13, fontWeight:selected?600:500, color: selected?'var(--accent)':'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:150 }}>{nome}</span>
          <span style={{ fontSize:10, color:'var(--label-3)', flexShrink:0 }}>{fmtTempo(sessao.atualizado_em)}</span>
        </div>
        <div style={{ display:'flex', gap:4, alignItems:'center', flexWrap:'wrap' }}>
          {carrinho > 0 && (
            <span style={{ fontSize:10, padding:'1px 5px', borderRadius:99, background:'#EF9F2720', color:'#EF9F27', fontWeight:500 }}>
              🛒 {carrinho}
            </span>
          )}
          {manual && (
            <span style={{ fontSize:10, padding:'1px 5px', borderRadius:99, background:'#534AB720', color:'#534AB7', fontWeight:500 }}>Manual</span>
          )}
          {ativa
            ? <span style={{ fontSize:10, color:'#1D9E75' }}>● online</span>
            : <span style={{ fontSize:10, color:'var(--label-3)' }}>○ inativo</span>
          }
        </div>
      </div>
    </div>
  )
}

// ── Painel direito: conversa ───────────────────────────────────────────────────
function PainelConversa({ sessao, api, onClose }) {
  const [msgs,      setMsgs]      = useState([])
  const [loadingH,  setLoadingH]  = useState(true)
  const [enviando,  setEnviando]  = useState(false)
  const [texto,     setTexto]     = useState('')
  const [modo,      setModo]      = useState(sessao.modo || 'ia')
  const [menuAberto,setMenuAberto]= useState(false)
  const [ctx,       setCtx]       = useState(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const nome = sessao.nome && sessao.nome !== sessao.telefone ? sessao.nome : fmtTel(sessao.telefone)
  const c    = cor(nome)

  const carregarHistorico = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${sessao.telefone}?limit=60`)
      if (!r.ok) return
      const d = await r.json()
      setMsgs(d.mensagens || [])
      // O endpoint retorna carrinho e modo diretamente (não dentro de 'sessao')
      setCtx({ carrinho: d.carrinho || [], modo: d.modo || 'ia' })
      setModo(d.modo || sessao.modo || 'ia')
    } catch {}
    setLoadingH(false)
  }, [api, sessao.telefone])

  useEffect(() => {
    setLoadingH(true)
    setMsgs([])
    carregarHistorico()
    const i = setInterval(carregarHistorico, 8000)
    return () => clearInterval(i)
  }, [carregarHistorico])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [msgs])

  const enviar = async () => {
    if (!texto.trim() || enviando) return
    const txt = texto.trim()
    setTexto('')
    setEnviando(true)
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ telefone: sessao.telefone, mensagem: txt, tipo: 'texto' }),
      })
      await carregarHistorico()
    } catch {}
    setEnviando(false)
    inputRef.current?.focus()
  }

  const alternarModo = async (novoModo) => {
    try {
      await fetch(`${api}/api/dashboard/manual/${sessao.telefone}`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ modo: novoModo }),
      })
      setModo(novoModo)
      setMenuAberto(false)
    } catch {}
  }

  const resetarSessao = async () => {
    if (!confirm(`Resetar sessão de ${nome}? O carrinho será limpo.`)) return
    try {
      await fetch(`${api}/api/dashboard/resetar-sessao?telefone=${sessao.telefone}&confirmar=sim`)
      await carregarHistorico()
      setMenuAberto(false)
    } catch {}
  }

  const carrinho = parseInt(sessao.itens_carrinho) || 0

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderBottom:'0.5px solid var(--sep)', background:'var(--bg-2)', flexShrink:0 }}>
        <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--label-3)', padding:4, display:'flex', alignItems:'center' }}>
          <X size={14} />
        </button>
        <div style={{ width:34, height:34, borderRadius:'50%', background:`${c}20`, color:c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>
          {iniciais(nome)}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nome}</div>
          <div style={{ fontSize:11, color:'var(--label-3)' }}>{sessao.telefone}</div>
        </div>

        {/* Badges de contexto */}
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {carrinho > 0 && (
            <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background:'#EF9F2720', color:'#EF9F27', fontWeight:500 }}>
              🛒 {carrinho} item{carrinho>1?'s':''}
            </span>
          )}
          <span style={{
            fontSize:10, padding:'2px 7px', borderRadius:99, fontWeight:600,
            background: modo==='manual' ? '#534AB720' : '#1D9E7520',
            color:      modo==='manual' ? '#534AB7'   : '#1D9E75',
          }}>
            {modo==='manual' ? '● Manual' : '● IA ativa'}
          </span>
        </div>

        {/* Menu de ações */}
        <div style={{ position:'relative' }}>
          <button onClick={() => setMenuAberto(m => !m)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--label-3)', padding:4, display:'flex', alignItems:'center', borderRadius:6 }}>
            <MoreVertical size={15} />
          </button>
          {menuAberto && (
            <div style={{ position:'absolute', right:0, top:'100%', marginTop:4, background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:10, padding:4, minWidth:180, zIndex:20, boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>
              {modo !== 'manual' ? (
                <button onClick={() => alternarModo('manual')} style={{ width:'100%', padding:'8px 12px', borderRadius:7, border:'none', background:'transparent', color:'var(--label)', fontSize:12, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8 }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <User size={13} style={{ color:'#534AB7' }} /> Assumir atendimento
                </button>
              ) : (
                <button onClick={() => alternarModo('ia')} style={{ width:'100%', padding:'8px 12px', borderRadius:7, border:'none', background:'transparent', color:'var(--label)', fontSize:12, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8 }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <Zap size={13} style={{ color:'#1D9E75' }} /> Devolver para IA
                </button>
              )}
              <div style={{ height:'0.5px', background:'var(--sep)', margin:'4px 0' }} />
              <button onClick={resetarSessao} style={{ width:'100%', padding:'8px 12px', borderRadius:7, border:'none', background:'transparent', color:'#EF4444', fontSize:12, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8 }}
                onMouseEnter={e=>e.currentTarget.style.background='#EF444410'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <AlertCircle size={13} /> Resetar sessão
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contexto do carrinho */}
      {(ctx?.carrinho || []).length > 0 && (
        <div style={{ padding:'8px 16px', background:'#EF9F2710', borderBottom:'0.5px solid #EF9F2730', flexShrink:0 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#EF9F27', marginBottom:4 }}>🛒 Carrinho em aberto</div>
          {ctx.carrinho.map((item, i) => (
            <div key={i} style={{ fontSize:11, color:'var(--label-2)', display:'flex', justifyContent:'space-between' }}>
              <span>{item.quantidade}× {item.nome?.slice(0,40)}</span>
              <span style={{ color:'#EF9F27', fontWeight:500 }}>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Mensagens */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 14px' }} onClick={() => setMenuAberto(false)}>
        {loadingH ? (
          <div style={{ textAlign:'center', color:'var(--label-3)', fontSize:13, padding:32 }}>Carregando conversa...</div>
        ) : msgs.length === 0 ? (
          <div style={{ textAlign:'center', color:'var(--label-3)', fontSize:13, padding:32 }}>Sem mensagens ainda</div>
        ) : (
          <>
            {msgs.map((msg, i) => <Bolha key={msg.id || i} msg={msg} />)}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input de envio */}
      <div style={{ padding:'10px 14px', borderTop:'0.5px solid var(--sep)', background:'var(--bg-2)', flexShrink:0 }}>
        {modo === 'ia' && (
          <div style={{ fontSize:11, color:'var(--label-3)', marginBottom:6, display:'flex', alignItems:'center', gap:4 }}>
            <Zap size={10} style={{ color:'#1D9E75' }} />
            IA respondendo automaticamente — clique em "Assumir atendimento" para enviar manualmente
          </div>
        )}
        <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
          <textarea
            ref={inputRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
            placeholder={modo==='manual' ? 'Escreva uma mensagem... (Enter para enviar)' : 'Modo IA ativo — assuma o atendimento para digitar'}
            disabled={modo === 'ia'}
            rows={2}
            style={{
              flex:1, padding:'8px 12px', borderRadius:10, border:'0.5px solid var(--sep)',
              background: modo==='ia' ? 'var(--bg-3)' : 'var(--bg)', color:'var(--label)',
              fontSize:13, resize:'none', outline:'none', lineHeight:1.5,
              opacity: modo==='ia' ? 0.5 : 1,
            }}
          />
          <button onClick={enviar} disabled={!texto.trim() || enviando || modo==='ia'} style={{
            width:38, height:38, borderRadius:10, border:'none', cursor: texto.trim() && modo==='manual' ? 'pointer' : 'default',
            background: texto.trim() && modo==='manual' ? 'var(--accent)' : 'var(--fill)',
            color: texto.trim() && modo==='manual' ? '#000' : 'var(--label-3)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            transition:'background .15s',
          }}>
            {enviando ? <RefreshCw size={14} /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function PageAtendimento({ api }) {
  const [sessoes,    setSessoes]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [busca,      setBusca]      = useState('')
  const [selecionada,setSelecionada]= useState(null)
  const [filtro,     setFiltro]     = useState('todas')
  const [online,     setOnline]     = useState(true)
  const [ultimaSync, setUltimaSync] = useState(null)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/dashboard/sessoes`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setSessoes(d.sessoes || [])
      setOnline(true)
      setUltimaSync(new Date())
    } catch {
      setOnline(false)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    carregar()
    const i = setInterval(carregar, 10000)
    return () => clearInterval(i)
  }, [carregar])

  // Atualiza sessão selecionada quando a lista muda
  useEffect(() => {
    if (selecionada) {
      const atualizada = sessoes.find(s => s.telefone === selecionada.telefone)
      if (atualizada) setSelecionada(atualizada)
    }
  }, [sessoes])

  const ativas    = sessoes.filter(ehAtiva)
  const inativas  = sessoes.filter(s => !ehAtiva(s))
  const comCarrinho = sessoes.filter(s => parseInt(s.itens_carrinho) > 0)
  const manuais   = sessoes.filter(s => s.modo === 'manual')

  const filtradas = sessoes.filter(s => {
    const nome = s.nome && s.nome !== s.telefone ? s.nome : s.telefone
    const matchBusca = !busca || nome.toLowerCase().includes(busca.toLowerCase()) || s.telefone.includes(busca)
    const matchFiltro =
      filtro === 'todas'    ? true :
      filtro === 'ativas'   ? ehAtiva(s) :
      filtro === 'carrinho' ? parseInt(s.itens_carrinho) > 0 :
      filtro === 'manual'   ? s.modo === 'manual' : true
    return matchBusca && matchFiltro
  })

  return (
    <div style={{ height:'100%', display:'flex', overflow:'hidden' }}>

      {/* ── Sidebar: lista de sessões ── */}
      <div style={{ width:300, flexShrink:0, display:'flex', flexDirection:'column', borderRight:'0.5px solid var(--sep)', background:'var(--bg-2)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'14px 14px 10px', borderBottom:'0.5px solid var(--sep)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--label)' }}>Atendimento</div>
              <div style={{ fontSize:11, color:'var(--label-3)', marginTop:1, display:'flex', alignItems:'center', gap:4 }}>
                {online
                  ? <><Wifi size={10} style={{ color:'#1D9E75' }} /> Sincronizando a cada 10s</>
                  : <><WifiOff size={10} style={{ color:'#EF4444' }} /> Sem conexão</>
                }
              </div>
            </div>
            <button onClick={carregar} style={{ width:28, height:28, borderRadius:7, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <RefreshCw size={12} />
            </button>
          </div>

          {/* Stats rápidos */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
            {[
              { label:'Ativas',    value:ativas.length,    cor:'#1D9E75' },
              { label:'Carrinho',  value:comCarrinho.length, cor:'#EF9F27' },
              { label:'Manual',    value:manuais.length,   cor:'#534AB7' },
              { label:'Total 24h', value:sessoes.length,   cor:'var(--label-3)' },
            ].map(({ label, value, cor: c }) => (
              <div key={label} style={{ padding:'6px 8px', borderRadius:8, background:'var(--bg)', border:'0.5px solid var(--sep)' }}>
                <div style={{ fontSize:16, fontWeight:600, color:c }}>{value}</div>
                <div style={{ fontSize:10, color:'var(--label-3)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Busca */}
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', borderRadius:8, border:'0.5px solid var(--sep)', background:'var(--bg)' }}>
            <Search size={12} style={{ color:'var(--label-3)', flexShrink:0 }} />
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar..." style={{ border:'none', background:'transparent', outline:'none', fontSize:12, color:'var(--label)', width:'100%' }} />
            {busca && <button onClick={() => setBusca('')} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--label-3)' }}><X size={11} /></button>}
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display:'flex', gap:4, padding:'8px 10px', borderBottom:'0.5px solid var(--sep)', flexShrink:0 }}>
          {[
            { id:'todas',    label:`Todas (${sessoes.length})` },
            { id:'ativas',   label:`Ativas (${ativas.length})` },
            { id:'carrinho', label:`Carrinho (${comCarrinho.length})` },
            { id:'manual',   label:`Manual (${manuais.length})` },
          ].map(f => (
            <button key={f.id} onClick={() => setFiltro(f.id)} style={{
              padding:'3px 8px', borderRadius:99, fontSize:10, fontWeight:500, cursor:'pointer',
              border:`0.5px solid ${filtro===f.id?'var(--accent)':'var(--sep)'}`,
              background: filtro===f.id?'var(--accent-dim)':'transparent',
              color: filtro===f.id?'var(--accent)':'var(--label-3)',
              whiteSpace:'nowrap',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Lista */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:24, textAlign:'center', color:'var(--label-3)', fontSize:12 }}>Carregando...</div>
          ) : filtradas.length === 0 ? (
            <div style={{ padding:24, textAlign:'center', color:'var(--label-3)', fontSize:12 }}>Nenhuma sessão encontrada</div>
          ) : filtradas.map(s => (
            <SessaoCard
              key={s.telefone}
              sessao={s}
              ativa={ehAtiva(s)}
              selecionada={selecionada}
              onClick={() => setSelecionada(s)}
            />
          ))}
        </div>

        {/* Footer */}
        {ultimaSync && (
          <div style={{ padding:'8px 14px', borderTop:'0.5px solid var(--sep)', fontSize:10, color:'var(--label-3)', flexShrink:0 }}>
            Último sync: {ultimaSync.toLocaleTimeString('pt-BR')}
          </div>
        )}
      </div>

      {/* ── Painel direito ── */}
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {selecionada ? (
          <PainelConversa
            key={selecionada.telefone}
            sessao={selecionada}
            api={api}
            onClose={() => setSelecionada(null)}
          />
        ) : (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:'var(--label-3)', background:'var(--bg-3)' }}>
            <MessageSquare size={36} style={{ opacity:0.3 }} />
            <div style={{ fontSize:15, fontWeight:500, color:'var(--label)' }}>Monitor de Atendimento</div>
            <div style={{ fontSize:13 }}>Selecione uma conversa para visualizar</div>
            {ativas.length > 0 && (
              <div style={{ display:'flex', flex:'column', gap:6, marginTop:8 }}>
                <div style={{ fontSize:12, fontWeight:500, color:'#1D9E75' }}>● {ativas.length} conversa{ativas.length>1?'s':''} ativa{ativas.length>1?'s':''} agora</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
