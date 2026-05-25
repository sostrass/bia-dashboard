import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, RefreshCw, X, Package, ExternalLink, Truck, CreditCard,
  MapPin, Star, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Calendar, SlidersHorizontal, MessageSquare, CheckCircle, XCircle,
  Clock, Edit3, Copy, Check, Eye, Zap, Building2, Hash, ArrowUpDown,
  User, Phone, Mail, Home, Tag, TrendingUp, TrendingDown, Minus,
  DollarSign, ShoppingCart, Users, Activity, BarChart3, Layers,
  AlertCircle, Info, ChevronRight as ChevRight, Circle, Package2,
  Receipt, Banknote, Wallet, Archive
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtR   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmtRaw = n => Number(n||0).toFixed(2).replace('.',',')
const fmtDate= d => d ? new Date(d+'T12:00:00').toLocaleDateString('pt-BR') : '—'
const fmtDateTime = d => d ? new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'

// ── Mapa de origens com SVG reais ─────────────────────────────────────────────
const ORIGENS = {
  whatsapp:    { label:'WhatsApp',      cor:'#25D366', icon: () =>
    <svg width={13} height={13} viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  },
  nuvemshop:   { label:'Nuvemshop',     cor:'#0070f3', icon: () =>
    <svg width={13} height={13} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#0070f3"/><path d="M6 14a6 6 0 0112 0" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/><circle cx="12" cy="14" r="2" fill="#fff"/></svg>
  },
  shopee:      { label:'Shopee',        cor:'#EE4D2D', icon: () =>
    <svg width={13} height={13} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#EE4D2D"/><text x="4.5" y="17" fontSize="10" fontWeight="900" fill="#fff" fontFamily="Arial">SP</text></svg>
  },
  shein:       { label:'Shein',         cor:'#c0392b', icon: () =>
    <svg width={13} height={13} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#1a1a2e"/><text x="4" y="17" fontSize="9" fontWeight="900" fill="#fff" fontFamily="Arial">SH</text></svg>
  },
  tiktokshop:  { label:'TikTok Shop',   cor:'#fe2c55', icon: () =>
    <svg width={13} height={13} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#010101"/><path d="M14 5.5c.8 1 2 1.6 3.2 1.6v2.3c-1.1 0-2.2-.4-3-1v4.6a4.1 4.1 0 11-4.1-4.1h.4v2.4h-.4a1.7 1.7 0 100 3.4 1.7 1.7 0 001.7-1.8V5.5H14z" fill="#fff"/></svg>
  },
  mercadolivre:{ label:'Mercado Livre', cor:'#ffe600', icon: () =>
    <svg width={13} height={13} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#ffe600"/><text x="3.5" y="17" fontSize="8.5" fontWeight="900" fill="#333" fontFamily="Arial">ML</text></svg>
  },
  b2b:         { label:'B2B',           cor:'#6366f1', icon: () =>
    <svg width={13} height={13} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#6366f1"/><text x="4" y="17" fontSize="9.5" fontWeight="900" fill="#fff" fontFamily="Arial">B2B</text></svg>
  },
  bling:       { label:'Bling',         cor:'#1D9E75', icon: () =>
    <svg width={13} height={13} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#1D9E75"/><text x="5.5" y="17" fontSize="10" fontWeight="900" fill="#fff" fontFamily="Arial">B</text></svg>
  },
}

const SITUACOES = { 0:'Todos', 6:'Aberto', 9:'Atendido', 12:'Cancelado', 14:'Faturado', 15:'Verificado' }
const SIT = {
  'Verificado':{ bg:'rgba(34,197,94,.1)',  tx:'#22c55e', dot:'#22c55e' },
  'Atendido':  { bg:'rgba(34,197,94,.1)',  tx:'#22c55e', dot:'#22c55e' },
  'Faturado':  { bg:'rgba(74,159,255,.1)', tx:'#4a9fff', dot:'#4a9fff' },
  'Aberto':    { bg:'rgba(245,158,11,.1)', tx:'#f59e0b', dot:'#f59e0b' },
  'Cancelado': { bg:'rgba(239,68,68,.1)',  tx:'#ef4444', dot:'#ef4444' },
}

function mapSit(s){ const id=typeof s==='object'?s.id||s.valor:s; return SITUACOES[id]||String(id) }

function detectarOrigem(p){
  const obs =(p.observacoes||'').toLowerCase()
  const loja=(p.loja?.nome||p.loja?.codigo||p.numeroLoja||'').toLowerCase()
  const can =(p.canal||'').toLowerCase()
  if(obs.includes('whatsapp')||can.includes('whatsapp')) return 'whatsapp'
  if(obs.includes('shopee')  ||loja.includes('shopee'))  return 'shopee'
  if(obs.includes('shein')   ||loja.includes('shein'))   return 'shein'
  if(obs.includes('tiktok')  ||loja.includes('tiktok'))  return 'tiktokshop'
  if(obs.includes('mercado') ||loja.includes('ml')||loja.includes('mercado')) return 'mercadolivre'
  if(obs.includes('nuvem')   ||loja.includes('nuv'))     return 'nuvemshop'
  if(obs.includes('b2b')     ||can.includes('b2b'))      return 'b2b'
  if(loja) {
    for(const [k,v] of Object.entries(ORIGENS)) {
      if(loja.includes(k)||loja.includes(v.label.toLowerCase())) return k
    }
  }
  return 'bling'
}

// ── Atoms ─────────────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const c = SIT[status] || { bg:'var(--fill)', tx:'var(--label-4)', dot:'var(--label-4)' }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, background:c.bg, color:c.tx }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c.dot, display:'inline-block', flexShrink:0 }}/>
      {status}
    </span>
  )
}

function CanalPill({ origem }) {
  const o = ORIGENS[origem]||ORIGENS.bling
  const Icon = o.icon
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6, background:`${o.cor}15`, color:o.cor, border:`1px solid ${o.cor}28` }}>
      <Icon/> {o.label}
    </span>
  )
}

function CompraPill({ n }) {
  if (n===1) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'rgba(245,158,11,.12)', color:'#f59e0b', border:'1px solid rgba(245,158,11,.25)' }}>
      <Star size={9} style={{ fill:'#f59e0b', strokeWidth:0 }}/> Nova
    </span>
  )
  return <span style={{ fontSize:11, color:'var(--label-4)', fontWeight:500 }}>{n}ª</span>
}

function Avatar({ nome, size=32 }) {
  const init = (nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const paleta = ['#7c6af7','#00d4aa','#f59e0b','#22c55e','#4a9fff','#e879f9','#fb923c']
  const cor = paleta[(nome||'?').charCodeAt(0)%paleta.length]
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:`${cor}20`, border:`1.5px solid ${cor}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*.36, fontWeight:800, color:cor, flexShrink:0, letterSpacing:'.02em' }}>
      {init}
    </div>
  )
}

// ── KPI Card com sparkline inline ─────────────────────────────────────────────
function KpiCard({ icon:Ic, label, value, sub, cor, trend, trendLabel, sparkData=[], prefix='', suffix='' }) {
  const max = Math.max(...sparkData, 1)
  const pts = sparkData.map((v,i) => `${(i/(sparkData.length-1||1))*100},${100-(v/max)*80}`)
  return (
    <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, padding:'16px 18px', display:'flex', flexDirection:'column', gap:0, position:'relative', overflow:'hidden' }}>
      {/* Mini sparkline BG */}
      {sparkData.length>1 && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:'absolute', bottom:0, left:0, right:0, height:50, opacity:.08 }}>
          <polyline points={pts.join(' ')} fill="none" stroke={cor} strokeWidth="3"/>
        </svg>
      )}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12, position:'relative' }}>
        <div style={{ width:36, height:36, borderRadius:10, background:`${cor}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Ic size={16} style={{ color:cor }}/>
        </div>
        {trend!==undefined && (
          <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, fontWeight:700,
            color:trend>0?'#22c55e':trend<0?'#ef4444':'var(--label-4)',
            padding:'2px 7px', borderRadius:99,
            background:trend>0?'rgba(34,197,94,.1)':trend<0?'rgba(239,68,68,.1)':'var(--fill)' }}>
            {trend>0?<TrendingUp size={11}/>:trend<0?<TrendingDown size={11}/>:<Minus size={11}/>}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:6, position:'relative' }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color:'var(--label)', letterSpacing:'-.5px', lineHeight:1, marginBottom:4, position:'relative' }}>
        {prefix}{value}{suffix}
      </div>
      {sub && <div style={{ fontSize:11, color:'var(--label-4)', position:'relative' }}>{sub}</div>}
    </div>
  )
}

// ── DateRange picker ──────────────────────────────────────────────────────────
function DateRange({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(()=>{
    const fn=e=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown',fn); return ()=>document.removeEventListener('mousedown',fn)
  },[])
  const hasValue = value.from||value.to
  const label = value.from&&value.to
    ? `${fmtDate(value.from)} — ${fmtDate(value.to)}`
    : value.from ? `De ${fmtDate(value.from)}` : 'Período'
  const preset = (days) => {
    const to=new Date().toISOString().split('T')[0]
    const from=days===0?to:new Date(Date.now()-days*86400000).toISOString().split('T')[0]
    onChange({from,to}); setOpen(false)
  }
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={()=>setOpen(v=>!v)} style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 12px', borderRadius:9, border:`1px solid ${open||hasValue?'var(--accent)':'var(--sep)'}`, background:open||hasValue?'var(--accent-dim)':'var(--bg-2)', color:hasValue?'var(--accent)':'var(--label-3)', fontSize:12.5, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap', transition:'all .15s' }}>
        <Calendar size={13}/> {label}
        {hasValue && <button onClick={e=>{e.stopPropagation();onChange({from:'',to:''})}} style={{ padding:0, border:'none', background:'transparent', color:'inherit', cursor:'pointer', display:'flex', marginLeft:2 }}><X size={11}/></button>}
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:200, background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, padding:18, boxShadow:'0 12px 40px rgba(0,0,0,.3)', minWidth:300 }}>
          {/* Presets */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:14 }}>
            {[['Hoje',0],['7 dias',7],['30 dias',30],['90 dias',90]].map(([lb,days])=>(
              <button key={lb} onClick={()=>preset(days)} style={{ padding:'5px 4px', borderRadius:7, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', fontSize:11, cursor:'pointer', transition:'all .1s', fontWeight:500 }}>
                {lb}
              </button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:6 }}>De</label>
              <input type="date" value={value.from||''} onChange={e=>onChange({...value,from:e.target.value})}
                style={{ width:'100%', padding:'7px 9px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--bg)', color:'var(--label)', fontSize:12.5, outline:'none', boxSizing:'border-box' }}/>
            </div>
            <div>
              <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:6 }}>Até</label>
              <input type="date" value={value.to||''} onChange={e=>onChange({...value,to:e.target.value})}
                style={{ width:'100%', padding:'7px 9px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--bg)', color:'var(--label)', fontSize:12.5, outline:'none', boxSizing:'border-box' }}/>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Order Progress timeline ───────────────────────────────────────────────────
function OrderTimeline({ situacao }) {
  const steps = [
    { key:'Aberto',    label:'Recebido',  sub:'Pedido criado' },
    { key:'Faturado',  label:'Faturado',  sub:'NF emitida' },
    { key:'Atendido',  label:'Enviado',   sub:'Em transporte' },
    { key:'Verificado',label:'Entregue',  sub:'Confirmado' },
  ]
  const order = { Aberto:0, Faturado:1, Atendido:2, Verificado:3 }
  const curr = order[situacao]??0
  const canceled = situacao==='Cancelado'
  if (canceled) return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:9, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)' }}>
      <XCircle size={14} style={{ color:'#ef4444', flexShrink:0 }}/>
      <span style={{ fontSize:12, color:'#ef4444', fontWeight:600 }}>Pedido cancelado</span>
    </div>
  )
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:0, position:'relative', paddingTop:4 }}>
      {steps.map((s,i)=>{
        const done = i<=curr; const active = i===curr
        return (
          <div key={s.key} style={{ flex: i<steps.length-1?1:'none', display:'flex', alignItems:'flex-start' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, minWidth:60 }}>
              <div style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                background:done?'var(--accent)':'var(--fill)', border:`2px solid ${done?'var(--accent)':'var(--sep)'}`,
                boxShadow:active?'0 0 0 4px var(--accent-dim)':'none', transition:'all .4s', zIndex:1 }}>
                {done && <Check size={12} style={{ color:'#000', strokeWidth:3 }}/>}
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, fontWeight:done?700:400, color:done?'var(--label)':'var(--label-4)' }}>{s.label}</div>
                <div style={{ fontSize:9.5, color:'var(--label-4)' }}>{s.sub}</div>
              </div>
            </div>
            {i<steps.length-1 && (
              <div style={{ flex:1, height:2, background:i<curr?'var(--accent)':'var(--sep)', marginTop:12, transition:'all .4s', marginLeft:-2, marginRight:-2 }}/>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Drawer lateral (Sheet) ────────────────────────────────────────────────────
function OrderSheet({ pedido, onClose, api, todosPedidos }) {
  const [det,    setDet]    = useState(null)
  const [loading,setLoad]   = useState(true)
  const [tab,    setTab]    = useState('pedido')
  const [sending,setSend]   = useState(false)
  const [sent,   setSent]   = useState(false)
  const [copied, setCopied] = useState('')

  const origem = detectarOrigem(pedido)
  const sit    = mapSit(pedido.situacao)
  const hist   = todosPedidos.filter(p=>p.contato===pedido.contato&&p.numero!==pedido.numero)
  const nComp  = hist.filter(p=>p.numero<pedido.numero).length+1
  const gasto  = hist.reduce((s,p)=>s+Number(p.total||0),0)+Number(pedido.total||0)
  const isNew  = nComp===1

  useEffect(()=>{
    if(!pedido?.numero) return
    setLoad(true); setDet(null); setTab('pedido')
    fetch(`${api}/api/dashboard/pedidos/${pedido.numero}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ setDet(d); setLoad(false) })
      .catch(()=>setLoad(false))
  },[pedido?.numero])

  const copyText = (text, key) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(()=>setCopied(''),2000) }

  const enviarWA = async () => {
    if(!det) return
    setSend(true)
    const forma = det?.parcelas?.[0]?.formaPagamento?.descricao || det?.parcelas?.[0]?.formaPagamento?.id===1896170?'PIX':'Cartão'
    const itens = (det.itens||[]).map(i=>`• ${i.descricao?.slice(0,40)} (${i.quantidade}x)`).join('\n')
    const nomeCliente = pedido.contato?.split(' ')[0]||'cliente'
    const msg = `✅ *Pedido #${pedido.numero} confirmado!*\n\nOlá, *${nomeCliente}*!\n\n${itens}\n\n💰 Total: *${fmtR(pedido.total)}*\n💳 ${forma}\n📦 Status: *${sit}*\n\n_Obrigada pela sua compra! 🥰 Só Strass_`
    try {
      const tel = (det?.contato?.celular||det?.contato?.telefone||'').replace(/\D/g,'')
      if(tel) await fetch(`${api}/api/dashboard/manual/${tel}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mensagem:msg})})
      setSent(true); setTimeout(()=>setSent(false),3000)
    } catch{}
    setSend(false)
  }

  const rastreio = det?.transporte?.volumes?.[0]?.codigoRastreamento || pedido.codigoRastreio
  const forma = det?.parcelas?.[0]?.formaPagamento?.id===1896170?'PIX':det?.parcelas?.[0]?.formaPagamento?.id===3938183?'Cartão':(det?.parcelas?.[0]?.formaPagamento?.descricao||pedido.formaPagamento||'—')
  const Icon = ORIGENS[origem]?.icon||ORIGENS.bling.icon

  const TABS = [
    { id:'pedido',   label:'Pedido' },
    { id:'cliente',  label:'Cliente' },
    { id:'entrega',  label:'Entrega' },
    { id:'historico',label:'Histórico' },
  ]

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:40, backdropFilter:'blur(3px)' }}/>
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:500, zIndex:50, background:'var(--bg-2)', borderLeft:'1px solid var(--sep)', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'-24px 0 80px rgba(0,0,0,.35)' }}>

        {/* ── HEADER ── */}
        <div style={{ padding:'18px 22px 14px', borderBottom:'1px solid var(--sep)', flexShrink:0, background:'var(--bg-2)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:6 }}>
                <span style={{ fontSize:20, fontWeight:800, color:'var(--label)', letterSpacing:'-.5px' }}>#{pedido.numero}</span>
                <StatusPill status={sit}/>
                {isNew && <CompraPill n={1}/>}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7, alignItems:'center' }}>
                <CanalPill origem={origem}/>
                <span style={{ fontSize:11.5, color:'var(--label-4)' }}>{fmtDateTime(pedido.data)}</span>
                <button onClick={()=>copyText(String(pedido.numero),'num')} style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 7px', borderRadius:5, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-4)', cursor:'pointer', fontSize:10 }}>
                  {copied==='num'?<Check size={9} style={{color:'#22c55e'}}/>:<Copy size={9}/>} #{pedido.numero}
                </button>
              </div>
            </div>
            <button onClick={onClose} style={{ padding:7, borderRadius:9, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', display:'flex', flexShrink:0 }}>
              <X size={14}/>
            </button>
          </div>

          {/* Mini KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {[
              { label:'Valor pedido', val:fmtR(pedido.total), cor:'var(--accent)' },
              { label:'Nº de pedidos', val:String(hist.length+1), cor:'var(--label)' },
              { label:'Gasto total', val:`R$ ${fmtRaw(gasto)}`, cor:'var(--label)' },
            ].map(k=>(
              <div key={k.label} style={{ padding:'8px 10px', borderRadius:9, background:'var(--bg)', border:'1px solid var(--sep)', textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:800, color:k.cor, lineHeight:1 }}>{k.val}</div>
                <div style={{ fontSize:9, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.05em', marginTop:3 }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--sep)', padding:'0 22px', flexShrink:0 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'9px 14px', fontSize:12.5, fontWeight:500, border:'none', background:'transparent', cursor:'pointer', color:tab===t.id?'var(--accent)':'var(--label-3)', borderBottom:`2px solid ${tab===t.id?'var(--accent)':'transparent'}`, marginBottom:-1, transition:'all .12s', whiteSpace:'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'48px 0' }}>
              <RefreshCw size={20} style={{ color:'var(--accent)', animation:'spin 1s linear infinite' }}/>
              <span style={{ fontSize:12, color:'var(--label-4)' }}>Carregando detalhes do Bling...</span>
            </div>
          ) : <>

            {/* ────── PEDIDO ────── */}
            {tab==='pedido' && <>
              {/* Timeline */}
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:10 }}>Progresso</p>
                <OrderTimeline situacao={sit}/>
              </div>

              {/* Financeiro */}
              <div style={{ background:'var(--bg)', borderRadius:12, border:'1px solid var(--sep)', overflow:'hidden', marginBottom:12 }}>
                <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--sep)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg-3,var(--fill))' }}>
                  <span style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', display:'flex', alignItems:'center', gap:6 }}>
                    <Wallet size={12}/> Financeiro
                  </span>
                  <span style={{ fontSize:15, fontWeight:800, color:'var(--accent)' }}>{fmtR(pedido.total)}</span>
                </div>
                {[
                  ['Forma de pagamento', forma, Banknote],
                  ['Frete', det?.transporte?.frete>0?fmtR(det.transporte.frete):'Grátis', Truck],
                  pedido.notaFiscal?['Nota Fiscal', `NF #${pedido.notaFiscal.numero}`, Receipt]:null,
                ].filter(Boolean).map(([lb,vl,Ic])=>(
                  <div key={lb} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 14px', borderBottom:'1px solid var(--sep)' }}>
                    <span style={{ fontSize:12, color:'var(--label-3)', display:'flex', alignItems:'center', gap:6 }}>
                      <Ic size={11} style={{ color:'var(--label-4)' }}/> {lb}
                    </span>
                    <span style={{ fontSize:12.5, fontWeight:600, color:'var(--label)' }}>{vl}</span>
                  </div>
                ))}
              </div>

              {/* Itens */}
              {det?.itens?.length>0 && (
                <div style={{ background:'var(--bg)', borderRadius:12, border:'1px solid var(--sep)', overflow:'hidden', marginBottom:12 }}>
                  <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--sep)', background:'var(--bg-3,var(--fill))' }}>
                    <span style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', display:'flex', alignItems:'center', gap:6 }}>
                      <Package size={12}/> Itens ({det.itens.length})
                    </span>
                  </div>
                  {det.itens.map((item,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderBottom:i<det.itens.length-1?'1px solid var(--sep)':'none' }}>
                      <div style={{ width:36, height:36, borderRadius:9, background:'var(--bg-2)', border:'1px solid var(--sep)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Package2 size={14} style={{ color:'var(--label-4)' }}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--label)', lineHeight:1.3, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.descricao}</div>
                        <div style={{ fontSize:11, color:'var(--label-4)', fontFamily:'monospace' }}>{item.codigo} · {item.quantidade}× · {fmtR(item.valor)}</div>
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--label)', flexShrink:0 }}>{fmtR((item.valor||0)*(item.quantidade||1))}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Observações */}
              {(det?.observacoes||det?.observacoesInternas) && (
                <div style={{ background:'var(--bg)', borderRadius:12, border:'1px solid var(--sep)', padding:'12px 14px' }}>
                  <p style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:8 }}>Observações</p>
                  {det.observacoes && <p style={{ fontSize:12, color:'var(--label-2)', lineHeight:1.6, margin:0 }}>{det.observacoes}</p>}
                  {det.observacoesInternas && <p style={{ fontSize:11.5, color:'var(--label-3)', background:'var(--fill)', padding:'8px 10px', borderRadius:7, marginTop:6, lineHeight:1.5 }}>🔒 {det.observacoesInternas}</p>}
                </div>
              )}
            </>}

            {/* ────── CLIENTE ────── */}
            {tab==='cliente' && <>
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'var(--bg)', borderRadius:12, border:'1px solid var(--sep)', marginBottom:12 }}>
                <Avatar nome={pedido.contato} size={52}/>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:'var(--label)', marginBottom:4 }}>{pedido.contato||'—'}</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {isNew && <CompraPill n={1}/>}
                    <span style={{ fontSize:11, color:'var(--label-4)' }}>ID Bling: {pedido.contatoId||det?.contato?.id||'—'}</span>
                  </div>
                </div>
              </div>

              {/* Dados de contato */}
              <div style={{ background:'var(--bg)', borderRadius:12, border:'1px solid var(--sep)', overflow:'hidden', marginBottom:12 }}>
                {[
                  [Phone, 'Celular', det?.contato?.celular||det?.contato?.telefone, 'tel'],
                  [Mail,  'Email',   det?.contato?.email, 'email'],
                  [Hash,  'CPF/CNPJ',det?.contato?.numeroDocumento||det?.contato?.cpf_cnpj, 'doc'],
                  [Tag,   'Tipo',    det?.contato?.tipoPessoa==='J'?'Pessoa Jurídica':'Pessoa Física', 'tipo'],
                ].filter(([,,v])=>v).map(([Ic,lb,vl,k],i,arr)=>(
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderBottom:i<arr.length-1?'1px solid var(--sep)':'none' }}>
                    <span style={{ fontSize:12, color:'var(--label-3)', display:'flex', alignItems:'center', gap:7 }}>
                      <Ic size={12} style={{ color:'var(--label-4)', flexShrink:0 }}/> {lb}
                    </span>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <span style={{ fontSize:12.5, fontWeight:500, color:'var(--label)', fontFamily:k==='doc'||k==='tel'?'monospace':'inherit' }}>{vl}</span>
                      <button onClick={()=>copyText(String(vl),k)} style={{ padding:'1px 5px', borderRadius:4, border:'1px solid var(--sep)', background:'transparent', color:'var(--label-4)', cursor:'pointer', fontSize:9, display:'flex' }}>
                        {copied===k?<Check size={9} style={{color:'#22c55e'}}/>:<Copy size={9}/>}
                      </button>
                    </div>
                  </div>
                ))}
                {!det?.contato?.celular && !det?.contato?.email && (
                  <div style={{ padding:'20px', textAlign:'center', color:'var(--label-4)', fontSize:12 }}>
                    Dados de contato não disponíveis
                  </div>
                )}
              </div>

              {/* Stats do cliente */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                {[
                  { lb:'Total pedidos', val:hist.length+1, cor:'var(--accent)' },
                  { lb:'Gasto total', val:`R$ ${fmtRaw(gasto)}`, cor:'var(--label)' },
                  { lb:'Ticket médio', val:`R$ ${hist.length>0?fmtRaw(gasto/(hist.length+1)):fmtRaw(pedido.total)}`, cor:'var(--label-3)' },
                  { lb:'Nº da compra', val:`${nComp}ª`, cor:isNew?'#f59e0b':'var(--label-3)' },
                ].map(k=>(
                  <div key={k.lb} style={{ padding:'12px 14px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--sep)', textAlign:'center' }}>
                    <div style={{ fontSize:18, fontWeight:800, color:k.cor, lineHeight:1, marginBottom:3 }}>{k.val}</div>
                    <div style={{ fontSize:10, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.05em' }}>{k.lb}</div>
                  </div>
                ))}
              </div>
            </>}

            {/* ────── ENTREGA ────── */}
            {tab==='entrega' && <>
              {/* Endereço */}
              {(det?.transporte?.etiqueta||det?.contato?.enderecos?.[0]) ? (() => {
                const e = det?.transporte?.etiqueta || {}
                const ec= det?.contato?.enderecos?.[0] || {}
                const end = {
                  logradouro: e.logradouro||ec.endereco||'',
                  numero:     e.numero||ec.numero||'',
                  compl:      e.complemento||ec.complemento||'',
                  bairro:     e.bairro||ec.bairro||'',
                  cidade:     e.municipio||ec.municipio||'',
                  uf:         e.uf||ec.uf||'',
                  cep:        (e.cep||ec.cep||'').replace(/\D/g,''),
                }
                return (
                  <div style={{ background:'var(--bg)', borderRadius:12, border:'1px solid var(--sep)', padding:'14px 16px', marginBottom:12 }}>
                    <p style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                      <MapPin size={12}/> Endereço de entrega
                    </p>
                    <div style={{ fontSize:13, color:'var(--label)', lineHeight:2 }}>
                      <div style={{ fontWeight:600 }}>{end.logradouro}, {end.numero} {end.compl&&`— ${end.compl}`}</div>
                      <div style={{ color:'var(--label-3)' }}>{end.bairro}</div>
                      <div style={{ color:'var(--label-3)' }}>{end.cidade}{end.uf&&`/${end.uf}`}</div>
                      {end.cep && <div style={{ fontFamily:'monospace', color:'var(--accent)', fontSize:12 }}>CEP {end.cep.replace(/(\d{5})(\d{3})/,'$1-$2')}</div>}
                    </div>
                  </div>
                )
              })() : (
                <div style={{ padding:'20px', textAlign:'center', color:'var(--label-4)', fontSize:12, borderRadius:12, border:'1px dashed var(--sep)', marginBottom:12 }}>
                  Endereço não disponível neste pedido
                </div>
              )}

              {/* Rastreio */}
              {(det?.transporte?.volumes||[]).length>0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {det.transporte.volumes.map((vol,i)=>(
                    <div key={i} style={{ background:'var(--bg)', borderRadius:12, border:'1px solid var(--sep)', overflow:'hidden' }}>
                      <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--sep)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg-3,var(--fill))' }}>
                        <span style={{ fontSize:11, fontWeight:700, color:'var(--label-3)', display:'flex', alignItems:'center', gap:6 }}>
                          <Truck size={12}/> Volume {i+1} {vol.servico?.descricao&&`· ${vol.servico.descricao}`}
                        </span>
                        {vol.codigoRastreamento && (
                          <a href={`https://melhorrastreio.com.br/rastreio/${vol.codigoRastreamento}`} target="_blank" rel="noreferrer"
                            style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#4a9fff', textDecoration:'none', padding:'3px 8px', borderRadius:6, border:'1px solid rgba(74,159,255,.3)', background:'rgba(74,159,255,.08)' }}>
                            <ExternalLink size={10}/> Rastrear
                          </a>
                        )}
                      </div>
                      <div style={{ padding:'12px 14px' }}>
                        {vol.codigoRastreamento ? (
                          <>
                            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:9, background:'var(--bg-2)', border:'1px solid var(--sep)', marginBottom:8 }}>
                              <Hash size={12} style={{ color:'var(--accent)', flexShrink:0 }}/>
                              <span style={{ fontSize:13, fontFamily:'monospace', color:'var(--accent)', fontWeight:700, flex:1 }}>{vol.codigoRastreamento}</span>
                              <button onClick={()=>copyText(vol.codigoRastreamento,'rastreio'+i)} style={{ padding:'3px 7px', borderRadius:5, border:'1px solid var(--sep)', background:'transparent', color:'var(--label-4)', cursor:'pointer', fontSize:10, display:'flex', alignItems:'center', gap:3 }}>
                                {copied==='rastreio'+i?<Check size={9} style={{color:'#22c55e'}}/>:<Copy size={9}/>} Copiar
                              </button>
                            </div>
                            {vol.ultimaSituacao?.descricao && (
                              <div style={{ fontSize:12, color:'var(--label-2)', lineHeight:1.5 }}>
                                <strong style={{ color:'var(--label)' }}>Última ocorrência:</strong> {vol.ultimaSituacao.descricao}
                                {vol.dataUltimaOcorrencia && <div style={{ fontSize:11, color:'var(--label-4)', marginTop:3 }}>{fmtDateTime(vol.dataUltimaOcorrencia)}</div>}
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--label-4)', fontSize:12 }}>
                            <Clock size={13}/> Aguardando postagem / código de rastreio
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding:'32px', textAlign:'center', color:'var(--label-4)', borderRadius:12, border:'1px dashed var(--sep)' }}>
                  <Truck size={28} style={{ display:'block', margin:'0 auto 10px', opacity:.2 }}/>
                  <span style={{ fontSize:12 }}>Sem informações de envio</span>
                </div>
              )}
            </>}

            {/* ────── HISTÓRICO ────── */}
            {tab==='historico' && <>
              {hist.length===0 ? (
                <div style={{ padding:'40px', textAlign:'center', borderRadius:12, border:'1px dashed var(--sep)' }}>
                  <Star size={28} style={{ display:'block', margin:'0 auto 12px', color:'#f59e0b', opacity:.5 }}/>
                  <p style={{ fontSize:13, fontWeight:600, color:'var(--label)', marginBottom:4 }}>Primeira compra!</p>
                  <p style={{ fontSize:12, color:'var(--label-4)' }}>Este cliente não tem histórico anterior</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {[...hist].sort((a,b)=>b.numero-a.numero).map((p,i)=>{
                    const sit = mapSit(p.situacao)
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--sep)', transition:'background .1s', cursor:'default' }}>
                        <div style={{ width:36, height:36, borderRadius:9, background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:'var(--accent)' }}>#{p.numero}</span>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                            <StatusPill status={sit}/>
                            <CanalPill origem={detectarOrigem(p)}/>
                          </div>
                          <div style={{ fontSize:11, color:'var(--label-4)' }}>{fmtDate(p.data)}</div>
                        </div>
                        <span style={{ fontSize:14, fontWeight:800, color:'var(--label)', flexShrink:0 }}>{fmtR(p.total)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </>}

          </>}
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div style={{ padding:'12px 22px', borderTop:'1px solid var(--sep)', display:'flex', gap:8, flexShrink:0, background:'var(--bg-2)' }}>
          <button onClick={enviarWA} disabled={sending||!det} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px', borderRadius:10, border:`1px solid ${sent?'rgba(34,197,94,.3)':'rgba(37,211,102,.3)'}`, background:sent?'rgba(34,197,94,.1)':'rgba(37,211,102,.08)', color:sent?'#22c55e':'#25D366', cursor:det?'pointer':'not-allowed', fontSize:12.5, fontWeight:700, transition:'all .2s', opacity:!det?.1:1 }}>
            {sent?<><CheckCircle size={14}/> Enviado!</>:sending?<><RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Enviando...</>:<><MessageSquare size={14}/> Enviar no WhatsApp</>}
          </button>
          {rastreio && (
            <a href={`https://melhorrastreio.com.br/rastreio/${rastreio}`} target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:10, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', fontSize:12.5, textDecoration:'none', fontWeight:600, whiteSpace:'nowrap' }}>
              <Truck size={13}/> Rastrear
            </a>
          )}
          <a href={`https://www.bling.com.br/vendas.php#/vendas/${det?.id||''}`} target="_blank" rel="noreferrer"
            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:10, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', fontSize:12.5, textDecoration:'none', fontWeight:600, whiteSpace:'nowrap' }}>
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
  const [dateRange,  setDateRange]  = useState({from:'',to:''})
  const [sortCol,    setSortCol]    = useState('numero')
  const [sortDir,    setSortDir]    = useState('desc')
  const [pagina,     setPagina]     = useState(1)
  const [sel,        setSel]        = useState(null)
  const POR_PAG = 15

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      // Tenta endpoint dedicado primeiro, fallback para /financeiro
      let pedidosData = []
      try {
        const r = await fetch(`${api}/api/dashboard/pedidos?limite=100`)
        if (r.ok) { const d = await r.json(); pedidosData = d.pedidos||[] }
      } catch {}
      if (!pedidosData.length) {
        const r2 = await fetch(`${api}/api/dashboard/financeiro`)
        if (r2.ok) { const d2 = await r2.json(); pedidosData = d2.pedidos_recentes||[] }
      }
      setPedidos(pedidosData)
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(()=>{ carregar() },[carregar])

  // Filtros + sort
  const filtrados = pedidos.filter(p=>{
    const sit  = mapSit(p.situacao)
    const orig = detectarOrigem(p)
    const data = p.data?(p.data.length===10?p.data:new Date(p.data).toISOString().split('T')[0]):''
    return (filtroSit==='0'||sit===SITUACOES[parseInt(filtroSit)])
      && (filtroLoja==='todos'||orig===filtroLoja)
      && (!busca||String(p.numero).includes(busca)||(p.contato||'').toLowerCase().includes(busca.toLowerCase()))
      && (!dateRange.from||data>=dateRange.from)
      && (!dateRange.to  ||data<=dateRange.to)
  }).sort((a,b)=>{
    let va=a[sortCol], vb=b[sortCol]
    if(['total','numero'].includes(sortCol)){va=Number(va);vb=Number(vb)}
    if(sortCol==='data'){va=new Date(va);vb=new Date(vb)}
    return sortDir==='asc'?(va>vb?1:-1):(va<vb?1:-1)
  })

  const total    = filtrados.length
  const inicio   = (pagina-1)*POR_PAG
  const pageData = filtrados.slice(inicio,inicio+POR_PAG)
  const totalPgs = Math.ceil(total/POR_PAG)

  const toggleSort = col=>{ setSortCol(col); setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc') }
  const SortIco = ({col}) => sortCol===col?(sortDir==='asc'?<ChevronUp size={10}/>:<ChevronDown size={10}/>):<ArrowUpDown size={9} style={{opacity:.25}}/>

  // Métricas
  const totalVal  = pedidos.reduce((s,p)=>s+Number(p.total||0),0)
  const filtVal   = filtrados.reduce((s,p)=>s+Number(p.total||0),0)
  const countSit  = pedidos.reduce((a,p)=>{const s=mapSit(p.situacao);a[s]=(a[s]||0)+1;return a},{})
  const countLoja = pedidos.reduce((a,p)=>{const o=detectarOrigem(p);a[o]=(a[o]||0)+1;return a},{})
  const novos     = pedidos.filter(p=>pedidos.filter(x=>x.contato===p.contato&&x.numero<p.numero).length===0).length
  const ticket    = pedidos.length>0 ? totalVal/pedidos.length : 0
  const verificados= countSit['Verificado']||0
  const taxaVerif  = pedidos.length>0 ? Math.round(verificados/pedidos.length*100) : 0

  // Sparkline data (simulado com totais agrupados)
  const spark = Array.from({length:7},(_,i)=>{
    const dia = new Date(Date.now()-(6-i)*86400000).toISOString().split('T')[0]
    return pedidos.filter(p=>(p.data||'').startsWith(dia)).reduce((s,p)=>s+Number(p.total||0),0)
  })

  const temFiltros = busca||filtroSit!=='0'||filtroLoja!=='todos'||dateRange.from||dateRange.to
  const limparFiltros = ()=>{ setBusca('');setFiltroSit('0');setFiltroLoja('todos');setDateRange({from:'',to:''});setPagina(1) }

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'var(--bg)', padding:'22px 26px' }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--label)', margin:0, letterSpacing:'-.5px' }}>Pedidos</h1>
          <p style={{ fontSize:12, color:'var(--label-4)', margin:'3px 0 0' }}>
            {loading?'Carregando...':`${total} resultado${total!==1?'s':''} · ${pedidos.length} total carregado`}
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>setPagina(p=>p)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:9, border:'1px solid var(--sep)', background:temFiltros?'var(--accent-dim)':'var(--bg-2)', color:temFiltros?'var(--accent)':'var(--label-3)', cursor:'pointer', fontSize:12.5, fontWeight:500 }} onClick={()=>document.getElementById('filterPanel').style.display=document.getElementById('filterPanel').style.display==='none'?'flex':'none'}>
            <SlidersHorizontal size={13}/> Filtros {temFiltros&&<span style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)', flexShrink:0 }}/>}
          </button>
          <button onClick={carregar} style={{ width:36, height:36, borderRadius:9, border:'1px solid var(--sep)', background:'var(--bg-2)', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <RefreshCw size={14} style={{ animation:loading?'spin 1s linear infinite':undefined }}/>
          </button>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        <KpiCard icon={ShoppingCart} label="Total pedidos" value={pedidos.length} sub={`${filtrados.length} filtrado${filtrados.length!==1?'s':''}`} cor="#7c6af7" sparkData={spark.map(v=>v>0?1:0)}/>
        <KpiCard icon={DollarSign}   label="Faturamento"   value={`R$ ${fmtRaw(totalVal)}`} sub={filtVal!==totalVal?`R$ ${fmtRaw(filtVal)} filtrado`:undefined} cor="#00d4aa" sparkData={spark}/>
        <KpiCard icon={Users}        label="Novos clientes" value={novos} sub={`${Math.round(novos/Math.max(pedidos.length,1)*100)}% dos pedidos`} cor="#f59e0b"/>
        <KpiCard icon={Activity}     label="Ticket médio"  value={`R$ ${fmtRaw(ticket)}`} sub="por pedido" cor="#4a9fff"/>
        <KpiCard icon={CheckCircle}  label="Verificados"   value={`${taxaVerif}%`} sub={`${verificados} de ${pedidos.length}`} cor="#22c55e" sparkData={[0,taxaVerif]} trend={taxaVerif>=80?5:taxaVerif>=50?0:-8}/>
      </div>

      {/* ── FILTER PANEL ── */}
      <div id="filterPanel" style={{ display:'none', gap:12, flexWrap:'wrap', alignItems:'flex-end', background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12, padding:'14px 16px', marginBottom:14 }}>
        <div style={{ flex:2, minWidth:200 }}>
          <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:5 }}>Buscar</label>
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 10px', borderRadius:9, border:'1px solid var(--sep)', background:'var(--bg)' }}>
            <Search size={12} style={{ color:'var(--label-4)', flexShrink:0 }}/>
            <input value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1)}} placeholder="Número ou nome do cliente..." style={{ border:'none', background:'transparent', outline:'none', fontSize:12.5, color:'var(--label)', width:'100%' }}/>
            {busca&&<button onClick={()=>setBusca('')} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--label-4)', display:'flex' }}><X size={11}/></button>}
          </div>
        </div>
        <div style={{ flex:1, minWidth:140 }}>
          <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:5 }}>Status</label>
          <select value={filtroSit} onChange={e=>{setFiltroSit(e.target.value);setPagina(1)}} style={{ width:'100%', padding:'7px 10px', borderRadius:9, border:'1px solid var(--sep)', background:'var(--bg)', color:'var(--label)', fontSize:12.5, cursor:'pointer', outline:'none' }}>
            {Object.entries(SITUACOES).map(([id,nm])=><option key={id} value={id}>{nm}{countSit[nm]?` (${countSit[nm]})`:''}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:5 }}>Período</label>
          <DateRange value={dateRange} onChange={v=>{setDateRange(v);setPagina(1)}}/>
        </div>
        {temFiltros&&<button onClick={limparFiltros} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:9, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', fontSize:12, alignSelf:'flex-end', whiteSpace:'nowrap' }}>
          <X size={11}/> Limpar filtros
        </button>}
      </div>

      {/* ── CANAL TABS ── */}
      <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        {[['todos','Todos',pedidos.length,null],...Object.entries(ORIGENS).filter(([k])=>countLoja[k]>0).map(([k,v])=>[k,v.label,countLoja[k]||0,v])].map(([key,label,count,ori])=>{
          const ativo= filtroLoja===key
          const cor  = ori?.cor||'#888'
          const Icon = ori?.icon
          return (
            <button key={key} onClick={()=>{setFiltroLoja(key);setPagina(1)}} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:99, fontSize:12, fontWeight:ativo?700:500, cursor:'pointer', border:`1px solid ${ativo?cor:'var(--sep)'}`, background:ativo?`${cor}15`:'var(--bg-2)', color:ativo?cor:'var(--label-3)', transition:'all .1s' }}>
              {Icon&&<Icon/>} {label}
              <span style={{ fontSize:10, fontWeight:700, padding:'0 4px', borderRadius:99, background:ativo?`${cor}25`:'var(--fill)', color:ativo?cor:'var(--label-4)', minWidth:16, textAlign:'center' }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── TABLE ── */}
      <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg-3,var(--fill))' }}>
                {[['numero','Nº',true,70],['contato','Cliente',true,200],['total','Total',true,110],['situacao','Status',false,120],['canal','Canal',false,130],['compra','Compra',false,90],['data','Data',true,120]].map(([k,lb,sort,w])=>(
                  <th key={k} onClick={sort?()=>toggleSort(k):undefined} style={{ textAlign:'left', padding:'10px 14px', fontSize:10, fontWeight:700, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid var(--sep)', whiteSpace:'nowrap', cursor:sort?'pointer':'default', userSelect:'none', minWidth:w }}>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>{lb}{sort&&<SortIco col={k}/>}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading?(
                <tr><td colSpan={7} style={{ padding:48, textAlign:'center' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                    <RefreshCw size={20} style={{ color:'var(--accent)', animation:'spin 1s linear infinite' }}/>
                    <span style={{ fontSize:12, color:'var(--label-4)' }}>Carregando pedidos do Bling...</span>
                  </div>
                </td></tr>
              ):pageData.length===0?(
                <tr><td colSpan={7} style={{ padding:48, textAlign:'center' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                    <Package size={28} style={{ color:'var(--label-4)', opacity:.3 }}/>
                    <span style={{ fontSize:12, color:'var(--label-4)' }}>Nenhum pedido encontrado</span>
                  </div>
                </td></tr>
              ):pageData.map((p,i)=>{
                const orig = detectarOrigem(p)
                const sit  = mapSit(p.situacao)
                const nC   = pedidos.filter(x=>x.contato===p.contato&&x.numero<p.numero).length+1
                return (
                  <tr key={i} onClick={()=>setSel(p)}
                    onMouseEnter={e=>{e.currentTarget.style.background='var(--fill)'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}
                    style={{ borderTop:'1px solid var(--sep)', cursor:'pointer', transition:'background .08s' }}>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontSize:13, fontWeight:800, color:'var(--accent)' }}>#{p.numero}</span>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <Avatar nome={p.contato} size={30}/>
                        <span style={{ fontSize:12.5, color:'var(--label-2)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:165 }}>{p.contato||'—'}</span>
                      </div>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--label)' }}>{fmtR(p.total)}</span>
                    </td>
                    <td style={{ padding:'11px 14px' }}><StatusPill status={sit}/></td>
                    <td style={{ padding:'11px 14px' }}><CanalPill origem={orig}/></td>
                    <td style={{ padding:'11px 14px' }}><CompraPill n={nC}/></td>
                    <td style={{ padding:'11px 14px', color:'var(--label-4)', fontSize:12, whiteSpace:'nowrap' }}>{fmtDate(p.data)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {(total>0) && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 14px', borderTop:'1px solid var(--sep)', fontSize:12, color:'var(--label-4)' }}>
            <span style={{ fontWeight:500 }}>
              {total===0?'Nenhum resultado':`${inicio+1}–${Math.min(inicio+POR_PAG,total)} de ${total} pedidos`}
            </span>
            {totalPgs>1 && (
              <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                <button onClick={()=>setPagina(1)} disabled={pagina===1} style={{ padding:'4px 9px', borderRadius:6, border:'1px solid var(--sep)', background:'transparent', cursor:pagina===1?'default':'pointer', color:'var(--label-3)', opacity:pagina===1?.35:1, fontSize:12 }}>«</button>
                <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={pagina===1} style={{ padding:'4px 9px', borderRadius:6, border:'1px solid var(--sep)', background:'transparent', cursor:pagina===1?'default':'pointer', color:'var(--label-3)', opacity:pagina===1?.35:1, fontSize:12 }}>‹</button>
                {Array.from({length:Math.min(totalPgs,7)},(_,i)=>{
                  const pg=totalPgs<=7?i+1:pagina<=4?i+1:pagina>=(totalPgs-3)?totalPgs-6+i:pagina-3+i
                  return <button key={pg} onClick={()=>setPagina(pg)} style={{ width:30, height:30, borderRadius:7, border:`1px solid ${pagina===pg?'var(--accent)':'var(--sep)'}`, background:pagina===pg?'var(--accent)':'transparent', color:pagina===pg?'#000':'var(--label-3)', fontSize:12, cursor:'pointer', fontWeight:pagina===pg?700:400 }}>{pg}</button>
                })}
                <button onClick={()=>setPagina(p=>Math.min(totalPgs,p+1))} disabled={pagina===totalPgs} style={{ padding:'4px 9px', borderRadius:6, border:'1px solid var(--sep)', background:'transparent', cursor:pagina===totalPgs?'default':'pointer', color:'var(--label-3)', opacity:pagina===totalPgs?.35:1, fontSize:12 }}>›</button>
                <button onClick={()=>setPagina(totalPgs)} disabled={pagina===totalPgs} style={{ padding:'4px 9px', borderRadius:6, border:'1px solid var(--sep)', background:'transparent', cursor:pagina===totalPgs?'default':'pointer', color:'var(--label-3)', opacity:pagina===totalPgs?.35:1, fontSize:12 }}>»</button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {sel && <OrderSheet pedido={sel} onClose={()=>setSel(null)} api={api} todosPedidos={pedidos}/>}
    </div>
  )
}
