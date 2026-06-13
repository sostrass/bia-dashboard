/**
 * src/routes/ocorrencias-api.js — v2
 * CRM de ocorrências com integração Bling
 * Tabela: ocorrencias
 * Endpoints:
 *   GET    /                → lista com stats
 *   GET    /:id             → detalhe
 *   GET    /:id/bling       → dados reais do cliente + pedidos no Bling
 *   POST   /                → criar
 *   PATCH  /:id             → atualizar status, nota, resposta
 *   DELETE /:id             → excluir
 */
'use strict'

const express = require('express')
const router  = express.Router()
const { query } = require('../utils/db')

// Enriquece pedidos com rastreio do cache local — não consulta o Bling (protege rate limit)
async function _rastreioCache(pedidos, campo) {
  campo = campo || 'rastreio'
  if (!pedidos?.length) return pedidos
  const nums = pedidos.map(p => String(p.numero)).filter(Boolean)
  if (!nums.length) return pedidos
  try {
    const { rows } = await query(
      `SELECT numero_pedido, codigo, ultimo_status FROM rastreio_cache WHERE numero_pedido = ANY($1)`, [nums]
    )
    const mapa = {}
    for (const r of rows) mapa[r.numero_pedido] = r
    for (const p of pedidos) {
      const cache = mapa[String(p.numero)]
      if (cache?.codigo && (!p[campo] || p[campo] === '—' || p[campo] === null)) {
        p[campo] = cache.codigo
        if (cache.ultimo_status && !p.statusRastreio) p.statusRastreio = cache.ultimo_status
      }
    }
  } catch(e) { console.log('[ocorrencias] rastreio cache:', e.message?.slice(0,40)) }
  return pedidos
}


// ── Migração ──────────────────────────────────────────────────────────────────
async function migrar() {
  await query(`
    CREATE TABLE IF NOT EXISTS ocorrencias_csat (
      id            SERIAL PRIMARY KEY,
      ocorrencia_id INTEGER REFERENCES ocorrencias(id) ON DELETE CASCADE,
      telefone      VARCHAR(20),
      score         SMALLINT CHECK (score BETWEEN 1 AND 5),
      comentario    TEXT DEFAULT '',
      enviado_em    TIMESTAMPTZ DEFAULT NOW(),
      respondido_em TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_csat_ocorrencia ON ocorrencias_csat(ocorrencia_id);
    CREATE INDEX IF NOT EXISTS idx_csat_telefone   ON ocorrencias_csat(telefone);
    CREATE TABLE IF NOT EXISTS ocorrencias (
      id            SERIAL PRIMARY KEY,
      ticket_id     VARCHAR(20)  UNIQUE,             -- TK-XXXX amigável
      telefone      VARCHAR(20)  NOT NULL DEFAULT '',
      email         VARCHAR(200) DEFAULT '',
      nome_cliente  VARCHAR(200) DEFAULT '',
      numero_pedido VARCHAR(50)  DEFAULT '',
      titulo        TEXT         DEFAULT '',
      tipo          VARCHAR(50)  DEFAULT 'entrega',
      descricao     TEXT         DEFAULT '',
      status        VARCHAR(20)  DEFAULT 'aberta',
      prioridade    VARCHAR(10)  DEFAULT 'normal',
      atribuido_a   VARCHAR(100) DEFAULT '',
      resposta_cliente TEXT      DEFAULT '',
      historico     JSONB        DEFAULT '[]',
      criado_em     TIMESTAMPTZ  DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ  DEFAULT NOW(),
      resolvido_em  TIMESTAMPTZ
    );
    ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS email VARCHAR(200) DEFAULT '';
    ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS titulo TEXT DEFAULT '';
    ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS ticket_id VARCHAR(20);
    ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS canal VARCHAR(30) DEFAULT 'whatsapp';
    CREATE TABLE IF NOT EXISTS ocorrencias_anexos (
      id            SERIAL PRIMARY KEY,
      ocorrencia_id INTEGER NOT NULL,
      nome          VARCHAR(200) NOT NULL,
      mime          VARCHAR(100) NOT NULL,
      tamanho       INTEGER DEFAULT 0,
      dados         BYTEA NOT NULL,
      por           VARCHAR(100) DEFAULT 'agente',
      enviado_em    TIMESTAMPTZ,
      criado_em     TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_oc_anexos ON ocorrencias_anexos(ocorrencia_id);
    ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(20) DEFAULT '';
    ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS followup_em TIMESTAMPTZ;
    ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS escalonado BOOLEAN DEFAULT FALSE;
    ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS visto_por VARCHAR(100) DEFAULT '';
    ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS visto_em TIMESTAMPTZ;
    ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS aguardando_desde TIMESTAMPTZ;
    ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS sla_pausado_h NUMERIC DEFAULT 0;
    ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS origem VARCHAR(20) DEFAULT 'manual';
    CREATE TABLE IF NOT EXISTS ocorrencias_templates (
      id SERIAL PRIMARY KEY, label VARCHAR(80) NOT NULL, texto TEXT NOT NULL,
      criado_em TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ocorrencias_kv (
      chave VARCHAR(60) PRIMARY KEY, valor TEXT, atualizado_em TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ocorrencias_ticket_id ON ocorrencias(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_ocorrencias_status   ON ocorrencias(status);
    CREATE INDEX IF NOT EXISTS idx_ocorrencias_telefone ON ocorrencias(telefone);
    CREATE INDEX IF NOT EXISTS idx_ocorrencias_criado   ON ocorrencias(criado_em DESC);
  `).catch(e => console.warn('Migrar ocorrências:', e.message))
}
migrar()

// ── Helper: gera ticket_id amigável (TK-XXXX) ─────────────────────────────────
async function gerarTicketId() {
  const r = await query('SELECT MAX(id) as max FROM ocorrencias')
  const n = (parseInt(r.rows[0]?.max) || 0) + 1
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const sufixo = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `TK-${String(n).padStart(2,'0')}${sufixo}`.slice(0, 9)
}

// ── Formata registro para o frontend ──────────────────────────────────────────
const fmt = r => ({
  id:              r.id,
  ticketId:        r.ticket_id || `TK-${String(r.id).padStart(4,'0')}`,
  telefone:        r.telefone,
  email:           r.email,
  nomeCliente:     r.nome_cliente,
  numeroPedido:    r.numero_pedido,
  titulo:          r.titulo || r.descricao?.slice(0, 60) || '',
  tipo:            r.tipo,
  descricao:       r.descricao,
  status:          r.status,
  prioridade:      r.prioridade,
  atribuidoA:      r.atribuido_a,
  followup_em:     r.followup_em,
  followup_vencido: !!(r.followup_em && new Date(r.followup_em) < new Date() && !['resolvida','encerrada'].includes(r.status)),
  escalonado:      r.escalonado,
  canal:           r.canal,
  cpf_cnpj:        r.cpf_cnpj,
  tags:            r.tags || [],
  origem:          r.origem || 'manual',
  respostaCliente: r.resposta_cliente,
  historico:       r.historico || [],
  criadoEm:        r.criado_em,
  atualizadoEm:    r.atualizado_em,
  resolvidoEm:     r.resolvido_em,
})

// ── GET / — lista com stats ───────────────────────────────────────────────────
// ── ITEM 6: escalonamento automático — SLA 72h estourado sobe p/ urgente ─────
// Lazy (roda na listagem, 1 UPDATE filtrado). Notifica o gestor se configurado.
// SLA por prioridade (horas) — sobrescrevível via env OCORR_SLA_JSON
// ex.: OCORR_SLA_JSON={"urgente":4,"alta":24,"normal":72,"baixa":120}
let SLA_HORAS = { urgente: 4, alta: 24, normal: 72, baixa: 120 }
try { if (process.env.OCORR_SLA_JSON) SLA_HORAS = { ...SLA_HORAS, ...JSON.parse(process.env.OCORR_SLA_JSON) } } catch {}
const SLA_DEGRAU = { baixa: 'normal', normal: 'alta', alta: 'urgente' }

let _ultimoEscalonamento = 0
async function escalonarPorSLA() {
  if (Date.now() - _ultimoEscalonamento < 5 * 60 * 1000) return  // no máx a cada 5min
  _ultimoEscalonamento = Date.now()
  try {
    // Escalonamento em DEGRAUS: cada prioridade tem seu prazo; estourou → sobe 1 nível
    const todos = []
    for (const [pri, prox] of Object.entries(SLA_DEGRAU)) {
      const h = SLA_HORAS[pri] || 72
      const r0 = await query(`
        UPDATE ocorrencias
           SET prioridade=$1, escalonado=TRUE, atualizado_em=NOW(),
               historico = COALESCE(historico,'[]'::jsonb) || jsonb_build_array(jsonb_build_object(
                 'acao','escalonado','por','sistema','em', to_char(NOW(),'YYYY-MM-DD"T"HH24:MI:SSZ'),
                 'nota','SLA de '||$2||'h estourado — prioridade elevada para '||UPPER($1)))
         WHERE status IN ('aberta','em_analise','em_andamento')
           AND prioridade = $3
           AND criado_em < NOW() - ($2 || ' hours')::interval
         RETURNING ticket_id, nome_cliente, telefone, prioridade`, [prox, String(h), pri])
      todos.push(...r0.rows)
    }
    const r = { rows: todos.filter(t => t.prioridade === 'urgente') }
    if (r.rows.length && process.env.GESTOR_WHATSAPP) {
      const { sendWhatsAppMessage } = require('../services/whatsapp')
      const lista = r.rows.map(t => `• ${t.ticket_id} — ${t.nome_cliente || t.telefone}`).join('\n')
      sendWhatsAppMessage(process.env.GESTOR_WHATSAPP,
        `⚠️ *Escalonamento automático de tickets*\n\n${r.rows.length} ticket(s) estouraram o SLA e subiram para URGENTE:\n\n${lista}`).catch(()=>{})
    }
    if (r.rows.length) console.log(`[Ocorrências] ${r.rows.length} ticket(s) escalonados por SLA`)
  } catch (e) { console.error('[escalonarPorSLA]', e.message?.slice(0,60)) }
}

// ── FASE 1: tickets PROATIVOS — rastreio parado 4+ dias abre ticket sozinho ──
// O sistema enxerga o atraso ANTES do cliente reclamar. Reclamação vira retenção.
let _ultimoProativo = 0
async function abrirTicketsProativos() {
  if (Date.now() - _ultimoProativo < 30 * 60 * 1000) return  // 1x a cada 30min
  _ultimoProativo = Date.now()
  try {
    const parados = await query(`
      SELECT rc.numero_pedido, rc.codigo, rc.ultimo_status, rc.atualizado_em,
             dl.telefone, dl.nome_cliente
        FROM rastreio_cache rc
        JOIN rastreio_ativo ra ON ra.numero_pedido = rc.numero_pedido AND ra.status='ativo'
        LEFT JOIN LATERAL (
          SELECT telefone, nome_cliente FROM disparos_log
           WHERE numero_pedido = rc.numero_pedido AND telefone <> '' LIMIT 1) dl ON TRUE
       WHERE rc.atualizado_em < NOW() - INTERVAL '4 days'
         AND COALESCE(rc.ultimo_status,'') !~* 'entreg'
         AND NOT EXISTS (
           SELECT 1 FROM ocorrencias o
            WHERE o.numero_pedido = rc.numero_pedido
              AND o.status IN ('aberta','em_analise','em_andamento'))
       LIMIT 10`)
    for (const p of parados.rows) {
      const dias = Math.floor((Date.now() - new Date(p.atualizado_em)) / 86400000)
      const ticketId = await gerarTicketId()
      await query(`
        INSERT INTO ocorrencias(ticket_id, telefone, nome_cliente, numero_pedido, titulo, tipo,
                                descricao, prioridade, canal, origem, historico)
        VALUES($1,$2,$3,$4,$5,'atraso',$6,'alta','whatsapp','sistema',$7)`,
        [ticketId, p.telefone||'', p.nome_cliente||'', String(p.numero_pedido),
         `Rastreio parado há ${dias} dias — pedido #${p.numero_pedido}`,
         `Detectado automaticamente: código ${p.codigo||'—'} sem movimentação desde ${new Date(p.atualizado_em).toLocaleDateString('pt-BR')}. Último status: "${p.ultimo_status||'—'}". Agir preventivamente antes da reclamação.`,
         JSON.stringify([{ acao:'criada', por:'sistema', em:new Date().toISOString(),
           nota:`Ticket PROATIVO: rastreio sem movimentação há ${dias} dias` }])])
      console.log(`[Ocorrências] 🛰️ ticket proativo ${ticketId} — pedido #${p.numero_pedido} parado ${dias}d`)
    }
  } catch (e) { console.error('[ticketsProativos]', e.message?.slice(0,60)) }
}

// ── FASE 3: relatório semanal automático para o gestor (segunda-feira) ────────
async function relatorioSemanal() {
  if (!process.env.GESTOR_WHATSAPP) return
  try {
    if (new Date().getDay() !== 1) return  // segunda
    const kv = await query(`SELECT valor FROM ocorrencias_kv WHERE chave='relatorio_semanal_em'`)
    const ultimo = kv.rows[0]?.valor ? new Date(kv.rows[0].valor) : null
    if (ultimo && (Date.now() - ultimo.getTime()) < 6 * 86400000) return
    const m = await query(`
      SELECT COUNT(*) AS total,
             COUNT(*) FILTER (WHERE status IN ('resolvida','encerrada')) AS fechados,
             COUNT(*) FILTER (WHERE prioridade='urgente') AS urgentes,
             COUNT(*) FILTER (WHERE origem='sistema') AS proativos
        FROM ocorrencias WHERE criado_em > NOW() - INTERVAL '7 days'`)
    const csat = await query(`
      SELECT AVG(score)::numeric(3,2) AS media FROM ocorrencias_csat
       WHERE respondido_em > NOW() - INTERVAL '7 days'`).catch(()=>({rows:[{}]}))
    const top = await query(`
      SELECT tipo, COUNT(*) AS n FROM ocorrencias
       WHERE criado_em > NOW() - INTERVAL '7 days' GROUP BY tipo ORDER BY n DESC LIMIT 3`)
    const r = m.rows[0]
    const { sendWhatsAppMessage } = require('../services/whatsapp')
    await sendWhatsAppMessage(process.env.GESTOR_WHATSAPP, [
      `📊 *Central de Ocorrências — resumo da semana*`, ``,
      `Tickets abertos: *${r.total}* (${r.proativos} proativos do sistema)`,
      `Fechados: *${r.fechados}* · Urgentes: *${r.urgentes}*`,
      csat.rows[0]?.media ? `CSAT: *${csat.rows[0].media} ★*` : `CSAT: sem respostas na semana`,
      ``, `Top causas: ${top.rows.map(t=>`${t.tipo} (${t.n})`).join(' · ') || '—'}`,
    ].join('\n'))
    await query(`INSERT INTO ocorrencias_kv(chave,valor,atualizado_em) VALUES('relatorio_semanal_em',$1,NOW())
                 ON CONFLICT(chave) DO UPDATE SET valor=$1, atualizado_em=NOW()`, [new Date().toISOString()])
    console.log('[Ocorrências] 📊 relatório semanal enviado ao gestor')
  } catch (e) { console.error('[relatorioSemanal]', e.message?.slice(0,60)) }
}

router.get('/', async (req, res) => {
  escalonarPorSLA()        // não bloqueia a resposta
  abrirTicketsProativos()
  relatorioSemanal()
  try {
    const { status, prioridade, tipo } = req.query
    const conds = ['1=1'], vals = []
    if (status)     { vals.push(status);     conds.push(`status=$${vals.length}`) }
    if (prioridade) { vals.push(prioridade); conds.push(`prioridade=$${vals.length}`) }
    if (tipo)       { vals.push(tipo);       conds.push(`tipo=$${vals.length}`) }

    const [r, stats] = await Promise.all([
      query(
        `SELECT * FROM ocorrencias WHERE ${conds.join(' AND ')} ORDER BY
          CASE prioridade WHEN 'urgente' THEN 1 WHEN 'alta' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
          criado_em DESC LIMIT 200`,
        vals
      ),
      query(`
        SELECT
          COUNT(*) FILTER (WHERE status='aberta')                                         AS abertas,
          COUNT(*) FILTER (WHERE status='em_analise')                                     AS em_analise,
          COUNT(*) FILTER (WHERE status='em_andamento')                                   AS em_andamento,
          COUNT(*) FILTER (WHERE status='resolvida')                                      AS resolvidas,
          COUNT(*) FILTER (WHERE status='encerrada')                                      AS encerradas,
          COUNT(*) FILTER (WHERE prioridade='urgente'
            AND status NOT IN ('resolvida','encerrada'))                                  AS urgentes,
          COUNT(*)                                                                          AS total
        FROM ocorrencias
      `)
    ])
    res.json({ ocorrencias: r.rows.map(fmt), stats: stats.rows[0], total: r.rows.length })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── CONFIG do módulo (toggles) — guardada em ocorrencias_kv ──────────────────
const CONFIG_DEFAULT = {
  oferecer_compensacao: false,     // OFF por padrão: NÃO oferece reenvio/cupom em atraso
  compensacao_tipo: 'cupom',       // cupom | reenvio | ambos (quando ligado)
  som_notificacao: true,
  auto_sugerir_tipo: true,         // IA sugere tipo/prioridade na criação
  sla_preditivo: true,
}
async function getConfig() {
  try {
    const r = await query(`SELECT valor FROM ocorrencias_kv WHERE chave='config'`)
    return { ...CONFIG_DEFAULT, ...(r.rows[0]?.valor ? JSON.parse(r.rows[0].valor) : {}) }
  } catch { return { ...CONFIG_DEFAULT } }
}
router.get('/config', async (req, res) => { res.json(await getConfig()) })
router.post('/config', async (req, res) => {
  try {
    const atual = await getConfig()
    const novo = { ...atual, ...(req.body||{}) }
    await query(`INSERT INTO ocorrencias_kv(chave,valor,atualizado_em) VALUES('config',$1,NOW())
                 ON CONFLICT(chave) DO UPDATE SET valor=$1, atualizado_em=NOW()`, [JSON.stringify(novo)])
    res.json(novo)
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── Contadores p/ o SINO de tempo real (poll leve) ───────────────────────────
router.get('/contadores', async (req, res) => {
  try {
    const desde = req.query.desde ? new Date(req.query.desde) : null
    const r = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('aberta','em_analise','em_andamento')) AS ativos,
        COUNT(*) FILTER (WHERE prioridade='urgente' AND status IN ('aberta','em_analise','em_andamento')) AS urgentes,
        COUNT(*) FILTER (WHERE followup_em IS NOT NULL AND followup_em < NOW() AND status IN ('aberta','em_analise','em_andamento')) AS followup_vencido,
        COUNT(*) FILTER (WHERE origem='sistema' AND status IN ('aberta','em_analise','em_andamento')) AS proativos,
        MAX(criado_em) AS ultimo_criado
      FROM ocorrencias`)
    let novos = []
    if (desde) {
      const rn = await query(`
        SELECT id, ticket_id, nome_cliente, telefone, tipo, prioridade, origem, criado_em
          FROM ocorrencias WHERE criado_em > $1 ORDER BY criado_em DESC LIMIT 10`, [desde])
      novos = rn.rows
    }
    res.json({ ...r.rows[0], novos })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── Sugestão de tipo/prioridade por IA na criação ────────────────────────────
router.post('/sugerir-classificacao', async (req, res) => {
  try {
    const cfg = await getConfig()
    const texto = `${req.body?.titulo||''} ${req.body?.descricao||''}`.toLowerCase()
    if (!texto.trim()) return res.json({})
    // Heurística determinística (rápida, sem custo) — cobre os casos comuns
    let tipo = 'outro', prioridade = 'normal'
    if (/extravi|sumiu|perdid|não chegou|nao chegou|roubad/.test(texto)) { tipo='extravio'; prioridade='alta' }
    else if (/atras|demora|prazo|parado|sem moviment/.test(texto))       { tipo='atraso';   prioridade='alta' }
    else if (/troc|devolv|arrepend|reembols|estorn/.test(texto))         { tipo='troca';    prioridade='normal' }
    else if (/quebrad|defeit|errad|faltand|faltou|incomplet|avaria/.test(texto)) { tipo='produto'; prioridade='alta' }
    else if (/pagamento|pix|cartão|cartao|cobran|estorno|boleto/.test(texto))    { tipo='pagamento'; prioridade='normal' }
    else if (/entrega|endereço|endereco|receb/.test(texto))              { tipo='entrega';  prioridade='normal' }
    if (/procon|advogad|process|reclame aqui|absurd|nunca mais/.test(texto)) prioridade='urgente'
    res.json({ tipo, prioridade, auto: cfg.auto_sugerir_tipo })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── FASE 3: templates de resposta gerenciáveis ────────────────────────────────
router.get('/templates/lista', async (req, res) => {
  try { const r = await query('SELECT * FROM ocorrencias_templates ORDER BY id'); res.json({ templates: r.rows }) }
  catch (e) { res.status(500).json({ erro: e.message }) }
})
router.post('/templates/lista', async (req, res) => {
  try {
    const { label, texto } = req.body || {}
    if (!label || !texto) return res.status(400).json({ erro: 'label e texto obrigatórios' })
    const r = await query('INSERT INTO ocorrencias_templates(label, texto) VALUES($1,$2) RETURNING *',
      [String(label).slice(0,80), String(texto).slice(0,2000)])
    res.json({ template: r.rows[0] })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})
router.delete('/templates/lista/:tid', async (req, res) => {
  try { await query('DELETE FROM ocorrencias_templates WHERE id=$1', [req.params.tid]); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── FASE 3: merge — funde o ticket origem no alvo (anexos + timeline) ─────────
router.post('/:id/merge', async (req, res) => {
  try {
    const alvoRef = String(req.body?.alvo || '').trim()
    if (!alvoRef) return res.status(400).json({ erro: 'alvo obrigatório (id ou ticket_id)' })
    const [rO, rA] = await Promise.all([
      query('SELECT * FROM ocorrencias WHERE id=$1', [req.params.id]),
      query('SELECT * FROM ocorrencias WHERE id::text=$1 OR ticket_id=$1', [alvoRef]),
    ])
    if (!rO.rows.length || !rA.rows.length) return res.status(404).json({ erro: 'Ticket não encontrado' })
    const ori = rO.rows[0], alvo = rA.rows[0]
    if (ori.id === alvo.id) return res.status(400).json({ erro: 'Origem e alvo são o mesmo ticket' })

    await query('UPDATE ocorrencias_anexos SET ocorrencia_id=$1 WHERE ocorrencia_id=$2', [alvo.id, ori.id])
    const histAlvo = alvo.historico || []
    histAlvo.push({ acao:'merge', por: req.body?.por || 'agente', em:new Date().toISOString(),
      nota:`Fundido com ${ori.ticket_id}: "${ori.titulo || ori.descricao?.slice(0,80) || ''}"` })
    for (const h of (ori.historico || []))
      histAlvo.push({ ...h, nota: `[${ori.ticket_id}] ${h.nota || ''}` })
    histAlvo.sort((a,b) => new Date(a.em) - new Date(b.em))
    const histOri = ori.historico || []
    histOri.push({ acao:'merge', por: req.body?.por || 'agente', em:new Date().toISOString(),
      nota:`Encerrado por fusão no ${alvo.ticket_id}` })
    await Promise.all([
      query('UPDATE ocorrencias SET historico=$1, atualizado_em=NOW() WHERE id=$2', [JSON.stringify(histAlvo), alvo.id]),
      query(`UPDATE ocorrencias SET status='encerrada', historico=$1, atualizado_em=NOW() WHERE id=$2`, [JSON.stringify(histOri), ori.id]),
    ])
    res.json({ ok: true, alvo: { id: alvo.id, ticket_id: alvo.ticket_id } })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── FASE 3: exportação CSV ─────────────────────────────────────────────────────
router.get('/export.csv', async (req, res) => {
  try {
    const r = await query(`
      SELECT ticket_id, status, prioridade, tipo, canal, origem, nome_cliente, telefone,
             numero_pedido, titulo, atribuido_a, criado_em, resolvido_em
        FROM ocorrencias ORDER BY criado_em DESC LIMIT 5000`)
    const esc = v => `"${String(v ?? '').replace(/"/g,'""')}"`
    const head = 'ticket;status;prioridade;tipo;canal;origem;cliente;telefone;pedido;titulo;atribuido;criado_em;resolvido_em'
    const linhas = r.rows.map(t => [t.ticket_id,t.status,t.prioridade,t.tipo,t.canal,t.origem,
      t.nome_cliente,t.telefone,t.numero_pedido,t.titulo,t.atribuido_a,
      t.criado_em?.toISOString?.()||t.criado_em, t.resolvido_em?.toISOString?.()||t.resolvido_em||''].map(esc).join(';'))
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="ocorrencias.csv"')
    res.send('\uFEFF' + [head, ...linhas].join('\n'))
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── FASE 2: inteligência / causa-raiz — os tickets como sensor da operação ───
router.get('/inteligencia/causa-raiz', async (req, res) => {
  try {
    const dias = Math.min(parseInt(req.query.dias) || 30, 180)
    const [rTk, rEnvios] = await Promise.all([
      query(`SELECT o.tipo, o.canal, o.origem, o.criado_em, o.resolvido_em, o.atribuido_a, o.numero_pedido,
                    g.transportadora, g.itens
               FROM ocorrencias o
               LEFT JOIN pedidos_geo_cache g ON g.numero = o.numero_pedido
              WHERE o.criado_em > NOW() - ($1||' days')::interval`, [String(dias)]),
      query(`SELECT transportadora, COUNT(*) AS n FROM pedidos_geo_cache
              WHERE data_pedido > NOW() - ($1||' days')::interval AND transportadora IS NOT NULL
              GROUP BY transportadora`, [String(dias)]).catch(()=>({rows:[]})),
    ])
    const envios = {}; let totalEnvios = 0
    rEnvios.rows.forEach(e => { envios[e.transportadora] = parseInt(e.n); totalEnvios += parseInt(e.n) })

    const porTransp = {}, porTipoCanal = {}, porProduto = {}, heatmap = {}, porAgente = {}
    let totalComTransp = 0
    for (const t of rTk.rows) {
      if (t.transportadora) { porTransp[t.transportadora] = (porTransp[t.transportadora]||0)+1; totalComTransp++ }
      const key = `${t.tipo||'outro'}|${t.canal||'whatsapp'}`
      porTipoCanal[key] = (porTipoCanal[key]||0)+1
      try {
        const itens = Array.isArray(t.itens) ? t.itens : JSON.parse(t.itens||'[]')
        const nome = itens?.[0]?.descricao || itens?.[0]?.nome
        if (nome) porProduto[nome.slice(0,50)] = (porProduto[nome.slice(0,50)]||0)+1
      } catch {}
      const d = new Date(t.criado_em)
      const hk = `${d.getDay()}-${d.getHours()}`
      heatmap[hk] = (heatmap[hk]||0)+1
      if (t.atribuido_a && t.resolvido_em) {
        const ag = porAgente[t.atribuido_a] || { n: 0, somaH: 0 }
        ag.n++; ag.somaH += (new Date(t.resolvido_em) - new Date(t.criado_em)) / 3600000
        porAgente[t.atribuido_a] = ag
      }
    }
    // Ranking transportadora: % dos tickets vs % dos envios (índice de problema)
    const transportadoras = Object.entries(porTransp).map(([nome, n]) => {
      const pctTickets = totalComTransp ? n / totalComTransp * 100 : 0
      const pctEnvios  = totalEnvios && envios[nome] ? envios[nome] / totalEnvios * 100 : null
      return { nome, tickets: n, pct_tickets: Math.round(pctTickets), pct_envios: pctEnvios!=null?Math.round(pctEnvios):null,
               indice: pctEnvios ? Math.round(pctTickets / pctEnvios * 100) / 100 : null }
    }).sort((a,b) => b.tickets - a.tickets)

    res.json({
      periodo_dias: dias, total_tickets: rTk.rows.length,
      proativos: rTk.rows.filter(t=>t.origem==='sistema').length,
      transportadoras,
      tipo_canal: Object.entries(porTipoCanal).map(([k,n]) => { const [tipo,canal]=k.split('|'); return { tipo, canal, n } })
        .sort((a,b)=>b.n-a.n),
      produtos: Object.entries(porProduto).map(([nome,n])=>({nome,n})).sort((a,b)=>b.n-a.n).slice(0,8),
      heatmap,
      agentes: Object.entries(porAgente).map(([nome,v])=>({ nome, resolvidos: v.n, media_h: Math.round(v.somaH/v.n*10)/10 }))
        .sort((a,b)=>b.resolvidos-a.resolvidos),
      clientes_recorrentes: await (async () => {
        try {
          const rc = await query(`
            SELECT COALESCE(NULLIF(nome_cliente,''), telefone) AS cliente, telefone,
                   COUNT(*) AS tickets,
                   COUNT(*) FILTER (WHERE status IN ('resolvida','encerrada')) AS resolvidos,
                   array_agg(DISTINCT tipo) AS tipos
              FROM ocorrencias
             WHERE criado_em > NOW() - ($1||' days')::interval AND telefone <> ''
             GROUP BY cliente, telefone HAVING COUNT(*) >= 2
             ORDER BY tickets DESC LIMIT 15`, [String(dias)])
          return rc.rows.map(r => ({ cliente: r.cliente, telefone: r.telefone,
            tickets: parseInt(r.tickets), resolvidos: parseInt(r.resolvidos), tipos: r.tipos }))
        } catch { return [] }
      })(),
      tipos_detalhe: Object.entries(rTk.rows.reduce((acc,t)=>{ acc[t.tipo||'outro']=(acc[t.tipo||'outro']||0)+1; return acc },{}))
        .map(([tipo,n])=>({ tipo, n })).sort((a,b)=>b.n-a.n),
    })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── FASE 2+: painel analítico avançado da Inteligência ───────────────────────
router.get('/inteligencia/avancado', async (req, res) => {
  try {
    const dias = Math.min(parseInt(req.query.dias) || 30, 180)
    const [rTk, rCsat, rCupons] = await Promise.all([
      query(`SELECT o.id, o.tipo, o.canal, o.origem, o.status, o.prioridade, o.criado_em, o.resolvido_em,
                    o.telefone, o.numero_pedido, o.historico, g.uf, g.municipio, g.transportadora
               FROM ocorrencias o
               LEFT JOIN pedidos_geo_cache g ON g.numero = o.numero_pedido
              WHERE o.criado_em > NOW() - ($1||' days')::interval`, [String(dias)]),
      query(`SELECT score, respondido_em FROM ocorrencias_csat
              WHERE respondido_em > NOW() - ($1||' days')::interval`, [String(dias)]).catch(()=>({rows:[]})),
      query(`SELECT COALESCE(SUM(valor_aplicado),0) AS total, COUNT(*) AS n FROM cupons_uso
              WHERE usado_em > NOW() - ($1||' days')::interval`, [String(dias)]).catch(()=>({rows:[{total:0,n:0}]})),
    ])
    const tks = rTk.rows

    // 1. Curva temporal (tickets/dia, abertos vs resolvidos)
    const porDia = {}
    for (const t of tks) {
      const d = new Date(t.criado_em).toISOString().slice(0,10)
      porDia[d] = porDia[d] || { dia:d, abertos:0, resolvidos:0 }
      porDia[d].abertos++
      if (t.resolvido_em) {
        const dr = new Date(t.resolvido_em).toISOString().slice(0,10)
        porDia[dr] = porDia[dr] || { dia:dr, abertos:0, resolvidos:0 }
        porDia[dr].resolvidos++
      }
    }
    const curva = Object.values(porDia).sort((a,b)=>a.dia.localeCompare(b.dia))

    // 2. Reincidência: % de clientes com 2+ tickets
    const porTel = {}
    tks.forEach(t => { if (t.telefone) porTel[t.telefone] = (porTel[t.telefone]||0)+1 })
    const clientesUnicos = Object.keys(porTel).length
    const reincidentes = Object.values(porTel).filter(n=>n>=2).length
    const taxa_reincidencia = clientesUnicos ? Math.round(reincidentes/clientesUnicos*100) : 0

    // 3. Tempo médio de resolução POR TIPO
    const tempoTipo = {}
    for (const t of tks) {
      if (!t.resolvido_em) continue
      const h = (new Date(t.resolvido_em)-new Date(t.criado_em))/3600000
      const k = t.tipo||'outro'
      tempoTipo[k] = tempoTipo[k] || { tipo:k, soma:0, n:0 }
      tempoTipo[k].soma += h; tempoTipo[k].n++
    }
    const tempo_por_tipo = Object.values(tempoTipo).map(x=>({ tipo:x.tipo, media_h:Math.round(x.soma/x.n*10)/10, n:x.n })).sort((a,b)=>b.media_h-a.media_h)

    // 4. Região × atraso (UF com mais tickets de atraso/extravio)
    const regiao = {}
    tks.filter(t=>['atraso','extravio'].includes(t.tipo) && t.uf).forEach(t=>{
      regiao[t.uf] = (regiao[t.uf]||0)+1
    })
    const regiao_atraso = Object.entries(regiao).map(([uf,n])=>({uf,n})).sort((a,b)=>b.n-a.n).slice(0,8)

    // 5. Eficácia: tickets resolvidos sem reabertura vs reabertos
    let semReabertura=0, reabertos=0
    for (const t of tks) {
      const h = Array.isArray(t.historico)?t.historico:[]
      const statuses = h.filter(e=>String(e.acao).startsWith('status'))
      const voltou = statuses.some((e,i)=> i>0 && /resolvida/.test(statuses[i-1]?.acao||'') && /aberta|andamento|analise/.test(e.acao))
      if (t.resolvido_em) { if (voltou) reabertos++; else semReabertura++ }
    }
    const taxa_primeira_resolucao = (semReabertura+reabertos) ? Math.round(semReabertura/(semReabertura+reabertos)*100) : null

    // 6. Funil de status atual
    const funil = { aberta:0, em_analise:0, em_andamento:0, resolvida:0, encerrada:0 }
    tks.forEach(t=>{ funil[t.status] = (funil[t.status]||0)+1 })

    // 7. CSAT distribuição
    const csatDist = {1:0,2:0,3:0,4:0,5:0}
    rCsat.rows.forEach(c=>{ if(c.score) csatDist[c.score]=(csatDist[c.score]||0)+1 })
    const csatN = rCsat.rows.filter(c=>c.score).length
    const csatMedia = csatN ? Math.round(rCsat.rows.reduce((s,c)=>s+(c.score||0),0)/csatN*100)/100 : null

    res.json({
      periodo_dias: dias, total: tks.length,
      curva, taxa_reincidencia, clientes_unicos: clientesUnicos, reincidentes,
      tempo_por_tipo, regiao_atraso, taxa_primeira_resolucao,
      reabertos, funil,
      csat: { media: csatMedia, n: csatN, dist: csatDist },
      compensacao: { total: Math.round(parseFloat(rCupons.rows[0].total)*100)/100, usos: parseInt(rCupons.rows[0].n) },
      proativos: tks.filter(t=>t.origem==='sistema').length,
    })
  } catch (e) { console.error('[intel/avancado]', e.message); res.status(500).json({ erro: e.message }) }
})

// ── ITEM 5: presença — quem está com o ticket aberto agora (anti-colisão) ────
router.post('/:id/presenca', async (req, res) => {
  try {
    const agente = String(req.body?.agente || '').slice(0, 100)
    if (!agente) return res.status(400).json({ erro: 'agente obrigatório' })
    const r = await query('SELECT visto_por, visto_em FROM ocorrencias WHERE id=$1', [req.params.id])
    if (!r.rows.length) return res.status(404).json({ erro: 'Não encontrada' })
    const { visto_por, visto_em } = r.rows[0]
    const ativoOutro = visto_por && visto_por !== agente && visto_em &&
      (Date.now() - new Date(visto_em).getTime()) < 90 * 1000
    if (!ativoOutro) {
      await query('UPDATE ocorrencias SET visto_por=$1, visto_em=NOW() WHERE id=$2', [agente, req.params.id])
    }
    res.json({ colisao: !!ativoOutro, com: ativoOutro ? visto_por : null })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── ITEM 8: resumo executivo do caso por IA (handoff entre agentes) ──────────
router.post('/:id/resumir', async (req, res) => {
  try {
    const rOc = await query('SELECT * FROM ocorrencias WHERE id=$1', [req.params.id])
    if (!rOc.rows.length) return res.status(404).json({ erro: 'Não encontrada' })
    const oc = rOc.rows[0]
    if (!process.env.GEMINI_API_KEY) return res.status(400).json({ erro: 'GEMINI_API_KEY não configurada' })
    const { GoogleGenAI } = require('@google/genai')
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const hist = (oc.historico || []).map(h =>
      `[${(h.em||'').slice(0,16)} ${h.por}/${h.acao}] ${h.nota || ''}`).join('\n')
    const prompt = [
      'Resuma o ticket de atendimento abaixo em PT-BR para handoff entre agentes.',
      'Formato EXATO (3 linhas, sem markdown):',
      'SITUAÇÃO: <uma frase: qual é o problema do cliente>',
      'JÁ FEITO: <uma frase: ações executadas até agora>',
      'PRÓXIMO PASSO: <uma frase: o que o próximo agente deve fazer>',
      '',
      `Ticket ${oc.ticket_id} · tipo ${oc.tipo} · status ${oc.status} · prioridade ${oc.prioridade}`,
      `Cliente: ${oc.nome_cliente||'-'} · Pedido: ${oc.numero_pedido||'-'} · Canal: ${oc.canal||'-'}`,
      `Título: ${oc.titulo||'-'} · Descrição: ${(oc.descricao||'').slice(0,400)}`,
      `Timeline:\n${hist.slice(0, 4000)}`,
    ].join('\n')
    const result = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', contents: prompt,
      config: { maxOutputTokens: 1024, temperature: 0.4, thinkingConfig: { thinkingBudget: 0 } },
    })
    res.json({ resumo: (result.text || '').trim() })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── ITEM 4: métricas da central (30 dias) ─────────────────────────────────────
router.get('/metricas/resumo', async (req, res) => {
  try {
    const [rOcs, rCsat] = await Promise.all([
      query(`SELECT tipo, canal, status, prioridade, criado_em, resolvido_em, historico
               FROM ocorrencias WHERE criado_em > NOW() - INTERVAL '30 days'`),
      query(`SELECT AVG(score)::numeric(3,2) AS media, COUNT(*) FILTER (WHERE score IS NOT NULL) AS n
               FROM ocorrencias_csat WHERE enviado_em > NOW() - INTERVAL '30 days'`).catch(()=>({rows:[{}]})),
    ])
    let somaPrimeira = 0, nPrimeira = 0, somaResol = 0, nResol = 0
    const porCanal = {}, porTipo = {}
    for (const t of rOcs.rows) {
      porCanal[t.canal||'whatsapp'] = (porCanal[t.canal||'whatsapp']||0) + 1
      porTipo[t.tipo||'outro']      = (porTipo[t.tipo||'outro']||0) + 1
      const cri = new Date(t.criado_em).getTime()
      const h = Array.isArray(t.historico) ? t.historico : []
      const prim = h.find(e => ['whatsapp','nota'].includes(e.acao) && e.por !== 'cliente')
      if (prim?.em) { somaPrimeira += Math.max(0, new Date(prim.em).getTime() - cri); nPrimeira++ }
      if (t.resolvido_em) { somaResol += Math.max(0, new Date(t.resolvido_em).getTime() - cri); nResol++ }
    }
    const fmtH = ms => ms == null ? null : Math.round(ms / 3600000 * 10) / 10
    res.json({
      periodo_dias: 30,
      tickets: rOcs.rows.length,
      primeira_resposta_h: nPrimeira ? fmtH(somaPrimeira / nPrimeira) : null,
      resolucao_h:         nResol    ? fmtH(somaResol / nResol)       : null,
      resolvidos: nResol,
      csat_media: rCsat.rows[0]?.media ? parseFloat(rCsat.rows[0].media) : null,
      csat_n:     parseInt(rCsat.rows[0]?.n || 0),
      por_canal: porCanal, por_tipo: porTipo,
    })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── ANEXOS — upload (base64), listagem, download público e envio WhatsApp ────
// Armazenamento no Postgres (bytea): sobrevive a redeploys do Railway e dispensa
// S3. Limite 5MB por arquivo. A rota de download é pública para a Meta baixar.
const ANEXO_MAX = 5 * 1024 * 1024

router.post('/:id/anexos', async (req, res) => {
  try {
    const { nome, mime, base64, por } = req.body || {}
    if (!nome || !mime || !base64) return res.status(400).json({ erro: 'nome, mime e base64 obrigatórios' })
    const buf = Buffer.from(base64, 'base64')
    if (buf.length > ANEXO_MAX) return res.status(413).json({ erro: 'Arquivo acima de 5MB' })
    const rOc = await query('SELECT id, historico FROM ocorrencias WHERE id=$1', [req.params.id])
    if (!rOc.rows.length) return res.status(404).json({ erro: 'Ticket não encontrado' })

    const r = await query(
      `INSERT INTO ocorrencias_anexos(ocorrencia_id, nome, mime, tamanho, dados, por)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING id, nome, mime, tamanho, criado_em`,
      [req.params.id, String(nome).slice(0,200), mime, buf.length, buf, por || 'agente'])

    const hist = rOc.rows[0].historico || []
    hist.push({ acao:'anexo', por: por||'agente', em:new Date().toISOString(), nota:`Arquivo anexado: ${nome} (${(buf.length/1024).toFixed(0)} KB)` })
    await query('UPDATE ocorrencias SET historico=$1, atualizado_em=NOW() WHERE id=$2', [JSON.stringify(hist), req.params.id])
    res.json({ ok: true, anexo: r.rows[0] })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

router.get('/:id/anexos', async (req, res) => {
  try {
    const r = await query(
      `SELECT id, nome, mime, tamanho, por, enviado_em, criado_em
         FROM ocorrencias_anexos WHERE ocorrencia_id=$1 ORDER BY criado_em DESC`, [req.params.id])
    res.json({ anexos: r.rows })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// Download público (a Meta baixa por aqui ao enviar mídia por link)
router.get('/anexo/:fileId', async (req, res) => {
  try {
    const r = await query('SELECT nome, mime, dados FROM ocorrencias_anexos WHERE id=$1', [req.params.fileId])
    if (!r.rows.length) return res.status(404).send('não encontrado')
    const a = r.rows[0]
    res.setHeader('Content-Type', a.mime)
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(a.nome)}"`)
    res.send(a.dados)
  } catch (e) { res.status(500).send('erro') }
})

// Envia o anexo ao cliente pelo WhatsApp (imagem ou documento, por link público)
router.post('/:id/anexos/:fileId/enviar', async (req, res) => {
  try {
    const [rOc, rAx] = await Promise.all([
      query('SELECT * FROM ocorrencias WHERE id=$1', [req.params.id]),
      query('SELECT id, nome, mime FROM ocorrencias_anexos WHERE id=$1 AND ocorrencia_id=$2', [req.params.fileId, req.params.id]),
    ])
    if (!rOc.rows.length || !rAx.rows.length) return res.status(404).json({ erro: 'Não encontrado' })
    const oc = rOc.rows[0], ax = rAx.rows[0]
    if (!oc.telefone) return res.status(400).json({ erro: 'Ticket sem telefone' })

    const PUB = process.env.PUBLIC_URL || 'https://whatsapp-sostrass.up.railway.app'
    const link = `${PUB}/api/ocorrencias/anexo/${ax.id}`
    const tel  = String(oc.telefone).replace(/\D/g,'')
    const to   = tel.startsWith('55') ? tel : '55' + tel
    const ehImg = /^image\//.test(ax.mime)

    const axios = require('axios')
    await axios.post(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      ehImg
        ? { messaging_product:'whatsapp', to, type:'image',    image:    { link, caption: req.body?.legenda || '' } }
        : { messaging_product:'whatsapp', to, type:'document', document: { link, filename: ax.nome } },
      { headers: { Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type':'application/json' }, timeout: 15000 })

    const hist = oc.historico || []
    hist.push({ acao:'anexo_enviado', por:req.body?.por||'agente', em:new Date().toISOString(), nota:`${ehImg?'Imagem':'Documento'} enviado ao cliente: ${ax.nome}` })
    await Promise.all([
      query('UPDATE ocorrencias SET historico=$1, atualizado_em=NOW() WHERE id=$2', [JSON.stringify(hist), oc.id]),
      query('UPDATE ocorrencias_anexos SET enviado_em=NOW() WHERE id=$1', [ax.id]),
    ])
    res.json({ ok: true })
  } catch (e) {
    const det = e.response?.data?.error?.message || e.message
    console.error('[anexo/enviar]', det)
    res.status(500).json({ erro: det })
  }
})

// ── GET /:id/contexto360 — dossiê do cliente para o modal de atendimento ─────
// Reúne TUDO que o agente precisa sem sair do modal: perfil, share, pedidos,
// rastreio em curso (com detecção de atraso), disparos, tickets anteriores,
// flags (VIP / risco / recorrente) e plano de resposta sugerido.
router.get('/:id/contexto360', async (req, res) => {
  try {
    const rOc = await query('SELECT * FROM ocorrencias WHERE id=$1', [req.params.id])
    if (!rOc.rows.length) return res.status(404).json({ erro: 'Não encontrada' })
    const oc  = rOc.rows[0]
    const tel = String(oc.telefone || '').replace(/\D/g, '')

    const vazio = { rows: [] }
    const [rPedidos, rTickets, rDisparos, rMsgs, rConversa, rRastreio] = await Promise.all([
      // Pedidos do cliente: disparos_log liga telefone→numero_pedido; geo_cache dá valores
      tel ? query(`
        SELECT DISTINCT ON (dl.numero_pedido)
               dl.numero_pedido, g.total, g.valor_frete, g.transportadora,
               g.data_pedido, g.data_saida, g.itens, g.canal, g.municipio, g.uf
          FROM disparos_log dl
          LEFT JOIN pedidos_geo_cache g ON g.numero = dl.numero_pedido
         WHERE regexp_replace(dl.telefone,'\\D','','g') LIKE '%'||$1
         ORDER BY dl.numero_pedido DESC NULLS LAST LIMIT 12`, [tel.slice(-8)]).catch(()=>vazio) : vazio,
      tel ? query(`
        SELECT id, ticket_id, titulo, tipo, status, prioridade, criado_em, resolvido_em
          FROM ocorrencias
         WHERE regexp_replace(telefone,'\\D','','g') LIKE '%'||$1 AND id <> $2
         ORDER BY criado_em DESC LIMIT 10`, [tel.slice(-8), oc.id]).catch(()=>vazio) : vazio,
      tel ? query(`
        SELECT gatilho, numero_pedido, status, criado_em
          FROM disparos_log
         WHERE regexp_replace(telefone,'\\D','','g') LIKE '%'||$1
         ORDER BY criado_em DESC LIMIT 15`, [tel.slice(-8)]).catch(()=>vazio) : vazio,
      tel ? query(`
        SELECT COUNT(*) AS total, MAX(criado_em) AS ultima
          FROM mensagens
         WHERE regexp_replace(telefone,'\\D','','g') LIKE '%'||$1`, [tel.slice(-8)]).catch(()=>vazio) : vazio,
      tel ? query(`
        SELECT direcao, conteudo, criado_em
          FROM mensagens
         WHERE regexp_replace(telefone,'\\D','','g') LIKE '%'||$1
         ORDER BY criado_em DESC LIMIT 12`, [tel.slice(-8)]).catch(()=>vazio) : vazio,
      oc.numero_pedido ? query(`
        SELECT rc.numero_pedido, rc.codigo, rc.ultimo_evento, rc.ultimo_status, rc.atualizado_em,
               ra.status AS rastreio_ativo_status
          FROM rastreio_cache rc
          LEFT JOIN rastreio_ativo ra ON ra.numero_pedido = rc.numero_pedido
         WHERE rc.numero_pedido = $1`, [String(oc.numero_pedido)]).catch(()=>vazio) : vazio,
    ])

    // ── Métricas de share ────────────────────────────────────────────────────
    const pedidos = rPedidos.rows
    const comTotal = pedidos.filter(p => p.total != null)
    const shareTotal  = comTotal.reduce((s, p) => s + parseFloat(p.total || 0), 0)
    const ticketMedio = comTotal.length ? shareTotal / comTotal.length : 0
    const transpCount = {}
    pedidos.forEach(p => { if (p.transportadora) transpCount[p.transportadora] = (transpCount[p.transportadora]||0)+1 })
    const transpFavorita = Object.entries(transpCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || null

    // ── Rastreio em curso + detecção de atraso ───────────────────────────────
    let rastreio = null
    if (rRastreio.rows.length) {
      const rr = rRastreio.rows[0]
      const ped = pedidos.find(p => String(p.numero_pedido) === String(rr.numero_pedido))
      const diasDesdeSaida = ped?.data_saida
        ? Math.floor((Date.now() - new Date(ped.data_saida).getTime()) / 86400000) : null
      const diasSemMovimento = rr.atualizado_em
        ? Math.floor((Date.now() - new Date(rr.atualizado_em).getTime()) / 86400000) : null
      rastreio = {
        numero_pedido: rr.numero_pedido, codigo: rr.codigo,
        ultimo_evento: rr.ultimo_evento, ultimo_status: rr.ultimo_status,
        atualizado_em: rr.atualizado_em, em_curso: rr.rastreio_ativo_status === 'ativo',
        dias_desde_saida: diasDesdeSaida, dias_sem_movimento: diasSemMovimento,
        atrasado: (diasSemMovimento != null && diasSemMovimento >= 4) ||
                  (diasDesdeSaida != null && diasDesdeSaida >= 12 &&
                   !/entreg/i.test(rr.ultimo_status || '')),
      }
    }

    // ── Temperatura do cliente (análise do texto do ticket + últimas msgs) ──
    const _txtTemp = [oc.titulo, oc.descricao, ...rConversa.rows.filter(m=>m.direcao==='entrada').map(m=>m.conteudo)]
      .join(' ').toLowerCase()
    const _sinaisFortes = /(procon|reclame aqui|advogad|processo|absurdo|palhaçada|vergonha|nunca mais|p[ée]ssim|horr[ií]vel|lixo|golpe|roubo)/g
    const _sinaisMedios = /(decepcionad|frustrad|demora|cansad|insatisfeit|chatead|esperando até agora|de novo|outra vez)/g
    const _nF = (_txtTemp.match(_sinaisFortes) || []).length
    const _nM = (_txtTemp.match(_sinaisMedios) || []).length
    const temperatura = _nF >= 1 ? 'exaltado' : _nM >= 2 ? 'insatisfeito' : _nM === 1 ? 'atencao' : 'neutro'

    // ── Flags do cliente ─────────────────────────────────────────────────────
    const ticketsAnteriores = rTickets.rows
    const nResolvidos = ticketsAnteriores.filter(t => ['resolvida','encerrada'].includes(t.status)).length
    const flags = {
      vip:        shareTotal >= 1000 || comTotal.length >= 6,
      recorrente: comTotal.length >= 3,
      risco:      ticketsAnteriores.length >= 3 ? 'alto'
                : ticketsAnteriores.length >= 1 ? 'medio' : 'baixo',
      problematico: ticketsAnteriores.length >= 3,
    }

    // ── Plano de resposta sugerido (determinístico, por cenário) ─────────────
    const plano = []
    if (temperatura === 'exaltado')     plano.push('🌡️ Cliente EXALTADO (menções a Procon/processo ou linguagem dura) — valide o sentimento na primeira frase, não se defenda, e dê solução com prazo curto.')
    else if (temperatura === 'insatisfeito') plano.push('🌡️ Cliente insatisfeito — reconheça a frustração explicitamente antes de qualquer explicação técnica.')
    if (rastreio?.atrasado)        plano.push('Pacote com sinal de atraso — reconheça ANTES do cliente reclamar e apresente o último evento de rastreio.')
    if (flags.vip)                 plano.push(`Cliente VIP (R$ ${shareTotal.toFixed(0)} em pedidos) — priorize resolução no primeiro contato e ofereça compensação se houver falha nossa.`)
    if (flags.problematico)        plano.push(`${ticketsAnteriores.length} tickets anteriores — leia o histórico antes de responder; evite repetir solução que já falhou.`)
    if (oc.tipo === 'entrega')     plano.push('Caso de entrega: cite transportadora, código e prazo concreto. Nunca prometa data sem o rastreio sustentar.')
    if (oc.tipo === 'produto')     plano.push('Caso de produto: peça foto/vídeo se ainda não houver, e ofereça reposição ou reembolso conforme política.')
    if (!plano.length)             plano.push('Responda com empatia, confirme o entendimento do problema e dê UM próximo passo claro com prazo.')

    // ── ITEM 3: compensação sugerida (proporcional ao dano e ao cliente) ─────
    const COMP_BASE = { extravio: 15, atraso: 10, produto: 12, entrega: 8, troca: 5, pagamento: 5, outro: 5 }
    let compPct = COMP_BASE[oc.tipo] ?? 5
    const compJust = [`base ${compPct}% para "${oc.tipo}"`]
    if (flags.vip)                    { compPct += 5; compJust.push('+5% cliente VIP') }
    if (temperatura === 'exaltado')   { compPct += 5; compJust.push('+5% cliente exaltado') }
    if (rastreio?.atrasado)           { compPct += 3; compJust.push('+3% atraso confirmado no rastreio') }
    compPct = Math.min(compPct, 25)
    const compBaseValor = ticketMedio || 0
    const compensacao = {
      percentual: compPct,
      valor_sugerido: Math.round(compBaseValor * compPct) / 100,
      base: 'ticket médio do cliente',
      codigo_sugerido: `DESCULPA${compPct}-${(oc.ticket_id||'TK').replace(/[^A-Z0-9]/gi,'')}`,
      justificativa: compJust.join(' · '),
    }

    // Dados cadastrais completos do Bling (endereço, email, nome oficial)
    let cadastro = null
    if (oc.cpf_cnpj || tel) {
      try {
        const { getBlingClient } = require('./blingClient')
        const bling = await getBlingClient()
        const doc = (oc.cpf_cnpj || '').replace(/\D/g,'')
        let rc = null
        if (doc) rc = await bling.get(`/contatos?numeroDocumento=${doc}&limite=1`).catch(()=>null)
        if ((!rc || !rc.data?.data?.length) && tel) rc = await bling.get(`/contatos?pesquisa=${tel}&limite=1`).catch(()=>null)
        const c = rc?.data?.data?.[0]
        if (c) {
          const e = c.endereco?.geral || c.endereco || {}
          cadastro = {
            nome: c.nome, email: c.email, telefone: c.telefone || c.celular,
            documento: c.numeroDocumento,
            endereco: [e.endereco, e.numero].filter(Boolean).join(', '),
            complemento: e.complemento, bairro: e.bairro,
            cidade: e.municipio, uf: e.uf, cep: e.cep,
          }
        }
      } catch {}
    }
    const nomeResolvido = cadastro?.nome || oc.nome_cliente || null

    // SLA preditivo: prazo por prioridade vs tempo decorrido (projeção)
    const SLA_H = { urgente:4, alta:24, normal:72, baixa:120 }
    const prazoH = SLA_H[oc.prioridade] || 72
    // Desconta o tempo em que o ticket ficou "aguardando cliente" (não conta contra o agente)
    let pausadoH = parseFloat(oc.sla_pausado_h || 0)
    if (oc.status === 'aguardando_cliente' && oc.aguardando_desde)
      pausadoH += (Date.now() - new Date(oc.aguardando_desde).getTime()) / 3600000
    const decorridoH = Math.max(0, (Date.now() - new Date(oc.criado_em).getTime()) / 3600000 - pausadoH)
    const restanteH = Math.round((prazoH - decorridoH) * 10) / 10
    const sla = {
      prazo_h: prazoH, decorrido_h: Math.round(decorridoH*10)/10, restante_h: restanteH,
      pct: Math.min(100, Math.round(decorridoH/prazoH*100)),
      estado: restanteH < 0 ? 'estourado' : restanteH < prazoH*0.25 ? 'risco' : 'ok',
    }
    // Sentimento da ÚLTIMA resposta do cliente após a última ação do agente
    let sentimento_resposta = null
    const ultAgente = [...(oc.historico||[])].reverse().find(h => ['whatsapp','status'].some(a=>String(h.acao).includes(a)))
    if (ultAgente) {
      const aposMsg = rConversa.rows.filter(m => m.direcao==='entrada' && new Date(m.criado_em) > new Date(ultAgente.em))
      const txt = aposMsg.map(m=>m.conteudo).join(' ').toLowerCase()
      if (txt) {
        if (/obrigad|valeu|perfeito|resolv|consegui|ótim|otim|show|maravilh/.test(txt)) sentimento_resposta = 'positivo'
        else if (/não resolv|nao resolv|continua|ainda|de novo|piorou|absurd|cad[êe]|quando|insist/.test(txt)) sentimento_resposta = 'negativo'
        else sentimento_resposta = 'neutro'
      }
    }

    res.json({
      ticket: oc,
      compensacao,
      sla, sentimento_resposta,
      cadastro,
      cliente: {
        nome: nomeResolvido, telefone: oc.telefone, email: cadastro?.email || oc.email,
        nome_origem: cadastro?.nome ? 'cadastro' : oc.nome_cliente ? 'informado' : 'telefone',
        mensagens_total: parseInt(rMsgs.rows[0]?.total || 0),
        ultima_interacao: rMsgs.rows[0]?.ultima || null,
      },
      share: {
        total: Math.round(shareTotal * 100) / 100,
        pedidos: comTotal.length,
        ticket_medio: Math.round(ticketMedio * 100) / 100,
        transportadora_favorita: transpFavorita,
      },
      pedidos, rastreio,
      conversa: rConversa.rows.reverse(),
      temperatura,
      disparos: rDisparos.rows,
      tickets_anteriores: ticketsAnteriores,
      flags, plano,
    })
  } catch (e) {
    console.error('[contexto360]', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── Busca de cliente p/ autopreencher a criação (por CPF, telefone ou pedido) ─
router.get('/buscar-cliente', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (!q) return res.json({ encontrado: false })
    const { getBlingClient } = require('./blingClient')
    const bling = await getBlingClient()
    const doc = q.replace(/\D/g, '')
    let contato = null, pedidoNum = null

    // Pelo número do pedido → pega contato do pedido
    if (/^\d{4,8}$/.test(q)) {
      const rp = await bling.get(`/pedidos/vendas?numero=${q}&limite=1`).catch(()=>null)
      const ped = rp?.data?.data?.[0]
      if (ped) { pedidoNum = ped.numero
        const rd = await bling.get(`/pedidos/vendas/${ped.id}`).catch(()=>null)
        contato = rd?.data?.data?.contato }
    }
    // Por CPF/CNPJ
    if (!contato && doc.length >= 11) {
      const rc = await bling.get(`/contatos?numeroDocumento=${doc}&limite=1`).catch(()=>null)
      contato = rc?.data?.data?.[0]
    }
    // Por telefone
    if (!contato && doc.length >= 8) {
      const rc = await bling.get(`/contatos?pesquisa=${doc}&limite=1`).catch(()=>null)
      contato = rc?.data?.data?.[0]
    }
    if (!contato) return res.json({ encontrado: false })

    const cid = contato.id
    const full = await bling.get(`/contatos/${cid}`).catch(()=>null)
    const c = full?.data?.data || contato
    const e = c.endereco?.geral || c.endereco || {}
    // Últimos pedidos do contato
    let pedidos = []
    try {
      const rpe = await bling.get(`/pedidos/vendas?idContato=${cid}&limite=5`).catch(()=>null)
      pedidos = (rpe?.data?.data || []).map(p => ({ numero: p.numero, total: p.total, data: p.data }))
    } catch {}
    // Reincidência: tickets anteriores deste telefone
    let tickets_cliente = { total: 0, aberto: null }
    try {
      const telC = (c.telefone || c.celular || '').replace(/\D/g,'').slice(-8)
      if (telC) {
        const rtk = await query(`
          SELECT COUNT(*) AS total,
                 (SELECT ticket_id FROM ocorrencias WHERE regexp_replace(telefone,'\\D','','g') LIKE '%'||$1 AND status='aberta' LIMIT 1) AS aberto
            FROM ocorrencias WHERE regexp_replace(telefone,'\\D','','g') LIKE '%'||$1`, [telC])
        tickets_cliente = { total: parseInt(rtk.rows[0].total||0), aberto: rtk.rows[0].aberto }
      }
    } catch {}
    res.json({
      encontrado: true,
      cliente: { nome: c.nome, email: c.email, telefone: c.telefone || c.celular,
        documento: c.numeroDocumento,
        endereco: [e.endereco, e.numero].filter(Boolean).join(', '),
        cidade: e.municipio, uf: e.uf, cep: e.cep },
      pedido_sugerido: pedidoNum,
      pedidos, tickets_cliente,
    })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── Detalhe de um pedido vinculado ao ticket (itens, foto, NF, rastreio) ─────
router.get('/pedido/:numero/detalhe', async (req, res) => {
  try {
    const { getBlingClient } = require('./blingClient')
    const bling = await getBlingClient()
    const rb = await bling.get(`/pedidos/vendas?numero=${req.params.numero}&limite=1`)
    const lista = rb.data?.data || []
    if (!lista.length) return res.status(404).json({ erro: 'Pedido não encontrado' })
    const rd = await bling.get(`/pedidos/vendas/${lista[0].id}`)
    const p = rd.data?.data
    if (!p) return res.status(404).json({ erro: 'Pedido não encontrado' })

    // Imagem de cada item (catálogo local, 1 query)
    const itens = await Promise.all((p.itens||[]).map(async it => {
      let imagem = null
      try {
        const ri = await query(`SELECT imagens FROM catalogo_produtos WHERE bling_id=$1 OR codigo=$2 LIMIT 1`,
          [it.produto?.id || 0, it.codigo || ''])
        const imgs = ri.rows[0]?.imagens
        imagem = Array.isArray(imgs) ? imgs[0] : (typeof imgs==='string' ? JSON.parse(imgs||'[]')[0] : null)
      } catch {}
      return { codigo: it.codigo, descricao: it.descricao, quantidade: it.quantidade,
               unidade: it.unidade, valor: it.valor, produto_id: it.produto?.id, imagem }
    }))

    // Rastreio do cache + timeline de eventos
    let rastreio = null
    try {
      const rr = await query(`SELECT codigo, ultimo_evento, ultimo_status, eventos, atualizado_em FROM rastreio_cache WHERE numero_pedido=$1`, [String(req.params.numero)])
      if (rr.rows[0]) {
        rastreio = rr.rows[0]
        rastreio.eventos = Array.isArray(rr.rows[0].eventos) ? rr.rows[0].eventos
          : (typeof rr.rows[0].eventos === 'string' ? JSON.parse(rr.rows[0].eventos||'[]') : [])
      }
    } catch {}

    // Timeline consolidada: marcos do pedido + eventos da transportadora,
    // com detecção de atraso (postado há muito sem entrega)
    const sitId = p.situacao?.id || p.situacao?.valor?.id
    const fase = (() => {
      const ev = (rastreio?.ultimo_status || '').toLowerCase()
      if (/entregue|entreg/.test(ev) || sitId === 30) return 'entregue'
      if (rastreio?.codigo || sitId === 27) return 'transito'
      if (p.dataSaida && p.dataSaida !== '0000-00-00') return 'postado'
      return 'preparando'
    })()
    const diasPostado = (p.dataSaida && p.dataSaida!=='0000-00-00')
      ? Math.floor((Date.now() - new Date(p.dataSaida).getTime())/86400000) : null
    const diasSemMov = rastreio?.atualizado_em
      ? Math.floor((Date.now() - new Date(rastreio.atualizado_em).getTime())/86400000) : null
    const atrasado = fase!=='entregue' && ((diasSemMov!=null && diasSemMov>=4) || (diasPostado!=null && diasPostado>=12))
    const timeline = {
      fase, atrasado, dias_postado: diasPostado, dias_sem_movimento: diasSemMov,
      marcos: [
        { chave:'preparando', label:'Pedido recebido', data: p.data, ok: true },
        { chave:'postado',    label:'Postado / coletado', data: (p.dataSaida&&p.dataSaida!=='0000-00-00')?p.dataSaida:null, ok: ['postado','transito','entregue'].includes(fase) },
        { chave:'transito',   label:'Em trânsito',  data: rastreio?.codigo?rastreio.atualizado_em:null, ok: ['transito','entregue'].includes(fase) },
        { chave:'entregue',   label:'Entregue',     data: fase==='entregue'?rastreio?.atualizado_em:null, ok: fase==='entregue' },
      ],
    }

    const sit = p.situacao?.id || p.situacao?.valor?.id
    res.json({
      numero: p.numero, id: p.id, situacao_id: sit,
      data: p.data, dataSaida: p.dataSaida, dataPrevista: p.dataPrevista,
      total: p.total, totalProdutos: p.totalProdutos,
      transporte: {
        frete: p.transporte?.frete, transportadora: p.transporte?.contato?.nome,
        prazo: p.transporte?.prazoEntrega,
        etiqueta: p.transporte?.etiqueta,
      },
      nota_fiscal: p.notaFiscal?.id ? { id: p.notaFiscal.id } : null,
      itens, rastreio, timeline,
    })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── PATCH /:id/item-pedido — sinaliza item (não enviado, estornado, etc.) ────
router.post('/:id/item-pedido', async (req, res) => {
  try {
    const { numero_pedido, item_codigo, item_descricao, situacao, motivo, por } = req.body || {}
    const r = await query('SELECT historico FROM ocorrencias WHERE id=$1', [req.params.id])
    if (!r.rows.length) return res.status(404).json({ erro: 'Não encontrado' })
    const hist = r.rows[0].historico || []
    const SIT_LABEL = { nao_enviado:'Produto não enviado', fora_estoque:'Fora de estoque',
      estornado:'Estorno efetivado', reenvio:'Reenvio programado', avaria:'Produto avariado' }
    hist.push({ acao:'item_sinalizado', por: por||'agente', em:new Date().toISOString(),
      nota:`${SIT_LABEL[situacao]||situacao} — ${item_descricao||item_codigo} (pedido #${numero_pedido})${motivo?`: ${motivo}`:''}`,
      meta: { numero_pedido, item_codigo, situacao, motivo } })
    await query('UPDATE ocorrencias SET historico=$1, atualizado_em=NOW() WHERE id=$2', [JSON.stringify(hist), req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── PATCH /:id/cliente — editar nome do cliente no ticket ─────────────────────
router.post('/:id/cliente', async (req, res) => {
  try {
    const nome = String(req.body?.nome || '').slice(0, 120)
    await query('UPDATE ocorrencias SET nome_cliente=$1, atualizado_em=NOW() WHERE id=$2', [nome, req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── AÇÃO: gerar cupom de compensação para o cliente do ticket ────────────────
router.post('/:id/gerar-compensacao', async (req, res) => {
  try {
    const cfg = await getConfig()
    if (!cfg.oferecer_compensacao) return res.status(403).json({ erro: 'Compensação desativada nas configurações do módulo' })
    const rOc = await query('SELECT * FROM ocorrencias WHERE id=$1', [req.params.id])
    if (!rOc.rows.length) return res.status(404).json({ erro: 'Não encontrado' })
    const oc = rOc.rows[0]
    if (!oc.telefone) return res.status(400).json({ erro: 'Ticket sem telefone' })

    // Gera cupom pessoal via módulo de cupons (regra ticket_atraso ou percentual informado)
    let cupom = null
    try {
      const cuponsMod = require('./cupons-api')
      if (cuponsMod.gerarCupomPessoal) {
        const r = await cuponsMod.gerarCupomPessoal({ telefone: oc.telefone, regra: 'ticket_atraso' })
        cupom = r.cupom
      }
    } catch (e) { console.warn('[compensacao]', e.message) }
    if (!cupom) return res.status(400).json({ erro: 'Nenhum cupom-modelo de compensação configurado. Crie um cupom com regra "Compensação de atraso" no módulo de Cupons.' })

    const hist = oc.historico || []
    hist.push({ acao:'compensacao', por: req.body?.por || 'agente', em:new Date().toISOString(),
      nota:`Cupom de compensação gerado: ${cupom.codigo}` })
    await query('UPDATE ocorrencias SET historico=$1, atualizado_em=NOW() WHERE id=$2', [JSON.stringify(hist), oc.id])
    res.json({ ok: true, codigo: cupom.codigo, explicacao: require('./cupons-api').explicarCupom(cupom) })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── Checklist por tipo: roteiro de resolução guiado ──────────────────────────
const CHECKLISTS = {
  extravio: ['Confirmar com a transportadora que o pacote está extraviado','Verificar prazo de garantia (7 dias CDC)','Decidir: reenvio ou reembolso','Comunicar a decisão ao cliente com prazo'],
  atraso:   ['Conferir último evento de rastreio','Verificar se o prazo realmente estourou','Informar o cliente que estamos acompanhando','Definir data de retorno com posição concreta'],
  produto:  ['Pedir foto/vídeo do problema','Confirmar se é defeito ou avaria de transporte','Decidir: troca, reposição ou reembolso','Enviar etiqueta de devolução se aplicável'],
  troca:    ['Confirmar que o item está nas condições de troca','Gerar etiqueta de postagem','Aguardar chegada do item','Processar a troca/reembolso'],
  pagamento:['Verificar status do pagamento no Bling','Confirmar se houve cobrança duplicada','Solicitar estorno se aplicável','Confirmar o estorno ao cliente'],
}
router.get('/:id/checklist', async (req, res) => {
  try {
    const r = await query('SELECT tipo, checklist FROM ocorrencias WHERE id=$1', [req.params.id])
    if (!r.rows.length) return res.status(404).json({ erro: 'Não encontrado' })
    const salvos = Array.isArray(r.rows[0].checklist) ? r.rows[0].checklist : []
    const base = CHECKLISTS[r.rows[0].tipo] || []
    // Mescla: usa os itens-base, marcando os já concluídos
    const concluidos = new Set(salvos.filter(i=>i.ok).map(i=>i.texto))
    const itens = (salvos.length ? salvos.map(i=>i.texto) : base).map(txt => ({ texto: txt, ok: concluidos.has(txt) }))
    res.json({ itens, tem_base: base.length>0 })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})
router.post('/:id/checklist', async (req, res) => {
  try {
    await query('UPDATE ocorrencias SET checklist=$1, atualizado_em=NOW() WHERE id=$2',
      [JSON.stringify(req.body?.itens || []), req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── Criar ticket A PARTIR DA CONVERSA do WhatsApp ────────────────────────────
router.post('/da-conversa', async (req, res) => {
  try {
    const tel = String(req.body?.telefone || '').replace(/\D/g, '')
    if (!tel) return res.status(400).json({ erro: 'telefone obrigatório' })
    // Bloqueio de duplicado: já existe ticket aberto?
    const aberto = await query(
      `SELECT ticket_id FROM ocorrencias WHERE regexp_replace(telefone,'\\D','','g') LIKE '%'||$1 AND status='aberta' LIMIT 1`,
      [tel.slice(-8)])
    // Puxa últimas mensagens como descrição
    const msgs = await query(
      `SELECT direcao, conteudo, criado_em FROM mensagens
        WHERE regexp_replace(telefone,'\\D','','g') LIKE '%'||$1 ORDER BY criado_em DESC LIMIT 8`, [tel.slice(-8)])
    const transcricao = msgs.rows.reverse().map(m =>
      `${m.direcao==='saida'?'Molise':'Cliente'}: ${String(m.conteudo||'').slice(0,160)}`).join('\n')
    res.json({
      ticket_aberto: aberto.rows[0]?.ticket_id || null,
      transcricao,
      descricao_sugerida: transcricao.slice(0, 800),
    })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── MACRO: resolver em 1 clique (envia resposta + status resolvida + CSAT) ───
router.post('/:id/macro-resolver', async (req, res) => {
  try {
    const { mensagem, por } = req.body || {}
    const rOc = await query('SELECT * FROM ocorrencias WHERE id=$1', [req.params.id])
    if (!rOc.rows.length) return res.status(404).json({ erro: 'Não encontrado' })
    const oc = rOc.rows[0]
    const hist = oc.historico || []
    const autor = por || 'agente'
    if (mensagem && oc.telefone) {
      try { const { sendWhatsAppMessage } = require('../services/whatsapp'); await sendWhatsAppMessage(oc.telefone, mensagem) } catch {}
      hist.push({ acao:'whatsapp', por:autor, em:new Date().toISOString(), nota:`Resposta final: ${mensagem.slice(0,120)}` })
    }
    hist.push({ acao:'status→resolvida', por:autor, em:new Date().toISOString(), nota:'Resolvido via macro de 1 clique' })
    await query(`UPDATE ocorrencias SET status='resolvida', resolvido_em=NOW(), historico=$1, atualizado_em=NOW() WHERE id=$2`,
      [JSON.stringify(hist), req.params.id])
    // Dispara CSAT (mesma regra do PATCH)
    try {
      const ja = await query('SELECT 1 FROM ocorrencias_csat WHERE ocorrencia_id=$1', [req.params.id])
      if (!ja.rows.length && oc.telefone) {
        await query(`INSERT INTO ocorrencias_csat(ocorrencia_id, telefone) VALUES($1,$2)`, [req.params.id, oc.telefone])
        const { sendWhatsAppMessage } = require('../services/whatsapp')
        await sendWhatsAppMessage(oc.telefone, `Seu atendimento foi concluído.\n\nDe *1 a 5*, que nota você dá para a resolução? Responda só com o número.`)
      }
    } catch {}
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── POST /:id/sugerir-resposta — IA redige a resposta com o contexto ─────────
router.post('/:id/sugerir-resposta', async (req, res) => {
  try {
    const { contexto_extra, tom } = req.body || {}
    const rOc = await query('SELECT * FROM ocorrencias WHERE id=$1', [req.params.id])
    if (!rOc.rows.length) return res.status(404).json({ erro: 'Não encontrada' })
    const oc = rOc.rows[0]
    if (!process.env.GEMINI_API_KEY) return res.status(400).json({ erro: 'GEMINI_API_KEY não configurada' })

    const { GoogleGenAI } = require('@google/genai')
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const hist = (oc.historico || []).slice(-6).map(h => `- [${h.acao}] ${h.nota || ''}`).join('\n')
    const prompt = [
      'Você é Molise, consultora da Só Strass (bijuterias e artesanato, Limeira/SP).',
      'Redija UMA resposta de WhatsApp para o cliente do ticket abaixo.',
      'Regras DURAS: máx 1 emoji (somente 💎🔒📄🚚⏳🎉), sem diminutivos (olhadinha/minutinho), sem reticências,',
      'negrito *apenas* em dados (números, prazos, valores), vírgula decimal em valores, UMA pergunta no máximo, no fim.',
      'Estrutura: reconhecimento do problema → informação/solução concreta → próximo passo com prazo.',
      `Tom: ${tom || 'empático e resolutivo'}.`,
      '',
      `Ticket ${oc.ticket_id} — tipo: ${oc.tipo} — prioridade: ${oc.prioridade}`,
      `Título: ${oc.titulo || '-'}`,
      `Descrição: ${oc.descricao || '-'}`,
      `Pedido: ${oc.numero_pedido || '-'} | Cliente: ${oc.nome_cliente || '-'}`,
      hist ? `Histórico recente:\n${hist}` : '',
      contexto_extra ? `Contexto adicional do atendente: ${contexto_extra}` : '',
      '',
      'Responda APENAS com o texto da mensagem, sem aspas nem explicações.',
    ].filter(Boolean).join('\n')

    const result = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', contents: prompt,
      config: { maxOutputTokens: 2048, temperature: 0.6, thinkingConfig: { thinkingBudget: 0 } },
    })
    // Extrai texto de todas as parts (não só .text, que às vezes vem vazio com thinking)
    let txt = result.text || ''
    if (!txt && result.candidates?.[0]?.content?.parts)
      txt = result.candidates[0].content.parts.map(p=>p.text||'').join('')
    res.json({ resposta: txt.trim() })
  } catch (e) {
    console.error('[sugerir-resposta]', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /:id — detalhe ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const r = await query('SELECT * FROM ocorrencias WHERE id=$1', [req.params.id])
    if (!r.rows.length) return res.status(404).json({ erro: 'Não encontrada' })
    res.json({ ocorrencia: fmt(r.rows[0]) })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── GET /:id/bling — dados reais do Bling ─────────────────────────────────────
// Retorna: dados do cliente (nome, CPF, endereço, email, fone) + pedidos reais
router.get('/:id/bling', async (req, res) => {
  try {
    const ocR = await query('SELECT * FROM ocorrencias WHERE id=$1', [req.params.id])
    if (!ocR.rows.length) return res.status(404).json({ erro: 'Não encontrada' })
    const oc = ocR.rows[0]

    const resultado = { cliente: null, pedidos: [], aviso: null }

    const { getBlingClient } = require('../utils/blingClient')
    const bling = await getBlingClient()

    let contatoId = null

    // ── Estratégia A: CPF/CNPJ do banco local ────────────────────────────────
    let cpfCnpj = null
    if (oc.telefone) {
      const cR = await query(
        'SELECT cpf_cnpj, nome, email FROM contatos WHERE telefone=$1', [oc.telefone]
      ).catch(() => ({ rows: [] }))
      if (cR.rows[0]?.cpf_cnpj) {
        cpfCnpj = cR.rows[0].cpf_cnpj
        resultado.cliente = {
          nome:    cR.rows[0].nome  || oc.nome_cliente,
          email:   cR.rows[0].email || oc.email,
          telefone: oc.telefone,
          origem:  'banco_local',
        }
      }
    }

    // ── Estratégia B: telefone direto no Bling (sempre tenta) ────────────────
    if (oc.telefone) {
      try {
        const telLimpo = oc.telefone.replace(/\D/g, '').replace(/^55/, '')
        const rTel = await bling.get(`/contatos?pesquisa=${telLimpo}&limite=1`)
        const cli  = rTel.data?.data?.[0]
        if (cli) {
          contatoId = cli.id
          resultado.cliente = {
            id:         cli.id,
            nome:       cli.nome || cli.razaoSocial || resultado.cliente?.nome || oc.nome_cliente,
            email:      cli.email || resultado.cliente?.email || oc.email,
            telefone:   cli.telefone || oc.telefone,
            celular:    cli.celular,
            cidade:     cli.endereco?.municipio,
            estado:     cli.endereco?.uf,
            logradouro: [cli.endereco?.endereco, cli.endereco?.numero].filter(Boolean).join(', '),
            bairro:     cli.endereco?.bairro,
            cep:        cli.endereco?.cep,
            cpf_cnpj:   cpfCnpj || cli.numeroDocumento || cli.cnpj,
            origem:     'bling',
          }
        }
      } catch (e) { console.warn('Bling tel:', e.message?.slice(0,50)) }
    }

    // ── Estratégia C: CPF/CNPJ no Bling ──────────────────────────────────────
    if (!resultado.cliente?.id && cpfCnpj) {
      try {
        const cpfLimpo = cpfCnpj.replace(/\D/g, '')
        const campo    = cpfLimpo.length === 14 ? 'cnpj' : 'numeroDocumento'
        const rCli     = await bling.get(`/contatos?${campo}=${cpfLimpo}&limite=1`)
        const cli      = rCli.data?.data?.[0]
        if (cli) {
          contatoId = cli.id
          resultado.cliente = {
            id:         cli.id,
            nome:       cli.nome || cli.razaoSocial,
            email:      cli.email || oc.email,
            telefone:   cli.telefone || oc.telefone,
            cidade:     cli.endereco?.municipio,
            estado:     cli.endereco?.uf,
            logradouro: [cli.endereco?.endereco, cli.endereco?.numero].filter(Boolean).join(', '),
            bairro:     cli.endereco?.bairro,
            cep:        cli.endereco?.cep,
            cpf_cnpj:   cpfCnpj,
            origem:     'bling',
          }
        }
      } catch (e) { console.warn('Bling cpf:', e.message?.slice(0,50)) }
    }

    // ── Estratégia D: pedido direto no Bling (sempre tenta se tiver número) ──
    const sitMap = {
      6:'Aberto', 9:'Atendido', 12:'Cancelado', 14:'Faturado',
      15:'Verificado', 24:'NF emitida', 27:'Em andamento', 30:'Entregue', 33:'Não entregue'
    }

    if (oc.numero_pedido) {
      try {
        const rPed = await bling.get(`/pedidos/vendas?numero=${oc.numero_pedido}&limite=1`)
        const ped  = rPed.data?.data?.[0]
        if (ped) {
          // Preenche cliente do pedido se não tiver ainda
          if (!resultado.cliente && ped.contato) {
            contatoId = ped.contato.id
            resultado.cliente = {
              id:      ped.contato.id,
              nome:    ped.contato.nome,
              email:   oc.email,
              telefone: oc.telefone,
              origem:  'bling_pedido',
            }
            // Detalha o contato para pegar endereço
            try {
              const rCont = await bling.get(`/contatos/${ped.contato.id}`)
              const cont  = rCont.data?.data
              if (cont) Object.assign(resultado.cliente, {
                email:      cont.email || oc.email,
                celular:    cont.celular,
                cidade:     cont.endereco?.municipio,
                estado:     cont.endereco?.uf,
                logradouro: [cont.endereco?.endereco, cont.endereco?.numero].filter(Boolean).join(', '),
                bairro:     cont.endereco?.bairro,
                cep:        cont.endereco?.cep,
                cpf_cnpj:   cont.numeroDocumento || cont.cnpj,
              })
            } catch {}
          }

          resultado.pedidos = [{
            id:             ped.id,
            numero:         ped.numero,
            data:           ped.data ? new Date(ped.data).toLocaleDateString('pt-BR') : '—',
            situacao:       sitMap[ped.situacao?.id] || String(ped.situacao?.id || '—'),
            total:          ped.totalProdutos ? `R$ ${Number(ped.totalProdutos).toFixed(2).replace('.',',')}` : '—',
            frete:          ped.totalVenda && ped.totalProdutos ? `R$ ${(Number(ped.totalVenda)-Number(ped.totalProdutos)).toFixed(2).replace('.',',')}` : null,
            rastreio:       ped.transporte?.volumes?.[0]?.codigoRastreamento || ped.codigoRastreamento || null,
            transportadora: ped.transporte?.transportadora?.nome || ped.transportadora?.nome || null,
            itens: (ped.itens || []).map(i => ({
              nome:       i.descricao,
              codigo:     i.codigo,
              quantidade: i.quantidade,
              valorUnit:  i.valor ? `R$ ${Number(i.valor).toFixed(2).replace('.',',')}` : '—',
            })),
          }]
          resultado.pedidos = await _rastreioCache(resultado.pedidos, 'rastreio')
        }
      } catch (e) { console.warn('Bling pedido:', e.message?.slice(0,80)) }
    }

    // ── Estratégia E: últimos pedidos pelo contato Bling ─────────────────────
    const idContato = contatoId || resultado.cliente?.id
    if (idContato && resultado.pedidos.length === 0) {
      try {
        const rPeds = await bling.get(`/pedidos/vendas?idContato=${idContato}&limite=8`)
        resultado.pedidos = (rPeds.data?.data || []).map(p => ({
          id:             p.id,
          numero:         p.numero,
          data:           p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '—',
          situacao:       sitMap[p.situacao?.id] || String(p.situacao?.id || '—'),
          total:          p.totalProdutos ? `R$ ${Number(p.totalProdutos).toFixed(2).replace('.',',')}` : '—',
          rastreio:       p.transporte?.volumes?.[0]?.codigoRastreamento || p.codigoRastreamento || null,
          transportadora: p.transporte?.transportadora?.nome || p.transportadora?.nome || null,
          itens:          [],
        }))
        resultado.pedidos = await _rastreioCache(resultado.pedidos, 'rastreio')
      } catch (e) { console.warn('Bling pedidos contato:', e.message?.slice(0,50)) }
    }

    // Mesmo sem cliente/pedidos, salva o que temos da ocorrência
    if (!resultado.cliente) {
      resultado.cliente = {
        nome:     oc.nome_cliente || null,
        email:    oc.email        || null,
        telefone: oc.telefone     || null,
        origem:   'ocorrencia',
      }
    }

    if (!contatoId && !resultado.pedidos.length && !oc.numero_pedido) {
      resultado.aviso = 'Telefone não localizado no Bling. Verifique se o cadastro existe.'
    }

    res.json(resultado)
  } catch (e) {
    console.error('Bling ocorrência:', e.message)
    res.status(500).json({ erro: e.message, cliente: null, pedidos: [] })
  }
})


// ── POST / — criar ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { telefone, email, nomeCliente, numeroPedido, titulo, tipo, descricao, prioridade, atribuidoA, canal, cpfCnpj } = req.body
  try {
    // ── REGRA DE ESTEIRA: 1 ticket ABERTO por cliente ────────────────────────
    // Se já existe ticket 'aberta' do mesmo telefone, novas informações são
    // ANEXADAS ao ticket existente (timeline) — nunca um ticket paralelo.
    // Em andamento / resolvida / encerrada → aí sim nasce um ticket novo.
    if (telefone) {
      const aberto = await query(
        `SELECT * FROM ocorrencias WHERE telefone=$1 AND status='aberta' ORDER BY criado_em DESC LIMIT 1`,
        [String(telefone)])
      if (aberto.rows.length) {
        const tk = aberto.rows[0]
        const hist = tk.historico || []
        hist.push({
          acao: 'cliente_adicionou', por: nomeCliente || 'cliente',
          em: new Date().toISOString(),
          nota: [titulo, descricao].filter(Boolean).join(' — ') || 'Nova informação do cliente',
        })
        const upd = await query(
          `UPDATE ocorrencias SET historico=$1, atualizado_em=NOW(),
                  numero_pedido = CASE WHEN numero_pedido='' THEN $3 ELSE numero_pedido END
            WHERE id=$2 RETURNING *`,
          [JSON.stringify(hist), tk.id, numeroPedido || ''])
        console.log(`[Ocorrências] info anexada ao ticket aberto ${tk.ticket_id} (${telefone})`)
        return res.status(200).json({ anexado: true, ticket_existente: true, ocorrencia: upd.rows[0] })
      }
    }
    // ── ITEM 7: duplicado potencial — mesmo pedido em ticket recente fechado ─
    if (numeroPedido && !req.body.forcar) {
      const dup = await query(`
        SELECT id, ticket_id, titulo, status, resolvido_em FROM ocorrencias
         WHERE numero_pedido=$1 AND status IN ('resolvida','encerrada')
           AND criado_em > NOW() - INTERVAL '30 days'
         ORDER BY criado_em DESC LIMIT 1`, [String(numeroPedido)])
      if (dup.rows.length) {
        return res.status(200).json({ duplicado_potencial: dup.rows[0] })
      }
    }
    const ticketId = await gerarTicketId()
    const r = await query(`
      INSERT INTO ocorrencias(ticket_id,telefone,email,nome_cliente,numero_pedido,titulo,tipo,descricao,prioridade,atribuido_a,canal,cpf_cnpj,historico)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
    `, [
      ticketId,
      telefone||''    , email||''      , nomeCliente||''  , numeroPedido||'',
      titulo  ||''    , tipo  ||'outro', descricao ||''  , prioridade||'normal',
      atribuidoA||''  , canal||'whatsapp', (cpfCnpj||'').replace(/[^0-9./-]/g,''),
      JSON.stringify([{ acao:'criada', por:'atendente', em:new Date().toISOString(), nota: descricao||'Ocorrência criada' }])
    ])
    const oc = r.rows[0]

    // Envia confirmação de abertura ao cliente via WhatsApp
    if (oc.telefone) {
      try {
        const axios = require('axios')
        const tipoLabel = {
          entrega:'Entrega', atraso:'Atraso na entrega', extravio:'Pedido extraviado',
          troca:'Troca/Devolução', pagamento:'Pagamento', produto:'Produto', outro:'Outro assunto'
        }[oc.tipo] || oc.tipo

        // Tenta buscar template personalizado do banco (editável na aba Gatilhos)
        let msgConfirmacao = null
        try {
          const tplR = await query(
            `SELECT corpo, cab, rod FROM templates WHERE gatilho_id = 'ocorrencia_abertura' AND ativo = true LIMIT 1`
          ).catch(() => ({ rows: [] }))
          if (tplR.rows.length) {
            const tpl = tplR.rows[0]
            const corpo = (tpl.corpo || '')
              .replace(/{{nome_cliente}}/g,   oc.nome_cliente?.split(' ')[0] || 'cliente')
              .replace(/{{ticket_id}}/g,       ticketId)
              .replace(/{{tipo_ocorrencia}}/g, tipoLabel)
              .replace(/{{numero_pedido}}/g,   oc.numero_pedido ? `📦 *Pedido:* #${oc.numero_pedido}` : '')
              .replace(/{{descricao}}/g,       (oc.descricao||'').slice(0,200))
            const cab = tpl.cab?.replace(/{{ticket_id}}/g, ticketId) || ''
            msgConfirmacao = (cab ? cab + '\n\n' : '') + corpo + (tpl.rod ? '\n\n' + tpl.rod : '')
          }
        } catch {}

        // Fallback: mensagem padrão se não houver template salvo
        if (!msgConfirmacao) {
          const nomePrimeiro = oc.nome_cliente ? ` *${oc.nome_cliente.split(' ')[0]}*` : ''
          msgConfirmacao =
            `✅ *Chamado aberto — ${ticketId}*\n\n` +
            `Olá${nomePrimeiro}! Recebemos sua solicitação e abrimos um chamado para acompanhamento.\n\n` +
            `📋 *Protocolo:* ${ticketId}\n` +
            `🏷️ *Assunto:* ${tipoLabel}\n` +
            (oc.numero_pedido ? `📦 *Pedido:* #${oc.numero_pedido}\n` : '') +
            `\n*Sua solicitação:*\n_${(oc.descricao||'').slice(0,200)}${(oc.descricao||'').length > 200 ? '...' : ''}_\n\n` +
            `Nossa equipe irá analisar e retornará em breve. Guarde este protocolo.\n\n` +
            `_Só Strass — Atendimento ao Cliente_`
        }

        await axios.post(
          `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
          { messaging_product:'whatsapp', to: oc.telefone, type:'text', text:{ body: msgConfirmacao } },
          { headers:{ Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}` }, timeout:10000 }
        )

        // Registra no histórico
        const histAtual = oc.historico || []
        histAtual.push({ acao:'confirmacao_enviada', por:'sistema', em:new Date().toISOString(), nota:`Confirmação de abertura enviada ao cliente via WhatsApp (${ticketId})` })
        await query(`UPDATE ocorrencias SET historico=$1 WHERE id=$2`, [JSON.stringify(histAtual), oc.id])

        // Salva na tabela de mensagens
        await query(
          `INSERT INTO mensagens(telefone,conteudo,direcao,motor,modo,criado_em) VALUES($1,$2,'saida','sistema','auto',NOW())`,
          [oc.telefone, msgConfirmacao]
        ).catch(()=>{})

        console.log(`✅ Confirmação ticket ${ticketId} enviada para ${oc.telefone}`)
      } catch(e) {
        console.error('Erro enviar confirmação ticket:', e.message)
      }
    }

    res.json({ ocorrencia: fmt(oc) })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── PATCH /:id — atualizar ────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  const { status, prioridade, atribuidoA, respostaCliente, nota, por, titulo, email, nomeCliente, numeroPedido } = req.body
  try {
    const atual = await query('SELECT * FROM ocorrencias WHERE id=$1', [req.params.id])
    if (!atual.rows.length) return res.status(404).json({ erro: 'Não encontrada' })

    const hist = atual.rows[0].historico || []
    const autor = por || 'atendente'

    if (nota && !status) { hist.push({ acao:'nota', por:autor, em:new Date().toISOString(), nota }) }
    // Mudança de status SEMPRE carrega a AÇÃO executada (nota do agente)
    if (status) { hist.push({ acao:`status→${status}`, por:autor, em:new Date().toISOString(),
      nota: nota || `Status alterado para ${status}` }) }

    // Estado "aguardando cliente": pausa/retoma o relógio do SLA
    if (status === 'aguardando_cliente') {
      campos.push(`aguardando_desde=NOW()`)
    } else if (status && status !== 'aguardando_cliente') {
      // Saiu do aguardando → acumula o tempo pausado e zera o marcador
      campos.push(`sla_pausado_h = COALESCE(sla_pausado_h,0) + CASE WHEN aguardando_desde IS NOT NULL THEN EXTRACT(EPOCH FROM (NOW()-aguardando_desde))/3600 ELSE 0 END`)
      campos.push(`aguardando_desde=NULL`)
    }

    // FASE 1: resolveu → dispara a pesquisa CSAT no WhatsApp (1x por ticket)
    if (status === 'resolvida') {
      ;(async () => {
        try {
          const rT = await query('SELECT telefone, ticket_id FROM ocorrencias WHERE id=$1', [req.params.id])
          const tel = rT.rows[0]?.telefone
          if (!tel) return
          const ja = await query('SELECT 1 FROM ocorrencias_csat WHERE ocorrencia_id=$1', [req.params.id])
          if (ja.rows.length) return
          await query(`INSERT INTO ocorrencias_csat(ocorrencia_id, telefone) VALUES($1,$2)`, [req.params.id, tel])
          const { sendWhatsAppMessage } = require('../services/whatsapp')
          await sendWhatsAppMessage(tel,
            `Seu atendimento foi concluído. 🎉\n\nDe *1 a 5*, que nota você dá para a resolução do seu caso?\n\nÉ só responder com o número — sua avaliação melhora nosso atendimento.`)
          console.log(`[CSAT] pesquisa enviada — ticket ${rT.rows[0].ticket_id}`)
        } catch (e) { console.warn('[CSAT]', e.message?.slice(0,50)) }
      })()
    }
    if (respostaCliente) { hist.push({ acao:'whatsapp', por:autor, em:new Date().toISOString(), nota:`WhatsApp enviado: "${respostaCliente.slice(0,80)}"` }) }

    const campos = ['atualizado_em=NOW()', 'historico=$1']
    const vals   = [JSON.stringify(hist)]

    if (status)          { vals.push(status);          campos.push(`status=$${vals.length}`) }
    if (prioridade)      { vals.push(prioridade);      campos.push(`prioridade=$${vals.length}`) }
    if (atribuidoA      !== undefined) { vals.push(atribuidoA);       campos.push(`atribuido_a=$${vals.length}`) }
    if (respostaCliente) { vals.push(respostaCliente); campos.push(`resposta_cliente=$${vals.length}`) }
    if (titulo)          { vals.push(titulo);          campos.push(`titulo=$${vals.length}`) }
    if (email)           { vals.push(email);           campos.push(`email=$${vals.length}`) }
    if (nomeCliente)     { vals.push(nomeCliente);     campos.push(`nome_cliente=$${vals.length}`) }
    if (numeroPedido    !== undefined) { vals.push(numeroPedido);      campos.push(`numero_pedido=$${vals.length}`) }
    if (req.body.canal)    { vals.push(req.body.canal);    campos.push(`canal=$${vals.length}`) }
    if (req.body.followupHoras !== undefined) {
      const h = parseInt(req.body.followupHoras)
      if (h > 0) { vals.push(new Date(Date.now() + h*3600000)); campos.push(`followup_em=$${vals.length}`)
        hist.push({ acao:'followup', por:autor, em:new Date().toISOString(), nota:`Follow-up agendado para daqui ${h}h` }) }
      else { campos.push(`followup_em=NULL`) }
    }
    if (Array.isArray(req.body.tags)) {
      vals.push(JSON.stringify(req.body.tags.slice(0,12).map(t=>String(t).slice(0,30))))
      campos.push(`tags=$${vals.length}`)
    }
    if (req.body.atribuirA !== undefined) {
      vals.push(String(req.body.atribuirA).slice(0,100)); campos.push(`atribuido_a=$${vals.length}`)
      hist.push({ acao:'atribuido', por:autor, em:new Date().toISOString(), nota:`Ticket atribuído a ${req.body.atribuirA || 'ninguém'}` })
    }
    if (req.body.cpfCnpj !== undefined) { vals.push(String(req.body.cpfCnpj).replace(/[^0-9./-]/g,'')); campos.push(`cpf_cnpj=$${vals.length}`) }
    if (status === 'resolvida') campos.push('resolvido_em=NOW()')

    vals.push(req.params.id)
    const r = await query(`UPDATE ocorrencias SET ${campos.join(',')} WHERE id=$${vals.length} RETURNING *`, vals)

    // ── Disparo automático por mudança de status ─────────────────────────────
    // Mapa: status → gatilho de ocorrência
    const STATUS_GATILHO = {
      aberta:       'ocorrencia_abertura',
      em_andamento: 'ocorrencia_em_analise',
      resolvida:    'ocorrencia_resolvida',
      encerrada:    'ocorrencia_encerrada',
    }

    if (status && !respostaCliente && atual.rows[0].telefone && STATUS_GATILHO[status]) {
      try {
        const oc      = atual.rows[0]
        const tktId   = oc.ticket_id || ('TK-' + String(oc.id).padStart(4,'0'))
        const gatilho = STATUS_GATILHO[status]
        const statusLabel = { aberta:'Aberta', em_andamento:'Em análise', resolvida:'Resolvida ✅', encerrada:'Encerrada' }[status] || status

        // Busca template do banco (editável na aba Gatilhos)
        let msgAuto = null
        try {
          const tplR = await query(
            'SELECT corpo, cab, rod FROM templates WHERE gatilho_id = $1 AND ativo = true LIMIT 1',
            [gatilho]
          ).catch(() => ({ rows: [] }))

          if (tplR.rows.length) {
            const tpl  = tplR.rows[0]
            const nome = oc.nome_cliente ? oc.nome_cliente.split(' ')[0] : 'cliente'
            const corpo = (tpl.corpo || '')
              .replace(/{{nome_cliente}}/g,  nome)
              .replace(/{{ticket_id}}/g,     tktId)
              .replace(/{{status}}/g,        statusLabel)
              .replace(/{{numero_pedido}}/g, oc.numero_pedido ? ('#' + oc.numero_pedido) : '')
              .replace(/{{descricao}}/g,     (oc.descricao || '').slice(0, 150))
              .replace(/{{transportadora}}/g,'a transportadora')
              .replace(/{{resposta}}/g,      '')
            const cab = (tpl.cab || '').replace(/{{ticket_id}}/g, tktId)
            const rod = tpl.rod || 'Só Strass — Atendimento ao Cliente'
            msgAuto = (cab ? cab + '\n\n' : '') + corpo + '\n\n' + rod
          }
        } catch {}

        // Fallback se não houver template salvo
        if (!msgAuto) {
          const nome = oc.nome_cliente ? oc.nome_cliente.split(' ')[0] : 'cliente'
          const fallbacks = {
            aberta:       `📋 *Chamado reaberto — ${tktId}*\n\nOlá *${nome}*, seu chamado ${tktId} foi reaberto.\n\nSó Strass — Atendimento ao Cliente`,
            em_andamento: `🔍 *Em análise — ${tktId}*\n\nOlá *${nome}*, sua ocorrência *${tktId}* está sendo analisada pela nossa equipe.\n\nEm breve você receberá uma atualização. Obrigado pela paciência!\n\nSó Strass — Atendimento ao Cliente`,
            resolvida:    `✅ *Ocorrência resolvida — ${tktId}*\n\nOlá *${nome}*, ficamos felizes em informar que sua ocorrência *${tktId}* foi resolvida!\n\nQualquer dúvida, estamos à disposição.\n\nSó Strass — Atendimento ao Cliente`,
            encerrada:    `🔒 *Chamado encerrado — ${tktId}*\n\nOlá *${nome}*, seu chamado *${tktId}* foi encerrado.\n\nCaso precise de ajuda novamente, é só nos contatar.\n\nSó Strass — Atendimento ao Cliente`,
          }
          msgAuto = fallbacks[status] || null
        }

        if (msgAuto) {
          const axios = require('axios')
          await axios.post(
            'https://graph.facebook.com/v18.0/' + process.env.WHATSAPP_PHONE_ID + '/messages',
            { messaging_product: 'whatsapp', to: oc.telefone, type: 'text', text: { body: msgAuto } },
            { headers: { Authorization: 'Bearer ' + process.env.WHATSAPP_TOKEN }, timeout: 10000 }
          )
          await query(
            `INSERT INTO mensagens(telefone,conteudo,direcao,motor,modo,criado_em) VALUES($1,$2,'saida','sistema','auto',NOW())`,
            [oc.telefone, msgAuto]
          ).catch(() => {})
          console.log('✅ Auto-msg status', status, tktId, '->', oc.telefone)
        }
      } catch(e) {
        console.error('Auto-msg status:', e.message)
      }
    }

    // ── Envio manual de resposta ao cliente ───────────────────────────────────
    let respostaEnviada = false, respostaErro = null
    if (respostaCliente && atual.rows[0].telefone) {
      try {
        const oc     = atual.rows[0]
        const tktId  = oc.ticket_id || `TK-${String(oc.id).padStart(4,'0')}`
        const nome   = oc.nome_cliente ? `*${oc.nome_cliente.split(' ')[0]}*` : 'cliente'

        // Status novo (se alterado nesta operação)
        const statusNovo = status || oc.status
        const statusLabel = {
          aberta:'Aberta', em_andamento:'Em análise',
          resolvida:'Resolvida ✅', encerrada:'Encerrada'
        }[statusNovo] || statusNovo

        // Monta mensagem estruturada com template do banco (editável na aba Gatilhos)
        // ou usa padrão fixo como fallback
        const descricaoOriginal = (oc.descricao || '').slice(0, 150)
        let msgEstruturada = null

        try {
          const tplR = await query(
            `SELECT corpo, cab, rod FROM templates WHERE gatilho_id = 'ocorrencia_atualizada' AND ativo = true LIMIT 1`
          ).catch(() => ({ rows: [] }))
          if (tplR.rows.length) {
            const tpl = tplR.rows[0]
            const corpo = (tpl.corpo || '')
              .replace(/{{nome_cliente}}/g,  nome.replace(/\*/g, ''))
              .replace(/{{ticket_id}}/g,     tktId)
              .replace(/{{descricao}}/g,     descricaoOriginal + (oc.descricao?.length > 150 ? '...' : ''))
              .replace(/{{resposta}}/g,      respostaCliente)
              .replace(/{{status}}/g,        statusLabel)
            const cab = tpl.cab?.replace(/{{ticket_id}}/g, tktId) || ''
            msgEstruturada = (cab ? cab + '\n\n' : '') + corpo + (tpl.rod ? '\n\n' + tpl.rod : '')
          }
        } catch {}

        if (!msgEstruturada) {
          msgEstruturada =
            `📋 *Atualização — Protocolo ${tktId}*\n\n` +
            `Olá ${nome}!\n\n` +
            `> *Sua solicitação:*\n` +
            `> _${descricaoOriginal}${oc.descricao?.length > 150 ? '...' : ''}_\n\n` +
            `*Nossa resposta:*\n${respostaCliente}\n\n` +
            `—\n` +
            `🏷️ Status: *${statusLabel}*\n` +
            `📋 Protocolo: ${tktId}\n` +
            `_Só Strass — Atendimento ao Cliente_`
        }

        // Usa o serviço central de WhatsApp (mesmo do resto do sistema) — evita
        // divergência de versão da Graph API e centraliza o tratamento de token
        const { sendWhatsAppMessage } = require('../services/whatsapp')
        await sendWhatsAppMessage(oc.telefone, msgEstruturada)

        await query(
          `INSERT INTO mensagens(telefone,conteudo,direcao,motor,modo,criado_em) VALUES($1,$2,'saida','humano','manual',NOW())`,
          [oc.telefone, msgEstruturada]
        ).catch(()=>{})

        console.log(`✅ Resposta estruturada ticket ${tktId} enviada para ${oc.telefone}`)
        respostaEnviada = true
      } catch (e) {
        console.error('WhatsApp ocorrência:', e.response?.data?.error?.message || e.message)
        respostaErro = e.response?.data?.error?.message || e.message
      }
    }

    res.json({ ocorrencia: fmt(r.rows[0]), resposta_enviada: respostaEnviada, resposta_erro: respostaErro })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// ── POST /:id/csat — dispara pesquisa de satisfação ──────────────────────────
router.post('/:id/csat', async (req, res) => {
  try {
    const ocR = await query('SELECT * FROM ocorrencias WHERE id=$1', [req.params.id])
    if (!ocR.rows.length) return res.status(404).json({ erro: 'Não encontrada' })
    const oc = ocR.rows[0]
    if (!oc.telefone) return res.status(400).json({ erro: 'Telefone não cadastrado' })

    // Registra o envio
    const csatR = await query(
      `INSERT INTO ocorrencias_csat(ocorrencia_id, telefone, enviado_em)
       VALUES($1,$2,NOW()) RETURNING id`,
      [oc.id, oc.telefone]
    )
    const csatId = csatR.rows[0].id
    const tktId  = oc.ticket_id || ('TK-' + String(oc.id).padStart(4,'0'))
    const nome   = (oc.nome_cliente||'cliente').split(' ')[0]

    // Monta mensagem com botões de reply
    const msgCsat =
      `⭐ *Como avalia o nosso atendimento?*
` +
      `Protocolo ${tktId} · Só Strass

` +
      `Toque em uma opção:
` +
      `[1] 😞 Péssimo
[2] 😐 Regular
[3] 🙂 Bom
[4] 😊 Ótimo
[5] 🤩 Excelente`

    // Envia via WhatsApp
    const axios = require('axios')
    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: oc.telefone,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: `⭐ *Como avalia o atendimento?*
Protocolo ${tktId}` },
          action: {
            buttons: [
              { type:'reply', reply:{ id:`csat_${csatId}_1`, title:'😞 Péssimo' } },
              { type:'reply', reply:{ id:`csat_${csatId}_3`, title:'🙂 Bom' } },
              { type:'reply', reply:{ id:`csat_${csatId}_5`, title:'🤩 Excelente' } },
            ]
          }
        }
      },
      { headers:{ Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}` }, timeout:10000 }
    ).catch(async () => {
      // Fallback: texto simples se botões não suportados
      await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        { messaging_product:'whatsapp', to:oc.telefone, type:'text', text:{ body:msgCsat } },
        { headers:{ Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}` }, timeout:10000 }
      )
    })

    // Registra no histórico
    const hist = oc.historico || []
    hist.push({ acao:'csat_enviado', por:'sistema', em:new Date().toISOString(), nota:`Pesquisa CSAT enviada ao cliente (ID: ${csatId})` })
    await query(`UPDATE ocorrencias SET historico=$1 WHERE id=$2`, [JSON.stringify(hist), oc.id])

    console.log(`✅ CSAT ${csatId} disparado → ${oc.telefone}`)
    res.json({ ok:true, csatId })
  } catch(e) {
    console.error('CSAT disparo:', e.message)
    res.status(500).json({ erro: e.message })
  }
})

// ── GET /:id/csat — histórico de avaliações da ocorrência + cliente ───────────
router.get('/:id/csat', async (req, res) => {
  try {
    const ocR = await query('SELECT telefone FROM ocorrencias WHERE id=$1', [req.params.id])
    if (!ocR.rows.length) return res.status(404).json({ erro: 'Não encontrada' })
    const tel = ocR.rows[0].telefone

    // Histórico desta ocorrência
    const thisR = await query(
      `SELECT c.*, o.titulo, o.ticket_id
       FROM ocorrencias_csat c
       JOIN ocorrencias o ON o.id = c.ocorrencia_id
       WHERE c.ocorrencia_id=$1
       ORDER BY c.enviado_em DESC`,
      [req.params.id]
    )

    // Histórico do cliente (todas ocorrências com CSAT respondido)
    const clientR = await query(
      `SELECT c.score, c.comentario, c.respondido_em, o.ticket_id, o.titulo, o.id as oc_id
       FROM ocorrencias_csat c
       JOIN ocorrencias o ON o.id = c.ocorrencia_id
       WHERE c.telefone=$1 AND c.score IS NOT NULL
       ORDER BY c.respondido_em DESC LIMIT 10`,
      [tel || '']
    )

    res.json({
      thisTicket: thisR.rows,
      clientHistory: clientR.rows,
    })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})

// ── POST /csat/resposta — registra resposta do cliente (via webhook) ──────────
router.post('/csat/resposta', async (req, res) => {
  try {
    const { csatId, score, comentario } = req.body
    if (!csatId || !score) return res.status(400).json({ erro: 'csatId e score obrigatórios' })

    const r = await query(
      `UPDATE ocorrencias_csat SET score=$1, comentario=$2, respondido_em=NOW()
       WHERE id=$3 RETURNING ocorrencia_id`,
      [parseInt(score), comentario||'', parseInt(csatId)]
    )
    if (!r.rows.length) return res.status(404).json({ erro: 'CSAT não encontrado' })

    // Registra no histórico da ocorrência
    const scoreLabels = {1:'😞 Péssimo',2:'😐 Regular',3:'🙂 Bom',4:'😊 Ótimo',5:'🤩 Excelente'}
    const ocId = r.rows[0].ocorrencia_id
    const ocR  = await query('SELECT historico FROM ocorrencias WHERE id=$1', [ocId])
    const hist = ocR.rows[0]?.historico || []
    hist.push({
      acao:'csat_respondido', por:'cliente', em:new Date().toISOString(),
      nota:`Avaliação CSAT: ${score}/5 — ${scoreLabels[score]||''}${comentario ? ` · "${comentario}"` : ''}`
    })
    await query(`UPDATE ocorrencias SET historico=$1 WHERE id=$2`, [JSON.stringify(hist), ocId])

    res.json({ ok:true })
  } catch(e) {
    res.status(500).json({ erro: e.message })
  }
})

// ── DELETE /:id ───────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM ocorrencias WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

module.exports = router
