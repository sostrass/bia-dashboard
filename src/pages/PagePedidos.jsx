import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Search, Filter } from 'lucide-react'

const fmtR = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`

const SITUACOES = {
  6:'Aberto', 9:'Atendido', 12:'Cancelado', 14:'Faturado', 15:'Verificado', 0:'Todos'
}

function mapSit(s) {
  const id = typeof s === 'object' ? s.id || s.valor : s
  return SITUACOES[id] || `${id}`
}

function PillStatus({ status }) {
  const s = (status||'').toLowerCase()
  const c = {
    'atendido':{ bg:'#1D9E7520', color:'#1D9E75' },
    'aberto':  { bg:'#EF9F2720', color:'#EF9F27' },
    'cancelado':{ bg:'#EF444420', color:'#EF4444' },
    'faturado':{ bg:'#378ADD20', color:'#378ADD' },
    'verificado':{ bg:'#53AB7420', color:'#1D9E75' },
  }[s] || { bg:'var(--fill)', color:'var(--label-3)' }
  return (
    <span style={{ fontSize:11, fontWeight:500, padding:'3px 8px', borderRadius:99, background:c.bg, color:c.color }}>
      {status}
    </span>
  )
}

export default function PagePedidos({ api }) {
  const [pedidos,  setPedidos]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [busca,    setBusca]    = useState('')
  const [filtroSit,setFiltroSit]= useState('0')
  const [pagina,   setPagina]   = useState(1)
  const POR_PAG = 15

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/financeiro`)
      if (!r.ok) throw new Error('Erro ao buscar')
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

  const total  = filtrados.length
  const inicio = (pagina - 1) * POR_PAG
  const pagAtual = filtrados.slice(inicio, inicio + POR_PAG)
  const totalPags = Math.ceil(total / POR_PAG)

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 28px', maxWidth:1140 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:500, margin:0, color:'var(--label)' }}>Pedidos</h1>
          <p style={{ fontSize:13, color:'var(--label-3)', margin:'3px 0 0' }}>Sincronizado com o Bling</p>
        </div>
        <button onClick={carregar} style={{ width:32, height:32, borderRadius:8, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Filtros */}
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

      {/* Tabela */}
      <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--bg-3)' }}>
                {['Número','Cliente','Total','Situação','Data'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'9px 16px', fontSize:11, fontWeight:500, color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'0.5px solid var(--sep)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding:'32px', textAlign:'center', color:'var(--label-3)' }}>Carregando...</td></tr>
              ) : pagAtual.length === 0 ? (
                <tr><td colSpan={5} style={{ padding:'32px', textAlign:'center', color:'var(--label-3)' }}>Nenhum pedido encontrado</td></tr>
              ) : pagAtual.map((p, i) => (
                <tr key={i}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  style={{ borderTop:'0.5px solid var(--sep)', cursor:'default' }}>
                  <td style={{ padding:'10px 16px', fontWeight:500, color:'var(--label)' }}>#{p.numero}</td>
                  <td style={{ padding:'10px 16px', color:'var(--label-2)' }}>{p.contato || '—'}</td>
                  <td style={{ padding:'10px 16px', fontWeight:500, color:'var(--label)' }}>{fmtR(p.total)}</td>
                  <td style={{ padding:'10px 16px' }}><PillStatus status={mapSit(p.situacao)} /></td>
                  <td style={{ padding:'10px 16px', color:'var(--label-3)' }}>{p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPags > 1 && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderTop:'0.5px solid var(--sep)', fontSize:13, color:'var(--label-3)' }}>
            <span>Mostrando {inicio+1}–{Math.min(inicio+POR_PAG, total)} de {total}</span>
            <div style={{ display:'flex', gap:4 }}>
              {Array.from({ length: Math.min(totalPags, 7) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPagina(n)} style={{
                  width:30, height:30, borderRadius:6, border:`0.5px solid ${pagina===n ? 'var(--accent)' : 'var(--sep)'}`,
                  background: pagina===n ? 'var(--accent-dim)' : 'transparent',
                  color: pagina===n ? 'var(--accent)' : 'var(--label-3)',
                  fontSize:12, cursor:'pointer',
                }}>{n}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
