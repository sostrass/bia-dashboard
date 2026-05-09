import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

const HOURLY = [
  {h:'06',m:9,p:2,d:1},{h:'07',m:14,p:3,d:1},{h:'08',m:22,p:5,d:2},
  {h:'09',m:31,p:7,d:3},{h:'10',m:28,p:6,d:2},{h:'11',m:35,p:9,d:4},
  {h:'12',m:19,p:4,d:1},{h:'13',m:24,p:5,d:2},{h:'14',m:38,p:11,d:5},
  {h:'15',m:42,p:13,d:3},{h:'16',m:37,p:8,d:4},{h:'17',m:29,p:6,d:2},
]
const WEEK = [{d:'Seg',v:43},{d:'Ter',v:51},{d:'Qua',v:47},{d:'Qui',v:58},{d:'Sex',v:71},{d:'Sáb',v:82},{d:'Dom',v:38}]
const CATS = [{n:'Bijuterias',v:38,c:'#BF5AF2'},{n:'Linhas',v:24,c:'#32D74B'},{n:'Botões',v:18,c:'#0A84FF'},{n:'Fitas',v:12,c:'#FF453A'},{n:'Miçangas',v:8,c:'#FF9F0A'}]

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-[11px]" style={{ border: '1px solid var(--sep)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--label-3)' }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span style={{ color: 'var(--label-2)' }}>{p.name}</span>
          <span className="font-bold" style={{ color: 'var(--label)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function KPI({ label, value, sub, trend, color }) {
  const up = trend >= 0
  return (
    <div className="card p-4">
      <div className="text-[11px] font-medium mb-2" style={{ color: 'var(--label-3)' }}>{label}</div>
      <div className="text-[28px] font-bold tracking-tight leading-none mb-1" style={{ color: color || 'var(--label)' }}>
        {value}
      </div>
      <div className="flex items-center gap-1.5">
        {trend !== undefined && (
          <span className="flex items-center gap-0.5 text-[11px] font-medium"
            style={{ color: up ? 'var(--accent)' : 'var(--red)' }}>
            {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend)}%
          </span>
        )}
        <span className="text-[11px]" style={{ color: 'var(--label-3)' }}>{sub}</span>
      </div>
    </div>
  )
}

export default function PageDashboard({ api }) {
  const [n, setN] = useState(247)
  useEffect(() => {
    const i = setInterval(async () => {
      try { const r = await fetch(`${api}/api/dashboard/stats`); if (r.ok) { const d = await r.json(); if (d.hoje?.clientes_unicos) setN(d.hoje.clientes_unicos) } } catch {}
      setN(x => x + Math.floor(Math.random() * 2))
    }, 8000)
    return () => clearInterval(i)
  }, [])

  return (
    <div className="h-full overflow-y-auto scroll-hidden" style={{ background: 'var(--bg)' }}>
      <div className="p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--label)' }}>Dashboard</h1>
            <p className="text-[13px]" style={{ color: 'var(--label-3)' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)', animation: 'ping-green 1.5s ease-in-out infinite' }} />
            LIVE
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-5 gap-3">
          <KPI label="Clientes hoje"     value={n}      sub="ao vivo"         trend={12}  color="var(--accent)" />
          <KPI label="Resolvidos IA"     value="98%"    sub={`${n-5} de ${n}`} trend={3} />
          <KPI label="Pedidos gerados"   value="82"     sub="R$ 14.380"       trend={8}  color="var(--blue)" />
          <KPI label="Devoluções"        value="12"     sub="todas ok"         trend={-2} color="var(--orange)" />
          <KPI label="Tempo médio"       value="1m38s"  sub="por atendimento"  trend={-15} color="var(--teal)" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-12 gap-3">
          {/* Area */}
          <div className="col-span-7 card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[15px] font-semibold" style={{ color: 'var(--label)' }}>Volume de Atendimentos</div>
                <div className="text-[12px]" style={{ color: 'var(--label-3)' }}>por hora — hoje</div>
              </div>
              <div className="flex gap-3">
                {[['var(--accent)','Mensagens'],['var(--blue)','Pedidos'],['var(--red)','Devol.']].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                    <span className="text-[11px]" style={{ color: 'var(--label-3)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HOURLY} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                  <defs>
                    {[['g1','var(--accent)'],['g2','var(--blue)'],['g3','var(--red)']].map(([id,c]) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={c} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis dataKey="h" tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} />
                  <Area type="monotone" dataKey="m" name="Msgs"   stroke="var(--accent)" strokeWidth={1.5} fill="url(#g1)" dot={false} />
                  <Area type="monotone" dataKey="p" name="Pedidos" stroke="var(--blue)"   strokeWidth={1.5} fill="url(#g2)" dot={false} />
                  <Area type="monotone" dataKey="d" name="Devol."  stroke="var(--red)"    strokeWidth={1.5} fill="url(#g3)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right column */}
          <div className="col-span-5 space-y-3">
            {/* Bar */}
            <div className="card p-4">
              <div className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--label)' }}>Semana</div>
              <div className="text-[11px] mb-3" style={{ color: 'var(--label-3)' }}>pedidos por dia</div>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={WEEK} margin={{ top:0, right:0, left:-30, bottom:0 }}>
                    <XAxis dataKey="d" tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="v" name="Pedidos" fill="var(--blue)" radius={[5,5,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie + Sat */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-3">
                <div className="text-[13px] font-semibold mb-3" style={{ color: 'var(--label)' }}>Categorias</div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-16 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={CATS} cx="50%" cy="50%" innerRadius={18} outerRadius={30} paddingAngle={3} dataKey="v">
                          {CATS.map((c,i) => <Cell key={i} fill={c.c} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1">
                    {CATS.map(c => (
                      <div key={c.n} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.c }} />
                        <span className="text-[9px] truncate" style={{ color: 'var(--label-3)' }}>{c.n}</span>
                        <span className="text-[9px] font-bold ml-auto" style={{ color: 'var(--label)' }}>{c.v}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card p-3">
                <div className="text-[13px] font-semibold mb-2" style={{ color: 'var(--label)' }}>Satisfação</div>
                <div className="text-[28px] font-bold tracking-tight mb-1" style={{ color: 'var(--yellow)' }}>4.8</div>
                <div className="flex gap-0.5 mb-2">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-[11px]" style={{ color: s<=4 ? 'var(--yellow)' : 'var(--label-4)' }}>★</span>)}
                </div>
                {[['5★',68],['4★',22],['3★',7]].map(([l,v]) => (
                  <div key={l} className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] w-4" style={{ color: 'var(--label-3)' }}>{l}</span>
                    <div className="flex-1 h-1 rounded-full" style={{ background: 'var(--sep)' }}>
                      <div className="h-full rounded-full" style={{ width: `${v}%`, background: 'var(--yellow)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
