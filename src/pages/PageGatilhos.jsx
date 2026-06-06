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

// ─── Recharts (gráficos NIVELMAX) ─────────────────────────────────────────────
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'

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
  const hora  = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
  const vazio = !blocos.filter(b=>b.tipo!=='quebra').length

  return (
    <div style={{width:'100%',display:'flex',flexDirection:'column',
      alignItems:'center',userSelect:'none',position:'relative',paddingTop:4}}>

      {/* ── Botões laterais (apenas visuais) ── */}
      <div style={{position:'absolute',left:10,top:72,width:3,height:26,
        borderRadius:'3px 0 0 3px',
        background:'linear-gradient(180deg,#1f2d38,#0d1820)',
        boxShadow:'-1px 0 3px rgba(0,0,0,.5)'}}/>
      <div style={{position:'absolute',left:10,top:105,width:3,height:26,
        borderRadius:'3px 0 0 3px',
        background:'linear-gradient(180deg,#1f2d38,#0d1820)',
        boxShadow:'-1px 0 3px rgba(0,0,0,.5)'}}/>
      <div style={{position:'absolute',right:10,top:90,width:3,height:48,
        borderRadius:'0 3px 3px 0',
        background:'linear-gradient(180deg,#1f2d38,#0d1820)',
        boxShadow:'1px 0 3px rgba(0,0,0,.5)'}}/>

      {/* ── Moldura ── */}
      <div style={{
        width:260,
        borderRadius:46,
        padding:'8px 7px',
        background:'linear-gradient(160deg,#1f2d38 0%,#0d1820 50%,#111c26 100%)',
        border:'1px solid rgba(255,255,255,.1)',
        boxShadow:[
          '0 0 0 1px rgba(0,0,0,.95)',
          '0 0 0 8px #0c1a22',
          '0 0 0 9px rgba(255,255,255,.05)',
          '0 24px 60px rgba(0,0,0,.85)',
          'inset 0 1px 0 rgba(255,255,255,.07)',
        ].join(','),
      }}>
        {/* Reflexo no topo */}
        <div style={{position:'absolute',top:10,left:'20%',right:'20%',height:1.5,
          background:'linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)',
          borderRadius:99,zIndex:2,pointerEvents:'none'}}/>

        {/* Tela */}
        <div style={{borderRadius:38,overflow:'hidden',background:'#0b141a',
          boxShadow:'inset 0 0 0 1px rgba(255,255,255,.05)'}}>

          {/* Status bar */}
          <div style={{background:'#111b21',padding:'12px 18px 5px',
            display:'flex',justifyContent:'space-between',alignItems:'center',
            position:'relative'}}>
            <span style={{fontSize:10,color:'#aab8c2',fontWeight:700}}>{hora}</span>

            {/* Dynamic Island */}
            <div style={{
              position:'absolute',left:'50%',top:6,transform:'translateX(-50%)',
              width:76,height:22,borderRadius:99,
              background:'#000',
              border:'1px solid rgba(255,255,255,.07)',
              display:'flex',alignItems:'center',justifyContent:'center',gap:6,
            }}>
              <div style={{width:8,height:8,borderRadius:'50%',
                background:'#111c24',border:'1px solid rgba(255,255,255,.05)'}}/>
              <div style={{width:5,height:5,borderRadius:'50%',background:'#0d1820'}}/>
            </div>

            {/* Ícones status */}
            <div style={{display:'flex',gap:4,alignItems:'center'}}>
              {/* Barras sinal */}
              <div style={{display:'flex',alignItems:'flex-end',gap:1}}>
                {[3,5,7,9].map((h,i)=>(
                  <div key={i} style={{width:2,height:h,borderRadius:1,
                    background:i<3?'#aab8c2':'rgba(170,184,194,.25)'}}/>
                ))}
              </div>
              {/* Bateria mini */}
              <div style={{width:16,height:8,borderRadius:2,
                border:'1.2px solid rgba(170,184,194,.5)',padding:1,
                display:'flex',alignItems:'center',position:'relative'}}>
                <div style={{width:'72%',height:'100%',borderRadius:1,background:'#aab8c2'}}/>
                <div style={{position:'absolute',right:-3,top:'50%',transform:'translateY(-50%)',
                  width:2,height:4,borderRadius:'0 1px 1px 0',
                  background:'rgba(170,184,194,.4)'}}/>
              </div>
            </div>
          </div>

          {/* WA Header */}
          <div style={{background:'#202c33',padding:'7px 10px 8px',
            display:'flex',alignItems:'center',gap:7,
            borderBottom:'1px solid rgba(255,255,255,.04)'}}>
            <ChevronLeft size={17} style={{color:'#00a884',flexShrink:0}}/>
            <div style={{position:'relative',flexShrink:0}}>
              <div style={{width:32,height:32,borderRadius:'50%',
                background:'linear-gradient(135deg,#00a884,#006855)',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:13,fontWeight:800,color:'#fff',
                boxShadow:'0 2px 8px rgba(0,168,132,.3)'}}>S</div>
              <div style={{position:'absolute',bottom:0,right:0,width:8,height:8,
                borderRadius:'50%',background:'#25d366',border:'1.5px solid #202c33'}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:12,fontWeight:700,color:'#e9edef',margin:0,lineHeight:1.2}}>
                Só Strass
              </p>
              <p style={{fontSize:9,color:'#25d366',margin:0}}>online</p>
            </div>
            <div style={{display:'flex',gap:11,flexShrink:0}}>
              <Phone size={14} style={{color:'#aab8c2'}}/>
              <MoreHorizontal size={14} style={{color:'#aab8c2'}}/>
            </div>
          </div>

          {/* Chat */}
          <div style={{
            background:'#0b141a',
            minHeight:140,
            maxHeight:380,
            overflowY:'auto',
            padding:'10px 8px 12px',
          }}>
            {/* Data */}
            <div style={{display:'flex',justifyContent:'center',marginBottom:10}}>
              <span style={{fontSize:9,color:'#8696a0',
                background:'rgba(11,20,26,.9)',
                padding:'3px 10px',borderRadius:7,
                border:'1px solid rgba(255,255,255,.05)'}}>
                {new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})}
              </span>
            </div>
            {vazio ? (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',
                padding:'20px 0',opacity:.25}}>
                <MessageSquare size={20} style={{color:'#8696a0'}}/>
                <p style={{fontSize:9.5,color:'#8696a0',marginTop:6,margin:'6px 0 0',
                  textAlign:'center'}}>Configure os blocos</p>
              </div>
            ) : (
              <PreviewBolha blocos={blocos}/>
            )}
          </div>

          {/* Input bar */}
          <div style={{background:'#0b141a',padding:'6px 8px 12px',
            display:'flex',alignItems:'center',gap:6}}>
            <div style={{flex:1,background:'#2a3942',borderRadius:20,
              padding:'7px 12px',fontSize:10.5,color:'#8696a0',
              border:'1px solid rgba(255,255,255,.04)',
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>Mensagem...</span>
              <span style={{fontSize:14,opacity:.45}}>😊</span>
            </div>
            <div style={{width:34,height:34,borderRadius:'50%',
              background:'linear-gradient(135deg,#00a884,#006855)',flexShrink:0,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 3px 12px rgba(0,168,132,.4)'}}>
              <Send size={13} style={{color:'#fff',transform:'translate(1px,-1px)'}}/>
            </div>
          </div>
        </div>
      </div>

      {!vazio&&(
        <p style={{fontSize:9,color:T.ink4,textAlign:'center',marginTop:8,
          display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
          <span style={{width:4,height:4,borderRadius:'50%',background:T.green,
            display:'inline-block'}}/>
          Preview ao vivo
        </p>
      )}
    </div>
  )
}


// ─── SPARKLINE LINE (substitui barras por polyline com area) ─────────────────
function SparkCard({ serie=[], cor='#22c55e', w=72, h=28 }) {
  if (!serie || serie.length < 2) return null
  const data = serie.map((v,i)=>({i,v}))
  const gid  = `spk-${cor.replace(/[^a-z0-9]/gi,'').slice(0,8)}`
  return (
    <ResponsiveContainer width={w} height={h}>
      <AreaChart data={data} margin={{top:3,right:1,left:1,bottom:0}}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={cor} stopOpacity={0.45}/>
            <stop offset="95%" stopColor={cor} stopOpacity={0.02}/>
          </linearGradient>
          <filter id={`glow-${gid}`}>
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <Area dataKey="v" type="monotone"
          stroke={cor} strokeWidth={2}
          fill={`url(#${gid})`} fillOpacity={1}
          dot={false} activeDot={{r:3,fill:cor,strokeWidth:0}}
          filter={`url(#glow-${gid})`}/>
      </AreaChart>
    </ResponsiveContainer>
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
// ─── GATILHO DASHBOARD — NIVELMAX ────────────────────────────────────────────
function GatilhoDashboard({ pulso, sparks, jornada, insightsGat, insDismiss, setInsDismiss,
                            onGoto, atividadeRecente, custos, custosPeriodo, onSetPeriodo,
                            monitor, monitorLoad }) {

  // Contador animado para KPI cards
  function KpiCard({ label, value, cor, spk, icon:Ic }) {
    const [disp, setDisp] = useState(0)
    const num = typeof value==='number' ? value : (parseInt(String(value||''))||0)
    useEffect(()=>{
      if (!num) { setDisp(0); return }
      const t0=Date.now(), dur=700
      const tick=()=>{
        const p=Math.min((Date.now()-t0)/dur,1)
        setDisp(Math.round((1-Math.pow(1-p,3))*num))
        if(p<1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    },[num])
    return (
      <div style={{
        background:`linear-gradient(135deg,${T.bg2} 0%,${T.bg3} 100%)`,
        border:`1px solid ${T.sep2}`,borderRadius:14,overflow:'hidden',
        position:'relative',
        boxShadow:`0 8px 28px rgba(0,0,0,.28), 0 0 0 1px ${cor}10 inset`,
        transition:'transform .18s,box-shadow .18s',cursor:'default',
      }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 14px 40px rgba(0,0,0,.4), 0 0 32px ${cor}18`}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=`0 8px 28px rgba(0,0,0,.28), 0 0 0 1px ${cor}10 inset`}}>
        {/* Blob decorativo */}
        <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',
          background:`radial-gradient(circle,${cor}28 0%,transparent 70%)`,pointerEvents:'none',filter:'blur(10px)'}}/>
        {/* Linha colorida topo */}
        <div style={{height:2.5,background:`linear-gradient(90deg,${cor},${cor}40)`,
          boxShadow:`0 0 8px ${cor}60`}}/>
        <div style={{padding:'11px 12px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <div style={{width:28,height:28,borderRadius:8,
              background:`linear-gradient(135deg,${cor}25,${cor}12)`,
              border:`1px solid ${cor}35`,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:`0 3px 10px ${cor}20`}}>
              <Ic size={13} style={{color:cor}}/>
            </div>
            {sparks?.[spk]&&<SparkCard serie={sparks[spk]} cor={cor} w={60} h={24}/>}
          </div>
          <div style={{fontSize:26,fontWeight:800,color:T.ink1,letterSpacing:'-.04em',
            lineHeight:1,textShadow:`0 0 24px ${cor}30`}}>{disp}</div>
          <div style={{fontSize:9.5,color:T.ink4,marginTop:4,fontWeight:500,
            textTransform:'uppercase',letterSpacing:'.07em'}}>{label}</div>
        </div>
      </div>
    )
  }

  // Dados para o gráfico de evolução (últimos 7 dias a partir dos sparks)
  const evolucao = useMemo(()=>{
    if(!sparks?.disparos||!sparks.disparos.length) return []
    const dias = sparks.disparos.length
    return sparks.disparos.map((v,i)=>({
      d: `D-${dias-1-i}`,
      disparos: v,
      enviados: sparks.enviados?.[i]||0,
      ignorados: Math.max(0,(sparks.ignorados?.[i]||0)),
    }))
  },[sparks])

  // Dados de performance por gatilho (de pulso.porGatilho)
  const gatPerf = useMemo(()=>{
    if(!pulso?.porGatilho) return []
    return Object.entries(pulso.porGatilho)
      .map(([id,g])=>{
        const gat = GATILHOS.find(x=>x.id===id)
        const tent = (g.enviados||0)+(g.erros||0)
        const taxa = tent>0 ? Math.round((g.enviados||0)/tent*100) : null
        return { id, label:gat?.label||id, cor:gat?.cor||T.ink3,
                 total:g.total||0, enviados:g.enviados||0, erros:g.erros||0,
                 ignorados:g.ignorados||0, taxa }
      })
      .filter(g=>g.total>0)
      .sort((a,b)=>b.total-a.total)
      .slice(0,8)
  },[pulso])

  return (
    <div style={{flex:1,overflowY:'auto',background:T.bg0,padding:'18px 20px',
      display:'flex',flexDirection:'column',gap:16}}>

      {/* ── CSS ANIMATIONS ── */}
      <style>{`
        @keyframes gat-pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes gat-glow{0%,100%{box-shadow:0 0 6px rgba(0,230,118,.2)}50%{box-shadow:0 0 18px rgba(0,230,118,.6)}}
        @keyframes gat-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes gat-fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ── 0. SISTEMA DE SAÚDE — barra de status global ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,
        animation:'gat-fadeUp .35s ease'}}>
        {/* Meta API Status */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${pulso?.meta?.aprovados>0?T.greenBor:T.sep2}`,
          borderRadius:12, padding:'11px 13px',
          display:'flex', alignItems:'center', gap:10,
          boxShadow:'0 6px 20px rgba(0,0,0,.25)',
        }}>
          <div style={{width:10,height:10,borderRadius:'50%',flexShrink:0,
            background:pulso?.meta?.aprovados>0?T.green:T.amber,
            boxShadow:pulso?.meta?.aprovados>0?`0 0 10px ${T.green}`:undefined,
            animation:'gat-pulse 2s ease infinite'}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:10.5,fontWeight:700,color:T.ink1}}>Meta API</div>
            <div style={{fontSize:9.5,color:T.ink4,marginTop:1}}>
              {pulso?.meta?.aprovados>0?'Conectado e operacional':'Verificando conexão...'}
            </div>
          </div>
          <div style={{fontSize:11,fontWeight:700,
            color:pulso?.meta?.aprovados>0?T.green:T.amber,flexShrink:0}}>
            {pulso?.meta?.aprovados||0}/{(pulso?.meta?.aprovados||0)+(pulso?.meta?.analise||0)+(pulso?.meta?.rejeitados||0)} aprv.
          </div>
        </div>
        {/* Gatilhos críticos */}
        {(() => {
          const criticos = (insightsGat||[]).filter(i=>!insDismiss.has(i.id)&&i.tipo==='critico').length
          return (
            <div style={{
              background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
              border:`1px solid ${criticos>0?T.redBor:T.sep2}`,
              borderRadius:12, padding:'11px 13px',
              display:'flex', alignItems:'center', gap:10,
              boxShadow:'0 6px 20px rgba(0,0,0,.25)',
            }}>
              <div style={{width:30,height:30,borderRadius:9,flexShrink:0,
                background:criticos>0?T.redDim:T.greenDim,
                border:`1px solid ${criticos>0?T.redBor:T.greenBor}`,
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                {criticos>0?<AlertTriangle size={14} style={{color:T.red}}/>:<CheckCircle size={14} style={{color:T.green}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10.5,fontWeight:700,color:T.ink1}}>Gatilhos críticos</div>
                <div style={{fontSize:9.5,color:T.ink4,marginTop:1}}>
                  {criticos>0?`${criticos} precisam de atenção`:'Todos operacionais'}
                </div>
              </div>
              <div style={{fontSize:18,fontWeight:800,letterSpacing:'-.04em',
                color:criticos>0?T.red:T.green,flexShrink:0}}>{criticos}</div>
            </div>
          )
        })()}
        {/* Taxa de entrega hoje */}
        {(() => {
          const h = pulso?.disparosHoje||0
          const e = pulso?.enviadosHoje||0
          const tx = h>0?Math.round(e/h*100):null
          const cor = tx===null?T.ink4:tx>=80?T.green:tx>=50?T.amber:T.red
          return (
            <div style={{
              background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
              border:`1px solid ${T.sep2}`,
              borderRadius:12, padding:'11px 13px',
              display:'flex', alignItems:'center', gap:10,
              boxShadow:'0 6px 20px rgba(0,0,0,.25)',
            }}>
              <div style={{position:'relative',width:36,height:36,flexShrink:0}}>
                <svg width="36" height="36" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="4"/>
                  <circle cx="18" cy="18" r="14" fill="none"
                    stroke={cor} strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="88"
                    strokeDashoffset={tx===null?88:Math.round(88*(1-(tx/100)))}
                    transform="rotate(-90 18 18)"
                    style={{transition:'stroke-dashoffset 1s ease',
                      filter:`drop-shadow(0 0 4px ${cor})`}}/>
                </svg>
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',
                  justifyContent:'center',fontSize:9,fontWeight:800,color:cor}}>
                  {tx===null?'—':`${tx}%`}
                </div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10.5,fontWeight:700,color:T.ink1}}>Taxa hoje</div>
                <div style={{fontSize:9.5,color:T.ink4,marginTop:1}}>
                  {h>0?`${e} de ${h} disparos enviados`:'Nenhum disparo hoje'}
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── 1. KPI CARDS ── */}
      {pulso && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,
          animation:'gat-fadeUp .4s ease'}}>
          {[
            {l:'Aprovados',    v:pulso.meta?.aprovados||0,   cor:T.green,  spk:'aprovados',   icon:CheckCircle},
            {l:'Em análise',   v:pulso.meta?.analise||0,     cor:T.amber,  spk:'analise',     icon:Clock},
            {l:'Não enviados', v:pulso.meta?.naoEnviados||0, cor:T.ink2,   spk:'naoEnviados', icon:Minus},
            {l:'Rejeitados',   v:pulso.meta?.rejeitados||0,  cor:T.red,    spk:'rejeitados',  icon:AlertCircle},
            {l:'Disparos hoje',v:pulso.disparosHoje||0,      cor:T.blue,   spk:'disparos',    icon:Zap},
            {l:'Em rota',      v:pulso.clientesEmRota||0,    cor:T.purple, spk:'emRota',      icon:Truck},
          ].map((c,i)=>(
            <KpiCard key={i} label={c.l} value={c.v} cor={c.cor} spk={c.spk} icon={c.icon}/>
          ))}
        </div>
      )}

      {/* ── 2. GRÁFICO DE EVOLUÇÃO + INSIGHTS ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:14,
        animation:'gat-fadeUp .4s ease .06s both'}}>

        {/* Area chart com glow */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:16,padding:'16px 18px',
          boxShadow:'0 10px 40px rgba(0,0,0,.3), 0 1px 0 rgba(255,255,255,.04) inset'
        }}>
          <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:14}}>
            <div style={{width:30,height:30,borderRadius:9,
              background:T.greenDim,border:`1px solid ${T.greenBor}`,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:`0 3px 12px ${T.green}20`}}>
              <TrendingUp size={14} style={{color:T.green}}/>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.ink1,letterSpacing:'-.02em'}}>
                Evolução de Disparos
              </div>
              <div style={{fontSize:10,color:T.ink4}}>Últimos 7 dias</div>
            </div>
            <div style={{marginLeft:'auto',display:'flex',gap:10,alignItems:'center'}}>
              {[{cor:T.green,lbl:'Enviados'},{cor:T.amber,lbl:'Ignorados'}].map(s=>(
                <div key={s.lbl} style={{display:'flex',alignItems:'center',gap:4}}>
                  <div style={{width:16,height:2,borderRadius:99,background:s.cor,
                    boxShadow:`0 0 5px ${s.cor}`}}/>
                  <span style={{fontSize:9.5,color:T.ink3,fontWeight:600}}>{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>
          {evolucao.length<2?(
            <div style={{height:140,display:'flex',alignItems:'center',justifyContent:'center',
              color:T.ink4,fontSize:11,flexDirection:'column',gap:6}}>
              <Activity size={20} style={{opacity:.2}}/>
              Aguardando dados de evolução...
            </div>
          ):(
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={evolucao} margin={{top:6,right:4,left:-22,bottom:0}}>
                <defs>
                  <linearGradient id="gg-env" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={T.green} stopOpacity={0.35}/>
                    <stop offset="100%" stopColor={T.green} stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="gg-ign" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={T.amber} stopOpacity={0.25}/>
                    <stop offset="100%" stopColor={T.amber} stopOpacity={0.01}/>
                  </linearGradient>
                  <filter id="gg-glow-env">
                    <feGaussianBlur stdDeviation="2" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,.04)" vertical={false}/>
                <XAxis dataKey="d" tick={{fontSize:9,fill:T.ink4}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:9,fill:T.ink4}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{background:T.bg3,border:`1px solid ${T.sep2}`,
                  borderRadius:10,fontSize:11,boxShadow:'0 8px 24px rgba(0,0,0,.5)'}}
                  labelStyle={{color:T.ink2,fontWeight:700}}
                  itemStyle={{color:T.ink2}}
                  formatter={(v,n)=>[v,n==='enviados'?'Enviados':'Ignorados']}/>
                <Area dataKey="ignorados" type="monotone"
                  stroke={T.amber} strokeWidth={1.5} strokeOpacity={0.7}
                  fill="url(#gg-ign)" fillOpacity={1} dot={false}/>
                <Area dataKey="enviados" type="monotone"
                  stroke={T.green} strokeWidth={2.5}
                  fill="url(#gg-env)" fillOpacity={1}
                  dot={false} activeDot={{r:4,fill:T.green,stroke:T.bg0,strokeWidth:2}}
                  filter="url(#gg-glow-env)"/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Insights panel */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:16,overflow:'hidden',
          boxShadow:'0 10px 40px rgba(0,0,0,.3)'
        }}>
          <div style={{padding:'12px 14px',borderBottom:`1px solid ${T.sep}`,
            display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:T.amber,
              animation:'gat-pulse 2s ease infinite'}}/>
            <span style={{fontSize:12,fontWeight:700,color:T.ink1}}>Inteligência dos Gatilhos</span>
            {insightsGat.filter(i=>!insDismiss.has(i.id)).length>0&&(
              <span style={{fontSize:9,padding:'1px 7px',borderRadius:99,marginLeft:'auto',
                background:T.redDim,color:T.red,border:`1px solid ${T.redBor}`,fontWeight:700}}>
                {insightsGat.filter(i=>!insDismiss.has(i.id)&&i.tipo==='critico').length>0
                  ?`${insightsGat.filter(i=>!insDismiss.has(i.id)&&i.tipo==='critico').length} crítico${insightsGat.filter(i=>!insDismiss.has(i.id)&&i.tipo==='critico').length>1?'s':''}`
                  :`${insightsGat.filter(i=>!insDismiss.has(i.id)).length} alertas`}
              </span>
            )}
          </div>
          <div style={{overflowY:'auto',maxHeight:174}}>
            {insightsGat.filter(i=>!insDismiss.has(i.id)).length===0?(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',
                justifyContent:'center',padding:'28px 16px',gap:8}}>
                <div style={{width:36,height:36,borderRadius:10,background:T.greenDim,
                  border:`1px solid ${T.greenBor}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <CheckCircle size={16} style={{color:T.green}}/>
                </div>
                <span style={{fontSize:11,color:T.ink4,textAlign:'center'}}>
                  Tudo em ordem!
                </span>
              </div>
            ):(
              <div style={{padding:'8px 10px',display:'flex',flexDirection:'column',gap:7}}>
                {insightsGat.filter(i=>!insDismiss.has(i.id)).map(ins=>(
                  <InsightCardGat key={ins.id} ins={ins}
                    onDismiss={()=>setInsDismiss(d=>new Set([...d,ins.id]))}
                    onGoto={onGoto}/>
                ))}
              </div>
            )}
          </div>
          {insightsGat.filter(i=>!insDismiss.has(i.id)).length>0&&(
            <div style={{padding:'8px 14px',borderTop:`1px solid ${T.sep}`}}>
              <button onClick={()=>setInsDismiss(new Set(insightsGat.map(i=>i.id)))}
                style={{fontSize:10,color:T.ink4,background:'transparent',cursor:'pointer',
                  padding:'3px 8px',borderRadius:6,border:`1px solid ${T.sep}`,width:'100%'}}>
                Dispensar todos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. MATRIZ DE PERFORMANCE + JORNADA ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,
        animation:'gat-fadeUp .4s ease .12s both'}}>

        {/* Matriz de gatilhos */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:16,padding:'14px 16px',
          boxShadow:'0 10px 40px rgba(0,0,0,.3)'
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <div style={{width:28,height:28,borderRadius:8,
              background:T.purpleDim,border:`1px solid ${T.purpleBor}`,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Zap size={13} style={{color:T.purple}}/>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.ink1}}>Performance por Gatilho</div>
              <div style={{fontSize:9.5,color:T.ink4}}>Taxa de entrega · volume</div>
            </div>
          </div>
          {gatPerf.length===0?(
            <div style={{textAlign:'center',padding:'20px 0',color:T.ink4,fontSize:11}}>
              Nenhum disparo no período
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:3}}>
              {gatPerf.map(g=>{
                const maxT = Math.max(...gatPerf.map(x=>x.total),1)
                const pct  = Math.round(g.total/maxT*100)
                const isCritico = g.taxa===null&&g.total>=3
                const sc = g.taxa===null?T.ink4:g.taxa>=80?T.green:g.taxa>=50?T.amber:T.red
                const GIco = GATILHOS.find(x=>x.id===g.id)?.icon||Zap
                return (
                  <div key={g.id} onClick={()=>onGoto(g.id)}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'7px 8px',
                      borderRadius:9,cursor:'pointer',transition:'background .12s',
                      background:isCritico?'rgba(255,71,87,.04)':'transparent',
                      border:`1px solid ${isCritico?'rgba(255,71,87,.12)':'transparent'}`}}
                    onMouseEnter={e=>e.currentTarget.style.background=isCritico?'rgba(255,71,87,.08)':T.bg4}
                    onMouseLeave={e=>e.currentTarget.style.background=isCritico?'rgba(255,71,87,.04)':'transparent'}>
                    <div style={{width:24,height:24,borderRadius:7,flexShrink:0,
                      background:`${g.cor}18`,border:`1px solid ${g.cor}28`,
                      display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <GIco size={11} style={{color:g.cor}}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontSize:11,fontWeight:600,color:T.ink1,
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:130}}>
                          {g.label}
                        </span>
                        <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                          <span style={{fontSize:11,fontWeight:700,color:T.ink2}}>{g.total}</span>
                          <span style={{fontSize:9,padding:'1px 6px',borderRadius:99,fontWeight:700,
                            background:`${sc}18`,color:sc,border:`0.5px solid ${sc}35`,letterSpacing:'.03em'}}>
                            {g.taxa===null?'—':`${g.taxa}%`}
                          </span>
                          {isCritico&&(
                            <span style={{fontSize:8,padding:'1px 6px',borderRadius:99,
                              background:T.redDim,color:T.red,border:`1px solid ${T.redBor}`,fontWeight:700}}>
                              ATIVAR
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{height:4,borderRadius:99,background:T.bg4,overflow:'hidden',position:'relative'}}>
                        <div style={{position:'absolute',left:0,top:0,height:'100%',
                          width:`${pct}%`,borderRadius:99,
                          background:`linear-gradient(90deg,${g.cor},${g.cor}70)`,
                          boxShadow:`0 0 6px ${g.cor}40`,
                          transition:'width .8s cubic-bezier(.4,0,.2,1)'}}/>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Jornada do cliente */}
        {jornada&&(
          <div style={{
            background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
            border:`1px solid ${T.sep2}`,borderRadius:16,padding:'14px 16px',
            boxShadow:'0 10px 40px rgba(0,0,0,.3)'
          }}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
              <div style={{width:28,height:28,borderRadius:8,
                background:T.blueDim,border:`1px solid ${T.blueBor}`,
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Navigation size={13} style={{color:T.blue}}/>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.ink1}}>Jornada — agora</div>
                <div style={{fontSize:9.5,color:T.ink4}}>
                  {Object.values(jornada.etapas||{}).reduce((a,b)=>a+b,0)} clientes em andamento
                </div>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              {[
                {id:'compra',  lbl:'Compra',    icon:ShoppingBag, cor:T.purple},
                {id:'preparo', lbl:'Preparo',   icon:Package,     cor:T.blue},
                {id:'envio',   lbl:'Envio',     icon:Truck,       cor:T.green},
                {id:'pos',     lbl:'Pós-venda', icon:RefreshCw,   cor:T.amber},
                {id:'ia',      lbl:'IA',        icon:Brain,       cor:T.purple},
              ].map((e,i,arr)=>{
                const n    = jornada.etapas?.[e.id]||0
                const ativ = n>0
                const EIc  = e.icon
                const maxE = Math.max(...arr.map(a=>jornada.etapas?.[a.id]||0),1)
                const pctH = Math.round(n/maxE*100)
                return (
                  <div key={e.id} style={{display:'flex',alignItems:'center',flex:i<arr.length-1?1:'0 0 auto'}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,flexShrink:0}}>
                      {/* Node com glow */}
                      <div style={{width:44,height:44,borderRadius:'50%',flexShrink:0,
                        background:ativ?`linear-gradient(135deg,${e.cor}40,${e.cor}18)`:T.bg4,
                        border:`2px solid ${ativ?e.cor:T.sep}`,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        boxShadow:ativ?`0 0 20px ${e.cor}35,0 4px 16px rgba(0,0,0,.3)`:'0 4px 12px rgba(0,0,0,.2)',
                        animation:ativ?'gat-glow 3s ease-in-out infinite':undefined,
                        transition:'all .3s'}}>
                        <EIc size={18} style={{color:ativ?e.cor:T.ink4}}/>
                      </div>
                      <span style={{fontSize:20,fontWeight:800,color:ativ?e.cor:T.ink4,
                        lineHeight:1,textShadow:ativ?`0 0 20px ${e.cor}50`:undefined}}>
                        {n||'—'}
                      </span>
                      <span style={{fontSize:9,color:ativ?e.cor:T.ink4,textAlign:'center',
                        fontWeight:ativ?700:400}}>{e.lbl}</span>
                    </div>
                    {i<arr.length-1&&(
                      <div style={{flex:1,height:2.5,margin:'0 3px',marginBottom:32,borderRadius:99,
                        background:n>0
                          ?`linear-gradient(90deg,${e.cor}70,${arr[i+1].cor}40)`
                          :T.sep,
                        boxShadow:n>0?`0 0 6px ${e.cor}30`:undefined,
                        transition:'background .5s'}}/>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 4. FEED AO VIVO + CUSTOS ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:14,
        animation:'gat-fadeUp .4s ease .18s both'}}>

        {/* Feed ao vivo */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:16,overflow:'hidden',
          boxShadow:'0 10px 40px rgba(0,0,0,.3)'
        }}>
          <div style={{padding:'12px 16px',borderBottom:`1px solid ${T.sep}`,
            display:'flex',alignItems:'center',gap:8,
            background:`linear-gradient(90deg,${T.bg3},${T.bg2})`}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:T.green,flexShrink:0,
              boxShadow:`0 0 8px ${T.green}`,animation:'gat-glow 2s ease infinite'}}/>
            <span style={{fontSize:12,fontWeight:700,color:T.ink1}}>Atividade ao vivo</span>
            <span style={{fontSize:10,color:T.ink4,marginLeft:'auto'}}>últimos 15 disparos</span>
          </div>
          <div style={{maxHeight:240,overflowY:'auto'}}>
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
                      borderBottom:`1px solid ${T.sep}`,cursor:'pointer',transition:'background .1s'}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.bg3}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:4,alignSelf:'stretch',flexShrink:0,borderRadius:99,
                      background:sCor,boxShadow:d.status==='enviado'?`0 0 6px ${T.green}50`:undefined}}/>
                    <div style={{width:26,height:26,borderRadius:7,flexShrink:0,
                      background:gat?`${gat.cor}18`:'rgba(255,255,255,.04)',
                      border:`0.5px solid ${gat?gat.cor+'28':'rgba(255,255,255,.06)'}`,
                      display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {GIco&&<GIco size={11} style={{color:gat.cor}}/>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:5}}>
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
                          <span style={{fontSize:9.5,color:T.ink3}}>{gat.label}</span>
                        </div>
                      )}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2,flexShrink:0}}>
                      <span style={{fontSize:9,padding:'1.5px 6px',borderRadius:99,
                        background:`${sCor}18`,color:sCor,fontWeight:700,border:`0.5px solid ${sCor}35`}}>
                        {d.status==='enviado'?'Enviado':d.status==='erro'?'Erro':'Ignorado'}
                      </span>
                      <span style={{fontSize:9,color:T.ink4}}>{tempoRel(d.criado_em)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Custos elevado */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:16,overflow:'hidden',
          display:'flex',flexDirection:'column',
          boxShadow:'0 10px 40px rgba(0,0,0,.3)'
        }}>
          <div style={{padding:'12px 14px',borderBottom:`1px solid ${T.sep}`,flexShrink:0,
            background:`linear-gradient(90deg,${T.bg3},${T.bg2})`}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:28,height:28,borderRadius:8,
                background:T.amberDim,border:`1px solid ${T.amberBor}`,
                display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                boxShadow:`0 3px 10px ${T.amber}20`}}>
                <CreditCard size={13} style={{color:T.amber}}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <span style={{fontSize:12,fontWeight:700,color:T.ink1,display:'block'}}>Custos Meta</span>
                <span style={{fontSize:9,color:T.ink4}}>US$0,0085 por mensagem</span>
              </div>
              <div style={{display:'flex',gap:3}}>
                {['7d','30d','90d'].map(p=>(
                  <button key={p} onClick={()=>onSetPeriodo(p)}
                    style={{fontSize:9,padding:'2px 7px',borderRadius:6,border:'none',cursor:'pointer',
                      fontWeight:600,
                      background:custosPeriodo===p?T.amber:T.bg4,
                      color:custosPeriodo===p?T.bg0:T.ink4,
                      boxShadow:custosPeriodo===p?`0 2px 8px ${T.amber}40`:undefined}}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {custos?(
            <div style={{flex:1,overflowY:'auto'}}>
              <div style={{padding:'12px 14px',borderBottom:`1px solid ${T.sep}`,
                background:`radial-gradient(ellipse at 80% 0%,${T.amberDim},transparent 70%)`}}>
                <p style={{fontSize:9,color:T.ink4,textTransform:'uppercase',letterSpacing:'.07em',margin:'0 0 3px'}}>
                  Total — {custosPeriodo}
                </p>
                <p style={{fontSize:26,fontWeight:800,color:T.amber,margin:0,
                  letterSpacing:'-.04em',textShadow:`0 0 28px ${T.amber}40`}}>
                  US${custos.totalCusto}
                </p>
                <p style={{fontSize:10,color:T.ink3,margin:'3px 0 0'}}>
                  {custos.totalEnviados} mensagens entregues
                </p>
              </div>
              {Object.entries(custos.porGatilho||{})
                .sort((a,b)=>b[1].enviados-a[1].enviados)
                .slice(0,7)
                .map(([id,c])=>{
                  const gat=GATILHOS.find(x=>x.id===id)
                  const GIco=gat?.icon
                  const maxC=Math.max(...Object.values(custos.porGatilho||{}).map(x=>parseFloat(x.custo)||0),0.01)
                  const pctC=Math.round((parseFloat(c.custo)||0)/maxC*100)
                  return (
                    <div key={id} onClick={()=>onGoto(id)}
                      style={{padding:'7px 14px',borderBottom:`1px solid ${T.sep}`,
                        cursor:'pointer',transition:'background .1s'}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.bg3}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                        {GIco&&<GIco size={10} style={{color:gat.cor,flexShrink:0}}/>}
                        <span style={{flex:1,fontSize:10.5,color:T.ink2,overflow:'hidden',
                          textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {gat?.label||id}
                        </span>
                        <span style={{fontSize:10,color:T.amber,fontWeight:700,flexShrink:0}}>
                          US${c.custo}
                        </span>
                      </div>
                      <div style={{height:3,borderRadius:99,background:T.bg4,overflow:'hidden'}}>
                        <div style={{height:'100%',borderRadius:99,width:`${pctC}%`,
                          background:`linear-gradient(90deg,${T.amber},${T.amber}80)`,
                          boxShadow:`0 0 6px ${T.amber}40`,
                          transition:'width .8s cubic-bezier(.4,0,.2,1)'}}/>
                      </div>
                    </div>
                  )
                })
              }
            </div>
          ):(
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
              <p style={{fontSize:11,color:T.ink4,textAlign:'center',lineHeight:1.5}}>
                Configure o backend para<br/>ver os custos
              </p>
            </div>
          )}
        </div>
      </div>
      {/* ══════════════════════════════════════════════════════════════════
          MONITORAMENTO AVANÇADO — 10 Métricas
      ══════════════════════════════════════════════════════════════════ */}
      {monitorLoad && !monitor && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',
          gap:10,padding:'32px 0',color:T.ink4,animation:'gat-fadeUp .4s ease .3s both'}}>
          <RefreshCw size={16} style={{color:T.purple,animation:'gat-pulse 1s linear infinite'}}/>
          <span style={{fontSize:12}}>Carregando métricas avançadas...</span>
        </div>
      )}

      {monitor && (<>

      {/* ── M1: Health Score + Anomalias (destaque se crítico) ── */}
      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:14,
        animation:'gat-fadeUp .4s ease .28s both'}}>

        {/* Health Score */}
        {(() => {
          const s = monitor.health
          const sc = s?.score
          const cor = sc===null?T.ink4:sc>=85?T.green:sc>=60?T.amber:T.red
          const CIRC = 176  // 2π×28
          const dashOff = sc!==null ? Math.round(CIRC*(1-sc/100)) : CIRC
          return (
            <div style={{
              background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
              border:`1.5px solid ${sc!==null&&sc<60?T.redBor:T.sep2}`,
              borderRadius:16, padding:'16px',
              boxShadow:sc!==null&&sc<60
                ?`0 8px 32px rgba(0,0,0,.3),0 0 0 1px ${T.red}18 inset`
                :'0 8px 32px rgba(0,0,0,.25)',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <div style={{width:28,height:28,borderRadius:8,
                  background:`${cor}20`,border:`1px solid ${cor}35`,
                  display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Activity size={13} style={{color:cor}}/>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:T.ink1}}>Health Score WA</div>
                  <div style={{fontSize:9.5,color:T.ink4}}>conta WhatsApp Business</div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div style={{position:'relative',width:70,height:70,flexShrink:0}}>
                  <svg width="70" height="70" viewBox="0 0 70 70">
                    <circle cx="35" cy="35" r="28" fill="none" stroke={T.bg4} strokeWidth="7"/>
                    <circle cx="35" cy="35" r="28" fill="none"
                      stroke={cor} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${CIRC}`}
                      strokeDashoffset={dashOff}
                      transform="rotate(-90 35 35)"
                      style={{transition:'stroke-dashoffset 1.5s ease',
                        filter:`drop-shadow(0 0 6px ${cor})`}}/>
                  </svg>
                  <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
                    alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:18,fontWeight:800,color:cor,lineHeight:1}}>
                      {sc??'—'}
                    </span>
                    <span style={{fontSize:7.5,color:T.ink4,marginTop:1}}>score</span>
                  </div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11.5,fontWeight:700,color:cor,marginBottom:6}}>{s?.label}</div>
                  {[
                    {l:'Taxa entrega 7d',v:s?.taxa7!==null?`${s.taxa7}%`:'—',c:s?.taxa7>=80?T.green:T.amber},
                    {l:'Taxa erro',      v:s?.errRate!==null?`${s.errRate}%`:'—',c:s?.errRate<5?T.green:T.red},
                    {l:'Clientes 7d',   v:s?.clientesAlcancados??'—',c:T.ink2},
                  ].map(i=>(
                    <div key={i.l} style={{display:'flex',justifyContent:'space-between',
                      marginBottom:3}}>
                      <span style={{fontSize:10,color:T.ink4}}>{i.l}</span>
                      <span style={{fontSize:10,fontWeight:700,color:i.c}}>{i.v}</span>
                    </div>
                  ))}
                  {sc!==null&&sc<60&&(
                    <div style={{marginTop:6,padding:'4px 8px',borderRadius:6,
                      background:T.redDim,border:`1px solid ${T.redBor}`,
                      fontSize:9,color:T.red,fontWeight:700}}>
                      ⚠️ Risco de suspensão da conta
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {/* Anomalias detectadas */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1.5px solid ${monitor.anomalias?.length?T.redBor:T.sep2}`,
          borderRadius:16, padding:'14px 16px',
          boxShadow:'0 8px 32px rgba(0,0,0,.25)',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div style={{width:28,height:28,borderRadius:8,
              background:monitor.anomalias?.length?T.redDim:T.greenDim,
              border:`1px solid ${monitor.anomalias?.length?T.redBor:T.greenBor}`,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              {monitor.anomalias?.length
                ?<AlertTriangle size={13} style={{color:T.red}}/>
                :<CheckCircle size={13} style={{color:T.green}}/>}
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.ink1}}>Detecção de Anomalias</div>
              <div style={{fontSize:9.5,color:T.ink4}}>comparando últimas 4h com média histórica</div>
            </div>
            {monitor.anomalias?.length>0&&(
              <span style={{marginLeft:'auto',fontSize:9,padding:'2px 8px',borderRadius:99,
                background:T.redDim,color:T.red,border:`1px solid ${T.redBor}`,fontWeight:700}}>
                {monitor.anomalias.length} alerta{monitor.anomalias.length>1?'s':''}
              </span>
            )}
          </div>
          {monitor.anomalias?.length===0?(
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0'}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:T.green,
                boxShadow:`0 0 8px ${T.green}`,animation:'gat-pulse 2s infinite'}}/>
              <span style={{fontSize:11.5,color:T.ink3}}>Todos os gatilhos operando normalmente</span>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {monitor.anomalias.map((a,i)=>{
                const isQueda = a.tipo==='queda'
                const gat = GATILHOS.find(g=>g.id===a.gatilho)
                const GIc = gat?.icon||Zap
                return (
                  <div key={i} onClick={()=>onGoto(a.gatilho)}
                    style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',
                      borderRadius:9,cursor:'pointer',transition:'background .1s',
                      background:isQueda?'rgba(255,71,87,.05)':'rgba(255,179,0,.05)',
                      border:`1px solid ${isQueda?'rgba(255,71,87,.2)':'rgba(255,179,0,.2)'}`}}
                    onMouseEnter={e=>e.currentTarget.style.background=isQueda?'rgba(255,71,87,.1)':'rgba(255,179,0,.1)'}
                    onMouseLeave={e=>e.currentTarget.style.background=isQueda?'rgba(255,71,87,.05)':'rgba(255,179,0,.05)'}>
                    <div style={{width:26,height:26,borderRadius:8,flexShrink:0,
                      background:`${gat?.cor||T.ink3}18`,border:`1px solid ${gat?.cor||T.ink3}30`,
                      display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <GIc size={12} style={{color:gat?.cor||T.ink3}}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11.5,fontWeight:600,color:T.ink1,marginBottom:2}}>
                        {gat?.label||a.gatilho}
                      </div>
                      <div style={{fontSize:10,color:T.ink3}}>
                        {isQueda?'Queda':'Pico'} de {Math.abs(a.variacaoPct)}% vs média
                        · {a.volume4h} disparos em 4h (esperado: {a.esperado4h})
                      </div>
                    </div>
                    <span style={{fontSize:14,fontWeight:800,flexShrink:0,
                      color:isQueda?T.red:T.amber}}>
                      {a.variacaoPct>0?'+':''}{a.variacaoPct}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── M2: Cobertura + Volume perdido ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,
        animation:'gat-fadeUp .4s ease .33s both'}}>

        {/* Cobertura de gatilhos por pedido */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:16,padding:'14px 16px',
          boxShadow:'0 8px 32px rgba(0,0,0,.25)',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <div style={{width:28,height:28,borderRadius:8,
              background:T.blueDim,border:`1px solid ${T.blueBor}`,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Shield size={13} style={{color:T.blue}}/>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.ink1}}>Cobertura de Notificações</div>
              <div style={{fontSize:9.5,color:T.ink4}}>pedidos rastreados últimos 30 dias</div>
            </div>
          </div>
          {(() => {
            const c = monitor.cobertura
            const total = c?.totalRastreados||0
            if (!total) return (
              <p style={{fontSize:11,color:T.ink4,textAlign:'center',padding:'12px 0',margin:0}}>
                Sem dados de rastreio ainda
              </p>
            )
            const bars = [
              {l:'Com disparo enviado', v:c.comDisparo, pct:Math.round(c.comDisparo/total*100), c:T.green},
              {l:'Só ignorados',        v:c.soIgnorados,pct:Math.round(c.soIgnorados/total*100), c:T.amber},
              {l:'Sem nenhuma notif.',  v:c.semNenhum,  pct:Math.round(c.semNenhum/total*100),  c:T.red},
            ]
            return (
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  <div style={{position:'relative',width:60,height:60}}>
                    <svg width="60" height="60" viewBox="0 0 60 60">
                      <circle cx="30" cy="30" r="24" fill="none" stroke={T.bg4} strokeWidth="6"/>
                      <circle cx="30" cy="30" r="24" fill="none"
                        stroke={c.coberturaRate>=80?T.green:c.coberturaRate>=50?T.amber:T.red}
                        strokeWidth="6" strokeLinecap="round"
                        strokeDasharray="151"
                        strokeDashoffset={Math.round(151*(1-(c.coberturaRate||0)/100))}
                        transform="rotate(-90 30 30)"
                        style={{transition:'stroke-dashoffset 1.2s ease',
                          filter:`drop-shadow(0 0 5px ${c.coberturaRate>=80?T.green:T.amber})`}}/>
                    </svg>
                    <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
                      alignItems:'center',justifyContent:'center'}}>
                      <span style={{fontSize:15,fontWeight:800,
                        color:c.coberturaRate>=80?T.green:c.coberturaRate>=50?T.amber:T.red,lineHeight:1}}>
                        {c.coberturaRate??'—'}%
                      </span>
                    </div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:T.ink3,marginBottom:4}}>
                      <strong style={{color:T.ink1}}>{total}</strong> pedidos rastreados
                    </div>
                    {bars.map(b=>(
                      <div key={b.l} style={{marginBottom:5}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                          <span style={{fontSize:9.5,color:T.ink4}}>{b.l}</span>
                          <span style={{fontSize:9.5,fontWeight:700,color:b.c}}>{b.v} ({b.pct}%)</span>
                        </div>
                        <div style={{height:3,borderRadius:99,background:T.bg4}}>
                          <div style={{height:'100%',borderRadius:99,background:b.c,
                            width:`${b.pct}%`,boxShadow:`0 0 6px ${b.c}40`,
                            transition:'width .8s ease'}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {c.semNenhum>=5&&(
                  <div style={{padding:'7px 10px',borderRadius:8,
                    background:T.redDim,border:`1px solid ${T.redBor}`,
                    fontSize:10,color:T.red,fontWeight:600}}>
                    ⚠️ {c.semNenhum} pedidos entregues sem nenhuma notificação WhatsApp
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Volume perdido por templates inativos */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${monitor.perdidos?.length?T.amberBor:T.sep2}`,
          borderRadius:16,padding:'14px 16px',
          boxShadow:'0 8px 32px rgba(0,0,0,.25)',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div style={{width:28,height:28,borderRadius:8,
              background:T.amberDim,border:`1px solid ${T.amberBor}`,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <AlertTriangle size={13} style={{color:T.amber}}/>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.ink1}}>Mensagens Perdidas</div>
              <div style={{fontSize:9.5,color:T.ink4}}>templates inativos · últimos 7 dias</div>
            </div>
            {monitor.perdidos?.length>0&&(
              <span style={{marginLeft:'auto',fontSize:11,fontWeight:800,color:T.amber}}>
                {monitor.perdidos.reduce((a,r)=>a+r.totalIgnorados,0)} msgs
              </span>
            )}
          </div>
          {monitor.perdidos?.length===0?(
            <div style={{padding:'12px 0',textAlign:'center',color:T.green,fontSize:11}}>
              ✓ Nenhuma mensagem perdida por template inativo
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              {monitor.perdidos.map((p,i)=>{
                const gat = GATILHOS.find(g=>g.id===p.gatilho)
                const GIc = gat?.icon||Zap
                return (
                  <div key={i} onClick={()=>onGoto(p.gatilho)}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'7px 8px',
                      borderRadius:9,cursor:'pointer',transition:'background .1s',
                      background:'rgba(255,179,0,.04)'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,179,0,.09)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(255,179,0,.04)'}>
                    <div style={{width:22,height:22,borderRadius:7,flexShrink:0,
                      background:`${gat?.cor||T.amber}18`,border:`1px solid ${gat?.cor||T.amber}30`,
                      display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <GIc size={10} style={{color:gat?.cor||T.amber}}/>
                    </div>
                    <span style={{flex:1,fontSize:11,color:T.ink2,overflow:'hidden',
                      textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {gat?.label||p.gatilho}
                    </span>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.amber}}>{p.totalIgnorados}</div>
                      <div style={{fontSize:8.5,color:T.ink4}}>{p.pedidosAfetados} ped.</div>
                    </div>
                    <span style={{fontSize:9,padding:'2px 7px',borderRadius:99,flexShrink:0,
                      background:T.redDim,color:T.red,border:`1px solid ${T.redBor}`,fontWeight:700}}>
                      ATIVAR
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── M3: Comparativo + Funil Meta + Previsão Custo ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,
        animation:'gat-fadeUp .4s ease .38s both'}}>

        {/* Comparativo semanas */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:16,padding:'14px 16px',
          boxShadow:'0 8px 32px rgba(0,0,0,.25)',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <div style={{width:28,height:28,borderRadius:8,
              background:T.purpleDim,border:`1px solid ${T.purpleBor}`,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <TrendingUp size={13} style={{color:T.purple}}/>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.ink1}}>Semana Atual vs Anterior</div>
            </div>
          </div>
          {[
            {l:'Disparos',  v:monitor.comparativo?.atual?.total,  ant:monitor.comparativo?.anterior?.total,  delta:monitor.comparativo?.deltaTotal},
            {l:'Enviados',  v:monitor.comparativo?.atual?.enviados,ant:monitor.comparativo?.anterior?.enviados,delta:null},
            {l:'Taxa entrega',v:monitor.comparativo?.atual?.taxa!==null?`${monitor.comparativo.atual.taxa}%`:'—',
              ant:monitor.comparativo?.anterior?.taxa!==null?`${monitor.comparativo.anterior.taxa}%`:'—',
              delta:monitor.comparativo?.deltaTaxa, isPct:true},
          ].map(row=>{
            const deltaVal = row.delta
            const deltaPos = deltaVal!==null&&deltaVal>0
            const deltaNeg = deltaVal!==null&&deltaVal<0
            return (
              <div key={row.l} style={{display:'flex',alignItems:'center',
                justifyContent:'space-between',padding:'7px 0',
                borderBottom:`1px solid ${T.sep}`}}>
                <span style={{fontSize:11,color:T.ink3}}>{row.l}</span>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:10,color:T.ink4}}>{row.ant??'—'}</span>
                  <span style={{color:T.ink4,fontSize:10}}>→</span>
                  <span style={{fontSize:12,fontWeight:700,color:T.ink1}}>{row.v??'—'}</span>
                  {deltaVal!==null&&(
                    <span style={{fontSize:9,padding:'1px 6px',borderRadius:99,fontWeight:700,
                      background:deltaPos?T.greenDim:deltaNeg?T.redDim:T.gray,
                      color:deltaPos?T.green:deltaNeg?T.red:T.ink4,
                      border:`0.5px solid ${deltaPos?T.greenBor:deltaNeg?T.redBor:T.grayBor}`}}>
                      {deltaPos?'+':''}{deltaVal}{row.isPct?'pp':'%'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Funil Meta */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:16,padding:'14px 16px',
          boxShadow:'0 8px 32px rgba(0,0,0,.25)',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <div style={{width:28,height:28,borderRadius:8,
              background:T.blueDim,border:`1px solid ${T.blueBor}`,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Radio size={13} style={{color:T.blue}}/>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.ink1}}>Funil de Templates Meta</div>
              <div style={{fontSize:9.5,color:T.ink4}}>submissão → aprovação → disparo</div>
            </div>
          </div>
          {(() => {
            const f = monitor.funilMeta
            const total = parseInt(f?.total||0)
            if (!total) return <p style={{fontSize:11,color:T.ink4,textAlign:'center',padding:'12px 0',margin:0}}>Nenhum template</p>
            const steps = [
              {l:'Total templates',  v:total,                    cor:T.ink3,  pct:100},
              {l:'Ativos',           v:parseInt(f?.ativos||0),   cor:T.blue,  pct:Math.round(parseInt(f?.ativos||0)/total*100)},
              {l:'Aprovados Meta',   v:parseInt(f?.aprovados||0),cor:T.green, pct:Math.round(parseInt(f?.aprovados||0)/total*100)},
              {l:'Em análise',       v:parseInt(f?.em_analise||0),cor:T.amber, pct:Math.round(parseInt(f?.em_analise||0)/total*100)},
              {l:'Rejeitados',       v:parseInt(f?.rejeitados||0),cor:T.red,  pct:Math.round(parseInt(f?.rejeitados||0)/total*100)},
            ]
            return (
              <div style={{display:'flex',flexDirection:'column',gap:7}}>
                {steps.map((s,i)=>(
                  <div key={s.l} style={{paddingLeft:i*8}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:10.5,color:T.ink3}}>{s.l}</span>
                      <span style={{fontSize:11,fontWeight:700,color:s.cor}}>{s.v}</span>
                    </div>
                    <div style={{height:4,borderRadius:99,background:T.bg4}}>
                      <div style={{height:'100%',borderRadius:99,background:s.cor,
                        width:`${s.pct}%`,boxShadow:`0 0 6px ${s.cor}40`,
                        transition:'width .8s ease'}}/>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>

        {/* Previsão de custo */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:16,padding:'14px 16px',
          boxShadow:'0 8px 32px rgba(0,0,0,.25)',
          position:'relative',overflow:'hidden'
        }}>
          <div style={{position:'absolute',top:-24,right:-24,width:100,height:100,borderRadius:'50%',
            background:`radial-gradient(circle,${T.amber}20,transparent 70%)`,
            filter:'blur(12px)',pointerEvents:'none'}}/>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,position:'relative'}}>
            <div style={{width:28,height:28,borderRadius:8,
              background:T.amberDim,border:`1px solid ${T.amberBor}`,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <CreditCard size={13} style={{color:T.amber}}/>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.ink1}}>Previsão de Custo</div>
              <div style={{fontSize:9.5,color:T.ink4}}>mês atual · US$0,0085/msg</div>
            </div>
          </div>
          {(() => {
            const c = monitor.custo
            if (!c) return null
            const pctMes = Math.round(c.diaDoMes/c.diasNoMes*100)
            return (
              <div style={{position:'relative'}}>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:9,color:T.ink4,textTransform:'uppercase',
                    letterSpacing:'.07em',marginBottom:3}}>Gasto até hoje</div>
                  <div style={{fontSize:28,fontWeight:800,color:T.amber,letterSpacing:'-.04em',
                    textShadow:`0 0 28px ${T.amber}40`}}>
                    US${c.custoMes}
                  </div>
                  <div style={{fontSize:10,color:T.ink3,marginTop:2}}>
                    {c.enviadosMes} mensagens · dia {c.diaDoMes}/{c.diasNoMes}
                  </div>
                </div>
                <div style={{height:4,borderRadius:99,background:T.bg4,marginBottom:10,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:99,
                    background:`linear-gradient(90deg,${T.amber},${T.amber}80)`,
                    width:`${pctMes}%`,transition:'width .8s ease',
                    boxShadow:`0 0 8px ${T.amber}40`}}/>
                </div>
                {c.projecao&&(
                  <div style={{padding:'8px 10px',borderRadius:9,
                    background:'rgba(255,179,0,.08)',border:`1px solid ${T.amberBor}`}}>
                    <div style={{fontSize:9,color:T.ink4,marginBottom:2}}>Projeção para fim do mês</div>
                    <div style={{fontSize:18,fontWeight:800,color:T.amber}}>US${c.projecao}</div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── M4: Horário ótimo + Taxa de resposta + Transportadoras ── */}
      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr',gap:14,
        animation:'gat-fadeUp .4s ease .43s both'}}>

        {/* Heatmap de horário */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:16,padding:'14px 16px',
          boxShadow:'0 8px 32px rgba(0,0,0,.25)',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <div style={{width:28,height:28,borderRadius:8,
              background:T.cyanDim,border:`1px solid ${T.cyanBor}`,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Clock size={13} style={{color:T.cyan}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:T.ink1}}>Janela Ideal de Envio</div>
              <div style={{fontSize:9.5,color:T.ink4}}>distribuição de disparos por hora</div>
            </div>
            {monitor.horario?.picoHora!==null&&(
              <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:99,
                background:T.cyanDim,color:T.cyan,border:`1px solid ${T.cyanBor}`}}>
                Pico: {monitor.horario.picoHora}h
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={monitor.horario?.horas||[]} margin={{top:2,right:2,left:-28,bottom:0}}>
              <defs>
                <linearGradient id="horaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.cyan} stopOpacity={0.9}/>
                  <stop offset="100%" stopColor={T.cyan} stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,.04)" vertical={false}/>
              <XAxis dataKey="hora" tick={{fontSize:8,fill:T.ink4}}
                tickFormatter={h=>h%4===0?`${h}h`:''} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:8,fill:T.ink4}} axisLine={false} tickLine={false} allowDecimals={false}/>
              <Tooltip contentStyle={{background:T.bg3,border:`1px solid ${T.sep2}`,
                borderRadius:8,fontSize:10,boxShadow:'0 4px 16px rgba(0,0,0,.4)'}}
                labelFormatter={h=>`${h}:00h`} formatter={v=>[v,'disparos']}/>
              <Bar dataKey="enviados" radius={[3,3,0,0]} maxBarSize={10}>
                {(monitor.horario?.horas||[]).map((h,i)=>(
                  <Cell key={i}
                    fill={h.hora===monitor.horario?.picoHora?T.cyan:`${T.cyan}55`}
                    style={{filter:h.hora===monitor.horario?.picoHora?`drop-shadow(0 0 5px ${T.cyan})`:undefined}}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {monitor.horario?.picoHora!==null&&(
            <div style={{marginTop:8,padding:'5px 8px',borderRadius:7,
              background:T.cyanDim,border:`1px solid ${T.cyanBor}`,
              fontSize:10,color:T.cyan}}>
              💡 Configure delays para que os disparos caiam próximos das {monitor.horario.picoHora}h
            </div>
          )}
        </div>

        {/* Taxa de resposta por gatilho */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:16,padding:'14px 16px',
          boxShadow:'0 8px 32px rgba(0,0,0,.25)',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div style={{width:28,height:28,borderRadius:8,
              background:T.greenDim,border:`1px solid ${T.greenBor}`,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <MessageSquare size={13} style={{color:T.green}}/>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.ink1}}>Taxa de Resposta</div>
              <div style={{fontSize:9.5,color:T.ink4}}>clientes que responderam em 24h</div>
            </div>
          </div>
          {monitor.taxaResposta?.length===0?(
            <p style={{fontSize:11,color:T.ink4,textAlign:'center',padding:'12px 0',margin:0}}>
              Sem dados de resposta ainda
            </p>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              {monitor.taxaResposta?.slice(0,6).map((r,i)=>{
                const gat = GATILHOS.find(g=>g.id===r.gatilho)
                const GIc = gat?.icon||Zap
                const tx  = parseFloat(r.taxaResposta||0)
                const cor = tx>=20?T.green:tx>=10?T.amber:T.red
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:7}}>
                    <div style={{width:20,height:20,borderRadius:6,flexShrink:0,
                      background:`${gat?.cor||T.ink3}15`,
                      display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <GIc size={10} style={{color:gat?.cor||T.ink3}}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                        <span style={{fontSize:10,color:T.ink3,overflow:'hidden',
                          textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:90}}>
                          {gat?.label||r.gatilho}
                        </span>
                        <span style={{fontSize:10,fontWeight:700,color:cor,flexShrink:0}}>
                          {tx}%
                        </span>
                      </div>
                      <div style={{height:3,borderRadius:99,background:T.bg4}}>
                        <div style={{height:'100%',borderRadius:99,background:cor,
                          width:`${Math.min(tx*3,100)}%`,transition:'width .8s ease'}}/>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Transportadoras */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`,borderRadius:16,padding:'14px 16px',
          boxShadow:'0 8px 32px rgba(0,0,0,.25)',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div style={{width:28,height:28,borderRadius:8,
              background:T.purpleDim,border:`1px solid ${T.purpleBor}`,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Truck size={13} style={{color:T.purple}}/>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.ink1}}>Tempo por Transportadora</div>
              <div style={{fontSize:9.5,color:T.ink4}}>média dias envio → entrega</div>
            </div>
          </div>
          {monitor.transportadoras?.length===0?(
            <p style={{fontSize:11,color:T.ink4,textAlign:'center',padding:'12px 0',margin:0}}>
              Dados insuficientes ainda
            </p>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {monitor.transportadoras?.map((t,i)=>{
                const maxDias = Math.max(...(monitor.transportadoras||[]).map(x=>x.diasMedio),1)
                const pct = Math.round(t.diasMedio/maxDias*100)
                const cor = t.diasMedio<=3?T.green:t.diasMedio<=7?T.amber:T.red
                return (
                  <div key={i}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <span style={{fontSize:11,color:T.ink1,fontWeight:600}}>{t.transportadora}</span>
                        <span style={{fontSize:9,color:T.ink4}}>({t.pedidos} ped.)</span>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <span style={{fontSize:12,fontWeight:800,color:cor}}>{t.diasMedio}d</span>
                        <span style={{fontSize:9,color:T.ink4,marginLeft:4}}>
                          {t.diasMin}-{t.diasMax}d
                        </span>
                      </div>
                    </div>
                    <div style={{height:4,borderRadius:99,background:T.bg4}}>
                      <div style={{height:'100%',borderRadius:99,background:cor,
                        width:`${pct}%`,boxShadow:`0 0 6px ${cor}40`,
                        transition:'width .8s ease'}}/>
                    </div>
                  </div>
                )
              })}
              <div style={{marginTop:4,padding:'5px 8px',borderRadius:7,
                background:'rgba(255,255,255,.03)',border:`1px solid ${T.sep}`,
                fontSize:9.5,color:T.ink4,lineHeight:1.5}}>
                💡 Use estes tempos para configurar os delays dos gatilhos de rastreio
              </div>
            </div>
          )}
        </div>
      </div>

      </>)}

    </div>
  )
}

// ─── META ANALYTICS CARD — NIVELMAX ─────────────────────────────────────────
function MetaAnalyticsCard({ stats }) {
  if (!stats) return (
    <div style={{padding:'14px 16px',borderRadius:12,background:T.bg2,
      border:`1px solid ${T.sep}`,marginTop:12}}>
      <p style={{fontSize:11,color:T.ink4,margin:0,textAlign:'center'}}>
        Sem dados Meta ainda
      </p>
    </div>
  )

  const CIRC  = 100
  const tx    = stats.taxa ?? 0
  const dashOff = Math.round(CIRC*(1-(tx/100)))
  const rCor  = tx>=90?T.green:tx>=70?T.amber:T.red

  const items = [
    { lbl:'Aprovados',   v:stats.aprovados||0,    cor:T.green  },
    { lbl:'Em análise',  v:stats.emAnalise||0,    cor:T.amber  },
    { lbl:'Rejeitados',  v:stats.rejeitados||0,   cor:T.red    },
    { lbl:'Disparados',  v:stats.disparados||0,   cor:T.blue   },
  ]

  return (
    <div style={{marginTop:12,padding:'12px 14px',borderRadius:12,
      background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
      border:`1px solid ${T.sep2}`,
      boxShadow:'0 8px 28px rgba(0,0,0,.25), 0 1px 0 rgba(255,255,255,.04) inset'}}>

      <div style={{fontSize:10,color:T.ink4,textTransform:'uppercase',
        letterSpacing:'.08em',fontWeight:600,marginBottom:11,
        display:'flex',alignItems:'center',gap:6}}>
        <Radio size={10} style={{color:T.purple}}/>
        Meta Analytics
      </div>

      {/* Ring gauge + stats */}
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        {/* Ring SVG */}
        <div style={{position:'relative',width:56,height:56,flexShrink:0}}>
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none"
              stroke="rgba(255,255,255,.06)" strokeWidth="5"/>
            <circle cx="28" cy="28" r="22" fill="none"
              stroke={rCor} strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${CIRC}`}
              strokeDashoffset={dashOff}
              transform="rotate(-90 28 28)"
              style={{
                transition:'stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)',
                filter:`drop-shadow(0 0 5px ${rCor})`
              }}/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
            alignItems:'center',justifyContent:'center'}}>
            <span style={{fontSize:14,fontWeight:800,color:rCor,lineHeight:1}}>{tx}%</span>
            <span style={{fontSize:7,color:T.ink4,marginTop:1}}>taxa</span>
          </div>
        </div>

        {/* Grid 2×2 */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,flex:1}}>
          {items.map(s=>(
            <div key={s.lbl} style={{padding:'5px 8px',borderRadius:8,
              background:'rgba(255,255,255,.03)',border:`0.5px solid rgba(255,255,255,.06)`}}>
              <div style={{fontSize:16,fontWeight:800,color:s.cor,letterSpacing:'-.03em',lineHeight:1,
                textShadow:`0 0 16px ${s.cor}50`}}>{s.v}</div>
              <div style={{fontSize:8.5,color:T.ink4,marginTop:2}}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>
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
  const [monitor, setMonitor]   = useState(null)  // 10 métricas de monitoramento avançado
  const [monitorLoad, setMonLoad] = useState(true) // carregando monitoramento
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
    fetch(`${api}/api/dashboard/monitoramento`)
      .then(r => r.json())
      .then(d => { if (vivo && d && !d.erro) { setMonitor(d); setMonLoad(false) } })
      .catch(() => { if (vivo) setMonLoad(false) })
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
              monitor={monitor}
              monitorLoad={monitorLoad}
            />
          )}

          {/* Editor Studio (com seleção) */}
          {selId && (
            <div style={{flex:1,minHeight:0,display:'grid',gridTemplateColumns:'1fr 340px',
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
              <div style={{flexShrink:0,padding:'12px 16px',
                background:`linear-gradient(135deg,${gatilho?.cor}15 0%,${T.bg2} 70%)`,
                borderBottom:`1px solid ${T.sep}`}}>

                {/* Linha 1: ícone + nome + status */}
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div style={{width:20,height:20,borderRadius:6,background:`${gatilho?.cor}20`,
                    display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {gatilho?.icon&&<gatilho.icon size={11} style={{color:gatilho?.cor}}/>}
                  </div>
                  <span style={{fontSize:12,fontWeight:600,color:T.ink1,flex:1}}>{labelAtual}</span>
                  <div style={{display:'flex',alignItems:'center',gap:4}}>
                    <div style={{width:6,height:6,borderRadius:'50%',
                      background:configs[selId]?.ativo?T.green:T.ink4}}/>
                    <span style={{fontSize:10,color:configs[selId]?.ativo?T.green:T.ink3,fontWeight:500}}>
                      {configs[selId]?.ativo?'Ativo':'Inativo'}
                    </span>
                  </div>
                </div>

                {/* Linha 2: Health ring + barras de stats */}
                {(()=>{
                  const indPrev = indicadores[selId]
                  if (!indPrev) return (
                    <p style={{fontSize:10,color:T.ink4,margin:0}}>Preview com dados de exemplo</p>
                  )
                  const envP  = indPrev.enviados||0
                  const errP  = indPrev.erros||0
                  const tentP = envP+errP
                  const taxaP = tentP>0?Math.round(envP/tentP*100):null
                  const rCorP = taxaP===null?T.ink4:taxaP>=70?T.green:taxaP>=30?T.amber:T.red
                  const CIRC2 = 69  // 2π × 11
                  const dash2 = taxaP!==null ? Math.round(CIRC2*(1-taxaP/100)) : CIRC2
                  return (
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      {/* Mini health ring */}
                      <div style={{position:'relative',width:30,height:30,flexShrink:0}}>
                        <svg width="30" height="30" viewBox="0 0 30 30">
                          <circle cx="15" cy="15" r="11" fill="none" stroke={T.bg4} strokeWidth="2.5"/>
                          <circle cx="15" cy="15" r="11" fill="none" stroke={rCorP}
                            strokeWidth="2.5" strokeDasharray={`${CIRC2}`}
                            strokeDashoffset={`${dash2}`} strokeLinecap="round"
                            transform="rotate(-90 15 15)"
                            style={{transition:'stroke-dashoffset .8s ease'}}/>
                        </svg>
                        <div style={{position:'absolute',inset:0,display:'flex',
                          alignItems:'center',justifyContent:'center'}}>
                          <span style={{fontSize:8,fontWeight:700,color:rCorP,lineHeight:1}}>
                            {taxaP!==null?`${taxaP}%`:'—'}
                          </span>
                        </div>
                      </div>
                      {/* Barras de stats */}
                      <div style={{flex:1,display:'flex',flexDirection:'column',gap:4}}>
                        {[
                          {l:'Enviados',v:envP, t:tentP, c:T.green},
                          {l:'Erros',   v:errP, t:tentP, c:T.red},
                        ].map(s=>(
                          <div key={s.l} style={{display:'flex',alignItems:'center',gap:5}}>
                            <span style={{fontSize:9,color:T.ink4,width:46,flexShrink:0}}>{s.l}</span>
                            <div style={{flex:1,height:3,borderRadius:99,background:T.bg4,overflow:'hidden'}}>
                              <div style={{height:'100%',borderRadius:99,background:s.c,
                                width:`${s.t>0?Math.round(s.v/s.t*100):0}%`,
                                transition:'width .6s ease'}}/>
                            </div>
                            <span style={{fontSize:9,color:s.c,fontWeight:600,
                              width:26,textAlign:'right',flexShrink:0}}>{s.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
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
