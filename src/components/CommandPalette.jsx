import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, LayoutDashboard, ShoppingCart, Users, CreditCard,
  MessageSquare, Bot, Settings, Zap, Send, Package, AlertCircle,
  Activity, CornerDownLeft, ArrowUp, ArrowDown, Hash, Clock,
  ChevronRight, RefreshCw, X, Layers, Package2, Truck,
  BarChart2, Radio, Star,
} from 'lucide-react'

// ── T system ──────────────────────────────────────────────────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#7b81a0', ink4:'#3a3f5c',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)', greenBor:'rgba(0,230,118,.25)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.08)', amberBor:'rgba(255,179,0,.25)',
  red:'#ff4757',  redDim:'rgba(255,71,87,.07)',   redBor:'rgba(255,71,87,.25)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.09)',purpleBor:'rgba(167,139,250,.25)',
  cyan:'#06b6d4', cyanDim:'rgba(6,182,212,.08)',   cyanBor:'rgba(6,182,212,.22)',
  blue:'#4f8ef7', blueDim:'rgba(79,142,247,.08)',  blueBor:'rgba(79,142,247,.25)',
  sep:'rgba(255,255,255,.05)', sep2:'rgba(255,255,255,.08)',
  gray:'rgba(255,255,255,.04)',
}

// ── Mapeamento de situações ────────────────────────────────────────────────────
const SIT = {
  6:  { label:'Em Aberto',  cor:T.amber },
  9:  { label:'Atendido',   cor:T.blue  },
  12: { label:'Cancelado',  cor:T.red   },
  15: { label:'Verificado', cor:T.green },
}
function getSitId(p) {
  return typeof p.situacao==='object' ? p.situacao?.id||p.situacao?.valor : (p.situacaoId||p.situacao)
}
const R = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`

// ── Ícones e cores por página ──────────────────────────────────────────────────
const PAGE_META = {
  dashboard:    { icon:LayoutDashboard, cor:T.purple, desc:'Visão geral e métricas' },
  pedidos:      { icon:ShoppingCart,    cor:T.green,  desc:'Pedidos, kanban e rastreio' },
  clientes:     { icon:Users,           cor:T.blue,   desc:'CRM e histórico de clientes' },
  caixa:        { icon:CreditCard,      cor:T.amber,  desc:'Financeiro e fluxo de caixa' },
  atendimento:  { icon:MessageSquare,   cor:T.cyan,   desc:'Fila de atendimento humano' },
  conversas:    { icon:MessageSquare,   cor:T.cyan,   desc:'Todas as conversas WhatsApp' },
  gatilhos:     { icon:Zap,            cor:T.amber,  desc:'Automações e disparos' },
  disparos:     { icon:Activity,        cor:T.green,  desc:'Histórico de disparos' },
  ocorrencias:  { icon:AlertCircle,     cor:T.red,    desc:'Ocorrências e tickets' },
  iaconfig:     { icon:Bot,            cor:T.purple, desc:'Personalidade e integrações da IA' },
  llmconfig:    { icon:Layers,          cor:T.blue,   desc:'Modelo, métricas e bypasses' },
  campanhas:    { icon:Send,            cor:T.cyan,   desc:'Campanhas em massa' },
  'rastreio-config': { icon:Truck,     cor:T.green,  desc:'Configurar canais de rastreio' },
}

// ── Fuzzy match ───────────────────────────────────────────────────────────────
function fuzzy(str, query) {
  if (!query) return 1
  const s = str.toLowerCase(), q = query.toLowerCase()
  if (s.includes(q)) return 2 + (s.startsWith(q) ? 1 : 0)
  let score = 0, qi = 0
  for (let i = 0; i < s.length && qi < q.length; i++) {
    if (s[i] === q[qi]) { score++; qi++ }
  }
  return qi === q.length ? score / q.length : 0
}

function Highlight({ text='', query='' }) {
  if (!query || !text) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return <>
    {text.slice(0, idx)}
    <mark style={{ background:T.amberDim, color:T.amber, borderRadius:2, padding:'0 1px' }}>
      {text.slice(idx, idx + query.length)}
    </mark>
    {text.slice(idx + query.length)}
  </>
}

// ── Ações rápidas ─────────────────────────────────────────────────────────────
const ACOES = [
  { id:'acao-wa',    label:'Abrir WhatsApp Business', icon:MessageSquare, cor:T.green,  action:'link', href:'https://web.whatsapp.com' },
  { id:'acao-bling', label:'Abrir painel Bling',      icon:Package,       cor:T.amber,  action:'link', href:'https://www.bling.com.br' },
  { id:'acao-ia',    label:'Configurar a IA',          icon:Bot,           cor:T.purple, action:'nav',  page:'iaconfig' },
  { id:'acao-saude', label:'Ver saúde da IA',          icon:Activity,      cor:T.cyan,   action:'nav',  page:'llmconfig' },
  { id:'acao-atend', label:'Ir para atendimento',      icon:Users,         cor:T.blue,   action:'nav',  page:'atendimento' },
  { id:'acao-monit', label:'Monitoramento de disparos',icon:BarChart2,     cor:T.green,  action:'nav',  page:'disparos' },
  { id:'acao-reload',label:'Recarregar página',        icon:RefreshCw,     cor:T.ink3,   action:'fn',   fn:()=>window.location.reload() },
]

const PAGES_NAV = Object.entries(PAGE_META).map(([id, m]) => ({
  id, label: {
    dashboard:'Dashboard', pedidos:'Pedidos', clientes:'Clientes',
    caixa:'Fluxo de Caixa', atendimento:'Atendimento', conversas:'Conversas',
    gatilhos:'Gatilhos', disparos:'Monitor Disparos', ocorrencias:'Ocorrências',
    iaconfig:'Config IA', llmconfig:'LLM & Bypasses', campanhas:'Campanhas',
    'rastreio-config':'Rastreio (canais)',
  }[id] || id,
  desc: m.desc, cor: m.cor, grupo:'Páginas',
}))

// ── Componente principal ───────────────────────────────────────────────────────
export default function CommandPalette({ api, onNavigate, onClose }) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState({ pages:[], pedidos:[], clientes:[], produtos:[], acoes:[] })
  const [loading,  setLoading]  = useState(false)
  const [selIdx,   setSelIdx]   = useState(0)
  const [recentes, setRecentes] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('cmd_recentes') || '[]') } catch { return [] }
  })
  const inputRef = useRef()
  const listRef  = useRef()
  const searchTO = useRef()

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50) }, [])

  // ── Busca debounced ────────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(searchTO.current)
    if (!query.trim()) { setResults({ pages:[],pedidos:[],clientes:[],produtos:[],acoes:[] }); setSelIdx(0); return }
    searchTO.current = setTimeout(() => buscar(query.trim()), 160)
    return () => clearTimeout(searchTO.current)
  }, [query])

  const buscar = useCallback(async (q) => {
    const pages = PAGES_NAV
      .map(p => ({ ...p, score:Math.max(fuzzy(p.label,q), fuzzy(p.desc||'',q)) }))
      .filter(p => p.score > 0.3).sort((a,b) => b.score-a.score).slice(0,4)
    const acoes = ACOES.filter(a => fuzzy(a.label,q) > 0.3).slice(0,3)

    let pedidos = [], clientes = [], produtos = []

    if (/^\d+$/.test(q) && q.length >= 3) {
      setLoading(true)
      try {
        const r = await fetch(`${api}/api/dashboard/pedidos?limite=50`)
        if (r.ok) {
          const d = await r.json()
          pedidos = (d.pedidos||[]).filter(p => String(p.numero).includes(q)).slice(0,5)
        }
      } catch {} finally { setLoading(false) }
    }

    if (q.length >= 2 && !/^\d+$/.test(q)) {
      setLoading(true)
      try {
        const [rc, rp] = await Promise.all([
          fetch(`${api}/api/dashboard/contatos`).then(r=>r.ok?r.json():{contatos:[]}).catch(()=>({contatos:[]})),
          fetch(`${api}/api/dashboard/pedidos?limite=100`).then(r=>r.ok?r.json():{pedidos:[]}).catch(()=>({pedidos:[]})),
        ])
        const ql = q.toLowerCase()
        clientes = (rc.contatos||[]).filter(c=>(c.nome||'').toLowerCase().includes(ql)||(c.telefone||'').includes(ql)).slice(0,4)
        if (!pedidos.length) pedidos = (rp.pedidos||[]).filter(p=>(p.contato||'').toLowerCase().includes(ql)).sort((a,b)=>b.numero-a.numero).slice(0,5)
      } catch {} finally { setLoading(false) }
    }

    if (q.length >= 2) {
      try {
        const r = await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(q)}&limit=4`)
        if (r.ok) { const d = await r.json(); produtos = d.produtos||[] }
      } catch {}
    }

    setResults({ pages, pedidos, clientes, produtos, acoes })
    setSelIdx(0)
  }, [api])

  // Flatten
  const allItems = [
    ...results.pages.map(p=>({type:'page',...p})),
    ...results.pedidos.map(p=>({type:'pedido',...p})),
    ...results.clientes.map(c=>({type:'cliente',...c})),
    ...results.produtos.map(p=>({type:'produto',...p})),
    ...results.acoes.map(a=>({type:'acao',...a})),
  ]

  // Teclado
  useEffect(() => {
    const fn = e => {
      if (e.key==='Escape') { onClose(); return }
      if (e.key==='ArrowDown') { e.preventDefault(); setSelIdx(i=>Math.min(i+1,allItems.length-1)) }
      if (e.key==='ArrowUp')   { e.preventDefault(); setSelIdx(i=>Math.max(i-1,0)) }
      if (e.key==='Enter')     { e.preventDefault(); const item=allItems[selIdx]; if(item) executar(item) }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [allItems, selIdx])

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${selIdx}"]`)?.scrollIntoView({ block:'nearest' })
  }, [selIdx])

  const salvarRecente = (item) => {
    const novo = { id:item.id||item.numero||item.telefone, label:item.label||item.contato||item.nome, type:item.type, page:item.id||'pedidos', ts:Date.now() }
    const prev = JSON.parse(sessionStorage.getItem('cmd_recentes')||'[]')
    const next = [novo, ...prev.filter(r=>r.id!==novo.id)].slice(0,5)
    sessionStorage.setItem('cmd_recentes', JSON.stringify(next))
    setRecentes(next)
  }

  const executar = (item) => {
    salvarRecente(item)
    if (item.type==='page')    { onNavigate(item.id); onClose() }
    else if (item.type==='pedido')  { onNavigate('pedidos',{abrirPedido:item.numero}); onClose() }
    else if (item.type==='cliente') { onNavigate('conversas',{telefone:item.telefone}); onClose() }
    else if (item.type==='produto') { onNavigate('pedidos'); onClose() }
    else if (item.type==='acao') {
      if (item.action==='nav')  { onNavigate(item.page); onClose() }
      else if (item.action==='link') { window.open(item.href,'_blank'); onClose() }
      else if (item.action==='fn')   { item.fn?.(); onClose() }
    }
  }

  // ── Renders ───────────────────────────────────────────────────────────────
  const Grupo = ({ titulo, children }) => (
    <div style={{ marginBottom:6 }}>
      <div style={{ fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',
        color:T.ink4,padding:'8px 14px 4px' }}>{titulo}</div>
      {children}
    </div>
  )

  const ItemBase = ({ flatIdx, children }) => {
    const sel = flatIdx === selIdx
    return (
      <div data-idx={flatIdx}
        onClick={()=>executar(allItems[flatIdx])}
        onMouseEnter={()=>setSelIdx(flatIdx)}
        style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 12px',
          borderRadius:10,cursor:'pointer',transition:'background .08s',
          background:sel?T.purpleDim:'transparent',
          border:`1px solid ${sel?T.purpleBor:'transparent'}`,
          margin:'1px 4px' }}>
        {children}
      </div>
    )
  }

  const IcoBox = ({ cor, children }) => (
    <div style={{ width:32,height:32,borderRadius:9,flexShrink:0,
      background:`${cor}18`,border:`1px solid ${cor}30`,
      display:'flex',alignItems:'center',justifyContent:'center',
      boxShadow:`0 2px 8px ${cor}15` }}>
      {children}
    </div>
  )

  let offset = 0
  const pageOff    = 0;             offset += results.pages.length
  const pedidoOff  = offset;        offset += results.pedidos.length
  const clienteOff = offset;        offset += results.clientes.length
  const produtoOff = offset;        offset += results.produtos.length
  const acaoOff    = offset

  const semQuery = !query.trim()
  const temRes   = allItems.length > 0

  return (
    <>
      <style>{`
        @keyframes cmd-in { from{opacity:0;transform:translateX(-50%) scale(.96)} to{opacity:1;transform:translateX(-50%) scale(1)} }
        @keyframes cmd-bg { from{opacity:0} to{opacity:1} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9990,
        background:'rgba(0,0,0,.7)',backdropFilter:'blur(6px)',
        animation:'cmd-bg .2s ease' }}/>

      {/* Modal */}
      <div style={{
        position:'fixed',top:'16%',left:'50%',transform:'translateX(-50%)',
        width:'min(620px, 92vw)',zIndex:9991,
        background:`linear-gradient(160deg,${T.bg2} 0%,${T.bg3} 100%)`,
        border:`1px solid ${T.sep2}`,borderRadius:20,overflow:'hidden',
        boxShadow:`0 32px 80px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.07) inset`,
        animation:'cmd-in .22s cubic-bezier(.2,.8,.2,1)',
      }}>

        {/* Campo de busca */}
        <div style={{ display:'flex',alignItems:'center',gap:10,
          padding:'14px 16px',borderBottom:`1px solid ${T.sep}`,
          background:`linear-gradient(90deg,${T.bg3},${T.bg2})` }}>
          {loading
            ? <RefreshCw size={16} style={{ color:T.green,flexShrink:0,animation:'spin .7s linear infinite' }}/>
            : <Search size={16} style={{ color:T.ink4,flexShrink:0 }}/>}
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Buscar pedido, cliente, produto, página..."
            style={{ flex:1,border:'none',background:'transparent',outline:'none',
              fontSize:15,color:T.ink1,fontFamily:'inherit' }}/>
          {query && (
            <button onClick={()=>setQuery('')}
              style={{ padding:4,borderRadius:6,border:'none',background:T.gray,
                color:T.ink4,cursor:'pointer',display:'flex',flexShrink:0 }}>
              <X size={12}/>
            </button>
          )}
          <kbd style={{ fontSize:10.5,padding:'2px 8px',borderRadius:7,
            background:T.bg4,border:`1px solid ${T.sep2}`,
            color:T.ink4,flexShrink:0,fontFamily:'inherit' }}>Esc</kbd>
        </div>

        {/* Resultados */}
        <div ref={listRef} style={{ maxHeight:440,overflowY:'auto',padding:'8px 0' }}>

          {/* Estado vazio */}
          {semQuery && (
            <>
              {recentes.length > 0 && (
                <Grupo titulo="Recentes">
                  {recentes.map((r,i) => {
                    const pm = PAGE_META[r.page] || {}
                    const Icon = pm.icon || Clock
                    const cor  = pm.cor  || T.ink3
                    return (
                      <div key={i} onClick={()=>{ onNavigate(r.page); onClose() }}
                        style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 12px',
                          margin:'1px 4px',borderRadius:10,cursor:'pointer',transition:'background .08s' }}
                        onMouseEnter={e=>e.currentTarget.style.background=T.gray}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <IcoBox cor={cor}><Icon size={13} style={{ color:cor }}/></IcoBox>
                        <div style={{ flex:1,fontSize:13,color:T.ink2 }}>{r.label}</div>
                        <Clock size={10} style={{ color:T.ink4 }}/>
                      </div>
                    )
                  })}
                </Grupo>
              )}
              <Grupo titulo="Navegar para">
                {['dashboard','pedidos','conversas','clientes','gatilhos','disparos'].map(id => {
                  const pm = PAGE_META[id]||{}
                  const Icon = pm.icon||LayoutDashboard
                  const cor  = pm.cor||T.ink3
                  const label = PAGES_NAV.find(p=>p.id===id)?.label||id
                  return (
                    <div key={id} onClick={()=>{ onNavigate(id); onClose() }}
                      style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 12px',
                        margin:'1px 4px',borderRadius:10,cursor:'pointer',transition:'background .08s' }}
                      onMouseEnter={e=>e.currentTarget.style.background=T.gray}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <IcoBox cor={cor}><Icon size={13} style={{ color:cor }}/></IcoBox>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:13,color:T.ink1,fontWeight:500 }}>{label}</div>
                        <div style={{ fontSize:10.5,color:T.ink4 }}>{pm.desc||''}</div>
                      </div>
                      <ChevronRight size={12} style={{ color:T.ink4 }}/>
                    </div>
                  )
                })}
              </Grupo>
              <Grupo titulo="Dica">
                <div style={{ padding:'6px 14px',fontSize:11.5,color:T.ink4,lineHeight:1.7 }}>
                  Digite um <strong style={{ color:T.amber }}>número</strong> para buscar pedido ·
                  um <strong style={{ color:T.cyan }}>nome</strong> para cliente ·
                  ou <strong style={{ color:T.green }}>nome de produto</strong> para ver estoque.
                </div>
              </Grupo>
            </>
          )}

          {/* Sem resultados */}
          {!semQuery && !temRes && !loading && (
            <div style={{ padding:'36px 16px',textAlign:'center' }}>
              <Search size={24} style={{ display:'block',margin:'0 auto 10px',color:T.ink4,opacity:.3 }}/>
              <p style={{ fontSize:13,color:T.ink4 }}>
                Nenhum resultado para <strong style={{ color:T.ink3 }}>"{query}"</strong>
              </p>
            </div>
          )}

          {/* Com resultados */}
          {!semQuery && temRes && (
            <>
              {results.pages.length > 0 && (
                <Grupo titulo="Páginas">
                  {results.pages.map((item,i) => {
                    const pm = PAGE_META[item.id]||{}
                    const Icon = pm.icon||LayoutDashboard
                    const cor  = item.cor||pm.cor||T.purple
                    return (
                      <ItemBase key={item.id} flatIdx={pageOff+i}>
                        <IcoBox cor={cor}><Icon size={14} style={{ color:cor }}/></IcoBox>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:13,fontWeight:600,color:T.ink1 }}>
                            <Highlight text={item.label} query={query}/>
                          </div>
                          {item.desc&&<div style={{ fontSize:10.5,color:T.ink4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{item.desc}</div>}
                        </div>
                        <ChevronRight size={11} style={{ color:T.ink4,flexShrink:0 }}/>
                      </ItemBase>
                    )
                  })}
                </Grupo>
              )}

              {results.pedidos.length > 0 && (
                <Grupo titulo="Pedidos">
                  {results.pedidos.map((item,i) => {
                    const sitId = getSitId(item)
                    const sit   = SIT[sitId]||SIT[9]
                    return (
                      <ItemBase key={item.numero} flatIdx={pedidoOff+i}>
                        <IcoBox cor={sit.cor}><Hash size={13} style={{ color:sit.cor }}/></IcoBox>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:2 }}>
                            <span style={{ fontSize:13,fontWeight:700,color:T.green }}>#{item.numero}</span>
                            <span style={{ fontSize:9,fontWeight:700,padding:'1px 7px',borderRadius:99,
                              background:`${sit.cor}18`,color:sit.cor,border:`0.5px solid ${sit.cor}35` }}>
                              {sit.label}
                            </span>
                          </div>
                          <div style={{ fontSize:10.5,color:T.ink4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                            <Highlight text={item.contato||'—'} query={query}/> · {item.data?new Date(item.data+'T12:00:00').toLocaleDateString('pt-BR'):'—'}
                          </div>
                        </div>
                        <div style={{ fontSize:12,fontWeight:700,color:T.ink1,flexShrink:0 }}>{R(item.total)}</div>
                      </ItemBase>
                    )
                  })}
                </Grupo>
              )}

              {results.clientes.length > 0 && (
                <Grupo titulo="Clientes">
                  {results.clientes.map((item,i) => {
                    const init = (item.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
                    const pal  = [T.purple,T.green,T.amber,T.cyan,T.blue,T.red]
                    const cor  = pal[(item.nome||'?').charCodeAt(0)%pal.length]
                    return (
                      <ItemBase key={item.telefone||i} flatIdx={clienteOff+i}>
                        <div style={{ width:32,height:32,borderRadius:'50%',flexShrink:0,
                          background:`${cor}20`,border:`1.5px solid ${cor}50`,
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:11,fontWeight:800,color:cor }}>
                          {init}
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:13,fontWeight:600,color:T.ink1 }}>
                            <Highlight text={item.nome||'—'} query={query}/>
                          </div>
                          <div style={{ fontSize:10.5,color:T.ink4,fontFamily:'monospace' }}>
                            <Highlight text={item.telefone||'—'} query={query}/>
                          </div>
                        </div>
                        <ChevronRight size={11} style={{ color:T.ink4,flexShrink:0 }}/>
                      </ItemBase>
                    )
                  })}
                </Grupo>
              )}

              {results.produtos.length > 0 && (
                <Grupo titulo="Produtos">
                  {results.produtos.map((item,i) => {
                    const disp = item.disponivel||item.estoque>0
                    return (
                      <ItemBase key={item.bling_id||i} flatIdx={produtoOff+i}>
                        <IcoBox cor={T.amber}><Package2 size={13} style={{ color:T.amber }}/></IcoBox>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:13,fontWeight:600,color:T.ink1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                            <Highlight text={item.nome||'—'} query={query}/>
                          </div>
                          <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                            <span style={{ fontSize:10,color:T.ink4,fontFamily:'monospace' }}>{item.codigo}</span>
                            <span style={{ fontSize:9.5,fontWeight:700,padding:'1px 6px',borderRadius:99,
                              background:disp?T.greenDim:T.redDim,
                              color:disp?T.green:T.red,
                              border:`0.5px solid ${disp?T.greenBor:T.redBor}` }}>
                              {disp?`${item.estoque} un.`:'Sem estoque'}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize:12,fontWeight:700,color:T.ink1,flexShrink:0 }}>{R(item.preco)}</div>
                      </ItemBase>
                    )
                  })}
                </Grupo>
              )}

              {results.acoes.length > 0 && (
                <Grupo titulo="Ações">
                  {results.acoes.map((item,i) => {
                    const Icon = item.icon||Zap
                    const cor  = item.cor||T.purple
                    return (
                      <ItemBase key={item.id} flatIdx={acaoOff+i}>
                        <IcoBox cor={cor}><Icon size={13} style={{ color:cor }}/></IcoBox>
                        <div style={{ fontSize:13,fontWeight:500,color:T.ink1,flex:1 }}>{item.label}</div>
                        <ChevronRight size={11} style={{ color:T.ink4,flexShrink:0 }}/>
                      </ItemBase>
                    )
                  })}
                </Grupo>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:'flex',alignItems:'center',gap:14,padding:'9px 16px',
          borderTop:`1px solid ${T.sep}`,
          background:`linear-gradient(90deg,${T.bg3},${T.bg2})` }}>
          {[
            [<><ArrowUp size={10}/><ArrowDown size={10}/></>, 'navegar'],
            [<CornerDownLeft size={10}/>, 'abrir'],
            ['Esc', 'fechar'],
          ].map(([key,lbl],i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:5,fontSize:11,color:T.ink4 }}>
              <kbd style={{ display:'inline-flex',alignItems:'center',gap:2,padding:'2px 7px',
                borderRadius:6,background:T.bg4,border:`1px solid ${T.sep2}`,
                color:T.ink3,fontSize:10,fontFamily:'inherit' }}>{key}</kbd>
              <span>{lbl}</span>
            </div>
          ))}
          <div style={{ marginLeft:'auto',fontSize:10.5,color:T.ink4,display:'flex',alignItems:'center',gap:5 }}>
            <kbd style={{ padding:'2px 7px',borderRadius:6,background:T.bg4,
              border:`1px solid ${T.sep2}`,color:T.ink3,fontSize:10,fontFamily:'inherit' }}>⌘K</kbd>
            para abrir
          </div>
        </div>
      </div>
    </>
  )
}
