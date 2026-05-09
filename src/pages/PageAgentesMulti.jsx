import { useState, useEffect } from 'react'
import { Bot, Check, RefreshCw, BookOpen, Plus, Trash2, Upload } from 'lucide-react'

const TIPOS = [
  { id:'vendas',    icon:'🛍️', label:'Agente de Vendas',    cor:'var(--accent)',  desc:'Especialista em produtos e fechamento de compras' },
  { id:'suporte',   icon:'💬', label:'Agente de Suporte',   cor:'var(--blue)',    desc:'Especialista em dúvidas, materiais e informações' },
  { id:'pedidos',   icon:'📦', label:'Agente de Pedidos',   cor:'var(--orange)',  desc:'Especialista em rastreio e status de pedidos' },
  { id:'devolucao', icon:'↩️', label:'Agente de Devolução', cor:'var(--red)',     desc:'Especialista em trocas, devoluções e RMAs' },
  { id:'geral',     icon:'⭐', label:'Agente Geral',         cor:'var(--purple)', desc:'Atendimento geral — fallback quando nenhum agente específico é detectado' },
]

export default function PageAgentesMulti({ api }) {
  const [sel,      setSel]      = useState('vendas')
  const [agentes,  setAgentes]  = useState({})
  const [docs,     setDocs]     = useState([])
  const [novoDoc,  setNovoDoc]  = useState({ titulo:'', conteudo:'', tipo:'geral' })
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(null)
  const [tab,      setTab]      = useState('agente') // agente | knowledge

  useEffect(() => {
    const load = async () => {
      try {
        const [ra, rd] = await Promise.all([
          fetch(`${api}/api/fase3/agentes`).then(r => r.json()),
          fetch(`${api}/api/fase3/knowledge`).then(r => r.json()),
        ])
        const map = {}
        for (const a of (ra.agentes || [])) map[a.tipo] = a
        setAgentes(map)
        setDocs(rd.documentos || [])
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [api])

  const saveAgente = async (tipo) => {
    setSaving(true)
    const a = agentes[tipo] || {}
    try {
      await fetch(`${api}/api/fase3/agentes/${tipo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: a.nome, persona: a.persona, descricao: a.descricao, ativo: a.ativo !== false }),
      })
      setSaved(tipo)
      setTimeout(() => setSaved(null), 2500)
    } catch {}
    setSaving(false)
  }

  const updateAgente = (tipo, campo, valor) => {
    setAgentes(prev => ({ ...prev, [tipo]: { ...(prev[tipo] || {}), [campo]: valor } }))
  }

  const addDoc = async () => {
    if (!novoDoc.titulo.trim() || !novoDoc.conteudo.trim()) return
    try {
      await fetch(`${api}/api/fase3/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoDoc),
      })
      const r = await fetch(`${api}/api/fase3/knowledge`).then(r => r.json())
      setDocs(r.documentos || [])
      setNovoDoc({ titulo: '', conteudo: '', tipo: 'geral' })
    } catch {}
  }

  const removeDoc = async (id) => {
    await fetch(`${api}/api/fase3/knowledge/${id}`, { method: 'DELETE' })
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  const inp = { background:'var(--bg-3)', border:'1px solid var(--sep)', borderRadius:10, color:'var(--label)', outline:'none', padding:'9px 12px', fontSize:13, fontFamily:'inherit', transition:'border-color .15s', width:'100%' }
  const focus = e => e.target.style.borderColor = 'var(--accent)'
  const blur  = e => e.target.style.borderColor = 'var(--sep)'

  if (loading) return (
    <div className="h-full flex items-center justify-center gap-3" style={{ color: 'var(--label-3)' }}>
      <RefreshCw size={16} className="animate-spin" /> Carregando agentes...
    </div>
  )

  const tipoAtual = TIPOS.find(t => t.id === sel)
  const agenteAtual = agentes[sel] || {}

  return (
    <div className="h-full flex overflow-hidden">

      {/* Sidebar agentes */}
      <aside className="w-[220px] flex-shrink-0 flex flex-col" style={{ background:'var(--bg-2)', borderRight:'1px solid var(--sep)' }}>
        <div className="px-4 py-4" style={{ borderBottom:'1px solid var(--sep)' }}>
          <div className="text-[17px] font-semibold" style={{ color:'var(--label)' }}>Múltiplos Agentes</div>
          <div className="text-[11px] mt-0.5" style={{ color:'var(--label-3)' }}>Cada agente com sua persona</div>
        </div>

        {/* Tabs */}
        <div className="p-3" style={{ borderBottom:'1px solid var(--sep)' }}>
          <div className="flex gap-1 p-0.5 rounded-[10px]" style={{ background:'var(--fill)' }}>
            {[['agente','Agentes'],['knowledge','Base IA']].map(([v,l]) => (
              <button key={v} onClick={() => setTab(v)}
                className="flex-1 py-1.5 rounded-[8px] text-[11px] font-medium transition-all"
                style={{ background:tab===v?'var(--bg-2)':'transparent', color:tab===v?'var(--label)':'var(--label-3)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {tab === 'agente' && (
          <nav className="flex-1 overflow-y-auto py-2">
            {TIPOS.map(t => (
              <button key={t.id} onClick={() => setSel(t.id)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left border-l-2 transition-all"
                style={{ borderLeftColor: sel===t.id ? t.cor : 'transparent', background: sel===t.id ? `color-mix(in srgb, ${t.cor} 8%, var(--bg-2))` : 'transparent' }}>
                <span className="text-base">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold truncate" style={{ color: sel===t.id ? t.cor : 'var(--label)' }}>{t.label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color:'var(--label-3)' }}>
                    {agentes[t.id]?.ativo !== false ? '● Ativo' : '○ Inativo'}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        )}

        {tab === 'knowledge' && (
          <div className="flex-1 overflow-y-auto py-2">
            <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color:'var(--label-3)' }}>
              {docs.length} documentos
            </div>
            {docs.map(d => (
              <div key={d.id} className="px-4 py-2.5 border-b" style={{ borderColor:'var(--sep)' }}>
                <div className="text-[12px] font-medium truncate" style={{ color:'var(--label)' }}>{d.titulo}</div>
                <div className="text-[10px]" style={{ color:'var(--label-3)' }}>{d.tipo}</div>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-6" style={{ background:'var(--bg)' }}>
        <div className="max-w-3xl mx-auto space-y-5">

          {/* ── CONFIGURAR AGENTE ── */}
          {tab === 'agente' && tipoAtual && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tipoAtual.icon}</span>
                  <div>
                    <h2 className="text-[20px] font-bold" style={{ color:'var(--label)' }}>{tipoAtual.label}</h2>
                    <p className="text-[13px] mt-0.5" style={{ color:'var(--label-3)' }}>{tipoAtual.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Toggle ativo/inativo */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[12px]" style={{ color:'var(--label-2)' }}>
                      {agenteAtual.ativo !== false ? 'Ativo' : 'Inativo'}
                    </span>
                    <button onClick={() => updateAgente(sel, 'ativo', agenteAtual.ativo === false ? true : false)}
                      className="relative flex-shrink-0 transition-all"
                      style={{ width:44, height:24, borderRadius:12, background: agenteAtual.ativo !== false ? tipoAtual.cor : 'var(--bg-4)' }}>
                      <span className="absolute top-0.5 h-5 w-5 bg-white rounded-full shadow transition-all"
                        style={{ left: agenteAtual.ativo !== false ? 'calc(100% - 22px)' : '2px' }} />
                    </button>
                  </label>
                  <button onClick={() => saveAgente(sel)} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all"
                    style={{ background: saved===sel ? 'var(--teal)' : tipoAtual.cor, color:'#000' }}>
                    {saving ? <RefreshCw size={13} className="animate-spin" />
                      : saved===sel ? <><Check size={13} />Salvo!</>
                      : 'Salvar Agente'}
                  </button>
                </div>
              </div>

              <div className="card p-5 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold block mb-1.5 uppercase tracking-wider" style={{ color:'var(--label-3)' }}>Nome do Agente</label>
                  <input value={agenteAtual.nome || ''} onChange={e => updateAgente(sel, 'nome', e.target.value)}
                    placeholder={tipoAtual.label} style={inp} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-1.5 uppercase tracking-wider" style={{ color:'var(--label-3)' }}>Persona — Como este agente deve se comportar</label>
                  <textarea value={agenteAtual.persona || ''} onChange={e => updateAgente(sel, 'persona', e.target.value)}
                    rows={8} placeholder={`Descreva o comportamento do ${tipoAtual.label}...\n\nExemplo:\n- Seja empático e proativo\n- Sempre verifique o sistema antes de responder\n- Use tom ${sel === 'devolucao' ? 'empático' : sel === 'vendas' ? 'entusiasmado' : 'profissional'}`}
                    style={{ ...inp, fontFamily:'monospace', fontSize:11, lineHeight:1.75, resize:'none' }}
                    onFocus={focus} onBlur={blur} />
                </div>
              </div>

              {/* Palavras-chave de detecção */}
              <div className="card p-5">
                <h3 className="text-[14px] font-semibold mb-2" style={{ color:'var(--label)' }}>Palavras-chave de Detecção</h3>
                <p className="text-[12px] mb-3" style={{ color:'var(--label-3)' }}>
                  Este agente é ativado quando o cliente usa estas palavras nas mensagens:
                </p>
                <div className="flex flex-wrap gap-2">
                  {({
                    vendas:    ['comprar','preço','estoque','atacado','pix','boleto','finalizar'],
                    suporte:   ['dúvida','como funciona','frete','prazo','informação'],
                    pedidos:   ['meu pedido','rastrear','rastreio','onde está','não recebi'],
                    devolucao: ['devolver','defeito','reembolso','trocar','rma'],
                    geral:     ['qualquer mensagem não detectada pelos outros agentes'],
                  }[sel] || []).map(k => (
                    <span key={k} className="text-[11px] px-2.5 py-1 rounded-full font-mono"
                      style={{ background:`color-mix(in srgb, ${tipoAtual.cor} 12%, var(--bg-3))`, color:tipoAtual.cor, border:`1px solid color-mix(in srgb, ${tipoAtual.cor} 25%, transparent)` }}>
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── BASE DE CONHECIMENTO ── */}
          {tab === 'knowledge' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[20px] font-bold" style={{ color:'var(--label)' }}>Base de Conhecimento</h2>
                  <p className="text-[13px] mt-0.5" style={{ color:'var(--label-3)' }}>
                    Documentos que a IA usa para responder com precisão — sem inventar informações
                  </p>
                </div>
              </div>

              {/* Adicionar documento */}
              <div className="card p-5 space-y-3" style={{ border:'1px solid var(--accent)', background:'var(--accent-dim)' }}>
                <h3 className="text-[14px] font-semibold flex items-center gap-2" style={{ color:'var(--accent)' }}>
                  <Plus size={14} /> Adicionar Documento
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold block mb-1.5 uppercase tracking-wider" style={{ color:'var(--label-3)' }}>Título</label>
                    <input value={novoDoc.titulo} onChange={e => setNovoDoc(p=>({...p,titulo:e.target.value}))}
                      placeholder='Ex: "Política de Devolução"' style={inp} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold block mb-1.5 uppercase tracking-wider" style={{ color:'var(--label-3)' }}>Tipo de Agente</label>
                    <select value={novoDoc.tipo} onChange={e => setNovoDoc(p=>({...p,tipo:e.target.value}))}
                      style={{ ...inp, cursor:'pointer' }}>
                      <option value="geral">Geral (todos os agentes)</option>
                      <option value="vendas">Agente de Vendas</option>
                      <option value="suporte">Agente de Suporte</option>
                      <option value="pedidos">Agente de Pedidos</option>
                      <option value="devolucao">Agente de Devolução</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-1.5 uppercase tracking-wider" style={{ color:'var(--label-3)' }}>Conteúdo</label>
                  <textarea value={novoDoc.conteudo} onChange={e => setNovoDoc(p=>({...p,conteudo:e.target.value}))}
                    rows={5} placeholder="Cole aqui o conteúdo do documento — regras, FAQs, tabelas de preço, informações sobre produtos..."
                    style={{ ...inp, resize:'none', lineHeight:1.6 }} onFocus={focus} onBlur={blur} />
                </div>
                <button onClick={addDoc}
                  className="px-4 py-2 rounded-[10px] text-[13px] font-semibold"
                  style={{ background:'var(--accent)', color:'#000' }}>
                  Adicionar à Base
                </button>
              </div>

              {/* Lista de documentos */}
              <div className="space-y-3">
                {docs.length === 0 && (
                  <div className="text-center py-8" style={{ color:'var(--label-3)' }}>
                    <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-[13px]">Base de conhecimento vazia</p>
                    <p className="text-[11px] mt-1">Adicione documentos acima para a IA usar</p>
                  </div>
                )}
                {docs.map(d => (
                  <div key={d.id} className="card p-4 flex items-start gap-3 group">
                    <BookOpen size={16} className="flex-shrink-0 mt-0.5" style={{ color:'var(--label-3)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold" style={{ color:'var(--label)' }}>{d.titulo}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background:'var(--fill)', color:'var(--label-3)' }}>{d.tipo}</span>
                      </div>
                      <p className="text-[12px] leading-relaxed" style={{ color:'var(--label-2)' }}>
                        {d.preview}{d.preview?.length >= 200 ? '…' : ''}
                      </p>
                    </div>
                    <button onClick={() => removeDoc(d.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-[8px] flex-shrink-0"
                      style={{ color:'var(--red)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
