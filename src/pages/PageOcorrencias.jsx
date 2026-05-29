import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, RefreshCw, Plus, X, ChevronDown, ChevronUp,
  Truck, CreditCard, Package, RotateCcw, MessageSquare,
  AlertCircle, Clock, CheckCircle, User, Send, FileText, Navigation,
  AlertTriangle, Tag, Phone, Mail, ArrowUpRight, Zap,
  ChevronRight, ShieldAlert, Circle, XCircle, Paperclip,
  Sparkles, History, MapPin, Star, Copy, Check, RefreshCcw
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Design Tokens — sistema escuro adaptativo ─────────────────────────────────
// Todas as cores são CSS custom properties definidas inline via style={{}}
// Funciona sobre qualquer tema (dark/light) sem Tailwind hardcoded

const T = {
  bg0:'#0f1117', bg1:'#161b27', bg2:'#1c2333', bg3:'#232d3f', bg4:'#2a3549',
  ink1:'#f1f5f9', ink2:'#cbd5e1', ink3:'#8892a4', ink4:'#4e5a6e',
  sep:'rgba(255,255,255,0.06)', sep2:'rgba(255,255,255,0.09)',

  amber:'#f59e0b',  amberDim:'rgba(245,158,11,0.10)',  amberBor:'rgba(245,158,11,0.22)',
  blue:'#3b82f6',   blueDim:'rgba(59,130,246,0.10)',   blueBor:'rgba(59,130,246,0.22)',
  green:'#10b981',  greenDim:'rgba(16,185,129,0.10)',  greenBor:'rgba(16,185,129,0.22)',
  red:'#ef4444',    redDim:'rgba(239,68,68,0.10)',     redBor:'rgba(239,68,68,0.22)',
  purple:'#8b5cf6', purpleDim:'rgba(139,92,246,0.10)',purpleBor:'rgba(139,92,246,0.22)',
  orange:'#f97316', orangeDim:'rgba(249,115,22,0.10)',orangeBor:'rgba(249,115,22,0.22)',
  accent:'#4f6ef7', accentDim:'rgba(79,110,247,0.10)',accentBor:'rgba(79,110,247,0.22)',
}

// ── Metadados semânticos ──────────────────────────────────────────────────────
const TIPOS = {
  entrega:   { label:'Entrega',     icon:Truck,       color:T.purple, dim:T.purpleDim, bor:T.purpleBor },
  atraso:    { label:'Atraso',      icon:Clock,       color:T.red,    dim:T.redDim,    bor:T.redBor    },
  extravio:  { label:'Extravio',    icon:ShieldAlert, color:T.red,    dim:T.redDim,    bor:T.redBor    },
  troca:     { label:'Troca/Dev.',  icon:RotateCcw,   color:T.orange, dim:T.orangeDim, bor:T.orangeBor },
  pagamento: { label:'Pagamento',   icon:CreditCard,  color:T.blue,   dim:T.blueDim,   bor:T.blueBor   },
  produto:   { label:'Produto',     icon:Package,     color:T.amber,  dim:T.amberDim,  bor:T.amberBor  },
  outro:     { label:'Outro',       icon:Tag,         color:T.ink3,   dim:T.bg3,       bor:T.sep2      },
}

const STATUS = {
  aberta:       { label:'Aberta',       color:T.amber,  dim:T.amberDim,  bor:T.amberBor,  dot:T.amber,  icon:Circle      },
  em_andamento: { label:'Em análise',   color:T.blue,   dim:T.blueDim,   bor:T.blueBor,   dot:T.blue,   icon:RefreshCcw  },
  resolvida:    { label:'Resolvida',    color:T.green,  dim:T.greenDim,  bor:T.greenBor,  dot:T.green,  icon:CheckCircle },
  encerrada:    { label:'Encerrada',    color:T.ink3,   dim:T.bg3,       bor:T.sep2,      dot:T.ink4,   icon:XCircle     },
}

const PRIO = {
  baixa:   { label:'Baixa',   icon:ChevronRight,  color:T.ink4  },
  normal:  { label:'Normal',  icon:Circle,        color:T.blue  },
  alta:    { label:'Alta',    icon:AlertTriangle, color:T.orange},
  urgente: { label:'Urgente', icon:Zap,           color:T.red   },
}

const SCORE = {
  1:{ emoji:'😞', label:'Péssimo',   color:T.red,    dim:T.redDim    },
  2:{ emoji:'😐', label:'Regular',   color:T.orange, dim:T.orangeDim },
  3:{ emoji:'🙂', label:'Bom',       color:T.blue,   dim:T.blueDim   },
  4:{ emoji:'😊', label:'Ótimo',     color:T.green,  dim:T.greenDim  },
  5:{ emoji:'🤩', label:'Excelente', color:T.green,  dim:T.greenDim  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtD   = ts => ts ? new Date(ts).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}) : '—'
const fmtH   = ts => ts ? new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : ''
const fmtRel = ts => {
  if (!ts) return '—'
  const m = Math.floor((Date.now()-new Date(ts))/60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  if (m < 1440) return `${Math.floor(m/60)}h`
  return `${Math.floor(m/1440)}d`
}
const fmtTel = t => {
  const n=(t||'').replace(/\D/g,'').replace(/^55/,'')
  return n.length===11?`(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`:t||''
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Bdg({ color, dim, bor, children, size='xs' }) {
  return (
    <span className="inline-flex items-center gap-1 font-bold rounded-md"
      style={{ fontSize:size==='xs'?10:11, padding:'3px 8px', color, background:dim, border:`1px solid ${bor}`, whiteSpace:'nowrap' }}>
      {children}
    </span>
  )
}

// ── INPUT component ───────────────────────────────────────────────────────────
function Inp({ label, required, hint, children }) {
  return (
    <div>
      {label && (
        <label className="block mb-1.5" style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:T.ink3 }}>
          {label}{required && <span style={{ color:T.red, marginLeft:2 }}>*</span>}
        </label>
      )}
      {children}
      {hint && <p style={{ fontSize:10, color:T.ink4, marginTop:4 }}>{hint}</p>}
    </div>
  )
}

const inputSt = { background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:8, padding:'9px 12px', fontSize:13, color:T.ink1, outline:'none', width:'100%', fontFamily:'inherit', transition:'border-color .15s' }
const selSt   = { ...inputSt, cursor:'pointer' }
const taSt    = { ...inputSt, resize:'none', lineHeight:1.55 }

// ── MODAL CRIAR / EDITAR ──────────────────────────────────────────────────────
function ModalOcorrencia({ api, ocorrencia, onSalvo, onClose }) {
  const edit = !!ocorrencia
  const [f, setF] = useState(edit ? {
    tipo:ocorrencia.tipo||'outro', prioridade:ocorrencia.prioridade||'normal',
    titulo:ocorrencia.titulo||'', nomeCliente:ocorrencia.nomeCliente||'',
    telefone:ocorrencia.telefone||'', email:ocorrencia.email||'',
    numeroPedido:ocorrencia.numeroPedido||'', atribuidoA:ocorrencia.atribuidoA||'',
    descricao:ocorrencia.descricao||'',
  } : { tipo:'outro', prioridade:'normal', titulo:'', nomeCliente:'',
        telefone:'', email:'', numeroPedido:'', atribuidoA:'', descricao:'' })
  const [saving, setSaving] = useState(false)
  const [erro,   setErro]   = useState('')
  const set = (k,v) => setF(p=>({...p,[k]:v}))

  const salvar = async () => {
    if (!f.descricao.trim()) { setErro('Descrição obrigatória'); return }
    setSaving(true); setErro('')
    try {
      const url = edit ? `${api}/api/ocorrencias/${ocorrencia.id}` : `${api}/api/ocorrencias`
      const r = await fetch(url, { method:edit?'PATCH':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(f) })
      if (r.ok) { onSalvo?.(); onClose() }
      else { const d=await r.json(); setErro(d.erro||'Erro ao salvar') }
    } catch { setErro('Erro de conexão') }
    setSaving(false)
  }

  const focusSt = { outline:'none', border:`1px solid ${T.accent}`, boxShadow:`0 0 0 3px ${T.accentDim}` }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.72)' }} onClick={onClose}>
      <div className="w-full flex flex-col overflow-hidden"
        style={{ maxWidth:520, background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:16, boxShadow:'0 24px 64px rgba(0,0,0,0.6)' }}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom:`1px solid ${T.sep}` }}>
          <div className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ width:32, height:32, background:T.accentDim, border:`1px solid ${T.accentBor}`, color:T.accent }}>
            <Plus size={16}/>
          </div>
          <div className="flex-1">
            <p style={{ fontSize:15, fontWeight:700, color:T.ink1 }}>{edit ? 'Editar ocorrência' : 'Novo chamado'}</p>
            <p style={{ fontSize:11, color:T.ink4, marginTop:1 }}>Preencha os dados da ocorrência</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:T.ink4, fontSize:18, display:'flex', padding:4 }}>
            <X size={18}/>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-6 py-5 overflow-y-auto" style={{ maxHeight:'62vh' }}>

          {/* Tipo + Prioridade */}
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Tipo" required>
              <select value={f.tipo} onChange={e=>set('tipo',e.target.value)} style={selSt}
                onFocus={e=>Object.assign(e.target.style,focusSt)} onBlur={e=>Object.assign(e.target.style,selSt)}>
                {Object.entries(TIPOS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </Inp>
            <Inp label="Prioridade" required>
              <select value={f.prioridade} onChange={e=>set('prioridade',e.target.value)} style={selSt}
                onFocus={e=>Object.assign(e.target.style,focusSt)} onBlur={e=>Object.assign(e.target.style,selSt)}>
                {Object.entries(PRIO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </Inp>
          </div>

          {/* Título */}
          <Inp label="Título do chamado">
            <input value={f.titulo} onChange={e=>set('titulo',e.target.value)}
              placeholder="Ex: Pacote parado na transportadora há 5 dias"
              style={inputSt}
              onFocus={e=>Object.assign(e.target.style,{...inputSt,...focusSt})}
              onBlur={e=>Object.assign(e.target.style,inputSt)}/>
          </Inp>

          {/* Nome + Telefone */}
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Nome do cliente">
              <input value={f.nomeCliente} onChange={e=>set('nomeCliente',e.target.value)}
                placeholder="Maria Silva" style={inputSt}
                onFocus={e=>Object.assign(e.target.style,{...inputSt,...focusSt})}
                onBlur={e=>Object.assign(e.target.style,inputSt)}/>
            </Inp>
            <Inp label="WhatsApp">
              <input value={f.telefone} onChange={e=>set('telefone',e.target.value)}
                placeholder="5519999999999" style={inputSt}
                onFocus={e=>Object.assign(e.target.style,{...inputSt,...focusSt})}
                onBlur={e=>Object.assign(e.target.style,inputSt)}/>
            </Inp>
          </div>

          {/* Email + Pedido */}
          <div className="grid grid-cols-2 gap-3">
            <Inp label="E-mail">
              <input value={f.email} onChange={e=>set('email',e.target.value)}
                placeholder="cliente@email.com" style={inputSt}
                onFocus={e=>Object.assign(e.target.style,{...inputSt,...focusSt})}
                onBlur={e=>Object.assign(e.target.style,inputSt)}/>
            </Inp>
            <Inp label="Nº pedido Bling">
              <input value={f.numeroPedido} onChange={e=>set('numeroPedido',e.target.value)}
                placeholder="226540" style={inputSt}
                onFocus={e=>Object.assign(e.target.style,{...inputSt,...focusSt})}
                onBlur={e=>Object.assign(e.target.style,inputSt)}/>
            </Inp>
          </div>

          {/* Atribuído */}
          <Inp label="Atribuído a">
            <input value={f.atribuidoA} onChange={e=>set('atribuidoA',e.target.value)}
              placeholder="Responsável pelo chamado" style={inputSt}
              onFocus={e=>Object.assign(e.target.style,{...inputSt,...focusSt})}
              onBlur={e=>Object.assign(e.target.style,inputSt)}/>
          </Inp>

          {/* Descrição */}
          <Inp label="Descrição" required hint="Seja detalhado para agilizar o atendimento sem precisar perguntar ao cliente">
            <textarea value={f.descricao} onChange={e=>set('descricao',e.target.value)}
              rows={4} placeholder="Descreva o problema com detalhes..."
              style={taSt}
              onFocus={e=>Object.assign(e.target.style,{...taSt,...focusSt})}
              onBlur={e=>Object.assign(e.target.style,taSt)}/>
          </Inp>

          {erro && <p style={{ fontSize:11, fontWeight:600, color:T.red }}>{erro}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6 pt-2 justify-end" style={{ borderTop:`1px solid ${T.sep}` }}>
          <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600, background:T.bg3, color:T.ink2, border:`1px solid ${T.sep2}`, cursor:'pointer' }}>
            Cancelar
          </button>
          <button onClick={salvar} disabled={!f.descricao.trim()||saving}
            style={{ padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:700, background:T.accent, color:'#fff', border:'none', cursor:'pointer', opacity:(!f.descricao.trim()||saving)?.4:1, display:'flex', alignItems:'center', gap:6 }}>
            <Plus size={14}/>{saving ? 'Salvando...' : edit ? 'Salvar alterações' : 'Criar chamado'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── DRAWER ────────────────────────────────────────────────────────────────────
function TicketDrawer({ oc, api, onAtualizado, onClose }) {
  const [tab,       setTab]      = useState('wa')
  const [texto,     setTexto]    = useState('')
  const [nota,      setNota]     = useState('')
  const [salvando,  setSalvando] = useState(false)
  const [refining,  setRefining] = useState(false)
  const [blingData, setBling]    = useState(null)
  const [blingLoad, setBlingLoad]= useState(false)
  const [pedAberto, setPedAb]    = useState({})
  const [movim,     setMovim]    = useState({})   // { numeroPedido: { loading, eventos, status } }

  // Busca a timeline de movimentação da transportadora sob demanda (1 req ao abrir)
  const buscarMovimentacao = async (numero) => {
    if (movim[numero]?.loading || movim[numero]?.eventos) return  // já buscou
    setMovim(m => ({ ...m, [numero]: { loading:true } }))
    try {
      const r = await fetch(`${api}/api/dashboard/pedido-completo/${numero}`)
      const d = await r.json()
      setMovim(m => ({ ...m, [numero]: {
        loading:false,
        eventos: d?.rastreio?.eventos || [],
        status:  d?.rastreio?.status || null,
        link:    d?.rastreio?.link || d?.rastreio?.linkCorreios || null,
        transportadora: d?.rastreio?.transportadora || null,
      }}))
    } catch {
      setMovim(m => ({ ...m, [numero]: { loading:false, eventos:[], erro:true } }))
    }
  }
  const [editModal, setEditModal]= useState(false)
  const [csatData,  setCsatData] = useState(null)
  const [csatSent,  setCsatSent] = useState(false)
  const [copied,    setCopied]   = useState(null)

  const T_ = TIPOS[oc.tipo]         || TIPOS.outro
  const S  = STATUS[oc.status]      || STATUS.aberta
  const P  = PRIO[oc.prioridade]    || PRIO.normal
  const TIcon = T_.icon
  const SIcon = S.icon
  const PIcon = P.icon
  const nome1 = oc.nomeCliente?.split(' ')[0] || 'cliente'

  const fetchBling = () => {
    setBlingLoad(true)
    fetch(`${api}/api/ocorrencias/${oc.id}/bling`)
      .then(r=>r.json()).then(d=>setBling(d)).catch(()=>{}).finally(()=>setBlingLoad(false))
  }
  const fetchCsat = () => {
    fetch(`${api}/api/ocorrencias/${oc.id}/csat`)
      .then(r=>r.ok?r.json():null).then(d=>{ if(d) setCsatData(d) }).catch(()=>{})
  }
  useEffect(()=>{ fetchBling(); fetchCsat() }, [oc.id])

  const patch = async body => {
    setSalvando(true)
    try {
      const r = await fetch(`${api}/api/ocorrencias/${oc.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
      })
      if (r.ok) onAtualizado()
    } catch {}
    setSalvando(false)
  }

  const mudarStatus = key => { if (oc.status!==key) patch({status:key}) }
  const enviarWA    = async () => { if (!texto.trim()) return; await patch({respostaCliente:texto}); setTexto('') }
  const enviarNota  = async () => { if (!nota.trim()) return; await patch({nota}); setNota('') }

  const refinarIA = async () => {
    if (!texto.trim()) return
    setRefining(true)
    try {
      const r = await fetch(`${api}/api/ia/melhorar-texto`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ texto, contexto:`Chamado ${oc.ticketId}: ${oc.titulo||oc.descricao}` })
      })
      if (r.ok) { const d=await r.json(); if(d.texto) setTexto(d.texto) }
    } catch {}
    setRefining(false)
  }

  const dispararCsat = async () => {
    try {
      const r = await fetch(`${api}/api/ocorrencias/${oc.id}/csat`, {method:'POST'})
      if (r.ok) { setCsatSent(true); onAtualizado() }
    } catch {}
  }

  const copiar = (text, key) => {
    navigator.clipboard?.writeText(text).catch(()=>{})
    setCopied(key); setTimeout(()=>setCopied(null), 1500)
  }

  const cliente = blingData?.cliente
  const pedidos = blingData?.pedidos || []

  const TEMPLATES = [
    'Em análise — acareação aberta. Retorno em 48h úteis.',
    'Abrimos protocolo com a transportadora. Prazo: 48h úteis.',
    'Pedido será reenviado sem custo adicional em até 2 dias úteis.',
    'Reembolso processado. Valor estornado em até 5 dias úteis.',
  ]

  // Estilos reutilizáveis
  const tabBtnSt = (id) => {
    const colors = { tl:T.accent, wa:T.green, em:T.purple, nota:T.amber, csat:T.purple }
    const on = tab===id
    return {
      padding:'10px 14px', fontSize:12, fontWeight:600, cursor:'pointer',
      borderBottom:`2px solid ${on?colors[id]:'transparent'}`,
      color: on ? colors[id] : T.ink4,
      background:'transparent', border:'none', borderBottom:`2px solid ${on?colors[id]:'transparent'}`,
      display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', transition:'color .15s'
    }
  }

  const compArea = (borderColor) => ({
    border:`1px solid ${borderColor}`, borderRadius:10, overflow:'hidden'
  })
  const compTA = { width:'100%', resize:'none', border:'none', outline:'none', padding:'10px 12px', fontSize:12, background:T.bg2, color:T.ink1, fontFamily:'inherit', height:68 }
  const compFoot = (bg=T.bg3) => ({ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:bg, borderTop:`1px solid ${T.sep}` })

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      <div className="flex-1" style={{ background:'rgba(0,0,0,0.5)' }}/>
      <div className="h-full flex flex-col overflow-hidden"
        style={{ width:600, background:T.bg1, borderLeft:`1px solid ${T.sep2}`, boxShadow:'-24px 0 48px rgba(0,0,0,0.4)' }}
        onClick={e=>e.stopPropagation()}>

        {/* ── HEADER ─── */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4" style={{ background:T.bg2, borderBottom:`1px solid ${T.sep}` }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 mb-2" style={{ fontSize:11, color:T.ink4 }}>
            <span>Ocorrências</span>
            <ChevronRight size={10}/>
            <span style={{ fontFamily:'monospace', fontWeight:700, color:T.ink3 }}>{oc.ticketId}</span>
            <div className="flex items-center gap-1.5 ml-auto">
              <button onClick={()=>setEditModal(true)}
                style={{ padding:'4px 12px', borderRadius:7, fontSize:11, fontWeight:600, background:T.bg3, color:T.ink2, border:`1px solid ${T.sep2}`, cursor:'pointer' }}>
                Editar
              </button>
              <button onClick={onClose}
                style={{ width:28, height:28, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink4, cursor:'pointer' }}>
                <X size={13}/>
              </button>
            </div>
          </div>

          {/* Título + badges */}
          <div className="flex items-start gap-2 mb-3 flex-wrap">
            <Bdg color={S.color} dim={S.dim} bor={S.bor}><SIcon size={9}/>{S.label}</Bdg>
            <Bdg color={P.color} dim="transparent" bor="transparent"><PIcon size={9}/>{P.label}</Bdg>
          </div>
          <p style={{ fontSize:16, fontWeight:700, color:T.ink1, lineHeight:1.3, marginBottom:14 }}>
            {oc.titulo || oc.descricao?.slice(0,70) || '—'}
          </p>

          {/* Meta grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { l:'Tipo',       v:<span className="flex items-center gap-1" style={{color:T_.color}}><TIcon size={12}/>{T_.label}</span> },
              { l:'Prioridade', v:<span style={{color:P.color}} className="flex items-center gap-1"><PIcon size={12}/>{P.label}</span> },
              { l:'Pedido ERP', v: oc.numeroPedido ? <span style={{color:T.blue}} className="flex items-center gap-1">#{oc.numeroPedido}<ArrowUpRight size={10}/></span> : <span style={{color:T.ink4}}>—</span> },
              { l:'Atribuído',  v:<span style={{color:T.ink2}}>{oc.atribuidoA||'—'}</span> },
            ].map(({l,v})=>(
              <div key={l} style={{ background:T.bg3, border:`1px solid ${T.sep}`, borderRadius:8, padding:'8px 10px' }}>
                <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:T.ink4, marginBottom:4 }}>{l}</p>
                <div style={{ fontSize:11, fontWeight:600 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Status pipeline */}
          <div className="flex gap-1 p-1 mb-1.5" style={{ background:T.bg3, border:`1px solid ${T.sep}`, borderRadius:10 }}>
            {Object.entries(STATUS).map(([key,s])=>{
              const Sic = s.icon
              const on = oc.status===key
              return (
                <button key={key} onClick={()=>mudarStatus(key)} disabled={salvando}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={on
                    ? { background:s.dim, color:s.color, border:`1px solid ${s.bor}`, cursor:'default' }
                    : { background:'transparent', color:T.ink4, border:'1px solid transparent', cursor:'pointer' }}>
                  <Sic size={10}/>{s.label}
                  {on && <Check size={9} style={{ opacity:.6 }}/>}
                </button>
              )
            })}
          </div>
          <p style={{ fontSize:10, color:T.ink4, display:'flex', alignItems:'center', gap:4 }}>
            <Send size={10}/>
            Mudar status dispara mensagem automática do template configurado em Gatilhos
          </p>
        </div>

        {/* ── CLIENTE (Bling) ─── */}
        <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3" style={{ borderBottom:`1px solid ${T.sep}` }}>
          {blingLoad ? (
            <div className="flex items-center gap-2" style={{ color:T.ink4 }}>
              <RefreshCw size={11} className="animate-spin"/>
              <span style={{ fontSize:11 }}>Buscando no Bling...</span>
            </div>
          ) : (
            <>
              {/* Avatar */}
              <div className="flex items-center justify-center rounded-full flex-shrink-0 font-bold text-sm"
                style={{ width:36, height:36, background:T.blueDim, border:`1px solid ${T.blueBor}`, color:T.blue }}>
                {(cliente?.nome||oc.nomeCliente||'?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span style={{ fontSize:13, fontWeight:700, color:T.ink1 }}>
                    {cliente?.nome || oc.nomeCliente || 'Cliente não identificado'}
                  </span>
                  {cliente?.origem==='bling' && (
                    <Bdg color={T.blue} dim={T.blueDim} bor={T.blueBor}>BLING ✓</Bdg>
                  )}
                  {blingData?.aviso && (
                    <Bdg color={T.red} dim={T.redDim} bor={T.redBor}>
                      <AlertTriangle size={9}/>{blingData.aviso.slice(0,30)}
                    </Bdg>
                  )}
                  {!cliente && !blingLoad && (
                    <Bdg color={T.red} dim={T.redDim} bor={T.redBor}>
                      <AlertTriangle size={9}/>Telefone não localizado no Bling
                    </Bdg>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                  {(cliente?.telefone||oc.telefone) && (
                    <span style={{ fontSize:11, color:T.ink3, display:'flex', alignItems:'center', gap:3 }}>
                      <Phone size={10}/>{fmtTel(cliente?.telefone||oc.telefone)}
                    </span>
                  )}
                  {(cliente?.email||oc.email) && (
                    <span style={{ fontSize:11, color:T.ink3, display:'flex', alignItems:'center', gap:3 }}>
                      <Mail size={10}/>{cliente?.email||oc.email}
                    </span>
                  )}
                  {cliente?.cidade && (
                    <span style={{ fontSize:11, color:T.ink3, display:'flex', alignItems:'center', gap:3 }}>
                      <MapPin size={10}/>{cliente.cidade}{cliente.estado&&` · ${cliente.estado}`}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={fetchBling} style={{ width:28, height:28, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink4, cursor:'pointer' }}>
                <RefreshCw size={10}/>
              </button>
            </>
          )}
        </div>

        {/* ── PEDIDOS ─── */}
        {pedidos.length > 0 && (
          <div className="flex-shrink-0 px-6 py-3" style={{ borderBottom:`1px solid ${T.sep}`, maxHeight:200, overflowY:'auto' }}>
            <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:T.ink4, marginBottom:8 }}>
              Pedidos no Bling ({pedidos.length})
            </p>
            {pedidos.map((p,i)=>{
              const cor = {Aberto:T.amber,Atendido:T.green,Cancelado:T.red,Faturado:T.blue,'Em andamento':T.blue,Entregue:T.green}[p.situacao]||T.ink3
              const dim = {Aberto:T.amberDim,Atendido:T.greenDim,Cancelado:T.redDim,Faturado:T.blueDim,'Em andamento':T.blueDim,Entregue:T.greenDim}[p.situacao]||T.bg3
              const bor = {Aberto:T.amberBor,Atendido:T.greenBor,Cancelado:T.redBor,Faturado:T.blueBor,'Em andamento':T.blueBor,Entregue:T.greenBor}[p.situacao]||T.sep2
              const open = pedAberto[i]
              return (
                <div key={i} className="rounded-xl overflow-hidden mb-2" style={{ border:`1px solid ${T.sep2}` }}>
                  <div className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                    style={{ background:T.bg3 }} onClick={()=>setPedAb(v=>({...v,[i]:!v[i]}))}>
                    <Package size={12} style={{ color:T.ink4, flexShrink:0 }}/>
                    <span style={{ fontSize:11, fontWeight:700, color:T.ink1 }}>#{p.numero}</span>
                    <Bdg color={cor} dim={dim} bor={bor}>{p.situacao}</Bdg>
                    <span style={{ fontSize:11, fontWeight:600, color:T.green, marginLeft:'auto' }}>{p.total}</span>
                    {p.transportadora && <span style={{ fontSize:10, color:T.ink4, display:'flex', alignItems:'center', gap:3 }}><Truck size={9}/>{p.transportadora}</span>}
                    <span style={{ fontSize:10, color:T.ink4 }}>{p.data}</span>
                    {open ? <ChevronUp size={11} style={{ color:T.ink4 }}/> : <ChevronDown size={11} style={{ color:T.ink4 }}/>}
                  </div>
                  {open && (
                    <div className="px-3 pt-2 pb-3" style={{ borderTop:`0.5px solid ${T.sep}`, background:T.bg2 }}>
                      {p.rastreio && (
                        <div className="mb-2">
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background:T.blueDim }}>
                            <Truck size={11} style={{ color:T.blue }}/>
                            <span style={{ fontSize:10, fontWeight:700, color:T.blue }}>Rastreio:</span>
                            <span style={{ fontSize:11, fontFamily:'monospace', color:T.ink1 }}>{p.rastreio}</span>
                            {p.statusRastreio && (
                              <span style={{ fontSize:10, fontWeight:600, color:T.green, padding:'1px 7px', borderRadius:4, background:T.greenDim, border:`1px solid ${T.greenBor}` }}>
                                {p.statusRastreio}
                              </span>
                            )}
                            <button onClick={()=>copiar(p.rastreio,`r${i}`)} style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:5, background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink3, cursor:'pointer' }}>
                              {copied===`r${i}` ? <><Check size={10}/>Copiado</> : <><Copy size={10}/>Copiar</>}
                            </button>
                          </div>

                          {/* Botão ver movimentação + timeline sob demanda */}
                          <button onClick={()=>buscarMovimentacao(p.numero)} style={{ marginTop:6, display:'flex', alignItems:'center', gap:5, fontSize:10, fontWeight:600, padding:'4px 10px', borderRadius:6, background:T.bg3, border:`1px solid ${T.sep2}`, color:T.blue, cursor:'pointer' }}>
                            <Navigation size={10}/>
                            {movim[p.numero]?.loading ? 'Buscando...' : movim[p.numero]?.eventos ? 'Atualizar movimentação' : 'Ver movimentação'}
                          </button>

                          {movim[p.numero]?.eventos && (
                            <div className="mt-2 px-2.5 py-2 rounded-lg" style={{ background:T.bg3, border:`1px solid ${T.sep}` }}>
                              {movim[p.numero].transportadora && (
                                <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom:`0.5px solid ${T.sep}` }}>
                                  <Truck size={10} style={{ color:T.ink4 }}/>
                                  <span style={{ fontSize:10, color:T.ink3 }}>{movim[p.numero].transportadora}</span>
                                  {movim[p.numero].link && (
                                    <a href={movim[p.numero].link} target="_blank" rel="noreferrer" style={{ marginLeft:'auto', fontSize:10, fontWeight:600, color:T.blue, textDecoration:'none', display:'flex', alignItems:'center', gap:3 }}>
                                      Rastrear no site <MapPin size={9}/>
                                    </a>
                                  )}
                                </div>
                              )}
                              {movim[p.numero].eventos.length === 0 ? (
                                <div className="flex items-center gap-2">
                                  <Navigation size={11} style={{ color:T.amber }}/>
                                  <span style={{ fontSize:11, color:T.ink3 }}>
                                    {movim[p.numero].erro ? 'Não foi possível buscar a movimentação.' : 'Aguardando movimentação — pacote postado, sem eventos ainda.'}
                                  </span>
                                </div>
                              ) : (
                                movim[p.numero].eventos.map((ev,k) => (
                                  <div key={k} className="flex gap-2 py-1" style={{ borderBottom: k < movim[p.numero].eventos.length-1 ? `0.5px solid ${T.sep}` : 'none' }}>
                                    <div style={{ width:6, height:6, borderRadius:'50%', background: k===0?T.green:T.ink4, marginTop:5, flexShrink:0 }}/>
                                    <div className="flex-1">
                                      <p style={{ fontSize:11, fontWeight:k===0?600:400, color:k===0?T.ink1:T.ink3, margin:0 }}>{ev.status||ev.descricao}</p>
                                      <p style={{ fontSize:9, color:T.ink4, margin:0 }}>{ev.data}{ev.local ? ` · ${ev.local}` : ''}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {p.itens?.map((it,j)=>(
                        <div key={j} className="flex justify-between py-1" style={{ borderBottom:`0.5px solid ${T.sep}`, fontSize:11, color:T.ink3 }}>
                          <span className="truncate flex-1">{it.nome}</span>
                          <span className="ml-3 flex-shrink-0">{it.quantidade}x {it.valorUnit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── TABS ─── */}
        <div className="flex flex-shrink-0" style={{ borderBottom:`1px solid ${T.sep}` }}>
          {[
            { id:'tl',   label:'Timeline',     ic:<History size={13}/>,      cnt:(oc.historico||[]).length||null },
            { id:'wa',   label:'WhatsApp',      ic:<MessageSquare size={13}/> },
            { id:'em',   label:'E-mail',        ic:<Mail size={13}/> },
            { id:'nota', label:'Nota interna',  ic:<FileText size={13}/> },
            { id:'csat', label:'CSAT',          ic:<Star size={13}/>, ml:true },
          ].map(({id,label,ic,cnt,ml})=>(
            <button key={id} onClick={()=>setTab(id)} style={{ ...tabBtnSt(id), marginLeft:ml?'auto':undefined }}>
              {ic}{label}
              {cnt && (
                <span style={{ padding:'1px 5px', borderRadius:99, fontSize:9, fontWeight:700, background:T.accentDim, color:T.accent }}>{cnt}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── CONTEÚDO ─── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* TIMELINE */}
          {tab==='tl' && (
            <div>
              {/* Relato */}
              <div className="flex gap-3 mb-5">
                <div className="flex items-center justify-center rounded-full flex-shrink-0 mt-0.5"
                  style={{ width:34, height:34, background:T.amberDim, border:`1px solid ${T.amberBor}`, color:T.amber }}>
                  <Tag size={13}/>
                </div>
                <div className="flex-1">
                  <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:T.ink4, marginBottom:5 }}>Relato original</p>
                  <div style={{ padding:'10px 13px', borderRadius:10, fontSize:12, lineHeight:1.55, background:T.bg2, border:`1px solid ${T.sep2}`, color:T.ink2 }}>
                    {oc.descricao||'Sem descrição.'}
                  </div>
                </div>
              </div>

              {/* Histórico */}
              {[...(oc.historico||[])].reverse().map((h,i)=>{
                const isWA     = h.acao==='whatsapp'
                const isSt     = h.acao?.startsWith('status')
                const isCsat   = h.acao?.startsWith('csat')
                const dotColor = isWA?T.green:isSt?T.blue:isCsat?T.purple:T.ink4
                const dotDim   = isWA?T.greenDim:isSt?T.blueDim:isCsat?T.purpleDim:T.bg3
                const dotBor   = isWA?T.greenBor:isSt?T.blueBor:isCsat?T.purpleBor:T.sep2
                const bubBg    = isWA?T.greenDim:isSt?T.blueDim:isCsat?T.purpleDim:T.bg2
                const bubBor   = isWA?T.greenBor:isSt?T.blueBor:isCsat?T.purpleBor:T.sep2
                const bubColor = isWA?'#6ee7b7':isSt?'#93c5fd':isCsat?'#c4b5fd':T.ink2
                const IcN      = isWA?MessageSquare:isSt?RefreshCcw:isCsat?Star:FileText
                return (
                  <div key={i} className="flex gap-3 mb-5 relative">
                    {i < (oc.historico||[]).length-1 && (
                      <div style={{ position:'absolute', left:16, top:34, bottom:-12, width:1, background:T.sep2 }}/>
                    )}
                    <div className="flex items-center justify-center rounded-full flex-shrink-0 mt-0.5"
                      style={{ width:34, height:34, background:dotDim, border:`1px solid ${dotBor}`, color:dotColor, fontSize:14 }}>
                      <IcN size={13}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5" style={{ fontSize:11, color:T.ink4 }}>
                        <span style={{ fontWeight:600, color:T.ink2 }}>{h.por||'sistema'}</span>
                        · {h.em ? fmtD(h.em)+' '+fmtH(h.em) : ''}
                      </div>
                      <div style={{ padding:'10px 13px', borderRadius:10, fontSize:11, lineHeight:1.55, background:bubBg, border:`1px solid ${bubBor}`, color:bubColor, fontFamily: isWA?'monospace':'inherit' }}>
                        {h.nota}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Nota rápida */}
              <div style={{ borderTop:`1px solid ${T.sep2}`, paddingTop:16, marginTop:4 }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:T.ink4, marginBottom:8 }}>Nota rápida</p>
                <div style={compArea(T.sep2)}>
                  <textarea value={nota} onChange={e=>setNota(e.target.value)} rows={2}
                    placeholder="Registrar informação interna..."
                    style={{ ...compTA, borderBottom:`1px solid ${T.sep}` }}/>
                  <div style={compFoot()}>
                    <div/>
                    <button onClick={enviarNota} disabled={!nota.trim()||salvando}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 14px', borderRadius:8, fontSize:12, fontWeight:700, background:T.accent, color:'#fff', border:'none', cursor:'pointer', opacity:(!nota.trim()||salvando)?.4:1 }}>
                      <FileText size={12}/>{salvando?'Salvando...':'Salvar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WHATSAPP */}
          {tab==='wa' && (
            <div>
              {/* Preview */}
              <div style={{ background:T.greenDim, border:`1px solid ${T.greenBor}`, borderRadius:10, overflow:'hidden', marginBottom:14 }}>
                <div className="flex items-center gap-2 px-3 py-2" style={{ background:'rgba(0,0,0,0.15)' }}>
                  <MessageSquare size={11} style={{ color:T.green }}/>
                  <span style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'rgba(255,255,255,0.4)' }}>
                    Preview — estrutura enviada ao cliente
                  </span>
                </div>
                <div style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:11, color:'#6ee7b7', lineHeight:1.6 }}>
                  <p style={{ fontWeight:'bold', color:'#34d399', marginBottom:4 }}>📋 Atualização — Protocolo {oc.ticketId}</p>
                  <p style={{ marginBottom:4 }}>Olá {nome1}!</p>
                  <p style={{ borderLeft:`2px solid ${T.greenBor}`, paddingLeft:8, color:T.green, fontSize:10, marginBottom:6 }}>
                    &gt; {(oc.descricao||'').slice(0,80)}{oc.descricao?.length>80?'...':''}
                  </p>
                  <p style={{ fontWeight:600, color:'#34d399' }}>Nossa resposta:</p>
                  <p style={{ color: texto?'#6ee7b7':'rgba(110,231,183,.4)' }}>{texto||'[ selecione template ou escreva ]'}</p>
                  <p style={{ fontSize:10, color:T.green, borderTop:`1px solid ${T.greenBor}`, marginTop:8, paddingTop:6 }}>
                    🏷️ Status: {S.label} · 📋 {oc.ticketId} · Só Strass
                  </p>
                </div>
              </div>

              {/* Templates */}
              <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:T.ink4, marginBottom:8 }}>Respostas rápidas</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {TEMPLATES.map((t,i)=>(
                  <button key={i} onClick={()=>setTexto(t)}
                    style={{ padding:'4px 10px', borderRadius:6, fontSize:11, border:`1px solid ${texto===t?T.greenBor:T.sep2}`, background:texto===t?T.greenDim:T.bg3, color:texto===t?T.green:T.ink2, cursor:'pointer', fontWeight:500, transition:'all .1s' }}>
                    {t.slice(0,32)}...
                  </button>
                ))}
              </div>

              {/* Composer */}
              <div style={compArea(T.greenBor)}>
                <textarea value={texto} onChange={e=>setTexto(e.target.value)} rows={4}
                  placeholder={`Escrever para ${nome1}...`}
                  style={{ ...compTA, height:72, borderBottom:`1px solid ${T.greenBor}` }}/>
                <div style={compFoot()}>
                  <div className="flex gap-1.5">
                    <button style={{ width:28, height:28, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', background:T.bg4, border:`1px solid ${T.sep2}`, color:T.ink4, cursor:'pointer', fontSize:14 }}>
                      <Paperclip size={13}/>
                    </button>
                    <button onClick={refinarIA} disabled={!texto.trim()||refining}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:600, background:T.purpleDim, border:`1px solid ${T.purpleBor}`, color:T.purple, cursor:'pointer', opacity:(!texto.trim()||refining)?.4:1 }}>
                      <Sparkles size={11} className={refining?'animate-spin':''}/>{refining?'Refinando...':'IA'}
                    </button>
                  </div>
                  <button onClick={enviarWA} disabled={!texto.trim()||salvando||!oc.telefone}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700, background:T.green, color:'#fff', border:'none', cursor:'pointer', opacity:(!texto.trim()||salvando||!oc.telefone)?.4:1 }}>
                    <MessageSquare size={13}/>{salvando?'Enviando...':'Enviar WhatsApp'}
                  </button>
                </div>
              </div>
              {!oc.telefone && <p style={{ fontSize:10, marginTop:6, fontWeight:600, color:T.red }}>Telefone não cadastrado</p>}
            </div>
          )}

          {/* EMAIL */}
          {tab==='em' && (
            <div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4" style={{ background:T.purpleDim, border:`1px solid ${T.purpleBor}` }}>
                <Mail size={13} style={{ color:T.purple }}/>
                <p style={{ fontSize:11, color:'#c4b5fd' }}>Para: {cliente?.email||oc.email||'E-mail não cadastrado'}</p>
              </div>
              <div style={compArea(T.purpleBor)}>
                <textarea value={texto} onChange={e=>setTexto(e.target.value)} rows={8}
                  placeholder={`E-mail para ${oc.nomeCliente||'o cliente'}...`}
                  style={{ ...compTA, height:130, borderBottom:`1px solid ${T.purpleBor}` }}/>
                <div style={compFoot()}>
                  <button onClick={refinarIA} disabled={!texto.trim()||refining}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:600, background:T.purpleDim, border:`1px solid ${T.purpleBor}`, color:T.purple, cursor:'pointer', opacity:(!texto.trim()||refining)?.4:1 }}>
                    <Sparkles size={11} className={refining?'animate-spin':''}/>{refining?'Refinando...':'IA'}
                  </button>
                  <button onClick={()=>patch({nota:`E-mail redigido: "${texto.slice(0,60)}..."`})} disabled={!texto.trim()||salvando}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700, background:T.purple, color:'#fff', border:'none', cursor:'pointer', opacity:(!texto.trim()||salvando)?.4:1 }}>
                    <Send size={13}/>{salvando?'Enviando...':'Enviar e-mail'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTA */}
          {tab==='nota' && (
            <div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4" style={{ background:T.amberDim, border:`1px solid ${T.amberBor}` }}>
                <FileText size={13} style={{ color:T.amber }}/>
                <p style={{ fontSize:11, color:'#fcd34d' }}>Nota interna — visível apenas para a equipe</p>
              </div>
              <div style={compArea(T.amberBor)}>
                <textarea value={nota} onChange={e=>setNota(e.target.value)} rows={8}
                  placeholder="Registrar contato com transportadora, acareação, próximos passos..."
                  style={{ ...compTA, height:130, borderBottom:`1px solid ${T.amberBor}` }}/>
                <div style={compFoot()}>
                  <div/>
                  <button onClick={enviarNota} disabled={!nota.trim()||salvando}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700, background:T.amber, color:'#000', border:'none', cursor:'pointer', opacity:(!nota.trim()||salvando)?.4:1 }}>
                    <FileText size={13}/>{salvando?'Salvando...':'Salvar nota'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CSAT */}
          {tab==='csat' && (
            <div>
              {/* Disparo */}
              <div style={{ border:`1px solid ${T.purpleBor}`, borderRadius:12, overflow:'hidden', marginBottom:16 }}>
                <div className="flex items-center gap-2.5 px-4 py-3" style={{ background:T.purpleDim }}>
                  <Star size={15} style={{ color:T.purple }}/>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:'#c4b5fd' }}>Pesquisa de satisfação</p>
                    <p style={{ fontSize:10, color:T.purple }}>Gamificação · NPS · CSAT</p>
                  </div>
                </div>
                <div style={{ padding:16, background:T.bg2 }}>
                  <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:T.ink4, marginBottom:8 }}>Preview da mensagem</p>
                  <div style={{ padding:'10px 12px', borderRadius:10, fontFamily:'monospace', fontSize:11, background:T.greenDim, border:`1px solid ${T.greenBor}`, color:'#6ee7b7', lineHeight:1.6, marginBottom:12 }}>
                    <p style={{ fontWeight:'bold', color:'#34d399', marginBottom:4 }}>⭐ Como avalia o nosso atendimento?</p>
                    <p style={{ color:T.green, fontSize:10, marginBottom:6 }}>Protocolo {oc.ticketId} · Só Strass</p>
                    <div className="flex gap-3 flex-wrap">
                      {Object.entries(SCORE).map(([s,m])=>(
                        <span key={s}>{m.emoji} {m.label}</span>
                      ))}
                    </div>
                  </div>
                  {csatSent ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background:T.greenDim, border:`1px solid ${T.greenBor}` }}>
                      <Check size={14} style={{ color:T.green }}/>
                      <span style={{ fontSize:12, fontWeight:600, color:'#6ee7b7' }}>Pesquisa enviada para {nome1}!</span>
                    </div>
                  ) : (
                    <button onClick={dispararCsat} disabled={!oc.telefone}
                      style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px', borderRadius:8, fontSize:13, fontWeight:700, background:T.purple, color:'#fff', border:'none', cursor:'pointer', opacity:!oc.telefone?.4:1 }}>
                      <Send size={13}/>Enviar pesquisa para {nome1}
                    </button>
                  )}
                </div>
              </div>

              {/* Histórico */}
              {csatData?.clientHistory?.length > 0 && (
                <div>
                  <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:T.ink4, marginBottom:10 }}>
                    Histórico — {oc.nomeCliente||'cliente'}
                  </p>
                  {csatData.clientHistory.map((h,i)=>{
                    const m = SCORE[h.score]||SCORE[3]
                    return (
                      <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderBottom:`1px solid ${T.sep}` }}>
                        <span style={{ fontSize:20 }}>{m.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize:11, fontWeight:600, color:T.ink1 }}>{h.ticket_id} · {h.score}/5 — {m.label}</p>
                          {h.comentario && <p style={{ fontSize:10, color:T.ink3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>"{h.comentario}"</p>}
                        </div>
                        <Bdg color={m.color} dim={m.dim} bor="transparent">{h.score}/5</Bdg>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editModal && (
        <ModalOcorrencia api={api} ocorrencia={oc}
          onSalvo={()=>{ onAtualizado(); setEditModal(false) }}
          onClose={()=>setEditModal(false)}/>
      )}
    </div>
  )
}

// ── TICKET ROW ────────────────────────────────────────────────────────────────
function TicketRow({ oc, ativo, onClick }) {
  const S  = STATUS[oc.status]   || STATUS.aberta
  const T_ = TIPOS[oc.tipo]      || TIPOS.outro
  const P  = PRIO[oc.prioridade] || PRIO.normal
  const ur = oc.prioridade==='urgente' && !['resolvida','encerrada'].includes(oc.status)
  const TIcon = T_.icon
  const SIcon = S.icon
  const PIcon = P.icon

  return (
    <div onClick={onClick}
      className="grid items-center cursor-pointer transition-colors"
      style={{
        gridTemplateColumns:'2fr 1.5fr 0.9fr 0.9fr 0.9fr 0.5fr',
        padding:'13px 20px',
        borderBottom:`1px solid ${T.sep}`,
        borderLeft: ativo ? `3px solid ${T.accent}` : ur ? `3px solid ${T.red}` : '3px solid transparent',
        background: ativo ? T.accentDim : 'transparent',
      }}
      onMouseEnter={e=>{ if(!ativo) e.currentTarget.style.background=T.bg2 }}
      onMouseLeave={e=>{ if(!ativo) e.currentTarget.style.background='transparent' }}>

      {/* Ticket + título */}
      <div className="min-w-0 pr-3">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span style={{ fontSize:10, fontFamily:'monospace', fontWeight:700, color:ativo?T.accent:T.ink4 }}>
            {oc.ticketId}
          </span>
          {ur && <Zap size={9} className="animate-pulse" style={{ color:T.red }}/>}
        </div>
        <p style={{ fontSize:13, fontWeight:600, color:T.ink1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {oc.titulo || oc.descricao?.slice(0,52) || '—'}
        </p>
      </div>

      {/* Cliente */}
      <div className="min-w-0 pr-3">
        <p style={{ fontSize:12, fontWeight:500, color:T.ink2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {oc.nomeCliente||oc.telefone||'—'}
        </p>
        <p style={{ fontSize:10, color:T.ink4, display:'flex', alignItems:'center', gap:3, marginTop:1 }}>
          {oc.numeroPedido ? <><Package size={9}/>#{oc.numeroPedido}</> : 'Sem pedido'}
        </p>
      </div>

      {/* Tipo */}
      <div>
        <Bdg color={T_.color} dim={T_.dim} bor={T_.bor}>
          <TIcon size={9}/>{T_.label}
        </Bdg>
      </div>

      {/* Prioridade */}
      <div>
        <span className="flex items-center gap-1" style={{ fontSize:11, fontWeight:600, color:P.color }}>
          <PIcon size={11}/>{P.label}
        </span>
      </div>

      {/* Status */}
      <div>
        <Bdg color={S.color} dim={S.dim} bor={S.bor}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:S.dot, flexShrink:0 }}/>
          {S.label}
        </Bdg>
      </div>

      {/* Tempo + seta */}
      <div className="flex items-center justify-end gap-1.5">
        <span style={{ fontSize:10, color:T.ink4 }}>{fmtRel(oc.criadoEm)}</span>
        <ChevronRight size={13} style={{ color:T.ink4 }}/>
      </div>
    </div>
  )
}

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function PageOcorrencias({ api: apiProp }) {
  const api = apiProp || BASE
  const [ocorrencias, setOcorrencias] = useState([])
  const [stats,       setStats]       = useState({})
  const [loading,     setLoading]     = useState(true)
  const [modalNova,   setModalNova]   = useState(false)
  const [drawer,      setDrawer]      = useState(null)
  const [filtroSt,    setFiltroSt]    = useState('todos')
  const [filtroTipo,  setFiltroTipo]  = useState('todos')
  const [filtroPrio,  setFiltroPrio]  = useState('todos')
  const [busca,       setBusca]       = useState('')
  const [ver,         setVer]         = useState(0)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (filtroSt   !== 'todos') p.set('status',    filtroSt)
      if (filtroTipo !== 'todos') p.set('tipo',      filtroTipo)
      if (filtroPrio !== 'todos') p.set('prioridade', filtroPrio)
      const r = await fetch(`${api}/api/ocorrencias?${p}`)
      if (r.ok) { const d=await r.json(); setOcorrencias(d.ocorrencias||[]); setStats(d.stats||{}) }
    } catch {}
    setLoading(false)
  }, [api, filtroSt, filtroTipo, filtroPrio])

  useEffect(()=>{ carregar() }, [carregar])

  const aoAtualizar = async () => {
    await carregar()
    if (drawer) {
      try {
        const r = await fetch(`${api}/api/ocorrencias/${drawer.id}`)
        if (r.ok) { const d=await r.json(); setDrawer(d.ocorrencia) }
      } catch {}
    }
    setVer(v=>v+1)
  }

  const filtradas = ocorrencias.filter(oc => {
    if (!busca) return true
    const b = busca.toLowerCase()
    return (oc.nomeCliente||'').toLowerCase().includes(b)
      || (oc.titulo||'').toLowerCase().includes(b)
      || (oc.descricao||'').toLowerCase().includes(b)
      || (oc.ticketId||'').toLowerCase().includes(b)
      || (oc.numeroPedido||'').includes(busca)
      || (oc.telefone||'').includes(busca)
      || (oc.email||'').toLowerCase().includes(b)
  })

  const urgentes = filtradas.filter(o=>o.prioridade==='urgente'&&!['resolvida','encerrada'].includes(o.status))

  // KPI config
  const KPIS = [
    { l:'Total',       v:parseInt(stats.total||0),        color:T.ink1,  accentBar:'transparent', fn:()=>{setFiltroSt('todos');setFiltroPrio('todos')} },
    { l:'Abertas',     v:parseInt(stats.abertas||0),      color:T.amber, accentBar:T.amber,       fn:()=>setFiltroSt('aberta')        },
    { l:'Em análise',  v:parseInt(stats.em_andamento||0), color:T.blue,  accentBar:T.blue,        fn:()=>setFiltroSt('em_andamento')  },
    { l:'Resolvidas',  v:parseInt(stats.resolvidas||0),   color:T.green, accentBar:T.green,       fn:()=>setFiltroSt('resolvida')     },
    { l:'Encerradas',  v:parseInt(stats.encerradas||0),   color:T.ink3,  accentBar:T.ink4,        fn:()=>setFiltroSt('encerrada')     },
    { l:'Urgentes',    v:parseInt(stats.urgentes||0),     color:T.red,   accentBar:T.red,         fn:()=>setFiltroPrio('urgente')     },
  ]

  const selSt2 = { height:36, padding:'0 12px', background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:8, fontSize:12, color:T.ink2, cursor:'pointer', outline:'none' }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:T.bg0 }}>

      {/* ── HEADER ─── */}
      <div className="flex-shrink-0 px-7 pt-6 pb-5" style={{ background:T.bg1, borderBottom:`1px solid ${T.sep2}` }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.ink1, marginBottom:4 }}>Ocorrências & Chamados</h1>
            <p style={{ fontSize:12, color:T.ink3 }}>CRM de tickets · Integração Bling · CSAT automático</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={carregar}
              style={{ width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink3, cursor:'pointer' }}>
              <RefreshCw size={14} className={loading?'animate-spin':''}/>
            </button>
            <button onClick={()=>setModalNova(true)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:700, background:T.accent, color:'#fff', border:'none', cursor:'pointer' }}>
              <Plus size={15}/> Novo chamado
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-6 gap-2.5 mb-5">
          {KPIS.map(k=>(
            <div key={k.l} onClick={k.fn}
              className="relative overflow-hidden cursor-pointer transition-colors rounded-xl"
              style={{ background:T.bg2, border:`1px solid ${T.sep2}`, padding:'14px 16px' }}
              onMouseEnter={e=>e.currentTarget.style.background=T.bg3}
              onMouseLeave={e=>e.currentTarget.style.background=T.bg2}>
              {/* Barra colorida no topo */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.accentBar }}/>
              <p style={{ fontSize:28, fontWeight:800, lineHeight:1, marginBottom:4, color:k.color, fontVariantNumeric:'tabular-nums' }}>{k.v}</p>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:T.ink4 }}>{k.l}</p>
            </div>
          ))}
        </div>

        {/* Alerta urgentes */}
        {urgentes.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4"
            style={{ background:T.redDim, border:`1px solid ${T.redBor}` }}>
            <Zap size={12} className="animate-pulse flex-shrink-0" style={{ color:T.red }}/>
            <p style={{ fontSize:11, fontWeight:600, color:T.red, flex:1 }}>
              {urgentes.length} chamado{urgentes.length>1?'s':''} urgente{urgentes.length>1?'s':''} aguardando atenção
            </p>
            <button onClick={()=>setFiltroPrio('urgente')}
              style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:6, background:T.redDim, border:`1px solid ${T.redBor}`, color:T.red, cursor:'pointer' }}>
              Filtrar
            </button>
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg px-3 flex-1 max-w-xs"
            style={{ height:36, background:T.bg2, border:`1px solid ${T.sep2}` }}>
            <Search size={13} style={{ color:T.ink4, flexShrink:0 }}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)}
              placeholder="TK-ID, cliente, pedido, telefone..."
              style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:12, color:T.ink1 }}/>
            {busca && <button onClick={()=>setBusca('')} style={{ color:T.ink4, background:'none', border:'none', cursor:'pointer', display:'flex' }}><X size={12}/></button>}
          </div>
          {[
            ['Status',    filtroSt,   setFiltroSt,   [['todos','Todos status'],...Object.entries(STATUS).map(([k,s])=>[k,s.label])]],
            ['Tipo',      filtroTipo, setFiltroTipo,  [['todos','Todos tipos'],...Object.entries(TIPOS).map(([k,t])=>[k,t.label])]],
            ['Prioridade',filtroPrio, setFiltroPrio,  [['todos','Todas prioridades'],...Object.entries(PRIO).map(([k,p])=>[k,p.label])]],
          ].map(([label,val,setVal,opts])=>(
            <select key={label} value={val} onChange={e=>setVal(e.target.value)} style={selSt2}>
              {opts.map(([id,l])=><option key={id} value={id}>{l}</option>)}
            </select>
          ))}
        </div>
      </div>

      {/* ── DATA GRID ─── */}
      <div className="flex-1 overflow-y-auto px-7 py-5">
        <div style={{ background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:12, overflow:'hidden' }}>

          {/* Cabeçalho */}
          <div className="grid px-5 py-2.5"
            style={{ gridTemplateColumns:'2fr 1.5fr 0.9fr 0.9fr 0.9fr 0.5fr', borderBottom:`1px solid ${T.sep}`, background:T.bg2, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:T.ink4 }}>
            {['Ticket / Assunto','Cliente','Tipo','Prioridade','Status','Aberto'].map(h=><span key={h}>{h}</span>)}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw size={16} className="animate-spin" style={{ color:T.ink4 }}/>
            </div>
          ) : filtradas.length===0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div style={{ width:48, height:48, borderRadius:12, background:T.bg3, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <AlertCircle size={22} style={{ color:T.ink4 }}/>
              </div>
              <p style={{ fontSize:13, fontWeight:600, color:T.ink3 }}>
                {busca||filtroSt!=='todos'||filtroTipo!=='todos'||filtroPrio!=='todos' ? 'Nenhum chamado encontrado' : 'Nenhuma ocorrência registrada'}
              </p>
              {!busca && filtroSt==='todos' && filtroTipo==='todos' && filtroPrio==='todos' && (
                <button onClick={()=>setModalNova(true)}
                  style={{ fontSize:12, fontWeight:700, padding:'7px 16px', borderRadius:8, background:T.accent, color:'#fff', border:'none', cursor:'pointer' }}>
                  Criar primeiro chamado
                </button>
              )}
            </div>
          ) : (
            <>
              {filtradas.map(oc=>(
                <TicketRow key={oc.id} oc={oc} ativo={drawer?.id===oc.id} onClick={()=>setDrawer(oc)}/>
              ))}
              <div className="px-5 py-2.5" style={{ fontSize:11, color:T.ink4, borderTop:`0.5px solid ${T.sep}` }}>
                {filtradas.length} chamado{filtradas.length!==1?'s':''} {busca||filtroSt!=='todos'?'filtrado':'no total'}
              </div>
            </>
          )}
        </div>
      </div>

      {modalNova && <ModalOcorrencia api={api} onSalvo={carregar} onClose={()=>setModalNova(false)}/>}

      {drawer && (
        <TicketDrawer key={`${drawer.id}-${ver}`} oc={drawer} api={api}
          onAtualizado={aoAtualizar} onClose={()=>setDrawer(null)}/>
      )}
    </div>
  )
}
