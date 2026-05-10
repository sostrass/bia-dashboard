import { useState, useEffect, useRef } from 'react'
import { Tag, Plus, Trash2, RefreshCw, Users, X, GripVertical, Check } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const TAG_CORES = [
  { bg: 'rgba(10,132,255,0.12)',  color: '#0A84FF', border: 'rgba(10,132,255,0.3)'  },
  { bg: 'rgba(50,215,75,0.12)',   color: '#32D74B', border: 'rgba(50,215,75,0.3)'   },
  { bg: 'rgba(191,90,242,0.12)',  color: '#BF5AF2', border: 'rgba(191,90,242,0.3)'  },
  { bg: 'rgba(255,159,10,0.12)',  color: '#FF9F0A', border: 'rgba(255,159,10,0.3)'  },
  { bg: 'rgba(255,69,58,0.12)',   color: '#FF453A', border: 'rgba(255,69,58,0.3)'   },
  { bg: 'rgba(100,210,255,0.12)', color: '#64D2FF', border: 'rgba(100,210,255,0.3)' },
  { bg: 'rgba(255,214,10,0.12)',  color: '#FFD60A', border: 'rgba(255,214,10,0.3)'  },
  { bg: 'rgba(172,142,104,0.12)', color: '#AC8E68', border: 'rgba(172,142,104,0.3)' },
]

function tagCor(tag) {
  let h = 0
  for (let c of tag) h = (h * 31 + c.charCodeAt(0)) % TAG_CORES.length
  return TAG_CORES[Math.abs(h)]
}

export default function PageTags({ api: apiProp }) {
  const api = apiProp || BASE

  const [tags,        setTags]        = useState([])
  const [tagSel,      setTagSel]      = useState(null)
  const [contatos,    setContatos]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [loadingC,    setLoadingC]    = useState(false)
  const [novaTag,     setNovaTag]     = useState('')
  const [novaDesc,    setNovaDesc]    = useState('')
  const [criando,     setCriando]     = useState(false)
  const [showForm,    setShowForm]    = useState(false)
  const [dragOver,    setDragOver]    = useState(null)
  const [dragging,    setDragging]    = useState(null)
  const [confirmDel,  setConfirmDel]  = useState(null)

  const carregar = async () => {
    try {
      const r = await fetch(`${api}/api/fase5/tags`)
      if (r.ok) {
        const d = await r.json()
        setTags(d.tags || [])
        if (!tagSel && d.tags?.length) setTagSel(d.tags[0].tag)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { carregar() }, [api])

  useEffect(() => {
    if (!tagSel) return
    setLoadingC(true)
    fetch(`${api}/api/fase5/tags/${encodeURIComponent(tagSel)}/contatos`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setContatos(d?.contatos || []); setLoadingC(false) })
      .catch(() => setLoadingC(false))
  }, [tagSel, api])

  const criarTag = async () => {
    if (!novaTag.trim()) return
    setCriando(true)
    try {
      await fetch(`${api}/api/fase5/tags/criar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: novaTag.trim().toLowerCase().replace(/\s+/g, ':'), descricao: novaDesc.trim() })
      })
      setNovaTag(''); setNovaDesc(''); setShowForm(false)
      await carregar()
    } catch {}
    setCriando(false)
  }

  const excluirTag = async (tag) => {
    try {
      await fetch(`${api}/api/fase5/tags/${encodeURIComponent(tag)}`, { method: 'DELETE' })
      setConfirmDel(null)
      if (tagSel === tag) setTagSel(null)
      await carregar()
    } catch {}
  }

  const moverContato = async (telefone, tagDestino) => {
    if (!dragging || tagDestino === tagSel) return
    try {
      // Remove da tag atual
      await fetch(`${api}/api/fase5/tags/${encodeURIComponent(telefone)}/${encodeURIComponent(tagSel)}`, {
        method: 'DELETE'
      })
      // Adiciona na tag destino
      await fetch(`${api}/api/fase5/tags/aplicar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone, tags: [tagDestino] })
      })
      setContatos(prev => prev.filter(c => c.telefone !== telefone))
    } catch {}
    setDragging(null); setDragOver(null)
  }

  const removerContatoDaTag = async (telefone) => {
    try {
      await fetch(`${api}/api/fase5/tags/${encodeURIComponent(telefone)}/${encodeURIComponent(tagSel)}`, {
        method: 'DELETE'
      })
      setContatos(prev => prev.filter(c => c.telefone !== telefone))
    } catch {}
  }

  const tagAtual = tags.find(t => t.tag === tagSel)

  return (
    <div className="h-full flex overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Lista de tags */}
      <div className="w-[260px] flex-shrink-0 flex flex-col"
        style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--sep)' }}>

        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--sep)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[17px] font-semibold" style={{ color: 'var(--label)' }}>Tags</h2>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--label-3)' }}>
                {tags.length} segmentos
              </p>
            </div>
            <button onClick={() => setShowForm(v => !v)}
              className="p-2 rounded-[8px] transition-all"
              style={{ background: showForm ? 'var(--accent-dim)' : 'var(--fill)', color: showForm ? 'var(--accent)' : 'var(--label-3)' }}>
              <Plus size={14} />
            </button>
          </div>

          {/* Form nova tag */}
          {showForm && (
            <div className="space-y-2">
              <input value={novaTag} onChange={e => setNovaTag(e.target.value)}
                placeholder="nome:subtipo (ex: vip, interesse:perolas)"
                onKeyDown={e => e.key === 'Enter' && criarTag()}
                className="w-full px-3 py-2 rounded-[9px] text-[12px] outline-none"
                style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)', color: 'var(--label)' }} />
              <input value={novaDesc} onChange={e => setNovaDesc(e.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full px-3 py-2 rounded-[9px] text-[12px] outline-none"
                style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)', color: 'var(--label)' }} />
              <button onClick={criarTag} disabled={!novaTag.trim() || criando}
                className="w-full py-2 rounded-[9px] text-[12px] font-semibold"
                style={{ background: 'var(--accent)', color: '#000', opacity: !novaTag.trim() ? 0.5 : 1 }}>
                {criando ? 'Criando...' : 'Criar tag'}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loading && (
            <div className="flex justify-center py-6" style={{ color: 'var(--label-3)' }}>
              <RefreshCw size={14} className="animate-spin" />
            </div>
          )}
          {tags.map(t => {
            const cor = tagCor(t.tag)
            const ativa = tagSel === t.tag
            return (
              <div key={t.tag}
                onDragOver={e => { e.preventDefault(); setDragOver(t.tag) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => moverContato(dragging, t.tag)}
                className="group relative"
                style={{ background: dragOver === t.tag ? cor.bg : 'transparent' }}>
                <button onClick={() => setTagSel(t.tag)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border-l-2 transition-all"
                  style={{
                    borderLeftColor: ativa ? cor.color : 'transparent',
                    background: ativa ? cor.bg : 'transparent',
                  }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cor.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: 'var(--label)' }}>{t.tag}</div>
                    <div className="text-[11px]" style={{ color: 'var(--label-3)' }}>{t.total || 0} contatos</div>
                  </div>
                  {confirmDel === t.tag ? (
                    <div className="flex gap-1">
                      <button onClick={e => { e.stopPropagation(); excluirTag(t.tag) }}
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ background: 'var(--red)', color: '#fff' }}>Sim</button>
                      <button onClick={e => { e.stopPropagation(); setConfirmDel(null) }}
                        className="px-2 py-0.5 rounded text-[10px]"
                        style={{ background: 'var(--fill)', color: 'var(--label-2)' }}>Não</button>
                    </div>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); setConfirmDel(t.tag) }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                      style={{ color: 'var(--label-3)' }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Contatos da tag selecionada */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!tagSel ? (
          <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--label-3)' }}>
            <div className="text-center">
              <Tag size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-[13px]">Selecione uma tag</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--sep)', background: 'var(--bg-2)' }}>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: tagCor(tagSel).color }} />
                <div>
                  <h3 className="text-[16px] font-semibold" style={{ color: 'var(--label)' }}>{tagSel}</h3>
                  <p className="text-[11px]" style={{ color: 'var(--label-3)' }}>
                    {contatos.length} contatos · Arraste para mover entre tags
                  </p>
                </div>
              </div>
              <div className="text-[11px] px-3 py-1.5 rounded-full"
                style={{ background: 'var(--fill)', color: 'var(--label-3)', border: '1px solid var(--sep)' }}>
                <GripVertical size={12} className="inline mr-1" />
                Arraste para outra tag
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingC ? (
                <div className="flex justify-center py-8" style={{ color: 'var(--label-3)' }}>
                  <RefreshCw size={14} className="animate-spin" />
                </div>
              ) : contatos.length === 0 ? (
                <div className="flex flex-col items-center py-16" style={{ color: 'var(--label-3)' }}>
                  <Users size={28} className="mb-2 opacity-30" />
                  <p className="text-[13px]">Nenhum contato nesta tag</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {contatos.map(c => {
                    const cor = tagCor(tagSel)
                    return (
                      <div key={c.telefone}
                        draggable
                        onDragStart={() => setDragging(c.telefone)}
                        onDragEnd={() => { setDragging(null); setDragOver(null) }}
                        className="group flex items-center gap-3 p-3 rounded-[12px] cursor-grab active:cursor-grabbing transition-all"
                        style={{
                          background: dragging === c.telefone ? cor.bg : 'var(--bg-2)',
                          border: `1px solid ${dragging === c.telefone ? cor.border : 'var(--sep)'}`,
                        }}>
                        <GripVertical size={12} style={{ color: 'var(--label-3)', flexShrink: 0 }} />
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{ background: cor.bg, color: cor.color }}>
                          {(c.nome || c.telefone).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium truncate" style={{ color: 'var(--label)' }}>
                            {c.nome || 'Sem nome'}
                          </div>
                          <div className="text-[10px] font-mono truncate" style={{ color: 'var(--label-3)' }}>
                            {c.telefone}
                          </div>
                        </div>
                        <button onClick={() => removerContatoDaTag(c.telefone)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity flex-shrink-0"
                          style={{ color: 'var(--label-3)' }}>
                          <X size={11} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
