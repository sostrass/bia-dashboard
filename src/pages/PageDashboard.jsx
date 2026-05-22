import { useState, useEffect, useCallback } from "react"

const api = import.meta.env.VITE_API_URL || 'https://whatsapp-sostrass.up.railway.app'

const fmt = (n) => Number(n||0).toLocaleString('pt-BR')
const fmtR = (n) => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmtPct = (n) => `${Number(n||0).toFixed(1)}%`

function KPI({ label, value, sub, color = '#1D9E75' }) {
  return (
    <div style={{
      background:'var(--color-background-secondary)',
      border:'0.5px solid var(--color-border-tertiary)',
      borderRadius:12, padding:'20px 24px', minWidth:160, flex:1,
    }}>
      <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:8, letterSpacing:'0.05em', textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:500, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'var(--color-text-tertiary)', marginTop:6 }}>{sub}</div>}
    </div>
  )
}

function Linha({ label, value, pct }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
      <span style={{ fontSize:13, color:'var(--color-text-secondary)' }}>{label}</span>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <span style={{ fontSize:13, fontWeight:500 }}>{value}</span>
        {pct !== undefined && (
          <div style={{ width:60, height:4, background:'var(--color-border-tertiary)', borderRadius:2 }}>
            <div style={{ width:`${Math.min(100,pct)}%`, height:'100%', background:'#1D9E75', borderRadius:2 }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function PageDashboard() {
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('7d')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/stats`)
      const d = await r.json()
      // Mapeia estrutura v6 para formato esperado pelo dashboard
      const mapped = {
        mensagens: { total: d.mensagens?.total_msgs||0, entrada: d.mensagens?.recebidas||0, saida: d.mensagens?.enviadas||0 },
        conversas: { total: d.conversas?.total_conversas||0, ativas: d.conversas?.hoje||0 },
        vendas:    { pedidos: 0, totalVendas: 0 },
        agentes:   { distribuicao: [], total: 0 },
        topProdutos: [],
        ocorrencias: { abertas: 0, em_andamento: 0, urgentes: 0, resolvidas: 0 },
        ultimasConversas: [],
        _statusDist: d.status_distribuicao || [],
      }
      setDados(mapped)
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => { carregar() }, [carregar])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'var(--color-text-secondary)', fontSize:13 }}>
      Carregando...
    </div>
  )

  const m = dados?.mensagens || {}
  const c = dados?.conversas || {}
  const v = dados?.vendas    || {}
  const a = dados?.agentes   || {}

  const taxaResposta = m.total > 0 ? (m.saida / m.total * 100) : 0
  const taxaConversao = c.total > 0 ? (v.pedidos / c.total * 100) : 0

  return (
    <div style={{ padding:'24px 32px', maxWidth:1100 }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:500, margin:0 }}>Dashboard</h1>
          <p style={{ fontSize:13, color:'var(--color-text-secondary)', margin:'4px 0 0' }}>
            Vis\u00e3o geral do atendimento
          </p>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['1d','7d','30d'].map(p => (
            <button key={p} onClick={() => setPeriodo(p)} style={{
              padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer',
              border: periodo === p ? '1px solid #1D9E75' : '1px solid var(--color-border-tertiary)',
              background: periodo === p ? '#E1F5EE' : 'transparent',
              color: periodo === p ? '#0F6E56' : 'var(--color-text-secondary)',
            }}>
              {p === '1d' ? 'Hoje' : p === '7d' ? '7 dias' : '30 dias'}
            </button>
          ))}
          <button onClick={carregar} style={{
            padding:'6px 12px', borderRadius:8, fontSize:12, cursor:'pointer',
            border:'1px solid var(--color-border-tertiary)', background:'transparent',
            color:'var(--color-text-secondary)',
          }}>
            Atualizar
          </button>
        </div>
      </div>

      {/* KPIs principais */}
      <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        <KPI label="Conversas" value={fmt(c.total)} sub={`${fmt(c.ativas)} ativas agora`} />
        <KPI label="Mensagens" value={fmt(m.total)} sub={`${fmt(m.entrada)} recebidas \u00b7 ${fmt(m.saida)} enviadas`} />
        <KPI label="Taxa de resposta" value={fmtPct(taxaResposta)} sub="mensagens respondidas" color={taxaResposta > 80 ? '#1D9E75' : '#D85A30'} />
        <KPI label="Pedidos gerados" value={fmt(v.pedidos)} sub={`${fmtR(v.totalVendas)} em vendas`} color="#4a9fff" />
        <KPI label="Convers\u00e3o" value={fmtPct(taxaConversao)} sub="conversas \u2192 pedidos" color={taxaConversao > 5 ? '#1D9E75' : '#888'} />
      </div>

      {/* Card IA — Saúde e Custos */}
      {iaStats && (
        <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' }}>

          {/* Status da IA */}
          <div style={{
            background:'var(--color-background-secondary)',
            border:'0.5px solid var(--color-border-tertiary)',
            borderRadius:12, padding:'16px 20px', minWidth:200, flex:1
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{
                width:10, height:10, borderRadius:'50%', flexShrink:0,
                background: iaStats.saude?.status === 'operacional' ? '#1D9E75'
                          : iaStats.saude?.status === 'degradado'   ? '#F59E0B'
                          : '#EF4444'
              }} />
              <span style={{ fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--color-text-secondary)' }}>
                Status da IA
              </span>
            </div>
            <div style={{ fontSize:18, fontWeight:600, marginBottom:4, color:
              iaStats.saude?.status === 'operacional' ? '#1D9E75'
            : iaStats.saude?.status === 'degradado'   ? '#F59E0B'
            : '#EF4444'
            }}>
              {iaStats.saude?.status === 'operacional' ? '● Operacional'
             : iaStats.saude?.status === 'degradado'   ? '◑ Degradado'
             : '○ Instável'}
            </div>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>
              {iaStats.saude?.taxa_sucesso}% sucesso · {iaStats.uso?.chamadas_ultima_hora} chamadas/h
            </div>
          </div>

          {/* Custo hoje */}
          <div style={{
            background:'var(--color-background-secondary)',
            border:'0.5px solid var(--color-border-tertiary)',
            borderRadius:12, padding:'16px 20px', minWidth:160, flex:1
          }}>
            <div style={{ fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--color-text-secondary)', marginBottom:8 }}>
              Custo hoje
            </div>
            <div style={{ fontSize:22, fontWeight:600, marginBottom:4 }}>
              US$ {iaStats.uso?.custo_hoje_usd}
            </div>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>
              {iaStats.uso?.chamadas_hoje} chamadas
            </div>
          </div>

          {/* Custo mês */}
          <div style={{
            background:'var(--color-background-secondary)',
            border:'0.5px solid var(--color-border-tertiary)',
            borderRadius:12, padding:'16px 20px', minWidth:160, flex:1
          }}>
            <div style={{ fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--color-text-secondary)', marginBottom:8 }}>
              Custo do mês
            </div>
            <div style={{ fontSize:22, fontWeight:600, marginBottom:4 }}>
              US$ {iaStats.uso?.custo_mes_usd}
            </div>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>
              {iaStats.uso?.total_tokens?.toLocaleString('pt-BR')} tokens total
            </div>
          </div>

          {/* Modelos em uso */}
          {iaStats.modelos?.length > 0 && (
            <div style={{
              background:'var(--color-background-secondary)',
              border:'0.5px solid var(--color-border-tertiary)',
              borderRadius:12, padding:'16px 20px', minWidth:200, flex:2
            }}>
              <div style={{ fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--color-text-secondary)', marginBottom:12 }}>
                Modelos (7 dias)
              </div>
              {iaStats.modelos.map((m, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                  <span style={{ color:'var(--color-text-primary)' }}>{m.modelo}</span>
                  <span style={{ color:'var(--color-text-secondary)' }}>
                    {m.chamadas} chamadas · US$ {parseFloat(m.custo).toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      )}


      {/* Linha 2 \u2014 Agentes e Ocorr\u00eancias */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:24 }}>

        {/* Agentes */}
        <div style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:16 }}>Agentes</div>
          {(a.distribuicao || []).map(ag => (
            <Linha key={ag.nome} label={`${ag.emoji} ${ag.nome}`} value={fmt(ag.mensagens)} pct={a.total > 0 ? ag.mensagens/a.total*100 : 0} />
          ))}
          {!a.distribuicao?.length && <div style={{ fontSize:12, color:'var(--color-text-tertiary)' }}>Sem dados no per\u00edodo</div>}
        </div>

        {/* Top produtos */}
        <div style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:16 }}>Produtos mais buscados</div>
          {(dados?.topProdutos || []).map((p, i) => (
            <Linha key={i} label={p.nome} value={fmt(p.buscas)} />
          ))}
          {!dados?.topProdutos?.length && <div style={{ fontSize:12, color:'var(--color-text-tertiary)' }}>Sem dados no per\u00edodo</div>}
        </div>

        {/* Ocorr\u00eancias */}
        <div style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:16 }}>Ocorr\u00eancias</div>
          <Linha label="Abertas" value={fmt(dados?.ocorrencias?.abertas)} />
          <Linha label="Em andamento" value={fmt(dados?.ocorrencias?.em_andamento)} />
          <Linha label="Urgentes" value={fmt(dados?.ocorrencias?.urgentes)} />
          <Linha label="Resolvidas" value={fmt(dados?.ocorrencias?.resolvidas)} />
          <div style={{ marginTop:16 }}>
            <a href="#/ocorrencias" style={{ fontSize:12, color:'#4a9fff', textDecoration:'none' }}>
              Ver todas as ocorr\u00eancias \u2192
            </a>
          </div>
        </div>
      </div>

      {/* \u00daltimas conversas */}
      <div style={{ background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:20 }}>
        <div style={{ fontSize:13, fontWeight:500, marginBottom:16 }}>\u00daltimas conversas</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ color:'var(--color-text-tertiary)' }}>
              <th style={{ textAlign:'left', paddingBottom:8, fontWeight:500 }}>Contato</th>
              <th style={{ textAlign:'left', paddingBottom:8, fontWeight:500 }}>\u00daltima mensagem</th>
              <th style={{ textAlign:'left', paddingBottom:8, fontWeight:500 }}>Agente</th>
              <th style={{ textAlign:'right', paddingBottom:8, fontWeight:500 }}>H\u00e1</th>
            </tr>
          </thead>
          <tbody>
            {(dados?.ultimasConversas || []).map((c, i) => (
              <tr key={i} style={{ borderTop:'0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding:'8px 0', color:'var(--color-text-primary)' }}>{c.nome || c.telefone}</td>
                <td style={{ padding:'8px 16px 8px 0', color:'var(--color-text-secondary)', maxWidth:300 }}>
                  <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.ultimaMensagem}</div>
                </td>
                <td style={{ padding:'8px 0', color:'var(--color-text-secondary)' }}>{c.agente || '\u2014'}</td>
                <td style={{ padding:'8px 0', textAlign:'right', color:'var(--color-text-tertiary)' }}>{c.tempo}</td>
              </tr>
            ))}
            {!dados?.ultimasConversas?.length && (
              <tr><td colSpan={4} style={{ padding:'16px 0', color:'var(--color-text-tertiary)', textAlign:'center' }}>Sem conversas no per\u00edodo</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
