import { useState, useEffect, useRef } from 'react'
import {
  Bot, User, Clock, Grid3x3, Workflow, Plug, Package,
  Save, CheckCircle, RefreshCw, ChevronDown, ChevronUp,
  Plus, Trash2, Sparkles, Eye, EyeOff, Copy, Check,
  ToggleLeft, ToggleRight, AlertCircle, Smile, SmilePlus,
  Pencil, Server
} from 'lucide-react'

// ── Constantes de dados ───────────────────────────────────────────────────────
const TONS = ['Simpático','Direto','Profissional','Descontraído','Prestativo','Entusiasmado','Conciso','Formal']
const ALIASES = ['{nome_cliente}','{produto}','{valor_pix}','{valor_cartao}','{numero_pedido}','{loja}','{prazo_entrega}','{nome_ia}']
const DIAS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']

const CONTEXTS = [
  { id:'saudacao', label:'Saudação inicial', cor:'#00d4aa',
    default:'Olá! Seja bem-vindo(a) à {loja}! Sou a {nome_ia}. Como posso te ajudar hoje?', vars:[] },
  { id:'produto',  label:'Produto encontrado', cor:'#a78bfa',
    default:'*{produto}*\n───────────────\nPIX: R$ {valor_pix} | Cartão: R$ {valor_cartao}', vars:[] },
  { id:'carrinho', label:'Item adicionado', cor:'#f59e0b',
    default:'*{produto}* adicionado ao carrinho.', vars:['Ótimo! *{produto}* está no seu carrinho.'] },
  { id:'pedido',   label:'Pedido finalizado', cor:'#22c55e',
    default:'*Pedido #{numero_pedido} criado!*\nPIX: R$ {valor_pix}\nAcesse o link para pagar:', vars:[] },
  { id:'offline',  label:'Fora do horário', cor:'#60a5fa',
    default:'Olá! No momento estamos fora do horário.\nNosso horário: seg-sex, 8h às 18h.\nDeixe sua mensagem!', vars:[] },
]

const BTN_GROUPS = [
  { label:'Produto encontrado', btns:[
    {label:'Adicionar ao carrinho',on:true},{label:'Ver foto',on:true},{label:'Tirar dúvida',on:true}
  ]},
  { label:'Resumo do carrinho', btns:[
    {label:'Finalizar pedido',on:true},{label:'Adicionar item',on:true},{label:'Editar carrinho',on:true}
  ]},
  { label:'Confirmação endereço', btns:[
    {label:'Confirmar endereço',on:true},{label:'Alterar endereço',on:true}
  ]},
]

// ── Design system ─────────────────────────────────────────────────────────────
const ds = {
  card: 'rounded-2xl',
  cardStyle: { background:'var(--bg-2)', border:'1px solid var(--sep)' },
  input: 'w-full px-3 py-2 rounded-xl text-[13px] outline-none transition-all',
  inputStyle: { background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)', fontFamily:'inherit' },
  inputFocus: { borderColor:'var(--accent)', boxShadow:'0 0 0 3px var(--accent-dim)' },
  label: 'text-[11px] font-semibold uppercase tracking-wider mb-1.5 block',
  labelStyle: { color:'var(--label-4)' },
}

// ── Componentes ───────────────────────────────────────────────────────────────
function FocusInput({ value, onChange, type='text', placeholder, rows, mono=false, ...rest }) {
  const [focused, setFocused] = useState(false)
  const style = { ...ds.inputStyle, ...(focused ? ds.inputFocus : {}) }
  if (rows) return (
    <textarea rows={rows} value={value||''} onChange={onChange} placeholder={placeholder}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
      className={`${ds.input} resize-y leading-relaxed ${mono?'font-mono text-[12px]':''}`}
      style={style} {...rest}/>
  )
  return (
    <input type={type} value={value||''} onChange={onChange} placeholder={placeholder}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
      className={ds.input} style={style} {...rest}/>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      {label && <label className={ds.label} style={ds.labelStyle}>{label}</label>}
      {children}
      {hint && <p className="text-[10px] mt-1" style={{ color:'var(--label-4)' }}>{hint}</p>}
    </div>
  )
}

function Section({ title, children, action }) {
  return (
    <div className={`${ds.card} p-5`} style={ds.cardStyle}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] font-semibold" style={{ color:'var(--label)' }}>{title}</p>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function CtxEditor({ ctx, data, onChange, onGenerate, loading }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const def = data?.default || ctx.default
  const vars = data?.vars || ctx.vars || []

  const addVar = () => onChange({ ...data, vars:[...vars,''] })
  const rmVar  = i => onChange({ ...data, vars:vars.filter((_,idx)=>idx!==i) })
  const setVar = (i,v)=> onChange({ ...data, vars:vars.map((x,idx)=>idx===i?v:x) })
  const setDef = v => onChange({ ...data, default:v })

  return (
    <div className={`${ds.card} overflow-hidden`} style={ds.cardStyle}>
      <button onClick={()=>setOpen(v=>!v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:ctx.cor }}/>
          <span className="text-[13px] font-medium" style={{ color:'var(--label)' }}>{ctx.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background:'var(--fill)', color:'var(--label-4)' }}>
            {vars.length} variação{vars.length!==1?'ões':''}
          </span>
          {open ? <ChevronUp size={13} style={{ color:'var(--label-4)' }}/> : <ChevronDown size={13} style={{ color:'var(--label-4)' }}/>}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4" style={{ borderTop:'1px solid var(--sep)' }}>
          <div className="pt-4 space-y-3">
            {/* Mensagem padrão */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={ds.label} style={ds.labelStyle}>Mensagem padrão</label>
                <button onClick={()=>{navigator.clipboard.writeText(def);setCopied(true);setTimeout(()=>setCopied(false),2000)}}
                  className="flex items-center gap-1 text-[10px]" style={{ color:'var(--label-4)' }}>
                  {copied?<><Check size={9} style={{ color:'#22c55e' }}/> Copiado</>:<><Copy size={9}/> Copiar</>}
                </button>
              </div>
              <FocusInput rows={3} mono value={def} onChange={e=>setDef(e.target.value)}/>
            </div>

            {/* Variações */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={ds.label} style={ds.labelStyle}>Variações (A/B)</label>
                <div className="flex gap-1.5">
                  <button onClick={()=>onGenerate && onGenerate(ctx.id)}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px]"
                    style={{ background:'rgba(0,212,170,.1)', color:'#00d4aa', border:'1px solid rgba(0,212,170,.2)' }}>
                    {loading ? <RefreshCw size={10} className="animate-spin"/> : <Sparkles size={10}/>}
                    Gerar com IA
                  </button>
                  <button onClick={addVar}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px]"
                    style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>
                    <Plus size={10}/> Adicionar
                  </button>
                </div>
              </div>
              {vars.length===0 && (
                <p className="text-[11px] py-3 text-center" style={{ color:'var(--label-4)' }}>
                  Nenhuma variação. A mensagem padrão será sempre usada.
                </p>
              )}
              <div className="space-y-2">
                {vars.map((v,i)=>(
                  <div key={i} className="flex gap-2">
                    <FocusInput rows={2} mono value={v} onChange={e=>setVar(i,e.target.value)} className="flex-1 text-[12px]" style={{ ...ds.inputStyle, resize:'vertical' }}/>
                    <button onClick={()=>rmVar(i)} className="px-2 rounded-lg self-start mt-1"
                      style={{ background:'rgba(239,68,68,.1)', color:'#ef4444' }}><Trash2 size={12}/></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Aliases */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ALIASES.map(a=>(
                <code key={a} className="text-[9px] px-1.5 py-0.5 rounded-md cursor-pointer"
                  style={{ background:'var(--fill)', color:'var(--label-4)', border:'1px solid var(--sep)' }}
                  onClick={()=>setDef(def+a)}>{a}</code>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={()=>onChange(!on)} className="flex-shrink-0">
      {on
        ? <ToggleRight size={20} style={{ color:'var(--accent)' }}/>
        : <ToggleLeft  size={20} style={{ color:'var(--label-4)' }}/>}
    </button>
  )
}

// ── PhonePreview ──────────────────────────────────────────────────────────────
function PhonePreview({ nome, msg }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-[24px] overflow-hidden w-[200px]" style={{ background:'#0b141a', border:'2px solid var(--sep)', aspectRatio:'9/16' }}>
        {/* Header WA */}
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ background:'#202c33' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background:'var(--accent)' }}>
            {(nome||'?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-[11px] font-semibold" style={{ color:'#e9edef' }}>{nome||'Assistente'}</div>
            <div className="text-[9px]" style={{ color:'#8696a0' }}>online</div>
          </div>
        </div>
        {/* Chat */}
        <div className="p-3 space-y-2" style={{ background:'#0b141a' }}>
          <div className="ml-auto max-w-[140px] px-3 py-2 rounded-[12px] rounded-tr-[3px]"
            style={{ background:'#005c4b' }}>
            <p className="text-[10px] leading-relaxed" style={{ color:'#e9edef' }}>Olá!</p>
          </div>
          <div className="max-w-[150px] px-3 py-2 rounded-[12px] rounded-tl-[3px]"
            style={{ background:'#202c33' }}>
            <p className="text-[10px] leading-relaxed whitespace-pre-wrap" style={{ color:'#e9edef' }}>
              {(msg||'...').slice(0,120)}
            </p>
          </div>
        </div>
      </div>
      <p className="text-[10px] mt-2" style={{ color:'var(--label-4)' }}>Preview ao vivo</p>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function PageIAConfig({ api }) {
  const [section, setSection] = useState('identidade')
  const [saved,   setSaved]   = useState(false)
  const [iaName,  setIaName]  = useState('Molise')
  const [iaPersona, setIaPersona] = useState('Você é Molise, assistente virtual da Só Strass. Seja simpática e objetiva.')
  const [tons,    setTons]    = useState(['Simpático','Profissional'])
  const [emoji,   setEmoji]   = useState(true)
  const [ctxData, setCtxData] = useState({})
  const [btns,    setBtns]    = useState(BTN_GROUPS)
  const [schedule,setSchedule]= useState(DIAS.map((d,i)=>({ day:d, on:i<6, start:i===5?'09:00':'08:00', end:i===5?'14:00':'18:00' })))
  const [cfg,     setCfg]     = useState({})
  const [genLoading, setGenLoading] = useState(false)
  const [genCtx, setGenCtx]  = useState(null)

  // Carrega do banco
  useEffect(()=>{
    if (!api) return
    fetch(`${api}/api/ia/config`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        if (!d) return
        if (d.persona || d.iaPersona) setIaPersona(d.persona || d.iaPersona)
        if (d.iaName)   setIaName(d.iaName)
        if (d.btns)     setBtns(d.btns)
        if (d.schedule) setSchedule(d.schedule)
        if (d.tons)     setTons(d.tons)
        if (d.emoji !== undefined) setEmoji(d.emoji)
        if (d.ctxData)  setCtxData(d.ctxData)
        setCfg({
          provedor: d.provedor||'google', modelo: d.modelo||'gemini-2.5-flash',
          geminiKey: d.geminiKey||'', claudeKey: d.claudeKey||'',
          temperatura: d.temperatura||'0.7', maxTokens: d.maxTokens||4000,
          melhorEnvioToken: d.melhorEnvioToken||'',
          correiosUsuario: d.correiosUsuario||'', correiosCartao: d.correiosCartao||'',
          correiosContrato: d.correiosContrato||'', correiosApiKey: d.correiosApiKey||'',
          pixChave: d.pixChave||'', cepOrigem: d.cepOrigem||'',
          caixaAltura: d.caixaAltura||'8', caixaLargura: d.caixaLargura||'26',
          caixaComprimento: d.caixaComprimento||'16', caixaPesoMinimo: d.caixaPesoMinimo||'0.3',
          nomeLoja: d.nomeLoja||'Só Strass', horarioAtendimento: d.horarioAtendimento||'08:00-18:00',
          diasAtendimento: d.diasAtendimento||'seg-sex',
        })
      }).catch(()=>{})
  },[api])

  const setC = (k,v) => setCfg(c=>({...c,[k]:v}))

  const salvar = async () => {
    setSaved(true); setTimeout(()=>setSaved(false), 2500)
    if (!api) return
    try {
      await fetch(`${api}/api/ia/config`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ iaName, iaPersona, persona:iaPersona, tons, emoji, ctxData, btns, schedule, ...cfg })
      })
    } catch {}
  }

  const gerarVariacoes = async (ctxId) => {
    setGenLoading(true); setGenCtx(ctxId)
    const ctxMap = {
      saudacao:'mensagem de saudação de assistente virtual de loja de bijuterias. Tom acolhedor.',
      produto:'apresentação de produto em loja de strass. Use {produto}, {valor_pix}, {valor_cartao}.',
      carrinho:'confirmação de item adicionado ao carrinho. Use {produto}.',
      pedido:'confirmação de pedido criado. Use {numero_pedido}, {valor_pix}.',
      offline:'mensagem automática fora do horário de atendimento.'
    }
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:600,
          messages:[{role:'user',content:`Gere 2 variações curtas de ${ctxMap[ctxId]||ctxId}. Responda APENAS com as 2 frases separadas por ---. Sem numeração.`}] })
      })
      const d = await r.json()
      const parts = (d.content?.[0]?.text||'').split('---').map(s=>s.trim()).filter(Boolean)
      if (parts.length) {
        const ctx = CONTEXTS.find(c=>c.id===ctxId)
        if (ctx) setCtxData(prev=>({...prev,[ctxId]:{ ...(prev[ctxId]||{}), vars:[...(prev[ctxId]?.vars||[]),...parts] }}))
      }
    } catch {}
    setGenLoading(false); setGenCtx(null)
  }

  const saudacaoMsg = ctxData['saudacao']?.default || CONTEXTS[0].default

  const NAVS = [
    { id:'identidade', icon:Bot,         label:'Identidade' },
    { id:'mensagens',  icon:Pencil,       label:'Mensagens' },
    { id:'botoes',     icon:Grid3x3,      label:'Botões' },
    { id:'horario',    icon:Clock,        label:'Horário' },
    { id:'integracoes',icon:Plug,         label:'Integrações' },
    { id:'logistica',  icon:Package,      label:'Logística' },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background:'var(--bg)' }}>

      {/* ── Header ── */}
      <div className="px-6 py-4 flex-shrink-0 flex items-center justify-between"
        style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
        <div>
          <h2 className="text-[18px] font-bold" style={{ color:'var(--label)' }}>Configuração da IA</h2>
          <p className="text-[11px] mt-0.5" style={{ color:'var(--label-3)' }}>Personalize a identidade, mensagens e comportamento da {iaName}</p>
        </div>
        <button onClick={salvar}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold"
          style={{ background:saved?'#22c55e':'var(--accent)', color:'#000', border:'none' }}>
          {saved ? <><CheckCircle size={13}/> Salvo</> : <><Save size={13}/> Salvar</>}
        </button>
      </div>

      {/* ── Nav ── */}
      <div className="flex gap-0 px-6 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
        {NAVS.map(n=>{
          const Icon = n.icon; const on = section===n.id
          return (
            <button key={n.id} onClick={()=>setSection(n.id)}
              className="flex items-center gap-2 px-4 py-3 text-[12px] font-medium transition-all"
              style={{ borderBottom:`2px solid ${on?'var(--accent)':'transparent'}`, color:on?'var(--accent)':'var(--label-3)', marginBottom:-1 }}>
              <Icon size={13}/> {n.label}
            </button>
          )
        })}
      </div>

      {/* ── Content + Preview ── */}
      <div className="flex-1 overflow-hidden flex">

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl space-y-5">

            {/* ══ IDENTIDADE ══ */}
            {section==='identidade' && <>
              <Section title="Nome e personalidade">
                <Field label="Nome da assistente" hint="Como a IA se apresenta ao cliente">
                  <FocusInput value={iaName} onChange={e=>setIaName(e.target.value)} placeholder="Molise"/>
                </Field>
                <Field label="Persona / system prompt" hint="Define como a IA se comporta — seja específico">
                  <FocusInput rows={5} value={iaPersona} onChange={e=>setIaPersona(e.target.value)}
                    placeholder="Você é Molise, assistente virtual da Só Strass..."/>
                </Field>
              </Section>

              <Section title="Tom de voz">
                <Field label="Selecione os tons" hint="Combinação de 1 a 3 tons">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {TONS.map(t=>{
                      const on = tons.includes(t)
                      return (
                        <button key={t} onClick={()=>setTons(on?tons.filter(x=>x!==t):[...tons,t].slice(0,3))}
                          className="px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all"
                          style={{ background:on?'var(--accent-dim)':'var(--fill)', color:on?'var(--accent)':'var(--label-3)', border:`1px solid ${on?'var(--accent)':'var(--sep)'}` }}>
                          {t}
                        </button>
                      )
                    })}
                  </div>
                </Field>
                <Field label="Uso de emoji nas respostas">
                  <div className="flex items-center justify-between p-3 rounded-xl" style={{ background:'var(--bg)', border:'1px solid var(--sep)' }}>
                    <div className="flex items-center gap-3">
                      {emoji ? <Smile size={16} style={{ color:'var(--accent)' }}/> : <SmilePlus size={16} style={{ color:'var(--label-4)' }}/>}
                      <div>
                        <p className="text-[13px] font-medium" style={{ color:'var(--label)' }}>{emoji?'Emojis ativados':'Emojis desativados'}</p>
                        <p className="text-[11px]" style={{ color:'var(--label-4)' }}>{emoji?'A IA pode usar emojis ocasionalmente':'A IA responde sem emojis'}</p>
                      </div>
                    </div>
                    <Toggle on={emoji} onChange={setEmoji}/>
                  </div>
                </Field>
              </Section>
            </>}

            {/* ══ MENSAGENS ══ */}
            {section==='mensagens' && <>
              <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background:'rgba(0,212,170,.06)', border:'1px solid rgba(0,212,170,.2)' }}>
                <Sparkles size={14} style={{ color:'#00d4aa', flexShrink:0, marginTop:2 }}/>
                <p className="text-[12px] leading-relaxed" style={{ color:'var(--label-3)' }}>
                  Configure as mensagens enviadas pela IA em cada etapa. Adicione variações para que o sistema rotacione automaticamente.
                  Use o botão <strong style={{ color:'#00d4aa' }}>Gerar com IA</strong> para criar variações criativas.
                </p>
              </div>
              <div className="space-y-2">
                {CONTEXTS.map(ctx=>(
                  <CtxEditor key={ctx.id} ctx={ctx}
                    data={ctxData[ctx.id]}
                    onChange={d=>setCtxData(p=>({...p,[ctx.id]:d}))}
                    onGenerate={gerarVariacoes}
                    loading={genLoading && genCtx===ctx.id}/>
                ))}
              </div>
            </>}

            {/* ══ BOTÕES ══ */}
            {section==='botoes' && <>
              <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background:'rgba(74,159,255,.06)', border:'1px solid rgba(74,159,255,.2)' }}>
                <AlertCircle size={14} style={{ color:'#4a9fff', flexShrink:0, marginTop:2 }}/>
                <p className="text-[12px] leading-relaxed" style={{ color:'var(--label-3)' }}>
                  Labels dos botões interativos do WhatsApp. Máx. 20 caracteres por botão. Sem emojis.
                </p>
              </div>
              {btns.map((grp,gi)=>(
                <div key={gi} className={`${ds.card} p-5`} style={ds.cardStyle}>
                  <p className="text-[13px] font-semibold mb-4" style={{ color:'var(--label)' }}>{grp.label}</p>
                  <div className="space-y-3">
                    {grp.btns.map((btn,bi)=>(
                      <div key={bi} className="flex items-center gap-3">
                        <Toggle on={btn.on} onChange={v=>setBtns(bs=>bs.map((g,gi2)=>gi2!==gi?g:{...g,btns:g.btns.map((b,bi2)=>bi2!==bi?b:{...b,on:v})}))}/>
                        <FocusInput value={btn.label}
                          onChange={e=>setBtns(bs=>bs.map((g,gi2)=>gi2!==gi?g:{...g,btns:g.btns.map((b,bi2)=>bi2!==bi?b:{...b,label:e.target.value})}))}
                          placeholder="Label do botão" maxLength={20}/>
                        <span className="text-[10px] flex-shrink-0 w-8 text-right" style={{ color: btn.label.length>20?'#ef4444':'var(--label-4)' }}>
                          {btn.label.length}/20
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>}

            {/* ══ HORÁRIO ══ */}
            {section==='horario' && (
              <Section title="Horário de atendimento da IA">
                <p className="text-[12px]" style={{ color:'var(--label-4)' }}>Fora do horário configurado, a IA envia a mensagem de "offline".</p>
                {schedule.map((s,i)=>(
                  <div key={s.day} className="flex items-center gap-3 py-2" style={{ borderBottom:i<schedule.length-1?'1px solid var(--sep)':'none' }}>
                    <span className="text-[12px] w-20 font-medium" style={{ color:s.on?'var(--label)':'var(--label-4)' }}>{s.day}</span>
                    <FocusInput value={s.start} onChange={e=>setSchedule(sc=>sc.map((x,xi)=>xi!==i?x:{...x,start:e.target.value}))}
                      style={{ ...ds.inputStyle, width:70, textAlign:'center', fontFamily:'monospace', fontSize:12, padding:'4px 8px', borderRadius:8 }}/>
                    <span className="text-[11px]" style={{ color:'var(--label-4)' }}>às</span>
                    <FocusInput value={s.end} onChange={e=>setSchedule(sc=>sc.map((x,xi)=>xi!==i?x:{...x,end:e.target.value}))}
                      style={{ ...ds.inputStyle, width:70, textAlign:'center', fontFamily:'monospace', fontSize:12, padding:'4px 8px', borderRadius:8 }}/>
                    <div className="flex-1"/>
                    <Toggle on={s.on} onChange={v=>setSchedule(sc=>sc.map((x,xi)=>xi!==i?x:{...x,on:v}))}/>
                  </div>
                ))}
              </Section>
            )}

            {/* ══ INTEGRAÇÕES ══ */}
            {section==='integracoes' && <>
              <Section title="Inteligência Artificial">
                <Field label="Provedor" hint="Selecione qual API de IA será usada">
                  <div className="grid grid-cols-2 gap-2">
                    {[{id:'google',l:'Google Gemini',cor:'#4a9fff'},{id:'anthropic',l:'Anthropic Claude',cor:'#e879f9'}].map(p=>{
                      const on=(cfg.provedor||'google')===p.id
                      return (
                        <button key={p.id} onClick={()=>setC('provedor',p.id)}
                          className="p-3 rounded-xl text-left text-[12px] font-medium transition-all"
                          style={{ background:on?`${p.cor}12`:'var(--bg)', border:`1px solid ${on?p.cor+'50':'var(--sep)'}`, color:on?p.cor:'var(--label-3)' }}>
                          {p.l}
                        </button>
                      )
                    })}
                  </div>
                </Field>
                <Field label="Modelo" hint="ID do modelo (ex: gemini-2.5-flash)">
                  <FocusInput value={cfg.modelo} onChange={e=>setC('modelo',e.target.value)} placeholder="gemini-2.5-flash"/>
                </Field>
                <Field label="API Key Gemini">
                  <FocusInput type="password" value={cfg.geminiKey} onChange={e=>setC('geminiKey',e.target.value)} placeholder="AIzaSy..."/>
                </Field>
                <Field label="API Key Claude">
                  <FocusInput type="password" value={cfg.claudeKey} onChange={e=>setC('claudeKey',e.target.value)} placeholder="sk-ant-..."/>
                </Field>
              </Section>

              <Section title="Melhor Envio">
                <Field label="Token de autenticação">
                  <FocusInput type="password" value={cfg.melhorEnvioToken} onChange={e=>setC('melhorEnvioToken',e.target.value)} placeholder="eyJ0eXAi..."/>
                </Field>
              </Section>

              <Section title="Correios">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CPF/CNPJ Meu Correios">
                    <FocusInput value={cfg.correiosUsuario} onChange={e=>setC('correiosUsuario',e.target.value)} placeholder="42614714000130"/>
                  </Field>
                  <Field label="Cartão de postagem">
                    <FocusInput value={cfg.correiosCartao} onChange={e=>setC('correiosCartao',e.target.value)} placeholder="0076589811"/>
                  </Field>
                  <Field label="Contrato">
                    <FocusInput value={cfg.correiosContrato} onChange={e=>setC('correiosContrato',e.target.value)} placeholder="9912544869"/>
                  </Field>
                  <Field label="Código de acesso APIs">
                    <FocusInput type="password" value={cfg.correiosApiKey} onChange={e=>setC('correiosApiKey',e.target.value)} placeholder="079LUEmz..."/>
                  </Field>
                </div>
              </Section>

              <Section title="Pagamento PIX (fallback)">
                <Field label="Chave PIX" hint="Usada quando o Bling não gera link de pagamento">
                  <FocusInput value={cfg.pixChave} onChange={e=>setC('pixChave',e.target.value)} placeholder="CNPJ, e-mail ou telefone"/>
                </Field>
              </Section>
            </>}

            {/* ══ LOGÍSTICA ══ */}
            {section==='logistica' && <>
              <Section title="Dimensões da embalagem padrão">
                <p className="text-[12px]" style={{ color:'var(--label-4)' }}>Usadas para cálculo de frete. Configure a caixa padrão de envio.</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Altura (cm)"><FocusInput type="number" value={cfg.caixaAltura} onChange={e=>setC('caixaAltura',e.target.value)}/></Field>
                  <Field label="Largura (cm)"><FocusInput type="number" value={cfg.caixaLargura} onChange={e=>setC('caixaLargura',e.target.value)}/></Field>
                  <Field label="Comprimento (cm)"><FocusInput type="number" value={cfg.caixaComprimento} onChange={e=>setC('caixaComprimento',e.target.value)}/></Field>
                  <Field label="Peso mínimo (kg)"><FocusInput type="number" step="0.1" value={cfg.caixaPesoMinimo} onChange={e=>setC('caixaPesoMinimo',e.target.value)}/></Field>
                </div>
              </Section>

              <Section title="Dados da loja">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CEP de origem" hint="CEP da sua loja">
                    <FocusInput value={cfg.cepOrigem} onChange={e=>setC('cepOrigem',e.target.value)} placeholder="13480000"/>
                  </Field>
                  <Field label="Nome da loja">
                    <FocusInput value={cfg.nomeLoja} onChange={e=>setC('nomeLoja',e.target.value)} placeholder="Só Strass"/>
                  </Field>
                  <Field label="Horário de atendimento">
                    <FocusInput value={cfg.horarioAtendimento} onChange={e=>setC('horarioAtendimento',e.target.value)} placeholder="08:00-18:00"/>
                  </Field>
                  <Field label="Dias de atendimento">
                    <FocusInput value={cfg.diasAtendimento} onChange={e=>setC('diasAtendimento',e.target.value)} placeholder="seg-sex"/>
                  </Field>
                </div>
              </Section>
            </>}

          </div>
        </div>

        {/* ── Preview lateral ── */}
        {(section==='identidade' || section==='mensagens') && (
          <div className="w-64 flex-shrink-0 p-6 flex flex-col items-center gap-4"
            style={{ borderLeft:'1px solid var(--sep)', background:'var(--bg-2)' }}>
            <PhonePreview nome={iaName} msg={saudacaoMsg}/>
            {tons.length > 0 && (
              <div className="w-full">
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-center" style={{ color:'var(--label-4)' }}>Tom ativo</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {tons.map(t=>(
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background:'var(--accent-dim)', color:'var(--accent)' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
