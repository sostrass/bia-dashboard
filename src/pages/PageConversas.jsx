import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, MessageSquare,
  CheckCheck, XCircle, Clock, Zap, Bot, User, Package,
  ShoppingBag, Send, Phone, MapPin, Mail, Tag, TrendingUp,
  Mic, Paperclip, Image, Lightbulb, Smile, X, Plus, ExternalLink
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Status ────────────────────────────────────────────────────────────────────
const STATUS = [
  { id:'pendente',    label:'Pendente',     icon:Clock,         color:'#f59e0b', bg:'rgba(245,158,11,0.12)'  },
  { id:'em_andamento',label:'Em andamento', icon:MessageSquare, color:'#4a9fff', bg:'rgba(74,159,255,0.12)'  },
  { id:'resolvido',   label:'Resolvido',    icon:CheckCheck,    color:'#00d4aa', bg:'rgba(0,212,170,0.12)'   },
  { id:'encerrado',   label:'Encerrado',    icon:XCircle,       color:'#94a3b8', bg:'rgba(148,163,184,0.12)' },
  { id:'gatilhos',    label:'Gatilhos',     icon:Zap,           color:'#a78bfa', bg:'rgba(167,139,250,0.12)' },
]

const REACOES = ['👍','❤️','😂','😮','😢','🙏']

// ── Tema — variáveis CSS seguras para fundo claro e escuro ────────────────────
const V = {
  bg:      'var(--bg, #ffffff)',
  bg2:     'var(--bg-2, #f8f9fa)',
  bg3:     'var(--bg-3, #f0f2f5)',
  label:   'var(--label, #111827)',
  label2:  'var(--label-2, #374151)',
  label3:  'var(--label-3, #6b7280)',
  label4:  'var(--label-4, #9ca3af)',
  sep:     'var(--sep, #e5e7eb)',
  fill:    'var(--fill, #f3f4f6)',
  accent:  'var(--accent, #059669)',
}

const avatarCor = (tel='') => {
  const cores = ['#059669','#3b82f6','#8b5cf6','#f59e0b','#06b6d4','#ec4899','#10b981']
  let h=0; for (const c of tel) h=(h*31+c.charCodeAt(0))%cores.length
  return cores[h]
}

function Avatar({ nome, telefone, size=36 }) {
  const cor = avatarCor(telefone)
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:`${cor}18`, color:cor,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:Math.round(size*0.34), fontWeight:700, letterSpacing:'-0.5px',
      border:`1.5px solid ${cor}30`,
    }}>
      {(nome||telefone||'??').replace(/[^a-záéíóúA-ZÁÉÍÓÚ\s]/g,'').trim().slice(0,2).toUpperCase()||'??'}
    </div>
  )
}

// ── Bolha de mensagem ─────────────────────────────────────────────────────────
function Bolha({ msg }) {
  const [hover,   setHover]   = useState(false)
  const [reacao,  setReacao]  = useState(null)
  const [picker,  setPicker]  = useState(false)

  const entrada   = msg.direcao === 'entrada'
  const isGatilho = msg.modo === 'transacional'
  const isManual  = msg.modo === 'manual'
  const texto     = (msg.conteudo||'').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g,'').trim()

  // Cores com bom contraste
  const bgMsg    = entrada ? V.bg3
    : isGatilho ? '#f5f0ff'
    : isManual  ? '#eff6ff'
    : '#ecfdf5'

  const bordMsg  = entrada ? V.sep
    : isGatilho ? '#c4b5fd'
    : isManual  ? '#93c5fd'
    : '#6ee7b7'

  const labelRem = entrada ? null
    : isGatilho ? '⚡ Gatilho'
    : isManual  ? '👤 Atendente'
    : '🤖 Molise'

  const corLabel = isGatilho ? '#7c3aed' : isManual ? '#2563eb' : '#059669'

  return (
    <div
      style={{ display:'flex', flexDirection:'column', alignItems:entrada?'flex-start':'flex-end', marginBottom:8, position:'relative' }}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>{ setHover(false); setPicker(false) }}
    >
      {labelRem && (
        <span style={{ fontSize:9, fontWeight:700, color:corLabel, marginBottom:2, marginRight:4 }}>
          {labelRem}
        </span>
      )}
      <div style={{ display:'flex', alignItems:'flex-end', gap:6, flexDirection:entrada?'row':'row-reverse' }}>
        {entrada
          ? <Avatar nome={null} telefone={msg.telefone||''} size={22}/>
          : <div style={{ width:22, height:22, borderRadius:'50%', background:`${corLabel}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {isGatilho?<Zap size={10} color={corLabel}/>:isManual?<User size={10} color={corLabel}/>:<Bot size={10} color={corLabel}/>}
            </div>
        }

        <div style={{
          maxWidth:'70%', background:bgMsg,
          border:`1px solid ${bordMsg}`,
          borderRadius:entrada?'2px 12px 12px 12px':'12px 2px 12px 12px',
          padding:'8px 12px', position:'relative',
        }}>
          {texto && (
            <div style={{ fontSize:13, color:V.label, lineHeight:1.55, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
              {texto}
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:4, marginTop:3 }}>
            <span style={{ fontSize:9, color:V.label4 }}>
              {new Date(msg.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
            </span>
          </div>
          {reacao && (
            <div onClick={()=>setReacao(null)} style={{ position:'absolute', bottom:-10, right:6, background:V.bg, border:`1px solid ${V.sep}`, borderRadius:10, padding:'1px 5px', fontSize:12, cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
              {reacao}
            </div>
          )}
        </div>

        {/* Botão de reação no hover */}
        {hover && (
          <div style={{ position:'relative' }}>
            <button
              onClick={()=>setPicker(v=>!v)}
              style={{ width:22, height:22, borderRadius:'50%', border:`1px solid ${V.sep}`, background:V.bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:V.label4 }}
            >😊</button>
            {picker && (
              <div style={{
                position:'absolute', bottom:28, [entrada?'left':'right']:0,
                display:'flex', gap:3, background:V.bg, border:`1px solid ${V.sep}`,
                borderRadius:16, padding:'5px 8px', boxShadow:'0 4px 12px rgba(0,0,0,0.12)',
                zIndex:50, whiteSpace:'nowrap',
              }}>
                {REACOES.map(r=>(
                  <button key={r} onClick={()=>{ setReacao(r); setPicker(false) }}
                    style={{ fontSize:16, background:'transparent', border:'none', cursor:'pointer', padding:2, borderRadius:4, transition:'transform 0.1s' }}
                    onMouseEnter={e=>e.target.style.transform='scale(1.25)'}
                    onMouseLeave={e=>e.target.style.transform='scale(1)'}
                  >{r}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function DateSep({ data }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, margin:'14px 0' }}>
      <div style={{ flex:1, height:1, background:V.sep }}/>
      <span style={{ fontSize:10, color:V.label4, fontWeight:600, background:V.bg2, padding:'2px 10px', borderRadius:10, border:`1px solid ${V.sep}` }}>
        {new Date(data).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'short'})}
      </span>
      <div style={{ flex:1, height:1, background:V.sep }}/>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ statusSel, setStatusSel, contadores, expandida, setExpandida }) {
  const allStatus = [...STATUS]
  return (
    <div style={{ width:expandida?192:52, flexShrink:0, transition:'width 0.2s', borderRight:`1px solid ${V.sep}`, background:V.bg2, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <button onClick={()=>setExpandida(v=>!v)} style={{ padding:'11px 0', display:'flex', alignItems:'center', justifyContent:expandida?'flex-end':'center', paddingRight:expandida?12:0, border:'none', background:'transparent', cursor:'pointer', borderBottom:`1px solid ${V.sep}`, flexShrink:0, color:V.label4 }}>
        {expandida?<ChevronLeft size={13}/>:<ChevronRight size={13}/>}
      </button>
      <div style={{ flex:1, padding:'6px 0', overflowY:'auto' }}>
        {allStatus.map((s,i) => {
          const ativo = statusSel===s.id
          const cnt   = contadores[s.id]||0
          const isGap = i===4 // separador antes de gatilhos
          return (
            <div key={s.id}>
              {isGap && <div style={{ height:1, background:V.sep, margin:'4px 8px' }}/>}
              <button title={s.label} onClick={()=>setStatusSel(s.id)} style={{
                width:'100%', padding:expandida?'9px 14px':'9px 0',
                border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', gap:expandida?10:0,
                justifyContent:expandida?'flex-start':'center',
                background:ativo?s.bg:'transparent',
                borderLeft:ativo?`3px solid ${s.color}`:'3px solid transparent',
                transition:'all 0.12s',
              }}>
                <s.icon size={15} style={{ color:ativo?s.color:V.label4, flexShrink:0 }}/>
                {expandida && <>
                  <span style={{ fontSize:12.5, fontWeight:ativo?600:400, color:ativo?s.color:V.label2, flex:1, textAlign:'left', whiteSpace:'nowrap' }}>{s.label}</span>
                  {cnt>0 && <span style={{ fontSize:10, fontWeight:700, minWidth:18, textAlign:'center', padding:'1px 5px', borderRadius:9, background:ativo?`${s.color}22`:V.fill, color:ativo?s.color:V.label4 }}>{cnt>99?'99+':cnt}</span>}
                </>}
                {!expandida && cnt>0 && <div style={{ position:'absolute', top:6, right:6, width:6, height:6, borderRadius:'50%', background:s.color }}/>}
              </button>
            </div>
          )
        })}
      </div>
      {!expandida && (
        <div style={{ writingMode:'vertical-lr', transform:'rotate(180deg)', fontSize:9, color:V.label4, textAlign:'center', padding:'8px 0', letterSpacing:'0.05em' }}>
          {STATUS.find(s=>s.id===statusSel)?.label}
        </div>
      )}
    </div>
  )
}

// ── Painel info lateral ───────────────────────────────────────────────────────
function PainelInfo({ conv, api, onEnviarProduto }) {
  const [aba,      setAba]      = useState('perfil')
  const [perfil,   setPerfil]   = useState(null)
  const [pedidos,  setPedidos]  = useState([])
  const [produtos, setProdutos] = useState([])
  const [busca,    setBusca]    = useState('')
  const [loadP,    setLoadP]    = useState(false)
  const [enviando, setEnviando] = useState(null)

  useEffect(() => {
    if (!conv?.telefone) return
    fetch(`${api}/api/contatos/${conv.telefone}`).then(r=>r.ok?r.json():null).then(d=>{ if(d) setPerfil(d) }).catch(()=>{})
    fetch(`${api}/api/contatos/${conv.telefone}/pedidos`).then(r=>r.ok?r.json():null).then(d=>{ if(d?.pedidos) setPedidos(d.pedidos) }).catch(()=>{})
  }, [conv?.telefone, api])

  const buscarProdutos = async () => {
    if (!busca.trim()) return
    setLoadP(true)
    setProdutos([])
    try {
      const r = await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(busca)}`)
      if (r.ok) { const d = await r.json(); setProdutos(d.produtos||[]) }
    } catch {}
    setLoadP(false)
  }

  const enviarProduto = async (prod) => {
    setEnviando(prod.nome)
    const pix = (parseFloat(prod.preco)*0.9).toFixed(2)
    const msg = `*${prod.nome}*\n💳 Cartão: R$ ${prod.preco} | 💰 PIX: R$ ${pix}\n${prod.disponivel?'✅ Disponível':'⚠️ Indisponível'}`
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ telefone: conv.telefone, mensagem: msg })
      })
    } catch {}
    setEnviando(null)
  }

  const ABAS = [{id:'perfil',label:'Perfil',icon:User},{id:'pedidos',label:'Pedidos',icon:Package},{id:'catalogo',label:'Catálogo',icon:ShoppingBag}]

  return (
    <div style={{ width:256, flexShrink:0, borderLeft:`1px solid ${V.sep}`, display:'flex', flexDirection:'column', background:V.bg2, overflow:'hidden' }}>
      <div style={{ padding:'10px 12px', borderBottom:`1px solid ${V.sep}`, display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
        <Avatar nome={conv.nome} telefone={conv.telefone} size={30}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:600, color:V.label, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{conv.nome||conv.telefone}</div>
          <div style={{ fontSize:10, color:V.label4 }}>{conv.telefone}</div>
        </div>
      </div>

      <div style={{ display:'flex', borderBottom:`1px solid ${V.sep}`, flexShrink:0 }}>
        {ABAS.map(a=>(
          <button key={a.id} onClick={()=>setAba(a.id)} style={{ flex:1, padding:'7px 0', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2, background:aba===a.id?V.bg:'transparent', borderBottom:aba===a.id?`2px solid ${V.accent}`:'2px solid transparent' }}>
            <a.icon size={11} style={{ color:aba===a.id?V.accent:V.label4 }}/>
            <span style={{ fontSize:9, fontWeight:600, color:aba===a.id?V.accent:V.label4 }}>{a.label}</span>
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflow:'auto', padding:'10px 12px' }}>
        {aba==='perfil' && (
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {perfil ? [
              {icon:User,       label:'Nome',        value:perfil.nome},
              {icon:Phone,      label:'Telefone',    value:perfil.telefone||conv.telefone},
              {icon:Mail,       label:'E-mail',      value:perfil.email},
              {icon:MapPin,     label:'Cidade',      value:perfil.cidade},
              {icon:Tag,        label:'Documento',   value:perfil.cpf||perfil.cnpj},
              {icon:TrendingUp, label:'Total gasto', value:perfil.total_gasto?`R$ ${parseFloat(perfil.total_gasto).toFixed(2)}`:null},
            ].filter(i=>i.value).map((item,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:7 }}>
                <item.icon size={11} style={{ color:V.label4, marginTop:1, flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:9, color:V.label4, marginBottom:1 }}>{item.label}</div>
                  <div style={{ fontSize:11.5, color:V.label, fontWeight:500 }}>{item.value}</div>
                </div>
              </div>
            )) : <div style={{ fontSize:11, color:V.label4, textAlign:'center', padding:16 }}>Sem cadastro vinculado</div>}
          </div>
        )}

        {aba==='pedidos' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {pedidos.length===0
              ? <div style={{ fontSize:11, color:V.label4, textAlign:'center', padding:16 }}>Nenhum pedido encontrado</div>
              : pedidos.map((p,i)=>(
                <div key={i} style={{ background:V.bg, borderRadius:8, padding:'9px 11px', border:`1px solid ${V.sep}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:V.label }}>#{p.numero||p.id}</span>
                    <span style={{ fontSize:9, color:V.label4 }}>{p.data}</span>
                  </div>
                  <div style={{ fontSize:10, color:V.label3, marginBottom:4 }}>{p.situacao||p.status}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, fontWeight:700, color:V.accent }}>{p.total}</span>
                    {p.rastreio&&p.rastreio!=='—'&&<span style={{ fontSize:9, color:'#2563eb' }}>📦 {p.rastreio}</span>}
                  </div>
                </div>
              ))}
          </div>
        )}

        {aba==='catalogo' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', gap:5 }}>
              <input
                value={busca} onChange={e=>setBusca(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&buscarProdutos()}
                placeholder="Buscar produto..."
                style={{ flex:1, padding:'6px 9px', borderRadius:7, border:`1px solid ${V.sep}`, background:V.bg, outline:'none', fontSize:11.5, color:V.label }}
              />
              <button onClick={buscarProdutos} style={{ padding:'6px 10px', borderRadius:7, border:'none', background:V.accent, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                {loadP?'…':'↵'}
              </button>
            </div>
            {produtos.length===0
              ? <div style={{ fontSize:10, color:V.label4, textAlign:'center', padding:'16px 0' }}>Digite e pressione Enter para buscar</div>
              : produtos.map((p,i)=>(
                <div key={i} style={{ background:V.bg, borderRadius:8, padding:'9px 11px', border:`1px solid ${V.sep}` }}>
                  <div style={{ fontSize:11.5, fontWeight:600, color:V.label, marginBottom:4, lineHeight:1.3 }}>{p.nome}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:V.accent }}>R$ {p.preco}</span>
                    <span style={{ fontSize:9, fontWeight:600, padding:'2px 6px', borderRadius:5, background:p.disponivel?'#ecfdf5':'#fef2f2', color:p.disponivel?'#059669':'#dc2626', border:`1px solid ${p.disponivel?'#6ee7b7':'#fca5a5'}` }}>
                      {p.disponivel?'✓ Disponível':'✗ Indisponível'}
                    </span>
                  </div>
                  <button
                    onClick={()=>enviarProduto(p)}
                    disabled={enviando===p.nome}
                    style={{ width:'100%', padding:'5px 0', borderRadius:6, border:`1px solid ${V.accent}`, background:enviando===p.nome?V.fill:'transparent', color:V.accent, cursor:'pointer', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}
                  >
                    <Send size={10}/>{enviando===p.nome?'Enviando…':'Enviar ao cliente'}
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Barra de envio ────────────────────────────────────────────────────────────
function BarraEnvio({ modoManual, telefone, api, onEnviou }) {
  const [texto,     setTexto]     = useState('')
  const [sending,   setSending]   = useState(false)
  const [sugestoes, setSugestoes] = useState([])
  const [loadSug,   setLoadSug]   = useState(false)
  const [anotacao,  setAnotacao]  = useState(false)
  const [emoji,     setEmoji]     = useState(false)
  const inputRef = useRef(null)

  const EMOJIS_RAPIDOS = ['😊','👍','🙏','❤️','✅','📦','💰','🚚','⏳','😔','🎉','💬']

  const buscarSugestoes = useCallback(async () => {
    if (!telefone) return
    setLoadSug(true)
    try {
      const r = await fetch(`${api}/api/sugestoes/${telefone}`)
      if (r.ok) { const d = await r.json(); setSugestoes(d.sugestoes||[]) }
    } catch {}
    setLoadSug(false)
  }, [telefone, api])

  useEffect(() => {
    if (modoManual) buscarSugestoes()
    else setSugestoes([])
  }, [modoManual, telefone])

  const enviar = async (msg) => {
    const txt = (msg||texto).trim()
    if (!txt||sending) return
    setTexto(''); setSugestoes([])
    setSending(true)
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ telefone, mensagem: txt })
      })
      onEnviou?.()
    } catch {}
    setSending(false)
    inputRef.current?.focus()
  }

  if (!modoManual) return (
    <div style={{ padding:'10px 14px', borderTop:`1px solid ${V.sep}`, background:V.bg2, textAlign:'center', fontSize:11, color:V.label4 }}>
      Atendimento via IA — clique em <strong style={{color:V.label3}}>Assumir</strong> para responder manualmente
    </div>
  )

  return (
    <div style={{ borderTop:`1px solid ${V.sep}`, background:V.bg2, flexShrink:0 }}>
      {/* Abas Resposta / Anotação */}
      <div style={{ display:'flex', gap:0, padding:'0 14px', borderBottom:`1px solid ${V.sep}` }}>
        {[{id:false,label:'Resposta Pública'},{id:true,label:'Anotação Interna'}].map(a=>(
          <button key={String(a.id)} onClick={()=>setAnotacao(a.id)} style={{
            padding:'7px 12px', border:'none', cursor:'pointer', background:'transparent',
            fontSize:11.5, fontWeight:anotacao===a.id?700:400,
            color:anotacao===a.id?V.label:V.label4,
            borderBottom:anotacao===a.id?`2px solid ${V.accent}`:'2px solid transparent',
          }}>{a.label}</button>
        ))}
      </div>

      {/* Sugestões */}
      {sugestoes.length>0 && (
        <div style={{ padding:'6px 12px', display:'flex', gap:5, flexWrap:'wrap', alignItems:'center', borderBottom:`1px solid ${V.sep}` }}>
          <Lightbulb size={11} style={{color:'#f59e0b',flexShrink:0}}/>
          {sugestoes.slice(0,3).map((s,i)=>(
            <button key={i} onClick={()=>enviar(s)} style={{
              fontSize:10.5, padding:'3px 9px', borderRadius:12,
              border:`1px solid rgba(245,158,11,0.35)`, background:'rgba(245,158,11,0.08)',
              color:V.label2, cursor:'pointer', maxWidth:240,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>{s}</button>
          ))}
          <button onClick={buscarSugestoes} style={{ marginLeft:'auto', fontSize:10, color:V.label4, background:'transparent', border:'none', cursor:'pointer' }}>
            {loadSug?'…':'↻ Novas'}
          </button>
        </div>
      )}

      {/* Picker de emoji */}
      {emoji && (
        <div style={{ padding:'8px 12px', borderBottom:`1px solid ${V.sep}`, display:'flex', gap:6, flexWrap:'wrap' }}>
          {EMOJIS_RAPIDOS.map(e=>(
            <button key={e} onClick={()=>{ setTexto(t=>t+e); setEmoji(false); inputRef.current?.focus() }}
              style={{ fontSize:18, background:'transparent', border:'none', cursor:'pointer', padding:2 }}>
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Campo de texto */}
      <div style={{ padding:'8px 12px' }}>
        {anotacao && (
          <div style={{ fontSize:10, color:'#7c3aed', fontWeight:600, marginBottom:5, padding:'3px 8px', background:'#f5f0ff', borderRadius:5, display:'inline-block' }}>
            🔒 Anotação interna — não enviada ao cliente
          </div>
        )}
        <textarea
          ref={inputRef}
          value={texto}
          onChange={e=>setTexto(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar()} }}
          placeholder={anotacao?'Escreva uma anotação interna...':'Escreva uma mensagem...'}
          rows={2}
          style={{
            width:'100%', border:'none', background:'transparent', outline:'none',
            fontSize:13, color:V.label, resize:'none', lineHeight:1.55,
            maxHeight:100, overflow:'auto', fontFamily:'inherit',
          }}
        />
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
          {/* Botões de mídia */}
          <button onClick={()=>setEmoji(v=>!v)} title="Emoji" style={{ width:28, height:28, borderRadius:7, border:`1px solid ${V.sep}`, background:emoji?V.fill:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:V.label4 }}>
            <Smile size={13}/>
          </button>
          <label title="Anexar arquivo" style={{ width:28, height:28, borderRadius:7, border:`1px solid ${V.sep}`, background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:V.label4 }}>
            <Paperclip size={13}/>
            <input type="file" style={{display:'none'}} onChange={e=>{
              const file = e.target.files[0]
              if (file) { console.log('Arquivo:', file.name); alert(`Upload de "${file.name}" — integração pendente`) }
            }}/>
          </label>
          <label title="Enviar imagem" style={{ width:28, height:28, borderRadius:7, border:`1px solid ${V.sep}`, background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:V.label4 }}>
            <Image size={13}/>
            <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
              const file = e.target.files[0]
              if (file) { console.log('Imagem:', file.name); alert(`Upload de imagem "${file.name}" — integração pendente`) }
            }}/>
          </label>
          <button title="Gravar áudio" onClick={()=>alert('Gravação de áudio — integração pendente')} style={{ width:28, height:28, borderRadius:7, border:`1px solid ${V.sep}`, background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:V.label4 }}>
            <Mic size={13}/>
          </button>
          <button title="Sugestões IA" onClick={buscarSugestoes} style={{ width:28, height:28, borderRadius:7, border:`1px solid ${V.sep}`, background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#f59e0b' }}>
            <Lightbulb size={13}/>
          </button>

          <div style={{ flex:1 }}/>

          <button onClick={()=>enviar()} disabled={sending||!texto.trim()} style={{
            padding:'6px 16px', borderRadius:8, border:'none',
            background:texto.trim()&&!sending?V.accent:V.fill,
            color:texto.trim()&&!sending?'#fff':V.label4,
            cursor:texto.trim()?'pointer':'default',
            display:'flex', alignItems:'center', gap:6,
            fontSize:12, fontWeight:600, transition:'all 0.15s',
          }}>
            {sending?'Enviando…':<><Send size={12}/> Enviar</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Chat ──────────────────────────────────────────────────────────────────────
function Chat({ telefone, nome, totalMsgs, hora, api, status, onStatusChange, modoManual, onToggleModo }) {
  const [msgs,    setMsgs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset,  setOffset]  = useState(0)
  const bottomRef = useRef(null)
  const prevLen   = useRef(0)
  const fetching  = useRef(false)

  const carregar = useCallback(async (off=0, sil=false) => {
    if (!telefone||fetching.current) return
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
    } catch(e) { console.error('historico erro:', e.message) }
    finally {
      if (!sil) setLoading(false)
      fetching.current = false
    }
    // fetching.current = false
  }, [telefone, api])

  useEffect(()=>{ setMsgs([]); setOffset(0); prevLen.current=0; carregar(0) }, [telefone])
  useEffect(()=>{ const i=setInterval(()=>{ if(document.visibilityState==='visible') carregar(0,true) },8000); return()=>clearInterval(i) }, [carregar])
  useEffect(()=>{
    if (msgs.length>prevLen.current) bottomRef.current?.scrollIntoView({behavior:prevLen.current===0?'instant':'smooth'})
    prevLen.current=msgs.length
  }, [msgs])

  const grupos = useMemo(()=>{
    const g=[]; let d=null
    for (const m of msgs) {
      const dt=new Date(m.criado_em).toDateString()
      if (dt!==d){g.push({tipo:'sep',data:m.criado_em});d=dt}
      g.push({tipo:'msg',msg:m})
    }
    return g
  }, [msgs])

  const stCfg = STATUS.find(s=>s.id===status)||STATUS[0]

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, background:V.bg }}>
      {/* Header */}
      <div style={{ padding:'10px 16px', borderBottom:`1px solid ${V.sep}`, background:V.bg2, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <Avatar nome={nome} telefone={telefone} size={36}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:600, color:V.label }}>{nome||telefone}</div>
          <div style={{ fontSize:10, color:V.label4 }}>{totalMsgs} msgs · {hora}</div>
        </div>

        <button onClick={onToggleModo} style={{
          display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:8,
          border:`1px solid ${modoManual?'#93c5fd':V.sep}`,
          background:modoManual?'#eff6ff':V.fill,
          color:modoManual?'#2563eb':V.label3,
          cursor:'pointer', fontSize:11, fontWeight:600, flexShrink:0, transition:'all 0.15s',
        }}>
          {modoManual?<><Bot size={12}/> Devolver à IA</>:<><User size={12}/> Assumir</>}
        </button>

        <div style={{ display:'flex', gap:3 }}>
          {STATUS.filter(s=>s.id!=='gatilhos').map(s=>(
            <button key={s.id} onClick={()=>onStatusChange(telefone,s.id)} title={s.label} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:2,
              padding:'5px 8px', borderRadius:8, border:'none', cursor:'pointer',
              background:status===s.id?s.bg:'transparent',
              color:status===s.id?s.color:V.label4,
              outline:status===s.id?`1.5px solid ${s.color}50`:'none',
              minWidth:46, transition:'all 0.12s',
            }}>
              <s.icon size={13}/>
              <span style={{ fontSize:9, fontWeight:600 }}>{s.label}</span>
            </button>
          ))}
        </div>

        <button onClick={()=>carregar(0)} style={{ padding:5, border:`1px solid ${V.sep}`, borderRadius:6, background:'transparent', cursor:'pointer', color:V.label4 }}>
          <RefreshCw size={11}/>
        </button>
      </div>

      {/* Mensagens */}
      <div style={{ flex:1, overflow:'auto', padding:'12px 16px', background:V.bg }}>
        {hasMore && <div style={{textAlign:'center',padding:'4px 0'}}><button onClick={()=>carregar(offset)} style={{fontSize:10,color:V.accent,background:'transparent',border:`1px solid ${V.sep}`,borderRadius:6,padding:'3px 10px',cursor:'pointer'}}>Carregar anteriores</button></div>}
        {loading&&msgs.length===0
          ? <div style={{textAlign:'center',padding:40,color:V.label4,fontSize:12}}>Carregando conversas...</div>
          : grupos.length===0
          ? <div style={{textAlign:'center',padding:40,color:V.label4,fontSize:12}}>Nenhuma mensagem</div>
          : grupos.map((g,i)=>g.tipo==='sep'?<DateSep key={`s${i}`} data={g.data}/>:<Bolha key={g.msg.id||i} msg={{...g.msg,telefone}}/>)
        }
        <div ref={bottomRef}/>
      </div>

      <BarraEnvio modoManual={modoManual} telefone={telefone} api={api} onEnviou={()=>carregar(0,true)}/>
    </div>
  )
}

// ── Principal ─────────────────────────────────────────────────────────────────
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

  useEffect(()=>{ sessionStorage.setItem('bia_conv_status', statusSel) }, [statusSel])
  useEffect(()=>{ sessionStorage.setItem('bia_sidebar', String(sidebar)) }, [sidebar])

  const getStatus = (tel) => statusMap[tel]||'pendente'
  const getModo   = (tel) => modoMap[tel]||false

  const carregar = useCallback(async (sil=false) => {
    if (!sil) setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/conversas?aba=todas`)
      if (r.ok) {
        const d = await r.json()
        const novas = d.conversas||[]
        setConvs(prev=>{
          const map=new Map(prev.map(c=>[c.telefone,c]))
          return novas.map(c=>({...map.get(c.telefone),...c}))
        })
        // Popula statusMap com valores do banco (não sobrescreve alterações locais)
        setStatusMap(prev=>{
          const novo={...prev}
          novas.forEach(c=>{
            if (!novo[c.telefone] && c.status_atendimento) {
              novo[c.telefone] = c.status_atendimento
            }
          })
          return novo
        })
      }
    } catch {}
    if (!sil) setLoading(false)
  }, [api])

  useEffect(()=>{
    carregar()
    const i=setInterval(()=>{ if(document.visibilityState==='visible') carregar(true) },15000)
    return()=>clearInterval(i)
  }, [carregar])

  const setConvStatus = useCallback((tel, st) => {
    setStatusMap(prev=>({...prev,[tel]:st}))
    fetch(`${api}/api/contatos/${tel}`,{
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({status_atendimento:st})
    }).catch(()=>{})
  }, [api])

  const toggleModo = useCallback((tel)=>{
    setModoMap(prev=>({...prev,[tel]:!prev[tel]}))
  }, [])

  const contadores = useMemo(()=>{
    const c={}
    STATUS.forEach(s=>{ c[s.id]=convs.filter(cv=>getStatus(cv.telefone)===s.id).length })
    c['gatilhos']=convs.filter(c=>c.modo==='transacional').length
    return c
  }, [convs, statusMap])

  const filtradas = useMemo(()=>convs
    .filter(c=>{
      if(statusSel==='gatilhos') return c.modo==='transacional'
      return getStatus(c.telefone)===statusSel
    })
    .filter(c=>!busca||
      (c.nome||'').toLowerCase().includes(busca.toLowerCase())||
      c.telefone.includes(busca)||
      (c.ultima_msg||'').toLowerCase().includes(busca.toLowerCase())
    ), [convs,statusSel,statusMap,busca])

  const selConv = convs.find(c=>c.telefone===selTel)
  const stCfg   = STATUS.find(s=>s.id===statusSel)||STATUS[0]

  return (
    <div className="h-full flex overflow-hidden" style={{ background:V.bg }}>
      <Sidebar statusSel={statusSel} setStatusSel={setStatusSel} contadores={contadores} expandida={sidebar} setExpandida={setSidebar}/>

      {/* Lista */}
      <div style={{ width:272, flexShrink:0, display:'flex', flexDirection:'column', borderRight:`1px solid ${V.sep}`, background:V.bg }}>
        <div style={{ padding:'10px 12px', borderBottom:`1px solid ${V.sep}`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <stCfg.icon size={13} style={{color:stCfg.color}}/>
              <span style={{ fontSize:13, fontWeight:600, color:V.label }}>{stCfg.label}</span>
              <span style={{ fontSize:10, color:V.label4, background:V.fill, padding:'1px 6px', borderRadius:8 }}>{filtradas.length}</span>
            </div>
            <button onClick={()=>carregar()} style={{ padding:4, border:'none', background:'transparent', cursor:'pointer', color:V.label4 }}>
              <RefreshCw size={11}/>
            </button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:V.fill, borderRadius:8, padding:'6px 9px', border:`1px solid ${V.sep}` }}>
            <Search size={11} style={{color:V.label4,flexShrink:0}}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:11.5, color:V.label }}/>
          </div>
        </div>

        <div style={{ flex:1, overflow:'auto' }}>
          {loading
            ? Array.from({length:5}).map((_,i)=>(
                <div key={i} style={{ padding:'10px 12px', borderBottom:`1px solid ${V.sep}` }}>
                  <div style={{ height:10, width:'55%', borderRadius:4, background:V.sep, marginBottom:5 }}/>
                  <div style={{ height:8, width:'75%', borderRadius:4, background:V.sep }}/>
                </div>
              ))
            : filtradas.length===0
            ? <div style={{ padding:24, textAlign:'center', fontSize:12, color:V.label4 }}>
                {statusSel==='pendente'?'Novas conversas aparecem aqui':
                 statusSel==='gatilhos'?'Disparos automáticos aqui':
                 'Mude o status de uma conversa para ver aqui'}
              </div>
            : filtradas.map(c=>{
                const ativo = selTel===c.telefone
                const st    = STATUS.find(s=>s.id===getStatus(c.telefone))||STATUS[0]
                return (
                  <div key={c.telefone} onClick={()=>setSelTel(c.telefone)}
                    style={{ display:'flex', gap:9, padding:'10px 12px', cursor:'pointer', borderBottom:`1px solid ${V.sep}`, borderLeft:ativo?`3px solid ${V.accent}`:'3px solid transparent', background:ativo?'rgba(5,150,105,0.04)':'transparent', transition:'background 0.1s' }}
                    onMouseEnter={e=>{ if(!ativo) e.currentTarget.style.background=V.fill }}
                    onMouseLeave={e=>{ if(!ativo) e.currentTarget.style.background='transparent' }}
                  >
                    <Avatar nome={c.nome} telefone={c.telefone} size={34}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:V.label, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130 }}>{c.nome||c.telefone}</span>
                        <span style={{ fontSize:9, color:V.label4, flexShrink:0 }}>{c.hora}</span>
                      </div>
                      <div style={{ fontSize:10.5, color:V.label3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>
                        {c.ultima_direcao==='saida'?'↩ ':''}{c.ultima_msg||'—'}
                      </div>
                      <div style={{ display:'flex', gap:3 }}>
                        {c.agente&&<span style={{ fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:4, background:'#ecfdf5', color:'#059669', border:'1px solid #6ee7b7' }}>IA</span>}
                        <span style={{ fontSize:8, fontWeight:600, padding:'1px 5px', borderRadius:4, background:st.bg, color:st.color }}>{st.label}</span>
                        <span style={{ fontSize:8, color:V.label4, marginLeft:'auto' }}>{c.total_msgs}m</span>
                      </div>
                    </div>
                  </div>
                )
              })}
        </div>
      </div>

      {/* Chat + Painel */}
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
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:V.label4, background:V.bg }}>
          <MessageSquare size={40} style={{opacity:0.15}}/>
          <div style={{ fontSize:14, fontWeight:500, color:V.label3 }}>Selecione uma conversa</div>
          <div style={{ fontSize:11, color:V.label4 }}>{filtradas.length} em {stCfg.label.toLowerCase()}</div>
        </div>
      )}
    </div>
  )
}
