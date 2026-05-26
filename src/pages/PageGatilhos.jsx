import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Zap, Save, Send, RefreshCw, X, Sparkles, ToggleLeft, ToggleRight,
  CheckCircle, Plus, Image, FileText, MousePointer, Link as LinkIcon,
  ShoppingBag, CreditCard, Truck, Bell, Star, Package, Clock,
  MessageSquare, AlertCircle, GripVertical, ChevronDown, ChevronUp,
  Mic, Video, Phone, Copy, Hash, HelpCircle, Timer, Tag, XCircle, Edit3,
  Info, BookOpen, Layers, Settings2, Send as SendIcon, Brain,
  ArrowRight, RotateCcw, Search, ShieldAlert, Activity
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const GATILHOS_ESTATICOS = [
  { id:'pedido_criado',       label:'Pedido Criado',         grupo:'Pedidos',      icon:ShoppingBag, cor:'#00d4aa', corBg:'rgba(0,212,170,0.1)',   desc:'Novo pedido gerado no Bling',                    situacao:'id = 6',  variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}','{{forma_pagamento}}','{{link_pedido}}'] },
  { id:'pagamento_aprovado',  label:'Pagamento Aprovado',    grupo:'Pedidos',      icon:CreditCard,  cor:'#4a9fff', corBg:'rgba(74,159,255,0.1)',   desc:'PIX ou cartão confirmado',                       situacao:'id = 9',  variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}'] },
  { id:'pagamento_pendente',  label:'Pagamento Pendente',    grupo:'Pedidos',      icon:Clock,       cor:'#f59e0b', corBg:'rgba(245,158,11,0.1)',   desc:'Pedido aguardando pagamento',                    situacao:'id = 6',  variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}','{{link_pedido}}'] },
  { id:'pedido_enviado',      label:'Pedido Enviado',        grupo:'Entrega',      icon:Truck,       cor:'#a78bfa', corBg:'rgba(167,139,250,0.1)',  desc:'Pedido despachado com código de rastreio',       situacao:'id = 27', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{transportadora}}','{{codigo_rastreio}}','{{link_rastreio}}','{{prazo_entrega}}'] },
  { id:'pedido_entregue',     label:'Pedido Entregue',       grupo:'Entrega',      icon:Package,     cor:'#22c55e', corBg:'rgba(34,197,94,0.1)',    desc:'Entrega confirmada pela transportadora',         situacao:'id = 30', variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  { id:'nao_entregue',        label:'Não Entregue',          grupo:'Entrega',      icon:AlertCircle, cor:'#ef4444', corBg:'rgba(239,68,68,0.1)',    desc:'Tentativa de entrega falhou',                    situacao:'id = 33', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{transportadora}}','{{codigo_rastreio}}','{{link_rastreio}}'] },
  { id:'catalogo_produto', label:'Produto do Catálogo', grupo:'Catálogo',  icon:ShoppingBag, cor:'#10b981', corBg:'rgba(16,185,129,0.1)', desc:'Mensagem interativa com botões ao enviar produto do catálogo ao cliente. Edite texto e botões.', situacao:'manual', variaveis:['{{nome_produto}}','{{preco_cartao}}','{{preco_pix}}','{{foto_produto}}','{{descricao_produto}}','{{codigo_produto}}'] },
  { id:'avise_me',            label:'Produto Disponível',    grupo:'Estoque',      icon:Bell,        cor:'#fb923c', corBg:'rgba(251,146,60,0.1)',   desc:'Produto voltou ao estoque (Avise-me)',           situacao:'manual',  variaveis:['{{nome_cliente}}','{{nome_produto}}','{{preco_produto}}','{{preco_pix}}','{{link_produto}}','{{foto_produto}}'] },
  { id:'boas_vindas',         label:'Boas-vindas',           grupo:'Relacionamento',icon:Star,       cor:'#e879f9', corBg:'rgba(232,121,249,0.1)', desc:'Primeiro contato do cliente no WhatsApp',        situacao:'manual',  variaveis:['{{nome_cliente}}','{{nome_loja}}'] },
  { id:'avaliar_pedido',      label:'Avaliação Pós-venda',   grupo:'Relacionamento',icon:Star,       cor:'#f87171', corBg:'rgba(248,113,113,0.1)', desc:'Pesquisa de satisfação após entrega',            situacao:'manual',  variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  { id:'em_andamento',        label:'Em Andamento',          grupo:'Faturamento',  icon:RefreshCw,   cor:'#8b5cf6', corBg:'rgba(139,92,246,0.1)',  desc:'Expedição iniciou separação/faturamento',        situacao:'id = 15', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}'] },
  { id:'nfe_pendente',        label:'NF-e Pendente',         grupo:'Faturamento',  icon:FileText,    cor:'#f59e0b', corBg:'rgba(245,158,11,0.1)',  desc:'Nota fiscal criada, aguardando SEFAZ',           situacao:'id = 21', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}'] },
  { id:'nfe_emitida',         label:'NF-e Emitida',          grupo:'Faturamento',  icon:FileText,    cor:'#06b6d4', corBg:'rgba(6,182,212,0.1)',   desc:'NF-e autorizada — link DANFE disponível',        situacao:'id = 24', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{numero_nfe}}','{{link_nfe}}'] },
  { id:'devolucao',           label:'Devolução',             grupo:'Pós-venda',    icon:RefreshCw,   cor:'#f87171', corBg:'rgba(248,113,113,0.1)', desc:'Pedido devolvido ao remetente',                  situacao:'id = 36', variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  { id:'cancelamento',        label:'Pedido Cancelado',      grupo:'Pós-venda',    icon:XCircle,     cor:'#6b7280', corBg:'rgba(107,114,128,0.1)', desc:'Pedido cancelado no Bling',                      situacao:'id = 12', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}'] },
  { id:'em_separacao',        label:'Em Separação',          grupo:'Personalizado',icon:Layers,      cor:'#8b5cf6', corBg:'rgba(139,92,246,0.1)',  desc:'Observações Internas: #SEPARACAO',               situacao:'#SEPARACAO', variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  { id:'produto_embalado',    label:'Produto Embalado',      grupo:'Personalizado',icon:Package,     cor:'#06b6d4', corBg:'rgba(6,182,212,0.1)',   desc:'Observações Internas: #EMBALADO',                situacao:'#EMBALADO',  variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  { id:'saiu_entrega',        label:'Saiu para Entrega',     grupo:'Personalizado',icon:Truck,       cor:'#f59e0b', corBg:'rgba(245,158,11,0.1)',  desc:'Observações Internas: #SAIU',                    situacao:'#SAIU',      variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{transportadora}}','{{codigo_rastreio}}','{{link_rastreio}}'] },
  { id:'aguardando_retirada', label:'Aguardando Retirada',   grupo:'Personalizado',icon:Clock,       cor:'#a78bfa', corBg:'rgba(167,139,250,0.1)', desc:'Observações Internas: #AGUARDANDO',              situacao:'#AGUARDANDO',variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
  { id:'lembrete_rastreio',   label:'Lembrete de Rastreio',  grupo:'Personalizado',icon:Bell,        cor:'#fb923c', corBg:'rgba(251,146,60,0.1)',  desc:'Observações Internas: #RASTREIO',                situacao:'#RASTREIO',  variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{codigo_rastreio}}','{{link_rastreio}}'] },

  // ── Grupo: Ocorrências ────────────────────────────────────────────────────
  // Usado pelo sistema de CRM de ocorrências para envio via PATCH /api/ocorrencias/:id
  // O campo situacao: 'ocorrencia' identifica estes gatilhos no sistema de CRM
  { id:'ocorrencia_abertura',    label:'Confirmação de Abertura',  grupo:'Ocorrências', icon:AlertCircle,  cor:'#f59e0b', corBg:'rgba(245,158,11,0.1)',   desc:'Enviado automaticamente ao criar um chamado de ocorrência',      situacao:'ocorrencia', variaveis:['{{nome_cliente}}','{{ticket_id}}','{{tipo_ocorrencia}}','{{numero_pedido}}','{{descricao}}'] },
  { id:'ocorrencia_em_analise',  label:'Em Análise',               grupo:'Ocorrências', icon:Search,       cor:'#4a9fff', corBg:'rgba(74,159,255,0.1)',    desc:'Informa o cliente que a equipe está investigando o caso',        situacao:'ocorrencia', variaveis:['{{nome_cliente}}','{{ticket_id}}','{{descricao}}'] },
  { id:'ocorrencia_atualizada',  label:'Atualização de Status',    grupo:'Ocorrências', icon:ArrowRight,   cor:'#8b5cf6', corBg:'rgba(139,92,246,0.1)',    desc:'Mensagem estruturada de resposta ao cliente com contexto',       situacao:'ocorrencia', variaveis:['{{nome_cliente}}','{{ticket_id}}','{{descricao}}','{{resposta}}','{{status}}'] },
  { id:'ocorrencia_resolvida',   label:'Ocorrência Resolvida',     grupo:'Ocorrências', icon:CheckCircle,  cor:'#22c55e', corBg:'rgba(34,197,94,0.1)',     desc:'Confirma a resolução do chamado ao cliente',                     situacao:'ocorrencia', variaveis:['{{nome_cliente}}','{{ticket_id}}','{{numero_pedido}}'] },
  { id:'ocorrencia_troca',       label:'Troca / Devolução',        grupo:'Ocorrências', icon:RotateCcw,    cor:'#f59e0b', corBg:'rgba(245,158,11,0.1)',    desc:'Instrui o cliente sobre o processo de troca ou devolução',       situacao:'ocorrencia', variaveis:['{{nome_cliente}}','{{ticket_id}}','{{numero_pedido}}'] },
  { id:'ocorrencia_extravio',    label:'Pedido Extraviado',        grupo:'Ocorrências', icon:ShieldAlert,  cor:'#ef4444', corBg:'rgba(239,68,68,0.1)',     desc:'Informa sobre extravio e providências tomadas com a transportadora', situacao:'ocorrencia', variaveis:['{{nome_cliente}}','{{ticket_id}}','{{numero_pedido}}','{{transportadora}}'] },
  { id:'ocorrencia_encerrada',   label:'Chamado Encerrado',        grupo:'Ocorrências', icon:XCircle,      cor:'#6b7280', corBg:'rgba(107,114,128,0.1)',   desc:'Encerramento do chamado — enviado ao marcar status como encerrado',  situacao:'ocorrencia', variaveis:['{{nome_cliente}}','{{ticket_id}}','{{numero_pedido}}'] },

  // Inteligência IA
  { id:'reengajamento',     label:'Reengajamento',   grupo:'Inteligência', tipo:'ia', icon:Brain, cor:'#7c6af7', corBg:'rgba(124,106,247,0.1)', situacao:'auto-ia', desc:'Cliente inativo detectado pela Bia', variaveis:['{{nome_cliente}}','{{dias_inativo}}','{{ultimo_produto}}'] },
  { id:'recompra_vip',      label:'Ciclo VIP',        grupo:'Inteligência', tipo:'ia', icon:Brain, cor:'#7c6af7', corBg:'rgba(124,106,247,0.1)', situacao:'auto-ia', desc:'VIP no ciclo de recompra', variaveis:['{{nome_cliente}}','{{ciclo_dias}}'] },
  { id:'primeira_recompra', label:'1ª Recompra',      grupo:'Inteligência', tipo:'ia', icon:Brain, cor:'#7c6af7', corBg:'rgba(124,106,247,0.1)', situacao:'auto-ia', desc:'1ª compra sem retorno', variaveis:['{{nome_cliente}}','{{ultimo_produto}}'] },
  { id:'pos_entrega',       label:'Pós-entrega IA',   grupo:'Inteligência', tipo:'ia', icon:Brain, cor:'#7c6af7', corBg:'rgba(124,106,247,0.1)', situacao:'auto-ia', desc:'Follow-up pós-entrega', variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
]

const GRUPOS = [...new Set(GATILHOS_ESTATICOS.map(g=>g.grupo))]

const PADROES = {
  pedido_criado:      { cab:'🛒 Pedido Confirmado!',      img:'', corpo:'Olá *{{nome_cliente}}*!\n\nSeu pedido *#{{numero_pedido}}* foi criado com sucesso.\n\n💳 Total: *{{valor_total}}*\n💰 Pagamento: {{forma_pagamento}}',                           rod:'Mensagem automática — para dúvidas, responda aqui.', bts:[{texto:'Ver pedido',acao:'url',valor:'{{link_pedido}}',id:1}] },
  pagamento_aprovado: { cab:'✅ Pagamento Aprovado!',      img:'', corpo:'Olá *{{nome_cliente}}*!\n\nO pagamento do pedido *#{{numero_pedido}}* foi confirmado. 🎉\n\nJá estamos preparando com carinho!',                               rod:'Mensagem automática.', bts:[] },
  pagamento_pendente: { cab:'⏳ Pagamento Pendente',       img:'', corpo:'Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* aguarda pagamento.\n\nTotal: *{{valor_total}}*',                                                        rod:'O link expira em 24 horas.', bts:[{texto:'Pagar agora',acao:'url',valor:'{{link_pedido}}',id:1},{texto:'Preciso de ajuda',acao:'reply',valor:'Ajuda com pagamento',id:2}] },
  pedido_enviado:     { cab:'🚚 Seu pedido foi enviado!', img:'', corpo:'Olá *{{nome_cliente}}*! O pedido *#{{numero_pedido}}* saiu para entrega.\n\n📦 Transportadora: {{transportadora}}\n🔍 Rastreio: *{{codigo_rastreio}}*\n📅 Prazo: *{{prazo_entrega}}*', rod:'Continuaremos monitorando e avisaremos quando chegar.', bts:[{texto:'Rastrear pedido',acao:'url',valor:'{{link_rastreio}}',id:1}] },
  pedido_entregue:    { cab:'📦 Pedido entregue!',        img:'', corpo:'Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* foi entregue! 😊\n\nEsperamos que você goste muito!',                                                  rod:'Qualquer problema estamos à disposição.', bts:[{texto:'Avaliar ⭐⭐⭐⭐⭐',acao:'reply',valor:'Quero avaliar',id:1},{texto:'Tive um problema',acao:'reply',valor:'Preciso de ajuda',id:2}] },
  nao_entregue:       { cab:'⚠️ Tentativa de entrega',    img:'', corpo:'Olá *{{nome_cliente}}*, houve uma tentativa de entrega do pedido *#{{numero_pedido}}* que não foi concluída.\n\n🚚 {{transportadora}}\n🔍 *{{codigo_rastreio}}*', rod:'Entre em contato com a transportadora.', bts:[{texto:'Rastrear',acao:'url',valor:'{{link_rastreio}}',id:1},{texto:'Preciso de ajuda',acao:'reply',valor:'Ajuda com entrega',id:2}] },
  catalogo_produto:   {
    cab:'🛍️ Olha o que temos pra você!',
    img:'{{foto_produto}}',
    corpo:'✨ *{{nome_produto}}*\n\n{{descricao_produto}}\n\n💳 Cartão: *{{preco_cartao}}*\n💰 PIX: *{{preco_pix}}*\n\nEscolha uma opção abaixo 👇',
    rod:'Só Strass — Atendimento ao Cliente',
    bts:[
      {texto:'🛒 Adicionar ao Carrinho', acao:'reply', valor:'Adicionar ao Carrinho', id:1},
      {texto:'📸 Ver Foto',             acao:'reply', valor:'Ver Foto',               id:2},
      {texto:'💬 Tirar Dúvidas',        acao:'reply', valor:'Tirar Dúvidas',          id:3},
    ]
  },
  avise_me:           { cab:'🔔 Produto disponível!',     img:'{{foto_produto}}', corpo:'Olá *{{nome_cliente}}*!\n\n✨ *{{nome_produto}}* voltou ao estoque!\n\n💳 Cartão: *{{preco_produto}}*\n💰 PIX: *{{preco_pix}}* (10% off)', rod:'Estoque limitado — garanta o seu!', bts:[{texto:'Comprar agora',acao:'url',valor:'{{link_produto}}',id:1}] },
  boas_vindas:        { cab:'',                           img:'', corpo:'👋 Olá *{{nome_cliente}}*! Bem-vindo(a) à *{{nome_loja}}*!\n\nSou a Molise, sua assistente virtual. Estou aqui para ajudar com produtos, pedidos, rastreio e muito mais. 😊', rod:'', bts:[] },
  avaliar_pedido:     { cab:'⭐ Como foi sua experiência?',img:'', corpo:'Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* foi entregue!\n\nSua opinião nos ajuda a melhorar sempre 🙏',                                          rod:'Obrigado por comprar conosco!', bts:[{texto:'Adorei! ⭐⭐⭐⭐⭐',acao:'reply',valor:'Fiquei satisfeito',id:1},{texto:'Tive um problema',acao:'reply',valor:'Preciso de ajuda',id:2}] },
  em_andamento:       { cab:'⚙️ Pedido em processamento!',img:'', corpo:'Olá *{{nome_cliente}}*!\n\nSeu pedido *#{{numero_pedido}}* está sendo processado pela nossa expedição.\n\nEstamos iniciando separação e faturamento. Em breve você receberá a nota fiscal! 📋', rod:'Mensagem automática.', bts:[] },
  nfe_pendente:       { cab:'📋 Nota Fiscal em análise',  img:'', corpo:'Olá *{{nome_cliente}}*!\n\nA nota fiscal do pedido *#{{numero_pedido}}* foi gerada e está aguardando autorização da SEFAZ. 📄\n\nAssim que for autorizada, você receberá o link.', rod:'Processo automático — em breve.', bts:[] },
  nfe_emitida:        { cab:'📄 Nota Fiscal emitida!',    img:'', corpo:'Olá *{{nome_cliente}}*!\n\nA nota fiscal do pedido *#{{numero_pedido}}* foi emitida e autorizada.\n\n📋 NF-e: *{{numero_nfe}}*',                               rod:'Guarde para seus registros.', bts:[{texto:'Ver NF-e',acao:'url',valor:'{{link_nfe}}',id:1}] },
  devolucao:          { cab:'↩️ Pedido devolvido',         img:'', corpo:'Olá *{{nome_cliente}}*, infelizmente seu pedido *#{{numero_pedido}}* foi devolvido.\n\nEntre em contato conosco para resolvermos juntos.',                   rod:'Estamos à disposição.', bts:[{texto:'Falar com atendente',acao:'reply',valor:'Ajuda com devolução',id:1}] },
  cancelamento:       { cab:'❌ Pedido cancelado',         img:'', corpo:'Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* foi cancelado.\n\nSe tiver dúvidas ou quiser fazer um novo pedido, é só nos chamar.',               rod:'Obrigado pela compreensão.', bts:[{texto:'Falar conosco',acao:'reply',valor:'Dúvida sobre cancelamento',id:1}] },
  em_separacao:       { cab:'📋 Pedido em separação!',    img:'', corpo:'Olá *{{nome_cliente}}*!\n\nSeu pedido *#{{numero_pedido}}* está sendo separado com cuidado. Em breve será embalado e enviado! 📦',                            rod:'Mensagem automática.', bts:[] },
  produto_embalado:   { cab:'📦 Pedido embalado!',        img:'', corpo:'Olá *{{nome_cliente}}*!\n\nSeu pedido *#{{numero_pedido}}* foi embalado e está pronto para despacho. Em breve você receberá o rastreio! 🚚',                  rod:'Mensagem automática.', bts:[] },
  saiu_entrega:       { cab:'🚚 Saiu para entrega!',      img:'', corpo:'Olá *{{nome_cliente}}*!\n\nSeu pedido *#{{numero_pedido}}* saiu para entrega hoje!\n\n🔍 Rastreio: *{{codigo_rastreio}}*',                                    rod:'Continuaremos monitorando.', bts:[{texto:'Rastrear',acao:'url',valor:'{{link_rastreio}}',id:1}] },
  aguardando_retirada:{ cab:'📍 Pronto para retirada!',   img:'', corpo:'Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* está pronto para retirada!\n\nCompareça com seu documento de identidade.',                          rod:'Aguardamos sua visita.', bts:[] },
  lembrete_rastreio:  { cab:'📦 Atualização do pedido',   img:'', corpo:'Olá *{{nome_cliente}}*, atualização do pedido *#{{numero_pedido}}*:\n\n🔍 Rastreio: *{{codigo_rastreio}}*',                                                 rod:'Continuaremos monitorando.', bts:[{texto:'Rastrear agora',acao:'url',valor:'{{link_rastreio}}',id:1}] },

  // ── Ocorrências ───────────────────────────────────────────────────────────
  ocorrencia_abertura:    { cab:'✅ Chamado aberto — {{ticket_id}}',        img:'', corpo:'Olá *{{nome_cliente}}*!\n\nRecebemos sua solicitação e abrimos um chamado para acompanhamento.\n\n📋 *Protocolo:* {{ticket_id}}\n🏷️ *Assunto:* {{tipo_ocorrencia}}\n{{numero_pedido}}\n\n*Sua solicitação:*\n_{{descricao}}_\n\nNossa equipe irá analisar e retornará em breve. Guarde este protocolo.',                            rod:'Só Strass — Atendimento ao Cliente', bts:[] },
  ocorrencia_em_analise:  { cab:'🔍 Em análise — {{ticket_id}}',            img:'', corpo:'Olá *{{nome_cliente}}*!\n\nSua ocorrência *{{ticket_id}}* está sendo analisada por nossa equipe.\n\n> _{{descricao}}_\n\nEstamos investigando o caso e entraremos em contato assim que tivermos uma atualização. Isso pode levar até 48h úteis.',                                                                                          rod:'Só Strass — Atendimento ao Cliente', bts:[] },
  ocorrencia_atualizada:  { cab:'📋 Atualização — {{ticket_id}}',           img:'', corpo:'Olá *{{nome_cliente}}*!\n\n> *Sua solicitação:*\n> _{{descricao}}_\n\n*Nossa resposta:*\n{{resposta}}\n\n🏷️ Status: *{{status}}*\n📋 Protocolo: {{ticket_id}}',                                                                                                                                                                    rod:'Só Strass — Atendimento ao Cliente', bts:[] },
  ocorrencia_resolvida:   { cab:'✅ Ocorrência resolvida — {{ticket_id}}',  img:'', corpo:'Olá *{{nome_cliente}}*!\n\nFicamos felizes em informar que sua ocorrência *{{ticket_id}}* foi resolvida com sucesso.\n\n{{numero_pedido}}\n\nQualquer dúvida ou novo problema, estamos à disposição. Obrigado pela compreensão!',                                                                                                        rod:'Só Strass — Atendimento ao Cliente', bts:[{texto:'Avaliar atendimento',acao:'reply',valor:'Quero avaliar o atendimento',id:1}] },
  ocorrencia_troca:       { cab:'🔄 Troca / Devolução — {{ticket_id}}',    img:'', corpo:'Olá *{{nome_cliente}}*!\n\nSobre sua solicitação de troca/devolução *{{ticket_id}}*:\n\n📦 Pedido: *#{{numero_pedido}}*\n\nPara prosseguir, por favor nos envie:\n• Foto do produto com o problema\n• Embalagem original (se possível)\n\nAssim que recebermos, processaremos rapidamente.',                                          rod:'Só Strass — Atendimento ao Cliente', bts:[{texto:'Enviar fotos',acao:'reply',valor:'Vou enviar as fotos',id:1}] },
  ocorrencia_extravio:    { cab:'⚠️ Pedido extraviado — {{ticket_id}}',    img:'', corpo:'Olá *{{nome_cliente}}*!\n\nSobre o pedido *#{{numero_pedido}}* extraviado pela *{{transportadora}}*:\n\nJá abrimos uma acareação junto à transportadora. O prazo para retorno é de 5 dias úteis.\n\nAssim que tivermos uma resposta, você será notificado imediatamente.',                                                              rod:'Só Strass — Atendimento ao Cliente', bts:[] },
  ocorrencia_encerrada:   { cab:'🔒 Chamado encerrado — {{ticket_id}}',    img:'', corpo:'Olá *{{nome_cliente}}*!\n\nSeu chamado *{{ticket_id}}* foi encerrado.\n{{numero_pedido}}\n\nCaso o problema persista ou tenha uma nova dúvida, pode abrir um novo chamado a qualquer momento. Estamos sempre à disposição!',                                                                                                                          rod:'Só Strass — Atendimento ao Cliente', bts:[] },
}

const TIPOS_BLOCO = [
  { tipo:'cabecalho', label:'Cabeçalho', icon:Hash,        cor:'#00d4aa', desc:'Negrito no topo' },
  { tipo:'texto',     label:'Texto',     icon:FileText,     cor:'#4a9fff', desc:'Corpo da mensagem' },
  { tipo:'rodape',    label:'Rodapé',    icon:FileText,     cor:'#8696a0', desc:'Itálico no final' },
  { tipo:'imagem',    label:'Imagem',    icon:Image,        cor:'#fb923c', desc:'Foto ou produto' },
  { tipo:'video',     label:'Vídeo',     icon:Video,        cor:'#a78bfa', desc:'Link de vídeo' },
  { tipo:'audio',     label:'Áudio',     icon:Mic,          cor:'#22c55e', desc:'Link de áudio' },
  { tipo:'botao',     label:'Botão',     icon:MousePointer, cor:'#e879f9', desc:'Ação interativa' },
  { tipo:'link',      label:'Link',      icon:LinkIcon,     cor:'#f59e0b', desc:'URL clicável' },
  { tipo:'ligar',     label:'Ligar',     icon:Phone,        cor:'#f87171', desc:'Botão de chamada' },
  { tipo:'quebra',    label:'+ Mensagem',icon:Plus,         cor:'#6b7280', desc:'Nova mensagem separada' },
]

const DELAY_OPCOES = [
  { valor:0,  label:'Envio imediato' },
  { valor:5,  label:'5 minutos' },
  { valor:15, label:'15 minutos' },
  { valor:30, label:'30 minutos' },
  { valor:60, label:'1 hora' },
  { valor:120,label:'2 horas' },
  { valor:240,label:'4 horas' },
]



const AMOSTRAS = {
  '{{nome_cliente}}':'Maria Silva','{{numero_pedido}}':'224307','{{valor_total}}':'R$ 47,52',
  '{{forma_pagamento}}':'PIX','{{transportadora}}':'Jadlog','{{codigo_rastreio}}':'JD123456789BR',
  '{{link_rastreio}}':'https://rastreamento.jadlog.com.br','{{prazo_entrega}}':'3 dias úteis',
  '{{nome_produto}}':'Fio de Seda Rabo de Rato Preto','{{preco_produto}}':'R$ 11,62',
  '{{preco_pix}}':'R$ 10,46','{{link_produto}}':'https://sostrass.com.br/produto',
  '{{foto_produto}}':'https://cdn-sostrass-image.s3.sa-east-1.amazonaws.com/perola-furo-passante-creme.jpg',
  '{{nome_loja}}':'Só Strass','{{link_pedido}}':'https://sostrass.com.br/pedido/224307',
  '{{numero_nfe}}':'123456','{{link_nfe}}':'https://sostrass.com.br/nfe/123456',
}
const rv = t=>(t||'').replace(/\{\{([^}]+)\}\}/g,(_,k)=>AMOSTRAS[`{{${k}}}`]||`{{${k}}}`)



// ── Preview WhatsApp ───────────────────────────────────────────────────────────
function PreviewBolha({ blocos }) {
  const hora = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
  const msgs = [[]]
  for (const b of blocos) {
    if (b.tipo==='quebra') msgs.push([])
    else msgs[msgs.length-1].push(b)
  }
  return (
    <div className="space-y-2">
      {msgs.filter(m=>m.length>0).map((msg,mi)=>{
        const cab=msg.find(b=>b.tipo==='cabecalho'), img=msg.find(b=>b.tipo==='imagem')
        const txts=msg.filter(b=>b.tipo==='texto'), rod=msg.find(b=>b.tipo==='rodape')
        const bts=msg.filter(b=>['botao','ligar','link'].includes(b.tipo))
        if(!cab&&!img&&!txts.length&&!rod) return null
        return (
          <div key={mi}>
            {mi>0&&<div className="flex items-center gap-1 my-1"><div className="flex-1 border-t" style={{borderColor:'#2a3942'}}/><span style={{fontSize:8,color:'#8696a0'}}>msg separada</span><div className="flex-1 border-t" style={{borderColor:'#2a3942'}}/></div>}
            <div className="rounded-[12px] rounded-tl-[2px] overflow-hidden max-w-[260px]" style={{background:'#202c33'}}>
              {img?.url&&<div style={{background:'#1a2733'}}><img src={rv(img.url)} alt="" style={{width:'100%',maxHeight:120,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/></div>}
              {cab?.conteudo&&<div className="px-3 pt-2.5 pb-0.5"><p style={{fontSize:13,fontWeight:700,color:'#e9edef'}}>{rv(cab.conteudo)}</p></div>}
              {txts.map((b,i)=>(
                <div key={i} className="px-3 py-2">
                  <p style={{fontSize:12,color:'#e9edef',lineHeight:1.6,whiteSpace:'pre-wrap'}}
                    dangerouslySetInnerHTML={{__html:rv(b.conteudo||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br/>').replace(/\*([^*\n]+)\*/g,'<strong>$1</strong>').replace(/_([^_\n]+)_/g,'<em>$1</em>')}}/>
                </div>
              ))}
              {rod?.conteudo&&<div className="px-3 pb-2"><p style={{fontSize:10,color:'#8696a0',fontStyle:'italic'}}>{rv(rod.conteudo)}</p></div>}
              <div className="px-3 pb-1.5 flex justify-end"><span style={{fontSize:9,color:'#8696a0'}}>{hora} ✓✓</span></div>
              {bts.length>0&&<div style={{borderTop:'1px solid #2a3942'}}>{bts.map((b,i)=>(
                <div key={i} className="flex items-center justify-center gap-1.5 py-2" style={{borderTop:i>0?'1px solid #2a3942':'none',color:'#00a884',cursor:'pointer'}}>
                  {b.tipo==='ligar'?<Phone size={10}/>:b.tipo==='link'?<LinkIcon size={10}/>:<MousePointer size={10}/>}
                  <span style={{fontSize:12,fontWeight:500}}>{rv(b.texto||b.url||'Botão')}</span>
                </div>
              ))}</div>}
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
    <div style={{maxWidth:280,margin:'0 auto',userSelect:'none'}}>
      <div className="rounded-[20px] overflow-hidden" style={{background:'#111b21',border:'6px solid #1a252f',boxShadow:'0 20px 50px rgba(0,0,0,0.5)'}}>
        <div style={{background:'#1a252f',padding:'4px 12px'}}><div className="flex justify-between"><span style={{fontSize:9,color:'#8696a0'}}>{hora}</span><span style={{fontSize:9,color:'#8696a0'}}>●●●</span></div></div>
        <div className="flex items-center gap-2 px-3 py-2" style={{background:'#202c33'}}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white" style={{background:'#00a884',fontSize:11}}>S</div>
          <div><p style={{fontSize:12,fontWeight:700,color:'white',lineHeight:1.2}}>Só Strass</p><p style={{fontSize:9,color:'#8696a0'}}>mensagem automática</p></div>
        </div>
        <div className="p-3" style={{background:'#0b141a',minHeight:80}}>
          {vazio?(
            <div className="flex flex-col items-center py-4" style={{opacity:.3}}>
              <MessageSquare size={20} style={{color:'#8696a0'}}/><p style={{fontSize:10,color:'#8696a0',marginTop:4}}>Configure os blocos</p>
            </div>
          ):<PreviewBolha blocos={blocos}/>}
        </div>
      </div>
      {!vazio&&<p style={{fontSize:9,color:'var(--label-4)',textAlign:'center',marginTop:6}}>Preview com dados de exemplo</p>}
    </div>
  )
}

// ── Bloco individual ──────────────────────────────────────────────────────────
function Bloco({ b, idx, total, vars, onChange, onDelete, onMove, onDuplicate }) {
  const [aberto,setAberto]=useState(true)
  const def=TIPOS_BLOCO.find(t=>t.tipo===b.tipo)||TIPOS_BLOCO[0], Ic=def.icon
  const inserirVar=(v,fId)=>{
    const el=document.getElementById(fId)
    if(!el){onChange({...b,conteudo:(b.conteudo||'')+v});return}
    const s=el.selectionStart,e=el.selectionEnd
    const campo=el.tagName==='TEXTAREA'?'conteudo':'url'
    const novo=(b[campo]||'').slice(0,s)+v+(b[campo]||'').slice(e)
    onChange({...b,[campo]:novo})
    setTimeout(()=>{el.focus();el.setSelectionRange(s+v.length,s+v.length)},0)
  }
  const sty={background:'var(--bg)',border:'1px solid var(--sep)',borderRadius:9,color:'var(--label)',outline:'none',padding:'9px 12px',fontSize:13,width:'100%',fontFamily:'inherit',lineHeight:1.6}
  if(b.tipo==='quebra') return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="flex-1 border-t border-dashed" style={{borderColor:'var(--sep)'}}/>
      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{background:'var(--bg-3)',color:'var(--label-3)',border:'1px solid var(--sep)'}}><Plus size={8}/> Nova mensagem separada</div>
      <div className="flex-1 border-t border-dashed" style={{borderColor:'var(--sep)'}}/>
      <button onClick={onDelete} style={{color:'var(--label-4)'}}><X size={11}/></button>
    </div>
  )
  return (
    <div className="rounded-[12px] overflow-hidden transition-all" style={{border:`1px solid ${aberto?def.cor+'30':'var(--sep)'}`,background:'var(--bg-2)'}}>
      <div className="flex items-center gap-2 px-3 py-2" style={{background:'var(--bg-3)',borderBottom:aberto?'1px solid var(--sep)':'none'}}>
        <GripVertical size={12} style={{color:'var(--label-4)',cursor:'grab'}}/>
        <div className="w-4 h-4 rounded-[4px] flex items-center justify-center" style={{background:`${def.cor}20`}}><Ic size={10} style={{color:def.cor}}/></div>
        <span className="text-[11px] font-semibold flex-1 truncate" style={{color:'var(--label-2)'}}>
          {def.label}{b.tipo==='texto'&&b.conteudo?<span className="font-normal ml-1" style={{color:'var(--label-4)'}}> — {b.conteudo.slice(0,30).replace(/\n/g,' ')}{b.conteudo.length>30?'…':''}</span>:null}
        </span>
        <div className="flex items-center gap-0.5">
          <button onClick={()=>onMove(idx,-1)} disabled={idx===0} className="p-0.5 rounded disabled:opacity-20" style={{color:'var(--label-4)'}}><ChevronUp size={10}/></button>
          <button onClick={()=>onMove(idx,1)} disabled={idx===total-1} className="p-0.5 rounded disabled:opacity-20" style={{color:'var(--label-4)'}}><ChevronDown size={10}/></button>
          <button onClick={onDuplicate} className="p-0.5 rounded" style={{color:'var(--label-4)'}}><Copy size={10}/></button>
          <button onClick={()=>setAberto(v=>!v)} className="p-0.5 rounded" style={{color:'var(--label-4)'}}>{aberto?<ChevronUp size={10}/>:<ChevronDown size={10}/>}</button>
          <button onClick={onDelete} className="p-0.5 rounded" style={{color:'var(--label-4)'}}><X size={10}/></button>
        </div>
      </div>
      {aberto&&(
        <div className="p-3 space-y-2">
          {b.tipo==='cabecalho'&&<><input value={b.conteudo||''} onChange={e=>onChange({...b,conteudo:e.target.value})} placeholder="Emoji + título" style={sty}/><VarPills vars={vars} onInsert={v=>inserirVar(v,`bloco-${b.id}`)}/></>}
          {b.tipo==='texto'&&<><textarea id={`bloco-${b.id}`} value={b.conteudo||''} onChange={e=>onChange({...b,conteudo:e.target.value})} placeholder="Texto... Use *negrito*" rows={4} style={{...sty,resize:'none'}}/><VarPills vars={vars} onInsert={v=>inserirVar(v,`bloco-${b.id}`)}/></>}
          {b.tipo==='rodape'&&<input value={b.conteudo||''} onChange={e=>onChange({...b,conteudo:e.target.value})} placeholder="Ex: Mensagem automática — não responda." style={sty}/>}
          {b.tipo==='imagem'&&<><input value={b.url||''} onChange={e=>onChange({...b,url:e.target.value})} placeholder="URL ou {{foto_produto}}" style={{...sty,fontFamily:'monospace',fontSize:12}}/><VarPills vars={['{{foto_produto}}',...vars.filter(v=>v.includes('foto'))]} onInsert={v=>onChange({...b,url:(b.url||'')+v})}/><input value={b.legenda||''} onChange={e=>onChange({...b,legenda:e.target.value})} placeholder="Legenda (opcional)" style={{...sty,fontSize:12}}/></>}
          {b.tipo==='video'&&<input value={b.url||''} onChange={e=>onChange({...b,url:e.target.value})} placeholder="URL do vídeo" style={{...sty,fontFamily:'monospace',fontSize:12}}/>}
          {b.tipo==='audio'&&<input value={b.url||''} onChange={e=>onChange({...b,url:e.target.value})} placeholder="URL do áudio" style={{...sty,fontFamily:'monospace',fontSize:12}}/>}
          {b.tipo==='botao'&&<>
            <input value={b.texto||''} onChange={e=>onChange({...b,texto:e.target.value})} placeholder="Texto do botão (máx. 20)" maxLength={20} style={sty}/>
            <div className="grid grid-cols-3 gap-1.5">
              {[['url','🔗 Link'],['reply','💬 Resposta'],['tel','📞 Ligar']].map(([v,l])=>(
                <button key={v} onClick={()=>onChange({...b,acao:v})} className="py-1.5 rounded-[7px] text-[10px] font-medium" style={{background:b.acao===v?'var(--accent-dim)':'var(--bg)',color:b.acao===v?'var(--accent)':'var(--label-3)',border:b.acao===v?'1px solid var(--accent-border)':'1px solid var(--sep)'}}>{l}</button>
              ))}
            </div>
            {(b.acao==='url'||b.acao==='tel')&&<><input value={b.valor||''} onChange={e=>onChange({...b,valor:e.target.value})} placeholder={b.acao==='tel'?'Número':'URL'} style={{...sty,fontFamily:'monospace',fontSize:11}}/><VarPills vars={vars.filter(v=>v.includes('link'))} onInsert={v=>onChange({...b,valor:(b.valor||'')+v})}/></>}
          </>}
          {b.tipo==='link'&&<><input value={b.url||''} onChange={e=>onChange({...b,url:e.target.value})} placeholder="URL" style={{...sty,fontFamily:'monospace',fontSize:12}}/><VarPills vars={vars.filter(v=>v.includes('link'))} onInsert={v=>onChange({...b,url:(b.url||'')+v})}/></>}
          {b.tipo==='ligar'&&<><input value={b.texto||''} onChange={e=>onChange({...b,texto:e.target.value})} placeholder="Texto do botão" maxLength={20} style={sty}/><input value={b.valor||''} onChange={e=>onChange({...b,valor:e.target.value})} placeholder="Número telefone" style={{...sty,fontFamily:'monospace',fontSize:12}}/></>}
        </div>
      )}
    </div>
  )
}

function VarPills({vars,onInsert}){
  if(!vars?.length)return null
  return <div className="flex flex-wrap gap-1">{vars.map(v=><button key={v} onClick={()=>onInsert(v)} style={{padding:'2px 6px',borderRadius:4,fontSize:9,fontFamily:'monospace',background:'var(--accent-dim)',color:'var(--accent)',border:'1px solid var(--accent-border)',cursor:'pointer'}}>{v}</button>)}</div>
}

export default function PageGatilhos({ api: apiProp }) {
  const api = apiProp || BASE
  const [configs,   setConfigs]   = useState({})
  const [gatilhos,  setGatilhos]  = useState(GATILHOS_ESTATICOS)
  const [selId,     setSelId]     = useState('pedido_criado')
  const [blocos,    setBlocos]    = useState([])
  const [dirty,     setDirty]     = useState(false)
  const [salvando,  setSalvando]  = useState(false)
  const [salvoOk,   setSalvoOk]   = useState(false)
  const [gerando,   setGerando]   = useState(false)
  const [erroIA,    setErroIA]    = useState('')
  const [telTeste,  setTelTeste]  = useState('')
  const [enviandoT, setEnviandoT] = useState(false)
  const [resTeste,  setResTeste]  = useState(null)
  const [delays,    setDelays]    = useState({})
  const [modalGat,  setModalGat]  = useState(null)
  const [abaDir,     setAbaDir]    = useState('preview')
  const [submetendo, setSubmetendo]= useState(false)
  const [metaStatus, setMetaStatus]= useState('')

  const carregar = useCallback(async()=>{
    try {
      const r = await fetch(`${api}/api/templates`)
      if(!r.ok) return
      const d = await r.json()
      const map = {}
      for(const t of d.templates||[]) { if(t.gatilho) map[t.gatilho]={id:t.id,ativo:t.ativo,blocos:t.blocos||[]} }
      setConfigs(map)
      // Carrega delays
      try {
        const rd = await fetch(`${api}/api/ia/config`)
        if(rd.ok){const dd=await rd.json();const dm={};for(const[k,v] of Object.entries(dd.config||{})){if(k.startsWith('delay_'))dm[k.replace('delay_','')]=parseInt(v)||0};setDelays(dm)}
      } catch {}
    } catch {}
  },[api])

  useEffect(()=>{carregar()},[carregar])

  useEffect(()=>{
    const c=configs[selId]
    if(c?.blocos?.length){setBlocos(c.blocos.map((b,i)=>({acao:'reply',valor:'',texto:'',conteudo:'',url:'',...b,id:b.id||Date.now()+i})))}
    else{
      const p=PADROES[selId]
      if(p){const bs=[];if(p.cab)bs.push({tipo:'cabecalho',conteudo:p.cab,id:1});if(p.img)bs.push({tipo:'imagem',url:p.img,legenda:'',id:2});if(p.corpo)bs.push({tipo:'texto',conteudo:p.corpo,id:3});if(p.rod)bs.push({tipo:'rodape',conteudo:p.rod,id:4});p.bts?.forEach((b,i)=>bs.push({tipo:'botao',...b,id:10+i}));setBlocos(bs)}
      else setBlocos([{tipo:'texto',conteudo:'',id:Date.now()}])
    }
    setDirty(false);setErroIA('')
    // Carrega status Meta se existir
    const cfgMeta=configs[selId]
    if(cfgMeta?.id){
      fetch(`${api}/api/meta-templates/status/${cfgMeta.id}`)
        .then(r=>r.json())
        .then(d=>setMetaStatus(d.status||''))
        .catch(()=>{})
    } else setMetaStatus('')
  },[selId,configs])

  const addBloco=tipo=>{setBlocos(p=>[...p,{tipo,conteudo:'',url:'',texto:'',acao:'reply',valor:'',legenda:'',id:Date.now()}]);setDirty(true)}
  const delBloco=i=>{setBlocos(p=>p.filter((_,j)=>j!==i));setDirty(true)}
  const updBloco=(i,b)=>{setBlocos(p=>p.map((x,j)=>j===i?b:x));setDirty(true)}
  const moveBloco=(i,d)=>{const t=i+d;if(t<0||t>=blocos.length)return;const a=[...blocos];[a[i],a[t]]=[a[t],a[i]];setBlocos(a);setDirty(true)}
  const dupBloco=i=>{const cl={...blocos[i],id:Date.now()};const a=[...blocos];a.splice(i+1,0,cl);setBlocos(a);setDirty(true)}

  const toggleAtivo=async gId=>{
    const c=configs[gId];if(!c)return
    const novo=!c.ativo
    setConfigs(p=>({...p,[gId]:{...c,ativo:novo}}))
    await fetch(`${api}/api/templates/${c.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ativo:novo})}).catch(()=>{})
  }

  const salvarDelay=async(gId,min)=>{
    setDelays(p=>({...p,[gId]:min}))
    await fetch(`${api}/api/ia/config`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chave:`delay_${gId}`,valor:String(min)})}).catch(()=>{})
  }

  const salvar=async()=>{
    if(!selId||!dirty)return;setSalvando(true)
    try {
      const c=configs[selId],g=gatilhos.find(x=>x.id===selId)
      await fetch(c?`${api}/api/templates/${c.id}`:`${api}/api/templates`,{
        method:c?'PATCH':'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({gatilho:selId,nome:g?.label||selId,blocos,ativo:c?.ativo??true})
      })
      setSalvoOk(true);setDirty(false);await carregar()
      setTimeout(()=>setSalvoOk(false),2500)
    } catch {}
    setSalvando(false)
  }

  const submeterMeta=async(templateId)=>{
    setSubmetendo(true)
    try {
      const r=await fetch(`${api}/api/meta-templates/submeter/${templateId}`,{method:'POST'})
      const d=await r.json()
      if(d.ok){setMetaStatus(d.status);alert(`✅ ${d.mensagem}`)}
      else alert(`❌ Erro: ${d.erro}${d.dica?'\n\nDica: '+d.dica:''}`)
    } catch(e){alert('Erro ao conectar com o servidor')}
    setSubmetendo(false)
  }

  const gerarIA=async()=>{
    const g=gatilhos.find(x=>x.id===selId);if(!g)return
    setGerando(true);setErroIA('')
    try {
      const r=await fetch(`${api}/api/templates/gerar`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:g.label,gatilho:g.id,descricao:g.desc})})
      const txt=await r.text()
      if(!r.ok)throw new Error(`HTTP ${r.status}`)
      const d=JSON.parse(txt)
      if(d.blocos){setBlocos(d.blocos.map((b,i)=>({...b,id:Date.now()+i})));setDirty(true)}
      else if(d.erro)throw new Error(d.erro)
    } catch(e){setErroIA(e.message||'Erro desconhecido')}
    setGerando(false)
  }

  const testar=async()=>{
    if(!telTeste.trim())return;setEnviandoT(true);setResTeste(null)
    try {
      // Usa disparar-gatilho com dados de exemplo — mesmo fluxo do disparo real
      const tel=telTeste.replace(/\D/g,'')
      const r=await fetch(`${api}/api/templates/disparar-gatilho`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({gatilho:selId,telefone:tel,variaveis:AMOSTRAS})
      })
      const d=await r.json()
      setResTeste(d.ok||r.ok?'ok':d.erro||'erro')
    } catch(e){setResTeste(e.message||'erro')}
    setEnviandoT(false);setTimeout(()=>setResTeste(null),5000)
  }

  const gatilho = gatilhos.find(g=>g.id===selId)
  const config  = configs[selId]
  const isPersonalizado = gatilho?.grupo === 'Personalizado'

  return (
    <div className="h-full flex overflow-hidden" style={{background:'var(--bg)'}}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div className="w-[230px] flex-shrink-0 flex flex-col overflow-hidden"
        style={{background:'var(--bg-2)',borderRight:'1px solid var(--sep)'}}>
        {/* Header sidebar */}
        <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{borderBottom:'1px solid var(--sep)'}}>
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-[7px] flex items-center justify-center" style={{background:'var(--accent-dim)'}}>
                <Zap size={12} style={{color:'var(--accent)'}}/>
              </div>
              <span className="text-[15px] font-bold" style={{color:'var(--label)'}}>Gatilhos</span>
            </div>
            <button onClick={()=>setModalGat({mode:'novo'})}
              className="w-6 h-6 rounded-[7px] flex items-center justify-center"
              style={{background:'var(--accent)',color:'#000'}} title="Novo gatilho personalizado">
              <Plus size={11}/>
            </button>
          </div>
          <p className="text-[10px]" style={{color:'var(--label-4)'}}>
            {Object.values(configs).filter(c=>c.ativo).length} ativos · {gatilhos.length} disponíveis
          </p>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto py-1">
          {GRUPOS.map(grupo=>(
            <div key={grupo}>
              <p className="px-4 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest" style={{color:'var(--label-4)'}}>{grupo}</p>
              {gatilhos.filter(g=>g.grupo===grupo).map(g=>{
                const c=configs[g.id], sel=selId===g.id, Ic=g.icon
                return (
                  <div key={g.id} className="flex items-center pl-2 pr-1 transition-all"
                    style={{background:sel?`${g.cor}10`:'transparent',borderRight:sel?`2.5px solid ${g.cor}`:'2.5px solid transparent'}}>
                    <button onClick={()=>setSelId(g.id)} className="flex-1 flex items-center gap-2 px-2 py-2 text-left min-w-0">
                      <div className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
                        style={{background:sel?g.corBg:'var(--fill)',border:`1px solid ${sel?g.cor+'60':'var(--sep)'}`}}>
                        <Ic size={13} style={{color:sel?g.cor:'var(--label-3)'}}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold truncate" style={{color:sel?g.cor:'var(--label)'}}>{g.label}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full${c?.ativo?' animate-pulse':''}`}
                            style={{background:c?(c.ativo?'#22c55e':'var(--label-4)'):'var(--sep)'}}/>
                          <span className="text-[9px]" style={{color:'var(--label-4)'}}>
                            {c?(c.ativo?'Ativo':'Inativo'):'Não configurado'}
                          </span>
                        </div>
                      </div>
                    </button>
                    {/* Toggle inline */}
                    {c&&(
                      <button onClick={()=>toggleAtivo(g.id)}
                        className="p-1 rounded-[6px] flex-shrink-0"
                        style={{color:c.ativo?'#22c55e':'var(--label-4)',background:c.ativo?'rgba(34,197,94,0.08)':'transparent'}}>
                        {c.ativo?<ToggleRight size={16} strokeWidth={2}/>:<ToggleLeft size={16} strokeWidth={1.5}/>}
                      </button>
                    )}
                    {isPersonalizado&&g.grupo==='Personalizado'&&(
                      <button onClick={e=>{e.stopPropagation();setModalGat({mode:'editar',gatilho:g})}}
                        className="p-1 rounded-[6px] flex-shrink-0" style={{color:'var(--label-4)'}}>
                        <Edit3 size={10}/>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Área principal ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Header premium ───────────────────────────────────── */}
        {gatilho&&(
          <div className="flex-shrink-0" style={{borderBottom:'1px solid var(--sep)'}}>
            {/* Linha superior: identidade + ações */}
            <div className="flex items-center gap-4 px-5 py-3"
              style={{background:'var(--bg-2)'}}>
              <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                style={{background:gatilho.corBg,border:`1.5px solid ${gatilho.cor}40`}}>
                <gatilho.icon size={18} style={{color:gatilho.cor}}/>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold leading-tight" style={{color:'var(--label)'}}>{gatilho.label}</h3>
                <p className="text-[11px] truncate" style={{color:'var(--label-3)'}}>{gatilho.desc}</p>
              </div>

              {/* Ações principais */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* TOGGLE ATIVO/INATIVO — destaque */}
                <button onClick={()=>config&&toggleAtivo(selId)}
                  className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-semibold transition-all"
                  style={{
                    background: config?.ativo ? 'rgba(34,197,94,0.12)' : config ? 'var(--fill)' : 'var(--fill)',
                    color:      config?.ativo ? '#22c55e'               : 'var(--label-3)',
                    border:     config?.ativo ? '1px solid rgba(34,197,94,0.35)' : '1px solid var(--sep)',
                    opacity:    config ? 1 : 0.4,
                  }}>
                  {config?.ativo
                    ? <><ToggleRight size={16} strokeWidth={2}/> Ativo</>
                    : <><ToggleLeft size={16} strokeWidth={1.5}/> {config ? 'Inativo' : 'Não salvo'}</>
                  }
                </button>

                {/* Salvar */}
                <button onClick={salvar} disabled={salvando||!dirty}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[12px] font-semibold transition-all"
                  style={{background:salvoOk?'#22c55e':dirty?'var(--accent)':'var(--fill)',color:dirty?'#000':'var(--label-4)',opacity:dirty?1:0.45}}>
                  {salvando?<RefreshCw size={12} className="animate-spin"/>:salvoOk?<CheckCircle size={12}/>:<Save size={12}/>}
                  {salvoOk?'Salvo!':'Salvar'}
                </button>
                {/* Enviar para Meta */}
                {config&&!dirty&&(
                  <button onClick={()=>submeterMeta(config.id)}
                    disabled={submetendo}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[11px] font-semibold transition-all"
                    title="Submeter template para aprovação da Meta WhatsApp Business"
                    style={{
                      background: metaStatus==='APPROVED'?'rgba(34,197,94,0.1)':metaStatus==='PENDING'?'rgba(245,158,11,0.1)':'var(--bg-3)',
                      color:      metaStatus==='APPROVED'?'#22c55e':metaStatus==='PENDING'?'#f59e0b':'var(--label-3)',
                      border:     metaStatus==='APPROVED'?'1px solid rgba(34,197,94,0.3)':metaStatus==='PENDING'?'1px solid rgba(245,158,11,0.3)':'1px solid var(--sep)',
                    }}>
                    {submetendo?<RefreshCw size={11} className="animate-spin"/>:
                     metaStatus==='APPROVED'?<CheckCircle size={11}/>:
                     metaStatus==='PENDING'?<Clock size={11}/>:
                     <SendIcon size={11}/>}
                    {submetendo?'Enviando...':
                     metaStatus==='APPROVED'?'Meta ✓':
                     metaStatus==='PENDING'?'Aguardando':'Enviar p/ Meta'}
                  </button>
                )}
              </div>
            </div>

            {/* Linha info: como é ativado + chip de ativação */}
            <div className="flex items-center gap-3 px-5 py-2"
              style={{background:'var(--bg-3)',borderTop:'1px solid var(--sep)'}}>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{background:gatilho.cor}}/>
                <span className="text-[10px] font-semibold" style={{color:'var(--label-3)'}}>Ativação:</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold"
                  style={{background:`${gatilho.cor}18`,color:gatilho.cor,border:`1px solid ${gatilho.cor}30`}}>
                  {gatilho.situacao?.startsWith('#') ? `Obs. Internas: ${gatilho.situacao}` : `Bling situacao.${gatilho.situacao}`}
                </span>
              </div>
              {delays[selId]>0&&(
                <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                  style={{background:'rgba(245,158,11,0.1)',color:'#f59e0b',border:'1px solid rgba(245,158,11,0.2)'}}>
                  <Timer size={9}/> {DELAY_OPCOES.find(d=>d.valor===delays[selId])?.label}
                </div>
              )}
              {/* Abas do painel direito */}
              <div className="ml-auto flex gap-0.5">
                {[['preview','👁 Preview'],['config','⚙️ Config'],['ajuda','📖 Ajuda']].map(([id,lb])=>(
                  <button key={id} onClick={()=>setAbaDir(id)}
                    className="px-3 py-1 rounded-[7px] text-[10px] font-medium transition-all"
                    style={{background:abaDir===id?'var(--bg)':'transparent',color:abaDir===id?'var(--label)':'var(--label-4)',boxShadow:abaDir===id?'0 1px 3px rgba(0,0,0,0.1)':undefined}}>
                    {lb}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Corpo ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex">

          {/* Editor */}
          <div className="flex-1 overflow-y-auto" style={{borderRight:'1px solid var(--sep)'}}>
            <div className="max-w-[580px] mx-auto p-5 space-y-3">
              {/* Gerar IA */}
              <button onClick={gerarIA} disabled={gerando}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[11px] text-[13px] font-semibold transition-all"
                style={{background:'var(--accent-dim)',color:'var(--accent)',border:'1px solid var(--accent-border)'}}>
                {gerando?<RefreshCw size={13} className="animate-spin"/>:<Sparkles size={13}/>}
                {gerando?'Gerando com IA...':'✨ Gerar mensagem com IA'}
              </button>
              {erroIA&&(
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-[10px] text-[11px]"
                  style={{background:'rgba(239,68,68,0.08)',color:'var(--red)',border:'1px solid rgba(239,68,68,0.2)'}}>
                  <AlertCircle size={12} className="flex-shrink-0 mt-0.5"/><span>{erroIA}</span>
                </div>
              )}
              {/* Blocos */}
              <div className="space-y-2">
                {blocos.map((b,i)=>(
                  <Bloco key={b.id||i} b={b} idx={i} total={blocos.length}
                    vars={gatilho?.variaveis||[]}
                    onChange={nb=>updBloco(i,nb)} onDelete={()=>delBloco(i)}
                    onMove={moveBloco} onDuplicate={()=>dupBloco(i)}/>
                ))}
              </div>
              {/* Paleta */}
              <div className="rounded-[12px] overflow-hidden" style={{border:'1px solid var(--sep)',background:'var(--bg-2)'}}>
                <div className="px-4 py-2" style={{borderBottom:'1px solid var(--sep)',background:'var(--bg-3)'}}>
                  <p className="text-[10px] font-semibold" style={{color:'var(--label-3)'}}>Adicionar bloco</p>
                </div>
                <div className="p-2.5 grid grid-cols-5 gap-1.5">
                  {TIPOS_BLOCO.map(t=>{const Ic=t.icon;return(
                    <button key={t.tipo} onClick={()=>addBloco(t.tipo)}
                      className="flex flex-col items-center gap-1 py-2 rounded-[8px] text-[9px] font-semibold transition-all group"
                      style={{background:'var(--bg-3)',border:'1px solid var(--sep)',color:'var(--label-3)'}} title={t.desc}>
                      <div className="w-5 h-5 rounded-[6px] flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{background:`${t.cor}20`}}><Ic size={11} style={{color:t.cor}}/></div>
                      {t.label}
                    </button>
                  )})}
                </div>
              </div>
              {/* Testar */}
              <div className="rounded-[12px] p-3.5 space-y-2.5" style={{background:'var(--bg-2)',border:'1px solid var(--sep)'}}>
                <p className="text-[11px] font-semibold" style={{color:'var(--label-2)'}}>Testar envio</p>
                <div className="flex gap-2">
                  <input value={telTeste} onChange={e=>setTelTeste(e.target.value)} placeholder="5511999999999"
                    className="flex-1 px-3 py-2 rounded-[8px] text-[12px] outline-none"
                    style={{background:'var(--bg-3)',border:'1px solid var(--sep)',color:'var(--label)'}}/>
                  <button onClick={testar} disabled={enviandoT||!telTeste.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[12px] font-semibold"
                    style={{background:'var(--blue)',color:'#fff',opacity:!telTeste.trim()?0.5:1}}>
                    {enviandoT?<RefreshCw size={11} className="animate-spin"/>:<Send size={11}/>}
                    Testar
                  </button>
                </div>
                {resTeste&&<p className="text-[11px] font-medium" style={{color:resTeste==='ok'?'#22c55e':'var(--red)'}}>{resTeste==='ok'?'✓ Enviado!':'✗ Erro'}</p>}
              </div>
            </div>
          </div>

          {/* Painel direito com abas */}
          <div className="w-[290px] flex-shrink-0 flex flex-col overflow-hidden">

            {/* ABA PREVIEW */}
            {abaDir==='preview'&&(
              <div className="flex-1 overflow-y-auto p-4 flex items-start justify-center" style={{background:'var(--bg-3)'}}>
                <PreviewWA blocos={blocos} label={gatilho?.label}/>
              </div>
            )}

            {/* ABA CONFIG */}
            {abaDir==='config'&&(
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Toggle ativo */}
                <div className="rounded-[12px] overflow-hidden" style={{border:'1px solid var(--sep)'}}>
                  <div className="px-4 py-3 flex items-center justify-between"
                    style={{background:'var(--bg-3)',borderBottom:'1px solid var(--sep)'}}>
                    <div>
                      <p className="text-[12px] font-semibold" style={{color:'var(--label)'}}>Status do gatilho</p>
                      <p className="text-[10px]" style={{color:'var(--label-3)'}}>Ativa ou desativa o envio automático</p>
                    </div>
                    <button onClick={()=>config&&toggleAtivo(selId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-semibold"
                      style={{background:config?.ativo?'rgba(34,197,94,0.1)':'var(--fill)',color:config?.ativo?'#22c55e':'var(--label-3)',border:config?.ativo?'1px solid rgba(34,197,94,0.3)':'1px solid var(--sep)',opacity:config?1:0.4}}>
                      {config?.ativo?<ToggleRight size={14} strokeWidth={2}/>:<ToggleLeft size={14}/>}
                      {config?.ativo?'Ativo':'Inativo'}
                    </button>
                  </div>
                  <div className="p-3" style={{background:'var(--bg-2)'}}>
                    <p className="text-[10px]" style={{color:'var(--label-3)'}}>
                      {config?.ativo
                        ? '🟢 Este gatilho está enviando mensagens automaticamente quando o evento ocorre.'
                        : config ? '⚪ Este gatilho está salvo mas não está enviando mensagens.'
                        : '⚫ Este gatilho ainda não foi configurado. Salve primeiro.'}
                    </p>
                  </div>
                </div>

                {/* Delay */}
                <div className="rounded-[12px] overflow-hidden" style={{border:'1px solid var(--sep)'}}>
                  <div className="px-4 py-2.5" style={{background:'var(--bg-3)',borderBottom:'1px solid var(--sep)'}}>
                    <p className="text-[12px] font-semibold" style={{color:'var(--label)'}}>⏱ Delay de envio</p>
                    <p className="text-[10px]" style={{color:'var(--label-3)'}}>Tempo de espera após o evento antes de enviar</p>
                  </div>
                  <div className="p-3 space-y-2" style={{background:'var(--bg-2)'}}>
                    <select value={delays[selId]||0} onChange={e=>salvarDelay(selId,parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-[9px] text-[12px] outline-none"
                      style={{background:'var(--bg)',border:'1px solid var(--sep)',color:'var(--label)'}}>
                      {DELAY_OPCOES.map(d=><option key={d.valor} value={d.valor}>{d.label}</option>)}
                    </select>
                    {delays[selId]>0&&<p className="text-[10px]" style={{color:'#f59e0b'}}>⏳ Mensagem será enviada {DELAY_OPCOES.find(d=>d.valor===delays[selId])?.label} após o evento</p>}
                  </div>
                </div>

                {/* Ativação */}
                <div className="rounded-[12px] overflow-hidden" style={{border:'1px solid var(--sep)'}}>
                  <div className="px-4 py-2.5" style={{background:'var(--bg-3)',borderBottom:'1px solid var(--sep)'}}>
                    <p className="text-[12px] font-semibold" style={{color:'var(--label)'}}>🔗 Como é ativado</p>
                  </div>
                  <div className="p-3 space-y-2" style={{background:'var(--bg-2)'}}>
                    <div className="px-3 py-2 rounded-[8px] font-mono text-[11px]" style={{background:'var(--bg)',color:'var(--accent)',border:'1px solid var(--accent-border)'}}>
                      {gatilho?.situacao?.startsWith('#')
                        ? `Obs. Internas: ${gatilho.situacao}`
                        : `Bling situacao.${gatilho?.situacao}`}
                    </div>
                    {gatilho?.situacao?.startsWith('#')&&(
                      <p className="text-[10px]" style={{color:'var(--label-3)'}}>
                        No Bling, abra o pedido → campo <strong>Observações Internas</strong> → digite <strong style={{color:'var(--accent)'}}>{gatilho.situacao}</strong> e salve.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ABA AJUDA */}
            {abaDir==='ajuda'&&gatilho&&(
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="rounded-[12px] p-4 space-y-3" style={{background:'var(--bg-3)',border:'1px solid var(--sep)'}}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{background:gatilho.corBg}}>
                      <gatilho.icon size={15} style={{color:gatilho.cor}}/>
                    </div>
                    <div>
                      <p className="text-[13px] font-bold" style={{color:'var(--label)'}}>{gatilho.label}</p>
                      <p className="text-[10px]" style={{color:'var(--label-3)'}}>{gatilho.desc}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[12px] overflow-hidden" style={{border:'1px solid var(--sep)'}}>
                  <div className="px-4 py-2.5" style={{background:'var(--bg-3)',borderBottom:'1px solid var(--sep)'}}>
                    <p className="text-[11px] font-semibold" style={{color:'var(--label-2)'}}>📝 Variáveis disponíveis</p>
                  </div>
                  <div className="p-3 space-y-1" style={{background:'var(--bg-2)'}}>
                    {(gatilho.variaveis||[]).map(v=>(
                      <div key={v} className="flex items-center justify-between px-2 py-1.5 rounded-[7px]"
                        style={{background:'var(--bg)'}}>
                        <code className="text-[10px]" style={{color:'var(--accent)'}}>{v}</code>
                        <button onClick={()=>navigator.clipboard?.writeText(v)}
                          className="text-[9px] px-1.5 py-0.5 rounded" style={{color:'var(--label-4)'}}>
                          copiar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[12px] overflow-hidden" style={{border:'1px solid var(--sep)'}}>
                  <div className="px-4 py-2.5" style={{background:'var(--bg-3)',borderBottom:'1px solid var(--sep)'}}>
                    <p className="text-[11px] font-semibold" style={{color:'var(--label-2)'}}>💡 Dicas de uso</p>
                  </div>
                  <div className="p-3 space-y-2 text-[10px]" style={{background:'var(--bg-2)',color:'var(--label-3)'}}>
                    <p>• Use <code style={{color:'var(--accent)'}}>*texto*</code> para <strong>negrito</strong></p>
                    <p>• Use <code style={{color:'var(--accent)'}}>_texto_</code> para <em>itálico</em></p>
                    <p>• Clique em qualquer variável no editor para inserir</p>
                    <p>• Use blocos separados por <strong>+ Mensagem</strong> para enviar múltiplas bolhas</p>
                    {gatilho.situacao?.startsWith('#')&&(
                      <div className="mt-2 p-2 rounded-[8px]" style={{background:'var(--bg)',border:'1px solid var(--sep)'}}>
                        <p className="font-semibold mb-1" style={{color:'var(--label-2)'}}>Como usar strings:</p>
                        <p>No Bling, abra o pedido → <strong>Observações Internas</strong> → cole <code style={{color:'var(--accent)'}}>{gatilho.situacao}</code> → salve. O webhook detecta e dispara esta mensagem.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal CRUD gatilho personalizado ─────────────────────── */}
      {modalGat&&(
        <ModalGatilho modo={modalGat.mode} existente={modalGat.gatilho} api={api}
          onClose={()=>setModalGat(null)}
          onSave={g=>{setModalGat(null);if(g?.id)setSelId(g.id)}}/>
      )}
    </div>
  )
}

function ModalGatilho({modo,existente,api,onClose,onSave}){
  const [form,setForm]=useState({id:existente?.id||'',label:existente?.label||'',string:existente?.situacao||'',desc:existente?.desc||''})
  const [salvando,setSalvando]=useState(false),[erro,setErro]=useState('')
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  const salvar=async()=>{
    if(!form.label.trim()){setErro('Nome obrigatório');return}
    setSalvando(true)
    try {
      const id=form.id||form.label.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'')
      await fetch(`${api}/api/templates`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({gatilho:id,nome:form.label,blocos:[{tipo:'texto',conteudo:'',id:1}],ativo:false})})
      onSave({id,label:form.label})
    } catch(e){setErro(e.message)}
    setSalvando(false)
  }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div className="w-full max-w-[380px] rounded-[18px] overflow-hidden" style={{background:'var(--bg-2)',border:'1px solid var(--sep)'}}>
        <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:'1px solid var(--sep)',background:'var(--bg-3)'}}>
          <h3 className="text-[14px] font-bold" style={{color:'var(--label)'}}>{modo==='novo'?'Novo gatilho personalizado':'Editar gatilho'}</h3>
          <button onClick={onClose} style={{color:'var(--label-3)'}}><X size={15}/></button>
        </div>
        <div className="p-5 space-y-3">
          {[['label','Nome *','Ex: Produto em Trânsito',false],['string','String de ativação','Ex: #TRANSITO — cole nas Obs. Internas',true],['desc','Descrição','Para que serve este gatilho?',false]].map(([k,lb,ph,mono])=>(
            <div key={k}>
              <label className="text-[11px] font-medium block mb-1" style={{color:'var(--label-2)'}}>{lb}</label>
              <input value={form[k]} onChange={e=>set(k,mono?e.target.value.toUpperCase():e.target.value)}
                placeholder={ph} className="w-full px-3 py-2.5 rounded-[9px] text-[12px] outline-none"
                style={{background:'var(--bg)',border:'1px solid var(--sep)',color:mono?'var(--accent)':'var(--label)',fontFamily:mono?'monospace':'inherit'}}/>
            </div>
          ))}
          {erro&&<p className="text-[11px]" style={{color:'var(--red)'}}>{erro}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-[10px] text-[12px]" style={{background:'var(--fill)',color:'var(--label-2)'}}>Cancelar</button>
            <button onClick={salvar} disabled={salvando||!form.label.trim()} className="flex-1 py-2.5 rounded-[10px] text-[12px] font-semibold" style={{background:'var(--accent)',color:'#000',opacity:!form.label.trim()?0.5:1}}>
              {salvando?'Salvando...':'Criar gatilho'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
