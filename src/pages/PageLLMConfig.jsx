import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Activity, Zap, DollarSign, BarChart3, Cpu, Key, MessageSquare,
  CheckCircle, AlertTriangle, XCircle, RefreshCw, Save, RotateCcw,
  ChevronDown, ChevronRight as ChevronR, Copy, Check, TestTube2,
  Shield, ShoppingCart, Truck, CreditCard, Eye, EyeOff, TrendingUp,
  Wifi, WifiOff, Hash, Clock, Circle, Lock, Info, X, Edit3,
  ChevronLeft, PanelLeftClose, PanelLeftOpen, Package, Layers,
  AlertCircle, ExternalLink, BarChart2, Percent, FileText, Star
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, PieChart, Pie
} from 'recharts'

// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV = [
  { group:'Monitoramento', items:[
    { id:'monitor',   icon:Activity,      label:'Saúde da IA',   badge:null },
    { id:'custos',    icon:DollarSign,    label:'Custos & Uso',  badge:null },
    { id:'modelos',   icon:BarChart2,     label:'Por Modelo',    badge:null },
  ]},
  { group:'Configuração', items:[
    { id:'llm',       icon:Cpu,           label:'LLM & API Keys',badge:null },
    { id:'params',    icon:Layers,        label:'Parâmetros',    badge:null },
  ]},
  { group:'Mensagens', items:[
    { id:'msgs',      icon:MessageSquare, label:'Mensagens',     badge:'18' },
    { id:'bypasses',  icon:Zap,           label:'Bypasses',      badge:'7' },
  ]},
]

// ── Mensagens bypass ──────────────────────────────────────────────────────────
const MSGS = [
  { cat:'Checkout',  campo:'msgCpf',              titulo:'Solicitar CPF/CNPJ',           pad:'Por favor, informe seu *CPF ou CNPJ* para buscarmos seu cadastro.', vars:null },
  { cat:'Endereço',  campo:'msgAlterarEnd',        titulo:'Solicitar novo CEP',            pad:'📮 *Qual é o novo CEP de entrega?*\n\nDigite apenas o CEP (8 dígitos).', vars:null },
  { cat:'Endereço',  campo:'msgCepInvalido',       titulo:'CEP formato inválido',          pad:'Por favor, informe apenas o *CEP* com 8 dígitos (ex: 13482323).', vars:null },
  { cat:'Endereço',  campo:'msgCepNaoEncontrado',  titulo:'CEP não encontrado',            pad:'⚠️ CEP *{cep}* não encontrado.\nVerifique o número e tente novamente.', vars:['{cep}'] },
  { cat:'Endereço',  campo:'msgErroCep',           titulo:'Erro ao consultar CEP',         pad:'⚠️ Não consegui verificar o CEP. Tente novamente.', vars:null },
  { cat:'Carrinho',  campo:'msgQtdProduto',        titulo:'Quantidade — produto novo',     pad:'Quantas unidades de *{produto}* você gostaria?', vars:['{produto}'] },
  { cat:'Carrinho',  campo:'msgQtdAlterar',        titulo:'Quantidade — alterar item',     pad:'Quantas unidades de *{produto}* você deseja? (atual: {qtd_atual}x)', vars:['{produto}','{qtd_atual}'] },
  { cat:'Carrinho',  campo:'msgRemoverItem',       titulo:'Cabeçalho: remover item',       pad:'*Qual item deseja remover?*', vars:null },
  { cat:'Carrinho',  campo:'msgAlterarQtd',        titulo:'Cabeçalho: alterar quantidade', pad:'*Qual item deseja alterar?*', vars:null },
  { cat:'Carrinho',  campo:'msgCarrinhoVazio',     titulo:'Carrinho esvaziado',            pad:'Carrinho esvaziado.\n\nO que você está procurando?', vars:null },
  { cat:'Carrinho',  campo:'msgAdicionarItem',     titulo:'"Adicionar item" — pede produto',pad:'Qual produto você está procurando?', vars:null },
  { cat:'Carrinho',  campo:'msgNovaBusca',         titulo:'Nova busca após limpar',        pad:'O que você está procurando?', vars:null },
  { cat:'Fotos',     campo:'msgTodasFotos',        titulo:'Todas as fotos enviadas',       pad:'Essas são todas as {n} fotos disponíveis para este produto.', vars:['{n}'] },
  { cat:'Nota Fiscal', campo:'msgNotaFiscalPendente',  titulo:'NF não emitida — botão Emitir',   pad:'📄 *Nota Fiscal — Pedido #{numero_pedido}*\n\nOlá, {nome_cliente}! A nota fiscal deste pedido ainda não foi emitida.\n\n📦 Status do pedido: ✅ Pagamento confirmado\n\nPosso emitir agora para você!', vars:['{nome_cliente}','{numero_pedido}'] },
  { cat:'Nota Fiscal', campo:'msgNotaFiscalEmitida',   titulo:'NF autorizada — envia link',       pad:'📄 *Nota Fiscal — Pedido #{numero_pedido}*\n\nOlá, {nome_cliente}! Aqui está o documento fiscal da sua compra.\n\n🔗 *Download da NF-e:*\n{link_nfe}\n\n📋 NF-e nº {numero_nfe}\n\n_Você pode baixar o PDF ou encaminhar para sua contabilidade._', vars:['{nome_cliente}','{numero_pedido}','{numero_nfe}','{link_nfe}'] },
  { cat:'Nota Fiscal', campo:'msgNotaFiscalAguardando', titulo:'NF enviada — aguardando SEFAZ',   pad:'⏳ *Emitindo sua Nota Fiscal...*\n\nEnviamos para a Secretaria da Fazenda e estamos aguardando a autorização.\nIsso pode levar alguns instantes.\n\nAssim que for autorizada, você receberá o link aqui mesmo. 📄', vars:null },
  { cat:'Nota Fiscal', campo:'msgNotaFiscalProcessando', titulo:'NF em processamento (>30s)',     pad:'📄 *Nota Fiscal em Processamento*\n\nA nota foi gerada e enviada para a SEFAZ.\nA autorização pode levar alguns minutos.\n\nAssim que for autorizada, enviaremos o link aqui automaticamente. 😊', vars:null },
  { cat:'Nota Fiscal', campo:'msgNotaFiscalSucesso',   titulo:'NF autorizada após emissão',       pad:'✅ *Nota Fiscal Emitida!*\n\nSua NF-e foi autorizada pela SEFAZ agora mesmo.\n\n🔗 *Download da NF-e:*\n{link_nfe}\n\n📋 NF-e nº {numero_nfe}\n\n_Disponível para download ou envio à contabilidade._', vars:['{link_nfe}','{numero_nfe}'] },
  { cat:'Nota Fiscal', campo:'msgNotaFiscalFalha',     titulo:'NF com erro — abre ocorrência',    pad:'⚠️ *Não foi possível emitir a nota fiscal automaticamente.*\n\nNossa equipe foi notificada e entrará em contato em breve para resolver.\n\nProtocolo: #{ticket_id}', vars:['{ticket_id}'] },
  { cat:'Histórico',   campo:'msgHistoricoPedidos',   titulo:'Histórico de pedidos — destaque do mais recente', pad:'Encontrei seus pedidos! 📦\n\n*Pedido mais recente:* #{ultimo_pedido}\n📅 {data_ultimo} — {valor_ultimo}\n\nTemos outros {outros_pedidos} pedidos no seu histórico.\n\nQual pedido você precisa?', vars:['{nome_cliente}','{ultimo_pedido}','{data_ultimo}','{valor_ultimo}','{total_pedidos}','{outros_pedidos}'] },
  { cat:'Avaliação',   campo:'msgAvaliacaoEstrelas',  titulo:'Pergunta a nota (estrelas)',       pad:'Como você avalia sua experiência com o pedido *#{numero_pedido}*? 😊', vars:['{numero_pedido}'] },
  { cat:'Avaliação',   campo:'msgAvaliacaoComentario',titulo:'Pergunta se quer comentar',        pad:'Obrigada pela nota! 😊\n\nGostaria de deixar um comentário sobre sua experiência?', vars:null },
  { cat:'Avaliação',   campo:'msgAvaliacaoObrigada',  titulo:'Confirmação positiva (4-5★)',      pad:'Muito obrigada, {nome_cliente}! Seu feedback nos deixa muito felizes. 🥰', vars:['{nome_cliente}','{estrelas}'] },
  { cat:'Avaliação',   campo:'msgAvaliacaoNeutra',    titulo:'Confirmação neutra (3★)',           pad:'Obrigada pelo feedback, {nome_cliente}! Vamos continuar melhorando. 😊', vars:['{nome_cliente}','{estrelas}'] },
  { cat:'Avaliação',   campo:'msgAvaliacaoNegativa',  titulo:'Confirmação negativa (1-2★) + ocorrência', pad:'Obrigada pelo retorno, {nome_cliente}. Lamentamos a experiência — nossa equipe entrará em contato em breve. 🙏', vars:['{nome_cliente}','{estrelas}'] },
  // ── Cenários de consulta de pedido ────────────────────────────────────────
  { cat:'Pedidos', campo:'msgMultiplosPedidos',      titulo:'Múltiplos pedidos — destaca o mais recente',  pad:'Encontrei *{total} pedidos* no seu cadastro! 📦\n\n*Mais recente:* #{ultimo_pedido}\n📅 {data_ultimo} — {valor_ultimo}\n\nQual pedido você precisa? Posso verificar nota fiscal, rastreio ou detalhes.\n[BOTOES: Nota fiscal #{ultimo_pedido} | Rastreio #{ultimo_pedido} | Ver outros pedidos]', vars:['{total}','{ultimo_pedido}','{data_ultimo}','{valor_ultimo}'] },
  { cat:'Pedidos', campo:'msgPedidoEntregue_botoes',  titulo:'Botões — pedido entregue',                   pad:'Avaliar compra | Preciso de ajuda | Nova compra', vars:null },
  { cat:'Pedidos', campo:'msgPedidoTransito_botoes',  titulo:'Botões — pedido em trânsito',                pad:'Rastrear entrega | Nota fiscal #{numero} | Nova compra', vars:['{numero}'] },
  { cat:'Pedidos', campo:'msgPedidoAguardando_botoes',titulo:'Botões — aguardando envio (sem Cancelar)',   pad:'Falar sobre o pedido | Nova compra', vars:null },
  { cat:'Pedidos', campo:'msgOutrosPedidos',          titulo:'Template lista de outros pedidos',           pad:'Seus últimos pedidos:\n1️⃣ #{num1} — {data1} — {valor1}\nQual você quer consultar? Me mande o número.\n[BOTOES: Nota fiscal | Rastreio]', vars:['{num1}','{data1}','{valor1}'] },
]

// ── Bypasses com fluxo explicado ─────────────────────────────────────────────
const BYPASSES = [
  { cat:'Carrinho', icon:ShoppingCart, cor:'#00d4aa',
    titulo:'Quantidade do produto',
    desc:'Após seleção numérica ou clique em "Adicionar", o Node.js envia a pergunta de quantidade direto ao WhatsApp sem consultar o Gemini.',
    fluxo:['Cliente seleciona produto por número ou clica "Adicionar"','Sistema envia msg direto: "Quantas unidades de X você gostaria?"','Cliente responde com número → bypass chama adicionar_item()'] },
  { cat:'Checkout', icon:CheckCircle, cor:'#22c55e',
    titulo:'Finalizar pedido',
    desc:'Botão "Finalizar pedido" ou texto similar chama finalizar_pedido() direto, sem consultar IA.',
    fluxo:['Cliente clica "Finalizar pedido"','Bypass chama finalizar_pedido({}) via bypassFerramenta','Sistema pergunta: "Já tenho cadastro" ou "Sou novo cliente"'] },
  { cat:'Checkout', icon:Shield, cor:'#4a9fff',
    titulo:'CPF → finalizar_pedido',
    desc:'CPF recebido após "Já tenho cadastro" chama finalizar_pedido() via executarFerramenta — evita o Gemini chamar consultar_pedido.',
    fluxo:['Cliente clica "Já tenho cadastro"','Sistema pede CPF diretamente','CPF recebido → executarFerramenta("finalizar_pedido", {cpf_cnpj})'] },
  { cat:'Pagamento', icon:CreditCard, cor:'#f59e0b',
    titulo:'PIX / Cartão de crédito',
    desc:'Escolha de forma de pagamento executa finalizar_pedido() via executarFerramenta — gera código PIX ou link MP Preferences.',
    fluxo:['Cliente clica "Pagar com PIX" ou "Cartão de Crédito"','executarFerramenta("finalizar_pedido", {}) com formaPagamento salvo','PIX: gera qr_code via /v1/payments | Cartão: gera link via /checkout/preferences'] },
  { cat:'Endereço', icon:Truck, cor:'#a78bfa',
    titulo:'Confirmar endereço → calcular_frete',
    desc:'Confirmação de endereço dispara calcular_frete() via executarFerramenta sem passar pelo Gemini.',
    fluxo:['Cliente clica "Confirmar endereço"','executarFerramenta("calcular_frete", {cep_destino})','Sistema exibe opções de frete como menu interativo'] },
  { cat:'Endereço', icon:Truck, cor:'#60a5fa',
    titulo:'Alterar endereço → solicita CEP',
    desc:'Botão "Alterar endereço" envia pedido de CEP direto ao WhatsApp e aguarda resposta.',
    fluxo:['Cliente clica "Alterar endereço"','Sistema envia: "Qual é o novo CEP de entrega?"','CEP recebido → ViaCEP → botões confirmar/alterar'] },
  { cat:'Carrinho', icon:Package, cor:'#e879f9',
    titulo:'Remover / Alterar / Ver foto',
    desc:'Lista numerada enviada direto ao WA. Foto usa bling_id real do ctx.produtoSelecionado — sem o Gemini inventar IDs.',
    fluxo:['Editar carrinho → lista numerada de itens direto ao WA','Remover: seleciona número → bypassFerramenta("remover_item")','Ver foto: bypass direto com bling_id real → enviar_foto_produto()'] },
  { cat:'Nota Fiscal', icon:FileText, cor:'#f59e0b',
    titulo:'Emitir Nota Fiscal',
    desc:'Botão "Emitir Nota Fiscal" dispara emitir_nota_fiscal() direto, sem consultar IA. Mensagem de aguardando é enviada imediatamente; autorização ocorre em background.',
    fluxo:[
      'consultar_pedido retorna NF pendente → botões [Emitir Nota Fiscal | Ver pedido completo]',
      'Cliente clica "Emitir Nota Fiscal" → sistema envia msgNotaFiscalAguardando imediatamente',
      'Background: POST /nfe (cria) → POST /nfe/:id/enviar (SEFAZ)',
      'Polling a cada 3s até 30s → se autorizada → envia msgNotaFiscalSucesso com link',
      'Se > 30s sem resposta → envia msgNotaFiscalProcessando ("aguarde alguns minutos")',
      'Se erro SEFAZ → abre ocorrência + envia msgNotaFiscalFalha com protocolo'
    ]
  },
  { cat:'Nota Fiscal', icon:FileText, cor:'#22c55e',
    titulo:'NF já autorizada',
    desc:'Se pedido já tem NF autorizada no Bling, retorna o link diretamente sem emitir novamente.',
    fluxo:[
      'consultar_pedido detecta pedido.notaFiscal.id',
      'GET /nfe/:id → situacao = Autorizada + linkDanfe disponível',
      'Retorna msgNotaFiscalEmitida com link diretamente',
      'Sem polling, sem emissão — só consulta'
    ]
  },
  { cat:'Histórico', icon:Package, cor:'#06b6d4',
    titulo:'Nota fiscal #N / Rastreio #N',
    desc:'Botões gerados dinamicamente com o número do pedido embutido. Interceptados no Node.js antes do Gemini.',
    fluxo:[
      'buscar_pedidos_cliente retorna botões [Nota fiscal #228434 | Rastreio #228434 | Ver outros pedidos]',
      '"Nota fiscal #228434" → regex extrai número → emitir_nota_fiscal() em background → msgNotaFiscalAguardando imediato',
      '"Rastreio #228434" → regex extrai número → instrui Gemini: consultar_pedido(228434)',
      '"Ver outros pedidos" → usa CPF do ctx → buscar_pedidos_cliente()'
    ]
  },
  { cat:'Avaliação', icon:Star, cor:'#f59e0b',
    titulo:'Avaliar compra',
    desc:'Botão "Avaliar compra" no pedido entregue inicia o fluxo de estrelas direto no Node.js, sem passar pelo Gemini.',
    fluxo:[
      'Cliente clica "Avaliar compra" → sistema envia msgAvaliacaoEstrelas com botões ⭐ a ⭐⭐⭐⭐⭐',
      'Cliente escolhe estrelas → nota registrada no banco + envia msgAvaliacaoComentario',
      'Cliente clica "Sim, quero comentar" → aguarda texto livre',
      'Texto recebido → UPDATE na avaliação com comentário',
      'Resposta final: msgAvaliacaoObrigada / msgAvaliacaoNeutra / msgAvaliacaoNegativa',
      '1-2★ → abre ocorrência automática para a equipe'
    ]
  },
  { cat:'Avaliação', icon:Star, cor:'#22c55e',
    titulo:'Sim, quero comentar',
    desc:'Após escolher as estrelas, cliente confirma que quer deixar comentário. Sistema aguarda texto livre.',
    fluxo:[
      'ctx._aguardandoComentario está ativo com { numPed, estrelas }',
      'Qualquer texto livre → UPDATE avaliacoes SET comentario',
      '"Não, obrigada" → registra sem comentário',
      'Envia mensagem de confirmação conforme a nota dada'
    ]
  },
]

const CAT_CORES = { Checkout:'#22c55e', Carrinho:'#00d4aa', Pagamento:'#f59e0b', Endereço:'#a78bfa', Fotos:'#fb923c', 'Nota Fiscal':'#f59e0b', 'Histórico':'#06b6d4', 'Avaliação':'#f59e0b' }

// ── Componentes ───────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  return (
    <aside style={{ width:collapsed?48:196, flexShrink:0, display:'flex', flexDirection:'column', background:'var(--bg-2)', borderRight:'1px solid var(--sep)', transition:'width .18s cubic-bezier(.4,0,.2,1)', overflow:'hidden' }}>
      <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--sep)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        {!collapsed && <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-4)' }}>Config LLM</span>}
        <button onClick={()=>setCollapsed(v=>!v)} style={{ marginLeft:'auto', padding:4, borderRadius:6, border:'none', background:'transparent', color:'var(--label-4)', cursor:'pointer', display:'flex' }}>
          {collapsed?<ChevronR size={13}/>:<ChevronLeft size={13}/>}
        </button>
      </div>
      <nav style={{ flex:1, overflowY:'auto', padding:'6px 0' }}>
        {NAV.map(g=>(
          <div key={g.group} style={{ marginBottom:4 }}>
            {!collapsed && <div style={{ padding:'6px 12px 3px', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-4)' }}>{g.group}</div>}
            {g.items.map(item=>{
              const Icon=item.icon; const on=active===item.id
              return (
                <button key={item.id} onClick={()=>setActive(item.id)} title={collapsed?item.label:undefined}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:collapsed?'8px 0':'7px 12px', justifyContent:collapsed?'center':'flex-start', border:'none', cursor:'pointer', transition:'all .1s', background:on?'var(--accent-dim)':'transparent', borderLeft:`2px solid ${on?'var(--accent)':'transparent'}`, color:on?'var(--accent)':'var(--label-3)' }}>
                  <Icon size={14} style={{ flexShrink:0 }}/>
                  {!collapsed && <>
                    <span style={{ fontSize:12.5, fontWeight:500, flex:1, textAlign:'left', whiteSpace:'nowrap' }}>{item.label}</span>
                    {item.badge && <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:99, background:'var(--accent-dim)', color:'var(--accent)' }}>{item.badge}</span>}
                  </>}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}

function KpiCard({ label, value, sub, icon:Ic, cor, trend, mono=false }) {
  return (
    <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12, padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ width:32, height:32, borderRadius:9, background:`${cor}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Ic size={14} style={{ color:cor }}/>
        </div>
        {trend!==undefined && (
          <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, background:trend>=0?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)', color:trend>=0?'#22c55e':'#ef4444' }}>
            {trend>=0?'↑':'↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize:mono?16:22, fontWeight:700, color:'var(--label)', letterSpacing:mono?'.05em':'-.5px', fontFamily:mono?'monospace':'inherit', marginBottom:2 }}>{value??'—'}</div>
        <div style={{ fontSize:11, color:'var(--label-3)' }}>{label}</div>
        {sub && <div style={{ fontSize:10, color:'var(--label-4)', marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function HealthRing({ taxa }) {
  const r=44, circ=2*Math.PI*r, pct=Math.min(100,Math.max(0,parseFloat(taxa)||0))
  const cor=pct>=95?'#22c55e':pct>=70?'#f59e0b':'#ef4444'
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <svg width={106} height={106} viewBox="0 0 106 106">
        <circle cx={53} cy={53} r={r} fill="none" stroke="var(--fill)" strokeWidth={9}/>
        <circle cx={53} cy={53} r={r} fill="none" stroke={cor} strokeWidth={9}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} strokeLinecap="round"
          transform="rotate(-90 53 53)" style={{ transition:'stroke-dashoffset 1.2s' }}/>
        <text x={53} y={50} textAnchor="middle" style={{ fill:cor, fontSize:19, fontWeight:700, fontFamily:'system-ui' }}>{pct.toFixed(0)}%</text>
        <text x={53} y={65} textAnchor="middle" style={{ fill:'var(--label-4)', fontSize:9, fontFamily:'system-ui', letterSpacing:'.05em' }}>SUCESSO</text>
      </svg>
    </div>
  )
}

function Card({ children, style={} }) {
  return <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12, padding:'16px 18px', ...style }}>{children}</div>
}

function SLabel({ children }) {
  return <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:8, marginTop:0 }}>{children}</p>
}

function FInput({ label, value, onChange, type='text', placeholder, hint }) {
  const [f,setF]=useState(false)
  return (
    <div>
      {label && <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:5 }}>{label}</label>}
      <input type={type} value={value||''} onChange={e=>onChange?.(e.target.value)} placeholder={placeholder}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{ width:'100%', padding:'7px 10px', borderRadius:8, fontSize:12.5, outline:'none', background:'var(--bg)', border:`1px solid ${f?'var(--accent)':'var(--sep)'}`, color:'var(--label)', fontFamily:'inherit', boxSizing:'border-box', boxShadow:f?'0 0 0 3px var(--accent-dim)':'none', transition:'border .15s' }}/>
      {hint && <p style={{ fontSize:10, color:'var(--label-4)', marginTop:3 }}>{hint}</p>}
    </div>
  )
}

function SInput({ value, onChange, placeholder }) {
  const [show,setShow]=useState(false)
  return (
    <div style={{ position:'relative' }}>
      <input type={show?'text':'password'} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%', padding:'7px 34px 7px 10px', borderRadius:8, fontSize:12.5, outline:'none', background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)', fontFamily:'monospace', boxSizing:'border-box' }}/>
      <button type="button" onClick={()=>setShow(v=>!v)}
        style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', border:'none', background:'transparent', color:'var(--label-4)', cursor:'pointer', padding:2, display:'flex' }}>
        {show?<EyeOff size={13}/>:<Eye size={13}/>}
      </button>
    </div>
  )
}

// Modal de edição de mensagem bypass
function MsgEditModal({ msg, value, onClose, onChange }) {
  const [val, setVal] = useState(value || '')
  const cor = CAT_CORES[msg.cat] || 'var(--accent)'
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
      <div style={{ width:480, height:'100%', background:'var(--bg-2)', display:'flex', flexDirection:'column', boxShadow:'-20px 0 60px rgba(0,0,0,.3)' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--sep)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:cor, flexShrink:0 }}/>
          <div>
            <h3 style={{ fontSize:14, fontWeight:700, color:'var(--label)', margin:0 }}>{msg.titulo}</h3>
            <span style={{ fontSize:10, padding:'1px 6px', borderRadius:4, background:`${cor}15`, color:cor, fontWeight:600 }}>{msg.cat}</span>
          </div>
          <button onClick={()=>onClose()} style={{ marginLeft:'auto', padding:6, borderRadius:8, border:'none', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', display:'flex' }}>
            <X size={14}/>
          </button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          <SLabel>Texto da mensagem</SLabel>
          <textarea value={val} onChange={e=>setVal(e.target.value)} rows={6}
            style={{ width:'100%', padding:'10px 12px', borderRadius:10, fontSize:12.5, fontFamily:'monospace', outline:'none', resize:'vertical', background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)', lineHeight:1.6, boxSizing:'border-box' }}/>
          {msg.vars && (
            <div style={{ marginTop:12 }}>
              <SLabel>Variáveis disponíveis</SLabel>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {msg.vars.map(v=>(
                  <code key={v} onClick={()=>setVal(val+v)} style={{ fontSize:11, padding:'3px 8px', borderRadius:6, background:`${cor}12`, color:cor, border:`1px solid ${cor}25`, cursor:'pointer', fontFamily:'monospace' }}>{v}</code>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop:16, padding:'12px 14px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--sep)' }}>
            <SLabel>Preview</SLabel>
            <div style={{ padding:'8px 12px', borderRadius:'10px 10px 10px 2px', background:'#202c33', display:'inline-block', maxWidth:'100%' }}>
              <p style={{ fontSize:11, lineHeight:1.6, color:'#e9edef', margin:0, whiteSpace:'pre-wrap', fontFamily:'system-ui' }}>
                {(val||msg.pad).replace('{produto}','*Strass SS39 Rose*').replace('{cep}','13480370').replace('{n}','3').replace('{qtd_atual}','2')}
              </p>
            </div>
          </div>
          <button onClick={()=>setVal(msg.pad)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', fontSize:11, marginTop:12 }}>
            <RotateCcw size={10}/> Restaurar padrão
          </button>
        </div>
        <div style={{ padding:'14px 20px', borderTop:'1px solid var(--sep)', display:'flex', justifyContent:'flex-end', gap:8, flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:9, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', fontSize:12.5 }}>Cancelar</button>
          <button onClick={()=>{onChange(msg.campo,val);onClose()}} style={{ padding:'8px 18px', borderRadius:9, border:'none', background:'var(--accent)', color:'#000', cursor:'pointer', fontSize:12.5, fontWeight:700 }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function PageLLMConfig({ api }) {
  const [active,    setActive]    = useState('monitor')
  const [collapsed, setCollapsed] = useState(false)
  const [cfg,       setCfg]       = useState({})
  const [health,    setHealth]    = useState(null)
  const [modelos,   setModelos]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [erro,      setErro]      = useState(null)
  const [testando,  setTestando]  = useState(false)
  const [testeRes,  setTesteRes]  = useState(null)
  const [showKey,   setShowKey]   = useState(false)
  const [msgVals,   setMsgVals]   = useState({})
  const [autoR,     setAutoR]     = useState(true)
  const [editMsg,   setEditMsg]   = useState(null)
  const [expandBy,  setExpandBy]  = useState(null)
  const timerRef = useRef(null)

  const set = (k,v) => setCfg(c=>({...c,[k]:v}))
  const setMsg = (campo,v) => { setMsgVals(m=>({...m,[campo]:v})); set(campo,v) }

  const carregar = useCallback(async () => {
    if (!api) { setLoading(false); return }
    try {
      const [c,h,m] = await Promise.all([
        fetch(`${api}/api/ia/config`).then(r=>r.ok?r.json():{}).catch(()=>({})),
        fetch(`${api}/api/ia/health`).then(r=>r.ok?r.json():null).catch(()=>null),
        fetch(`${api}/api/ia/modelos`).then(r=>r.ok?r.json():{}).catch(()=>({})),
      ])
      setCfg(c||{})
      setHealth(h)
      setModelos(m?.provedores||[])
      const mv={}; MSGS.forEach(msg=>{ if(c[msg.campo]) mv[msg.campo]=c[msg.campo] })
      setMsgVals(mv)
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(()=>{ carregar() },[carregar])
  useEffect(()=>{
    if (timerRef.current) clearInterval(timerRef.current)
    if (!autoR||active!=='monitor'||!api) return
    timerRef.current=setInterval(()=>{
      fetch(`${api}/api/ia/health`).then(r=>r.ok?r.json():null).then(h=>h&&setHealth(h)).catch(()=>{})
    },30000)
    return ()=>clearInterval(timerRef.current)
  },[autoR,active,api])

  const salvar = async () => {
    setSaving(true); setErro(null)
    try {
      const r=await fetch(`${api}/api/ia/config`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(cfg)})
      if (!r.ok) throw new Error(await r.text())
      setSaved(true); setTimeout(()=>setSaved(false),2500)
    } catch(e){ setErro(e.message?.slice(0,80)) }
    setSaving(false)
  }

  const testar = async () => {
    setTestando(true); setTesteRes(null)
    try {
      const r=await fetch(`${api}/api/ia/test-key`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({geminiKey:cfg.geminiKey,modelo:cfg.modelo})})
      setTesteRes(await r.json())
    } catch { setTesteRes({ok:false,erro:'Erro de conexão'}) }
    setTestando(false)
  }

  const chart14 = (health?.historico||[]).map(d=>({
    dia: new Date(d.dia).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),
    chamadas:d.chamadas, custo:parseFloat(d.custo)||0, taxa:d.taxa,
  }))

  const provedorAtual = modelos.find(p=>p.id===(cfg.provedor||'google'))
  const modelosDisp   = provedorAtual?.modelos||[]

  const PAGE = {
    monitor: {title:'Saúde da IA',     sub:'Monitor em tempo real · auto-refresh 30s'},
    custos:  {title:'Custos & Uso',    sub:'Análise financeira de tokens e chamadas'},
    modelos: {title:'Por Modelo',      sub:'Performance e custo por modelo — últimos 30 dias'},
    llm:     {title:'LLM & API Keys',  sub:'Provedor, modelo e credenciais de API'},
    params:  {title:'Parâmetros',      sub:'Temperatura, tokens e configurações avançadas'},
    msgs:    {title:'Mensagens',       sub:'18 mensagens bypass — enviadas sem passar pelo Gemini'},
    bypasses:{title:'Bypasses',        sub:'Fluxos automáticos · todos hardcoded, sempre ativos'},
  }
  const p = PAGE[active]||{}

  if (loading) return (
    <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <RefreshCw size={18} className="animate-spin" style={{ color:'var(--accent)' }}/>
    </div>
  )

  return (
    <div style={{ height:'100%', display:'flex', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed}/>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Header */}
        <div style={{ padding:'11px 20px', flexShrink:0, display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
          <div>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--label)', margin:0 }}>{p.title}</h2>
            <p style={{ fontSize:11, color:'var(--label-4)', margin:'2px 0 0' }}>{p.sub}</p>
          </div>
          {health && active==='monitor' && (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:700, border:'1px solid', ...(health.status==='operacional'?{background:'rgba(34,197,94,.08)',color:'#22c55e',borderColor:'rgba(34,197,94,.25)'}:{background:'rgba(245,158,11,.08)',color:'#f59e0b',borderColor:'rgba(245,158,11,.25)'}) }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block', animation:'pulse 2s ease infinite' }}/>
              {health.status==='operacional'?'Operacional':health.status==='degradado'?'Degradado':'Instável'}
            </div>
          )}
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={()=>setAutoR(v=>!v)} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:9, fontSize:11, fontWeight:600, border:'1px solid', cursor:'pointer', ...(autoR?{background:'rgba(34,197,94,.08)',color:'#22c55e',borderColor:'rgba(34,197,94,.25)'}:{background:'var(--fill)',color:'var(--label-4)',borderColor:'var(--sep)'}) }}>
              {autoR?<Wifi size={12}/>:<WifiOff size={12}/>} {autoR?'Live':'Off'}
            </button>
            <button onClick={carregar} style={{ padding:7, borderRadius:9, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-4)', cursor:'pointer', display:'flex' }}>
              <RefreshCw size={13}/>
            </button>
            {erro && <span style={{ fontSize:11, color:'#ef4444', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{erro}</span>}
            <button onClick={salvar} disabled={saving} style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 16px', borderRadius:9, border:'none', cursor:'pointer', fontSize:12.5, fontWeight:700, background:saved?'#22c55e':'var(--accent)', color:'#000', transition:'all .2s' }}>
              {saved?<><CheckCircle size={13}/> Salvo</>:saving?'Salvando...':<><Save size={13}/> Salvar</>}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
          <div style={{ maxWidth:900, margin:'0 auto' }}>

            {/* ══ MONITOR ══ */}
            {active==='monitor' && <>
              {!health ? (
                <div style={{ padding:'48px 24px', textAlign:'center', background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12 }}>
                  <AlertTriangle size={22} style={{ color:'var(--label-4)', marginBottom:12 }}/>
                  <p style={{ fontSize:13, color:'var(--label-3)', marginBottom:4 }}>Nenhum dado de monitoramento ainda.</p>
                  <p style={{ fontSize:11, color:'var(--label-4)' }}>Configure a API Key e reinicie. Os dados aparecem conforme a IA processa mensagens.</p>
                  <button onClick={carregar} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', fontSize:12, marginTop:16 }}>
                    <RefreshCw size={12}/> Tentar novamente
                  </button>
                </div>
              ) : <>
                {/* KPIs */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
                  <KpiCard label="Chamadas hoje" value={health.chamadas_hoje} sub={`${health.chamadas_hora}/h agora`} icon={BarChart3} cor="#00d4aa"/>
                  <KpiCard label="Taxa de sucesso" value={`${health.taxa_sucesso}%`} sub="últimas 20 chamadas" icon={Percent} cor="#22c55e" trend={parseFloat(health.taxa_sucesso)>=95?5:parseFloat(health.taxa_sucesso)>=70?0:-10}/>
                  <KpiCard label="Custo hoje" value={`$${health.custo_hoje_usd}`} sub={`Mês: $${health.custo_mes_usd}`} icon={DollarSign} cor="#f59e0b"/>
                  <KpiCard label="Erros hoje" value={health.erros_hoje} sub={`${health.ok_hoje} OK`} icon={AlertTriangle} cor={health.erros_hoje>0?'#ef4444':'#22c55e'} trend={health.erros_hoje>0?-10:5}/>
                </div>

                {chart14.length>0 && <>
                  {/* Chart chamadas + ring */}
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12, marginBottom:12 }}>
                    <Card>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                        <SLabel>Chamadas — 14 dias</SLabel>
                        <TrendingUp size={13} style={{ color:'var(--accent)' }}/>
                      </div>
                      <ResponsiveContainer width="100%" height={130}>
                        <AreaChart data={chart14}>
                          <defs><linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3}/><stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/></linearGradient></defs>
                          <XAxis dataKey="dia" tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false}/>
                          <YAxis tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false} width={26}/>
                          <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:9, fontSize:11 }}/>
                          <Area type="monotone" dataKey="chamadas" stroke="#00d4aa" strokeWidth={2} fill="url(#gC)"/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </Card>
                    <Card style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
                      <HealthRing taxa={health.taxa_sucesso}/>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, width:'100%' }}>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:16, fontWeight:700, color:'#22c55e' }}>{health.ok_hoje}</div>
                          <div style={{ fontSize:9, color:'var(--label-4)' }}>OK</div>
                        </div>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:16, fontWeight:700, color:'#ef4444' }}>{health.erros_hoje}</div>
                          <div style={{ fontSize:9, color:'var(--label-4)' }}>Erros</div>
                        </div>
                      </div>
                      <div style={{ fontSize:10, color:'var(--label-4)', textAlign:'center' }}>
                        Última: {health.ultima_chamada?new Date(health.ultima_chamada).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'—'}
                      </div>
                    </Card>
                  </div>

                  {/* Custo + taxa */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    <Card>
                      <SLabel>Custo diário (USD)</SLabel>
                      <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={chart14}>
                          <XAxis dataKey="dia" tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false}/>
                          <YAxis tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false} width={36} tickFormatter={v=>`$${v.toFixed(3)}`}/>
                          <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:9, fontSize:11 }} formatter={v=>[`$${parseFloat(v).toFixed(4)}`,'Custo']}/>
                          <Bar dataKey="custo" radius={[3,3,0,0]}>
                            {chart14.map((_,i)=><Cell key={i} fill="#f59e0b" opacity={0.75}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                    <Card>
                      <SLabel>Taxa de sucesso (%)</SLabel>
                      <ResponsiveContainer width="100%" height={100}>
                        <AreaChart data={chart14}>
                          <defs><linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient></defs>
                          <XAxis dataKey="dia" tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false}/>
                          <YAxis domain={[0,100]} tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false} width={26}/>
                          <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:9, fontSize:11 }} formatter={v=>[`${v}%`,'Taxa']}/>
                          <Area type="monotone" dataKey="taxa" stroke="#22c55e" strokeWidth={2} fill="url(#gT)"/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </Card>
                  </div>
                </>}

                {/* Footer stats */}
                <Card style={{ display:'flex', alignItems:'center', gap:16, padding:'12px 16px' }}>
                  <Clock size={13} style={{ color:'var(--label-4)', flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:'var(--label-3)' }}>Última chamada: <strong style={{ color:'var(--label)' }}>{health.ultima_chamada?new Date(health.ultima_chamada).toLocaleString('pt-BR'):'—'}</strong></span>
                  <div style={{ flex:1 }}/>
                  <Hash size={11} style={{ color:'var(--label-4)' }}/>
                  <span style={{ fontSize:11, color:'var(--label-4)' }}>{(health.total_tokens||0).toLocaleString('pt-BR')} tokens · custo total: <strong style={{ color:'var(--label-3)' }}>${health.custo_total_usd}</strong></span>
                </Card>
              </>}
            </>}

            {/* ══ CUSTOS ══ */}
            {active==='custos' && <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
                <KpiCard label="Total tokens" value={(health?.total_tokens||0).toLocaleString('pt-BR')} sub="histórico completo" icon={Hash} cor="#a78bfa"/>
                <KpiCard label="Custo hoje" value={`$${health?.custo_hoje_usd||'0.0000'}`} sub="últimas 24h" icon={DollarSign} cor="#f59e0b"/>
                <KpiCard label="Custo mês" value={`$${health?.custo_mes_usd||'0.0000'}`} sub="últimos 30 dias" icon={TrendingUp} cor="#00d4aa"/>
                <KpiCard label="Custo total" value={`$${health?.custo_total_usd||'0.0000'}`} sub="histórico acumulado" icon={BarChart3} cor="#4a9fff"/>
              </div>
              {chart14.length>0 ? <>
                <Card style={{ marginBottom:12 }}>
                  <SLabel>Custo acumulado — 14 dias (USD)</SLabel>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={chart14}>
                      <defs><linearGradient id="gCusto" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs>
                      <XAxis dataKey="dia" tick={{ fontSize:10, fill:'var(--label-4)' }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fontSize:10, fill:'var(--label-4)' }} axisLine={false} tickLine={false} width={44} tickFormatter={v=>`$${v.toFixed(3)}`}/>
                      <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:9, fontSize:11 }} formatter={v=>[`$${parseFloat(v).toFixed(4)}`,'Custo']}/>
                      <Area type="monotone" dataKey="custo" stroke="#f59e0b" strokeWidth={2} fill="url(#gCusto)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
                <Card>
                  <SLabel>Tokens por dia</SLabel>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={chart14}>
                      <XAxis dataKey="dia" tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fontSize:9, fill:'var(--label-4)' }} axisLine={false} tickLine={false} width={40} tickFormatter={v=>v>999?`${(v/1000).toFixed(1)}k`:v}/>
                      <Tooltip contentStyle={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:9, fontSize:11 }}/>
                      <Bar dataKey="tokens" radius={[3,3,0,0]}>
                        {chart14.map((_,i)=><Cell key={i} fill="#a78bfa" opacity={0.75}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </> : <div style={{ padding:'32px', textAlign:'center', color:'var(--label-4)', fontSize:12, background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12 }}>Nenhum dado de custo disponível ainda.</div>}
            </>}

            {/* ══ POR MODELO ══ */}
            {active==='modelos' && <>
              {(!health?.porModelo||health.porModelo.length===0) ? (
                <div style={{ padding:'32px', textAlign:'center', color:'var(--label-4)', fontSize:12, background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12 }}>Nenhuma chamada registrada ainda.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {health.porModelo.map((m,i)=>(
                    <Card key={i} style={{ padding:'14px 18px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:'var(--label)' }}>{m.modelo}</span>
                            <span style={{ fontSize:10, padding:'1px 6px', borderRadius:99, background:'var(--fill)', color:'var(--label-4)', border:'1px solid var(--sep)' }}>{m.provedor}</span>
                          </div>
                          <div style={{ display:'flex', gap:20 }}>
                            <div><div style={{ fontSize:11, color:'var(--label-4)' }}>Chamadas</div><div style={{ fontSize:14, fontWeight:600, color:'var(--label)' }}>{m.chamadas}</div></div>
                            <div><div style={{ fontSize:11, color:'var(--label-4)' }}>Custo total</div><div style={{ fontSize:14, fontWeight:600, color:'#f59e0b' }}>${m.custo}</div></div>
                            <div><div style={{ fontSize:11, color:'var(--label-4)' }}>Taxa</div><div style={{ fontSize:14, fontWeight:600, color:m.taxa>=95?'#22c55e':m.taxa>=70?'#f59e0b':'#ef4444' }}>{m.taxa}%</div></div>
                            <div><div style={{ fontSize:11, color:'var(--label-4)' }}>Tokens in/out</div><div style={{ fontSize:12, fontWeight:500, color:'var(--label-3)', fontFamily:'monospace' }}>{m.tokens_in?.toLocaleString()}/{m.tokens_out?.toLocaleString()}</div></div>
                          </div>
                        </div>
                        <div style={{ width:80, textAlign:'right', flexShrink:0 }}>
                          <div style={{ height:4, borderRadius:2, background:'var(--fill)', marginBottom:3 }}>
                            <div style={{ height:'100%', borderRadius:2, background:m.taxa>=95?'#22c55e':m.taxa>=70?'#f59e0b':'#ef4444', width:`${m.taxa}%`, transition:'width 1s' }}/>
                          </div>
                          <span style={{ fontSize:9, color:'var(--label-4)' }}>{m.erros} erros</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>}

            {/* ══ LLM & API KEYS ══ */}
            {active==='llm' && <>
              <Card style={{ marginBottom:14 }}>
                <SLabel>Provedor de IA</SLabel>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:0 }}>
                  {[{id:'google',l:'Google Gemini',desc:'Recomendado — melhor custo-benefício',cor:'#4a9fff'},{id:'anthropic',l:'Anthropic Claude',desc:'Alta capacidade de raciocínio',cor:'#e879f9'}].map(pv=>{
                    const on=(cfg.provedor||'google')===pv.id
                    return (
                      <button key={pv.id} onClick={()=>set('provedor',pv.id)} style={{ padding:'12px 14px', borderRadius:10, textAlign:'left', cursor:'pointer', transition:'all .15s', background:on?`${pv.cor}10`:'var(--bg)', border:`1px solid ${on?pv.cor+'45':'var(--sep)'}` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background:on?pv.cor:'var(--fill)', transition:'all .2s' }}/>
                          <span style={{ fontSize:13, fontWeight:600, color:on?pv.cor:'var(--label)' }}>{pv.l}</span>
                        </div>
                        <p style={{ fontSize:11, color:'var(--label-4)', margin:0, paddingLeft:14 }}>{pv.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </Card>

              <Card style={{ marginBottom:14 }}>
                <SLabel>Modelo</SLabel>
                {modelosDisp.length>0 ? (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {modelosDisp.map(m=>{
                      const on=cfg.modelo===m.id
                      return (
                        <button key={m.id} onClick={()=>set('modelo',m.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:9, textAlign:'left', cursor:'pointer', transition:'all .15s', background:on?'var(--accent-dim)':'var(--bg)', border:`1px solid ${on?'var(--accent)':'var(--sep)'}` }}>
                          <div style={{ width:14, height:14, borderRadius:'50%', border:`2px solid ${on?'var(--accent)':'var(--sep)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {on&&<div style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)' }}/>}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ fontSize:12.5, fontWeight:500, color:'var(--label)' }}>{m.nome}</span>
                              {m.freeTier&&<span style={{ fontSize:8, padding:'1px 5px', borderRadius:99, background:'rgba(34,197,94,.1)', color:'#22c55e', fontWeight:700 }}>Free</span>}
                            </div>
                            <p style={{ fontSize:10, color:'var(--label-4)', margin:0 }}>{m.desc}</p>
                          </div>
                          <div style={{ textAlign:'right', flexShrink:0 }}>
                            <div style={{ fontSize:9, color:'var(--label-4)' }}>in ${m.inputPer1M}/M</div>
                            <div style={{ fontSize:9, color:'var(--label-4)' }}>out ${m.outputPer1M}/M</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : <FInput label="ID do modelo" value={cfg.modelo} onChange={v=>set('modelo',v)} placeholder="gemini-2.5-flash"/>}
              </Card>

              <Card>
                <SLabel>Chaves de API</SLabel>
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:5 }}>Gemini API Key</label>
                    <div style={{ display:'flex', gap:8 }}>
                      <SInput value={cfg.geminiKey} onChange={v=>set('geminiKey',v)} placeholder="AIzaSy..."/>
                      <button onClick={testar} disabled={testando} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', fontSize:12, fontWeight:600, flexShrink:0 }}>
                        {testando?<RefreshCw size={12} className="animate-spin"/>:<TestTube2 size={12}/>} {testando?'Testando':'Testar'}
                      </button>
                    </div>
                    <p style={{ fontSize:10, color:'var(--label-4)', marginTop:3 }}>aistudio.google.com — começa com AIzaSy</p>
                    {testeRes && (
                      <div style={{ marginTop:8, padding:'8px 12px', borderRadius:9, fontSize:12, display:'flex', alignItems:'flex-start', gap:7, ...(testeRes.ok?{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.25)',color:'#22c55e'}:{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.25)',color:'#ef4444'}) }}>
                        {testeRes.ok?<CheckCircle size={13} style={{ flexShrink:0, marginTop:1 }}/>:<XCircle size={13} style={{ flexShrink:0, marginTop:1 }}/>}
                        {testeRes.ok?`Chave válida${testeRes.resposta?' — resposta: '+testeRes.resposta:''}`:testeRes.erro}
                      </div>
                    )}
                  </div>
                  <FInput label="Claude API Key (opcional)" hint="console.anthropic.com">
                    <SInput value={cfg.claudeKey} onChange={v=>set('claudeKey',v)} placeholder="sk-ant-..."/>
                  </FInput>
                </div>
              </Card>
            </>}

            {/* ══ PARÂMETROS ══ */}
            {active==='params' && <>
              <Card style={{ marginBottom:14 }}>
                <SLabel>Temperatura</SLabel>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
                  <span style={{ fontSize:11, color:'var(--label-4)' }}>Determinístico</span>
                  <input type="range" min={0} max={1} step={0.1} value={parseFloat(cfg.temperatura||0.7)} onChange={e=>set('temperatura',e.target.value)} style={{ flex:1, accentColor:'var(--accent)', cursor:'pointer' }}/>
                  <span style={{ fontSize:11, color:'var(--label-4)' }}>Criativo</span>
                  <span style={{ fontSize:16, fontWeight:700, color:'var(--accent)', minWidth:32, textAlign:'right' }}>{parseFloat(cfg.temperatura||0.7).toFixed(1)}</span>
                </div>
                {parseFloat(cfg.temperatura||0.7)>0.8 && (
                  <div style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'9px 12px', borderRadius:9, background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', fontSize:11.5, color:'#f59e0b' }}>
                    <AlertTriangle size={13} style={{ flexShrink:0, marginTop:1 }}/>
                    Acima de 0.8 o Gemini pode retornar respostas instáveis (finish=STOP|parts=0). Recomendado: 0.5–0.7.
                  </div>
                )}
              </Card>
              <Card>
                <SLabel>Parâmetros avançados</SLabel>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <FInput label="Max tokens de saída" value={String(cfg.maxTokens||4000)} onChange={v=>set('maxTokens',parseInt(v)||4000)} hint="Recomendado: 4000. Máximo: 8000."/>
                  <div>
                    <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:5 }}>System prompt atual</label>
                    <div style={{ padding:'7px 10px', borderRadius:8, background:'var(--bg)', border:'1px solid var(--sep)', fontSize:12.5, color:'#22c55e', fontFamily:'monospace', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      ~920 chars <span style={{ fontSize:10, color:'var(--label-4)' }}>otimizado</span>
                    </div>
                    <p style={{ fontSize:10, color:'var(--label-4)', marginTop:3 }}>Compacto para evitar parts=0 no Gemini</p>
                  </div>
                </div>
              </Card>
            </>}

            {/* ══ MENSAGENS ══ */}
            {active==='msgs' && <>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:10, background:'rgba(0,212,170,.06)', border:'1px solid rgba(0,212,170,.2)', marginBottom:16 }}>
                <MessageSquare size={14} style={{ color:'#00d4aa', flexShrink:0, marginTop:2 }}/>
                <p style={{ fontSize:12, color:'var(--label-3)', lineHeight:1.6, margin:0 }}>
                  Textos enviados <strong style={{ color:'var(--label)' }}>diretamente ao cliente</strong> pelo sistema, sem passar pelo Gemini. Clique em <strong style={{ color:'var(--label)' }}>Editar</strong> para abrir o editor com preview ao vivo. Salve para aplicar no servidor.
                </p>
              </div>
              {[...new Set(MSGS.map(m=>m.cat))].map(cat=>{
                const cor = CAT_CORES[cat]||'var(--accent)'
                return (
                  <div key={cat} style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <div style={{ height:1, flex:1, background:'var(--sep)' }}/>
                      <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', padding:'0 8px' }}>{cat}</span>
                      <div style={{ height:1, flex:1, background:'var(--sep)' }}/>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {MSGS.filter(m=>m.cat===cat).map(msg=>{
                        const val = msgVals[msg.campo]
                        return (
                          <div key={msg.campo} style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:10, padding:'11px 14px', display:'flex', alignItems:'center', gap:12 }}>
                            <div style={{ width:6, height:6, borderRadius:'50%', background:cor, flexShrink:0 }}/>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                                <span style={{ fontSize:12.5, fontWeight:500, color:'var(--label)' }}>{msg.titulo}</span>
                                {msg.vars && <div style={{ display:'flex', gap:4 }}>{msg.vars.map(v=><code key={v} style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background:`${cor}12`, color:cor, border:`1px solid ${cor}20`, fontFamily:'monospace' }}>{v}</code>)}</div>}
                                {val && <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:99, background:'rgba(0,212,170,.1)', color:'#00d4aa', border:'1px solid rgba(0,212,170,.2)' }}>Personalizada</span>}
                              </div>
                              <p style={{ fontSize:11, color:'var(--label-4)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:400 }}>
                                {(val||msg.pad).slice(0,80)}
                              </p>
                            </div>
                            <button onClick={()=>setEditMsg(msg)} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', fontSize:11.5, fontWeight:500, flexShrink:0 }}>
                              <Edit3 size={11}/> Editar
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </>}

            {/* ══ BYPASSES ══ */}
            {active==='bypasses' && <>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:10, background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.2)', marginBottom:16 }}>
                <Lock size={14} style={{ color:'#22c55e', flexShrink:0, marginTop:2 }}/>
                <p style={{ fontSize:12, color:'var(--label-3)', lineHeight:1.6, margin:0 }}>
                  Bypasses são fluxos <strong style={{ color:'#22c55e' }}>hardcoded no ia-core</strong> — sempre ativos, não editáveis pela UI. Foram criados porque o Gemini às vezes ignora instruções e inventa dados. Esta tela documenta cada fluxo.
                  <br/>Para modificar um bypass, edite diretamente <code style={{ background:'var(--fill)', padding:'1px 5px', borderRadius:4, fontSize:11 }}>src/ia-core.js</code>.
                </p>
              </div>
              {[...new Set(BYPASSES.map(b=>b.cat))].map(cat=>{
                const items=BYPASSES.filter(b=>b.cat===cat)
                return (
                  <div key={cat} style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <div style={{ height:1, flex:1, background:'var(--sep)' }}/>
                      <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', padding:'0 8px' }}>{cat}</span>
                      <div style={{ height:1, flex:1, background:'var(--sep)' }}/>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:items.length>1?'1fr 1fr':'1fr', gap:8 }}>
                      {items.map((b,i)=>{
                        const Icon=b.icon; const expanded=expandBy===`${cat}-${i}`
                        return (
                          <div key={i} style={{ background:'var(--bg-2)', border:`1px solid var(--sep)`, borderLeft:`3px solid ${b.cor}60`, borderRadius:10, overflow:'hidden' }}>
                            <div style={{ padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:10 }}>
                              <div style={{ width:30, height:30, borderRadius:8, background:`${b.cor}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                <Icon size={14} style={{ color:b.cor }}/>
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                  <span style={{ fontSize:12.5, fontWeight:600, color:'var(--label)' }}>{b.titulo}</span>
                                  <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:99, background:'rgba(34,197,94,.1)', color:'#22c55e', flexShrink:0 }}>● Ativo</span>
                                </div>
                                <p style={{ fontSize:11, color:'var(--label-4)', margin:0, lineHeight:1.5 }}>{b.desc}</p>
                              </div>
                              <button onClick={()=>setExpandBy(expanded?null:`${cat}-${i}`)} style={{ border:'none', background:'transparent', color:'var(--label-4)', cursor:'pointer', padding:4, flexShrink:0 }}>
                                {expanded?<ChevronDown size={13}/>:<ChevronR size={13}/>}
                              </button>
                            </div>
                            {expanded && (
                              <div style={{ padding:'0 14px 12px 54px', borderTop:'1px solid var(--sep)' }}>
                                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', margin:'10px 0 8px' }}>Fluxo de execução</p>
                                {b.fluxo.map((step,si)=>(
                                  <div key={si} style={{ display:'flex', gap:8, marginBottom:6 }}>
                                    <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4, background:`${b.cor}12`, color:b.cor, flexShrink:0, height:'fit-content', marginTop:1 }}>{si+1}</span>
                                    <span style={{ fontSize:11.5, color:'var(--label-3)', lineHeight:1.5 }}>{step}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </>}

          </div>
        </div>
      </div>

      {/* Modal edição de mensagem */}
      {editMsg && (
        <MsgEditModal
          msg={editMsg}
          value={msgVals[editMsg.campo]}
          onClose={()=>setEditMsg(null)}
          onChange={setMsg}
        />
      )}
    </div>
  )
}
