import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, MessageSquare,
  CheckCheck, XCircle, Clock, Zap, Bot, User, Package,
  ShoppingBag, Send, Phone, MapPin, Mail, Tag, Mic,
  Paperclip, Image, FileText
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const STATUS = [
  { id:'pendente',     label:'Pendente',     icon:Clock,         color:'#f59e0b', bg:'rgba(245,158,11,0.15)'  },
  { id:'em_andamento', label:'Em andamento', icon:MessageSquare, color:'#4a9fff', bg:'rgba(74,159,255,0.15)'  },
  { id:'resolvido',    label:'Resolvido',    icon:CheckCheck,    color:'#22c55e', bg:'rgba(34,197,94,0.15)'   },
  { id:'encerrado',    label:'Encerrado',    icon:XCircle,       color:'#94a3b8', bg:'rgba(148,163,184,0.15)' },
  { id:'gatilhos',     label:'Gatilhos',     icon:Zap,           color:'#a78bfa', bg:'rgba(167,139,250,0.15)' },
]

// ── Avatar ────────────────────────────────────────────────────────────────────
function avatarCor(tel='') {
  const cores=['#00d4aa','#4a9fff','#a78bfa','#f59e0b','#22d3ee','#f472b6','#34d399']
  let h=0; for(const c of tel) h=(h*31+c.charCodeAt(0))%cores.length; return cores[h]
}
function Av({ nome, telefone, size=36 }) {
  const cor = avatarCor(telefone)
  return <div style={{ width:size,height:size,borderRadius:'50%',flexShrink:0,background:`${cor}25`,color:cor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.33,fontWeight:700,border:`1.5px solid ${cor}40` }}>{(nome||telefone||'??').slice(0,2).toUpperCase()}</div>
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ sel, setSel, counts, open, setOpen }) {
  return (
    <div style={{ width:open?192:56, flexShrink:0, transition:'width 0.2s', background:'var(--bg-2)', borderRight:'1px solid var(--sep)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <button onClick={()=>setOpen(v=>!v)} style={{ height:44, display:'flex', alignItems:'center', justifyContent:open?'flex-end':'center', paddingRight:open?14:0, border:'none', background:'transparent', cursor:'pointer', borderBottom:'1px solid var(--sep)', color:'var(--label-3)', flexShrink:0 }}>
        {open?<ChevronLeft size={15}/>:<ChevronRight size={15}/>}
      </button>
      <div style={{ flex:1, paddingTop:4 }}>
        {STATUS.map(s => {
          const on = sel===s.id
          const n  = counts[s.id]||0
          return (
            <button key={s.id} onClick={()=>setSel(s.id)} style={{ width:'100%', height:44, display:'flex', alignItems:'center', gap:10, padding:open?'0 14px':'0', justifyContent:open?'flex-start':'center', border:'none', background:on?s.bg:'transparent', borderLeft:on?`3px solid ${s.color}`:'3px solid transparent', cursor:'pointer', transition:'all .15s' }}>
              <s.icon size={16} style={{ color:on?s.color:'#64748b', flexShrink:0 }}/>
              {open && <>
                <span style={{ fontSize:13, fontWeight:on?600:400, color:on?s.color:'#64748b', flex:1, textAlign:'left', whiteSpace:'nowrap' }}>{s.label}</span>
                {n>0 && <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:10, background:on?`${s.color}30`:'rgba(100,116,139,0.12)', color:on?s.color:'#64748b' }}>{n>99?'99+':n}</span>}
              </>}
            </button>
          )
        })}
      </div>
      {!open && (
        <div style={{ writingMode:'vertical-lr', transform:'rotate(180deg)', fontSize:9, color:'#64748b', textAlign:'center', padding:'10px 0', letterSpacing:'0.07em' }}>
          {STATUS.find(s=>s.id===sel)?.label}
        </div>
      )}
    </div>
  )
}

// ── Bolha ─────────────────────────────────────────────────────────────────────
const REACOES = ['👍','❤️','😂','😮','😢','🙏']

function Bolha({ msg }) {
  const [reacao,  setReacao]  = useState(null)
  const [showPick,setShowPick]= useState(false)

  const entrada   = msg.direcao==='entrada'
  const isGatilho = msg.modo==='transacional'
  const isManual  = msg.modo==='manual'
  const texto     = (msg.conteudo||'').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g,'').trim()

  const bg     = entrada ? (document.documentElement.style.getPropertyValue('--bg-2')||'#f1f5f9')
                          : isGatilho ? '#2d1f4a' : isManual ? '#1a2f4a' : '#0f2d2a'
  const border = entrada ? '1px solid #e2e8f0'
                          : isGatilho ? '1px solid #7c3aed40' : isManual ? '1px solid #2563eb40' : '1px solid #059669_40'
  const rLabel = entrada ? null : isGatilho ? '⚡ Gatilho' : isManual ? '👤 Atendente' : '🤖 Molise'
  const rColor = isGatilho ? '#a78bfa' : isManual ? '#60a5fa' : '#34d399'

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:entrada?'flex-start':'flex-end', marginBottom:8 }}>
      {rLabel && <span style={{ fontSize:9, fontWeight:700, color:rColor, marginBottom:2, marginRight:2, letterSpacing:'0.05em' }}>{rLabel}</span>}
      <div style={{ display:'flex', alignItems:'flex-end', gap:6, flexDirection:entrada?'row':'row-reverse', maxWidth:'78%' }}>
        {/* Avatar remetente */}
        {entrada
          ? <Av nome={null} telefone={msg.telefone} size={26}/>
          : <div style={{ width:26,height:26,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:isGatilho?'#2d1f4a':isManual?'#1a2f4a':'#0f2d2a' }}>
              {isGatilho?<Zap size={12} color="#a78bfa"/>:isManual?<User size={12} color="#60a5fa"/>:<Bot size={12} color="#34d399"/>}
            </div>
        }
        <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:entrada?'flex-start':'flex-end' }}>
          {/* Bolha */}
          <div style={{ background:bg, border, borderRadius:entrada?'4px 14px 14px 14px':'14px 4px 14px 14px', padding:'8px 12px', wordBreak:'break-word', whiteSpace:'pre-wrap', fontSize:13, lineHeight:1.55, color:entrada?'#1e293b':'#e2e8f0', maxWidth:'100%' }}>
            {texto}
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:3, gap:6 }}>
              <span style={{ fontSize:10, color:entrada?'#94a3b8':'#64748b' }}>
                {new Date(msg.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
              </span>
            </div>
          </div>

          {/* Reação selecionada */}
          {reacao && (
            <span onClick={()=>setReacao(null)} style={{ fontSize:13, cursor:'pointer', marginTop:2, padding:'1px 4px', background:'rgba(0,0,0,0.06)', borderRadius:8, border:'1px solid rgba(0,0,0,0.1)' }}>
              {reacao}
            </span>
          )}

          {/* Botão de reação — só aparece no hover da bolha */}
          <button
            onClick={()=>setShowPick(v=>!v)}
            style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', [entrada?'right':'left']:'-28px', width:22,height:22, borderRadius:'50%', border:'1px solid var(--sep)', background:'var(--bg-2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, opacity:0, transition:'opacity .15s' }}
            onMouseEnter={e=>e.currentTarget.style.opacity='1'}
            onMouseLeave={e=>{ if(!showPick) e.currentTarget.style.opacity='0' }}
            className="bolha-react-btn"
          >
            😊
          </button>

          {/* Picker */}
          {showPick && (
            <div style={{ position:'absolute', [entrada?'left':'right']:0, bottom:'calc(100% + 4px)', display:'flex', gap:3, background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:16, padding:'5px 8px', boxShadow:'0 4px 16px rgba(0,0,0,0.15)', zIndex:20 }}>
              {REACOES.map(r=>(
                <button key={r} onClick={()=>{setReacao(r);setShowPick(false)}}
                  style={{ fontSize:16, background:'transparent', border:'none', cursor:'pointer', padding:'2px 3px', borderRadius:6, transition:'transform .12s' }}
                  onMouseEnter={e=>e.target.style.transform='scale(1.35)'}
                  onMouseLeave={e=>e.target.style.transform='scale(1)'}
                >{r}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DateSep({ data }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, margin:'14px 0' }}>
      <div style={{ flex:1, height:1, background:'var(--sep)' }}/>
      <span style={{ fontSize:10, color:'#64748b', fontWeight:600, background:'var(--bg-2)', padding:'2px 10px', borderRadius:10, border:'1px solid var(--sep)' }}>
        {new Date(data).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}
      </span>
      <div style={{ flex:1, height:1, background:'var(--sep)' }}/>
    </div>
  )
}

// ── Painel lateral ────────────────────────────────────────────────────────────
function PainelInfo({ conv, api }) {
  const [aba,    setAba]    = useState('perfil')
  const [perfil, setPerfil] = useState(null)
  const [pedidos,setPedidos]= useState([])
  const [prods,  setProds]  = useState([])
  const [busca,  setBusca]  = useState('')
  const [load,   setLoad]   = useState(false)

  useEffect(()=>{
    if (!conv?.telefone) return
    fetch(`${api}/api/contatos/${conv.telefone}`).then(r=>r.ok?r.json():null).then(d=>d&&setPerfil(d)).catch(()=>{})
    fetch(`${api}/api/contatos/${conv.telefone}/pedidos`).then(r=>r.ok?r.json():null).then(d=>d?.pedidos&&setPedidos(d.pedidos)).catch(()=>{})
  },[conv?.telefone])

  const buscarProd = async() => {
    if(!busca.trim()) return
    setLoad(true); setProds([])
    try {
      const r = await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(busca)}`)
      if(r.ok){ const d=await r.json(); setProds(d.produtos||[]) }
    } catch{}
    setLoad(false)
  }

  const ABAS=[{id:'perfil',label:'Perfil',icon:User},{id:'pedidos',label:'Pedidos',icon:Package},{id:'catalogo',label:'Catálogo',icon:ShoppingBag}]

  return (
    <div style={{ width:256,flexShrink:0,borderLeft:'1px solid var(--sep)',display:'flex',flexDirection:'column',overflow:'hidden' }}>
      <div style={{ padding:'10px 14px',borderBottom:'1px solid var(--sep)',display:'flex',gap:8,alignItems:'center',flexShrink:0 }}>
        <Av nome={conv.nome} telefone={conv.telefone} size={30}/>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:12,fontWeight:600,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{conv.nome||conv.telefone}</div>
          <div style={{ fontSize:10,color:'#64748b' }}>{conv.telefone}</div>
        </div>
      </div>
      <div style={{ display:'flex',borderBottom:'1px solid var(--sep)',flexShrink:0 }}>
        {ABAS.map(a=>(
          <button key={a.id} onClick={()=>setAba(a.id)} style={{ flex:1,padding:'8px 0',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:aba===a.id?'rgba(0,212,170,0.06)':'transparent',borderBottom:aba===a.id?'2px solid #00d4aa':'2px solid transparent' }}>
            <a.icon size={12} style={{color:aba===a.id?'#00d4aa':'#64748b'}}/>
            <span style={{ fontSize:9,fontWeight:600,color:aba===a.id?'#00d4aa':'#64748b' }}>{a.label}</span>
          </button>
        ))}
      </div>
      <div style={{ flex:1,overflow:'auto',padding:'12px 14px' }}>
        {aba==='perfil' && (
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {perfil?[
              {icon:User,  label:'Nome',     v:perfil.nome},
              {icon:Phone, label:'Telefone', v:perfil.telefone||conv.telefone},
              {icon:Mail,  label:'E-mail',   v:perfil.email},
              {icon:MapPin,label:'Cidade',   v:perfil.cidade},
              {icon:Tag,   label:'Doc',      v:perfil.cpf||perfil.cnpj},
            ].filter(i=>i.v).map((item,i)=>(
              <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                <item.icon size={11} style={{color:'#64748b',marginTop:2,flexShrink:0}}/>
                <div><div style={{fontSize:9,color:'#64748b'}}>{item.label}</div><div style={{fontSize:12,color:'var(--label)',fontWeight:500}}>{item.v}</div></div>
              </div>
            )):<div style={{fontSize:12,color:'#64748b',textAlign:'center',padding:16}}>Sem cadastro</div>}
          </div>
        )}
        {aba==='pedidos' && (
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {pedidos.length===0?<div style={{fontSize:12,color:'#64748b',textAlign:'center',padding:16}}>Nenhum pedido</div>
            :pedidos.map((p,i)=>(
              <div key={i} style={{background:'var(--bg)',borderRadius:8,padding:'8px 10px',border:'1px solid var(--sep)'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}><span style={{fontSize:12,fontWeight:600,color:'var(--label)'}}>#{p.numero||p.id}</span><span style={{fontSize:9,color:'#64748b'}}>{p.data}</span></div>
                <div style={{fontSize:10,color:'#64748b',marginBottom:3}}>{p.situacao||p.status}</div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:12,fontWeight:700,color:'#00d4aa'}}>{p.total}</span>
                  {p.rastreio&&p.rastreio!=='—'&&<span style={{fontSize:9,color:'#4a9fff'}}>📦 {p.rastreio}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        {aba==='catalogo' && (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',gap:5}}>
              <input value={busca} onChange={e=>setBusca(e.target.value)} onKeyDown={e=>e.key==='Enter'&&buscarProd()}
                placeholder="Ex: strass ss4.5..." style={{flex:1,padding:'6px 10px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--bg)',outline:'none',fontSize:12,color:'var(--label)'}}/>
              <button onClick={buscarProd} style={{padding:'6px 12px',borderRadius:8,border:'none',background:'#00d4aa',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:700}}>{load?'…':'↵'}</button>
            </div>
            {load && <div style={{fontSize:11,color:'#64748b',textAlign:'center'}}>Buscando...</div>}
            {!load && prods.length===0 && busca && <div style={{fontSize:11,color:'#64748b',textAlign:'center'}}>Nenhum produto encontrado</div>}
            {!load && prods.length===0 && !busca && <div style={{fontSize:11,color:'#64748b',textAlign:'center',padding:'8px 0'}}>Digite e pressione Enter</div>}
            {prods.map((p,i)=>(
              <div key={i} style={{background:'var(--bg)',borderRadius:8,padding:'8px 10px',border:'1px solid var(--sep)'}}>
                <div style={{fontSize:11,fontWeight:500,color:'var(--label)',marginBottom:2,lineHeight:1.3}}>{p.nome}</div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:12,fontWeight:700,color:'#00d4aa'}}>R$ {parseFloat(p.preco||0).toFixed(2)}</span>
                  <span style={{fontSize:9,fontWeight:600,color:p.disponivel?'#22c55e':'#94a3b8'}}>{p.disponivel?'✓ Disponível':'Indisponível'}</span>
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
function Chat({ telefone, convData, api, status, onStatus, manual, onToggle, onStatusLoaded }) {
  const [msgs,   setMsgs]   = useState([])
  const [loading,setLoading]= useState(true)
  const [hasMore,setHasMore]= useState(false)
  const [offset, setOffset] = useState(0)
  const [texto,  setTexto]  = useState('')
  const [sending,setSending]= useState(false)
  const [sugest, setSugest] = useState([])
  const bottomRef = useRef(null)
  const prevLen   = useRef(0)
  const fetching  = useRef(false)

  const load = useCallback(async(off=0,sil=false)=>{
    if(!telefone||fetching.current) return
    fetching.current=true
    if(!sil) setLoading(true)
    try{
      const r=await fetch(`${api}/api/dashboard/historico/${telefone}?limit=60&offset=${off}`)
      if(r.ok){
        const d=await r.json()
        const ms=d.mensagens||[]
        if(off===0) setMsgs(ms)
        else setMsgs(p=>[...ms,...p])
        setHasMore(d.hasMore||false)
        setOffset(off===0?ms.length:off+ms.length)
      }
    }catch{}
    if(!sil) setLoading(false)
    fetching.current=false
  },[telefone,api])

  useEffect(()=>{ setMsgs([]); setOffset(0); prevLen.current=0; load(0) },[telefone])
  useEffect(()=>{ const i=setInterval(()=>document.visibilityState==='visible'&&load(0,true),8000); return()=>clearInterval(i) },[load])
  useEffect(()=>{
    if(msgs.length>prevLen.current) bottomRef.current?.scrollIntoView({behavior:prevLen.current===0?'instant':'smooth'})
    prevLen.current=msgs.length
  },[msgs])

  const enviar = async() => {
    if(!texto.trim()||sending) return
    const msg=texto.trim(); setTexto(''); setSending(true)
    try{
      await fetch(`${api}/api/dashboard/mensagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone,mensagem:msg})})
      await load(0,true)
    }catch{}
    setSending(false)
  }

  const stCfg = STATUS.find(s=>s.id===status)||STATUS[0]

  const grupos = useMemo(()=>{
    const g=[]; let da=null
    for(const m of msgs){
      const d=new Date(m.criado_em).toDateString()
      if(d!==da){g.push({t:'sep',data:m.criado_em});da=d}
      g.push({t:'msg',msg:{...m,telefone}})
    }
    return g
  },[msgs])

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
      {/* Header */}
      <div style={{padding:'10px 14px',borderBottom:'1px solid var(--sep)',background:'var(--bg-2)',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <Av nome={convData?.nome} telefone={telefone} size={34}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--label)'}}>{convData?.nome||telefone}</div>
          <div style={{fontSize:10,color:'#64748b'}}>{convData?.total_msgs||0} msgs · {convData?.hora||''}</div>
        </div>

        {/* Botão assumir */}
        <button onClick={onToggle} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,border:manual?'1px solid #3b82f640':'1px solid var(--sep)',background:manual?'rgba(59,130,246,0.12)':'var(--fill)',color:manual?'#60a5fa':'#64748b',cursor:'pointer',fontSize:11,fontWeight:600,flexShrink:0,transition:'all .15s'}}>
          {manual?<><Bot size={12}/> Devolver à IA</>:<><User size={12}/> Assumir</>}
        </button>

        {/* Status */}
        <div style={{display:'flex',gap:3}}>
          {STATUS.filter(s=>s.id!=='gatilhos').map(s=>(
            <button key={s.id} onClick={()=>onStatus(s.id)} title={s.label} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1,padding:'5px 8px',borderRadius:8,border:'none',cursor:'pointer',background:status===s.id?s.bg:'transparent',color:status===s.id?s.color:'#64748b',outline:status===s.id?`1.5px solid ${s.color}60`:'none',minWidth:46,transition:'all .15s'}}>
              <s.icon size={14}/>
              <span style={{fontSize:9,fontWeight:600,whiteSpace:'nowrap'}}>{s.label}</span>
            </button>
          ))}
        </div>

        <button onClick={()=>load(0)} style={{padding:5,border:'none',background:'transparent',cursor:'pointer',color:'#64748b'}}>
          <RefreshCw size={11}/>
        </button>
      </div>

      {/* Mensagens */}
      <div style={{flex:1,overflow:'auto',padding:'12px 16px'}}>
        {hasMore&&<div style={{textAlign:'center',paddingBottom:8}}>
          <button onClick={()=>load(offset)} style={{fontSize:11,color:'#00d4aa',background:'transparent',border:'1px solid var(--sep)',borderRadius:6,padding:'3px 10px',cursor:'pointer'}}>Carregar anteriores</button>
        </div>}
        {loading&&msgs.length===0?<div style={{textAlign:'center',padding:32,color:'#64748b',fontSize:12}}>Carregando...</div>
        :grupos.length===0?<div style={{textAlign:'center',padding:32,color:'#64748b',fontSize:12}}>Sem mensagens</div>
        :grupos.map((g,i)=>g.t==='sep'?<DateSep key={`s${i}`} data={g.data}/>:<Bolha key={g.msg.id||i} msg={g.msg}/>)}
        <div ref={bottomRef}/>
      </div>

      {/* Barra inferior */}
      <div style={{borderTop:'1px solid var(--sep)',background:'var(--bg-2)',flexShrink:0}}>
        {manual?(
          <div style={{padding:'8px 12px',display:'flex',flexDirection:'column',gap:6}}>
            {/* Sugestões IA */}
            {sugest.length>0&&(
              <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:2}}>
                {sugest.map((s,i)=><button key={i} onClick={()=>setTexto(s)} style={{fontSize:11,padding:'3px 10px',borderRadius:12,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>{s}</button>)}
              </div>
            )}
            <div style={{display:'flex',gap:6,alignItems:'flex-end'}}>
              {/* Ações extras */}
              <div style={{display:'flex',gap:3}}>
                {[{icon:Image,title:'Imagem'},{icon:Paperclip,title:'Arquivo'},{icon:Mic,title:'Áudio'}].map(({icon:Icon,title})=>(
                  <button key={title} title={title} style={{width:32,height:32,borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#64748b'}}>
                    <Icon size={14}/>
                  </button>
                ))}
              </div>
              {/* Campo de texto */}
              <div style={{flex:1,background:'var(--bg)',borderRadius:10,padding:'8px 12px',border:'1px solid var(--sep)'}}>
                <textarea value={texto} onChange={e=>setTexto(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar()}}}
                  placeholder="Digite uma mensagem... (Enter envia · Shift+Enter quebra linha)"
                  rows={1} style={{width:'100%',border:'none',background:'transparent',outline:'none',fontSize:13,color:'var(--label)',resize:'none',lineHeight:1.5,maxHeight:100,overflow:'auto'}}/>
              </div>
              <button onClick={enviar} disabled={sending||!texto.trim()} style={{width:36,height:36,borderRadius:10,border:'none',flexShrink:0,background:texto.trim()&&!sending?'#00d4aa':'var(--fill)',color:texto.trim()&&!sending?'#fff':'#64748b',cursor:texto.trim()?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>
                {sending?<RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/>:<Send size={14}/>}
              </button>
            </div>
          </div>
        ):(
          <div style={{padding:'10px 16px',textAlign:'center',fontSize:12,color:'#64748b'}}>
            🤖 IA respondendo automaticamente · <button onClick={onToggle} style={{fontSize:12,color:'#00d4aa',background:'transparent',border:'none',cursor:'pointer',fontWeight:600}}>Assumir conversa</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Principal ─────────────────────────────────────────────────────────────────
export default function PageConversas({ api: apiProp }) {
  const api = apiProp||BASE

  const [convs,  setConvs]  = useState([])
  const [selTel, setSelTel] = useState(null)
  const [stSel,  setStSel]  = useState(()=>sessionStorage.getItem('pconv_st')||'pendente')
  const [stMap,  setStMap]  = useState({})   // tel → status (carregado do banco)
  const [mMap,   setMMap]   = useState({})   // tel → manual
  const [busca,  setBusca]  = useState('')
  const [loading,setLoading]= useState(true)
  const [sideOpen,setSideOpen]=useState(()=>sessionStorage.getItem('pconv_side')==='true')

  useEffect(()=>sessionStorage.setItem('pconv_st',stSel),[stSel])
  useEffect(()=>sessionStorage.setItem('pconv_side',sideOpen),[sideOpen])

  // Carrega status salvos no banco ao montar
  useEffect(()=>{
    fetch(`${api}/api/dashboard/status-map`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(d?.map) setStMap(d.map) })
      .catch(()=>{})
  },[api])

  const getStatus = (tel) => stMap[tel]||'pendente'
  const getModo   = (tel) => mMap[tel]||false

  const carregar = useCallback(async(sil=false)=>{
    if(!sil) setLoading(true)
    try{
      const r=await fetch(`${api}/api/dashboard/conversas?aba=todas`)
      if(r.ok){ const d=await r.json(); setConvs(prev=>{ const m=new Map(prev.map(c=>[c.telefone,c])); return (d.conversas||[]).map(c=>({...m.get(c.telefone),...c})) }) }
    }catch{}
    if(!sil) setLoading(false)
  },[api])

  useEffect(()=>{ carregar(); const i=setInterval(()=>document.visibilityState==='visible'&&carregar(true),15000); return()=>clearInterval(i) },[carregar])

  const setStatus = useCallback((tel,st)=>{
    setStMap(prev=>({...prev,[tel]:st}))
    // Salva no banco
    fetch(`${api}/api/dashboard/status/${tel}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:st})}).catch(()=>{})
  },[api])

  const toggleModo = useCallback((tel)=>setMMap(prev=>({...prev,[tel]:!prev[tel]})),[])

  const counts = useMemo(()=>{
    const c={}; STATUS.forEach(s=>{ c[s.id]=s.id==='gatilhos'?convs.filter(cv=>cv.modo==='transacional').length:convs.filter(cv=>getStatus(cv.telefone)===s.id).length }); return c
  },[convs,stMap])

  const filtradas = useMemo(()=>convs
    .filter(c=>stSel==='gatilhos'?c.modo==='transacional':getStatus(c.telefone)===stSel)
    .filter(c=>!busca||(c.nome||'').toLowerCase().includes(busca.toLowerCase())||c.telefone.includes(busca)||(c.ultima_msg||'').toLowerCase().includes(busca.toLowerCase()))
  ,[convs,stSel,stMap,busca])

  const selConv = convs.find(c=>c.telefone===selTel)
  const stCfg   = STATUS.find(s=>s.id===stSel)||STATUS[0]

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar sel={stSel} setSel={setStSel} counts={counts} open={sideOpen} setOpen={setSideOpen}/>

      {/* Lista */}
      <div style={{width:268,flexShrink:0,display:'flex',flexDirection:'column',borderRight:'1px solid var(--sep)'}}>
        <div style={{padding:'9px 12px',borderBottom:'1px solid var(--sep)',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <stCfg.icon size={13} style={{color:stCfg.color}}/>
              <span style={{fontSize:13,fontWeight:600,color:'var(--label)'}}>{stCfg.label}</span>
              <span style={{fontSize:10,color:'#64748b',background:'var(--fill)',padding:'1px 6px',borderRadius:8}}>{filtradas.length}</span>
            </div>
            <button onClick={()=>carregar()} style={{padding:3,border:'none',background:'transparent',cursor:'pointer',color:'#64748b'}}><RefreshCw size={11}/></button>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,background:'var(--fill)',borderRadius:8,padding:'5px 9px'}}>
            <Search size={11} style={{color:'#64748b',flexShrink:0}}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." style={{flex:1,border:'none',background:'transparent',outline:'none',fontSize:12,color:'var(--label)'}}/>
          </div>
        </div>

        <div style={{flex:1,overflow:'auto'}}>
          {loading?Array.from({length:5}).map((_,i)=>(
            <div key={i} style={{padding:'9px 12px',borderBottom:'1px solid var(--sep)'}}>
              <div style={{height:9,width:'55%',borderRadius:4,background:'var(--sep)',marginBottom:4}}/>
              <div style={{height:7,width:'75%',borderRadius:4,background:'var(--sep)'}}/>
            </div>
          )):filtradas.length===0?<div style={{padding:20,textAlign:'center',fontSize:12,color:'#64748b'}}>{stSel==='gatilhos'?'Nenhum gatilho':'Nenhuma conversa'}</div>
          :filtradas.map(c=>{
            const ativo=selTel===c.telefone
            const st=STATUS.find(s=>s.id===getStatus(c.telefone))||STATUS[0]
            return(
              <div key={c.telefone} onClick={()=>setSelTel(c.telefone)}
                style={{display:'flex',gap:9,padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid var(--sep)',borderLeft:ativo?'2px solid #00d4aa':'2px solid transparent',background:ativo?'rgba(0,212,170,0.05)':'transparent',transition:'background .1s'}}
                onMouseEnter={e=>{if(!ativo)e.currentTarget.style.background='var(--fill)'}}
                onMouseLeave={e=>{if(!ativo)e.currentTarget.style.background='transparent'}}
              >
                <Av nome={c.nome} telefone={c.telefone} size={34}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                    <span style={{fontSize:12,fontWeight:600,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:130}}>{c.nome||c.telefone}</span>
                    <span style={{fontSize:9,color:'#64748b',flexShrink:0}}>{c.hora}</span>
                  </div>
                  <div style={{fontSize:10.5,color:'#64748b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3}}>
                    {c.ultima_direcao==='saida'?'↩ ':''}{c.ultima_msg||'—'}
                  </div>
                  <div style={{display:'flex',gap:3}}>
                    {c.agente&&<span style={{fontSize:8,fontWeight:700,padding:'1px 4px',borderRadius:3,background:'rgba(0,212,170,0.12)',color:'#00d4aa'}}>IA</span>}
                    <span style={{fontSize:8,fontWeight:600,padding:'1px 4px',borderRadius:3,background:st.bg,color:st.color}}>{st.label}</span>
                    <span style={{fontSize:8,color:'#64748b',marginLeft:'auto'}}>{c.total_msgs}m</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat + Painel */}
      {selTel?(
        <>
          <Chat
            key={selTel}
            telefone={selTel}
            convData={selConv}
            api={api}
            status={getStatus(selTel)}
            onStatus={(st)=>setStatus(selTel,st)}
            manual={getModo(selTel)}
            onToggle={()=>toggleModo(selTel)}
          />
          {selConv&&<PainelInfo conv={selConv} api={api}/>}
        </>
      ):(
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,color:'#64748b'}}>
          <MessageSquare size={36} style={{opacity:.2}}/>
          <div style={{fontSize:13,fontWeight:500,color:'var(--label)'}}>Selecione uma conversa</div>
          <div style={{fontSize:11}}>{filtradas.length} em {stCfg.label.toLowerCase()}</div>
        </div>
      )}
    </div>
  )
}
