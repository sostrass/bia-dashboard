import { useState, useEffect, useRef } from 'react'
import {
  Bot, Brain, Zap, Shield, Clock, Check, Plus, Trash2,
  RefreshCw, AlertTriangle, Eye, EyeOff, TrendingUp,
  DollarSign, Cpu, Info
} from 'lucide-react'

// \u2500\u2500\u2500 Cat\u00e1logo de modelos com pre\u00e7os oficiais (Mai/2026) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const MODELS = [
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    desc: 'Mais econ\u00f4mico \u2014 ideal para alto volume',
    badge: 'Mais barato',
    badgeColor: 'var(--accent)',
    level: 2,
    c: 'var(--accent)',
    inputPer1M: 0.10,
    outputPer1M: 0.40,
    freeTier: true,
    context: '1M tokens',
    deprecated: false,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    desc: 'Melhor custo-benef\u00edcio para produ\u00e7\u00e3o',
    badge: 'Recomendado',
    badgeColor: 'var(--blue)',
    level: 3,
    c: 'var(--blue)',
    inputPer1M: 0.30,
    outputPer1M: 2.50,
    freeTier: true,
    context: '1M tokens',
    deprecated: false,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    desc: 'M\u00e1xima intelig\u00eancia e racioc\u00ednio complexo',
    badge: 'Premium',
    badgeColor: 'var(--purple)',
    level: 5,
    c: 'var(--purple)',
    inputPer1M: 1.25,
    outputPer1M: 10.00,
    freeTier: false,
    context: '1M tokens',
    note: '2\u00d7 o pre\u00e7o acima de 200k tokens',
    deprecated: false,
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    desc: 'Descontinuado \u2014 migre para 2.5 Flash',
    badge: 'Descontinuado',
    badgeColor: 'var(--red)',
    level: 2,
    c: 'var(--red)',
    inputPer1M: 0.10,
    outputPer1M: 0.40,
    freeTier: false,
    context: '1M tokens',
    deprecated: true,
    deprecatedDate: '1 Jun 2026',
  },
]

// Estimativas baseadas em 300 tokens entrada + 200 tokens sa\u00edda por mensagem
function custoPorMsg(m) {
  const v = (300 / 1e6) * m.inputPer1M + (200 / 1e6) * m.outputPer1M
  return v < 0.0001 ? '< $0,0001' : `$${v.toFixed(4)}`
}
function custoMensal(m, qtd = 1000) {
  const v = ((300 / 1e6) * m.inputPer1M + (200 / 1e6) * m.outputPer1M) * qtd
  return `$${v.toFixed(2)}`
}
function custoMensalNum(m, qtd = 1000) {
  return ((300 / 1e6) * m.inputPer1M + (200 / 1e6) * m.outputPer1M) * qtd
}

const DEF_PERSONA = `Voc\u00ea \u00e9 Bia, assistente virtual especializada em acess\u00f3rios de armarinho e bijuterias. Voc\u00ea \u00e9 simp\u00e1tica, objetiva e resolve tudo sem precisar de humanos.

Ao atender:
- Apresente-se pelo nome na primeira mensagem
- Use linguagem leve e acolhedora
- Seja r\u00e1pida e objetiva \u2014 m\u00e1ximo 3 par\u00e1grafos
- Nunca diga "n\u00e3o posso" \u2014 voc\u00ea sempre resolve
- Verifique estoque antes de confirmar disponibilidade`

const DEF_QR = [
  { id: 1, trigger: 'prazo de entrega', text: 'O prazo \u00e9 de 5 a 10 dias \u00fateis via Correios. Para capitais, 2 a 5 dias.' },
  { id: 2, trigger: 'frete gr\u00e1tis',     text: 'Frete gr\u00e1tis para compras acima de R$ 150,00 para todo o Brasil!' },
  { id: 3, trigger: 'troca devolu\u00e7\u00e3o',  text: 'Voc\u00ea tem 7 dias ap\u00f3s o recebimento para solicitar troca ou devolu\u00e7\u00e3o. Me informe o n\u00famero do pedido!' },
]

const DEF_BH = [
  { id: 'emoji',     label: 'Usar emojis',                         desc: 'Inclui emojis moderados para mensagens mais amig\u00e1veis',   on: true  },
  { id: 'proactive', label: 'Perguntar se precisa de mais ajuda',  desc: 'Ao finalizar, sempre pergunta se pode ajudar em mais algo', on: true  },
  { id: 'upsell',    label: 'Sugerir produtos relacionados',       desc: 'Sugere itens complementares ao produto consultado',        on: false },
  { id: 'review',    label: 'Solicitar avalia\u00e7\u00e3o ap\u00f3s entrega',    desc: 'Pede nota automaticamente 24h ap\u00f3s confirma\u00e7\u00e3o de entrega', on: true  },
  { id: 'escalate',  label: 'Escalar para humano se insatisfeito', desc: 'Notifica equipe ap\u00f3s 2 tentativas frustradas',             on: false },
  { id: 'formal',    label: 'Tom formal',                          desc: 'Linguagem mais profissional e formal nas respostas',       on: false },
]

const SECTIONS = [
  { id: 'persona',   icon: Bot,        label: 'Persona' },
  { id: 'modelo',    icon: Brain,      label: 'Modelo IA' },
  { id: 'custos',    icon: DollarSign, label: 'Custos' },
  { id: 'respostas', icon: Zap,        label: 'Respostas R\u00e1pidas' },
  { id: 'regras',    icon: Shield,     label: 'Regras' },
  { id: 'tempos',    icon: Clock,      label: 'Tempos' },
]

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on}
      className="relative flex-shrink-0 transition-all duration-200"
      style={{ width: 44, height: 24, borderRadius: 12, background: on ? 'var(--accent)' : 'var(--bg-4)' }}>
      <span className="absolute top-0.5 h-5 w-5 bg-white rounded-full shadow-sm transition-all duration-200"
        style={{ left: on ? 'calc(100% - 22px)' : '2px' }} />
    </button>
  )
}

function Label({ children, className = '' }) {
  return (
    <label className={`text-[11px] font-semibold block mb-1.5 uppercase tracking-wider ${className}`}
      style={{ color: 'var(--label-3)' }}>
      {children}
    </label>
  )
}

export default function PageAgentes({ api }) {
  const [sec,        setSec]       = useState('persona')
  const [model,      setModel]     = useState('gemini-2.5-flash')
  const [temp,       setTemp]      = useState(70)
  const [apiKey,     setApiKey]    = useState('')
  const [savedKey,   setSavedKey]  = useState('')   // m\u00e1scara ex: "***4Abc"
  const [showKey,    setShowKey]   = useState(false)
  const [nome,       setNome]      = useState('Bia')
  const [loja,       setLoja]      = useState('Armarinhos & Bijuterias')
  const [persona,    setPersona]   = useState(DEF_PERSONA)
  const [qrs,        setQrs]       = useState(DEF_QR)
  const [bhs,        setBhs]       = useState(DEF_BH)
  const [ntrig,      setNtrig]     = useState('')
  const [nrep,       setNrep]      = useState('')
  const [msgsMes,    setMsgsMes]   = useState(1000)

  const [loading,    setLoading]   = useState(true)
  const [saving,     setSaving]    = useState(false)
  const [saved,      setSaved]     = useState(false)
  const [keyStatus,  setKeyStatus] = useState('idle') // idle | testing | ok | error
  const [saveMsg,    setSaveMsg]   = useState('')

  // \u2500\u2500 Carrega configura\u00e7\u00f5es do PostgreSQL ao montar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(`${api}/api/ia/config`)
        if (!r.ok) throw new Error()
        const d = await r.json()
        if (d.modelo)      setModel(d.modelo)
        if (d.temperatura) setTemp(Math.round(parseFloat(d.temperatura) * 100))
        if (d.nome)        setNome(d.nome)
        if (d.loja)        setLoja(d.loja)
        if (d.persona)     setPersona(d.persona)
        if (d.geminiKey)   setSavedKey(d.geminiKey) // j\u00e1 vem mascarado do server
        if (d.quickReplies) {
          try { const q = JSON.parse(d.quickReplies); if (Array.isArray(q)) setQrs(q) } catch {}
        }
        if (d.behaviors) {
          try { const b = JSON.parse(d.behaviors); if (Array.isArray(b)) setBhs(b) } catch {}
        }
      } catch {}
      finally { setLoading(false) }
    })()
  }, [api])

  // \u2500\u2500 Salva tudo no PostgreSQL \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const save = async () => {
    setSaving(true)
    try {
      const body = {
        modelo:       model,
        temperatura:  (temp / 100).toString(),
        nome, loja, persona,
        quickReplies: JSON.stringify(qrs),
        behaviors:    JSON.stringify(bhs),
      }
      if (apiKey.trim()) body.geminiKey = apiKey.trim()

      const r = await fetch(`${api}/api/ia/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) throw new Error('Servidor retornou erro')

      if (apiKey.trim()) {
        setSavedKey('***' + apiKey.trim().slice(-4))
        setApiKey('')
      }
      setSaved(true)
      setSaveMsg('Configura\u00e7\u00f5es salvas com sucesso!')
      setTimeout(() => { setSaved(false); setSaveMsg('') }, 3000)
    } catch (e) {
      setSaveMsg('Erro ao salvar: ' + e.message)
      setTimeout(() => setSaveMsg(''), 4000)
    } finally { setSaving(false) }
  }

  // \u2500\u2500 Testa a chave Gemini via backend \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const testKey = async () => {
    const key = apiKey.trim()
    if (!key) return
    setKeyStatus('testing')
    try {
      const r = await fetch(`${api}/api/ia/test-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiKey: key, modelo: model }),
      })
      const d = await r.json()
      setKeyStatus(d.ok ? 'ok' : 'error')
    } catch {
      setKeyStatus('error')
    }
  }

  const selectedModel = MODELS.find(m => m.id === model) || MODELS[1]

  const inp = {
    background: 'var(--bg-3)',
    border: '1px solid var(--sep)',
    borderRadius: 10,
    color: 'var(--label)',
    outline: 'none',
    padding: '9px 12px',
    fontSize: 13,
    fontFamily: 'inherit',
    transition: 'border-color .15s',
    width: '100%',
  }
  const onFocus = e => e.target.style.borderColor = 'var(--accent)'
  const onBlur  = e => e.target.style.borderColor = 'var(--sep)'

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center gap-3" style={{ color: 'var(--label-3)' }}>
        <RefreshCw size={16} className="animate-spin" />
        <span className="text-[14px]">Carregando configura\u00e7\u00f5es...</span>
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-hidden">

      {/* \u2500\u2500 Sidebar \u2500\u2500 */}
      <aside className="w-[210px] flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--sep)' }}>

        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--sep)' }}>
          <div className="text-[17px] font-semibold" style={{ color: 'var(--label)' }}>Agentes IA</div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--label-3)' }}>Comportamento e configura\u00e7\u00e3o</div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSec(s.id)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-all border-l-2"
              style={{
                background:      sec === s.id ? 'var(--accent-dim)' : 'transparent',
                borderLeftColor: sec === s.id ? 'var(--accent)'     : 'transparent',
                color:           sec === s.id ? 'var(--accent)'     : 'var(--label-2)',
                fontWeight:      sec === s.id ? 600 : 400,
              }}>
              <s.icon size={14} />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Modelo ativo resumido */}
        <div className="p-3" style={{ borderTop: '1px solid var(--sep)' }}>
          <div className="rounded-[10px] p-3" style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)' }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--label-3)' }}>
              Modelo ativo
            </div>
            <div className="text-[12px] font-semibold" style={{ color: selectedModel.c }}>
              {selectedModel.name}
            </div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--label-3)' }}>
              {custoPorMsg(selectedModel)}/msg
            </div>
            <div className="text-[11px]" style={{ color: 'var(--label-3)' }}>
              {custoMensal(selectedModel, msgsMes)}/m\u00eas ({msgsMes.toLocaleString()} msgs)
            </div>
          </div>

          {/* Bot\u00e3o salvar */}
          <button onClick={save} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[13px] font-semibold mt-2 transition-all"
            style={{
              background: saved ? 'var(--teal)' : saving ? 'var(--bg-4)' : 'var(--accent)',
              color: '#000',
              opacity: saving ? 0.7 : 1,
            }}>
            {saving ? <><RefreshCw size={13} className="animate-spin" />Salvando...</>
              : saved ? <><Check size={13} />Salvo!</>
              : <>Salvar Configura\u00e7\u00f5es</>}
          </button>

          {saveMsg && (
            <div className="mt-2 text-[11px] text-center" style={{ color: saved ? 'var(--teal)' : 'var(--red)' }}>
              {saveMsg}
            </div>
          )}
        </div>
      </aside>

      {/* \u2500\u2500 Conte\u00fado \u2500\u2500 */}
      <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg)' }}>
        <div className="max-w-3xl mx-auto space-y-5">

          {/* \u2550\u2550 PERSONA \u2550\u2550 */}
          {sec === 'persona' && <>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight" style={{ color: 'var(--label)' }}>Persona & Identidade</h2>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-3)' }}>Defina como a IA se apresenta e se comporta com os clientes</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Identidade */}
              <div className="card p-5 space-y-4">
                <h3 className="text-[14px] font-semibold" style={{ color: 'var(--label)' }}>Identidade</h3>

                <div>
                  <Label>Nome da IA</Label>
                  <input value={nome} onChange={e => setNome(e.target.value)} style={inp} onFocus={onFocus} onBlur={onBlur} />
                </div>

                <div>
                  <Label>Nome da Loja</Label>
                  <input value={loja} onChange={e => setLoja(e.target.value)} style={inp} onFocus={onFocus} onBlur={onBlur} />
                </div>

                {/* Chave Gemini com toggle visibilidade e teste */}
                <div>
                  <Label>Chave Gemini API</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={e => { setApiKey(e.target.value); setKeyStatus('idle') }}
                        placeholder={savedKey ? savedKey : 'AIzaSy...'}
                        style={{ ...inp, fontFamily: 'monospace', fontSize: 11, paddingRight: 36 }}
                        onFocus={onFocus} onBlur={onBlur}
                      />
                      <button onClick={() => setShowKey(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--label-3)' }}>
                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <button onClick={testKey}
                      disabled={!apiKey.trim() || keyStatus === 'testing'}
                      className="px-3 py-2 rounded-[9px] text-[11px] font-semibold flex-shrink-0 transition-all"
                      style={{
                        background: 'var(--fill)', border: '1px solid var(--sep)',
                        color: 'var(--label-2)',
                        opacity: !apiKey.trim() ? 0.5 : 1,
                      }}>
                      {keyStatus === 'testing' ? <RefreshCw size={12} className="animate-spin" /> : 'Testar'}
                    </button>
                  </div>

                  {/* Status da chave */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {keyStatus === 'idle' && savedKey && (
                      <><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                      <span className="text-[10px]" style={{ color: 'var(--accent)' }}>Chave salva: {savedKey}</span></>
                    )}
                    {keyStatus === 'idle' && !savedKey && !apiKey && (
                      <><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--orange)' }} />
                      <span className="text-[10px]" style={{ color: 'var(--orange)' }}>Cole sua chave \u2014 aistudio.google.com</span></>
                    )}
                    {keyStatus === 'testing' && (
                      <><RefreshCw size={10} className="animate-spin" style={{ color: 'var(--label-3)' }} />
                      <span className="text-[10px]" style={{ color: 'var(--label-3)' }}>Testando...</span></>
                    )}
                    {keyStatus === 'ok' && (
                      <><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                      <span className="text-[10px]" style={{ color: 'var(--accent)' }}>\u2713 Chave v\u00e1lida e funcional</span></>
                    )}
                    {keyStatus === 'error' && (
                      <><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--red)' }} />
                      <span className="text-[10px]" style={{ color: 'var(--red)' }}>\u2717 Chave inv\u00e1lida \u2014 verifique no aistudio.google.com</span></>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="card p-5">
                <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--label)' }}>Preview da Conversa</h3>
                <div className="space-y-2">
                  {[
                    { r: 'u', t: 'Oi, tem linha de bordado?' },
                    { r: 'b', t: `Ol\u00e1! Sou ${nome || 'Bia'} da ${loja || 'nossa loja'}! \ud83d\ude0a Temos linha de bordado em v\u00e1rias espessuras. Qual tipo procura?` },
                    { r: 'u', t: 'N\u00ba 8 branca' },
                    { r: 'b', t: 'Linha N\u00ba 8 Branca \u2014 R$ 4,90/novelo. Fa\u00e7o o pedido para voc\u00ea?' },
                  ].map((m, i) => (
                    <div key={i} className={`flex ${m.r === 'b' ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-[88%] px-3 py-2 rounded-[14px] text-[11px] leading-relaxed"
                        style={{
                          background: m.r === 'u' ? 'var(--blue)' : 'var(--bg-3)',
                          color: m.r === 'u' ? '#fff' : 'var(--label)',
                          borderBottomLeftRadius: m.r === 'b' ? 3 : 14,
                          borderBottomRightRadius: m.r === 'u' ? 3 : 14,
                          border: m.r === 'b' ? '1px solid var(--sep)' : 'none',
                        }}>
                        {m.t}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Prompt */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[14px] font-semibold" style={{ color: 'var(--label)' }}>System Prompt \u2014 Ensine a IA</h3>
                <span className="text-[11px]" style={{ color: 'var(--label-3)' }}>{persona.length} caracteres</span>
              </div>
              <p className="text-[12px] mb-3" style={{ color: 'var(--label-3)' }}>
                Escreva como a IA deve se comportar, o tom de voz, regras de atendimento e o que n\u00e3o deve dizer.
                Altera\u00e7\u00f5es t\u00eam efeito imediato ap\u00f3s salvar.
              </p>
              <textarea value={persona} onChange={e => setPersona(e.target.value)} rows={10}
                style={{ ...inp, fontFamily: 'monospace', fontSize: 11, lineHeight: 1.75, resize: 'none' }}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>
          </>}

          {/* \u2550\u2550 MODELO \u2550\u2550 */}
          {sec === 'modelo' && <>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight" style={{ color: 'var(--label)' }}>Modelo de Intelig\u00eancia</h2>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-3)' }}>
                Pre\u00e7os oficiais Gemini API \u2014 Mai/2026 \u00b7 Estimativa: 300 tokens entrada + 200 sa\u00edda/mensagem
              </p>
            </div>

            {/* Aviso modelos deprecated */}
            <div className="flex items-start gap-3 p-4 rounded-[12px]"
              style={{ background: 'rgba(255,69,58,0.06)', border: '1px solid rgba(255,69,58,0.18)' }}>
              <AlertTriangle size={15} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
              <p className="text-[12px]" style={{ color: 'var(--label-2)' }}>
                <strong style={{ color: 'var(--red)' }}>Gemini 2.0 Flash</strong> foi descontinuado e ser\u00e1 encerrado em 1 de junho de 2026.
                Migre para <strong>Gemini 2.5 Flash</strong> \u2014 mesmo custo, mais inteligente.
              </p>
            </div>

            {/* Cards de modelo */}
            <div className="space-y-3">
              {MODELS.map(m => (
                <div key={m.id} onClick={() => !m.deprecated && setModel(m.id)}
                  className="card p-5 transition-all"
                  style={{
                    border: `1px solid ${model === m.id ? m.c : m.deprecated ? 'var(--sep)' : 'var(--sep)'}`,
                    background: model === m.id ? `color-mix(in srgb, ${m.c} 8%, var(--bg-2))` : 'var(--bg-2)',
                    cursor: m.deprecated ? 'not-allowed' : 'pointer',
                    opacity: m.deprecated ? 0.6 : 1,
                  }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold" style={{ color: 'var(--label)' }}>{m.name}</span>
                        {m.deprecated && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(255,69,58,0.12)', color: 'var(--red)' }}>
                            Encerra {m.deprecatedDate}
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] mt-0.5" style={{ color: 'var(--label-3)' }}>{m.desc}</div>
                      {m.note && <div className="text-[10px] mt-1" style={{ color: 'var(--orange)' }}>\u26a0 {m.note}</div>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: `color-mix(in srgb, ${m.badgeColor} 15%, transparent)`, color: m.badgeColor }}>
                        {m.badge}
                      </span>
                      {m.freeTier && (
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-full"
                          style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                          Free tier
                        </span>
                      )}
                      {model === m.id && (
                        <span className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: m.c, color: '#000' }}>
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Grid de pre\u00e7os */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { l: 'Entrada/1M tokens', v: `$${m.inputPer1M.toFixed(2)}` },
                      { l: 'Sa\u00edda/1M tokens',   v: `$${m.outputPer1M.toFixed(2)}` },
                      { l: 'Por mensagem',       v: custoPorMsg(m) },
                      { l: `${msgsMes.toLocaleString()} msgs/m\u00eas`, v: custoMensal(m, msgsMes) },
                    ].map((p, i) => (
                      <div key={i} className="rounded-[8px] p-2.5 text-center"
                        style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)' }}>
                        <div className="text-[13px] font-bold" style={{ color: model === m.id ? m.c : 'var(--label)' }}>{p.v}</div>
                        <div className="text-[9px] mt-0.5" style={{ color: 'var(--label-3)' }}>{p.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Barra de capacidade */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--label-3)' }}>Capacidade</span>
                    <div className="flex-1 h-1 rounded-full" style={{ background: 'var(--sep)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${m.level * 20}%`, background: m.c }} />
                    </div>
                    <span className="text-[10px]" style={{ color: 'var(--label-3)' }}>Contexto: {m.context}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Slider de volume para calcular custo */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[15px] font-semibold" style={{ color: 'var(--label)' }}>Estimativa de Volume</div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--label-3)' }}>Ajuste para ver o custo mensal estimado</div>
                </div>
                <span className="text-[18px] font-bold" style={{ color: 'var(--label)' }}>{msgsMes.toLocaleString()} msgs/m\u00eas</span>
              </div>
              <input type="range" min={100} max={10000} step={100} value={msgsMes}
                onChange={e => setMsgsMes(parseInt(e.target.value))}
                className="w-full" style={{ accentColor: 'var(--accent)' }} />
              <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--label-3)' }}>
                <span>100</span><span>5.000</span><span>10.000</span>
              </div>

              {/* Comparativo r\u00e1pido */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {MODELS.filter(m => !m.deprecated).map(m => (
                  <div key={m.id} className="rounded-[10px] p-3 text-center"
                    style={{ background: model === m.id ? `color-mix(in srgb, ${m.c} 10%, var(--bg-3))` : 'var(--bg-3)', border: `1px solid ${model === m.id ? m.c : 'var(--sep)'}` }}>
                    <div className="text-[11px] font-semibold mb-1" style={{ color: 'var(--label-2)' }}>{m.name.replace('Gemini ', '')}</div>
                    <div className="text-[18px] font-bold" style={{ color: m.c }}>{custoMensal(m, msgsMes)}</div>
                    <div className="text-[9px] mt-0.5" style={{ color: 'var(--label-3)' }}>estimado/m\u00eas</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Temperatura */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[15px] font-semibold" style={{ color: 'var(--label)' }}>Criatividade das Respostas</div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--label-3)' }}>Temperatura \u2014 quanto maior, mais criativo</div>
                </div>
                <span className="text-[24px] font-bold" style={{ color: 'var(--accent)' }}>{temp}%</span>
              </div>
              <input type="range" min={0} max={100} value={temp}
                onChange={e => setTemp(parseInt(e.target.value))}
                className="w-full" style={{ accentColor: 'var(--accent)' }} />
              <div className="flex justify-between text-[10px] mt-1.5" style={{ color: 'var(--label-3)' }}>
                <span>Preciso e consistente</span>
                <span>Balanceado</span>
                <span>Criativo e variado</span>
              </div>
            </div>
          </>}

          {/* \u2550\u2550 CUSTOS \u2550\u2550 */}
          {sec === 'custos' && <>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight" style={{ color: 'var(--label)' }}>Dashboard de Gastos</h2>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-3)' }}>
                Estimativas baseadas no modelo selecionado e volume real de mensagens
              </p>
            </div>

            {/* KPIs de custo */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { l: 'Custo estimado hoje',    v: `$${custoMensalNum(selectedModel, 247/30).toFixed(4)}`, sub: '247 msgs hoje', c: 'var(--label)' },
                { l: 'Custo estimado este m\u00eas', v: `$${custoMensalNum(selectedModel, 4200).toFixed(2)}`,   sub: '~4.200 msgs/m\u00eas', c: 'var(--blue)' },
                { l: 'Proje\u00e7\u00e3o anual',          v: `$${(custoMensalNum(selectedModel, 4200)*12).toFixed(2)}`, sub: 'baseado no m\u00eas atual', c: 'var(--purple)' },
              ].map((k, i) => (
                <div key={i} className="card p-4">
                  <div className="text-[11px] mb-1" style={{ color: 'var(--label-3)' }}>{k.l}</div>
                  <div className="text-[26px] font-bold tracking-tight" style={{ color: k.c }}>{k.v}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--label-3)' }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Comparativo por modelo */}
            <div className="card p-5">
              <h3 className="text-[15px] font-semibold mb-4" style={{ color: 'var(--label)' }}>
                Comparativo de Custo \u2014 4.200 msgs/m\u00eas
              </h3>
              <div className="space-y-3">
                {MODELS.filter(m => !m.deprecated).map(m => {
                  const custo = custoMensalNum(m, 4200)
                  const max   = custoMensalNum(MODELS.find(x => x.id === 'gemini-2.5-pro'), 4200)
                  const pct   = (custo / max) * 100
                  return (
                    <div key={m.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-medium" style={{ color: 'var(--label)' }}>{m.name}</span>
                        <span className="text-[13px] font-bold" style={{ color: m.c }}>${custo.toFixed(2)}/m\u00eas</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: 'var(--sep)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: m.c }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 p-3 rounded-[10px] flex items-start gap-2"
                style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
                <Info size={13} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
                <p className="text-[11px]" style={{ color: 'var(--label-2)' }}>
                  Estimativas baseadas em 300 tokens de entrada e 200 de sa\u00edda por mensagem. O custo real varia conforme o
                  tamanho do hist\u00f3rico de contexto e o uso de ferramentas (buscas no Bling/Nuvemshop).
                </p>
              </div>
            </div>

            {/* Dicas de economia */}
            <div className="card p-5">
              <h3 className="text-[15px] font-semibold mb-4" style={{ color: 'var(--label)' }}>Dicas de Economia</h3>
              <div className="space-y-3">
                {[
                  { icon: Brain,      title: 'Use Gemini 2.5 Flash',          desc: 'Mesmo custo que o Flash-Lite, mas muito mais inteligente para atendimento. A melhor rela\u00e7\u00e3o custo-benef\u00edcio.', saving: 'At\u00e9 90% mais barato que Pro' },
                  { icon: Cpu,        title: 'Limite o hist\u00f3rico de contexto', desc: 'O sistema j\u00e1 mant\u00e9m apenas as \u00faltimas 20 mensagens. Diminuir para 10 reduz custo em ~30% por conversa longa.', saving: '~30% de economia' },
                  { icon: TrendingUp, title: 'Respostas R\u00e1pidas',              desc: 'Configure respostas para perguntas comuns (prazo, frete). A IA usa direto, sem chamar o modelo para perguntas simples.', saving: 'Evita chamadas desnecess\u00e1rias' },
                ].map((d, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-[10px]"
                    style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)' }}>
                    <div className="p-2 rounded-[8px] flex-shrink-0" style={{ background: 'var(--fill)' }}>
                      <d.icon size={14} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold" style={{ color: 'var(--label)' }}>{d.title}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--label-3)' }}>{d.desc}</div>
                      <div className="text-[10px] mt-1.5 font-semibold" style={{ color: 'var(--accent)' }}>{d.saving}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>}

          {/* \u2550\u2550 RESPOSTAS R\u00c1PIDAS \u2550\u2550 */}
          {sec === 'respostas' && <>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight" style={{ color: 'var(--label)' }}>Respostas R\u00e1pidas</h2>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-3)' }}>
                A IA usa estas respostas ao detectar palavras-chave nas mensagens dos clientes \u2014 economiza tokens e responde mais r\u00e1pido
              </p>
            </div>

            {/* Nova resposta */}
            <div className="card p-5 space-y-3"
              style={{ border: '1px solid var(--accent)', background: 'var(--accent-dim)' }}>
              <h3 className="text-[14px] font-semibold flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                <Plus size={14} /> Nova Resposta R\u00e1pida
              </h3>
              <div>
                <Label>Palavra-chave ou frase do cliente</Label>
                <input value={ntrig} onChange={e => setNtrig(e.target.value)}
                  placeholder='Ex: "prazo de entrega", "frete gr\u00e1tis", "como rastrear"'
                  style={inp} onFocus={onFocus} onBlur={onBlur}
                  onKeyDown={e => e.key === 'Enter' && document.getElementById('nrep')?.focus()}
                />
              </div>
              <div>
                <Label>Resposta da IA</Label>
                <textarea id="nrep" value={nrep} onChange={e => setNrep(e.target.value)} rows={3}
                  placeholder="Resposta que a IA enviar\u00e1 ao detectar a palavra-chave..."
                  style={{ ...inp, resize: 'none', lineHeight: 1.6 }} onFocus={onFocus} onBlur={onBlur}
                />
              </div>
              <button onClick={() => {
                if (!ntrig.trim() || !nrep.trim()) return
                setQrs(prev => [...prev, { id: Date.now(), trigger: ntrig.trim(), text: nrep.trim() }])
                setNtrig(''); setNrep('')
              }}
                className="px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all"
                style={{ background: 'var(--accent)', color: '#000' }}>
                Adicionar Resposta
              </button>
            </div>

            {/* Lista */}
            <div className="space-y-3">
              {qrs.length === 0 && (
                <div className="text-center py-8" style={{ color: 'var(--label-3)' }}>
                  <Zap size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-[13px]">Nenhuma resposta r\u00e1pida cadastrada</p>
                </div>
              )}
              {qrs.map(r => (
                <div key={r.id} className="card p-4 flex items-start gap-3 group">
                  <div className="flex-1">
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full inline-block mb-2 font-mono"
                      style={{ background: 'rgba(191,90,242,0.12)', color: 'var(--purple)' }}>
                      "{r.trigger}"
                    </span>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--label-2)' }}>{r.text}</p>
                  </div>
                  <button onClick={() => setQrs(prev => prev.filter(x => x.id !== r.id))}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-[8px]"
                    style={{ color: 'var(--red)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </>}

          {/* \u2550\u2550 REGRAS \u2550\u2550 */}
          {sec === 'regras' && <>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight" style={{ color: 'var(--label)' }}>Regras de Comportamento</h2>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-3)' }}>Ative ou desative comportamentos espec\u00edficos da IA</p>
            </div>
            <div className="card overflow-hidden">
              {bhs.map((b, i) => (
                <div key={b.id} className="flex items-center gap-4 px-5 py-4 transition-all"
                  style={{
                    borderBottom: i < bhs.length - 1 ? '1px solid var(--sep)' : 'none',
                  }}>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium" style={{ color: 'var(--label)' }}>{b.label}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: 'var(--label-3)' }}>{b.desc}</div>
                  </div>
                  <Toggle on={b.on} onChange={v => setBhs(prev => prev.map(x => x.id === b.id ? { ...x, on: v } : x))} />
                </div>
              ))}
            </div>
          </>}

          {/* \u2550\u2550 TEMPOS \u2550\u2550 */}
          {sec === 'tempos' && <>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight" style={{ color: 'var(--label)' }}>Configura\u00e7\u00f5es de Tempo</h2>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-3)' }}>Controle o ritmo do atendimento autom\u00e1tico</p>
            </div>
            <div className="card p-5 grid grid-cols-2 gap-5">
              {[
                { l: 'Delay m\u00ednimo de resposta (ms)', v: '800',  d: 'Simula digita\u00e7\u00e3o humana \u2014 evita parecer um bot' },
                { l: 'Debounce \u2014 aguardar cliente (ms)', v: '3000', d: 'Aguarda X ms antes de responder, caso cliente envie mais mensagens' },
                { l: 'Timeout de sess\u00e3o (min)',        v: '60',   d: 'Limpa hist\u00f3rico ap\u00f3s inatividade' },
                { l: 'Lembrete pagamento pendente (h)', v: '2',   d: 'Reenvio autom\u00e1tico do link de pagamento' },
                { l: 'Avalia\u00e7\u00e3o ap\u00f3s entrega (h)',     v: '24',   d: 'Solicita nota do cliente automaticamente' },
                { l: 'Delay envio em massa (ms)',      v: '1500', d: 'Entre cada envio \u2014 respeita rate limit do WhatsApp' },
              ].map((f, i) => (
                <div key={i}>
                  <Label>{f.l}</Label>
                  <input defaultValue={f.v} style={{ ...inp, fontFamily: 'monospace' }} onFocus={onFocus} onBlur={onBlur} />
                  <p className="text-[10px] mt-1" style={{ color: 'var(--label-4)' }}>{f.d}</p>
                </div>
              ))}
            </div>
          </>}

        </div>
      </div>
    </div>
  )
}
