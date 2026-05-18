/**
 * ia-core.js — Bia v6
 *
 * Arquitetura: Function Calling nativo do Gemini
 * - Sem roteador, sem estados manuais, sem regex frágil
 * - O modelo decide qual ferramenta chamar
 * - Contexto persistente por telefone no banco
 * - Debounce de 2.5s para agrupar mensagens rápidas
 */

'use strict'

const { GoogleGenAI } = require('@google/genai')
const { query }       = require('./utils/db')
const { getIAConfig } = require('./utils/iaConfig')
const { buscarNoCatalogo } = require('./services/catalogoSync')
const { getBlingClient } = require('./utils/blingClient')

// ── Debounce por telefone ────────────────────────────────────────────────────
const _timers  = new Map()
const _buffers = new Map()
const DEBOUNCE = parseInt(process.env.DEBOUNCE_MS) || 2500

// ── Definição das ferramentas disponíveis para o Gemini ─────────────────────
const TOOLS = [{
  functionDeclarations: [
    {
      name: 'buscar_produto',
      description: 'Busca produtos no catálogo pelo nome ou descrição. Use quando o cliente mencionar qualquer produto.',
      parameters: {
        type: 'OBJECT',
        properties: {
          query: { type: 'STRING', description: 'Termo de busca. Ex: "strass base conica ss12 cristal", "fecho lagosta 10mm"' },
        },
        required: ['query']
      }
    },
    {
      name: 'adicionar_item',
      description: 'Adiciona um produto ao carrinho do cliente. Use quando o cliente confirmar quantidade e produto.',
      parameters: {
        type: 'OBJECT',
        properties: {
          bling_id:   { type: 'NUMBER',  description: 'ID do produto no Bling (obter de buscar_produto)' },
          nome:       { type: 'STRING',  description: 'Nome completo do produto' },
          preco:      { type: 'NUMBER',  description: 'Preço unitário' },
          quantidade: { type: 'NUMBER',  description: 'Quantidade desejada pelo cliente' },
          unidade:    { type: 'STRING',  description: 'Unidade (UN, PCT, etc)' },
        },
        required: ['bling_id', 'nome', 'preco', 'quantidade']
      }
    },
    {
      name: 'ver_carrinho',
      description: 'Mostra os itens atuais no carrinho do cliente. Use quando cliente pedir para ver o pedido ou antes de finalizar.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'remover_item',
      description: 'Remove ou altera quantidade de um item do carrinho.',
      parameters: {
        type: 'OBJECT',
        properties: {
          bling_id:   { type: 'NUMBER', description: 'ID do produto a remover' },
          quantidade: { type: 'NUMBER', description: 'Nova quantidade (0 = remover completamente)' },
        },
        required: ['bling_id']
      }
    },
    {
      name: 'consultar_pedido',
      description: 'Consulta status, rastreio e NF-e de um pedido no Bling. Use quando cliente perguntar sobre entrega, rastreio ou nota fiscal.',
      parameters: {
        type: 'OBJECT',
        properties: {
          identificador: { type: 'STRING', description: 'Número do pedido, CPF ou CNPJ do cliente' },
        },
        required: ['identificador']
      }
    },
    {
      name: 'finalizar_pedido',
      description: 'Cria o pedido no Bling e gera cobrança PIX. Use SOMENTE quando o cliente confirmar o carrinho e fornecer CPF/CNPJ e endereço.',
      parameters: {
        type: 'OBJECT',
        properties: {
          cpf_cnpj:    { type: 'STRING', description: 'CPF (11 dígitos) ou CNPJ (14 dígitos) do cliente' },
          nome:        { type: 'STRING', description: 'Nome completo do cliente' },
          telefone:    { type: 'STRING', description: 'Telefone do cliente' },
          cep:         { type: 'STRING', description: 'CEP do endereço de entrega' },
          endereco:    { type: 'STRING', description: 'Logradouro e número' },
          complemento: { type: 'STRING', description: 'Complemento (opcional)' },
          bairro:      { type: 'STRING', description: 'Bairro' },
          cidade:      { type: 'STRING', description: 'Cidade' },
          estado:      { type: 'STRING', description: 'Estado (sigla, ex: SP)' },
        },
        required: ['cpf_cnpj', 'nome', 'telefone', 'cep', 'endereco', 'cidade', 'estado']
      }
    },
    {
      name: 'registrar_ocorrencia',
      description: 'Registra uma reclamação ou problema para atendimento humano. Use quando o cliente tiver problema que a IA não consegue resolver.',
      parameters: {
        type: 'OBJECT',
        properties: {
          tipo:       { type: 'STRING', description: 'Tipo: entrega_atrasada, produto_errado, cancelamento, outro' },
          descricao:  { type: 'STRING', description: 'Descrição detalhada do problema relatado pelo cliente' },
          pedido_num: { type: 'STRING', description: 'Número do pedido relacionado (se houver)' },
        },
        required: ['tipo', 'descricao']
      }
    },
    {
      name: 'avisar_quando_disponivel',
      description: 'Registra interesse do cliente em produto fora de estoque.',
      parameters: {
        type: 'OBJECT',
        properties: {
          produto_nome: { type: 'STRING', description: 'Nome do produto' },
          bling_id:     { type: 'NUMBER', description: 'ID do produto no Bling' },
        },
        required: ['produto_nome']
      }
    }
  ]
}]

// ── System prompt único ──────────────────────────────────────────────────────
function buildSystemPrompt(config) {
  const persona = config.persona ||
    'Você é Molise, assistente virtual da Só Strass. Simpática, direta e eficiente.'

  return `${persona}

IDENTIDADE:
- Você se chama Molise. Molise é SEU nome — não use seu nome para se dirigir a si mesma.
- PROIBIDO: "Desculpe, Molise" / "Olá, Molise" / "Como Molise" — você nunca diz seu próprio nome em 3ª pessoa.
- Ao pedir desculpas: use apenas "Desculpe" ou "Me desculpe". Nunca "Desculpe, [nome]".
- Empresa: Só Strass. Especializada em strass, bijuterias e acessórios para artesanato.

COMPORTAMENTO:
- Responda sempre em português brasileiro, de forma natural e amigável.
- Seja direta: prefira "Quer ver foto?" a "Posso te mostrar uma imagem?".
- Máximo 1 emoji por mensagem. Prefira mensagens limpas.
- NUNCA invente dados (preços, rastreios, endereços, prazos).
- NUNCA crie números de pedido fictícios.

REGRA CRÍTICA — USO DE FERRAMENTAS:
Você tem acesso a ferramentas (function calling). SEMPRE use-as ao invés de simular em texto.
NUNCA escreva "consultar_pedido(...)" ou "buscar_produto(...)" no texto da resposta.
NUNCA diga "vou buscar" sem chamar a ferramenta imediatamente.
Quando o cliente pede informação, CHAME a ferramenta e responda com o resultado real.

FLUXO DE VENDAS:
1. Cliente menciona produto → CHAME buscar_produto() agora
2. Cliente confirma produto e quantidade → CHAME adicionar_item() agora
3. Antes de finalizar → CHAME ver_carrinho() para mostrar o resumo
4. Para fechar → peça CPF/CNPJ e endereço, depois CHAME finalizar_pedido()
5. Produto indisponível → CHAME avisar_quando_disponivel()

FLUXO DE SUPORTE:
- Cliente informa número de pedido, CPF ou CNPJ → CHAME consultar_pedido() IMEDIATAMENTE
- Não peça confirmação antes de chamar — se o cliente deu um número, já chame
- Problema sem solução → CHAME registrar_ocorrencia()

QUANDO PEDIDO NÃO ENCONTRADO:
- NÃO diga "fico feliz" ou mude de assunto — o cliente está frustrado
- Diga: "Não localizei o pedido #[numero] no sistema. Pode me informar seu CPF ou CNPJ? Assim consigo buscar por cadastro."
- Se já tentou CPF e não achou: ofereça abrir ocorrência para verificação manual

IDENTIFICAÇÃO DE PEDIDO vs SELEÇÃO DE PRODUTO:
- Se o cliente escolheu de uma lista de produtos e digitou 1, 2, 3, 4... → é SELEÇÃO de produto, não pedido
- Número de pedido tem 5-9 dígitos (ex: 226540) E o cliente falou de pedido antes
- 11 dígitos = CPF → CHAME consultar_pedido()
- 14 dígitos = CNPJ → CHAME consultar_pedido()
- Número de pedido de 5+ dígitos após contexto de suporte → CHAME consultar_pedido()
- NUNCA chame consultar_pedido() com número 1, 2, 3, 4, 5, 6, 7, 8 ou 9 isolado — esses são seleções de lista

CARRINHO:
- Formato de exibição:
  🛒 *SEU CARRINHO*
  [N]. *Nome do produto*
       Qtd: X | 💳 R$ XX,XX | 💰 PIX: R$ XX,XX
  ─────────────────
  💳 Total cartão: R$ XX,XX
  💰 Total PIX (-10%): R$ XX,XX

PRODUTOS — FORMATO OBRIGATÓRIO:
Ao mostrar lista de produtos, use EXATAMENTE este formato (uma linha por produto):
[1] *Nome do Produto* — 💳 R$ X,XX | 💰 PIX: R$ X,XX
[2] *Nome do Produto* — 💳 R$ X,XX | 💰 PIX: R$ X,XX

Após a lista, pergunte: "Qual você prefere? Digite o número 😊"
- Para 1 produto: "Quantas unidades você precisa?"
- NUNCA use bullet points (•) — sempre use [1] [2] [3]
- NUNCA quebre o formato da lista

DATA ATUAL: ${new Date().toLocaleDateString('pt-BR', {weekday:'long',day:'2-digit',month:'long',year:'numeric'})}`
}

// ── Execução das ferramentas ─────────────────────────────────────────────────
async function executarFerramenta(nome, args, telefone, ctx) {
  switch (nome) {

    case 'buscar_produto': {
      const resultados = await buscarNoCatalogo(args.query).catch(() => [])
      if (!resultados.length) {
        return { encontrado: false, mensagem: `Nenhum produto encontrado para "${args.query}".` }
      }
      const disponiveis   = resultados.filter(p => parseInt(p.estoque||0) > 0 || p.disponivel !== false)
      const indisponiveis = resultados.filter(p => parseInt(p.estoque||0) === 0 && p.disponivel === false)
      // Salva resultados no contexto para referência futura
      ctx.ultimosBuscados = resultados.slice(0, 8).map(p => ({
        bling_id: p.bling_id || p.id,
        nome:     p.nome,
        preco:    parseFloat(p.preco || 0),
        unidade:  p.unidade || 'UN',
        imagens:  p.imagens || [],
        estoque:  parseInt(p.estoque || 0),
      }))
      return {
        encontrado:     true,
        total:          resultados.length,
        disponiveis:    disponiveis.slice(0, 5).map((p, i) => ({
          indice:   i + 1,
          bling_id: p.bling_id || p.id,
          nome:     p.nome,
          preco:    parseFloat(p.preco || 0).toFixed(2),
          pix:      (parseFloat(p.preco || 0) * 0.9).toFixed(2),
          unidade:  p.unidade || 'UN',
          imagens:  (p.imagens || []).slice(0, 1),
        })),
        indisponiveis:  indisponiveis.slice(0, 3).map(p => ({ nome: p.nome })),
        tem_mais:       resultados.length > 5,
      }
    }

    case 'adicionar_item': {
      if (!ctx.carrinho) ctx.carrinho = []
      const idx = ctx.carrinho.findIndex(i => i.bling_id === args.bling_id)
      if (idx >= 0) {
        ctx.carrinho[idx].quantidade += args.quantidade
      } else {
        ctx.carrinho.push({
          bling_id:   args.bling_id,
          nome:       args.nome,
          preco:      args.preco,
          quantidade: args.quantidade,
          unidade:    args.unidade || 'UN',
        })
      }
      await salvarContexto(telefone, ctx)
      return { sucesso: true, carrinho: resumoCarrinho(ctx.carrinho) }
    }

    case 'ver_carrinho': {
      if (!ctx.carrinho?.length) return { vazio: true }
      return { vazio: false, carrinho: resumoCarrinho(ctx.carrinho) }
    }

    case 'remover_item': {
      if (!ctx.carrinho) return { sucesso: false }
      if (!args.quantidade || args.quantidade === 0) {
        ctx.carrinho = ctx.carrinho.filter(i => i.bling_id !== args.bling_id)
      } else {
        const idx = ctx.carrinho.findIndex(i => i.bling_id === args.bling_id)
        if (idx >= 0) ctx.carrinho[idx].quantidade = args.quantidade
      }
      await salvarContexto(telefone, ctx)
      return { sucesso: true, carrinho: resumoCarrinho(ctx.carrinho) }
    }

    case 'consultar_pedido': {
      const id = args.identificador.replace(/\D/g, '')
      let pedido = null

      console.log(`🔍 consultar_pedido: "${id}" (${id.length} dígitos)`)

      // Estratégia 1: busca direta pelo ID interno do Bling
      if (id.length <= 9) {
        try {
          const r = await (await getBlingClient()).get(`/pedidos/vendas/${id}`)
          pedido = r.data?.data
          if (pedido) console.log(`✅ Pedido #${id} encontrado direto`)
        } catch(e) {
          console.log(`⚠️ Busca direta falhou: ${e.message?.slice(0,50)}`)
        }
      }

      // Estratégia 2: busca por número do pedido (número visível ao cliente)
      if (!pedido) {
        try {
          const r = await (await getBlingClient()).get(`/pedidos/vendas?numero=${id}&limite=5`)
          const lista = r.data?.data || []
          console.log(`🔎 Busca por número=${id}: ${lista.length} resultado(s)`)
          if (lista.length > 0) {
            const detail = await (await getBlingClient()).get(`/pedidos/vendas/${lista[0].id}`)
            pedido = detail.data?.data
            if (pedido) console.log(`✅ Pedido encontrado via número: interno=${lista[0].id}`)
          }
        } catch(e) {
          console.log(`⚠️ Busca por número falhou: ${e.message?.slice(0,50)}`)
        }
      }

      // Estratégia 3: busca com padding (alguns sistemas têm leading zeros)
      if (!pedido && id.length <= 9) {
        try {
          const numeroComZero = id.padStart(7, '0')
          const r = await (await getBlingClient()).get(`/pedidos/vendas?numero=${numeroComZero}&limite=5`)
          const lista = r.data?.data || []
          if (lista.length > 0) {
            const detail = await (await getBlingClient()).get(`/pedidos/vendas/${lista[0].id}`)
            pedido = detail.data?.data
            if (pedido) console.log(`✅ Pedido encontrado via número com padding`)
          }
        } catch {}
      }

      // Tenta por CPF/CNPJ
      if (!pedido && id.length >= 11) {
        try {
          const r = await (await getBlingClient()).get(`/pedidos/vendas?cpfCnpj=${id}&limite=5`)
          const lista = (r.data?.data || []).sort((a,b) => new Date(b.data) - new Date(a.data))
          if (lista.length > 0) {
            const detail = await (await getBlingClient()).get(`/pedidos/vendas/${lista[0].id}`)
            pedido = detail.data?.data
            if (lista.length > 1) {
              return {
                encontrado: true,
                multiplos: true,
                pedidos: lista.slice(0, 5).map(p => ({
                  numero:   p.numero,
                  data:     new Date(p.data).toLocaleDateString('pt-BR'),
                  total:    `R$ ${parseFloat(p.totalVenda||0).toFixed(2)}`,
                  situacao: p.situacao?.valor || '—',
                }))
              }
            }
          }
        } catch {}
      }

      if (!pedido) {
        console.log(`❌ Pedido "${id}" não encontrado no Bling após 3 estratégias`)
        return {
          encontrado:    false,
          identificador: args.identificador,
          id_buscado:    id,
          instrucao:     'O pedido não foi encontrado. Diga ao cliente que não localizou o pedido com esse número e peça para confirmar ou fornecer o CPF/CNPJ como alternativa.'
        }
      }

      // Busca NF-e
      let nfe = null
      if (pedido.notaFiscal?.id) {
        try {
          const r = await (await getBlingClient()).get(`/nfe/${pedido.notaFiscal.id}`)
          const d = r.data?.data
          nfe = { numero: d?.numero, link: d?.linkDanfe || d?.linkXml || '' }
        } catch { nfe = { numero: pedido.notaFiscal.id, link: '' } }
      }

      // Última movimentação
      let ultimaMovimentacao = null
      try {
        const r = await (await getBlingClient()).get(`/vendas/${pedido.id}/ocorrencias`)
        const movs = (r.data?.data || []).sort((a,b) => new Date(b.data) - new Date(a.data))
        if (movs[0]) {
          const data = new Date(movs[0].data).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})
          ultimaMovimentacao = `${data} — ${movs[0].ocorrencia || movs[0].descricao || 'Atualização'}`
        }
      } catch {}

      const sit = {
        6:'Aguardando pagamento', 9:'Pagamento confirmado', 12:'Cancelado',
        15:'Em separação', 24:'NF emitida', 27:'Enviado', 30:'Entregue',
        33:'Tentativa de entrega', 36:'Devolvido'
      }

      const endLines = (pedido.transporte?.enderecoEntrega?.endereco || '').split(',')
      const end = pedido.transporte?.enderecoEntrega

      return {
        encontrado:         true,
        numero:             pedido.numero,
        situacao:           sit[pedido.situacao?.id] || pedido.situacao?.valor || '—',
        situacao_id:        pedido.situacao?.id,
        foi_enviado:        [27,30,33].includes(pedido.situacao?.id),
        foi_entregue:       pedido.situacao?.id === 30,
        data:               pedido.data ? new Date(pedido.data).toLocaleDateString('pt-BR') : '—',
        data_saida:         pedido.dataColeta ? new Date(pedido.dataColeta).toLocaleDateString('pt-BR') : '—',
        data_prevista:      pedido.dataPrevista ? new Date(pedido.dataPrevista).toLocaleDateString('pt-BR') : '—',
        total:              `R$ ${parseFloat(pedido.totalVenda||0).toFixed(2)}`,
        forma_pagamento:    pedido.formaPagamento?.descricao || '—',
        transportadora:     (pedido.transporte?.transportadora?.nome || '').split(' ')[0] || '—',
        servico:            pedido.transporte?.tipoFrete || '',
        rastreio:           pedido.transporte?.codigoRastreamento || '—',
        link_rastreio:      gerarLinkRastreio(pedido.transporte),
        nome_destinatario:  pedido.contato?.nome || end?.nome || '—',
        endereco:           end ? `${end.endereco||''}, ${end.numero||''}`.trim() : '—',
        bairro:             end?.bairro || '—',
        cidade_uf:          end ? `${end.municipio||''}/${end.uf||''}` : '—',
        itens:              (pedido.itens||[]).map(i => `${i.quantidade}x ${i.descricao}`).join(', '),
        nfe,
        ultima_movimentacao: ultimaMovimentacao,
      }
    }

    case 'finalizar_pedido': {
      const { carrinho } = ctx
      if (!carrinho?.length) return { sucesso: false, erro: 'Carrinho vazio' }

      // Busca ou cria contato no Bling
      let contatoId = null
      try {
        const cpfLimpo = args.cpf_cnpj.replace(/\D/g,'')
        const r = await (await getBlingClient()).get(`/contatos?documento=${cpfLimpo}&limite=1`)
        const contatos = r.data?.data || []
        if (contatos.length > 0) {
          contatoId = contatos[0].id
        } else {
          const novo = await (await getBlingClient()).post('/contatos', {
            nome:           args.nome,
            numeroDocumento: cpfLimpo,
            tipo:           cpfLimpo.length === 11 ? 'F' : 'J',
            telefone:       telefone,
          })
          contatoId = novo.data?.data?.id
        }
      } catch(e) {
        return { sucesso: false, erro: `Erro ao criar contato: ${e.message}` }
      }

      // Monta itens do pedido
      const itensBling = carrinho.map(item => ({
        codigo:      String(item.bling_id),
        descricao:   item.nome,
        quantidade:  item.quantidade,
        valor:       item.preco,
        unidade:     item.unidade || 'UN',
      }))

      // Cria pedido no Bling
      let pedidoCriado = null
      try {
        const r = await (await getBlingClient()).post('/pedidos/vendas', {
          contato:        { id: contatoId },
          data:           new Date().toISOString().split('T')[0],
          dataSaida:      new Date().toISOString().split('T')[0],
          itens:          itensBling,
          transporte: {
            enderecoEntrega: {
              endereco:    args.endereco,
              cep:         args.cep,
              municipio:   args.cidade,
              uf:          args.estado,
              bairro:      args.bairro || '',
              complemento: args.complemento || '',
            }
          },
          observacoes:    'Pedido via WhatsApp — Bia IA v6',
        })
        pedidoCriado = r.data?.data
      } catch(e) {
        return { sucesso: false, erro: `Erro ao criar pedido: ${e.message}` }
      }

      // Gera cobrança PIX
      let pix = null
      try {
        const totalPix = carrinho.reduce((s,i) => s + (i.preco * i.quantidade * 0.9), 0)
        const r = await (await getBlingClient()).post('/contas-receber', {
          vencimento:   new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
          competencia:  new Date().toISOString().split('T')[0],
          valor:        parseFloat(totalPix.toFixed(2)),
          contato:      { id: contatoId },
          historico:    `Pedido #${pedidoCriado?.numero} via WhatsApp`,
          formaPagamento: { id: 1 },
        })
        pix = r.data?.data
      } catch {}

      // Limpa carrinho após pedido criado
      ctx.carrinho = []
      ctx.pedidoAtual = pedidoCriado?.numero
      await salvarContexto(telefone, ctx)

      return {
        sucesso:        true,
        numero_pedido:  pedidoCriado?.numero,
        total_cartao:   `R$ ${carrinho.reduce((s,i)=>s+(i.preco*i.quantidade),0).toFixed(2)}`,
        total_pix:      `R$ ${carrinho.reduce((s,i)=>s+(i.preco*i.quantidade*0.9),0).toFixed(2)}`,
        pix_codigo:     pix?.linkBoleto || null,
        pix_vencimento: pix?.vencimento || null,
      }
    }

    case 'registrar_ocorrencia': {
      await query(
        `INSERT INTO ocorrencias(telefone, tipo, descricao, pedido_numero, criado_em)
         VALUES($1,$2,$3,$4,NOW())
         ON CONFLICT DO NOTHING`,
        [telefone, args.tipo, args.descricao, args.pedido_num || null]
      ).catch(() => {})
      await query(
        `CREATE TABLE IF NOT EXISTS ocorrencias (
          id SERIAL PRIMARY KEY, telefone VARCHAR(20), tipo VARCHAR(50),
          descricao TEXT, pedido_numero VARCHAR(20), status VARCHAR(20) DEFAULT 'aberta',
          criado_em TIMESTAMPTZ DEFAULT NOW()
        )`
      ).catch(() => {})
      return { sucesso: true, protocolo: Date.now().toString().slice(-6) }
    }

    case 'avisar_quando_disponivel': {
      await query(
        `INSERT INTO avise_me(telefone, produto_nome, bling_id, criado_em)
         VALUES($1,$2,$3,NOW())
         ON CONFLICT(telefone, produto_nome) DO UPDATE SET criado_em=NOW()`,
        [telefone, args.produto_nome, args.bling_id || null]
      ).catch(async () => {
        await query(`CREATE TABLE IF NOT EXISTS avise_me(
          id SERIAL PRIMARY KEY, telefone VARCHAR(20), produto_nome TEXT,
          bling_id INTEGER, criado_em TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(telefone, produto_nome)
        )`).catch(() => {})
      })
      return { sucesso: true }
    }

    default:
      return { erro: `Ferramenta desconhecida: ${nome}` }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function resumoCarrinho(itens) {
  if (!itens?.length) return null
  let totalCartao = 0, totalPix = 0
  const linhas = itens.map((item, i) => {
    const sub    = item.preco * item.quantidade
    const subPix = sub * 0.9
    totalCartao += sub
    totalPix    += subPix
    return {
      indice:       i + 1,
      nome:         item.nome,
      quantidade:   item.quantidade,
      subtotal:     `R$ ${sub.toFixed(2)}`,
      subtotal_pix: `R$ ${subPix.toFixed(2)}`,
    }
  })
  return {
    itens:        linhas,
    total_cartao: `R$ ${totalCartao.toFixed(2)}`,
    total_pix:    `R$ ${totalPix.toFixed(2)}`,
    quantidade_itens: itens.length,
  }
}

function gerarLinkRastreio(transporte) {
  if (!transporte?.codigoRastreamento) return null
  const cod  = transporte.codigoRastreamento
  const nome = (transporte.transportadora?.nome || '').toLowerCase()
  if (nome.includes('jadlog'))  return `https://www.jadlog.com.br/jadlog/tracking.jad?cte=${cod}`
  if (nome.includes('correios') || /^[A-Z]{2}\d{9}BR$/.test(cod))
    return `https://rastreamento.correios.com.br/app/index.php?objetos=${cod}`
  if (nome.includes('melhor'))  return `https://melhorrastreio.com.br/app/melhorenvio/${cod}`
  if (nome.includes('loggi'))   return `https://www.loggi.com/rastreador/?q=${cod}`
  return `https://rastreamento.correios.com.br/app/index.php?objetos=${cod}`
}

// ── Contexto persistente ─────────────────────────────────────────────────────
async function carregarContexto(telefone) {
  try {
    const r = await query(
      `SELECT contexto FROM sessoes_ia WHERE telefone=$1`, [telefone]
    )
    if (r.rows[0]) return JSON.parse(r.rows[0].contexto)
  } catch {}
  return { carrinho: [], historico: [], ultimosBuscados: [], modo: 'ia' }
}

async function salvarContexto(telefone, ctx) {
  // Limita histórico a 30 mensagens para não explodir o banco
  if (ctx.historico?.length > 30) ctx.historico = ctx.historico.slice(-30)
  await query(
    `INSERT INTO sessoes_ia(telefone, contexto, atualizado_em)
     VALUES($1,$2,NOW())
     ON CONFLICT(telefone) DO UPDATE SET contexto=$2, atualizado_em=NOW()`,
    [telefone, JSON.stringify(ctx)]
  ).catch(async () => {
    // Cria tabela se não existir
    await query(`CREATE TABLE IF NOT EXISTS sessoes_ia(
      telefone VARCHAR(20) PRIMARY KEY, contexto JSONB,
      atualizado_em TIMESTAMPTZ DEFAULT NOW()
    )`).catch(() => {})
    await query(
      `INSERT INTO sessoes_ia(telefone, contexto, atualizado_em)
       VALUES($1,$2,NOW()) ON CONFLICT(telefone)
       DO UPDATE SET contexto=$2, atualizado_em=NOW()`,
      [telefone, JSON.stringify(ctx)]
    ).catch(() => {})
  })
}

// ── Modo manual ──────────────────────────────────────────────────────────────
async function verificarModoManual(telefone) {
  try {
    const r = await query(
      `SELECT valor FROM ia_config WHERE chave=$1`, [`manual_${telefone}`]
    )
    return r.rows[0]?.valor === 'true'
  } catch { return false }
}

// ── Processamento principal ──────────────────────────────────────────────────
async function _processar(telefone, mensagem) {
  const [config, modoManual, ctx] = await Promise.all([
    getIAConfig(),
    verificarModoManual(telefone),
    carregarContexto(telefone),
  ])

  if (modoManual) {
    console.log(`🔇 ${telefone} em modo manual`)
    return null
  }

  const apiKey = process.env.GEMINI_API_KEY || config.geminiKey
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  const ai     = new GoogleGenAI({ apiKey })
  const modelo = config.modelo || process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  // Adiciona mensagem do usuário ao histórico
  ctx.historico = ctx.historico || []

  // ── Detecta seleção de produto por número ──────────────────────────────────
  // Se há produtos buscados recentemente e cliente manda número simples → é seleção
  const selecaoNum = mensagem.trim().match(/^[oO]?\s*([1-8])\s*[°ºa-z]*$/i)
  const ultimosBusc = ctx.ultimosBuscados || []
  let mensagemProcessada = mensagem

  if (selecaoNum && ultimosBusc.length > 0) {
    const idx = parseInt(selecaoNum[1]) - 1
    const prod = ultimosBusc[idx]
    if (prod) {
      // Substitui "2" por mensagem clara para o modelo
      mensagemProcessada = `Quero o produto número ${selecaoNum[1]}: "${prod.nome}" (ID: ${prod.bling_id}, Preço: R$ ${prod.preco}). Qual a quantidade?`
      console.log(`✅ Seleção por número: ${selecaoNum[1]} → ${prod.nome}`)
    }
  }

  ctx.historico.push({ role: 'user', parts: [{ text: mensagemProcessada }] })

  // Salva mensagem no banco
  await query(
    `INSERT INTO mensagens(telefone, conteudo, direcao, criado_em)
     VALUES($1,$2,'entrada',NOW())`,
    [telefone, mensagem]
  ).catch(() => {})

  // Loop de Function Calling
  let resposta = null
  let iteracoes = 0
  const MAX_ITER = 5

  const contents = ctx.historico.map(h => ({
    role: h.role,
    parts: h.parts,
  }))

  while (iteracoes < MAX_ITER) {
    iteracoes++

    let result = null
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      try {
        result = await ai.models.generateContent({
          model:    modelo,
          contents,
          config: {
            systemInstruction: buildSystemPrompt(config),
            maxOutputTokens:   Math.max(parseInt(config.maxTokens) || 4000, 2000),
            temperature:       parseFloat(config.temperatura) || 0.7,
            tools:             TOOLS,
            toolConfig: {
              functionCallingConfig: { mode: 'AUTO' }
            },
          },
        })
        break
      } catch(e) {
        const status = e.message?.match(/\d{3}/)?.[0]
        if ((status === '503' || status === '502') && tentativa < 3) {
          await new Promise(r => setTimeout(r, tentativa * 2000))
        } else throw e
      }
    }

    const candidate = result.candidates?.[0]
    if (!candidate) break

    const parts = candidate.content?.parts || []

    // Verifica se há chamadas de função
    const functionCalls = parts.filter(p => p.functionCall)

    if (!functionCalls.length) {
      // Resposta de texto final
      resposta = parts.map(p => p.text || '').filter(Boolean).join('')
      // Adiciona resposta ao histórico
      ctx.historico.push({ role: 'model', parts: [{ text: resposta }] })
      break
    }

    // Executa todas as ferramentas chamadas
    const functionResults = []
    for (const part of functionCalls) {
      const { name, args } = part.functionCall
      console.log(`🔧 Ferramenta: ${name}`, JSON.stringify(args).slice(0, 100))

      const resultado = await executarFerramenta(name, args, telefone, ctx)
      console.log(`✅ ${name}:`, JSON.stringify(resultado).slice(0, 150))

      functionResults.push({
        functionResponse: {
          name,
          response: resultado,
        }
      })
    }

    // Adiciona a chamada de função ao histórico
    contents.push({ role: 'model', parts: functionCalls.map(p => ({ functionCall: p.functionCall })) })
    // Adiciona os resultados
    contents.push({ role: 'user', parts: functionResults })
  }

  // Salva contexto atualizado
  await salvarContexto(telefone, ctx)

  if (!resposta) {
    resposta = 'Desculpe, tive uma dificuldade técnica. Pode repetir?'
  }

  // Salva resposta no banco
  await query(
    `INSERT INTO mensagens(telefone, conteudo, direcao, motor, criado_em)
     VALUES($1,$2,'saida',$3,NOW())`,
    [telefone, resposta, modelo]
  ).catch(() => {})

  return resposta
}

// ── API pública com debounce ─────────────────────────────────────────────────
function processarMensagem(telefone, mensagem) {
  return new Promise((resolve, reject) => {
    // Agrupa mensagens rápidas
    const buffer = _buffers.get(telefone) || []
    buffer.push(mensagem)
    _buffers.set(telefone, buffer)

    if (_timers.has(telefone)) clearTimeout(_timers.get(telefone))

    const timer = setTimeout(async () => {
      _timers.delete(telefone)
      const msgs  = _buffers.get(telefone) || []
      _buffers.delete(telefone)
      const texto = msgs.join('\n')
      try {
        const r = await _processar(telefone, texto)
        resolve(r)
      } catch(e) {
        console.error('Erro ia-core:', e.message)
        reject(e)
      }
    }, DEBOUNCE)

    _timers.set(telefone, timer)
  })
}

module.exports = { processarMensagem, carregarContexto, salvarContexto, verificarModoManual }
