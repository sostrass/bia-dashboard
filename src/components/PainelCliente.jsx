import { useState, useEffect } from 'react'
import {
  Search, RefreshCw, Package, ShoppingBag, Truck,
  Send, ChevronDown, ChevronUp, Hash, X,
} from 'lucide-react'

// ── T system ──────────────────────────────────────────────────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#7b81a0', ink4:'#3a3f5c',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)', greenBor:'rgba(0,230,118,.25)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.08)', amberBor:'rgba(255,179,0,.25)',
  red:'#ff4757',  redDim:'rgba(255,71,87,.07)',   redBor:'rgba(255,71,87,.25)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.09)',purpleBor:'rgba(167,139,250,.25)',
  blue:'#4f8ef7', blueDim:'rgba(79,142,247,.08)',  blueBor:'rgba(79,142,247,.25)',
  cyan:'#06b6d4', cyanDim:'rgba(6,182,212,.08)',   cyanBor:'rgba(6,182,212,.22)',
  sep:'rgba(255,255,255,.05)', sep2:'rgba(255,255,255,.08)',
  gray:'rgba(255,255,255,.04)',
}

const STATUS_CFG = {
  open:      { label:'Em aberto',    cor:T.amber  },
  closed:    { label:'Entregue',     cor:T.green  },
  cancelled: { label:'Cancelado',    cor:T.red    },
  refunded:  { label:'Devolvido',    cor:T.purple },
  invoiced:  { label:'NFe emitida',  cor:T.blue   },
  shipped:   { label:'Enviado',      cor:T.blue   },
  progress:  { label:'Em andamento', cor:T.blue   },
  verified:  { label:'Verificado',   cor:T.green  },
  failed:    { label:'Não entregue', cor:T.red    },
}

// ── PedidoCard ────────────────────────────────────────────────────────────────
function PedidoCard({ pedido, telefone, api, onEnviar }) {
  const [expandido, setExpandido] = useState(false)
  const [enviando,  setEnviando]  = useState(null)
  const sc = STATUS_CFG[pedido.status] || STATUS_CFG.open

  const enviar = async (acao) => {
    setEnviando(acao)
    try {
      const r = await fetch(`${api}/api/contatos/${telefone}/pedidos/${pedido.id}/enviar`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ acao }),
      })
      const d = await r.json()
      if (d.ok) onEnviar?.(d.mensagem)
    } catch {}
    setEnviando(null)
  }

  const BtnAcao = ({ acao, cor, icon:Ic, label }) => (
    <button onClick={()=>enviar(acao)} disabled={!!enviando}
      style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',
        gap:5,padding:'7px 4px',borderRadius:8,cursor:'pointer',
        background:`${cor}12`,color:cor,border:`1px solid ${cor}30`,
        fontSize:10,fontWeight:700,transition:'all .12s',
        opacity:enviando&&enviando!==acao?.5:1 }}
      onMouseEnter={e=>{ e.currentTarget.style.background=`${cor}22` }}
      onMouseLeave={e=>{ e.currentTarget.style.background=`${cor}12` }}>
      {enviando===acao
        ? <RefreshCw size={9} style={{ animation:'pc-spin 1s linear infinite' }}/>
        : <Ic size={9}/>}
      {label}
    </button>
  )

  return (
    <div style={{ margin:'6px 8px',borderRadius:11,overflow:'hidden',
      background:T.bg3,border:`1px solid ${T.sep}`,
      boxShadow:'0 2px 8px rgba(0,0,0,.2)' }}>

      {/* Faixa de status */}
      <div style={{ height:2.5,background:`linear-gradient(90deg,${sc.cor},${sc.cor}60)`,
        boxShadow:`0 0 8px ${sc.cor}50` }}/>

      {/* Conteúdo */}
      <div style={{ padding:'10px 11px' }}>
        {/* Cabeçalho */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
          <div style={{ display:'flex',alignItems:'center',gap:5 }}>
            <Hash size={10} style={{ color:T.ink4 }}/>
            <span style={{ fontSize:13,fontWeight:700,color:T.ink1 }}>{pedido.numero}</span>
            {pedido.numero_loja !== '—' && (
              <span style={{ fontSize:9.5,color:T.ink4 }}>· Loja #{pedido.numero_loja}</span>
            )}
          </div>
          <span style={{ fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:99,
            background:`${sc.cor}15`,color:sc.cor,border:`0.5px solid ${sc.cor}30` }}>
            {sc.label}
          </span>
        </div>

        {/* Campos */}
        <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
          {[
            { l:'Total',     v:`R$ ${pedido.total}`,        show:true },
            { l:'Data',      v:pedido.data,                 show:true },
            { l:'Pagamento', v:pedido.forma_pagamento,      show:pedido.forma_pagamento!=='—' },
            { l:'Frete',     v:pedido.frete,                show:pedido.frete!=='—' },
          ].filter(r=>r.show).map((r,i) => (
            <div key={i} style={{ display:'flex',justifyContent:'space-between' }}>
              <span style={{ fontSize:10,color:T.ink4 }}>{r.l}</span>
              <span style={{ fontSize:10,fontWeight:600,color:T.ink2 }}>{r.v}</span>
            </div>
          ))}

          {pedido.rastreio !== '—' && (
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',
              marginTop:3,paddingTop:5,borderTop:`1px solid ${T.sep}` }}>
              <span style={{ fontSize:10,color:T.ink4 }}>Rastreio</span>
              <span style={{ fontSize:10,fontWeight:700,fontFamily:'monospace',color:T.blue }}>
                {pedido.rastreio}
              </span>
            </div>
          )}

          {pedido.transportadora !== '—' && (
            <div style={{ display:'flex',justifyContent:'space-between' }}>
              <span style={{ fontSize:10,color:T.ink4 }}>Transportadora</span>
              <span style={{ fontSize:10,color:T.ink2 }}>{pedido.transportadora}</span>
            </div>
          )}
        </div>

        {/* Expandir produtos */}
        {pedido.produtos?.length > 0 && (
          <button onClick={()=>setExpandido(v=>!v)}
            style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',
              marginTop:8,paddingTop:6,borderTop:`1px solid ${T.sep}`,
              background:'none',border:'none',cursor:'pointer',color:T.ink4,fontSize:10 }}>
            <span>{pedido.itens}</span>
            {expandido ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
          </button>
        )}

        {/* Lista produtos */}
        {expandido && pedido.produtos?.map((prod,i) => (
          <div key={i} style={{ marginTop:6,display:'flex',alignItems:'flex-start',
            gap:7,padding:'7px 8px',borderRadius:8,background:T.bg4 }}>
            <Package size={10} style={{ color:T.ink4,flexShrink:0,marginTop:1 }}/>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:10,lineHeight:1.4,color:T.ink2 }}>{prod.nome}</div>
              <div style={{ fontSize:9.5,marginTop:2,color:T.ink4 }}>
                {prod.qtd}× · R$ {prod.preco} · {prod.sku}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ações */}
      <div style={{ padding:'0 8px 8px',display:'flex',gap:5 }}>
        <BtnAcao acao="resumo"   cor={T.green}  icon={Send}        label="Resumo"/>
        {pedido.rastreio !== '—' && (
          <BtnAcao acao="rastreio" cor={T.blue}   icon={Truck}       label="Rastreio"/>
        )}
        {pedido.produtos?.length > 0 && (
          <BtnAcao acao="produtos" cor={T.purple} icon={ShoppingBag} label="Produtos"/>
        )}
      </div>
    </div>
  )
}

// ── PainelCliente ─────────────────────────────────────────────────────────────
export default function PainelCliente({ sel, api }) {
  const [aba,      setAba]      = useState('pedidos')
  const [pedidos,  setPedidos]  = useState([])
  const [produtos, setProdutos] = useState([])
  const [busca,    setBusca]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [aviso,    setAviso]    = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!sel?.telefone) return
    setLoading(true); setPedidos([]); setAviso('')
    fetch(`${api}/api/contatos/${sel.telefone}/pedidos`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setPedidos(d?.pedidos||[]); setAviso(d?.aviso||''); setLoading(false) })
      .catch(()=>setLoading(false))
  }, [sel?.telefone, api])

  useEffect(() => {
    if (aba!=='catalogo'||!busca.trim()) return
    const t = setTimeout(()=>{
      fetch(`${api}/api/fase5/portfolio?q=${encodeURIComponent(busca)}`)
        .then(r=>r.ok?r.json():null).then(d=>setProdutos(d?.produtos||[])).catch(()=>{})
    }, 380)
    return ()=>clearTimeout(t)
  }, [busca, aba, api])

  const onEnviar = () => {
    setFeedback('✓ Enviado no chat!')
    setTimeout(()=>setFeedback(''), 3000)
  }

  const AbaBtn = ({ id, label }) => (
    <button onClick={()=>setAba(id)}
      style={{ flex:1,padding:'9px 0',fontSize:11,fontWeight:600,
        background:'none',border:'none',cursor:'pointer',transition:'all .12s',
        color: aba===id ? T.green : T.ink4,
        borderBottom:`2px solid ${aba===id?T.green:'transparent'}` }}>
      {label}
    </button>
  )

  return (
    <div style={{ display:'flex',flexDirection:'column',overflow:'hidden',
      background:T.bg2,borderLeft:`1px solid ${T.sep}`,width:214,flexShrink:0 }}>
      <style>{`@keyframes pc-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Abas */}
      <div style={{ display:'flex',borderBottom:`1px solid ${T.sep}`,flexShrink:0 }}>
        <AbaBtn id="pedidos"  label="Pedidos"/>
        <AbaBtn id="catalogo" label="Catálogo"/>
        <AbaBtn id="perfil"   label="Perfil"/>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{ padding:'7px 12px',fontSize:11,fontWeight:600,textAlign:'center',
          background:T.greenDim,color:T.green,borderBottom:`1px solid ${T.greenBor}` }}>
          {feedback}
        </div>
      )}

      <div style={{ flex:1,overflowY:'auto' }}>

        {/* ── PEDIDOS ── */}
        {aba==='pedidos' && (
          <div>
            {aviso && (
              <div style={{ margin:'6px 8px',padding:'8px 10px',borderRadius:9,
                background:T.amberDim,color:T.amber,border:`1px solid ${T.amberBor}`,
                fontSize:10 }}>
                {aviso}
              </div>
            )}
            {loading && (
              <div style={{ display:'flex',justifyContent:'center',padding:'24px 0',color:T.ink4 }}>
                <RefreshCw size={14} style={{ animation:'pc-spin 1s linear infinite' }}/>
              </div>
            )}
            {!loading && pedidos.length===0 && (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',
                padding:'32px 16px',textAlign:'center' }}>
                <ShoppingBag size={22} style={{ color:T.ink4,opacity:.3,marginBottom:8 }}/>
                <p style={{ fontSize:12,color:T.ink4,margin:0 }}>Nenhum pedido encontrado</p>
                <p style={{ fontSize:10.5,color:T.ink4,marginTop:4 }}>Vincule o CPF para filtrar</p>
              </div>
            )}
            {pedidos.map((p,i) => (
              <PedidoCard key={p.id||i} pedido={p}
                telefone={sel.telefone} api={api} onEnviar={onEnviar}/>
            ))}
          </div>
        )}

        {/* ── CATÁLOGO ── */}
        {aba==='catalogo' && (
          <div>
            <div style={{ padding:'8px',borderBottom:`1px solid ${T.sep}` }}>
              <div style={{ position:'relative' }}>
                <Search size={11} style={{ position:'absolute',left:9,top:'50%',
                  transform:'translateY(-50%)',color:T.ink4 }}/>
                <input value={busca} onChange={e=>setBusca(e.target.value)}
                  placeholder="Buscar produto..."
                  style={{ width:'100%',paddingLeft:28,paddingRight:8,paddingTop:7,paddingBottom:7,
                    borderRadius:9,background:T.bg3,border:`1px solid ${T.sep}`,
                    color:T.ink1,fontSize:11,outline:'none',fontFamily:'inherit' }}/>
              </div>
            </div>
            {produtos.length===0 && (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',
                padding:'32px 16px',textAlign:'center' }}>
                <Package size={22} style={{ color:T.ink4,opacity:.3,marginBottom:8 }}/>
                <p style={{ fontSize:12,color:T.ink4,margin:0 }}>
                  {busca?'Nenhum produto encontrado':'Digite para buscar'}
                </p>
              </div>
            )}
            {produtos.map((p,i) => (
              <div key={p.id||i} style={{ display:'flex',alignItems:'center',gap:9,
                padding:'9px 10px',borderBottom:`1px solid ${T.sep}` }}>
                <div style={{ width:32,height:32,borderRadius:8,flexShrink:0,
                  background:T.bg3,border:`1px solid ${T.sep}`,
                  display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden' }}>
                  {p.imagem
                    ? <img src={p.imagem} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                    : <Package size={12} style={{ color:T.ink4 }}/>}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:11,fontWeight:500,color:T.ink1,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                    {p.nome}
                  </div>
                  <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:2 }}>
                    <span style={{ fontSize:11,fontWeight:700,color:T.green }}>
                      R$ {parseFloat(p.preco||0).toFixed(2)}
                    </span>
                    <span style={{ fontSize:9.5,fontWeight:600,padding:'1px 6px',borderRadius:99,
                      background:p.disponivel?T.greenDim:T.redDim,
                      color:p.disponivel?T.green:T.red }}>
                      {p.disponivel ? `${p.estoque} un.` : 'Sem estoque'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PERFIL ── */}
        {aba==='perfil' && sel && (
          <div style={{ padding:'12px' }}>
            {/* Avatar card */}
            <div style={{ padding:'16px',borderRadius:12,textAlign:'center',
              background:T.bg3,border:`1px solid ${T.sep}`,marginBottom:12 }}>
              <div style={{ width:44,height:44,borderRadius:'50%',margin:'0 auto 10px',
                background:T.greenDim,border:`2px solid ${T.greenBor}`,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:14,fontWeight:800,color:T.green }}>
                {(sel.nome||sel.telefone).slice(0,2).toUpperCase()}
              </div>
              <div style={{ fontSize:13,fontWeight:700,color:T.ink1 }}>{sel.nome||'Sem nome'}</div>
              <div style={{ fontSize:10.5,fontFamily:'monospace',marginTop:3,color:T.ink4 }}>{sel.telefone}</div>
            </div>

            {/* Stats */}
            {[
              { l:'Total msgs',       v:sel.total_msgs||0 },
              { l:'Última interação', v:sel.ultima_msg ? new Date(sel.ultima_msg).toLocaleDateString('pt-BR') : '—' },
            ].map((r,i) => (
              <div key={i} style={{ display:'flex',justifyContent:'space-between',
                padding:'5px 2px',borderBottom:`1px solid ${T.sep}` }}>
                <span style={{ fontSize:11,color:T.ink4 }}>{r.l}</span>
                <span style={{ fontSize:11,fontWeight:600,color:T.ink2 }}>{r.v}</span>
              </div>
            ))}

            {/* Tags */}
            {(sel.tags||[]).length > 0 && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',
                  letterSpacing:'.07em',color:T.ink4,marginBottom:7 }}>Tags</div>
                <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
                  {sel.tags.map((t,i) => (
                    <span key={i} style={{ fontSize:10.5,fontWeight:500,
                      padding:'3px 9px',borderRadius:99,
                      background:T.gray,color:T.ink3,border:`1px solid ${T.sep}` }}>
                      {t}
                    </span>
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
