import { useState, useEffect } from 'lucide-react'
import { Search, RefreshCw, Package, ShoppingBag, Truck, CreditCard, Send, ChevronDown, ChevronUp, MapPin, Hash } from 'lucide-react'

const STATUS_CFG = {
  open:       { label:'Em aberto',    color:'var(--orange)', bg:'rgba(245,158,11,0.1)'  },
  closed:     { label:'Entregue',     color:'var(--accent)', bg:'rgba(0,212,170,0.1)'   },
  cancelled:  { label:'Cancelado',    color:'var(--red)',    bg:'rgba(226,75,74,0.1)'   },
  refunded:   { label:'Devolvido',    color:'var(--purple)', bg:'rgba(167,139,250,0.1)' },
  invoiced:   { label:'NFe emitida',  color:'var(--blue)',   bg:'rgba(74,159,255,0.1)'  },
  shipped:    { label:'Enviado',      color:'var(--blue)',   bg:'rgba(74,159,255,0.1)'  },
  progress:   { label:'Em andamento', color:'var(--blue)',   bg:'rgba(74,159,255,0.1)'  },
  verified:   { label:'Verificado',   color:'var(--accent)', bg:'rgba(0,212,170,0.1)'   },
  failed:     { label:'Não entregue', color:'var(--red)',    bg:'rgba(226,75,74,0.1)'   },
}

function PedidoCard({ pedido, telefone, api, onEnviar }) {
  const [expandido, setExpandido] = useState(false)
  const [enviando,  setEnviando]  = useState(null)
  const sc = STATUS_CFG[pedido.status] || STATUS_CFG.open

  const enviar = async (acao) => {
    setEnviando(acao)
    try {
      const r = await fetch(`${api}/api/contatos/${telefone}/pedidos/${pedido.id}/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao })
      })
      const d = await r.json()
      if (d.ok) onEnviar?.(d.mensagem)
    } catch (e) { console.error(e) }
    setEnviando(null)
  }

  return (
    <div className="mx-2 my-2 rounded-[10px] overflow-hidden"
      style={{ background:'var(--bg-3)', border:'1px solid var(--sep)' }}>

      {/* Header do pedido */}
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Hash size={10} style={{ color:'var(--label-4)' }} />
            <span className="text-[12px] font-bold" style={{ color:'var(--label)' }}>{pedido.numero}</span>
            {pedido.numero_loja !== '—' && (
              <span className="text-[9px]" style={{ color:'var(--label-4)' }}>· Loja #{pedido.numero_loja}</span>
            )}
          </div>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-[4px]"
            style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
        </div>

        {/* Campos resumidos */}
        <div className="space-y-1">
          {[
            { l:'Total',    v:`R$ ${pedido.total}`,         show: true },
            { l:'Data',     v: pedido.data,                  show: true },
            { l:'Pagamento',v: pedido.forma_pagamento,       show: pedido.forma_pagamento !== '—' },
            { l:'Frete',    v: pedido.frete,                 show: pedido.frete !== '—' },
          ].filter(r=>r.show).map((r,i) => (
            <div key={i} className="flex justify-between">
              <span className="text-[9px]" style={{ color:'var(--label-4)' }}>{r.l}</span>
              <span className="text-[9px] font-medium" style={{ color:'var(--label-2)' }}>{r.v}</span>
            </div>
          ))}

          {/* Rastreio destacado */}
          {pedido.rastreio !== '—' && (
            <div className="flex justify-between items-center mt-1 pt-1" style={{ borderTop:'1px solid var(--sep)' }}>
              <span className="text-[9px]" style={{ color:'var(--label-4)' }}>Rastreio</span>
              <span className="text-[9px] font-bold font-mono" style={{ color:'var(--blue)' }}>
                {pedido.rastreio}
              </span>
            </div>
          )}

          {/* Transportadora */}
          {pedido.transportadora !== '—' && (
            <div className="flex justify-between">
              <span className="text-[9px]" style={{ color:'var(--label-4)' }}>Transportadora</span>
              <span className="text-[9px]" style={{ color:'var(--label-2)' }}>{pedido.transportadora}</span>
            </div>
          )}
        </div>

        {/* Expandir produtos */}
        {pedido.produtos.length > 0 && (
          <button onClick={() => setExpandido(v=>!v)}
            className="w-full flex items-center justify-between mt-2 pt-2 text-[9px]"
            style={{ borderTop:'1px solid var(--sep)', color:'var(--label-3)' }}>
            <span>{pedido.itens}</span>
            {expandido ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
          </button>
        )}

        {/* Lista de produtos */}
        {expandido && pedido.produtos.map((prod, i) => (
          <div key={i} className="mt-1.5 flex items-start gap-1.5 p-2 rounded-[7px]"
            style={{ background:'var(--bg-2)' }}>
            <Package size={10} className="flex-shrink-0 mt-0.5" style={{ color:'var(--label-4)' }} />
            <div className="flex-1 min-w-0">
              <div className="text-[9px] leading-tight" style={{ color:'var(--label)' }}>{prod.nome}</div>
              <div className="text-[8px] mt-0.5" style={{ color:'var(--label-4)' }}>
                {prod.qtd}x · R$ {prod.preco} · {prod.sku}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ações — enviar na conversa */}
      <div className="px-2 pb-2 flex gap-1.5">
        <button onClick={() => enviar('resumo')} disabled={!!enviando}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-[7px] text-[9px] font-semibold transition-all"
          style={{ background: enviando==='resumo'?'rgba(0,212,170,0.2)':'rgba(0,212,170,0.1)', color:'var(--accent)', border:'1px solid rgba(0,212,170,0.2)' }}>
          {enviando==='resumo' ? <RefreshCw size={9} className="animate-spin"/> : <Send size={9}/>}
          Resumo
        </button>
        {pedido.rastreio !== '—' && (
          <button onClick={() => enviar('rastreio')} disabled={!!enviando}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-[7px] text-[9px] font-semibold transition-all"
            style={{ background: enviando==='rastreio'?'rgba(74,159,255,0.2)':'rgba(74,159,255,0.1)', color:'var(--blue)', border:'1px solid rgba(74,159,255,0.2)' }}>
            {enviando==='rastreio' ? <RefreshCw size={9} className="animate-spin"/> : <Truck size={9}/>}
            Rastreio
          </button>
        )}
        {pedido.produtos.length > 0 && (
          <button onClick={() => enviar('produtos')} disabled={!!enviando}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-[7px] text-[9px] font-semibold transition-all"
            style={{ background: enviando==='produtos'?'rgba(167,139,250,0.2)':'rgba(167,139,250,0.1)', color:'var(--purple)', border:'1px solid rgba(167,139,250,0.2)' }}>
            {enviando==='produtos' ? <RefreshCw size={9} className="animate-spin"/> : <ShoppingBag size={9}/>}
            Produtos
          </button>
        )}
      </div>
    </div>
  )
}

export default function PainelCliente({ sel, api }) {
  const [aba,       setAba]      = useState('pedidos')
  const [pedidos,   setPedidos]  = useState([])
  const [produtos,  setProdutos] = useState([])
  const [buscaProd, setBuscaProd]= useState('')
  const [loading,   setLoading]  = useState(false)
  const [aviso,     setAviso]    = useState('')
  const [enviado,   setEnviado]  = useState('')

  useEffect(() => {
    if (!sel?.telefone) return
    setLoading(true); setPedidos([]); setAviso('')
    fetch(`${api}/api/contatos/${sel.telefone}/pedidos`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setPedidos(d?.pedidos || [])
        setAviso(d?.aviso || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [sel?.telefone, api])

  useEffect(() => {
    if (aba !== 'catalogo' || !buscaProd.trim()) return
    const t = setTimeout(() => {
      fetch(`${api}/api/fase5/portfolio?q=${encodeURIComponent(buscaProd)}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => setProdutos(d?.produtos || []))
        .catch(() => {})
    }, 400)
    return () => clearTimeout(t)
  }, [buscaProd, aba, api])

  const onEnviar = (msg) => {
    setEnviado('✓ Enviado no chat!')
    setTimeout(() => setEnviado(''), 3000)
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ background:'var(--bg-2)', borderLeft:'1px solid var(--sep)', width:210, flexShrink:0 }}>
      {/* Abas */}
      <div className="flex border-b flex-shrink-0" style={{ borderColor:'var(--sep)' }}>
        {[['pedidos','Pedidos'],['catalogo','Catálogo'],['perfil','Perfil']].map(([v,l]) => (
          <button key={v} onClick={() => setAba(v)}
            className="flex-1 py-2 text-[10px] font-semibold transition-all"
            style={{ color:aba===v?'var(--accent)':'var(--label-4)', borderBottom:`2px solid ${aba===v?'var(--accent)':'transparent'}`, background:'transparent' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Feedback de envio */}
      {enviado && (
        <div className="px-3 py-1.5 text-[10px] font-semibold text-center"
          style={{ background:'rgba(0,212,170,0.1)', color:'var(--accent)' }}>
          {enviado}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scroll-hidden">

        {/* PEDIDOS */}
        {aba === 'pedidos' && (
          <div>
            {aviso && (
              <div className="mx-2 mt-2 px-3 py-2 rounded-[8px] text-[9px]"
                style={{ background:'rgba(245,158,11,0.1)', color:'var(--orange)', border:'1px solid rgba(245,158,11,0.2)' }}>
                {aviso}
              </div>
            )}
            {loading && (
              <div className="flex justify-center py-6" style={{ color:'var(--label-3)' }}>
                <RefreshCw size={13} className="animate-spin" />
              </div>
            )}
            {!loading && pedidos.length === 0 && (
              <div className="flex flex-col items-center py-8 px-4 text-center">
                <ShoppingBag size={22} className="mb-2 opacity-30" style={{ color:'var(--label-3)' }} />
                <p className="text-[11px]" style={{ color:'var(--label-3)' }}>Nenhum pedido encontrado</p>
                <p className="text-[10px] mt-1" style={{ color:'var(--label-4)' }}>Vincule o CPF ao contato para filtrar</p>
              </div>
            )}
            {pedidos.map((p, i) => (
              <PedidoCard key={p.id||i} pedido={p} telefone={sel.telefone} api={api} onEnviar={onEnviar} />
            ))}
          </div>
        )}

        {/* CATÁLOGO */}
        {aba === 'catalogo' && (
          <div>
            <div className="p-2 border-b" style={{ borderColor:'var(--sep)' }}>
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color:'var(--label-3)' }} />
                <input value={buscaProd} onChange={e => setBuscaProd(e.target.value)}
                  placeholder="Buscar produto..."
                  className="w-full pl-7 pr-2 py-1.5 rounded-[8px] text-[10px] outline-none"
                  style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }} />
              </div>
            </div>
            {produtos.length === 0 && (
              <div className="flex flex-col items-center py-8 px-4 text-center">
                <Package size={22} className="mb-2 opacity-30" style={{ color:'var(--label-3)' }} />
                <p className="text-[11px]" style={{ color:'var(--label-3)' }}>
                  {buscaProd ? 'Nenhum produto encontrado' : 'Digite para buscar'}
                </p>
              </div>
            )}
            {produtos.map((p, i) => (
              <div key={p.id||i} className="flex items-center gap-2 px-3 py-2.5 border-b"
                style={{ borderColor:'var(--sep)' }}>
                <div className="w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0"
                  style={{ background:'var(--bg-3)', border:'1px solid var(--sep)' }}>
                  {p.imagem ? <img src={p.imagem} alt="" className="w-full h-full object-cover rounded-[6px]" />
                            : <Package size={12} style={{ color:'var(--label-3)' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium truncate" style={{ color:'var(--label)' }}>{p.nome}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold" style={{ color:'var(--accent)' }}>R$ {parseFloat(p.preco||0).toFixed(2)}</span>
                    <span className="text-[9px]" style={{ color:p.disponivel?'var(--accent)':'var(--red)' }}>
                      {p.disponivel ? `${p.estoque} un.` : 'Sem estoque'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PERFIL */}
        {aba === 'perfil' && sel && (
          <div className="p-3 space-y-3">
            <div className="rounded-[10px] p-3 text-center" style={{ background:'var(--bg-3)', border:'1px solid var(--sep)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] mx-auto mb-2"
                style={{ background:'rgba(0,212,170,0.15)', color:'var(--accent)' }}>
                {(sel.nome||sel.telefone).slice(0,2).toUpperCase()}
              </div>
              <div className="text-[12px] font-semibold" style={{ color:'var(--label)' }}>{sel.nome||'Sem nome'}</div>
              <div className="text-[10px] font-mono mt-0.5" style={{ color:'var(--label-3)' }}>{sel.telefone}</div>
            </div>
            {[
              { l:'Total msgs',      v: sel.total_msgs||0 },
              { l:'Última interação',v: sel.ultima_msg ? new Date(sel.ultima_msg).toLocaleDateString('pt-BR') : '—' },
            ].map((r,i) => (
              <div key={i} className="flex justify-between px-1">
                <span className="text-[10px]" style={{ color:'var(--label-4)' }}>{r.l}</span>
                <span className="text-[10px] font-medium" style={{ color:'var(--label-2)' }}>{r.v}</span>
              </div>
            ))}
            {(sel.tags||[]).length > 0 && (
              <div>
                <div className="text-[9px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color:'var(--label-4)' }}>Tags</div>
                <div className="flex flex-wrap gap-1">
                  {sel.tags.map((t,i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-[4px]"
                      style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
