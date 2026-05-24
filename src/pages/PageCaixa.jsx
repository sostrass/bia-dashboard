import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, TrendingUp, Clock, CreditCard, DollarSign, X, ExternalLink, Copy, Check } from 'lucide-react'

const fmtR = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`

function DrawerConta({ conta, onClose }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = text => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  const sitLabel = s => ({ 1:'Aberta', 2:'Paga', 3:'Cancelada' }[s] || `${s}`)
  const sitCor   = s => ({ 1:'#EF9F27', 2:'#1D9E75', 3:'#EF4444' }[s] || '#888')

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:40 }} />
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:360, zIndex:50, background:'var(--bg-2)', borderLeft:'0.5px solid var(--sep)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'16px 20px', borderBottom:'0.5px solid var(--sep)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--label)' }}>Conta a receber</div>
            <div style={{ fontSize:12, color:'var(--label-3)', marginTop:2 }}>ID {conta.id}</div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:6, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={13} />
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
          <div style={{ background:'var(--bg)', borderRadius:10, padding:'16px', marginBottom:14, border:'0.5px solid var(--sep)', textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:500, color:'var(--accent)', marginBottom:4 }}>{fmtR(conta.valor)}</div>
            <span style={{ fontSize:12, fontWeight:500, padding:'3px 10px', borderRadius:99, background:`${sitCor(conta.situacao)}20`, color:sitCor(conta.situacao) }}>
              {sitLabel(conta.situacao)}
            </span>
          </div>

          {[
            { label:'Contato',    value:conta.contato },
            { label:'Vencimento', value:conta.vencimento ? new Date(conta.vencimento).toLocaleDateString('pt-BR') : '—' },
            { label:'Emissão',    value:conta.dataEmissao ? new Date(conta.dataEmissao).toLocaleDateString('pt-BR') : '—' },
            { label:'Pedido',     value:conta.origem ? `#${conta.origem}` : '—' },
          ].map(({ label, value }) => value && value !== '—' ? (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'0.5px solid var(--sep)' }}>
              <span style={{ fontSize:12, color:'var(--label-3)' }}>{label}</span>
              <span style={{ fontSize:12, fontWeight:500, color:'var(--label)' }}>{value}</span>
            </div>
          ) : null)}

          {conta.linkQRCodePix && (
            <div style={{ marginTop:14, background:'var(--bg)', borderRadius:10, padding:14, border:'0.5px solid var(--sep)' }}>
              <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--label-3)', marginBottom:10 }}>PIX Copia e Cola</div>
              <div style={{ fontSize:10, color:'var(--label-3)', wordBreak:'break-all', marginBottom:10, fontFamily:'monospace' }}>
                {conta.linkQRCodePix.slice(0, 60)}...
              </div>
              <button onClick={() => copiar(conta.linkQRCodePix)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:8, border:'0.5px solid var(--accent)', background:'var(--accent-dim)', color:'var(--accent)', fontSize:12, cursor:'pointer', fontWeight:500 }}>
                {copiado ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar código PIX</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function PageCaixa({ api }) {
  const [dados,     setDados]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [aba,       setAba]       = useState('contas')
  const [selecionada,setSelecionada] = useState(null)

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

  const entradas  = dados?.entradas_mes   || 0
  const aReceber  = dados?.a_receber      || 0
  const mpTotal   = dados?.mp_total_mes   || 0
  const mpTrans   = dados?.mp_transacoes  || 0
  const contas    = dados?.contas_receber || []
  const mpPgtos   = dados?.mp_pagamentos  || []

  const sitLabel = s => ({ 1:'Aberta', 2:'Paga', 3:'Cancelada' }[s] || `${s}`)
  const sitCor   = s => ({ 1:'#EF9F27', 2:'#1D9E75', 3:'#EF4444' }[s] || '#888')

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 28px', maxWidth:1140, position:'relative' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:500, margin:0, color:'var(--label)' }}>Fluxo de Caixa</h1>
          <p style={{ fontSize:13, color:'var(--label-3)', margin:'3px 0 0' }}>Bling + Mercado Pago · clique numa conta para ver detalhes</p>
        </div>
        <button onClick={carregar} style={{ width:32, height:32, borderRadius:8, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <RefreshCw size={13} />
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { icon:TrendingUp, label:'Entradas do mês',   value:fmtR(entradas), color:'#1D9E75', sub:'Bling' },
          { icon:Clock,      label:'A receber',          value:fmtR(aReceber), color:'#EF9F27', sub:`${contas.filter(c=>c.situacao===1).length} contas abertas` },
          { icon:CreditCard, label:'Mercado Pago (mês)', value:fmtR(mpTotal),  color:'#e65100', sub:`${mpTrans} transações` },
          { icon:DollarSign, label:'Saldo estimado',     value:fmtR(entradas * 0.7), color:'#378ADD', sub:'Entradas − custos' },
        ].map(({ icon:Icon, label, value, color, sub }) => (
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

      <div style={{ display:'flex', gap:0, borderBottom:'0.5px solid var(--sep)', marginBottom:16 }}>
        {[
          { id:'contas', label:`Contas a receber (${contas.length})` },
          { id:'mp',     label:`Mercado Pago (${mpPgtos.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setAba(t.id)} style={{
            padding:'8px 16px', fontSize:13, fontWeight:500, border:'none', background:'transparent',
            cursor:'pointer', borderBottom:`2px solid ${aba===t.id?'var(--accent)':'transparent'}`,
            color: aba===t.id?'var(--accent)':'var(--label-3)', marginBottom:-1,
          }}>{t.label}</button>
        ))}
      </div>

      {aba === 'contas' && (
        <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:12, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--bg-3)' }}>
                  {['Contato','Valor','Situação','Vencimento','Pedido'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'9px 16px', fontSize:11, fontWeight:500, color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'0.5px solid var(--sep)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding:24, textAlign:'center', color:'var(--label-3)' }}>Carregando...</td></tr>
                ) : contas.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding:24, textAlign:'center', color:'var(--label-3)' }}>Nenhuma conta encontrada</td></tr>
                ) : contas.map((c, i) => (
                  <tr key={i} onClick={() => setSelecionada(c)}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    style={{ borderTop:'0.5px solid var(--sep)', cursor:'pointer' }}>
                    <td style={{ padding:'10px 16px', fontWeight:500, color:'var(--label)' }}>{c.contato || '—'}</td>
                    <td style={{ padding:'10px 16px', fontWeight:500, color:'var(--accent)' }}>{fmtR(c.valor)}</td>
                    <td style={{ padding:'10px 16px' }}>
                      <span style={{ fontSize:11, fontWeight:500, padding:'3px 8px', borderRadius:99, background:`${sitCor(c.situacao)}20`, color:sitCor(c.situacao) }}>
                        {sitLabel(c.situacao)}
                      </span>
                    </td>
                    <td style={{ padding:'10px 16px', color:'var(--label-3)' }}>
                      {c.vencimento ? new Date(c.vencimento).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td style={{ padding:'10px 16px', color:'var(--label-3)' }}>{c.origem ? `#${c.origem}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                    {['Pedido','Valor','Status','Método','Data'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'9px 16px', fontSize:11, fontWeight:500, color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'0.5px solid var(--sep)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mpPgtos.map((p, i) => (
                    <tr key={i}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg-3)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      style={{ borderTop:'0.5px solid var(--sep)' }}>
                      <td style={{ padding:'10px 16px', fontWeight:500, color:'var(--accent)' }}>#{p.numero_pedido}</td>
                      <td style={{ padding:'10px 16px', fontWeight:500, color:'var(--label)' }}>{fmtR(p.valor)}</td>
                      <td style={{ padding:'10px 16px' }}>
                        <span style={{ fontSize:11, fontWeight:500, padding:'3px 8px', borderRadius:99, background:'#1D9E7520', color:'#1D9E75' }}>{p.status}</span>
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

      {selecionada && <DrawerConta conta={selecionada} onClose={() => setSelecionada(null)} />}
    </div>
  )
}
