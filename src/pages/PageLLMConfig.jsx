import { useState, useEffect, useCallback } from 'react'
import {
  Activity, Zap, DollarSign, BarChart3, Cpu, Key, MessageSquare,
  CheckCircle, AlertTriangle, XCircle, RefreshCw, Save, RotateCcw,
  ChevronDown, ChevronUp, Copy, Check, TestTube2, Shield,
  ShoppingCart, Truck, CreditCard, Eye, EyeOff, TrendingUp,
  Circle, ArrowUpRight, Layers, Hash, Clock, Wifi
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

// ── Design tokens alinhados ao projeto ───────────────────────────────────────
const s = {
  card: 'rounded-2xl border',
  cardStyle: { background:'var(--bg-2)', border:'1px solid var(--sep)' },
  input: 'w-full px-3 py-2 rounded-xl text-[13px] outline-none transition-all',
  inputStyle: {
    background:'var(--bg)', border:'1px solid var(--sep)',
    color:'var(--label)', fontFamily:'inherit',
  },
  inputFocus: { borderColor:'var(--accent)', boxShadow:'0 0 0 3px var(--accent-dim)' },
  label: 'text-[11px] font-semibold uppercase tracking-wider mb-1.5 block',
  labelStyle: { color:'var(--label-4)' },
  sectionTitle: 'text-[13px] font-semibold mb-4',
  sectionTitleStyle: { color:'var(--label)' },
}

const BYPASS_LIST = [
  { id:'qtd', icon:ShoppingCart, cor:'#00d4aa', cat:'Carrinho',
    titulo:'Quantidade do produto', desc:'Seleção numérica e botão "Adicionar" perguntam a quantidade direto ao WhatsApp sem passar pelo Gemini.' },
  { id:'finalizar', icon:CheckCircle, cor:'#22c55e', cat:'Checkout',
    titulo:'Finalizar pedido', desc:'Botão "Finalizar pedido" chama finalizar_pedido() via bypass direto.' },
  { id:'cpf', icon:Shield, cor:'#4a9fff', cat:'Checkout',
    titulo:'CPF → finalizar_pedido', desc:'CPF recebido após "Já tenho cadastro" chama finalizar_pedido() via executarFerramenta.' },
  { id:'pix', icon:CreditCard, cor:'#f59e0b', cat:'Pagamento',
    titulo:'PIX / Cartão', desc:'Escolha de forma de pagamento executa finalizar_pedido() direto, sem consultar a IA.' },
  { id:'endereco', icon:Truck, cor:'#a78bfa', cat:'Endereço',
    titulo:'Confirmar endereço → frete', desc:'Confirmação chama calcular_frete() via executarFerramenta direto.' },
  { id:'cep', icon:Truck, cor:'#60a5fa', cat:'Endereço',
    titulo:'Alterar endereço → solicita CEP', desc:'Botão "Alterar" envia pedido de CEP direto e aguarda resposta.' },
  { id:'carrinho', icon:ShoppingCart, cor:'#e879f9', cat:'Carrinho',
    titulo:'Editar carrinho (remover/alterar)', desc:'Lista numerada direto ao WhatsApp, sem IA.' },
]

const MENSAGENS_PADRAO = [
  { cat:'Checkout', campo:'msgCpf', titulo:'Solicitar CPF/CNPJ',
    pad:'Por favor, informe seu *CPF ou CNPJ* para buscarmos seu cadastro.', vars:null },
  { cat:'Endereço', campo:'msgAlterarEnd', titulo:'Solicitar novo CEP',
    pad:'📮 *Qual é o novo CEP de entrega?*\n\nDigite apenas o CEP (8 dígitos).', vars:null },
  { cat:'Endereço', campo:'msgCepInvalido', titulo:'CEP formato inválido',
    pad:'Por favor, informe apenas o *CEP* com 8 dígitos (ex: 13482323).', vars:null },
  { cat:'Endereço', campo:'msgCepNaoEncontrado', titulo:'CEP não encontrado',
    pad:'⚠️ CEP *{cep}* não encontrado.\nVerifique o número e tente novamente.', vars:['{cep}'] },
  { cat:'Endereço', campo:'msgErroCep', titulo:'Erro ao consultar CEP',
    pad:'⚠️ Não consegui verificar o CEP. Tente novamente.', vars:null },
  { cat:'Carrinho', campo:'msgQtdProduto', titulo:'Quantidade — produto novo',
    pad:'Quantas unidades de *{produto}* você gostaria?', vars:['{produto}'] },
  { cat:'Carrinho', campo:'msgQtdAlterar', titulo:'Quantidade — alterar item',
    pad:'Quantas unidades de *{produto}* você deseja? (atual: {qtd_atual}x)', vars:['{produto}','{qtd_atual}'] },
  { cat:'Carrinho', campo:'msgRemoverItem', titulo:'Cabeçalho: remover item',
    pad:'*Qual item deseja remover?*', vars:null },
  { cat:'Carrinho', campo:'msgAlterarQtd', titulo:'Cabeçalho: alterar quantidade',
    pad:'*Qual item deseja alterar?*', vars:null },
  { cat:'Carrinho', campo:'msgCarrinhoVazio', titulo:'Carrinho esvaziado',
    pad:'Carrinho esvaziado.\n\nO que você está procurando?', vars:null },
  { cat:'Carrinho', campo:'msgAdicionarItem', titulo:'"Adicionar item" — pede produto',
    pad:'Qual produto você está procurando?', vars:null },
  { cat:'Carrinho', campo:'msgNovaBusca', titulo:'Nova busca após limpar',
    pad:'O que você está procurando?', vars:null },
  { cat:'Fotos', campo:'msgTodasFotos', titulo:'Todas as fotos enviadas',
    pad:'Essas são todas as {n} fotos disponíveis para este produto.', vars:['{n}'] },
]

// ── Componentes auxiliares ────────────────────────────────────────────────────
function StatusDot({ status }) {
  const map = {
    operacional: { cor:'#22c55e', label:'Operacional' },
    degradado:   { cor:'#f59e0b', label:'Degradado' },
    instavel:    { cor:'#ef4444', label:'Instável' },
  }
  const m = map[status] || map.operacional
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-2.5 h-2.5">
        <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background:m.cor }}/>
        <div className="absolute inset-0 rounded-full" style={{ background:m.cor }}/>
      </div>
      <span className="text-[12px] font-semibold" style={{ color:m.cor }}>{m.label}</span>
    </div>
  )
}

function KpiCard({ label, valor, sub, icon:Ic, cor, trend }) {
  return (
    <div className={`${s.card} p-4 flex flex-col gap-2`} style={s.cardStyle}>
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background:`${cor}18` }}>
          <Ic size={15} style={{ color:cor }}/>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background:trend>=0?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)', color:trend>=0?'#22c55e':'#ef4444' }}>
            <ArrowUpRight size={9} style={{ transform:trend<0?'rotate(90deg)':undefined }}/>
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-[24px] font-bold leading-none mb-1" style={{ color:'var(--label)' }}>{valor}</div>
        <div className="text-[11px]" style={{ color:'var(--label-3)' }}>{label}</div>
        {sub && <div className="text-[10px] mt-0.5" style={{ color:'var(--label-4)' }}>{sub}</div>}
      </div>
    </div>
  )
}

function HealthRing({ taxa }) {
  const r = 52, circ = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, parseFloat(taxa)||0))
  const offset = circ * (1 - pct/100)
  const cor = pct>=95?'#22c55e':pct>=70?'#f59e0b':'#ef4444'
  return (
    <svg width={130} height={130} viewBox="0 0 130 130" className="rotate-[-90deg]">
      <circle cx={65} cy={65} r={r} fill="none" stroke="var(--fill)" strokeWidth={10}/>
      <circle cx={65} cy={65} r={r} fill="none" stroke={cor} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition:'stroke-dashoffset 1s ease' }}/>
      <text x={65} y={65} textAnchor="middle" dominantBaseline="middle"
        style={{ fill:cor, fontSize:22, fontWeight:700, fontFamily:'system-ui' }}
        transform="rotate(90, 65, 65)">{pct.toFixed(0)}%</text>
      <text x={65} y={83} textAnchor="middle"
        style={{ fill:'var(--label-4)', fontSize:9, fontFamily:'system-ui' }}
        transform="rotate(90, 65, 65)">SUCESSO</text>
    </svg>
  )
}

function InputField({ label, value, onChange, type='text', placeholder, hint, action }) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)
  const isPass = type === 'password'
  return (
    <div>
      <label className={s.label} style={s.labelStyle}>{label}</label>
      <div className="relative flex gap-2">
        <input
          type={isPass && !show ? 'password' : 'text'}
          value={value||''} onChange={e=>onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          className={`${s.input} flex-1`}
          style={{ ...s.inputStyle, ...(focused?s.inputFocus:{}) }}
        />
        {isPass && (
          <button type="button" onClick={()=>setShow(v=>!v)}
            className="px-2.5 rounded-xl flex items-center"
            style={{ background:'var(--fill)', color:'var(--label-4)', border:'1px solid var(--sep)' }}>
            {show?<EyeOff size={13}/>:<Eye size={13}/>}
          </button>
        )}
        {action && (
          <button type="button" onClick={action.onClick} disabled={action.loading}
            className="px-3 rounded-xl flex items-center gap-1.5 text-[12px] font-medium flex-shrink-0"
            style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)', minWidth:80 }}>
            {action.loading ? <RefreshCw size={12} className="animate-spin"/> : action.icon}
            {action.loading ? 'Testando' : action.label}
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] mt-1" style={{ color:'var(--label-4)' }}>{hint}</p>}
    </div>
  )
}

function MsgEditor({ msg, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const atual = value || msg.pad
  return (
    <div className={`${s.card} overflow-hidden transition-all`} style={s.cardStyle}>
      <button onClick={()=>setOpen(v=>!v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <MessageSquare size={14} style={{ color:'var(--accent)', flexShrink:0 }}/>
          <span className="text-[13px] font-medium truncate" style={{ color:'var(--label)' }}>{msg.titulo}</span>
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          {msg.vars && (
            <div className="flex gap-1">
              {msg.vars.map(v=>(
                <span key={v} className="text-[9px] px-1.5 py-0.5 rounded-md font-mono"
                  style={{ background:'rgba(0,212,170,.1)', color:'#00d4aa', border:'1px solid rgba(0,212,170,.2)' }}>
                  {v}
                </span>
              ))}
            </div>
          )}
          {open ? <ChevronUp size={13} style={{ color:'var(--label-4)' }}/> : <ChevronDown size={13} style={{ color:'var(--label-4)' }}/>}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0" style={{ borderTop:'1px solid var(--sep)' }}>
          <div className="pt-3">
            <textarea rows={3} value={atual}
              onChange={e=>onChange(msg.campo, e.target.value)}
              className={`${s.input} resize-y font-mono text-[12px] leading-relaxed`}
              style={{ ...s.inputStyle, paddingTop:10, paddingBottom:10 }}/>
            {msg.vars && (
              <p className="text-[10px] mt-1.5 font-mono" style={{ color:'var(--label-4)' }}>
                Variáveis disponíveis: {msg.vars.map(v=>(
                  <code key={v} className="mx-0.5 px-1 rounded" style={{ background:'var(--fill)', color:'var(--accent)' }}>{v}</code>
                ))}
              </p>
            )}
            <div className="flex gap-2 mt-2.5">
              <button onClick={()=>onChange(msg.campo, msg.pad)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px]"
                style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>
                <RotateCcw size={10}/> Restaurar padrão
              </button>
              <button onClick={()=>{ navigator.clipboard.writeText(atual); setCopied(true); setTimeout(()=>setCopied(false),2000) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px]"
                style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>
                {copied?<><Check size={10} style={{ color:'#22c55e' }}/> Copiado</>:<><Copy size={10}/> Copiar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PageLLMConfig({ api }) {
  const [aba,      setAba]      = useState('monitor')
  const [cfg,      setCfg]      = useState({})
  const [health,   setHealth]   = useState(null)
  const [modelos,  setModelos]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo,    setSalvo]    = useState(false)
  const [erro,     setErro]     = useState(null)
  const [testando, setTestando] = useState(false)
  const [testeRes, setTesteRes] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const set = (k, v) => setCfg(c => ({ ...c, [k]:v }))
  const setMsg = (campo, val) => setCfg(c => ({ ...c, [campo]:val }))

  const carregar = useCallback(async () => {
    if (!api) return
    try {
      const [c, h, m] = await Promise.all([
        fetch(`${api}/api/ia/config`).then(r=>r.ok?r.json():{}),
        fetch(`${api}/api/ia/health`).then(r=>r.ok?r.json():null).catch(()=>null),
        fetch(`${api}/api/ia/modelos`).then(r=>r.ok?r.json():{}).catch(()=>{}),
      ])
      setCfg(c||{})
      setHealth(h)
      setModelos(m?.provedores||[])
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => {
    if (!autoRefresh || aba !== 'monitor') return
    const t = setInterval(() => {
      if (api) fetch(`${api}/api/ia/health`).then(r=>r.ok?r.json():null).then(h=>h&&setHealth(h)).catch(()=>{})
    }, 30000)
    return () => clearInterval(t)
  }, [autoRefresh, aba, api])

  const salvar = async () => {
    setSalvando(true); setErro(null)
    try {
      const r = await fetch(`${api}/api/ia/config`, {
        method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(cfg)
      })
      if (!r.ok) throw new Error(await r.text())
      setSalvo(true); setTimeout(()=>setSalvo(false), 2500)
    } catch(e) { setErro(e.message?.slice(0,80)) }
    setSalvando(false)
  }

  const testar = async () => {
    setTestando(true); setTesteRes(null)
    try {
      const r = await fetch(`${api}/api/ia/test-key`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ geminiKey: cfg.geminiKey, modelo: cfg.modelo })
      })
      setTesteRes(await r.json())
    } catch { setTesteRes({ ok:false, erro:'Erro de conexão' }) }
    setTestando(false)
  }

  const provedorAtual = modelos.find(p=>p.id===(cfg.provedor||'google'))
  const modelosDisponiveis = provedorAtual?.modelos || []

  const ABAS = [
    { id:'monitor',  icon:Activity,      label:'Monitor' },
    { id:'modelo',   icon:Cpu,           label:'Modelo & API' },
    { id:'mensagens',icon:MessageSquare, label:'Mensagens' },
    { id:'bypasses', icon:Zap,           label:'Bypasses' },
  ]

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw size={20} className="animate-spin" style={{ color:'var(--accent)' }}/>
        <span className="text-[12px]" style={{ color:'var(--label-4)' }}>Carregando configuração...</span>
      </div>
    </div>
  )

  // Dados do gráfico (últimos 14 dias)
  const chartData = (health?.historico||[]).map(d=>({
    dia: new Date(d.dia).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),
    chamadas: d.chamadas,
    taxa: d.taxa,
    custo: parseFloat(d.custo)||0,
  }))

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background:'var(--bg)' }}>

      {/* ── Header ── */}
      <div className="px-6 py-4 flex-shrink-0 flex items-center justify-between"
        style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-[18px] font-bold" style={{ color:'var(--label)' }}>Config LLM & Function Calling</h2>
            <p className="text-[11px] mt-0.5" style={{ color:'var(--label-3)' }}>Modelo, mensagens, bypasses e monitoramento da IA</p>
          </div>
          {health && <StatusDot status={health.status}/>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setAutoRefresh(v=>!v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium"
            style={{ background:autoRefresh?'rgba(34,197,94,.1)':'var(--fill)', color:autoRefresh?'#22c55e':'var(--label-3)', border:autoRefresh?'1px solid rgba(34,197,94,.3)':'1px solid var(--sep)' }}>
            <Wifi size={12}/> {autoRefresh?'Auto':'Parado'}
          </button>
          <button onClick={carregar} className="p-2 rounded-xl" style={{ background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-4)' }}>
            <RefreshCw size={13}/>
          </button>
          {erro && <span className="text-[11px]" style={{ color:'#ef4444' }}>{erro}</span>}
          <button onClick={salvar} disabled={salvando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold"
            style={{ background:salvo?'#22c55e':'var(--accent)', color:'#000', border:'none' }}>
            {salvo?<><CheckCircle size={13}/> Salvo</>:salvando?'Salvando...':<><Save size={13}/> Salvar</>}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-0 px-6 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
        {ABAS.map(a=>{
          const Icon = a.icon
          const on = aba===a.id
          return (
            <button key={a.id} onClick={()=>setAba(a.id)}
              className="flex items-center gap-2 px-4 py-3 text-[12px] font-medium transition-all"
              style={{ borderBottom:`2px solid ${on?'var(--accent)':'transparent'}`, color:on?'var(--accent)':'var(--label-3)', marginBottom:-1 }}>
              <Icon size={13}/> {a.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* ══ MONITOR ══ */}
        {aba==='monitor' && (
          <div className="space-y-5 max-w-5xl">
            {!health ? (
              <div className={`${s.card} p-8 flex flex-col items-center gap-3 text-center`} style={s.cardStyle}>
                <AlertTriangle size={20} style={{ color:'var(--label-4)' }}/>
                <p className="text-[13px]" style={{ color:'var(--label-3)' }}>Nenhum dado de monitoramento disponível ainda.<br/>Os dados aparecem conforme a IA processa mensagens.</p>
              </div>
            ) : <>
              {/* Health score + KPIs */}
              <div className="grid grid-cols-5 gap-4">
                {/* Ring */}
                <div className={`${s.card} p-5 flex flex-col items-center justify-center gap-2`} style={s.cardStyle}>
                  <HealthRing taxa={health.taxa_sucesso}/>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color:'var(--label-4)' }}>Últimas 20 chamadas</span>
                </div>
                <KpiCard label="Chamadas hoje" valor={health.chamadas_hoje} sub={`${health.chamadas_hora}/h agora`} icon={BarChart3} cor="#00d4aa"/>
                <KpiCard label="Custo hoje" valor={`$${health.custo_hoje_usd}`} sub={`Mês: $${health.custo_mes_usd}`} icon={DollarSign} cor="#f59e0b"/>
                <KpiCard label="Total tokens" valor={health.total_tokens?.toLocaleString('pt-BR')} sub="histórico completo" icon={Hash} cor="#a78bfa"/>
                <KpiCard label="Erros hoje" valor={health.erros_hoje} sub={`${health.ok_hoje} com sucesso`} icon={AlertTriangle} cor={health.erros_hoje>0?'#ef4444':'#22c55e'} trend={health.erros_hoje>0?-10:5}/>
              </div>

              {/* Gráfico chamadas */}
              {chartData.length > 0 && (
                <div className={`${s.card} p-5`} style={s.cardStyle}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color:'var(--label)' }}>Chamadas por dia — últimos 14 dias</p>
                      <p className="text-[11px]" style={{ color:'var(--label-4)' }}>Volume de requisições ao Gemini/Claude</p>
                    </div>
                    <TrendingUp size={16} style={{ color:'var(--accent)' }}/>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="gradChamadas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="dia" tick={{ fontSize:10, fill:'var(--label-4)' }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fontSize:10, fill:'var(--label-4)' }} axisLine={false} tickLine={false} width={30}/>
                      <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:10, fontSize:11 }}/>
                      <Area type="monotone" dataKey="chamadas" stroke="#00d4aa" strokeWidth={2} fill="url(#gradChamadas)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Custo + taxa lado a lado */}
              {chartData.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className={`${s.card} p-5`} style={s.cardStyle}>
                    <p className="text-[13px] font-semibold mb-4" style={{ color:'var(--label)' }}>Custo diário (USD)</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={chartData}>
                        <XAxis dataKey="dia" tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false} width={40}/>
                        <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:10, fontSize:11 }}
                          formatter={(v)=>[`$${parseFloat(v).toFixed(4)}`,'Custo']}/>
                        <Bar dataKey="custo" radius={[4,4,0,0]}>
                          {chartData.map((_,i)=><Cell key={i} fill="#f59e0b"/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={`${s.card} p-5`} style={s.cardStyle}>
                    <p className="text-[13px] font-semibold mb-4" style={{ color:'var(--label)' }}>Taxa de sucesso (%)</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="gradTaxa" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="dia" tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false}/>
                        <YAxis domain={[0,100]} tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false} width={30}/>
                        <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:10, fontSize:11 }}
                          formatter={(v)=>[`${v}%`,'Taxa']}/>
                        <Area type="monotone" dataKey="taxa" stroke="#22c55e" strokeWidth={2} fill="url(#gradTaxa)"/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Última atividade */}
              <div className={`${s.card} px-5 py-4 flex items-center gap-3`} style={s.cardStyle}>
                <Clock size={14} style={{ color:'var(--label-4)' }}/>
                <span className="text-[12px]" style={{ color:'var(--label-3)' }}>
                  Última chamada: <strong style={{ color:'var(--label)' }}>
                    {health.ultima_chamada ? new Date(health.ultima_chamada).toLocaleString('pt-BR') : '—'}
                  </strong>
                </span>
                <div className="flex-1"/>
                <span className="text-[11px]" style={{ color:'var(--label-4)' }}>
                  Custo total: <strong style={{ color:'var(--label-3)' }}>${health.custo_total_usd}</strong>
                </span>
              </div>
            </>}
          </div>
        )}

        {/* ══ MODELO & API ══ */}
        {aba==='modelo' && (
          <div className="space-y-5 max-w-2xl">

            {/* Provedor */}
            <div className={`${s.card} p-5`} style={s.cardStyle}>
              <p className={s.sectionTitle} style={s.sectionTitleStyle}>Provedor de IA</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {id:'google',     label:'Google Gemini',    desc:'Recomendado — melhor custo-benefício', cor:'#4a9fff'},
                  {id:'anthropic',  label:'Anthropic Claude', desc:'Alta capacidade de raciocínio', cor:'#e879f9'},
                ].map(p=>{
                  const on = (cfg.provedor||'google')===p.id
                  return (
                    <button key={p.id} onClick={()=>set('provedor',p.id)}
                      className="p-4 rounded-2xl text-left transition-all"
                      style={{ background:on?`${p.cor}12`:'var(--bg)', border:`1px solid ${on?p.cor+'50':'var(--sep)'}` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: on ? p.cor : 'var(--fill)' }}/>
                        <span className="text-[13px] font-semibold" style={{ color: on ? p.cor : 'var(--label)' }}>{p.label}</span>
                      </div>
                      <p className="text-[11px] ml-4" style={{ color:'var(--label-4)' }}>{p.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Modelos */}
            <div className={`${s.card} p-5`} style={s.cardStyle}>
              <p className={s.sectionTitle} style={s.sectionTitleStyle}>Modelo</p>
              {modelosDisponiveis.length > 0 ? (
                <div className="space-y-2">
                  {modelosDisponiveis.map(m=>{
                    const on = cfg.modelo===m.id
                    return (
                      <button key={m.id} onClick={()=>set('modelo',m.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                        style={{ background:on?'var(--accent-dim)':'var(--bg)', border:`1px solid ${on?'var(--accent)':'var(--sep)'}` }}>
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{ borderColor: on?'var(--accent)':'var(--sep)' }}>
                          {on && <div className="w-2 h-2 rounded-full" style={{ background:'var(--accent)' }}/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium" style={{ color:'var(--label)' }}>{m.nome}</span>
                            {m.freeTier && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background:'rgba(34,197,94,.1)', color:'#22c55e' }}>Free</span>}
                          </div>
                          <p className="text-[11px]" style={{ color:'var(--label-4)' }}>{m.desc}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-[10px]" style={{ color:'var(--label-4)' }}>in ${m.inputPer1M}/M</div>
                          <div className="text-[10px]" style={{ color:'var(--label-4)' }}>out ${m.outputPer1M}/M</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <InputField label="ID do modelo" value={cfg.modelo} onChange={v=>set('modelo',v)} placeholder="gemini-2.5-flash"/>
              )}
            </div>

            {/* API Keys */}
            <div className={`${s.card} p-5 space-y-4`} style={s.cardStyle}>
              <p className={s.sectionTitle} style={s.sectionTitleStyle}>Chaves de API</p>
              <InputField
                label="Gemini API Key" type="password"
                value={cfg.geminiKey} onChange={v=>set('geminiKey',v)}
                placeholder="AIzaSy..."
                hint="Obtenha em aistudio.google.com — começa com AIzaSy"
                action={{ icon:<TestTube2 size={12}/>, label:'Testar', loading:testando, onClick:testar }}
              />
              {testeRes && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-[12px]"
                  style={{ background:testeRes.ok?'rgba(34,197,94,.08)':'rgba(239,68,68,.08)', border:`1px solid ${testeRes.ok?'rgba(34,197,94,.25)':'rgba(239,68,68,.25)'}`, color:testeRes.ok?'#22c55e':'#ef4444' }}>
                  {testeRes.ok?<CheckCircle size={14} className="flex-shrink-0 mt-0.5"/>:<XCircle size={14} className="flex-shrink-0 mt-0.5"/>}
                  <span>{testeRes.ok ? `Chave válida${testeRes.resposta?' — resposta: '+testeRes.resposta:''}` : testeRes.erro}</span>
                </div>
              )}
              <InputField
                label="Claude API Key" type="password"
                value={cfg.claudeKey} onChange={v=>set('claudeKey',v)}
                placeholder="sk-ant-..."
                hint="Obtenha em console.anthropic.com"
              />
            </div>

            {/* Parâmetros */}
            <div className={`${s.card} p-5 space-y-5`} style={s.cardStyle}>
              <p className={s.sectionTitle} style={s.sectionTitleStyle}>Parâmetros do modelo</p>
              <div>
                <div className="flex justify-between mb-2">
                  <label className={s.label} style={s.labelStyle}>Temperatura</label>
                  <span className="text-[13px] font-bold" style={{ color:'var(--accent)' }}>{parseFloat(cfg.temperatura||0.7).toFixed(1)}</span>
                </div>
                <input type="range" min={0} max={1} step={0.1} value={parseFloat(cfg.temperatura||0.7)}
                  onChange={e=>set('temperatura',e.target.value)}
                  className="w-full" style={{ accentColor:'var(--accent)', cursor:'pointer' }}/>
                <div className="flex justify-between mt-1 text-[10px]" style={{ color:'var(--label-4)' }}>
                  <span>0 — determinístico</span><span>1 — criativo</span>
                </div>
              </div>
              <InputField label="Max tokens de saída" value={String(cfg.maxTokens||4000)} onChange={v=>set('maxTokens',parseInt(v)||4000)} placeholder="4000" hint="Recomendado: 4000. Não ultrapasse 8000."/>
            </div>
          </div>
        )}

        {/* ══ MENSAGENS ══ */}
        {aba==='mensagens' && (
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background:'rgba(0,212,170,.06)', border:'1px solid rgba(0,212,170,.2)' }}>
              <MessageSquare size={14} style={{ color:'#00d4aa', flexShrink:0, marginTop:2 }}/>
              <p className="text-[12px] leading-relaxed" style={{ color:'var(--label-3)' }}>
                Textos enviados diretamente ao cliente pelo sistema (sem passar pelo Gemini). Edite aqui e clique <strong style={{ color:'var(--label)' }}>Salvar</strong> no topo para aplicar no servidor.
              </p>
            </div>
            {[...new Set(MENSAGENS_PADRAO.map(m=>m.cat))].map(cat=>(
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1" style={{ background:'var(--sep)' }}/>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2" style={{ color:'var(--label-4)' }}>{cat}</span>
                  <div className="h-px flex-1" style={{ background:'var(--sep)' }}/>
                </div>
                <div className="space-y-2">
                  {MENSAGENS_PADRAO.filter(m=>m.cat===cat).map(msg=>(
                    <MsgEditor key={msg.campo} msg={msg} value={cfg[msg.campo]} onChange={setMsg}/>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ BYPASSES ══ */}
        {aba==='bypasses' && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.2)' }}>
              <CheckCircle size={14} style={{ color:'#22c55e', flexShrink:0, marginTop:2 }}/>
              <p className="text-[12px] leading-relaxed" style={{ color:'var(--label-3)' }}>
                Todos os bypasses estão <strong style={{ color:'#22c55e' }}>sempre ativos</strong> — hardcoded no ia-core para garantir consistência e velocidade no fluxo de compra. Para desativar, edite diretamente o ia-core.js.
              </p>
            </div>
            {[...new Set(BYPASS_LIST.map(b=>b.cat))].map(cat=>(
              <div key={cat}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color:'var(--label-4)' }}>{cat}</p>
                <div className="space-y-2">
                  {BYPASS_LIST.filter(b=>b.cat===cat).map(b=>{
                    const Icon = b.icon
                    return (
                      <div key={b.id} className={`${s.card} flex items-start gap-3 p-4`}
                        style={{ ...s.cardStyle, borderLeft:`3px solid ${b.cor}50` }}>
                        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                          style={{ background:`${b.cor}15` }}>
                          <Icon size={15} style={{ color:b.cor }}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[13px] font-medium" style={{ color:'var(--label)' }}>{b.titulo}</span>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                              style={{ background:'rgba(34,197,94,.1)', color:'#22c55e' }}>
                              <Circle size={6} fill="#22c55e" style={{ color:'#22c55e' }}/> Ativo
                            </div>
                          </div>
                          <p className="text-[11px] leading-relaxed" style={{ color:'var(--label-4)' }}>{b.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
