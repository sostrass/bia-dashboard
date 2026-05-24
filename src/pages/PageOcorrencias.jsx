import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, RefreshCw, Plus, X, ChevronDown, ChevronUp,
  Truck, CreditCard, Package, RotateCcw, MessageSquare,
  AlertCircle, Clock, CheckCircle, User, Send, FileText,
  AlertTriangle, Clipboard, Filter, MoreVertical,
  ArrowUpRight, History, Tag, Phone
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Metadados ─────────────────────────────────────────────────────────────────
const TIPOS = [
  { id:'entrega',     label:'Entrega',     icon:Truck,          cor:'#4a9fff' },
  { id:'pagamento',   label:'Pagamento',   icon:CreditCard,     cor:'#22c55e' },
  { id:'produto',     label:'Produto',     icon:Package,        cor:'#f59e0b' },
  { id:'troca',       label:'Troca/Dev.',  icon:RotateCcw,      cor:'#a78bfa' },
  { id:'atendimento', label:'Atendimento', icon:MessageSquare,  cor:'#06b6d4' },
  { id:'geral',       label:'Geral',       icon:AlertCircle,    cor:'#6b7280' },
]

const STATUS = {
  aberta:        { label:'Aberta',       cor:'#f59e0b', bg:'rgba(245,158,11,0.12)',   icon:Clock       },
  em_andamento:  { label:'Em andamento', cor:'#4a9fff', bg:'rgba(74,159,255,0.12)',   icon:ArrowUpRight },
  resolvida:     { label:'Resolvida',    cor:'#22c55e', bg:'rgba(34,197,94,0.12)',    icon:CheckCircle },
  encerrada:     { label:'Encerrada',    cor:'#6b7280', bg:'rgba(107,114,128,0.12)', icon:X           },
}

const PRIORIDADES = [
  { id:'baixa',   label:'Baixa',   cor:'#6b7280', bg:'rgba(107,114,128,0.1)' },
  { id:'normal',  label:'Normal',  cor:'#4a9fff', bg:'rgba(74,159,255,0.1)'  },
  { id:'alta',    label:'Alta',    cor:'#f59e0b', bg:'rgba(245,158,11,0.1)'  },
  { id:'urgente', label:'Urgente', cor:'#ef4444', bg:'rgba(239,68,68,0.1)'   },
]

const fmtData = ts => ts ? new Date(ts).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—'
const fmtHora = ts => ts ? new Date(ts).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) : ''
const fmtRel  = ts => {
  if (!ts) return '—'
  const d = Math.floor((Date.now() - new Date(ts)) / 60000)
  if (d < 1)   return 'agora'
  if (d < 60)  return `${d}min`
  if (d < 1440) return `${Math.floor(d/60)}h`
  return `${Math.floor(d/1440)}d`
}
const fmtTel  = t => { const n=(t||'').replace(/\D/g,'').replace(/^55/,''); return n.length===11?`(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`:t||'' }

// ── Modal Nova / Editar Ocorrência ────────────────────────────────────────────
function ModalOcorrencia({ api, ocorrencia, onSalvo, onClose }) {
  const editando = !!ocorrencia
  const [form, setForm] = useState(editando ? {
    telefone:     ocorrencia.telefone      || '',
    nomeCliente:  ocorrencia.nomeCliente   || '',
    numeroPedido: ocorrencia.numeroPedido  || '',
    tipo:         ocorrencia.tipo          || 'geral',
    prioridade:   ocorrencia.prioridade    || 'normal',
    descricao:    ocorrencia.descricao     || '',
    atribuidoA:   ocorrencia.atribuidoA    || '',
  } : {
    telefone:'', nomeCliente:'', numeroPedido:'',
    tipo:'geral', prioridade:'normal', descricao:'', atribuidoA:''
  })
  const [salvando, setSalvando] = useState(false)
  const [erro,     setErro]     = useState('')

  const salvar = async () => {
    if (!form.descricao.trim()) { setErro('Descrição obrigatória'); return }
    setSalvando(true); setErro('')
    try {
      const url    = editando ? `${api}/api/ocorrencias/${ocorrencia.id}` : `${api}/api/ocorrencias`
      const method = editando ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (r.ok) { onSalvo?.(); onClose() }
      else { const d = await r.json(); setErro(d.erro || 'Erro ao salvar') }
    } catch { setErro('Erro de conexão') }
    setSalvando(false)
  }

  const F = 'w-full px-3 py-2 rounded-xl text-[12.5px] outline-none'
  const FS = { background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60"/>
      <div className="relative w-full max-w-lg rounded-2xl flex flex-col overflow-hidden"
        style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', zIndex:1 }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:'1px solid var(--sep)' }}>
          <h3 className="text-[15px] font-bold" style={{ color:'var(--label)' }}>
            {editando ? 'Editar ocorrência' : 'Nova ocorrência'}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ border:'1px solid var(--sep)', background:'var(--fill)' }}>
            <X size={13}/>
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">

          {/* Tipo + Prioridade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'var(--label-4)' }}>Tipo *</label>
              <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} className={F} style={FS}>
                {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'var(--label-4)' }}>Prioridade *</label>
              <select value={form.prioridade} onChange={e=>setForm(f=>({...f,prioridade:e.target.value}))} className={F} style={FS}>
                {PRIORIDADES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Nome + Telefone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'var(--label-4)' }}>Nome do cliente</label>
              <input value={form.nomeCliente} onChange={e=>setForm(f=>({...f,nomeCliente:e.target.value}))}
                placeholder="Maria Silva" className={F} style={FS}/>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'var(--label-4)' }}>Telefone</label>
              <input value={form.telefone} onChange={e=>setForm(f=>({...f,telefone:e.target.value}))}
                placeholder="5519999999999" className={F} style={FS}/>
            </div>
          </div>

          {/* Pedido + Atribuído */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'var(--label-4)' }}>Nº do pedido</label>
              <input value={form.numeroPedido} onChange={e=>setForm(f=>({...f,numeroPedido:e.target.value}))}
                placeholder="12345" className={F} style={FS}/>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'var(--label-4)' }}>Atribuído a</label>
              <input value={form.atribuidoA} onChange={e=>setForm(f=>({...f,atribuidoA:e.target.value}))}
                placeholder="Responsável" className={F} style={FS}/>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'var(--label-4)' }}>Descrição *</label>
            <textarea value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))}
              placeholder="Descreva a ocorrência com detalhes..." rows={4}
              className={`${F} resize-none`} style={FS}/>
          </div>

          {erro && <p className="text-[11px] font-semibold" style={{ color:'#ef4444' }}>{erro}</p>}
        </div>

        <div className="flex gap-3 px-5 pb-5 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold"
            style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>
            Cancelar
          </button>
          <button onClick={salvar} disabled={!form.descricao.trim() || salvando}
            className="flex-1 py-2.5 rounded-xl text-[12px] font-bold disabled:opacity-40"
            style={{ background:'var(--accent)', color:'#000' }}>
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar ocorrência'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Drawer de detalhes / timeline ─────────────────────────────────────────────
function DrawerOcorrencia({ oc, api, onAtualizado, onClose }) {
  const [nota,      setNota]     = useState('')
  const [resposta,  setResposta] = useState(oc.respostaCliente || '')
  const [salvando,  setSalvando] = useState(false)
  const [tab,       setTab]      = useState('timeline')
  const [editModal, setEditModal]= useState(false)

  const tipo  = TIPOS.find(t => t.id === oc.tipo) || TIPOS[5]
  const st    = STATUS[oc.status]                 || STATUS.aberta
  const prio  = PRIORIDADES.find(p => p.id === oc.prioridade) || PRIORIDADES[1]
  const TipoIcon = tipo.icon
  const StIcon   = st.icon

  const patch = async (body) => {
    setSalvando(true)
    try {
      const r = await fetch(`${api}/api/ocorrencias/${oc.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body)
      })
      if (r.ok) { onAtualizado() }
    } catch {}
    setSalvando(false)
  }

  const adicionarNota = async () => {
    if (!nota.trim()) return
    await patch({ nota })
    setNota('')
  }

  const enviarResposta = async () => {
    if (!resposta.trim()) return
    await patch({ respostaCliente: resposta, nota: `Resposta enviada ao cliente: "${resposta.slice(0,60)}..."` })
    setResposta('')
  }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/50"/>
      <div className="w-full max-w-xl h-full flex flex-col overflow-hidden"
        style={{ background:'var(--bg-2)', borderLeft:'1px solid var(--sep)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background:`${tipo.cor}18` }}>
            <TipoIcon size={16} style={{ color: tipo.cor }}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[14px] font-bold" style={{ color:'var(--label)' }}>
                {tipo.label} {oc.numeroPedido ? `· #${oc.numeroPedido}` : ''}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: prio.bg, color: prio.cor }}>{prio.label}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: st.bg, color: st.cor }}>
                <StIcon size={10}/>{st.label}
              </span>
            </div>
            <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color:'var(--label-3)' }}>{oc.descricao}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setEditModal(true)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
              style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>
              Editar
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ border:'1px solid var(--sep)', background:'var(--fill)' }}>
              <X size={13}/>
            </button>
          </div>
        </div>

        {/* Info rápida */}
        <div className="grid grid-cols-3 gap-px flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)', background:'var(--sep)' }}>
          {[
            { label:'Cliente',  value: oc.nomeCliente || fmtTel(oc.telefone) || '—', icon: User },
            { label:'Pedido',   value: oc.numeroPedido ? `#${oc.numeroPedido}` : '—', icon: FileText },
            { label:'Aberta há',value: fmtRel(oc.criadoEm), icon: Clock },
          ].map(({ label, value, icon: Ic }) => (
            <div key={label} className="px-4 py-2.5" style={{ background:'var(--bg-2)' }}>
              <p className="text-[9px] uppercase tracking-wider font-bold mb-0.5 flex items-center gap-1" style={{ color:'var(--label-4)' }}>
                <Ic size={9}/>{label}
              </p>
              <p className="text-[12px] font-semibold truncate" style={{ color:'var(--label)' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Mudar status */}
        <div className="flex gap-1.5 px-5 py-3 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)' }}>
          {Object.entries(STATUS).map(([key, s]) => {
            const Sic = s.icon
            const ativo = oc.status === key
            return (
              <button key={key} onClick={() => patch({ status: key })} disabled={ativo || salvando}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold flex-1 justify-center transition-all disabled:cursor-default"
                style={{
                  background: ativo ? s.bg      : 'var(--fill)',
                  color:      ativo ? s.cor     : 'var(--label-3)',
                  border:     ativo ? `1.5px solid ${s.cor}60` : '1px solid var(--sep)',
                }}>
                <Sic size={10}/>{s.label}
              </button>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor:'var(--sep)' }}>
          {[['timeline','Timeline','History'],['responder','Responder cliente','Send'],['detalhes','Detalhes','FileText']].map(([id,label,ic]) => {
            const Ic = { History, Send, FileText }[ic]
            return (
              <button key={id} onClick={()=>setTab(id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold border-b-2 transition-all"
                style={{ borderColor: tab===id ? 'var(--accent)' : 'transparent', color: tab===id ? 'var(--accent)' : 'var(--label-3)' }}>
                <Ic size={11}/>{label}
              </button>
            )
          })}
        </div>

        {/* Conteúdo das tabs */}
        <div className="flex-1 overflow-y-auto">

          {/* TAB: TIMELINE */}
          {tab === 'timeline' && (
            <div className="p-5">
              <div className="space-y-3 mb-5">
                {(oc.historico || []).length === 0
                  ? <p className="text-[12px] text-center py-4" style={{ color:'var(--label-4)' }}>Sem histórico ainda</p>
                  : [...(oc.historico || [])].reverse().map((h, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: h.acao?.startsWith('status') ? 'rgba(74,159,255,0.15)' : 'var(--fill)', border:'1px solid var(--sep)' }}>
                        {h.acao?.startsWith('status') ? <ArrowUpRight size={10} style={{ color:'#4a9fff' }}/> : <User size={10} style={{ color:'var(--label-4)' }}/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-semibold" style={{ color:'var(--label)' }}>{h.por || 'sistema'}</span>
                          <span className="text-[10px]" style={{ color:'var(--label-4)' }}>
                            {h.em ? fmtData(h.em) + ' ' + fmtHora(h.em) : ''}
                          </span>
                        </div>
                        <p className="text-[11.5px] leading-relaxed" style={{ color:'var(--label-2)' }}>{h.nota}</p>
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Adicionar nota */}
              <div style={{ borderTop:'1px solid var(--sep)', paddingTop:16 }}>
                <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color:'var(--label-4)' }}>Adicionar nota interna</p>
                <textarea value={nota} onChange={e=>setNota(e.target.value)}
                  placeholder="Anotação sobre a ocorrência..." rows={3}
                  className="w-full px-3 py-2 rounded-xl text-[12px] outline-none resize-none"
                  style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
                <button onClick={adicionarNota} disabled={!nota.trim() || salvando}
                  className="mt-2 px-4 py-2 rounded-xl text-[11px] font-bold disabled:opacity-40 flex items-center gap-1.5"
                  style={{ background:'var(--fill)', color:'var(--label)', border:'1px solid var(--sep)' }}>
                  <Plus size={12}/>{salvando ? 'Salvando...' : 'Adicionar nota'}
                </button>
              </div>
            </div>
          )}

          {/* TAB: RESPONDER CLIENTE */}
          {tab === 'responder' && (
            <div className="p-5">
              <div className="rounded-xl p-3 mb-4 flex items-start gap-2"
                style={{ background:'rgba(74,159,255,0.08)', border:'1px solid rgba(74,159,255,0.2)' }}>
                <MessageSquare size={13} style={{ color:'#4a9fff', marginTop:1, flexShrink:0 }}/>
                <p className="text-[11px]" style={{ color:'#4a9fff' }}>
                  A mensagem será enviada via WhatsApp para {fmtTel(oc.telefone) || 'o cliente'} e registrada no histórico da ocorrência.
                </p>
              </div>

              {oc.respostaCliente && (
                <div className="mb-4 rounded-xl p-3" style={{ background:'var(--bg)', border:'1px solid var(--sep)' }}>
                  <p className="text-[9px] uppercase tracking-wider font-bold mb-1.5" style={{ color:'var(--label-4)' }}>Última resposta enviada</p>
                  <p className="text-[12px]" style={{ color:'var(--label-2)' }}>{oc.respostaCliente}</p>
                </div>
              )}

              <label className="text-[10px] uppercase tracking-wider font-bold mb-2 block" style={{ color:'var(--label-4)' }}>Mensagem para o cliente</label>
              <textarea value={resposta} onChange={e=>setResposta(e.target.value)}
                placeholder={`Olá ${oc.nomeCliente || 'cliente'}, sobre sua ocorrência...`}
                rows={6} className="w-full px-3 py-2 rounded-xl text-[12px] outline-none resize-none"
                style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }}/>

              <div className="flex gap-2 mt-3">
                {[
                  `Olá ${oc.nomeCliente||'cliente'}, analisamos sua solicitação e em breve entraremos em contato.`,
                  `Olá ${oc.nomeCliente||'cliente'}, sua ocorrência foi resolvida. Qualquer dúvida estamos à disposição!`,
                  `Olá ${oc.nomeCliente||'cliente'}, pedimos desculpas pelo transtorno. Sua solicitação está sendo tratada com prioridade.`,
                ].map((txt, i) => (
                  <button key={i} onClick={()=>setResposta(txt)}
                    className="flex-1 px-2 py-1.5 rounded-lg text-[9px] text-left leading-tight transition-colors"
                    style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>
                    Resposta {i+1}
                  </button>
                ))}
              </div>

              <button onClick={enviarResposta} disabled={!resposta.trim() || salvando || !oc.telefone}
                className="w-full mt-4 py-2.5 rounded-xl text-[12px] font-bold disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background:'var(--accent)', color:'#000' }}>
                <Send size={13}/>{salvando ? 'Enviando...' : 'Enviar via WhatsApp'}
              </button>

              {!oc.telefone && (
                <p className="text-[10px] mt-2 text-center" style={{ color:'#ef4444' }}>
                  Telefone não cadastrado — adicione para poder enviar mensagens.
                </p>
              )}
            </div>
          )}

          {/* TAB: DETALHES */}
          {tab === 'detalhes' && (
            <div className="p-5 space-y-4">
              {[
                { label:'ID',          value:`#${oc.id}` },
                { label:'Tipo',        value: TIPOS.find(t=>t.id===oc.tipo)?.label },
                { label:'Prioridade',  value: PRIORIDADES.find(p=>p.id===oc.prioridade)?.label },
                { label:'Status',      value: STATUS[oc.status]?.label },
                { label:'Cliente',     value: oc.nomeCliente || '—' },
                { label:'Telefone',    value: fmtTel(oc.telefone) || '—' },
                { label:'Pedido',      value: oc.numeroPedido ? `#${oc.numeroPedido}` : '—' },
                { label:'Atribuído a', value: oc.atribuidoA  || '—' },
                { label:'Criada em',   value: oc.criadoEm   ? `${fmtData(oc.criadoEm)} ${fmtHora(oc.criadoEm)}` : '—' },
                { label:'Atualizada',  value: oc.atualizadoEm ? `${fmtData(oc.atualizadoEm)} ${fmtHora(oc.atualizadoEm)}` : '—' },
                { label:'Resolvida em',value: oc.resolvidoEm ? `${fmtData(oc.resolvidoEm)} ${fmtHora(oc.resolvidoEm)}` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom:'0.5px solid var(--sep)' }}>
                  <span className="text-[11px] font-medium" style={{ color:'var(--label-4)' }}>{label}</span>
                  <span className="text-[12px] font-semibold" style={{ color:'var(--label)' }}>{value}</span>
                </div>
              ))}

              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color:'var(--label-4)' }}>Descrição completa</p>
                <p className="text-[12.5px] leading-relaxed" style={{ color:'var(--label-2)' }}>{oc.descricao}</p>
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

// ── Card na lista ─────────────────────────────────────────────────────────────
function OcCard({ oc, onClick }) {
  const tipo = TIPOS.find(t => t.id === oc.tipo) || TIPOS[5]
  const st   = STATUS[oc.status]                  || STATUS.aberta
  const prio = PRIORIDADES.find(p => p.id === oc.prioridade) || PRIORIDADES[1]
  const TipoIcon = tipo.icon
  const urgente  = oc.prioridade === 'urgente'

  return (
    <div onClick={onClick}
      className="flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors hover:bg-[var(--bg-3)]"
      style={{ borderBottom:'0.5px solid var(--sep)', borderLeft: urgente ? '3px solid #ef4444' : '3px solid transparent' }}>

      {/* Ícone tipo */}
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background:`${tipo.cor}15` }}>
        <TipoIcon size={15} style={{ color: tipo.cor }}/>
      </div>

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[12.5px] font-semibold truncate" style={{ color:'var(--label)' }}>
            {oc.nomeCliente || fmtTel(oc.telefone) || 'Cliente desconhecido'}
          </span>
          {oc.numeroPedido && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono flex-shrink-0"
              style={{ background:'var(--fill)', color:'var(--label-3)', border:'0.5px solid var(--sep)' }}>
              #{oc.numeroPedido}
            </span>
          )}
        </div>
        <p className="text-[11px] truncate" style={{ color:'var(--label-3)' }}>{oc.descricao}</p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Prioridade (só alta e urgente) */}
        {(oc.prioridade === 'alta' || oc.prioridade === 'urgente') && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: prio.bg, color: prio.cor }}>{prio.label}</span>
        )}

        {/* Status */}
        <span className="text-[10px] font-semibold px-2 py-1 rounded-lg"
          style={{ background: st.bg, color: st.cor }}>{st.label}</span>

        {/* Tempo relativo */}
        <span className="text-[10px] w-8 text-right" style={{ color:'var(--label-4)' }}>
          {fmtRel(oc.criadoEm)}
        </span>
      </div>
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
  const [drawer,      setDrawer]      = useState(null)   // ocorrência selecionada
  const [filtroSt,    setFiltroSt]    = useState('todos')
  const [filtroTipo,  setFiltroTipo]  = useState('todos')
  const [filtroPrio,  setFiltroPrio]  = useState('todos')
  const [busca,       setBusca]       = useState('')
  const [versaoDrawer,setVersaoDrawer]= useState(0)      // força re-fetch do drawer

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroSt   !== 'todos') params.set('status',    filtroSt)
      if (filtroTipo !== 'todos') params.set('tipo',      filtroTipo)
      if (filtroPrio !== 'todos') params.set('prioridade',filtroPrio)
      const r = await fetch(`${api}/api/ocorrencias?${params}`)
      if (r.ok) {
        const d = await r.json()
        setOcorrencias(d.ocorrencias || [])
        setStats(d.stats || {})
      }
    } catch {}
    setLoading(false)
  }, [api, filtroSt, filtroTipo, filtroPrio])

  useEffect(() => { carregar() }, [carregar])

  // Quando atualiza, re-busca a ocorrência do drawer para refletir mudanças
  const aoAtualizar = async () => {
    await carregar()
    if (drawer) {
      try {
        const r = await fetch(`${api}/api/ocorrencias/${drawer.id}`)
        if (r.ok) { const d = await r.json(); setDrawer(d.ocorrencia) }
      } catch {}
    }
    setVersaoDrawer(v => v+1)
  }

  const filtradas = ocorrencias.filter(oc => {
    if (!busca) return true
    const b = busca.toLowerCase()
    return (oc.descricao||'').toLowerCase().includes(b)
      || (oc.nomeCliente||'').toLowerCase().includes(b)
      || (oc.telefone||'').includes(busca)
      || (oc.numeroPedido||'').includes(busca)
  })

  const urgentes = filtradas.filter(o => o.prioridade === 'urgente' && !['resolvida','encerrada'].includes(o.status))

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background:'var(--bg)' }}>

      {/* Header */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color:'var(--label)' }}>Ocorrências</h1>
            <p className="text-[12px] mt-0.5" style={{ color:'var(--label-3)' }}>
              CRM de problemas, solicitações e acompanhamento de clientes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={carregar}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-3)' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>
            </button>
            <button onClick={() => setModalNova(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[12px]"
              style={{ background:'var(--accent)', color:'#000' }}>
              <Plus size={14}/>Nova ocorrência
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {[
            { label:'Total',       value: parseInt(stats.abertas||0) + parseInt(stats.em_andamento||0) + parseInt(stats.resolvidas||0), cor:'var(--label)',  bg:'var(--bg)' },
            { label:'Abertas',     value: parseInt(stats.abertas||0),      cor:'#f59e0b', bg:'rgba(245,158,11,0.06)'  },
            { label:'Em andamento',value: parseInt(stats.em_andamento||0), cor:'#4a9fff', bg:'rgba(74,159,255,0.06)'  },
            { label:'Resolvidas',  value: parseInt(stats.resolvidas||0),   cor:'#22c55e', bg:'rgba(34,197,94,0.06)'   },
            { label:'Urgentes',    value: parseInt(stats.urgentes||0),     cor:'#ef4444', bg:'rgba(239,68,68,0.06)'   },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-3 text-center cursor-pointer transition-all hover:opacity-80"
              style={{ background: k.bg, border:'1px solid var(--sep)' }}
              onClick={() => {
                if (k.label === 'Abertas')      setFiltroSt('aberta')
                if (k.label === 'Em andamento') setFiltroSt('em_andamento')
                if (k.label === 'Resolvidas')   setFiltroSt('resolvida')
                if (k.label === 'Urgentes')     setFiltroPrio('urgente')
                if (k.label === 'Total')        { setFiltroSt('todos'); setFiltroPrio('todos') }
              }}>
              <p className="text-[22px] font-bold leading-none mb-1" style={{ color: k.cor }}>{k.value}</p>
              <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color:'var(--label-4)' }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Alerta de urgentes */}
        {urgentes.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
            style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)' }}>
            <AlertTriangle size={13} style={{ color:'#ef4444', flexShrink:0 }}/>
            <p className="text-[11px] font-semibold flex-1" style={{ color:'#ef4444' }}>
              {urgentes.length} ocorrência{urgentes.length > 1 ? 's' : ''} urgente{urgentes.length > 1 ? 's' : ''} aguardando atenção
            </p>
            <button onClick={() => setFiltroPrio('urgente')}
              className="text-[10px] font-bold px-2 py-1 rounded-lg"
              style={{ background:'rgba(239,68,68,0.15)', color:'#ef4444' }}>
              Ver urgentes
            </button>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2">
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl"
            style={{ background:'var(--bg)', border:'1px solid var(--sep)' }}>
            <Search size={13} style={{ color:'var(--label-4)', flexShrink:0 }}/>
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome, pedido, telefone ou descrição..."
              className="flex-1 bg-transparent text-[12px] outline-none"
              style={{ color:'var(--label)' }}/>
            {busca && (
              <button onClick={() => setBusca('')} style={{ color:'var(--label-4)' }}>
                <X size={12}/>
              </button>
            )}
          </div>

          {/* Status filter pills */}
          <div className="flex gap-1">
            {[{id:'todos',label:'Todos'},...Object.entries(STATUS).map(([id,s])=>({id,label:s.label}))].map(s => (
              <button key={s.id} onClick={() => setFiltroSt(s.id)}
                className="px-3 py-1 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap"
                style={{
                  background: filtroSt===s.id ? (STATUS[s.id]?.bg||'var(--fill)') : 'var(--fill)',
                  color:      filtroSt===s.id ? (STATUS[s.id]?.cor||'var(--label)') : 'var(--label-3)',
                  border:     filtroSt===s.id ? `1px solid ${STATUS[s.id]?.cor||'var(--sep)'}50` : '1px solid var(--sep)',
                }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Tipo */}
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            className="px-3 py-2 rounded-xl text-[11px] outline-none"
            style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label-2)' }}>
            <option value="todos">Todos os tipos</option>
            {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>

          {/* Prioridade */}
          <select value={filtroPrio} onChange={e => setFiltroPrio(e.target.value)}
            className="px-3 py-2 rounded-xl text-[11px] outline-none"
            style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label-2)' }}>
            <option value="todos">Todas prioridades</option>
            {PRIORIDADES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto" style={{ background:'var(--bg)' }}>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw size={16} className="animate-spin" style={{ color:'var(--label-4)' }}/>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Clipboard size={32} style={{ color:'var(--label-4)', opacity:.25 }}/>
            <p className="text-[13px] font-medium" style={{ color:'var(--label-3)' }}>
              {busca || filtroSt !== 'todos' || filtroTipo !== 'todos' || filtroPrio !== 'todos'
                ? 'Nenhuma ocorrência encontrada com esses filtros'
                : 'Nenhuma ocorrência registrada ainda'}
            </p>
            {!busca && filtroSt === 'todos' && filtroTipo === 'todos' && filtroPrio === 'todos' && (
              <button onClick={() => setModalNova(true)}
                className="text-[12px] font-bold px-4 py-2 rounded-xl"
                style={{ background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent)' }}>
                Criar primeira ocorrência
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Cabeçalho da tabela */}
            <div className="flex items-center gap-4 px-4 py-2" style={{ borderBottom:'0.5px solid var(--sep)', background:'var(--bg-2)' }}>
              <div className="w-8 flex-shrink-0"/>
              <div className="flex-1 text-[9px] font-bold uppercase tracking-wider" style={{ color:'var(--label-4)' }}>Cliente / Descrição</div>
              <div className="flex-shrink-0 flex items-center gap-12 pr-1 text-[9px] font-bold uppercase tracking-wider" style={{ color:'var(--label-4)' }}>
                <span className="w-16 text-center">Prioridade</span>
                <span className="w-20 text-center">Status</span>
                <span className="w-8 text-right">Tempo</span>
              </div>
            </div>

            {filtradas.map(oc => (
              <OcCard key={oc.id} oc={oc} onClick={() => setDrawer(oc)}/>
            ))}

            <p className="text-center py-4 text-[11px]" style={{ color:'var(--label-4)' }}>
              {filtradas.length} ocorrência{filtradas.length !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>

      {/* Modal nova ocorrência */}
      {modalNova && (
        <ModalOcorrencia api={api} onSalvo={carregar} onClose={() => setModalNova(false)}/>
      )}

      {/* Drawer de detalhes */}
      {drawer && (
        <DrawerOcorrencia
          key={`${drawer.id}-${versaoDrawer}`}
          oc={drawer}
          api={api}
          onAtualizado={aoAtualizar}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  )
}
