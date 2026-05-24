import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { Send, Smile, Image, Video, Mic, Lightbulb, Package, Search, RefreshCw, ChevronLeft, ChevronRight, User, Bot, Zap, X, Lock, MessageSquare, ShoppingCart, Tag, Check, Truck, AlertTriangle } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Constantes de status ───────────────────────────────────────────────────────
const STATUS = [
  { id:'pendente',     label:'Pendente',     cor:'var(--color-text-warning)',  bg:'var(--color-background-warning)',  dot:'bg-amber-400'   },
  { id:'em_andamento', label:'Em andamento', cor:'var(--color-text-info)',     bg:'var(--color-background-info)',     dot:'bg-blue-400'    },
  { id:'resolvido',    label:'Resolvido',    cor:'var(--color-text-success)',  bg:'var(--color-background-success)',  dot:'bg-emerald-400' },
  { id:'encerrado',    label:'Encerrado',    cor:'var(--color-text-tertiary)', bg:'var(--color-background-tertiary)', dot:'bg-gray-400'    },
  { id:'gatilhos',     label:'Gatilhos',     cor:'var(--color-text-info)',     bg:'var(--color-background-info)',     dot:'bg-purple-400'  },
]

const REACOES = ['👍','❤️','😂','😮','😢','🙏']
const EMOJIS  = ['😊','👍','🙏','❤️','✅','📦','💰','🚀','😅','🎉','💬','⏳']

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtR   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmtTel = t => { const n=(t||'').replace(/\D/g,'').replace(/^55/,''); return n.length===11?`(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`:t||'' }
const iniciais = n => (n||'?').split(' ').slice(0,2).map(p=>p[0]||'').join('').toUpperCase()||'?'
const CORES    = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#06b6d4','#ec4899','#ef4444']
const corH     = s => CORES[(s||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%CORES.length]

// ── Avatar com foto real ──────────────────────────────────────────────────────
function Avatar({ nome, telefone, fotoUrl, size=36 }) {
  const [err, setErr] = useState(false)
  const nm  = nome || telefone || '?'
  const cor = corH(nm)
  const foto = fotoUrl || null
  return (
    <div className="relative flex-shrink-0 rounded-full overflow-hidden" style={{width:size,height:size}}>
      {foto && !err
        ? <img src={foto} alt={nm} className="w-full h-full object-cover" onError={()=>setErr(true)}/>
        : <div className="w-full h-full flex items-center justify-center font-bold text-white"
            style={{background:cor, fontSize:Math.round(size*.35)}}>
            {iniciais(nm)}
          </div>
      }
      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[var(--color-background-primary)]"
        style={{background:cor+'60'}}/>
    </div>
  )
}

// ── Bolha de mensagem ─────────────────────────────────────────────────────────
const Bolha = memo(function Bolha({ msg, mostrarGatilhos }) {
  const [hover,  setHover]  = useState(false)
  const [reacao, setReacao] = useState(null)
  const [picker, setPicker] = useState(false)

  const entrada   = msg.direcao === 'entrada'
  const isGatilho = msg.modo === 'transacional'
  const isManual  = msg.modo === 'manual'
  const texto     = (msg.conteudo||'').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g,'').trim()

  if (isGatilho && !mostrarGatilhos) return null

  // Cores via CSS vars — funciona em dark/light mode
  const bubbleCls = entrada
    ? 'bg-[var(--color-background-primary)] border border-[var(--color-border-tertiary)]'
    : isGatilho
      ? 'bg-purple-500/10 border border-purple-500/20'
      : isManual
        ? 'bg-blue-500/10 border border-blue-500/20'
        : 'bg-emerald-500/10 border border-emerald-500/20'

  const labelCls = isGatilho ? 'text-purple-400' : isManual ? 'text-blue-400' : 'text-emerald-400'
  const label    = entrada ? null : isGatilho ? 'Gatilho' : isManual ? 'Atendente' : 'Bia'

  return (
    <div
      className={`flex flex-col mb-2 ${entrada?'items-start':'items-end'}`}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>{setHover(false);setPicker(false)}}
    >
      {label && (
        <span className={`text-[9px] font-bold mb-1 flex items-center gap-1 ${labelCls}`}>
          {isGatilho && (
            <Zap size={9}/>
          )}
          {label}
        </span>
      )}
      <div className={`flex items-end gap-1.5 ${entrada?'flex-row':'flex-row-reverse'}`}>
        {entrada && <Avatar nome={null} telefone={msg.telefone||''} size={20}/>}

        <div className={`relative max-w-[72%] px-3 py-2 rounded-2xl ${bubbleCls} ${entrada?'rounded-tl-sm':'rounded-tr-sm'}`}>
          {texto && (
            <p className="text-[12.5px] leading-relaxed text-[var(--color-text-primary)] whitespace-pre-wrap break-words">{texto}</p>
          )}
          <p className={`text-[9px] mt-1 text-[var(--color-text-tertiary)] ${entrada?'text-left':'text-right'}`}>
            {new Date(msg.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
            {!entrada && <span className="ml-1">✓✓</span>}
          </p>
          {reacao && (
            <button onClick={()=>setReacao(null)}
              className="absolute -bottom-2.5 right-2 bg-[var(--color-background-primary)] border border-[var(--color-border-tertiary)] rounded-xl px-1.5 text-[11px]">
              {reacao}
            </button>
          )}
        </div>

        {hover && (
          <div className="relative">
            <button onClick={()=>setPicker(v=>!v)}
              className="w-6 h-6 rounded-full border border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] flex items-center justify-center text-[11px]">
              😊
            </button>
            {picker && (
              <div className={`absolute bottom-7 ${entrada?'left-0':'right-0'} flex gap-1.5 bg-[var(--color-background-primary)] border border-[var(--color-border-tertiary)] rounded-2xl px-2.5 py-1.5 z-50 shadow-lg whitespace-nowrap`}>
                {REACOES.map(r=>(
                  <button key={r} onClick={()=>{setReacao(r);setPicker(false)}}
                    className="text-base hover:scale-125 transition-transform">{r}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

// ── Separador de data ─────────────────────────────────────────────────────────
function DateSep({ data }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[var(--color-border-tertiary)]"/>
      <span className="text-[10px] text-[var(--color-text-tertiary)] font-medium px-2.5 py-0.5 rounded-full border border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] whitespace-nowrap">
        {new Date(data).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'short'})}
      </span>
      <div className="flex-1 h-px bg-[var(--color-border-tertiary)]"/>
    </div>
  )
}

// ── Sidebar colapsável com filtros ────────────────────────────────────────────
function Sidebar({ statusSel, setStatusSel, contadores, expandida, setExpandida }) {
  return (
    <div className="flex-shrink-0 flex flex-col overflow-hidden border-r border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] transition-all duration-200"
      style={{width: expandida ? 192 : 48}}>
      <button onClick={()=>setExpandida(v=>!v)}
        className="flex items-center border-b border-[var(--color-border-tertiary)] py-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors flex-shrink-0"
        style={{justifyContent: expandida?'flex-end':'center', paddingRight: expandida?10:0}}>
        {expandida
          ? <ChevronLeft size={13}/>
          : <ChevronRight size={13}/>
        }
      </button>
      <div className="flex-1 py-1.5 overflow-y-auto">
        {STATUS.map((s,i) => {
          const ativo = statusSel === s.id
          const cnt   = contadores[s.id] || 0
          return (
            <div key={s.id}>
              {i===4 && <div className="h-px bg-[var(--color-border-tertiary)] mx-2 my-1"/>}
              <button
                title={s.label}
                onClick={()=>setStatusSel(s.id)}
                className={`w-full flex items-center gap-2.5 py-2.5 border-l-2 transition-all ${
                  ativo
                    ? 'border-l-[var(--color-border-success)] bg-[var(--color-background-success)]'
                    : 'border-l-transparent hover:bg-[var(--color-background-tertiary)]'
                }`}
                style={{paddingLeft: expandida?12:0, justifyContent: expandida?'flex-start':'center'}}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`}/>
                {expandida && (
                  <>
                    <span className="text-[12px] font-medium text-[var(--color-text-primary)] flex-1 text-left whitespace-nowrap">
                      {s.label}
                    </span>
                    {cnt > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)] mr-2">
                        {cnt > 99 ? '99+' : cnt}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Catálogo acima das mensagens ──────────────────────────────────────────────
function CatalogoBarra({ telefone, api }) {
  const [busca,    setBusca]    = useState('')
  const [produtos, setProdutos] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [aberto,   setAberto]   = useState(false)
  const [enviando, setEnviando] = useState(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const fn = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setAberto(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const buscar = async () => {
    if (!busca.trim()) return
    setLoading(true); setAberto(true)
    try {
      const r = await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(busca)}`)
      if (r.ok) { const d = await r.json(); setProdutos(d.produtos||[]) }
    } catch {}
    setLoading(false)
  }

  const enviar = async prod => {
    setEnviando(prod.id||prod.nome)
    const n = parseFloat(prod.preco||prod.precoVenda||0)
    const msg = `*${prod.nome||prod.descricao}*\n💳 Cartão: ${fmtR(n)} | 💰 PIX: ${fmtR(n*.9)}\n${prod.disponivel!==false?'✅ Disponível':'⚠️ Indisponível'}`
    try {
      await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone,mensagem:msg})})
    } catch {}
    setEnviando(null); setAberto(false); setBusca('')
  }

  return (
    <div ref={wrapRef} className="relative flex-1">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-background-primary)] border border-purple-500/20 focus-within:border-purple-500/50 transition-colors">
        <Search size={14} className="text-purple-400 flex-shrink-0"/>
        <input
          value={busca} onChange={e=>setBusca(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&buscar()}
          placeholder="Buscar produto para enviar ao cliente..."
          className="flex-1 bg-transparent text-[11.5px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
        />
        {busca && (
          <button onClick={()=>{setBusca('');setAberto(false);setProdutos([])}}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
            <X size={11}/>
          </button>
        )}
      </div>

      {aberto && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--color-background-primary)] border border-[var(--color-border-tertiary)] rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {loading
            ? <p className="px-3 py-2.5 text-[11px] text-[var(--color-text-tertiary)]">Buscando...</p>
            : produtos.length === 0
              ? <p className="px-3 py-2.5 text-[11px] text-[var(--color-text-tertiary)]">Nenhum produto encontrado</p>
              : produtos.slice(0,8).map((p,i) => (
                <div key={i}
                  className="flex items-center gap-3 px-3 py-2.5 border-b border-[var(--color-border-tertiary)] last:border-0 hover:bg-[var(--color-background-secondary)] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[var(--color-text-primary)] truncate">{p.nome||p.descricao}</p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">{p.codigo||''} · {fmtR(p.preco||p.precoVenda||0)}</p>
                  </div>
                  <button onClick={()=>enviar(p)} disabled={enviando===(p.id||p.nome)}
                    className="flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-semibold border border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-40 transition-colors">
                    {enviando===(p.id||p.nome)?'…':'Enviar'}
                  </button>
                </div>
              ))
          }
        </div>
      )}
    </div>
  )
}

// ── Painel lateral direito: Perfil / Pedidos / Catálogo ───────────────────────
function PainelInfo({ conv, api, statusAtend, setStatusAtend }) {
  const [aba,      setAba]      = useState('perfil')
  const [perfil,   setPerfil]   = useState(null)
  const [pedidos,  setPedidos]  = useState([])
  const [loadPed,  setLoadPed]  = useState(false)
  const [produtos, setProdutos] = useState([])
  const [busca,    setBusca]    = useState('')
  const [loadP,    setLoadP]    = useState(false)
  const [enviando, setEnviando] = useState(null)

  useEffect(() => {
    if (!conv?.telefone) return
    let m = true
    fetch(`${api}/api/contatos/${conv.telefone}`)
      .then(r=>r.ok?r.json():null).then(d=>{if(m&&d)setPerfil(d)}).catch(()=>{})
    setLoadPed(true)
    fetch(`${api}/api/contatos/${conv.telefone}/pedidos`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(m){const l=Array.isArray(d)?d:d?.pedidos||[];setPedidos(l)}})
      .catch(()=>{}).finally(()=>{if(m)setLoadPed(false)})
    return ()=>{m=false}
  }, [conv?.telefone, api])

  const buscarProd = async () => {
    if (!busca.trim()) return
    setLoadP(true); setProdutos([])
    try {
      const r=await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(busca)}`)
      if(r.ok){const d=await r.json();setProdutos(d.produtos||[])}
    } catch {}
    setLoadP(false)
  }

  const enviarProd = async prod => {
    setEnviando(prod.id||prod.nome)
    const n=parseFloat(prod.preco||prod.precoVenda||0)
    const msg=`*${prod.nome||prod.descricao}*\n💳 ${fmtR(n)} | 💰 PIX ${fmtR(n*.9)}\n${prod.disponivel!==false?'✅ Disponível':'⚠️ Indisponível'}`
    try{await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:conv.telefone,mensagem:msg})})}catch{}
    setEnviando(null)
  }

  const enviarPedido = async p => {
    setEnviando('ped_'+(p.numero||p.id))
    const rastr=p.rastreio&&p.rastreio!=='—'?`\n📦 Rastreio: ${p.rastreio}`:''
    const msg=`📋 *Pedido #${p.numero||p.id}*\nData: ${p.data||'—'}\nStatus: ${p.situacao||p.status||'—'}\nValor: ${p.total||'—'}${rastr}`
    try{await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:conv.telefone,mensagem:msg})})}catch{}
    setEnviando(null)
  }

  const mapSit = s => {
    if (!s) return '—'
    const id=typeof s==='object'?s?.id||s?.valor:s
    return {6:'Aberto',9:'Atendido',12:'Cancelado',14:'Faturado',15:'Verificado'}[id]||String(id||s)
  }

  const STATUS_ATEND = [
    {id:'pendente',    label:'Pendente',    cls:'text-amber-500 bg-amber-500/10 border-amber-500/30'},
    {id:'em_andamento',label:'Em andamento',cls:'text-blue-400 bg-blue-500/10 border-blue-500/30'},
    {id:'resolvido',   label:'Resolvido',   cls:'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'},
    {id:'encerrado',   label:'Encerrado',   cls:'text-[var(--color-text-tertiary)] bg-[var(--color-background-tertiary)] border-[var(--color-border-tertiary)]'},
  ]

  return (
    <div className="w-60 flex-shrink-0 flex flex-col overflow-hidden border-l border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)]">
      {/* mini header */}
      <div className="px-3 py-2.5 border-b border-[var(--color-border-tertiary)] flex items-center gap-2.5 flex-shrink-0">
        <Avatar nome={conv.nome} telefone={conv.telefone} fotoUrl={conv.foto_url||conv.fotoUrl} size={28}/>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-[var(--color-text-primary)] truncate">{conv.nome||fmtTel(conv.telefone)}</p>
          <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">{fmtTel(conv.telefone)}</p>
        </div>
      </div>

      {/* status de atendimento */}
      <div className="px-3 py-2.5 border-b border-[var(--color-border-tertiary)] flex-shrink-0">
        <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">Status</p>
        <div className="grid grid-cols-2 gap-1">
          {STATUS_ATEND.map(s=>(
            <button key={s.id} onClick={()=>setStatusAtend(s.id)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-semibold border transition-all ${
                statusAtend===s.id ? s.cls : 'text-[var(--color-text-tertiary)] border-transparent hover:bg-[var(--color-background-tertiary)]'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusAtend===s.id?'bg-current':'bg-[var(--color-border-tertiary)]'}`}/>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* tabs */}
      <div className="flex border-b border-[var(--color-border-tertiary)] flex-shrink-0">
        {['perfil','pedidos','catálogo'].map(a=>(
          <button key={a} onClick={()=>setAba(a)}
            className={`flex-1 py-2 text-[10px] font-semibold capitalize transition-colors border-b-2 ${
              aba===a?'text-emerald-500 border-emerald-500':'text-[var(--color-text-tertiary)] border-transparent hover:text-[var(--color-text-secondary)]'
            }`}>
            {a}
          </button>
        ))}
      </div>

      {/* conteúdo */}
      <div className="flex-1 overflow-y-auto p-3">

        {/* ABA PERFIL */}
        {aba==='perfil' && (
          <div className="space-y-3">
            {perfil
              ? [
                  {l:'Nome',        v:perfil.nome},
                  {l:'Telefone',    v:fmtTel(perfil.telefone||conv.telefone)},
                  {l:'E-mail',      v:perfil.email},
                  {l:'Cidade',      v:perfil.cidade},
                  {l:'Documento',   v:perfil.cpf_cnpj||perfil.cpf||perfil.cnpj},
                  {l:'Total gasto', v:perfil.total_gasto?fmtR(perfil.total_gasto):null},
                ].filter(i=>i.v).map((item,i)=>(
                  <div key={i}>
                    <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-0.5">{item.l}</p>
                    <p className="text-[11.5px] font-medium text-[var(--color-text-primary)]">{item.v}</p>
                  </div>
                ))
              : <p className="text-[11px] text-[var(--color-text-tertiary)] text-center py-6">Sem cadastro vinculado</p>
            }
          </div>
        )}

        {/* ABA PEDIDOS */}
        {aba==='pedidos' && (
          <div className="space-y-2">
            {loadPed
              ? <p className="text-[11px] text-[var(--color-text-tertiary)] text-center py-6">Carregando...</p>
              : pedidos.length===0
                ? <div className="text-center py-6">
                    <p className="text-[24px] mb-2">📋</p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">Nenhum pedido</p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">CPF pode não estar vinculado</p>
                  </div>
                : pedidos.map((p,i)=>{
                    const sit=mapSit(p.situacao||p.status)
                    const sitCls={Atendido:'text-emerald-500',Verificado:'text-emerald-500',Aberto:'text-amber-500',Cancelado:'text-red-400',Faturado:'text-blue-400'}[sit]||'text-[var(--color-text-tertiary)]'
                    const pedId='ped_'+(p.numero||p.id)
                    return (
                      <div key={i} className="rounded-xl bg-[var(--color-background-primary)] border border-[var(--color-border-tertiary)] p-2.5">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[11px] font-bold text-[var(--color-text-primary)]">#{p.numero||p.id}</span>
                          <span className={`text-[9px] font-semibold ${sitCls}`}>{sit}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[9px] text-[var(--color-text-tertiary)]">{p.data||'—'}</span>
                          <span className="text-[12px] font-bold text-emerald-500">{p.total||'—'}</span>
                        </div>
                        {p.rastreio&&p.rastreio!=='—'&&(
                          <p className="text-[9px] text-blue-400 mb-2 flex items-center gap-1">
                            <Truck size={10}/>
                            {p.rastreio}
                          </p>
                        )}
                        <button onClick={()=>enviarPedido(p)} disabled={enviando===pedId}
                          className="w-full py-1.5 rounded-lg border border-emerald-500/40 text-emerald-500 text-[10px] font-semibold hover:bg-emerald-500/10 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5">
                          <Send size={10}/>
                          {enviando===pedId?'Enviando…':'Enviar ao cliente'}
                        </button>
                      </div>
                    )
                  })
            }
          </div>
        )}

        {/* ABA CATÁLOGO */}
        {aba==='catálogo' && (
          <div className="space-y-2">
            <div className="flex gap-1.5">
              <input value={busca} onChange={e=>setBusca(e.target.value)} onKeyDown={e=>e.key==='Enter'&&buscarProd()}
                placeholder="Buscar produto..."
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-[var(--color-background-primary)] border border-[var(--color-border-tertiary)] text-[11.5px] text-[var(--color-text-primary)] outline-none focus:border-emerald-500/50"/>
              <button onClick={buscarProd}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-bold">
                {loadP?'…':'↵'}
              </button>
            </div>
            {produtos.length===0
              ? <p className="text-[10px] text-[var(--color-text-tertiary)] text-center py-4">Enter para buscar</p>
              : produtos.map((p,i)=>(
                <div key={i} className="rounded-xl bg-[var(--color-background-primary)] border border-[var(--color-border-tertiary)] p-2.5">
                  <p className="text-[11px] font-semibold text-[var(--color-text-primary)] mb-1.5 leading-tight">{p.nome||p.descricao}</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[12px] font-bold text-emerald-500">{fmtR(p.preco||p.precoVenda||0)}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${p.disponivel!==false?'text-emerald-500 bg-emerald-500/10':'text-red-400 bg-red-500/10'}`}>
                      {p.disponivel!==false?'✓ Disponível':'✗ Indisponível'}
                    </span>
                  </div>
                  <button onClick={()=>enviarProd(p)} disabled={enviando===(p.id||p.nome)}
                    className="w-full py-1.5 rounded-lg border border-emerald-500/40 text-emerald-500 text-[10px] font-semibold hover:bg-emerald-500/10 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5">
                    <Send size={10}/>
                    {enviando===(p.id||p.nome)?'Enviando…':'Enviar ao cliente'}
                  </button>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}

// ── Barra de envio ────────────────────────────────────────────────────────────
function BarraEnvio({ modoManual, telefone, api, onEnviou, onAssumirIA }) {
  const [texto,    setTexto]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [sugestoes,setSugestoes]= useState([])
  const [loadSug,  setLoadSug]  = useState(false)
  const [anotacao, setAnotacao] = useState(false)
  const [emojiOpen,setEmojiOpen]= useState(false)
  const inputRef = useRef(null)
  const imgRef   = useRef(null)
  const vidRef   = useRef(null)

  const buscarSugestoes = useCallback(async () => {
    if (!telefone) return
    setLoadSug(true)
    try {
      const r = await fetch(`${api}/api/sugestoes/${telefone}`)
      if (r.ok) {
        const d = await r.json()
        const l = d.sugestoes||d.suggestions||[]
        setSugestoes(l.length>0 ? l : [
          'Olá! Em que posso te ajudar hoje? 😊',
          'Pode me contar mais sobre o que precisa?',
          'Vou verificar isso agora mesmo! ⚡',
        ])
      }
    } catch {
      setSugestoes(['Olá! Em que posso te ajudar? 😊','Vou verificar isso agora! ⚡'])
    }
    setLoadSug(false)
  }, [telefone, api])

  useEffect(() => {
    if (modoManual && telefone) buscarSugestoes()
    else setSugestoes([])
  }, [modoManual, telefone])

  const enviar = async (msg) => {
    const txt=(msg||texto).trim()
    if (!txt||sending) return
    setTexto(''); setSugestoes([])
    setSending(true)
    try {
      await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone,mensagem:txt})})
      onEnviou?.()
    } catch {}
    setSending(false)
    inputRef.current?.focus()
  }

  const enviarArq = (file, tipo) => {
    if (!file) return
    const rd = new FileReader()
    rd.onload = async () => {
      try {
        await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone,tipo,midia_base64:rd.result.split(',')[1],midia_nome:file.name})})
        onEnviou?.()
      } catch {}
    }
    rd.readAsDataURL(file)
  }

  if (!modoManual) return (
    <div className="px-4 py-3 border-t border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] flex items-center justify-between flex-shrink-0">
      <p className="text-[11px] text-[var(--color-text-tertiary)]">IA respondendo automaticamente</p>
      <button onClick={onAssumirIA}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors">
        <User size={12}/>
        Assumir conversa
      </button>
    </div>
  )

  return (
    <div className="border-t border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] flex-shrink-0">
      {/* tabs resposta/anotação */}
      <div className="flex border-b border-[var(--color-border-tertiary)]">
        {[{id:false,label:'Resposta pública'},{id:true,label:'Anotação interna'}].map(a=>(
          <button key={String(a.id)} onClick={()=>setAnotacao(a.id)}
            className={`px-3 py-2 text-[11.5px] font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              anotacao===a.id
                ? 'text-emerald-500 border-emerald-500'
                : 'text-[var(--color-text-tertiary)] border-transparent hover:text-[var(--color-text-secondary)]'
            }`}>
            {a.id && <Lock size={9}/>}
            {a.label}
          </button>
        ))}
      </div>

      {/* sugestões IA */}
      {sugestoes.length>0 && (
        <div className="px-3 py-2 flex gap-1.5 flex-wrap items-center border-b border-[var(--color-border-tertiary)]">
          <Lightbulb size={12} className="text-amber-400 flex-shrink-0"/>
          {sugestoes.slice(0,3).map((s,i)=>(
            <button key={i} onClick={()=>enviar(s)}
              className="text-[10.5px] px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[var(--color-text-secondary)] hover:bg-amber-500/20 max-w-[220px] truncate transition-colors">
              {s}
            </button>
          ))}
          <button onClick={buscarSugestoes} className="ml-auto text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
            {loadSug
              ? <RefreshCw size={12} className="animate-spin"/>
              : <RefreshCw size={12}/>
            }
          </button>
        </div>
      )}

      {/* emoji picker */}
      {emojiOpen && (
        <div className="px-3 py-2 flex flex-wrap gap-1.5 border-b border-[var(--color-border-tertiary)]">
          {EMOJIS.map(e=>(
            <button key={e} onClick={()=>{setTexto(t=>t+e);setEmojiOpen(false);inputRef.current?.focus()}}
              className="text-lg hover:scale-125 transition-transform">{e}</button>
          ))}
        </div>
      )}

      {anotacao && (
        <div className="mx-3 mt-2 px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] font-semibold text-purple-400 flex items-center gap-1.5">
          <Lock size={9}/>
          Anotação interna — não enviada ao cliente
        </div>
      )}

      <div className="px-3 py-2">
        <textarea ref={inputRef} value={texto} onChange={e=>setTexto(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar()}}}
          placeholder={anotacao?'Escreva uma anotação interna...':'Escreva uma mensagem...'}
          rows={2}
          className="w-full bg-transparent text-[13px] text-[var(--color-text-primary)] resize-none outline-none leading-relaxed placeholder:text-[var(--color-text-tertiary)]"/>
      </div>

      <div className="px-3 pb-2.5 flex items-center gap-1.5">
        {/* emoji */}
        <button onClick={()=>setEmojiOpen(v=>!v)}
          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${emojiOpen?'border-emerald-500/40 bg-emerald-500/10 text-emerald-500':'border-[var(--color-border-tertiary)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-background-tertiary)]'}`}>
          <Smile size={14}/>
        </button>
        {/* imagem */}
        <label className="w-7 h-7 rounded-lg border border-[var(--color-border-tertiary)] flex items-center justify-center cursor-pointer text-[var(--color-text-tertiary)] hover:bg-[var(--color-background-tertiary)] transition-colors">
          <Image size={14}/>
          <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e=>{if(e.target.files[0])enviarArq(e.target.files[0],'image');e.target.value=''}}/>
        </label>
        {/* vídeo */}
        <label className="w-7 h-7 rounded-lg border border-[var(--color-border-tertiary)] flex items-center justify-center cursor-pointer text-[var(--color-text-tertiary)] hover:bg-[var(--color-background-tertiary)] transition-colors">
          <Video size={14}/>
          <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={e=>{if(e.target.files[0])enviarArq(e.target.files[0],'video');e.target.value=''}}/>
        </label>
        {/* áudio */}
        <button className="w-7 h-7 rounded-lg border border-[var(--color-border-tertiary)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-background-tertiary)] transition-colors">
          <Mic size={14}/>
        </button>
        {/* sugestão IA */}
        <button onClick={buscarSugestoes} disabled={loadSug}
          className="w-7 h-7 rounded-lg border border-amber-500/30 bg-amber-500/8 flex items-center justify-center text-amber-400 hover:bg-amber-500/15 transition-colors">
          <Lightbulb size={13}/>
        </button>

        <div className="flex-1"/>

        <button onClick={()=>enviar()} disabled={!texto.trim()||sending}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
            texto.trim()&&!sending
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-tertiary)] cursor-default'
          }`}>
          {sending
            ? <RefreshCw size={14} className="animate-spin"/>
            : <Send size={13}/>
          }
          Enviar
        </button>
      </div>
    </div>
  )
}

// ── Chat central ──────────────────────────────────────────────────────────────
function Chat({ conv, api, statusAtend, setStatusAtend, modoManual, onToggleModo }) {
  const [msgs,            setMsgs]            = useState([])
  const [loading,         setLoading]          = useState(true)
  const [hasMore,         setHasMore]          = useState(false)
  const [offset,          setOffset]           = useState(0)
  const [mostrarGatilhos, setMostrarGatilhos]  = useState(false)
  const bottomRef  = useRef(null)
  const prevLen    = useRef(0)
  const fetching   = useRef(false)
  const pollingRef = useRef(null)

  const telefone = conv?.telefone

  const carregar = useCallback(async (off=0, sil=false) => {
    if (!telefone||fetching.current) return
    fetching.current=true
    if (!sil) setLoading(true)
    try {
      const r=await fetch(`${api}/api/dashboard/historico/${telefone}?limit=60&offset=${off}`)
      if (r.ok) {
        const d=await r.json()
        const novas=d.mensagens||[]
        if(off===0) setMsgs(novas); else setMsgs(p=>[...novas,...p])
        setHasMore(d.hasMore||false)
        setOffset(off===0?novas.length:off+novas.length)
      }
    } catch {}
    if (!sil) setLoading(false)
    fetching.current=false
  }, [telefone, api])

  useEffect(() => {
    setMsgs([]); setOffset(0); prevLen.current=0
    carregar(0)
    pollingRef.current=setInterval(()=>{if(document.visibilityState==='visible')carregar(0,true)},8000)
    return ()=>clearInterval(pollingRef.current)
  }, [telefone])

  useEffect(() => {
    if (msgs.length>prevLen.current)
      bottomRef.current?.scrollIntoView({behavior:prevLen.current===0?'instant':'smooth'})
    prevLen.current=msgs.length
  }, [msgs])

  const grupos = useMemo(()=>{
    const g=[]; let d=null
    for (const m of msgs) {
      const dt=new Date(m.criado_em).toDateString()
      if(dt!==d){g.push({tipo:'sep',data:m.criado_em});d=dt}
      g.push({tipo:'msg',msg:m})
    }
    return g
  }, [msgs])

  const nGatilhos = msgs.filter(m=>m.modo==='transacional').length

  const stCfg = STATUS.find(s=>s.id===statusAtend)||STATUS[0]

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] flex-shrink-0">
        <Avatar nome={conv.nome} telefone={conv.telefone} fotoUrl={conv.foto_url||conv.fotoUrl} size={34}/>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{conv.nome||fmtTel(conv.telefone)}</p>
          <p className="text-[10px] text-[var(--color-text-tertiary)]">{conv.total_msgs||0} msgs · {conv.hora||''}</p>
        </div>

        {/* status row inline */}
        <div className="flex gap-1.5">
          {STATUS.filter(s=>s.id!=='gatilhos').map(s=>(
            <button key={s.id} onClick={()=>setStatusAtend(s.id)}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border transition-all min-w-[44px] ${
                statusAtend===s.id
                  ? 'border-current opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-80 hover:bg-[var(--color-background-tertiary)]'
              }`}
              style={{color: statusAtend===s.id ? stCfg.cor : 'var(--color-text-tertiary)'}}>
              <span className={`w-2 h-2 rounded-full ${s.dot}`}/>
              <span className="text-[8px] font-semibold whitespace-nowrap leading-none">{s.label}</span>
            </button>
          ))}
        </div>

        {/* assumir/devolver */}
        <button onClick={onToggleModo}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all flex-shrink-0 ${
            modoManual
              ? 'text-blue-400 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20'
              : 'text-[var(--color-text-tertiary)] bg-[var(--color-background-tertiary)] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-secondary)]'
          }`}>
          {modoManual
            ? <><Bot size={12}/> Devolver à IA</>
            : <><User size={12}/> Assumir</>
          }
        </button>

        <button onClick={()=>carregar(0)}
          className="w-7 h-7 rounded-lg border border-[var(--color-border-tertiary)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-background-tertiary)] transition-colors">
          <RefreshCw size={13}/>
        </button>
      </div>

      {/* barra catálogo — acima das mensagens */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/5 border-b border-purple-500/15 flex-shrink-0">
        <Package size={13} className="text-purple-400 flex-shrink-0"/>
        <span className="text-[10px] font-semibold text-purple-400 flex-shrink-0">Catálogo</span>
        <CatalogoBarra telefone={telefone} api={api}/>
      </div>

      {/* filtro de gatilhos */}
      {nGatilhos>0 && (
        <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/5 border-b border-purple-500/10 flex-shrink-0">
          <Zap size={10} className="text-purple-400"/>
          <span className="text-[10px] text-purple-400">{nGatilhos} gatilho{nGatilhos>1?'s':''} nesta conversa</span>
          <button onClick={()=>setMostrarGatilhos(v=>!v)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              mostrarGatilhos
                ? 'border-purple-500/40 bg-purple-500/15 text-purple-400'
                : 'border-purple-500/20 text-purple-400 hover:bg-purple-500/10'
            }`}>
            {mostrarGatilhos?'Ocultar':'Mostrar'}
          </button>
        </div>
      )}

      {/* mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-[var(--color-background-primary)]">
        {hasMore && (
          <div className="text-center pb-3">
            <button onClick={()=>carregar(offset)}
              className="text-[10px] text-emerald-500 border border-[var(--color-border-tertiary)] rounded-full px-3 py-1 hover:bg-[var(--color-background-secondary)] transition-colors">
              Carregar anteriores
            </button>
          </div>
        )}
        {loading&&msgs.length===0
          ? <p className="text-center py-12 text-[12px] text-[var(--color-text-tertiary)]">Carregando...</p>
          : grupos.length===0
          ? <p className="text-center py-12 text-[12px] text-[var(--color-text-tertiary)]">Nenhuma mensagem</p>
          : grupos.map((g,i)=>
              g.tipo==='sep'
                ? <DateSep key={`s${i}`} data={g.data}/>
                : <Bolha key={g.msg.id||i} msg={{...g.msg,telefone}} mostrarGatilhos={mostrarGatilhos}/>
            )
        }
        <div ref={bottomRef}/>
      </div>

      <BarraEnvio
        modoManual={modoManual}
        telefone={telefone}
        api={api}
        onEnviou={()=>carregar(0,true)}
        onAssumirIA={onToggleModo}
      />
    </div>
  )
}

// ── Card de conversa na lista ─────────────────────────────────────────────────
const ConvCard = memo(function ConvCard({ conv, selecionada, status, onClick }) {
  const st = STATUS.find(s=>s.id===status)||STATUS[0]
  return (
    <div onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer border-b border-[var(--color-border-tertiary)] border-l-2 transition-all ${
        selecionada
          ? 'bg-emerald-500/8 border-l-emerald-500'
          : 'border-l-transparent hover:bg-[var(--color-background-secondary)]'
      }`}>
      <Avatar nome={conv.nome} telefone={conv.telefone} fotoUrl={conv.foto_url||conv.fotoUrl} size={34}/>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className={`text-[12px] font-semibold truncate max-w-[130px] ${selecionada?'text-emerald-500':'text-[var(--color-text-primary)]'}`}>
            {conv.nome||fmtTel(conv.telefone)}
          </span>
          <span className="text-[9px] text-[var(--color-text-tertiary)] flex-shrink-0">{conv.hora||''}</span>
        </div>
        <p className="text-[10.5px] text-[var(--color-text-secondary)] truncate mb-1">
          {conv.ultima_direcao==='saida'?'↩ ':''}{conv.ultima_msg||'—'}
        </p>
        <div className="flex gap-1.5">
          {conv.agente && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">IA</span>}
          <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded"
            style={{background:st.bg, color:st.cor}}>
            {st.label}
          </span>
        </div>
      </div>
    </div>
  )
})

// ── Página principal ──────────────────────────────────────────────────────────
export default function PageConversas({ api: apiProp }) {
  const api = apiProp || BASE

  const [convs,     setConvs]     = useState([])
  const [selTel,    setSelTel]    = useState(null)
  const [statusSel, setStatusSel] = useState(()=>sessionStorage.getItem('bia_conv_status')||'pendente')
  const [statusMap, setStatusMap] = useState({})
  const [modoMap,   setModoMap]   = useState({})
  const [busca,     setBusca]     = useState('')
  const [loading,   setLoading]   = useState(true)
  const [sidebar,   setSidebar]   = useState(()=>sessionStorage.getItem('bia_sidebar')==='true')

  useEffect(()=>{sessionStorage.setItem('bia_conv_status',statusSel)},[statusSel])
  useEffect(()=>{sessionStorage.setItem('bia_sidebar',String(sidebar))},[sidebar])

  const getStatus = tel => statusMap[tel]||'pendente'
  const getModo   = tel => modoMap[tel]||false

  const carregar = useCallback(async (sil=false)=>{
    if (!sil) setLoading(true)
    try {
      const r=await fetch(`${api}/api/dashboard/conversas?aba=todas`)
      if (r.ok) {
        const d=await r.json()
        const novas=d.conversas||[]
        setConvs(prev=>{
          const map=new Map(prev.map(c=>[c.telefone,c]))
          return novas.map(c=>({...map.get(c.telefone),...c}))
        })
        setStatusMap(prev=>{
          const novo={...prev}
          novas.forEach(c=>{if(!novo[c.telefone]&&c.status_atendimento)novo[c.telefone]=c.status_atendimento})
          return novo
        })
      }
    } catch {}
    if (!sil) setLoading(false)
  }, [api])

  useEffect(()=>{
    carregar()
    const i=setInterval(()=>{if(document.visibilityState==='visible')carregar(true)},15000)
    return()=>clearInterval(i)
  },[carregar])

  // Salva status localmente E no servidor
  const setConvStatus = useCallback((tel, st)=>{
    setStatusMap(prev=>({...prev,[tel]:st}))
    fetch(`${api}/api/dashboard/status/${tel}`,{
      method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:st})
    }).catch(()=>{})
    fetch(`${api}/api/contatos/${tel}`,{
      method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:st})
    }).catch(()=>{})
  },[api])

  const toggleModo = useCallback(tel=>{
    const novoModo = !getModo(tel)
    setModoMap(prev=>({...prev,[tel]:novoModo}))
    if (novoModo) {
      fetch(`${api}/api/dashboard/manual/${tel}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({modo:'manual'})}).catch(()=>{})
    }
  },[api, modoMap])

  const contadores = useMemo(()=>{
    const c={}
    STATUS.forEach(s=>{c[s.id]=convs.filter(cv=>getStatus(cv.telefone)===s.id).length})
    c['gatilhos']=convs.filter(c=>c.modo==='transacional').length
    return c
  },[convs,statusMap])

  const filtradas = useMemo(()=>convs
    .filter(c=>{
      if(statusSel==='gatilhos') return c.modo==='transacional'
      return getStatus(c.telefone)===statusSel
    })
    .filter(c=>!busca||(c.nome||'').toLowerCase().includes(busca.toLowerCase())||c.telefone.includes(busca)||(c.ultima_msg||'').toLowerCase().includes(busca.toLowerCase()))
  ,[convs,statusSel,statusMap,busca])

  const selConv = convs.find(c=>c.telefone===selTel)
  const stSel   = STATUS.find(s=>s.id===statusSel)||STATUS[0]

  return (
    <div className="flex h-full overflow-hidden">

      {/* sidebar filtros */}
      <Sidebar statusSel={statusSel} setStatusSel={setStatusSel} contadores={contadores} expandida={sidebar} setExpandida={setSidebar}/>

      {/* lista de conversas */}
      <div className={`flex-shrink-0 flex flex-col overflow-hidden border-r border-[var(--color-border-tertiary)] transition-all duration-200 ${selTel?'w-72':'w-96'}`}>
        <div className="px-4 py-3 border-b border-[var(--color-border-tertiary)] flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${stSel.dot}`}/>
              <span className="text-[14px] font-bold text-[var(--color-text-primary)]">{stSel.label}</span>
              <span className="text-[10px] text-[var(--color-text-tertiary)] bg-[var(--color-background-tertiary)] px-2 py-0.5 rounded-full">{filtradas.length}</span>
            </div>
            <button onClick={()=>carregar()}
              className="w-7 h-7 rounded-lg border border-[var(--color-border-tertiary)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-background-secondary)] transition-colors">
              <RefreshCw size={12}/>
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] focus-within:border-emerald-500/40 transition-colors">
            <Search size={12} className="text-[var(--color-text-tertiary)] flex-shrink-0"/>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..."
              className="flex-1 bg-transparent text-[12px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"/>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading
            ? Array.from({length:4}).map((_,i)=>(
                <div key={i} className="flex gap-3 px-4 py-3 border-b border-[var(--color-border-tertiary)]">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-background-tertiary)] flex-shrink-0"/>
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-2.5 rounded bg-[var(--color-background-tertiary)] w-2/3"/>
                    <div className="h-2 rounded bg-[var(--color-background-tertiary)] w-full"/>
                  </div>
                </div>
              ))
            : filtradas.length===0
              ? <p className="p-8 text-center text-[12px] text-[var(--color-text-tertiary)]">
                  {busca?'Nenhum resultado':statusSel==='pendente'?'Novas conversas aparecem aqui':'Sem conversas neste status'}
                </p>
              : filtradas.map(c=>(
                  <ConvCard key={c.telefone} conv={c} selecionada={selTel===c.telefone}
                    status={getStatus(c.telefone)}
                    onClick={()=>setSelTel(c.telefone===selTel?null:c.telefone)}/>
                ))
          }
        </div>
      </div>

      {/* área principal */}
      {selConv ? (
        <>
          <Chat
            key={selConv.telefone}
            conv={selConv}
            api={api}
            statusAtend={getStatus(selConv.telefone)}
            setStatusAtend={st=>setConvStatus(selConv.telefone, st)}
            modoManual={getModo(selConv.telefone)}
            onToggleModo={()=>toggleModo(selConv.telefone)}
          />
          <PainelInfo
            conv={selConv}
            api={api}
            statusAtend={getStatus(selConv.telefone)}
            setStatusAtend={st=>setConvStatus(selConv.telefone, st)}
          />
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[var(--color-background-secondary)]">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-background-primary)] border border-[var(--color-border-tertiary)] flex items-center justify-center">
            <MessageSquare size={22} className="text-[var(--color-text-tertiary)]"/>
          </div>
          <p className="text-[14px] font-medium text-[var(--color-text-primary)]">Selecione uma conversa</p>
          <p className="text-[12px] text-[var(--color-text-tertiary)]">{filtradas.length} em {stSel.label.toLowerCase()}</p>
        </div>
      )}
    </div>
  )
}
