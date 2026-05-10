import { useState, useEffect, useRef } from 'react'
import { Send, Users, Clock, DollarSign, BarChart2, CheckCircle, XCircle, Pause, Play, RefreshCw, ChevronDown, AlertTriangle } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const MODELOS_CUSTO = {
  'gemini-2.5-flash-lite': 0.00017,
  'gemini-2.5-flash':      0.00055,
  'gemini-2.5-pro':        0.00275,
}

function Sparkline({ data, color = 'var(--accent)' }) {
  if (!data?.length) return null
  const max = Math.max(...data, 1)
  const w = 80, h = 28
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PageEnvioMassa({ api: apiProp }) {
  const api = apiProp || BASE

  const [contatos,    setContatos]    = useState([])
  const [selecionados, setSelecionados] = useState(new Set())
  const [mensagem,    setMensagem]    = useState('')
  const [cabecalho,   setCabecalho]   = useState('')
  const [rodape,      setRodape]      = useState('')
  const [botoes,      setBotoes]      = useState([])
  const [intervalo,   setIntervalo]   = useState(2000)
  const [modelo,      setModelo]      = useState('gemini-2.5-flash')
  const [enviando,    setEnviando]    = useState(false)
  const [pausado,     setPausado]     = useState(false)
  const [progresso,   setProgresso]   = useState({ total: 0, enviados: 0, erros: 0, log: [] })
  const [tab,         setTab]         = useState('composicao') // composicao | destinatarios | dashboard
  const pausadoRef = useRef(false)

  useEffect(() => {
    fetch(`${api}/api/contatos`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setContatos(d.contatos || d || []) })
      .catch(() => {})
  }, [api])

  const toggleSel = (tel) => setSelecionados(prev => {
    const n = new Set(prev)
    n.has(tel) ? n.delete(tel) : n.add(tel)
    return n
  })

  const toggleTodos = () => {
    if (selecionados.size === contatos.length) setSelecionados(new Set())
    else setSelecionados(new Set(contatos.map(c => c.telefone)))
  }

  const custoEstimado = () => {
    const custo = MODELOS_CUSTO[modelo] || 0.00055
    return (selecionados.size * custo).toFixed(4)
  }

  const montarMensagem = (contato) => {
    let msg = ''
    if (cabecalho) msg += `*${cabecalho}*\n\n`
    msg += mensagem.replace('{nome}', contato.nome?.split(' ')[0] || 'Cliente')
    if (rodape) msg += `\n\n_${rodape}_`
    if (botoes.length) msg += '\n\n' + botoes.map((b, i) => `${i+1}. ${b}`).join('\n')
    return msg
  }

  const iniciarEnvio = async () => {
    if (!mensagem.trim() || selecionados.size === 0) return
    setEnviando(true)
    setPausado(false)
    pausadoRef.current = false
    const lista = contatos.filter(c => selecionados.has(c.telefone))
    setProgresso({ total: lista.length, enviados: 0, erros: 0, log: [] })

    for (let i = 0; i < lista.length; i++) {
      // Verifica pausa
      while (pausadoRef.current) {
        await new Promise(r => setTimeout(r, 500))
      }

      const c = lista[i]
      const msg = montarMensagem(c)
      const inicio = Date.now()
      try {
        const r = await fetch(`${api}/api/dashboard/enviar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telefone: c.telefone, mensagem: msg })
        })
        const ok = r.ok
        const ms = Date.now() - inicio
        setProgresso(prev => ({
          ...prev,
          enviados: prev.enviados + (ok ? 1 : 0),
          erros:    prev.erros + (ok ? 0 : 1),
          log: [...prev.log, { nome: c.nome || c.telefone, ok, ms, hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]
        }))
      } catch {
        setProgresso(prev => ({
          ...prev,
          erros: prev.erros + 1,
          log: [...prev.log, { nome: c.nome || c.telefone, ok: false, ms: 0, hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]
        }))
      }

      // Intervalo entre envios (exceto no último)
      if (i < lista.length - 1) {
        await new Promise(r => setTimeout(r, intervalo))
      }
    }

    setEnviando(false)
  }

  const togglePausa = () => {
    pausadoRef.current = !pausadoRef.current
    setPausado(pausadoRef.current)
  }

  const pct = progresso.total > 0 ? Math.round((progresso.enviados + progresso.erros) / progresso.total * 100) : 0
  const sparkData = progresso.log.slice(-20).map(l => l.ok ? 1 : 0)

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="px-6 py-4 flex-shrink-0 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--sep)', background: 'var(--bg-2)' }}>
        <div>
          <h2 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--label)' }}>Envio em Massa</h2>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-3)' }}>
            {selecionados.size} destinatários · Custo estimado: ~${custoEstimado()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {enviando && (
            <button onClick={togglePausa}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold"
              style={{ background: pausado ? 'var(--accent)' : 'var(--orange)', color: '#000' }}>
              {pausado ? <><Play size={13} /> Retomar</> : <><Pause size={13} /> Pausar</>}
            </button>
          )}
          {!enviando && (
            <button onClick={iniciarEnvio}
              disabled={!mensagem.trim() || selecionados.size === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[13px] font-semibold transition-all"
              style={{
                background: mensagem.trim() && selecionados.size > 0 ? 'var(--accent)' : 'var(--fill)',
                color: mensagem.trim() && selecionados.size > 0 ? '#000' : 'var(--label-3)',
              }}>
              <Send size={14} /> Iniciar Envio
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 flex-shrink-0" style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--sep)' }}>
        {[['composicao','Composição'],['destinatarios','Destinatários'],['dashboard','Dashboard']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className="px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all"
            style={{ background: tab===v?'var(--bg)':'transparent', color: tab===v?'var(--label)':'var(--label-3)' }}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* COMPOSIÇÃO */}
        {tab === 'composicao' && (
          <div className="max-w-2xl mx-auto space-y-5">

            {/* Cabeçalho */}
            <div className="card p-5 space-y-4">
              <h3 className="text-[15px] font-semibold" style={{ color: 'var(--label)' }}>
                Estrutura da Mensagem
              </h3>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--label-3)' }}>
                  Cabeçalho (opcional)
                </label>
                <input value={cabecalho} onChange={e => setCabecalho(e.target.value)}
                  placeholder="Ex: 🎉 Promoção Especial"
                  className="w-full px-3 py-2 rounded-[10px] text-[13px] outline-none"
                  style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)', color: 'var(--label)' }} />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--label-3)' }}>
                  Corpo da mensagem *
                </label>
                <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={5}
                  placeholder="Olá {nome}! Temos novidades incríveis para você..."
                  className="w-full px-3 py-2 rounded-[10px] text-[13px] outline-none resize-none"
                  style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)', color: 'var(--label)', lineHeight: 1.6 }} />
                <p className="text-[10px] mt-1" style={{ color: 'var(--label-3)' }}>
                  Use {'{nome}'} para personalizar com o nome do cliente
                </p>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--label-3)' }}>
                  Rodapé (opcional)
                </label>
                <input value={rodape} onChange={e => setRodape(e.target.value)}
                  placeholder="Ex: Para cancelar inscrições responda PARAR"
                  className="w-full px-3 py-2 rounded-[10px] text-[13px] outline-none"
                  style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)', color: 'var(--label)' }} />
              </div>

              {/* Botões de ação */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--label-3)' }}>
                  Botões de resposta rápida (opcional)
                </label>
                <div className="space-y-2">
                  {botoes.map((b, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={b} onChange={e => setBotoes(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                        placeholder={`Botão ${i+1}`}
                        className="flex-1 px-3 py-2 rounded-[10px] text-[13px] outline-none"
                        style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)', color: 'var(--label)' }} />
                      <button onClick={() => setBotoes(prev => prev.filter((_, j) => j !== i))}
                        className="px-3 py-2 rounded-[10px] text-[12px]"
                        style={{ background: 'var(--fill)', color: 'var(--red)' }}>✕</button>
                    </div>
                  ))}
                  {botoes.length < 3 && (
                    <button onClick={() => setBotoes(prev => [...prev, ''])}
                      className="text-[12px] px-3 py-1.5 rounded-[8px]"
                      style={{ background: 'var(--fill)', color: 'var(--label-2)', border: '1px dashed var(--sep)' }}>
                      + Adicionar botão
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Configurações de envio */}
            <div className="card p-5 space-y-4">
              <h3 className="text-[15px] font-semibold" style={{ color: 'var(--label)' }}>Configurações de Envio</h3>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--label-3)' }}>
                  Intervalo entre mensagens (ms)
                </label>
                <div className="flex items-center gap-3">
                  <input type="range" min={500} max={10000} step={500} value={intervalo}
                    onChange={e => setIntervalo(parseInt(e.target.value))} className="flex-1" />
                  <span className="text-[13px] font-mono font-bold w-16 text-right" style={{ color: 'var(--accent)' }}>
                    {intervalo >= 1000 ? `${intervalo/1000}s` : `${intervalo}ms`}
                  </span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'var(--label-3)' }}>
                  Mínimo recomendado: 2s para evitar bloqueio do WhatsApp
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="card p-5">
              <h3 className="text-[15px] font-semibold mb-3" style={{ color: 'var(--label)' }}>Preview</h3>
              <div className="p-4 rounded-[14px] text-[13px] leading-relaxed whitespace-pre-wrap"
                style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)', color: 'var(--label)' }}>
                {montarMensagem({ nome: 'João Silva' }) || 'Compose sua mensagem acima...'}
              </div>
            </div>
          </div>
        )}

        {/* DESTINATÁRIOS */}
        {tab === 'destinatarios' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px]" style={{ color: 'var(--label-2)' }}>
                {selecionados.size} de {contatos.length} selecionados
              </span>
              <button onClick={toggleTodos} className="text-[12px] font-semibold"
                style={{ color: 'var(--accent)' }}>
                {selecionados.size === contatos.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>

            <div className="card overflow-hidden">
              {contatos.map((c, i) => {
                const sel = selecionados.has(c.telefone)
                return (
                  <div key={c.telefone} onClick={() => toggleSel(c.telefone)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b transition-all"
                    style={{ borderColor: 'var(--sep)', background: sel ? 'var(--accent-dim)' : 'transparent' }}>
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: sel ? 'var(--accent)' : 'var(--fill)', border: `1px solid ${sel ? 'var(--accent)' : 'var(--sep)'}` }}>
                      {sel && <span className="text-[10px] font-bold" style={{ color: '#000' }}>✓</span>}
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: 'var(--fill)', color: 'var(--label-2)' }}>
                      {(c.nome || c.telefone).slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate" style={{ color: 'var(--label)' }}>{c.nome || 'Sem nome'}</div>
                      <div className="text-[11px] font-mono" style={{ color: 'var(--label-3)' }}>{c.telefone}</div>
                    </div>
                    {(c.tags||[]).slice(0,2).map((t,j) => (
                      <span key={j} className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--fill)', color: 'var(--label-3)', border: '1px solid var(--sep)' }}>
                        {t.split(':')[1] || t}
                      </span>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div className="space-y-5">

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { l: 'Total',    v: progresso.total,    c: 'var(--label)',  icon: Users },
                { l: 'Enviados', v: progresso.enviados, c: 'var(--accent)', icon: CheckCircle },
                { l: 'Erros',    v: progresso.erros,    c: 'var(--red)',    icon: XCircle },
                { l: 'Custo',    v: `$${(progresso.enviados * (MODELOS_CUSTO[modelo] || 0.00055)).toFixed(4)}`, c: 'var(--blue)', icon: DollarSign },
              ].map((k, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <k.icon size={14} style={{ color: k.c }} />
                  </div>
                  <div className="text-[26px] font-bold" style={{ color: k.c }}>{k.v}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--label-3)' }}>{k.l}</div>
                </div>
              ))}
            </div>

            {/* Barra de progresso */}
            {progresso.total > 0 && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-semibold" style={{ color: 'var(--label)' }}>Progresso</span>
                  <span className="text-[14px] font-bold" style={{ color: 'var(--accent)' }}>{pct}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--sep)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: progresso.erros > 0 ? 'var(--orange)' : 'var(--accent)' }} />
                </div>
                <div className="flex justify-between text-[11px] mt-1.5" style={{ color: 'var(--label-3)' }}>
                  <span>{progresso.enviados + progresso.erros} processados</span>
                  <span>{progresso.total - progresso.enviados - progresso.erros} restantes</span>
                </div>
              </div>
            )}

            {/* Log de envios */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--sep)' }}>
                <span className="text-[14px] font-semibold" style={{ color: 'var(--label)' }}>Log de envios</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {progresso.log.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--label-3)' }}>
                    Nenhum envio realizado ainda
                  </div>
                ) : [...progresso.log].reverse().map((l, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-2.5 border-b"
                    style={{ borderColor: 'var(--sep)' }}>
                    {l.ok
                      ? <CheckCircle size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      : <XCircle size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />}
                    <span className="flex-1 text-[13px]" style={{ color: 'var(--label)' }}>{l.nome}</span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--label-3)' }}>{l.ms}ms</span>
                    <span className="text-[11px]" style={{ color: 'var(--label-3)' }}>{l.hora}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
