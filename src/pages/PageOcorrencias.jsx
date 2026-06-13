import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search, RefreshCw, Plus, X, Truck, CreditCard, Package, RotateCcw,
  MessageSquare, Clock, CheckCircle, User, Send, FileText,
  AlertTriangle, Tag, Phone, Mail, Zap, ChevronRight, ShieldAlert,
  Circle, XCircle, Sparkles, History, MapPin, Star, Copy, Check,
  RefreshCcw, TrendingUp, Crown, Flame, Activity, Gauge, Radio,
  ClipboardList, Lightbulb, BadgeCheck, Timer, Wallet, BarChart3,
  Paperclip, Upload, ExternalLink, Thermometer, MessagesSquare,
  Gift, AlarmClock, UserCheck, FileText as FileTextIc, Eye, TrendingDown,
  Globe, ShoppingCart, ShoppingBag, Music2, Smartphone, Image as ImageIc,
  PlusCircle, StickyNote, MessageCircle, UserPlus, Repeat, Inbox, BrainCircuit,
  Play, Download, GitMerge, PartyPopper, MapPin as MapPinIc, Hash, Pencil, Box,
  Users, Bell, Settings, Zap as ZapIc, Smile, Frown, Meh, Wand2,
  PauseCircle, ListChecks, Square, CheckSquare, MessageSquarePlus,
} from 'lucide-react'

// Identidade do agente (pedida 1x, fica no navegador)
function getAgente() {
  let a = localStorage.getItem('oc_agente') || ''
  if (!a) { a = (prompt('Seu nome (para atribuição e presença nos tickets):') || 'agente').trim().slice(0,40)
    localStorage.setItem('oc_agente', a) }
  return a
}

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
  aguardando_cliente: { label:'Aguardando cliente', color:T.cyan, dim:T.cyanDim, bor:T.cyanBor, icon:PauseCircle, acaoHint:'O que estamos esperando do cliente? (foto, resposta, documento) — o SLA pausa enquanto aguarda.' },
  resolvida:    { label:'Resolvida',    color:T.green,  dim:T.greenDim,  bor:T.greenBor,  icon:CheckCircle, acaoHint:'Como foi resolvido? Essa nota encerra o caso para o cliente.' },
  encerrada:    { label:'Encerrada',    color:T.ink3,   dim:T.bg3,       bor:T.sep2,      icon:XCircle,     acaoHint:'Motivo do encerramento sem resolução (ex.: cliente não retornou).' },
}
const ESTEIRA = ['aberta', 'em_analise', 'em_andamento', 'resolvida']
const CANAIS = {
  whatsapp:     { label:'WhatsApp',      color:'#25d366', icon:MessageCircle },
  site:         { label:'Site',          color:T.blue,    icon:Globe },
  mercadolivre: { label:'Mercado Livre', color:'#f4c20d', icon:ShoppingCart },
  shopee:       { label:'Shopee',        color:'#ee4d2d', icon:ShoppingBag },
  shein:        { label:'Shein',         color:T.ink2,    icon:ShoppingBag },
  tiktokshop:   { label:'TikTok Shop',   color:T.cyan,    icon:Music2 },
  email:        { label:'E-mail',        color:T.purple,  icon:Mail },
  telefone:     { label:'Telefone',      color:T.orange,  icon:Phone },
}
function CanalChip({ canal, size='sm' }) {
  const c = CANAIS[canal] || CANAIS.whatsapp
  return <Bdg color={c.color} dim={`${c.color}14`} bor={`${c.color}44`} icon={c.icon} size={size}>{c.label}</Bdg>
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
  { id:'resolvido', label:'Encerramento',        texto:'Confirmando: seu caso foi resolvido. Qualquer coisa, é só chamar por aqui. Obrigada pela paciência e pela confiança.' },
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
function Modal360({ oc, onAtualizado, onClose, inline = false }) {
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
  const [anexos,    setAnexos]    = useState([])
  const [subindo,   setSubindo]   = useState(false)
  const [enviandoAx,setEnviandoAx]= useState(null)
  const [tom,       setTom]       = useState('empático e resolutivo')
  const [colisao,   setColisao]   = useState(null)
  const [templates, setTemplates] = useState([])
  const [tagInput,  setTagInput]  = useState('')
  const [resumo,    setResumo]    = useState('')
  const [resumindo, setResumindo] = useState(false)
  const [pedDet,    setPedDet]    = useState(null)   // pedido aberto p/ detalhe
  const [pedLoad,   setPedLoad]   = useState(false)
  const [checklist, setChecklist] = useState(null)
  const [compMsg,   setCompMsg]   = useState('')

  useEffect(() => {
    fetch(`${BASE}/api/ocorrencias/${oc.id}/checklist`).then(r=>r.json()).then(d=>setChecklist(d.itens||[])).catch(()=>{})
  }, [oc.id])
  async function toggleCheck(i) {
    const novo = checklist.map((it,idx)=> idx===i ? {...it, ok:!it.ok} : it)
    setChecklist(novo)
    await fetch(`${BASE}/api/ocorrencias/${oc.id}/checklist`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ itens:novo }) }).catch(()=>{})
  }
  async function gerarCompensacao() {
    setCompMsg('Gerando…')
    try {
      const r = await fetch(`${BASE}/api/ocorrencias/${oc.id}/gerar-compensacao`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ por:getAgente() }) })
      const d = await r.json()
      if (!r.ok) { setCompMsg(d.erro || 'Falha'); return }
      setCompMsg(`Cupom ${d.codigo} gerado`)
      setResp(r2 => (r2 ? r2 + '\n\n' : '') + `Como forma de desculpas, gerei um cupom pra você: *${d.codigo}*.\n${d.explicacao||''}`)
      carregar()
    } catch { setCompMsg('Falha ao gerar') }
  }
  const [editNome,  setEditNome]  = useState(false)
  const [nomeNovo,  setNomeNovo]  = useState('')

  async function abrirPedido(num) {
    setPedDet({ numero: num, _loading:true }); setPedLoad(true)
    try {
      const r = await fetch(`${BASE}/api/ocorrencias/pedido/${num}/detalhe`)
      const d = await r.json()
      setPedDet(r.ok ? d : { numero:num, erro:d.erro })
    } catch { setPedDet({ numero:num, erro:'Falha ao carregar' }) } finally { setPedLoad(false) }
  }
  async function salvarNome() {
    const nm = nomeNovo.trim()
    if (!nm) { setEditNome(false); return }
    await fetch(`${BASE}/api/ocorrencias/${oc.id}/cliente`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ nome:nm }) })
    setEditNome(false); carregar()
  }
  async function sinalizarItem(it, situacao, motivo) {
    await fetch(`${BASE}/api/ocorrencias/${oc.id}/item-pedido`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ numero_pedido: pedDet?.numero, item_codigo: it.codigo,
        item_descricao: it.descricao, situacao, motivo, por: getAgente() }) })
    carregar()
  }

  const carregar = useCallback(() => {
    setLoading(true)
    fetch(`${BASE}/api/ocorrencias/${oc.id}/contexto360`)
      .then(r=>r.json()).then(d=>{ setCtx(d); setLoading(false) })
      .catch(()=>{ setErro('Falha ao carregar o dossiê'); setLoading(false) })
    fetch(`${BASE}/api/ocorrencias/${oc.id}/anexos`)
      .then(r=>r.json()).then(d=>setAnexos(d.anexos||[])).catch(()=>{})
    fetch(`${BASE}/api/ocorrencias/templates/lista`)
      .then(r=>r.json()).then(d=>setTemplates(d.templates||[])).catch(()=>{})
  }, [oc.id])
  async function salvarTemplate() {
    if (!resp.trim()) return
    const label = prompt('Nome do template:')
    if (!label) return
    const r = await fetch(`${BASE}/api/ocorrencias/templates/lista`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ label, texto: resp.trim() }) })
    const d = await r.json()
    if (d.template) setTemplates(t=>[...t, d.template])
  }
  async function delTemplate(tid) {
    await fetch(`${BASE}/api/ocorrencias/templates/lista/${tid}`, { method:'DELETE' })
    setTemplates(t=>t.filter(x=>x.id!==tid))
  }
  async function addTag() {
    const tg = tagInput.trim().toLowerCase()
    if (!tg) return
    const novas = [...(tk.tags||[]), tg].filter((v,i,a)=>a.indexOf(v)===i)
    setTagInput('')
    await patch({ tags: novas, por: getAgente() }).catch(e=>setErro(e.message))
  }
  async function fundirTicket() {
    const alvo = prompt('Fundir este ticket em qual? (informe o TK-ID, ex.: TK-0042)')
    if (!alvo) return
    const r = await fetch(`${BASE}/api/ocorrencias/${oc.id}/merge`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ alvo: alvo.trim(), por: getAgente() }) })
    const d = await r.json()
    if (!r.ok) { setErro(d.erro || 'Falha na fusão'); return }
    onAtualizado?.(); onClose?.()
  }
  useEffect(() => { carregar() }, [carregar])
  useEffect(() => {
    const agente = getAgente()
    const ping = () => fetch(`${BASE}/api/ocorrencias/${oc.id}/presenca`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ agente }),
    }).then(r=>r.json()).then(d=>setColisao(d.colisao ? d.com : null)).catch(()=>{})
    ping()
    const t = setInterval(ping, 45000)
    return () => clearInterval(t)
  }, [oc.id])

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
  async function macroResolver() {
    if (!resp.trim()) { setErro('Escreva a mensagem de resolução primeiro'); return }
    setEnviando(true); setErro('')
    try {
      const r = await fetch(`${BASE}/api/ocorrencias/${oc.id}/macro-resolver`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ mensagem:resp.trim(), por:getAgente() }) })
      if (!r.ok) throw new Error('Falha na macro')
      setResp(''); onAtualizado?.(); carregar()
    } catch(e) { setErro(e.message) } finally { setEnviando(false) }
  }
  async function resumirCaso() {
    setResumindo(true); setErro('')
    try {
      const r = await fetch(`${BASE}/api/ocorrencias/${oc.id}/resumir`, { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' })
      const d = await r.json()
      if (d.resumo) setResumo(d.resumo); else setErro(d.erro || 'Sem resumo')
    } catch { setErro('Falha ao resumir') } finally { setResumindo(false) }
  }
  async function subirArquivo(file) {
    if (!file) return
    if (file.size > 5*1024*1024) { setErro('Arquivo acima de 5MB'); return }
    setSubindo(true); setErro('')
    try {
      const base64 = await new Promise((res, rej) => {
        const fr = new FileReader()
        fr.onload  = () => res(String(fr.result).split(',')[1])
        fr.onerror = rej
        fr.readAsDataURL(file)
      })
      const r = await fetch(`${BASE}/api/ocorrencias/${oc.id}/anexos`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ nome: file.name, mime: file.type || 'application/octet-stream', base64 }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro || 'Falha no upload')
      setAnexos(a => [d.anexo, ...a]); carregar()
    } catch(e) { setErro(e.message) } finally { setSubindo(false) }
  }
  async function enviarAnexo(ax) {
    setEnviandoAx(ax.id); setErro('')
    try {
      const r = await fetch(`${BASE}/api/ocorrencias/${oc.id}/anexos/${ax.id}/enviar`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro || 'Falha ao enviar')
      setAnexos(list => list.map(a => a.id===ax.id ? {...a, enviado_em: new Date().toISOString()} : a))
      carregar()
    } catch(e) { setErro(e.message) } finally { setEnviandoAx(null) }
  }
  async function gerarIA() {
    setGerando(true); setErro('')
    try {
      const r = await fetch(`${BASE}/api/ocorrencias/${oc.id}/sugerir-resposta`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tom, contexto_extra: ras ? `Rastreio: ${ras.ultimo_status||''} — ${ras.ultimo_evento||''} ${ras.atrasado?'(EM ATRASO)':''}` : '' }),
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
    criada:PlusCircle, nota:StickyNote, whatsapp:MessageCircle, cliente_adicionou:UserPlus,
    anexo:Paperclip, anexo_enviado:Send, followup:AlarmClock, atribuido:UserCheck,
    escalonado:TrendingUp, merge:GitMerge,
  }

  const painel = (
      <div onClick={e=>e.stopPropagation()} style={{
        width: inline ? '100%' : 'min(1180px, 100%)',
        maxHeight: inline ? 'none' : '92vh',
        height: inline ? '100%' : 'auto',
        display:'flex', flexDirection:'column', position:'relative',
        background:`linear-gradient(180deg, ${T.bg1}, ${T.bg0})`,
        border:`1px solid ${T.sep2}`, borderRadius: inline ? 18 : 22, overflow:'hidden',
        boxShadow: inline
          ? `0 0 50px -24px ${tipo.color}44`
          : `0 0 0 1px rgba(255,255,255,.03), 0 40px 120px -24px rgba(0,0,0,.9), 0 0 80px -30px ${tipo.color}55`,
      }}>
        {colisao && (
          <div style={{display:'flex', alignItems:'center', gap:9, padding:'9px 18px', background:T.redDim, borderBottom:`1px solid ${T.redBor}`, fontSize:12.5, fontWeight:800, color:T.red}}>
            <Eye size={14}/>⚠️ {colisao} está neste ticket AGORA — combinem antes de responder o cliente.
          </div>
        )}
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div style={{position:'relative', padding:'20px 24px 16px', borderBottom:`1px solid ${T.sep}`,
          background:`radial-gradient(1200px 280px at 12% -40%, ${tipo.color}1c, transparent 60%), radial-gradient(900px 240px at 95% -50%, ${T.blue}14, transparent 60%)`}}>
          <button onClick={onClose} style={{position:'absolute', top:14, right:14, background:T.gray, border:`1px solid ${T.grayBor}`, color:T.ink2, borderRadius:10, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}><X size={16}/></button>
          <div style={{display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap'}}>
            <Avatar nome={tk.nome_cliente} size={58} glow/>
            <div style={{flex:1, minWidth:240}}>
              <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
                {editNome ? (
                  <span style={{display:'inline-flex', gap:6, alignItems:'center'}}>
                    <input autoFocus value={nomeNovo} onChange={e=>setNomeNovo(e.target.value)} onKeyDown={e=>e.key==='Enter'&&salvarNome()}
                      style={{background:T.bg1, border:`1px solid ${T.blueBor}`, borderRadius:8, padding:'4px 9px', color:T.ink1, fontSize:17, fontWeight:800, outline:'none'}}/>
                    <button onClick={salvarNome} style={{background:T.greenDim, border:`1px solid ${T.greenBor}`, color:T.green, borderRadius:8, padding:'4px 9px', cursor:'pointer'}}><Check size={13}/></button>
                  </span>
                ) : (
                  <span style={{display:'inline-flex', alignItems:'center', gap:7}}>
                    <span style={{fontSize:18, fontWeight:900, color:T.ink1, letterSpacing:-0.3}}>{ctx?.cliente?.nome || tk.nome_cliente || fmtTel(tk.telefone) || 'Cliente'}</span>
                    <button onClick={()=>{ setNomeNovo(ctx?.cliente?.nome||tk.nome_cliente||''); setEditNome(true) }}
                      title="Editar nome" style={{background:'none', border:'none', color:T.ink4, cursor:'pointer', display:'flex', padding:0}}><Pencil size={12}/></button>
                    {ctx?.cliente?.nome_origem === 'telefone' && <Bdg color={T.ink4} dim={T.bg3} bor={T.sep2}>sem cadastro</Bdg>}
                    {ctx?.cliente?.nome_origem === 'cadastro' && <Bdg color={T.green} dim={T.greenDim} bor={T.greenBor} icon={BadgeCheck}>cadastro</Bdg>}
                  </span>
                )}
                {flags.vip && <Bdg color={T.amber} dim={T.amberDim} bor={T.amberBor} icon={Crown} size="sm">VIP</Bdg>}
                {flags.problematico && <Bdg color={T.red} dim={T.redDim} bor={T.redBor} icon={Flame} size="sm">Recorrente em tickets</Bdg>}
                {flags.recorrente && !flags.vip && <Bdg color={T.cyan} dim={T.cyanDim} bor={T.cyanBor} icon={Star} size="sm">Cliente frequente</Bdg>}
                {ctx?.temperatura && ctx.temperatura!=='neutro' && (
                  <Bdg color={ctx.temperatura==='exaltado'?T.red:T.orange}
                       dim={ctx.temperatura==='exaltado'?T.redDim:T.orangeDim}
                       bor={ctx.temperatura==='exaltado'?T.redBor:T.orangeBor}
                       icon={Thermometer} size="sm">
                    {ctx.temperatura==='exaltado'?'Cliente exaltado':ctx.temperatura==='insatisfeito'?'Insatisfeito':'Atenção ao tom'}
                  </Bdg>
                )}
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
              <div style={{width:18, height:1, background:T.sep2}}/>
              <button onClick={()=>!mudando && pedirAcao('aguardando_cliente')} disabled={mudando}
                title="Pausa o SLA enquanto espera o cliente"
                style={{display:'flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:999, cursor:'pointer', fontSize:12, fontWeight:800,
                  color: tk.status==='aguardando_cliente'?T.cyan:T.ink4, background: tk.status==='aguardando_cliente'?T.cyanDim:'transparent',
                  border:`1px solid ${tk.status==='aguardando_cliente'?T.cyanBor:T.sep}`, boxShadow: tk.status==='aguardando_cliente'?`0 0 18px -6px ${T.cyan}88`:'none'}}>
                <PauseCircle size={12}/>Aguardando cliente
              </button>
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
            <CanalChip canal={tk.canal}/>
            {tk.cpf_cnpj && <Bdg color={T.ink2} dim={T.bg3} bor={T.sep2} icon={User} size="sm">{tk.cpf_cnpj}</Bdg>}
            <Bdg color={tipo.color} dim={tipo.dim} bor={tipo.bor} icon={tipo.icon} size="sm">{tipo.label}</Bdg>
            <Bdg color={PRIO[tk.prioridade]?.color||T.blue} dim={T.bg3} bor={T.sep2} icon={Zap} size="sm">{PRIO[tk.prioridade]?.label||tk.prioridade}</Bdg>
            {tk.numero_pedido && <Bdg color={T.cyan} dim={T.cyanDim} bor={T.cyanBor} icon={Package} size="sm">Pedido #{tk.numero_pedido}</Bdg>}
            <span style={{fontSize:13, color:T.ink2, fontWeight:600, marginLeft:4}}>{tk.titulo || tk.descricao?.slice(0,90)}</span>
            <button onClick={fundirTicket} title="Fundir este ticket em outro"
              style={{marginLeft:'auto', background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink3, borderRadius:999, padding:'4px 11px', cursor:'pointer', fontSize:11, fontWeight:700}}>
              <GitMerge size={11}/> Fundir
            </button>
          </div>
          {/* Tags livres */}
          <div style={{display:'flex', gap:6, marginTop:9, alignItems:'center', flexWrap:'wrap'}}>
            <Tag size={11} color={T.ink4}/>
            {(tk.tags||[]).map((tg,i)=>(
              <span key={i} style={{display:'inline-flex', alignItems:'center', gap:4, fontSize:10.5, fontWeight:700, color:T.cyan, background:T.cyanDim, border:`1px solid ${T.cyanBor}`, borderRadius:999, padding:'2px 9px'}}>
                {tg}
                <button onClick={()=>patch({ tags:(tk.tags||[]).filter(x=>x!==tg), por:getAgente() }).catch(()=>{})}
                  style={{background:'none', border:'none', color:T.ink4, cursor:'pointer', padding:0, display:'flex'}}><X size={9}/></button>
              </span>
            ))}
            <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTag()}
              placeholder="+ tag" style={{width:74, background:'transparent', border:`1px dashed ${T.grayBor}`, borderRadius:999, padding:'2px 9px', color:T.ink2, fontSize:10.5, outline:'none'}}/>
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
          {/* SLA preditivo + sentimento da última resposta */}
          {!loading && (ctx?.sla || ctx?.sentimento_resposta) && !['resolvida','encerrada'].includes(tk.status) && (
            <div style={{display:'flex', gap:10, padding:'0 24px 14px', flexWrap:'wrap', alignItems:'center'}}>
              {ctx?.sla && (
                <div style={{flex:1, minWidth:200}}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:10.5, fontWeight:800, marginBottom:4,
                    color: ctx.sla.estado==='estourado'?T.red:ctx.sla.estado==='risco'?T.amber:T.green, textTransform:'uppercase', letterSpacing:0.6}}>
                    <span>SLA {tk.prioridade} ({ctx.sla.prazo_h}h)</span>
                    <span>{ctx.sla.restante_h < 0 ? `estourou há ${Math.abs(ctx.sla.restante_h)}h` : `restam ${ctx.sla.restante_h}h`}</span>
                  </div>
                  <div style={{height:5, borderRadius:99, background:T.bg3, overflow:'hidden'}}>
                    <div style={{width:`${ctx.sla.pct}%`, height:'100%', borderRadius:99,
                      background: ctx.sla.estado==='estourado'?T.red:ctx.sla.estado==='risco'?T.amber:T.green,
                      boxShadow:`0 0 10px ${ctx.sla.estado==='estourado'?T.red:ctx.sla.estado==='risco'?T.amber:T.green}88`}}/>
                  </div>
                </div>
              )}
              {ctx?.sentimento_resposta && (
                <Bdg color={ctx.sentimento_resposta==='positivo'?T.green:ctx.sentimento_resposta==='negativo'?T.red:T.ink3}
                     dim={ctx.sentimento_resposta==='positivo'?T.greenDim:ctx.sentimento_resposta==='negativo'?T.redDim:T.bg3}
                     bor={ctx.sentimento_resposta==='positivo'?T.greenBor:ctx.sentimento_resposta==='negativo'?T.redBor:T.sep2}
                     icon={ctx.sentimento_resposta==='positivo'?Smile:ctx.sentimento_resposta==='negativo'?Frown:Meh} size="sm">
                  Cliente {ctx.sentimento_resposta==='positivo'?'satisfeito':ctx.sentimento_resposta==='negativo'?'ainda insatisfeito':'respondeu'}
                </Bdg>
              )}
            </div>
          )}

        <div style={{flex:1, overflowY:'auto', padding:18, display:'grid', gridTemplateColumns:'1.25fr 1fr', gap:14, alignItems:'start'}}>

          {/* ════ COLUNA ESQUERDA — timeline + resposta ════ */}
          <div style={{display:'flex', flexDirection:'column', gap:14}}>

            <Sec icon={History} color={T.blue} title="Timeline do ticket"
              extra={
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <button onClick={resumirCaso} disabled={resumindo}
                    style={{display:'flex', alignItems:'center', gap:5, background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink2, borderRadius:999, padding:'4px 11px', cursor:'pointer', fontWeight:700, fontSize:11}}>
                    <FileTextIc size={11}/>{resumindo?'Resumindo…':'Resumir caso'}
                  </button>
                  <span style={{fontSize:11, color:T.ink3}}>{histArr.length} eventos</span>
                </div>
              }>
              {resumo && (
                <div style={{marginBottom:12, padding:'11px 13px', background:T.blueDim, border:`1px solid ${T.blueBor}`, borderRadius:11, fontSize:12.5, color:T.ink1, lineHeight:1.6, whiteSpace:'pre-wrap'}}>
                  {resumo}
                  <button onClick={()=>navigator.clipboard?.writeText(resumo)} style={{marginLeft:8, background:'none', border:'none', color:T.blue, cursor:'pointer', fontSize:11, fontWeight:800}}>copiar</button>
                </div>
              )}
              <div style={{display:'flex', flexDirection:'column', gap:0, maxHeight:300, overflowY:'auto', paddingRight:4}}>
                {histArr.length === 0 && <div style={{fontSize:12.5, color:T.ink3}}>Sem eventos ainda.</div>}
                {[...histArr].reverse().map((h, i) => (
                  <div key={i} style={{display:'flex', gap:10, position:'relative', paddingBottom: i===histArr.length-1?0:14}}>
                    {i < histArr.length-1 && <div style={{position:'absolute', left:11, top:24, bottom:0, width:1, background:T.sep2}}/>}
                    <div style={{width:23, height:23, borderRadius:8, flexShrink:0, background:T.bg3, border:`1px solid ${T.sep2}`, display:'flex', alignItems:'center', justifyContent:'center'}}>
                      {(() => { const Ic = HIST_ICON[h.acao] || (String(h.acao||'').startsWith('status') ? Repeat : Circle); return <Ic size={12} color={T.ink3}/> })()}
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
              <div style={{display:'flex', gap:6, alignItems:'center', marginBottom:8}}>
                <span style={{fontSize:10.5, fontWeight:800, color:T.ink4, textTransform:'uppercase', letterSpacing:0.6}}>Tom da IA:</span>
                {[['empático e resolutivo','Empático'],['objetivo e direto','Objetivo'],['firme porém cordial','Firme']].map(([v,lb])=>(
                  <button key={v} onClick={()=>setTom(v)}
                    style={{background: tom===v?T.purpleDim:'transparent', border:`1px solid ${tom===v?T.purpleBor:T.sep2}`,
                      color: tom===v?T.purple:T.ink3, borderRadius:999, padding:'3px 10px', cursor:'pointer', fontSize:11, fontWeight:700}}>
                    {lb}
                  </button>
                ))}
              </div>
              <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:10}}>
                {RESPOSTAS_RAPIDAS.map(rr => (
                  <button key={rr.id} onClick={()=>usarRapida(rr)}
                    style={{background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink2, borderRadius:999, padding:'4px 11px', cursor:'pointer', fontSize:11.5, fontWeight:600}}>
                    {rr.label}
                  </button>
                ))}
                {templates.map(tp => (
                  <span key={tp.id} style={{display:'inline-flex', alignItems:'center', gap:5, background:T.purpleDim, border:`1px solid ${T.purpleBor}`, borderRadius:999, padding:'4px 6px 4px 11px'}}>
                    <button onClick={()=>setResp(tp.texto)} style={{background:'none', border:'none', color:T.purple, cursor:'pointer', fontSize:11.5, fontWeight:700, padding:0}}>{tp.label}</button>
                    <button onClick={()=>delTemplate(tp.id)} style={{background:'none', border:'none', color:T.ink4, cursor:'pointer', padding:0, display:'flex'}}><X size={10}/></button>
                  </span>
                ))}
                <button onClick={salvarTemplate} disabled={!resp.trim()} title="Salvar a resposta atual como template"
                  style={{background:'transparent', border:`1px dashed ${T.grayBor}`, color: resp.trim()?T.ink2:T.ink4, borderRadius:999, padding:'4px 11px', cursor:'pointer', fontSize:11.5, fontWeight:700}}>
                  + salvar template
                </button>
              </div>
              <textarea id="oc-resposta" value={resp} onChange={e=>setResp(e.target.value)} rows={5}
                placeholder="Escreva a resposta, use uma resposta rápida ou gere com IA…"
                style={{width:'100%', boxSizing:'border-box', background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:12, padding:'11px 13px', color:T.ink1, fontSize:13.5, lineHeight:1.5, outline:'none', resize:'vertical', fontFamily:'inherit'}}/>
              <div style={{display:'flex', gap:8, marginTop:10, alignItems:'center'}}>
                <button onClick={enviarWhats} disabled={enviando || !resp.trim()}
                  style={{display:'flex', alignItems:'center', gap:7, background: resp.trim()?T.greenDim:T.bg3,
                    border:`1px solid ${resp.trim()?T.greenBor:T.sep2}`, color: resp.trim()?T.green:T.ink4,
                    borderRadius:11, padding:'9px 16px', cursor: resp.trim()?'pointer':'default', fontWeight:800, fontSize:13,
                    boxShadow: resp.trim()?`0 0 22px -8px ${T.green}77`:'none'}}>
                  <Send size={14}/>{enviando ? 'Enviando…' : 'Enviar'}
                </button>
                <button onClick={macroResolver} disabled={enviando || !resp.trim()} title="Envia a resposta, marca como Resolvida e dispara a pesquisa de satisfação — tudo de uma vez"
                  style={{display:'flex', alignItems:'center', gap:7, background: resp.trim()?`linear-gradient(135deg, ${T.green}26, ${T.cyan}22)`:T.bg3,
                    border:`1px solid ${resp.trim()?T.greenBor:T.sep2}`, color: resp.trim()?T.green:T.ink4,
                    borderRadius:11, padding:'9px 14px', cursor: resp.trim()?'pointer':'default', fontWeight:900, fontSize:12.5}}>
                  <Wand2 size={13}/>Resolver em 1 clique
                </button>
                <button onClick={()=>{ navigator.clipboard?.writeText(resp); setCopiado(true); setTimeout(()=>setCopiado(false),1500) }}
                  disabled={!resp.trim()}
                  style={{display:'flex', alignItems:'center', gap:6, background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink2, borderRadius:11, padding:'9px 13px', cursor:'pointer', fontWeight:700, fontSize:12.5}}>
                  {copiado ? <Check size={13} color={T.green}/> : <Copy size={13}/>}{copiado?'Copiado':'Copiar'}
                </button>
                <label style={{display:'flex', alignItems:'center', gap:6, background:T.bg3, border:`1px dashed ${T.grayBor}`, color:T.ink2, borderRadius:11, padding:'9px 13px', cursor:'pointer', fontWeight:700, fontSize:12.5}}>
                  {subindo ? <Upload size={13} style={{animation:'oc-pulse 1s infinite'}}/> : <Paperclip size={13}/>}
                  {subindo ? 'Subindo…' : 'Anexar'}
                  <input type="file" hidden accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={e=>{ subirArquivo(e.target.files?.[0]); e.target.value='' }}/>
                </label>
                {erro && <span style={{fontSize:12, color:T.red}}>{erro}</span>}
              </div>

              {/* Anexos do ticket */}
              {anexos.length > 0 && (
                <div style={{marginTop:12, display:'flex', flexDirection:'column', gap:6}}>
                  <div style={{fontSize:10.5, fontWeight:800, color:T.ink4, textTransform:'uppercase', letterSpacing:0.6}}>Anexos ({anexos.length})</div>
                  {anexos.map(ax => {
                    const ehImg = /^image\//.test(ax.mime)
                    return (
                      <div key={ax.id} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 11px', background:T.bg1, border:`1px solid ${T.sep}`, borderRadius:10}}>
                        {ehImg ? <ImageIc size={15} color={T.cyan}/> : <FileTextIc size={15} color={T.ink3}/>}
                        <div style={{flex:1, minWidth:0}}>
                          <div style={{fontSize:12.5, fontWeight:700, color:T.ink1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{ax.nome}</div>
                          <div style={{fontSize:10.5, color:T.ink4}}>{(ax.tamanho/1024).toFixed(0)} KB · {fmtD(ax.criado_em)}{ax.enviado_em ? ' · enviado ao cliente ✓' : ''}</div>
                        </div>
                        <a href={`${BASE}/api/ocorrencias/anexo/${ax.id}`} target="_blank" rel="noreferrer"
                          style={{display:'flex', alignItems:'center', color:T.ink3}}><ExternalLink size={14}/></a>
                        <button onClick={()=>enviarAnexo(ax)} disabled={enviandoAx===ax.id}
                          style={{display:'flex', alignItems:'center', gap:5, background: ax.enviado_em?T.bg3:T.greenDim,
                            border:`1px solid ${ax.enviado_em?T.sep2:T.greenBor}`, color: ax.enviado_em?T.ink3:T.green,
                            borderRadius:9, padding:'5px 11px', cursor:'pointer', fontWeight:800, fontSize:11}}>
                          <Send size={11}/>{enviandoAx===ax.id?'Enviando…':ax.enviado_em?'Reenviar':'Enviar ao cliente'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </Sec>

            {/* Conversa recente do WhatsApp — o diálogo sem sair do modal */}
            <Sec icon={MessagesSquare} color={T.cyan} title="Conversa recente (WhatsApp)"
              extra={!loading && <span style={{fontSize:11, color:T.ink3}}>últimas {ctx?.conversa?.length||0}</span>}>
              {loading ? <><Skel/><Skel w="70%" style={{marginTop:8}}/></> : (
                <div style={{display:'flex', flexDirection:'column', gap:6, maxHeight:240, overflowY:'auto', paddingRight:4}}>
                  {(ctx?.conversa||[]).length===0 && <div style={{fontSize:12, color:T.ink3}}>Sem mensagens registradas.</div>}
                  {(ctx?.conversa||[]).map((m,i)=>{
                    const saida = m.direcao==='saida'
                    return (
                      <div key={i} style={{display:'flex', justifyContent: saida?'flex-end':'flex-start'}}>
                        <div style={{maxWidth:'82%', padding:'7px 11px', borderRadius: saida?'12px 12px 3px 12px':'12px 12px 12px 3px',
                          background: saida?'rgba(0,230,118,.09)':T.bg3, border:`1px solid ${saida?T.greenBor:T.sep2}`,
                          fontSize:12, color:T.ink1, lineHeight:1.45}}>
                          <div style={{whiteSpace:'pre-wrap', wordBreak:'break-word'}}>{String(m.conteudo||'').slice(0,280)}</div>
                          <div style={{fontSize:9.5, color:T.ink4, marginTop:3, textAlign: saida?'right':'left'}}>{fmtRel(m.criado_em)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Sec>
          </div>

          {/* ════ COLUNA DIREITA — dossiê ════ */}
          <div style={{display:'flex', flexDirection:'column', gap:14}}>

            <Sec icon={AlarmClock} color={T.orange} title="Follow-up & atribuição">
              <div style={{display:'flex', gap:6, flexWrap:'wrap', alignItems:'center'}}>
                <span style={{fontSize:11, color:T.ink3, fontWeight:700}}>Cobrar cliente em:</span>
                {[24,48,72].map(h=>(
                  <button key={h} onClick={()=>patch({ followupHoras:h, por:getAgente() }).catch(e=>setErro(e.message))}
                    style={{background:T.orangeDim, border:`1px solid ${T.orangeBor}`, color:T.orange, borderRadius:999, padding:'4px 12px', cursor:'pointer', fontWeight:800, fontSize:11.5}}>
                    {h}h
                  </button>
                ))}
                {tk.followup_em && (
                  <span style={{fontSize:11, color: new Date(tk.followup_em)<new Date()?T.red:T.ink2, fontWeight:700}}>
                    <AlarmClock size={11} style={{verticalAlign:'-1px'}}/> {new Date(tk.followup_em)<new Date()?'VENCIDO — cobrar agora':'agendado p/ '+fmtD(tk.followup_em)}
                    <button onClick={()=>patch({ followupHoras:0, por:getAgente() }).catch(()=>{})} style={{marginLeft:6, background:'none', border:'none', color:T.ink4, cursor:'pointer', fontSize:11}}>limpar</button>
                  </span>
                )}
              </div>
              <div style={{display:'flex', gap:8, alignItems:'center', marginTop:10}}>
                <UserCheck size={13} color={T.cyan}/>
                <span style={{fontSize:11, color:T.ink3, fontWeight:700}}>Atribuído a:</span>
                <span style={{fontSize:12.5, color:T.ink1, fontWeight:800}}>{tk.atribuido_a || tk.atribuidoA || '—'}</span>
                <button onClick={()=>patch({ atribuirA:getAgente(), por:getAgente() }).catch(e=>setErro(e.message))}
                  style={{background:T.cyanDim, border:`1px solid ${T.cyanBor}`, color:T.cyan, borderRadius:999, padding:'4px 12px', cursor:'pointer', fontWeight:800, fontSize:11.5}}>
                  Assumir ticket
                </button>
              </div>
            </Sec>

            {checklist && checklist.length > 0 && (
              <Sec icon={ListChecks} color={T.blue} title="Checklist de resolução"
                extra={<span style={{fontSize:11, color:T.ink3}}>{checklist.filter(i=>i.ok).length}/{checklist.length}</span>}>
                <div style={{display:'flex', flexDirection:'column', gap:8}}>
                  {checklist.map((it,i)=>(
                    <button key={i} onClick={()=>toggleCheck(i)}
                      style={{display:'flex', alignItems:'flex-start', gap:9, textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:0}}>
                      {it.ok ? <CheckSquare size={16} color={T.green} style={{flexShrink:0, marginTop:1}}/> : <Square size={16} color={T.ink4} style={{flexShrink:0, marginTop:1}}/>}
                      <span style={{fontSize:12.5, color: it.ok?T.ink4:T.ink2, textDecoration: it.ok?'line-through':'none', lineHeight:1.4}}>{it.texto}</span>
                    </button>
                  ))}
                </div>
              </Sec>
            )}

            {ctx?.cadastro && (
              <Sec icon={MapPinIc} color={T.cyan} title="Dados do cliente">
                <div style={{display:'flex', flexDirection:'column', gap:6, fontSize:12.5, color:T.ink2}}>
                  {ctx.cadastro.email && <div style={{display:'flex', gap:8}}><Mail size={13} color={T.ink4}/>{ctx.cadastro.email}</div>}
                  {(ctx.cadastro.telefone) && <div style={{display:'flex', gap:8}}><Phone size={13} color={T.ink4}/>{fmtTel(ctx.cadastro.telefone)}</div>}
                  {ctx.cadastro.documento && <div style={{display:'flex', gap:8}}><User size={13} color={T.ink4}/>{ctx.cadastro.documento}</div>}
                  {ctx.cadastro.endereco && (
                    <div style={{display:'flex', gap:8}}><MapPinIc size={13} color={T.ink4} style={{flexShrink:0, marginTop:2}}/>
                      <span>{ctx.cadastro.endereco}{ctx.cadastro.complemento?` — ${ctx.cadastro.complemento}`:''}<br/>
                      {[ctx.cadastro.bairro, ctx.cadastro.cidade && `${ctx.cadastro.cidade}/${ctx.cadastro.uf}`, ctx.cadastro.cep].filter(Boolean).join(' · ')}</span>
                    </div>
                  )}
                </div>
              </Sec>
            )}

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

            {!loading && ctx?.compensacao && (
              <Sec icon={Gift} color={T.green} title="Compensação sugerida">
                <div style={{display:'flex', alignItems:'center', gap:14}}>
                  <div style={{textAlign:'center', padding:'10px 16px', background:T.greenDim, border:`1px solid ${T.greenBor}`, borderRadius:13, boxShadow:`0 0 24px -10px ${T.green}77`}}>
                    <div style={{fontSize:24, fontWeight:900, color:T.green, lineHeight:1}}>{ctx.compensacao.percentual}%</div>
                    <div style={{fontSize:10, color:T.ink3, marginTop:3}}>≈ R$ {fmtBRL(ctx.compensacao.valor_sugerido)}</div>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:11.5, color:T.ink2, lineHeight:1.5}}>{ctx.compensacao.justificativa}</div>
                    <div style={{display:'flex', gap:7, marginTop:7, alignItems:'center', flexWrap:'wrap'}}>
                      <button onClick={gerarCompensacao}
                        style={{display:'inline-flex', alignItems:'center', gap:6, background:T.greenDim, border:`1px solid ${T.greenBor}`, color:T.green, borderRadius:9, padding:'6px 13px', cursor:'pointer', fontWeight:800, fontSize:12}}>
                        <Gift size={13}/>Gerar cupom e inserir na resposta
                      </button>
                      {compMsg && <span style={{fontSize:11, color: /gerado/.test(compMsg)?T.green:T.amber}}>{compMsg}</span>}
                    </div>
                    <div style={{fontSize:10.5, color:T.ink4, marginTop:5}}>Requer o toggle de compensação ligado e um cupom-modelo "Compensação de atraso".</div>
                  </div>
                </div>
              </Sec>
            )}

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
                    <button key={i} onClick={()=>abrirPedido(p.numero_pedido)}
                      style={{display:'flex', alignItems:'center', gap:10, padding:'7px 10px', textAlign:'left', cursor:'pointer',
                        background:T.bg1, border:`1px solid ${String(p.numero_pedido)===String(tk.numero_pedido)?T.cyanBor:T.sep}`, borderRadius:10}}>
                      <span style={{fontSize:12, fontWeight:800, color: String(p.numero_pedido)===String(tk.numero_pedido)?T.cyan:T.ink2, minWidth:64}}>#{p.numero_pedido}</span>
                      <span style={{fontSize:11, color:T.ink3, flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                        {p.transportadora || '—'}{p.municipio ? ` · ${p.municipio}/${p.uf}` : ''}
                      </span>
                      <span style={{fontSize:11, color:T.ink3}}>{fmtD(p.data_pedido)}</span>
                      <span style={{fontSize:12.5, fontWeight:800, color:T.green}}>{p.total!=null?`R$ ${fmtBRL(p.total)}`:'—'}</span>
                      <ChevronRight size={13} color={T.ink4}/>
                    </button>
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
                    {(ctx?.tickets_anteriores||[]).length===0 && <div style={{fontSize:12, color:T.ink3, display:'flex', alignItems:'center', gap:6}}><PartyPopper size={13} color={T.green}/>Primeiro ticket do cliente.</div>}
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

        {/* ── DRAWER DETALHE DO PEDIDO — itens, foto, NF, rastreio, sinalizar ── */}
        {pedDet && (
          <div onClick={()=>setPedDet(null)} style={{position:'absolute', inset:0, zIndex:6, background:'rgba(4,5,10,.75)', backdropFilter:'blur(4px)', display:'flex', justifyContent:'flex-end'}}>
            <div onClick={e=>e.stopPropagation()} style={{width:'min(460px,92%)', height:'100%', overflowY:'auto', background:`linear-gradient(180deg, ${T.bg1}, ${T.bg0})`, borderLeft:`1px solid ${T.sep2}`, padding:20, boxShadow:'-20px 0 60px -20px rgba(0,0,0,.8)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
                <span style={{fontSize:16, fontWeight:900, color:T.ink1, display:'flex', alignItems:'center', gap:8}}><Package size={17} color={T.cyan}/>Pedido #{pedDet.numero}</span>
                <button onClick={()=>setPedDet(null)} style={{background:T.gray, border:`1px solid ${T.grayBor}`, color:T.ink2, borderRadius:9, width:30, height:30, cursor:'pointer'}}><X size={15}/></button>
              </div>
              {pedLoad ? <><Skel h={60}/><Skel h={60} style={{marginTop:8}}/></> : pedDet.erro ? (
                <div style={{fontSize:13, color:T.red}}>{pedDet.erro}</div>
              ) : (
                <div style={{display:'flex', flexDirection:'column', gap:14}}>
                  {/* resumo financeiro + transporte */}
                  <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                    <Bdg color={T.green} dim={T.greenDim} bor={T.greenBor} icon={Wallet} size="sm">Total R$ {fmtBRL(pedDet.total)}</Bdg>
                    {pedDet.transporte?.transportadora && <Bdg color={T.purple} dim={T.purpleDim} bor={T.purpleBor} icon={Truck} size="sm">{pedDet.transporte.transportadora}</Bdg>}
                    {pedDet.transporte?.frete!=null && <Bdg color={T.ink2} dim={T.bg3} bor={T.sep2} size="sm">Frete R$ {fmtBRL(pedDet.transporte.frete)}</Bdg>}
                  </div>
                  {/* TIMELINE de envio — marcos + atraso */}
                  {pedDet.timeline && (
                    <div style={{background:T.bg2, border:`1px solid ${pedDet.timeline.atrasado?T.redBor:T.sep2}`, borderRadius:12, padding:'12px 14px'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                        <span style={{fontSize:11, fontWeight:800, color:T.ink3, textTransform:'uppercase', letterSpacing:0.6, display:'flex', alignItems:'center', gap:6}}><Truck size={12} color={pedDet.timeline.atrasado?T.red:T.cyan}/>Status da entrega</span>
                        {pedDet.timeline.atrasado && <Bdg color={T.red} dim={T.redDim} bor={T.redBor} icon={AlarmClock}>atraso</Bdg>}
                      </div>
                      <div style={{display:'flex', flexDirection:'column', gap:0}}>
                        {pedDet.timeline.marcos.map((m,i)=>{
                          const ult = i===pedDet.timeline.marcos.length-1
                          const cor = m.ok ? (pedDet.timeline.atrasado && m.chave==='transito' ? T.red : T.green) : T.ink4
                          return (
                            <div key={i} style={{display:'flex', gap:11, position:'relative', paddingBottom: ult?0:16}}>
                              {!ult && <div style={{position:'absolute', left:8, top:18, bottom:0, width:2, background: m.ok?cor:T.sep2}}/>}
                              <div style={{width:18, height:18, borderRadius:99, flexShrink:0, marginTop:1, background: m.ok?cor:T.bg3, border:`2px solid ${m.ok?cor:T.sep2}`, boxShadow: m.ok?`0 0 10px ${cor}88`:'none', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                {m.ok && <Check size={10} color={T.bg0}/>}
                              </div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:13, fontWeight: m.ok?800:600, color: m.ok?T.ink1:T.ink4}}>{m.label}</div>
                                {m.data && <div style={{fontSize:11, color:T.ink3, marginTop:1}}>{fmtD(m.data)}</div>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {(pedDet.timeline.dias_postado!=null || pedDet.timeline.dias_sem_movimento!=null) && (
                        <div style={{fontSize:11, color:T.ink4, marginTop:8, paddingTop:8, borderTop:`1px solid ${T.sep}`}}>
                          {pedDet.timeline.dias_postado!=null && `${pedDet.timeline.dias_postado}d desde a postagem`}
                          {pedDet.timeline.dias_sem_movimento!=null && ` · ${pedDet.timeline.dias_sem_movimento}d sem movimentação`}
                        </div>
                      )}
                    </div>
                  )}
                  {/* eventos detalhados da transportadora */}
                  {pedDet.rastreio?.eventos?.length > 0 && (
                    <div style={{background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:12, padding:'12px 14px'}}>
                      <div style={{fontSize:11, fontWeight:800, color:T.ink3, textTransform:'uppercase', letterSpacing:0.6, marginBottom:10}}>Histórico da transportadora</div>
                      <div style={{display:'flex', flexDirection:'column', gap:9, maxHeight:200, overflowY:'auto'}}>
                        {pedDet.rastreio.eventos.map((e,i)=>(
                          <div key={i} style={{display:'flex', gap:9, fontSize:12}}>
                            <div style={{width:6, height:6, borderRadius:99, background: i===0?T.cyan:T.ink4, marginTop:5, flexShrink:0}}/>
                            <div style={{flex:1}}>
                              <div style={{color:T.ink1, fontWeight: i===0?700:500}}>{e.descricao || e.status}</div>
                              <div style={{fontSize:10.5, color:T.ink4}}>{e.data?fmtD(e.data):''}{e.local?` · ${e.local}`:''}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* rastreio resumido (código) */}
                  {pedDet.rastreio && (
                    <div style={{background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:11, padding:'10px 12px'}}>
                      <div style={{fontSize:11, fontWeight:800, color:T.ink3, textTransform:'uppercase', letterSpacing:0.6, display:'flex', alignItems:'center', gap:6}}><Radio size={12} color={T.cyan}/>Rastreio</div>
                      <div style={{fontSize:12.5, color:T.ink1, marginTop:5}}>{pedDet.rastreio.ultimo_status || 'Sem movimentação'}</div>
                      {pedDet.rastreio.ultimo_evento && <div style={{fontSize:11.5, color:T.ink3, marginTop:2}}>"{pedDet.rastreio.ultimo_evento}"</div>}
                      {pedDet.rastreio.codigo && <div style={{fontSize:11, color:T.ink4, marginTop:3}}>Código: <b style={{color:T.ink2}}>{pedDet.rastreio.codigo}</b></div>}
                    </div>
                  )}
                  {/* nota fiscal */}
                  {pedDet.nota_fiscal && (
                    <a href={`${BASE}/api/dashboard/nfe/${pedDet.nota_fiscal.id}`} target="_blank" rel="noreferrer"
                      style={{display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:T.blueDim, border:`1px solid ${T.blueBor}`, borderRadius:11, color:T.blue, fontWeight:800, fontSize:12.5, textDecoration:'none'}}>
                      <FileTextIc size={14}/>Ver nota fiscal<ExternalLink size={12} style={{marginLeft:'auto'}}/>
                    </a>
                  )}
                  {/* itens com foto + sinalizar */}
                  <div>
                    <div style={{fontSize:11, fontWeight:800, color:T.ink3, textTransform:'uppercase', letterSpacing:0.6, marginBottom:8}}>Itens do pedido</div>
                    <div style={{display:'flex', flexDirection:'column', gap:8}}>
                      {(pedDet.itens||[]).map((it,i)=>(
                        <div key={i} style={{display:'flex', flexDirection:'column', gap:7, padding:10, background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:12}}>
                          <div style={{display:'flex', gap:10, alignItems:'center'}}>
                            {it.imagem
                              ? <img src={it.imagem} alt="" style={{width:42, height:42, borderRadius:8, objectFit:'cover', flexShrink:0, border:`1px solid ${T.sep2}`}}/>
                              : <div style={{width:42, height:42, borderRadius:8, background:T.bg3, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}><Box size={18} color={T.ink4}/></div>}
                            <div style={{flex:1, minWidth:0}}>
                              <div style={{fontSize:12.5, fontWeight:700, color:T.ink1, lineHeight:1.3}}>{it.descricao}</div>
                              <div style={{fontSize:11, color:T.ink3, marginTop:2}}>{it.quantidade} {(it.unidade||'un').toLowerCase()} · R$ {fmtBRL(it.valor)} · cód {it.codigo}</div>
                            </div>
                          </div>
                          <div style={{display:'flex', gap:5, flexWrap:'wrap'}}>
                            {[['nao_enviado','Não enviado',T.red],['fora_estoque','Fora de estoque',T.orange],['estornado','Estornado',T.purple],['reenvio','Reenvio',T.blue]].map(([sit,lb,cl])=>(
                              <button key={sit} onClick={()=>{ const motivo = sit==='nao_enviado'||sit==='fora_estoque' ? (prompt(`Motivo (${lb}):`)||'') : ''; sinalizarItem(it, sit, motivo) }}
                                style={{background:`${cl}14`, border:`1px solid ${cl}44`, color:cl, borderRadius:999, padding:'3px 10px', cursor:'pointer', fontWeight:700, fontSize:10.5}}>
                                {lb}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:10.5, color:T.ink4, marginTop:8}}>Sinalizar um item registra o status na timeline do ticket e fica visível pra equipe.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
  )
  if (inline) return painel
  return (
    <div onClick={onClose} style={{position:'fixed', inset:0, zIndex:90, background:'rgba(4,5,10,.78)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:18}}>
      {painel}
    </div>
  )
}

// ═══ MODAL NOVA OCORRÊNCIA ════════════════════════════════════════════════════
function ModalNova({ onSalvo, onClose }) {
  const [f, setF] = useState({ telefone:'', nomeCliente:'', email:'', numeroPedido:'', titulo:'', tipo:'entrega', descricao:'', prioridade:'normal', canal:'whatsapp', cpfCnpj:'' })
  const [saving, setSaving] = useState(false)
  const [erro,   setErro]   = useState('')
  const [anexado,setAnexado]= useState(null)
  const [dup,    setDup]    = useState(null)
  const [busca,  setBusca]  = useState('')
  const [buscando,setBuscando]=useState(false)
  const [achado, setAchado] = useState(null)
  const [sugestao, setSugestao] = useState(null)

  useEffect(() => {
    const txt = `${f.titulo} ${f.descricao}`.trim()
    if (txt.length < 8) { setSugestao(null); return }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${BASE}/api/ocorrencias/sugerir-classificacao`, {
          method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ titulo:f.titulo, descricao:f.descricao }) })
        const d = await r.json()
        if (d.tipo && (d.tipo!==f.tipo || d.prioridade!==f.prioridade)) setSugestao(d); else setSugestao(null)
      } catch {}
    }, 700)
    return () => clearTimeout(t)
  }, [f.titulo, f.descricao])

  async function puxarConversa() {
    const tel = (f.telefone||busca||'').replace(/\D/g,'')
    if (!tel) { setErro('Informe o telefone primeiro'); return }
    try {
      const r = await fetch(`${BASE}/api/ocorrencias/da-conversa`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ telefone: tel }) })
      const d = await r.json()
      if (d.ticket_aberto) { setErro(`Cliente já tem o ticket ${d.ticket_aberto} aberto`); return }
      if (d.descricao_sugerida) { set('descricao', d.descricao_sugerida); if(!f.titulo) set('titulo','Aberto a partir da conversa do WhatsApp') }
    } catch { setErro('Falha ao puxar a conversa') }
  }
  async function buscarCliente() {
    if (!busca.trim()) return
    setBuscando(true)
    try {
      const r = await fetch(`${BASE}/api/ocorrencias/buscar-cliente?q=${encodeURIComponent(busca.trim())}`)
      const d = await r.json()
      if (d.encontrado) {
        setAchado(d)
        setF(p=>({ ...p, nomeCliente:d.cliente.nome||p.nomeCliente, email:d.cliente.email||p.email,
          telefone:d.cliente.telefone||p.telefone, cpfCnpj:d.cliente.documento||p.cpfCnpj,
          numeroPedido:d.pedido_sugerido||p.numeroPedido }))
      } else setAchado({ encontrado:false })
    } catch { setAchado({ encontrado:false }) } finally { setBuscando(false) }
  }
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
      if (d.duplicado_potencial) { setDup(d.duplicado_potencial); return }
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

        {dup ? (
          <div>
            <div style={{background:T.blueDim, border:`1px solid ${T.blueBor}`, borderRadius:13, padding:16, display:'flex', gap:11}}>
              <History size={19} color={T.blue} style={{flexShrink:0, marginTop:2}}/>
              <div style={{fontSize:13, color:T.ink1, lineHeight:1.55}}>
                O pedido <b>#{f.numeroPedido}</b> já teve o ticket <b style={{color:T.blue}}>{dup.ticket_id}</b> ({dup.titulo || 'sem título'}) <b>{STATUS[dup.status]?.label?.toLowerCase()}</b> nos últimos 30 dias.
                <br/>É o mesmo problema voltando ou um caso novo?
              </div>
            </div>
            <div style={{display:'flex', gap:8, marginTop:14}}>
              <button onClick={async()=>{
                  await fetch(`${BASE}/api/ocorrencias/${dup.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({ status:'aberta', nota:`Reaberto: ${f.descricao||'cliente retornou com o mesmo problema'}`, por:getAgente() }) })
                  onSalvo?.(); onClose()
                }}
                style={{flex:1, background:T.blueDim, border:`1px solid ${T.blueBor}`, color:T.blue, borderRadius:11, padding:'10px', cursor:'pointer', fontWeight:800, fontSize:12.5}}>
                Reabrir {dup.ticket_id}
              </button>
              <button onClick={async()=>{
                  setDup(null); setSaving(true)
                  try {
                    const r = await fetch(`${BASE}/api/ocorrencias`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...f, forcar:true}) })
                    const d = await r.json(); onSalvo?.(d.ocorrencia || d); onClose()
                  } finally { setSaving(false) }
                }}
                style={{flex:1, background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink2, borderRadius:11, padding:'10px', cursor:'pointer', fontWeight:800, fontSize:12.5}}>
                É um caso novo — criar
              </button>
            </div>
          </div>
        ) : anexado ? (
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
            {/* Busca inteligente: puxa cadastro e pedidos do Bling */}
            <div style={{background:T.bg1, border:`1px solid ${T.blueBor}`, borderRadius:13, padding:13, marginBottom:14}}>
              <label style={{...lblSt, color:T.blue}}>🔎 Localizar cliente (CPF, telefone ou nº do pedido)</label>
              <div style={{display:'flex', gap:8}}>
                <input style={{...inputSt, flex:1}} value={busca} onChange={e=>setBusca(e.target.value)} onKeyDown={e=>e.key==='Enter'&&buscarCliente()} placeholder="Ex.: 480.687.720-49 ou 233759"/>
                <button onClick={buscarCliente} disabled={buscando}
                  style={{background:T.blueDim, border:`1px solid ${T.blueBor}`, color:T.blue, borderRadius:10, padding:'0 16px', cursor:'pointer', fontWeight:800, fontSize:12.5}}>
                  {buscando?'Buscando…':'Buscar'}
                </button>
              </div>
              <button onClick={puxarConversa}
                style={{marginTop:8, display:'flex', alignItems:'center', gap:7, width:'100%', justifyContent:'center', background:T.bg3, border:`1px dashed ${T.grayBor}`, color:T.ink2, borderRadius:10, padding:'8px', cursor:'pointer', fontWeight:700, fontSize:12}}>
                <MessageSquarePlus size={14}/>Criar a partir da conversa do WhatsApp
              </button>
              {achado?.encontrado && achado.tickets_cliente?.aberto && (
                <div style={{marginTop:10, display:'flex', gap:9, padding:'10px 12px', background:T.amberDim, border:`1px solid ${T.amberBor}`, borderRadius:11, fontSize:12, color:T.ink1}}>
                  <AlertTriangle size={15} color={T.amber} style={{flexShrink:0, marginTop:1}}/>
                  <span>Este cliente já tem o ticket <b style={{color:T.amber}}>{achado.tickets_cliente.aberto}</b> em aberto. Pela esteira, a nova informação será anexada a ele — não criamos ticket paralelo.</span>
                </div>
              )}
              {achado?.encontrado && (
                <div style={{marginTop:10, fontSize:12, color:T.ink2}}>
                  <span style={{color:T.green, fontWeight:800}}>✓ {achado.cliente.nome}</span>
                  {achado.cliente.cidade && <span style={{color:T.ink3}}> · {achado.cliente.cidade}/{achado.cliente.uf}</span>}
                  {achado.tickets_cliente?.total > 0 && <span style={{color: achado.tickets_cliente.total>=3?T.red:T.amber, fontWeight:700}}> · {achado.tickets_cliente.total} ticket{achado.tickets_cliente.total>1?'s':''} no histórico</span>}
                  {achado.pedidos?.length>0 && <div style={{marginTop:6, display:'flex', gap:5, flexWrap:'wrap'}}>
                    {achado.pedidos.map(p=>(
                      <button key={p.numero} onClick={()=>set('numeroPedido',String(p.numero))}
                        style={{background: f.numeroPedido===String(p.numero)?T.cyanDim:T.bg3, border:`1px solid ${f.numeroPedido===String(p.numero)?T.cyanBor:T.sep2}`, color: f.numeroPedido===String(p.numero)?T.cyan:T.ink2, borderRadius:999, padding:'3px 10px', cursor:'pointer', fontSize:11, fontWeight:700}}>
                        #{p.numero} · R$ {fmtBRL(p.total)}
                      </button>
                    ))}
                  </div>}
                </div>
              )}
              {achado && !achado.encontrado && <div style={{marginTop:8, fontSize:11.5, color:T.ink3}}>Nenhum cadastro encontrado — preencha manualmente abaixo.</div>}
            </div>
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
            {sugestao && (
              <div style={{marginTop:12, display:'flex', alignItems:'center', gap:10, padding:'10px 13px', background:T.purpleDim, border:`1px solid ${T.purpleBor}`, borderRadius:11}}>
                <Wand2 size={15} color={T.purple} style={{flexShrink:0}}/>
                <div style={{flex:1, fontSize:12.5, color:T.ink2}}>
                  A IA sugere: <b style={{color:TIPOS[sugestao.tipo]?.color||T.purple}}>{TIPOS[sugestao.tipo]?.label||sugestao.tipo}</b> · prioridade <b style={{color:PRIO[sugestao.prioridade]?.color||T.purple}}>{PRIO[sugestao.prioridade]?.label||sugestao.prioridade}</b>
                </div>
                <button onClick={()=>{ set('tipo',sugestao.tipo); set('prioridade',sugestao.prioridade); setSugestao(null) }}
                  style={{background:T.purpleDim, border:`1px solid ${T.purpleBor}`, color:T.purple, borderRadius:9, padding:'5px 13px', cursor:'pointer', fontWeight:800, fontSize:12}}>Aplicar</button>
              </div>
            )}
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
  const [met,    setMet]    = useState(null)
  const [aba,    setAba]    = useState('fila')          // fila | inteligencia
  const [intel,  setIntel]  = useState(null)
  const [intelAv,setIntelAv]= useState(null)
  const [cont,   setCont]   = useState({})              // contadores do sino
  const [novos,  setNovos]  = useState([])              // tickets novos não vistos
  const [sino,   setSino]   = useState(false)
  const [cfg,    setCfg]    = useState(null)
  const [cfgOpen,setCfgOpen]= useState(false)
  const ultimoCheckRef = (typeof window!=='undefined') ? (window.__ocUltCheck = window.__ocUltCheck || { t: new Date().toISOString() }) : { t:null }

  const carregar = useCallback(() => {
    setLoading(true)
    fetch(`${BASE}/api/ocorrencias`)
      .then(r=>r.json()).then(d=>{ setDados(d); setLoading(false) })
      .catch(()=>setLoading(false))
  }, [])
  useEffect(()=>{ carregar(); const t=setInterval(carregar, 60000); return ()=>clearInterval(t) }, [carregar])
  useEffect(()=>{ fetch(`${BASE}/api/ocorrencias/metricas/resumo`).then(r=>r.json()).then(setMet).catch(()=>{}) }, [])
  useEffect(()=>{ fetch(`${BASE}/api/ocorrencias/config`).then(r=>r.json()).then(setCfg).catch(()=>{}) }, [])

  // SINO em tempo real: poll leve a cada 15s
  useEffect(() => {
    let parar = false
    const beep = () => {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return
        const ac = new Ctx(); const o = ac.createOscillator(); const g = ac.createGain()
        o.connect(g); g.connect(ac.destination); o.frequency.value = 880; o.type='sine'
        g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.12, ac.currentTime+0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime+0.4); o.start(); o.stop(ac.currentTime+0.42)
      } catch {}
    }
    const tick = async () => {
      try {
        const r = await fetch(`${BASE}/api/ocorrencias/contadores?desde=${encodeURIComponent(ultimoCheckRef.t)}`)
        const d = await r.json()
        setCont(d)
        if (d.novos?.length) {
          setNovos(prev => {
            const ids = new Set(prev.map(x=>x.id))
            const add = d.novos.filter(x=>!ids.has(x.id))
            if (add.length) {
              const temUrgente = add.some(x=>x.prioridade==='urgente' || x.origem==='sistema')
              if (cfg?.som_notificacao !== false && temUrgente) beep()
              if (temUrgente && Notification?.permission==='granted')
                new Notification('Ocorrências — atenção', { body: add[0].nome_cliente ? `Novo ticket: ${add[0].nome_cliente}` : 'Novo ticket urgente' })
            }
            return [...add, ...prev].slice(0, 12)
          })
          ultimoCheckRef.t = new Date().toISOString()
        }
      } catch {}
      if (!parar) setTimeout(tick, 15000)
    }
    tick()
    if (Notification?.permission === 'default') Notification.requestPermission?.()
    return () => { parar = true }
  }, [cfg])

  async function salvarCfg(patch) {
    const novo = { ...cfg, ...patch }; setCfg(novo)
    await fetch(`${BASE}/api/ocorrencias/config`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(patch) }).catch(()=>{})
  }
  useEffect(()=>{ if (aba==='inteligencia' && !intel)
    fetch(`${BASE}/api/ocorrencias/inteligencia/causa-raiz`).then(r=>r.json()).then(setIntel).catch(()=>{}) }, [aba, intel])
  useEffect(()=>{ if (aba==='inteligencia' && !intelAv)
    fetch(`${BASE}/api/ocorrencias/inteligencia/avancado`).then(r=>r.json()).then(setIntelAv).catch(()=>{}) }, [aba, intelAv])

  // ── Modo fila: o sistema entrega o ticket mais crítico ──
  const proximoDaFila = useCallback(() => {
    const ativos = (dados.ocorrencias||[]).filter(o=>['aberta','em_analise','em_andamento'].includes(o.status))
    const score = o => (o.followup_vencido?1000:0) + (o.prioridade==='urgente'?500:o.prioridade==='alta'?200:0)
      + Math.min(199, Math.floor((Date.now()-new Date(o.criado_em))/3600000))
    const ordenados = [...ativos].sort((a,b)=>score(b)-score(a))
    if (ordenados.length) setSel(ordenados[0])
  }, [dados])

  // ── Atalhos de teclado: J/K navegam, R foca resposta, E resolve, N novo ──
  useEffect(() => {
    const h = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const k = e.key.toLowerCase()
      if (k === 'n') { setNova(true); e.preventDefault(); return }
      if (!['j','k','r','escape'].includes(k === 'escape' ? 'escape' : k)) {}
      const visiveis = lista
      const idx = sel ? visiveis.findIndex(o=>o.id===sel.id) : -1
      if (k === 'j') { const n = visiveis[Math.min(idx+1, visiveis.length-1)]; if (n) setSel(n); e.preventDefault() }
      if (k === 'k') { const p = visiveis[Math.max(idx-1, 0)]; if (p) setSel(p); e.preventDefault() }
      if (k === 'r' && sel) { document.querySelector('#oc-resposta')?.focus(); e.preventDefault() }
      if (e.key === 'Escape' && sel) setSel(null)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  const lista = useMemo(() => {
    let l = dados.ocorrencias || []
    if (filtro==='ativas')   l = l.filter(o=>['aberta','em_analise','em_andamento','aguardando_cliente'].includes(o.status))
    else if (filtro!=='todas') l = l.filter(o=>o.status===filtro)
    if (busca.trim()) {
      const b = busca.toLowerCase()
      l = l.filter(o => [o.nome_cliente,o.telefone,o.ticket_id,o.titulo,o.descricao,o.numero_pedido].join(' ').toLowerCase().includes(b))
    }
    return [...l].sort((a,b) => (b.followup_vencido?1:0) - (a.followup_vencido?1:0))
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
    <div style={{minHeight:'100vh', height:'100vh', overflowY:'auto', background:T.bg0, padding:'22px 26px', fontFamily:'Inter, system-ui, sans-serif', fontSize:13}}>
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
        <div style={{display:'flex', gap:9, alignItems:'center'}}>
          <div style={{display:'flex', gap:4, background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:11, padding:4}}>
            {[['fila',Inbox,'Fila'],['inteligencia',BrainCircuit,'Inteligência']].map(([k,Ic,lb])=>(
              <button key={k} onClick={()=>setAba(k)}
                style={{display:'flex', alignItems:'center', gap:6, background: aba===k?T.bg4:'transparent', border:'none', color: aba===k?T.ink1:T.ink3,
                  borderRadius:8, padding:'7px 13px', cursor:'pointer', fontWeight:800, fontSize:12}}><Ic size={13}/>{lb}</button>
            ))}
          </div>
          <button onClick={proximoDaFila} title="Abre o ticket mais crítico (urgente → follow-up vencido → mais antigo)"
            style={{display:'flex', alignItems:'center', gap:7, background:T.purpleDim, border:`1px solid ${T.purpleBor}`, color:T.purple, borderRadius:11, padding:'9px 14px', cursor:'pointer', fontWeight:900, fontSize:12.5, boxShadow:`0 0 20px -8px ${T.purple}77`}}>
            <Play size={13}/>Próximo
          </button>
          <a href={`${BASE}/api/ocorrencias/export.csv`} title="Exportar CSV"
            style={{display:'flex', alignItems:'center', gap:6, background:T.bg2, border:`1px solid ${T.sep2}`, color:T.ink2, borderRadius:11, padding:'9px 13px', fontWeight:700, fontSize:12.5, textDecoration:'none'}}>
            <Download size={13}/>CSV
          </a>
          <div style={{position:'relative'}}>
            <button onClick={()=>{ setSino(!sino); if(!sino) setNovos([]) }}
              style={{position:'relative', display:'flex', alignItems:'center', justifyContent:'center', width:40, height:40, background:T.bg2, border:`1px solid ${(cont.urgentes>0||novos.length>0)?T.redBor:T.sep2}`, color:(cont.urgentes>0||novos.length>0)?T.red:T.ink2, borderRadius:11, cursor:'pointer'}}>
              <Bell size={16}/>
              {(novos.length>0 || cont.urgentes>0) && (
                <span style={{position:'absolute', top:-5, right:-5, minWidth:18, height:18, padding:'0 5px', borderRadius:99, background:T.red, color:'#fff', fontSize:10.5, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 10px ${T.red}`, animation: novos.length>0?'oc-pulse 1.4s infinite':'none'}}>
                  {novos.length || cont.urgentes}
                </span>
              )}
            </button>
            {sino && (
              <div style={{position:'absolute', top:48, right:0, width:300, zIndex:50, background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:14, boxShadow:'0 30px 80px -20px rgba(0,0,0,.85)', overflow:'hidden'}}>
                <div style={{padding:'11px 14px', borderBottom:`1px solid ${T.sep}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontSize:12.5, fontWeight:800, color:T.ink1}}>Notificações</span>
                  <span style={{fontSize:11, color:T.ink3}}>{cont.ativos||0} ativos · {cont.urgentes||0} urgentes</span>
                </div>
                <div style={{maxHeight:320, overflowY:'auto'}}>
                  {novos.length===0 && <div style={{padding:'18px 14px', fontSize:12, color:T.ink3, textAlign:'center'}}>Nada novo. Você está em dia.</div>}
                  {novos.map(n=>(
                    <button key={n.id} onClick={()=>{ const o=(dados.ocorrencias||[]).find(x=>x.id===n.id); if(o){setSel(o); setSino(false)} }}
                      style={{display:'flex', alignItems:'center', gap:9, width:'100%', padding:'10px 14px', textAlign:'left', cursor:'pointer', background:'transparent', border:'none', borderBottom:`1px solid ${T.sep}`}}>
                      <Avatar nome={n.nome_cliente} size={28}/>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontSize:12, fontWeight:700, color:T.ink1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{n.nome_cliente || fmtTel(n.telefone)}</div>
                        <div style={{fontSize:10.5, color:T.ink3}}>{n.origem==='sistema'?'🛰 proativo · ':''}{TIPOS[n.tipo]?.label||n.tipo} · {fmtRel(n.criado_em)}</div>
                      </div>
                      {n.prioridade==='urgente' && <ZapIc size={13} color={T.red}/>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={()=>setCfgOpen(true)} style={{display:'flex', alignItems:'center', justifyContent:'center', width:40, height:40, background:T.bg2, border:`1px solid ${T.sep2}`, color:T.ink2, borderRadius:11, cursor:'pointer'}}><Settings size={16}/></button>
          <button onClick={carregar} style={{display:'flex', alignItems:'center', gap:7, background:T.bg2, border:`1px solid ${T.sep2}`, color:T.ink2, borderRadius:11, padding:'9px 14px', cursor:'pointer', fontWeight:700, fontSize:12.5}}>
            <RefreshCw size={13} style={loading?{animation:'spin 1s linear infinite'}:{}}/>Atualizar
          </button>
          <button onClick={()=>setNova(true)} style={{display:'flex', alignItems:'center', gap:7, background:`linear-gradient(135deg, ${T.amber}26, ${T.orange}26)`, border:`1px solid ${T.amberBor}`, color:T.amber, borderRadius:11, padding:'9px 16px', cursor:'pointer', fontWeight:900, fontSize:12.5, boxShadow:`0 0 24px -10px ${T.amber}88`}}>
            <Plus size={14}/>Nova ocorrência
          </button>
        </div>
      </div>

      {aba === 'inteligencia' ? (
        /* ════ ABA INTELIGÊNCIA — causa-raiz da operação ════ */
        !intel ? <div style={{display:'flex',flexDirection:'column',gap:10}}><Skel h={90} r={14}/><Skel h={220} r={14}/></div> : (
        <>
        {/* KPIs estratégicos */}
        {intelAv && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:12, marginBottom:16}}>
            {[
              { lb:'Taxa de reincidência', vl:`${intelAv.taxa_reincidencia}%`, ic:Repeat, cl: intelAv.taxa_reincidencia>30?T.red:intelAv.taxa_reincidencia>15?T.amber:T.green, sub:`${intelAv.reincidentes}/${intelAv.clientes_unicos} clientes` },
              { lb:'1ª resolução', vl: intelAv.taxa_primeira_resolucao==null?'—':`${intelAv.taxa_primeira_resolucao}%`, ic:BadgeCheck, cl: T.green, sub:`${intelAv.reabertos} reabertos` },
              { lb:'CSAT médio', vl: intelAv.csat.media==null?'—':`${intelAv.csat.media} ★`, ic:Smile, cl: intelAv.csat.media>=4?T.green:intelAv.csat.media>=3?T.amber:T.red, sub:`${intelAv.csat.n} respostas` },
              { lb:'Custo compensação', vl:`R$ ${fmtBRL(intelAv.compensacao.total)}`, ic:Wallet, cl:T.purple, sub:`${intelAv.compensacao.usos} cupons` },
              { lb:'Tickets proativos', vl:intelAv.proativos, ic:Radio, cl:T.cyan, sub:'antes da reclamação' },
            ].map((k,i)=>(
              <div key={i} style={{position:'relative', overflow:'hidden', background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:15, padding:'14px 16px'}}>
                <div style={{position:'absolute', top:-26, right:-26, width:80, height:80, borderRadius:99, background:`radial-gradient(circle, ${k.cl}22, transparent 70%)`}}/>
                <div style={{display:'flex', alignItems:'center', gap:7, fontSize:10.5, fontWeight:800, color:T.ink3, textTransform:'uppercase', letterSpacing:0.6}}><k.ic size={13} color={k.cl}/>{k.lb}</div>
                <div style={{fontSize:23, fontWeight:900, color:T.ink1, marginTop:5}}>{k.vl}</div>
                <div style={{fontSize:10, color:T.ink4, marginTop:2}}>{k.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Curva temporal */}
        {intelAv?.curva?.length > 1 && (
          <div style={{background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:14, padding:'14px 16px', marginBottom:16}}>
            <div style={{fontSize:11, fontWeight:800, color:T.ink2, textTransform:'uppercase', letterSpacing:0.7, marginBottom:14, display:'flex', alignItems:'center', gap:7}}><TrendingUp size={13} color={T.cyan}/>Tickets por dia — abertos vs resolvidos ({intelAv.periodo_dias}d)</div>
            {(() => {
              const c = intelAv.curva.slice(-30)
              const max = Math.max(1, ...c.map(d=>Math.max(d.abertos,d.resolvidos)))
              return (
                <div style={{display:'flex', alignItems:'flex-end', gap:3, height:120}}>
                  {c.map((d,i)=>(
                    <div key={i} title={`${d.dia}: ${d.abertos} abertos, ${d.resolvidos} resolvidos`} style={{flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', gap:2, height:'100%'}}>
                      <div style={{display:'flex', gap:1, alignItems:'flex-end', height:'100%'}}>
                        <div style={{flex:1, height:`${d.abertos/max*100}%`, background:`linear-gradient(180deg, ${T.amber}, ${T.amber}66)`, borderRadius:'3px 3px 0 0', minHeight: d.abertos?3:0}}/>
                        <div style={{flex:1, height:`${d.resolvidos/max*100}%`, background:`linear-gradient(180deg, ${T.green}, ${T.green}66)`, borderRadius:'3px 3px 0 0', minHeight: d.resolvidos?3:0}}/>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
            <div style={{display:'flex', gap:16, marginTop:10, fontSize:11, color:T.ink3}}>
              <span style={{display:'flex', alignItems:'center', gap:5}}><span style={{width:10, height:10, borderRadius:3, background:T.amber}}/>Abertos</span>
              <span style={{display:'flex', alignItems:'center', gap:5}}><span style={{width:10, height:10, borderRadius:3, background:T.green}}/>Resolvidos</span>
            </div>
          </div>
        )}

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(340px, 1fr))', gap:14}}>
          {intelAv?.tempo_por_tipo?.length > 0 && (
            <Sec icon={Clock} color={T.blue} title="Tempo médio de resolução por tipo">
              <div style={{display:'flex', flexDirection:'column', gap:9}}>
                {(() => { const max = Math.max(1, ...intelAv.tempo_por_tipo.map(t=>t.media_h)); return intelAv.tempo_por_tipo.map((t,i)=>{ const ti=TIPOS[t.tipo]||TIPOS.outro; return (
                  <div key={i}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4}}>
                      <span style={{fontWeight:800, color:ti.color}}>{ti.label}</span>
                      <span style={{color: t.media_h>72?T.red:t.media_h>24?T.amber:T.green, fontWeight:800}}>{t.media_h}h <span style={{color:T.ink4, fontWeight:400}}>({t.n})</span></span>
                    </div>
                    <div style={{height:6, borderRadius:99, background:T.bg3, overflow:'hidden'}}><div style={{width:`${t.media_h/max*100}%`, height:'100%', borderRadius:99, background: t.media_h>72?T.red:t.media_h>24?T.amber:T.green}}/></div>
                  </div>
                )})})()}
              </div>
            </Sec>
          )}
          {intelAv?.regiao_atraso?.length > 0 && (
            <Sec icon={MapPinIc} color={T.orange} title="Atraso/extravio por estado">
              <div style={{display:'flex', flexDirection:'column', gap:7}}>
                {(() => { const max=Math.max(1,...intelAv.regiao_atraso.map(r=>r.n)); return intelAv.regiao_atraso.map((r,i)=>(
                  <div key={i} style={{display:'flex', alignItems:'center', gap:10}}>
                    <span style={{width:28, fontSize:12.5, fontWeight:800, color:T.ink1}}>{r.uf}</span>
                    <div style={{flex:1, height:18, borderRadius:6, background:T.bg3, overflow:'hidden', position:'relative'}}>
                      <div style={{width:`${r.n/max*100}%`, height:'100%', background:`linear-gradient(90deg, ${T.orange}99, ${T.orange})`, borderRadius:6}}/>
                    </div>
                    <span style={{fontSize:12, fontWeight:800, color:T.orange, width:24, textAlign:'right'}}>{r.n}</span>
                  </div>
                ))})()}
              </div>
            </Sec>
          )}
          {intelAv?.csat?.n > 0 && (
            <Sec icon={Smile} color={T.green} title="Distribuição do CSAT">
              <div style={{display:'flex', flexDirection:'column', gap:7}}>
                {[5,4,3,2,1].map(score=>{ const n=intelAv.csat.dist[score]||0; const pct=intelAv.csat.n?n/intelAv.csat.n*100:0; const cor=score>=4?T.green:score>=3?T.amber:T.red; return (
                  <div key={score} style={{display:'flex', alignItems:'center', gap:10}}>
                    <span style={{width:30, fontSize:12, fontWeight:800, color:cor}}>{score} ★</span>
                    <div style={{flex:1, height:16, borderRadius:6, background:T.bg3, overflow:'hidden'}}><div style={{width:`${pct}%`, height:'100%', background:cor, borderRadius:6}}/></div>
                    <span style={{fontSize:11, color:T.ink3, width:30, textAlign:'right'}}>{n}</span>
                  </div>
                )})}
              </div>
            </Sec>
          )}
          <Sec icon={Truck} color={T.red} title={`Transportadoras × tickets (${intel.periodo_dias}d)`}>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {intel.transportadoras.length===0 && <div style={{fontSize:12, color:T.ink3}}>Sem tickets com transportadora no período.</div>}
              {intel.transportadoras.map((t,i)=>(
                <div key={i}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4}}>
                    <span style={{fontWeight:800, color:T.ink1}}>{t.nome}</span>
                    <span style={{color:T.ink3}}>
                      {t.tickets} tickets · {t.pct_tickets}% dos casos{t.pct_envios!=null && ` vs ${t.pct_envios}% dos envios`}
                      {t.indice!=null && <b style={{marginLeft:6, color: t.indice>1.3?T.red:t.indice<0.8?T.green:T.amber}}>×{t.indice}</b>}
                    </span>
                  </div>
                  <div style={{height:7, borderRadius:99, background:T.bg3, overflow:'hidden'}}>
                    <div style={{width:`${t.pct_tickets}%`, height:'100%', borderRadius:99,
                      background:`linear-gradient(90deg, ${t.indice>1.3?T.red:T.amber}99, ${t.indice>1.3?T.red:T.amber})`,
                      boxShadow:`0 0 10px ${t.indice>1.3?T.red:T.amber}66`}}/>
                  </div>
                </div>
              ))}
              <div style={{fontSize:10.5, color:T.ink4, marginTop:2}}>×índice = % dos tickets ÷ % dos envios. Acima de ×1.3 = transportadora problemática (dado p/ renegociar ou bloquear no menu de frete).</div>
            </div>
          </Sec>
          <Sec icon={Tag} color={T.purple} title="Tipo × canal">
            <div style={{display:'flex', flexDirection:'column', gap:6, maxHeight:260, overflowY:'auto'}}>
              {intel.tipo_canal.map((tc,i)=>(
                <div key={i} style={{display:'flex', alignItems:'center', gap:8, fontSize:12}}>
                  <span style={{minWidth:90, fontWeight:800, color: TIPOS[tc.tipo]?.color || T.ink2}}>{TIPOS[tc.tipo]?.label || tc.tipo}</span>
                  <span style={{color:T.ink3, flex:1, display:'inline-flex', alignItems:'center', gap:5}}>{(()=>{ const Ic=CANAIS[tc.canal]?.icon||MessageCircle; return <Ic size={12}/> })()}{CANAIS[tc.canal]?.label || tc.canal}</span>
                  <span style={{fontWeight:900, color:T.ink1}}>{tc.n}</span>
                </div>
              ))}
            </div>
          </Sec>
          <Sec icon={Package} color={T.amber} title="Produtos que mais geram tickets">
            <div style={{display:'flex', flexDirection:'column', gap:7}}>
              {intel.produtos.length===0 && <div style={{fontSize:12, color:T.ink3}}>Sem dados de produto no período.</div>}
              {intel.produtos.map((p,i)=>(
                <div key={i} style={{display:'flex', justifyContent:'space-between', gap:8, fontSize:12}}>
                  <span style={{color:T.ink2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{i+1}. {p.nome}</span>
                  <span style={{fontWeight:900, color:T.amber, flexShrink:0}}>{p.n}</span>
                </div>
              ))}
            </div>
          </Sec>
          <Sec icon={Clock} color={T.cyan} title="Quando os tickets nascem (dia × hora)">
            {(() => {
              const max = Math.max(1, ...Object.values(intel.heatmap||{}))
              const dias = ['D','S','T','Q','Q','S','S']
              return (
                <div style={{display:'flex', flexDirection:'column', gap:3}}>
                  {dias.map((d,di)=>(
                    <div key={di} style={{display:'flex', gap:2, alignItems:'center'}}>
                      <span style={{width:14, fontSize:9.5, color:T.ink4, fontWeight:800}}>{d}</span>
                      {Array.from({length:24},(_,h)=>{
                        const v = intel.heatmap?.[`${di}-${h}`]||0
                        return <div key={h} title={`${v} tickets`} style={{flex:1, height:13, borderRadius:3,
                          background: v ? `rgba(34,211,238,${0.15+0.85*(v/max)})` : T.bg3}}/>
                      })}
                    </div>
                  ))}
                  <div style={{display:'flex', gap:2, marginLeft:16}}>
                    {[0,6,12,18,23].map(h=><span key={h} style={{flex: h===23?0:6, fontSize:9, color:T.ink4}}>{h}h</span>)}
                  </div>
                </div>
              )
            })()}
          </Sec>
          <Sec icon={UserCheck} color={T.green} title="Resolução por agente">
            <div style={{display:'flex', flexDirection:'column', gap:7}}>
              {(!intel.agentes || intel.agentes.length===0) && <div style={{fontSize:12, color:T.ink3}}>Sem tickets atribuídos resolvidos no período.</div>}
              {(intel.agentes||[]).map((a,i)=>(
                <div key={i} style={{display:'flex', justifyContent:'space-between', gap:8, fontSize:12}}>
                  <span style={{fontWeight:800, color:T.ink1}}>{a.nome}</span>
                  <span style={{color:T.ink3}}>{a.resolvidos} resolvidos · <b style={{color: a.media_h<=24?T.green:a.media_h<=72?T.amber:T.red}}>{a.media_h}h médias</b></span>
                </div>
              ))}
            </div>
          </Sec>
          <Sec icon={Users} color={T.red} title="Clientes que mais abrem ticket">
            <div style={{display:'flex', flexDirection:'column', gap:7, maxHeight:280, overflowY:'auto'}}>
              {(!intel.clientes_recorrentes || intel.clientes_recorrentes.length===0) && <div style={{fontSize:12, color:T.ink3}}>Nenhum cliente com 2+ tickets no período.</div>}
              {(intel.clientes_recorrentes||[]).map((c,i)=>(
                <button key={i} onClick={()=>setBusca(c.telefone)}
                  title="Filtrar tickets deste cliente"
                  style={{display:'flex', alignItems:'center', gap:10, padding:'8px 10px', textAlign:'left', cursor:'pointer', background:T.bg1, border:`1px solid ${c.tickets>=4?T.redBor:T.sep2}`, borderRadius:10}}>
                  <Avatar nome={c.cliente} size={30}/>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:12.5, fontWeight:800, color:T.ink1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{c.cliente}</div>
                    <div style={{fontSize:10.5, color:T.ink3}}>{(c.tipos||[]).map(t=>TIPOS[t]?.label||t).join(' · ')}</div>
                  </div>
                  <div style={{textAlign:'right', flexShrink:0}}>
                    <div style={{fontSize:15, fontWeight:900, color: c.tickets>=4?T.red:T.amber}}>{c.tickets}</div>
                    <div style={{fontSize:9.5, color:T.ink4}}>{c.resolvidos} resolv.</div>
                  </div>
                </button>
              ))}
            </div>
          </Sec>
          <Sec icon={Tag} color={T.amber} title="Tickets por tipo de problema">
            {(() => { const max = Math.max(1, ...(intel.tipos_detalhe||[]).map(t=>t.n)); return (
              <div style={{display:'flex', flexDirection:'column', gap:9}}>
                {(intel.tipos_detalhe||[]).map((t,i)=>{ const ti = TIPOS[t.tipo]||TIPOS.outro; return (
                  <div key={i}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4}}>
                      <span style={{fontWeight:800, color:ti.color, display:'flex', alignItems:'center', gap:6}}>{(()=>{ const Ic=ti.icon; return <Ic size={13}/> })()}{ti.label}</span>
                      <span style={{fontWeight:900, color:T.ink1}}>{t.n}</span>
                    </div>
                    <div style={{height:7, borderRadius:99, background:T.bg3, overflow:'hidden'}}>
                      <div style={{width:`${t.n/max*100}%`, height:'100%', borderRadius:99, background:`linear-gradient(90deg, ${ti.color}99, ${ti.color})`, boxShadow:`0 0 10px ${ti.color}66`}}/>
                    </div>
                  </div>
                )})}
              </div>
            )})()}
          </Sec>
          <Sec icon={Radio} color={T.purple} title="Proativos do sistema">
            <div style={{display:'flex', alignItems:'center', gap:14}}>
              <div style={{fontSize:34, fontWeight:900, color:T.purple, lineHeight:1}}>{intel.proativos}</div>
              <div style={{fontSize:12, color:T.ink2, lineHeight:1.5}}>
                tickets abertos automaticamente por rastreio parado nos últimos {intel.periodo_dias} dias — problemas detectados <b>antes</b> da reclamação do cliente.
              </div>
            </div>
          </Sec>
        </div>
        </>
        )
      ) : (
      <>
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

      {/* ITEM 4: métricas de atendimento (30 dias) */}
      {met && (
        <div style={{display:'flex', gap:18, flexWrap:'wrap', alignItems:'center', padding:'11px 16px', background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:13, marginBottom:16, fontSize:12}}>
          <span style={{fontWeight:900, color:T.ink3, textTransform:'uppercase', letterSpacing:0.7, fontSize:10.5, display:'flex', alignItems:'center', gap:6}}><TrendingUp size={12} color={T.cyan}/>Performance 30d</span>
          <span style={{color:T.ink2}}>1ª resposta: <b style={{color: met.primeira_resposta_h==null?T.ink3: met.primeira_resposta_h<=4?T.green:met.primeira_resposta_h<=12?T.amber:T.red}}>{met.primeira_resposta_h==null?'—':met.primeira_resposta_h+'h'}</b></span>
          <span style={{color:T.ink2}}>Resolução: <b style={{color: met.resolucao_h==null?T.ink3: met.resolucao_h<=48?T.green:T.amber}}>{met.resolucao_h==null?'—':met.resolucao_h+'h'}</b></span>
          <span style={{color:T.ink2}}>Resolvidos: <b style={{color:T.green}}>{met.resolvidos}</b>/{met.tickets}</span>
          <span style={{color:T.ink2}}>CSAT: <b style={{color: met.csat_media==null?T.ink3: met.csat_media>=4?T.green:met.csat_media>=3?T.amber:T.red}}>{met.csat_media==null?'—':`${met.csat_media} ★`}</b>{met.csat_n>0 && <span style={{color:T.ink4}}> ({met.csat_n})</span>}</span>
          <span style={{color:T.ink4, marginLeft:'auto', display:'flex', gap:10}}>{Object.entries(met.por_canal||{}).map(([k,v])=>{ const Ic=CANAIS[k]?.icon||MessageCircle; return <span key={k} style={{display:'inline-flex',alignItems:'center',gap:4}}><Ic size={11}/>{v}</span> })}</span>
        </div>
      )}

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

      {/* Lista — split view quando há ticket aberto (lista compacta + painel) */}
      <div style={{display: sel ? 'grid' : 'flex', gridTemplateColumns: sel ? '340px 1fr' : undefined,
        flexDirection: sel ? undefined : 'column', gap: sel ? 14 : 9, alignItems: sel ? 'start' : undefined}}>
      <div style={{display:'flex', flexDirection:'column', gap:9, maxHeight: sel ? 'calc(100vh - 150px)' : 'none', overflowY: sel ? 'auto' : 'visible', paddingRight: sel ? 4 : 0}}>
        {loading && [1,2,3].map(i=><Skel key={i} h={74} r={14}/>)}
        {!loading && lista.length===0 && (
          <div style={{textAlign:'center', padding:'60px 0', color:T.ink3, fontSize:13.5}}>
            <CheckCircle size={36} color={T.green} style={{marginBottom:10}}/>
            <div>Nenhum ticket {filtro==='ativas'?'ativo':'aqui'}. Tudo em dia.</div>
          </div>
        )}
        {!loading && lista.map(o => {
          const sd = STATUS[o.status] || STATUS.aberta
          const tp = TIPOS[o.tipo] || TIPOS.outro
          const pr = PRIO[o.prioridade] || PRIO.normal
          const urgente = o.prioridade==='urgente' && !['resolvida','encerrada'].includes(o.status)
          return (
            <div key={o.id} onClick={()=>setSel(o)}
              style={{display:'flex', alignItems:'center', gap: sel?10:14, padding: sel?'10px 12px':'13px 16px', cursor:'pointer',
                background: sel?.id===o.id ? T.bg3 : T.bg1,
                border:`1px solid ${sel?.id===o.id ? T.blueBor : urgente?T.redBor:T.sep2}`, borderRadius:14,
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
                  <CanalChip canal={o.canal}/>
                  {o.numero_pedido && <span style={{fontSize:11, color:T.cyan}}>#{o.numero_pedido}</span>}
                </div>
                <div style={{fontSize:12.5, color:T.ink3, marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                  {o.titulo || o.descricao}
                </div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:10, flexShrink:0}}>
                {o.followup_vencido && <Bdg color={T.red} dim={T.redDim} bor={T.redBor} icon={AlarmClock}>follow-up</Bdg>}
                {o.escalonado && <Bdg color={T.orange} dim={T.orangeDim} bor={T.orangeBor} icon={TrendingUp}>SLA⬆</Bdg>}
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

      {sel && (
        <div style={{position:'sticky', top:14, height:'calc(100vh - 150px)', overflow:'hidden'}}>
          <Modal360 key={sel.id} inline oc={sel} onAtualizado={()=>carregar()} onClose={()=>setSel(null)}/>
        </div>
      )}
      </div>
      <div style={{marginTop:10, fontSize:10.5, color:T.ink4, textAlign:'center'}}>
        atalhos: <b>J/K</b> navegar · <b>R</b> responder · <b>N</b> novo ticket · <b>Esc</b> fechar
      </div>
      </>
      )}

      {nova && <ModalNova onSalvo={()=>carregar()} onClose={()=>setNova(false)}/>}
      {cfgOpen && cfg && (
        <div onClick={()=>setCfgOpen(false)} style={{position:'fixed', inset:0, zIndex:95, background:'rgba(4,5,10,.78)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:18}}>
          <div onClick={e=>e.stopPropagation()} style={{width:'min(520px,100%)', background:`linear-gradient(180deg, ${T.bg1}, ${T.bg0})`, border:`1px solid ${T.sep2}`, borderRadius:18, padding:22, boxShadow:'0 40px 100px -20px rgba(0,0,0,.85)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
              <span style={{fontSize:16, fontWeight:900, color:T.ink1, display:'flex', alignItems:'center', gap:8}}><Settings size={17} color={T.blue}/>Configurações do módulo</span>
              <button onClick={()=>setCfgOpen(false)} style={{background:T.gray, border:`1px solid ${T.grayBor}`, color:T.ink2, borderRadius:9, width:30, height:30, cursor:'pointer'}}><X size={15}/></button>
            </div>
            {[
              ['oferecer_compensacao','Oferecer reenvio / cupom de compensação', 'CUIDADO: atraso costuma ser da malha logística. Quando LIGADO, a Molise pode oferecer cupom/reenvio em casos de atraso. Padrão: DESLIGADO — trate por acompanhamento.'],
              ['som_notificacao','Som ao chegar ticket urgente', 'Toca um aviso sonoro quando entra urgente ou proativo.'],
              ['auto_sugerir_tipo','Sugerir tipo e prioridade na criação', 'A IA lê a descrição e já preenche tipo/prioridade.'],
              ['sla_preditivo','SLA preditivo', 'Mostra quanto tempo resta antes de estourar, não só depois.'],
            ].map(([k,lb,desc])=>(
              <div key={k} style={{display:'flex', gap:12, alignItems:'flex-start', padding:'12px 0', borderBottom:`1px solid ${T.sep}`}}>
                <button onClick={()=>salvarCfg({[k]: !cfg[k]})}
                  style={{flexShrink:0, width:42, height:24, borderRadius:99, border:'none', cursor:'pointer', position:'relative', background: cfg[k]?T.green:T.bg4, transition:'all .2s'}}>
                  <span style={{position:'absolute', top:3, left: cfg[k]?21:3, width:18, height:18, borderRadius:99, background:'#fff', transition:'all .2s'}}/>
                </button>
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:800, color: k==='oferecer_compensacao'&&cfg[k]?T.amber:T.ink1}}>{lb}</div>
                  <div style={{fontSize:11, color:T.ink3, marginTop:3, lineHeight:1.45}}>{desc}</div>
                  {k==='oferecer_compensacao' && cfg[k] && (
                    <div style={{marginTop:8, display:'flex', gap:6}}>
                      {[['cupom','Cupom'],['reenvio','Reenvio'],['ambos','Ambos']].map(([v,l])=>(
                        <button key={v} onClick={()=>salvarCfg({compensacao_tipo:v})}
                          style={{background: cfg.compensacao_tipo===v?T.amberDim:T.bg3, border:`1px solid ${cfg.compensacao_tipo===v?T.amberBor:T.sep2}`, color: cfg.compensacao_tipo===v?T.amber:T.ink3, borderRadius:999, padding:'3px 11px', cursor:'pointer', fontSize:11, fontWeight:700}}>{l}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
