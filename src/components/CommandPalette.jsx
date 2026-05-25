import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, LayoutDashboard, ShoppingCart, Users, CreditCard,
  MessageSquare, Bot, Settings, Zap, Send, Package, AlertCircle,
  Activity, CornerDownLeft, ArrowUp, ArrowDown, Hash, User,
  Clock, ChevronRight, Star, TrendingUp, RefreshCw, X,
  Layers, Package2, Truck, CheckCircle, XCircle
} from 'lucide-react'

// ── Mapeamento de situações (mesmo do PagePedidos) ─────────────────────────────
const SIT = {
  6:  { label:'Em Aberto',  cor:'#f59e0b' },
  9:  { label:'Atendido',   cor:'#4a9fff' },
  12: { label:'Cancelado',  cor:'#ef4444' },
  15: { label:'Verificado', cor:'#22c55e' },
}
function getSitId(p) {
  return typeof p.situacao==='object' ? p.situacao?.id||p.situacao?.valor : (p.situacaoId||p.situacao)
}
const R = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`

// ── Ícones de página ──────────────────────────────────────────────────────────
const PAGE_ICONS = {
  dashboard: LayoutDashboard, pedidos: ShoppingCart, clientes: Users,
  caixa: CreditCard, atendimento: MessageSquare, conversas: MessageSquare,
  gatilhos: Zap, disparos: Activity, ocorrencias: AlertCircle,
  iaconfig: Bot, llmconfig: Layers, reengajamento: Users,
  enviomassa: Send, avise: Package, config: Settings,
}

const PAGE_DESCS = {
  dashboard:    'Visão geral e métricas',
  pedidos:      'Pedidos, kanban e rastreio',
  clientes:     'CRM e histórico de clientes',
  caixa:        'Financeiro e fluxo de caixa',
  atendimento:  'Fila de atendimento humano',
  conversas:    'Todas as conversas WhatsApp',
  gatilhos:     'Automações e disparos',
  disparos:     'Histórico de disparos',
  ocorrencias:  'Ocorrências e tickets',
  iaconfig:     'Personalidade e integrações da IA',
  llmconfig:    'Modelo, métricas e bypasses',
  reengajamento:'Reativação de clientes',
}

// ── Fuzzy match score ─────────────────────────────────────────────────────────
function fuzzy(str, query) {
  if (!query) return 1
  const s = str.toLowerCase()
  const q = query.toLowerCase()
  if (s.includes(q)) return 2 + (s.startsWith(q) ? 1 : 0)
  let score = 0; let qi = 0
  for (let i = 0; i < s.length && qi < q.length; i++) {
    if (s[i] === q[qi]) { score++; qi++ }
  }
  return qi === q.length ? score / q.length : 0
}

function highlight(text, query) {
  if (!query || !text) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return <>
    {text.slice(0, idx)}
    <mark style={{ background:'var(--accent-dim)', color:'var(--accent)', borderRadius:2, padding:'0 1px' }}>
      {text.slice(idx, idx + query.length)}
    </mark>
    {text.slice(idx + query.length)}
  </>
}

// ── Ações rápidas ─────────────────────────────────────────────────────────────
const ACOES = [
  { id:'acao-wa',     label:'Abrir WhatsApp Business', icon:MessageSquare, grupo:'Ações', action:'link', href:'https://web.whatsapp.com' },
  { id:'acao-bling',  label:'Abrir painel Bling',       icon:Package,       grupo:'Ações', action:'link', href:'https://www.bling.com.br' },
  { id:'acao-ia-cfg', label:'Configurar a IA',           icon:Bot,           grupo:'Ações', action:'nav',  page:'iaconfig' },
  { id:'acao-llm',    label:'Ver saúde da IA',           icon:Activity,      grupo:'Ações', action:'nav',  page:'llmconfig' },
  { id:'acao-atend',  label:'Ir para atendimento',       icon:Users,         grupo:'Ações', action:'nav',  page:'atendimento' },
  { id:'acao-reload', label:'Recarregar página',         icon:RefreshCw,     grupo:'Ações', action:'fn',   fn: () => window.location.reload() },
]

// ── Componente principal ──────────────────────────────────────────────────────
export default function CommandPalette({ api, onNavigate, onClose }) {
  const [query,     setQuery]    = useState('')
  const [results,   setResults]  = useState({ pages:[], pedidos:[], clientes:[], produtos:[], acoes:[] })
  const [loading,   setLoading]  = useState(false)
  const [idx,       setIdx]      = useState(0)  // item selecionado
  const [recentes,  setRecentes] = useState([])
  const inputRef = useRef()
  const listRef  = useRef()
  const searchTO = useRef()

  // NAV pages como array com ícone
  const PAGES_NAV = [
    {id:'dashboard',label:'Dashboard',desc:PAGE_DESCS.dashboard,grupo:'Páginas'},
    {id:'pedidos',  label:'Pedidos',  desc:PAGE_DESCS.pedidos,  grupo:'Páginas'},
    {id:'clientes', label:'Clientes', desc:PAGE_DESCS.clientes, grupo:'Páginas'},
    {id:'caixa',    label:'Fluxo de Caixa',desc:PAGE_DESCS.caixa,grupo:'Páginas'},
    {id:'conversas',label:'Conversas',desc:PAGE_DESCS.conversas,grupo:'Páginas'},
    {id:'atendimento',label:'Atendimento',desc:PAGE_DESCS.atendimento,grupo:'Páginas'},
    {id:'gatilhos', label:'Gatilhos', desc:PAGE_DESCS.gatilhos, grupo:'Páginas'},
    {id:'ocorrencias',label:'Ocorrências',desc:PAGE_DESCS.ocorrencias,grupo:'Páginas'},
    {id:'iaconfig', label:'Config IA',desc:PAGE_DESCS.iaconfig, grupo:'Páginas'},
    {id:'llmconfig',label:'LLM & Bypasses',desc:PAGE_DESCS.llmconfig,grupo:'Páginas'},
    {id:'reengajamento',label:'Reengajamento',desc:PAGE_DESCS.reengajamento,grupo:'Páginas'},
  ]

  // Foca o input ao montar
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
    // Carrega recentes do sessionStorage
    try {
      const r = JSON.parse(sessionStorage.getItem('cmd_recentes') || '[]')
      setRecentes(r)
    } catch {}
  }, [])

  // Busca debounced
  useEffect(() => {
    clearTimeout(searchTO.current)
    if (!query.trim()) {
      setResults({ pages:[], pedidos:[], clientes:[], produtos:[], acoes:[] })
      setIdx(0); return
    }
    searchTO.current = setTimeout(() => buscar(query.trim()), 180)
    return () => clearTimeout(searchTO.current)
  }, [query])

  const buscar = useCallback(async (q) => {
    // Páginas — fuzzy local
    const pages = PAGES_NAV
      .map(p => ({ ...p, score: Math.max(fuzzy(p.label, q), fuzzy(p.desc||'', q)) }))
      .filter(p => p.score > 0.3)
      .sort((a,b) => b.score - a.score)
      .slice(0, 4)

    // Ações
    const acoes = ACOES
      .filter(a => fuzzy(a.label, q) > 0.3)
      .slice(0, 3)

    // Se parece número → busca pedido
    let pedidos = []
    if (/^\d+$/.test(q) && q.length >= 3) {
      setLoading(true)
      try {
        const r = await fetch(`${api}/api/dashboard/pedidos?limite=50`)
        if (r.ok) {
          const d = await r.json()
          pedidos = (d.pedidos || [])
            .filter(p => String(p.numero).includes(q) || (p.contato||'').toLowerCase().includes(q.toLowerCase()))
            .slice(0, 5)
        }
      } catch {}
      setLoading(false)
    }

    // Busca clientes + pedidos por nome
    let clientes = []; let pedidosPorNome = []
    if (q.length >= 2 && !/^\d+$/.test(q)) {
      setLoading(true)
      try {
        const [rc, rp] = await Promise.all([
          fetch(`${api}/api/dashboard/contatos`).then(r => r.ok ? r.json() : { contatos:[] }).catch(() => ({ contatos:[] })),
          fetch(`${api}/api/dashboard/pedidos?limite=100`).then(r => r.ok ? r.json() : { pedidos:[] }).catch(() => ({ pedidos:[] })),
        ])
        const ql = q.toLowerCase()
        clientes = (rc.contatos || [])
          .filter(c => (c.nome||'').toLowerCase().includes(ql) || (c.telefone||'').includes(ql))
          .slice(0, 4)
        pedidosPorNome = (rp.pedidos || [])
          .filter(p => (p.contato||'').toLowerCase().includes(ql))
          .sort((a,b) => b.numero - a.numero)
          .slice(0, 5)
        if (pedidos.length === 0) pedidos = pedidosPorNome
      } catch {}
      setLoading(false)
    }

    // Busca produtos
    let produtos = []
    if (q.length >= 2) {
      try {
        const r = await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(q)}&limit=4`)
        if (r.ok) { const d = await r.json(); produtos = d.produtos || [] }
      } catch {}
    }

    setResults({ pages, pedidos, clientes, produtos, acoes })
    setIdx(0)
  }, [api])

  // Flatten para navegação com ↑↓
  const allItems = [
    ...results.pages.map(p => ({ type:'page', ...p })),
    ...results.pedidos.map(p => ({ type:'pedido', ...p })),
    ...results.clientes.map(c => ({ type:'cliente', ...c })),
    ...results.produtos.map(p => ({ type:'produto', ...p })),
    ...results.acoes.map(a => ({ type:'acao', ...a })),
  ]

  // Keyboard navigation
  useEffect(() => {
    const fn = e => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i+1, allItems.length-1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i => Math.max(i-1, 0)) }
      if (e.key === 'Enter') {
        e.preventDefault()
        const item = allItems[idx]
        if (item) executar(item)
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [allItems, idx])

  // Scroll do item selecionado para a view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${idx}"]`)
    el?.scrollIntoView({ block:'nearest' })
  }, [idx])

  const salvarRecente = (item) => {
    const novo = { id: item.id||item.numero, label: item.label||item.contato||item.nome, type: item.type, page: item.id||'pedidos', ts: Date.now() }
    const atuais = JSON.parse(sessionStorage.getItem('cmd_recentes') || '[]')
    const filtrado = atuais.filter(r => r.id !== novo.id).slice(0, 4)
    sessionStorage.setItem('cmd_recentes', JSON.stringify([novo, ...filtrado]))
  }

  const executar = (item) => {
    salvarRecente(item)
    if (item.type === 'page') { onNavigate(item.id); onClose() }
    else if (item.type === 'pedido') { onNavigate('pedidos', { abrirPedido: item.numero }); onClose() }
    else if (item.type === 'cliente') { onNavigate('conversas', { telefone: item.telefone }); onClose() }
    else if (item.type === 'produto') { onNavigate('pedidos'); onClose() }
    else if (item.type === 'acao') {
      if (item.action === 'nav') { onNavigate(item.page); onClose() }
      else if (item.action === 'link') { window.open(item.href, '_blank'); onClose() }
      else if (item.action === 'fn') { item.fn?.(); onClose() }
    }
  }

  // ── Renderiza item ──────────────────────────────────────────────────────────
  const ItemPage = ({ item, flatIdx }) => {
    const Icon = PAGE_ICONS[item.id] || LayoutDashboard
    const sel = flatIdx === idx
    return (
      <button data-idx={flatIdx} onClick={() => executar(item)}
        onMouseEnter={() => setIdx(flatIdx)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, border:'none', cursor:'pointer', textAlign:'left', transition:'background .08s', background: sel ? 'var(--accent-dim)' : 'transparent' }}>
        <div style={{ width:30, height:30, borderRadius:8, background: sel ? 'var(--accent-dim)' : 'var(--fill)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${sel?'var(--accent)':'var(--sep)'}` }}>
          <Icon size={14} style={{ color: sel ? 'var(--accent)' : 'var(--label-3)' }}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:sel?600:400, color: sel ? 'var(--accent)' : 'var(--label)' }}>{highlight(item.label, query)}</div>
          {item.desc && <div style={{ fontSize:11, color:'var(--label-4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.desc}</div>}
        </div>
        {sel && <ChevronRight size={12} style={{ color:'var(--accent)', flexShrink:0 }}/>}
      </button>
    )
  }

  const ItemPedido = ({ item, flatIdx }) => {
    const sel = flatIdx === idx
    const sitId = getSitId(item)
    const sit = SIT[sitId] || SIT[9]
    return (
      <button data-idx={flatIdx} onClick={() => executar(item)}
        onMouseEnter={() => setIdx(flatIdx)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, border:'none', cursor:'pointer', textAlign:'left', background: sel ? 'var(--accent-dim)' : 'transparent' }}>
        <div style={{ width:30, height:30, borderRadius:8, background: sel ? 'var(--accent-dim)' : 'var(--fill)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${sel?'var(--accent)':'var(--sep)'}` }}>
          <Hash size={13} style={{ color: sel ? 'var(--accent)' : 'var(--label-3)' }}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:1 }}>
            <span style={{ fontSize:13, fontWeight:700, color: sel ? 'var(--accent)' : 'var(--accent)' }}>#{item.numero}</span>
            <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:99, background:`${sit.cor}15`, color:sit.cor }}>
              {sit.label}
            </span>
          </div>
          <div style={{ fontSize:11, color:'var(--label-4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {highlight(item.contato || '—', query)} · {item.data ? new Date(item.data+'T12:00:00').toLocaleDateString('pt-BR') : '—'}
          </div>
        </div>
        <div style={{ fontSize:12, fontWeight:700, color:'var(--label)', flexShrink:0 }}>{R(item.total)}</div>
        {sel && <ChevronRight size={12} style={{ color:'var(--accent)', flexShrink:0 }}/>}
      </button>
    )
  }

  const ItemCliente = ({ item, flatIdx }) => {
    const sel = flatIdx === idx
    const init = (item.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
    const pal = ['#7c6af7','#00d4aa','#f59e0b','#22c55e','#4a9fff','#e879f9']
    const cor = pal[(item.nome||'?').charCodeAt(0) % pal.length]
    return (
      <button data-idx={flatIdx} onClick={() => executar(item)}
        onMouseEnter={() => setIdx(flatIdx)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, border:'none', cursor:'pointer', textAlign:'left', background: sel ? 'var(--accent-dim)' : 'transparent' }}>
        <div style={{ width:30, height:30, borderRadius:'50%', background:`${cor}20`, border:`1.5px solid ${cor}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:cor, flexShrink:0 }}>{init}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:sel?600:400, color: sel ? 'var(--accent)' : 'var(--label)' }}>{highlight(item.nome || '—', query)}</div>
          <div style={{ fontSize:11, color:'var(--label-4)', fontFamily:'monospace' }}>{item.telefone || '—'}</div>
        </div>
        {sel && <ChevronRight size={12} style={{ color:'var(--accent)', flexShrink:0 }}/>}
      </button>
    )
  }

  const ItemProduto = ({ item, flatIdx }) => {
    const sel = flatIdx === idx
    const disp = item.disponivel || item.estoque > 0
    return (
      <button data-idx={flatIdx} onClick={() => executar(item)}
        onMouseEnter={() => setIdx(flatIdx)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, border:'none', cursor:'pointer', textAlign:'left', background: sel ? 'var(--accent-dim)' : 'transparent' }}>
        <div style={{ width:30, height:30, borderRadius:8, background: sel ? 'var(--accent-dim)' : 'var(--fill)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${sel?'var(--accent)':'var(--sep)'}` }}>
          <Package2 size={13} style={{ color: sel ? 'var(--accent)' : 'var(--label-3)' }}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:sel?600:400, color: sel ? 'var(--accent)' : 'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{highlight(item.nome || '—', query)}</div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:11, color:'var(--label-4)', fontFamily:'monospace' }}>{item.codigo}</span>
            <span style={{ fontSize:10, fontWeight:700, padding:'1px 5px', borderRadius:99, background:disp?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)', color:disp?'#22c55e':'#ef4444' }}>
              {disp ? `${item.estoque} un.` : 'Fora de estoque'}
            </span>
          </div>
        </div>
        <div style={{ fontSize:12, fontWeight:700, color:'var(--label)', flexShrink:0 }}>{R(item.preco)}</div>
        {sel && <ChevronRight size={12} style={{ color:'var(--accent)', flexShrink:0 }}/>}
      </button>
    )
  }

  const ItemAcao = ({ item, flatIdx }) => {
    const sel = flatIdx === idx
    const Icon = item.icon || Zap
    return (
      <button data-idx={flatIdx} onClick={() => executar(item)}
        onMouseEnter={() => setIdx(flatIdx)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, border:'none', cursor:'pointer', textAlign:'left', background: sel ? 'var(--accent-dim)' : 'transparent' }}>
        <div style={{ width:30, height:30, borderRadius:8, background: sel ? 'var(--accent-dim)' : 'var(--fill)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${sel?'var(--accent)':'var(--sep)'}` }}>
          <Icon size={13} style={{ color: sel ? 'var(--accent)' : 'var(--label-3)' }}/>
        </div>
        <div style={{ fontSize:13, fontWeight:sel?600:400, color: sel ? 'var(--accent)' : 'var(--label)', flex:1 }}>{item.label}</div>
        {sel && <ChevronRight size={12} style={{ color:'var(--accent)', flexShrink:0 }}/>}
      </button>
    )
  }

  // Renderiza grupo
  const Grupo = ({ titulo, children }) => (
    <div style={{ marginBottom:4 }}>
      <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-4)', padding:'6px 12px 3px' }}>{titulo}</div>
      {children}
    </div>
  )

  const temResultados = allItems.length > 0
  const semQuery = !query.trim()

  // Offset para índices corretos em cada grupo
  let offset = 0
  const pageOffset = 0;            offset += results.pages.length
  const pedidoOffset = offset;     offset += results.pedidos.length
  const clienteOffset = offset;    offset += results.clientes.length
  const produtoOffset = offset;    offset += results.produtos.length
  const acaoOffset = offset

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:999, backdropFilter:'blur(4px)' }}/>

      {/* Modal */}
      <div style={{ position:'fixed', top:'18%', left:'50%', transform:'translateX(-50%)', width:'min(620px, 92vw)', zIndex:1000, background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:16, boxShadow:'0 24px 80px rgba(0,0,0,.4)', overflow:'hidden' }}>

        {/* Busca */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderBottom:'1px solid var(--sep)' }}>
          {loading
            ? <RefreshCw size={16} style={{ color:'var(--accent)', flexShrink:0, animation:'spin 0.8s linear infinite' }}/>
            : <Search size={16} style={{ color:'var(--label-4)', flexShrink:0 }}/>
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar pedido, cliente, produto, página…"
            style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:15, color:'var(--label)', fontFamily:'inherit' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ padding:4, borderRadius:6, border:'none', background:'var(--fill)', color:'var(--label-4)', cursor:'pointer', display:'flex', flexShrink:0 }}>
              <X size={12}/>
            </button>
          )}
          <kbd style={{ fontSize:11, padding:'2px 7px', borderRadius:6, background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-4)', flexShrink:0, fontFamily:'inherit' }}>Esc</kbd>
        </div>

        {/* Resultados / Estado vazio */}
        <div ref={listRef} style={{ maxHeight:440, overflowY:'auto', padding:'8px' }}>

          {/* Estado vazio — mostra recentes e páginas principais */}
          {semQuery && (
            <>
              {recentes.length > 0 && (
                <Grupo titulo="Recentes">
                  {recentes.map((r, i) => {
                    const Icon = PAGE_ICONS[r.page] || Clock
                    return (
                      <button key={i} onClick={() => { onNavigate(r.page); onClose() }}
                        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, border:'none', cursor:'pointer', textAlign:'left', background:'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--fill)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <div style={{ width:30, height:30, borderRadius:8, background:'var(--fill)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid var(--sep)' }}>
                          <Icon size={13} style={{ color:'var(--label-3)' }}/>
                        </div>
                        <div style={{ fontSize:13, color:'var(--label)', flex:1 }}>{r.label}</div>
                        <Clock size={11} style={{ color:'var(--label-4)' }}/>
                      </button>
                    )
                  })}
                </Grupo>
              )}
              <Grupo titulo="Navegar para">
                {['dashboard','pedidos','conversas','clientes','caixa'].map(id => {
                  const Icon = PAGE_ICONS[id] || LayoutDashboard
                  const desc = PAGE_DESCS[id] || ''
                  const label = {dashboard:'Dashboard',pedidos:'Pedidos',conversas:'Conversas',clientes:'Clientes',caixa:'Fluxo de Caixa'}[id] || id
                  return (
                    <button key={id} onClick={() => { onNavigate(id); onClose() }}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, border:'none', cursor:'pointer', textAlign:'left', background:'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--fill)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <div style={{ width:30, height:30, borderRadius:8, background:'var(--fill)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid var(--sep)' }}>
                        <Icon size={13} style={{ color:'var(--label-3)' }}/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, color:'var(--label)' }}>{label}</div>
                        <div style={{ fontSize:11, color:'var(--label-4)' }}>{desc}</div>
                      </div>
                      <ChevronRight size={12} style={{ color:'var(--label-4)' }}/>
                    </button>
                  )
                })}
              </Grupo>
              <Grupo titulo="Dica">
                <div style={{ padding:'8px 12px', fontSize:12, color:'var(--label-4)', lineHeight:1.6 }}>
                  Digite um <strong style={{ color:'var(--label-3)' }}>número</strong> para buscar pedido · um <strong style={{ color:'var(--label-3)' }}>nome</strong> para cliente · ou <strong style={{ color:'var(--label-3)' }}>nome do produto</strong> para ver estoque.
                </div>
              </Grupo>
            </>
          )}

          {/* Com query mas sem resultados */}
          {!semQuery && !temResultados && !loading && (
            <div style={{ padding:'32px 16px', textAlign:'center', color:'var(--label-4)', fontSize:13 }}>
              <Search size={24} style={{ display:'block', margin:'0 auto 10px', opacity:.3 }}/>
              Nenhum resultado para "<strong style={{ color:'var(--label-3)' }}>{query}</strong>"
            </div>
          )}

          {/* Resultados */}
          {!semQuery && temResultados && (
            <>
              {results.pages.length > 0 && (
                <Grupo titulo="Páginas">
                  {results.pages.map((item, i) => <ItemPage key={item.id} item={item} flatIdx={pageOffset + i}/>)}
                </Grupo>
              )}
              {results.pedidos.length > 0 && (
                <Grupo titulo="Pedidos">
                  {results.pedidos.map((item, i) => <ItemPedido key={item.numero} item={item} flatIdx={pedidoOffset + i}/>)}
                </Grupo>
              )}
              {results.clientes.length > 0 && (
                <Grupo titulo="Clientes">
                  {results.clientes.map((item, i) => <ItemCliente key={item.telefone || i} item={item} flatIdx={clienteOffset + i}/>)}
                </Grupo>
              )}
              {results.produtos.length > 0 && (
                <Grupo titulo="Produtos">
                  {results.produtos.map((item, i) => <ItemProduto key={item.bling_id || i} item={item} flatIdx={produtoOffset + i}/>)}
                </Grupo>
              )}
              {results.acoes.length > 0 && (
                <Grupo titulo="Ações">
                  {results.acoes.map((item, i) => <ItemAcao key={item.id} item={item} flatIdx={acaoOffset + i}/>)}
                </Grupo>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'8px 16px', borderTop:'1px solid var(--sep)', background:'var(--fill)' }}>
          {[
            [<><ArrowUp size={10}/><ArrowDown size={10}/></>, 'navegar'],
            [<CornerDownLeft size={10}/>, 'abrir'],
            ['Esc', 'fechar'],
          ].map(([key, label], i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--label-4)' }}>
              <kbd style={{ display:'inline-flex', alignItems:'center', gap:2, padding:'2px 6px', borderRadius:5, background:'var(--bg-2)', border:'1px solid var(--sep)', color:'var(--label-3)', fontSize:10, fontFamily:'inherit' }}>{key}</kbd>
              <span>{label}</span>
            </div>
          ))}
          <div style={{ marginLeft:'auto', fontSize:11, color:'var(--label-4)', display:'flex', alignItems:'center', gap:5 }}>
            <kbd style={{ padding:'2px 6px', borderRadius:5, background:'var(--bg-2)', border:'1px solid var(--sep)', color:'var(--label-3)', fontSize:10, fontFamily:'inherit' }}>⌘K</kbd>
            <span>para abrir</span>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  )
}
