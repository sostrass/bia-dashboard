import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search, RefreshCw, Plus, X, Truck, CreditCard, Package, RotateCcw,
  MessageSquare, Clock, CheckCircle, User, Send, FileText,
  AlertTriangle, Tag, Phone, Mail, Zap, ChevronRight, ShieldAlert,
  Circle, XCircle, Sparkles, History, MapPin, Star, Copy, Check,
  RefreshCcw, TrendingUp, Crown, Flame, Activity, Gauge, Radio,
  ClipboardList, Lightbulb, BadgeCheck, Timer, Wallet, BarChart3,
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Paleta dark enterprise (idêntica ao restante do painel) ────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#6b7294', ink4:'#3a3f5c',
  sep:'rgba(255,255,255,0.05)', sep2:'rgba(255,255,255,0.08)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.08)',  amberBor:'rgba(255,179,0,.25)',
  blue:'#4f8ef7',  blueDim:'rgba(79,142,247,.08)',   blueBor:'rgba(79,142,247,.25)',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)',  greenBor:'rgba(0,230,118,.25)',
  red:'#ff4757',   redDim:'rgba(255,71,87,.08)',     redBor:'rgba(255,71,87,.25)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.08)',purpleBor:'rgba(167,139,250,.25)',
  orange:'#f97316',orangeDim:'rgba(249,115,22,.08)', orangeBor:'rgba(249,115,22,.25)',
  cyan:'#22d3ee',  cyanDim:'rgba(34,211,238,.08)',   cyanBor:'rgba(34,211,238,.25)',
  gray:'rgba(255,255,255,.04)', grayBor:'rgba(255,255,255,.1)',
}

const TIPOS = {
  entrega:   { label:'Entrega',    icon:Truck,       color:T.purple, dim:T.purpleDim, bor:T.purpleBor },
  atraso:    { label:'Atraso',     icon:Clock,       color:T.red,    dim:T.redDim,    bor:T.redBor    },
  extravio:  { label:'Extravio',   icon:ShieldAlert, color:T.red,    dim:T.redDim,    bor:T.redBor    },
  troca:     { label:'Troca/Dev.', icon:RotateCcw,   color:T.orange, dim:T.orangeDim, bor:T.orangeBor },
  pagamento: { label:'Pagamento',  icon:CreditCard,  color:T.blue,   dim:T.blueDim,   bor:T.blueBor   },
  produto:   { label:'Produto',    icon:Package,     color:T.amber,  dim:T.amberDim,  bor:T.amberBor  },
  outro:     { label:'Outro',      icon:Tag,         color:T.ink3,   dim:T.bg3,       bor:T.sep2      },
}
const STATUS = {
  aberta:       { label:'Aberta',       color:T.amber,  dim:T.amberDim,  bor:T.amberBor,  icon:Circle,      acaoHint:'O ticket volta para a fila de triagem. Por quê?' },
  em_analise:   { label:'Em análise',   color:T.blue,   dim:T.blueDim,   bor:T.blueBor,   icon:Search,      acaoHint:'O que está sendo apurado? (ex.: abrimos verificação com a transportadora)' },
  em_andamento: { label:'Em andamento', color:T.purple, dim:T.purpleDim, bor:T.purpleBor, icon:RefreshCcw,  acaoHint:'Qual ação concreta está em execução? (ex.: reenvio postado, etiqueta emitida)' },
  resolvida:    { label:'Resolvida',    color:T.green,  dim:T.greenDim,  bor:T.greenBor,  icon:CheckCircle, acaoHint:'Como foi resolvido? Essa nota encerra o caso para o cliente.' },
  encerrada:    { label:'Encerrada',    color:T.ink3,   dim:T.bg3,       bor:T.sep2,      icon:XCircle,     acaoHint:'Motivo do encerramento sem resolução (ex.: cliente não retornou).' },
}
const ESTEIRA = ['aberta', 'em_analise', 'em_andamento', 'resolvida']
const CANAIS = {
  whatsapp:     { label:'WhatsApp',      color:'#25d366', emoji:'💬' },
  site:         { label:'Site',          color:T.blue,    emoji:'🌐' },
  mercadolivre: { label:'Mercado Livre', color:'#ffe600', emoji:'🛒' },
  shopee:       { label:'Shopee',        color:'#ee4d2d', emoji:'🛍️' },
  shein:        { label:'Shein',         color:'#c8c8d0', emoji:'👗' },
  tiktokshop:   { label:'TikTok Shop',   color:T.cyan,    emoji:'🎵' },
  email:        { label:'E-mail',        color:T.purple,  emoji:'✉️' },
  telefone:     { label:'Telefone',      color:T.orange,  emoji:'📞' },
}
const slaInfo = criadoEm => {
  const h = (Date.now() - new Date(criadoEm)) / 3600000
  if (h < 24)  return { pct: h/24*100,  color:T.green,  label:`${Math.floor(h)}h — dentro do SLA` }
  if (h < 72)  return { pct: h/72*100,  color:T.amber,  label:`${Math.floor(h)}h — atenção` }
  return { pct: 100, color:T.red, label:`${Math.floor(h/24)}d — SLA estourado` }
}
const PRIO = {
  baixa:   { label:'Baixa',   color:T.ink4   },
  normal:  { label:'Normal',  color:T.blue   },
  alta:    { label:'Alta',    color:T.orange },
  urgente: { label:'Urgente', color:T.red    },
}
const RESPOSTAS_RAPIDAS = [
  { id:'rastreio',  label:'Status do rastreio',  texto:'Acompanhei seu pedido agora: ele está com a transportadora e o último registro é "{evento}". Assim que houver movimentação nova, te aviso por aqui. 🚚' },
  { id:'atraso',    label:'Pedido em atraso',    texto:'Você tem razão — o prazo passou e isso não é o padrão que queremos. Já abri verificação com a transportadora e te retorno até *{prazo}* com uma posição concreta.' },
  { id:'extravio',  label:'Possível extravio',   texto:'Abrimos a apuração de extravio junto à transportadora. Se não houver localização em *3 dias úteis*, reenviamos os itens ou devolvemos o valor integral — você escolhe.' },
  { id:'troca',     label:'Troca/devolução',     texto:'Sua troca está aprovada. Vou te enviar a etiqueta de postagem — é só embalar e levar a uma agência. Assim que o item chegar aqui, processamos em até *2 dias úteis*.' },
  { id:'resolvido', label:'Encerramento',        texto:'Confirmando: seu caso foi resolvido. Qualquer coisa, é só chamar por aqui. Obrigada pela paciência e pela confiança. 💎' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtBRL = v => (parseFloat(v)||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const fmtD   = ts => ts ? new Date(ts).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}) : '—'
const fmtRel = ts => {
  if (!ts) return '—'
  const m = Math.floor((Date.now()-new Date(ts))/60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  if (m < 1440) return `${Math.floor(m/60)}h`
  return `${Math.floor(m/1440)}d`
}
const fmtTel = t => {
  const n=(t||'').replace(/\D/g,'').replace(/^55/,'')
  return n.length===11?`(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`:t||''
}
const AV_GRADS = [
  ['#7c3aed','#4f8ef7'], ['#f97316','#ffb300'], ['#06b6d4','#00e676'],
  ['#ec4899','#a78bfa'], ['#ef4444','#f97316'], ['#10b981','#22d3ee'],
]
const gradOf = nome => AV_GRADS[(nome||'?').split('').reduce((s,c)=>s+c.charCodeAt(0),0) % AV_GRADS.length]

// ── Átomos visuais ─────────────────────────────────────────────────────────────
function Avatar({ nome, size=40, glow }) {
  const [c1,c2] = gradOf(nome)
  const ini = (nome||'?').split(' ').filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase() || '?'
  return (
    <div style={{
      width:size, height:size, borderRadius:size*0.32, flexShrink:0,
      background:`linear-gradient(135deg, ${c1}, ${c2})`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontWeight:800, fontSize:size*0.36, color:'#fff', letterSpacing:0.5,
      boxShadow: glow ? `0 0 0 1px rgba(255,255,255,.1), 0 8px 32px -8px ${c1}99` : `0 2px 8px rgba(0,0,0,.4)`,
    }}>{ini}</div>
  )
}
function Bdg({ color, dim, bor, icon:Ic, children, size='xs' }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding: size==='sm' ? '4px 10px' : '2px 8px',
      borderRadius:999, fontSize:size==='sm'?12:11, fontWeight:700,
      color, background:dim, border:`1px solid ${bor||'transparent'}`, whiteSpace:'nowrap',
    }}>{Ic && <Ic size={size==='sm'?13:11}/>}{children}</span>
  )
}
function Skel({w='100%', h=14, r=6, style={}}) {
  return <div style={{width:w, height:h, borderRadius:r, background:`linear-gradient(90deg, ${T.bg3}, ${T.bg4}, ${T.bg3})`, backgroundSize:'200% 100%', animation:'oc-shimmer 1.4s infinite', ...style}}/>
}
function Sec({ icon:Ic, color, title, extra, children }) {
  return (
    <div style={{background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:14, overflow:'hidden'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:`1px solid ${T.sep}`}}>
        <div style={{display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:800, color:T.ink2, textTransform:'uppercase', letterSpacing:0.8}}>
          <Ic size={14} color={color}/>{title}
        </div>
        {extra}
      </div>
      <div style={{padding:14}}>{children}</div>
    </div>
  )
}

// ═══ MODAL 360 — dossiê completo do cliente para o atendimento ═══════════════
function Modal360({ oc, onAtualizado, onClose }) {
  const [ctx,    setCtx]    = useState(null)
  const [loading,setLoading]= useState(true)
  const [nota,   setNota]   = useState('')
  const [resp,   setResp]   = useState('')
  const [gerando,setGerando]= useState(false)
  const [enviando,setEnviando]=useState(false)
  const [mudando,setMudando]= useState(false)
  const [copiado,setCopiado]= useState(false)
  const [erro,   setErro]   = useState('')
  const [acaoModal, setAcaoModal] = useState(null)   // { status alvo }
  const [acaoTxt,   setAcaoTxt]   = useState('')

  const carregar = useCallback(() => {
    setLoading(true)
    fetch(`${BASE}/api/ocorrencias/${oc.id}/contexto360`)
      .then(r=>r.json()).then(d=>{ setCtx(d); setLoading(false) })
      .catch(()=>{ setErro('Falha ao carregar o dossiê'); setLoading(false) })
  }, [oc.id])
  useEffect(() => { carregar() }, [carregar])

  const tk     = ctx?.ticket || oc
  const st     = STATUS[tk.status] || STATUS.aberta
  const tipo   = TIPOS[tk.tipo] || TIPOS.outro
  const flags  = ctx?.flags || {}
  const share  = ctx?.share || {}
  const ras    = ctx?.rastreio
  const histArr= Array.isArray(tk.historico) ? tk.historico : []

  async function patch(body) {
    const r = await fetch(`${BASE}/api/ocorrencias/${oc.id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body),
    })
    if (!r.ok) throw new Error('Falha ao salvar')
    const d = await r.json()
    onAtualizado?.(d.ocorrencia || d)
    carregar()
    return d
  }
  // Transição de status SEMPRE pede a AÇÃO executada — vira evento na timeline
  function pedirAcao(novo) { setAcaoTxt(''); setAcaoModal(novo) }
  async function confirmarAcao() {
    if (!acaoTxt.trim()) return
    setMudando(true); setErro('')
    try {
      await patch({ status: acaoModal, nota: acaoTxt.trim(), por: 'agente' })
      setAcaoModal(null); setAcaoTxt('')
    } catch(e) { setErro(e.message) } finally { setMudando(false) }
  }
  async function addNota() {
    if (!nota.trim()) return
    setErro('')
    try { await patch({ nota: nota.trim(), por: 'agente' }); setNota('') }
    catch(e) { setErro(e.message) }
  }
  async function enviarWhats() {
    if (!resp.trim()) return
    setEnviando(true); setErro('')
    try { await patch({ respostaCliente: resp.trim(), por: 'agente' }); setResp('') }
    catch(e) { setErro(e.message) } finally { setEnviando(false) }
  }
  async function gerarIA() {
    setGerando(true); setErro('')
    try {
      const r = await fetch(`${BASE}/api/ocorrencias/${oc.id}/sugerir-resposta`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ contexto_extra: ras ? `Rastreio: ${ras.ultimo_status||''} — ${ras.ultimo_evento||''} ${ras.atrasado?'(EM ATRASO)':''}` : '' }),
      })
      const d = await r.json()
      if (d.resposta) setResp(d.resposta)
      else setErro(d.erro || 'IA não retornou resposta')
    } catch { setErro('Falha ao gerar resposta') } finally { setGerando(false) }
  }
  function usarRapida(rr) {
    let txt = rr.texto
      .replace('{evento}', ras?.ultimo_evento || 'em trânsito')
      .replace('{prazo}', new Date(Date.now()+86400000).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}))
    setResp(txt)
  }

  const HIST_ICON = {
    criada:'🆕', nota:'📝', whatsapp:'💬', cliente_adicionou:'👤',
  }

  return (
    <div onClick={onClose} style={{position:'fixed', inset:0, zIndex:90, background:'rgba(4,5,10,.78)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:18}}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:'min(1180px, 100%)', maxHeight:'92vh', display:'flex', flexDirection:'column',
        background:`linear-gradient(180deg, ${T.bg1}, ${T.bg0})`,
        border:`1px solid ${T.sep2}`, borderRadius:22, overflow:'hidden',
        boxShadow:`0 0 0 1px rgba(255,255,255,.03), 0 40px 120px -24px rgba(0,0,0,.9), 0 0 80px -30px ${tipo.color}55`,
      }}>
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div style={{position:'relative', padding:'20px 24px 16px', borderBottom:`1px solid ${T.sep}`,
          background:`radial-gradient(1200px 280px at 12% -40%, ${tipo.color}1c, transparent 60%), radial-gradient(900px 240px at 95% -50%, ${T.blue}14, transparent 60%)`}}>
          <button onClick={onClose} style={{position:'absolute', top:14, right:14, background:T.gray, border:`1px solid ${T.grayBor}`, color:T.ink2, borderRadius:10, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}><X size={16}/></button>
          <div style={{display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap'}}>
            <Avatar nome={tk.nome_cliente} size={58} glow/>
            <div style={{flex:1, minWidth:240}}>
              <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
                <span style={{fontSize:20, fontWeight:900, color:T.ink1, letterSpacing:-0.3}}>{tk.nome_cliente || 'Cliente'}</span>
                {flags.vip && <Bdg color={T.amber} dim={T.amberDim} bor={T.amberBor} icon={Crown} size="sm">VIP</Bdg>}
                {flags.problematico && <Bdg color={T.red} dim={T.redDim} bor={T.redBor} icon={Flame} size="sm">Recorrente em tickets</Bdg>}
                {flags.recorrente && !flags.vip && <Bdg color={T.cyan} dim={T.cyanDim} bor={T.cyanBor} icon={Star} size="sm">Cliente frequente</Bdg>}
                <Bdg color={flags.risco==='alto'?T.red:flags.risco==='medio'?T.orange:T.green}
                     dim={flags.risco==='alto'?T.redDim:flags.risco==='medio'?T.orangeDim:T.greenDim}
                     bor={flags.risco==='alto'?T.redBor:flags.risco==='medio'?T.orangeBor:T.greenBor}
                     icon={Gauge} size="sm">Risco {flags.risco || 'baixo'}</Bdg>
              </div>
              <div style={{display:'flex', gap:14, marginTop:6, fontSize:12.5, color:T.ink3, flexWrap:'wrap'}}>
                <span style={{display:'inline-flex',alignItems:'center',gap:5}}><Phone size={12}/>{fmtTel(tk.telefone)}</span>
                {tk.email && <span style={{display:'inline-flex',alignItems:'center',gap:5}}><Mail size={12}/>{tk.email}</span>}
                <span style={{display:'inline-flex',alignItems:'center',gap:5}}><MessageSquare size={12}/>{ctx?.cliente?.mensagens_total ?? '—'} mensagens</span>
                <span style={{display:'inline-flex',alignItems:'center',gap:5}}><Timer size={12}/>aberto há {fmtRel(tk.criado_em)}</span>
              </div>
            </div>
            {/* Esteira de status */}
            <div style={{display:'flex', alignItems:'center', gap:0}}>
              {ESTEIRA.map((sk, i) => {
                const sd = STATUS[sk]; const ativo = tk.status===sk
                const passou = ESTEIRA.indexOf(tk.status) > i || tk.status==='encerrada'
                return (
                  <div key={sk} style={{display:'flex', alignItems:'center'}}>
                    <button onClick={()=>!mudando && tk.status!==sk && pedirAcao(sk)} disabled={mudando}
                      title={`Mover para ${sd.label}`}
                      style={{display:'flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:999, cursor:'pointer',
                        fontSize:12, fontWeight:800, transition:'all .2s',
                        color: ativo ? sd.color : passou ? T.ink2 : T.ink4,
                        background: ativo ? sd.dim : 'transparent',
                        border:`1px solid ${ativo ? sd.bor : T.sep}`,
                        boxShadow: ativo ? `0 0 18px -6px ${sd.color}88` : 'none'}}>
                      <sd.icon size={12}/>{sd.label}
                    </button>
                    {i < ESTEIRA.length-1 && <div style={{width:18, height:1, background: passou ? T.ink3 : T.sep2}}/>}
                  </div>
                )
              })}
            </div>
          </div>
          {/* SLA */}
          {(() => { const sla = slaInfo(tk.criado_em); return ['resolvida','encerrada'].includes(tk.status) ? null : (
            <div style={{marginTop:12}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:10.5, fontWeight:800, color:sla.color, marginBottom:4, textTransform:'uppercase', letterSpacing:0.6}}>
                <span>SLA do ticket</span><span>{sla.label}</span>
              </div>
              <div style={{height:5, borderRadius:99, background:T.bg3, overflow:'hidden'}}>
                <div style={{width:`${Math.min(100,sla.pct)}%`, height:'100%', borderRadius:99, background:`linear-gradient(90deg, ${sla.color}aa, ${sla.color})`, boxShadow:`0 0 12px ${sla.color}88`, transition:'width .5s'}}/>
              </div>
            </div>
          )})()}
          {/* Ticket meta */}
          <div style={{display:'flex', gap:8, marginTop:14, alignItems:'center', flexWrap:'wrap'}}>
            <Bdg color={T.ink2} dim={T.bg3} bor={T.sep2} icon={FileText} size="sm">{tk.ticket_id || `#${tk.id}`}</Bdg>
            {(() => { const cn = CANAIS[tk.canal] || CANAIS.whatsapp; return (
              <span style={{display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:999, fontSize:12, fontWeight:800,
                color:cn.color, background:`${cn.color}14`, border:`1px solid ${cn.color}44`}}>
                {cn.emoji} {cn.label}
              </span>
            )})()}
            {tk.cpf_cnpj && <Bdg color={T.ink2} dim={T.bg3} bor={T.sep2} icon={User} size="sm">{tk.cpf_cnpj}</Bdg>}
            <Bdg color={tipo.color} dim={tipo.dim} bor={tipo.bor} icon={tipo.icon} size="sm">{tipo.label}</Bdg>
            <Bdg color={PRIO[tk.prioridade]?.color||T.blue} dim={T.bg3} bor={T.sep2} icon={Zap} size="sm">{PRIO[tk.prioridade]?.label||tk.prioridade}</Bdg>
            {tk.numero_pedido && <Bdg color={T.cyan} dim={T.cyanDim} bor={T.cyanBor} icon={Package} size="sm">Pedido #{tk.numero_pedido}</Bdg>}
            <span style={{fontSize:13, color:T.ink2, fontWeight:600, marginLeft:4}}>{tk.titulo || tk.descricao?.slice(0,90)}</span>
          </div>
          {/* KPIs do cliente */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:10, marginTop:14}}>
            {[
              { ic:Wallet,     lb:'Share total',     vl: loading?null:`R$ ${fmtBRL(share.total)}`,           cl:T.green },
              { ic:Package,    lb:'Pedidos',         vl: loading?null:String(share.pedidos ?? 0),            cl:T.blue  },
              { ic:BarChart3,  lb:'Ticket médio',    vl: loading?null:`R$ ${fmtBRL(share.ticket_medio)}`,    cl:T.purple},
              { ic:Truck,      lb:'Transp. favorita',vl: loading?null:(share.transportadora_favorita||'—'),  cl:T.amber },
              { ic:History,    lb:'Tickets antes',   vl: loading?null:String(ctx?.tickets_anteriores?.length ?? 0), cl:T.orange },
              { ic:Activity,   lb:'Densidade',       vl: loading?null:`${histArr.length} interações`,        cl:T.cyan  },
            ].map((k,i)=>(
              <div key={i} style={{background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:12, padding:'10px 12px'}}>
                <div style={{display:'flex',alignItems:'center',gap:6, fontSize:10.5, fontWeight:800, color:T.ink3, textTransform:'uppercase', letterSpacing:0.7}}><k.ic size={12} color={k.cl}/>{k.lb}</div>
                {k.vl===null ? <Skel w="70%" h={18} style={{marginTop:6}}/> :
                  <div style={{fontSize:17, fontWeight:900, color:T.ink1, marginTop:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{k.vl}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ── CORPO: 2 colunas ─────────────────────────────────────────────── */}
        <div style={{flex:1, overflowY:'auto', padding:18, display:'grid', gridTemplateColumns:'1.25fr 1fr', gap:14, alignItems:'start'}}>

          {/* ════ COLUNA ESQUERDA — timeline + resposta ════ */}
          <div style={{display:'flex', flexDirection:'column', gap:14}}>

            <Sec icon={History} color={T.blue} title="Timeline do ticket"
              extra={<span style={{fontSize:11, color:T.ink3}}>{histArr.length} eventos</span>}>
              <div style={{display:'flex', flexDirection:'column', gap:0, maxHeight:300, overflowY:'auto', paddingRight:4}}>
                {histArr.length === 0 && <div style={{fontSize:12.5, color:T.ink3}}>Sem eventos ainda.</div>}
                {[...histArr].reverse().map((h, i) => (
                  <div key={i} style={{display:'flex', gap:10, position:'relative', paddingBottom: i===histArr.length-1?0:14}}>
                    {i < histArr.length-1 && <div style={{position:'absolute', left:11, top:24, bottom:0, width:1, background:T.sep2}}/>}
                    <div style={{width:23, height:23, borderRadius:8, flexShrink:0, background:T.bg3, border:`1px solid ${T.sep2}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11}}>
                      {HIST_ICON[h.acao] || (String(h.acao||'').startsWith('status') ? '🔁' : '•')}
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{display:'flex', gap:8, alignItems:'baseline', flexWrap:'wrap'}}>
                        <span style={{fontSize:12, fontWeight:800, color: h.acao==='cliente_adicionou'?T.amber:T.ink2}}>
                          {h.acao==='cliente_adicionou' ? 'Cliente adicionou informação' : h.acao}
                        </span>
                        <span style={{fontSize:10.5, color:T.ink4}}>{h.por} · {fmtD(h.em)} {new Date(h.em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                      {h.nota && <div style={{fontSize:12.5, color:T.ink2, marginTop:2, lineHeight:1.45}}>{h.nota}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex', gap:8, marginTop:12}}>
                <input value={nota} onChange={e=>setNota(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addNota()}
                  placeholder="Adicionar nota interna…"
                  style={{flex:1, background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:10, padding:'9px 12px', color:T.ink1, fontSize:13, outline:'none'}}/>
                <button onClick={addNota} style={{background:T.blueDim, border:`1px solid ${T.blueBor}`, color:T.blue, borderRadius:10, padding:'0 14px', cursor:'pointer', fontWeight:700, fontSize:12.5}}>Anotar</button>
              </div>
            </Sec>

            <Sec icon={Send} color={T.green} title="Responder ao cliente"
              extra={
                <button onClick={gerarIA} disabled={gerando}
                  style={{display:'flex', alignItems:'center', gap:6, background:`linear-gradient(135deg, ${T.purple}22, ${T.blue}22)`,
                    border:`1px solid ${T.purpleBor}`, color:T.purple, borderRadius:999, padding:'5px 12px',
                    cursor:'pointer', fontWeight:800, fontSize:11.5,
                    boxShadow:`0 0 16px -6px ${T.purple}66`}}>
                  <Sparkles size={12}/>{gerando ? 'Gerando…' : 'Gerar com IA'}
                </button>
              }>
              <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:10}}>
                {RESPOSTAS_RAPIDAS.map(rr => (
                  <button key={rr.id} onClick={()=>usarRapida(rr)}
                    style={{background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink2, borderRadius:999, padding:'4px 11px', cursor:'pointer', fontSize:11.5, fontWeight:600}}>
                    {rr.label}
                  </button>
                ))}
              </div>
              <textarea value={resp} onChange={e=>setResp(e.target.value)} rows={5}
                placeholder="Escreva a resposta, use uma resposta rápida ou gere com IA…"
                style={{width:'100%', boxSizing:'border-box', background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:12, padding:'11px 13px', color:T.ink1, fontSize:13.5, lineHeight:1.5, outline:'none', resize:'vertical', fontFamily:'inherit'}}/>
              <div style={{display:'flex', gap:8, marginTop:10, alignItems:'center'}}>
                <button onClick={enviarWhats} disabled={enviando || !resp.trim()}
                  style={{display:'flex', alignItems:'center', gap:7, background: resp.trim()?T.greenDim:T.bg3,
                    border:`1px solid ${resp.trim()?T.greenBor:T.sep2}`, color: resp.trim()?T.green:T.ink4,
                    borderRadius:11, padding:'9px 18px', cursor: resp.trim()?'pointer':'default', fontWeight:800, fontSize:13,
                    boxShadow: resp.trim()?`0 0 22px -8px ${T.green}77`:'none'}}>
                  <Send size={14}/>{enviando ? 'Enviando…' : 'Enviar WhatsApp'}
                </button>
                <button onClick={()=>{ navigator.clipboard?.writeText(resp); setCopiado(true); setTimeout(()=>setCopiado(false),1500) }}
                  disabled={!resp.trim()}
                  style={{display:'flex', alignItems:'center', gap:6, background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink2, borderRadius:11, padding:'9px 13px', cursor:'pointer', fontWeight:700, fontSize:12.5}}>
                  {copiado ? <Check size={13} color={T.green}/> : <Copy size={13}/>}{copiado?'Copiado':'Copiar'}
                </button>
                {erro && <span style={{fontSize:12, color:T.red}}>{erro}</span>}
              </div>
            </Sec>
          </div>

          {/* ════ COLUNA DIREITA — dossiê ════ */}
          <div style={{display:'flex', flexDirection:'column', gap:14}}>

            <Sec icon={Lightbulb} color={T.amber} title="Plano de resposta">
              {loading ? <><Skel/><Skel w="85%" style={{marginTop:8}}/></> : (
                <div style={{display:'flex', flexDirection:'column', gap:8}}>
                  {(ctx?.plano||[]).map((p,i)=>(
                    <div key={i} style={{display:'flex', gap:9, fontSize:12.5, color:T.ink2, lineHeight:1.5}}>
                      <BadgeCheck size={14} color={T.amber} style={{flexShrink:0, marginTop:2}}/>{p}
                    </div>
                  ))}
                </div>
              )}
            </Sec>

            {(loading || ras) && (
              <Sec icon={Radio} color={ras?.atrasado ? T.red : T.green} title="Rastreio em curso"
                extra={ras && (
                  <span style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:800,
                    color: ras.atrasado ? T.red : T.green}}>
                    <span style={{width:7, height:7, borderRadius:99, background: ras.atrasado?T.red:T.green,
                      boxShadow:`0 0 10px ${ras.atrasado?T.red:T.green}`, animation:'oc-pulse 1.6s infinite'}}/>
                    {ras.atrasado ? 'SINAL DE ATRASO' : ras.em_curso ? 'EM MOVIMENTO' : 'MONITORANDO'}
                  </span>
                )}>
                {loading ? <><Skel/><Skel w="60%" style={{marginTop:8}}/></> : ras && (
                  <div style={{display:'flex', flexDirection:'column', gap:8}}>
                    <div style={{fontSize:13.5, fontWeight:800, color:T.ink1}}>{ras.ultimo_status || 'Aguardando movimentação'}</div>
                    {ras.ultimo_evento && <div style={{fontSize:12.5, color:T.ink2, lineHeight:1.45}}>"{ras.ultimo_evento}"</div>}
                    <div style={{display:'flex', gap:12, fontSize:11.5, color:T.ink3, flexWrap:'wrap'}}>
                      {ras.codigo && <span>Código: <b style={{color:T.ink2}}>{ras.codigo}</b></span>}
                      {ras.dias_desde_saida != null && <span>{ras.dias_desde_saida}d desde a saída</span>}
                      {ras.dias_sem_movimento != null && <span style={{color: ras.dias_sem_movimento>=4 ? T.red : T.ink3}}>{ras.dias_sem_movimento}d sem movimento</span>}
                    </div>
                    {ras.atrasado && (
                      <div style={{background:T.redDim, border:`1px solid ${T.redBor}`, borderRadius:10, padding:'8px 11px', fontSize:12, color:T.red, fontWeight:700, display:'flex', gap:7, alignItems:'center'}}>
                        <AlertTriangle size={13}/>Aja preventivamente: reconheça o atraso antes do cliente cobrar.
                      </div>
                    )}
                  </div>
                )}
              </Sec>
            )}

            <Sec icon={Package} color={T.blue} title="Últimos pedidos"
              extra={!loading && <span style={{fontSize:11, color:T.ink3}}>{ctx?.pedidos?.length||0}</span>}>
              {loading ? <><Skel/><Skel style={{marginTop:8}}/><Skel w="75%" style={{marginTop:8}}/></> : (
                <div style={{display:'flex', flexDirection:'column', gap:7, maxHeight:210, overflowY:'auto'}}>
                  {(ctx?.pedidos||[]).length===0 && <div style={{fontSize:12.5, color:T.ink3}}>Nenhum pedido vinculado encontrado.</div>}
                  {(ctx?.pedidos||[]).map((p,i)=>(
                    <div key={i} style={{display:'flex', alignItems:'center', gap:10, padding:'7px 10px', background:T.bg1, border:`1px solid ${String(p.numero_pedido)===String(tk.numero_pedido)?T.cyanBor:T.sep}`, borderRadius:10}}>
                      <span style={{fontSize:12, fontWeight:800, color: String(p.numero_pedido)===String(tk.numero_pedido)?T.cyan:T.ink2, minWidth:64}}>#{p.numero_pedido}</span>
                      <span style={{fontSize:11, color:T.ink3, flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                        {p.transportadora || '—'}{p.municipio ? ` · ${p.municipio}/${p.uf}` : ''}
                      </span>
                      <span style={{fontSize:11, color:T.ink3}}>{fmtD(p.data_pedido)}</span>
                      <span style={{fontSize:12.5, fontWeight:800, color:T.green}}>{p.total!=null?`R$ ${fmtBRL(p.total)}`:'—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </Sec>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
              <Sec icon={Activity} color={T.purple} title="Disparos">
                {loading ? <Skel/> : (
                  <div style={{display:'flex', flexDirection:'column', gap:5, maxHeight:150, overflowY:'auto'}}>
                    {(ctx?.disparos||[]).length===0 && <div style={{fontSize:12, color:T.ink3}}>Nenhum.</div>}
                    {(ctx?.disparos||[]).slice(0,8).map((d,i)=>(
                      <div key={i} style={{display:'flex', justifyContent:'space-between', gap:8, fontSize:11.5}}>
                        <span style={{color:T.ink2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{d.gatilho}</span>
                        <span style={{color: d.status==='enviado'?T.green:T.red, flexShrink:0}}>{fmtRel(d.criado_em)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Sec>
              <Sec icon={ClipboardList} color={T.orange} title="Tickets anteriores">
                {loading ? <Skel/> : (
                  <div style={{display:'flex', flexDirection:'column', gap:5, maxHeight:150, overflowY:'auto'}}>
                    {(ctx?.tickets_anteriores||[]).length===0 && <div style={{fontSize:12, color:T.ink3}}>Primeiro ticket. 🎉</div>}
                    {(ctx?.tickets_anteriores||[]).map((t,i)=>(
                      <div key={i} style={{display:'flex', justifyContent:'space-between', gap:8, fontSize:11.5}}>
                        <span style={{color:T.ink2}}>{t.ticket_id} · {TIPOS[t.tipo]?.label||t.tipo}</span>
                        <span style={{color: STATUS[t.status]?.color || T.ink3, fontWeight:700}}>{STATUS[t.status]?.label||t.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Sec>
            </div>
          </div>
        </div>

        {/* ── MODAL DE AÇÃO — transição de status exige registrar o que foi feito ── */}
        {acaoModal && (
          <div onClick={()=>setAcaoModal(null)} style={{position:'absolute', inset:0, zIndex:5, background:'rgba(4,5,10,.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
            <div onClick={e=>e.stopPropagation()} style={{width:'min(480px,100%)', background:`linear-gradient(180deg, ${T.bg2}, ${T.bg1})`, border:`1px solid ${STATUS[acaoModal].bor}`, borderRadius:16, padding:20, boxShadow:`0 0 60px -16px ${STATUS[acaoModal].color}66`}}>
              <div style={{display:'flex', alignItems:'center', gap:9, marginBottom:4}}>
                {(() => { const Ic = STATUS[acaoModal].icon; return <Ic size={17} color={STATUS[acaoModal].color}/> })()}
                <span style={{fontSize:15, fontWeight:900, color:T.ink1}}>Mover para “{STATUS[acaoModal].label}”</span>
              </div>
              <div style={{fontSize:12.5, color:T.ink3, marginBottom:12, lineHeight:1.5}}>
                Toda transição registra a <b style={{color:T.ink2}}>ação executada</b> na timeline — é o que o próximo agente (e o cliente) vai ler.
              </div>
              <textarea autoFocus value={acaoTxt} onChange={e=>setAcaoTxt(e.target.value)} rows={3}
                placeholder={STATUS[acaoModal].acaoHint}
                style={{width:'100%', boxSizing:'border-box', background:T.bg0, border:`1px solid ${T.sep2}`, borderRadius:11, padding:'10px 12px', color:T.ink1, fontSize:13, lineHeight:1.5, outline:'none', resize:'vertical', fontFamily:'inherit'}}/>
              <div style={{display:'flex', gap:8, marginTop:12}}>
                <button onClick={confirmarAcao} disabled={!acaoTxt.trim() || mudando}
                  style={{flex:1, background: acaoTxt.trim()?STATUS[acaoModal].dim:T.bg3, border:`1px solid ${acaoTxt.trim()?STATUS[acaoModal].bor:T.sep2}`,
                    color: acaoTxt.trim()?STATUS[acaoModal].color:T.ink4, borderRadius:11, padding:'10px', cursor: acaoTxt.trim()?'pointer':'default',
                    fontWeight:900, fontSize:13, boxShadow: acaoTxt.trim()?`0 0 22px -8px ${STATUS[acaoModal].color}88`:'none'}}>
                  {mudando ? 'Registrando…' : `Confirmar — ${STATUS[acaoModal].label}`}
                </button>
                <button onClick={()=>setAcaoModal(null)} style={{background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink2, borderRadius:11, padding:'10px 16px', cursor:'pointer', fontWeight:700, fontSize:12.5}}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══ MODAL NOVA OCORRÊNCIA ════════════════════════════════════════════════════
function ModalNova({ onSalvo, onClose }) {
  const [f, setF] = useState({ telefone:'', nomeCliente:'', email:'', numeroPedido:'', titulo:'', tipo:'entrega', descricao:'', prioridade:'normal', canal:'whatsapp', cpfCnpj:'' })
  const [saving, setSaving] = useState(false)
  const [erro,   setErro]   = useState('')
  const [anexado,setAnexado]= useState(null)
  const set = (k,v)=>setF(p=>({...p,[k]:v}))

  async function salvar() {
    if (!f.telefone.trim() || !f.descricao.trim()) { setErro('Telefone e descrição são obrigatórios'); return }
    setSaving(true); setErro('')
    try {
      const r = await fetch(`${BASE}/api/ocorrencias`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(f),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro || 'Falha ao salvar')
      if (d.anexado) { setAnexado(d.ocorrencia); onSalvo?.(d.ocorrencia); return }
      onSalvo?.(d.ocorrencia || d); onClose()
    } catch(e) { setErro(e.message) } finally { setSaving(false) }
  }

  const inputSt = {width:'100%', boxSizing:'border-box', background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:10, padding:'9px 12px', color:T.ink1, fontSize:13, outline:'none'}
  const lblSt   = {fontSize:11, fontWeight:800, color:T.ink3, textTransform:'uppercase', letterSpacing:0.7, marginBottom:5, display:'block'}

  return (
    <div onClick={onClose} style={{position:'fixed', inset:0, zIndex:95, background:'rgba(4,5,10,.78)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:18}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'min(560px,100%)', background:`linear-gradient(180deg, ${T.bg1}, ${T.bg0})`, border:`1px solid ${T.sep2}`, borderRadius:18, padding:22, boxShadow:'0 40px 100px -20px rgba(0,0,0,.85)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
          <div style={{fontSize:16, fontWeight:900, color:T.ink1, display:'flex', alignItems:'center', gap:8}}><Plus size={17} color={T.amber}/>Nova ocorrência</div>
          <button onClick={onClose} style={{background:T.gray, border:`1px solid ${T.grayBor}`, color:T.ink2, borderRadius:9, width:30, height:30, cursor:'pointer'}}><X size={15}/></button>
        </div>

        {anexado ? (
          <div>
            <div style={{background:T.amberDim, border:`1px solid ${T.amberBor}`, borderRadius:13, padding:16, display:'flex', gap:11}}>
              <AlertTriangle size={19} color={T.amber} style={{flexShrink:0, marginTop:2}}/>
              <div style={{fontSize:13, color:T.ink1, lineHeight:1.55}}>
                Este cliente já tem o ticket <b style={{color:T.amber}}>{anexado.ticket_id}</b> <b>em aberto</b> — pela esteira, não abrimos ticket paralelo.
                <br/>A informação foi <b>anexada à timeline</b> do ticket existente.
              </div>
            </div>
            <button onClick={onClose} style={{marginTop:14, width:'100%', background:T.blueDim, border:`1px solid ${T.blueBor}`, color:T.blue, borderRadius:11, padding:'10px', cursor:'pointer', fontWeight:800, fontSize:13}}>Entendi — abrir o ticket existente</button>
          </div>
        ) : (
          <>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              <div><label style={lblSt}>Telefone *</label><input style={inputSt} value={f.telefone} onChange={e=>set('telefone',e.target.value)} placeholder="(19) 9…"/></div>
              <div><label style={lblSt}>Nome do cliente</label><input style={inputSt} value={f.nomeCliente} onChange={e=>set('nomeCliente',e.target.value)}/></div>
              <div><label style={lblSt}>E-mail</label><input style={inputSt} value={f.email} onChange={e=>set('email',e.target.value)}/></div>
              <div><label style={lblSt}>CPF / CNPJ</label><input style={inputSt} value={f.cpfCnpj} onChange={e=>set('cpfCnpj',e.target.value)} placeholder="000.000.000-00"/></div>
              <div><label style={lblSt}>Canal de origem</label>
                <select style={inputSt} value={f.canal} onChange={e=>set('canal',e.target.value)}>
                  {Object.entries(CANAIS).map(([k,v])=><option key={k} value={k}>{v.emoji} {v.label}</option>)}
                </select></div>
              <div><label style={lblSt}>Nº do pedido</label><input style={inputSt} value={f.numeroPedido} onChange={e=>set('numeroPedido',e.target.value)}/></div>
              <div><label style={lblSt}>Tipo</label>
                <select style={inputSt} value={f.tipo} onChange={e=>set('tipo',e.target.value)}>
                  {Object.entries(TIPOS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select></div>
              <div><label style={lblSt}>Prioridade</label>
                <select style={inputSt} value={f.prioridade} onChange={e=>set('prioridade',e.target.value)}>
                  {Object.entries(PRIO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select></div>
            </div>
            <div style={{marginTop:12}}><label style={lblSt}>Título</label><input style={inputSt} value={f.titulo} onChange={e=>set('titulo',e.target.value)} placeholder="Resumo em uma linha"/></div>
            <div style={{marginTop:12}}><label style={lblSt}>Descrição *</label>
              <textarea rows={4} style={{...inputSt, resize:'vertical', fontFamily:'inherit'}} value={f.descricao} onChange={e=>set('descricao',e.target.value)} placeholder="O que aconteceu?"/></div>
            {erro && <div style={{marginTop:10, fontSize:12.5, color:T.red}}>{erro}</div>}
            <button onClick={salvar} disabled={saving}
              style={{marginTop:16, width:'100%', background:`linear-gradient(135deg, ${T.amber}26, ${T.orange}26)`, border:`1px solid ${T.amberBor}`, color:T.amber, borderRadius:12, padding:'11px', cursor:'pointer', fontWeight:900, fontSize:13.5, boxShadow:`0 0 26px -10px ${T.amber}88`}}>
              {saving ? 'Salvando…' : 'Abrir ticket'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ═══ PÁGINA ═══════════════════════════════════════════════════════════════════
export default function PageOcorrencias() {
  const [dados,  setDados]  = useState({ ocorrencias:[], stats:{} })
  const [loading,setLoading]= useState(true)
  const [filtro, setFiltro] = useState('ativas')
  const [busca,  setBusca]  = useState('')
  const [sel,    setSel]    = useState(null)
  const [nova,   setNova]   = useState(false)

  const carregar = useCallback(() => {
    setLoading(true)
    fetch(`${BASE}/api/ocorrencias`)
      .then(r=>r.json()).then(d=>{ setDados(d); setLoading(false) })
      .catch(()=>setLoading(false))
  }, [])
  useEffect(()=>{ carregar(); const t=setInterval(carregar, 60000); return ()=>clearInterval(t) }, [carregar])

  const lista = useMemo(() => {
    let l = dados.ocorrencias || []
    if (filtro==='ativas')   l = l.filter(o=>['aberta','em_analise','em_andamento'].includes(o.status))
    else if (filtro!=='todas') l = l.filter(o=>o.status===filtro)
    if (busca.trim()) {
      const b = busca.toLowerCase()
      l = l.filter(o => [o.nome_cliente,o.telefone,o.ticket_id,o.titulo,o.descricao,o.numero_pedido].join(' ').toLowerCase().includes(b))
    }
    return l
  }, [dados, filtro, busca])

  const st = dados.stats || {}
  const FILTROS = [
    { k:'ativas',       lb:`Ativas`,        n:(parseInt(st.abertas||0)+parseInt(st.em_analise||0)+parseInt(st.em_andamento||0)), cl:T.amber },
    { k:'aberta',       lb:'Abertas',       n:st.abertas,      cl:T.amber  },
    { k:'em_analise',   lb:'Em análise',    n:st.em_analise,   cl:T.blue   },
    { k:'em_andamento', lb:'Em andamento',  n:st.em_andamento, cl:T.purple },
    { k:'resolvida',    lb:'Resolvidas',    n:st.resolvidas,   cl:T.green  },
    { k:'todas',        lb:'Todas',         n:st.total,        cl:T.ink3   },
  ]

  return (
    <div style={{minHeight:'100vh', background:T.bg0, padding:'22px 26px', fontFamily:'Inter, system-ui, sans-serif'}}>
      <style>{`
        @keyframes oc-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes oc-pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
        ::-webkit-scrollbar{width:8px;height:8px} ::-webkit-scrollbar-thumb{background:${T.bg4};border-radius:99px}
      `}</style>

      {/* Header */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap', marginBottom:18}}>
        <div>
          <div style={{fontSize:21, fontWeight:900, color:T.ink1, letterSpacing:-0.4, display:'flex', alignItems:'center', gap:10}}>
            <ShieldAlert size={21} color={T.amber}/>Central de Ocorrências
          </div>
          <div style={{fontSize:12.5, color:T.ink3, marginTop:3}}>Tickets sensíveis · esteira: aberta → em análise → em andamento → resolvida · 1 ticket aberto por cliente</div>
        </div>
        <div style={{display:'flex', gap:9}}>
          <button onClick={carregar} style={{display:'flex', alignItems:'center', gap:7, background:T.bg2, border:`1px solid ${T.sep2}`, color:T.ink2, borderRadius:11, padding:'9px 14px', cursor:'pointer', fontWeight:700, fontSize:12.5}}>
            <RefreshCw size={13} style={loading?{animation:'spin 1s linear infinite'}:{}}/>Atualizar
          </button>
          <button onClick={()=>setNova(true)} style={{display:'flex', alignItems:'center', gap:7, background:`linear-gradient(135deg, ${T.amber}26, ${T.orange}26)`, border:`1px solid ${T.amberBor}`, color:T.amber, borderRadius:11, padding:'9px 16px', cursor:'pointer', fontWeight:900, fontSize:12.5, boxShadow:`0 0 24px -10px ${T.amber}88`}}>
            <Plus size={14}/>Nova ocorrência
          </button>
        </div>
      </div>

      {/* Hero stats */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(170px, 1fr))', gap:12, marginBottom:18}}>
        {[
          { lb:'Tickets ativos',  vl:(parseInt(st.abertas||0)+parseInt(st.em_analise||0)+parseInt(st.em_andamento||0)), ic:Flame,       cl:T.amber,  sub:'aguardando ação' },
          { lb:'Em análise',      vl:st.em_analise||0,    ic:Search,      cl:T.blue,   sub:'apuração em curso' },
          { lb:'Em andamento',    vl:st.em_andamento||0,  ic:RefreshCcw,  cl:T.purple, sub:'ação em execução' },
          { lb:'Urgentes',        vl:st.urgentes||0,      ic:Zap,         cl:T.red,    sub:'prioridade máxima' },
          { lb:'Resolvidos',      vl:st.resolvidas||0,    ic:CheckCircle, cl:T.green,  sub:'histórico total' },
        ].map((c,i)=>(
          <div key={i} style={{position:'relative', overflow:'hidden', background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:16, padding:'15px 16px',
            boxShadow: parseInt(c.vl)>0 && (c.cl===T.red||c.cl===T.amber) ? `0 0 32px -14px ${c.cl}99` : 'none'}}>
            <div style={{position:'absolute', top:-30, right:-30, width:90, height:90, borderRadius:99, background:`radial-gradient(circle, ${c.cl}22, transparent 70%)`}}/>
            <div style={{display:'flex', alignItems:'center', gap:7, fontSize:11, fontWeight:800, color:T.ink3, textTransform:'uppercase', letterSpacing:0.7}}>
              <c.ic size={13} color={c.cl}/>{c.lb}
            </div>
            <div style={{fontSize:28, fontWeight:900, color: parseInt(c.vl)>0 ? c.cl : T.ink1, marginTop:6, lineHeight:1}}>{c.vl}</div>
            <div style={{fontSize:10.5, color:T.ink4, marginTop:4}}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Filtros + busca */}
      <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:16}}>
        <div style={{display:'flex', gap:4, background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:12, padding:4}}>
          {FILTROS.map(f=>(
            <button key={f.k} onClick={()=>setFiltro(f.k)}
              style={{display:'flex', alignItems:'center', gap:6, background: filtro===f.k?T.bg4:'transparent',
                border:'none', color: filtro===f.k?T.ink1:T.ink3, borderRadius:9, padding:'7px 13px', cursor:'pointer', fontWeight:800, fontSize:12}}>
              {f.lb}
              <span style={{fontSize:10.5, fontWeight:900, color:f.cl, background:T.bg1, borderRadius:99, padding:'1px 7px'}}>{f.n ?? 0}</span>
            </button>
          ))}
        </div>
        <div style={{flex:1, minWidth:200, position:'relative'}}>
          <Search size={14} color={T.ink4} style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)'}}/>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar por cliente, telefone, ticket, pedido…"
            style={{width:'100%', boxSizing:'border-box', background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:12, padding:'10px 13px 10px 34px', color:T.ink1, fontSize:13, outline:'none'}}/>
        </div>
        {parseInt(st.urgentes||0) > 0 && (
          <Bdg color={T.red} dim={T.redDim} bor={T.redBor} icon={Zap} size="sm">{st.urgentes} urgente{st.urgentes>1?'s':''}</Bdg>
        )}
      </div>

      {/* Lista */}
      <div style={{display:'flex', flexDirection:'column', gap:9}}>
        {loading && [1,2,3].map(i=><Skel key={i} h={74} r={14}/>)}
        {!loading && lista.length===0 && (
          <div style={{textAlign:'center', padding:'60px 0', color:T.ink3, fontSize:13.5}}>
            <CheckCircle size={36} color={T.green} style={{marginBottom:10}}/>
            <div>Nenhum ticket {filtro==='ativas'?'ativo':'aqui'}. Tudo em dia. 💎</div>
          </div>
        )}
        {!loading && lista.map(o => {
          const sd = STATUS[o.status] || STATUS.aberta
          const tp = TIPOS[o.tipo] || TIPOS.outro
          const pr = PRIO[o.prioridade] || PRIO.normal
          const urgente = o.prioridade==='urgente' && !['resolvida','encerrada'].includes(o.status)
          return (
            <div key={o.id} onClick={()=>setSel(o)}
              style={{display:'flex', alignItems:'center', gap:14, padding:'13px 16px', cursor:'pointer',
                background:T.bg1, border:`1px solid ${urgente?T.redBor:T.sep2}`, borderRadius:14,
                boxShadow: urgente ? `0 0 26px -12px ${T.red}88` : 'none',
                transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.background=T.bg2; e.currentTarget.style.transform='translateY(-1px)'}}
              onMouseLeave={e=>{e.currentTarget.style.background=T.bg1; e.currentTarget.style.transform='none'}}>
              <Avatar nome={o.nome_cliente} size={42}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                  <span style={{fontSize:14, fontWeight:800, color:T.ink1}}>{o.nome_cliente || fmtTel(o.telefone) || 'Cliente'}</span>
                  <span style={{fontSize:11, color:T.ink4, fontWeight:700}}>{o.ticket_id}</span>
                  <Bdg color={tp.color} dim={tp.dim} bor={tp.bor} icon={tp.icon}>{tp.label}</Bdg>
                  {(() => { const cn = CANAIS[o.canal] || CANAIS.whatsapp; return (
                    <span style={{fontSize:11, fontWeight:700, color:cn.color}}>{cn.emoji} {cn.label}</span>
                  )})()}
                  {o.numero_pedido && <span style={{fontSize:11, color:T.cyan}}>#{o.numero_pedido}</span>}
                </div>
                <div style={{fontSize:12.5, color:T.ink3, marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                  {o.titulo || o.descricao}
                </div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:10, flexShrink:0}}>
                {urgente && <Zap size={14} color={T.red}/>}
                <span style={{fontSize:11, color:pr.color, fontWeight:800}}>{pr.label}</span>
                <Bdg color={sd.color} dim={sd.dim} bor={sd.bor} icon={sd.icon} size="sm">{sd.label}</Bdg>
                <span style={{fontSize:11.5, color:T.ink4, minWidth:38, textAlign:'right'}}>{fmtRel(o.atualizado_em || o.criado_em)}</span>
                <ChevronRight size={15} color={T.ink4}/>
              </div>
            </div>
          )
        })}
      </div>

      {sel  && <Modal360 oc={sel} onAtualizado={()=>carregar()} onClose={()=>setSel(null)}/>}
      {nova && <ModalNova onSalvo={()=>carregar()} onClose={()=>setNova(false)}/>}
    </div>
  )
}
