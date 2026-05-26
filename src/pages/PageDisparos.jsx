import { useState, useEffect, useCallback } from 'react'

const BASE = import.meta.env.VITE_API_URL || ''

const GATILHO_META = {
  pagamento_aprovado: { label:'Pagamento Aprovado', cor:'#4a9fff', emoji:'✅' },
  pedido_enviado:     { label:'Pedido Enviado',     cor:'#a78bfa', emoji:'🚚' },
  pedido_entregue:    { label:'Pedido Entregue',    cor:'#22c55e', emoji:'📦' },
  pedido_criado:      { label:'Pedido Criado',      cor:'#00d4aa', emoji:'🛒' },
  nfe_emitida:        { label:'NF-e Emitida',       cor:'#f59e0b', emoji:'📄' },
  avise_me:           { label:'Avise-me',           cor:'#fb923c', emoji:'🔔' },
  em_separacao:       { label:'Em Separação',       cor:'#8b5cf6', emoji:'📋' },
  produto_embalado:   { label:'Produto Embalado',   cor:'#06b6d4', emoji:'📦' },
  boas_vindas:        { label:'Boas-vindas',        cor:'#e879f9', emoji:'👋' },
  avaliar_pedido:     { label:'Avaliação',          cor:'#f87171', emoji:'⭐' },
  nao_entregue:       { label:'Não Entregue',       cor:'#ef4444', emoji:'❌' },
}

const STATUS_META = {
  enviado:    { label:'Enviado',    cor:'#22c55e', bg:'rgba(34,197,94,0.1)'   },
  erro:       { label:'Erro',       cor:'#ef4444', bg:'rgba(239,68,68,0.1)'   },
  ignorado:   { label:'Ignorado',   cor:'#6b7280', bg:'rgba(107,114,128,0.1)' },
  aguardando: { label:'Aguardando', cor:'#f59e0b', bg:'rgba(245,158,11,0.1)'  },
}

const PERIODOS = [
  { id:'1d',  label:'Hoje'    },
  { id:'7d',  label:'7 dias'  },
  { id:'30d', label:'30 dias' },
  { id:'90d', label:'90 dias' },
]

// ── Sparkline SVG simples ──────────────────────────────────────────────────────
function Sparkline({ dados = [], cor = '#00d4aa' }) {
  if (!dados.length) return null
  const vals = dados.map(d => parseInt(d.enviados) || 0)
  const max  = Math.max(...vals, 1)
  const w = 80, h = 28, pad = 2
  const pts = vals.map((v, i) => {
    const x = pad + (i / Math.max(vals.length - 1, 1)) * (w - pad * 2)
    const y = h - pad - ((v / max) * (h - pad * 2))
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={pts}
        fill="none"
        stroke={cor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Card de métrica ────────────────────────────────────────────────────────────
function MetricCard({ label, valor, sub, cor, trend, sparkData }) {
  const trendPos = trend > 0
  const trendNeg = trend < 0
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:`${cor}18` }}>
          <span style={{ fontSize:16 }}>
            {label.includes('sucesso') ? '✅' : label.includes('cliente') ? '👥' : label.includes('24h') ? '⚡' : '📊'}
          </span>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
            background: trendPos ? 'rgba(34,197,94,0.1)' : trendNeg ? 'rgba(239,68,68,0.1)' : 'var(--fill)',
            color:      trendPos ? '#22c55e'             : trendNeg ? '#ef4444'              : 'var(--label-3)',
          }}>
            {trendPos ? '↑' : trendNeg ? '↓' : '—'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-[26px] font-bold leading-none mb-1" style={{ color:'var(--label)' }}>
          {valor?.toLocaleString('pt-BR')}
        </div>
        <div className="text-[11px]" style={{ color:'var(--label-3)' }}>{sub}</div>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color:'var(--label-4)' }}>{label}</div>
        {sparkData && <Sparkline dados={sparkData} cor={cor} />}
      </div>
    </div>
  )
}

// ── Barra de progresso por gatilho ────────────────────────────────────────────
function BarraGatilho({ item, total }) {
  const meta    = GATILHO_META[item.gatilho] || { label: item.gatilho, cor:'#6b7280', emoji:'⚡' }
  const pct     = total > 0 ? Math.round((parseInt(item.total) / total) * 100) : 0
  const taxa    = parseInt(item.total) > 0 ? Math.round((parseInt(item.enviados) / parseInt(item.total)) * 100) : 0
  return (
    <div className="py-2.5 border-b border-[var(--sep)] last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[13px]">{meta.emoji}</span>
          <span className="text-[12px] font-medium" style={{ color:'var(--label)' }}>{meta.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold" style={{
            color:      taxa >= 90 ? '#22c55e' : taxa >= 70 ? '#f59e0b' : '#ef4444',
            background: taxa >= 90 ? 'rgba(34,197,94,0.1)' : taxa >= 70 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
            padding:    '1px 6px', borderRadius:99,
          }}>
            {taxa}%
          </span>
          <span className="text-[11px] font-semibold" style={{ color:'var(--label-2)' }}>{item.total}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'var(--fill)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width:`${pct}%`, background: meta.cor }} />
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function PageDisparos({ api: apiProp }) {
  const api = apiProp || BASE
  const [stats,     setStats]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [periodo,   setPeriodo]   = useState('7d')
  const [filtroSt,  setFiltroSt]  = useState('todos')
  const [filtroGat, setFiltroGat] = useState('todos')
  const [autoRef,   setAutoRef]   = useState(true)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/bling-webhook/stats?periodo=${periodo}`)
      if (r.ok) { const d = await r.json(); setStats(d) }
      else {
        // Fallback: usa o endpoint do dashboard
        const r2 = await fetch(`${api}/api/dashboard/disparos-stats?periodo=${periodo}`)
        if (r2.ok) { const d = await r2.json(); setStats(d) }
      }
    } catch {}
    setLoading(false)
  }, [api, periodo])

  useEffect(() => { setLoading(true); carregar() }, [carregar])

  useEffect(() => {
    if (!autoRef) return
    const t = setInterval(carregar, 30000)
    return () => clearInterval(t)
  }, [carregar, autoRef])

  const t = stats?.totais || {}
  const total = parseInt(t.total) || 0
  const taxaSucesso = total > 0 ? Math.round(((parseInt(t.enviados) || 0) / total) * 100) : 0

  const recentes = (stats?.recentes || []).filter(r => {
    if (filtroSt !== 'todos' && r.status !== filtroSt) return false
    if (filtroGat !== 'todos' && r.gatilho !== filtroGat) return false
    return true
  })

  const gatilhosUsados = [...new Set((stats?.porGatilho || []).map(g => g.gatilho))]

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background:'var(--bg)' }}>

      {/* Header */}
      <div className="px-6 py-4 flex-shrink-0 flex items-center justify-between"
        style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
        <div>
          <h2 className="text-[20px] font-bold" style={{ color:'var(--label)' }}>Disparos</h2>
          <p className="text-[12px] mt-0.5" style={{ color:'var(--label-3)' }}>
            Mensagens transacionais enviadas pelo sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <button onClick={() => setAutoRef(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
            style={{
              background: autoRef ? 'rgba(34,197,94,0.1)' : 'var(--fill)',
              color:      autoRef ? '#22c55e'             : 'var(--label-3)',
              border:     autoRef ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--sep)',
            }}>
            <span style={{ fontSize:14 }}>{autoRef ? '◉' : '○'}</span>
            Auto-refresh
          </button>

          {/* Período */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background:'var(--fill)' }}>
            {PERIODOS.map(p => (
              <button key={p.id} onClick={() => setPeriodo(p.id)}
                className="px-3 py-1 rounded-[8px] text-[11px] font-medium transition-all"
                style={{
                  background: periodo === p.id ? 'var(--bg-2)' : 'transparent',
                  color:      periodo === p.id ? 'var(--label)' : 'var(--label-3)',
                  boxShadow:  periodo === p.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}>
                {p.label}
              </button>
            ))}
          </div>

          <button onClick={() => { setLoading(true); carregar() }}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--bg-3)]"
            style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-.96-7.3"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {loading && !stats && (
          <div className="flex justify-center py-16">
            <svg className="w-5 h-5 animate-spin" style={{ color:'var(--label-3)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          </div>
        )}

        {!stats && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span style={{ fontSize:32 }}>⚡</span>
            <p className="text-[13px]" style={{ color:'var(--label-3)' }}>Nenhum dado de disparos ainda</p>
            <p className="text-[11px]" style={{ color:'var(--label-4)' }}>Os dados aparecerão após o primeiro webhook do Bling</p>
          </div>
        )}

        {stats && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-3">
              <MetricCard
                label="Total de disparos"
                valor={total}
                sub={`últimos ${stats.dias || 7} dias`}
                cor="#00d4aa"
                sparkData={stats.porDia}
              />
              <MetricCard
                label="Enviados com sucesso"
                valor={parseInt(t.enviados) || 0}
                sub={`taxa de ${taxaSucesso}%`}
                cor="#22c55e"
                trend={taxaSucesso >= 90 ? 5 : taxaSucesso >= 70 ? 0 : -5}
              />
              <MetricCard
                label="Clientes alcançados"
                valor={parseInt(t.clientes_unicos) || 0}
                sub="números únicos"
                cor="#4a9fff"
              />
              <MetricCard
                label="Últimas 24h"
                valor={parseInt(t.ultimas_24h) || 0}
                sub={`${parseInt(t.erros) || 0} erros`}
                cor="#a78bfa"
                trend={parseInt(t.erros) > 0 ? -1 : 1}
              />
            </div>

            {/* Taxa de sucesso global */}
            <div className="rounded-2xl p-4" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-semibold" style={{ color:'var(--label)' }}>Taxa de sucesso global</span>
                <span className="text-[22px] font-bold" style={{
                  color: taxaSucesso >= 90 ? '#22c55e' : taxaSucesso >= 70 ? '#f59e0b' : '#ef4444'
                }}>
                  {taxaSucesso}%
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background:'var(--fill)' }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{
                  width: `${taxaSucesso}%`,
                  background: taxaSucesso >= 90 ? '#22c55e' : taxaSucesso >= 70 ? '#f59e0b' : '#ef4444'
                }} />
              </div>
              <div className="flex items-center gap-5 mt-3">
                {[
                  { l:'Enviados',   v: t.enviados,   c:'#22c55e' },
                  { l:'Erros',      v: t.erros,      c:'#ef4444' },
                  { l:'Ignorados',  v: t.ignorados,  c:'#6b7280' },
                  { l:'Aguardando', v: t.aguardando, c:'#f59e0b' },
                ].map(s => (
                  <div key={s.l} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.c }} />
                    <span className="text-[10px]" style={{ color:'var(--label-3)' }}>
                      {s.l}: <strong style={{ color:'var(--label-2)' }}>{parseInt(s.v) || 0}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evolução diária + Por gatilho */}
            <div className="grid grid-cols-2 gap-4">

              {/* Evolução diária */}
              <div className="rounded-2xl p-4" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                <h3 className="text-[13px] font-semibold mb-4" style={{ color:'var(--label)' }}>Evolução diária</h3>
                {!stats.porDia?.length
                  ? <p className="text-[12px] text-center py-4" style={{ color:'var(--label-4)' }}>Sem dados no período</p>
                  : <div className="space-y-1.5">
                      {(() => {
                        const maxDia = Math.max(...stats.porDia.map(d => parseInt(d.total) || 0), 1)
                        return stats.porDia.slice(-7).map((d, i) => {
                          const pct    = Math.round(((parseInt(d.total) || 0) / maxDia) * 100)
                          const errPct = parseInt(d.total) > 0 ? Math.round((parseInt(d.erros) || 0) / parseInt(d.total) * 100) : 0
                          const label  = d.dia ? new Date(d.dia).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }) : `Dia ${i+1}`
                          return (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-[10px] w-12 flex-shrink-0" style={{ color:'var(--label-3)' }}>{label}</span>
                              <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background:'var(--fill)' }}>
                                <div className="h-full rounded-full flex transition-all duration-700" style={{ width:`${pct}%` }}>
                                  <div className="flex-1" style={{ background:'#22c55e' }} />
                                  {errPct > 0 && <div style={{ width:`${errPct}%`, background:'#ef4444', minWidth:4 }} />}
                                </div>
                              </div>
                              <span className="text-[10px] w-8 text-right flex-shrink-0 font-medium" style={{ color:'var(--label-2)' }}>
                                {parseInt(d.total) || 0}
                              </span>
                            </div>
                          )
                        })
                      })()}
                    </div>
                }
              </div>

              {/* Por gatilho */}
              <div className="rounded-2xl p-4" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                <h3 className="text-[13px] font-semibold mb-1" style={{ color:'var(--label)' }}>Por gatilho</h3>
                {!stats.porGatilho?.length
                  ? <p className="text-[12px] text-center py-4" style={{ color:'var(--label-4)' }}>Nenhum disparo no período</p>
                  : stats.porGatilho.map((item, i) => (
                      <BarraGatilho key={i} item={item} total={total} />
                    ))
                }
              </div>
            </div>

            {/* Log de disparos */}
            <div className="rounded-2xl overflow-hidden" style={{ border:'1px solid var(--sep)', background:'var(--bg-2)' }}>

              {/* Header do log */}
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-3)' }}>
                <h3 className="text-[13px] font-semibold" style={{ color:'var(--label)' }}>
                  Log de disparos
                  <span className="ml-2 text-[10px] font-normal px-2 py-0.5 rounded-full"
                    style={{ background:'var(--fill)', color:'var(--label-3)' }}>
                    {recentes.length}
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <select value={filtroSt} onChange={e => setFiltroSt(e.target.value)}
                    className="px-2 py-1.5 rounded-lg text-[11px] outline-none"
                    style={{ background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-2)' }}>
                    <option value="todos">Todos status</option>
                    {Object.entries(STATUS_META).map(([id, m]) => (
                      <option key={id} value={id}>{m.label}</option>
                    ))}
                  </select>
                  <select value={filtroGat} onChange={e => setFiltroGat(e.target.value)}
                    className="px-2 py-1.5 rounded-lg text-[11px] outline-none"
                    style={{ background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-2)' }}>
                    <option value="todos">Todos gatilhos</option>
                    {gatilhosUsados.map(g => (
                      <option key={g} value={g}>
                        {GATILHO_META[g]?.emoji} {GATILHO_META[g]?.label || g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabela */}
              {recentes.length === 0
                ? (
                  <div className="flex flex-col items-center py-12">
                    <span style={{ fontSize:28, opacity:.15 }}>⚡</span>
                    <p className="text-[13px] mt-3" style={{ color:'var(--label-3)' }}>Nenhum disparo encontrado</p>
                  </div>
                ) : (
                  <div>
                    {/* Cabeçalho */}
                    <div className="grid px-4 py-2"
                      style={{ gridTemplateColumns:'1fr 120px 130px 90px 70px', borderBottom:'1px solid var(--sep)', background:'var(--bg-3)' }}>
                      {['Gatilho / Cliente', 'Número', 'Template', 'Status', 'Horário'].map(h => (
                        <span key={h} className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color:'var(--label-4)' }}>{h}</span>
                      ))}
                    </div>

                    {/* Linhas */}
                    {recentes.map((r, i) => {
                      const meta  = GATILHO_META[r.gatilho] || { label: r.gatilho, cor:'#6b7280', emoji:'⚡' }
                      const smeta = STATUS_META[r.status]   || STATUS_META.ignorado
                      const hora  = new Date(r.criado_em).toLocaleTimeString('pt-BR',  { hour:'2-digit', minute:'2-digit' })
                      const data  = new Date(r.criado_em).toLocaleDateString('pt-BR',  { day:'2-digit', month:'2-digit' })
                      const telFmt = (r.telefone || '').replace('55', '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')

                      return (
                        <div key={i} className="grid items-center px-4 py-2.5 transition-colors hover:bg-[var(--bg-3)]"
                          style={{
                            gridTemplateColumns: '1fr 120px 130px 90px 70px',
                            borderBottom: i < recentes.length - 1 ? '1px solid var(--sep)' : 'none',
                            background:   r.status === 'erro' ? 'rgba(239,68,68,0.03)' : 'transparent',
                          }}>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px]">{meta.emoji}</span>
                              <span className="text-[12px] font-medium truncate" style={{ color:'var(--label)' }}>
                                {meta.label}
                              </span>
                              {r.delay_min > 0 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                                  style={{ background:'rgba(245,158,11,0.1)', color:'#f59e0b' }}>
                                  +{r.delay_min}min
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] truncate" style={{ color:'var(--label-3)' }}>
                              {r.nome_cliente || r.telefone}
                              {r.numero_pedido ? ` · #${r.numero_pedido}` : ''}
                            </div>
                            {r.erro_msg && (
                              <div className="text-[9px] truncate" style={{ color:'#ef4444' }}>{r.erro_msg}</div>
                            )}
                          </div>
                          <span className="text-[11px] font-mono truncate" style={{ color:'var(--label-3)' }}>
                            {telFmt}
                          </span>
                          <span className="text-[10px] truncate" style={{ color:'var(--label-3)' }}>
                            {r.template_nome || r.gatilho}
                          </span>
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium"
                              style={{ background: smeta.bg, color: smeta.cor }}>
                              {smeta.label}
                            </span>
                          </div>
                          <span className="text-[10px]" style={{ color:'var(--label-4)' }}>
                            {data} {hora}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              }
            </div>
          </>
        )}
      </div>
    </div>
  )
}
