import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Phone, Mail, FileText, MapPin, ShoppingCart, X, ExternalLink } from 'lucide-react'

const fmtR = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`

function Drawer({ cliente, onClose, api, pedidos }) {
  const pedidosCliente = pedidos.filter(p =>
    (p.contato||'').toLowerCase() === (cliente.nome||'').toLowerCase()
  ).slice(0, 5)

  const iniciais = nome => (nome||'?').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()
  const cores = ['#1D9E75','#378ADD','#534AB7','#e65100','#EF9F27']
  const cor   = nome => cores[(nome||'').charCodeAt(0) % cores.length]

  const Row = ({ icon: Icon, label, value }) => value ? (
    <div style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'0.5px solid var(--sep)' }}>
      <Icon size={14} style={{ color:'var(--label-3)', flexShrink:0, marginTop:1 }} />
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:10, color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:13, color:'var(--label)', wordBreak:'break-all' }}>{value}</div>
      </div>
    </div>
  ) : null

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:40 }} />
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:380, zIndex:50, background:'var(--bg-2)', borderLeft:'0.5px solid var(--sep)', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ padding:'20px 20px 16px', borderBottom:'0.5px solid var(--sep)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:`${cor(cliente.nome)}20`, color:cor(cliente.nome), display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, flexShrink:0 }}>
                {iniciais(cliente.nome)}
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:600, color:'var(--label)' }}>{cliente.nome}</div>
                <div style={{ fontSize:11, color:'var(--label-3)', marginTop:2 }}>
                  {cliente.tipo === 'J' ? 'Pessoa Jurídica' : 'Pessoa Física'} · {cliente.situacao === 1 ? '● Ativo' : '○ Inativo'}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:28, height:28, borderRadius:6, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
          {/* Contato */}
          <div style={{ background:'var(--bg)', borderRadius:10, padding:'14px 16px', marginBottom:14, border:'0.5px solid var(--sep)' }}>
            <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--label-3)', marginBottom:10 }}>Contato</div>
            <Row icon={FileText} label="CPF/CNPJ" value={cliente.numeroDocumento} />
            <Row icon={Phone}    label="Celular"   value={cliente.celular || cliente.telefone} />
            <Row icon={Mail}     label="E-mail"    value={cliente.email} />
          </div>

          {/* Endereço */}
          {cliente.endereco?.geral?.municipio && (
            <div style={{ background:'var(--bg)', borderRadius:10, padding:'14px 16px', marginBottom:14, border:'0.5px solid var(--sep)' }}>
              <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--label-3)', marginBottom:10 }}>Endereço</div>
              <Row icon={MapPin} label="Endereço" value={
                `${cliente.endereco.geral.endereco}, ${cliente.endereco.geral.numero}${cliente.endereco.geral.complemento ? ' · '+cliente.endereco.geral.complemento : ''} — ${cliente.endereco.geral.bairro}, ${cliente.endereco.geral.municipio}/${cliente.endereco.geral.uf} · CEP ${cliente.endereco.geral.cep}`
              } />
            </div>
          )}

          {/* Pedidos recentes */}
          {pedidosCliente.length > 0 && (
            <div style={{ background:'var(--bg)', borderRadius:10, padding:'14px 16px', border:'0.5px solid var(--sep)' }}>
              <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--label-3)', marginBottom:10 }}>
                <ShoppingCart size={11} style={{ marginRight:5 }} />Pedidos recentes
              </div>
              {pedidosCliente.map((p, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'0.5px solid var(--sep)' }}>
                  <span style={{ fontSize:12, fontWeight:500, color:'var(--accent)' }}>#{p.numero}</span>
                  <span style={{ fontSize:12, color:'var(--label-2)' }}>{fmtR(p.total)}</span>
                  <span style={{ fontSize:11, color:'var(--label-3)' }}>{p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'0.5px solid var(--sep)' }}>
          <a href={`https://www.bling.com.br/contatos.php#/contatos/${cliente.id}`} target="_blank" rel="noreferrer"
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:8, border:'0.5px solid var(--sep)', background:'transparent', color:'var(--label-2)', fontSize:12, textDecoration:'none' }}>
            <ExternalLink size={12} /> Ver no Bling
          </a>
        </div>
      </div>
    </>
  )
}

export default function PageClientes({ api }) {
  const [clientes,    setClientes]    = useState([])
  const [pedidos,     setPedidos]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [busca,       setBusca]       = useState('')
  const [selecionado, setSelecionado] = useState(null)
  const [pagina,      setPagina]      = useState(1)
  const POR_PAG = 20

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [rC, rP] = await Promise.all([
        fetch(`${api}/api/dashboard/contatos`).catch(() => null),
        fetch(`${api}/api/dashboard/financeiro`).catch(() => null),
      ])
      if (rC?.ok) {
        const d = await rC.json()
        setClientes(d.contatos || [])
      }
      if (rP?.ok) {
        const d = await rP.json()
        setPedidos(d.pedidos_recentes || [])
      }
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

  const total    = filtrados.length
  const inicio   = (pagina - 1) * POR_PAG
  const pagAtual = filtrados.slice(inicio, inicio + POR_PAG)
  const totalPags = Math.ceil(total / POR_PAG)
  const iniciais  = nome => (nome||'?').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()
  const cores     = ['#1D9E75','#378ADD','#534AB7','#e65100','#EF9F27','#993556']
  const cor       = nome => cores[(nome||'').charCodeAt(0) % cores.length]

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
      <div style={{ padding:'24px 28px 16px', borderBottom:'0.5px solid var(--sep)', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:500, margin:0, color:'var(--label)' }}>Clientes</h1>
            <p style={{ fontSize:13, color:'var(--label-3)', margin:'3px 0 0' }}>{total} contatos · clique para ver detalhes</p>
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
          {busca && <button onClick={() => setBusca('')} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--label-3)' }}><X size={12} /></button>}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>
        {loading ? (
          <div style={{ padding:32, textAlign:'center', color:'var(--label-3)', fontSize:13 }}>Carregando...</div>
        ) : pagAtual.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:'var(--label-3)', fontSize:13 }}>Nenhum cliente encontrado</div>
        ) : pagAtual.map((c, i) => (
          <div key={i} onClick={() => setSelecionado(c)}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 28px', borderBottom:'0.5px solid var(--sep)', cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background='var(--bg-2)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            <div style={{ width:38, height:38, borderRadius:'50%', flexShrink:0, background:`${cor(c.nome)}20`, color:cor(c.nome), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700 }}>
              {iniciais(c.nome)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nome || '—'}</div>
              <div style={{ fontSize:11, color:'var(--label-3)', marginTop:1 }}>
                {c.numeroDocumento && <span>{c.numeroDocumento} · </span>}
                {c.celular || c.telefone || 'Sem telefone'}
              </div>
            </div>
            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background: c.situacao===1?'#1D9E7520':'var(--fill)', color: c.situacao===1?'#1D9E75':'var(--label-3)', flexShrink:0 }}>
              {c.situacao===1?'Ativo':'Inativo'}
            </span>
          </div>
        ))}
      </div>

      {totalPags > 1 && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 28px', borderTop:'0.5px solid var(--sep)', fontSize:12, color:'var(--label-3)', flexShrink:0 }}>
          <span>{inicio+1}–{Math.min(inicio+POR_PAG, total)} de {total}</span>
          <div style={{ display:'flex', gap:4 }}>
            {pagina > 1 && <button onClick={() => setPagina(p=>p-1)} style={{ padding:'4px 10px', borderRadius:6, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', fontSize:12 }}>←</button>}
            {pagina < totalPags && <button onClick={() => setPagina(p=>p+1)} style={{ padding:'4px 10px', borderRadius:6, border:'0.5px solid var(--sep)', background:'transparent', cursor:'pointer', color:'var(--label-3)', fontSize:12 }}>→</button>}
          </div>
        </div>
      )}

      {selecionado && <Drawer cliente={selecionado} onClose={() => setSelecionado(null)} api={api} pedidos={pedidos} />}
    </div>
  )
}
