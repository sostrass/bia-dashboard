import { useState, useEffect, useCallback } from 'react'
import {
  Zap, Send, AlertCircle, Clock, CheckCircle, RefreshCw,
  TrendingUp, Users, XCircle, BarChart3, Activity,
  Filter, ChevronDown, ShoppingBag, Truck, CreditCard,
  Bell, Star, FileText, Package, ToggleLeft, ToggleRight,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const GATILHO_META = {
  pagamento_aprovado: { label:'Pagamento Aprovado', icon:CreditCard,  cor:'#4a9fff', emoji:'\\u2705' },
  pedido_enviado:     { label:'Pedido Enviado',     icon:Truck,        cor:'#a78bfa', emoji:'\\ud83d\\ude9a' },
  pedido_entregue:    { label:'Pedido Entregue',    icon:Package,      cor:'#22c55e', emoji:'\\ud83d\\udce6' },
  pedido_criado:      { label:'Pedido Criado',      icon:ShoppingBag,  cor:'#00d4aa', emoji:'\\ud83d\\uded2' },
  nfe_emitida:        { label:'NF-e Emitida',       icon:FileText,     cor:'#f59e0b', emoji:'\\ud83d\\udcc4' },
  avise_me:           { label:'Avise-me',           icon:Bell,         cor:'#fb923c', emoji:'\\ud83d\\udd14' },
  em_separacao:       { label:'Em Separa\\u00e7\\u00e3o',       icon:Activity,     cor:'#8b5cf6', emoji:'\\ud83d\\udccb' },
  produto_embalado:   { label:'Produto Embalado',   icon:Package,      cor:'#06b6d4', emoji:'\\ud83d\\udce6' },
  boas_vindas:        { label:'Boas-vindas',         icon:Star,         cor:'#e879f9', emoji:'\\ud83d\\udc4b' },
  avaliar_pedido:     { label:'Avalia\\u00e7\\u00e3o',           icon:Star,         cor:'#f87171', emoji:'\\u2b50' },
  nao_entregue:       { label:'N\\u00e3o Entregue',        icon:XCircle,      cor:'#ef4444', emoji:'\\u274c' },
}

const STATUS_META = {
  enviado:    { label:'Enviado',    cor:'#22c55e', bg:'rgba(34,197,94,0.1)',    icon:CheckCircle },
  erro:       { label:'Erro',       cor:'#ef4444', bg:'rgba(239,68,68,0.1)',    icon:XCircle },
  ignorado:   { label:'Ignorado',   cor:'#6b7280', bg:'rgba(107,114,128,0.1)', icon:Minus },
  aguardando: { label:'Aguardando', cor:'#f59e0b', bg:'rgba(245,158,11,0.1)',  icon:Clock },
}

const PERIODOS = [
  { id:'1d', label:'Hoje' },
  { id:'7d', label:'7 dias' },
  { id:'30d',label:'30 dias' },
  { id:'90d',label:'90 dias' },
]

// Mini sparkline SVG
function Sparkline({ dados=[], cor='#00d4aa' }) {
  if (!dados.length) return null
  const vals  = dados.map(d => parseInt(d.enviados)||0)
  const max   = Math.max(...vals, 1)
  const w     = 80, h = 28, pad = 2
  const pts   = vals.map((v,i) => {
    const x = pad + (i / Math.max(vals.length-1,1)) * (w - pad*2)
    const y = h - pad - ((v/max) * (h - pad*2))
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill=\"none\" stroke={cor} strokeWidth=\"1.5\" strokeLinecap=\"round\" strokeLinejoin=\"round\"/>
    </svg>
  )
}

// Card de m\\u00e9trica principal
function MetricCard({ label, valor, sub, icon: Ic, cor, trend, sparkData }) {
  const trendPos = trend > 0, trendNeg = trend < 0
  return (
    <div className=\"rounded-[16px] p-4 flex flex-col gap-3\"
      style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
      <div className=\"flex items-center justify-between\">
        <div className=\"w-8 h-8 rounded-[9px] flex items-center justify-center\"
          style={{ background:`${cor}18` }}>
          <Ic size={15} style={{ color:cor }}/>
        </div>
        {trend !== undefined && (
          <div className=\"flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full\"
            style={{
              background: trendPos?'rgba(34,197,94,0.1)':trendNeg?'rgba(239,68,68,0.1)':'var(--fill)',
              color: trendPos?'#22c55e':trendNeg?'#ef4444':'var(--label-3)'
            }}>
            {trendPos?<ArrowUpRight size={10}/>:trendNeg?<ArrowDownRight size={10}/>:<Minus size={10}/>}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div className=\"text-[26px] font-bold leading-none mb-1\" style={{ color:'var(--label)' }}>
          {valor ?? '\\u2014'}
        </div>
        <div className=\"text-[11px]\" style={{ color:'var(--label-3)' }}>{label}</div>
        {sub && <div className=\"text-[10px] mt-0.5\" style={{ color:'var(--label-4)' }}>{sub}</div>}
      </div>
      {sparkData && <Sparkline dados={sparkData} cor={cor}/>}
    </div>
  )
}

// Barra de progresso estilizada
function BarraGatilho({ item, total }) {
  const meta  = GATILHO_META[item.gatilho] || { label:item.gatilho, cor:'#6b7280', emoji:'\\u26a1' }
  const pct   = total > 0 ? Math.round((parseInt(item.total)||0) / total * 100) : 0
  const taxa  = item.total > 0 ? Math.round((parseInt(item.enviados)||0) / item.total * 100) : 0
  const Ic    = meta.icon || Zap

  return (
    <div className=\"flex items-center gap-3 py-2.5\"
      style={{ borderBottom:'1px solid var(--sep)' }}>
      <div className=\"w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0\"
        style={{ background:`${meta.cor}15` }}>
        <Ic size={13} style={{ color:meta.cor }}/>
      </div>
      <div className=\"flex-1 min-w-0\">
        <div className=\"flex items-center justify-between mb-1\">
          <span className=\"text-[12px] font-medium truncate\" style={{ color:'var(--label)' }}>
            {meta.emoji} {meta.label}
          </span>
          <div className=\"flex items-center gap-2 flex-shrink-0 ml-2\">
            <span className=\"text-[11px] font-semibold\" style={{ color:'var(--label)' }}>{item.total}</span>
            <span className=\"text-[10px] px-1.5 py-0.5 rounded-full\"
              style={{ background: taxa>=90?'rgba(34,197,94,0.1)':taxa>=70?'rgba(245,158,11,0.1)':'rgba(239,68,68,0.1)',
                       color: taxa>=90?'#22c55e':taxa>=70?'#f59e0b':'#ef4444' }}>
              {taxa}%
            </span>
          </div>
        </div>
        <div className=\"h-1.5 rounded-full overflow-hidden\" style={{ background:'var(--fill)' }}>
          <div className=\"h-full rounded-full transition-all duration-700\"
            style={{ width:`${pct}%`, background:meta.cor }}/>
        </div>
      </div>
    </div>
  )
}

export default function PageDisparos({ api: apiProp }) {
  const api = apiProp || BASE
  const [stats,    setStats]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [periodo,  setPeriodo]  = useState('7d')
  const [filtroSt, setFiltroSt] = useState('todos')
  const [filtroGat,setFiltroGat]= useState('todos')
  const [autoRef,  setAutoRef]  = useState(true)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/bling-webhook/stats?periodo=${periodo}`)
      if (r.ok) { const d = await r.json(); setStats(d) }
    } catch {}
    setLoading(false)
  }, [api, periodo])

  useEffect(() => { setLoading(true); carregar() }, [carregar])
  useEffect(() => {
    if (!autoRef) return
    const t = setInterval(carregar, 30000)
    return () => clearInterval(t)
  }, [carregar, autoRef])

  const t = stats?.totais || {}
  const total = parseInt(t.total)||0
  const taxaSucesso = total > 0 ? Math.round(((parseInt(t.enviados)||0)/total)*100) : 0

  const recentes = (stats?.recentes || []).filter(r => {
    if (filtroSt !== 'todos' && r.status !== filtroSt) return false
    if (filtroGat !== 'todos' && r.gatilho !== filtroGat) return false
    return true
  })

  const gatilhosUsados = [...new Set((stats?.porGatilho||[]).map(g=>g.gatilho))]

  return (
    <div className=\"h-full flex flex-col overflow-hidden\" style={{ background:'var(--bg)' }}>

      {/* Header */}
      <div className=\"px-6 py-4 flex-shrink-0 flex items-center justify-between\"
        style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
        <div>
          <h2 className=\"text-[20px] font-bold\" style={{ color:'var(--label)' }}>Disparos</h2>
          <p className=\"text-[12px] mt-0.5\" style={{ color:'var(--label-3)' }}>
            Mensagens transacionais enviadas pelo sistema
          </p>
        </div>
        <div className=\"flex items-center gap-2\">
          {/* Auto-refresh */}
          <button onClick={()=>setAutoRef(v=>!v)}
            className=\"flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[11px] font-medium transition-all\"
            style={{ background:autoRef?'rgba(34,197,94,0.1)':'var(--fill)', color:autoRef?'#22c55e':'var(--label-3)', border:autoRef?'1px solid rgba(34,197,94,0.3)':'1px solid var(--sep)' }}>
            {autoRef?<ToggleRight size={14} strokeWidth={2}/>:<ToggleLeft size={14}/>}
            Auto-refresh
          </button>
          {/* Per\\u00edodo */}
          <div className=\"flex gap-1 p-1 rounded-[10px]\" style={{ background:'var(--fill)' }}>
            {PERIODOS.map(p=>(
              <button key={p.id} onClick={()=>setPeriodo(p.id)}
                className=\"px-3 py-1 rounded-[7px] text-[11px] font-medium transition-all\"
                style={{ background:periodo===p.id?'var(--bg-2)':'transparent', color:periodo===p.id?'var(--label)':'var(--label-3)', boxShadow:periodo===p.id?'0 1px 3px rgba(0,0,0,0.1)':'none' }}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={()=>{ setLoading(true); carregar() }}
            className=\"p-2 rounded-[9px]\" style={{ background:'var(--fill)', color:'var(--label-3)' }}>
            <RefreshCw size={14} className={loading?'animate-spin':''}/>
          </button>
        </div>
      </div>

      <div className=\"flex-1 overflow-y-auto p-6 space-y-5\">
        {loading && !stats && (
          <div className=\"flex justify-center py-16\">
            <RefreshCw size={16} className=\"animate-spin\" style={{ color:'var(--label-3)' }}/>
          </div>
        )}

        {stats && <>

          {/* KPIs */}
          <div className=\"grid grid-cols-4 gap-3\">
            <MetricCard label=\"Total de disparos\" valor={total}
              sub={`\\u00faltimos ${stats.dias} dias`}
              icon={Send} cor=\"#00d4aa\" sparkData={stats.porDia}/>
            <MetricCard label=\"Enviados com sucesso\" valor={parseInt(t.enviados)||0}
              sub={`taxa de ${taxaSucesso}%`}
              icon={CheckCircle} cor=\"#22c55e\"
              trend={taxaSucesso >= 90 ? 5 : taxaSucesso >= 70 ? 0 : -5}/>
            <MetricCard label=\"Clientes alcan\\u00e7ados\" valor={parseInt(t.clientes_unicos)||0}
              sub=\"n\\u00fameros \\u00fanicos\" icon={Users} cor=\"#4a9fff\"/>
            <MetricCard label=\"\\u00daltimas 24h\" valor={parseInt(t.ultimas_24h)||0}
              sub={`${parseInt(t.erros)||0} erros`}
              icon={Activity} cor=\"#a78bfa\"
              trend={parseInt(t.erros)>0?-1:1}/>
          </div>

          {/* Taxa de sucesso visual */}
          <div className=\"rounded-[16px] p-4\" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
            <div className=\"flex items-center justify-between mb-3\">
              <span className=\"text-[13px] font-semibold\" style={{ color:'var(--label)' }}>Taxa de sucesso global</span>
              <span className=\"text-[22px] font-bold\" style={{ color: taxaSucesso>=90?'#22c55e':taxaSucesso>=70?'#f59e0b':'#ef4444' }}>
                {taxaSucesso}%
              </span>
            </div>
            <div className=\"h-3 rounded-full overflow-hidden\" style={{ background:'var(--fill)' }}>
              <div className=\"h-full rounded-full transition-all duration-1000\"
                style={{ width:`${taxaSucesso}%`, background: taxaSucesso>=90?'#22c55e':taxaSucesso>=70?'#f59e0b':'#ef4444' }}/>
            </div>
            <div className=\"flex justify-between mt-2\">
              <div className=\"flex items-center gap-4\">
                {[
                  { l:'Enviados',  v:t.enviados,  c:'#22c55e' },
                  { l:'Erros',     v:t.erros,     c:'#ef4444' },
                  { l:'Ignorados', v:t.ignorados, c:'#6b7280' },
                  { l:'Aguardando',v:t.aguardando,c:'#f59e0b' },
                ].map(s=>(
                  <div key={s.l} className=\"flex items-center gap-1.5\">
                    <div className=\"w-2 h-2 rounded-full\" style={{ background:s.c }}/>
                    <span className=\"text-[10px]\" style={{ color:'var(--label-3)' }}>{s.l}: <strong style={{ color:'var(--label-2)' }}>{parseInt(s.v)||0}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gr\\u00e1fico de dias + Por gatilho */}
          <div className=\"grid grid-cols-2 gap-4\">

            {/* Evolu\\u00e7\\u00e3o di\\u00e1ria */}
            <div className=\"rounded-[16px] p-4\" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
              <h3 className=\"text-[13px] font-semibold mb-4\" style={{ color:'var(--label)' }}>Evolu\\u00e7\\u00e3o di\\u00e1ria</h3>
              {stats.porDia.length === 0
                ? <p className=\"text-[12px] text-center py-4\" style={{ color:'var(--label-4)' }}>Sem dados no per\\u00edodo</p>
                : <div className=\"space-y-1.5\">
                    {(() => {
                      const maxDia = Math.max(...stats.porDia.map(d=>parseInt(d.total)||0),1)
                      return stats.porDia.slice(-7).map((d,i)=>{
                        const pct = Math.round(((parseInt(d.total)||0)/maxDia)*100)
                        const errPct = d.total > 0 ? Math.round((parseInt(d.erros)||0)/parseInt(d.total)*100) : 0
                        const dt = new Date(d.dia)
                        const label = dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
                        return (
                          <div key={i} className=\"flex items-center gap-2\">
                            <span className=\"text-[10px] w-12 flex-shrink-0\" style={{ color:'var(--label-3)' }}>{label}</span>
                            <div className=\"flex-1 h-5 rounded-full overflow-hidden\" style={{ background:'var(--fill)' }}>
                              <div className=\"h-full rounded-full transition-all duration-700 flex\"
                                style={{ width:`${pct}%` }}>
                                <div className=\"flex-1\" style={{ background:'#22c55e' }}/>
                                {errPct > 0 && <div style={{ width:`${errPct}%`, background:'#ef4444', minWidth:4 }}/>}
                              </div>
                            </div>
                            <span className=\"text-[10px] w-8 text-right flex-shrink-0 font-medium\" style={{ color:'var(--label-2)' }}>
                              {parseInt(d.total)||0}
                            </span>
                          </div>
                        )
                      })
                    })()}
                  </div>
              }
            </div>

            {/* Por gatilho */}
            <div className=\"rounded-[16px] p-4\" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
              <h3 className=\"text-[13px] font-semibold mb-1\" style={{ color:'var(--label)' }}>Por gatilho</h3>
              {stats.porGatilho.length === 0
                ? <p className=\"text-[12px] text-center py-4\" style={{ color:'var(--label-4)' }}>Nenhum disparo no per\\u00edodo</p>
                : <div>
                    {stats.porGatilho.map((item,i)=>(
                      <BarraGatilho key={i} item={item} total={total}/>
                    ))}
                  </div>
              }
            </div>
          </div>

          {/* Log de disparos */}
          <div className=\"rounded-[16px] overflow-hidden\" style={{ border:'1px solid var(--sep)', background:'var(--bg-2)' }}>
            <div className=\"flex items-center justify-between px-4 py-3\"
              style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-3)' }}>
              <h3 className=\"text-[13px] font-semibold\" style={{ color:'var(--label)' }}>
                Log de disparos
                <span className=\"ml-2 text-[10px] font-normal px-2 py-0.5 rounded-full\"
                  style={{ background:'var(--fill)', color:'var(--label-3)' }}>
                  {recentes.length}
                </span>
              </h3>
              <div className=\"flex items-center gap-2\">
                {/* Filtro status */}
                <select value={filtroSt} onChange={e=>setFiltroSt(e.target.value)}
                  className=\"px-2 py-1.5 rounded-[8px] text-[11px] outline-none\"
                  style={{ background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-2)' }}>
                  <option value=\"todos\">Todos status</option>
                  {Object.entries(STATUS_META).map(([id,m])=>(
                    <option key={id} value={id}>{m.label}</option>
                  ))}
                </select>
                {/* Filtro gatilho */}
                <select value={filtroGat} onChange={e=>setFiltroGat(e.target.value)}
                  className=\"px-2 py-1.5 rounded-[8px] text-[11px] outline-none\"
                  style={{ background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-2)' }}>
                  <option value=\"todos\">Todos gatilhos</option>
                  {gatilhosUsados.map(g=>(
                    <option key={g} value={g}>{GATILHO_META[g]?.emoji} {GATILHO_META[g]?.label||g}</option>
                  ))}
                </select>
              </div>
            </div>

            {recentes.length === 0 ? (
              <div className=\"flex flex-col items-center py-12\">
                <Zap size={28} className=\"mb-3 opacity-15\" style={{ color:'var(--label)' }}/>
                <p className=\"text-[13px]\" style={{ color:'var(--label-3)' }}>Nenhum disparo encontrado</p>
              </div>
            ) : (
              <div>
                {/* Cabe\\u00e7alho */}
                <div className=\"grid px-4 py-2\"
                  style={{ gridTemplateColumns:'1fr 120px 130px 90px 70px', borderBottom:'1px solid var(--sep)', background:'var(--bg-3)' }}>
                  {['Gatilho / Cliente','N\\u00famero','Template','Status','Hor\\u00e1rio'].map(h=>(
                    <span key={h} className=\"text-[10px] font-semibold uppercase tracking-wider\"
                      style={{ color:'var(--label-4)' }}>{h}</span>
                  ))}
                </div>
                {recentes.map((r,i)=>{
                  const meta  = GATILHO_META[r.gatilho]  || { label:r.gatilho,  cor:'#6b7280', emoji:'\\u26a1' }
                  const smeta = STATUS_META[r.status] || STATUS_META.ignorado
                  const Sic   = smeta.icon
                  const hora  = new Date(r.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
                  const data  = new Date(r.criado_em).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
                  return (
                    <div key={i} className=\"grid items-center px-4 py-2.5 transition-all\"
                      style={{ gridTemplateColumns:'1fr 120px 130px 90px 70px', borderBottom:i<recentes.length-1?'1px solid var(--sep)':'none', background: r.status==='erro'?'rgba(239,68,68,0.03)':'transparent' }}>
                      <div className=\"min-w-0\">
                        <div className=\"flex items-center gap-1.5\">
                          <span className=\"text-[11px]\">{meta.emoji}</span>
                          <span className=\"text-[12px] font-medium truncate\" style={{ color:'var(--label)' }}>
                            {meta.label}
                          </span>
                          {r.delay_min > 0 && (
                            <span className=\"text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0\"
                              style={{ background:'rgba(245,158,11,0.1)', color:'#f59e0b' }}>
                              +{r.delay_min}min
                            </span>
                          )}
                        </div>
                        <div className=\"text-[10px] truncate\" style={{ color:'var(--label-3)' }}>
                          {r.nome_cliente || r.telefone}
                          {r.numero_pedido && ` \\u00b7 #${r.numero_pedido}`}
                        </div>
                        {r.erro_msg && (
                          <div className=\"text-[9px] truncate\" style={{ color:'#ef4444' }}>{r.erro_msg}</div>
                        )}
                      </div>
                      <span className=\"text-[11px] font-mono truncate\" style={{ color:'var(--label-3)' }}>
                        {r.telefone.replace('55','').replace(/(\\d{2})(\\d{5})(\\d{4})/,'($1) $2-$3')}
                      </span>
                      <span className=\"text-[10px] truncate\" style={{ color:'var(--label-3)' }}>
                        {r.template_nome || r.gatilho}
                      </span>
                      <div>
                        <div className=\"flex items-center gap-1 px-2 py-1 rounded-full w-fit\"
                          style={{ background:smeta.bg }}>
                          <Sic size={10} style={{ color:smeta.cor }}/>
                          <span className=\"text-[10px] font-medium\" style={{ color:smeta.cor }}>{smeta.label}</span>
                        </div>
                      </div>
                      <span className=\"text-[10px]\" style={{ color:'var(--label-4)' }}>
                        {data} {hora}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </>}
      </div>
    </div>
  )
}
