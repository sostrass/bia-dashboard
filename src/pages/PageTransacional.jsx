import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Zap, Save, Send, RefreshCw, X, Sparkles, ToggleLeft, ToggleRight,
  CheckCircle, Plus, Image, FileText, MousePointer, Link as LinkIcon,
  ShoppingBag, CreditCard, Truck, Bell, Star, Package, Clock,
  MessageSquare, AlertCircle, GripVertical, ChevronDown, ChevronUp,
  Mic, Video, Phone, Copy, Hash, Trash2, HelpCircle, Timer, Tag, XCircle
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const GATILHOS = [
  { id:'pedido_criado',      label:'Pedido Criado',        grupo:'Pedidos',       icon:ShoppingBag, cor:'#00d4aa', corBg:'rgba(0,212,170,0.1)',  desc:'Novo pedido gerado no Bling',             variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}','{{forma_pagamento}}','{{link_pedido}}'] },
  { id:'pagamento_aprovado', label:'Pagamento Aprovado',   grupo:'Pedidos',       icon:CreditCard,  cor:'#4a9fff', corBg:'rgba(74,159,255,0.1)', desc:'PIX ou cartão confirmado',                variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}'] },
  { id:'pagamento_pendente', label:'Pagamento Pendente',   grupo:'Pedidos',       icon:Clock,       cor:'#f59e0b', corBg:'rgba(245,158,11,0.1)', desc:'Pedido aguardando pagamento',             variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}','{{link_pedido}}'] },
  { id:'pedido_enviado',     label:'Pedido Enviado',       grupo:'Entrega',       icon:Truck,       cor:'#a78bfa', corBg:'rgba(167,139,250,0.1)',desc:'Pedido despachado com rastreio',          variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{transportadora}}','{{codigo_rastreio}}','{{link_rastreio}}','{{prazo_entrega}}'] },
  { id:'pedido_entregue',    label:'Pedido Entregue',      grupo:'Entrega',       icon:Package,     cor:'#22c55e', corBg:'rgba(34,197,94,0.1)',  desc:'Entrega confirmada',                      variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  { id:'avise_me',           label:'Produto Disponível',   grupo:'Estoque',       icon:Bell,        cor:'#fb923c', corBg:'rgba(251,146,60,0.1)', desc:'Produto voltou ao estoque',               variaveis:['{{nome_cliente}}','{{nome_produto}}','{{preco_produto}}','{{preco_pix}}','{{link_produto}}','{{foto_produto}}'] },
  { id:'boas_vindas',        label:'Boas-vindas',          grupo:'Relacionamento',icon:Star,        cor:'#e879f9', corBg:'rgba(232,121,249,0.1)',desc:'Primeiro contato do cliente',             variaveis:['{{nome_cliente}}','{{nome_loja}}'] },
  { id:'avaliar_pedido',     label:'Avaliação Pós-venda',  grupo:'Relacionamento',icon:Star,        cor:'#f87171', corBg:'rgba(248,113,113,0.1)',desc:'Pesquisa de satisfação',                  variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  { id:'em_separacao',       label:'Em Separação',         grupo:'Personalizado', icon:Timer,       cor:'#8b5cf6', corBg:'rgba(139,92,246,0.1)', desc:'String #SEPARACAO nas obs. internas do Bling', variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  { id:'produto_embalado',   label:'Produto Embalado',     grupo:'Personalizado', icon:Package,     cor:'#06b6d4', corBg:'rgba(6,182,212,0.1)',  desc:'String #EMBALADO nas obs. internas do Bling',  variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  { id:'saiu_entrega',       label:'Saiu para Entrega',    grupo:'Personalizado', icon:Truck,       cor:'#f59e0b', corBg:'rgba(245,158,11,0.1)', desc:'String #SAIU nas obs. internas do Bling',      variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{transportadora}}','{{codigo_rastreio}}','{{link_rastreio}}'] },
  // ── Faturamento ────────────────────────────────────────────────────────────
  { id:'em_andamento',       label:'Em Andamento',          grupo:'Faturamento',   icon:RefreshCw,   cor:'#8b5cf6', corBg:'rgba(139,92,246,0.1)', desc:'Expedição iniciou separação/faturamento (situacao.id=15)', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}'] },
  { id:'nfe_pendente',       label:'NF-e Pendente',         grupo:'Faturamento',   icon:FileText,    cor:'#f59e0b', corBg:'rgba(245,158,11,0.1)', desc:'NF-e criada aguardando autorização (situacao.id=21)',      variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}'] },
  // ── Fiscais ────────────────────────────────────────────────────────────────
  { id:'nfe_emitida',        label:'NF-e Emitida',          grupo:'Fiscal',        icon:FileText,    cor:'#06b6d4', corBg:'rgba(6,182,212,0.1)',  desc:'Nota fiscal autorizada — link DANFE disponível (situacao.id=24)', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{numero_nfe}}','{{link_nfe}}'] },
  // ── Pós-venda ───────────────────────────────────────────────────────────────
  { id:'nao_entregue',       label:'Não Entregue',          grupo:'Pós-venda',     icon:AlertCircle, cor:'#ef4444', corBg:'rgba(239,68,68,0.1)',  desc:'Tentativa de entrega falhou',                  variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{transportadora}}','{{codigo_rastreio}}','{{link_rastreio}}'] },
  { id:'devolucao',          label:'Devolução',             grupo:'Pós-venda',     icon:RefreshCw,   cor:'#f87171', corBg:'rgba(248,113,113,0.1)', desc:'Pedido devolvido ao remetente',                variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  { id:'cancelamento',       label:'Pedido Cancelado',      grupo:'Pós-venda',     icon:XCircle,     cor:'#6b7280', corBg:'rgba(107,114,128,0.1)', desc:'Pedido cancelado no Bling (situacao.id=12)',   variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}'] },
  // ── Extras personalizados ───────────────────────────────────────────────────
  { id:'aguardando_retirada',label:'Aguardando Retirada',   grupo:'Personalizado', icon:Clock,       cor:'#a78bfa', corBg:'rgba(167,139,250,0.1)', desc:'String #AGUARDANDO nas obs. internas',         variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  { id:'lembrete_rastreio',  label:'Lembrete de Rastreio',  grupo:'Personalizado', icon:Bell,        cor:'#fb923c', corBg:'rgba(251,146,60,0.1)', desc:'String #RASTREIO nas obs. internas',            variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{codigo_rastreio}}','{{link_rastreio}}'] },
]

const GRUPOS = [...new Set(GATILHOS.map(g=>g.grupo))]

const PADROES = {
  pedido_criado:      { cab:'🛒 Pedido Confirmado!',      img:'', corpo:'Olá *{{nome_cliente}}*!\n\nSeu pedido *#{{numero_pedido}}* foi criado com sucesso.\n\n💳 Total: *{{valor_total}}*\n💰 Pagamento: {{forma_pagamento}}',                                  rod:'Mensagem automática — para dúvidas, responda aqui.', bts:[{texto:'Ver pedido',acao:'url',valor:'{{link_pedido}}',id:1}] },
  pagamento_aprovado: { cab:'✅ Pagamento Aprovado!',      img:'', corpo:'Olá *{{nome_cliente}}*!\n\nO pagamento do pedido *#{{numero_pedido}}* foi confirmado. 🎉\n\nJá estamos preparando com carinho!',                                                rod:'Mensagem automática.', bts:[] },
  pagamento_pendente: { cab:'⏳ Pagamento Pendente',       img:'', corpo:'Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* aguarda pagamento.\n\nTotal: *{{valor_total}}*',                                                                          rod:'O link expira em 24 horas.', bts:[{texto:'Pagar agora',acao:'url',valor:'{{link_pedido}}',id:1},{texto:'Preciso de ajuda',acao:'reply',valor:'Ajuda com pagamento',id:2}] },
  pedido_enviado:     { cab:'🚚 Seu pedido foi enviado!', img:'', corpo:'Olá *{{nome_cliente}}*! O pedido *#{{numero_pedido}}* saiu para entrega.\n\n📦 Transportadora: {{transportadora}}\n🔍 Rastreio: *{{codigo_rastreio}}*\n📅 Prazo: *{{prazo_entrega}}*', rod:'Continuaremos monitorando e avisaremos quando chegar.', bts:[{texto:'Rastrear pedido',acao:'url',valor:'{{link_rastreio}}',id:1}] },
  pedido_entregue:    { cab:'📦 Pedido entregue!',        img:'', corpo:'Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* foi entregue! 😊\n\nEsperamos que você goste muito!',                                                                   rod:'Qualquer problema estamos à disposição.', bts:[{texto:'Avaliar ⭐⭐⭐⭐⭐',acao:'reply',valor:'Quero avaliar',id:1},{texto:'Tive um problema',acao:'reply',valor:'Preciso de ajuda',id:2}] },
  avise_me:           { cab:'🔔 Produto disponível!',     img:'{{foto_produto}}', corpo:'Olá *{{nome_cliente}}*!\n\n✨ *{{nome_produto}}* voltou ao estoque!\n\n💳 Cartão: *{{preco_produto}}*\n💰 PIX: *{{preco_pix}}* (10% off)',                        rod:'Estoque limitado — garanta o seu!', bts:[{texto:'Comprar agora',acao:'url',valor:'{{link_produto}}',id:1}] },
  boas_vindas:        { cab:'',                           img:'', corpo:'👋 Olá *{{nome_cliente}}*! Bem-vindo(a) à *{{nome_loja}}*!\n\nSou a Molise, sua assistente virtual. Estou aqui para ajudar com produtos, pedidos, rastreio e muito mais. 😊',  rod:'', bts:[] },
  avaliar_pedido:     { cab:'⭐ Como foi sua experiência?',img:'', corpo:'Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* foi entregue!\n\nSua opinião nos ajuda a melhorar sempre 🙏',                                                           rod:'Obrigado por comprar conosco!', bts:[{texto:'Adorei! ⭐⭐⭐⭐⭐',acao:'reply',valor:'Fiquei satisfeito',id:1},{texto:'Tive um problema',acao:'reply',valor:'Preciso de ajuda',id:2}] },
  em_separacao:       { cab:'📋 Pedido em separação!',    img:'', corpo:'Olá *{{nome_cliente}}*! \n\nSeu pedido *#{{numero_pedido}}* está sendo separado. Em breve será embalado e enviado! 📦',                                                               rod:'Mensagem automática.', bts:[] },
  produto_embalado:   { cab:'📦 Pedido embalado!',        img:'', corpo:'Olá *{{nome_cliente}}*! \n\nSeu pedido *#{{numero_pedido}}* foi embalado e está pronto para despacho. Em breve você receberá o código de rastreio! 🚚',                               rod:'Mensagem automática.', bts:[] },
  saiu_entrega:       { cab:'🚚 Saiu para entrega!',      img:'', corpo:'Olá *{{nome_cliente}}*! \n\nSeu pedido *#{{numero_pedido}}* saiu para entrega hoje!\n\n🔍 Rastreio: *{{codigo_rastreio}}*',                                                         rod:'Continuaremos monitorando.', bts:[{texto:'Rastrear',acao:'url',valor:'{{link_rastreio}}',id:1}] },
  em_andamento:       { cab:'⚙️ Pedido em processamento!', img:'', corpo:'Olá *{{nome_cliente}}*! \n\nSeu pedido *#{{numero_pedido}}* está sendo processado pela nossa expedição.\n\nEstamos iniciando o processo de separação e faturamento. Em breve você receberá a nota fiscal! 📋',                rod:'Mensagem automática — não é necessário responder.', bts:[] },
  nfe_pendente:       { cab:'📋 Nota Fiscal em processamento', img:'', corpo:'Olá *{{nome_cliente}}*! \n\nA nota fiscal do seu pedido *#{{numero_pedido}}* foi criada e está aguardando autorização da SEFAZ.\n\nAssim que for autorizada, você receberá o link para download. 📄', rod:'Processo automático — em breve você receberá a NF-e.', bts:[] },
  nfe_emitida:        { cab:'📄 Nota Fiscal emitida!',    img:'', corpo:'Olá *{{nome_cliente}}*! \n\nA nota fiscal do seu pedido *#{{numero_pedido}}* foi emitida e autorizada pela SEFAZ.\n\n📋 NF-e: *{{numero_nfe}}*',                                                         rod:'Guarde para seus registros.', bts:[{texto:'Ver NF-e',acao:'url',valor:'{{link_nfe}}',id:1}] },
  nao_entregue:       { cab:'⚠️ Tentativa de entrega',    img:'', corpo:'Olá *{{nome_cliente}}*, houve uma tentativa de entrega do pedido *#{{numero_pedido}}* que não foi concluída.\n\n🚚 {{transportadora}}\n🔍 Rastreio: *{{codigo_rastreio}}*',           rod:'Entre em contato com a transportadora.', bts:[{texto:'Rastrear',acao:'url',valor:'{{link_rastreio}}',id:1},{texto:'Preciso de ajuda',acao:'reply',valor:'Ajuda com entrega',id:2}] },
  devolucao:          { cab:'↩️ Pedido devolvido',         img:'', corpo:'Olá *{{nome_cliente}}*, infelizmente seu pedido *#{{numero_pedido}}* foi devolvido ao remetente.\n\nEntre em contato conosco para resolvermos juntos.',                              rod:'Estamos à disposição.', bts:[{texto:'Falar com atendente',acao:'reply',valor:'Preciso de ajuda com devolução',id:1}] },
  cancelamento:       { cab:'❌ Pedido cancelado',         img:'', corpo:'Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* foi cancelado.\n\nSe tiver dúvidas ou quiser fazer um novo pedido, é só nos chamar.',                                        rod:'Obrigado pela compreensão.', bts:[{texto:'Falar conosco',acao:'reply',valor:'Quero saber sobre o cancelamento',id:1}] },
  aguardando_retirada:{ cab:'📍 Pronto para retirada!',   img:'', corpo:'Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* está pronto para retirada!\n\nCompareça com seu documento de identidade.',                                                   rod:'Aguardamos sua visita.', bts:[] },
  lembrete_rastreio:  { cab:'📦 Atualização do seu pedido',img:'', corpo:'Olá *{{nome_cliente}}*, aqui está uma atualização sobre seu pedido *#{{numero_pedido}}*:\n\n🔍 Rastreio: *{{codigo_rastreio}}*',                                                     rod:'Continuaremos monitorando.', bts:[{texto:'Rastrear agora',acao:'url',valor:'{{link_rastreio}}',id:1}] },
}

// Tipos de bloco extra (quebra de mensagem, áudio, vídeo, ligação)
const TIPOS_BLOCO = [
  { tipo:'cabecalho', label:'Cabeçalho', icon:Hash,         cor:'#00d4aa', desc:'Negrito no topo' },
  { tipo:'texto',     label:'Texto',     icon:FileText,      cor:'#4a9fff', desc:'Corpo da mensagem' },
  { tipo:'rodape',    label:'Rodapé',    icon:FileText,      cor:'#8696a0', desc:'Itálico no final' },
  { tipo:'imagem',    label:'Imagem',    icon:Image,         cor:'#fb923c', desc:'Foto ou produto' },
  { tipo:'video',     label:'Vídeo',     icon:Video,         cor:'#a78bfa', desc:'Link de vídeo' },
  { tipo:'audio',     label:'Áudio',     icon:Mic,           cor:'#22c55e', desc:'Link de áudio' },
  { tipo:'botao',     label:'Botão',     icon:MousePointer,  cor:'#e879f9', desc:'Ação interativa' },
  { tipo:'link',      label:'Link',      icon:LinkIcon,      cor:'#f59e0b', desc:'URL clicável' },
  { tipo:'ligar',     label:'Ligar',     icon:Phone,         cor:'#f87171', desc:'Botão de chamada' },
  { tipo:'quebra',    label:'+ Mensagem',icon:Plus,          cor:'#6b7280', desc:'Nova mensagem separada' },
]

// Strings do Bling e ajuda
const STRINGS_AJUDA = {
  pedido_criado:      { bling: 'Automático — situacao.id = 6',  info: 'Disparado quando pedido é criado no Bling' },
  pagamento_aprovado: { bling: 'Automático — situacao.id = 9',  info: 'Disparado quando pagamento é confirmado' },
  pagamento_pendente: { bling: 'Automático — situacao.id = 6',  info: 'Disparado quando pedido fica em aberto sem pagamento' },
  pedido_enviado:     { bling: 'Automático — situacao.id = 27', info: 'Disparado quando pedido é despachado' },
  pedido_entregue:    { bling: 'Automático — situacao.id = 30', info: 'Disparado quando entrega é confirmada' },
  avise_me:           { bling: 'Manual via painel',             info: 'Disparado quando produto volta ao estoque' },
  boas_vindas:        { bling: 'Primeiro contato',              info: 'Disparado na primeira mensagem do cliente' },
  avaliar_pedido:     { bling: 'Manual via painel',             info: 'Disparado após entrega confirmada' },
  em_separacao:       { bling: 'String: #SEPARACAO',            info: 'Cole #SEPARACAO no campo Observações Internas do pedido no Bling para disparar' },
  produto_embalado:   { bling: 'String: #EMBALADO',             info: 'Cole #EMBALADO no campo Observações Internas do pedido no Bling para disparar' },
  em_andamento:       { bling: 'Automático — situacao.id = 15', info: 'Disparado quando expedição inicia separação/faturamento. Sinaliza ao cliente que o pedido está sendo preparado.' },
  nfe_pendente:       { bling: 'Automático — situacao.id = 21', info: 'Disparado quando NF-e é criada mas ainda aguarda autorização da SEFAZ. Cliente sabe que o faturamento foi iniciado.' },
  nfe_emitida:        { bling: 'Automático — situacao.id = 24', info: 'Disparado quando NF-e é autorizada. Retorna número da nota e link do DANFE.' },
  nao_entregue:       { bling: 'Automático — situacao.id = 33', info: 'Disparado quando entrega falha. Oriente o cliente a contatar a transportadora.' },
  devolucao:          { bling: 'Automático — situacao.id = 36', info: 'Disparado quando pedido é devolvido.' },
  cancelamento:       { bling: 'Automático — situacao.id = 12', info: 'Disparado quando pedido é cancelado no Bling.' },
  aguardando_retirada:{ bling: 'String: #AGUARDANDO',           info: 'Cole #AGUARDANDO no campo Observações Internas para disparar.' },
  lembrete_rastreio:  { bling: 'String: #RASTREIO',             info: 'Cole #RASTREIO no campo Observações Internas para enviar atualização de rastreio.' },
  saiu_entrega:       { bling: 'String: #SAIU',                 info: 'Cole #SAIU no campo Observações Internas do pedido no Bling para disparar' },
}

const DELAY_OPCOES = [
  { valor:0,   label:'Envio imediato' },
  { valor:5,   label:'5 minutos' },
  { valor:15,  label:'15 minutos' },
  { valor:30,  label:'30 minutos' },
  { valor:60,  label:'1 hora' },
  { valor:120, label:'2 horas' },
  { valor:240, label:'4 horas' },
]

const AMOSTRAS = {
  '{{nome_cliente}}':'Maria Silva','{{numero_pedido}}':'224307','{{valor_total}}':'R$ 47,52',
  '{{forma_pagamento}}':'PIX','{{transportadora}}':'Jadlog','{{codigo_rastreio}}':'JD123456789BR',
  '{{link_rastreio}}':'https://rastreamento.jadlog.com.br','{{prazo_entrega}}':'3 dias úteis',
  '{{nome_produto}}':'Fio de Seda Rabo de Rato Preto','{{preco_produto}}':'R$ 11,62',
  '{{preco_pix}}':'R$ 10,46','{{link_produto}}':'https://sostrass.com.br/produto',
  '{{foto_produto}}':'https://cdn-sostrass-image.s3.sa-east-1.amazonaws.com/perola-furo-passante-creme.jpg',
  '{{nome_loja}}':'Só Strass','{{link_pedido}}':'https://sostrass.com.br/pedido/224307',
}
const rv = t=>(t||'').replace(/\{\{([^}]+)\}\}/g,(_,k)=>AMOSTRAS[`{{${k}}}`]||`{{${k}}}`)

// ── Preview WhatsApp ───────────────────────────────────────────────────────────
function PreviewBolha({ blocos }) {
  const hora = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
  // Agrupa blocos em "mensagens" separadas por quebra
  const msgs = [[]]
  for (const b of blocos) {
    if (b.tipo === 'quebra') msgs.push([])
    else msgs[msgs.length-1].push(b)
  }

  return (
    <div className="space-y-2">
      {msgs.filter(m=>m.length>0).map((msg, mi) => {
        const cab  = msg.find(b=>b.tipo==='cabecalho')
        const img  = msg.find(b=>b.tipo==='imagem')
        const vid  = msg.find(b=>b.tipo==='video')
        const aud  = msg.find(b=>b.tipo==='audio')
        const txts = msg.filter(b=>b.tipo==='texto')
        const rod  = msg.find(b=>b.tipo==='rodape')
        const bts  = msg.filter(b=>b.tipo==='botao'||b.tipo==='ligar'||b.tipo==='link')
        const empty= !cab&&!img&&!vid&&!aud&&!txts.length&&!rod

        if (empty) return null
        return (
          <div key={mi}>
            {mi>0&&<div className="flex items-center gap-1 my-1"><div className="flex-1 border-t" style={{borderColor:'#2a3942'}}/><span style={{fontSize:8,color:'#8696a0'}}>mensagem separada</span><div className="flex-1 border-t" style={{borderColor:'#2a3942'}}/></div>}
            <div className="rounded-[12px] rounded-tl-[2px] overflow-hidden max-w-[260px]" style={{background:'#202c33'}}>
              {img?.url&&<div style={{background:'#1a2733'}}><img src={rv(img.url)} alt="" style={{width:'100%',maxHeight:130,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/></div>}
              {vid?.url&&<div className="px-3 py-2 flex items-center gap-2" style={{background:'#1a2733'}}><Video size={16} style={{color:'#8696a0'}}/><span style={{fontSize:11,color:'#8696a0'}}>Vídeo</span></div>}
              {aud?.url&&<div className="px-3 py-2 flex items-center gap-2" style={{background:'#1a2733'}}><Mic size={16} style={{color:'#8696a0'}}/><span style={{fontSize:11,color:'#8696a0'}}>Áudio</span></div>}
              {cab?.conteudo&&<div className="px-3 pt-2.5 pb-0.5"><p style={{fontSize:14,fontWeight:700,color:'#e9edef',lineHeight:1.4}}>{rv(cab.conteudo)}</p></div>}
              {txts.map((b,i)=>(
                <div key={i} className="px-3 py-2">
                  <p style={{fontSize:12,color:'#e9edef',lineHeight:1.65,whiteSpace:'pre-wrap'}}
                    dangerouslySetInnerHTML={{__html:rv(b.conteudo||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br/>').replace(/\*([^*\n]+)\*/g,'<strong>$1</strong>').replace(/_([^_\n]+)_/g,'<em>$1</em>')}}/>
                </div>
              ))}
              {rod?.conteudo&&<div className="px-3 pb-2"><p style={{fontSize:10,color:'#8696a0',fontStyle:'italic'}}>{rv(rod.conteudo)}</p></div>}
              <div className="px-3 pb-1.5 flex justify-end"><span style={{fontSize:9,color:'#8696a0'}}>{hora} ✓✓</span></div>
              {bts.length>0&&(
                <div style={{borderTop:'1px solid #2a3942'}}>
                  {bts.map((b,i)=>(
                    <div key={i} className="flex items-center justify-center gap-1.5 py-2.5" style={{borderTop:i>0?'1px solid #2a3942':'none',color:'#00a884',cursor:'pointer'}}>
                      {b.tipo==='ligar'?<Phone size={10}/>:b.tipo==='link'?<LinkIcon size={10}/>:<MousePointer size={10}/>}
                      <span style={{fontSize:12,fontWeight:500}}>{rv(b.texto||b.url||'Botão')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PreviewWA({ blocos=[], label='' }) {
  const hora = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
  const vazio = !blocos.filter(b=>b.tipo!=='quebra').length
  return (
    <div style={{maxWidth:300,margin:'0 auto',userSelect:'none'}}>
      <div className="rounded-[22px] overflow-hidden" style={{background:'#111b21',border:'7px solid #1a252f',boxShadow:'0 24px 60px rgba(0,0,0,0.5)'}}>
        <div style={{background:'#1a252f',padding:'4px 14px'}}><div className="flex justify-between"><span style={{fontSize:9,color:'#8696a0'}}>{hora}</span><span style={{fontSize:9,color:'#8696a0'}}>●●●</span></div></div>
        <div className="flex items-center gap-2.5 px-3 py-2.5" style={{background:'#202c33'}}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white" style={{background:'#00a884',fontSize:12}}>S</div>
          <div><p style={{fontSize:13,fontWeight:700,color:'white',lineHeight:1.2}}>Só Strass</p><p style={{fontSize:10,color:'#8696a0'}}>mensagem automática</p></div>
        </div>
        <div className="p-3" style={{background:'#0b141a',minHeight:100}}>
          {vazio?(
            <div className="flex flex-col items-center py-6" style={{opacity:.3}}>
              <MessageSquare size={22} style={{color:'#8696a0'}}/>
              <p style={{fontSize:10,color:'#8696a0',marginTop:5}}>Configure os blocos</p>
            </div>
          ):<PreviewBolha blocos={blocos}/>}
        </div>
      </div>
      {!vazio&&<p style={{fontSize:9,color:'var(--label-4)',textAlign:'center',marginTop:8}}>Preview com dados de exemplo</p>}
    </div>
  )
}

// ── Bloco individual com drag ──────────────────────────────────────────────────
function Bloco({ b, idx, total, vars, onChange, onDelete, onMove, onDuplicate }) {
  const [aberto, setAberto] = useState(true)
  const def = TIPOS_BLOCO.find(t=>t.tipo===b.tipo)||TIPOS_BLOCO[0]
  const Ic  = def.icon

  const inserirVar = (v, fieldId) => {
    const el = document.getElementById(fieldId)
    if (!el) { onChange({...b, conteudo:(b.conteudo||'')+v}); return }
    const s=el.selectionStart, e=el.selectionEnd
    const campo = el.tagName==='TEXTAREA'?'conteudo':'url'
    const novo = (b[campo]||'').slice(0,s)+v+(b[campo]||'').slice(e)
    onChange({...b,[campo]:novo})
    setTimeout(()=>{el.focus();el.setSelectionRange(s+v.length,s+v.length)},0)
  }

  const sty = {background:'var(--bg)',border:'1px solid var(--sep)',borderRadius:9,color:'var(--label)',outline:'none',padding:'9px 12px',fontSize:13,width:'100%',fontFamily:'inherit',lineHeight:1.6}

  // Bloco de quebra — visual diferente
  if (b.tipo === 'quebra') return (
    <div className="flex items-center gap-2 py-2">
      <div className="flex-1 border-t border-dashed" style={{borderColor:'var(--sep)'}}/>
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold"
        style={{background:'var(--bg-3)',color:'var(--label-3)',border:'1px solid var(--sep)'}}>
        <Plus size={9}/> Nova mensagem
      </div>
      <div className="flex-1 border-t border-dashed" style={{borderColor:'var(--sep)'}}/>
      <button onClick={onDelete} style={{color:'var(--label-4)'}}><X size={12}/></button>
    </div>
  )

  return (
    <div className="rounded-[13px] overflow-hidden transition-all"
      style={{border:`1px solid ${aberto?def.cor+'30':'var(--sep)'}`,background:'var(--bg-2)'}}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2"
        style={{background:'var(--bg-3)',borderBottom:aberto?'1px solid var(--sep)':'none'}}>
        <button className="cursor-grab p-0.5 touch-none" style={{color:'var(--label-4)'}} title="Arrastar">
          <GripVertical size={13}/>
        </button>
        <div className="w-5 h-5 rounded-[5px] flex items-center justify-center flex-shrink-0"
          style={{background:`${def.cor}20`}}>
          <Ic size={11} style={{color:def.cor}}/>
        </div>
        <span className="text-[11px] font-semibold flex-1" style={{color:'var(--label-2)'}}>
          {def.label}
          {b.tipo==='texto'&&b.conteudo&&<span className="font-normal ml-1" style={{color:'var(--label-4)'}}> — {b.conteudo.slice(0,35).replace(/\n/g,' ')}{b.conteudo.length>35?'…':''}</span>}
        </span>
        <div className="flex items-center gap-0.5">
          <button onClick={()=>onMove(idx,-1)} disabled={idx===0} className="p-1 rounded disabled:opacity-20" style={{color:'var(--label-4)'}}><ChevronUp size={11}/></button>
          <button onClick={()=>onMove(idx,1)} disabled={idx===total-1} className="p-1 rounded disabled:opacity-20" style={{color:'var(--label-4)'}}><ChevronDown size={11}/></button>
          <button onClick={onDuplicate} className="p-1 rounded" title="Duplicar" style={{color:'var(--label-4)'}}><Copy size={11}/></button>
          <button onClick={()=>setAberto(v=>!v)} className="p-1 rounded" style={{color:'var(--label-4)'}}>{aberto?<ChevronUp size={11}/>:<ChevronDown size={11}/>}</button>
          <button onClick={onDelete} className="p-1 rounded" style={{color:'var(--label-4)'}}><X size={11}/></button>
        </div>
      </div>

      {aberto && (
        <div className="p-3 space-y-2">
          {/* CABEÇALHO */}
          {b.tipo==='cabecalho'&&(
            <>
              <input value={b.conteudo||''} onChange={e=>onChange({...b,conteudo:e.target.value})}
                placeholder="Emoji + título — Ex: 🛒 Pedido Confirmado!" style={sty}/>
              <VarPills vars={vars} onInsert={v=>inserirVar(v,`bloco-${b.id}`)}/>
            </>
          )}
          {/* TEXTO */}
          {b.tipo==='texto'&&(
            <>
              <textarea id={`bloco-${b.id}`} value={b.conteudo||''} onChange={e=>onChange({...b,conteudo:e.target.value})}
                placeholder="Texto da mensagem... Use *negrito* e _itálico_" rows={4}
                style={{...sty,resize:'none'}}/>
              <VarPills vars={vars} onInsert={v=>inserirVar(v,`bloco-${b.id}`)}/>
            </>
          )}
          {/* RODAPÉ */}
          {b.tipo==='rodape'&&(
            <>
              <input value={b.conteudo||''} onChange={e=>onChange({...b,conteudo:e.target.value})}
                placeholder="Ex: Mensagem automática — não responda. / Continuaremos monitorando..." style={sty}/>
            </>
          )}
          {/* IMAGEM */}
          {b.tipo==='imagem'&&(
            <>
              <input value={b.url||''} onChange={e=>onChange({...b,url:e.target.value})}
                placeholder="URL da imagem ou {{foto_produto}}" style={{...sty,fontFamily:'monospace',fontSize:12}}/>
              <VarPills vars={['{{foto_produto}}',...vars.filter(v=>v.includes('foto'))]} onInsert={v=>onChange({...b,url:(b.url||'')+v})}/>
              <input value={b.legenda||''} onChange={e=>onChange({...b,legenda:e.target.value})}
                placeholder="Legenda (opcional)" style={{...sty,fontSize:12}}/>
            </>
          )}
          {/* VÍDEO */}
          {b.tipo==='video'&&(
            <input value={b.url||''} onChange={e=>onChange({...b,url:e.target.value})}
              placeholder="URL do vídeo (MP4 ou YouTube)" style={{...sty,fontFamily:'monospace',fontSize:12}}/>
          )}
          {/* ÁUDIO */}
          {b.tipo==='audio'&&(
            <input value={b.url||''} onChange={e=>onChange({...b,url:e.target.value})}
              placeholder="URL do áudio (MP3 ou OGG)" style={{...sty,fontFamily:'monospace',fontSize:12}}/>
          )}
          {/* BOTÃO */}
          {b.tipo==='botao'&&(
            <>
              <input value={b.texto||''} onChange={e=>onChange({...b,texto:e.target.value})}
                placeholder="Texto do botão (máx. 20 chars)" maxLength={20} style={sty}/>
              <div className="grid grid-cols-3 gap-1.5">
                {[['url','🔗 Link'],['reply','💬 Resposta'],['tel','📞 Ligar']].map(([v,l])=>(
                  <button key={v} onClick={()=>onChange({...b,acao:v})}
                    className="py-1.5 rounded-[8px] text-[10px] font-medium transition-all"
                    style={{background:b.acao===v?'var(--accent-dim)':'var(--bg)',color:b.acao===v?'var(--accent)':'var(--label-3)',border:b.acao===v?'1px solid var(--accent-border)':'1px solid var(--sep)'}}>
                    {l}
                  </button>
                ))}
              </div>
              {(b.acao==='url'||b.acao==='tel')&&(
                <div className="space-y-1.5">
                  <input value={b.valor||''} onChange={e=>onChange({...b,valor:e.target.value})}
                    placeholder={b.acao==='tel'?'Número de telefone':'URL destino'}
                    style={{...sty,fontFamily:'monospace',fontSize:11}}/>
                  <VarPills vars={vars.filter(v=>v.includes('link'))} onInsert={v=>onChange({...b,valor:(b.valor||'')+v})}/>
                </div>
              )}
            </>
          )}
          {/* LINK */}
          {b.tipo==='link'&&(
            <>
              <input value={b.url||''} onChange={e=>onChange({...b,url:e.target.value})}
                placeholder="URL ou {{link_produto}}" style={{...sty,fontFamily:'monospace',fontSize:12}}/>
              <VarPills vars={vars.filter(v=>v.includes('link'))} onInsert={v=>onChange({...b,url:(b.url||'')+v})}/>
            </>
          )}
          {/* LIGAR */}
          {b.tipo==='ligar'&&(
            <>
              <input value={b.texto||''} onChange={e=>onChange({...b,texto:e.target.value})}
                placeholder="Texto do botão — Ex: Falar com atendente" maxLength={20} style={sty}/>
              <input value={b.valor||''} onChange={e=>onChange({...b,valor:e.target.value})}
                placeholder="Número de telefone — Ex: 5519999999999"
                style={{...sty,fontFamily:'monospace',fontSize:12}}/>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function VarPills({ vars, onInsert }) {
  if (!vars?.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {vars.map(v=>(
        <button key={v} onClick={()=>onInsert(v)}
          className="transition-all hover:scale-105 active:scale-95"
          style={{padding:'2px 7px',borderRadius:5,fontSize:9,fontFamily:'monospace',background:'var(--accent-dim)',color:'var(--accent)',border:'1px solid var(--accent-border)',cursor:'pointer'}}>
          {v}
        </button>
      ))}
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function PageTransacional({ api: apiProp }) {
  const api = apiProp || BASE
  const [configs,  setConfigs]  = useState({})
  const [selId,    setSelId]    = useState('pedido_criado')
  const [blocos,   setBlocos]   = useState([])
  const [dirty,    setDirty]    = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [salvoOk,  setSalvoOk]  = useState(false)
  const [gerando,  setGerando]  = useState(false)
  const [erroIA,   setErroIA]   = useState('')
  const [telTeste, setTelTeste] = useState('')
  const [enviandoT,setEnviandoT]= useState(false)
  const [resTeste, setResTeste] = useState(null)
  const [delays,   setDelays]   = useState({}) // {gatilhoId: minutos}
  const [showHelp, setShowHelp] = useState(null)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/templates`)
      if (!r.ok) return
      const d = await r.json()
      const map = {}
      for (const t of d.templates||[]) {
        if (t.gatilho) map[t.gatilho] = { id:t.id, ativo:t.ativo, blocos:t.blocos||[] }
      }
      setConfigs(map)
      // Carrega delays configurados
      try {
        const rd = await fetch(`${api}/api/ia/config`)
        if (rd.ok) {
          const dd = await rd.json()
          const dm = {}
          for (const [k,v] of Object.entries(dd.config||{})) {
            if (k.startsWith('delay_')) dm[k.replace('delay_','')] = parseInt(v)||0
          }
          setDelays(dm)
        }
      } catch {}
    } catch {}
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  // Carrega blocos ao mudar gatilho
  useEffect(() => {
    const c = configs[selId]
    if (c?.blocos?.length) {
      setBlocos(c.blocos.map((b,i)=>({...b,id:b.id||Date.now()+i})))
    } else {
      const p = PADROES[selId]
      if (p) {
        const bs = []
        if (p.cab)  bs.push({tipo:'cabecalho',conteudo:p.cab,id:1})
        if (p.img)  bs.push({tipo:'imagem',url:p.img,legenda:'',id:2})
        if (p.corpo)bs.push({tipo:'texto',conteudo:p.corpo,id:3})
        if (p.rod)  bs.push({tipo:'rodape',conteudo:p.rod,id:4})
        p.bts?.forEach((b,i)=>bs.push({tipo:'botao',...b,id:10+i}))
        setBlocos(bs)
      } else {
        setBlocos([{tipo:'texto',conteudo:'',id:Date.now()}])
      }
    }
    setDirty(false); setErroIA('')
  }, [selId, configs])

  const addBloco = (tipo) => {
    const nb = {tipo,conteudo:'',url:'',texto:'',acao:'reply',valor:'',legenda:'',id:Date.now()}
    setBlocos(prev=>[...prev,nb]); setDirty(true)
  }
  const delBloco = i => { setBlocos(prev=>prev.filter((_,j)=>j!==i)); setDirty(true) }
  const updBloco = (i,b) => { setBlocos(prev=>prev.map((x,j)=>j===i?b:x)); setDirty(true) }
  const moveBloco = (i,d) => {
    const t=i+d; if(t<0||t>=blocos.length)return
    const a=[...blocos];[a[i],a[t]]=[a[t],a[i]];setBlocos(a);setDirty(true)
  }
  const dupBloco = i => {
    const clone={...blocos[i],id:Date.now()}
    const a=[...blocos]; a.splice(i+1,0,clone); setBlocos(a); setDirty(true)
  }

  const toggleAtivo = async gId => {
    const c=configs[gId]; if(!c)return
    const novo=!c.ativo
    setConfigs(prev=>({...prev,[gId]:{...c,ativo:novo}}))
    await fetch(`${api}/api/templates/${c.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ativo:novo})}).catch(()=>{})
  }

  const salvarDelay = async (gatilhoId, minutos) => {
    setDelays(prev => ({...prev, [gatilhoId]: minutos}))
    try {
      await fetch(`${api}/api/ia/config`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ chave:`delay_${gatilhoId}`, valor:String(minutos) })
      })
    } catch {}
  }

  const salvar = async () => {
    if (!selId||!dirty)return; setSalvando(true)
    try {
      const c=configs[selId], g=GATILHOS.find(x=>x.id===selId)
      await fetch(c?`${api}/api/templates/${c.id}`:`${api}/api/templates`,{
        method:c?'PATCH':'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({gatilho:selId,nome:g?.label||selId,blocos,ativo:c?.ativo??true})
      })
      setSalvoOk(true); setDirty(false); await carregar()
      setTimeout(()=>setSalvoOk(false),2500)
    } catch {}
    setSalvando(false)
  }

  const gerarIA = async () => {
    const g=GATILHOS.find(x=>x.id===selId); if(!g)return
    setGerando(true); setErroIA('')
    try {
      const r=await fetch(`${api}/api/templates/gerar`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:g.label,gatilho:g.id,descricao:g.desc})})
      const txt = await r.text()
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0,100)}`)
      const d = JSON.parse(txt)
      if (d.blocos) {
        setBlocos(d.blocos.map((b,i)=>({...b,id:Date.now()+i})))
        setDirty(true)
      } else if (d.erro) throw new Error(d.erro)
    } catch(e) { setErroIA(e.message||'Erro desconhecido') }
    setGerando(false)
  }

  const testar = async () => {
    if(!telTeste.trim())return; setEnviandoT(true); setResTeste(null)
    try {
      const corpo=blocos.find(b=>b.tipo==='texto')?.conteudo||''
      const cab=blocos.find(b=>b.tipo==='cabecalho')?.conteudo||''
      const rod=blocos.find(b=>b.tipo==='rodape')?.conteudo||''
      let msg=''; if(cab)msg+=`*${rv(cab)}*\n\n`; msg+=rv(corpo); if(rod)msg+=`\n\n_${rv(rod)}_`
      const r=await fetch(`${api}/api/dashboard/enviar`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:telTeste.replace(/\D/g,''),mensagem:msg})})
      setResTeste(r.ok?'ok':'erro')
    } catch{setResTeste('erro')}
    setEnviandoT(false); setTimeout(()=>setResTeste(null),4000)
  }

  const gatilho=GATILHOS.find(g=>g.id===selId)
  const config=configs[selId]

  return (
    <div className="h-full flex overflow-hidden" style={{background:'var(--bg)'}}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <div className="w-[248px] flex-shrink-0 flex flex-col overflow-hidden"
        style={{background:'var(--bg-2)',borderRight:'1px solid var(--sep)'}}>
        <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{borderBottom:'1px solid var(--sep)'}}>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 h-6 rounded-[7px] flex items-center justify-center" style={{background:'var(--accent-dim)'}}>
              <Zap size={12} style={{color:'var(--accent)'}}/>
            </div>
            <span className="text-[15px] font-bold" style={{color:'var(--label)'}}>Gatilhos</span>
          </div>
          <p className="text-[10px]" style={{color:'var(--label-4)'}}>
            {Object.values(configs).filter(c=>c.ativo).length} ativos · {GATILHOS.length} disponíveis
          </p>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {GRUPOS.map(grupo=>(
            <div key={grupo}>
              <p className="px-4 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest" style={{color:'var(--label-4)'}}>{grupo}</p>
              {GATILHOS.filter(g=>g.grupo===grupo).map(g=>{
                const c=configs[g.id], sel=selId===g.id, Ic=g.icon
                return (
                  <div key={g.id} className="flex items-center px-2 transition-all"
                    style={{background:sel?`${g.cor}10`:'transparent',borderRight:sel?`2.5px solid ${g.cor}`:'2.5px solid transparent'}}>
                    <button onClick={()=>setSelId(g.id)} className="flex-1 flex items-center gap-2.5 px-2 py-2.5 text-left min-w-0">
                      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-all"
                        style={{background:sel?g.corBg:'var(--fill)',border:`1px solid ${sel?g.cor+'60':'var(--sep)'}`}}>
                        <Ic size={14} style={{color:sel?g.cor:'var(--label-3)'}}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate leading-tight" style={{color:sel?g.cor:'var(--label)'}}>{g.label}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0${c?.ativo?' animate-pulse':''}`}
                            style={{background:c?(c.ativo?'#22c55e':'var(--label-4)'):'var(--sep)'}}/>
                          <span className="text-[9px] truncate" style={{color:'var(--label-4)'}}>
                            {c?(c.ativo?'Ativo':'Inativo'):'Não configurado'}
                          </span>
                        </div>
                      </div>
                    </button>
                    {c&&(
                      <button onClick={()=>toggleAtivo(g.id)}
                        className="p-1.5 rounded-[8px] flex-shrink-0 transition-all"
                        style={{color:c.ativo?'#22c55e':'var(--label-4)',background:c.ativo?'rgba(34,197,94,0.08)':'transparent'}}>
                        {c.ativo?<ToggleRight size={18} strokeWidth={2}/>:<ToggleLeft size={18} strokeWidth={1.5}/>}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Editor ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 flex-shrink-0"
          style={{borderBottom:'1px solid var(--sep)',background:'var(--bg-2)'}}>
          {gatilho&&(
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
                style={{background:gatilho.corBg,border:`1.5px solid ${gatilho.cor}50`}}>
                <gatilho.icon size={16} style={{color:gatilho.cor}}/>
              </div>
              <div>
                <h3 className="text-[14px] font-bold leading-tight" style={{color:'var(--label)'}}>{gatilho.label}</h3>
                <p className="text-[11px]" style={{color:'var(--label-3)'}}>{gatilho.desc}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            {/* Delay */}
            <div className="flex items-center gap-1.5">
              <Timer size={12} style={{color:'var(--label-3)'}}/>
              <select value={delays[selId]||0} onChange={e=>salvarDelay(selId,parseInt(e.target.value))}
                className="px-2 py-1.5 rounded-[8px] text-[11px] outline-none"
                style={{background:'var(--fill)',border:'1px solid var(--sep)',color:'var(--label-2)'}}>
                {DELAY_OPCOES.map(d=>(
                  <option key={d.valor} value={d.valor}>{d.label}</option>
                ))}
              </select>
            </div>
            {config&&(
              <button onClick={()=>toggleAtivo(selId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-semibold transition-all"
                style={{background:config.ativo?'rgba(34,197,94,0.1)':'var(--fill)',color:config.ativo?'#22c55e':'var(--label-3)',border:config.ativo?'1px solid rgba(34,197,94,0.3)':'1px solid var(--sep)'}}>
                {config.ativo?<ToggleRight size={15} strokeWidth={2}/>:<ToggleLeft size={15} strokeWidth={1.5}/>}
                {config.ativo?'Ativo':'Inativo'}
              </button>
            )}
            <button onClick={salvar} disabled={salvando||!dirty}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all"
              style={{background:salvoOk?'#22c55e':dirty?'var(--accent)':'var(--fill)',color:dirty?'#000':'var(--label-4)',opacity:dirty?1:0.5}}>
              {salvando?<RefreshCw size={13} className="animate-spin"/>:salvoOk?<CheckCircle size={13}/>:<Save size={13}/>}
              {salvoOk?'Salvo!':'Salvar'}
            </button>
          </div>
        </div>

        {/* Barra de info do gatilho — string Bling + delay + help */}
        {gatilho && STRINGS_AJUDA[selId] && (
          <div className="flex items-center gap-3 px-6 py-2 flex-shrink-0"
            style={{borderBottom:'1px solid var(--sep)',background:'var(--bg-3)'}}>
            <Tag size={11} style={{color:'var(--label-4)',flexShrink:0}}/>
            <span className="text-[11px]" style={{color:'var(--label-3)'}}>
              <strong style={{color:'var(--label-2)'}}>Ativação:</strong> {STRINGS_AJUDA[selId].bling}
            </span>
            {delays[selId] > 0 && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                style={{background:'rgba(245,158,11,0.1)',color:'#f59e0b'}}>
                <Timer size={9}/> Delay: {DELAY_OPCOES.find(d=>d.valor===delays[selId])?.label}
              </span>
            )}
            <button onClick={()=>setShowHelp(showHelp===selId?null:selId)}
              className="ml-auto flex-shrink-0" style={{color:'var(--label-4)'}}>
              <HelpCircle size={13}/>
            </button>
            {showHelp === selId && (
              <div className="absolute right-6 mt-8 z-50 w-[280px] p-3 rounded-[12px] text-[11px]"
                style={{background:'var(--bg-2)',border:'1px solid var(--sep)',boxShadow:'0 8px 24px rgba(0,0,0,0.15)',marginTop:32}}>
                <p style={{color:'var(--label)'}}>{STRINGS_AJUDA[selId].info}</p>
                {selId.includes('em_separacao')||selId.includes('produto_embalado')||selId.includes('saiu_entrega') ? (
                  <div className="mt-2 p-2 rounded-[8px]" style={{background:'var(--bg-3)'}}>
                    <p className="font-semibold mb-1" style={{color:'var(--label-2)'}}>Como usar:</p>
                    <p style={{color:'var(--label-3)'}}>No Bling, abra o pedido → campo <strong>Observações Internas</strong> → digite a string e salve.</p>
                  </div>
                ):null}
              </div>
            )}
          </div>
        )}

        {/* Corpo: editor + preview */}
        <div className="flex-1 overflow-hidden flex">
          {/* Editor de blocos */}
          <div className="flex-1 overflow-y-auto" style={{borderRight:'1px solid var(--sep)'}}>
            <div className="max-w-[600px] mx-auto p-5 space-y-3">

              {/* Gerar IA */}
              <button onClick={gerarIA} disabled={gerando}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] text-[13px] font-semibold transition-all"
                style={{background:'var(--accent-dim)',color:'var(--accent)',border:'1px solid var(--accent-border)'}}>
                {gerando?<RefreshCw size={13} className="animate-spin"/>:<Sparkles size={14}/>}
                {gerando?'Gerando com IA...':'✨ Gerar mensagem com IA'}
              </button>
              {erroIA&&(
                <div className="flex items-start gap-2 px-4 py-3 rounded-[10px] text-[11px]"
                  style={{background:'rgba(239,68,68,0.08)',color:'var(--red)',border:'1px solid rgba(239,68,68,0.2)'}}>
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5"/><span>{erroIA}</span>
                </div>
              )}

              {/* Lista de blocos */}
              <div className="space-y-2">
                {blocos.map((b,i)=>(
                  <Bloco key={b.id||i} b={b} idx={i} total={blocos.length}
                    vars={gatilho?.variaveis||[]}
                    onChange={nb=>updBloco(i,nb)}
                    onDelete={()=>delBloco(i)}
                    onMove={moveBloco}
                    onDuplicate={()=>dupBloco(i)}/>
                ))}
              </div>

              {/* Paleta de blocos */}
              <div className="rounded-[14px] overflow-hidden" style={{border:'1px solid var(--sep)',background:'var(--bg-2)'}}>
                <div className="px-4 py-2.5" style={{borderBottom:'1px solid var(--sep)',background:'var(--bg-3)'}}>
                  <p className="text-[11px] font-semibold" style={{color:'var(--label-2)'}}>Adicionar bloco</p>
                </div>
                <div className="p-3 grid grid-cols-5 gap-1.5">
                  {TIPOS_BLOCO.map(t=>{
                    const Ic=t.icon
                    return (
                      <button key={t.tipo} onClick={()=>addBloco(t.tipo)}
                        className="flex flex-col items-center gap-1 py-2.5 rounded-[10px] text-[9px] font-semibold transition-all group"
                        style={{background:'var(--bg-3)',border:'1px solid var(--sep)',color:'var(--label-3)'}}
                        title={t.desc}>
                        <div className="w-6 h-6 rounded-[7px] flex items-center justify-center transition-all group-hover:scale-110"
                          style={{background:`${t.cor}20`}}>
                          <Ic size={12} style={{color:t.cor}}/>
                        </div>
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Testar */}
              <div className="rounded-[14px] p-4 space-y-3" style={{background:'var(--bg-2)',border:'1px solid var(--sep)'}}>
                <p className="text-[12px] font-semibold" style={{color:'var(--label-2)'}}>Testar envio</p>
                <div className="flex gap-2">
                  <input value={telTeste} onChange={e=>setTelTeste(e.target.value)} placeholder="5511999999999"
                    className="flex-1 px-3 py-2 rounded-[9px] text-[12px] outline-none"
                    style={{background:'var(--bg-3)',border:'1px solid var(--sep)',color:'var(--label)'}}/>
                  <button onClick={testar} disabled={enviandoT||!telTeste.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[9px] text-[12px] font-semibold"
                    style={{background:'var(--blue)',color:'#fff',opacity:!telTeste.trim()?0.5:1}}>
                    {enviandoT?<RefreshCw size={12} className="animate-spin"/>:<Send size={12}/>}
                    Testar
                  </button>
                </div>
                {resTeste&&<p className="text-[11px] font-medium" style={{color:resTeste==='ok'?'#22c55e':'var(--red)'}}>{resTeste==='ok'?'✓ Enviado!':'✗ Erro ao enviar'}</p>}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="w-[296px] flex-shrink-0 flex flex-col overflow-hidden">
            <div className="px-4 py-3 flex-shrink-0" style={{borderBottom:'1px solid var(--sep)',background:'var(--bg-2)'}}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{color:'var(--label-3)'}}>👁 Preview ao vivo</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex items-start justify-center" style={{background:'var(--bg-3)'}}>
              <PreviewWA blocos={blocos} label={gatilho?.label}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
