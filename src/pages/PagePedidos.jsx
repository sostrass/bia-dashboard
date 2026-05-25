import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, RefreshCw, X, Package, ExternalLink, Truck, CreditCard,
  MapPin, BarChart2, Star, ChevronDown, ChevronUp, ChevronLeft,
  ChevronRight, Calendar, Filter, Send, MessageSquare, CheckCircle,
  XCircle, Clock, AlertTriangle, Edit3, Copy, Check, Eye, Zap,
  ShoppingBag, Globe, Music, Hash, Building2, Layers, SlidersHorizontal,
  ArrowUpDown, Download, User, Phone, Mail, Home, Tag
} from 'lucide-react'

const fmtR = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—'
const fmtDateTime = d => d ? new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'

// ── Origens — ícones SVG reais ────────────────────────────────────────────────
const ORIGEM_ICONS = {
  whatsapp:    ({ size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  nuvemshop:   ({ size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="#0070f3"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>,
  shopee:      ({ size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="#EE4D2D"><path d="M12 2C7.589 2 4 5.589 4 10c0 5.25 8 14 8 14s8-8.75 8-14c0-4.411-3.589-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>,
  shein:       ({ size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="#222"><rect width="24" height="24" rx="4" fill="#222"/><text x="4" y="17" fontSize="11" fontWeight="bold" fill="#fff" fontFamily="Arial">SH</text></svg>,
  tiktokshop:  ({ size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="#010101"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/></svg>,
  mercadolivre:({ size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#FFE600"/><text x="3" y="17" fontSize="9" fontWeight="bold" fill="#333" fontFamily="Arial">ML</text></svg>,
  b2b:         ({ size=14 }) => <Building2 size={size} color="#534AB7"/>,
  bling:       ({ size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="#1D9E75"><rect width="24" height="24" rx="5" fill="#1D9E75"/><text x="4" y="17" fontSize="10" fontWeight="bold" fill="#fff" fontFamily="Arial">B</text></svg>,
}
const ORIGENS = {
  whatsapp:    { label:'WhatsApp',      cor:'#25D366' },
  nuvemshop:   { label:'Nuvemshop',     cor:'#0070f3' },
  shopee:      { label:'Shopee',        cor:'#EE4D2D' },
  shein:       { label:'Shein',         cor:'#222222' },
  tiktokshop:  { label:'TikTok Shop',   cor:'#010101' },
  mercadolivre:{ label:'Mercado Livre', cor:'#F5A623' },
  b2b:         { label:'B2B',           cor:'#534AB7' },
  bling:       { label:'Bling',         cor:'#1D9E75' },
}
const SITUACOES = { 0:'Todos', 6:'Aberto', 9:'Atendido', 12:'Cancelado', 14:'Faturado', 15:'Verificado' }
const SIT_CORES = {
  'Verificado':{ bg:'rgba(29,158,117,.12)', color:'#1D9E75', dot:'#1D9E75' },
  'Atendido':  { bg:'rgba(29,158,117,.12)', color:'#1D9E75', dot:'#1D9E75' },
  'Aberto':    { bg:'rgba(239,159,39,.12)', color:'#EF9F27', dot:'#EF9F27' },
  'Cancelado': { bg:'rgba(239,68,68,.12)',  color:'#EF4444', dot:'#EF4444' },
  'Faturado':  { bg:'rgba(55,138,221,.12)', color:'#378ADD', dot:'#378ADD' },
}

function mapSit(s) {
  const id = typeof s==='object' ? s.id||s.valor : s
  return SITUACOES[id] || String(id)
}

function detectarOrigem(p) {
  const obs  = (p.observacoes||'').toLowerCase()
  const loja = (p.loja?.nome||p.numeroLoja||'').toLowerCase()
  const canal= (p.canal||'').toLowerCase()
  if (obs.includes('whatsapp')||canal.includes('whatsapp')) return 'whatsapp'
  if (obs.includes('shopee')  ||loja.includes('shopee'))    return 'shopee'
  if (obs.includes('shein')   ||loja.includes('shein'))     return 'shein'
  if (obs.includes('tiktok')  ||loja.includes('tiktok'))    return 'tiktokshop'
  if (obs.includes('mercado') ||loja.includes('ml'))        return 'mercadolivre'
  if (obs.includes('nuvem')   ||loja.includes('nuv'))       return 'nuvemshop'
  if (obs.includes('b2b')     ||canal.includes('b2b'))      return 'b2b'
  return 'bling'
}

// ── Sub-componentes ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const c = SIT_CORES[status] || { bg:'var(--fill)', color:'var(--label-3)', dot:'var(--label-4)' }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:99, background:c.bg, color:c.color, whiteSpace:'nowrap' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c.dot, flexShrink:0 }}/>
      {status}
    </span>
  )
}

function CanalBadge({ origem }) {
  const o = ORIGENS[origem]||ORIGENS.bling
  const Icon = ORIGEM_ICONS[origem]||ORIGEM_ICONS.bling
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:7, background:`${o.cor}15`, color:o.cor, border:`1px solid ${o.cor}25`, whiteSpace:'nowrap' }}>
      <Icon size={12}/> {o.label}
    </span>
  )
}

function CompraBadge({ n, ehPrimeiro }) {
  if (ehPrimeiro) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:99, background:'rgba(245,158,11,.1)', color:'#f59e0b', border:'1px solid rgba(245,158,11,.2)', whiteSpace:'nowrap' }}>
      <Star size={9} style={{ fill:'#f59e0b' }}/> 1ª compra
    </span>
  )
  return <span style={{ fontSize:11, color:'var(--label-4)', fontWeight:500 }}>{n}ª</span>
}

function Avatar({ nome, size=32 }) {
  const initials = (nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const colors = ['#7c6af7','#00d4aa','#f59e0b','#22c55e','#4a9fff','#e879f9']
  const cor = colors[(nome||'').charCodeAt(0)%colors.length]
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:`${cor}20`, border:`1.5px solid ${cor}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.35, fontWeight:700, color:cor, flexShrink:0 }}>
      {initials}
    </div>
  )
}

// Progress bar de etapas do pedido
function OrderProgress({ situacao }) {
  const etapas = [
    { key:'Aberto',    label:'Aberto',    icon:'📋' },
    { key:'Faturado',  label:'Faturado',  icon:'🧾' },
    { key:'Atendido',  label:'Enviado',   icon:'📦' },
    { key:'Verificado',label:'Entregue',  icon:'✅' },
  ]
  const ordemMap = { Aberto:0, Faturado:1, Atendido:2, Verificado:3, Cancelado:-1 }
  const atual = ordemMap[situacao] ?? 0
  const cancelado = situacao === 'Cancelado'
  return (
    <div style={{ padding:'14px 18px', background:'var(--bg)', borderRadius:10, border:'1px solid var(--sep)', marginBottom:12 }}>
      <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:12 }}>Progresso do pedido</p>
      {cancelado ? (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)' }}>
          <XCircle size={14} style={{ color:'#ef4444' }}/> <span style={{ fontSize:12, color:'#ef4444', fontWeight:600 }}>Pedido cancelado</span>
        </div>
      ) : (
        <div style={{ display:'flex', alignItems:'center', gap:0 }}>
          {etapas.map((e, i) => {
            const done = i <= atual
            const active = i === atual
            return (
              <div key={e.key} style={{ display:'flex', alignItems:'center', flex: i < etapas.length-1 ? 1 : 'none' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12,
                    background:done?'var(--accent)':'var(--fill)', border:`2px solid ${done?'var(--accent)':'var(--sep)'}`,
                    boxShadow:active?'0 0 0 4px var(--accent-dim)':undefined, transition:'all .3s' }}>
                    {done ? <Check size={12} style={{ color:'#000' }}/> : <span style={{ fontSize:9 }}>{e.icon}</span>}
                  </div>
                  <span style={{ fontSize:9, fontWeight:done?600:400, color:done?'var(--accent)':'var(--label-4)', whiteSpace:'nowrap' }}>{e.label}</span>
                </div>
                {i < etapas.length-1 && (
                  <div style={{ flex:1, height:2, background:i<atual?'var(--accent)':'var(--sep)', transition:'all .3s', margin:'0 4px', marginBottom:14 }}/>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// DateRange picker simples
function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const label = value.from && value.to
    ? `${new Date(value.from).toLocaleDateString('pt-BR')} — ${new Date(value.to).toLocaleDateString('pt-BR')}`
    : value.from ? `De ${new Date(value.from).toLocaleDateString('pt-BR')}` : 'Período'
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={()=>setOpen(v=>!v)} style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 12px', borderRadius:8, border:'1px solid var(--sep)', background:open||value.from?'var(--accent-dim)':'var(--bg-2)', color:value.from?'var(--accent)':'var(--label-3)', fontSize:12, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' }}>
        <Calendar size={13}/> {label} <ChevronDown size={11} style={{ marginLeft:2 }}/>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:100, background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12, padding:16, boxShadow:'0 8px 32px rgba(0,0,0,.25)', minWidth:280 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', display:'block', marginBottom:5 }}>De</label>
              <input type="date" value={value.from||''} onChange={e=>onChange({...value,from:e.target.value})}
                style={{ width:'100%', padding:'6px 8px', borderRadius:7, border:'1px solid var(--sep)', background:'var(--bg)', color:'var(--label)', fontSize:12, outline:'none' }}/>
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', display:'block', marginBottom:5 }}>Até</label>
              <input type="date" value={value.to||''} onChange={e=>onChange({...value,to:e.target.value})}
                style={{ width:'100%', padding:'6px 8px', borderRadius:7, border:'1px solid var(--sep)', background:'var(--bg)', color:'var(--label)', fontSize:12, outline:'none' }}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {[['Hoje',0],['7 dias',7],['30 dias',30]].map(([lb,days])=>(
              <button key={lb} onClick={()=>{
                const to=new Date().toISOString().split('T')[0]
                const from=days===0?to:new Date(Date.now()-days*86400000).toISOString().split('T')[0]
                onChange({from,to}); setOpen(false)
              }} style={{ flex:1, padding:'5px', borderRadius:6, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', fontSize:11, cursor:'pointer' }}>
                {lb}
              </button>
            ))}
            <button onClick={()=>{onChange({from:'',to:''});setOpen(false)}} style={{ padding:'5px 8px', borderRadius:6, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-4)', fontSize:11, cursor:'pointer' }}>
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sheet (drawer) lateral ────────────────────────────────────────────────────
function Drawer({ pedido, onClose, api, todosPedidos }) {
  const [detalhe, setDetalhe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pedido')
  const [enviandoWA, setEnviandoWA] = useState(false)
  const [waEnviado, setWaEnviado] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editObs, setEditObs] = useState(false)
  const [obsVal, setObsVal] = useState('')

  const origem   = detectarOrigem(pedido)
  const sitAtual = mapSit(pedido.situacao)
  const pedidosCliente = todosPedidos.filter(p => p.contato===pedido.contato && p.numero!==pedido.numero)
  const numCompra  = pedidosCliente.filter(p=>p.numero<pedido.numero).length + 1
  const totalGasto = pedidosCliente.reduce((s,p)=>s+Number(p.total||0),0) + Number(pedido.total||0)
  const ehPrimeiro = numCompra===1

  useEffect(()=>{
    if (!pedido?.numero) return
    setLoading(true); setDetalhe(null)
    fetch(`${api}/api/dashboard/pedidos/${pedido.numero}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ setDetalhe(d); setObsVal(d?.observacoes||''); setLoading(false) })
      .catch(()=>setLoading(false))
  },[pedido?.numero])

  const enviarWA = async () => {
    if (!detalhe) return
    setEnviandoWA(true)
    const forma = detalhe?.parcelas?.[0]?.formaPagamento?.id===1896170?'PIX':'Cartão'
    const itensStr = (detalhe.itens||[]).map(i=>`• ${i.descricao} (${i.quantidade}x) — ${fmtR(i.valor*i.quantidade)}`).join('\n')
    const msg = `✅ *Pedido #${pedido.numero} — Só Strass*\n\nOlá ${pedido.contato?.split(' ')[0]||''}! Segue o resumo do seu pedido:\n\n${itensStr}\n\n💰 Total: *${fmtR(pedido.total)}*\n💳 Pagamento: ${forma}\n📦 Status: ${sitAtual}\n\n_Obrigada pela compra! 🥰_`
    try {
      const tel = detalhe?.contato?.celular||detalhe?.contato?.telefone||''
      if (tel) {
        await fetch(`${api}/api/dashboard/manual/${tel.replace(/\D/g,'')}`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ mensagem: msg })
        })
      }
      setWaEnviado(true); setTimeout(()=>setWaEnviado(false),3000)
    } catch {}
    setEnviandoWA(false)
  }

  const copyNum = () => {
    navigator.clipboard.writeText(String(pedido.numero))
    setCopied(true); setTimeout(()=>setCopied(false),1500)
  }

  const rastreio = detalhe?.transporte?.volumes?.[0]?.codigoRastreamento

  const TABS = [['pedido','Pedido'],['cliente','Cliente'],['rastreio','Rastreio'],['historico','Histórico']]

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:40, backdropFilter:'blur(2px)' }}/>
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:480, zIndex:50, background:'var(--bg-2)', borderLeft:'1px solid var(--sep)', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'-20px 0 60px rgba(0,0,0,.25)' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--sep)', flexShrink:0, background:'var(--bg-2)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:18, fontWeight:800, color:'var(--label)', letterSpacing:'-.3px' }}>#{pedido.numero}</span>
                  <StatusBadge status={sitAtual}/>
                  {ehPrimeiro && <CompraBadge n={1} ehPrimeiro/>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <CanalBadge origem={origem}/>
                  <span style={{ fontSize:11, color:'var(--label-4)' }}>{fmtDateTime(pedido.data)}</span>
                  <button onClick={copyNum} style={{ padding:'2px 6px', borderRadius:5, border:'1px solid var(--sep)', background:'transparent', color:'var(--label-4)', cursor:'pointer', fontSize:10, display:'flex', alignItems:'center', gap:3 }}>
                    {copied?<><Check size={10} style={{ color:'#22c55e' }}/> Copiado</>:<><Copy size={9}/> #{pedido.numero}</>}
                  </button>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ padding:6, borderRadius:8, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', display:'flex', marginTop:2 }}>
              <X size={14}/>
            </button>
          </div>

          {/* KPIs rápidos */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            <div style={{ padding:'8px 10px', borderRadius:9, background:'var(--bg)', border:'1px solid var(--sep)', textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--accent)' }}>{fmtR(pedido.total)}</div>
              <div style={{ fontSize:9, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.05em' }}>Total</div>
            </div>
            <div style={{ padding:'8px 10px', borderRadius:9, background:'var(--bg)', border:'1px solid var(--sep)', textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--label)' }}>{pedidosCliente.length+1}</div>
              <div style={{ fontSize:9, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.05em' }}>Pedidos</div>
            </div>
            <div style={{ padding:'8px 10px', borderRadius:9, background:'var(--bg)', border:'1px solid var(--sep)', textAlign:'center' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--label)' }}>{fmtR(totalGasto)}</div>
              <div style={{ fontSize:9, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.05em' }}>Gasto total</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--sep)', padding:'0 20px', flexShrink:0 }}>
          {TABS.map(([id,lb])=>(
            <button key={id} onClick={()=>setTab(id)} style={{ padding:'9px 14px', fontSize:12, fontWeight:500, border:'none', background:'transparent', cursor:'pointer', borderBottom:`2px solid ${tab===id?'var(--accent)':'transparent'}`, color:tab===id?'var(--accent)':'var(--label-3)', marginBottom:-1, whiteSpace:'nowrap' }}>{lb}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--label-4)', fontSize:12 }}>
              <RefreshCw size={18} className="animate-spin" style={{ color:'var(--accent)', marginBottom:10, display:'block', margin:'0 auto 10px' }}/>
              Carregando detalhes...
            </div>
          ) : <>

            {/* ABA PEDIDO */}
            {tab==='pedido' && <>
              <OrderProgress situacao={sitAtual}/>

              {/* Itens */}
              {detalhe?.itens?.length>0 && (
                <div style={{ background:'var(--bg)', borderRadius:10, border:'1px solid var(--sep)', overflow:'hidden', marginBottom:12 }}>
                  <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--sep)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)' }}>
                      Itens ({detalhe.itens.length})
                    </span>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--accent)' }}>{fmtR(pedido.total)}</span>
                  </div>
                  {detalhe.itens.map((item,i)=>(
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderBottom:i<detalhe.itens.length-1?'1px solid var(--sep)':'none' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:500, color:'var(--label)', lineHeight:1.4, marginBottom:2 }}>{item.descricao}</div>
                        <div style={{ fontSize:11, color:'var(--label-4)', fontFamily:'monospace' }}>{item.codigo} · {item.quantidade}× · {fmtR(item.valor)}/un</div>
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--label)', whiteSpace:'nowrap', marginLeft:12 }}>{fmtR((item.valor||0)*(item.quantidade||1))}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Financeiro */}
              <div style={{ background:'var(--bg)', borderRadius:10, border:'1px solid var(--sep)', padding:'12px 14px', marginBottom:12 }}>
                <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:10 }}>Financeiro</p>
                {[
                  ['Total', fmtR(pedido.total), 'var(--accent)'],
                  ['Pagamento', detalhe?.parcelas?.[0]?.formaPagamento?.id===1896170?'PIX':'Cartão', null],
                  ['Frete', detalhe?.transporte?.frete>0?fmtR(detalhe.transporte.frete):'Grátis', null],
                ].map(([lb,vl,cor])=>vl?(
                  <div key={lb} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--sep)' }}>
                    <span style={{ fontSize:12, color:'var(--label-3)' }}>{lb}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:cor||'var(--label)' }}>{vl}</span>
                  </div>
                ):null)}
              </div>

              {/* Observações */}
              <div style={{ background:'var(--bg)', borderRadius:10, border:'1px solid var(--sep)', padding:'12px 14px', marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', margin:0 }}>Observações</p>
                  <button onClick={()=>setEditObs(v=>!v)} style={{ padding:'3px 8px', borderRadius:6, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
                    <Edit3 size={10}/> {editObs?'Fechar':'Editar'}
                  </button>
                </div>
                {editObs ? (
                  <textarea value={obsVal} onChange={e=>setObsVal(e.target.value)} rows={3}
                    style={{ width:'100%', padding:'8px', borderRadius:7, border:'1px solid var(--sep)', background:'var(--bg-2)', color:'var(--label)', fontSize:12, fontFamily:'inherit', resize:'vertical', outline:'none', boxSizing:'border-box' }}/>
                ) : (
                  <p style={{ fontSize:12, color:'var(--label-3)', lineHeight:1.6, margin:0 }}>{obsVal||'—'}</p>
                )}
              </div>
            </>}

            {/* ABA CLIENTE */}
            {tab==='cliente' && <>
              <div style={{ background:'var(--bg)', borderRadius:10, border:'1px solid var(--sep)', padding:'14px 16px', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <Avatar nome={pedido.contato} size={44}/>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:'var(--label)' }}>{pedido.contato||'—'}</div>
                    {ehPrimeiro && <CompraBadge n={1} ehPrimeiro/>}
                  </div>
                </div>
                {[
                  [Phone, 'Telefone', detalhe?.contato?.celular||detalhe?.contato?.telefone],
                  [Mail,  'Email',    detalhe?.contato?.email],
                  [Hash,  'CPF/CNPJ', detalhe?.contato?.numeroDocumento],
                ].map(([Icon,lb,vl])=>vl?(
                  <div key={lb} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--sep)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <Icon size={12} style={{ color:'var(--label-4)' }}/>
                      <span style={{ fontSize:12, color:'var(--label-3)' }}>{lb}</span>
                    </div>
                    <span style={{ fontSize:12, fontWeight:500, color:'var(--label)', fontFamily:'monospace' }}>{vl}</span>
                  </div>
                ):null)}
              </div>

              {/* Endereço */}
              {detalhe?.transporte?.etiqueta?.logradouro && (
                <div style={{ background:'var(--bg)', borderRadius:10, border:'1px solid var(--sep)', padding:'12px 14px', marginBottom:12 }}>
                  <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:8 }}>Endereço de entrega</p>
                  <div style={{ fontSize:12, color:'var(--label-2)', lineHeight:1.8 }}>
                    <div>{detalhe.transporte.etiqueta.logradouro}, {detalhe.transporte.etiqueta.numero}</div>
                    {detalhe.transporte.etiqueta.complemento && <div>{detalhe.transporte.etiqueta.complemento}</div>}
                    <div>{detalhe.transporte.etiqueta.bairro}</div>
                    <div>{detalhe.transporte.etiqueta.municipio}/{detalhe.transporte.etiqueta.uf}</div>
                    <div style={{ fontFamily:'monospace', color:'var(--accent)', marginTop:4 }}>CEP {detalhe.transporte.etiqueta.cep}</div>
                  </div>
                </div>
              )}

              {/* KPIs do cliente */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div style={{ padding:'12px 14px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--sep)', textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:700, color:'var(--accent)' }}>{pedidosCliente.length+1}</div>
                  <div style={{ fontSize:11, color:'var(--label-4)' }}>pedidos total</div>
                </div>
                <div style={{ padding:'12px 14px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--sep)', textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:700, color:'var(--label)' }}>{fmtR(totalGasto)}</div>
                  <div style={{ fontSize:11, color:'var(--label-4)' }}>gasto total</div>
                </div>
              </div>
            </>}

            {/* ABA RASTREIO */}
            {tab==='rastreio' && <>
              {detalhe?.transporte ? (
                <>
                  {(detalhe.transporte.volumes||[]).map((vol,i)=>(
                    <div key={i} style={{ background:'var(--bg)', borderRadius:10, border:'1px solid var(--sep)', padding:'14px 16px', marginBottom:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:'var(--label)' }}>Volume {i+1}</span>
                        {vol.codigoRastreamento && (
                          <a href={`https://melhorrastreio.com.br/rastreio/${vol.codigoRastreamento}`} target="_blank" rel="noreferrer"
                            style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#4a9fff', textDecoration:'none', padding:'4px 8px', borderRadius:6, border:'1px solid rgba(74,159,255,.3)', background:'rgba(74,159,255,.08)' }}>
                            <ExternalLink size={10}/> Rastrear
                          </a>
                        )}
                      </div>
                      {vol.servico?.descricao && <div style={{ fontSize:12, color:'var(--label-3)', marginBottom:6 }}>{vol.servico.descricao}</div>}
                      {vol.codigoRastreamento ? (
                        <>
                          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, background:'var(--bg-2)', border:'1px solid var(--sep)', marginBottom:8 }}>
                            <Truck size={13} style={{ color:'var(--accent)', flexShrink:0 }}/>
                            <span style={{ fontSize:12, fontFamily:'monospace', color:'var(--accent)', fontWeight:700 }}>{vol.codigoRastreamento}</span>
                            <button onClick={()=>{navigator.clipboard.writeText(vol.codigoRastreamento)}} style={{ marginLeft:'auto', padding:'2px 6px', borderRadius:4, border:'1px solid var(--sep)', background:'transparent', color:'var(--label-4)', cursor:'pointer', fontSize:10 }}>
                              <Copy size={10}/>
                            </button>
                          </div>
                          {vol.ultimaSituacao?.descricao && (
                            <div style={{ fontSize:12, color:'var(--label-2)', padding:'8px 10px', borderRadius:8, background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                              {vol.ultimaSituacao.descricao}
                              {vol.dataUltimaOcorrencia && <div style={{ fontSize:10, color:'var(--label-4)', marginTop:3 }}>Atualizado: {fmtDateTime(vol.dataUltimaOcorrencia)}</div>}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ padding:'12px', textAlign:'center', color:'var(--label-4)', fontSize:12, borderRadius:8, border:'1px dashed var(--sep)' }}>
                          Sem código de rastreio ainda
                        </div>
                      )}
                    </div>
                  ))}
                  {(!detalhe.transporte.volumes||detalhe.transporte.volumes.length===0) && (
                    <div style={{ padding:'32px', textAlign:'center', color:'var(--label-4)', fontSize:12, borderRadius:10, border:'1px dashed var(--sep)' }}>
                      <Truck size={24} style={{ display:'block', margin:'0 auto 10px', opacity:.3 }}/>
                      Nenhum volume cadastrado
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding:'32px', textAlign:'center', color:'var(--label-4)', fontSize:12 }}>Sem informações de transporte</div>
              )}
            </>}

            {/* ABA HISTÓRICO */}
            {tab==='historico' && <>
              {pedidosCliente.length===0 ? (
                <div style={{ padding:'32px', textAlign:'center', color:'var(--label-4)', fontSize:12, borderRadius:10, border:'1px dashed var(--sep)' }}>
                  <Star size={24} style={{ display:'block', margin:'0 auto 10px', opacity:.3 }}/>
                  Primeira compra deste cliente
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {[...pedidosCliente].sort((a,b)=>b.numero-a.numero).map((p,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:9, background:'var(--bg)', border:'1px solid var(--sep)' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:2 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:'var(--accent)' }}>#{p.numero}</span>
                          <StatusBadge status={mapSit(p.situacao)}/>
                        </div>
                        <div style={{ fontSize:11, color:'var(--label-4)' }}>{fmtDate(p.data)}</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--label)' }}>{fmtR(p.total)}</div>
                    </div>
                  ))}
                </div>
              )}
            </>}

          </>}
        </div>

        {/* Footer com ações */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--sep)', display:'flex', gap:8, flexShrink:0, background:'var(--bg-2)' }}>
          <button onClick={enviarWA} disabled={enviandoWA||!detalhe} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px', borderRadius:9, border:'1px solid rgba(37,211,102,.3)', background:waEnviado?'rgba(37,211,102,.12)':'rgba(37,211,102,.08)', color:waEnviado?'#22c55e':'#25D366', cursor:'pointer', fontSize:12.5, fontWeight:600, transition:'all .2s' }}>
            {waEnviado?<><CheckCircle size={14}/> Enviado!</>:enviandoWA?<><RefreshCw size={14} className="animate-spin"/> Enviando...</>:<><MessageSquare size={14}/> Enviar no WhatsApp</>}
          </button>
          {rastreio && (
            <a href={`https://melhorrastreio.com.br/rastreio/${rastreio}`} target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:9, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', fontSize:12.5, textDecoration:'none', fontWeight:500 }}>
              <Truck size={13}/> Rastrear
            </a>
          )}
          <a href={`https://www.bling.com.br/vendas.php#/vendas/${detalhe?.id||''}`} target="_blank" rel="noreferrer"
            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:9, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', fontSize:12.5, textDecoration:'none', fontWeight:500 }}>
            <ExternalLink size={13}/> Bling
          </a>
        </div>
      </div>
    </>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PagePedidos({ api }) {
  const [pedidos,    setPedidos]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [busca,      setBusca]      = useState('')
  const [filtroSit,  setFiltroSit]  = useState('0')
  const [filtroLoja, setFiltroLoja] = useState('todos')
  const [dateRange,  setDateRange]  = useState({ from:'', to:'' })
  const [sortCol,    setSortCol]    = useState('numero')
  const [sortDir,    setSortDir]    = useState('desc')
  const [pagina,     setPagina]     = useState(1)
  const [selecionado,setSelecionado]= useState(null)
  const [showFilters,setShowFilters]= useState(false)
  const POR_PAG = 15

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/financeiro`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setPedidos(d.pedidos_recentes || [])
    } catch(e) {}
    finally { setLoading(false) }
  }, [api])

  useEffect(()=>{ carregar() },[carregar])

  // Filtros
  const filtrados = pedidos.filter(p => {
    const sit   = mapSit(p.situacao)
    const origem= detectarOrigem(p)
    const data  = p.data ? new Date(p.data).toISOString().split('T')[0] : ''
    const mSit  = filtroSit==='0' || sit===SITUACOES[parseInt(filtroSit)]
    const mLoja = filtroLoja==='todos' || origem===filtroLoja
    const mBusca= !busca || String(p.numero).includes(busca) || (p.contato||'').toLowerCase().includes(busca.toLowerCase())
    const mFrom = !dateRange.from || data>=dateRange.from
    const mTo   = !dateRange.to   || data<=dateRange.to
    return mSit&&mLoja&&mBusca&&mFrom&&mTo
  }).sort((a,b)=>{
    let va=a[sortCol], vb=b[sortCol]
    if (sortCol==='total') { va=Number(va); vb=Number(vb) }
    if (sortCol==='data')  { va=new Date(va); vb=new Date(vb) }
    if (sortCol==='numero'){ va=Number(va); vb=Number(vb) }
    return sortDir==='asc' ? (va>vb?1:-1) : (va<vb?1:-1)
  })

  const total    = filtrados.length
  const inicio   = (pagina-1)*POR_PAG
  const pagAtual = filtrados.slice(inicio, inicio+POR_PAG)
  const totalPags= Math.ceil(total/POR_PAG)

  const toggleSort = col => { if (sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortCol(col); setSortDir('desc') } }
  const SortIcon = ({ col }) => sortCol===col ? (sortDir==='asc'?<ChevronUp size={11}/>:<ChevronDown size={11}/>) : <ArrowUpDown size={10} style={{ opacity:.3 }}/>

  const contagemSit = pedidos.reduce((acc,p)=>{ const s=mapSit(p.situacao); acc[s]=(acc[s]||0)+1; return acc },{})
  const contagemLoja= pedidos.reduce((acc,p)=>{ const o=detectarOrigem(p); acc[o]=(acc[o]||0)+1; return acc },{})
  const totalGeral  = pedidos.reduce((s,p)=>s+Number(p.total||0),0)
  const primeiraCompra= pedidos.filter(p=>{ const c=p.contato; return pedidos.filter(x=>x.contato===c&&x.numero<p.numero).length===0 }).length

  const temFiltros = busca||filtroSit!=='0'||filtroLoja!=='todos'||dateRange.from||dateRange.to
  const limparFiltros = () => { setBusca(''); setFiltroSit('0'); setFiltroLoja('todos'); setDateRange({from:'',to:''}); setPagina(1) }

  const COLS = [
    { key:'numero',   label:'Nº',       sortable:true,  width:80 },
    { key:'contato',  label:'Cliente',  sortable:true,  width:200 },
    { key:'total',    label:'Total',    sortable:true,  width:110 },
    { key:'situacao', label:'Status',   sortable:false, width:120 },
    { key:'canal',    label:'Canal',    sortable:false, width:130 },
    { key:'compra',   label:'Compra',   sortable:false, width:90 },
    { key:'data',     label:'Data',     sortable:true,  width:120 },
  ]

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'20px 24px', background:'var(--bg)', position:'relative' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, margin:0, color:'var(--label)', letterSpacing:'-.3px' }}>Pedidos</h1>
          <p style={{ fontSize:12, color:'var(--label-4)', margin:'3px 0 0' }}>
            {total} de {pedidos.length} pedidos
            {dateRange.from && ` · ${new Date(dateRange.from).toLocaleDateString('pt-BR')} — ${dateRange.to?new Date(dateRange.to).toLocaleDateString('pt-BR'):'hoje'}`}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={()=>setShowFilters(v=>!v)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:8, border:'1px solid var(--sep)', background:showFilters||temFiltros?'var(--accent-dim)':'var(--bg-2)', color:showFilters||temFiltros?'var(--accent)':'var(--label-3)', cursor:'pointer', fontSize:12, fontWeight:500 }}>
            <SlidersHorizontal size={13}/> Filtros {temFiltros&&<span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:99, background:'var(--accent)', color:'#000' }}>!</span>}
          </button>
          <button onClick={carregar} style={{ width:34, height:34, borderRadius:8, border:'1px solid var(--sep)', background:'var(--bg-2)', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <RefreshCw size={13} className={loading?'animate-spin':''}/>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total pedidos', value:pedidos.length, sub:'carregados', cor:'#7c6af7' },
          { label:'Valor total',   value:fmtR(totalGeral), sub:'todos os pedidos', cor:'#00d4aa' },
          { label:'Novos clientes',value:primeiraCompra, sub:'primeira compra', cor:'#f59e0b' },
          { label:'Verificados',   value:contagemSit['Verificado']||0, sub:`de ${pedidos.length}`, cor:'#22c55e' },
        ].map(kpi=>(
          <div key={kpi.label} style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:6 }}>{kpi.label}</div>
            <div style={{ fontSize:19, fontWeight:800, color:kpi.cor, letterSpacing:'-.3px', marginBottom:1 }}>{kpi.value}</div>
            <div style={{ fontSize:10, color:'var(--label-4)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Painel de filtros */}
      {showFilters && (
        <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12, padding:'14px 16px', marginBottom:14, display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          {/* Busca */}
          <div style={{ flex:2, minWidth:200 }}>
            <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:5 }}>Buscar</label>
            <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 10px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--bg)' }}>
              <Search size={12} style={{ color:'var(--label-4)', flexShrink:0 }}/>
              <input value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1)}} placeholder="Nº, cliente..." style={{ border:'none', background:'transparent', outline:'none', fontSize:12.5, color:'var(--label)', width:'100%' }}/>
              {busca&&<button onClick={()=>setBusca('')} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--label-4)' }}><X size={11}/></button>}
            </div>
          </div>
          {/* Status */}
          <div style={{ flex:1, minWidth:130 }}>
            <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:5 }}>Status</label>
            <select value={filtroSit} onChange={e=>{setFiltroSit(e.target.value);setPagina(1)}} style={{ width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--bg)', color:'var(--label)', fontSize:12.5, cursor:'pointer', outline:'none' }}>
              {Object.entries(SITUACOES).map(([id,nm])=><option key={id} value={id}>{nm}{contagemSit[nm]?' ('+contagemSit[nm]+')':''}</option>)}
            </select>
          </div>
          {/* Período */}
          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:5 }}>Período</label>
            <DateRangePicker value={dateRange} onChange={v=>{setDateRange(v);setPagina(1)}}/>
          </div>
          {temFiltros && (
            <button onClick={limparFiltros} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', fontSize:12, alignSelf:'flex-end' }}>
              <X size={11}/> Limpar
            </button>
          )}
        </div>
      )}

      {/* Filtros de canal */}
      <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginRight:4 }}>Canal:</span>
        {[['todos','Todos',pedidos.length,'#888'],...Object.entries(ORIGENS).filter(([k])=>contagemLoja[k]).map(([k,v])=>[k,v.label,contagemLoja[k]||0,v.cor])].map(([key,label,count,cor])=>{
          const Icon = key==='todos' ? null : ORIGEM_ICONS[key]
          const ativo= filtroLoja===key
          return (
            <button key={key} onClick={()=>{setFiltroLoja(key);setPagina(1)}} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99, fontSize:11, fontWeight:500, cursor:'pointer', border:`1px solid ${ativo?cor:'var(--sep)'}`, background:ativo?`${cor}15`:'transparent', color:ativo?cor:'var(--label-3)', transition:'all .1s' }}>
              {Icon && <Icon size={12}/>}
              {label}
              {count>0 && <span style={{ fontSize:10, fontWeight:700, padding:'0px 4px', borderRadius:99, background:ativo?`${cor}30`:'var(--fill)', color:ativo?cor:'var(--label-4)' }}>{count}</span>}
            </button>
          )
        })}
      </div>

      {/* DataTable */}
      <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--bg-3,var(--fill))' }}>
                {COLS.map(col=>(
                  <th key={col.key} onClick={col.sortable?()=>toggleSort(col.key):undefined} style={{ textAlign:'left', padding:'9px 14px', fontSize:10, fontWeight:700, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid var(--sep)', whiteSpace:'nowrap', cursor:col.sortable?'pointer':'default', userSelect:'none', minWidth:col.width }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      {col.label}
                      {col.sortable && <SortIcon col={col.key}/>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding:40, textAlign:'center', color:'var(--label-4)' }}>
                  <RefreshCw size={16} className="animate-spin" style={{ color:'var(--accent)', display:'block', margin:'0 auto 10px' }}/>
                  Carregando pedidos...
                </td></tr>
              ) : pagAtual.length===0 ? (
                <tr><td colSpan={7} style={{ padding:40, textAlign:'center', color:'var(--label-4)' }}>
                  <Package size={24} style={{ display:'block', margin:'0 auto 10px', opacity:.3 }}/>
                  Nenhum pedido encontrado
                </td></tr>
              ) : pagAtual.map((p,i)=>{
                const origem= detectarOrigem(p)
                const sit   = mapSit(p.situacao)
                const numCompra = pedidos.filter(x=>x.contato===p.contato&&x.numero<p.numero).length+1
                const ehPrimeiro= numCompra===1
                return (
                  <tr key={i} onClick={()=>setSelecionado(p)}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--fill)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    style={{ borderTop:'1px solid var(--sep)', cursor:'pointer', transition:'background .1s' }}>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--accent)' }}>#{p.numero}</span>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                        <Avatar nome={p.contato} size={28}/>
                        <span style={{ fontSize:12.5, color:'var(--label-2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{p.contato||'—'}</span>
                      </div>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--label)' }}>{fmtR(p.total)}</span>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <StatusBadge status={sit}/>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <CanalBadge origem={origem}/>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <CompraBadge n={numCompra} ehPrimeiro={ehPrimeiro}/>
                    </td>
                    <td style={{ padding:'10px 14px', color:'var(--label-4)', fontSize:12, whiteSpace:'nowrap' }}>
                      {fmtDate(p.data)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {(totalPags>1||total>0) && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderTop:'1px solid var(--sep)', fontSize:12, color:'var(--label-4)' }}>
            <span>Mostrando {total===0?0:inicio+1}–{Math.min(inicio+POR_PAG,total)} de {total}</span>
            <div style={{ display:'flex', gap:4, alignItems:'center' }}>
              <button onClick={()=>setPagina(1)} disabled={pagina===1} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid var(--sep)', background:'transparent', cursor:pagina===1?'not-allowed':'pointer', color:'var(--label-3)', fontSize:11, opacity:pagina===1?.4:1 }}>«</button>
              <button onClick={()=>setPagina(p=>p-1)} disabled={pagina===1} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid var(--sep)', background:'transparent', cursor:pagina===1?'not-allowed':'pointer', color:'var(--label-3)', fontSize:12, opacity:pagina===1?.4:1 }}>‹</button>
              {Array.from({length:Math.min(totalPags,7)},(_,i)=>{
                const pg= totalPags<=7 ? i+1 : pagina<=4 ? i+1 : pagina>=(totalPags-3) ? totalPags-6+i : pagina-3+i
                return (
                  <button key={pg} onClick={()=>setPagina(pg)} style={{ width:30, height:30, borderRadius:7, border:`1px solid ${pagina===pg?'var(--accent)':'var(--sep)'}`, background:pagina===pg?'var(--accent-dim)':'transparent', color:pagina===pg?'var(--accent)':'var(--label-3)', fontSize:12, cursor:'pointer', fontWeight:pagina===pg?700:400 }}>{pg}</button>
                )
              })}
              <button onClick={()=>setPagina(p=>p+1)} disabled={pagina===totalPags} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid var(--sep)', background:'transparent', cursor:pagina===totalPags?'not-allowed':'pointer', color:'var(--label-3)', fontSize:12, opacity:pagina===totalPags?.4:1 }}>›</button>
              <button onClick={()=>setPagina(totalPags)} disabled={pagina===totalPags} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid var(--sep)', background:'transparent', cursor:pagina===totalPags?'not-allowed':'pointer', color:'var(--label-3)', fontSize:11, opacity:pagina===totalPags?.4:1 }}>»</button>
            </div>
          </div>
        )}
      </div>

      {selecionado && (
        <Drawer pedido={selecionado} onClose={()=>setSelecionado(null)} api={api} todosPedidos={pedidos}/>
      )}
    </div>
  )
}
