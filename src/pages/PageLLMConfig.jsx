import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Activity, Zap, DollarSign, BarChart3, Cpu, Key, MessageSquare,
  CheckCircle, AlertTriangle, XCircle, RefreshCw, Save, RotateCcw,
  ChevronDown, ChevronRight, Copy, Check, TestTube2, Shield,
  ShoppingCart, Truck, CreditCard, Eye, EyeOff, TrendingUp, Wifi,
  WifiOff, Hash, Clock, Circle, PanelLeftClose, PanelLeftOpen,
  Package, Layers
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

// ── Nav items ────────────────────────────────────────────────────────────────
const NAV = [
  { group: 'Monitoramento', items: [
    { id: 'monitor',  icon: Activity,      label: 'Saúde da IA' },
    { id: 'costs',    icon: DollarSign,    label: 'Custos & Uso' },
  ]},
  { group: 'Modelo', items: [
    { id: 'modelo',   icon: Cpu,           label: 'LLM & API Keys' },
    { id: 'params',   icon: Layers,        label: 'Parâmetros' },
  ]},
  { group: 'Conteúdo', items: [
    { id: 'msgs',     icon: MessageSquare, label: 'Mensagens', badge: '13' },
    { id: 'bypasses', icon: Zap,           label: 'Bypasses',  badge: '7' },
  ]},
]

// ── Mensagens ─────────────────────────────────────────────────────────────────
const MSGS = [
  { cat:'Checkout',  campo:'msgCpf',            titulo:'Solicitar CPF/CNPJ',           pad:'Por favor, informe seu *CPF ou CNPJ* para buscarmos seu cadastro.', vars:null },
  { cat:'Endereço',  campo:'msgAlterarEnd',      titulo:'Solicitar novo CEP',            pad:'📮 *Qual é o novo CEP de entrega?*\n\nDigite apenas o CEP (8 dígitos).', vars:null },
  { cat:'Endereço',  campo:'msgCepInvalido',     titulo:'CEP formato inválido',          pad:'Por favor, informe apenas o *CEP* com 8 dígitos (ex: 13482323).', vars:null },
  { cat:'Endereço',  campo:'msgCepNaoEncontrado',titulo:'CEP não encontrado',            pad:'⚠️ CEP *{cep}* não encontrado.\nVerifique o número e tente novamente.', vars:['{cep}'] },
  { cat:'Endereço',  campo:'msgErroCep',         titulo:'Erro ao consultar CEP',         pad:'⚠️ Não consegui verificar o CEP. Tente novamente.', vars:null },
  { cat:'Carrinho',  campo:'msgQtdProduto',      titulo:'Quantidade — produto novo',     pad:'Quantas unidades de *{produto}* você gostaria?', vars:['{produto}'] },
  { cat:'Carrinho',  campo:'msgQtdAlterar',      titulo:'Quantidade — alterar item',     pad:'Quantas unidades de *{produto}* você deseja? (atual: {qtd_atual}x)', vars:['{produto}','{qtd_atual}'] },
  { cat:'Carrinho',  campo:'msgRemoverItem',     titulo:'Cabeçalho: remover item',       pad:'*Qual item deseja remover?*', vars:null },
  { cat:'Carrinho',  campo:'msgAlterarQtd',      titulo:'Cabeçalho: alterar quantidade', pad:'*Qual item deseja alterar?*', vars:null },
  { cat:'Carrinho',  campo:'msgCarrinhoVazio',   titulo:'Carrinho esvaziado',            pad:'Carrinho esvaziado.\n\nO que você está procurando?', vars:null },
  { cat:'Carrinho',  campo:'msgAdicionarItem',   titulo:'"Adicionar item" — pede produto',pad:'Qual produto você está procurando?', vars:null },
  { cat:'Carrinho',  campo:'msgNovaBusca',       titulo:'Nova busca após limpar',        pad:'O que você está procurando?', vars:null },
  { cat:'Fotos',     campo:'msgTodasFotos',      titulo:'Todas as fotos enviadas',       pad:'Essas são todas as {n} fotos disponíveis para este produto.', vars:['{n}'] },
]

// ── Bypasses ──────────────────────────────────────────────────────────────────
const BYPASSES = [
  { cat:'Carrinho',  icon:ShoppingCart, cor:'#00d4aa', titulo:'Quantidade do produto',       desc:'Seleção/botão pergunta quantidade direto ao WA sem Gemini.' },
  { cat:'Checkout',  icon:CheckCircle,  cor:'#22c55e', titulo:'Finalizar pedido',             desc:'Chama finalizar_pedido() via bypass, sem consultar IA.' },
  { cat:'Checkout',  icon:Shield,       cor:'#4a9fff', titulo:'CPF → finalizar_pedido',       desc:'CPF recebido chama finalizar_pedido() via executarFerramenta.' },
  { cat:'Pagamento', icon:CreditCard,   cor:'#f59e0b', titulo:'PIX / Cartão de crédito',      desc:'Pagamento executa finalizar_pedido() direto.' },
  { cat:'Endereço',  icon:Truck,        cor:'#a78bfa', titulo:'Confirmar endereço → frete',   desc:'Confirmação dispara calcular_frete() via executarFerramenta.' },
  { cat:'Endereço',  icon:Truck,        cor:'#60a5fa', titulo:'Alterar endereço',              desc:'Envia pedido de CEP direto ao WA e aguarda.' },
  { cat:'Carrinho',  icon:Package,      cor:'#e879f9', titulo:'Remover / Alterar / Ver foto', desc:'Lista numerada e fotos com bling_id real, sem IA.' },
]

const CAT_CORES = { Carrinho:'#00d4aa', Checkout:'#22c55e', Pagamento:'#f59e0b', Endereço:'#a78bfa', Fotos:'#fb923c' }

// ── Componentes ───────────────────────────────────────────────────────────────
function NavSidebar({ active, setActive, collapsed, setCollapsed }) {
  return (
    <aside className={`flex-shrink-0 flex flex-col overflow-hidden transition-all duration-200 ${collapsed?'w-12':'w-52'}`}
      style={{ background:'var(--bg-2)', borderRight:'1px solid var(--sep)' }}>

      {/* Toggle */}
      <div className="flex items-center justify-between px-3 py-3 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)' }}>
        {!collapsed && <span className="text-[12px] font-bold" style={{ color:'var(--label-3)', letterSpacing:'.06em', textTransform:'uppercase' }}>Config LLM</span>}
        <button onClick={()=>setCollapsed(v=>!v)}
          className="p-1.5 rounded-lg ml-auto transition-colors"
          style={{ color:'var(--label-4)' }}>
          {collapsed ? <PanelLeftOpen size={14}/> : <PanelLeftClose size={14}/>}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map(g => (
          <div key={g.group} className="mb-1">
            {!collapsed && (
              <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--label-4)' }}>{g.group}</div>
            )}
            {g.items.map(item => {
              const Icon = item.icon
              const on = active === item.id
              return (
                <button key={item.id} onClick={()=>setActive(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all relative ${collapsed?'justify-center':''}`}
                  style={{
                    background: on ? 'var(--accent-dim)' : 'transparent',
                    borderLeft: `2px solid ${on?'var(--accent)':'transparent'}`,
                    color: on ? 'var(--accent)' : 'var(--label-3)',
                  }}>
                  <Icon size={14} className="flex-shrink-0"/>
                  {!collapsed && <>
                    <span className="text-[12px] font-medium truncate flex-1">{item.label}</span>
                    {item.badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background:'var(--accent-dim)', color:'var(--accent)' }}>{item.badge}</span>}
                  </>}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}

function KpiCard({ label, value, sub, icon:Ic, cor, trend }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background:`${cor}18` }}>
          <Ic size={14} style={{ color:cor }}/>
        </div>
        {trend !== undefined && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background:trend>=0?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)', color:trend>=0?'#22c55e':'#ef4444' }}>
            {trend>=0?'↑':'↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div className="text-[22px] font-bold leading-none mb-1" style={{ color:'var(--label)' }}>{value??'—'}</div>
        <div className="text-[11px]" style={{ color:'var(--label-3)' }}>{label}</div>
        {sub && <div className="text-[10px] mt-0.5" style={{ color:'var(--label-4)' }}>{sub}</div>}
      </div>
    </div>
  )
}

function HealthRing({ taxa }) {
  const r=46, circ=2*Math.PI*r, pct=Math.min(100,Math.max(0,parseFloat(taxa)||0))
  const offset=circ*(1-pct/100)
  const cor=pct>=95?'#22c55e':pct>=70?'#f59e0b':'#ef4444'
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <svg width={110} height={110} viewBox="0 0 110 110">
        <circle cx={55} cy={55} r={r} fill="none" stroke="var(--fill)" strokeWidth={9}/>
        <circle cx={55} cy={55} r={r} fill="none" stroke={cor} strokeWidth={9}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 55 55)" style={{ transition:'stroke-dashoffset 1s' }}/>
        <text x={55} y={55} textAnchor="middle" dominantBaseline="middle"
          style={{ fill:cor, fontSize:20, fontWeight:700, fontFamily:'system-ui' }}>{pct.toFixed(0)}%</text>
        <text x={55} y={70} textAnchor="middle"
          style={{ fill:'var(--label-4)', fontSize:9, fontFamily:'system-ui' }}>SUCESSO</text>
      </svg>
    </div>
  )
}

function FInput({ label, value, onChange, type='text', placeholder, hint, children }) {
  const [focused, setF] = useState(false)
  return (
    <div>
      {label && <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color:'var(--label-4)' }}>{label}</label>}
      {children ?? (
        <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          onFocus={()=>setF(true)} onBlur={()=>setF(false)}
          className="w-full px-3 py-2 rounded-xl text-[12.5px] outline-none transition-all"
          style={{ background:'var(--bg)', border:`1px solid ${focused?'var(--accent)':'var(--sep)'}`, color:'var(--label)', fontFamily:'inherit', boxShadow:focused?'0 0 0 3px var(--accent-dim)':'none' }}/>
      )}
      {hint && <p className="text-[10px] mt-1" style={{ color:'var(--label-4)' }}>{hint}</p>}
    </div>
  )
}

function Section({ title, children, className='' }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
      {title && <p className="text-[12px] font-semibold mb-4 uppercase tracking-wider" style={{ color:'var(--label-3)' }}>{title}</p>}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px flex-1" style={{ background:'var(--sep)' }}/>
      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--label-4)' }}>{label}</span>
      <div className="h-px flex-1" style={{ background:'var(--sep)' }}/>
    </div>
  )
}

function MsgAccordion({ msg, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const cor = CAT_CORES[msg.cat] || 'var(--accent)'
  return (
    <div className="rounded-xl overflow-hidden" style={{ border:'1px solid var(--sep)', background:'var(--bg)' }}>
      <button onClick={()=>setOpen(v=>!v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ background:open?'var(--bg-2)':'transparent' }}>
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:cor }}/>
        <span className="flex-1 text-[12.5px] font-medium truncate" style={{ color:'var(--label)' }}>{msg.titulo}</span>
        {msg.vars && (
          <div className="flex gap-1 mr-2">
            {msg.vars.map(v=>(
              <span key={v} className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                style={{ background:`${cor}15`, color:cor, border:`1px solid ${cor}25` }}>{v}</span>
            ))}
          </div>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded-full mr-1 font-medium" style={{ background:`${cor}12`, color:cor }}>{msg.cat}</span>
        {open ? <ChevronDown size={12} style={{ color:'var(--label-4)' }}/> : <ChevronRight size={12} style={{ color:'var(--label-4)' }}/>}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2" style={{ borderTop:'1px solid var(--sep)' }}>
          <textarea rows={3} value={value||''} onChange={e=>onChange(msg.campo,e.target.value)}
            placeholder={msg.pad}
            className="w-full px-3 py-2 rounded-xl text-[12px] font-mono outline-none resize-y leading-relaxed"
            style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
          {msg.vars && <p className="text-[10px] mt-1.5 font-mono" style={{ color:'var(--label-4)' }}>
            Vars: {msg.vars.map(v=><code key={v} className="mx-0.5 px-1 rounded" style={{ background:'var(--fill)', color:cor }}>{v}</code>)}
          </p>}
          <div className="flex gap-2 mt-2">
            <button onClick={()=>onChange(msg.campo,msg.pad)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px]"
              style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>
              <RotateCcw size={10}/> Restaurar
            </button>
            <button onClick={()=>{navigator.clipboard.writeText(value||msg.pad);setCopied(true);setTimeout(()=>setCopied(false),2000)}}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px]"
              style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>
              {copied?<><Check size={10} style={{ color:'#22c55e' }}/> Copiado</>:<><Copy size={10}/> Copiar</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function BypassGrid() {
  const cats = [...new Set(BYPASSES.map(b=>b.cat))]
  const catCols = { Carrinho:2, Checkout:2, Pagamento:1, Endereço:2 }
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 px-4 py-3 rounded-2xl"
        style={{ background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.2)' }}>
        <CheckCircle size={14} style={{ color:'#22c55e', flexShrink:0, marginTop:2 }}/>
        <p className="text-[12px] leading-relaxed" style={{ color:'var(--label-3)' }}>
          Todos os bypasses são <strong style={{ color:'#22c55e' }}>hardcoded</strong> no ia-core — sempre ativos. Esta tela é informativa.
        </p>
      </div>
      {cats.map(cat => {
        const items = BYPASSES.filter(b=>b.cat===cat)
        const cols = catCols[cat]||2
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1" style={{ background:'var(--sep)' }}/>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--label-4)' }}>{cat}</span>
              <div className="h-px flex-1" style={{ background:'var(--sep)' }}/>
            </div>
            <div className={`grid gap-3`} style={{ gridTemplateColumns:`repeat(${cols},1fr)` }}>
              {items.map((b,i) => {
                const Icon = b.icon
                return (
                  <div key={i} className="rounded-xl p-3.5 flex items-start gap-3"
                    style={{ background:'var(--bg-2)', border:`1px solid var(--sep)`, borderLeft:`3px solid ${b.cor}60` }}>
                    <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
                      style={{ background:`${b.cor}12` }}>
                      <Icon size={14} style={{ color:b.cor }}/>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12.5px] font-medium" style={{ color:'var(--label)' }}>{b.titulo}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                          style={{ background:'rgba(34,197,94,.1)', color:'#22c55e' }}>● Ativo</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color:'var(--label-4)' }}>{b.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function PageLLMConfig({ api }) {
  const [active,    setActive]    = useState('monitor')
  const [collapsed, setCollapsed] = useState(false)
  const [cfg,       setCfg]       = useState({})
  const [health,    setHealth]    = useState(null)
  const [modelos,   setModelos]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [salvando,  setSalvando]  = useState(false)
  const [salvo,     setSalvo]     = useState(false)
  const [erro,      setErro]      = useState(null)
  const [testando,  setTestando]  = useState(false)
  const [testeRes,  setTesteRes]  = useState(null)
  const [showKey,   setShowKey]   = useState(false)
  const [msgVals,   setMsgVals]   = useState({})
  const [autoR,     setAutoR]     = useState(true)
  const timerRef = useRef(null)

  const set = (k,v) => setCfg(c=>({...c,[k]:v}))
  const setMsg = (campo,v) => { setMsgVals(m=>({...m,[campo]:v})); set(campo,v) }

  const carregar = useCallback(async () => {
    if (!api) { setLoading(false); return }
    try {
      const [c,h,m] = await Promise.all([
        fetch(`${api}/api/ia/config`).then(r=>r.ok?r.json():{}).catch(()=>({})),
        fetch(`${api}/api/ia/health`).then(r=>r.ok?r.json():null).catch(()=>null),
        fetch(`${api}/api/ia/modelos`).then(r=>r.ok?r.json():{}).catch(()=>({})),
      ])
      setCfg(c||{}); setHealth(h); setModelos(m?.provedores||[])
      const mv={}; MSGS.forEach(m=>{ if(c[m.campo]) mv[m.campo]=c[m.campo] }); setMsgVals(mv)
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!autoR || active !== 'monitor' || !api) return
    timerRef.current = setInterval(() => {
      fetch(`${api}/api/ia/health`).then(r=>r.ok?r.json():null).then(h=>h&&setHealth(h)).catch(()=>{})
    }, 30000)
    return () => clearInterval(timerRef.current)
  }, [autoR, active, api])

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
        body:JSON.stringify({ geminiKey:cfg.geminiKey, modelo:cfg.modelo })
      })
      setTesteRes(await r.json())
    } catch { setTesteRes({ ok:false, erro:'Erro de conexão' }) }
    setTestando(false)
  }

  const chart14 = (health?.historico||[]).map(d=>({
    dia: new Date(d.dia).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),
    chamadas: d.chamadas, custo: parseFloat(d.custo)||0, taxa: d.taxa,
  }))

  const provedorAtual = modelos.find(p=>p.id===(cfg.provedor||'google'))
  const modelosDisp   = provedorAtual?.modelos || []

  // ── Titles ──
  const PAGE_META = {
    monitor:  { title:'Saúde da IA',       sub:'Monitor em tempo real' },
    costs:    { title:'Custos & Uso',       sub:'Análise financeira da IA' },
    modelo:   { title:'LLM & API Keys',    sub:'Modelo e credenciais' },
    params:   { title:'Parâmetros',         sub:'Ajustes finos do modelo' },
    msgs:     { title:'Mensagens',          sub:'13 mensagens configuráveis' },
    bypasses: { title:'Bypasses',           sub:'Fluxos automáticos ativos' },
  }
  const meta = PAGE_META[active] || {}

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <RefreshCw size={18} className="animate-spin" style={{ color:'var(--accent)' }}/>
    </div>
  )

  return (
    <div className="h-full flex overflow-hidden" style={{ background:'var(--bg)' }}>
      <NavSidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed}/>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="px-6 py-3.5 flex-shrink-0 flex items-center gap-4"
          style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color:'var(--label)' }}>{meta.title}</h2>
            <p className="text-[11px]" style={{ color:'var(--label-4)' }}>{meta.sub}</p>
          </div>
          {health && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border`}
              style={health.status==='operacional'
                ?{background:'rgba(34,197,94,.08)',color:'#22c55e',borderColor:'rgba(34,197,94,.25)'}
                :{background:'rgba(245,158,11,.08)',color:'#f59e0b',borderColor:'rgba(245,158,11,.25)'}}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:'currentColor' }}/>
              {health.status==='operacional'?'Operacional':health.status==='degradado'?'Degradado':'Instável'}
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={()=>{setAutoR(v=>!v)}}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] border transition-all`}
              style={autoR?{background:'rgba(34,197,94,.08)',color:'#22c55e',borderColor:'rgba(34,197,94,.25)'}
                         :{background:'var(--fill)',color:'var(--label-4)',borderColor:'var(--sep)'}}>
              {autoR?<Wifi size={12}/>:<WifiOff size={12}/>} {autoR?'Live':'Off'}
            </button>
            <button onClick={carregar} className="p-2 rounded-xl transition-colors"
              style={{ background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-4)' }}>
              <RefreshCw size={13}/>
            </button>
            {erro && <span className="text-[11px]" style={{ color:'#ef4444' }}>{erro}</span>}
            <button onClick={salvar} disabled={salvando}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
              style={{ background:salvo?'#22c55e':'var(--accent)', color:'#000', border:'none' }}>
              {salvo?<><CheckCircle size={13}/> Salvo</>:salvando?'Salvando...':<><Save size={13}/> Salvar</>}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-5">

            {/* ══ MONITOR ══ */}
            {active==='monitor' && <>
              {!health ? (
                <div className="rounded-2xl p-8 flex flex-col items-center gap-3 text-center"
                  style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                  <AlertTriangle size={20} style={{ color:'var(--label-4)' }}/>
                  <p className="text-[13px]" style={{ color:'var(--label-3)' }}>
                    Nenhum dado de monitoramento ainda.<br/>
                    Configure a API Key e os dados aparecem conforme a IA processa mensagens.
                  </p>
                  <button onClick={carregar} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] mt-2"
                    style={{ background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-3)' }}>
                    <RefreshCw size={12}/> Tentar novamente
                  </button>
                </div>
              ) : <>
                <div className="grid grid-cols-4 gap-3">
                  <KpiCard label="Chamadas hoje" value={health.chamadas_hoje} sub={`${health.chamadas_hora}/h agora`} icon={BarChart3} cor="#00d4aa"/>
                  <KpiCard label="Taxa de sucesso" value={`${health.taxa_sucesso}%`} sub="últimas 20 chamadas" icon={Activity} cor="#22c55e"
                    trend={parseFloat(health.taxa_sucesso)>=95?5:parseFloat(health.taxa_sucesso)>=70?0:-10}/>
                  <KpiCard label="Custo hoje" value={`$${health.custo_hoje_usd}`} sub={`Mês: $${health.custo_mes_usd}`} icon={DollarSign} cor="#f59e0b"/>
                  <KpiCard label="Erros hoje" value={health.erros_hoje} sub={`${health.ok_hoje} com sucesso`} icon={AlertTriangle} cor={health.erros_hoje>0?'#ef4444':'#22c55e'}
                    trend={health.erros_hoje>0?-10:5}/>
                </div>

                {chart14.length>0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 rounded-2xl p-5" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color:'var(--label-3)' }}>Chamadas — 14 dias</p>
                        <TrendingUp size={14} style={{ color:'var(--accent)' }}/>
                      </div>
                      <ResponsiveContainer width="100%" height={140}>
                        <AreaChart data={chart14}>
                          <defs>
                            <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="dia" tick={{ fontSize:10, fill:'var(--label-4)' }} axisLine={false} tickLine={false}/>
                          <YAxis tick={{ fontSize:10, fill:'var(--label-4)' }} axisLine={false} tickLine={false} width={28}/>
                          <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:10, fontSize:11 }}/>
                          <Area type="monotone" dataKey="chamadas" stroke="#00d4aa" strokeWidth={2} fill="url(#gC)"/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="rounded-2xl p-5 flex flex-col" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                      <p className="text-[12px] font-semibold uppercase tracking-wider mb-1" style={{ color:'var(--label-3)' }}>Health Score</p>
                      <HealthRing taxa={health.taxa_sucesso}/>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="text-center">
                          <div className="text-[14px] font-bold" style={{ color:'#22c55e' }}>{health.ok_hoje}</div>
                          <div className="text-[9px]" style={{ color:'var(--label-4)' }}>OK</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[14px] font-bold" style={{ color:'#ef4444' }}>{health.erros_hoje}</div>
                          <div className="text-[9px]" style={{ color:'var(--label-4)' }}>Erros</div>
                        </div>
                      </div>
                      <div className="text-center mt-2">
                        <div className="text-[10px]" style={{ color:'var(--label-4)' }}>
                          Última: {health.ultima_chamada?new Date(health.ultima_chamada).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'—'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {chart14.length>0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl p-5" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                      <p className="text-[12px] font-semibold uppercase tracking-wider mb-3" style={{ color:'var(--label-3)' }}>Custo diário (USD)</p>
                      <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={chart14}>
                          <XAxis dataKey="dia" tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false}/>
                          <YAxis tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false} width={38} tickFormatter={v=>`$${v.toFixed(3)}`}/>
                          <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:10, fontSize:11 }}
                            formatter={v=>[`$${parseFloat(v).toFixed(4)}`,'Custo']}/>
                          <Bar dataKey="custo" radius={[3,3,0,0]}>
                            {chart14.map((_,i)=><Cell key={i} fill="#f59e0b" opacity={0.7}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="rounded-2xl p-5" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                      <p className="text-[12px] font-semibold uppercase tracking-wider mb-3" style={{ color:'var(--label-3)' }}>Taxa de sucesso (%)</p>
                      <ResponsiveContainer width="100%" height={100}>
                        <AreaChart data={chart14}>
                          <defs>
                            <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="dia" tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false}/>
                          <YAxis domain={[0,100]} tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false} width={28}/>
                          <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:10, fontSize:11 }} formatter={v=>[`${v}%`,'Taxa']}/>
                          <Area type="monotone" dataKey="taxa" stroke="#22c55e" strokeWidth={2} fill="url(#gT)"/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="rounded-xl px-5 py-3.5 flex items-center gap-3"
                  style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                  <Clock size={13} style={{ color:'var(--label-4)' }}/>
                  <span className="text-[12px]" style={{ color:'var(--label-3)' }}>
                    Última chamada: <strong style={{ color:'var(--label)' }}>
                      {health.ultima_chamada?new Date(health.ultima_chamada).toLocaleString('pt-BR'):'—'}
                    </strong>
                  </span>
                  <div className="flex-1"/>
                  <Hash size={11} style={{ color:'var(--label-4)' }}/>
                  <span className="text-[11px]" style={{ color:'var(--label-4)' }}>
                    {(health.total_tokens||0).toLocaleString('pt-BR')} tokens total · custo total: <strong style={{ color:'var(--label-3)' }}>${health.custo_total_usd}</strong>
                  </span>
                </div>
              </>}
            </>}

            {/* ══ COSTS ══ */}
            {active==='costs' && <>
              <div className="grid grid-cols-4 gap-3">
                <KpiCard label="Total tokens" value={(health?.total_tokens||0).toLocaleString('pt-BR')} sub="histórico" icon={Hash} cor="#a78bfa"/>
                <KpiCard label="Custo mês" value={`$${health?.custo_mes_usd||'0.0000'}`} sub="últimos 30 dias" icon={DollarSign} cor="#f59e0b"/>
                <KpiCard label="Custo total" value={`$${health?.custo_total_usd||'0.0000'}`} sub="histórico completo" icon={TrendingUp} cor="#00d4aa"/>
                <KpiCard label="Chamadas total" value={health?.chamadas_hoje||'—'} sub="hoje" icon={BarChart3} cor="#4a9fff"/>
              </div>
            </>}

            {/* ══ MODELO ══ */}
            {active==='modelo' && <>
              <Section title="Provedor de IA">
                <div className="grid grid-cols-2 gap-3">
                  {[{id:'google',l:'Google Gemini',desc:'Recomendado',cor:'#4a9fff'},{id:'anthropic',l:'Anthropic Claude',desc:'Alta capacidade',cor:'#e879f9'}].map(p=>{
                    const on=(cfg.provedor||'google')===p.id
                    return (
                      <button key={p.id} onClick={()=>set('provedor',p.id)}
                        className="p-4 rounded-xl text-left transition-all"
                        style={{ background:on?`${p.cor}10`:'var(--bg)', border:`1px solid ${on?p.cor+'45':'var(--sep)'}` }}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="w-2 h-2 rounded-full" style={{ background:on?p.cor:'var(--fill)' }}/>
                          <span className="text-[13px] font-semibold" style={{ color:on?p.cor:'var(--label)' }}>{p.l}</span>
                        </div>
                        <p className="text-[11px] ml-4" style={{ color:'var(--label-4)' }}>{p.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </Section>

              <Section title="Modelo">
                {modelosDisp.length>0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {modelosDisp.map(m=>{
                      const on=cfg.modelo===m.id
                      return (
                        <button key={m.id} onClick={()=>set('modelo',m.id)}
                          className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                          style={{ background:on?'var(--accent-dim)':'var(--bg)', border:`1px solid ${on?'var(--accent)':'var(--sep)'}` }}>
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{ borderColor:on?'var(--accent)':'var(--sep)' }}>
                            {on&&<div className="w-2 h-2 rounded-full" style={{ background:'var(--accent)' }}/>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12.5px] font-medium truncate" style={{ color:'var(--label)' }}>{m.nome}</span>
                              {m.freeTier&&<span className="text-[8px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background:'rgba(34,197,94,.1)',color:'#22c55e' }}>Free</span>}
                            </div>
                            <p className="text-[11px]" style={{ color:'var(--label-4)' }}>{m.desc}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-[9px]" style={{ color:'var(--label-4)' }}>in ${m.inputPer1M}/M</div>
                            <div className="text-[9px]" style={{ color:'var(--label-4)' }}>out ${m.outputPer1M}/M</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <FInput label="ID do modelo" value={cfg.modelo} onChange={v=>set('modelo',v)} placeholder="gemini-2.5-flash"/>
                )}
              </Section>

              <Section title="API Keys">
                <FInput label="Gemini API Key" hint="aistudio.google.com — começa com AIzaSy">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input type={showKey?'text':'password'} value={cfg.geminiKey||''} onChange={e=>set('geminiKey',e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full px-3 py-2 pr-9 rounded-xl text-[12.5px] outline-none"
                        style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)', fontFamily:'inherit' }}/>
                      <button type="button" onClick={()=>setShowKey(v=>!v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color:'var(--label-4)' }}>
                        {showKey?<EyeOff size={13}/>:<Eye size={13}/>}
                      </button>
                    </div>
                    <button onClick={testar} disabled={testando}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium flex-shrink-0"
                      style={{ background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-3)', minWidth:80 }}>
                      {testando?<RefreshCw size={12} className="animate-spin"/>:<TestTube2 size={12}/>}
                      {testando?'Testando':'Testar'}
                    </button>
                  </div>
                  <p className="text-[10px] mt-1" style={{ color:'var(--label-4)' }}>aistudio.google.com — começa com AIzaSy</p>
                </FInput>
                {testeRes && (
                  <div className={`flex items-start gap-2 p-3 rounded-xl text-[12px]`}
                    style={testeRes.ok
                      ?{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.25)',color:'#22c55e'}
                      :{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.25)',color:'#ef4444'}}>
                    {testeRes.ok?<CheckCircle size={13} className="flex-shrink-0 mt-0.5"/>:<XCircle size={13} className="flex-shrink-0 mt-0.5"/>}
                    <span>{testeRes.ok?`Chave válida${testeRes.resposta?' — resposta: '+testeRes.resposta:''}`:testeRes.erro}</span>
                  </div>
                )}
                <FInput label="Claude API Key (opcional)" type="password" value={cfg.claudeKey} onChange={v=>set('claudeKey',v)} placeholder="sk-ant-..." hint="console.anthropic.com"/>
              </Section>
            </>}

            {/* ══ PARÂMETROS ══ */}
            {active==='params' && <>
              <Section title="Temperatura do modelo">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color:'var(--label-4)' }}>Temperatura</span>
                    <span className="text-[14px] font-bold" style={{ color:'var(--accent)' }}>{parseFloat(cfg.temperatura||0.7).toFixed(1)}</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.1} value={parseFloat(cfg.temperatura||0.7)}
                    onChange={e=>set('temperatura',e.target.value)}
                    className="w-full" style={{ accentColor:'var(--accent)', cursor:'pointer' }}/>
                  <div className="flex justify-between mt-1 text-[10px]" style={{ color:'var(--label-4)' }}>
                    <span>0 — determinístico</span><span>1 — criativo</span>
                  </div>
                  {parseFloat(cfg.temperatura||0.7)>0.8 && (
                    <div className="flex items-start gap-2 mt-3 p-3 rounded-xl text-[11.5px]"
                      style={{ background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', color:'#f59e0b' }}>
                      <AlertTriangle size={13} className="flex-shrink-0 mt-0.5"/>
                      <span>Acima de 0.8 o Gemini pode retornar respostas instáveis (parts=0). Recomendado: 0.5–0.7.</span>
                    </div>
                  )}
                </div>
              </Section>
              <Section title="Tokens de saída">
                <FInput label="Max tokens" value={String(cfg.maxTokens||4000)} onChange={v=>set('maxTokens',parseInt(v)||4000)} hint="Recomendado: 4000. Não ultrapasse 8000."/>
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background:'var(--bg)', border:'1px solid var(--sep)' }}>
                  <span className="text-[12px]" style={{ color:'var(--label-3)' }}>System prompt atual</span>
                  <span className="text-[12px] font-mono font-semibold" style={{ color:'#22c55e' }}>~920 chars</span>
                </div>
              </Section>
            </>}

            {/* ══ MENSAGENS ══ */}
            {active==='msgs' && <>
              <div className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ background:'rgba(0,212,170,.06)', border:'1px solid rgba(0,212,170,.2)' }}>
                <MessageSquare size={14} style={{ color:'#00d4aa', flexShrink:0, marginTop:2 }}/>
                <p className="text-[12px] leading-relaxed" style={{ color:'var(--label-3)' }}>
                  Textos enviados diretamente ao cliente pelo sistema — sem passar pelo Gemini. Edite e clique <strong style={{ color:'var(--label)' }}>Salvar</strong>.
                </p>
              </div>
              {[...new Set(MSGS.map(m=>m.cat))].map(cat=>(
                <div key={cat}>
                  <Divider label={cat}/>
                  <div className="space-y-2">
                    {MSGS.filter(m=>m.cat===cat).map(msg=>(
                      <MsgAccordion key={msg.campo} msg={msg} value={msgVals[msg.campo]} onChange={setMsg}/>
                    ))}
                  </div>
                </div>
              ))}
            </>}

            {/* ══ BYPASSES ══ */}
            {active==='bypasses' && <BypassGrid/>}

          </div>
        </div>
      </div>
    </div>
  )
}
