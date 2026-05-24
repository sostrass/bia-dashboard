import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, X, Package, User, MapPin, CreditCard, Truck, Calendar, ExternalLink } from 'lucide-react'

const fmtR = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`

const SITUACOES = { 6:'Aberto', 9:'Atendido', 12:'Cancelado', 14:'Faturado', 15:'Verificado', 0:'Todos' }

function mapSit(s) {
  const id = typeof s === 'object' ? s.id || s.valor : s
  return SITUACOES[id] || String(id)
}

function PillStatus({ status }) {
  const s = (status||'').toLowerCase()
  const c = {
    'atendido':  { bg:'#1D9E7520', color:'#1D9E75' },
    'verificado':{ bg:'#1D9E7520', color:'#1D9E75' },
    'aberto':    { bg:'#EF9F2720', color:'#EF9F27' },
    'cancelado': { bg:'#EF444420', color:'#EF4444' },
    'faturado':  { bg:'#378ADD20', color:'#378ADD' },
  }[s] || { bg:'var(--fill)', color:'var(--label-3)' }
  return (
    <span style={{ fontSize:11, fontWeight:500, padding:'3px 8px', borderRadius:99, background:c.bg, color:c.color, whiteSpace:'nowrap' }}>
      {status}
    </span>
  )
}

function Drawer({ pedido, onClose, api }) {
  const [detalhe, setDetalhe] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pedido?.id) return
    setLoading(true)
    fetch(`${api}/bling/debug-pedido-completo?numero=${pedido.numero}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setDetalhe(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [pedido?.id])

  if (!pedido) return null

  const Row = ({ label, value, color }) => value ? (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'0.5px solid var(--sep)' }}>
      <span style={{ fontSize:12, color:'var(--label-3)' }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:500, color: color || 'var(--label)', textAlign:'right', maxWidth:200 }}>{value}</span>
    </div>
  ) : null

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:40 }} />
      {/* Drawer */}
      <div style={{
        position:'fixed', top:0, right:0, bottom:0, width:420, zIndex:50,
        background:'var(--bg-2)', borderLeft:'0.5px solid var(--sep)',
        display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'0.5px solid var(--sep)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--label)' }}>Pedido #{pedido.numero}</div>
            <div style={{ fontSize:12, color:'var(--label-3)', marginTop:2 }}>
              {pedido.data ? new Date(pedido.data).toLocaleDateString('pt-BR') : '—'}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <PillStatus status={mapSit(pedido.situacao)} />
            <button onClick={onClose} style={{ width:28, height:28, borderRadius:6, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
          {loading ? (
            <div style={{ textAlign:'center', color:'var(--label-3)', padding:32, fontSize:13 }}>Carregando detalhes...</div>
          ) : (
            <>
              {/* Resumo financeiro */}
              <div style={{ background:'var(--bg)', borderRadius:10, padding:'14px 16px', marginBottom:16, border:'0.5px solid var(--sep)' }}>
                <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--label-3)', marginBottom:10 }}>Financeiro</div>
                <Row label="Total" value={fmtR(pedido.total)} color="var(--accent)" />
                <Row label="Cliente" value={pedido.contato} />
                <Row label="Forma pagamento" value={detalhe?.parcelas?.[0]?.formaPagamentoId === 1896170 ? 'PIX' : detalhe?.parcelas?.[0]?.formaPagamentoId === 3938183 ? 'Cartão' : 'PIX'} />
              </div>

              {/* Itens */}
              {detalhe?.itens?.length > 0 && (
                <div style={{ background:'var(--bg)', borderRadius:10, padding:'14px 16px', marginBottom:16, border:'0.5px solid var(--sep)' }}>
                  <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--label-3)', marginBottom:10 }}>
                    <Package size={11} style={{ marginRight:5 }} />Itens ({detalhe.itens.length})
                  </div>
                  {detalhe.itens.map((item, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'0.5px solid var(--sep)' }}>
                      <div>
                        <div style={{ fontSize:12, fontWeight:500, color:'var(--label)' }}>{item.descricao}</div>
                        <div style={{ fontSize:11, color:'var(--label-3)' }}>{item.codigo} · {item.quantidade}x</div>
                      </div>
                      <span style={{ fontSize:12, fontWeight:500, color:'var(--label)', whiteSpace:'nowrap' }}>{fmtR(item.valor * item.quantidade)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Transporte */}
              {detalhe?.transporte && (
                <div style={{ background:'var(--bg)', borderRadius:10, padding:'14px 16px', marginBottom:16, border:'0.5px solid var(--sep)' }}>
                  <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--label-3)', marginBottom:10 }}>
                    <Truck size={11} style={{ marginRight:5 }} />Entrega
                  </div>
                  <Row label="Frete" value={detalhe.transporte.frete > 0 ? fmtR(detalhe.transporte.frete) : 'Grátis'} />
                  {detalhe.transporte.etiqueta?.endereco && (
                    <Row label="Endereço" value={`${detalhe.transporte.etiqueta.endereco}, ${detalhe.transporte.etiqueta.numero} — ${detalhe.transporte.etiqueta.municipio}/${detalhe.transporte.etiqueta.uf}`} />
                  )}
                </div>
              )}

              {/* Info adicional */}
              <div style={{ background:'var(--bg)', borderRadius:10, padding:'14px 16px', border:'0.5px solid var(--sep)' }}>
                <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--label-3)', marginBottom:10 }}>Info</div>
                <Row label="ID interno" value={pedido.id} />
                <Row label="Data" value={pedido.data ? new Date(pedido.data).toLocaleDateString('pt-BR') : '—'} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'0.5px solid var(--sep)', display:'flex', gap:8 }}>
          <a href={`https://www.bling.com.br/vendas.php#/vendas/${pedido.id}`} target="_blank" rel="noreferrer"
            style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:8, border:'0.5px solid var(--sep)', background:'transparent', color:'var(--label-2)', fontSize:12, textDecoration:'none', cursor:'pointer' }}>
            <ExternalLink size={12} /> Ver no Bling
          </a>
        </div>
      </div>
    </>
  )
}

export default function PagePedidos({ api }) {
  const [pedidos,    setPedidos]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [busca,      setBusca]      = useState('')
  const [filtroSit,  setFiltroSit]  = useState('0')
  const [pagina,     setPagina]     = useState(1)
  const [selecionado,setSelecionado]= useState(null)
  const POR_PAG = 15

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/financeiro`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setPedidos(d.pedidos_recentes || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  const filtrados = pedidos.filter(p => {
    const sit = mapSit(p.situacao)
    const matchSit = filtroSit === '0' || sit === SITUACOES[parseInt(filtroSit)]
    const matchBusca = !busca || String(p.numero).includes(busca) || (p.contato||'').toLowerCase().includes(busca.toLowerCase())
    return matchSit && matchBusca
  })

  const total    = filtrados.length
  const inicio   = (pagina - 1) * POR_PAG
  const pagAtual = filtrados.slice(inicio, inicio + POR_PAG)
  const totalPags = Math.ceil(total / POR_PAG)

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 28px', maxWidth:1140, position:'relative' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:500, margin:0, color:'var(--label)' }}>Pedidos</h1>
          <p style={{ fontSize:13, color:'var(--label-3)', margin:'3px 0 0' }}>Sincronizado com o Bling · {total} pedidos</p>
        </div>
        <button onClick={carregar} style={{ width:32, height:32, borderRadius:8, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <RefreshCw size={13} />
        </button>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:8, border:'0.5px solid var(--sep)', background:'var(--bg-2)', flex:1, minWidth:200 }}>
          <Search size={13} style={{ color:'var(--label-3)', flexShrink:0 }} />
          <input value={busca} onChange={e => { setBusca(e.target.value); setPagina(1) }}
            placeholder="Buscar por número ou cliente..."
            style={{ border:'none', background:'transparent', outline:'none', fontSize:13, color:'var(--label)', width:'100%' }} />
        </div>
        <select value={filtroSit} onChange={e => { setFiltroSit(e.target.value); setPagina(1) }} style={{
          padding:'7px 12px', borderRadius:8, border:'0.5px solid var(--sep)',
          background:'var(--bg-2)', color:'var(--label)', fontSize:13, cursor:'pointer',
        }}>
          {Object.entries(SITUACOES).map(([id, nome]) => (
            <option key={id} value={id}>{nome}</option>
          ))}
        </select>
      </div>

      <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--bg-3)' }}>
                {['Número','Cliente','Total','Situação','Data'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'9px 16px', fontSize:11, fontWeight:500, color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'0.5px solid var(--sep)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding:32, textAlign:'center', color:'var(--label-3)' }}>Carregando...</td></tr>
              ) : pagAtual.length === 0 ? (
                <tr><td colSpan={5} style={{ padding:32, textAlign:'center', color:'var(--label-3)' }}>Nenhum pedido encontrado</td></tr>
              ) : pagAtual.map((p, i) => (
                <tr key={i} onClick={() => setSelecionado(p)}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  style={{ borderTop:'0.5px solid var(--sep)', cursor:'pointer' }}>
                  <td style={{ padding:'10px 16px', fontWeight:600, color:'var(--accent)' }}>#{p.numero}</td>
                  <td style={{ padding:'10px 16px', color:'var(--label-2)' }}>{p.contato || '—'}</td>
                  <td style={{ padding:'10px 16px', fontWeight:500, color:'var(--label)' }}>{fmtR(p.total)}</td>
                  <td style={{ padding:'10px 16px' }}><PillStatus status={mapSit(p.situacao)} /></td>
                  <td style={{ padding:'10px 16px', color:'var(--label-3)' }}>{p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPags > 1 && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderTop:'0.5px solid var(--sep)', fontSize:13, color:'var(--label-3)' }}>
            <span>Mostrando {inicio+1}–{Math.min(inicio+POR_PAG, total)} de {total}</span>
            <div style={{ display:'flex', gap:4 }}>
              {pagina > 1 && <button onClick={() => setPagina(p => p-1)} style={{ padding:'4px 10px', borderRadius:6, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', fontSize:12 }}>←</button>}
              {Array.from({ length: Math.min(totalPags, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPagina(n)} style={{ width:28, height:28, borderRadius:6, border:`0.5px solid ${pagina===n?'var(--accent)':'var(--sep)'}`, background: pagina===n?'var(--accent-dim)':'transparent', color: pagina===n?'var(--accent)':'var(--label-3)', fontSize:12, cursor:'pointer' }}>{n}</button>
              ))}
              {pagina < totalPags && <button onClick={() => setPagina(p => p+1)} style={{ padding:'4px 10px', borderRadius:6, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', fontSize:12 }}>→</button>}
            </div>
          </div>
        )}
      </div>

      {selecionado && <Drawer pedido={selecionado} onClose={() => setSelecionado(null)} api={api} />}
    </div>
  )
}
