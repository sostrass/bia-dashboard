import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, ShoppingCart, MessageSquare, Users, Zap, RefreshCw, CreditCard, ArrowUpRight, TrendingUp as TU, BarChart2, AlertTriangle, Star, CheckCircle, MessageCircle, Monitor, Database, Wifi } from 'lucide-react'

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


// ── Insights IA ───────────────────────────────────────────────────────────────
function TipoIcon({ tipo, size=13, color }) {
  const MAP = { oportunidade: TrendingUp, alerta: AlertTriangle, tendencia: BarChart2, conquista: Star }
  const Ic = MAP[tipo] || Zap
  return <Ic size={size} style={{ color }} />
}

function InsightsPanel({ api }) {
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [config,    setConfig]    = useState(null)
  const [editando,  setEditando]  = useState(false)
  const [form,      setForm]      = useState({})
  const [salvando,  setSalvando]  = useState(false)

  const MODELOS = [
    { id:'gemini-2.5-flash', label:'Gemini 2.5 Flash (recomendado)' },
    { id:'gemini-2.0-flash', label:'Gemini 2.0 Flash (mais rápido)'  },
    { id:'gemini-2.5-pro',   label:'Gemini 2.5 Pro (mais preciso)'   },
  ]

  const carregar = (force = false) => {
    setLoading(true)
    const url = `${api}/api/dashboard/insights${force ? '?refresh=1' : ''}`
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const carregarConfig = () => {
    fetch(`${api}/api/dashboard/insights/config`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setConfig(d); setForm(d) } })
      .catch(() => {})
  }

  useEffect(() => { carregar(); carregarConfig() }, [api])

  const salvarConfig = async () => {
    setSalvando(true)
    try {
      await fetch(`${api}/api/dashboard/insights/config`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cache_minutos: parseInt(form.cache_minutos),
          modelo:        form.modelo,
          ativo:         form.ativo === 'true' || form.ativo === true,
        }),
      })
      setConfig({ ...form })
      setEditando(false)
      carregar(true) // força nova geração com o novo modelo
    } catch {}
    setSalvando(false)
  }

  const TIPO_ICON = {
    oportunidade: TrendingUp,
    alerta:       AlertTriangle,
    tendencia:    BarChart2,
    conquista:    Star,
  }
  const TIPO_COR = {
    oportunidade: { txt:'#22c55e', bg:'rgba(34,197,94,0.08)',   bdr:'rgba(34,197,94,0.2)'   },
    alerta:       { txt:'#f59e0b', bg:'rgba(245,158,11,0.08)',  bdr:'rgba(245,158,11,0.2)'  },
    tendencia:    { txt:'#4a9fff', bg:'rgba(74,159,255,0.08)',  bdr:'rgba(74,159,255,0.2)'  },
    conquista:    { txt:'#a78bfa', bg:'rgba(167,139,250,0.08)', bdr:'rgba(167,139,250,0.2)' },
  }

  return (
    <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:14, padding:'18px 20px', marginBottom:20 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: editando ? 16 : 14 }}>
        <Zap size={15} style={{color:'var(--label-3)'}}/>
        <span style={{ fontSize:13, fontWeight:600, color:'var(--label)' }}>Insights IA</span>

        {/* Info de cache */}
        {data?._cache && !editando && (
          <span style={{ fontSize:10, color:'var(--label-4)', padding:'2px 8px', borderRadius:99, background:'var(--fill)', border:'0.5px solid var(--sep)' }}>
            {data._cache.hit ? `cache · expira em ${data._cache.expira_em}` : `gerado agora · ${data._cache.ttl_min}min cache`}
            {data._cache.modelo && ` · ${data._cache.modelo}`}
          </span>
        )}

        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <button onClick={() => carregar(true)} disabled={loading}
            style={{ padding:'4px 10px', borderRadius:8, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', fontSize:11, color:'var(--label-3)', display:'flex', alignItems:'center', gap:4 }}>
            <RefreshCw size={11}/>
            {loading ? 'Gerando...' : 'Atualizar'}
          </button>
          <button onClick={() => setEditando(v => !v)}
            style={{ padding:'4px 10px', borderRadius:8, border:`0.5px solid ${editando ? 'var(--accent)' : 'var(--sep)'}`, background: editando ? 'var(--accent-dim)' : 'transparent', cursor:'pointer', fontSize:11, color: editando ? 'var(--accent)' : 'var(--label-3)', display:'flex', alignItems:'center', gap:4 }}>
            <Zap size={11}/>
            Configurar
          </button>
        </div>
      </div>

      {/* Painel de configuração */}
      {editando && (
        <div style={{ background:'var(--bg)', border:'0.5px solid var(--sep)', borderRadius:10, padding:'14px 16px', marginBottom:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>

            {/* Cache em minutos */}
            <div>
              <label style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', display:'block', marginBottom:5 }}>
                Cache (minutos)
              </label>
              <input type="number" min="1" max="1440"
                value={form.cache_minutos || 30}
                onChange={e => setForm(f => ({ ...f, cache_minutos: e.target.value }))}
                style={{ width:'100%', padding:'6px 10px', borderRadius:7, border:'0.5px solid var(--sep)', background:'var(--bg-2)', color:'var(--label)', fontSize:12, outline:'none' }}
              />
              <p style={{ fontSize:10, color:'var(--label-4)', marginTop:3 }}>
                1 = tempo real · 60 = 1h · 1440 = 1 dia
              </p>
            </div>

            {/* Modelo */}
            <div>
              <label style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', display:'block', marginBottom:5 }}>
                Modelo Gemini
              </label>
              <select value={form.modelo || 'gemini-2.5-flash'}
                onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
                style={{ width:'100%', padding:'6px 10px', borderRadius:7, border:'0.5px solid var(--sep)', background:'var(--bg-2)', color:'var(--label)', fontSize:12, outline:'none' }}>
                {MODELOS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>

            {/* Ativo */}
            <div>
              <label style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', display:'block', marginBottom:5 }}>
                Status
              </label>
              <select value={String(form.ativo)}
                onChange={e => setForm(f => ({ ...f, ativo: e.target.value }))}
                style={{ width:'100%', padding:'6px 10px', borderRadius:7, border:'0.5px solid var(--sep)', background:'var(--bg-2)', color:'var(--label)', fontSize:12, outline:'none' }}>
                <option value="true">Ativado</option>
                <option value="false">Desativado</option>
              </select>
            </div>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={salvarConfig} disabled={salvando}
              style={{ padding:'6px 16px', borderRadius:8, background:'var(--accent)', color:'#000', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, opacity: salvando ? .5 : 1 }}>
              {salvando ? 'Salvando...' : 'Salvar e aplicar'}
            </button>
            <button onClick={() => { setEditando(false); setForm(config || {}) }}
              style={{ padding:'6px 12px', borderRadius:8, background:'transparent', color:'var(--label-3)', border:'0.5px solid var(--sep)', cursor:'pointer', fontSize:12 }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div style={{ padding:'16px 0', display:'flex', alignItems:'center', gap:8, color:'var(--label-4)', fontSize:12 }}>
          <RefreshCw size={14} className="animate-spin"/>
          Analisando dados com Gemini...
        </div>
      )}

      {/* Insights */}
      {data?.insights?.map((ins, i) => {
        const t = TIPO_COR[ins.tipo] || TIPO_COR.tendencia
        return (
          <div key={i} style={{ padding:'12px 14px', borderRadius:10, marginBottom:8, background: t.bg, border:`1px solid ${t.bdr}` }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:14, flexShrink:0 }}><TipoIcon tipo={ins.tipo} size={13} color={t.txt} /></span>
              <div style={{ flex:1 }}>
                <span style={{ fontWeight:600, fontSize:13, color: t.txt }}>{ins.titulo}</span>
                {ins.metrica && ins.metrica !== '—' && (
                  <span style={{ marginLeft:8, fontSize:11, fontFamily:'monospace', color: t.txt, opacity:.8 }}>{ins.metrica}</span>
                )}
              </div>
            </div>
            <p style={{ fontSize:12, color:'var(--label-2)', lineHeight:1.5, margin:'0 0 4px 22px' }}>{ins.descricao}</p>
            {ins.acao && (
              <p style={{ fontSize:11, color: t.txt, opacity:.7, margin:'0 0 0 22px', fontStyle:'italic' }}>→ {ins.acao}</p>
            )}
          </div>
        )
      })}

      {/* Resumo */}
      {data?.resumo && !loading && (
        <p style={{ fontSize:11, color:'var(--label-4)', marginTop:10, paddingTop:10, borderTop:'0.5px solid var(--sep)' }}>
          {data.resumo}
        </p>
      )}
    </div>
  )
}


// ── Health Panel — status real de cada serviço ───────────────────────────────
function HealthPanel({ api }) {
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [lastCheck, setLastCheck] = useState(null)
  const [checking,  setChecking]  = useState(false)

  const verificar = async (silencioso = false) => {
    if (!silencioso) setChecking(true)
    try {
      const r = await fetch(`${api}/api/dashboard/health`)
      if (r.ok) {
        const d = await r.json()
        setData(d)
        setLastCheck(new Date())
      }
    } catch {}
    setLoading(false)
    setChecking(false)
  }

  useEffect(() => {
    verificar()
    // Re-verifica a cada 60 segundos
    const i = setInterval(() => verificar(true), 60000)
    return () => clearInterval(i)
  }, [api])

  const STATUS_CONFIG = {
    online:        { label: 'Online',        cor: '#1D9E75', bg: 'rgba(29,158,117,0.1)',  dot: '#1D9E75' },
    degraded:      { label: 'Degradado',     cor: '#EF9F27', bg: 'rgba(239,159,39,0.1)',  dot: '#EF9F27' },
    offline:       { label: 'Offline',       cor: '#ef4444', bg: 'rgba(239,68,68,0.1)',   dot: '#ef4444' },
    auth_error:    { label: 'Erro de auth',  cor: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  dot: '#f59e0b' },
    unconfigured:  { label: 'Não config.',   cor: '#94a3b8', bg: 'rgba(148,163,184,0.1)', dot: '#94a3b8' },
  }

  const HEALTH_ICON = { 'WhatsApp': MessageCircle, 'Bling ERP': Monitor, 'Mercado Pago': CreditCard, 'Banco': Database }

  const globalCfg = data ? STATUS_CONFIG[data.status] || STATUS_CONFIG.degraded : null

  return (
    <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:12, padding:'18px 20px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--label)' }}>Status do sistema</span>
          {data && (
            <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:99, background: globalCfg.bg, color: globalCfg.cor }}>
              ● {globalCfg.label}
            </span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {lastCheck && (
            <span style={{ fontSize:10, color:'var(--label-4)' }}>
              {lastCheck.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
            </span>
          )}
          <button onClick={() => verificar()} disabled={checking}
            style={{ padding:'3px 8px', borderRadius:6, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', fontSize:11, color:'var(--label-3)', display:'flex', alignItems:'center', gap:4 }}>
            <RefreshCw size={11} className={checking ? 'animate-spin' : ''}/>
            {checking ? 'Verificando...' : 'Verificar'}
          </button>
        </div>
      </div>

      {/* Lista de serviços */}
      {loading && !data ? (
        <div style={{ fontSize:12, color:'var(--label-4)', textAlign:'center', padding:'16px 0' }}>Verificando serviços...</div>
      ) : data?.servicos?.map((s, i) => {
        const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.offline
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom: i < data.servicos.length - 1 ? '0.5px solid var(--sep)' : 'none' }}>
            { (() => { const Hic = HEALTH_ICON[s.nome] || Zap; return <Hic size={14} style={{color:'var(--label-3)'}}/>; })() }
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:12, fontWeight:500, color:'var(--label)' }}>{s.nome}</span>
                <span style={{ width:6, height:6, borderRadius:'50%', background: cfg.dot, display:'inline-block', flexShrink:0 }}/>
                <span style={{ fontSize:10, color: cfg.cor, fontWeight:600 }}>{cfg.label}</span>
              </div>
              <div style={{ fontSize:10, color:'var(--label-4)', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:260 }}>
                {s.detalhe}
              </div>
            </div>
            <div style={{ flexShrink:0, textAlign:'right' }}>
              <span style={{ fontSize:11, fontWeight:600, color: s.latencia < 500 ? '#1D9E75' : s.latencia < 1500 ? '#EF9F27' : '#ef4444' }}>
                {s.latencia}ms
              </span>
            </div>
          </div>
        )
      })}

      {data && (
        <div style={{ marginTop:10, paddingTop:8, borderTop:'0.5px solid var(--sep)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:10, color:'var(--label-4)' }}>Total: {data.total_ms}ms</span>
          <span style={{ fontSize:10, color:'var(--label-4)' }}>Atualiza automaticamente a cada 60s</span>
        </div>
      )}
    </div>
  )
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

        <HealthPanel api={api} />
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
