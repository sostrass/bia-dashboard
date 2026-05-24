import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, RefreshCw, Plus, X, ChevronDown, ChevronUp,
  Truck, CreditCard, Package, RotateCcw, MessageSquare,
  AlertCircle, Clock, CheckCircle, User, Send, FileText,
  AlertTriangle, Tag, Phone, Mail, ArrowUpRight, Zap,
  ChevronRight, ShieldAlert, Circle, XCircle, Paperclip,
  Sparkles, History, MapPin, MoreHorizontal, Star,
  ExternalLink, Copy, Check, RefreshCcw
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const TIPO = {
  entrega:   { label:'Entrega',     icon:Truck,       color:'#7c3aed', bg:'#f5f3ff', border:'#c4b5fd' },
  atraso:    { label:'Atraso',      icon:Clock,       color:'#b91c1c', bg:'#fef2f2', border:'#fecaca' },
  extravio:  { label:'Extravio',    icon:ShieldAlert, color:'#9f1239', bg:'#fff1f2', border:'#fecdd3' },
  troca:     { label:'Troca/Dev.',  icon:RotateCcw,   color:'#c2410c', bg:'#fff7ed', border:'#fed7aa' },
  pagamento: { label:'Pagamento',   icon:CreditCard,  color:'#1d4ed8', bg:'#eff6ff', border:'#bfdbfe' },
  produto:   { label:'Produto',     icon:Package,     color:'#b45309', bg:'#fffbeb', border:'#fde68a' },
  outro:     { label:'Outro',       icon:Tag,         color:'var(--label-3)', bg:'var(--fill)', border:'var(--sep)' },
}

const STATUS = {
  aberta:       { label:'Aberta',     color:'#b45309', bg:'#fffbeb', border:'#fde68a', ring:'active-ab', dot:'#f59e0b', icon:Circle       },
  em_andamento: { label:'Em análise', color:'#1d4ed8', bg:'#eff6ff', border:'#bfdbfe', ring:'active-em', dot:'#3b82f6', icon:RefreshCw    },
  resolvida:    { label:'Resolvida',  color:'#15803d', bg:'#f0fdf4', border:'#bbf7d0', ring:'active-re', dot:'#22c55e', icon:CheckCircle  },
  encerrada:    { label:'Encerrada',  color:'var(--label-3)', bg:'var(--fill)', border:'var(--sep)', ring:'active-en', dot:'var(--label-4)', icon:XCircle },
}

const PRIO = {
  baixa:   { label:'Baixa',   icon:ChevronRight,  color:'var(--label-4)' },
  normal:  { label:'Normal',  icon:Circle,        color:'#1d4ed8'        },
  alta:    { label:'Alta',    icon:AlertTriangle, color:'#c2410c'        },
  urgente: { label:'Urgente', icon:Zap,           color:'#dc2626'        },
}

const SCORE_META = {
  1:{ emoji:'😞', label:'Péssimo',  color:'#991b1b', bg:'#fee2e2' },
  2:{ emoji:'😐', label:'Regular',  color:'#9a3412', bg:'#fff7ed' },
  3:{ emoji:'🙂', label:'Bom',      color:'#065f46', bg:'#d1fae5' },
  4:{ emoji:'😊', label:'Ótimo',    color:'#065f46', bg:'#d1fae5' },
  5:{ emoji:'🤩', label:'Excelente',color:'#3b0764', bg:'#f5f3ff' },
}

const fmtD  = ts => ts ? new Date(ts).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}) : '—'
const fmtH  = ts => ts ? new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : ''
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

// ── BADGE componente ──────────────────────────────────────────────────────────
function Badge({ color, bg, border, children, size='sm' }) {
  const fs = size === 'xs' ? '9px' : '10px'
  return (
    <span className="inline-flex items-center gap-1 font-semibold rounded-full px-2 py-0.5 whitespace-nowrap"
      style={{ fontSize:fs, color, background:bg, border:`1px solid ${border}` }}>
      {children}
    </span>
  )
}

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

  const inp = 'w-full px-3 py-2 rounded-lg text-xs outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400'
  const inpS = { background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}
      style={{background:'rgba(0,0,0,0.55)'}}>
      <div className="relative w-full max-w-[480px] rounded-2xl flex flex-col overflow-hidden z-10 shadow-2xl"
        style={{background:'var(--bg-2)', border:'1px solid var(--sep)'}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{borderBottom:'1px solid var(--sep)', background:'var(--bg-3)'}}>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{background:'#4f6ef7'}}>
              <Plus size={13} color="#fff"/>
            </div>
            <span className="text-sm font-semibold" style={{color:'var(--label)'}}>
              {edit ? 'Editar ocorrência' : 'Novo chamado'}
            </span>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:opacity-70"
            style={{color:'var(--label-4)'}}>
            <X size={14}/>
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto max-h-[70vh]">

          {/* Tipo + Prioridade */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ['tipo','Tipo', Object.entries(TIPO).map(([k,v])=>({k,l:v.label}))],
              ['prioridade','Prioridade', Object.entries(PRIO).map(([k,v])=>({k,l:v.label}))],
            ].map(([key,label,opts])=>(
              <div key={key}>
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{color:'var(--label-4)'}}>{label} *</label>
                <select value={f[key]} onChange={e=>set(key,e.target.value)} className={`${inp} pr-8`} style={inpS}>
                  {opts.map(({k,l})=><option key={k} value={k}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Título */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{color:'var(--label-4)'}}>Título do chamado</label>
            <input value={f.titulo} onChange={e=>set('titulo',e.target.value)}
              placeholder="Ex: Pacote parado na transportadora há 5 dias"
              className={inp} style={inpS}/>
          </div>

          {/* Nome + Telefone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{color:'var(--label-4)'}}>Nome do cliente</label>
              <input value={f.nomeCliente} onChange={e=>set('nomeCliente',e.target.value)} placeholder="Maria Silva" className={inp} style={inpS}/>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{color:'var(--label-4)'}}>WhatsApp</label>
              <input value={f.telefone} onChange={e=>set('telefone',e.target.value)} placeholder="5519999999999" className={inp} style={inpS}/>
            </div>
          </div>

          {/* Email + Pedido */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{color:'var(--label-4)'}}>E-mail</label>
              <input value={f.email} onChange={e=>set('email',e.target.value)} placeholder="cliente@email.com" className={inp} style={inpS}/>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{color:'var(--label-4)'}}>Nº pedido Bling</label>
              <input value={f.numeroPedido} onChange={e=>set('numeroPedido',e.target.value)} placeholder="226540" className={inp} style={inpS}/>
            </div>
          </div>

          {/* Atribuído */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{color:'var(--label-4)'}}>Atribuído a</label>
            <input value={f.atribuidoA} onChange={e=>set('atribuidoA',e.target.value)} placeholder="Responsável pelo chamado" className={inp} style={inpS}/>
          </div>

          {/* Descrição */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{color:'var(--label-4)'}}>Descrição *</label>
            <textarea value={f.descricao} onChange={e=>set('descricao',e.target.value)} rows={4}
              placeholder="Descreva o problema com detalhes..."
              className={`${inp} resize-none`} style={inpS}/>
          </div>

          {erro && <p className="text-xs font-semibold" style={{color:'#dc2626'}}>{erro}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-5 pb-5 pt-3 flex-shrink-0" style={{borderTop:'1px solid var(--sep)'}}>
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)'}}>
            Cancelar
          </button>
          <button onClick={salvar} disabled={!f.descricao.trim()||saving}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-opacity disabled:opacity-40"
            style={{background:'#4f6ef7', color:'#fff', border:'none'}}>
            {saving ? 'Salvando...' : edit ? 'Salvar alterações' : 'Criar chamado'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── DRAWER ENTERPRISE ─────────────────────────────────────────────────────────
function TicketDrawer({ oc, api, onAtualizado, onClose }) {
  const [tab,       setTab]       = useState('wa')
  const [texto,     setTexto]     = useState('')
  const [nota,      setNota]      = useState('')
  const [salvando,  setSalvando]  = useState(false)
  const [refining,  setRefining]  = useState(false)
  const [blingData, setBlingData] = useState(null)
  const [blingLoad, setBlingLoad] = useState(false)
  const [pedAberto, setPedAberto] = useState({})
  const [editModal, setEditModal] = useState(false)
  const [csatData,  setCsatData]  = useState(null)
  const [csatSent,  setCsatSent]  = useState(false)
  const [copied,    setCopied]    = useState(null)

  const T = TIPO[oc.tipo]           || TIPO.outro
  const S = STATUS[oc.status]       || STATUS.aberta
  const P = PRIO[oc.prioridade]     || PRIO.normal
  const TIcon = T.icon
  const SIcon = S.icon
  const PIcon = P.icon
  const primeiroNome = oc.nomeCliente?.split(' ')[0] || 'cliente'

  const fetchBling = () => {
    setBlingLoad(true)
    fetch(`${api}/api/ocorrencias/${oc.id}/bling`)
      .then(r=>r.json()).then(d=>setBlingData(d)).catch(()=>{}).finally(()=>setBlingLoad(false))
  }
  const fetchCsat = () => {
    fetch(`${api}/api/ocorrencias/${oc.id}/csat`)
      .then(r=>r.ok?r.json():null).then(d=>{ if(d) setCsatData(d) }).catch(()=>{})
  }

  useEffect(() => { fetchBling(); fetchCsat() }, [oc.id])

  const patch = async (body) => {
    setSalvando(true)
    try {
      const r = await fetch(`${api}/api/ocorrencias/${oc.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
      })
      if (r.ok) onAtualizado()
    } catch {}
    setSalvando(false)
  }

  const mudarStatus = key => { if (oc.status !== key) patch({ status:key }) }
  const enviarWA    = async () => { if (!texto.trim()) return; await patch({respostaCliente:texto}); setTexto('') }
  const enviarNota  = async () => { if (!nota.trim()) return; await patch({nota}); setNota('') }

  const refinarIA = async () => {
    if (!texto.trim()) return
    setRefining(true)
    try {
      const r = await fetch(`${api}/api/ia/melhorar-texto`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ texto, contexto:`Chamado ${oc.ticketId}: ${oc.titulo||oc.descricao}. Cliente: ${oc.nomeCliente}` })
      })
      if (r.ok) { const d=await r.json(); if(d.texto) setTexto(d.texto) }
    } catch {}
    setRefining(false)
  }

  const dispararCsat = async () => {
    try {
      const r = await fetch(`${api}/api/ocorrencias/${oc.id}/csat`, { method:'POST' })
      if (r.ok) { setCsatSent(true); onAtualizado() }
    } catch {}
  }

  const copiar = (text, key) => {
    navigator.clipboard?.writeText(text).catch(()=>{})
    setCopied(key)
    setTimeout(()=>setCopied(null), 1500)
  }

  const TEMPLATES = [
    `Em análise — acareação aberta. Retorno em 48h úteis.`,
    `Abrimos protocolo com a transportadora. Prazo: 48h úteis.`,
    `Pedido será reenviado sem custo adicional em até 2 dias úteis.`,
    `Reembolso processado. Valor estornado em até 5 dias úteis.`,
  ]

  const cliente = blingData?.cliente
  const pedidos = blingData?.pedidos || []

  const tabStyle = (id) => ({
    borderBottom: `2px solid ${tab===id ? '#4f6ef7' : 'transparent'}`,
    color: tab===id ? '#4f6ef7' : 'var(--label-4)',
    background: 'transparent',
    overrideColors: {
      wa:   tab==='wa'  ? '#059669' : null,
      em:   tab==='em'  ? '#7c3aed' : null,
      nota: tab==='nota'? '#d97706' : null,
      csat: tab==='csat'? '#7c3aed' : null,
    }
  })

  const getTabColor = (id) => {
    if (tab!==id) return 'var(--label-4)'
    return {wa:'#059669', em:'#7c3aed', nota:'#d97706', csat:'#7c3aed', tl:'#4f6ef7'}[id] || '#4f6ef7'
  }
  const getTabBorder = (id) => {
    if (tab!==id) return 'transparent'
    return {wa:'#059669', em:'#7c3aed', nota:'#d97706', csat:'#7c3aed', tl:'#4f6ef7'}[id] || '#4f6ef7'
  }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1" style={{background:'rgba(0,0,0,0.4)'}}/>
      <div className="w-[680px] h-full flex flex-col overflow-hidden shadow-2xl"
        style={{background:'var(--bg-2)', borderLeft:'1px solid var(--sep)'}}
        onClick={e=>e.stopPropagation()}>

        {/* ── TICKET HEADER ──────────────────────────────────────────────── */}
        <div className="flex-shrink-0" style={{background:'var(--bg-3)', borderBottom:'1px solid var(--sep)'}}>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 px-5 py-2" style={{borderBottom:'0.5px solid var(--sep)'}}>
            <span className="text-[10px]" style={{color:'var(--label-4)'}}>Ocorrências</span>
            <ChevronRight size={10} style={{color:'var(--label-4)'}}/>
            <span className="text-[10px] font-semibold font-mono" style={{color:'var(--label-3)'}}>{oc.ticketId}</span>
          </div>

          <div className="px-5 pt-3 pb-3">
            {/* Title row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-mono text-[10px] font-bold" style={{color:'var(--label-4)'}}>{oc.ticketId}</span>
                  <Badge color={S.color} bg={S.bg} border={S.border}>
                    <SIcon size={9}/>{S.label}
                  </Badge>
                  <Badge color={P.color} bg="transparent" border="transparent">
                    <PIcon size={9}/>{P.label}
                  </Badge>
                </div>
                <h2 className="text-[15px] font-bold leading-snug" style={{color:'var(--label)'}}>
                  {oc.titulo || oc.descricao?.slice(0,65) || '—'}
                </h2>
              </div>
              <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                <button onClick={()=>setEditModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                  style={{background:'var(--fill)', color:'var(--label-2)', border:'1px solid var(--sep)'}}>
                  <span>Editar</span>
                </button>
                <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-4)'}}>
                  <X size={13}/>
                </button>
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { l:'Tipo',      v:<span className="flex items-center gap-1" style={{color:T.color}}><TIcon size={12}/>{T.label}</span> },
                { l:'Prioridade',v:<span style={{color:P.color}} className="flex items-center gap-1"><PIcon size={12}/>{P.label}</span> },
                { l:'Pedido ERP',v: oc.numeroPedido
                    ? <span className="flex items-center gap-1" style={{color:'#1d4ed8'}}>#{oc.numeroPedido}<ArrowUpRight size={10}/></span>
                    : <span style={{color:'var(--label-4)'}}>—</span> },
                { l:'Atribuído', v:<span style={{color:'var(--label-2)'}}>{oc.atribuidoA||'—'}</span> },
              ].map(({l,v})=>(
                <div key={l} className="px-2.5 py-2 rounded-lg" style={{background:'var(--bg)', border:'1px solid var(--sep)'}}>
                  <p className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{color:'var(--label-4)'}}>{l}</p>
                  <div className="text-[11px] font-semibold">{v}</div>
                </div>
              ))}
            </div>

            {/* Status pipeline */}
            <div className="flex items-center gap-1 p-1.5 rounded-lg mb-1.5"
              style={{background:'var(--bg)', border:'1px solid var(--sep)'}}>
              {Object.entries(STATUS).map(([key,s])=>{
                const Sic = s.icon
                const ativo = oc.status===key
                return (
                  <button key={key} onClick={()=>mudarStatus(key)} disabled={salvando}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all"
                    style={ativo
                      ? {color:s.color, background:s.bg, boxShadow:`0 0 0 1.5px ${s.border} inset`}
                      : {color:'var(--label-3)', background:'transparent'}}>
                    <Sic size={11}/>{s.label}
                    {ativo && <Check size={9} style={{opacity:.6}}/>}
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] flex items-center gap-1" style={{color:'var(--label-4)'}}>
              <Send size={10}/>
              Mudar status dispara mensagem automática do template configurado em Gatilhos.
            </p>
          </div>
        </div>

        {/* ── CLIENTE (Bling) ─────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-5 py-2.5" style={{borderBottom:'1px solid var(--sep)', background:'var(--bg-2)'}}>
          {blingLoad ? (
            <div className="flex items-center gap-2" style={{color:'var(--label-4)'}}>
              <RefreshCw size={11} className="animate-spin"/>
              <span className="text-xs">Buscando no Bling...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{background:'#dbeafe', color:'#1e40af'}}>
                {(cliente?.nome||oc.nomeCliente||'?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[13px] font-bold" style={{color:'var(--label)'}}>
                    {cliente?.nome || oc.nomeCliente || 'Cliente não identificado'}
                  </span>
                  {cliente?.origem==='bling' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{background:'#dbeafe',color:'#1e40af'}}>
                      BLING ✓
                    </span>
                  )}
                  {blingData?.aviso && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{background:'#fff7ed',color:'#c2410c'}}>
                      ⚠ {blingData.aviso.slice(0,35)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                  {(cliente?.telefone||oc.telefone) && (
                    <span className="flex items-center gap-1 text-[11px]" style={{color:'var(--label-3)'}}><Phone size={10}/>{fmtTel(cliente?.telefone||oc.telefone)}</span>
                  )}
                  {(cliente?.email||oc.email) && (
                    <span className="flex items-center gap-1 text-[11px]" style={{color:'var(--label-3)'}}><Mail size={10}/>{cliente?.email||oc.email}</span>
                  )}
                  {cliente?.cidade && (
                    <span className="flex items-center gap-1 text-[11px]" style={{color:'var(--label-3)'}}><MapPin size={10}/>{cliente.cidade}{cliente.estado&&` · ${cliente.estado}`}</span>
                  )}
                  {cliente?.cpf_cnpj && (
                    <span className="text-[10px]" style={{color:'var(--label-4)'}}>{cliente.cpf_cnpj}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={fetchBling} className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-4)'}}>
                  <RefreshCw size={10}/>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── PEDIDOS DO BLING ────────────────────────────────────────────── */}
        {pedidos.length > 0 && (
          <div className="flex-shrink-0 px-5 py-3" style={{borderBottom:'1px solid var(--sep)', maxHeight:220, overflowY:'auto', background:'var(--bg-2)'}}>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{color:'var(--label-4)'}}>
              Pedidos no Bling ({pedidos.length})
            </p>
            <div className="space-y-1.5">
              {pedidos.map((p,i) => {
                const sitColor = {Aberto:'#d97706',Atendido:'#15803d',Cancelado:'#dc2626',Faturado:'#1d4ed8','NF emitida':'#7c3aed','Em andamento':'#1d4ed8',Entregue:'#15803d','Não entregue':'#dc2626'}
                const cor = sitColor[p.situacao]||'var(--label-3)'
                const open = pedAberto[i]
                return (
                  <div key={i} className="rounded-xl overflow-hidden" style={{border:'1px solid var(--sep)'}}>
                    <div className="flex items-center gap-2.5 px-3 py-2 cursor-pointer"
                      style={{background:'var(--bg-3)'}}
                      onClick={()=>setPedAberto(v=>({...v,[i]:!v[i]}))}>
                      <Package size={12} style={{color:'var(--label-4)', flexShrink:0}}/>
                      <span className="text-[11px] font-bold" style={{color:'var(--label)'}}>#{p.numero}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{background:`${cor}18`, color:cor}}>{p.situacao}</span>
                      <span className="text-[11px] font-semibold" style={{color:'#15803d'}}>{p.total}</span>
                      {p.transportadora && <span className="text-[10px] flex items-center gap-1 ml-auto" style={{color:'var(--label-4)'}}><Truck size={9}/>{p.transportadora}</span>}
                      <span className="text-[10px]" style={{color:'var(--label-4)'}}>{p.data}</span>
                      {open ? <ChevronUp size={11} style={{color:'var(--label-4)'}}/> : <ChevronDown size={11} style={{color:'var(--label-4)'}}/>}
                    </div>
                    {open && (
                      <div className="px-3 pt-2 pb-3 space-y-1.5" style={{borderTop:'0.5px solid var(--sep)', background:'var(--bg)'}}>
                        {p.rastreio && (
                          <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg" style={{background:'#eff6ff'}}>
                            <Truck size={11} style={{color:'#1d4ed8'}}/>
                            <div className="flex-1">
                              <p className="text-[9px] font-bold" style={{color:'#1e40af'}}>Código de rastreio</p>
                              <p className="text-[11px] font-mono font-semibold" style={{color:'var(--label)'}}>{p.rastreio}</p>
                            </div>
                            <button onClick={()=>copiar(p.rastreio,'rastreio'+i)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors"
                              style={{background:'var(--bg-2)', border:'1px solid var(--sep)', color:'var(--label-3)'}}>
                              {copied===`rastreio${i}` ? <Check size={10}/> : <Copy size={10}/>}
                              {copied===`rastreio${i}` ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                        )}
                        {p.itens?.length > 0 && p.itens.map((it,j)=>(
                          <div key={j} className="flex items-center justify-between py-1" style={{borderBottom:'0.5px solid var(--sep)'}}>
                            <span className="text-[11px] truncate flex-1" style={{color:'var(--label-2)'}}>{it.nome}</span>
                            <span className="text-[10px] ml-3 flex-shrink-0" style={{color:'var(--label-4)'}}>{it.quantidade}x {it.valorUnit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── TABS ────────────────────────────────────────────────────────── */}
        <div className="flex flex-shrink-0" style={{borderBottom:'1px solid var(--sep)', background:'var(--bg-2)'}}>
          {[
            { id:'tl',   label:'Timeline',    ic:<History size={13}/>,     badge: (oc.historico||[]).length||null },
            { id:'wa',   label:'WhatsApp',    ic:<MessageSquare size={13}/> },
            { id:'em',   label:'E-mail',      ic:<Mail size={13}/> },
            { id:'nota', label:'Nota interna',ic:<FileText size={13}/> },
            { id:'csat', label:'CSAT',        ic:<Star size={13}/>, ml:true },
          ].map(({id,label,ic,badge,ml})=>(
            <button key={id} onClick={()=>setTab(id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                borderBottom:`2px solid ${getTabBorder(id)}`,
                color: getTabColor(id),
                background:'transparent',
                marginLeft: ml ? 'auto' : undefined,
              }}>
              {ic}{label}
              {badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={{background:'#e0e9ff', color:'#3b5bdb'}}>{badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ──────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* TIMELINE */}
          {tab==='tl' && (
            <div className="p-5">
              {/* Relato original */}
              <div className="flex gap-3 mb-5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{background:'#fffbeb', border:'1px solid #fde68a'}}>
                  <Tag size={13} style={{color:'#d97706'}}/>
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-semibold uppercase tracking-wider mb-1.5" style={{color:'var(--label-4)'}}>Relato original</p>
                  <div className="p-3 rounded-xl text-xs leading-relaxed"
                    style={{background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label-2)'}}>
                    {oc.descricao||'Sem descrição.'}
                  </div>
                </div>
              </div>

              {/* Eventos */}
              {[...(oc.historico||[])].reverse().length > 0 && (
                <div className="relative pl-4 space-y-4 mb-5" style={{borderLeft:'1.5px solid var(--sep)'}}>
                  {[...(oc.historico||[])].reverse().map((h,i)=>{
                    const isWA     = h.acao==='whatsapp'
                    const isStatus = h.acao?.startsWith('status')
                    const isCsat   = h.acao?.startsWith('csat')
                    const dotBg    = isWA?'#d1fae5':isStatus?'#dbeafe':isCsat?'#f5f3ff':'var(--fill)'
                    const dotBor   = isWA?'#6ee7b7':isStatus?'#93c5fd':isCsat?'#c4b5fd':'var(--sep)'
                    const dotCor   = isWA?'#059669':isStatus?'#1d4ed8':isCsat?'#7c3aed':'var(--label-3)'
                    const bubbleBg = isWA?'#f0fdf4':isStatus?'#eff6ff':isCsat?'#f5f3ff':'var(--bg)'
                    const bubbleBor= isWA?'#bbf7d0':isStatus?'#bfdbfe':isCsat?'#c4b5fd':'var(--sep)'
                    const bubbleCor= isWA?'#065f46':isStatus?'#1e3a8a':isCsat?'#4c1d95':'var(--label-2)'
                    const IcNode   = isWA?MessageSquare:isStatus?RefreshCw:isCsat?Star:FileText
                    return (
                      <div key={i} className="relative flex gap-3">
                        <div className="absolute -left-[21px] top-1 w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0"
                          style={{background:dotBg, border:`1px solid ${dotBor}`, color:dotCor}}>
                          <IcNode size={12}/>
                        </div>
                        <div className="flex-1 min-w-0 pl-3">
                          <p className="text-[10px] mb-1.5 flex items-center gap-1.5" style={{color:'var(--label-4)'}}>
                            <span className="font-semibold" style={{color:'var(--label-2)'}}>{h.por||'sistema'}</span>
                            · {h.em ? fmtD(h.em)+' '+fmtH(h.em) : ''}
                          </p>
                          <div className="p-2.5 rounded-xl text-xs leading-relaxed font-mono"
                            style={{background:bubbleBg, border:`1px solid ${bubbleBor}`, color:bubbleCor}}>
                            {h.nota}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Adicionar nota rápida */}
              <div style={{borderTop:'1px solid var(--sep)', paddingTop:16}}>
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{color:'var(--label-4)'}}>Nota rápida</p>
                <div className="rounded-xl overflow-hidden" style={{border:'1px solid var(--sep)'}}>
                  <textarea value={nota} onChange={e=>setNota(e.target.value)} rows={2}
                    placeholder="Registrar informação interna..."
                    className="w-full px-3 py-2 text-xs outline-none resize-none"
                    style={{background:'var(--bg)', color:'var(--label)', borderBottom:'1px solid var(--sep)'}}/>
                  <div className="flex justify-end px-2.5 py-2" style={{background:'var(--bg-3)'}}>
                    <button onClick={enviarNota} disabled={!nota.trim()||salvando}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-40"
                      style={{background:'var(--label)', color:'var(--bg)'}}>
                      <FileText size={11}/>{salvando?'Salvando...':'Salvar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WHATSAPP */}
          {tab==='wa' && (
            <div className="p-5">
              {/* Preview */}
              <div className="rounded-xl overflow-hidden mb-4" style={{border:'1px solid #bbf7d0'}}>
                <div className="flex items-center gap-2 px-3 py-2" style={{background:'#064e3b'}}>
                  <MessageSquare size={11} style={{color:'#6ee7b7'}}/>
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{color:'rgba(255,255,255,0.5)'}}>Preview — estrutura da mensagem</span>
                </div>
                <div className="px-4 py-3 font-mono text-[10px] leading-relaxed space-y-1"
                  style={{background:'#f0fdf4', color:'#065f46'}}>
                  <p className="font-bold" style={{color:'#064e3b'}}>📋 Atualização — Protocolo {oc.ticketId}</p>
                  <p>Olá {primeiroNome}!</p>
                  <p className="pl-2.5 italic text-[10px]" style={{borderLeft:'2.5px solid #6ee7b7', color:'#047857'}}>
                    &gt; {(oc.descricao||'').slice(0,80)}{oc.descricao?.length>80?'...':''}
                  </p>
                  <p className="font-semibold" style={{color:'#064e3b'}}>Nossa resposta:</p>
                  <p style={{color:texto?'#047857':'#6ee7b7'}}>{texto||'[ selecione template ou escreva ]'}</p>
                  <p className="text-[9px] pt-1" style={{borderTop:'1px solid #bbf7d0',color:'#047857'}}>
                    🏷️ Status: {S.label} · 📋 {oc.ticketId} · Só Strass
                  </p>
                </div>
              </div>

              {/* Templates */}
              <p className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{color:'var(--label-4)'}}>Respostas rápidas</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {TEMPLATES.map((t,i)=>(
                  <button key={i} onClick={()=>setTexto(t)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors"
                    style={{
                      background: texto===t ? '#f0fdf4' : 'var(--fill)',
                      border: texto===t ? '1px solid #86efac' : '1px solid var(--sep)',
                      color: texto===t ? '#15803d' : 'var(--label-2)',
                    }}>
                    {t.slice(0,32)}...
                  </button>
                ))}
              </div>

              {/* Composer */}
              <div className="rounded-xl overflow-hidden" style={{border:'1px solid #86efac'}}>
                <textarea value={texto} onChange={e=>setTexto(e.target.value)} rows={4}
                  placeholder={`Escrever para ${primeiroNome}...`}
                  className="w-full px-3 py-2.5 text-xs font-medium outline-none resize-none"
                  style={{background:'var(--bg)', color:'var(--label)', borderBottom:'1px solid #86efac'}}/>
                <div className="flex items-center justify-between px-3 py-2" style={{background:'var(--bg-3)'}}>
                  <div className="flex gap-1.5">
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-4)'}}>
                      <Paperclip size={13}/>
                    </button>
                    <button onClick={refinarIA} disabled={!texto.trim()||refining}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold disabled:opacity-40 transition-colors"
                      style={{background:'#f5f3ff', border:'1px solid #c4b5fd', color:'#7c3aed'}}>
                      <Sparkles size={11} className={refining?'animate-spin':''}/>{refining?'Refinando...':'IA'}
                    </button>
                  </div>
                  <button onClick={enviarWA} disabled={!texto.trim()||salvando||!oc.telefone}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                    style={{background:'#059669', color:'#fff', border:'none'}}>
                    <MessageSquare size={12}/>{salvando?'Enviando...':'Enviar WhatsApp'}
                  </button>
                </div>
              </div>
              {!oc.telefone && <p className="text-[10px] mt-2 font-semibold" style={{color:'#dc2626'}}>Telefone não cadastrado — adicione para enviar mensagens</p>}
            </div>
          )}

          {/* EMAIL */}
          {tab==='em' && (
            <div className="p-5">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs"
                style={{background:'#ede9fe', border:'1px solid #c4b5fd', color:'#5b21b6'}}>
                <Mail size={13}/>Para: {cliente?.email||oc.email||'E-mail não cadastrado'}
              </div>
              <div className="rounded-xl overflow-hidden" style={{border:'1px solid #c4b5fd'}}>
                <textarea value={texto} onChange={e=>setTexto(e.target.value)} rows={8}
                  placeholder={`E-mail para ${oc.nomeCliente||'o cliente'}...`}
                  className="w-full px-3 py-2.5 text-xs outline-none resize-none"
                  style={{background:'var(--bg)', color:'var(--label)', borderBottom:'1px solid #c4b5fd'}}/>
                <div className="flex items-center justify-between px-3 py-2" style={{background:'var(--bg-3)'}}>
                  <button onClick={refinarIA} disabled={!texto.trim()||refining}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold disabled:opacity-40"
                    style={{background:'#f5f3ff', border:'1px solid #c4b5fd', color:'#7c3aed'}}>
                    <Sparkles size={11} className={refining?'animate-spin':''}/>{refining?'Refinando...':'IA'}
                  </button>
                  <button onClick={()=>patch({nota:`E-mail redigido: "${texto.slice(0,60)}..."`})} disabled={!texto.trim()||salvando}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                    style={{background:'#7c3aed', color:'#fff', border:'none'}}>
                    <Send size={12}/>{salvando?'Enviando...':'Enviar e-mail'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTA INTERNA */}
          {tab==='nota' && (
            <div className="p-5">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs"
                style={{background:'#fffbeb', border:'1px solid #fde68a', color:'#92400e'}}>
                <FileText size={13}/> Nota interna — visível apenas para a equipe, não enviada ao cliente
              </div>
              <div className="rounded-xl overflow-hidden" style={{border:'1px solid #fde68a'}}>
                <textarea value={nota} onChange={e=>setNota(e.target.value)} rows={8}
                  placeholder="Registrar contato com transportadora, acareação, próximos passos..."
                  className="w-full px-3 py-2.5 text-xs outline-none resize-none"
                  style={{background:'var(--bg)', color:'var(--label)', borderBottom:'1px solid #fde68a'}}/>
                <div className="flex justify-end px-3 py-2" style={{background:'var(--bg-3)'}}>
                  <button onClick={enviarNota} disabled={!nota.trim()||salvando}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                    style={{background:'#d97706', color:'#fff', border:'none'}}>
                    <FileText size={12}/>{salvando?'Salvando...':'Salvar nota'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CSAT */}
          {tab==='csat' && (
            <div className="p-5 space-y-4">
              {/* Disparo */}
              <div className="rounded-xl overflow-hidden" style={{border:'1px solid #c4b5fd'}}>
                <div className="flex items-center gap-2.5 px-4 py-3" style={{background:'#ede9fe'}}>
                  <Star size={15} style={{color:'#7c3aed'}}/>
                  <div>
                    <p className="text-xs font-bold" style={{color:'#4c1d95'}}>Pesquisa de satisfação</p>
                    <p className="text-[10px]" style={{color:'#7c3aed'}}>Gamificação · NPS · CSAT</p>
                  </div>
                </div>
                <div className="p-4" style={{background:'var(--bg)'}}>
                  <p className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{color:'var(--label-4)'}}>Preview da mensagem</p>
                  <div className="p-3 rounded-xl font-mono text-[11px] leading-relaxed mb-3"
                    style={{background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#065f46'}}>
                    <p className="font-bold mb-1" style={{color:'#064e3b'}}>⭐ Como avalia o nosso atendimento?</p>
                    <p className="mb-2 text-[10px]" style={{color:'#047857'}}>Protocolo {oc.ticketId} · Só Strass</p>
                    <div className="flex gap-3 flex-wrap">
                      {Object.entries(SCORE_META).map(([s,m])=>(
                        <span key={s} className="text-[11px]">{m.emoji} {m.label}</span>
                      ))}
                    </div>
                  </div>

                  {csatSent ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                      style={{background:'#f0fdf4', border:'1px solid #bbf7d0'}}>
                      <Check size={14} style={{color:'#059669'}}/>
                      <span className="text-xs font-semibold" style={{color:'#065f46'}}>Pesquisa enviada para {primeiroNome}!</span>
                    </div>
                  ) : (
                    <button onClick={dispararCsat} disabled={!oc.telefone}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold disabled:opacity-40 transition-colors"
                      style={{background:'#7c3aed', color:'#fff', border:'none'}}>
                      <Send size={13}/>Enviar pesquisa de satisfação para {primeiroNome}
                    </button>
                  )}

                  {!oc.telefone && (
                    <p className="text-[10px] mt-2 text-center font-semibold" style={{color:'#dc2626'}}>Telefone não cadastrado</p>
                  )}
                </div>
              </div>

              {/* Histórico do cliente */}
              {csatData?.clientHistory?.length > 0 && (
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider mb-3" style={{color:'var(--label-4)'}}>
                    Histórico de avaliações — {oc.nomeCliente||'cliente'}
                  </p>
                  <div className="space-y-2">
                    {csatData.clientHistory.map((h,i)=>{
                      const m = SCORE_META[h.score]||SCORE_META[3]
                      return (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl"
                          style={{background:'var(--bg-3)', border:'1px solid var(--sep)'}}>
                          <span className="text-xl">{m.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold" style={{color:'var(--label)'}}>
                              {h.ticket_id} · {h.score}/5 — {m.label}
                            </p>
                            {h.comentario && (
                              <p className="text-[10px] truncate" style={{color:'var(--label-3)'}}>"{h.comentario}"</p>
                            )}
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{background:m.bg, color:m.color}}>
                            {h.score}/5
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editModal && (
        <ModalOcorrencia api={api} ocorrencia={oc}
          onSalvo={()=>{onAtualizado();setEditModal(false)}}
          onClose={()=>setEditModal(false)}/>
      )}
    </div>
  )
}

// ── TICKET ROW na lista ───────────────────────────────────────────────────────
function TicketRow({ oc, ativo, onClick }) {
  const S  = STATUS[oc.status]    || STATUS.aberta
  const T  = TIPO[oc.tipo]        || TIPO.outro
  const P  = PRIO[oc.prioridade]  || PRIO.normal
  const ur = oc.prioridade==='urgente' && !['resolvida','encerrada'].includes(oc.status)
  const SIcon = S.icon
  const TIcon = T.icon
  const PIcon = P.icon

  return (
    <div onClick={onClick} className="grid items-center px-5 py-3.5 cursor-pointer transition-colors"
      style={{
        gridTemplateColumns:'2fr 1.6fr 0.8fr 0.9fr 0.8fr 0.5fr',
        borderBottom:'0.5px solid var(--sep)',
        borderLeft: ativo ? '3px solid #4f6ef7' : ur ? '3px solid #dc2626' : '3px solid transparent',
        background: ativo ? 'rgba(79,110,247,0.05)' : 'transparent',
      }}
      onMouseEnter={e=>!ativo && (e.currentTarget.style.background='var(--bg-3)')}
      onMouseLeave={e=>!ativo && (e.currentTarget.style.background='transparent')}>

      {/* Ticket */}
      <div className="min-w-0 pr-3">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-mono text-[9px] font-bold" style={{color: ativo?'#4f6ef7':'var(--label-4)'}}>{oc.ticketId}</span>
          {ur && <Zap size={9} className="animate-pulse" style={{color:'#dc2626'}}/>}
        </div>
        <p className="text-[12.5px] font-semibold leading-snug" style={{
          color:'var(--label)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%'
        }}>
          {oc.titulo || oc.descricao?.slice(0,48) || '—'}
        </p>
      </div>

      {/* Cliente */}
      <div className="min-w-0 pr-3">
        <p className="text-[12px] font-medium truncate" style={{color:'var(--label)'}}>{oc.nomeCliente||oc.telefone||'—'}</p>
        {oc.numeroPedido
          ? <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{color:'var(--label-4)'}}><Package size={9}/>#{oc.numeroPedido}</p>
          : <p className="text-[10px] mt-0.5" style={{color:'var(--label-4)'}}>Sem pedido</p>}
      </div>

      {/* Tipo */}
      <div>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
          style={{color:T.color, background:T.bg, border:`1px solid ${T.border}`}}>
          <TIcon size={9}/>{T.label}
        </span>
      </div>

      {/* Prioridade */}
      <div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{color:P.color}}>
          <PIcon size={11}/>{P.label}
        </span>
      </div>

      {/* Status */}
      <div>
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold"
          style={{color:S.color, background:S.bg, border:`1px solid ${S.border}`}}>
          <div className="w-1.5 h-1.5 rounded-full" style={{background:S.dot}}/>
          {S.label}
        </span>
      </div>

      {/* Tempo */}
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-[10px]" style={{color:'var(--label-4)'}}>{fmtRel(oc.criadoEm)}</span>
        <ChevronRight size={13} style={{color:'var(--label-4)'}}/>
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

  useEffect(() => { carregar() }, [carregar])

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

  // KPIs
  const kpis = [
    { l:'Total',      v:parseInt(stats.total||0),        color:'var(--label)',  bg:'var(--bg-2)',             fn:()=>{setFiltroSt('todos');setFiltroPrio('todos')} },
    { l:'Abertas',    v:parseInt(stats.abertas||0),      color:'#b45309', bg:'#fffbeb',              fn:()=>setFiltroSt('aberta')       },
    { l:'Em análise', v:parseInt(stats.em_andamento||0), color:'#1d4ed8', bg:'#eff6ff',              fn:()=>setFiltroSt('em_andamento') },
    { l:'Resolvidas', v:parseInt(stats.resolvidas||0),   color:'#15803d', bg:'#f0fdf4',              fn:()=>setFiltroSt('resolvida')    },
    { l:'Encerradas', v:parseInt(stats.encerradas||0),   color:'var(--label-3)', bg:'var(--fill)',   fn:()=>setFiltroSt('encerrada')    },
    { l:'Urgentes',   v:parseInt(stats.urgentes||0),     color:'#dc2626', bg:'#fef2f2',              fn:()=>setFiltroPrio('urgente')    },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{background:'var(--bg)'}}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4"
        style={{background:'var(--bg-2)', borderBottom:'1px solid var(--sep)'}}>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-bold" style={{color:'var(--label)'}}>Ocorrências & Chamados</h1>
            <p className="text-xs mt-0.5" style={{color:'var(--label-3)'}}>CRM de tickets · Integração Bling · CSAT automático</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={carregar}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-3)'}}>
              <RefreshCw size={14} className={loading?'animate-spin':''}/>
            </button>
            <button onClick={()=>setModalNova(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs"
              style={{background:'#4f6ef7', color:'#fff', border:'none'}}>
              <Plus size={14}/> Novo chamado
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-6 gap-2.5 mb-4">
          {kpis.map(k=>(
            <div key={k.l} onClick={k.fn}
              className="rounded-xl p-3 text-center cursor-pointer transition-all"
              style={{
                background: k.bg,
                border: `1px solid var(--sep)`,
              }}
              onMouseEnter={e=>e.currentTarget.style.opacity='.8'}
              onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
              <p className="text-2xl font-black leading-none mb-1" style={{color:k.color}}>{k.v}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider" style={{color:'var(--label-4)'}}>{k.l}</p>
            </div>
          ))}
        </div>

        {/* Alerta urgentes */}
        {urgentes.length > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl mb-4"
            style={{background:'#fef2f2', border:'1px solid #fecaca'}}>
            <Zap size={12} className="animate-pulse flex-shrink-0" style={{color:'#dc2626'}}/>
            <p className="text-[11px] font-semibold flex-1" style={{color:'#991b1b'}}>
              {urgentes.length} chamado{urgentes.length>1?'s':''} urgente{urgentes.length>1?'s':''} aguardando atenção imediata
            </p>
            <button onClick={()=>setFiltroPrio('urgente')}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
              style={{background:'#fee2e2', color:'#991b1b', border:'none'}}>
              Filtrar
            </button>
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'var(--label-4)'}}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)}
              placeholder="TK-ID, cliente, pedido, telefone..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl outline-none transition-all"
              style={{background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)'}}/>
          </div>
          {[
            ['Status', filtroSt, setFiltroSt, [['todos','Todos status'],...Object.entries(STATUS).map(([k,s])=>[k,s.label])]],
            ['Tipo',   filtroTipo, setFiltroTipo, [['todos','Todos tipos'],...Object.entries(TIPO).map(([k,t])=>[k,t.label])]],
            ['Prioridade', filtroPrio, setFiltroPrio, [['todos','Todas prioridades'],...Object.entries(PRIO).map(([k,p])=>[k,p.label])]],
          ].map(([label,val,setVal,opts])=>(
            <select key={label} value={val} onChange={e=>setVal(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs outline-none"
              style={{background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label-2)'}}>
              {opts.map(([id,l])=><option key={id} value={id}>{l}</option>)}
            </select>
          ))}
        </div>
      </div>

      {/* ── DATA GRID ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="rounded-2xl overflow-hidden" style={{border:'1px solid var(--sep)', background:'var(--bg-2)'}}>

          {/* Header */}
          <div className="grid px-5 py-2.5 text-[9px] font-bold uppercase tracking-wider"
            style={{
              gridTemplateColumns:'2fr 1.6fr 0.8fr 0.9fr 0.8fr 0.5fr',
              borderBottom:'1px solid var(--sep)',
              background:'var(--bg-3)',
              color:'var(--label-4)',
            }}>
            {['Ticket / Assunto','Cliente','Tipo','Prioridade','Status','Aberto'].map(h=><span key={h}>{h}</span>)}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw size={16} className="animate-spin" style={{color:'var(--label-4)'}}/>
            </div>
          ) : filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:'var(--fill)'}}>
                <AlertCircle size={22} style={{color:'var(--label-4)'}}/>
              </div>
              <p className="text-sm font-semibold" style={{color:'var(--label-3)'}}>
                {busca||filtroSt!=='todos'||filtroTipo!=='todos'||filtroPrio!=='todos'
                  ? 'Nenhum chamado com esses filtros' : 'Nenhuma ocorrência registrada'}
              </p>
              {!busca && filtroSt==='todos' && filtroTipo==='todos' && filtroPrio==='todos' && (
                <button onClick={()=>setModalNova(true)}
                  className="text-xs font-bold px-4 py-2 rounded-xl"
                  style={{background:'#4f6ef7', color:'#fff', border:'none'}}>
                  Criar primeiro chamado
                </button>
              )}
            </div>
          ) : (
            <>
              {filtradas.map(oc=>(
                <TicketRow key={oc.id} oc={oc} ativo={drawer?.id===oc.id}
                  onClick={()=>setDrawer(oc)}/>
              ))}
              <div className="px-5 py-2.5 text-[10px]" style={{color:'var(--label-4)', borderTop:'0.5px solid var(--sep)'}}>
                {filtradas.length} chamado{filtradas.length!==1?'s':''}{' '}
                {busca||filtroSt!=='todos'?'filtrado':'no total'}
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
