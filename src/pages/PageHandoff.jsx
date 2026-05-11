import { useState, useEffect, useRef } from 'react'
import { User, Bot, Clock, CheckCircle, MessageSquare, RefreshCw,
         AlertCircle, Send, Phone, CreditCard, Package, Zap, X } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

function formatarTempo(segundos) {
  if (segundos < 60)   return `${segundos}s`
  if (segundos < 3600) return `${Math.floor(segundos/60)}m ${segundos%60}s`
  return `${Math.floor(segundos/3600)}h ${Math.floor((segundos%3600)/60)}m`
}

function corEspera(seg) {
  if (seg < 120) return 'var(--accent)'
  if (seg < 300) return 'var(--orange)'
  return 'var(--red)'
}

function ContadorEspera({ solicitadoEm }) {
  const [seg, setSeg] = useState(0)
  useEffect(() => {
    const calc = () => setSeg(Math.floor((Date.now() - new Date(solicitadoEm).getTime()) / 1000))
    calc()
    const i = setInterval(calc, 1000)
    return () => clearInterval(i)
  }, [solicitadoEm])
  return (
    <span className="flex items-center gap-1 font-mono font-bold text-[12px]"
      style={{ color: corEspera(seg) }}>
      <Clock size={11}/> {formatarTempo(seg)}
    </span>
  )
}

function StatusPagamento({ pedidos }) {
  if (!pedidos?.length) return null
  const ultimo = pedidos[0]
  const STATUS = {
    open:      { label:'Pagamento pendente', color:'var(--orange)', icon:'⏳' },
    paid:      { label:'Pago',              color:'var(--accent)', icon:'✅' },
    closed:    { label:'Entregue',          color:'var(--accent)', icon:'📦' },
    shipped:   { label:'Enviado',           color:'var(--blue)',   icon:'🚚' },
    progress:  { label:'Em andamento',      color:'var(--blue)',   icon:'🔄' },
    cancelled: { label:'Cancelado',         color:'var(--red)',    icon:'❌' },
  }
  const sc = STATUS[ultimo.status] || STATUS.progress
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold"
      style={{ background:`${sc.color}10`, color:sc.color, border:`1px solid ${sc.color}30` }}>
      {sc.icon} #{ultimo.numero} · {sc.label}
      {ultimo.total && <span style={{ opacity:0.7 }}>· {ultimo.total}</span>}
    </div>
  )
}

export default function PageHandoff({ api: apiProp }) {
  const api = apiProp || BASE
  const [handoffs,  setHandoffs]  = useState([])
  const [sel,       setSel]       = useState(null)
  const [historico, setHistorico] = useState([])
  const [pedidos,   setPedidos]   = useState([])
  const [msg,       setMsg]       = useState('')
  const [sending,   setSending]   = useState(false)
  const [tab,       setTab]       = useState('aguardando')
  const [loading,   setLoading]   = useState(true)
  const chatRef    = useRef(null)
  const intervalRef= useRef(null)

  const carregar = async () => {
    try {
      const r = await fetch(`${api}/api/fase3/handoffs?status=${tab}`)
      if (r.ok) {
        const d = await r.json()
        setHandoffs(d.handoffs || [])
      }
    } catch {}
    setLoading(false)
  }

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
      carregarHistorico(h.telefone, true)
      carregarPedidos(h.telefone)
    } catch {}
  }

  const carregarHistorico = async (telefone, inicial = true) => {
    if (inicial) setHistorico([])
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${telefone}`)
      if (r.ok) {
        const d = await r.json()
        setHistorico(prev => {
          const msgs = d.mensagens || []
          if (msgs.length !== prev.length) {
            setTimeout(() => chatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 100)
            return msgs
          }
          return prev
        })
      }
    } catch {}
  }

  const carregarPedidos = async (telefone) => {
    try {
      const r = await fetch(`${api}/api/contatos/${telefone}/pedidos`)
      if (r.ok) {
        const d = await r.json()
        setPedidos(d.pedidos || [])
      }
    } catch {}
  }

  useEffect(() => {
    if (!sel) return
    const i = setInterval(() => carregarHistorico(sel.telefone, false), 5000)
    return () => clearInterval(i)
  }, [sel?.telefone])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })
  }, [historico])

  const retomarIA = async (telefone) => {
    try {
      await fetch(`${api}/api/fase3/handoffs/${telefone}/retomar-ia`, { method: 'POST' })
      const retornoMsg = 'Obrigado pelo contato! A Molise voltará a te atender. 😊'
      await fetch(`${api}/api/dashboard/enviar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone, mensagem: retornoMsg })
      })
      setSel(null)
      setHistorico([])
      setPedidos([])
      await carregar()
    } catch {}
  }

  const resolver = async (telefone) => {
    try {
      await fetch(`${api}/api/fase3/handoffs/${telefone}/resolver`, { method: 'POST' })
      setSel(null); setHistorico([]); setPedidos([])
      await carregar()
    } catch {}
  }

  const enviarMensagem = async () => {
    if (!msg.trim() || sending || !sel) return
    const texto = msg.trim()
    setMsg('')
    setSending(true)
    setHistorico(prev => [...prev, {
      id: `local-${Date.now()}`, mensagem: texto, direcao: 'saida',
      modo: 'manual', hora: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    }])
    try {
      await fetch(`${api}/api/dashboard/enviar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: sel.telefone, mensagem: texto })
      })
      setTimeout(() => carregarHistorico(sel.telefone, false), 1000)
    } catch {}
    setSending(false)
  }

  const urgentes = handoffs.filter(h => {
    const seg = Math.floor((Date.now() - new Date(h.solicitado_em||h.criado_em||Date.now()).getTime()) / 1000)
    return seg > 300
  })
  const normais = handoffs.filter(h => {
    const seg = Math.floor((Date.now() - new Date(h.solicitado_em||h.criado_em||Date.now()).getTime()) / 1000)
    return seg <= 300
  })

  return (
    <div className="h-full flex overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Lista de handoffs */}
      <div className="w-[280px] flex-shrink-0 flex flex-col"
        style={{ background:'var(--bg-2)', borderRight:'1px solid var(--sep)' }}>

        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[17px] font-bold" style={{ color:'var(--label)' }}>Atendimento</h2>
            <button onClick={carregar} style={{ color:'var(--label-3)' }}><RefreshCw size={13}/></button>
          </div>
          <div className="flex p-0.5 rounded-[9px]" style={{ background:'var(--fill)' }}>
            {[['aguardando','Aguardando'],['em_atendimento','Ativo'],['resolvido','Resolvidos']].map(([v,l]) => (
              <button key={v} onClick={() => setTab(v)}
                className="flex-1 py-1.5 rounded-[7px] text-[10px] font-medium transition-all"
                style={{ background:tab===v?'var(--bg-2)':'transparent', color:tab===v?'var(--label)':'var(--label-3)' }}>
                {l}
                {v==='aguardando' && handoffs.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{ background:urgentes.length>0?'var(--red)':'var(--accent)', color:'#000' }}>
                    {handoffs.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-hidden">
          {loading && <div className="flex justify-center py-8" style={{ color:'var(--label-3)' }}><RefreshCw size={14} className="animate-spin"/></div>}

          {!loading && handoffs.length === 0 && (
            <div className="flex flex-col items-center py-10 px-4 text-center">
              <CheckCircle size={28} className="mb-2 opacity-20" style={{ color:'var(--accent)' }}/>
              <p className="text-[12px]" style={{ color:'var(--label-3)' }}>
                {tab==='aguardando' ? 'Nenhum cliente aguardando' : 'Nenhum registro'}
              </p>
            </div>
          )}

          {urgentes.length > 0 && (
            <div className="px-3 py-2 text-[10px] font-semibold flex items-center gap-1.5"
              style={{ background:'rgba(226,75,74,0.08)', color:'var(--red)', borderBottom:'1px solid rgba(226,75,74,0.15)' }}>
              <AlertCircle size={11}/> {urgentes.length} aguardando +5min
            </div>
          )}

          {handoffs.map(h => (
            <HandoffCard key={h.id||h.telefone} h={h} onAssumir={assumir} sel={sel}/>
          ))}
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!sel ? (
          <div className="flex-1 flex items-center justify-center" style={{ background:'var(--bg)' }}>
            <div className="text-center" style={{ color:'var(--label-3)' }}>
              <MessageSquare size={32} className="mx-auto mb-3 opacity-20"/>
              <p className="text-[14px]" style={{ color:'var(--label-2)' }}>Selecione um atendimento</p>
              <p className="text-[12px] mt-1">Clique em "Atender" na lista ao lado</p>
            </div>
          </div>
        ) : <>

          {/* Header do chat */}
          <div className="px-5 py-3 flex items-center gap-3 flex-shrink-0"
            style={{ background:'var(--bg-2)', borderBottom:'1px solid var(--sep)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] flex-shrink-0"
              style={{ background:'rgba(0,212,170,0.15)', color:'var(--accent)' }}>
              {(sel.nome_contato||sel.nome||sel.telefone||'CL').slice(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold" style={{ color:'var(--label)' }}>
                {sel.nome_contato || sel.nome || 'Cliente'}
              </div>
              <div className="text-[11px] font-mono" style={{ color:'var(--label-4)' }}>{sel.telefone}</div>
            </div>

            {/* Status de pagamento */}
            <StatusPagamento pedidos={pedidos} />

            {/* Ações */}
            <div className="flex items-center gap-2">
              <button onClick={() => retomarIA(sel.telefone)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold"
                style={{ background:'rgba(0,212,170,0.1)', color:'var(--accent)', border:'1px solid rgba(0,212,170,0.2)' }}>
                <Bot size={11}/> Passar para IA
              </button>
              <button onClick={() => resolver(sel.telefone)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold"
                style={{ background:'rgba(74,159,255,0.1)', color:'var(--blue)', border:'1px solid rgba(74,159,255,0.2)' }}>
                <CheckCircle size={11}/> Resolver
              </button>
            </div>
          </div>

          {/* Histórico real */}
          <div ref={chatRef} className="flex-1 overflow-y-auto scroll-hidden px-5 py-4 space-y-2"
            style={{ background:'var(--bg)' }}>
            {historico.length === 0 && (
              <div className="flex items-center justify-center h-full" style={{ color:'var(--label-3)' }}>
                <div className="text-center">
                  <MessageSquare size={24} className="mx-auto mb-2 opacity-20"/>
                  <p className="text-[12px]">Carregando histórico...</p>
                </div>
              </div>
            )}
            {historico.map((m, i) => {
              const isUser = m.direcao === 'entrada'
              const isBot  = m.direcao === 'saida' && m.modo !== 'manual'
              const isMe   = m.direcao === 'saida' && m.modo === 'manual'
              return (
                <div key={m.id||i} className={`flex gap-2 ${isUser?'justify-end':'justify-start'}`}>
                  {!isUser && (
                    <div className="rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 mt-auto"
                      style={{ width:22, height:22, background:isBot?'rgba(0,212,170,0.15)':'rgba(74,159,255,0.15)', color:isBot?'var(--accent)':'var(--blue)' }}>
                      {isBot?'IA':'AT'}
                    </div>
                  )}
                  <div className="max-w-[74%]">
                    <div className="px-3 py-2 text-[12px] leading-relaxed whitespace-pre-line rounded-[14px]"
                      style={{
                        background: isUser?'rgba(74,159,255,0.12)':isMe?'var(--bg-3)':'var(--bg-2)',
                        color: isUser?'var(--blue)':'var(--label)',
                        borderBottomLeftRadius: !isUser?3:14,
                        borderBottomRightRadius: isUser?3:14,
                        border:'1px solid var(--sep)',
                      }}>
                      {m.mensagem||m.conteudo||''}
                    </div>
                    <div className={`text-[9px] mt-0.5 px-1 ${isUser?'text-right':''}`} style={{ color:'var(--label-4)' }}>
                      {m.hora}
                    </div>
                  </div>
                  {isUser && (
                    <div className="rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 mt-auto"
                      style={{ width:22, height:22, background:'var(--fill)', color:'var(--label-3)' }}>
                      CL
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Input */}
          <div className="px-4 py-3 flex-shrink-0" style={{ background:'var(--bg-2)', borderTop:'1px solid var(--sep)' }}>
            <div className="flex items-end gap-2">
              <div className="flex-1 px-3 py-2 rounded-[12px]"
                style={{ background:'var(--bg-3)', border:'1px solid var(--sep)' }}>
                <textarea value={msg} onChange={e => setMsg(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviarMensagem()} }}
                  placeholder="Responder ao cliente... (Enter envia)"
                  rows={1} className="w-full bg-transparent resize-none outline-none text-[13px] leading-relaxed scroll-hidden"
                  style={{ color:'var(--label)', maxHeight:80, minHeight:22 }}
                  onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,80)+'px' }}/>
              </div>
              <button onClick={enviarMensagem} disabled={!msg.trim()||sending}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background:msg.trim()?'var(--accent)':'var(--fill)', color:msg.trim()?'#000':'var(--label-3)' }}>
                {sending?<RefreshCw size={15} className="animate-spin"/>:<Send size={15}/>}
              </button>
            </div>
          </div>
        </>}
      </div>
    </div>
  )
}

function HandoffCard({ h, onAssumir, sel }) {
  const isActive = sel?.telefone === h.telefone
  const ts = h.solicitado_em || h.criado_em || new Date().toISOString()
  const seg = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  const urgente = seg > 300

  return (
    <button onClick={() => onAssumir(h)}
      className="w-full text-left px-4 py-3 border-b transition-all border-l-2"
      style={{
        borderBottomColor:'var(--sep)',
        borderLeftColor: isActive?'var(--accent)':urgente?'var(--red)':'transparent',
        background: isActive?'rgba(0,212,170,0.05)':urgente?'rgba(226,75,74,0.03)':'transparent',
      }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
          style={{ background:urgente?'rgba(226,75,74,0.15)':'rgba(0,212,170,0.15)', color:urgente?'var(--red)':'var(--accent)' }}>
          {(h.nome_contato||h.nome||h.telefone||'CL').slice(0,2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold truncate" style={{ color:'var(--label)' }}>
            {h.nome_contato || h.nome || 'Cliente'}
          </div>
          <div className="text-[10px] font-mono truncate" style={{ color:'var(--label-3)' }}>{h.telefone}</div>
          {h.dados?.motivo && (
            <div className="text-[10px] mt-0.5 truncate" style={{ color:'var(--label-3)' }}>{h.dados.motivo}</div>
          )}
        </div>
        <ContadorEspera solicitadoEm={ts}/>
      </div>
    </button>
  )
}
