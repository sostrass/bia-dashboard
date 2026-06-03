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
  ArrowRight, SlidersHorizontal, Tag, Repeat, Activity,
  GripVertical, Timer, Edit3, Send as SendIcon
} from 'lucide-react'

// ── Constantes ────────────────────────────────────────────────────────────────
const R   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmt = n => Number(n||0).toLocaleString('pt-BR')

// Grupos e gatilhos
const GATILHOS = [
  // ── 1. Compra & Pagamento ──────────────────────────────────────────────
  { id:'pedido_criado',       label:'Pedido Criado',         grupo:'Compra & Pagamento', tipo:'bling', icon:ShoppingBag, cor:'#00d4aa', situacao:'manual',  desc:'Pedido recém-criado (use Pagamento Pendente para o status Aberto)', variaveis:['{{qtde_item_pedido}}','{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{valor_total}}','{{forma_pagamento}}','{{link_pedido}}','{{lista_itens_pedido}}','{{itens_linha_unica}}','{{endereco_entrega}}','{{endereco_faturamento}}'] },
  { id:'pagamento_aprovado',  label:'Pagamento Aprovado',    grupo:'Compra & Pagamento', tipo:'bling', icon:CreditCard,  cor:'#4a9fff', situacao:'sit=15',  desc:'Pedido em Em Andamento (pagamento confirmado)', variaveis:['{{qtde_item_pedido}}','{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{valor_total}}','{{forma_pagamento}}','{{lista_itens_pedido}}','{{itens_linha_unica}}','{{link_pedido}}'] },
  { id:'pagamento_pendente',  label:'Pagamento Pendente',    grupo:'Compra & Pagamento', tipo:'bling', icon:Clock,       cor:'#f59e0b', situacao:'sit=6',   desc:'Pedido em Aberto (aguardando pagamento)', variaveis:['{{qtde_item_pedido}}','{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{valor_total}}','{{link_pedido}}','{{lista_itens_pedido}}','{{itens_linha_unica}}'] },

  // ── 2. Preparação & Nota ───────────────────────────────────────────────
  { id:'em_separacao',        label:'Em Separação',          grupo:'Preparação & Nota', tipo:'bling', icon:Layers,      cor:'#8b5cf6', situacao:'sit=9', desc:'Pedido em Atendido (separação/embalagem) — automático', variaveis:['{{qtde_item_pedido}}','{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{lista_itens_pedido}}','{{itens_linha_unica}}'] },
  { id:'produto_embalado',    label:'Produto Embalado',      grupo:'Preparação & Nota', tipo:'bling', icon:Package,     cor:'#06b6d4', situacao:'#EMBALADO',  manual:true, desc:'Comando manual no Bling: #EMBALADO', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}'] },
  { id:'em_andamento',        label:'Em Andamento',          grupo:'Preparação & Nota', tipo:'bling', icon:RefreshCw,   cor:'#8b5cf6', situacao:'manual',  desc:'Informativo/manual (o status Em Andamento dispara Pagamento Aprovado)', variaveis:['{{qtde_item_pedido}}','{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{valor_total}}','{{lista_itens_pedido}}','{{itens_linha_unica}}'] },
  { id:'nfe_pendente',        label:'NF-e Pendente',         grupo:'Preparação & Nota', tipo:'bling', icon:FileText,    cor:'#f59e0b', situacao:'nfe=1',   desc:'Nota emitida, aguardando autorização da SEFAZ', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{valor_total}}'] },
  { id:'nfe_rejeitada',       label:'NF-e Rejeitada',        grupo:'Preparação & Nota', tipo:'bling', icon:AlertTriangle, cor:'#ef4444', situacao:'nfe=4',   desc:'Nota rejeitada pela SEFAZ (uso interno/aviso)', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}'] },
  { id:'nfe_emitida',         label:'NF-e Emitida',          grupo:'Preparação & Nota', tipo:'bling', icon:FileText,    cor:'#06b6d4', situacao:'nfe=5',   desc:'Nota autorizada pela SEFAZ — DANFE disponível', variaveis:['{{qtde_item_pedido}}','{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{numero_nfe}}','{{link_nfe}}','{{lista_itens_pedido}}','{{itens_linha_unica}}'] },

  // ── 3. Envio & Rastreio (jornada física do pacote) ─────────────────────
  { id:'pedido_enviado',      label:'Pedido Enviado',        grupo:'Envio & Rastreio', tipo:'bling', icon:Truck,       cor:'#a78bfa', situacao:'sit=27',  desc:'Despachado com código de rastreio', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{transportadora}}','{{codigo_rastreio}}','{{link_rastreio}}','{{link_acompanhamento}}','{{previsao_entrega}}','{{endereco_entrega}}'] },
  { id:'pedido_coletado',     label:'Pedido Coletado',       grupo:'Envio & Rastreio', tipo:'bling', icon:Package,     cor:'#06b6d4', situacao:'auto',    desc:'Transportadora coletou o pacote', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{transportadora}}','{{codigo_rastreio}}','{{previsao_entrega}}','{{historico_rastreio}}','{{link_acompanhamento}}'] },
  { id:'rastreio_em_transito',label:'Em Trânsito',           grupo:'Envio & Rastreio', tipo:'bling', icon:Radio,       cor:'#4a9fff', situacao:'auto',    desc:'Pacote em movimentação entre bases', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{transportadora}}','{{codigo_rastreio}}','{{status_rastreio}}','{{previsao_entrega}}','{{historico_rastreio}}','{{historico_rastreio_citar}}','{{link_acompanhamento}}'] },
  { id:'saiu_entrega',        label:'Saiu para Entrega',     grupo:'Envio & Rastreio', tipo:'bling', icon:Truck,       cor:'#f59e0b', situacao:'auto / #SAIU', hibrido:true, desc:'Detectado pelo rastreio ou comando #SAIU', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{transportadora}}','{{codigo_rastreio}}','{{link_rastreio}}','{{previsao_entrega}}','{{endereco_entrega}}','{{historico_rastreio}}','{{link_acompanhamento}}'] },
  { id:'tentativa_entrega',   label:'Tentativa de Entrega',  grupo:'Envio & Rastreio', tipo:'bling', icon:AlertTriangle,cor:'#f59e0b', situacao:'auto',   desc:'Destinatário ausente — vai tentar de novo', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{codigo_rastreio}}','{{previsao_entrega}}','{{link_acompanhamento}}'] },
  { id:'aguardando_retirada', label:'Aguardando Retirada',   grupo:'Envio & Rastreio', tipo:'bling', icon:Clock,       cor:'#0ea5e9', situacao:'auto / #AGUARDANDO', hibrido:true, desc:'Detectado pelo rastreio ou comando #AGUARDANDO', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{codigo_rastreio}}'] },
  { id:'endereco_incorreto',  label:'Endereço Incorreto',    grupo:'Envio & Rastreio', tipo:'bling', icon:AlertCircle, cor:'#ef4444', situacao:'auto',    desc:'Endereço com problema — precisa revisar', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{codigo_rastreio}}','{{endereco_entrega}}','{{link_acompanhamento}}'] },
  { id:'nao_entrou_unidade',  label:'Não Entrou na Unidade', grupo:'Envio & Rastreio', tipo:'bling', icon:AlertTriangle,cor:'#dc2626', situacao:'auto',   desc:'Objeto não chegou na unidade de destino (Jadlog)', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{codigo_rastreio}}','{{transportadora}}','{{status_rastreio}}','{{link_acompanhamento}}'] },
  { id:'pedido_entregue',     label:'Pedido Entregue',       grupo:'Envio & Rastreio', tipo:'bling', icon:Package,     cor:'#22c55e', situacao:'sit=30 / auto',  desc:'Entrega confirmada', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{transportadora}}','{{historico_rastreio}}','{{historico_rastreio_citar}}','{{link_acompanhamento}}'] },
  { id:'nao_entregue',        label:'Não Entregue',          grupo:'Envio & Rastreio', tipo:'bling', icon:AlertCircle, cor:'#ef4444', situacao:'sit=33',  desc:'Tentativa de entrega falhou', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{codigo_rastreio}}','{{link_rastreio}}','{{link_acompanhamento}}'] },
  { id:'pacote_devolvido',    label:'Pacote Devolvido',      grupo:'Envio & Rastreio', tipo:'bling', icon:RefreshCw,   cor:'#f87171', situacao:'auto',    desc:'Pacote retornou ao remetente', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{codigo_rastreio}}','{{link_acompanhamento}}'] },

  // ── 4. Pós-venda ───────────────────────────────────────────────────────
  { id:'cancelamento',        label:'Pedido Cancelado',      grupo:'Pós-venda',     tipo:'bling', icon:XCircle,     cor:'#6b7280', situacao:'sit=12',  desc:'Pedido cancelado', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{valor_total}}','{{forma_pagamento}}'] },
  { id:'devolucao',           label:'Devolução',             grupo:'Pós-venda',     tipo:'bling', icon:RefreshCw,   cor:'#f87171', situacao:'sit=36',  desc:'Pedido devolvido', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{valor_total}}'] },
  { id:'avaliar_pedido',      label:'Avaliação Pós-venda',   grupo:'Pós-venda',     tipo:'bling', icon:Star,        cor:'#f87171', situacao:'manual',  manual:true, desc:'Satisfação após entrega', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{link_acompanhamento}}'] },
  { id:'boas_vindas',         label:'Boas-vindas',           grupo:'Pós-venda',     tipo:'bling', icon:Star,        cor:'#e879f9', situacao:'manual',  manual:true, desc:'Primeiro contato no WhatsApp', variaveis:['{{nome_cliente}}','{{nome_loja}}'] },

  // ── 5. Inteligência (Bia) — inline, sem aprovação Meta ─────────────────
  { id:'avise_me',            label:'Produto Disponível',    grupo:'Inteligência',  tipo:'bling', icon:Bell,        cor:'#fb923c', situacao:'#AVISE',  manual:true, desc:'Produto voltou ao estoque (#AVISE)', variaveis:['{{nome_cliente}}','{{nome_produto}}','{{preco_produto}}','{{link_produto}}'] },
  { id:'catalogo_produto',    label:'Produto do Catálogo',   grupo:'Inteligência',  tipo:'bling', icon:ShoppingBag, cor:'#10b981', situacao:'manual',  manual:true, desc:'Produto enviado via catálogo', variaveis:['{{nome_produto}}','{{preco_cartao}}','{{preco_pix}}','{{foto_produto}}','{{descricao_produto}}'] },
  { id:'reengajamento',       label:'Reengajamento',         grupo:'Inteligência',  tipo:'ia',    icon:Brain,       cor:'#7c6af7', situacao:'auto-ia', desc:'Cliente inativo detectado pela Bia', variaveis:['{{nome_cliente}}','{{dias_inativo}}','{{ultimo_produto}}'] },
  { id:'recompra_vip',        label:'Ciclo VIP',             grupo:'Inteligência',  tipo:'ia',    icon:Brain,       cor:'#7c6af7', situacao:'auto-ia', desc:'VIP no ciclo de recompra', variaveis:['{{nome_cliente}}','{{ciclo_dias}}'] },
  { id:'primeira_recompra',   label:'1ª Recompra',           grupo:'Inteligência',  tipo:'ia',    icon:Brain,       cor:'#7c6af7', situacao:'auto-ia', desc:'1ª compra sem retorno', variaveis:['{{nome_cliente}}','{{ultimo_produto}}'] },
  { id:'pos_entrega',         label:'Pós-entrega IA',        grupo:'Inteligência',  tipo:'ia',    icon:Brain,       cor:'#7c6af7', situacao:'auto-ia', desc:'Follow-up automático pós-entrega', variaveis:['{{nome_cliente}}','{{numero_pedido}}'] },
]

const GRUPOS_ORDEM = ['Compra & Pagamento','Preparação & Nota','Envio & Rastreio','Pós-venda','Inteligência']

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

// Templates padrão por gatilho
const PADROES = {

  // ── HSM Meta — precisam de aprovação antes de usar ───────────────────────
  // Linguagem direta e objetiva (requisito Meta: sem promoção agressiva)

  pedido_criado: {
    cab:'🛒 Pedido confirmado!',
    corpo:'Oi *{{nome_cliente}}*! Seu pedido *#{{numero_pedido}}* foi criado com sucesso 🎉\n\n💰 Total: *{{valor_total}}*\nForma de pagamento: {{forma_pagamento}}',
    rod:'Dúvidas? É só responder aqui.',
    bts:[{texto:'Ver pedido',acao:'url',valor:'{{link_pedido}}'}]
  },

  pagamento_aprovado: {
    cab:'✅ Pagamento confirmado!',
    corpo:'Oi *{{nome_cliente}}*! O pagamento do pedido *#{{numero_pedido}}* entrou 🎉\n\nJá começamos a separar tudo com cuidado!',
    rod:'Qualquer dúvida é só chamar.',
    bts:[]
  },

  pagamento_pendente: {
    cab:'⏳ Aguardando pagamento',
    corpo:'Oi *{{nome_cliente}}*! Seu pedido *#{{numero_pedido}}* está aguardando o pagamento.\n\nTotal: *{{valor_total}}*\n\nO link de pagamento expira em 24 horas.',
    rod:'Precisa de ajuda? É só responder.',
    bts:[{texto:'Pagar agora',acao:'url',valor:'{{link_pedido}}'},{texto:'Preciso de ajuda',acao:'reply',valor:'Ajuda com pagamento'}]
  },

  pedido_enviado: {
    cab:'🚚 Saiu para entrega!',
    corpo:'Oi *{{nome_cliente}}*! Seu pedido *#{{numero_pedido}}* foi despachado!\n\n📦 Transportadora: *{{transportadora}}*\n🔍 Rastreio: *{{codigo_rastreio}}*\n📅 Previsão de entrega: *{{previsao_entrega}}*',
    rod:'Continuaremos monitorando pra você!',
    bts:[{texto:'Rastrear pedido',acao:'url',valor:'{{link_rastreio}}'}]
  },

  pedido_entregue: {
    cab:'📦 Chegou!',
    corpo:'Oi *{{nome_cliente}}*! Seu pedido *#{{numero_pedido}}* foi entregue 😊\n\nEsperamos que você goste muito! Qualquer coisa é só chamar.',
    rod:'Só Strass — sempre aqui pra você.',
    bts:[{texto:'Avaliar compra ⭐',acao:'reply',valor:'Quero avaliar'},{texto:'Tive um problema',acao:'reply',valor:'Preciso de ajuda'}]
  },

  nfe_emitida: {
    cab:'📄 Nota fiscal emitida',
    corpo:'Oi *{{nome_cliente}}*! A nota fiscal do pedido *#{{numero_pedido}}* foi emitida.\n\n📎 NF-e nº *{{numero_nfe}}*',
    rod:'Disponível para download no botão abaixo.',
    bts:[{texto:'Baixar NF-e',acao:'url',valor:'{{link_nfe}}'}]
  },

  cancelamento: {
    cab:'Pedido cancelado',
    corpo:'Oi *{{nome_cliente}}*, o pedido *#{{numero_pedido}}* foi cancelado.\n\nSe precisar de ajuda ou quiser fazer um novo pedido, é só chamar!',
    rod:'Só Strass.',
    bts:[]
  },

  // ── Inline IA / Manuais — não precisam de HSM ────────────────────────────
  // Tom conversacional da Molise — enviados dentro da janela de 24h

  reengajamento: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! 😊\n\nA gente tá com saudade! Faz *{{dias_inativo}} dias* desde sua última visita e temos muita novidade esperando por você.\n\nQuer dar uma olhada?',
    rod:'',
    bts:[]
  },

  recompra_vip: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! ✨\n\nComo cliente VIP, você é a primeira a saber das novidades. Seu ciclo de recompra é de *{{ciclo_dias}} dias* e a gente separou algumas opções pra você!',
    rod:'',
    bts:[]
  },

  primeira_recompra: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! 😊\n\nEsperamos que tenha amado *{{ultimo_produto}}*! Já tem alguma coisa nova na sua lista? A gente adora te ajudar a encontrar o produto certo.',
    rod:'',
    bts:[]
  },

  pos_entrega: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! Como foi a experiência com o pedido *#{{numero_pedido}}*? 😊\n\nSua opinião é muito importante pra gente melhorar cada vez mais!',
    rod:'',
    bts:[]
  },

  boas_vindas: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! Seja bem-vinda(o) à *{{nome_loja}}*! 🎉\n\nSou a Molise, consultora da loja. Tô aqui pra te ajudar a encontrar tudo que precisar — strass, bijuterias, artesanato e muito mais!\n\nComo posso te ajudar hoje?',
    rod:'',
    bts:[]
  },

  avaliar_pedido: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! Tudo certo com o pedido *#{{numero_pedido}}*? 😊\n\nSe puder, me conta como foi a experiência — é rapidinho e ajuda muito a gente!',
    rod:'',
    bts:[]
  },

  avise_me: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! 🔔\n\nBoa notícia — *{{nome_produto}}* voltou ao estoque!\n\n💰 {{preco_produto}}',
    rod:'',
    bts:[{texto:'Ver produto',acao:'url',valor:'{{link_produto}}'}]
  },

  em_separacao: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! Seu pedido *#{{numero_pedido}}* entrou em separação agora mesmo 📦\n\nEstamos preparando tudo com cuidado pra você — em breve avisamos quando estiver pronto!',
    rod:'',
    bts:[]
  },

  produto_embalado: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! Seu pedido *#{{numero_pedido}}* está embalado e pronto! 🎁\n\nJá vamos despachar pra você — acompanhe pelo rastreio assim que sair!',
    rod:'',
    bts:[]
  },

  saiu_entrega: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! Seu pedido *#{{numero_pedido}}* saiu pra entrega agora! 🚚\n\nCódigo de rastreio: *{{codigo_rastreio}}*',
    rod:'',
    bts:[{texto:'Rastrear',acao:'url',valor:'{{link_rastreio}}'}]
  },

  aguardando_retirada: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! 🎉\n\nSeu pedido *#{{numero_pedido}}* está pronto para retirada!\n\n📍 *Local de retirada:*\nRua Caetano Vivona, 656\nJardim Santa Catarina — Limeira/SP\nCEP: 13485-102\n\n🕐 *Horário de atendimento:*\nSeg a Qui: 8h às 17h30\nSexta-feira: 8h às 16h\n\n_Traga o número do pedido ou seu CPF na hora da retirada_ 😊',
    rod:'',
    bts:[]
  },

  pedido_coletado: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! 📦\n\nBoa notícia: a transportadora já coletou o seu pedido *#{{numero_pedido}}* e ele entrou na rota de envio!\n\nCódigo de rastreio: *{{codigo_rastreio}}*',
    rod:'',
    bts:[{texto:'Acompanhar',acao:'url',valor:'{{link_acompanhamento}}'}]
  },

  rastreio_em_transito: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! 🚚\n\nSeu pedido *#{{numero_pedido}}* está a caminho pela *{{transportadora}}*!\n\n📍 Status atual: _{{status_rastreio}}_\n📅 Previsão de entrega: *{{previsao_entrega}}*\n\n*Acompanhe o trajeto:*\n{{historico_rastreio_citar}}',
    rod:'',
    bts:[{texto:'Acompanhar',acao:'url',valor:'{{link_acompanhamento}}'}]
  },

  tentativa_entrega: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! 🔔\n\nA transportadora tentou entregar o seu pedido *#{{numero_pedido}}*, mas não conseguiu te encontrar no endereço.\n\nNão se preocupe — uma nova tentativa será feita. Se precisar, acompanhe os detalhes pelo link abaixo.',
    rod:'',
    bts:[{texto:'Acompanhar',acao:'url',valor:'{{link_acompanhamento}}'}]
  },

  endereco_incorreto: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! ⚠️\n\nIdentificamos um problema com o endereço de entrega do seu pedido *#{{numero_pedido}}*.\n\nPara que ele possa seguir, precisamos confirmar os seus dados. Pode nos responder por aqui que a gente te ajuda? 😊',
    rod:'',
    bts:[]
  },

  nao_entrou_unidade: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! 📦\n\nVimos no rastreio do seu pedido *#{{numero_pedido}}* uma mensagem da transportadora pedindo contato. Fica tranquilo(a): nós já estamos acompanhando de perto e cuidando disso pra você.\n\nNão precisa fazer nada — qualquer novidade, a gente te avisa por aqui. Se tiver qualquer dúvida, é só responder esta mensagem. 💛',
    rod:'',
    bts:[]
  },

  pacote_devolvido: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*!\n\nO seu pedido *#{{numero_pedido}}* acabou retornando para a gente. Isso pode acontecer por ausência no endereço ou dados incompletos.\n\nFica tranquilo(a) que vamos resolver juntos — responde aqui que a gente combina o reenvio. 💛',
    rod:'',
    bts:[]
  },
}


const AMOSTRAS = {
  '{{nome_cliente}}':'Maria Silva','{{numero_pedido}}':'224307','{{valor_total}}':'R$ 47,52',
  '{{forma_pagamento}}':'PIX','{{transportadora}}':'Jadlog','{{codigo_rastreio}}':'JD123456789BR',
  '{{link_rastreio}}':'https://rastreamento.jadlog.com.br','{{prazo_entrega}}':'3 dias úteis','{{previsao_entrega}}':'12/06/2026',
  '{{endereco_entrega}}':'Rua das Flores, 123 - Centro, Limeira/SP - CEP 13480-000',
  '{{endereco_faturamento}}':'Av. Brasil, 456 - Jardim, Campinas/SP - CEP 13000-000',
  '{{historico_rastreio}}':'30/05 14:20 — Objeto postado\n31/05 09:10 — Em trânsito (Sorocaba/SP)\n01/06 08:00 — Saiu para entrega',
  '{{historico_rastreio_citar}}':'> 30/05 14:20 — Objeto postado\n> 31/05 09:10 — Em trânsito (Sorocaba/SP)\n> 01/06 08:00 — Saiu para entrega',
  '{{nome_produto}}':'Fio de Seda Rabo de Rato Preto','{{preco_produto}}':'R$ 11,62',
  '{{preco_pix}}':'R$ 10,46','{{link_produto}}':'https://sostrass.com.br/produto',
  '{{foto_produto}}':'https://cdn-sostrass-image.s3.sa-east-1.amazonaws.com/perola-furo-passante-creme.jpg',
  '{{nome_loja}}':'Só Strass','{{link_pedido}}':'https://sostrass.com.br/pedido/224307',
  '{{numero_nfe}}':'123456','{{link_nfe}}':'https://sostrass.com.br/nfe/123456',
  '{{link_acompanhamento}}':'https://rastreio.sostrass.com.br/p/LGI-ME2628',
  '{{status_rastreio}}':'O pacote está em uma base da Loggi — Sorocaba/SP',
  '{{dias_inativo}}':'45','{{ultimo_produto}}':'Strass Jet 50m','{{ciclo_dias}}':'30',
  '{{qtde_item_pedido}}':'48',
  '{{lista_itens_pedido}}':'12x Strass Jet SS10\n24x Fio de Seda Preto\n12x Pérola Creme 8mm',
  '{{itens_linha_unica}}':'12x Strass Jet SS10 / 24x Fio de Seda Preto / 12x Pérola Creme 8mm',
  '{{descricao_produto}}':'Fio de seda de alta resistência, ideal para montagem de bijuterias',
  '{{preco_cartao}}':'R$ 12,90',
}
const rv = t=>(t||'').replace(/\{\{([^}]+)\}\}/g,(_,k)=>AMOSTRAS[`{{${k}}}`]||`{{${k}}}`)

// Traduz o campo "situacao" (técnico) em uma explicação legível: quando o
// gatilho dispara. Usado no manual da aba Configuração.
function manualGatilho(g) {
  const s = g?.situacao || ''
  // Situações do Bling (sit=N) → nome amigável
  const SIT_NOME = {
    '6':'o pedido entra como *Em Aberto* no Bling (novo pedido)',
    '9':'o pedido muda para *Atendido* (pagamento confirmado)',
    '12':'o pedido é *Cancelado*',
    '15':'o pedido muda para *Em Andamento* (separação/faturamento)',
    '21':'a *NF-e é criada* e aguarda autorização da SEFAZ',
    '24':'a *NF-e é autorizada* (DANFE disponível)',
    '27':'o pedido muda para *Enviado* (com código de rastreio)',
    '30':'o pedido é marcado como *Entregue*',
    '33':'a entrega *falha* (tentativa sem sucesso)',
    '36':'o pedido é *Devolvido*',
  }
  if (s.startsWith('sit=')) {
    const id = s.replace('sit=','').split(' ')[0]
    return { tipo:'Automático (Bling)', quando:`Dispara quando ${SIT_NOME[id]||'a situação '+id+' ocorre'}.` }
  }
  if (s.startsWith('nfe=')) {
    const id = s.replace('nfe=','').split(' ')[0]
    const NFE_NOME = {
      '1':'a *nota fiscal é emitida* e aguarda autorização da SEFAZ',
      '4':'a *nota fiscal é rejeitada* pela SEFAZ',
      '5':'a *nota fiscal é autorizada* (DANFE disponível)',
      '6':'a *nota fiscal é autorizada* (DANFE disponível)',
    }
    return { tipo:'Automático (Nota Fiscal)', quando:`Dispara quando ${NFE_NOME[id]||'a nota muda de situação'}. Só para pedidos que têm nota.` }
  }
  if (s.startsWith('#')) {
    return { tipo:'Comando manual', quando:`Dispara quando você escreve *${s.split(' ')[0]}* nas observações internas do pedido no Bling.` }
  }
  if (s.includes('auto') && s.includes('#')) {
    const cmd = s.match(/#[A-Z]+/)?.[0] || ''
    return { tipo:'Híbrido (auto + manual)', quando:`Dispara automaticamente pelo robô de rastreio OU quando você escreve *${cmd}* no pedido.` }
  }
  if (s === 'auto') {
    return { tipo:'Automático (rastreio)', quando:'Dispara sozinho quando o robô de rastreio detecta este status na transportadora.' }
  }
  if (s === 'auto-ia') {
    return { tipo:'Inteligência (IA)', quando:'Dispara automaticamente quando a IA detecta a condição (ex: cliente inativo, recompra).' }
  }
  if (s === 'manual') {
    return { tipo:'Manual', quando:'Não dispara sozinho. Você aciona quando quiser.' }
  }
  return { tipo:'—', quando:'Configuração de disparo não definida.' }
}


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
              {rod?.conteudo&&<div className="px-3 pb-2"><p style={{fontSize:10,color:'#8696a0'}}>{rv(rod.conteudo)}</p></div>}
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
    // Campo destino depende do TIPO do bloco: cabeçalho/texto → conteudo; demais → url
    const campo=(b.tipo==='texto'||b.tipo==='cabecalho')?'conteudo':'url'
    const atual=b[campo]||''
    // Sem elemento (ou campo nunca focado) → anexa no fim do conteúdo
    if(!el){ onChange({...b,[campo]:atual+v}); return }
    // selectionStart/End podem ser null/undefined se o campo não foi focado ainda.
    // Nesse caso, insere no FIM (previsível) em vez de duplicar/embaralhar.
    let s=el.selectionStart, e=el.selectionEnd
    if(typeof s!=='number'||typeof e!=='number'){ s=atual.length; e=atual.length }
    const novo=atual.slice(0,s)+v+atual.slice(e)
    onChange({...b,[campo]:novo})
    setTimeout(()=>{ try{ el.focus(); el.setSelectionRange(s+v.length,s+v.length) }catch{} },0)
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
    <div className="rounded-[12px] overflow-hidden transition-all" style={{border:`1px solid ${aberto?def.cor+'30':'var(--sep)'}`,background:'var(--bg-2)',marginBottom:12}}>
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
        <div className="p-4 space-y-3">
          {b.tipo==='cabecalho'&&<><input id={`bloco-${b.id}`} value={b.conteudo||''} onChange={e=>onChange({...b,conteudo:e.target.value})} placeholder="Emoji + título" style={sty}/><div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}><EmojiPicker onInsert={v=>inserirVar(v,`bloco-${b.id}`)}/><VarPills vars={vars} onInsert={v=>inserirVar(v,`bloco-${b.id}`)}/></div></>}
          {b.tipo==='texto'&&<><textarea id={`bloco-${b.id}`} value={b.conteudo||''} onChange={e=>onChange({...b,conteudo:e.target.value})} placeholder="Texto... Use *negrito*" rows={7} style={{...sty,resize:'vertical',minHeight:140,lineHeight:1.7}}/><div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}><EmojiPicker onInsert={v=>inserirVar(v,`bloco-${b.id}`)}/><VarPills vars={vars} onInsert={v=>inserirVar(v,`bloco-${b.id}`)}/></div></>}
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
            {(b.acao==='url'||b.acao==='tel')&&<><input value={b.valor||''} onChange={e=>onChange({...b,valor:e.target.value})} placeholder={b.acao==='tel'?'Número':'URL'} style={{...sty,fontFamily:'monospace',fontSize:11}}/>{b.acao==='url'&&<VarPills vars={vars} onInsert={v=>onChange({...b,valor:(b.valor||'')+v})}/>}</>}
          </>}
          {b.tipo==='link'&&<><input value={b.url||''} onChange={e=>onChange({...b,url:e.target.value})} placeholder="URL" style={{...sty,fontFamily:'monospace',fontSize:12}}/><VarPills vars={vars} onInsert={v=>onChange({...b,url:(b.url||'')+v})}/></>}
          {b.tipo==='ligar'&&<><input value={b.texto||''} onChange={e=>onChange({...b,texto:e.target.value})} placeholder="Texto do botão" maxLength={20} style={sty}/><input value={b.valor||''} onChange={e=>onChange({...b,valor:e.target.value})} placeholder="Número telefone" style={{...sty,fontFamily:'monospace',fontSize:12}}/></>}
        </div>
      )}
    </div>
  )
}

// Mini-gráfico de linha (sparkline) para os indicadores do topo.
function Sparkline({ dados, cor, largura=58, altura=22 }) {
  if (!dados || dados.length < 2) return null
  const max = Math.max(...dados, 1), min = Math.min(...dados, 0)
  const range = max - min || 1
  const pts = dados.map((v,i) => {
    const x = (i / (dados.length - 1)) * largura
    const y = altura - ((v - min) / range) * altura
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const ult = dados[dados.length-1]
  const ultX = largura, ultY = altura - ((ult - min) / range) * altura
  return (
    <svg width={largura} height={altura} style={{overflow:'visible',flexShrink:0}}>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={ultX} cy={ultY} r="2" fill={cor}/>
    </svg>
  )
}

function VarPills({vars,onInsert}){
  if(!vars?.length)return null
  return <div className="flex flex-wrap gap-1">{vars.map(v=><button key={v} onClick={()=>onInsert(v)} style={{padding:'2px 6px',borderRadius:4,fontSize:9,fontFamily:'monospace',background:'var(--accent-dim)',color:'var(--accent)',border:'1px solid var(--accent-border)',cursor:'pointer'}}>{v}</button>)}</div>
}

// Seletor de emoji para os textos. Conjunto curado e útil para e-commerce/WhatsApp.
const EMOJIS = {
  'Frequentes': ['😊','🎉','✅','❤️','🙌','👏','✨','🔥','💜','🛍️'],
  'Pedido':     ['📦','🛒','🧾','💳','💰','🏷️','✔️','📋','🎁','⭐'],
  'Entrega':    ['🚚','📍','🛵','✈️','🏠','🗺️','⏱️','📮','🚪','🤝'],
  'Atenção':    ['⚠️','❗','⏰','🔔','💡','👀','📢','🆘','❌','🚨'],
  'Carinho':    ['😍','🥰','😘','💖','🌟','💫','🌸','💐','👋','🫶'],
}

function EmojiPicker({ onInsert }) {
  const [aberto, setAberto] = useState(false)
  const [cat, setCat] = useState('Frequentes')
  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <button onClick={()=>setAberto(a=>!a)} title="Inserir emoji"
        style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:6, fontSize:11,
                 background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent-border)', cursor:'pointer' }}>
        <span style={{fontSize:13}}>😊</span> Emoji
      </button>
      {aberto && (
        <>
          <div onClick={()=>setAberto(false)} style={{ position:'fixed', inset:0, zIndex:40 }}/>
          <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, zIndex:50, width:228,
                        background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:10, padding:8,
                        boxShadow:'0 8px 24px rgba(0,0,0,.25)' }}>
            <div style={{ display:'flex', gap:3, marginBottom:7, flexWrap:'wrap' }}>
              {Object.keys(EMOJIS).map(c=>(
                <button key={c} onClick={()=>setCat(c)}
                  style={{ fontSize:9.5, padding:'2px 7px', borderRadius:99, cursor:'pointer',
                           background: cat===c?'var(--accent)':'var(--fill)', color: cat===c?'#fff':'var(--label-3)',
                           border:'none' }}>{c}</button>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:2 }}>
              {EMOJIS[cat].map((e,i)=>(
                <button key={i} onClick={()=>{ onInsert(e); setAberto(false) }}
                  style={{ fontSize:17, padding:3, borderRadius:6, background:'transparent', border:'none', cursor:'pointer', lineHeight:1 }}
                  onMouseEnter={ev=>ev.currentTarget.style.background='var(--fill)'}
                  onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>{e}</button>
              ))}
            </div>
          </div>
        </>
      )}
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
  const [submetendo,  setSubmetendo] = useState(false)
  const [metaStatus,  setMetaStatus] = useState('')
  const [metaErro,    setMetaErro]  = useState('')
  const [aba,         setAba]       = useState('editor')  // editor | preview | config | meta
  const [grupoAberto, setGrupoAb]   = useState({ 'Preparação & Nota':false, 'Envio & Rastreio':false, 'Pós-venda':false, 'Inteligência':false })
  const [busca,       setBusca]     = useState('')
  const [loading,     setLoading]   = useState(true)
  const [nomesCustom, setNomesCustom] = useState({})  // { gatilhoId: 'nome editado' }
  const [editandoNome, setEditandoNome] = useState(false)  // modo edição do nome do gatilho selecionado
  const [pulso, setPulso] = useState(null)  // dados da operação (Fase 1: /api/operacao/pulso)
  const [jornada, setJornada] = useState(null)  // clientes por etapa (Fase 1: /api/operacao/jornada)
  const [sugestoes, setSugestoes] = useState([])  // Molise copilota (Fase 2: /api/operacao/sugestoes)
  const [sugestoesFechadas, setSugFechadas] = useState({})  // dispensadas pelo usuário (sessão)
  const [sparks, setSparks] = useState(null)  // séries históricas pros sparklines
  const [atividade, setAtividade] = useState({})  // envios por gatilho (7 dias)
  const [molisesAberta, setMoliseAberta] = useState(false)  // painel de sugestões on/off

  const gatilho = GATILHOS.find(g => g.id === selId)
  const config  = configs[selId]
  const isIA    = gatilho?.tipo === 'ia'
  // Label efetivo: nome customizado pelo usuário OU o padrão do gatilho
  const labelDe = (g) => (g && (nomesCustom[g.id] || g.label)) || ''
  const labelAtual = labelDe(gatilho)

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
        const nm = {}
        for (const g of GATILHOS) {
          const chave = `delay_${g.id}`
          if (d[chave] !== undefined) dl[g.id] = Number(d[chave])
          const chaveNome = `nome_${g.id}`
          if (d[chaveNome]) nm[g.id] = d[chaveNome]
        }
        setDelays(dl)
        setNomesCustom(nm)
      }
    } catch {}
  }, [api])

  // Salva o nome customizado do gatilho (persiste em ia/config, igual aos delays)
  const salvarNome = useCallback(async (gId, novoNome) => {
    const nome = (novoNome || '').trim()
    setNomesCustom(p => { const n = {...p}; if (nome) n[gId] = nome; else delete n[gId]; return n })
    setEditandoNome(false)
    await fetch(`${api}/api/ia/config`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ chave:`nome_${gId}`, valor:nome })
    }).catch(() => {})
  }, [api])

  useEffect(() => { carregar(); carregarDelays() }, [carregar, carregarDelays])

  // Busca o pulso da operação (Fase 1). Falha silenciosa: se o endpoint não
  // responder, o painel simplesmente não aparece — não quebra a página.
  useEffect(() => {
    let vivo = true
    fetch(`${api}/api/operacao/pulso`)
      .then(r => r.json())
      .then(d => { if (vivo && d && d.meta) setPulso(d) })
      .catch(() => {})
    fetch(`${api}/api/operacao/jornada`)
      .then(r => r.json())
      .then(d => { if (vivo && d && d.etapas) setJornada(d) })
      .catch(() => {})
    fetch(`${api}/api/operacao/sugestoes`)
      .then(r => r.json())
      .then(d => { if (vivo && d && Array.isArray(d.sugestoes)) setSugestoes(d.sugestoes) })
      .catch(() => {})
    fetch(`${api}/api/operacao/sparklines`)
      .then(r => r.json())
      .then(d => { if (vivo && d && d.dias) setSparks(d) })
      .catch(() => {})
    fetch(`${api}/api/operacao/atividade`)
      .then(r => r.json())
      .then(d => { if (vivo && d && d.atividade) setAtividade(d.atividade) })
      .catch(() => {})
    return () => { vivo = false }
  }, [api])

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
    setEditandoNome(false)
    setMetaStatus(cfg?.meta_template_status || '')
    setMetaErro('')
    setAba('editor')
  }, [selId, configs])

  // Status Meta ao selecionar
  useEffect(() => {
    const cfg = configs[selId]
    if (cfg?.id) {
      fetch(`${api}/api/meta-templates/status/${cfg.id}`)
        .then(r => r.json())
        .then(d => { if(d.status) setMetaStatus(d.status) })
        .catch(() => {})
    }
  }, [selId, configs, api])

  // ── Ações ──────────────────────────────────────────────────────────────────
  const addBloco = tipo => {
    setBlocos(p => [...p, {tipo,conteudo:'',url:'',texto:'',acao:tipo==='botao'?'url':'reply',valor:'',legenda:'',id:Date.now()}])
    setDirty(true)
  }
  const delBloco = i => { setBlocos(p => p.filter((_,j) => j !== i)); setDirty(true) }
  const updBloco = (i, b) => { setBlocos(p => p.map((x,j) => j === i ? b : x)); setDirty(true) }
  const moveBloco = (i, dir) => {
    const t = i + dir
    if (t < 0 || t >= blocos.length) return
    const a = [...blocos]; [a[i],a[t]] = [a[t],a[i]]; setBlocos(a); setDirty(true)
  }
  const dupBloco = i => {
    const cl = {...blocos[i], id:Date.now()}
    const a = [...blocos]; a.splice(i+1,0,cl); setBlocos(a); setDirty(true)
  }

  const salvar = async () => {
    if (!selId || !dirty) return
    setSalvando(true)
    try {
      const c = configs[selId]
      const g = GATILHOS.find(x => x.id === selId)
      const body = { gatilho:selId, nome:(nomesCustom[selId]||g?.label||selId), blocos, ativo: c?.ativo ?? true }
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
        body: JSON.stringify({ nome:g.label, gatilho:g.id, descricao:g.desc, variaveis:g.variaveis||[] })
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
      const tel = telTeste.replace(/\D/g,'')
      const r = await fetch(`${api}/api/templates/disparar-gatilho`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ gatilho:selId, telefone:tel, variaveis:AMOSTRAS })
      })
      const d = await r.json()
      setResTeste(d.ok || r.ok ? 'ok' : d.erro || 'erro')
    } catch(e) { setResTeste(e.message||'erro') }
    setEnviandoT(false)
  }

  const submeterMeta = async () => {
    const c = configs[selId]
    if (!c?.id) { alert('Salve o template primeiro'); return }
    // Proteção: a Meta exige um bloco de Texto (BODY). Se não houver, avisa aqui
    // em vez de deixar a Meta rejeitar com "components=0".
    const temTexto = (blocos||[]).some(b => b.tipo==='texto' && (b.conteudo||'').trim())
    if (!temTexto) {
      setMetaErro('Adicione um bloco de "Texto" com conteúdo e clique em Salvar antes de enviar para a Meta. A mensagem precisa de um corpo de texto.')
      return
    }
    if (dirty) { alert('Você tem alterações não salvas. Clique em Salvar antes de enviar para a Meta.'); return }
    setSubmetendo(true); setMetaErro('')
    try {
      const r = await fetch(`${api}/api/meta-templates/submeter/${c.id}`, { method:'POST' })
      const d = await r.json()
      if (d.ok) {
        setMetaStatus(d.status || 'PENDING')
      } else {
        setMetaErro(`${d.erro || 'Erro desconhecido'}${d.dica ? ' — ' + d.dica : ''}${d.payload_debug ? ' | ' + d.payload_debug : ''}`)
      }
    } catch { setMetaErro('Erro de conexão') }
    setSubmetendo(false)
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

      {/* ── PAINEL DE PULSO (Fase 2) — indicadores com sparklines ──────────── */}
      {pulso && !selId && (
        <div style={{flexShrink:0,background:'var(--bg-2)',borderBottom:'0.5px solid var(--sep)',padding:'7px 20px',display:'flex',gap:7,overflowX:'auto'}}>
          {[
            { key:'aprovados',   lbl:'Aprovados',     val:pulso.meta.aprovados,   cor:'#22c55e' },
            { key:'analise',     lbl:'Em análise',    val:pulso.meta.analise,     cor:'#f59e0b' },
            { key:'naoEnviados', lbl:'Não enviados',  val:pulso.meta.naoEnviados, cor:'#8696a0' },
            { key:'rejeitados',  lbl:'Rejeitados',    val:pulso.meta.rejeitados,  cor:'#ef4444' },
            { key:'disparos',    lbl:'Disparos hoje', val:pulso.disparosHoje,     cor:'#4a9fff' },
            { key:'emRota',      lbl:'Em rota agora', val:pulso.clientesEmRota,    cor:'#7c6af7' },
          ].map((c,i)=>(
            <div key={i} style={{flex:'1 1 0',minWidth:110,background:'var(--bg)',borderRadius:8,padding:'6px 10px',border:'0.5px solid var(--sep)'}}>
              <div style={{fontSize:9.5,color:'var(--label-4)',marginBottom:2}}>{c.lbl}</div>
              <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:6}}>
                <span style={{fontSize:17,fontWeight:600,color:c.cor,lineHeight:1}}>{c.val}</span>
                {sparks && sparks[c.key] && <Sparkline dados={sparks[c.key]} cor={c.cor} altura={18}/>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MOLISE COPILOTA (Fase 2) — botão que expande sob demanda ────────── */}
      {(() => {
        const ativas = sugestoes.filter(s=>!sugestoesFechadas[s.titulo])
        if (!ativas.length || selId) return null
        return (
          <div style={{flexShrink:0,background:'var(--bg-2)',borderBottom:'0.5px solid var(--sep)',padding:'6px 20px'}}>
            <button onClick={()=>setMoliseAberta(a=>!a)}
              style={{display:'flex',alignItems:'center',gap:7,padding:'5px 12px',borderRadius:8,background:'rgba(124,106,247,.1)',border:'0.5px solid rgba(124,106,247,.25)',cursor:'pointer',color:'#7c6af7',fontSize:11.5,fontWeight:500}}>
              <Sparkles size={13}/> Molise sugere {ativas.length} melhoria{ativas.length>1?'s':''}
              {molisesAberta ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
            </button>
            {molisesAberta && (
              <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
                {ativas.slice(0,4).map((s,i)=>{
                  const cor = s.tipo==='erro'?'#ef4444':s.tipo==='aviso'?'#f59e0b':'#7c6af7'
                  const dim = s.tipo==='erro'?'rgba(239,68,68,.08)':s.tipo==='aviso'?'rgba(245,158,11,.08)':'rgba(124,106,247,.08)'
                  return (
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:9,background:dim,border:`0.5px solid ${cor}33`,borderRadius:9,padding:'9px 12px'}}>
                      <Sparkles size={14} style={{color:cor,flexShrink:0,marginTop:1}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11.5,fontWeight:500,color:'var(--label)',lineHeight:1.4}}><span style={{color:cor}}>Molise:</span> {s.titulo}</div>
                        <div style={{fontSize:10.5,color:'var(--label-3)',lineHeight:1.45,marginTop:2}}>{s.texto}</div>
                        {s.gatilho && (
                          <button onClick={()=>{ setSelId(s.gatilho); if(s.acao==='gerar') setTimeout(()=>gerarIA(),300) }}
                            style={{marginTop:6,fontSize:10,padding:'3px 10px',borderRadius:7,background:cor,color:'#fff',border:'none',cursor:'pointer',fontWeight:500}}>
                            {s.acao==='gerar'?'Gerar com a Molise':s.acao==='revisar'?'Revisar gatilho':s.acao==='submeter'?'Abrir e submeter':'Abrir gatilho'}
                          </button>
                        )}
                      </div>
                      <button onClick={()=>setSugFechadas(f=>({...f,[s.titulo]:true}))} title="Dispensar"
                        style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--label-4)',flexShrink:0,padding:2}}>
                        <X size={13}/>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── JORNADA (Fase 2) — linha do tempo: clientes por etapa agora ──────── */}
      {jornada && !selId && (
        <div style={{flexShrink:0,background:'var(--bg-2)',borderBottom:'0.5px solid var(--sep)',padding:'12px 20px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:4}}>
            {[
              { id:'compra',  lbl:'Compra',    icon:ShoppingBag, cor:'#7c6af7' },
              { id:'preparo', lbl:'Preparo',   icon:Package,     cor:'#4a9fff' },
              { id:'envio',   lbl:'Envio',     icon:Truck,       cor:'#1D9E75' },
              { id:'pos',     lbl:'Pós-venda', icon:RefreshCw,   cor:'#f59e0b' },
              { id:'ia',      lbl:'IA',        icon:Brain,       cor:'#a78bfa' },
            ].map((e,i,arr)=>{
              const n = jornada.etapas[e.id] || 0
              const ativo = n > 0
              const EIcon = e.icon
              return (
                <div key={e.id} style={{display:'flex',alignItems:'center',flex:i<arr.length-1?1:'0 0 auto'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,flexShrink:0}}>
                    <span style={{fontSize:15,fontWeight:600,color:ativo?e.cor:'var(--label-4)',lineHeight:1}}>{n}</span>
                    <div style={{width:30,height:30,borderRadius:'50%',background:ativo?e.cor:'var(--fill)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <EIcon size={14} style={{color:ativo?'#fff':'var(--label-4)'}}/>
                    </div>
                    <span style={{fontSize:9.5,color:ativo?e.cor:'var(--label-4)',fontWeight:ativo?500:400}}>{e.lbl}</span>
                  </div>
                  {i<arr.length-1 && <div style={{flex:1,height:2,background:'var(--sep)',margin:'0 4px',marginBottom:14}}/>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{flex:1,display:'flex',overflow:'hidden',position:'relative'}}>

        {/* ── GRADE DE CARDS (Centro de Operações) ────────────────────────── */}
        <div style={{flex:1,overflowY:'auto',padding:'14px 20px',background:'var(--bg)'}}>

          {/* Busca */}
          <div style={{marginBottom:14,maxWidth:360}}>
            <div style={{display:'flex',alignItems:'center',gap:7,padding:'8px 11px',borderRadius:9,border:'0.5px solid var(--sep)',background:'var(--bg-2)'}}>
              <Activity size={13} style={{color:'var(--label-4)',flexShrink:0}}/>
              <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar gatilho..."
                style={{flex:1,border:'none',background:'transparent',color:'var(--label)',fontSize:13,outline:'none'}}/>
            </div>
          </div>

          {/* Grade agrupada por jornada */}
          {gruposFiltrados.map(grupo => (
            <div key={grupo.nome} style={{marginBottom:18}}>
              <button onClick={()=>setGrupoAb(p=>({...p,[grupo.nome]:!p[grupo.nome]}))}
                style={{display:'flex',alignItems:'center',gap:8,padding:'4px 2px',marginBottom:9,border:'none',background:'transparent',cursor:'pointer'}}>
                <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-3)'}}>{grupo.nome}</span>
                <span style={{fontSize:10.5,color:'var(--label-4)',background:'var(--fill)',padding:'1px 7px',borderRadius:99,border:'0.5px solid var(--sep)'}}>{grupo.itens.length}</span>
                {grupoAberto[grupo.nome]===false ? <ChevronDown size={12} style={{color:'var(--label-4)'}}/> : <ChevronUp size={12} style={{color:'var(--label-4)'}}/>}
              </button>

              {grupoAberto[grupo.nome]!==false && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:10}}>
                  {grupo.itens.map(g => {
                    const cfg = configs[g.id]
                    const ativo = cfg?.ativo
                    const temTemplate = !!cfg
                    const Icon = g.icon
                    const isSelected = selId === g.id
                    const mst = (cfg?.meta_template_status || '').toUpperCase()
                    const stInfo = mst==='APPROVED' ? { cor:'#22c55e', lbl:'Aprovado', dim:'rgba(34,197,94,.12)' }
                      : (mst==='PENDING'||mst==='IN_APPEAL') ? { cor:'#f59e0b', lbl:'Em análise', dim:'rgba(245,158,11,.12)' }
                      : mst==='REJECTED' ? { cor:'#ef4444', lbl:'Rejeitado', dim:'rgba(239,68,68,.12)' }
                      : temTemplate ? { cor:'var(--label-4)', lbl:'Rascunho', dim:'var(--fill)' }
                      : { cor:'var(--label-4)', lbl:'Sem template', dim:'var(--fill)' }
                    // Preview do conteúdo: primeiro texto/cabeçalho do gatilho
                    const blocoTexto = (cfg?.blocos||[]).find(b=>b.tipo==='texto'||b.tipo==='cabecalho')
                    const previewTxt = blocoTexto?.conteudo || 'Sem conteúdo configurado'
                    return (
                      <div key={g.id} onClick={()=>setSelId(g.id)} className="gat-card"
                        style={{background:'var(--bg-2)',borderRadius:11,border:`0.5px solid ${isSelected?g.cor+'60':'var(--sep)'}`,cursor:'pointer',overflow:'hidden',display:'flex',flexDirection:'column'}}>
                        {/* Faixa de status */}
                        <div style={{height:3,background:stInfo.cor==='var(--label-4)'?'var(--sep)':stInfo.cor}}/>
                        <div style={{padding:'11px 13px',display:'flex',flexDirection:'column',gap:8,flex:1}}>
                          {/* Cabeçalho do card */}
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
                              <div style={{width:30,height:30,borderRadius:8,background:`${g.cor}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                <Icon size={15} style={{color:g.cor}}/>
                              </div>
                              <span style={{fontSize:12.5,fontWeight:500,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{labelDe(g)}</span>
                            </div>
                            {/* Toggle ativo */}
                            {temTemplate && (
                              <button onClick={(e)=>{e.stopPropagation(); toggleAtivo(g.id)}} title={ativo?'Ativo':'Inativo'}
                                style={{position:'relative',width:30,height:17,borderRadius:99,border:'none',cursor:'pointer',background:ativo?'#22c55e':'var(--sep)',flexShrink:0,transition:'background .15s'}}>
                                <span style={{position:'absolute',width:13,height:13,background:'#fff',borderRadius:'50%',top:2,left:ativo?15:2,transition:'left .15s'}}/>
                              </button>
                            )}
                          </div>
                          {/* Mini preview da mensagem */}
                          <div style={{background:'var(--fill)',borderRadius:7,padding:'8px 10px',flex:1,minHeight:42,border:'0.5px solid var(--sep)'}}>
                            <p style={{fontSize:10.5,color:'var(--label-2)',margin:0,lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{previewTxt.replace(/\n/g,' ').replace(/\*/g,'')}</p>
                          </div>
                          {/* Rodapé: status + atividade + ações */}
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}>
                            <div style={{display:'flex',alignItems:'center',gap:6,minWidth:0}}>
                              <span style={{fontSize:9,padding:'1px 7px',borderRadius:99,background:stInfo.dim,color:stInfo.cor,fontWeight:500,whiteSpace:'nowrap'}}>{stInfo.lbl}</span>
                              {atividade[g.id]>0 && <span style={{fontSize:9,color:'var(--label-4)',whiteSpace:'nowrap'}}>· {atividade[g.id]}/sem</span>}
                            </div>
                            <div style={{display:'flex',gap:7,alignItems:'center',color:'var(--label-4)',flexShrink:0}}>
                              {g.tipo==='ia' && <span style={{fontSize:8.5,padding:'1px 5px',borderRadius:99,background:'rgba(124,106,247,.12)',color:'#7c6af7'}}>IA</span>}
                              <Pencil size={13} style={{cursor:'pointer'}}/>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── PAINEL DESLIZANTE (editor + preview) ────────────────────────── */}
        {selId && (
          <div onClick={()=>setSelId(null)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.35)',zIndex:30,animation:'fadeIn .15s'}}/>
        )}
        <div style={{position:'absolute',top:0,right:0,bottom:0,width:selId?'min(1180px,96%)':0,background:'var(--bg)',borderLeft:selId?'0.5px solid var(--sep)':'none',zIndex:31,overflow:'hidden',transition:'width .2s ease',display:'flex',boxShadow:selId?'-8px 0 24px rgba(0,0,0,.15)':'none'}}>
          {selId && (
          <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 340px',overflow:'hidden',minWidth:1100}}>

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
                    {editandoNome ? (
                      <input autoFocus defaultValue={labelAtual}
                        onBlur={e=>salvarNome(selId, e.target.value)}
                        onKeyDown={e=>{ if(e.key==='Enter') salvarNome(selId, e.target.value); if(e.key==='Escape') setEditandoNome(false) }}
                        style={{width:'100%',fontSize:14,fontWeight:600,color:'var(--label)',background:'var(--fill)',border:`1px solid ${gatilho.cor}60`,borderRadius:6,padding:'3px 8px',outline:'none'}}/>
                    ) : (
                      <p style={{fontSize:14,fontWeight:600,color:'var(--label)',margin:0,display:'flex',alignItems:'center',gap:6}}>
                        {labelAtual}
                        <button onClick={()=>setEditandoNome(true)} title="Editar nome do gatilho"
                          style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:20,height:20,borderRadius:5,border:'none',background:'transparent',cursor:'pointer',color:'var(--label-4)',flexShrink:0}}>
                          <Pencil size={11}/>
                        </button>
                        {nomesCustom[selId] && <span style={{fontSize:9,padding:'1px 5px',borderRadius:99,background:`${gatilho.cor}15`,color:gatilho.cor,fontWeight:500}}>editado</span>}
                      </p>
                    )}
                    <p style={{fontSize:11,color:'var(--label-4)',margin:0}}>{gatilho.desc}</p>
                  </div>
                  {/* Badge tipo */}
                  <span style={{fontSize:10.5,padding:'2px 8px',borderRadius:99,background:isIA?'rgba(124,106,247,.1)':'rgba(37,211,102,.08)',color:isIA?'#7c6af7':'#22c55e',border:`0.5px solid ${isIA?'rgba(124,106,247,.25)':'rgba(37,211,102,.2)'}`,flexShrink:0}}>
                    {isIA ? '✨ Inline IA' : '📋 HSM Meta'}
                  </span>
                </div>

                {/* Aviso de disparo manual (não dispara sozinho) */}
                {gatilho.manual && (
                  <div style={{display:'flex',alignItems:'center',gap:7,marginTop:10,padding:'8px 12px',borderRadius:9,background:'rgba(245,158,11,.08)',border:'0.5px solid rgba(245,158,11,.25)'}}>
                    <AlertTriangle size={14} style={{color:'#f59e0b',flexShrink:0}}/>
                    <span style={{fontSize:11.5,color:'var(--label-2)',lineHeight:1.4}}>
                      <b style={{color:'#d97706'}}>Disparo manual:</b> este gatilho não dispara sozinho.{gatilho.situacao?.includes('#') ? ` É acionado quando você escreve ${gatilho.situacao.split(' ')[0]} nas observações internas do pedido no Bling.` : ' Precisa ser acionado manualmente.'}
                    </span>
                  </div>
                )}
                {/* Aviso de disparo híbrido (automático pelo rastreio OU manual) */}
                {gatilho.hibrido && (
                  <div style={{display:'flex',alignItems:'center',gap:7,marginTop:10,padding:'8px 12px',borderRadius:9,background:'rgba(74,159,255,.08)',border:'0.5px solid rgba(74,159,255,.25)'}}>
                    <Info size={14} style={{color:'#4a9fff',flexShrink:0}}/>
                    <span style={{fontSize:11.5,color:'var(--label-2)',lineHeight:1.4}}>
                      <b style={{color:'#2563eb'}}>Disparo automático ou manual:</b> dispara sozinho quando o rastreio detecta o evento{gatilho.situacao?.includes('#') ? `, ou manualmente com ${gatilho.situacao.split(' ').find(p=>p.startsWith('#'))} nas observações do Bling.` : '.'}
                    </span>
                  </div>
                )}

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
              <div style={{flex:1,overflowY:'auto',padding:'18px 22px'}}>

                {/* ── ABA EDITOR ─────────────────────────────────────────── */}
                {aba === 'editor' && (
                  <div>
                    {/* Gerar com IA */}
                    <div style={{display:'flex',gap:7,marginBottom:14,padding:'10px 12px',borderRadius:9,background:'rgba(124,106,247,.05)',border:'0.5px solid rgba(124,106,247,.2)'}}>
                      <div style={{flex:1}}>
                        <p style={{fontSize:12,fontWeight:600,color:'#7c6af7',margin:'0 0 2px',display:'flex',alignItems:'center',gap:5}}>
                          <Sparkles size={12}/> Gerar com IA
                        </p>
                        <p style={{fontSize:11.5,color:'var(--label-4)',margin:0}}>A Molise AI cria o texto ideal para este gatilho</p>
                      </div>
                      <button onClick={gerarIA} disabled={gerando} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:8,border:'0.5px solid rgba(124,106,247,.3)',background:'rgba(124,106,247,.1)',color:'#7c6af7',cursor:'pointer',fontSize:12,fontWeight:600,flexShrink:0,alignSelf:'center'}}>
                        {gerando ? <><RefreshCw size={12} style={{animation:'spin 1s linear infinite'}}/> Gerando...</> : <><Sparkles size={12}/> Gerar</>}
                      </button>
                    </div>
                    {erroIA && <p style={{fontSize:12,color:'#ef4444',marginBottom:10}}>{erroIA}</p>}

                    {/* Blocos */}
                    <div>
                      {blocos.map((b,i) => (
                        <Bloco key={b.id||i} b={b} idx={i} total={blocos.length}
                          vars={gatilho?.variaveis||[]}
                          onChange={nb=>updBloco(i,nb)} onDelete={()=>delBloco(i)}
                          onMove={moveBloco} onDuplicate={()=>dupBloco(i)}/>
                      ))}
                    </div>

                    {/* Paleta de blocos */}
                    <div className="rounded-[12px] overflow-hidden" style={{border:'1px solid var(--sep)',background:'var(--bg-2)',marginTop:10}}>
                      <div className="px-3 py-2" style={{borderBottom:'1px solid var(--sep)',background:'var(--bg-3)'}}>
                        <p className="text-[10px] font-semibold" style={{color:'var(--label-3)'}}>Adicionar bloco</p>
                      </div>
                      <div className="p-2 grid grid-cols-5 gap-1.5">
                        {TIPOS_BLOCO.filter(t => {
                          if (t.tipo==='cabecalho' && blocos.find(b=>b.tipo==='cabecalho')) return false
                          if (t.tipo==='rodape'    && blocos.find(b=>b.tipo==='rodape'))    return false
                          if (t.tipo==='imagem'    && blocos.find(b=>b.tipo==='imagem'))    return false
                          if (t.tipo==='botao'     && blocos.filter(b=>b.tipo==='botao').length >= 3) return false
                          if (isIA && ['imagem','botao','link','ligar','video','audio'].includes(t.tipo)) return false
                          return true
                        }).map(t => {
                          const Ic = t.icon
                          return (
                            <button key={t.tipo} onClick={()=>addBloco(t.tipo)}
                              className="flex flex-col items-center gap-1 py-2 rounded-[8px] text-[9px] font-semibold transition-all group"
                              style={{background:'var(--bg-3)',border:'1px solid var(--sep)',color:'var(--label-3)'}} title={t.desc}>
                              <div className="w-5 h-5 rounded-[6px] flex items-center justify-center group-hover:scale-110 transition-transform"
                                style={{background:`${t.cor}20`}}><Ic size={11} style={{color:t.cor}}/></div>
                              {t.label}
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

                    {/* Manual: quando este gatilho dispara */}
                    {(() => {
                      const man = manualGatilho(gatilho)
                      const renderNegrito = (txt) => txt.split('*').map((p,i)=> i%2===1 ? <b key={i} style={{color:'var(--label)'}}>{p}</b> : p)
                      return (
                        <div style={{padding:'12px 14px',borderRadius:10,border:'0.5px solid rgba(74,159,255,.25)',background:'rgba(74,159,255,.06)'}}>
                          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
                            <Info size={14} style={{color:'#4a9fff'}}/>
                            <p style={{fontSize:12.5,fontWeight:600,color:'var(--label)',margin:0}}>Quando dispara</p>
                            <span style={{fontSize:9.5,padding:'1px 8px',borderRadius:99,background:'rgba(74,159,255,.12)',color:'#4a9fff',fontWeight:500}}>{man.tipo}</span>
                          </div>
                          <p style={{fontSize:11.5,color:'var(--label-3)',margin:0,lineHeight:1.5}}>{renderNegrito(man.quando)}</p>
                        </div>
                      )
                    })()}

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
                <PreviewWA blocos={blocos} label={gatilho?.label}/>
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
          )}
        </div>
      </div>
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
