import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RefreshCw, MessageSquare, Send, X, Zap, AlertCircle,
  MoreVertical, Wifi, WifiOff, Package, ShoppingCart,
  CheckCircle2, Clock, Pause, Image, Video, Search,
  ChevronDown, ExternalLink, User, Sparkles, Star
} from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtR    = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmtMin  = ts => { if(!ts) return '—'; const d=Date.now()-new Date(ts).getTime(),m=Math.floor(d/60000); return m<60?`${m}m`:`${Math.floor(m/60)}h` }
const fmtHora = ts => ts ? new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : ''
const fmtTel  = tel => { const t=(tel||'').replace(/\D/g,'').replace(/^55/,''); return t.length===11?`(${t.slice(0,2)}) ${t.slice(2,7)}-${t.slice(7)}`:tel }
const iniciais = n => (n||'?').split(' ').slice(0,2).map(p=>p[0]).join('').toUpperCase()
const CORES   = ['#1D9E75','#378ADD','#534AB7','#e65100','#EF9F27','#993556','#25D366']
const cor     = s => CORES[(s||'').charCodeAt(0)%CORES.length]
const ehAtiva = s => Date.now()-new Date(s.atualizado_em).getTime() < 30*60*1000

const STATUS_ATEND = {
  aberto:     { label:'Aberto',        color:'#EF9F27', bg:'#EF9F2718', icon:'○' },
  andamento:  { label:'Em andamento',  color:'#378ADD', bg:'#378ADD18', icon:'◑' },
  resolvido:  { label:'Resolvido',     color:'#1D9E75', bg:'#1D9E7518', icon:'●' },
  aguardando: { label:'Aguardando',    color:'#534AB7', bg:'#534AB718', icon:'◷' },
}

// ── Bolha de mensagem ──────────────────────────────────────────────────────────
function Bolha({ msg }) {
  const entrada = msg.direcao === 'entrada'
  const bg = entrada ? 'var(--bg-2)' : '#1D9E7518'
  const bdr = entrada ? 'var(--sep)' : '#1D9E7530'
  return (
    <div style={{ display:'flex', flexDirection:entrada?'row':'row-reverse', alignItems:'flex-end', gap:5, marginBottom:5 }}>
      {entrada && (
        <div style={{ width:20,height:20,borderRadius:'50%',flexShrink:0,background:'#25D36618',color:'#25D366',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700 }}>C</div>
      )}
      <div style={{ maxWidth:'73%',padding:'7px 10px',borderRadius:entrada?'2px 11px 11px 11px':'11px 2px 11px 11px',background:bg,border:`0.5px solid ${bdr}` }}>
        {msg.midia_tipo==='image'&&msg.midia_url&&<img src={msg.midia_url} alt="" style={{width:'100%',borderRadius:5,marginBottom:3,maxHeight:130,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>}
        <div style={{fontSize:12,color:'var(--label)',lineHeight:1.5,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
          {msg.conteudo||(msg.midia_tipo?`[${msg.midia_tipo}]`:'—')}
        </div>
        <div style={{fontSize:10,color:'var(--label-3)',marginTop:2,textAlign:entrada?'left':'right'}}>
          {fmtHora(msg.criado_em)}{!entrada&&<span style={{marginLeft:3}}>✓✓</span>}
        </div>
      </div>
    </div>
  )
}

// ── Mini-card pedido do cliente ────────────────────────────────────────────────
function PedidoCard({ pedido }) {
  const mapSit = s => { const id=typeof s==='object'?s.id||s.valor:s; return {6:'Aberto',9:'Atendido',12:'Cancelado',14:'Faturado',15:'Verificado'}[id]||String(id) }
  const sit  = mapSit(pedido.situacao)
  const cor2 = {Atendido:'#1D9E75',Verificado:'#1D9E75',Aberto:'#EF9F27',Cancelado:'#EF4444',Faturado:'#378ADD'}[sit]||'#888'
  return (
    <div style={{padding:'8px 10px',borderRadius:8,border:'0.5px solid var(--sep)',background:'var(--bg)',marginBottom:5}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:12,fontWeight:600,color:'var(--accent)'}}>#{pedido.numero}</span>
        <span style={{fontSize:10,padding:'1px 6px',borderRadius:99,background:`${cor2}18`,color:cor2,fontWeight:500}}>{sit}</span>
      </div>
      <div style={{fontSize:11,color:'var(--label-3)',marginTop:2}}>{pedido.data?new Date(pedido.data).toLocaleDateString('pt-BR'):'—'}</div>
      <div style={{fontSize:12,fontWeight:500,color:'var(--label)',marginTop:2}}>{fmtR(pedido.total)}</div>
    </div>
  )
}

// ── Painel de catálogo ─────────────────────────────────────────────────────────
function CatalogoPainel({ api, onEnviar, onClose }) {
  const [produtos, setProdutos] = useState([])
  const [busca,    setBusca]    = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch(`${api}/api/dashboard/catalogo`).then(r=>r.ok?r.json():null).then(d=>{
      setProdutos(d?.produtos||d||[])
    }).catch(()=>{}).finally(()=>setLoading(false))
  }, [api])

  const filtrados = produtos.filter(p => {
    if (!busca) return true
    return (p.nome||p.descricao||'').toLowerCase().includes(busca.toLowerCase())
  })

  return (
    <div style={{position:'absolute',bottom:'100%',left:0,right:0,background:'var(--bg-2)',border:'0.5px solid var(--sep)',borderRadius:'10px 10px 0 0',maxHeight:300,display:'flex',flexDirection:'column',zIndex:10,boxShadow:'0 -4px 16px rgba(0,0,0,.15)'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderBottom:'0.5px solid var(--sep)'}}>
        <Package size={13} style={{color:'var(--label-3)'}}/>
        <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar produto..." autoFocus
          style={{flex:1,border:'none',background:'transparent',outline:'none',fontSize:12,color:'var(--label)'}}/>
        <button onClick={onClose} style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--label-3)'}}><X size={13}/></button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:8}}>
        {loading ? <div style={{padding:12,textAlign:'center',color:'var(--label-3)',fontSize:12}}>Carregando...</div>
        : filtrados.length===0 ? <div style={{padding:12,textAlign:'center',color:'var(--label-3)',fontSize:12}}>Nenhum produto</div>
        : filtrados.slice(0,20).map((p,i)=>(
          <div key={i} onClick={()=>onEnviar(p)}
            style={{display:'flex',alignItems:'center',gap:8,padding:'7px 8px',borderRadius:7,cursor:'pointer'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            {p.imagemURL||p.imagens?.[0]?.link
              ? <img src={p.imagemURL||p.imagens?.[0]?.link} alt="" style={{width:32,height:32,borderRadius:5,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/>
              : <div style={{width:32,height:32,borderRadius:5,background:'var(--fill)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}><Package size={13} style={{color:'var(--label-3)'}}/></div>
            }
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:500,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nome||p.descricao||'Produto'}</div>
              <div style={{fontSize:11,color:'var(--label-3)'}}>{p.codigo||''} · {fmtR(p.preco||p.precoVenda||0)}</div>
            </div>
            <span style={{fontSize:10,padding:'2px 6px',borderRadius:99,background:'var(--accent-dim)',color:'var(--accent)'}}>Enviar</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Painel direito: conversa completa ─────────────────────────────────────────
function PainelConversa({ sessao, api, onClose }) {
  const [msgs,        setMsgs]        = useState([])
  const [loadingH,    setLoadingH]    = useState(true)
  const [texto,       setTexto]       = useState('')
  const [enviando,    setEnviando]    = useState(false)
  const [modo,        setModo]        = useState(sessao.modo||'ia')
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [ctx,         setCtx]         = useState(null)
  const [pedidosCliente, setPedidos]  = useState([])
  const [statusAtend, setStatusAtend] = useState('aberto')
  const [sugestaoIA,  setSugestaoIA]  = useState(null)
  const [loadingSug,  setLoadingSug]  = useState(false)
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false)
  const [abaDir,      setAbaDir]      = useState('info') // 'info' | 'pedidos'
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const nomeExib = (sessao.nome && sessao.nome !== sessao.telefone) ? sessao.nome : fmtTel(sessao.telefone)
  const c = cor(nomeExib)

  const carregarHistorico = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${sessao.telefone}?limit=60`)
      if (!r.ok) return
      const d = await r.json()
      setMsgs(d.mensagens||[])
      setCtx({ carrinho: d.carrinho||[], modo: d.modo||'ia' })
      setModo(d.modo||sessao.modo||'ia')
    } catch {}
    setLoadingH(false)
  }, [api, sessao.telefone])

  const carregarPedidosCliente = useCallback(async () => {
    // Busca pedidos recentes e filtra pelo telefone/nome do cliente
    try {
      const r = await fetch(`${api}/api/dashboard/financeiro`)
      if (!r.ok) return
      const d = await r.json()
      const nome = (sessao.nome||'').toLowerCase()
      const tel  = (sessao.telefone||'').replace(/\D/g,'').slice(-8)
      const pedidos = (d.pedidos_recentes||[]).filter(p => {
        const cn = (p.contato||'').toLowerCase()
        return cn.includes(nome.split(' ')[0]) || cn.includes(tel)
      })
      setPedidos(pedidos.slice(0,8))
    } catch {}
  }, [api, sessao])

  useEffect(() => {
    setLoadingH(true); setMsgs([]); setPedidos([])
    carregarHistorico()
    carregarPedidosCliente()
    const i = setInterval(carregarHistorico, 8000)
    return () => clearInterval(i)
  }, [carregarHistorico, carregarPedidosCliente])

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [msgs])

  const enviarTexto = async (msg) => {
    const txt = (msg||texto).trim()
    if (!txt||enviando) return
    setTexto(''); setSugestaoIA(null); setEnviando(true)
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ telefone: sessao.telefone, mensagem: txt, tipo:'texto' }),
      })
      await carregarHistorico()
    } catch {}
    setEnviando(false)
    inputRef.current?.focus()
  }

  const enviarProduto = async (produto) => {
    setMostrarCatalogo(false)
    const link = produto.urlLoja || produto.url || `https://sostrass.com.br/produto/${produto.codigo}`
    const msg = `📦 *${produto.nome||produto.descricao}*\n💰 ${fmtR(produto.precoVenda||produto.preco||0)}\n🔗 ${link}`
    await enviarTexto(msg)
  }

  const buscarSugestaoIA = async () => {
    if (msgs.length===0) return
    setLoadingSug(true)
    try {
      // Usa o último histórico para sugerir resposta
      const ultimas = msgs.slice(-6).map(m => `${m.direcao==='entrada'?'Cliente':'Bia'}: ${m.conteudo||''}`).join('\n')
      const r = await fetch(`${api}/api/dashboard/ia-stats`)
      // Fallback — gera sugestão local baseada no contexto
      const ultimaEntrada = msgs.filter(m=>m.direcao==='entrada').at(-1)?.conteudo||''
      if (ultimaEntrada.includes('prazo')||ultimaEntrada.includes('entrega')) {
        setSugestaoIA('O prazo de entrega depende da sua localização. Para retirada na loja, fica disponível no mesmo dia!')
      } else if (ultimaEntrada.includes('preço')||ultimaEntrada.includes('valor')) {
        setSugestaoIA('Os preços já estão com desconto PIX aplicado. Posso enviar mais detalhes do produto que te interessa?')
      } else {
        setSugestaoIA('Olá! Em que posso te ajudar hoje? 😊')
      }
    } catch {}
    setLoadingSug(false)
  }

  const alternarModo = async (novoModo) => {
    try {
      await fetch(`${api}/api/dashboard/manual/${sessao.telefone}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ modo: novoModo }),
      })
      setModo(novoModo); setMenuOpen(false)
    } catch {}
  }

  const resetarSessao = async () => {
    if (!confirm(`Resetar sessão de ${nomeExib}? O carrinho será limpo.`)) return
    try {
      await fetch(`${api}/api/dashboard/resetar-sessao?telefone=${sessao.telefone}&confirmar=sim`)
      await carregarHistorico(); setMenuOpen(false)
    } catch {}
  }

  const carrinho = ctx?.carrinho||[]
  const totalCarrinho = carrinho.reduce((s,i)=>s+(parseFloat(i.preco||0)*parseInt(i.quantidade||1)),0)
  const stAt = STATUS_ATEND[statusAtend]||STATUS_ATEND.aberto

  return (
    <div style={{display:'flex',height:'100%',overflow:'hidden'}}>

      {/* ── Coluna central: conversa ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderBottom:'0.5px solid var(--sep)',background:'var(--bg-2)',flexShrink:0}}>
          <button onClick={onClose} style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--label-3)',display:'flex',padding:3,borderRadius:5}}>
            <X size={13}/>
          </button>
          <div style={{width:30,height:30,borderRadius:'50%',background:`${c}20`,color:c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0}}>
            {iniciais(nomeExib)}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nomeExib}</div>
            <div style={{fontSize:10,color:'var(--label-3)'}}>{sessao.telefone}</div>
          </div>

          {/* Status de atendimento */}
          <div style={{position:'relative'}}>
            <button onClick={()=>setMenuOpen(m=>!m)} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:99,border:`0.5px solid ${stAt.color}`,background:stAt.bg,cursor:'pointer'}}>
              <span style={{fontSize:11,fontWeight:600,color:stAt.color}}>{stAt.icon} {stAt.label}</span>
              <ChevronDown size={10} style={{color:stAt.color}}/>
            </button>
            {menuOpen && (
              <div style={{position:'absolute',right:0,top:'100%',marginTop:4,background:'var(--bg-2)',border:'0.5px solid var(--sep)',borderRadius:10,padding:4,minWidth:160,zIndex:30,boxShadow:'0 4px 16px rgba(0,0,0,.2)'}}>
                {Object.entries(STATUS_ATEND).map(([key,st])=>(
                  <button key={key} onClick={()=>{setStatusAtend(key);setMenuOpen(false)}} style={{width:'100%',padding:'7px 10px',borderRadius:7,border:'none',background:'transparent',color:st.color,fontSize:12,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:6,fontWeight:500}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    {st.icon} {st.label}
                  </button>
                ))}
                <div style={{height:'0.5px',background:'var(--sep)',margin:'4px 0'}}/>
                {modo!=='manual'
                  ? <button onClick={()=>alternarModo('manual')} style={{width:'100%',padding:'7px 10px',borderRadius:7,border:'none',background:'transparent',color:'#534AB7',fontSize:12,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:6}}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <User size={12}/> Assumir conversa
                    </button>
                  : <button onClick={()=>alternarModo('ia')} style={{width:'100%',padding:'7px 10px',borderRadius:7,border:'none',background:'transparent',color:'#1D9E75',fontSize:12,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:6}}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <Zap size={12}/> Devolver para IA
                    </button>
                }
                <div style={{height:'0.5px',background:'var(--sep)',margin:'4px 0'}}/>
                <button onClick={resetarSessao} style={{width:'100%',padding:'7px 10px',borderRadius:7,border:'none',background:'transparent',color:'#EF4444',fontSize:12,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:6}}
                  onMouseEnter={e=>e.currentTarget.style.background='#EF444410'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <AlertCircle size={12}/> Resetar sessão
                </button>
              </div>
            )}
          </div>

          <span style={{fontSize:10,padding:'2px 6px',borderRadius:99,fontWeight:600,background:modo==='manual'?'#534AB718':'#1D9E7518',color:modo==='manual'?'#534AB7':'#1D9E75'}}>
            {modo==='manual'?'● Manual':'⚡ IA'}
          </span>
        </div>

        {/* Banner carrinho */}
        {carrinho.length>0 && (
          <div style={{padding:'6px 14px',background:'#EF9F2710',borderBottom:'0.5px solid #EF9F2730',flexShrink:0}}>
            <div style={{fontSize:11,fontWeight:600,color:'#EF9F27',marginBottom:2}}>🛒 {carrinho.length} item{carrinho.length>1?'s':''} no carrinho · {fmtR(totalCarrinho)}</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {carrinho.slice(0,3).map((item,i)=>(
                <span key={i} style={{fontSize:10,color:'var(--label-2)'}}>{item.quantidade}× {(item.nome||'').slice(0,25)}</span>
              ))}
              {carrinho.length>3&&<span style={{fontSize:10,color:'var(--label-3)'}}>+{carrinho.length-3}...</span>}
            </div>
          </div>
        )}

        {/* Mensagens */}
        <div style={{flex:1,overflowY:'auto',padding:'10px 12px'}} onClick={()=>setMenuOpen(false)}>
          {loadingH
            ? <div style={{padding:24,textAlign:'center',color:'var(--label-3)',fontSize:12}}>Carregando...</div>
            : msgs.length===0
              ? <div style={{padding:24,textAlign:'center',color:'var(--label-3)',fontSize:12}}>Sem mensagens</div>
              : <>{msgs.map((msg,i)=><Bolha key={msg.id||i} msg={msg}/>)}<div ref={bottomRef}/></>
          }
        </div>

        {/* Sugestão da IA */}
        {sugestaoIA && (
          <div style={{padding:'6px 12px',background:'#534AB710',borderTop:'0.5px solid #534AB730',flexShrink:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
              <div style={{flex:1}}>
                <div style={{fontSize:10,fontWeight:600,color:'#534AB7',marginBottom:3}}>⚡ Sugestão da IA</div>
                <div style={{fontSize:12,color:'var(--label-2)',lineHeight:1.4}}>{sugestaoIA}</div>
              </div>
              <div style={{display:'flex',gap:4,flexShrink:0}}>
                <button onClick={()=>enviarTexto(sugestaoIA)} style={{padding:'3px 8px',borderRadius:6,border:'0.5px solid #534AB7',background:'#534AB718',color:'#534AB7',fontSize:11,cursor:'pointer',fontWeight:500}}>Usar</button>
                <button onClick={()=>setSugestaoIA(null)} style={{padding:'3px 6px',borderRadius:6,border:'0.5px solid var(--sep)',background:'transparent',color:'var(--label-3)',fontSize:11,cursor:'pointer'}}><X size={10}/></button>
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{padding:'8px 12px',borderTop:'0.5px solid var(--sep)',background:'var(--bg-2)',flexShrink:0,position:'relative'}}>
          {mostrarCatalogo && (
            <CatalogoPainel api={api} onEnviar={enviarProduto} onClose={()=>setMostrarCatalogo(false)}/>
          )}

          {modo==='ia' && (
            <div style={{fontSize:11,color:'var(--label-3)',marginBottom:5,display:'flex',alignItems:'center',gap:4}}>
              <Zap size={10} style={{color:'#1D9E75'}}/> IA ativa — assuma para responder
            </div>
          )}

          {/* Barra de ações */}
          <div style={{display:'flex',gap:5,alignItems:'center',marginBottom:6}}>
            <button onClick={()=>setMostrarCatalogo(m=>!m)} title="Catálogo de produtos" style={{padding:'4px 8px',borderRadius:6,border:`0.5px solid ${mostrarCatalogo?'var(--accent)':'var(--sep)'}`,background:mostrarCatalogo?'var(--accent-dim)':'transparent',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11,color:mostrarCatalogo?'var(--accent)':'var(--label-3)'}}>
              <Package size={12}/> Catálogo
            </button>
            <button onClick={buscarSugestaoIA} disabled={loadingSug||msgs.length===0} title="Sugestão da IA" style={{padding:'4px 8px',borderRadius:6,border:'0.5px solid var(--sep)',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11,color:'var(--label-3)'}}>
              {loadingSug?<RefreshCw size={11} className="animate-spin"/>:<Sparkles size={12}/>} Sugerir IA
            </button>
            <button title="Enviar imagem" style={{padding:'4px 8px',borderRadius:6,border:'0.5px solid var(--sep)',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11,color:'var(--label-3)'}}>
              <Image size={12}/> Imagem
            </button>
            <button title="Enviar vídeo" style={{padding:'4px 8px',borderRadius:6,border:'0.5px solid var(--sep)',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11,color:'var(--label-3)'}}>
              <Video size={12}/> Vídeo
            </button>
          </div>

          {/* Campo de texto */}
          <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
            <textarea ref={inputRef} value={texto} onChange={e=>setTexto(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviarTexto()}}}
              placeholder={modo==='manual'?'Mensagem... (Enter envia, Shift+Enter quebra linha)':'Assuma o atendimento para digitar'}
              disabled={modo==='ia'} rows={2}
              style={{flex:1,padding:'8px 10px',borderRadius:9,border:'0.5px solid var(--sep)',background:modo==='ia'?'var(--bg-3)':'var(--bg)',color:'var(--label)',fontSize:13,resize:'none',outline:'none',lineHeight:1.5,opacity:modo==='ia'?.45:1}}
            />
            <button onClick={()=>enviarTexto()} disabled={!texto.trim()||enviando||modo==='ia'}
              style={{width:34,height:34,borderRadius:9,border:'none',flexShrink:0,cursor:texto.trim()&&modo==='manual'?'pointer':'default',background:texto.trim()&&modo==='manual'?'var(--accent)':'var(--fill)',color:texto.trim()&&modo==='manual'?'#000':'var(--label-3)',display:'flex',alignItems:'center',justifyContent:'center',transition:'background .15s'}}>
              {enviando?<RefreshCw size={12}/>:<Send size={12}/>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Coluna direita: info do cliente + pedidos ── */}
      <div style={{width:220,flexShrink:0,borderLeft:'0.5px solid var(--sep)',display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg-2)'}}>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'0.5px solid var(--sep)',flexShrink:0}}>
          {[['info','Resumo'],['pedidos','Pedidos']].map(([id,lb])=>(
            <button key={id} onClick={()=>setAbaDir(id)} style={{flex:1,padding:'8px 0',border:'none',background:'transparent',fontSize:12,fontWeight:abaDir===id?600:400,color:abaDir===id?'var(--accent)':'var(--label-3)',cursor:'pointer',borderBottom:`2px solid ${abaDir===id?'var(--accent)':'transparent'}`,transition:'all .15s'}}>
              {lb}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:'auto',padding:10}}>
          {abaDir==='info' ? (
            <>
              {/* Info básica */}
              <div style={{padding:'10px 10px',borderRadius:9,border:'0.5px solid var(--sep)',background:'var(--bg)',marginBottom:8}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:`${c}20`,color:c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,margin:'0 auto 8px'}}>
                  {iniciais(nomeExib)}
                </div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--label)',textAlign:'center',marginBottom:3}}>{nomeExib}</div>
                <div style={{fontSize:11,color:'var(--label-3)',textAlign:'center'}}>{fmtTel(sessao.telefone)}</div>
              </div>

              {/* Status */}
              <div style={{marginBottom:8}}>
                <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',color:'var(--label-3)',marginBottom:5}}>Status do atendimento</div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  {Object.entries(STATUS_ATEND).map(([key,st])=>(
                    <button key={key} onClick={()=>setStatusAtend(key)} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 8px',borderRadius:7,border:`0.5px solid ${statusAtend===key?st.color:'var(--sep)'}`,background:statusAtend===key?st.bg:'transparent',cursor:'pointer',textAlign:'left'}}>
                      <span style={{fontSize:12,color:st.color}}>{st.icon}</span>
                      <span style={{fontSize:11,fontWeight:statusAtend===key?600:400,color:statusAtend===key?st.color:'var(--label-2)'}}>{st.label}</span>
                      {statusAtend===key && <span style={{marginLeft:'auto',fontSize:9,padding:'1px 5px',borderRadius:99,background:st.color,color:'#fff',fontWeight:600}}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Carrinho */}
              {carrinho.length>0 && (
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',color:'var(--label-3)',marginBottom:5}}>Carrinho ({carrinho.length})</div>
                  {carrinho.map((item,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--label-2)',padding:'3px 0',borderBottom:'0.5px solid var(--sep)'}}>
                      <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginRight:6}}>{item.quantidade}× {(item.nome||'').slice(0,20)}</span>
                      <span style={{flexShrink:0,fontWeight:500,color:'#EF9F27'}}>{fmtR(item.preco*item.quantidade)}</span>
                    </div>
                  ))}
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,fontWeight:600,color:'var(--label)',marginTop:5}}>
                    <span>Total</span><span style={{color:'#EF9F27'}}>{fmtR(totalCarrinho)}</span>
                  </div>
                </div>
              )}

              {/* Última atividade */}
              <div style={{fontSize:11,color:'var(--label-3)',padding:'6px 0',borderTop:'0.5px solid var(--sep)'}}>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span>Última msg</span>
                  <span style={{fontWeight:500,color:'var(--label-2)'}}>{fmtMin(sessao.atualizado_em)}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:3}}>
                  <span>Modo</span>
                  <span style={{fontWeight:500,color:modo==='manual'?'#534AB7':'#1D9E75'}}>{modo==='manual'?'Manual':'IA'}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',color:'var(--label-3)',marginBottom:8}}>
                Pedidos do cliente
              </div>
              {pedidosCliente.length===0
                ? <div style={{padding:12,textAlign:'center',color:'var(--label-3)',fontSize:12}}>Sem pedidos encontrados</div>
                : pedidosCliente.map((p,i)=><PedidoCard key={i} pedido={p}/>)
              }
              {pedidosCliente.length>0 && (
                <div style={{marginTop:6,padding:'6px 0',borderTop:'0.5px solid var(--sep)',fontSize:11,color:'var(--label-3)',display:'flex',justifyContent:'space-between'}}>
                  <span>Total gasto</span>
                  <span style={{fontWeight:600,color:'var(--accent)'}}>{fmtR(pedidosCliente.reduce((s,p)=>s+Number(p.total||0),0))}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function PageAtendimento({ api }) {
  const [sessoes,     setSessoes]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selecionada, setSelecionada] = useState(null)
  const [online,      setOnline]      = useState(true)
  const [ultimaSync,  setUltimaSync]  = useState(null)
  const [busca,       setBusca]       = useState('')

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/dashboard/sessoes`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setSessoes(d.sessoes||[])
      setOnline(true)
      setUltimaSync(new Date())
    } catch { setOnline(false) }
    finally { setLoading(false) }
  }, [api])

  useEffect(() => { carregar(); const i=setInterval(carregar,15000); return ()=>clearInterval(i) }, [carregar])

  useEffect(() => {
    if (selecionada) {
      const nova = sessoes.find(s=>s.telefone===selecionada.telefone)
      if (nova) setSelecionada(nova)
    }
  }, [sessoes])

  const ativas      = sessoes.filter(ehAtiva)
  const comCarrinho = sessoes.filter(s=>parseInt(s.itens_carrinho)>0)
  const manuais     = sessoes.filter(s=>s.modo==='manual')

  const filtradas = sessoes.filter(s => {
    if (!busca) return true
    const nome = s.nome||s.telefone||''
    return nome.toLowerCase().includes(busca.toLowerCase())||s.telefone?.includes(busca)
  })

  return (
    <div style={{height:'100%',display:'flex',overflow:'hidden'}}>

      {/* ── Lista lateral ── */}
      <div style={{width:selecionada?280:460,minWidth:230,flexShrink:0,display:'flex',flexDirection:'column',overflow:'hidden',borderRight:'0.5px solid var(--sep)',transition:'width .2s'}}>

        {/* Header */}
        <div style={{padding:'20px 20px 12px',borderBottom:'0.5px solid var(--sep)',flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <div>
              <h1 style={{fontSize:18,fontWeight:500,margin:0,color:'var(--label)'}}>Atendimento</h1>
              <p style={{fontSize:11,color:'var(--label-3)',margin:'2px 0 0',display:'flex',alignItems:'center',gap:5}}>
                {online?<><span style={{width:5,height:5,borderRadius:'50%',background:'var(--accent)',display:'inline-block'}}/>{ativas.length} ativas · sync 15s</>
                :<><WifiOff size={10} style={{color:'#EF4444'}}/> Sem conexão</>}
              </p>
            </div>
            <button onClick={carregar} style={{width:28,height:28,borderRadius:7,border:'0.5px solid var(--sep)',background:'transparent',cursor:'pointer',color:'var(--label-3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <RefreshCw size={11}/>
            </button>
          </div>

          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
            {[{label:'Ativas',value:ativas.length,cor:'#1D9E75'},{label:'Com carrinho',value:comCarrinho.length,cor:'#EF9F27'},{label:'Manual',value:manuais.length,cor:'#534AB7'},{label:'Total 24h',value:sessoes.length,cor:'var(--label-3)'}].map(({label,value,cor:c})=>(
              <div key={label} style={{padding:'7px 10px',borderRadius:7,background:'var(--bg)',border:'0.5px solid var(--sep)'}}>
                <div style={{fontSize:18,fontWeight:600,color:c,lineHeight:1}}>{value}</div>
                <div style={{fontSize:10,color:'var(--label-3)',marginTop:2}}>{label}</div>
              </div>
            ))}
          </div>

          {/* Busca */}
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',borderRadius:7,border:'0.5px solid var(--sep)',background:'var(--bg)'}}>
            <Search size={11} style={{color:'var(--label-3)',flexShrink:0}}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." style={{border:'none',background:'transparent',outline:'none',fontSize:12,color:'var(--label)',width:'100%'}}/>
            {busca&&<button onClick={()=>setBusca('')} style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--label-3)'}}><X size={10}/></button>}
          </div>
        </div>

        {/* Lista */}
        <div style={{flex:1,overflowY:'auto'}}>
          {loading?<div style={{padding:20,textAlign:'center',color:'var(--label-3)',fontSize:12}}>Carregando...</div>
          :filtradas.length===0?<div style={{padding:20,textAlign:'center',color:'var(--label-3)',fontSize:12}}>{busca?'Sem resultados':'Nenhuma sessão nas últimas 24h'}</div>
          :<div style={{padding:'8px 12px',display:'flex',flexDirection:'column',gap:5}}>
            {filtradas.map((s,i)=>{
              const ativa=ehAtiva(s)
              const nomeExib=(s.nome&&s.nome!==s.telefone)?s.nome:fmtTel(s.telefone)
              const c=cor(nomeExib)
              const selected=selecionada?.telefone===s.telefone
              const carrinho=parseInt(s.itens_carrinho)||0
              return (
                <div key={i} onClick={()=>setSelecionada(selected?null:s)}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:9,border:`0.5px solid ${selected?'var(--accent)':'var(--sep)'}`,background:selected?'var(--accent-dim)':'var(--bg-2)',cursor:'pointer',transition:'background .12s'}}
                  onMouseEnter={e=>{if(!selected)e.currentTarget.style.background='var(--bg-3)'}}
                  onMouseLeave={e=>{if(!selected)e.currentTarget.style.background='var(--bg-2)'}}>
                  <div style={{width:34,height:34,borderRadius:'50%',flexShrink:0,background:`${c}20`,color:c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,position:'relative'}}>
                    {iniciais(nomeExib)}
                    <span style={{position:'absolute',bottom:0,right:0,width:8,height:8,borderRadius:'50%',background:ativa?'#1D9E75':'var(--label-3)',border:'1.5px solid var(--bg-2)'}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
                      <span style={{fontSize:12,fontWeight:selected?600:500,color:selected?'var(--accent)':'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:150}}>{nomeExib}</span>
                      <span style={{fontSize:10,color:'var(--label-3)',flexShrink:0}}>{fmtMin(s.atualizado_em)}</span>
                    </div>
                    <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                      {carrinho>0&&<span style={{fontSize:10,padding:'1px 5px',borderRadius:99,background:'#EF9F2718',color:'#EF9F27',fontWeight:500}}>🛒 {carrinho}</span>}
                      {s.modo==='manual'&&<span style={{fontSize:10,padding:'1px 5px',borderRadius:99,background:'#534AB718',color:'#534AB7',fontWeight:500}}>Manual</span>}
                      {ativa&&<span style={{fontSize:10,color:'#1D9E75'}}>● ativo</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>}
        </div>

        {ultimaSync&&<div style={{padding:'6px 14px',borderTop:'0.5px solid var(--sep)',fontSize:10,color:'var(--label-3)',flexShrink:0}}>Sync: {ultimaSync.toLocaleTimeString('pt-BR')}</div>}
      </div>

      {/* ── Painel de conversa ── */}
      {selecionada ? (
        <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <PainelConversa key={selecionada.telefone} sessao={selecionada} api={api} onClose={()=>setSelecionada(null)}/>
        </div>
      ) : (
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,color:'var(--label-3)',background:'var(--bg-3)'}}>
          <MessageSquare size={32} style={{opacity:.25}}/>
          <div style={{fontSize:14,fontWeight:500,color:'var(--label)'}}>Selecione uma conversa</div>
          <div style={{fontSize:12}}>{ativas.length} conversa{ativas.length!==1?'s':''} ativa{ativas.length!==1?'s':''} agora</div>
        </div>
      )}
    </div>
  )
}
