import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, RefreshCw, X, Package, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp, ArrowUpDown,
  ExternalLink, BarChart3, Layers, Star, Zap, ShoppingCart,
  DollarSign, Archive, Filter, SlidersHorizontal, Bell, Eye,
  XCircle, Activity, Package2, ChevronRight
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// ── Helpers ───────────────────────────────────────────────────────────────────
const R   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmt = n => Number(n||0).toLocaleString('pt-BR')
const fmtK = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n)

// ── Curva ABC config ──────────────────────────────────────────────────────────
const ABC = {
  A: { cor:'#22c55e', bg:'rgba(34,197,94,.12)',   bdr:'rgba(34,197,94,.3)',   label:'Classe A', desc:'80% da receita potencial — máxima prioridade' },
  B: { cor:'#4a9fff', bg:'rgba(74,159,255,.12)',  bdr:'rgba(74,159,255,.3)',  label:'Classe B', desc:'15% da receita — gerenciar bem' },
  C: { cor:'var(--label-4)', bg:'var(--fill)',    bdr:'var(--sep)',           label:'Classe C', desc:'5% da receita — baixa prioridade' },
}

// ── Alerta config ─────────────────────────────────────────────────────────────
const ALERT_CFG = {
  critico: { cor:'#ef4444', bg:'rgba(239,68,68,.1)',   bdr:'rgba(239,68,68,.25)',  icon:XCircle,      label:'Crítico' },
  urgente: { cor:'#f97316', bg:'rgba(249,115,22,.1)',  bdr:'rgba(249,115,22,.25)', icon:AlertTriangle, label:'Urgente' },
  aviso:   { cor:'#f59e0b', bg:'rgba(245,158,11,.1)',  bdr:'rgba(245,158,11,.25)', icon:AlertTriangle, label:'Aviso' },
  info:    { cor:'#4a9fff', bg:'rgba(74,159,255,.1)',  bdr:'rgba(74,159,255,.25)', icon:Bell,          label:'Atenção' },
}

// ── Status de estoque ─────────────────────────────────────────────────────────
function getStatus(estoque) {
  if (estoque === 0)     return { label:'Zerado',  cor:'#ef4444', bg:'rgba(239,68,68,.1)'   }
  if (estoque <= 5)      return { label:'Crítico', cor:'#f97316', bg:'rgba(249,115,22,.1)'  }
  if (estoque <= 15)     return { label:'Baixo',   cor:'#f59e0b', bg:'rgba(245,158,11,.1)'  }
  return                        { label:'OK',      cor:'#22c55e', bg:'rgba(34,197,94,.1)'   }
}

// ── Barra de estoque visual ───────────────────────────────────────────────────
function EstoqueBar({ value, max, cor }) {
  const pct = max > 0 ? Math.min((value/max)*100, 100) : 0
  return (
    <div style={{ height:4, borderRadius:99, background:'var(--fill)', overflow:'hidden', minWidth:60 }}>
      <div style={{ height:'100%', borderRadius:99, background:cor, width:`${pct}%`, transition:'width .6s cubic-bezier(.4,0,.2,1)' }}/>
    </div>
  )
}

// ── Badge ABC ──────────────────────────────────────────────────────────────────
function ABCBadge({ curva }) {
  const c = ABC[curva] || ABC.C
  return (
    <span style={{ fontSize:11, fontWeight:800, padding:'2px 8px', borderRadius:99, background:c.bg, color:c.cor, border:`1px solid ${c.bdr}`, letterSpacing:'.03em' }}>
      {curva}
    </span>
  )
}

// ── Produto drawer ────────────────────────────────────────────────────────────
function ProdutoSheet({ produto, onClose }) {
  const status = getStatus(produto.estoque)
  const abc    = ABC[produto.curvaABC] || ABC.C
  const ABCIcon = produto.curvaABC === 'A' ? Star : produto.curvaABC === 'B' ? TrendingUp : Archive
  const imgUrl = produto.imagem

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:40, backdropFilter:'blur(3px)' }}/>
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:460, zIndex:50, background:'var(--bg-2)', borderLeft:'1px solid var(--sep)', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'-24px 0 80px rgba(0,0,0,.35)' }}>

        {/* Header */}
        <div style={{ padding:'20px 22px 16px', borderBottom:'1px solid var(--sep)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1, minWidth:0 }}>
              {/* Imagem ou placeholder */}
              <div style={{ width:60, height:60, borderRadius:12, background:'var(--bg)', border:'1px solid var(--sep)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                {imgUrl
                  ? <img src={imgUrl} alt={produto.nome} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                  : <Package2 size={24} style={{ color:'var(--label-4)' }}/>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <h3 style={{ fontSize:15, fontWeight:800, color:'var(--label)', margin:'0 0 6px', lineHeight:1.3 }}>{produto.nome}</h3>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <ABCBadge curva={produto.curvaABC}/>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, background:status.bg, color:status.cor }}>
                    {status.label} · {produto.estoque} un
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ padding:7, borderRadius:9, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', display:'flex', flexShrink:0, marginLeft:10 }}>
              <X size={14}/>
            </button>
          </div>

          {/* KPIs rápidos */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {[
              { l:'Preço venda',  v:R(produto.preco),          c:'var(--accent)' },
              { l:'Em estoque',   v:`${fmt(produto.estoque)} un`, c:status.cor },
              { l:'Valor estoque',v:R(produto.valorEstoque),   c:'var(--label)' },
            ].map(k => (
              <div key={k.l} style={{ padding:'8px 10px', borderRadius:9, background:'var(--bg)', border:'1px solid var(--sep)', textAlign:'center' }}>
                <div style={{ fontSize:13, fontWeight:800, color:k.c, lineHeight:1 }}>{k.v}</div>
                <div style={{ fontSize:9, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.05em', marginTop:3 }}>{k.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>

          {/* Alerta de estoque se crítico */}
          {produto.estoque <= 15 && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'10px 14px', borderRadius:10, background:ALERT_CFG[produto.estoque===0?'critico':produto.estoque<=5?'urgente':'aviso'].bg, border:`1px solid ${ALERT_CFG[produto.estoque===0?'critico':produto.estoque<=5?'urgente':'aviso'].bdr}`, marginBottom:14 }}>
              <AlertTriangle size={14} style={{ color:ALERT_CFG[produto.estoque===0?'critico':produto.estoque<=5?'urgente':'aviso'].cor, flexShrink:0, marginTop:1 }}/>
              <p style={{ fontSize:12.5, color:'var(--label-2)', margin:0, lineHeight:1.5 }}>
                {produto.estoque === 0 ? 'Produto sem estoque. Clientes que buscarem receberão botão "Avise-me".' :
                 produto.estoque <= 5  ? `Estoque crítico: apenas ${produto.estoque} unidade${produto.estoque!==1?'s':''}. Reabastecer com urgência.` :
                 `Estoque baixo: ${produto.estoque} unidades. Planejar reposição em breve.`}
              </p>
            </div>
          )}

          {/* Curva ABC explicação */}
          <div style={{ padding:'12px 14px', borderRadius:12, background:abc.bg, border:`1px solid ${abc.bdr}`, marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
              <ABCIcon size={13} style={{ color:abc.cor }}/>
              <span style={{ fontSize:12.5, fontWeight:700, color:abc.cor }}>{abc.label}</span>
            </div>
            <p style={{ fontSize:12, color:'var(--label-3)', margin:0, lineHeight:1.5 }}>{abc.desc}</p>
            <p style={{ fontSize:11, color:'var(--label-4)', margin:'6px 0 0' }}>
              Acumula {produto.pctAcum}% da receita potencial do catálogo
            </p>
          </div>

          {/* Detalhes */}
          <div style={{ background:'var(--bg)', borderRadius:12, border:'1px solid var(--sep)', overflow:'hidden', marginBottom:12 }}>
            {[
              ['Código SKU',     produto.codigo,                           'monospace'],
              ['Bling ID',       produto.bling_id,                         'monospace'],
              ['Unidade',        produto.unidade || 'UN',                  'inherit'],
              ['Peso',           produto.peso > 0 ? `${produto.peso}kg` : '—', 'inherit'],
              ['Vendas 30d',     produto.vendas30d > 0 ? `${produto.vendas30d} un` : 'Sem dados', 'inherit'],
              ['Receita potencial', R(produto.receitaPot),                 'inherit'],
            ].map(([lb, vl, ff], i, arr) => (
              <div key={lb} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 14px', borderBottom:i<arr.length-1?'1px solid var(--sep)':'none' }}>
                <span style={{ fontSize:12, color:'var(--label-3)' }}>{lb}</span>
                <span style={{ fontSize:12.5, fontWeight:600, color:'var(--label)', fontFamily:ff }}>{vl}</span>
              </div>
            ))}
          </div>

          {/* Descrição */}
          {produto.descricao && (
            <div style={{ background:'var(--bg)', borderRadius:12, border:'1px solid var(--sep)', padding:'12px 14px', marginBottom:12 }}>
              <p style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:8 }}>Descrição</p>
              <p style={{ fontSize:12.5, color:'var(--label-2)', lineHeight:1.6, margin:0 }}>{produto.descricao}</p>
            </div>
          )}

          {/* Links */}
          <a href={`https://www.bling.com.br/cadastros.php#/cadastros/produtos/${produto.bling_id}`} target="_blank" rel="noreferrer"
            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', textDecoration:'none', fontSize:12.5, fontWeight:500 }}>
            <ExternalLink size={13}/> Ver no Bling
          </a>
        </div>
      </div>
    </>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function PageEstoque({ api }) {
  const [produtos,   setProdutos]   = useState([])
  const [alertas,    setAlertas]    = useState([])
  const [stats,      setStats]      = useState({})
  const [loading,    setLoading]    = useState(true)
  const [busca,      setBusca]      = useState('')
  const [filtroABC,  setFiltroABC]  = useState('todos')
  const [filtroStat, setFiltroStat] = useState('todos') // todos|zerado|critico|baixo|ok
  const [sortCol,    setSortCol]    = useState('receitaPot')
  const [sortDir,    setSortDir]    = useState('desc')
  const [pagina,     setPagina]     = useState(1)
  const [sel,        setSel]        = useState(null)
  const [showAlertas,setShowAlertas]= useState(true)
  const POR_PAG = 25

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/estoque`)
      if (r.ok) {
        const d = await r.json()
        setProdutos(d.produtos || [])
        setAlertas(d.alertas || [])
        setStats(d.stats || {})
      }
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  // Filtros + sort
  const filtrados = produtos.filter(p => {
    const status = getStatus(p.estoque)
    const matchABC  = filtroABC === 'todos' || p.curvaABC === filtroABC
    const matchStat = filtroStat === 'todos'
      || (filtroStat==='zerado'  && p.estoque===0)
      || (filtroStat==='critico' && p.estoque>0 && p.estoque<=5)
      || (filtroStat==='baixo'   && p.estoque>5 && p.estoque<=15)
      || (filtroStat==='ok'      && p.estoque>15)
    const matchBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.codigo||'').toLowerCase().includes(busca.toLowerCase())
    return matchABC && matchStat && matchBusca
  }).sort((a, b) => {
    let va, vb
    if (sortCol==='receitaPot')   { va=a.receitaPot;    vb=b.receitaPot }
    else if (sortCol==='estoque') { va=a.estoque;       vb=b.estoque }
    else if (sortCol==='preco')   { va=a.preco;         vb=b.preco }
    else if (sortCol==='valor')   { va=a.valorEstoque;  vb=b.valorEstoque }
    else if (sortCol==='nome')    { va=a.nome.toLowerCase(); vb=b.nome.toLowerCase() }
    else                          { va=a.receitaPot;    vb=b.receitaPot }
    return sortDir==='asc' ? (va>vb?1:-1) : (va<vb?1:-1)
  })

  const total    = filtrados.length
  const inicio   = (pagina-1)*POR_PAG
  const pageData = filtrados.slice(inicio, inicio+POR_PAG)
  const totalPgs = Math.ceil(total/POR_PAG)
  const maxEst   = Math.max(...filtrados.map(p=>p.estoque), 1)

  const toggleSort = col => { setSortCol(col); setSortDir(d => sortCol===col?(d==='asc'?'desc':'asc'):'desc') }
  const SortIco = ({col}) => sortCol===col?(sortDir==='asc'?<ChevronUp size={10}/>:<ChevronDown size={10}/>):<ArrowUpDown size={9} style={{opacity:.25}}/>

  // Dados para o mini gráfico de pizza ABC
  const pieData = [
    { name:'A', value:stats.curva?.A||0, cor:'#22c55e' },
    { name:'B', value:stats.curva?.B||0, cor:'#4a9fff' },
    { name:'C', value:stats.curva?.C||0, cor:'var(--label-4)' },
  ].filter(d=>d.value>0)

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'22px 26px', background:'var(--bg)' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--label)', margin:0, letterSpacing:'-.5px' }}>Estoque</h1>
          <p style={{ fontSize:12, color:'var(--label-4)', margin:'3px 0 0' }}>
            {loading ? 'Carregando...' : `${fmt(stats.total||0)} produtos · curva ABC · alertas de ruptura`}
          </p>
        </div>
        <button onClick={carregar} style={{ width:36, height:36, borderRadius:9, border:'1px solid var(--sep)', background:'var(--bg-2)', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <RefreshCw size={14} style={{ animation:loading?'spin 1s linear infinite':undefined }}/>
        </button>
      </div>

      {/* Alertas — destaque máximo */}
      {alertas.length > 0 && (
        <div style={{ marginBottom:18 }}>
          <button onClick={()=>setShowAlertas(v=>!v)} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid rgba(239,68,68,.3)', background:'rgba(239,68,68,.06)', cursor:'pointer', textAlign:'left', marginBottom: showAlertas ? 8 : 0 }}>
            <Bell size={14} style={{ color:'#ef4444', flexShrink:0, animation:'pulse 2s ease infinite' }}/>
            <span style={{ fontSize:13, fontWeight:700, color:'#ef4444', flex:1 }}>
              {alertas.length} alerta{alertas.length!==1?'s':''} de ruptura
            </span>
            {showAlertas ? <ChevronUp size={13} style={{ color:'#ef4444' }}/> : <ChevronDown size={13} style={{ color:'#ef4444' }}/>}
          </button>
          {showAlertas && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {alertas.map((a, i) => {
                const cfg = ALERT_CFG[a.nivel] || ALERT_CFG.info
                const Icon = cfg.icon
                return (
                  <div key={i} onClick={() => { const p=produtos.find(x=>x.bling_id===a.bling_id); if(p) setSel(p) }}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderRadius:9, background:cfg.bg, border:`1px solid ${cfg.bdr}`, cursor:'pointer' }}
                    onMouseEnter={e=>e.currentTarget.style.opacity='.8'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                    <Icon size={13} style={{ color:cfg.cor, flexShrink:0 }}/>
                    <span style={{ fontSize:12, color:'var(--label-2)', flex:1, lineHeight:1.4 }}>{a.msg}</span>
                    <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:99, background:`${cfg.cor}20`, color:cfg.cor }}>{cfg.label}</span>
                    <ChevronRight size={12} style={{ color:cfg.cor, flexShrink:0 }}/>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:18 }}>
        {[
          { icon:Package,       label:'Total produtos',    value:fmt(stats.total||0),          cor:'#7c6af7' },
          { icon:DollarSign,    label:'Valor em estoque',  value:`R$ ${fmtK(stats.valor_total_estoque||0)}`, cor:'#00d4aa' },
          { icon:XCircle,       label:'Zerados',           value:fmt(stats.zerados||0),        cor:'#ef4444' },
          { icon:AlertTriangle, label:'Críticos (≤5)',      value:fmt(stats.criticos||0),       cor:'#f97316' },
          { icon:Star,          label:'Classe A',           value:fmt(stats.curva?.A||0),       cor:'#22c55e' },
          { icon:Activity,      label:'Classe B',           value:fmt(stats.curva?.B||0),       cor:'#4a9fff' },
        ].map(k => (
          <div key={k.label} style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12, padding:'12px 14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:`${k.cor}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <k.icon size={13} style={{ color:k.cor }}/>
              </div>
            </div>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:4 }}>{k.label}</div>
            <div style={{ fontSize:19, fontWeight:800, color:k.cor, letterSpacing:'-.3px', lineHeight:1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Curva ABC visual + filtros */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'start', marginBottom:16 }}>
        {/* Filtros */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          {/* ABC */}
          {[['todos','Todos',stats.total||0,'#888'],['A','Classe A',stats.curva?.A||0,'#22c55e'],['B','Classe B',stats.curva?.B||0,'#4a9fff'],['C','Classe C',stats.curva?.C||0,'var(--label-4)']].map(([k,lb,ct,cor])=>(
            <button key={k} onClick={()=>{setFiltroABC(k);setPagina(1)}} style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:99,fontSize:12,fontWeight:filtroABC===k?700:500,cursor:'pointer',border:`1px solid ${filtroABC===k?cor:'var(--sep)'}`,background:filtroABC===k?`${cor}15`:'var(--bg-2)',color:filtroABC===k?cor:'var(--label-3)',transition:'all .1s' }}>
              {lb} <span style={{ fontSize:10,fontWeight:700,padding:'0 4px',borderRadius:99,background:filtroABC===k?`${cor}25`:'var(--fill)',color:filtroABC===k?cor:'var(--label-4)' }}>{ct}</span>
            </button>
          ))}
          <div style={{ width:1,height:20,background:'var(--sep)' }}/>
          {/* Status */}
          {[['todos','Todos'],['zerado','Zerado'],['critico','Crítico'],['baixo','Baixo'],['ok','OK']].map(([k,lb])=>{
            const cors={todos:'#888',zerado:'#ef4444',critico:'#f97316',baixo:'#f59e0b',ok:'#22c55e'}
            const cor=cors[k]
            return (
              <button key={k} onClick={()=>{setFiltroStat(k);setPagina(1)}} style={{ padding:'5px 12px',borderRadius:99,fontSize:12,fontWeight:filtroStat===k?700:500,cursor:'pointer',border:`1px solid ${filtroStat===k?cor:'var(--sep)'}`,background:filtroStat===k?`${cor}15`:'var(--bg-2)',color:filtroStat===k?cor:'var(--label-3)',transition:'all .1s' }}>
                {lb}
              </button>
            )
          })}
        </div>

        {/* Busca */}
        <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 11px', borderRadius:9, border:'1px solid var(--sep)', background:'var(--bg-2)', minWidth:240 }}>
          <Search size={12} style={{ color:'var(--label-4)', flexShrink:0 }}/>
          <input value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1)}} placeholder="Buscar produto ou código..." style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:12.5, color:'var(--label)' }}/>
          {busca && <button onClick={()=>setBusca('')} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--label-4)', display:'flex' }}><X size={11}/></button>}
        </div>
      </div>

      {/* Tabela */}
      {loading && !produtos.length ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'60px' }}>
          <RefreshCw size={22} style={{ color:'var(--accent)', animation:'spin 1s linear infinite' }}/>
          <span style={{ fontSize:13, color:'var(--label-4)' }}>Carregando catálogo e calculando curva ABC...</span>
        </div>
      ) : (
        <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--fill)' }}>
                  {[
                    ['nome',       'Produto',          true,  260],
                    ['abc',        'ABC',              false, 60],
                    ['estoque',    'Estoque',          true,  110],
                    ['status',     'Status',           false, 90],
                    ['preco',      'Preço',            true,  100],
                    ['valor',      'Valor em estoque', true,  130],
                    ['receitaPot', 'Receita pot.',     true,  120],
                  ].map(([k,lb,sort,w]) => (
                    <th key={k} onClick={sort?()=>toggleSort(k):undefined}
                      style={{ textAlign:'left', padding:'10px 14px', fontSize:10, fontWeight:700, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid var(--sep)', whiteSpace:'nowrap', cursor:sort?'pointer':'default', userSelect:'none', minWidth:w }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>{lb}{sort&&<SortIco col={k}/>}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.length===0 ? (
                  <tr><td colSpan={7} style={{ padding:48, textAlign:'center' }}>
                    <Package size={28} style={{ display:'block', margin:'0 auto 10px', opacity:.3 }}/>
                    <span style={{ fontSize:12, color:'var(--label-4)' }}>Nenhum produto encontrado</span>
                  </td></tr>
                ) : pageData.map((p, i) => {
                  const status = getStatus(p.estoque)
                  const flash  = p.estoque === 0 || p.estoque <= 5
                  return (
                    <tr key={p.bling_id} onClick={()=>setSel(p)}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--fill)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                      style={{ borderTop:'1px solid var(--sep)', cursor:'pointer', transition:'background .08s' }}>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                          {/* Mini thumbnail */}
                          <div style={{ width:32, height:32, borderRadius:7, background:'var(--bg)', border:'1px solid var(--sep)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                            {p.imagem
                              ? <img src={p.imagem} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                              : <Package2 size={13} style={{ color:'var(--label-4)' }}/>
                            }
                          </div>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontSize:12.5, fontWeight:600, color:'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{p.nome}</div>
                            <div style={{ fontSize:10.5, color:'var(--label-4)', fontFamily:'monospace' }}>{p.codigo}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'10px 14px' }}><ABCBadge curva={p.curvaABC}/></td>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:status.cor }}>{fmt(p.estoque)} {p.unidade||'un'}</span>
                          <EstoqueBar value={p.estoque} max={maxEst} cor={status.cor}/>
                        </div>
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, background:status.bg, color:status.cor, whiteSpace:'nowrap' }}>
                          {flash && <span style={{ marginRight:3 }}>⚡</span>}{status.label}
                        </span>
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600, color:'var(--label)' }}>{R(p.preco)}</td>
                      <td style={{ padding:'10px 14px', fontSize:12, color:'var(--label-3)' }}>{R(p.valorEstoque)}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                          <span style={{ fontSize:12.5, fontWeight:700, color:'var(--accent)' }}>{R(p.receitaPot)}</span>
                          <span style={{ fontSize:9.5, color:'var(--label-4)' }}>{p.pctAcum}% acum.</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {total > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 14px', borderTop:'1px solid var(--sep)', fontSize:12, color:'var(--label-4)' }}>
              <span style={{ fontWeight:500 }}>{inicio+1}–{Math.min(inicio+POR_PAG,total)} de {total} produtos</span>
              {totalPgs > 1 && (
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={()=>setPagina(1)} disabled={pagina===1} style={{ padding:'4px 9px', borderRadius:6, border:'1px solid var(--sep)', background:'transparent', cursor:pagina===1?'default':'pointer', color:'var(--label-3)', opacity:pagina===1?.35:1, fontSize:12 }}>«</button>
                  <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={pagina===1} style={{ padding:'4px 9px', borderRadius:6, border:'1px solid var(--sep)', background:'transparent', cursor:pagina===1?'default':'pointer', color:'var(--label-3)', opacity:pagina===1?.35:1, fontSize:12 }}>‹</button>
                  {Array.from({length:Math.min(totalPgs,7)},(_,i)=>{
                    const pg=totalPgs<=7?i+1:pagina<=4?i+1:pagina>=(totalPgs-3)?totalPgs-6+i:pagina-3+i
                    return <button key={pg} onClick={()=>setPagina(pg)} style={{ width:30,height:30,borderRadius:7,border:`1px solid ${pagina===pg?'var(--accent)':'var(--sep)'}`,background:pagina===pg?'var(--accent)':'transparent',color:pagina===pg?'#000':'var(--label-3)',fontSize:12,cursor:'pointer',fontWeight:pagina===pg?700:400 }}>{pg}</button>
                  })}
                  <button onClick={()=>setPagina(p=>Math.min(totalPgs,p+1))} disabled={pagina===totalPgs} style={{ padding:'4px 9px', borderRadius:6, border:'1px solid var(--sep)', background:'transparent', cursor:pagina===totalPgs?'default':'pointer', color:'var(--label-3)', opacity:pagina===totalPgs?.35:1, fontSize:12 }}>›</button>
                  <button onClick={()=>setPagina(totalPgs)} disabled={pagina===totalPgs} style={{ padding:'4px 9px', borderRadius:6, border:'1px solid var(--sep)', background:'transparent', cursor:pagina===totalPgs?'default':'pointer', color:'var(--label-3)', opacity:pagina===totalPgs?.35:1, fontSize:12 }}>»</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {sel && <ProdutoSheet produto={sel} onClose={()=>setSel(null)}/>}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}
