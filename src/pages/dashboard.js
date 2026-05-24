/**
 * dashboard.js — Bia v6
 *
 * Endpoints do painel de atendimento:
 *   GET  /stats              → KPIs (conversas, msgs, agentes)
 *   GET  /conversas          → lista de conversas com status
 *   GET  /historico/:tel     → histórico + carrinho da sessão
 *   POST /mensagem           → envio manual pelo atendente
 *   PATCH /status/:tel       → altera status da conversa
 *   GET  /status-map         → mapa telefone→status (bulk)
 *   GET  /catalogo           → busca produtos para o painel
 *   POST /manual/:tel        → ativa/desativa modo manual
 */

'use strict'

const express = require('express')
const router  = express.Router()
const { query } = require('../utils/db')

// ── GET /stats ────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [convs, msgs, catalogo] = await Promise.all([
      query(`
        SELECT
          COUNT(DISTINCT telefone)                                        AS total_conversas,
          COUNT(DISTINCT telefone) FILTER (WHERE criado_em > NOW() - INTERVAL '24h') AS hoje,
          COUNT(DISTINCT telefone) FILTER (WHERE criado_em > NOW() - INTERVAL '7d')  AS semana
        FROM mensagens
      `),
      query(`
        SELECT
          COUNT(*)                                                   AS total_msgs,
          COUNT(*) FILTER (WHERE direcao = 'entrada')               AS recebidas,
          COUNT(*) FILTER (WHERE direcao = 'saida')                 AS enviadas,
          COUNT(*) FILTER (WHERE criado_em > NOW() - INTERVAL '24h') AS hoje
        FROM mensagens
      `),
      query(`
        SELECT
          COUNT(*)                                      AS total_produtos,
          COUNT(*) FILTER (WHERE disponivel = true)    AS disponiveis,
          COUNT(*) FILTER (WHERE estoque > 0)          AS com_estoque,
          MAX(atualizado_em)                            AS ultimo_sync
        FROM catalogo_produtos
      `),
    ])

    // Distribução de status das conversas
    const statusDist = await query(`
      SELECT status, COUNT(*) AS total
      FROM atendimento_status
      GROUP BY status
    `).catch(() => ({ rows: [] }))

    res.json({
      conversas: convs.rows[0],
      mensagens: msgs.rows[0],
      catalogo:  catalogo.rows[0],
      status_distribuicao: statusDist.rows,
    })
  } catch (e) {
    console.error('Erro /stats:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /conversas ────────────────────────────────────────────────────────────
router.get('/conversas', async (req, res) => {
  try {
    // Garante tabela de status
    await query(`
      CREATE TABLE IF NOT EXISTS atendimento_status (
        telefone   VARCHAR(20) PRIMARY KEY,
        status     VARCHAR(30) NOT NULL DEFAULT 'pendente',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch(() => {})

    const r = await query(`
      SELECT
        m.telefone,
        c.nome,
        COALESCE(ast.status, 'pendente')                                      AS status_atendimento,
        MAX(m.conteudo) FILTER (WHERE m.direcao = 'entrada')                  AS ultima_mensagem,
        MAX(m.direcao)                                                         AS ultima_direcao,
        MAX(m.motor)                                                           AS agente,
        COUNT(*)                                                               AS total_msgs,
        COUNT(*) FILTER (WHERE m.direcao = 'entrada')                         AS msgs_entrada,
        MAX(m.criado_em)                                                       AS ultima_atividade
      FROM mensagens m
      LEFT JOIN contatos c              ON c.telefone = m.telefone
      LEFT JOIN atendimento_status ast  ON ast.telefone = m.telefone
      WHERE m.criado_em > NOW() - INTERVAL '30 days'
      GROUP BY m.telefone, c.nome, ast.status
      ORDER BY MAX(m.criado_em) DESC
      LIMIT 200
    `)

    res.json({ conversas: r.rows })
  } catch (e) {
    console.error('Erro /conversas:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /historico/:telefone ──────────────────────────────────────────────────
router.get('/historico/:telefone', async (req, res) => {
  try {
    const { telefone } = req.params
    const limit  = Math.min(parseInt(req.query.limit  || '60'), 200)
    const offset = parseInt(req.query.offset || '0')

    const [msgs, contato, sessao] = await Promise.all([
      query(`
        SELECT id, telefone, conteudo, direcao,
               COALESCE(modo, '')  AS modo,
               COALESCE(motor, '') AS motor,
               criado_em
        FROM mensagens
        WHERE telefone = $1
        ORDER BY criado_em DESC
        LIMIT $2 OFFSET $3
      `, [telefone, limit, offset]),

      query(`
        SELECT nome, criado_em FROM contatos WHERE telefone = $1
      `, [telefone]),

      // Carrinho e contexto da sessão (ia-core v6)
      query(`
        SELECT contexto FROM sessoes_ia WHERE telefone = $1
      `, [telefone]).catch(() => ({ rows: [] })),
    ])

    const ctx = sessao.rows[0]?.contexto || null
    const hasMore = msgs.rows.length === limit

    res.json({
      mensagens: msgs.rows.reverse(),
      contato:   contato.rows[0] || null,
      hasMore,
      carrinho:  ctx?.carrinho || [],
      modo:      ctx?.modo || 'ia',
    })
  } catch (e) {
    console.error('Erro /historico:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── POST /mensagem — envio manual pelo atendente ──────────────────────────────
router.post('/mensagem', async (req, res) => {
  try {
    const { telefone, mensagem, tipo = 'texto' } = req.body
    if (!telefone || !mensagem) {
      return res.status(400).json({ erro: 'telefone e mensagem obrigatórios' })
    }

    const { sendWhatsAppMessage } = require('../services/whatsapp')
    await sendWhatsAppMessage(telefone, mensagem)

    await query(
      `INSERT INTO mensagens(telefone, conteudo, direcao, modo, criado_em)
       VALUES($1, $2, 'saida', 'manual', NOW())`,
      [telefone, mensagem]
    )

    res.json({ ok: true })
  } catch (e) {
    console.error('Erro /mensagem:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── PATCH /status/:telefone ───────────────────────────────────────────────────
router.patch('/status/:telefone', async (req, res) => {
  try {
    const { telefone } = req.params
    const { status }   = req.body

    const statusValidos = ['pendente', 'em_andamento', 'resolvido', 'encerrado']
    if (!status || !statusValidos.includes(status)) {
      return res.status(400).json({ erro: `Status inválido. Use: ${statusValidos.join(', ')}` })
    }

    await query(`
      INSERT INTO atendimento_status(telefone, status, updated_at)
      VALUES($1, $2, NOW())
      ON CONFLICT(telefone) DO UPDATE SET status=$2, updated_at=NOW()
    `, [telefone, status])

    console.log(`✅ Status: ${telefone} → ${status}`)
    res.json({ ok: true, telefone, status })
  } catch (e) {
    console.error('Erro /status:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /status-map — bulk de todos os status ─────────────────────────────────
router.get('/status-map', async (req, res) => {
  try {
    const r = await query(`SELECT telefone, status FROM atendimento_status`)
    const mapa = {}
    r.rows.forEach(row => { mapa[row.telefone] = row.status })
    res.json(mapa)
  } catch (e) {
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /catalogo — busca para o painel lateral ───────────────────────────────
router.get('/catalogo', async (req, res) => {
  try {
    const q     = (req.query.q || '').trim()
    const limit = Math.min(parseInt(req.query.limit || '20'), 50)

    if (!q) {
      // Retorna produtos mais recentes se sem query
      const r = await query(`
        SELECT id, bling_id, nome, preco, estoque, disponivel, imagens
        FROM catalogo_produtos
        WHERE disponivel = true
        ORDER BY atualizado_em DESC
        LIMIT $1
      `, [limit])
      return res.json({ produtos: r.rows })
    }

    const { buscarNoCatalogo } = require('../services/catalogoSync')
    const resultados = await buscarNoCatalogo(q)
    res.json({ produtos: resultados.slice(0, limit) })
  } catch (e) {
    console.error('Erro /catalogo:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── POST /manual/:telefone — ativa/desativa modo manual ──────────────────────
router.post('/manual/:telefone', async (req, res) => {
  try {
    const { telefone }   = req.params
    const { ativo = true } = req.body

    await query(`
      INSERT INTO ia_config(chave, valor, atualizado_em)
      VALUES($1, $2, NOW())
      ON CONFLICT(chave) DO UPDATE SET valor=$2, atualizado_em=NOW()
    `, [`manual_${telefone}`, String(ativo)])

    // Atualiza contexto da sessão
    const { carregarContexto, salvarContexto } = require('../ia-core')
    const ctx = await carregarContexto(telefone)
    ctx.modo = ativo ? 'manual' : 'ia'
    await salvarContexto(telefone, ctx)

    console.log(`${ativo ? '🔇' : '🔊'} Modo manual ${ativo ? 'ativado' : 'desativado'} para ${telefone}`)
    res.json({ ok: true, telefone, modo: ctx.modo })
  } catch (e) {
    console.error('Erro /manual:', e.message)
    res.status(500).json({ erro: e.message })
  }
})


// ── GET /fila — clientes aguardando atendimento humano ────────────────────────
router.get('/fila', async (req, res) => {
  try {
    // Clientes pendentes há mais de 1 minuto sem resposta da IA
    const r = await query(`
      SELECT
        m.telefone,
        c.nome,
        MAX(m.criado_em)                                                  AS ultima_atividade,
        MAX(m.conteudo) FILTER (WHERE m.direcao = 'entrada')             AS ultima_mensagem_cliente,
        COUNT(*) FILTER (WHERE m.direcao = 'entrada')                    AS msgs_cliente,
        EXTRACT(EPOCH FROM (NOW() - MAX(m.criado_em))) / 60              AS minutos_espera,
        COALESCE(ast.status, 'pendente')                                  AS status
      FROM mensagens m
      LEFT JOIN contatos c             ON c.telefone = m.telefone
      LEFT JOIN atendimento_status ast ON ast.telefone = m.telefone
      WHERE m.criado_em > NOW() - INTERVAL '2 hours'
        AND COALESCE(ast.status, 'pendente') IN ('pendente', 'em_andamento')
      GROUP BY m.telefone, c.nome, ast.status
      HAVING MAX(m.direcao) = 'entrada'
         AND MAX(m.criado_em) < NOW() - INTERVAL '1 minute'
      ORDER BY MAX(m.criado_em) ASC
      LIMIT 50
    `)

    res.json({ fila: r.rows, total: r.rows.length })
  } catch (e) {
    console.error('Erro /fila:', e.message)
    res.status(500).json({ erro: e.message })
  }
})


// ── GET /ia-stats ──────────────────────────────────────────────────────────────
router.get('/ia-stats', async (req, res) => {
  try {
    const [uso, saude, modelos] = await Promise.all([
      // Uso e custo total
      query(`
        SELECT
          COUNT(*)                                        AS total_chamadas,
          COALESCE(SUM(tokens_in + tokens_out), 0)        AS total_tokens,
          COALESCE(SUM(custo_usd), 0)                     AS custo_total_usd,
          COALESCE(SUM(custo_usd) FILTER (
            WHERE criado_em > NOW() - INTERVAL '24h'), 0) AS custo_hoje_usd,
          COALESCE(SUM(custo_usd) FILTER (
            WHERE criado_em > NOW() - INTERVAL '30d'), 0) AS custo_mes_usd,
          COUNT(*) FILTER (
            WHERE criado_em > NOW() - INTERVAL '1h')      AS chamadas_ultima_hora,
          COUNT(*) FILTER (
            WHERE criado_em > NOW() - INTERVAL '24h')     AS chamadas_hoje
        FROM ia_uso_log
      `),
      // Saúde — últimas 20 chamadas
      query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'ok')    AS ok,
          COUNT(*) FILTER (WHERE status != 'ok')   AS erros,
          MAX(criado_em)                            AS ultima_chamada,
          AVG(CASE WHEN status='ok' THEN 1.0 ELSE 0 END) * 100 AS taxa_sucesso
        FROM (
          SELECT status, criado_em FROM ia_uso_log
          ORDER BY criado_em DESC LIMIT 20
        ) recentes
      `),
      // Por modelo
      query(`
        SELECT modelo, provedor,
          COUNT(*) AS chamadas,
          COALESCE(SUM(custo_usd), 0) AS custo
        FROM ia_uso_log
        WHERE criado_em > NOW() - INTERVAL '7d'
        GROUP BY modelo, provedor
        ORDER BY chamadas DESC
      `)
    ])

    const u = uso.rows[0]
    const s = saude.rows[0]
    const taxaSucesso = parseFloat(s.taxa_sucesso || 100)

    res.json({
      uso: {
        total_chamadas:       parseInt(u.total_chamadas),
        total_tokens:         parseInt(u.total_tokens),
        custo_total_usd:      parseFloat(u.custo_total_usd).toFixed(4),
        custo_hoje_usd:       parseFloat(u.custo_hoje_usd).toFixed(4),
        custo_mes_usd:        parseFloat(u.custo_mes_usd).toFixed(4),
        chamadas_hoje:        parseInt(u.chamadas_hoje),
        chamadas_ultima_hora: parseInt(u.chamadas_ultima_hora),
      },
      saude: {
        status:        taxaSucesso >= 95 ? 'operacional' : taxaSucesso >= 70 ? 'degradado' : 'instavel',
        taxa_sucesso:  taxaSucesso.toFixed(1),
        ok:            parseInt(s.ok || 0),
        erros:         parseInt(s.erros || 0),
        ultima_chamada: s.ultima_chamada,
      },
      modelos: modelos.rows
    })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})


// ── POST /api/dashboard/resetar-sessao ────────────────────────────────────────
router.post('/resetar-sessao', async (req, res) => {
  const { telefone } = req.body
  if (!telefone) return res.status(400).json({ erro: 'Informe telefone no body' })
  try {
    const r1 = await query('DELETE FROM sessoes_ia WHERE telefone = $1', [telefone])
    const r2 = await query('DELETE FROM mensagens WHERE telefone = $1', [telefone])
    await query('DELETE FROM ia_uso_log WHERE telefone = $1', [telefone]).catch(()=>{})
    res.json({
      ok: true, telefone,
      sessao: r1.rowCount > 0,
      mensagens: r2.rowCount
    })
  } catch(e) { res.status(500).json({ erro: e.message }) }
})

// ── GET /api/dashboard/resetar-sessao ─────────────────────────────────────────
router.get('/resetar-sessao', async (req, res) => {
  const telefone = req.query.telefone
  const confirmar = req.query.confirmar
  if (!telefone) return res.status(400).json({ erro: 'Informe ?telefone=55...' })
  if (confirmar !== 'sim') {
    return res.json({
      aviso: 'Isso vai apagar TODO o histórico do número.',
      confirmar: `/api/dashboard/resetar-sessao?telefone=${telefone}&confirmar=sim`
    })
  }
  try {
    const r1 = await query('DELETE FROM sessoes_ia WHERE telefone = $1', [telefone])
    const r2 = await query('DELETE FROM mensagens WHERE telefone = $1', [telefone])
    await query('DELETE FROM ia_uso_log WHERE telefone = $1', [telefone]).catch(()=>{})
    res.json({ ok: true, telefone, sessao: r1.rowCount > 0, mensagens: r2.rowCount })
  } catch(e) { res.status(500).json({ erro: e.message }) }
})


// ── GET /api/dashboard/financeiro ────────────────────────────────────────────
// Dados reais de caixa: Bling + Mercado Pago
router.get('/financeiro', async (req, res) => {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const axios  = require('axios')
    const bling  = await getBlingClient()
    const mpToken = process.env.MP_ACCESS_TOKEN

    const resultado = {
      entradas_mes: 0, saidas_mes: 0, a_receber: 0,
      mp_total_mes: 0, mp_transacoes: 0,
      contas_receber: [], pedidos_recentes: [],
      grafico_7dias: [],
    }

    // Contas a receber Bling
    try {
      const rc = await bling.get('/contas/receber?limite=50')
      const contas = rc.data?.data || []
      resultado.contas_receber = contas.map(c => ({
        id: c.id, valor: c.valor, situacao: c.situacao,
        vencimento: c.vencimento, dataEmissao: c.dataEmissao,
        contato: c.contato?.nome, origem: c.origem?.numero,
        linkQRCodePix: c.linkQRCodePix || null,
      }))
      resultado.a_receber  = contas.filter(c => c.situacao === 1).reduce((s,c) => s + (c.valor || 0), 0)
      resultado.entradas_mes = contas.reduce((s,c) => s + (c.valor || 0), 0)
    } catch(e) { console.log('⚠️ Contas Bling:', e.message?.slice(0,40)) }

    // Pedidos recentes Bling
    try {
      const rp = await bling.get('/pedidos/vendas?limite=20')
      resultado.pedidos_recentes = (rp.data?.data || []).map(p => ({
        id: p.id, numero: p.numero, total: p.total,
        data: p.data, situacao: p.situacao,
        contato: p.contato?.nome,
      }))
    } catch(e) { console.log('⚠️ Pedidos Bling:', e.message?.slice(0,40)) }

    // Pagamentos Mercado Pago (últimos 30 dias)
    if (mpToken) {
      try {
        const dataInicio = new Date(Date.now() - 30*24*60*60*1000).toISOString()
        const rMP = await axios.get(
          `https://api.mercadopago.com/v1/payments/search?status=approved&begin_date=${dataInicio}&limit=100`,
          { headers: { 'Authorization': `Bearer ${mpToken}` }, timeout: 8000 }
        )
        const pgtos = rMP.data?.results || []
        resultado.mp_total_mes    = pgtos.reduce((s,p) => s + (p.transaction_amount || 0), 0)
        resultado.mp_transacoes   = pgtos.length

        // Banco local mp_pagamentos
        const dbMp = await query('SELECT * FROM mp_pagamentos ORDER BY criado_em DESC LIMIT 50').catch(() => ({ rows: [] }))
        resultado.mp_pagamentos = dbMp.rows
      } catch(eMP) { console.log('⚠️ MP financeiro:', eMP.message?.slice(0,50)) }
    }

    // Gráfico 7 dias — pedidos por dia
    const grafico = []
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(Date.now() - i*24*60*60*1000)
      const diaStr = dia.toISOString().split('T')[0]
      const pedidosDia = resultado.pedidos_recentes.filter(p => p.data?.startsWith(diaStr))
      grafico.push({
        data:    diaStr,
        label:   dia.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'}),
        entradas: pedidosDia.reduce((s,p) => s + (p.total || 0), 0),
        pedidos:  pedidosDia.length,
      })
    }
    resultado.grafico_7dias = grafico

    res.json(resultado)
  } catch(e) { res.status(500).json({ erro: e.message }) }
})

// ── GET /api/dashboard/mp-pagamentos ─────────────────────────────────────────
// Lista pagamentos MP aprovados
router.get('/mp-pagamentos', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM mp_pagamentos ORDER BY criado_em DESC LIMIT 100'
    ).catch(() => ({ rows: [] }))
    res.json({ pagamentos: rows })
  } catch(e) { res.status(500).json({ erro: e.message }) }
})

// ── GET /api/dashboard/sessoes ────────────────────────────────────────────────
// Sessões ativas da Bia para o monitor de atendimento
router.get('/sessoes', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT telefone,
             contexto->>'nomeWhatsApp' as nome,
             contexto->>'modo' as modo,
             jsonb_array_length(COALESCE(contexto->'carrinho','[]'::jsonb)) as itens_carrinho,
             atualizado_em,
             NOW() - atualizado_em as inativo_ha
      FROM sessoes_ia
      WHERE atualizado_em > NOW() - INTERVAL '24 hours'
      ORDER BY atualizado_em DESC
      LIMIT 50
    `)
    res.json({ sessoes: rows, total: rows.length })
  } catch(e) { res.status(500).json({ erro: e.message }) }
})


// ── GET /api/dashboard/contatos ──────────────────────────────────────────────
// Busca contatos reais do Bling com cache de 5 minutos
let _contatosCache = null
let _contatosCacheTs = 0

router.get('/contatos', async (req, res) => {
  try {
    const agora = Date.now()
    const CACHE_TTL = 5 * 60 * 1000  // 5 minutos

    // Retorna cache se ainda válido
    if (_contatosCache && agora - _contatosCacheTs < CACHE_TTL) {
      return res.json({ contatos: _contatosCache, cache: true, total: _contatosCache.length })
    }

    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    // Busca contatos do Bling (paginando até 200)
    let contatos = []
    for (let pagina = 1; pagina <= 4; pagina++) {
      try {
        const r = await bling.get(`/contatos?limite=50&pagina=${pagina}&situacao=A`)
        const dados = r.data?.data || []
        if (!dados.length) break
        contatos = contatos.concat(dados)
        if (dados.length < 50) break
        await new Promise(r => setTimeout(r, 200))
      } catch(e) {
        console.log(`⚠️ Contatos Bling página ${pagina}:`, e.response?.status)
        break
      }
    }

    // Mapeia para formato simplificado
    const mapeados = contatos.map(c => ({
      id:              c.id,
      nome:            c.nome,
      tipo:            c.tipo,
      situacao:        c.situacao,
      numeroDocumento: c.numeroDocumento,
      telefone:        c.telefone,
      celular:         c.celular,
      email:           c.email,
      endereco:        c.endereco,
    }))

    // Atualiza cache
    _contatosCache   = mapeados
    _contatosCacheTs = agora

    console.log(`📋 Contatos Bling: ${mapeados.length} carregados`)
    res.json({ contatos: mapeados, cache: false, total: mapeados.length })
  } catch(e) {
    console.error('⚠️ /api/dashboard/contatos:', e.message)
    res.status(500).json({ erro: e.message, contatos: [] })
  }
})

// ── GET /api/dashboard/pedidos/:numero ───────────────────────────────────────
// Detalhes de um pedido específico com cache
const _pedidosCache = new Map()

router.get('/pedidos/:numero', async (req, res) => {
  try {
    const { numero } = req.params
    const CACHE_TTL  = 2 * 60 * 1000  // 2 minutos

    if (_pedidosCache.has(numero)) {
      const { data, ts } = _pedidosCache.get(numero)
      if (Date.now() - ts < CACHE_TTL) return res.json({ ...data, cache: true })
    }

    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    // Busca pelo número sequencial
    const rp = await bling.get(`/pedidos/vendas?numero=${numero}&limite=1`)
    const p0  = rp.data?.data?.[0]
    if (!p0) return res.status(404).json({ erro: 'Pedido não encontrado' })

    const rdet = await bling.get(`/pedidos/vendas/${p0.id}`)
    const ped  = rdet.data?.data || {}

    const data = {
      id:         ped.id,
      numero:     ped.numero,
      total:      ped.total,
      data:       ped.data,
      situacao:   ped.situacao,
      contato:    ped.contato,
      itens:      ped.itens || [],
      parcelas:   ped.parcelas || [],
      transporte: ped.transporte,
      observacoes: ped.observacoes,
    }

    _pedidosCache.set(numero, { data, ts: Date.now() })
    res.json(data)
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})


// ── GET /api/contatos/:telefone — perfil individual do cliente ────────────────
router.get('/contatos/:telefone', async (req, res) => {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()
    const tel   = req.params.telefone.replace(/\D/g,'')

    // Busca contato no Bling pelo telefone
    const r = await bling.get(`/contatos?telefone=${tel}&limite=5`)
    const lista = r.data?.data || []
    const contato = lista[0]

    if (!contato) return res.json({ nome: null, telefone: tel })

    const rdet = await bling.get(`/contatos/${contato.id}`)
    const det  = rdet.data?.data || {}

    res.json({
      id:          det.id,
      nome:        det.nome,
      telefone:    det.telefone || tel,
      email:       det.email,
      cidade:      det.endereco?.municipio,
      cpf:         det.cpfCnpj,
      total_gasto: null, // calculado abaixo se tiver pedidos
    })
  } catch(e) {
    res.json({ nome: null, telefone: req.params.telefone, erro: e.message?.slice(0,50) })
  }
})

// ── GET /api/contatos/:telefone/pedidos — pedidos do cliente por telefone ─────
router.get('/contatos/:telefone/pedidos', async (req, res) => {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()
    const tel   = req.params.telefone.replace(/\D/g,'')

    // Busca contato pelo telefone
    const rc = await bling.get(`/contatos?telefone=${tel}&limite=3`)
    const contato = rc.data?.data?.[0]

    if (!contato) return res.json({ pedidos: [] })

    // Busca pedidos do contato
    const rp = await bling.get(`/pedidos/vendas?idContato=${contato.id}&limite=20`)
    const pedidos = (rp.data?.data || []).map(p => ({
      id:        p.id,
      numero:    p.numero,
      data:      p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '—',
      situacao:  (() => { const m={6:'Aberto',9:'Atendido',12:'Cancelado',14:'Faturado',15:'Verificado'}; const id=p.situacao?.id||p.situacao; return m[id]||String(id) })(),
      total:     `R$ ${Number(p.total||0).toFixed(2).replace('.',',')}`,
      rastreio:  p.transporte?.codigoRastreamento || '—',
    }))

    res.json({ pedidos })
  } catch(e) {
    res.json({ pedidos: [], erro: e.message?.slice(0,50) })
  }
})

// ── GET /api/sugestoes/:telefone — sugestões de resposta via IA ───────────────
router.get('/sugestoes/:telefone', async (req, res) => {
  try {
    // Pega últimas mensagens da sessão
    const { rows } = await query(
      `SELECT conteudo, direcao FROM mensagens
       WHERE telefone = $1 ORDER BY criado_em DESC LIMIT 8`,
      [req.params.telefone]
    )
    if (!rows.length) return res.json({ sugestoes: [] })

    const historico = rows.reverse()
      .map(r => `${r.direcao === 'entrada' ? 'Cliente' : 'Bia'}: ${r.conteudo || ''}`)
      .join('\n')
    const ultima = rows.filter(r => r.direcao === 'entrada').at(-1)?.conteudo || ''

    // Sugestões baseadas em palavras-chave comuns no e-commerce
    const sug = []
    const ul  = ultima.toLowerCase()

    if (ul.includes('prazo') || ul.includes('entrega') || ul.includes('quando')) {
      sug.push('O prazo de entrega depende da sua região. Para retirada na loja, o pedido fica disponível no mesmo dia! 🏪')
      sug.push('Assim que seu pedido for despachado, você receberá o código de rastreio por aqui! 📦')
    } else if (ul.includes('preço') || ul.includes('valor') || ul.includes('desconto')) {
      sug.push('Pagando via PIX você tem 10% de desconto automático! 💰')
      sug.push('Posso enviar mais detalhes do produto que te interessa? 😊')
    } else if (ul.includes('produto') || ul.includes('tem') || ul.includes('disponível')) {
      sug.push('Deixa eu verificar a disponibilidade para você! Um instante... 🔍')
      sug.push('Sim! Temos em estoque. Quer que eu adicione ao seu carrinho? 🛒')
    } else if (ul.includes('pix') || ul.includes('pagamento') || ul.includes('pagar')) {
      sug.push('Você pode pagar via PIX (10% off), cartão de crédito ou boleto! 💳')
      sug.push('A chave PIX é o CNPJ: 42.614.714/0001-30. Confirma o pagamento por aqui após realizar! ✅')
    } else if (ul.includes('rastreio') || ul.includes('pedido') || ul.includes('onde')) {
      sug.push('Vou verificar o status do seu pedido agora! Um momento... 📦')
      sug.push('Pode me informar o número do seu pedido? Vou acompanhar para você! 🔍')
    } else {
      sug.push('Olá! Em que posso te ajudar hoje? 😊')
      sug.push('Pode me contar mais sobre o que você precisa? Vou adorar te ajudar! 🌟')
      sug.push('Obrigada pela mensagem! Vou verificar isso para você agora mesmo. ⚡')
    }

    res.json({ sugestoes: sug.slice(0, 3) })
  } catch(e) {
    res.json({ sugestoes: [] })
  }
})

// ── PATCH /api/dashboard/status/:telefone — salva status de atendimento ───────
// (já existe como /status/:telefone mas PageConversas usa /api/dashboard/status/)
router.patch('/status/:telefone', async (req, res) => {
  try {
    const { status } = req.body
    const { telefone } = req.params
    // Salva no contexto da sessão
    const { rows } = await query(
      `SELECT contexto FROM sessoes_ia WHERE telefone = $1`,
      [telefone]
    )
    if (rows.length) {
      const ctx = rows[0].contexto || {}
      ctx.status_atendimento = status
      await query(
        `UPDATE sessoes_ia SET contexto = $1 WHERE telefone = $2`,
        [JSON.stringify(ctx), telefone]
      )
    }
    res.json({ ok: true, status })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /bling-webhook/stats — estatísticas de disparos (PageDisparos) ─────────
// Nota: este endpoint é do router /api/dashboard mas PageDisparos chama /bling-webhook/stats
// Adiciona aqui como fallback para quando não houver rota dedicada
router.get('/disparos-stats', async (req, res) => {
  try {
    const periodo = req.query.periodo || '7d'
    const dias    = periodo === '1d' ? 1 : periodo === '30d' ? 30 : periodo === '90d' ? 90 : 7

    const [totais, porDia, porGatilho, recentes] = await Promise.all([
      query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'enviado') as enviados,
          COUNT(*) FILTER (WHERE status = 'erro') as erros,
          COUNT(*) FILTER (WHERE status = 'ignorado') as ignorados,
          COUNT(*) FILTER (WHERE status = 'aguardando') as aguardando,
          COUNT(DISTINCT telefone) as clientes_unicos,
          COUNT(*) FILTER (WHERE criado_em > NOW() - INTERVAL '24 hours') as ultimas_24h
        FROM disparos_log
        WHERE criado_em > NOW() - INTERVAL '${dias} days'
      `).catch(() => ({ rows: [{ total:0, enviados:0, erros:0, ignorados:0, aguardando:0, clientes_unicos:0, ultimas_24h:0 }] })),

      query(`
        SELECT DATE(criado_em) as dia, COUNT(*) as total,
               COUNT(*) FILTER (WHERE status='enviado') as enviados,
               COUNT(*) FILTER (WHERE status='erro') as erros
        FROM disparos_log
        WHERE criado_em > NOW() - INTERVAL '${dias} days'
        GROUP BY DATE(criado_em) ORDER BY dia
      `).catch(() => ({ rows: [] })),

      query(`
        SELECT gatilho, COUNT(*) as total,
               COUNT(*) FILTER (WHERE status='enviado') as enviados,
               COUNT(*) FILTER (WHERE status='erro') as erros
        FROM disparos_log
        WHERE criado_em > NOW() - INTERVAL '${dias} days'
        GROUP BY gatilho ORDER BY total DESC
      `).catch(() => ({ rows: [] })),

      query(`
        SELECT * FROM disparos_log
        ORDER BY criado_em DESC LIMIT 50
      `).catch(() => ({ rows: [] })),
    ])

    res.json({
      dias,
      totais: totais.rows[0] || {},
      porDia: porDia.rows,
      porGatilho: porGatilho.rows,
      recentes: recentes.rows,
    })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})

// ── GET+POST+PATCH /api/ocorrencias — CRUD de ocorrências ────────────────────
router.get('/ocorrencias', async (req, res) => {
  try {
    const { tipo, status, telefone } = req.query
    let where = 'WHERE 1=1'
    const params = []
    if (tipo)     { params.push(tipo);     where += ` AND tipo = $${params.length}` }
    if (status)   { params.push(status);   where += ` AND status = $${params.length}` }
    if (telefone) { params.push(telefone); where += ` AND telefone = $${params.length}` }

    const { rows } = await query(
      `SELECT * FROM ocorrencias ${where} ORDER BY criado_em DESC LIMIT 100`,
      params
    ).catch(() => ({ rows: [] }))
    res.json({ ocorrencias: rows })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})

router.post('/ocorrencias', async (req, res) => {
  try {
    const { telefone, tipo, descricao, numero_pedido, prioridade } = req.body
    const { rows } = await query(
      `INSERT INTO ocorrencias(telefone, tipo, descricao, numero_pedido, prioridade, status, criado_em)
       VALUES($1,$2,$3,$4,$5,'aberto',NOW()) RETURNING *`,
      [telefone, tipo||'geral', descricao, numero_pedido, prioridade||'normal']
    ).catch(async () => {
      // Tabela pode não existir — cria e tenta novamente
      await query(`
        CREATE TABLE IF NOT EXISTS ocorrencias (
          id SERIAL PRIMARY KEY,
          telefone TEXT,
          tipo TEXT,
          descricao TEXT,
          numero_pedido TEXT,
          prioridade TEXT DEFAULT 'normal',
          status TEXT DEFAULT 'aberto',
          criado_em TIMESTAMPTZ DEFAULT NOW(),
          atualizado_em TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      return query(
        `INSERT INTO ocorrencias(telefone,tipo,descricao,numero_pedido,prioridade,status,criado_em)
         VALUES($1,$2,$3,$4,$5,'aberto',NOW()) RETURNING *`,
        [telefone, tipo||'geral', descricao, numero_pedido, prioridade||'normal']
      )
    })
    res.json({ ocorrencia: rows[0] })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})

router.patch('/ocorrencias/:id', async (req, res) => {
  try {
    const { status, descricao, resolucao } = req.body
    await query(
      `UPDATE ocorrencias SET status=COALESCE($1,status), descricao=COALESCE($2,descricao),
       atualizado_em=NOW() WHERE id=$3`,
      [status, descricao, req.params.id]
    ).catch(() => {})
    res.json({ ok: true })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})


// ── GET /health — status real de cada serviço em tempo real ──────────────────
//
// Verifica WhatsApp Cloud API, Bling API e Mercado Pago com timeout de 5s.
// Retorna para cada serviço:
//   status:    'online' | 'degraded' | 'offline' | 'unconfigured'
//   latencia:  número em ms
//   detalhe:   string descritiva
//
router.get('/health', async (req, res) => {
  const inicio = Date.now()

  // ── Verificador genérico com timeout e medição de latência ─────────────────
  async function verificar(nome, fn) {
    const t0 = Date.now()
    try {
      const resultado = await Promise.race([
        fn(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
      ])
      return { nome, status: 'online', latencia: Date.now() - t0, detalhe: resultado || 'OK' }
    } catch (e) {
      const latencia = Date.now() - t0
      const msg = e.message || 'Erro desconhecido'
      const status = msg === 'timeout' ? 'degraded'
        : msg.includes('401') || msg.includes('403') ? 'auth_error'
        : 'offline'
      return { nome, status, latencia, detalhe: msg.slice(0, 120) }
    }
  }

  // ── 1. WhatsApp Cloud API ──────────────────────────────────────────────────
  const whatsappCheck = async () => {
    const token   = process.env.WHATSAPP_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_ID
    if (!token || !phoneId) return Promise.reject(new Error('unconfigured'))

    const axios = require('axios')
    // GET no próprio WABA profile — endpoint leve, não cria mensagem
    const r = await axios.get(
      `https://graph.facebook.com/v18.0/${phoneId}`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
    )
    const data = r.data
    return `ID ${data.id || phoneId} · ${data.display_phone_number || data.verified_name || 'verificado'}`
  }

  // ── 2. Bling API ───────────────────────────────────────────────────────────
  const blingCheck = async () => {
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()
    // GET /empresas — endpoint mais leve do Bling, retorna dados da empresa
    const r = await bling.get('/empresas')
    const nome = r.data?.data?.nome || r.data?.data?.razaoSocial || 'autenticado'
    return `Empresa: ${nome}`
  }

  // ── 3. Mercado Pago ────────────────────────────────────────────────────────
  const mpCheck = async () => {
    const token = process.env.MP_ACCESS_TOKEN
    if (!token) return Promise.reject(new Error('unconfigured'))

    const axios = require('axios')
    // GET /v1/payment_methods — endpoint leve, não requer permissões extras
    const r = await axios.get(
      'https://api.mercadopago.com/v1/payment_methods',
      { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
    )
    const qtd = Array.isArray(r.data) ? r.data.length : '?'
    return `${qtd} métodos de pagamento disponíveis`
  }

  // ── 4. Banco de dados (PostgreSQL) ─────────────────────────────────────────
  const dbCheck = async () => {
    const r = await query('SELECT NOW() as ts, version() as v')
    const v = r.rows[0]?.v?.match(/PostgreSQL (\d+\.\d+)/)?.[1] || '?'
    return `PostgreSQL ${v}`
  }

  // ── Executa tudo em paralelo ───────────────────────────────────────────────
  const [whatsapp, bling, mp, banco] = await Promise.all([
    verificar('WhatsApp',     whatsappCheck),
    verificar('Bling ERP',    blingCheck),
    verificar('Mercado Pago', mpCheck),
    verificar('Banco',        dbCheck),
  ])

  // Trata 'unconfigured' separadamente
  if (whatsapp.detalhe === 'unconfigured') {
    whatsapp.status  = 'unconfigured'
    whatsapp.detalhe = 'WHATSAPP_TOKEN ou PHONE_ID não configurados'
  }
  if (mp.detalhe === 'unconfigured') {
    mp.status  = 'unconfigured'
    mp.detalhe = 'MP_ACCESS_TOKEN não configurado'
  }

  const servicos = [whatsapp, bling, mp, banco]
  const totalMs  = Date.now() - inicio

  // Status geral — degraded se qualquer um estiver fora
  const statusGeral = servicos.every(s => s.status === 'online')
    ? 'online'
    : servicos.some(s => s.status === 'offline')
      ? 'degraded'
      : 'degraded'

  res.json({
    status:    statusGeral,
    ts:        new Date().toISOString(),
    total_ms:  totalMs,
    servicos,
  })
})

module.exports = router
