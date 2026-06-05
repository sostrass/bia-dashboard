import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  GripVertical, Timer, Edit3, Send as SendIcon,
  Search, Users, Download, Minus, CheckCircle as CheckCircleIc,
  Navigation, ArrowUpRight, History, TrendingUp, ChevronLeft,
} from 'lucide-react'

// ── Constantes ────────────────────────────────────────────────────────────────
const R   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmt = n => Number(n||0).toLocaleString('pt-BR')

// ─── Paleta dark enterprise (idêntica à PageDisparos / PageCampanhas) ──────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#6b7294', ink4:'#3a3f5c',
  sep:'rgba(255,255,255,0.05)', sep2:'rgba(255,255,255,0.08)',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)',  greenBor:'rgba(0,230,118,.25)',
  blue:'#4f8ef7',  blueDim:'rgba(79,142,247,.08)',   blueBor:'rgba(79,142,247,.25)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.08)',   amberBor:'rgba(255,179,0,.25)',
  red:'#ff4757',   redDim:'rgba(255,71,87,.08)',     redBor:'rgba(255,71,87,.25)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.08)',purpleBor:'rgba(167,139,250,.25)',
  cyan:'#06b6d4',  cyanDim:'rgba(6,182,212,.08)',    cyanBor:'rgba(6,182,212,.25)',
  gray:'rgba(255,255,255,.04)', grayBor:'rgba(255,255,255,.1)',
}

// Grupos e gatilhos
const GATILHOS = [
  // ── 1. Compra & Pagamento ──────────────────────────────────────────────
  { id:'pedido_criado',       label:'Pedido Criado',         grupo:'Compra & Pagamento', tipo:'bling', icon:ShoppingBag, cor:'#00d4aa', situacao:'order.created', desc:'Disparo automático quando um novo pedido é criado no Bling (webhook order.created — status Em Aberto)', variaveis:['{{qtde_item_pedido}}','{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{valor_total}}','{{forma_pagamento}}','{{link_pedido}}','{{lista_itens_pedido}}','{{itens_linha_unica}}','{{endereco_entrega}}','{{endereco_faturamento}}'] },
  { id:'pagamento_aprovado',  label:'Pagamento Aprovado',    grupo:'Compra & Pagamento', tipo:'bling', icon:CreditCard,  cor:'#4a9fff', situacao:'sit=15',  desc:'Pedido em Em Andamento (pagamento confirmado)', variaveis:['{{qtde_item_pedido}}','{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{valor_total}}','{{forma_pagamento}}','{{lista_itens_pedido}}','{{itens_linha_unica}}','{{link_pedido}}'] },
  { id:'pagamento_pendente',  label:'Pagamento Pendente',    grupo:'Compra & Pagamento', tipo:'bling', icon:Clock,       cor:'#f59e0b', situacao:'sit=6',   desc:'Pedido em Aberto (aguardando pagamento)', variaveis:['{{qtde_item_pedido}}','{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{valor_total}}','{{link_pedido}}','{{lista_itens_pedido}}','{{itens_linha_unica}}'] },

  // ── 2. Preparação & Nota ───────────────────────────────────────────────
  { id:'em_separacao',        label:'Em Separação',          grupo:'Preparação & Nota', tipo:'bling', icon:Layers,      cor:'#8b5cf6', situacao:'sit=9', desc:'Pedido em Atendido (separação/embalagem) — automático', variaveis:['{{qtde_item_pedido}}','{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{lista_itens_pedido}}','{{itens_linha_unica}}'] },
  { id:'produto_embalado',    label:'Produto Embalado',      grupo:'Preparação & Nota', tipo:'bling', icon:Package,     cor:'#06b6d4', situacao:'#EMBALADO',  desc:'Disparo via comando #EMBALADO nas observações internas do pedido no Bling', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}'] },
  { id:'em_andamento',        label:'Em Andamento (info)',    grupo:'Preparação & Nota', tipo:'bling', icon:RefreshCw,   cor:'#8b5cf6', situacao:'manual',  manual:true, desc:'Gatilho informativo — sit=15 (Em Andamento) já dispara Pagamento Aprovado automaticamente. Use este apenas para comunicados extras.', variaveis:['{{qtde_item_pedido}}','{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{valor_total}}','{{lista_itens_pedido}}','{{itens_linha_unica}}'] },
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

  // ── 4b. Comandos Manuais (observações internas do Bling) ─────────────
  { id:'pix_pendente',      label:'PIX Pendente',      grupo:'Pós-venda',     tipo:'bling', icon:CreditCard, cor:'#06b6d4', situacao:'#PIX',    manual:true, desc:'Comando #PIX nas observações internas — pagamento via PIX aguardando confirmação', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{valor_total}}','{{link_pedido}}'] },
  { id:'estorno_realizado', label:'Estorno Realizado',  grupo:'Pós-venda',     tipo:'bling', icon:RefreshCw,  cor:'#f97316', situacao:'#ESTORNO', manual:true, desc:'Comando #ESTORNO nas observações internas — reembolso processado', variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{nome_loja}}','{{valor_total}}','{{forma_pagamento}}'] },

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
    cab:'🚚 Pedido despachado!',
    corpo:'Oi *{{nome_cliente}}*! Seu pedido *#{{numero_pedido}}* foi despachado! 🎉\n\n📦 Transportadora: *{{transportadora}}*\n🔍 Rastreio: *{{codigo_rastreio}}*\n📅 Previsão: *{{previsao_entrega}}*',
    rod:'Acompanhe em tempo real pelo botão abaixo.',
    bts:[{texto:'Acompanhar pedido',acao:'url',valor:'{{link_acompanhamento}}'}]
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

  pix_pendente: {
    cab:'⏳ Pagamento PIX pendente',
    corpo:'Oi *{{nome_cliente}}*! Seu pedido *#{{numero_pedido}}* está aguardando o pagamento via *PIX*.\n\nTotal: *{{valor_total}}*\n\nConfirme o pagamento no seu banco para garantir o pedido!',
    rod:'Precisa de ajuda? É só responder.',
    bts:[{texto:'Pagar agora',acao:'url',valor:'{{link_pedido}}'},{texto:'Preciso de ajuda',acao:'reply',valor:'Ajuda com pagamento PIX'}]
  },

  estorno_realizado: {
    cab:'✅ Estorno confirmado',
    corpo:'Oi *{{nome_cliente}}*! O reembolso do pedido *#{{numero_pedido}}* foi processado.\n\n💰 Valor: *{{valor_total}}*\n\nO valor aparece em até 5 dias úteis na sua conta.',
    rod:'Qualquer dúvida é só responder.',
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
    corpo:'Oi *{{nome_cliente}}*! 🚚 Seu pedido *#{{numero_pedido}}* saiu para entrega agora mesmo!\n\nFique de olho no mensageiro 😊',
    rod:'',
    bts:[{texto:'Acompanhar',acao:'url',valor:'{{link_acompanhamento}}'}]
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

  nao_entregue: {
    cab:'',
    corpo:'Oi *{{nome_cliente}}*! 🔔\n\nA transportadora informou que não conseguiu realizar a entrega do pedido *#{{numero_pedido}}*.\n\nEntre em contato com a *{{transportadora}}* ou acompanhe pelo link abaixo para reagendar.',
    rod:'',
    bts:[{texto:'Acompanhar',acao:'url',valor:'{{link_acompanhamento}}'}]
  }
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
  if (s === 'order.created') {
    return { tipo:'Automático (Bling)', quando:'Dispara via webhook quando um novo pedido é criado no Bling — status *Em Aberto* (situação 6). Todos os canais de venda.' }
  }
  if (s === '#PIX') {
    return { tipo:'Comando manual (Bling)', quando:'Dispara quando você escreve *#PIX* nas observações internas do pedido no Bling. Útil para notificar sobre pagamento via PIX aguardando confirmação.' }
  }
  if (s === '#ESTORNO') {
    return { tipo:'Comando manual (Bling)', quando:'Dispara quando você escreve *#ESTORNO* nas observações internas do pedido no Bling. Confirma reembolso processado para o cliente.' }
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
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {msgs.filter(m=>m.length>0).map((msg,mi)=>{
        const cab=msg.find(b=>b.tipo==='cabecalho'), img=msg.find(b=>b.tipo==='imagem')
        const txts=msg.filter(b=>b.tipo==='texto'), rod=msg.find(b=>b.tipo==='rodape')
        const bts=msg.filter(b=>['botao','ligar','link'].includes(b.tipo))
        if(!cab&&!img&&!txts.length&&!rod) return null
        return (
          <div key={mi}>
            {mi>0&&(
              <div style={{display:'flex',alignItems:'center',gap:6,margin:'2px 0 6px'}}>
                <div style={{flex:1,height:1,background:'#2a3942'}}/>
                <span style={{fontSize:8,color:'#8696a0'}}>msg separada</span>
                <div style={{flex:1,height:1,background:'#2a3942'}}/>
              </div>
            )}
            <div style={{borderRadius:'12px 12px 12px 3px',overflow:'hidden',
              maxWidth:264,background:'#202c33',position:'relative',
              boxShadow:'0 1px 4px rgba(0,0,0,.3)'}}>
              {img?.url&&<div style={{background:'#1a2733'}}>
                <img src={rv(img.url)} alt="" style={{width:'100%',maxHeight:130,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
              </div>}
              {cab?.conteudo&&<div style={{padding:'10px 12px 4px'}}>
                <p style={{fontSize:13,fontWeight:700,color:'#e9edef',margin:0,lineHeight:1.35}}>{rv(cab.conteudo)}</p>
              </div>}
              {txts.map((b,i)=>(
                <div key={i} style={{padding:'5px 12px 3px'}}>
                  <p style={{fontSize:12,color:'#e9edef',lineHeight:1.65,margin:0,whiteSpace:'pre-wrap'}}
                    dangerouslySetInnerHTML={{__html:rv(b.conteudo||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br/>').replace(/\*([^*\n]+)\*/g,'<strong>$1</strong>').replace(/_([^_\n]+)_/g,'<em>$1</em>')}}/>
                </div>
              ))}
              {rod?.conteudo&&<div style={{padding:'2px 12px 5px'}}>
                <p style={{fontSize:10,color:'#8696a0',margin:0}}>{rv(rod.conteudo)}</p>
              </div>}
              <div style={{padding:'2px 10px 8px',display:'flex',justifyContent:'flex-end',alignItems:'center',gap:3}}>
                <span style={{fontSize:9,color:'#8696a0'}}>{hora}</span>
                <span style={{fontSize:11,color:'#53bdeb'}}>✓✓</span>
              </div>
              {bts.length>0&&(
                <div style={{borderTop:'1px solid #2a3942'}}>
                  {bts.map((b,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'center',
                      gap:6,padding:'9px 12px',borderTop:i>0?'1px solid #2a3942':'none',
                      color:'#00a884',cursor:'pointer',fontSize:12,fontWeight:500}}>
                      {b.tipo==='ligar'?<Phone size={11}/>:b.tipo==='link'?<LinkIcon size={11}/>:<MousePointer size={11}/>}
                      {rv(b.texto||b.url||'Botão')}
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
    <div style={{maxWidth:290,margin:'0 auto',userSelect:'none',position:'relative'}}>
      {/* ── Moldura do celular ── */}
      <div style={{
        borderRadius:44,overflow:'hidden',
        background:'linear-gradient(160deg,#1a252e,#111c24)',
        border:'8px solid #0d1820',
        boxShadow:'0 0 0 1px rgba(255,255,255,.07) inset, 0 24px 60px rgba(0,0,0,.7), 0 0 0 12px rgba(10,20,28,.4)',
        position:'relative',
      }}>
        {/* Status bar */}
        <div style={{background:'#111b21',padding:'10px 18px 5px',
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:10,color:'#9aa4ae',fontWeight:600}}>{hora}</span>
          {/* Notch */}
          <div style={{width:68,height:16,borderRadius:99,background:'#0d1820',
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#1a2733'}}/>
          </div>
          <div style={{display:'flex',gap:4,alignItems:'center'}}>
            <svg width="14" height="10" viewBox="0 0 14 10"><rect x="1" y="3" width="2" height="7" rx="1" fill="#9aa4ae"/><rect x="4.5" y="2" width="2" height="8" rx="1" fill="#9aa4ae"/><rect x="8" y="0.5" width="2" height="9.5" rx="1" fill="#9aa4ae"/><rect x="11.5" y="0" width="2" height="10" rx="1" fill="#9aa4ae" opacity=".3"/></svg>
            <svg width="16" height="10" viewBox="0 0 16 10"><rect x="0.5" y="0.5" width="13" height="9" rx="2.5" stroke="#9aa4ae" strokeWidth="1.2" fill="none"/><rect x="14" y="3" width="1.5" height="4" rx="1" fill="#9aa4ae" opacity=".5"/><rect x="2" y="2.5" width="9" height="5" rx="1.5" fill="#9aa4ae"/></svg>
          </div>
        </div>

        {/* WhatsApp header */}
        <div style={{background:'#202c33',padding:'8px 12px',
          display:'flex',alignItems:'center',gap:9,
          borderBottom:'1px solid rgba(255,255,255,.04)'}}>
          <ChevronLeft size={20} style={{color:'#00a884',flexShrink:0}}/>
          <div style={{width:36,height:36,borderRadius:'50%',flexShrink:0,
            background:'linear-gradient(135deg,#00a884,#006855)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:14,fontWeight:700,color:'#fff',
            boxShadow:'0 2px 8px rgba(0,168,132,.3)'}}>S</div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:13,fontWeight:700,color:'#e9edef',margin:0,lineHeight:1.2}}>Só Strass</p>
            <p style={{fontSize:10,color:'#8696a0',margin:0}}>mensagem automática</p>
          </div>
          <div style={{display:'flex',gap:12,flexShrink:0}}>
            <Phone size={16} style={{color:'#aab8c2'}}/>
            <MoreHorizontal size={16} style={{color:'#aab8c2'}}/>
          </div>
        </div>

        {/* Chat area */}
        <div style={{
          background:'#0b141a',
          minHeight:140,maxHeight:420,
          overflowY:'auto',
          padding:'10px 10px 14px',
        }}>
          {/* Data pill */}
          <div style={{display:'flex',justifyContent:'center',marginBottom:10}}>
            <span style={{fontSize:10,color:'#8696a0',background:'rgba(11,20,26,.85)',
              padding:'3px 10px',borderRadius:8,border:'1px solid rgba(255,255,255,.05)'}}>
              {new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})}
            </span>
          </div>
          {vazio ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',
              padding:'20px 0',opacity:.25}}>
              <MessageSquare size={22} style={{color:'#8696a0'}}/>
              <p style={{fontSize:10,color:'#8696a0',marginTop:6,margin:'6px 0 0'}}>Configure os blocos</p>
            </div>
          ) : (
            <PreviewBolha blocos={blocos}/>
          )}
        </div>

        {/* Input bar */}
        <div style={{background:'#202c33',padding:'7px 10px',
          display:'flex',alignItems:'center',gap:7}}>
          <div style={{flex:1,background:'#2a3942',borderRadius:22,
            padding:'8px 14px',fontSize:12,color:'#8696a0',
            border:'1px solid rgba(255,255,255,.04)'}}>
            Mensagem...
          </div>
          <div style={{width:36,height:36,borderRadius:'50%',background:'#00a884',flexShrink:0,
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 2px 8px rgba(0,168,132,.3)'}}>
            <Send size={14} style={{color:'#fff',transform:'translate(1px,-1px)'}}/>
          </div>
        </div>
      </div>

      {!vazio&&(
        <p style={{fontSize:9,color:T.ink4,textAlign:'center',marginTop:8}}>
          Preview com dados de exemplo
        </p>
      )}
    </div>
  )
}


// ── Contador de caracteres com semáforo visual ────────────────────────────────
// limites oficiais Meta: cabeçalho=60, corpo=1024, rodapé=60, botão=25/20
function CharCount({ text='', limit }) {
  const len = (text||'').length
  if (len === 0) return null
  const pct  = len / limit
  const cor  = pct >= 1 ? T.red : pct >= 0.85 ? T.amber : T.ink4
  const dim  = pct >= 1 ? T.redDim : pct >= 0.85 ? T.amberDim : 'transparent'
  const over = len > limit
  return (
    <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:6}}>
      {pct >= 0.85 && (
        <span style={{fontSize:9,fontWeight:700,color:cor}}>
          {over ? `⚠ ${len-limit} acima do limite` : `${limit-len} restantes`}
        </span>
      )}
      <span style={{fontSize:10,fontWeight:700,color:cor,
        background:dim,padding:'1px 6px',borderRadius:4,
        fontVariantNumeric:'tabular-nums'}}>
        {len}/{limit}
      </span>
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
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0"}}>
      <div style={{flex:1,height:1,borderTop:"1px dashed var(--sep)"}}/>
      <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:99,fontSize:10,fontWeight:600,background:"var(--bg-3)",color:"var(--label-3)",border:"1px solid var(--sep)"}}><Plus size={8}/> Nova mensagem separada</div>
      <div style={{flex:1,height:1,borderTop:"1px dashed var(--sep)"}}/>
      <button onClick={onDelete} style={{color:'var(--label-4)'}}><X size={11}/></button>
    </div>
  )
  return (
    <div style={{borderRadius:12,overflow:"hidden",transition:"all .15s",border:`1px solid ${aberto?def.cor+'30':'var(--sep)'}`,background:'var(--bg-2)',marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:'var(--bg-3)',borderBottom:aberto?'1px solid var(--sep)':'none'}}>
        <GripVertical size={12} style={{color:'var(--label-4)',cursor:'grab'}}/>
        <div style={{width:16,height:16,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:`${def.cor}20`}}><Ic size={10} style={{color:def.cor}}/></div>
        <span style={{fontSize:11,fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:'var(--label-2)'}}>
          {def.label}{b.tipo==='texto'&&b.conteudo?<span style={{fontWeight:400,marginLeft:4,color:'var(--label-4)'}}> — {b.conteudo.slice(0,30).replace(/\n/g,' ')}{b.conteudo.length>30?'…':''}</span>:null}
        </span>
        <div style={{display:"flex",alignItems:"center",gap:2}}>
          <button onClick={()=>onMove(idx,-1)} disabled={idx===0} style={{padding:2,borderRadius:4,color:"var(--label-4)",background:"none",border:"none",cursor:"pointer",display:"flex"}}><ChevronUp size={10}/></button>
          <button onClick={()=>onMove(idx,1)} disabled={idx===total-1} style={{padding:2,borderRadius:4,color:"var(--label-4)",background:"none",border:"none",cursor:"pointer",display:"flex"}}><ChevronDown size={10}/></button>
          <button onClick={onDuplicate} style={{padding:2,borderRadius:4,color:"var(--label-4)",background:"none",border:"none",cursor:"pointer",display:"flex"}}><Copy size={10}/></button>
          <button onClick={()=>setAberto(v=>!v)} style={{padding:2,borderRadius:4,color:"var(--label-4)",background:"none",border:"none",cursor:"pointer",display:"flex"}}>{aberto?<ChevronUp size={10}/>:<ChevronDown size={10}/>}</button>
          <button onClick={onDelete} style={{padding:2,borderRadius:4,color:"var(--label-4)",background:"none",border:"none",cursor:"pointer",display:"flex"}}><X size={10}/></button>
        </div>
      </div>
      {aberto&&(
        <div style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>

          {/* CABEÇALHO — limite Meta: 60 chars */}
          {b.tipo==='cabecalho'&&(
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:2}}>
                <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--label-4)'}}>
                  Cabeçalho <span style={{fontWeight:400,letterSpacing:0,textTransform:'none'}}>— título em negrito no topo</span>
                </span>
                <span style={{fontSize:9,color:'var(--label-4)'}}>limite: 60 chars</span>
              </div>
              <input id={`bloco-${b.id}`} value={b.conteudo||''} maxLength={70}
                onChange={e=>onChange({...b,conteudo:e.target.value})}
                placeholder="Emoji + título breve"
                style={{...sty,
                  borderColor:(b.conteudo||'').length>55?((b.conteudo||'').length>=60?T.red:T.amber):'var(--sep)'
                }}/>
              <CharCount text={b.conteudo} limit={60}/>
              {(b.conteudo||'').length>60&&(
                <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',borderRadius:7,background:T.redDim,border:`1px solid ${T.redBor}`}}>
                  <AlertTriangle size={11} style={{color:T.red,flexShrink:0}}/>
                  <span style={{fontSize:11,color:T.red,fontWeight:600}}>Cabeçalho excede 60 caracteres — a Meta vai rejeitar o template.</span>
                </div>
              )}
              <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                <EmojiPicker onInsert={v=>inserirVar(v,`bloco-${b.id}`)}/>
                <VarPills vars={vars} onInsert={v=>inserirVar(v,`bloco-${b.id}`)}/>
              </div>
            </div>
          )}

          {/* TEXTO (CORPO) — limite Meta: 1024 chars */}
          {b.tipo==='texto'&&(
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:2}}>
                <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--label-4)'}}>
                  Corpo <span style={{fontWeight:400,letterSpacing:0,textTransform:'none'}}>{'— *negrito* _itálico_ {{variável}}'}</span>
                </span>
                <span style={{fontSize:9,color:'var(--label-4)'}}>limite: 1024 chars</span>
              </div>
              <textarea id={`bloco-${b.id}`} value={b.conteudo||''}
                onChange={e=>onChange({...b,conteudo:e.target.value})}
                placeholder="Olá *{{nome_cliente}}*!..."
                rows={7} style={{...sty,resize:'vertical',minHeight:140,lineHeight:1.7,
                  borderColor:(b.conteudo||'').length>900?((b.conteudo||'').length>=1024?T.red:T.amber):'var(--sep)'
                }}/>
              <CharCount text={b.conteudo} limit={1024}/>
              {(b.conteudo||'').length>=1024&&(
                <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',borderRadius:7,background:T.redDim,border:`1px solid ${T.redBor}`}}>
                  <AlertTriangle size={11} style={{color:T.red,flexShrink:0}}/>
                  <span style={{fontSize:11,color:T.red,fontWeight:600}}>Corpo excede 1024 caracteres — a Meta vai rejeitar o template.</span>
                </div>
              )}
              <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                <EmojiPicker onInsert={v=>inserirVar(v,`bloco-${b.id}`)}/>
                <VarPills vars={vars} onInsert={v=>inserirVar(v,`bloco-${b.id}`)}/>
              </div>
            </div>
          )}

          {/* RODAPÉ — limite Meta: 60 chars */}
          {b.tipo==='rodape'&&(
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:2}}>
                <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--label-4)'}}>
                  Rodapé <span style={{fontWeight:400,letterSpacing:0,textTransform:'none'}}>— aparece em itálico, menor</span>
                </span>
                <span style={{fontSize:9,color:'var(--label-4)'}}>limite: 60 chars</span>
              </div>
              <input value={b.conteudo||''} maxLength={70}
                onChange={e=>onChange({...b,conteudo:e.target.value})}
                placeholder="Ex: Mensagem automática — não responda."
                style={{...sty,
                  borderColor:(b.conteudo||'').length>50?((b.conteudo||'').length>=60?T.red:T.amber):'var(--sep)'
                }}/>
              <CharCount text={b.conteudo} limit={60}/>
              {(b.conteudo||'').length>60&&(
                <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',borderRadius:7,background:T.redDim,border:`1px solid ${T.redBor}`}}>
                  <AlertTriangle size={11} style={{color:T.red,flexShrink:0}}/>
                  <span style={{fontSize:11,color:T.red,fontWeight:600}}>Rodapé excede 60 caracteres — a Meta vai rejeitar o template.</span>
                </div>
              )}
            </div>
          )}

          {/* IMAGEM */}
          {b.tipo==='imagem'&&(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <input value={b.url||''} onChange={e=>onChange({...b,url:e.target.value})}
                placeholder="URL da imagem ou {{foto_produto}}"
                style={{...sty,fontFamily:'monospace',fontSize:12}}/>
              <VarPills vars={['{{foto_produto}}',...vars.filter(v=>v.includes('foto'))]}
                onInsert={v=>onChange({...b,url:(b.url||'')+v})}/>
              <input value={b.legenda||''} onChange={e=>onChange({...b,legenda:e.target.value})}
                placeholder="Legenda (opcional)" style={{...sty,fontSize:12}}/>
            </div>
          )}

          {b.tipo==='video'&&<input value={b.url||''} onChange={e=>onChange({...b,url:e.target.value})} placeholder="URL do vídeo" style={{...sty,fontFamily:'monospace',fontSize:12}}/>}
          {b.tipo==='audio'&&<input value={b.url||''} onChange={e=>onChange({...b,url:e.target.value})} placeholder="URL do áudio" style={{...sty,fontFamily:'monospace',fontSize:12}}/>}

          {/* BOTÃO — limite: 25 chars (URL/CTA) ou 20 chars (reply) */}
          {b.tipo==='botao'&&(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:4}}>
                  <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--label-4)'}}>Texto do botão</span>
                  <span style={{fontSize:9,color:'var(--label-4)'}}>limite: {b.acao==='reply'?20:25} chars</span>
                </div>
                <input value={b.texto||''} maxLength={b.acao==='reply'?25:30}
                  onChange={e=>onChange({...b,texto:e.target.value})}
                  placeholder={`Texto (máx. ${b.acao==='reply'?20:25} chars)`}
                  style={{...sty,
                    borderColor:(b.texto||'').length>(b.acao==='reply'?18:22)?((b.texto||'').length>=(b.acao==='reply'?20:25)?T.red:T.amber):'var(--sep)'
                  }}/>
                <CharCount text={b.texto} limit={b.acao==='reply'?20:25}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                {[['reply','💬 Resposta'],['url','🔗 Link'],['tel','📞 Ligar']].map(([v,l])=>(
                  <button key={v} onClick={()=>onChange({...b,acao:v})}
                    style={{padding:"7px 4px",borderRadius:7,fontSize:10,fontWeight:600,cursor:"pointer",
                      background:b.acao===v?'var(--accent-dim)':'var(--bg)',
                      color:b.acao===v?'var(--accent)':'var(--label-3)',
                      border:b.acao===v?'1px solid var(--accent-border)':'1px solid var(--sep)'}}>
                    {l}
                  </button>
                ))}
              </div>
              {(b.acao==='url'||b.acao==='tel')&&(
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  <input value={b.valor||''} onChange={e=>onChange({...b,valor:e.target.value})}
                    placeholder={b.acao==='tel'?'55119... (com DDI)':'https://...'}
                    style={{...sty,fontFamily:'monospace',fontSize:11}}/>
                  {b.acao==='url'&&<VarPills vars={vars} onInsert={v=>onChange({...b,valor:(b.valor||'')+v})}/>}
                </div>
              )}
            </div>
          )}

          {b.tipo==='link'&&(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:4}}>
                  <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--label-4)'}}>Texto do link</span>
                  <span style={{fontSize:9,color:'var(--label-4)'}}>limite: 25 chars</span>
                </div>
                <input value={b.texto||''} onChange={e=>onChange({...b,texto:e.target.value})}
                  placeholder="Texto do link" maxLength={30} style={sty}/>
                <CharCount text={b.texto} limit={25}/>
              </div>
              <input value={b.url||''} onChange={e=>onChange({...b,url:e.target.value})}
                placeholder="URL" style={{...sty,fontFamily:'monospace',fontSize:12}}/>
              <VarPills vars={vars} onInsert={v=>onChange({...b,url:(b.url||'')+v})}/>
            </div>
          )}

          {b.tipo==='ligar'&&(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:4}}>
                  <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--label-4)'}}>Texto do botão</span>
                  <span style={{fontSize:9,color:'var(--label-4)'}}>limite: 20 chars</span>
                </div>
                <input value={b.texto||''} onChange={e=>onChange({...b,texto:e.target.value})}
                  placeholder="Ligar agora" maxLength={25} style={sty}/>
                <CharCount text={b.texto} limit={20}/>
              </div>
              <input value={b.valor||''} onChange={e=>onChange({...b,valor:e.target.value})}
                placeholder="55119... (com DDI)" style={{...sty,fontFamily:'monospace',fontSize:12}}/>
            </div>
          )}

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
  return <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{vars.map(v=><button key={v} onClick={()=>onInsert(v)} style={{padding:'2px 6px',borderRadius:4,fontSize:9,fontFamily:'monospace',background:'var(--accent-dim)',color:'var(--accent)',border:'1px solid var(--accent-border)',cursor:'pointer'}}>{v}</button>)}</div>
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
// ── PLANO DE DISPAROS ─────────────────────────────────────────────────────────
function PlanodeDisparos({ gatilhos, configs, atividade, onSelect, api }) {
  const [numPedido, setNumPedido] = useState('')
  const [checando,  setChecando]  = useState(false)
  const [resultado, setResultado] = useState(null)
  // Drag and drop na sequência
  const [seqLocal,  setSeqLocal]  = useState([
    { id:'aguardando_retirada', nivel:0 },
    { id:'pedido_coletado',     nivel:1 },
    { id:'rastreio_em_transito',nivel:2 },
    { id:'saiu_entrega',        nivel:3 },
    { id:'pedido_entregue',     nivel:4 },
  ])
  const [salvandoSeq, setSalvandoSeq] = useState(false)
  const [seqSalva,    setSeqSalva]    = useState(false)
  const dragIdx = useRef(null)

  // Carrega sequência salva no banco
  useEffect(() => {
    fetch(`${api}/api/dashboard/gatilhos/plano`)
      .then(r=>r.json()).then(d=>{
        if (d?.niveis) {
          const sorted = Object.entries(d.niveis)
            .sort(([,a],[,b])=>a-b)
            .map(([id,nivel])=>({id,nivel}))
          if (sorted.length) setSeqLocal(sorted)
        }
      }).catch(()=>{})
  }, [api])

  const salvarSeq = async (novaSeq) => {
    setSalvandoSeq(true)
    const niveis = Object.fromEntries(novaSeq.map((item,i)=>[item.id,i]))
    try {
      await fetch(`${api}/api/dashboard/gatilhos/plano`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ niveis, excecoes:EXCECOES_RASTREIO, uma_vez:['pedido_entregue','pacote_devolvido'] })
      })
      setSeqSalva(true); setTimeout(()=>setSeqSalva(false),2000)
    } catch {}
    setSalvandoSeq(false)
  }

  const onDragStart = (i) => { dragIdx.current = i }
  const onDragOver  = (e) => { e.preventDefault() }
  const onDrop      = (i) => {
    if (dragIdx.current===null || dragIdx.current===i) return
    const nova = [...seqLocal]
    const [item] = nova.splice(dragIdx.current, 1)
    nova.splice(i, 0, item)
    const comNivel = nova.map((x,idx)=>({...x,nivel:idx}))
    setSeqLocal(comNivel)
    dragIdx.current = null
    salvarSeq(comNivel)
  }

  const verificar = async () => {
    if (!numPedido.trim()) return
    setChecando(true); setResultado(null)
    try {
      const r = await fetch(`${api}/api/dashboard/disparos-log?busca=${numPedido}&limite=100`)
      const d = await r.json()
      const disparos = (d.disparos||[]).filter(x=>String(x.numero_pedido)===String(numPedido.trim()))
      setResultado({ pedido: numPedido.trim(), disparos })
    } catch { setResultado({ pedido: numPedido.trim(), disparos: [] }) }
    setChecando(false)
  }

  const EXCECOES_RASTREIO = ['tentativa_entrega','nao_entrou_unidade','endereco_incorreto','nao_entregue','pacote_devolvido']

  const statusDe = (id) => {
    const cfg = configs[id]
    if (!cfg) return 'criar'
    if (!cfg.ativo) return 'off'
    return 'on'
  }
  const qtdDe = (id) => atividade[id] || 0

  const STATUS_COR = { on:'#22c55e', off:'#f59e0b', criar:'#ef4444' }
  const STATUS_LBL = { on:'ativo', off:'aguardando', criar:'criar' }
  const GRUPOS_PLANO = ['Compra & Pagamento','Preparação & Nota','Pós-venda']

  const CardGatilho = ({g, excecao}) => {
    const st = statusDe(g.id)
    const qt = qtdDe(g.id)
    const GIc = g.icon
    const disparouNoPedido = resultado?.disparos?.some(d=>d.gatilho===g.id)
    const faltouNoPedido   = resultado && !disparouNoPedido && !excecao
    return (
      <div onClick={()=>onSelect(g.id)} title="Editar template"
        style={{cursor:'pointer',borderRadius:10,padding:'10px 12px',
          border:`0.5px solid ${faltouNoPedido?'rgba(239,68,68,.4)':disparouNoPedido?'rgba(34,197,94,.3)':'var(--sep)'}`,
          background:faltouNoPedido?'rgba(239,68,68,.04)':disparouNoPedido?'rgba(34,197,94,.04)':'var(--bg)',
          display:'flex',gap:10,alignItems:'flex-start',transition:'all .12s',
          boxShadow:'0 1px 4px rgba(0,0,0,.12)'}}
        onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.22)';e.currentTarget.style.transform='translateY(-1px)'}}
        onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.12)';e.currentTarget.style.transform='none'}}>
        <div style={{width:30,height:30,borderRadius:8,flexShrink:0,
          background:`${g.cor}18`,border:`0.5px solid ${g.cor}30`,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          {GIc && <GIc size={14} style={{color:g.cor}}/>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11.5,fontWeight:600,color:'var(--label)',
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:4}}>{g.label}</div>
          <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
            <span style={{fontSize:9,padding:'1px 6px',borderRadius:99,
              background:`${STATUS_COR[st]}15`,color:STATUS_COR[st],
              border:`0.5px solid ${STATUS_COR[st]}30`,fontWeight:600}}>
              {STATUS_LBL[st]}
            </span>
            {qt>0 && <span style={{fontSize:9,color:'var(--label-4)'}}>{qt}/7d</span>}
          </div>
        </div>
        {resultado && (
          <div style={{flexShrink:0,width:18,height:18,borderRadius:'50%',
            display:'flex',alignItems:'center',justifyContent:'center',
            background:disparouNoPedido?'rgba(34,197,94,.2)':faltouNoPedido?'rgba(239,68,68,.1)':'transparent',
            border:disparouNoPedido?'1px solid #22c55e':faltouNoPedido?'1px solid rgba(239,68,68,.3)':'none'}}>
            {disparouNoPedido&&<Check size={10} style={{color:'#22c55e'}}/>}
            {faltouNoPedido&&<XCircle size={10} style={{color:'#ef4444'}}/>}
          </div>
        )}
      </div>
    )
  }

  const SOMBRA_SECAO = '0 4px 24px rgba(0,0,0,.2), 0 1px 0 rgba(255,255,255,.04) inset'

  return (
    <div style={{flex:1,minHeight:0,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:16,fontFamily:'"DM Sans", system-ui, sans-serif'}}>
      <style>{`
        .plan-seq-card{transition:all .15s cubic-bezier(.2,.8,.2,1)}
        .plan-seq-card:hover{box-shadow:0 8px 28px rgba(0,0,0,.3)!important;transform:translateY(-2px)}
        .plan-seq-card.dragging{opacity:.4;transform:scale(.97)}
        .plan-seq-card.drag-over{outline:2px dashed #7c6af7;outline-offset:2px}
      `}</style>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:'var(--label)',letterSpacing:'-.02em',display:'flex',alignItems:'center',gap:8}}>
            <SlidersHorizontal size={17} style={{color:'#7c6af7'}}/>
            Plano de disparos
          </div>
          <div style={{fontSize:11,color:'var(--label-4)',marginTop:2}}>
            Sequência, status e regras — clique para editar · arraste para reordenar
          </div>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {seqSalva && (
            <span style={{fontSize:11,color:'#22c55e',display:'flex',alignItems:'center',gap:4}}>
              <Check size={11}/>Sequência salva
            </span>
          )}
          <input value={numPedido} onChange={e=>setNumPedido(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&verificar()}
            placeholder="Nº do pedido..." style={{
            padding:'6px 10px',borderRadius:8,fontSize:12,width:130,
            border:'0.5px solid var(--sep)',background:'var(--bg)',color:'var(--label)'}}/>
          <button onClick={verificar} disabled={!numPedido.trim()||checando} style={{
            display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,
            background:'rgba(124,106,247,.1)',border:'0.5px solid rgba(124,106,247,.25)',
            color:'#7c6af7',cursor:numPedido.trim()?'pointer':'not-allowed',fontSize:12,fontWeight:600}}>
            {checando?<><RefreshCw size={11} style={{animation:'spin .7s linear infinite'}}/>Checando...</>:<><Activity size={11}/>Verificar</>}
          </button>
          {resultado && (
            <button onClick={()=>setResultado(null)} style={{display:'flex',alignItems:'center',padding:4,borderRadius:6,background:'none',border:'none',cursor:'pointer',color:'var(--label-4)'}}>
              <X size={13}/>
            </button>
          )}
        </div>
      </div>

      {resultado && (
        <div style={{padding:'10px 14px',borderRadius:10,background:'var(--fill)',border:'0.5px solid var(--sep)',
          boxShadow:SOMBRA_SECAO}}>
          <div style={{fontSize:11,fontWeight:600,color:'var(--label)',marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
            <Activity size={12} style={{color:'#7c6af7'}}/>
            Pedido #{resultado.pedido} — {resultado.disparos.length} disparo(s) registrado(s)
          </div>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',fontSize:10.5,color:'var(--label-4)'}}>
            <span style={{color:'#22c55e'}}>✓ verde = disparou</span>
            <span style={{color:'#f59e0b'}}>⏳ laranja = ignorado</span>
            <span style={{color:'#ef4444'}}>✗ vermelho = não disparou</span>
          </div>
        </div>
      )}

      {/* Grupos normais */}
      {GRUPOS_PLANO.map(grupo => {
        const gs = gatilhos.filter(g=>g.grupo===grupo)
        if (!gs.length) return null
        const COR_GRUPO = {'Compra & Pagamento':'#00d4aa','Preparação & Nota':'#8b5cf6','Pós-venda':'#f87171'}[grupo]||'#7c6af7'
        return (
          <div key={grupo} style={{background:'var(--bg-2)',border:'0.5px solid var(--sep)',borderRadius:14,overflow:'hidden',boxShadow:SOMBRA_SECAO}}>
            <div style={{padding:'10px 14px',borderBottom:'0.5px solid var(--sep)',background:'var(--bg-3)',
              display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:COR_GRUPO,flexShrink:0,
                boxShadow:`0 0 6px ${COR_GRUPO}`}}/>
              <span style={{fontSize:12,fontWeight:600,color:'var(--label)',letterSpacing:'-.01em'}}>{grupo}</span>
              <span style={{fontSize:10,color:'var(--label-4)',marginLeft:'auto'}}>
                {gs.filter(g=>statusDe(g.id)==='on').length}/{gs.length} ativos
              </span>
            </div>
            <div style={{padding:'10px',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:6}}>
              {gs.map(g => <CardGatilho key={g.id} g={g}/>)}
            </div>
          </div>
        )
      })}

      {/* Envio & Rastreio — SEQUÊNCIA RÍGIDA com DRAG AND DROP */}
      <div style={{background:'var(--bg-2)',border:'0.5px solid rgba(74,159,255,.35)',borderRadius:14,overflow:'hidden',boxShadow:SOMBRA_SECAO}}>
        <div style={{padding:'10px 14px',borderBottom:'0.5px solid rgba(74,159,255,.2)',
          background:'rgba(74,159,255,.04)',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#4a9fff',flexShrink:0,boxShadow:'0 0 6px #4a9fff'}}/>
          <span style={{fontSize:12,fontWeight:600,color:'var(--label)',letterSpacing:'-.01em'}}>Envio & Rastreio</span>
          <span style={{fontSize:9.5,padding:'2px 8px',borderRadius:99,
            background:'rgba(74,159,255,.1)',color:'#4a9fff',border:'0.5px solid rgba(74,159,255,.2)',fontWeight:600}}>
            sequência rígida · anti-atropelamento
          </span>
          {salvandoSeq && (
            <span style={{fontSize:10,color:'var(--label-4)',display:'flex',alignItems:'center',gap:4,marginLeft:'auto'}}>
              <RefreshCw size={10} style={{animation:'spin .7s linear infinite'}}/>Salvando...
            </span>
          )}
          <span style={{fontSize:10,color:'var(--label-4)',marginLeft:salvandoSeq?0:'auto',
            display:'flex',alignItems:'center',gap:4}}>
            <GripVertical size={12}/>arraste para reordenar
          </span>
        </div>
        <div style={{padding:'12px'}}>
          {/* Sequência DRAGGABLE */}
          <div style={{fontSize:10.5,fontWeight:600,color:'var(--label-4)',marginBottom:8,
            textTransform:'uppercase',letterSpacing:'.04em'}}>Sequência (arraste para reordenar)</div>
          <div style={{display:'flex',gap:0,alignItems:'stretch',marginBottom:16,overflowX:'auto',paddingBottom:4}}>
            {seqLocal.map((item, i) => {
              const g = gatilhos.find(x=>x.id===item.id)
              if (!g) return null
              const st = statusDe(g.id)
              const qt = qtdDe(g.id)
              const GIc = g.icon
              const disparouNoPedido = resultado?.disparos?.some(d=>d.gatilho===g.id)
              return (
                <div key={g.id} style={{display:'flex',alignItems:'center'}}>
                  <div className="plan-seq-card"
                    draggable
                    onDragStart={()=>onDragStart(i)}
                    onDragOver={e=>{e.preventDefault();e.currentTarget.classList.add('drag-over')}}
                    onDragLeave={e=>e.currentTarget.classList.remove('drag-over')}
                    onDrop={e=>{e.currentTarget.classList.remove('drag-over');onDrop(i)}}
                    onClick={()=>onSelect(g.id)}
                    title={`Nível ${item.nivel} · arraste para mover · clique para editar`}
                    style={{cursor:'grab',minWidth:130,borderRadius:12,padding:'12px 10px',
                      border:`0.5px solid ${disparouNoPedido?'rgba(34,197,94,.4)':st==='on'?'rgba(74,159,255,.3)':'var(--sep)'}`,
                      background:disparouNoPedido?'rgba(34,197,94,.06)':st==='on'?'rgba(74,159,255,.05)':'var(--bg)',
                      display:'flex',flexDirection:'column',gap:7,alignItems:'center',textAlign:'center',
                      boxShadow:'0 2px 10px rgba(0,0,0,.18)',userSelect:'none'}}>
                    {/* grip */}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',opacity:.4}}>
                      <GripVertical size={10} style={{color:'var(--label-4)'}}/>
                      <span style={{fontSize:9,color:'#4a9fff',fontWeight:700}}>N{item.nivel}</span>
                    </div>
                    <div style={{width:34,height:34,borderRadius:10,
                      background:`${g.cor}18`,border:`0.5px solid ${g.cor}30`,
                      display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {GIc && <GIc size={16} style={{color:g.cor}}/>}
                    </div>
                    <div style={{fontSize:11,fontWeight:600,color:'var(--label)',lineHeight:1.3}}>{g.label}</div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                      <span style={{fontSize:9,padding:'2px 7px',borderRadius:99,
                        background:`${STATUS_COR[st]}15`,color:STATUS_COR[st],fontWeight:600}}>
                        {STATUS_LBL[st]}
                      </span>
                      {qt>0 && <span style={{fontSize:9,color:'var(--label-4)'}}>{qt}/7d</span>}
                    </div>
                    {resultado && (
                      <div style={{width:18,height:18,borderRadius:'50%',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        background:disparouNoPedido?'rgba(34,197,94,.2)':'rgba(239,68,68,.1)',
                        border:`1px solid ${disparouNoPedido?'#22c55e':'rgba(239,68,68,.3)'}`}}>
                        {disparouNoPedido?<Check size={9} style={{color:'#22c55e'}}/>:<XCircle size={9} style={{color:'#ef4444'}}/>}
                      </div>
                    )}
                  </div>
                  {i < seqLocal.length-1 && (
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'0 3px',flexShrink:0}}>
                      <ArrowRight size={13} style={{color:'var(--label-4)'}}/>
                      <span style={{fontSize:8,color:'var(--label-4)',marginTop:1,whiteSpace:'nowrap'}}>bloqueia</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Exceções */}
          <div style={{fontSize:10.5,fontWeight:600,color:'var(--label-4)',marginBottom:8,
            textTransform:'uppercase',letterSpacing:'.04em'}}>Exceções — disparam a qualquer momento</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:6}}>
            {gatilhos.filter(g=>g.grupo==='Envio & Rastreio' && !seqLocal.find(s=>s.id===g.id)).map(g=>(
              <CardGatilho key={g.id} g={g} excecao/>
            ))}
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div style={{display:'flex',gap:14,flexWrap:'wrap',paddingBottom:8,fontSize:10,color:'var(--label-4)'}}>
        {[['#22c55e','ativo'],['#f59e0b','aguardando ativação'],['#ef4444','criar + aprovar Meta']].map(([c,l])=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:5}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:c,boxShadow:`0 0 5px ${c}`}}/>
            {l}
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper: tempo relativo (ex: "há 2h", "ontem", "3 dias")
// ─── INSIGHT CARD para PageGatilhos ──────────────────────────────────────────
// Idêntico ao InsightCard do PageDisparos mas com "Ver gatilho" como ação
function InsightCardGat({ ins, onDismiss, onGoto }) {
  const [detalhe, setDetalhe] = useState(false)
  const cfg = {
    critico:      {cor:T.red,   dim:T.redDim,   bor:T.redBor,   Ic:AlertTriangle, lbl:'CRÍTICO'},
    aviso:        {cor:T.amber, dim:T.amberDim, bor:T.amberBor, Ic:Clock,         lbl:'ATENÇÃO'},
    oportunidade: {cor:T.blue,  dim:T.blueDim,  bor:T.blueBor,  Ic:Star,          lbl:'OPORTUNIDADE'},
    positivo:     {cor:T.green, dim:T.greenDim, bor:T.greenBor, Ic:Activity,      lbl:'POSITIVO'},
  }[ins.tipo] || {cor:T.ink3, dim:T.gray, bor:T.grayBor, Ic:Info, lbl:'INFO'}
  const {cor, dim, bor, Ic, lbl} = cfg

  return (
    <div style={{borderRadius:11, padding:'12px 14px', background:dim,
      border:`1px solid ${bor}`, animation:'fadeIn .3s ease'}}>
      <div style={{display:'flex', alignItems:'flex-start', gap:10}}>
        <div style={{width:32, height:32, borderRadius:9, background:`${cor}18`,
          border:`1px solid ${bor}`, display:'flex', alignItems:'center',
          justifyContent:'center', flexShrink:0, marginTop:1}}>
          <Ic size={15} style={{color:cor}}/>
        </div>
        <div style={{flex:1, minWidth:0}}>
          {/* badges de severidade + métrica */}
          <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:5, flexWrap:'wrap'}}>
            <span style={{fontSize:9, padding:'1px 7px', borderRadius:99,
              background:`${cor}20`, color:cor, fontWeight:700, letterSpacing:'.04em'}}>{lbl}</span>
            {ins.afetados > 0 && (
              <span style={{fontSize:10, color:T.ink3, display:'flex', alignItems:'center', gap:3}}>
                <AlertTriangle size={9}/>{ins.afetados} disparo{ins.afetados>1?'s':''} afetados
              </span>
            )}
            {ins.dias > 0 && (
              <span style={{fontSize:10, color:T.ink4}}>{ins.dias}d sem envio</span>
            )}
          </div>

          {/* título */}
          <div style={{fontSize:13, fontWeight:600, color:T.ink1, marginBottom:4, lineHeight:1.4}}>
            {ins.titulo}
          </div>

          {/* descrição colapsável */}
          {detalhe && (
            <div style={{fontSize:11, color:T.ink2, lineHeight:1.65, marginBottom:9,
              animation:'fadeIn .2s ease', padding:'8px 10px', borderRadius:7,
              background:'rgba(255,255,255,.04)'}}>
              {ins.desc}
            </div>
          )}

          {/* ações */}
          <div style={{display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginTop:8}}>
            {ins.gatilho && onGoto && (
              <button onClick={()=>onGoto(ins.gatilho)} style={{
                display:'inline-flex', alignItems:'center', gap:5,
                padding:'5px 12px', borderRadius:7, border:'none', cursor:'pointer',
                fontSize:11, fontWeight:600,
                background:'linear-gradient(135deg,#5b21b6,#9333ea)', color:'#fff'}}>
                <Zap size={10}/>Abrir gatilho ↗
              </button>
            )}
            <button onClick={()=>setDetalhe(v=>!v)} style={{
              display:'inline-flex', alignItems:'center', gap:4,
              padding:'5px 10px', borderRadius:7, cursor:'pointer',
              fontSize:10.5, background:'transparent', border:`1px solid ${bor}`,
              color:cor, fontWeight:500}}>
              {detalhe?<ChevronUp size={10}/>:<ChevronDown size={10}/>}
              {detalhe?'Menos':'Detalhes'}
            </button>
            <button onClick={onDismiss} style={{marginLeft:'auto',
              display:'inline-flex', alignItems:'center', gap:4,
              padding:'5px 10px', borderRadius:7, cursor:'pointer',
              fontSize:10.5, background:'transparent', border:`1px solid ${T.sep}`,
              color:T.ink3, fontWeight:500}}>
              <CheckCircle size={10}/>Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── COMMAND PALETTE ⌘K para Gatilhos ────────────────────────────────────────
function CmdGatilhos({open, onClose, gatilhos, configs, onSelect, onToggle, labelDe}) {
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { if(open){ setQ(''); setTimeout(()=>inputRef.current?.focus(),50) } },[open])

  const results = q.trim()
    ? gatilhos.filter(g => labelDe(g).toLowerCase().includes(q.toLowerCase()))
    : []

  const acoes = [
    {icon:CheckCircleIc, label:'Ativar todos com template', fn:()=>{ gatilhos.filter(g=>configs[g.id]&&!configs[g.id]?.ativo).forEach(g=>onToggle(g.id)); onClose() }},
    {icon:X,            label:'Desativar todos', fn:()=>{ gatilhos.filter(g=>configs[g.id]?.ativo).forEach(g=>onToggle(g.id)); onClose() }},
  ]

  if (!open) return null
  const bg = 'rgba(13,16,23,0.94)', bdr = 'rgba(255,255,255,0.08)'
  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:200,
        background:'rgba(0,0,0,.65)',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)'}}/>
      <div style={{position:'fixed',top:'18%',left:'50%',transform:'translateX(-50%)',
        width:'min(520px,94vw)',zIndex:201,
        background:bg, backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        border:`1px solid ${bdr}`,borderRadius:16,
        boxShadow:'0 40px 100px rgba(0,0,0,.85)',animation:'slideup .2s ease'}}>
        {/* Input */}
        <div style={{padding:'12px 14px',borderBottom:`1px solid ${bdr}`,
          display:'flex',alignItems:'center',gap:10}}>
          <Search size={16} style={{color:'#6b7294',flexShrink:0}}/>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Buscar gatilho ou ação..."
            onKeyDown={e=>{ if(e.key==='Escape')onClose(); if(e.key==='Enter'&&results.length){onSelect(results[0].id);onClose()} }}
            style={{flex:1,border:'none',background:'transparent',color:'#eef0f6',
              fontSize:15,outline:'none',fontFamily:'inherit'}}/>
          <kbd style={{fontSize:10,padding:'2px 6px',borderRadius:5,flexShrink:0,
            background:'#1c2238',color:'#6b7294',border:`1px solid ${bdr}`}}>Esc</kbd>
        </div>
        {/* Conteúdo */}
        <div style={{maxHeight:340,overflowY:'auto'}}>
          {!q && (
            <div style={{padding:'8px 10px'}}>
              <div style={{fontSize:9,color:'#3a3f5c',textTransform:'uppercase',letterSpacing:'.07em',padding:'4px 4px 8px'}}>Ações rápidas</div>
              {acoes.map((a,i)=>(
                <div key={i} onClick={a.fn}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'9px 10px',
                    borderRadius:8,cursor:'pointer',transition:'background .1s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#161b2c'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{width:28,height:28,borderRadius:8,background:'#161b2c',
                    display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <a.icon size={13} style={{color:'#6b7294'}}/>
                  </div>
                  <span style={{flex:1,fontSize:13,color:'#b8bdd4'}}>{a.label}</span>
                </div>
              ))}
            </div>
          )}
          {q && results.length===0 && (
            <div style={{padding:'32px 0',textAlign:'center',color:'#6b7294',fontSize:13}}>
              Nenhum gatilho para "{q}"
            </div>
          )}
          {results.map((g,i)=>{
            const cfg  = configs[g.id]
            const ativo= cfg?.ativo
            const Icon = g.icon
            return (
              <div key={i}
                style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
                  cursor:'pointer',borderTop:`1px solid ${bdr}`,transition:'background .1s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#161b2c'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{width:34,height:34,borderRadius:9,background:`${g.cor}18`,
                  border:`0.5px solid ${g.cor}28`,display:'flex',alignItems:'center',
                  justifyContent:'center',flexShrink:0}}>
                  <Icon size={15} style={{color:g.cor}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:'#eef0f6',fontWeight:500}}>{labelDe(g)}</div>
                  <div style={{fontSize:11,color:'#6b7294',marginTop:2}}>
                    {ativo?'● Ativo':'○ Inativo'} · {g.grupo}
                  </div>
                </div>
                <div style={{display:'flex',gap:6,flexShrink:0}}>
                  <button onClick={e=>{e.stopPropagation();onSelect(g.id);onClose()}}
                    style={{padding:'4px 10px',borderRadius:7,border:'1px solid rgba(167,139,250,.25)',
                      background:'rgba(167,139,250,.08)',color:'#a78bfa',cursor:'pointer',
                      fontSize:11,fontWeight:600}}>Editar</button>
                  <button onClick={e=>{e.stopPropagation();onToggle(g.id);onClose()}}
                    style={{padding:'4px 10px',borderRadius:7,border:`1px solid ${ativo?'rgba(255,71,87,.25)':'rgba(0,230,118,.25)'}`,
                      background:ativo?'rgba(255,71,87,.08)':'rgba(0,230,118,.08)',
                      color:ativo?'#ff4757':'#00e676',cursor:'pointer',
                      fontSize:11,fontWeight:600}}>
                    {ativo?'Desativar':'Ativar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{padding:'8px 14px',borderTop:`1px solid ${bdr}`,
          display:'flex',gap:10,alignItems:'center'}}>
          <kbd style={{fontSize:10,padding:'1px 6px',borderRadius:4,background:'#1c2238',color:'#3a3f5c',border:`1px solid ${bdr}`}}>↵</kbd>
          <span style={{fontSize:10,color:'#3a3f5c'}}>editar</span>
          <span style={{marginLeft:'auto',fontSize:10,color:'#3a3f5c'}}>⌘K para fechar</span>
        </div>
      </div>
    </>
  )
}

function tempoRel(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff/60000)
  if (min < 60)   return min <= 1 ? 'agora' : `${min}min`
  const h = Math.floor(min/60)
  if (h < 24)    return `${h}h`
  const d = Math.floor(h/24)
  if (d === 1)   return 'ontem'
  return `${d}d`
}

// ─── SPARKLINE LINE (substitui barras por polyline com area) ─────────────────
function SparkCard({ serie=[], cor='#22c55e' }) {
  const data = serie
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const H = 22, W = 58
  const pts = data.map((v,i)=>`${(i/(data.length-1))*W},${H-2-(v/max)*(H-6)+2}`).join(' ')
  const area = `0,${H} ${pts} ${W},${H}`
  const gid  = `spk${cor.replace(/[^a-z0-9]/gi,'').slice(0,6)}`
  const lx=W, ly=H-2-(data[data.length-1]/max)*(H-6)+2
  return (
    <svg width={W} height={H} style={{display:'block',flexShrink:0}}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity=".3"/>
          <stop offset="100%" stopColor={cor} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`}/>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lx} cy={ly} r="2.5" fill={cor}/>
    </svg>
  )
}

// ─── SKELETON LOADING ─────────────────────────────────────────────────────────
function Skel({w='100%', h=16, r=6}) {
  return (
    <div style={{width:w, height:h, borderRadius:r,
      background:`linear-gradient(90deg,${T.bg3} 25%,${T.bg4} 50%,${T.bg3} 75%)`,
      backgroundSize:'200% 100%', animation:'shimmer 1.5s ease-in-out infinite'}}/>
  )
}



// ─── PAINEL MOLISE — copiloto de automações ────────────────────────────────
function MolisePanel({ sugestoes, sugestoesFechadas, onDismiss, onGoto, onClose }) {
  const visíveis = sugestoes.filter(s => !sugestoesFechadas[s.id||s.titulo])
  const prioMap = {
    alta:   {cor:T.red,   dim:T.redDim,   bor:T.redBor,   Ic:AlertTriangle, lbl:'CRÍTICO'},
    media:  {cor:T.amber, dim:T.amberDim, bor:T.amberBor, Ic:Clock,         lbl:'ATENÇÃO'},
    baixa:  {cor:T.blue,  dim:T.blueDim,  bor:T.blueBor,  Ic:Star,          lbl:'MELHORIA'},
  }
  const tipoIcon = {
    template_inativo: AlertTriangle,
    meta_pendente:    CheckCircle,
    gap_atividade:    Activity,
    reengajamento:    Brain,
    custo_alto:       CreditCard,
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        style={{position:'fixed',inset:0,zIndex:400,
          background:'rgba(0,0,0,.55)',backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)'}}/>

      {/* Painel */}
      <div style={{position:'fixed',top:0,right:0,bottom:0,width:440,zIndex:401,
        background:T.bg1,borderLeft:`1px solid ${T.sep2}`,
        display:'flex',flexDirection:'column',overflow:'hidden',
        boxShadow:'-24px 0 64px rgba(0,0,0,.6)',
        animation:'slideFromRight .3s cubic-bezier(.2,.8,.2,1)'}}>

        {/* Header */}
        <div style={{flexShrink:0,padding:'20px 24px 16px',
          background:`linear-gradient(135deg,${T.purpleDim},${T.bg2})`,
          borderBottom:`1px solid ${T.sep}`}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
            <div style={{width:40,height:40,borderRadius:12,
              background:`linear-gradient(135deg,${T.purple}30,${T.purple}15)`,
              border:`1px solid ${T.purpleBor}`,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:`0 4px 16px ${T.purple}20`,flexShrink:0}}>
              <Brain size={20} style={{color:T.purple}}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:16,fontWeight:700,color:T.ink1,margin:0,letterSpacing:'-.02em'}}>
                Molise
              </p>
              <p style={{fontSize:11,color:T.ink3,margin:0}}>Copiloto de automações</p>
            </div>
            <button onClick={onClose}
              style={{width:30,height:30,borderRadius:8,border:`1px solid ${T.sep2}`,
                background:T.bg4,cursor:'pointer',display:'flex',alignItems:'center',
                justifyContent:'center',color:T.ink3,flexShrink:0}}>
              <X size={14}/>
            </button>
          </div>
          <div style={{padding:'10px 14px',borderRadius:10,background:'rgba(167,139,250,.08)',
            border:`1px solid ${T.purpleBor}`}}>
            <p style={{fontSize:12,color:T.ink2,margin:0,lineHeight:1.6}}>
              Analisei seus gatilhos e encontrei{' '}
              <span style={{fontWeight:700,color:T.purple}}>{visíveis.length} oportunidade{visíveis.length!==1?'s':''}</span>
              {' '}para melhorar a performance das suas automações.
            </p>
          </div>
        </div>

        {/* Lista de sugestões */}
        <div style={{flex:1,overflowY:'auto',padding:'14px'}}>
          {visíveis.length===0 ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',
              justifyContent:'center',padding:'60px 0',gap:12}}>
              <div style={{width:48,height:48,borderRadius:14,background:T.greenDim,
                border:`1px solid ${T.greenBor}`,display:'flex',alignItems:'center',
                justifyContent:'center'}}>
                <CheckCircle size={22} style={{color:T.green}}/>
              </div>
              <p style={{fontSize:13,fontWeight:600,color:T.ink2,margin:0}}>
                Tudo em ordem!
              </p>
              <p style={{fontSize:11,color:T.ink4,textAlign:'center',margin:0}}>
                Você resolveu todas as sugestões da Molise.
              </p>
            </div>
          ) : (
            visíveis.map((s,i)=>{
              const prio  = prioMap[s.prioridade||'media'] || prioMap.media
              const {cor,dim,bor,Ic,lbl} = prio
              const TIco  = tipoIcon[s.tipo] || Sparkles
              const key   = s.id || s.titulo || i
              return (
                <div key={key} style={{marginBottom:10,borderRadius:12,
                  background:T.bg2,border:`1px solid ${T.sep2}`,overflow:'hidden',
                  animation:'fadeIn .3s ease'}}>

                  {/* Top color strip */}
                  <div style={{height:2.5,background:`linear-gradient(90deg,${cor},${cor}40)`}}/>

                  <div style={{padding:'12px 14px'}}>
                    {/* Header da sugestão */}
                    <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10}}>
                      <div style={{width:32,height:32,borderRadius:9,background:dim,
                        border:`1px solid ${bor}`,display:'flex',alignItems:'center',
                        justifyContent:'center',flexShrink:0}}>
                        <TIco size={15} style={{color:cor}}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                          <span style={{fontSize:9,padding:'1px 7px',borderRadius:99,
                            background:`${cor}20`,color:cor,fontWeight:700,letterSpacing:'.04em'}}>
                            {lbl}
                          </span>
                          {s.gatilho&&(
                            <span style={{fontSize:9,color:T.ink4,
                              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                              {s.gatilho}
                            </span>
                          )}
                        </div>
                        <p style={{fontSize:13,fontWeight:700,color:T.ink1,margin:'0 0 5px',lineHeight:1.35}}>
                          {s.titulo}
                        </p>
                        {s.descricao&&(
                          <p style={{fontSize:11,color:T.ink2,margin:0,lineHeight:1.6}}>
                            {s.descricao}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Impacto (se tiver) */}
                    {s.impacto&&(
                      <div style={{padding:'8px 11px',borderRadius:8,marginBottom:10,
                        background:T.bg3,border:`1px solid ${T.sep}`}}>
                        <p style={{fontSize:11,color:T.ink2,margin:0,lineHeight:1.5}}>
                          💡 {s.impacto}
                        </p>
                      </div>
                    )}

                    {/* Ações */}
                    <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
                      {s.gatilho&&onGoto&&(
                        <button onClick={()=>{onGoto(s.gatilho);onClose()}}
                          style={{display:'flex',alignItems:'center',gap:5,padding:'6px 13px',
                            borderRadius:8,border:'none',cursor:'pointer',fontSize:11,fontWeight:700,
                            background:`linear-gradient(135deg,${T.purple}cc,#7c3aed)`,
                            color:'#fff',boxShadow:`0 2px 8px ${T.purple}30`}}>
                          <Zap size={11}/>Abrir gatilho
                        </button>
                      )}
                      {s.acao==='submeter_meta'&&(
                        <button style={{display:'flex',alignItems:'center',gap:5,padding:'6px 13px',
                          borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:600,
                          background:T.blueDim,border:`1px solid ${T.blueBor}`,color:T.blue}}>
                          <ArrowUpRight size={11}/>Submeter Meta
                        </button>
                      )}
                      <button onClick={()=>onDismiss(key)}
                        style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,
                          padding:'5px 10px',borderRadius:7,cursor:'pointer',fontSize:10.5,
                          background:'transparent',border:`1px solid ${T.sep}`,
                          color:T.ink3,fontWeight:500}}>
                        <CheckCircle size={10}/>Entendi
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{flexShrink:0,padding:'12px 20px',borderTop:`1px solid ${T.sep}`,
          display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:10,color:T.ink4}}>
            Atualizado automaticamente
          </span>
          <span style={{fontSize:10,color:T.purple,fontWeight:600}}>
            {visíveis.length} pendente{visíveis.length!==1?'s':''}
          </span>
        </div>
      </div>
    </>
  )
}

// ─── SIDEBAR DE NAVEGAÇÃO ─────────────────────────────────────────────────────
function GatilhoSidebar({ gatilhos, configs, indicadores, selId, onSelect, labelDe,
                          insightsGat, insDismiss, toggleAtivo, custos }) {
  const [busca,   setBusca]   = useState('')
  const [collapsed, setCollapsed] = useState({})
  const toggle = (g) => setCollapsed(c => ({...c,[g]:!c[g]}))

  // Drag-and-drop para reordenar gatilhos dentro do grupo
  const [ordemLocal, setOrdemLocal] = useState(()=>{
    try { return JSON.parse(localStorage.getItem('gat-sidebar-ordem')||'{}') } catch { return {} }
  })
  const dragRef = useRef({grupo:null,idx:null})

  const getOrdem = (grupo, itens) => {
    const o = ordemLocal[grupo]
    if (!o) return itens
    return [...itens].sort((a,b)=>{
      const ia=o.indexOf(a.id), ib=o.indexOf(b.id)
      return (ia===-1?999:ia) - (ib===-1?999:ib)
    })
  }
  const onDragStart = (grupo,idx) => { dragRef.current = {grupo,idx} }
  const onDrop = (grupo,idx) => {
    const {grupo:sg, idx:si} = dragRef.current
    if (sg!==grupo || si===idx) return
    const itens = getOrdem(grupo, gatilhos.filter(g=>g.grupo===grupo&&(!busca||labelDe(g).toLowerCase().includes(busca.toLowerCase()))))
    const nova  = itens.map(g=>g.id)
    const [m]   = nova.splice(si,1); nova.splice(idx,0,m)
    const next  = {...ordemLocal,[grupo]:nova}
    setOrdemLocal(next)
    try { localStorage.setItem('gat-sidebar-ordem', JSON.stringify(next)) } catch {}
  }

  return (
    <div style={{width:264,flexShrink:0,background:T.bg1,
      borderRight:`1px solid ${T.sep}`,display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* Busca */}
      <div style={{padding:'12px 12px 8px',borderBottom:`1px solid ${T.sep}`,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:7,padding:'7px 10px',
          borderRadius:8,background:T.bg2,border:`1px solid ${T.sep2}`}}>
          <Search size={12} style={{color:T.ink4,flexShrink:0}}/>
          <input value={busca} onChange={e=>setBusca(e.target.value)}
            placeholder="Buscar gatilho..."
            style={{flex:1,border:'none',background:'transparent',color:T.ink1,
              fontSize:12,outline:'none'}}/>
          {busca&&<button onClick={()=>setBusca('')}
            style={{background:'none',border:'none',cursor:'pointer',color:T.ink4,
              display:'flex',padding:0}}><X size={10}/></button>}
        </div>
      </div>

      {/* Lista */}
      <div style={{flex:1,overflowY:'auto',paddingBottom:8}}>
        {GRUPOS_ORDEM.map(grupo => {
          const itens = gatilhos.filter(g=>g.grupo===grupo&&(!busca||labelDe(g).toLowerCase().includes(busca.toLowerCase())))
          if (!itens.length) return null
          const isCollapsed = collapsed[grupo]
          const ativos = itens.filter(g=>configs[g.id]?.ativo).length
          const hasCrit = itens.some(g=>insightsGat?.some(i=>i.gatilho===g.id&&!insDismiss?.has(i.id)&&(i.tipo==='critico'||i.tipo==='aviso')))
          return (
            <div key={grupo}>
              <button onClick={()=>toggle(grupo)} style={{
                display:'flex',alignItems:'center',gap:6,width:'100%',
                padding:'9px 12px 4px',border:'none',background:'transparent',cursor:'pointer'}}>
                {isCollapsed?<ChevronRight size={9} style={{color:T.ink4,flexShrink:0}}/>
                            :<ChevronDown size={9} style={{color:T.ink4,flexShrink:0}}/>}
                <span style={{fontSize:9,fontWeight:700,textTransform:'uppercase',
                  letterSpacing:'.09em',color:T.ink4,flex:1,textAlign:'left'}}>{grupo}</span>
                <span style={{fontSize:9,color:T.ink4}}>{ativos}/{itens.length}</span>
                {hasCrit&&<div style={{width:5,height:5,borderRadius:'50%',
                  background:T.red,flexShrink:0,animation:'pulse 1.5s ease infinite'}}/>}
              </button>

              {!isCollapsed && getOrdem(grupo, itens).map((g, idx) => {
                const cfg   = configs[g.id]
                const ativo = cfg?.ativo
                const ind   = indicadores[g.id]
                const env   = ind?.enviados||0, err=ind?.erros||0, tent=env+err
                const taxa  = tent>0?Math.round(env/tent*100):null
                const rCor  = taxa===null?T.ink4:taxa>=70?T.green:taxa>=30?T.amber:T.red
                const isAct = selId===g.id
                const crit  = insightsGat?.some(i=>i.gatilho===g.id&&!insDismiss?.has(i.id)&&i.tipo==='critico')
                const custo = custos?.porGatilho?.[g.id]
                const Icon  = g.icon
                return (
                  <div key={g.id}
                    draggable
                    onDragStart={()=>onDragStart(grupo,idx)}
                    onDragOver={e=>{e.preventDefault();e.currentTarget.classList.add('drag-over')}}
                    onDragLeave={e=>e.currentTarget.classList.remove('drag-over')}
                    onDrop={e=>{e.currentTarget.classList.remove('drag-over');onDrop(grupo,idx)}}
                    onClick={()=>onSelect(selId===g.id?null:g.id)}
                    className="gat-sidebar-item"
                    style={{display:'flex',alignItems:'center',gap:7,padding:'5px 10px 5px 12px',
                      cursor:'pointer',transition:'all .1s',
                      background:isAct?`linear-gradient(90deg,${g.cor}15,${T.bg3})`:'transparent',
                      borderLeft:`2px solid ${isAct?g.cor:'transparent'}`}}
                    onMouseEnter={e=>{if(!isAct)e.currentTarget.style.background=T.bg2}}
                    onMouseLeave={e=>{if(!isAct)e.currentTarget.style.background='transparent'}}>

                    {/* Drag handle */}
                    <GripVertical size={10} className="drag-handle"
                      style={{color:T.ink4,flexShrink:0,opacity:0,cursor:'grab'}}/>

                    {/* Health dot com glow */}
                    <div style={{width:7,height:7,borderRadius:'50%',flexShrink:0,
                      background:cfg?rCor:'rgba(255,255,255,.12)',
                      boxShadow:taxa!==null&&taxa>=70?`0 0 5px ${T.green}60`:'none'}}/>

                    {/* Icon */}
                    <div style={{width:24,height:24,borderRadius:7,flexShrink:0,
                      background:`${g.cor}18`,border:`0.5px solid ${g.cor}28`,
                      display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <Icon size={12} style={{color:g.cor}}/>
                    </div>

                    {/* Nome */}
                    <span style={{flex:1,fontSize:11.5,fontWeight:isAct?600:400,
                      color:isAct?T.ink1:T.ink2,overflow:'hidden',
                      textOverflow:'ellipsis',whiteSpace:'nowrap',minWidth:0}}>
                      {labelDe(g)}
                    </span>

                    {/* Métricas + toggle */}
                    <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                      {crit&&<div style={{width:5,height:5,borderRadius:'50%',background:T.red}}/>}
                      {custo&&<span style={{fontSize:8.5,color:T.ink4}}>${custo.custo}</span>}
                      {taxa!==null&&(
                        <span style={{fontSize:9,fontWeight:700,color:rCor,minWidth:22,textAlign:'right'}}>
                          {taxa}%
                        </span>
                      )}
                      {cfg&&(
                        <div onClick={e=>{e.stopPropagation();toggleAtivo(g.id)}}
                          title={ativo?'Ativo — clique para desativar':'Inativo — clique para ativar'}
                          style={{width:8,height:8,borderRadius:'50%',flexShrink:0,
                            cursor:'pointer',transition:'all .2s',
                            background:ativo?T.green:'rgba(255,255,255,.2)',
                            boxShadow:ativo?`0 0 6px ${T.green}80`:'none'}}/>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{padding:'8px 12px',borderTop:`1px solid ${T.sep}`,flexShrink:0,
        display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:9,color:T.ink4,flex:1}}>
          {gatilhos.filter(g=>configs[g.id]?.ativo).length} ativos
          {' '}de {gatilhos.length} total
        </span>
        {custos&&(
          <span style={{fontSize:9,color:T.amber,fontWeight:600}}>
            US${custos.totalCusto}/mês
          </span>
        )}
      </div>
    </div>
  )
}

// ─── DASHBOARD — tela inicial quando nenhum gatilho selecionado ───────────────
function GatilhoDashboard({ pulso, sparks, jornada, insightsGat, insDismiss, setInsDismiss,
                            onGoto, atividadeRecente, custos, custosPeriodo, onSetPeriodo }) {
  return (
    <div style={{flex:1,overflowY:'auto',background:T.bg0}}>

      {/* KPIs */}
      {pulso && (
        <div style={{padding:'14px 20px 0',display:'grid',
          gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
          {[
            {l:'Aprovados',    v:pulso.meta.aprovados,   cor:T.green,  spk:'aprovados'},
            {l:'Em análise',   v:pulso.meta.analise,     cor:T.amber,  spk:'analise'},
            {l:'Não enviados', v:pulso.meta.naoEnviados, cor:T.ink2,   spk:'naoEnviados'},
            {l:'Rejeitados',   v:pulso.meta.rejeitados,  cor:T.red,    spk:'rejeitados'},
            {l:'Disparos hoje',v:pulso.disparosHoje,     cor:T.blue,   spk:'disparos'},
            {l:'Em rota',      v:pulso.clientesEmRota,   cor:T.purple, spk:'emRota'},
          ].map((c,i)=>(
            <div key={i} style={{background:T.bg2,borderRadius:10,overflow:'hidden',
              border:`1px solid ${T.sep}`,boxShadow:'0 2px 8px rgba(0,0,0,.2)'}}>
              <div style={{height:2.5,background:`linear-gradient(90deg,${c.cor},${c.cor}40)`}}/>
              <div style={{padding:'10px 13px'}}>
                <div style={{fontSize:8.5,color:T.ink4,textTransform:'uppercase',
                  letterSpacing:'.08em',marginBottom:5,fontWeight:600}}>{c.l}</div>
                <div style={{display:'flex',alignItems:'flex-end',
                  justifyContent:'space-between',gap:6}}>
                  <span style={{fontSize:20,fontWeight:800,color:c.cor,lineHeight:1,
                    letterSpacing:'-.04em'}}>{c.v}</span>
                  {sparks?.[c.spk]&&<SparkCard serie={sparks[c.spk]} cor={c.cor}/>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {insightsGat.filter(i=>!insDismiss.has(i.id)).length>0&&(
        <div style={{margin:'16px 20px 0',padding:'14px 16px',borderRadius:13,
          background:T.bg2,border:`1px solid ${T.sep2}`,boxShadow:'0 4px 20px rgba(0,0,0,.25)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <Activity size={14} style={{color:T.amber}}/>
            <span style={{fontSize:12,fontWeight:700,color:T.ink1}}>Inteligência dos Gatilhos</span>
            <span style={{fontSize:10,padding:'1px 7px',borderRadius:99,
              background:T.redDim,color:T.red,border:`1px solid ${T.redBor}`,fontWeight:700}}>
              {insightsGat.filter(i=>!insDismiss.has(i.id)&&i.tipo==='critico').length>0
                ?`${insightsGat.filter(i=>!insDismiss.has(i.id)&&i.tipo==='critico').length} crítico${insightsGat.filter(i=>!insDismiss.has(i.id)&&i.tipo==='critico').length>1?'s':''}`
                :`${insightsGat.filter(i=>!insDismiss.has(i.id)).length} alertas`}
            </span>
            <button onClick={()=>setInsDismiss(new Set(insightsGat.map(i=>i.id)))}
              style={{marginLeft:'auto',fontSize:10,color:T.ink4,background:'transparent',
                cursor:'pointer',padding:'3px 8px',borderRadius:6,border:`1px solid ${T.sep}`}}>
              Dispensar todos
            </button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:9}}>
            {insightsGat.filter(i=>!insDismiss.has(i.id)).map(ins=>(
              <InsightCardGat key={ins.id} ins={ins}
                onDismiss={()=>setInsDismiss(d=>new Set([...d,ins.id]))}
                onGoto={onGoto}/>
            ))}
          </div>
        </div>
      )}

      {/* Jornada */}
      {jornada && (
        <div style={{margin:'16px 20px 0',padding:'14px 18px',borderRadius:13,
          background:T.bg2,border:`1px solid ${T.sep2}`}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <Navigation size={13} style={{color:T.blue}}/>
            <span style={{fontSize:12,fontWeight:700,color:T.ink1}}>Jornada do Cliente — agora</span>
            <span style={{fontSize:11,color:T.ink3,marginLeft:'auto'}}>
              {Object.values(jornada.etapas||{}).reduce((a,b)=>a+b,0)} em andamento
            </span>
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:4}}>
            {[
              {id:'compra',  lbl:'Compra',    icon:ShoppingBag, cor:T.purple},
              {id:'preparo', lbl:'Preparo',   icon:Package,     cor:T.blue},
              {id:'envio',   lbl:'Envio',     icon:Truck,       cor:T.green},
              {id:'pos',     lbl:'Pós-venda', icon:RefreshCw,   cor:T.amber},
              {id:'ia',      lbl:'IA',        icon:Brain,       cor:T.purple},
            ].map((e,i,arr)=>{
              const n = jornada.etapas?.[e.id]||0
              const ativo = n>0
              const EIcon = e.icon
              return (
                <div key={e.id} style={{display:'flex',alignItems:'center',flex:i<arr.length-1?1:'0 0 auto'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flexShrink:0}}>
                    <div style={{width:36,height:36,borderRadius:'50%',flexShrink:0,
                      background:ativo?`linear-gradient(135deg,${e.cor}40,${e.cor}20)`:`${T.bg4}`,
                      border:`2px solid ${ativo?e.cor:T.sep}`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      boxShadow:ativo?`0 4px 12px ${e.cor}30`:'none'}}>
                      <EIcon size={16} style={{color:ativo?e.cor:T.ink4}}/>
                    </div>
                    <span style={{fontSize:18,fontWeight:700,color:ativo?e.cor:T.ink4,lineHeight:1}}>
                      {n||'—'}
                    </span>
                    <span style={{fontSize:9,color:ativo?e.cor:T.ink4,textAlign:'center'}}>{e.lbl}</span>
                  </div>
                  {i<arr.length-1&&<div style={{flex:1,height:2,background:n>0?`linear-gradient(90deg,${e.cor}40,transparent)`:T.sep,margin:'0 4px',marginBottom:14}}/>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Grid: Feed Atividade + Custos */}
      <div style={{margin:'16px 20px 20px',display:'grid',
        gridTemplateColumns:'1fr 320px',gap:12}}>

        {/* Feed de atividade ao vivo */}
        <div style={{background:T.bg2,borderRadius:13,border:`1px solid ${T.sep2}`,
          overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:`1px solid ${T.sep}`,
            display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:T.green,
              animation:'pulse 2s ease infinite'}}/>
            <span style={{fontSize:12,fontWeight:700,color:T.ink1}}>Atividade ao vivo</span>
            <span style={{fontSize:10,color:T.ink4,marginLeft:'auto'}}>últimos 15 disparos</span>
          </div>
          <div style={{maxHeight:320,overflowY:'auto'}}>
            {atividadeRecente.length===0?(
              <div style={{padding:'32px',textAlign:'center',color:T.ink4}}>
                <Activity size={20} style={{opacity:.2,display:'block',margin:'0 auto 8px'}}/>
                <p style={{fontSize:11,margin:0}}>Aguardando disparos...</p>
              </div>
            ):(
              atividadeRecente.map((d,i)=>{
                const sCor = d.status==='enviado'?T.green:d.status==='erro'?T.red:T.amber
                const gat  = GATILHOS.find(x=>x.id===d.gatilho)
                const GIco = gat?.icon
                return (
                  <div key={i} onClick={()=>onGoto(d.gatilho)}
                    style={{display:'flex',alignItems:'center',gap:10,padding:'9px 16px',
                      borderBottom:`1px solid ${T.sep}`,cursor:'pointer',
                      transition:'background .1s'}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.bg3}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    {/* Status dot */}
                    <div style={{width:6,height:6,borderRadius:'50%',flexShrink:0,background:sCor,
                      boxShadow:d.status==='enviado'?`0 0 4px ${T.green}60`:'none'}}/>
                    {/* Cliente */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{fontSize:11.5,fontWeight:600,color:T.ink1,
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {d.nome_cliente||'—'}
                        </span>
                        {d.numero_pedido&&(
                          <span style={{fontSize:9,color:T.ink4,flexShrink:0}}>#{d.numero_pedido}</span>
                        )}
                      </div>
                      {gat&&(
                        <div style={{display:'flex',alignItems:'center',gap:4,marginTop:1}}>
                          {GIco&&<GIco size={9} style={{color:gat.cor,flexShrink:0}}/>}
                          <span style={{fontSize:9.5,color:T.ink3}}>{gat.label}</span>
                        </div>
                      )}
                    </div>
                    {/* Status badge */}
                    <span style={{fontSize:9,padding:'1px 6px',borderRadius:99,flexShrink:0,
                      background:`${sCor}18`,color:sCor,fontWeight:600}}>
                      {d.status==='enviado'?'Enviado':d.status==='erro'?'Erro':'Ignorado'}
                    </span>
                    {/* Tempo */}
                    <span style={{fontSize:9,color:T.ink4,flexShrink:0}}>{tempoRel(d.criado_em)}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Custos */}
        <div style={{background:T.bg2,borderRadius:13,border:`1px solid ${T.sep2}`,
          overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'12px 16px',borderBottom:`1px solid ${T.sep}`,
            display:'flex',alignItems:'center',gap:8,flexShrink:0,
            background:`linear-gradient(90deg,${T.bg3},${T.bg2})`}}>
            <div style={{width:28,height:28,borderRadius:8,background:T.amberDim,
              border:`1px solid ${T.amberBor}`,display:'flex',alignItems:'center',
              justifyContent:'center',flexShrink:0}}>
              <CreditCard size={13} style={{color:T.amber}}/>
            </div>
            <div>
              <span style={{fontSize:12,fontWeight:700,color:T.ink1,display:'block'}}>Custos</span>
              <span style={{fontSize:9,color:T.ink4}}>estimativa Meta (US$0,0085/msg)</span>
            </div>
            <div style={{marginLeft:'auto',display:'flex',gap:4}}>
              {['7d','30d','90d'].map(p=>(
                <button key={p} onClick={()=>onSetPeriodo(p)}
                  style={{fontSize:9,padding:'2px 7px',borderRadius:6,border:'none',cursor:'pointer',
                    fontWeight:600,
                    background:custosPeriodo===p?T.amber:T.bg4,
                    color:custosPeriodo===p?T.bg0:T.ink4}}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          {custos?(
            <div style={{flex:1,overflowY:'auto'}}>
              {/* Total */}
              <div style={{padding:'14px 16px',borderBottom:`1px solid ${T.sep}`}}>
                <p style={{fontSize:9,color:T.ink4,textTransform:'uppercase',letterSpacing:'.07em',margin:'0 0 4px'}}>
                  Total — {custosPeriodo}
                </p>
                <p style={{fontSize:24,fontWeight:700,color:T.amber,margin:0,letterSpacing:'-.03em'}}>
                  US${custos.totalCusto}
                </p>
                <p style={{fontSize:10,color:T.ink3,margin:'3px 0 0'}}>
                  {custos.totalEnviados} mensagens entregues
                </p>
              </div>
              {/* Por gatilho */}
              {Object.entries(custos.porGatilho||{})
                .sort((a,b)=>b[1].enviados-a[1].enviados)
                .slice(0,8)
                .map(([id,c])=>{
                  const gat=GATILHOS.find(x=>x.id===id)
                  const GIco=gat?.icon
                  return (
                    <div key={id} onClick={()=>onGoto(id)}
                      style={{display:'flex',alignItems:'center',gap:8,padding:'7px 16px',
                        borderBottom:`1px solid ${T.sep}`,cursor:'pointer',transition:'background .1s'}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.bg3}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      {GIco&&<GIco size={11} style={{color:gat.cor,flexShrink:0}}/>}
                      <span style={{flex:1,fontSize:11,color:T.ink2,overflow:'hidden',
                        textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {gat?.label||id}
                      </span>
                      <span style={{fontSize:10,color:T.amber,fontWeight:600,flexShrink:0}}>
                        US${c.custo}
                      </span>
                      <span style={{fontSize:9,color:T.ink4,flexShrink:0}}>
                        {c.enviados} env.
                      </span>
                    </div>
                  )
              })}
            </div>
          ):(
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
              <p style={{fontSize:11,color:T.ink4,textAlign:'center'}}>
                Configure o backend para ver os custos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── META ANALYTICS CARD — no preview column ─────────────────────────────────
function MetaAnalyticsCard({ stats }) {
  if (!stats) return null
  if (!stats.disponivel) return (
    <div style={{padding:'12px 16px',borderTop:`1px solid ${T.sep}`,background:T.bg2}}>
      <p style={{fontSize:9,color:T.ink4,textAlign:'center',margin:0}}>
        {stats.erro||'Meta Analytics não configurado'}
      </p>
    </div>
  )
  const CIRC = 94  // 2π × 15
  const rd = stats.taxaLeitura!==null ? Math.round(CIRC*(1-(stats.taxaLeitura||0)/100)) : CIRC
  const rb = stats.benchmarkLeitura!==null ? Math.round(CIRC*(1-(stats.benchmarkLeitura||73)/100)) : CIRC
  const lCor = stats.taxaLeitura>=stats.benchmarkLeitura?T.green:stats.taxaLeitura>=60?T.amber:T.red
  return (
    <div style={{flexShrink:0,borderTop:`1px solid ${T.sep}`,background:T.bg2,padding:'12px 16px'}}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
        <Star size={11} style={{color:T.amber}}/>
        <span style={{fontSize:9,fontWeight:700,textTransform:'uppercase',
          letterSpacing:'.07em',color:T.ink3}}>Meta Analytics — 7 dias</span>
      </div>
      {/* Stats grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:10}}>
        {[
          {l:'Enviadas',  v:stats.totalSent||0,       cor:T.ink2},
          {l:'Entregues', v:stats.totalDelivered||0,   cor:T.blue},
          {l:'Lidas',     v:stats.totalRead||0,        cor:T.green},
          {l:'Custo/msg', v:stats.custoPorMsg?`$${stats.custoPorMsg}`:'—', cor:T.amber},
        ].map(s=>(
          <div key={s.l} style={{textAlign:'center',background:T.bg3,borderRadius:8,padding:'7px 4px',
            border:`1px solid ${T.sep}`}}>
            <p style={{fontSize:15,fontWeight:700,color:s.cor,margin:0,lineHeight:1,
              letterSpacing:'-.02em'}}>{s.v}</p>
            <p style={{fontSize:8,color:T.ink4,margin:'3px 0 0',textTransform:'uppercase',
              letterSpacing:'.06em'}}>{s.l}</p>
          </div>
        ))}
      </div>
      {/* Taxa leitura vs benchmark */}
      {stats.taxaLeitura!==null&&(
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {/* Ring */}
          <div style={{position:'relative',width:44,height:44,flexShrink:0}}>
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="15" fill="none" stroke={T.bg4} strokeWidth="3"/>
              {/* benchmark */}
              <circle cx="22" cy="22" r="15" fill="none" stroke={`${T.ink4}50`}
                strokeWidth="3" strokeDasharray={`${CIRC}`} strokeDashoffset={`${rb}`}
                strokeLinecap="round" transform="rotate(-90 22 22)"/>
              {/* você */}
              <circle cx="22" cy="22" r="15" fill="none" stroke={lCor}
                strokeWidth="3" strokeDasharray={`${CIRC}`} strokeDashoffset={`${rd}`}
                strokeLinecap="round" transform="rotate(-90 22 22)"
                style={{transition:'stroke-dashoffset .8s ease'}}/>
            </svg>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontSize:10,fontWeight:700,color:lCor}}>{stats.taxaLeitura}%</span>
            </div>
          </div>
          <div style={{flex:1}}>
            <p style={{fontSize:11,fontWeight:600,color:T.ink1,margin:'0 0 3px'}}>
              Taxa de leitura
            </p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <span style={{fontSize:10,color:lCor,fontWeight:600}}>
                {stats.taxaLeitura}% você
              </span>
              <span style={{fontSize:10,color:T.ink4}}>
                vs {stats.benchmarkLeitura}% mercado
              </span>
            </div>
            <div style={{marginTop:5,height:4,borderRadius:99,background:T.bg4,position:'relative'}}>
              <div style={{position:'absolute',left:0,top:0,height:'100%',borderRadius:99,
                background:lCor,width:`${Math.min(100,stats.taxaLeitura)}%`,
                transition:'width .8s ease'}}/>
              <div style={{position:'absolute',top:0,height:'100%',width:2,background:T.ink4,
                left:`${stats.benchmarkLeitura}%`,transform:'translateX(-50%)'}}/>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
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
  const [showPlano,   setShowPlano] = useState(false)  // alterna entre grade e Plano de Disparos
  const [loading,     setLoading]   = useState(true)
  const [nomesCustom, setNomesCustom] = useState({})  // { gatilhoId: 'nome editado' }
  const [editandoNome, setEditandoNome] = useState(false)  // modo edição do nome do gatilho selecionado
  const [pulso, setPulso] = useState(null)  // dados da operação (Fase 1: /api/operacao/pulso)
  const [jornada, setJornada] = useState(null)  // clientes por etapa (Fase 1: /api/operacao/jornada)
  const [sugestoes, setSugestoes] = useState([])  // Molise copilota (Fase 2: /api/operacao/sugestoes)
  const [sugestoesFechadas, setSugFechadas] = useState({})  // dispensadas pelo usuário (sessão)
  const [sparks, setSparks] = useState(null)  // séries históricas pros sparklines
  const [atividade, setAtividade] = useState({})  // envios por gatilho (7 dias)
  const [indicadores, setIndicadores] = useState({})  // indicadores ricos por gatilho
  const [molisesAberta, setMoliseAberta] = useState(false)  // painel de sugestões on/off
  const [sugFechMap, setSugFechMap] = useState({})  // { id: true } — sugestões dispensadas

  // ── Meta Analytics + Custos ────────────────────────────────────────────────
  const [metaStats,      setMetaStats]    = useState({})   // { [gatilhoId]: dados Meta }
  const [atividadeRecente,setAtivRecente] = useState([])   // feed ao vivo — todos os gatilhos
  const [custos,          setCustos]     = useState(null)  // breakdown de custos
  const [custosPeriodo,   setCustosPer]  = useState('30d') // período selecionado

  // Bulk operations — seleção multi-card
  const [selEst, setSelEst] = useState(new Set())
  const [bulkOp, setBulkOp] = useState(false)

  // Command palette ⌘K
  const [cmdK, setCmdK] = useState(false)

  // Insights dismissados
  const [insDismiss, setInsDismiss] = useState(new Set())

  // Disparos recentes do gatilho selecionado (para o drawer)
  const [dispGat,    setDispGat]    = useState([])
  const [loadDispGat,setLoadDG]     = useState(false)

  // Bulk operations
  const toggleSelEst = (id) => setSelEst(prev => {
    const next = new Set(prev); if(next.has(id)) next.delete(id); else next.add(id); return next
  })
  const ativarLote  = async () => {
    for(const id of selEst) {
      if(!configs[id]?.ativo) await toggleAtivo(id).catch(()=>{})
    }
    setSelEst(new Set())
  }
  const desativLote = async () => {
    for(const id of selEst) {
      if(configs[id]?.ativo) await toggleAtivo(id).catch(()=>{})
    }
    setSelEst(new Set())
  }

  // Buscar disparos recentes quando gatilho é selecionado
  useEffect(()=>{
    if (!selId) { setDispGat([]); return }
    setLoadDG(true)
    fetch(`${api}/api/dashboard/disparos-log?gatilho=${selId}&limite=8&pagina=1`)
      .then(r=>r.json())
      .then(d=>{ setDispGat(d.disparos||[]); setLoadDG(false) })
      .catch(()=>setLoadDG(false))
  }, [selId, api])

  // Insights computados client-side a partir de indicadores + configs
  const insightsGat = useMemo(()=>{
    // labelDe inline para evitar TDZ (a const labelDe é declarada depois no componente)
    const _lbl = (g) => (g && (nomesCustom[g.id] || g.label)) || ''
    const result = []

    // 1. Taxa 0% — template inativo (crítico)
    GATILHOS.forEach(g=>{
      const ind   = indicadores[g.id]
      if (!ind) return
      const env   = ind.enviados || 0
      const err   = ind.erros    || 0
      const tot   = ind.total    || 0
      const tent  = env + err
      const taxa  = tent > 0 ? Math.round(env/tent*100) : null
      if (tot > 0 && taxa === 0) {
        result.push({
          id:`taxa0_${g.id}`, tipo:'critico', gatilho:g.id,
          titulo:`${_lbl(g)} — 0% de entrega`,
          desc:`${tot} disparo${tot>1?'s':''} registrados mas nenhum enviado. O template está inativo — nenhum cliente recebeu esta mensagem.`,
          afetados:tot, dias:0,
          score: tot * 10,
        })
      }
      // 2. Gap de inatividade (aviso)
      if (ind.ultimo && tot > 0) {
        const diasSem = Math.floor((Date.now()-new Date(ind.ultimo))/86400000)
        if (diasSem >= 5 && taxa > 0) {
          result.push({
            id:`gap_${g.id}`, tipo:'aviso', gatilho:g.id,
            titulo:`${_lbl(g)} — sem disparo há ${diasSem} dias`,
            desc:`Este gatilho tinha atividade mas está parado. Verifique se o webhook do Bling está configurado.`,
            afetados:0, dias:diasSem,
            score: diasSem * 3,
          })
        }
      }
    })

    // 3. Templates criados mas não submetidos para a Meta (aviso)
    const naoSub = GATILHOS.filter(g=>g.tipo!=='ia'&&configs[g.id]&&!configs[g.id]?.meta_template_status)
    if (naoSub.length > 0) {
      result.push({
        id:'nao_submetidos', tipo:'aviso', gatilho:null,
        titulo:`${naoSub.length} template${naoSub.length>1?'s':''} sem aprovação Meta`,
        desc:`Templates configurados mas ainda não submetidos. Sem aprovação da Meta, não funcionam como HSM para números fora da janela de 24h. Abra cada um e clique em "Submeter para aprovação".`,
        afetados:0, dias:0,
        score: naoSub.length * 5,
      })
    }

    // 4. Gatilhos críticos sem template (crítico)
    const criticos = ['pedido_entregue','rastreio_em_transito','saiu_entrega','pedido_coletado']
    criticos.forEach(id=>{
      if (!configs[id]) {
        const g = GATILHOS.find(x=>x.id===id)
        if (g) result.push({
          id:`sem_tpl_${id}`, tipo:'critico', gatilho:id,
          titulo:`${_lbl(g)} — sem template configurado`,
          desc:`Gatilho de alto volume sem template. Configure e aprove na Meta para começar a notificar clientes automaticamente.`,
          afetados:0, dias:0,
          score: 80,
        })
      }
    })

    // 5. Melhor gatilho (positivo)
    const candidatos = GATILHOS.map(g=>{
      const ind = indicadores[g.id]
      if (!ind) return null
      const env=ind.enviados||0, err=ind.erros||0, tent=env+err
      const taxa = tent >= 5 ? Math.round(env/tent*100) : null
      return taxa!==null ? {id:g.id, taxa, tent, env} : null
    }).filter(Boolean).sort((a,b)=>b.taxa-a.taxa)
    if (candidatos[0]?.taxa >= 80) {
      const best = candidatos[0]
      const gBest = GATILHOS.find(x=>x.id===best.id)
      result.push({
        id:`top_${best.id}`, tipo:'positivo', gatilho:best.id,
        titulo:`${best.taxa}% taxa de entrega — ${_lbl(gBest)}`,
        desc:`Melhor performance entre os gatilhos ativos. ${best.env} de ${best.tent} disparos entregues com sucesso.`,
        afetados:0, dias:0, score:0,
      })
    }

    // Ordenar: crítico → aviso → oportunidade → positivo, depois por score
    const ord = {critico:0,aviso:1,oportunidade:2,positivo:3}
    return result.sort((a,b)=>(ord[a.tipo]??9)-(ord[b.tipo]??9)||b.score-a.score)
  }, [indicadores, configs, nomesCustom])

  const gatilho = GATILHOS.find(g => g.id === selId)
  const config  = configs[selId]
  const isIA    = gatilho?.tipo === 'ia'
  // Label efetivo: nome customizado pelo usuário OU o padrão do gatilho
  const labelDe = (g) => (g && (nomesCustom[g.id] || g.label)) || ''
  const labelAtual = labelDe(gatilho)

  // ── Carrega templates do banco ─────────────────────────────────────────────
  // Meta analytics quando gatilho selecionado
  useEffect(()=>{
    if (!selId) return
    const cached = metaStats[selId]
    if (cached) return  // já carregou
    fetch(`${api}/api/templates/${selId}/meta-analytics`)
      .then(r=>r.json())
      .then(d=>setMetaStats(prev=>({...prev,[selId]:d})))
      .catch(()=>setMetaStats(prev=>({...prev,[selId]:{disponivel:false,erro:'Erro de conexão'}})))
  }, [selId, api])  // eslint-disable-line

  // Feed de atividade ao vivo
  useEffect(()=>{
    const fetchAct = () => {
      fetch(`${api}/api/dashboard/disparos-log?limite=15`)
        .then(r=>r.json())
        .then(d=>setAtivRecente(d.disparos||[]))
        .catch(()=>{})
    }
    fetchAct()
    const timer = setInterval(fetchAct, 30000)
    return ()=>clearInterval(timer)
  }, [api])

  // Custos
  useEffect(()=>{
    fetch(`${api}/api/dashboard/custos?periodo=${custosPeriodo}`)
      .then(r=>r.json())
      .then(d=>setCustos(d))
      .catch(()=>{})
  }, [api, custosPeriodo])

  // Keyboard shortcuts
  useEffect(() => {
    const h = e => {
      if ((e.metaKey||e.ctrlKey) && e.key==='k') { e.preventDefault(); setCmdK(v=>!v) }
      if (e.key==='Escape') { setCmdK(false); setSelId(null) }
      const inp = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (inp) return
      if (e.key==='e'||e.key==='E') selEst.size && ativarLote()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [selEst, ativarLote])  // eslint-disable-line

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
    fetch(`${api}/api/dashboard/gatilhos-indicadores`)
      .then(r => r.json())
      .then(d => { if (vivo && d?.indicadores) setIndicadores(d.indicadores) })
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

  // ── RENDER (novo layout: sidebar + main area) ────────────────────────────
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',
      background:T.bg0,color:T.ink1,overflow:'hidden'}}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes slideup { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes slideFromRight { from{transform:translateX(24px);opacity:0} to{transform:translateX(0);opacity:1} }
        .gat-card:hover .gat-cb { opacity:1 !important }
        .gat-sidebar-item:hover .drag-handle { opacity:0.6 !important }
        .gat-sidebar-item.drag-over { background: rgba(167,139,250,.12) !important; border-left-color: #a78bfa !important; }
        .gat-card { transition: all .12s }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:99px}
      `}</style>

      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div style={{flexShrink:0,background:T.bg1,borderBottom:`1px solid ${T.sep}`,
        padding:'0 20px',display:'flex',alignItems:'center',gap:16,height:52}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:30,height:30,borderRadius:9,flexShrink:0,
            background:'linear-gradient(135deg,rgba(37,211,102,.25),rgba(0,212,170,.15))',
            border:'1px solid rgba(37,211,102,.35)',
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Zap size={15} style={{color:'#25D366'}}/>
          </div>
          <div>
            <p style={{fontSize:13,fontWeight:700,color:T.ink1,margin:0,letterSpacing:'-.02em'}}>Gatilhos WhatsApp</p>
            <p style={{fontSize:9.5,color:T.ink4,margin:0}}>
              {totalAtivos} ativos · {GATILHOS.length} total · Meta Business
            </p>
          </div>
        </div>
        <div style={{flex:1}}/>
        {/* Live indicator */}
        {pulso&&pulso.clientesEmRota>0&&(
          <div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',
            borderRadius:99,background:T.greenDim,border:`1px solid ${T.greenBor}`}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:T.green,animation:'pulse 2s ease infinite'}}/>
            <span style={{fontSize:10,fontWeight:600,color:T.green}}>{pulso.clientesEmRota} em rota</span>
          </div>
        )}
        {/* Molise sugestões */}
        {sugestoes.length>0&&(
          <button onClick={()=>setMoliseAberta(v=>!v)}
            style={{display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,
              fontSize:11,border:`1px solid ${T.purpleBor}`,background:T.purpleDim,
              color:T.purple,cursor:'pointer',fontWeight:600}}>
            <Sparkles size={12}/>Molise sugere {sugestoes.length} melhoria{sugestoes.length>1?'s':''}
          </button>
        )}
        <button onClick={()=>setCmdK(true)}
          style={{display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,
            fontSize:11,border:`1px solid ${T.sep}`,background:'none',
            color:T.ink3,cursor:'pointer'}}>
          <Search size={12}/><span>Buscar</span>
          <kbd style={{fontSize:9,padding:'1px 5px',borderRadius:4,
            background:T.bg4,border:`1px solid ${T.sep}`,color:T.ink4}}>⌘K</kbd>
        </button>
        <button onClick={()=>setShowPlano(p=>!p)}
          style={{display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,
            fontSize:11,background:showPlano?T.purpleDim:'none',
            border:`1px solid ${showPlano?T.purpleBor:T.sep}`,
            color:showPlano?T.purple:T.ink3,cursor:'pointer',fontWeight:showPlano?600:400}}>
          <SlidersHorizontal size={12}/>Plano
        </button>
      </div>

      {/* ── MAIN: Sidebar + Content ─────────────────────────────── */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* LEFT SIDEBAR */}
        <GatilhoSidebar
          gatilhos={GATILHOS}
          configs={configs}
          indicadores={indicadores}
          selId={selId}
          onSelect={id=>{ setSelId(id); setShowPlano(false) }}
          labelDe={labelDe}
          insightsGat={insightsGat}
          insDismiss={insDismiss}
          toggleAtivo={toggleAtivo}
          custos={custos}
        />

        {/* MAIN CONTENT */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

          {/* Plano de Disparos overlay */}
          {showPlano && (
            <div style={{position:'absolute',inset:0,zIndex:50,background:T.bg0,
              display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{flexShrink:0,padding:'14px 20px',borderBottom:`1px solid ${T.sep}`,
                display:'flex',alignItems:'center',gap:10}}>
                <SlidersHorizontal size={14} style={{color:T.purple}}/>
                <span style={{fontSize:13,fontWeight:700,color:T.ink1}}>Plano de Disparos</span>
                <button onClick={()=>setShowPlano(false)}
                  style={{marginLeft:'auto',padding:'5px 12px',borderRadius:8,border:`1px solid ${T.sep}`,
                    background:'none',color:T.ink2,cursor:'pointer',fontSize:12}}>
                  <X size={13}/>
                </button>
              </div>
              <PlanodeDisparos gatilhos={GATILHOS} configs={configs}
                atividade={atividade}
                onSelect={id=>{setSelId(id);setShowPlano(false)}} api={api}/>
            </div>
          )}

          {/* Dashboard (sem seleção) */}
          {!selId && (
            <GatilhoDashboard
              pulso={pulso} sparks={sparks} jornada={jornada}
              insightsGat={insightsGat} insDismiss={insDismiss}
              setInsDismiss={setInsDismiss}
              onGoto={id=>{setSelId(id);setShowPlano(false)}}
              atividadeRecente={atividadeRecente}
              custos={custos}
              custosPeriodo={custosPeriodo}
              onSetPeriodo={p=>{setCustosPer(p)}}
            />
          )}

          {/* Editor Studio (com seleção) */}
          {selId && (
            <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 340px',
              overflow:'hidden',animation:'slideFromRight .25s ease'}}>

              {/* ── COLUNA EDITOR ────────────────────────────────── */}
              <div style={{display:'flex',flexDirection:'column',overflow:'hidden',
                borderRight:`1px solid ${T.sep}`}}>
              {/* ── Header premium do drawer ── */}
              {(() => {
                const indH  = indicadores[selId]
                const envH  = indH?.enviados || 0
                const errH  = indH?.erros    || 0
                const serH  = indH?.serie     || []
                const ultH  = indH?.ultimo    || null
                const relH  = tempoRel(ultH)
                const tentH = envH + errH
                const taxaH = tentH > 0 ? Math.round(envH/tentH*100) : null
                const rCor  = taxaH===null?T.ink4:taxaH>=70?T.green:taxaH>=30?T.amber:T.red
                const CIRC  = 126  // 2π × 20
                const dashH = taxaH!==null ? Math.round(CIRC*(1-taxaH/100)) : CIRC
                return (
                  <div style={{flexShrink:0,borderBottom:`1px solid ${T.sep}`,
                    background:`linear-gradient(135deg,${gatilho.cor}12 0%,${T.bg3} 60%)`}}>
                    {/* Linha principal */}
                    <div style={{padding:'14px 16px 10px',display:'flex',alignItems:'flex-start',gap:12}}>
                      {/* Ring de saúde */}
                      <div style={{position:'relative',width:48,height:48,flexShrink:0}}>
                        <svg width="48" height="48" viewBox="0 0 48 48">
                          <circle cx="24" cy="24" r="20" fill="none" stroke={T.bg4} strokeWidth="3.5"/>
                          <circle cx="24" cy="24" r="20" fill="none" stroke={rCor}
                            strokeWidth="3.5" strokeDasharray={`${CIRC}`}
                            strokeDashoffset={`${dashH}`}
                            strokeLinecap="round" transform="rotate(-90 24 24)"
                            style={{transition:'stroke-dashoffset .8s ease'}}/>
                        </svg>
                        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
                          alignItems:'center',justifyContent:'center'}}>
                          {taxaH!==null
                            ? <span style={{fontSize:11,fontWeight:700,color:rCor,lineHeight:1}}>{taxaH}%</span>
                            : <gatilho.icon size={14} style={{color:gatilho.cor}}/>}
                        </div>
                      </div>
                      {/* Nome + meta + sparkline */}
                      <div style={{flex:1,minWidth:0}}>
                        {editandoNome ? (
                          <input autoFocus defaultValue={labelAtual}
                            onBlur={e=>salvarNome(selId, e.target.value)}
                            onKeyDown={e=>{ if(e.key==='Enter') salvarNome(selId, e.target.value); if(e.key==='Escape') setEditandoNome(false) }}
                            style={{width:'100%',fontSize:14,fontWeight:700,color:T.ink1,
                              background:T.bg3,border:`1px solid ${gatilho.cor}60`,
                              borderRadius:6,padding:'3px 8px',outline:'none'}}/>
                        ) : (
                          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                            <span style={{fontSize:15,fontWeight:700,color:T.ink1,
                              letterSpacing:'-.02em',overflow:'hidden',textOverflow:'ellipsis',
                              whiteSpace:'nowrap'}}>{labelAtual}</span>
                            <button onClick={()=>setEditandoNome(true)}
                              style={{display:'inline-flex',alignItems:'center',justifyContent:'center',
                                width:20,height:20,borderRadius:5,border:'none',background:'transparent',
                                cursor:'pointer',color:T.ink3,flexShrink:0}}>
                              <Pencil size={11}/>
                            </button>
                            {nomesCustom[selId]&&<span style={{fontSize:9,padding:'1px 5px',
                              borderRadius:99,background:`${gatilho.cor}18`,color:gatilho.cor}}>editado</span>}
                          </div>
                        )}
                        <div style={{fontSize:11,color:T.ink3,marginBottom:6,lineHeight:1.4}}>
                          {gatilho.desc}
                        </div>
                        {/* Row: badges + sparkline + stats */}
                        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                          <span style={{fontSize:10,padding:'2px 8px',borderRadius:99,flexShrink:0,
                            background:isIA?T.purpleDim:'rgba(37,211,102,.08)',
                            color:isIA?T.purple:'#22c55e',
                            border:`0.5px solid ${isIA?T.purpleBor:'rgba(37,211,102,.2)'}`}}>
                            {isIA?'✨ Inline IA':'📋 HSM Meta'}
                          </span>
                          {tentH>0&&(
                            <span style={{fontSize:10,color:T.ink3}}>
                              {tentH} disparo{tentH>1?'s':''}/sem
                            </span>
                          )}
                          {relH&&(
                            <span style={{fontSize:10,color:T.ink4,display:'flex',alignItems:'center',gap:4}}>
                              Último: {relH}
                            </span>
                          )}
                          <div style={{marginLeft:'auto',flexShrink:0}}>
                            {serH.length>0&&<SparkCard serie={serH} cor={taxaH===0?T.red:taxaH&&taxaH>=70?T.green:T.amber}/>}
                          </div>
                        </div>
                      </div>
                      {/* Fechar */}
                      <button onClick={()=>setSelId(null)}
                        style={{width:28,height:28,borderRadius:8,border:`1px solid ${T.sep2}`,
                          background:T.bg4,cursor:'pointer',display:'flex',alignItems:'center',
                          justifyContent:'center',color:T.ink3,flexShrink:0}}>
                        <X size={14}/>
                      </button>
                    </div>
                  </div>
                )
              })()}

              {/* ── Intelligence card contextual do gatilho selecionado ── */}
              {(() => {
                const ins = insightsGat.find(i=>i.gatilho===selId&&!insDismiss.has(i.id))
                if (!ins) return null
                const cfgIns = {
                  critico:{cor:T.red,  dim:T.redDim,  bor:T.redBor,  Ic:AlertTriangle, lbl:'CRÍTICO'},
                  aviso:  {cor:T.amber,dim:T.amberDim,bor:T.amberBor,Ic:Clock,         lbl:'ATENÇÃO'},
                }[ins.tipo]
                if (!cfgIns) return null
                const {cor,dim,bor,Ic:IcIns,lbl} = cfgIns
                return (
                  <div style={{margin:'0 16px 10px',padding:'11px 14px',borderRadius:10,
                    background:dim, border:`1px solid ${bor}`, animation:'fadeIn .3s ease'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:9}}>
                      <IcIns size={14} style={{color:cor,flexShrink:0,marginTop:1}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5,flexWrap:'wrap'}}>
                          <span style={{fontSize:9,padding:'1px 7px',borderRadius:99,
                            background:`${cor}22`,color:cor,fontWeight:700,letterSpacing:'.04em'}}>{lbl}</span>
                          {ins.afetados>0&&<span style={{fontSize:10,color:T.ink3}}>{ins.afetados} disparos afetados</span>}
                          {ins.dias>0&&<span style={{fontSize:10,color:T.ink3}}>Sem envio há {ins.dias}d</span>}
                        </div>
                        <p style={{fontSize:12.5,fontWeight:700,color:T.ink1,margin:'0 0 5px',lineHeight:1.4}}>{ins.titulo}</p>
                        <p style={{fontSize:11,color:T.ink2,margin:0,lineHeight:1.55}}>{ins.desc}</p>
                      </div>
                      <button onClick={()=>setInsDismiss(d=>new Set([...d,ins.id]))}
                        style={{fontSize:10,color:T.ink3,background:'transparent',
                          border:`1px solid ${T.sep}`,borderRadius:6,padding:'3px 8px',
                          cursor:'pointer',flexShrink:0,whiteSpace:'nowrap'}}>Entendi</button>
                    </div>
                  </div>
                )
              })()}

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

                {/* ── Tabs do editor ── */}
                <div style={{padding:'0 16px',display:'flex',gap:0,borderTop:`1px solid ${T.sep}`}}>
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
                    <div style={{borderRadius:12,overflow:"hidden",border:"1px solid var(--sep)",background:"var(--bg-2)",marginTop:10}}>
                      <div style={{padding:"8px 12px",borderBottom:"1px solid var(--sep)",background:"var(--bg-3)"}}>
                        <p style={{fontSize:10,fontWeight:600,color:"var(--label-3)",margin:0}}>Adicionar bloco</p>
                      </div>
                      <div style={{padding:8,display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
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
                              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"8px 4px",borderRadius:8,fontSize:9,fontWeight:600,cursor:"pointer",transition:"all .12s",border:"1px solid var(--sep)",background:'var(--bg-3)',color:'var(--label-3)'}} title={t.desc}>
                              <div style={{width:20,height:20,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:`${t.cor}20`}}><Ic size={11} style={{color:t.cor}}/></div>
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
                      <p style={{fontSize:11.5,color:'var(--label-4)',margin:'0 0 10px'}}>
                        {selId==='produto_embalado'
                          ? 'Quanto tempo após a separação para enviar a mensagem de embalado'
                          : selId==='avaliar_pedido'
                          ? 'Quantos dias após a entrega para pedir avaliação'
                          : selId==='pagamento_pendente'
                          ? 'Delay mínimo de 10s aplicado automaticamente (evita sobreposição com Pedido Criado)'
                          : 'Esperar X minutos após o evento antes de enviar'}
                      </p>
                      <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                        {(selId==='produto_embalado'
                          ? [0,30,45,60,90,120]
                          : selId==='avaliar_pedido'
                          ? [0,1440,2880,4320,7200]  // 0, 1d, 2d, 3d, 5d
                          : [0,5,10,15,30,60]
                        ).map(min => (
                          <button key={min} onClick={()=>salvarDelay(selId,min)} style={{flex:1,padding:'6px 4px',borderRadius:7,border:`0.5px solid ${delays[selId]===min||(!delays[selId]&&min===0)?gatilho.cor+'60':'var(--sep)'}`,background:delays[selId]===min||(!delays[selId]&&min===0)?`${gatilho.cor}12`:'transparent',color:delays[selId]===min||(!delays[selId]&&min===0)?gatilho.cor:'var(--label-4)',cursor:'pointer',fontSize:11.5,fontWeight:delays[selId]===min||(!delays[selId]&&min===0)?700:400}}>
                            {min===0?'Imediato':min>=1440?`${min/1440}d`:`${min}min`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Fluxo completo de disparos (timeline) ── */}
                    {(() => {
                      const FLUXO = [
                        {id:'pedido_criado',       lbl:'Pedido Criado',     sit:'order.created', delay:'imediato', cor:T.cyan   },
                        {id:'pagamento_pendente',   lbl:'Pag. Pendente',     sit:'sit=6',         delay:'imediato', cor:T.amber  },
                        {id:'pix_pendente',         lbl:'PIX Pendente',      sit:'#PIX',          delay:'imediato', cor:T.cyan   },
                        {id:'pagamento_aprovado',   lbl:'Pag. Aprovado',     sit:'sit=15',        delay:'rec: 2min',cor:T.blue   },
                        {id:'em_separacao',         lbl:'Em Separação',      sit:'sit=9',         delay:'rec: 5min',cor:T.purple },
                        {id:'produto_embalado',     lbl:'Prod. Embalado',    sit:'#EMBALADO',     delay:'rec: 30min',cor:T.cyan  },
                        {id:'nfe_pendente',         lbl:'NF-e Pendente',     sit:'nfe=1',         delay:'imediato', cor:T.amber  },
                        {id:'nfe_emitida',          lbl:'NF-e Emitida',      sit:'nfe=5',         delay:'rec: 1min', cor:T.ink2  },
                        {id:'pedido_enviado',       lbl:'Pedido Enviado',    sit:'sit=27',        delay:'imediato', cor:T.purple },
                        {id:'pedido_coletado',      lbl:'Coletado',          sit:'auto',          delay:'imediato', cor:T.blue   },
                        {id:'rastreio_em_transito', lbl:'Em Trânsito',       sit:'auto',          delay:'imediato', cor:T.blue   },
                        {id:'saiu_entrega',         lbl:'Saiu p/ Entrega',   sit:'auto/#SAIU',    delay:'imediato', cor:T.amber  },
                        {id:'pedido_entregue',      lbl:'Entregue',          sit:'sit=30/auto',   delay:'rec: 30min',cor:T.green },
                        {id:'cancelamento',         lbl:'Cancelado',         sit:'sit=12',        delay:'imediato', cor:T.ink3   },
                        {id:'estorno_realizado',    lbl:'Estorno',           sit:'#ESTORNO',      delay:'imediato', cor:T.orange },
                      ]
                      return (
                        <div style={{padding:'12px 14px',borderRadius:10,
                          border:`1px solid ${T.sep}`,background:T.bg2}}>
                          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
                            <Timer size={13} style={{color:T.blue}}/>
                            <span style={{fontSize:12,fontWeight:700,color:T.ink1}}>Fluxo completo de disparos</span>
                          </div>
                          <div style={{position:'relative'}}>
                            <div style={{position:'absolute',left:7,top:8,bottom:8,width:1,
                              background:T.sep}}/>
                            {FLUXO.map((f)=>{
                              const isThis = f.id===selId
                              const cfg2   = configs[f.id]
                              const ativo2 = cfg2?.ativo
                              return (
                                <div key={f.id}
                                  onClick={()=>{if(!isThis){setSelId(f.id);setAba('config')}}}
                                  style={{display:'flex',alignItems:'center',gap:8,
                                    padding:'3px 0 3px 20px',position:'relative',
                                    cursor:isThis?'default':'pointer',
                                    opacity:isThis?1:0.55,transition:'opacity .12s'}}
                                  onMouseEnter={e=>e.currentTarget.style.opacity=1}
                                  onMouseLeave={e=>{if(!isThis)e.currentTarget.style.opacity=0.55}}>
                                  <div style={{position:'absolute',left:4,width:7,height:7,
                                    borderRadius:'50%',flexShrink:0,
                                    background:isThis?f.cor:ativo2?T.green:T.sep2,
                                    border:`1px solid ${isThis?f.cor:T.sep2}`,
                                    boxShadow:isThis?`0 0 0 3px ${f.cor}20`:'none'}}/>
                                  <span style={{fontSize:10.5,fontWeight:isThis?700:400,
                                    color:isThis?f.cor:T.ink2,flex:1}}>
                                    {f.lbl}
                                  </span>
                                  <span style={{fontSize:8.5,color:T.ink4}}>{f.sit}</span>
                                  <span style={{fontSize:9,fontWeight:600,
                                    color:f.delay.startsWith('rec:')?T.amber:T.ink4,
                                    minWidth:64,textAlign:'right'}}>
                                    {f.delay}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                          <p style={{fontSize:9,color:T.ink4,marginTop:6,lineHeight:1.5}}>
                            <span style={{color:T.amber,fontWeight:600}}>rec:</span> delay recomendado para evitar sobreposição de mensagens
                          </p>
                        </div>
                      )
                    })()}

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

                    {/* ── Disparos recentes deste gatilho ── */}
                    <div style={{padding:'12px 14px',borderRadius:10,
                      border:`1px solid ${T.sep}`,background:T.bg2}}>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
                        <History size={13} style={{color:T.ink3}}/>
                        <p style={{fontSize:12,fontWeight:700,color:T.ink1,margin:0}}>
                          Disparos recentes
                        </p>
                        {loadDispGat && <RefreshCw size={11} style={{color:T.ink3,animation:'spin 1s linear infinite',marginLeft:'auto'}}/>}
                      </div>
                      {!loadDispGat && dispGat.length===0 && (
                        <p style={{fontSize:11,color:T.ink4,margin:0}}>Nenhum disparo encontrado.</p>
                      )}
                      {dispGat.map((d,i)=>{
                        const sCor = d.status==='enviado'?T.green:d.status==='erro'?T.red:T.amber
                        const sLbl = d.status==='enviado'?'Enviado':d.status==='erro'?'Erro':'Ignorado'
                        return (
                          <div key={i} style={{display:'flex',alignItems:'center',gap:8,
                            padding:'6px 0',borderBottom:i<dispGat.length-1?`1px solid ${T.sep}`:'none'}}>
                            <div style={{width:6,height:6,borderRadius:'50%',
                              background:sCor,flexShrink:0}}/>
                            <span style={{fontSize:11,color:T.ink2,flex:1,
                              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                              {d.nome_cliente||'—'}
                              {d.numero_pedido&&<span style={{color:T.ink4}}> · #{d.numero_pedido}</span>}
                            </span>
                            <span style={{fontSize:9,padding:'1px 6px',borderRadius:99,
                              background:`${sCor}18`,color:sCor,fontWeight:600,flexShrink:0}}>
                              {sLbl}
                            </span>
                            <span style={{fontSize:9,color:T.ink4,flexShrink:0}}>
                              {tempoRel(d.criado_em)}
                            </span>
                          </div>
                        )
                      })}
                    </div>

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
              </div>

              {/* ── COLUNA PREVIEW ────────────────────────────────── */}
              <div style={{display:'flex',flexDirection:'column',overflow:'hidden',
                background:`linear-gradient(160deg,${T.bg1} 0%,${T.bg0} 100%)`}}>
              {/* Header contextual do preview */}
              <div style={{flexShrink:0,padding:'14px 16px',
                background:`linear-gradient(135deg,${gatilho?.cor}15 0%,${T.bg2} 70%)`,
                borderBottom:`1px solid ${T.sep}`}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                  <div style={{width:20,height:20,borderRadius:6,background:`${gatilho?.cor}20`,
                    display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {gatilho?.icon&&<gatilho.icon size={11} style={{color:gatilho?.cor}}/>}
                  </div>
                  <span style={{fontSize:12,fontWeight:600,color:T.ink1}}>{labelAtual}</span>
                  <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4}}>
                    <div style={{width:6,height:6,borderRadius:'50%',
                      background:configs[selId]?.ativo?T.green:T.ink4}}/>
                    <span style={{fontSize:10,color:configs[selId]?.ativo?T.green:T.ink3,fontWeight:500}}>
                      {configs[selId]?.ativo?'Ativo':'Inativo'}
                    </span>
                  </div>
                </div>
                <p style={{fontSize:10,color:T.ink3,margin:0}}>Preview com dados de exemplo</p>
              </div>

              {/* Área do preview — background realista de wallpaper */}
              <div style={{flex:1,overflowY:'auto',padding:'20px 16px',
                background:'radial-gradient(ellipse at 60% 40%, #162029 0%, #0b1419 60%, #080f14 100%)',
                display:'flex',alignItems:'flex-start',justifyContent:'center'}}>
                <PreviewWA blocos={blocos} label={gatilho?.label}/>
              </div>

              {/* ── Stats de desempenho — últimos 7 dias ── */}
              {(() => {
                const indP = indicadores[selId]
                if (!indP) return null
                const envP  = indP.enviados||0
                const errP  = indP.erros||0
                const tentP = envP+errP
                const taxaP = tentP>0?Math.round(envP/tentP*100):null
                const rCorP = taxaP===null?T.ink4:taxaP>=70?T.green:taxaP>=30?T.amber:T.red
                return (
                  <div style={{flexShrink:0,padding:'12px 16px',
                    borderTop:`1px solid ${T.sep}`,background:T.bg2}}>
                    <p style={{fontSize:9,fontWeight:700,textTransform:'uppercase',
                      letterSpacing:'.07em',color:T.ink4,marginBottom:9}}>Desempenho — últimos 7 dias</p>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                      {[
                        {l:'Taxa',     v:taxaP!==null?`${taxaP}%`:'—', cor:rCorP},
                        {l:'Disparos', v:tentP||'—',                   cor:T.ink2},
                        {l:'Erros',    v:errP||'—',                    cor:errP>0?T.red:T.ink4},
                      ].map(s=>(
                        <div key={s.l} style={{textAlign:'center',padding:'9px 4px',
                          background:T.bg3,borderRadius:9,border:`1px solid ${T.sep}`}}>
                          <p style={{fontSize:18,fontWeight:700,color:s.cor,margin:0,
                            letterSpacing:'-.025em',lineHeight:1}}>{s.v}</p>
                          <p style={{fontSize:9,color:T.ink4,margin:'4px 0 0',
                            textTransform:'uppercase',letterSpacing:'.06em'}}>{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Barra de salvar */}
              {dirty && (
                <div style={{flexShrink:0,padding:'10px 14px',borderTop:'0.5px solid var(--sep)',background:T.bg2,display:'flex',gap:7}}>
                  <button onClick={salvar} disabled={salvando} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'9px',borderRadius:9,border:`1px solid ${T.greenBor}`,background:T.greenDim,color:T.green,cursor:'pointer',fontSize:12.5,fontWeight:700}}>
                    {salvando?<><RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Salvando...</>:salvoOk?<><Check size={13}/> Salvo!</>:<><Save size={13}/> Salvar template</>}
                  </button>
                </div>
              )}

                {/* Meta Analytics */}
                <MetaAnalyticsCard stats={metaStats[selId]}/>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bulk toolbar */}
      {selEst.size>0&&(
        <div style={{position:'fixed',bottom:0,left:0,right:0,
          display:'flex',alignItems:'center',gap:10,padding:'10px 20px',
          background:'rgba(13,16,23,0.96)',backdropFilter:'blur(12px)',
          WebkitBackdropFilter:'blur(12px)',borderTop:`1px solid ${T.purpleBor}`,
          boxShadow:'0 -4px 24px rgba(0,0,0,.5)',zIndex:100,
          animation:'slideup .2s ease',flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:7,flexShrink:0}}>
            <div style={{width:22,height:22,borderRadius:7,background:T.purple,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontSize:11,fontWeight:700,color:'#fff'}}>{selEst.size}</span>
            </div>
            <span style={{fontSize:12,color:T.ink2,fontWeight:500}}>
              gatilho{selEst.size>1?'s':''} selecionado{selEst.size>1?'s':''}
            </span>
          </div>
          <div style={{flex:1}}/>
          <button onClick={ativarLote} style={{display:'flex',alignItems:'center',gap:5,
            padding:'7px 13px',borderRadius:9,border:'none',cursor:'pointer',
            background:'linear-gradient(135deg,#14532d,#166534)',
            color:T.green,fontSize:12,fontWeight:600}}>
            <CheckCircleIc size={13}/>Ativar {selEst.size}
          </button>
          <button onClick={desativLote} style={{display:'flex',alignItems:'center',gap:5,
            padding:'7px 13px',borderRadius:9,border:`1px solid ${T.redBor}`,cursor:'pointer',
            background:T.redDim,color:T.red,fontSize:12,fontWeight:600}}>
            <X size={13}/>Desativar {selEst.size}
          </button>
          <button onClick={()=>setSelEst(new Set())} style={{width:30,height:30,borderRadius:8,
            border:`1px solid ${T.sep2}`,background:T.bg3,color:T.ink3,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <X size={13}/>
          </button>
        </div>
      )}

      {/* Molise Panel */}
      {molisesAberta&&(
        <MolisePanel
          sugestoes={sugestoes}
          sugestoesFechadas={sugFechMap}
          onDismiss={key=>setSugFechMap(m=>({...m,[key]:true}))}
          onGoto={id=>{setSelId(id);setMoliseAberta(false)}}
          onClose={()=>setMoliseAberta(false)}
        />
      )}

      {/* ⌘K */}
      <CmdGatilhos open={cmdK} onClose={()=>setCmdK(false)} gatilhos={GATILHOS}
        configs={configs} onSelect={setSelId} onToggle={toggleAtivo} labelDe={labelDe}/>

      {/* Modal novo gatilho */}
      {showPlano && false && (
        <ModalGatilho modo="novo" api={api}
          onClose={()=>setShowPlano(false)}
          onSave={g=>{setShowPlano(false);setSelId(g.id)}}/>
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
      <div style={{width:"100%",maxWidth:380,borderRadius:18,overflow:"hidden",background:"var(--bg-2)",border:"1px solid var(--sep)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid var(--sep)",background:"var(--bg-3)"}}>
          <h3 style={{fontSize:14,fontWeight:700,color:"var(--label)",margin:0}}>{modo==='novo'?'Novo gatilho personalizado':'Editar gatilho'}</h3>
          <button onClick={onClose} style={{color:'var(--label-3)'}}><X size={15}/></button>
        </div>
        <div style={{padding:20,display:"flex",flexDirection:"column",gap:12}}>
          {[['label','Nome *','Ex: Produto em Trânsito',false],['string','String de ativação','Ex: #TRANSITO — cole nas Obs. Internas',true],['desc','Descrição','Para que serve este gatilho?',false]].map(([k,lb,ph,mono])=>(
            <div key={k}>
              <label style={{fontSize:11,fontWeight:500,display:"block",marginBottom:4,color:"var(--label-2)"}}>{lb}</label>
              <input value={form[k]} onChange={e=>set(k,mono?e.target.value.toUpperCase():e.target.value)}
                placeholder={ph} style={{width:"100%",padding:"10px 12px",borderRadius:9,fontSize:12,outline:"none",boxSizing:"border-box",background:'var(--bg)',border:'1px solid var(--sep)',color:mono?'var(--accent)':'var(--label)',fontFamily:mono?'monospace':'inherit'}}/>
            </div>
          ))}
          {erro&&<p style={{fontSize:11,color:"var(--red)",margin:0}}>{erro}</p>}
          <div style={{display:"flex",gap:12,paddingTop:4}}>
            <button onClick={onClose} style={{flex:1,padding:"10px",borderRadius:10,fontSize:12,background:"var(--fill)",color:"var(--label-2)",border:"none",cursor:"pointer"}}>Cancelar</button>
            <button onClick={salvar} disabled={salvando||!form.label.trim()} style={{flex:1,padding:"10px",borderRadius:10,fontSize:12,fontWeight:600,background:"var(--accent)",color:"#000",opacity:!form.label.trim()?0.5:1,border:"none",cursor:"pointer"}}>
              {salvando?'Salvando...':'Criar gatilho'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
