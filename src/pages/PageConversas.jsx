import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, MessageSquare,
  CheckCheck, XCircle, Clock, Zap, Bot, User, Package,
  ShoppingBag, Send, Phone, MapPin, Mail, Tag, TrendingUp,
  Heart, ThumbsUp, Smile
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Status ────────────────────────────────────────────────────────────────────
const STATUS = [
  { id:'pendente',    label:'Pendente',     icon:Clock,         color:'#f59e0b', bg:'rgba(245,158,11,0.12)'  },
  { id:'em_andamento',label:'Em andamento', icon:MessageSquare, color:'#4a9fff', bg:'rgba(74,159,255,0.12)'  },
  { id:'resolvido',   label:'Resolvido',    icon:CheckCheck,    color:'#00d4aa', bg:'rgba(0,212,170,0.12)'   },
  { id:'encerrado',   label:'Encerrado',    icon:XCircle,       color:'#94a3b8', bg:'rgba(148,163,184,0.12)' },
]

const REACOES = ['👍','❤️','😂','😮','😢','🙏']

// ── Helpers ───────────────────────────────────────────────────────────────────
const avatarCor = (tel='') => {
  const cores = ['#00d4aa','#4a9fff','#a78bfa','#f59e0b','#22d3ee','#f472b6','#34d399']
  let h=0; for (const c of tel) h=(h*31+c.charCodeAt(0))%cores.length
  return cores[h]
}
function Avatar({ nome, telefone, size=36 }) {
  const cor = avatarCor(telefone)
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:`${cor}22`, color:cor, display:'flex', alignItems:'center',
      justifyContent:'center', fontSize:size*0.32, fontWeight:700,
    }}>
      {(nome||telefone||'??').slice(0,2).toUpperCase()}
    </div>
  )
}

// ── Bolha de mensagem com reação ──────────────────────────────────────────────
function Bolha({ msg, onReacao }) {
  const [showReacoes, setShowReacoes] = useState(false)
  const [reacao, setReacao] = useState(null)
  const entrada   = msg.direcao === 'entrada'
  const isGatilho = msg.modo === 'transacional'
  const isManual  = msg.modo === 'manual'
  const isIA      = !entrada && !isGatilho && !isManual
  const texto     = (msg.conteudo||'').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g,'').trim()

  const bgMsg = entrada
    ? 'var(--bg-3, #f0f0f0)'
    : isGatilho ? 'rgba(167,139,250,0.13)'
    : isManual  ? 'rgba(74,159,255,0.13)'
    : 'rgba(0,212,170,0.11)'

  const borderMsg = entrada
    ? '1px solid var(--sep)'
    : isGatilho ? '1px solid rgba(167,139,250,0.25)'
    : isManual  ? '1px solid rgba(74,159,255,0.25)'
    : '1px solid rgba(0,212,170,0.25)'

  const labelRemetente = entrada ? null : isGatilho ? '⚡ Gatilho' : isManual ? '👤 Atendente' : '🤖 Molise IA'
  const corRemetente   = isGatilho ? '#a78bfa' : isManual ? '#4a9fff' : '#00d4aa'

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      alignItems: entrada ? 'flex-start' : 'flex-end',
      marginBottom:6,
      position:'relative',
    }}
    onMouseEnter={() => setShowReacoes(true)}
    onMouseLeave={() => { setShowReacoes(false) }}
    >
      {/* Label remetente */}
      {labelRemetente && (
        <span style={{ fontSize:9, fontWeight:700, color:corRemetente, marginBottom:2, marginRight:4 }}>
          {labelRemetente}
        </span>
      )}

      <div style={{ display:'flex', alignItems:'flex-end', gap:6, flexDirection: entrada?'row':'row-reverse' }}>
        {/* Avatar */}
        {entrada && <Avatar nome={null} telefone={msg.telefone} size={24}/>}
        {!entrada && (
          <div style={{
            width:24, height:24, borderRadius:'50%', flexShrink:0,
            background: isGatilho?'rgba(167,139,250,0.2)':isManual?'rgba(74,159,255,0.2)':'rgba(0,212,170,0.2)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            {isGatilho?<Zap size={11} color="#a78bfa"/>:isManual?<User size={11} color="#4a9fff"/>:<Bot size={11} color="#00d4aa"/>}
          </div>
        )}

        {/* Bolha */}
        <div style={{
          maxWidth:'68%', background:bgMsg, border:borderMsg,
          borderRadius: entrada ? '3px 12px 12px 12px' : '12px 3px 12px 12px',
          padding:'7px 11px', position:'relative',
        }}>
          {texto && (
            <div style={{ fontSize:12.5, color:'var(--label)', lineHeight:1.55, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
              {texto}
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:4, marginTop:2 }}>
            <span style={{ fontSize:9, color:'var(--label-4)' }}>
              {new Date(msg.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
            </span>
          </div>
          {/* Reação selecionada */}
          {reacao && (
            <div style={{
              position:'absolute', bottom:-10, right:4,
              background:'var(--bg-2)', borderRadius:10, padding:'2px 5px',
              fontSize:12, border:'1px solid var(--sep)', cursor:'pointer',
            }} onClick={() => setReacao(null)}>
              {reacao}
            </div>
          )}
        </div>

        {/* Picker de reação */}
        {showReacoes && (
          <div style={{
            display:'flex', gap:3, background:'var(--bg-2)',
            border:'1px solid var(--sep)', borderRadius:16, padding:'4px 6px',
            boxShadow:'0 2px 8px rgba(0,0,0,0.15)', zIndex:10,
          }}>
            {REACOES.map(r => (
              <button key={r} onClick={() => { setReacao(r); setShowReacoes(false) }}
                style={{ fontSize:14, background:'transparent', border:'none', cursor:'pointer', padding:2, borderRadius:4, transition:'transform 0.1s' }}
                onMouseEnter={e=>e.target.style.transform='scale(1.3)'}
                onMouseLeave={e=>e.target.style.transform='scale(1)'}
              >{r}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DateSep({ data }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, margin:'12px 0' }}>
      <div style={{ flex:1, height:1, background:'var(--sep)' }}/>
      <span style={{ fontSize:9, color:'var(--label-4)', fontWeight:600, background:'var(--bg-2)', padding:'2px 8px', borderRadius:8 }}>
        {new Date(data).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}
      </span>
      <div style={{ flex:1, height:1, background:'var(--sep)' }}/>
    </div>
  )
}

// ── Sidebar expansível ────────────────────────────────────────────────────────
function Sidebar({ statusSel, setStatusSel, contadores, expandida, setExpandida }) {
  return (
    <div style={{
      width:expandida?188:52, flexShrink:0, transition:'width 0.2s ease',
      borderRight:'1px solid var(--sep)', background:'var(--bg-2)',
      display:'flex', flexDirection:'column', overflow:'hidden',
    }}>
      <button onClick={()=>setExpandida(v=>!v)} style={{
        padding:'11px 0', display:'flex', alignItems:'center',
        justifyContent:expandida?'flex-end':'center',
        paddingRight:expandida?12:0,
        border:'none', background:'transparent', cursor:'pointer',
        borderBottom:'1px solid var(--sep)', flexShrink:0, color:'var(--label-4)',
      }}>
        {expandida?<ChevronLeft size={13}/>:<ChevronRight size={13}/>}
      </button>

      <div style={{ flex:1, padding:'4px 0' }}>
        {STATUS.map(s => {
          const ativo = statusSel===s.id
          const cnt   = contadores[s.id]||0
          return (
            <button key={s.id} title={s.label} onClick={()=>setStatusSel(s.id)} style={{
              width:'100%', padding:expandida?'9px 12px':'9px 0',
              border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', gap:expandida?9:0,
              justifyContent:expandida?'flex-start':'center',
              background:ativo?s.bg:'transparent',
              borderLeft:ativo?`3px solid ${s.color}`:'3px solid transparent',
              transition:'all 0.15s',
            }}>
              <s.icon size={14} style={{ color:ativo?s.color:'var(--label-4)', flexShrink:0 }}/>
              {expandida && <>
                <span style={{ fontSize:12, fontWeight:ativo?600:400, color:ativo?s.color:'var(--label-2)', flex:1, textAlign:'left', whiteSpace:'nowrap' }}>
                  {s.label}
                </span>
                {cnt>0 && <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:8, background:ativo?`${s.color}25`:'var(--fill)', color:ativo?s.color:'var(--label-4)', minWidth:16, textAlign:'center' }}>
                  {cnt>99?'99+':cnt}
                </span>}
              </>}
            </button>
          )
        })}

        {/* Separador + Gatilhos */}
        <div style={{ height:1, background:'var(--sep)', margin:'6px 0' }}/>
        {(() => {
          const s = { id:'gatilhos', label:'Gatilhos', icon:Zap, color:'#a78bfa', bg:'rgba(167,139,250,0.12)' }
          const ativo = statusSel==='gatilhos'
          const cnt   = contadores['gatilhos']||0
          return (
            <button title={s.label} onClick={()=>setStatusSel('gatilhos')} style={{
              width:'100%', padding:expandida?'9px 12px':'9px 0',
              border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', gap:expandida?9:0,
              justifyContent:expandida?'flex-start':'center',
              background:ativo?s.bg:'transparent',
              borderLeft:ativo?`3px solid ${s.color}`:'3px solid transparent',
              transition:'all 0.15s',
            }}>
              <Zap size={14} style={{ color:ativo?s.color:'var(--label-4)', flexShrink:0 }}/>
              {expandida && <>
                <span style={{ fontSize:12, fontWeight:ativo?600:400, color:ativo?s.color:'var(--label-2)', flex:1, textAlign:'left' }}>Gatilhos</span>
                {cnt>0 && <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:8, background:ativo?`${s.color}25`:'var(--fill)', color:ativo?s.color:'var(--label-4)' }}>{cnt>99?'99+':cnt}</span>}
              </>}
            </button>
          )
        })()}
      </div>

      {!expandida && (
        <div style={{ writingMode:'vertical-lr', transform:'rotate(180deg)', fontSize:9, color:'var(--label-4)', textAlign:'center', padding:'8px 0', letterSpacing:'0.06em', flexShrink:0 }}>
          {[...STATUS,{id:'gatilhos',label:'Gatilhos'}].find(s=>s.id===statusSel)?.label}
        </div>
      )}
    </div>
  )
}

// ── Painel info lateral ───────────────────────────────────────────────────────
function PainelInfo({ conv, api }) {
  const [aba,      setAba]      = useState('perfil')
  const [perfil,   setPerfil]   = useState(null)
  const [pedidos,  setPedidos]  = useState([])
  const [produtos, setProdutos] = useState([])
  const [busca,    setBusca]    = useState('')
  const [loadP,    setLoadP]    = useState(false)

  useEffect(() => {
    if (!conv?.telefone) return
    fetch(`${api}/api/contatos/${conv.telefone}`)
      .then(r=>r.ok?r.json():null).then(d=>{ if(d) setPerfil(d) }).catch(()=>{})
    fetch(`${api}/api/contatos/${conv.telefone}/pedidos`)
      .then(r=>r.ok?r.json():null).then(d=>{ if(d?.pedidos) setPedidos(d.pedidos) }).catch(()=>{})
  }, [conv?.telefone, api])

  const buscarProdutos = async () => {
    if (!busca.trim()) return
    setLoadP(true)
    try {
      const r = await fetch(`${api}/api/estoque/busca?q=${encodeURIComponent(busca)}`)
      if (r.ok) { const d = await r.json(); setProdutos(d.produtos||d.data||[]) }
      else {
        // fallback para fase5
        const r2 = await fetch(`${api}/api/fase5/portfolio?q=${encodeURIComponent(busca)}`)
        if (r2.ok) { const d2 = await r2.json(); setProdutos(d2.produtos||d2||[]) }
      }
    } catch {}
    setLoadP(false)
  }

  const ABAS = [
    { id:'perfil',   label:'Perfil',   icon:User },
    { id:'pedidos',  label:'Pedidos',  icon:Package },
    { id:'catalogo', label:'Catálogo', icon:ShoppingBag },
  ]

  return (
    <div style={{ width:252, flexShrink:0, borderLeft:'1px solid var(--sep)', display:'flex', flexDirection:'column', background:'var(--bg-2)', overflow:'hidden' }}>
      {/* Mini header */}
      <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--sep)', display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
        <Avatar nome={conv.nome} telefone={conv.telefone} size={30}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{conv.nome||conv.telefone}</div>
          <div style={{ fontSize:10, color:'var(--label-4)' }}>{conv.telefone}</div>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--sep)', flexShrink:0 }}>
        {ABAS.map(a => (
          <button key={a.id} onClick={()=>setAba(a.id)} style={{
            flex:1, padding:'7px 0', border:'none', cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            background:aba===a.id?'var(--bg)':'transparent',
            borderBottom:aba===a.id?'2px solid var(--accent)':'2px solid transparent',
          }}>
            <a.icon size={11} style={{ color:aba===a.id?'var(--accent)':'var(--label-4)' }}/>
            <span style={{ fontSize:9, fontWeight:600, color:aba===a.id?'var(--accent)':'var(--label-4)' }}>{a.label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflow:'auto', padding:'10px 12px' }}>
        {/* PERFIL */}
        {aba==='perfil' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {perfil ? [
              { icon:User,       label:'Nome',        value:perfil.nome },
              { icon:Phone,      label:'Telefone',    value:perfil.telefone||conv.telefone },
              { icon:Mail,       label:'E-mail',      value:perfil.email },
              { icon:MapPin,     label:'Cidade',      value:perfil.cidade },
              { icon:Tag,        label:'Documento',   value:perfil.cpf||perfil.cnpj },
              { icon:TrendingUp, label:'Total gasto', value:perfil.total_gasto?`R$ ${parseFloat(perfil.total_gasto).toFixed(2)}`:null },
            ].filter(i=>i.value).map((item,i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:7 }}>
                <item.icon size={10} style={{ color:'var(--label-4)', marginTop:2, flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:9, color:'var(--label-4)' }}>{item.label}</div>
                  <div style={{ fontSize:11, color:'var(--label)', fontWeight:500 }}>{item.value}</div>
                </div>
              </div>
            )) : <div style={{ fontSize:11, color:'var(--label-4)', textAlign:'center', padding:16 }}>Sem cadastro</div>}
          </div>
        )}

        {/* PEDIDOS */}
        {aba==='pedidos' && (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {pedidos.length===0
              ? <div style={{ fontSize:11, color:'var(--label-4)', textAlign:'center', padding:16 }}>Nenhum pedido</div>
              : pedidos.map((p,i) => (
                <div key={i} style={{ background:'var(--bg)', borderRadius:8, padding:'8px 10px', border:'1px solid var(--sep)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:'var(--label)' }}>#{p.numero||p.id}</span>
                    <span style={{ fontSize:9, color:'var(--label-4)' }}>{p.data}</span>
                  </div>
                  <div style={{ fontSize:10, color:'var(--label-3)', marginBottom:3 }}>{p.situacao||p.status}</div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:11, fontWeight:600, color:'var(--accent)' }}>{p.total}</span>
                    {p.rastreio&&p.rastreio!=='—'&&<span style={{ fontSize:9, color:'#4a9fff' }}>📦 {p.rastreio}</span>}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* CATÁLOGO */}
        {aba==='catalogo' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', gap:5 }}>
              <input
                value={busca} onChange={e=>setBusca(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&buscarProdutos()}
                placeholder="Ex: strass ss4.5..."
                style={{ flex:1, padding:'6px 8px', borderRadius:6, border:'1px solid var(--sep)', background:'var(--bg)', outline:'none', fontSize:11, color:'var(--label)' }}
              />
              <button onClick={buscarProdutos} style={{ padding:'6px 10px', borderRadius:6, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                {loadP?'…':'↵'}
              </button>
            </div>
            {produtos.length===0
              ? <div style={{ fontSize:10, color:'var(--label-4)', textAlign:'center', padding:12 }}>Digite e pressione Enter</div>
              : produtos.slice(0,8).map((p,i) => (
                <div key={i} style={{ background:'var(--bg)', borderRadius:8, padding:'8px 10px', border:'1px solid var(--sep)' }}>
                  <div style={{ fontSize:11, fontWeight:500, color:'var(--label)', marginBottom:2, lineHeight:1.3 }}>{p.nome}</div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'var(--accent)' }}>R$ {parseFloat(p.preco||0).toFixed(2)}</span>
                    <span style={{ fontSize:9, color:p.disponivel?'#00d4aa':'var(--label-4)' }}>{p.disponivel?'✓ Disponível':'Indisponível'}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Chat — key nunca muda para evitar unmount ─────────────────────────────────
function Chat({ telefone, nome, totalMsgs, hora, api, status, onStatusChange, modoManual, onToggleModo }) {
  const [msgs,    setMsgs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset,  setOffset]  = useState(0)
  const [texto,   setTexto]   = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef  = useRef(null)
  const prevLen    = useRef(0)
  const fetching   = useRef(false)

  const carregar = useCallback(async (off=0, sil=false) => {
    if (!telefone || fetching.current) return
    fetching.current = true
    if (!sil) setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${telefone}?limit=60&offset=${off}`)
      if (r.ok) {
        const d = await r.json()
        const novas = d.mensagens||[]
        if (off===0) setMsgs(novas)
        else setMsgs(prev=>[...novas,...prev])
        setHasMore(d.hasMore||false)
        setOffset(off===0?novas.length:off+novas.length)
      }
    } catch {}
    if (!sil) setLoading(false)
    fetching.current = false
  }, [telefone, api])

  useEffect(() => {
    setMsgs([]); setOffset(0); prevLen.current=0
    carregar(0)
  }, [telefone])

  useEffect(() => {
    const i = setInterval(()=>{ if(document.visibilityState==='visible') carregar(0,true) }, 8000)
    return ()=>clearInterval(i)
  }, [carregar])

  useEffect(() => {
    if (msgs.length > prevLen.current) {
      const behavior = prevLen.current===0?'instant':'smooth'
      bottomRef.current?.scrollIntoView({behavior})
    }
    prevLen.current = msgs.length
  }, [msgs])

  const enviar = async () => {
    if (!texto.trim()||sending) return
    const msg = texto.trim()
    setTexto('')
    setSending(true)
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ telefone, mensagem: msg })
      })
      await carregar(0, true)
    } catch {}
    setSending(false)
  }

  const stCfg = STATUS.find(s=>s.id===status)||STATUS[0]

  const grupos = useMemo(() => {
    const g=[]
    let dataAtual=null
    for (const m of msgs) {
      const d = new Date(m.criado_em).toDateString()
      if (d!==dataAtual) { g.push({tipo:'sep',data:m.criado_em}); dataAtual=d }
      g.push({tipo:'msg',msg:m})
    }
    return g
  }, [msgs])

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
      {/* Header */}
      <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--sep)', background:'var(--bg-2)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <Avatar nome={nome} telefone={telefone} size={34}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--label)' }}>{nome||telefone}</div>
          <div style={{ fontSize:10, color:'var(--label-4)' }}>{totalMsgs} msgs · {hora}</div>
        </div>

        {/* Assumir / Devolver */}
        <button onClick={onToggleModo} style={{
          display:'flex', alignItems:'center', gap:5,
          padding:'5px 10px', borderRadius:8, border:`1px solid ${modoManual?'rgba(74,159,255,0.3)':'var(--sep)'}`,
          background:modoManual?'rgba(74,159,255,0.12)':'var(--fill)',
          color:modoManual?'#4a9fff':'var(--label-3)',
          cursor:'pointer', fontSize:11, fontWeight:600, flexShrink:0, transition:'all 0.15s',
        }}>
          {modoManual?<><Bot size={12}/> Devolver à IA</>:<><User size={12}/> Assumir</>}
        </button>

        {/* Status */}
        <div style={{ display:'flex', gap:3 }}>
          {STATUS.map(s=>(
            <button key={s.id} onClick={()=>onStatusChange(telefone,s.id)} title={s.label} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:2,
              padding:'5px 8px', borderRadius:8, border:'none', cursor:'pointer',
              background:status===s.id?s.bg:'transparent',
              color:status===s.id?s.color:'var(--label-4)',
              outline:status===s.id?`1.5px solid ${s.color}40`:'none',
              minWidth:44, transition:'all 0.15s',
            }}>
              <s.icon size={13}/>
              <span style={{ fontSize:9, fontWeight:600 }}>{s.label}</span>
            </button>
          ))}
        </div>

        <button onClick={()=>carregar(0)} style={{ padding:5, border:'none', background:'transparent', cursor:'pointer', color:'var(--label-4)' }}>
          <RefreshCw size={11}/>
        </button>
      </div>

      {/* Mensagens */}
      <div style={{ flex:1, overflow:'auto', padding:'10px 14px' }}>
        {hasMore && <div style={{ textAlign:'center', padding:'4px 0' }}>
          <button onClick={()=>carregar(offset)} style={{ fontSize:10, color:'var(--accent)', background:'transparent', border:'1px solid var(--sep)', borderRadius:6, padding:'3px 10px', cursor:'pointer' }}>Carregar anteriores</button>
        </div>}
        {loading&&msgs.length===0
          ? <div style={{ textAlign:'center', padding:32, color:'var(--label-4)', fontSize:12 }}>Carregando...</div>
          : grupos.length===0
          ? <div style={{ textAlign:'center', padding:32, color:'var(--label-4)', fontSize:12 }}>Sem mensagens</div>
          : grupos.map((g,i)=>g.tipo==='sep'?<DateSep key={`s${i}`} data={g.data}/>:<Bolha key={g.msg.id||i} msg={{...g.msg,telefone}} onReacao={()=>{}}/>)
        }
        <div ref={bottomRef}/>
      </div>

      {/* Barra de envio */}
      <div style={{ padding:'8px 12px', borderTop:'1px solid var(--sep)', background:'var(--bg-2)', flexShrink:0 }}>
        {modoManual ? (
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <div style={{ flex:1, background:'var(--fill)', borderRadius:10, padding:'7px 11px', border:'1px solid var(--sep)' }}>
              <textarea
                value={texto} onChange={e=>setTexto(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar()} }}
                placeholder="Digite uma mensagem... (Enter para enviar)"
                rows={1} style={{ width:'100%', border:'none', background:'transparent', outline:'none', fontSize:12.5, color:'var(--label)', resize:'none', lineHeight:1.5, maxHeight:96, overflow:'auto' }}
              />
            </div>
            <button onClick={enviar} disabled={sending||!texto.trim()} style={{
              width:36, height:36, borderRadius:10, border:'none', flexShrink:0,
              background:texto.trim()&&!sending?'var(--accent)':'var(--fill)',
              color:texto.trim()&&!sending?'#fff':'var(--label-4)',
              cursor:texto.trim()?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s',
            }}>
              {sending?<RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/>:<Send size={13}/>}
            </button>
          </div>
        ) : (
          <div style={{ textAlign:'center', fontSize:11, color:'var(--label-4)', padding:'4px 0' }}>
            🤖 Modo IA ativo — clique em <strong style={{color:'var(--label-3)'}}>Assumir</strong> para responder manualmente
          </div>
        )}
      </div>
    </div>
  )
}

// ── Principal ─────────────────────────────────────────────────────────────────
export default function PageConversas({ api: apiProp }) {
  const api = apiProp || BASE

  const [convs,     setConvs]     = useState([])
  const [selTel,    setSelTel]    = useState(null)  // só o telefone — Chat não recria
  const [statusSel, setStatusSel] = useState(() => sessionStorage.getItem('conv_status')||'pendente')
  const [statusMap, setStatusMap] = useState({})
  const [modoMap,   setModoMap]   = useState({})
  const [busca,     setBusca]     = useState('')
  const [loading,   setLoading]   = useState(true)
  const [sidebar,   setSidebar]   = useState(() => sessionStorage.getItem('conv_sidebar')==='true')

  // Persiste statusSel no sessionStorage
  useEffect(()=>{ sessionStorage.setItem('conv_status', statusSel) }, [statusSel])
  useEffect(()=>{ sessionStorage.setItem('conv_sidebar', sidebar) }, [sidebar])

  const getStatus  = (tel) => statusMap[tel]||'pendente'
  const getModo    = (tel) => modoMap[tel]||false

  const carregar = useCallback(async (sil=false) => {
    if (!sil) setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/conversas?aba=todas`)
      if (r.ok) {
        const d = await r.json()
        setConvs(prev => {
          const map = new Map(prev.map(c=>[c.telefone,c]))
          return (d.conversas||[]).map(c=>({...map.get(c.telefone),...c}))
        })
      }
    } catch {}
    if (!sil) setLoading(false)
  }, [api])

  useEffect(()=>{
    carregar()
    const i = setInterval(()=>{ if(document.visibilityState==='visible') carregar(true) }, 15000)
    return ()=>clearInterval(i)
  }, [carregar])

  const setConvStatus = useCallback((tel, st) => {
    setStatusMap(prev=>({...prev,[tel]:st}))
    fetch(`${api}/api/contatos/${tel}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({status_atendimento:st})
    }).catch(()=>{})
  }, [api])

  const toggleModo = useCallback((tel) => {
    setModoMap(prev=>({...prev,[tel]:!prev[tel]}))
  }, [])

  const contadores = useMemo(() => {
    const c = {}
    STATUS.forEach(s=>{ c[s.id]=convs.filter(cv=>getStatus(cv.telefone)===s.id).length })
    c['gatilhos'] = convs.filter(c=>c.modo==='transacional').length
    return c
  }, [convs, statusMap])

  const filtradas = useMemo(() => convs
    .filter(c => {
      if (statusSel==='gatilhos') return c.modo==='transacional'
      return getStatus(c.telefone)===statusSel
    })
    .filter(c => !busca ||
      (c.nome||'').toLowerCase().includes(busca.toLowerCase()) ||
      c.telefone.includes(busca) ||
      (c.ultima_msg||'').toLowerCase().includes(busca.toLowerCase())
    ), [convs, statusSel, statusMap, busca])

  const selConv = convs.find(c=>c.telefone===selTel)
  const stCfg   = [...STATUS,{id:'gatilhos',label:'Gatilhos',icon:Zap,color:'#a78bfa',bg:''}].find(s=>s.id===statusSel)||STATUS[0]

  return (
    <div className="h-full flex overflow-hidden" style={{ background:'var(--bg)' }}>
      {/* Sidebar */}
      <Sidebar statusSel={statusSel} setStatusSel={setStatusSel} contadores={contadores} expandida={sidebar} setExpandida={setSidebar}/>

      {/* Lista */}
      <div style={{ width:268, flexShrink:0, display:'flex', flexDirection:'column', borderRight:'1px solid var(--sep)' }}>
        <div style={{ padding:'9px 11px', borderBottom:'1px solid var(--sep)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <stCfg.icon size={12} style={{color:stCfg.color}}/>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--label)' }}>{stCfg.label}</span>
              <span style={{ fontSize:10, color:'var(--label-4)', background:'var(--fill)', padding:'1px 5px', borderRadius:7 }}>{filtradas.length}</span>
            </div>
            <button onClick={()=>carregar()} style={{ padding:3, border:'none', background:'transparent', cursor:'pointer', color:'var(--label-4)' }}>
              <RefreshCw size={11}/>
            </button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, background:'var(--fill)', borderRadius:7, padding:'5px 8px' }}>
            <Search size={10} style={{color:'var(--label-4)',flexShrink:0}}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:11, color:'var(--label)' }}/>
          </div>
        </div>

        <div style={{ flex:1, overflow:'auto' }}>
          {loading
            ? Array.from({length:5}).map((_,i)=>(
                <div key={i} style={{ padding:'9px 11px', borderBottom:'1px solid var(--sep)' }}>
                  <div style={{ height:9, width:'55%', borderRadius:4, background:'var(--sep)', marginBottom:4 }}/>
                  <div style={{ height:7, width:'75%', borderRadius:4, background:'var(--sep)' }}/>
                </div>
              ))
            : filtradas.length===0
            ? <div style={{ padding:20, textAlign:'center', fontSize:11, color:'var(--label-4)' }}>
                {statusSel==='pendente'?'Nenhuma conversa pendente':statusSel==='gatilhos'?'Nenhum disparo':'Nenhuma conversa'}
              </div>
            : filtradas.map(c=>{
                const ativo = selTel===c.telefone
                const st    = STATUS.find(s=>s.id===getStatus(c.telefone))||STATUS[0]
                return (
                  <div key={c.telefone} onClick={()=>setSelTel(c.telefone)}
                    style={{ display:'flex', gap:8, padding:'8px 11px', cursor:'pointer', borderBottom:'1px solid var(--sep)', borderLeft:ativo?'2px solid var(--accent)':'2px solid transparent', background:ativo?'rgba(0,212,170,0.04)':'transparent', transition:'background 0.1s' }}
                    onMouseEnter={e=>{ if(!ativo) e.currentTarget.style.background='var(--fill)' }}
                    onMouseLeave={e=>{ if(!ativo) e.currentTarget.style.background='transparent' }}
                  >
                    <Avatar nome={c.nome} telefone={c.telefone} size={32}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                        <span style={{ fontSize:11.5, fontWeight:600, color:'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:128 }}>{c.nome||c.telefone}</span>
                        <span style={{ fontSize:9, color:'var(--label-4)', flexShrink:0 }}>{c.hora}</span>
                      </div>
                      <div style={{ fontSize:10.5, color:'var(--label-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>
                        {c.ultima_direcao==='saida'?'↩ ':''}{c.ultima_msg||'—'}
                      </div>
                      <div style={{ display:'flex', gap:3 }}>
                        {c.agente&&<span style={{ fontSize:8, fontWeight:700, padding:'1px 4px', borderRadius:3, background:'rgba(0,212,170,0.1)', color:'#00d4aa' }}>IA</span>}
                        <span style={{ fontSize:8, fontWeight:600, padding:'1px 4px', borderRadius:3, background:st.bg, color:st.color }}>{st.label}</span>
                        <span style={{ fontSize:8, color:'var(--label-4)', marginLeft:'auto' }}>{c.total_msgs}m</span>
                      </div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* Chat — key={selTel} renderiza novo chat ao trocar conversa, mas NÃO recria por modoMap */}
      {selTel ? (
        <>
          <Chat
            key={selTel}
            telefone={selTel}
            nome={selConv?.nome}
            totalMsgs={selConv?.total_msgs}
            hora={selConv?.hora}
            api={api}
            status={getStatus(selTel)}
            onStatusChange={setConvStatus}
            modoManual={getModo(selTel)}
            onToggleModo={()=>toggleModo(selTel)}
          />
          {selConv && <PainelInfo conv={selConv} api={api}/>}
        </>
      ) : (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, color:'var(--label-4)' }}>
          <MessageSquare size={38} style={{opacity:0.15}}/>
          <div style={{ fontSize:13, fontWeight:500 }}>Selecione uma conversa</div>
          <div style={{ fontSize:11 }}>{filtradas.length} em {stCfg.label.toLowerCase()}</div>
        </div>
      )}
    </div>
  )
}
