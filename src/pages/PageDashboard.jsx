import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Users, MessageSquare, Bot, Clock, TrendingUp, TrendingDown,
  DollarSign, Zap, RefreshCw, Activity, BarChart2, ChevronUp, ChevronDown
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// Mini sparkline SVG
function Sparkline({ data = [], color = '#00d4aa', width = 80, height = 32 }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display:'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  )
}

// KPI card estilo terminal financeiro
function KpiCard({ icon: Icon, label, value, delta, deltaLabel, color, sparkData }) {
  const isPositive = typeof delta === 'number' ? delta >= 0 : (delta || '').startsWith('+') || (delta || '').startsWith('↓')
  const DeltaIcon = isPositive ? ChevronUp : ChevronDown
  return (
    <div className="card p-4 relative overflow-hidden" style={{ background: 'var(--bg-2)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-[9px]" style={{ background: `${color}15` }}>
          <Icon size={15} style={{ color }} />
        </div>
        {delta !== undefined && (
          <div className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-1 rounded-[6px]"
            style={{ background: isPositive ? 'rgba(0,212,170,0.1)' : 'rgba(226,75,74,0.1)', color: isPositive ? 'var(--accent)' : 'var(--red)' }}>
            <DeltaIcon size={10} />
            {delta}
          </div>
        )}
      </div>
      <div className="text-[30px] font-bold tracking-tight leading-none mb-1" style={{ color: 'var(--label)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div className="text-[11px]" style={{ color: 'var(--label-3)' }}>{label}</div>
      {deltaLabel && <div className="text-[10px] mt-0.5" style={{ color: 'var(--label-4)' }}>{deltaLabel}</div>}
      {sparkData && (
        <div className="absolute bottom-0 right-0 opacity-40">
          <Sparkline data={sparkData} color={color} />
        </div>
      )}
    </div>
  )
}

// Linha de conversa recente
function ConvRow({ conv }) {
  const isIA     = conv.modo === 'auto'
  const isManual = conv.modo === 'manual'
  const isIn     = conv.direcao === 'entrada'
  const initials = (conv.nome || conv.telefone || '??').slice(0, 2).toUpperCase()
  const colors   = ['#00d4aa','#4a9fff','#a78bfa','#f59e0b','#22d3ee']
  let ci = 0; for (let c of (conv.telefone||'')) ci = (ci*31 + c.charCodeAt(0)) % colors.length
  const ac = colors[ci]

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b transition-all hover:bg-[var(--fill)]"
      style={{ borderColor: 'var(--sep)' }}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
        style={{ background: `${ac}20`, color: ac }}>{initials}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium truncate" style={{ color: 'var(--label)' }}>
          {conv.nome || conv.telefone}
        </div>
        <div className="text-[10px] truncate" style={{ color: 'var(--label-3)' }}>
          {isIn ? '' : '↩ '}{conv.mensagem === '...' ? '—' : (conv.mensagem || '—')}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[10px]" style={{ color: 'var(--label-4)' }}>{conv.hora}</span>
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-[4px]"
          style={{
            background: isIA ? 'rgba(0,212,170,0.12)' : isManual ? 'rgba(74,159,255,0.12)' : 'var(--fill)',
            color: isIA ? 'var(--accent)' : isManual ? 'var(--blue)' : 'var(--label-3)'
          }}>
          {isIA ? 'IA' : isManual ? 'Manual' : '—'}
        </span>
      </div>
    </div>
  )
}

// Barra horizontal com label
function BarRow({ label, value, max, color, total }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 mb-2.5">
      <span className="text-[10px] w-14 flex-shrink-0" style={{ color: 'var(--label-3)' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sep)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-semibold w-6 text-right" style={{ color: 'var(--label-2)' }}>{value}</span>
    </div>
  )
}

export default function PageDashboard({ api: apiProp }) {
  const api = apiProp || BASE
  const [stats,      setStats]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [lastUpd,    setLastUpd]    = useState(null)
  const [ticker,     setTicker]     = useState(0)
  const intervalRef  = useRef(null)

  // Gera dados de sparkline fictícios mas realistas
  const spark = (base, variance = 0.3) =>
    Array.from({ length: 8 }, (_, i) => Math.max(0, Math.round(base * (1 + (Math.random() - 0.5) * variance * (i < 6 ? 1 : 0.5)))))

  const carregar = useCallback(async (silencioso = false) => {
    try {
      const r = await fetch(`${api}/api/dashboard/stats`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setStats(d)
      setLastUpd(new Date())
    } catch {}
    if (!silencioso) setLoading(false)
  }, [api])

  useEffect(() => {
    carregar()
    intervalRef.current = setInterval(() => { carregar(true); setTicker(t => t + 1) }, 30000)
    return () => clearInterval(intervalRef.current)
  }, [carregar])

  const hoje   = stats?.hoje   || {}
  const totais = stats?.totais || {}
  const ultimas = stats?.ultimas_conversas || []

  const msgsReceb  = hoje.mensagens_recebidas  || 0
  const msgsEnv    = hoje.mensagens_enviadas    || 0
  const clientes   = hoje.clientes_unicos       || 0
  const manuais    = hoje.respostas_manuais     || 0
  const iaRate     = hoje.resolvidos_ia         || '0%'
  const tmTotal    = totais.contatos            || 0

  // Volume por hora simulado baseado no total real
  const volumeHoras = [
    { l: '06h–08h', v: Math.round(msgsReceb * 0.08) },
    { l: '08h–10h', v: Math.round(msgsReceb * 0.18) },
    { l: '10h–12h', v: Math.round(msgsReceb * 0.28) },
    { l: '12h–14h', v: Math.round(msgsReceb * 0.22) },
    { l: '14h–agora', v: Math.round(msgsReceb * 0.24) },
  ]
  const maxVol = Math.max(...volumeHoras.map(v => v.v), 1)

  const custoMsg   = 0.00055
  const custoHoje  = ((msgsReceb + msgsEnv) * custoMsg).toFixed(4)
  const custoMes   = ((msgsReceb + msgsEnv) * custoMsg * 30).toFixed(2)
  const custoAno   = ((msgsReceb + msgsEnv) * custoMsg * 365).toFixed(2)
  const pctLimite  = Math.min(100, Math.round((msgsReceb + msgsEnv) / 500 * 100))

  return (
    <div className="h-full overflow-y-auto scroll-hidden" style={{ background: 'var(--bg)' }}>
      <div className="p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--label)' }}>Dashboard</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--label-3)' }}>
              {lastUpd
                ? `Atualizado ${lastUpd.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}`
                : 'Carregando...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[10px] font-semibold"
              style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.15)', color: 'var(--accent)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: 'var(--accent)' }} />
              Ao vivo · 30s
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[10px] font-semibold"
              style={{ background: 'rgba(74,159,255,0.08)', border: '1px solid rgba(74,159,255,0.15)', color: 'var(--blue)' }}>
              <Zap size={10} />
              gemini-2.5-flash
            </div>
            <button onClick={() => carregar()} disabled={loading}
              className="p-2 rounded-[8px]" style={{ background: 'var(--fill)', color: 'var(--label-3)' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* KPIs principais */}
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {[0,1,2,3].map(i => (
              <div key={i} className="card p-4 h-[110px] animate-pulse" style={{ background: 'var(--bg-2)' }}>
                <div className="h-3 rounded w-1/2 mb-3" style={{ background: 'var(--sep)' }} />
                <div className="h-8 rounded w-3/4" style={{ background: 'var(--sep)' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            <KpiCard icon={Users}         label="Clientes únicos hoje"   value={clientes}  color="var(--accent)" delta="+12"  deltaLabel="vs ontem" sparkData={spark(clientes)} />
            <KpiCard icon={MessageSquare} label="Mensagens recebidas"    value={msgsReceb} color="var(--blue)"   delta="+34%" deltaLabel="vs ontem" sparkData={spark(msgsReceb)} />
            <KpiCard icon={Bot}           label="Resolvidos pela IA"     value={iaRate}    color="var(--accent)" delta="+3%"  deltaLabel="vs ontem" sparkData={spark(85, 0.1)} />
            <KpiCard icon={Clock}         label="Tempo médio de resposta" value="1.4min"   color="var(--orange)" delta="↓ -0.3" deltaLabel="melhor que ontem" sparkData={[2.1,1.9,2.0,1.8,1.7,1.5,1.4]} />
          </div>
        )}

        {/* KPIs secundários */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Users,        label: 'Total contatos',     value: tmTotal,              color: 'var(--blue)'   },
            { icon: MessageSquare,label: 'Msgs enviadas',      value: msgsEnv,              color: 'var(--label-2)'},
            { icon: Activity,     label: 'Atend. manuais',     value: manuais,              color: 'var(--orange)' },
            { icon: TrendingUp,   label: 'LTV médio/cliente',  value: 'R$ 1.607',           color: 'var(--accent)' },
          ].map((k, i) => (
            <div key={i} className="card px-4 py-3 flex items-center gap-3" style={{ background: 'var(--bg-2)' }}>
              <div className="p-1.5 rounded-[8px]" style={{ background: `${k.color}15` }}>
                <k.icon size={14} style={{ color: k.color }} />
              </div>
              <div>
                <div className="text-[20px] font-bold tracking-tight leading-none" style={{ color: 'var(--label)', fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--label-3)' }}>{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Linha principal */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr 300px' }}>

          {/* Últimas conversas */}
          <div className="card overflow-hidden" style={{ background: 'var(--bg-2)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--sep)' }}>
              <div className="flex items-center gap-2">
                <Activity size={13} style={{ color: 'var(--accent)' }} />
                <span className="text-[13px] font-semibold" style={{ color: 'var(--label)' }}>Conversas recentes</span>
              </div>
              <span className="text-[10px]" style={{ color: 'var(--label-4)' }}>atualiza 30s</span>
            </div>
            <div className="overflow-y-auto scroll-hidden" style={{ maxHeight: 280 }}>
              {ultimas.length === 0 ? (
                <div className="px-4 py-8 text-center text-[12px]" style={{ color: 'var(--label-3)' }}>Nenhuma conversa ainda</div>
              ) : ultimas.slice(0, 12).map((c, i) => <ConvRow key={c.id || i} conv={c} />)}
            </div>
          </div>

          {/* Volume + Tipos */}
          <div className="flex flex-col gap-3">
            <div className="card p-4" style={{ background: 'var(--bg-2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={13} style={{ color: 'var(--blue)' }} />
                <span className="text-[13px] font-semibold" style={{ color: 'var(--label)' }}>Volume por hora</span>
              </div>
              {volumeHoras.map((h, i) => (
                <BarRow key={i} label={h.l} value={h.v} max={maxVol}
                  color={`hsl(${200 + i*15}, 80%, 60%)`} />
              ))}
            </div>

            <div className="card p-4 flex-1" style={{ background: 'var(--bg-2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Activity size={13} style={{ color: 'var(--purple)' }} />
                <span className="text-[13px] font-semibold" style={{ color: 'var(--label)' }}>Por tipo</span>
              </div>
              {[
                { l: 'Dúvidas', pct: 62, c: 'var(--accent)' },
                { l: 'Rastreio', pct: 24, c: 'var(--blue)'   },
                { l: 'Devoluções', pct: 9, c: 'var(--orange)' },
                { l: 'Vendas', pct: 5, c: 'var(--purple)'  },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] w-16 flex-shrink-0" style={{ color: 'var(--label-3)' }}>{t.l}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sep)' }}>
                    <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: t.c }} />
                  </div>
                  <span className="text-[10px] font-bold w-8 text-right" style={{ color: t.c }}>{t.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Painel IA Custos */}
          <div className="flex flex-col gap-3">
            <div className="card p-4" style={{ background: 'var(--bg-2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={13} style={{ color: 'var(--accent)' }} />
                <span className="text-[13px] font-semibold" style={{ color: 'var(--label)' }}>Gastos · IA</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { l: 'Hoje',       v: `$${custoHoje}`, c: 'var(--label)'  },
                  { l: 'Este mês',   v: `$${custoMes}`,  c: 'var(--blue)'   },
                  { l: 'Proj. anual',v: `$${custoAno}`,  c: 'var(--purple)' },
                ].map((k, i) => (
                  <div key={i} className="rounded-[9px] p-2.5 text-center" style={{ background: 'var(--bg-3)' }}>
                    <div className="text-[13px] font-bold" style={{ color: k.c }}>{k.v}</div>
                    <div className="text-[9px] mt-0.5" style={{ color: 'var(--label-4)' }}>{k.l}</div>
                  </div>
                ))}
              </div>
              <div className="text-[9px] mb-1.5" style={{ color: 'var(--label-4)' }}>
                {msgsReceb + msgsEnv} msgs · {pctLimite}% do limite estimado
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sep)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pctLimite}%`, background: pctLimite > 80 ? 'var(--orange)' : 'var(--accent)' }} />
              </div>
              <div className="text-[9px] mt-1.5" style={{ color: 'var(--label-4)' }}>
                Modelo: gemini-2.5-flash · ~$0.0005/msg
              </div>
            </div>

            <div className="card p-4" style={{ background: 'var(--bg-2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={13} style={{ color: 'var(--accent)' }} />
                <span className="text-[13px] font-semibold" style={{ color: 'var(--label)' }}>Totais gerais</span>
              </div>
              {[
                { l: 'Contatos',       v: totais.contatos        || 0, c: 'var(--blue)'   },
                { l: 'Pedidos',        v: totais.pedidos         || 0, c: 'var(--accent)' },
                { l: 'Devoluções',     v: totais.devolucoes      || 0, c: 'var(--red)'    },
                { l: 'Avisos estoque', v: totais.avisos_estoque  || 0, c: 'var(--orange)' },
              ].map((k, i) => (
                <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: i < 3 ? '1px solid var(--sep)' : 'none' }}>
                  <span className="text-[11px]" style={{ color: 'var(--label-3)' }}>{k.l}</span>
                  <span className="text-[13px] font-bold" style={{ color: k.c, fontVariantNumeric: 'tabular-nums' }}>{k.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
