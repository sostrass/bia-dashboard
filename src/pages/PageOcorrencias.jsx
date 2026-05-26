import { useState, useEffect, useCallback } from 'react'

const BASE = import.meta.env.VITE_API_URL || ''

const TIPOS = [
  { id:'entrega',    label:'Entrega',       emoji:'🚚', cor:'#4a9fff' },
  { id:'pagamento',  label:'Pagamento',     emoji:'💳', cor:'#22c55e' },
  { id:'produto',    label:'Produto',       emoji:'📦', cor:'#f59e0b' },
  { id:'troca',      label:'Troca/Dev.',    emoji:'↩️',  cor:'#a78bfa' },
  { id:'atendimento',label:'Atendimento',   emoji:'💬', cor:'#06b6d4' },
  { id:'geral',      label:'Geral',         emoji:'📋', cor:'#6b7280' },
]

const STATUS_CFG = {
  aberto:      { label:'Aberto',       cor:'#f59e0b', bg:'rgba(245,158,11,0.1)'  },
  em_analise:  { label:'Em análise',   cor:'#4a9fff', bg:'rgba(74,159,255,0.1)'  },
  resolvido:   { label:'Resolvido',    cor:'#22c55e', bg:'rgba(34,197,94,0.1)'   },
  encerrado:   { label:'Encerrado',    cor:'#6b7280', bg:'rgba(107,114,128,0.1)' },
}

const PRIORIDADES = [
  { id:'baixa',  label:'Baixa',  cor:'#6b7280' },
  { id:'normal', label:'Normal', cor:'#4a9fff' },
  { id:'alta',   label:'Alta',   cor:'#f59e0b' },
  { id:'urgente',label:'Urgente',cor:'#ef4444' },
]

const fmtData = ts => ts ? new Date(ts).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—'
const fmtHora = ts => ts ? new Date(ts).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) : ''

// ── Modal de nova ocorrência ───────────────────────────────────────────────────
function ModalNova({ api, onSalvo, onClose }) {
  const [form, setForm] = useState({
    telefone: '', tipo: 'geral', descricao: '', numero_pedido: '', prioridade: 'normal'
  })
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    if (!form.descricao.trim()) return
    setSalvando(true)
    try {
      const r = await fetch(`${api}/api/ocorrencias`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (r.ok) { onSalvo?.(); onClose() }
    } catch {}
    setSalvando(false)
  }

  const inp = 'w-full px-3 py-2 rounded-xl text-[12px] outline-none transition-colors'
  const inpStyle = { background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/50 z-40" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>

          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--sep)]">
            <h3 className="text-[15px] font-bold" style={{ color:'var(--label)' }}>Nova ocorrência</h3>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-3)]"
              style={{ border:'1px solid var(--sep)' }}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ color:'var(--label-3)' }}>
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'var(--label-4)' }}>Tipo</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className={inp} style={inpStyle}>
                  {TIPOS.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'var(--label-4)' }}>Prioridade</label>
                <select value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}
                  className={inp} style={inpStyle}>
                  {PRIORIDADES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'var(--label-4)' }}>Telefone do cliente</label>
              <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                placeholder="5519999999999" className={inp} style={inpStyle} />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'var(--label-4)' }}>Nº do pedido (opcional)</label>
              <input value={form.numero_pedido} onChange={e => setForm(f => ({ ...f, numero_pedido: e.target.value }))}
                placeholder="12345" className={inp} style={inpStyle} />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'var(--label-4)' }}>Descrição *</label>
              <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Descreva a ocorrência..." rows={3}
                className={`${inp} resize-none`} style={inpStyle} />
            </div>
          </div>

          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-colors"
              style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>
              Cancelar
            </button>
            <button onClick={salvar} disabled={!form.descricao.trim() || salvando}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background:'var(--accent)', color:'#000' }}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Card de ocorrência ────────────────────────────────────────────────────────
function OcorrenciaCard({ oc, api, onAtualizado }) {
  const [expandida, setExpandida] = useState(false)
  const [salvando,  setSalvando]  = useState(false)

  const tipo  = TIPOS.find(t => t.id === oc.tipo)    || TIPOS[5]
  const st    = STATUS_CFG[oc.status]                || STATUS_CFG.aberto
  const prio  = PRIORIDADES.find(p => p.id === oc.prioridade) || PRIORIDADES[1]

  const mudarStatus = async novoStatus => {
    setSalvando(true)
    try {
      await fetch(`${api}/api/ocorrencias/${oc.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      })
      onAtualizado?.()
    } catch {}
    setSalvando(false)
  }

  return (
    <div className="rounded-2xl overflow-hidden transition-all" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
      {/* Header do card */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpandida(v => !v)}>
        <span className="text-[20px] flex-shrink-0">{tipo.emoji}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[12px] font-semibold truncate" style={{ color:'var(--label)' }}>
              {tipo.label} {oc.numero_pedido ? `· #${oc.numero_pedido}` : ''}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
              style={{ background: `${prio.cor}18`, color: prio.cor }}>
              {prio.label}
            </span>
          </div>
          <p className="text-[11px] truncate" style={{ color:'var(--label-3)' }}>{oc.descricao}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full"
            style={{ background: st.bg, color: st.cor }}>
            {st.label}
          </span>
          <span className="text-[10px]" style={{ color:'var(--label-4)' }}>
            {fmtData(oc.criado_em)}
          </span>
          <svg className={`w-3.5 h-3.5 transition-transform ${expandida ? 'rotate-180' : ''}`}
            style={{ color:'var(--label-4)' }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* Detalhe expandido */}
      {expandida && (
        <div className="px-4 pb-4 border-t border-[var(--sep)]">
          <div className="pt-3 space-y-2 mb-4">
            {oc.telefone && (
              <div>
                <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color:'var(--label-4)' }}>Telefone</span>
                <p className="text-[12px]" style={{ color:'var(--label)' }}>{oc.telefone}</p>
              </div>
            )}
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color:'var(--label-4)' }}>Descrição completa</span>
              <p className="text-[12px] leading-relaxed mt-1" style={{ color:'var(--label-2)' }}>{oc.descricao}</p>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color:'var(--label-4)' }}>Criada em</span>
              <p className="text-[12px]" style={{ color:'var(--label)' }}>
                {fmtData(oc.criado_em)} às {fmtHora(oc.criado_em)}
              </p>
            </div>
          </div>

          {/* Botões de status */}
          <div>
            <p className="text-[9px] uppercase tracking-wider font-bold mb-2" style={{ color:'var(--label-4)' }}>Mudar status</p>
            <div className="flex gap-1.5 flex-wrap">
              {Object.entries(STATUS_CFG).map(([key, s]) => (
                <button key={key} onClick={() => mudarStatus(key)} disabled={oc.status === key || salvando}
                  className="px-3 py-1 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-40"
                  style={{
                    background: oc.status === key ? s.bg      : 'var(--fill)',
                    color:      oc.status === key ? s.cor     : 'var(--label-3)',
                    border:     oc.status === key ? `1px solid ${s.cor}50` : '1px solid var(--sep)',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function PageOcorrencias({ api: apiProp }) {
  const api = apiProp || BASE
  const [ocorrencias, setOcorrencias] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modalNova,   setModalNova]   = useState(false)
  const [filtroTipo,  setFiltroTipo]  = useState('todos')
  const [filtroSt,    setFiltroSt]    = useState('todos')
  const [busca,       setBusca]       = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroTipo !== 'todos') params.set('tipo', filtroTipo)
      if (filtroSt   !== 'todos') params.set('status', filtroSt)
      const r = await fetch(`${api}/api/ocorrencias?${params}`)
      if (r.ok) { const d = await r.json(); setOcorrencias(d.ocorrencias || []) }
    } catch {}
    setLoading(false)
  }, [api, filtroTipo, filtroSt])

  useEffect(() => { carregar() }, [carregar])

  const filtradas = ocorrencias.filter(oc =>
    !busca || (oc.descricao || '').toLowerCase().includes(busca.toLowerCase()) ||
    (oc.telefone || '').includes(busca) ||
    (oc.numero_pedido || '').includes(busca)
  )

  const contadores = {
    aberto:     ocorrencias.filter(o => o.status === 'aberto').length,
    em_analise: ocorrencias.filter(o => o.status === 'em_analise').length,
    resolvido:  ocorrencias.filter(o => o.status === 'resolvido').length,
    total:      ocorrencias.length,
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background:'var(--bg)' }}>

      {/* Header */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color:'var(--label)' }}>Ocorrências</h1>
            <p className="text-[12px] mt-0.5" style={{ color:'var(--label-3)' }}>
              Registro e acompanhamento de problemas e solicitações
            </p>
          </div>
          <button onClick={() => setModalNova(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-[12px] transition-opacity hover:opacity-90"
            style={{ background:'var(--accent)', color:'#000' }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nova ocorrência
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label:'Total',      value: contadores.total,      cor:'var(--label)' },
            { label:'Em aberto',  value: contadores.aberto,     cor:'#f59e0b'      },
            { label:'Em análise', value: contadores.em_analise, cor:'#4a9fff'      },
            { label:'Resolvidas', value: contadores.resolvido,  cor:'#22c55e'      },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-3 text-center" style={{ background:'var(--bg)', border:'1px solid var(--sep)' }}>
              <p className="text-[22px] font-bold" style={{ color: k.cor }}>{k.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color:'var(--label-4)' }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl" style={{ background:'var(--bg)', border:'1px solid var(--sep)' }}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color:'var(--label-4)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por descrição, telefone ou pedido..."
              className="flex-1 bg-transparent text-[12px] outline-none"
              style={{ color:'var(--label)' }} />
          </div>

          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            className="px-3 py-2 rounded-xl text-[11px] outline-none"
            style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label-2)' }}>
            <option value="todos">Todos os tipos</option>
            {TIPOS.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
          </select>

          <select value={filtroSt} onChange={e => setFiltroSt(e.target.value)}
            className="px-3 py-2 rounded-xl text-[11px] outline-none"
            style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label-2)' }}>
            <option value="todos">Todos status</option>
            {Object.entries(STATUS_CFG).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
          </select>

          <button onClick={carregar}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--bg-3)]"
            style={{ background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-3)' }}>
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-.96-7.3"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading
          ? <div className="flex items-center justify-center h-32 text-[12px]" style={{ color:'var(--label-4)' }}>
              Carregando...
            </div>
          : filtradas.length === 0
            ? <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span style={{ fontSize:36, opacity:.2 }}>📋</span>
                <p className="text-[13px]" style={{ color:'var(--label-4)' }}>
                  {busca || filtroTipo !== 'todos' || filtroSt !== 'todos' ? 'Nenhuma ocorrência encontrada' : 'Nenhuma ocorrência registrada ainda'}
                </p>
                {!busca && filtroTipo === 'todos' && filtroSt === 'todos' && (
                  <button onClick={() => setModalNova(true)}
                    className="text-[12px] font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-90"
                    style={{ background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent)' }}>
                    Criar primeira ocorrência
                  </button>
                )}
              </div>
            : <div className="space-y-2.5">
                {filtradas.map(oc => (
                  <OcorrenciaCard key={oc.id} oc={oc} api={api} onAtualizado={carregar} />
                ))}
              </div>
        }
      </div>

      {modalNova && (
        <ModalNova api={api} onSalvo={carregar} onClose={() => setModalNova(false)} />
      )}
    </div>
  )
}
