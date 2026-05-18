import { useState, useEffect, useCallback } from 'react'

const BASE = import.meta.env.VITE_API_URL || ''

const V = {
  bg:     'var(--bg)',
  bg2:    'var(--bg-2)',
  bg3:    'var(--bg-3)',
  label:  'var(--label)',
  label2: 'var(--label-2)',
  label3: 'var(--label-3)',
  label4: 'var(--label-4)',
  sep:    'var(--sep)',
  fill:   'var(--fill)',
  accent: 'var(--accent, #059669)',
}

const MODELOS = [
  { id:'gemini-2.0-flash',      label:'Gemini 2.0 Flash',      desc:'Recomendado — rápido e preciso' },
  { id:'gemini-2.0-flash-lite', label:'Gemini 2.0 Flash Lite',  desc:'Econômico — respostas simples' },
  { id:'gemini-2.5-flash',      label:'Gemini 2.5 Flash',       desc:'Avançado — raciocínio complexo' },
  { id:'gemini-2.5-pro',        label:'Gemini 2.5 Pro',         desc:'Máximo — máxima capacidade' },
]

// ── Preview Chat ──────────────────────────────────────────────────────────────
function PreviewChat({ api, agente }) {
  const [msgs,     setMsgs]     = useState([])
  const [input,    setInput]    = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async () => {
    if (!input.trim() || enviando) return
    const texto = input.trim()
    setInput('')
    setMsgs(prev => [...prev, { role:'user', content:texto }])
    setEnviando(true)
    try {
      const historico = msgs.map(m => ({ role: m.role, content: m.content }))
      const r = await fetch(`${api}/api/agentes/preview`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          mensagem:   texto,
          persona:    agente.persona,
          instrucoes: agente.instrucoes,
          nome:       agente.nome,
          modelo:     agente.modelo,
          historico,
        }),
      })
      const d = await r.json()
      setMsgs(prev => [...prev, { role:'assistant', content: d.resposta || 'Sem resposta' }])
    } catch (e) {
      setMsgs(prev => [...prev, { role:'assistant', content:`Erro: ${e.message}` }])
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:360, border:`1px solid ${V.sep}`, borderRadius:10, overflow:'hidden' }}>
      <div style={{ padding:'10px 14px', borderBottom:`1px solid ${V.sep}`, background:V.bg2, fontSize:12, color:V.label3 }}>
        Preview — {agente.emoji} {agente.nome}
        <button onClick={() => setMsgs([])} style={{ float:'right', background:'none', border:'none', color:V.label4, cursor:'pointer', fontSize:11 }}>Limpar</button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8, background:V.bg }}>
        {msgs.length === 0 && (
          <div style={{ color:V.label4, fontSize:12, textAlign:'center', marginTop:20 }}>
            Digite uma mensagem para testar o agente
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth:'78%', padding:'8px 12px', borderRadius:10, fontSize:12,
              background: m.role==='user' ? `${V.accent}20` : V.bg2,
              color: V.label, border:`1px solid ${m.role==='user' ? V.accent+'30' : V.sep}`,
              whiteSpace:'pre-wrap', lineHeight:1.5,
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {enviando && (
          <div style={{ color:V.label4, fontSize:11, paddingLeft:4 }}>Aguardando resposta...</div>
        )}
      </div>
      <div style={{ padding:'8px 10px', borderTop:`1px solid ${V.sep}`, display:'flex', gap:8, background:V.bg }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==='Enter' && enviar()}
          placeholder="Teste uma mensagem..."
          disabled={enviando}
          style={{
            flex:1, padding:'7px 10px', borderRadius:8, border:`1px solid ${V.sep}`,
            background:V.fill, color:V.label, fontSize:12, outline:'none',
          }}
        />
        <button onClick={enviar} disabled={enviando || !input.trim()} style={{
          padding:'7px 14px', borderRadius:8, border:'none',
          background: (!enviando && input.trim()) ? V.accent : V.fill,
          color: (!enviando && input.trim()) ? '#fff' : V.label4,
          fontSize:12, cursor: (!enviando && input.trim()) ? 'pointer' : 'not-allowed',
        }}>➤</button>
      </div>
    </div>
  )
}

// ── Tag Input ─────────────────────────────────────────────────────────────────
function TagInput({ value = [], onChange, placeholder }) {
  const [inp, setInp] = useState('')
  const add = () => {
    const t = inp.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setInp('')
  }
  return (
    <div style={{ border:`1px solid ${V.sep}`, borderRadius:8, padding:6, display:'flex', flexWrap:'wrap', gap:4, background:V.fill, minHeight:38 }}>
      {value.map((t, i) => (
        <span key={i} style={{
          background:`${V.accent}20`, color:V.accent, borderRadius:20,
          padding:'2px 8px', fontSize:11, display:'flex', alignItems:'center', gap:4,
        }}>
          {t}
          <button onClick={() => onChange(value.filter((_,j) => j!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:V.accent, padding:0, lineHeight:1 }}>×</button>
        </span>
      ))}
      <input
        value={inp} onChange={e => setInp(e.target.value)}
        onKeyDown={e => (e.key==='Enter' || e.key===',') && (e.preventDefault(), add())}
        onBlur={add}
        placeholder={value.length ? '' : placeholder}
        style={{ flex:1, minWidth:80, border:'none', background:'transparent', color:V.label, fontSize:12, outline:'none' }}
      />
    </div>
  )
}

// ── Editor de Agente ──────────────────────────────────────────────────────────
function EditorAgente({ api, agente, onSave, onCancel }) {
  const isNovo = !agente?.id

  const [form, setForm] = useState({
    nome:        agente?.nome        || '',
    emoji:       agente?.emoji       || '🤖',
    cor:         agente?.cor         || '#4a9fff',
    descricao:   agente?.descricao   || '',
    persona:     agente?.persona     || '',
    palavrasChave: agente?.palavras_chave || [],
    ativo:       agente?.ativo       ?? true,
    instrucoes:  agente?.instrucoes  || {},
    modelo:      agente?.modelo      || 'gemini-2.0-flash',
    temperatura: agente?.temperatura || '0.7',
    avatar:      agente?.avatar      || '',
  })

  const [aba,      setAba]      = useState('geral')
  const [salvando, setSalvando] = useState(false)
  const [salvoOk,  setSalvoOk]  = useState(false)
  const [gerando,  setGerando]  = useState(false)
  const [dirty,    setDirty]    = useState(false)

  const set = (campo, val) => { setForm(f => ({ ...f, [campo]: val })); setDirty(true) }
  const setInstr = (campo, val) => set('instrucoes', { ...form.instrucoes, [campo]: val })

  const gerarPersona = async () => {
    setGerando(true)
    try {
      const r = await fetch(`${api}/api/agentes/gerar-persona`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ nome: form.nome, descricao: form.descricao, especialidade: form.instrucoes?.oQueFaz }),
      })
      const d = await r.json()
      if (d.persona) set('persona', d.persona)
    } catch {}
    setGerando(false)
  }

  const salvar = async () => {
    if (!form.nome.trim()) return
    setSalvando(true)
    try {
      const url    = isNovo ? `${api}/api/agentes` : `${api}/api/agentes/${agente.id}`
      const method = isNovo ? 'POST' : 'PATCH'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) { const e = await r.json(); throw new Error(e.erro || `HTTP ${r.status}`) }
      setSalvoOk(true)
      setDirty(false)
      setTimeout(() => { setSalvoOk(false); onSave() }, 1200)
    } catch (e) {
      alert(`Erro ao salvar: ${e.message}`)
    }
    setSalvando(false)
  }

  const inp = (placeholder, value, onChange, multiline) => ({
    placeholder, value: value || '', onChange: e => onChange(e.target.value),
    style: {
      width:'100%', padding:'8px 10px', borderRadius:8, boxSizing:'border-box',
      border:`1px solid ${V.sep}`, background:V.fill, color:V.label,
      fontSize:12, outline:'none', resize: multiline ? 'vertical' : 'none',
      fontFamily:'inherit', lineHeight:1.5,
    }
  })

  const abas = [
    ['geral',     '⚙️', 'Geral'],
    ['persona',   '🧠', 'Persona'],
    ['modelo',    '🤖', 'Modelo'],
    ['preview',   '▶️',  'Preview'],
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* Header */}
      <div style={{ padding:'12px 16px', borderBottom:`1px solid ${V.sep}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <span style={{ fontSize:22, marginRight:8 }}>{form.emoji}</span>
          <span style={{ fontSize:15, fontWeight:600, color:V.label }}>{form.nome || 'Novo agente'}</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onCancel} style={{
            padding:'6px 14px', borderRadius:8, border:`1px solid ${V.sep}`,
            background:'transparent', color:V.label3, fontSize:12, cursor:'pointer',
          }}>Cancelar</button>
          <button onClick={salvar} disabled={salvando} style={{
            padding:'6px 16px', borderRadius:8, border:'none',
            background: salvoOk ? '#059669' : V.accent,
            color:'#fff', fontSize:12, cursor:'pointer', minWidth:80,
          }}>
            {salvoOk ? '✓ Salvo!' : salvando ? '...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display:'flex', borderBottom:`1px solid ${V.sep}`, flexShrink:0 }}>
        {abas.map(([key, icon, label]) => (
          <button key={key} onClick={() => setAba(key)} style={{
            flex:1, padding:'9px 4px', border:'none', cursor:'pointer',
            background: aba===key ? `${V.accent}12` : 'transparent',
            borderBottom: aba===key ? `2px solid ${V.accent}` : '2px solid transparent',
            color: aba===key ? V.accent : V.label3,
            fontSize:11, display:'flex', flexDirection:'column', alignItems:'center', gap:2,
          }}>
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo das abas */}
      <div style={{ flex:1, overflowY:'auto', padding:16 }}>

        {aba === 'geral' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 72px 52px', gap:10 }}>
              <div>
                <label style={{ fontSize:11, color:V.label3, display:'block', marginBottom:4 }}>Nome *</label>
                <input {...inp('Ex: Molise — Vendas', form.nome, v => set('nome', v))} />
              </div>
              <div>
                <label style={{ fontSize:11, color:V.label3, display:'block', marginBottom:4 }}>Emoji</label>
                <input {...inp('🤖', form.emoji, v => set('emoji', v))} style={{ ...inp('','','').style, textAlign:'center', fontSize:20 }} />
              </div>
              <div>
                <label style={{ fontSize:11, color:V.label3, display:'block', marginBottom:4 }}>Cor</label>
                <input type="color" value={form.cor} onChange={e => set('cor', e.target.value)} style={{ width:'100%', height:37, borderRadius:8, border:`1px solid ${V.sep}`, cursor:'pointer', padding:2 }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize:11, color:V.label3, display:'block', marginBottom:4 }}>Descrição</label>
              <input {...inp('Ex: Atendimento de vendas e catálogo', form.descricao, v => set('descricao', v))} />
            </div>

            <div>
              <label style={{ fontSize:11, color:V.label3, display:'block', marginBottom:4 }}>Palavras-chave (acione com vírgula ou Enter)</label>
              <TagInput value={form.palavrasChave} onChange={v => set('palavrasChave', v)} placeholder="Ex: comprar, pedido, produto..." />
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <input type="checkbox" id="ativo" checked={form.ativo} onChange={e => set('ativo', e.target.checked)} />
              <label htmlFor="ativo" style={{ fontSize:12, color:V.label, cursor:'pointer' }}>Agente ativo</label>
            </div>
          </div>
        )}

        {aba === 'persona' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <label style={{ fontSize:11, color:V.label3 }}>Quem é você</label>
              </div>
              <input {...inp('Ex: Você é Molise, assistente da Só Strass...', form.instrucoes?.quemEh, v => setInstr('quemEh', v))} />
            </div>

            <div>
              <label style={{ fontSize:11, color:V.label3, display:'block', marginBottom:4 }}>O que você faz</label>
              <input {...inp('Ex: Ajudo clientes a encontrar produtos e fechar pedidos', form.instrucoes?.oQueFaz, v => setInstr('oQueFaz', v))} />
            </div>

            <div>
              <label style={{ fontSize:11, color:V.label3, display:'block', marginBottom:4 }}>Objetivo principal</label>
              <input {...inp('Ex: Converter consultas em pedidos', form.instrucoes?.objetivo, v => setInstr('objetivo', v))} />
            </div>

            <div>
              <label style={{ fontSize:11, color:V.label3, display:'block', marginBottom:4 }}>Regras e restrições</label>
              <input {...inp('Ex: Nunca inventar preços, sempre confirmar estoque', form.instrucoes?.regras, v => setInstr('regras', v))} />
            </div>

            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <label style={{ fontSize:11, color:V.label3 }}>Persona completa</label>
                <button onClick={gerarPersona} disabled={gerando || !form.nome.trim()} style={{
                  padding:'4px 10px', borderRadius:6, border:`1px solid ${V.accent}40`,
                  background:'transparent', color:V.accent, fontSize:11, cursor:'pointer',
                }}>
                  {gerando ? '...' : '✨ Gerar com IA'}
                </button>
              </div>
              <textarea {...inp('Descreva a personalidade, tom e comportamento detalhado...', form.persona, v => set('persona', v), true)} rows={8} />
            </div>
          </div>
        )}

        {aba === 'modelo' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:11, color:V.label3, display:'block', marginBottom:8 }}>Modelo de IA</label>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {MODELOS.map(m => (
                  <div key={m.id} onClick={() => set('modelo', m.id)} style={{
                    padding:'10px 14px', borderRadius:10, cursor:'pointer',
                    border:`1.5px solid ${form.modelo===m.id ? V.accent : V.sep}`,
                    background: form.modelo===m.id ? `${V.accent}10` : V.bg2,
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:12, fontWeight:600, color:V.label }}>{m.label}</span>
                      {form.modelo===m.id && <span style={{ color:V.accent, fontSize:14 }}>✓</span>}
                    </div>
                    <div style={{ fontSize:11, color:V.label4, marginTop:2 }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <label style={{ fontSize:11, color:V.label3 }}>Temperatura</label>
                <span style={{ fontSize:11, color:V.label, fontWeight:600 }}>{form.temperatura}</span>
              </div>
              <input
                type="range" min="0" max="2" step="0.1"
                value={parseFloat(form.temperatura) || 0.7}
                onChange={e => set('temperatura', e.target.value)}
                style={{ width:'100%', cursor:'pointer' }}
              />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:V.label4, marginTop:2 }}>
                <span>Preciso (0)</span>
                <span>Balanceado (0.7)</span>
                <span>Criativo (2)</span>
              </div>
            </div>
          </div>
        )}

        {aba === 'preview' && (
          <PreviewChat api={api} agente={form} />
        )}

      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PageAgentesMulti({ api: apiProp }) {
  const api = apiProp || BASE

  const [agentes,  setAgentes]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selId,    setSelId]    = useState(null)
  const [criando,  setCriando]  = useState(false)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/agentes`)
      if (r.ok) { const d = await r.json(); setAgentes(d.agentes || []) }
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  const deletar = async (id, nome) => {
    if (!confirm(`Remover "${nome}"?`)) return
    await fetch(`${api}/api/agentes/${id}`, { method:'DELETE' })
    if (selId === id) setSelId(null)
    carregar()
  }

  const agenteSel = agentes.find(a => a.id === selId)

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden', background:V.bg }}>

      {/* Lista de agentes */}
      <div style={{ width:260, flexShrink:0, borderRight:`1px solid ${V.sep}`, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'12px 14px', borderBottom:`1px solid ${V.sep}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:14, fontWeight:600, color:V.label }}>Agentes</span>
          <button onClick={() => { setCriando(true); setSelId(null) }} style={{
            padding:'5px 10px', borderRadius:8, border:'none',
            background:V.accent, color:'#fff', fontSize:11, cursor:'pointer',
          }}>+ Novo</button>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:20, textAlign:'center', color:V.label4, fontSize:12 }}>Carregando...</div>
          ) : agentes.map(ag => (
            <div key={ag.id} onClick={() => { setSelId(ag.id); setCriando(false) }} style={{
              padding:'10px 14px', cursor:'pointer', borderBottom:`1px solid ${V.sep}`,
              background: selId===ag.id ? `${V.accent}12` : 'transparent',
              borderLeft: selId===ag.id ? `2.5px solid ${V.accent}` : '2.5px solid transparent',
              display:'flex', alignItems:'center', gap:10,
            }}>
              <div style={{
                width:34, height:34, borderRadius:'50%', flexShrink:0,
                background:`${ag.cor||'#4a9fff'}20`, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:16,
              }}>{ag.emoji || '🤖'}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color: ag.ativo ? V.label : V.label4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {ag.nome}
                </div>
                <div style={{ fontSize:10, color:V.label4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {ag.modelo || 'gemini-2.0-flash'}
                  {!ag.ativo && ' · inativo'}
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); deletar(ag.id, ag.nome) }} style={{
                background:'none', border:'none', cursor:'pointer', color:V.label4,
                fontSize:14, padding:'2px 4px', opacity:0.6,
              }}>✕</button>
            </div>
          ))}
        </div>

        {/* Info v6 */}
        <div style={{ padding:12, borderTop:`1px solid ${V.sep}`, fontSize:10, color:V.label4, lineHeight:1.5 }}>
          Na v6, o Function Calling unifica todos os agentes. As configurações de persona e modelo são aplicadas conforme o contexto da conversa.
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex:1, overflow:'hidden' }}>
        {(selId || criando) ? (
          <EditorAgente
            key={selId || 'novo'}
            api={api}
            agente={agenteSel || null}
            onSave={() => { carregar(); if(criando) setCriando(false) }}
            onCancel={() => { setSelId(null); setCriando(false) }}
          />
        ) : (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:V.label4 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🤖</div>
              <div style={{ fontSize:14 }}>Selecione um agente para editar</div>
              <div style={{ fontSize:12, marginTop:4 }}>{agentes.length} agente{agentes.length!==1?'s':''} configurado{agentes.length!==1?'s':''}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
