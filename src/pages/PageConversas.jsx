import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, MessageSquare,
  CheckCheck, XCircle, Clock, Zap, Bot, User, Package,
  ShoppingBag, ChevronDown, ChevronUp, ExternalLink, Phone,
  MapPin, Mail, Tag, TrendingUp
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = [
  { id:'pendente',    label:'Pendente',      icon:Clock,          color:'#f59e0b', bg:'rgba(245,158,11,0.12)'  },
  { id:'em_andamento',label:'Em andamento',  icon:MessageSquare,  color:'#4a9fff', bg:'rgba(74,159,255,0.12)'  },
  { id:'resolvido',   label:'Resolvido',     icon:CheckCheck,     color:'#00d4aa', bg:'rgba(0,212,170,0.12)'   },
  { id:'encerrado',   label:'Encerrado',     icon:XCircle,        color:'#94a3b8', bg:'rgba(148,163,184,0.12)' },
  { id:'gatilhos',    label:'Gatilhos',      icon:Zap,            color:'#a78bfa', bg:'rgba(167,139,250,0.12)' },
]

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
      background:`${cor}22`, color:cor,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.32, fontWeight:700,
    }}>
      {(nome||telefone||'??').slice(0,2).toUpperCase()}
    </div>
  )
}

// ── Sidebar de status expansível ──────────────────────────────────────────────
function Sidebar({ statusSel, setStatusSel, contadores }) {
  const [expandida, setExpandida] = useState(false)

  return (
    <div style={{
      width: expandida ? 180 : 56,
      flexShrink:0, transition:'width 0.2s ease',
      borderRight:'1px solid var(--sep)', background:'var(--bg-2)',
      display:'flex', flexDirection:'column', overflow:'hidden',
    }}>
      {/* Toggle */}
      <button onClick={() => setExpandida(v => !v)} style={{
        padding:'12px 0', display:'flex', alignItems:'center',
        justifyContent: expandida ? 'flex-end' : 'center',
        paddingRight: expandida ? 12 : 0,
        border:'none', background:'transparent', cursor:'pointer',
        borderBottom:'1px solid var(--sep)', flexShrink:0,
        color:'var(--label-4)',
      }}>
        {expandida ? <ChevronLeft size={14}/> : <ChevronRight size={14}/>}
      </button>

      {/* Items */}
      <div style={{ flex:1, padding:'6px 0', overflow:'hidden' }}>
        {STATUS.map(s => {
          const ativo = statusSel === s.id
          const cnt   = contadores[s.id] || 0
          return (
            <button key={s.id}
              title={s.label}
              onClick={() => setStatusSel(s.id)}
              style={{
                width:'100%', padding: expandida ? '9px 14px' : '9px 0',
                border:'none', cursor:'pointer',
                display:'flex', alignItems:'center',
                gap: expandida ? 10 : 0,
                justifyContent: expandida ? 'flex-start' : 'center',
                background: ativo ? s.bg : 'transparent',
                borderLeft: ativo ? `3px solid ${s.color}` : '3px solid transparent',
                transition:'all 0.15s',
              }}>
              <s.icon size={15} style={{ color: ativo ? s.color : 'var(--label-4)', flexShrink:0 }} />
              {expandida && (
                <>
                  <span style={{ fontSize:12, fontWeight:ativo?600:400, color: ativo ? s.color : 'var(--label-2)', flex:1, textAlign:'left', whiteSpace:'nowrap' }}>
                    {s.label}
                  </span>
                  {cnt > 0 && (
                    <span style={{
                      fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:8,
                      background: ativo ? `${s.color}25` : 'var(--fill)',
                      color: ativo ? s.color : 'var(--label-4)',
                      minWidth:16, textAlign:'center',
                    }}>
                      {cnt > 99 ? '99+' : cnt}
                    </span>
                  )}
                </>
              )}
              {!expandida && cnt > 0 && (
                <div style={{
                  position:'absolute', top:4, right:8,
                  width:14, height:14, borderRadius:'50%',
                  background: s.color, color:'#fff',
                  fontSize:8, fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Label atual (collapsed) */}
      {!expandida && (
        <div style={{
          writingMode:'vertical-lr', transform:'rotate(180deg)',
          fontSize:9, color:'var(--label-4)', textAlign:'center',
          padding:'10px 0', letterSpacing:'0.06em', flexShrink:0,
        }}>
          {STATUS.find(s=>s.id===statusSel)?.label}
        </div>
      )}
    </div>
  )
}

// ── Bolha de mensagem ─────────────────────────────────────────────────────────
function Bolha({ msg }) {
  const entrada   = msg.direcao === 'entrada'
  const isGatilho = msg.modo === 'transacional'
  const texto     = (msg.conteudo||'').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g,'').trim()

  return (
    <div style={{
      display:'flex', justifyContent: entrada ? 'flex-start' : 'flex-end',
      marginBottom:3, padding: entrada ? '0 64px 0 0' : '0 0 0 64px',
    }}>
      <div style={{
        maxWidth:'72%',
        background: entrada ? 'var(--bg-2)'
          : isGatilho ? 'rgba(167,139,250,0.13)' : 'rgba(0,212,170,0.11)',
        border:`1px solid ${entrada ? 'var(--sep)' : isGatilho ? 'rgba(167,139,250,0.2)' : 'rgba(0,212,170,0.2)'}`,
        borderRadius: entrada ? '3px 12px 12px 12px' : '12px 3px 12px 12px',
        padding:'7px 11px',
      }}>
        {texto && (
          <div style={{ fontSize:12.5, color:'var(--label)', lineHeight:1.55, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
            {texto}
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:4, marginTop:2 }}>
          {isGatilho && <span style={{ fontSize:8, fontWeight:700, color:'#a78bfa' }}>GATILHO</span>}
          {!entrada && msg.motor && <span style={{ fontSize:8, color:'var(--label-4)' }}>{msg.motor}</span>}
          <span style={{ fontSize:9, color:'var(--label-4)' }}>
            {new Date(msg.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
          </span>
        </div>
      </div>
    </div>
  )
}

function DateSep({ data }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, margin:'10px 0' }}>
      <div style={{ flex:1, height:1, background:'var(--sep)' }}/>
      <span style={{ fontSize:9, color:'var(--label-4)', fontWeight:600, background:'var(--bg-2)', padding:'2px 8px', borderRadius:8 }}>
        {new Date(data).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}
      </span>
      <div style={{ flex:1, height:1, background:'var(--sep)' }}/>
    </div>
  )
}

// ── Painel lateral direito — perfil + pedidos + catálogo ──────────────────────
function PainelInfo({ conv, api }) {
  const [aba,      setAba]      = useState('perfil')
  const [perfil,   setPerfil]   = useState(null)
  const [pedidos,  setPedidos]  = useState([])
  const [produtos, setProdutos] = useState([])
  const [buscaProd,setBuscaProd]= useState('')
  const [loadP,    setLoadP]    = useState(false)

  useEffect(() => {
    if (!conv?.telefone) return
    // Carrega perfil
    fetch(`${api}/api/contatos/${conv.telefone}`)
      .then(r=>r.ok?r.json():null).then(d=>{ if(d) setPerfil(d) }).catch(()=>{})
    // Carrega pedidos
    fetch(`${api}/api/contatos/${conv.telefone}/pedidos`)
      .then(r=>r.ok?r.json():null).then(d=>{ if(d?.pedidos) setPedidos(d.pedidos) }).catch(()=>{})
  }, [conv?.telefone, api])

  const buscarProdutos = async () => {
    if (!buscaProd.trim()) return
    setLoadP(true)
    try {
      const r = await fetch(`${api}/api/fase5/portfolio?q=${encodeURIComponent(buscaProd)}`)
      if (r.ok) { const d = await r.json(); setProdutos(d.produtos||d||[]) }
    } catch {}
    setLoadP(false)
  }

  const ABAS_INFO = [
    { id:'perfil',   label:'Perfil',   icon:User },
    { id:'pedidos',  label:'Pedidos',  icon:Package },
    { id:'catalogo', label:'Catálogo', icon:ShoppingBag },
  ]

  return (
    <div style={{
      width:260, flexShrink:0, borderLeft:'1px solid var(--sep)',
      display:'flex', flexDirection:'column', background:'var(--bg-2)',
    }}>
      {/* Header */}
      <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--sep)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <Avatar nome={conv.nome} telefone={conv.telefone} size={32}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {conv.nome || conv.telefone}
            </div>
            <div style={{ fontSize:10, color:'var(--label-4)' }}>{conv.telefone}</div>
          </div>
        </div>
      </div>

      {/* Abas do painel */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--sep)', flexShrink:0 }}>
        {ABAS_INFO.map(a => (
          <button key={a.id} onClick={()=>setAba(a.id)} style={{
            flex:1, padding:'8px 0', border:'none', cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            background: aba===a.id ? 'var(--bg)' : 'transparent',
            borderBottom: aba===a.id ? '2px solid var(--accent)' : '2px solid transparent',
          }}>
            <a.icon size={12} style={{ color: aba===a.id ? 'var(--accent)' : 'var(--label-4)' }}/>
            <span style={{ fontSize:9, fontWeight:600, color: aba===a.id ? 'var(--accent)' : 'var(--label-4)' }}>
              {a.label}
            </span>
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={{ flex:1, overflow:'auto', padding:'12px 14px' }}>

        {/* PERFIL */}
        {aba === 'perfil' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {perfil ? (
              <>
                {[
                  { icon:User,    label:'Nome',     value:perfil.nome },
                  { icon:Phone,   label:'Telefone', value:perfil.telefone||conv.telefone },
                  { icon:Mail,    label:'E-mail',   value:perfil.email },
                  { icon:MapPin,  label:'Cidade',   value:perfil.cidade },
                  { icon:Tag,     label:'CPF/CNPJ', value:perfil.cpf||perfil.cnpj },
                  { icon:TrendingUp, label:'Total gasto', value:perfil.total_gasto ? `R$ ${parseFloat(perfil.total_gasto).toFixed(2)}` : null },
                ].filter(i=>i.value).map((item,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                    <item.icon size={11} style={{ color:'var(--label-4)', marginTop:2, flexShrink:0 }}/>
                    <div>
                      <div style={{ fontSize:9, color:'var(--label-4)' }}>{item.label}</div>
                      <div style={{ fontSize:11, color:'var(--label)', fontWeight:500 }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ fontSize:11, color:'var(--label-4)', textAlign:'center', padding:'16px 0' }}>
                Sem cadastro vinculado
              </div>
            )}
          </div>
        )}

        {/* PEDIDOS */}
        {aba === 'pedidos' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {pedidos.length === 0 ? (
              <div style={{ fontSize:11, color:'var(--label-4)', textAlign:'center', padding:'16px 0' }}>
                Nenhum pedido encontrado
              </div>
            ) : pedidos.map((p,i) => (
              <div key={i} style={{
                background:'var(--bg)', borderRadius:8, padding:'8px 10px',
                border:'1px solid var(--sep)',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:'var(--label)' }}>#{p.numero||p.id}</span>
                  <span style={{ fontSize:9, color:'var(--label-4)' }}>{p.data}</span>
                </div>
                <div style={{ fontSize:10, color:'var(--label-3)', marginBottom:4 }}>{p.situacao||p.status}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:11, fontWeight:600, color:'var(--accent)' }}>{p.total}</span>
                  {p.rastreio && p.rastreio !== '—' && (
                    <span style={{ fontSize:9, color:'#4a9fff' }}>📦 {p.rastreio}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CATÁLOGO */}
        {aba === 'catalogo' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', gap:6 }}>
              <input
                value={buscaProd} onChange={e=>setBuscaProd(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&buscarProdutos()}
                placeholder="Buscar produto..."
                style={{ flex:1, padding:'5px 8px', borderRadius:6, border:'1px solid var(--sep)', background:'var(--bg)', outline:'none', fontSize:11, color:'var(--label)' }}
              />
              <button onClick={buscarProdutos} style={{
                padding:'5px 8px', borderRadius:6, border:'none',
                background:'var(--accent)', color:'#fff', cursor:'pointer', fontSize:11,
              }}>
                {loadP ? '...' : '↵'}
              </button>
            </div>
            {produtos.length === 0 ? (
              <div style={{ fontSize:10, color:'var(--label-4)', textAlign:'center', padding:'12px 0' }}>
                Digite um produto e pressione Enter
              </div>
            ) : produtos.slice(0,8).map((p,i) => (
              <div key={i} style={{
                background:'var(--bg)', borderRadius:8, padding:'8px 10px',
                border:'1px solid var(--sep)',
              }}>
                <div style={{ fontSize:11, fontWeight:500, color:'var(--label)', marginBottom:3, lineHeight:1.3 }}>
                  {p.nome}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:10, color:'var(--accent)', fontWeight:600 }}>
                    R$ {parseFloat(p.preco||0).toFixed(2)}
                  </span>
                  <span style={{ fontSize:9, color: p.disponivel ? '#00d4aa' : 'var(--label-4)' }}>
                    {p.disponivel ? 'Disponível' : 'Indisponível'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Chat ──────────────────────────────────────────────────────────────────────
function Chat({ conv, api, status, onStatusChange, modoManual, onAssumir }) {
  const [msgs,    setMsgs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset,  setOffset]  = useState(0)
  const [texto, setTexto]   = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const prevLen   = useRef(0)
  const loadingRef = useRef(false)
  const inputRef  = useRef(null)

  const carregar = useCallback(async (off=0, silencioso=false) => {
    if (!conv?.telefone || loadingRef.current) return
    loadingRef.current = true
    if (!silencioso) setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${conv.telefone}?limit=60&offset=${off}`)
      if (!r.ok) throw new Error(r.status)
      const d = await r.json()
      const novas = d.mensagens || []
      if (off === 0) setMsgs(novas)
      else setMsgs(prev => [...novas, ...prev])
      setHasMore(d.hasMore || false)
      setOffset(off === 0 ? novas.length : off + novas.length)
    } catch(e) { console.error('historico erro:', e.message) }
    if (!silencioso) setLoading(false)
    loadingRef.current = false
  }, [conv?.telefone, api])

  useEffect(() => {
    setMsgs([])
    setOffset(0)
    prevLen.current = 0
    carregar(0)
  }, [conv?.telefone])

  useEffect(() => {
    const i = setInterval(() => {
      if (document.visibilityState === 'visible') carregar(0, true)
    }, 8000)
    return () => clearInterval(i)
  }, [carregar])

  const enviar = async () => {
    if (!texto.trim() || sending || !modoManual) return
    const msg = texto.trim()
    setTexto('')
    setSending(true)
    try {
      const WA_TOKEN  = ''; // não temos acesso aqui — envio pelo backend
      // Envia via API do backend
      await fetch(`${api}/api/contatos/${conv.telefone}/mensagem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: msg, telefone: conv.telefone })
      })
      await carregar(0, true)
    } catch(e) { console.error('Erro enviar:', e.message) }
    setSending(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (msgs.length > prevLen.current && prevLen.current === 0) {
      bottomRef.current?.scrollIntoView({ behavior:'instant' })
    } else if (msgs.length > prevLen.current) {
      bottomRef.current?.scrollIntoView({ behavior:'smooth' })
    }
    prevLen.current = msgs.length
  }, [msgs])

  const grupos = []
  let dataAtual = null
  for (const m of msgs) {
    const d = new Date(m.criado_em).toDateString()
    if (d !== dataAtual) { grupos.push({tipo:'sep', data:m.criado_em}); dataAtual=d }
    grupos.push({tipo:'msg', msg:m})
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
      {/* Header */}
      <div style={{
        padding:'12px 16px', borderBottom:'1px solid var(--sep)',
        background:'var(--bg-2)', display:'flex', alignItems:'center', gap:12, flexShrink:0,
      }}>
        <Avatar nome={conv.nome} telefone={conv.telefone} size={36}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--label)' }}>{conv.nome||conv.telefone}</div>
          <div style={{ fontSize:11, color:'var(--label-4)' }}>{conv.total_msgs} mensagens · {conv.hora}</div>
        </div>
        {/* Botão assumir / devolver para IA */}
        {onAssumir && (
          <button onClick={() => onAssumir(conv.telefone)}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'6px 12px', borderRadius:8,
              border: modoManual ? '1px solid rgba(74,159,255,0.3)' : '1px solid var(--sep)',
              background: modoManual ? 'rgba(74,159,255,0.12)' : 'var(--fill)',
              color: modoManual ? '#4a9fff' : 'var(--label-3)',
              cursor:'pointer', fontSize:11, fontWeight:600, flexShrink:0,
              transition:'all 0.15s',
            }}>
            {modoManual
              ? <><Bot size={13}/> Devolver à IA</>
              : <><User size={13}/> Assumir</>
            }
          </button>
        )}
        {/* Seletor de status com labels */}
        <div style={{ display:'flex', gap:4 }}>
          {STATUS.filter(s=>s.id!=='gatilhos').map(s => (
            <button key={s.id} onClick={() => onStatusChange(conv.telefone, s.id)}
              title={s.label}
              style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                padding:'6px 10px', borderRadius:8, border:'none', cursor:'pointer',
                background: status===s.id ? s.bg : 'transparent',
                color: status===s.id ? s.color : 'var(--label-4)',
                outline: status===s.id ? `1.5px solid ${s.color}50` : 'none',
                minWidth:52,
              }}>
              <s.icon size={14}/>
              <span style={{ fontSize:9, fontWeight:600, whiteSpace:'nowrap' }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mensagens */}
      <div style={{ flex:1, overflow:'auto', padding:'10px 14px' }}>
        {hasMore && (
          <div style={{ textAlign:'center', padding:'6px 0' }}>
            <button onClick={()=>carregar(offset)} style={{
              fontSize:10, color:'var(--accent)', background:'transparent',
              border:'1px solid var(--sep)', borderRadius:6, padding:'3px 10px', cursor:'pointer',
            }}>Carregar anteriores</button>
          </div>
        )}
        {loading && msgs.length === 0
          ? <div style={{ textAlign:'center', padding:32, color:'var(--label-4)', fontSize:12 }}>Carregando conversas...</div>
          : grupos.length === 0
          ? <div style={{ textAlign:'center', padding:32, color:'var(--label-4)', fontSize:12 }}>Nenhuma mensagem</div>
          : grupos.map((g,i) =>
              g.tipo==='sep' ? <DateSep key={`s${i}`} data={g.data}/> : <Bolha key={g.msg.id||i} msg={g.msg}/>
          )
        }
        <div ref={bottomRef}/>
      </div>

      {/* Barra de envio — só quando assumida */}
      {modoManual ? (
        <div style={{
          padding:'10px 14px', borderTop:'1px solid var(--sep)',
          background:'var(--bg-2)', display:'flex', gap:8, alignItems:'flex-end', flexShrink:0,
        }}>
          <div style={{ flex:1, background:'var(--fill)', borderRadius:10, padding:'8px 12px', border:'1px solid var(--sep)' }}>
            <textarea
              ref={inputRef}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
              placeholder="Digite uma mensagem..."
              rows={1}
              style={{
                width:'100%', border:'none', background:'transparent', outline:'none',
                fontSize:12.5, color:'var(--label)', resize:'none', lineHeight:1.5,
                maxHeight:100, overflow:'auto',
              }}
            />
          </div>
          <button onClick={enviar} disabled={sending || !texto.trim()}
            style={{
              width:36, height:36, borderRadius:10, border:'none',
              background: texto.trim() ? 'var(--accent)' : 'var(--fill)',
              color: texto.trim() ? '#fff' : 'var(--label-4)',
              cursor: texto.trim() ? 'pointer' : 'default',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0, transition:'all 0.15s',
            }}>
            {sending ? '...' : <Send size={14}/>}
          </button>
        </div>
      ) : (
        <div style={{
          padding:'10px 14px', borderTop:'1px solid var(--sep)',
          background:'var(--bg-2)', display:'flex', alignItems:'center', gap:8, flexShrink:0,
        }}>
          <div style={{ flex:1, textAlign:'center', fontSize:11, color:'var(--label-4)' }}>
            Conversa em modo IA — clique em <strong style={{color:'var(--label-3)'}}>Assumir</strong> para responder manualmente
          </div>
        </div>
      )}
    </div>
  )
}

// ── Principal ─────────────────────────────────────────────────────────────────
export default function PageConversas({ api: apiProp }) {
  const api = apiProp || BASE

  const [convs,     setConvs]     = useState([])
  const [sel,       setSel]       = useState(null)
  const [statusSel, setStatusSel] = useState('pendente')
  const [statusMap, setStatusMap] = useState({})
  const [busca,     setBusca]     = useState('')
  const [loading,   setLoading]   = useState(true)
  const [modoMap,   setModoMap]   = useState({})  // tel → manual

  const toggleModo = useCallback((tel) => {
    setModoMap(prev => ({ ...prev, [tel]: !prev[tel] }))
  }, [])

  const getStatus = (tel) => statusMap[tel] || 'pendente'

  const carregar = useCallback(async (silencioso=false) => {
    if (!silencioso) setLoading(true)
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
    if (!silencioso) setLoading(false)
  }, [api])

  useEffect(() => {
    carregar()
    const i = setInterval(()=>{ if(document.visibilityState==='visible') carregar(true) }, 15000)
    return () => clearInterval(i)
  }, [carregar])

  const setConvStatus = (tel, st) => {
    setStatusMap(prev=>({...prev,[tel]:st}))
    fetch(`${api}/api/contatos/${tel}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({status_atendimento:st})
    }).catch(()=>{})
  }

  const contadores = {}
  STATUS.forEach(s => {
    contadores[s.id] = s.id==='gatilhos'
      ? convs.filter(c=>c.modo==='transacional').length
      : convs.filter(c=>getStatus(c.telefone)===s.id).length
  })

  const filtradas = convs
    .filter(c => {
      if (statusSel==='gatilhos') return c.modo==='transacional'
      return getStatus(c.telefone)===statusSel
    })
    .filter(c => !busca ||
      (c.nome||'').toLowerCase().includes(busca.toLowerCase()) ||
      c.telefone.includes(busca) ||
      (c.ultima_msg||'').toLowerCase().includes(busca.toLowerCase())
    )

  const stCfg = STATUS.find(s=>s.id===statusSel)||STATUS[0]

  return (
    <div className="h-full flex overflow-hidden" style={{ background:'var(--bg)' }}>

      {/* Sidebar expansível */}
      <Sidebar statusSel={statusSel} setStatusSel={setStatusSel} contadores={contadores}/>

      {/* Lista de conversas */}
      <div style={{
        width:272, flexShrink:0, display:'flex', flexDirection:'column',
        borderRight:'1px solid var(--sep)',
      }}>
        {/* Header */}
        <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--sep)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <stCfg.icon size={13} style={{color:stCfg.color}}/>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--label)' }}>{stCfg.label}</span>
              <span style={{ fontSize:10, color:'var(--label-4)', background:'var(--fill)', padding:'1px 6px', borderRadius:8 }}>
                {filtradas.length}
              </span>
            </div>
            <button onClick={()=>carregar()} style={{ padding:4, border:'none', background:'transparent', cursor:'pointer', color:'var(--label-4)' }}>
              <RefreshCw size={11}/>
            </button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--fill)', borderRadius:8, padding:'5px 8px' }}>
            <Search size={11} style={{color:'var(--label-4)',flexShrink:0}}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)}
              placeholder="Buscar..." style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:11, color:'var(--label)' }}/>
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex:1, overflow:'auto' }}>
          {loading
            ? Array.from({length:5}).map((_,i) => (
                <div key={i} style={{ padding:'9px 12px', borderBottom:'1px solid var(--sep)' }}>
                  <div style={{ height:9, width:'55%', borderRadius:4, background:'var(--sep)', marginBottom:5 }}/>
                  <div style={{ height:7, width:'75%', borderRadius:4, background:'var(--sep)' }}/>
                </div>
              ))
            : filtradas.length === 0
            ? (
              <div style={{ padding:24, textAlign:'center' }}>
                <div style={{ fontSize:12, color:'var(--label-4)', marginBottom:4 }}>Nenhuma conversa</div>
                <div style={{ fontSize:10, color:'var(--label-4)' }}>
                  {statusSel==='pendente'?'Novas conversas aparecem aqui':
                   statusSel==='gatilhos'?'Disparos automáticos aqui':
                   'Mude o status de uma conversa para ver aqui'}
                </div>
              </div>
            )
            : filtradas.map(c => {
                const ativo = sel?.telefone===c.telefone
                const cor   = avatarCor(c.telefone)
                const st    = STATUS.find(s=>s.id===getStatus(c.telefone))||STATUS[0]
                return (
                  <div key={c.telefone} onClick={()=>setSel(c)}
                    style={{
                      display:'flex', gap:9, padding:'9px 12px', cursor:'pointer',
                      borderBottom:'1px solid var(--sep)',
                      borderLeft: ativo?'2px solid var(--accent)':'2px solid transparent',
                      background: ativo?'rgba(0,212,170,0.04)':'transparent',
                      transition:'background 0.1s',
                    }}
                    onMouseEnter={e=>{ if(!ativo) e.currentTarget.style.background='var(--fill)' }}
                    onMouseLeave={e=>{ if(!ativo) e.currentTarget.style.background='transparent' }}
                  >
                    <Avatar nome={c.nome} telefone={c.telefone} size={34}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:'var(--label)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130 }}>
                          {c.nome||c.telefone}
                        </span>
                        <span style={{ fontSize:9, color:'var(--label-4)', flexShrink:0 }}>{c.hora}</span>
                      </div>
                      <div style={{ fontSize:10.5, color:'var(--label-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>
                        {c.ultima_direcao==='saida'?'↩ ':''}{c.ultima_msg||'—'}
                      </div>
                      <div style={{ display:'flex', gap:3, alignItems:'center' }}>
                        {c.agente && <span style={{ fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:3, background:'rgba(0,212,170,0.1)', color:'#00d4aa' }}>IA</span>}
                        <span style={{ fontSize:8, fontWeight:600, padding:'1px 5px', borderRadius:3, background:st.bg, color:st.color }}>{st.label}</span>
                        <span style={{ fontSize:8, color:'var(--label-4)', marginLeft:'auto' }}>{c.total_msgs}m</span>
                      </div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* Área central + painel lateral */}
      {sel ? (
        <>
          <Chat
            conv={sel} api={api}
            status={getStatus(sel.telefone)}
            onStatusChange={setConvStatus}
            modoManual={modoMap[sel.telefone] || false}
            onAssumir={toggleModo}
          />
          <PainelInfo conv={sel} api={api}/>
        </>
      ) : (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:'var(--label-4)' }}>
          <MessageSquare size={40} style={{opacity:0.2}}/>
          <div style={{ fontSize:14, fontWeight:500 }}>Selecione uma conversa</div>
          <div style={{ fontSize:11 }}>{filtradas.length} em {stCfg.label.toLowerCase()}</div>
        </div>
      )}
    </div>
  )
}
