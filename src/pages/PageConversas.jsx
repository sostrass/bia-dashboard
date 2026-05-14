import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, RefreshCw, MessageSquare, CheckCircle, Zap,
         ChevronRight, Phone, Clock, User, Tag, Send, Image } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Helpers ───────────────────────────────────────────────────────────────────
const tempoRelativo = (hora) => {
  if (!hora) return ''
  return hora
}

const tagConfig = {
  pedido:     { label: 'Pedido',     bg: 'rgba(0,212,170,0.12)',   color: '#00d4aa' },
  troca:      { label: 'Troca',      bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  financeiro: { label: 'Financeiro', bg: 'rgba(74,159,255,0.12)', color: '#4a9fff' },
  geral:      { label: 'Geral',      bg: 'rgba(148,163,184,0.12)',color: '#94a3b8' },
}

// Avatar com iniciais coloridas
function Avatar({ nome, telefone, size = 36 }) {
  const initials = (nome || telefone || '??').slice(0,2).toUpperCase()
  const colors   = ['#00d4aa','#4a9fff','#a78bfa','#f59e0b','#22d3ee','#f472b6']
  let ci = 0
  for (const c of (telefone||'')) ci = (ci*31 + c.charCodeAt(0)) % colors.length
  const color = colors[ci]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${color}20`, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

// Card de conversa na lista
function ConvCard({ conv, ativo, onClick }) {
  const tag = tagConfig[conv.tag] || tagConfig.geral
  const isIA = conv.modo === 'auto'

  return (
    <div onClick={onClick} style={{
      display: 'flex', gap: 10, padding: '10px 16px', cursor: 'pointer',
      background: ativo ? 'var(--bg-3)' : 'transparent',
      borderBottom: '1px solid var(--sep)',
      borderLeft: ativo ? '2px solid var(--accent)' : '2px solid transparent',
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => { if (!ativo) e.currentTarget.style.background = 'var(--fill)' }}
    onMouseLeave={e => { if (!ativo) e.currentTarget.style.background = 'transparent' }}
    >
      <Avatar nome={conv.nome} telefone={conv.telefone} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--label)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
            {conv.nome || conv.telefone}
          </span>
          <span style={{ fontSize: 10, color: 'var(--label-4)', flexShrink: 0 }}>{conv.hora}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--label-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
          {conv.ultima_direcao === 'saida' ? '↩ ' : ''}{conv.ultima_msg || '—'}
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: tag.bg, color: tag.color }}>
            {tag.label}
          </span>
          {isIA && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,212,170,0.1)', color: 'var(--accent)' }}>
              IA
            </span>
          )}
          <span style={{ fontSize: 9, color: 'var(--label-4)', marginLeft: 'auto' }}>
            {conv.total_msgs} msgs
          </span>
        </div>
      </div>
    </div>
  )
}

// Bolha de mensagem
function Bolha({ msg }) {
  const isEntrada = msg.direcao === 'entrada'
  const isTrans   = msg.modo === 'transacional'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isEntrada ? 'flex-start' : 'flex-end',
      marginBottom: 4,
      paddingLeft: isEntrada ? 0 : 48,
      paddingRight: isEntrada ? 48 : 0,
    }}>
      <div style={{
        maxWidth: '72%',
        background: isEntrada ? 'var(--bg-2)' :
                    isTrans    ? 'rgba(74,159,255,0.15)' :
                                 'rgba(0,212,170,0.15)',
        borderRadius: isEntrada ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
        padding: '8px 12px',
        border: isTrans ? '1px solid rgba(74,159,255,0.2)' : '1px solid transparent',
      }}>
        {/* Mídia */}
        {msg.midia_tipo === 'image' && msg.midia_url && (
          <img src={msg.midia_url} alt="imagem" style={{ maxWidth: '100%', borderRadius: 6, marginBottom: 4 }} />
        )}
        {msg.midia_tipo === 'audio' && msg.midia_url && (
          <audio controls src={msg.midia_url} style={{ width: '100%', height: 32, marginBottom: 4 }} />
        )}

        {/* Texto */}
        <div style={{
          fontSize: 12.5,
          color: 'var(--label)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.5,
        }}>
          {(msg.conteudo || '').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g, '').trim()}
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, justifyContent: 'flex-end' }}>
          {isTrans && (
            <span style={{ fontSize: 8, color: '#4a9fff', fontWeight: 700 }}>TRANSACIONAL</span>
          )}
          <span style={{ fontSize: 9, color: 'var(--label-4)' }}>
            {new Date(msg.criado_em).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
          </span>
        </div>
      </div>
    </div>
  )
}

// Separador de data
function DateSep({ data }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--sep)' }} />
      <span style={{ fontSize: 10, color: 'var(--label-4)', fontWeight: 600, padding: '2px 8px', background: 'var(--bg-2)', borderRadius: 8 }}>
        {new Date(data).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--sep)' }} />
    </div>
  )
}

// Painel de histórico
function PainelHistorico({ conv, api }) {
  const [msgs,    setMsgs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset,  setOffset]  = useState(0)
  const bottomRef = useRef(null)

  const carregar = useCallback(async (off = 0) => {
    if (!conv?.telefone) return
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${conv.telefone}?limit=50&offset=${off}`)
      if (!r.ok) return
      const d = await r.json()
      const novas = d.mensagens || []
      setMsgs(prev => off === 0 ? novas : [...novas, ...prev])
      setHasMore(d.hasMore || false)
      setOffset(off + novas.length)
    } catch {}
    setLoading(false)
  }, [conv?.telefone, api])

  useEffect(() => {
    setMsgs([])
    setOffset(0)
    carregar(0)
  }, [conv?.telefone])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  if (!conv) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--label-4)', fontSize: 13 }}>
      Selecione uma conversa
    </div>
  )

  // Agrupa mensagens por data
  const grupos = []
  let dataAtual = null
  for (const msg of msgs) {
    const dataMsg = new Date(msg.criado_em).toDateString()
    if (dataMsg !== dataAtual) {
      grupos.push({ tipo: 'sep', data: msg.criado_em })
      dataAtual = dataMsg
    }
    grupos.push({ tipo: 'msg', msg })
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header da conversa */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--sep)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--bg-2)',
      }}>
        <Avatar nome={conv.nome} telefone={conv.telefone} size={32} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--label)' }}>{conv.nome || conv.telefone}</div>
          <div style={{ fontSize: 10, color: 'var(--label-4)' }}>
            {conv.telefone} · {conv.total_msgs} mensagens
            {conv.agente && ` · ${conv.agente}`}
          </div>
        </div>
        <button onClick={() => carregar(0)} style={{
          padding: '5px 8px', borderRadius: 6, border: '1px solid var(--sep)',
          background: 'transparent', cursor: 'pointer', color: 'var(--label-3)',
        }}>
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Mensagens */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
        {hasMore && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <button onClick={() => carregar(offset)} style={{
              fontSize: 11, color: 'var(--accent)', background: 'transparent',
              border: '1px solid var(--sep)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
            }}>
              Carregar mensagens anteriores
            </button>
          </div>
        )}

        {loading && msgs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--label-4)', fontSize: 12 }}>
            Carregando...
          </div>
        ) : grupos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--label-4)', fontSize: 12 }}>
            Nenhuma mensagem
          </div>
        ) : grupos.map((g, i) =>
          g.tipo === 'sep'
            ? <DateSep key={`sep-${i}`} data={g.data} />
            : <Bolha key={g.msg.id || i} msg={g.msg} />
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PageConversas({ api: apiProp }) {
  const api = apiProp || BASE

  const [aba,     setAba]     = useState('ativas')
  const [convs,   setConvs]   = useState([])
  const [sel,     setSel]     = useState(null)
  const [busca,   setBusca]   = useState('')
  const [loading, setLoading] = useState(true)

  const ABAS = [
    { id: 'ativas',      label: 'Ativas',       icon: MessageSquare, color: '#00d4aa' },
    { id: 'concluidas',  label: 'Concluídas',   icon: CheckCircle,   color: '#4a9fff' },
    { id: 'transacional',label: 'Transacional',  icon: Zap,           color: '#f59e0b' },
  ]

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/conversas?aba=${aba}`)
      if (r.ok) {
        const d = await r.json()
        setConvs(d.conversas || [])
        setSel(prev => prev ? (d.conversas || []).find(c => c.telefone === prev.telefone) || prev : null)
      }
    } catch {}
    setLoading(false)
  }, [api, aba])

  useEffect(() => {
    carregar()
    const i = setInterval(carregar, 15000)
    return () => clearInterval(i)
  }, [carregar])

  const filtradas = convs.filter(c =>
    !busca || (c.nome||'').toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca) || (c.ultima_msg||'').toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Coluna esquerda — lista */}
      <div style={{
        width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderRight: '1px solid var(--sep)',
      }}>

        {/* Abas */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--sep)',
          background: 'var(--bg-2)',
        }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => { setAba(a.id); setSel(null) }} style={{
              flex: 1, padding: '10px 4px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3, cursor: 'pointer', border: 'none',
              background: aba === a.id ? 'var(--bg)' : 'transparent',
              borderBottom: aba === a.id ? `2px solid ${a.color}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
              <a.icon size={13} style={{ color: aba === a.id ? a.color : 'var(--label-4)' }} />
              <span style={{ fontSize: 9, fontWeight: 600, color: aba === a.id ? a.color : 'var(--label-4)' }}>
                {a.label}
              </span>
            </button>
          ))}
        </div>

        {/* Busca */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--sep)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--fill)', borderRadius: 8, padding: '6px 10px',
          }}>
            <Search size={11} style={{ color: 'var(--label-4)', flexShrink: 0 }} />
            <input
              value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar conversa..." style={{
                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                fontSize: 12, color: 'var(--label)',
              }}
            />
            <span style={{ fontSize: 10, color: 'var(--label-4)' }}>{filtradas.length}</span>
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            Array.from({length:5}).map((_,i) => (
              <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--sep)' }}>
                <div style={{ height: 10, width: '60%', borderRadius: 4, background: 'var(--sep)', marginBottom: 6 }} />
                <div style={{ height: 8, width: '80%', borderRadius: 4, background: 'var(--sep)' }} />
              </div>
            ))
          ) : filtradas.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--label-4)', fontSize: 12 }}>
              {aba === 'ativas' ? 'Nenhuma conversa ativa' :
               aba === 'concluidas' ? 'Nenhuma conversa concluída' :
               'Nenhum disparo transacional'}
            </div>
          ) : filtradas.map(c => (
            <ConvCard
              key={c.telefone}
              conv={c}
              ativo={sel?.telefone === c.telefone}
              onClick={() => setSel(c)}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 12px', borderTop: '1px solid var(--sep)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-2)',
        }}>
          <span style={{ fontSize: 10, color: 'var(--label-4)' }}>
            {filtradas.length} conversa{filtradas.length !== 1 ? 's' : ''}
          </span>
          <button onClick={carregar} style={{
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
            color: 'var(--label-4)', background: 'transparent', border: 'none',
            cursor: 'pointer', padding: '3px 6px', borderRadius: 4,
          }}>
            <RefreshCw size={9} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Painel direito — histórico */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {sel ? (
          <PainelHistorico conv={sel} api={api} />
        ) : (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <MessageSquare size={40} style={{ color: 'var(--sep)' }} />
            <div style={{ fontSize: 14, color: 'var(--label-4)', fontWeight: 500 }}>
              Selecione uma conversa
            </div>
            <div style={{ fontSize: 12, color: 'var(--label-4)' }}>
              {aba === 'transacional'
                ? 'Disparos automáticos separados do atendimento'
                : aba === 'concluidas'
                ? 'Conversas encerradas nos últimos 7 dias'
                : 'Conversas ativas nas últimas 24 horas'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
