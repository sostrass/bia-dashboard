import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, ShoppingBag,
  RotateCcw, Zap, MessageSquare, Star, Activity
} from 'lucide-react'

const HOURLY = [
  { h: '06', m: 9, p: 2, d: 1 }, { h: '07', m: 14, p: 3, d: 1 },
  { h: '08', m: 22, p: 5, d: 2 }, { h: '09', m: 31, p: 7, d: 3 },
  { h: '10', m: 28, p: 6, d: 2 }, { h: '11', m: 35, p: 9, d: 4 },
  { h: '12', m: 19, p: 4, d: 1 }, { h: '13', m: 24, p: 5, d: 2 },
  { h: '14', m: 38, p: 11, d: 5 }, { h: '15', m: 42, p: 13, d: 3 },
  { h: '16', m: 37, p: 8, d: 4 }, { h: '17', m: 29, p: 6, d: 2 },
  { h: '18', m: 18, p: 4, d: 1 },
]

const WEEK = [
  { d: 'Seg', v: 43 }, { d: 'Ter', v: 51 }, { d: 'Qua', v: 47 },
  { d: 'Qui', v: 58 }, { d: 'Sex', v: 71 }, { d: 'Sáb', v: 82 }, { d: 'Dom', v: 38 },
]

const CATS = [
  { n: 'Bijuterias', v: 38, c: '#7c5cfc' },
  { n: 'Linhas/Fios', v: 24, c: '#00e5b4' },
  { n: 'Botões', v: 18, c: '#38c8ff' },
  { n: 'Fitas', v: 12, c: '#ff4d6d' },
  { n: 'Miçangas', v: 8, c: '#ffb547' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/50 p-3 text-xs shadow-2xl"
      style={{ background: 'rgba(10,12,20,0.97)', backdropFilter: 'blur(20px)' }}>
      <p className="text-muted-foreground font-semibold mb-2 uppercase tracking-wider text-[10px]">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function KPICard({ icon: Icon, label, value, sub, trend, color, sparkColor }) {
  const isPositive = trend > 0
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 cursor-default group',
      'hover:-translate-y-1 hover:shadow-2xl'
    )}
      style={{
        background: `linear-gradient(135deg, ${sparkColor}08 0%, rgba(10,12,20,0.9) 100%)`,
        border: `1px solid ${sparkColor}20`,
        boxShadow: `0 0 40px ${sparkColor}08`,
      }}>

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-xl" style={{ background: `${sparkColor}15` }}>
          <Icon size={16} style={{ color: sparkColor }} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full',
            isPositive ? 'text-emerald-400' : 'text-rose-400'
          )}
            style={{ background: isPositive ? 'rgba(52,211,153,0.1)' : 'rgba(255,77,109,0.1)' }}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div className="font-display font-black text-4xl tracking-tighter leading-none mb-1"
        style={{ color: sparkColor }}>
        {value}
      </div>
      <div className="font-semibold text-sm text-white/80 mb-0.5">{label}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>

      {/* Decorative glow */}
      <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-20"
        style={{ background: sparkColor }} />
    </div>
  )
}

export default function PageDashboard({ api }) {
  const [liveN, setLiveN] = useState(247)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const r = await fetch(`${api}/api/dashboard/stats`)
        if (r.ok) {
          const d = await r.json()
          setStats(d.hoje)
          if (d.hoje?.clientes_unicos) setLiveN(d.hoje.clientes_unicos)
        }
      } catch {}
    }
    fetchStats()
    const i = setInterval(() => {
      setLiveN(n => n + Math.floor(Math.random() * 2))
      fetchStats()
    }, 10000)
    return () => clearInterval(i)
  }, [])

  const kpis = [
    { icon: Users, label: 'Clientes atendidos', value: liveN, sub: 'Hoje — em tempo real', trend: 12, sparkColor: '#b8ff57' },
    { icon: Activity, label: 'Resolvidos pela IA', value: '98%', sub: `${liveN - 5} de ${liveN} casos`, trend: 3, sparkColor: '#00e5b4' },
    { icon: ShoppingBag, label: 'Pedidos gerados', value: stats?.por_tipo?.pedido || 82, sub: 'R$ 14.380 em vendas', trend: 8, sparkColor: '#38c8ff' },
    { icon: RotateCcw, label: 'Devoluções', value: stats?.por_tipo?.devolucao || 12, sub: 'Todas processadas', trend: -2, sparkColor: '#ffb547' },
    { icon: Zap, label: 'Tempo médio', value: '1m38s', sub: 'Por atendimento', trend: -15, sparkColor: '#7c5cfc' },
  ]

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(184,255,87,0.1)', border: '1px solid rgba(184,255,87,0.2)', color: '#b8ff57' }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#b8ff57' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#b8ff57' }} />
          </span>
          LIVE — Atualizando
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-5 gap-4">
        {kpis.map((k, i) => <KPICard key={i} {...k} />)}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-4">

        {/* Area Chart */}
        <div className="col-span-7 rounded-2xl border border-border/50 p-5"
          style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-base text-white">Volume de Atendimentos</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Mensagens por hora — hoje</p>
            </div>
            <div className="flex gap-4">
              {[['#b8ff57', 'Mensagens'], ['#00e5b4', 'Pedidos'], ['#ff4d6d', 'Devoluções']].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                  <span className="text-[11px] text-muted-foreground">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HOURLY} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  {[['ga', '#b8ff57'], ['gb', '#00e5b4'], ['gc', '#ff4d6d']].map(([id, c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="h" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="m" name="Msgs" stroke="#b8ff57" strokeWidth={2} fill="url(#ga)" dot={false} />
                <Area type="monotone" dataKey="p" name="Pedidos" stroke="#00e5b4" strokeWidth={2} fill="url(#gb)" dot={false} />
                <Area type="monotone" dataKey="d" name="Devol." stroke="#ff4d6d" strokeWidth={2} fill="url(#gc)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right side charts */}
        <div className="col-span-5 grid grid-rows-2 gap-4">
          {/* Bar */}
          <div className="rounded-2xl border border-border/50 p-4"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3 className="font-display font-bold text-sm text-white mb-0.5">Pedidos — Semana</h3>
            <p className="text-[11px] text-muted-foreground mb-3">Volume diário</p>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEK} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="d" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="v" name="Pedidos" fill="#7c5cfc" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie + Satisfaction */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border/50 p-4"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="font-display font-bold text-sm text-white mb-3">Categorias</h3>
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={CATS} cx="50%" cy="50%" innerRadius={24} outerRadius={36} paddingAngle={3} dataKey="v">
                        {CATS.map((c, i) => <Cell key={i} fill={c.c} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5">
                  {CATS.map(c => (
                    <div key={c.n} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.c }} />
                      <span className="text-[9px] text-muted-foreground truncate">{c.n}</span>
                      <span className="text-[9px] font-bold text-white ml-auto">{c.v}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 p-4"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="font-display font-bold text-sm text-white mb-2">Satisfação</h3>
              <div className="flex items-end gap-2 mb-3">
                <span className="font-display font-black text-3xl" style={{ color: '#ffb547' }}>4.8</span>
                <div className="pb-0.5">
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={10} fill={s<=4?"#ffb547":"rgba(255,181,71,0.2)"} className="text-amber-400" />)}</div>
                  <span className="text-[9px] text-muted-foreground">247 hoje</span>
                </div>
              </div>
              {[['5★', 68, '#b8ff57'], ['4★', 22, '#00e5b4'], ['3★', 7, '#ffb547']].map(([l, v, c]) => (
                <div key={l} className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[9px] text-muted-foreground w-5">{l}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${v}%`, background: c }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground w-6 text-right">{v}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
