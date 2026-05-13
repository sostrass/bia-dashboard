import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, Save, X, Sparkles, RefreshCw, CheckCircle, ToggleLeft,
  ToggleRight, Trash2, ChevronRight, Brain, User, Settings,
  Wrench, Globe, MessageSquare, Upload, Youtube, HelpCircle,
  ShoppingBag, Truck, AlertCircle, Phone, Calendar, ArrowLeft,
  Send, Image as ImageIcon, Mic, Hash, Tag, ChevronUp, ChevronDown,
  GripVertical, Copy, Zap, Eye, EyeOff, Star, Edit3
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const MODELOS = [
  { id:'gemini-2.0-flash-lite', label:'Gemini 2.0 Flash Lite (padrão)' },
  { id:'gemini-2.0-flash',      label:'Gemini 2.0 Flash' },
  { id:'gemini-1.5-pro',        label:'Gemini 1.5 Pro' },
  { id:'gemini-1.5-flash',      label:'Gemini 1.5 Flash' },
]

const TONS_VOZ = [
  { id:'engracado_serio',  min:'😄 Engraçado',  max:'🎩 Sério',      default:50 },
  { id:'casual_formal',   min:'😎 Casual',     max:'👔 Formal',     default:50 },
  { id:'descolado_resp',  min:'😎 Descolado',  max:'🤝 Respeitoso', default:50 },
  { id:'explicativo_res', min:'📖 Explicativo',max:'✅ Resumido',    default:50 },
]

const FERRAMENTAS = [
  { id:'marcar_resolvido', label:'Marcar como resolvido',   desc:'Agente pode fechar a conversa como resolvida',        icon:CheckCircle },
  { id:'solicitar_humano', label:'Solicitar atendente',     desc:'Quando não souber, transfere para atendimento humano', icon:User },
  { id:'registrar_ocorr', label:'Registrar ocorrência',    desc:'Cria uma ocorrência para o time de suporte',           icon:AlertCircle },
  { id:'enviar_foto',     label:'Enviar foto de produto',  desc:'Envia imagem do produto quando encontrar no catálogo', icon:ImageIcon },
  { id:'criar_pedido',    label:'Criar pedido (Bling)',    desc:'Finaliza pedido diretamente no Bling ERP',             icon:ShoppingBag },
  { id:'rastrear_pedido', label:'Rastrear pedido',         desc:'Consulta status e rastreio no Bling ERP',             icon:Truck },
]

const CEREBRO_FONTES = [
  { id:'produtos',   label:'Produtos',           desc:'Catálogo sincronizado com Bling',          icon:ShoppingBag, disponivel:true },
  { id:'pedidos',    label:'Pedidos',             desc:'Pedidos e rastreios do Bling',             icon:Truck,       disponivel:true },
  { id:'faq',        label:'FAQ',                 desc:'Artigos publicados no FAQ da loja',        icon:HelpCircle,  disponivel:true },
  { id:'arquivos',   label:'Arquivos',            desc:'PDF, Word, TXT',                          icon:Upload,      disponivel:true },
  { id:'perguntas',  label:'Perguntas e respostas',desc:'Perguntas frequentes personalizadas',    icon:MessageSquare,disponivel:true },
  { id:'youtube',    label:'YouTube',             desc:'Transcrições de vídeos da loja',          icon:Youtube,     disponivel:false },
]

const AVATARES = [
  'https://api.dicebear.com/9.x/lorelei/svg?seed=molise&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=bia&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=luna&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=zara&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=leo&backgroundColor=ffd5dc',
]

const ABAS = [
  { id:'cerebro',       label:'Cérebro',       icon:Brain    },
  { id:'personalidade', label:'Personalidade', icon:User     },
  { id:'instrucoes',    label:'Instruções',    icon:Settings },
  { id:'ferramentas',   label:'Ferramentas',   icon:Wrench   },
  { id:'avancado',      label:'Avançado',      icon:Zap      },
]

// ── Preview de chat ────────────────────────────────────────────────────────────
function PreviewChat({ agente }) {
  const [msgs, setMsgs] = useState([
    { r:'b', t:`Olá! Sou ${agente.nome||'Molise'}, como posso ajudar? 😊` }
  ])
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs])

  const enviar = async () => {
    if (!input.trim() || enviando) return
    const txt = input.trim()
    setInput('')
    setMsgs(m => [...m, { r:'u', t:txt }])
    setEnviando(true)
    try {
      // Chama a API real com a persona do agente atual
      const r = await fetch(`${api}/api/agentes/preview`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          mensagem:  txt,
          persona:   agente?.persona || '',
          instrucoes: agente?.instrucoes || {},
          nome:      agente?.nome || 'Molise',
          historico: msgs.filter(m => m.r !== 'sistema').slice(-10).map(m => ({
            role:  m.r === 'u' ? 'user' : 'model',
            parts: [{ text: m.t }]
          }))
        })
      })
      const d = await r.json()
      setMsgs(m => [...m, { r:'b', t: d.resposta || 'Não consegui processar.' }])
    } catch {
      setMsgs(m => [...m, { r:'b', t:'Erro ao conectar. Verifique se o servidor está online.' }])
    }
    setEnviando(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-3)' }}>
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
          style={{ background:'var(--fill)' }}>
          {agente.avatar
            ? <img src={agente.avatar} alt="" className="w-full h-full object-cover"/>
            : <div className="w-full h-full flex items-center justify-center text-[13px] font-bold" style={{ color:'var(--accent)' }}>
                {(agente.nome||'M')[0]}
              </div>
          }
        </div>
        <div>
          <p className="text-[12px] font-semibold" style={{ color:'var(--label)' }}>{agente.nome||'Agente'}</p>
          <p className="text-[10px]" style={{ color:'var(--label-3)' }}>Preview da conversa</p>
        </div>
      </div>
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ background:'var(--bg)' }}>
        {msgs.map((m,i) => (
          <div key={i} className={`flex ${m.r==='u'?'justify-end':'justify-start'}`}>
            <div className="max-w-[85%] px-3 py-2 rounded-[12px] text-[12px] leading-relaxed"
              style={{
                background: m.r==='u' ? 'var(--accent)' : 'var(--bg-3)',
                color:      m.r==='u' ? '#000' : 'var(--label)',
                borderRadius: m.r==='u' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              }}>
              {m.t}
            </div>
          </div>
        ))}
        <div ref={endRef}/>
      </div>
      {/* Input */}
      <div className="flex gap-2 p-3 flex-shrink-0" style={{ borderTop:'1px solid var(--sep)' }}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&enviar()}
          onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&enviar()} placeholder="Digite sua mensagem..."
          className="flex-1 px-3 py-2 rounded-[10px] text-[12px] outline-none"
          style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
        <button onClick={enviar}
          className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background:'var(--accent)' }}>
          <Send size={13} style={{ color:'#000' }}/>
        </button>
      </div>
    </div>
  )
}

// ── Slider de tom de voz ───────────────────────────────────────────────────────
function TomSlider({ tom, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color:'var(--label-3)' }}>{tom.min}</span>
        <span className="text-[11px]" style={{ color:'var(--label-3)' }}>{tom.max}</span>
      </div>
      <input type="range" min={0} max={100} value={value||tom.default}
        onChange={e=>onChange(parseInt(e.target.value))}
        className="w-full accent-[var(--accent)]"
        style={{ accentColor:'var(--accent)' }}/>
    </div>
  )
}

// ── TagInput ──────────────────────────────────────────────────────────────────
function TagInput({ tags=[], onChange, placeholder }) {
  const [inp, setInp] = useState('')
  const add = () => {
    const t = inp.trim().toLowerCase()
    if (t && !tags.includes(t)) { onChange([...tags, t]); setInp('') }
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t=>(
          <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
            style={{ background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
            {t}
            <button onClick={()=>onChange(tags.filter(x=>x!==t))} style={{ color:'var(--accent)', lineHeight:1 }}>
              <X size={9}/>
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={inp} onChange={e=>setInp(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();add()}}}
          placeholder={placeholder||'Digite e pressione Enter...'}
          className="flex-1 px-3 py-1.5 rounded-[8px] text-[12px] outline-none"
          style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
        <button onClick={add} className="px-2.5 py-1.5 rounded-[8px]"
          style={{ background:'var(--fill)', color:'var(--label-2)' }}>
          <Plus size={12}/>
        </button>
      </div>
    </div>
  )
}

// ── Editor de agente ──────────────────────────────────────────────────────────
function EditorAgente({ agente, onSave, onDelete, onVoltar, api }) {
  const [form, setForm] = useState({
    nome:          agente?.nome           || '',
    descricao:     agente?.descricao      || '',
    avatar:        agente?.avatar         || AVATARES[0],
    ativo:         agente?.ativo          !== false,
    persona:       agente?.persona        || '',
    palavrasChave: agente?.palavrasChave  || [],
    modelo:        agente?.modelo         || 'gemini-2.0-flash-lite',
    temperatura:   agente?.temperatura    ?? 0.7,
    tons:          agente?.tons           || {},
    ferramentas:   agente?.ferramentas    || { marcar_resolvido:true, solicitar_humano:true, enviar_foto:true, rastrear_pedido:true },
    cerebro:       agente?.cerebro        || { produtos:true, pedidos:true },
    instrucoes: {
      quemEh:      agente?.instrucoes?.quemEh    || '',
      oQueFaz:     agente?.instrucoes?.oQueFaz   || '',
      objetivo:    agente?.instrucoes?.objetivo  || '',
      regras:      agente?.instrucoes?.regras    || '',
      evitarTemas: agente?.instrucoes?.evitarTemas || '',
    },
  })
  const [aba,     setAba]     = useState('cerebro')
  const [salvando,setSalvando]= useState(false)
  const [salvoOk, setSalvoOk] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [showAvatar, setShowAvatar] = useState(false)
  const [dirty, setDirty] = useState(false)

  const set = (k, v) => { setForm(f=>({...f,[k]:v})); setDirty(true) }
  const setInstr = (k,v) => { setForm(f=>({...f,instrucoes:{...f.instrucoes,[k]:v}})); setDirty(true) }
  const setTon = (id,v) => { setForm(f=>({...f,tons:{...f.tons,[id]:v}})); setDirty(true) }
  const setFerr = (id,v) => { setForm(f=>({...f,ferramentas:{...f.ferramentas,[id]:v}})); setDirty(true) }
  const setCerebro = (id,v) => { setForm(f=>({...f,cerebro:{...f.cerebro,[id]:v}})); setDirty(true) }

  const gerarPersona = async () => {
    if (!form.nome) return
    setGerando(true)
    try {
      const r = await fetch(`${api}/api/agentes/gerar-persona`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ nome:form.nome, descricao:form.descricao, palavrasChave:form.palavrasChave })
      })
      const d = await r.json()
      if (d.persona) { set('persona', d.persona); setDirty(true) }
      if (d.palavrasChave?.length) set('palavrasChave', [...new Set([...form.palavrasChave,...d.palavrasChave])])
    } catch {}
    setGerando(false)
  }

  const salvar = async () => {
    if (!form.nome.trim()) return
    setSalvando(true)
    try {
      const isNovo = !agente?.id
      const url    = isNovo ? `${api}/api/agentes` : `${api}/api/agentes/${agente.id}`
      await fetch(url, {
        method: isNovo?'POST':'PATCH',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form)
      })
      setSalvoOk(true); setDirty(false)
      setTimeout(()=>{ setSalvoOk(false); onSave() }, 1500)
    } catch {}
    setSalvando(false)
  }

  const inp = { background:'var(--bg)', border:'1px solid var(--sep)', borderRadius:10, color:'var(--label)', outline:'none', padding:'10px 14px', fontSize:13, width:'100%', fontFamily:'inherit', lineHeight:1.6 }

  return (
    <div className="h-full flex overflow-hidden">

      {/* ── Coluna esquerda: form ───────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header do agente */}
        <div className="flex items-center gap-4 px-6 py-4 flex-shrink-0"
          style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
          <button onClick={onVoltar} className="p-2 rounded-[9px] flex items-center gap-1.5 text-[12px]"
            style={{ background:'var(--fill)', color:'var(--label-2)' }}>
            <ArrowLeft size={13}/> Voltar
          </button>

          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden cursor-pointer"
              style={{ background:'var(--fill)', border:'2px solid var(--sep)' }}
              onClick={()=>setShowAvatar(v=>!v)}>
              {form.avatar
                ? <img src={form.avatar} alt="" className="w-full h-full object-cover"/>
                : <div className="w-full h-full flex items-center justify-center text-[18px] font-bold" style={{ color:'var(--accent)' }}>
                    {(form.nome||'?')[0]}
                  </div>
              }
            </div>
            {showAvatar && (
              <div className="absolute top-14 left-0 z-50 p-3 rounded-[14px] grid grid-cols-3 gap-2"
                style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', boxShadow:'0 8px 24px rgba(0,0,0,0.15)', width:200 }}>
                {AVATARES.map(av=>(
                  <button key={av} onClick={()=>{ set('avatar',av); setShowAvatar(false) }}
                    className="rounded-full overflow-hidden transition-all hover:scale-110"
                    style={{ border: form.avatar===av?'2px solid var(--accent)':'2px solid transparent', width:52, height:52 }}>
                    <img src={av} alt="" className="w-full h-full object-cover"/>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <input value={form.nome} onChange={e=>set('nome',e.target.value)}
              placeholder="Nome do agente"
              className="w-full outline-none text-[16px] font-bold bg-transparent"
              style={{ color:'var(--label)' }}/>
            <input value={form.descricao} onChange={e=>set('descricao',e.target.value)}
              placeholder="Descrição curta..."
              className="w-full outline-none text-[12px] bg-transparent"
              style={{ color:'var(--label-3)' }}/>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Toggle ativo */}
            <button onClick={()=>set('ativo',!form.ativo)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-semibold transition-all"
              style={{
                background: form.ativo?'rgba(34,197,94,0.1)':'var(--fill)',
                color:      form.ativo?'#22c55e':'var(--label-3)',
                border:     form.ativo?'1px solid rgba(34,197,94,0.3)':'1px solid var(--sep)',
              }}>
              {form.ativo?<ToggleRight size={15} strokeWidth={2}/>:<ToggleLeft size={15} strokeWidth={1.5}/>}
              {form.ativo?'Ativo':'Inativo'}
            </button>

            {/* Conversar */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-medium"
              style={{ background:'var(--fill)', color:'var(--label-2)', border:'1px solid var(--sep)' }}>
              <MessageSquare size={13}/> Conversar
            </button>

            {/* Salvar */}
            <button onClick={salvar} disabled={salvando||!dirty}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all"
              style={{ background:salvoOk?'#22c55e':dirty?'var(--accent)':'var(--fill)', color:dirty?'#000':'var(--label-4)', opacity:dirty?1:0.5 }}>
              {salvando?<RefreshCw size={13} className="animate-spin"/>:salvoOk?<CheckCircle size={13}/>:<Save size={13}/>}
              {salvoOk?'Salvo!':'Salvar'}
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-1 px-6 pt-3 pb-0 flex-shrink-0"
          style={{ borderBottom:'1px solid var(--sep)' }}>
          {ABAS.map(a=>{
            const Ic = a.icon
            return (
              <button key={a.id} onClick={()=>setAba(a.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-t-[8px] text-[12px] font-medium transition-all"
                style={{
                  background:    aba===a.id?'var(--bg)':'transparent',
                  color:         aba===a.id?'var(--label)':'var(--label-3)',
                  borderTop:     aba===a.id?'1px solid var(--sep)':undefined,
                  borderLeft:    aba===a.id?'1px solid var(--sep)':undefined,
                  borderRight:   aba===a.id?'1px solid var(--sep)':undefined,
                  marginBottom:  aba===a.id?'-1px':undefined,
                }}>
                <Ic size={12}/> {a.label}
              </button>
            )
          })}
        </div>

        {/* Conteúdo da aba */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[600px] mx-auto p-6 space-y-5">

            {/* ── CÉREBRO ───────────────────────────────────────── */}
            {aba === 'cerebro' && (
              <>
                <div>
                  <h4 className="text-[13px] font-semibold mb-1" style={{ color:'var(--label)' }}>Dados do e-commerce</h4>
                  <p className="text-[11px] mb-3" style={{ color:'var(--label-3)' }}>Fontes de dados que este agente pode usar para responder</p>
                  <div className="rounded-[14px] overflow-hidden" style={{ border:'1px solid var(--sep)' }}>
                    {CEREBRO_FONTES.map((f,i)=>{
                      const Ic = f.icon
                      return (
                        <div key={f.id} className="flex items-center gap-3 px-4 py-3 transition-all"
                          style={{ borderTop:i>0?'1px solid var(--sep)':'none', background:form.cerebro[f.id]?'var(--accent-dim)':'var(--bg-2)', opacity:f.disponivel?1:0.5 }}>
                          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                            style={{ background:'var(--fill)' }}>
                            <Ic size={14} style={{ color:'var(--label-2)' }}/>
                          </div>
                          <div className="flex-1">
                            <p className="text-[12px] font-semibold" style={{ color:'var(--label)' }}>{f.label}</p>
                            <p className="text-[10px]" style={{ color:'var(--label-3)' }}>{f.disponivel?f.desc:'Em breve'}</p>
                          </div>
                          {f.disponivel && (
                            <button onClick={()=>setCerebro(f.id,!form.cerebro[f.id])}
                              style={{ color:form.cerebro[f.id]?'#22c55e':'var(--label-4)' }}>
                              {form.cerebro[f.id]?<ToggleRight size={20} strokeWidth={2}/>:<ToggleLeft size={20} strokeWidth={1.5}/>}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-[13px] font-semibold mb-1" style={{ color:'var(--label)' }}>Palavras-chave de ativação</h4>
                  <p className="text-[11px] mb-3" style={{ color:'var(--label-3)' }}>O roteador usa estas palavras para decidir quando este agente é chamado</p>
                  <TagInput tags={form.palavrasChave} onChange={v=>set('palavrasChave',v)} placeholder="Ex: pedido, rastreio, entrega..."/>
                </div>
              </>
            )}

            {/* ── PERSONALIDADE ─────────────────────────────────── */}
            {aba === 'personalidade' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[13px] font-semibold" style={{ color:'var(--label)' }}>Persona da IA</h4>
                    <p className="text-[11px]" style={{ color:'var(--label-3)' }}>Como este agente deve se comportar e comunicar</p>
                  </div>
                  <button onClick={gerarPersona} disabled={gerando}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[11px] font-semibold"
                    style={{ background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
                    {gerando?<RefreshCw size={11} className="animate-spin"/>:<Sparkles size={11}/>}
                    {gerando?'Gerando...':'Gerar com IA'}
                  </button>
                </div>
                <textarea value={form.persona} onChange={e=>set('persona',e.target.value)} rows={8}
                  placeholder="Descreva como este agente deve se comportar, seu tom, o que sabe e o que não deve fazer..."
                  style={{ ...inp, resize:'none', fontFamily:'monospace', fontSize:12 }}/>

                <div>
                  <h4 className="text-[13px] font-semibold mb-1" style={{ color:'var(--label)' }}>Tom de voz</h4>
                  <p className="text-[11px] mb-3" style={{ color:'var(--label-3)' }}>Ajuste o estilo de comunicação do agente</p>
                  <div className="space-y-4">
                    {TONS_VOZ.map(t=>(
                      <TomSlider key={t.id} tom={t} value={form.tons[t.id]} onChange={v=>setTon(t.id,v)}/>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── INSTRUÇÕES ────────────────────────────────────── */}
            {aba === 'instrucoes' && (
              <>
                <div>
                  <h4 className="text-[13px] font-semibold mb-3" style={{ color:'var(--label)' }}>Informações essenciais</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-medium mb-1 block" style={{ color:'var(--label-2)' }}>Quem é este agente?</label>
                      <input value={form.instrucoes.quemEh} onChange={e=>setInstr('quemEh',e.target.value)}
                        placeholder="Ex: Você é a Molise, assistente virtual da loja Só Strass..."
                        style={inp}/>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium mb-1 block" style={{ color:'var(--label-2)' }}>O que este agente faz?</label>
                      <textarea value={form.instrucoes.oQueFaz} onChange={e=>setInstr('oQueFaz',e.target.value)}
                        rows={3} placeholder="Descreva as principais responsabilidades..."
                        style={{ ...inp, resize:'none' }}/>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium mb-1 block" style={{ color:'var(--label-2)' }}>Qual o objetivo?</label>
                      <textarea value={form.instrucoes.objetivo} onChange={e=>setInstr('objetivo',e.target.value)}
                        rows={2} placeholder="O objetivo principal deste agente é..."
                        style={{ ...inp, resize:'none' }}/>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[13px] font-semibold mb-3" style={{ color:'var(--label)' }}>Regras gerais</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-medium mb-1 block" style={{ color:'var(--label-2)' }}>Instruções adicionais</label>
                      <textarea value={form.instrucoes.regras} onChange={e=>setInstr('regras',e.target.value)}
                        rows={4} placeholder="Regras específicas, restrições, comportamentos obrigatórios..."
                        style={{ ...inp, resize:'none' }}/>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium mb-1 block" style={{ color:'var(--label-2)' }}>Temas que deve evitar</label>
                      <input value={form.instrucoes.evitarTemas} onChange={e=>setInstr('evitarTemas',e.target.value)}
                        placeholder="Ex: política, religião, finanças pessoais..."
                        style={inp}/>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── FERRAMENTAS ───────────────────────────────────── */}
            {aba === 'ferramentas' && (
              <div>
                <h4 className="text-[13px] font-semibold mb-1" style={{ color:'var(--label)' }}>Ferramentas disponíveis</h4>
                <p className="text-[11px] mb-3" style={{ color:'var(--label-3)' }}>Ações que este agente pode executar automaticamente</p>
                <div className="rounded-[14px] overflow-hidden" style={{ border:'1px solid var(--sep)' }}>
                  {FERRAMENTAS.map((f,i)=>{
                    const Ic = f.icon
                    const ativa = form.ferramentas[f.id]
                    return (
                      <div key={f.id} className="flex items-center gap-3 px-4 py-3.5 transition-all"
                        style={{ borderTop:i>0?'1px solid var(--sep)':'none', background:ativa?'var(--accent-dim)':'var(--bg-2)' }}>
                        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                          style={{ background:ativa?'var(--fill)':'var(--fill)', border:`1px solid ${ativa?'var(--accent-border)':'var(--sep)'}` }}>
                          <Ic size={15} style={{ color:ativa?'var(--accent)':'var(--label-3)' }}/>
                        </div>
                        <div className="flex-1">
                          <p className="text-[12px] font-semibold" style={{ color:'var(--label)' }}>{f.label}</p>
                          <p className="text-[10px]" style={{ color:'var(--label-3)' }}>{f.desc}</p>
                        </div>
                        <button onClick={()=>setFerr(f.id,!ativa)}
                          style={{ color:ativa?'#22c55e':'var(--label-4)' }}>
                          {ativa?<ToggleRight size={20} strokeWidth={2}/>:<ToggleLeft size={20} strokeWidth={1.5}/>}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── AVANÇADO ──────────────────────────────────────── */}
            {aba === 'avancado' && (
              <>
                <div>
                  <h4 className="text-[13px] font-semibold mb-1" style={{ color:'var(--label)' }}>Modelo de IA</h4>
                  <p className="text-[11px] mb-2" style={{ color:'var(--label-3)' }}>Modelo que este agente utilizará para processar mensagens</p>
                  <select value={form.modelo} onChange={e=>set('modelo',e.target.value)}
                    className="w-full px-3 py-2.5 rounded-[10px] text-[13px] outline-none"
                    style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }}>
                    {MODELOS.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-[13px] font-semibold" style={{ color:'var(--label)' }}>Temperatura</h4>
                      <p className="text-[11px]" style={{ color:'var(--label-3)' }}>Aleatoriedade da resposta — 0.5 para mais consistência</p>
                    </div>
                    <span className="text-[13px] font-mono font-semibold" style={{ color:'var(--accent)' }}>
                      {form.temperatura.toFixed(1)}
                    </span>
                  </div>
                  <input type="range" min={0} max={1} step={0.1} value={form.temperatura}
                    onChange={e=>set('temperatura',parseFloat(e.target.value))}
                    className="w-full" style={{ accentColor:'var(--accent)' }}/>
                  <div className="flex justify-between text-[9px] mt-1" style={{ color:'var(--label-4)' }}>
                    <span>0 — Consistente</span><span>0.5 — Balanceado</span><span>1 — Criativo</span>
                  </div>
                </div>

                <div className="rounded-[14px] overflow-hidden" style={{ border:'1px solid var(--sep)' }}>
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
                    <div>
                      <p className="text-[12px] font-semibold" style={{ color:'var(--label)' }}>Restrição de conhecimento</p>
                      <p className="text-[10px]" style={{ color:'var(--label-3)' }}>Responde apenas com dados do sistema, sem inventar</p>
                    </div>
                    <ToggleRight size={20} style={{ color:'#22c55e' }} strokeWidth={2}/>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-[12px] font-semibold" style={{ color:'var(--label)' }}>Detector de idioma</p>
                      <p className="text-[10px]" style={{ color:'var(--label-3)' }}>Responde no idioma do cliente automaticamente</p>
                    </div>
                    <ToggleLeft size={20} style={{ color:'var(--label-4)' }} strokeWidth={1.5}/>
                  </div>
                </div>

                {agente?.id && (
                  <div className="pt-4" style={{ borderTop:'1px solid var(--sep)' }}>
                    <button onClick={()=>onDelete(agente)}
                      className="text-[12px] font-medium"
                      style={{ color:'var(--red)' }}>
                      Excluir este agente permanentemente
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* ── Preview ──────────────────────────────────────────────── */}
      <div className="w-[280px] flex-shrink-0 flex flex-col overflow-hidden"
        style={{ borderLeft:'1px solid var(--sep)', background:'var(--bg-2)' }}>
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--label-3)' }}>
            💬 Preview da conversa
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          <PreviewChat agente={form}/>
        </div>
      </div>
    </div>
  )
}

// ── Lista de agentes ──────────────────────────────────────────────────────────
export default function PageAgentesMulti({ api: apiProp }) {
  const api = apiProp || BASE
  const [agentes,  setAgentes]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [editando, setEditando] = useState(null) // null = lista, 'novo' = novo, {agente} = edit
  const [confirmar,setConfirmar]= useState(null)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/agentes`)
      if (r.ok) { const d = await r.json(); setAgentes(d.agentes||[]) }
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  const toggleAtivo = async (ag) => {
    setAgentes(prev=>prev.map(a=>a.id===ag.id?{...a,ativo:!a.ativo}:a))
    await fetch(`${api}/api/agentes/${ag.id}`,{
      method:'PATCH',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ativo:!ag.ativo})
    }).catch(()=>{})
  }

  const deletar = async (ag) => {
    await fetch(`${api}/api/agentes/${ag.id}`,{method:'DELETE'}).catch(()=>{})
    setConfirmar(null); setEditando(null); carregar()
  }

  const mover = async (idx, dir) => {
    const novos = [...agentes]
    const troca = idx+dir
    if (troca<0||troca>=novos.length) return
    ;[novos[idx],novos[troca]]=[novos[troca],novos[idx]]
    setAgentes(novos)
    await fetch(`${api}/api/agentes/reordenar`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ids:novos.map(a=>a.id)})
    }).catch(()=>{})
  }

  // Modo edição
  if (editando !== null) {
    return (
      <EditorAgente
        agente={editando==='novo'?null:editando}
        api={api}
        onSave={() => { setEditando(null); carregar() }}
        onDelete={setConfirmar}
        onVoltar={() => setEditando(null)}/>
    )
  }

  // Lista
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background:'var(--bg)' }}>

      <div className="px-6 py-4 flex-shrink-0 flex items-center justify-between"
        style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
        <div>
          <h2 className="text-[22px] font-bold" style={{ color:'var(--label)' }}>Meus Agentes</h2>
          <p className="text-[13px] mt-0.5" style={{ color:'var(--label-3)' }}>
            {agentes.filter(a=>a.ativo).length} ativos · {agentes.length} total · o roteador escolhe pelo contexto
          </p>
        </div>
        <button onClick={()=>setEditando('novo')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[11px] text-[13px] font-semibold"
          style={{ background:'var(--accent)', color:'#000' }}>
          <Plus size={14}/> Criar agente
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading && (
          <div className="flex justify-center py-12" style={{ color:'var(--label-3)' }}>
            <RefreshCw size={16} className="animate-spin"/>
          </div>
        )}

        {!loading && agentes.length === 0 && (
          <div className="flex flex-col items-center py-20">
            <Brain size={40} className="mb-4 opacity-15" style={{ color:'var(--label)' }}/>
            <p className="text-[16px] font-semibold mb-1" style={{ color:'var(--label-2)' }}>Nenhum agente criado</p>
            <p className="text-[13px] mb-6" style={{ color:'var(--label-3)' }}>Crie agentes especializados para cada tipo de atendimento</p>
            <button onClick={()=>setEditando('novo')}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold"
              style={{ background:'var(--accent)', color:'#000' }}>
              <Plus size={13}/> Criar primeiro agente
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 max-w-[900px]">
          {agentes.map((ag, idx) => (
            <div key={ag.id}
              className="rounded-[18px] overflow-hidden transition-all cursor-pointer group"
              style={{ border:'1px solid var(--sep)', background:'var(--bg-2)', opacity:ag.ativo?1:0.6 }}
              onClick={()=>setEditando(ag)}>

              {/* Faixa superior colorida */}
              <div className="h-1.5" style={{ background: ag.cor || 'var(--accent)' }}/>

              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-[14px] overflow-hidden flex-shrink-0"
                    style={{ background:'var(--fill)', border:'1px solid var(--sep)' }}>
                    {ag.avatar
                      ? <img src={ag.avatar} alt="" className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center text-[20px] font-bold"
                          style={{ color:ag.cor||'var(--accent)' }}>
                          {ag.emoji||ag.nome?.[0]||'?'}
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold leading-tight" style={{ color:'var(--label)' }}>{ag.nome}</p>
                    <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color:'var(--label-3)' }}>{ag.descricao}</p>
                  </div>
                </div>

                {/* Palavras-chave */}
                {ag.palavrasChave?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {ag.palavrasChave.slice(0,4).map(p=>(
                      <span key={p} className="px-1.5 py-0.5 rounded-full text-[9px]"
                        style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>
                        {p}
                      </span>
                    ))}
                    {ag.palavrasChave.length>4&&<span className="text-[9px]" style={{ color:'var(--label-4)' }}>+{ag.palavrasChave.length-4}</span>}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3" style={{ borderTop:'1px solid var(--sep)' }}
                  onClick={e=>e.stopPropagation()}>
                  {/* Reordenar */}
                  <div className="flex gap-0.5">
                    <button onClick={()=>mover(idx,-1)} disabled={idx===0}
                      className="p-1 rounded-[5px] disabled:opacity-20" style={{ color:'var(--label-3)' }}>
                      <ChevronUp size={12}/>
                    </button>
                    <button onClick={()=>mover(idx,1)} disabled={idx===agentes.length-1}
                      className="p-1 rounded-[5px] disabled:opacity-20" style={{ color:'var(--label-3)' }}>
                      <ChevronDown size={12}/>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status */}
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${ag.ativo?'animate-pulse':''}`}
                        style={{ background:ag.ativo?'#22c55e':'var(--label-4)' }}/>
                      <span className="text-[10px]" style={{ color:'var(--label-4)' }}>
                        {ag.ativo?'Ativo':'Inativo'}
                      </span>
                    </div>
                    {/* Toggle */}
                    <button onClick={()=>toggleAtivo(ag)} style={{ color:ag.ativo?'#22c55e':'var(--label-4)' }}>
                      {ag.ativo?<ToggleRight size={18} strokeWidth={2}/>:<ToggleLeft size={18} strokeWidth={1.5}/>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmar deletar */}
      {confirmar && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
          <div className="rounded-[16px] p-6 w-full max-w-[360px] space-y-4"
            style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
            <p className="text-[14px] font-semibold" style={{ color:'var(--label)' }}>
              Excluir "{confirmar.nome}"?
            </p>
            <p className="text-[12px]" style={{ color:'var(--label-2)' }}>Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmar(null)} className="flex-1 py-2.5 rounded-[10px] text-[13px]"
                style={{ background:'var(--fill)', color:'var(--label-2)' }}>Cancelar</button>
              <button onClick={()=>deletar(confirmar)} className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold"
                style={{ background:'rgba(239,68,68,0.15)', color:'var(--red)' }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
