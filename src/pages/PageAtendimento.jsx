import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RefreshCw, MessageSquare, Clock, User, Send, X,
  Zap, AlertCircle, MoreVertical, Wifi, WifiOff, ShoppingCart
} from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatarTempo = ts => {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 60)  return `${min}m atrás`
  const hrs  = Math.floor(min / 60)
  if (hrs < 24)  return `${hrs}h atrás`
  return `${Math.floor(hrs/24)}d atrás`
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

const iniciais = nome => (nome || '?').split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()
const CORES = ['#1D9E75','#378ADD','#534AB7','#e65100','#EF9F27','#993556','#25D366']
const cor   = str => CORES[(str || '').charCodeAt(0) % CORES.length]
const ehAtiva = s => Date.now() - new Date(s.atualizado_em).getTime() < 30 * 60 * 1000

// ── Bolha de mensagem ──────────────────────────────────────────────────────────
function Bolha({ msg }) {
  const entrada = msg.direcao === 'entrada'
  return (
    <div style={{
      display:'flex', flexDirection: entrada ? 'row' : 'row-reverse',
      alignItems:'flex-end', gap:6, marginBottom:6,
    }}>
      {entrada && (
        <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, background:'#25D36620', color:'#25D366', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700 }}>
          C
        </div>
      )}
      <div style={{
        maxWidth:'72%', padding:'8px 11px',
        borderRadius: entrada ? '2px 12px 12px 12px' : '12px 2px 12px 12px',
        background: entrada ? 'var(--bg-2)' : '#1D9E7518',
        border: `0.5px solid ${entrada ? 'var(--sep)' : '#1D9E7530'}`,
      }}>
        {msg.midia_tipo === 'image' && msg.midia_url && (
          <img src={msg.midia_url} alt="" style={{ width:'100%', borderRadius:6, marginBottom:4, maxHeight:140, objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
        )}
        <div style={{ fontSize:12, color:'var(--label)', lineHeight:1.5, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
          {msg.conteudo || (msg.midia_tipo ? `[${msg.midia_tipo}]` : '—')}
        </div>
        <div style={{ fontSize:10, color:'var(--label-3)', marginTop:2, textAlign: entrada ? 'left' : 'right' }}>
          {fmtHora(msg.criado_em)}{!entrada && <span style={{ marginLeft:4 }}>✓✓</span>}
        </div>
      </div>
    </div>
  )
}

// ── Painel direito: conversa ───────────────────────────────────────────────────
function PainelConversa({ sessao, api, onClose }) {
  const [msgs,     setMsgs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [texto,    setTexto]    = useState('')
  const [enviando, setEnviando] = useState(false)
  const [modo,     setModo]     = useState(sessao.modo || 'ia')
  const [menuOpen, setMenuOpen] = useState(false)
  const [ctx,      setCtx]      = useState(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const nomeExib = (sessao.nome && sessao.nome !== sessao.telefone)
    ? sessao.nome : fmtTel(sessao.telefone)
  const c = cor(nomeExib)

  const carregarHistorico = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${sessao.telefone}?limit=60`)
      if (!r.ok) return
      const d = await r.json()
      setMsgs(d.mensagens || [])
      setCtx({ carrinho: d.carrinho || [], modo: d.modo || 'ia' })
      setModo(d.modo || sessao.modo || 'ia')
    } catch {}
    setLoading(false)
  }, [api, sessao.telefone])

  useEffect(() => {
    setLoading(true); setMsgs([])
    carregarHistorico()
    const i = setInterval(carregarHistorico, 8000)
    return () => clearInterval(i)
  }, [carregarHistorico])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [msgs])

  const enviar = async () => {
    if (!texto.trim() || enviando || modo === 'ia') return
    const txt = texto.trim(); setTexto(''); setEnviando(true)
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ telefone: sessao.telefone, mensagem: txt, tipo:'texto' }),
      })
      await carregarHistorico()
    } catch {}
    setEnviando(false)
    inputRef.current?.focus()
  }

  const alternarModo = async novoModo => {
    try {
      await fetch(`${api}/api/dashboard/manual/${sessao.telefone}`, {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ modo: novoModo }),
      })
      setModo(novoModo); setMenuOpen(false)
    } catch {}
  }

  const resetarSessao = async () => {
    if (!confirm(`Resetar sessão de ${nomeExib}? O carrinho será limpo.`)) return
    try {
      await fetch(`${api}/api/dashboard/resetar-sessao?telefone=${sessao.telefone}&confirmar=sim`)
      await carregarHistorico(); setMenuOpen(false)
    } catch {}
  }

  const carrinho = ctx?.carrinho || []

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>

      {/* Header do painel */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderBottom:'0.5px solid var(--sep)', background:'var(--bg-2)', flexShrink:0 }}>
        <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', padding:4, borderRadius:6 }}>
          <X size={14} />
        </button>
        <div style={{ width:32, height:32, borderRadius:'50%', background:`${c}20`, color:c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
          {iniciais(nomeExib)}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nomeExib}</div>
          <div style={{ fontSize:11, color:'var(--label-3)' }}>{sessao.telefone}</div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {carrinho.length > 0 && (
            <span style={{ fontSize:10, padding:'2px 6px', borderRadius:99, background:'#EF9F2720', color:'#EF9F27', fontWeight:500 }}>
              🛒 {carrinho.length}
            </span>
          )}
          <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, fontWeight:600,
            background: modo==='manual'?'#534AB720':'#1D9E7520',
            color:      modo==='manual'?'#534AB7':'#1D9E75' }}>
            {modo==='manual' ? '● Manual' : '● IA ativa'}
          </span>
        </div>
        <div style={{ position:'relative' }}>
          <button onClick={() => setMenuOpen(m=>!m)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--label-3)', padding:4, display:'flex', alignItems:'center', borderRadius:6 }}>
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <div style={{ position:'absolute', right:0, top:'100%', marginTop:4, background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:10, padding:4, minWidth:180, zIndex:20, boxShadow:'0 4px 16px rgba(0,0,0,.2)' }}>
              {modo !== 'manual'
                ? <button onClick={()=>alternarModo('manual')} style={{ width:'100%', padding:'8px 12px', borderRadius:7, border:'none', background:'transparent', color:'var(--label)', fontSize:12, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8 }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <User size={13} style={{ color:'#534AB7' }} /> Assumir atendimento
                  </button>
                : <button onClick={()=>alternarModo('ia')} style={{ width:'100%', padding:'8px 12px', borderRadius:7, border:'none', background:'transparent', color:'var(--label)', fontSize:12, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8 }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <Zap size={13} style={{ color:'#1D9E75' }} /> Devolver para IA
                  </button>
              }
              <div style={{ height:'0.5px', background:'var(--sep)', margin:'4px 0' }} />
              <button onClick={resetarSessao} style={{ width:'100%', padding:'8px 12px', borderRadius:7, border:'none', background:'transparent', color:'#EF4444', fontSize:12, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8 }}
                onMouseEnter={e=>e.currentTarget.style.background='#EF444410'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <AlertCircle size={13} /> Resetar sessão
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Banner carrinho */}
      {carrinho.length > 0 && (
        <div style={{ padding:'8px 16px', background:'#EF9F2710', borderBottom:'0.5px solid #EF9F2730', flexShrink:0 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#EF9F27', marginBottom:3 }}>🛒 Carrinho em aberto</div>
          {carrinho.slice(0,3).map((item,i) => (
            <div key={i} style={{ fontSize:11, color:'var(--label-2)', display:'flex', justifyContent:'space-between' }}>
              <span>{item.quantidade}× {(item.nome||'').slice(0,38)}</span>
              <span style={{ color:'#EF9F27', fontWeight:500 }}>R$ {((item.preco||0)*(item.quantidade||1)).toFixed(2)}</span>
            </div>
          ))}
          {carrinho.length > 3 && <div style={{ fontSize:10, color:'var(--label-3)', marginTop:2 }}>+{carrinho.length-3} mais...</div>}
        </div>
      )}

      {/* Mensagens */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 14px' }} onClick={()=>setMenuOpen(false)}>
        {loading
          ? <div style={{ textAlign:'center', color:'var(--label-3)', fontSize:13, padding:32 }}>Carregando conversa...</div>
          : msgs.length === 0
            ? <div style={{ textAlign:'center', color:'var(--label-3)', fontSize:13, padding:32 }}>Sem mensagens registradas</div>
            : <>{msgs.map((msg,i) => <Bolha key={msg.id||i} msg={msg} />)}<div ref={bottomRef} /></>
        }
      </div>

      {/* Input */}
      <div style={{ padding:'10px 14px', borderTop:'0.5px solid var(--sep)', background:'var(--bg-2)', flexShrink:0 }}>
        {modo === 'ia' && (
          <div style={{ fontSize:11, color:'var(--label-3)', marginBottom:6, display:'flex', alignItems:'center', gap:4 }}>
            <Zap size={10} style={{ color:'#1D9E75' }} /> IA respondendo — use o menu ⋮ para assumir
          </div>
        )}
        <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
          <textarea ref={inputRef} value={texto} onChange={e=>setTexto(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar()} }}
            placeholder={modo==='manual' ? 'Mensagem... (Enter envia)' : 'Assuma o atendimento para digitar'}
            disabled={modo==='ia'} rows={2}
            style={{ flex:1, padding:'8px 11px', borderRadius:10, border:'0.5px solid var(--sep)',
              background: modo==='ia'?'var(--bg-3)':'var(--bg)', color:'var(--label)',
              fontSize:13, resize:'none', outline:'none', lineHeight:1.5, opacity:modo==='ia'?.5:1 }}
          />
          <button onClick={enviar} disabled={!texto.trim()||enviando||modo==='ia'}
            style={{ width:36, height:36, borderRadius:10, border:'none', flexShrink:0,
              cursor:texto.trim()&&modo==='manual'?'pointer':'default',
              background:texto.trim()&&modo==='manual'?'var(--accent)':'var(--fill)',
              color:texto.trim()&&modo==='manual'?'#000':'var(--label-3)',
              display:'flex', alignItems:'center', justifyContent:'center', transition:'background .15s' }}>
            {enviando ? <RefreshCw size={13} /> : <Send size={13} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function PageAtendimento({ api }) {
  const [sessoes,     setSessoes]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selecionada, setSelecionada] = useState(null)
  const [online,      setOnline]      = useState(true)
  const [ultimaSync,  setUltimaSync]  = useState(null)
  const [busca,       setBusca]       = useState('')

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/dashboard/sessoes`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setSessoes(d.sessoes || [])
      setOnline(true)
      setUltimaSync(new Date())
    } catch { setOnline(false) }
    finally { setLoading(false) }
  }, [api])

  useEffect(() => {
    carregar()
    const i = setInterval(carregar, 15000)
    return () => clearInterval(i)
  }, [carregar])

  // Atualiza selecionada quando lista muda
  useEffect(() => {
    if (selecionada) {
      const nova = sessoes.find(s => s.telefone === selecionada.telefone)
      if (nova) setSelecionada(nova)
    }
  }, [sessoes])

  const ativas      = sessoes.filter(ehAtiva)
  const comCarrinho = sessoes.filter(s => parseInt(s.itens_carrinho) > 0)
  const manuais     = sessoes.filter(s => s.modo === 'manual')

  const filtradas = sessoes.filter(s => {
    if (!busca) return true
    const nome = s.nome || s.telefone || ''
    return nome.toLowerCase().includes(busca.toLowerCase()) || s.telefone?.includes(busca)
  })

  return (
    <div style={{ height:'100%', display:'flex', overflow:'hidden' }}>

      {/* ── Coluna esquerda — mantém layout original ── */}
      <div style={{
        width: selecionada ? 320 : '100%',
        flexShrink:0, display:'flex', flexDirection:'column', overflow:'hidden',
        borderRight: selecionada ? '0.5px solid var(--sep)' : 'none',
        transition:'width .2s',
      }}>

        {/* Header — idêntico ao original */}
        <div style={{ padding:'24px 24px 16px', borderBottom:'0.5px solid var(--sep)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <h1 style={{ fontSize:20, fontWeight:500, margin:0, color:'var(--label)' }}>Atendimento</h1>
              <p style={{ fontSize:13, color:'var(--label-3)', margin:'3px 0 0', display:'flex', alignItems:'center', gap:6 }}>
                {online
                  ? <><span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', display:'inline-block' }} /> {ativas.length} ativas · {sessoes.length} total (24h) · sync 15s</>
                  : <><WifiOff size={11} style={{ color:'#EF4444' }} /> Sem conexão</>
                }
              </p>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {/* Busca quando painel lateral aberto */}
              {selecionada && (
                <input value={busca} onChange={e=>setBusca(e.target.value)}
                  placeholder="Buscar..." style={{ fontSize:12, padding:'5px 10px', borderRadius:8, border:'0.5px solid var(--sep)', background:'var(--bg-2)', color:'var(--label)', outline:'none', width:120 }} />
              )}
              <button onClick={carregar} style={{ width:32, height:32, borderRadius:8, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <RefreshCw size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats rápidos — idêntico ao original */}
        <div style={{ display:'flex', gap:!selecionada?12:8, padding:`16px ${!selecionada?28:16}px`, borderBottom:'0.5px solid var(--sep)', flexShrink:0, flexWrap:'wrap' }}>
          {[
            { label:'Ativas agora', value:ativas.length,      color:'#1D9E75' },
            { label:'Últimas 24h',  value:sessoes.length,     color:'#378ADD' },
            { label:'Com carrinho', value:comCarrinho.length, color:'#EF9F27' },
            { label:'Modo manual',  value:manuais.length,     color:'#534AB7' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:10, padding:'10px 14px', flex:1, minWidth:!selecionada?100:80 }}>
              <div style={{ fontSize:22, fontWeight:500, color, lineHeight:1, marginBottom:4 }}>{value}</div>
              <div style={{ fontSize:11, color:'var(--label-3)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Busca na lista (quando painel não está aberto) */}
        {!selecionada && (
          <div style={{ padding:'12px 28px 0' }}>
            <input value={busca} onChange={e=>setBusca(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              style={{ width:'100%', fontSize:13, padding:'7px 12px', borderRadius:8, border:'0.5px solid var(--sep)', background:'var(--bg-2)', color:'var(--label)', outline:'none', boxSizing:'border-box' }} />
          </div>
        )}

        {/* Lista de sessões — estilo original */}
        <div style={{ flex:1, overflowY:'auto', padding:`0 ${!selecionada?28:14}px` }}>
          {loading ? (
            <div style={{ padding:32, textAlign:'center', color:'var(--label-3)', fontSize:13 }}>Carregando sessões...</div>
          ) : filtradas.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'var(--label-3)', fontSize:13 }}>
              {busca ? 'Nenhuma sessão encontrada' : 'Nenhuma sessão nas últimas 24h'}
            </div>
          ) : (
            <div style={{ paddingTop:12, display:'flex', flexDirection:'column', gap:6, paddingBottom:16 }}>
              {filtradas.map((s, i) => {
                const ativa   = ehAtiva(s)
                const nomeExib = (s.nome && s.nome !== s.telefone) ? s.nome : fmtTel(s.telefone)
                const c       = cor(nomeExib)
                const selected = selecionada?.telefone === s.telefone
                return (
                  <div key={i} onClick={() => setSelecionada(selected ? null : s)}
                    style={{
                      display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                      borderRadius:10, border:`0.5px solid ${selected?'var(--accent)':'var(--sep)'}`,
                      background: selected ? 'var(--accent-dim)' : 'var(--bg-2)',
                      cursor:'pointer', transition:'background .15s',
                    }}
                    onMouseEnter={e => { if(!selected) e.currentTarget.style.background='var(--bg-3)' }}
                    onMouseLeave={e => { if(!selected) e.currentTarget.style.background='var(--bg-2)' }}>

                    {/* Avatar com bolinha de status */}
                    <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, background:`${c}20`, color:c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, position:'relative' }}>
                      {iniciais(nomeExib)}
                      <span style={{ position:'absolute', bottom:0, right:0, width:9, height:9, borderRadius:'50%', background: ativa ? '#1D9E75' : 'var(--label-3)', border:'2px solid var(--bg-2)' }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                        <span style={{ fontSize:13, fontWeight:selected?600:500, color: selected?'var(--accent)':'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth: selecionada?120:260 }}>{nomeExib}</span>
                        <span style={{ fontSize:11, color:'var(--label-3)', flexShrink:0 }}>{formatarTempo(s.atualizado_em)}</span>
                      </div>
                      <div style={{ display:'flex', gap:6, alignItems:'center', fontSize:11, color:'var(--label-3)', flexWrap:'wrap' }}>
                        {!selecionada && <span>{s.telefone}</span>}
                        {parseInt(s.itens_carrinho) > 0 && (
                          <span style={{ padding:'1px 6px', borderRadius:99, background:'#EF9F2720', color:'#EF9F27', fontWeight:500 }}>
                            🛒 {s.itens_carrinho} item{s.itens_carrinho > 1 ? 's' : ''}
                          </span>
                        )}
                        {s.modo === 'manual' && (
                          <span style={{ padding:'1px 6px', borderRadius:99, background:'#534AB720', color:'#534AB7', fontWeight:500 }}>Manual</span>
                        )}
                        {ativa && !s.modo && (
                          <span style={{ color:'#1D9E75' }}>● online</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {ultimaSync && (
          <div style={{ padding:'8px 16px', borderTop:'0.5px solid var(--sep)', fontSize:11, color:'var(--label-3)', flexShrink:0 }}>
            Último sync: {ultimaSync.toLocaleTimeString('pt-BR')}
          </div>
        )}
      </div>

      {/* ── Painel de conversa — aparece ao clicar numa sessão ── */}
      {selecionada && (
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <PainelConversa
            key={selecionada.telefone}
            sessao={selecionada}
            api={api}
            onClose={() => setSelecionada(null)}
          />
        </div>
      )}

      {/* Estado vazio quando nada selecionado e lista cheia */}
      {!selecionada && !loading && sessoes.length > 0 && (
        <></>
      )}
    </div>
  )
}
