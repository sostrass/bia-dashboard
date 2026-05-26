import { useState, useEffect, useCallback, useRef } from 'react'
import {
  MessageSquare, ShoppingCart, Users, Zap, RefreshCw, TrendingUp,
  TrendingDown, Minus, AlertTriangle, CheckCircle, XCircle, Bell,
  ArrowRight, Star, Activity, DollarSign, Clock, ChevronRight,
  Package2, Wifi, WifiOff, BarChart3, Hash, Sparkles
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts'

// ── Helpers ───────────────────────────────────────────────────────────────────
const R   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmt = n => Number(n||0).toLocaleString('pt-BR')
const fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }) : '—'
const fmtTime = d => d ? new Date(d).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) : '—'

// IDs reais das situações
const SIT = {
  6:  { label:'Em Aberto',  cor:'#f59e0b' },
  9:  { label:'Atendido',   cor:'#4a9fff' },
  12: { label:'Cancelado',  cor:'#ef4444' },
  15: { label:'Verificado', cor:'#22c55e' },
}

// Canais
const CANAIS = {
  nuvemshop:   { label:'Nuvemshop',     cor:'#0070f3' },
  mercadolivre:{ label:'Mercado Livre', cor:'#f5a623' },
  shopee:      { label:'Shopee',        cor:'#EE4D2D' },
  tiktokshop:  { label:'TikTok Shop',   cor:'#010101' },
  shein:       { label:'Shein',         cor:'#c0392b' },
  bling:       { label:'Bling/WA',      cor:'#1D9E75' },
  whatsapp:    { label:'WhatsApp',      cor:'#25D366' },
}

// Dias da semana
const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
// Faixas de hora (0-23)
const HORAS = Array.from({length:24}, (_,i) => i)

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPI({ icon:Ic, label, value, sub, cor, trend, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:'var(--bg-2)', border:`1px solid ${hov&&onClick?'var(--sep)':'var(--sep)'}`, borderRadius:14, padding:'16px 18px', cursor:onClick?'pointer':'default', transition:'all .15s', transform:hov&&onClick?'translateY(-1px)':'none', boxShadow:hov&&onClick?'0 4px 20px rgba(0,0,0,.08)':'none' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:`${cor}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Ic size={16} style={{ color:cor }}/>
        </div>
        {trend !== undefined && (
          <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99,
            background: trend>0?'rgba(34,197,94,.1)':trend<0?'rgba(239,68,68,.1)':'var(--fill)',
            color: trend>0?'#22c55e':trend<0?'#ef4444':'var(--label-4)' }}>
            {trend>0?<TrendingUp size={10}/>:trend<0?<TrendingDown size={10}/>:<Minus size={10}/>}
            {trend>0?'+':''}{trend}%
          </div>
        )}
      </div>
      <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color:'var(--label)', letterSpacing:'-.5px', lineHeight:1, marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--label-4)' }}>{sub}</div>}
    </div>
  )
}

// ── Heatmap 24h × 7 dias ──────────────────────────────────────────────────────
function Heatmap({ data }) {
  // data: [{ dia: 0-6, hora: 0-23, total: n }]
  if (!data?.length) return (
    <div style={{ padding:'32px', textAlign:'center', color:'var(--label-4)', fontSize:12 }}>
      Sem dados de heatmap ainda. Acumula com o uso.
    </div>
  )

  const max = Math.max(...data.map(d => d.total), 1)
  const cell = {} // "dia-hora" → total
  data.forEach(d => { cell[`${d.dia}-${d.hora}`] = d.total })

  const getColor = (val) => {
    if (!val) return 'var(--fill)'
    const intensity = val / max
    if (intensity < 0.15) return 'rgba(0,212,170,.12)'
    if (intensity < 0.35) return 'rgba(0,212,170,.3)'
    if (intensity < 0.60) return 'rgba(0,212,170,.55)'
    if (intensity < 0.80) return 'rgba(0,212,170,.78)'
    return '#00d4aa'
  }

  // Horas de pico
  const hourTotals = HORAS.map(h => ({
    h, total: DIAS.reduce((s, _, d) => s + (cell[`${d}-${h}`] || 0), 0)
  }))
  const maxHour = hourTotals.reduce((a,b) => a.total>b.total?a:b, {h:0,total:0})

  // Dia de pico
  const dayTotals = DIAS.map((_, d) => ({
    d, total: HORAS.reduce((s, h) => s + (cell[`${d}-${h}`] || 0), 0)
  }))
  const maxDay = dayTotals.reduce((a,b) => a.total>b.total?a:b, {d:0,total:0})

  return (
    <div style={{ overflowX:'auto' }}>
      <div style={{ minWidth:640 }}>
        {/* Header horas */}
        <div style={{ display:'grid', gridTemplateColumns:'36px repeat(24, 1fr)', gap:2, marginBottom:3 }}>
          <div/>
          {HORAS.map(h => (
            <div key={h} style={{ textAlign:'center', fontSize:9, color: h===maxHour.h?'#00d4aa':'var(--label-4)', fontWeight:h===maxHour.h?700:400 }}>
              {h%3===0?`${h}h`:''}
            </div>
          ))}
        </div>

        {/* Grid */}
        {DIAS.map((dia, d) => (
          <div key={d} style={{ display:'grid', gridTemplateColumns:'36px repeat(24, 1fr)', gap:2, marginBottom:2 }}>
            <div style={{ fontSize:10, color: d===maxDay.d?'#00d4aa':'var(--label-4)', fontWeight:d===maxDay.d?700:400, display:'flex', alignItems:'center', paddingRight:4 }}>
              {dia}
            </div>
            {HORAS.map(h => {
              const val = cell[`${d}-${h}`] || 0
              return (
                <div key={h} title={val ? `${dia} ${h}h: ${val} msgs` : undefined}
                  style={{ aspectRatio:'1', borderRadius:3, background:getColor(val), border:'1px solid rgba(255,255,255,.04)', cursor:val?'default':'default', transition:'transform .1s' }}
                  onMouseEnter={e => { if(val) e.currentTarget.style.transform='scale(1.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform='scale(1)' }}
                />
              )
            })}
          </div>
        ))}

        {/* Legenda */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, justifyContent:'flex-end' }}>
          <span style={{ fontSize:10, color:'var(--label-4)' }}>Menos</span>
          {['rgba(0,212,170,.12)','rgba(0,212,170,.3)','rgba(0,212,170,.55)','rgba(0,212,170,.78)','#00d4aa'].map((c,i) => (
            <div key={i} style={{ width:12, height:12, borderRadius:2, background:c }}/>
          ))}
          <span style={{ fontSize:10, color:'var(--label-4)' }}>Mais</span>
        </div>
      </div>
    </div>
  )
}

// ── Alertas ────────────────────────────────────────────────────────────────────
function AlertCard({ alerta, onNavigate }) {
  const configs = {
    critico: { cor:'#ef4444', bg:'rgba(239,68,68,.08)', bdr:'rgba(239,68,68,.2)', icon:AlertTriangle },
    aviso:   { cor:'#f59e0b', bg:'rgba(245,158,11,.08)', bdr:'rgba(245,158,11,.2)', icon:AlertTriangle },
    info:    { cor:'#4a9fff', bg:'rgba(74,159,255,.08)',  bdr:'rgba(74,159,255,.2)', icon:Bell },
    sucesso: { cor:'#22c55e', bg:'rgba(34,197,94,.08)',   bdr:'rgba(34,197,94,.2)',  icon:CheckCircle },
  }
  const c = configs[alerta.nivel] || configs.info
  const Icon = c.icon
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, background:c.bg, border:`1px solid ${c.bdr}`, cursor:alerta.acao?'pointer':'default' }}
      onClick={() => alerta.acao && onNavigate(alerta.acao)}>
      <Icon size={14} style={{ color:c.cor, flexShrink:0 }}/>
      <span style={{ fontSize:12.5, color:'var(--label-2)', flex:1, lineHeight:1.4 }}>{alerta.titulo}</span>
      {alerta.acao && <ChevronRight size={13} style={{ color:c.cor, flexShrink:0 }}/>}
    </div>
  )
}

// ── Sparkline 24h ──────────────────────────────────────────────────────────────
function Spark24h({ data }) {
  // Preenche as 24 horas
  const now = new Date()
  const hrs = Array.from({length:24}, (_,i) => {
    const h = new Date(now); h.setHours(now.getHours() - 23 + i, 0, 0, 0)
    const match = data.find(d => new Date(d.hora).getHours() === h.getHours())
    return { h: h.getHours(), total: match ? parseInt(match.total) : 0 }
  })
  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={hrs} margin={{ top:5, right:0, left:0, bottom:0 }}>
        <defs>
          <linearGradient id="spark24" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c6af7" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#7c6af7" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="h" tick={{ fontSize:9, fill:'var(--label-4)' }} tickFormatter={v => v%6===0?`${v}h`:''} axisLine={false} tickLine={false}/>
        <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:8, fontSize:11 }} formatter={v=>[`${v} msgs`,'']}/>
        <Area type="monotone" dataKey="total" stroke="#7c6af7" strokeWidth={2} fill="url(#spark24)"/>
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Canal breakdown ───────────────────────────────────────────────────────────
function CanalBreakdown({ canais }) {
  if (!canais?.length) return <div style={{ padding:'20px', textAlign:'center', color:'var(--label-4)', fontSize:12 }}>Sem dados de canal</div>
  const total = canais.reduce((s, c) => s + parseInt(c.total||0), 0)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {canais.slice(0,6).map((c,i) => {
        const pct = total > 0 ? Math.round(parseInt(c.total) / total * 100) : 0
        const info = CANAIS[c.canal] || { label: c.canal, cor:'#888' }
        return (
          <div key={i}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:12, color:'var(--label-2)', fontWeight:500 }}>{info.label}</span>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:11, color:'var(--label-4)' }}>{fmt(c.total)}</span>
                <span style={{ fontSize:11, fontWeight:700, color:info.cor, minWidth:32, textAlign:'right' }}>{pct}%</span>
              </div>
            </div>
            <div style={{ height:5, borderRadius:99, background:'var(--fill)', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:99, background:info.cor, width:`${pct}%`, transition:'width .8s cubic-bezier(.4,0,.2,1)' }}/>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Pedidos recentes mini-lista ────────────────────────────────────────────────
function PedidosMini({ pedidos, onNavigate }) {
  if (!pedidos?.length) return <div style={{ padding:'20px', textAlign:'center', color:'var(--label-4)', fontSize:12 }}>Buscando pedidos...</div>
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {pedidos.map((p, i) => {
        const sit = SIT[p.situacaoId] || SIT[9]
        const canal = CANAIS[p.canal] || CANAIS.bling
        return (
          <div key={i} onClick={() => onNavigate('pedidos')}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom: i<pedidos.length-1?'1px solid var(--sep)':'none', cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.opacity='.75'}
            onMouseLeave={e => e.currentTarget.style.opacity='1'}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:sit.cor, flexShrink:0 }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:12.5, fontWeight:700, color:'var(--accent)' }}>#{p.numero}</span>
                <span style={{ fontSize:11, color:'var(--label-4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>{p.contato}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                <span style={{ fontSize:9.5, padding:'1px 5px', borderRadius:99, background:`${canal.cor}15`, color:canal.cor, fontWeight:600 }}>{canal.label}</span>
                <span style={{ fontSize:10, color:'var(--label-4)' }}>{fmtDate(p.data)}</span>
              </div>
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--label)', flexShrink:0 }}>{R(p.total)}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Top clientes ──────────────────────────────────────────────────────────────
function TopClientes({ clientes, onNavigate }) {
  if (!clientes?.length) return <div style={{ padding:'20px', textAlign:'center', color:'var(--label-4)', fontSize:12 }}>Sem dados</div>
  const max = Math.max(...clientes.map(c => parseInt(c.msgs||0)), 1)
  const paleta = ['#7c6af7','#00d4aa','#f59e0b','#22c55e','#4a9fff']
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {clientes.map((c, i) => {
        const cor = paleta[i % paleta.length]
        const pct = Math.round(parseInt(c.msgs||0) / max * 100)
        const init = (c.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer' }}
            onClick={() => onNavigate('conversas')}
            onMouseEnter={e=>e.currentTarget.style.opacity='.8'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:`${cor}20`, border:`1.5px solid ${cor}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:cor, flexShrink:0 }}>{init}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:12, color:'var(--label-2)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>{c.nome || `+55${c.telefone?.slice(-8)}`}</span>
                <span style={{ fontSize:11, color:'var(--label-4)' }}>{fmt(c.msgs)} msgs</span>
              </div>
              <div style={{ height:3, borderRadius:99, background:'var(--fill)' }}>
                <div style={{ height:'100%', borderRadius:99, background:cor, width:`${pct}%` }}/>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Card container ──────────────────────────────────────────────────────────────
function Card({ title, icon:Ic, children, action, style={} }) {
  return (
    <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, padding:'16px 18px', ...style }}>
      {(title||action) && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          {title && (
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              {Ic && <Ic size={13} style={{ color:'var(--label-4)' }}/>}
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)' }}>{title}</span>
            </div>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function PageDashboard({ api, onNavigate: navProp }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpd, setLastUpd] = useState(null)
  const timerRef = useRef()

  // onNavigate pode vir via prop ou via Shell sessionStorage
  const nav = navProp || ((page) => {
    // fallback: tenta navegar via Shell state — não possível direto, mas ok
    window.dispatchEvent(new CustomEvent('bia-navigate', { detail: page }))
  })

  const carregar = useCallback(async (silent=false) => {
    if (!silent) setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/dashboard-summary`)
      if (r.ok) {
        setData(await r.json())
        setLastUpd(new Date())
      }
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(() => {
    carregar()
    timerRef.current = setInterval(() => carregar(true), 60000) // refresh a cada 60s
    return () => clearInterval(timerRef.current)
  }, [carregar])

  if (loading && !data) return (
    <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
      <RefreshCw size={22} style={{ color:'var(--accent)', animation:'spin 1s linear infinite' }}/>
      <span style={{ fontSize:13, color:'var(--label-4)' }}>Carregando dashboard...</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const k = data?.kpis || {}
  const alertas = data?.alertas || []

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'22px 26px', background:'var(--bg)' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--label)', margin:0, letterSpacing:'-.5px' }}>Dashboard</h1>
          <p style={{ fontSize:12, color:'var(--label-4)', margin:'3px 0 0' }}>
            {lastUpd ? `Atualizado ${lastUpd.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit',second:'2-digit'})}` : 'Carregando...'}
            {' · '}atualiza a cada 60s
          </p>
        </div>
        <button onClick={() => carregar()} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, border:'1px solid var(--sep)', background:'var(--bg-2)', color:'var(--label-3)', cursor:'pointer', fontSize:12, fontWeight:500 }}>
          <RefreshCw size={13} style={{ animation:loading?'spin 1s linear infinite':undefined }}/> Atualizar
        </button>
      </div>

      {/* Alertas — aparecem PRIMEIRO se existirem */}
      {alertas.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20, animation:'fadeIn .3s ease-out' }}>
          {alertas.map((a, i) => <AlertCard key={i} alerta={a} onNavigate={nav}/>)}
        </div>
      )}

      {/* KPIs — 5 colunas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        <KPI icon={MessageSquare} label="Conversas hoje" value={fmt(k.conversas_hoje)} sub={`${fmt(k.conversas_ontem)} ontem`} cor="#7c6af7" trend={k.trend_conversas} onClick={() => nav('conversas')}/>
        <KPI icon={Activity}     label="Mensagens hoje" value={fmt(k.msgs_hoje)} sub={`${fmt(k.msgs_semana)} semana`} cor="#4a9fff" trend={k.trend_msgs} onClick={() => nav('conversas')}/>
        <KPI icon={ShoppingCart} label="Pedidos hoje" value={fmt(k.pedidos_hoje)} sub={`${fmt(k.pedidos_semana)} semana`} cor="#22c55e" onClick={() => nav('pedidos')}/>
        <KPI icon={DollarSign}   label="Receita mês" value={`R$ ${Number(k.receita_mes||0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}`} cor="#00d4aa" onClick={() => nav('caixa')}/>
        <KPI icon={Zap}          label="IA saúde" value={`${data?.ia?.taxa ?? 100}%`} sub={data?.ia?.custo_hoje > 0 ? `$${Number(data.ia.custo_hoje).toFixed(4)} hoje` : undefined} cor={data?.ia?.taxa >= 90?'#22c55e':data?.ia?.taxa >= 70?'#f59e0b':'#ef4444'} onClick={() => nav('llmconfig')}/>
      </div>

      {/* Sessões ativas — barra rápida */}
      {data?.sessoes && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
          {[
            { lb:'Sessões ativas agora', val:fmt(data.sessoes.ativas||0), cor:'#7c6af7', sub:'últ. 30min' },
            { lb:'Com carrinho ativo',   val:fmt(data.sessoes.com_carrinho||0), cor:'#f59e0b', sub:'potencial de compra' },
            { lb:'Fila humano',          val:fmt(data.sessoes.humano||0), cor:data.sessoes.humano>0?'#ef4444':'#22c55e', sub:data.sessoes.humano>0?'REQUER ATENÇÃO':'Todos atendidos pela IA' },
          ].map(k => (
            <div key={k.lb} onClick={() => nav('conversas')}
              style={{ padding:'12px 16px', borderRadius:12, background:'var(--bg-2)', border:`1px solid ${k.cor}25`, cursor:'pointer', display:'flex', alignItems:'center', gap:12, transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.border=`1px solid ${k.cor}50`; e.currentTarget.style.background=`${k.cor}08` }}
              onMouseLeave={e => { e.currentTarget.style.border=`1px solid ${k.cor}25`; e.currentTarget.style.background='var(--bg-2)' }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:k.cor, flexShrink:0,
                ...(k.lb==='Fila humano'&&data.sessoes.humano>0 ? { animation:'pulse 1.5s ease infinite', boxShadow:`0 0 0 3px ${k.cor}30` } : {}) }}/>
              <div>
                <div style={{ fontSize:20, fontWeight:800, color:k.cor, lineHeight:1 }}>{k.val}</div>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--label-3)', marginTop:2 }}>{k.lb}</div>
                <div style={{ fontSize:10, color:'var(--label-4)' }}>{k.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap + Sparkline */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:14, marginBottom:14 }}>
        <Card title="Heatmap de mensagens" icon={BarChart3}
          action={
            <div style={{ display:'flex', gap:8, fontSize:11, color:'var(--label-4)' }}>
              {data?.heatmap?.length > 0 && (() => {
                const max = Math.max(...data.heatmap.map(d => d.total), 1)
                const peak = data.heatmap.reduce((a,b) => a.total>b.total?a:b)
                return <span>Pico: <strong style={{ color:'#00d4aa' }}>{DIAS[peak.dia]} {peak.hora}h ({fmt(peak.total)} msgs)</strong></span>
              })()}
            </div>
          }>
          <div style={{ marginBottom:6, fontSize:11.5, color:'var(--label-4)', lineHeight:1.5 }}>
            Concentração de mensagens por hora e dia da semana nos últimos 30 dias. Útil para planejar equipe e horários de campanha.
          </div>
          <Heatmap data={data?.heatmap || []}/>
        </Card>
      </div>

      {/* Grid 3 colunas: Sparkline 24h | Canais | Top clientes */}
      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap:14, marginBottom:14 }}>
        <Card title="Mensagens — últimas 24h" icon={Activity}>
          <Spark24h data={data?.sparkline24h || []}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
            {[
              { lb:'Recebidas hoje',   v:fmt(k.msgs_hoje),   cor:'#7c6af7' },
              { lb:'Semana total',     v:fmt(k.msgs_semana), cor:'#4a9fff' },
            ].map(m=>(
              <div key={m.lb} style={{ padding:'8px 10px', borderRadius:8, background:'var(--bg)', border:'1px solid var(--sep)' }}>
                <div style={{ fontSize:16, fontWeight:800, color:m.cor, lineHeight:1 }}>{m.v}</div>
                <div style={{ fontSize:10, color:'var(--label-4)', marginTop:2 }}>{m.lb}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Volume por canal" icon={BarChart3}>
          <CanalBreakdown canais={data?.canais || []}/>
        </Card>

        <Card title="Clientes mais ativos" icon={Users}
          action={<button onClick={() => nav('conversas')} style={{ fontSize:11, color:'var(--accent)', border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>Ver todos <ArrowRight size={10}/></button>}>
          <TopClientes clientes={data?.topClientes || []} onNavigate={nav}/>
        </Card>
      </div>

      {/* Pedidos recentes + IA status */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:14 }}>
        <Card title="Pedidos recentes" icon={ShoppingCart}
          action={<button onClick={() => nav('pedidos')} style={{ fontSize:11, color:'var(--accent)', border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>Ver todos <ArrowRight size={10}/></button>}>
          <PedidosMini pedidos={data?.pedidosRecentes || []} onNavigate={nav}/>
        </Card>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* IA saúde card */}
          <Card title="Inteligência Artificial" icon={Zap}
            action={<button onClick={() => nav('llmconfig')} style={{ fontSize:11, color:'var(--accent)', border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>Config <ArrowRight size={10}/></button>}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              {[
                { lb:'Taxa sucesso', v:`${data?.ia?.taxa ?? 100}%`, cor:data?.ia?.taxa>=90?'#22c55e':data?.ia?.taxa>=70?'#f59e0b':'#ef4444' },
                { lb:'Tokens hoje',  v:fmt(data?.ia?.tokens_hoje), cor:'#a78bfa' },
              ].map(m=>(
                <div key={m.lb} style={{ padding:'10px 12px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--sep)', textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:m.cor, lineHeight:1 }}>{m.v}</div>
                  <div style={{ fontSize:10, color:'var(--label-4)', marginTop:3 }}>{m.lb}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:'var(--label-4)', display:'flex', alignItems:'center', gap:6 }}>
              <Clock size={11}/>
              Última chamada: {fmtTime(data?.ia?.ultima)}
            </div>
          </Card>

          {/* Alertas pendentes ou status verde */}
          <Card style={{ flex:1 }}>
            {alertas.length === 0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'12px 0' }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(34,197,94,.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <CheckCircle size={20} style={{ color:'#22c55e' }}/>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--label)', marginBottom:3 }}>Tudo operacional</div>
                  <div style={{ fontSize:11, color:'var(--label-4)', lineHeight:1.5 }}>Sem alertas ativos.<br/>IA respondendo normalmente.</div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:10 }}>{alertas.length} alerta{alertas.length!==1?'s':''} ativo{alertas.length!==1?'s':''}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {alertas.map((a,i) => <AlertCard key={i} alerta={a} onNavigate={nav}/>)}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 0 currentColor}50%{box-shadow:0 0 0 6px transparent}}`}</style>
    </div>
  )
}
