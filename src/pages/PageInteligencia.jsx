import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Brain, Zap, Users, TrendingUp, TrendingDown, AlertTriangle,
  RefreshCw, Search, Filter, X, ChevronDown, ChevronUp,
  MessageSquare, Send, Star, Crown, Activity, Package,
  ShoppingCart, Clock, Target, Sparkles, BarChart3, Settings,
  Check, Copy, ExternalLink, ArrowRight, Bell, Eye, EyeOff,
  UserX, DollarSign, Flame, Shield, Award, Heart, Boxes,
  ChevronRight, MoreHorizontal, Play, Pause, RotateCcw,
  Radio, Wifi, AlertCircle, CheckCircle, Info, Lightbulb,
  Layers, SlidersHorizontal, Calendar, Hash, Phone, Mail,
  Package2, Tag, Archive, Repeat, Percent, CircleOff, Lock, Truck, FileText, User,
  Trash2, Download, CheckCheck, Ban
} from 'lucide-react'

// ── Utilitários ────────────────────────────────────────────────────────────────
const R   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const Rk  = n => n >= 1000 ? `R$ ${(n/1000).toFixed(1).replace('.',',')}k` : R(n)
const fmt = n => Number(n||0).toLocaleString('pt-BR')
// Aceita 'YYYY-MM-DD' E ISO completo ('...T00:00:00.000Z' — como o pg serializa
// DATE via JSON). O +'T12:00:00' cego gerava "Invalid Date" com ISO.
const fmtD  = d => {
  if (!d) return '—'
  const s = String(d).slice(0,10)
  const dt = new Date(s+'T12:00:00')
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})
}
const fmtDT = d => d ? new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'
const diasAtras = d => {
  if (!d) return 999
  const diff = (Date.now() - new Date(d).getTime()) / 86400000
  return Math.floor(diff)
}
const pluralize = (n, s, p) => `${fmt(n)} ${n === 1 ? s : p}`

// ── Paleta de cores do sistema ────────────────────────────────────────────────
const COR = {
  vip:       '#fbbf24',
  fiel:      '#34d399',
  potencial: '#8b5cf6',
  novo:      '#60a5fa',
  regular:   '#94a3b8',
  em_risco:  '#fb923c',
  perdido:   '#f87171',
  urgente:   '#f87171',
  oportunidade: '#8b5cf6',
  estoque:   '#fb923c',
  posVenda:  '#60a5fa',
  comportamento: '#34d399',
}

// ── Segmentos RFM completos ───────────────────────────────────────────────────
const SEG = {
  vip:       { label:'VIP',       cor:COR.vip,       Icon:Crown,         desc:'Frequente, alto valor, recente' },
  fiel:      { label:'Fiel',      cor:COR.fiel,      Icon:Star,          desc:'Compra regularmente' },
  potencial: { label:'Potencial', cor:COR.potencial, Icon:TrendingUp,    desc:'Alto valor, baixa frequência' },
  novo:      { label:'Novo',      cor:COR.novo,      Icon:Sparkles,      desc:'1ª ou 2ª compra' },
  regular:   { label:'Regular',   cor:COR.regular,   Icon:Activity,      desc:'Padrão médio de compra' },
  em_risco:  { label:'Em risco',  cor:COR.em_risco,  Icon:AlertTriangle, desc:'Sumindo progressivamente' },
  perdido:   { label:'Perdido',   cor:COR.perdido,   Icon:UserX,         desc:'Sem comprar há muito tempo' },
}

// ── Tipos de sugestão da Bia ─────────────────────────────────────────────────
const TIPO_SUGESTAO = {
  urgente:      { label:'Urgente',      cor:'#f87171', bg:'rgba(248,113,113,.09)', Icon:AlertTriangle },
  oportunidade: { label:'Oportunidade', cor:'#8b5cf6', bg:'rgba(139,92,246,.10)',  Icon:Lightbulb },
  estoque:      { label:'Estoque',      cor:'#fb923c', bg:'rgba(251,146,60,.09)',  Icon:Boxes },
  posVenda:     { label:'Pós-venda',    cor:'#60a5fa', bg:'rgba(96,165,250,.10)',  Icon:Heart },
  comportamento:{ label:'Padrão',       cor:'#34d399', bg:'rgba(52,211,153,.10)',  Icon:BarChart3 },
}

// ── Canais ────────────────────────────────────────────────────────────────────
const CANAL = {
  shopee:       { label:'Shopee',        cor:'#ee4d2d' },
  mercadolivre: { label:'Mercado Livre', cor:'#ffd400' },
  nuvemshop:    { label:'Nuvemshop',     cor:'#a855f7' },
  tiktokshop:   { label:'TikTok',        cor:'#22d3ee' },
  shein:        { label:'Shein',         cor:'#f472b6' },
  whatsapp:     { label:'WhatsApp',      cor:'#25D366' },
  loja:         { label:'Loja',          cor:'#34d399' },
}


// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ nome, size=36, cor, foto }) {
  const init = (nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const pal  = ['#8b5cf6','#f472b6','#f87171','#2dd4bf','#60a5fa','#34d399','#fbbf24']
  const c    = cor || pal[(nome||'?').charCodeAt(0) % pal.length]
  if (foto) return (
    <div style={{width:size,height:size,borderRadius:'50%',overflow:'hidden',flexShrink:0,border:`2px solid ${c}40`}}>
      <img src={foto} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
    </div>
  )
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:`${c}18`,border:`1.5px solid ${c}45`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.36,fontWeight:800,color:c,flexShrink:0,letterSpacing:'-.5px'}}>
      {init}
    </div>
  )
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size=48, strokeWidth=4 }) {
  const r   = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const cor  = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} style={{transform:'rotate(-90deg)',flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--fill)" strokeWidth={strokeWidth}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={cor} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{transition:'stroke-dasharray .8s cubic-bezier(.4,0,.2,1)'}}/>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{transform:'rotate(90deg)',transformOrigin:`${size/2}px ${size/2}px`,fontSize:size*.28,fontWeight:800,fill:cor}}>
        {score}
      </text>
    </svg>
  )
}

// ── Mini sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data=[], cor='#8b5cf6', height=28, width=80 }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const pts = data.map((v,i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / (max - min || 1)) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} style={{flexShrink:0}}>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points={`0,${height} ${pts} ${width},${height}`} fill={`${cor}15`} stroke="none"/>
    </svg>
  )
}

// ── Barra de progresso ────────────────────────────────────────────────────────
function ProgressBar({ value, max, cor, height=5 }) {
  const pct = Math.min(100, (value/max)*100)
  return (
    <div style={{height,borderRadius:99,background:'var(--fill)',overflow:'hidden',flex:1}}>
      <div style={{height:'100%',borderRadius:99,background:cor,width:`${pct}%`,transition:'width .8s cubic-bezier(.4,0,.2,1)'}}/>
    </div>
  )
}

// ── Chip de segmento ──────────────────────────────────────────────────────────
function SegChip({ seg }) {
  const s = SEG[seg] || SEG.regular
  const I = s.Icon
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10.5,fontWeight:700,padding:'2px 8px',borderRadius:99,background:`${s.cor}15`,color:s.cor,border:`1px solid ${s.cor}30`,whiteSpace:'nowrap'}}>
      <I size={9}/>{s.label}
    </span>
  )
}

// ── Canal chip ────────────────────────────────────────────────────────────────
function CanalChip({ canal }) {
  const c = CANAL[canal] || CANAL.loja
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:10,fontWeight:600,padding:'1px 7px',borderRadius:99,background:`${c.cor}15`,color:c.cor,border:`1px solid ${c.cor}30`,whiteSpace:'nowrap'}}>
      {c.label}
    </span>
  )
}


// ── Card de Sugestão da Bia ───────────────────────────────────────────────────
function BiaCard({ sug, onAction, onDismiss, api }) {
  const [expanded, setExpanded] = useState(false)
  const [acting,   setActing]   = useState(false)
  const [done,     setDone]     = useState(false)
  const tipo = TIPO_SUGESTAO[sug.tipo] || TIPO_SUGESTAO.oportunidade
  const Icon = tipo.Icon

  const agir = async () => {
    if (acting || done) return
    setActing(true)
    try {
      if (sug.acao?.endpoint) {
        await fetch(`${api}${sug.acao.endpoint}`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify(sug.acao.payload||{})
        })
      }
      setDone(true)
    } catch {}
    setActing(false)
  }

  return (
    <div style={{
      borderRadius:12, border:`1px solid ${tipo.cor}25`,
      background:tipo.bg, overflow:'hidden',
      transition:'all .2s', opacity: done ? .6 : 1,
    }}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',gap:12,padding:'13px 15px'}}>
        {/* Ícone tipo */}
        <div style={{width:34,height:34,borderRadius:9,background:`${tipo.cor}20`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:`1px solid ${tipo.cor}30`}}>
          <Icon size={16} style={{color:tipo.cor}}/>
        </div>

        {/* Conteúdo */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4,flexWrap:'wrap'}}>
            <span style={{fontSize:12,fontWeight:700,padding:'1px 7px',borderRadius:99,background:`${tipo.cor}20`,color:tipo.cor}}>{tipo.label}</span>
            {sug.prioridade === 'alta' && <span style={{fontSize:10.5,fontWeight:700,color:'#ef4444'}}>● urgente</span>}
            <span style={{fontSize:11,color:'var(--label-4)',marginLeft:'auto'}}>{fmtDT(sug.criado_em)}</span>
          </div>
          <p style={{fontSize:13.5,fontWeight:600,color:'var(--label)',margin:'0 0 4px',lineHeight:1.3}}>{sug.titulo}</p>
          <p style={{fontSize:12.5,color:'var(--label-3)',margin:0,lineHeight:1.6}}>{sug.descricao}</p>

          {/* Clientes afetados */}
          {sug.clientes?.length > 0 && (
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:8}}>
              <div style={{display:'flex'}}>
                {sug.clientes.slice(0,4).map((c,i)=>(
                  <div key={i} style={{marginLeft:i>0?-8:0,zIndex:4-i,position:'relative'}}>
                    <Avatar nome={c.nome} size={24}/>
                  </div>
                ))}
              </div>
              <span style={{fontSize:11.5,color:'var(--label-4)'}}>
                {sug.clientes.length > 4
                  ? `${sug.clientes.slice(0,3).map(c=>c.nome.split(' ')[0]).join(', ')} +${sug.clientes.length-3}`
                  : sug.clientes.map(c=>c.nome.split(' ')[0]).join(', ')
                }
              </span>
              {sug.valor_estimado > 0 && (
                <span style={{fontSize:11.5,fontWeight:700,color:'#22c55e',marginLeft:'auto'}}>{Rk(sug.valor_estimado)}</span>
              )}
            </div>
          )}

          {/* Detalhes expandidos */}
          {expanded && sug.detalhes && (
            <div style={{marginTop:10,padding:'10px 12px',borderRadius:9,background:'var(--fill)',border:'1px solid var(--sep)'}}>
              <pre style={{fontSize:12,color:'var(--label-3)',margin:0,whiteSpace:'pre-wrap',fontFamily:'inherit',lineHeight:1.6}}>{sug.detalhes}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Footer ações */}
      {!done && (
        <div style={{display:'flex',alignItems:'center',gap:7,padding:'10px 15px',borderTop:`1px solid ${tipo.cor}15`}}>
          {sug.acao && (
            <button onClick={agir} disabled={acting} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:8,border:`1px solid ${tipo.cor}40`,background:`${tipo.cor}15`,color:tipo.cor,cursor:'pointer',fontSize:12.5,fontWeight:700,transition:'all .15s'}}>
              {acting ? <RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> : <Send size={13}/>}
              {acting ? 'Enviando...' : sug.acao.label}
            </button>
          )}
          {sug.detalhes && (
            <button onClick={()=>setExpanded(v=>!v)} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 11px',borderRadius:8,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-4)',cursor:'pointer',fontSize:12}}>
              {expanded ? <><ChevronUp size={12}/> Menos</> : <><ChevronDown size={12}/> Mais</>}
            </button>
          )}
          <button onClick={()=>onDismiss(sug.id)} style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-4)',cursor:'pointer',fontSize:11.5}}>
            <X size={11}/> Ignorar
          </button>
        </div>
      )}
      {done && (
        <div style={{padding:'10px 15px',borderTop:`1px solid ${tipo.cor}15`,display:'flex',alignItems:'center',gap:6}}>
          <CheckCircle size={13} style={{color:'#22c55e'}}/>
          <span style={{fontSize:12,color:'#22c55e',fontWeight:600}}>Ação executada</span>
        </div>
      )}
    </div>
  )
}


// ── Painel de Campanhas (gestao do motor) ─────────────────────────────────────
// UI da fila: progresso ao vivo, pausar/retomar/cancelar. Poll de 5s enquanto
// houver campanha rodando — a fila e do servidor, a tela so observa.
function CampanhasPanel({ api }) {
  const [lista,    setLista]   = useState(null)
  const [agindo,   setAgindo]  = useState(0)
  const [aberta,   setAberta]  = useState(null)   // id com monitor aberto
  const [fila,     setFila]    = useState(null)   // resposta de /campanhas/:id/fila
  const [loadFila, setLoadFila]= useState(false)
  const [fStatus,  setFStatus] = useState('todos')
  const [busca,    setBusca]   = useState('')
  const [pag,      setPag]     = useState(0)
  const [aoVivo,   setAoVivo]  = useState(true)
  const LIM = 25

  const carregar = useCallback(()=>{
    fetch(`${api}/api/inteligencia/campanhas`).then(r=>r.json())
      .then(d=>setLista(Array.isArray(d)?d:[])).catch(()=>setLista([]))
  },[api])

  useEffect(()=>{
    carregar()
    if (!aoVivo) return
    const t = setInterval(carregar, 5000)
    return ()=>clearInterval(t)
  },[carregar, aoVivo])

  const carregarFila = useCallback(async (id, silencioso)=>{
    if (!silencioso) setLoadFila(true)
    try {
      const qs = new URLSearchParams({ status:fStatus, q:busca, limit:String(LIM), offset:String(pag*LIM) })
      const r = await fetch(`${api}/api/inteligencia/campanhas/${id}/fila?${qs.toString()}`)
      setFila(await r.json())
    } catch { setFila(null) }
    setLoadFila(false)
  },[api, fStatus, busca, pag])

  useEffect(()=>{ if (aberta) carregarFila(aberta, false) },[aberta, carregarFila])
  useEffect(()=>{
    if (!aberta || !aoVivo) return
    const t = setInterval(()=>carregarFila(aberta, true), 5000)
    return ()=>clearInterval(t)
  },[aberta, aoVivo, carregarFila])

  const acao = async (id, verbo) => {
    setAgindo(id)
    try { await fetch(`${api}/api/inteligencia/campanhas/${id}/${verbo}`,{method:'POST'}); carregar() } catch{}
    setAgindo(0)
  }

  const excluir = async (id, nome) => {
    if (!window.confirm(`Excluir a campanha #${id} "${nome}"?\n\nIsso apaga a campanha e TODO o histórico da fila (quem recebeu, erros, motivos).\nNão dá para desfazer.`)) return
    setAgindo(id)
    try {
      const r = await fetch(`${api}/api/inteligencia/campanhas/${id}`,{method:'DELETE'})
      const d = await r.json().catch(()=>({}))
      if (!r.ok) window.alert(d.erro || 'Não foi possível excluir.')
      else { if (aberta===id) { setAberta(null); setFila(null) } ; carregar() }
    } catch { window.alert('Falha de rede ao excluir.') }
    setAgindo(0)
  }

  const abrirMonitor = (id) => {
    if (aberta===id) { setAberta(null); setFila(null); return }
    setFStatus('todos'); setBusca(''); setPag(0); setFila(null); setAberta(id)
  }

  const COR = { rodando:'#34d399', pausada:'#fbbf24', concluida:'#8b5cf6', cancelada:'#94a3b8' }
  const ST  = { enviado:['Enviado','#34d399'], erro:['Erro','#f87171'], pendente:['Na fila','#fbbf24'], pulado:['Pulado','#94a3b8'] }
  const nf  = n => (Number(n)||0).toLocaleString('pt-BR')

  if (lista===null) return <p style={{fontSize:12.5,color:'var(--label-4)',padding:'32px 0',textAlign:'center'}}>Carregando campanhas...</p>
  if (!lista.length) return (
    <div style={{textAlign:'center',padding:'56px 20px',color:'var(--label-4)'}}>
      <Send size={30} style={{opacity:.25}}/>
      <p style={{fontSize:14,fontWeight:700,color:'var(--label-3)',margin:'12px 0 6px'}}>Nenhuma campanha ainda</p>
      <p style={{fontSize:12.5,margin:0,lineHeight:1.6}}>Monte a audiência na aba <strong>Clientes</strong> (filtros ou seleção manual)<br/>e clique em "Criar campanha".</p>
    </div>
  )

  // ── Consolidado da operação ────────────────────────────────────────────────
  const tot = lista.reduce((a,c)=>({
    enviados:a.enviados+(c.enviados||0), erros:a.erros+(c.erros||0),
    pendentes:a.pendentes+(c.pendentes||0), conv:a.conv+(c.conversoes||0),
    receita:a.receita+Number(c.receita_atribuida||0),
  }),{enviados:0,erros:0,pendentes:0,conv:0,receita:0})
  const rodando = lista.filter(c=>c.status==='rodando').length

  return (
    <div>
      {/* Barra de comando: consolidado + ao vivo */}
      <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:14,borderRadius:13,border:'1px solid var(--sep)',background:'var(--bg-2)',overflow:'hidden',flexWrap:'wrap'}}>
        {[
          {l:'Campanhas',  v:nf(lista.length), sub:`${rodando} rodando`, c:'var(--label)'},
          {l:'Enviados',   v:nf(tot.enviados), sub:'total acumulado',    c:'#34d399'},
          {l:'Na fila',    v:nf(tot.pendentes),sub:'aguardando envio',   c:'#fbbf24'},
          {l:'Erros',      v:nf(tot.erros),    sub:'falha no disparo',   c: tot.erros?'#f87171':'var(--label-3)'},
          {l:'Recompras',  v:nf(tot.conv),     sub:'pós-contato',        c:'#60a5fa'},
          {l:'Receita atr.',v:`R$ ${tot.receita.toLocaleString('pt-BR',{maximumFractionDigits:0})}`, sub:'correlação', c:'#8b5cf6'},
        ].map((k,i,a)=>(
          <div key={k.l} style={{flex:'1 1 130px',padding:'12px 14px',borderRight:i<a.length-1?'1px solid var(--sep)':'none'}}>
            <p style={{margin:0,fontSize:9,fontWeight:800,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--label-4)'}}>{k.l}</p>
            <p style={{margin:'4px 0 1px',fontSize:19,fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</p>
            <p style={{margin:0,fontSize:9.5,color:'var(--label-4)'}}>{k.sub}</p>
          </div>
        ))}
        <button onClick={()=>setAoVivo(v=>!v)} title="Atualização automática a cada 5s"
          style={{display:'flex',alignItems:'center',gap:6,padding:'12px 16px',background:'transparent',border:'none',borderLeft:'1px solid var(--sep)',cursor:'pointer',color:aoVivo?'#34d399':'var(--label-4)',fontSize:11.5,fontWeight:700}}>
          <span style={{width:7,height:7,borderRadius:99,background:aoVivo?'#34d399':'var(--label-4)',boxShadow:aoVivo?'0 0 8px #34d399':'none'}}/>
          {aoVivo?'AO VIVO':'PAUSADO'}
        </button>
      </div>

      {lista.map(c=>{
        const done = (c.enviados||0)+(c.erros||0)
        const alvo = Math.max(1,(c.total||0)-(c.pulados||0))
        const pct  = Math.min(100, Math.round(done/alvo*100))
        const cor  = COR[c.status]||'#94a3b8'
        const mon  = aberta===c.id
        const rast = mon ? fila?.rastreio : null
        return (
          <div key={c.id} style={{borderRadius:13,border:`1px solid ${c.status==='rodando'?cor+'40':'var(--sep)'}`,background:'var(--bg-2)',padding:'14px 18px',marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:10,flexWrap:'wrap'}}>
              <div style={{minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:3,flexWrap:'wrap'}}>
                  <span style={{fontSize:14.5,fontWeight:800,color:'var(--label)'}}>#{c.id} · {c.nome}</span>
                  <span style={{fontSize:10.5,fontWeight:800,textTransform:'uppercase',letterSpacing:'.05em',color:cor,background:cor+'18',border:`1px solid ${cor}35`,padding:'2px 8px',borderRadius:99}}>{c.status}</span>
                  {c.status==='rodando' && <span style={{width:6,height:6,borderRadius:99,background:'#34d399',boxShadow:'0 0 7px #34d399'}}/>}
                </div>
                <p style={{fontSize:11.5,color:'var(--label-4)',margin:0}}>
                  template <strong style={{color:'var(--label-3)'}}>{c.gatilho}</strong> · {c.ritmo_seg}s/envio · janela {c.janela_ini}h–{c.janela_fim}h · criada {String(c.criado_em).slice(0,10)}
                  {c.cupom && <> · cupom <strong style={{color:'#fbbf24'}}>{c.cupom}</strong></>}
                </p>
              </div>
              <div style={{display:'flex',gap:7,flexShrink:0,flexWrap:'wrap'}}>
                <button onClick={()=>abrirMonitor(c.id)} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 13px',borderRadius:8,border:`1px solid ${mon?'#8b5cf6':'var(--sep)'}`,background:mon?'rgba(139,92,246,.12)':'transparent',color:mon?'#a78bfa':'var(--label-3)',cursor:'pointer',fontSize:11.5,fontWeight:700}}>
                  <Activity size={12}/> Monitorar {mon?<ChevronUp size={11}/>:<ChevronDown size={11}/>}
                </button>
                {c.status==='rodando' && <button disabled={agindo===c.id} onClick={()=>acao(c.id,'pausar')}  style={{display:'flex',alignItems:'center',gap:5,padding:'6px 13px',borderRadius:8,border:'1px solid rgba(251,191,36,.35)',background:'rgba(251,191,36,.08)',color:'#fbbf24',cursor:'pointer',fontSize:11.5,fontWeight:700}}><Pause size={12}/> Pausar</button>}
                {c.status==='pausada' && <button disabled={agindo===c.id} onClick={()=>acao(c.id,'retomar')} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 13px',borderRadius:8,border:'1px solid rgba(52,211,153,.35)',background:'rgba(52,211,153,.08)',color:'#34d399',cursor:'pointer',fontSize:11.5,fontWeight:700}}><Play size={12}/> Retomar</button>}
                {['rodando','pausada'].includes(c.status) && <button disabled={agindo===c.id} onClick={()=>{ if(window.confirm(`Cancelar a campanha #${c.id}? Os pendentes não serão enviados.`)) acao(c.id,'cancelar') }} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 13px',borderRadius:8,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-4)',cursor:'pointer',fontSize:11.5,fontWeight:700}}><Ban size={12}/> Cancelar</button>}
                <button disabled={agindo===c.id || c.status==='rodando'} title={c.status==='rodando'?'Pause ou cancele antes de excluir':'Excluir campanha e histórico'} onClick={()=>excluir(c.id,c.nome)}
                  style={{display:'flex',alignItems:'center',gap:5,padding:'6px 11px',borderRadius:8,border:'1px solid rgba(248,113,113,.3)',background:'transparent',color:c.status==='rodando'?'var(--label-4)':'#f87171',cursor:c.status==='rodando'?'not-allowed':'pointer',fontSize:11.5,fontWeight:700,opacity:c.status==='rodando'?.45:1}}>
                  <Trash2 size={12}/>
                </button>
              </div>
            </div>

            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{flex:1,height:9,background:'var(--sep)',borderRadius:99,overflow:'hidden'}}>
                <div style={{width:`${pct}%`,height:'100%',background:`linear-gradient(90deg,${cor},${cor}90)`,borderRadius:99,transition:'width .6s'}}/>
              </div>
              <span style={{fontSize:12,fontWeight:800,color:cor,width:44,textAlign:'right'}}>{pct}%</span>
            </div>

            {/* Estatísticas da campanha */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(88px,1fr))',gap:1,marginTop:11,background:'var(--sep)',borderRadius:10,overflow:'hidden',border:'1px solid var(--sep)'}}>
              {[
                {l:'Alvo',     v:nf(alvo),            c:'var(--label-2)'},
                {l:'Enviados', v:nf(c.enviados||0),   c:'#34d399'},
                {l:'Na fila',  v:nf(c.pendentes||0),  c:'#fbbf24'},
                {l:'Erros',    v:nf(c.erros||0),      c:(c.erros||0)?'#f87171':'var(--label-3)'},
                {l:'Pulados',  v:nf(c.pulados||0),    c:'var(--label-3)'},
                {l:'Entregues',v: rast? nf(rast.entregues) : '—', c: rast?.entregues?'#60a5fa':'var(--label-4)'},
                {l:'Lidos',    v: rast? nf(rast.lidos)     : '—', c: rast?.lidos?'#8b5cf6':'var(--label-4)'},
              ].map(k=>(
                <div key={k.l} style={{background:'var(--bg-2)',padding:'9px 10px',textAlign:'center'}}>
                  <p style={{margin:0,fontSize:16,fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</p>
                  <p style={{margin:'3px 0 0',fontSize:8.5,color:'var(--label-4)',textTransform:'uppercase',letterSpacing:'.06em'}}>{k.l}</p>
                </div>
              ))}
            </div>
            {c.status==='rodando' && c.pendentes>0 && (
              <p style={{fontSize:11,color:'var(--label-4)',margin:'8px 0 0'}}>≈ <strong style={{color:'var(--label-2)'}}>{Math.ceil(c.pendentes/(3600/c.ritmo_seg)/Math.max(1,c.janela_fim-c.janela_ini)*10)/10}</strong> dia(s) restantes no ritmo atual</p>
            )}

            {/* ── MONITOR POR LEAD ────────────────────────────────────────── */}
            {mon && (
              <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid var(--sep)'}}>
                {rast && rast.com_wamid===0 && (c.enviados||0)>0 && (
                  <div style={{display:'flex',gap:9,alignItems:'flex-start',padding:'10px 12px',borderRadius:9,background:'rgba(251,191,36,.07)',border:'1px solid rgba(251,191,36,.25)',marginBottom:11}}>
                    <AlertTriangle size={13} style={{color:'#fbbf24',flexShrink:0,marginTop:1}}/>
                    <p style={{margin:0,fontSize:11.5,color:'var(--label-3)',lineHeight:1.55}}>
                      <strong style={{color:'#fbbf24'}}>Rastreio de entrega/leitura desligado.</strong> Estes envios não guardaram o <code style={{fontFamily:'monospace'}}>wamid</code> da Meta, então Entregue/Lido ficam vazios. Ligar exige a rota de disparo devolver o wamid e o webhook do WhatsApp repassar os status.
                    </p>
                  </div>
                )}

                {/* Filtros + busca + export */}
                <div style={{display:'flex',gap:7,alignItems:'center',marginBottom:10,flexWrap:'wrap'}}>
                  {['todos','enviado','erro','pendente','pulado'].map(s=>{
                    const qtd = s==='todos'
                      ? (fila?.contagens||[]).reduce((a,x)=>a+x.qtd,0)
                      : (fila?.contagens||[]).find(x=>x.status===s)?.qtd || 0
                    const on = fStatus===s
                    const cc = s==='todos'?'#8b5cf6':(ST[s]?.[1]||'#94a3b8')
                    return (
                      <button key={s} onClick={()=>{setFStatus(s);setPag(0)}}
                        style={{display:'flex',alignItems:'center',gap:6,padding:'5px 11px',borderRadius:99,border:`1px solid ${on?cc+'60':'var(--sep)'}`,background:on?cc+'18':'transparent',color:on?cc:'var(--label-4)',cursor:'pointer',fontSize:11,fontWeight:700,textTransform:'capitalize'}}>
                        {s==='todos'?'Todos':ST[s][0]}
                        <span style={{fontSize:9.5,fontWeight:800,opacity:.85}}>{nf(qtd)}</span>
                      </button>
                    )
                  })}
                  <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:'auto',flexWrap:'wrap'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)'}}>
                      <Search size={12} style={{color:'var(--label-4)'}}/>
                      <input value={busca} onChange={e=>{setBusca(e.target.value);setPag(0)}} placeholder="nome ou telefone"
                        style={{border:'none',background:'transparent',color:'var(--label)',fontSize:11.5,outline:'none',width:130}}/>
                    </div>
                    <button onClick={()=>window.open(`${api}/api/inteligencia/campanhas/${c.id}/fila?formato=csv&status=${fStatus}&q=${encodeURIComponent(busca)}`,'_blank')}
                      style={{display:'flex',alignItems:'center',gap:5,padding:'6px 11px',borderRadius:8,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-3)',cursor:'pointer',fontSize:11,fontWeight:700}}>
                      <Download size={12}/> CSV
                    </button>
                    <button onClick={()=>carregarFila(c.id,false)} title="Atualizar agora"
                      style={{display:'flex',alignItems:'center',padding:'6px 9px',borderRadius:8,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-3)',cursor:'pointer'}}>
                      <RefreshCw size={12} style={loadFila?{animation:'spin 1s linear infinite'}:undefined}/>
                    </button>
                  </div>
                </div>

                {/* Tabela de leads */}
                {loadFila && !fila && <p style={{fontSize:12,color:'var(--label-4)',padding:'14px 0',textAlign:'center'}}>Carregando fila…</p>}
                {fila && (fila.itens||[]).length===0 && <p style={{fontSize:12,color:'var(--label-4)',padding:'14px 0',textAlign:'center'}}>Nenhum registro para este filtro.</p>}
                {fila && (fila.itens||[]).length>0 && (
                  <div style={{border:'1px solid var(--sep)',borderRadius:10,overflow:'hidden'}}>
                    <div style={{display:'grid',gridTemplateColumns:'minmax(150px,1.6fr) 90px 96px 110px 84px 76px',gap:0,background:'rgba(255,255,255,.02)',borderBottom:'1px solid var(--sep)'}}>
                      {['Lead','Segmento','Status','Enviado','Entregue','Lido'].map(h=>(
                        <div key={h} style={{padding:'8px 11px',fontSize:9,fontWeight:800,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--label-4)'}}>{h}</div>
                      ))}
                    </div>
                    {fila.itens.map(it=>{
                      const [sl,sc] = ST[it.status] || [it.status,'#94a3b8']
                      return (
                        <div key={it.id}>
                          <div style={{display:'grid',gridTemplateColumns:'minmax(150px,1.6fr) 90px 96px 110px 84px 76px',gap:0,borderTop:'1px solid var(--sep)',alignItems:'center'}}>
                            <div style={{padding:'9px 11px',minWidth:0}}>
                              <p style={{margin:0,fontSize:12,fontWeight:600,color:'var(--label)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.nome||'—'}</p>
                              <p style={{margin:'1px 0 0',fontSize:10.5,color:'var(--label-4)',fontFamily:'monospace'}}>{it.telefone}</p>
                            </div>
                            <div style={{padding:'9px 11px'}}>{it.segmento ? <SegChip seg={it.segmento}/> : <span style={{fontSize:11,color:'var(--label-4)'}}>—</span>}</div>
                            <div style={{padding:'9px 11px'}}>
                              <span style={{fontSize:10,fontWeight:800,color:sc,background:sc+'1e',border:`1px solid ${sc}38`,padding:'2px 8px',borderRadius:99}}>{sl}</span>
                            </div>
                            <div style={{padding:'9px 11px',fontSize:11,color:it.enviado_em?'var(--label-3)':'var(--label-4)'}}>{it.enviado_em?fmtDT(it.enviado_em):'—'}</div>
                            <div style={{padding:'9px 11px'}}>{it.entregue_em
                              ? <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,color:'#60a5fa'}}><Check size={11}/>{String(it.entregue_em).slice(11,16)}</span>
                              : <span style={{fontSize:11,color:'var(--label-4)'}}>—</span>}</div>
                            <div style={{padding:'9px 11px'}}>{it.lido_em
                              ? <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,color:'#8b5cf6'}}><CheckCheck size={11}/>{String(it.lido_em).slice(11,16)}</span>
                              : <span style={{fontSize:11,color:'var(--label-4)'}}>—</span>}</div>
                          </div>
                          {(it.motivo || it.erro_meta) && (
                            <div style={{padding:'0 11px 9px 11px',borderTop:'none'}}>
                              <p style={{margin:0,fontSize:11,color:it.status==='erro'?'#fca5a5':'var(--label-4)',lineHeight:1.5,wordBreak:'break-word'}}>
                                <AlertTriangle size={10} style={{verticalAlign:-1,marginRight:4}}/>{it.motivo || it.erro_meta}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Paginação */}
                {fila && fila.total_filtrado>LIM && (
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10}}>
                    <span style={{fontSize:11,color:'var(--label-4)'}}>{pag*LIM+1}–{Math.min((pag+1)*LIM, fila.total_filtrado)} de {nf(fila.total_filtrado)}</span>
                    <div style={{display:'flex',gap:6}}>
                      <button disabled={pag===0} onClick={()=>setPag(p=>Math.max(0,p-1))} style={{padding:'5px 12px',borderRadius:7,border:'1px solid var(--sep)',background:'transparent',color:pag===0?'var(--label-4)':'var(--label-3)',cursor:pag===0?'not-allowed':'pointer',fontSize:11,fontWeight:700}}>Anterior</button>
                      <button disabled={(pag+1)*LIM>=fila.total_filtrado} onClick={()=>setPag(p=>p+1)} style={{padding:'5px 12px',borderRadius:7,border:'1px solid var(--sep)',background:'transparent',color:(pag+1)*LIM>=fila.total_filtrado?'var(--label-4)':'var(--label-3)',cursor:(pag+1)*LIM>=fila.total_filtrado?'not-allowed':'pointer',fontSize:11,fontWeight:700}}>Próxima</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ROI ATRIBUIDO — o retorno real: quem recebeu e comprou depois.
                Correlacao (compra pos-contato numa janela), nao prova de causa. */}
            {c.enviados>0 && (()=>{
              const conv = c.conversoes||0, rec = Number(c.receita_atribuida||0)
              const taxa = c.enviados ? Math.round(conv/c.enviados*100) : 0
              const jan  = c.janela_atrib||30
              return (
                <div style={{marginTop:11,paddingTop:11,borderTop:'1px solid var(--sep)',display:'flex',alignItems:'center',gap:22,flexWrap:'wrap'}}>
                  <div>
                    <p style={{margin:0,fontSize:9,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--label-4)'}}>Recompraram · {jan}d</p>
                    <p style={{margin:'3px 0 0',fontSize:16,fontWeight:800,color:'var(--label)'}}>{nf(conv)} <span style={{fontSize:11,fontWeight:600,color:conv>0?'#34d399':'var(--label-4)'}}>· {taxa}% dos enviados</span></p>
                  </div>
                  <div>
                    <p style={{margin:0,fontSize:9,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--label-4)'}}>Receita atribuída</p>
                    <p style={{margin:'3px 0 0',fontSize:16,fontWeight:800,color:rec>0?'#34d399':'var(--label-3)'}}>R$ {rec.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
                  </div>
                  <span title="Compras feitas por quem recebeu a campanha, na janela pós-contato. É correlação — não prova que a mensagem causou a compra." style={{marginLeft:'auto',fontSize:10,color:'var(--label-4)',cursor:'help',borderBottom:'1px dotted var(--label-4)'}}>correlação, não causa ⓘ</span>
                </div>
              )
            })()}
          </div>
        )
      })}
    </div>
  )
}

// ── Compositor de Campanha ────────────────────────────────────────────────────
// Substitui o "disparar para todos" cru. A audiencia e resolvida NO SERVIDOR a
// partir do filtro (o browser nunca carrega 40k clientes); o envio e uma FILA
// com ritmo + janela de horario, via template HSM da PageGatilhos — cliente
// frio esta fora da janela de 24h do WhatsApp, so template aprovado chega.
function CampanhaComposer({ api, filtro, telefonesManuais, onClose }) {
  const [produto,  setProduto]  = useState('')   // filtro por produto comprado
  const [preview,  setPreview]  = useState(null)
  const [gatilhos, setGatilhos] = useState([])
  const [nome,     setNome]     = useState('')
  const [gatilho,  setGatilho]  = useState('')
  const [cupom,    setCupom]    = useState('')
  const [ritmo,    setRitmo]    = useState(3)      // seg entre envios
  const [janIni,   setJanIni]   = useState(9)
  const [janFim,   setJanFim]   = useState(20)
  const [cooldown, setCooldown] = useState(7)
  const [ciente,   setCiente]   = useState(false)
  const [criando,  setCriando]  = useState(false)
  const [criada,   setCriada]   = useState(null)
  const [erro,     setErro]     = useState('')

  const manual = Array.isArray(telefonesManuais) && telefonesManuais.length > 0
  const filtroFinal = produto.trim() ? {...filtro, produto: produto.trim()} : filtro
  useEffect(()=>{
    if (manual) { setPreview({ enviaveis: telefonesManuais.length, em_cooldown: 0, receita_estimada: 0, por_segmento: [], total: telefonesManuais.length }); return }
    const t = setTimeout(()=>{
      fetch(`${api}/api/inteligencia/audiencia/preview`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({filtro: filtroFinal, cooldownDias:cooldown})
      }).then(r=>r.json()).then(setPreview).catch(()=>{})
    }, 400)
    return ()=>clearTimeout(t)
  },[cooldown, produto, manual])

  useEffect(()=>{
    fetch(`${api}/api/templates`).then(r=>r.json())
      .then(d=>{
        const ativos = (d.templates||[]).filter(t=>t.ativo)
        setGatilhos(ativos)
        const pref = ativos.find(t=>/reengaj|recuper|winback|volta/i.test(t.gatilho||t.nome||''))
        if (pref) setGatilho(pref.gatilho)
      }).catch(()=>{})
  },[])

  const enviaveis = preview ? preview.enviaveis : 0
  const msgsHora  = Math.round(3600/Math.max(1,ritmo))
  const horasJan  = Math.max(1, janFim - janIni)
  const diasEnvio = enviaveis ? (enviaveis/msgsHora/horasJan) : 0

  const criar = async () => {
    setErro(''); setCriando(true)
    try {
      const r = await fetch(`${api}/api/inteligencia/campanhas`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(manual
          ? {nome:nome.trim(),gatilho,telefonesAvulsos:telefonesManuais,ritmoSeg:ritmo,janelaIni:janIni,janelaFim:janFim,cooldownDias:cooldown,cupom:cupom.trim()||null}
          : {nome:nome.trim(),gatilho,filtro:filtroFinal,ritmoSeg:ritmo,janelaIni:janIni,janelaFim:janFim,cooldownDias:cooldown,cupom:cupom.trim()||null})
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro||'falha ao criar')
      setCriada(d)
    } catch(e){ setErro(e.message) }
    setCriando(false)
  }

  const Row = ({k,v}) => (
    <div style={{display:'flex',justifyContent:'space-between',fontSize:12.5,padding:'5px 0'}}>
      <span style={{color:'var(--label-3)'}}>{k}</span><span style={{color:'var(--label)',fontWeight:600}}>{v}</span>
    </div>
  )

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:60,background:'rgba(0,0,0,.5)',backdropFilter:'blur(2px)'}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:640,maxHeight:'88vh',zIndex:70,background:'var(--bg-2)',borderRadius:16,border:'1px solid var(--sep)',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 32px 80px rgba(0,0,0,.4)'}}>
        <div style={{height:2.5,background:'linear-gradient(90deg,#25D366,#25D36660)'}}/>
        <div style={{padding:'16px 22px 12px',borderBottom:'1px solid var(--sep)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <p style={{fontSize:16,fontWeight:800,color:'var(--label)',margin:0}}>Nova campanha</p>
            <p style={{fontSize:11.5,color:'var(--label-4)',margin:'3px 0 0'}}>Fila com ritmo controlado · templates aprovados da página de Gatilhos</p>
          </div>
          <button onClick={onClose} style={{background:'transparent',border:'none',color:'var(--label-4)',cursor:'pointer',fontSize:18}}>×</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'16px 22px'}}>
          {criada ? (
            <div style={{textAlign:'center',padding:'28px 10px'}}>
              <p style={{fontSize:34,margin:0}}>📣</p>
              <p style={{fontSize:16,fontWeight:800,color:'var(--label)',margin:'10px 0 6px'}}>Campanha #{criada.id} criada e rodando</p>
              <p style={{fontSize:13,color:'var(--label-3)',margin:0,lineHeight:1.6}}>
                {criada.pendentes} na fila · {criada.pulados} pulados (cooldown/blacklist)<br/>
                ~{msgsHora}/h dentro da janela {janIni}h–{janFim}h → ≈ <strong>{Math.ceil(diasEnvio||1)} dia(s)</strong> de envio.<br/>
                Sobrevive a restart; pause quando quiser em Campanhas.
              </p>
              <button onClick={onClose} style={{marginTop:18,padding:'9px 22px',borderRadius:10,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',cursor:'pointer',fontSize:13,fontWeight:700}}>Fechar</button>
            </div>
          ) : (
          <>
            {/* Audiência */}
            <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',margin:'0 0 8px'}}>{manual ? `Audiência (${telefonesManuais.length} selecionados à mão)` : 'Audiência (filtros atuais)'}</p>
            <div style={{borderRadius:12,border:'1px solid var(--sep)',background:'var(--fill)',padding:'12px 14px',marginBottom:16}}>
              {!preview ? <p style={{fontSize:12,color:'var(--label-4)',margin:0}}>Calculando audiência...</p> : (
                <>
                  <div style={{display:'flex',gap:18,marginBottom:10}}>
                    <div><p style={{fontSize:21,fontWeight:800,color:'#25D366',margin:0}}>{preview.enviaveis?.toLocaleString('pt-BR')}</p><p style={{fontSize:10.5,color:'var(--label-4)',margin:0}}>receberão</p></div>
                    <div><p style={{fontSize:21,fontWeight:800,color:'var(--label-3)',margin:0}}>{preview.em_cooldown?.toLocaleString('pt-BR')}</p><p style={{fontSize:10.5,color:'var(--label-4)',margin:0}}>em cooldown</p></div>
                    <div><p style={{fontSize:21,fontWeight:800,color:'#f59e0b',margin:0}}>R$ {Number(preview.receita_estimada||0).toLocaleString('pt-BR',{maximumFractionDigits:0})}</p><p style={{fontSize:10.5,color:'var(--label-4)',margin:0}}>receita estimada</p></div>
                  </div>
                  {(preview.por_segmento||[]).map(s=>(
                    <div key={s.segmento} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:11,color:'var(--label-3)',width:76,textTransform:'capitalize'}}>{s.segmento}</span>
                      <div style={{flex:1,height:5,background:'var(--sep)',borderRadius:99,overflow:'hidden'}}>
                        <div style={{width:`${preview.total?s.qtd/preview.total*100:0}%`,height:'100%',background:'#8b5cf6',borderRadius:99}}/>
                      </div>
                      <span style={{fontSize:11,color:'var(--label-4)',width:52,textAlign:'right'}}>{s.qtd.toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Config */}
            <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',margin:'0 0 8px'}}>Mensagem e ritmo</p>
            <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome da campanha (ex: Win-back perdidos julho)"
              style={{width:'100%',boxSizing:'border-box',padding:'10px 12px',borderRadius:10,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:13,marginBottom:10}}/>
            {!manual && <input value={produto} onChange={e=>setProduto(e.target.value)}
              placeholder="Só quem já comprou... (opcional — ex: corrente veneziana)"
              style={{width:'100%',boxSizing:'border-box',padding:'10px 12px',borderRadius:10,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:13,marginBottom:10}}/>}
            {produto.trim() && preview && preview.total===0 && (
              <p style={{fontSize:11.5,color:'#f59e0b',margin:'-4px 0 10px',lineHeight:1.5}}>
                Nenhum comprador conhecido desse produto ainda — os itens dos pedidos são
                sincronizados nas madrugadas (recentes primeiro). Tente amanhã ou amplie o termo.
              </p>
            )}
            <select value={gatilho} onChange={e=>setGatilho(e.target.value)}
              style={{width:'100%',boxSizing:'border-box',padding:'10px 12px',borderRadius:10,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:13,marginBottom:12}}>
              <option value="">— Template (gatilho HSM aprovado) —</option>
              {gatilhos.map(t=><option key={t.id} value={t.gatilho}>{t.nome||t.gatilho} ({t.gatilho})</option>)}
            </select>

            <input value={cupom} onChange={e=>setCupom(e.target.value.toUpperCase())}
              placeholder="Cupom da campanha (opcional — vai em {{cupom}} no template)"
              style={{width:'100%',boxSizing:'border-box',padding:'10px 12px',borderRadius:10,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:13,marginBottom:10,fontFamily:'monospace'}}/>
            <p style={{fontSize:10.5,color:'var(--label-4)',margin:'-4px 0 12px',lineHeight:1.6}}>
              O corpo é o template aprovado (fixo). Personalização por cliente via variáveis no template:{' '}
              <code style={{color:'var(--label-3)'}}>{'{{primeiro_nome}}'}</code> · <code style={{color:'var(--label-3)'}}>{'{{cupom}}'}</code> · <code style={{color:'var(--label-3)'}}>{'{{produto_top}}'}</code> (produto que o cliente mais compra) · <code style={{color:'var(--label-3)'}}>{'{{dias_sem_comprar}}'}</code>
            </p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:12}}>
              <label style={{fontSize:11,color:'var(--label-4)'}}>Ritmo
                <select value={ritmo} onChange={e=>setRitmo(Number(e.target.value))} style={{width:'100%',marginTop:4,padding:'8px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:12}}>
                  <option value={6}>10/min (cauteloso)</option>
                  <option value={3}>20/min (padrão)</option>
                  <option value={2}>30/min (rápido)</option>
                </select>
              </label>
              <label style={{fontSize:11,color:'var(--label-4)'}}>Início
                <select value={janIni} onChange={e=>setJanIni(Number(e.target.value))} style={{width:'100%',marginTop:4,padding:'8px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:12}}>
                  {[8,9,10].map(h=><option key={h} value={h}>{h}h</option>)}
                </select>
              </label>
              <label style={{fontSize:11,color:'var(--label-4)'}}>Fim
                <select value={janFim} onChange={e=>setJanFim(Number(e.target.value))} style={{width:'100%',marginTop:4,padding:'8px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:12}}>
                  {[18,19,20,21].map(h=><option key={h} value={h}>{h}h</option>)}
                </select>
              </label>
              <label style={{fontSize:11,color:'var(--label-4)'}}>Cooldown
                <select value={cooldown} onChange={e=>setCooldown(Number(e.target.value))} style={{width:'100%',marginTop:4,padding:'8px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:12}}>
                  {[3,7,14,30].map(d=><option key={d} value={d}>{d} dias</option>)}
                </select>
              </label>
            </div>

            {enviaveis>0 && (
              <div style={{borderRadius:10,background:'rgba(37,211,102,.05)',border:'1px solid rgba(37,211,102,.2)',padding:'10px 13px',marginBottom:12}}>
                <Row k="Velocidade" v={`${msgsHora}/hora, janela ${janIni}h–${janFim}h (Brasília)`}/>
                <Row k="Duração estimada" v={`≈ ${Math.ceil(diasEnvio)} dia(s) de envio`}/>
                <Row k="Proteções" v="dedup · cooldown · blacklist · retoma após restart"/>
              </div>
            )}

            {erro && <p style={{fontSize:12,color:'#ff4757',margin:'0 0 10px'}}>⚠️ {erro}</p>}

            <label style={{display:'flex',gap:8,alignItems:'flex-start',fontSize:12,color:'var(--label-3)',cursor:'pointer',marginBottom:14,lineHeight:1.5}}>
              <input type="checkbox" checked={ciente} onChange={e=>setCiente(e.target.checked)} style={{marginTop:2}}/>
              <span>Entendo que <strong style={{color:'var(--label)'}}>{enviaveis.toLocaleString('pt-BR')} mensagens de template</strong> serão enviadas ao longo de ~{Math.ceil(diasEnvio||1)} dia(s), e que volume alto com muitos bloqueios pode afetar a reputação do número no WhatsApp.</span>
            </label>

            <button disabled={!ciente||!nome.trim()||!gatilho||!enviaveis||criando} onClick={criar}
              style={{width:'100%',padding:'12px',borderRadius:11,border:'none',cursor:(!ciente||!nome.trim()||!gatilho||!enviaveis)?'not-allowed':'pointer',
                background:(!ciente||!nome.trim()||!gatilho||!enviaveis)?'var(--fill)':'#25D366',
                color:(!ciente||!nome.trim()||!gatilho||!enviaveis)?'var(--label-4)':'#04150b',fontSize:14,fontWeight:800}}>
              {criando?'Criando fila...':`Iniciar campanha para ${enviaveis.toLocaleString('pt-BR')} clientes`}
            </button>
          </>
          )}
        </div>
      </div>
    </>
  )
}

// ── Card de seção (cada funcionalidade num bloco separado) ────────────────────
function SecCard({ icon:Ic, title, accent='#fbbf24', right, children, style }) {
  return (
    <div style={{border:'1px solid var(--sep)',borderRadius:14,background:'var(--fill)',padding:'14px 16px',marginBottom:12,...style}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <div style={{width:26,height:26,borderRadius:7,background:`${accent}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Ic size={14} style={{color:accent}}/></div>
        <span style={{fontSize:11,fontWeight:800,letterSpacing:'.05em',textTransform:'uppercase',color:'var(--label-2)'}}>{title}</span>
        {right!=null && <span style={{marginLeft:'auto'}}>{right}</span>}
      </div>
      {children}
    </div>
  )
}

// ── Drawer de consulta do PEDIDO (aberto ao clicar num pedido) ────────────────
// Enriquece com pedido-completo-by-contato quando o telefone bate; renderiza
// SOMENTE o que o endpoint devolve (endereço/rastreio/NF só aparecem se vierem).
function PedidoSheet({ pedido, cliente, detalhe, onClose, api }) {
  const [full, setFull] = useState(null)
  const [load, setLoad] = useState(true)
  useEffect(()=>{
    const nome = cliente?.nome || ''
    if (!nome) { setLoad(false); return }
    fetch(`${api}/api/dashboard/pedido-completo-by-contato/${encodeURIComponent(nome)}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        const arr = d?.pedidos || []
        const m = arr.find(x=> String(x.numero)===String(pedido.numero) || (pedido.id_bling && String(x.id_bling||x.id)===String(pedido.id_bling)))
        setFull(m||null); setLoad(false)
      }).catch(()=>setLoad(false))
  },[])

  const p   = { ...pedido, ...(full||{}) }
  const det = detalhe || {}
  const itens    = p.itens || p.produtos || p.items || []
  const endereco = p.endereco || p.enderecoEntrega || p.endereco_entrega || null
  const rastreio = p.rastreio || p.codigo_rastreio || p.rastreamento || p.codigoRastreamento || null
  const nfe      = p.nota_fiscal || p.nfe || p.nf || null
  const servico  = det.servico || p.servico || (p.transporte && (p.transporte.servico || p.transporte.nome)) || null
  const qtd      = det.itens_qtd ?? (itens.length || null)

  const SIT = {6:['Em aberto','#fbbf24'],9:['Atendido','#34d399'],12:['Cancelado','#f87171'],15:['Em andamento','#60a5fa']}
  const sid = p.situacao ?? p.situacao_id
  const [sl,sc] = SIT[sid] || [sid!=null?`Situação ${sid}`:'—','#94a3b8']
  const STEP = sid===12 ? -1 : sid===9 ? 4 : sid===15 ? 2 : sid===6 ? 1 : 1
  const tl = [
    {label:'Pedido criado',                done: STEP>=0},
    {label:'Pagamento aprovado',           done: STEP>=1},
    {label:'Separado / em preparação',     done: STEP>=2},
    {label:'Coletado pela transportadora', done: STEP>=3},
    {label:'Entregue',                     done: STEP>=4},
  ]
  const cc = CANAL[p.canal] || {}

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(4,4,6,.72)',zIndex:60,backdropFilter:'blur(5px)'}}/>
      <div style={{position:'fixed',top:0,right:0,bottom:0,width:560,maxWidth:'97vw',zIndex:70,background:'var(--bg-2)',borderLeft:'1px solid var(--sep)',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'-24px 0 64px rgba(0,0,0,.5)'}}>
        <div style={{height:2.5,background:'linear-gradient(90deg,#60a5fa,#60a5fa55)',flexShrink:0}}/>

        {/* Cabeçalho */}
        <div style={{padding:'16px 20px 15px',flexShrink:0,borderBottom:'1px solid var(--sep)',position:'relative'}}>
          <button onClick={onClose} style={{position:'absolute',top:14,right:16,width:30,height:30,borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-4)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={13}/></button>
          <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:8,paddingRight:34,flexWrap:'wrap'}}>
            {p.canal && <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:10.5,fontWeight:800,textTransform:'capitalize',color:cc.cor||'var(--label-3)',background:(cc.cor||'#888')+'1e',border:`1px solid ${(cc.cor||'#888')}40`,padding:'2px 9px',borderRadius:99}}><span style={{width:6,height:6,borderRadius:99,background:cc.cor||'#888'}}/>{cc.label||p.canal}</span>}
            <span style={{fontSize:16,fontWeight:800,color:'var(--label)',letterSpacing:'-.3px'}}>Pedido #{p.numero}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <span style={{fontSize:22,fontWeight:800,color:'var(--label)'}}>{R(p.total)}</span>
            <span style={{fontSize:11,fontWeight:800,color:sc,background:sc+'22',border:`1px solid ${sc}40`,padding:'3px 10px',borderRadius:99}}>{sl}</span>
            <span style={{fontSize:12,color:'var(--label-4)'}}>{fmtD(p.data)}</span>
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
          {load && <p style={{fontSize:12,color:'var(--label-4)',marginBottom:12}}>Buscando detalhes do pedido…</p>}

          {/* Linha do tempo */}
          <SecCard icon={Package2} title="Linha do tempo do envio" accent="#fbbf24">
            {sid===12
              ? <p style={{fontSize:12.5,color:'#f87171',margin:0}}>Pedido cancelado.</p>
              : tl.map((t,i)=>(
                <div key={i} style={{display:'flex',gap:11,alignItems:'flex-start'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0}}>
                    <div style={{width:13,height:13,borderRadius:99,background:t.done?'#34d399':'transparent',border:`2px solid ${t.done?'#34d399':'var(--sep)'}`,marginTop:2}}/>
                    {i<tl.length-1 && <div style={{width:2,height:20,background:tl[i+1].done?'#34d399':'var(--sep)'}}/>}
                  </div>
                  <span style={{fontSize:12.5,color:t.done?'var(--label)':'var(--label-4)',fontWeight:t.done?600:400,paddingBottom:i<tl.length-1?8:0}}>{t.label}</span>
                </div>
              ))}
          </SecCard>

          {/* Entrega */}
          <SecCard icon={Truck} title="Entrega" accent="#fbbf24">
            {(cliente?.nome) && <p style={{fontSize:13,fontWeight:700,color:'var(--label)',margin:'0 0 4px'}}>{cliente.nome}</p>}
            {endereco
              ? <p style={{fontSize:12,color:'var(--label-3)',margin:'0 0 8px',lineHeight:1.5}}>{typeof endereco==='string'?endereco:[endereco.endereco||endereco.rua,endereco.numero,endereco.municipio||endereco.cidade,endereco.uf,endereco.cep].filter(Boolean).join(' · ')}</p>
              : <p style={{fontSize:11,color:'var(--label-4)',margin:'0 0 8px',lineHeight:1.5}}>Endereço completo vive no Monitor de Disparos.</p>}
            {rastreio && <p style={{fontSize:11.5,color:'var(--label-3)',margin:'0 0 8px',fontFamily:'monospace'}}>rastreio {rastreio}</p>}
            <div style={{display:'flex',gap:18,flexWrap:'wrap'}}>
              {servico && <div><p style={{fontSize:9,color:'var(--label-4)',margin:0,textTransform:'uppercase',letterSpacing:'.06em'}}>Modalidade</p><p style={{fontSize:12.5,color:'var(--label)',margin:'2px 0 0',fontWeight:600}}>{servico}</p></div>}
              {p.canal && <div><p style={{fontSize:9,color:'var(--label-4)',margin:0,textTransform:'uppercase',letterSpacing:'.06em'}}>Canal</p><p style={{fontSize:12.5,color:'var(--label)',margin:'2px 0 0',fontWeight:600,textTransform:'capitalize'}}>{cc.label||p.canal}</p></div>}
            </div>
          </SecCard>

          {/* Produtos */}
          <SecCard icon={Boxes} title="Produtos" accent="#fbbf24" right={qtd!=null?<span style={{fontSize:11,color:'var(--label-4)'}}>{qtd} un</span>:null}>
            {itens.length>0
              ? itens.map((it,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:11,padding:'8px 0',borderBottom:i<itens.length-1?'1px solid var(--sep)':'none'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12.5,fontWeight:600,color:'var(--label)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.descricao||it.nome||'Item'}</p>
                    <p style={{fontSize:10.5,color:'var(--label-4)',margin:'2px 0 0',fontFamily:'monospace'}}>{it.codigo||it.sku||''} {(it.quantidade||it.qtd)!=null && `· ${it.quantidade||it.qtd} un`}</p>
                  </div>
                  {(it.valor!=null||it.valor_total!=null) && <span style={{fontSize:12.5,fontWeight:700,color:'var(--label)',flexShrink:0}}>{R(it.valor_total ?? it.valor)}</span>}
                </div>
              ))
              : <p style={{fontSize:12,color:'var(--label-4)',margin:0,lineHeight:1.6}}>{qtd!=null?`${qtd} item(ns) neste pedido.`:'Itens não detalhados por este endpoint.'} Total do pedido: <strong style={{color:'var(--label-2)'}}>{R(p.total)}</strong>.</p>}
          </SecCard>

          {/* Nota fiscal — só se vier */}
          {nfe && (
            <SecCard icon={FileText} title="Nota fiscal" accent="#f87171">
              <p style={{fontSize:12.5,color:'var(--label)',margin:0}}>{typeof nfe==='string'?nfe:(nfe.numero?`NF-e ${nfe.numero}`:'') } {nfe.situacao&&<span style={{color:'var(--label-4)'}}>· {nfe.situacao}</span>}</p>
            </SecCard>
          )}

          {/* Comprador (mini) */}
          <SecCard icon={Users} title="Comprador" accent="#f472b6">
            <div style={{display:'flex',alignItems:'center',gap:11}}>
              <Avatar nome={cliente?.nome} size={38}/>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:13,fontWeight:700,color:'var(--label)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cliente?.nome||'—'}</p>
                {cliente?.telefone && <p style={{fontSize:11,color:'var(--label-4)',margin:'1px 0 0',fontFamily:'monospace'}}>{cliente.telefone}</p>}
              </div>
              {cliente?.pedidosTotal!=null && <div style={{textAlign:'right',flexShrink:0}}><p style={{fontSize:15,fontWeight:800,color:'var(--label)',margin:0}}>{cliente.pedidosTotal}</p><p style={{fontSize:9,color:'var(--label-4)',margin:0,textTransform:'uppercase'}}>pedidos</p></div>}
            </div>
          </SecCard>

          <p style={{fontSize:10.5,color:'var(--label-4)',lineHeight:1.6,margin:'4px 2px 0'}}>Repasse, margem, tarifa por item, SLA, etiqueta e status de NF-e vêm do módulo de pedidos do canal — não deste endpoint da Inteligência.</p>
        </div>
      </div>
    </>
  )
}

// ── Sheet lateral do cliente ──────────────────────────────────────────────────
function ClienteSheet({ cliente, onClose, api }) {
  const [tab,     setTab]     = useState('perfil')
  // Perfil RICO do servidor: pedidos reais (base local), TOP PRODUTOS que o
  // cliente compra (itens sob demanda do Bling, com cache) e historico de
  // disparos — a informacao estrategica que faltava no drawer.
  const [rico,     setRico]    = useState(null)
  const [loadRico, setLoadRico]= useState(true)
  const [erroRico, setErroRico]= useState('')
  useEffect(()=>{
    const tel = (cliente.telefone||'').replace(/\D/g,'')
    if (!tel) { setLoadRico(false); return }
    fetch(`${api}/api/inteligencia/cliente/${tel}`)
      .then(async r=>{
        if (r.ok) return r.json()
        const d = await r.json().catch(()=>({}))
        throw new Error(`${r.status}: ${d.erro||'endpoint indisponível'}`)
      })
      .then(d=>{ setRico(d); setLoadRico(false) })
      .catch(e=>{ setErroRico(String(e.message)); setLoadRico(false) })
  },[])

  // Fallback: se o objeto da LISTA vier sem os campos (cache do navegador com o
  // payload antigo), completa com o perfil do servidor — uma fonte cobre a outra.
  const pf = rico?.perfil || {}
  cliente = {
    ...cliente,
    pedidosTotal:   cliente.pedidosTotal   ?? pf.pedidos_total,
    cicloDias:      cliente.cicloDias      ?? pf.ciclo_dias,
    primeiroPedido: cliente.primeiroPedido ?? pf.primeiro_pedido,
    ultimoPedido:   cliente.ultimoPedido   ?? pf.ultimo_pedido,
    email:          cliente.email          ?? pf.email,
    documento:      cliente.documento      ?? pf.documento,
    scoreRFM:       cliente.scoreRFM       ?? pf.score_rfm,
    rfm:            cliente.rfm            ?? { r: pf.rfm_r, f: pf.rfm_f, m: pf.rfm_m },
    acaoRecomendada:cliente.acaoRecomendada?? pf.acao_recomendada,
  }
  const [pedidos, setPedidos] = useState([])
  const [loadPed, setLoadPed] = useState(false)
  const [cp,      setCp]      = useState('')
  const [sending, setSend]    = useState(false)
  const [sent,    setSent]    = useState(false)
  const [msg,     setMsg]     = useState('')
  const s = SEG[cliente.segmento] || SEG.regular
  const Icon = s.Icon

  const copy = (v,k) => { navigator.clipboard.writeText(String(v??'')); setCp(k); setTimeout(()=>setCp(''),2000) }

  useEffect(()=>{
    if (pedidos.length) return
    // 1a fonte: pedidos reais da base local (por TELEFONE — inequivoco).
    // A busca antiga por NOME fica so como fallback: nome nao e chave.
    if (rico?.pedidos?.length) { setPedidos(rico.pedidos.map(p=>({numero:p.numero,data:p.data,total:p.total,situacao:p.situacao_id,canal:p.canal,id_bling:p.id_bling}))); return }
    setLoadPed(true)
    fetch(`${api}/api/dashboard/pedido-completo-by-contato/${encodeURIComponent(cliente.nome||'')}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(d?.pedidos) setPedidos(d.pedidos); setLoadPed(false)})
      .catch(()=>setLoadPed(false))
  },[rico])

  const enviarWA = async () => {
    if (!msg.trim() || !cliente.telefone) return
    setSend(true)
    try {
      await fetch(`${api}/api/dashboard/manual/${cliente.telefone.replace(/\D/g,'')}`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({mensagem: msg.trim()})
      })
      setSent(true); setMsg('')
      setTimeout(()=>setSent(false), 3000)
    } catch {}
    setSend(false)
  }

  const TABS = [
    {id:'perfil',  label:'Perfil'},
    {id:'rfm',     label:'Score RFM'},
    {id:'pedidos', label:'Pedidos'},
    {id:'produtos',label:'Produtos'},
    {id:'msg',     label:'Mensagens'},
  ]

  const [pedidoSel, setPedidoSel] = useState(null)
  const SECT = {fontSize:9.5,fontWeight:800,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',margin:'0 0 10px'}
  const pressao = (rico?.disparos_recentes||[]).filter(d=>{ const t=new Date(d.criado_em).getTime(); return !isNaN(t) && (Date.now()-t) < 7*86400000 }).length
  const pcor = pressao<=3?'#34d399':pressao<=5?'#fbbf24':'#f87171'
  const steps = ['Criado','Pago','Separado','Enviado','Entregue']

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(4,4,6,.6)',zIndex:40,backdropFilter:'blur(4px)'}}/>
      <div style={{position:'fixed',top:0,right:0,bottom:0,width:520,maxWidth:'96vw',zIndex:50,background:'var(--bg-2)',borderLeft:'1px solid var(--sep)',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'-20px 0 56px rgba(0,0,0,.4)'}}>
        <div style={{height:2.5,background:`linear-gradient(90deg,${s.cor},${s.cor}55)`,flexShrink:0}}/>

        <div style={{padding:'16px 20px 14px',flexShrink:0,borderBottom:'1px solid var(--sep)',position:'relative'}}>
          <button onClick={onClose} style={{position:'absolute',top:14,right:16,width:30,height:30,borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-4)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={13}/></button>
          <div style={{display:'flex',alignItems:'center',gap:14,paddingRight:34}}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,flexShrink:0}}>
              <ScoreRing score={cliente.scoreRFM||0} size={54}/>
              <span style={{fontSize:8,fontWeight:800,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--label-4)'}}>saúde</span>
            </div>
            <div style={{minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:5}}>
                <span style={{fontSize:18,fontWeight:800,color:'var(--label)',letterSpacing:'-.3px'}}>{cliente.nome||'—'}</span>
                <SegChip seg={cliente.segmento}/>
              </div>
              <div style={{display:'flex',gap:9,alignItems:'center',flexWrap:'wrap'}}>
                {cliente.canal && <CanalChip canal={cliente.canal}/>}
                {cliente.telefone && (
                  <button onClick={()=>copy(cliente.telefone,'tel')} style={{display:'flex',alignItems:'center',gap:4,fontSize:11.5,color:'var(--label-4)',background:'transparent',border:'none',cursor:'pointer',padding:0,fontFamily:'monospace'}}>
                    <Phone size={10}/>{cliente.telefone}{cp==='tel'?<Check size={9} style={{color:'#34d399'}}/>:<Copy size={9}/>}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div style={{display:'flex',marginTop:14,borderTop:'1px solid var(--sep)',borderBottom:'1px solid var(--sep)'}}>
            {[
              {l:'Pedidos',     v:fmt(cliente.pedidosTotal||0),   c:'var(--label)'},
              {l:'LTV total',   v:Rk(cliente.totalGasto||0),      c:s.cor},
              {l:'Ticket',      v:Rk(cliente.ticketMedio||0),     c:'var(--label-2)'},
              {l:'Sem comprar', v:`${cliente.diasSemComprar||0}d`, c: cliente.diasSemComprar>60?'#f87171':cliente.diasSemComprar>30?'#fb923c':'#34d399'},
            ].map((k,i,a)=>(
              <div key={k.l} style={{flex:1,textAlign:'center',padding:'11px 6px',borderRight:i<a.length-1?'1px solid var(--sep)':'none'}}>
                <div style={{fontSize:17,fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</div>
                <div style={{fontSize:8.5,color:'var(--label-4)',marginTop:3,textTransform:'uppercase',letterSpacing:'.06em'}}>{k.l}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:5}}>
              <span style={{fontWeight:800,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--label-4)'}}>Pressão de msgs</span>
              <span style={{color:pcor,fontWeight:700}}>{pressao} / 7d</span>
            </div>
            <div style={{height:6,background:'var(--fill)',borderRadius:99,overflow:'hidden'}}><div style={{width:`${Math.min(100,pressao/7*100)}%`,height:'100%',borderRadius:99,background:pcor}}/></div>
            <p style={{fontSize:9.5,color:'var(--label-4)',margin:'5px 0 0'}}>{pressao<=3?'saudável — espaço para comunicar':'atenção — perto do limite semanal'}</p>
          </div>
        </div>

        <div style={{display:'flex',gap:2,padding:'0 12px',flexShrink:0,borderBottom:'1px solid var(--sep)',background:'var(--bg-2)'}}>
          {[{id:'perfil',label:'Perfil',Ic:User},{id:'pedidos',label:'Pedidos',Ic:ShoppingCart},{id:'produtos',label:'Produtos',Ic:Package},{id:'mensagens',label:'Mensagens',Ic:MessageSquare}].map(t=>{ const on=tab===t.id; return (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{display:'flex',alignItems:'center',gap:6,padding:'11px 13px',background:'transparent',border:'none',borderBottom:`2px solid ${on?'#8b5cf6':'transparent'}`,color:on?'var(--label)':'var(--label-4)',cursor:'pointer',fontSize:12.5,fontWeight:on?700:500,marginBottom:-1,whiteSpace:'nowrap'}}>
              <t.Ic size={14}/>{t.label}
            </button>
          )})}
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
          {loadRico && <p style={{fontSize:12.5,color:'var(--label-4)',marginBottom:14}}>Carregando perfil rico…</p>}
          {erroRico && <p style={{fontSize:11.5,color:'#f87171',lineHeight:1.5,marginBottom:14}}>⚠️ Perfil rico indisponível ({erroRico}).</p>}

{tab==='perfil' && (<>
          <SecCard icon={BarChart3} title="Score RFM" accent="#8b5cf6">
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <ScoreRing score={cliente.scoreRFM||0} size={56}/>
              <div style={{flex:1}}>
                {[
                  {label:'R · Recência',   value:cliente.rfm?.r||0, desc:`${cliente.diasSemComprar||0}d sem comprar`, cor:(cliente.rfm?.r||0)>=4?'#34d399':(cliente.rfm?.r||0)>=3?'#fbbf24':'#f87171'},
                  {label:'F · Frequência', value:cliente.rfm?.f||0, desc:`${cliente.pedidosTotal||0} pedidos`,        cor:'#60a5fa'},
                  {label:'M · Valor',      value:cliente.rfm?.m||0, desc:`ticket ${Rk(cliente.ticketMedio||0)}`,      cor:'#8b5cf6'},
                ].map(d=>(
                  <div key={d.label} style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:11,fontWeight:600,color:'var(--label-2)'}}>{d.label}</span>
                      <span style={{fontSize:10,color:'var(--label-4)'}}>{d.desc}</span>
                    </div>
                    <div style={{height:6,background:'var(--bg-2)',borderRadius:99,overflow:'hidden'}}><div style={{width:`${d.value/5*100}%`,height:'100%',borderRadius:99,background:d.cor}}/></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{marginTop:10,padding:'11px 13px',borderRadius:10,background:`${s.cor}12`,border:`1px solid ${s.cor}25`}}>
              <p style={{fontSize:12,color:'var(--label-2)',margin:0,lineHeight:1.5}}>{cliente.acaoRecomendada || 'Envie uma mensagem personalizada baseada no histórico deste cliente.'}</p>
            </div>
          </SecCard>

          {cliente.cicloDias > 0 && (
            <SecCard icon={Repeat} title="Ciclo de compra" accent="#8b5cf6">
              <p style={{fontSize:12.5,color:'var(--label-3)',margin:0,lineHeight:1.5}}>
                Compra a cada <strong style={{color:'#8b5cf6'}}>{cliente.cicloDias} dias</strong> em média.
                {cliente.diasSemComprar >= cliente.cicloDias*.8
                  ? <span style={{color:'#fb923c'}}> Está no ponto de recompra!</span>
                  : <span style={{color:'var(--label-4)'}}> Próxima estimada em {Math.max(0,cliente.cicloDias-cliente.diasSemComprar)} dias.</span>}
              </p>
            </SecCard>
          )}

          <SecCard icon={Info} title="Dados do cliente" accent="#60a5fa">
            {[
              {l:'E-mail',        v:cliente.email,               cpk:'em',  link:true},
              {l:'CPF/CNPJ',      v:cliente.documento,           cpk:'doc', mono:true},
              {l:'Última compra', v:fmtD(cliente.ultimoPedido)},
              {l:'1ª compra',     v:fmtD(cliente.primeiroPedido)},
              {l:'Canal',         v:CANAL[cliente.canal]?.label},
            ].filter(r=>r.v && r.v!=='—').map((row,ri,ra)=>(
              <div key={row.l} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:ri<ra.length-1?'1px solid var(--sep)':'none'}}>
                <span style={{fontSize:11.5,color:'var(--label-4)'}}>{row.l}</span>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:12.5,color:row.link?'#60a5fa':'var(--label)',fontWeight:500,fontFamily:row.mono?'monospace':'inherit'}}>{row.v}</span>
                  {row.cpk && <button onClick={()=>copy(row.v,row.cpk)} style={{display:'flex',alignItems:'center',padding:'2px 5px',borderRadius:5,border:'1px solid var(--sep)',background:'transparent',color:cp===row.cpk?'#34d399':'var(--label-4)',cursor:'pointer'}}>{cp===row.cpk?<Check size={9}/>:<Copy size={9}/>}</button>}
                </div>
              </div>
            ))}
            {!cliente.email && !cliente.documento && <p style={{fontSize:11,color:'var(--label-4)',margin:0,lineHeight:1.5}}>E-mail e CPF aparecem quando o cadastro do Bling traz esses campos. Endereço completo vive no Monitor de Disparos.</p>}
          </SecCard>

</>)}

          {tab==='produtos' && (
          <SecCard icon={Package} title="Produtos que compra" accent="#fbbf24" right={rico?.produtos_cobertura?<span style={{fontSize:10,color:'var(--label-4)'}}>{rico.produtos_cobertura}</span>:null}>
            {loadRico && <p style={{fontSize:12,color:'var(--label-4)',margin:0}}>Carregando…</p>}
            {!loadRico && !(rico?.produtos?.length) && <p style={{fontSize:11.5,color:'var(--label-4)',lineHeight:1.6,margin:0}}>Sem itens conhecidos ainda — buscados dos pedidos recentes ao abrir o perfil.</p>}
            {(rico?.produtos||[]).map((p,i,a)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<a.length-1?'1px solid var(--sep)':'none'}}>
                {p.imagem
                  ? <img src={p.imagem} alt="" style={{width:38,height:38,borderRadius:8,objectFit:'cover',flexShrink:0,border:'1px solid var(--sep)'}} onError={e=>{e.currentTarget.style.display='none'}}/>
                  : <span style={{fontSize:11,fontWeight:800,color:'var(--label-4)',width:38,height:38,borderRadius:8,background:'var(--sep)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}º</span>}
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:12.5,fontWeight:600,color:'var(--label)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.descricao}</p>
                  <p style={{fontSize:11,color:'var(--label-4)',margin:'2px 0 0'}}><strong style={{color:'var(--label-2)'}}>{p.quantidade} un</strong> · {Rk(p.valor_total)}{p.pedidos?.length>0 && <> · {p.pedidos.map(n=>`#${n}`).join(', ')}</>}</p>
                </div>
              </div>
            ))}
          </SecCard>

)}

          {tab==='pedidos' && (
          <SecCard icon={ShoppingCart} title="Pedidos" accent="#60a5fa" right={<span style={{fontSize:10,color:'var(--label-4)'}}>toque para consultar</span>}>
            {loadPed && <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',color:'var(--label-4)',fontSize:12}}><RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Carregando…</div>}
            {!loadPed && pedidos.length===0 && <p style={{fontSize:12,color:'var(--label-4)',margin:0}}>Histórico não disponível.</p>}
            {pedidos.map((p,i,a)=>{
              const SIT = {6:['Em aberto','#fbbf24'],9:['Atendido','#34d399'],12:['Cancelado','#f87171'],15:['Em andamento','#60a5fa']}
              const sid = p.situacao ?? p.situacao_id
              const [sl,sc] = SIT[sid] || [sid!=null?`Sit. ${sid}`:'—','#94a3b8']
              const det = rico?.pedidosDetalhe?.[String(p.id_bling||'')] || {}
              const STEP = sid===12 ? -1 : sid===9 ? 3 : sid===15 ? 2 : sid===6 ? 1 : 0
              return (
              <div key={i} onClick={()=>setPedidoSel(p)} className="iq-ped-row" style={{padding:'11px 8px',margin:'0 -8px',borderRadius:9,borderBottom:i<a.length-1?'1px solid var(--sep)':'none',opacity:sid===12?.6:1,cursor:'pointer'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:12,fontWeight:600,color:'var(--accent)',fontFamily:'monospace',flexShrink:0,minWidth:56}}>#{p.numero}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,color:'var(--label)',margin:0,fontWeight:500}}>{fmtD(p.data)}{p.canal && <span style={{marginLeft:7,fontSize:10,color:'var(--label-4)',textTransform:'capitalize'}}>{p.canal}</span>}</p>
                    <p style={{fontSize:11,color:'var(--label-4)',margin:'2px 0 0'}}>{det.itens_qtd!=null ? `${det.itens_qtd} un` : '—'}{det.servico && <> · {det.servico}</>}</p>
                  </div>
                  <span style={{fontSize:10,fontWeight:800,color:sc,background:sc+'22',border:`1px solid ${sc}40`,padding:'2px 8px',borderRadius:99,flexShrink:0}}>{sl}</span>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--label)',flexShrink:0,minWidth:66,textAlign:'right'}}>{R(p.total)}</span>
                  <ChevronRight size={15} style={{color:'var(--label-4)',flexShrink:0}}/>
                </div>
                {sid!==12 && (
                  <div style={{display:'flex',alignItems:'center',marginTop:9,paddingLeft:56,paddingRight:22}}>
                    {steps.map((st,si)=>(
                      <div key={si} style={{display:'flex',alignItems:'center',flex:si<4?1:'0 0 auto'}}>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                          <div style={{width:15,height:15,borderRadius:99,display:'flex',alignItems:'center',justifyContent:'center',background:si<=STEP?'#34d399':'transparent',border:`1.5px solid ${si<=STEP?'#34d399':'var(--sep)'}`,color:'#04160e'}}>{si<=STEP && <Check size={8}/>}</div>
                          <span style={{fontSize:7.5,color:si<=STEP?'var(--label-3)':'var(--label-4)'}}>{st}</span>
                        </div>
                        {si<4 && <div style={{flex:1,height:1.5,background:si<STEP?'#34d399':'var(--sep)',margin:'0 2px',marginBottom:12}}/>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )})}
          </SecCard>

)}

          {tab==='mensagens' && (rico?.disparos_recentes?.length > 0 ? (
            <SecCard icon={MessageSquare} title="Histórico de mensagens" accent="#34d399" style={{marginBottom:6}}>
              {rico.disparos_recentes.map((d,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0'}}>
                  <span style={{fontSize:10,color:'var(--label-4)',fontFamily:'monospace',width:64,flexShrink:0}}>{String(d.criado_em).slice(0,10)}</span>
                  <div style={{width:26,height:26,borderRadius:8,background:'var(--bg-2)',border:'1px solid var(--sep)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><MessageSquare size={12} style={{color:'var(--label-4)'}}/></div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:0,fontSize:12,color:'var(--label)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.gatilho}</p>
                    <p style={{margin:0,fontSize:10,color:'var(--label-4)'}}>{d.origem}</p>
                  </div>
                  <span style={{fontSize:9,fontWeight:800,textTransform:'uppercase',color:d.status==='enviado'?'#34d399':'var(--label-4)',background:d.status==='enviado'?'rgba(52,211,153,.12)':'var(--bg-2)',padding:'2px 8px',borderRadius:99,flexShrink:0}}>{d.status}</span>
                </div>
              ))}
            </SecCard>
          ) : <SecCard icon={MessageSquare} title="Histórico de mensagens" accent="#34d399" style={{marginBottom:6}}><p style={{fontSize:12,color:'var(--label-4)',margin:0}}>Nenhuma mensagem registrada ainda.</p></SecCard>)}
        </div>

        <div style={{flexShrink:0,padding:'12px 20px',borderTop:'1px solid var(--sep)',background:'var(--bg-2)'}}>
          {cliente.telefone ? (
            <>
              <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder={`Mensagem para ${(cliente.nome||'').split(' ')[0]}…`} rows={2}
                style={{width:'100%',resize:'vertical',border:'1px solid var(--sep)',borderRadius:9,padding:'9px 11px',fontSize:12.5,background:'var(--fill)',color:'var(--label)',fontFamily:'inherit',outline:'none',lineHeight:1.5,boxSizing:'border-box',marginBottom:8}}/>
              <button onClick={enviarWA} disabled={sending||!msg.trim()}
                style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'10px',borderRadius:9,border:'none',background:sent?'rgba(52,211,153,.15)':'#25D366',color:sent?'#34d399':'#04150b',cursor:msg.trim()?'pointer':'not-allowed',fontSize:13,fontWeight:800,opacity:!msg.trim()?.6:1}}>
                {sent?<><CheckCircle size={14}/> Enviado!</>:sending?<><RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> Enviando…</>:<><MessageSquare size={14}/> Enviar no WhatsApp</>}
              </button>
              <p style={{fontSize:10,color:'var(--label-4)',margin:'8px 0 0',textAlign:'center'}}>Mensagem avulsa. Para disparo em massa com template, use <strong style={{color:'var(--label-3)'}}>Campanhas</strong>.</p>
            </>
          ) : (
            <p style={{fontSize:12,color:'#f87171',textAlign:'center',margin:0}}>⚠ Sem telefone cadastrado — mensagem indisponível.</p>
          )}
        </div>
      </div>

      {pedidoSel && <PedidoSheet pedido={pedidoSel} cliente={cliente} detalhe={rico?.pedidosDetalhe?.[String(pedidoSel.id_bling||'')]} api={api} onClose={()=>setPedidoSel(null)}/>}
    </>
  )
}



// ── Modal de Configurações ────────────────────────────────────────────────────
function ConfigModal({ config, onSave, onClose }) {
  const [cfg, setCfg] = useState(config || {
    analises: {
      vip_sumido:         { ativo:true,  dias:35,   label:'VIP sem comprar' },
      primeira_compra:    { ativo:true,  dias:20,   label:'1ª compra sem retorno' },
      ciclo_recompra:     { ativo:true,  margem:80, label:'Ciclo de recompra' },
      produto_alta:       { ativo:true,  min:3,     label:'Produto em alta' },
      estoque_critico:    { ativo:true,  limite:10, label:'Estoque crítico' },
      avise_me:           { ativo:true,              label:'Produto voltou ao estoque' },
      entregue_semfeedback:{ativo:true,  dias:7,    label:'Entregue sem avaliação' },
      rastreio_parado:    { ativo:true,  dias:5,    label:'Rastreio sem movimento' },
      ocorrencia_pendente:{ ativo:true,  horas:48,  label:'Ocorrência sem resolução' },
    },
    segmentos: {
      dias_risco:   30,
      dias_perdido: 90,
      vip_min_pedidos: 3,
      vip_min_valor: 500,
    },
    job_frequencia: '4h',
    canais_excluidos: [],
  })

  const toggle = (key) => setCfg(p => ({
    ...p, analises: { ...p.analises, [key]: { ...p.analises[key], ativo: !p.analises[key].ativo } }
  }))

  const setParam = (key, param, val) => setCfg(p => ({
    ...p, analises: { ...p.analises, [key]: { ...p.analises[key], [param]: val } }
  }))

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:60,backdropFilter:'blur(4px)'}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:580,maxHeight:'80vh',zIndex:70,background:'var(--bg-2)',borderRadius:16,border:'1px solid var(--sep)',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 32px 80px rgba(0,0,0,.35)'}}>
        {/* Header */}
        <div style={{padding:'18px 24px',borderBottom:'1px solid var(--sep)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,borderRadius:9,background:'rgba(124,106,247,.12)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <SlidersHorizontal size={16} style={{color:'#8b5cf6'}}/>
            </div>
            <div>
              <p style={{fontSize:15,fontWeight:700,color:'var(--label)',margin:0}}>Configurações da Inteligência</p>
              <p style={{fontSize:11.5,color:'var(--label-4)',margin:0}}>Controle quais análises a Bia executa</p>
            </div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label-4)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <X size={13}/>
          </button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>

          {/* Análises automáticas */}
          <p style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',marginBottom:12}}>Análises automáticas</p>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
            {Object.entries(cfg.analises).map(([key, analise])=>{
              const tipo = key.includes('estoque')||key.includes('avise') ? 'estoque'
                : key.includes('rastreio')||key.includes('entregue')||key.includes('ocorrencia') ? 'posVenda'
                : key.includes('produto') ? 'oportunidade' : 'urgente'
              const t = TIPO_SUGESTAO[tipo] || TIPO_SUGESTAO.oportunidade
              const Icon = t.Icon
              return (
                <div key={key} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 13px',borderRadius:10,background:analise.ativo?`${t.cor}05`:'var(--fill)',border:`1px solid ${analise.ativo?t.cor+'25':'var(--sep)'}`,transition:'all .2s'}}>
                  <div style={{width:30,height:30,borderRadius:8,background:`${t.cor}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Icon size={14} style={{color:t.cor}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:600,color:'var(--label)',margin:'0 0 2px'}}>{analise.label}</p>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      {analise.dias!==undefined&&<span style={{fontSize:11.5,color:'var(--label-4)'}}>Alertar após <input type="number" value={analise.dias} onChange={e=>setParam(key,'dias',Number(e.target.value))} style={{width:40,textAlign:'center',border:'1px solid var(--sep)',borderRadius:5,padding:'1px 4px',fontSize:11.5,background:'var(--fill)',color:'var(--label)'}} /> dias</span>}
                      {analise.horas!==undefined&&<span style={{fontSize:11.5,color:'var(--label-4)'}}>Alertar após <input type="number" value={analise.horas} onChange={e=>setParam(key,'horas',Number(e.target.value))} style={{width:40,textAlign:'center',border:'1px solid var(--sep)',borderRadius:5,padding:'1px 4px',fontSize:11.5,background:'var(--fill)',color:'var(--label)'}} /> horas</span>}
                      {analise.limite!==undefined&&<span style={{fontSize:11.5,color:'var(--label-4)'}}>Alertar abaixo de <input type="number" value={analise.limite} onChange={e=>setParam(key,'limite',Number(e.target.value))} style={{width:40,textAlign:'center',border:'1px solid var(--sep)',borderRadius:5,padding:'1px 4px',fontSize:11.5,background:'var(--fill)',color:'var(--label)'}} /> unidades</span>}
                      {analise.min!==undefined&&<span style={{fontSize:11.5,color:'var(--label-4)'}}>Mínimo <input type="number" value={analise.min} onChange={e=>setParam(key,'min',Number(e.target.value))} style={{width:40,textAlign:'center',border:'1px solid var(--sep)',borderRadius:5,padding:'1px 4px',fontSize:11.5,background:'var(--fill)',color:'var(--label)'}} /> clientes</span>}
                    </div>
                  </div>
                  {/* Toggle */}
                  <button onClick={()=>toggle(key)} style={{width:40,height:22,borderRadius:99,border:'none',cursor:'pointer',background:analise.ativo?'#22c55e':'var(--sep)',position:'relative',flexShrink:0,transition:'background .2s'}}>
                    <div style={{width:16,height:16,borderRadius:'50%',background:'white',position:'absolute',top:3,left:analise.ativo?21:3,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}/>
                  </button>
                </div>
              )
            })}
          </div>

          {/* Critérios de segmentação */}
          <p style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',marginBottom:12}}>Critérios de segmentação</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
            {[
              {label:'Dias para "Em risco"',    key:'dias_risco',     unit:'dias'},
              {label:'Dias para "Perdido"',     key:'dias_perdido',   unit:'dias'},
              {label:'Pedidos mínimos p/ VIP',  key:'vip_min_pedidos',unit:'pedidos'},
              {label:'Valor mínimo p/ VIP',     key:'vip_min_valor',  unit:'R$'},
            ].map(f=>(
              <div key={f.key} style={{padding:'10px 12px',borderRadius:9,background:'var(--fill)',border:'1px solid var(--sep)'}}>
                <p style={{fontSize:11,color:'var(--label-4)',margin:'0 0 5px'}}>{f.label}</p>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <input type="number" value={cfg.segmentos[f.key]||0}
                    onChange={e=>setCfg(p=>({...p,segmentos:{...p.segmentos,[f.key]:Number(e.target.value)}}))}
                    style={{flex:1,border:'1px solid var(--sep)',borderRadius:6,padding:'4px 8px',fontSize:13,fontWeight:600,background:'var(--bg)',color:'var(--label)',textAlign:'center'}}/>
                  <span style={{fontSize:11,color:'var(--label-4)',flexShrink:0}}>{f.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Frequência do job */}
          <p style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--label-4)',marginBottom:8}}>Frequência da análise automática</p>
          <div style={{display:'flex',gap:7,marginBottom:20}}>
            {['1h','2h','4h','8h','24h'].map(f=>(
              <button key={f} onClick={()=>setCfg(p=>({...p,job_frequencia:f}))} style={{flex:1,padding:'7px',borderRadius:8,border:`1px solid ${cfg.job_frequencia===f?'var(--accent)':'var(--sep)'}`,background:cfg.job_frequencia===f?'var(--accent-dim)':'transparent',color:cfg.job_frequencia===f?'var(--accent)':'var(--label-4)',cursor:'pointer',fontSize:12.5,fontWeight:cfg.job_frequencia===f?700:400}}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:'14px 24px',borderTop:'1px solid var(--sep)',display:'flex',gap:8,flexShrink:0}}>
          <button onClick={onClose} style={{flex:1,padding:'10px',borderRadius:9,border:'1px solid var(--sep)',background:'transparent',color:'var(--label-3)',cursor:'pointer',fontSize:13,fontWeight:500}}>
            Cancelar
          </button>
          <button onClick={()=>onSave(cfg)} style={{flex:2,padding:'10px',borderRadius:9,border:'none',background:'var(--accent)',color:'white',cursor:'pointer',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
            <Check size={14}/> Salvar configurações
          </button>
        </div>
      </div>
    </>
  )
}


// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL — PageInteligencia
// ══════════════════════════════════════════════════════════════════════════════
// ── ConfigSheet — a tela de Configuracoes (restaurada + melhorada) ────────────
// Edita a config real (GET/POST /config -> inteligencia_config 'principal') e
// mostra a SAUDE DOS SYNCS ao vivo (GET /sync/status). Usa as vars de tema
// globais, como os outros modais (ClienteSheet/CampanhaComposer).
function ConfigSheet({ api, onClose }) {
  const [cfg,    setCfg]    = useState(null)
  const [sync,   setSync]   = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [erro,   setErro]   = useState('')

  useEffect(()=>{
    fetch(`${api}/api/inteligencia/config`).then(r=>r.json()).then(d=>setCfg(d.config||d)).catch(()=>setErro('Falha ao carregar config'))
    fetch(`${api}/api/inteligencia/sync/status`).then(r=>r.json()).then(setSync).catch(()=>{})
  },[])

  // Update imutavel de caminho aninhado: upd(['segmentos','dias_risco'], 30)
  const upd = (path, val) => setCfg(prev=>{
    const nx = JSON.parse(JSON.stringify(prev||{}))
    let o = nx
    for (let k=0;k<path.length-1;k++){ o[path[k]] = o[path[k]]||{}; o = o[path[k]] }
    o[path[path.length-1]] = val
    return nx
  })

  const salvar = async () => {
    setSaving(true); setErro('')
    try {
      const r = await fetch(`${api}/api/inteligencia/config`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({config:cfg})})
      if (!r.ok) throw new Error('falha ao salvar')
      setSaved(true); setTimeout(()=>setSaved(false),2500)
    } catch(e){ setErro(e.message) }
    setSaving(false)
  }

  const Num = ({label,path,suf,w=76}) => (
    <label style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12.5,color:'var(--label-3)',padding:'7px 0'}}>
      <span>{label}</span>
      <span style={{display:'flex',alignItems:'center',gap:6}}>
        <input type="number" value={path.reduce((o,k)=>o?.[k],cfg) ?? ''} onChange={e=>upd(path, e.target.value===''?'':Number(e.target.value))}
          style={{width:w,padding:'6px 9px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:12.5,textAlign:'right'}}/>
        {suf && <span style={{fontSize:11,color:'var(--label-4)',width:34}}>{suf}</span>}
      </span>
    </label>
  )
  const Toggle = ({on,onClick}) => (
    <button onClick={onClick} style={{width:38,height:22,borderRadius:99,border:'none',cursor:'pointer',flexShrink:0,position:'relative',
      background:on?'#25D366':'var(--sep)',transition:'background .15s'}}>
      <span style={{position:'absolute',top:2,left:on?18:2,width:18,height:18,borderRadius:99,background:'#fff',transition:'left .15s'}}/>
    </button>
  )
  const Sec = ({t,children}) => (
    <div style={{marginBottom:20}}>
      <p style={{fontSize:10,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--label-4)',margin:'0 0 8px'}}>{t}</p>
      {children}
    </div>
  )

  const estadoSync = (rec) => {
    const e = (sync?.estados||[]).find(x=>x.recurso===rec)
    if (!e) return {txt:'—',cor:'var(--label-4)'}
    if (e.erro) return {txt:'erro',cor:'#ff4757'}
    if (e.rodando) return {txt:'rodando…',cor:'#f59e0b'}
    if (e.concluido_em) return {txt:'concluído',cor:'#25D366'}
    return {txt:'aguardando',cor:'var(--label-4)'}
  }

  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:60,background:'rgba(0,0,0,.55)',backdropFilter:'blur(2px)'}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:600,maxHeight:'88vh',zIndex:70,background:'var(--bg-2)',borderRadius:16,border:'1px solid var(--sep)',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 32px 80px rgba(0,0,0,.45)'}}>
        <div style={{height:2.5,background:'linear-gradient(90deg,#8b5cf6,#60a5fa)'}}/>
        <div style={{padding:'16px 22px 13px',borderBottom:'1px solid var(--sep)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <p style={{fontSize:16,fontWeight:800,color:'var(--label)',margin:0}}>Configurações</p>
            <p style={{fontSize:11.5,color:'var(--label-4)',margin:'3px 0 0'}}>Régua da análise · segmentos · saúde dos dados</p>
          </div>
          <button onClick={onClose} style={{background:'transparent',border:'none',color:'var(--label-4)',cursor:'pointer',fontSize:18}}>×</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'18px 22px'}}>
          {!cfg && !erro && <p style={{fontSize:12.5,color:'var(--label-4)'}}>Carregando…</p>}
          {cfg && (<>
            <Sec t="Análise automática">
              <label style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12.5,color:'var(--label-3)'}}>
                <span>Frequência do recálculo</span>
                <select value={cfg.job_frequencia||'4h'} onChange={e=>upd(['job_frequencia'],e.target.value)}
                  style={{padding:'7px 10px',borderRadius:8,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:12.5}}>
                  {['1h','2h','4h','6h','12h','24h'].map(f=><option key={f} value={f}>a cada {f}</option>)}
                </select>
              </label>
            </Sec>

            <Sec t="Régua de segmentos">
              <Num label="Dias sem comprar → em risco" path={['segmentos','dias_risco']} suf="dias"/>
              <Num label="Dias sem comprar → perdido"  path={['segmentos','dias_perdido']} suf="dias"/>
              <Num label="VIP: mínimo de pedidos"       path={['segmentos','vip_min_pedidos']} suf="ped"/>
              <Num label="VIP: mínimo gasto acumulado"  path={['segmentos','vip_min_valor']} suf="R$" w={92}/>
            </Sec>

            <Sec t="Análises da Bia (ligar/desligar)">
              {Object.entries(cfg.analises||{}).map(([k,a])=>{
                const numKey = Object.keys(a).find(x=>x!=='ativo'&&x!=='label')
                return (
                  <div key={k} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:'1px solid var(--sep)'}}>
                    <Toggle on={!!a.ativo} onClick={()=>upd(['analises',k,'ativo'],!a.ativo)}/>
                    <span style={{flex:1,fontSize:12.5,color:a.ativo?'var(--label)':'var(--label-4)'}}>{a.label||k}</span>
                    {numKey && (
                      <span style={{display:'flex',alignItems:'center',gap:5}}>
                        <input type="number" disabled={!a.ativo} value={a[numKey]} onChange={e=>upd(['analises',k,numKey],Number(e.target.value))}
                          style={{width:60,padding:'5px 8px',borderRadius:7,border:'1px solid var(--sep)',background:'var(--fill)',color:'var(--label)',fontSize:12,textAlign:'right',opacity:a.ativo?1:.4}}/>
                        <span style={{fontSize:10.5,color:'var(--label-4)',width:42}}>{numKey==='margem'?'%':numKey==='horas'?'horas':numKey==='min'||numKey==='limite'?'un':'dias'}</span>
                      </span>
                    )}
                  </div>
                )
              })}
            </Sec>

            <Sec t="Saúde dos dados (somente leitura)">
              <div style={{borderRadius:11,border:'1px solid var(--sep)',background:'var(--fill)',padding:'12px 14px'}}>
                {[['contatos','Contatos endereçáveis','contatos_com_telefone'],['pedidos','Pedidos na base','pedidos'],['itens','Itens detalhados','__itens__']].map(([rec,label,tot])=>{
                  const s = estadoSync(rec)
                  let val = sync?.totais?.[tot]
                  if (tot==='__itens__') val = null
                  return (
                    <div key={rec} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12,padding:'5px 0'}}>
                      <span style={{color:'var(--label-3)'}}>{label}{val!=null && <span style={{color:'var(--label-4)'}}> · {Number(val).toLocaleString('pt-BR')}</span>}</span>
                      <span style={{color:s.cor,fontWeight:700,fontSize:11}}>{s.txt}</span>
                    </div>
                  )
                })}
                {sync?.totais?.pedido_mais_recente && (
                  <p style={{fontSize:10.5,color:'var(--label-4)',margin:'8px 0 0',borderTop:'1px solid var(--sep)',paddingTop:7}}>
                    Pedido mais recente na base: {String(sync.totais.pedido_mais_recente).slice(0,10)}
                  </p>
                )}
              </div>
            </Sec>
          </>)}
          {erro && <p style={{fontSize:12,color:'#ff4757',margin:'4px 0 0'}}>⚠️ {erro}</p>}
        </div>

        <div style={{padding:'13px 22px',borderTop:'1px solid var(--sep)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:11.5,color:saved?'#25D366':'var(--label-4)'}}>{saved?'✓ salvo — vale na próxima análise':'as mudanças valem no próximo recálculo'}</span>
          <button disabled={saving||!cfg} onClick={salvar}
            style={{padding:'10px 22px',borderRadius:10,border:'none',cursor:(saving||!cfg)?'default':'pointer',fontSize:13,fontWeight:800,
              background:(saving||!cfg)?'var(--fill)':'linear-gradient(135deg,#8b5cf6,#7c3aed)',color:(saving||!cfg)?'var(--label-4)':'#fff'}}>
            {saving?'Salvando…':'Salvar configurações'}
          </button>
        </div>
      </div>
    </>
  )
}

export default function PageInteligencia({ api }) {
  // ══════════════════════════════════════════════════════════════════════════
  //  REFORMULACAO TOTAL — v3 "Command"
  //  Moldura, design system e as 5 views reescritos do zero. Os componentes
  //  ricos (ClienteSheet, CampanhaComposer, CampanhasPanel) sao transplantados
  //  da geracao atual — testados, nao se reescreve o que acabou de nascer.
  // ══════════════════════════════════════════════════════════════════════════
  const [view,        setView]      = useState('overview')
  const [overview,    setOverview]  = useState(null)
  const [clientes,    setClientes]  = useState([])
  const [stats,       setStats]     = useState(null)
  const [totalFiltro, setTotalFlt]  = useState(0)
  const [receitaFlt,  setReceitaFlt]= useState(0)
  const [loadCli,     setLoadCli]   = useState(false)
  const [busca,       setBusca]     = useState('')
  const [segFiltro,   setSegFiltro] = useState('todos')
  const [canalFiltro, setCanalF]    = useState('todos')
  const [diasFiltro,  setDiasFiltro]= useState('30')
  const [diasMaxF,    setDiasMaxF]  = useState('')
  const [sortBy,      setSortBy]    = useState('dias_desc')
  const [clienteSel,  setCltSel]    = useState(null)
  const [showCampanha,setShowCamp]  = useState(false)
  const [showConfig,  setShowConfig]= useState(false)
  const [sugestoes,   setSugestoes] = useState([])
  const [tipoSug,     setTipoSug]   = useState('todas')
  const [dismissed,   setDismissed] = useState(new Set())
  const [avaliacoes,  setAvals]     = useState([])
  const [cfg,         setCfg]       = useState(null)
  const [analisando,  setAnalisando]= useState(false)
  const [selecionados,setSel]       = useState(new Set())
  const [campManuais, setCampManuais]= useState(null)
  const [avAck,       setAvAck]     = useState({})

  // ── Dados ────────────────────────────────────────────────────────────────
  const carregarClientes = useCallback(async (offset=0) => {
    setLoadCli(true)
    try {
      const qs = `dias=${diasFiltro}&diasMax=${diasMaxF}&segmento=${segFiltro}&canal=${canalFiltro}&busca=${encodeURIComponent(busca)}&offset=${offset}&sort=${sortBy}`
      const r = await fetch(`${api}/api/inteligencia/clientes?${qs}`)
      if (r.ok) {
        const d = await r.json()
        setClientes(prev => offset>0 ? [...prev, ...(d.clientes||[])] : (d.clientes||[]))
        setStats(d.stats||null); setTotalFlt(d.totalFiltro ?? 0); setReceitaFlt(d.receitaFiltro ?? 0)
      }
    } catch {}
    setLoadCli(false)
  }, [api, diasFiltro, diasMaxF, segFiltro, canalFiltro, busca, sortBy])
  useEffect(()=>{ const t=setTimeout(()=>carregarClientes(0),350); return ()=>clearTimeout(t) },[carregarClientes])

  useEffect(()=>{
    if (view!=='overview') return
    fetch(`${api}/api/inteligencia/overview`).then(r=>r.ok?r.json():null).then(setOverview).catch(()=>{})
  },[view, api])

  const carregarSugestoes = useCallback(()=>{
    fetch(`${api}/api/inteligencia/sugestoes`).then(r=>r.json())
      .then(d=>setSugestoes(d.sugestoes||d||[])).catch(()=>{})
  },[api])
  useEffect(()=>{
    carregarSugestoes()
    fetch(`${api}/api/inteligencia/config`).then(r=>r.json()).then(setCfg).catch(()=>{})
    fetch(`${api}/api/inteligencia/avaliacoes`).then(r=>r.json())
      .then(d=>setAvals(d.avaliacoes||d||[])).catch(()=>{})
  },[api])

  const analisar = async () => {
    setAnalisando(true)
    try { await fetch(`${api}/api/inteligencia/analisar`,{method:'POST'}) } catch {}
    setTimeout(()=>{ setAnalisando(false); carregarSugestoes(); setOverview(null)
      fetch(`${api}/api/inteligencia/overview`).then(r=>r.ok?r.json():null).then(setOverview).catch(()=>{}) }, 9000)
  }
  const dispensarSugestao = (id) => setDismissed(p=>new Set([...p,id]))

  // ── Derivados ────────────────────────────────────────────────────────────
  const sugsVivas = sugestoes.filter(s=>!dismissed.has(s.id))
  const porTipo = t => sugsVivas.filter(s=>t==='todas'||s.tipo===t)
  const urgentes = sugsVivas.filter(s=>s.prioridade==='alta').length
  const mediaAv = avaliacoes.length ? (avaliacoes.reduce((s,a)=>s+(a.estrelas||0),0)/avaliacoes.length) : 0
  const irPara = (seg)=>{ setSegFiltro(seg); setDiasFiltro('0'); setDiasMaxF(''); setView('clientes') }
  const toggleUm = (tel)=> setSel(prev=>{ const n=new Set(prev); n.has(tel)?n.delete(tel):n.add(tel); return n })
  const toggleTodosVisiveis = ()=> setSel(prev=>{ const todos=clientes.length>0 && clientes.every(c=>prev.has(c.telefone)); const n=new Set(prev); clientes.forEach(c=> todos?n.delete(c.telefone):n.add(c.telefone)); return n })
  const criarComSelecao = ()=>{ setCampManuais([...selecionados]); setShowCamp(true) }
  const agradecerAval = async (av)=>{ if(!av.telefone) return; const id=av.id||av.telefone; setAvAck(p=>({...p,[id]:'sending'}))
    try { const nm=(av.nome_cliente||'').split(' ')[0]
      await fetch(`${api}/api/dashboard/manual/${String(av.telefone).replace(/\D/g,'')}`,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({mensagem:`Oi ${nm}! 💚 Muito obrigado pela avaliação ${av.estrelas||5}★ — significa muito pra gente da Só Strass! Volte sempre 🙏`})})
      setAvAck(p=>({...p,[id]:'sent'})) } catch { setAvAck(p=>({...p,[id]:''})) } }
  const ultimaAn = cfg?.ultima_analise ? fmtDT(cfg.ultima_analise) : null

  const SEGV = { vip:['VIP','#f5a623'], fiel:['Fiel','#2bd47f'], potencial:['Potencial','#8b7cff'],
                 novo:['Novo','#38bdf8'], regular:['Regular','#8b96ab'], em_risco:['Em risco','#ff9838'], perdido:['Perdido','#ff4d6a'] }
  const TABS = [
    { id:'overview',  l:'Comando',   n:null, Ic:BarChart3 },
    { id:'sugestoes', l:'Sugestões', n:sugsVivas.length||null, Ic:Lightbulb },
    { id:'clientes',  l:'Clientes',  n:totalFiltro?fmt(totalFiltro):null, Ic:Users },
    { id:'campanhas', l:'Campanhas', n:null, Ic:Send },
    { id:'avaliacoes',l:'Avaliações',n:avaliacoes.length||null, Ic:Star },
  ]

  return (
    <div className="iq-root">
      <style>{`
        .iq-root{ --iq-bg:#0a0a0c; --iq-p1:#0d0d10; --iq-p2:#111116; --iq-line:rgba(255,255,255,.07);
          --iq-line2:rgba(255,255,255,.12); --iq-ink:#f4f4f5; --iq-dim:#a1a1aa; --iq-faint:#71717a;
          --iq-ac:#8b5cf6; --iq-ac2:#60a5fa; --iq-ok:#34d399; --iq-warn:#fbbf24; --iq-bad:#f87171;
          height:100%; overflow-y:auto; font-family:'Inter',system-ui,-apple-system,sans-serif; background:
            radial-gradient(1100px 520px at 85% -12%, rgba(139,92,246,.06), transparent 60%), var(--iq-bg);
          color:var(--iq-ink); font-variant-numeric:tabular-nums; }
        .iq-root *{ box-sizing:border-box }
        .iq-root ::-webkit-scrollbar{ width:9px;height:9px } .iq-root ::-webkit-scrollbar-thumb{ background:#1c2434;border-radius:99px }
        @keyframes iqUp{ from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:none} }
        @keyframes iqPulse{ 0%,100%{opacity:1} 50%{opacity:.35} }
        .iq-wrap{ max-width:1240px; margin:0 auto; padding:26px 28px 60px; animation:iqUp .3s ease }
        .iq-panel{ background:linear-gradient(180deg,var(--iq-p2),var(--iq-p1)); border:1px solid var(--iq-line);
          border-radius:16px; box-shadow:0 1px 0 rgba(255,255,255,.02) inset }
        .iq-micro{ font-size:10px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--iq-faint) }
        .iq-num{ font-weight:800; letter-spacing:-.02em }
        .iq-btn{ display:inline-flex; align-items:center; gap:7px; border-radius:11px; cursor:pointer; font-weight:700;
          border:1px solid var(--iq-line2); background:var(--iq-p2); color:var(--iq-ink); padding:9px 16px; font-size:12.5px;
          transition:transform .08s ease, border-color .12s }
        .iq-btn:hover{ transform:translateY(-1px); border-color:var(--iq-ac) }
        .iq-btn.pri{ background:linear-gradient(135deg,#8b5cf6,#7c3aed); border:none; color:#fff; box-shadow:0 6px 18px rgba(139,92,246,.3) }
        .iq-btn.go { background:linear-gradient(135deg,#34d399,#10b981); border:none; color:#04160e; box-shadow:0 6px 18px rgba(52,211,153,.25) }
        .iq-chip{ padding:5px 12px; border-radius:99px; border:1px solid var(--iq-line2); background:transparent;
          color:var(--iq-dim); font-size:11.5px; font-weight:600; cursor:pointer; transition:all .1s }
        .iq-chip:hover{ border-color:var(--iq-ac); color:var(--iq-ink) }
        .iq-chip.on{ background:rgba(52,211,153,.14); border-color:rgba(52,211,153,.4); color:#6ee7b7; font-weight:800 }
        .iq-tab{ position:relative; padding:10px 4px; margin-right:26px; background:none; border:none; cursor:pointer;
          font-size:13px; font-weight:600; color:var(--iq-faint); transition:color .12s }
        .iq-tab:hover{ color:var(--iq-dim) } .iq-tab.on{ color:var(--iq-ink); font-weight:800 }
        .iq-tab.on::after{ content:''; position:absolute; left:0; right:0; bottom:-1px; height:2.5px; border-radius:99px;
          background:var(--iq-ac) }
        .iq-count{ margin-left:7px; font-size:10.5px; font-weight:800; color:var(--iq-ac); background:rgba(139,92,246,.12);
          border:1px solid rgba(139,92,246,.28); padding:1px 8px; border-radius:99px }
        .iq-grid{ display:grid; grid-template-columns:36px minmax(184px,1.8fr) 100px 96px 70px 92px 92px 96px 46px; gap:0; align-items:center }
        .iq-th{ padding:11px 14px; font-size:10px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:var(--iq-faint) }
        .iq-row{ border-top:1px solid var(--iq-line); cursor:pointer; transition:background .1s }
        .iq-row:hover{ background:rgba(255,255,255,.025) }
        .iq-ped-row{ transition:background .12s } .iq-ped-row:hover{ background:var(--fill) }
        .iq-td{ padding:12px 14px; font-size:12.5px }
        .iq-kpi{ padding:16px 18px; position:relative; overflow:hidden }
        .iq-kpi::before{ content:''; position:absolute; inset:0 0 auto 0; height:2px; background:var(--kc,transparent); opacity:.85 }
        .iq-seg{ text-align:left; border-radius:13px; padding:13px 15px; cursor:pointer; border:1px solid var(--sc,#333);
          background:linear-gradient(180deg, color-mix(in srgb, var(--sc) 9%, transparent), transparent 70%), var(--iq-p1);
          transition:transform .1s ease, box-shadow .12s }
        .iq-seg:hover{ transform:translateY(-2px); box-shadow:0 10px 26px rgba(0,0,0,.35) }
        .iq-bar{ height:5px; background:#1c1c22; border-radius:99px; overflow:hidden }
        .iq-bar>i{ display:block; height:100%; border-radius:99px }
        .iq-input{ width:100%; padding:11px 14px 11px 38px; border-radius:12px; border:1px solid var(--iq-line2);
          background:var(--iq-p1); color:var(--iq-ink); font-size:13px; outline:none; transition:border-color .12s }
        .iq-input:focus{ border-color:var(--iq-ac) }
        .iq-sel{ padding:10px 12px; border-radius:11px; border:1px solid var(--iq-line2); background:var(--iq-p1);
          color:var(--iq-ink); font-size:12.5px; cursor:pointer }
      `}</style>

      <div className="iq-wrap">
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:16,flexWrap:'wrap',marginBottom:6}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',
                background:'rgba(139,92,246,.14)',border:'1px solid rgba(139,92,246,.3)'}}>
                <Brain size={20} color="#a78bfa"/>
              </div>
              <div>
                <h1 style={{margin:0,fontSize:22,fontWeight:800,letterSpacing:'-.02em',color:'var(--iq-ink)'}}>
                  Inteligência de Clientes
                  {urgentes>0 && <span style={{marginLeft:10,fontSize:10.5,fontWeight:800,verticalAlign:'middle',color:'#ff9aa9',
                    background:'rgba(255,77,106,.1)',border:'1px solid rgba(255,77,106,.3)',padding:'3px 10px',borderRadius:99,WebkitTextFillColor:'#ff9aa9'}}>{urgentes} urgente{urgentes>1?'s':''}</span>}
                </h1>
                <p style={{margin:'3px 0 0',fontSize:11.5,color:'var(--iq-faint)',display:'flex',alignItems:'center',gap:7}}>
                  <span style={{width:6,height:6,borderRadius:99,background:'var(--iq-ok)',animation:'iqPulse 2.2s infinite'}}/>
                  base viva · push do Bling{ultimaAn && <> · última análise {ultimaAn}</>}
                </p>
              </div>
            </div>
          </div>
          <div style={{display:'flex',gap:9}}>
            <button className="iq-btn" onClick={()=>setShowConfig(true)}>
              <Settings size={13}/>Configurar
            </button>
            <button className="iq-btn pri" onClick={analisar} disabled={analisando}>
              <Sparkles size={13}/>{analisando?'Analisando…':'Analisar agora'}
            </button>
          </div>
        </div>

        {/* ── TAB RAIL ───────────────────────────────────────────────────── */}
        <div style={{display:'flex',borderBottom:'1px solid var(--iq-line)',marginBottom:22}}>
          {TABS.map(t=>(
            <button key={t.id} className={`iq-tab${view===t.id?' on':''}`} onClick={()=>setView(t.id)} style={{display:'inline-flex',alignItems:'center',gap:7}}>
              <t.Ic size={14}/>{t.l}{t.n!=null && <span className="iq-count">{t.n}</span>}
            </button>
          ))}
        </div>

        {/* ══ COMANDO ═════════════════════════════════════════════════════ */}
        {view==='overview' && (()=>{ const ov=overview; const base=Number(ov?.totais?.base||0)
          const segs=(ov?.segmentos||[]).slice().sort((a,b)=>b.clientes-a.clientes)
          return (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(185px,1fr))',gap:12}}>
              {[
                [Users,'Base endereçável', base?base.toLocaleString('pt-BR'):'—','clientes com telefone','var(--iq-ac2)'],
                [DollarSign,'LTV acumulado', ov?`R$ ${(Number(ov.totais.ltv_total)/1000).toFixed(0)}k`:'—','tudo que a base já comprou','var(--iq-ok)'],
                [Clock,'Hora de recomprar', ov?Number(ov.risco.hora_de_comprar).toLocaleString('pt-BR'):'—', ov?`R$ ${(Number(ov.risco.receita_hora)/1000).toFixed(1)}k no ponto do ciclo`:'','var(--iq-warn)'],
                [AlertTriangle,'Em risco (ciclo)', ov?Number(ov.risco.em_risco).toLocaleString('pt-BR'):'—','passaram 1,5× o próprio ciclo','#fb923c'],
                [Activity,'Ativos 30d', ov?Number(ov.totais.ativos_30d).toLocaleString('pt-BR'):'—','compraram no último mês','#60a5fa'],
              ].map(([Ic,t,v,s,c],i)=>(
                <div key={i} className="iq-panel iq-kpi" style={{'--kc':c}}>
                  <div style={{width:30,height:30,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',
                    background:`color-mix(in srgb, ${c} 15%, transparent)`,marginBottom:10}}><Ic size={15} color={c}/></div>
                  <p className="iq-num" style={{fontSize:25,margin:'0 0 3px',color:c}}>{v}</p>
                  <p className="iq-micro" style={{margin:0,color:'var(--iq-dim)'}}>{t}</p>
                  <p style={{fontSize:10,color:'var(--iq-faint)',margin:'3px 0 0'}}>{s}</p>
                </div>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1.35fr 1fr',gap:16,alignItems:'start'}}>
              <div className="iq-panel" style={{padding:'18px 20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:13}}>
                  <p className="iq-micro" style={{margin:0,color:'var(--iq-dim)'}}>Segmentos — base inteira</p>
                  <span style={{fontSize:10.5,color:'var(--iq-faint)'}}>clique → clientes → campanha</span>
                </div>
                {!ov && <p style={{fontSize:12,color:'var(--iq-faint)'}}>Carregando…</p>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {segs.map(s=>{ const [label,cor]=SEGV[s.segmento]||[s.segmento,'#8b96ab']
                    const pct=base?Math.round(s.clientes/base*100):0
                    return (
                      <button key={s.segmento} className="iq-seg" style={{'--sc':cor+'55'}} onClick={()=>irPara(s.segmento)}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                          <span style={{fontSize:11.5,fontWeight:800,color:cor}}>{label}</span>
                          <span style={{fontSize:10.5,color:'var(--iq-faint)'}}>{pct}%</span>
                        </div>
                        <p className="iq-num" style={{fontSize:21,color:'var(--iq-ink)',margin:'5px 0 2px'}}>{Number(s.clientes).toLocaleString('pt-BR')}</p>
                        <p style={{fontSize:10.5,color:'var(--iq-dim)',margin:'0 0 9px'}}>LTV R$ {(Number(s.ltv)/1000).toFixed(0)}k · ticket R$ {Number(s.ticket).toFixed(0)}</p>
                        <div className="iq-bar"><i style={{width:`${pct}%`,background:cor}}/></div>
                      </button>
                    )})}
                </div>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="iq-panel" style={{padding:'16px 18px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:11}}>
                    <p className="iq-micro" style={{margin:0,color:'var(--iq-dim)'}}>Campanhas ao vivo</p>
                    <button onClick={()=>setView('campanhas')} style={{background:'none',border:'none',color:'var(--iq-ac2)',cursor:'pointer',fontSize:11,fontWeight:700}}>ver todas →</button>
                  </div>
                  {(!ov||!ov.campanhas?.length) && <p style={{fontSize:12,color:'var(--iq-faint)',margin:0}}>Nenhuma rodando. Monte a audiência em Clientes.</p>}
                  {(ov?.campanhas||[]).map(c=>{ const alvo=Math.max(1,(c.total||0)-(c.pulados||0)); const pct=Math.min(100,Math.round(((c.enviados||0)+(c.erros||0))/alvo*100))
                    return (
                      <div key={c.id} style={{marginBottom:11}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:11.5,marginBottom:5}}>
                          <span style={{color:'var(--iq-ink)',fontWeight:600}}>#{c.id} {c.nome}</span>
                          <span className="iq-num" style={{color:c.status==='rodando'?'var(--iq-ok)':'var(--iq-warn)'}}>{pct}%</span>
                        </div>
                        <div className="iq-bar" style={{height:7}}><i style={{width:`${pct}%`,background:c.status==='rodando'?'linear-gradient(90deg,#16b364,#2bd47f)':'var(--iq-warn)'}}/></div>
                      </div>
                    )})}
                </div>

                <div className="iq-panel" style={{padding:'16px 18px'}}>
                  <p className="iq-micro" style={{margin:'0 0 11px',color:'var(--iq-dim)'}}>Ciclo de recompra</p>
                  {ov && [['Em dia',ov.risco.em_dia,'var(--iq-ok)'],['Hora de recomprar',ov.risco.hora_de_comprar,'var(--iq-warn)'],['Em risco',ov.risco.em_risco,'#ff9838'],['Provav. perdido',ov.risco.provavelmente_perdido,'var(--iq-bad)']].map(([l,v,c])=>{
                    const max=Math.max(1,...[ov.risco.em_dia,ov.risco.hora_de_comprar,ov.risco.em_risco,ov.risco.provavelmente_perdido].map(Number))
                    return (
                      <div key={l} style={{display:'flex',alignItems:'center',gap:9,marginBottom:7}}>
                        <span style={{fontSize:11,color:'var(--iq-dim)',width:116,flexShrink:0}}>{l}</span>
                        <div className="iq-bar" style={{flex:1,height:6}}><i style={{width:`${Number(v)/max*100}%`,background:c}}/></div>
                        <span className="iq-num" style={{fontSize:11.5,color:'var(--iq-ink)',width:52,textAlign:'right'}}>{Number(v).toLocaleString('pt-BR')}</span>
                      </div>
                    )})}
                </div>

                <div className="iq-panel" style={{padding:'16px 18px'}}>
                  <p className="iq-micro" style={{margin:'0 0 11px',color:'var(--iq-dim)'}}>Canais</p>
                  {(ov?.canais||[]).slice(0,5).map(cn=>{ const cc=(CANAL[cn.canal]||CANAL[String(cn.canal||'').replace(/\s/g,'').toLowerCase()]||{}).cor||'#94a3b8'
                    return (
                    <div key={cn.canal} style={{display:'flex',justifyContent:'space-between',fontSize:11.5,padding:'3px 0'}}>
                      <span style={{color:'var(--iq-dim)',textTransform:'capitalize',display:'flex',alignItems:'center',gap:8}}><span style={{width:7,height:7,borderRadius:99,background:cc,flexShrink:0}}/>{cn.canal}</span>
                      <span className="iq-num" style={{color:'var(--iq-ink)'}}>{Number(cn.clientes).toLocaleString('pt-BR')} · R$ {(Number(cn.ltv)/1000).toFixed(0)}k</span>
                    </div>
                  )})}
                  {ov?.itens_sync?.total>0 && (
                    <p style={{fontSize:10.5,color:'var(--iq-faint)',margin:'11px 0 0',borderTop:'1px solid var(--iq-line)',paddingTop:9}}>
                      🌙 Itens detalhados: <strong style={{color:'var(--iq-dim)'}}>{Number(ov.itens_sync.detalhados).toLocaleString('pt-BR')}/{Number(ov.itens_sync.total).toLocaleString('pt-BR')}</strong> ({Math.round(ov.itens_sync.detalhados/Math.max(1,ov.itens_sync.total)*100)}%) — habilita campanha por produto
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )})()}

        {/* ══ SUGESTOES ═══════════════════════════════════════════════════ */}
        {view==='sugestoes' && (
          <div style={{maxWidth:860,margin:'0 auto'}}>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
              {[['todas','Todas'],['urgente','Urgente'],['oportunidade','Oportunidade'],['estoque','Estoque'],['posVenda','Pós-venda'],['padrao','Padrão']].map(([v,l])=>(
                <button key={v} className={`iq-chip${tipoSug===v?' on':''}`} onClick={()=>setTipoSug(v)}>
                  {l}{v!=='todas' && <span style={{marginLeft:6,opacity:.7}}>{porTipo(v).length}</span>}
                </button>
              ))}
              <span style={{marginLeft:'auto',fontSize:11.5,color:'var(--iq-faint)',alignSelf:'center'}}>{sugsVivas.length} sugestões</span>
            </div>
            {porTipo(tipoSug).length===0 && (
              <div className="iq-panel" style={{padding:'52px 20px',textAlign:'center'}}>
                <Lightbulb size={28} style={{opacity:.25}}/>
                <p style={{fontSize:13.5,fontWeight:700,color:'var(--iq-dim)',margin:'12px 0 4px'}}>Nada por aqui</p>
                <p style={{fontSize:12,color:'var(--iq-faint)',margin:0}}>A Bia gera sugestões a cada análise.</p>
              </div>
            )}
            {porTipo(tipoSug).map(sug=>(
              <div key={sug.id} style={{marginBottom:12,animation:'iqUp .25s ease'}}>
                <BiaCard sug={sug} api={api} onDismiss={dispensarSugestao} onAction={()=>{}}/>
              </div>
            ))}
          </div>
        )}

        {/* ══ CLIENTES ════════════════════════════════════════════════════ */}
        {view==='clientes' && (
          <div>
            <div className="iq-panel" style={{padding:'16px 18px',marginBottom:14}}>
              <div style={{display:'flex',gap:10,marginBottom:12}}>
                <div style={{position:'relative',flex:1}}>
                  <Search size={14} style={{position:'absolute',left:13,top:13,color:'var(--iq-faint)'}}/>
                  <input className="iq-input" placeholder="Buscar em toda a base — nome ou telefone…" value={busca} onChange={e=>setBusca(e.target.value)}/>
                </div>
                <select className="iq-sel" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                  <option value="dias_desc">Mais tempo sem comprar</option>
                  <option value="dias_asc">Comprou mais recentemente</option>
                  <option value="valor_desc">Maior LTV</option>
                  <option value="ticket_desc">Maior ticket</option>
                  <option value="score_desc">Maior score RFM</option>
                </select>
              </div>
              <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center'}}>
                <span className="iq-micro" style={{marginRight:2}}>Segmento</span>
                {[['todos','Todos'],...Object.entries(SEGV).map(([k,[l]])=>[k,l])].map(([v,l])=>(
                  <button key={v} className={`iq-chip${segFiltro===v?' on':''}`} onClick={()=>setSegFiltro(v)}>{l}</button>
                ))}
              </div>
              <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center',marginTop:9}}>
                <span className="iq-micro" style={{marginRight:2}}>Sem comprar</span>
                {[{v:'0',m:'',l:'Todos'},{v:'15',m:'30',l:'15–30d'},{v:'30',m:'60',l:'30–60d'},{v:'60',m:'90',l:'60–90d'},{v:'90',m:'120',l:'90–120d'},{v:'120',m:'',l:'+120d'}].map(f=>(
                  <button key={f.l} className={`iq-chip${(diasFiltro===f.v&&diasMaxF===f.m)?' on':''}`} onClick={()=>{setDiasFiltro(f.v);setDiasMaxF(f.m)}}>{f.l}</button>
                ))}
                <span className="iq-micro" style={{margin:'0 2px 0 14px'}}>Canal</span>
                {['todos','shopee','mercadolivre','nuvemshop','tiktokshop','shein','whatsapp','loja'].map(c=>(
                  <button key={c} className={`iq-chip${canalFiltro===c?' on':''}`} style={{textTransform:'capitalize'}} onClick={()=>setCanalF(c)}>{c==='todos'?'Todos':c}</button>
                ))}
              </div>
            </div>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:10}}>
              <p style={{fontSize:12,color:'var(--iq-dim)',margin:0}}>
                Mostrando <strong className="iq-num" style={{color:'var(--iq-ink)'}}>{fmt(clientes.length)}</strong> de{' '}
                <strong className="iq-num" style={{color:'var(--iq-ac2)'}}>{fmt(totalFiltro)}</strong> do filtro
                {receitaFlt>0 && <> · receita recuperável <strong className="iq-num" style={{color:'var(--iq-warn)'}}>{Rk(receitaFlt)}</strong></>}
              </p>
              <div style={{display:'flex',gap:9}}>
                <a className="iq-btn" href={`${api}/api/inteligencia/clientes/export?dias=${diasFiltro}&diasMax=${diasMaxF}&segmento=${segFiltro}&canal=${canalFiltro}&busca=${encodeURIComponent(busca)}`}
                   style={{textDecoration:'none'}}>
                  <Package size={13}/> Exportar CSV
                </a>
                <button className="iq-btn go" onClick={()=>setShowCamp(true)}>
                  <Send size={13}/> Criar campanha · alcança todos os {fmt(totalFiltro)}
                </button>
              </div>
            </div>

            {selecionados.size > 0 && (
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12,padding:'11px 15px',borderRadius:12,background:'rgba(139,92,246,.1)',border:'1px solid rgba(139,92,246,.3)'}}>
                <Check size={15} style={{color:'#a78bfa'}}/>
                <span style={{fontSize:13,fontWeight:800,color:'#c4b5fd'}}>{selecionados.size} selecionado{selecionados.size>1?'s':''} para a 1ª rodada</span>
                <button className="iq-btn go" style={{marginLeft:'auto',padding:'8px 15px'}} onClick={criarComSelecao}><Send size={13}/> Criar campanha com selecionados</button>
                <button className="iq-btn" style={{padding:'8px 13px'}} onClick={()=>setSel(new Set())}>Limpar</button>
              </div>
            )}
            <div className="iq-panel" style={{overflow:'hidden'}}>
              <div className="iq-grid" style={{background:'rgba(255,255,255,.02)'}}>
                <div className="iq-th" style={{textAlign:'center'}}><input type="checkbox" checked={clientes.length>0 && clientes.every(c=>selecionados.has(c.telefone))} onChange={toggleTodosVisiveis} style={{cursor:'pointer',accentColor:'#8b5cf6'}}/></div>
                {['Cliente','Segmento','Última compra','Pedidos','Ticket','LTV','Sem comprar',''].map((h,i)=>(<div key={i} className="iq-th" style={i>=2&&i<=6?{textAlign:'right'}:{}}>{h}</div>))}
              </div>
              {loadCli && clientes.length===0 && [...Array(6)].map((_,i)=>(
                <div key={i} className="iq-row iq-grid"><div className="iq-td" style={{gridColumn:'1/-1'}}><div className="iq-bar" style={{width:`${70-i*8}%`,height:9,opacity:.4}}/></div></div>
              ))}
              {clientes.map((c,i)=>{ const [sl,sc]=SEGV[c.segmento]||[c.segmento,'#94a3b8']; const hora=c.cicloDias>0&&c.diasSemComprar>=c.cicloDias&&c.diasSemComprar<c.cicloDias*1.5
                return (
                <div key={c.telefone||i} className="iq-row iq-grid" onClick={()=>setCltSel(c)} style={selecionados.has(c.telefone)?{background:'rgba(139,92,246,.06)'}:undefined}>
                  <div className="iq-td" style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selecionados.has(c.telefone)} onChange={()=>toggleUm(c.telefone)} style={{cursor:'pointer',accentColor:'#8b5cf6'}}/></div>
                  <div className="iq-td" style={{display:'flex',alignItems:'center',gap:11,minWidth:0}}>
                    <Avatar nome={c.nome} size={32}/>
                    <div style={{minWidth:0}}>
                      <p style={{margin:0,fontWeight:600,color:'var(--iq-ink)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.nome||'—'}</p>
                      <p style={{margin:0,fontSize:10.5,color:'var(--iq-faint)',fontFamily:'monospace',display:'flex',alignItems:'center',gap:5}}>{c.telefone}
                        <button onClick={e=>{e.stopPropagation();navigator.clipboard&&navigator.clipboard.writeText(String(c.telefone||''))}} title="Copiar telefone"
                          style={{display:'inline-flex',alignItems:'center',padding:2,borderRadius:4,border:'1px solid var(--iq-line)',background:'transparent',color:'var(--iq-faint)',cursor:'pointer'}}><Copy size={9}/></button>
                      </p>
                    </div>
                  </div>
                  <div className="iq-td"><span style={{fontSize:10.5,fontWeight:800,color:sc,background:sc+'1f',border:`1px solid ${sc}33`,padding:'3px 10px',borderRadius:99,display:'inline-flex',alignItems:'center',gap:5}}><span style={{width:5,height:5,borderRadius:99,background:sc}}/>{sl}</span></div>
                  <div className="iq-td" style={{textAlign:'right',fontSize:11.5,color:'var(--iq-dim)'}}>{fmtD(c.ultimoPedido)}</div>
                  <div className="iq-td iq-num" style={{textAlign:'right',color:'var(--iq-ink)'}}>{fmt(c.pedidosTotal||0)}</div>
                  <div className="iq-td iq-num" style={{textAlign:'right',color:'var(--iq-dim)'}}>{Rk(c.ticketMedio)}</div>
                  <div className="iq-td iq-num" style={{textAlign:'right',color:'var(--iq-ok)',fontWeight:800}}>{Rk(c.totalGasto)}</div>
                  <div className="iq-td" style={{textAlign:'right'}}>
                    <span className="iq-num" style={{color:c.diasSemComprar>120?'var(--iq-bad)':c.diasSemComprar>60?'var(--iq-warn)':'var(--iq-ok)'}}>{c.diasSemComprar}d</span>
                    {hora && <p style={{margin:0,fontSize:9.5,color:'var(--iq-warn)'}}>⚡ recomprar</p>}
                  </div>
                  <div className="iq-td" style={{textAlign:'right'}}>
                    <button title="Abrir" onClick={e=>{e.stopPropagation();setCltSel(c)}} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:30,height:30,borderRadius:8,border:'1px solid var(--iq-line2)',background:'var(--iq-p2)',color:'var(--iq-faint)',cursor:'pointer'}}><Eye size={14}/></button>
                  </div>
                </div>
              )})}
              {clientes.length===0 && !loadCli && (
                <div style={{padding:'46px 20px',textAlign:'center',color:'var(--iq-faint)'}}>
                  <UserX size={26} style={{opacity:.3}}/>
                  <p style={{fontSize:12.5,margin:'10px 0 0'}}>Nenhum cliente neste filtro.</p>
                </div>
              )}
            </div>
            {clientes.length < totalFiltro && (
              <div style={{textAlign:'center',marginTop:14}}>
                <button className="iq-btn" disabled={loadCli} onClick={()=>carregarClientes(clientes.length)}>
                  {loadCli?'Carregando…':`Carregar mais (${fmt(totalFiltro-clientes.length)} restantes)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ CAMPANHAS ═══════════════════════════════════════════════════ */}
        {view==='campanhas' && (
          <div style={{maxWidth:980,margin:'0 auto'}}>
            <CampanhasPanel api={api}/>
          </div>
        )}

        {/* ══ AVALIACOES ══════════════════════════════════════════════════ */}
        {view==='avaliacoes' && (
          <div style={{maxWidth:860,margin:'0 auto'}}>
            <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:14,marginBottom:16}}>
              <div className="iq-panel" style={{padding:'20px 18px',textAlign:'center'}}>
                <p className="iq-num" style={{fontSize:38,margin:0,color:'var(--iq-ok)'}}>{mediaAv.toFixed(1)}</p>
                <p style={{margin:'2px 0 4px',color:'var(--iq-warn)',letterSpacing:2}}>{'★'.repeat(Math.round(mediaAv))}<span style={{opacity:.25}}>{'★'.repeat(5-Math.round(mediaAv))}</span></p>
                <p style={{fontSize:11,color:'var(--iq-faint)',margin:0}}>{avaliacoes.length} avaliações</p>
              </div>
              <div className="iq-panel" style={{padding:'16px 20px',display:'flex',flexDirection:'column',justifyContent:'center',gap:6}}>
                {[5,4,3,2,1].map(n=>{ const q=avaliacoes.filter(a=>a.estrelas===n).length
                  return (
                    <div key={n} style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:11,color:'var(--iq-dim)',width:24}}>{n} ★</span>
                      <div className="iq-bar" style={{flex:1,height:7}}><i style={{width:`${avaliacoes.length?q/avaliacoes.length*100:0}%`,background:'var(--iq-warn)'}}/></div>
                      <span className="iq-num" style={{fontSize:11,color:'var(--iq-dim)',width:30,textAlign:'right'}}>{q}</span>
                    </div>
                  )})}
              </div>
            </div>
            {avaliacoes.map((av,i)=>{ const aid=av.id||av.telefone; const ack=avAck[aid]
              return (
              <div key={av.id||i} className="iq-panel" style={{padding:'13px 17px',marginBottom:9}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <span style={{color:'var(--iq-warn)',fontSize:13,letterSpacing:1,flexShrink:0}}>{'★'.repeat(av.estrelas||0)}<span style={{opacity:.2}}>{'★'.repeat(5-(av.estrelas||0))}</span></span>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:0,fontSize:12.5}}>
                      <strong style={{color:'var(--iq-ink)'}}>{av.nome_cliente||av.telefone}</strong>
                      {av.nome_cliente && av.nome_cliente!==av.telefone && <span style={{color:'var(--iq-faint)'}}> · {av.telefone}</span>}
                      {av.numero_pedido && <span style={{color:'var(--iq-dim)'}}> · Pedido #{av.numero_pedido}</span>}
                      {av.canal && <span style={{marginLeft:7,fontSize:10,fontWeight:800,textTransform:'capitalize',color:'var(--iq-ok)',background:'rgba(52,211,153,.1)',border:'1px solid rgba(52,211,153,.28)',padding:'1px 8px',borderRadius:99}}>{av.canal}</span>}
                    </p>
                    {av.comentario && <p style={{margin:'5px 0 0',fontSize:12,color:'var(--iq-dim)',lineHeight:1.5}}>"{av.comentario}"</p>}
                  </div>
                  <span style={{fontSize:10.5,color:'var(--iq-faint)',flexShrink:0}}>{fmtDT(av.criado_em)}</span>
                </div>
                <div style={{display:'flex',gap:7,marginTop:10,paddingTop:10,borderTop:'1px solid var(--iq-line)'}}>
                  <button className="iq-btn go" style={{padding:'6px 12px',fontSize:11.5}} disabled={!av.telefone||ack==='sending'} onClick={()=>agradecerAval(av)}>
                    {ack==='sent'?<><Check size={12}/> Agradecido</>:ack==='sending'?<><RefreshCw size={12} style={{animation:'spin 1s linear infinite'}}/> Enviando…</>:<><Heart size={12}/> Agradecer + oferta</>}
                  </button>
                  <button className="iq-btn" style={{padding:'6px 12px',fontSize:11.5}} disabled={!av.telefone} onClick={()=>setCltSel({nome:av.nome_cliente,telefone:av.telefone})}><Eye size={12}/> Ver cliente</button>
                  {!av.telefone && <span style={{fontSize:10.5,color:'var(--iq-faint)',alignSelf:'center'}}>sem telefone — sem ação</span>}
                </div>
              </div>
            )})}
            {avaliacoes.length===0 && <div className="iq-panel" style={{padding:'46px',textAlign:'center',color:'var(--iq-faint)',fontSize:12.5}}>Nenhuma avaliação ainda.</div>}
          </div>
        )}
      </div>

      {showConfig && <ConfigSheet api={api} onClose={()=>setShowConfig(false)}/>}
      {clienteSel && <ClienteSheet key={clienteSel.telefone||clienteSel.nome} cliente={clienteSel} onClose={()=>setCltSel(null)} api={api}/>}
      {showCampanha && <CampanhaComposer api={api} onClose={()=>{setShowCamp(false);setCampManuais(null)}}
        telefonesManuais={campManuais}
        filtro={{
          segmentos: segFiltro!=='todos'?[segFiltro]:null,
          canais:    canalFiltro!=='todos'?[canalFiltro]:null,
          diasMin:   parseInt(diasFiltro)||0,
          diasMax:   diasMaxF?parseInt(diasMaxF):null,
          busca:     busca||null,
        }}/>}
    </div>
  )
}
