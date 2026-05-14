import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search, RefreshCw, Bot, Zap, Clock, CheckCheck,
  Circle, XCircle, Package, RotateCcw, MessageSquare,
  ChevronRight, Image, Mic, FileText
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Config de status — pill vertical ─────────────────────────────────────────
const STATUS = [
  { id: 'pendente',   label: 'Pendente',   icon: Clock,        color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  { id: 'em_andamento',label: 'Em andamento',icon: MessageSquare,color: '#4a9fff', bg: 'rgba(74,159,255,0.12)' },
  { id: 'resolvido',  label: 'Resolvido',  icon: CheckCheck,   color: '#00d4aa', bg: 'rgba(0,212,170,0.12)'   },
  { id: 'encerrado',  label: 'Encerrado',  icon: XCircle,      color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  { id: 'gatilhos',   label: 'Gatilhos',   icon: Zap,          color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function avatarCor(tel = '') {
  const cores = ['#00d4aa','#4a9fff','#a78bfa','#f59e0b','#22d3ee','#f472b6','#34d399']
  let h = 0; for (const c of tel) h = (h * 31 + c.charCodeAt(0)) % cores.length
  return cores[h]
}

function Avatar({ nome, telefone, size = 36 }) {
  const cor = avatarCor(telefone)
  const ini = (nome || telefone || '??').slice(0,2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${cor}22`, color: cor,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 700,
    }}>{ini}</div>
  )
}

// Bolha de mensagem
function Bolha({ msg }) {
  const entrada  = msg.direcao === 'entrada'
  const isGatilho = msg.modo === 'transacional' || msg.motor === 'transacional'
  const texto    = (msg.conteudo || '').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g,'').trim()

  return (
    <div style={{
      display: 'flex',
      justifyContent: entrada ? 'flex-start' : 'flex-end',
      marginBottom: 3,
      padding: entrada ? '0 48px 0 0' : '0 0 0 48px',
    }}>
      <div style={{
        maxWidth: '70%',
        background: entrada
          ? 'var(--bg-2)'
          : isGatilho ? 'rgba(167,139,250,0.15)' : 'rgba(0,212,170,0.13)',
        border: `1px solid ${entrada ? 'var(--sep)' : isGatilho ? 'rgba(167,139,250,0.2)' : 'rgba(0,212,170,0.2)'}`,
        borderRadius: entrada ? '3px 12px 12px 12px' : '12px 3px 12px 12px',
        padding: '7px 11px',
      }}>
        {msg.midia_tipo === 'image' && msg.midia_url &&
          <img src={msg.midia_url} style={{ maxWidth:'100%', borderRadius:6, marginBottom:4 }} />}
        {msg.midia_tipo === 'audio' && msg.midia_url &&
          <audio controls src={msg.midia_url} style={{ width:'100%', height:28, marginBottom:4 }} />}
        {texto && (
          <div style={{ fontSize:12.5, color:'var(--label)', lineHeight:1.5, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
            {texto}
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:4, marginTop:2 }}>
          {isGatilho && <span style={{ fontSize:8, fontWeight:700, color:'#a78bfa' }}>GATILHO</span>}
          <span style={{ fontSize:9, color:'var(--label-4)' }}>
            {new Date(msg.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
          </span>
        </div>
      </div>
    </div>
  )
}

function DateSep({ data }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, margin:'10px 0' }}>
      <div style={{ flex:1, height:1, background:'var(--sep)' }} />
      <span style={{ fontSize:10, color:'var(--label-4)', fontWeight:600 }}>
        {new Date(data).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}
      </span>
      <div style={{ flex:1, height:1, background:'var(--sep)' }} />
    </div>
  )
}

// Painel de chat
function Chat({ conv, api, status, onStatusChange }) {
  const [msgs,    setMsgs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset,  setOffset]  = useState(0)
  const bottomRef = useRef(null)
  const prevLen   = useRef(0)

  const carregar = useCallback(async (off = 0, silencioso = false) => {
    if (!conv?.telefone) return
    if (!silencioso) setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${conv.telefone}?limit=60&offset=${off}`)
      if (!r.ok) return
      const d = await r.json()
      const novas = d.mensagens || []
      setMsgs(prev => off === 0 ? novas : [...novas, ...prev])
      setHasMore(d.hasMore || false)
      setOffset(off + novas.length)
    } catch {}
    if (!silencioso) setLoading(false)
  }, [conv?.telefone, api])

  useEffect(() => { setMsgs([]); setOffset(0); carregar(0) }, [conv?.telefone])

  // Polling silencioso — sem piscar
  useEffect(() => {
    const i = setInterval(() => {
      if (document.visibilityState === 'visible') carregar(0, true)
    }, 8000)
    return () => clearInterval(i)
  }, [carregar])

  useEffect(() => {
    if (msgs.length > prevLen.current) {
      bottomRef.current?.scrollIntoView({ behavior: msgs.length === prevLen.current + 1 ? 'smooth' : 'instant' })
    }
    prevLen.current = msgs.length
  }, [msgs])

  const st = STATUS.find(s => s.id === status) || STATUS[0]

  // Agrupa por data
  const grupos = []
  let dataAtual = null
  for (const m of msgs) {
    const d = new Date(m.criado_em).toDateString()
    if (d !== dataAtual) { grupos.push({ tipo:'sep', data: m.criado_em }); dataAtual = d }
    grupos.push({ tipo:'msg', msg: m })
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px', borderBottom:'1px solid var(--sep)',
        background: 'var(--bg-2)', display:'flex', alignItems:'center', gap:10, flexShrink:0,
      }}>
        <Avatar nome={conv.nome} telefone={conv.telefone} size={34} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--label)' }}>{conv.nome || conv.telefone}</div>
          <div style={{ fontSize:10, color:'var(--label-4)' }}>{conv.telefone} · {conv.total_msgs} msgs</div>
        </div>
        {/* Status selector inline */}
        <div style={{ display:'flex', gap:4 }}>
          {STATUS.filter(s => s.id !== 'gatilhos').map(s => (
            <button key={s.id} onClick={() => onStatusChange(conv.telefone, s.id)}
              style={{
                fontSize:9, fontWeight:700, padding:'3px 7px', borderRadius:5,
                cursor:'pointer', border:'none',
                background: status === s.id ? s.bg : 'transparent',
                color: status === s.id ? s.color : 'var(--label-4)',
                outline: status === s.id ? `1px solid ${s.color}40` : 'none',
              }}>
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={() => carregar(0)} style={{ padding:5, borderRadius:6, border:'1px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-4)' }}>
          <RefreshCw size={11} />
        </button>
      </div>

      {/* Mensagens */}
      <div style={{ flex:1, overflow:'auto', padding:'10px 14px' }}>
        {hasMore && (
          <div style={{ textAlign:'center', padding:'6px 0' }}>
            <button onClick={() => carregar(offset)} style={{ fontSize:11, color:'var(--accent)', background:'transparent', border:'1px solid var(--sep)', borderRadius:6, padding:'3px 10px', cursor:'pointer' }}>
              Carregar anteriores
            </button>
          </div>
        )}
        {loading && msgs.length === 0
          ? <div style={{ textAlign:'center', padding:32, color:'var(--label-4)', fontSize:12 }}>Carregando...</div>
          : grupos.length === 0
          ? <div style={{ textAlign:'center', padding:32, color:'var(--label-4)', fontSize:12 }}>Sem mensagens</div>
          : grupos.map((g,i) => g.tipo === 'sep'
              ? <DateSep key={`s${i}`} data={g.data} />
              : <Bolha key={g.msg.id || i} msg={g.msg} />
          )
        }
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PageConversas({ api: apiProp }) {
  const api = apiProp || BASE

  const [convs,     setConvs]     = useState([])
  const [sel,       setSel]       = useState(null)
  const [statusSel, setStatusSel] = useState('pendente')
  const [statusMap, setStatusMap] = useState({})  // tel → status local
  const [busca,     setBusca]     = useState('')
  const [loading,   setLoading]   = useState(true)
  const convsRef = useRef([])

  const carregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true)
    try {
      // Carrega todas as conversas de uma vez — filtragem local sem recarregar
      const r = await fetch(`${api}/api/dashboard/conversas?aba=todas`)
      if (r.ok) {
        const d = await r.json()
        const novas = d.conversas || []
        // Merge sem piscar: preserva seleção e statusMap
        setConvs(prev => {
          const mapAnterior = new Map(prev.map(c => [c.telefone, c]))
          return novas.map(c => ({ ...mapAnterior.get(c.telefone), ...c }))
        })
        convsRef.current = novas
      }
    } catch {}
    if (!silencioso) setLoading(false)
  }, [api])

  // Carrega e polling silencioso
  useEffect(() => {
    carregar()
    const i = setInterval(() => {
      if (document.visibilityState === 'visible') carregar(true)
    }, 15000)
    return () => clearInterval(i)
  }, [carregar])

  const getStatus = (tel) => statusMap[tel] || 'pendente'

  const setConvStatus = (tel, novoStatus) => {
    setStatusMap(prev => ({ ...prev, [tel]: novoStatus }))
    // Salva no backend (best-effort)
    fetch(`${api}/api/contatos/${tel}`, {
      method: 'PATCH', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ status_atendimento: novoStatus })
    }).catch(() => {})
  }

  // Filtragem local — não recarrega
  const filtradas = convs
    .filter(c => {
      const st = getStatus(c.telefone)
      if (statusSel === 'gatilhos') return c.modo === 'transacional' || c.tag === 'gatilho'
      return st === statusSel
    })
    .filter(c => !busca ||
      (c.nome||'').toLowerCase().includes(busca.toLowerCase()) ||
      c.telefone.includes(busca) ||
      (c.ultima_msg||'').toLowerCase().includes(busca.toLowerCase())
    )

  // Contadores por status
  const contadores = {}
  STATUS.forEach(s => {
    if (s.id === 'gatilhos') {
      contadores[s.id] = convs.filter(c => c.modo === 'transacional').length
    } else {
      contadores[s.id] = convs.filter(c => getStatus(c.telefone) === s.id).length
    }
  })

  return (
    <div className="h-full flex overflow-hidden" style={{ background:'var(--bg)' }}>

      {/* Sidebar de status — pills verticais */}
      <div style={{
        width: 56, flexShrink:0, display:'flex', flexDirection:'column',
        alignItems:'center', padding:'12px 0', gap:4,
        borderRight:'1px solid var(--sep)', background:'var(--bg-2)',
      }}>
        {STATUS.map(s => {
          const ativo = statusSel === s.id
          const cnt   = contadores[s.id] || 0
          return (
            <button key={s.id}
              title={s.label}
              onClick={() => setStatusSel(s.id)}
              style={{
                width: 40, padding:'8px 0', borderRadius:10, border:'none',
                cursor:'pointer', display:'flex', flexDirection:'column',
                alignItems:'center', gap:3, transition:'all 0.15s',
                background: ativo ? s.bg : 'transparent',
                outline: ativo ? `1.5px solid ${s.color}50` : 'none',
              }}>
              <s.icon size={14} style={{ color: ativo ? s.color : 'var(--label-4)' }} />
              {cnt > 0 && (
                <span style={{
                  fontSize: 8, fontWeight:700, lineHeight:1,
                  color: ativo ? s.color : 'var(--label-4)',
                }}>
                  {cnt > 99 ? '99+' : cnt}
                </span>
              )}
            </button>
          )
        })}

        {/* Label vertical */}
        <div style={{
          marginTop:'auto', writingMode:'vertical-lr', transform:'rotate(180deg)',
          fontSize:9, color:'var(--label-4)', letterSpacing:'0.08em',
          padding:'8px 0',
        }}>
          {STATUS.find(s => s.id === statusSel)?.label}
        </div>
      </div>

      {/* Lista de conversas */}
      <div style={{
        width: 264, flexShrink:0, display:'flex', flexDirection:'column',
        borderRight:'1px solid var(--sep)', background:'var(--bg)',
      }}>
        {/* Header da lista */}
        <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--sep)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              {(() => { const s = STATUS.find(x => x.id === statusSel); return s ? <s.icon size={13} style={{color:s.color}} /> : null })()}
              <span style={{ fontSize:13, fontWeight:600, color:'var(--label)' }}>
                {STATUS.find(s => s.id === statusSel)?.label}
              </span>
              <span style={{ fontSize:10, color:'var(--label-4)', background:'var(--fill)', padding:'1px 6px', borderRadius:8 }}>
                {filtradas.length}
              </span>
            </div>
            <button onClick={() => carregar()} style={{ padding:4, borderRadius:6, border:'none', background:'transparent', cursor:'pointer', color:'var(--label-4)' }}>
              <RefreshCw size={11} />
            </button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--fill)', borderRadius:8, padding:'5px 8px' }}>
            <Search size={11} style={{ color:'var(--label-4)', flexShrink:0 }} />
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar..." style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:11, color:'var(--label)' }} />
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex:1, overflow:'auto' }}>
          {loading
            ? Array.from({length:5}).map((_,i) => (
                <div key={i} style={{ padding:'10px 12px', borderBottom:'1px solid var(--sep)' }}>
                  <div style={{ height:9, width:'55%', borderRadius:4, background:'var(--sep)', marginBottom:5 }} />
                  <div style={{ height:7, width:'75%', borderRadius:4, background:'var(--sep)' }} />
                </div>
              ))
            : filtradas.length === 0
            ? (
              <div style={{ padding:24, textAlign:'center' }}>
                <div style={{ fontSize:12, color:'var(--label-4)', marginBottom:6 }}>Nenhuma conversa</div>
                <div style={{ fontSize:10, color:'var(--label-4)' }}>
                  {statusSel === 'pendente' ? 'Novas conversas aparecerão aqui' :
                   statusSel === 'gatilhos' ? 'Disparos automáticos aparecerão aqui' :
                   'Mude o status de uma conversa para ver aqui'}
                </div>
              </div>
            )
            : filtradas.map(c => {
                const ativo = sel?.telefone === c.telefone
                const cor   = avatarCor(c.telefone)
                const st    = STATUS.find(s => s.id === getStatus(c.telefone)) || STATUS[0]
                return (
                  <div key={c.telefone}
                    onClick={() => setSel(c)}
                    style={{
                      display:'flex', gap:9, padding:'9px 12px', cursor:'pointer',
                      borderBottom:'1px solid var(--sep)',
                      borderLeft: ativo ? '2px solid var(--accent)' : '2px solid transparent',
                      background: ativo ? 'rgba(0,212,170,0.04)' : 'transparent',
                      transition:'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!ativo) e.currentTarget.style.background = 'var(--fill)' }}
                    onMouseLeave={e => { if (!ativo) e.currentTarget.style.background = 'transparent' }}
                  >
                    <Avatar nome={c.nome} telefone={c.telefone} size={34} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130 }}>
                          {c.nome || c.telefone}
                        </span>
                        <span style={{ fontSize:9, color:'var(--label-4)', flexShrink:0 }}>{c.hora}</span>
                      </div>
                      <div style={{ fontSize:10.5, color:'var(--label-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>
                        {c.ultima_direcao === 'saida' ? '↩ ' : ''}{c.ultima_msg || '—'}
                      </div>
                      <div style={{ display:'flex', gap:3, alignItems:'center' }}>
                        {c.agente && (
                          <span style={{ fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:3, background:'rgba(0,212,170,0.1)', color:'#00d4aa' }}>IA</span>
                        )}
                        <span style={{ fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:3, background:st.bg, color:st.color }}>
                          {st.label}
                        </span>
                        <span style={{ fontSize:8, color:'var(--label-4)', marginLeft:'auto' }}>{c.total_msgs}m</span>
                      </div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* Painel principal */}
      {sel ? (
        <Chat
          conv={sel}
          api={api}
          status={getStatus(sel.telefone)}
          onStatusChange={setConvStatus}
        />
      ) : (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:'var(--label-4)' }}>
          <MessageSquare size={42} style={{ opacity:0.2 }} />
          <div style={{ fontSize:14, fontWeight:500 }}>Selecione uma conversa</div>
          <div style={{ fontSize:11 }}>
            {filtradas.length} conversa{filtradas.length!==1?'s':''} em {STATUS.find(s=>s.id===statusSel)?.label.toLowerCase()}
          </div>
        </div>
      )}
    </div>
  )
}
