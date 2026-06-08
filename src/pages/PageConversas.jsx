/**
 * contatos.js — Bia v6
 *
 * GET  /                    → lista contatos com paginação
 * GET  /:telefone           → perfil completo do contato
 * GET  /:telefone/pedidos   → pedidos do cliente no Bling
 * PATCH /:telefone          → atualiza nome/tags do contato
 * GET  /:telefone/status    → status de atendimento
 */

'use strict'

const express   = require('express')
const router    = express.Router()
const { query } = require('../utils/db')

// Enriquece pedidos com rastreio do cache local — não consulta o Bling (protege rate limit)
async function _rastreioCache(pedidos, campo) {
  campo = campo || 'rastreio'
  if (!pedidos?.length) return pedidos
  const nums = pedidos.map(p => String(p.numero)).filter(Boolean)
  if (!nums.length) return pedidos
  try {
    const { rows } = await query(
      `SELECT numero_pedido, codigo FROM rastreio_cache WHERE numero_pedido = ANY($1)`, [nums]
    )
    const mapa = {}
    for (const r of rows) mapa[r.numero_pedido] = r.codigo
    for (const p of pedidos) {
      const cod = mapa[String(p.numero)]
      if (cod && (!p[campo] || p[campo] === '—' || p[campo] === null)) p[campo] = cod
    }
  } catch(e) { console.log('[contatos] rastreio cache:', e.message?.slice(0,40)) }
  return pedidos
}


// Garante coluna cpf_cnpj na tabela contatos
;(async () => {
  try {
    await query(`ALTER TABLE contatos ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(20)`)
    await query(`ALTER TABLE contatos ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT NOW()`)
  } catch {}
})()

// ── GET / — lista contatos ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || '50'), 200)
    const offset = parseInt(req.query.offset || '0')
    const busca  = req.query.q?.trim() || ''

    let sql = `
      SELECT
        c.telefone, c.nome, c.criado_em, c.atualizado_em,
        COALESCE(ast.status, 'pendente') AS status,
        COUNT(m.id)                       AS total_msgs,
        MAX(m.criado_em)                  AS ultima_atividade
      FROM contatos c
      LEFT JOIN atendimento_status ast ON ast.telefone = c.telefone
      LEFT JOIN mensagens m            ON m.telefone   = c.telefone
    `
    const params = []
    if (busca) {
      params.push(`%${busca}%`)
      sql += ` WHERE c.nome ILIKE $${params.length} OR c.telefone ILIKE $${params.length}`
    }
    sql += ` GROUP BY c.telefone, c.nome, c.criado_em, c.atualizado_em, ast.status`
    sql += ` ORDER BY MAX(m.criado_em) DESC NULLS LAST`
    params.push(limit, offset)
    sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`

    const r = await query(sql, params)
    res.json({ contatos: r.rows, total: r.rows.length })
  } catch (e) {
    console.error('GET /contatos erro:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /:telefone — perfil completo ─────────────────────────────────────────
router.get('/:telefone', async (req, res) => {
  try {
    const { telefone } = req.params

    const [contato, status, sessao, msgs] = await Promise.all([
      query(`SELECT * FROM contatos WHERE telefone = $1`, [telefone]),

      query(`SELECT status, updated_at FROM atendimento_status WHERE telefone = $1`, [telefone])
        .catch(() => ({ rows: [] })),

      // Carrinho ativo e modo (ia-core v6)
      query(`SELECT contexto FROM sessoes_ia WHERE telefone = $1`, [telefone])
        .catch(() => ({ rows: [] })),

      query(`
        SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE direcao = 'entrada') AS recebidas,
               COUNT(*) FILTER (WHERE direcao = 'saida')   AS enviadas,
               MAX(criado_em)                               AS ultima
        FROM mensagens WHERE telefone = $1
      `, [telefone]),
    ])

    if (!contato.rows.length) {
      return res.status(404).json({ erro: 'Contato não encontrado' })
    }

    const ctx = sessao.rows[0]?.contexto || {}

    res.json({
      ...contato.rows[0],
      status:           status.rows[0]?.status || 'pendente',
      status_updated:   status.rows[0]?.updated_at || null,
      mensagens:        msgs.rows[0],
      carrinho:         ctx.carrinho || [],
      modo:             ctx.modo || 'ia',
    })
  } catch (e) {
    console.error('GET /contatos/:tel erro:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /:telefone/pedidos — pedidos no Bling (completo) ──────────────────────
router.get('/:telefone/pedidos', async (req, res) => {
  try {
    const { telefone } = req.params

    // Busca CPF do contato para consultar no Bling
    const r = await query(`SELECT cpf_cnpj, nome, email FROM contatos WHERE telefone = $1`, [telefone])
    const cpfCnpj = r.rows[0]?.cpf_cnpj

    if (!cpfCnpj) {
      return res.json({ pedidos: [], aviso: 'CPF/CNPJ não cadastrado para este contato' })
    }

    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    // Busca lista de pedidos
    const resp = await bling.get(`/pedidos/vendas?cpfCnpj=${cpfCnpj.replace(/\D/g,'')}&limite=10`)
    const lista = (resp.data?.data || []).sort((a, b) => new Date(b.data) - new Date(a.data))

    // Busca detalhes completos de cada pedido (até 10, em paralelo)
    const detalhes = await Promise.allSettled(
      lista.map(p => bling.get(`/pedidos/vendas/${p.id}`))
    )

    const pedidos = lista.map((p, i) => {
      const det = detalhes[i].status === 'fulfilled' ? detalhes[i].value.data?.data : null

      // Dados de rastreio
      const vol     = det?.transporte?.volumes?.[0] || {}
      const rastreio = vol.codigoRastreamento || det?.transporte?.codigoRastreamento || null
      const transp   = det?.transporte?.transportadora?.nome || det?.transporte?.nome || null

      // NF-e
      const nfe     = det?.nota || null
      const nfe_link   = nfe?.linkDanfe || nfe?.chave ? `https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&tipoConteudo=7PhJ+gAVw2g=&nfe_id=${nfe.chave}` : null

      // Endereço
      const end = det?.transporte?.enderecoEntrega || det?.cliente?.endereco || {}
      const endereco = end.endereco
        ? `${end.endereco}${end.numero ? ', ' + end.numero : ''}${end.complemento ? ' - ' + end.complemento : ''} - ${end.bairro} - ${end.municipio}/${end.uf} - CEP ${end.cep}`
        : null

      // Itens com imagem do catálogo
      const itens = (det?.itens || []).map(it => ({
        nome:      it.descricao || it.codigo,
        codigo:    it.codigo,
        qtd:       it.quantidade || 1,
        preco:     (it.valor || 0).toFixed(2).replace('.', ','),
        imagem:    it.produto?.imagemURL || it.imagemURL || null,
        produto_id: it.produto?.id,
      }))

      return {
        id:             p.id,
        numero:         p.numero,
        numero_loja:    det?.numeroPedidoLoja || null,
        data:           p.data ? new Date(p.data).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—',
        situacao:       p.situacao?.valor || '—',
        situacao_id:    p.situacao?.id || null,
        total:          `R$ ${parseFloat(p.totalVenda || det?.totalVenda || 0).toFixed(2).replace('.', ',')}`,
        forma_pagamento: det?.parcelas?.[0]?.formaPagamento?.descricao || null,
        status_pagamento: det?.situacaoPagamento?.valor || (p.situacao?.id === 15 ? 'Pago' : null),

        // Cliente
        cliente:        det?.contato?.nome || p.contato?.nome || r.rows[0]?.nome || null,
        email:          det?.contato?.email || r.rows[0]?.email || null,
        endereco,

        // Rastreio
        rastreio,
        transportadora: transp,
        data_postagem:  vol.dataEnvio  ? new Date(vol.dataEnvio).toLocaleDateString('pt-BR')  : null,
        data_entrega:   vol.dataChegada? new Date(vol.dataChegada).toLocaleDateString('pt-BR') : null,
        ultimo_status:  vol.situacao   || null,

        // NF-e
        nfe_link,
        nfe_numero:     nfe?.numero || null,

        // Produtos
        itens,
      }
    })

    // Busca imagens do catálogo para produtos que não têm imagem direta
    const semImagem = pedidos.flatMap(p => p.itens.filter(it => !it.imagem && it.produto_id).map(it => it.produto_id))
    if (semImagem.length > 0) {
      try {
        const cats = await query(
          `SELECT bling_id, imagem_url FROM catalogo_produtos WHERE bling_id = ANY($1) AND imagem_url IS NOT NULL`,
          [semImagem]
        )
        const imgMap = {}
        cats.rows.forEach(c => { imgMap[c.bling_id] = c.imagem_url })
        pedidos.forEach(p => {
          p.itens.forEach(it => {
            if (!it.imagem && it.produto_id && imgMap[it.produto_id]) {
              it.imagem = imgMap[it.produto_id]
            }
          })
        })
      } catch {}
    }

    res.json({ pedidos })
  } catch (e) {
    console.error('GET /contatos/:tel/pedidos erro:', e.message)
    res.json({ pedidos: [], erro: e.message })
  }
})

// ── PATCH /:telefone — atualiza contato ──────────────────────────────────────
router.patch('/:telefone', async (req, res) => {
  try {
    const { telefone }     = req.params
    const { nome, status, cpf_cnpj } = req.body

    // Atualiza dados do contato
    if (nome !== undefined || cpf_cnpj !== undefined) {
      const campos = []
      const vals   = []
      if (nome !== undefined)     { campos.push(`nome=$${campos.length+1}`);     vals.push(nome) }
      if (cpf_cnpj !== undefined) { campos.push(`cpf_cnpj=$${campos.length+1}`); vals.push(cpf_cnpj) }
      campos.push(`atualizado_em=NOW()`)
      vals.push(telefone)

      await query(
        `UPDATE contatos SET ${campos.join(', ')} WHERE telefone=$${vals.length}`,
        vals
      )
    }

    // Atualiza status de atendimento
    if (status !== undefined) {
      const statusValidos = ['pendente', 'em_andamento', 'resolvido', 'encerrado']
      if (!statusValidos.includes(status)) {
        return res.status(400).json({ erro: `Status inválido. Use: ${statusValidos.join(', ')}` })
      }
      await query(`
        INSERT INTO atendimento_status(telefone, status, updated_at)
        VALUES($1, $2, NOW())
        ON CONFLICT(telefone) DO UPDATE SET status=$2, updated_at=NOW()
      `, [telefone, status])
      console.log(`✅ Status: ${telefone} → ${status}`)
    }

    res.json({ ok: true, telefone })
  } catch (e) {
    console.error('PATCH /contatos/:tel erro:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /:telefone/status ─────────────────────────────────────────────────────
router.get('/:telefone/status', async (req, res) => {
  try {
    const r = await query(
      `SELECT status, updated_at FROM atendimento_status WHERE telefone=$1`,
      [req.params.telefone]
    ).catch(() => ({ rows: [] }))
    res.json({ status: r.rows[0]?.status || 'pendente', updated_at: r.rows[0]?.updated_at || null })
  } catch (e) {
    res.status(500).json({ erro: e.message })
  }
})

module.exports = router
