import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, CreditCard, DollarSign, Clock } from 'lucide-react'

const fmtR = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`

export default function PageCaixa({ api }) {
  const [dados,   setDados]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [aba,     setAba]     = useState('contas')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/financeiro`)
      if (!r.ok) throw new Error()
      setDados(await r.json())
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  const entradas = dados?.entradas_mes    || 0
  const aReceber = dados?.a_receber       || 0
  const mpTotal  = dados?.mp_total_mes    || 0
  const mpTrans  = dados?.mp_transacoes   || 0
  const contas   = dados?.contas_receber  || []
  const mpPgtos  = dados?.mp_pagamentos   || []

  const situacaoLabel = s => ({ 1:'Aberta', 2:'Paga', 3:'Cancelada' }[s] || `${s}`)
  const situacaoCor   = s => ({ 1:'#EF9F27', 2:'#1D9E75', 3:'#EF4444' }[s] || '#888')

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 28px', maxWidth:1140 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:500, margin:0, color:'var(--label)' }}>Fluxo de Caixa</h1>
          <p style={{ fontSize:13, color:'var(--label-3)', margin:'3px 0 0' }}>Bling + Mercado Pago</p>
        </div>
        <button onClick={carregar} style={{ width:32, height:32, borderRadius:8, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:20 }}>
        {[
          { icon:TrendingUp,  label:'Entradas do mês',  value:fmtR(entradas), color:'#1D9E75', sub:'Bling' },
          { icon:Clock,       label:'A receber',         value:fmtR(aReceber), color:'#EF9F27', sub:`${contas.filter(c=>c.situacao===1).length} contas` },
          { icon:CreditCard,  label:'Mercado Pago (mês)',value:fmtR(mpTotal),  color:'#e65100', sub:`${mpTrans} transações` },
          { icon:DollarSign,  label:'Saldo estimado',    value:fmtR(entradas - (entradas * 0.3)), color:'#378ADD', sub:'Entradas − custos' },
        ].map(({ icon: Icon, label, value, color, sub }) => (
          <div key={label} style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:12, padding:'16px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:11, color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:500 }}>{label}</span>
              <div style={{ width:28, height:28, borderRadius:6, background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={13} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize:22, fontWeight:500, color:'var(--label)' }}>{value}</div>
            <div style={{ fontSize:11, color:'var(--label-3)', marginTop:4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div style={{ display:'flex', gap:0, borderBottom:'0.5px solid var(--sep)', marginBottom:16 }}>
        {[
          { id:'contas', label:`Contas a receber (${contas.length})` },
          { id:'mp',     label:`Mercado Pago (${mpPgtos.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setAba(t.id)} style={{
            padding:'8px 16px', fontSize:13, fontWeight:500, border:'none', background:'transparent',
            cursor:'pointer', borderBottom:`2px solid ${aba === t.id ? 'var(--accent)' : 'transparent'}`,
            color: aba === t.id ? 'var(--accent)' : 'var(--label-3)',
            marginBottom:-1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Contas a receber */}
      {aba === 'contas' && (
        <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:12, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--bg-3)' }}>
                  {['ID','Contato','Valor','Situação','Vencimento','Pedido'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'9px 16px', fontSize:11, fontWeight:500, color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'0.5px solid var(--sep)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding:24, textAlign:'center', color:'var(--label-3)' }}>Carregando...</td></tr>
                ) : contas.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding:24, textAlign:'center', color:'var(--label-3)' }}>Nenhuma conta encontrada</td></tr>
                ) : contas.map((c, i) => (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    style={{ borderTop:'0.5px solid var(--sep)' }}>
                    <td style={{ padding:'10px 16px', color:'var(--label-3)', fontSize:11 }}>{c.id}</td>
                    <td style={{ padding:'10px 16px', color:'var(--label)', fontWeight:500 }}>{c.contato || '—'}</td>
                    <td style={{ padding:'10px 16px', color:'var(--label)', fontWeight:500 }}>{fmtR(c.valor)}</td>
                    <td style={{ padding:'10px 16px' }}>
                      <span style={{ fontSize:11, fontWeight:500, padding:'3px 8px', borderRadius:99, background:`${situacaoCor(c.situacao)}20`, color:situacaoCor(c.situacao) }}>
                        {situacaoLabel(c.situacao)}
                      </span>
                    </td>
                    <td style={{ padding:'10px 16px', color:'var(--label-3)' }}>
                      {c.vencimento ? new Date(c.vencimento).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td style={{ padding:'10px 16px', color:'var(--label-3)' }}>
                      {c.origem ? `#${c.origem}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mercado Pago */}
      {aba === 'mp' && (
        <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:12, overflow:'hidden' }}>
          {mpPgtos.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'var(--label-3)', fontSize:13 }}>
              {loading ? 'Carregando...' : 'Nenhum pagamento MP registrado ainda'}
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'var(--bg-3)' }}>
                    {['MP ID','Pedido','Valor','Status','Método','Data'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'9px 16px', fontSize:11, fontWeight:500, color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'0.5px solid var(--sep)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mpPgtos.map((p, i) => (
                    <tr key={i} onMouseEnter={e => e.currentTarget.style.background='var(--bg-3)'} onMouseLeave={e => e.currentTarget.style.background='transparent'} style={{ borderTop:'0.5px solid var(--sep)' }}>
                      <td style={{ padding:'10px 16px', color:'var(--label-3)', fontSize:11 }}>{p.mp_payment_id}</td>
                      <td style={{ padding:'10px 16px', color:'var(--label)' }}>#{p.numero_pedido}</td>
                      <td style={{ padding:'10px 16px', fontWeight:500, color:'var(--accent)' }}>{fmtR(p.valor)}</td>
                      <td style={{ padding:'10px 16px' }}>
                        <span style={{ fontSize:11, fontWeight:500, padding:'3px 8px', borderRadius:99, background:'#1D9E7520', color:'#1D9E75' }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding:'10px 16px', color:'var(--label-3)' }}>{p.metodo}</td>
                      <td style={{ padding:'10px 16px', color:'var(--label-3)' }}>
                        {p.criado_em ? new Date(p.criado_em).toLocaleDateString('pt-BR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
