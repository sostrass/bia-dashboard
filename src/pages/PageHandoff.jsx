import { useState, useEffect, useRef } from 'react'
import { User, Bot, Clock, CheckCircle, MessageSquare, RefreshCw, AlertCircle, Send } from 'lucide-react'

function formatarTempo(segundos) {
  if (segundos < 60) return `${segundos}s`
  if (segundos < 3600) return `${Math.floor(segundos/60)}min ${segundos%60}s`
  return `${Math.floor(segundos/3600)}h ${Math.floor((segundos%3600)/60)}min`
}

function corEspera(segundos) {
  if (segundos < 120)  return 'var(--accent)' // verde < 2min
  if (segundos < 300)  return 'var(--orange)'  // laranja < 5min
  return 'var(--red)'                           // vermelho > 5min
}

function ContadorEspera({ solicitadoEm }) {
  const [segundos, setSegundos] = useState(0)

  useEffect(() => {
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(solicitadoEm).getTime()) / 1000)
      setSegundos(Math.max(0, diff))
    }
    calc()
    const i = setInterval(calc, 1000)
    return () => clearInterval(i)
  }, [solicitadoEm])

  const cor = corEspera(segundos)
  return (
    <div className="flex items-center gap-1.5">
      <Clock size={12} style={{ color: cor }} />
      <span className="text-[13px] font-bold font-mono" style={{ color: cor }}>
        {formatarTempo(segundos)}
      </span>
    </div>
  )
}

export default function PageHandoff({ api }) {
  const [handoffs,   setHandoffs]   = useState([])
  const [historico,  setHistorico]  = useState([])
  const [sel,        setSel]        = useState(null)
  const [msg,        setMsg]        = useState('')
  const [retornoMsg, setRetornoMsg] = useState('Olá! Nossa equipe assumiu o seu atendimento. Como posso ajudar?')
  const [loading,    setLoading]    = useState(true)
  const [sending,    setSending]    = useState(false)
  const [tab,        setTab]        = useState('aguardando')
  const intervalRef = useRef(null)

  const carregar = async () => {
    try {
      const r = await fetch(`${api}/api/fase3/handoffs?status=${tab}`)
      if (r.ok) {
        const d = await r.json()
        setHandoffs(d.handoffs || [])
      }
    } catch {}
    finally { setLoading(false) }
  }

  // Atualiza a cada 5 segundos automaticamente
  useEffect(() => {
    carregar()
    intervalRef.current = setInterval(carregar, 5000)
    return () => clearInterval(intervalRef.current)
  }, [tab])

  const assumir = async (h) => {
    try {
      await fetch(`${api}/api/fase3/handoffs/${h.telefone}/atender`, { method: 'POST' })
      setSel(h)
      setHandoffs(prev => prev.filter(x => x.telefone !== h.telefone))
    } catch {}
  }

  const retomarIA = async (telefone) => {
    if (!retornoMsg.trim()) return
    setSending(true)
    try {
      await fetch(`${api}/webhook/handoff/retomar-ia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone, mensagem: retornoMsg })
      })
      setSel(null)
      await carregar()
    } catch {}
    setSending(false)
  }

  const enviarMensagem = async () => {
    if (!msg.trim() || !sel || sending) return
    setSending(true)
    try {
      await fetch(`${api}/webhook/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: sel.telefone, message: msg })
      })
      setMsg('')
    } catch {}
    setSending(false)
  }

  const urgentes = handoffs.filter(h => (h.segundos_espera || 0) >= 300)
  const normais  = handoffs.filter(h => (h.segundos_espera || 0) < 300)

  return (
    <div className="h-full flex overflow-hidden">

      {/* ── Fila de handoffs ── */}
      <div className="w-[300px] flex-shrink-0 flex flex-col"
        style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--sep)' }}>

        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--sep)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[17px] font-semibold" style={{ color: 'var(--label)' }}>Fila de Atendimento</h2>
            <button onClick={carregar} className="p-1.5 rounded-[8px] transition-all" style={{ color: 'var(--label-3)' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-0.5 rounded-[10px]" style={{ background: 'var(--fill)' }}>
            {[['aguardando','Aguardando'],['atendido','Atendidos']].map(([v,l]) => (
              <button key={v} onClick={() => setTab(v)}
                className="flex-1 py-1.5 rounded-[8px] text-[11px] font-medium transition-all"
                style={{ background: tab===v?'var(--bg-2)':'transparent', color: tab===v?'var(--label)':'var(--label-3)' }}>
                {l}
                {v === 'aguardando' && handoffs.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{ background: urgentes.length > 0 ? 'var(--red)' : 'var(--accent)', color: '#000' }}>
                    {handoffs.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center py-8" style={{ color: 'var(--label-3)' }}>
              <RefreshCw size={16} className="animate-spin mr-2" /> Carregando...
            </div>
          )}

          {!loading && handoffs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <CheckCircle size={32} className="mb-3 opacity-30" style={{ color: 'var(--accent)' }} />
              <p className="text-[13px] font-medium" style={{ color: 'var(--label-2)' }}>
                {tab === 'aguardando' ? 'Nenhum cliente aguardando' : 'Nenhum atendimento finalizado'}
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--label-3)' }}>
                {tab === 'aguardando' ? 'A IA está resolvendo tudo! 🤖' : 'O histórico aparece aqui'}
              </p>
            </div>
          )}

          {/* Urgentes primeiro */}
          {urgentes.length > 0 && (
            <div>
              <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: 'rgba(255,69,58,0.06)', color: 'var(--red)', borderBottom: '1px solid rgba(255,69,58,0.15)' }}>
                Esperando mais de 5 minutos
              </div>
              {urgentes.map(h => <HandoffCard key={h.id} h={h} onAssumir={assumir} sel={sel} />)}
            </div>
          )}

          {normais.map(h => <HandoffCard key={h.id} h={h} onAssumir={assumir} sel={sel} />)}
        </div>
      </div>

      {/* ── Painel de atendimento ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!sel ? (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ background: 'var(--bg)' }}>
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--fill)' }}>
                <User size={28} style={{ color: 'var(--label-3)' }} />
              </div>
              <h3 className="text-[17px] font-semibold mb-2" style={{ color: 'var(--label)' }}>
                Selecione um atendimento
              </h3>
              <p className="text-[13px]" style={{ color: 'var(--label-3)' }}>
                Clique em "Atender" na fila ao lado para assumir a conversa de um cliente
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3 flex items-center gap-3 flex-shrink-0"
              style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--sep)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px]"
                style={{ background: 'var(--blue)', color: '#fff' }}>
                {(sel.nome_cliente || sel.nome_contato || 'CL').slice(0,2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-semibold" style={{ color: 'var(--label)' }}>
                  {sel.nome_cliente || sel.nome_contato || 'Cliente'}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--label-3)' }}>{sel.telefone}</div>
              </div>
              <div className="flex items-center gap-2">
                <ContadorEspera solicitadoEm={sel.solicitado_em} />
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full"
                  style={{ background: 'rgba(10,132,255,0.12)', color: 'var(--blue)' }}>
                  Modo Manual Ativo
                </span>
              </div>
            </div>

            {/* Motivo do handoff */}
            <div className="px-5 py-2.5 flex items-start gap-2 flex-shrink-0"
              style={{ background: 'rgba(255,159,10,0.06)', borderBottom: '1px solid rgba(255,159,10,0.15)' }}>
              <AlertCircle size={13} style={{ color: 'var(--orange)', flexShrink: 0, marginTop: 1 }} />
              <div>
                <span className="text-[11px] font-semibold" style={{ color: 'var(--orange)' }}>Motivo do handoff: </span>
                <span className="text-[11px]" style={{ color: 'var(--label-2)' }}>{sel.motivo}</span>
              </div>
            </div>

            {/* Área de conversa */}
            <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
              <div className="text-center" style={{ color: 'var(--label-3)' }}>
                <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-[13px]">Histórico carregado do painel de Conversas</p>
                <p className="text-[11px] mt-1">Use o campo abaixo para responder ao cliente</p>
              </div>
            </div>

            {/* Input de resposta */}
            <div className="p-4 flex-shrink-0" style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--sep)' }}>
              <div className="flex gap-2 mb-3">
                <div className="flex-1 px-4 py-2.5 rounded-[22px] flex items-end gap-2"
                  style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)' }}>
                  <textarea
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem() } }}
                    placeholder="Digite sua mensagem para o cliente..."
                    rows={2}
                    className="flex-1 bg-transparent resize-none outline-none text-[13px] leading-relaxed"
                    style={{ color: 'var(--label)' }}
                  />
                </div>
                <button onClick={enviarMensagem} disabled={!msg.trim() || sending}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 self-end transition-all"
                  style={{ background: msg.trim() ? 'var(--blue)' : 'var(--fill)', color: msg.trim() ? '#fff' : 'var(--label-3)' }}>
                  {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>

              {/* Retornar para IA */}
              <div className="flex items-center gap-2 p-3 rounded-[12px]"
                style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
                <Bot size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <input value={retornoMsg} onChange={e => setRetornoMsg(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[12px]"
                  style={{ color: 'var(--label-2)' }}
                  placeholder="Mensagem ao retornar para IA..."
                />
                <button onClick={() => retomarIA(sel.telefone)} disabled={sending}
                  className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold flex-shrink-0 transition-all"
                  style={{ background: 'var(--accent)', color: '#000' }}>
                  {sending ? '...' : 'Retornar para IA'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function HandoffCard({ h, onAssumir, sel }) {
  const isSelected = sel?.telefone === h.telefone
  return (
    <div className="px-4 py-3 border-b transition-all"
      style={{ borderColor: 'var(--sep)', background: isSelected ? 'var(--accent-dim)' : 'transparent' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--label)' }}>
              {h.nome_cliente || h.nome_contato || 'Cliente'}
            </span>
          </div>
          <div className="text-[11px] font-mono mb-1.5" style={{ color: 'var(--label-3)' }}>{h.telefone}</div>
          <div className="text-[11px] mb-2" style={{ color: 'var(--label-2)' }}>
            {h.motivo?.slice(0, 80)}{h.motivo?.length > 80 ? '…' : ''}
          </div>
          <ContadorEspera solicitadoEm={h.solicitado_em} />
        </div>
      </div>
      <button onClick={() => onAssumir(h)}
        className="w-full mt-2 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all"
        style={{ background: 'var(--blue)', color: '#fff' }}>
        Atender
      </button>
    </div>
  )
}
