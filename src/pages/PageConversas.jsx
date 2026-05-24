import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import {
  Send, Smile, Image, Video, Mic, Search, RefreshCw,
  User, Bot, Zap, X, Lock, MessageSquare, Package,
  ShoppingCart, Tag, Check, Truck, AlertTriangle,
  ChevronDown, ChevronUp, Star, FileText,
  Phone, Mail, MapPin, Paperclip, Sparkles,
  CheckCircle, Circle, XCircle, History, RefreshCcw,
  ArrowUpRight, RotateCcw
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Constantes ─────────────────────────────────────────────────────────────
const REACOES = ['👍','❤️','😂','😮','😢','🙏']
const EMOJIS  = ['😊','👍','🙏','❤️','✅','📦','💰','🚀','😅','🎉','💬','⏳']

// ── Status pipeline ─────────────────────────────────────────────────────────
const STATUS_CFG = {
  pendente:     { label:'Pendente',     color:'#d97706', bg:'rgba(251,191,36,0.12)',  border:'rgba(251,191,36,0.3)',  dot:'#f59e0b',  icon:Circle      },
  em_andamento: { label:'Em andamento', color:'#3b82f6', bg:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.3)',  dot:'#3b82f6',  icon:RefreshCcw  },
  resolvido:    { label:'Resolvido',    color:'#10b981', bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.3)',  dot:'#10b981',  icon:CheckCircle },
  encerrado:    { label:'Encerrado',    color:'#94a3b8', bg:'rgba(148,163,184,0.1)', border:'rgba(148,163,184,0.3)', dot:'#94a3b8',  icon:XCircle     },
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmtR   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmtTel = t => { const n=(t||'').replace(/\D/g,'').replace(/^55/,''); return n.length===11?`(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`:t||'' }
const fmtRel = ts => { if(!ts) return ''; const m=Math.floor((Date.now()-new Date(ts))/60000); if(m<1)return 'agora'; if(m<60)return `${m}min`; if(m<1440)return `${Math.floor(m/60)}h`; return `${Math.floor(m/1440)}d` }
const fmtHora = ts => ts ? new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : ''
const fmtData = ts => ts ? new Date(ts).toLocaleDateString('pt-BR') : ''
const initials = s => (s||'?').trim().split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()

// ── Avatar ──────────────────────────────────────────────────────────────────
const AV_PAL = [
  ['#dbeafe','#1e40af'],['#ede9fe','#5b21b6'],['#d1fae5','#065f46'],
  ['#fef3c7','#92400e'],['#fce7f3','#9d174d'],['#ccfbf1','#0f766e'],
]
const avCol = s => AV_PAL[(s||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%AV_PAL.length]
function Av({ nome, foto, size=32 }) {
  const [bg,fg] = avCol(nome)
  if (foto) return <img src={foto} alt={nome} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:bg,color:fg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.38,fontWeight:700,flexShrink:0}}>
      {initials(nome)}
    </div>
  )
}

// ── Badge arredondado ───────────────────────────────────────────────────────
function Badge({ label, color, bg, border, icon:Icon, size=10 }) {
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 8px',borderRadius:99,fontSize:size,fontWeight:700,color,background:bg,border:`1px solid ${border||color+'33'}`,whiteSpace:'nowrap'}}>
      {Icon && <Icon size={size}/>}{label}
    </span>
  )
}

// ── ConvCard ────────────────────────────────────────────────────────────────
const ConvCard = memo(function ConvCard({ conv, sel, statusAtend, nomeIA, onClick }) {
  const S = STATUS_CFG[statusAtend] || STATUS_CFG.pendente
  const manual = conv.agente === 'humano' || conv.modo_manual
  return (
    <div onClick={onClick} style={{padding:'10px 12px',borderBottom:'1px solid var(--color-border-tertiary)',borderLeft:`3px solid ${sel?'#4f6ef7':'transparent'}`,background:sel?'rgba(79,110,247,0.07)':'transparent',cursor:'pointer',transition:'background .1s'}}
      onMouseEnter={e=>{if(!sel)e.currentTarget.style.background='var(--color-background-secondary)'}}
      onMouseLeave={e=>{if(!sel)e.currentTarget.style.background='transparent'}}>
      <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:6}}>
        <Av nome={conv.nome||conv.telefone} foto={conv.foto_url||conv.fotoUrl} size={34}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
            <span style={{fontSize:12.5,fontWeight:600,color:'var(--color-text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:140}}>{conv.nome||fmtTel(conv.telefone)}</span>
            <span style={{fontSize:10,color:'var(--color-text-tertiary)',flexShrink:0}}>{fmtRel(conv.ultima_atividade||conv.hora)}</span>
          </div>
          <p style={{fontSize:11,color:'var(--color-text-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:185}}>{conv.ultima_mensagem||conv.ultima_msg||'—'}</p>
        </div>
      </div>
      <div style={{display:'flex',gap:5,flexWrap:'wrap',paddingLeft:43}}>
        <Badge label={S.label} color={S.color} bg={S.bg} border={S.border}/>
        <Badge label={manual?'Atendente':nomeIA} color={manual?'#3b82f6':'#8b5cf6'} bg={manual?'rgba(59,130,246,.1)':'rgba(139,92,246,.1)'}
          icon={manual?User:Bot}/>
      </div>
    </div>
  )
})

// ── Bolha com reações emoji ─────────────────────────────────────────────────
const Bolha = memo(function Bolha({ msg, nomeIA }) {
  const [hover,   setHover]   = useState(false)
  const [reacao,  setReacao]  = useState(null)
  const [picker,  setPicker]  = useState(false)

  const entrada   = msg.direcao === 'entrada'
  const isGatilho = msg.modo === 'transacional'
  const isManual  = msg.modo === 'manual'
  const texto     = (msg.conteudo||'').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g,'').trim()
  if (!texto) return null

  const labelTxt   = entrada ? null : isGatilho ? 'Gatilho' : isManual ? 'Atendente' : nomeIA
  const labelColor = isGatilho ? '#d97706' : isManual ? '#3b82f6' : '#8b5cf6'

  let bubbleSt
  if (entrada) {
    bubbleSt = {background:'var(--color-background-primary)',border:'1px solid var(--color-border-tertiary)',borderRadius:'4px 14px 14px 14px',color:'var(--color-text-primary)'}
  } else if (isGatilho) {
    bubbleSt = {background:'#451a03',borderRadius:'14px 4px 14px 14px',border:'none',color:'#fde68a'}
  } else if (isManual) {
    bubbleSt = {background:'#1e3a5f',borderRadius:'14px 4px 14px 14px',border:'none',color:'#bfdbfe'}
  } else {
    bubbleSt = {background:'#1e1b4b',borderRadius:'14px 4px 14px 14px',border:'none',color:'#e0e7ff'}
  }

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:entrada?'flex-start':'flex-end',marginBottom:8,position:'relative'}}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>{setHover(false);setPicker(false)}}>

      {labelTxt && (
        <span style={{fontSize:9,fontWeight:700,color:labelColor,marginBottom:2,padding:'0 2px',display:'flex',alignItems:'center',gap:3}}>
          {isManual?<User size={9}/>:isGatilho?<Zap size={9}/>:<Bot size={9}/>}{labelTxt}
        </span>
      )}

      <div style={{display:'flex',alignItems:'flex-end',gap:6,flexDirection:entrada?'row':'row-reverse',position:'relative'}}>
        <div style={{...bubbleSt,maxWidth:'72%',padding:'9px 13px',fontSize:13,lineHeight:1.55,wordBreak:'break-word',position:'relative'}}>
          {texto.split('\n').map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
          {reacao && (
            <div onClick={()=>setReacao(null)} style={{position:'absolute',bottom:-10,right:6,background:'var(--color-background-primary)',border:'1px solid var(--color-border-tertiary)',borderRadius:10,padding:'1px 5px',fontSize:13,cursor:'pointer',zIndex:2}}>
              {reacao}
            </div>
          )}
        </div>

        {/* Botão de reação no hover */}
        {hover && (
          <div style={{position:'relative',flexShrink:0}}>
            <button onClick={()=>setPicker(v=>!v)}
              style={{width:22,height:22,borderRadius:'50%',border:'1px solid var(--color-border-tertiary)',background:'var(--color-background-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,padding:0}}>
              <Smile size={12} style={{color:'var(--color-text-tertiary)'}}/>
            </button>
            {picker && (
              <div style={{position:'absolute',bottom:28,[entrada?'left':'right']:0,display:'flex',gap:3,background:'var(--color-background-primary)',border:'1px solid var(--color-border-tertiary)',borderRadius:16,padding:'5px 8px',boxShadow:'0 4px 16px rgba(0,0,0,0.15)',zIndex:50,whiteSpace:'nowrap'}}>
                {REACOES.map(r=>(
                  <button key={r} onClick={()=>{setReacao(r);setPicker(false)}} style={{fontSize:17,background:'transparent',border:'none',cursor:'pointer',padding:2,lineHeight:1}}>
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2,padding:'0 2px',[entrada?'justifyContent':'textAlign']:entrada?'flex-start':'right',flexDirection:entrada?'row':'row-reverse'}}>
        <span style={{fontSize:9,color:'var(--color-text-tertiary)'}}>{fmtHora(msg.criado_em)}</span>
        {!entrada && <Check size={11} style={{color:'#60a5fa'}}/>}
      </div>
    </div>
  )
})

// ── DateSep ─────────────────────────────────────────────────────────────────
function DateSep({ ts }) {
  const d    = new Date(ts)
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const dia  = new Date(d); dia.setHours(0,0,0,0)
  const diff = Math.round((hoje-dia)/86400000)
  const label = diff===0?'Hoje':diff===1?'Ontem':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,margin:'14px 0'}}>
      <div style={{flex:1,height:1,background:'var(--color-border-tertiary)'}}/>
      <span style={{fontSize:10,fontWeight:600,color:'var(--color-text-tertiary)',background:'var(--color-background-secondary)',padding:'2px 10px',borderRadius:99,border:'1px solid var(--color-border-tertiary)',whiteSpace:'nowrap'}}>
        {label}
      </span>
      <div style={{flex:1,height:1,background:'var(--color-border-tertiary)'}}/>
    </div>
  )
}

// ── Catálogo Overlay ────────────────────────────────────────────────────────
function CatalogoOverlay({ telefone, api, onClose }) {
  const [busca,    setBusca]    = useState('')
  const [produtos, setProdutos] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [enviando, setEnviando] = useState(null)
  const inputRef = useRef(null)

  useEffect(()=>{ inputRef.current?.focus() }, [])

  const buscar = async () => {
    if (!busca.trim()) return
    setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(busca)}`)
      if (r.ok) { const d=await r.json(); setProdutos(d.produtos||[]) }
    } catch {}
    setLoading(false)
  }

  const enviar = async (prod) => {
    setEnviando(prod.id||prod.nome)
    const n = parseFloat(prod.preco||prod.precoVenda||0)
    const msg = `*${prod.nome||prod.descricao}*\n💳 Cartão: ${fmtR(n)} | 💰 PIX: ${fmtR(n*.9)}\n${prod.disponivel!==false?'✅ Disponível em estoque':'⚠️ Indisponível'}`
    try {
      await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone,mensagem:msg})})
    } catch {}
    setEnviando(null); onClose()
  }

  return (
    <div style={{position:'absolute',bottom:'100%',left:0,right:0,zIndex:100,marginBottom:4,background:'var(--color-background-secondary)',border:'1px solid var(--color-border-tertiary)',borderRadius:12,boxShadow:'0 -8px 32px rgba(0,0,0,0.2)',overflow:'hidden'}}>
      {/* Header busca */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderBottom:'1px solid var(--color-border-tertiary)'}}>
        <ShoppingCart size={14} style={{color:'#10b981',flexShrink:0}}/>
        <input ref={inputRef} value={busca} onChange={e=>setBusca(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&buscar()}
          placeholder="Buscar produto..." style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:13,color:'var(--color-text-primary)'}}/>
        {busca && <button onClick={()=>{setBusca('');setProdutos([])}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--color-text-tertiary)',display:'flex'}}><X size={13}/></button>}
        <button onClick={buscar} style={{padding:'4px 10px',borderRadius:7,background:'#10b981',color:'#fff',border:'none',cursor:'pointer',fontSize:11,fontWeight:600,flexShrink:0}}>
          {loading?<RefreshCw size={11} className="animate-spin"/>:'Buscar'}
        </button>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--color-text-tertiary)',display:'flex'}}><X size={14}/></button>
      </div>
      {/* Resultados */}
      <div style={{maxHeight:260,overflowY:'auto'}}>
        {loading ? (
          <p style={{padding:'14px',fontSize:12,color:'var(--color-text-tertiary)',textAlign:'center'}}>Buscando...</p>
        ) : produtos.length===0 && busca ? (
          <p style={{padding:'14px',fontSize:12,color:'var(--color-text-tertiary)',textAlign:'center'}}>Nenhum produto encontrado</p>
        ) : (
          produtos.slice(0,10).map((p,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:'1px solid var(--color-border-tertiary)',cursor:'pointer'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--color-background-tertiary)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:12.5,fontWeight:500,color:'var(--color-text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nome||p.descricao}</p>
                <p style={{fontSize:11,color:'#10b981',fontWeight:600,marginTop:1}}>{fmtR(p.preco||p.precoVenda||0)}</p>
              </div>
              <button onClick={()=>enviar(p)} disabled={enviando===(p.id||p.nome)}
                style={{padding:'4px 12px',borderRadius:7,border:'1px solid #10b981',background:enviando===(p.id||p.nome)?'#10b981':'transparent',color:enviando===(p.id||p.nome)?'#fff':'#10b981',cursor:'pointer',fontSize:11,fontWeight:600,flexShrink:0,transition:'all .15s'}}>
                {enviando===(p.id||p.nome)?'Enviando...':'Enviar'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Sugestão IA Banner ──────────────────────────────────────────────────────
function SugestaoIA({ sugestao, onUsar, onFechar }) {
  if (!sugestao) return null
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',background:'rgba(245,158,11,0.08)',borderTop:'1px solid rgba(245,158,11,0.2)'}}>
      <Zap size={12} style={{color:'#f59e0b',flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:10,fontWeight:700,color:'#f59e0b',marginBottom:1}}>Sugestão da IA</p>
        <p style={{fontSize:12,color:'var(--color-text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sugestao}</p>
      </div>
      <button onClick={onUsar} style={{padding:'4px 10px',borderRadius:7,border:'1px solid #f59e0b',background:'transparent',color:'#f59e0b',cursor:'pointer',fontSize:11,fontWeight:700,flexShrink:0}}>Usar</button>
      <button onClick={onFechar} style={{background:'none',border:'none',cursor:'pointer',color:'var(--color-text-tertiary)',display:'flex'}}><X size={13}/></button>
    </div>
  )
}

// ── Composer (barra de envio) ───────────────────────────────────────────────
function Composer({ telefone, api, onEnviou, modoManual, nomeIA }) {
  const [texto,      setTexto]     = useState('')
  const [tab,        setTab]       = useState('publica')
  const [sending,    setSending]   = useState(false)
  const [sugs,       setSugs]      = useState([])
  const [sugestaoIA, setSugestaoIA]= useState(null)
  const [loadSug,    setLoadSug]   = useState(false)
  const [refining,   setRefining]  = useState(false)
  const [emojiOpen,  setEmojiOpen] = useState(false)
  const [catOpen,    setCatOpen]   = useState(false)
  const taRef  = useRef(null)
  const imgRef = useRef(null)
  const vidRef = useRef(null)

  const buscarSugestoes = useCallback(async () => {
    if (!telefone) return
    setLoadSug(true)
    try {
      const r = await fetch(`${api}/api/sugestoes/${telefone}`)
      if (r.ok) {
        const d = await r.json()
        const lista = (d.sugestoes||d||[])
        setSugs(lista.slice(0,3))
        if (lista[0]) setSugestaoIA(typeof lista[0]==='string'?lista[0]:lista[0].texto||lista[0])
      }
    } catch {}
    setLoadSug(false)
  }, [telefone, api])

  useEffect(()=>{
    if (telefone) buscarSugestoes()
  }, [telefone])

  const enviar = async (msgOverride) => {
    const msg = (msgOverride || texto).trim()
    if (!msg || sending) return
    setSending(true)
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ telefone, mensagem:msg, anotacao:tab==='nota' })
      })
      setTexto(''); onEnviou?.()
    } catch {}
    setSending(false)
    taRef.current?.focus()
  }

  const enviarArquivo = (file, tipo) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]
      try {
        await fetch(`${api}/api/dashboard/mensagem`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ telefone, tipo, midia_base64:base64, midia_nome:file.name })
        })
        onEnviou?.()
      } catch {}
    }
    reader.readAsDataURL(file)
  }

  const refinarIA = async () => {
    if (!texto.trim()) return
    setRefining(true)
    try {
      const r = await fetch(`${api}/api/ia/melhorar-texto`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ texto, contexto:`Atendimento WhatsApp ${telefone}` })
      })
      if (r.ok) { const d=await r.json(); if(d.texto) setTexto(d.texto) }
    } catch {}
    setRefining(false)
  }

  const onKey = e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar()} }
  const isNota = tab==='nota'
  const accentTab = isNota ? '#d97706' : '#4f6ef7'

  const toolBtnSt = (active, accent='#4f6ef7') => ({
    width:30,height:30,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',
    border:`1px solid ${active?accent+'44':'var(--color-border-tertiary)'}`,
    background:active?accent+'18':'transparent',
    color:active?accent:'var(--color-text-tertiary)',cursor:'pointer',transition:'all .12s'
  })

  return (
    <div style={{flexShrink:0,borderTop:'1px solid var(--color-border-tertiary)',background:'var(--color-background-primary)',position:'relative'}}>

      {/* Sugestão IA banner */}
      <SugestaoIA
        sugestao={sugestaoIA}
        onUsar={()=>{ setTexto(sugestaoIA); setSugestaoIA(null); taRef.current?.focus() }}
        onFechar={()=>setSugestaoIA(null)}/>

      {/* Catálogo overlay */}
      {catOpen && (
        <CatalogoOverlay telefone={telefone} api={api} onClose={()=>setCatOpen(false)}/>
      )}

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid var(--color-border-tertiary)',paddingLeft:14}}>
        {[['publica','Resposta pública','MessageSquare'],['nota','Anotação interna','Lock']].map(([id,label])=>{
          const on=tab===id; const col=on?(id==='nota'?'#d97706':'#4f6ef7'):'var(--color-text-tertiary)'
          const IcTab = id==='nota' ? Lock : MessageSquare
          return (
            <button key={id} onClick={()=>setTab(id)}
              style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',fontSize:12,fontWeight:600,cursor:'pointer',color:col,borderBottom:`2px solid ${on?col:'transparent'}`,background:'transparent',border:'none',borderBottomWidth:2,borderBottomStyle:'solid',borderBottomColor:on?col:'transparent'}}>
              <IcTab size={12}/>{label}
            </button>
          )
        })}
      </div>

      {/* Nota interna badge */}
      {isNota && (
        <div style={{margin:'6px 14px 0',padding:'3px 10px',background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:6,fontSize:10,fontWeight:600,color:'#d97706',display:'inline-flex',alignItems:'center',gap:4}}>
          <Lock size={10}/>Anotação interna — não enviada ao cliente
        </div>
      )}

      {/* Textarea */}
      <div style={{padding:'8px 14px 2px'}}>
        <textarea ref={taRef} value={texto} onChange={e=>setTexto(e.target.value)} onKeyDown={onKey}
          rows={2} placeholder={isNota?'Anotação interna...':'Escrever mensagem...'}
          style={{width:'100%',border:'none',background:'transparent',outline:'none',fontSize:13,color:'var(--color-text-primary)',resize:'none',lineHeight:1.55,fontFamily:'inherit',maxHeight:120,overflow:'auto'}}/>
      </div>

      {/* Picker emoji */}
      {emojiOpen && (
        <div style={{padding:'6px 14px 4px',display:'flex',gap:5,flexWrap:'wrap',borderBottom:'1px solid var(--color-border-tertiary)'}}>
          {EMOJIS.map(e=>(
            <button key={e} onClick={()=>{setTexto(t=>t+e);setEmojiOpen(false);taRef.current?.focus()}}
              style={{fontSize:18,background:'transparent',border:'none',cursor:'pointer',padding:2,lineHeight:1}}>
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px 10px'}}>
        {/* Catálogo */}
        <button onClick={()=>{setCatOpen(v=>!v);setEmojiOpen(false)}}
          title="Catálogo de produtos"
          style={{...toolBtnSt(catOpen,'#10b981'),width:'auto',padding:'0 10px',gap:5,fontSize:11,fontWeight:600}}>
          <ShoppingCart size={13}/><span style={{color:catOpen?'#10b981':'var(--color-text-tertiary)'}}>Catálogo</span>
        </button>

        {/* Imagem (input file real) */}
        <label title="Enviar imagem" style={toolBtnSt(false)}>
          <Image size={14}/>
          <input ref={imgRef} type="file" accept="image/*" style={{display:'none'}}
            onChange={e=>{ if(e.target.files[0]) enviarArquivo(e.target.files[0],'image'); e.target.value='' }}/>
        </label>

        {/* Vídeo (input file real) */}
        <label title="Enviar vídeo" style={toolBtnSt(false)}>
          <Video size={14}/>
          <input ref={vidRef} type="file" accept="video/*" style={{display:'none'}}
            onChange={e=>{ if(e.target.files[0]) enviarArquivo(e.target.files[0],'video'); e.target.value='' }}/>
        </label>

        {/* Áudio */}
        <button title="Áudio" style={toolBtnSt(false)}><Mic size={14}/></button>

        {/* Emoji */}
        <button title="Emoji" onClick={()=>{setEmojiOpen(v=>!v);setCatOpen(false)}} style={toolBtnSt(emojiOpen,'#f59e0b')}>
          <Smile size={14}/>
        </button>

        {/* Anexo */}
        <button title="Anexar arquivo" style={toolBtnSt(false)}><Paperclip size={14}/></button>

        {/* Molise IA */}
        <button onClick={refinarIA} disabled={!texto.trim()||refining} title={`Refinar com ${nomeIA}`}
          style={{...toolBtnSt(false,'#8b5cf6'),width:'auto',padding:'0 10px',gap:5,fontSize:11,fontWeight:600,opacity:(!texto.trim()||refining)?.5:1}}>
          <Sparkles size={12} className={refining?'animate-spin':''}/>
          <span>{refining?'Refinando...':nomeIA+' IA'}</span>
        </button>

        <div style={{flex:1}}/>

        {/* Enviar */}
        <button onClick={()=>enviar()} disabled={!texto.trim()||sending}
          style={{display:'flex',alignItems:'center',gap:6,padding:'7px 18px',borderRadius:9,border:'none',background:texto.trim()&&!sending?'#4f6ef7':'var(--color-background-secondary)',color:texto.trim()&&!sending?'#fff':'var(--color-text-tertiary)',cursor:texto.trim()?'pointer':'default',fontSize:13,fontWeight:700,transition:'all .15s'}}>
          <Send size={14}/>{sending?'Enviando...':'Enviar'}
        </button>
      </div>
    </div>
  )
}

// ── ChatArea ────────────────────────────────────────────────────────────────
function ChatArea({ conv, api, statusAtend, onStatusChange, modoManual, onToggleModo, nomeIA }) {
  const [msgs,    setMsgs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset,  setOffset]  = useState(0)
  const bottomRef  = useRef(null)
  const fetching   = useRef(false)
  const pollingRef = useRef(null)
  const tel = conv?.telefone

  const carregar = useCallback(async (off=0, sil=false) => {
    if (!tel||fetching.current) return
    fetching.current=true
    if (!sil) setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${tel}?limit=60&offset=${off}`)
      if (r.ok) {
        const d = await r.json()
        const novas = d.mensagens||[]
        if (off===0) setMsgs(novas); else setMsgs(p=>[...novas,...p])
        setHasMore(d.hasMore||false)
        setOffset(off===0?novas.length:off+novas.length)
      }
    } catch {}
    fetching.current=false; setLoading(false)
  }, [tel, api])

  useEffect(()=>{
    if (!tel) return
    setMsgs([]); setOffset(0); setLoading(true); setHasMore(false)
    carregar(0)
    pollingRef.current = setInterval(()=>{ if(document.visibilityState!=='hidden') carregar(0,true) }, 4000)
    return ()=>clearInterval(pollingRef.current)
  }, [tel, carregar])

  useEffect(()=>{ if(msgs.length>0) bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [msgs.length])

  // Agrupa por dia
  const grouped = useMemo(()=>{
    if (!msgs.length) return []
    const out=[]; let lastDay=null
    msgs.forEach(m=>{
      const day = m.criado_em ? new Date(m.criado_em).toDateString() : null
      if (day && day!==lastDay) { out.push({type:'sep',ts:m.criado_em}); lastDay=day }
      out.push({type:'msg',msg:m})
    })
    return out
  }, [msgs])

  if (!conv) return (
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,background:'var(--color-background-secondary)'}}>
      <MessageSquare size={32} style={{color:'var(--color-text-tertiary)',opacity:.2}}/>
      <p style={{fontSize:13,color:'var(--color-text-tertiary)'}}>Selecione uma conversa</p>
    </div>
  )

  const S = STATUS_CFG[statusAtend] || STATUS_CFG.pendente

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* ── Header ── */}
      <div style={{flexShrink:0,display:'flex',alignItems:'center',gap:10,padding:'0 18px',height:52,background:'var(--color-background-primary)',borderBottom:'1px solid var(--color-border-tertiary)'}}>
        <Av nome={conv.nome||conv.telefone} foto={conv.foto_url||conv.fotoUrl} size={32}/>
        <div style={{flex:'0 0 auto'}}>
          <p style={{fontSize:13,fontWeight:700,color:'var(--color-text-primary)',lineHeight:1.2}}>{conv.nome||conv.telefone}</p>
          <p style={{fontSize:10,color:'var(--color-text-tertiary)'}}>{fmtTel(conv.telefone)} · {conv.total_msgs||0} msgs</p>
        </div>

        {/* Pipeline de status */}
        <div style={{display:'flex',alignItems:'center',gap:2,marginLeft:'auto',padding:3,borderRadius:10,background:'var(--color-background-secondary)',border:'1px solid var(--color-border-tertiary)'}}>
          {Object.entries(STATUS_CFG).map(([key,s])=>{
            const on=statusAtend===key; const Sic=s.icon
            return (
              <button key={key} onClick={()=>onStatusChange(key)}
                style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',border:'none',background:on?s.bg:'transparent',color:on?s.color:'var(--color-text-tertiary)',transition:'all .12s'}}>
                <Sic size={10}/>{s.label}
              </button>
            )
          })}
        </div>

        {/* Devolver/Assumir */}
        <button onClick={onToggleModo}
          style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',transition:'all .12s',flexShrink:0,
            background:modoManual?'rgba(59,130,246,0.1)':'rgba(139,92,246,0.1)',
            border:modoManual?'1px solid rgba(59,130,246,0.35)':'1px solid rgba(139,92,246,0.35)',
            color:modoManual?'#3b82f6':'#8b5cf6'}}>
          {modoManual?<><User size={12}/>Assumindo</>:<><Bot size={12}/>Devolver à {nomeIA}</>}
        </button>

        {/* Reset/Refresh */}
        <button onClick={()=>carregar(0)} title="Atualizar conversa"
          style={{width:30,height:30,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid var(--color-border-tertiary)',background:'transparent',color:'var(--color-text-tertiary)',cursor:'pointer',flexShrink:0}}>
          <RefreshCw size={13}/>
        </button>
      </div>

      {/* ── Mensagens ── */}
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',background:'var(--color-background-secondary)'}}>
        {hasMore && (
          <div style={{textAlign:'center',marginBottom:12}}>
            <button onClick={()=>carregar(offset)} style={{padding:'4px 14px',borderRadius:99,fontSize:11,fontWeight:600,border:'1px solid var(--color-border-tertiary)',background:'var(--color-background-primary)',color:'var(--color-text-secondary)',cursor:'pointer'}}>
              <History size={11} style={{display:'inline',marginRight:4}}/>Carregar anteriores
            </button>
          </div>
        )}
        {loading && msgs.length===0 ? (
          <div style={{display:'flex',justifyContent:'center',paddingTop:40}}>
            <RefreshCw size={16} className="animate-spin" style={{color:'var(--color-text-tertiary)'}}/>
          </div>
        ) : grouped.map((item,i)=>(
          item.type==='sep'
            ? <DateSep key={`sep-${i}`} ts={item.ts}/>
            : <Bolha key={item.msg.id||i} msg={item.msg} nomeIA={nomeIA}/>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* ── Composer ── */}
      <Composer telefone={tel} api={api} onEnviou={()=>carregar(0,true)} modoManual={modoManual} nomeIA={nomeIA}/>
    </div>
  )
}

// ── Painel Contextual Direito ────────────────────────────────────────────────
function PainelContexto({ conv, api }) {
  const [aba,      setAba]     = useState('perfil')
  const [perfil,   setPerfil]  = useState(null)
  const [pedidos,  setPedidos] = useState([])
  const [loadPed,  setLoadPed] = useState(false)
  const [pedAb,    setPedAb]   = useState({})
  const [catBusca, setCatBusca]= useState('')
  const [catProds, setCatProds]= useState([])
  const [catLoad,  setCatLoad] = useState(false)

  useEffect(()=>{
    if (!conv?.telefone) return
    let m=true; setPerfil(null); setPedidos([])
    fetch(`${api}/api/contatos/${conv.telefone}`).then(r=>r.ok?r.json():null).then(d=>{if(m&&d)setPerfil(d)}).catch(()=>{})
    setLoadPed(true)
    fetch(`${api}/api/contatos/${conv.telefone}/pedidos`).then(r=>r.ok?r.json():null)
      .then(d=>{if(m){const l=Array.isArray(d)?d:d?.pedidos||[];setPedidos(l)}}).catch(()=>{}).finally(()=>{if(m)setLoadPed(false)})
    return ()=>{m=false}
  }, [conv?.telefone, api])

  const buscarCat = async () => {
    if (!catBusca.trim()) return
    setCatLoad(true); setCatProds([])
    try {
      const r = await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(catBusca)}`)
      if (r.ok) { const d=await r.json(); setCatProds(d.produtos||[]) }
    } catch {}
    setCatLoad(false)
  }

  const enviarProd = async prod => {
    if (!conv?.telefone) return
    const n = parseFloat(prod.preco||prod.precoVenda||0)
    const msg = `*${prod.nome||prod.descricao}*\n💳 Cartão: ${fmtR(n)} | 💰 PIX: ${fmtR(n*.9)}\n${prod.disponivel!==false?'✅ Disponível':'⚠️ Indisponível'}`
    try { await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:conv.telefone,mensagem:msg})}) } catch {}
  }

  if (!conv) return <div style={{width:280,flexShrink:0,borderLeft:'1px solid var(--color-border-tertiary)',background:'var(--color-background-primary)'}}/>

  const tabC = (id) => ({ fontSize:11,fontWeight:600,cursor:'pointer',padding:'7px 0',flex:1,textAlign:'center',borderBottom:`2px solid ${aba===id?'#4f6ef7':'transparent'}`,color:aba===id?'#4f6ef7':'var(--color-text-tertiary)',background:'transparent',border:'none',borderBottomWidth:2,borderBottomStyle:'solid',borderBottomColor:aba===id?'#4f6ef7':'transparent' })

  return (
    <div style={{width:280,flexShrink:0,display:'flex',flexDirection:'column',overflow:'hidden',borderLeft:'1px solid var(--color-border-tertiary)',background:'var(--color-background-primary)'}}>
      {/* Header */}
      <div style={{padding:'12px 14px 0',borderBottom:'1px solid var(--color-border-tertiary)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <Av nome={conv.nome||conv.telefone} foto={conv.foto_url||conv.fotoUrl} size={34}/>
          <div style={{minWidth:0}}>
            <p style={{fontSize:13,fontWeight:700,color:'var(--color-text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{conv.nome||conv.telefone}</p>
            <p style={{fontSize:10,color:'var(--color-text-tertiary)'}}>{fmtTel(conv.telefone)}</p>
          </div>
        </div>
        <div style={{display:'flex',marginBottom:-1}}>
          {[['perfil','Perfil'],['pedidos','Pedidos'],['catalogo','Catálogo']].map(([id,l])=>(
            <button key={id} onClick={()=>setAba(id)} style={tabC(id)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'12px 14px'}}>
        {/* PERFIL */}
        {aba==='perfil' && (
          <>
            <p style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--color-text-tertiary)',marginBottom:8,display:'flex',alignItems:'center',gap:4}}><User size={10}/>Dados do cliente</p>
            {[['Nome',perfil?.nome||conv.nome||'—'],['Telefone',fmtTel(conv.telefone)],['Cidade',perfil?.cidade?(perfil.cidade+(perfil.uf?' · '+perfil.uf:'')):'—'],['E-mail',perfil?.email||'—'],['CPF/CNPJ',perfil?.cpf_cnpj||'—']].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
                <span style={{fontSize:11,color:'var(--color-text-tertiary)'}}>{l}</span>
                <span style={{fontSize:11,fontWeight:500,color:'var(--color-text-primary)',textAlign:'right',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</span>
              </div>
            ))}
            {pedidos.length>0 && (
              <div style={{marginTop:14}}>
                <p style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--color-text-tertiary)',marginBottom:8,display:'flex',alignItems:'center',gap:4}}><Package size={10}/>Pedido recente</p>
                {(()=>{const p=pedidos[0];const cor={Atendido:'#10b981',Faturado:'#3b82f6',Cancelado:'#ef4444',Entregue:'#10b981'}[p.situacao]||'#94a3b8';return(
                  <div style={{border:'1px solid var(--color-border-tertiary)',borderRadius:10,overflow:'hidden'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',background:'var(--color-background-secondary)'}}>
                      <span style={{fontSize:12,fontWeight:700,color:'var(--color-text-primary)'}}><Package size={12} style={{display:'inline',marginRight:4,color:'#3b82f6'}}/> #{p.numero||p.id}</span>
                      <Badge label={p.situacao||'—'} color={cor} bg={cor+'18'}/>
                    </div>
                    {p.rastreio&&p.rastreio!=='—'&&<div style={{padding:'6px 10px',background:'rgba(59,130,246,0.08)',fontSize:11,color:'#3b82f6',fontWeight:600,display:'flex',alignItems:'center',gap:4}}><Truck size={10}/>{p.rastreio}</div>}
                    <div style={{padding:'6px 10px',display:'flex',justifyContent:'space-between',fontSize:11}}><span style={{color:'var(--color-text-tertiary)'}}>{p.data||'—'}</span><span style={{fontWeight:700,color:'var(--color-text-primary)'}}>{fmtR(p.total||p.valor)}</span></div>
                  </div>
                )})()}
              </div>
            )}
            <div style={{marginTop:14}}>
              <p style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--color-text-tertiary)',marginBottom:8,display:'flex',alignItems:'center',gap:4}}><Zap size={10}/>Ações rápidas</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {[{l:'Abrir ocorrência',ic:AlertTriangle},{l:'Ver catálogo',ic:ShoppingCart},{l:'Rastreio',ic:Truck},{l:'CSAT',ic:Star}].map(({l,ic:Ic})=>(
                  <button key={l} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 10px',borderRadius:8,fontSize:10.5,fontWeight:600,border:'1px solid var(--color-border-tertiary)',background:'var(--color-background-secondary)',color:'var(--color-text-secondary)',cursor:'pointer',textAlign:'left'}}>
                    <Ic size={12} style={{flexShrink:0}}/>{l}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* PEDIDOS */}
        {aba==='pedidos' && (
          <>
            <p style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--color-text-tertiary)',marginBottom:10,display:'flex',alignItems:'center',gap:4}}><History size={10}/>Histórico</p>
            {loadPed ? <RefreshCw size={14} className="animate-spin" style={{color:'var(--color-text-tertiary)',margin:'20px auto',display:'block'}}/> :
             pedidos.length===0 ? <p style={{fontSize:12,color:'var(--color-text-tertiary)',textAlign:'center',padding:'20px 0'}}>Nenhum pedido</p> :
             pedidos.map((p,i)=>{
               const cor={Atendido:'#10b981',Faturado:'#3b82f6',Cancelado:'#ef4444',Entregue:'#10b981',Aberto:'#d97706'}[p.situacao]||'#94a3b8'
               const open=pedAb[i]
               return (
                 <div key={i} style={{border:'1px solid var(--color-border-tertiary)',borderRadius:10,overflow:'hidden',marginBottom:8}}>
                   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',cursor:'pointer',background:'var(--color-background-secondary)'}}
                     onClick={()=>setPedAb(v=>({...v,[i]:!v[i]}))}>
                     <div><span style={{fontSize:11,fontWeight:700,color:'var(--color-text-primary)'}}># {p.numero||p.id}</span><span style={{fontSize:10,color:'var(--color-text-tertiary)',marginLeft:6}}>{p.data||'—'}</span></div>
                     <div style={{display:'flex',alignItems:'center',gap:5}}>
                       <Badge label={p.situacao||'—'} color={cor} bg={cor+'18'}/>
                       {open?<ChevronUp size={11}/>:<ChevronDown size={11}/>}
                     </div>
                   </div>
                   {open && (
                     <div style={{padding:'8px 10px',borderTop:'0.5px solid var(--color-border-tertiary)'}}>
                       {p.rastreio&&p.rastreio!=='—'&&<div style={{fontSize:11,color:'#3b82f6',fontWeight:600,marginBottom:6,display:'flex',alignItems:'center',gap:4}}><Truck size={10}/>{p.rastreio}</div>}
                       {(p.itens||[]).map((it,j)=>(
                         <div key={j} style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--color-text-secondary)',padding:'2px 0',borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
                           <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{it.nome||it.descricao}</span>
                           <span style={{marginLeft:8,flexShrink:0}}>{it.quantidade}x {fmtR(it.valor)}</span>
                         </div>
                       ))}
                       <div style={{display:'flex',justifyContent:'space-between',fontSize:11,fontWeight:700,color:'var(--color-text-primary)',marginTop:6}}>
                         <span>Total</span><span>{fmtR(p.total||p.valor)}</span>
                       </div>
                     </div>
                   )}
                 </div>
               )
             })}
          </>
        )}

        {/* CATÁLOGO */}
        {aba==='catalogo' && (
          <>
            <p style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--color-text-tertiary)',marginBottom:8,display:'flex',alignItems:'center',gap:4}}><ShoppingCart size={10}/>Enviar produto</p>
            <div style={{display:'flex',gap:6,marginBottom:10}}>
              <div style={{flex:1,display:'flex',alignItems:'center',gap:6,padding:'6px 10px',borderRadius:8,border:'1px solid var(--color-border-tertiary)',background:'var(--color-background-secondary)'}}>
                <Search size={12} style={{color:'var(--color-text-tertiary)',flexShrink:0}}/>
                <input value={catBusca} onChange={e=>setCatBusca(e.target.value)} onKeyDown={e=>e.key==='Enter'&&buscarCat()}
                  placeholder="Buscar produto..." style={{flex:1,border:'none',background:'transparent',outline:'none',fontSize:12,color:'var(--color-text-primary)'}}/>
              </div>
              <button onClick={buscarCat} style={{padding:'0 10px',borderRadius:8,background:'#4f6ef7',color:'#fff',border:'none',cursor:'pointer',fontSize:11,fontWeight:600,flexShrink:0}}>
                {catLoad?<RefreshCw size={11} className="animate-spin"/>:'Buscar'}
              </button>
            </div>
            {catProds.map((p,i)=>(
              <div key={i} style={{border:'1px solid var(--color-border-tertiary)',borderRadius:8,overflow:'hidden',marginBottom:6}}>
                <div style={{padding:'7px 10px',background:'var(--color-background-secondary)'}}>
                  <p style={{fontSize:11.5,fontWeight:500,color:'var(--color-text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nome||p.descricao}</p>
                  <p style={{fontSize:11,fontWeight:700,color:'#10b981'}}>{fmtR(p.preco||p.precoVenda||0)}</p>
                </div>
                <button onClick={()=>enviarProd(p)} style={{width:'100%',padding:'5px',background:'#4f6ef7',color:'#fff',border:'none',cursor:'pointer',fontSize:11,fontWeight:600}}>Enviar</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ── Pipeline horizontal na lista ─────────────────────────────────────────────
function PipelineList({ sel, setSel, contadores }) {
  const ORDER = ['pendente','em_andamento','resolvido','encerrado']
  const LABELS = {pendente:'Pendente',em_andamento:'Andamento',resolvido:'Resolvido',encerrado:'Encerrado'}
  return (
    <div style={{display:'flex',gap:2,padding:3,borderRadius:9,background:'var(--color-background-secondary)',border:'1px solid var(--color-border-tertiary)'}}>
      {ORDER.map(key=>{
        const S=STATUS_CFG[key]; const on=sel===key; const cnt=contadores[key]||0
        return (
          <button key={key} onClick={()=>setSel(key)}
            style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:3,padding:'4px 4px',borderRadius:6,fontSize:10.5,fontWeight:600,cursor:'pointer',border:'none',background:on?S.bg:'transparent',color:on?S.color:'var(--color-text-tertiary)',transition:'all .12s'}}>
            {LABELS[key]}
            {cnt>0 && <span style={{padding:'0 4px',borderRadius:99,fontSize:9,fontWeight:700,background:on?'rgba(0,0,0,0.15)':'var(--color-background-tertiary)',color:on?S.color:'var(--color-text-tertiary)'}}>{cnt}</span>}
          </button>
        )
      })}
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function PageConversas({ api: apiProp }) {
  const api = apiProp || BASE
  const [convs,     setConvs]     = useState([])
  const [selTel,    setSelTel]    = useState(null)
  const [statusSel, setStatusSel] = useState(()=>sessionStorage.getItem('bia_conv_status')||'pendente')
  const [statusMap, setStatusMap] = useState({})
  const [modoMap,   setModoMap]   = useState({})
  const [busca,     setBusca]     = useState('')
  const [loading,   setLoading]   = useState(true)
  const [nomeIA,    setNomeIA]    = useState('Molise')
  const pollingRef = useRef(null)

  useEffect(()=>{ sessionStorage.setItem('bia_conv_status',statusSel) }, [statusSel])

  // Lê nome do agente da config
  useEffect(()=>{
    fetch(`${api}/api/ia/config`).then(r=>r.ok?r.json():null).then(d=>{
      if (d?.nome_ia) { setNomeIA(d.nome_ia); return }
      if (d?.persona) { const m=(d.persona).match(/[Vv]oc[eê] [eé] (\w+)/); if(m?.[1]) setNomeIA(m[1]) }
    }).catch(()=>{})
  }, [api])

  const getStatus = tel => statusMap[tel] || 'pendente'
  const getModo   = tel => modoMap[tel]   || false

  const carregar = useCallback(async (sil=false) => {
    if (!sil) setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/conversas?aba=todas`)
      if (r.ok) {
        const d=await r.json(); const novas=d.conversas||[]
        setConvs(prev=>{ const map=new Map(prev.map(c=>[c.telefone,c])); return novas.map(c=>({...map.get(c.telefone)||{},...c})) })
        setStatusMap(prev=>{ const n={...prev}; novas.forEach(c=>{ if(c.status_atendimento&&!n[c.telefone]) n[c.telefone]=c.status_atendimento }); return n })
        setModoMap(prev=>{ const n={...prev}; novas.forEach(c=>{ if(c.modo_manual!==undefined&&n[c.telefone]===undefined) n[c.telefone]=c.modo_manual }); return n })
      }
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(()=>{
    carregar()
    pollingRef.current = setInterval(()=>{ if(document.visibilityState!=='hidden') carregar(true) }, 6000)
    return ()=>clearInterval(pollingRef.current)
  }, [carregar])

  const updateStatus = useCallback((tel,st)=>{
    setStatusMap(p=>({...p,[tel]:st}))
    fetch(`${api}/api/dashboard/status/${tel}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:st})}).catch(()=>{})
    fetch(`${api}/api/contatos/${tel}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:st})}).catch(()=>{})
  }, [api])

  const toggleModo = useCallback(tel=>{
    const novo = !getModo(tel)
    setModoMap(p=>({...p,[tel]:novo}))
    fetch(`${api}/api/dashboard/manual/${tel}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ativo:novo})}).catch(()=>{})
  }, [api, modoMap])

  const contadores = useMemo(()=>{
    const c={pendente:0,em_andamento:0,resolvido:0,encerrado:0}
    convs.forEach(cv=>{ const s=getStatus(cv.telefone); if(c[s]!==undefined) c[s]++ }); return c
  }, [convs, statusMap])

  const filtradas = useMemo(()=>convs.filter(c=>{
    if (getStatus(c.telefone)!==statusSel) return false
    if (!busca) return true
    const b=busca.toLowerCase()
    return (c.nome||'').toLowerCase().includes(b)||(c.telefone||'').includes(busca)||(c.ultima_mensagem||c.ultima_msg||'').toLowerCase().includes(b)
  }), [convs, statusSel, busca, statusMap])

  const convSel = convs.find(c=>c.telefone===selTel)||null

  return (
    <div style={{display:'flex',height:'100%',overflow:'hidden',background:'var(--color-background-secondary)'}}>

      {/* ── LISTA ── */}
      <div style={{width:300,flexShrink:0,display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--color-background-primary)',borderRight:'1px solid var(--color-border-tertiary)'}}>
        <div style={{padding:'12px 12px 10px',borderBottom:'1px solid var(--color-border-tertiary)',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <h2 style={{fontSize:15,fontWeight:700,color:'var(--color-text-primary)'}}>Conversas</h2>
            <div style={{display:'flex',gap:5,alignItems:'center'}}>
              {loading && <RefreshCw size={12} className="animate-spin" style={{color:'var(--color-text-tertiary)'}}/>}
              <button onClick={()=>carregar()} style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid var(--color-border-tertiary)',background:'var(--color-background-secondary)',color:'var(--color-text-tertiary)',cursor:'pointer'}}>
                <RefreshCw size={13}/>
              </button>
            </div>
          </div>
          <div style={{marginBottom:8}}>
            <PipelineList sel={statusSel} setSel={setStatusSel} contadores={contadores}/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',borderRadius:9,border:'1px solid var(--color-border-tertiary)',background:'var(--color-background-secondary)'}}>
            <Search size={13} style={{color:'var(--color-text-tertiary)',flexShrink:0}}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..."
              style={{flex:1,border:'none',background:'transparent',outline:'none',fontSize:12,color:'var(--color-text-primary)'}}/>
            {busca&&<button onClick={()=>setBusca('')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--color-text-tertiary)',display:'flex'}}><X size={12}/></button>}
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto'}}>
          {filtradas.length===0 ? (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:160,gap:6}}>
              <MessageSquare size={20} style={{color:'var(--color-text-tertiary)',opacity:.3}}/>
              <p style={{fontSize:12,color:'var(--color-text-tertiary)'}}>{loading?'Carregando...':'Nenhuma conversa'}</p>
            </div>
          ) : filtradas.map(c=>(
            <ConvCard key={c.telefone} conv={c} sel={selTel===c.telefone}
              statusAtend={getStatus(c.telefone)} nomeIA={nomeIA}
              onClick={()=>setSelTel(c.telefone)}/>
          ))}
        </div>
      </div>

      {/* ── CHAT ── */}
      <ChatArea conv={convSel} api={api}
        statusAtend={convSel?getStatus(convSel.telefone):'pendente'}
        onStatusChange={st=>convSel&&updateStatus(convSel.telefone,st)}
        modoManual={convSel?getModo(convSel.telefone):false}
        onToggleModo={()=>convSel&&toggleModo(convSel.telefone)}
        nomeIA={nomeIA}/>

      {/* ── PAINEL DIREITO ── */}
      <PainelContexto conv={convSel} api={api}/>
    </div>
  )
}
