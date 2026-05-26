import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Zap, Save, Send, RefreshCw, X, Sparkles, Check, Plus,
  FileText, MousePointer, Link as LinkIcon, ShoppingBag,
  CreditCard, Truck, Bell, Star, Package, Clock, MessageSquare,
  AlertCircle, ChevronRight, ChevronDown, ChevronUp, Eye,
  Settings, ToggleLeft, ToggleRight, Brain, Hash, Image,
  Mic, Video, Phone, Layers, XCircle, Copy, ExternalLink,
  AlertTriangle, CheckCircle, Info, MoreHorizontal, Pencil,
  PlayCircle, PauseCircle, Radio, Wifi, Shield, Globe,
  ArrowRight, SlidersHorizontal, Tag, Repeat, Activity
} from 'lucide-react'

// ── Constantes ────────────────────────────────────────────────────────────────
const R   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmt = n => Number(n||0).toLocaleString('pt-BR')

// Grupos e gatilhos
const GATILHOS = [
  // Bling automáticos
  { id:'pedido_criado',       label:'Pedido Criado',         grupo:'Pedidos',       tipo:'bling', icon:ShoppingBag, cor:'#00d4aa', situacao:'sit=6',   desc:'Novo pedido gerado no Bling', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}','{{forma_pagamento}}','{{link_pedido}}'] },
  { id:'pagamento_aprovado',  label:'Pagamento Aprovado',    grupo:'Pedidos',       tipo:'bling', icon:CreditCard,  cor:'#4a9fff', situacao:'sit=9',   desc:'PIX ou cartão confirmado', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}'] },
  { id:'pagamento_pendente',  label:'Pagamento Pendente',    grupo:'Pedidos',       tipo:'bling', icon:Clock,       cor:'#f59e0b', situacao:'sit=6',   desc:'Aguardando pagamento', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}','{{link_pedido}}'] },
  { id:'pedido_enviado',      label:'Pedido Enviado',        grupo:'Entrega',       tipo:'bling', icon:Truck,       cor:'#a78bfa', situacao:'sit=27',  desc:'Despachado com rastreio', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{transportadora}}','{{codigo_rastreio}}','{{link_rastreio}}','{{prazo_entrega}}'] },
  { id:'pedido_entregue',     label:'Pedido Entregue',       grupo:'Entrega',       tipo:'bling', icon:Package,     cor:'#22c55e', situacao:'sit=30',  desc:'Entrega confirmada', variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  { id:'nao_entregue',        label:'Não Entregue',          grupo:'Entrega',       tipo:'bling', icon:AlertCircle, cor:'#ef4444', situacao:'sit=33',  desc:'Tentativa falhou', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{codigo_rastreio}}','{{link_rastreio}}'] },
  { id:'em_andamento',        label:'Em Andamento',          grupo:'Faturamento',   tipo:'bling', icon:RefreshCw,   cor:'#8b5cf6', situacao:'sit=15',  desc:'Separação/faturamento iniciou', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}'] },
  { id:'nfe_pendente',        label:'NF-e Pendente',         grupo:'Faturamento',   tipo:'bling', icon:FileText,    cor:'#f59e0b', situacao:'sit=21',  desc:'NF criada, aguardando SEFAZ', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}'] },
  { id:'nfe_emitida',         label:'NF-e Emitida',          grupo:'Faturamento',   tipo:'bling', icon:FileText,    cor:'#06b6d4', situacao:'sit=24',  desc:'DANFE disponível', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{numero_nfe}}','{{link_nfe}}'] },
  { id:'cancelamento',        label:'Pedido Cancelado',      grupo:'Pós-venda',     tipo:'bling', icon:XCircle,     cor:'#6b7280', situacao:'sit=12',  desc:'Pedido cancelado', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}'] },
  { id:'devolucao',           label:'Devolução',             grupo:'Pós-venda',     tipo:'bling', icon:RefreshCw,   cor:'#f87171', situacao:'sit=36',  desc:'Pedido devolvido', variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  // Observações internas
  { id:'em_separacao',        label:'Em Separação',          grupo:'Manual Bling',  tipo:'bling', icon:Layers,      cor:'#8b5cf6', situacao:'#SEPARACAO', desc:'Obs. internas: #SEPARACAO', variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  { id:'produto_embalado',    label:'Produto Embalado',      grupo:'Manual Bling',  tipo:'bling', icon:Package,     cor:'#06b6d4', situacao:'#EMBALADO',  desc:'Obs. internas: #EMBALADO', variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  { id:'saiu_entrega',        label:'Saiu para Entrega',     grupo:'Manual Bling',  tipo:'bling', icon:Truck,       cor:'#f59e0b', situacao:'#SAIU',      desc:'Obs. internas: #SAIU', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{codigo_rastreio}}','{{link_rastreio}}'] },
  { id:'aguardando_retirada', label:'Aguardando Retirada',   grupo:'Manual Bling',  tipo:'bling', icon:Clock,       cor:'#0ea5e9', situacao:'#AGUARDANDO',desc:'Obs. internas: #AGUARDANDO', variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  // Rastreio job
  { id:'lembrete_rastreio',   label:'Rastreio em Movimento', grupo:'Rastreio',      tipo:'bling', icon:Radio,       cor:'#4a9fff', situacao:'auto',    desc:'Atualização detectada pelo job', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{codigo_rastreio}}','{{status_rastreio}}'] },
  // Manual/catálogo
  { id:'catalogo_produto',    label:'Produto do Catálogo',   grupo:'Catálogo',      tipo:'bling', icon:ShoppingBag, cor:'#10b981', situacao:'manual',  desc:'Produto enviado via catálogo', variaveis:['{{nome_produto}}','{{preco_cartao}}','{{preco_pix}}','{{foto_produto}}','{{descricao_produto}}'] },
  { id:'avise_me',            label:'Produto Disponível',    grupo:'Estoque',       tipo:'bling', icon:Bell,        cor:'#fb923c', situacao:'manual',  desc:'Produto voltou ao estoque', variaveis:['{{nome_cliente}}','{{nome_produto}}','{{preco_produto}}','{{link_produto}}'] },
  // Relacionamento
  { id:'boas_vindas',         label:'Boas-vindas',           grupo:'Relacionamento',tipo:'bling', icon:Star,        cor:'#e879f9', situacao:'manual',  desc:'Primeiro contato no WhatsApp', variaveis:['{{nome_cliente}}','{{nome_loja}}'] },
  { id:'avaliar_pedido',      label:'Avaliação Pós-venda',   grupo:'Relacionamento',tipo:'bling', icon:Star,        cor:'#f87171', situacao:'manual',  desc:'Satisfação após entrega', variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  // Inteligência IA — inline (sem aprovação Meta)
  { id:'reengajamento',       label:'Reengajamento',         grupo:'Inteligência',  tipo:'ia',    icon:Brain,       cor:'#7c6af7', situacao:'auto-ia', desc:'Cliente inativo detectado pela Bia', variaveis:['{{nome_cliente}}','{{dias_inativo}}','{{ultimo_produto}}'] },
  { id:'recompra_vip',        label:'Ciclo VIP',             grupo:'Inteligência',  tipo:'ia',    icon:Brain,       cor:'#7c6af7', situacao:'auto-ia', desc:'VIP no ciclo de recompra', variaveis:['{{nome_cliente}}','{{ciclo_dias}}'] },
  { id:'primeira_recompra',   label:'1ª Recompra',           grupo:'Inteligência',  tipo:'ia',    icon:Brain,       cor:'#7c6af7', situacao:'auto-ia', desc:'1ª compra sem retorno', variaveis:['{{nome_cliente}}','{{ultimo_produto}}'] },
  { id:'pos_entrega',         label:'Pós-entrega IA',        grupo:'Inteligência',  tipo:'ia',    icon:Brain,       cor:'#7c6af7', situacao:'auto-ia', desc:'Follow-up automático pós-entrega', variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
]

const GRUPOS_ORDEM = ['Pedidos','Entrega','Faturamento','Pós-venda','Manual Bling','Rastreio','Catálogo','Estoque','Relacionamento','Inteligência']

const TIPOS_BLOCO = [
  { tipo:'cabecalho', label:'Cabeçalho', icon:Hash,          cor:'#00d4aa', desc:'Negrito no topo (apenas texto)' },
  { tipo:'texto',     label:'Texto',     icon:FileText,       cor:'#4a9fff', desc:'Corpo da mensagem — obrigatório' },
  { tipo:'rodape',    label:'Rodapé',    icon:FileText,       cor:'#8696a0', desc:'Texto cinza no final' },
  { tipo:'imagem',    label:'Imagem',    icon:Image,          cor:'#fb923c', desc:'URL de imagem (JPG/PNG)' },
  { tipo:'botao',     label:'Botão',     icon:MousePointer,   cor:'#e879f9', desc:'Botão interativo (máx. 3)' },
]

// Templates padrão por gatilho
const PADROES = {
  pedido_criado:      { cab:'🛒 Pedido Confirmado!', corpo:'Olá *{{nome_cliente}}*!\n\nSeu pedido *#{{numero_pedido}}* foi criado com sucesso.\n\n💳 Total: *{{valor_total}}*\n💰 Pagamento: {{forma_pagamento}}', rod:'Mensagem automática — dúvidas, responda aqui.', bts:[{texto:'Ver pedido',acao:'url',valor:'{{link_pedido}}'}] },
  pagamento_aprovado: { cab:'✅ Pagamento Aprovado!', corpo:'Olá *{{nome_cliente}}*!\n\nO pagamento do pedido *#{{numero_pedido}}* foi confirmado. 🎉\n\nJá estamos preparando com carinho!', rod:'Mensagem automática.', bts:[] },
  pagamento_pendente: { cab:'⏳ Pagamento Pendente', corpo:'Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* aguarda pagamento.\n\nTotal: *{{valor_total}}*', rod:'O link expira em 24 horas.', bts:[{texto:'Pagar agora',acao:'url',valor:'{{link_pedido}}'},{texto:'Preciso de ajuda',acao:'reply',valor:'Ajuda com pagamento'}] },
  pedido_enviado:     { cab:'🚚 Seu pedido foi enviado!', corpo:'Olá *{{nome_cliente}}*! O pedido *#{{numero_pedido}}* saiu para entrega.\n\n📦 Transportadora: {{transportadora}}\n🔍 Rastreio: *{{codigo_rastreio}}*\n📅 Prazo: *{{prazo_entrega}}*', rod:'Continuaremos monitorando!', bts:[{texto:'Rastrear pedido',acao:'url',valor:'{{link_rastreio}}'}] },
  pedido_entregue:    { cab:'📦 Pedido entregue!', corpo:'Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* foi entregue! 😊\n\nEsperamos que você goste muito!', rod:'Qualquer problema estamos aqui.', bts:[{texto:'Avaliar ⭐⭐⭐⭐⭐',acao:'reply',valor:'Quero avaliar'},{texto:'Tive um problema',acao:'reply',valor:'Preciso de ajuda'}] },
  nfe_emitida:        { cab:'📄 Nota Fiscal Emitida', corpo:'Olá *{{nome_cliente}}*!\n\nA nota fiscal do pedido *#{{numero_pedido}}* foi emitida.\n\n📎 NF-e nº {{numero_nfe}}', rod:'Mensagem automática.', bts:[{texto:'Download NF-e',acao:'url',valor:'{{link_nfe}}'}] },
  cancelamento:       { cab:'❌ Pedido Cancelado', corpo:'Olá *{{nome_cliente}}*, o pedido *#{{numero_pedido}}* foi cancelado.\n\nQualquer dúvida estamos aqui!', rod:'Só Strass.', bts:[] },
  reengajamento:      { cab:'', corpo:'Olá *{{nome_cliente}}*! 🥰\n\nSentimos sua falta! Faz {{dias_inativo}} dias desde sua última compra.\n\nTemos novidades que você vai adorar!', rod:'', bts:[] },
  pos_entrega:        { cab:'', corpo:'Olá *{{nome_cliente}}*! Como foi sua experiência com o pedido *#{{numero_pedido}}*?\n\nSua opinião é muito importante para nós! ⭐', rod:'', bts:[] },
}


// ── Variáveis de exemplo para preview ────────────────────────────────────────
const EXEMPLOS = {
  '{{nome_cliente}}':        'Maria Silva',
  '{{numero_pedido}}':       '229461',
  '{{valor_total}}':         'R$ 543,84',
  '{{forma_pagamento}}':     'PIX',
  '{{link_pedido}}':         'https://sostrass.com.br/pedido/229461',
  '{{transportadora}}':      'Correios',
  '{{codigo_rastreio}}':     'BR269810533700S',
  '{{link_rastreio}}':       'https://rastreamento.correios.com.br/?objetos=BR269810533700S',
  '{{prazo_entrega}}':       '25/05/2026',
  '{{numero_nfe}}':          '001234',
  '{{link_nfe}}':            'https://nfe.io/danfe/001234',
  '{{nome_produto}}':        'Strass Base Cônica SS20 Cristal',
  '{{preco_produto}}':       'R$ 89,90',
  '{{preco_cartao}}':        'R$ 89,90',
  '{{preco_pix}}':           'R$ 85,41',
  '{{foto_produto}}':        'https://img.sostrass.com.br/ss20-cristal.jpg',
  '{{descricao_produto}}':   '4.320 pedras de strass cristal SS20',
  '{{link_produto}}':        'https://sostrass.com.br/produto/ss20-cristal',
  '{{nome_loja}}':           'Só Strass',
  '{{dias_inativo}}':        '35',
  '{{ultimo_produto}}':      'Strass SS20 Cristal',
  '{{ciclo_dias}}':          '30',
  '{{status_rastreio}}':     'Objeto saiu para entrega',
  '{{descricao_complementar}}': 'Ideal para decoração e bijuterias',
  '{{codigo_produto}}':      'SS20-CR-4320',
}

function aplicarExemplos(texto) {
  return Object.entries(EXEMPLOS).reduce(
    (t, [k, v]) => t.replaceAll(k, v), texto || ''
  )
}

// ── Preview WhatsApp ──────────────────────────────────────────────────────────
function PreviewWA({ blocos, tipo }) {
  const cab    = blocos.find(b => b.tipo === 'cabecalho')
  const img    = blocos.find(b => b.tipo === 'imagem')
  const textos = blocos.filter(b => b.tipo === 'texto')
  const rod    = blocos.find(b => b.tipo === 'rodape')
  const botoes = blocos.filter(b => b.tipo === 'botao').slice(0, 3)
  const corpo  = textos.map(b => b.conteudo || '').join('\n\n')
  const isIA   = tipo === 'ia'

  const renderTexto = (txt) => {
    if (!txt) return null
    const preview = aplicarExemplos(txt)
    return preview.split('\n').map((line, i) => {
      const formatted = line
        .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
      return <div key={i} dangerouslySetInnerHTML={{__html: formatted || '&nbsp;'}}/>
    })
  }

  return (
    <div style={{fontFamily:'-apple-system,system-ui,sans-serif'}}>
      {/* Bolha da mensagem */}
      <div style={{background:'#fff',borderRadius:'0 12px 12px 12px',boxShadow:'0 1px 3px rgba(0,0,0,.15)',overflow:'hidden',maxWidth:320,margin:'0 auto'}}>

        {/* Imagem */}
        {img?.url && (
          <div style={{background:'#f0f2f5',height:160,display:'flex',alignItems:'center',justifyContent:'center',borderBottom:'1px solid #f0f2f5'}}>
            <img src={aplicarExemplos(img.url)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
          </div>
        )}

        <div style={{padding:'10px 12px'}}>
          {/* Cabeçalho */}
          {cab?.conteudo && (
            <p style={{fontSize:14,fontWeight:700,color:'#111',marginBottom:6,lineHeight:1.3}}>
              {aplicarExemplos(cab.conteudo)}
            </p>
          )}

          {/* Corpo */}
          {corpo && (
            <div style={{fontSize:13.5,color:'#111',lineHeight:1.6,marginBottom:rod?.conteudo?8:4}}>
              {renderTexto(corpo)}
            </div>
          )}

          {/* Rodapé */}
          {rod?.conteudo && (
            <p style={{fontSize:11.5,color:'#8696a0',marginTop:4,lineHeight:1.4,borderTop:'1px solid #f0f2f5',paddingTop:6}}>
              {aplicarExemplos(rod.conteudo)}
            </p>
          )}

          {/* Timestamp */}
          <div style={{textAlign:'right',fontSize:11,color:'#8696a0',marginTop:4}}>
            {new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} ✓✓
          </div>
        </div>

        {/* Botões */}
        {botoes.length > 0 && (
          <div style={{borderTop:'1px solid #f0f2f5'}}>
            {botoes.map((b,i) => (
              <div key={i} style={{
                padding:'11px 12px', textAlign:'center',
                borderBottom: i<botoes.length-1?'1px solid #f0f2f5':'none',
                fontSize:13.5, fontWeight:500,
                color: b.acao==='url'?'#0a7cff':'#0a7cff',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6
              }}>
                {b.acao==='url' && <ExternalLink size={13}/>}
                {b.acao==='tel' && <Phone size={13}/>}
                {b.texto || 'Botão'}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badge de tipo */}
      <div style={{textAlign:'center',marginTop:10}}>
        <span style={{fontSize:10.5,padding:'2px 10px',borderRadius:99,
          background: isIA ? 'rgba(124,106,247,.12)' : 'rgba(37,211,102,.1)',
          color: isIA ? '#7c6af7' : '#22c55e',
          border: `1px solid ${isIA?'rgba(124,106,247,.25)':'rgba(37,211,102,.25)'}`
        }}>
          {isIA ? '✨ Inline — sem aprovação Meta' : '📋 Template HSM — requer aprovação Meta'}
        </span>
      </div>
    </div>
  )
}

// ── Editor de bloco individual ────────────────────────────────────────────────
function BlocoEditor({ bloco, onChange, onRemove, variaveis=[], index, total }) {
  const tipoInfo = TIPOS_BLOCO.find(t => t.tipo === bloco.tipo) || TIPOS_BLOCO[1]
  const Icon = tipoInfo.icon
  const b = { acao:'reply', valor:'', texto:'', conteudo:'', url:'', legenda:'', ...bloco }

  const sty = {
    width:'100%', padding:'7px 10px', borderRadius:8,
    border:'0.5px solid var(--sep)', background:'var(--fill)',
    color:'var(--label)', fontSize:12.5, outline:'none',
    fontFamily:'inherit', resize:'none', lineHeight:1.5,
    boxSizing:'border-box',
  }

  return (
    <div style={{borderRadius:10,border:`0.5px solid ${tipoInfo.cor}25`,background:`${tipoInfo.cor}04`,overflow:'hidden',marginBottom:8}}>
      {/* Header do bloco */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:`${tipoInfo.cor}08`,borderBottom:`0.5px solid ${tipoInfo.cor}20`}}>
        <div style={{width:24,height:24,borderRadius:6,background:`${tipoInfo.cor}20`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Icon size={12} style={{color:tipoInfo.cor}}/>
        </div>
        <span style={{fontSize:11.5,fontWeight:600,color:tipoInfo.cor,flex:1}}>{tipoInfo.label}</span>
        <span style={{fontSize:10.5,color:'var(--label-4)',marginRight:4}}>#{index+1}</span>
        <button onClick={onRemove} style={{display:'flex',alignItems:'center',padding:'2px',borderRadius:4,border:'none',background:'transparent',color:'var(--label-4)',cursor:'pointer'}}>
          <X size={12}/>
        </button>
      </div>

      {/* Campos do bloco */}
      <div style={{padding:'10px 12px'}}>

        {/* Cabeçalho */}
        {b.tipo === 'cabecalho' && (
          <input value={b.conteudo} onChange={e=>onChange({...b,conteudo:e.target.value})}
            placeholder="Texto do cabeçalho (máx. 60 chars)" maxLength={60} style={sty}/>
        )}

        {/* Texto */}
        {b.tipo === 'texto' && (
          <textarea value={b.conteudo} onChange={e=>onChange({...b,conteudo:e.target.value})}
            placeholder="Corpo da mensagem... use *negrito*, _itálico_ e {{variáveis}}" rows={4} style={sty}/>
        )}

        {/* Rodapé */}
        {b.tipo === 'rodape' && (
          <input value={b.conteudo} onChange={e=>onChange({...b,conteudo:e.target.value})}
            placeholder="Texto do rodapé (máx. 60 chars)" maxLength={60} style={sty}/>
        )}

        {/* Imagem */}
        {b.tipo === 'imagem' && (
          <input value={b.url} onChange={e=>onChange({...b,url:e.target.value})}
            placeholder="URL da imagem (https://...jpg)" style={sty}/>
        )}

        {/* Botão */}
        {b.tipo === 'botao' && (
          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            <input value={b.texto} onChange={e=>onChange({...b,texto:e.target.value})}
              placeholder="Texto do botão (máx. 20 chars)" maxLength={20} style={sty}/>
            {/* Tipo de ação */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:5}}>
              {[['reply','💬 Resposta'],['url','🔗 Link URL'],['tel','📞 Ligar']].map(([v,l])=>(
                <button key={v} onClick={()=>onChange({...b,acao:v})} style={{
                  padding:'6px 4px',borderRadius:7,fontSize:11,fontWeight:500,cursor:'pointer',textAlign:'center',
                  background: b.acao===v ? `${tipoInfo.cor}15` : 'var(--fill)',
                  color:       b.acao===v ? tipoInfo.cor : 'var(--label-4)',
                  border:      b.acao===v ? `0.5px solid ${tipoInfo.cor}` : '0.5px solid var(--sep)',
                }}>
                  {l}
                </button>
              ))}
            </div>
            {/* Valor do botão */}
            {(b.acao==='url' || b.acao==='tel') && (
              <input value={b.valor} onChange={e=>onChange({...b,valor:e.target.value})}
                placeholder={b.acao==='url'?'https://... ou {{link_pedido}}':'+55 11 9xxxx-xxxx'}
                style={sty}/>
            )}
            {b.acao==='reply' && (
              <input value={b.valor} onChange={e=>onChange({...b,valor:e.target.value})}
                placeholder="Texto que será enviado ao clicar (ex: Quero avaliar)"
                style={sty}/>
            )}
          </div>
        )}

        {/* Variáveis disponíveis */}
        {variaveis.length > 0 && ['texto','cabecalho'].includes(b.tipo) && (
          <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:7}}>
            {variaveis.map(v => (
              <button key={v} onClick={()=>{
                const campo = b.tipo==='texto'?'conteudo':'conteudo'
                onChange({...b,[campo]:(b[campo]||'')+v})
              }} style={{fontSize:10,padding:'2px 7px',borderRadius:99,border:'0.5px solid var(--sep)',background:'var(--fill)',color:'var(--label-4)',cursor:'pointer',fontFamily:'monospace'}}>
                {v}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function PageGatilhos({ api }) {

  // ── Estado ─────────────────────────────────────────────────────────────────
  const [selId,       setSelId]     = useState(null)
  const [configs,     setConfigs]   = useState({})
  const [blocos,      setBlocos]    = useState([])
  const [dirty,       setDirty]     = useState(false)
  const [salvando,    setSalvando]  = useState(false)
  const [salvoOk,     setSalvoOk]   = useState(false)
  const [gerando,     setGerando]   = useState(false)
  const [erroIA,      setErroIA]    = useState('')
  const [delays,      setDelays]    = useState({})
  const [telTeste,    setTelTeste]  = useState('')
  const [enviandoT,   setEnviandoT] = useState(false)
  const [resTeste,    setResTeste]  = useState(null)
  const [submetendo,  setSubmet]    = useState(false)
  const [metaStatus,  setMetaSt]    = useState('')
  const [metaErro,    setMetaErro]  = useState('')
  const [aba,         setAba]       = useState('editor')  // editor | preview | config | meta
  const [grupoAberto, setGrupoAb]   = useState({})
  const [busca,       setBusca]     = useState('')
  const [loading,     setLoading]   = useState(true)

  const gatilho = GATILHOS.find(g => g.id === selId)
  const config  = configs[selId]
  const isIA    = gatilho?.tipo === 'ia'

  // ── Carrega templates do banco ─────────────────────────────────────────────
  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/templates`)
      if (r.ok) {
        const d = await r.json()
        const map = {}
        for (const t of (d.templates || d)) {
          // Fix: garante que blocos de botão sempre têm 'acao' definido
          const bls = (t.blocos || []).map(b => ({
            acao:'reply', valor:'', texto:'', conteudo:'', url:'', ...b,
            id: b.id || Date.now() + Math.random()
          }))
          map[t.gatilho] = { ...t, blocos: bls }
        }
        setConfigs(map)
      }
    } catch {}
    setLoading(false)
  }, [api])

  const carregarDelays = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/ia/config`)
      if (r.ok) {
        const d = await r.json()
        const dl = {}
        for (const g of GATILHOS) {
          const chave = `delay_${g.id}`
          if (d[chave] !== undefined) dl[g.id] = Number(d[chave])
        }
        setDelays(dl)
      }
    } catch {}
  }, [api])

  useEffect(() => { carregar(); carregarDelays() }, [carregar, carregarDelays])

  // Carrega blocos quando seleciona gatilho
  useEffect(() => {
    if (!selId) return
    const cfg = configs[selId]
    if (cfg?.blocos?.length) {
      setBlocos(cfg.blocos)
    } else {
      // Aplica padrão se não tiver salvo
      const pad = PADROES[selId]
      if (pad) {
        const bls = []
        let id = 1
        if (pad.cab) bls.push({ tipo:'cabecalho', conteudo:pad.cab, id:id++ })
        if (pad.corpo) bls.push({ tipo:'texto', conteudo:pad.corpo, id:id++ })
        if (pad.rod) bls.push({ tipo:'rodape', conteudo:pad.rod, id:id++ })
        if (pad.bts) for (const bt of pad.bts) bls.push({ tipo:'botao', acao:bt.acao||'reply', texto:bt.texto||'', valor:bt.valor||'', id:id++ })
        setBlocos(bls)
      } else {
        setBlocos([{ tipo:'texto', conteudo:'', id:1 }])
      }
    }
    setDirty(false)
    setErroIA('')
    setResTeste(null)
    setMetaSt(cfg?.meta_template_status || '')
    setMetaErro('')
    setAba('editor')
  }, [selId, configs])

  // Status Meta ao selecionar
  useEffect(() => {
    const cfg = configs[selId]
    if (cfg?.id) {
      fetch(`${api}/api/meta-templates/status/${cfg.id}`)
        .then(r => r.json())
        .then(d => { if(d.status) setMetaSt(d.status) })
        .catch(() => {})
    }
  }, [selId, configs, api])

  // ── Ações ──────────────────────────────────────────────────────────────────
  const addBloco = (tipo) => {
    setBlocos(p => [...p, { tipo, conteudo:'', url:'', texto:'', acao:'reply', valor:'', legenda:'', id:Date.now()+Math.random() }])
    setDirty(true)
  }

  const updateBloco = (id, dados) => {
    setBlocos(p => p.map(b => b.id === id ? {...b,...dados} : b))
    setDirty(true)
  }

  const removeBloco = (id) => {
    setBlocos(p => p.filter(b => b.id !== id))
    setDirty(true)
  }

  const salvar = async () => {
    if (!selId || !dirty) return
    setSalvando(true)
    try {
      const c = configs[selId]
      const g = GATILHOS.find(x => x.id === selId)
      const body = { gatilho:selId, nome:g?.label||selId, blocos, ativo: c?.ativo ?? true }
      const r = await fetch(
        c ? `${api}/api/templates/${c.id}` : `${api}/api/templates`,
        { method: c?'PATCH':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }
      )
      if (r.ok) {
        setSalvoOk(true); setDirty(false)
        setTimeout(() => setSalvoOk(false), 2500)
        await carregar()
      }
    } catch {}
    setSalvando(false)
  }

  const toggleAtivo = async (id) => {
    const c = configs[id]
    if (!c) return
    await fetch(`${api}/api/templates/${c.id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ativo: !c.ativo })
    })
    await carregar()
  }

  const salvarDelay = async (gId, min) => {
    setDelays(p => ({...p,[gId]:min}))
    await fetch(`${api}/api/ia/config`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ chave:`delay_${gId}`, valor:String(min) })
    }).catch(() => {})
  }

  const gerarIA = async () => {
    const g = GATILHOS.find(x => x.id === selId)
    if (!g) return
    setGerando(true); setErroIA('')
    try {
      const r = await fetch(`${api}/api/templates/gerar`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ nome:g.label, gatilho:g.id, descricao:g.desc })
      })
      const d = await r.json()
      if (d.blocos) { setBlocos(d.blocos.map(b=>({...b,id:Date.now()+Math.random()}))); setDirty(true) }
      else if (d.erro) setErroIA(d.erro)
    } catch(e) { setErroIA(e.message) }
    setGerando(false)
  }

  const enviarTeste = async () => {
    if (!telTeste || !selId) return
    setEnviandoT(true); setResTeste(null)
    try {
      const r = await fetch(`${api}/api/dashboard/mensagem`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ telefone:telTeste.replace(/\D/g,''), gatilho:selId, variaveis:EXEMPLOS })
      })
      const d = await r.json()
      setResTeste(d.ok ? 'ok' : d.erro || 'erro')
    } catch { setResTeste('erro') }
    setEnviandoT(false)
  }

  const submeterMeta = async () => {
    const c = configs[selId]
    if (!c?.id) { alert('Salve o template primeiro'); return }
    setSubmet(true); setMetaErro('')
    try {
      const r = await fetch(`${api}/api/meta-templates/submeter/${c.id}`, { method:'POST' })
      const d = await r.json()
      if (d.ok) {
        setMetaSt(d.status || 'PENDING')
      } else {
        setMetaErro(d.erro || 'Erro desconhecido')
      }
    } catch { setMetaErro('Erro de conexão') }
    setSubmet(false)
  }

  // ── Grupos filtrados ───────────────────────────────────────────────────────
  const gruposFiltrados = GRUPOS_ORDEM.map(grupo => ({
    nome: grupo,
    itens: GATILHOS.filter(g =>
      g.grupo === grupo &&
      (!busca || g.label.toLowerCase().includes(busca.toLowerCase()))
    )
  })).filter(g => g.itens.length > 0)

  // Abre o grupo do selecionado automaticamente
  useEffect(() => {
    if (selId) {
      const g = GATILHOS.find(x => x.id === selId)
      if (g) setGrupoAb(p => ({...p, [g.grupo]: true}))
    }
  }, [selId])

  const totalAtivos = Object.values(configs).filter(c => c.ativo).length

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'var(--bg)',color:'var(--label)',overflow:'hidden'}}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .gat-item:hover { background: var(--fill) !important; }
        .gat-item { transition: background .1s; }
        .blk-add:hover { border-color: var(--accent) !important; color: var(--accent) !important; }
        .blk-add { transition: all .12s; }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{flexShrink:0,background:'var(--bg-2)',borderBottom:'0.5px solid var(--sep)',padding:'14px 20px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,rgba(37,211,102,.2),rgba(0,212,170,.15))',display:'flex',alignItems:'center',justifyContent:'center',border:'0.5px solid rgba(37,211,102,.3)',flexShrink:0}}>
              <Zap size={18} style={{color:'#25D366'}}/>
            </div>
            <div>
              <h1 style={{fontSize:16,fontWeight:600,color:'var(--label)',margin:0,letterSpacing:'-.3px',display:'flex',alignItems:'center',gap:8}}>
                Central de Automações
                <span style={{fontSize:11,padding:'1px 8px',borderRadius:99,background:'rgba(37,211,102,.1)',color:'#22c55e',border:'0.5px solid rgba(37,211,102,.25)',fontWeight:500}}>
                  {totalAtivos} ativo{totalAtivos!==1?'s':''}
                </span>
              </h1>
              <p style={{fontSize:11.5,color:'var(--label-4)',margin:0}}>Templates de mensagem — Bling HSM + Inteligência IA</p>
            </div>
          </div>
          {/* Ações header */}
          {selId && dirty && (
            <button onClick={salvar} disabled={salvando} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:9,border:'0.5px solid rgba(37,211,102,.3)',background:'rgba(37,211,102,.08)',color:'#22c55e',cursor:'pointer',fontSize:13,fontWeight:600,flexShrink:0}}>
              {salvando ? <><RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Salvando...</> : salvoOk ? <><Check size={13}/> Salvo!</> : <><Save size={13}/> Salvar</>}
            </button>
          )}
        </div>
      </div>

      {/* ── LAYOUT 3 COLUNAS ───────────────────────────────────────────────── */}
      <div style={{flex:1,display:'grid',gridTemplateColumns:'240px 1fr 360px',overflow:'hidden'}}>

        {/* ── COLUNA 1: Lista de gatilhos ─────────────────────────────────── */}
        <div style={{borderRight:'0.5px solid var(--sep)',display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg-2)'}}>

          {/* Busca */}
          <div style={{padding:'10px 12px',borderBottom:'0.5px solid var(--sep)',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:7,padding:'7px 10px',borderRadius:8,border:'0.5px solid var(--sep)',background:'var(--fill)'}}>
              <Activity size={12} style={{color:'var(--label-4)',flexShrink:0}}/>
              <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar gatilho..."
                style={{flex:1,border:'none',background:'transparent',color:'var(--label)',fontSize:12,outline:'none'}}/>
            </div>
          </div>

          {/* Lista agrupada */}
          <div style={{flex:1,overflowY:'auto',padding:'6px 8px'}}>
            {gruposFiltrados.map(grupo => (
              <div key={grupo.nome} style={{marginBottom:3}}>
                {/* Header do grupo */}
                <button onClick={()=>setGrupoAb(p=>({...p,[grupo.nome]:!p[grupo.nome]}))}
                  style={{width:'100%',display:'flex',alignItems:'center',gap:6,padding:'6px 8px',borderRadius:7,border:'none',background:'transparent',cursor:'pointer',textAlign:'left'}}>
                  <span style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',flex:1}}>{grupo.nome}</span>
                  <span style={{fontSize:10,color:'var(--label-4)',background:'var(--fill)',padding:'0 5px',borderRadius:99,border:'0.5px solid var(--sep)'}}>{grupo.itens.length}</span>
                  {grupoAberto[grupo.nome] ? <ChevronUp size={10} style={{color:'var(--label-4)'}}/> : <ChevronDown size={10} style={{color:'var(--label-4)'}}/>}
                </button>

                {/* Itens do grupo */}
                {grupoAberto[grupo.nome] && grupo.itens.map(g => {
                  const cfg = configs[g.id]
                  const ativo = cfg?.ativo
                  const temTemplate = !!cfg
                  const Icon = g.icon
                  const isSelected = selId === g.id
                  return (
                    <button key={g.id} onClick={()=>setSelId(g.id)} className="gat-item"
                      style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'7px 8px',borderRadius:8,border:`0.5px solid ${isSelected?g.cor+'40':'transparent'}`,background:isSelected?`${g.cor}08`:'transparent',cursor:'pointer',textAlign:'left',marginBottom:2}}>
                      {/* Ícone */}
                      <div style={{width:28,height:28,borderRadius:7,background:`${g.cor}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <Icon size={13} style={{color:g.cor}}/>
                      </div>
                      {/* Info */}
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:12,fontWeight:isSelected?600:400,color:isSelected?'var(--label)':'var(--label-2)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.label}</p>
                      </div>
                      {/* Status */}
                      <div style={{flexShrink:0,display:'flex',alignItems:'center',gap:3}}>
                        {g.tipo==='ia' && <span style={{fontSize:9,padding:'1px 5px',borderRadius:99,background:'rgba(124,106,247,.12)',color:'#7c6af7',border:'0.5px solid rgba(124,106,247,.2)'}}>IA</span>}
                        {temTemplate && (
                          <div style={{width:6,height:6,borderRadius:'50%',background:ativo?'#22c55e':'var(--sep)'}}/>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ── COLUNA 2: Editor ────────────────────────────────────────────── */}
        <div style={{display:'flex',flexDirection:'column',overflow:'hidden',borderRight:'0.5px solid var(--sep)'}}>
          {!selId ? (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,color:'var(--label-4)',padding:32}}>
              <div style={{width:56,height:56,borderRadius:16,background:'var(--fill)',border:'0.5px solid var(--sep)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Zap size={24} style={{opacity:.3}}/>
              </div>
              <p style={{fontSize:14,margin:0,color:'var(--label-3)'}}>Selecione um gatilho para editar</p>
              <p style={{fontSize:12,margin:0,opacity:.6,textAlign:'center'}}>Escolha na lista à esquerda</p>
            </div>
          ) : (
            <>
              {/* Header do editor */}
              <div style={{flexShrink:0,padding:'12px 16px',borderBottom:'0.5px solid var(--sep)',background:'var(--bg-2)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <div style={{width:32,height:32,borderRadius:9,background:`${gatilho.cor}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {gatilho.icon && <gatilho.icon size={15} style={{color:gatilho.cor}}/>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:14,fontWeight:600,color:'var(--label)',margin:0}}>{gatilho.label}</p>
                    <p style={{fontSize:11,color:'var(--label-4)',margin:0}}>{gatilho.desc}</p>
                  </div>
                  {/* Badge tipo */}
                  <span style={{fontSize:10.5,padding:'2px 8px',borderRadius:99,background:isIA?'rgba(124,106,247,.1)':'rgba(37,211,102,.08)',color:isIA?'#7c6af7':'#22c55e',border:`0.5px solid ${isIA?'rgba(124,106,247,.25)':'rgba(37,211,102,.2)'}`,flexShrink:0}}>
                    {isIA ? '✨ Inline IA' : '📋 HSM Meta'}
                  </span>
                </div>

                {/* Tabs do editor */}
                <div style={{display:'flex',gap:0}}>
                  {[
                    {id:'editor', label:'Editor'},
                    {id:'config', label:'Configuração'},
                    ...(!isIA ? [{id:'meta', label:'Aprovação Meta'}] : []),
                  ].map(t => (
                    <button key={t.id} onClick={()=>setAba(t.id)} style={{
                      padding:'6px 14px',fontSize:12,border:'none',background:'transparent',cursor:'pointer',
                      color: aba===t.id ? 'var(--accent)' : 'var(--label-4)',
                      borderBottom: `2px solid ${aba===t.id?'var(--accent)':'transparent'}`,
                      fontWeight: aba===t.id ? 600 : 400, transition:'color .1s',
                    }}>
                      {t.label}
                      {t.id==='meta' && metaStatus && (
                        <span style={{marginLeft:5,fontSize:9,padding:'1px 5px',borderRadius:99,
                          background: metaStatus==='APPROVED'?'rgba(34,197,94,.12)':metaStatus==='REJECTED'?'rgba(239,68,68,.12)':'rgba(245,158,11,.12)',
                          color:      metaStatus==='APPROVED'?'#22c55e':metaStatus==='REJECTED'?'#ef4444':'#f59e0b',
                        }}>
                          {metaStatus==='APPROVED'?'✓':metaStatus==='REJECTED'?'✗':'⏳'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conteúdo das abas */}
              <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>

                {/* ── ABA EDITOR ─────────────────────────────────────────── */}
                {aba === 'editor' && (
                  <div>
                    {/* Gerar com IA */}
                    <div style={{display:'flex',gap:7,marginBottom:14,padding:'10px 12px',borderRadius:9,background:'rgba(124,106,247,.05)',border:'0.5px solid rgba(124,106,247,.2)'}}>
                      <div style={{flex:1}}>
                        <p style={{fontSize:12,fontWeight:600,color:'#7c6af7',margin:'0 0 2px',display:'flex',alignItems:'center',gap:5}}>
                          <Sparkles size={12}/> Gerar com IA
                        </p>
                        <p style={{fontSize:11.5,color:'var(--label-4)',margin:0}}>A Bia cria o texto ideal para este gatilho automaticamente</p>
                      </div>
                      <button onClick={gerarIA} disabled={gerando} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:8,border:'0.5px solid rgba(124,106,247,.3)',background:'rgba(124,106,247,.1)',color:'#7c6af7',cursor:'pointer',fontSize:12,fontWeight:600,flexShrink:0,alignSelf:'center'}}>
                        {gerando ? <><RefreshCw size={12} style={{animation:'spin 1s linear infinite'}}/> Gerando...</> : <><Sparkles size={12}/> Gerar</>}
                      </button>
                    </div>
                    {erroIA && <p style={{fontSize:12,color:'#ef4444',marginBottom:10}}>{erroIA}</p>}

                    {/* Blocos */}
                    <div>
                      {blocos.map((b, i) => (
                        <div key={b.id} style={{animation:'fadeIn .2s ease both'}}>
                          <BlocoEditor
                            bloco={b}
                            index={i}
                            total={blocos.length}
                            onChange={dados => updateBloco(b.id, dados)}
                            onRemove={() => removeBloco(b.id)}
                            variaveis={gatilho.variaveis || []}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Adicionar blocos */}
                    <div style={{marginTop:10}}>
                      <p style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--label-4)',marginBottom:8}}>Adicionar bloco</p>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {TIPOS_BLOCO.filter(t => {
                          // Limita: máx 1 cab/rod/img, máx 3 botões
                          if (t.tipo==='cabecalho' && blocos.find(b=>b.tipo==='cabecalho')) return false
                          if (t.tipo==='rodape'    && blocos.find(b=>b.tipo==='rodape'))    return false
                          if (t.tipo==='imagem'    && blocos.find(b=>b.tipo==='imagem'))    return false
                          if (t.tipo==='botao'     && blocos.filter(b=>b.tipo==='botao').length >= 3) return false
                          if (isIA && ['imagem','botao','link','ligar'].includes(t.tipo)) return false
                          return true
                        }).map(t => {
                          const Icon = t.icon
                          return (
                            <button key={t.tipo} onClick={()=>addBloco(t.tipo)} className="blk-add"
                              style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:7,border:'0.5px solid var(--sep)',background:'var(--fill)',color:'var(--label-4)',cursor:'pointer',fontSize:11.5}}>
                              <Icon size={11} style={{color:t.cor}}/>{t.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Variáveis disponíveis */}
                    {gatilho.variaveis?.length > 0 && (
                      <div style={{marginTop:16,padding:'10px 12px',borderRadius:9,background:'var(--fill)',border:'0.5px solid var(--sep)'}}>
                        <p style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--label-4)',marginBottom:7}}>Variáveis disponíveis</p>
                        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                          {gatilho.variaveis.map(v => (
                            <code key={v} style={{fontSize:10.5,padding:'2px 7px',borderRadius:5,background:'var(--bg)',border:'0.5px solid var(--sep)',color:'var(--label-3)',fontFamily:'monospace'}}>{v}</code>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── ABA CONFIGURAÇÃO ───────────────────────────────────── */}
                {aba === 'config' && (
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>

                    {/* Toggle ativo */}
                    <div style={{padding:'12px 14px',borderRadius:10,border:'0.5px solid var(--sep)',background:'var(--bg-2)'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                        <div>
                          <p style={{fontSize:13,fontWeight:600,color:'var(--label)',margin:'0 0 2px'}}>Status do gatilho</p>
                          <p style={{fontSize:11.5,color:'var(--label-4)',margin:0}}>Ativa ou desativa o envio automático</p>
                        </div>
                        <button onClick={()=>config&&toggleAtivo(selId)} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,cursor:config?'pointer':'not-allowed',fontSize:12,fontWeight:600,
                          background:config?.ativo?'rgba(34,197,94,.1)':'var(--fill)',
                          color:config?.ativo?'#22c55e':'var(--label-4)',
                          border:config?.ativo?'0.5px solid rgba(34,197,94,.3)':'0.5px solid var(--sep)',
                          opacity:config?1:.5}}>
                          {config?.ativo?<ToggleRight size={14}/>:<ToggleLeft size={14}/>}
                          {config?.ativo?'Ativo':'Inativo'}
                        </button>
                      </div>
                      <p style={{fontSize:11.5,color:'var(--label-4)',margin:0,padding:'8px 10px',borderRadius:7,background:'var(--fill)'}}>
                        {config?.ativo ? '🟢 Enviando automaticamente quando o evento ocorre'
                          : config ? '⚪ Salvo mas não ativo'
                          : '⚫ Template ainda não salvo'}
                      </p>
                    </div>

                    {/* Delay */}
                    <div style={{padding:'12px 14px',borderRadius:10,border:'0.5px solid var(--sep)',background:'var(--bg-2)'}}>
                      <p style={{fontSize:13,fontWeight:600,color:'var(--label)',margin:'0 0 4px'}}>Delay de envio</p>
                      <p style={{fontSize:11.5,color:'var(--label-4)',margin:'0 0 10px'}}>Esperar X minutos após o evento antes de enviar</p>
                      <div style={{display:'flex',gap:5}}>
                        {[0,5,10,15,30,60].map(min => (
                          <button key={min} onClick={()=>salvarDelay(selId,min)} style={{flex:1,padding:'6px 4px',borderRadius:7,border:`0.5px solid ${delays[selId]===min||(!delays[selId]&&min===0)?gatilho.cor+'60':'var(--sep)'}`,background:delays[selId]===min||(!delays[selId]&&min===0)?`${gatilho.cor}12`:'transparent',color:delays[selId]===min||(!delays[selId]&&min===0)?gatilho.cor:'var(--label-4)',cursor:'pointer',fontSize:11.5,fontWeight:delays[selId]===min||(!delays[selId]&&min===0)?700:400}}>
                            {min===0?'Imediato':`${min}min`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Situação Bling */}
                    {gatilho.situacao && (
                      <div style={{padding:'12px 14px',borderRadius:10,border:'0.5px solid var(--sep)',background:'var(--bg-2)'}}>
                        <p style={{fontSize:13,fontWeight:600,color:'var(--label)',margin:'0 0 4px'}}>Gatilho automático</p>
                        <p style={{fontSize:11.5,color:'var(--label-4)',margin:0}}>
                          {gatilho.situacao.startsWith('#')
                            ? `Disparado quando as observações internas contêm: ${gatilho.situacao}`
                            : gatilho.situacao === 'manual'
                            ? 'Disparo manual — acionado pela equipe'
                            : gatilho.situacao === 'auto-ia'
                            ? 'Disparo automático pela Inteligência da Bia'
                            : `Situação Bling: ${gatilho.situacao}`
                          }
                        </p>
                      </div>
                    )}

                    {/* Teste */}
                    <div style={{padding:'12px 14px',borderRadius:10,border:'0.5px solid var(--sep)',background:'var(--bg-2)'}}>
                      <p style={{fontSize:13,fontWeight:600,color:'var(--label)',margin:'0 0 4px'}}>Enviar teste</p>
                      <p style={{fontSize:11.5,color:'var(--label-4)',margin:'0 0 8px'}}>Receba um preview real com dados de exemplo</p>
                      <div style={{display:'flex',gap:7}}>
                        <input value={telTeste} onChange={e=>setTelTeste(e.target.value)}
                          placeholder="55119..." style={{flex:1,padding:'7px 10px',borderRadius:8,border:'0.5px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:12.5,outline:'none',fontFamily:'monospace'}}/>
                        <button onClick={enviarTeste} disabled={enviandoT||!telTeste} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 13px',borderRadius:8,border:'0.5px solid rgba(37,211,102,.3)',background:'rgba(37,211,102,.07)',color:'#25D366',cursor:'pointer',fontSize:12,fontWeight:600,opacity:!telTeste?.5:1}}>
                          {enviandoT?<RefreshCw size={12} style={{animation:'spin 1s linear infinite'}}/>:<Send size={12}/>}
                          {enviandoT?'Enviando...':'Testar'}
                        </button>
                      </div>
                      {resTeste && (
                        <p style={{fontSize:12,marginTop:7,color:resTeste==='ok'?'#22c55e':'#ef4444'}}>
                          {resTeste==='ok' ? '✅ Enviado com sucesso!' : `❌ Erro: ${resTeste}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── ABA META (apenas HSM) ──────────────────────────────── */}
                {aba === 'meta' && !isIA && (
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>

                    {/* Status atual */}
                    <div style={{padding:'12px 14px',borderRadius:10,border:`0.5px solid ${metaStatus==='APPROVED'?'rgba(34,197,94,.3)':metaStatus==='REJECTED'?'rgba(239,68,68,.3)':'var(--sep)'}`,background:metaStatus==='APPROVED'?'rgba(34,197,94,.05)':metaStatus==='REJECTED'?'rgba(239,68,68,.05)':'var(--bg-2)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:metaStatus==='APPROVED'?'#22c55e':metaStatus==='REJECTED'?'#ef4444':metaStatus==='PENDING'?'#f59e0b':'var(--sep)'}}/>
                        <span style={{fontSize:13,fontWeight:600,color:'var(--label)'}}>
                          {metaStatus==='APPROVED'?'Aprovado pela Meta'
                            :metaStatus==='REJECTED'?'Rejeitado — precisa revisar'
                            :metaStatus==='PENDING'?'Em análise (até 24h)'
                            :'Não submetido'}
                        </span>
                      </div>
                      <p style={{fontSize:11.5,color:'var(--label-4)',margin:0}}>
                        {metaStatus==='APPROVED'
                          ? 'Este template pode ser enviado para qualquer número, mesmo fora da janela de 24h.'
                          :metaStatus==='REJECTED'
                          ? 'A Meta rejeitou o template. Revise o conteúdo, evite promoções agressivas e resubmeta.'
                          :metaStatus==='PENDING'
                          ? 'Template em análise. A Meta costuma aprovar em menos de 24h.'
                          : 'Submeta para a Meta aprovar antes de usar como disparo automático.'}
                      </p>
                    </div>

                    {/* Erro de submissão */}
                    {metaErro && (
                      <div style={{padding:'10px 12px',borderRadius:9,border:'0.5px solid rgba(239,68,68,.3)',background:'rgba(239,68,68,.05)'}}>
                        <p style={{fontSize:12,color:'#ef4444',margin:'0 0 4px',fontWeight:600}}>Erro na submissão</p>
                        <p style={{fontSize:11.5,color:'var(--label-3)',margin:0}}>{metaErro}</p>
                        {metaErro.includes('WABA') && (
                          <p style={{fontSize:11.5,color:'#f59e0b',margin:'6px 0 0',padding:'6px 8px',borderRadius:6,background:'rgba(245,158,11,.08)',border:'0.5px solid rgba(245,158,11,.25)'}}>
                            💡 Configure WHATSAPP_WABA_ID nas variáveis de ambiente do Railway (diferente do Phone ID)
                          </p>
                        )}
                      </div>
                    )}

                    {/* Botão submeter */}
                    <button onClick={submeterMeta} disabled={submetendo||!config}
                      style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'11px',borderRadius:10,border:'0.5px solid rgba(74,159,255,.3)',background:'rgba(74,159,255,.08)',color:'#4a9fff',cursor:config?'pointer':'not-allowed',fontSize:13,fontWeight:600,opacity:!config?.5:1}}>
                      {submetendo?<><RefreshCw size={14} style={{animation:'spin 1s linear infinite'}}/> Submetendo...</>:<><ExternalLink size={14}/> {metaStatus?'Resubmeter para Meta':'Submeter para aprovação Meta'}</>}
                    </button>
                    {!config && <p style={{fontSize:11.5,color:'var(--label-4)',textAlign:'center',margin:0}}>Salve o template primeiro</p>}

                    {/* Info sobre HSM */}
                    <div style={{padding:'10px 12px',borderRadius:9,background:'var(--fill)',border:'0.5px solid var(--sep)'}}>
                      <p style={{fontSize:11,color:'var(--label-4)',margin:0,lineHeight:1.6}}>
                        <strong style={{color:'var(--label-3)'}}>O que é um template HSM?</strong><br/>
                        Templates aprovados pela Meta permitem iniciar conversas com clientes mesmo sem janela aberta (fora das 24h). Necessário para todos os disparos automáticos do Bling.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </>
          )}
        </div>

        {/* ── COLUNA 3: Preview ────────────────────────────────────────────── */}
        <div style={{display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--fill)'}}>
          {!selId ? (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--label-4)'}}>
              <p style={{fontSize:12}}>Preview aparece aqui</p>
            </div>
          ) : (
            <>
              {/* Header preview */}
              <div style={{flexShrink:0,padding:'10px 14px',borderBottom:'0.5px solid var(--sep)',background:'var(--bg-2)',display:'flex',alignItems:'center',gap:8}}>
                <Eye size={13} style={{color:'var(--label-4)'}}/>
                <span style={{fontSize:12,fontWeight:500,color:'var(--label-3)'}}>Preview WhatsApp</span>
                <span style={{fontSize:10.5,color:'var(--label-4)',marginLeft:'auto'}}>com dados de exemplo</span>
              </div>

              {/* Preview */}
              <div style={{flex:1,overflowY:'auto',padding:'20px 16px',background:'#e5ddd5'}}>
                <div style={{backgroundImage:'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'200\' height=\'200\' fill=\'%23e5ddd5\'/%3E%3C/svg%3E")'}}>
                  <PreviewWA blocos={blocos} tipo={gatilho?.tipo}/>
                </div>
              </div>

              {/* Barra de salvar */}
              {dirty && (
                <div style={{flexShrink:0,padding:'10px 14px',borderTop:'0.5px solid var(--sep)',background:'var(--bg-2)',display:'flex',gap:7}}>
                  <button onClick={salvar} disabled={salvando} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'9px',borderRadius:9,border:'0.5px solid rgba(37,211,102,.3)',background:'rgba(37,211,102,.08)',color:'#22c55e',cursor:'pointer',fontSize:12.5,fontWeight:700}}>
                    {salvando?<><RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Salvando...</>:salvoOk?<><Check size={13}/> Salvo!</>:<><Save size={13}/> Salvar alterações</>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}
