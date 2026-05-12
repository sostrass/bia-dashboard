import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit3, Trash2, Save, X, ChevronUp, ChevronDown,
         ToggleLeft, ToggleRight, Sparkles, RefreshCw, AlertCircle,
         Brain, MessageSquare, ShoppingBag, Wrench, DollarSign,
         RotateCcw, User, Tag } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const EMOJIS_PADRAO = ['😊','🛍️','🔧','💰','🔄','🤖','📦','🎯','💬','⭐']
const CORES_PADRAO  = ['#00d4aa','#4a9fff','#f59e0b','#a78bfa','#f87171','#34d399','#fb923c','#e879f9']

const iconePorEmoji = (e) => ({
  '🛍️': ShoppingBag, '🔧': Wrench, '💰': DollarSign,
  '🔄': RotateCcw,   '😊': User,   '🤖': Brain
}[e] || MessageSquare)

function BadgeEmoji({ emoji, cor }) {
  const Ico = iconePorEmoji(emoji)
  return (
    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
      style={{ background: `${cor}20`, border: `1.5px solid ${cor}40` }}>
      <Ico size={18} style={{ color: cor }} />
    </div>
  )
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')
  const add = () => {
    const t = input.trim().toLowerCase()
    if (t && !tags.includes(t)) { onChange([...tags, t]); setInput('') }
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ background:'var(--fill)', color:'var(--label-2)', border:'1px solid var(--sep)' }}>
            {t}
            <button onClick={() => onChange(tags.filter(x=>x!==t))} style={{ color:'var(--label-4)' }}>
              <X size={10}/>
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'||e.key===','){e.preventDefault();add()} }}
          placeholder="Digite e pressione Enter..."
          className="flex-1 px-3 py-1.5 rounded-[8px] text-[12px] outline-none"
          style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
        <button onClick={add} className="px-3 py-1.5 rounded-[8px] text-[12px]"
          style={{ background:'var(--fill)', color:'var(--label-2)' }}>
          <Plus size={12}/>
        </button>
      </div>
    </div>
  )
}

function ModalAgente({ agente, onSave, onClose, api }) {
  const isNovo = !agente?.id
  const [form, setForm] = useState({
    nome:          agente?.nome         || '',
    emoji:         agente?.emoji        || '🤖',
    cor:           agente?.cor          || '#4a9fff',
    descricao:     agente?.descricao    || '',
    persona:       agente?.persona      || '',
    palavrasChave: agente?.palavrasChave|| [],
    ativo:         agente?.ativo !== false,
  })
  const [gerando, setGerando] = useState(false)
  const [erro,    setErro]    = useState('')
  const [salvando,setSalvando]= useState(false)

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const gerarComIA = async () => {
    if (!form.nome && !form.descricao) { setErro('Informe o nome ou descrição do agente'); return }
    setGerando(true); setErro('')
    try {
      const r = await fetch(`${api}/api/agentes/gerar-persona`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ nome: form.nome, descricao: form.descricao, palavrasChave: form.palavrasChave })
      })
      const d = await r.json()
      if (d.persona) set('persona', d.persona)
      if (d.palavrasChave?.length) set('palavrasChave', [...new Set([...form.palavrasChave, ...d.palavrasChave])])
    } catch { setErro('Erro ao gerar persona') }
    setGerando(false)
  }

  const salvar = async () => {
    if (!form.nome.trim())    { setErro('Nome obrigatório'); return }
    if (!form.persona.trim()) { setErro('Persona obrigatória'); return }
    setSalvando(true); setErro('')
    try {
      const url    = isNovo ? `${api}/api/agentes` : `${api}/api/agentes/${agente.id}`
      const method = isNovo ? 'POST' : 'PATCH'
      const r = await fetch(url, {
        method, headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form)
      })
      if (!r.ok) throw new Error('Erro ao salvar')
      onSave()
    } catch (e) { setErro(e.message) }
    setSalvando(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div className="rounded-[20px] w-full max-w-[640px] max-h-[90vh] overflow-y-auto"
        style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sticky top-0"
          style={{ background:'var(--bg-2)', borderBottom:'1px solid var(--sep)' }}>
          <h3 className="text-[16px] font-semibold" style={{ color:'var(--label)' }}>
            {isNovo ? 'Novo Agente' : 'Editar Agente'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-[8px]" style={{ color:'var(--label-3)' }}>
            <X size={16}/>
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Nome + Emoji + Cor */}
          <div className="space-y-3">
            <label className="text-[12px] font-semibold" style={{ color:'var(--label-2)' }}>Identidade</label>
            <div className="flex gap-3">
              {/* Emoji picker */}
              <div className="space-y-1">
                <div className="text-[10px]" style={{ color:'var(--label-3)' }}>Ícone</div>
                <div className="flex flex-wrap gap-1.5 w-[120px]">
                  {EMOJIS_PADRAO.map(em => (
                    <button key={em} onClick={()=>set('emoji',em)}
                      className="w-8 h-8 rounded-[8px] text-[16px] flex items-center justify-center transition-all"
                      style={{ background: form.emoji===em ? 'var(--accent-dim)' : 'var(--fill)', border: form.emoji===em ? '1.5px solid var(--accent-border)' : '1.5px solid transparent' }}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <div className="text-[10px] mb-1" style={{ color:'var(--label-3)' }}>Nome do Agente</div>
                  <input value={form.nome} onChange={e=>set('nome',e.target.value)}
                    placeholder="Ex: Agente de Vendas"
                    className="w-full px-3 py-2 rounded-[9px] text-[13px] outline-none"
                    style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
                </div>
                {/* Cor */}
                <div>
                  <div className="text-[10px] mb-1" style={{ color:'var(--label-3)' }}>Cor</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {CORES_PADRAO.map(c => (
                      <button key={c} onClick={()=>set('cor',c)}
                        className="w-6 h-6 rounded-full transition-all"
                        style={{ background:c, outline: form.cor===c ? `2px solid ${c}` : 'none', outlineOffset:'2px' }}/>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold" style={{ color:'var(--label-2)' }}>Descrição / Especialidade</label>
            <input value={form.descricao} onChange={e=>set('descricao',e.target.value)}
              placeholder="Ex: Responsável por pedidos, preços e consulta de estoque"
              className="w-full px-3 py-2 rounded-[9px] text-[13px] outline-none"
              style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
          </div>

          {/* Palavras-chave */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold" style={{ color:'var(--label-2)' }}>
              Palavras-chave de ativação
            </label>
            <p className="text-[11px]" style={{ color:'var(--label-3)' }}>
              O roteador usa estas palavras para decidir quando chamar este agente
            </p>
            <TagInput tags={form.palavrasChave} onChange={v=>set('palavrasChave',v)}/>
          </div>

          {/* Persona */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold" style={{ color:'var(--label-2)' }}>
                Persona / Instruções da IA
              </label>
              <button onClick={gerarComIA} disabled={gerando}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold transition-all"
                style={{ background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
                {gerando ? <RefreshCw size={11} className="animate-spin"/> : <Sparkles size={11}/>}
                {gerando ? 'Gerando...' : 'Gerar com IA'}
              </button>
            </div>
            <textarea value={form.persona} onChange={e=>set('persona',e.target.value)}
              rows={8} placeholder="Descreva como este agente deve se comportar, quais informações tem acesso, como deve responder..."
              className="w-full px-3 py-2.5 rounded-[9px] text-[12px] outline-none resize-none font-mono"
              style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)', lineHeight:'1.6' }}/>
            <p className="text-[10px]" style={{ color:'var(--label-4)' }}>
              {form.persona.length} caracteres · Use o botão "Gerar com IA" para criar ou melhorar o texto automaticamente
            </p>
          </div>

          {/* Erro */}
          {erro && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[9px] text-[12px]"
              style={{ background:'rgba(239,68,68,0.1)', color:'var(--red)', border:'1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={13}/> {erro}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-[10px] text-[13px] font-medium"
              style={{ background:'var(--fill)', color:'var(--label-2)' }}>
              Cancelar
            </button>
            <button onClick={salvar} disabled={salvando}
              className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold flex items-center justify-center gap-2"
              style={{ background:'var(--accent)', color:'#000' }}>
              {salvando ? <RefreshCw size={13} className="animate-spin"/> : <Save size={13}/>}
              {salvando ? 'Salvando...' : 'Salvar Agente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PageAgentesMulti({ api: apiProp }) {
  const api = apiProp || BASE
  const [agentes,  setAgentes]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null) // null | 'novo' | agente
  const [confirmar,setConfirmar]= useState(null) // agente a deletar

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/agentes`)
      if (r.ok) { const d = await r.json(); setAgentes(d.agentes || []) }
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  const toggleAtivo = async (ag) => {
    setAgentes(prev => prev.map(a => a.id===ag.id ? {...a, ativo:!a.ativo} : a))
    await fetch(`${api}/api/agentes/${ag.id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ativo: !ag.ativo })
    }).catch(()=>{})
  }

  const mover = async (idx, dir) => {
    const novos = [...agentes]
    const troca = idx + dir
    if (troca < 0 || troca >= novos.length) return
    ;[novos[idx], novos[troca]] = [novos[troca], novos[idx]]
    setAgentes(novos)
    await fetch(`${api}/api/agentes/reordenar`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ids: novos.map(a=>a.id) })
    }).catch(()=>{})
  }

  const deletar = async (ag) => {
    await fetch(`${api}/api/agentes/${ag.id}`, { method:'DELETE' }).catch(()=>{})
    setConfirmar(null)
    carregar()
  }

  const salvo = () => { setModal(null); carregar() }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background:'var(--bg)' }}>

      {/* Header */}
      <div className="px-6 py-4 flex-shrink-0 flex items-center justify-between"
        style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
        <div>
          <h2 className="text-[22px] font-bold" style={{ color:'var(--label)' }}>Múltiplos Agentes</h2>
          <p className="text-[13px] mt-0.5" style={{ color:'var(--label-3)' }}>
            {agentes.filter(a=>a.ativo).length} ativos · {agentes.length} total · O roteador escolhe o agente pelas palavras-chave
          </p>
        </div>
        <button onClick={() => setModal('novo')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[11px] text-[13px] font-semibold"
          style={{ background:'var(--accent)', color:'#000' }}>
          <Plus size={14}/> Novo Agente
        </button>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">

        {loading && (
          <div className="flex justify-center py-12" style={{ color:'var(--label-3)' }}>
            <RefreshCw size={16} className="animate-spin"/>
          </div>
        )}

        {!loading && agentes.length === 0 && (
          <div className="flex flex-col items-center py-16">
            <Brain size={32} className="mb-3 opacity-20" style={{ color:'var(--label)' }}/>
            <p className="text-[15px] font-medium" style={{ color:'var(--label-2)' }}>Nenhum agente configurado</p>
            <p className="text-[13px] mt-1 mb-4" style={{ color:'var(--label-3)' }}>Crie o primeiro agente para começar</p>
            <button onClick={()=>setModal('novo')}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold"
              style={{ background:'var(--accent)', color:'#000' }}>
              <Plus size={13}/> Criar Agente
            </button>
          </div>
        )}

        {agentes.map((ag, idx) => (
          <div key={ag.id}
            className="rounded-[16px] p-4 flex items-start gap-4 transition-all"
            style={{
              background:  ag.ativo ? 'var(--bg-2)' : 'var(--bg-3)',
              border:      `1px solid ${ag.ativo ? 'var(--sep)' : 'var(--sep)'}`,
              opacity:     ag.ativo ? 1 : 0.6,
              borderLeft:  ag.ativo ? `3px solid ${ag.cor || '#00d4aa'}` : '3px solid var(--sep)',
            }}>

            <BadgeEmoji emoji={ag.emoji||'🤖'} cor={ag.ativo ? (ag.cor||'#00d4aa') : 'var(--label-4)'}/>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[14px] font-semibold" style={{ color:'var(--label)' }}>
                  {ag.emoji} {ag.nome}
                </span>
                {!ag.ativo && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background:'var(--fill)', color:'var(--label-3)' }}>Inativo</span>
                )}
              </div>
              <p className="text-[12px] mb-2" style={{ color:'var(--label-3)' }}>{ag.descricao}</p>

              {/* Palavras-chave */}
              {ag.palavrasChave?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ag.palavrasChave.slice(0,6).map(p => (
                    <span key={p} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                      style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>
                      <Tag size={8}/> {p}
                    </span>
                  ))}
                  {ag.palavrasChave.length > 6 && (
                    <span className="text-[10px]" style={{ color:'var(--label-4)' }}>+{ag.palavrasChave.length-6}</span>
                  )}
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Reordenar */}
              <div className="flex flex-col gap-0.5">
                <button onClick={()=>mover(idx,-1)} disabled={idx===0}
                  className="p-1 rounded-[6px] disabled:opacity-30"
                  style={{ color:'var(--label-3)' }}>
                  <ChevronUp size={13}/>
                </button>
                <button onClick={()=>mover(idx,1)} disabled={idx===agentes.length-1}
                  className="p-1 rounded-[6px] disabled:opacity-30"
                  style={{ color:'var(--label-3)' }}>
                  <ChevronDown size={13}/>
                </button>
              </div>

              {/* Toggle ativo */}
              <button onClick={()=>toggleAtivo(ag)} title={ag.ativo ? 'Desativar' : 'Ativar'}
                className="p-2 rounded-[8px] transition-all"
                style={{ color: ag.ativo ? 'var(--accent)' : 'var(--label-3)' }}>
                {ag.ativo ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
              </button>

              {/* Editar */}
              <button onClick={()=>setModal(ag)}
                className="p-2 rounded-[8px] transition-all"
                style={{ color:'var(--label-3)' }}>
                <Edit3 size={15}/>
              </button>

              {/* Deletar */}
              <button onClick={()=>setConfirmar(ag)}
                className="p-2 rounded-[8px] transition-all"
                style={{ color:'var(--label-3)' }}>
                <Trash2 size={15}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal criar/editar */}
      {modal && (
        <ModalAgente
          agente={modal === 'novo' ? null : modal}
          api={api}
          onSave={salvo}
          onClose={()=>setModal(null)}/>
      )}

      {/* Confirmar deletar */}
      {confirmar && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div className="rounded-[16px] p-6 w-full max-w-[360px] space-y-4"
            style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background:'rgba(239,68,68,0.1)' }}>
                <Trash2 size={18} style={{ color:'var(--red)' }}/>
              </div>
              <div>
                <p className="text-[14px] font-semibold" style={{ color:'var(--label)' }}>Deletar agente?</p>
                <p className="text-[12px]" style={{ color:'var(--label-3)' }}>{confirmar.emoji} {confirmar.nome}</p>
              </div>
            </div>
            <p className="text-[12px]" style={{ color:'var(--label-2)' }}>
              Esta ação não pode ser desfeita. O agente será removido permanentemente.
            </p>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmar(null)} className="flex-1 py-2.5 rounded-[10px] text-[13px]"
                style={{ background:'var(--fill)', color:'var(--label-2)' }}>Cancelar</button>
              <button onClick={()=>deletar(confirmar)} className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold"
                style={{ background:'rgba(239,68,68,0.15)', color:'var(--red)' }}>Deletar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
