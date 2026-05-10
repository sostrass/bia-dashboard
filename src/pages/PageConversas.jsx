import { useState, useEffect, useRef } from 'react'
import { Send, RefreshCw, Phone } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

export default function PageConversas({ api: apiProp }) {
  const apiBase = apiProp || BASE
  const [conversas,   setConversas]   = useState([])
  const [selContato,  setSelContato]  = useState(null)
  const [historico,   setHistorico]   = useState([])
  const [texto,       setTexto]       = useState('')
  const [enviando,    setEnviando]    = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [loadingHist, setLoadingHist] = useState(false)
  const bottomRef = useRef(null)

  const carregarConversas = async () => {
    try {
      const r = await fetch(`${apiBase}/api/dashboard/conversas`)
      const d = await r.json()
      setConversas(d.conversas || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    carregarConversas()
    const i = setInterval(carregarConversas, 10000)
    return () => clearInterval(i)
  }, [apiBase])

  const carregarHistorico = async (telefone) => {
    setLoadingHist(true)
    try {
      const r = await fetch(`${apiBase}/api/dashboard/historico/${telefone}`)
      const d = await r.json()
      setHistorico(d.mensagens || [])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (e) { console.error(e) }
    finally { setLoadingHist(false) }
  }

  const selecionarContato = (c) => { setSelContato(c); carregarHistorico(c.telefone) }

  useEffect(() => {
    if (!selContato) return
    const i = setInterval(() => carregarHistorico(selContato.telefone), 5000)
    return () => clearInterval(i)
  }, [selContato?.telefone])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [historico])

  const enviar = async () => {
    if (!texto.trim() || !selContato || enviando) return
    const msg = texto.trim()
    setTexto('')
    setEnviando(true)
    setHistorico(prev => [...prev, {
      id: `local-${Date.now()}`, mensagem: msg, direcao: 'saida', modo: 'manual',
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }])
    try {
      const r = await fetch(`${apiBase}/api/dashboard/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: selContato.telefone, mensagem: msg })
      })
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.erro || `HTTP ${r.status}`) }
      setTimeout(() => carregarHistorico(selContato.telefone), 1500)
    } catch (e) { alert(`Erro ao enviar: ${e.message}`) }
    finally { setEnviando(false) }
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Lista */}
      <div className="w-[280px] flex-shrink-0 flex flex-col border-r overflow-hidden"
        style={{ background: 'var(--bg-2)', borderColor: 'var(--sep)' }}>
        <div className="px-4 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--sep)' }}>
          <h2 className="text-[16px] font-semibold" style={{ color: 'var(--label)' }}>Conversas</h2>
          <button onClick={carregarConversas} style={{ color: 'var(--label-3)' }}><RefreshCw size={13} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="flex justify-center py-8" style={{ color: 'var(--label-3)' }}><RefreshCw size={14} className="animate-spin" /></div>}
          {!loading && conversas.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--label-3)' }}>
              Nenhuma conversa.<br />Aguardando mensagens.
            </div>
          )}
          {conversas.map(c => (
            <button key={c.telefone} onClick={() => selecionarContato(c)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left border-b transition-all"
              style={{ borderColor: 'var(--sep)', background: selContato?.telefone === c.telefone ? 'var(--accent-dim)' : 'transparent' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold"
                style={{ background: 'var(--fill)', color: 'var(--label-2)' }}>
                {(c.nome || c.telefone).slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--label)' }}>{c.nome || c.telefone}</div>
                <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--label-3)' }}>{c.ultima_mensagem?.slice(0, 40) || '...'}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
        {!selContato ? (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ color: 'var(--label-3)' }}>
            <Phone size={32} className="mb-3 opacity-30" />
            <p className="text-[14px]" style={{ color: 'var(--label-2)' }}>Selecione uma conversa</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--sep)', background: 'var(--bg-2)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px]"
                style={{ background: 'var(--accent)', color: '#000' }}>
                {(selContato.nome || selContato.telefone).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: 'var(--label)' }}>{selContato.nome || 'Cliente'}</div>
                <div className="text-[11px] font-mono" style={{ color: 'var(--label-3)' }}>{selContato.telefone}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingHist && <div className="flex justify-center py-4"><RefreshCw size={14} className="animate-spin" style={{ color: 'var(--label-3)' }} /></div>}
              {historico.map((m, i) => (
                <div key={m.id || i} className={`flex ${m.direcao === 'saida' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[75%] px-3 py-2 text-[13px]"
                    style={{
                      background: m.direcao === 'saida' ? 'var(--accent)' : 'var(--bg-3)',
                      color:      m.direcao === 'saida' ? '#000' : 'var(--label)',
                      borderRadius: m.direcao === 'saida' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    }}>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{m.mensagem}</div>
                    <div className="text-[10px] mt-1 opacity-60 text-right">{m.hora}</div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: 'var(--sep)', background: 'var(--bg-2)' }}>
              <textarea value={texto} onChange={e => setTexto(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
                placeholder="Digite... (Enter para enviar)" rows={1}
                className="flex-1 resize-none"
                style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)', borderRadius: 12, color: 'var(--label)', outline: 'none', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 100 }} />
              <button onClick={enviar} disabled={!texto.trim() || enviando}
                className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                style={{ background: texto.trim() ? 'var(--accent)' : 'var(--fill)', color: texto.trim() ? '#000' : 'var(--label-3)' }}>
                {enviando ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
