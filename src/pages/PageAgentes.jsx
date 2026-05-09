import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Bot, Brain, MessageSquare, Zap, Plus, Trash2,
  ChevronDown, ChevronUp, GripVertical, Check, X,
  Sparkles, BookOpen, Shield, Clock, ToggleLeft, ToggleRight
} from 'lucide-react'

const MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Rápido e econômico', level: 2, c: '#00e5b4', badge: 'Recomendado' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Inteligente e veloz', level: 3, c: '#38c8ff', badge: 'Balanceado' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Máxima inteligência', level: 5, c: '#b8ff57', badge: 'Premium' },
]

const DEFAULT_QUICK_REPLIES = [
  { id: 1, trigger: 'prazo', text: 'O prazo de entrega é de 5 a 10 dias úteis via Correios. Para regiões metropolitanas pode ser entre 2 a 5 dias.' },
  { id: 2, trigger: 'frete grátis', text: 'Oferecemos frete grátis para compras acima de R$ 150,00 para todo o Brasil!' },
  { id: 3, trigger: 'troca', text: 'Você tem 7 dias após o recebimento para solicitar troca ou devolução. É só me informar o número do pedido!' },
  { id: 4, trigger: 'pagamento', text: 'Aceitamos PIX, boleto bancário e cartão de crédito em até 12x. O link de pagamento é gerado automaticamente!' },
]

const DEFAULT_BEHAVIORS = [
  { id: 'emoji', label: 'Usar emojis nas respostas', desc: 'A IA incluirá emojis relevantes para deixar as mensagens mais amigáveis', enabled: true },
  { id: 'proactive', label: 'Perguntar se precisa de mais ajuda', desc: 'Ao finalizar um atendimento, a IA sempre pergunta se pode ajudar em mais algo', enabled: true },
  { id: 'upsell', label: 'Sugerir produtos relacionados', desc: 'Quando o cliente perguntar sobre um produto, a IA sugere itens complementares', enabled: false },
  { id: 'collect_review', label: 'Solicitar avaliação após entrega', desc: 'Automaticamente pede avaliação 24h após confirmação de entrega', enabled: true },
  { id: 'human_fallback', label: 'Escalar para humano se insatisfeito', desc: 'Se o cliente demonstrar insatisfação após 2 tentativas, notifica a equipe', enabled: false },
  { id: 'formal_tone', label: 'Tom formal', desc: 'Usa linguagem mais formal e profissional nas respostas', enabled: false },
]

function Toggle({ enabled, onChange }) {
  return (
    <button onClick={() => onChange(!enabled)}
      className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 flex-shrink-0',
        enabled ? '' : 'bg-white/10'
      )}
      style={enabled ? { background: '#b8ff57' } : {}}>
      <span className={cn('inline-block h-4 w-4 transform rounded-full transition-transform duration-200',
        enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
      )}
        style={{ background: enabled ? '#0a0a12' : 'rgba(255,255,255,0.5)' }} />
    </button>
  )
}

export default function PageAgentes({ api }) {
  const [model, setModel] = useState('gemini-2.0-flash')
  const [temp, setTemp] = useState(70)
  const [apiKey, setApiKey] = useState('')
  const [nome, setNome] = useState('Bia')
  const [loja, setLoja] = useState('Armarinhos & Bijuterias')
  const [persona, setPersona] = useState(`Você é Bia, assistente virtual especializada em acessórios de armarinho e bijuterias. Você é simpática, objetiva e resolve tudo sem precisar de humanos. Você conhece profundamente os produtos da loja: linhas, agulhas, botões, zíperes, fitas, rendas, elásticos, miçangas, pérolas e bijuterias em geral.

Ao atender um cliente:
- Sempre se apresente pelo nome na primeira mensagem
- Use linguagem leve e acolhedora
- Seja rápida e objetiva nas respostas
- Nunca diga "não posso fazer isso" — você sempre resolve`)

  const [quickReplies, setQuickReplies] = useState(DEFAULT_QUICK_REPLIES)
  const [behaviors, setBehaviors] = useState(DEFAULT_BEHAVIORS)
  const [newTrigger, setNewTrigger] = useState('')
  const [newReply, setNewReply] = useState('')
  const [activeSection, setActiveSection] = useState('persona')
  const [saved, setSaved] = useState(false)

  const addQuickReply = () => {
    if (!newTrigger || !newReply) return
    setQuickReplies([...quickReplies, { id: Date.now(), trigger: newTrigger, text: newReply }])
    setNewTrigger('')
    setNewReply('')
  }

  const removeQuickReply = (id) => setQuickReplies(quickReplies.filter(r => r.id !== id))

  const toggleBehavior = (id) => setBehaviors(behaviors.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b))

  const save = async () => {
    try {
      await fetch(`${api}/api/ia/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiKey: apiKey || undefined, modelo: model, temperatura: (temp / 100).toString(), nome, loja, persona, quickReplies, behaviors })
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { alert('Erro ao salvar. Verifique a conexão com o servidor.') }
  }

  const sections = [
    { id: 'persona', label: 'Persona & Comportamento', icon: Bot },
    { id: 'modelo', label: 'Modelo de IA', icon: Brain },
    { id: 'respostas', label: 'Respostas Rápidas', icon: Zap },
    { id: 'regras', label: 'Regras de Comportamento', icon: Shield },
  ]

  const inputClass = "w-full px-3 py-2 rounded-xl border border-border/50 bg-white/3 text-white text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:border-lime-400/50 transition-colors"

  return (
    <div className="h-full flex overflow-hidden">

      {/* Left nav */}
      <div className="w-56 flex-shrink-0 border-r border-border/50 p-4 space-y-1"
        style={{ background: 'rgba(255,255,255,0.01)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-2 mb-3">
          Configurar Agente
        </p>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
              activeSection === s.id ? 'text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'
            )}
            style={activeSection === s.id ? {
              background: 'rgba(184,255,87,0.1)', border: '1px solid rgba(184,255,87,0.2)', color: '#b8ff57'
            } : {}}>
            <s.icon size={14} />
            {s.label}
          </button>
        ))}

        <div className="pt-4 mt-4 border-t border-border/50">
          <button onClick={save}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: saved ? '#00e5b4' : '#b8ff57', color: '#0a0a12' }}>
            {saved ? <><Check size={14} /> Salvo!</> : <><Sparkles size={14} /> Salvar Agente</>}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* PERSONA */}
        {activeSection === 'persona' && (
          <div className="max-w-3xl space-y-6 animate-slide-in">
            <div>
              <h2 className="font-display font-bold text-xl text-white">Persona & Comportamento</h2>
              <p className="text-sm text-muted-foreground mt-1">Defina como a IA deve se comportar e se apresentar aos clientes</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/50 p-5 space-y-4"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <Bot size={14} style={{ color: '#b8ff57' }} /> Identidade
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Nome da IA</label>
                    <input value={nome} onChange={e => setNome(e.target.value)} className={inputClass} placeholder="Ex: Bia" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Nome da Loja</label>
                    <input value={loja} onChange={e => setLoja(e.target.value)} className={inputClass} placeholder="Ex: Armarinhos & Bijuterias" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Chave API Gemini</label>
                    <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className={inputClass} placeholder="AIzaSy..." style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }} />
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: apiKey.length > 10 ? '#b8ff57' : '#ffb547' }} />
                      <span className="text-[10px]" style={{ color: apiKey.length > 10 ? '#b8ff57' : '#ffb547' }}>
                        {apiKey.length > 10 ? 'Chave válida' : 'Cole sua chave do aistudio.google.com'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 p-5"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <h3 className="font-display font-bold text-sm text-white mb-4 flex items-center gap-2">
                  <BookOpen size={14} style={{ color: '#7c5cfc' }} /> Prévia do Agente
                </h3>
                <div className="space-y-2">
                  {[
                    { r: 'u', t: 'Oi, tem linha de bordado?' },
                    { r: 'b', t: `Olá! Sou ${nome || 'Bia'} da ${loja || 'nossa loja'}! 😊 Sim, temos linha de bordado em várias espessuras e cores. Qual tipo você procura?` },
                    { r: 'u', t: 'Nº 8 branca' },
                    { r: 'b', t: 'Ótimo! Linha de Bordado Nº8 Branca está disponível por R$ 4,90 o novelo. Posso fazer o pedido pra você?' },
                  ].map((m, i) => (
                    <div key={i} className={cn('flex', m.r === 'b' ? 'justify-start' : 'justify-end')}>
                      <div className={cn('max-w-[85%] px-3 py-2 rounded-xl text-[11px] leading-relaxed',
                        m.r === 'b'
                          ? 'rounded-tl-sm text-white/80'
                          : 'rounded-tr-sm text-white'
                      )}
                        style={m.r === 'b'
                          ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }
                          : { background: 'linear-gradient(135deg, #7c5cfc, #5b3fd4)' }
                        }>
                        {m.t}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 p-5"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <Brain size={14} style={{ color: '#38c8ff' }} /> System Prompt — Ensine a IA
                </h3>
                <span className="text-[10px] text-muted-foreground">{persona.length} caracteres</span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Escreva aqui como a IA deve se comportar, o que ela deve e não deve dizer, o tom de voz, etc.
              </p>
              <textarea
                value={persona}
                onChange={e => setPersona(e.target.value)}
                rows={10}
                className={cn(inputClass, 'resize-none leading-relaxed')}
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
              />
            </div>
          </div>
        )}

        {/* MODELO */}
        {activeSection === 'modelo' && (
          <div className="max-w-3xl space-y-6 animate-slide-in">
            <div>
              <h2 className="font-display font-bold text-xl text-white">Modelo de Inteligência</h2>
              <p className="text-sm text-muted-foreground mt-1">Escolha o motor Gemini e calibre o comportamento</p>
            </div>

            <div className="space-y-3">
              {MODELS.map(m => (
                <div key={m.id} onClick={() => setModel(m.id)}
                  className="rounded-2xl border p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    border: `1px solid ${model === m.id ? m.c + '50' : 'rgba(255,255,255,0.07)'}`,
                    background: model === m.id ? `${m.c}10` : 'rgba(255,255,255,0.02)',
                  }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-display font-bold text-white text-base">{m.name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{m.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: `${m.c}20`, color: m.c, border: `1px solid ${m.c}40` }}>
                        {m.badge}
                      </span>
                      {model === m.id && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: m.c }}>
                          <Check size={11} style={{ color: '#0a0a12' }} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${m.level * 20}%`, background: m.c }} />
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: m.c }}>
                      {'█'.repeat(m.level)}{'░'.repeat(5 - m.level)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border/50 p-5"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-sm text-white">Criatividade das Respostas</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Temperatura — quanto mais alto, mais criativo e menos previsível</p>
                </div>
                <span className="font-mono font-bold text-2xl" style={{ color: '#b8ff57' }}>{temp}%</span>
              </div>
              <input type="range" min={0} max={100} value={temp}
                onChange={e => setTemp(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#b8ff57', background: `linear-gradient(to right, #b8ff57 ${temp}%, rgba(255,255,255,0.1) ${temp}%)` }}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                <span>🎯 Preciso e direto</span>
                <span>⚖️ Balanceado</span>
                <span>🎨 Criativo e variado</span>
              </div>
            </div>
          </div>
        )}

        {/* RESPOSTAS RÁPIDAS */}
        {activeSection === 'respostas' && (
          <div className="max-w-3xl space-y-6 animate-slide-in">
            <div>
              <h2 className="font-display font-bold text-xl text-white">Respostas Rápidas</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Cadastre respostas que a IA usará quando detectar palavras-chave específicas
              </p>
            </div>

            {/* Add new */}
            <div className="rounded-2xl border border-border/50 p-5"
              style={{ background: 'rgba(184,255,87,0.03)', border: '1px solid rgba(184,255,87,0.15)' }}>
              <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2" style={{ color: '#b8ff57' }}>
                <Plus size={14} /> Nova Resposta Rápida
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Palavra-chave ou frase do cliente
                  </label>
                  <input value={newTrigger} onChange={e => setNewTrigger(e.target.value)}
                    className={inputClass} placeholder='Ex: "prazo de entrega", "frete grátis", "como pagar"' />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Resposta da IA
                  </label>
                  <textarea value={newReply} onChange={e => setNewReply(e.target.value)}
                    rows={3} className={cn(inputClass, 'resize-none')}
                    placeholder="Digite a resposta que a IA dará quando detectar a palavra-chave..." />
                </div>
                <button onClick={addQuickReply}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: '#b8ff57', color: '#0a0a12' }}>
                  <Plus size={14} /> Adicionar Resposta
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              {quickReplies.map((r, i) => (
                <div key={r.id} className="rounded-2xl border border-border/50 p-4 group"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full font-mono"
                          style={{ background: 'rgba(124,92,252,0.15)', color: '#a480ff', border: '1px solid rgba(124,92,252,0.3)' }}>
                          🔍 "{r.trigger}"
                        </span>
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed">{r.text}</p>
                    </div>
                    <button onClick={() => removeQuickReply(r.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-500/10">
                      <Trash2 size={13} className="text-rose-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REGRAS */}
        {activeSection === 'regras' && (
          <div className="max-w-3xl space-y-6 animate-slide-in">
            <div>
              <h2 className="font-display font-bold text-xl text-white">Regras de Comportamento</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ative ou desative comportamentos específicos da IA
              </p>
            </div>

            <div className="space-y-3">
              {behaviors.map(b => (
                <div key={b.id} className="rounded-2xl border border-border/50 p-4 flex items-start gap-4"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-white mb-0.5">{b.label}</div>
                    <div className="text-xs text-muted-foreground">{b.desc}</div>
                  </div>
                  <Toggle enabled={b.enabled} onChange={() => toggleBehavior(b.id)} />
                </div>
              ))}
            </div>

            {/* Response time config */}
            <div className="rounded-2xl border border-border/50 p-5"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="font-display font-bold text-sm text-white mb-4 flex items-center gap-2">
                <Clock size={14} style={{ color: '#38c8ff' }} /> Configurações de Tempo
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Delay mínimo de resposta (ms)', value: '800', desc: 'Simula digitação humana' },
                  { label: 'Timeout de sessão (minutos)', value: '60', desc: 'Limpa histórico após inatividade' },
                  { label: 'Lembrete pagamento pendente (horas)', value: '2', desc: 'Reenvio automático do link' },
                  { label: 'Avaliação após entrega (horas)', value: '24', desc: 'Solicita nota do atendimento' },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{f.label}</label>
                    <input defaultValue={f.value} className="w-full px-3 py-2 rounded-xl border border-border/50 bg-white/3 text-white text-sm font-mono focus:outline-none focus:border-lime-400/50 transition-colors" />
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
