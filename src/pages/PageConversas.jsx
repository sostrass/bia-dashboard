const express = require('express')
const router  = express.Router()
const { query } = require('../utils/db')
const { getBlingClient } = require('../utils/blingClient')

const SITUACOES = {
  6:{label:'Em aberto',status:'open'}, 9:{label:'Atendido',status:'closed'},
  12:{label:'Cancelado',status:'cancelled'}, 15:{label:'Em andamento',status:'progress'},
  18:{label:'Verificado',status:'verified'}, 24:{label:'NFe emitida',status:'invoiced'},
  27:{label:'Enviado',status:'shipped'}, 30:{label:'Entregue',status:'closed'},
  33:{label:'Não entregue',status:'failed'}, 36:{label:'Devolvido',status:'refunded'},
}

function parseSit(s) {
  if (!s && s !== 0) return { label:'Desconhecido', status:'open' }
  const id = typeof s === 'object' ? (s.id||s.valor||0) : parseInt(s)||0
  return SITUACOES[id] || { label: String(id), status:'open' }
}

function parsePedidoDetalhe(p) {
  const sit = parseSit(p.situacao)

  // Forma de pagamento — está em parcelas[0].observacoes ou formaPagamento
  const parcela = p.parcelas?.[0]
  let formaPag = '—'
  if (parcela?.observacoes) {
    // "Método de pagamento: pix" → extrai só "Pix"
    const match = parcela.observacoes.match(/pagamento[:\s]+(.+)/i)
    formaPag = match
      ? match[1].trim().replace(/\b\w/g, l => l.toUpperCase())
      : parcela.observacoes
  }

  // Transportadora — em transporte.contato.nome
  const transp = p.transporte?.contato?.nome
    || p.transporte?.transportadora?.nome
    || p.transporte?.nome
    || '—'

  // Rastreio — em transporte.volumes[0].codigoRastreamento
  const rastreio = p.transporte?.volumes?.[0]?.codigoRastreamento
    || p.transporte?.codigoRastreamento
    || '—'

  // Prazo
  const prazo = p.transporte?.prazoEntrega
    ? `${p.transporte.prazoEntrega} dias`
    : '—'

  // Frete
  const frete = p.transporte?.frete
    ? `R$ ${parseFloat(p.transporte.frete).toFixed(2)}`
    : '—'

  // Itens
  const itens = p.itens || []

  return {
    id:             p.id,
    numero:         p.numero,
    numero_loja:    p.numeroLoja || '—',
    status:         sit.status,
    status_label:   sit.label,
    total:          parseFloat(p.total || p.totalProdutos || 0).toFixed(2),
    total_produtos: parseFloat(p.totalProdutos || 0).toFixed(2),
    frete,
    data:           p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '—',
    data_saida:     p.dataSaida && p.dataSaida !== '0000-00-00'
                      ? new Date(p.dataSaida).toLocaleDateString('pt-BR')
                      : '—',
    forma_pagamento: formaPag,
    transportadora:  transp,
    rastreio,
    prazo,
    itens:          itens.length ? `${itens.length} produto(s)` : '—',
    cliente_nome:   p.contato?.nome || '—',
    cliente_doc:    p.contato?.numeroDocumento || '—',
    endereco_entrega: p.transporte?.etiqueta
      ? [
          p.transporte.etiqueta.endereco,
          p.transporte.etiqueta.numero,
          p.transporte.etiqueta.bairro,
          p.transporte.etiqueta.municipio,
          p.transporte.etiqueta.uf,
        ].filter(Boolean).join(', ')
      : '—',
    produtos: itens.map(i => ({
      nome:  i.descricao || '—',
      qtd:   i.quantidade || 1,
      preco: parseFloat(i.valor || 0).toFixed(2),
      sku:   i.codigo || '—',
    })),
  }
}

router.get('/', async (req, res) => {
  try {
    const r = await query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM mensagens WHERE telefone=c.telefone) as total_msgs,
        (SELECT MAX(criado_em) FROM mensagens WHERE telefone=c.telefone) as ultima_msg
      FROM contatos c ORDER BY ultima_msg DESC NULLS LAST, c.criado_em DESC LIMIT 500
    `)
    res.json({ contatos: r.rows, total: r.rows.length })
  } catch (e) { res.status(500).json({ erro: e.message, contatos: [] }) }
})

router.get('/:telefone', async (req, res) => {
  try {
    const r = await query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM mensagens WHERE telefone=c.telefone) as total_msgs,
        (SELECT MAX(criado_em) FROM mensagens WHERE telefone=c.telefone) as ultima_msg
      FROM contatos c WHERE c.telefone=$1
    `, [req.params.telefone])
    if (!r.rows.length) return res.status(404).json({ erro: 'Não encontrado' })
    res.json(r.rows[0])
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

router.get('/:telefone/pedidos', async (req, res) => {
  try {
    const st = await query("SELECT valor FROM ia_config WHERE chave='bling_access_token'")
    if (!st.rows[0]?.valor) {
      return res.json({ pedidos:[], aviso:'Bling não autenticado' })
    }

    const bling = await getBlingClient()

    // Busca contato no banco local
    const rc = await query('SELECT * FROM contatos WHERE telefone=$1', [req.params.telefone])
    const contato = rc.rows[0]
    let cpf  = (contato?.cpf  || '').replace(/\D/g, '')
    let nome = (contato?.nome || '').trim()

    // Se não tem CPF local, busca o contato no Bling pelo telefone
    if (!cpf) {
      try {
        const telLimpo = req.params.telefone.replace(/\D/g, '')
        // Variações: com DDI (5511999...), sem DDI (11999...), só número (999...)
        const semDDI  = telLimpo.replace(/^55/, '')       // 11999999999
        const semDDD  = semDDI.replace(/^\d{2}/, '')      // 999999999
        const tels = [semDDI, semDDD, telLimpo]           // tenta as 3 variações

        for (const tel of tels) {
          const rc2 = await bling.get('/contatos', {
            params: { telefone: tel, limite: 5 }
          })
          const contatosBling = rc2.data?.data || []
          if (contatosBling.length > 0) {
            const cb = contatosBling[0]
            cpf  = (cb.numeroDocumento || cb.cpfCnpj || '').replace(/\D/g, '')
            nome = nome || cb.nome || ''
            // Salva CPF no banco para próximas consultas
            if (cpf) {
              await query(
                'UPDATE contatos SET cpf=$1, atualizado_em=NOW() WHERE telefone=$2',
                [cpf, req.params.telefone]
              ).catch(() => {})
              console.log(`✅ CPF encontrado no Bling para ${req.params.telefone}: ${cpf.slice(0,3)}***`)
            }
            break
          }
        }
      } catch (e) {
        console.log('Aviso: não foi possível buscar contato no Bling:', e.message)
      }
    }

    let pedidosFiltrados = []

    // Busca pedidos por CPF (mais preciso)
    if (cpf) {
      try {
        const r = await bling.get('/pedidos/vendas', {
          params: { 'contato[numeroDocumento]': cpf, limite: 20, pagina: 1 }
        })
        pedidosFiltrados = r.data?.data || []
      } catch {}
    }

    // Fallback por nome
    if (!pedidosFiltrados.length && nome) {
      try {
        const r = await bling.get('/pedidos/vendas', { params: { limite: 200, pagina: 1 } })
        const todos = r.data?.data || []
        const palavras = nome.toLowerCase().split(' ').filter(p => p.length > 2)
        pedidosFiltrados = todos.filter(p => {
          const nomeCliente = (p.contato?.nome || '').toLowerCase()
          return palavras.some(palavra => nomeCliente.includes(palavra))
        })
      } catch {}
    }

    if (!pedidosFiltrados.length) {
      const motivo = !cpf && !nome
        ? 'Cliente não encontrado no Bling'
        : cpf
          ? `Nenhum pedido para CPF ${cpf.slice(0,3)}***.${cpf.slice(-2)}`
          : `Nenhum pedido encontrado para "${nome}"`
      return res.json({ pedidos: [], aviso: motivo })
    }

    // Busca detalhes completos
    const detalhes = await Promise.all(
      pedidosFiltrados.slice(0, 10).map(async p => {
        try {
          const dr = await bling.get(`/pedidos/vendas/${p.id}`)
          return dr.data?.data || p
        } catch { return p }
      })
    )

    res.json({ pedidos: detalhes.map(parsePedido), total: detalhes.length })
  } catch (e) {
    console.error('Erro pedidos Bling:', e.response?.data || e.message)
    res.json({ pedidos:[], aviso:`Erro: ${e.response?.data?.error || e.message}` })
  }
})
