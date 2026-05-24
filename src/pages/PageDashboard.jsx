import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, ShoppingCart, MessageSquare, Users, Zap, RefreshCw, CreditCard, ArrowUpRight } from 'lucide-react'

const fmtR  = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmt   = n => Number(n||0).toLocaleString('pt-BR')

function StatCard({ icon: Icon, label, value, sub, trend, trendUp, color='var(--accent)' }) {
  return (
    <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:12, padding:'18px 20px', flex:1, minWidth:160 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:500, color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
        <div style={{ width:32, height:32, borderRadius:8, background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize:26, fontWeight:500, color:'var(--label)', lineHeight:1, marginBottom:6 }}>{value}</div>
      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--label-3)' }}>
        {trend && (
          <span style={{ display:'flex', alignItems:'center', gap:2, color: trendUp?'#1D9E75':'#EF4444', fontWeight:500 }}>
            {trendUp ? <TrendingUp size={11}/> : <TrendingDown size={11}/>} {trend}
          </span>
        )}
        {sub && <span>{sub}</span>}
      </div>
    </div>
  )
}

function BarChart({ data, height=180 }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height, paddingTop:24, position:'relative' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' }}>
          {d.value > 0 && (
            <span style={{ fontSize:10, color:'var(--label-3)', position:'absolute', top:0, transform:'translateX(0)' }}>
              {d.value > 0 ? `R$${(d.value/1000).toFixed(1)}k` : ''}
            </span>
          )}
          <div style={{
            width:'100%', background: i === data.length-1 ? 'var(--accent)' : `var(--accent)`,
            opacity: i === data.length-1 ? 1 : 0.5,
            borderRadius:'4px 4px 0 0',
            height: `${Math.max(2, (d.value/max)*100)}%`,
            transition:'height .3s',
            position:'relative',
          }}>
            <div style={{ position:'absolute', top:-20, left:'50%', transform:'translateX(-50%)', fontSize:10, color:'var(--label-3)', whiteSpace:'nowrap' }}>
              {d.value > 0 ? fmtR(d.value).replace('R$ ','') : ''}
            </div>
          </div>
          <span style={{ fontSize:9, color:'var(--label-3)', whiteSpace:'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function PillStatus({ status }) {
  const s = (status||'').toLowerCase()
  const c = {
    'atendido': { bg:'#1D9E7520', color:'#1D9E75' },
    'verificado': { bg:'#1D9E7520', color:'#1D9E75' },
    'aberto':   { bg:'#EF9F2720', color:'#EF9F27' },
    'cancelado':{ bg:'#EF444420', color:'#EF4444' },
  }[s] || { bg:'var(--fill)', color:'var(--label-3)' }
  return <span style={{ fontSize:11, fontWeight:500, padding:'2px 7px', borderRadius:99, background:c.bg, color:c.color }}>{status}</span>
}

function mapSit(s) {
  const id = typeof s === 'object' ? s.id || s.valor : s
  return { 6:'Aberto', 9:'Atendido', 12:'Cancelado', 14:'Faturado', 15:'Verificado' }[id] || String(id)
}

export default function PageDashboard({ api }) {
  const [dados,   setDados]   = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [sessoes, setSessoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('7d')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [rStats, rFin, rSess] = await Promise.all([
        fetch(`${api}/api/dashboard/stats`).catch(() => null),
        fetch(`${api}/api/dashboard/financeiro`).catch(() => null),
        fetch(`${api}/api/dashboard/sessoes`).catch(() => null),
      ])
      const stats = rStats?.ok ? await rStats.json() : {}
      const fin   = rFin?.ok   ? await rFin.json()   : {}
      const sess  = rSess?.ok  ? await rSess.json()  : {}
      setDados({ stats, fin })
      setPedidos((fin.pedidos_recentes || []).slice(0, 8))
      setSessoes(sess.sessoes || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [api, periodo])

  useEffect(() => { carregar() }, [carregar])

  const fin    = dados?.fin   || {}
  const stats  = dados?.stats || {}
  const grafico = (fin.grafico_7dias || []).map(g => ({
    value: g.entradas || 0,
    label: g.label?.split(',')[0] || g.data?.slice(5) || '',
  }))

  const totalEntradas  = fin.entradas_mes   || 0
  const totalAReceber  = fin.a_receber      || 0
  const totalMP        = fin.mp_total_mes   || 0
  const transacoesMP   = fin.mp_transacoes  || 0
  const totalMensagens = stats.mensagens?.total_msgs || 0
  const totalConversas = stats.conversas?.total_conversas || 0
  const ativasAgora    = sessoes.filter(s => Date.now() - new Date(s.atualizado_em).getTime() < 30*60*1000).length
  const comCarrinho    = sessoes.filter(s => parseInt(s.itens_carrinho) > 0).length

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 28px', maxWidth:1200 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:500, margin:0, color:'var(--label)' }}>Dashboard</h1>
          <p style={{ fontSize:13, color:'var(--label-3)', margin:'3px 0 0' }}>Visão geral — Só Strass</p>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {['1d','7d','30d'].map(p => (
            <button key={p} onClick={() => setPeriodo(p)} style={{
              padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer',
              border:`0.5px solid ${periodo===p?'var(--accent)':'var(--sep)'}`,
              background: periodo===p?'var(--accent-dim)':'transparent',
              color: periodo===p?'var(--accent)':'var(--label-3)',
            }}>{p==='1d'?'Hoje':p==='7d'?'7 dias':'30 dias'}</button>
          ))}
          <button onClick={carregar} style={{ width:32, height:32, borderRadius:8, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Stats row 1 — Financeiro */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <StatCard icon={TrendingUp}  label="Entradas do mês"   value={fmtR(totalEntradas)} sub="Bling"           color="#1D9E75" trend="+18%" trendUp />
        <StatCard icon={CreditCard}  label="A receber"          value={fmtR(totalAReceber)} sub="pendente"        color="#EF9F27" />
        <StatCard icon={Zap}         label="Mercado Pago"       value={fmtR(totalMP)}       sub={`${transacoesMP} transações`} color="#e65100" trend="+12%" trendUp />
        <StatCard icon={ShoppingCart} label="Pedidos hoje"      value={fmt(pedidos.filter(p=>p.data?.startsWith(new Date().toISOString().split('T')[0])).length)} sub="via WhatsApp" color="#534AB7" />
      </div>

      {/* Stats row 2 — Atendimento */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <StatCard icon={MessageSquare} label="Mensagens"     value={fmt(totalMensagens)} sub="total" color="#378ADD" />
        <StatCard icon={Users}         label="Conversas"     value={fmt(totalConversas)} sub="atendidas" color="#993556" />
        <StatCard icon={Users}         label="Ativas agora"  value={ativasAgora} sub="últimos 30 min" color="#1D9E75" />
        <StatCard icon={ShoppingCart}  label="Com carrinho"  value={comCarrinho} sub="sessões ativas" color="#EF9F27" />
      </div>

      {/* Gráfico + Status */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16, marginBottom:20 }}>
        <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:12, padding:'18px 20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <span style={{ fontSize:13, fontWeight:500, color:'var(--label)' }}>Entradas — últimos 7 dias</span>
            <span style={{ fontSize:11, color:'var(--accent)', fontWeight:500 }}>{fmtR(totalEntradas)} total</span>
          </div>
          {grafico.length > 0 ? (
            <BarChart data={grafico} height={160} />
          ) : (
            <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--label-3)', fontSize:13 }}>
              {loading ? 'Carregando...' : 'Sem dados no período'}
            </div>
          )}
        </div>

        <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:12, padding:'18px 20px' }}>
          <div style={{ fontSize:13, fontWeight:500, color:'var(--label)', marginBottom:14 }}>Status do sistema</div>
          {[
            { n:'Bia WhatsApp',  ok:true, desc:'Atendendo' },
            { n:'Gemini AI',     ok:true, desc:'gemini-2.5-flash' },
            { n:'Bling ERP',     ok:true, desc:'Sincronizado' },
            { n:'Mercado Pago',  ok:true, desc:'PIX ativo' },
            { n:'Melhor Envio',  ok:true, desc:'Cotando' },
          ].map(s => (
            <div key={s.n} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'0.5px solid var(--sep)' }}>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:'var(--label)' }}>{s.n}</div>
                <div style={{ fontSize:11, color:'var(--label-3)' }}>{s.desc}</div>
              </div>
              <span style={{ fontSize:11, fontWeight:600, color: s.ok?'#1D9E75':'#EF4444' }}>● {s.ok?'Online':'Offline'}</span>
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
                {['Nº','Cliente','Valor','Status','Data'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'8px 16px', fontSize:11, fontWeight:500, color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'0.5px solid var(--sep)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidos.length > 0 ? pedidos.map((p, i) => (
                <tr key={i}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  style={{ borderTop:'0.5px solid var(--sep)' }}>
                  <td style={{ padding:'9px 16px', fontWeight:600, color:'var(--accent)' }}>#{p.numero}</td>
                  <td style={{ padding:'9px 16px', color:'var(--label-2)' }}>{p.contato || '—'}</td>
                  <td style={{ padding:'9px 16px', fontWeight:500, color:'var(--label)' }}>{fmtR(p.total)}</td>
                  <td style={{ padding:'9px 16px' }}><PillStatus status={mapSit(p.situacao)} /></td>
                  <td style={{ padding:'9px 16px', color:'var(--label-3)' }}>{p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ padding:'24px', textAlign:'center', color:'var(--label-3)', fontSize:13 }}>
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
