import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, RefreshCw, X, Package, ExternalLink, Truck, CreditCard,
  MapPin, Star, ChevronDown, ChevronUp, Calendar, SlidersHorizontal,
  MessageSquare, CheckCircle, XCircle, Clock, Copy, Check, Hash,
  ArrowUpDown, Phone, Mail, Tag, TrendingUp, TrendingDown, Minus,
  DollarSign, ShoppingCart, Users, Activity, BarChart3, Banknote,
  Package2, Wallet, Receipt, Layers, Zap, FileText, Navigation,
  ChevronRight, Circle, AlertTriangle, Send, Eye, Printer, Home
} from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

// ── Mapeamento CORRIGIDO (debug 25/05/2026 + feedback do usuário) ─────────────
const LOJA_CANAL = {
  205946980: 'shopee',
  203414926: 'mercadolivre',
  204884434: 'nuvemshop',
  205916963: 'tiktokshop',
  205693668: 'nuvemshop',  // segunda loja nuvemshop
  0:         'loja',
}

// ── SVGs grandes, legíveis, com identidade visual real ───────────────────────
const ORIGENS = {
  shopee: {
    label: 'Shopee', cor: '#EE4D2D',
    icon: ({ s = 16 }) => (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <rect width="32" height="32" rx="8" fill="#EE4D2D"/>
        <path d="M16 6c-2.76 0-5 2.24-5 5h10c0-2.76-2.24-5-5-5z" fill="rgba(255,255,255,.5)"/>
        <rect x="6" y="12" width="20" height="14" rx="3" fill="rgba(255,255,255,.15)"/>
        <text x="16" y="23" textAnchor="middle" fontSize="9" fontWeight="900" fill="white" fontFamily="Arial,sans-serif">SHOPEE</text>
      </svg>
    ),
  },
  mercadolivre: {
    label: 'Mercado Livre', cor: '#FFF159',
    icon: ({ s = 16 }) => (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <rect width="32" height="32" rx="8" fill="#FFF159"/>
        <ellipse cx="16" cy="13" rx="8" ry="5" fill="#F59E0B"/>
        <text x="16" y="25" textAnchor="middle" fontSize="5.5" fontWeight="900" fill="#1a1a1a" fontFamily="Arial,sans-serif">MERCADO LIVRE</text>
      </svg>
    ),
  },
  nuvemshop: {
    label: 'Nuvemshop', cor: '#1B96FF',
    icon: ({ s = 16 }) => (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <rect width="32" height="32" rx="8" fill="#1B96FF"/>
        <path d="M8 22a6 6 0 010-12 6 6 0 0111-2 5 5 0 010 14H8z" fill="white" opacity=".95"/>
      </svg>
    ),
  },
  tiktokshop: {
    label: 'TikTok Shop', cor: '#69C9D0',
    icon: ({ s = 16 }) => (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <rect width="32" height="32" rx="8" fill="#010101"/>
        <path d="M19 7.5c1 1.3 2.7 2.1 4.3 2.1v3c-1.5 0-2.9-.5-4-1.3v6.2a5.5 5.5 0 11-5.5-5.5h.5v3.2h-.5a2.3 2.3 0 100 4.5 2.3 2.3 0 002.4-2.4V7.5H19z" fill="#69C9D0"/>
        <path d="M19 7.5c1 1.3 2.7 2.1 4.3 2.1v3c-1.5 0-2.9-.5-4-1.3v6.2a5.5 5.5 0 11-5.5-5.5h.5v3.2h-.5a2.3 2.3 0 100 4.5 2.3 2.3 0 002.4-2.4V7.5H19z" fill="white" opacity=".3"/>
      </svg>
    ),
  },
  loja: {
    label: 'Loja Própria', cor: '#10b981',
    icon: ({ s = 16 }) => (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <rect width="32" height="32" rx="8" fill="#10b981"/>
        <path d="M5 13l11-9 11 9v14a2 2 0 01-2 2H7a2 2 0 01-2-2V13z" fill="none" stroke="white" strokeWidth="2"/>
        <path d="M12 27V18h8v9" stroke="white" strokeWidth="2"/>
      </svg>
    ),
  },
  bling: {
    label: 'Bling/Manual', cor: '#1D9E75',
    icon: ({ s = 16 }) => (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <rect width="32" height="32" rx="8" fill="#1D9E75"/>
        <text x="16" y="22" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="Arial,sans-serif">B</text>
      </svg>
    ),
  },
}

// Situações reais
const SIT = {
  6:  { label:'Em Aberto',  cor:'#f59e0b', bg:'rgba(245,158,11,.12)',  bdr:'rgba(245,158,11,.3)'  },
  9:  { label:'Atendido',   cor:'#4a9fff', bg:'rgba(74,159,255,.12)',  bdr:'rgba(74,159,255,.3)'  },
  12: { label:'Cancelado',  cor:'#ef4444', bg:'rgba(239,68,68,.12)',   bdr:'rgba(239,68,68,.3)'   },
  15: { label:'Verificado', cor:'#22c55e', bg:'rgba(34,197,94,.12)',   bdr:'rgba(34,197,94,.3)'   },
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const R   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmt = n => Number(n||0).toLocaleString('pt-BR')
const fmtD  = d => { if (!d) return '—'; const s=d.length===10?d+'T12:00:00':d; return new Date(s).toLocaleDateString('pt-BR') }
const fmtDT = d => d ? new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'

function getOrigem(p) {
  const lid = p.lojaId ?? p.loja?.id ?? 0
  return LOJA_CANAL[lid] ?? (p.canal || 'bling')
}
function getSitId(p) {
  return typeof p.situacao === 'object'
    ? p.situacao?.id ?? p.situacao?.valor
    : p.situacaoId ?? p.situacao
}

// ── Atoms ──────────────────────────────────────────────────────────────────────
function StatusBadge({ sitId }) {
  const s = SIT[sitId] || { label: String(sitId ?? '—'), cor: '#888', bg: 'var(--fill)', bdr: 'var(--sep)' }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, fontWeight:700, padding:'3px 10px', borderRadius:99, background:s.bg, color:s.cor, border:`1px solid ${s.bdr}`, whiteSpace:'nowrap' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.cor, display:'inline-block', flexShrink:0 }}/>
      {s.label}
    </span>
  )
}

function CanalBadge({ origem, size = 14 }) {
  const o = ORIGENS[origem] || ORIGENS.bling
  const Icon = o.icon
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, padding:'4px 10px', borderRadius:8, background:`${o.cor}15`, color:o.cor, border:`1px solid ${o.cor}30`, whiteSpace:'nowrap', lineHeight:1 }}>
      <Icon s={size} /> {o.label}
    </span>
  )
}

function Avatar({ nome, size = 32 }) {
  const init = (nome || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const pal = ['#7c6af7','#00d4aa','#f59e0b','#22c55e','#4a9fff','#e879f9','#fb923c']
  const c = pal[(nome || '?').charCodeAt(0) % pal.length]
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:`${c}20`, border:`1.5px solid ${c}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size * .35, fontWeight:800, color:c, flexShrink:0, letterSpacing:'.02em' }}>
      {init}
    </div>
  )
}

// ── DateRange picker ──────────────────────────────────────────────────────────
function DateRange({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  const preset = days => {
    const to = new Date().toISOString().split('T')[0]
    const from = days === 0 ? to : new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
    onChange({ from, to }); setOpen(false)
  }
  const lbl = value.from && value.to
    ? `${fmtD(value.from)} — ${fmtD(value.to)}`
    : value.from ? `De ${fmtD(value.from)}` : 'Período'
  const has = value.from || value.to
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={() => setOpen(v => !v)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:9, border:`1px solid ${has ? 'var(--accent)' : 'var(--sep)'}`, background:has ? 'var(--accent-dim)' : 'var(--bg-2)', color:has ? 'var(--accent)' : 'var(--label-3)', fontSize:12.5, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap', transition:'all .15s' }}>
        <Calendar size={13} />{lbl}
        {has && <button onClick={e => { e.stopPropagation(); onChange({ from:'', to:'' }) }} style={{ border:'none', background:'transparent', color:'inherit', cursor:'pointer', display:'flex', padding:0, marginLeft:2 }}><X size={11} /></button>}
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:300, background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, padding:18, boxShadow:'0 16px 48px rgba(0,0,0,.35)', minWidth:320 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:14 }}>
            {[['Hoje', 0], ['7d', 7], ['30d', 30], ['90d', 90]].map(([lb, d]) => (
              <button key={lb} onClick={() => preset(d)} style={{ padding:'6px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', fontSize:12, cursor:'pointer', fontWeight:500, transition:'all .1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-dim)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--fill)'}>
                {lb}
              </button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[['De', 'from'], ['Até', 'to']].map(([lb, k]) => (
              <div key={k}>
                <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:6 }}>{lb}</label>
                <input type="date" value={value[k] || ''} onChange={e => onChange({ ...value, [k]: e.target.value })}
                  style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--bg)', color:'var(--label)', fontSize:12.5, outline:'none', boxSizing:'border-box' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Progress Steps ─────────────────────────────────────────────────────────────
function ProgressSteps({ sitId, dataPedido, dataSaida, dataPrevista }) {
  const steps = [
    {
      key: 'criado', label: 'Pedido criado', sub: fmtD(dataPedido),
      done: true, cor: '#7c6af7',
    },
    {
      key: 'confirmado', label: 'Confirmado', sub: 'Pagamento aprovado',
      done: [9, 15].includes(sitId), cor: '#4a9fff',
    },
    {
      key: 'separacao', label: 'Em separação', sub: 'Preparando para envio',
      done: [9, 15].includes(sitId), cor: '#f59e0b',
    },
    {
      key: 'enviado', label: 'Enviado', sub: dataSaida ? `Saiu em ${fmtD(dataSaida)}` : (dataPrevista ? `Prev. ${fmtD(dataPrevista)}` : 'Aguardando postagem'),
      done: [9, 15].includes(sitId) && !!dataSaida, cor: '#00d4aa',
    },
    {
      key: 'entregue', label: 'Entregue', sub: 'Confirmado pelo destinatário',
      done: sitId === 15, cor: '#22c55e',
    },
  ]

  if (sitId === 12) return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:12, background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.2)' }}>
      <XCircle size={16} style={{ color:'#ef4444', flexShrink:0 }} />
      <div>
        <p style={{ fontSize:13, fontWeight:700, color:'#ef4444', margin:'0 0 2px' }}>Pedido cancelado</p>
        <p style={{ fontSize:11, color:'rgba(239,68,68,.7)', margin:0 }}>Este pedido foi cancelado</p>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', alignItems:'flex-start' }}>
      {steps.map((s, i) => (
        <div key={s.key} style={{ display:'flex', alignItems:'flex-start', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
            {/* Circle */}
            <div style={{
              width:32, height:32, borderRadius:'50%',
              background: s.done ? s.cor : 'var(--bg)',
              border: `2px solid ${s.done ? s.cor : 'var(--sep)'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: s.done && i === steps.filter(x => x.done).length - 1
                ? `0 0 0 5px ${s.cor}20, 0 0 0 8px ${s.cor}10` : 'none',
              transition:'all .4s',
            }}>
              {s.done
                ? <Check size={14} style={{ color:'#fff', strokeWidth:3 }} />
                : <Circle size={8} style={{ color:'var(--label-4)' }} />}
            </div>
            {/* Label abaixo */}
            <div style={{ textAlign:'center', marginTop:6, width:72 }}>
              <p style={{ fontSize:10.5, fontWeight:s.done ? 700 : 400, color:s.done ? s.cor : 'var(--label-4)', margin:'0 0 2px', lineHeight:1.2 }}>{s.label}</p>
              <p style={{ fontSize:9.5, color:'var(--label-4)', margin:0, lineHeight:1.3 }}>{s.sub}</p>
            </div>
          </div>
          {/* Connector */}
          {i < steps.length - 1 && (
            <div style={{
              flex:1, height:2, marginTop:15, marginInline:4,
              background: steps[i + 1]?.done ? `linear-gradient(90deg,${s.cor},${steps[i+1].cor})` : 'var(--sep)',
              borderRadius:99, transition:'background .4s',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Rastreio Timeline ─────────────────────────────────────────────────────────
function RastreioTimeline({ rastreio, api }) {
  const [evs, setEvs]     = useState(rastreio?.eventos || [])
  const [status, setStatus] = useState(rastreio?.status || null)
  const [loading, setLoad]  = useState(false)
  const [cp, setCp]         = useState(false)

  const codigo = rastreio?.codigo

  const buscarRastreio = useCallback(async () => {
    if (!codigo || !api) return
    setLoad(true)
    try {
      const r = await fetch(`${api}/api/dashboard/rastreio/${codigo}`)
      if (r.ok) {
        const d = await r.json()
        const res0 = d.resultados?.[0]
        if (res0) { setEvs(res0.eventos || []); setStatus(res0.status || null) }
      }
    } catch {}
    setLoad(false)
  }, [codigo, api])

  useEffect(() => {
    if (codigo && (!evs.length || !status)) buscarRastreio()
  }, [codigo])

  const copy = () => { navigator.clipboard.writeText(codigo); setCp(true); setTimeout(() => setCp(false), 2000) }

  if (!codigo) return (
    <div style={{ padding:'32px', textAlign:'center', borderRadius:12, border:'1px dashed var(--sep)', color:'var(--label-4)' }}>
      <Truck size={28} style={{ display:'block', margin:'0 auto 10px', opacity:.2 }} />
      <p style={{ fontSize:13, margin:0 }}>Sem código de rastreio ainda</p>
      <p style={{ fontSize:11, margin:'6px 0 0', opacity:.6 }}>O código aparecerá após a postagem</p>
    </div>
  )

  return (
    <div>
      {/* Código */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--sep)', marginBottom:12 }}>
        <Truck size={14} style={{ color:'var(--accent)', flexShrink:0 }} />
        <span style={{ fontSize:13.5, fontFamily:'monospace', fontWeight:700, color:'var(--accent)', flex:1, letterSpacing:'.04em' }}>{codigo}</span>
        <button onClick={copy} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:6, border:'1px solid var(--sep)', background:'transparent', color:'var(--label-4)', cursor:'pointer', fontSize:11 }}>
          {cp ? <><Check size={10} style={{ color:'#22c55e' }} /> Copiado</> : <><Copy size={10} /> Copiar</>}
        </button>
        <a href={`https://rastreamento.correios.com.br/app/index.php?objetos=${codigo}`} target="_blank" rel="noreferrer"
          style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:6, border:'1px solid rgba(74,159,255,.3)', background:'rgba(74,159,255,.08)', color:'#4a9fff', textDecoration:'none', fontSize:11, fontWeight:600 }}>
          <ExternalLink size={10} /> Correios
        </a>
        <button onClick={buscarRastreio} disabled={loading} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:6, border:'1px solid var(--sep)', background:'transparent', color:'var(--label-4)', cursor:'pointer', fontSize:11 }}>
          <RefreshCw size={10} style={{ animation: loading ? 'spin .8s linear infinite' : undefined }} />
        </button>
      </div>

      {/* Status atual */}
      {status && (
        <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(0,212,170,.08)', border:'1px solid rgba(0,212,170,.2)', marginBottom:14 }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#00d4aa', margin:0 }}>{status}</p>
        </div>
      )}

      {/* Timeline */}
      {evs.length > 0 ? (
        <div style={{ position:'relative', paddingLeft:20 }}>
          <div style={{ position:'absolute', left:7, top:8, bottom:8, width:2, background:'var(--sep)', borderRadius:99 }} />
          {evs.map((ev, i) => (
            <div key={i} style={{ position:'relative', paddingLeft:20, paddingBottom:16 }}>
              <div style={{ position:'absolute', left:-5, top:4, width:14, height:14, borderRadius:'50%', background:i === 0 ? 'var(--accent)' : 'var(--fill)', border:`2px solid ${i === 0 ? 'var(--accent)' : 'var(--sep)'}`, zIndex:1 }} />
              <div style={{ background:'var(--bg)', borderRadius:10, padding:'10px 12px', border:`1px solid ${i === 0 ? 'var(--accent)30' : 'var(--sep)'}` }}>
                <p style={{ fontSize:12.5, fontWeight:i === 0 ? 700 : 500, color:i === 0 ? 'var(--label)' : 'var(--label-3)', margin:'0 0 3px' }}>{ev.status}</p>
                {ev.detalhe && <p style={{ fontSize:11, color:'var(--label-4)', margin:'0 0 3px' }}>{ev.detalhe}</p>}
                {ev.local && <p style={{ fontSize:11, color:'var(--label-4)', margin:'0 0 3px', display:'flex', alignItems:'center', gap:4 }}><MapPin size={9} />{ev.local}</p>}
                <p style={{ fontSize:10.5, color:'var(--label-4)', margin:0, fontFamily:'monospace' }}>{ev.data ? fmtDT(ev.data) : ev.data}</p>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div style={{ padding:'20px', textAlign:'center', color:'var(--label-4)', fontSize:12, borderRadius:10, border:'1px dashed var(--sep)' }}>
          <Clock size={18} style={{ display:'block', margin:'0 auto 8px', opacity:.3 }} />
          Sem movimentações de rastreio ainda
        </div>
      )}
    </div>
  )
}

// ── Sheet completa ─────────────────────────────────────────────────────────────
function OrderSheet({ pedidoRow, onClose, api }) {
  const [data, setData]   = useState(null)
  const [loading, setLoad] = useState(true)
  const [tab, setTab]     = useState('overview')
  const [sending, setSend] = useState(false)
  const [sent, setSent]   = useState(false)
  const [cp, setCp]       = useState('')

  const origem = getOrigem(pedidoRow)
  const O      = ORIGENS[origem] || ORIGENS.bling
  const Icon   = O.icon

  useEffect(() => {
    if (!pedidoRow?.numero) return
    setLoad(true); setData(null); setTab('overview')
    fetch(`${api}/api/dashboard/pedido-completo/${pedidoRow.numero}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoad(false) })
      .catch(() => setLoad(false))
  }, [pedidoRow?.numero])

  const copy = (text, key) => { navigator.clipboard.writeText(String(text)); setCp(key); setTimeout(() => setCp(''), 2000) }

  const enviarWA = async () => {
    if (!data) return; setSend(true)
    const p = data.pedido
    const itens = (p.itens || []).map(i => `• ${i.descricao?.slice(0,50)} (${i.quantidade}x)`).join('\n')
    const msg = `✅ *Pedido #${p.numero} confirmado!*\n\nOlá, *${data.contato?.nome?.split(' ')[0] || 'cliente'}*!\n\n${itens}\n\n💰 *Total: ${R(p.total)}*\n💳 ${p.formaPagamento}\n📦 Status: *${p.situacaoLabel}*\n\n_Obrigada pela compra! 🥰 Só Strass_`
    try {
      const tel = (data.contato?.celular || data.contato?.telefone || '').replace(/\D/g, '')
      if (tel) await fetch(`${api}/api/dashboard/manual/${tel}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ mensagem:msg }) })
      setSent(true); setTimeout(() => setSent(false), 3000)
    } catch {}
    setSend(false)
  }

  const enviarRastreioWA = async () => {
    if (!data?.rastreio?.codigo) return
    const codigo = data.rastreio.codigo
    const status = data.rastreio.status || 'Em trânsito'
    const msg = `📦 *Rastreio do seu pedido #${data.pedido?.numero}*\n\n*Código:* \`${codigo}\`\n*Status:* ${status}\n\n🔗 Acompanhe em: https://rastreamento.correios.com.br/app/index.php?objetos=${codigo}\n\n_Qualquer dúvida, estamos aqui! Só Strass 🥰_`
    const tel = (data.contato?.celular || data.contato?.telefone || '').replace(/\D/g, '')
    if (!tel) return
    try {
      await fetch(`${api}/api/dashboard/manual/${tel}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ mensagem:msg }) })
      alert('Rastreio enviado no WhatsApp!')
    } catch {}
  }

  const p   = data?.pedido || {}
  const c   = data?.contato || {}
  const hist = data?.historico || {}
  const sitId = p.situacaoId || getSitId(pedidoRow)

  const TABS = [
    { id:'overview',  label:'Visão geral' },
    { id:'cliente',   label:'Cliente' },
    { id:'rastreio',  label:'Rastreio' },
    { id:'historico', label:`Histórico (${hist.total || pedidoRow.nComp || '—'})` },
    { id:'mensagens', label:'Mensagens' },
  ]

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:40, backdropFilter:'blur(4px)' }} />
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:560, zIndex:50, background:'var(--bg-2)', borderLeft:'1px solid var(--sep)', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'-32px 0 100px rgba(0,0,0,.4)' }}>

        {/* ── HEADER ── */}
        <div style={{ padding:'20px 24px 0', borderBottom:'1px solid var(--sep)', flexShrink:0 }}>
          {/* Top row */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:7 }}>
                <span style={{ fontSize:24, fontWeight:800, color:'var(--label)', letterSpacing:'-.6px' }}>#{pedidoRow.numero}</span>
                <StatusBadge sitId={sitId} />
                {hist.primeiraCompra && <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:99, background:'rgba(245,158,11,.12)', color:'#f59e0b', border:'1px solid rgba(245,158,11,.3)' }}><Star size={10} style={{ fill:'#f59e0b', strokeWidth:0 }} /> 1ª compra</span>}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
                <CanalBadge origem={origem} size={15} />
                <span style={{ fontSize:12, color:'var(--label-4)' }}>{fmtDT(pedidoRow.data)}</span>
                <button onClick={() => copy(pedidoRow.numero, 'num')} style={{ display:'flex', alignItems:'center', gap:3, padding:'2px 8px', borderRadius:6, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-4)', cursor:'pointer', fontSize:11 }}>
                  {cp === 'num' ? <Check size={9} style={{ color:'#22c55e' }} /> : <Copy size={9} />} #{pedidoRow.numero}
                </button>
              </div>
            </div>
            <button onClick={onClose} style={{ padding:8, borderRadius:10, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', display:'flex', flexShrink:0 }}><X size={14} /></button>
          </div>

          {/* KPIs rápidos — 4 colunas */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
            {[
              { l:'Valor',       v: R(pedidoRow.total),                  c:'var(--accent)' },
              { l:'Nº compra',   v: hist.nCompra ? `${hist.nCompra}ª` : '—', c:'var(--label)'  },
              { l:'Total pedidos', v: fmt(hist.total || 0),               c:'var(--label)'  },
              { l:'Gasto total', v: R(hist.gasto || 0),                  c:'var(--label-3)'},
            ].map(k => (
              <div key={k.l} style={{ padding:'9px 10px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--sep)', textAlign:'center' }}>
                <div style={{ fontSize:14, fontWeight:800, color:k.c, lineHeight:1 }}>{k.v}</div>
                <div style={{ fontSize:9.5, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.05em', marginTop:3 }}>{k.l}</div>
              </div>
            ))}
          </div>

          {/* Links rápidos */}
          <div style={{ display:'flex', gap:7, marginBottom:14, flexWrap:'wrap' }}>
            {p.linkBling && <a href={p.linkBling} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', textDecoration:'none', fontSize:11.5, fontWeight:500 }}><ExternalLink size={11} /> Pedido no Bling</a>}
            {p.notaFiscal && <a href={p.notaFiscal.linkDanfe || `https://www.bling.com.br/notas-fiscais/${p.notaFiscal.id}`} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, border:'1px solid rgba(34,197,94,.3)', background:'rgba(34,197,94,.07)', color:'#22c55e', textDecoration:'none', fontSize:11.5, fontWeight:600 }}><FileText size={11} /> NF #{p.notaFiscal.numero}</a>}
            {c.linkBling && <a href={c.linkBling} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', textDecoration:'none', fontSize:11.5, fontWeight:500 }}><Users size={11} /> Cadastro Bling</a>}
            {p.numeroLoja && <span style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-4)', fontSize:11, fontFamily:'monospace' }}><Tag size={10} /> {p.numeroLoja}</span>}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:0, overflowX:'auto', marginBottom:-1 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding:'9px 14px', fontSize:12.5, fontWeight:500, border:'none', background:'transparent', cursor:'pointer', color:tab === t.id ? 'var(--accent)' : 'var(--label-3)', borderBottom:`2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`, whiteSpace:'nowrap', flexShrink:0, transition:'color .12s' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'60px 0' }}>
              <RefreshCw size={22} style={{ color:'var(--accent)', animation:'spin 1s linear infinite' }} />
              <span style={{ fontSize:13, color:'var(--label-4)' }}>Carregando dados completos do Bling...</span>
            </div>
          ) : <>

            {/* VISÃO GERAL */}
            {tab === 'overview' && <>
              {/* Progress steps */}
              <div style={{ marginBottom:20 }}>
                <h4 style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-4)', margin:'0 0 14px' }}>Progresso</h4>
                <ProgressSteps sitId={sitId} dataPedido={pedidoRow.data || p.data} dataSaida={p.dataSaida} dataPrevista={p.dataPrevista} />
              </div>

              {/* Financeiro */}
              <div style={{ background:'var(--bg)', borderRadius:14, border:'1px solid var(--sep)', overflow:'hidden', marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:'var(--fill)', borderBottom:'1px solid var(--sep)' }}>
                  <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', display:'flex', alignItems:'center', gap:5 }}><Wallet size={12} /> Financeiro</span>
                  <span style={{ fontSize:18, fontWeight:800, color:'var(--accent)' }}>{R(pedidoRow.total)}</span>
                </div>
                {[
                  [Banknote, 'Pagamento', p.formaPagamento || '—'],
                  [Truck, 'Frete', data?.transporte?.frete > 0 ? R(data.transporte.frete) : 'Grátis'],
                  p.totalDesconto > 0 ? [Tag, 'Desconto', `- ${R(p.totalDesconto)}`] : null,
                  p.totalProdutos   ? [Package, 'Subtotal', R(p.totalProdutos)] : null,
                ].filter(Boolean).map(([Ic, lb, vl]) => (
                  <div key={lb} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid var(--sep)' }}>
                    <span style={{ fontSize:12.5, color:'var(--label-3)', display:'flex', alignItems:'center', gap:7 }}><Ic size={12} style={{ color:'var(--label-4)' }} /> {lb}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--label)' }}>{vl}</span>
                  </div>
                ))}
              </div>

              {/* Itens */}
              {p.itens?.length > 0 && (
                <div style={{ background:'var(--bg)', borderRadius:14, border:'1px solid var(--sep)', overflow:'hidden', marginBottom:14 }}>
                  <div style={{ padding:'12px 16px', background:'var(--fill)', borderBottom:'1px solid var(--sep)' }}>
                    <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', display:'flex', alignItems:'center', gap:5 }}><Package size={12} /> Itens ({p.itens.length})</span>
                  </div>
                  {p.itens.map((item, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', borderBottom:i < p.itens.length - 1 ? '1px solid var(--sep)' : 'none' }}>
                      <div style={{ width:40, height:40, borderRadius:10, background:'var(--bg-2)', border:'1px solid var(--sep)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Package2 size={16} style={{ color:'var(--label-4)' }} /></div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:'var(--label)', margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.descricao}</p>
                        <p style={{ fontSize:11, color:'var(--label-4)', margin:0, fontFamily:'monospace' }}>{item.codigo} · {item.quantidade}× · {R(item.valor)}/un</p>
                      </div>
                      <span style={{ fontSize:14, fontWeight:700, color:'var(--label)', flexShrink:0 }}>{R((item.valor || 0) * (item.quantidade || 1))}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Observações */}
              {(p.observacoes || p.observacoesInt) && (
                <div style={{ background:'var(--bg)', borderRadius:14, border:'1px solid var(--sep)', padding:'14px 16px' }}>
                  <h4 style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', margin:'0 0 8px' }}>Observações</h4>
                  {p.observacoes && <p style={{ fontSize:12.5, color:'var(--label-2)', lineHeight:1.6, margin:0 }}>{p.observacoes}</p>}
                  {p.observacoesInt && <p style={{ fontSize:12, color:'var(--label-3)', background:'var(--fill)', padding:'9px 12px', borderRadius:9, marginTop:8, lineHeight:1.5 }}>🔒 {p.observacoesInt}</p>}
                </div>
              )}
            </>}

            {/* CLIENTE */}
            {tab === 'cliente' && <>
              {/* Avatar + nome */}
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px', background:'var(--bg)', borderRadius:14, border:'1px solid var(--sep)', marginBottom:14 }}>
                <Avatar nome={c.nome || pedidoRow.contato} size={56} />
                <div>
                  <p style={{ fontSize:17, fontWeight:800, color:'var(--label)', margin:'0 0 6px' }}>{c.nome || pedidoRow.contato || '—'}</p>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {hist.primeiraCompra && <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:99, background:'rgba(245,158,11,.12)', color:'#f59e0b', border:'1px solid rgba(245,158,11,.3)' }}>⭐ 1ª compra</span>}
                    {c.id && <span style={{ fontSize:11, color:'var(--label-4)' }}>ID: {c.id}</span>}
                  </div>
                </div>
              </div>

              {/* Dados de contato */}
              <div style={{ background:'var(--bg)', borderRadius:14, border:'1px solid var(--sep)', overflow:'hidden', marginBottom:14 }}>
                <div style={{ padding:'11px 16px', background:'var(--fill)', borderBottom:'1px solid var(--sep)' }}>
                  <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)' }}>Dados de contato</span>
                </div>
                {[
                  [Phone, 'Celular',   c.celular || c.telefone,        'tel'],
                  [Mail,  'Email',     c.email,                        'email'],
                  [Hash,  'CPF/CNPJ',  c.cpfCnpj || c.numeroDocumento, 'doc'],
                  [Tag,   'Nascimento',c.nascimento ? fmtD(c.nascimento) : null, 'nasc'],
                ].filter(([, , v]) => v).map(([Ic, lb, vl, k], i, arr) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 16px', borderBottom:i < arr.length - 1 ? '1px solid var(--sep)' : 'none' }}>
                    <span style={{ fontSize:12.5, color:'var(--label-3)', display:'flex', alignItems:'center', gap:8 }}><Ic size={13} style={{ color:'var(--label-4)' }} /> {lb}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:12.5, fontWeight:500, color:'var(--label)', fontFamily:['tel','doc'].includes(k) ? 'monospace' : 'inherit' }}>{vl}</span>
                      <button onClick={() => copy(vl, k)} style={{ padding:'2px 6px', borderRadius:5, border:'1px solid var(--sep)', background:'transparent', color:'var(--label-4)', cursor:'pointer', fontSize:10, display:'flex' }}>
                        {cp === k ? <Check size={9} style={{ color:'#22c55e' }} /> : <Copy size={9} />}
                      </button>
                    </div>
                  </div>
                ))}
                {!c.celular && !c.email && <div style={{ padding:'20px', textAlign:'center', color:'var(--label-4)', fontSize:12 }}>Dados de contato não disponíveis</div>}
              </div>

              {/* Endereço */}
              {(data?.transporte?.etiqueta?.logradouro || c.enderecos?.[0]) && (() => {
                const e  = data?.transporte?.etiqueta || {}
                const ec = c.enderecos?.[0] || {}
                return (
                  <div style={{ background:'var(--bg)', borderRadius:14, border:'1px solid var(--sep)', padding:'14px 16px', marginBottom:14 }}>
                    <h4 style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', margin:'0 0 10px', display:'flex', alignItems:'center', gap:5 }}><MapPin size={11} /> Endereço de entrega</h4>
                    <div style={{ fontSize:13.5, color:'var(--label)', lineHeight:2.1 }}>
                      <div style={{ fontWeight:600 }}>{e.logradouro || ec.endereco || '—'}, {e.numero || ec.numero || ''} {(e.complemento || ec.complemento) ? `— ${e.complemento || ec.complemento}` : ''}</div>
                      <div style={{ color:'var(--label-3)' }}>{e.bairro || ec.bairro || ''}</div>
                      <div style={{ color:'var(--label-3)' }}>{e.municipio || ec.municipio || ''}{(e.uf || ec.uf) ? `/${e.uf || ec.uf}` : ''}</div>
                      {(e.cep || ec.cep) && <div style={{ fontFamily:'monospace', color:'var(--accent)', fontSize:12 }}>CEP {(e.cep || ec.cep).replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')}</div>}
                    </div>
                  </div>
                )
              })()}

              {/* Stats do cliente */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
                {[
                  { lb:'Total pedidos',  v:fmt(hist.total || 0),        c:'var(--accent)' },
                  { lb:'Gasto total',    v:R(hist.gasto || 0),          c:'var(--label)'  },
                  { lb:'Ticket médio',   v:hist.total > 0 ? R((hist.gasto || 0) / hist.total) : '—', c:'var(--label-3)' },
                  { lb:'Nº da compra',   v:`${hist.nCompra || '—'}ª`,   c:hist.primeiraCompra ? '#f59e0b' : 'var(--label-3)' },
                ].map(k => (
                  <div key={k.lb} style={{ padding:'14px', borderRadius:12, background:'var(--bg)', border:'1px solid var(--sep)', textAlign:'center' }}>
                    <div style={{ fontSize:20, fontWeight:800, color:k.c, lineHeight:1, marginBottom:4 }}>{k.v}</div>
                    <div style={{ fontSize:10.5, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.05em' }}>{k.lb}</div>
                  </div>
                ))}
              </div>
            </>}

            {/* RASTREIO */}
            {tab === 'rastreio' && (
              <div>
                {/* Botão enviar rastreio no WA */}
                {data?.rastreio?.codigo && (
                  <button onClick={enviarRastreioWA} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'11px 16px', borderRadius:11, border:'1px solid rgba(37,211,102,.3)', background:'rgba(37,211,102,.07)', color:'#25D366', cursor:'pointer', fontSize:13, fontWeight:600, marginBottom:14 }}>
                    <MessageSquare size={15} /> Enviar atualização de rastreio no WhatsApp
                    {data.rastreio.msgEnviada && <span style={{ marginLeft:'auto', fontSize:11, color:'rgba(37,211,102,.7)' }}>✓ Já enviado {data.rastreio.qtdMsgRastreio}x</span>}
                  </button>
                )}
                <RastreioTimeline rastreio={data?.rastreio} api={api} />
              </div>
            )}

            {/* HISTÓRICO */}
            {tab === 'historico' && (
              hist.pedidos?.length > 0 ? (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <span style={{ fontSize:13, color:'var(--label-3)', fontWeight:500 }}>{hist.total} pedido{hist.total !== 1 ? 's' : ''} anteriores</span>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--accent)' }}>{R(hist.gasto)}</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                    {[...hist.pedidos].sort((a, b) => b.numero - a.numero).map((hp, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12, background:'var(--bg)', border:'1px solid var(--sep)' }}>
                        <div style={{ width:42, height:42, borderRadius:10, background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ fontSize:12, fontWeight:800, color:'var(--accent)' }}>#{hp.numero}</span>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                            <StatusBadge sitId={hp.situacaoId} />
                            <CanalBadge origem={hp.canal} size={12} />
                          </div>
                          <div style={{ fontSize:11.5, color:'var(--label-4)' }}>{fmtD(hp.data)}</div>
                        </div>
                        <span style={{ fontSize:15, fontWeight:800, color:'var(--label)', flexShrink:0 }}>{R(hp.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding:'48px', textAlign:'center', borderRadius:14, border:'1px dashed var(--sep)' }}>
                  <Star size={32} style={{ display:'block', margin:'0 auto 14px', color:'#f59e0b', opacity:.4 }} />
                  <p style={{ fontSize:14, fontWeight:700, color:'var(--label)', margin:'0 0 6px' }}>Primeira compra!</p>
                  <p style={{ fontSize:12, color:'var(--label-4)', margin:0 }}>Nenhum pedido anterior deste cliente</p>
                </div>
              )
            )}

            {/* MENSAGENS */}
            {tab === 'mensagens' && (
              data?.mensagens?.lista?.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  {data.mensagens.lista.slice(0, 40).map((m, i) => (
                    <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:m.direcao === 'entrada' ? 'var(--fill)' : 'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                        {m.direcao === 'entrada' ? <Users size={13} style={{ color:'var(--label-4)' }} /> : <Zap size={13} style={{ color:'var(--accent)' }} />}
                      </div>
                      <div style={{ flex:1, background:'var(--bg)', borderRadius:12, padding:'10px 13px', border:`1px solid ${m.direcao === 'entrada' ? 'var(--sep)' : 'var(--accent)30'}` }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                          <span style={{ fontSize:11, fontWeight:700, color:m.direcao === 'entrada' ? 'var(--label-3)' : 'var(--accent)' }}>{m.direcao === 'entrada' ? 'Cliente' : 'Bia IA'}</span>
                          <span style={{ fontSize:10.5, color:'var(--label-4)', fontFamily:'monospace' }}>{fmtDT(m.criado_em)}</span>
                        </div>
                        <p style={{ fontSize:12.5, color:'var(--label-2)', margin:0, lineHeight:1.5, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{(m.conteudo || '').slice(0, 500)}{(m.conteudo?.length || 0) > 500 ? '...' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding:'48px', textAlign:'center', borderRadius:14, border:'1px dashed var(--sep)', color:'var(--label-4)' }}>
                  <MessageSquare size={32} style={{ display:'block', margin:'0 auto 14px', opacity:.2 }} />
                  <p style={{ fontSize:13, margin:0 }}>Sem histórico de mensagens</p>
                </div>
              )
            )}

          </>}
        </div>

        {/* ── FOOTER AÇÕES ── */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid var(--sep)', display:'flex', gap:8, flexShrink:0, background:'var(--bg-2)' }}>
          <button onClick={enviarWA} disabled={sending || !data} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'10px', borderRadius:11, border:`1px solid ${sent ? 'rgba(34,197,94,.3)' : 'rgba(37,211,102,.3)'}`, background:sent ? 'rgba(34,197,94,.1)' : 'rgba(37,211,102,.08)', color:sent ? '#22c55e' : '#25D366', cursor:data ? 'pointer' : 'not-allowed', fontSize:13, fontWeight:700, opacity:!data ? .4 : 1, transition:'all .2s' }}>
            {sent ? <><CheckCircle size={15} /> Enviado!</> : sending ? <><RefreshCw size={14} style={{ animation:'spin 1s linear infinite' }} /> Enviando...</> : <><MessageSquare size={15} /> Enviar no WhatsApp</>}
          </button>
          {data?.rastreio?.codigo && (
            <a href={`https://rastreamento.correios.com.br/app/index.php?objetos=${data.rastreio.codigo}`} target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 14px', borderRadius:11, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', fontSize:13, textDecoration:'none', fontWeight:600, whiteSpace:'nowrap' }}>
              <Truck size={14} /> Rastrear
            </a>
          )}
          {p.linkBling && (
            <a href={p.linkBling} target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 14px', borderRadius:11, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', fontSize:13, textDecoration:'none', fontWeight:600, whiteSpace:'nowrap' }}>
              <ExternalLink size={14} /> Bling
            </a>
          )}
        </div>
      </div>
    </>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPI({ icon: Ic, label, value, sub, cor, trend }) {
  return (
    <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, padding:'16px 18px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:`${cor}18`, display:'flex', alignItems:'center', justifyContent:'center' }}><Ic size={16} style={{ color:cor }} /></div>
        {trend !== undefined && <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:11.5, fontWeight:700, padding:'2px 9px', borderRadius:99, background:trend > 0 ? 'rgba(34,197,94,.1)' : trend < 0 ? 'rgba(239,68,68,.1)' : 'var(--fill)', color:trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : 'var(--label-4)' }}>
          {trend > 0 ? <TrendingUp size={11} /> : trend < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}{Math.abs(trend)}%
        </div>}
      </div>
      <div style={{ fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color:cor, letterSpacing:'-.5px', lineHeight:1, marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:11.5, color:'var(--label-4)' }}>{sub}</div>}
    </div>
  )
}

// ── Página Principal ──────────────────────────────────────────────────────────
export default function PagePedidos({ api }) {
  const [pedidos,     setPedidos]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [paginaAPI,   setPaginaAPI]   = useState(1)
  const [temMais,     setTemMais]     = useState(true)
  const [busca,       setBusca]       = useState('')
  const [filtroSit,   setFiltroSit]   = useState('0')
  const [filtroLoja,  setFiltroLoja]  = useState('todos')
  const [dateRange,   setDateRange]   = useState({ from:'', to:'' })
  const [sortCol,     setSortCol]     = useState('numero')
  const [sortDir,     setSortDir]     = useState('desc')
  const [paginaUI,    setPaginaUI]    = useState(1)
  const [sel,         setSel]         = useState(null)
  const [view,        setView]        = useState('tabela')
  const [showFilters, setShowFilters] = useState(false)
  const POR_PAG = 20

  const SITS = { 0:'Todos', 6:'Em Aberto', 9:'Atendido', 12:'Cancelado', 15:'Verificado' }

  const carregar = useCallback(async (pg = 1, acumular = false) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true)
    try {
      let url = `${api}/api/dashboard/pedidos?limite=100&pagina=${pg}`
      if (filtroSit !== '0') url += `&situacao=${filtroSit}`
      if (dateRange.from) url += `&dataInicio=${dateRange.from}`
      if (dateRange.to)   url += `&dataFim=${dateRange.to}`
      const r = await fetch(url)
      if (r.ok) {
        const d = await r.json()
        const novos = d.pedidos || []
        setPedidos(prev => acumular ? [...prev, ...novos] : novos)
        setTemMais(novos.length >= 100)
        setPaginaAPI(pg)
      }
    } catch {}
    if (pg === 1) setLoading(false); else setLoadingMore(false)
  }, [api, filtroSit, dateRange])

  useEffect(() => { carregar(1, false); setPaginaUI(1) }, [carregar])

  const carregarMais = () => { if (!loadingMore && temMais) carregar(paginaAPI + 1, true) }

  const filtrados = pedidos.filter(p => {
    const orig = getOrigem(p)
    return (filtroLoja === 'todos' || orig === filtroLoja || (filtroLoja === 'nuvemshop' && ['nuvemshop','nuvemshop2'].includes(orig)))
      && (!busca || String(p.numero).includes(busca) || (p.contato || '').toLowerCase().includes(busca.toLowerCase()))
  }).sort((a, b) => {
    let va = a[sortCol], vb = b[sortCol]
    if (['total','numero'].includes(sortCol)) { va = Number(va); vb = Number(vb) }
    if (sortCol === 'data') { va = new Date(va); vb = new Date(vb) }
    return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
  })

  const total    = filtrados.length
  const inicio   = (paginaUI - 1) * POR_PAG
  const pageData = filtrados.slice(inicio, inicio + POR_PAG)
  const totalPgs = Math.ceil(total / POR_PAG)

  const toggleSort = col => { setSortCol(col); setSortDir(d => sortCol === col ? (d === 'asc' ? 'desc' : 'asc') : 'desc') }
  const SortIco = ({ col }) => sortCol === col ? (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={9} style={{ opacity:.25 }} />

  const totalVal   = filtrados.reduce((s, p) => s + Number(p.total || 0), 0)
  const countSit   = pedidos.reduce((a, p) => { const s = getSitId(p); a[s] = (a[s] || 0) + 1; return a }, {})
  const countLoja  = pedidos.reduce((a, p) => { const o = getOrigem(p); const k = o === 'nuvemshop2' ? 'nuvemshop' : o; a[k] = (a[k] || 0) + 1; return a }, {})
  const novos      = pedidos.filter(p => pedidos.filter(x => x.contato === p.contato && x.numero < p.numero).length === 0).length
  const verificados = countSit[15] || 0
  const spark = Array.from({ length:7 }, (_, i) => {
    const dia = new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0]
    return { dia: dia.slice(5), v: pedidos.filter(p => (p.data || '').startsWith(dia)).reduce((s, p) => s + Number(p.total || 0), 0) }
  })

  const temFiltros = busca || filtroLoja !== 'todos' || dateRange.from || dateRange.to
  const limpar = () => { setBusca(''); setFiltroLoja('todos'); setDateRange({ from:'', to:'' }); setPaginaUI(1) }

  const KANBAN_COLS = [
    { sitId:6,  label:'Em Aberto',  cor:SIT[6].cor,  Icon:Clock         },
    { sitId:9,  label:'Atendido',   cor:SIT[9].cor,  Icon:Truck         },
    { sitId:15, label:'Verificado', cor:SIT[15].cor, Icon:CheckCircle   },
    { sitId:12, label:'Cancelado',  cor:SIT[12].cor, Icon:XCircle       },
  ]

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'var(--bg)', padding:'24px 28px' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'var(--label)', margin:0, letterSpacing:'-.5px' }}>Pedidos</h1>
          <p style={{ fontSize:12.5, color:'var(--label-4)', margin:'4px 0 0' }}>
            {loading ? 'Carregando...' : `${fmt(total)} resultado${total !== 1 ? 's' : ''} · ${fmt(pedidos.length)} carregados`}
            {temMais && !loading && <button onClick={carregarMais} disabled={loadingMore} style={{ marginLeft:8, fontSize:12, color:'var(--accent)', border:'none', background:'transparent', cursor:'pointer', fontWeight:600 }}>{loadingMore ? 'Carregando...' : '+ Carregar mais'}</button>}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ display:'flex', borderRadius:10, border:'1px solid var(--sep)', overflow:'hidden' }}>
            {[['tabela','Tabela'], ['kanban','Kanban']].map(([v, lb]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding:'7px 16px', border:'none', background:view === v ? 'var(--accent-dim)' : 'transparent', color:view === v ? 'var(--accent)' : 'var(--label-3)', cursor:'pointer', fontSize:12.5, fontWeight:view === v ? 700 : 400 }}>{lb}</button>
            ))}
          </div>
          <button onClick={() => setShowFilters(v => !v)} style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:10, border:'1px solid var(--sep)', background:temFiltros || showFilters ? 'var(--accent-dim)' : 'var(--bg-2)', color:temFiltros || showFilters ? 'var(--accent)' : 'var(--label-3)', cursor:'pointer', fontSize:12.5, fontWeight:500 }}>
            <SlidersHorizontal size={14} /> Filtros {temFiltros && <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)', flexShrink:0 }} />}
          </button>
          <button onClick={() => carregar(1, false)} style={{ width:38, height:38, borderRadius:10, border:'1px solid var(--sep)', background:'var(--bg-2)', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <RefreshCw size={15} style={{ animation:loading ? 'spin 1s linear infinite' : undefined }} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:18 }}>
        <KPI icon={ShoppingCart} label="Total pedidos"   value={fmt(pedidos.length)}   cor="#7c6af7"  sub={`${fmt(total)} filtrados`} />
        <KPI icon={DollarSign}   label="Valor filtrado"  value={`R$ ${Number(totalVal).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}`} cor="#00d4aa" />
        <KPI icon={Clock}        label="Em aberto"       value={fmt(countSit[6] || 0)} cor="#f59e0b"  sub="aguardando processamento" />
        <KPI icon={Users}        label="Novas compras"   value={fmt(novos)}             cor="#e879f9"  sub={`${Math.round(novos / Math.max(pedidos.length, 1) * 100)}% do total`} />
        <KPI icon={CheckCircle}  label="Taxa entregues"  value={`${Math.round(verificados / Math.max(pedidos.length, 1) * 100)}%`} cor="#22c55e" sub={`${fmt(verificados)} pedidos`} />
      </div>

      {/* Sparkline */}
      {spark.some(s => s.v > 0) && (
        <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, padding:'14px 18px', marginBottom:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)' }}>Receita — últimos 7 dias</span>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--accent)' }}>R$ {Number(spark.reduce((s, d) => s + d.v, 0)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</span>
          </div>
          <ResponsiveContainer width="100%" height={52}>
            <AreaChart data={spark}>
              <defs><linearGradient id="gsp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4aa" stopOpacity={.35} /><stop offset="95%" stopColor="#00d4aa" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="dia" tick={{ fontSize:10, fill:'var(--label-4)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:9, fontSize:12 }} formatter={v => [`R$ ${Number(v).toFixed(0)}`, '']} />
              <Area type="monotone" dataKey="v" stroke="#00d4aa" strokeWidth={2.5} fill="url(#gsp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* FILTROS */}
      {showFilters && (
        <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, padding:'16px 18px', marginBottom:16, display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div style={{ flex:2, minWidth:220 }}>
            <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:6 }}>Buscar pedido ou cliente</label>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, border:'1px solid var(--sep)', background:'var(--bg)' }}>
              <Search size={13} style={{ color:'var(--label-4)', flexShrink:0 }} />
              <input value={busca} onChange={e => { setBusca(e.target.value); setPaginaUI(1) }} placeholder="Número do pedido ou nome do cliente..." style={{ border:'none', background:'transparent', outline:'none', fontSize:13, color:'var(--label)', width:'100%' }} />
              {busca && <button onClick={() => setBusca('')} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--label-4)', display:'flex' }}><X size={12} /></button>}
            </div>
          </div>
          <div style={{ flex:1, minWidth:150 }}>
            <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:6 }}>Status</label>
            <select value={filtroSit} onChange={e => { setFiltroSit(e.target.value); setPaginaUI(1) }} style={{ width:'100%', padding:'8px 11px', borderRadius:10, border:'1px solid var(--sep)', background:'var(--bg)', color:'var(--label)', fontSize:13, cursor:'pointer', outline:'none' }}>
              {Object.entries(SITS).map(([id, nm]) => <option key={id} value={id}>{nm}{countSit[id] ? ` (${countSit[id]})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:6 }}>Período</label>
            <DateRange value={dateRange} onChange={v => { setDateRange(v); setPaginaUI(1) }} />
          </div>
          {temFiltros && <button onClick={limpar} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:10, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', fontSize:12.5, alignSelf:'flex-end', whiteSpace:'nowrap' }}>
            <X size={12} /> Limpar filtros
          </button>}
        </div>
      )}

      {/* CANAL CHIPS — ícones SVG legíveis */}
      <div style={{ display:'flex', gap:7, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginRight:4 }}>Canal:</span>
        {[
          ['todos', 'Todos', pedidos.length, null],
          ...Object.entries(ORIGENS)
            .filter(([k]) => (countLoja[k] || 0) > 0)
            .map(([k, v]) => [k, v.label, countLoja[k] || 0, v]),
        ].map(([key, label, count, ori]) => {
          const ativo = filtroLoja === key
          const cor   = ori?.cor || '#888'
          const Icon  = ori?.icon
          return (
            <button key={key} onClick={() => { setFiltroLoja(ativo && key !== 'todos' ? 'todos' : key); setPaginaUI(1) }}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 14px', borderRadius:99, fontSize:12.5, fontWeight:ativo ? 700 : 500, cursor:'pointer', border:`1px solid ${ativo ? cor : 'var(--sep)'}`, background:ativo ? `${cor}18` : 'var(--bg-2)', color:ativo ? cor : 'var(--label-3)', transition:'all .1s' }}>
              {Icon && <Icon s={15} />}
              {label}
              {count > 0 && <span style={{ fontSize:11, fontWeight:700, padding:'0 5px', borderRadius:99, background:ativo ? `${cor}28` : 'var(--fill)', color:ativo ? cor : 'var(--label-4)', minWidth:18, textAlign:'center' }}>{count}</span>}
            </button>
          )
        })}
      </div>

      {/* KANBAN */}
      {view === 'kanban' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, alignItems:'start' }}>
          {KANBAN_COLS.map(col => {
            const colPeds = filtrados.filter(p => getSitId(p) === col.sitId)
            const colVal  = colPeds.reduce((s, p) => s + Number(p.total || 0), 0)
            return (
              <div key={col.sitId} style={{ background:'var(--bg-2)', border:`1px solid ${col.cor}35`, borderRadius:14, overflow:'hidden' }}>
                <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--sep)', background:`${col.cor}08` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <col.Icon size={14} style={{ color:col.cor }} />
                    <span style={{ fontSize:13, fontWeight:700, color:col.cor }}>{col.label}</span>
                    <span style={{ marginLeft:'auto', fontSize:13, fontWeight:800, background:`${col.cor}20`, color:col.cor, padding:'2px 9px', borderRadius:99 }}>{colPeds.length}</span>
                  </div>
                  {colVal > 0 && <p style={{ fontSize:12.5, fontWeight:700, color:col.cor, margin:0 }}>R$ {Number(colVal).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</p>}
                </div>
                <div style={{ padding:'10px', display:'flex', flexDirection:'column', gap:6, maxHeight:520, overflowY:'auto' }}>
                  {colPeds.slice(0, 15).map((p, i) => (
                    <button key={i} onClick={() => setSel(p)}
                      style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'9px 11px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--sep)', cursor:'pointer', textAlign:'left', width:'100%', transition:'border .1s' }}
                      onMouseEnter={e => e.currentTarget.style.border = `1px solid ${col.cor}50`}
                      onMouseLeave={e => e.currentTarget.style.border = '1px solid var(--sep)'}>
                      <Avatar nome={p.contato} size={26} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:11.5, fontWeight:700, color:'var(--accent)', margin:'0 0 2px' }}>#{p.numero}</p>
                        <p style={{ fontSize:11.5, color:'var(--label-2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:'0 0 4px' }}>{p.contato || '—'}</p>
                        <CanalBadge origem={getOrigem(p)} size={11} />
                      </div>
                      <p style={{ fontSize:12.5, fontWeight:700, color:'var(--label)', whiteSpace:'nowrap', margin:0 }}>R$ {Number(p.total || 0).toFixed(0)}</p>
                    </button>
                  ))}
                  {colPeds.length === 0 && <div style={{ padding:'24px', textAlign:'center', color:'var(--label-4)', fontSize:12 }}>Nenhum pedido</div>}
                  {colPeds.length > 15 && <div style={{ padding:'10px', textAlign:'center', color:'var(--label-4)', fontSize:12 }}>+{colPeds.length - 15} mais</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TABELA */}
      {view === 'tabela' && (
        <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--fill)' }}>
                  {[
                    ['numero',  'Nº',      true,  80],
                    ['contato', 'Cliente', true,  210],
                    ['total',   'Total',   true,  120],
                    ['sit',     'Status',  false, 130],
                    ['canal',   'Canal',   false, 155],
                    ['compra',  'Compra',  false, 95],
                    ['data',    'Data',    true,  125],
                  ].map(([k, lb, sort, w]) => (
                    <th key={k} onClick={sort ? () => toggleSort(k) : undefined}
                      style={{ textAlign:'left', padding:'11px 16px', fontSize:10.5, fontWeight:700, color:'var(--label-4)', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid var(--sep)', whiteSpace:'nowrap', cursor:sort ? 'pointer' : 'default', userSelect:'none', minWidth:w }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>{lb}{sort && <SortIco col={k} />}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding:56, textAlign:'center' }}>
                    <RefreshCw size={22} style={{ color:'var(--accent)', animation:'spin 1s linear infinite', display:'block', margin:'0 auto 12px' }} />
                    <span style={{ fontSize:13, color:'var(--label-4)' }}>Carregando pedidos do Bling...</span>
                  </td></tr>
                ) : pageData.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding:56, textAlign:'center' }}>
                    <Package size={32} style={{ display:'block', margin:'0 auto 12px', opacity:.2 }} />
                    <span style={{ fontSize:13, color:'var(--label-4)' }}>Nenhum pedido encontrado</span>
                  </td></tr>
                ) : pageData.map((p, i) => {
                  const orig = getOrigem(p)
                  const sid  = getSitId(p)
                  const nC   = pedidos.filter(x => x.contato === p.contato && x.numero < p.numero).length + 1
                  return (
                    <tr key={i} onClick={() => setSel(p)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--fill)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      style={{ borderTop:'1px solid var(--sep)', cursor:'pointer', transition:'background .08s' }}>
                      <td style={{ padding:'12px 16px' }}><span style={{ fontSize:14, fontWeight:800, color:'var(--accent)' }}>#{p.numero}</span></td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <Avatar nome={p.contato} size={30} />
                          <span style={{ fontSize:13, color:'var(--label-2)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:170 }}>{p.contato || '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding:'12px 16px' }}><span style={{ fontSize:14, fontWeight:700, color:'var(--label)' }}>R$ {Number(p.total || 0).toFixed(2).replace('.', ',')}</span></td>
                      <td style={{ padding:'12px 16px' }}><StatusBadge sitId={sid} /></td>
                      <td style={{ padding:'12px 16px' }}><CanalBadge origem={orig} /></td>
                      <td style={{ padding:'12px 16px' }}>
                        {nC === 1
                          ? <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:99, background:'rgba(245,158,11,.12)', color:'#f59e0b', border:'1px solid rgba(245,158,11,.3)' }}><Star size={9} style={{ fill:'#f59e0b', strokeWidth:0 }} /> 1ª</span>
                          : <span style={{ fontSize:12, color:'var(--label-4)', fontWeight:500 }}>{nC}ª</span>}
                      </td>
                      <td style={{ padding:'12px 16px', color:'var(--label-4)', fontSize:12.5, whiteSpace:'nowrap' }}>{fmtD(p.data)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {/* Paginação */}
          {total > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderTop:'1px solid var(--sep)', fontSize:12.5, color:'var(--label-4)' }}>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <span style={{ fontWeight:500 }}>{inicio + 1}–{Math.min(inicio + POR_PAG, total)} de {total}</span>
                {temMais && <button onClick={carregarMais} disabled={loadingMore} style={{ fontSize:12, color:'var(--accent)', border:'1px solid rgba(124,106,247,.3)', background:'rgba(124,106,247,.07)', borderRadius:8, padding:'4px 11px', cursor:'pointer', fontWeight:600 }}>
                  {loadingMore ? 'Carregando...' : '+ 100 pedidos'}
                </button>}
              </div>
              {totalPgs > 1 && (
                <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                  <button onClick={() => setPaginaUI(1)} disabled={paginaUI === 1} style={{ padding:'5px 10px', borderRadius:7, border:'1px solid var(--sep)', background:'transparent', cursor:paginaUI===1?'default':'pointer', color:'var(--label-3)', opacity:paginaUI===1?.35:1, fontSize:12 }}>«</button>
                  <button onClick={() => setPaginaUI(p => Math.max(1, p-1))} disabled={paginaUI===1} style={{ padding:'5px 10px', borderRadius:7, border:'1px solid var(--sep)', background:'transparent', cursor:paginaUI===1?'default':'pointer', color:'var(--label-3)', opacity:paginaUI===1?.35:1, fontSize:12 }}>‹</button>
                  {Array.from({ length:Math.min(totalPgs, 7) }, (_, i) => {
                    const pg = totalPgs<=7?i+1:paginaUI<=4?i+1:paginaUI>=(totalPgs-3)?totalPgs-6+i:paginaUI-3+i
                    return <button key={pg} onClick={() => setPaginaUI(pg)} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${paginaUI===pg?'var(--accent)':'var(--sep)'}`, background:paginaUI===pg?'var(--accent)':'transparent', color:paginaUI===pg?'#000':'var(--label-3)', fontSize:12.5, cursor:'pointer', fontWeight:paginaUI===pg?700:400 }}>{pg}</button>
                  })}
                  <button onClick={() => setPaginaUI(p => Math.min(totalPgs, p+1))} disabled={paginaUI===totalPgs} style={{ padding:'5px 10px', borderRadius:7, border:'1px solid var(--sep)', background:'transparent', cursor:paginaUI===totalPgs?'default':'pointer', color:'var(--label-3)', opacity:paginaUI===totalPgs?.35:1, fontSize:12 }}>›</button>
                  <button onClick={() => setPaginaUI(totalPgs)} disabled={paginaUI===totalPgs} style={{ padding:'5px 10px', borderRadius:7, border:'1px solid var(--sep)', background:'transparent', cursor:paginaUI===totalPgs?'default':'pointer', color:'var(--label-3)', opacity:paginaUI===totalPgs?.35:1, fontSize:12 }}>»</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {sel && <OrderSheet pedidoRow={sel} onClose={() => setSel(null)} api={api} />}
    </div>
  )
}
