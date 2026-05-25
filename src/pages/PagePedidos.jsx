import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, RefreshCw, X, Package, ExternalLink, Truck, CreditCard,
  MapPin, Star, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Calendar, SlidersHorizontal, MessageSquare, CheckCircle, XCircle,
  Clock, Copy, Check, Hash, ArrowUpDown, Phone, Mail, Tag,
  TrendingUp, TrendingDown, Minus, DollarSign, ShoppingCart, Users,
  Activity, BarChart3, AlertCircle, Banknote, Package2, Wallet,
  Receipt, Layers, Zap, Archive
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts'

// ── Mapeamento definitivo (debug 25/05/2026) ─────────────────────────────────
const LOJA_CANAL = {
  205946980: 'nuvemshop',
  203414926: 'mercadolivre',
  204884434: 'shopee',
  205916963: 'tiktokshop',
  205693668: 'shein',
}

const ORIGENS = {
  nuvemshop:   { label:'Nuvemshop',      cor:'#0070f3',
    icon:({s=13})=><svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#0070f3"/><text x="4.5" y="16.5" fontSize="9" fontWeight="900" fill="#fff" fontFamily="Arial">NV</text></svg> },
  mercadolivre:{ label:'Mercado Livre',  cor:'#f5a623',
    icon:({s=13})=><svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#ffe600"/><text x="3.5" y="16.5" fontSize="8.5" fontWeight="900" fill="#333" fontFamily="Arial">ML</text></svg> },
  shopee:      { label:'Shopee',         cor:'#EE4D2D',
    icon:({s=13})=><svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#EE4D2D"/><text x="4" y="16.5" fontSize="9" fontWeight="900" fill="#fff" fontFamily="Arial">SP</text></svg> },
  tiktokshop:  { label:'TikTok Shop',    cor:'#010101',
    icon:({s=13})=><svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#010101"/><path d="M14 5.5c.8 1 2 1.6 3.2 1.6v2.3c-1.1 0-2.2-.4-3-1v4.6a4.1 4.1 0 11-4.1-4.1h.4v2.4h-.4a1.7 1.7 0 100 3.4 1.7 1.7 0 001.7-1.8V5.5H14z" fill="#fff"/></svg> },
  shein:       { label:'Shein',          cor:'#c0392b',
    icon:({s=13})=><svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#1a1a2e"/><text x="4" y="16.5" fontSize="9" fontWeight="900" fill="#fff" fontFamily="Arial">SH</text></svg> },
  bling:       { label:'Bling / WA',     cor:'#1D9E75',
    icon:({s=13})=><svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#1D9E75"/><text x="5.5" y="16.5" fontSize="10" fontWeight="900" fill="#fff" fontFamily="Arial">B</text></svg> },
  whatsapp:    { label:'WhatsApp',       cor:'#25D366',
    icon:({s=13})=><svg width={s} height={s} viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
}

// IDs reais das situações (debug confirmado)
const SIT_MAP = {
  6:  { label:'Em Aberto',  cor:'#f59e0b', bg:'rgba(245,158,11,.1)',  operacional:'Pendente',  ordem:0 },
  9:  { label:'Atendido',   cor:'#4a9fff', bg:'rgba(74,159,255,.1)',  operacional:'Enviado',   ordem:2 },
  12: { label:'Cancelado',  cor:'#ef4444', bg:'rgba(239,68,68,.1)',   operacional:'Cancelado', ordem:3 },
  15: { label:'Verificado', cor:'#22c55e', bg:'rgba(34,197,94,.1)',   operacional:'Entregue',  ordem:3 },
}

function getOrigem(p) {
  const lojaId = p.lojaId || p.loja?.id || 0
  if (LOJA_CANAL[lojaId]) return LOJA_CANAL[lojaId]
  if (p.canal) return p.canal
  const obs = (p.observacoes||'').toLowerCase()
  if (obs.includes('whatsapp')) return 'whatsapp'
  return 'bling'
}

function getSit(p) {
  const id = typeof p.situacao==='object' ? p.situacao?.id||p.situacao?.valor : (p.situacaoId||p.situacao)
  return SIT_MAP[id] || SIT_MAP[9]
}

function getSitId(p) {
  return typeof p.situacao==='object' ? p.situacao?.id||p.situacao?.valor : (p.situacaoId||p.situacao)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const R = n=>`R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmtDate=d=>d?new Date(d+'T12:00:00').toLocaleDateString('pt-BR'):'—'
const fmtDT=d=>d?new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—'

// ── Atoms ─────────────────────────────────────────────────────────────────────
function StatusPill({sit}) {
  const s=SIT_MAP[sit]||{label:String(sit),cor:'#888',bg:'var(--fill)'}
  return <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:99,background:s.bg,color:s.cor,whiteSpace:'nowrap'}}>
    <span style={{width:5,height:5,borderRadius:'50%',background:s.cor,display:'inline-block',flexShrink:0}}/>
    {s.label}
  </span>
}

function CanalPill({origem}) {
  const o=ORIGENS[origem]||ORIGENS.bling
  const Icon=o.icon
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:7,background:`${o.cor}15`,color:o.cor,border:`1px solid ${o.cor}28`,whiteSpace:'nowrap'}}>
    <Icon s={12}/> {o.label}
  </span>
}

function Avatar({nome,size=30}) {
  const init=(nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const pal=['#7c6af7','#00d4aa','#f59e0b','#22c55e','#4a9fff','#e879f9','#fb923c']
  const c=pal[(nome||'?').charCodeAt(0)%pal.length]
  return <div style={{width:size,height:size,borderRadius:'50%',background:`${c}20`,border:`1.5px solid ${c}50`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.35,fontWeight:800,color:c,flexShrink:0}}>{init}</div>
}

// ── KPI card com sparkline ─────────────────────────────────────────────────────
function KPI({icon:Ic,label,value,sub,cor,trend,spark=[]}) {
  const mx=Math.max(...spark,1)
  const pts=spark.map((v,i)=>`${(i/(spark.length-1||1))*100},${100-(v/mx)*80}`)
  return (
    <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:'16px 18px',position:'relative',overflow:'hidden',display:'flex',flexDirection:'column',gap:0}}>
      {spark.length>1&&<svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position:'absolute',bottom:0,left:0,right:0,height:48,opacity:.07,pointerEvents:'none'}}>
        <polyline points={pts.join(' ')} fill="none" stroke={cor} strokeWidth="3"/>
      </svg>}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10,position:'relative'}}>
        <div style={{width:34,height:34,borderRadius:9,background:`${cor}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Ic size={15} style={{color:cor}}/>
        </div>
        {trend!==undefined&&<div style={{display:'flex',alignItems:'center',gap:3,fontSize:11,fontWeight:700,padding:'2px 7px',borderRadius:99,background:trend>0?'rgba(34,197,94,.1)':trend<0?'rgba(239,68,68,.1)':'var(--fill)',color:trend>0?'#22c55e':trend<0?'#ef4444':'var(--label-4)'}}>
          {trend>0?<TrendingUp size={10}/>:trend<0?<TrendingDown size={10}/>:<Minus size={10}/>}
          {Math.abs(trend)}%
        </div>}
      </div>
      <div style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--label-4)',marginBottom:5,position:'relative'}}>{label}</div>
      <div style={{fontSize:22,fontWeight:800,color:'var(--label)',letterSpacing:'-.5px',lineHeight:1,marginBottom:3,position:'relative'}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:'var(--label-4)',position:'relative'}}>{sub}</div>}
    </div>
  )
}

// ── DateRange ─────────────────────────────────────────────────────────────────
function DateRange({value,onChange}) {
  const [open,setOpen]=useState(false)
  const ref=useRef()
  useEffect(()=>{const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',fn);return()=>document.removeEventListener('mousedown',fn)},[])
  const preset=days=>{const to=new Date().toISOString().split('T')[0];const from=days===0?to:new Date(Date.now()-days*86400000).toISOString().split('T')[0];onChange({from,to});setOpen(false)}
  const lbl=value.from&&value.to?`${fmtDate(value.from)} — ${fmtDate(value.to)}`:value.from?`De ${fmtDate(value.from)}`:'Período'
  const has=value.from||value.to
  return (
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={()=>setOpen(v=>!v)} style={{display:'flex',alignItems:'center',gap:7,padding:'7px 12px',borderRadius:9,border:`1px solid ${open||has?'var(--accent)':'var(--sep)'}`,background:has?'var(--accent-dim)':'var(--bg-2)',color:has?'var(--accent)':'var(--label-3)',fontSize:12.5,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap'}}>
        <Calendar size={13}/>{lbl}
        {has&&<button onClick={e=>{e.stopPropagation();onChange({from:'',to:''})}} style={{border:'none',background:'transparent',color:'inherit',cursor:'pointer',display:'flex',padding:0,marginLeft:2}}><X size={11}/></button>}
      </button>
      {open&&(
        <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,zIndex:200,background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,padding:18,boxShadow:'0 12px 40px rgba(0,0,0,.3)',minWidth:300}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:14}}>
            {[['Hoje',0],['7d',7],['30d',30],['90d',90]].map(([lb,d])=>(
              <button key={lb} onClick={()=>preset(d)} style={{padding:'5px',borderRadius:7,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-3)',fontSize:11,cursor:'pointer',fontWeight:500}}>{lb}</button>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[['De','from'],['Até','to']].map(([lb,k])=>(
              <div key={k}><label style={{display:'block',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--label-4)',marginBottom:5}}>{lb}</label>
              <input type="date" value={value[k]||''} onChange={e=>onChange({...value,[k]:e.target.value})} style={{width:'100%',padding:'7px 9px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--bg)',color:'var(--label)',fontSize:12.5,outline:'none',boxSizing:'border-box'}}/></div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Rastreio inline ───────────────────────────────────────────────────────────
function TrackingTimeline({codigo,api}) {
  const [data,setData]=useState(null)
  const [loading,setLoad]=useState(false)
  const [err,setErr]=useState(null)

  const buscar=useCallback(async()=>{
    if(!codigo)return
    setLoad(true);setErr(null)
    try{
      const r=await fetch(`${api}/api/dashboard/rastreio/${codigo}`)
      const d=await r.json()
      if(d.erro)setErr(d.erro)
      else setData(d)
    }catch(e){setErr(e.message)}
    setLoad(false)
  },[codigo,api])

  useEffect(()=>{if(codigo)buscar()},[buscar])

  if(!codigo)return(
    <div style={{padding:'14px',textAlign:'center',color:'var(--label-4)',fontSize:12,borderRadius:9,border:'1px dashed var(--sep)'}}>
      <Truck size={20} style={{display:'block',margin:'0 auto 8px',opacity:.3}}/> Sem código de rastreio
    </div>
  )

  if(loading)return(
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px',color:'var(--label-4)',fontSize:12}}>
      <RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Consultando rastreio...
    </div>
  )

  if(err)return(
    <div style={{padding:'10px 14px',borderRadius:9,background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',fontSize:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{color:'#ef4444'}}>Erro: {err}</span>
        <a href={`https://rastreamento.correios.com.br/app/index.php?objetos=${codigo}`} target="_blank" rel="noreferrer"
          style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#4a9fff',textDecoration:'none',padding:'3px 8px',borderRadius:6,border:'1px solid rgba(74,159,255,.3)',background:'rgba(74,159,255,.08)'}}>
          <ExternalLink size={10}/> Correios
        </a>
      </div>
    </div>
  )

  const eventos=data?.resultados?.[0]?.eventos||[]
  const statusAtual=data?.resultados?.[0]?.status

  return(
    <div>
      {/* Header rastreio */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',borderRadius:9,background:'var(--bg)',border:'1px solid var(--sep)',flex:1,marginRight:8}}>
          <Hash size={12} style={{color:'var(--accent)',flexShrink:0}}/>
          <span style={{fontSize:12.5,fontFamily:'monospace',fontWeight:700,color:'var(--accent)',flex:1}}>{codigo}</span>
        </div>
        <a href={`https://rastreamento.correios.com.br/app/index.php?objetos=${codigo}`} target="_blank" rel="noreferrer"
          style={{display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:9,border:'1px solid rgba(74,159,255,.3)',background:'rgba(74,159,255,.08)',color:'#4a9fff',textDecoration:'none',fontSize:12,fontWeight:600,flexShrink:0}}>
          <ExternalLink size={11}/> Correios
        </a>
      </div>

      {statusAtual&&<div style={{padding:'8px 12px',borderRadius:8,background:'rgba(0,212,170,.08)',border:'1px solid rgba(0,212,170,.2)',fontSize:12.5,fontWeight:700,color:'#00d4aa',marginBottom:12}}>
        {statusAtual}
      </div>}

      {eventos.length>0?(
        <div style={{paddingLeft:14,borderLeft:'2px solid var(--sep)'}}>
          {eventos.map((e,i)=>(
            <div key={i} style={{position:'relative',paddingLeft:16,paddingBottom:12}}>
              <div style={{position:'absolute',left:-9,top:3,width:16,height:16,borderRadius:'50%',background:i===0?'var(--accent)':'var(--fill)',border:`2px solid ${i===0?'var(--accent)':'var(--sep)'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {i===0&&<div style={{width:5,height:5,borderRadius:'50%',background:'#000'}}/>}
              </div>
              <div style={{fontSize:12.5,fontWeight:i===0?700:400,color:i===0?'var(--label)':'var(--label-3)',lineHeight:1.4}}>{e.status}</div>
              {e.detalhe&&<div style={{fontSize:11,color:'var(--label-4)',marginTop:1}}>{e.detalhe}</div>}
              {e.local&&<div style={{fontSize:11,color:'var(--label-4)',display:'flex',alignItems:'center',gap:4,marginTop:1}}><MapPin size={9}/>{e.local}</div>}
              <div style={{fontSize:10,color:'var(--label-4)',marginTop:2,fontFamily:'monospace'}}>{e.data}</div>
            </div>
          ))}
        </div>
      ):(
        <div style={{padding:'14px',textAlign:'center',color:'var(--label-4)',fontSize:12,borderRadius:9,border:'1px dashed var(--sep)'}}>
          Sem eventos de rastreio disponíveis
        </div>
      )}
    </div>
  )
}

// ── Order progress timeline ────────────────────────────────────────────────────
function OrderTimeline({sitId}) {
  const steps=[
    {id:6, label:'Recebido', sub:'Pedido criado'},
    {id:99,label:'Faturado', sub:'NF emitida'},  // não usado mas mantém visual
    {id:9, label:'Enviado',  sub:'Em transporte'},
    {id:15,label:'Entregue', sub:'Confirmado'},
  ]
  const order={6:0,9:2,15:3,12:-1}
  const curr=order[sitId]??0
  if(sitId===12)return(
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:9,background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)'}}>
      <XCircle size={14} style={{color:'#ef4444',flexShrink:0}}/><span style={{fontSize:12,color:'#ef4444',fontWeight:600}}>Pedido cancelado</span>
    </div>
  )
  return(
    <div style={{display:'flex',alignItems:'flex-start',gap:0}}>
      {steps.filter(s=>s.id!==99).map((s,i)=>{
        const idx=[0,2,3];const pos=idx[i];const done=pos<=curr;const active=pos===curr
        return(
          <div key={s.id} style={{flex:i<2?1:'none',display:'flex',alignItems:'flex-start'}}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,minWidth:60}}>
              <div style={{width:24,height:24,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:done?'var(--accent)':'var(--fill)',border:`2px solid ${done?'var(--accent)':'var(--sep)'}`,boxShadow:active?'0 0 0 4px var(--accent-dim)':'none',transition:'all .4s',zIndex:1}}>
                {done&&<Check size={11} style={{color:'#000',strokeWidth:3}}/>}
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:11,fontWeight:done?700:400,color:done?'var(--label)':'var(--label-4)'}}>{s.label}</div>
                <div style={{fontSize:9.5,color:'var(--label-4)'}}>{s.sub}</div>
              </div>
            </div>
            {i<2&&<div style={{flex:1,height:2,background:i<curr/2?'var(--accent)':'var(--sep)',marginTop:11,transition:'all .4s',marginLeft:-2,marginRight:-2}}/>}
          </div>
        )
      })}
    </div>
  )
}

// ── Drawer ────────────────────────────────────────────────────────────────────
function OrderSheet({pedido,onClose,api,todosPedidos}) {
  const [det,setDet]=useState(null)
  const [loading,setLoad]=useState(true)
  const [tab,setTab]=useState('pedido')
  const [sending,setSend]=useState(false)
  const [sent,setSent]=useState(false)
  const [copied,setCopied]=useState('')

  const origem=getOrigem(pedido)
  const sitId=getSitId(pedido)
  const sit=SIT_MAP[sitId]||SIT_MAP[9]
  const hist=todosPedidos.filter(p=>p.contato===pedido.contato&&p.numero!==pedido.numero)
  const nComp=hist.filter(p=>p.numero<pedido.numero).length+1
  const gasto=hist.reduce((s,p)=>s+Number(p.total||0),0)+Number(pedido.total||0)

  useEffect(()=>{
    if(!pedido?.numero)return
    setLoad(true);setDet(null);setTab('pedido')
    fetch(`${api}/api/dashboard/pedidos/${pedido.numero}`).then(r=>r.ok?r.json():null).then(d=>{setDet(d);setLoad(false)}).catch(()=>setLoad(false))
  },[pedido?.numero])

  const cp=(text,key)=>{navigator.clipboard.writeText(String(text));setCopied(key);setTimeout(()=>setCopied(''),2000)}

  const enviarWA=async()=>{
    if(!det)return;setSend(true)
    const forma=det?.parcelas?.[0]?.formaPagamento?.id===1896170?'PIX':'Cartão'
    const itens=(det.itens||[]).map(i=>`• ${i.descricao?.slice(0,40)} (${i.quantidade}x)`).join('\n')
    const msg=`✅ *Pedido #${pedido.numero} confirmado!*\n\nOlá, *${pedido.contato?.split(' ')[0]||'cliente'}*!\n\n${itens}\n\n💰 Total: *${R(pedido.total)}*\n💳 ${forma}\n📦 Status: *${sit.label}*\n\n_Obrigada pela sua compra! 🥰 Só Strass_`
    try{
      const tel=(det?.contato?.celular||det?.contato?.telefone||'').replace(/\D/g,'')
      if(tel)await fetch(`${api}/api/dashboard/manual/${tel}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mensagem:msg})})
      setSent(true);setTimeout(()=>setSent(false),3000)
    }catch{}
    setSend(false)
  }

  const rastreio=det?.transporte?.volumes?.[0]?.codigoRastreamento||pedido.codigoRastreio
  const forma=det?.parcelas?.[0]?.formaPagamento?.id===1896170?'PIX':det?.parcelas?.[0]?.formaPagamento?.id===3938183?'Cartão':(det?.parcelas?.[0]?.formaPagamento?.descricao||pedido.formaPagamento||'—')

  const TABS=[{id:'pedido',label:'Pedido'},{id:'cliente',label:'Cliente'},{id:'rastreio',label:'Rastreio'},{id:'historico',label:'Histórico'}]

  return(
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:40,backdropFilter:'blur(3px)'}}/>
      <div style={{position:'fixed',top:0,right:0,bottom:0,width:500,zIndex:50,background:'var(--bg-2)',borderLeft:'1px solid var(--sep)',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'-24px 0 80px rgba(0,0,0,.35)'}}>

        {/* Header */}
        <div style={{padding:'18px 22px 14px',borderBottom:'1px solid var(--sep)',flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:6}}>
                <span style={{fontSize:20,fontWeight:800,color:'var(--label)',letterSpacing:'-.5px'}}>#{pedido.numero}</span>
                <StatusPill sit={sitId}/>
                {nComp===1&&<span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:99,background:'rgba(245,158,11,.12)',color:'#f59e0b',border:'1px solid rgba(245,158,11,.25)'}}><Star size={9} style={{fill:'#f59e0b',strokeWidth:0}}/> Nova</span>}
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:7,alignItems:'center'}}>
                <CanalPill origem={origem}/>
                <span style={{fontSize:11.5,color:'var(--label-4)'}}>{fmtDT(pedido.data)}</span>
                <button onClick={()=>cp(pedido.numero,'num')} style={{display:'flex',alignItems:'center',gap:3,padding:'2px 7px',borderRadius:5,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-4)',cursor:'pointer',fontSize:10}}>
                  {copied==='num'?<Check size={9} style={{color:'#22c55e'}}/>:<Copy size={9}/>} #{pedido.numero}
                </button>
              </div>
            </div>
            <button onClick={onClose} style={{padding:7,borderRadius:9,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-3)',cursor:'pointer',display:'flex',flexShrink:0}}><X size={14}/></button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {[{l:'Valor',v:R(pedido.total),c:'var(--accent)'},{l:'Pedidos',v:String(hist.length+1),c:'var(--label)'},{l:'Gasto total',v:`R$ ${Number(gasto).toFixed(2).replace('.',',')}`,c:'var(--label)'}].map(k=>(
              <div key={k.l} style={{padding:'8px 10px',borderRadius:9,background:'var(--bg)',border:'1px solid var(--sep)',textAlign:'center'}}>
                <div style={{fontSize:15,fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</div>
                <div style={{fontSize:9,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.05em',marginTop:3}}>{k.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:0,borderBottom:'1px solid var(--sep)',padding:'0 22px',flexShrink:0}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'9px 14px',fontSize:12.5,fontWeight:500,border:'none',background:'transparent',cursor:'pointer',color:tab===t.id?'var(--accent)':'var(--label-3)',borderBottom:`2px solid ${tab===t.id?'var(--accent)':'transparent'}`,marginBottom:-1,whiteSpace:'nowrap'}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:'auto',padding:'18px 22px'}}>
          {loading?(
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:'48px 0'}}>
              <RefreshCw size={20} style={{color:'var(--accent)',animation:'spin 1s linear infinite'}}/>
              <span style={{fontSize:12,color:'var(--label-4)'}}>Carregando do Bling...</span>
            </div>
          ):<>

            {/* PEDIDO */}
            {tab==='pedido'&&<>
              <div style={{marginBottom:16}}>
                <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--label-4)',marginBottom:10}}>Progresso</p>
                <OrderTimeline sitId={sitId}/>
              </div>
              <div style={{background:'var(--bg)',borderRadius:12,border:'1px solid var(--sep)',overflow:'hidden',marginBottom:12}}>
                <div style={{padding:'10px 14px',borderBottom:'1px solid var(--sep)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--fill)'}}>
                  <span style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--label-4)',display:'flex',alignItems:'center',gap:6}}><Wallet size={12}/> Financeiro</span>
                  <span style={{fontSize:15,fontWeight:800,color:'var(--accent)'}}>{R(pedido.total)}</span>
                </div>
                {[[Banknote,'Pagamento',forma],[Truck,'Frete',det?.transporte?.frete>0?R(det.transporte.frete):'Grátis'],pedido.notaFiscal?[Receipt,'Nota Fiscal',`NF #${pedido.notaFiscal.numero}`]:null].filter(Boolean).map(([Ic,lb,vl])=>(
                  <div key={lb} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 14px',borderBottom:'1px solid var(--sep)'}}>
                    <span style={{fontSize:12,color:'var(--label-3)',display:'flex',alignItems:'center',gap:6}}><Ic size={11} style={{color:'var(--label-4)'}}/> {lb}</span>
                    <span style={{fontSize:12.5,fontWeight:600,color:'var(--label)'}}>{vl}</span>
                  </div>
                ))}
              </div>
              {det?.itens?.length>0&&(
                <div style={{background:'var(--bg)',borderRadius:12,border:'1px solid var(--sep)',overflow:'hidden',marginBottom:12}}>
                  <div style={{padding:'10px 14px',borderBottom:'1px solid var(--sep)',background:'var(--fill)'}}>
                    <span style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--label-4)',display:'flex',alignItems:'center',gap:6}}><Package size={12}/> Itens ({det.itens.length})</span>
                  </div>
                  {det.itens.map((item,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderBottom:i<det.itens.length-1?'1px solid var(--sep)':'none'}}>
                      <div style={{width:34,height:34,borderRadius:9,background:'var(--bg-2)',border:'1px solid var(--sep)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <Package2 size={13} style={{color:'var(--label-4)'}}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:'var(--label)',lineHeight:1.3,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.descricao}</div>
                        <div style={{fontSize:11,color:'var(--label-4)',fontFamily:'monospace'}}>{item.codigo} · {item.quantidade}× · {R(item.valor)}</div>
                      </div>
                      <span style={{fontSize:13,fontWeight:700,color:'var(--label)',flexShrink:0}}>{R((item.valor||0)*(item.quantidade||1))}</span>
                    </div>
                  ))}
                </div>
              )}
              {(det?.observacoes||det?.observacoesInternas)&&(
                <div style={{background:'var(--bg)',borderRadius:12,border:'1px solid var(--sep)',padding:'12px 14px'}}>
                  <p style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--label-4)',marginBottom:8}}>Observações</p>
                  {det.observacoes&&<p style={{fontSize:12,color:'var(--label-2)',lineHeight:1.6,margin:0}}>{det.observacoes}</p>}
                  {det.observacoesInternas&&<p style={{fontSize:11.5,color:'var(--label-3)',background:'var(--fill)',padding:'8px 10px',borderRadius:7,marginTop:6,lineHeight:1.5}}>🔒 {det.observacoesInternas}</p>}
                </div>
              )}
            </>}

            {/* CLIENTE */}
            {tab==='cliente'&&<>
              <div style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:'var(--bg)',borderRadius:12,border:'1px solid var(--sep)',marginBottom:12}}>
                <Avatar nome={pedido.contato} size={50}/>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:'var(--label)',marginBottom:4}}>{pedido.contato||'—'}</div>
                  <div style={{display:'flex',gap:6}}>{nComp===1&&<span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:99,background:'rgba(245,158,11,.12)',color:'#f59e0b',border:'1px solid rgba(245,158,11,.25)'}}>⭐ 1ª compra</span>}</div>
                </div>
              </div>
              <div style={{background:'var(--bg)',borderRadius:12,border:'1px solid var(--sep)',overflow:'hidden',marginBottom:12}}>
                {[[Phone,'Celular',det?.contato?.celular||det?.contato?.telefone,'tel'],[Mail,'Email',det?.contato?.email,'email'],[Hash,'CPF/CNPJ',det?.contato?.numeroDocumento,'doc']].filter(([,,v])=>v).map(([Ic,lb,vl,k],i,arr)=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderBottom:i<arr.length-1?'1px solid var(--sep)':'none'}}>
                    <span style={{fontSize:12,color:'var(--label-3)',display:'flex',alignItems:'center',gap:7}}><Ic size={12} style={{color:'var(--label-4)',flexShrink:0}}/> {lb}</span>
                    <div style={{display:'flex',alignItems:'center',gap:7}}>
                      <span style={{fontSize:12.5,fontWeight:500,color:'var(--label)',fontFamily:k==='doc'||k==='tel'?'monospace':'inherit'}}>{vl}</span>
                      <button onClick={()=>cp(vl,k)} style={{padding:'1px 5px',borderRadius:4,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-4)',cursor:'pointer',fontSize:9,display:'flex'}}>
                        {copied===k?<Check size={9} style={{color:'#22c55e'}}/>:<Copy size={9}/>}
                      </button>
                    </div>
                  </div>
                ))}
                {!det?.contato?.celular&&!det?.contato?.email&&<div style={{padding:'20px',textAlign:'center',color:'var(--label-4)',fontSize:12}}>Dados não disponíveis neste pedido</div>}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                {[{lb:'Total pedidos',v:hist.length+1,c:'var(--accent)'},{lb:'Gasto total',v:`R$ ${Number(gasto).toFixed(2).replace('.',',')}`,c:'var(--label)'},{lb:'Ticket médio',v:`R$ ${(gasto/(hist.length+1)).toFixed(2).replace('.',',')}`,c:'var(--label-3)'},{lb:'Nº da compra',v:`${nComp}ª`,c:nComp===1?'#f59e0b':'var(--label-3)'}].map(k=>(
                  <div key={k.lb} style={{padding:'12px 14px',borderRadius:10,background:'var(--bg)',border:'1px solid var(--sep)',textAlign:'center'}}>
                    <div style={{fontSize:18,fontWeight:800,color:k.c,lineHeight:1,marginBottom:3}}>{k.v}</div>
                    <div style={{fontSize:10,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.05em'}}>{k.lb}</div>
                  </div>
                ))}
              </div>
            </>}

            {/* RASTREIO */}
            {tab==='rastreio'&&(
              <TrackingTimeline codigo={rastreio} api={api}/>
            )}

            {/* HISTÓRICO */}
            {tab==='historico'&&(
              hist.length===0?(
                <div style={{padding:'40px',textAlign:'center',borderRadius:12,border:'1px dashed var(--sep)'}}>
                  <Star size={28} style={{display:'block',margin:'0 auto 12px',color:'#f59e0b',opacity:.5}}/>
                  <p style={{fontSize:13,fontWeight:600,color:'var(--label)',marginBottom:4}}>Primeira compra!</p>
                  <p style={{fontSize:12,color:'var(--label-4)'}}>Nenhum pedido anterior</p>
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {[...hist].sort((a,b)=>b.numero-a.numero).map((p,i)=>{
                    const pSit=getSitId(p); const pOrig=getOrigem(p)
                    return(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderRadius:10,background:'var(--bg)',border:'1px solid var(--sep)'}}>
                        <div style={{width:36,height:36,borderRadius:9,background:'var(--accent-dim)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <span style={{fontSize:12,fontWeight:700,color:'var(--accent)'}}>#{p.numero}</span>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                            <StatusPill sit={pSit}/><CanalPill origem={pOrig}/>
                          </div>
                          <div style={{fontSize:11,color:'var(--label-4)'}}>{fmtDate(p.data)}</div>
                        </div>
                        <span style={{fontSize:14,fontWeight:800,color:'var(--label)',flexShrink:0}}>{R(p.total)}</span>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </>}
        </div>

        {/* Footer */}
        <div style={{padding:'12px 22px',borderTop:'1px solid var(--sep)',display:'flex',gap:8,flexShrink:0,background:'var(--bg-2)'}}>
          <button onClick={enviarWA} disabled={sending||!det} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'9px',borderRadius:10,border:`1px solid ${sent?'rgba(34,197,94,.3)':'rgba(37,211,102,.3)'}`,background:sent?'rgba(34,197,94,.1)':'rgba(37,211,102,.08)',color:sent?'#22c55e':'#25D366',cursor:det?'pointer':'not-allowed',fontSize:12.5,fontWeight:700,opacity:!det?.1:1}}>
            {sent?<><CheckCircle size={14}/> Enviado!</>:sending?<><RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Enviando...</>:<><MessageSquare size={14}/> Enviar no WhatsApp</>}
          </button>
          {rastreio&&<a href={`https://rastreamento.correios.com.br/app/index.php?objetos=${rastreio}`} target="_blank" rel="noreferrer"
            style={{display:'flex',alignItems:'center',gap:6,padding:'9px 14px',borderRadius:10,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-3)',fontSize:12.5,textDecoration:'none',fontWeight:600}}>
            <Truck size={13}/> Rastrear
          </a>}
          <a href={`https://www.bling.com.br/vendas.php#/vendas/${det?.id||''}`} target="_blank" rel="noreferrer"
            style={{display:'flex',alignItems:'center',gap:6,padding:'9px 14px',borderRadius:10,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-3)',fontSize:12.5,textDecoration:'none',fontWeight:600}}>
            <ExternalLink size={13}/> Bling
          </a>
        </div>
      </div>
    </>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function PagePedidos({api}) {
  const [pedidos,setPedidos]=useState([])
  const [loading,setLoading]=useState(true)
  const [busca,setBusca]=useState('')
  const [filtroSit,setFiltroSit]=useState('todos')
  const [filtroLoja,setFiltroLoja]=useState('todos')
  const [dateRange,setDateRange]=useState({from:'',to:''})
  const [sortCol,setSortCol]=useState('numero')
  const [sortDir,setSortDir]=useState('desc')
  const [pagina,setPagina]=useState(1)
  const [sel,setSel]=useState(null)
  const [showFilters,setShowFilters]=useState(false)
  const [view,setView]=useState('tabela') // 'tabela' | 'kanban'
  const POR_PAG=15

  const carregar=useCallback(async()=>{
    setLoading(true)
    try{
      let data=[]
      try{const r=await fetch(`${api}/api/dashboard/pedidos?limite=200`);if(r.ok){const d=await r.json();data=d.pedidos||[]}}catch{}
      if(!data.length){const r2=await fetch(`${api}/api/dashboard/financeiro`);if(r2.ok){const d2=await r2.json();data=d2.pedidos_recentes||[]}}
      setPedidos(data)
    }catch{}
    setLoading(false)
  },[api])

  useEffect(()=>{carregar()},[carregar])

  const filtrados=pedidos.filter(p=>{
    const sid=getSitId(p); const orig=getOrigem(p)
    const dat=p.data?(p.data.length===10?p.data:new Date(p.data).toISOString().split('T')[0]):''
    const sit=SIT_MAP[sid]
    return (filtroSit==='todos'||String(sid)===filtroSit)
      &&(filtroLoja==='todos'||orig===filtroLoja)
      &&(!busca||String(p.numero).includes(busca)||(p.contato||'').toLowerCase().includes(busca.toLowerCase()))
      &&(!dateRange.from||dat>=dateRange.from)
      &&(!dateRange.to||dat<=dateRange.to)
  }).sort((a,b)=>{
    let va=a[sortCol],vb=b[sortCol]
    if(['total','numero'].includes(sortCol)){va=Number(va);vb=Number(vb)}
    if(sortCol==='data'){va=new Date(va);vb=new Date(vb)}
    return sortDir==='asc'?(va>vb?1:-1):(va<vb?1:-1)
  })

  const total=filtrados.length
  const inicio=(pagina-1)*POR_PAG
  const pageData=filtrados.slice(inicio,inicio+POR_PAG)
  const totalPgs=Math.ceil(total/POR_PAG)
  const toggleSort=col=>{setSortCol(col);setSortDir(d=>sortCol===col?(d==='asc'?'desc':'asc'):'desc')}
  const SortIco=({col})=>sortCol===col?(sortDir==='asc'?<ChevronUp size={10}/>:<ChevronDown size={10}/>):<ArrowUpDown size={9} style={{opacity:.25}}/>

  // Métricas
  const totalVal=pedidos.reduce((s,p)=>s+Number(p.total||0),0)
  const filtVal=filtrados.reduce((s,p)=>s+Number(p.total||0),0)
  const novos=pedidos.filter(p=>pedidos.filter(x=>x.contato===p.contato&&x.numero<p.numero).length===0).length
  const ticket=pedidos.length>0?totalVal/pedidos.length:0
  const countSit=pedidos.reduce((a,p)=>{const s=getSitId(p);a[s]=(a[s]||0)+1;return a},{})
  const countLoja=pedidos.reduce((a,p)=>{const o=getOrigem(p);a[o]=(a[o]||0)+1;return a},{})
  const pendentes=(countSit[6]||0)  // Em aberto
  const enviados=(countSit[9]||0)   // Atendido
  const entregues=(countSit[15]||0) // Verificado
  const cancelados=(countSit[12]||0)
  const taxaEntrega=pedidos.length>0?Math.round(entregues/pedidos.length*100):0

  // Spark 7 dias
  const spark=Array.from({length:7},(_,i)=>{
    const dia=new Date(Date.now()-(6-i)*86400000).toISOString().split('T')[0]
    return pedidos.filter(p=>(p.data||'').startsWith(dia)).reduce((s,p)=>s+Number(p.total||0),0)
  })

  const temFiltros=busca||filtroSit!=='todos'||filtroLoja!=='todos'||dateRange.from||dateRange.to
  const limpar=()=>{setBusca('');setFiltroSit('todos');setFiltroLoja('todos');setDateRange({from:'',to:''});setPagina(1)}

  // Kanban por situação
  const KANBAN_COLS=[
    {sitId:6, label:'Em Aberto', sub:'Aguardando processamento', cor:'#f59e0b', icon:Clock},
    {sitId:9, label:'Atendido',  sub:'Enviado ao cliente',       cor:'#4a9fff', icon:Truck},
    {sitId:15,label:'Verificado',sub:'Entregue e confirmado',    cor:'#22c55e', icon:CheckCircle},
    {sitId:12,label:'Cancelado', sub:'Pedido cancelado',         cor:'#ef4444', icon:XCircle},
  ]

  return(
    <div style={{height:'100%',overflowY:'auto',background:'var(--bg)',padding:'22px 26px'}}>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:'var(--label)',margin:0,letterSpacing:'-.5px'}}>Pedidos</h1>
          <p style={{fontSize:12,color:'var(--label-4)',margin:'3px 0 0'}}>
            {loading?'Carregando...':`${total} resultado${total!==1?'s':''} · ${pedidos.length} total`}
          </p>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {/* View toggle */}
          <div style={{display:'flex',borderRadius:9,border:'1px solid var(--sep)',overflow:'hidden'}}>
            {[['tabela','Tabela'],['kanban','Kanban']].map(([v,lb])=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:'6px 14px',border:'none',background:view===v?'var(--accent-dim)':'transparent',color:view===v?'var(--accent)':'var(--label-3)',cursor:'pointer',fontSize:12,fontWeight:view===v?700:400}}>{lb}</button>
            ))}
          </div>
          <button onClick={()=>setShowFilters(v=>!v)} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 12px',borderRadius:9,border:'1px solid var(--sep)',background:temFiltros?'var(--accent-dim)':'var(--bg-2)',color:temFiltros?'var(--accent)':'var(--label-3)',cursor:'pointer',fontSize:12.5,fontWeight:500}}>
            <SlidersHorizontal size={13}/> Filtros {temFiltros&&<span style={{width:7,height:7,borderRadius:'50%',background:'var(--accent)',flexShrink:0}}/>}
          </button>
          <button onClick={carregar} style={{width:36,height:36,borderRadius:9,border:'1px solid var(--sep)',background:'var(--bg-2)',cursor:'pointer',color:'var(--label-3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <RefreshCw size={14} style={{animation:loading?'spin 1s linear infinite':undefined}}/>
          </button>
        </div>
      </div>

      {/* KPI Grid 5 colunas */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:18}}>
        <KPI icon={ShoppingCart} label="Total pedidos" value={pedidos.length} sub={`${filtrados.length} filtrado${filtrados.length!==1?'s':''}`} cor="#7c6af7" spark={spark.map(v=>v>0?1:0)}/>
        <KPI icon={DollarSign}   label="Faturamento"   value={`R$ ${Number(totalVal).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}`} sub={filtVal!==totalVal?`R$ ${Number(filtVal).toFixed(0)} filtrado`:undefined} cor="#00d4aa" spark={spark} trend={spark[6]>spark[0]?8:-3}/>
        <KPI icon={Clock}        label="Pendentes"      value={pendentes} sub="Em aberto" cor="#f59e0b" trend={pendentes>0?-5:5}/>
        <KPI icon={Users}        label="Novos clientes" value={novos} sub={`${Math.round(novos/Math.max(pedidos.length,1)*100)}% dos pedidos`} cor="#e879f9"/>
        <KPI icon={CheckCircle}  label="Taxa entrega"   value={`${taxaEntrega}%`} sub={`${entregues} entregues`} cor="#22c55e" trend={taxaEntrega>=80?5:-8}/>
      </div>

      {/* Barra de progresso operacional */}
      <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'14px 18px',marginBottom:18}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--label-4)'}}>Pipeline operacional</span>
          <span style={{fontSize:11,color:'var(--label-4)'}}>{pedidos.length} pedidos</span>
        </div>
        <div style={{display:'flex',borderRadius:8,overflow:'hidden',height:10,gap:2}}>
          {[[pendentes,'#f59e0b'],[enviados,'#4a9fff'],[entregues,'#22c55e'],[cancelados,'#ef4444']].map(([count,cor],i)=>{
            const pct=pedidos.length>0?count/pedidos.length*100:0
            return pct>0?<div key={i} title={`${count} pedidos`} style={{height:'100%',width:`${pct}%`,background:cor,transition:'width .5s',borderRadius:2}}/>:null
          })}
        </div>
        <div style={{display:'flex',gap:16,marginTop:8}}>
          {[['Em aberto',pendentes,'#f59e0b'],[`Enviado${enviados!==1?'s':''}`,enviados,'#4a9fff'],[`Entregue${entregues!==1?'s':''}`,entregues,'#22c55e'],cancelados>0?['Cancelados',cancelados,'#ef4444']:null].filter(Boolean).map(([lb,count,cor])=>(
            <div key={lb} style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:cor,flexShrink:0}}/>
              <span style={{fontSize:11,color:'var(--label-3)'}}>{count} {lb}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      {showFilters&&(
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end',background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:12,padding:'14px 16px',marginBottom:14}}>
          <div style={{flex:2,minWidth:200}}>
            <label style={{display:'block',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--label-4)',marginBottom:5}}>Buscar</label>
            <div style={{display:'flex',alignItems:'center',gap:7,padding:'7px 10px',borderRadius:9,border:'1px solid var(--sep)',background:'var(--bg)'}}>
              <Search size={12} style={{color:'var(--label-4)',flexShrink:0}}/>
              <input value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1)}} placeholder="Número ou cliente..." style={{border:'none',background:'transparent',outline:'none',fontSize:12.5,color:'var(--label)',width:'100%'}}/>
              {busca&&<button onClick={()=>setBusca('')} style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--label-4)',display:'flex'}}><X size={11}/></button>}
            </div>
          </div>
          <div style={{flex:1,minWidth:130}}>
            <label style={{display:'block',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--label-4)',marginBottom:5}}>Status</label>
            <select value={filtroSit} onChange={e=>{setFiltroSit(e.target.value);setPagina(1)}} style={{width:'100%',padding:'7px 10px',borderRadius:9,border:'1px solid var(--sep)',background:'var(--bg)',color:'var(--label)',fontSize:12.5,cursor:'pointer',outline:'none'}}>
              <option value="todos">Todos ({pedidos.length})</option>
              {Object.entries(SIT_MAP).map(([id,s])=><option key={id} value={id}>{s.label} ({countSit[id]||0})</option>)}
            </select>
          </div>
          <div>
            <label style={{display:'block',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--label-4)',marginBottom:5}}>Período</label>
            <DateRange value={dateRange} onChange={v=>{setDateRange(v);setPagina(1)}}/>
          </div>
          {temFiltros&&<button onClick={limpar} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:9,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-3)',cursor:'pointer',fontSize:12,alignSelf:'flex-end',whiteSpace:'nowrap'}}>
            <X size={11}/> Limpar
          </button>}
        </div>
      )}

      {/* Canal tabs */}
      <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        {[['todos','Todos',pedidos.length,null],...Object.entries(ORIGENS).filter(([k])=>countLoja[k]>0).map(([k,v])=>[k,v.label,countLoja[k]||0,v])].map(([key,label,count,ori])=>{
          const ativo=filtroLoja===key; const cor=ori?.cor||'#888'; const Icon=ori?.icon
          return(
            <button key={key} onClick={()=>{setFiltroLoja(key);setPagina(1)}} style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:99,fontSize:12,fontWeight:ativo?700:500,cursor:'pointer',border:`1px solid ${ativo?cor:'var(--sep)'}`,background:ativo?`${cor}15`:'var(--bg-2)',color:ativo?cor:'var(--label-3)',transition:'all .1s'}}>
              {Icon&&<Icon s={12}/>} {label} <span style={{fontSize:10,fontWeight:700,padding:'0 4px',borderRadius:99,background:ativo?`${cor}25`:'var(--fill)',color:ativo?cor:'var(--label-4)',minWidth:16,textAlign:'center'}}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── VIEW: KANBAN ── */}
      {view==='kanban'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,alignItems:'start'}}>
          {KANBAN_COLS.map(col=>{
            const colPedidos=filtrados.filter(p=>getSitId(p)===col.sitId)
            const colTotal=colPedidos.reduce((s,p)=>s+Number(p.total||0),0)
            const Icon=col.icon
            return(
              <div key={col.sitId} style={{background:'var(--bg-2)',border:`1px solid ${col.cor}30`,borderRadius:12,overflow:'hidden'}}>
                <div style={{padding:'12px 14px',borderBottom:'1px solid var(--sep)',background:`${col.cor}08`}}>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                    <Icon size={13} style={{color:col.cor}}/> 
                    <span style={{fontSize:12.5,fontWeight:700,color:col.cor}}>{col.label}</span>
                    <span style={{marginLeft:'auto',fontSize:12,fontWeight:800,background:`${col.cor}20`,color:col.cor,padding:'1px 7px',borderRadius:99}}>{colPedidos.length}</span>
                  </div>
                  <div style={{fontSize:11,color:'var(--label-4)'}}>{col.sub}</div>
                  {colTotal>0&&<div style={{fontSize:12,fontWeight:700,color:col.cor,marginTop:4}}>R$ {Number(colTotal).toFixed(2).replace('.',',')}</div>}
                </div>
                <div style={{padding:'8px',display:'flex',flexDirection:'column',gap:6,maxHeight:600,overflowY:'auto'}}>
                  {colPedidos.slice(0,20).map((p,i)=>(
                    <button key={i} onClick={()=>setSel(p)} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'8px 10px',borderRadius:9,background:'var(--bg)',border:'1px solid var(--sep)',cursor:'pointer',textAlign:'left',transition:'all .1s',width:'100%'}} 
                      onMouseEnter={e=>e.currentTarget.style.border=`1px solid ${col.cor}50`}
                      onMouseLeave={e=>e.currentTarget.style.border='1px solid var(--sep)'}>
                      <Avatar nome={p.contato} size={24}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:700,color:'var(--accent)',marginBottom:1}}>#{p.numero}</div>
                        <div style={{fontSize:11,color:'var(--label-2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:120}}>{p.contato||'—'}</div>
                        <div style={{display:'flex',alignItems:'center',gap:4,marginTop:3}}>
                          <CanalPill origem={getOrigem(p)}/>
                        </div>
                      </div>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--label)',whiteSpace:'nowrap'}}>{R(p.total)}</div>
                    </button>
                  ))}
                  {colPedidos.length===0&&<div style={{padding:'20px',textAlign:'center',color:'var(--label-4)',fontSize:11}}>Nenhum pedido</div>}
                  {colPedidos.length>20&&<div style={{padding:'8px',textAlign:'center',color:'var(--label-4)',fontSize:11}}>+{colPedidos.length-20} mais</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── VIEW: TABELA ── */}
      {view==='tabela'&&(
        <div style={{background:'var(--bg-2)',border:'1px solid var(--sep)',borderRadius:14,overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'var(--fill)'}}>
                  {[['numero','Nº',true,70],['contato','Cliente',true,200],['total','Total',true,110],['situacao','Status',false,120],['canal','Canal',false,130],['compra','Compra',false,90],['data','Data',true,120]].map(([k,lb,sort,w])=>(
                    <th key={k} onClick={sort?()=>toggleSort(k):undefined} style={{textAlign:'left',padding:'10px 14px',fontSize:10,fontWeight:700,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em',borderBottom:'1px solid var(--sep)',whiteSpace:'nowrap',cursor:sort?'pointer':'default',userSelect:'none',minWidth:w}}>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>{lb}{sort&&<SortIco col={k}/>}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading?(
                  <tr><td colSpan={7} style={{padding:48,textAlign:'center'}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
                      <RefreshCw size={20} style={{color:'var(--accent)',animation:'spin 1s linear infinite'}}/>
                      <span style={{fontSize:12,color:'var(--label-4)'}}>Carregando pedidos...</span>
                    </div>
                  </td></tr>
                ):pageData.length===0?(
                  <tr><td colSpan={7} style={{padding:48,textAlign:'center'}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
                      <Package size={28} style={{color:'var(--label-4)',opacity:.3}}/>
                      <span style={{fontSize:12,color:'var(--label-4)'}}>Nenhum pedido</span>
                    </div>
                  </td></tr>
                ):pageData.map((p,i)=>{
                  const orig=getOrigem(p); const sid=getSitId(p)
                  const nC=pedidos.filter(x=>x.contato===p.contato&&x.numero<p.numero).length+1
                  return(
                    <tr key={i} onClick={()=>setSel(p)}
                      onMouseEnter={e=>{e.currentTarget.style.background='var(--fill)'}}
                      onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}
                      style={{borderTop:'1px solid var(--sep)',cursor:'pointer',transition:'background .08s'}}>
                      <td style={{padding:'11px 14px'}}><span style={{fontSize:13,fontWeight:800,color:'var(--accent)'}}>#{p.numero}</span></td>
                      <td style={{padding:'11px 14px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:9}}>
                          <Avatar nome={p.contato} size={28}/>
                          <span style={{fontSize:12.5,color:'var(--label-2)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:165}}>{p.contato||'—'}</span>
                        </div>
                      </td>
                      <td style={{padding:'11px 14px'}}><span style={{fontSize:13,fontWeight:700,color:'var(--label)'}}>{R(p.total)}</span></td>
                      <td style={{padding:'11px 14px'}}><StatusPill sit={sid}/></td>
                      <td style={{padding:'11px 14px'}}><CanalPill origem={orig}/></td>
                      <td style={{padding:'11px 14px'}}>
                        {nC===1?<span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:99,background:'rgba(245,158,11,.12)',color:'#f59e0b',border:'1px solid rgba(245,158,11,.25)'}}><Star size={9} style={{fill:'#f59e0b',strokeWidth:0}}/> Nova</span>
                          :<span style={{fontSize:11,color:'var(--label-4)',fontWeight:500}}>{nC}ª</span>}
                      </td>
                      <td style={{padding:'11px 14px',color:'var(--label-4)',fontSize:12,whiteSpace:'nowrap'}}>{fmtDate(p.data)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {total>0&&(
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 14px',borderTop:'1px solid var(--sep)',fontSize:12,color:'var(--label-4)'}}>
              <span style={{fontWeight:500}}>{total===0?'Nenhum':`${inicio+1}–${Math.min(inicio+POR_PAG,total)} de ${total}`} pedidos</span>
              {totalPgs>1&&(
                <div style={{display:'flex',gap:4,alignItems:'center'}}>
                  <button onClick={()=>setPagina(1)} disabled={pagina===1} style={{padding:'4px 9px',borderRadius:6,border:'1px solid var(--sep)',background:'transparent',cursor:pagina===1?'default':'pointer',color:'var(--label-3)',opacity:pagina===1?.35:1,fontSize:12}}>«</button>
                  <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={pagina===1} style={{padding:'4px 9px',borderRadius:6,border:'1px solid var(--sep)',background:'transparent',cursor:pagina===1?'default':'pointer',color:'var(--label-3)',opacity:pagina===1?.35:1,fontSize:12}}>‹</button>
                  {Array.from({length:Math.min(totalPgs,7)},(_,i)=>{
                    const pg=totalPgs<=7?i+1:pagina<=4?i+1:pagina>=(totalPgs-3)?totalPgs-6+i:pagina-3+i
                    return <button key={pg} onClick={()=>setPagina(pg)} style={{width:30,height:30,borderRadius:7,border:`1px solid ${pagina===pg?'var(--accent)':'var(--sep)'}`,background:pagina===pg?'var(--accent)':'transparent',color:pagina===pg?'#000':'var(--label-3)',fontSize:12,cursor:'pointer',fontWeight:pagina===pg?700:400}}>{pg}</button>
                  })}
                  <button onClick={()=>setPagina(p=>Math.min(totalPgs,p+1))} disabled={pagina===totalPgs} style={{padding:'4px 9px',borderRadius:6,border:'1px solid var(--sep)',background:'transparent',cursor:pagina===totalPgs?'default':'pointer',color:'var(--label-3)',opacity:pagina===totalPgs?.35:1,fontSize:12}}>›</button>
                  <button onClick={()=>setPagina(totalPgs)} disabled={pagina===totalPgs} style={{padding:'4px 9px',borderRadius:6,border:'1px solid var(--sep)',background:'transparent',cursor:pagina===totalPgs?'default':'pointer',color:'var(--label-3)',opacity:pagina===totalPgs?.35:1,fontSize:12}}>»</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {sel&&<OrderSheet pedido={sel} onClose={()=>setSel(null)} api={api} todosPedidos={pedidos}/>}
    </div>
  )
}
