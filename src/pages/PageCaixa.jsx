import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RefreshCw, TrendingUp, TrendingDown, Minus, DollarSign, CreditCard,
  Clock, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, ArrowUpDown,
  X, ExternalLink, Copy, Check, BarChart3, Wallet, Target, Zap,
  Calendar, ArrowRight, Activity, ChevronRight
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ComposedChart, Line, PieChart, Pie, Legend
} from 'recharts'

// ── Helpers ────────────────────────────────────────────────────────────────────
const R   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const Rk  = n => n >= 1000 ? `R$ ${(n/1000).toFixed(1)}k` : R(n)
const fmt = n => Number(n||0).toLocaleString('pt-BR')
const fmtDate = d => d ? new Date(d+'T12:00:00').toLocaleDateString('pt-BR') : '—'
const fmtDT   = d => d ? new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'

// ── Canais ────────────────────────────────────────────────────────────────────
const CANAIS = {
  nuvemshop:   { label:'Nuvemshop',     cor:'#0070f3' },
  mercadolivre:{ label:'Mercado Livre', cor:'#f5a623' },
  shopee:      { label:'Shopee',        cor:'#EE4D2D' },
  tiktokshop:  { label:'TikTok Shop',   cor:'#333'    },
  shein:       { label:'Shein',         cor:'#c0392b' },
  bling:       { label:'Bling/WA',      cor:'#1D9E75' },
  whatsapp:    { label:'WhatsApp',      cor:'#25D366' },
}

// ── KPI Card com sparkline BG ─────────────────────────────────────────────────
function KPI({ icon:Ic, label, value, sub, cor, trend, prefix='', onClick, destaque=false }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:'var(--bg-2)', border:`1px solid ${destaque?cor+'40':'var(--sep)'}`, borderRadius:14, padding:'16px 18px', cursor:onClick?'pointer':'default', transition:'all .15s', transform:hov&&onClick?'translateY(-1px)':'none', boxShadow:destaque?`0 0 0 1px ${cor}25`:hov&&onClick?'0 4px 20px rgba(0,0,0,.08)':'none', position:'relative', overflow:'hidden' }}>
      {destaque && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:cor, borderRadius:'14px 14px 0 0' }}/>}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ width:34, height:34, borderRadius:9, background:`${cor}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Ic size={15} style={{ color:cor }}/>
        </div>
        {trend !== undefined && (
          <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, background:trend>0?'rgba(34,197,94,.1)':trend<0?'rgba(239,68,68,.1)':'var(--fill)', color:trend>0?'#22c55e':trend<0?'#ef4444':'var(--label-4)' }}>
            {trend>0?<TrendingUp size={10}/>:trend<0?<TrendingDown size={10}/>:<Minus size={10}/>}
            {trend>0?'+':''}{trend}%
          </div>
        )}
      </div>
      <div style={{ fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color:cor==='var(--label)'?'var(--label)':cor, letterSpacing:'-.5px', lineHeight:1, marginBottom:4 }}>{prefix}{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--label-4)' }}>{sub}</div>}
    </div>
  )
}

// ── Forecast gauge ────────────────────────────────────────────────────────────
function ForecastGauge({ atual, forecast, diasPassados, diasMes }) {
  const pct = diasMes > 0 ? Math.round((diasPassados / diasMes) * 100) : 0
  const pctAtual = forecast > 0 ? Math.min(100, Math.round((atual / forecast) * 100)) : 0
  const onTrack = pctAtual >= pct - 5

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {/* Progresso do mês */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
        <span style={{ fontSize:11, color:'var(--label-4)' }}>Progresso do mês</span>
        <span style={{ fontSize:11, fontWeight:700, color:'var(--label-3)' }}>Dia {diasPassados} de {diasMes}</span>
      </div>
      <div style={{ height:6, borderRadius:99, background:'var(--fill)', position:'relative', overflow:'hidden' }}>
        {/* Linha de tempo (onde estamos no mês) */}
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${pct}%`, background:'var(--sep)', zIndex:1 }}/>
        {/* Receita atual */}
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${pctAtual}%`, background:onTrack?'#22c55e':'#f59e0b', borderRadius:99, zIndex:2, transition:'width .8s' }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <div>
          <span style={{ fontSize:12.5, fontWeight:800, color:'var(--accent)' }}>{Rk(atual)}</span>
          <span style={{ fontSize:11, color:'var(--label-4)' }}> realizado</span>
        </div>
        <div style={{ textAlign:'right' }}>
          <span style={{ fontSize:11, color:'var(--label-4)' }}>forecast </span>
          <span style={{ fontSize:12.5, fontWeight:700, color:onTrack?'#22c55e':'#f59e0b' }}>{Rk(forecast)}</span>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:8, background:onTrack?'rgba(34,197,94,.07)':'rgba(245,158,11,.07)', border:`1px solid ${onTrack?'rgba(34,197,94,.2)':'rgba(245,158,11,.2)'}` }}>
        {onTrack ? <CheckCircle size={12} style={{ color:'#22c55e' }}/> : <AlertTriangle size={12} style={{ color:'#f59e0b' }}/>}
        <span style={{ fontSize:11.5, fontWeight:600, color:onTrack?'#22c55e':'#f59e0b' }}>
          {onTrack ? 'No ritmo esperado para o forecast' : `${Math.max(0,pct-pctAtual)}% abaixo do ritmo esperado`}
        </span>
      </div>
    </div>
  )
}

// ── Canal breakdown barras ────────────────────────────────────────────────────
function CanalChart({ canais }) {
  if (!canais?.length) return <div style={{ padding:'20px', textAlign:'center', color:'var(--label-4)', fontSize:12 }}>Sem dados por canal</div>
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {canais.map((c,i) => {
        const info = CANAIS[c.canal] || { label:c.canal, cor:'#888' }
        return (
          <div key={i}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:info.cor, flexShrink:0 }}/>
                <span style={{ fontSize:12.5, fontWeight:500, color:'var(--label-2)' }}>{info.label}</span>
              </div>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <span style={{ fontSize:11, color:'var(--label-4)' }}>{c.pedidos} pedidos</span>
                <span style={{ fontSize:12.5, fontWeight:700, color:info.cor }}>{c.pct}%</span>
                <span style={{ fontSize:12, fontWeight:700, color:'var(--label)', minWidth:80, textAlign:'right' }}>{Rk(c.receita)}</span>
              </div>
            </div>
            <div style={{ height:6, borderRadius:99, background:'var(--fill)', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:99, background:info.cor, width:`${c.pct}%`, transition:'width .8s cubic-bezier(.4,0,.2,1)' }}/>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Conta row ─────────────────────────────────────────────────────────────────
function ContaRow({ conta, onSelect }) {
  const sitLabel = { 1:'Aberta', 2:'Paga', 3:'Cancelada' }
  const sitCor   = { 1:'#f59e0b', 2:'#22c55e', 3:'#ef4444' }
  const vencida  = conta.vencida
  const s = conta.situacao
  return (
    <div onClick={() => onSelect(conta)}
      onMouseEnter={e=>e.currentTarget.style.background='var(--fill)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
      style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 14px', borderBottom:'1px solid var(--sep)', cursor:'pointer', transition:'background .08s' }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:vencida?'#ef4444':sitCor[s]||'#888', flexShrink:0 }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12.5, fontWeight:500, color:'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180 }}>{conta.contato || '—'}</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
          <span style={{ fontSize:10, fontWeight:700, padding:'1px 5px', borderRadius:4, background:`${sitCor[s]||'#888'}15`, color:sitCor[s]||'#888' }}>{sitLabel[s]||`${s}`}</span>
          {vencida && <span style={{ fontSize:10, fontWeight:700, color:'#ef4444' }}>⚠️ Vencida</span>}
          <span style={{ fontSize:10, color:'var(--label-4)' }}>{fmtDate(conta.vencimento)}</span>
        </div>
      </div>
      <span style={{ fontSize:13, fontWeight:700, color:s===2?'#22c55e':'var(--label)', flexShrink:0 }}>{R(conta.valor)}</span>
      <ChevronRight size={12} style={{ color:'var(--label-4)', flexShrink:0 }}/>
    </div>
  )
}

// ── Drawer conta ──────────────────────────────────────────────────────────────
function ContaSheet({ conta, onClose }) {
  const [copied, setCopied] = useState(false)
  const cp = text => { navigator.clipboard.writeText(String(text)); setCopied(true); setTimeout(()=>setCopied(false),2000) }
  const sitLabel = { 1:'Aberta', 2:'Paga', 3:'Cancelada' }
  const sitCor   = { 1:'#f59e0b', 2:'#22c55e', 3:'#ef4444' }
  const s = conta.situacao
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:40, backdropFilter:'blur(3px)' }}/>
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:400, zIndex:50, background:'var(--bg-2)', borderLeft:'1px solid var(--sep)', display:'flex', flexDirection:'column', boxShadow:'-24px 0 80px rgba(0,0,0,.35)' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--sep)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <h3 style={{ fontSize:15, fontWeight:800, color:'var(--label)', margin:0 }}>Conta a receber</h3>
            <span style={{ fontSize:11, color:'var(--label-4)' }}>ID {conta.id}</span>
          </div>
          <button onClick={onClose} style={{ padding:7, borderRadius:9, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', display:'flex' }}>
            <X size={14}/>
          </button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'20px 22px' }}>
          {/* Valor destaque */}
          <div style={{ textAlign:'center', padding:'20px', borderRadius:14, background:s===2?'rgba(34,197,94,.08)':conta.vencida?'rgba(239,68,68,.08)':'var(--bg)', border:`1px solid ${s===2?'rgba(34,197,94,.2)':conta.vencida?'rgba(239,68,68,.2)':'var(--sep)'}`, marginBottom:16 }}>
            <div style={{ fontSize:32, fontWeight:800, color:sitCor[s]||'var(--accent)', letterSpacing:'-.5px' }}>{R(conta.valor)}</div>
            <div style={{ marginTop:8 }}>
              <span style={{ fontSize:12, fontWeight:700, padding:'3px 12px', borderRadius:99, background:`${sitCor[s]||'#888'}15`, color:sitCor[s]||'#888' }}>
                {sitLabel[s]||`Status ${s}`}
              </span>
              {conta.vencida && <span style={{ fontSize:12, fontWeight:700, color:'#ef4444', marginLeft:8 }}>⚠️ Vencida</span>}
            </div>
          </div>
          {/* Detalhes */}
          <div style={{ background:'var(--bg)', borderRadius:12, border:'1px solid var(--sep)', overflow:'hidden' }}>
            {[
              ['Cliente',      conta.contato||'—',                         false],
              ['Vencimento',   fmtDate(conta.vencimento),                  false],
              ['Emissão',      fmtDate(conta.dataEmissao),                 false],
              ['Nº Pedido',    conta.origem ? `#${conta.origem}` : '—',    false],
              ['ID Bling',     String(conta.id),                           true ],
            ].map(([lb,vl,mono],i,arr) => (
              <div key={lb} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderBottom:i<arr.length-1?'1px solid var(--sep)':'none' }}>
                <span style={{ fontSize:12, color:'var(--label-3)' }}>{lb}</span>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ fontSize:12.5, fontWeight:600, color:'var(--label)', fontFamily:mono?'monospace':'inherit' }}>{vl}</span>
                  {mono && <button onClick={()=>cp(vl)} style={{ padding:'1px 5px', borderRadius:4, border:'1px solid var(--sep)', background:'transparent', color:'var(--label-4)', cursor:'pointer', fontSize:9, display:'flex' }}>
                    {copied?<Check size={9} style={{color:'#22c55e'}}/>:<Copy size={9}/>}
                  </button>}
                </div>
              </div>
            ))}
          </div>
          <a href={`https://www.bling.com.br/contas.php#/contas/${conta.id}`} target="_blank" rel="noreferrer"
            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', textDecoration:'none', fontSize:12.5, fontWeight:500, marginTop:12 }}>
            <ExternalLink size={13}/> Ver no Bling
          </a>
        </div>
      </div>
    </>
  )
}

// ── Tooltip customizado ────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <div style={{ fontWeight:700, color:'var(--label)', marginBottom:6 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, display:'flex', gap:8, alignItems:'center' }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight:700 }}>{p.name==='Receita'?Rk(p.value):p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function PageCaixa({ api }) {
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('visao') // visao|contas|canais
  const [sortContas, setSortContas] = useState('vencimento')
  const [filtroContas, setFiltroContas] = useState('todos') // todos|abertas|pagas|vencidas
  const [sel,      setSel]      = useState(null)
  const [periodo,  setPeriodo]  = useState('30') // '7'|'30'

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/financeiro-intel`)
      if (r.ok) setData(await r.json())
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  const k = data?.kpis || {}
  const serie = periodo === '7' ? (data?.serie30||[]).slice(-7) : (data?.serie30||[])

  // Contas filtradas
  const contas = (data?.contas || []).filter(c => {
    if (filtroContas === 'abertas')  return c.situacao === 1 && !c.vencida
    if (filtroContas === 'pagas')    return c.situacao === 2
    if (filtroContas === 'vencidas') return c.vencida
    return true
  }).sort((a,b) => {
    if (sortContas === 'valor')     return Number(b.valor) - Number(a.valor)
    if (sortContas === 'vencimento') {
      if (!a.vencimento) return 1; if (!b.vencimento) return -1
      return new Date(a.vencimento) - new Date(b.vencimento)
    }
    return 0
  })

  if (loading && !data) return (
    <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
      <RefreshCw size={22} style={{ color:'var(--accent)', animation:'spin 1s linear infinite' }}/>
      <span style={{ fontSize:13, color:'var(--label-4)' }}>Carregando dados financeiros...</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'22px 26px', background:'var(--bg)' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--label)', margin:0, letterSpacing:'-.5px' }}>Fluxo de Caixa</h1>
          <p style={{ fontSize:12, color:'var(--label-4)', margin:'3px 0 0' }}>
            {data?.geradoEm ? `Atualizado ${fmtDT(data.geradoEm)}` : 'Carregando...'}
          </p>
        </div>
        <button onClick={carregar} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, border:'1px solid var(--sep)', background:'var(--bg-2)', color:'var(--label-3)', cursor:'pointer', fontSize:12, fontWeight:500 }}>
          <RefreshCw size={13} style={{ animation:loading?'spin 1s linear infinite':undefined }}/> Atualizar
        </button>
      </div>

      {/* KPI Grid — 2 linhas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:14 }}>
        <KPI icon={DollarSign}    label="Receita este mês"    value={Rk(k.receita_mes)}      cor="#00d4aa" trend={k.trend_mes}  sub={`vs R$ ${(k.receita_mes_ant/1000).toFixed(1)}k mês ant.`} destaque/>
        <KPI icon={Calendar}      label="Receita hoje"        value={Rk(k.receita_hoje)}     cor="#7c6af7" sub={`Média/dia: ${Rk(k.media_dia)}`}/>
        <KPI icon={Activity}      label="Ticket médio"        value={Rk(k.ticket_medio)}     cor="#4a9fff" sub={`${fmt(k.pedidos_total)} pedidos`}/>
        <KPI icon={Target}        label="Forecast do mês"     value={Rk(k.forecast_mes)}     cor="#f59e0b" sub={`${k.dias_passados} de ${k.dias_mes} dias`}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <KPI icon={Wallet}        label="A receber total"     value={Rk(k.a_receber)}        cor="#22c55e" sub={`${Rk(k.a_receber_30d)} vence em 30d`}/>
        <KPI icon={AlertTriangle} label="Vencidos"            value={Rk(k.vencidos)}         cor={k.vencidos>0?'#ef4444':'#22c55e'} sub={k.vencidos>0?'Cobrar urgente':'Nenhum vencido'}/>
        <KPI icon={CreditCard}    label="MP PIX"              value={Rk(k.mp_pix)}           cor="#00d4aa" sub={`${fmt(k.mp_count)} transações/30d`}/>
        <KPI icon={CreditCard}    label="MP Cartão"           value={Rk(k.mp_cartao)}        cor="#4a9fff" sub="últimos 30 dias"/>
      </div>

      {/* Forecast gauge */}
      <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, padding:'16px 20px', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:14 }}>
          <Target size={13} style={{ color:'var(--label-4)' }}/>
          <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)' }}>Forecast do mês</span>
        </div>
        <ForecastGauge
          atual={k.receita_mes}
          forecast={k.forecast_mes}
          diasPassados={k.dias_passados}
          diasMes={k.dias_mes}
        />
      </div>

      {/* Tabs principais */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--sep)', marginBottom:16 }}>
        {[['visao','Visão Geral'],['canais','Por Canal'],['contas','Contas a Receber']].map(([id,lb]) => (
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'9px 18px', fontSize:13, fontWeight:500, border:'none', background:'transparent', cursor:'pointer', color:tab===id?'var(--accent)':'var(--label-3)', borderBottom:`2px solid ${tab===id?'var(--accent)':'transparent'}`, marginBottom:-1, whiteSpace:'nowrap' }}>
            {lb}
          </button>
        ))}
      </div>

      {/* TAB: VISÃO GERAL */}
      {tab==='visao' && <>
        {/* Seletor período */}
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
          <div style={{ display:'flex', borderRadius:8, border:'1px solid var(--sep)', overflow:'hidden' }}>
            {[['7','7 dias'],['30','30 dias']].map(([v,lb]) => (
              <button key={v} onClick={()=>setPeriodo(v)} style={{ padding:'5px 14px', border:'none', background:periodo===v?'var(--accent-dim)':'transparent', color:periodo===v?'var(--accent)':'var(--label-3)', cursor:'pointer', fontSize:12, fontWeight:periodo===v?700:400 }}>{lb}</button>
            ))}
          </div>
        </div>

        {/* Área chart receita */}
        <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, padding:'16px 18px', marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <BarChart3 size={13} style={{ color:'var(--label-4)' }}/>
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)' }}>Receita diária — {periodo} dias</span>
            </div>
            <span style={{ fontSize:12, color:'var(--label-4)' }}>Total: <strong style={{ color:'var(--accent)' }}>{Rk(serie.reduce((s,d)=>s+d.receita,0))}</strong></span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={serie}>
              <defs>
                <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize:9.5, fill:'var(--label-4)' }} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="receita" tick={{ fontSize:9.5, fill:'var(--label-4)' }} axisLine={false} tickLine={false} width={44} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
              <YAxis yAxisId="pedidos" orientation="right" tick={{ fontSize:9.5, fill:'var(--label-4)' }} axisLine={false} tickLine={false} width={30}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area yAxisId="receita" type="monotone" dataKey="receita" name="Receita" stroke="#00d4aa" strokeWidth={2} fill="url(#gRec)"/>
              <Bar yAxisId="pedidos" dataKey="pedidos" name="Pedidos" fill="#7c6af715" radius={[3,3,0,0]}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* MP breakdown */}
        {k.mp_total > 0 && (
          <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, padding:'16px 18px', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:14 }}>
              <CreditCard size={13} style={{ color:'var(--label-4)' }}/>
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)' }}>Mercado Pago — últimos 30 dias</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { lb:'Total MP',   v:Rk(k.mp_total),   cor:'#00d4aa' },
                { lb:'Via PIX',    v:Rk(k.mp_pix),     cor:'#22c55e' },
                { lb:'Via Cartão', v:Rk(k.mp_cartao),  cor:'#4a9fff' },
              ].map(m => (
                <div key={m.lb} style={{ padding:'10px 12px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--sep)', textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:800, color:m.cor, lineHeight:1, marginBottom:3 }}>{m.v}</div>
                  <div style={{ fontSize:10, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.05em' }}>{m.lb}</div>
                </div>
              ))}
            </div>
            {/* Barra PIX vs Cartão */}
            {k.mp_total > 0 && (
              <div style={{ marginTop:14 }}>
                <div style={{ display:'flex', height:10, borderRadius:99, overflow:'hidden', gap:2 }}>
                  <div style={{ background:'#22c55e', flex:k.mp_pix, transition:'flex .8s' }}/>
                  <div style={{ background:'#4a9fff', flex:k.mp_cartao, transition:'flex .8s' }}/>
                  {k.mp_total-k.mp_pix-k.mp_cartao > 0 && <div style={{ background:'var(--label-4)', flex:k.mp_total-k.mp_pix-k.mp_cartao }}/>}
                </div>
                <div style={{ display:'flex', gap:16, marginTop:6, fontSize:10, color:'var(--label-4)' }}>
                  <span>🟢 PIX {k.mp_total>0?Math.round(k.mp_pix/k.mp_total*100):0}%</span>
                  <span>🔵 Cartão {k.mp_total>0?Math.round(k.mp_cartao/k.mp_total*100):0}%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </>}

      {/* TAB: CANAIS */}
      {tab==='canais' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, padding:'16px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:14 }}>
              <BarChart3 size={13} style={{ color:'var(--label-4)' }}/>
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)' }}>Receita por canal</span>
            </div>
            <CanalChart canais={data?.canais || []}/>
          </div>
          <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, padding:'16px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:14 }}>
              <Activity size={13} style={{ color:'var(--label-4)' }}/>
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)' }}>Pedidos por canal</span>
            </div>
            {data?.canais?.length > 0 && (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.canais} layout="vertical" margin={{ left:0, right:20 }}>
                  <XAxis type="number" tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="canal" tick={{ fontSize:10, fill:'var(--label-3)' }} axisLine={false} tickLine={false} width={80}
                    tickFormatter={v => CANAIS[v]?.label || v}/>
                  <Tooltip formatter={(v,n) => [v, 'Pedidos']} contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:9, fontSize:11 }}/>
                  <Bar dataKey="pedidos" radius={[0,4,4,0]}>
                    {(data?.canais||[]).map((c,i) => <Cell key={i} fill={CANAIS[c.canal]?.cor || '#888'} opacity={0.8}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* TAB: CONTAS */}
      {tab==='contas' && <>
        <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center', flexWrap:'wrap' }}>
          {[['todos','Todas',data?.contas?.length||0,'#888'],['abertas','Abertas',data?.contas?.filter(c=>c.situacao===1&&!c.vencida).length||0,'#f59e0b'],['vencidas','Vencidas',data?.contas?.filter(c=>c.vencida).length||0,'#ef4444'],['pagas','Pagas',data?.contas?.filter(c=>c.situacao===2).length||0,'#22c55e']].map(([k,lb,ct,cor]) => (
            <button key={k} onClick={()=>setFiltroContas(k)} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:99, fontSize:12, fontWeight:filtroContas===k?700:500, cursor:'pointer', border:`1px solid ${filtroContas===k?cor:'var(--sep)'}`, background:filtroContas===k?`${cor}15`:'var(--bg-2)', color:filtroContas===k?cor:'var(--label-3)' }}>
              {lb} <span style={{ fontSize:10, fontWeight:700, padding:'0 4px', borderRadius:99, background:filtroContas===k?`${cor}25`:'var(--fill)', color:filtroContas===k?cor:'var(--label-4)' }}>{ct}</span>
            </button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
            {[['vencimento','Vencimento'],['valor','Valor']].map(([k,lb]) => (
              <button key={k} onClick={()=>setSortContas(k)} style={{ padding:'5px 10px', borderRadius:8, fontSize:11, fontWeight:sortContas===k?700:400, cursor:'pointer', border:`1px solid ${sortContas===k?'var(--accent)':'var(--sep)'}`, background:sortContas===k?'var(--accent-dim)':'transparent', color:sortContas===k?'var(--accent)':'var(--label-3)' }}>
                {lb}
              </button>
            ))}
          </div>
        </div>
        {contas.length === 0 ? (
          <div style={{ padding:'40px', textAlign:'center', color:'var(--label-4)', fontSize:12, background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14 }}>
            <Wallet size={28} style={{ display:'block', margin:'0 auto 10px', opacity:.3 }}/> Nenhuma conta neste filtro
          </div>
        ) : (
          <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, overflow:'hidden' }}>
            {/* Resumo */}
            <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--sep)', display:'flex', gap:20 }}>
              <div><span style={{ fontSize:11, color:'var(--label-4)' }}>Exibindo </span><span style={{ fontSize:12, fontWeight:700, color:'var(--label)' }}>{contas.length} contas</span></div>
              <div><span style={{ fontSize:11, color:'var(--label-4)' }}>Total: </span><span style={{ fontSize:12, fontWeight:700, color:'var(--accent)' }}>{R(contas.reduce((s,c)=>s+Number(c.valor||0),0))}</span></div>
            </div>
            {contas.map((c, i) => <ContaRow key={c.id||i} conta={c} onSelect={setSel}/>)}
          </div>
        )}
      </>}

      {sel && <ContaSheet conta={sel} onClose={()=>setSel(null)}/>}
    </div>
  )
}
