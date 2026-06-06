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

// ── Cache em memória para rastreio (evita 429 no Bling) ──────────────────────
const _rastreioCache = new Map()
// Limpa cache antigo a cada 30 min
setInterval(() => {
  const agora = Date.now()
  for (const [k, v] of _rastreioCache.entries()) {
    if (agora - v.ts > 15 * 60 * 1000) _rastreioCache.delete(k)
  }
}, 30 * 60 * 1000)

// ── Fila de processamento de webhooks (evita 429 por rajada) ─────────────────
// O Bling envia múltiplos eventos em sequência — processamos 1 a cada 2s
const _webhookQueue = []
let _webhookProcessing = false

function _enqueueWebhook(job) {
  _webhookQueue.push(job)
  console.log(`[WebhookQueue] +1 na fila — total: ${_webhookQueue.length} | processando: ${_webhookProcessing}`)
  if (!_webhookProcessing) _processWebhookQueue()
}

async function _processWebhookQueue() {
  if (_webhookQueue.length === 0) { _webhookProcessing = false; return }
  _webhookProcessing = true
  const job = _webhookQueue.shift()
  try {
    await job()
  } catch(e) {
    console.error('[WebhookQueue] Erro:', e.message?.slice(0,80))
  }
  // Intervalo dinâmico entre jobs:
  // Fila grande → espera mais (backpressure); fila pequena → espera menos
  const queueSize = _webhookQueue.length
  const delay = queueSize > 10 ? 10000   // fila grande  → 10s (conservador)
              : queueSize > 5  ?  8000   // fila média   →  8s (seguro)
              :                   6000   // fila pequena →  6s (normal)
  console.log(`[WebhookQueue] Próximo em ${delay/1000}s | fila: ${queueSize} restantes`)
  setTimeout(_processWebhookQueue, delay)
}

// ── AUTO-MIGRATION — cria tabelas auxiliares se não existirem ─────────────────
// Roda automaticamente quando o servidor inicia — sem precisar de painel SQL
;(async () => {
  // ── Migrations automáticas — roda ao iniciar, seguro repetir ──────────────
  const migrations = [

    // 1. webhook_eventos — receptor de eventos do Bling
    `CREATE TABLE IF NOT EXISTS webhook_eventos (
      id            SERIAL PRIMARY KEY,
      event_id      TEXT UNIQUE,
      event         TEXT,
      pedido_id     BIGINT,
      pedido_numero INTEGER,
      situacao_id   INTEGER,
      canal         TEXT,
      tel           TEXT,
      payload       JSONB,
      criado_em     TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_wh_criado ON webhook_eventos(criado_em DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_wh_pedido ON webhook_eventos(pedido_numero)`,
    `CREATE INDEX IF NOT EXISTS idx_wh_event  ON webhook_eventos(event)`,

    // 2. ia_uso_log — registro de chamadas à IA (Gemini/OpenAI)
    `CREATE TABLE IF NOT EXISTS ia_uso_log (
      id          SERIAL PRIMARY KEY,
      telefone    TEXT,
      modelo      TEXT,
      tokens_in   INTEGER DEFAULT 0,
      tokens_out  INTEGER DEFAULT 0,
      custo_usd   NUMERIC(10,6) DEFAULT 0,
      status      TEXT DEFAULT 'ok',
      duracao_ms  INTEGER,
      criado_em   TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_ia_uso_criado ON ia_uso_log(criado_em DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_ia_uso_status ON ia_uso_log(status)`,

    // 3. mp_pagamentos — pagamentos recebidos via Mercado Pago
    `CREATE TABLE IF NOT EXISTS mp_pagamentos (
      id               SERIAL PRIMARY KEY,
      mp_id            BIGINT UNIQUE,
      status           TEXT,
      valor            NUMERIC(10,2),
      tipo_pagamento   TEXT,
      descricao        TEXT,
      email_pagador    TEXT,
      telefone_pagador TEXT,
      criado_em        TIMESTAMP DEFAULT NOW(),
      atualizado_em    TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_mp_criado ON mp_pagamentos(criado_em DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_mp_status ON mp_pagamentos(status)`,

    // 4. Coluna tipo na tabela mensagens (se existir sem ela)
    `ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'texto'`,

    // 5. disparos_log — registro de cada mensagem enviada pelos gatilhos
    `CREATE TABLE IF NOT EXISTS disparos_log (
      id          SERIAL PRIMARY KEY,
      gatilho     TEXT,
      telefone    TEXT,
      pedido_num  INTEGER,
      canal       TEXT,
      status      TEXT DEFAULT 'enviado',
      mensagem    TEXT,
      erro        TEXT,
      criado_em   TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_disp_criado  ON disparos_log(criado_em DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_disp_status  ON disparos_log(status)`,
    `CREATE INDEX IF NOT EXISTS idx_disp_gatilho ON disparos_log(gatilho)`,

    // 6. disparos_log — colunas novas (schema v2 — compatível com novo sistema de templates)
    `ALTER TABLE disparos_log ADD COLUMN IF NOT EXISTS numero_pedido TEXT`,
    `ALTER TABLE disparos_log ADD COLUMN IF NOT EXISTS nome_cliente  TEXT`,
    `ALTER TABLE disparos_log ADD COLUMN IF NOT EXISTS origem        TEXT DEFAULT 'bling'`,
    `ALTER TABLE disparos_log ADD COLUMN IF NOT EXISTS erro_msg      TEXT`,
    `ALTER TABLE disparos_log ADD COLUMN IF NOT EXISTS template_nome TEXT`,
    `ALTER TABLE disparos_log ADD COLUMN IF NOT EXISTS delay_min     INTEGER DEFAULT 0`,

    // 7. Índice na nova coluna numero_pedido
    `CREATE INDEX IF NOT EXISTS idx_disp_numero ON disparos_log(numero_pedido)`,

    // 8. Backfill: copia pedido_num para numero_pedido nos registros antigos
    `UPDATE disparos_log SET numero_pedido = pedido_num::TEXT
     WHERE numero_pedido IS NULL AND pedido_num IS NOT NULL`,
  ]

  let ok = 0, fail = 0
  for (const sql of migrations) {
    try {
      await query(sql)
      ok++
    } catch(e) {
      // Ignora erros esperados (tabela já existe com IF NOT EXISTS, etc.)
      const msg = e.message || ''
      if (!msg.includes('already exists') && !msg.includes('IF NOT EXISTS')) {
        console.warn('[migration] ⚠️', msg.slice(0,80))
        fail++
      }
    }
  }
  console.log(`[dashboard] ✅ Migrations: ${ok} OK${fail ? `, ${fail} avisos` : ''}`)
})()


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

    // ── Auto-reset: conversa resolvida/encerrada que recebeu nova msg real do cliente ──
    // "mensagem real" = direcao='entrada' e NÃO é ecoada por gatilho (modo != 'auto')
    await query(`
      UPDATE atendimento_status ast
      SET status     = 'pendente',
          updated_at = NOW()
      WHERE ast.status IN ('resolvido', 'encerrado')
        AND EXISTS (
          SELECT 1
          FROM mensagens m
          WHERE m.telefone  = ast.telefone
            AND m.direcao   = 'entrada'
            AND m.criado_em > ast.updated_at
            AND COALESCE(m.modo, '') != 'auto'
        )
    `).catch(() => {})

    const r = await query(`
      SELECT
        m.telefone,
        COALESCE(s.contexto->>'nomeWhatsApp', c.nome)                         AS nome,
        c.nome                                                                 AS nome_bling,
        s.contexto->>'nomeWhatsApp'                                            AS nome_wa,
        s.contexto->>'fotoPerfil'                                              AS foto_perfil,
        COALESCE(ast.status, 'pendente')                                      AS status_atendimento,
        MAX(m.conteudo) FILTER (WHERE m.direcao = 'entrada')                  AS ultima_mensagem,
        MAX(m.direcao)                                                         AS ultima_direcao,
        MAX(m.motor)                                                           AS agente,
        COUNT(*)                                                               AS total_msgs,
        COUNT(*) FILTER (WHERE m.direcao = 'entrada')                         AS msgs_entrada,
        MAX(m.criado_em)                                                       AS ultima_atividade,
        -- Dados da sessão IA: carrinho e modo
        jsonb_array_length(COALESCE(s.contexto->'carrinho','[]'::jsonb))      AS itens_carrinho,
        COALESCE(s.contexto->>'modo', 'ia')                                   AS modo_ia,
        s.atualizado_em                                                        AS sessao_atualizada_em
      FROM mensagens m
      LEFT JOIN contatos c              ON c.telefone = m.telefone
      LEFT JOIN atendimento_status ast  ON ast.telefone = m.telefone
      LEFT JOIN sessoes_ia s            ON s.telefone  = m.telefone
      WHERE m.criado_em > NOW() - INTERVAL '30 days'
      GROUP BY m.telefone, c.nome, ast.status, s.contexto, s.atualizado_em
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
        SELECT
          m.id, m.telefone, m.conteudo, m.direcao,
          COALESCE(m.modo, '')  AS modo,
          COALESCE(m.motor, '') AS motor,
          m.criado_em,
          -- Identifica se esta mensagem saída veio de um disparo automático
          dl.gatilho AS gatilho,
          dl.template_nome AS template_nome
        FROM mensagens m
        LEFT JOIN LATERAL (
          SELECT dl2.gatilho, dl2.template_nome
          FROM disparos_log dl2
          WHERE dl2.telefone = m.telefone
            AND dl2.status = 'enviado'
            AND m.direcao = 'saida'
            AND ABS(EXTRACT(EPOCH FROM (dl2.criado_em - m.criado_em))) < 90
          ORDER BY ABS(EXTRACT(EPOCH FROM (dl2.criado_em - m.criado_em)))
          LIMIT 1
        ) dl ON true
        WHERE m.telefone = $1
        ORDER BY m.criado_em DESC
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
    const { telefone, mensagem, tipo = 'texto', interactive, produto_ctx } = req.body
    if (!telefone || (!mensagem && !interactive)) {
      return res.status(400).json({ erro: 'telefone e mensagem ou interactive obrigatórios' })
    }

    // Se enviou produto_ctx, salva no contexto da sessão da IA
    // para que a IA saiba qual produto foi enviado ao cliente (ex: botão carrinho)
    if (produto_ctx?.nome) {
      try {
        const { carregarContexto, salvarContexto } = require('../ia-core')
        const ctx = await carregarContexto(telefone)
        ctx.produtoSelecionado = {
          bling_id: produto_ctx.bling_id,
          nome:     produto_ctx.nome,
          preco:    parseFloat(produto_ctx.preco || 0),
          pix:      parseFloat(produto_ctx.pix || produto_ctx.preco * 0.9 || 0),
          unidade:  produto_ctx.unidade || 'UN',
          codigo:   produto_ctx.codigo || '',
          descricao_curta: produto_ctx.descricao || '',
        }
        ctx.ultimosBuscados = [ctx.produtoSelecionado]
        await salvarContexto(telefone, ctx)
        console.log(`📦 produto_ctx salvo no ctx: ${produto_ctx.nome}`)
      } catch(e) { console.warn('produto_ctx erro:', e.message?.slice(0,50)) }
    }

    const { sendWhatsAppMessage, sendWhatsAppInteractive } = require('../services/whatsapp')

    if (mensagem === '_ctx_only_') {
      // Apenas salva produto_ctx na sessão da IA, não envia mensagem
      return res.json({ ok: true, ctx_only: true })
    }

    if (interactive) {
      // Mensagem interativa com botões (catálogo, avise-me etc)
      await sendWhatsAppInteractive(telefone, interactive)
      await query(
        `INSERT INTO mensagens(telefone, conteudo, direcao, modo, criado_em)
         VALUES($1, $2, 'saida', 'manual', NOW())`,
        [telefone, interactive.body?.text || '[mensagem interativa]']
      )
    } else {
      await sendWhatsAppMessage(telefone, mensagem)
      await query(
        `INSERT INTO mensagens(telefone, conteudo, direcao, modo, criado_em)
         VALUES($1, $2, 'saida', 'manual', NOW())`,
        [telefone, mensagem]
      )
    }

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
        SELECT id, bling_id, nome, preco, estoque, disponivel, codigo
        FROM catalogo_produtos
        WHERE (disponivel = true OR estoque > 0)
        ORDER BY estoque DESC, atualizado_em DESC
        LIMIT $1
      `, [limit])
      // Normaliza disponivel baseado no estoque real
      return res.json({
        produtos: r.rows.map(p => ({
          ...p,
          disponivel: parseInt(p.estoque||0) > 0 || p.disponivel === true,
          precoVenda: p.preco,
        }))
      })
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
      const _LOJA_CANAL = { 205946980:'shopee', 203414926:'mercadolivre', 204884434:'shopee', 205916963:'tiktokshop', 205693668:'nuvemshop' }
      resultado.pedidos_recentes = (rp.data?.data || []).map(p => {
        const lojaId = p.loja?.id || 0
        const canal  = _LOJA_CANAL[lojaId] || 'bling'
        return {
          id: p.id, numero: p.numero, total: p.total,
          data: p.data, situacao: p.situacao,
          situacaoId: typeof p.situacao==='object' ? p.situacao.id||p.situacao.valor : p.situacao,
          contato: p.contato?.nome,
          contatoId: p.contato?.id,
          lojaId, canal,
          loja: p.loja || null, numeroLoja: p.numeroLoja || null,
          observacoes: p.observacoes || '',
          notaFiscal: p.notaFiscal ? { id:p.notaFiscal.id, numero:p.notaFiscal.numero } : null,
          formaPagamento: p.parcelas?.[0]?.formaPagamento?.descricao || null,
          codigoRastreio: p.transporte?.volumes?.[0]?.codigoRastreamento || null,
          transportadora: p.transporte?.transportadora?.nome || null,
        }
      })
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




// ── GET /api/dashboard/debug/pedido-raw/:numero — debug raw completo ─────────
router.get('/debug/pedido-raw/:numero', async (req, res) => {
  try {
    const { numero } = req.params
    const { getBlingClient } = require('../utils/blingClient')
    const axios = require('axios')
    const bling = await getBlingClient()

    // 1. Busca listagem do pedido
    const rList = await bling.get(`/pedidos/vendas?numero=${numero}&limite=1`)
    const p0 = rList.data?.data?.[0]

    if (!p0) return res.json({
      erro: 'Pedido não encontrado',
      rawListagem: null,
      dica: 'Verifique se o número está correto',
    })

    // 2. Busca detalhe completo (tudo que o Bling retorna)
    const rDet = await bling.get(`/pedidos/vendas/${p0.id}`)
    const ped = rDet.data?.data || {}

    // 3. Busca contato pelo ID
    let rawContato = null
    let erroContato = null
    if (ped.contato?.id) {
      try {
        const rc = await bling.get(`/contatos/${ped.contato.id}`)
        rawContato = rc.data?.data
      } catch(e) { erroContato = e.message }
    }

    // 4. Histórico de pedidos do contato
    let pedidosContato = []
    let erroPedidosContato = null
    if (ped.contato?.id) {
      try {
        const rpc = await bling.get(`/pedidos/vendas?idContato=${ped.contato.id}&limite=50&ordem=5`)
        pedidosContato = (rpc.data?.data || []).map(p => ({
          numero: p.numero, total: p.total, data: p.data,
          situacao: { id: p.situacao?.id, label: p.situacao?.label, valor: p.situacao?.valor },
          loja: { id: p.loja?.id, nome: p.loja?.nome, codigo: p.loja?.codigo },
          numeroLoja: p.numeroLoja,
        }))
      } catch(e) { erroPedidosContato = e.message }
    }

    // 5. Código de rastreio e teste Correios
    const codRastreio = ped.transporte?.volumes?.[0]?.codigoRastreamento
    let rawCorreios = null
    let erroCorreios = null
    if (codRastreio) {
      try {
        const r = await axios.get(
          `https://rastreamento.correios.com.br/core/rastreamento.json?numero=${codRastreio}&cliente=PF&cartaoPostagem=9999999999`,
          { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
        )
        rawCorreios = r.data
      } catch(e) {
        erroCorreios = e.message
        // Tenta URL alternativa
        try {
          const r2 = await axios.post(
            'https://proxyapp.correios.com.br/v1/sro-rastro',
            { objetos: codRastreio },
            { timeout: 8000, headers: { 'Content-Type': 'application/json', 'app-check-token': 'none' } }
          )
          rawCorreios = { fonte: 'proxyapp', data: r2.data }
        } catch(e2) {
          erroCorreios += ' | proxyapp: ' + e2.message
        }
      }
    }

    // 6. Campos do objeto de transporte completo
    const transporte = ped.transporte || {}
    const etiqueta   = transporte.etiqueta || {}
    const volumes    = transporte.volumes  || []

    // 7. Mapa de todos os campos do pedido
    const camposRaiz = Object.keys(ped)
    const camposContato = rawContato ? Object.keys(rawContato) : []
    const camposTransporte = Object.keys(transporte)

    res.json({
      // ── PEDIDO ──────────────────────────────────────────────────────────
      pedido: {
        numero:            ped.numero,
        id_bling:          ped.id,
        data:              ped.data,
        data_saida:        ped.dataSaida,
        data_prevista:     ped.dataPrevista,
        situacao_raw:      ped.situacao,
        situacao_id:       ped.situacao?.id,
        situacao_label:    ped.situacao?.label,
        situacao_valor:    ped.situacao?.valor,
        total:             ped.total,
        total_produtos:    ped.totalProdutos,
        total_desconto:    ped.totalDesconto,
        loja_id:           ped.loja?.id,
        loja_nome:         ped.loja?.nome,
        loja_codigo:       ped.loja?.codigo,
        numero_loja:       ped.numeroLoja,
        canal:             ped.canal,
        observacoes:       ped.observacoes,
        obs_internas:      ped.observacoesInternas,
        nota_fiscal:       ped.notaFiscal,
        campos_raiz:       camposRaiz,
      },
      // ── CONTATO (do pedido) ──────────────────────────────────────────────
      contato_pedido: {
        id:    ped.contato?.id,
        nome:  ped.contato?.nome,
        tipo:  ped.contato?.tipo,
        raw:   ped.contato,
      },
      // ── CONTATO COMPLETO (GET /contatos/:id) ────────────────────────────
      contato_completo: {
        erro: erroContato,
        campos: camposContato,
        dados: rawContato,
      },
      // ── ITENS ────────────────────────────────────────────────────────────
      itens: (ped.itens || []).map(item => ({
        codigo:      item.codigo,
        descricao:   item.descricao,
        quantidade:  item.quantidade,
        valor:       item.valor,
        produto_id:  item.produto?.id,
        raw:         item,
      })),
      // ── PARCELAS / PAGAMENTO ─────────────────────────────────────────────
      pagamento: (ped.parcelas || []).map(parc => ({
        forma_id:     parc.formaPagamento?.id,
        forma_desc:   parc.formaPagamento?.descricao,
        valor:        parc.valor,
        vencimento:   parc.dataVencimento,
        raw:          parc,
      })),
      // ── TRANSPORTE ───────────────────────────────────────────────────────
      transporte: {
        campos_raiz:       camposTransporte,
        transportadora_id: transporte.transportadora?.id,
        transportadora:    transporte.transportadora?.nome,
        frete_valor:       transporte.frete,
        prazo_entrega:     transporte.prazoEntrega,
        etiqueta: {
          nome:            etiqueta.nome,
          logradouro:      etiqueta.logradouro,
          numero:          etiqueta.numero,
          complemento:     etiqueta.complemento,
          bairro:          etiqueta.bairro,
          municipio:       etiqueta.municipio,
          uf:              etiqueta.uf,
          cep:             etiqueta.cep,
          raw:             etiqueta,
        },
        volumes: volumes.map(v => ({
          codigo_rastreio: v.codigoRastreamento,
          servico_id:      v.servico?.id,
          servico_desc:    v.servico?.descricao,
          peso:            v.peso,
          quantidade:      v.quantidade,
          ultima_situacao: v.ultimaSituacao,
          raw:             v,
        })),
      },
      // ── RASTREIO CORREIOS ─────────────────────────────────────────────────
      rastreio: {
        codigo:       codRastreio || null,
        erro:         erroCorreios,
        raw_correios: rawCorreios,
      },
      // ── HISTÓRICO DO CLIENTE ─────────────────────────────────────────────
      historico_cliente: {
        erro:    erroPedidosContato,
        total:   pedidosContato.length,
        pedidos: pedidosContato,
      },
      // ── MENSAGENS WA (banco local) ────────────────────────────────────────
      mensagens_wa: await (async () => {
        const tel = rawContato?.celular || rawContato?.telefone || ''
        if (!tel) return { erro: 'Sem telefone no contato', tel_tentado: null, total: 0, lista: [] }
        const telClean = tel.replace(/\D/g, '')
        try {
          const r = await query(
            `SELECT direcao, conteudo, tipo, criado_em FROM mensagens WHERE telefone=$1 OR telefone=$2 ORDER BY criado_em DESC LIMIT 20`,
            [telClean, telClean.startsWith('55') ? telClean.slice(2) : '55' + telClean]
          )
          return { tel_tentado: telClean, total: r.rows.length, lista: r.rows }
        } catch(e) {
          return { erro: e.message, tel_tentado: telClean, total: 0, lista: [] }
        }
      })(),
      // ── RAW ORIGINAL DA LISTAGEM ─────────────────────────────────────────
      raw_listagem: p0,
      gerado_em: new Date().toISOString(),
    })
  } catch(e) {
    console.error('debug/pedido-raw:', e.message)
    res.status(500).json({ erro: e.message, stack: e.stack?.slice(0,300) })
  }
})

// ── GET /api/dashboard/debug/pedido — retorna raw do Bling para mapeamento ───
router.get('/debug/pedido', async (req, res) => {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    // Lista um pedido com todos os campos
    const rList = await bling.get('/pedidos/vendas?limite=3&ordem=5')
    const pedidos = rList.data?.data || []

    if (!pedidos.length) return res.json({ erro: 'Nenhum pedido encontrado', totalBling: rList.data?.total })

    // Pega o detalhe completo do primeiro pedido
    const p0 = pedidos[0]
    const rDet = await bling.get(`/pedidos/vendas/${p0.id}`)
    const det = rDet.data?.data || {}

    // Analisa as lojas únicas
    const lojas = pedidos.map(p => ({ id: p.loja?.id, nome: p.loja?.nome, codigo: p.loja?.codigo, canal: p.canal, numeroLoja: p.numeroLoja }))

    // Retorna:
    // 1. Os campos raiz do objeto de listagem
    // 2. Os campos do detalhe
    // 3. Mapa de todas as lojas
    // 4. Situações encontradas
    res.json({
      totalBling: rList.data?.total,
      // Campos disponíveis na listagem (todos os 3 pedidos)
      camposListagem: pedidos.map(p => Object.keys(p)),
      // Raw do primeiro pedido listagem
      rawListagem: p0,
      // Raw completo do detalhe
      rawDetalhe: det,
      // Lojas encontradas
      lojas,
      // Situações
      situacoes: pedidos.map(p => ({ id: p.situacao?.id, label: p.situacao?.label, valor: p.situacao?.valor })),
      // Campos do transporte
      transporte: det.transporte ? Object.keys(det.transporte) : [],
      // Volumes
      volumes: det.transporte?.volumes || [],
    })
  } catch(e) {
    console.error('debug/pedido:', e.response?.data || e.message)
    res.status(500).json({ erro: e.message, response: e.response?.data })
  }
})

// ── GET /api/dashboard/debug/lojas — mapeia TODAS as lojas distintas ─────────
router.get('/debug/lojas', async (req, res) => {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    // Busca várias páginas para mapear todas as lojas
    const lojasMap = new Map()
    const situacoesMap = new Map()

    for (let pg = 1; pg <= 5; pg++) {
      try {
        const r = await bling.get(`/pedidos/vendas?limite=100&pagina=${pg}&ordem=5`)
        const pedidos = r.data?.data || []
        if (!pedidos.length) break

        pedidos.forEach(p => {
          // Mapeia lojas
          const lojaKey = String(p.loja?.id || p.numeroLoja || 'sem-loja')
          if (!lojasMap.has(lojaKey)) {
            lojasMap.set(lojaKey, {
              id:         p.loja?.id,
              nome:       p.loja?.nome || 'Sem nome',
              codigo:     p.loja?.codigo,
              canal:      p.canal,
              numeroLoja: p.numeroLoja,
              count: 0,
            })
          }
          lojasMap.get(lojaKey).count++

          // Mapeia situações
          const sit = p.situacao
          const sitKey = String(sit?.id || sit?.valor || 'desconhecida')
          if (!situacoesMap.has(sitKey)) {
            situacoesMap.set(sitKey, { id: sit?.id, label: sit?.label, valor: sit?.valor, count: 0 })
          }
          situacoesMap.get(sitKey).count++
        })
      } catch (epg) { break }
    }

    res.json({
      lojas: Array.from(lojasMap.values()).sort((a,b) => b.count - a.count),
      situacoes: Array.from(situacoesMap.values()).sort((a,b) => b.count - a.count),
    })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})



// ── GET /api/dashboard/debug/situacoes/:numero — debug situação + rastreio ───
router.get('/debug/situacoes/:numero', async (req, res) => {
  try {
    const { numero } = req.params
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    // Busca o pedido
    const rList = await bling.get(`/pedidos/vendas?numero=${numero}&limite=1`)
    const p0 = rList.data?.data?.[0]
    if (!p0) return res.json({ erro: 'Pedido não encontrado', numero })

    const rDet = await bling.get(`/pedidos/vendas/${p0.id}`)
    const ped  = rDet.data?.data || {}

    // Busca TODAS as situações disponíveis no Bling para comparar
    let situacoes = []
    try {
      const rSit = await bling.get('/situacoes?modulo=1') // módulo 1 = pedidos venda
      situacoes = rSit.data?.data || []
    } catch {}

    const sitId    = ped.situacao?.id
    const sitLabel = ped.situacao?.label || ped.situacao?.descricao || '—'
    const volumes  = ped.transporte?.volumes || []
    const codigoRastreio = volumes[0]?.codigoRastreamento || null

    // Mapas de referência
    const SITUACAO_GATILHO_ATUAL = {
      6:'null', 9:'pagamento_aprovado', 12:'cancelamento',
      15:'em_andamento', 18:'null', 21:'nfe_pendente',
      24:'nfe_emitida', 27:'pedido_enviado', 30:'pedido_entregue',
      33:'nao_entregue', 36:'devolucao'
    }

    res.json({
      numero: ped.numero,
      id_bling: ped.id,
      // SITUAÇÃO ATUAL
      situacao: {
        id:     sitId,
        label:  sitLabel,
        raw:    ped.situacao,
        gatilho_mapeado: SITUACAO_GATILHO_ATUAL[sitId] || 'NÃO MAPEADO ⚠️',
      },
      // RASTREIO
      rastreio: {
        codigo:   codigoRastreio,
        volumes:  volumes.map(v => ({
          id:      v.id,
          codigo:  v.codigoRastreamento,
          servico: v.servico?.descricao,
        })),
        tem_rastreio: !!codigoRastreio,
      },
      // LOJA
      loja: {
        id:    ped.loja?.id,
        nome:  ped.loja?.nome,
        canal: ({205946980:'shopee',203414926:'mercadolivre',204884434:'shein',205916963:'tiktokshop',205693668:'nuvemshop'})[ped.loja?.id] || 'desconhecido',
      },
      // DIAGNÓSTICO
      diagnostico: {
        disparo_esperado: SITUACAO_GATILHO_ATUAL[sitId] || 'NÃO MAPEADO',
        webhook_dispararia: !!SITUACAO_GATILHO_ATUAL[sitId] && SITUACAO_GATILHO_ATUAL[sitId] !== 'null',
        motivo_nao_disparo: !codigoRastreio ? 'Sem código de rastreio'
          : !SITUACAO_GATILHO_ATUAL[sitId] ? `Situação ${sitId} não tem gatilho mapeado`
          : SITUACAO_GATILHO_ATUAL[sitId] === 'null' ? `Situação ${sitId} mapeada como null (sem disparo)`
          : 'Deveria disparar — verificar se webhook chegou',
      },
      // SITUAÇÕES DISPONÍVEIS NO BLING (para referência)
      situacoes_bling: situacoes.slice(0,20).map(s => ({ id:s.id, nome:s.nome||s.descricao })),
    })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /api/dashboard/debug/lojas-detalhe — exemplos reais por loja ─────────
router.get('/debug/lojas-detalhe', async (req, res) => {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()
    const lojasMap = new Map()

    // Busca 5 páginas para ter amostra representativa
    for (let pg = 1; pg <= 5; pg++) {
      try {
        const r = await bling.get(`/pedidos/vendas?limite=100&pagina=${pg}&ordem=5`)
        const pedidos = r.data?.data || []
        if (!pedidos.length) break
        pedidos.forEach(p => {
          const lid = String(p.loja?.id || 0)
          if (!lojasMap.has(lid)) {
            lojasMap.set(lid, {
              id:         p.loja?.id,
              nome:       p.loja?.nome,
              codigo:     p.loja?.codigo,
              tipo:       p.loja?.tipo,
              canal:      p.canal,
              count:      0,
              exemplos:   [], // primeiros 3 pedidos desta loja
            })
          }
          const entry = lojasMap.get(lid)
          entry.count++
          if (entry.exemplos.length < 3) {
            entry.exemplos.push({
              numero:      p.numero,
              numeroLoja:  p.numeroLoja,
              canal:       p.canal,
              origem:      p.origem,
              loja_raw:    p.loja,
            })
          }
        })
      } catch { break }
    }

    res.json({
      total_lojas: lojasMap.size,
      lojas: Array.from(lojasMap.values()).sort((a,b) => b.count - a.count),
    })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})


// ── GET /api/dashboard/pedido-completo/:numero — painel unificado ─────────────
// Une: Bling pedido + contato completo + pedidos do cliente + rastreio + msgs WA
router.get('/pedido-completo/:numero', async (req, res) => {
  try {
    const { numero } = req.params
    const { getBlingClient } = require('../utils/blingClient')
    const axios = require('axios')
    const bling = await getBlingClient()

    // 1. Busca o pedido no Bling
    const rp  = await bling.get(`/pedidos/vendas?numero=${numero}&limite=1`)
    const p0  = rp.data?.data?.[0]
    if (!p0) return res.status(404).json({ erro: 'Pedido não encontrado' })

    const rdet = await bling.get(`/pedidos/vendas/${p0.id}`)
    const ped  = rdet.data?.data || {}

    // 2. Busca contato completo do Bling (ID direto — mais rápido)
    let contatoCompleto = null
    if (ped.contato?.id) {
      try {
        const rc = await bling.get(`/contatos/${ped.contato.id}`)
        contatoCompleto = rc.data?.data || null
      } catch {}
    }

    // 3. Busca todos os pedidos do contato (histórico completo)
    let pedidosCliente = []
    if (ped.contato?.id) {
      try {
        const rpc = await bling.get(`/pedidos/vendas?idContato=${ped.contato.id}&limite=100&ordem=5`)
        const _LOJA = { 205946980:'shopee', 203414926:'mercadolivre', 204884434:'shopee', 205916963:'tiktokshop', 205693668:'nuvemshop' }
        pedidosCliente = (rpc.data?.data || []).map(p => ({
          id: p.id, numero: p.numero, total: p.total, data: p.data,
          situacaoId: p.situacao?.id || p.situacao?.valor,
          situacaoLabel: { 6:'Em Aberto', 9:'Atendido', 12:'Cancelado', 15:'Verificado' }[p.situacao?.id] || '—',
          canal: _LOJA[p.loja?.id||0] || 'bling',
          lojaId: p.loja?.id || 0,
        }))
      } catch {}
    }

    // 4. Rastreio via Bling v3 /logisticas/objetos (endpoint nativo)
    // O id do volume (transporte.volumes[].id) é o idObjeto logístico no Bling
    const volumes = ped.transporte?.volumes || []
    const codigoRastreio = volumes[0]?.codigoRastreamento || null
    const idObjetoLogistico = volumes[0]?.id || null
    let rastreioEventos = []
    let rastreioStatus  = null
    let rastreioSituacaoBling = null

    // Fonte 1: Bling /logisticas/objetos/:id (histórico nativo)
    // Cache em memória para evitar 429 (rate limit Bling)
    if (idObjetoLogistico) {
      const _cacheKey = `obj_${idObjetoLogistico}`
      const _cached = _rastreioCache.get(_cacheKey)
      if (_cached && (Date.now() - _cached.ts) < 10 * 60 * 1000) {
        // Usa cache de 10 minutos
        rastreioEventos      = _cached.eventos
        rastreioStatus       = _cached.status
        rastreioSituacaoBling= _cached.situacao
      } else {
        try {
          const ro = await bling.get(`/logisticas/objetos/${idObjetoLogistico}`)
          const obj = ro.data?.data || {}
          rastreioSituacaoBling = obj.situacao
          rastreioStatus = obj.situacao?.descricao || obj.situacao || null

          try {
            const rh = await bling.get(`/logisticas/objetos/${idObjetoLogistico}/historico`)
            const hist = rh.data?.data || []
            if (hist.length > 0) {
              rastreioEventos = hist.map(h => ({
                data:    h.data,
                status:  h.descricao || h.situacao?.descricao,
                detalhe: h.detalhe,
                local:   h.local || '',
              }))
              rastreioStatus = rastreioEventos[0]?.status || rastreioStatus
            }
          } catch {}

          // Salva no cache
          _rastreioCache.set(_cacheKey, {
            eventos:  rastreioEventos,
            status:   rastreioStatus,
            situacao: rastreioSituacaoBling,
            ts: Date.now(),
          })
        } catch (eBling) {
          const code = eBling.response?.status
          if (code === 429) {
            console.log('[rastreio] Rate limit Bling (429) — usando cache antigo se disponível')
            if (_cached) { rastreioEventos = _cached.eventos; rastreioStatus = _cached.status }
          } else {
            console.log('[rastreio] Bling /logisticas/objetos falhou:', eBling.message?.slice(0,40))
          }
        }
      }
    }

    // Fonte 2: Fallback para Correios direto (se código AD*BR)
    if (!rastreioEventos.length && codigoRastreio && /^[A-Z]{2}\d{9}BR$/.test(codigoRastreio)) {
      try {
        const rc = await axios.get(
          `https://rastreamento.correios.com.br/core/rastreamento.json?numero=${codigoRastreio}&cliente=PF&cartaoPostagem=9999999999`,
          { timeout: 6000, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
        )
        const evs = rc.data?.objetos?.[0]?.eventos || []
        if (evs.length) {
          rastreioStatus = evs[0]?.descricao || null
          rastreioEventos = evs.map(e => ({
            data:    e.dtHrCriado,
            status:  e.descricao,
            detalhe: e.detalhe,
            local:   e.unidade ? `${e.unidade.nome||''} — ${e.unidade.endereco?.cidade||''}/${e.unidade.endereco?.uf||''}`.trim() : '',
          }))
        }
      } catch {}
    }

    // 5. Mensagens do cliente no WhatsApp (banco local)
    let mensagens = []
    const tel = contatoCompleto?.celular || contatoCompleto?.telefone || ''
    if (tel) {
      try {
        const telClean = tel.replace(/\D/g,'')
        const r = await query(
          `SELECT direcao, conteudo, tipo, criado_em FROM mensagens WHERE telefone=$1 ORDER BY criado_em DESC LIMIT 50`,
          [telClean]
        ).catch(() => query(
          `SELECT direcao, conteudo, tipo, criado_em FROM mensagens WHERE telefone=$1 ORDER BY criado_em DESC LIMIT 50`,
          [telClean.startsWith('55') ? telClean.slice(2) : '55'+telClean]
        ))
        mensagens = r.rows || []
      } catch {}
    }

    // 6. Situação histórico de entrega das mensagens (enviou atualização de rastreio?)
    const msgRastreio = mensagens.filter(m =>
      m.direcao === 'saida' && (m.conteudo||'').toLowerCase().includes('rastreio') ||
      (m.conteudo||'').toLowerCase().includes('rastrear') ||
      codigoRastreio && (m.conteudo||'').includes(codigoRastreio)
    )

    const _LOJA2 = { 205946980:'shopee', 203414926:'mercadolivre', 204884434:'shopee', 205916963:'tiktokshop', 205693668:'nuvemshop' }
    const lojaId = ped.loja?.id || 0

    res.json({
      // Pedido
      pedido: {
        id:               ped.id,
        numero:           ped.numero,
        total:            ped.total,
        totalProdutos:    ped.totalProdutos,
        totalDesconto:    ped.totalDesconto,
        data:             ped.data,
        dataSaida:        ped.dataSaida,
        dataPrevista:     ped.dataPrevista,
        situacaoId:       ped.situacao?.id || ped.situacao?.valor,
        situacaoLabel:    { 6:'Em Aberto', 9:'Atendido', 12:'Cancelado', 15:'Verificado' }[ped.situacao?.id] || '—',
        lojaId,
        canal:            _LOJA2[lojaId] || (lojaId===0?'loja':'bling'),
        numeroLoja:       ped.numeroLoja,
        observacoes:      ped.observacoes,
        observacoesInt:   ped.observacoesInternas,
        itens:            ped.itens || [],
        parcelas:         ped.parcelas || [],
        formaPagamento:   ped.parcelas?.[0]?.formaPagamento?.descricao || '—',
        notaFiscal:       ped.notaFiscal || null,
        linkBling:        `https://www.bling.com.br/vendas.php#/vendas/${ped.id}`,
      },
      // Contato completo
      contato: contatoCompleto ? {
        id:              contatoCompleto.id,
        nome:            contatoCompleto.nome,
        fantasia:        contatoCompleto.fantasia,
        tipo:            contatoCompleto.tipo,
        email:           contatoCompleto.email || contatoCompleto.emailNotaFiscal,
        telefone:        contatoCompleto.telefone,
        celular:         contatoCompleto.celular,
        cpfCnpj:         contatoCompleto.numeroDocumento,
        ie:              contatoCompleto.ie,
        nascimento:      contatoCompleto.dadosAdicionais?.dataNascimento,
        // Endereço principal (campo "endereco.geral" no Bling v3)
        enderecoGeral: contatoCompleto.endereco?.geral || null,
        // Monta array compatível com o frontend
        enderecos: contatoCompleto.endereco?.geral?.endereco ? [{
          tipo: 'Principal',
          endereco:    contatoCompleto.endereco.geral.endereco,
          numero:      contatoCompleto.endereco.geral.numero,
          complemento: contatoCompleto.endereco.geral.complemento,
          bairro:      contatoCompleto.endereco.geral.bairro,
          municipio:   contatoCompleto.endereco.geral.municipio,
          uf:          contatoCompleto.endereco.geral.uf,
          cep:         contatoCompleto.endereco.geral.cep,
        }] : [],
        linkBling: `https://www.bling.com.br/contatos.php#/contatos/${contatoCompleto.id}`,
      } : ped.contato,
      // Transporte
      transporte: {
        transportadora:   ped.transporte?.transportadora?.nome,
        frete:            ped.transporte?.frete,
        volumes:          (ped.transporte?.volumes||[]).map(v=>({
          codigo:      v.codigoRastreamento,
          servico:     v.servico?.descricao,
          peso:        v.peso,
          quantidade:  v.quantidade,
        })),
        etiqueta:         ped.transporte?.etiqueta || null,
      },
      // Rastreio
      rastreio: {
        codigo:           codigoRastreio || null,
        idObjeto:         idObjetoLogistico || null,
        status:           rastreioStatus,
        situacaoBling:    rastreioSituacaoBling,
        eventos:          rastreioEventos,
        msgEnviada:       msgRastreio.length > 0,
        qtdMsgRastreio:   msgRastreio.length,
        linkCorreios:     codigoRastreio ? `https://rastreamento.correios.com.br/app/index.php?objetos=${codigoRastreio}` : null,
        linkMelhorRastreio: codigoRastreio ? `https://melhorrastreio.com.br/rastreio/${codigoRastreio}` : null,
      },
      // Histórico do cliente
      historico: {
        total:    pedidosCliente.length,
        pedidos:  pedidosCliente,
        gasto:    pedidosCliente.reduce((s,p)=>s+Number(p.total||0),0),
        primeiraCompra: pedidosCliente.length === 0,
        nCompra:  pedidosCliente.filter(p=>p.numero<parseInt(numero)).length + 1,
      },
      // Mensagens WA
      mensagens: {
        total:    mensagens.length,
        lista:    mensagens,
      },
    })
  } catch(e) {
    console.error('pedido-completo:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /api/dashboard/pedidos — listagem com filtros e dados ricos ───────────
router.get('/pedidos', async (req, res) => {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    const { situacao, dataInicio, dataFim, pagina=1, limite=100, numeroPedido } = req.query
    let url = `/pedidos/vendas?limite=${Math.min(parseInt(limite),100)}&pagina=${pagina}&ordem=5`  // ordem=5 = data desc
    if (numeroPedido) url += `&numero=${numeroPedido}`
    if (situacao && situacao!=='0') url += `&idSituacao=${situacao}`
    if (dataInicio) url += `&dataInicial=${dataInicio}`
    if (dataFim)    url += `&dataFinal=${dataFim}`

    const rp = await bling.get(url)
    // Mapeamento definitivo de loja.id → canal (obtido via debug em 25/05/2026)
    const LOJA_CANAL = {
      205946980: 'shopee',      // Shopee Xpress (DDMMYY prefix)
      203414926: 'mercadolivre',// Melhor Envio
      204884434: 'shopee',      // Shopee GSH prefix — confirmado via debug
      205916963: 'tiktokshop',  // TikTok LSV-Standard
      205693668: 'nuvemshop',   // Nuvemshop SEDEX — confirmado via debug
    }
    const pedidos = (rp.data?.data || []).map(p => {
      const lojaId = p.loja?.id || 0
      const canal  = LOJA_CANAL[lojaId] || (lojaId===0 ? 'loja' : 'bling')
      return {
        id:           p.id,
        numero:       p.numero,
        total:        p.total,
        data:         p.data,
        situacao:     p.situacao,
        situacaoId:   typeof p.situacao==='object' ? p.situacao.id||p.situacao.valor : p.situacao,
        contato:      p.contato?.nome,
        contatoId:    p.contato?.id,
        lojaId,
        canal,
        loja:         p.loja || null,
        numeroLoja:   p.numeroLoja || null,
        observacoes:  p.observacoes || '',
        notaFiscal:   p.notaFiscal ? { id:p.notaFiscal.id, numero:p.notaFiscal.numero } : null,
        formaPagamento: p.parcelas?.[0]?.formaPagamento?.descricao || null,
        codigoRastreio: p.transporte?.volumes?.[0]?.codigoRastreamento || null,
        transportadora: p.transporte?.transportadora?.nome || null,
      }
    })

    res.json({ pedidos, total: rp.data?.total || pedidos.length, pagina: parseInt(pagina) })
  } catch(e) {
    console.error('GET /pedidos erro:', e.message)
    res.status(500).json({ erro: e.message })
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
      id:                  ped.id,
      numero:              ped.numero,
      total:               ped.total,
      totalProdutos:       ped.totalProdutos,
      totalDesconto:       ped.totalDesconto,
      data:                ped.data,
      dataSaida:           ped.dataSaida,
      dataPrevista:        ped.dataPrevista,
      situacao:            ped.situacao,
      contato:             ped.contato,
      itens:               ped.itens || [],
      parcelas:            ped.parcelas || [],
      transporte:          ped.transporte,
      notaFiscal:          ped.notaFiscal,
      numeroLoja:          ped.numeroLoja,
      loja:                ped.loja,
      canal:               ped.canal,
      observacoes:         ped.observacoes,
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
    const telRaw = req.params.telefone.replace(/\D/g,'')
    const tel    = telRaw.startsWith('55') ? telRaw.slice(2) : telRaw
    const tel9   = tel.length === 10 ? tel.slice(0,2) + '9' + tel.slice(2) : tel  // adiciona nono dígito
    const telSem9= tel.length === 11 ? tel.slice(0,2) + tel.slice(3) : tel         // remove nono dígito

    // Busca por múltiplos formatos e métodos
    let contato = null
    const sufixo = tel.slice(-8)
    const formatos = [tel, tel9, telSem9, telRaw].filter((v,i,a) => a.indexOf(v)===i)

    // Tenta pesquisa= e telefone= alternadamente
    for (const fmt of formatos) {
      for (const param of ['pesquisa', 'telefone']) {
        try {
          const r = await bling.get(`/contatos?${param}=${fmt}&limite=5`)
          const lista = r.data?.data || []
          console.log(`🔍 Perfil ${param}=${fmt} → ${lista.length}`, lista.map(c=>c.nome||'?'))
          const match = lista.find(c => {
            const nums = [c.telefone, c.celular, c.fone].filter(Boolean)
            return nums.some(n => n.replace(/\D/g,'').endsWith(sufixo))
          }) || lista[0]
          if (match) { contato = match; break }
        } catch (eBusca) {
          console.warn('Bling contato busca:', param, fmt, eBusca.message?.slice(0,40))
        }
      }
      if (contato) break
    }

    // Último recurso: busca pelo sufixo de 8 dígitos
    if (!contato) {
      try {
        const r = await bling.get(`/contatos?pesquisa=${sufixo}&limite=5`)
        contato = r.data?.data?.[0]
      } catch {}
    }

    if (!contato) {
      console.warn('Perfil: contato não encontrado para tel:', tel)
      return res.json({ nome: null, telefone: tel })
    }

    const rdet = await bling.get(`/contatos/${contato.id}`)
    const det  = rdet.data?.data || {}

    res.json({
      id:           det.id,
      nome:         det.nome,
      telefone:     det.telefone || det.celular || tel,
      celular:      det.celular,
      email:        det.email,
      cpf:          det.cpfCnpj || det.numeroDocumento,
      // Endereço completo
      logradouro:   det.endereco?.endereco,
      numero:       det.endereco?.numero,
      complemento:  det.endereco?.complemento,
      bairro:       det.endereco?.bairro,
      cidade:       det.endereco?.municipio,
      uf:           det.endereco?.uf,
      cep:          det.endereco?.cep,
      total_gasto:  null,
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

    // Busca contato — mesma lógica robusta do /contatos/:telefone
    const telSem55 = tel.startsWith('55') ? tel.slice(2) : tel
    const tel9     = telSem55.length===10 ? telSem55.slice(0,2)+'9'+telSem55.slice(2) : telSem55
    const telSem9  = telSem55.length===11 ? telSem55.slice(0,2)+telSem55.slice(3) : telSem55
    const sufixo   = telSem55.slice(-8)
    const formatos = [telSem55, tel9, telSem9, tel].filter((v,i,a) => a.indexOf(v)===i)
    let contato = null

    // Tenta pesquisa= e telefone= alternadamente (igual ao /contatos/:telefone)
    for (const fmt of formatos) {
      for (const param of ['pesquisa', 'telefone']) {
        try {
          const rc = await bling.get(`/contatos?${param}=${fmt}&limite=5`)
          const lista = rc.data?.data || []
          console.log(`🔍 Pedidos ${param}=${fmt} → ${lista.length}`, lista.map(c=>c.nome||'?'))
          const match = lista.find(c => {
            const nums = [c.telefone, c.celular, c.fone].filter(Boolean)
            return nums.some(n => n.replace(/\D/g,'').endsWith(sufixo))
          }) || lista[0]
          if (match) { contato = match; break }
        } catch {}
      }
      if (contato) break
    }

    // Último recurso: busca pelo sufixo de 8 dígitos
    if (!contato) {
      try {
        const rc = await bling.get(`/contatos?pesquisa=${sufixo}&limite=5`)
        contato = rc.data?.data?.[0]
      } catch {}
    }

    if (!contato) {
      console.warn('Pedidos: contato não encontrado para tel:', telSem55)
      return res.json({ pedidos: [] })
    }

    // Busca pedidos do contato
    const rp = await bling.get(`/pedidos/vendas?idContato=${contato.id}&limite=20`)
    const pedidosBase = rp.data?.data || []

    // Busca detalhes de cada pedido (NF-e, itens, transportadora) em paralelo
    const pedidos = await Promise.all(pedidosBase.map(async p => {
      let nfe_link = '', transportadora = '—', itens_lista = []
      try {
        const det = await bling.get(`/pedidos/vendas/${p.id}`)
        const d   = det.data?.data || {}
        // NF-e link
        const nfes = d.notasFiscais || []
        if (nfes.length) {
          const nfe = nfes[0]
          nfe_link = nfe.linkDanfe || nfe.linkPDF || nfe.linkDownloadXml || ''
        }
        // Transportadora
        transportadora = d.transporte?.transportadora?.nome || d.transporte?.nomeTrans || '—'
        // Itens
        itens_lista = (d.itens || []).map(i => ({
          nome:     i.descricao || i.item?.descricao || '—',
          qtd:      i.quantidade || 1,
          preco:    Number(i.valor || 0).toFixed(2).replace('.',','),
          codigo:   i.codigo || i.item?.codigo || '',
        }))
      } catch {}
      const sitId = p.situacao?.id || p.situacao
      const SITS  = {6:'Em Aberto',9:'Atendido',12:'Cancelado',14:'Faturado',15:'Verificado',24:'Pagto Pendente',27:'Em Andamento',30:'Entregue'}
      return {
        id:             p.id,
        numero:         p.numero,
        data:           p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '—',
        situacao:       SITS[sitId] || String(sitId),
        situacao_id:    sitId,
        total:          `R$ ${Number(p.total||0).toFixed(2).replace('.',',')}`,
        rastreio:       p.transporte?.codigoRastreamento || '—',
        transportadora,
        nfe_link,
        itens:          itens_lista,
        forma_pagamento:p.pagamentos?.[0]?.formaPagamento?.descricao || '—',
      }
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



// ── GET /api/dashboard/rastreio-bling/:idObjeto — rastreio via Bling v3 ──────
// Usa GET /logisticas/objetos/:id que retorna historico nativo do Bling
router.get('/rastreio-bling/:idObjeto', async (req, res) => {
  try {
    const { idObjeto } = req.params
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    // GET /logisticas/objetos/:id — endpoint oficial Bling v3 de rastreamento
    const r = await bling.get(`/logisticas/objetos/${idObjeto}`)
    const obj = r.data?.data || {}

    // Também tenta buscar histórico
    let historico = []
    try {
      const rh = await bling.get(`/logisticas/objetos/${idObjeto}/historico`)
      historico = rh.data?.data || []
    } catch {}

    res.json({
      id:               obj.id,
      codigoRastreio:   obj.codigoRastreamento || obj.codigo_rastreamento,
      situacao:         obj.situacao,
      servico:          obj.servico?.descricao || obj.servico,
      transportadora:   obj.transportadora?.nome,
      dataPostagem:     obj.dataPostagem,
      dataEntrega:      obj.dataEntrega,
      historico:        historico.map(h => ({
        data:    h.data || h.ocorrencia_data,
        status:  h.descricao || h.situacao?.descricao,
        local:   h.local || h.unidade,
        detalhe: h.detalhe,
      })),
      raw: obj,
    })
  } catch(e) {
    console.error('rastreio-bling:', e.message)
    res.status(500).json({ erro: e.message, dica: 'Verifique se o idObjeto é o ID do volume no Bling (transporte.volumes[].id)' })
  }
})

// ── GET /api/dashboard/rastreio-pedido/:numeroPedido — rastreio pelo nº pedido ─
// Busca o ID do objeto logístico via pedido e consulta o rastreamento completo
router.get('/rastreio-pedido/:numeroPedido', async (req, res) => {
  try {
    const { numeroPedido } = req.params
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    // 1. Busca o pedido para pegar os IDs dos volumes
    const rp = await bling.get(`/pedidos/vendas?numero=${numeroPedido}&limite=1`)
    const p0 = rp.data?.data?.[0]
    if (!p0) return res.status(404).json({ erro: 'Pedido não encontrado' })

    const rdet = await bling.get(`/pedidos/vendas/${p0.id}`)
    const ped  = rdet.data?.data || {}
    const volumes = ped.transporte?.volumes || []

    if (!volumes.length) {
      return res.json({ numeroPedido, volumes: [], mensagem: 'Sem volumes de transporte' })
    }

    // 2. Para cada volume, tenta buscar rastreamento via Bling /logisticas/objetos
    const rastreios = await Promise.all(volumes.map(async (vol) => {
      const resultado = {
        id:             vol.id,
        codigoRastreio: vol.codigoRastreamento,
        servico:        vol.servico?.descricao || vol.servico,
        historico:      [],
        linkRastreio:   null,
        fonte:          null,
      }

      // Define o link de rastreio pela transportadora
      const cod = vol.codigoRastreamento
      if (cod) {
        if (/^[A-Z]{2}\d{9}BR$/.test(cod))
          resultado.linkRastreio = `https://rastreamento.correios.com.br/app/index.php?objetos=${cod}`
        else if (cod.startsWith('MEL'))
          resultado.linkRastreio = `https://melhorenvio.com.br/rastreamento/${cod}`
        else
          resultado.linkRastreio = `https://melhorrastreio.com.br/rastreio/${cod}`
      }

      // Tenta GET /logisticas/objetos/:id (id do volume no Bling)
      if (vol.id) {
        try {
          const ro = await bling.get(`/logisticas/objetos/${vol.id}`)
          const obj = ro.data?.data || {}
          resultado.situacaoBling = obj.situacao
          resultado.dataEntrega   = obj.dataEntrega
          resultado.fonte = 'bling_logisticas'

          // Histórico de rastreamento nativo do Bling
          try {
            const rh = await bling.get(`/logisticas/objetos/${vol.id}/historico`)
            const hist = rh.data?.data || []
            resultado.historico = hist.map(h => ({
              data:    h.data,
              status:  h.descricao || h.situacao?.descricao,
              local:   h.local,
              detalhe: h.detalhe,
            }))
          } catch {}
        } catch {}
      }

      return resultado
    }))

    res.json({
      numeroPedido,
      pedidoId: p0.id,
      volumes: rastreios,
      geradoEm: new Date().toISOString(),
    })
  } catch(e) {
    console.error('rastreio-pedido:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /api/dashboard/rastreio/:codigo — rastreio multi-transportadora ─────
// FONTE 1: Bling v3 /logisticas/objetos (rastreio nativo com historico)
// FONTE 2: API específica por transportadora (Correios, Melhor Envio)
// FONTE 3: Link direto Melhor Rastreio (fallback universal)
router.get('/rastreio/:codigo', async (req, res) => {
  const { codigo } = req.params
  if (!codigo) return res.status(400).json({ erro: 'Código obrigatório' })

  // Detecta tipo pelo padrão do código
  const isCorreios    = /^[A-Z]{2}\d{9}BR$/.test(codigo)
  const isMelhorEnvio = codigo.startsWith('MEL')
  const isShopee      = /^BR\d+Y$/.test(codigo)
  const isTikTok      = codigo.startsWith('999')
  const tipo = isCorreios?'correios':isMelhorEnvio?'melhorenvio':isShopee?'shopee':isTikTok?'tiktok':'outro'

  try {
    const axios = require('axios')
    const resultados = []

    // 1. Tenta Melhor Envio rastreio
    const meToken = process.env.MELHORENVIO_TOKEN
    if (meToken) {
      try {
        const r = await axios.post('https://melhorenvio.com.br/api/v2/me/shipment/tracking',
          { orders: [codigo] },
          { headers: { 'Authorization': `Bearer ${meToken}`, 'Content-Type': 'application/json' }, timeout: 8000 }
        )
        const track = r.data?.[codigo]
        if (track) {
          resultados.push({
            fonte: 'Melhor Envio',
            status: track.status,
            eventos: (track.tracking || []).map(e => ({
              data:    e.happened_at || e.created_at,
              status:  e.status || e.description,
              local:   e.location || '',
            }))
          })
        }
      } catch(eMe) { console.log('ME rastreio:', eMe.message?.slice(0,40)) }
    }

    // 2. Tenta via rastreio.net (API não oficial dos Correios)
    if (!resultados.length) {
      try {
        const r = await axios.get(
          `https://rastreamento.correios.com.br/core/rastreamento.json?numero=${codigo}&cliente=PF&cartaoPostagem=9999999999`,
          { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
        )
        const eventos = r.data?.objetos?.[0]?.eventos || []
        if (eventos.length) {
          resultados.push({
            fonte: 'Correios',
            status: eventos[0]?.descricao,
            eventos: eventos.map(e => ({
              data:   `${e.dtHrCriado || ''}`,
              status: e.descricao,
              detalhe: e.detalhe,
              local:  e.unidade?.endereco ? `${e.unidade.nome||''} — ${e.unidade.endereco?.cidade||''}/${e.unidade.endereco?.uf||''}`.trim() : '',
            }))
          })
        }
      } catch(eCor) {
        // 3. Fallback: API de terceiro
        try {
          const r2 = await axios.get(
            `https://api.rastrearencomendas.com.br/v2/rastrear?codigo=${codigo}`,
            { timeout: 6000, headers: { 'Accept': 'application/json' } }
          )
          const eventos = r2.data?.events || r2.data?.eventos || []
          if (eventos.length) {
            resultados.push({
              fonte: 'Correios (fallback)',
              status: eventos[0]?.description || eventos[0]?.descricao,
              eventos: eventos.map(e => ({
                data:   e.date || e.data || '',
                status: e.description || e.descricao,
                local:  e.location || e.local || '',
              }))
            })
          }
        } catch {}
      }
    }

    const linkRastreio = isCorreios
    ? `https://rastreamento.correios.com.br/app/index.php?objetos=${codigo}`
    : isMelhorEnvio
    ? `https://melhorenvio.com.br/rastreamento/${codigo}`
    : `https://melhorrastreio.com.br/rastreio/${codigo}`

  res.json({ codigo, tipo, linkRastreio, resultados, atualizadoEm: new Date().toISOString() })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})






// ── GET /api/dashboard/financeiro-intel — Financial Intelligence ──────────────
// Agrega: Bling contas a receber + Bling pedidos 30d + MP pagamentos + forecast
router.get('/financeiro-intel', async (req, res) => {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const axios   = require('axios')
    const bling   = await getBlingClient()
    const mpToken = process.env.MP_ACCESS_TOKEN

    // Faz tudo em paralelo
    const [rContas, rPedidos, rMP, rMpLocal] = await Promise.all([
      // Contas a receber Bling (abertos + últimos pagos)
      bling.get('/contas/receber?limite=100').then(r=>r.data?.data||[]).catch(()=>[]),

      // Pedidos últimos 60 dias (2 páginas)
      Promise.all([
        bling.get('/pedidos/vendas?limite=100&ordem=5&pagina=1').then(r=>r.data?.data||[]).catch(()=>[]),
        bling.get('/pedidos/vendas?limite=100&ordem=5&pagina=2').then(r=>r.data?.data||[]).catch(()=>[]),
      ]).then(([p1,p2]) => [...p1,...p2]),

      // Mercado Pago: pagamentos aprovados últimos 30 dias
      mpToken ? axios.get(
        `https://api.mercadopago.com/v1/payments/search?status=approved&begin_date=${new Date(Date.now()-30*864e5).toISOString()}&limit=100`,
        { headers:{'Authorization':`Bearer ${mpToken}`}, timeout:8000 }
      ).then(r=>r.data?.results||[]).catch(()=>[]) : Promise.resolve([]),

      // MP local (banco)
      query('SELECT valor,tipo_pagamento,status,criado_em FROM mp_pagamentos ORDER BY criado_em DESC LIMIT 200').then(r=>r.rows).catch(()=>[]),
    ])

    const _LOJA = { 205946980:'shopee', 203414926:'mercadolivre', 204884434:'shopee', 205916963:'tiktokshop', 205693668:'nuvemshop' }
    const hoje = new Date()
    const mesAtual = hoje.toISOString().slice(0,7) // 'YYYY-MM'
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth()-1, 1).toISOString().slice(0,7)

    // ── CONTAS A RECEBER ────────────────────────────────────────────────────────
    const aReceber   = rContas.filter(c=>c.situacao===1).reduce((s,c)=>s+Number(c.valor||0),0)
    const recebidoMes= rContas.filter(c=>c.situacao===2 && (c.vencimento||'').startsWith(mesAtual)).reduce((s,c)=>s+Number(c.valor||0),0)
    const vencidos   = rContas.filter(c=>c.situacao===1 && c.vencimento && new Date(c.vencimento)<hoje)
    const vencidosVal= vencidos.reduce((s,c)=>s+Number(c.valor||0),0)

    // Próximos 30 dias a receber
    const em30dias   = rContas.filter(c=>{
      if (c.situacao!==1||!c.vencimento) return false
      const d=new Date(c.vencimento)
      return d>=hoje && d<=new Date(hoje.getTime()+30*864e5)
    }).reduce((s,c)=>s+Number(c.valor||0),0)

    // ── PEDIDOS por dia (série temporal 60 dias) ─────────────────────────────
    const diasMap = {}
    const canalMap = {}
    rPedidos.forEach(p=>{
      const dia = (p.data||'').slice(0,10)
      if (!dia) return
      const total = Number(p.total||0)
      const canal = _LOJA[p.loja?.id||0]||'bling'
      if (!diasMap[dia]) diasMap[dia] = { pedidos:0, receita:0 }
      diasMap[dia].pedidos++
      diasMap[dia].receita += total
      if (!canalMap[canal]) canalMap[canal] = { pedidos:0, receita:0 }
      canalMap[canal].pedidos++
      canalMap[canal].receita += total
    })

    // Série 30 dias
    const serie30 = Array.from({length:30}, (_,i)=>{
      const d = new Date(hoje); d.setDate(hoje.getDate()-29+i)
      const dia = d.toISOString().slice(0,10)
      const lb  = d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
      return { dia, label:lb, ...(diasMap[dia]||{pedidos:0,receita:0}) }
    })

    // Receita mês atual vs anterior
    const receitaMesAtual = rPedidos
      .filter(p=>(p.data||'').startsWith(mesAtual))
      .reduce((s,p)=>s+Number(p.total||0),0)
    const receitaMesAnt   = rPedidos
      .filter(p=>(p.data||'').startsWith(mesAnterior))
      .reduce((s,p)=>s+Number(p.total||0),0)
    const trendMes = receitaMesAnt>0 ? Math.round((receitaMesAtual-receitaMesAnt)/receitaMesAnt*100) : 0

    // Ticket médio
    const totalPed   = rPedidos.length
    const receitaTot = rPedidos.reduce((s,p)=>s+Number(p.total||0),0)
    const ticketMedio= totalPed>0 ? receitaTot/totalPed : 0

    // ── FORECAST ────────────────────────────────────────────────────────────────
    // Baseado nos últimos 7 dias — projeta o mês completo
    const diasPassados = hoje.getDate()
    const diasNoMes    = new Date(hoje.getFullYear(),hoje.getMonth()+1,0).getDate()
    const receitaHoje  = rPedidos
      .filter(p=>(p.data||'').startsWith(hoje.toISOString().slice(0,10)))
      .reduce((s,p)=>s+Number(p.total||0),0)
    const mediaDia7 = serie30.slice(-7).reduce((s,d)=>s+d.receita,0) / 7
    const forecastMes= receitaMesAtual + (mediaDia7 * (diasNoMes - diasPassados))

    // ── MP PAGAMENTOS ────────────────────────────────────────────────────────────
    const mpTotal   = rMP.reduce((s,p)=>s+Number(p.transaction_amount||0),0)
    const mpPix     = rMP.filter(p=>p.payment_method_id==='pix').reduce((s,p)=>s+Number(p.transaction_amount||0),0)
    const mpCartao  = rMP.filter(p=>['credit_card','debit_card'].includes(p.payment_type_id)).reduce((s,p)=>s+Number(p.transaction_amount||0),0)
    const mpCount   = rMP.length

    // ── CANAL BREAKDOWN ─────────────────────────────────────────────────────────
    const canais = Object.entries(canalMap).map(([canal,v])=>({
      canal, pedidos:v.pedidos, receita:parseFloat(v.receita.toFixed(2)),
      pct: receitaTot>0 ? Math.round(v.receita/receitaTot*100) : 0,
    })).sort((a,b)=>b.receita-a.receita)

    // ── CONTAS DETALHADAS ───────────────────────────────────────────────────────
    const contasFormatadas = rContas.slice(0,30).map(c=>({
      id: c.id, valor: c.valor, situacao: c.situacao,
      vencimento: c.vencimento, dataEmissao: c.dataEmissao,
      contato: c.contato?.nome, origem: c.origem?.numero,
      vencida: c.situacao===1 && c.vencimento && new Date(c.vencimento)<hoje,
    }))

    res.json({
      // KPIs principais
      kpis: {
        receita_mes:      parseFloat(receitaMesAtual.toFixed(2)),
        receita_mes_ant:  parseFloat(receitaMesAnt.toFixed(2)),
        trend_mes:        trendMes,
        receita_hoje:     parseFloat(receitaHoje.toFixed(2)),
        ticket_medio:     parseFloat(ticketMedio.toFixed(2)),
        pedidos_total:    totalPed,
        // A receber
        a_receber:        parseFloat(aReceber.toFixed(2)),
        recebido_mes:     parseFloat(recebidoMes.toFixed(2)),
        vencidos:         parseFloat(vencidosVal.toFixed(2)),
        a_receber_30d:    parseFloat(em30dias.toFixed(2)),
        // Forecast
        forecast_mes:     parseFloat(forecastMes.toFixed(2)),
        dias_mes:         diasNoMes,
        dias_passados:    diasPassados,
        media_dia:        parseFloat(mediaDia7.toFixed(2)),
        // MP
        mp_total:         parseFloat(mpTotal.toFixed(2)),
        mp_pix:           parseFloat(mpPix.toFixed(2)),
        mp_cartao:        parseFloat(mpCartao.toFixed(2)),
        mp_count:         mpCount,
      },
      serie30,
      canais,
      contas: contasFormatadas,
      geradoEm: new Date().toISOString(),
    })
  } catch(e) {
    console.error('financeiro-intel:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /api/dashboard/estoque — catálogo completo com curva ABC e alertas ───
router.get('/estoque', async (req, res) => {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    // 1. Busca todos os produtos do banco local (mais rápido que Bling)
    const [rProd, rPedidos] = await Promise.all([
      query(`
        SELECT
          bling_id, nome, codigo, preco, estoque,
          disponivel, unidade, descricao_curta,
          imagens, peso, atualizado_em
        FROM catalogo_produtos
        ORDER BY estoque DESC, atualizado_em DESC
        LIMIT 500
      `),
      // Pedidos recentes do Bling para calcular velocidade de venda
      bling.get('/pedidos/vendas?limite=200&ordem=5').then(r => r.data?.data || []).catch(() => []),
    ])

    const produtos = rProd.rows
    const pedidosBling = Array.isArray(rPedidos) ? rPedidos : []

    // 2. Calcula velocidade de venda por produto (últimos 30 dias)
    // Usa o nome/codigo do produto nos itens dos pedidos
    // OBS: a API de listagem não retorna itens — busca por amostra
    // Estima velocidade com base no estoque atual vs preco (proxy)
    // Para ABC real precisaria dos itens — usamos receita estimada como proxy

    // Mapa: bling_id → quantidade vendida estimada (de pedidos se disponível)
    const vendaMap = {}
    // Se tiver itens nos pedidos, usa; senão estima por receita
    pedidosBling.forEach(p => {
      if (p.itens) {
        p.itens.forEach(item => {
          const bid = item.produto?.id || item.bling_id
          if (bid) vendaMap[String(bid)] = (vendaMap[String(bid)] || 0) + Number(item.quantidade || 0)
        })
      }
    })

    // 3. Calcula receita potencial e curva ABC
    const prods = produtos.map(p => {
      const estoque   = parseInt(p.estoque || 0)
      const preco     = parseFloat(p.preco || 0)
      const vendas    = vendaMap[String(p.bling_id)] || 0
      // Receita potencial = preco × estoque (proxy quando não há histórico de venda)
      const receitaPot = preco * Math.max(estoque, vendas)
      const imgArr    = Array.isArray(p.imagens) ? p.imagens : (typeof p.imagens === 'string' ? JSON.parse(p.imagens || '[]') : [])

      return {
        bling_id:      p.bling_id,
        nome:          p.nome,
        codigo:        p.codigo,
        preco:         preco,
        estoque:       estoque,
        disponivel:    estoque > 0 || p.disponivel === true,
        unidade:       p.unidade || 'UN',
        descricao:     p.descricao_curta || '',
        imagem:        imgArr?.[0]?.link || imgArr?.[0] || null,
        peso:          parseFloat(p.peso || 0),
        receitaPot,
        vendas30d:     vendas,
        valorEstoque:  preco * estoque,
        atualizado:    p.atualizado_em,
      }
    })

    // 4. Curva ABC por receita potencial
    const total = prods.reduce((s, p) => s + p.receitaPot, 0)
    const sorted = [...prods].sort((a, b) => b.receitaPot - a.receitaPot)
    let acum = 0
    sorted.forEach(p => {
      acum += p.receitaPot
      const pct = total > 0 ? (acum / total) * 100 : 0
      p.curvaABC = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C'
      p.pctAcum  = Math.round(pct)
    })

    // 5. Alertas automáticos de ruptura e críticos
    const LIMITE_CRITICO  = 5
    const LIMITE_BAIXO    = 15
    const LIMITE_ZERADO   = 0

    const alertas = []
    prods.forEach(p => {
      if (p.estoque === LIMITE_ZERADO && p.curvaABC === 'A')
        alertas.push({ nivel:'critico', tipo:'zerado_a', produto:p.nome, bling_id:p.bling_id, estoque:p.estoque, msg:`Produto A zerado: ${p.nome.slice(0,50)}` })
      else if (p.estoque <= LIMITE_CRITICO && p.estoque > 0 && p.curvaABC === 'A')
        alertas.push({ nivel:'urgente', tipo:'critico_a', produto:p.nome, bling_id:p.bling_id, estoque:p.estoque, msg:`Estoque crítico (${p.estoque}un): ${p.nome.slice(0,50)}` })
      else if (p.estoque === LIMITE_ZERADO && p.curvaABC === 'B')
        alertas.push({ nivel:'aviso', tipo:'zerado_b', produto:p.nome, bling_id:p.bling_id, estoque:p.estoque, msg:`Produto B zerado: ${p.nome.slice(0,50)}` })
      else if (p.estoque <= LIMITE_BAIXO && p.estoque > 0 && p.curvaABC === 'A')
        alertas.push({ nivel:'info', tipo:'baixo_a', produto:p.nome, bling_id:p.bling_id, estoque:p.estoque, msg:`Estoque baixo (${p.estoque}un): ${p.nome.slice(0,50)}` })
    })

    // Stats resumo
    const countA = prods.filter(p => p.curvaABC==='A').length
    const countB = prods.filter(p => p.curvaABC==='B').length
    const countC = prods.filter(p => p.curvaABC==='C').length
    const zerados = prods.filter(p => p.estoque===0).length
    const criticos = prods.filter(p => p.estoque > 0 && p.estoque <= LIMITE_CRITICO).length
    const baixos   = prods.filter(p => p.estoque > LIMITE_CRITICO && p.estoque <= LIMITE_BAIXO).length
    const valorTotal = prods.reduce((s, p) => s + p.valorEstoque, 0)

    res.json({
      produtos: sorted,  // já ordenados por receita (ABC)
      total: prods.length,
      alertas: alertas.slice(0, 20),
      stats: {
        total: prods.length, zerados, criticos, baixos,
        curva: { A: countA, B: countB, C: countC },
        valor_total_estoque: parseFloat(valorTotal.toFixed(2)),
      },
      geradoEm: new Date().toISOString(),
    })
  } catch(e) {
    console.error('estoque:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /api/dashboard/clientes-rfm — CRM com score RFM ─────────────────────
// RFM = Recência (quando comprou), Frequência (quantas vezes), Valor (quanto gastou)
// Combina dados do Bling (pedidos) com sessoes_ia (engajamento WhatsApp)
router.get('/clientes-rfm', async (req, res) => {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    // Busca pedidos do Bling (últimas páginas) + sessões ativas
    const [rPedidos, rSessoes] = await Promise.all([
      bling.get('/pedidos/vendas?limite=200&ordem=5'),
      query(`
        SELECT
          telefone,
          MAX(contexto->>'nomeWhatsApp')    AS nome_wa,
          COUNT(*)                           AS total_sessoes,
          MAX(atualizado_em)                 AS ultima_sessao,
          jsonb_array_length(COALESCE(
            (SELECT contexto->'carrinho' FROM sessoes_ia s2
             WHERE s2.telefone = sessoes_ia.telefone
             ORDER BY atualizado_em DESC LIMIT 1),
            '[]'::jsonb
          )) AS itens_carrinho_atual
        FROM sessoes_ia
        WHERE atualizado_em > NOW() - INTERVAL '90 days'
        GROUP BY telefone
      `).catch(() => ({ rows: [] })),
    ])

    const pedidos = rPedidos.data?.data || []
    const sessoes = rSessoes.rows || []

    // Mapa telefone → sessão
    const sessaoMap = {}
    sessoes.forEach(s => { sessaoMap[s.telefone] = s })

    // Agrupa pedidos por contato
    const clienteMap = {}
    const hoje = new Date()
    const _LOJA_CANAL = { 205946980:'shopee', 203414926:'mercadolivre', 204884434:'shopee', 205916963:'tiktokshop', 205693668:'nuvemshop' }

    pedidos.forEach(p => {
      const nome = p.contato?.nome || 'Desconhecido'
      const id   = String(p.contato?.id || nome)
      if (!clienteMap[id]) {
        clienteMap[id] = {
          id, nome,
          contatoId: p.contato?.id,
          pedidos: [], totalGasto: 0,
          primeiraCompra: null, ultimaCompra: null,
          canais: new Set(),
        }
      }
      const c = clienteMap[id]
      const data = p.data ? new Date(p.data) : null
      const total = Number(p.total || 0)
      c.pedidos.push({ numero: p.numero, total, data: p.data, situacaoId: p.situacao?.id || p.situacao?.valor, canal: _LOJA_CANAL[p.loja?.id||0]||'bling' })
      c.totalGasto += total
      c.canais.add(_LOJA_CANAL[p.loja?.id||0]||'bling')
      if (data) {
        if (!c.primeiraCompra || data < new Date(c.primeiraCompra)) c.primeiraCompra = p.data
        if (!c.ultimaCompra  || data > new Date(c.ultimaCompra))   c.ultimaCompra   = p.data
      }
    })

    // Calcula scores RFM (1-5 cada dimensão)
    const clientes = Object.values(clienteMap)
    const agora = Date.now()

    // Quartis para scoring
    const recencias = clientes.map(c => c.ultimaCompra ? (agora - new Date(c.ultimaCompra)) / 86400000 : 9999)
    const frequencias = clientes.map(c => c.pedidos.length)
    const valores = clientes.map(c => c.totalGasto)

    const quartil = (arr, q) => {
      const sorted = [...arr].sort((a,b) => a-b)
      return sorted[Math.floor(sorted.length * q)]
    }

    // Recência: menor = melhor (comprou mais recente)
    const r25 = quartil(recencias, .25), r50 = quartil(recencias, .50), r75 = quartil(recencias, .75)
    // Frequência: maior = melhor
    const f25 = quartil(frequencias, .25), f50 = quartil(frequencias, .50), f75 = quartil(frequencias, .75)
    // Valor: maior = melhor
    const v25 = quartil(valores, .25), v50 = quartil(valores, .50), v75 = quartil(valores, .75)

    const rfmScore = (recencia, freq, valor) => {
      const r = recencia <= r25 ? 5 : recencia <= r50 ? 4 : recencia <= r75 ? 3 : recencia <= 60 ? 2 : 1
      const f = freq >= f75 ? 5 : freq >= f50 ? 4 : freq >= f25 ? 3 : freq > 1 ? 2 : 1
      const v = valor >= v75 ? 5 : valor >= v50 ? 4 : valor >= v25 ? 3 : valor > 0 ? 2 : 1
      return { r, f, v, total: r + f + v }
    }

    const segmento = (score, diasSemComprar) => {
      const { r, f, v, total } = score
      if (r >= 4 && f >= 4 && v >= 4) return 'vip'
      if (r >= 3 && f >= 3)           return 'fiel'
      if (r >= 4 && f <= 2)           return 'novo'
      if (r <= 2 && f >= 3)           return 'em_risco'
      if (r <= 2 && f >= 2)           return 'perdido'
      if (r >= 3 && v >= 4)           return 'potencial'
      return 'regular'
    }

    const clientesRFM = clientes.map(c => {
      const diasSemComprar = c.ultimaCompra ? (agora - new Date(c.ultimaCompra)) / 86400000 : 9999
      const score = rfmScore(diasSemComprar, c.pedidos.length, c.totalGasto)
      const seg   = segmento(score, diasSemComprar)
      const ticket = c.pedidos.length > 0 ? c.totalGasto / c.pedidos.length : 0

      return {
        id:              c.id,
        nome:            c.nome,
        contatoId:       c.contatoId,
        pedidosTotal:    c.pedidos.length,
        totalGasto:      parseFloat(c.totalGasto.toFixed(2)),
        ticketMedio:     parseFloat(ticket.toFixed(2)),
        primeiraCompra:  c.primeiraCompra,
        ultimaCompra:    c.ultimaCompra,
        diasSemComprar:  Math.round(diasSemComprar),
        canais:          [...c.canais],
        ultimoPedido:    c.pedidos.sort((a,b) => (b.numero||0)-(a.numero||0))[0],
        rfm:             { r: score.r, f: score.f, v: score.v, total: score.total },
        segmento:        seg,
      }
    }).sort((a,b) => b.rfm.total - a.rfm.total)

    // Stats por segmento
    const stats = clientesRFM.reduce((acc, c) => {
      acc[c.segmento] = (acc[c.segmento] || 0) + 1
      return acc
    }, {})

    res.json({
      clientes: clientesRFM,
      total: clientesRFM.length,
      stats,
      receita_total: clientesRFM.reduce((s,c) => s + c.totalGasto, 0),
      geradoEm: new Date().toISOString(),
    })
  } catch(e) {
    console.error('clientes-rfm:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /api/dashboard/dashboard-summary — todos os dados do Dashboard ────────
// Agrega em uma única chamada: KPIs, heatmap, alertas, top produtos, canais
router.get('/dashboard-summary', async (req, res) => {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient().catch(() => null)

    const [
      kpis, heatmap, canalStats, recenteMsgs, sessoes,
      topClientes, alertasQ, iaStats
    ] = await Promise.all([

      // KPIs gerais — comparativo hoje vs ontem
      query(`
        SELECT
          COUNT(DISTINCT telefone) FILTER (WHERE criado_em > NOW() - INTERVAL '24h') AS conversas_hoje,
          COUNT(DISTINCT telefone) FILTER (WHERE criado_em > CURRENT_DATE - 1 AND criado_em < CURRENT_DATE) AS conversas_ontem,
          COUNT(*) FILTER (WHERE criado_em > NOW() - INTERVAL '24h' AND direcao='entrada') AS msgs_hoje,
          COUNT(*) FILTER (WHERE criado_em > CURRENT_DATE - 1 AND criado_em < CURRENT_DATE AND direcao='entrada') AS msgs_ontem,
          COUNT(*) FILTER (WHERE criado_em > NOW() - INTERVAL '7d' AND direcao='entrada') AS msgs_semana,
          COUNT(*) FILTER (WHERE criado_em > NOW() - INTERVAL '30d' AND direcao='entrada') AS msgs_mes
        FROM mensagens
      `).catch(() => ({ rows:[{}] })),

      // Heatmap: mensagens por hora × dia da semana (últimos 30 dias)
      query(`
        SELECT
          EXTRACT(DOW FROM criado_em)  AS dia_semana,
          EXTRACT(HOUR FROM criado_em) AS hora,
          COUNT(*) AS total
        FROM mensagens
        WHERE criado_em > NOW() - INTERVAL '30 days'
          AND direcao = 'entrada'
        GROUP BY dia_semana, hora
        ORDER BY dia_semana, hora
      `).catch(() => ({ rows:[] })),

      // Volume por canal (origem da sessão — últimos 30 dias)
      query(`
        SELECT
          COALESCE(contexto->>'origem', 'whatsapp') AS canal,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE atualizado_em > NOW() - INTERVAL '24h') AS hoje
        FROM sessoes_ia
        WHERE atualizado_em > NOW() - INTERVAL '30 days'
        GROUP BY canal
        ORDER BY total DESC
        LIMIT 8
      `).catch(() => ({ rows:[] })),

      // Últimas 24h: mensagens por hora (sparkline)
      query(`
        SELECT
          DATE_TRUNC('hour', criado_em) AS hora,
          COUNT(*) AS total
        FROM mensagens
        WHERE criado_em > NOW() - INTERVAL '24h'
          AND direcao = 'entrada'
        GROUP BY 1 ORDER BY 1
      `).catch(() => ({ rows:[] })),

      // Sessões ativas agora
      query(`
        SELECT
          COUNT(*) AS ativas,
          COUNT(*) FILTER (WHERE contexto->>'modo' = 'humano') AS humano,
          COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(contexto->'carrinho','[]'::jsonb)) > 0) AS com_carrinho
        FROM sessoes_ia
        WHERE atualizado_em > NOW() - INTERVAL '30 minutes'
      `).catch(() => ({ rows:[{ ativas:0, humano:0, com_carrinho:0 }] })),

      // Top clientes mais ativos (últimos 30 dias)
      query(`
        SELECT
          telefone,
          MAX(contexto->>'nomeWhatsApp') AS nome,
          COUNT(*) AS msgs,
          MAX(atualizado_em) AS ultima
        FROM sessoes_ia
        WHERE atualizado_em > NOW() - INTERVAL '30 days'
        GROUP BY telefone
        ORDER BY msgs DESC
        LIMIT 5
      `).catch(() => ({ rows:[] })),

      // Alertas automáticos — condições críticas
      query(`
        SELECT * FROM (
          SELECT 'fila_humano' AS tipo,
                 COUNT(*) AS valor, NULL AS extra
          FROM sessoes_ia
          WHERE contexto->>'modo' = 'humano'
            AND atualizado_em > NOW() - INTERVAL '30 minutes'
          UNION ALL
          SELECT 'sem_resposta' AS tipo,
                 COUNT(*) AS valor, NULL AS extra
          FROM mensagens m
          WHERE m.direcao = 'entrada'
            AND m.criado_em > NOW() - INTERVAL '2 hours'
            AND NOT EXISTS (
              SELECT 1 FROM mensagens r
              WHERE r.telefone = m.telefone
                AND r.direcao = 'saida'
                AND r.criado_em > m.criado_em
            )
        ) t
        WHERE valor > 0
      `).catch(() => ({ rows:[] })),

      // IA stats — taxa de sucesso recente
      query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'ok') AS ok,
          COALESCE(SUM(custo_usd) FILTER (WHERE criado_em > NOW() - INTERVAL '24h'), 0) AS custo_hoje,
          COALESCE(SUM(tokens_in + tokens_out) FILTER (WHERE criado_em > NOW() - INTERVAL '24h'), 0) AS tokens_hoje,
          MAX(criado_em) AS ultima
        FROM ia_uso_log
        WHERE criado_em > NOW() - INTERVAL '24h'
      `).catch(() => ({ rows:[{}] })),
    ])

    // Busca pedidos e receita do Bling
    let pedidosHoje = 0, pedidosSemana = 0, receitaMes = 0, pedidosRecentes = []
    if (bling) {
      try {
        const rp = await bling.get('/pedidos/vendas?limite=50&ordem=5')
        const pedidos = rp.data?.data || []
        const hoje = new Date().toISOString().split('T')[0]
        const semAgo = new Date(Date.now() - 7*86400000).toISOString().split('T')[0]
        pedidosHoje   = pedidos.filter(p => (p.data||'').startsWith(hoje)).length
        pedidosSemana = pedidos.filter(p => (p.data||'') >= semAgo).length
        receitaMes    = pedidos.reduce((s,p) => s + Number(p.total||0), 0)
        const _LOJA_CANAL = { 205946980:'shopee', 203414926:'mercadolivre', 204884434:'shopee', 205916963:'tiktokshop', 205693668:'nuvemshop' }
        pedidosRecentes = pedidos.slice(0, 8).map(p => ({
          numero: p.numero, total: p.total, data: p.data,
          contato: p.contato?.nome,
          situacaoId: p.situacao?.id || p.situacao?.valor,
          canal: _LOJA_CANAL[p.loja?.id||0] || 'bling',
        }))
      } catch {}
    }

    // Monta alertas enriquecidos
    const alertas = []
    const alertasRows = alertasQ.rows || []
    for (const row of alertasRows) {
      if (row.tipo === 'fila_humano' && parseInt(row.valor) > 0)
        alertas.push({ nivel:'critico', tipo:'fila_humano', titulo:`${row.valor} cliente${row.valor>1?'s':''} aguardando atendimento humano`, acao:'atendimento' })
      if (row.tipo === 'sem_resposta' && parseInt(row.valor) > 0)
        alertas.push({ nivel:'aviso', tipo:'sem_resposta', titulo:`${row.valor} mensagem${row.valor>1?'s':''} sem resposta há 2h+`, acao:'conversas' })
    }

    // KPI trends
    const k = kpis.rows[0] || {}
    const convHoje   = parseInt(k.conversas_hoje) || 0
    const convOntem  = parseInt(k.conversas_ontem) || 0
    const msgsHoje   = parseInt(k.msgs_hoje) || 0
    const msgsOntem  = parseInt(k.msgs_ontem) || 0
    const trendConv  = convOntem > 0 ? Math.round((convHoje - convOntem) / convOntem * 100) : 0
    const trendMsgs  = msgsOntem > 0 ? Math.round((msgsHoje - msgsOntem) / msgsOntem * 100) : 0

    // IA saúde
    const ia = iaStats.rows[0] || {}
    const totalIA = parseInt(ia.total) || 0
    const taxaIA  = totalIA > 0 ? Math.round(parseInt(ia.ok) / totalIA * 100) : 100

    res.json({
      kpis: {
        conversas_hoje: convHoje, conversas_ontem: convOntem, trend_conversas: trendConv,
        msgs_hoje: msgsHoje, msgs_ontem: msgsOntem, trend_msgs: trendMsgs,
        msgs_semana: parseInt(k.msgs_semana)||0, msgs_mes: parseInt(k.msgs_mes)||0,
        pedidos_hoje: pedidosHoje, pedidos_semana: pedidosSemana,
        receita_mes: receitaMes,
      },
      heatmap: heatmap.rows.map(r => ({ dia: parseInt(r.dia_semana), hora: parseInt(r.hora), total: parseInt(r.total) })),
      canais: canalStats.rows,
      sparkline24h: recenteMsgs.rows.map(r => ({ hora: r.hora, total: parseInt(r.total) })),
      sessoes: sessoes.rows[0] || {},
      topClientes: topClientes.rows,
      alertas,
      ia: { taxa: taxaIA, custo_hoje: parseFloat(ia.custo_hoje)||0, tokens_hoje: parseInt(ia.tokens_hoje)||0, ultima: ia.ultima },
      pedidosRecentes,
      geradoEm: new Date().toISOString(),
    })
  } catch(e) {
    console.error('dashboard-summary:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /api/dashboard/live-activity — dados em tempo real da barra inferior ─
// Endpoint ultra-leve: uma única query agregada, resposta < 100ms
router.get('/live-activity', async (req, res) => {
  try {
    const [sessoes, msgs, pedidos, ia] = await Promise.all([
      // Sessões ativas nos últimos 30 min
      query(`
        SELECT
          COUNT(*) AS ativas,
          COUNT(*) FILTER (WHERE contexto->>'modo' = 'humano') AS humano,
          COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(contexto->'carrinho','[]'::jsonb)) > 0) AS com_carrinho
        FROM sessoes_ia
        WHERE atualizado_em > NOW() - INTERVAL '30 minutes'
      `).catch(() => ({ rows:[{ ativas:0, humano:0, com_carrinho:0 }] })),

      // Mensagens última hora + hoje
      query(`
        SELECT
          COUNT(*) FILTER (WHERE criado_em > NOW() - INTERVAL '1 hour' AND direcao='entrada')  AS msgs_hora,
          COUNT(*) FILTER (WHERE criado_em > NOW() - INTERVAL '24 hours' AND direcao='entrada') AS msgs_hoje,
          COUNT(*) FILTER (WHERE criado_em > NOW() - INTERVAL '24 hours' AND direcao='saida')   AS respostas_hoje
        FROM mensagens
      `).catch(() => ({ rows:[{ msgs_hora:0, msgs_hoje:0, respostas_hoje:0 }] })),

      // Pedidos criados hoje (via banco local mp_pagamentos ou bling stats)
      query(`
        SELECT
          COUNT(*) FILTER (WHERE criado_em > NOW() - INTERVAL '24 hours') AS pedidos_hoje,
          COUNT(*) FILTER (WHERE criado_em > NOW() - INTERVAL '1 hour')   AS pedidos_hora,
          COALESCE(SUM(valor) FILTER (WHERE criado_em > NOW() - INTERVAL '24 hours'), 0) AS receita_hoje
        FROM mp_pagamentos
      `).catch(() => ({ rows:[{ pedidos_hoje:0, pedidos_hora:0, receita_hoje:0 }] })),

      // IA: taxa de sucesso recente (últimas 20 chamadas)
      query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'ok') AS ok,
          MAX(criado_em) AS ultima_chamada
        FROM ia_uso_log
        WHERE criado_em > NOW() - INTERVAL '2 hours'
      `).catch(() => ({ rows:[{ total:0, ok:0, ultima_chamada:null }] })),
    ])

    const s = sessoes.rows[0] || {}
    const m = msgs.rows[0] || {}
    const p = pedidos.rows[0] || {}
    const i = ia.rows[0] || {}

    const totalIA = parseInt(i.total) || 0
    const okIA    = parseInt(i.ok) || 0
    const taxaIA  = totalIA > 0 ? Math.round(okIA / totalIA * 100) : 100

    res.json({
      // Conversas
      sessoes_ativas:   parseInt(s.ativas) || 0,
      sessoes_humano:   parseInt(s.humano) || 0,
      com_carrinho:     parseInt(s.com_carrinho) || 0,
      // Mensagens
      msgs_hora:        parseInt(m.msgs_hora) || 0,
      msgs_hoje:        parseInt(m.msgs_hoje) || 0,
      respostas_hoje:   parseInt(m.respostas_hoje) || 0,
      // Pedidos / receita
      pedidos_hoje:     parseInt(p.pedidos_hoje) || 0,
      pedidos_hora:     parseInt(p.pedidos_hora) || 0,
      receita_hoje:     parseFloat(p.receita_hoje) || 0,
      // IA saúde
      taxa_ia:          taxaIA,
      ia_ultima:        i.ultima_chamada,
      ia_ok:            taxaIA >= 90,
      // Timestamp
      timestamp:        new Date().toISOString(),
    })
  } catch(e) {
    console.error('live-activity:', e.message)
    res.status(500).json({ erro: e.message })
  }
})


// ── POST /api/dashboard/webhook-bling — recebe eventos automáticos do Bling ──
// Configurar em: Bling > Preferências > Integrações > Lojas Virtuais > Webhooks
// Eventos relevantes:
//   pedido.incluido          → Pedido Criado
//   pedido.situacaoAlterada  → Status mudou (verificar situacao.id)
//   logistica.etiquetaGerada → Etiqueta criada (pega codigoRastreamento)
//   logistica.objetoAtualizado → Status de rastreio atualizado
// ── POST /api/dashboard/webhook-bling — receptor oficial Bling v3 ─────────────
// Payload v1 real: { eventId, date, version, event, companyId, data: { id } }
// event pode ser: order.created | order.updated | order.deleted
// OBRIGATORIO: responder 2xx em até 5 segundos
// Autenticação: X-Bling-Signature-256: sha256=HMAC(body, CLIENT_SECRET)
router.post('/webhook-bling', async (req, res) => {
  const inicio = Date.now()

  try {
    // 1. Valida assinatura HMAC (segurança)
    const crypto = require('crypto')
    const clientSecret = process.env.BLING_CLIENT_SECRET || ''
    const signature    = req.headers['x-bling-signature-256'] || ''
    const rawBody      = JSON.stringify(req.body)

    if (clientSecret && signature) {
      const esperado = 'sha256=' + crypto
        .createHmac('sha256', clientSecret)
        .update(rawBody, 'utf8')
        .digest('hex')
      if (signature !== esperado) {
        console.warn('[Webhook Bling] Assinatura inválida — ignorado')
        return res.status(401).json({ erro: 'Assinatura inválida' })
      }
    }

    // 2. Extrai dados do payload v1
    const { eventId, event, data, date, companyId } = req.body || {}
    const pedidoId = data?.id  // ID interno Bling (não o número visível)

    console.log(`[Webhook] ${event} | id=${pedidoId} | eventId=${eventId?.slice(0,8)} | ${Date.now()-inicio}ms`)

    // 3. Responde 2xx IMEDIATAMENTE (Bling exige <5 segundos)
    res.json({ ok: true, eventId, event, recebidoEm: new Date().toISOString() })

    // 4. Processa de forma assíncrona (depois do res.json)
    if (!pedidoId || !event) return

    _enqueueWebhook(async () => {
      try {
        const { getBlingClient } = require('../utils/blingClient')
        const bling = await getBlingClient()

        // Helper: GET com retry automático em 429
        const _blingGet = async (url, tentativas=3) => {
          for (let i = 0; i < tentativas; i++) {
            try {
              return await bling.get(url)
            } catch(e) {
              if (e.response?.status === 429 && i < tentativas-1) {
                const delay = (i+1) * 5000
                console.log(`[Webhook] 429 em ${url} — aguardando ${delay/1000}s (tentativa ${i+1}/3)...`)
                await new Promise(r => setTimeout(r, delay))
              } else throw e
            }
          }
        }

        // ── FLUXO INVOICE.CREATED ────────────────────────────────────────────
        // Para NF: data.id = ID da Nota Fiscal (NÃO do pedido)
        // Busca a NF diretamente, depois extrai o pedido vinculado
        if (event === 'invoice.created' || event === 'invoice.updated' || event === 'nfe.created' || event === 'nfe.updated') {
          console.log('[Webhook NF] payload:', JSON.stringify(req.body).slice(0,400))
          console.log('[Webhook NF] ID recebido (é ID da NF):', pedidoId)

          // Aguarda 5s — NF pode não estar indexada ainda no Bling
          await new Promise(r => setTimeout(r, 5000))

          let nf = null
          // Tenta os endpoints possíveis de NF na API v3
          for (const ep of [`/nfe/${pedidoId}`, `/nfes/${pedidoId}`, `/notas-fiscais/${pedidoId}`]) {
            try {
              const r = await _blingGet(ep)
              nf = r.data?.data || null
              if (nf?.id) { console.log(`[Webhook NF] endpoint correto: ${ep}`); break }
            } catch(e) {
              console.log(`[Webhook NF] ${ep} → ${e.response?.status || e.message?.slice(0,30)}`)
            }
          }

          if (!nf) {
            console.log('[Webhook NF] NF não encontrada — nenhum endpoint funcionou')
            return
          }

          const numNF     = nf.numero || '—'
          const linkDanfe = nf.linkDanfe || nf.linkPDF || null
          const nfSitId   = nf.situacao?.id || nf.situacao
          console.log(`[Webhook NF] #${numNF} | sit=${nfSitId} | DANFE: ${linkDanfe||'sem link'} | contato: ${nf.contato?.nome||'—'}`)

          // O contato JÁ VEM na NF (GET /nfe/:id retorna contato.telefone)
          // Não precisa buscar o pedido vinculado — pega o telefone direto
          let telNF  = (nf.contato?.telefone || '').replace(/\D/g,'')
          let nomeNF = (nf.contato?.nome || '').split(' ')[0] || 'cliente'

          // Se não tiver telefone no contato da NF, tenta buscar pelo contato.id
          if (!telNF && nf.contato?.id) {
            try {
              const rC  = await _blingGet(`/contatos/${nf.contato.id}`)
              const ct  = rC.data?.data || {}
              telNF = (ct.celular || ct.telefone || '').replace(/\D/g,'')
            } catch {}
          }

          if (telNF && !telNF.startsWith('55')) telNF = '55' + telNF

          // Fallback: tenta buscar o pedido pelo numeroPedidoLoja
          if (!telNF && nf.numeroPedidoLoja) {
            try {
              const rPed = await _blingGet(`/pedidos/vendas?numeroLoja=${nf.numeroPedidoLoja}&limite=1`)
              const pedNF = rPed.data?.data?.[0]
              if (pedNF?.contato?.id) {
                const rC = await _blingGet(`/contatos/${pedNF.contato.id}`)
                const ct = rC.data?.data || {}
                telNF  = (ct.celular || ct.telefone || '').replace(/\D/g,'')
                nomeNF = (ct.nome || pedNF.contato?.nome || '').split(' ')[0] || 'cliente'
                if (telNF && !telNF.startsWith('55')) telNF = '55' + telNF
              }
            } catch {}
          }

          if (!telNF) {
            console.log('[Webhook NF] Sem telefone para enviar NF — campos NF:', Object.keys(nf).slice(0,15).join(','))
            return
          }

          const msgNF = linkDanfe
            ? `📄 *Nota Fiscal #${numNF} emitida!*

Olá, *${nomeNF}*! Sua nota fiscal foi emitida.

🔗 *Download NF-e:*
${linkDanfe}

_Só Strass 🥰_`
            : `📄 *Nota Fiscal #${numNF} emitida!*

Olá, *${nomeNF}*! Sua nota fiscal foi emitida com sucesso.

_Só Strass 🥰_`

          let statusNF = 'enviado', erroNF = null
          try {
            const { sendMessage } = require('../utils/whatsapp')
            await sendMessage(telNF, msgNF)
            console.log(`[Webhook NF] WhatsApp enviado → ${telNF} | NF #${numNF}`)
          } catch(eWA) {
            statusNF = 'enfileirado'; erroNF = eWA.message?.slice(0,200)
            const telSem55 = telNF.startsWith('55') ? telNF.slice(2) : telNF
            await query(
              `INSERT INTO mensagens_saida (telefone, conteudo, status, criado_em) VALUES ($1,$2,'pendente',NOW())`,
              [telSem55, msgNF]
            ).catch(() => {})
            console.log(`[Webhook NF] WhatsApp enfileirado → ${telNF}`)
          }
          // Registra na disparos_log
          await query(
            `INSERT INTO disparos_log (gatilho, telefone, pedido_num, canal, status, mensagem, erro, criado_em)
             VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
            ['nf_emitida', telNF, null, 'bling', statusNF, msgNF?.slice(0,500), erroNF]
          ).catch(() => {})
          return // NF processada — não continua para o fluxo de pedido
        }

        // ── FLUXO ORDER (created/updated/deleted) ────────────────────────────
        const rp = await _blingGet(`/pedidos/vendas/${pedidoId}`)
        const ped = rp.data?.data || {}
        if (!ped.id) return

        const SIT_LABEL = { 6:'Em Aberto', 9:'Atendido', 12:'Cancelado', 15:'Verificado' }
        const sitId  = ped.situacao?.id
        const sitLabel = SIT_LABEL[sitId] || `${sitId}`
        const numero = ped.numero
        const _LOJA  = { 205946980:'shopee', 203414926:'mercadolivre', 204884434:'shopee', 205916963:'tiktokshop', 205693668:'nuvemshop' }
        const canal  = _LOJA[ped.loja?.id||0] || 'bling'
        const codigoRastreio = ped.transporte?.volumes?.[0]?.codigoRastreamento

        console.log(`[Webhook] Pedido #${numero} | Situação: ${sitLabel} | Canal: ${canal} | LojaID: ${ped.loja?.id||0} | Rastreio: ${codigoRastreio||'—'} | Contato: ${ped.contato?.nome?.slice(0,20)||'—'}`)

        // 5. Busca contato completo para WhatsApp
        let tel = null
        if (ped.contato?.id) {
          try {
            const rc = await _blingGet(`/contatos/${ped.contato.id}`)
            const ct = rc.data?.data || {}
            tel = (ct.celular || ct.telefone || '').replace(/\D/g,'')
            if (tel && !tel.startsWith('55')) tel = '55' + tel
          } catch {}
        }

        // 6. Persiste no banco local para histórico (não bloqueia)
        await query(
          `INSERT INTO webhook_eventos (event_id, event, pedido_id, pedido_numero, situacao_id, canal, tel, payload, criado_em)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
           ON CONFLICT (event_id) DO NOTHING`,
          [eventId, event, pedidoId, numero, sitId, canal, tel, JSON.stringify(req.body)]
        ).catch(() => {}) // tabela pode não existir ainda — ignora

        // 7. Se ainda sem telefone, tenta extrair das observações do pedido
        if (!tel) {
          const obs = (ped.observacoes || ped.observacoesInternas || '')
          const telObs = obs.match(/(?:fone|tel|celular|whatsapp)[:\s]*(\d[\d\s\-\(\)]{9,14})/i)?.[1]
          if (telObs) {
            tel = telObs.replace(/\D/g,'')
            if (tel && !tel.startsWith('55')) tel = '55' + tel
            console.log(`[Webhook] Telefone encontrado nas observações: ${tel}`)
          }
        }

        // 8. Dispara gatilho de WhatsApp baseado no evento + situação
        if (!tel) {
          console.log(`[Webhook] Sem telefone para pedido #${numero} (canal: ${canal}) — WhatsApp não enviado`)
          console.log(`[Webhook] Campos contato: id=${ped.contato?.id} nome=${ped.contato?.nome?.slice(0,20)}`)
          return
        }

        const nome = (ped.contato?.nome||'').split(' ')[0] || 'cliente'

        // ── MARKETPLACE: rastreio físico apenas, ZERO WhatsApp ────────────────
        const MARKETPLACES_SEM_WA = ['shopee','mercadolivre','shein','tiktokshop']
        if (MARKETPLACES_SEM_WA.includes(canal)) {
          console.log(`[Webhook] #${numero} canal=${canal} (marketplace) → sem WhatsApp`)
          return
        }

        // ── LOJA e NUVEMSHOP: dispara via sistema de templates HSM ────────────
        // Mapeia evento + situação → gatilho do PageGatilhos
        let gatilho = null
        if (event === 'order.created') {
          gatilho = 'pedido_criado'
        } else if (event === 'order.updated') {
          if (sitId === 6)  gatilho = 'pedido_criado'    // Em Aberto = criação
          if (sitId === 9)  gatilho = 'em_separacao'   // Atendido = separação
          if (sitId === 15) gatilho = 'pagamento_aprovado' // Em Andamento = aprovado
          if (sitId === 15 && codigoRastreio) gatilho = 'pedido_enviado' // Enviado
          if (sitId === 27) gatilho = 'pedido_enviado'
          if (sitId === 12) gatilho = 'cancelamento'
          if (sitId === 30) gatilho = 'pedido_entregue'
        }

        if (!gatilho) {
          console.log(`[Webhook] #${numero} event=${event} sit=${sitId} → sem gatilho mapeado`)
          return
        }
        if (!tel) {
          console.log(`[Webhook] #${numero} sem telefone → não dispara`)
          return
        }

        // Monta variáveis para o template
        const variaveis = {
          nome_cliente:       ped.contato?.nome || nome,
          primeiro_nome:      nome,
          numero_pedido:      String(numero || ''),
          nome_loja:          'Só Strass',
          valor_total:        `R$ ${Number(ped.totalVenda||ped.total||0).toFixed(2).replace('.',',')}`,
          forma_pagamento:    ped.parcelas?.[0]?.formaPagamento?.descricao
                              || ped.pagamento?.formaPagamento?.descricao || 'PIX',
          transportadora:     ped.transporte?.transportadora?.nome || '',
          codigo_rastreio:    codigoRastreio || '',
          link_pedido:        `https://sostrass.com.br/pedido/${numero}`,
          link_acompanhamento: codigoRastreio
            ? `https://rastreio.sostrass.com.br/p/${codigoRastreio}`
            : `https://rastreio.sostrass.com.br/p/${numero}`,
          previsao_entrega:   ped.dataPrevista ? new Date(ped.dataPrevista).toLocaleDateString('pt-BR') : '',
          qtde_item_pedido:   String((ped.itens||[]).reduce((s,i)=>s+(i.quantidade||1),0)),
          lista_itens_pedido: (ped.itens||[]).map(i=>`• ${i.descricao||i.produto?.nome||'Item'} × ${i.quantidade||1}`).join('\n'),
          itens_linha_unica:  (ped.itens||[]).map(i=>`${i.descricao||i.produto?.nome||'Item'} ×${i.quantidade||1}`).join(', '),
          link_rastreio:      codigoRastreio
            ? `https://rastreio.sostrass.com.br/p/${codigoRastreio}`
            : '',
        }

        // Dispara via API interna de templates
        const RAILWAY = process.env.RAILWAY_URL || 'http://localhost:3000'
        try {
          const { default: axios2 } = require('axios').default ? require('axios') : { default: require('axios') }
          const ax = typeof axios2 === 'function' ? axios2 : require('axios')
          const rT = await ax.post(
            `${RAILWAY}/api/templates/disparar-gatilho`,
            { gatilho, telefone: tel, variaveis, canal: canal||'bling' },
            { timeout: 12000 }
          )
          console.log(`[Webhook] ✅ [${gatilho}] → #${numero} | canal=${canal} | ${rT.data?.status||'ok'}`)
        } catch (eT) {
          const msg = eT.response?.data?.erro || eT.message?.slice(0,80)
          console.error(`[Webhook] Erro disparar [${gatilho}] #${numero}: ${msg}`)
          // Registra falha
          await query(
            `INSERT INTO disparos_log
               (gatilho, telefone, pedido_num, numero_pedido, nome_cliente, canal, status, erro_msg, origem, criado_em)
             VALUES ($1,$2,$3,$4,$5,$6,'erro',$7,'bling',NOW())`,
            [gatilho, tel, typeof numero==='number'?numero:null, String(numero||''),
             ped?.contato?.nome||'', canal||'bling', msg||'erro']
          ).catch(()=>{})
        }

      } catch(eAsync) {
        const status = eAsync.response?.status
        const url    = eAsync.config?.url || eAsync.request?.path || '?'
        console.error(`[Webhook] Erro assíncrono: ${status||''} ${eAsync.message} | url: ${url}`)
        if (status === 404) console.log(`[Webhook] 404 em ${url} — provável NF ainda não indexada ou ID inválido`)
        if (status === 429) console.error('[Webhook] 429 — rate limit (aumentar intervalo da fila)')
      }
    })

  } catch(e) {
    console.error('[Webhook Bling] Erro:', e.message)
    // Mesmo com erro, responde 2xx para o Bling não fazer retentativas infinitas
    if (!res.headersSent) res.status(200).json({ ok: false, erro: e.message })
  }
})


// ── GET /api/dashboard/disparos-cliente/:tel ─────────────────────────────────
router.get('/disparos-cliente/:tel', async (req, res) => {
  try {
    const telRaw = decodeURIComponent(req.params.tel || '')
    const tel    = telRaw.replace(/\D/g, '')   // somente dígitos
    if (!tel || tel.length < 8) {
      return res.json({ disparos:[], resumo:{nome:'',total:0,enviados:0,erros:0,ignorados:0,pedidos:[],telefone:'',ultimo_contato:null} })
    }
    // Variações: com DDI 55 e sem
    const telC = tel.startsWith('55') ? tel : '55' + tel
    const telS = tel.startsWith('55') ? tel.slice(2) : tel

    // REGEXP_REPLACE no lado do banco garante match independente do formato armazenado
    // (ex: '(47) 99216-0538', '47992160538', '5547992160538' → todos viram '47992160538' ou '5547992160538')
    const WHERE_TEL = `REGEXP_REPLACE(telefone::TEXT, '[^0-9]', '', 'g') IN ($1, $2)`

    let rows = []

    // Tentativa 1: query completa com todas as colunas migradas
    try {
      const { rows: r1 } = await query(`
        SELECT
          id, gatilho, telefone, criado_em,
          COALESCE(canal,'')         AS canal,
          COALESCE(status,'')        AS status,
          COALESCE(nome_cliente,'')  AS nome_cliente,
          COALESCE(numero_pedido,'') AS numero_pedido,
          COALESCE(origem,'')        AS origem,
          COALESCE(erro_msg,'')      AS erro_msg,
          COALESCE(template_nome,'') AS template_nome,
          COALESCE(delay_min, 0)     AS delay_min
        FROM disparos_log
        WHERE ${WHERE_TEL}
        ORDER BY criado_em DESC LIMIT 100
      `, [telC, telS])
      rows = r1
      console.log('[disparos-cliente] ok1:', rows.length, '|', telC)
    } catch (e1) {
      console.warn('[disparos-cliente] err1:', e1.message.slice(0,80))
      // Tentativa 2: sem delay_min e template_nome
      try {
        const { rows: r2 } = await query(`
          SELECT
            id, gatilho, telefone, criado_em,
            COALESCE(canal,'')         AS canal,
            COALESCE(status,'')        AS status,
            COALESCE(nome_cliente,'')  AS nome_cliente,
            COALESCE(numero_pedido,'') AS numero_pedido,
            COALESCE(origem,'')        AS origem,
            COALESCE(erro_msg,'')      AS erro_msg,
            0                          AS delay_min,
            ''                         AS template_nome
          FROM disparos_log
          WHERE ${WHERE_TEL}
          ORDER BY criado_em DESC LIMIT 100
        `, [telC, telS])
        rows = r2
        console.log('[disparos-cliente] ok2:', rows.length)
      } catch (e2) {
        console.warn('[disparos-cliente] err2:', e2.message.slice(0,80))
        // Tentativa 3: sem delay_min, template_nome, origem e erro_msg — mínimo funcional
        try {
          const { rows: r3 } = await query(`
            SELECT id, gatilho, telefone, criado_em,
                   COALESCE(canal,'')         AS canal,
                   COALESCE(status,'')        AS status,
                   COALESCE(nome_cliente,'')  AS nome_cliente,
                   COALESCE(numero_pedido,'') AS numero_pedido,
                   '' AS origem, '' AS erro_msg,
                   0  AS delay_min, '' AS template_nome
            FROM disparos_log
            WHERE ${WHERE_TEL}
            ORDER BY criado_em DESC LIMIT 100
          `, [telC, telS])
          rows = r3
          console.log('[disparos-cliente] ok3:', rows.length)
        } catch (e3) {
          console.warn('[disparos-cliente] err3:', e3.message.slice(0,80))
          // Tentativa 4: mínimo absoluto sem REGEXP_REPLACE (caso a função não exista)
          const { rows: r4 } = await query(`
            SELECT id, gatilho, telefone, criado_em,
                   COALESCE(canal,'')  AS canal,
                   COALESCE(status,'') AS status,
                   '' AS nome_cliente, '' AS numero_pedido,
                   '' AS origem, '' AS erro_msg,
                   0  AS delay_min, '' AS template_nome
            FROM disparos_log
            WHERE telefone IN ($1, $2, $3, $4)
            ORDER BY criado_em DESC LIMIT 100
          `, [telC, telS, telRaw, tel])
          rows = r4
          console.log('[disparos-cliente] ok4:', rows.length)
        }
      }
    }

    const disparos = rows.map(r => ({
      id:            r.id,
      gatilho:       String(r.gatilho        || ''),
      telefone:      String(r.telefone       || ''),
      numero_pedido: String(r.numero_pedido  || ''),
      nome_cliente:  String(r.nome_cliente   || ''),
      canal:         String(r.canal          || ''),
      status:        String(r.status         || ''),
      erro_msg:      String(r.erro_msg       || ''),
      delay_min:     Number(r.delay_min      || 0),
      origem:        String(r.origem         || ''),
      template_nome: String(r.template_nome  || ''),
      criado_em:     r.criado_em,
    }))

    const enviados      = disparos.filter(d => d.status === 'enviado').length
    const ignorados     = disparos.filter(d => d.status === 'ignorado').length
    const erros         = disparos.filter(d => d.status === 'erro').length
    const nomeCliente   = disparos.find(d => d.nome_cliente)?.nome_cliente || ''
    const pedidosArr    = [...new Set(disparos.map(d => d.numero_pedido).filter(Boolean))]
    const ultimoContato = disparos[0]?.criado_em || null

    console.log('[disparos-cliente] resultado:', { total:disparos.length, pedidos:pedidosArr.length, nome:nomeCliente||'—' })

    res.json({
      disparos,
      resumo: {
        nome:           nomeCliente,
        total:          disparos.length,
        enviados, ignorados, erros,
        pedidos:        pedidosArr,
        telefone:       telC,
        ultimo_contato: ultimoContato,
      }
    })
  } catch (e) {
    console.error('[disparos-cliente] FATAL:', e.message)
    res.status(500).json({
      erro: e.message,
      disparos: [],
      resumo: { nome:'', total:0, enviados:0, erros:0, ignorados:0, pedidos:[], telefone:'', ultimo_contato:null }
    })
  }
})
// ── GET /api/dashboard/debug-tel/:tel — diagnóstico de telefone ──────────────
// REMOVER APÓS DEBUG
router.get('/debug-tel/:tel', async (req, res) => {
  try {
    const telRaw = decodeURIComponent(req.params.tel || '')
    const tel    = telRaw.replace(/\D/g, '')
    const telC   = tel.startsWith('55') ? tel : '55' + tel
    const telS   = tel.startsWith('55') ? tel.slice(2) : tel

    // Busca os 5 primeiros registros de qualquer telefone parecido para ver o formato
    const { rows: amostra } = await query(
      `SELECT id, telefone, status, gatilho, criado_em
       FROM disparos_log
       WHERE telefone LIKE $1 OR telefone LIKE $2 OR telefone LIKE $3
       ORDER BY criado_em DESC LIMIT 5`,
      [`%${tel.slice(-8)}%`, `%${telS.slice(-8)}%`, `%${telC.slice(-8)}%`]
    ).catch(() => ({ rows: [] }))

    // Conta com REGEXP_REPLACE
    const { rows: withRegex } = await query(
      `SELECT COUNT(*) AS total FROM disparos_log
       WHERE REGEXP_REPLACE(telefone::TEXT, '[^0-9]', '', 'g') IN ($1, $2)`,
      [telC, telS]
    ).catch(() => ({ rows: [{total: 'REGEXP_REPLACE não disponível'}] }))

    // Conta sem REGEXP_REPLACE (exato)
    const { rows: semRegex } = await query(
      `SELECT COUNT(*) AS total FROM disparos_log WHERE telefone IN ($1, $2, $3, $4)`,
      [telC, telS, telRaw, tel]
    ).catch(() => ({ rows: [{total:'erro'}] }))

    res.json({
      tel_recebido:   telRaw,
      tel_stripped:   tel,
      tel_com_ddi:    telC,
      tel_sem_ddi:    telS,
      count_regex:    withRegex[0]?.total,
      count_exato:    semRegex[0]?.total,
      amostra_db:     amostra.map(r => ({ id:r.id, tel_db: r.telefone, status:r.status, gatilho:r.gatilho })),
    })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /api/dashboard/insights — insights inteligentes para PageDisparos ──────
router.get('/insights', async (req, res) => {
  try {
    const dias = parseInt(req.query.dias || '14')

    // Gatilhos com alta taxa de ignorados (template inativo)
    const { rows: ignorados } = await query(`
      SELECT
        gatilho,
        COUNT(*)                                          AS total,
        COUNT(*) FILTER (WHERE status='ignorado')         AS ignorados,
        COUNT(*) FILTER (WHERE status='enviado')          AS enviados,
        COUNT(DISTINCT telefone)                          AS clientes,
        MAX(criado_em)                                    AS ultimo
      FROM disparos_log
      WHERE criado_em > NOW() - ($1 || ' days')::INTERVAL
      GROUP BY gatilho
      HAVING COUNT(*) FILTER (WHERE status='ignorado') > 0
      ORDER BY ignorados DESC
      LIMIT 10
    `, [dias])

    const insights = ignorados
      .filter(r => Number(r.ignorados) > 0)
      .map(r => {
        const tot = Number(r.total)
        const ign = Number(r.ignorados)
        const taxa = tot > 0 ? Math.round(ign / tot * 100) : 0
        return {
          id:       `${r.gatilho}_${dias}d`,
          gatilho:  r.gatilho,
          tipo:     taxa > 50 ? 'critico' : 'aviso',
          titulo:   taxa > 50
            ? `Template ${r.gatilho} inativo — clientes sem notificação`
            : `Taxa de ignorados elevada em ${r.gatilho}`,
          desc:     `${ign} disparo${ign !== 1?'s':''} ignorado${ign !== 1?'s':''} nos últimos ${dias} dias. ${r.clientes} clientes afetados.`,
          afetados: Number(r.clientes),
          dias,
          clientes: Number(r.clientes),
        }
      })

    res.json({ ok: true, insights, total: insights.length })
  } catch (e) {
    console.error('[insights]', e.message)
    res.json({ ok: false, insights: [], total: 0 })
  }
})

// ── GET /api/dashboard/foto-perfil// ── GET /api/dashboard/foto-perfil/:tel — foto de perfil WhatsApp ────────────
// Busca URL da foto de perfil do contato salva no banco (se existir)
router.get('/foto-perfil/:tel', async (req, res) => {
  try {
    const tel = req.params.tel.replace(/\D/g,'')
    // Tenta buscar no banco de contexto/sessão
    const { rows } = await query(
      `SELECT contexto->>'fotoPerfil' as foto FROM sessoes WHERE telefone=$1 OR telefone=$2 LIMIT 1`,
      [tel, tel.startsWith('55')?tel.slice(2):'55'+tel]
    ).catch(() => ({ rows: [] }))
    const url = rows[0]?.foto || null
    res.json({ url })
  } catch {
    res.json({ url: null })
  }
})

// ── GET /api/dashboard/webhook-log — histórico de webhooks recebidos ──────────
router.get('/webhook-log', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT event_id, event, pedido_numero, situacao_id, canal, tel, criado_em
       FROM webhook_eventos ORDER BY criado_em DESC LIMIT 50`
    ).catch(() => ({ rows: [] }))
    res.json({ eventos: rows })
  } catch(e) {
    res.json({ eventos: [], erro: e.message })
  }
})


// ── JOB: Polling de rastreio — detecta entrega para Shopee/TikTok ─────────────
// Roda a cada 4 horas. Para canais cujo Bling não atualiza sit=30 automaticamente.
// Consulta rastreio → detecta eventos novos → dispara gatilhos WA

const _PALAVRAS_ENTREGUE  = ['entregue', 'entrega efetuada', 'objeto entregue', 'delivered', 'delivery completed', 'pacote entregue']
const _PALAVRAS_SAIU      = ['saiu para entrega', 'em rota de entrega', 'out for delivery', 'saída para entrega', 'em rota', 'coletado', 'em transporte', 'a caminho']
const _PALAVRAS_TENTATIVA = ['tentativa de entrega', 'ausente', 'destinatário ausente', 'endereço não encontrado', 'recusado']

async function _consultarRastreio(codigo) {
  const axios = require('axios')
  try {
    // ── Melhor Envio API (LGI-*, MEL*, ME*) ──────────────────────────────────
    const isMelhorEnvio = /^(LGI|MEL|ME-|ME\d)/i.test(codigo)
    if (isMelhorEnvio) {
      const meToken = process.env.MELHOR_ENVIO_TOKEN
      if (!meToken) {
        console.log('[RastreioJob] MELHOR_ENVIO_TOKEN não configurado — pulando Melhor Envio')
        return null
      }
      const r = await axios.post(
        'https://melhorenvio.com.br/api/v2/me/shipment/tracking',
        { orders: [codigo] },
        {
          timeout: 10000,
          headers: {
            'Authorization': `Bearer ${meToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'SoStrass/1.0 (suporte@sostrass.com.br)',
          }
        }
      )
      // Resposta: { "LGI-XXXXX": { tracking: [...] } }
      const dados = r.data?.[codigo] || Object.values(r.data||{})[0]
      const eventos = dados?.tracking || dados?.events || []
      if (eventos.length) {
        return eventos.map(e => ({
          data:   e.happened_at || e.created_at || '',
          status: (e.description || e.status || '').toLowerCase(),
          raw:    e.description || e.status || '',
        }))
      }
      return null
    }

    // ── Correios API (AD*BR, AA*BR, etc) ─────────────────────────────────────
    if (/^[A-Z]{2}\d{9}BR$/i.test(codigo)) {
      const r = await axios.get(
        `https://rastreamento.correios.com.br/core/rastreamento.json?numero=${codigo}&cliente=PF&cartaoPostagem=9999999999`,
        { timeout: 8000, headers: { 'User-Agent':'Mozilla/5.0','Accept':'application/json' } }
      )
      const evs = r.data?.objetos?.[0]?.eventos || []
      return evs.map(e => ({
        data:   e.dtHrCriado,
        status: (e.descricao || '').toLowerCase(),
        raw:    e.descricao,
      }))
    }

    // Outros formatos — sem API disponível
    return null
  } catch(e) {
    console.log(`[RastreioJob] Erro ao consultar rastreio ${codigo}: ${e.message?.slice(0,60)}`)
    return null
  }
}

async function _jobPollingRastreio() {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    console.log('[RastreioJob] Iniciando ciclo...')

    // ── FONTE 1: Pedidos que já tiveram pedido_enviado mas ainda não entregues ──
    // Monitora movimentações pós-envio (saiu p/ entrega, entregue, não entregue)
    const { rows: posEnvio } = await query(`
      SELECT DISTINCT dl.numero_pedido, dl.telefone, dl.nome_cliente
      FROM disparos_log dl
      WHERE dl.gatilho = 'pedido_enviado'
        AND dl.status  = 'enviado'
        AND dl.criado_em > NOW() - INTERVAL '30 days'
        AND dl.numero_pedido NOT IN (
          SELECT numero_pedido FROM disparos_log
          WHERE gatilho IN ('pedido_entregue','nao_entregue')
            AND status = 'enviado'
        )
      LIMIT 30
    `).catch(() => ({ rows: [] }))

    // ── FONTE 2: Pedidos com rastreio no Bling que NUNCA tiveram pedido_enviado ──
    // Cobre o gap: rastreio foi adicionado DEPOIS do último webhook chegar
    // Busca pedidos dos últimos 15 dias com sit=9/15/27 que nunca dispararam
    let semDisparo = []
    try {
      const dataLimite = new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0]
      const r = await bling.get(`/pedidos/vendas?dataInicial=${dataLimite}&limite=50&ordem=5`)
      const lista = r.data?.data || []

      // Filtra: tem código de rastreio E nunca disparou pedido_enviado
      for (const p of lista) {
        const cod = p.transporte?.volumes?.[0]?.codigoRastreamento
        const sit = p.situacao?.id
        if (!cod) continue
        if (![9, 15, 27].includes(sit)) continue

        // Verifica idempotência: já disparou pedido_enviado para este pedido?
        const { rows: jaEnviou } = await query(
          `SELECT id FROM disparos_log
           WHERE numero_pedido = $1
             AND gatilho = 'pedido_enviado'
             AND status  = 'enviado'
           LIMIT 1`,
          [String(p.numero)]
        ).catch(() => ({ rows: [] }))

        if (jaEnviou.length) continue // já foi — não envia de novo

        // Busca telefone do contato
        let tel = ''
        if (p.contato?.id) {
          try {
            const rc = await bling.get(`/contatos/${p.contato.id}`)
            const ct = rc.data?.data || {}
            tel = (ct.celular || ct.telefone || '').replace(/\D/g, '')
            if (tel && !tel.startsWith('55')) tel = '55' + tel
          } catch {}
        }

        if (!tel) continue

        semDisparo.push({
          numero_pedido: String(p.numero),
          telefone:      tel,
          nome_cliente:  p.contato?.nome || '',
          codigo:        cod,
          bling_id:      p.id,
        })

        await new Promise(r => setTimeout(r, 800)) // rate limit
      }
    } catch(e) {
      console.log('[RastreioJob] Erro ao buscar pedidos sem disparo:', e.message?.slice(0,60))
    }

    // ── Processa FONTE 2: dispara pedido_enviado para quem ficou sem ──────────
    for (const item of semDisparo) {
      console.log(`[RastreioJob] Pedido #${item.numero_pedido} tem rastreio mas nunca disparou → pedido_enviado`)
      try {
        const RAILWAY = process.env.RAILWAY_URL || 'http://localhost:3000'
        const axios   = require('axios')

        // Busca dados completos para montar a mensagem
        const rDet = await bling.get(`/pedidos/vendas/${item.bling_id}`)
        const ped  = rDet.data?.data || {}
        const transp    = ped.transporte || {}
        const transpNome = transp.contato?.nome || ''
        const cod       = item.codigo
        const link      = /^[A-Z]{2}\d{9}BR$/.test(cod)
          ? `https://rastreamento.correios.com.br/app/index.php?objetos=${cod}`
          : cod.startsWith('MEL')
          ? `https://melhorenvio.com.br/rastreamento/${cod}`
          : `https://melhorrastreio.com.br/rastreio/${cod}`

        await axios.post(`${RAILWAY}/api/templates/disparar-gatilho`, {
          gatilho:  'pedido_enviado',
          telefone: item.telefone,
          variaveis: {
            primeiro_nome:  item.nome_cliente.split(' ')[0] || 'cliente',
            nome_cliente:   item.nome_cliente,
            numero_pedido:  item.numero_pedido,
            transportadora: transpNome,
            codigo_rastreio: cod,
            link_rastreio:  link,
            prazo_entrega:  ped.dataPrevista && ped.dataPrevista !== '0000-00-00'
              ? new Date(ped.dataPrevista).toLocaleDateString('pt-BR') : '',
          }
        }, { timeout: 10000 })

        // Registra — garante idempotência nas próximas rodadas
        await query(
          `INSERT INTO disparos_log(gatilho,telefone,numero_pedido,nome_cliente,canal,status,origem,criado_em)
           VALUES('pedido_enviado',$1,$2,$3,$4,'enviado','rastreio_job',NOW())`,
          [item.telefone, item.numero_pedido, item.nome_cliente, item.canal||'bling']
        ).catch(() => {})

        console.log(`[RastreioJob] ✅ pedido_enviado → #${item.numero_pedido} | ${item.telefone}`)
        await new Promise(r => setTimeout(r, 2000)) // respeita rate limit
      } catch(e) {
        console.log(`[RastreioJob] Erro disparo #${item.numero_pedido}:`, e.message?.slice(0,60))
      }
    }

    // ── Processa FONTE 1: monitora movimentações pós-envio ────────────────────
    const todos = posEnvio
    if (!todos.length && !semDisparo.length) {
      console.log('[RastreioJob] Nenhum pedido pendente — ciclo encerrado')
      return
    }

    console.log(`[RastreioJob] Monitorando ${todos.length} pedidos pós-envio...`)

    for (const row of todos) {
      try {
        // Busca pedido no Bling para pegar código de rastreio atual
        const rList = await bling.get(`/pedidos/vendas?numero=${row.numero_pedido}&limite=1`)
        const p0    = rList.data?.data?.[0]
        if (!p0) continue

        const rDet = await bling.get(`/pedidos/vendas/${p0.id}`)
        const ped  = rDet.data?.data || {}
        const sit  = ped.situacao?.id
        const cod  = ped.transporte?.volumes?.[0]?.codigoRastreamento
        if (!cod) continue

        // Se o Bling já atualizou a situação para entregue/não entregue
        // não precisa consultar rastreio — dispara direto
        let gatilhoDireto = null
        if (sit === 30) gatilhoDireto = 'pedido_entregue'
        if (sit === 33) gatilhoDireto = 'nao_entregue'

        if (gatilhoDireto) {
          // Idempotência: verifica se já disparou
          const { rows: ja } = await query(
            `SELECT id FROM disparos_log WHERE numero_pedido=$1 AND gatilho=$2 AND status='enviado' LIMIT 1`,
            [row.numero_pedido, gatilhoDireto]
          ).catch(() => ({ rows: [] }))
          if (ja.length) continue

          console.log(`[RastreioJob] #${row.numero_pedido} sit=${sit} → ${gatilhoDireto} (via Bling)`)

          const RAILWAY = process.env.RAILWAY_URL || 'http://localhost:3000'
          const axios   = require('axios')
          await axios.post(`${RAILWAY}/api/templates/disparar-gatilho`, {
            gatilho:  gatilhoDireto,
            telefone: row.telefone,
            variaveis: {
              primeiro_nome: row.nome_cliente?.split(' ')[0] || 'cliente',
              nome_cliente:  row.nome_cliente,
              numero_pedido: row.numero_pedido,
              codigo_rastreio: cod,
            }
          }, { timeout: 10000 }).catch(() => {})

          await query(
            `INSERT INTO disparos_log(gatilho,telefone,numero_pedido,nome_cliente,canal,status,origem,criado_em)
             VALUES($1,$2,$3,$4,'rastreio','enviado','rastreio_job',NOW())`,
            [gatilhoDireto, row.telefone, row.numero_pedido, row.nome_cliente]
          ).catch(() => {})

          console.log(`[RastreioJob] ✅ ${gatilhoDireto} → #${row.numero_pedido}`)
          continue
        }

        // Situação ainda em trânsito — consulta rastreio via Bling /logisticas/objetos
        await new Promise(r => setTimeout(r, 1000))
        const idObjeto = ped.transporte?.volumes?.[0]?.id
        if (!idObjeto) continue

        let statusRastreio = null
        try {
          const ro = await bling.get(`/logisticas/objetos/${idObjeto}`)
          const obj = ro.data?.data || {}
          statusRastreio = (obj.situacao?.descricao || obj.situacao || '').toLowerCase()

          // Tenta histórico para status mais detalhado
          try {
            const rh = await bling.get(`/logisticas/objetos/${idObjeto}/historico`)
            const hist = rh.data?.data || []
            if (hist.length > 0) statusRastreio = (hist[0].descricao || hist[0].situacao?.descricao || '').toLowerCase()
          } catch {}
        } catch(e) {
          if (e.response?.status === 429) {
            console.log('[RastreioJob] Rate limit Bling — pausando 10s')
            await new Promise(r => setTimeout(r, 10000))
          }
          continue
        }

        if (!statusRastreio) continue

        // Detecta gatilho pelo status do rastreio
        let gatilhoDetectado = null
        if (_PALAVRAS_ENTREGUE.some(p  => statusRastreio.includes(p)))   gatilhoDetectado = 'pedido_entregue'
        else if (_PALAVRAS_SAIU.some(p => statusRastreio.includes(p)))   gatilhoDetectado = 'saiu_entrega'
        else if (_PALAVRAS_TENTATIVA.some(p => statusRastreio.includes(p))) gatilhoDetectado = 'nao_entregue'

        if (!gatilhoDetectado) continue

        // Idempotência: nunca dispara o mesmo gatilho duas vezes para o mesmo pedido
        const { rows: jaDisp } = await query(
          `SELECT id FROM disparos_log WHERE numero_pedido=$1 AND gatilho=$2 AND status='enviado' LIMIT 1`,
          [row.numero_pedido, gatilhoDetectado]
        ).catch(() => ({ rows: [] }))
        if (jaDisp.length) continue

        console.log(`[RastreioJob] #${row.numero_pedido} → ${gatilhoDetectado} | ${statusRastreio}`)

        const RAILWAY = process.env.RAILWAY_URL || 'http://localhost:3000'
        const axios   = require('axios')
        await axios.post(`${RAILWAY}/api/templates/disparar-gatilho`, {
          gatilho:  gatilhoDetectado,
          telefone: row.telefone,
          variaveis: {
            primeiro_nome:  row.nome_cliente?.split(' ')[0] || 'cliente',
            nome_cliente:   row.nome_cliente,
            numero_pedido:  row.numero_pedido,
            codigo_rastreio: cod,
            status_rastreio: statusRastreio,
          }
        }, { timeout: 10000 }).catch(e => console.log(`[RastreioJob] Erro disparo: ${e.message?.slice(0,50)}`))

        await query(
          `INSERT INTO disparos_log(gatilho,telefone,numero_pedido,nome_cliente,canal,status,origem,criado_em)
           VALUES($1,$2,$3,$4,'rastreio','enviado','rastreio_job',NOW())`,
          [gatilhoDetectado, row.telefone, row.numero_pedido, row.nome_cliente]
        ).catch(() => {})

        console.log(`[RastreioJob] ✅ ${gatilhoDetectado} → #${row.numero_pedido} | ${row.telefone}`)
        await new Promise(r => setTimeout(r, 2000))

      } catch(ePed) {
        console.log(`[RastreioJob] Erro pedido #${row.numero_pedido}:`, ePed.message?.slice(0,60))
      }
    }

    console.log('[RastreioJob] Ciclo concluído')
  } catch(e) {
    console.error('[RastreioJob] Erro geral:', e.message?.slice(0,80))
  }
}


// Inicia o job: roda 5 min após o boot, depois a cada 4 horas
setTimeout(() => {
  console.log('[RastreioJob] Iniciando polling de rastreio...')
  _jobPollingRastreio()
  setInterval(_jobPollingRastreio, 4 * 60 * 60 * 1000)
}, 5 * 60 * 1000)


// ── GET /api/dashboard/debug/disparos-hoje — debug dos disparos do dia ────────
router.get('/debug/disparos-hoje', async (req, res) => {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    // 1. Pedidos enviados hoje no Bling (sit=27)
    const hoje = new Date().toISOString().split('T')[0]
    let pedidosEnviados = []
    try {
      const r = await bling.get(`/pedidos/vendas?dataInicial=${hoje}&limite=50&ordem=5`)
      const lista = r.data?.data || []
      pedidosEnviados = lista.filter(p => p.situacao?.id === 27 || p.situacao?.id === 9)
        .map(p => ({
          numero:   p.numero,
          id_bling: p.id,
          situacao: p.situacao,
          loja_id:  p.loja?.id,
          canal:    ({205946980:'shopee',203414926:'mercadolivre',204884434:'shein',205916963:'tiktokshop',205693668:'nuvemshop',0:'loja'})[p.loja?.id||0] || 'outros',
          rastreio: p.transporte?.volumes?.[0]?.codigoRastreamento || null,
          contato:  p.contato?.nome,
          data:     p.data,
        }))
    } catch(e) {
      pedidosEnviados = [{ erro: e.message }]
    }

    // 2. O que está na disparos_log hoje
    const { rows: disparosHoje } = await query(`
      SELECT gatilho, numero_pedido, telefone, nome_cliente, status, erro_msg, origem, criado_em
      FROM disparos_log
      WHERE criado_em >= NOW() - INTERVAL '24 hours'
      ORDER BY criado_em DESC
      LIMIT 100
    `).catch(() => ({ rows: [] }))

    // 3. Cruzamento: pedidos com rastreio que NÃO tiveram pedido_enviado
    const numerosComDisparo = new Set(
      disparosHoje.filter(d => d.gatilho === 'pedido_enviado').map(d => String(d.numero_pedido))
    )
    const semDisparo = pedidosEnviados.filter(p => 
      p.rastreio && !numerosComDisparo.has(String(p.numero))
    )

    // 4. Webhooks recebidos hoje (se tabela existir)
    const { rows: webhooks } = await query(`
      SELECT event, pedido_id, canal, criado_em
      FROM webhook_eventos
      WHERE criado_em >= NOW() - INTERVAL '24 hours'
      ORDER BY criado_em DESC
      LIMIT 50
    `).catch(() => ({ rows: [] }))

    res.json({
      data_consulta: new Date().toISOString(),
      resumo: {
        pedidos_com_rastreio_no_bling: pedidosEnviados.filter(p => p.rastreio).length,
        pedidos_sem_rastreio:          pedidosEnviados.filter(p => !p.rastreio).length,
        disparos_pedido_enviado_hoje:  disparosHoje.filter(d => d.gatilho === 'pedido_enviado').length,
        pedidos_com_rastreio_sem_disparo: semDisparo.length,
        webhooks_recebidos_hoje:       webhooks.length,
      },
      pedidos_com_rastreio_sem_disparo: semDisparo,
      pedidos_bling_hoje: pedidosEnviados,
      disparos_hoje: disparosHoje,
      webhooks_hoje: webhooks.slice(0, 20),
    })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})


// ── GET /nfe-link/:id — retorna link do DANFE da nota fiscal ────────────────
router.get('/nfe-link/:id', async (req, res) => {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()
    const r = await bling.get(`/nfe/${req.params.id}`)
    const d = r.data?.data || {}
    const _SITS = { 0:'pendente', 2:'autorizada', 3:'cancelada', 4:'denegada', 5:'rejeitada', 6:'autorizada' }
    const sitRaw = d.situacao?.valor ?? d.situacao ?? 0
    const situacao = typeof sitRaw === 'number' ? (_SITS[sitRaw]||'pendente') : String(sitRaw).toLowerCase()
    res.json({
      id:           d.id || req.params.id,
      numero:       d.numero,
      chaveAcesso:  d.chaveAcesso,
      protocolo:    d.numeroProtocolo,
      dataEmissao:  d.dataEmissao,
      situacao,
      linkDanfe:    d.linkDanfe || d.linkPDF || '',
      xml:          d.linkXml || '',
    })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /disparos-pedido/:numero — disparos associados a um pedido ──────────
router.get('/disparos-pedido/:numero', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT gatilho, template_nome, status, criado_em, telefone, nome_cliente
       FROM disparos_log WHERE numero_pedido = $1 ORDER BY criado_em DESC`,
      [req.params.numero]
    )
    res.json({ disparos: rows })
  } catch(e) {
    res.status(500).json({ disparos: [] })
  }
})

// ── GET /stats-geo — estados, cidades e tempo por transportadora ────────────
router.get('/stats-geo', async (req, res) => {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    // Busca pedidos recentes para calcular stats
    const [p1, p2, p3] = await Promise.all([
      bling.get('/pedidos/vendas?limite=100&ordem=5&pagina=1').then(r=>r.data?.data||[]).catch(()=>[]),
      bling.get('/pedidos/vendas?limite=100&ordem=5&pagina=2').then(r=>r.data?.data||[]).catch(()=>[]),
      bling.get('/pedidos/vendas?limite=100&ordem=5&pagina=3').then(r=>r.data?.data||[]).catch(()=>[]),
    ])
    const todos = [...p1,...p2,...p3]

    // Estados e cidades
    const estados = {}, cidades = {}
    const transpTempos = {}, transpContagem = {}

    for (const p of todos) {
      // Busca detalhes para endereço (só primeiros 30 para não estourar rate limit)
      const uf    = p.transporte?.etiqueta?.uf || ''
      const muni  = p.transporte?.etiqueta?.municipio || ''
      if (uf)   estados[uf]   = (estados[uf]  ||0) + parseFloat(p.total||0)
      if (muni) cidades[muni] = (cidades[muni]||0) + parseFloat(p.total||0)

      // Tempo de entrega por transportadora
      const transp = p.transporte?.transportadora?.nome || p.transporte?.contato?.nome || ''
      if (transp && p.data && p.dataSaida) {
        const dias = Math.round((new Date(p.dataSaida)-new Date(p.data))/(1000*60*60*24))
        if (dias >= 0 && dias <= 60) {
          if (!transpTempos[transp]) { transpTempos[transp]=0; transpContagem[transp]=0 }
          transpTempos[transp]   += dias
          transpContagem[transp] += 1
        }
      }
    }

    // Ordena top estados/cidades por faturamento
    const topEstados = Object.entries(estados)
      .sort((a,b)=>b[1]-a[1]).slice(0,10)
      .map(([uf,v])=>({uf, valor:Math.round(v)}))
    const topCidades = Object.entries(cidades)
      .sort((a,b)=>b[1]-a[1]).slice(0,10)
      .map(([cidade,v])=>({cidade, valor:Math.round(v)}))
    const transpStats = Object.entries(transpTempos)
      .map(([nome,total])=>({
        nome,
        tempoMedio: Math.round(total/transpContagem[nome]),
        pedidos:    transpContagem[nome],
      }))
      .sort((a,b)=>a.tempoMedio-b.tempoMedio)

    res.json({ topEstados, topCidades, transpStats, totalPedidos: todos.length })
  } catch(e) {
    console.error('stats-geo:', e.message)
    res.status(500).json({ topEstados:[], topCidades:[], transpStats:[] })
  }
})


// ── GET/POST /notas-internas/:telefone — anotações do agente ────────────────
router.get('/notas-internas/:telefone', async (req, res) => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS notas_internas (
        id         SERIAL PRIMARY KEY,
        telefone   VARCHAR(20) NOT NULL,
        conteudo   TEXT NOT NULL,
        agente     VARCHAR(100) DEFAULT 'atendente',
        criado_em  TIMESTAMPTZ DEFAULT NOW(),
        editado_em TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch(()=>{})
    const { rows } = await query(
      `SELECT * FROM notas_internas WHERE telefone=$1 ORDER BY criado_em DESC LIMIT 20`,
      [req.params.telefone]
    )
    res.json({ notas: rows })
  } catch(e) { res.status(500).json({ notas: [] }) }
})

router.post('/notas-internas/:telefone', async (req, res) => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS notas_internas (
        id SERIAL PRIMARY KEY, telefone VARCHAR(20),
        conteudo TEXT, agente VARCHAR(100) DEFAULT 'atendente',
        criado_em TIMESTAMPTZ DEFAULT NOW(), editado_em TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch(()=>{})
    const { conteudo, agente } = req.body
    const { rows } = await query(
      `INSERT INTO notas_internas(telefone,conteudo,agente) VALUES($1,$2,$3) RETURNING *`,
      [req.params.telefone, conteudo, agente||'atendente']
    )
    res.json({ nota: rows[0] })
  } catch(e) { res.status(500).json({ erro: e.message }) }
})

router.delete('/notas-internas/:telefone/:id', async (req, res) => {
  try {
    await query(`DELETE FROM notas_internas WHERE id=$1 AND telefone=$2`, [req.params.id, req.params.telefone])
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ erro: e.message }) }
})

// ── GET /busca-conversas — busca no conteúdo das mensagens ──────────────────
router.get('/busca-conversas', async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.length < 2) return res.json({ resultados: [] })
    const { rows } = await query(`
      SELECT DISTINCT ON (m.telefone)
        m.telefone, c.nome,
        m.conteudo AS mensagem_match,
        m.direcao, m.criado_em
      FROM mensagens m
      LEFT JOIN contatos c ON c.telefone = m.telefone
      WHERE m.conteudo ILIKE $1
        AND m.criado_em > NOW() - INTERVAL '30 days'
      ORDER BY m.telefone, m.criado_em DESC
      LIMIT 30
    `, [`%${q}%`])
    res.json({ resultados: rows })
  } catch(e) { res.status(500).json({ resultados: [] }) }
})

// ── GET /ia-custo/:telefone — custo de IA desta sessão ──────────────────────
router.get('/ia-custo/:telefone', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        COUNT(*)                    AS chamadas,
        COALESCE(SUM(tokens_in+tokens_out),0) AS tokens,
        COALESCE(SUM(custo_usd),0)  AS custo_usd
      FROM ia_uso_log
      WHERE telefone=$1
        AND criado_em > NOW() - INTERVAL '24h'
    `, [req.params.telefone])
    const d = rows[0] || {}
    res.json({
      chamadas:  parseInt(d.chamadas||0),
      tokens:    parseInt(d.tokens||0),
      custo_usd: parseFloat(d.custo_usd||0).toFixed(4),
      custo_brl: (parseFloat(d.custo_usd||0)*5.2).toFixed(2),
    })
  } catch(e) { res.status(500).json({ chamadas:0, tokens:0, custo_usd:'0.0000', custo_brl:'0.00' }) }
})


// ── GET /disparos-log — log paginado com filtros ────────────────────────────
router.get('/disparos-log', async (req, res) => {
  try {
    const { periodo='7d', gatilho, status, busca, pagina=1, limite=50 } = req.query
    const dias = {'1d':1,'7d':7,'30d':30,'90d':90}[periodo]||7
    const pg   = Math.max(1, parseInt(pagina))
    const lim  = Math.min(100, parseInt(limite))
    const off  = (pg-1)*lim

    let where = `WHERE criado_em > NOW() - INTERVAL '${dias} days'`
    const params = []

    if (gatilho && gatilho!=='todos') {
      params.push(gatilho); where += ` AND gatilho=$${params.length}`
    }
    if (status && status!=='todos') {
      params.push(status); where += ` AND status=$${params.length}`
    }
    if (busca) {
      params.push(`%${busca}%`)
      where += ` AND (nome_cliente ILIKE $${params.length} OR telefone ILIKE $${params.length} OR numero_pedido ILIKE $${params.length})`
    }
    if (req.query.canal && req.query.canal !== 'todos') {
      // 'loja' e 'bling' são equivalentes (loja própria)
      if (req.query.canal === 'loja') {
        params.push('loja'); const p1 = params.length
        params.push('bling'); const p2 = params.length
        where += ` AND (canal=$${p1} OR canal=$${p2})`
      } else {
        params.push(req.query.canal); where += ` AND canal=$${params.length}`
      }
    }

    const [rows, count] = await Promise.all([
      query(`SELECT id,gatilho,telefone,numero_pedido,nome_cliente,template_nome,
             status,erro_msg,delay_min,origem,criado_em
             FROM disparos_log ${where}
             ORDER BY criado_em DESC
             LIMIT ${lim} OFFSET ${off}`, params),
      query(`SELECT COUNT(*) as total FROM disparos_log ${where}`, params),
    ])

    res.json({
      disparos: rows.rows,
      total: parseInt(count.rows[0]?.total||0),
      pagina: pg,
      paginas: Math.ceil(parseInt(count.rows[0]?.total||0)/lim),
    })
  } catch(e) { res.status(500).json({ disparos:[], total:0 }) }
})

// ── POST /disparos-reenviar/:id — reenvio manual ────────────────────────────
router.post('/disparos-reenviar/:id', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM disparos_log WHERE id=$1 LIMIT 1`,
      [req.params.id]
    )
    const d = rows[0]
    if (!d) return res.status(404).json({ erro: 'Disparo não encontrado' })

    const axios   = require('axios')
    const RAILWAY = process.env.RAILWAY_URL||'http://localhost:3000'

    const r = await axios.post(`${RAILWAY}/api/templates/disparar-gatilho`,{
      gatilho:  d.gatilho,
      telefone: d.telefone,
      variaveis:{ numero_pedido: d.numero_pedido, nome_cliente: d.nome_cliente }
    },{ timeout:15000 })

    await query(
      `INSERT INTO disparos_log(gatilho,telefone,numero_pedido,nome_cliente,canal,template_nome,status,origem,criado_em)
       VALUES($1,$2,$3,$4,$5,$6,'enviado','manual_reenvio',NOW())`,
      [d.gatilho, d.telefone, d.numero_pedido, d.nome_cliente, d.canal||'bling', d.template_nome]
    ).catch(()=>{})

    res.json({ ok:true, template: r.data?.template })
  } catch(e) { res.status(500).json({ erro: e.message }) }
})

async function _buscarObjetoLogistico(numeroPedido, codigoRastreio) {
  try {
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    // ESTRATÉGIA 1: busca direta pelo código de rastreio (mais precisa)
    // GET /logisticas/objetos?codigoObjeto=AD495491904BR
    if (codigoRastreio) {
      try {
        const rObj = await bling.get(`/logisticas/objetos?codigoObjeto=${encodeURIComponent(codigoRastreio)}&limite=5`)
        const objetos = rObj.data?.data||[]
        if (objetos.length) {
          const obj = objetos[0]
          console.log(`[RastreioJob] Objeto logístico por código ${codigoRastreio}: id=${obj.id}`)
          return { id: obj.id, codigo: codigoRastreio }
        }
      } catch(e1) {
        console.log(`[RastreioJob] /logisticas/objetos?codigoObjeto=${codigoRastreio}: ${e1.message?.slice(0,50)}`)
      }
    }

    // ESTRATÉGIA 2: busca pelo número do pedido via /logisticas/envios
    // GET /logisticas/envios?pedidoVendaNumero=229436
    if (numeroPedido) {
      try {
        const rEnv = await bling.get(`/logisticas/envios?pedidoVendaNumero=${numeroPedido}&limite=5`)
        const envios = rEnv.data?.data||[]
        if (envios.length) {
          const envio = envios[0]
          const codEnvio = envio.codigoObjeto||envio.codigo||''
          console.log(`[RastreioJob] Envio #${numeroPedido}: id=${envio.id} cod=${codEnvio}`)

          // Se tem código no envio, busca o objeto logístico pelo código
          if (codEnvio) {
            try {
              const rObj2 = await bling.get(`/logisticas/objetos?codigoObjeto=${encodeURIComponent(codEnvio)}&limite=5`)
              const obj2 = rObj2.data?.data?.[0]
              if (obj2?.id) {
                console.log(`[RastreioJob] Objeto logístico via envio: id=${obj2.id}`)
                return { id: obj2.id, codigo: codEnvio }
              }
            } catch {}
          }

          // Retorna o id do envio mesmo sem objeto — pode funcionar como fallback
          return { id: envio.id, codigo: codEnvio }
        }
      } catch(e2) {
        console.log(`[RastreioJob] /logisticas/envios #${numeroPedido}: ${e2.message?.slice(0,50)}`)
      }
    }

  } catch(e) {
    console.log(`[RastreioJob] buscarObjetoLogistico: ${e.message?.slice(0,60)}`)
  }
  return null
}


// ── POST /forcar-rastreio/:numero — diagnóstico de rastreio ─────────────────
// Acessível em: POST /api/dashboard/forcar-rastreio/:numero
// ── GET /forcar-rastreio/:numero — força verificação imediata de um pedido ────
router.post('/forcar-rastreio/:numero', async (req, res) => {
  try {
    const numero = req.params.numero
    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()
    const fmtTelLocal = t => { const n=(t||'').replace(/\D/g,'').replace(/^55/,''); if(n.length===11)return '55'+n; return t||'' }

    // Busca pedido
    const rList = await bling.get(`/pedidos/vendas?numero=${numero}&limite=1`)
    const p0 = rList.data?.data?.[0]
    if (!p0) return res.status(404).json({ erro: `Pedido #${numero} não encontrado` })

    const rDet = await bling.get(`/pedidos/vendas/${p0.id}`)
    const ped  = rDet.data?.data||{}
    const cod  = ped.transporte?.volumes?.[0]?.codigoRastreamento
    const idObj= ped.transporte?.volumes?.[0]?.id

    // Tenta buscar o telefone do cliente
    let tel = ''
    if (ped.contato?.id) {
      try {
        const rc = await bling.get(`/contatos/${ped.contato.id}`)
        const ct = rc.data?.data||{}
        tel = fmtTelLocal(ct.celular||ct.telefone||ct.celulares?.[0]?.numero||'')
      } catch {}
    }

    const info = {
      numero, bling_id: p0.id, situacao: ped.situacao?.id,
      codigoRastreio: cod||'(sem código)', idObjeto: idObj||'(sem objeto)',
      telefone: tel||'(sem telefone)',
    }

    if (!cod && !idObj) {
      // Tenta via /logisticas/envios
      try {
        const rEnvios = await bling.get(`/logisticas/envios?pedidoVendaNumero=${numero}&limite=5`)
        const envio = rEnvios.data?.data?.[0]
        if (envio) {
          info.codigoRastreio = envio.codigoObjeto||envio.codigo||'(vazio)'
          info.idObjeto = envio.id||'(sem id)'
          info.fonteLogisticaEnvios = true
        }
      } catch(e) {
        info.erroLogisticaEnvios = e.message?.slice(0,80)
      }
    }

    // Consulta rastreio
    const codParaConsultar = info.codigoRastreio !== '(sem código)' ? info.codigoRastreio : null
    let eventos = null
    if (codParaConsultar) {
      eventos = await _consultarRastreioTransp(codParaConsultar)
      if (!eventos?.length && idObj) eventos = await _consultarRastreioViaBlling(idObj)
    }

    info.eventos = eventos||[]
    info.qtdEventos = info.eventos.length

    // Registra no rastreio_cache para o job pegar na próxima rodada
    if (tel && cod) {
      await query(
        `INSERT INTO disparos_log(gatilho,telefone,numero_pedido,nome_cliente,canal,status,origem,criado_em)
         SELECT 'pedido_enviado',$1,$2,$3,'rastreio','enviado','forcar_rastreio',NOW()
         WHERE NOT EXISTS(SELECT 1 FROM disparos_log WHERE numero_pedido=$2 AND gatilho='pedido_enviado' AND status='enviado')`,
        [tel, numero, ped.contato?.nome||'']
      ).catch(()=>{})
      info.registradoParaMonitoramento = true
    }

    res.json({ ok: true, info })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})



// ══════════════════════════════════════════════════════════════════════════════
// /api/operacao — Configuração de canais de rastreio + manutenção da fila
// ══════════════════════════════════════════════════════════════════════════════

// Canais disponíveis com metadados
const CANAIS_DEF = [
  { id:'loja',          nome:'Loja Própria',    desc:'Pedidos da loja virtual própria. Rastreio via Bling + transportadora.', mktp:false },
  { id:'nuvemshop',     nome:'Nuvemshop',       desc:'Pedidos via Nuvemshop. Rastreio via Bling + transportadora.',           mktp:false },
  { id:'mercadolivre',  nome:'Mercado Livre',   desc:'Marketplace. Rastreio interno do ML. Desativar economiza chamadas.',    mktp:true  },
  { id:'shopee',        nome:'Shopee',           desc:'Marketplace. Rastreio interno Shopee. Sem telefone do cliente.',        mktp:true  },
  { id:'shein',         nome:'Shein',            desc:'Marketplace. Rastreio gerenciado pela Shein.',                          mktp:true  },
  { id:'tiktokshop',   nome:'TikTok Shop',      desc:'Marketplace. Sem contato direto com cliente.',                         mktp:true  },
]

// Lê config de canais da ia_config (padrão: loja + nuvemshop ativos, marketplaces inativos)
async function lerCanaisConfig() {
  const res = await query(`SELECT chave, valor FROM ia_config WHERE chave LIKE 'rastreio_canal_%'`).catch(()=>({rows:[]}))
  const map = {}
  res.rows.forEach(r => { map[r.chave.replace('rastreio_canal_','')] = r.valor === 'true' })
  return map
}

// GET /api/operacao/canais
router.get('/operacao/canais', async (req, res) => {
  try {
    const config = await lerCanaisConfig()

    // Conta pedidos na fila por canal (monitorados mas sem desfecho)
    const { rows: filaRows } = await query(`
      SELECT dl.canal, COUNT(DISTINCT dl.numero_pedido) AS na_fila
      FROM disparos_log dl
      WHERE dl.gatilho = 'pedido_enviado'
        AND dl.status  = 'enviado'
        AND dl.criado_em > NOW() - INTERVAL '60 days'
        AND dl.numero_pedido NOT IN (
          SELECT numero_pedido FROM disparos_log
          WHERE gatilho IN ('pedido_entregue','nao_entregue')
            AND status IN ('enviado','ignorado')
        )
      GROUP BY dl.canal
    `).catch(()=>({rows:[]}))
    const filaMap = {}
    filaRows.forEach(r => { filaMap[r.canal||'loja'] = parseInt(r.na_fila||0) })

    // Último rastreio bem-sucedido por canal
    const { rows: ultRows } = await query(`
      SELECT dl.canal, MAX(dl.criado_em) AS ultimo
      FROM disparos_log dl
      WHERE dl.gatilho IN ('rastreio_em_transito','saiu_entrega','pedido_entregue','pedido_coletado')
        AND dl.status = 'enviado'
        AND dl.criado_em > NOW() - INTERVAL '30 days'
      GROUP BY dl.canal
    `).catch(()=>({rows:[]}))
    const ultMap = {}
    ultRows.forEach(r => { ultMap[r.canal||'loja'] = r.ultimo })

    const canais = CANAIS_DEF.map(c => ({
      ...c,
      ativo:    c.id in config ? config[c.id] : !c.mktp,  // default: marketplaces off
      naFila:   filaMap[c.id] || 0,
      ultimoRastreio: ultMap[c.id] || null,
    }))

    res.json({ canais })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})

// POST /api/operacao/canais — salva configuração
router.post('/operacao/canais', async (req, res) => {
  try {
    const { canais } = req.body  // { loja: true, shopee: false, ... }
    for (const [id, ativo] of Object.entries(canais||{})) {
      await query(`
        INSERT INTO ia_config(chave,valor,atualizado_em) VALUES($1,$2,NOW())
        ON CONFLICT(chave) DO UPDATE SET valor=$2, atualizado_em=NOW()
      `, [`rastreio_canal_${id}`, String(ativo)])
    }
    res.json({ ok:true, salvos: Object.keys(canais||{}).length })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})

// GET /api/operacao/limpar-desativados — preview
router.get('/operacao/limpar-desativados', async (req, res) => {
  try {
    const config = await lerCanaisConfig()
    const desativos = CANAIS_DEF.filter(c => !(c.id in config ? config[c.id] : !c.mktp)).map(c=>c.id)
    if (!desativos.length) return res.json({ seriam_encerrados:0 })
    const ph = desativos.map((_,i)=>`$${i+1}`).join(',')
    const { rows } = await query(`
      SELECT COUNT(DISTINCT dl.numero_pedido) AS total
      FROM disparos_log dl
      WHERE dl.canal IN (${ph})
        AND dl.gatilho = 'pedido_enviado' AND dl.status = 'enviado'
        AND dl.numero_pedido NOT IN (
          SELECT numero_pedido FROM disparos_log
          WHERE gatilho IN ('pedido_entregue','nao_entregue') AND status IN ('enviado','ignorado')
        )
    `, desativos)
    res.json({ seriam_encerrados: parseInt(rows[0]?.total||0), canais_desativados: desativos })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// POST /api/operacao/limpar-desativados — executa
router.post('/operacao/limpar-desativados', async (req, res) => {
  try {
    const config = await lerCanaisConfig()
    const desativos = CANAIS_DEF.filter(c => !(c.id in config ? config[c.id] : !c.mktp)).map(c=>c.id)
    if (!desativos.length) return res.json({ encerrados:0 })
    const ph = desativos.map((_,i)=>`$${i+1}`).join(',')
    const { rows } = await query(`
      SELECT DISTINCT dl.numero_pedido, dl.telefone, dl.nome_cliente, dl.canal
      FROM disparos_log dl
      WHERE dl.canal IN (${ph})
        AND dl.gatilho = 'pedido_enviado' AND dl.status = 'enviado'
        AND dl.numero_pedido NOT IN (
          SELECT numero_pedido FROM disparos_log
          WHERE gatilho IN ('pedido_entregue','nao_entregue') AND status IN ('enviado','ignorado')
        )
      LIMIT 500
    `, desativos)
    let enc = 0
    for (const r of rows) {
      await query(`
        INSERT INTO disparos_log(gatilho,telefone,numero_pedido,nome_cliente,canal,status,erro_msg,origem,criado_em)
        VALUES('nao_entregue',$1,$2,$3,$4,'ignorado','encerrado_canal_desativado','operacao',NOW())
      `, [r.telefone||'',r.numero_pedido,r.nome_cliente||'',r.canal||'']).catch(()=>{})
      enc++
    }
    res.json({ encerrados: enc })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// GET /api/operacao/limpar-sem-codigo — preview
router.get('/operacao/limpar-sem-codigo', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT COUNT(*) AS total FROM rastreio_cache
      WHERE codigo IS NULL OR codigo='' OR LENGTH(codigo)<5
    `)
    res.json({ seriam_encerrados: parseInt(rows[0]?.total||0) })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// POST /api/operacao/limpar-sem-codigo
router.post('/operacao/limpar-sem-codigo', async (req, res) => {
  try {
    const { rowCount } = await query(`
      DELETE FROM rastreio_cache WHERE codigo IS NULL OR codigo='' OR LENGTH(codigo)<5
    `)
    res.json({ encerrados: rowCount||0 })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// GET /api/operacao/limpar-marketplace — preview
router.get('/operacao/limpar-marketplace', async (req, res) => {
  try {
    const mkts = CANAIS_DEF.filter(c=>c.mktp).map(c=>c.id)
    const ph = mkts.map((_,i)=>`$${i+1}`).join(',')
    const { rows } = await query(`
      SELECT COUNT(DISTINCT dl.numero_pedido) AS total
      FROM disparos_log dl
      WHERE dl.canal IN (${ph})
        AND dl.gatilho = 'pedido_enviado' AND dl.status = 'enviado'
        AND dl.numero_pedido NOT IN (
          SELECT numero_pedido FROM disparos_log
          WHERE gatilho IN ('pedido_entregue','nao_entregue') AND status IN ('enviado','ignorado')
        )
    `, mkts)
    res.json({ seriam_encerrados: parseInt(rows[0]?.total||0) })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// POST /api/operacao/limpar-marketplace
router.post('/operacao/limpar-marketplace', async (req, res) => {
  try {
    const mkts = CANAIS_DEF.filter(c=>c.mktp).map(c=>c.id)
    const ph = mkts.map((_,i)=>`$${i+1}`).join(',')
    const { rows } = await query(`
      SELECT DISTINCT dl.numero_pedido, dl.telefone, dl.nome_cliente, dl.canal
      FROM disparos_log dl
      WHERE dl.canal IN (${ph})
        AND dl.gatilho = 'pedido_enviado' AND dl.status = 'enviado'
        AND dl.numero_pedido NOT IN (
          SELECT numero_pedido FROM disparos_log
          WHERE gatilho IN ('pedido_entregue','nao_entregue') AND status IN ('enviado','ignorado')
        )
      LIMIT 500
    `, mkts)
    let enc = 0
    for (const r of rows) {
      await query(`
        INSERT INTO disparos_log(gatilho,telefone,numero_pedido,nome_cliente,canal,status,erro_msg,origem,criado_em)
        VALUES('nao_entregue',$1,$2,$3,$4,'ignorado','encerrado_marketplace','operacao',NOW())
      `, [r.telefone||'',r.numero_pedido,r.nome_cliente||'',r.canal||'']).catch(()=>{})
      enc++
    }
    res.json({ encerrados: enc })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})


// ══════════════════════════════════════════════════════════════════════════════
// GET /api/dashboard/monitoramento — 10 métricas de monitoramento em paralelo
// ══════════════════════════════════════════════════════════════════════════════
router.get('/monitoramento', async (req, res) => {
  try {
    const CUSTO_POR_MSG = 0.0085  // US$ por mensagem Meta

    // Executar todas as queries em paralelo para máxima performance
    const [
      coberturaR, perdidosR, comparativoR, horarioR,
      funilMetaR, custoMesR, respostaR, anomaliaR, transportadoraR,
      healthR,
    ] = await Promise.all([

      // ── 2. COBERTURA: pedidos com/sem disparo nos últimos 30 dias ────────────
      query(`
        WITH pedidos_rastreados AS (
          SELECT DISTINCT numero_pedido FROM rastreio_cache
          WHERE atualizado_em > NOW() - INTERVAL '30 days'
            AND numero_pedido IS NOT NULL AND numero_pedido != ''
        ),
        pedidos_com_disparo AS (
          SELECT DISTINCT numero_pedido FROM disparos_log
          WHERE status='enviado'
            AND criado_em > NOW() - INTERVAL '30 days'
            AND numero_pedido IS NOT NULL AND numero_pedido != ''
        ),
        pedidos_ignorados AS (
          SELECT DISTINCT numero_pedido FROM disparos_log
          WHERE status='ignorado'
            AND criado_em > NOW() - INTERVAL '30 days'
            AND numero_pedido IS NOT NULL AND numero_pedido != ''
        )
        SELECT
          (SELECT COUNT(*) FROM pedidos_rastreados)           AS total_rastreados,
          (SELECT COUNT(*) FROM pedidos_com_disparo)          AS com_disparo,
          (SELECT COUNT(*) FROM pedidos_ignorados
           WHERE numero_pedido NOT IN (SELECT numero_pedido FROM pedidos_com_disparo)) AS so_ignorados,
          (SELECT COUNT(*) FROM pedidos_rastreados
           WHERE numero_pedido NOT IN (SELECT numero_pedido FROM pedidos_com_disparo)
             AND numero_pedido NOT IN (SELECT numero_pedido FROM pedidos_ignorados)) AS sem_nenhum
      `).catch(()=>({rows:[{}]})),

      // ── 3. VOLUME PERDIDO: gatilhos inativos com alto volume ─────────────────
      query(`
        SELECT
          dl.gatilho,
          COUNT(*) AS total_ignorados,
          COUNT(DISTINCT dl.numero_pedido) AS pedidos_afetados,
          MAX(dl.criado_em) AS ultimo_ignorado
        FROM disparos_log dl
        WHERE dl.status = 'ignorado'
          AND dl.erro_msg ILIKE '%inativo%'
          AND dl.criado_em > NOW() - INTERVAL '7 days'
        GROUP BY dl.gatilho
        ORDER BY total_ignorados DESC
        LIMIT 8
      `).catch(()=>({rows:[]})),

      // ── 4. COMPARATIVO: esta semana vs semana passada ────────────────────────
      query(`
        SELECT
          CASE WHEN criado_em >= NOW() - INTERVAL '7 days' THEN 'atual' ELSE 'anterior' END AS semana,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status='enviado')  AS enviados,
          COUNT(*) FILTER (WHERE status='ignorado') AS ignorados,
          COUNT(*) FILTER (WHERE status='erro')     AS erros
        FROM disparos_log
        WHERE criado_em >= NOW() - INTERVAL '14 days'
        GROUP BY semana
      `).catch(()=>({rows:[]})),

      // ── 5. HORÁRIO ÓTIMO: distribuição de disparos por hora ─────────────────
      query(`
        SELECT
          EXTRACT(HOUR FROM criado_em)::int  AS hora,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status='enviado')  AS enviados,
          COUNT(*) FILTER (WHERE status='ignorado') AS ignorados
        FROM disparos_log
        WHERE criado_em > NOW() - INTERVAL '30 days'
        GROUP BY hora
        ORDER BY hora
      `).catch(()=>({rows:[]})),

      // ── 6. FUNIL META: status dos templates ─────────────────────────────────
      query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE ativo = true) AS ativos,
          COUNT(*) FILTER (WHERE ativo = false) AS inativos,
          COUNT(*) FILTER (WHERE meta_status = 'APPROVED') AS aprovados,
          COUNT(*) FILTER (WHERE meta_status = 'PENDING')  AS em_analise,
          COUNT(*) FILTER (WHERE meta_status = 'REJECTED') AS rejeitados,
          COUNT(*) FILTER (WHERE meta_status IS NULL OR meta_status = '') AS sem_status
        FROM templates_hsm
      `).catch(()=>({rows:[{total:0,ativos:0,inativos:0,aprovados:0,em_analise:0,rejeitados:0,sem_status:0}]})),

      // ── 7. CUSTO DO MÊS: enviados desde dia 1 do mês atual ──────────────────
      query(`
        SELECT
          COUNT(*) FILTER (WHERE status='enviado') AS enviados_mes,
          COUNT(*) FILTER (WHERE status='enviado'
            AND criado_em >= NOW() - INTERVAL '7 days') AS enviados_7d,
          MIN(criado_em) FILTER (WHERE
            DATE_TRUNC('month',criado_em) = DATE_TRUNC('month',NOW())) AS primeiro_do_mes
        FROM disparos_log
        WHERE criado_em >= DATE_TRUNC('month', NOW()) - INTERVAL '1 day'
      `).catch(()=>({rows:[{enviados_mes:0,enviados_7d:0}]})),

      // ── 8. TAXA DE RESPOSTA: mensagens inbound por gatilho disparado ─────────
      query(`
        SELECT
          dl.gatilho,
          COUNT(DISTINCT dl.telefone) AS clientes_notificados,
          COUNT(DISTINCT m.telefone)  AS clientes_responderam,
          ROUND(
            COUNT(DISTINCT m.telefone)::numeric /
            NULLIF(COUNT(DISTINCT dl.telefone),0) * 100
          , 1) AS taxa_resposta
        FROM disparos_log dl
        LEFT JOIN mensagens m ON m.telefone = dl.telefone
          AND m.direcao = 'entrada'
          AND m.criado_em BETWEEN dl.criado_em AND dl.criado_em + INTERVAL '24 hours'
        WHERE dl.status = 'enviado'
          AND dl.criado_em > NOW() - INTERVAL '30 days'
        GROUP BY dl.gatilho
        HAVING COUNT(DISTINCT dl.telefone) >= 3
        ORDER BY taxa_resposta DESC NULLS LAST
        LIMIT 10
      `).catch(()=>({rows:[]})),

      // ── 9. ANOMALIAS: gatilhos com queda > 50% nas últimas 4h ───────────────
      query(`
        WITH ultima_4h AS (
          SELECT gatilho, COUNT(*) AS n
          FROM disparos_log
          WHERE criado_em >= NOW() - INTERVAL '4 hours'
          GROUP BY gatilho
        ),
        media_4h AS (
          SELECT
            gatilho,
            AVG(cnt) AS media_por_periodo
          FROM (
            SELECT
              gatilho,
              COUNT(*) AS cnt,
              DATE_TRUNC('hour', criado_em) AS hora
            FROM disparos_log
            WHERE criado_em BETWEEN NOW() - INTERVAL '10 days' AND NOW() - INTERVAL '4 hours'
            GROUP BY gatilho, hora
          ) sub
          GROUP BY gatilho
        )
        SELECT
          m.gatilho,
          COALESCE(u.n, 0)  AS volume_4h,
          ROUND(m.media_por_periodo * 4, 1) AS esperado_4h,
          ROUND(
            (COALESCE(u.n,0) - m.media_por_periodo*4) /
            NULLIF(m.media_por_periodo*4, 0) * 100
          , 0) AS variacao_pct
        FROM media_4h m
        LEFT JOIN ultima_4h u ON u.gatilho = m.gatilho
        WHERE m.media_por_periodo >= 1
          AND ABS(COALESCE(u.n,0) - m.media_por_periodo*4) >= 3
          AND ABS(
            (COALESCE(u.n,0) - m.media_por_periodo*4) /
            NULLIF(m.media_por_periodo*4, 0) * 100
          ) >= 40
        ORDER BY variacao_pct ASC
        LIMIT 5
      `).catch(()=>({rows:[]})),

      // ── 10. TRANSPORTADORAS: tempo médio de entrega por código ───────────────
      query(`
        SELECT
          CASE
            WHEN rc.codigo ILIKE 'LGI%'   THEN 'Loggi'
            WHEN rc.codigo ILIKE 'JD%'    THEN 'Jadlog'
            WHEN rc.codigo ~ '^[0-9]{13,}$' THEN 'J&T Express'
            WHEN rc.codigo ILIKE 'BR%'    THEN 'Correios'
            WHEN rc.codigo ILIKE 'SL%'    THEN 'Total Express'
            ELSE 'Outros'
          END AS transportadora,
          COUNT(DISTINCT rc.numero_pedido) AS pedidos,
          ROUND(AVG(
            EXTRACT(EPOCH FROM (
              dl_ent.criado_em - dl_env.criado_em
            )) / 86400
          )::numeric, 1) AS dias_medio,
          MIN(EXTRACT(EPOCH FROM (dl_ent.criado_em - dl_env.criado_em)) / 86400)::int AS dias_min,
          MAX(EXTRACT(EPOCH FROM (dl_ent.criado_em - dl_env.criado_em)) / 86400)::int AS dias_max
        FROM rastreio_cache rc
        JOIN disparos_log dl_env ON dl_env.numero_pedido = rc.numero_pedido
          AND dl_env.gatilho = 'pedido_enviado' AND dl_env.status = 'enviado'
        JOIN disparos_log dl_ent ON dl_ent.numero_pedido = rc.numero_pedido
          AND dl_ent.gatilho = 'pedido_entregue' AND dl_ent.status = 'enviado'
        WHERE rc.atualizado_em > NOW() - INTERVAL '60 days'
          AND dl_ent.criado_em > dl_env.criado_em
        GROUP BY transportadora
        HAVING COUNT(DISTINCT rc.numero_pedido) >= 2
        ORDER BY pedidos DESC
        LIMIT 6
      `).catch(()=>({rows:[]})),

      // ── 1. HEALTH SCORE: inferido da qualidade dos últimos 7 dias ────────────
      query(`
        SELECT
          COUNT(*) AS total_7d,
          COUNT(*) FILTER (WHERE status='enviado')  AS enviados_7d,
          COUNT(*) FILTER (WHERE status='erro')     AS erros_7d,
          COUNT(*) FILTER (WHERE status='ignorado') AS ignorados_7d,
          COUNT(DISTINCT telefone) FILTER (WHERE status='enviado') AS clientes_alcancados,
          MAX(criado_em) AS ultimo_disparo
        FROM disparos_log
        WHERE criado_em > NOW() - INTERVAL '7 days'
      `).catch(()=>({rows:[{total_7d:0,enviados_7d:0,erros_7d:0}]})),
    ])

    // ── Processar cobertura ──────────────────────────────────────────────────
    const cob = coberturaR.rows[0] || {}
    const totalRastreados = parseInt(cob.total_rastreados||0)
    const comDisparo      = parseInt(cob.com_disparo||0)
    const soIgnorados     = parseInt(cob.so_ignorados||0)
    const semNenhum       = parseInt(cob.sem_nenhum||0)
    const coberturaRate   = totalRastreados>0 ? Math.round(comDisparo/totalRastreados*100) : null

    // ── Processar comparativo ────────────────────────────────────────────────
    const compMap = {}
    comparativoR.rows.forEach(r => { compMap[r.semana] = r })
    const compAtual    = compMap['atual']    || {total:0,enviados:0,ignorados:0,erros:0}
    const compAnterior = compMap['anterior'] || {total:0,enviados:0,ignorados:0,erros:0}
    const deltaTotal   = parseInt(compAnterior.total)>0
      ? Math.round((parseInt(compAtual.total)-parseInt(compAnterior.total))/parseInt(compAnterior.total)*100) : null
    const taxaAtual    = parseInt(compAtual.total)>0
      ? Math.round(parseInt(compAtual.enviados)/parseInt(compAtual.total)*100) : null
    const taxaAnterior = parseInt(compAnterior.total)>0
      ? Math.round(parseInt(compAnterior.enviados)/parseInt(compAnterior.total)*100) : null

    // ── Processar horário ────────────────────────────────────────────────────
    const horarioMap = {}
    horarioR.rows.forEach(r => { horarioMap[parseInt(r.hora)] = r })
    const horasArray = Array.from({length:24},(_,h)=>({
      hora: h,
      total:    parseInt(horarioMap[h]?.total||0),
      enviados: parseInt(horarioMap[h]?.enviados||0),
    }))
    const picoHora = horasArray.reduce((best,h)=>h.total>best.total?h:best,{hora:null,total:0}).hora

    // ── Processar custo do mês ───────────────────────────────────────────────
    const custoR     = custoMesR.rows[0] || {}
    const enviadosMes= parseInt(custoR.enviados_mes||0)
    const custoMes   = (enviadosMes * CUSTO_POR_MSG).toFixed(2)
    // Projeção: baseado nos dias decorridos do mês
    const diaDoMes   = new Date().getDate()
    const diasNoMes  = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate()
    const projecao   = diaDoMes > 0 ? ((enviadosMes / diaDoMes) * diasNoMes * CUSTO_POR_MSG).toFixed(2) : null

    // ── Health Score (inferido) ──────────────────────────────────────────────
    const h7        = healthR.rows[0] || {}
    const total7    = parseInt(h7.total_7d||0)
    const env7      = parseInt(h7.enviados_7d||0)
    const err7      = parseInt(h7.erros_7d||0)
    const taxa7     = total7>0 ? Math.round(env7/total7*100) : null
    const errRate   = total7>0 ? Math.round(err7/total7*100) : 0
    const healthScore = taxa7 === null ? null
      : errRate >= 15 ? Math.max(20, taxa7 - 20)
      : taxa7 >= 90   ? Math.min(100, taxa7 + 5)
      : taxa7
    const healthLabel = healthScore === null ? 'Sem dados'
      : healthScore >= 85 ? 'Excelente'
      : healthScore >= 60 ? 'Bom'
      : healthScore >= 40 ? 'Médio'
      : 'Baixo — risco de suspensão'

    res.json({
      // 1. Health Score
      health: {
        score: healthScore,
        label: healthLabel,
        taxa7,
        errRate,
        total7,
        env7,
        ultimoDisparo: h7.ultimo_disparo,
        clientesAlcancados: parseInt(h7.clientes_alcancados||0),
      },
      // 2. Cobertura
      cobertura: {
        totalRastreados, comDisparo, soIgnorados, semNenhum,
        coberturaRate,
      },
      // 3. Volume perdido por inativos
      perdidos: perdidosR.rows.map(r=>({
        gatilho:         r.gatilho,
        totalIgnorados:  parseInt(r.total_ignorados),
        pedidosAfetados: parseInt(r.pedidos_afetados),
        ultimoIgnorado:  r.ultimo_ignorado,
      })),
      // 4. Comparativo semanas
      comparativo: {
        atual:    { total:parseInt(compAtual.total),   enviados:parseInt(compAtual.enviados),   taxa:taxaAtual },
        anterior: { total:parseInt(compAnterior.total),enviados:parseInt(compAnterior.enviados),taxa:taxaAnterior },
        deltaTotal, deltaTaxa: taxaAtual!==null&&taxaAnterior!==null ? taxaAtual-taxaAnterior : null,
      },
      // 5. Horário ótimo
      horario: { horas: horasArray, picoHora },
      // 6. Funil Meta
      funilMeta: funilMetaR.rows[0] || {},
      // 7. Custo do mês
      custo: {
        enviadosMes, custoMes, projecao, diaDoMes, diasNoMes,
        enviados7d: parseInt(custoR.enviados_7d||0),
      },
      // 8. Taxa de resposta
      taxaResposta: respostaR.rows.map(r=>({
        gatilho:             r.gatilho,
        clientesNotificados: parseInt(r.clientes_notificados),
        clientesResponderam: parseInt(r.clientes_responderam),
        taxaResposta:        parseFloat(r.taxa_resposta||0),
      })),
      // 9. Anomalias
      anomalias: anomaliaR.rows.map(r=>({
        gatilho:     r.gatilho,
        volume4h:    parseInt(r.volume_4h),
        esperado4h:  parseFloat(r.esperado_4h),
        variacaoPct: parseInt(r.variacao_pct),
        tipo:        parseInt(r.variacao_pct) < 0 ? 'queda' : 'pico',
      })),
      // 10. Transportadoras
      transportadoras: transportadoraR.rows.map(r=>({
        transportadora: r.transportadora,
        pedidos:        parseInt(r.pedidos),
        diasMedio:      parseFloat(r.dias_medio),
        diasMin:        parseInt(r.dias_min),
        diasMax:        parseInt(r.dias_max),
      })),
    })
  } catch (e) {
    console.error('[monitoramento]', e.message)
    res.status(500).json({ erro: e.message })
  }
})


// ══════════════════════════════════════════════════════════════════════════════
// CENTRAL DE CONFIGURAÇÃO — schedules, blacklist, SLA, auditoria, exportação
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /api/dashboard/config/schedules — lê schedules de todos os gatilhos ──
router.get('/config/schedules', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT chave, valor FROM ia_config WHERE chave LIKE 'schedule_%'`
    ).catch(()=>({rows:[]}))
    const schedules = {}
    rows.forEach(r => {
      const id = r.chave.replace('schedule_','')
      try { schedules[id] = JSON.parse(r.valor) } catch {}
    })
    res.json({ schedules })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// ── POST /api/dashboard/config/schedules — salva schedule de um gatilho ──────
router.post('/config/schedules', async (req, res) => {
  try {
    const { gatilho, schedule } = req.body
    if (!gatilho) return res.status(400).json({ erro:'gatilho obrigatório' })
    await query(`
      INSERT INTO ia_config(chave,valor,atualizado_em) VALUES($1,$2,NOW())
      ON CONFLICT(chave) DO UPDATE SET valor=$2,atualizado_em=NOW()
    `, [`schedule_${gatilho}`, JSON.stringify(schedule)])

    // Auditoria
    await query(`
      INSERT INTO ia_config(chave,valor,atualizado_em)
      VALUES($1,$2,NOW())
      ON CONFLICT(chave) DO UPDATE SET valor=$2,atualizado_em=NOW()
    `, [`audit_schedule_${gatilho}_last`, JSON.stringify({
      ts: new Date().toISOString(), schedule,
    })]).catch(()=>{})

    res.json({ ok:true })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// ── GET /api/dashboard/config/blacklist ───────────────────────────────────────
router.get('/config/blacklist', async (req, res) => {
  try {
    const r = await query(`SELECT valor FROM ia_config WHERE chave='blacklist_phones'`)
      .catch(()=>({rows:[]}))
    const phones = r.rows[0] ? JSON.parse(r.rows[0].valor||'[]') : []
    const rk = await query(`SELECT valor FROM ia_config WHERE chave='blacklist_keywords'`)
      .catch(()=>({rows:[]}))
    const keywords = rk.rows[0] ? JSON.parse(rk.rows[0].valor||'[]') : []
    res.json({ phones, keywords })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// ── POST /api/dashboard/config/blacklist ─────────────────────────────────────
router.post('/config/blacklist', async (req, res) => {
  try {
    const { phones, keywords } = req.body
    if (phones !== undefined) {
      await query(`INSERT INTO ia_config(chave,valor,atualizado_em) VALUES('blacklist_phones',$1,NOW())
        ON CONFLICT(chave) DO UPDATE SET valor=$1,atualizado_em=NOW()`, [JSON.stringify(phones)])
    }
    if (keywords !== undefined) {
      await query(`INSERT INTO ia_config(chave,valor,atualizado_em) VALUES('blacklist_keywords',$1,NOW())
        ON CONFLICT(chave) DO UPDATE SET valor=$1,atualizado_em=NOW()`, [JSON.stringify(keywords)])
    }
    res.json({ ok:true })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// ── GET /api/dashboard/config/sla ────────────────────────────────────────────
router.get('/config/sla', async (req, res) => {
  try {
    const r = await query(`SELECT valor FROM ia_config WHERE chave='sla_config'`)
      .catch(()=>({rows:[]}))
    const cfg = r.rows[0] ? JSON.parse(r.rows[0].valor||'{}') : {
      horario_inicio: 8, horario_fim: 22,
      dias: [1,2,3,4,5,6],
      sla_primeira_resposta_min: 5,
      sla_resolucao_h: 24,
      fora_horario_msg: 'Olá! Nosso atendimento funciona das 8h às 22h. Retornaremos em breve!',
    }
    res.json({ sla: cfg })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// ── POST /api/dashboard/config/sla ───────────────────────────────────────────
router.post('/config/sla', async (req, res) => {
  try {
    const { sla } = req.body
    await query(`INSERT INTO ia_config(chave,valor,atualizado_em) VALUES('sla_config',$1,NOW())
      ON CONFLICT(chave) DO UPDATE SET valor=$1,atualizado_em=NOW()`, [JSON.stringify(sla)])
    res.json({ ok:true })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// ── GET /api/dashboard/config/audit — últimas 100 alterações de config ────────
router.get('/config/audit', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT chave, valor, atualizado_em
      FROM ia_config
      WHERE chave LIKE 'audit_%'
      ORDER BY atualizado_em DESC
      LIMIT 100
    `).catch(()=>({rows:[]}))

    // Também pega mudanças em disparos_log (ativações/desativações)
    const { rows: tpl } = await query(`
      SELECT nome, ativo, atualizado_em, gatilho,
             CASE WHEN ativo THEN 'template_ativado' ELSE 'template_desativado' END AS tipo
      FROM templates_hsm
      WHERE atualizado_em > NOW() - INTERVAL '30 days'
      ORDER BY atualizado_em DESC
      LIMIT 50
    `).catch(()=>({rows:[]}))

    res.json({
      config_changes: rows.map(r=>({
        chave: r.chave.replace('audit_',''),
        dados: (() => { try { return JSON.parse(r.valor) } catch { return {} } })(),
        ts:    r.atualizado_em,
      })),
      template_changes: tpl,
    })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// ── GET /api/dashboard/config/export — exporta disparos em CSV/JSON ───────────
router.get('/config/export', async (req, res) => {
  try {
    const { from, to, formato='json', gatilho } = req.query
    const dataFrom = from || new Date(Date.now()-30*86400000).toISOString().split('T')[0]
    const dataTo   = to   || new Date().toISOString().split('T')[0]

    const params = [dataFrom, dataTo]
    let gatWhere = ''
    if (gatilho) { params.push(gatilho); gatWhere = `AND gatilho=$${params.length}` }

    const { rows } = await query(`
      SELECT id, gatilho, telefone, nome_cliente, canal, status,
             erro_msg, origem, numero_pedido, template_nome,
             criado_em
      FROM disparos_log
      WHERE criado_em >= $1::date AND criado_em < ($2::date + INTERVAL '1 day')
        ${gatWhere}
      ORDER BY criado_em DESC
      LIMIT 5000
    `, params)

    if (formato === 'csv') {
      const header = 'id,gatilho,telefone,nome_cliente,canal,status,erro_msg,origem,numero_pedido,template_nome,criado_em\n'
      const linhas = rows.map(r =>
        [r.id,r.gatilho,r.telefone,`"${(r.nome_cliente||'').replace(/"/g,'""')}"`,
         r.canal,r.status,`"${(r.erro_msg||'').replace(/"/g,'""')}"`,
         r.origem,r.numero_pedido,r.template_nome,r.criado_em].join(',')
      ).join('\n')
      res.setHeader('Content-Type','text/csv')
      res.setHeader('Content-Disposition',`attachment; filename=disparos_${dataFrom}_${dataTo}.csv`)
      res.send(header + linhas)
    } else {
      res.json({ total:rows.length, periodo:{ from:dataFrom, to:dataTo }, disparos:rows })
    }
  } catch(e) { res.status(500).json({ erro:e.message }) }
})


// ── GET /api/dashboard/custos — breakdown de custo por gatilho ───────────────
router.get('/custos', async (req, res) => {
  try {
    const { periodo = '30d' } = req.query
    const dias = { '7d':7, '30d':30, '90d':90 }[periodo] || 30
    const CUSTO_MSG = 0.0085

    const { rows } = await query(`
      SELECT
        gatilho,
        COUNT(*) FILTER (WHERE status='enviado') AS enviados,
        COUNT(*) AS total
      FROM disparos_log
      WHERE criado_em > NOW() - INTERVAL '${dias} days'
      GROUP BY gatilho
      ORDER BY enviados DESC
    `).catch(()=>({rows:[]}))

    const totalEnviados = rows.reduce((a,r)=>a+parseInt(r.enviados||0),0)
    const totalCusto    = (totalEnviados * CUSTO_MSG).toFixed(2)
    const porGatilho    = {}
    rows.forEach(r=>{
      const env = parseInt(r.enviados||0)
      porGatilho[r.gatilho] = {
        enviados: env,
        total:    parseInt(r.total||0),
        custo:    (env * CUSTO_MSG).toFixed(3),
      }
    })

    res.json({ totalEnviados, totalCusto, porGatilho, periodo })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// ── GET /api/dashboard/gatilhos-indicadores — taxa de entrega por gatilho ────
router.get('/gatilhos-indicadores', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        gatilho,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status='enviado')  AS enviados,
        COUNT(*) FILTER (WHERE status='ignorado') AS ignorados,
        COUNT(*) FILTER (WHERE status='erro')     AS erros,
        MAX(criado_em)                             AS ultimo
      FROM disparos_log
      WHERE criado_em > NOW() - INTERVAL '7 days'
      GROUP BY gatilho
    `).catch(()=>({rows:[]}))

    const indicadores = {}
    rows.forEach(r=>{
      indicadores[r.gatilho] = {
        total:    parseInt(r.total||0),
        enviados: parseInt(r.enviados||0),
        ignorados:parseInt(r.ignorados||0),
        erros:    parseInt(r.erros||0),
        ultimo:   r.ultimo,
      }
    })

    res.json({ indicadores })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// ── POST /api/dashboard/disparos-reenviar/manual — reenvio manual ─────────────
router.post('/disparos-reenviar/manual', async (req, res) => {
  try {
    const { gatilho, telefone, numero_pedido, variaveis={} } = req.body
    if (!gatilho || !telefone)
      return res.status(400).json({ erro:'gatilho e telefone obrigatórios' })

    const RAILWAY = process.env.RAILWAY_URL || 'http://localhost:3000'
    const axios   = require('axios')

    const r = await axios.post(`${RAILWAY}/api/templates/disparar-gatilho`, {
      gatilho, telefone, variaveis,
    }, { timeout:10000 })

    if (r.data?.ok) {
      await query(`
        INSERT INTO disparos_log(gatilho,telefone,numero_pedido,status,origem,criado_em)
        VALUES($1,$2,$3,'enviado','manual_painel',NOW())
      `, [gatilho, telefone, numero_pedido||'']).catch(()=>{})
      res.json({ ok:true, template:r.data.template })
    } else {
      res.json({ ok:false, motivo:r.data?.motivo||'Erro desconhecido' })
    }
  } catch(e) {
    res.status(500).json({ ok:false, erro:e.message?.slice(0,120) })
  }
})


// ── POST /avise-me — registra notificação de produto disponível ──────────────
router.post('/avise-me', async (req, res) => {
  try {
    const { telefone, produto_id, nome_produto, codigo } = req.body
    if (!telefone || !produto_id) return res.status(400).json({ erro:'telefone e produto_id obrigatórios' })
    const chave = `avise_me_${produto_id}`
    const r = await query(`SELECT valor FROM ia_config WHERE chave=$1`,[chave]).catch(()=>({rows:[]}))
    const lista = r.rows[0] ? JSON.parse(r.rows[0].valor||'[]') : []
    const jaExiste = lista.some(e=>e.telefone===telefone)
    if (!jaExiste) {
      lista.push({ telefone, nome_produto, codigo, registrado_em:new Date().toISOString() })
      await query(`INSERT INTO ia_config(chave,valor,atualizado_em) VALUES($1,$2,NOW())
        ON CONFLICT(chave) DO UPDATE SET valor=$2,atualizado_em=NOW()`, [chave, JSON.stringify(lista)])
    }
    res.json({ ok:true, jaExiste })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// ── GET /avise-me/:produto_id — lista quem quer ser avisado ──────────────────
router.get('/avise-me/:produto_id', async (req, res) => {
  try {
    const r = await query(`SELECT valor FROM ia_config WHERE chave=$1`,
      [`avise_me_${req.params.produto_id}`]).catch(()=>({rows:[]}))
    res.json({ lista: r.rows[0] ? JSON.parse(r.rows[0].valor||'[]') : [] })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

// ── POST /mp-link-pagamento — gera link de pagamento Mercado Pago ─────────────
router.post('/mp-link-pagamento', async (req, res) => {
  try {
    const { telefone, numero_pedido, valor, descricao, email_pagador } = req.body
    if (!valor) return res.status(400).json({ erro:'valor obrigatório' })

    const r = await query(`SELECT valor FROM ia_config WHERE chave='mp_access_token'`).catch(()=>({rows:[]}))
    const token = r.rows[0]?.valor
    if (!token) return res.status(500).json({ erro:'MP não configurado' })

    const axios = require('axios')
    const body = {
      items: [{ id:numero_pedido||'pedido', title:descricao||`Pedido #${numero_pedido}`,
        quantity:1, currency_id:'BRL', unit_price:parseFloat(valor) }],
      payer: email_pagador ? { email:email_pagador } : undefined,
      external_reference: String(numero_pedido||telefone),
      notification_url: `${process.env.RAILWAY_URL||''}/bling/mp-webhook`,
    }

    const resp = await axios.post('https://api.mercadopago.com/checkout/preferences', body,
      { headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, timeout:8000 })

    res.json({
      ok:true,
      init_point: resp.data.init_point,
      sandbox_init_point: resp.data.sandbox_init_point,
      preference_id: resp.data.id,
    })
  } catch(e) {
    console.error('MP link erro:', e.response?.data || e.message)
    res.status(500).json({ erro: e.response?.data?.message||e.message })
  }
})

// ── GET /pix-key — retorna a chave PIX da loja ───────────────────────────────
router.get('/pix-key', async (req, res) => {
  try {
    const r = await query(`SELECT valor FROM ia_config WHERE chave='pix_key'`).catch(()=>({rows:[]}))
    const k = await query(`SELECT valor FROM ia_config WHERE chave='pix_nome'`).catch(()=>({rows:[]}))
    res.json({ chave: r.rows[0]?.valor||'', nome: k.rows[0]?.valor||'Só Strass' })
  } catch(e) { res.status(500).json({ erro:e.message }) }
})

module.exports = router
