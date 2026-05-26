import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, RefreshCw, X, Phone, Mail, Hash, Star, ShoppingCart,
  TrendingUp, TrendingDown, Users, Crown, AlertTriangle, Clock,
  ChevronRight, ArrowUpDown, ChevronDown, ChevronUp, MessageSquare,
  DollarSign, Activity, Package, Zap, Filter, ExternalLink,
  BarChart3, Award, Target, UserX, Sparkles, Copy, Check
} from 'lucide-react'

// ── RFM Segmentos — definições visuais e ações ────────────────────────────────
const SEGMENTOS = {
  vip:       { label:'VIP',          cor:'#f59e0b', bg:'rgba(245,158,11,.12)',  bdr:'rgba(245,158,11,.3)',  icon:Crown,        desc:'Compra frequente, alto valor, recente',          acao:'Ofereça exclusividade e cashback' },
  fiel:      { label:'Fiel',         cor:'#22c55e', bg:'rgba(34,197,94,.12)',   bdr:'rgba(34,197,94,.3)',   icon:Star,         desc:'Compra regularmente, bom valor',                 acao:'Programas de fidelidade, upsell' },
  potencial: { label:'Potencial',    cor:'#7c6af7', bg:'rgba(124,106,247,.12)', bdr:'rgba(124,106,247,.3)', icon:TrendingUp,   desc:'Alto valor, mas compra pouco',                   acao:'Oferta especial para aumentar frequência' },
  novo:      { label:'Novo',         cor:'#4a9fff', bg:'rgba(74,159,255,.12)',  bdr:'rgba(74,159,255,.3)',  icon:Sparkles,     desc:'Compra recente, primeira ou segunda vez',        acao:'Onboarding, recomendações personalizadas' },
  regular:   { label:'Regular',      cor:'#00d4aa', bg:'rgba(0,212,170,.12)',   bdr:'rgba(0,212,170,.3)',   icon:Activity,     desc:'Padrão de compra médio',                         acao:'Newsletter, promoções sazonais' },
  em_risco:  { label:'Em risco',     cor:'#f97316', bg:'rgba(249,115,22,.12)',  bdr:'rgba(249,115,22,.3)',  icon:AlertTriangle,desc:'Comprava bem, mas está sumindo',                 acao:'Campanha de reativação urgente' },
  perdido:   { label:'Perdido',      cor:'#ef4444', bg:'rgba(239,68,68,.12)',   bdr:'rgba(239,68,68,.3)',   icon:UserX,        desc:'Não compra há muito tempo',                      acao:'Desconto agressivo ou win-back' },
}

const SIT_MAP = {
  6: { label:'Em Aberto',  cor:'#f59e0b' },
  9: { label:'Atendido',   cor:'#4a9fff' },
  12:{ label:'Cancelado',  cor:'#ef4444' },
  15:{ label:'Verificado', cor:'#22c55e' },
}

const CANAIS = {
  nuvemshop:'#0070f3', mercadolivre:'#f5a623', shopee:'#EE4D2D',
  tiktokshop:'#010101', shein:'#c0392b', bling:'#1D9E75', whatsapp:'#25D366',
}

const R   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmt = n => Number(n||0).toLocaleString('pt-BR')
const fmtDate = d => d ? new Date(d+'T12:00:00').toLocaleDateString('pt-BR') : '—'
const fmtDT   = d => d ? new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'

function Avatar({ nome, size=36, cor }) {
  const init = (nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const pal = ['#7c6af7','#00d4aa','#f59e0b','#22c55e','#4a9fff','#e879f9','#fb923c']
  const c = cor || pal[(nome||'?').charCodeAt(0) % pal.length]
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:`${c}20`, border:`1.5px solid ${c}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*.35, fontWeight:800, color:c, flexShrink:0 }}>
      {init}
    </div>
  )
}

// ── Score bar R/F/M ────────────────────────────────────────────────────────────
function RFMBar({ label, value, max=5, cor }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ fontSize:10, fontWeight:700, color:'var(--label-4)', width:14 }}>{label}</span>
      <div style={{ flex:1, height:5, borderRadius:99, background:'var(--fill)', overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:99, background:cor, width:`${(value/max)*100}%`, transition:'width .8s cubic-bezier(.4,0,.2,1)' }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:700, color:cor, width:14, textAlign:'right' }}>{value}</span>
    </div>
  )
}

// ── Drawer do cliente ─────────────────────────────────────────────────────────
function ClienteSheet({ cliente, onClose, api }) {
  const [pedidos,  setPedidos]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('perfil')
  const [copied,   setCopied]   = useState('')

  const seg = SEGMENTOS[cliente.segmento] || SEGMENTOS.regular
  const SegIcon = seg.icon
  const pal = ['#7c6af7','#00d4aa','#f59e0b','#22c55e','#4a9fff','#e879f9']
  const corAvatar = pal[(cliente.nome||'?').charCodeAt(0) % pal.length]

  const cp = (text, key) => { navigator.clipboard.writeText(String(text)); setCopied(key); setTimeout(()=>setCopied(''),2000) }

  useEffect(() => {
    setLoading(true); setPedidos([])
    // Tenta buscar pedidos pelo nome via /clientes-rfm (já temos tudo)
    // Usa o ultimoPedido e pedidosTotal do objeto
    // Para detalhes reais, busca via Bling
    if (cliente.contatoId) {
      fetch(`${api}/api/dashboard/contatos/${cliente.contatoId}/pedidos`)
        .then(r => r.ok ? r.json() : { pedidos:[] })
        .then(d => { setPedidos(d.pedidos || []); setLoading(false) })
        .catch(() => setLoading(false))
    } else { setLoading(false) }
  }, [cliente.contatoId])

  const TABS = [
    { id:'perfil',   label:'Perfil CRM' },
    { id:'pedidos',  label:`Pedidos (${cliente.pedidosTotal})` },
    { id:'rfm',      label:'Score RFM' },
  ]

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:40, backdropFilter:'blur(3px)' }}/>
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:500, zIndex:50, background:'var(--bg-2)', borderLeft:'1px solid var(--sep)', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'-24px 0 80px rgba(0,0,0,.35)' }}>

        {/* Header */}
        <div style={{ padding:'20px 22px 14px', borderBottom:'1px solid var(--sep)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:13 }}>
              <div style={{ position:'relative' }}>
                <Avatar nome={cliente.nome} size={52} cor={corAvatar}/>
                <div style={{ position:'absolute', bottom:-2, right:-2, width:20, height:20, borderRadius:'50%', background:seg.bg, border:`2px solid var(--bg-2)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <SegIcon size={10} style={{ color:seg.cor }}/>
                </div>
              </div>
              <div>
                <h3 style={{ fontSize:17, fontWeight:800, color:'var(--label)', margin:0, letterSpacing:'-.3px' }}>{cliente.nome}</h3>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:5 }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:99, background:seg.bg, color:seg.cor, border:`1px solid ${seg.bdr}` }}>
                    {seg.label}
                  </span>
                  <span style={{ fontSize:11, color:'var(--label-4)' }}>RFM {cliente.rfm.total}/15</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ padding:7, borderRadius:9, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', display:'flex' }}>
              <X size={14}/>
            </button>
          </div>

          {/* KPIs rápidos */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {[
              { l:'Total gasto',  v:R(cliente.totalGasto),          c:'var(--accent)' },
              { l:'Pedidos',      v:String(cliente.pedidosTotal),   c:'var(--label)'  },
              { l:'Ticket médio', v:R(cliente.ticketMedio),         c:'var(--label)'  },
            ].map(k => (
              <div key={k.l} style={{ padding:'8px 10px', borderRadius:9, background:'var(--bg)', border:'1px solid var(--sep)', textAlign:'center' }}>
                <div style={{ fontSize:14, fontWeight:800, color:k.c, lineHeight:1 }}>{k.v}</div>
                <div style={{ fontSize:9, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.05em', marginTop:3 }}>{k.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--sep)', padding:'0 22px', flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'9px 14px', fontSize:12.5, fontWeight:500, border:'none', background:'transparent', cursor:'pointer', color:tab===t.id?'var(--accent)':'var(--label-3)', borderBottom:`2px solid ${tab===t.id?'var(--accent)':'transparent'}`, marginBottom:-1, whiteSpace:'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>

          {/* PERFIL */}
          {tab==='perfil' && <>
            {/* Segmento + ação recomendada */}
            <div style={{ padding:'12px 14px', borderRadius:12, background:seg.bg, border:`1px solid ${seg.bdr}`, marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <SegIcon size={14} style={{ color:seg.cor, flexShrink:0 }}/>
                <span style={{ fontSize:13, fontWeight:700, color:seg.cor }}>Segmento {seg.label}</span>
              </div>
              <p style={{ fontSize:12, color:'var(--label-3)', margin:'0 0 6px', lineHeight:1.5 }}>{seg.desc}</p>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <Target size={11} style={{ color:seg.cor }}/>
                <span style={{ fontSize:11, fontWeight:600, color:seg.cor }}>Ação recomendada: {seg.acao}</span>
              </div>
            </div>

            {/* Timeline de compras */}
            <div style={{ background:'var(--bg)', borderRadius:12, border:'1px solid var(--sep)', padding:'12px 14px', marginBottom:12 }}>
              <p style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:10 }}>Linha do tempo</p>
              {[
                ['Primeira compra', fmtDate(cliente.primeiraCompra), '#a78bfa'],
                ['Última compra',   fmtDate(cliente.ultimaCompra),   cliente.diasSemComprar>60?'#ef4444':cliente.diasSemComprar>30?'#f59e0b':'#22c55e'],
                ['Dias sem comprar', `${cliente.diasSemComprar} dias`, cliente.diasSemComprar>60?'#ef4444':cliente.diasSemComprar>30?'#f59e0b':'#22c55e'],
              ].map(([lb,vl,cor]) => (
                <div key={lb} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--sep)' }}>
                  <span style={{ fontSize:12, color:'var(--label-3)' }}>{lb}</span>
                  <span style={{ fontSize:12.5, fontWeight:700, color:cor }}>{vl}</span>
                </div>
              ))}
            </div>

            {/* Canais */}
            {cliente.canais?.length > 0 && (
              <div style={{ background:'var(--bg)', borderRadius:12, border:'1px solid var(--sep)', padding:'12px 14px', marginBottom:12 }}>
                <p style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:10 }}>Canais de compra</p>
                <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                  {cliente.canais.map(c => (
                    <span key={c} style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:99, background:`${CANAIS[c]||'#888'}15`, color:CANAIS[c]||'#888', border:`1px solid ${CANAIS[c]||'#888'}30` }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ações rápidas */}
            <div>
              <p style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:8 }}>Ações</p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <button style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 14px', borderRadius:10, border:'1px solid rgba(37,211,102,.3)', background:'rgba(37,211,102,.06)', color:'#25D366', cursor:'pointer', textAlign:'left', fontSize:12.5, fontWeight:600 }}>
                  <MessageSquare size={14} style={{ flexShrink:0 }}/> Iniciar conversa no WhatsApp
                </button>
                <a href={`https://www.bling.com.br/contatos.php#/contatos/${cliente.contatoId}`} target="_blank" rel="noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 14px', borderRadius:10, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', textDecoration:'none', fontSize:12.5, fontWeight:500 }}>
                  <ExternalLink size={14} style={{ flexShrink:0 }}/> Ver no Bling
                </a>
              </div>
            </div>
          </>}

          {/* PEDIDOS */}
          {tab==='pedidos' && <>
            {loading ? (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'32px', justifyContent:'center', color:'var(--label-4)', fontSize:12 }}>
                <RefreshCw size={16} style={{ animation:'spin 1s linear infinite', color:'var(--accent)' }}/> Carregando pedidos...
              </div>
            ) : pedidos.length === 0 ? (
              <div style={{ padding:'32px', textAlign:'center', color:'var(--label-4)', fontSize:12 }}>
                <Package size={28} style={{ display:'block', margin:'0 auto 10px', opacity:.3 }}/> Sem pedidos detalhados disponíveis
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {pedidos.map((p, i) => {
                  const sitId = typeof p.situacao==='object' ? p.situacao?.id : (parseInt(p.situacaoId)||9)
                  const sit = SIT_MAP[sitId] || SIT_MAP[9]
                  return (
                    <div key={i} style={{ background:'var(--bg)', borderRadius:10, border:'1px solid var(--sep)', padding:'11px 14px', display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:sit.cor, flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:2 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'var(--accent)' }}>#{p.numero}</span>
                          <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:99, background:`${sit.cor}15`, color:sit.cor }}>{sit.label}</span>
                        </div>
                        <div style={{ fontSize:11, color:'var(--label-4)' }}>{p.data || fmtDate(p.data)}</div>
                      </div>
                      <span style={{ fontSize:13, fontWeight:800, color:'var(--label)', flexShrink:0 }}>{R(p.total)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </>}

          {/* RFM */}
          {tab==='rfm' && <>
            {/* Score visual */}
            <div style={{ background:'var(--bg)', borderRadius:12, border:'1px solid var(--sep)', padding:'16px 18px', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'var(--label)', margin:0 }}>Score RFM</p>
                <div style={{ fontSize:24, fontWeight:800, color:'var(--accent)', letterSpacing:'-.5px' }}>{cliente.rfm.total}<span style={{ fontSize:13, color:'var(--label-4)', fontWeight:400 }}>/15</span></div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <RFMBar label="R" value={cliente.rfm.r} cor="#22c55e"/>
                <RFMBar label="F" value={cliente.rfm.f} cor="#4a9fff"/>
                <RFMBar label="V" value={cliente.rfm.v} cor="#f59e0b"/>
              </div>
            </div>

            {/* Explicação */}
            <div style={{ background:'var(--bg)', borderRadius:12, border:'1px solid var(--sep)', padding:'14px 16px', marginBottom:14 }}>
              <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:10 }}>O que significa</p>
              {[
                { lb:'R — Recência', desc:`Comprou há ${cliente.diasSemComprar} dias`, val:cliente.rfm.r, cor:'#22c55e',
                  detalhe: cliente.rfm.r>=4?'Compra muito recente — cliente ativo':'Faz algum tempo que não compra' },
                { lb:'F — Frequência', desc:`${cliente.pedidosTotal} pedido${cliente.pedidosTotal!==1?'s':''}`, val:cliente.rfm.f, cor:'#4a9fff',
                  detalhe: cliente.rfm.f>=4?'Compra com alta frequência':'Frequência abaixo da média' },
                { lb:'V — Valor', desc:R(cliente.totalGasto), val:cliente.rfm.v, cor:'#f59e0b',
                  detalhe: cliente.rfm.v>=4?'Alto valor para o negócio':'Ticket ou volume abaixo da média' },
              ].map(d => (
                <div key={d.lb} style={{ display:'flex', gap:10, padding:'9px 0', borderBottom:'1px solid var(--sep)' }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:`${d.cor}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:15, fontWeight:800, color:d.cor }}>{d.val}</span>
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--label)', marginBottom:2 }}>{d.lb} · {d.desc}</div>
                    <div style={{ fontSize:11, color:'var(--label-4)' }}>{d.detalhe}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recomendação de ação */}
            <div style={{ padding:'12px 14px', borderRadius:12, background:seg.bg, border:`1px solid ${seg.bdr}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                <Target size={13} style={{ color:seg.cor }}/>
                <span style={{ fontSize:12, fontWeight:700, color:seg.cor }}>Próxima ação</span>
              </div>
              <p style={{ fontSize:12, color:'var(--label-2)', margin:0, lineHeight:1.5 }}>{seg.acao}</p>
            </div>
          </>}

        </div>
      </div>
    </>
  )
}

// ── Segmento pill ─────────────────────────────────────────────────────────────
function SegPill({ segmento, size='sm' }) {
  const s = SEGMENTOS[segmento] || SEGMENTOS.regular
  const Icon = s.icon
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:size==='sm'?10:12, fontWeight:700, padding:size==='sm'?'2px 7px':'4px 10px', borderRadius:99, background:s.bg, color:s.cor, border:`1px solid ${s.bdr}`, whiteSpace:'nowrap' }}>
      <Icon size={size==='sm'?9:11} style={{ strokeWidth:2.5 }}/> {s.label}
    </span>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function PageClientes({ api }) {
  const [clientes,   setClientes]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [stats,      setStats]      = useState({})
  const [totalRec,   setTotalRec]   = useState(0)
  const [busca,      setBusca]      = useState('')
  const [filtroSeg,  setFiltroSeg]  = useState('todos')
  const [sortCol,    setSortCol]    = useState('rfm')
  const [sortDir,    setSortDir]    = useState('desc')
  const [pagina,     setPagina]     = useState(1)
  const [sel,        setSel]        = useState(null)
  const [view,       setView]       = useState('tabela') // 'tabela'|'cards'
  const POR_PAG = 20

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/clientes-rfm`)
      if (r.ok) {
        const d = await r.json()
        setClientes(d.clientes || [])
        setStats(d.stats || {})
        setTotalRec(d.receita_total || 0)
      }
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  // Filtros + sort
  const filtrados = clientes.filter(c =>
    (filtroSeg==='todos' || c.segmento===filtroSeg) &&
    (!busca || c.nome.toLowerCase().includes(busca.toLowerCase()))
  ).sort((a,b) => {
    let va, vb
    if (sortCol==='rfm')           { va=a.rfm.total;        vb=b.rfm.total }
    else if (sortCol==='gasto')    { va=a.totalGasto;        vb=b.totalGasto }
    else if (sortCol==='pedidos')  { va=a.pedidosTotal;      vb=b.pedidosTotal }
    else if (sortCol==='ticket')   { va=a.ticketMedio;       vb=b.ticketMedio }
    else if (sortCol==='recencia') { va=a.diasSemComprar;    vb=b.diasSemComprar }
    else if (sortCol==='nome')     { va=a.nome.toLowerCase();vb=b.nome.toLowerCase() }
    else                           { va=a.rfm.total;         vb=b.rfm.total }
    return sortDir==='asc' ? (va>vb?1:-1) : (va<vb?1:-1)
  })

  const total    = filtrados.length
  const inicio   = (pagina-1)*POR_PAG
  const pageData = filtrados.slice(inicio, inicio+POR_PAG)
  const totalPgs = Math.ceil(total/POR_PAG)

  const toggleSort = col => { setSortCol(col); setSortDir(d => sortCol===col?(d==='asc'?'desc':'asc'):'desc') }
  const SortIco = ({col}) => sortCol===col ? (sortDir==='asc'?<ChevronUp size={10}/>:<ChevronDown size={10}/>) : <ArrowUpDown size={9} style={{opacity:.25}}/>

  // RFM mini bar inline
  const RFMMini = ({ rfm }) => (
    <div style={{ display:'flex', gap:3, alignItems:'center' }}>
      {['r','f','v'].map((k,i) => (
        <div key={k} title={`${['Recência','Frequência','Valor'][i]}: ${rfm[k]}/5`}
          style={{ display:'flex', flexDirection:'column', gap:1.5 }}>
          {[...Array(5)].map((_,s) => (
            <div key={s} style={{ width:5, height:5, borderRadius:1, background: s<rfm[k] ? ['#22c55e','#4a9fff','#f59e0b'][i] : 'var(--fill)', transition:'background .3s' }}/>
          ))}
        </div>
      ))}
      <span style={{ fontSize:11, fontWeight:700, color:'var(--label-4)', marginLeft:4 }}>{rfm.total}</span>
    </div>
  )

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'22px 26px', background:'var(--bg)' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--label)', margin:0, letterSpacing:'-.5px' }}>Clientes</h1>
          <p style={{ fontSize:12, color:'var(--label-4)', margin:'3px 0 0' }}>
            {loading ? 'Calculando scores RFM...' : `${fmt(clientes.length)} clientes · ${fmt(total)} filtrados · CRM com score RFM`}
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ display:'flex', borderRadius:9, border:'1px solid var(--sep)', overflow:'hidden' }}>
            {[['tabela','Tabela'],['cards','Cards']].map(([v,lb]) => (
              <button key={v} onClick={()=>setView(v)} style={{ padding:'6px 14px', border:'none', background:view===v?'var(--accent-dim)':'transparent', color:view===v?'var(--accent)':'var(--label-3)', cursor:'pointer', fontSize:12, fontWeight:view===v?700:400 }}>{lb}</button>
            ))}
          </div>
          <button onClick={carregar} style={{ width:36, height:36, borderRadius:9, border:'1px solid var(--sep)', background:'var(--bg-2)', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <RefreshCw size={14} style={{ animation:loading?'spin 1s linear infinite':undefined }}/>
          </button>
        </div>
      </div>

      {/* KPI strip — métricas gerais */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
        {[
          { icon:Users,     label:'Total clientes',  value:fmt(clientes.length),            cor:'#7c6af7' },
          { icon:DollarSign,label:'Receita gerada',  value:`R$ ${Number(totalRec).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}`, cor:'#00d4aa' },
          { icon:Crown,     label:'Clientes VIP',    value:fmt(stats.vip||0),               cor:'#f59e0b' },
          { icon:AlertTriangle,label:'Em risco',     value:fmt((stats.em_risco||0)+(stats.perdido||0)), cor:'#ef4444' },
        ].map(k => (
          <div key={k.label} style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:`${k.cor}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <k.icon size={14} style={{ color:k.cor }}/>
              </div>
            </div>
            <div style={{ fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:5 }}>{k.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.cor, letterSpacing:'-.4px', lineHeight:1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Segmentos — chips de filtro visuais */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <button onClick={()=>{setFiltroSeg('todos');setPagina(1)}} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:99, fontSize:12, fontWeight:filtroSeg==='todos'?700:500, cursor:'pointer', border:`1px solid ${filtroSeg==='todos'?'var(--accent)':'var(--sep)'}`, background:filtroSeg==='todos'?'var(--accent-dim)':'var(--bg-2)', color:filtroSeg==='todos'?'var(--accent)':'var(--label-3)' }}>
          Todos <span style={{ fontSize:10, fontWeight:700, padding:'0 4px', borderRadius:99, background:filtroSeg==='todos'?'var(--accent-dim)':'var(--fill)', color:filtroSeg==='todos'?'var(--accent)':'var(--label-4)' }}>{clientes.length}</span>
        </button>
        {Object.entries(SEGMENTOS).map(([key, s]) => {
          const count = stats[key] || 0
          const ativo = filtroSeg === key
          const Icon = s.icon
          return (
            <button key={key} onClick={()=>{setFiltroSeg(ativo?'todos':key);setPagina(1)}}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:99, fontSize:12, fontWeight:ativo?700:500, cursor:'pointer', border:`1px solid ${ativo?s.cor:'var(--sep)'}`, background:ativo?s.bg:'var(--bg-2)', color:ativo?s.cor:'var(--label-3)', transition:'all .1s' }}>
              <Icon size={11} style={{ strokeWidth:2.5 }}/> {s.label}
              <span style={{ fontSize:10, fontWeight:700, padding:'0 4px', borderRadius:99, background:ativo?`${s.cor}25`:'var(--fill)', color:ativo?s.cor:'var(--label-4)' }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Busca */}
      <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:10, border:'1px solid var(--sep)', background:'var(--bg-2)', marginBottom:14, maxWidth:400 }}>
        <Search size={13} style={{ color:'var(--label-4)', flexShrink:0 }}/>
        <input value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1)}} placeholder="Buscar por nome..." style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:12.5, color:'var(--label)' }}/>
        {busca && <button onClick={()=>setBusca('')} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--label-4)', display:'flex' }}><X size={11}/></button>}
      </div>

      {loading && !clientes.length ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'60px' }}>
          <RefreshCw size={22} style={{ color:'var(--accent)', animation:'spin 1s linear infinite' }}/>
          <span style={{ fontSize:13, color:'var(--label-4)' }}>Calculando scores RFM de todos os clientes...</span>
        </div>
      ) : view==='tabela' ? (

        /* ── TABELA ── */
        <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--fill)' }}>
                  {[
                    ['nome',    'Cliente',       true,  220],
                    ['rfm',     'Score RFM',     true,  110],
                    ['seg',     'Segmento',      false, 110],
                    ['gasto',   'Total gasto',   true,  120],
                    ['ticket',  'Ticket médio',  true,  110],
                    ['pedidos', 'Pedidos',        true,  90],
                    ['recencia','Última compra',  true,  130],
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
                    <Users size={28} style={{ display:'block', margin:'0 auto 10px', opacity:.3 }}/>
                    <span style={{ fontSize:12, color:'var(--label-4)' }}>Nenhum cliente encontrado</span>
                  </td></tr>
                ) : pageData.map((c, i) => (
                  <tr key={c.id} onClick={()=>setSel(c)}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--fill)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    style={{ borderTop:'1px solid var(--sep)', cursor:'pointer', transition:'background .08s' }}>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <Avatar nome={c.nome} size={30}/>
                        <span style={{ fontSize:13, fontWeight:600, color:'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:170 }}>{c.nome}</span>
                      </div>
                    </td>
                    <td style={{ padding:'11px 14px' }}><RFMMini rfm={c.rfm}/></td>
                    <td style={{ padding:'11px 14px' }}><SegPill segmento={c.segmento}/></td>
                    <td style={{ padding:'11px 14px', fontSize:13, fontWeight:700, color:'var(--label)' }}>{R(c.totalGasto)}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--label-3)' }}>{R(c.ticketMedio)}</td>
                    <td style={{ padding:'11px 14px', fontSize:13, fontWeight:600, color:'var(--label)' }}>{c.pedidosTotal}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <div>
                        <div style={{ fontSize:12, color:'var(--label-3)' }}>{fmtDate(c.ultimaCompra)}</div>
                        <div style={{ fontSize:10, color:c.diasSemComprar>60?'#ef4444':c.diasSemComprar>30?'#f59e0b':'#22c55e', fontWeight:600 }}>{c.diasSemComprar}d atrás</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Paginação */}
          {total > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 14px', borderTop:'1px solid var(--sep)', fontSize:12, color:'var(--label-4)' }}>
              <span style={{ fontWeight:500 }}>{inicio+1}–{Math.min(inicio+POR_PAG,total)} de {total} clientes</span>
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

      ) : (

        /* ── CARDS ── */
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {pageData.map((c, i) => {
            const seg = SEGMENTOS[c.segmento] || SEGMENTOS.regular
            const SegIcon = seg.icon
            return (
              <div key={c.id} onClick={()=>setSel(c)}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.1)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}
                style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, padding:'16px', cursor:'pointer', transition:'all .15s', position:'relative', overflow:'hidden' }}>
                {/* Accent top bar */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:seg.cor, borderRadius:'14px 14px 0 0' }}/>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Avatar nome={c.nome} size={40}/>
                    <div>
                      <div style={{ fontSize:13.5, fontWeight:700, color:'var(--label)', lineHeight:1.2, marginBottom:4 }}>{c.nome}</div>
                      <SegPill segmento={c.segmento}/>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:800, color:'var(--accent)' }}>{c.rfm.total}<span style={{ fontSize:10, color:'var(--label-4)', fontWeight:400 }}>/15</span></div>
                    <div style={{ fontSize:9, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.06em' }}>RFM</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12 }}>
                  <RFMBar label="R" value={c.rfm.r} cor="#22c55e"/>
                  <RFMBar label="F" value={c.rfm.f} cor="#4a9fff"/>
                  <RFMBar label="V" value={c.rfm.v} cor="#f59e0b"/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div style={{ padding:'7px 10px', borderRadius:8, background:'var(--bg)', border:'1px solid var(--sep)' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)' }}>{R(c.totalGasto)}</div>
                    <div style={{ fontSize:9, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.05em' }}>Gasto total</div>
                  </div>
                  <div style={{ padding:'7px 10px', borderRadius:8, background:'var(--bg)', border:'1px solid var(--sep)' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--label)' }}>{c.pedidosTotal}</div>
                    <div style={{ fontSize:9, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.05em' }}>Pedidos</div>
                  </div>
                </div>
                <div style={{ marginTop:8, fontSize:11, color:c.diasSemComprar>60?'#ef4444':c.diasSemComprar>30?'#f59e0b':'#22c55e', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                  <Clock size={10}/>
                  Última compra: {fmtDate(c.ultimaCompra)} ({c.diasSemComprar}d)
                </div>
              </div>
            )
          })}
        </div>

      )}

      {sel && <ClienteSheet cliente={sel} onClose={()=>setSel(null)} api={api}/>}
    </div>
  )
}
