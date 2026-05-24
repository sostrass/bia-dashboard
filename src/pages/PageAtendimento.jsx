import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, MessageSquare, Clock, User } from 'lucide-react'

export default function PageAtendimento({ api }) {
  const [sessoes,  setSessoes]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selecionada, setSelecionada] = useState(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/sessoes`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setSessoes(d.sessoes || [])
    } catch { setSessoes([]) }
    finally { setLoading(false) }
  }, [api])

  useEffect(() => {
    carregar()
    const i = setInterval(carregar, 15000)  // atualiza a cada 15s
    return () => clearInterval(i)
  }, [carregar])

  const formatarTempo = ts => {
    if (!ts) return '—'
    const diff = Date.now() - new Date(ts).getTime()
    const min  = Math.floor(diff / 60000)
    if (min < 60)  return `${min}m atrás`
    const hrs  = Math.floor(min / 60)
    if (hrs < 24)  return `${hrs}h atrás`
    return `${Math.floor(hrs/24)}d atrás`
  }

  const iniciais = nome => (nome || '?').split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()
  const cores    = ['#1D9E75','#378ADD','#534AB7','#e65100','#EF9F27','#993556']
  const cor      = nome => cores[(nome || '').charCodeAt(0) % cores.length]

  const ativas  = sessoes.filter(s => {
    const diff = Date.now() - new Date(s.atualizado_em).getTime()
    return diff < 30 * 60 * 1000  // menos de 30 min
  })

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'24px 28px 16px', borderBottom:'0.5px solid var(--sep)', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:500, margin:0, color:'var(--label)' }}>Atendimento</h1>
            <p style={{ fontSize:13, color:'var(--label-3)', margin:'3px 0 0' }}>
              {ativas.length} conversas ativas · {sessoes.length} total (24h)
            </p>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--accent)' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)' }} />
              Atualizando a cada 15s
            </div>
            <button onClick={carregar} style={{ width:32, height:32, borderRadius:8, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats rápidos */}
      <div style={{ display:'flex', gap:12, padding:'16px 28px', borderBottom:'0.5px solid var(--sep)', flexShrink:0 }}>
        {[
          { label:'Ativas agora', value:ativas.length, color:'#1D9E75' },
          { label:'Últimas 24h',  value:sessoes.length, color:'#378ADD' },
          { label:'Com carrinho', value:sessoes.filter(s => parseInt(s.itens_carrinho) > 0).length, color:'#EF9F27' },
          { label:'Modo manual',  value:sessoes.filter(s => s.modo === 'manual').length, color:'#534AB7' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:10, padding:'10px 16px', flex:1, minWidth:100 }}>
            <div style={{ fontSize:22, fontWeight:500, color, lineHeight:1, marginBottom:4 }}>{value}</div>
            <div style={{ fontSize:11, color:'var(--label-3)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Lista de sessões */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 28px' }}>
        {loading ? (
          <div style={{ padding:32, textAlign:'center', color:'var(--label-3)', fontSize:13 }}>Carregando sessões...</div>
        ) : sessoes.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:'var(--label-3)', fontSize:13 }}>Nenhuma sessão nas últimas 24h</div>
        ) : (
          <div style={{ paddingTop:16, display:'flex', flexDirection:'column', gap:8 }}>
            {sessoes.map((s, i) => {
              const ativa = Date.now() - new Date(s.atualizado_em).getTime() < 30 * 60 * 1000
              return (
                <div key={i} onClick={() => setSelecionada(s === selecionada ? null : s)}
                  style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                    borderRadius:10, border:'0.5px solid var(--sep)', background:'var(--bg-2)',
                    cursor:'pointer', transition:'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background='var(--bg-2)'}>
                  {/* Avatar */}
                  <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, background:`${cor(s.nome)}20`, color:cor(s.nome), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, position:'relative' }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {s.nome && s.nome !== s.telefone ? s.nome : s.telefone}
                  </div>
                    {ativa && <span style={{ position:'absolute', bottom:0, right:0, width:9, height:9, borderRadius:'50%', background:'#1D9E75', border:'2px solid var(--bg-2)' }} />}
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                      <span style={{ fontSize:13, fontWeight:500, color:'var(--label)' }}>{s.nome || s.telefone}</span>
                      <span style={{ fontSize:11, color:'var(--label-3)' }}>{formatarTempo(s.atualizado_em)}</span>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', fontSize:11, color:'var(--label-3)' }}>
                      <span>{s.telefone}</span>
                      {parseInt(s.itens_carrinho) > 0 && (
                        <span style={{ padding:'1px 6px', borderRadius:99, background:'#EF9F2720', color:'#EF9F27', fontWeight:500 }}>
                          {s.itens_carrinho} item{s.itens_carrinho > 1 ? 's' : ''} no carrinho
                        </span>
                      )}
                      {s.modo === 'manual' && (
                        <span style={{ padding:'1px 6px', borderRadius:99, background:'#534AB720', color:'#534AB7', fontWeight:500 }}>Manual</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
