import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, Users, MessageSquare, Bot, RefreshCw, Zap, Clock, CheckCircle } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

function KPI({ label, value, sub, color = 'var(--accent)', icon: Icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-[10px]" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="text-[28px] font-bold tracking-tight" style={{ color }}>{value}</div>
      <div className="text-[13px] font-semibold mt-1" style={{ color: 'var(--label)' }}>{label}</div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: 'var(--label-3)' }}>{sub}</div>}
    </div>
  )
}

export default function PageDashboard({ api: apiProp }) {
  const api = apiProp || BASE
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  const carregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/stats`)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      setStats(d)
      setLastUpdate(new Date())
    } catch (e) {
      console.error('Erro dashboard:', e.message)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    carregar()
    const i = setInterval(() => carregar(true), 30000)
    return () => clearInterval(i)
  }, [carregar])

  const hoje   = stats?.hoje   || {}
  const totais = stats?.totais || {}
  const ultimas = stats?.ultimas_conversas || []

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--label)' }}>Dashboard</h2>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-3)' }}>
            {lastUpdate ? `Atualizado às ${lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Carregando...'}
          </p>
        </div>
        <button onClick={() => carregar()} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px]"
          style={{ background: 'var(--fill)', color: 'var(--label-2)', border: '1px solid var(--sep)' }}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center py-16 gap-3" style={{ color: 'var(--label-3)' }}>
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-[14px]">Carregando dados...</span>
        </div>
      ) : <>

        {/* KPIs de hoje */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--label-3)' }}>
            Hoje
          </div>
          <div className="grid grid-cols-4 gap-4">
            <KPI icon={Users}         label="Clientes únicos"    value={hoje.clientes_unicos ?? 0}     color="var(--blue)"   sub="conversas ativas hoje" />
            <KPI icon={MessageSquare} label="Msgs recebidas"     value={hoje.mensagens_recebidas ?? 0}  color="var(--label)"  sub="do WhatsApp" />
            <KPI icon={Bot}           label="Resolvidos pela IA" value={hoje.resolvidos_ia ?? '0%'}     color="var(--accent)" sub="sem intervenção humana" />
            <KPI icon={Users}         label="Atend. manuais"     value={hoje.respostas_manuais ?? 0}    color="var(--orange)" sub="com intervenção humana" />
          </div>
        </div>

        {/* Totais gerais */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--label-3)' }}>
            Totais gerais
          </div>
          <div className="grid grid-cols-4 gap-4">
            <KPI icon={Users}        label="Contatos"       value={totais.contatos ?? 0}       color="var(--blue)"   />
            <KPI icon={TrendingUp}   label="Pedidos"        value={totais.pedidos ?? 0}        color="var(--accent)" />
            <KPI icon={CheckCircle}  label="Devoluções"     value={totais.devolucoes ?? 0}     color="var(--red)"    />
            <KPI icon={Zap}          label="Avisos estoque" value={totais.avisos_estoque ?? 0} color="var(--orange)" />
          </div>
        </div>

        {/* Últimas conversas */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--sep)' }}>
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--label)' }}>Últimas conversas</h3>
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--accent)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
              Atualiza a cada 30s
            </div>
          </div>
          {ultimas.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--label-3)' }}>
              Nenhuma conversa ainda hoje
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--sep)' }}>
              {ultimas.slice(0, 15).map((m, i) => (
                <div key={m.id || i} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{ background: m.modo === 'manual' ? 'rgba(10,132,255,0.15)' : 'var(--accent-dim)', color: m.modo === 'manual' ? 'var(--blue)' : 'var(--accent)' }}>
                    {m.modo === 'manual' ? '👤' : '🤖'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium truncate" style={{ color: 'var(--label)' }}>
                        {m.nome || m.telefone}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: m.direcao === 'entrada' ? 'rgba(10,132,255,0.1)' : 'var(--accent-dim)', color: m.direcao === 'entrada' ? 'var(--blue)' : 'var(--accent)' }}>
                        {m.direcao === 'entrada' ? '↓ recebida' : '↑ enviada'}
                      </span>
                    </div>
                    <div className="text-[12px] truncate mt-0.5" style={{ color: 'var(--label-3)' }}>
                      {m.mensagem === '...' ? '(sem prévia)' : m.mensagem}
                    </div>
                  </div>
                  <div className="text-[11px] flex-shrink-0 flex items-center gap-1" style={{ color: 'var(--label-3)' }}>
                    <Clock size={10} />
                    {m.hora}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>}
    </div>
  )
}
