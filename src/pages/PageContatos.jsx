import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Bot, User, Tag, Phone, Filter, CheckSquare, Square, Send } from 'lucide-react'
import ModalPerfilCliente from '../components/ModalPerfilCliente'

const BASE = import.meta.env.VITE_API_URL || ''

const TAG_CORES = {
  'comprador:novo':       { bg: 'rgba(10,132,255,0.1)',  color: 'var(--blue)'   },
  'comprador:frequente':  { bg: 'rgba(50,215,75,0.1)',   color: 'var(--accent)' },
  'carrinho:abandonado':  { bg: 'rgba(255,159,10,0.1)',  color: 'var(--orange)' },
  'interesse:perolas':    { bg: 'rgba(191,90,242,0.1)',  color: 'var(--purple)' },
  'interesse:bijuterias': { bg: 'rgba(191,90,242,0.1)',  color: 'var(--purple)' },
  'interesse:atacado':    { bg: 'rgba(255,69,58,0.1)',   color: 'var(--red)'    },
  'vip':                  { bg: 'rgba(255,214,10,0.1)',  color: 'var(--yellow)' },
  default:                { bg: 'var(--fill)',            color: 'var(--label-3)' },
}

function tagCor(tag) {
  return TAG_CORES[tag] || TAG_CORES.default
}

export default function PageContatos({ api: apiProp }) {
  const api = apiProp || BASE

  const [contatos,    setContatos]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [busca,       setBusca]       = useState('')
  const [filtroModo,  setFiltroModo]  = useState('todos') // todos | ia | manual
  const [selecionados, setSelecionados] = useState(new Set())
  const [perfilAberto, setPerfilAberto] = useState(null)
  const [atualizando,  setAtualizando]  = useState(new Set())

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/contatos`)
      if (r.ok) {
        const d = await r.json()
        setContatos(d.contatos || d || [])
      }
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  const toggleModo = async (telefone, modoAtual) => {
    const novoModo = modoAtual === 'manual' ? 'auto' : 'manual'
    setAtualizando(prev => new Set([...prev, telefone]))
    try {
      await fetch(`${api}/api/contatos/${telefone}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo: novoModo })
      })
      setContatos(prev => prev.map(c =>
        c.telefone === telefone ? { ...c, modo: novoModo } : c
      ))
    } catch {}
    setAtualizando(prev => { const n = new Set(prev); n.delete(telefone); return n })
  }

  const toggleSel = (telefone) => {
    setSelecionados(prev => {
      const n = new Set(prev)
      n.has(telefone) ? n.delete(telefone) : n.add(telefone)
      return n
    })
  }

  const toggleTodos = () => {
    if (selecionados.size === filtrados.length) setSelecionados(new Set())
    else setSelecionados(new Set(filtrados.map(c => c.telefone)))
  }

  const filtrados = contatos.filter(c => {
    const ok_busca = !busca ||
      (c.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
      c.telefone.includes(busca)
    const ok_modo = filtroModo === 'todos' ||
      (filtroModo === 'ia'     && c.modo !== 'manual') ||
      (filtroModo === 'manual' && c.modo === 'manual')
    return ok_busca && ok_modo
  })

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--sep)', background: 'var(--bg-2)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--label)' }}>Contatos</h2>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-3)' }}>
              {contatos.length} contatos · {contatos.filter(c => c.modo !== 'manual').length} na IA
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selecionados.size > 0 && (
              <button className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold"
                style={{ background: 'var(--blue)', color: '#fff' }}>
                <Send size={13} /> Enviar para {selecionados.size} contato{selecionados.size > 1 ? 's' : ''}
              </button>
            )}
            <button onClick={carregar} className="p-2 rounded-[8px]"
              style={{ background: 'var(--fill)', color: 'var(--label-3)' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Busca e filtros */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--label-3)' }} />
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="w-full pl-8 pr-3 py-2 text-[13px] rounded-[10px] outline-none"
              style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)', color: 'var(--label)' }} />
          </div>

          {/* Filtro modo */}
          <div className="flex p-0.5 rounded-[10px]" style={{ background: 'var(--fill)' }}>
            {[['todos','Todos'],['ia','IA'],['manual','Manual']].map(([v,l]) => (
              <button key={v} onClick={() => setFiltroModo(v)}
                className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all"
                style={{ background: filtroModo === v ? 'var(--bg-2)' : 'transparent', color: filtroModo === v ? 'var(--label)' : 'var(--label-3)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-y-auto">
        {/* Cabeçalho tabela */}
        <div className="flex items-center gap-4 px-6 py-2.5 sticky top-0"
          style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--sep)' }}>
          <button onClick={toggleTodos} style={{ color: 'var(--label-3)', flexShrink: 0 }}>
            {selecionados.size === filtrados.length && filtrados.length > 0
              ? <CheckSquare size={15} style={{ color: 'var(--accent)' }} />
              : <Square size={15} />}
          </button>
          <div className="flex-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--label-3)' }}>Nome / Telefone</div>
          <div className="w-32 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--label-3)' }}>Atendimento</div>
          <div className="w-40 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--label-3)' }}>Tags</div>
          <div className="w-20 text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--label-3)' }}>Msgs</div>
        </div>

        {loading && (
          <div className="flex justify-center py-8" style={{ color: 'var(--label-3)' }}>
            <RefreshCw size={14} className="animate-spin" />
          </div>
        )}

        {!loading && filtrados.length === 0 && (
          <div className="flex flex-col items-center py-16" style={{ color: 'var(--label-3)' }}>
            <Phone size={28} className="mb-2 opacity-30" />
            <p className="text-[13px]">Nenhum contato encontrado</p>
          </div>
        )}

        {filtrados.map(c => {
          const isManual = c.modo === 'manual'
          const sel = selecionados.has(c.telefone)
          const atualizand = atualizando.has(c.telefone)

          return (
            <div key={c.telefone}
              className="flex items-center gap-4 px-6 py-3 border-b transition-all"
              style={{ borderColor: 'var(--sep)', background: sel ? 'var(--accent-dim)' : 'transparent' }}>

              {/* Checkbox */}
              <button onClick={() => toggleSel(c.telefone)} style={{ color: sel ? 'var(--accent)' : 'var(--label-3)', flexShrink: 0 }}>
                {sel ? <CheckSquare size={15} style={{ color: 'var(--accent)' }} /> : <Square size={15} />}
              </button>

              {/* Nome e telefone */}
              <button className="flex-1 flex items-center gap-3 text-left min-w-0"
                onClick={() => setPerfilAberto(c)}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ background: isManual ? 'rgba(10,132,255,0.15)' : 'var(--accent-dim)', color: isManual ? 'var(--blue)' : 'var(--accent)' }}>
                  {(c.nome || c.telefone).slice(0,2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--label)' }}>
                    {c.nome || 'Sem nome'}
                  </div>
                  <div className="text-[11px] font-mono" style={{ color: 'var(--label-3)' }}>{c.telefone}</div>
                </div>
              </button>

              {/* Toggle IA/Manual */}
              <div className="w-32 flex items-center gap-2">
                <button onClick={() => toggleModo(c.telefone, c.modo)} disabled={atualizand}
                  className="relative flex-shrink-0"
                  style={{ width: 36, height: 20, borderRadius: 10, background: isManual ? 'var(--blue)' : 'var(--accent)', transition: 'background .2s', opacity: atualizand ? 0.6 : 1 }}>
                  <span className="absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-all duration-200"
                    style={{ left: isManual ? 'calc(100% - 18px)' : '2px' }} />
                </button>
                <span className="text-[11px] font-medium" style={{ color: isManual ? 'var(--blue)' : 'var(--accent)' }}>
                  {isManual ? 'Manual' : 'IA'}
                </span>
              </div>

              {/* Tags */}
              <div className="w-40 flex flex-wrap gap-1">
                {(c.tags || []).slice(0,2).map((t, i) => {
                  const cor = tagCor(t)
                  return (
                    <span key={i} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: cor.bg, color: cor.color }}>
                      {t.replace('interesse:', '').replace('comprador:', '').replace('carrinho:', '')}
                    </span>
                  )
                })}
                {(c.tags || []).length > 2 && (
                  <span className="text-[9px]" style={{ color: 'var(--label-3)' }}>+{c.tags.length - 2}</span>
                )}
              </div>

              {/* Total msgs */}
              <div className="w-20 text-right">
                <span className="text-[13px] font-semibold" style={{ color: 'var(--label)' }}>
                  {c.total_msgs || 0}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal perfil */}
      {perfilAberto && (
        <ModalPerfilCliente
          telefone={perfilAberto.telefone}
          nome={perfilAberto.nome}
          api={api}
          onClose={() => setPerfilAberto(null)}
        />
      )}
    </div>
  )
}
