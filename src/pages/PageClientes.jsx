import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, User, Phone, Mail, FileText } from 'lucide-react'

export default function PageClientes({ api }) {
  const [clientes, setClientes] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [busca,    setBusca]    = useState('')
  const [selecionado, setSelecionado] = useState(null)
  const [pagina,   setPagina]   = useState(1)
  const POR_PAG = 20

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/contatos?limite=200`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setClientes(d.contatos || d.data || [])
    } catch {
      // fallback: busca via bling proxy
      try {
        const r2 = await fetch(`${api}/bling/contatos?limite=50`)
        if (r2.ok) { const d2 = await r2.json(); setClientes(d2.data || []) }
      } catch {}
    } finally { setLoading(false) }
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  const filtrados = clientes.filter(c =>
    !busca ||
    (c.nome||'').toLowerCase().includes(busca.toLowerCase()) ||
    (c.numeroDocumento||'').includes(busca) ||
    (c.telefone||'').includes(busca) ||
    (c.celular||'').includes(busca)
  )

  const total   = filtrados.length
  const inicio  = (pagina - 1) * POR_PAG
  const pagAtual = filtrados.slice(inicio, inicio + POR_PAG)
  const totalPags = Math.ceil(total / POR_PAG)

  const iniciais = nome => (nome || '?').split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()
  const cores    = ['#1D9E75','#378ADD','#534AB7','#e65100','#EF9F27','#993556']
  const cor      = nome => cores[(nome || '').charCodeAt(0) % cores.length]

  return (
    <div style={{ height:'100%', display:'flex', overflow:'hidden' }}>
      {/* Lista */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'24px 28px 16px', borderBottom:'0.5px solid var(--sep)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <h1 style={{ fontSize:20, fontWeight:500, margin:0, color:'var(--label)' }}>Clientes</h1>
              <p style={{ fontSize:13, color:'var(--label-3)', margin:'3px 0 0' }}>{total} contatos</p>
            </div>
            <button onClick={carregar} style={{ width:32, height:32, borderRadius:8, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <RefreshCw size={13} />
            </button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, border:'0.5px solid var(--sep)', background:'var(--bg-2)' }}>
            <Search size={13} style={{ color:'var(--label-3)', flexShrink:0 }} />
            <input value={busca} onChange={e => { setBusca(e.target.value); setPagina(1) }}
              placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
              style={{ border:'none', background:'transparent', outline:'none', fontSize:13, color:'var(--label)', width:'100%' }} />
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:32, textAlign:'center', color:'var(--label-3)', fontSize:13 }}>Carregando clientes...</div>
          ) : pagAtual.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'var(--label-3)', fontSize:13 }}>Nenhum cliente encontrado</div>
          ) : pagAtual.map((c, i) => (
            <div key={i} onClick={() => setSelecionado(c)}
              style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 28px',
                borderBottom:'0.5px solid var(--sep)', cursor:'pointer',
                background: selecionado?.id === c.id ? 'var(--accent-dim)' : 'transparent',
              }}
              onMouseEnter={e => { if (selecionado?.id !== c.id) e.currentTarget.style.background='var(--bg-3)' }}
              onMouseLeave={e => { if (selecionado?.id !== c.id) e.currentTarget.style.background='transparent' }}>
              <div style={{ width:38, height:38, borderRadius:'50%', flexShrink:0, background:`${cor(c.nome)}20`, color:cor(c.nome), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600 }}>
                {iniciais(c.nome)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nome || '—'}</div>
                <div style={{ fontSize:11, color:'var(--label-3)', marginTop:1 }}>
                  {c.numeroDocumento && <span>{c.numeroDocumento} · </span>}
                  {c.celular || c.telefone || 'Sem telefone'}
                </div>
              </div>
              <div style={{ fontSize:11, padding:'3px 8px', borderRadius:99, background: c.situacao === 1 ? '#1D9E7520' : 'var(--fill)', color: c.situacao === 1 ? '#1D9E75' : 'var(--label-3)' }}>
                {c.situacao === 1 ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          ))}
        </div>

        {/* Paginação */}
        {totalPags > 1 && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 28px', borderTop:'0.5px solid var(--sep)', fontSize:12, color:'var(--label-3)' }}>
            <span>{inicio+1}–{Math.min(inicio+POR_PAG, total)} de {total}</span>
            <div style={{ display:'flex', gap:4 }}>
              {pagina > 1 && <button onClick={() => setPagina(p => p-1)} style={{ padding:'4px 10px', borderRadius:6, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', fontSize:12 }}>←</button>}
              {pagina < totalPags && <button onClick={() => setPagina(p => p+1)} style={{ padding:'4px 10px', borderRadius:6, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', fontSize:12 }}>→</button>}
            </div>
          </div>
        )}
      </div>

      {/* Painel lateral — detalhe do cliente */}
      {selecionado && (
        <div style={{ width:300, borderLeft:'0.5px solid var(--sep)', background:'var(--bg-2)', overflowY:'auto', flexShrink:0 }}>
          <div style={{ padding:'20px 20px 16px', borderBottom:'0.5px solid var(--sep)', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:`${cor(selecionado.nome)}20`, color:cor(selecionado.nome), display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700 }}>
                {iniciais(selecionado.nome)}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--label)' }}>{selecionado.nome}</div>
                <div style={{ fontSize:11, color:'var(--label-3)', marginTop:2 }}>
                  {selecionado.tipo === 'J' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                </div>
              </div>
            </div>
            <button onClick={() => setSelecionado(null)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--label-3)', fontSize:16 }}>✕</button>
          </div>

          <div style={{ padding:'16px 20px' }}>
            {[
              { icon:FileText, label:'CPF/CNPJ', value:selecionado.numeroDocumento },
              { icon:Phone,    label:'Celular',   value:selecionado.celular || selecionado.telefone },
              { icon:Mail,     label:'E-mail',    value:selecionado.email },
            ].map(({ icon: Icon, label, value }) => value ? (
              <div key={label} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--sep)' }}>
                <Icon size={14} style={{ color:'var(--label-3)', flexShrink:0, marginTop:1 }} />
                <div>
                  <div style={{ fontSize:10, color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>{label}</div>
                  <div style={{ fontSize:13, color:'var(--label)' }}>{value}</div>
                </div>
              </div>
            ) : null)}

            {selecionado.endereco?.geral?.municipio && (
              <div style={{ padding:'10px 0', borderBottom:'0.5px solid var(--sep)' }}>
                <div style={{ fontSize:10, color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Endereço</div>
                <div style={{ fontSize:13, color:'var(--label)', lineHeight:1.6 }}>
                  {selecionado.endereco.geral.endereco}, {selecionado.endereco.geral.numero}
                  {selecionado.endereco.geral.complemento && ` · ${selecionado.endereco.geral.complemento}`}
                  <br />{selecionado.endereco.geral.bairro}
                  <br />{selecionado.endereco.geral.municipio}/{selecionado.endereco.geral.uf}
                  <br />{selecionado.endereco.geral.cep}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
