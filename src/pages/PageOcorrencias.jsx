import { useState, useEffect, useCallback, useRef } from 'react'
import {
  AlertTriangle, CheckCircle, Clock, RefreshCw, Plus, X,
  Search, ShieldAlert, Package, Truck, CreditCard, Tag,
  MoreHorizontal, Paperclip, Sparkles, Mail, Phone, User,
  ChevronRight, Save, Send, ArrowUpRight, Zap, History,
  MapPin, FileText, AlertCircle, RotateCcw, MessageSquare,
  ExternalLink, Circle, XCircle
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Metadados ─────────────────────────────────────────────────────────────────
const STATUS = {
  aberta:       { label:'Aberta',       cor:'#d97706', bg:'rgba(245,158,11,0.15)',  dot:'#f59e0b', icon:Circle      },
  em_andamento: { label:'Em análise',   cor:'#3b82f6', bg:'rgba(59,130,246,0.15)',  dot:'#3b82f6', icon:RefreshCw   },
  resolvida:    { label:'Resolvida',    cor:'#16a34a', bg:'rgba(22,163,74,0.15)',   dot:'#22c55e', icon:CheckCircle },
  encerrada:    { label:'Encerrada',    cor:'var(--label-3)', bg:'var(--fill)',      dot:'var(--label-4)', icon:XCircle },
}

const PRIORIDADE = {
  baixa:   { label:'Baixa',   icon:ChevronRight,  cor:'var(--label-4)'  },
  normal:  { label:'Normal',  icon:Clock,         cor:'#3b82f6'          },
  alta:    { label:'Alta',    icon:AlertTriangle, cor:'#d97706'          },
  urgente: { label:'Urgente', icon:Zap,           cor:'#ef4444'          },
}

const TIPOS = {
  entrega:   { label:'Entrega',     icon:Truck,          tailwind:'text-purple-600 bg-purple-50' },
  atraso:    { label:'Atraso',      icon:Clock,          tailwind:'text-red-600 bg-red-50'       },
  extravio:  { label:'Extravio',    icon:ShieldAlert,    tailwind:'text-red-700 bg-red-50'       },
  troca:     { label:'Troca/Dev.',  icon:RotateCcw,      tailwind:'text-amber-600 bg-amber-50'   },
  pagamento: { label:'Pagamento',   icon:CreditCard,     tailwind:'text-blue-600 bg-blue-50'     },
  produto:   { label:'Produto',     icon:Package,        tailwind:'text-orange-600 bg-orange-50' },
  outro:     { label:'Outro',       icon:Tag,            tailwind:'text-[var(--label-3)] bg-[var(--bg-3)]'   },
}

const fmtData = ts => ts ? new Date(ts).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit'}) : '—'
const fmtHora = ts => ts ? new Date(ts).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}) : ''
const fmtRel  = ts => {
  if (!ts) return '—'
  const d = Math.floor((Date.now()-new Date(ts))/60000)
  if (d < 1) return 'agora'
  if (d < 60) return `${d}min`
  if (d < 1440) return `${Math.floor(d/60)}h`
  return `${Math.floor(d/1440)}d`
}
const fmtTel = t => { const n=(t||'').replace(/\D/g,'').replace(/^55/,''); return n.length===11?`(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`:t||'' }

// ── Modal criar/editar ────────────────────────────────────────────────────────
function ModalOcorrencia({ api, ocorrencia, onSalvo, onClose }) {
  const edit = !!ocorrencia
  const [f, setF] = useState(edit ? {
    telefone: ocorrencia.telefone||'', email: ocorrencia.email||'',
    nomeCliente: ocorrencia.nomeCliente||'', numeroPedido: ocorrencia.numeroPedido||'',
    titulo: ocorrencia.titulo||'', tipo: ocorrencia.tipo||'outro',
    prioridade: ocorrencia.prioridade||'normal', descricao: ocorrencia.descricao||'',
    atribuidoA: ocorrencia.atribuidoA||'',
  } : { telefone:'', email:'', nomeCliente:'', numeroPedido:'', titulo:'',
        tipo:'outro', prioridade:'normal', descricao:'', atribuidoA:'' })
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const set = (k,v) => setF(p=>({...p,[k]:v}))

  const salvar = async () => {
    if (!f.descricao.trim()) { setErro('Descrição obrigatória'); return }
    setSaving(true); setErro('')
    try {
      const r = await fetch(edit ? `${api}/api/ocorrencias/${ocorrencia.id}` : `${api}/api/ocorrencias`, {
        method: edit ? 'PATCH' : 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(f)
      })
      if (r.ok) { onSalvo?.(); onClose() }
      else { const d = await r.json(); setErro(d.erro || 'Erro ao salvar') }
    } catch { setErro('Erro de conexão') }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[var(--bg)]/60"/>
      <div className="relative w-full max-w-lg rounded-2xl bg-[var(--bg-2)] shadow-2xl flex flex-col overflow-hidden z-10"
        onClick={e=>e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg)]">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-1.5 rounded-lg"><Plus size={14} className="text-[var(--label-inv,#fff)]"/></div>
            <h2 className="text-[var(--label-inv,#fff)] font-bold text-sm">{edit ? 'Editar ocorrência' : 'Nova ocorrência'}</h2>
          </div>
          <button onClick={onClose} className="text-[var(--label-4)] hover:text-[var(--label-inv,#fff)]"><X size={18}/></button>
        </div>

        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--label-3)] mb-1 block">Tipo *</label>
              <select value={f.tipo} onChange={e=>set('tipo',e.target.value)} className="w-full px-3 py-2 rounded-xl text-[12px] bg-[var(--bg-3)] border border-[var(--sep)] outline-none focus:ring-2 focus:ring-blue-400">
                {Object.entries(TIPOS).map(([id,t])=><option key={id} value={id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--label-3)] mb-1 block">Prioridade *</label>
              <select value={f.prioridade} onChange={e=>set('prioridade',e.target.value)} className="w-full px-3 py-2 rounded-xl text-[12px] bg-[var(--bg-3)] border border-[var(--sep)] outline-none focus:ring-2 focus:ring-blue-400">
                {Object.entries(PRIORIDADE).map(([id,p])=><option key={id} value={id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--label-3)] mb-1 block">Título do chamado</label>
            <input value={f.titulo} onChange={e=>set('titulo',e.target.value)} placeholder="Ex: Pacote parado na transportadora há 5 dias"
              className="w-full px-3 py-2 rounded-xl text-[12px] bg-[var(--bg-3)] border border-[var(--sep)] outline-none focus:ring-2 focus:ring-blue-400"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--label-3)] mb-1 block">Nome do cliente</label>
              <input value={f.nomeCliente} onChange={e=>set('nomeCliente',e.target.value)} placeholder="Maria Silva"
                className="w-full px-3 py-2 rounded-xl text-[12px] bg-[var(--bg-3)] border border-[var(--sep)] outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--label-3)] mb-1 block">WhatsApp</label>
              <input value={f.telefone} onChange={e=>set('telefone',e.target.value)} placeholder="5519999999999"
                className="w-full px-3 py-2 rounded-xl text-[12px] bg-[var(--bg-3)] border border-[var(--sep)] outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--label-3)] mb-1 block">E-mail</label>
              <input value={f.email} onChange={e=>set('email',e.target.value)} placeholder="cliente@email.com"
                className="w-full px-3 py-2 rounded-xl text-[12px] bg-[var(--bg-3)] border border-[var(--sep)] outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--label-3)] mb-1 block">Nº pedido Bling</label>
              <input value={f.numeroPedido} onChange={e=>set('numeroPedido',e.target.value)} placeholder="226540"
                className="w-full px-3 py-2 rounded-xl text-[12px] bg-[var(--bg-3)] border border-[var(--sep)] outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--label-3)] mb-1 block">Atribuído a</label>
            <input value={f.atribuidoA} onChange={e=>set('atribuidoA',e.target.value)} placeholder="Nome do responsável"
              className="w-full px-3 py-2 rounded-xl text-[12px] bg-[var(--bg-3)] border border-[var(--sep)] outline-none focus:ring-2 focus:ring-blue-400"/>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--label-3)] mb-1 block">Descrição *</label>
            <textarea value={f.descricao} onChange={e=>set('descricao',e.target.value)} rows={4} placeholder="Descreva o problema detalhadamente..."
              className="w-full px-3 py-2 rounded-xl text-[12px] bg-[var(--bg-3)] border border-[var(--sep)] outline-none resize-none focus:ring-2 focus:ring-blue-400"/>
          </div>
          {erro && <p className="text-[11px] font-semibold text-red-600">{erro}</p>}
        </div>

        <div className="flex gap-3 px-5 pb-5 pt-2 bg-[var(--bg-3)] border-t border-[var(--sep)]">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-[var(--label-3)] hover:bg-[var(--fill)]">Cancelar</button>
          <button onClick={salvar} disabled={!f.descricao.trim()||saving}
            className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-[var(--label-inv,#fff)] bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Salvando...' : edit ? 'Salvar' : 'Criar chamado'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Drawer lateral de detalhes ────────────────────────────────────────────────
function TicketDrawer({ oc, api, onAtualizado, onClose }) {
  const [tab,       setTab]       = useState('timeline')
  const [resposta,  setResposta]  = useState('')
  const [nota,      setNota]      = useState('')
  const [salvando,  setSalvando]  = useState(false)
  const [refining,  setRefining]  = useState(false)
  const [blingData, setBlingData] = useState(null)
  const [blingLoad, setBlingLoad] = useState(false)
  const [editModal, setEditModal] = useState(false)

  const T = TIPOS[oc.tipo]   || TIPOS.outro
  const S = STATUS[oc.status]|| STATUS.aberta
  const P = PRIORIDADE[oc.prioridade] || PRIORIDADE.normal
  const TIcon = T.icon
  const SIcon = S.icon
  const PIcon = P.icon

  // Busca dados Bling ao abrir o drawer
  useEffect(() => {
    setBlingLoad(true)
    fetch(`${api}/api/ocorrencias/${oc.id}/bling`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBlingData(d) })
      .catch(() => {})
      .finally(() => setBlingLoad(false))
  }, [oc.id, api])

  const patch = async (body) => {
    setSalvando(true)
    try {
      const r = await fetch(`${api}/api/ocorrencias/${oc.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body)
      })
      if (r.ok) onAtualizado()
    } catch {}
    setSalvando(false)
  }

  // Muda status E envia mensagem automática via template do gatilho
  const mudarStatus = async (novoStatus) => {
    if (oc.status === novoStatus) return
    await patch({ status: novoStatus })
  }

  const enviarNota = async () => { if (!nota.trim()) return; await patch({ nota }); setNota('') }
  const enviarWA   = async () => { if (!resposta.trim()) return; await patch({ respostaCliente: resposta }); setResposta('') }

  const refinarIA = async () => {
    if (!resposta.trim()) return
    setRefining(true)
    try {
      const r = await fetch(`${api}/api/ia/melhorar-texto`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ texto: resposta, contexto: `Ocorrência: ${oc.titulo||oc.descricao}. Cliente: ${oc.nomeCliente}` })
      })
      if (r.ok) { const d = await r.json(); if (d.texto) setResposta(d.texto) }
    } catch {}
    setRefining(false)
  }

  const primeiroNome = oc.nomeCliente?.split(' ')[0] || 'cliente'

  // Apenas o corpo da resposta — o backend adiciona cabeçalho (TK-XXXX), citação do relato e rodapé automaticamente
  const TEMPLATES = [
    `Verificamos sua solicitação e nossa equipe já está atuando no caso. Em breve você receberá uma atualização completa.`,
    `Entramos em contato com a transportadora para acareação. O prazo de retorno é de 48h úteis. Assim que tivermos uma resposta, avisamos imediatamente.`,
    `Sua ocorrência foi resolvida! ${oc.numeroPedido ? `O pedido #${oc.numeroPedido} ` : 'Seu pedido '}foi regularizado. Qualquer dúvida, estamos à disposição.`,
    `Pedimos desculpas pelo inconveniente. Como forma de compensação, entraremos em contato para combinar a melhor solução para você.`,
  ]

  const cliente = blingData?.cliente
  const pedidos = blingData?.pedidos || []

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-[var(--bg)]/30"/>
      <div className="w-[600px] h-full flex flex-col bg-[var(--bg-2)] border-l border-[var(--sep)] shadow-2xl overflow-hidden"
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-5 bg-[var(--bg-3)] border-b border-[var(--sep)] flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-black text-[var(--label-4)]">{oc.ticketId}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5" style={{color:S.cor, background:S.bg}}>
                  <div className={`w-1.5 h-1.5 rounded-full ${S.dot}`}/>{S.label}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold" style={{color:P.cor}}>
                  <PIcon size={11}/>{P.label}
                </span>
              </div>
              <h2 className="text-[15px] font-bold text-[var(--label)] leading-tight">{oc.titulo || oc.descricao?.slice(0,60)}</h2>
            </div>
            <div className="flex gap-1.5 ml-4 flex-shrink-0">
              <button onClick={()=>setEditModal(true)} className="px-3 py-1.5 text-[11px] font-bold text-[var(--label-3)] bg-[var(--bg-2)] border border-[var(--sep)] rounded-lg hover:bg-[var(--bg-3)]">Editar</button>
              <button onClick={onClose} className="p-1.5 text-[var(--label-4)] hover:text-[var(--label-2)] hover:bg-[var(--fill)] rounded-lg"><X size={18}/></button>
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-[9px] font-bold text-[var(--label-4)] uppercase tracking-wider mb-1">Tipo</p>
              <div className="flex items-center gap-1 text-[11px] font-bold" style={{color:T.cor}}>
                <TIcon size={12}/>{T.label}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-[var(--label-4)] uppercase tracking-wider mb-1">Atribuído a</p>
              <p className="text-[11px] font-semibold text-[var(--label-2)]">{oc.atribuidoA || '—'}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-[var(--label-4)] uppercase tracking-wider mb-1">Pedido ERP</p>
              {oc.numeroPedido
                ? <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600">#{oc.numeroPedido}<ArrowUpRight size={11}/></span>
                : <span className="text-[11px] text-[var(--label-4)]">—</span>
              }
            </div>
            <div>
              <p className="text-[9px] font-bold text-[var(--label-4)] uppercase tracking-wider mb-1">Aberta há</p>
              <p className="text-[11px] font-semibold text-[var(--label-2)]">{fmtRel(oc.criadoEm)}</p>
            </div>
          </div>

          {/* Status actions */}
          <div className="flex items-center gap-2 mt-4 bg-[var(--bg-2)] p-1.5 rounded-lg border border-[var(--sep)] w-max">
            <span className="text-[9px] font-bold text-[var(--label-4)] uppercase tracking-wider ml-1.5 mr-1">Marcar como:</span>
            {Object.entries(STATUS).filter(([k])=>k!=='encerrada').map(([key,s])=>(
              <button key={key} onClick={()=>mudarStatus(key)} disabled={salvando}
                className="px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1"
                style={oc.status===key
                  ? {color:s.cor, background:s.bg, boxShadow:'0 1px 2px rgba(0,0,0,.12)'}
                  : {color:'var(--label-3)'}}>
                {salvando && oc.status!==key ? null : null}
                {s.label}
                {oc.status===key && <span className="text-[8px] opacity-60 ml-0.5">✓</span>}
              </button>
            ))}
            <button onClick={()=>mudarStatus('encerrada')} disabled={salvando}
              className="px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1"
              style={oc.status==='encerrada' ? {color:STATUS.encerrada.cor, background:STATUS.encerrada.bg} : {color:'var(--label-4)'}}>
              Encerrar
              {oc.status==='encerrada' && <span className="text-[8px] opacity-60 ml-0.5">✓</span>}
            </button>
          </div>
          <p className="text-[9px] mt-1.5 ml-1" style={{color:'var(--label-4)'}}>
            💬 Mensagem automática enviada ao cliente ao mudar o status
          </p>
        </div>

        {/* Cliente (Bling) */}
        {(blingLoad || cliente) && (
          <div className="px-6 py-3 border-b border-[var(--sep)] bg-[var(--bg-3)]/50 flex-shrink-0">
            {blingLoad ? (
              <div className="flex items-center gap-2 text-[11px] text-[var(--label-4)]">
                <RefreshCw size={12} className="animate-spin"/><span>Buscando dados no Bling...</span>
              </div>
            ) : cliente ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--fill)] flex items-center justify-center text-[var(--label-3)] font-bold text-sm flex-shrink-0">
                  {(cliente.nome||oc.nomeCliente||'?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-bold text-[var(--label)]">{cliente.nome || oc.nomeCliente}</h3>
                    {cliente.origem === 'bling' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">BLING</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                    {(cliente.email || oc.email) && (
                      <span className="flex items-center gap-1 text-[10px] text-[var(--label-3)]"><Mail size={11}/>{cliente.email||oc.email}</span>
                    )}
                    {oc.telefone && (
                      <span className="flex items-center gap-1 text-[10px] text-[var(--label-3)]"><Phone size={11}/>{fmtTel(oc.telefone)}</span>
                    )}
                    {cliente.cidade && (
                      <span className="flex items-center gap-1 text-[10px] text-[var(--label-3)]"><MapPin size={11}/>{cliente.cidade}{cliente.estado && ` · ${cliente.estado}`}</span>
                    )}
                    {cliente.cpf_cnpj && (
                      <span className="flex items-center gap-1 text-[10px] text-[var(--label-4)]"><FileText size={10}/>{cliente.cpf_cnpj}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Pedidos do Bling */}
        {pedidos.length > 0 && (
          <div className="px-6 py-3 border-b border-[var(--sep)] bg-[var(--bg-2)] flex-shrink-0">
            <p className="text-[9px] font-bold text-[var(--label-4)] uppercase tracking-wider mb-2">Pedidos no Bling</p>
            <div className="space-y-1.5">
              {pedidos.map((p,i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-[var(--bg-3)] border border-[var(--sep)]">
                  <Package size={12} className="text-[var(--label-4)] flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-[var(--label-2)]">#{p.numero}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{p.situacao}</span>
                      <span className="text-[11px] font-bold text-emerald-600">{p.total}</span>
                      {p.transportadora && <span className="text-[10px] text-[var(--label-4)] flex items-center gap-1"><Truck size={9}/>{p.transportadora}</span>}
                    </div>
                    {p.rastreio && (
                      <p className="text-[10px] text-blue-600 mt-0.5 font-medium flex items-center gap-1"><Package size={9}/>{p.rastreio}</p>
                    )}
                    {p.itens?.length > 0 && (
                      <p className="text-[10px] text-[var(--label-4)] mt-0.5 truncate">{p.itens.map(i=>`${i.nome} (${i.quantidade}x)`).join(', ')}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--label-4)] flex-shrink-0">{p.data}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs + conteúdo */}
        <div className="flex border-b border-[var(--sep)] flex-shrink-0">
          {[['timeline','Timeline','History'],['whatsapp','WhatsApp','MessageSquare'],['email','E-mail','Mail'],['nota','Nota interna','FileText']].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`flex-1 py-2.5 text-[11px] font-bold border-b-2 transition-all ${
                tab===id
                  ? id==='nota' ? 'text-amber-600 border-amber-500 bg-amber-50/30'
                  : id==='email' ? 'text-blue-600 border-blue-500 bg-blue-50/30'
                  : id==='whatsapp' ? 'text-green-700 border-green-600 bg-green-50/30'
                  : 'text-[var(--label-2)] border-[var(--sep)]'
                  : 'text-[var(--label-4)] border-transparent hover:text-[var(--label-3)]'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* TIMELINE */}
          {tab === 'timeline' && (
            <div className="p-6">
              {/* Relato original */}
              <div className="flex items-start gap-3 mb-6">
                <div className="w-7 h-7 rounded-full bg-[var(--fill)] flex items-center justify-center flex-shrink-0">
                  <User size={13} className="text-[var(--label-3)]"/>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[var(--label-4)] uppercase tracking-wider mb-1.5">Relato original</p>
                  <div className="bg-[var(--bg-3)] border border-[var(--sep)] p-3.5 rounded-xl">
                    <p className="text-[12px] text-[var(--label-2)] leading-relaxed">{oc.descricao}</p>
                  </div>
                </div>
              </div>

              {/* Histórico real */}
              {(oc.historico||[]).length > 0 && (
                <div className="relative pl-4 border-l-2 border-[var(--sep)] space-y-5 mb-6">
                  {[...(oc.historico||[])].reverse().map((h,i) => {
                    const isStatus = h.acao?.startsWith('status')
                    const isWA     = h.acao === 'whatsapp'
                    const dotCls   = isStatus ? 'bg-blue-500' : isWA ? 'bg-green-500' : 'bg-[var(--fill)]'
                    const msgCls   = isStatus ? 'bg-blue-50 border-blue-100 text-blue-800' : isWA ? 'bg-green-50 border-green-100 text-green-800' : 'bg-amber-50 border-amber-100 text-amber-800'
                    return (
                      <div key={i} className="relative">
                        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-[var(--bg-2,white)] ${dotCls}`}/>
                        <p className="text-[9px] font-bold text-[var(--label-4)] uppercase tracking-wider mb-1">
                          {h.por||'sistema'} · {h.em ? fmtData(h.em)+' '+fmtHora(h.em) : ''}
                        </p>
                        <div className={`border p-3 rounded-xl text-[11px] font-medium leading-relaxed ${msgCls}`}>
                          {h.nota}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Adicionar nota */}
              <div className="border-t border-[var(--sep)] pt-4">
                <p className="text-[9px] font-bold text-[var(--label-4)] uppercase tracking-wider mb-2">Adicionar nota interna</p>
                <textarea value={nota} onChange={e=>setNota(e.target.value)} rows={3}
                  placeholder="Registrar informação interna sobre este chamado..."
                  className="w-full text-[12px] p-3 rounded-xl bg-[var(--bg-3)] border border-[var(--sep)] outline-none resize-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"/>
                <button onClick={enviarNota} disabled={!nota.trim()||salvando}
                  className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold bg-[var(--bg)] text-[var(--label-inv,#fff)] disabled:opacity-40">
                  <Save size={12}/>{salvando ? 'Salvando...' : 'Salvar nota'}
                </button>
              </div>
            </div>
          )}

          {/* WHATSAPP */}
          {tab === 'whatsapp' && (
            <div className="p-6">
              {/* Preview da estrutura da mensagem */}
              <div className="mb-4 rounded-xl overflow-hidden border border-[var(--sep)]">
                <div className="px-3 py-2 bg-[var(--bg)] flex items-center gap-2">
                  <MessageSquare size={12} className="text-green-400"/>
                  <span className="text-[10px] font-bold text-[var(--label-4)] uppercase tracking-wider">Preview — estrutura enviada ao cliente</span>
                </div>
                <div className="bg-[#e5ddd5] px-4 py-3 font-mono text-[10px] text-[var(--label-2)] space-y-1 leading-relaxed">
                  <p className="font-bold text-[var(--label)]">📋 Atualização — Protocolo {oc.ticketId}</p>
                  <p>Olá {primeiroNome}!</p>
                  <p className="text-[var(--label-3)] italic border-l-2 border-[var(--sep)] pl-2 my-1">
                    &gt; Sua solicitação:<br/>
                    &gt; {(oc.descricao||'').slice(0,80)}{oc.descricao?.length > 80 ? '...' : ''}
                  </p>
                  <p className="font-semibold">Nossa resposta:</p>
                  <p className="text-[var(--label-3)] italic">{resposta || <span className="text-[var(--label-4)]">[ sua resposta aparece aqui ]</span>}</p>
                  <p className="text-[var(--label-3)] border-t border-[var(--sep)] pt-1 mt-1">
                    🏷️ Status: {STATUS[oc.status]?.label || 'Aberta'}<br/>
                    📋 Protocolo: {oc.ticketId}<br/>
                    <span className="italic">Só Strass — Atendimento ao Cliente</span>
                  </p>
                </div>
              </div>

              {oc.respostaCliente && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--bg-3)] border border-[var(--sep)]">
                  <p className="text-[9px] font-bold text-[var(--label-4)] uppercase tracking-wider mb-1.5">Última resposta enviada</p>
                  <p className="text-[12px] text-[var(--label-2)]">{oc.respostaCliente}</p>
                </div>
              )}

              <p className="text-[9px] font-bold text-[var(--label-4)] uppercase tracking-wider mb-2">Respostas rápidas</p>
              <div className="flex gap-2 mb-3">
                {TEMPLATES.map((t,i)=>(
                  <button key={i} onClick={()=>setResposta(t)}
                    className="flex-1 px-2 py-2 rounded-lg text-[9px] text-left leading-tight bg-[var(--bg-3)] border border-[var(--sep)] text-[var(--label-3)] hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors">
                    Resposta {i+1}
                  </button>
                ))}
              </div>

              <div className={`border rounded-xl focus-within:ring-2 transition-all border-green-200 bg-green-50/30 focus-within:ring-green-500 focus-within:border-green-500`}>
                <textarea value={resposta} onChange={e=>setResposta(e.target.value)} rows={5}
                  placeholder={`Escrever para ${oc.nomeCliente?.split(' ')[0]||'o cliente'}...`}
                  className="w-full text-[12px] font-medium p-3 bg-transparent outline-none resize-none text-[var(--label)]"/>
                <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--sep)]/60">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-[var(--label-4)] hover:text-[var(--label-2)] hover:bg-[var(--fill)] rounded-md"><Paperclip size={15}/></button>
                    <button onClick={refinarIA} disabled={!resposta.trim()||refining}
                      className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-md flex items-center gap-1 text-[11px] font-bold disabled:opacity-40">
                      <Sparkles size={13} className={refining?'animate-spin':''}/> {refining?'Refinando...':'IA'}
                    </button>
                  </div>
                  <button onClick={enviarWA} disabled={!resposta.trim()||salvando||!oc.telefone}
                    className="px-4 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#25D366] hover:bg-[#1fba5c] disabled:opacity-50 flex items-center gap-1.5 shadow-sm">
                    {salvando?'Enviando...':'Enviar'}<Send size={13}/>
                  </button>
                </div>
              </div>
              {!oc.telefone && <p className="text-[10px] text-red-500 font-semibold mt-2">Telefone não cadastrado</p>}
            </div>
          )}

          {/* E-MAIL */}
          {tab === 'email' && (
            <div className="p-6">
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                <Mail size={13} className="text-blue-700 mt-0.5 flex-shrink-0"/>
                <p className="text-[11px] text-blue-800">
                  E-mail enviado para {cliente?.email||oc.email||'—'}. Registrado no histórico após envio.
                </p>
              </div>
              <div className="border border-blue-200 bg-blue-50/30 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                <textarea value={resposta} onChange={e=>setResposta(e.target.value)} rows={7}
                  placeholder={`Escreva o e-mail para ${oc.nomeCliente||'o cliente'}...`}
                  className="w-full text-[12px] font-medium p-3 bg-transparent outline-none resize-none text-[var(--label)]"/>
                <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--sep)]/60">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-[var(--label-4)] hover:text-[var(--label-2)] hover:bg-[var(--fill)] rounded-md"><Paperclip size={15}/></button>
                    <button onClick={refinarIA} disabled={!resposta.trim()||refining}
                      className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-md flex items-center gap-1 text-[11px] font-bold disabled:opacity-40">
                      <Sparkles size={13} className={refining?'animate-spin':''}/> {refining?'Refinando...':'IA'}
                    </button>
                  </div>
                  <button onClick={()=>patch({nota:`E-mail redigido (não enviado automaticamente): "${resposta.slice(0,80)}"`})}
                    disabled={!resposta.trim()||salvando||!oc.email&&!cliente?.email}
                    className="px-4 py-1.5 rounded-lg text-[11px] font-bold text-[var(--label-inv,#fff)] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm">
                    {salvando?'Enviando...':'Enviar'}<Send size={13}/>
                  </button>
                </div>
              </div>
              {!oc.email && !cliente?.email && <p className="text-[10px] text-red-500 font-semibold mt-2">E-mail não cadastrado</p>}
            </div>
          )}

          {/* NOTA */}
          {tab === 'nota' && (
            <div className="p-6">
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <FileText size={13} className="text-amber-700 mt-0.5 flex-shrink-0"/>
                <p className="text-[11px] text-amber-800">Nota interna — visível apenas para a equipe, não enviada ao cliente.</p>
              </div>
              <div className="border border-amber-200 bg-amber-50/30 rounded-xl focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500 transition-all">
                <textarea value={nota} onChange={e=>setNota(e.target.value)} rows={7}
                  placeholder="Registrar informação, contato com transportadora, acareação..." 
                  className="w-full text-[12px] font-medium p-3 bg-transparent outline-none resize-none text-[var(--label)]"/>
                <div className="flex items-center justify-end px-3 py-2 border-t border-[var(--sep)]/60">
                  <button onClick={enviarNota} disabled={!nota.trim()||salvando}
                    className="px-4 py-1.5 rounded-lg text-[11px] font-bold text-[var(--label-inv,#fff)] bg-amber-500 hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1.5 shadow-sm">
                    {salvando?'Salvando...':'Salvar nota'}<Save size={13}/>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {editModal && (
        <ModalOcorrencia api={api} ocorrencia={oc}
          onSalvo={() => { onAtualizado(); setEditModal(false) }}
          onClose={() => setEditModal(false)}/>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
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
  const [ver,         setVer]         = useState(0)   // força re-render do drawer

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (filtroSt   !== 'todos') p.set('status', filtroSt)
      if (filtroTipo !== 'todos') p.set('tipo',   filtroTipo)
      if (filtroPrio !== 'todos') p.set('prioridade', filtroPrio)
      const r = await fetch(`${api}/api/ocorrencias?${p}`)
      if (r.ok) { const d = await r.json(); setOcorrencias(d.ocorrencias||[]); setStats(d.stats||{}) }
    } catch {}
    setLoading(false)
  }, [api, filtroSt, filtroTipo, filtroPrio])

  useEffect(() => { carregar() }, [carregar])

  const aoAtualizar = async () => {
    await carregar()
    if (drawer) {
      try {
        const r = await fetch(`${api}/api/ocorrencias/${drawer.id}`)
        if (r.ok) { const d = await r.json(); setDrawer(d.ocorrencia) }
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

  const urgentes = filtradas.filter(o => o.prioridade==='urgente' && !['resolvida','encerrada'].includes(o.status))

  return (
    <div className="flex flex-col h-full overflow-hidden text-[var(--label)] antialiased" style={{background:'var(--bg)'}}>

      {/* Header */}
      <header className="px-8 py-5 bg-[var(--bg-2)] border-b border-[var(--sep)] flex-shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-black text-[var(--label)] tracking-tight">Ocorrências & Chamados</h1>
            <p className="text-[12px] font-medium text-[var(--label-3)] mt-0.5">CRM de tickets com integração Bling</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={carregar}
              className="p-2.5 bg-[var(--bg-2)] border border-[var(--sep)] rounded-xl text-[var(--label-3)] hover:bg-[var(--bg-3)] shadow-sm">
              <RefreshCw size={14} className={loading?'animate-spin':''}/>
            </button>
            <button onClick={()=>setModalNova(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--label)] hover:opacity-90 text-[var(--bg)] rounded-xl font-bold text-[13px] shadow-md">
              <Plus size={15} strokeWidth={3}/> Novo chamado
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-6 gap-3 mb-5">
          {[
            { label:'Total',       value: parseInt(stats.total||0),        cor:'text-[var(--label-2)]',  bg:'bg-[var(--bg-2)]',       filtro:()=>{ setFiltroSt('todos');       setFiltroPrio('todos') } },
            { label:'Abertas',     value: parseInt(stats.abertas||0),      cor:'text-amber-600',  bg:'bg-amber-50',    filtro:()=>setFiltroSt('aberta')       },
            { label:'Em análise',  value: parseInt(stats.em_andamento||0), cor:'text-blue-600',   bg:'bg-blue-50',     filtro:()=>setFiltroSt('em_andamento') },
            { label:'Resolvidas',  value: parseInt(stats.resolvidas||0),   cor:'text-green-600',  bg:'bg-green-50',    filtro:()=>setFiltroSt('resolvida')    },
            { label:'Encerradas',  value: parseInt(stats.encerradas||0),   cor:'text-[var(--label-3)]',  bg:'bg-[var(--bg-3)]',    filtro:()=>setFiltroSt('encerrada')    },
            { label:'Urgentes',    value: parseInt(stats.urgentes||0),     cor:'text-red-600',    bg:'bg-red-50',      filtro:()=>setFiltroPrio('urgente')    },
          ].map(k=>(
            <div key={k.label} onClick={k.filtro}
              className={`rounded-xl p-3.5 text-center cursor-pointer transition-all hover:shadow-md border border-[var(--sep)] ${k.bg}`}>
              <p className={`text-[26px] font-black leading-none mb-1 ${k.cor}`}>{k.value}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--label-3)]">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Alerta urgentes */}
        {urgentes.length > 0 && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 mb-4">
            <Zap size={13} className="text-red-500 fill-red-500 animate-pulse flex-shrink-0"/>
            <p className="text-[11px] font-bold text-red-700 flex-1">
              {urgentes.length} chamado{urgentes.length>1?'s':''} urgente{urgentes.length>1?'s':''} aguardando atenção imediata
            </p>
            <button onClick={()=>setFiltroPrio('urgente')}
              className="text-[10px] font-bold px-3 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200">
              Filtrar urgentes
            </button>
          </div>
        )}

        {/* Filtros + busca */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm group">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--label-4)] group-focus-within:text-blue-600"/>
            <input value={busca} onChange={e=>setBusca(e.target.value)}
              placeholder="Buscar por TK-ID, cliente, pedido..."
              className="w-full bg-[var(--bg-2)] border border-[var(--sep)] text-[12.5px] font-semibold rounded-xl pl-11 pr-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm"/>
          </div>

          <div className="flex items-center gap-1.5 border-l border-[var(--sep)] pl-3">
            <select value={filtroSt} onChange={e=>setFiltroSt(e.target.value)}
              className="px-3 py-2.5 bg-[var(--bg-2)] border border-[var(--sep)] text-[11px] font-semibold rounded-xl outline-none hover:bg-[var(--bg-3)] shadow-sm">
              <option value="todos">Status: Todos</option>
              {Object.entries(STATUS).map(([k,s])=><option key={k} value={k}>{s.label}</option>)}
            </select>
            <select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}
              className="px-3 py-2.5 bg-[var(--bg-2)] border border-[var(--sep)] text-[11px] font-semibold rounded-xl outline-none hover:bg-[var(--bg-3)] shadow-sm">
              <option value="todos">Tipo: Todos</option>
              {Object.entries(TIPOS).map(([k,t])=><option key={k} value={k}>{t.label}</option>)}
            </select>
            <select value={filtroPrio} onChange={e=>setFiltroPrio(e.target.value)}
              className="px-3 py-2.5 bg-[var(--bg-2)] border border-[var(--sep)] text-[11px] font-semibold rounded-xl outline-none hover:bg-[var(--bg-3)] shadow-sm">
              <option value="todos">Prioridade: Todos</option>
              {Object.entries(PRIORIDADE).map(([k,p])=><option key={k} value={k}>{p.label}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* Data Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-[var(--bg-2)] border border-[var(--sep)] rounded-2xl shadow-sm overflow-hidden">

          {/* Cabeçalho da tabela */}
          <div className="grid px-6 py-3.5 bg-[var(--bg-3)] border-b border-[var(--sep)] text-[10px] font-bold text-[var(--label-3)] uppercase tracking-wider"
            style={{ gridTemplateColumns:'2fr 1.8fr 1fr 1fr 1fr 0.7fr' }}>
            <span>Ticket / Assunto</span>
            <span>Cliente</span>
            <span>Tipo</span>
            <span>Prioridade</span>
            <span>Status</span>
            <span className="text-right">Aberto</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw size={16} className="animate-spin text-[var(--label-4)]"/>
            </div>
          ) : filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertCircle size={32} className="text-[var(--label-4)]"/>
              <p className="text-[13px] font-semibold text-[var(--label-3)]">
                {busca||filtroSt!=='todos'||filtroTipo!=='todos'||filtroPrio!=='todos' ? 'Nenhum chamado encontrado' : 'Nenhuma ocorrência registrada'}
              </p>
              {!busca && filtroSt==='todos' && filtroTipo==='todos' && filtroPrio==='todos' && (
                <button onClick={()=>setModalNova(true)}
                  className="text-[12px] font-bold px-4 py-2 rounded-xl bg-[var(--bg)] text-[var(--label-inv,#fff)] hover:bg-[var(--bg-inv-hover,#2d3240)]">
                  Criar primeiro chamado
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[var(--sep)]">
              {filtradas.map(oc => {
                const S = STATUS[oc.status]   || STATUS.aberta
                const T = TIPOS[oc.tipo]      || TIPOS.outro
                const P = PRIORIDADE[oc.prioridade] || PRIORIDADE.normal
                const urgente = oc.prioridade === 'urgente'
                const SIcon = S.icon
                const TIcon = T.icon
                const PIcon = P.icon

                return (
                  <div key={oc.id} onClick={()=>setDrawer(oc)}
                    className={`grid px-6 py-4 items-center hover:bg-blue-50/40 cursor-pointer transition-colors group ${urgente&&!['resolvida','encerrada'].includes(oc.status)?'border-l-4 border-l-red-500':''}`}
                    style={{ gridTemplateColumns:'2fr 1.8fr 1fr 1fr 1fr 0.7fr' }}>

                    {/* Ticket + título */}
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] font-black text-[var(--label-4)] group-hover:text-blue-600 transition-colors">
                          {oc.ticketId}
                        </span>
                        {urgente && !['resolvida','encerrada'].includes(oc.status) && (
                          <Zap size={11} className="text-red-500 fill-red-200 animate-pulse"/>
                        )}
                      </div>
                      <p className="text-[13px] font-bold text-[var(--label)] truncate">
                        {oc.titulo || oc.descricao?.slice(0,55) || '—'}
                      </p>
                    </div>

                    {/* Cliente + pedido */}
                    <div className="min-w-0 pr-4">
                      <p className="text-[12.5px] font-bold text-[var(--label)] truncate">{oc.nomeCliente||oc.telefone||'—'}</p>
                      {oc.numeroPedido
                        ? <p className="text-[10px] text-[var(--label-3)] flex items-center gap-1 mt-0.5"><Package size={10}/> Pedido #{oc.numeroPedido}</p>
                        : <p className="text-[10px] text-[var(--label-4)] mt-0.5">Sem pedido vinculado</p>
                      }
                    </div>

                    {/* Tipo */}
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{color:T.cor, background:T.bg}}>
                        <TIcon size={11}/>{T.label}
                      </span>
                    </div>

                    {/* Prioridade */}
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{color:P.cor}}>
                        <PIcon size={12}/>{P.label}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold" style={{color:S.cor, background:S.bg}}>
                        <div className={`w-1.5 h-1.5 rounded-full ${S.dot}`}/>{S.label}
                      </span>
                    </div>

                    {/* Tempo + seta */}
                    <div className="flex items-center justify-end gap-3 text-[11px] font-medium text-[var(--label-4)]">
                      {fmtRel(oc.criadoEm)}
                      <ChevronRight size={15} className="text-[var(--label-4)] group-hover:text-blue-500 transition-colors"/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {filtradas.length > 0 && (
            <div className="px-6 py-3 bg-[var(--bg-3)] border-t border-[var(--sep)] text-[11px] font-medium text-[var(--label-3)]">
              {filtradas.length} chamado{filtradas.length!==1?'s':''} {busca||filtroSt!=='todos'||filtroTipo!=='todos'||filtroPrio!=='todos'?'filtrado':'no total'}
            </div>
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
