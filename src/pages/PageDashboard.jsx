import { useState, useEffect, useCallback } from 'react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── CSS vars ──────────────────────────────────────────────────────────────────
const V = {
  bg:     'var(--bg)',
  bg2:    'var(--bg-2)',
  bg3:    'var(--bg-3)',
  label:  'var(--label)',
  label2: 'var(--label-2)',
  label3: 'var(--label-3)',
  label4: 'var(--label-4)',
  sep:    'var(--sep)',
  fill:   'var(--fill)',
  accent: 'var(--accent, #059669)',
}

// ── Sparkline SVG inline ──────────────────────────────────────────────────────
function Sparkline({ data = [], color = '#059669', height = 32, width = 80 }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} style={{ display:'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, subLabel, color = V.accent, sparkData = [] }) {
  return (
    <div style={{
      background:V.bg2, border:`1px solid ${V.sep}`, borderRadius:12,
      padding:'16px 18px', display:'flex', flexDirection:'column', gap:8,
    }}>
      <div style={{ fontSize:12, color:V.label3, fontWeight:500 }}>{label}</div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
          <div style={{ fontSize:28, fontWeight:700, color:V.label, lineHeight:1 }}>
            {value ?? '—'}
          </div>
          {subLabel && (
            <div style={{ fontSize:11, color:V.label4, marginTop:4 }}>{subLabel}</div>
          )}
        </div>
        {sparkData.length > 1 && (
          <Sparkline data={sparkData} color={color} />
        )}
      </div>
    </div>
  )
}

// ── Barra de distribuição ─────────────────────────────────────────────────────
function BarraStatus({ label, valor, total, cor }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:12, color:V.label3 }}>{label}</span>
        <span style={{ fontSize:12, color:V.label, fontWeight:600 }}>{valor} <span style={{ color:V.label4, fontWeight:400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height:6, borderRadius:3, background:V.fill }}>
        <div style={{ height:'100%', borderRadius:3, background:cor, width:`${pct}%`, transition:'width 0.4s' }} />
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PageDashboard({ api: apiProp }) {
  const api = apiProp || BASE

  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpd, setLastUpd] = useState(null)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/dashboard/stats`)
      if (r.ok) {
        const d = await r.json()
        setStats(d)
        setLastUpd(new Date())
      }
    } catch (e) {
      console.error('Erro stats:', e.message)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    carregar()
    const t = setInterval(carregar, 30000)
    return () => clearInterval(t)
  }, [carregar])

  if (loading) return (
    <div style={{ padding:32, color:V.label4, fontSize:13 }}>Carregando dashboard...</div>
  )

  // Extrai dados do formato v6
  const conv  = stats?.conversas || {}
  const msgs  = stats?.mensagens || {}
  const cat   = stats?.catalogo  || {}
  const dist  = stats?.status_distribuicao || []

  // Total de conversas por status para as barras
  const statusTotal   = dist.reduce((s, r) => s + parseInt(r.total||0), 0)
  const statusPend    = parseInt(dist.find(r => r.status === 'pendente')?.total     || 0)
  const statusAndamento = parseInt(dist.find(r => r.status === 'em_andamento')?.total || 0)
  const statusResolvido = parseInt(dist.find(r => r.status === 'resolvido')?.total  || 0)
  const statusEncerrado = parseInt(dist.find(r => r.status === 'encerrado')?.total  || 0)

  // Taxa de disponibilidade do catálogo
  const pctDisp = cat.total_produtos > 0
    ? Math.round((parseInt(cat.disponiveis||0) / parseInt(cat.total_produtos)) * 100)
    : 0

  // Última atualização
  const ultimoSync = cat.ultimo_sync
    ? new Date(cat.ultimo_sync).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
    : '—'

  return (
    <div style={{ padding:24, maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:V.label }}>Dashboard</h2>
          <div style={{ fontSize:11, color:V.label4, marginTop:2 }}>
            Atualizado {lastUpd ? lastUpd.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '—'}
          </div>
        </div>
        <button onClick={carregar} style={{
          padding:'6px 14px', borderRadius:8, border:`1px solid ${V.sep}`,
          background:V.fill, color:V.label3, fontSize:12, cursor:'pointer',
        }}>
          ↻ Atualizar
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:14, marginBottom:24 }}>
        <KpiCard
          label="Conversas hoje"
          value={conv.hoje || 0}
          subLabel={`${conv.total_conversas || 0} total`}
          color="#059669"
          sparkData={[conv.semana||0, conv.hoje||0]}
        />
        <KpiCard
          label="Mensagens hoje"
          value={msgs.hoje || 0}
          subLabel={`${msgs.recebidas || 0} recebidas`}
          color="#3b82f6"
          sparkData={[msgs.total_msgs||0, msgs.hoje||0]}
        />
        <KpiCard
          label="Produtos disponíveis"
          value={cat.disponiveis || 0}
          subLabel={`${pctDisp}% do catálogo`}
          color="#8b5cf6"
          sparkData={[cat.total_produtos||0, cat.disponiveis||0]}
        />
        <KpiCard
          label="Conversas na semana"
          value={conv.semana || 0}
          subLabel={`sync: ${ultimoSync}`}
          color="#f59e0b"
          sparkData={[conv.semana||0]}
        />
      </div>

      {/* Grid inferior */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* Distribuição de status */}
        <div style={{ background:V.bg2, border:`1px solid ${V.sep}`, borderRadius:12, padding:18 }}>
          <div style={{ fontSize:14, fontWeight:600, color:V.label, marginBottom:16 }}>
            Status das conversas
          </div>
          <BarraStatus label="⏳ Pendente"     valor={statusPend}      total={statusTotal} cor="#f59e0b" />
          <BarraStatus label="💬 Em andamento" valor={statusAndamento} total={statusTotal} cor="#3b82f6" />
          <BarraStatus label="✅ Resolvido"    valor={statusResolvido} total={statusTotal} cor="#059669" />
          <BarraStatus label="🔒 Encerrado"   valor={statusEncerrado} total={statusTotal} cor="#94a3b8" />
          <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${V.sep}`, display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:V.label3 }}>Total</span>
            <span style={{ fontSize:12, fontWeight:600, color:V.label }}>{statusTotal}</span>
          </div>
        </div>

        {/* Catálogo e sistema */}
        <div style={{ background:V.bg2, border:`1px solid ${V.sep}`, borderRadius:12, padding:18 }}>
          <div style={{ fontSize:14, fontWeight:600, color:V.label, marginBottom:16 }}>
            Catálogo & Sistema
          </div>
          {[
            ['Total produtos',    cat.total_produtos || 0,  V.label],
            ['Disponíveis',       cat.disponiveis    || 0,  '#059669'],
            ['Com estoque',       cat.com_estoque    || 0,  '#3b82f6'],
            ['Últ. sincronização', ultimoSync,              V.label3],
          ].map(([label, val, cor]) => (
            <div key={label} style={{
              display:'flex', justifyContent:'space-between',
              padding:'8px 0', borderBottom:`1px solid ${V.sep}`,
            }}>
              <span style={{ fontSize:12, color:V.label3 }}>{label}</span>
              <span style={{ fontSize:12, fontWeight:600, color:cor }}>{val}</span>
            </div>
          ))}

          {/* Mensagens */}
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:13, fontWeight:600, color:V.label, marginBottom:10 }}>Mensagens</div>
            {[
              ['Total',     msgs.total_msgs || 0],
              ['Recebidas', msgs.recebidas  || 0],
              ['Enviadas',  msgs.enviadas   || 0],
            ].map(([label, val]) => (
              <div key={label} style={{
                display:'flex', justifyContent:'space-between',
                padding:'6px 0', borderBottom:`1px solid ${V.sep}`,
              }}>
                <span style={{ fontSize:12, color:V.label3 }}>{label}</span>
                <span style={{ fontSize:12, fontWeight:600, color:V.label }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
