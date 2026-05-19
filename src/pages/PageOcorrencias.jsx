import { useState, useEffect, useCallback } from 'react'
import {
  AlertCircle, CheckCircle, Clock, RefreshCw, Plus, X,
  Send, User, ChevronDown, MessageSquare, Truck, Package,
  CreditCard, Tag, Search, Circle, XCircle, Zap, Save,
  Paperclip, Sparkles, Mail, Phone, CornerDownRight, MoreVertical,
  ArrowUpRight, ShieldAlert, FileText, Check
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Dicionários e Meta-dados ─────────────────────────────────────────────────
const STATUS = {
  aberta:       { label: 'Aberta',       cor: 'text-amber-600', bg: 'bg-amber-100', dot: 'bg-amber-500', icon: Circle },
  em_andamento: { label: 'Em andamento', cor: 'text-blue-600',  bg: 'bg-blue-100',  dot: 'bg-blue-500',  icon: RefreshCw },
  resolvida:    { label: 'Resolvida',    cor: 'text-green-600', bg: 'bg-green-100', dot: 'bg-green-500', icon: CheckCircle },
  encerrada:    { label: 'Encerrada',    cor: 'text-slate-600', bg: 'bg-slate-100', dot: 'bg-slate-500', icon: XCircle },
}

const PRIORIDADE = {
  baixa:   { label: 'Baixa',   cor: 'text-slate-600', bg: 'bg-slate-100' },
  normal:  { label: 'Normal',  cor: 'text-blue-600',  bg: 'bg-blue-100' },
  alta:    { label: 'Alta',    cor: 'text-amber-600', bg: 'bg-amber-100' },
  urgente: { label: 'Urgente', cor: 'text-red-600',   bg: 'bg-red-100' },
}

// Expansível pelo usuário no futuro (banco de dados)
const TIPOS_INICIAIS = {
  entrega:  { label: 'Entrega Padrão',     icon: Truck,       cor: 'text-purple-600', bg: 'bg-purple-100' },
  atraso:   { label: 'Entrega Atrasada',   icon: Clock,       cor: 'text-red-500',    bg: 'bg-red-100' },
  extravio: { label: 'Pedido Extraviado',  icon: ShieldAlert, cor: 'text-red-600',    bg: 'bg-red-100' },
  troca:    { label: 'Troca / Devolução',  icon: RefreshCw,   cor: 'text-amber-500',  bg: 'bg-amber-100' },
  pagamento:{ label: 'Pagamento / Fatura', icon: CreditCard,  cor: 'text-blue-500',   bg: 'bg-blue-100' },
  produto:  { label: 'Dúvida de Produto',  icon: Package,     cor: 'text-orange-500', bg: 'bg-orange-100' },
  outro:    { label: 'Outros Assuntos',    icon: Tag,         cor: 'text-slate-500',  bg: 'bg-slate-100' },
}

// ── Componentes de UI Menores ────────────────────────────────────────────────
const Badge = ({ children, colorClass, bgClass, className = '' }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 w-max ${colorClass} ${bgClass} ${className}`}>
    {children}
  </span>
)

// Helper para gerar ID Alfanumérico CRM (Ex: TK-9F2A)
const generateTicketId = () => `TK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

// ── Painel de Detalhe Lateral (Drawer CRM) ───────────────────────────────────
function PainelOcorrencia({ oc, api, onClose, onUpdate }) {
  const [status, setStatus] = useState(oc.status)
  const [canalResp, setCanalResp] = useState('whatsapp') // whatsapp, email, nota
  const [resposta, setResposta] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)

  const metaStatus = STATUS[status] || STATUS.aberta
  const metaTipo = TIPOS_INICIAIS[oc.tipo] || TIPOS_INICIAIS.outro
  const TipoIc = metaTipo.icon

  // Simula a IA melhorando o texto
  const aplicarIA = () => {
    if (!resposta) return
    setLoadingAI(true)
    setTimeout(() => {
      setResposta(`[Texto otimizado pela IA]: ${resposta}\n\nAtenciosamente,\nEquipe Só Strass.`)
      setLoadingAI(false)
    }, 1000)
  }

  return (
    <div className="w-[500px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 transition-all duration-300 transform translate-x-0">
      
      {/* Header do Ticket */}
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${metaTipo.bg}`}>
              <TipoIc size={20} className={metaTipo.cor} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {oc.ticketId || `#${oc.id}`}
              </h2>
              <p className="text-xs font-medium text-slate-500">{metaTipo.label}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"><MoreVertical size={16}/></button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"><X size={16}/></button>
          </div>
        </div>

        {/* Info Rápida do Cliente */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
            <User size={14} className="text-slate-400"/> {oc.nomeCliente || 'Cliente não identificado'}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Phone size={12}/> {oc.telefone || '—'}</span>
            <span className="flex items-center gap-1.5"><Mail size={12}/> {oc.email || '—'}</span>
          </div>
          {oc.numeroPedido && (
            <div className="pt-2 mt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-blue-600 font-medium cursor-pointer hover:underline">
              <Package size={12}/> Pedido relacionado: #{oc.numeroPedido} <ArrowUpRight size={12}/>
            </div>
          )}
        </div>

        {/* Toggles Rápidos de Status */}
        <div className="flex gap-2 mt-4">
          {Object.entries(STATUS).map(([key, val]) => (
            <button 
              key={key} onClick={() => setStatus(key)}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                status === key ? `${val.bg} ${val.cor} border-transparent shadow-inner` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white flex flex-col">
        {/* Descrição Original */}
        <div className="p-6 border-b border-slate-100">
          <p className="text-xs font-bold tracking-wider text-slate-400 mb-2 uppercase">Problema Relatado</p>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
            {oc.descricao || 'Nenhuma descrição fornecida na abertura.'}
          </p>
        </div>

        {/* Timeline Histórico */}
        <div className="p-6 flex-1">
          <p className="text-xs font-bold tracking-wider text-slate-400 mb-4 uppercase">Timeline da Ocorrência</p>
          <div className="relative pl-3 border-l-2 border-slate-100 space-y-6">
            
            {/* Exemplo mockado de timeline */}
            <div className="relative">
              <div className="absolute -left-[17px] top-1 w-3 h-3 rounded-full bg-slate-200 border-2 border-white"/>
              <p className="text-xs text-slate-400 mb-1">Hoje, 14:32 · Por Sistema</p>
              <div className="text-sm text-slate-700 bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                Ocorrência criada e atribuída para a fila de atendimento.
              </div>
            </div>

            {(oc.historico || []).map((h, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[17px] top-1 w-3 h-3 rounded-full bg-blue-400 border-2 border-white"/>
                <p className="text-xs text-slate-400 mb-1">{new Date(h.em).toLocaleString('pt-BR')} · Por {h.por}</p>
                <div className="text-sm text-slate-700 bg-blue-50 border border-blue-100 p-3 rounded-lg">
                  {h.nota}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Composer de Resposta (Footer) */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
        <div className="flex gap-1 mb-2">
          <button onClick={()=>setCanalResp('whatsapp')} className={`px-3 py-1.5 text-xs font-bold rounded-t-lg flex items-center gap-1.5 ${canalResp==='whatsapp'?'bg-white text-green-600 border border-b-0 border-slate-200':'text-slate-400 hover:text-slate-600'}`}><MessageSquare size={12}/> WhatsApp</button>
          <button onClick={()=>setCanalResp('email')} className={`px-3 py-1.5 text-xs font-bold rounded-t-lg flex items-center gap-1.5 ${canalResp==='email'?'bg-white text-blue-600 border border-b-0 border-slate-200':'text-slate-400 hover:text-slate-600'}`}><Mail size={12}/> E-mail</button>
          <button onClick={()=>setCanalResp('nota')} className={`px-3 py-1.5 text-xs font-bold rounded-t-lg flex items-center gap-1.5 ${canalResp==='nota'?'bg-white text-amber-500 border border-b-0 border-slate-200':'text-slate-400 hover:text-slate-600'}`}><FileText size={12}/> Nota Interna</button>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-b-lg rounded-tr-lg p-2 shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
          <textarea 
            value={resposta} onChange={e=>setResposta(e.target.value)}
            rows={3} 
            placeholder={canalResp === 'nota' ? 'Adicione um comentário invisível ao cliente...' : 'Escreva sua mensagem aqui...'}
            className="w-full text-sm outline-none resize-none text-slate-700 p-2 bg-transparent"
          />
          
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
            <div className="flex items-center gap-1">
              <button title="Anexar arquivo" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"><Paperclip size={15}/></button>
              <button title="Revisar com IA" onClick={aplicarIA} disabled={loadingAI || !resposta} className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-bold ${resposta ? 'text-purple-600 hover:bg-purple-50' : 'text-slate-300'}`}>
                <Sparkles size={15} className={loadingAI ? 'animate-spin' : ''}/> IA
              </button>
            </div>
            
            <button className={`px-4 py-1.5 rounded-md text-xs font-bold text-white shadow-sm flex items-center gap-2 transition-all ${
                canalResp === 'whatsapp' ? 'bg-green-500 hover:bg-green-600' : 
                canalResp === 'email' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-500 hover:bg-amber-600'
              }`}>
              {canalResp === 'nota' ? 'Salvar Nota' : 'Enviar'} <Send size={12}/>
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

// ── Modal de Nova Ocorrência (Hardcore CRM) ──────────────────────────────────
function ModalNovo({ onClose, onSave }) {
  const [form, setForm] = useState({ 
    ticketId: generateTicketId(), telefone:'', email:'', nomeCliente:'', numeroPedido:'', tipo:'atraso', descricao:'', prioridade:'normal' 
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg"><Plus size={16} className="text-white"/></div>
            <div>
              <h2 className="text-white font-bold text-base">Registrar Nova Ocorrência</h2>
              <p className="text-blue-200 text-xs font-mono">{form.ticketId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
        </div>

        {/* Body Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Seção Cliente */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3 border-b border-slate-100 pb-2">Dados do Cliente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nome Completo</label>
                <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Luciana Oliveira" value={form.nomeCliente} onChange={e=>set('nomeCliente', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">WhatsApp</label>
                <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+55 11 99999-9999" value={form.telefone} onChange={e=>set('telefone', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">E-mail</label>
                <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="cliente@email.com" value={form.email} onChange={e=>set('email', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Seção Ocorrência */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3 border-b border-slate-100 pb-2">Detalhes do Chamado</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">Classificação (Tipo)</label>
                  <button className="text-[10px] text-blue-600 font-bold hover:underline">+ Novo</button>
                </div>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none appearance-none" value={form.tipo} onChange={e=>set('tipo', e.target.value)}>
                  {Object.entries(TIPOS_INICIAIS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Prioridade</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none appearance-none" value={form.prioridade} onChange={e=>set('prioridade', e.target.value)}>
                  {Object.entries(PRIORIDADE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nº do Pedido Relacionado (Opcional)</label>
                <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: 226540" value={form.numeroPedido} onChange={e=>set('numeroPedido', e.target.value)} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Descrição Interna</label>
                <button className="flex items-center gap-1 text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded hover:bg-purple-100 transition-colors"><Sparkles size={10}/> Gerar com IA</button>
              </div>
              <textarea rows={4} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Descreva o problema relatado..." value={form.descricao} onChange={e=>set('descricao', e.target.value)} />
            </div>
            
            {/* Anexos Dropzone */}
            <div className="mt-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <div className="bg-white p-2 rounded-full shadow-sm mb-2"><Paperclip size={18} className="text-slate-400"/></div>
              <p className="text-xs font-bold text-slate-600">Arraste arquivos ou clique para anexar</p>
              <p className="text-[10px] text-slate-400 mt-1">Imagens, PDFs, ou Vídeos (Max 15MB)</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={onSave} className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2">
            Criar Ticket <Check size={16}/>
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Página Principal ──────────────────────────────────────────────────────────
export default function PageOcorrencias() {
  const [ocorrencias, setOcorrencias] = useState([])
  const [detalhe, setDetalhe] = useState(null)
  const [novo, setNovo] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')

  // Mock Data gerado para exibição visual do CRM
  useEffect(() => {
    setOcorrencias([
      { id: 1, ticketId: 'TK-A9B2', status: 'aberta', prioridade: 'urgente', tipo: 'atraso', nomeCliente: 'Luciana Volkart', telefone: '+55 11 98603-1953', email: 'luciana@outlook.com', numeroPedido: '226540', descricao: 'Cliente muito irritada, entrega Jadlog parada há 5 dias na filial.', criadoEm: new Date(Date.now() - 3600000).toISOString() },
      { id: 2, ticketId: 'TK-X4M1', status: 'em_andamento', prioridade: 'normal', tipo: 'troca', nomeCliente: 'Marcos Almeida', telefone: '+55 19 9999-1234', numeroPedido: '225881', descricao: 'Solicita troca das pérolas 6mm creme por brancas.', atribuidoA: 'João Atendimento', criadoEm: new Date(Date.now() - 86400000).toISOString() },
      { id: 3, ticketId: 'TK-9P0L', status: 'resolvida', prioridade: 'alta', tipo: 'pagamento', nomeCliente: 'Camila Silva', email: 'camila.silva@gmail.com', numeroPedido: '227734', descricao: 'PIX não compensou no sistema Nuvemshop.', criadoEm: new Date(Date.now() - 172800000).toISOString() },
    ])
  }, [])

  return (
    <div className="h-full flex bg-slate-100 font-sans text-slate-900 overflow-hidden relative">
      
      {/* ── Main Panel (List View) ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Superior CRM */}
        <header className="bg-white border-b border-slate-200 px-6 py-5 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Suporte & Ocorrências</h1>
              <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                Visão Geral do CRM <span className="w-1 h-1 bg-slate-300 rounded-full"/> {ocorrencias.length} tickets abertos
              </p>
            </div>
            <button onClick={() => setNovo(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-blue-200 transition-all flex items-center gap-2">
              <Plus size={16} strokeWidth={3}/> Novo Chamado
            </button>
          </div>

          {/* Smart Search Bar & Filtros */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"/>
              <input 
                value={busca} onChange={e=>setBusca(e.target.value)}
                placeholder="Buscar por ID, Nome, Email ou Telefone..." 
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-xl pl-11 pr-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
              />
            </div>
            
            {/* Pill Filters Simples */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button onClick={()=>setFiltroStatus('todos')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filtroStatus==='todos'?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>Todos</button>
              <button onClick={()=>setFiltroStatus('aberta')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filtroStatus==='aberta'?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>Pendentes</button>
              <button onClick={()=>setFiltroStatus('resolvida')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filtroStatus==='resolvida'?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>Resolvidos</button>
            </div>
          </div>
        </header>

        {/* Listagem Estilo Data Grid Moderno */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-3 max-w-5xl mx-auto">
            {ocorrencias.map(oc => {
              const sMeta = STATUS[oc.status] || STATUS.aberta
              const tMeta = TIPOS_INICIAIS[oc.tipo] || TIPOS_INICIAIS.outro
              const Icon = tMeta.icon
              const isUrgente = oc.prioridade === 'urgente'

              return (
                <div 
                  key={oc.id} 
                  onClick={() => setDetalhe(oc)}
                  className={`group bg-white border rounded-2xl p-4 flex items-center gap-5 cursor-pointer shadow-sm hover:shadow-md transition-all ${
                    detalhe?.id === oc.id ? 'border-blue-400 ring-1 ring-blue-400' : isUrgente ? 'border-red-200' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Status Indicator Bar */}
                  <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${sMeta.dot}`}/>

                  {/* Core Info */}
                  <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                    
                    {/* ID & Cliente (Col 1) */}
                    <div className="col-span-4 flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-400">{oc.ticketId}</span>
                        {isUrgente && <span className="bg-red-100 text-red-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">Urgente</span>}
                      </div>
                      <span className="font-bold text-slate-800 text-sm truncate">{oc.nomeCliente || oc.telefone}</span>
                    </div>

                    {/* Tipo & Descrição (Col 2) */}
                    <div className="col-span-5 flex flex-col pr-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={12} className={tMeta.cor}/>
                        <span className={`text-xs font-bold ${tMeta.cor}`}>{tMeta.label}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 truncate">{oc.descricao}</p>
                    </div>

                    {/* Status & Tempo (Col 3) */}
                    <div className="col-span-3 flex flex-col items-end gap-1.5">
                      <Badge colorClass={sMeta.cor} bgClass={sMeta.bg}><sMeta.icon size={12}/> {sMeta.label}</Badge>
                      <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1"><Clock size={10}/> Há 2 horas</span>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Side Panel (Drawer) ── */}
      {detalhe && (
        <PainelOcorrencia 
          oc={detalhe} 
          onClose={() => setDetalhe(null)} 
          onUpdate={() => setDetalhe(null)} 
        />
      )}

      {/* ── Modais Overlays ── */}
      {novo && <ModalNovo onClose={() => setNovo(false)} onSave={() => setNovo(false)}/>}

    </div>
  )
}
