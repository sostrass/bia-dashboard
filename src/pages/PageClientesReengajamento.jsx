import { useState, useEffect, useCallback, useRef } from 'react'
import { Send, Search, X, RefreshCw, Users, ShoppingBag, Phone, Settings, Tag, CheckCircle, XCircle } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtR   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmtN   = n => Number(n||0).toLocaleString('pt-BR')

const SEGMENTOS = [
  { id:'15d',  label:'15 dias',  dias:15,  cor:'text-amber-400',   bg:'bg-amber-500/10',   border:'border-amber-500/20'  },
  { id:'30d',  label:'30 dias',  dias:30,  cor:'text-orange-400',  bg:'bg-orange-500/10',  border:'border-orange-500/20' },
  { id:'60d',  label:'60 dias',  dias:60,  cor:'text-red-400',     bg:'bg-red-500/10',     border:'border-red-500/20'    },
  { id:'90d',  label:'90 dias',  dias:90,  cor:'text-rose-400',    bg:'bg-rose-500/10',    border:'border-rose-500/20'   },
  { id:'120d', label:'120+ dias',dias:120, cor:'text-violet-400',  bg:'bg-violet-500/10',  border:'border-violet-500/20' },
]

const STATUS_COR = {
  enviado:  'text-emerald-400 bg-emerald-500/10',
  erro:     'text-red-400    bg-red-500/10',
  ignorado: 'text-gray-400   bg-gray-500/10',
}

// ── Card de KPI ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, cor = 'text-[var(--accent)]' }) {
  return (
    <div className="rounded-2xl bg-[var(--bg-2)] border border-[var(--sep)] p-4 flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--label-4)]">{label}</p>
      <p className={`text-[28px] font-bold leading-none ${cor}`}>{value}</p>
      {sub && <p className="text-[11px] text-[var(--label-4)]">{sub}</p>}
    </div>
  )
}

// ── Drawer de cliente ─────────────────────────────────────────────────────────
function DrawerCliente({ cliente, api, onClose, onDisparar }) {
  const [disparando, setDisparando] = useState(false)
  const [resultado,  setResultado]  = useState(null)

  const disparar = async () => {
    setDisparando(true); setResultado(null)
    try {
      const r = await fetch(`${api}/api/reengajamento/disparar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: cliente.telefone, diasInativo: cliente.diasInativo })
      })
      const d = await r.json()
      setResultado(d)
      onDisparar?.()
    } catch(e) { setResultado({ status: 'erro', erro: e.message }) }
    setDisparando(false)
  }

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />
      <div className="fixed top-0 right-0 bottom-0 w-96 z-50 bg-[var(--bg-2)] border-l border-[var(--sep)] flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--sep)]">
          <div className="flex-1">
            <p className="text-[15px] font-bold text-[var(--label)]">{cliente.nome || '—'}</p>
            <p className="text-[11px] text-[var(--label-4)]">{cliente.telefone}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg border border-[var(--sep)] flex items-center justify-center hover:bg-[var(--bg-3)]">
            <X size={14}className="text-[var(--label-3)]"/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Info básica */}
          <div className="rounded-xl bg-[var(--bg)] border border-[var(--sep)] p-4 space-y-3">
            {[
              { label: 'Dias inativo',     value: `${cliente.diasInativo} dias` },
              { label: 'Último pedido',    value: cliente.ultimoPedido ? new Date(cliente.ultimoPedido).toLocaleDateString('pt-BR') : '—' },
              { label: 'Último produto',   value: cliente.ultimoProduto || '—' },
              { label: 'Valor do pedido',  value: fmtR(cliente.ultimoTotal) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] uppercase tracking-widest text-[var(--label-4)] mb-0.5">{label}</p>
                <p className="text-[13px] font-medium text-[var(--label)]">{value}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          {cliente.tags?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--label-4)] mb-2">Interesses detectados</p>
              <div className="flex flex-wrap gap-1.5">
                {cliente.tags.map(t => (
                  <span key={t} className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--accent-dim)] text-[var(--accent)] font-medium border border-[var(--accent)]/20">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resultado do disparo */}
          {resultado && (
            <div className={`rounded-xl p-4 border ${resultado.status === 'enviado' ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-red-500/8 border-red-500/20'}`}>
              <p className={`text-[12px] font-semibold mb-1 ${resultado.status === 'enviado' ? 'text-emerald-400' : 'text-red-400'}`}>
                {resultado.status === 'enviado' ? '✅ Mensagem enviada!' : '❌ Erro no envio'}
              </p>
              {resultado.mensagem && (
                <p className="text-[11px] text-[var(--label-3)] leading-relaxed mt-2 whitespace-pre-wrap">{resultado.mensagem}</p>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[var(--sep)]">
          <button onClick={disparar} disabled={disparando}
            className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold text-[13px] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {disparando
              ? <><RefreshCw size={16}className="animate-spin animate-spin"/> Enviando...</>
              : <><Send size={16}className=""/> Enviar reengajamento</>
            }
          </button>
        </div>
      </div>
    </>
  )
}

// ── Aba: Lista de clientes inativos ───────────────────────────────────────────
function AbaClientes({ api }) {
  const [segmento,  setSegmento]  = useState('30d')
  const [clientes,  setClientes]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selecionado, setSel]     = useState(null)
  const [disparandoLote, setLote] = useState(false)
  const [busca, setBusca]         = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/reengajamento/clientes?segmento=${segmento}`)
      if (r.ok) { const d = await r.json(); setClientes(d.clientes || []) }
    } catch {}
    setLoading(false)
  }, [api, segmento])

  useEffect(() => { carregar() }, [carregar])

  const dispararLote = async () => {
    if (!confirm(`Enviar reengajamento para TODOS os clientes do segmento ${segmento}?`)) return
    setLote(true)
    try {
      const r = await fetch(`${api}/api/reengajamento/disparar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmento, limite: 50 })
      })
      const d = await r.json()
      alert(`✅ ${d.enviados} mensagens enviadas, ${d.erros} erros`)
      carregar()
    } catch(e) { alert('Erro: ' + e.message) }
    setLote(false)
  }

  const seg = SEGMENTOS.find(s => s.id === segmento)
  const filtrados = clientes.filter(c => !busca || (c.nome||'').toLowerCase().includes(busca.toLowerCase()) || c.telefone.includes(busca))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Seletor de segmento */}
      <div className="flex gap-2 px-5 py-3 border-b border-[var(--sep)] flex-wrap">
        {SEGMENTOS.map(s => (
          <button key={s.id} onClick={() => setSegmento(s.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all ${
              segmento === s.id ? `${s.bg} ${s.cor} ${s.border}` : 'border-[var(--sep)] text-[var(--label-4)] hover:bg-[var(--bg-3)]'
            }`}>
            <span className={`w-2 h-2 rounded-full ${segmento===s.id ? s.cor.replace('text-','bg-') : 'bg-[var(--sep)]'}`} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Barra de ação */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--sep)]">
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--sep)] focus-within:border-[var(--accent)]">
          <Search size={14}className="text-[var(--label-4)]"/>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente..."
            className="flex-1 bg-transparent text-[12px] text-[var(--label)] outline-none placeholder:text-[var(--label-4)]"/>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg ${seg?.bg} ${seg?.cor}`}>
          {filtrados.length} clientes
        </span>
        <button onClick={dispararLote} disabled={disparandoLote || !filtrados.length}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-black text-[11px] font-bold hover:opacity-90 disabled:opacity-40 transition-opacity">
          {disparandoLote
            ? <RefreshCw size={14}className="animate-spin animate-spin"/>
            : <Send size={14}className=""/>
          }
          Disparar lote
        </button>
        <button onClick={carregar} className="w-8 h-8 rounded-xl border border-[var(--sep)] flex items-center justify-center hover:bg-[var(--bg-3)]">
          <RefreshCw size={14}className="text-[var(--label-3)]"/>
        </button>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-y-auto">
        {loading
          ? <div className="flex items-center justify-center h-32 text-[var(--label-4)] text-[12px]">Buscando no Bling...</div>
          : filtrados.length === 0
            ? <div className="flex flex-col items-center justify-center h-32 gap-2">
                <Settings size={14}className="text-[var(--label-4)] opacity-30"/>
                <p className="text-[12px] text-[var(--label-4)]">Nenhum cliente inativo neste período</p>
              </div>
            : <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--sep)] bg-[var(--bg-3)]">
                    {['Cliente','Telefone','Dias inativo','Último produto','Tags',''].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-[var(--label-4)] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((c, i) => (
                    <tr key={i} onClick={() => setSel(c)}
                      className="border-b border-[var(--sep)] hover:bg-[var(--bg-3)] cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--label)]">{c.nome || '—'}</td>
                      <td className="px-4 py-3 text-[var(--label-3)] font-mono text-[11px]">{c.telefone}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-[13px] ${seg?.cor}`}>{c.diasInativo}d</span>
                      </td>
                      <td className="px-4 py-3 text-[var(--label-3)] max-w-[160px] truncate">{c.ultimoProduto || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {(c.tags || []).slice(0,2).map(t => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--accent-dim)] text-[var(--accent)]">{t}</span>
                          ))}
                          {(c.tags || []).length > 2 && <span className="text-[9px] text-[var(--label-4)]">+{c.tags.length-2}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={e => { e.stopPropagation(); setSel(c) }}
                          className="px-3 py-1 rounded-lg text-[10px] font-semibold bg-[var(--accent)] text-black hover:opacity-80">
                          Enviar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        }
      </div>

      {selecionado && (
        <DrawerCliente
          cliente={selecionado}
          api={api}
          onClose={() => setSel(null)}
          onDisparar={carregar}
        />
      )}
    </div>
  )
}

// ── Aba: Avise-me (produtos aguardando estoque) ───────────────────────────────
function AbaAviseme({ api }) {
  const [produtos,   setProdutos]  = useState([])
  const [loading,    setLoading]   = useState(true)
  const [notifId,    setNotifId]   = useState(null)
  const [notifando,  setNotifando] = useState(false)

  useEffect(() => {
    fetch(`${api}/api/reengajamento/avise-me`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setProdutos(d?.produtos || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [api])

  const notificar = async (prod) => {
    setNotifId(prod.produto_id); setNotifando(true)
    try {
      const r = await fetch(`${api}/api/reengajamento/avise-me/notificar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_id: prod.produto_id, produto_nome: prod.produto_nome })
      })
      const d = await r.json()
      alert(`✅ ${d.enviados} clientes notificados sobre "${prod.produto_nome}"`)
      setProdutos(p => p.filter(x => x.produto_id !== prod.produto_id))
    } catch(e) { alert('Erro: ' + e.message) }
    setNotifId(null); setNotifando(false)
  }

  return (
    <div className="flex-1 overflow-y-auto p-5">
      {loading
        ? <div className="flex items-center justify-center h-32 text-[var(--label-4)] text-[12px]">Carregando...</div>
        : produtos.length === 0
          ? <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ShoppingBag size={14}className="text-[var(--label-4)] opacity-20"/>
              <p className="text-[13px] text-[var(--label-4)]">Nenhum produto na fila de avise-me</p>
            </div>
          : <div className="space-y-3">
              {produtos.map((p, i) => (
                <div key={i} className="rounded-2xl bg-[var(--bg-2)] border border-[var(--sep)] p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--label)] mb-1">{p.produto_nome}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-amber-400 font-medium">{p.aguardando} cliente{p.aguardando>1?'s':''} aguardando</span>
                      {p.notificados > 0 && <span className="text-[10px] text-[var(--label-4)]">· {p.notificados} já notificados</span>}
                    </div>
                    <p className="text-[10px] text-[var(--label-4)] mt-0.5 truncate">
                      {(p.telefones || []).slice(0,3).join(' · ')}{(p.telefones||[]).length > 3 ? ` +${p.telefones.length-3}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => notificar(p)}
                    disabled={notifando && notifId === p.produto_id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/20 disabled:opacity-50 transition-colors whitespace-nowrap">
                    {notifando && notifId === p.produto_id
                      ? <RefreshCw size={14}className="animate-spin animate-spin"/>
                      : <Phone size={14}className=""/>
                    }
                    Notificar clientes
                  </button>
                </div>
              ))}
            </div>
      }
    </div>
  )
}

// ── Aba: Histórico de disparos ────────────────────────────────────────────────
function AbaHistorico({ api }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${api}/api/reengajamento/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [api])

  const t = data?.totais || {}

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Total enviados"    value={fmtN(t.enviados)}  cor="text-emerald-400" />
        <KpiCard label="Hoje"              value={fmtN(t.hoje)}      cor="text-blue-400" />
        <KpiCard label="Erros"             value={fmtN(t.erros)}     cor="text-red-400" />
      </div>

      {/* Por segmento */}
      {data?.porSegmento?.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--label-4)] mb-3">Por segmento (30 dias)</p>
          <div className="space-y-2">
            {data.porSegmento.map((s, i) => {
              const seg = SEGMENTOS.find(x => x.id === s.segmento) || SEGMENTOS[1]
              return (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-[var(--bg-2)] border border-[var(--sep)] p-3">
                  <span className={`text-[11px] font-bold w-14 ${seg.cor}`}>{s.segmento}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] text-[var(--label-4)] mb-1">
                      <span>{s.enviados} enviados</span>
                      <span>{s.erros} erros</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--sep)] overflow-hidden">
                      <div className={`h-full rounded-full ${seg.cor.replace('text-','bg-')}`}
                        style={{ width: `${s.total > 0 ? (s.enviados/s.total)*100 : 0}%` }} />
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--label)]">{s.total}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Últimos disparos */}
      {data?.recentes?.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--label-4)] mb-3">Últimos disparos</p>
          <div className="rounded-2xl bg-[var(--bg-2)] border border-[var(--sep)] overflow-hidden">
            {data.recentes.slice(0, 15).map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--sep)] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[var(--label)] truncate">{r.nome_cliente || r.telefone}</p>
                  <p className="text-[10px] text-[var(--label-4)]">
                    {r.segmento} · {r.dias_inativo}d inativo
                    {r.tags?.length ? ` · ${r.tags.slice(0,2).join(', ')}` : ''}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COR[r.status] || STATUS_COR.ignorado}`}>
                  {r.status}
                </span>
                <span className="text-[10px] text-[var(--label-4)] whitespace-nowrap">
                  {new Date(r.criado_em).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Aba: Configuração de segmentos ────────────────────────────────────────────
function AbaConfig({ api }) {
  const [configs,  setConfigs]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [salvando, setSalvando] = useState(null)

  const carregar = () => {
    fetch(`${api}/api/reengajamento/config`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setConfigs(d?.config || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [api])

  const salvar = async (segmento, campo, valor) => {
    setSalvando(segmento)
    try {
      await fetch(`${api}/api/reengajamento/config/${segmento}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [campo]: valor })
      })
      setConfigs(c => c.map(x => x.segmento === segmento ? { ...x, [campo]: valor } : x))
    } catch {}
    setSalvando(null)
  }

  if (loading) return <div className="flex items-center justify-center h-32 text-[var(--label-4)] text-[12px]">Carregando...</div>

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      <div className="rounded-xl bg-blue-500/8 border border-blue-500/20 p-3.5 text-[11px] text-blue-400 leading-relaxed">
        💡 Os disparos automáticos rodam todo dia às 9h (horário de Brasília). Configure cada segmento abaixo. A mensagem personalizada usa IA (Claude) — deixe em branco para geração automática.
      </div>

      {configs.map(cfg => {
        const seg = SEGMENTOS.find(s => s.id === cfg.segmento) || SEGMENTOS[1]
        return (
          <div key={cfg.segmento} className="rounded-2xl bg-[var(--bg-2)] border border-[var(--sep)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`text-[13px] font-bold ${seg.cor}`}>{seg.label}</span>
                <span className="text-[11px] text-[var(--label-4)]">≥ {cfg.dias_inatividade} dias sem comprar</span>
              </div>
              {/* Toggle ativo */}
              <button onClick={() => salvar(cfg.segmento, 'ativo', !cfg.ativo)}
                className={`w-10 h-5.5 rounded-full relative transition-colors ${cfg.ativo ? 'bg-emerald-500' : 'bg-[var(--sep)]'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${cfg.ativo ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--label-4)] block mb-1.5">
                  Intervalo mínimo entre envios (dias)
                </label>
                <input
                  type="number" min="1" max="365"
                  defaultValue={cfg.intervalo_dias}
                  onBlur={e => salvar(cfg.segmento, 'intervalo_dias', parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--sep)] text-[12px] text-[var(--label)] outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--label-4)] block mb-1.5">
                  Mensagem personalizada (deixe vazio para usar IA)
                </label>
                <textarea
                  rows={3}
                  defaultValue={cfg.mensagem_custom || ''}
                  placeholder="Ex: Oi {nome}! Faz {dias} dias que não compramos juntos..."
                  onBlur={e => salvar(cfg.segmento, 'mensagem_custom', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--sep)] text-[12px] text-[var(--label)] outline-none focus:border-[var(--accent)] resize-none transition-colors placeholder:text-[var(--label-4)]"
                />
              </div>
            </div>

            {salvando === cfg.segmento && (
              <p className="text-[10px] text-[var(--accent)] mt-2">Salvando...</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PageClientesReengajamento({ api }) {
  const [aba, setAba] = useState('clientes')

  const ABAS = [
    { id:'clientes',  label:'Clientes inativos' },
    { id:'aviseme',   label:'Avise-me'           },
    { id:'historico', label:'Histórico'          },
    { id:'config',    label:'Configuração'       },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-5 pb-0 flex-shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-[20px] font-bold text-[var(--label)]">Reengajamento de Clientes</h1>
            <p className="text-[12px] text-[var(--label-4)] mt-0.5">
              Monitoramento de inatividade · Avise-me · Disparos segmentados por IA
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--sep)]">
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={`px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-all ${
                aba === a.id
                  ? 'text-[var(--accent)] border-[var(--accent)]'
                  : 'text-[var(--label-4)] border-transparent hover:text-[var(--label-3)]'
              }`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo das abas */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {aba === 'clientes'  && <AbaClientes  api={api} />}
        {aba === 'aviseme'   && <AbaAviseme   api={api} />}
        {aba === 'historico' && <AbaHistorico api={api} />}
        {aba === 'config'    && <AbaConfig    api={api} />}
      </div>
    </div>
  )
}
