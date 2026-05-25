import { useState, useEffect } from 'react'
import {
  Bot, Pencil, Grid3x3, Clock, Plug, Package, PanelLeftClose, PanelLeftOpen,
  Save, CheckCircle, Plus, Trash2, Sparkles, Eye, EyeOff, RefreshCw,
  ChevronDown, ChevronRight, ToggleLeft, ToggleRight, Smile, SmilePlus,
  Copy, Check, Server
} from 'lucide-react'

const TONS = ['Simpático','Direto','Profissional','Descontraído','Prestativo','Entusiasmado','Conciso','Formal']
const DIAS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']
const ALIASES = ['{nome_cliente}','{produto}','{valor_pix}','{valor_cartao}','{numero_pedido}','{loja}','{nome_ia}']
const BTN_GROUPS_DEFAULT = [
  { label:'Produto encontrado', btns:[{label:'Adicionar ao carrinho',on:true},{label:'Ver foto',on:true},{label:'Tirar dúvida',on:true}]},
  { label:'Resumo do carrinho', btns:[{label:'Finalizar pedido',on:true},{label:'Adicionar item',on:true},{label:'Editar carrinho',on:true}]},
  { label:'Confirmação endereço', btns:[{label:'Confirmar endereço',on:true},{label:'Alterar endereço',on:true}]},
]
const CTXS = [
  { id:'saudacao', label:'Saudação inicial',       cor:'#00d4aa', default:'Olá! Seja bem-vindo(a) à {loja}! Sou a {nome_ia}. Como posso ajudar?' },
  { id:'produto',  label:'Produto encontrado',      cor:'#a78bfa', default:'*{produto}*\n───────────\nPIX: R$ {valor_pix} | Cartão: R$ {valor_cartao}' },
  { id:'carrinho', label:'Item adicionado',          cor:'#f59e0b', default:'*{produto}* adicionado ao carrinho.' },
  { id:'pedido',   label:'Pedido finalizado',        cor:'#22c55e', default:'*Pedido #{numero_pedido} criado!*\nPIX: R$ {valor_pix}' },
  { id:'offline',  label:'Fora do horário',          cor:'#60a5fa', default:'Olá! Estamos fora do horário. Seg-sex 8h–18h.\nDeixe sua mensagem!' },
]

const NAV = [
  { group:'Personalidade', items:[
    { id:'identidade', icon:Bot,    label:'Identidade' },
    { id:'mensagensIA',icon:Pencil, label:'Mensagens IA' },
  ]},
  { group:'Interface', items:[
    { id:'botoes',     icon:Grid3x3, label:'Botões WA' },
    { id:'horario',    icon:Clock,   label:'Horário' },
  ]},
  { group:'Infraestrutura', items:[
    { id:'integra',    icon:Plug,    label:'Integrações' },
    { id:'logistica',  icon:Package, label:'Logística' },
  ]},
]

function NavSidebar({ active, setActive, collapsed, setCollapsed }) {
  return (
    <aside className={`flex-shrink-0 flex flex-col overflow-hidden transition-all duration-200 ${collapsed?'w-12':'w-52'}`}
      style={{ background:'var(--bg-2)', borderRight:'1px solid var(--sep)' }}>
      <div className="flex items-center justify-between px-3 py-3 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)' }}>
        {!collapsed && <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color:'var(--label-3)' }}>Config IA</span>}
        <button onClick={()=>setCollapsed(v=>!v)} className="p-1.5 rounded-lg ml-auto" style={{ color:'var(--label-4)' }}>
          {collapsed?<PanelLeftOpen size={14}/>:<PanelLeftClose size={14}/>}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map(g=>(
          <div key={g.group} className="mb-1">
            {!collapsed && <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--label-4)' }}>{g.group}</div>}
            {g.items.map(item=>{
              const Icon=item.icon; const on=active===item.id
              return (
                <button key={item.id} onClick={()=>setActive(item.id)} title={collapsed?item.label:undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all ${collapsed?'justify-center':''}`}
                  style={{ background:on?'var(--accent-dim)':'transparent', borderLeft:`2px solid ${on?'var(--accent)':'transparent'}`,
                    color:on?'var(--accent)':'var(--label-3)' }}>
                  <Icon size={14} className="flex-shrink-0"/>
                  {!collapsed && <span className="text-[12px] font-medium truncate">{item.label}</span>}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}

function FInput({ label, value, onChange, type='text', placeholder, hint, readOnly=false }) {
  const [f, setF] = useState(false)
  return (
    <div>
      {label && <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color:'var(--label-4)' }}>{label}</label>}
      <input type={type} value={value||''} onChange={e=>onChange?.(e.target.value)} placeholder={placeholder} readOnly={readOnly}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        className="w-full px-3 py-2 rounded-xl text-[12.5px] outline-none transition-all"
        style={{ background:'var(--bg)', border:`1px solid ${f&&!readOnly?'var(--accent)':'var(--sep)'}`, color:'var(--label)',
          fontFamily:'inherit', boxShadow:f&&!readOnly?'0 0 0 3px var(--accent-dim)':'none', cursor:readOnly?'default':'auto' }}/>
      {hint && <p className="text-[10px] mt-1" style={{ color:'var(--label-4)' }}>{hint}</p>}
    </div>
  )
}

function CtxCard({ ctx, data, onChange, onGenerate, generating }) {
  const [open, setOpen] = useState(false)
  const def = data?.default ?? ctx.default
  const vars = data?.vars ?? []
  return (
    <div className="rounded-xl overflow-hidden" style={{ border:'1px solid var(--sep)', background:'var(--bg)' }}>
      <button onClick={()=>setOpen(v=>!v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ background:open?'var(--bg-2)':'transparent' }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:ctx.cor }}/>
        <span className="text-[12.5px] font-medium flex-1 text-left" style={{ color:'var(--label)' }}>{ctx.label}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background:`${ctx.cor}15`, color:ctx.cor }}>{vars.length} variação{vars.length!==1?'ões':''}</span>
        {open?<ChevronDown size={12} style={{ color:'var(--label-4)' }}/>:<ChevronRight size={12} style={{ color:'var(--label-4)' }}/>}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2" style={{ borderTop:'1px solid var(--sep)' }}>
          <div className="mb-3">
            <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color:'var(--label-4)' }}>Mensagem padrão</label>
            <textarea rows={3} value={def} onChange={e=>onChange({...data,default:e.target.value})}
              className="w-full px-3 py-2 rounded-xl text-[12px] font-mono outline-none resize-y leading-relaxed"
              style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
          </div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color:'var(--label-4)' }}>Variações A/B</label>
            <div className="flex gap-1.5">
              <button onClick={()=>onGenerate(ctx.id)} disabled={generating}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px]"
                style={{ background:'rgba(0,212,170,.1)', color:'#00d4aa', border:'1px solid rgba(0,212,170,.2)' }}>
                {generating?<RefreshCw size={10} className="animate-spin"/>:<Sparkles size={10}/>} Gerar
              </button>
              <button onClick={()=>onChange({...data,vars:[...vars,'']})}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px]"
                style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>
                <Plus size={10}/> Add
              </button>
            </div>
          </div>
          {vars.length===0 && <p className="text-[11px] py-2 text-center" style={{ color:'var(--label-4)' }}>Nenhuma variação — sempre usa o padrão.</p>}
          <div className="space-y-2">
            {vars.map((v,i)=>(
              <div key={i} className="flex gap-2">
                <textarea rows={2} value={v} onChange={e=>onChange({...data,vars:vars.map((x,xi)=>xi===i?e.target.value:x)})}
                  className="flex-1 px-3 py-2 rounded-xl text-[12px] font-mono outline-none resize-y"
                  style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
                <button onClick={()=>onChange({...data,vars:vars.filter((_,xi)=>xi!==i)})}
                  className="px-2 rounded-lg self-start mt-1" style={{ background:'rgba(239,68,68,.1)', color:'#ef4444' }}>
                  <Trash2 size={12}/>
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3 pt-2" style={{ borderTop:'1px solid var(--sep)' }}>
            {ALIASES.map(a=>(
              <code key={a} onClick={()=>onChange({...data,default:def+a})}
                className="text-[9px] px-1.5 py-0.5 rounded cursor-pointer"
                style={{ background:'var(--fill)', color:'var(--label-4)', border:'1px solid var(--sep)' }}>{a}</code>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PhonePreview({ nome, msg }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-[22px] overflow-hidden" style={{ width:185, background:'#0b141a', border:'2px solid var(--sep)' }}>
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ background:'#202c33' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background:'var(--accent)', color:'#000' }}>{(nome||'?')[0].toUpperCase()}</div>
          <div>
            <div className="text-[11px] font-semibold" style={{ color:'#e9edef' }}>{nome||'Assistente'}</div>
            <div className="text-[9px]" style={{ color:'#8696a0' }}>online</div>
          </div>
        </div>
        <div className="p-3 space-y-2 min-h-[70px]" style={{ background:'#0b141a' }}>
          <div className="ml-auto w-fit max-w-[140px] px-3 py-1.5 rounded-xl rounded-tr-sm" style={{ background:'#005c4b' }}>
            <p className="text-[10px]" style={{ color:'#e9edef' }}>Olá!</p>
          </div>
          <div className="max-w-[150px] px-3 py-2 rounded-xl rounded-tl-sm" style={{ background:'#202c33' }}>
            <p className="text-[10px] leading-relaxed whitespace-pre-wrap" style={{ color:'#e9edef' }}>
              {(msg||'…').slice(0,120)}
            </p>
          </div>
        </div>
      </div>
      <p className="text-[10px]" style={{ color:'var(--label-4)' }}>Preview ao vivo</p>
    </div>
  )
}

// ── Collapsible group for integrations ───────────────────────────────────────
function IntGroup({ title, cor='var(--accent)', children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-xl overflow-hidden" style={{ border:'1px solid var(--sep)', background:'var(--bg)' }}>
      <button onClick={()=>setOpen(v=>!v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        style={{ background:open?'var(--bg-2)':'transparent' }}>
        <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background:cor }}/>
        <span className="text-[12.5px] font-semibold flex-1" style={{ color:'var(--label)' }}>{title}</span>
        {open?<ChevronDown size={12} style={{ color:'var(--label-4)' }}/>:<ChevronRight size={12} style={{ color:'var(--label-4)' }}/>}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 space-y-4" style={{ borderTop:'1px solid var(--sep)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function PageIAConfig({ api }) {
  const [active,    setActive]    = useState('identidade')
  const [collapsed, setCollapsed] = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [iaName,    setIaName]    = useState('Molise')
  const [iaPersona, setIaPersona] = useState('Você é Molise, assistente virtual da Só Strass. Seja simpática e objetiva.')
  const [tons,      setTons]      = useState(['Simpático','Profissional'])
  const [emoji,     setEmoji]     = useState(true)
  const [ctxData,   setCtxData]   = useState({})
  const [btns,      setBtns]      = useState(BTN_GROUPS_DEFAULT)
  const [schedule,  setSchedule]  = useState(DIAS.map((d,i)=>({day:d,on:i<6,start:i===5?'09:00':'08:00',end:i===5?'14:00':'18:00'})))
  const [cfg,       setCfg]       = useState({})
  const [genLoad,   setGenLoad]   = useState(null)

  const setC = (k,v) => setCfg(c=>({...c,[k]:v}))

  useEffect(()=>{
    if (!api) return
    fetch(`${api}/api/ia/config`).then(r=>r.ok?r.json():null).then(d=>{
      if (!d) return
      if (d.persona||d.iaPersona) setIaPersona(d.persona||d.iaPersona)
      if (d.iaName)   setIaName(d.iaName)
      if (d.btns)     setBtns(d.btns)
      if (d.schedule) setSchedule(d.schedule)
      if (d.tons)     setTons(d.tons)
      if (d.emoji!==undefined) setEmoji(d.emoji)
      if (d.ctxData)  setCtxData(d.ctxData)
      setCfg({
        provedor:d.provedor||'google', modelo:d.modelo||'gemini-2.5-flash',
        geminiKey:d.geminiKey||'', claudeKey:d.claudeKey||'',
        temperatura:d.temperatura||'0.7', maxTokens:d.maxTokens||4000,
        melhorEnvioToken:d.melhorEnvioToken||'', correiosUsuario:d.correiosUsuario||'',
        correiosCartao:d.correiosCartao||'', correiosContrato:d.correiosContrato||'',
        correiosApiKey:d.correiosApiKey||'', pixChave:d.pixChave||'',
        cepOrigem:d.cepOrigem||'', caixaAltura:d.caixaAltura||'8',
        caixaLargura:d.caixaLargura||'26', caixaComprimento:d.caixaComprimento||'16',
        caixaPesoMinimo:d.caixaPesoMinimo||'0.3', nomeLoja:d.nomeLoja||'Só Strass',
        horarioAtendimento:d.horarioAtendimento||'08:00-18:00', diasAtendimento:d.diasAtendimento||'seg-sex',
      })
    }).catch(()=>{})
  },[api])

  const salvar = async () => {
    setSaved(true); setTimeout(()=>setSaved(false),2500)
    if (!api) return
    try {
      await fetch(`${api}/api/ia/config`,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({iaName,iaPersona,persona:iaPersona,tons,emoji,ctxData,btns,schedule,...cfg})})
    } catch {}
  }

  const gerarVariacoes = async (ctxId) => {
    setGenLoad(ctxId)
    const ctxMap={ saudacao:'mensagem de saudação de assistente de loja de bijuterias', produto:'apresentação de produto de strass', carrinho:'confirmação de item adicionado ao carrinho', pedido:'confirmação de pedido criado', offline:'mensagem fora do horário de atendimento' }
    try {
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:500,
          messages:[{role:'user',content:`Gere 2 variações curtas de ${ctxMap[ctxId]||ctxId}. Responda APENAS com 2 frases separadas por ---. Sem numeração.`}]})})
      const d=await r.json()
      const parts=(d.content?.[0]?.text||'').split('---').map(s=>s.trim()).filter(Boolean)
      if (parts.length) setCtxData(prev=>({...prev,[ctxId]:{...(prev[ctxId]||{}),vars:[...(prev[ctxId]?.vars||[]),...parts]}}))
    } catch {}
    setGenLoad(null)
  }

  const saudacaoMsg = ctxData['saudacao']?.default || CTXS[0].default

  const showPreview = active==='identidade' || active==='mensagensIA'

  const PAGE_META = {
    identidade:  { title:'Identidade',     sub:'Nome, persona e tom de voz' },
    mensagensIA: { title:'Mensagens IA',   sub:'Variações automáticas por contexto' },
    botoes:      { title:'Botões WA',      sub:'Labels dos botões interativos' },
    horario:     { title:'Horário',        sub:'Janela de atendimento da IA' },
    integra:     { title:'Integrações',    sub:'APIs externas e credenciais' },
    logistica:   { title:'Logística',      sub:'Frete e dimensões de embalagem' },
  }
  const meta = PAGE_META[active] || {}

  return (
    <div className="h-full flex overflow-hidden" style={{ background:'var(--bg)' }}>
      <NavSidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed}/>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="px-6 py-3.5 flex-shrink-0 flex items-center gap-4"
          style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color:'var(--label)' }}>{meta.title}</h2>
            <p className="text-[11px]" style={{ color:'var(--label-4)' }}>{meta.sub}</p>
          </div>
          <div className="ml-auto">
            <button onClick={salvar}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold"
              style={{ background:saved?'#22c55e':'var(--accent)', color:'#000', border:'none' }}>
              {saved?<><CheckCircle size={13}/> Salvo</>:<><Save size={13}/> Salvar</>}
            </button>
          </div>
        </div>

        {/* Content + Preview */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl space-y-5">

              {/* ══ IDENTIDADE ══ */}
              {active==='identidade' && <>
                <div className="rounded-2xl p-5" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color:'var(--label-3)' }}>Nome & Persona</p>
                  <div className="space-y-4">
                    <FInput label="Nome da assistente" value={iaName} onChange={setIaName} placeholder="Molise"/>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color:'var(--label-4)' }}>Persona / System Prompt</label>
                      <textarea rows={5} value={iaPersona} onChange={e=>setIaPersona(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-[12.5px] outline-none resize-y leading-relaxed"
                        style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)', fontFamily:'inherit' }}/>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl p-5" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color:'var(--label-3)' }}>Tom de voz</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {TONS.map(t=>{
                      const on=tons.includes(t)
                      return (
                        <button key={t} onClick={()=>setTons(on?tons.filter(x=>x!==t):[...tons,t].slice(0,3))}
                          className="px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all"
                          style={{ background:on?'var(--accent-dim)':'var(--fill)', color:on?'var(--accent)':'var(--label-3)',
                            border:`1px solid ${on?'var(--accent)':'var(--sep)'}` }}>
                          {t}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl" style={{ background:'var(--bg)', border:'1px solid var(--sep)' }}>
                    <div className="flex items-center gap-3">
                      {emoji?<Smile size={16} style={{ color:'var(--accent)' }}/>:<SmilePlus size={16} style={{ color:'var(--label-4)' }}/>}
                      <div>
                        <p className="text-[12.5px] font-medium" style={{ color:'var(--label)' }}>{emoji?'Emojis ativados':'Emojis desativados'}</p>
                        <p className="text-[11px]" style={{ color:'var(--label-4)' }}>{emoji?'IA pode usar emojis ocasionalmente':'Respostas sem emojis'}</p>
                      </div>
                    </div>
                    <button onClick={()=>setEmoji(v=>!v)}>
                      {emoji?<ToggleRight size={22} style={{ color:'var(--accent)' }}/>:<ToggleLeft size={22} style={{ color:'var(--label-4)' }}/>}
                    </button>
                  </div>
                </div>
              </>}

              {/* ══ MENSAGENS IA ══ */}
              {active==='mensagensIA' && <>
                <div className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{ background:'rgba(0,212,170,.06)', border:'1px solid rgba(0,212,170,.2)' }}>
                  <Sparkles size={14} style={{ color:'#00d4aa', flexShrink:0, marginTop:2 }}/>
                  <p className="text-[12px] leading-relaxed" style={{ color:'var(--label-3)' }}>
                    Configure as mensagens que a IA envia em cada contexto. Use <strong style={{ color:'#00d4aa' }}>Gerar</strong> para criar variações com IA.
                  </p>
                </div>
                <div className="space-y-2">
                  {CTXS.map(ctx=>(
                    <CtxCard key={ctx.id} ctx={ctx}
                      data={ctxData[ctx.id]}
                      onChange={d=>setCtxData(p=>({...p,[ctx.id]:d}))}
                      onGenerate={gerarVariacoes}
                      generating={genLoad===ctx.id}/>
                  ))}
                </div>
              </>}

              {/* ══ BOTÕES ══ */}
              {active==='botoes' && <>
                <div className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{ background:'rgba(74,159,255,.06)', border:'1px solid rgba(74,159,255,.2)' }}>
                  <Grid3x3 size={14} style={{ color:'#4a9fff', flexShrink:0, marginTop:2 }}/>
                  <p className="text-[12px] leading-relaxed" style={{ color:'var(--label-3)' }}>
                    Labels dos botões interativos do WhatsApp. Máx. <strong style={{ color:'var(--label)' }}>20 caracteres</strong>. Sem emojis.
                  </p>
                </div>
                {btns.map((grp,gi)=>(
                  <div key={gi} className="rounded-2xl p-5" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                    <p className="text-[12px] font-semibold mb-4" style={{ color:'var(--label)' }}>{grp.label}</p>
                    <div className="space-y-3">
                      {grp.btns.map((btn,bi)=>(
                        <div key={bi} className="flex items-center gap-3">
                          <button onClick={()=>setBtns(bs=>bs.map((g,gi2)=>gi2!==gi?g:{...g,btns:g.btns.map((b,bi2)=>bi2!==bi?b:{...b,on:!b.on})}))} style={{ flexShrink:0 }}>
                            {btn.on?<ToggleRight size={20} style={{ color:'var(--accent)' }}/>:<ToggleLeft size={20} style={{ color:'var(--label-4)' }}/>}
                          </button>
                          <input value={btn.label} maxLength={20}
                            onChange={e=>setBtns(bs=>bs.map((g,gi2)=>gi2!==gi?g:{...g,btns:g.btns.map((b,bi2)=>bi2!==bi?b:{...b,label:e.target.value})}))}
                            className="flex-1 px-3 py-2 rounded-xl text-[12.5px] outline-none"
                            style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)', fontFamily:'inherit' }}/>
                          <span className="text-[10px] w-8 text-right flex-shrink-0"
                            style={{ color:btn.label.length>20?'#ef4444':'var(--label-4)' }}>{btn.label.length}/20</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>}

              {/* ══ HORÁRIO ══ */}
              {active==='horario' && (
                <div className="rounded-2xl p-5" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color:'var(--label-3)' }}>Horário de atendimento</p>
                  <p className="text-[12px] mb-4" style={{ color:'var(--label-4)' }}>Fora do horário configurado a IA envia a mensagem "offline".</p>
                  {schedule.map((s,i)=>(
                    <div key={s.day} className="flex items-center gap-3 py-2.5"
                      style={{ borderBottom:i<schedule.length-1?'1px solid var(--sep)':'none' }}>
                      <span className="text-[12px] font-medium w-20" style={{ color:s.on?'var(--label)':'var(--label-4)' }}>{s.day}</span>
                      <input value={s.start} onChange={e=>setSchedule(sc=>sc.map((x,xi)=>xi!==i?x:{...x,start:e.target.value}))}
                        className="px-2 py-1 rounded-lg text-[12px] font-mono outline-none w-16 text-center"
                        style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
                      <span className="text-[11px]" style={{ color:'var(--label-4)' }}>às</span>
                      <input value={s.end} onChange={e=>setSchedule(sc=>sc.map((x,xi)=>xi!==i?x:{...x,end:e.target.value}))}
                        className="px-2 py-1 rounded-lg text-[12px] font-mono outline-none w-16 text-center"
                        style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
                      <div className="flex-1"/>
                      <button onClick={()=>setSchedule(sc=>sc.map((x,xi)=>xi!==i?x:{...x,on:!x.on}))}>
                        {s.on?<ToggleRight size={20} style={{ color:'var(--accent)' }}/>:<ToggleLeft size={20} style={{ color:'var(--label-4)' }}/>}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ══ INTEGRAÇÕES ══ */}
              {active==='integra' && (
                <div className="space-y-3">
                  <IntGroup title="Inteligência Artificial" cor="#a78bfa">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><FInput label="Gemini API Key" type="password" value={cfg.geminiKey} onChange={v=>setC('geminiKey',v)} placeholder="AIzaSy..."/></div>
                      <div className="col-span-2"><FInput label="Claude API Key" type="password" value={cfg.claudeKey} onChange={v=>setC('claudeKey',v)} placeholder="sk-ant-..."/></div>
                    </div>
                  </IntGroup>
                  <IntGroup title="Melhor Envio" cor="#00d4aa">
                    <FInput label="Token de autenticação" type="password" value={cfg.melhorEnvioToken} onChange={v=>setC('melhorEnvioToken',v)} placeholder="eyJ0eXAi..."/>
                  </IntGroup>
                  <IntGroup title="Correios" cor="#f59e0b">
                    <div className="grid grid-cols-2 gap-3">
                      <FInput label="CPF/CNPJ Meu Correios" value={cfg.correiosUsuario} onChange={v=>setC('correiosUsuario',v)} placeholder="42614714000130"/>
                      <FInput label="Cartão de postagem" value={cfg.correiosCartao} onChange={v=>setC('correiosCartao',v)} placeholder="0076589811"/>
                      <FInput label="Contrato" value={cfg.correiosContrato} onChange={v=>setC('correiosContrato',v)} placeholder="9912544869"/>
                      <FInput label="Código de acesso APIs" type="password" value={cfg.correiosApiKey} onChange={v=>setC('correiosApiKey',v)} placeholder="079LUEmz..."/>
                    </div>
                  </IntGroup>
                  <IntGroup title="Pagamento PIX (fallback)" cor="#22c55e">
                    <FInput label="Chave PIX" value={cfg.pixChave} onChange={v=>setC('pixChave',v)} placeholder="CNPJ, e-mail ou telefone" hint="Usada quando o Bling não gera link"/>
                  </IntGroup>
                </div>
              )}

              {/* ══ LOGÍSTICA ══ */}
              {active==='logistica' && (
                <div className="space-y-5">
                  <div className="rounded-2xl p-5" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color:'var(--label-3)' }}>Dimensões da embalagem padrão</p>
                    <p className="text-[12px] mb-4" style={{ color:'var(--label-4)' }}>Usadas para cotação de frete. Configure a caixa padrão de envio.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <FInput label="Altura (cm)" type="number" value={cfg.caixaAltura} onChange={v=>setC('caixaAltura',v)}/>
                      <FInput label="Largura (cm)" type="number" value={cfg.caixaLargura} onChange={v=>setC('caixaLargura',v)}/>
                      <FInput label="Comprimento (cm)" type="number" value={cfg.caixaComprimento} onChange={v=>setC('caixaComprimento',v)}/>
                      <FInput label="Peso mínimo (kg)" type="number" value={cfg.caixaPesoMinimo} onChange={v=>setC('caixaPesoMinimo',v)}/>
                    </div>
                  </div>
                  <div className="rounded-2xl p-5" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color:'var(--label-3)' }}>Dados da loja</p>
                    <div className="grid grid-cols-2 gap-3">
                      <FInput label="CEP de origem" value={cfg.cepOrigem} onChange={v=>setC('cepOrigem',v)} placeholder="13480000" hint="CEP da sua loja"/>
                      <FInput label="Nome da loja" value={cfg.nomeLoja} onChange={v=>setC('nomeLoja',v)} placeholder="Só Strass"/>
                      <FInput label="Horário de atendimento" value={cfg.horarioAtendimento} onChange={v=>setC('horarioAtendimento',v)} placeholder="08:00-18:00"/>
                      <FInput label="Dias de atendimento" value={cfg.diasAtendimento} onChange={v=>setC('diasAtendimento',v)} placeholder="seg-sex"/>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Preview lateral */}
          {showPreview && (
            <div className="w-56 flex-shrink-0 p-6 flex flex-col items-center gap-5 overflow-y-auto"
              style={{ borderLeft:'1px solid var(--sep)', background:'var(--bg-2)' }}>
              <PhonePreview nome={iaName} msg={saudacaoMsg}/>
              {tons.length>0 && (
                <div className="w-full">
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-2 text-center" style={{ color:'var(--label-4)' }}>Tom ativo</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {tons.map(t=>(
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background:'var(--accent-dim)', color:'var(--accent)' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="w-full text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color:'var(--label-4)' }}>Emoji</p>
                <span className="text-[11px]" style={{ color:emoji?'#22c55e':'var(--label-4)' }}>{emoji?'Ativo':'Desativado'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
