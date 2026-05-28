/**
 * PageCampanhas.jsx — Central de Campanhas WhatsApp Enterprise
 * Disparos manuais em massa com proteção de número, bounce, KPIs e monitor em tempo real
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Send, Plus, Play, Pause, StopCircle, RefreshCw, Upload, Download,
  Shield, AlertTriangle, CheckCircle, XCircle, Clock, Users, Zap,
  MessageSquare, BarChart3, Activity, Settings, Search, Filter,
  ChevronDown, ChevronUp, ChevronRight, X, Eye, Edit3, Trash2,
  Copy, ExternalLink, TrendingUp, TrendingDown, Minus, Info,
  ToggleLeft, ToggleRight, Calendar, DollarSign, Target, Radio,
  AlertCircle, Lock, Unlock, Hash, Timer, Layers, Globe,
  ArrowUpRight, Package, Bell, Star, Phone, Mail,
} from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const BASE = import.meta.env?.VITE_API_URL || ''

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#6b7294', ink4:'#3a3f5c',
  sep:'rgba(255,255,255,0.05)', sep2:'rgba(255,255,255,0.08)',
  green:'#00e676', greenDim:'rgba(0,230,118,0.08)', greenBor:'rgba(0,230,118,0.2)',
  blue:'#4f8ef7',  blueDim:'rgba(79,142,247,0.08)',  blueBor:'rgba(79,142,247,0.2)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,0.08)',  amberBor:'rgba(255,179,0,0.2)',
  red:'#ff4757',   redDim:'rgba(255,71,87,0.08)',    redBor:'rgba(255,71,87,0.2)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,0.08)',purpleBor:'rgba(167,139,250,0.2)',
  cyan:'#06b6d4',  cyanDim:'rgba(6,182,212,0.08)',   cyanBor:'rgba(6,182,212,0.2)',
  accent:'#00e676',
}

// ── Custo Meta por template ──────────────────────────────────────────────────
const CUSTO_MSG_USD = 0.0788  // marketing template Brasil
const USD_BRL = 5.75

// ── Status de campanha ────────────────────────────────────────────────────────
const STATUS_CAMP = {
  rascunho:  { label:'Rascunho',   cor:T.ink3,  icon:Edit3      },
  agendada:  { label:'Agendada',   cor:T.amber, icon:Calendar   },
  rodando:   { label:'Enviando',   cor:T.green, icon:Radio      },
  pausada:   { label:'Pausada',    cor:T.amber, icon:Pause      },
  concluida: { label:'Concluída',  cor:T.blue,  icon:CheckCircle},
  cancelada: { label:'Cancelada',  cor:T.red,   icon:XCircle    },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtN   = n => Number(n||0).toLocaleString('pt-BR')
const fmtPct = (v,t) => t > 0 ? ((v/t)*100).toFixed(1)+'%' : '0%'
const fmtBRL = v => `R$ ${(v||0).toFixed(2).replace('.',',')}`
const fmtRel = ts => {
  if(!ts) return '—'
  const m = Math.floor((Date.now()-new Date(ts))/60000)
  if(m<1) return 'agora'; if(m<60) return `${m}min`
  if(m<1440) return `${Math.floor(m/60)}h`; return `${Math.floor(m/1440)}d`
}

// ── Dados mock para demonstração ─────────────────────────────────────────────
const CAMPANHAS_MOCK = [
  { id:1, nome:'Lançamento Molise — Clientes VIP', status:'rodando', total:1200, enviados:743, entregues:698, lidos:412, erros:8, opt_out:3, inicio:'2026-05-28T08:00:00', intervalo_seg:18, lote:50, template:'boas_vindas_molise', custo_total:58.52, velocidade:52 },
  { id:2, nome:'Reengajamento Q2 — Inativos 90d',  status:'agendada', total:8400, enviados:0, entregues:0, lidos:0, erros:0, opt_out:0, inicio:'2026-05-29T09:00:00', intervalo_seg:22, lote:30, template:'reengajamento', custo_total:0, velocidade:0 },
  { id:3, nome:'Black Friday Preview — Base Total', status:'rascunho', total:0, enviados:0, entregues:0, lidos:0, erros:0, opt_out:0, inicio:null, intervalo_seg:20, lote:40, template:null, custo_total:0, velocidade:0 },
  { id:4, nome:'Confirmação Pedidos — Maio',        status:'concluida', total:3240, enviados:3240, entregues:3198, lidos:2876, erros:42, opt_out:11, inicio:'2026-05-20T10:00:00', intervalo_seg:15, lote:60, template:'pedido_criado', custo_total:255.31, velocidade:0 },
]

const HISTORICO_MOCK = Array.from({length:20},(_,i)=>({
  id: 1000+i, campanha_id:1, telefone:`5519999${String(i).padStart(5,'0')}`,
  nome:`Cliente ${i+1}`, status:['enviado','entregue','lido','erro'][i%4],
  enviado_em: new Date(Date.now()-i*65000).toISOString(), erro: i%4===3?'UNREGISTERED':null,
}))

const GRAFICO_MOCK = Array.from({length:24},(_,i)=>({
  hora:`${String(i).padStart(2,'0')}h`, enviados:i>7&&i<18?Math.floor(40+Math.random()*60):0,
  lidos:i>7&&i<18?Math.floor(20+Math.random()*40):0,
}))

const RISCO_MOCK = { score:92, nivel:'baixo', blocos_24h:0, opt_outs_24h:3, erros_pct:1.1, velocidade_atual:52, recomendacao_max:80 }

// ── Componente Badge ──────────────────────────────────────────────────────────
function Bdg({ cor, dim, bor, children }) {
  return <span style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:4,color:cor,background:dim,border:`1px solid ${bor}`,whiteSpace:'nowrap' }}>{children}</span>
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon:Icon, label, value, sub, cor, dim, bor, barra, onClick, ativo }) {
  return (
    <div onClick={onClick} style={{ background:ativo?dim:T.bg2, border:`1px solid ${ativo?bor:T.sep}`, borderRadius:12, padding:'14px 16px', cursor:onClick?'pointer':'default', position:'relative', overflow:'hidden', transition:'all .15s' }}>
      {barra && <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:cor }}/>}
      <div className="flex items-center gap-2 mb-2">
        <div style={{ width:28,height:28,borderRadius:8,background:dim,border:`1px solid ${bor}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <Icon size={13} style={{ color:cor }}/>
        </div>
        <span style={{ fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'.07em',color:T.ink3 }}>{label}</span>
      </div>
      <p style={{ fontSize:22,fontWeight:700,color:ativo?cor:T.ink1,letterSpacing:'-.02em',margin:'0 0 2px' }}>{value}</p>
      {sub && <p style={{ fontSize:11,color:T.ink3 }}>{sub}</p>}
    </div>
  )
}

// ── Monitor de Risco ──────────────────────────────────────────────────────────
function MonitorRisco({ risco }) {
  const nivel = risco.nivel
  const cor = nivel==='baixo'?T.green:nivel==='medio'?T.amber:T.red
  const dim = nivel==='baixo'?T.greenDim:nivel==='medio'?T.amberDim:T.redDim
  const bor = nivel==='baixo'?T.greenBor:nivel==='medio'?T.amberBor:T.redBor
  const pct = risco.score

  return (
    <div style={{ background:T.bg2,border:`1px solid ${bor}`,borderRadius:14,padding:'18px 20px' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={16} style={{ color:cor }}/>
          <span style={{ fontSize:13,fontWeight:700,color:T.ink1 }}>Monitor de Risco do Número</span>
        </div>
        <Bdg cor={cor} dim={dim} bor={bor}>
          <div style={{ width:6,height:6,borderRadius:'50%',background:cor }}/>
          {nivel.charAt(0).toUpperCase()+nivel.slice(1)} risco
        </Bdg>
      </div>

      {/* Score circular */}
      <div className="flex items-center gap-6 mb-5">
        <div style={{ position:'relative',width:80,height:80,flexShrink:0 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke={T.bg3} strokeWidth="8"/>
            <circle cx="40" cy="40" r="32" fill="none" stroke={cor} strokeWidth="8"
              strokeDasharray={`${(pct/100)*200.96} 200.96`} strokeLinecap="round"
              transform="rotate(-90 40 40)" style={{ transition:'stroke-dasharray .6s ease' }}/>
          </svg>
          <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
            <span style={{ fontSize:18,fontWeight:800,color:cor,lineHeight:1 }}>{pct}</span>
            <span style={{ fontSize:8,color:T.ink3,fontWeight:600 }}>score</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {[
            { l:'Bloqueios 24h', v:risco.blocos_24h, max:0, ok:risco.blocos_24h===0 },
            { l:'Opt-outs 24h', v:risco.opt_outs_24h, max:10, ok:risco.opt_outs_24h<10 },
            { l:'Taxa de erro', v:`${risco.erros_pct}%`, max:5, ok:risco.erros_pct<5 },
            { l:'Velocidade atual', v:`${risco.velocidade_atual}/min`, max:null, ok:risco.velocidade_atual<=risco.recomendacao_max },
          ].map(({l,v,ok})=>(
            <div key={l} className="flex items-center justify-between">
              <span style={{ fontSize:11,color:T.ink3 }}>{l}</span>
              <span style={{ fontSize:11,fontWeight:600,color:ok?T.green:T.amber }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:T.bg3,borderRadius:8,padding:'10px 12px',border:`1px solid ${T.sep}` }}>
        <div className="flex items-start gap-2">
          <Info size={12} style={{ color:T.ink3,flexShrink:0,marginTop:1 }}/>
          <p style={{ fontSize:11,color:T.ink3,lineHeight:1.55,margin:0 }}>
            Velocidade recomendada máxima: <strong style={{ color:T.ink1 }}>{risco.recomendacao_max} msgs/min</strong>.
            Acima disso a Meta pode sinalizar o número. Bounce e opt-outs são os principais gatilhos de bloqueio.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Editor de Mensagem (inline, sem aprovação Meta) ──────────────────────────
function EditorMensagem({ blocos, setBlocos, variaveis }) {
  const VARS = variaveis || ['{{nome}}','{{numero_pedido}}','{{valor_total}}','{{link}}','{{loja}}']
  const addBloco = tipo => setBlocos(p=>[...p,{tipo,conteudo:'',id:Date.now()}])
  const delBloco = i => setBlocos(p=>p.filter((_,j)=>j!==i))
  const updBloco = (i,campo,val) => setBlocos(p=>p.map((b,j)=>j===i?{...b,[campo]:val}:b))

  const TIPOS = [
    { t:'texto', l:'Texto', cor:T.blue },
    { t:'negrito', l:'Negrito', cor:T.cyan },
    { t:'emoji_linha', l:'Destaque', cor:T.amber },
    { t:'link', l:'Link', cor:T.purple },
    { t:'quebra', l:'Separador', cor:T.ink3 },
  ]

  const preview = blocos.map(b => {
    if(b.tipo==='negrito') return `*${b.conteudo}*`
    if(b.tipo==='emoji_linha') return `${b.conteudo}`
    if(b.tipo==='link') return b.conteudo
    if(b.tipo==='quebra') return '---'
    return b.conteudo
  }).filter(Boolean).join('\n')

  return (
    <div style={{ display:'grid',gridTemplateColumns:'1fr 280px',gap:12 }}>
      {/* Editor */}
      <div>
        <div className="flex flex-col gap-2 mb-3">
          {blocos.map((b,i)=>(
            <div key={b.id} style={{ display:'flex',gap:8,alignItems:'flex-start' }}>
              <div style={{ flex:1,background:T.bg3,border:`1px solid ${T.sep2}`,borderRadius:8,overflow:'hidden' }}>
                <div className="flex items-center gap-2 px-2 py-1.5" style={{ borderBottom:`1px solid ${T.sep}`,background:T.bg4 }}>
                  <div style={{ width:5,height:5,borderRadius:'50%',background:TIPOS.find(t=>t.t===b.tipo)?.cor||T.ink3 }}/>
                  <span style={{ fontSize:9,fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',color:T.ink3 }}>
                    {TIPOS.find(t=>t.t===b.tipo)?.l||b.tipo}
                  </span>
                </div>
                {b.tipo==='quebra' ? (
                  <div style={{ padding:'8px 12px',fontSize:11,color:T.ink4,fontStyle:'italic' }}>— linha separadora —</div>
                ) : (
                  <textarea value={b.conteudo} onChange={e=>updBloco(i,'conteudo',e.target.value)}
                    rows={b.tipo==='texto'?3:1} placeholder={b.tipo==='link'?'https://...':'Conteúdo...'}
                    style={{ width:'100%',padding:'8px 12px',background:'transparent',border:'none',outline:'none',resize:'none',fontSize:12,color:T.ink1,fontFamily:'inherit',lineHeight:1.55,boxSizing:'border-box' }}/>
                )}
              </div>
              <button onClick={()=>delBloco(i)} style={{ width:28,height:28,borderRadius:6,background:T.redDim,border:`1px solid ${T.redBor}`,color:T.red,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:4 }}>
                <X size={11}/>
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar bloco */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {TIPOS.map(({t,l,cor})=>(
            <button key={t} onClick={()=>addBloco(t)} style={{ padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:500,background:T.bg3,border:`1px solid ${T.sep2}`,color:T.ink2,cursor:'pointer' }}>
              +{l}
            </button>
          ))}
        </div>

        {/* Variáveis */}
        <div>
          <p style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:T.ink4,marginBottom:6 }}>Variáveis disponíveis</p>
          <div className="flex flex-wrap gap-1.5">
            {VARS.map(v=>(
              <code key={v} style={{ fontSize:10,padding:'2px 7px',borderRadius:4,background:T.bg3,border:`1px solid ${T.sep2}`,color:T.cyan,fontFamily:'monospace',cursor:'pointer' }}
                onClick={()=>{
                  const last = blocos[blocos.length-1]
                  if(last && last.tipo==='texto') setBlocos(p=>p.map((b,i)=>i===p.length-1?{...b,conteudo:b.conteudo+v}:b))
                  else addBloco('texto') && undefined
                }}>
                {v}
              </code>
            ))}
          </div>
        </div>
      </div>

      {/* Preview WhatsApp */}
      <div>
        <p style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:T.ink4,marginBottom:8 }}>Preview</p>
        <div style={{ borderRadius:14,overflow:'hidden',border:`2px solid ${T.bg4}`,background:'#111b21' }}>
          <div style={{ background:'#1a252f',padding:'8px 12px',display:'flex',alignItems:'center',gap:8 }}>
            <div style={{ width:26,height:26,borderRadius:'50%',background:'#00a884',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff' }}>S</div>
            <div><p style={{ fontSize:11,fontWeight:600,color:'#e9edef',margin:0 }}>Só Strass</p><p style={{ fontSize:9,color:'#8696a0',margin:0 }}>automático</p></div>
          </div>
          <div style={{ padding:'10px',background:'#0b141a',minHeight:80 }}>
            {preview ? (
              <div style={{ background:'#202c33',borderRadius:'10px 10px 10px 2px',padding:'9px 11px',maxWidth:'90%' }}>
                <p style={{ fontSize:11,color:'#e9edef',lineHeight:1.65,margin:0,whiteSpace:'pre-wrap',wordBreak:'break-word' }}
                  dangerouslySetInnerHTML={{__html:preview.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\*([^*\n]+)\*/g,'<strong>$1</strong>').replace(/---/g,'<hr style="border:none;border-top:0.5px solid #3a3f5c;margin:5px 0"/>').replace(/\n/g,'<br/>')}}/>
                <p style={{ fontSize:9,color:'#8696a0',textAlign:'right',margin:'4px 0 0' }}>agora ✓✓</p>
              </div>
            ) : (
              <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:60,opacity:.3 }}>
                <p style={{ fontSize:11,color:'#8696a0' }}>Escreva a mensagem...</p>
              </div>
            )}
          </div>
        </div>

        {/* Custo estimado */}
        {blocos.length > 0 && (
          <div style={{ marginTop:8,padding:'8px 10px',borderRadius:8,background:T.amberDim,border:`1px solid ${T.amberBor}` }}>
            <p style={{ fontSize:10,fontWeight:600,color:T.amber,margin:'0 0 2px' }}>Custo estimado por envio</p>
            <p style={{ fontSize:13,fontWeight:700,color:T.ink1,margin:0 }}>{fmtBRL(CUSTO_MSG_USD*USD_BRL)}</p>
            <p style={{ fontSize:9,color:T.ink3,margin:'2px 0 0' }}>Template marketing Meta · Brasil</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal criar campanha ──────────────────────────────────────────────────────
function ModalNovaCampanha({ api, onClose, onCriada }) {
  const [step, setStep] = useState(1)
  const [nome, setNome] = useState('')
  const [fonte, setFonte] = useState('bling')         // bling | google | csv | segmento
  const [filtros, setFiltros] = useState({ dias_sem_compra:'', tag:'', cidade:'' })
  const [blocos, setBlocos] = useState([{ tipo:'texto',conteudo:'',id:1 }])
  const [config, setConfig] = useState({ intervalo:20, lote:40, horario_ini:'08:00', horario_fim:'18:00', agendada:false, data:'', hora:'' })
  const [estimativa, setEstimativa] = useState({ total:0, tempo_h:0, custo_brl:0 })
  const [salvando, setSalvando] = useState(false)

  useEffect(()=>{
    const total = estimativa.total || 0
    const msgsMin = 60 / config.intervalo
    const tempoMin = total / msgsMin
    setEstimativa(p=>({ ...p, tempo_h: (tempoMin/60).toFixed(1), custo_brl: (total*CUSTO_MSG_USD*USD_BRL).toFixed(2) }))
  }, [config.intervalo, estimativa.total])

  const steps = ['Audiência','Mensagem','Configuração','Revisão']

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }} onClick={onClose}>
      <div style={{ width:'100%',maxWidth:780,background:T.bg1,border:`1px solid ${T.sep2}`,borderRadius:18,boxShadow:'0 32px 80px rgba(0,0,0,.7)',overflow:'hidden',maxHeight:'90vh',display:'flex',flexDirection:'column' }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'18px 24px',borderBottom:`1px solid ${T.sep}`,background:T.bg2,flexShrink:0 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div style={{ width:34,height:34,borderRadius:10,background:T.greenDim,border:`1px solid ${T.greenBor}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Zap size={16} style={{ color:T.green }}/>
              </div>
              <div>
                <h3 style={{ fontSize:15,fontWeight:700,color:T.ink1,margin:0 }}>Nova Campanha</h3>
                <p style={{ fontSize:11,color:T.ink3,margin:0 }}>Disparo manual em massa</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background:T.bg3,border:`1px solid ${T.sep2}`,borderRadius:8,padding:6,color:T.ink3,cursor:'pointer',display:'flex' }}><X size={15}/></button>
          </div>
          {/* Steps */}
          <div className="flex gap-0">
            {steps.map((s,i)=>{
              const done=i+1<step, active=i+1===step
              return (
                <div key={s} className="flex items-center" style={{ flex:1 }}>
                  <div className="flex items-center gap-2 cursor-pointer" onClick={()=>i+1<step&&setStep(i+1)}>
                    <div style={{ width:22,height:22,borderRadius:'50%',background:done?T.green:active?T.greenDim:T.bg3,border:`1.5px solid ${done||active?T.green:T.sep2}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      {done ? <CheckCircle size={12} style={{ color:T.bg0 }}/> : <span style={{ fontSize:10,fontWeight:700,color:active?T.green:T.ink4 }}>{i+1}</span>}
                    </div>
                    <span style={{ fontSize:11,fontWeight:active?600:400,color:active?T.ink1:T.ink4,whiteSpace:'nowrap' }}>{s}</span>
                  </div>
                  {i<steps.length-1 && <div style={{ flex:1,height:1,background:done?T.green:T.sep2,margin:'0 8px',minWidth:16 }}/>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Conteúdo por step */}
        <div style={{ flex:1,overflowY:'auto',padding:'20px 24px' }}>

          {/* Step 1: Audiência */}
          {step===1 && (
            <div className="flex flex-col gap-5">
              <div>
                <label style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:T.ink3,display:'block',marginBottom:6 }}>Nome da campanha *</label>
                <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Convite Molise — Clientes VIP"
                  style={{ width:'100%',padding:'9px 12px',background:T.bg3,border:`1px solid ${T.sep2}`,borderRadius:8,fontSize:13,color:T.ink1,outline:'none',boxSizing:'border-box' }}/>
              </div>

              <div>
                <label style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:T.ink3,display:'block',marginBottom:8 }}>Fonte de contatos</label>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
                  {[
                    { id:'bling', label:'Clientes Bling', sub:'Importa quem tem celular', icon:Package, cor:T.amber },
                    { id:'google', label:'Google Contacts', sub:'Agenda do Google Workspace', icon:Globe, cor:T.blue },
                    { id:'csv', label:'Upload CSV', sub:'Arquivo com telefone + nome', icon:Upload, cor:T.cyan },
                    { id:'segmento', label:'Segmento salvo', sub:'Filtros de clientes', icon:Filter, cor:T.purple },
                  ].map(({id,label,sub,icon:Ic,cor})=>(
                    <div key={id} onClick={()=>setFonte(id)} style={{ padding:'12px 14px',borderRadius:10,border:`1.5px solid ${fonte===id?cor:T.sep2}`,background:fonte===id?`${cor}08`:T.bg2,cursor:'pointer',transition:'all .1s' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Ic size={13} style={{ color:cor }}/>
                        <span style={{ fontSize:12,fontWeight:600,color:T.ink1 }}>{label}</span>
                      </div>
                      <p style={{ fontSize:10,color:T.ink3,margin:0 }}>{sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {fonte==='bling' && (
                <div style={{ background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:10,padding:'14px 16px' }}>
                  <p style={{ fontSize:11,fontWeight:600,color:T.ink2,marginBottom:10 }}>Filtros de segmentação</p>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
                    {[
                      { k:'dias_sem_compra', l:'Inativo há (dias)', ph:'ex: 90' },
                      { k:'tag', l:'Tag / Grupo Bling', ph:'ex: VIP' },
                      { k:'cidade', l:'Cidade', ph:'ex: Limeira' },
                    ].map(({k,l,ph})=>(
                      <div key={k}>
                        <label style={{ fontSize:10,color:T.ink3,display:'block',marginBottom:4 }}>{l}</label>
                        <input value={filtros[k]} onChange={e=>setFiltros(p=>({...p,[k]:e.target.value}))} placeholder={ph}
                          style={{ width:'100%',padding:'7px 10px',background:T.bg3,border:`1px solid ${T.sep2}`,borderRadius:7,fontSize:12,color:T.ink1,outline:'none',boxSizing:'border-box' }}/>
                      </div>
                    ))}
                  </div>
                  <button style={{ marginTop:12,display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,background:T.blueDim,border:`1px solid ${T.blueBor}`,color:T.blue,cursor:'pointer',fontSize:12,fontWeight:600 }}>
                    <RefreshCw size={12}/> Estimar audiência
                  </button>
                  {estimativa.total > 0 && (
                    <div className="flex gap-4 mt-3">
                      <span style={{ fontSize:13,fontWeight:700,color:T.green }}>{fmtN(estimativa.total)} contatos</span>
                      <span style={{ fontSize:12,color:T.ink3 }}>estimado com esses filtros</span>
                    </div>
                  )}
                </div>
              )}

              {fonte==='csv' && (
                <div style={{ border:`2px dashed ${T.sep2}`,borderRadius:10,padding:'24px',textAlign:'center' }}>
                  <Upload size={24} style={{ color:T.ink4,margin:'0 auto 8px' }}/>
                  <p style={{ fontSize:13,color:T.ink2,margin:'0 0 4px' }}>Arraste o CSV aqui ou clique para selecionar</p>
                  <p style={{ fontSize:11,color:T.ink4,margin:0 }}>Colunas: telefone, nome (opcional)</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Mensagem */}
          {step===2 && (
            <div>
              <div style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:8,background:T.greenDim,border:`1px solid ${T.greenBor}`,marginBottom:16 }}>
                <CheckCircle size={13} style={{ color:T.green }}/>
                <p style={{ fontSize:11,color:T.green,margin:0,fontWeight:500 }}>Mensagem inline — não precisa de aprovação Meta. Enviada dentro da janela de 24h ou se o cliente já interagiu.</p>
              </div>
              <EditorMensagem blocos={blocos} setBlocos={setBlocos}/>
            </div>
          )}

          {/* Step 3: Configuração */}
          {step===3 && (
            <div className="flex flex-col gap-5">

              {/* Bounce / Velocidade */}
              <div style={{ background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:10,padding:'16px 18px' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Timer size={14} style={{ color:T.cyan }}/>
                  <span style={{ fontSize:13,fontWeight:600,color:T.ink1 }}>Controle de velocidade (Bounce)</span>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
                  <div>
                    <label style={{ fontSize:10,color:T.ink3,display:'block',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em' }}>Intervalo entre mensagens</label>
                    <div className="flex gap-2 flex-wrap">
                      {[10,15,20,30,60].map(s=>(
                        <button key={s} onClick={()=>setConfig(p=>({...p,intervalo:s}))} style={{ padding:'5px 12px',borderRadius:7,fontSize:12,fontWeight:config.intervalo===s?700:400,background:config.intervalo===s?T.cyanDim:T.bg3,border:`1px solid ${config.intervalo===s?T.cyanBor:T.sep2}`,color:config.intervalo===s?T.cyan:T.ink3,cursor:'pointer' }}>
                          {s}s
                        </button>
                      ))}
                    </div>
                    <p style={{ fontSize:10,color:T.ink4,marginTop:5 }}>{(60/config.intervalo).toFixed(1)} msgs/min · {(3600/config.intervalo).toFixed(0)} msgs/hora</p>
                  </div>
                  <div>
                    <label style={{ fontSize:10,color:T.ink3,display:'block',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em' }}>Tamanho do lote</label>
                    <div className="flex gap-2 flex-wrap">
                      {[20,30,40,50,100].map(s=>(
                        <button key={s} onClick={()=>setConfig(p=>({...p,lote:s}))} style={{ padding:'5px 12px',borderRadius:7,fontSize:12,fontWeight:config.lote===s?700:400,background:config.lote===s?T.cyanDim:T.bg3,border:`1px solid ${config.lote===s?T.cyanBor:T.sep2}`,color:config.lote===s?T.cyan:T.ink3,cursor:'pointer' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <p style={{ fontSize:10,color:T.ink4,marginTop:5 }}>Pausa de 60s entre lotes</p>
                  </div>
                </div>
              </div>

              {/* Horário de envio */}
              <div style={{ background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:10,padding:'16px 18px' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={14} style={{ color:T.amber }}/>
                  <span style={{ fontSize:13,fontWeight:600,color:T.ink1 }}>Janela de envio</span>
                </div>
                <div className="flex gap-4 items-center">
                  <div>
                    <label style={{ fontSize:10,color:T.ink3,display:'block',marginBottom:4 }}>Início</label>
                    <input type="time" value={config.horario_ini} onChange={e=>setConfig(p=>({...p,horario_ini:e.target.value}))}
                      style={{ padding:'7px 10px',background:T.bg3,border:`1px solid ${T.sep2}`,borderRadius:7,fontSize:13,color:T.ink1,outline:'none' }}/>
                  </div>
                  <div style={{ color:T.ink4,fontSize:12,paddingTop:16 }}>até</div>
                  <div>
                    <label style={{ fontSize:10,color:T.ink3,display:'block',marginBottom:4 }}>Fim</label>
                    <input type="time" value={config.horario_fim} onChange={e=>setConfig(p=>({...p,horario_fim:e.target.value}))}
                      style={{ padding:'7px 10px',background:T.bg3,border:`1px solid ${T.sep2}`,borderRadius:7,fontSize:13,color:T.ink1,outline:'none' }}/>
                  </div>
                  <div style={{ paddingTop:16,color:T.ink3,fontSize:11 }}>
                    Apenas dias úteis
                  </div>
                </div>
                <p style={{ fontSize:10,color:T.ink4,marginTop:6 }}>Fora desse horário, os envios são automaticamente pausados e retomados no próximo dia.</p>
              </div>

              {/* Agendamento */}
              <div style={{ background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:10,padding:'16px 18px' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} style={{ color:T.purple }}/>
                    <span style={{ fontSize:13,fontWeight:600,color:T.ink1 }}>Agendamento</span>
                  </div>
                  <button onClick={()=>setConfig(p=>({...p,agendada:!p.agendada}))} style={{ border:'none',background:'transparent',cursor:'pointer' }}>
                    {config.agendada ? <ToggleRight size={22} style={{ color:T.purple }}/> : <ToggleLeft size={22} style={{ color:T.ink4 }}/>}
                  </button>
                </div>
                {config.agendada && (
                  <div className="flex gap-3">
                    <div>
                      <label style={{ fontSize:10,color:T.ink3,display:'block',marginBottom:4 }}>Data</label>
                      <input type="date" value={config.data} onChange={e=>setConfig(p=>({...p,data:e.target.value}))}
                        style={{ padding:'7px 10px',background:T.bg3,border:`1px solid ${T.sep2}`,borderRadius:7,fontSize:13,color:T.ink1,outline:'none' }}/>
                    </div>
                    <div>
                      <label style={{ fontSize:10,color:T.ink3,display:'block',marginBottom:4 }}>Hora</label>
                      <input type="time" value={config.hora} onChange={e=>setConfig(p=>({...p,hora:e.target.value}))}
                        style={{ padding:'7px 10px',background:T.bg3,border:`1px solid ${T.sep2}`,borderRadius:7,fontSize:13,color:T.ink1,outline:'none' }}/>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Revisão */}
          {step===4 && (
            <div className="flex flex-col gap-4">
              <div style={{ background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:12,padding:'16px 18px' }}>
                <p style={{ fontSize:12,fontWeight:700,color:T.ink3,marginBottom:12,textTransform:'uppercase',letterSpacing:'.06em' }}>Resumo da campanha</p>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                  {[
                    { l:'Nome', v:nome||'Sem nome' },
                    { l:'Fonte', v:fonte },
                    { l:'Contatos estimados', v:fmtN(estimativa.total||1200) },
                    { l:'Intervalo', v:`${config.intervalo}s entre msgs` },
                    { l:'Velocidade', v:`${(60/config.intervalo).toFixed(0)} msgs/min` },
                    { l:'Janela', v:`${config.horario_ini} – ${config.horario_fim}` },
                    { l:'Duração estimada', v:`~${estimativa.tempo_h||4.1}h` },
                    { l:'Custo estimado', v:fmtBRL(parseFloat(estimativa.custo_brl||94.56)) },
                  ].map(({l,v})=>(
                    <div key={l} style={{ padding:'8px 10px',background:T.bg3,borderRadius:7 }}>
                      <p style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:T.ink4,margin:'0 0 2px' }}>{l}</p>
                      <p style={{ fontSize:12,fontWeight:600,color:T.ink1,margin:0 }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alertas */}
              <div style={{ padding:'10px 14px',borderRadius:10,background:T.amberDim,border:`1px solid ${T.amberBor}` }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={13} style={{ color:T.amber,flexShrink:0,marginTop:1 }}/>
                  <div>
                    <p style={{ fontSize:11,fontWeight:600,color:T.amber,margin:'0 0 4px' }}>Atenção antes de disparar</p>
                    <ul style={{ fontSize:11,color:T.ink2,margin:0,paddingLeft:14,lineHeight:1.8 }}>
                      <li>Confirme que os contatos aceitaram receber comunicações</li>
                      <li>Opt-outs acima de 2% podem acionar revisão da Meta</li>
                      <li>A campanha pode ser pausada manualmente a qualquer momento</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4" style={{ borderTop:`1px solid ${T.sep}`,background:T.bg2,flexShrink:0 }}>
          <button onClick={()=>step>1?setStep(s=>s-1):onClose()} style={{ padding:'7px 16px',borderRadius:8,fontSize:12,fontWeight:600,background:T.bg3,border:`1px solid ${T.sep2}`,color:T.ink2,cursor:'pointer' }}>
            {step>1?'Voltar':'Cancelar'}
          </button>
          <div className="flex items-center gap-2">
            <span style={{ fontSize:11,color:T.ink4 }}>Passo {step} de {steps.length}</span>
            {step < 4 ? (
              <button onClick={()=>setStep(s=>s+1)} disabled={step===1&&!nome.trim()} style={{ padding:'7px 20px',borderRadius:8,fontSize:12,fontWeight:700,background:T.green,color:T.bg0,border:'none',cursor:'pointer',opacity:step===1&&!nome.trim()?0.4:1 }}>
                Próximo →
              </button>
            ) : (
              <button onClick={()=>{ setSalvando(true); setTimeout(()=>{ onCriada?.(); onClose(); setSalvando(false) },1200) }} disabled={salvando} style={{ padding:'7px 20px',borderRadius:8,fontSize:12,fontWeight:700,background:config.agendada?T.purple:T.green,color:T.bg0,border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6 }}>
                {salvando?<><RefreshCw size={12} style={{ animation:'spin 1s linear infinite' }}/> Criando...</>
                  :config.agendada?<><Calendar size={12}/> Agendar campanha</>
                  :<><Zap size={12}/> Criar e disparar</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function PageCampanhas({ api: apiProp }) {
  const api = apiProp || BASE
  const [campanhas, setCampanhas] = useState(CAMPANHAS_MOCK)
  const [risco, setRisco] = useState(RISCO_MOCK)
  const [selId, setSelId] = useState(1)
  const [modalNova, setModalNova] = useState(false)
  const [aba, setAba] = useState('monitor')  // monitor | historico | config
  const [busca, setBusca] = useState('')
  const [historicoFilter, setHistoricoFilter] = useState('todos')
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)

  const sel = campanhas.find(c=>c.id===selId)
  const rodando = campanhas.filter(c=>c.status==='rodando')

  // Simula progresso em tempo real para campanha rodando
  useEffect(()=>{
    if(!sel || sel.status!=='rodando') return
    timerRef.current = setInterval(()=>{
      setCampanhas(prev=>prev.map(c=>{
        if(c.id!==selId||c.status!=='rodando') return c
        const novoEnv = Math.min(c.enviados+Math.floor(Math.random()*3+1), c.total)
        const novoEnt = Math.floor(novoEnv*0.94)
        const novoLid = Math.floor(novoEnt*0.59)
        return { ...c, enviados:novoEnv, entregues:novoEnt, lidos:novoLid }
      }))
    }, 3000)
    return ()=>clearInterval(timerRef.current)
  }, [selId, sel?.status])

  const toggleCampanha = (id) => {
    setCampanhas(prev=>prev.map(c=>c.id!==id?c:{...c,status:c.status==='rodando'?'pausada':'rodando'}))
  }

  const progresso = sel ? (sel.enviados/Math.max(sel.total,1))*100 : 0
  const histFiltrado = HISTORICO_MOCK.filter(h=>historicoFilter==='todos'||h.status===historicoFilter)

  return (
    <div style={{ height:'100%',display:'flex',flexDirection:'column',overflow:'hidden',background:T.bg0,color:T.ink1,fontFamily:'"DM Sans", system-ui, sans-serif' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .live-dot{width:7px;height:7px;border-radius:50%;background:#00e676;animation:pulse 1.5s ease infinite}
        .row-camp:hover{background:rgba(255,255,255,.025)!important}
        .row-hist:hover{background:rgba(255,255,255,.02)!important}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:99px}
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ flexShrink:0,background:T.bg1,borderBottom:`1px solid ${T.sep2}`,padding:'16px 24px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ width:40,height:40,borderRadius:12,background:T.greenDim,border:`1px solid ${T.greenBor}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Send size={18} style={{ color:T.green }}/>
            </div>
            <div>
              <h1 style={{ fontSize:18,fontWeight:700,color:T.ink1,margin:0,letterSpacing:'-.02em',display:'flex',alignItems:'center',gap:8 }}>
                Central de Campanhas
                {rodando.length>0 && <span style={{ display:'flex',alignItems:'center',gap:5,fontSize:10,padding:'2px 8px',borderRadius:99,background:T.greenDim,border:`1px solid ${T.greenBor}`,color:T.green,fontWeight:600 }}>
                  <span className="live-dot"/>{rodando.length} ao vivo
                </span>}
              </h1>
              <p style={{ fontSize:11,color:T.ink4,margin:0 }}>Disparos manuais · 300k contatos · Proteção de número</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button style={{ padding:'7px 14px',borderRadius:9,fontSize:12,fontWeight:600,background:T.bg3,border:`1px solid ${T.sep2}`,color:T.ink2,cursor:'pointer',display:'flex',alignItems:'center',gap:5 }}>
              <Download size={13}/> Exportar
            </button>
            <button onClick={()=>setModalNova(true)} style={{ padding:'7px 16px',borderRadius:9,fontSize:12,fontWeight:700,background:T.green,color:T.bg0,border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6 }}>
              <Plus size={14}/> Nova campanha
            </button>
          </div>
        </div>
      </div>

      {/* ── CORPO PRINCIPAL ────────────────────────────────────────────────── */}
      <div style={{ flex:1,display:'grid',gridTemplateColumns:'300px 1fr',overflow:'hidden' }}>

        {/* ── SIDEBAR: Lista de campanhas ─────────────────────────────────── */}
        <div style={{ borderRight:`1px solid ${T.sep2}`,display:'flex',flexDirection:'column',overflow:'hidden',background:T.bg1 }}>
          <div style={{ padding:'10px 12px',borderBottom:`1px solid ${T.sep}`,flexShrink:0 }}>
            <div className="flex items-center gap-2 px-3 py-2" style={{ background:T.bg3,borderRadius:8,border:`1px solid ${T.sep}` }}>
              <Search size={12} style={{ color:T.ink4 }}/>
              <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar campanha..."
                style={{ flex:1,background:'transparent',border:'none',outline:'none',fontSize:12,color:T.ink1 }}/>
            </div>
          </div>

          <div style={{ flex:1,overflowY:'auto',padding:'8px' }}>
            {campanhas.filter(c=>!busca||c.nome.toLowerCase().includes(busca.toLowerCase())).map(c=>{
              const S = STATUS_CAMP[c.status]||STATUS_CAMP.rascunho
              const SIcon = S.icon
              const pct = c.total>0?(c.enviados/c.total)*100:0
              const isOn = c.id===selId
              return (
                <div key={c.id} className="row-camp" onClick={()=>setSelId(c.id)} style={{ padding:'11px 12px',borderRadius:10,marginBottom:4,border:`1px solid ${isOn?S.cor+'40':T.sep}`,background:isOn?`${S.cor}06`:T.bg2,cursor:'pointer',transition:'all .1s' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <SIcon size={11} style={{ color:S.cor,flexShrink:0 }}/>
                    <span style={{ fontSize:11,fontWeight:600,color:T.ink1,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{c.nome}</span>
                  </div>
                  {c.total>0 && (
                    <>
                      <div style={{ height:3,borderRadius:99,background:T.bg4,overflow:'hidden',marginBottom:5 }}>
                        <div style={{ height:'100%',width:`${pct}%`,background:S.cor,borderRadius:99,transition:'width .4s ease' }}/>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ fontSize:10,color:T.ink4 }}>{fmtN(c.enviados)} / {fmtN(c.total)}</span>
                        <span style={{ fontSize:10,fontWeight:600,color:S.cor }}>{pct.toFixed(0)}%</span>
                      </div>
                    </>
                  )}
                  {c.status==='rascunho' && <span style={{ fontSize:10,color:T.ink4 }}>Não iniciada</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── PAINEL DIREITO ──────────────────────────────────────────────── */}
        <div style={{ display:'flex',flexDirection:'column',overflow:'hidden' }}>
          {!sel ? (
            <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,color:T.ink4 }}>
              <Send size={28} style={{ opacity:.2 }}/>
              <p style={{ fontSize:13,color:T.ink3 }}>Selecione uma campanha</p>
            </div>
          ) : (
            <>
              {/* Header da campanha */}
              <div style={{ flexShrink:0,padding:'14px 20px',borderBottom:`1px solid ${T.sep}`,background:T.bg2 }}>
                <div className="flex items-center gap-3 mb-3">
                  <div style={{ flex:1,minWidth:0 }}>
                    <h2 style={{ fontSize:16,fontWeight:700,color:T.ink1,margin:'0 0 3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{sel.nome}</h2>
                    <div className="flex items-center gap-2">
                      <Bdg cor={STATUS_CAMP[sel.status].cor} dim={`${STATUS_CAMP[sel.status].cor}12`} bor={`${STATUS_CAMP[sel.status].cor}30`}>
                        {STATUS_CAMP[sel.status].label}
                      </Bdg>
                      {sel.inicio && <span style={{ fontSize:11,color:T.ink4 }}>Iniciada {fmtRel(sel.inicio)}</span>}
                      {sel.status==='rodando' && <span style={{ fontSize:11,color:T.green,display:'flex',alignItems:'center',gap:4 }}><span className="live-dot"/>{sel.velocidade} msgs/min</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {['rodando','pausada'].includes(sel.status) && (
                      <button onClick={()=>toggleCampanha(sel.id)} style={{ padding:'7px 14px',borderRadius:8,fontSize:12,fontWeight:700,background:sel.status==='rodando'?T.amberDim:T.greenDim,border:`1px solid ${sel.status==='rodando'?T.amberBor:T.greenBor}`,color:sel.status==='rodando'?T.amber:T.green,cursor:'pointer',display:'flex',alignItems:'center',gap:5 }}>
                        {sel.status==='rodando'?<><Pause size={12}/> Pausar</>:<><Play size={12}/> Retomar</>}
                      </button>
                    )}
                    {sel.status==='rodando' && (
                      <button onClick={()=>setCampanhas(p=>p.map(c=>c.id===sel.id?{...c,status:'cancelada'}:c))} style={{ padding:'7px 14px',borderRadius:8,fontSize:12,fontWeight:700,background:T.redDim,border:`1px solid ${T.redBor}`,color:T.red,cursor:'pointer',display:'flex',alignItems:'center',gap:5 }}>
                        <StopCircle size={12}/> Parar
                      </button>
                    )}
                    {sel.status==='rascunho' && (
                      <button onClick={()=>setCampanhas(p=>p.map(c=>c.id===sel.id?{...c,status:'rodando',total:1200,velocidade:52}:c))} style={{ padding:'7px 16px',borderRadius:8,fontSize:12,fontWeight:700,background:T.green,color:T.bg0,border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:5 }}>
                        <Play size={12}/> Iniciar
                      </button>
                    )}
                  </div>
                </div>

                {/* Barra de progresso principal */}
                {sel.total > 0 && (
                  <div>
                    <div style={{ height:6,borderRadius:99,background:T.bg3,overflow:'hidden',marginBottom:4 }}>
                      <div style={{ height:'100%',width:`${progresso}%`,background:`linear-gradient(90deg, ${T.green}, ${T.cyan})`,borderRadius:99,transition:'width .5s ease' }}/>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ fontSize:11,color:T.ink3 }}>{fmtN(sel.enviados)} enviados de {fmtN(sel.total)}</span>
                      <span style={{ fontSize:11,fontWeight:700,color:T.green }}>{progresso.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* KPIs */}
              <div style={{ flexShrink:0,padding:'14px 20px',borderBottom:`1px solid ${T.sep}` }}>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10 }}>
                  <KpiCard icon={Send}        label="Enviados"   value={fmtN(sel.enviados)}   cor={T.blue}   dim={T.blueDim}   bor={T.blueBor}   barra />
                  <KpiCard icon={CheckCircle} label="Entregues"  value={fmtN(sel.entregues)}  cor={T.green}  dim={T.greenDim}  bor={T.greenBor}  barra />
                  <KpiCard icon={Eye}         label="Lidos"      value={fmtN(sel.lidos)}      cor={T.cyan}   dim={T.cyanDim}   bor={T.cyanBor}   barra />
                  <KpiCard icon={XCircle}     label="Erros"      value={fmtN(sel.erros)}      cor={T.red}    dim={T.redDim}    bor={T.redBor}    barra />
                  <KpiCard icon={Bell}        label="Opt-outs"   value={fmtN(sel.opt_out)}    cor={T.amber}  dim={T.amberDim}  bor={T.amberBor}  barra />
                  <KpiCard icon={DollarSign}  label="Custo"      value={fmtBRL(sel.custo_total)} sub={`${fmtN(sel.total)} msgs`} cor={T.purple} dim={T.purpleDim} bor={T.purpleBor} barra />
                </div>

                {/* Métricas secundárias */}
                <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginTop:10 }}>
                  {[
                    { l:'Taxa entrega', v:fmtPct(sel.entregues,sel.enviados), ok:sel.entregues/Math.max(sel.enviados,1)>.9 },
                    { l:'Taxa abertura', v:fmtPct(sel.lidos,sel.entregues), ok:sel.lidos/Math.max(sel.entregues,1)>.4 },
                    { l:'Taxa erro', v:fmtPct(sel.erros,sel.enviados), ok:sel.erros/Math.max(sel.enviados,1)<.05 },
                    { l:'Taxa opt-out', v:fmtPct(sel.opt_out,sel.enviados), ok:sel.opt_out/Math.max(sel.enviados,1)<.02 },
                  ].map(({l,v,ok})=>(
                    <div key={l} style={{ background:T.bg3,borderRadius:8,padding:'8px 12px',border:`1px solid ${T.sep}` }}>
                      <p style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:T.ink4,margin:'0 0 2px' }}>{l}</p>
                      <p style={{ fontSize:15,fontWeight:700,color:ok?T.ink1:T.amber,margin:0 }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ flexShrink:0,display:'flex',borderBottom:`1px solid ${T.sep}`,background:T.bg2,padding:'0 20px' }}>
                {[
                  { id:'monitor', label:'Monitor em tempo real', icon:Activity },
                  { id:'historico', label:'Log de envios', icon:Hash },
                  { id:'risco', label:'Proteção de número', icon:Shield },
                ].map(({id,label,icon:Ic})=>(
                  <button key={id} onClick={()=>setAba(id)} style={{ padding:'10px 16px',fontSize:12,fontWeight:600,border:'none',background:'transparent',cursor:'pointer',color:aba===id?T.green:T.ink4,borderBottom:`2px solid ${aba===id?T.green:'transparent'}`,display:'flex',alignItems:'center',gap:5,transition:'color .1s',whiteSpace:'nowrap' }}>
                    <Ic size={12}/>{label}
                  </button>
                ))}
              </div>

              {/* Conteúdo das tabs */}
              <div style={{ flex:1,overflowY:'auto',padding:'16px 20px' }}>

                {/* ABA: Monitor */}
                {aba==='monitor' && (
                  <div className="flex flex-col gap-4">
                    {/* Gráfico envios por hora */}
                    <div style={{ background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:12,padding:'16px 18px' }}>
                      <div className="flex items-center justify-between mb-4">
                        <p style={{ fontSize:13,fontWeight:600,color:T.ink1,margin:0 }}>Envios por hora</p>
                        <Bdg cor={T.green} dim={T.greenDim} bor={T.greenBor}><span className="live-dot"/> ao vivo</Bdg>
                      </div>
                      <ResponsiveContainer width="100%" height={140}>
                        <AreaChart data={GRAFICO_MOCK} margin={{top:0,right:0,bottom:0,left:-20}}>
                          <defs>
                            <linearGradient id="gEnv" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={T.green} stopOpacity={0.15}/>
                              <stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="gLid" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={T.cyan} stopOpacity={0.15}/>
                              <stop offset="95%" stopColor={T.cyan} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="hora" tick={{ fontSize:9,fill:T.ink4 }} axisLine={false} tickLine={false} interval={3}/>
                          <YAxis tick={{ fontSize:9,fill:T.ink4 }} axisLine={false} tickLine={false}/>
                          <Tooltip contentStyle={{ background:T.bg3,border:`1px solid ${T.sep2}`,borderRadius:8,fontSize:11 }} labelStyle={{ color:T.ink2 }}/>
                          <Area type="monotone" dataKey="enviados" stroke={T.green} strokeWidth={1.5} fill="url(#gEnv)" name="Enviados"/>
                          <Area type="monotone" dataKey="lidos" stroke={T.cyan} strokeWidth={1.5} fill="url(#gLid)" name="Lidos"/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Stats em tempo real */}
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                      <div style={{ background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:12,padding:'14px 16px' }}>
                        <p style={{ fontSize:11,fontWeight:600,color:T.ink3,margin:'0 0 8px',textTransform:'uppercase',letterSpacing:'.07em' }}>Velocidade atual</p>
                        <p style={{ fontSize:32,fontWeight:800,color:T.green,margin:'0 0 4px',letterSpacing:'-.02em' }}>{sel.velocidade || 0}</p>
                        <p style={{ fontSize:11,color:T.ink4,margin:0 }}>msgs/min · {(sel.velocidade||0)*60} msgs/hora</p>
                        <div style={{ height:4,borderRadius:99,background:T.bg3,marginTop:10,overflow:'hidden' }}>
                          <div style={{ height:'100%',width:`${Math.min((sel.velocidade||0)/risco.recomendacao_max*100,100)}%`,background:sel.velocidade>risco.recomendacao_max?T.red:T.green,borderRadius:99 }}/>
                        </div>
                        <p style={{ fontSize:9,color:T.ink4,marginTop:4 }}>Limite recomendado: {risco.recomendacao_max}/min</p>
                      </div>

                      <div style={{ background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:12,padding:'14px 16px' }}>
                        <p style={{ fontSize:11,fontWeight:600,color:T.ink3,margin:'0 0 8px',textTransform:'uppercase',letterSpacing:'.07em' }}>Tempo restante estimado</p>
                        {sel.status==='rodando' && sel.total > sel.enviados ? (
                          <>
                            <p style={{ fontSize:32,fontWeight:800,color:T.blue,margin:'0 0 4px',letterSpacing:'-.02em' }}>
                              {Math.floor((sel.total-sel.enviados)/(sel.velocidade||52))}min
                            </p>
                            <p style={{ fontSize:11,color:T.ink4,margin:0 }}>{fmtN(sel.total-sel.enviados)} msgs restantes</p>
                          </>
                        ) : (
                          <p style={{ fontSize:24,fontWeight:700,color:T.ink4,margin:'8px 0' }}>—</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA: Log de envios */}
                {aba==='historico' && (
                  <div>
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {['todos','enviado','entregue','lido','erro'].map(f=>(
                        <button key={f} onClick={()=>setHistoricoFilter(f)} style={{ padding:'4px 12px',borderRadius:6,fontSize:11,fontWeight:historicoFilter===f?700:400,background:historicoFilter===f?T.bg3:T.bg2,border:`1px solid ${historicoFilter===f?T.sep2:T.sep}`,color:historicoFilter===f?T.ink1:T.ink4,cursor:'pointer' }}>
                          {f.charAt(0).toUpperCase()+f.slice(1)}
                        </button>
                      ))}
                      <div style={{ marginLeft:'auto',fontSize:11,color:T.ink4,display:'flex',alignItems:'center' }}>
                        {histFiltrado.length} registros
                      </div>
                    </div>

                    <div style={{ background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:12,overflow:'hidden' }}>
                      <div style={{ display:'grid',gridTemplateColumns:'1.5fr 1.2fr 0.8fr 0.7fr',padding:'8px 14px',borderBottom:`1px solid ${T.sep}`,background:T.bg3,fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:T.ink4 }}>
                        {['Contato','Telefone','Status','Enviado'].map(h=><span key={h}>{h}</span>)}
                      </div>
                      {histFiltrado.map(h=>{
                        const stCol = h.status==='lido'?T.cyan:h.status==='entregue'?T.green:h.status==='enviado'?T.blue:T.red
                        const stDim = h.status==='lido'?T.cyanDim:h.status==='entregue'?T.greenDim:h.status==='enviado'?T.blueDim:T.redDim
                        const stBor = h.status==='lido'?T.cyanBor:h.status==='entregue'?T.greenBor:h.status==='enviado'?T.blueBor:T.redBor
                        return (
                          <div key={h.id} className="row-hist" style={{ display:'grid',gridTemplateColumns:'1.5fr 1.2fr 0.8fr 0.7fr',padding:'9px 14px',borderBottom:`1px solid ${T.sep}`,transition:'background .1s' }}>
                            <span style={{ fontSize:12,color:T.ink1,fontWeight:500 }}>{h.nome}</span>
                            <span style={{ fontSize:11,color:T.ink3,fontFamily:'monospace' }}>{h.telefone.replace(/^55/,'').replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3')}</span>
                            <Bdg cor={stCol} dim={stDim} bor={stBor}>{h.status}</Bdg>
                            <span style={{ fontSize:11,color:T.ink4 }}>{fmtRel(h.enviado_em)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ABA: Proteção de número */}
                {aba==='risco' && (
                  <div className="flex flex-col gap-4">
                    <MonitorRisco risco={risco}/>

                    {/* Configurações de proteção */}
                    <div style={{ background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:12,padding:'16px 18px' }}>
                      <div className="flex items-center gap-2 mb-4">
                        <Settings size={14} style={{ color:T.cyan }}/>
                        <span style={{ fontSize:13,fontWeight:600,color:T.ink1 }}>Regras de proteção automática</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {[
                          { l:'Pausar se taxa de erro > 5%', sub:'Pausa automática ao detectar rejeições em massa', on:true, cor:T.red },
                          { l:'Pausar se opt-out > 2%', sub:'Protege reputação antes de acionar revisão da Meta', on:true, cor:T.amber },
                          { l:'Parar entre 20h e 8h', sub:'Não envia fora do horário comercial', on:true, cor:T.blue },
                          { l:'Alerta se velocidade > 80/min', sub:'Notifica o operador por e-mail', on:false, cor:T.purple },
                          { l:'Retentar erros temporários', sub:'TEMPORARILY_UNAVAILABLE: tenta novamente em 30min', on:true, cor:T.cyan },
                        ].map(({l,sub,on,cor})=>(
                          <div key={l} className="flex items-center gap-3 py-2" style={{ borderBottom:`1px solid ${T.sep}` }}>
                            <div style={{ flex:1 }}>
                              <p style={{ fontSize:12,fontWeight:500,color:T.ink1,margin:'0 0 1px' }}>{l}</p>
                              <p style={{ fontSize:10,color:T.ink4,margin:0 }}>{sub}</p>
                            </div>
                            {on ? <ToggleRight size={20} style={{ color:cor,flexShrink:0 }}/> : <ToggleLeft size={20} style={{ color:T.ink4,flexShrink:0 }}/>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Histórico de bloqueios */}
                    <div style={{ background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:12,padding:'16px 18px' }}>
                      <p style={{ fontSize:12,fontWeight:600,color:T.ink3,margin:'0 0 10px',textTransform:'uppercase',letterSpacing:'.06em' }}>Histórico de qualidade (30 dias)</p>
                      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8 }}>
                        {[
                          { l:'Bloqueios', v:'0', cor:T.green, icon:Unlock },
                          { l:'Avisos Meta', v:'1', cor:T.amber, icon:AlertTriangle },
                          { l:'Campanhas ok', v:'4', cor:T.blue, icon:CheckCircle },
                        ].map(({l,v,cor,icon:Ic})=>(
                          <div key={l} style={{ background:T.bg3,borderRadius:8,padding:'10px 12px',border:`1px solid ${T.sep}` }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Ic size={11} style={{ color:cor }}/>
                              <span style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:T.ink4 }}>{l}</span>
                            </div>
                            <p style={{ fontSize:20,fontWeight:800,color:cor,margin:0 }}>{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </>
          )}
        </div>
      </div>

      {modalNova && (
        <ModalNovaCampanha
          api={api}
          onClose={()=>setModalNova(false)}
          onCriada={()=>{
            setCampanhas(p=>[{
              id:Date.now(), nome:'Nova campanha', status:'rascunho',
              total:0,enviados:0,entregues:0,lidos:0,erros:0,opt_out:0,
              inicio:null,intervalo_seg:20,lote:40,template:null,custo_total:0,velocidade:0
            },...p])
            setModalNova(false)
          }}
        />
      )}
    </div>
  )
}
