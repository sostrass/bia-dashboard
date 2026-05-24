import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, X, Package, ExternalLink, Truck, CreditCard, MapPin, BarChart2, Star } from 'lucide-react'

const fmtR = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`

// Mapa de origens com ícone/favicon e cor
const ORIGENS = {
  whatsapp:      { label:'WhatsApp',      cor:'#25D366', emoji:'💬' },
  nuvemshop:     { label:'Nuvemshop',     cor:'#0070f3', emoji:'🛒' },
  shopee:        { label:'Shopee',        cor:'#EE4D2D', emoji:'🛍️' },
  shein:         { label:'Shein',         cor:'#000000', emoji:'👗' },
  tiktokshop:    { label:'TikTok Shop',   cor:'#010101', emoji:'🎵' },
  mercadolivre:  { label:'Mercado Livre', cor:'#FFE600', emoji:'🛒' },
  b2b:           { label:'B2B',           cor:'#534AB7', emoji:'🏢' },
  bling:         { label:'Bling',         cor:'#1D9E75', emoji:'📦' },
}

const SITUACOES = { 6:'Aberto', 9:'Atendido', 12:'Cancelado', 14:'Faturado', 15:'Verificado', 0:'Todos' }

function mapSit(s) {
  const id = typeof s === 'object' ? s.id || s.valor : s
  return SITUACOES[id] || String(id)
}

function detectarOrigem(pedido) {
  const obs   = (pedido.observacoes || '').toLowerCase()
  const loja  = (pedido.loja?.nome || pedido.numeroLoja || '').toLowerCase()
  const canal = (pedido.canal || '').toLowerCase()
  if (obs.includes('whatsapp') || canal.includes('whatsapp')) return 'whatsapp'
  if (obs.includes('shopee')   || loja.includes('shopee'))    return 'shopee'
  if (obs.includes('shein')    || loja.includes('shein'))     return 'shein'
  if (obs.includes('tiktok')   || loja.includes('tiktok'))    return 'tiktokshop'
  if (obs.includes('mercado livre') || loja.includes('ml'))   return 'mercadolivre'
  if (obs.includes('nuvemshop')|| loja.includes('nuv'))       return 'nuvemshop'
  if (obs.includes('b2b')      || canal.includes('b2b'))      return 'b2b'
  return 'bling'
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
  return <span style={{ fontSize:11, fontWeight:500, padding:'3px 8px', borderRadius:99, background:c.bg, color:c.color, whiteSpace:'nowrap' }}>{status}</span>
}

function OrigemBadge({ origem }) {
  const o = ORIGENS[origem] || ORIGENS.bling
  return (
    <span style={{ fontSize:10, padding:'2px 6px', borderRadius:99, background:`${o.cor}18`, color:o.cor, fontWeight:600, whiteSpace:'nowrap', border:`0.5px solid ${o.cor}30` }}>
      {o.emoji} {o.label}
    </span>
  )
}

function RastreioStatus({ status }) {
  if (!status) return <span style={{ fontSize:11, color:'var(--label-3)' }}>—</span>
  const cores = {
    'objeto postado':     '#EF9F27',
    'em trânsito':        '#378ADD',
    'saiu para entrega':  '#534AB7',
    'entregue':           '#1D9E75',
    'tentativa':          '#EF4444',
  }
  const cor = Object.entries(cores).find(([k]) => status.toLowerCase().includes(k))?.[1] || '#888'
  return <span style={{ fontSize:11, padding:'2px 7px', borderRadius:99, background:`${cor}20`, color:cor, fontWeight:500 }}>{status}</span>
}

// Drawer lateral de detalhes do pedido
function Drawer({ pedido, onClose, api, todosPedidos }) {
  const [detalhe, setDetalhe] = useState(null)
  const [loading, setLoading] = useState(true)

  const origem = detectarOrigem(pedido)
  const ori    = ORIGENS[origem] || ORIGENS.bling

  // Historico do cliente (pedidos anteriores)
  const clienteNome = pedido.contato || ''
  const pedidosCliente = todosPedidos.filter(p =>
    p.contato === clienteNome && p.numero !== pedido.numero
  )
  const numCompra    = pedidosCliente.filter(p => p.numero < pedido.numero).length + 1
  const totalGasto   = pedidosCliente.reduce((s, p) => s + Number(p.total||0), 0) + Number(pedido.total||0)
  const ehPrimeiro   = numCompra === 1

  useEffect(() => {
    if (!pedido?.numero) return
    setLoading(true)
    fetch(`${api}/api/dashboard/pedidos/${pedido.numero}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setDetalhe(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [pedido?.numero])

  const Row = ({ icon: Icon, label, value, color }) => value ? (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'0.5px solid var(--sep)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {Icon && <Icon size={12} style={{ color:'var(--label-3)' }} />}
        <span style={{ fontSize:12, color:'var(--label-3)' }}>{label}</span>
      </div>
      <span style={{ fontSize:12, fontWeight:500, color: color || 'var(--label)', textAlign:'right', maxWidth:220 }}>{value}</span>
    </div>
  ) : null

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:40 }} />
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:440, zIndex:50, background:'var(--bg-2)', borderLeft:'0.5px solid var(--sep)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'0.5px solid var(--sep)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', background:'var(--bg-2)' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <span style={{ fontSize:16, fontWeight:700, color:'var(--label)' }}>Pedido #{pedido.numero}</span>
              <PillStatus status={mapSit(pedido.situacao)} />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <OrigemBadge origem={origem} />
              {ehPrimeiro
                ? <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background:'#E1F5EE', color:'#0F6E56', fontWeight:600 }}>⭐ 1ª compra</span>
                : <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background:'var(--fill)', color:'var(--label-3)', fontWeight:500 }}>{numCompra}ª compra</span>
              }
              <span style={{ fontSize:11, color:'var(--label-3)' }}>{pedido.data ? new Date(pedido.data).toLocaleDateString('pt-BR') : '—'}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:6, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={13} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 20px' }}>
          {loading ? (
            <div style={{ textAlign:'center', color:'var(--label-3)', padding:32, fontSize:13 }}>Carregando...</div>
          ) : (
            <>
              {/* Resumo financeiro */}
              <div style={{ background:'var(--bg)', borderRadius:10, padding:'14px 16px', marginBottom:12, border:'0.5px solid var(--sep)' }}>
                <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--label-3)', marginBottom:8 }}>Financeiro</div>
                <Row label="Total"    value={fmtR(pedido.total)} color="var(--accent)" />
                <Row label="Cliente"  value={pedido.contato} />
                <Row icon={CreditCard} label="Pagamento" value={
                  detalhe?.parcelas?.[0]?.formaPagamento?.id === 1896170 ? 'PIX' :
                  detalhe?.parcelas?.[0]?.formaPagamento?.id === 3938183 ? 'Cartão' : 'PIX'
                } />
              </div>

              {/* Histórico do cliente */}
              <div style={{ background:'var(--bg)', borderRadius:10, padding:'14px 16px', marginBottom:12, border:'0.5px solid var(--sep)' }}>
                <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--label-3)', marginBottom:8 }}>
                  <BarChart2 size={11} style={{ display:'inline', marginRight:5 }} />Histórico do cliente
                </div>
                <div style={{ display:'flex', gap:12 }}>
                  <div style={{ flex:1, textAlign:'center', padding:'8px', background:'var(--bg-2)', borderRadius:8 }}>
                    <div style={{ fontSize:20, fontWeight:600, color:'var(--accent)' }}>{pedidosCliente.length + 1}</div>
                    <div style={{ fontSize:11, color:'var(--label-3)' }}>pedidos total</div>
                  </div>
                  <div style={{ flex:1, textAlign:'center', padding:'8px', background:'var(--bg-2)', borderRadius:8 }}>
                    <div style={{ fontSize:16, fontWeight:600, color:'var(--label)' }}>{fmtR(totalGasto)}</div>
                    <div style={{ fontSize:11, color:'var(--label-3)' }}>gasto total</div>
                  </div>
                  <div style={{ flex:1, textAlign:'center', padding:'8px', background:'var(--bg-2)', borderRadius:8 }}>
                    <div style={{ fontSize:20, fontWeight:600, color: ehPrimeiro ? '#1D9E75' : 'var(--label)' }}>
                      {ehPrimeiro ? '⭐' : `#${numCompra}`}
                    </div>
                    <div style={{ fontSize:11, color:'var(--label-3)' }}>{ehPrimeiro ? 'novo cliente' : 'nesta compra'}</div>
                  </div>
                </div>
              </div>

              {/* Itens */}
              {detalhe?.itens?.length > 0 && (
                <div style={{ background:'var(--bg)', borderRadius:10, padding:'14px 16px', marginBottom:12, border:'0.5px solid var(--sep)' }}>
                  <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--label-3)', marginBottom:8 }}>
                    <Package size={11} style={{ display:'inline', marginRight:5 }} />Itens ({detalhe.itens.length})
                  </div>
                  {detalhe.itens.map((item, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'7px 0', borderBottom:'0.5px solid var(--sep)' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:500, color:'var(--label)', lineHeight:1.4 }}>{item.descricao}</div>
                        <div style={{ fontSize:11, color:'var(--label-3)', marginTop:2 }}>{item.codigo} · {item.quantidade}×</div>
                      </div>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--label)', whiteSpace:'nowrap', marginLeft:12 }}>{fmtR(item.valor * item.quantidade)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Rastreio */}
              {detalhe?.transporte && (
                <div style={{ background:'var(--bg)', borderRadius:10, padding:'14px 16px', marginBottom:12, border:'0.5px solid var(--sep)' }}>
                  <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--label-3)', marginBottom:8 }}>
                    <Truck size={11} style={{ display:'inline', marginRight:5 }} />Entrega & Rastreio
                  </div>
                  <Row icon={MapPin} label="Endereço"  value={detalhe.transporte.etiqueta?.endereco ? `${detalhe.transporte.etiqueta.endereco}, ${detalhe.transporte.etiqueta.numero} — ${detalhe.transporte.etiqueta.municipio}/${detalhe.transporte.etiqueta.uf}` : null} />
                  <Row label="Frete"      value={detalhe.transporte.frete > 0 ? fmtR(detalhe.transporte.frete) : 'Grátis'} />

                  {/* Volumes / rastreio */}
                  {(detalhe.transporte.volumes || []).map((vol, i) => (
                    <div key={i} style={{ marginTop:10, padding:'10px 12px', borderRadius:8, background:'var(--bg-2)', border:'0.5px solid var(--sep)' }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'var(--label-3)', marginBottom:6 }}>Volume {i+1}</div>
                      {vol.servico?.descricao && <div style={{ fontSize:12, color:'var(--label-2)', marginBottom:4 }}>{vol.servico.descricao}</div>}
                      {vol.codigoRastreamento && (
                        <>
                          <div style={{ fontSize:11, color:'var(--label-3)', marginBottom:4 }}>
                            Código: <span style={{ fontFamily:'monospace', color:'var(--accent)' }}>{vol.codigoRastreamento}</span>
                          </div>
                          <RastreioStatus status={vol.ultimaSituacao?.descricao || vol.situacaoRastreio} />
                          {vol.dataUltimaOcorrencia && (
                            <div style={{ fontSize:10, color:'var(--label-3)', marginTop:4 }}>
                              Atualizado: {new Date(vol.dataUltimaOcorrencia).toLocaleString('pt-BR')}
                            </div>
                          )}
                          <a href={`https://melhorrastreio.com.br/rastreio/${vol.codigoRastreamento}`}
                            target="_blank" rel="noreferrer"
                            style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'#378ADD', marginTop:6, textDecoration:'none' }}>
                            <ExternalLink size={10} /> Ver rastreio
                          </a>
                        </>
                      )}
                      {!vol.codigoRastreamento && (
                        <div style={{ fontSize:11, color:'var(--label-3)' }}>Sem código de rastreio</div>
                      )}
                    </div>
                  ))}
                  {(!detalhe.transporte.volumes || detalhe.transporte.volumes.length === 0) && (
                    <div style={{ fontSize:11, color:'var(--label-3)', marginTop:4 }}>Sem volumes cadastrados</div>
                  )}
                </div>
              )}

              {/* Obs */}
              {(detalhe?.observacoes || detalhe?.observacoesInternas) && (
                <div style={{ background:'var(--bg)', borderRadius:10, padding:'14px 16px', border:'0.5px solid var(--sep)' }}>
                  <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--label-3)', marginBottom:8 }}>Observações</div>
                  {detalhe.observacoes && <div style={{ fontSize:12, color:'var(--label-2)', marginBottom:6, lineHeight:1.5 }}>{detalhe.observacoes}</div>}
                  {detalhe.observacoesInternas && <div style={{ fontSize:12, color:'var(--label-3)', lineHeight:1.5, padding:'8px', background:'var(--bg-2)', borderRadius:6 }}>🔒 {detalhe.observacoesInternas}</div>}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'0.5px solid var(--sep)', display:'flex', gap:8 }}>
          <a href={`https://www.bling.com.br/vendas.php#/vendas/${detalhe?.id || ''}`} target="_blank" rel="noreferrer"
            style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:8, borderRadius:8, border:'0.5px solid var(--sep)', background:'transparent', color:'var(--label-2)', fontSize:12, textDecoration:'none' }}>
            <ExternalLink size={12} /> Ver no Bling
          </a>
        </div>
      </div>
    </>
  )
}

export default function PagePedidos({ api }) {
  const [pedidos,     setPedidos]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [busca,       setBusca]       = useState('')
  const [filtroSit,   setFiltroSit]   = useState('0')
  const [filtroLoja,  setFiltroLoja]  = useState('todos')
  const [pagina,      setPagina]      = useState(1)
  const [selecionado, setSelecionado] = useState(null)
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
    const sit     = mapSit(p.situacao)
    const origem  = detectarOrigem(p)
    const matchSit  = filtroSit === '0'     || sit === SITUACOES[parseInt(filtroSit)]
    const matchLoja = filtroLoja === 'todos' || origem === filtroLoja
    const matchBusca = !busca || String(p.numero).includes(busca) || (p.contato||'').toLowerCase().includes(busca.toLowerCase())
    return matchSit && matchLoja && matchBusca
  })

  const total     = filtrados.length
  const inicio    = (pagina - 1) * POR_PAG
  const pagAtual  = filtrados.slice(inicio, inicio + POR_PAG)
  const totalPags = Math.ceil(total / POR_PAG)

  // Contagens por origem
  const contagemOrigem = pedidos.reduce((acc, p) => {
    const o = detectarOrigem(p)
    acc[o] = (acc[o] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 28px', maxWidth:1200, position:'relative' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:500, margin:0, color:'var(--label)' }}>Pedidos</h1>
          <p style={{ fontSize:13, color:'var(--label-3)', margin:'3px 0 0' }}>Bling · {total} pedidos · clique para ver detalhes</p>
        </div>
        <button onClick={carregar} style={{ width:32, height:32, borderRadius:8, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Filtros por loja */}
      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        {[['todos','Todos','#888'], ...Object.entries(ORIGENS).map(([k,v]) => [k, v.label, v.cor])].map(([key, label, cor]) => {
          const count = key === 'todos' ? pedidos.length : contagemOrigem[key] || 0
          const ativo = filtroLoja === key
          return (
            <button key={key} onClick={() => { setFiltroLoja(key); setPagina(1) }} style={{
              display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99, fontSize:11, fontWeight:500, cursor:'pointer',
              border:`0.5px solid ${ativo ? cor : 'var(--sep)'}`,
              background: ativo ? `${cor}18` : 'transparent',
              color: ativo ? cor : 'var(--label-3)',
            }}>
              {key !== 'todos' && ORIGENS[key]?.emoji} {label}
              {count > 0 && <span style={{ fontSize:10, fontWeight:600, padding:'1px 5px', borderRadius:99, background: ativo ? `${cor}30` : 'var(--fill)', color: ativo ? cor : 'var(--label-3)' }}>{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Busca + situação */}
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:8, border:'0.5px solid var(--sep)', background:'var(--bg-2)', flex:1, minWidth:200 }}>
          <Search size={13} style={{ color:'var(--label-3)', flexShrink:0 }} />
          <input value={busca} onChange={e => { setBusca(e.target.value); setPagina(1) }}
            placeholder="Buscar por número ou cliente..."
            style={{ border:'none', background:'transparent', outline:'none', fontSize:13, color:'var(--label)', width:'100%' }} />
          {busca && <button onClick={() => setBusca('')} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--label-3)' }}><X size={12} /></button>}
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

      {/* Tabela */}
      <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--bg-3)' }}>
                {['Número','Cliente','Total','Situação','Canal','Compra','Data'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'9px 14px', fontSize:11, fontWeight:500, color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'0.5px solid var(--sep)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding:32, textAlign:'center', color:'var(--label-3)' }}>Carregando...</td></tr>
              ) : pagAtual.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:32, textAlign:'center', color:'var(--label-3)' }}>Nenhum pedido encontrado</td></tr>
              ) : pagAtual.map((p, i) => {
                const origem = detectarOrigem(p)
                const pedidosAntCliente = pedidos.filter(x => x.contato === p.contato && x.numero < p.numero)
                const numCompra = pedidosAntCliente.length + 1
                return (
                  <tr key={i} onClick={() => setSelecionado(p)}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    style={{ borderTop:'0.5px solid var(--sep)', cursor:'pointer' }}>
                    <td style={{ padding:'10px 14px', fontWeight:600, color:'var(--accent)' }}>#{p.numero}</td>
                    <td style={{ padding:'10px 14px', color:'var(--label-2)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.contato || '—'}</td>
                    <td style={{ padding:'10px 14px', fontWeight:500, color:'var(--label)' }}>{fmtR(p.total)}</td>
                    <td style={{ padding:'10px 14px' }}><PillStatus status={mapSit(p.situacao)} /></td>
                    <td style={{ padding:'10px 14px' }}><OrigemBadge origem={origem} /></td>
                    <td style={{ padding:'10px 14px' }}>
                      {numCompra === 1
                        ? <span style={{ fontSize:10, padding:'2px 6px', borderRadius:99, background:'#E1F5EE', color:'#0F6E56', fontWeight:600 }}>⭐ 1ª</span>
                        : <span style={{ fontSize:11, color:'var(--label-3)' }}>{numCompra}ª</span>
                      }
                    </td>
                    <td style={{ padding:'10px 14px', color:'var(--label-3)', whiteSpace:'nowrap' }}>{p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPags > 1 && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', borderTop:'0.5px solid var(--sep)', fontSize:12, color:'var(--label-3)' }}>
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

      {selecionado && (
        <Drawer pedido={selecionado} onClose={() => setSelecionado(null)} api={api} todosPedidos={pedidos} />
      )}
    </div>
  )
}
