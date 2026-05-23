import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, ShoppingCart, MessageSquare, Users, Zap, RefreshCw } from 'lucide-react'

const fmtR  = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmt   = n => Number(n||0).toLocaleString('pt-BR')
const fmtPct= n => `${Number(n||0).toFixed(1)}%`

function StatCard({ icon: Icon, label, value, sub, trend, trendUp, color = 'var(--accent)' }) {
  return (
    <div style={{
      background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:12,
      padding:'18px 20px', flex:1, minWidth:160,
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:500, color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
        <div style={{ width:32, height:32, borderRadius:8, background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize:26, fontWeight:500, color:'var(--label)', lineHeight:1, marginBottom:6 }}>{value}</div>
      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--label-3)' }}>
        {trend !== undefined && (
          <span style={{ display:'flex', alignItems:'center', gap:2, color: trendUp ? '#1D9E75' : '#EF4444', fontWeight:500 }}>
            {trendUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {trend}
          </span>
        )}
        {sub && <span>{sub}</span>}
      </div>
    </div>
  )
}

function PedidoRow({ numero, cliente, valor, status, forma, data }) {
  const cores = { pago:'#1D9E75', pendente:'#EF9F27', cancelado:'#EF4444', aguardando:'#EF9F27' }
  const cor   = cores[status?.toLowerCase()] || '#888'
  return (
    <tr style={{ borderTop:'0.5px solid var(--sep)' }}>
      <td style={{ padding:'10px 0', fontSize:13, color:'var(--label)', fontWeight:500 }}>#{numero}</td>
      <td style={{ padding:'10px 12px', fontSize:13, color:'var(--label-2)' }}>{cliente}</td>
      <td style={{ padding:'10px 0', fontSize:13, color:'var(--label)' }}>{fmtR(valor)}</td>
      <td style={{ padding:'10px 0' }}>
        <span style={{ fontSize:11, fontWeight:500, padding:'3px 8px', borderRadius:99, background:`${cor}20`, color:cor }}>
          {status}
        </span>
      </td>
      <td style={{ padding:'10px 0', fontSize:12, color:'var(--label-3)' }}>{forma}</td>
      <td style={{ padding:'10px 0', fontSize:12, color:'var(--label-3)', textAlign:'right' }}>{data}</td>
    </tr>
  )
}

export default function PageDashboard({ api }) {
  const [dados,   setDados]   = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('7d')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      // Busca stats gerais
      const [rStats, rFin] = await Promise.all([
        fetch(`${api}/api/dashboard/stats`).catch(() => null),
        fetch(`${api}/api/dashboard/financeiro`).catch(() => null),
      ])
      const stats = rStats?.ok ? await rStats.json() : {}
      const fin   = rFin?.ok   ? await rFin.json()   : {}

      setDados({ stats, fin })

      // Pedidos recentes do Bling via financeiro
      if (fin?.pedidos_recentes?.length) {
        setPedidos(fin.pedidos_recentes.slice(0, 8).map(p => ({
          numero:  p.numero,
          cliente: p.contato || '—',
          valor:   p.total,
          status:  mapSituacao(p.situacao),
          forma:   'PIX',
          data:    p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '—',
        })))
      }
    } catch(e) {
      console.error('Dashboard erro:', e)
    } finally {
      setLoading(false)
    }
  }, [api, periodo])

  useEffect(() => { carregar() }, [carregar])

  const mapSituacao = s => {
    if (!s) return 'Aberto'
    const id = typeof s === 'object' ? s.id || s.valor : s
    const m  = { 6:'Aberto', 9:'Atendido', 12:'Cancelado', 14:'Faturado', 15:'Verificado' }
    return m[id] || `Status ${id}`
  }

  const fin   = dados?.fin   || {}
  const stats = dados?.stats || {}

  const totalEntradas  = fin.entradas_mes   || 0
  const totalAReceber  = fin.a_receber      || 0
  const totalMP        = fin.mp_total_mes   || 0
  const transacoesMP   = fin.mp_transacoes  || 0
  const totalMensagens = stats.mensagens?.total_msgs || 0
  const totalConversas = stats.conversas?.total_conversas || 0

  // Gráfico simples de barras
  const grafico = fin.grafico_7dias || []
  const maxVal  = Math.max(...grafico.map(g => g.entradas || 0), 1)

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 28px', maxWidth:1140 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:500, margin:0, color:'var(--label)' }}>Dashboard</h1>
          <p style={{ fontSize:13, color:'var(--label-3)', margin:'3px 0 0' }}>
            Visão geral — Só Strass
          </p>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {['1d','7d','30d'].map(p => (
            <button key={p} onClick={() => setPeriodo(p)} style={{
              padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer',
              border: `0.5px solid ${periodo === p ? 'var(--accent)' : 'var(--sep)'}`,
              background: periodo === p ? 'var(--accent-dim)' : 'transparent',
              color: periodo === p ? 'var(--accent)' : 'var(--label-3)',
            }}>
              {p === '1d' ? 'Hoje' : p === '7d' ? '7 dias' : '30 dias'}
            </button>
          ))}
          <button onClick={carregar} style={{
            width:32, height:32, borderRadius:8, border:'0.5px solid var(--sep)',
            background:'transparent', cursor:'pointer', color:'var(--label-3)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <StatCard icon={ShoppingCart}  label="Entradas do mês"   value={fmtR(totalEntradas)} sub="Bling" color="#1D9E75" trend="+18%" trendUp />
        <StatCard icon={CreditCard2}   label="A receber"         value={fmtR(totalAReceber)} sub="pendente" color="#EF9F27" />
        <StatCard icon={Zap}           label="Mercado Pago"      value={fmtR(totalMP)} sub={`${transacoesMP} transações`} color="#e65100" trend="+12%" trendUp />
        <StatCard icon={MessageSquare} label="Mensagens"         value={fmt(totalMensagens)} sub="total" color="#378ADD" />
        <StatCard icon={Users}         label="Conversas"         value={fmt(totalConversas)} sub="atendidas" color="#534AB7" />
      </div>

      {/* Gráfico 7 dias + Notificações */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, marginBottom:20 }}>
        {/* Gráfico */}
        <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:12, padding:'18px 20px' }}>
          <div style={{ fontSize:13, fontWeight:500, color:'var(--label)', marginBottom:16 }}>
            Entradas — últimos 7 dias
          </div>
          {grafico.length > 0 ? (
            <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:160 }}>
              {grafico.map((g, i) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:10, color:'var(--label-3)' }}>
                    {g.entradas > 0 ? `R$${(g.entradas/1000).toFixed(1)}k` : ''}
                  </span>
                  <div style={{
                    width:'100%', background:'var(--accent)', borderRadius:'4px 4px 0 0',
                    height: `${Math.max(4, (g.entradas / maxVal) * 120)}px`,
                    opacity: 0.8, transition:'height .3s',
                  }} />
                  <span style={{ fontSize:10, color:'var(--label-3)', whiteSpace:'nowrap' }}>
                    {g.label?.split(',')[0]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--label-3)', fontSize:13 }}>
              {loading ? 'Carregando...' : 'Sem dados no período'}
            </div>
          )}
        </div>

        {/* Status rápido */}
        <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:12, padding:'18px 20px' }}>
          <div style={{ fontSize:13, fontWeight:500, color:'var(--label)', marginBottom:14 }}>Status do sistema</div>
          {[
            { n:'Bia WhatsApp', ok:true, desc:'Atendendo' },
            { n:'Gemini AI',    ok:true, desc:'gemini-2.5-flash' },
            { n:'Bling ERP',    ok:true, desc:'Sincronizado' },
            { n:'Mercado Pago', ok:true, desc:'PIX ativo' },
            { n:'Melhor Envio', ok:true, desc:'Cotando' },
          ].map(s => (
            <div key={s.n} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'0.5px solid var(--sep)' }}>
              <div>
                <div style={{ fontSize:13, color:'var(--label)', fontWeight:500 }}>{s.n}</div>
                <div style={{ fontSize:11, color:'var(--label-3)' }}>{s.desc}</div>
              </div>
              <span style={{ fontSize:11, fontWeight:600, color: s.ok ? '#1D9E75' : '#EF4444' }}>
                ● {s.ok ? 'Online' : 'Offline'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pedidos recentes */}
      <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'0.5px solid var(--sep)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:500, color:'var(--label)' }}>Pedidos recentes — Bling</span>
          {loading && <span style={{ fontSize:11, color:'var(--label-3)' }}>Carregando...</span>}
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--bg-3)' }}>
                {['Nº','Cliente','Valor','Status','Forma','Data'].map(h => (
                  <th key={h} style={{
                    textAlign: h === 'Data' ? 'right' : 'left',
                    padding:'8px 12px 8px ' + (h === 'Nº' ? '20px' : '0'),
                    fontSize:11, fontWeight:500, color:'var(--label-3)',
                    textTransform:'uppercase', letterSpacing:'0.05em',
                    borderBottom:'0.5px solid var(--sep)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidos.length > 0 ? pedidos.map((p, i) => (
                <tr key={i} style={{ borderTop:'0.5px solid var(--sep)' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'10px 12px 10px 20px', fontWeight:500, color:'var(--label)' }}>#{p.numero}</td>
                  <td style={{ padding:'10px 12px 10px 0', color:'var(--label-2)' }}>{p.cliente}</td>
                  <td style={{ padding:'10px 12px 10px 0', color:'var(--label)', fontWeight:500 }}>{fmtR(p.valor)}</td>
                  <td style={{ padding:'10px 12px 10px 0' }}>
                    <StatusPill status={p.status} />
                  </td>
                  <td style={{ padding:'10px 12px 10px 0', color:'var(--label-3)' }}>{p.forma}</td>
                  <td style={{ padding:'10px 20px 10px 0', color:'var(--label-3)', textAlign:'right' }}>{p.data}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} style={{ padding:'24px 20px', textAlign:'center', color:'var(--label-3)', fontSize:13 }}>
                  {loading ? 'Carregando pedidos...' : 'Nenhum pedido encontrado'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const s = (status || '').toLowerCase()
  const cfg = {
    'atendido':  { bg:'#1D9E7520', color:'#1D9E75' },
    'pago':      { bg:'#1D9E7520', color:'#1D9E75' },
    'aberto':    { bg:'#EF9F2720', color:'#EF9F27' },
    'pendente':  { bg:'#EF9F2720', color:'#EF9F27' },
    'cancelado': { bg:'#EF444420', color:'#EF4444' },
    'faturado':  { bg:'#378ADD20', color:'#378ADD' },
  }[s] || { bg:'var(--fill)', color:'var(--label-3)' }
  return (
    <span style={{ fontSize:11, fontWeight:500, padding:'3px 8px', borderRadius:99, background:cfg.bg, color:cfg.color }}>
      {status}
    </span>
  )
}

// Ícone faltando no lucide-react nessa versão
function CreditCard2({ size, style }) {
  return <CreditCard size={size} style={style} />
}
