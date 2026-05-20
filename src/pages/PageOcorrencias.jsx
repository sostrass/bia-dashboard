import { useState, useEffect, useCallback } from 'react'
import {
  AlertCircle, CheckCircle, Clock, RefreshCw, Plus, X,
  Send, User, ChevronDown, MessageSquare, Truck, Package,
  CreditCard, Tag, Filter, Search, Circle, XCircle, Zap, 
  Edit3, Save, Paperclip, Sparkles, Mail, Phone, MoreVertical,
  ShieldAlert, ExternalLink
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Dicionários e Meta-dados (Atualizados com os novos tipos) ────────────────
const STATUS = {
  aberta:       { label:'Aberta',       cor:'text-amber-600', bg:'bg-amber-100', dot:'bg-amber-500', icon:Circle },
  em_andamento: { label:'Em andamento', cor:'text-blue-600',  bg:'bg-blue-100',  dot:'bg-blue-500',  icon:RefreshCw },
  resolvida:    { label:'Resolvida',    cor:'text-green-600', bg:'bg-green-100', dot:'bg-green-500', icon:CheckCircle },
  encerrada:    { label:'Encerrada',    cor:'text-slate-600', bg:'bg-slate-100', dot:'bg-slate-500', icon:XCircle },
}

const PRIORIDADE = {
  baixa:   { label:'Baixa',   cor:'text-slate-600', bg:'bg-slate-100' },
  normal:  { label:'Normal',  cor:'text-blue-600',  bg:'bg-blue-100' },
  alta:    { label:'Alta',    cor:'text-amber-600', bg:'bg-amber-100' },
  urgente: { label:'Urgente', cor:'text-red-600',   bg:'bg-red-100' },
}

const TIPO = {
  entrega:   { label:'Entrega Padrão',    icon:Truck,       cor:'text-purple-600', bg:'bg-purple-100' },
  atraso:    { label:'Entrega Atrasada',  icon:Clock,       cor:'text-red-500',    bg:'bg-red-100' },
  extravio:  { label:'Pedido Extraviado', icon:ShieldAlert, cor:'text-red-600',    bg:'bg-red-100' },
  troca:     { label:'Troca / Devolução', icon:RefreshCw,   cor:'text-amber-500',  bg:'bg-amber-100' },
  pagamento: { label:'Pagamento',         icon:CreditCard,  cor:'text-blue-500',   bg:'bg-blue-100' },
  produto:   { label:'Produto',           icon:Package,     cor:'text-orange-500', bg:'bg-orange-100' },
  outro:     { label:'Outro',             icon:Tag,         cor:'text-slate-500',  bg:'bg-slate-100' },
}

// Helper: Gera ID amigável caso o backend ainda não retorne um
const formatTicketId = (id) => id ? `TK-${String(id).padStart(4, '0')}` : 'Novo'

// ── Badge Components ─────────────────────────────────────────────────────────
function BadgeStatus({ status }) {
  const m = STATUS[status] || STATUS.aberta
  const Ic = m.icon
  return (
    <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${m.bg} ${m.cor}`}>
      <Ic size={10}/> {m.label}
    </span>
  )
}

function BadgePrioridade({ prioridade }) {
  const m = PRIORIDADE[prioridade] || PRIORIDADE.normal
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.bg} ${m.cor}`}>
      {m.label}
    </span>
  )
}

// ── Modal Novo Chamado ───────────────────────────────────────────────────────
function ModalNovo({ api, onClose, onSave }) {
  const [form, setForm] = useState({ telefone:'', email:'', nomeCliente:'', numeroPedido:'', tipo:'entrega', descricao:'', prioridade:'normal' })
  const [salvando, setSalvando] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const salvar = async () => {
    if (!form.telefone.trim()) return
    setSalvando(true)
    try {
      await fetch(`${api}/api/ocorrencias`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form)
      })
      onSave()
    } catch {}
    setSalvando(false)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg"><Plus size={16} className="text-white"/></div>
            <h2 className="text-white font-bold text-base">Registrar Nova Ocorrência</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nome do Cliente</label>
              <input value={form.nomeCliente} onChange={e=>set('nomeCliente',e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Luciana Volkart" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">WhatsApp *</label>
              <input value={form.telefone} onChange={e=>set('telefone',e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="5511999999999" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">E-mail</label>
              <input value={form.email} onChange={e=>set('email',e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="cliente@email.com" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Pedido # (Opcional)</label>
              <input value={form.numeroPedido} onChange={e=>set('numeroPedido',e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: 226540" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Tipo</label>
              </div>
              <select value={form.tipo} onChange={e=>set('tipo',e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {Object.entries(TIPO).map(([id,m])=><option key={id} value={id}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Descrição do problema</label>
            <textarea value={form.descricao} onChange={e=>set('descricao',e.target.value)} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Descreva o problema relatado..." />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200">Cancelar</button>
          <button onClick={salvar} disabled={salvando||!form.telefone.trim()} className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Criar Chamado'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página Principal (CRM Workspace) ─────────────────────────────────────────
export default function PageOcorrencias({ api: apiProp }) {
  const api = apiProp || BASE
  const [ocorrencias, setOcorrencias] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [detalhe, setDetalhe] = useState(null)
  const [novo, setNovo] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [busca, setBusca] = useState('')

  // Estados locais do Chamado Ativo (Centro e Direita)
  const [statusAtivo, setStatusAtivo] = useState('')
  const [prioridadeAtiva, setPrioridadeAtiva] = useState('')
  const [atribAtivo, setAtribAtivo] = useState('')
  const [notaInterna, setNotaInterna] = useState('')
  const [respostaCliente, setRespostaCliente] = useState('')
  const [salvandoStatus, setSalvandoStatus] = useState(false)
  const [enviandoResp, setEnviandoResp] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filtroStatus !== 'todos') params.set('status', filtroStatus)
      const r = await fetch(`${api}/api/ocorrencias?${params}`)
      if (r.ok) {
        const d = await r.json()
        setOcorrencias(d.ocorrencias || [])
        setStats(d.stats || {})
      }
    } catch {}
    setLoading(false)
  }, [api, filtroStatus])

  useEffect(() => { setLoading(true); carregar() }, [carregar])

  // Ao selecionar um ticket, popula os estados de edição
  useEffect(() => {
    if (detalhe) {
      setStatusAtivo(detalhe.status || 'aberta')
      setPrioridadeAtiva(detalhe.prioridade || 'normal')
      setAtribAtivo(detalhe.atribuidoA || '')
      setNotaInterna('')
      setRespostaCliente('')
    }
  }, [detalhe])

  const filtradas = ocorrencias.filter(o => {
    if (!busca) return true
    const b = busca.toLowerCase()
    return (o.nomeCliente||'').toLowerCase().includes(b) ||
           (o.numeroPedido||'').includes(b) ||
           (o.telefone||'').includes(b) ||
           (o.descricao||'').toLowerCase().includes(b)
  })

  // Funções reais de persistência usando o seu backend
  const salvarDadosDireita = async () => {
    if (!detalhe) return
    setSalvandoStatus(true)
    try {
      await fetch(`${api}/api/ocorrencias/${detalhe.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ status: statusAtivo, prioridade: prioridadeAtiva, atribuidoA: atribAtivo, nota: notaInterna||undefined })
      })
      setNotaInterna('')
      carregar()
      // Atualiza o ticket atual na view para não precisar fechar
      setDetalhe(prev => ({...prev, status: statusAtivo, prioridade: prioridadeAtiva, atribuidoA: atribAtivo}))
    } catch {}
    setSalvandoStatus(false)
  }

  const enviarWhatsApp = async () => {
    if (!detalhe || !respostaCliente.trim()) return
    setEnviandoResp(true)
    try {
      const novoStatus = statusAtivo === 'aberta' ? 'em_andamento' : statusAtivo
      await fetch(`${api}/api/ocorrencias/${detalhe.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          respostaCliente,
          status: novoStatus,
          nota: `Resposta enviada ao cliente via painel.`
        })
      })
      setRespostaCliente('')
      setStatusAtivo(novoStatus)
      carregar()
      setDetalhe(prev => ({...prev, status: novoStatus}))
    } catch {}
    setEnviandoResp(false)
  }

  const urgentes = parseInt(stats.urgentes)||0

  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] text-slate-800 font-sans antialiased overflow-hidden">
      
      {/* ── COLUNA 1: FILA DE ATENDIMENTO (INBOX) ── */}
      <aside className="w-[340px] bg-white flex flex-col border-r border-slate-200 z-10 flex-shrink-0">
        <div className="p-4 border-b border-slate-100 bg-white sticky top-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900">Atendimentos</h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{ocorrencias.length} chamados encontrados</p>
            </div>
            <button onClick={()=>setNovo(true)} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors shadow-sm" title="Nova Ocorrência">
              <Plus size={18} />
            </button>
          </div>
          
          <div className="flex gap-2 mb-3">
            <select value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="todos">Todos os Status</option>
              {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={()=>{ setLoading(true); carregar() }} className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100">
              <RefreshCw size={14} className={`text-slate-500 ${loading?'animate-spin':''}`}/>
            </button>
          </div>

          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600" />
            <input 
              value={busca} onChange={e=>setBusca(e.target.value)}
              placeholder="Buscar chamado..." 
              className="w-full bg-slate-100 border-transparent text-sm rounded-xl pl-9 pr-3 py-2.5 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtradas.map(oc => {
            const sMeta = STATUS[oc.status] || STATUS.aberta
            const tMeta = TIPO[oc.tipo] || TIPO.outro
            const isActive = detalhe?.id === oc.id
            const isUrgente = oc.prioridade === 'urgente'

            return (
              <div 
                key={oc.id} onClick={() => setDetalhe(oc)}
                className={`p-4 border-l-4 cursor-pointer transition-colors border-b border-slate-100 ${
                  isActive ? 'border-l-blue-600 bg-blue-50/50' : 
                  isUrgente && !['resolvida','encerrada'].includes(oc.status) ? 'border-l-red-500 hover:bg-slate-50' : 
                  'border-l-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tMeta.bg} ${tMeta.cor}`}>
                    {tMeta.label.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap ml-2">
                    {new Date(oc.criadoEm).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 truncate">{oc.nomeCliente || oc.telefone}</h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">{oc.descricao || 'Sem descrição inicial'}</p>
                <div className="flex items-center gap-3 mt-2">
                  <BadgeStatus status={oc.status} />
                  <span className="text-[11px] text-slate-400 font-mono font-semibold">{formatTicketId(oc.id)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      {/* ── COLUNA 2: PALCO CENTRAL (OPERAÇÃO E CHAT) ── */}
      <main className="flex-1 flex flex-col relative bg-slate-50">
        {!detalhe ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <h2 className="text-lg font-bold text-slate-500">Nenhum chamado selecionado</h2>
            <p className="text-sm">Selecione uma ocorrência na lista para iniciar o atendimento.</p>
          </div>
        ) : (
          <>
            {/* Header do Chamado Ativo */}
            <header className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-slate-900">{detalhe.nomeCliente || detalhe.telefone}</h2>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{formatTicketId(detalhe.id)}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><Phone size={14}/> {detalhe.telefone || '—'}</span>
                  {detalhe.email && <span className="flex items-center gap-1"><Mail size={14}/> {detalhe.email}</span>}
                </div>
              </div>
            </header>

            {/* Timeline do Chamado */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="flex justify-center">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full uppercase tracking-widest">
                  Ocorrência Aberta • {new Date(detalhe.criadoEm).toLocaleString('pt-BR')}
                </span>
              </div>

              {/* Problema Original Relatado */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500">
                  CLI
                </div>
                <div className="flex flex-col gap-1 max-w-[80%]">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-sm shadow-sm">
                    <p className="text-sm text-slate-700 leading-relaxed">{detalhe.descricao || 'Ocorrência registrada sem descrição detalhada.'}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium ml-1">Mensagem Inicial</span>
                </div>
              </div>

              {/* Loop de Histórico Existente no seu DB */}
              {(detalhe.historico || []).map((h, i) => {
                const isSystem = h.por === 'Sistema' || !h.por
                return (
                  <div key={i} className={`flex items-start gap-3 ${!isSystem ? 'flex-row-reverse' : ''}`}>
                    <div className="flex flex-col gap-1 max-w-[85%] items-end">
                      <div className={`p-3 rounded-xl shadow-sm relative ${isSystem ? 'bg-amber-50 border border-amber-200 rounded-tr-sm' : 'bg-blue-50 border border-blue-200 rounded-tl-sm'}`}>
                        <p className={`text-xs font-medium leading-relaxed ${isSystem ? 'text-amber-800' : 'text-blue-800'}`}>
                          {h.nota}
                        </p>
                      </div>
                      <span className={`text-[10px] text-slate-400 font-medium ${!isSystem ? 'mr-1' : 'ml-1'}`}>
                        {h.por} • {new Date(h.em).toLocaleString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Composer de Resposta WhatsApp */}
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 transition-all flex flex-col">
                <textarea 
                  value={respostaCliente} onChange={e=>setRespostaCliente(e.target.value)}
                  rows={3}
                  placeholder="Responder ao cliente no WhatsApp..."
                  className="w-full bg-transparent text-sm text-slate-800 p-3 outline-none resize-none"
                />
                
                <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Anexar Mídia">
                      <Paperclip size={16} />
                    </button>
                    <button className="p-1.5 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors flex items-center gap-1 text-xs font-bold" title="Melhorar com IA">
                      <Sparkles size={14} /> IA
                    </button>
                  </div>
                  
                  <button onClick={enviarWhatsApp} disabled={enviandoResp || !respostaCliente.trim()} className="px-5 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50">
                    {enviandoResp ? 'Enviando...' : 'Enviar'} <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── COLUNA 3: GESTÃO DO CHAMADO E CONTEXTO ── */}
      {detalhe && (
        <aside className="w-[320px] bg-white border-l border-slate-200 overflow-y-auto flex-shrink-0 z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.03)] flex flex-col">
          
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Gerenciar Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Situação</label>
                <select value={statusAtivo} onChange={e=>setStatusAtivo(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                  {Object.entries(STATUS).map(([id,m])=><option key={id} value={id}>{m.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Prioridade</label>
                <select value={prioridadeAtiva} onChange={e=>setPrioridadeAtiva(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                  {Object.entries(PRIORIDADE).map(([id,m])=><option key={id} value={id}>{m.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Atribuído para</label>
                <input value={atribAtivo} onChange={e=>setAtribAtivo(e.target.value)} placeholder="Nome do atendente" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          <div className="p-5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Nota Interna</h3>
            <textarea 
              value={notaInterna} onChange={e=>setNotaInterna(e.target.value)}
              rows={2} placeholder="Adicionar log invisível ao cliente..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-3"
            />
            <button onClick={salvarDadosDireita} disabled={salvandoStatus} className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
              {salvandoStatus ? <RefreshCw size={14} className="animate-spin"/> : <Save size={14} />} Salvar Alterações
            </button>
          </div>

          {/* Contexto do ERP / Pedido */}
          <div className="p-5 flex-1 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Contexto do Pedido</h3>
              {detalhe.numeroPedido && <button className="text-blue-600 hover:text-blue-800"><ExternalLink size={14}/></button>}
            </div>

            {detalhe.numeroPedido ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-slate-900">#{detalhe.numeroPedido}</span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">ERP SINC</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  As informações financeiras e logísticas aparecerão aqui após integração de visualização do Bling.
                </p>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
                  <button className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 py-1.5 rounded-lg hover:bg-slate-100">Atualizar</button>
                  <button className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 py-1.5 rounded-lg hover:bg-blue-100">Ver Itens</button>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 border border-dashed border-slate-200 rounded-xl">
                <Package size={24} className="mx-auto text-slate-300 mb-2"/>
                <p className="text-xs text-slate-500">Nenhum pedido vinculado a esta ocorrência.</p>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ── Modal Novo ── */}
      {novo && <ModalNovo api={api} onClose={() => setNovo(false)} onSave={() => { setNovo(false); carregar() }} />}

    </div>
  )
}
