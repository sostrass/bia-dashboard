/**
 * PageCentralConfig — Super Central de Configuração NIVELMAX
 *
 * Seções:
 *  1. Visão Geral       — status de saúde de toda a config
 *  2. IA & Comportamento — personalidade, tom, integrações
 *  3. Gatilhos & Horários — schedules por gatilho (novo!)
 *  4. Rastreio por Canal — canais ativos/inativos
 *  5. Atendimento & SLA  — horário + SLA
 *  6. Blacklist & Opt-out — números e palavras bloqueadas
 *  7. Exportação         — CSV/JSON de disparos
 *  8. Auditoria          — log de mudanças
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LayoutDashboard, Zap, Truck, MessageSquare, ShieldOff,
  Download, Clock, Activity, Settings2, CheckCircle,
  AlertTriangle, Info, X, Save, RefreshCw, Check,
  ChevronRight, Lock, Plus, Trash2, Calendar,
  Shield, FileDown, History, ToggleLeft, ToggleRight,
  Moon, Sun, Globe, Bell, Users, TrendingUp,
  Package, ShoppingBag, CreditCard, Brain, Star,
  Radio, AlertCircle, XCircle, FileText,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

// ── T system ──────────────────────────────────────────────────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#7b81a0', ink4:'#3a3f5c',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)', greenBor:'rgba(0,230,118,.25)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.09)', amberBor:'rgba(255,179,0,.28)',
  red:'#ff4757',  redDim:'rgba(255,71,87,.08)',   redBor:'rgba(255,71,87,.28)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.09)',purpleBor:'rgba(167,139,250,.25)',
  cyan:'#06b6d4', cyanDim:'rgba(6,182,212,.08)',   cyanBor:'rgba(6,182,212,.22)',
  blue:'#4f8ef7', blueDim:'rgba(79,142,247,.08)',  blueBor:'rgba(79,142,247,.25)',
  sep:'rgba(255,255,255,.05)', sep2:'rgba(255,255,255,.08)',
  gray:'rgba(255,255,255,.04)',
}

// ── Gatilhos que NÃO podem ter horário bloqueado ───────────────────────────────
const ALWAYS_ON = new Set([
  'pedido_criado','pagamento_aprovado','pagamento_pendente',
  'cancelamento','nfe_rejeitada','boas_vindas',
])

// ── Definição completa de gatilhos agrupados ──────────────────────────────────
const GATILHOS_DEF = [
  // Compra
  { id:'pedido_criado',     label:'Pedido Criado',       grupo:'Compra & Pagamento', cor:'#00d4aa', icon:ShoppingBag },
  { id:'pagamento_aprovado',label:'Pagamento Aprovado',  grupo:'Compra & Pagamento', cor:'#4a9fff', icon:CreditCard  },
  { id:'pagamento_pendente',label:'Pagamento Pendente',  grupo:'Compra & Pagamento', cor:'#f59e0b', icon:Clock       },
  { id:'pix_pendente',      label:'PIX Pendente',        grupo:'Compra & Pagamento', cor:'#06b6d4', icon:CreditCard  },
  // Preparação
  { id:'em_separacao',      label:'Em Separação',        grupo:'Preparação & Nota',  cor:'#8b5cf6', icon:Package     },
  { id:'nfe_emitida',       label:'NF-e Emitida',        grupo:'Preparação & Nota',  cor:'#06b6d4', icon:FileText    },
  // Rastreio
  { id:'pedido_enviado',    label:'Pedido Enviado',      grupo:'Envio & Rastreio',   cor:'#a78bfa', icon:Truck       },
  { id:'pedido_coletado',   label:'Pedido Coletado',     grupo:'Envio & Rastreio',   cor:'#06b6d4', icon:Package     },
  { id:'rastreio_em_transito',label:'Em Trânsito',       grupo:'Envio & Rastreio',   cor:'#4a9fff', icon:Radio       },
  { id:'saiu_entrega',      label:'Saiu para Entrega',   grupo:'Envio & Rastreio',   cor:'#f59e0b', icon:Truck       },
  { id:'tentativa_entrega', label:'Tentativa de Entrega',grupo:'Envio & Rastreio',   cor:'#f59e0b', icon:AlertTriangle},
  { id:'aguardando_retirada',label:'Aguardando Retirada',grupo:'Envio & Rastreio',   cor:'#0ea5e9', icon:Clock       },
  { id:'pedido_entregue',   label:'Pedido Entregue',     grupo:'Envio & Rastreio',   cor:'#22c55e', icon:Package     },
  { id:'nao_entregue',      label:'Não Entregue',        grupo:'Envio & Rastreio',   cor:'#ef4444', icon:AlertCircle },
  { id:'pacote_devolvido',  label:'Pacote Devolvido',    grupo:'Envio & Rastreio',   cor:'#f87171', icon:RefreshCw   },
  // Pós-venda
  { id:'cancelamento',      label:'Pedido Cancelado',    grupo:'Pós-venda',          cor:'#6b7280', icon:XCircle     },
  { id:'avaliar_pedido',    label:'Avaliação Pós-venda', grupo:'Pós-venda',          cor:'#f87171', icon:Star        },
  { id:'estorno_realizado', label:'Estorno Realizado',   grupo:'Pós-venda',          cor:'#f97316', icon:RefreshCw   },
  // Inteligência
  { id:'reengajamento',     label:'Reengajamento',       grupo:'Inteligência',       cor:'#7c6af7', icon:Brain       },
  { id:'avaliar_pedido',    label:'Avaliação Pós-venda', grupo:'Inteligência',       cor:'#f87171', icon:Star        },
]

const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

// ── Utilitários ────────────────────────────────────────────────────────────────
const btn = (cor) => ({
  display:'flex', alignItems:'center', gap:6,
  padding:'8px 16px', borderRadius:10, border:'none', cursor:'pointer',
  background:`linear-gradient(135deg,${cor},${cor}cc)`,
  color:'#000', fontSize:12.5, fontWeight:700,
  boxShadow:`0 4px 14px ${cor}35`, transition:'all .15s',
})

function Chip({ label, onRemove, cor=T.purple }) {
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:5,
      padding:'3px 10px',borderRadius:99,fontSize:11,fontWeight:600,
      background:`${cor}18`,color:cor,border:`1px solid ${cor}35` }}>
      {label}
      {onRemove && (
        <button onClick={onRemove} style={{ background:'none',border:'none',
          cursor:'pointer',color:cor,padding:0,display:'flex' }}>
          <X size={10}/>
        </button>
      )}
    </span>
  )
}

function SectionHeader({ icon:Ic, title, desc, cor=T.purple, actions }) {
  return (
    <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',
      marginBottom:24 }}>
      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
        <div style={{ width:40,height:40,borderRadius:12,flexShrink:0,
          background:`${cor}20`,border:`1.5px solid ${cor}40`,
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:`0 4px 16px ${cor}25` }}>
          <Ic size={18} style={{ color:cor }}/>
        </div>
        <div>
          <h2 style={{ margin:0,fontSize:17,fontWeight:800,color:T.ink1,letterSpacing:'-.03em' }}>
            {title}
          </h2>
          <p style={{ margin:0,fontSize:11.5,color:T.ink4,marginTop:3 }}>{desc}</p>
        </div>
      </div>
      {actions && <div style={{ display:'flex',gap:8 }}>{actions}</div>}
    </div>
  )
}

function Card({ children, style={}, highlight }) {
  return (
    <div style={{
      background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
      border:`1px solid ${highlight?highlight+'35':T.sep2}`,
      borderRadius:14, padding:'18px 20px',
      boxShadow:`0 8px 28px rgba(0,0,0,.25)`,
      ...style
    }}>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. VISÃO GERAL
// ─────────────────────────────────────────────────────────────────────────────
function SecaoVisaoGeral({ onGoTo }) {
  const STATUS_ITEMS = [
    { id:'ia',        label:'IA & Comportamento', cor:T.purple, icon:Brain,    status:'Configurado',    ok:true  },
    { id:'gatilhos',  label:'Gatilhos & Horários',cor:T.amber,  icon:Zap,      status:'3 com horário',  ok:true  },
    { id:'rastreio',  label:'Rastreio por Canal',  cor:T.green,  icon:Truck,    status:'2 canais ativos',ok:true  },
    { id:'sla',       label:'Atendimento & SLA',   cor:T.cyan,   icon:Clock,    status:'8h–22h',         ok:true  },
    { id:'blacklist', label:'Blacklist & Opt-out', cor:T.red,    icon:ShieldOff,status:'0 bloqueados',   ok:true  },
    { id:'export',    label:'Exportação',           cor:T.blue,   icon:Download, status:'Disponível',     ok:true  },
    { id:'auditoria', label:'Auditoria',            cor:T.ink3,   icon:History,  status:'Ativo',          ok:true  },
  ]

  return (
    <div>
      <SectionHeader icon={LayoutDashboard} title="Visão Geral"
        desc="Status de saúde de toda a configuração do sistema"
        cor={T.purple}/>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20 }}>
        {[
          { l:'Seções configuradas', v:'7/7',    cor:T.green  },
          { l:'Alertas ativos',      v:'0',      cor:T.green  },
          { l:'Última alteração',    v:'hoje',   cor:T.amber  },
        ].map(s=>(
          <Card key={s.l}>
            <div style={{ fontSize:28,fontWeight:800,color:s.cor,letterSpacing:'-.04em',
              textShadow:`0 0 24px ${s.cor}35` }}>{s.v}</div>
            <div style={{ fontSize:11,color:T.ink4,marginTop:4 }}>{s.l}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
        {STATUS_ITEMS.map(s=>(
          <button key={s.id} onClick={()=>onGoTo(s.id)}
            style={{ textAlign:'left',padding:'14px 16px',borderRadius:13,
              background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
              border:`1px solid ${T.sep2}`,cursor:'pointer',
              display:'flex',alignItems:'center',gap:12,
              transition:'all .15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=`${s.cor}40`; e.currentTarget.style.background=`linear-gradient(135deg,${s.cor}08,${T.bg3})` }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.sep2; e.currentTarget.style.background=`linear-gradient(135deg,${T.bg2},${T.bg3})` }}>
            <div style={{ width:36,height:36,borderRadius:10,flexShrink:0,
              background:`${s.cor}18`,border:`1px solid ${s.cor}30`,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:`0 2px 10px ${s.cor}20` }}>
              <s.icon size={16} style={{ color:s.cor }}/>
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:13,fontWeight:700,color:T.ink1,marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize:10.5,color:T.ink4 }}>{s.status}</div>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:5,flexShrink:0 }}>
              <div style={{ width:6,height:6,borderRadius:'50%',
                background:s.ok?T.green:T.red,
                boxShadow:s.ok?`0 0 6px ${T.green}`:undefined }}/>
              <ChevronRight size={13} style={{ color:T.ink4 }}/>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GATILHOS & HORÁRIOS ⭐
// ─────────────────────────────────────────────────────────────────────────────
function HorarioPicker({ value, onChange, gatilhoId }) {
  const { enabled=false, start_h=8, end_h=21, days=[1,2,3,4,5] } = value || {}

  const update = (patch) => onChange({ enabled, start_h, end_h, days, ...patch })

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:10,
      padding:'12px 14px',borderRadius:11,
      background:T.bg4,border:`1px solid ${T.sep}`,
      animation:'cfg-fadeIn .2s ease' }}>

      {/* Toggle com horário */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <span style={{ fontSize:12,fontWeight:600,color:T.ink2 }}>Janela de horário</span>
        <button onClick={()=>update({ enabled:!enabled })}
          style={{ position:'relative',width:40,height:22,borderRadius:99,
            border:'none',cursor:'pointer',
            background:enabled?T.amber:'rgba(255,255,255,.1)',
            boxShadow:enabled?`0 0 10px ${T.amber}40`:undefined,
            transition:'all .2s' }}>
          <span style={{ position:'absolute',top:3,height:16,width:16,
            borderRadius:'50%',background:'#fff',
            left:enabled?'calc(100% - 19px)':'3px',
            transition:'left .18s',boxShadow:'0 1px 4px rgba(0,0,0,.3)' }}/>
        </button>
      </div>

      {enabled && (<>
        {/* Intervalo de horas */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
          {[
            { label:'Início', key:'start_h', val:start_h },
            { label:'Fim',    key:'end_h',   val:end_h   },
          ].map(f=>(
            <div key={f.key}>
              <div style={{ fontSize:10,color:T.ink4,marginBottom:5,
                textTransform:'uppercase',letterSpacing:'.07em' }}>{f.label}</div>
              <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                {[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(h=>(
                  <button key={h} onClick={()=>update({ [f.key]:h })}
                    style={{ width:32,height:26,borderRadius:7,border:'none',
                      cursor:'pointer',fontSize:10.5,fontWeight:600,
                      background:f.val===h?T.amber:T.bg3,
                      color:f.val===h?'#000':T.ink4,
                      boxShadow:f.val===h?`0 2px 8px ${T.amber}40`:undefined,
                      transition:'all .12s' }}>
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Dias da semana */}
        <div>
          <div style={{ fontSize:10,color:T.ink4,marginBottom:5,
            textTransform:'uppercase',letterSpacing:'.07em' }}>Dias ativos</div>
          <div style={{ display:'flex',gap:5 }}>
            {DIAS_SEMANA.map((d,i)=>{
              const ativo = days.includes(i)
              return (
                <button key={i} onClick={()=>update({
                  days: ativo ? days.filter(x=>x!==i) : [...days,i].sort()
                })}
                  style={{ width:36,height:32,borderRadius:8,border:'none',
                    cursor:'pointer',fontSize:10.5,fontWeight:700,
                    background:ativo?T.amber:T.bg3,
                    color:ativo?'#000':T.ink4,
                    boxShadow:ativo?`0 2px 8px ${T.amber}40`:undefined,
                    transition:'all .12s' }}>
                  {d}
                </button>
              )
            })}
          </div>
        </div>

        {/* Preview */}
        <div style={{ padding:'7px 10px',borderRadius:8,
          background:T.amberDim,border:`1px solid ${T.amberBor}`,
          fontSize:10.5,color:T.amber,fontWeight:600 }}>
          ⏰ Dispara apenas {DIAS_SEMANA.filter((_,i)=>days.includes(i)).join(', ')}, das {start_h}h às {end_h}h
        </div>
      </>)}
    </div>
  )
}

function SecaoGatilhosHorarios({ api }) {
  const [schedules, setSchedules]  = useState({})
  const [loading,   setLoading]    = useState(true)
  const [salvando,  setSalvando]   = useState(null)
  const [salvoOk,   setSalvoOk]    = useState(null)
  const [expandido, setExpandido]  = useState(null)
  const [busca,     setBusca]      = useState('')

  useEffect(()=>{
    fetch(`${api}/api/dashboard/config/schedules`)
      .then(r=>r.json()).then(d=>{ setSchedules(d.schedules||{}); setLoading(false) })
      .catch(()=>setLoading(false))
  },[api])

  const salvar = async (id, schedule) => {
    setSalvando(id)
    try {
      await fetch(`${api}/api/dashboard/config/schedules`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ gatilho:id, schedule }),
      })
      setSchedules(prev=>({...prev,[id]:schedule}))
      setSalvoOk(id); setTimeout(()=>setSalvoOk(null),2000)
    } catch {}
    setSalvando(null)
  }

  // Agrupar gatilhos
  const grupos = {}
  GATILHOS_DEF.forEach(g=>{
    if (!grupos[g.grupo]) grupos[g.grupo] = []
    if (!grupos[g.grupo].find(x=>x.id===g.id)) grupos[g.grupo].push(g)
  })

  const filtrados = busca
    ? GATILHOS_DEF.filter(g=>g.label.toLowerCase().includes(busca.toLowerCase()))
    : null

  return (
    <div>
      <SectionHeader icon={Zap} title="Gatilhos & Horários"
        desc="Defina janelas de envio por gatilho. Pagamentos e cancelamentos são sempre imediatos."
        cor={T.amber}/>

      {/* Aviso sobre sempre-ativos */}
      <div style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'12px 14px',
        borderRadius:11,background:T.amberDim,border:`1px solid ${T.amberBor}`,
        marginBottom:20 }}>
        <Lock size={14} style={{ color:T.amber,flexShrink:0,marginTop:1 }}/>
        <div style={{ fontSize:12,color:T.amber,lineHeight:1.6 }}>
          <strong>Sempre imediatos (sem janela de horário):</strong>{' '}
          Pedido Criado, Pagamento Aprovado/Pendente, Cancelamento e Boas-vindas.
          Estes gatilhos nunca podem ser pausados pois afetam a experiência crítica do cliente.
        </div>
      </div>

      {/* Busca */}
      <div style={{ position:'relative',marginBottom:16 }}>
        <input value={busca} onChange={e=>setBusca(e.target.value)}
          placeholder="Buscar gatilho..."
          style={{ width:'100%',padding:'9px 12px',paddingLeft:12,borderRadius:10,
            background:T.bg3,border:`1px solid ${T.sep}`,color:T.ink1,
            fontSize:13,outline:'none',fontFamily:'inherit' }}/>
      </div>

      {loading ? (
        <div style={{ textAlign:'center',padding:'32px',color:T.ink4 }}>
          <RefreshCw size={16} style={{ animation:'cfg-spin 1s linear infinite',
            display:'block',margin:'0 auto 8px' }}/>
          Carregando schedules...
        </div>
      ) : filtrados ? (
        // Vista de busca
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {filtrados.map(g=><GatilhoRow key={g.id} g={g} schedules={schedules}
            setSchedules={setSchedules} expandido={expandido}
            setExpandido={setExpandido} salvar={salvar}
            salvando={salvando} salvoOk={salvoOk}/>)}
        </div>
      ) : (
        // Vista agrupada
        Object.entries(grupos).map(([grupo, items])=>(
          <div key={grupo} style={{ marginBottom:20 }}>
            <div style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',
              letterSpacing:'.1em',color:T.ink4,marginBottom:8,padding:'0 2px' }}>
              {grupo}
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              {items.map(g=><GatilhoRow key={g.id} g={g} schedules={schedules}
                setSchedules={setSchedules} expandido={expandido}
                setExpandido={setExpandido} salvar={salvar}
                salvando={salvando} salvoOk={salvoOk}/>)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function GatilhoRow({ g, schedules, setSchedules, expandido, setExpandido, salvar, salvando, salvoOk }) {
  const isLocked  = ALWAYS_ON.has(g.id)
  const sch       = schedules[g.id] || {}
  const temJanela = !isLocked && sch.enabled
  const isOpen    = expandido === g.id
  const Ic        = g.icon || Zap
  const isSaving  = salvando === g.id
  const isSaved   = salvoOk  === g.id

  return (
    <div style={{
      borderRadius:12, overflow:'hidden',
      background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
      border:`1px solid ${isLocked?T.sep:temJanela?T.amberBor:T.sep2}`,
      boxShadow:temJanela?`0 4px 20px ${T.amber}10`:'0 4px 16px rgba(0,0,0,.2)',
      transition:'all .2s',
    }}>
      <div style={{ display:'flex',alignItems:'center',gap:12,padding:'11px 14px',
        cursor:isLocked?'default':'pointer' }}
        onClick={()=>!isLocked&&setExpandido(isOpen?null:g.id)}>
        {/* Ícone */}
        <div style={{ width:32,height:32,borderRadius:9,flexShrink:0,
          background:`${g.cor}18`,border:`1px solid ${g.cor}30`,
          display:'flex',alignItems:'center',justifyContent:'center' }}>
          <Ic size={14} style={{ color:g.cor }}/>
        </div>

        {/* Nome */}
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:2 }}>
            <span style={{ fontSize:13,fontWeight:600,color:T.ink1 }}>{g.label}</span>
            {isLocked && (
              <span style={{ display:'inline-flex',alignItems:'center',gap:3,
                fontSize:9,padding:'1px 7px',borderRadius:99,fontWeight:700,
                background:'rgba(255,255,255,.06)',color:T.ink4,
                border:`1px solid ${T.sep}` }}>
                <Lock size={7}/>SEMPRE ATIVO
              </span>
            )}
            {temJanela && !isLocked && (
              <span style={{ fontSize:9,padding:'1px 7px',borderRadius:99,fontWeight:700,
                background:T.amberDim,color:T.amber,border:`1px solid ${T.amberBor}` }}>
                ⏰ {sch.start_h}h–{sch.end_h}h
              </span>
            )}
          </div>
          {isLocked && (
            <span style={{ fontSize:10.5,color:T.ink4 }}>
              Disparo imediato — sem restrição de horário
            </span>
          )}
        </div>

        {/* Controles */}
        {!isLocked && (
          <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
            {isSaved && <Check size={13} style={{ color:T.green }}/>}
            {isSaving && <RefreshCw size={13} style={{ color:T.amber,animation:'cfg-spin 1s linear infinite' }}/>}
            <ChevronRight size={13} style={{ color:T.ink4,
              transform:isOpen?'rotate(90deg)':'rotate(0)',transition:'transform .2s' }}/>
          </div>
        )}
      </div>

      {/* Picker expandido */}
      {isOpen && !isLocked && (
        <div style={{ padding:'0 14px 14px',borderTop:`1px solid ${T.sep}` }}>
          <div style={{ paddingTop:12 }}>
            <HorarioPicker value={sch}
              onChange={novo=>setSchedules(prev=>({...prev,[g.id]:novo}))}
              gatilhoId={g.id}/>
            <div style={{ display:'flex',justifyContent:'flex-end',marginTop:10 }}>
              <button onClick={()=>salvar(g.id, schedules[g.id]||{})}
                disabled={isSaving}
                style={{ ...btn(T.amber), opacity:isSaving?.6:1 }}>
                {isSaving ? <><RefreshCw size={12} style={{ animation:'cfg-spin 1s linear infinite' }}/>Salvando...</> : <><Save size={12}/>Salvar horário</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. RASTREIO POR CANAL
// ─────────────────────────────────────────────────────────────────────────────
function SecaoRastreio({ api }) {
  const [canais,   setCanais]  = useState([])
  const [loading,  setLoading] = useState(true)
  const [salvando, setSalv]    = useState(false)
  const [ok,       setOk]      = useState(false)

  const CANAL_META = {
    loja:         { cor:'#1D9E75', lbl:'Loja Própria' },
    nuvemshop:    { cor:'#4f46e5', lbl:'Nuvemshop'   },
    mercadolivre: { cor:'#f5a623', lbl:'Mercado Livre'},
    shopee:       { cor:'#ee4d2d', lbl:'Shopee'       },
    shein:        { cor:'#000000', lbl:'Shein'        },
    tiktokshop:   { cor:'#ff0050', lbl:'TikTok Shop'  },
  }

  useEffect(()=>{
    fetch(`${api}/api/dashboard/operacao/canais`)
      .then(r=>r.json()).then(d=>{ setCanais(d.canais||[]); setLoading(false) })
      .catch(()=>setLoading(false))
  },[api])

  const salvar = async () => {
    setSalv(true)
    const payload={}; canais.forEach(c=>{ payload[c.id]=c.ativo })
    await fetch(`${api}/api/dashboard/operacao/canais`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({canais:payload})
    }).catch(()=>{})
    setOk(true); setTimeout(()=>setOk(false),2500)
    setSalv(false)
  }

  return (
    <div>
      <SectionHeader icon={Truck} title="Rastreio por Canal"
        desc="Canais próprios são monitorados ativamente. Marketplaces têm rastreio próprio."
        cor={T.green}/>
      {loading ? <div style={{ color:T.ink4,fontSize:12,textAlign:'center',padding:24 }}>Carregando...</div> : (
        <>
          <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:16 }}>
            {canais.map(c=>{
              const m = CANAL_META[c.id]||{cor:T.ink3,lbl:c.nome}
              return (
                <div key={c.id} style={{ display:'flex',alignItems:'center',gap:12,
                  padding:'12px 16px',borderRadius:12,
                  background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
                  border:`1px solid ${c.ativo?m.cor+'30':T.sep}`,
                  transition:'all .2s' }}>
                  <div style={{ width:8,height:8,borderRadius:'50%',flexShrink:0,
                    background:c.ativo?m.cor:T.ink4,
                    boxShadow:c.ativo?`0 0 8px ${m.cor}`:undefined }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:T.ink1 }}>{m.lbl}</div>
                    <div style={{ fontSize:10.5,color:T.ink4,marginTop:1 }}>{c.desc}</div>
                  </div>
                  {(c.naFila||0)>0 && (
                    <span style={{ fontSize:10,padding:'2px 8px',borderRadius:99,
                      background:T.amberDim,color:T.amber,border:`1px solid ${T.amberBor}`,
                      fontWeight:700 }}>{c.naFila} na fila</span>
                  )}
                  <button onClick={()=>setCanais(cs=>cs.map(x=>x.id===c.id?{...x,ativo:!x.ativo}:x))}
                    style={{ position:'relative',width:40,height:22,borderRadius:99,border:'none',
                      cursor:'pointer',
                      background:c.ativo?`linear-gradient(90deg,${m.cor},${m.cor}cc)`:'rgba(255,255,255,.1)',
                      boxShadow:c.ativo?`0 0 12px ${m.cor}40`:undefined,
                      transition:'all .22s' }}>
                    <span style={{ position:'absolute',top:3,height:16,width:16,
                      borderRadius:'50%',background:'#fff',
                      left:c.ativo?'calc(100% - 19px)':'3px',
                      transition:'left .18s' }}/>
                  </button>
                </div>
              )
            })}
          </div>
          <button onClick={salvar} disabled={salvando}
            style={{ ...btn(T.green), opacity:salvando?.6:1 }}>
            {ok ? <><Check size={12}/>Salvo!</> : <><Save size={12}/>Salvar canais</>}
          </button>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ATENDIMENTO & SLA
// ─────────────────────────────────────────────────────────────────────────────
function SecaoSLA({ api }) {
  const [sla, setSla] = useState({
    horario_inicio:8, horario_fim:22, dias:[1,2,3,4,5,6],
    sla_primeira_resposta_min:5, sla_resolucao_h:24,
    fora_horario_msg:'Olá! Nosso atendimento funciona das 8h às 22h. Retornaremos em breve!',
  })
  const [loading,  setLoading]  = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [ok,       setOk]       = useState(false)

  useEffect(()=>{
    fetch(`${api}/api/dashboard/config/sla`)
      .then(r=>r.json()).then(d=>{ if(d.sla) setSla(d.sla); setLoading(false) })
      .catch(()=>setLoading(false))
  },[api])

  const salvar = async () => {
    setSalvando(true)
    await fetch(`${api}/api/dashboard/config/sla`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({sla})
    }).catch(()=>{})
    setOk(true); setTimeout(()=>setOk(false),2500)
    setSalvando(false)
  }

  const Field = ({ label, children }) => (
    <div>
      <div style={{ fontSize:10.5,fontWeight:600,color:T.ink4,textTransform:'uppercase',
        letterSpacing:'.07em',marginBottom:7 }}>{label}</div>
      {children}
    </div>
  )

  if (loading) return <div style={{ color:T.ink4,textAlign:'center',padding:24 }}>Carregando...</div>

  return (
    <div>
      <SectionHeader icon={Clock} title="Atendimento & SLA"
        desc="Defina o horário de atendimento humano e os SLAs de resposta"
        cor={T.cyan}/>

      <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
        <Card>
          <div style={{ fontSize:13,fontWeight:700,color:T.ink1,marginBottom:14,
            display:'flex',alignItems:'center',gap:7 }}>
            <Clock size={14} style={{ color:T.cyan }}/> Horário de funcionamento
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:14 }}>
            <Field label="Abertura">
              <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
                {[6,7,8,9,10,11,12].map(h=>(
                  <button key={h} onClick={()=>setSla(s=>({...s,horario_inicio:h}))}
                    style={{ width:36,height:28,borderRadius:7,border:'none',cursor:'pointer',
                      fontSize:10.5,fontWeight:600,transition:'all .12s',
                      background:sla.horario_inicio===h?T.cyan:T.bg4,
                      color:sla.horario_inicio===h?'#000':T.ink4,
                      boxShadow:sla.horario_inicio===h?`0 2px 8px ${T.cyan}40`:undefined }}>
                    {h}h
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Fechamento">
              <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
                {[18,19,20,21,22,23,0].map(h=>(
                  <button key={h} onClick={()=>setSla(s=>({...s,horario_fim:h||24}))}
                    style={{ width:36,height:28,borderRadius:7,border:'none',cursor:'pointer',
                      fontSize:10.5,fontWeight:600,transition:'all .12s',
                      background:sla.horario_fim===(h||24)?T.cyan:T.bg4,
                      color:sla.horario_fim===(h||24)?'#000':T.ink4,
                      boxShadow:sla.horario_fim===(h||24)?`0 2px 8px ${T.cyan}40`:undefined }}>
                    {h===0?'24':h}h
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <Field label="Dias de atendimento">
            <div style={{ display:'flex',gap:5 }}>
              {DIAS_SEMANA.map((d,i)=>{
                const ativo = sla.dias?.includes(i)
                return (
                  <button key={i} onClick={()=>setSla(s=>({...s,
                    dias:ativo?s.dias.filter(x=>x!==i):[...s.dias,i].sort()
                  }))}
                    style={{ width:38,height:32,borderRadius:8,border:'none',cursor:'pointer',
                      fontSize:10.5,fontWeight:700,transition:'all .12s',
                      background:ativo?T.cyan:T.bg4,
                      color:ativo?'#000':T.ink4,
                      boxShadow:ativo?`0 2px 8px ${T.cyan}40`:undefined }}>
                    {d}
                  </button>
                )
              })}
            </div>
          </Field>
        </Card>

        <Card>
          <div style={{ fontSize:13,fontWeight:700,color:T.ink1,marginBottom:14,
            display:'flex',alignItems:'center',gap:7 }}>
            <Activity size={14} style={{ color:T.purple }}/> Metas de SLA
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
            <Field label="1ª resposta (minutos)">
              <input type="number" value={sla.sla_primeira_resposta_min}
                onChange={e=>setSla(s=>({...s,sla_primeira_resposta_min:parseInt(e.target.value)||0}))}
                min={1} max={120}
                style={{ width:'100%',padding:'9px 12px',borderRadius:9,
                  background:T.bg3,border:`1px solid ${T.sep}`,
                  color:T.ink1,fontSize:14,fontWeight:700,outline:'none' }}/>
            </Field>
            <Field label="Resolução (horas)">
              <input type="number" value={sla.sla_resolucao_h}
                onChange={e=>setSla(s=>({...s,sla_resolucao_h:parseInt(e.target.value)||0}))}
                min={1} max={168}
                style={{ width:'100%',padding:'9px 12px',borderRadius:9,
                  background:T.bg3,border:`1px solid ${T.sep}`,
                  color:T.ink1,fontSize:14,fontWeight:700,outline:'none' }}/>
            </Field>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize:13,fontWeight:700,color:T.ink1,marginBottom:10,
            display:'flex',alignItems:'center',gap:7 }}>
            <Moon size={14} style={{ color:T.amber }}/> Mensagem fora do horário
          </div>
          <textarea value={sla.fora_horario_msg}
            onChange={e=>setSla(s=>({...s,fora_horario_msg:e.target.value}))}
            rows={3}
            style={{ width:'100%',padding:'10px 12px',borderRadius:9,resize:'vertical',
              background:T.bg3,border:`1px solid ${T.sep}`,color:T.ink1,
              fontSize:13,lineHeight:1.6,outline:'none',fontFamily:'inherit' }}/>
          <div style={{ fontSize:10,color:T.ink4,marginTop:5 }}>
            A IA envia esta mensagem quando o cliente contata fora do horário definido.
          </div>
        </Card>

        <button onClick={salvar} disabled={salvando}
          style={{ ...btn(T.cyan),alignSelf:'flex-start',opacity:salvando?.6:1 }}>
          {ok ? <><Check size={12}/>Salvo!</> : <><Save size={12}/>Salvar SLA</>}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. BLACKLIST & OPT-OUT
// ─────────────────────────────────────────────────────────────────────────────
function SecaoBlacklist({ api }) {
  const [phones,   setPhones]   = useState([])
  const [keywords, setKeywords] = useState([])
  const [novoTel,  setNovoTel]  = useState('')
  const [novaKw,   setNovaKw]   = useState('')
  const [salvando, setSalvando] = useState(false)
  const [ok,       setOk]       = useState(false)

  useEffect(()=>{
    fetch(`${api}/api/dashboard/config/blacklist`)
      .then(r=>r.json()).then(d=>{ setPhones(d.phones||[]); setKeywords(d.keywords||[]) })
      .catch(()=>{})
  },[api])

  const salvar = async () => {
    setSalvando(true)
    await fetch(`${api}/api/dashboard/config/blacklist`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ phones, keywords })
    }).catch(()=>{})
    setOk(true); setTimeout(()=>setOk(false),2500)
    setSalvando(false)
  }

  const addTel = () => {
    const t = novoTel.replace(/\D/g,'')
    if (t.length >= 10 && !phones.includes(t)) { setPhones(p=>[...p,t]); setNovoTel('') }
  }
  const addKw = () => {
    const k = novaKw.trim().toLowerCase()
    if (k && !keywords.includes(k)) { setKeywords(p=>[...p,k]); setNovaKw('') }
  }

  return (
    <div>
      <SectionHeader icon={ShieldOff} title="Blacklist & Opt-out"
        desc="Números bloqueados não recebem nenhuma mensagem automática. Palavras-chave ativam opt-out."
        cor={T.red}/>

      <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
        {/* Números */}
        <Card>
          <div style={{ fontSize:13,fontWeight:700,color:T.ink1,marginBottom:12,
            display:'flex',alignItems:'center',gap:7 }}>
            <ShieldOff size={14} style={{ color:T.red }}/> Números bloqueados
            <span style={{ fontSize:10,padding:'2px 8px',borderRadius:99,marginLeft:'auto',
              background:T.redDim,color:T.red,border:`1px solid ${T.redBor}`,fontWeight:700 }}>
              {phones.length}
            </span>
          </div>
          <div style={{ display:'flex',gap:8,marginBottom:12 }}>
            <input value={novoTel} onChange={e=>setNovoTel(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&addTel()}
              placeholder="55119... (com DDI)"
              style={{ flex:1,padding:'8px 12px',borderRadius:9,
                background:T.bg3,border:`1px solid ${T.sep}`,
                color:T.ink1,fontSize:13,outline:'none',fontFamily:'monospace' }}/>
            <button onClick={addTel} style={{ ...btn(T.red),padding:'8px 14px' }}>
              <Plus size={13}/>
            </button>
          </div>
          <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
            {phones.length===0
              ? <span style={{ fontSize:12,color:T.ink4 }}>Nenhum número bloqueado</span>
              : phones.map(p=><Chip key={p} label={p} cor={T.red}
                  onRemove={()=>setPhones(prev=>prev.filter(x=>x!==p))}/>)}
          </div>
        </Card>

        {/* Palavras-chave opt-out */}
        <Card>
          <div style={{ fontSize:13,fontWeight:700,color:T.ink1,marginBottom:12,
            display:'flex',alignItems:'center',gap:7 }}>
            <Bell size={14} style={{ color:T.amber }}/> Palavras-chave de opt-out
            <span style={{ fontSize:10,padding:'2px 8px',borderRadius:99,marginLeft:'auto',
              background:T.amberDim,color:T.amber,border:`1px solid ${T.amberBor}`,fontWeight:700 }}>
              {keywords.length}
            </span>
          </div>
          <div style={{ fontSize:11.5,color:T.ink4,marginBottom:10,lineHeight:1.6 }}>
            Quando o cliente enviar estas palavras, a IA pausa os disparos automáticos
            para o número e registra o opt-out. Ex: "SAIR", "PARAR", "CANCELAR".
          </div>
          <div style={{ display:'flex',gap:8,marginBottom:12 }}>
            <input value={novaKw} onChange={e=>setNovaKw(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&addKw()}
              placeholder="Ex: sair, parar, cancelar"
              style={{ flex:1,padding:'8px 12px',borderRadius:9,
                background:T.bg3,border:`1px solid ${T.sep}`,
                color:T.ink1,fontSize:13,outline:'none',fontFamily:'inherit' }}/>
            <button onClick={addKw} style={{ ...btn(T.amber),padding:'8px 14px' }}>
              <Plus size={13}/>
            </button>
          </div>
          <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
            {keywords.length===0
              ? <span style={{ fontSize:12,color:T.ink4 }}>Nenhuma palavra cadastrada</span>
              : keywords.map(k=><Chip key={k} label={k} cor={T.amber}
                  onRemove={()=>setKeywords(prev=>prev.filter(x=>x!==k))}/>)}
          </div>
        </Card>

        <button onClick={salvar} disabled={salvando}
          style={{ ...btn(T.red),alignSelf:'flex-start',opacity:salvando?.6:1 }}>
          {ok ? <><Check size={12}/>Salvo!</> : <><Save size={12}/>Salvar blacklist</>}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. EXPORTAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
function SecaoExportacao({ api }) {
  const hoje = new Date().toISOString().split('T')[0]
  const [from,   setFrom]   = useState(new Date(Date.now()-30*86400000).toISOString().split('T')[0])
  const [to,     setTo]     = useState(hoje)
  const [fmt,    setFmt]    = useState('csv')
  const [gat,    setGat]    = useState('')
  const [baixando,setBaix]  = useState(false)

  const exportar = async () => {
    setBaix(true)
    const params = new URLSearchParams({ from, to, formato:fmt })
    if (gat) params.set('gatilho', gat)
    try {
      const r = await fetch(`${api}/api/dashboard/config/export?${params}`)
      if (fmt==='csv') {
        const blob = await r.blob()
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href=url; a.download=`disparos_${from}_${to}.csv`; a.click()
        URL.revokeObjectURL(url)
      } else {
        const d = await r.json()
        const blob = new Blob([JSON.stringify(d,null,2)],{type:'application/json'})
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href=url; a.download=`disparos_${from}_${to}.json`; a.click()
        URL.revokeObjectURL(url)
      }
    } catch {}
    setBaix(false)
  }

  const InputDate = ({value,onChange,label}) => (
    <div>
      <div style={{ fontSize:10.5,color:T.ink4,textTransform:'uppercase',
        letterSpacing:'.07em',marginBottom:7,fontWeight:600 }}>{label}</div>
      <input type="date" value={value} onChange={e=>onChange(e.target.value)}
        style={{ padding:'9px 12px',borderRadius:9,background:T.bg3,
          border:`1px solid ${T.sep}`,color:T.ink1,fontSize:13,outline:'none',
          fontFamily:'inherit',width:'100%' }}/>
    </div>
  )

  return (
    <div>
      <SectionHeader icon={Download} title="Exportação"
        desc="Exporte o histórico de disparos em CSV ou JSON para análise externa"
        cor={T.blue}/>

      <Card style={{ marginBottom:16 }}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14 }}>
          <InputDate label="De" value={from} onChange={setFrom}/>
          <InputDate label="Até" value={to} onChange={setTo}/>
        </div>

        {/* Gatilho filtro */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10.5,color:T.ink4,textTransform:'uppercase',
            letterSpacing:'.07em',marginBottom:7,fontWeight:600 }}>
            Filtrar gatilho (opcional)
          </div>
          <select value={gat} onChange={e=>setGat(e.target.value)}
            style={{ width:'100%',padding:'9px 12px',borderRadius:9,
              background:T.bg3,border:`1px solid ${T.sep}`,color:T.ink1,
              fontSize:13,outline:'none',fontFamily:'inherit' }}>
            <option value="">Todos os gatilhos</option>
            {GATILHOS_DEF.map(g=>(
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </div>

        {/* Formato */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:10.5,color:T.ink4,textTransform:'uppercase',
            letterSpacing:'.07em',marginBottom:7,fontWeight:600 }}>Formato</div>
          <div style={{ display:'flex',gap:8 }}>
            {['csv','json'].map(f=>(
              <button key={f} onClick={()=>setFmt(f)}
                style={{ padding:'8px 20px',borderRadius:9,border:'none',cursor:'pointer',
                  fontSize:12,fontWeight:700,textTransform:'uppercase',
                  background:fmt===f?T.blue:T.bg3,
                  color:fmt===f?'#fff':T.ink4,
                  boxShadow:fmt===f?`0 3px 12px ${T.blue}35`:undefined,
                  transition:'all .15s' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <button onClick={exportar} disabled={baixando}
          style={{ ...btn(T.blue),opacity:baixando?.6:1 }}>
          {baixando
            ? <><RefreshCw size={13} style={{ animation:'cfg-spin 1s linear infinite' }}/>Baixando...</>
            : <><FileDown size={13}/>Exportar {fmt.toUpperCase()}</>}
        </button>
      </Card>

      <div style={{ padding:'12px 14px',borderRadius:11,
        background:T.blueDim,border:`1px solid ${T.blueBor}`,
        fontSize:11.5,color:T.blue,lineHeight:1.6 }}>
        <strong>CSV</strong> — compatível com Excel, Google Sheets e ferramentas de BI.{' '}
        <strong>JSON</strong> — ideal para integração com APIs e sistemas externos.
        Máximo de 5.000 registros por exportação.
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. AUDITORIA
// ─────────────────────────────────────────────────────────────────────────────
function SecaoAuditoria({ api }) {
  const [audit,   setAudit]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    fetch(`${api}/api/dashboard/config/audit`)
      .then(r=>r.json()).then(d=>{ setAudit(d); setLoading(false) })
      .catch(()=>setLoading(false))
  },[api])

  const tempoRel = (iso) => {
    if (!iso) return '—'
    const m = Math.floor((Date.now()-new Date(iso))/60000)
    if (m<1) return 'agora'
    if (m<60) return `${m}min`
    if (m<1440) return `${Math.floor(m/60)}h`
    return `${Math.floor(m/1440)}d`
  }

  return (
    <div>
      <SectionHeader icon={History} title="Auditoria"
        desc="Registro de todas as alterações de configuração e templates"
        cor={T.ink3}/>

      {loading ? (
        <div style={{ textAlign:'center',padding:32,color:T.ink4 }}>
          <RefreshCw size={16} style={{ animation:'cfg-spin 1s linear infinite',
            display:'block',margin:'0 auto 8px' }}/>Carregando...
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {/* Templates */}
          {(audit?.template_changes||[]).length > 0 && (
            <Card>
              <div style={{ fontSize:13,fontWeight:700,color:T.ink1,marginBottom:12,
                display:'flex',alignItems:'center',gap:7 }}>
                <Zap size={14} style={{ color:T.amber }}/> Mudanças em templates
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                {audit.template_changes.map((t,i)=>(
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:10,
                    padding:'8px 10px',borderRadius:9,background:T.bg4,
                    border:`1px solid ${T.sep}` }}>
                    <div style={{ width:6,height:6,borderRadius:'50%',flexShrink:0,
                      background:t.ativo?T.green:T.red,
                      boxShadow:`0 0 5px ${t.ativo?T.green:T.red}` }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12,fontWeight:600,color:T.ink1 }}>
                        {t.nome||t.gatilho}
                        <span style={{ fontSize:10,fontWeight:400,color:T.ink4,marginLeft:6 }}>
                          — {t.ativo?'ativado':'desativado'}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize:10,color:T.ink4 }}>{tempoRel(t.atualizado_em)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Config changes */}
          {(audit?.config_changes||[]).length > 0 && (
            <Card>
              <div style={{ fontSize:13,fontWeight:700,color:T.ink1,marginBottom:12,
                display:'flex',alignItems:'center',gap:7 }}>
                <Settings2 size={14} style={{ color:T.purple }}/> Mudanças de configuração
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                {audit.config_changes.map((c,i)=>(
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:10,
                    padding:'8px 10px',borderRadius:9,background:T.bg4,
                    border:`1px solid ${T.sep}` }}>
                    <History size={11} style={{ color:T.ink4,flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12,color:T.ink2 }}>
                        <strong style={{ color:T.ink1 }}>{c.chave}</strong>
                      </div>
                    </div>
                    <span style={{ fontSize:10,color:T.ink4 }}>{tempoRel(c.ts)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(!audit?.template_changes?.length && !audit?.config_changes?.length) && (
            <div style={{ textAlign:'center',padding:'32px 0',color:T.ink4 }}>
              <History size={24} style={{ opacity:.2,display:'block',margin:'0 auto 8px' }}/>
              <p style={{ fontSize:12,margin:0 }}>Nenhuma alteração registrada nos últimos 30 dias</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVEGAÇÃO LATERAL
// ─────────────────────────────────────────────────────────────────────────────
const SECOES = [
  { id:'visao',     label:'Visão Geral',       icon:LayoutDashboard, cor:T.purple, desc:'Status geral'          },
  { id:'gatilhos',  label:'Gatilhos & Horários',icon:Zap,             cor:T.amber,  desc:'Schedules por gatilho', badge:'novo' },
  { id:'rastreio',  label:'Rastreio por Canal', icon:Truck,            cor:T.green,  desc:'Canais ativos'         },
  { id:'sla',       label:'Atendimento & SLA',  icon:Clock,            cor:T.cyan,   desc:'Horário + SLA'         },
  { id:'blacklist', label:'Blacklist & Opt-out',icon:ShieldOff,        cor:T.red,    desc:'Números bloqueados'    },
  { id:'export',    label:'Exportação',          icon:Download,         cor:T.blue,   desc:'CSV / JSON'            },
  { id:'auditoria', label:'Auditoria',           icon:History,          cor:T.ink3,   desc:'Log de mudanças'       },
]

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function PageCentralConfig({ api=API }) {
  const [secao, setSecao] = useState('visao')
  const conteudoRef = useRef()

  const goTo = (id) => {
    setSecao(id)
    conteudoRef.current?.scrollTo({ top:0, behavior:'smooth' })
  }

  const renderSecao = () => {
    switch(secao) {
      case 'visao':     return <SecaoVisaoGeral onGoTo={goTo}/>
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
    <div style={{ display:'flex',height:'100%',background:T.bg0,overflow:'hidden' }}>
      <style>{`
        @keyframes cfg-spin   { to{transform:rotate(360deg)} }
        @keyframes cfg-fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── PAINEL LATERAL ──────────────────────────────────────────── */}
      <aside style={{
        width:256, flexShrink:0, display:'flex', flexDirection:'column',
        background:`linear-gradient(180deg,${T.bg2} 0%,${T.bg1} 100%)`,
        borderRight:`1px solid ${T.sep}`,
        boxShadow:`4px 0 20px rgba(0,0,0,.3)`,
      }}>
        {/* Header */}
        <div style={{ padding:'22px 18px 16px',borderBottom:`1px solid ${T.sep}` }}>
          <div style={{ display:'flex',alignItems:'center',gap:11,marginBottom:4 }}>
            <div style={{ width:38,height:38,borderRadius:12,flexShrink:0,
              background:'linear-gradient(135deg,rgba(167,139,250,.3),rgba(167,139,250,.12))',
              border:`1.5px solid ${T.purpleBor}`,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:`0 4px 16px ${T.purple}25` }}>
              <Settings2 size={17} style={{ color:T.purple }}/>
            </div>
            <div>
              <div style={{ fontSize:15,fontWeight:800,color:T.ink1,letterSpacing:'-.02em' }}>
                Configurações
              </div>
              <div style={{ fontSize:10,color:T.ink4,marginTop:1 }}>Central de controle</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1,overflowY:'auto',padding:'10px 8px' }}>
          {SECOES.map(s => {
            const ativa = secao === s.id
            return (
              <button key={s.id} onClick={()=>goTo(s.id)}
                style={{
                  width:'100%',display:'flex',alignItems:'center',gap:10,
                  padding:'9px 10px',borderRadius:11,border:'none',cursor:'pointer',
                  marginBottom:3,textAlign:'left',position:'relative',
                  background:ativa?`${s.cor}14`:'transparent',
                  transition:'all .14s',
                }}>
                {/* Accent bar */}
                <div style={{ position:'absolute',left:0,top:'20%',bottom:'20%',
                  width:3,borderRadius:'0 2px 2px 0',
                  background:ativa?`linear-gradient(180deg,${s.cor},${s.cor}70)`:'transparent',
                  boxShadow:ativa?`0 0 8px ${s.cor}60`:undefined }}/>

                {/* Ícone */}
                <div style={{ width:30,height:30,borderRadius:9,flexShrink:0,
                  background:ativa?`${s.cor}22`:'rgba(255,255,255,.04)',
                  border:`1px solid ${ativa?s.cor+'40':'rgba(255,255,255,.05)'}`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  boxShadow:ativa?`0 2px 10px ${s.cor}20`:undefined,
                  transition:'all .18s' }}>
                  <s.icon size={13} style={{ color:ativa?s.cor:T.ink4,transition:'color .14s' }}/>
                </div>

                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                    <span style={{ fontSize:12.5,fontWeight:ativa?700:500,
                      color:ativa?s.cor:T.ink3,letterSpacing:'-.01em',
                      transition:'all .14s' }}>
                      {s.label}
                    </span>
                    {s.badge && (
                      <span style={{ fontSize:8.5,padding:'1px 6px',borderRadius:99,
                        background:`${s.cor}20`,color:s.cor,
                        border:`1px solid ${s.cor}35`,fontWeight:700,
                        letterSpacing:'.04em',textTransform:'uppercase' }}>
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:10,color:T.ink4,marginTop:1 }}>{s.desc}</div>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Footer info */}
        <div style={{ padding:'12px 16px',borderTop:`1px solid ${T.sep}` }}>
          <div style={{ fontSize:10.5,color:T.ink4,lineHeight:1.5 }}>
            Configurações salvas em tempo real no banco de dados.
            O sistema aplica as mudanças no próximo ciclo de operação.
          </div>
        </div>
      </aside>

      {/* ── CONTEÚDO PRINCIPAL ──────────────────────────────────────── */}
      <main ref={conteudoRef} style={{
        flex:1, overflowY:'auto', padding:'32px 36px',
        background:T.bg0,
      }}>
        <div style={{ maxWidth:780, margin:'0 auto', animation:'cfg-fadeIn .3s ease' }}
          key={secao}>
          {renderSecao()}
        </div>
      </main>
    </div>
  )
}
