import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Search, RefreshCw, Plus, X, ChevronDown, ChevronUp,
  Truck, CreditCard, Package, RotateCcw, MessageSquare,
  AlertCircle, Clock, CheckCircle, User, Send, FileText, Navigation,
  AlertTriangle, Tag, Phone, Mail, ArrowUpRight, Zap,
  ChevronRight, ShieldAlert, Circle, XCircle, Paperclip,
  Sparkles, History, MapPin, Star, Copy, Check, RefreshCcw,
  Filter, Download,
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Paleta dark enterprise — idêntica ao PageDisparos ──────────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#6b7294', ink4:'#3a3f5c',
  sep:'rgba(255,255,255,0.05)', sep2:'rgba(255,255,255,0.08)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.08)',  amberBor:'rgba(255,179,0,.25)',
  blue:'#4f8ef7',  blueDim:'rgba(79,142,247,.08)',   blueBor:'rgba(79,142,247,.25)',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)',  greenBor:'rgba(0,230,118,.25)',
  red:'#ff4757',   redDim:'rgba(255,71,87,.08)',     redBor:'rgba(255,71,87,.25)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.08)',purpleBor:'rgba(167,139,250,.25)',
  orange:'#f97316',orangeDim:'rgba(249,115,22,.08)', orangeBor:'rgba(249,115,22,.25)',
  accent:'#a78bfa',accentDim:'rgba(167,139,250,.08)',accentBor:'rgba(167,139,250,.25)',
  gray:'rgba(255,255,255,.04)', grayBor:'rgba(255,255,255,.1)',
}

// ── Metadados semânticos ───────────────────────────────────────────────────────
const TIPOS = {
  entrega:   { label:'Entrega',    icon:Truck,       color:T.purple, dim:T.purpleDim, bor:T.purpleBor },
  atraso:    { label:'Atraso',     icon:Clock,       color:T.red,    dim:T.redDim,    bor:T.redBor    },
  extravio:  { label:'Extravio',   icon:ShieldAlert, color:T.red,    dim:T.redDim,    bor:T.redBor    },
  troca:     { label:'Troca/Dev.', icon:RotateCcw,   color:T.orange, dim:T.orangeDim, bor:T.orangeBor },
  pagamento: { label:'Pagamento',  icon:CreditCard,  color:T.blue,   dim:T.blueDim,   bor:T.blueBor   },
  produto:   { label:'Produto',    icon:Package,     color:T.amber,  dim:T.amberDim,  bor:T.amberBor  },
  outro:     { label:'Outro',      icon:Tag,         color:T.ink3,   dim:T.bg3,       bor:T.sep2      },
}
const STATUS = {
  aberta:       { label:'Aberta',     color:T.amber,  dim:T.amberDim,  bor:T.amberBor,  dot:T.amber,  icon:Circle      },
  em_andamento: { label:'Em análise', color:T.blue,   dim:T.blueDim,   bor:T.blueBor,   dot:T.blue,   icon:RefreshCcw  },
  resolvida:    { label:'Resolvida',  color:T.green,  dim:T.greenDim,  bor:T.greenBor,  dot:T.green,  icon:CheckCircle },
  encerrada:    { label:'Encerrada',  color:T.ink3,   dim:T.bg3,       bor:T.sep2,      dot:T.ink4,   icon:XCircle     },
}
const PRIO = {
  baixa:   { label:'Baixa',   icon:ChevronRight,  color:T.ink4   },
  normal:  { label:'Normal',  icon:Circle,        color:T.blue   },
  alta:    { label:'Alta',    icon:AlertTriangle, color:T.orange },
  urgente: { label:'Urgente', icon:Zap,           color:T.red    },
}
const SCORE = {
  1:{ emoji:'😞', label:'Péssimo',   color:T.red,    dim:T.redDim    },
  2:{ emoji:'😐', label:'Regular',   color:T.orange, dim:T.orangeDim },
  3:{ emoji:'🙂', label:'Bom',       color:T.blue,   dim:T.blueDim   },
  4:{ emoji:'😊', label:'Ótimo',     color:T.green,  dim:T.greenDim  },
  5:{ emoji:'🤩', label:'Excelente', color:T.green,  dim:T.greenDim  },
}

// ── Helpers ────────────────────────────────────────────────────────────────────
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

// ── Badge ──────────────────────────────────────────────────────────────────────
function Bdg({ color, dim, bor, children, size='xs' }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4, fontWeight:700,
      borderRadius:6, fontSize:size==='xs'?10:11, padding:'3px 8px',
      color, background:dim, border:`1px solid ${bor}`, whiteSpace:'nowrap',
    }}>
      {children}
    </span>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function Skel({w='100%', h=16, r=6}) {
  return (
    <div style={{width:w, height:h, borderRadius:r,
      background:`linear-gradient(90deg,${T.bg3} 25%,${T.bg4} 50%,${T.bg3} 75%)`,
      backgroundSize:'200% 100%', animation:'shimmer 1.5s ease-in-out infinite'}}/>
  )
}

// ── INPUT helper ───────────────────────────────────────────────────────────────
function Inp({ label, required, hint, children }) {
  return (
    <div>
      {label && (
        <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
          letterSpacing:'.06em', color:T.ink3, marginBottom:6, display:'block' }}>
          {label}{required && <span style={{ color:T.red, marginLeft:2 }}>*</span>}
        </div>
      )}
      {children}
      {hint && <p style={{ fontSize:10, color:T.ink4, marginTop:4 }}>{hint}</p>}
    </div>
  )
}

const inputSt = {
  background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:8,
  padding:'9px 12px', fontSize:13, color:T.ink1, outline:'none',
  width:'100%', fontFamily:'inherit', transition:'border-color .15s', boxSizing:'border-box'
}
const selSt = { ...inputSt, cursor:'pointer' }
const taSt  = { ...inputSt, resize:'none', lineHeight:1.55 }
const focusSt = { border:`1px solid ${T.accent}`, boxShadow:`0 0 0 3px ${T.accentDim}` }

// ── MODAL CRIAR / EDITAR ───────────────────────────────────────────────────────
function ModalOcorrencia({ api, ocorrencia, onSalvo, onClose }) {
  const edit = !!ocorrencia
  const [f, setF] = useState(edit ? {
    tipo:ocorrencia.tipo||'outro', prioridade:ocorrencia.prioridade||'normal',
    titulo:ocorrencia.titulo||'', nomeCliente:ocorrencia.nomeCliente||'',
    telefone:ocorrencia.telefone||'', email:ocorrencia.email||'',
    numeroPedido:ocorrencia.numeroPedido||'', atribuidoA:ocorrencia.atribuidoA||'',
    descricao:ocorrencia.descricao||'',
  } : { tipo:'outro', prioridade:'normal', titulo:'', nomeCliente:'', telefone:'', email:'', numeroPedido:'', atribuidoA:'', descricao:'' })
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

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center',
      justifyContent:'center', padding:16, background:'rgba(0,0,0,.72)',
      backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)' }}
      onClick={onClose}>
      <div style={{ width:'100%', maxWidth:520, display:'flex', flexDirection:'column',
        overflow:'hidden', background:T.bg2, border:`1px solid ${T.sep2}`,
        borderRadius:16, boxShadow:'0 24px 64px rgba(0,0,0,.7)',
        animation:'fadeUp .25s ease', maxHeight:'90vh' }}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 24px 16px',
          borderBottom:`1px solid ${T.sep}`, flexShrink:0 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:T.accentDim,
            border:`1px solid ${T.accentBor}`, display:'flex', alignItems:'center',
            justifyContent:'center', flexShrink:0 }}>
            <Plus size={16} style={{ color:T.accent }}/>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:15, fontWeight:700, color:T.ink1, margin:0 }}>
              {edit ? 'Editar ocorrência' : 'Novo chamado'}
            </p>
            <p style={{ fontSize:11, color:T.ink4, marginTop:2 }}>Preencha os dados</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer',
            color:T.ink4, display:'flex', padding:4, borderRadius:7 }}>
            <X size={18}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ display:'flex', flexDirection:'column', gap:14, padding:'18px 24px',
          overflowY:'auto', flex:1 }}>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Inp label="Tipo" required>
              <select value={f.tipo} onChange={e=>set('tipo',e.target.value)} style={selSt}
                onFocus={e=>Object.assign(e.target.style,{...selSt,...focusSt})}
                onBlur={e=>Object.assign(e.target.style,selSt)}>
                {Object.entries(TIPOS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </Inp>
            <Inp label="Prioridade" required>
              <select value={f.prioridade} onChange={e=>set('prioridade',e.target.value)} style={selSt}
                onFocus={e=>Object.assign(e.target.style,{...selSt,...focusSt})}
                onBlur={e=>Object.assign(e.target.style,selSt)}>
                {Object.entries(PRIO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </Inp>
          </div>

          <Inp label="Título do chamado">
            <input value={f.titulo} onChange={e=>set('titulo',e.target.value)}
              placeholder="Ex: Pacote parado na transportadora há 5 dias" style={inputSt}
              onFocus={e=>Object.assign(e.target.style,{...inputSt,...focusSt})}
              onBlur={e=>Object.assign(e.target.style,inputSt)}/>
          </Inp>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
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

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Inp label="E-mail">
              <input value={f.email} onChange={e=>set('email',e.target.value)}
                placeholder="cliente@email.com" style={inputSt}
                onFocus={e=>Object.assign(e.target.style,{...inputSt,...focusSt})}
                onBlur={e=>Object.assign(e.target.style,inputSt)}/>
            </Inp>
            <Inp label="Nº do pedido">
              <input value={f.numeroPedido} onChange={e=>set('numeroPedido',e.target.value)}
                placeholder="Ex: 224307" style={inputSt}
                onFocus={e=>Object.assign(e.target.style,{...inputSt,...focusSt})}
                onBlur={e=>Object.assign(e.target.style,inputSt)}/>
            </Inp>
          </div>

          <Inp label="Atribuído a">
            <input value={f.atribuidoA} onChange={e=>set('atribuidoA',e.target.value)}
              placeholder="Nome do responsável" style={inputSt}
              onFocus={e=>Object.assign(e.target.style,{...inputSt,...focusSt})}
              onBlur={e=>Object.assign(e.target.style,inputSt)}/>
          </Inp>

          <Inp label="Descrição" required>
            <textarea value={f.descricao} onChange={e=>set('descricao',e.target.value)}
              placeholder="Descreva o problema em detalhes..." rows={4} style={taSt}
              onFocus={e=>Object.assign(e.target.style,{...taSt,...focusSt})}
              onBlur={e=>Object.assign(e.target.style,taSt)}/>
          </Inp>

          {erro && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px',
              borderRadius:9, background:T.redDim, border:`1px solid ${T.redBor}` }}>
              <AlertCircle size={14} style={{ color:T.red, flexShrink:0 }}/>
              <span style={{ fontSize:12, color:T.red }}>{erro}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, padding:'14px 24px',
          borderTop:`1px solid ${T.sep}`, flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:9, fontSize:13,
            fontWeight:600, background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink2,
            cursor:'pointer' }}>
            Cancelar
          </button>
          <button onClick={salvar} disabled={saving} style={{ padding:'9px 20px', borderRadius:9,
            fontSize:13, fontWeight:700,
            background:saving?T.purpleDim:'linear-gradient(135deg,#5b21b6,#9333ea)',
            color:saving?T.purple:'#fff', border:'none', cursor:saving?'wait':'pointer',
            display:'flex', alignItems:'center', gap:7, opacity:saving?.7:1 }}>
            {saving ? <><RefreshCw size={13} style={{ animation:'spin .7s linear infinite' }}/>Salvando...</> : (edit ? 'Salvar alterações' : 'Criar chamado')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── TICKET DRAWER ──────────────────────────────────────────────────────────────
function TicketDrawer({ oc, api, onAtualizado, onClose }) {
  const [tab,       setTab]      = useState('tl')
  const [texto,     setTexto]    = useState('')
  const [nota,      setNota]     = useState('')
  const [salvando,  setSalvando] = useState(false)
  const [refining,  setRefining] = useState(false)
  const [blingData, setBling]    = useState(null)
  const [blingLoad, setBlingLoad]= useState(false)
  const [pedAberto, setPedAb]    = useState({})
  const [movim,     setMovim]    = useState({})
  const [editModal, setEditModal]= useState(false)
  const [csatData,  setCsatData] = useState(null)
  const [csatSent,  setCsatSent] = useState(false)
  const [copied,    setCopied]   = useState(null)

  const buscarMovimentacao = async (numero) => {
    if (movim[numero]?.loading || movim[numero]?.eventos) return
    setMovim(m=>({...m,[numero]:{loading:true}}))
    try {
      const r = await fetch(`${api}/api/dashboard/pedido-completo/${numero}`)
      const d = await r.json()
      setMovim(m=>({...m,[numero]:{loading:false,
        eventos:d?.rastreio?.eventos||[],status:d?.rastreio?.status||null,
        link:d?.rastreio?.link||d?.rastreio?.linkCorreios||null,
        transportadora:d?.rastreio?.transportadora||null,
      }}))
    } catch { setMovim(m=>({...m,[numero]:{loading:false,eventos:[],erro:true}})) }
  }

  const T_  = TIPOS[oc.tipo]      || TIPOS.outro
  const S   = STATUS[oc.status]   || STATUS.aberta
  const P   = PRIO[oc.prioridade] || PRIO.normal
  const TIcon = T_.icon, SIcon = S.icon, PIcon = P.icon
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
      const r = await fetch(`${api}/api/ocorrencias/${oc.id}`,{
        method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
      })
      if (r.ok) onAtualizado()
    } catch {}
    setSalvando(false)
  }

  const mudarStatus = key => { if(oc.status!==key) patch({status:key}) }
  const enviarWA    = async () => { if(!texto.trim()) return; await patch({respostaCliente:texto}); setTexto('') }
  const enviarNota  = async () => { if(!nota.trim()) return; await patch({nota}); setNota('') }

  const refinarIA = async () => {
    if(!texto.trim()) return
    setRefining(true)
    try {
      const r = await fetch(`${api}/api/ia/melhorar-texto`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({texto,contexto:`Chamado ${oc.ticketId}: ${oc.titulo||oc.descricao}`})
      })
      if(r.ok){const d=await r.json();if(d.texto)setTexto(d.texto)}
    } catch {}
    setRefining(false)
  }

  const dispararCsat = async () => {
    try{const r=await fetch(`${api}/api/ocorrencias/${oc.id}/csat`,{method:'POST'});if(r.ok){setCsatSent(true);onAtualizado()}}catch{}
  }
  const copiar = (text,key) => {
    navigator.clipboard?.writeText(text).catch(()=>{})
    setCopied(key);setTimeout(()=>setCopied(null),1500)
  }

  const cliente = blingData?.cliente
  const pedidos = blingData?.pedidos||[]

  const TEMPLATES = [
    'Em análise — acareação aberta. Retorno em 48h úteis.',
    'Abrimos protocolo com a transportadora. Prazo: 48h úteis.',
    'Pedido será reenviado sem custo adicional em até 2 dias úteis.',
    'Reembolso processado. Valor estornado em até 5 dias úteis.',
  ]

  const tabColors = { tl:T.accent, wa:T.green, em:T.purple, nota:T.amber, csat:T.purple }
  const tabSt = (id) => ({
    padding:'10px 14px', fontSize:12, fontWeight:600, cursor:'pointer',
    color:tab===id?tabColors[id]:T.ink4, background:'transparent', border:'none',
    borderBottom:`2px solid ${tab===id?tabColors[id]:'transparent'}`,
    display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', transition:'color .15s',
    flexShrink:0,
  })
  const compTA  = { width:'100%', resize:'none', border:'none', outline:'none',
    padding:'10px 12px', fontSize:12, background:T.bg2, color:T.ink1,
    fontFamily:'inherit', height:68, boxSizing:'border-box' }
  const compFoot = (bg=T.bg3) => ({ display:'flex', alignItems:'center',
    justifyContent:'space-between', padding:'8px 12px', background:bg,
    borderTop:`1px solid ${T.sep}` })

  return (
    <>
      {/* Backdrop glass */}
      <div style={{ position:'fixed', inset:0, zIndex:40, display:'flex' }}
        onClick={onClose}>
        <div style={{ flex:1, background:'rgba(0,0,0,.5)',
          backdropFilter:'blur(2px)', WebkitBackdropFilter:'blur(2px)' }}/>

        {/* Painel */}
        <div style={{ width:600, height:'100%', display:'flex', flexDirection:'column',
          overflow:'hidden', background:T.bg1, borderLeft:`1px solid ${T.sep2}`,
          boxShadow:'-24px 0 64px rgba(0,0,0,.5)',
          animation:'slideFromRight .28s cubic-bezier(.2,.8,.2,1)' }}
          onClick={e=>e.stopPropagation()}>

          {/* ── HEADER ── */}
          <div style={{ flexShrink:0, padding:'18px 24px 14px',
            background:T.bg2, borderBottom:`1px solid ${T.sep}` }}>
            {/* Breadcrumb */}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8,
              fontSize:11, color:T.ink4 }}>
              <span>Ocorrências</span>
              <ChevronRight size={10}/>
              <span style={{ fontFamily:'monospace', fontWeight:700, color:T.accent }}>{oc.ticketId}</span>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft:'auto' }}>
                <span style={{ fontSize:10, color:T.ink4 }}>
                  Aberto {fmtRel(oc.criadoEm)}
                </span>
                <button onClick={()=>setEditModal(true)} style={{ padding:'4px 12px',
                  borderRadius:7, fontSize:11, fontWeight:600, background:T.bg3,
                  color:T.ink2, border:`1px solid ${T.sep2}`, cursor:'pointer' }}>
                  Editar
                </button>
                <button onClick={onClose} style={{ width:28, height:28, borderRadius:7,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink4, cursor:'pointer' }}>
                  <X size={13}/>
                </button>
              </div>
            </div>

            {/* Título + badges */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
              <Bdg color={S.color} dim={S.dim} bor={S.bor}><SIcon size={9}/>{S.label}</Bdg>
              <Bdg color={P.color} dim="transparent" bor="transparent"><PIcon size={9}/>{P.label}</Bdg>
            </div>
            <p style={{ fontSize:16, fontWeight:700, color:T.ink1, lineHeight:1.3, marginBottom:14 }}>
              {oc.titulo||oc.descricao?.slice(0,70)||'—'}
            </p>

            {/* Meta grid 4 colunas */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
              {[
                { l:'Tipo',       v:<span style={{color:T_.color,display:'flex',alignItems:'center',gap:4}}><TIcon size={12}/>{T_.label}</span> },
                { l:'Prioridade', v:<span style={{color:P.color, display:'flex',alignItems:'center',gap:4}}><PIcon size={12}/>{P.label}</span> },
                { l:'Pedido ERP', v:oc.numeroPedido?<span style={{color:T.blue,display:'flex',alignItems:'center',gap:4}}>#{oc.numeroPedido}<ArrowUpRight size={10}/></span>:<span style={{color:T.ink4}}>—</span> },
                { l:'Atribuído',  v:<span style={{color:T.ink2}}>{oc.atribuidoA||'—'}</span> },
              ].map(({l,v})=>(
                <div key={l} style={{ background:T.bg3, border:`1px solid ${T.sep}`,
                  borderRadius:8, padding:'8px 10px' }}>
                  <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase',
                    letterSpacing:'.06em', color:T.ink4, marginBottom:4 }}>{l}</p>
                  <div style={{ fontSize:11, fontWeight:600 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Pipeline de status */}
            <div style={{ display:'flex', gap:4, padding:4, marginBottom:6,
              background:T.bg3, border:`1px solid ${T.sep}`, borderRadius:10 }}>
              {Object.entries(STATUS).map(([key,s])=>{
                const Sic = s.icon; const on = oc.status===key
                return (
                  <button key={key} onClick={()=>mudarStatus(key)} disabled={salvando}
                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                      gap:6, padding:'6px', borderRadius:9, fontSize:11, fontWeight:600,
                      transition:'all .15s', cursor:on?'default':'pointer',
                      ...(on ? {background:s.dim,color:s.color,border:`1px solid ${s.bor}`}
                              : {background:'transparent',color:T.ink4,border:'1px solid transparent'})
                    }}>
                    <Sic size={10}/>{s.label}
                    {on && <Check size={9} style={{ opacity:.6 }}/>}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize:10, color:T.ink4, display:'flex', alignItems:'center', gap:4 }}>
              <Send size={10}/>
              Mudar status dispara mensagem automática via Gatilhos
            </p>
          </div>

          {/* ── CLIENTE (Bling) ── */}
          <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:12,
            padding:'12px 24px', borderBottom:`1px solid ${T.sep}` }}>
            {blingLoad ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, color:T.ink4 }}>
                <RefreshCw size={11} style={{ animation:'spin 1s linear infinite' }}/>
                <span style={{ fontSize:11 }}>Buscando no Bling...</span>
              </div>
            ) : (
              <>
                <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0,
                  background:T.blueDim, border:`1px solid ${T.blueBor}`, color:T.blue,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:700, fontSize:14 }}>
                  {(cliente?.nome||oc.nomeCliente||'?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:2 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:T.ink1 }}>
                      {cliente?.nome||oc.nomeCliente||'Cliente não identificado'}
                    </span>
                    {cliente?.origem==='bling'&&<Bdg color={T.blue} dim={T.blueDim} bor={T.blueBor}>BLING ✓</Bdg>}
                    {blingData?.aviso&&<Bdg color={T.red} dim={T.redDim} bor={T.redBor}><AlertTriangle size={9}/>{blingData.aviso.slice(0,30)}</Bdg>}
                    {!cliente&&!blingLoad&&<Bdg color={T.red} dim={T.redDim} bor={T.redBor}><AlertTriangle size={9}/>Telefone não localizado</Bdg>}
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 16px' }}>
                    {(cliente?.telefone||oc.telefone)&&(
                      <span style={{ fontSize:11, color:T.ink3, display:'flex', alignItems:'center', gap:3 }}>
                        <Phone size={10}/>{fmtTel(cliente?.telefone||oc.telefone)}
                      </span>
                    )}
                    {(cliente?.email||oc.email)&&(
                      <span style={{ fontSize:11, color:T.ink3, display:'flex', alignItems:'center', gap:3 }}>
                        <Mail size={10}/>{cliente?.email||oc.email}
                      </span>
                    )}
                    {cliente?.cidade&&(
                      <span style={{ fontSize:11, color:T.ink3, display:'flex', alignItems:'center', gap:3 }}>
                        <MapPin size={10}/>{cliente.cidade}{cliente.estado&&` · ${cliente.estado}`}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={fetchBling} style={{ width:28, height:28, borderRadius:7, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink4, cursor:'pointer' }}>
                  <RefreshCw size={10}/>
                </button>
              </>
            )}
          </div>

          {/* ── PEDIDOS ── */}
          {pedidos.length>0&&(
            <div style={{ flexShrink:0, padding:'12px 24px',
              borderBottom:`1px solid ${T.sep}`, maxHeight:200, overflowY:'auto' }}>
              <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase',
                letterSpacing:'.06em', color:T.ink4, marginBottom:8 }}>
                Pedidos no Bling ({pedidos.length})
              </p>
              {pedidos.map((p,i)=>{
                const cor  = {Aberto:T.amber,Atendido:T.green,Cancelado:T.red,Faturado:T.blue,'Em andamento':T.blue,Entregue:T.green}[p.situacao]||T.ink3
                const dim  = {Aberto:T.amberDim,Atendido:T.greenDim,Cancelado:T.redDim,Faturado:T.blueDim,'Em andamento':T.blueDim,Entregue:T.greenDim}[p.situacao]||T.bg3
                const bor  = {Aberto:T.amberBor,Atendido:T.greenBor,Cancelado:T.redBor,Faturado:T.blueBor,'Em andamento':T.blueBor,Entregue:T.greenBor}[p.situacao]||T.sep2
                const open = pedAberto[i]
                return (
                  <div key={i} style={{ borderRadius:10, overflow:'hidden', marginBottom:8,
                    border:`1px solid ${T.sep2}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                      background:T.bg3, cursor:'pointer' }}
                      onClick={()=>setPedAb(v=>({...v,[i]:!v[i]}))}>
                      <Package size={12} style={{ color:T.ink4, flexShrink:0 }}/>
                      <span style={{ fontSize:11, fontWeight:700, color:T.ink1 }}>#{p.numero}</span>
                      <Bdg color={cor} dim={dim} bor={bor}>{p.situacao}</Bdg>
                      <span style={{ fontSize:11, fontWeight:600, color:T.green, marginLeft:'auto' }}>{p.total}</span>
                      {p.transportadora&&<span style={{ fontSize:10, color:T.ink4, display:'flex', alignItems:'center', gap:3 }}><Truck size={9}/>{p.transportadora}</span>}
                      <span style={{ fontSize:10, color:T.ink4 }}>{p.data}</span>
                      {open?<ChevronUp size={11} style={{color:T.ink4}}/>:<ChevronDown size={11} style={{color:T.ink4}}/>}
                    </div>
                    {open&&(
                      <div style={{ padding:'10px 12px', borderTop:`0.5px solid ${T.sep}`, background:T.bg2 }}>
                        {p.rastreio&&(
                          <div style={{ marginBottom:8 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px',
                              borderRadius:8, background:T.blueDim, marginBottom:6 }}>
                              <Truck size={11} style={{ color:T.blue }}/>
                              <span style={{ fontSize:10, fontWeight:700, color:T.blue }}>Rastreio:</span>
                              <span style={{ fontSize:11, fontFamily:'monospace', color:T.ink1 }}>{p.rastreio}</span>
                              {p.statusRastreio&&(
                                <span style={{ fontSize:10, fontWeight:600, color:T.green, padding:'1px 7px',
                                  borderRadius:4, background:T.greenDim, border:`1px solid ${T.greenBor}` }}>
                                  {p.statusRastreio}
                                </span>
                              )}
                              <button onClick={()=>copiar(p.rastreio,`r${i}`)}
                                style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4,
                                  fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:5,
                                  background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink3, cursor:'pointer' }}>
                                {copied===`r${i}`?<><Check size={10}/>Copiado</>:<><Copy size={10}/>Copiar</>}
                              </button>
                            </div>
                            <button onClick={()=>buscarMovimentacao(p.numero)}
                              style={{ display:'flex', alignItems:'center', gap:5, fontSize:10,
                                fontWeight:600, padding:'4px 10px', borderRadius:6,
                                background:T.bg3, border:`1px solid ${T.sep2}`, color:T.blue, cursor:'pointer' }}>
                              <Navigation size={10}/>
                              {movim[p.numero]?.loading?'Buscando...':movim[p.numero]?.eventos?'Atualizar':'Ver movimentação'}
                            </button>
                            {movim[p.numero]?.eventos&&(
                              <div style={{ marginTop:8, padding:'10px 12px', borderRadius:9,
                                background:T.bg3, border:`1px solid ${T.sep}` }}>
                                {movim[p.numero].transportadora&&(
                                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8,
                                    paddingBottom:8, borderBottom:`0.5px solid ${T.sep}` }}>
                                    <Truck size={10} style={{ color:T.ink4 }}/>
                                    <span style={{ fontSize:10, color:T.ink3 }}>{movim[p.numero].transportadora}</span>
                                    {movim[p.numero].link&&(
                                      <a href={movim[p.numero].link} target="_blank" rel="noreferrer"
                                        style={{ marginLeft:'auto', fontSize:10, fontWeight:600,
                                          color:T.blue, textDecoration:'none', display:'flex', alignItems:'center', gap:3 }}>
                                        Rastrear <MapPin size={9}/>
                                      </a>
                                    )}
                                  </div>
                                )}
                                {movim[p.numero].eventos.length===0?(
                                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                    <Navigation size={11} style={{ color:T.amber }}/>
                                    <span style={{ fontSize:11, color:T.ink3 }}>
                                      {movim[p.numero].erro?'Não foi possível buscar.':'Aguardando movimentação.'}
                                    </span>
                                  </div>
                                ):(
                                  movim[p.numero].eventos.map((ev,k)=>(
                                    <div key={k} style={{ display:'flex', gap:8, padding:'6px 0',
                                      borderBottom:k<movim[p.numero].eventos.length-1?`0.5px solid ${T.sep}`:'none' }}>
                                      <div style={{ width:6, height:6, borderRadius:'50%', marginTop:5, flexShrink:0,
                                        background:k===0?T.green:T.ink4 }}/>
                                      <div style={{ flex:1 }}>
                                        <p style={{ fontSize:11, fontWeight:k===0?600:400,
                                          color:k===0?T.ink1:T.ink3, margin:0 }}>{ev.status||ev.descricao}</p>
                                        <p style={{ fontSize:9, color:T.ink4, margin:0 }}>
                                          {ev.data}{ev.local?` · ${ev.local}`:''}
                                        </p>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {p.itens?.map((it,j)=>(
                          <div key={j} style={{ display:'flex', justifyContent:'space-between',
                            padding:'4px 0', borderBottom:`0.5px solid ${T.sep}`,
                            fontSize:11, color:T.ink3 }}>
                            <span style={{ overflow:'hidden', textOverflow:'ellipsis',
                              whiteSpace:'nowrap', flex:1 }}>{it.nome}</span>
                            <span style={{ marginLeft:12, flexShrink:0 }}>{it.quantidade}x {it.valorUnit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── TABS ── */}
          <div style={{ display:'flex', flexShrink:0, borderBottom:`1px solid ${T.sep}`,
            overflowX:'auto' }}>
            {[
              { id:'tl',   label:'Timeline',    ic:<History size={13}/>,      cnt:(oc.historico||[]).length||null },
              { id:'wa',   label:'WhatsApp',     ic:<MessageSquare size={13}/> },
              { id:'em',   label:'E-mail',       ic:<Mail size={13}/> },
              { id:'nota', label:'Nota interna', ic:<FileText size={13}/> },
              { id:'csat', label:'CSAT',         ic:<Star size={13}/>, ml:true },
            ].map(({id,label,ic,cnt,ml})=>(
              <button key={id} onClick={()=>setTab(id)}
                style={{ ...tabSt(id), marginLeft:ml?'auto':undefined }}>
                {ic}{label}
                {cnt&&(
                  <span style={{ padding:'1px 5px', borderRadius:99, fontSize:9,
                    fontWeight:700, background:T.accentDim, color:T.accent }}>{cnt}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── CONTEÚDO TABS ── */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

            {/* TIMELINE */}
            {tab==='tl'&&(
              <div>
                {/* Relato original */}
                <div style={{ display:'flex', gap:12, marginBottom:20 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0, marginTop:2,
                    background:T.amberDim, border:`1px solid ${T.amberBor}`, color:T.amber,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Tag size={13}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
                      letterSpacing:'.06em', color:T.ink4, marginBottom:5 }}>Relato original</p>
                    <div style={{ padding:'10px 13px', borderRadius:10, fontSize:12,
                      lineHeight:1.55, background:T.bg2, border:`1px solid ${T.sep2}`, color:T.ink2 }}>
                      {oc.descricao||'Sem descrição.'}
                    </div>
                  </div>
                </div>

                {/* Histórico */}
                {[...(oc.historico||[])].reverse().map((h,i)=>{
                  const isWA  = h.acao==='whatsapp'
                  const isSt  = h.acao?.startsWith('status')
                  const isCsat= h.acao?.startsWith('csat')
                  const dotColor = isWA?T.green:isSt?T.blue:isCsat?T.purple:T.ink4
                  const dotDim   = isWA?T.greenDim:isSt?T.blueDim:isCsat?T.purpleDim:T.bg3
                  const dotBor   = isWA?T.greenBor:isSt?T.blueBor:isCsat?T.purpleBor:T.sep2
                  const DotIc    = isWA?MessageSquare:isSt?RefreshCcw:isCsat?Star:FileText
                  return (
                    <div key={i} style={{ display:'flex', gap:12, marginBottom:12 }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0,
                          background:dotDim, border:`1px solid ${dotBor}`, color:dotColor,
                          display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <DotIc size={11}/>
                        </div>
                        {i<(oc.historico||[]).length-1&&(
                          <div style={{ width:1, flex:1, background:T.sep, marginTop:4 }}/>
                        )}
                      </div>
                      <div style={{ flex:1, paddingBottom:8 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:10, fontWeight:700, color:dotColor }}>
                            {isWA?'WhatsApp':isSt?'Status alterado':isCsat?'CSAT':'Nota'}
                          </span>
                          <span style={{ fontSize:10, color:T.ink4, marginLeft:'auto' }}>
                            {fmtD(h.criadoEm)} {fmtH(h.criadoEm)}
                          </span>
                        </div>
                        {h.texto&&(
                          <div style={{ padding:'9px 12px', borderRadius:9, fontSize:12,
                            lineHeight:1.55, background:T.bg2, border:`1px solid ${T.sep}`,
                            color:T.ink2 }}>
                            {h.texto}
                          </div>
                        )}
                        {h.de&&h.para&&(
                          <p style={{ fontSize:11, color:T.ink3 }}>
                            <span style={{ textDecoration:'line-through', color:T.ink4 }}>{STATUS[h.de]?.label||h.de}</span>
                            {' → '}
                            <span style={{ color:STATUS[h.para]?.color||T.ink1, fontWeight:600 }}>{STATUS[h.para]?.label||h.para}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* WHATSAPP */}
            {tab==='wa'&&(
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
                  letterSpacing:'.06em', color:T.ink4 }}>Resposta via WhatsApp</p>
                {TEMPLATES.map((t,i)=>(
                  <button key={i} onClick={()=>setTexto(t)}
                    style={{ width:'100%', textAlign:'left', padding:'9px 12px', borderRadius:9,
                      fontSize:12, background:T.bg3, border:`1px solid ${T.sep}`, color:T.ink2,
                      cursor:'pointer', lineHeight:1.4, transition:'border-color .12s' }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=T.greenBor}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=T.sep}>
                    {t}
                  </button>
                ))}
                <div style={{ border:`1px solid ${T.greenBor}`, borderRadius:10, overflow:'hidden' }}>
                  <textarea value={texto} onChange={e=>setTexto(e.target.value)}
                    placeholder={`Escreva para ${nome1}...`} rows={4}
                    style={{ ...compTA }}/>
                  <div style={{ ...compFoot(T.bg3) }}>
                    <button onClick={refinarIA} disabled={refining||!texto}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px',
                        borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer',
                        background:T.purpleDim, border:`1px solid ${T.purpleBor}`, color:T.purple,
                        opacity:!texto?.5:1 }}>
                      <Sparkles size={12}/>{refining?'Refinando...':'Refinar com IA'}
                    </button>
                    <button onClick={enviarWA} disabled={!texto.trim()}
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                        borderRadius:8, fontSize:12, fontWeight:700,
                        background:T.green, color:T.bg0, border:'none', cursor:'pointer',
                        opacity:!texto.trim()?.5:1 }}>
                      <Send size={13}/>Enviar WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* EMAIL */}
            {tab==='em'&&(
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
                  letterSpacing:'.06em', color:T.ink4 }}>Resposta via E-mail</p>
                {(cliente?.email||oc.email) ? (
                  <div style={{ border:`1px solid ${T.purpleBor}`, borderRadius:10, overflow:'hidden' }}>
                    <div style={{ padding:'8px 12px', background:T.purpleDim,
                      fontSize:11, color:T.purple, display:'flex', alignItems:'center', gap:6 }}>
                      <Mail size={12}/>Para: {cliente?.email||oc.email}
                    </div>
                    <textarea value={texto} onChange={e=>setTexto(e.target.value)}
                      placeholder="Corpo do e-mail..." rows={5} style={{ ...compTA }}/>
                    <div style={{ ...compFoot() }}>
                      <span style={{ fontSize:10, color:T.ink4 }}>Será enviado como e-mail</span>
                      <button onClick={()=>patch({emailCliente:texto})} disabled={!texto.trim()}
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                          borderRadius:8, fontSize:12, fontWeight:700,
                          background:T.purple, color:'#fff', border:'none', cursor:'pointer',
                          opacity:!texto.trim()?.5:1 }}>
                        <Send size={13}/>Enviar E-mail
                      </button>
                    </div>
                  </div>
                ):(
                  <div style={{ padding:'32px', textAlign:'center', color:T.ink4 }}>
                    <Mail size={24} style={{ opacity:.2, marginBottom:8, display:'block', margin:'0 auto 8px' }}/>
                    <p style={{ fontSize:12 }}>Nenhum e-mail cadastrado para este cliente.</p>
                  </div>
                )}
              </div>
            )}

            {/* NOTA INTERNA */}
            {tab==='nota'&&(
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
                  letterSpacing:'.06em', color:T.ink4 }}>Nota interna (não visível ao cliente)</p>
                <div style={{ border:`1px solid ${T.amberBor}`, borderRadius:10, overflow:'hidden' }}>
                  <textarea value={nota} onChange={e=>setNota(e.target.value)}
                    placeholder="Observações internas, acordos, próximos passos..." rows={5}
                    style={{ ...compTA }}/>
                  <div style={{ ...compFoot() }}>
                    <span style={{ fontSize:10, color:T.ink4 }}>Só visível para a equipe</span>
                    <button onClick={enviarNota} disabled={!nota.trim()}
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                        borderRadius:8, fontSize:12, fontWeight:700,
                        background:T.amber, color:T.bg0, border:'none', cursor:'pointer',
                        opacity:!nota.trim()?.5:1 }}>
                      <FileText size={13}/>Salvar nota
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CSAT */}
            {tab==='csat'&&(
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ border:`1px solid ${T.purpleBor}`, borderRadius:12, overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
                    background:T.purpleDim }}>
                    <Star size={15} style={{ color:T.purple }}/>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color:'#c4b5fd', margin:0 }}>Pesquisa de satisfação</p>
                      <p style={{ fontSize:10, color:T.purple, margin:0 }}>CSAT automático via WhatsApp</p>
                    </div>
                  </div>
                  <div style={{ padding:16, background:T.bg2 }}>
                    <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase',
                      letterSpacing:'.06em', color:T.ink4, marginBottom:8 }}>Preview</p>
                    <div style={{ padding:'10px 12px', borderRadius:10, fontFamily:'monospace',
                      fontSize:11, background:T.greenDim, border:`1px solid ${T.greenBor}`,
                      color:'#6ee7b7', lineHeight:1.6, marginBottom:12 }}>
                      <p style={{ fontWeight:'bold', color:'#34d399', marginBottom:4 }}>⭐ Como avalia nosso atendimento?</p>
                      <p style={{ color:T.green, fontSize:10, marginBottom:6 }}>Protocolo {oc.ticketId} · Só Strass</p>
                      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                        {Object.entries(SCORE).map(([s,m])=>(
                          <span key={s}>{m.emoji} {m.label}</span>
                        ))}
                      </div>
                    </div>
                    {csatSent?(
                      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px',
                        borderRadius:10, background:T.greenDim, border:`1px solid ${T.greenBor}` }}>
                        <Check size={14} style={{ color:T.green }}/>
                        <span style={{ fontSize:12, fontWeight:600, color:'#6ee7b7' }}>Pesquisa enviada para {nome1}!</span>
                      </div>
                    ):(
                      <button onClick={dispararCsat} disabled={!oc.telefone}
                        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center',
                          gap:6, padding:'10px', borderRadius:8, fontSize:13, fontWeight:700,
                          background:T.purple, color:'#fff', border:'none', cursor:'pointer',
                          opacity:!oc.telefone?.4:1 }}>
                        <Send size={13}/>Enviar pesquisa para {nome1}
                      </button>
                    )}
                  </div>
                </div>
                {csatData?.clientHistory?.length>0&&(
                  <div>
                    <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase',
                      letterSpacing:'.06em', color:T.ink4, marginBottom:10 }}>
                      Histórico — {oc.nomeCliente||'cliente'}
                    </p>
                    {csatData.clientHistory.map((h,i)=>{
                      const m = SCORE[h.score]||SCORE[3]
                      return (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:12,
                          padding:'10px 0', borderBottom:`1px solid ${T.sep}` }}>
                          <span style={{ fontSize:20 }}>{m.emoji}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:11, fontWeight:600, color:T.ink1, margin:0 }}>
                              {h.ticket_id} · {h.score}/5 — {m.label}
                            </p>
                            {h.comentario&&(
                              <p style={{ fontSize:10, color:T.ink3, margin:0,
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                "{h.comentario}"
                              </p>
                            )}
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
      </div>

      {editModal&&(
        <ModalOcorrencia api={api} ocorrencia={oc}
          onSalvo={()=>{onAtualizado();setEditModal(false)}}
          onClose={()=>setEditModal(false)}/>
      )}
    </>
  )
}

// ── TICKET ROW ─────────────────────────────────────────────────────────────────
function TicketRow({ oc, ativo, onClick }) {
  const S   = STATUS[oc.status]   || STATUS.aberta
  const T_  = TIPOS[oc.tipo]      || TIPOS.outro
  const P   = PRIO[oc.prioridade] || PRIO.normal
  const ur  = oc.prioridade==='urgente'&&!['resolvida','encerrada'].includes(oc.status)
  const TIcon = T_.icon, SIcon = S.icon, PIcon = P.icon
  return (
    <div onClick={onClick}
      style={{
        display:'grid', gridTemplateColumns:'2fr 1.5fr 0.9fr 0.9fr 0.9fr 0.5fr',
        alignItems:'center', cursor:'pointer', transition:'background .1s',
        padding:'13px 20px', borderBottom:`1px solid ${T.sep}`,
        borderLeft:ativo?`3px solid ${T.accent}`:ur?`3px solid ${T.red}`:'3px solid transparent',
        background:ativo?T.accentDim:'transparent',
      }}
      onMouseEnter={e=>{ if(!ativo) e.currentTarget.style.background=T.bg2 }}
      onMouseLeave={e=>{ if(!ativo) e.currentTarget.style.background='transparent' }}>

      {/* Ticket + título */}
      <div style={{ minWidth:0, paddingRight:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
          <span style={{ fontSize:10, fontFamily:'monospace', fontWeight:700,
            color:ativo?T.accent:T.ink4 }}>
            {oc.ticketId}
          </span>
          {ur&&<Zap size={9} style={{ color:T.red, animation:'pulse 1.5s ease infinite' }}/>}
        </div>
        <p style={{ fontSize:13, fontWeight:600, color:T.ink1, margin:0,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {oc.titulo||oc.descricao?.slice(0,52)||'—'}
        </p>
      </div>

      {/* Cliente */}
      <div style={{ minWidth:0, paddingRight:12 }}>
        <p style={{ fontSize:12, fontWeight:500, color:T.ink2, margin:0,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {oc.nomeCliente||oc.telefone||'—'}
        </p>
        <p style={{ fontSize:10, color:T.ink4, display:'flex', alignItems:'center', gap:3, marginTop:2 }}>
          {oc.numeroPedido?<><Package size={9}/>#{oc.numeroPedido}</>:'Sem pedido'}
        </p>
      </div>

      {/* Tipo */}
      <div><Bdg color={T_.color} dim={T_.dim} bor={T_.bor}><TIcon size={9}/>{T_.label}</Bdg></div>

      {/* Prioridade */}
      <div>
        <span style={{ fontSize:11, fontWeight:600, color:P.color,
          display:'flex', alignItems:'center', gap:4 }}>
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

      {/* Tempo */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:6 }}>
        <span style={{ fontSize:10, color:T.ink4 }}>{fmtRel(oc.criadoEm)}</span>
        <ChevronRight size={13} style={{ color:T.ink4 }}/>
      </div>
    </div>
  )
}

// ── PÁGINA PRINCIPAL ───────────────────────────────────────────────────────────
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
      if (filtroSt!=='todos')   p.set('status',    filtroSt)
      if (filtroTipo!=='todos') p.set('tipo',      filtroTipo)
      if (filtroPrio!=='todos') p.set('prioridade',filtroPrio)
      const r = await fetch(`${api}/api/ocorrencias?${p}`)
      if (r.ok) { const d=await r.json(); setOcorrencias(d.ocorrencias||[]); setStats(d.stats||{}) }
    } catch {}
    setLoading(false)
  }, [api, filtroSt, filtroTipo, filtroPrio])

  useEffect(()=>{ carregar() }, [carregar])

  // Keyboard shortcuts
  useEffect(()=>{
    const h = e => {
      if (e.key==='Escape') { setDrawer(null); setModalNova(false) }
      if (e.key==='n'&&!e.metaKey&&!e.ctrlKey&&!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLTextAreaElement)) setModalNova(true)
    }
    window.addEventListener('keydown', h)
    return ()=>window.removeEventListener('keydown', h)
  }, [])

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

  const filtradas = useMemo(()=>ocorrencias.filter(oc=>{
    if (!busca) return true
    const b = busca.toLowerCase()
    return (oc.nomeCliente||'').toLowerCase().includes(b)
      ||(oc.titulo||'').toLowerCase().includes(b)
      ||(oc.descricao||'').toLowerCase().includes(b)
      ||(oc.ticketId||'').toLowerCase().includes(b)
      ||(oc.numeroPedido||'').includes(busca)
      ||(oc.telefone||'').includes(busca)
      ||(oc.email||'').toLowerCase().includes(b)
  }), [ocorrencias, busca])

  const urgentes = filtradas.filter(o=>o.prioridade==='urgente'&&!['resolvida','encerrada'].includes(o.status))

  const KPIS = [
    { l:'Total',      v:parseInt(stats.total||0),        color:T.ink1,  bar:'transparent', fn:()=>{setFiltroSt('todos');setFiltroPrio('todos')} },
    { l:'Abertas',    v:parseInt(stats.abertas||0),      color:T.amber, bar:T.amber,       fn:()=>setFiltroSt('aberta')       },
    { l:'Em análise', v:parseInt(stats.em_andamento||0), color:T.blue,  bar:T.blue,        fn:()=>setFiltroSt('em_andamento') },
    { l:'Resolvidas', v:parseInt(stats.resolvidas||0),   color:T.green, bar:T.green,       fn:()=>setFiltroSt('resolvida')    },
    { l:'Encerradas', v:parseInt(stats.encerradas||0),   color:T.ink3,  bar:T.ink4,        fn:()=>setFiltroSt('encerrada')    },
    { l:'Urgentes',   v:parseInt(stats.urgentes||0),     color:T.red,   bar:T.red,         fn:()=>setFiltroPrio('urgente')    },
  ]

  const selSt2 = {
    height:36, padding:'0 12px', background:T.bg2, border:`1px solid ${T.sep2}`,
    borderRadius:8, fontSize:12, color:T.ink2, cursor:'pointer', outline:'none',
    appearance:'auto',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden',
      background:T.bg0 }}>

      <style>{`
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideFromRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        ::-webkit-scrollbar      {width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:99px}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ flexShrink:0, padding:'24px 28px 20px',
        background:T.bg1, borderBottom:`1px solid ${T.sep2}` }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.ink1, marginBottom:4,
              letterSpacing:'-.025em' }}>
              Ocorrências & Chamados
            </h1>
            <p style={{ fontSize:12, color:T.ink3 }}>
              CRM de tickets · Integração Bling · CSAT automático
              <kbd style={{ marginLeft:12, fontSize:9, padding:'1px 6px', borderRadius:4,
                background:T.bg4, border:`1px solid ${T.sep2}`, color:T.ink4 }}>N</kbd>
              <span style={{ fontSize:10, color:T.ink4, marginLeft:4 }}>novo chamado</span>
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={carregar} style={{ width:34, height:34, borderRadius:8, flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink3, cursor:'pointer' }}>
              <RefreshCw size={14} style={loading?{animation:'spin 1s linear infinite'}:{}}/>
            </button>
            <button onClick={()=>setModalNova(true)} style={{ display:'flex', alignItems:'center',
              gap:6, padding:'8px 16px', borderRadius:9, fontSize:13, fontWeight:700,
              background:'linear-gradient(135deg,#5b21b6,#9333ea)', color:'#fff',
              border:'none', cursor:'pointer' }}>
              <Plus size={15}/>Novo chamado
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 }}>
          {KPIS.map(k=>(
            <div key={k.l} onClick={k.fn} style={{ position:'relative', overflow:'hidden',
              cursor:'pointer', transition:'background .1s', borderRadius:12,
              background:T.bg2, border:`1px solid ${T.sep2}`, padding:'14px 16px' }}
              onMouseEnter={e=>e.currentTarget.style.background=T.bg3}
              onMouseLeave={e=>e.currentTarget.style.background=T.bg2}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2.5, background:k.bar }}/>
              <p style={{ fontSize:28, fontWeight:800, lineHeight:1, marginBottom:4,
                color:k.color, fontVariantNumeric:'tabular-nums', letterSpacing:'-.03em' }}>{k.v}</p>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase',
                letterSpacing:'.06em', color:T.ink4 }}>{k.l}</p>
            </div>
          ))}
        </div>

        {/* Alerta urgentes */}
        {urgentes.length>0&&(
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px',
            borderRadius:10, marginBottom:16,
            background:T.redDim, border:`1px solid ${T.redBor}` }}>
            <Zap size={12} style={{ color:T.red, animation:'pulse 1.5s ease infinite', flexShrink:0 }}/>
            <p style={{ fontSize:11, fontWeight:600, color:T.red, flex:1, margin:0 }}>
              {urgentes.length} chamado{urgentes.length>1?'s':''} urgente{urgentes.length>1?'s':''} aguardando atenção
            </p>
            <button onClick={()=>setFiltroPrio('urgente')} style={{ fontSize:10, fontWeight:700,
              padding:'3px 10px', borderRadius:6, background:T.redDim,
              border:`1px solid ${T.redBor}`, color:T.red, cursor:'pointer' }}>
              Filtrar
            </button>
          </div>
        )}

        {/* Filtros */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, height:36, padding:'0 12px',
            borderRadius:8, flex:'1 1 240px', maxWidth:320,
            background:T.bg2, border:`1px solid ${T.sep2}` }}>
            <Search size={13} style={{ color:T.ink4, flexShrink:0 }}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)}
              placeholder="TK-ID, cliente, pedido, telefone..."
              style={{ flex:1, background:'transparent', border:'none', outline:'none',
                fontSize:12, color:T.ink1 }}/>
            {busca&&(
              <button onClick={()=>setBusca('')} style={{ color:T.ink4, background:'none',
                border:'none', cursor:'pointer', display:'flex' }}>
                <X size={12}/>
              </button>
            )}
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

      {/* ── DATA GRID ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
        <div style={{ background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:12, overflow:'hidden' }}>

          {/* Cabeçalho */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 0.9fr 0.9fr 0.9fr 0.5fr',
            padding:'10px 20px', borderBottom:`1px solid ${T.sep}`, background:T.bg2,
            fontSize:10, fontWeight:700, textTransform:'uppercase',
            letterSpacing:'.07em', color:T.ink4 }}>
            {['Ticket / Assunto','Cliente','Tipo','Prioridade','Status','Aberto'].map(h=>(
              <span key={h}>{h}</span>
            ))}
          </div>

          {loading?(
            <div style={{ padding:'24px 20px', display:'flex', flexDirection:'column', gap:10 }}>
              {[...Array(5)].map((_,i)=>(
                <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 0.9fr 0.9fr 0.9fr 0.5fr', gap:16, alignItems:'center', padding:'12px 0' }}>
                  <Skel h={32} r={8}/>
                  <Skel h={24} r={6}/>
                  <Skel w={70} h={22} r={99}/>
                  <Skel w={60} h={16} r={4}/>
                  <Skel w={80} h={22} r={99}/>
                  <Skel w={40} h={16} r={4}/>
                </div>
              ))}
            </div>
          ):filtradas.length===0?(
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', padding:'80px 0', gap:12 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:T.bg3,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <AlertCircle size={22} style={{ color:T.ink4 }}/>
              </div>
              <p style={{ fontSize:13, fontWeight:600, color:T.ink3, margin:0 }}>
                {busca||filtroSt!=='todos'||filtroTipo!=='todos'||filtroPrio!=='todos'
                  ?'Nenhum chamado encontrado':'Nenhuma ocorrência registrada'}
              </p>
              {!busca&&filtroSt==='todos'&&filtroTipo==='todos'&&filtroPrio==='todos'&&(
                <button onClick={()=>setModalNova(true)} style={{ fontSize:12, fontWeight:700,
                  padding:'7px 16px', borderRadius:8,
                  background:'linear-gradient(135deg,#5b21b6,#9333ea)',
                  color:'#fff', border:'none', cursor:'pointer' }}>
                  Criar primeiro chamado
                </button>
              )}
            </div>
          ):(
            <>
              {filtradas.map(oc=>(
                <TicketRow key={oc.id} oc={oc} ativo={drawer?.id===oc.id} onClick={()=>setDrawer(oc)}/>
              ))}
              <div style={{ padding:'10px 20px', fontSize:11, color:T.ink4,
                borderTop:`0.5px solid ${T.sep}` }}>
                {filtradas.length} chamado{filtradas.length!==1?'s':''}{' '}
                {busca||filtroSt!=='todos'?'filtrado':'no total'}
              </div>
            </>
          )}
        </div>
      </div>

      {modalNova&&<ModalOcorrencia api={api} onSalvo={carregar} onClose={()=>setModalNova(false)}/>}
      {drawer&&(
        <TicketDrawer key={`${drawer.id}-${ver}`} oc={drawer} api={api}
          onAtualizado={aoAtualizar} onClose={()=>setDrawer(null)}/>
      )}
    </div>
  )
}
