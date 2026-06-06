/**
 * PageCentralConfig v2 — NIVELMAX
 * Design cirúrgico · T system · Glow premium · Live preview · Calendar
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Settings2, Zap, Truck, Clock, ShieldOff, Download, History,
  LayoutDashboard, Lock, Save, RefreshCw, Check, X, Plus,
  ChevronRight, ChevronDown, Activity, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Minus, Info, Calendar, Moon, Sun,
  FileDown, Bell, Shield, Package, ShoppingBag, CreditCard,
  Brain, Star, Radio, AlertCircle, XCircle, FileText,
  Users, MessageSquare, ToggleLeft, Search,
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer,
  Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const API = import.meta.env.VITE_API_URL || ''

// ── T system ──────────────────────────────────────────────────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#7b81a0', ink4:'#3a3f5c',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)', greenBor:'rgba(0,230,118,.28)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.09)', amberBor:'rgba(255,179,0,.3)',
  red:'#ff4757',  redDim:'rgba(255,71,87,.09)',   redBor:'rgba(255,71,87,.3)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.1)',purpleBor:'rgba(167,139,250,.3)',
  cyan:'#06b6d4', cyanDim:'rgba(6,182,212,.09)',   cyanBor:'rgba(6,182,212,.28)',
  blue:'#4f8ef7', blueDim:'rgba(79,142,247,.09)',  blueBor:'rgba(79,142,247,.28)',
  sep:'rgba(255,255,255,.05)', sep2:'rgba(255,255,255,.09)',
  gray:'rgba(255,255,255,.04)',
}

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const ALWAYS_ON = new Set(['pedido_criado','pagamento_aprovado','pagamento_pendente','cancelamento','boas_vindas'])

const GATILHOS_DEF = [
  { id:'pedido_criado',      label:'Pedido Criado',        grupo:'Compra & Pagamento', cor:'#00d4aa', icon:ShoppingBag  },
  { id:'pagamento_aprovado', label:'Pagamento Aprovado',   grupo:'Compra & Pagamento', cor:'#4a9fff', icon:CreditCard   },
  { id:'pagamento_pendente', label:'Pagamento Pendente',   grupo:'Compra & Pagamento', cor:'#f59e0b', icon:Clock        },
  { id:'pix_pendente',       label:'PIX Pendente',         grupo:'Compra & Pagamento', cor:'#06b6d4', icon:CreditCard   },
  { id:'em_separacao',       label:'Em Separação',         grupo:'Preparação & Nota',  cor:'#8b5cf6', icon:Package      },
  { id:'nfe_emitida',        label:'NF-e Emitida',         grupo:'Preparação & Nota',  cor:'#06b6d4', icon:FileText     },
  { id:'pedido_enviado',     label:'Pedido Enviado',       grupo:'Envio & Rastreio',   cor:'#a78bfa', icon:Truck        },
  { id:'pedido_coletado',    label:'Pedido Coletado',      grupo:'Envio & Rastreio',   cor:'#06b6d4', icon:Package      },
  { id:'rastreio_em_transito',label:'Em Trânsito',         grupo:'Envio & Rastreio',   cor:'#4a9fff', icon:Radio        },
  { id:'saiu_entrega',       label:'Saiu para Entrega',    grupo:'Envio & Rastreio',   cor:'#f59e0b', icon:Truck        },
  { id:'tentativa_entrega',  label:'Tentativa de Entrega', grupo:'Envio & Rastreio',   cor:'#f59e0b', icon:AlertTriangle},
  { id:'pedido_entregue',    label:'Pedido Entregue',      grupo:'Envio & Rastreio',   cor:'#22c55e', icon:Package      },
  { id:'nao_entregue',       label:'Não Entregue',         grupo:'Envio & Rastreio',   cor:'#ef4444', icon:AlertCircle  },
  { id:'cancelamento',       label:'Pedido Cancelado',     grupo:'Pós-venda',          cor:'#6b7280', icon:XCircle      },
  { id:'avaliar_pedido',     label:'Avaliação Pós-venda',  grupo:'Pós-venda',          cor:'#f87171', icon:Star         },
  { id:'estorno_realizado',  label:'Estorno Realizado',    grupo:'Pós-venda',          cor:'#f97316', icon:RefreshCw    },
  { id:'reengajamento',      label:'Reengajamento',        grupo:'Inteligência',       cor:'#7c6af7', icon:Brain        },
]

const CANAL_META = {
  loja:         { cor:'#1D9E75', lbl:'Loja Própria',  mktp:false },
  nuvemshop:    { cor:'#4f46e5', lbl:'Nuvemshop',     mktp:false },
  mercadolivre: { cor:'#f5a623', lbl:'Mercado Livre', mktp:true  },
  shopee:       { cor:'#ee4d2d', lbl:'Shopee',        mktp:true  },
  shein:        { cor:'#a0a0a0', lbl:'Shein',         mktp:true  },
  tiktokshop:   { cor:'#ff0050', lbl:'TikTok Shop',   mktp:true  },
}

// ── Utilitários ────────────────────────────────────────────────────────────────
const tempoRel = (iso) => {
  if (!iso) return null
  const m = Math.floor((Date.now()-new Date(iso))/60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  if (m < 1440) return `${Math.floor(m/60)}h`
  return `${Math.floor(m/1440)}d`
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES PREMIUM
// ─────────────────────────────────────────────────────────────────────────────

// Toggle premium com glow colorido
function PremiumToggle({ value, onChange, cor=T.green, size='md', label, disabled }) {
  const w = size==='sm' ? 36 : 46
  const h = size==='sm' ? 20 : 26
  const th= size==='sm' ? 14 : 20
  const [hov, setHov] = useState(false)
  return (
    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
      <button onClick={()=>!disabled&&onChange(!value)}
        onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        disabled={disabled}
        style={{
          position:'relative', width:w, height:h, borderRadius:99,
          border:'none', cursor:disabled?'not-allowed':'pointer',
          flexShrink:0,
          background: value
            ? `linear-gradient(90deg,${cor},${cor}cc)`
            : 'rgba(255,255,255,.1)',
          boxShadow: value
            ? `0 0 ${hov?20:14}px ${cor}${hov?'90':'50'}, inset 0 1px 0 rgba(255,255,255,.2)`
            : hov ? '0 0 8px rgba(255,255,255,.1)' : undefined,
          transition:'all .25s cubic-bezier(.4,0,.2,1)',
          opacity: disabled?.5:1,
        }}>
        <span style={{
          position:'absolute', top:(h-th)/2, height:th, width:th,
          borderRadius:'50%', background:'#fff',
          left: value ? w-th-(h-th)/2 : (h-th)/2,
          transition:'left .22s cubic-bezier(.4,0,.2,1)',
          boxShadow:'0 2px 8px rgba(0,0,0,.35), 0 1px 2px rgba(0,0,0,.2)',
        }}/>
      </button>
      {label && (
        <span style={{ fontSize:12,fontWeight:600,color:value?cor:T.ink4,transition:'color .2s' }}>
          {label}
        </span>
      )}
    </div>
  )
}

// Card premium com glow colorido
function GlowCard({ children, cor, style={}, onClick, accentLine=true }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick}
      onMouseEnter={()=>onClick&&setHov(true)}
      onMouseLeave={()=>onClick&&setHov(false)}
      style={{
        background:`linear-gradient(135deg,${T.bg2} 0%,${T.bg3} 100%)`,
        border:`1px solid ${hov&&cor?cor+'35':cor?cor+'20':T.sep2}`,
        borderRadius:16,
        overflow:'hidden',
        boxShadow: hov&&cor
          ? `0 16px 48px rgba(0,0,0,.4),0 0 0 1px ${cor}12 inset,0 -2px 0 ${cor}30 inset`
          : `0 8px 28px rgba(0,0,0,.25),0 1px 0 rgba(255,255,255,.04) inset`,
        cursor:onClick?'pointer':'default',
        transition:'all .2s cubic-bezier(.4,0,.2,1)',
        transform:hov&&onClick?'translateY(-1px)':'translateY(0)',
        position:'relative',
        ...style,
      }}>
      {/* Top accent */}
      {accentLine && cor && (
        <div style={{ height:2.5,background:`linear-gradient(90deg,${cor},${cor}60,transparent)`,
          boxShadow:`0 0 12px ${cor}60` }}/>
      )}
      {children}
    </div>
  )
}

// Chip de status/badge
function StatusChip({ label, cor, icon:Ic, pulse, size='sm' }) {
  const fs = size==='sm' ? 9.5 : 11
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:4,
      padding:size==='sm'?'2px 8px':'4px 10px',borderRadius:99,
      background:`${cor}15`,color:cor,border:`1px solid ${cor}35`,
      fontSize:fs,fontWeight:700,flexShrink:0,letterSpacing:'.03em' }}>
      {pulse && (
        <span style={{ width:5,height:5,borderRadius:'50%',background:cor,flexShrink:0,
          boxShadow:`0 0 6px ${cor}`,animation:'cfg-pulse 2s ease infinite' }}/>
      )}
      {Ic && <Ic size={9} style={{ flexShrink:0 }}/>}
      {label}
    </span>
  )
}

// Input premium
function PInput({ value, onChange, placeholder, type='text', min, max, rows, mono }) {
  const [focused, setFocused] = useState(false)
  const base = {
    width:'100%', background:T.bg1,
    border:`1px solid ${focused?T.purple+'60':T.sep2}`,
    borderRadius:10, color:T.ink1,
    fontSize:13, outline:'none', fontFamily:mono?'monospace':'inherit',
    transition:'all .18s',
    boxShadow:focused?`0 0 0 3px ${T.purple}12,0 0 20px ${T.purple}10`:undefined,
  }
  const props = {
    value, onChange,
    placeholder,
    onFocus:()=>setFocused(true),
    onBlur:()=>setFocused(false),
  }
  if (rows) return <textarea rows={rows} {...props}
    style={{ ...base, padding:'10px 13px', resize:'vertical', minHeight:80, lineHeight:1.65 }}/>
  return <input type={type} {...props} min={min} max={max}
    style={{ ...base, padding:'9px 13px' }}/>
}

// ─────────────────────────────────────────────────────────────────────────────
// CALENDÁRIO DE SCHEDULE — 7×24 heatmap visual
// ─────────────────────────────────────────────────────────────────────────────
function ScheduleCalendar({ schedule }) {
  const { enabled=false, start_h=8, end_h=21, days=[1,2,3,4,5] } = schedule || {}
  if (!enabled) return (
    <div style={{ padding:'14px',borderRadius:10,background:T.bg4,
      border:`1px solid ${T.sep}`,textAlign:'center',
      fontSize:11.5,color:T.ink4 }}>
      Sem janela configurada — disparo a qualquer hora
    </div>
  )

  const HOURS = Array.from({length:24},(_,i)=>i)
  const cellW = 24, cellH = 11

  return (
    <div>
      <div style={{ fontSize:10,color:T.ink4,marginBottom:8,
        display:'flex',alignItems:'center',gap:10 }}>
        <span style={{ display:'flex',alignItems:'center',gap:4 }}>
          <span style={{ width:10,height:10,borderRadius:3,background:T.green,
            boxShadow:`0 0 6px ${T.green}60`,display:'inline-block'}}/>
          Ativo
        </span>
        <span style={{ display:'flex',alignItems:'center',gap:4 }}>
          <span style={{ width:10,height:10,borderRadius:3,background:T.bg4,
            border:`1px solid ${T.sep}`,display:'inline-block'}}/>
          Bloqueado
        </span>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:`28px repeat(7,${cellW}px)`,
        gap:2,alignItems:'center' }}>
        {/* Header dias */}
        <div/>
        {DIAS.map((d,i)=>(
          <div key={d} style={{ fontSize:8.5,fontWeight:700,textAlign:'center',
            color:days.includes(i)?T.amber:T.ink4,
            textTransform:'uppercase',letterSpacing:'.06em' }}>{d}</div>
        ))}
        {/* Horas */}
        {HOURS.map(h=>(
          <>
            <div key={`h${h}`} style={{ fontSize:8,color:T.ink4,textAlign:'right',
              paddingRight:4,lineHeight:1,
              visibility:h%3===0?'visible':'hidden' }}>
              {h}h
            </div>
            {DIAS.map((_,di)=>{
              const isDay = days.includes(di)
              const isHour = h >= start_h && h < end_h
              const ativo = isDay && isHour
              return (
                <div key={`${h}-${di}`} style={{
                  width:cellW, height:cellH, borderRadius:3,
                  background: ativo
                    ? `linear-gradient(135deg,${T.green},${T.green}80)`
                    : T.bg4,
                  border:`1px solid ${ativo?T.green+'40':T.sep}`,
                  boxShadow: ativo ? `0 0 4px ${T.green}30` : undefined,
                  transition:'all .15s',
                }}/>
              )
            })}
          </>
        ))}
      </div>
      <div style={{ marginTop:10,padding:'8px 12px',borderRadius:8,
        background:T.amberDim,border:`1px solid ${T.amberBor}`,
        fontSize:11,color:T.amber,fontWeight:600 }}>
        ⏰ {days.filter(d=>d>0&&d<7).length} dias úteis · {start_h}h–{end_h}h
        · ~{(end_h-start_h)*days.length} h/semana ativas
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HOUR + DAY PICKER PREMIUM
// ─────────────────────────────────────────────────────────────────────────────
function HourDayPicker({ schedule, onChange }) {
  const { enabled=false, start_h=8, end_h=21, days=[1,2,3,4,5] } = schedule || {}
  const upd = (patch) => onChange({ enabled, start_h, end_h, days, ...patch })

  const HourBtn = ({ h, field, val }) => (
    <button onClick={()=>upd({[field]:h})}
      style={{ minWidth:34,height:28,borderRadius:7,border:'none',cursor:'pointer',
        fontSize:10.5,fontWeight:700,transition:'all .15s',
        background:val===h?T.amber:T.bg4,
        color:val===h?'#000':T.ink4,
        boxShadow:val===h?`0 0 10px ${T.amber}50`:undefined }}>
      {h}h
    </button>
  )

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
      {/* Toggle habilitado */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'10px 14px',borderRadius:10,
        background:enabled?T.amberDim:T.gray,
        border:`1px solid ${enabled?T.amberBor:T.sep}`,
        transition:'all .2s' }}>
        <div>
          <div style={{ fontSize:12.5,fontWeight:700,color:T.ink1 }}>Janela de horário</div>
          <div style={{ fontSize:10.5,color:T.ink4,marginTop:2 }}>
            {enabled?'Dispara apenas no período definido':'Dispara a qualquer hora do dia'}
          </div>
        </div>
        <PremiumToggle value={enabled} onChange={v=>upd({enabled:v})} cor={T.amber}/>
      </div>

      {enabled && (<>
        {/* Horas */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          {[
            { label:'Início', field:'start_h', val:start_h, range:[5,6,7,8,9,10,11,12] },
            { label:'Fim',    field:'end_h',   val:end_h,   range:[18,19,20,21,22,23,24] },
          ].map(f=>(
            <div key={f.field}>
              <div style={{ fontSize:9.5,fontWeight:700,color:T.ink4,textTransform:'uppercase',
                letterSpacing:'.09em',marginBottom:7 }}>{f.label}</div>
              <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
                {f.range.map(h=><HourBtn key={h} h={h} field={f.field} val={f.val}/>)}
              </div>
            </div>
          ))}
        </div>

        {/* Dias */}
        <div>
          <div style={{ fontSize:9.5,fontWeight:700,color:T.ink4,textTransform:'uppercase',
            letterSpacing:'.09em',marginBottom:7 }}>Dias da semana</div>
          <div style={{ display:'flex',gap:5 }}>
            {DIAS.map((d,i)=>{
              const ativo = days.includes(i)
              return (
                <button key={i} onClick={()=>upd({
                  days:ativo?days.filter(x=>x!==i):[...days,i].sort()
                })} style={{ width:38,height:34,borderRadius:9,border:'none',cursor:'pointer',
                  fontSize:10.5,fontWeight:700,transition:'all .16s',
                  background:ativo?T.amber:T.bg4,
                  color:ativo?'#000':T.ink4,
                  boxShadow:ativo?`0 0 12px ${T.amber}50`:undefined }}>
                  {d}
                </button>
              )
            })}
          </div>
        </div>
      </>)}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD DE GATILHO PREMIUM
// ─────────────────────────────────────────────────────────────────────────────
function GatilhoCard({ g, schedule, indicador, onSave, loading }) {
  const [open,    setOpen]    = useState(false)
  const [local,   setLocal]   = useState(schedule || {})
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const isLocked = ALWAYS_ON.has(g.id)
  const Ic = g.icon || Zap
  const temJanela = local.enabled && !isLocked
  const env7 = indicador?.enviados || 0
  const tot7 = indicador?.total || 0
  const taxa = tot7 > 0 ? Math.round(env7/tot7*100) : null

  const handleSave = async () => {
    setSaving(true)
    await onSave(g.id, local)
    setSaved(true); setTimeout(()=>setSaved(false),2000)
    setSaving(false)
  }

  return (
    <div style={{
      borderRadius:14,overflow:'hidden',
      background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
      border:`1.5px solid ${open?g.cor+'45':isLocked?T.sep:temJanela?g.cor+'25':T.sep2}`,
      boxShadow:open?`0 12px 40px rgba(0,0,0,.35),0 0 0 1px ${g.cor}10 inset`
        :`0 4px 16px rgba(0,0,0,.2)`,
      transition:'all .22s cubic-bezier(.4,0,.2,1)',
    }}>
      {/* Linha colorida topo */}
      <div style={{ height:2,
        background:isLocked?T.sep:temJanela
          ?`linear-gradient(90deg,${g.cor},${g.cor}60,transparent)`
          :'transparent',
        boxShadow:temJanela?`0 0 10px ${g.cor}50`:undefined,
        transition:'all .3s' }}/>

      {/* Header clicável */}
      <div onClick={()=>!isLocked&&setOpen(v=>!v)}
        style={{ display:'flex',alignItems:'center',gap:12,padding:'13px 16px',
          cursor:isLocked?'default':'pointer',userSelect:'none' }}>

        {/* Ícone */}
        <div style={{ width:36,height:36,borderRadius:11,flexShrink:0,
          background:`linear-gradient(135deg,${g.cor}30,${g.cor}12)`,
          border:`1.5px solid ${g.cor}40`,
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:open?`0 4px 16px ${g.cor}30`:undefined,
          transition:'all .2s' }}>
          <Ic size={16} style={{ color:g.cor }}/>
        </div>

        {/* Info */}
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:4 }}>
            <span style={{ fontSize:13.5,fontWeight:700,color:T.ink1,letterSpacing:'-.02em' }}>
              {g.label}
            </span>
            {isLocked && (
              <StatusChip label="SEMPRE ATIVO" cor={T.ink3} icon={Lock}/>
            )}
            {temJanela && (
              <StatusChip label={`${local.start_h}h–${local.end_h}h`} cor={g.cor}/>
            )}
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            {/* Sparks de uso */}
            {taxa !== null && (
              <span style={{ fontSize:10,color:taxa>=80?T.green:taxa>=50?T.amber:T.red,
                fontWeight:700,display:'flex',alignItems:'center',gap:3 }}>
                {taxa>=80?<TrendingUp size={9}/>:taxa<50?<TrendingDown size={9}/>:<Minus size={9}/>}
                {taxa}% taxa 7d
              </span>
            )}
            {env7 > 0 && (
              <span style={{ fontSize:10,color:T.ink4 }}>
                {env7} enviados
              </span>
            )}
            {isLocked && (
              <span style={{ fontSize:10.5,color:T.ink4 }}>
                Disparo imediato obrigatório
              </span>
            )}
          </div>
        </div>

        {/* Estado + chevron */}
        {!isLocked && (
          <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
            <PremiumToggle value={local.enabled||false}
              onChange={v=>setLocal(s=>({...s,enabled:v}))}
              cor={g.cor} size="sm"/>
            <div style={{ color:T.ink4,transition:'transform .2s',
              transform:open?'rotate(90deg)':'rotate(0)' }}>
              <ChevronRight size={14}/>
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo expandido */}
      {open && !isLocked && (
        <div style={{ borderTop:`1px solid ${g.cor}20`,
          background:`linear-gradient(135deg,${g.cor}05,transparent)` }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:0 }}>

            {/* Esquerda: picker */}
            <div style={{ padding:'16px',borderRight:`1px solid ${g.cor}15` }}>
              <div style={{ fontSize:11,fontWeight:700,color:T.ink3,
                textTransform:'uppercase',letterSpacing:'.08em',marginBottom:12 }}>
                Configurar janela
              </div>
              <HourDayPicker schedule={local} onChange={setLocal}/>
            </div>

            {/* Direita: preview do calendário */}
            <div style={{ padding:'16px' }}>
              <div style={{ fontSize:11,fontWeight:700,color:T.ink3,
                textTransform:'uppercase',letterSpacing:'.08em',marginBottom:12 }}>
                Preview semanal
              </div>
              <ScheduleCalendar schedule={local}/>

              {/* Impacto estimado */}
              {local.enabled && indicador && (
                <div style={{ marginTop:10,padding:'8px 12px',borderRadius:9,
                  background:T.redDim,border:`1px solid ${T.redBor}`,
                  fontSize:10.5,color:T.red,fontWeight:600,lineHeight:1.55 }}>
                  ⚠ Com esta janela, {Math.round(tot7*(1-(local.days?.length||5)/7*
                    (local.end_h-local.start_h)/24))} msgs/sem seriam bloqueadas
                </div>
              )}
            </div>
          </div>

          {/* Botão salvar */}
          <div style={{ padding:'12px 16px',borderTop:`1px solid ${g.cor}15`,
            display:'flex',alignItems:'center',justifyContent:'flex-end',gap:10 }}>
            <button onClick={()=>setOpen(false)}
              style={{ padding:'7px 14px',borderRadius:9,border:`1px solid ${T.sep2}`,
                background:'transparent',color:T.ink4,cursor:'pointer',fontSize:12 }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ display:'flex',alignItems:'center',gap:7,
                padding:'8px 18px',borderRadius:9,border:'none',cursor:'pointer',
                fontSize:12.5,fontWeight:700,
                background:`linear-gradient(135deg,${g.cor},${g.cor}cc)`,
                color:'#000',
                boxShadow:`0 4px 16px ${g.cor}35`,
                opacity:saving?.6:1 }}>
              {saved ? <><Check size={13}/>Salvo!</> :
               saving ? <><RefreshCw size={13} style={{ animation:'cfg-spin 1s linear infinite' }}/>Salvando...</> :
               <><Save size={13}/>Salvar horário</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÕES
// ─────────────────────────────────────────────────────────────────────────────

function SecaoVisaoGeral({ api, onGoTo }) {
  const [monitor, setMonitor] = useState(null)
  const [spark,   setSpark]   = useState({ sess:[], msgs:[] })

  useEffect(()=>{
    fetch(`${api}/api/dashboard/monitoramento`).then(r=>r.json())
      .then(d=>{ if(d&&!d.erro) setMonitor(d) }).catch(()=>{})
    fetch(`${api}/api/dashboard/live-activity`).then(r=>r.json())
      .then(d=>{ if(d) setSpark({ sess:[], msgs:[] }) }).catch(()=>{})
  },[api])

  const STATUS = [
    { id:'gatilhos',  label:'Gatilhos & Horários', icon:Zap,        cor:T.amber,  status:'Configurar schedules'  },
    { id:'rastreio',  label:'Rastreio por Canal',   icon:Truck,      cor:T.green,  status:'Canais ativos'         },
    { id:'sla',       label:'Atendimento & SLA',    icon:Clock,      cor:T.cyan,   status:'Horário + metas'       },
    { id:'blacklist', label:'Blacklist & Opt-out',  icon:ShieldOff,  cor:T.red,    status:'Números bloqueados'    },
    { id:'export',    label:'Exportação',             icon:Download,   cor:T.blue,   status:'CSV / JSON'            },
    { id:'auditoria', label:'Auditoria',              icon:History,    cor:T.ink3,   status:'Log de mudanças'       },
  ]

  const health = monitor?.health
  const hScore = health?.score
  const hCor   = hScore==null?T.ink4:hScore>=85?T.green:hScore>=60?T.amber:T.red

  return (
    <div>
      {/* Hero health */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:24 }}>
        {/* Health Score */}
        <GlowCard cor={hCor} style={{ gridColumn:'1' }}>
          <div style={{ padding:'20px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
              <Activity size={14} style={{ color:hCor }}/>
              <span style={{ fontSize:11,fontWeight:700,color:T.ink3,
                textTransform:'uppercase',letterSpacing:'.08em' }}>Health Score</span>
            </div>
            <div style={{ display:'flex',alignItems:'flex-end',gap:8 }}>
              <div style={{ fontSize:52,fontWeight:900,color:hCor,letterSpacing:'-.06em',
                lineHeight:1,textShadow:`0 0 40px ${hCor}50` }}>
                {hScore??'—'}
              </div>
              {hScore!=null&&<span style={{ fontSize:18,color:hCor,marginBottom:4 }}>/100</span>}
            </div>
            <div style={{ fontSize:12,color:hCor,fontWeight:600,marginTop:6 }}>
              {hScore==null?'Sem dados':hScore>=85?'Excelente':hScore>=60?'Bom':hScore>=40?'Médio':'Baixo — risco!'}
            </div>
          </div>
        </GlowCard>

        {/* Disparos 7d */}
        <GlowCard cor={T.green}>
          <div style={{ padding:'20px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
              <Zap size={14} style={{ color:T.green }}/>
              <span style={{ fontSize:11,fontWeight:700,color:T.ink3,
                textTransform:'uppercase',letterSpacing:'.08em' }}>Disparos 7d</span>
            </div>
            <div style={{ fontSize:52,fontWeight:900,color:T.green,letterSpacing:'-.06em',
              lineHeight:1,textShadow:`0 0 40px ${T.green}40` }}>
              {monitor?.health?.env7?.toLocaleString('pt-BR')??'—'}
            </div>
            <div style={{ fontSize:12,color:T.ink4,marginTop:6 }}>
              Taxa: {monitor?.health?.taxa7??'—'}%
            </div>
          </div>
        </GlowCard>

        {/* Anomalias */}
        <GlowCard cor={monitor?.anomalias?.length?T.red:T.green}>
          <div style={{ padding:'20px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
              <AlertTriangle size={14} style={{ color:monitor?.anomalias?.length?T.red:T.green }}/>
              <span style={{ fontSize:11,fontWeight:700,color:T.ink3,
                textTransform:'uppercase',letterSpacing:'.08em' }}>Anomalias</span>
            </div>
            <div style={{ fontSize:52,fontWeight:900,
              color:monitor?.anomalias?.length?T.red:T.green,
              letterSpacing:'-.06em',lineHeight:1,
              textShadow:`0 0 40px ${monitor?.anomalias?.length?T.red:T.green}40` }}>
              {monitor?.anomalias?.length??'0'}
            </div>
            <div style={{ fontSize:12,
              color:monitor?.anomalias?.length?T.red:T.green,
              fontWeight:600,marginTop:6 }}>
              {monitor?.anomalias?.length?'Atenção necessária':'Sistema normal'}
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Seções rápidas */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
        {STATUS.map(s=>(
          <GlowCard key={s.id} cor={s.cor} onClick={()=>onGoTo(s.id)}>
            <div style={{ padding:'16px 18px',display:'flex',alignItems:'center',gap:13 }}>
              <div style={{ width:40,height:40,borderRadius:12,flexShrink:0,
                background:`${s.cor}18`,border:`1.5px solid ${s.cor}35`,
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:`0 4px 14px ${s.cor}20` }}>
                <s.icon size={17} style={{ color:s.cor }}/>
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:13.5,fontWeight:700,color:T.ink1,
                  letterSpacing:'-.01em',marginBottom:3 }}>{s.label}</div>
                <div style={{ fontSize:11,color:T.ink4 }}>{s.status}</div>
              </div>
              <ChevronRight size={15} style={{ color:T.ink4,flexShrink:0 }}/>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  )
}

function SecaoGatilhosHorarios({ api }) {
  const [schedules,  setSchedules]  = useState({})
  const [indicadores,setIndicadores]= useState({})
  const [loading,    setLoading]    = useState(true)
  const [busca,      setBusca]      = useState('')
  const [grupoAberto,setGrupoAberto]= useState('Compra & Pagamento')

  useEffect(()=>{
    Promise.all([
      fetch(`${api}/api/dashboard/config/schedules`).then(r=>r.json()).catch(()=>({})),
      fetch(`${api}/api/dashboard/gatilhos-indicadores`).then(r=>r.json()).catch(()=>({})),
    ]).then(([s,ind])=>{
      setSchedules(s.schedules||{})
      setIndicadores(ind.indicadores||{})
      setLoading(false)
    })
  },[api])

  const salvar = async (id, schedule) => {
    await fetch(`${api}/api/dashboard/config/schedules`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ gatilho:id, schedule }),
    }).catch(()=>{})
    setSchedules(p=>({...p,[id]:schedule}))
  }

  const grupos = {}
  GATILHOS_DEF.forEach(g=>{
    if(!grupos[g.grupo]) grupos[g.grupo]=[]
    if(!grupos[g.grupo].find(x=>x.id===g.id)) grupos[g.grupo].push(g)
  })

  const filtrados = busca
    ? GATILHOS_DEF.filter(g=>g.label.toLowerCase().includes(busca.toLowerCase()))
    : null

  const comJanela  = GATILHOS_DEF.filter(g=>schedules[g.id]?.enabled&&!ALWAYS_ON.has(g.id)).length
  const sempreAtivos= ALWAYS_ON.size

  return (
    <div>
      {/* Header stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:24 }}>
        {[
          { l:'Com janela de horário', v:comJanela,    cor:T.amber },
          { l:'Sempre ativos (lock)',  v:sempreAtivos, cor:T.ink3  },
          { l:'Total gatilhos',        v:GATILHOS_DEF.length, cor:T.purple },
        ].map(s=>(
          <GlowCard key={s.l} cor={s.cor}>
            <div style={{ padding:'14px 16px' }}>
              <div style={{ fontSize:28,fontWeight:800,color:s.cor,
                letterSpacing:'-.04em',textShadow:`0 0 24px ${s.cor}40` }}>{s.v}</div>
              <div style={{ fontSize:10.5,color:T.ink4,marginTop:3 }}>{s.l}</div>
            </div>
          </GlowCard>
        ))}
      </div>

      {/* Aviso */}
      <div style={{ display:'flex',gap:10,padding:'12px 16px',borderRadius:12,
        background:T.amberDim,border:`1px solid ${T.amberBor}`,marginBottom:20 }}>
        <Lock size={14} style={{ color:T.amber,flexShrink:0,marginTop:1 }}/>
        <div style={{ fontSize:12,color:T.amber,lineHeight:1.65 }}>
          <strong>Gatilhos com cadeado são sempre imediatos</strong> — Pedido Criado,
          Pagamento Aprovado/Pendente, Cancelamento. Não podem ter janela de horário pois
          afetam a experiência crítica do cliente.
        </div>
      </div>

      {/* Busca */}
      <div style={{ position:'relative',marginBottom:16 }}>
        <Search size={13} style={{ position:'absolute',left:12,top:'50%',
          transform:'translateY(-50%)',color:T.ink4,pointerEvents:'none' }}/>
        <input value={busca} onChange={e=>setBusca(e.target.value)}
          placeholder="Buscar gatilho..."
          style={{ width:'100%',padding:'9px 12px 9px 36px',borderRadius:10,
            background:T.bg2,border:`1px solid ${T.sep2}`,color:T.ink1,
            fontSize:13,outline:'none',fontFamily:'inherit',
            boxSizing:'border-box',transition:'border-color .18s' }}
          onFocus={e=>e.target.style.borderColor=`${T.purple}60`}
          onBlur={e=>e.target.style.borderColor=T.sep2}/>
      </div>

      {loading ? (
        <div style={{ textAlign:'center',padding:40,color:T.ink4 }}>
          <RefreshCw size={16} style={{ animation:'cfg-spin 1s linear infinite',
            display:'block',margin:'0 auto 10px',color:T.purple }}/>
          Carregando configurações...
        </div>
      ) : filtrados ? (
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {filtrados.map(g=>(
            <GatilhoCard key={g.id} g={g}
              schedule={schedules[g.id]} indicador={indicadores[g.id]}
              onSave={salvar}/>
          ))}
        </div>
      ) : (
        Object.entries(grupos).map(([grupo,items])=>(
          <div key={grupo} style={{ marginBottom:16 }}>
            <button onClick={()=>setGrupoAberto(v=>v===grupo?null:grupo)}
              style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8,
                background:'none',border:'none',cursor:'pointer',padding:'4px 0',width:'100%' }}>
              <div style={{ fontSize:9.5,fontWeight:700,textTransform:'uppercase',
                letterSpacing:'.1em',color:T.ink4 }}>{grupo}</div>
              <div style={{ flex:1,height:1,background:T.sep }}/>
              <ChevronDown size={11} style={{ color:T.ink4,
                transform:grupoAberto===grupo?'rotate(180deg)':'rotate(0)',transition:'transform .2s' }}/>
            </button>
            {grupoAberto===grupo && (
              <div style={{ display:'flex',flexDirection:'column',gap:6,
                animation:'cfg-fadeIn .2s ease' }}>
                {items.map(g=>(
                  <GatilhoCard key={g.id} g={g}
                    schedule={schedules[g.id]} indicador={indicadores[g.id]}
                    onSave={salvar}/>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

function SecaoRastreio({ api }) {
  const [canais,   setCanais]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [ok,       setOk]       = useState(false)

  useEffect(()=>{
    fetch(`${api}/api/dashboard/operacao/canais`).then(r=>r.json())
      .then(d=>{ setCanais(d.canais||[]); setLoading(false) }).catch(()=>setLoading(false))
  },[api])

  const salvar = async () => {
    setSalvando(true)
    const p={}; canais.forEach(c=>{p[c.id]=c.ativo})
    await fetch(`${api}/api/dashboard/operacao/canais`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({canais:p})
    }).catch(()=>{})
    setOk(true); setTimeout(()=>setOk(false),2500); setSalvando(false)
  }

  const proprios   = canais.filter(c=>!CANAL_META[c.id]?.mktp)
  const marketplaces= canais.filter(c=>CANAL_META[c.id]?.mktp)

  const CanalCard = ({ c }) => {
    const m = CANAL_META[c.id]||{cor:T.ink3,lbl:c.nome}
    return (
      <GlowCard cor={c.ativo?m.cor:undefined}>
        <div style={{ padding:'14px 16px',display:'flex',alignItems:'center',gap:12 }}>
          <div style={{ position:'relative',flexShrink:0 }}>
            <div style={{ width:10,height:10,borderRadius:'50%',
              background:c.ativo?m.cor:T.ink4,
              boxShadow:c.ativo?`0 0 10px ${m.cor},0 0 20px ${m.cor}50`:undefined,
              transition:'all .3s' }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13.5,fontWeight:700,color:T.ink1,marginBottom:3 }}>{m.lbl}</div>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <span style={{ fontSize:11,color:T.ink4 }}>{c.desc}</span>
              {(c.naFila||0)>0&&(
                <StatusChip label={`${c.naFila} na fila`} cor={T.amber}/>
              )}
            </div>
          </div>
          <PremiumToggle value={c.ativo}
            onChange={v=>setCanais(cs=>cs.map(x=>x.id===c.id?{...x,ativo:v}:x))}
            cor={m.cor}/>
        </div>
      </GlowCard>
    )
  }

  if (loading) return <div style={{ textAlign:'center',padding:40,color:T.ink4 }}>Carregando...</div>

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11,fontWeight:700,color:T.ink4,textTransform:'uppercase',
          letterSpacing:'.09em',marginBottom:10 }}>Canais Próprios</div>
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {proprios.map(c=><CanalCard key={c.id} c={c}/>)}
        </div>
      </div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11,fontWeight:700,color:T.ink4,textTransform:'uppercase',
          letterSpacing:'.09em',marginBottom:6 }}>Marketplaces</div>
        <div style={{ fontSize:11.5,color:T.ink4,marginBottom:10,lineHeight:1.6 }}>
          Marketplaces têm rastreio próprio. Ative apenas se quiser acompanhar também por aqui.
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {marketplaces.map(c=><CanalCard key={c.id} c={c}/>)}
        </div>
      </div>
      <button onClick={salvar} disabled={salvando} style={{
        display:'flex',alignItems:'center',gap:8,padding:'10px 22px',
        borderRadius:11,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,
        background:`linear-gradient(135deg,${T.green},${T.green}cc)`,
        color:'#000',boxShadow:`0 4px 18px ${T.green}35`,
        opacity:salvando?.6:1 }}>
        {ok?<><Check size={14}/>Salvo!</>:<><Save size={14}/>Salvar canais</>}
      </button>
    </div>
  )
}

function SecaoSLA({ api }) {
  const [sla, setSla] = useState({
    horario_inicio:8,horario_fim:22,dias:[1,2,3,4,5,6],
    sla_primeira_resposta_min:5,sla_resolucao_h:24,
    fora_horario_msg:'Olá! Nosso atendimento funciona das 8h às 22h. Retornaremos em breve!'
  })
  const [salvando,setSalvando]=useState(false)
  const [ok,setOk]=useState(false)

  useEffect(()=>{
    fetch(`${api}/api/dashboard/config/sla`).then(r=>r.json())
      .then(d=>{ if(d.sla) setSla(d.sla) }).catch(()=>{})
  },[api])

  const salvar=async()=>{
    setSalvando(true)
    await fetch(`${api}/api/dashboard/config/sla`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({sla})}).catch(()=>{})
    setOk(true);setTimeout(()=>setOk(false),2500);setSalvando(false)
  }

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      {/* Horário */}
      <GlowCard cor={T.cyan}>
        <div style={{ padding:'18px 20px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
            <Clock size={15} style={{ color:T.cyan }}/>
            <span style={{ fontSize:14,fontWeight:700,color:T.ink1 }}>Horário de atendimento</span>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16 }}>
            {[{l:'Abertura',k:'horario_inicio',r:[6,7,8,9,10]},
              {l:'Fechamento',k:'horario_fim',r:[20,21,22,23,24]}].map(f=>(
              <div key={f.k}>
                <div style={{ fontSize:10,fontWeight:700,color:T.ink4,textTransform:'uppercase',
                  letterSpacing:'.08em',marginBottom:8 }}>{f.l}</div>
                <div style={{ display:'flex',gap:5 }}>
                  {f.r.map(h=>(
                    <button key={h} onClick={()=>setSla(s=>({...s,[f.k]:h}))}
                      style={{ width:40,height:30,borderRadius:8,border:'none',cursor:'pointer',
                        fontSize:11,fontWeight:700,transition:'all .15s',
                        background:sla[f.k]===h?T.cyan:T.bg4,
                        color:sla[f.k]===h?'#000':T.ink4,
                        boxShadow:sla[f.k]===h?`0 0 10px ${T.cyan}50`:undefined }}>
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:10,fontWeight:700,color:T.ink4,textTransform:'uppercase',
              letterSpacing:'.08em',marginBottom:8 }}>Dias</div>
            <div style={{ display:'flex',gap:5 }}>
              {DIAS.map((d,i)=>{
                const a=sla.dias?.includes(i)
                return (
                  <button key={i} onClick={()=>setSla(s=>({...s,
                    dias:a?s.dias.filter(x=>x!==i):[...(s.dias||[]),i].sort()}))}
                    style={{ width:40,height:34,borderRadius:9,border:'none',cursor:'pointer',
                      fontSize:10.5,fontWeight:700,transition:'all .15s',
                      background:a?T.cyan:T.bg4,color:a?'#000':T.ink4,
                      boxShadow:a?`0 0 10px ${T.cyan}50`:undefined }}>
                    {d}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </GlowCard>

      {/* SLAs */}
      <GlowCard cor={T.purple}>
        <div style={{ padding:'18px 20px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
            <Activity size={15} style={{ color:T.purple }}/>
            <span style={{ fontSize:14,fontWeight:700,color:T.ink1 }}>Metas de SLA</span>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
            {[{l:'1ª resposta (min)',k:'sla_primeira_resposta_min',max:120},
              {l:'Resolução (horas)',k:'sla_resolucao_h',max:168}].map(f=>(
              <div key={f.k}>
                <div style={{ fontSize:10,fontWeight:700,color:T.ink4,textTransform:'uppercase',
                  letterSpacing:'.08em',marginBottom:7 }}>{f.l}</div>
                <PInput type="number" value={sla[f.k]} min={1} max={f.max}
                  onChange={e=>setSla(s=>({...s,[f.k]:parseInt(e.target.value)||0}))}/>
              </div>
            ))}
          </div>
        </div>
      </GlowCard>

      {/* Msg fora do horário */}
      <GlowCard cor={T.amber}>
        <div style={{ padding:'18px 20px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
            <Moon size={14} style={{ color:T.amber }}/>
            <span style={{ fontSize:14,fontWeight:700,color:T.ink1 }}>Fora do horário</span>
          </div>
          <PInput rows={3} value={sla.fora_horario_msg}
            onChange={e=>setSla(s=>({...s,fora_horario_msg:e.target.value}))}
            placeholder="Mensagem enviada fora do horário..."/>
          <div style={{ fontSize:10.5,color:T.ink4,marginTop:6 }}>
            A IA envia esta mensagem quando o cliente contata fora do horário configurado.
          </div>
        </div>
      </GlowCard>

      <button onClick={salvar} disabled={salvando} style={{
        display:'flex',alignItems:'center',gap:8,alignSelf:'flex-start',
        padding:'10px 22px',borderRadius:11,border:'none',cursor:'pointer',
        fontSize:13,fontWeight:700,
        background:`linear-gradient(135deg,${T.cyan},${T.cyan}cc)`,
        color:'#000',boxShadow:`0 4px 18px ${T.cyan}35`,opacity:salvando?.6:1 }}>
        {ok?<><Check size={14}/>Salvo!</>:<><Save size={14}/>Salvar SLA</>}
      </button>
    </div>
  )
}

function SecaoBlacklist({ api }) {
  const [phones,setPhones]=useState([])
  const [keywords,setKeywords]=useState([])
  const [novoTel,setNovoTel]=useState('')
  const [novaKw,setNovaKw]=useState('')
  const [salvando,setSalvando]=useState(false)
  const [ok,setOk]=useState(false)

  useEffect(()=>{
    fetch(`${api}/api/dashboard/config/blacklist`).then(r=>r.json())
      .then(d=>{ setPhones(d.phones||[]); setKeywords(d.keywords||[]) }).catch(()=>{})
  },[api])

  const salvar=async()=>{
    setSalvando(true)
    await fetch(`${api}/api/dashboard/config/blacklist`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({phones,keywords})}).catch(()=>{})
    setOk(true);setTimeout(()=>setOk(false),2500);setSalvando(false)
  }

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      <GlowCard cor={T.red}>
        <div style={{ padding:'18px 20px' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <ShieldOff size={15} style={{ color:T.red }}/>
              <span style={{ fontSize:14,fontWeight:700,color:T.ink1 }}>Números bloqueados</span>
            </div>
            <StatusChip label={`${phones.length}`} cor={T.red}/>
          </div>
          <div style={{ display:'flex',gap:8,marginBottom:12 }}>
            <PInput value={novoTel} onChange={e=>setNovoTel(e.target.value)}
              placeholder="55119... (com DDI)" mono/>
            <button onClick={()=>{
              const t=novoTel.replace(/\D/g,'')
              if(t.length>=10&&!phones.includes(t)){setPhones(p=>[...p,t]);setNovoTel('')}
            }} style={{ padding:'9px 16px',borderRadius:10,border:'none',cursor:'pointer',
              background:T.red,color:'#fff',fontWeight:700,flexShrink:0,
              boxShadow:`0 3px 12px ${T.red}35` }}>
              <Plus size={14}/>
            </button>
          </div>
          <div style={{ display:'flex',flexWrap:'wrap',gap:6,minHeight:32 }}>
            {phones.length===0
              ? <span style={{ fontSize:11.5,color:T.ink4 }}>Nenhum número bloqueado</span>
              : phones.map(p=>(
                <span key={p} style={{ display:'inline-flex',alignItems:'center',gap:5,
                  padding:'3px 10px',borderRadius:99,background:T.redDim,
                  color:T.red,border:`1px solid ${T.redBor}`,
                  fontSize:11,fontWeight:600,fontFamily:'monospace' }}>
                  {p}
                  <button onClick={()=>setPhones(prev=>prev.filter(x=>x!==p))}
                    style={{ background:'none',border:'none',cursor:'pointer',
                      color:T.red,padding:0,display:'flex' }}>
                    <X size={10}/>
                  </button>
                </span>
              ))}
          </div>
        </div>
      </GlowCard>

      <GlowCard cor={T.amber}>
        <div style={{ padding:'18px 20px' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <Bell size={15} style={{ color:T.amber }}/>
              <span style={{ fontSize:14,fontWeight:700,color:T.ink1 }}>Palavras-chave de opt-out</span>
            </div>
            <StatusChip label={`${keywords.length}`} cor={T.amber}/>
          </div>
          <div style={{ fontSize:11.5,color:T.ink4,marginBottom:12,lineHeight:1.6 }}>
            Quando o cliente enviar estas palavras, os disparos automáticos pausam para o número.
          </div>
          <div style={{ display:'flex',gap:8,marginBottom:12 }}>
            <PInput value={novaKw} onChange={e=>setNovaKw(e.target.value)}
              placeholder="Ex: sair, parar, cancelar"/>
            <button onClick={()=>{
              const k=novaKw.trim().toLowerCase()
              if(k&&!keywords.includes(k)){setKeywords(p=>[...p,k]);setNovaKw('')}
            }} style={{ padding:'9px 16px',borderRadius:10,border:'none',cursor:'pointer',
              background:T.amber,color:'#000',fontWeight:700,flexShrink:0,
              boxShadow:`0 3px 12px ${T.amber}35` }}>
              <Plus size={14}/>
            </button>
          </div>
          <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
            {keywords.length===0
              ? <span style={{ fontSize:11.5,color:T.ink4 }}>Nenhuma palavra cadastrada</span>
              : keywords.map(k=>(
                <span key={k} style={{ display:'inline-flex',alignItems:'center',gap:5,
                  padding:'3px 10px',borderRadius:99,background:T.amberDim,
                  color:T.amber,border:`1px solid ${T.amberBor}`,
                  fontSize:11,fontWeight:600 }}>
                  {k}
                  <button onClick={()=>setKeywords(prev=>prev.filter(x=>x!==k))}
                    style={{ background:'none',border:'none',cursor:'pointer',
                      color:T.amber,padding:0,display:'flex' }}>
                    <X size={10}/>
                  </button>
                </span>
              ))}
          </div>
        </div>
      </GlowCard>

      <button onClick={salvar} disabled={salvando} style={{
        display:'flex',alignItems:'center',gap:8,alignSelf:'flex-start',
        padding:'10px 22px',borderRadius:11,border:'none',cursor:'pointer',
        fontSize:13,fontWeight:700,
        background:`linear-gradient(135deg,${T.red},${T.red}cc)`,
        color:'#fff',boxShadow:`0 4px 18px ${T.red}35`,opacity:salvando?.6:1 }}>
        {ok?<><Check size={14}/>Salvo!</>:<><Save size={14}/>Salvar blacklist</>}
      </button>
    </div>
  )
}

function SecaoExportacao({ api }) {
  const hoje=new Date().toISOString().split('T')[0]
  const [from,setFrom]=useState(new Date(Date.now()-30*86400000).toISOString().split('T')[0])
  const [to,setTo]=useState(hoje)
  const [fmt,setFmt]=useState('csv')
  const [gat,setGat]=useState('')
  const [baixando,setBaix]=useState(false)

  const exportar=async()=>{
    setBaix(true)
    const p=new URLSearchParams({from,to,formato:fmt})
    if(gat) p.set('gatilho',gat)
    try {
      const r=await fetch(`${api}/api/dashboard/config/export?${p}`)
      const blob=await r.blob()
      const url=URL.createObjectURL(blob)
      const a=document.createElement('a')
      a.href=url;a.download=`disparos_${from}_${to}.${fmt}`;a.click()
      URL.revokeObjectURL(url)
    } catch {}
    setBaix(false)
  }

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      <GlowCard cor={T.blue}>
        <div style={{ padding:'18px 20px' }}>
          <div style={{ fontSize:11,fontWeight:700,color:T.ink4,textTransform:'uppercase',
            letterSpacing:'.08em',marginBottom:14 }}>Período</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16 }}>
            {[{l:'De',v:from,s:setFrom},{l:'Até',v:to,s:setTo}].map(f=>(
              <div key={f.l}>
                <div style={{ fontSize:10,color:T.ink4,marginBottom:6 }}>{f.l}</div>
                <PInput type="date" value={f.v} onChange={e=>f.s(e.target.value)}/>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10,color:T.ink4,marginBottom:6 }}>Gatilho (opcional)</div>
            <select value={gat} onChange={e=>setGat(e.target.value)}
              style={{ width:'100%',padding:'9px 13px',borderRadius:10,
                background:T.bg1,border:`1px solid ${T.sep2}`,color:T.ink1,
                fontSize:13,outline:'none',fontFamily:'inherit' }}>
              <option value="">Todos os gatilhos</option>
              {GATILHOS_DEF.map(g=><option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10,color:T.ink4,marginBottom:8 }}>Formato</div>
            <div style={{ display:'flex',gap:8 }}>
              {['csv','json'].map(f=>(
                <button key={f} onClick={()=>setFmt(f)}
                  style={{ padding:'8px 24px',borderRadius:9,border:'none',cursor:'pointer',
                    fontSize:12.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',
                    transition:'all .15s',
                    background:fmt===f?T.blue:T.bg4,
                    color:fmt===f?'#fff':T.ink4,
                    boxShadow:fmt===f?`0 4px 14px ${T.blue}35`:undefined }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <button onClick={exportar} disabled={baixando} style={{
            display:'flex',alignItems:'center',gap:8,
            padding:'10px 22px',borderRadius:11,border:'none',cursor:'pointer',
            fontSize:13,fontWeight:700,
            background:`linear-gradient(135deg,${T.blue},${T.blue}cc)`,
            color:'#fff',boxShadow:`0 4px 18px ${T.blue}35`,opacity:baixando?.6:1 }}>
            {baixando?<><RefreshCw size={13} style={{ animation:'cfg-spin 1s linear infinite' }}/>Baixando...</>
              :<><FileDown size={13}/>Exportar {fmt.toUpperCase()}</>}
          </button>
        </div>
      </GlowCard>
    </div>
  )
}

function SecaoAuditoria({ api }) {
  const [audit,setAudit]=useState(null)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    fetch(`${api}/api/dashboard/config/audit`).then(r=>r.json())
      .then(d=>{ setAudit(d); setLoading(false) }).catch(()=>setLoading(false))
  },[api])

  if (loading) return <div style={{ textAlign:'center',padding:40,color:T.ink4 }}>Carregando...</div>

  const all = [
    ...(audit?.template_changes||[]).map(t=>({
      tipo: t.ativo?'ativado':'desativado',
      label: t.nome||t.gatilho,
      cor: t.ativo?T.green:T.red,
      ts: t.atualizado_em,
    })),
    ...(audit?.config_changes||[]).map(c=>({
      tipo:'config',label:c.chave,cor:T.purple,ts:c.dados?.ts
    })),
  ].sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,30)

  return (
    <div>
      {all.length===0 ? (
        <div style={{ textAlign:'center',padding:'48px 0',color:T.ink4 }}>
          <History size={28} style={{ opacity:.15,display:'block',margin:'0 auto 12px' }}/>
          <p style={{ fontSize:13,margin:0 }}>Nenhuma alteração registrada nos últimos 30 dias</p>
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
          {all.map((item,i)=>(
            <GlowCard key={i} cor={item.cor}>
              <div style={{ padding:'12px 16px',display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ width:8,height:8,borderRadius:'50%',flexShrink:0,
                  background:item.cor,boxShadow:`0 0 8px ${item.cor}` }}/>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:13,fontWeight:600,color:T.ink1 }}>{item.label}</span>
                  <span style={{ fontSize:11,color:item.cor,marginLeft:8,fontWeight:600 }}>
                    — {item.tipo}
                  </span>
                </div>
                <span style={{ fontSize:11,color:T.ink4,flexShrink:0 }}>
                  {tempoRel(item.ts)||'—'}
                </span>
              </div>
            </GlowCard>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVEGAÇÃO LATERAL NIVELMAX
// ─────────────────────────────────────────────────────────────────────────────
const SECOES = [
  { id:'visao',     label:'Visão Geral',        icon:LayoutDashboard, cor:T.purple, desc:'Status global'           },
  { id:'gatilhos',  label:'Gatilhos & Horários', icon:Zap,             cor:T.amber,  desc:'Schedules por gatilho', badge:'novo' },
  { id:'rastreio',  label:'Rastreio por Canal',  icon:Truck,           cor:T.green,  desc:'Canais ativos'          },
  { id:'sla',       label:'Atendimento & SLA',   icon:Clock,           cor:T.cyan,   desc:'Horário + metas'        },
  { id:'blacklist', label:'Blacklist & Opt-out', icon:ShieldOff,       cor:T.red,    desc:'Bloqueio de contatos'   },
  { id:'export',    label:'Exportação',           icon:Download,        cor:T.blue,   desc:'CSV / JSON'             },
  { id:'auditoria', label:'Auditoria',            icon:History,         cor:T.ink3,   desc:'Log de mudanças'        },
]

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function PageCentralConfig({ api=API }) {
  const [secao, setSecao] = useState('visao')
  const mainRef = useRef()

  const goTo = (id) => {
    setSecao(id)
    mainRef.current?.scrollTo({top:0,behavior:'smooth'})
  }

  const current = SECOES.find(s=>s.id===secao)

  const renderSecao = () => {
    switch(secao) {
      case 'visao':     return <SecaoVisaoGeral api={api} onGoTo={goTo}/>
      case 'gatilhos':  return <SecaoGatilhosHorarios api={api}/>
      case 'rastreio':  return <SecaoRastreio api={api}/>
      case 'sla':       return <SecaoSLA api={api}/>
      case 'blacklist': return <SecaoBlacklist api={api}/>
      case 'export':    return <SecaoExportacao api={api}/>
      case 'auditoria': return <SecaoAuditoria api={api}/>
      default: return null
    }
  }

  return (
    <div style={{ display:'flex',height:'100%',background:T.bg0,overflow:'hidden',
      fontFamily:'system-ui,sans-serif' }}>
      <style>{`
        @keyframes cfg-spin   { to{transform:rotate(360deg)} }
        @keyframes cfg-pulse  { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes cfg-fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cfg-slideR { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      {/* ── SIDE PANEL ──────────────────────────────────────────────── */}
      <aside style={{
        width:270, flexShrink:0,
        display:'flex', flexDirection:'column',
        background:`linear-gradient(180deg,${T.bg2} 0%,${T.bg1} 100%)`,
        borderRight:`1px solid ${T.sep}`,
        boxShadow:`6px 0 32px rgba(0,0,0,.4)`,
      }}>
        {/* Header do painel */}
        <div style={{ padding:'24px 18px 18px',borderBottom:`1px solid ${T.sep}` }}>
          <div style={{ display:'flex',alignItems:'center',gap:11,marginBottom:3 }}>
            <div style={{ width:40,height:40,borderRadius:13,flexShrink:0,
              background:'linear-gradient(135deg,rgba(167,139,250,.25),rgba(167,139,250,.1))',
              border:`1.5px solid ${T.purpleBor}`,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:`0 4px 20px ${T.purple}25` }}>
              <Settings2 size={18} style={{ color:T.purple }}/>
            </div>
            <div>
              <div style={{ fontSize:16,fontWeight:800,color:T.ink1,letterSpacing:'-.03em' }}>
                Configurações
              </div>
              <div style={{ fontSize:10,color:T.ink4,marginTop:1 }}>Central de controle</div>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav style={{ flex:1,overflowY:'auto',padding:'10px 10px',
          scrollbarWidth:'none' }}>
          {SECOES.map(s=>{
            const ativa = secao === s.id
            return (
              <button key={s.id} onClick={()=>goTo(s.id)}
                style={{ width:'100%',display:'flex',alignItems:'center',gap:11,
                  padding:'10px 12px',borderRadius:13,border:'none',cursor:'pointer',
                  marginBottom:4,textAlign:'left',position:'relative',
                  background:ativa?`${s.cor}16`:'transparent',
                  transition:'all .16s cubic-bezier(.4,0,.2,1)' }}
                onMouseEnter={e=>{ if(!ativa) e.currentTarget.style.background=T.gray }}
                onMouseLeave={e=>{ if(!ativa) e.currentTarget.style.background='transparent' }}>

                {/* Acento lateral */}
                <div style={{ position:'absolute',left:0,top:'18%',bottom:'18%',
                  width:3,borderRadius:'0 3px 3px 0',
                  background:ativa?`linear-gradient(180deg,${s.cor},${s.cor}60)`:'transparent',
                  boxShadow:ativa?`0 0 12px ${s.cor}70`:undefined,
                  transition:'all .2s' }}/>

                {/* Ícone */}
                <div style={{ width:34,height:34,borderRadius:10,flexShrink:0,
                  background:ativa?`${s.cor}22`:'rgba(255,255,255,.04)',
                  border:`1px solid ${ativa?s.cor+'45':'rgba(255,255,255,.06)'}`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  boxShadow:ativa?`0 2px 14px ${s.cor}25`:undefined,
                  transition:'all .18s' }}>
                  <s.icon size={14} style={{ color:ativa?s.cor:T.ink4,transition:'color .15s' }}/>
                </div>

                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:2 }}>
                    <span style={{ fontSize:13,fontWeight:ativa?700:500,
                      color:ativa?s.cor:T.ink3,transition:'all .15s',
                      letterSpacing:'-.01em' }}>
                      {s.label}
                    </span>
                    {s.badge && (
                      <span style={{ fontSize:8,padding:'1px 6px',borderRadius:99,
                        background:`${s.cor}22`,color:s.cor,
                        border:`1px solid ${s.cor}35`,fontWeight:700,letterSpacing:'.05em',
                        textTransform:'uppercase' }}>{s.badge}</span>
                    )}
                  </div>
                  <div style={{ fontSize:10.5,color:T.ink4 }}>{s.desc}</div>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Info footer */}
        <div style={{ padding:'12px 16px 16px',borderTop:`1px solid ${T.sep}` }}>
          <div style={{ fontSize:10.5,color:T.ink4,lineHeight:1.6 }}>
            Mudanças salvas em tempo real. O sistema aplica no próximo ciclo de 30 min.
          </div>
        </div>
      </aside>

      {/* ── CONTEÚDO PRINCIPAL ──────────────────────────────────────── */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>

        {/* Header da seção ativa */}
        {current && (
          <div style={{ flexShrink:0,padding:'22px 36px 18px',
            borderBottom:`1px solid ${T.sep}`,
            background:`linear-gradient(90deg,${current.cor}08,transparent 60%)` }}>
            <div style={{ display:'flex',alignItems:'center',gap:13,
              animation:'cfg-slideR .25s ease' }} key={secao}>
              <div style={{ width:44,height:44,borderRadius:13,flexShrink:0,
                background:`${current.cor}20`,border:`1.5px solid ${current.cor}40`,
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:`0 4px 20px ${current.cor}25` }}>
                <current.icon size={20} style={{ color:current.cor }}/>
              </div>
              <div>
                <h1 style={{ margin:0,fontSize:20,fontWeight:800,color:T.ink1,
                  letterSpacing:'-.03em' }}>
                  {current.label}
                </h1>
                <p style={{ margin:0,fontSize:12,color:T.ink4,marginTop:3 }}>
                  {current.desc}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Área de conteúdo scrollável */}
        <main ref={mainRef} style={{ flex:1,overflowY:'auto',padding:'28px 36px' }}>
          <div style={{ maxWidth:820,margin:'0 auto',
            animation:'cfg-fadeIn .3s ease' }} key={secao}>
            {renderSecao()}
          </div>
        </main>
      </div>
    </div>
  )
}
