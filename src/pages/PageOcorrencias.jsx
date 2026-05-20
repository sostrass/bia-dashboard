import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, RefreshCw, Plus, X,
  Search, Filter, ShieldAlert, Package, Truck, CreditCard,
  Tag, MoreHorizontal, FileText, Paperclip, Sparkles, Mail,
  Phone, User, ChevronRight, Save, Send, Image as ImageIcon,
  Video, ArrowUpRight, Zap
} from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || '';

// ── DICIONÁRIOS DO SISTEMA ───────────────────────────────────────────────────
const STATUS = {
  aberta:       { id: 'aberta',       label: 'Aberta',       cor: 'text-amber-600', bg: 'bg-amber-100', dot: 'bg-amber-500' },
  em_andamento: { id: 'em_andamento', label: 'Em Análise',   cor: 'text-blue-600',  bg: 'bg-blue-100',  dot: 'bg-blue-500' },
  resolvida:    { id: 'resolvida',    label: 'Resolvida',    cor: 'text-green-600', bg: 'bg-green-100', dot: 'bg-green-500' },
  encerrada:    { id: 'encerrada',    label: 'Encerrada',    cor: 'text-slate-600', bg: 'bg-slate-100', dot: 'bg-slate-500' },
};

const PRIORIDADE = {
  baixa:   { id: 'baixa',   label: 'Baixa',   icon: ChevronRight, cor: 'text-slate-500' },
  normal:  { id: 'normal',  label: 'Normal',  icon: Clock,        cor: 'text-blue-500' },
  alta:    { id: 'alta',    label: 'Alta',    icon: AlertTriangle,cor: 'text-amber-500' },
  urgente: { id: 'urgente', label: 'Urgente', icon: Zap,          cor: 'text-red-500' },
};

const TIPOS = {
  atraso:   { label: 'Entrega Atrasada',  icon: Clock,       cor: 'text-red-600',    bg: 'bg-red-50' },
  extravio: { label: 'Pedido Extraviado', icon: ShieldAlert, cor: 'text-red-600',    bg: 'bg-red-50' },
  troca:    { label: 'Troca / Devolução', icon: RefreshCw,   cor: 'text-amber-600',  bg: 'bg-amber-50' },
  avaria:   { label: 'Produto Avariado',  icon: Package,     cor: 'text-orange-600', bg: 'bg-orange-50' },
  financeiro:{label: 'Erro de Pagamento', icon: CreditCard,  cor: 'text-blue-600',   bg: 'bg-blue-50' },
  outro:    { label: 'Outros Assuntos',   icon: Tag,         cor: 'text-slate-600',  bg: 'bg-slate-50' },
};

// ── COMPONENTE: PAINEL LATERAL DO TICKET (ISSUE RESOLVER) ────────────────────
function TicketDrawer({ ticket, onClose }) {
  const [status, setStatus] = useState(ticket.status);
  const [tabAtiva, setTabAtiva] = useState('nota'); // nota, email, whatsapp
  const [resposta, setResposta] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const TMeta = TIPOS[ticket.tipo] || TIPOS.outro;
  const TipoIcon = TMeta.icon;

  const simularIA = () => {
    if (!resposta) return;
    setIsRefining(true);
    setTimeout(() => {
      setResposta(`Olá, ${ticket.nomeCliente.split(' ')[0]}.\n\nAnalisamos cuidadosamente sua ocorrência referente ao pedido #${ticket.numeroPedido}. Gostaríamos de informar que [A IA REESCREVEU SEU TEXTO AQUI].\n\nQualquer dúvida, estamos à disposição.\nEquipe Só Strass`);
      setIsRefining(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl flex flex-col z-50 border-l border-slate-200 transform transition-transform duration-300">
      
      {/* HEADER DO TICKET */}
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl font-black text-slate-900 font-mono tracking-tight">{ticket.id}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${STATUS[status].bg} ${STATUS[status].cor}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${STATUS[status].dot}`}/>
                {STATUS[status].label}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800">{ticket.titulo}</h2>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-200 rounded-md text-slate-500 transition-colors"><MoreHorizontal size={18}/></button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-md text-slate-500 transition-colors"><X size={18}/></button>
          </div>
        </div>

        {/* METADADOS RÁPIDOS */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo</p>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${TMeta.cor}`}>
              <TipoIcon size={14}/> {TMeta.label}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prioridade</p>
            <div className={`flex items-center gap-1 text-xs font-bold ${PRIORIDADE[ticket.prioridade].cor}`}>
              {React.createElement(PRIORIDADE[ticket.prioridade].icon, { size: 14 })}
              {PRIORIDADE[ticket.prioridade].label}
            </div>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pedido ERP</p>
            {ticket.numeroPedido ? (
              <a href="#" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                #{ticket.numeroPedido} <ArrowUpRight size={12}/>
              </a>
            ) : <span className="text-xs text-slate-400 font-medium">Não vinculado</span>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white flex flex-col">
        
        {/* DADOS DO CLIENTE */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg">
            {ticket.nomeCliente.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{ticket.nomeCliente}</h3>
            <div className="flex items-center gap-4 mt-1 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5"><Mail size={12}/> {ticket.email}</span>
              <span className="flex items-center gap-1.5"><Phone size={12}/> {ticket.telefone}</span>
            </div>
          </div>
        </div>

        {/* DESCRIÇÃO ORIGINAL */}
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Relato Original</h3>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
            {ticket.descricao}
          </p>
          
          {/* Anexos da Abertura */}
          {ticket.anexos && ticket.anexos.length > 0 && (
            <div className="mt-4 flex gap-3">
              {ticket.anexos.map((anexo, i) => (
                <div key={i} className="flex items-center gap-2 border border-slate-200 rounded-lg p-2 bg-white cursor-pointer hover:border-blue-400 transition-colors">
                  {anexo.tipo === 'img' ? <ImageIcon size={16} className="text-blue-500"/> : <Video size={16} className="text-purple-500"/>}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-700">{anexo.nome}</span>
                    <span className="text-[9px] text-slate-400">{anexo.size}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TIMELINE RICA */}
        <div className="p-6 flex-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Histórico da Ocorrência</h3>
          <div className="relative pl-3 border-l-2 border-slate-100 space-y-6">
            
            {/* Evento 1 */}
            <div className="relative">
              <div className="absolute -left-[17px] top-1 w-3 h-3 rounded-full bg-slate-200 border-2 border-white"/>
              <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Abertura • Ontem, 14:22</p>
              <p className="text-sm text-slate-600 font-medium">Ocorrência registrada pelo sistema via WhatsApp.</p>
            </div>

            {/* Evento 2 (Email Enviado) */}
            <div className="relative">
              <div className="absolute -left-[17px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"/>
              <p className="text-[10px] font-bold text-blue-500 mb-1 uppercase tracking-wider">E-mail Enviado • Hoje, 09:15</p>
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <p className="text-xs text-blue-900 font-medium">
                  Solicitação de acareação enviada para a transportadora Jadlog com cópia para o cliente. Aguardando prazo de 48h úteis.
                </p>
              </div>
            </div>

            {/* Mudança de Status */}
            <div className="relative">
              <div className="absolute -left-[17px] top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white"/>
              <p className="text-[10px] font-bold text-amber-500 mb-1 uppercase tracking-wider">Status Alterado • Hoje, 09:16</p>
              <p className="text-sm text-slate-600 font-medium">João (Atendimento) mudou o status de <span className="font-bold text-slate-800">Aberta</span> para <span className="font-bold text-slate-800">Em Análise</span>.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA DE AÇÃO (REPLY BOX MULTICANAL) */}
      <div className="bg-white border-t border-slate-200 p-4 flex-shrink-0">
        
        {/* Toggles de Ação Rápidas de Status */}
        <div className="flex items-center gap-2 mb-4 bg-slate-50 p-1.5 rounded-lg border border-slate-200 w-max">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-2 mr-1">Marcar como:</span>
          <button onClick={()=>setStatus('em_andamento')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${status==='em_andamento'?'bg-white shadow-sm text-blue-600':'text-slate-500 hover:bg-slate-200'}`}>Em Análise</button>
          <button onClick={()=>setStatus('resolvida')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${status==='resolvida'?'bg-white shadow-sm text-green-600':'text-slate-500 hover:bg-slate-200'}`}>Resolvida</button>
        </div>

        {/* Abas de Canal */}
        <div className="flex gap-1 mb-2">
          <button onClick={()=>setTabAtiva('nota')} className={`px-4 py-1.5 text-xs font-bold rounded-t-lg border-b-2 transition-all ${tabAtiva==='nota'?'text-amber-600 border-amber-500 bg-amber-50/50':'text-slate-400 border-transparent hover:text-slate-600'}`}>Nota Interna</button>
          <button onClick={()=>setTabAtiva('email')} className={`px-4 py-1.5 text-xs font-bold rounded-t-lg border-b-2 transition-all ${tabAtiva==='email'?'text-blue-600 border-blue-500 bg-blue-50/50':'text-slate-400 border-transparent hover:text-slate-600'}`}>Enviar E-mail</button>
          <button onClick={()=>setTabAtiva('whatsapp')} className={`px-4 py-1.5 text-xs font-bold rounded-t-lg border-b-2 transition-all ${tabAtiva==='whatsapp'?'text-green-600 border-green-500 bg-green-50/50':'text-slate-400 border-transparent hover:text-slate-600'}`}>WhatsApp</button>
        </div>
        
        {/* Caixa de Texto */}
        <div className={`border rounded-xl transition-all ${tabAtiva==='nota'?'border-amber-200 bg-amber-50/30 focus-within:ring-amber-500 focus-within:border-amber-500':tabAtiva==='email'?'border-blue-200 bg-blue-50/30 focus-within:ring-blue-500 focus-within:border-blue-500':'border-green-200 bg-green-50/30 focus-within:ring-green-500 focus-within:border-green-500'} focus-within:ring-2`}>
          
          <textarea 
            value={resposta} onChange={e=>setResposta(e.target.value)}
            rows={4} 
            placeholder={
              tabAtiva === 'nota' ? 'Adicione uma nota visível apenas para a equipe...' : 
              tabAtiva === 'email' ? 'Escreva o e-mail para o cliente (suporte@sostrass.com.br)...' : 
              'Escreva a mensagem para enviar via WhatsApp...'
            }
            className="w-full text-sm font-medium text-slate-800 p-3 bg-transparent outline-none resize-none"
          />
          
          <div className="flex items-center justify-between p-2 border-t border-slate-200/60">
            <div className="flex items-center gap-1">
              <button title="Anexar arquivo (PDF, JPG, MP4)" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"><Paperclip size={16}/></button>
              <button title="Usar IA para revisar ou gerar texto" onClick={simularIA} disabled={isRefining} className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-md transition-colors flex items-center gap-1.5 text-xs font-bold">
                <Sparkles size={14} className={isRefining ? 'animate-spin' : ''}/> {isRefining ? 'Refinando...' : 'I.A.'}
              </button>
            </div>
            
            <button className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition-all flex items-center gap-2 ${
                tabAtiva === 'nota' ? 'bg-amber-500 hover:bg-amber-600' : 
                tabAtiva === 'email' ? 'bg-blue-600 hover:bg-blue-700' : 
                'bg-green-600 hover:bg-green-700'
              }`}>
              {tabAtiva === 'nota' ? 'Salvar Nota' : 'Enviar'} {tabAtiva === 'nota' ? <Save size={14}/> : <Send size={14}/>}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

// ── COMPONENTE PRINCIPAL: A LISTA (DATA GRID) DE OCORRÊNCIAS ─────────────────
export default function PageOcorrencias() {
  const [tickets, setTickets] = useState([]);
  const [ticketAtivo, setTicketAtivo] = useState(null);
  
  // Mock Realista
  useEffect(() => {
    setTickets([
      { id: 'TK-9A4F', titulo: 'Acareação Jadlog - Pacote Parado', status: 'aberta', prioridade: 'urgente', tipo: 'atraso', nomeCliente: 'Luciana Volkart', email: 'luciana.volkart@outlook.com', telefone: '+55 11 98603-1953', numeroPedido: '226540', descricao: 'Cliente relatou que a Jadlog está com o pacote parado na filial de destino há mais de 5 dias e o prazo já estourou. Requer acareação urgente.', criadoEm: '2026-05-19T14:22:00Z', anexos: [{nome:'print_rastreio.jpg', tipo:'img', size:'245kb'}] },
      { id: 'TK-7B2X', titulo: 'Diferença de Cor (Lote)', status: 'em_andamento', prioridade: 'normal', tipo: 'troca', nomeCliente: 'Marcos Almeida', email: 'marcos.artes@gmail.com', telefone: '+55 19 9999-1234', numeroPedido: '225881', descricao: 'Recebeu pérolas 6mm com um tom de creme mais escuro que a compra anterior. Solicita troca por um lote mais claro ou devolução.', criadoEm: '2026-05-18T10:05:00Z', anexos: [{nome:'video_perolas.mp4', tipo:'vid', size:'2.1mb'}] },
      { id: 'TK-1C9P', titulo: 'PIX Cobrado Duas Vezes', status: 'resolvida', prioridade: 'alta', tipo: 'financeiro', nomeCliente: 'Camila Silva', email: 'camila.silv@empresa.com', telefone: '+55 41 98888-0000', numeroPedido: '227734', descricao: 'Ocorreu um erro no checkout do site e o PIX foi descontado duas vezes na conta da cliente. Estorno realizado na data de ontem.', criadoEm: '2026-05-15T09:30:00Z', anexos: [{nome:'comprovante.pdf', tipo:'doc', size:'120kb'}] },
    ]);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-[#F8FAFC] text-slate-800 font-sans antialiased overflow-hidden relative">
      
      {/* HEADER PRINCIPAL */}
      <header className="px-8 py-6 bg-white border-b border-slate-200 z-10 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ocorrências & Chamados</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Gestão de tickets, devoluções e anomalias de logística.</p>
          </div>
          <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2">
            <Plus size={16} strokeWidth={3}/> Nova Ocorrência
          </button>
        </div>

        {/* BARRA DE FERRAMENTAS (SEARCH & FILTERS) */}
        <div className="flex items-center gap-3">
          <div className="relative w-96 group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600" />
            <input 
              placeholder="Buscar por ID (TK-XXX), cliente, e-mail ou pedido..." 
              className="w-full bg-white border border-slate-300 text-slate-800 text-sm font-semibold rounded-xl pl-11 pr-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <button className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all">
              <Filter size={14}/> Status: Todos
            </button>
            <button className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all">
              Tipo: Todos
            </button>
            <button className="px-2.5 py-2.5 text-blue-600 font-bold text-xs hover:underline flex items-center gap-1 ml-2">
              <Plus size={14}/> Add Tipo
            </button>
          </div>
        </div>
      </header>

      {/* DATA GRID (TABELA DE OCORRÊNCIAS) */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Header da Tabela */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">Ticket / Assunto</div>
            <div className="col-span-3">Cliente</div>
            <div className="col-span-2">Tipo</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Criado em</div>
          </div>

          {/* Linhas da Tabela */}
          <div className="divide-y divide-slate-100">
            {tickets.map(ticket => {
              const S = STATUS[ticket.status];
              const T = TIPOS[ticket.tipo] || TIPOS.outro;

              return (
                <div 
                  key={ticket.id} 
                  onClick={() => setTicketAtivo(ticket)}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-blue-50/50 cursor-pointer transition-colors group"
                >
                  {/* ID e Titulo */}
                  <div className="col-span-3 flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">{ticket.id}</span>
                      {ticket.prioridade === 'urgente' && <Zap size={12} className="text-red-500 fill-red-500 animate-pulse"/>}
                    </div>
                    <span className="text-sm font-bold text-slate-800 truncate">{ticket.titulo}</span>
                  </div>

                  {/* Cliente e Pedido */}
                  <div className="col-span-3 flex flex-col">
                    <span className="text-sm font-bold text-slate-800 truncate">{ticket.nomeCliente}</span>
                    {ticket.numeroPedido ? (
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                        <Package size={12}/> Pedido #{ticket.numeroPedido}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 mt-0.5">Sem vínculo</span>
                    )}
                  </div>

                  {/* Tipo */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${T.bg} ${T.cor}`}>
                      <T.icon size={12}/> {T.label}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-transparent ${S.bg} ${S.cor}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${S.dot}`}/> {S.label}
                    </span>
                  </div>

                  {/* Data e Ação */}
                  <div className="col-span-2 flex items-center justify-end gap-4 text-xs font-medium text-slate-500">
                    {new Date(ticket.criadoEm).toLocaleDateString('pt-BR')}
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors"/>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* OVERLAY E GAVETA LATERAL (DRAWER) */}
      {ticketAtivo && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40 transition-opacity" onClick={() => setTicketAtivo(null)}/>
          <TicketDrawer ticket={ticketAtivo} onClose={() => setTicketAtivo(null)} />
        </>
      )}

    </div>
  );
}
