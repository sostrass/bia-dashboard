import { useState, useEffect, useCallback } from 'react'
import { Bell, Plus, Send, Trash2, RefreshCw, CheckCircle, Clock, Package,
         ExternalLink, Image, DollarSign, Phone, History, X, Search } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const STATUS_CFG = {
  pendente:    { label: 'Aguardando',   color: 'var(--orange)', bg: 'rgba(245,158,11,0.1)'  },
  notificado:  { label: 'Notificado',   color: 'var(--accent)', bg: 'rgba(0,212,170,0.1)'   },
  cancelado:   { label: 'Cancelado',    color: 'var(--red)',    bg: 'rgba(226,75,74,0.1)'   },
}

function ModalAdicionar({ onClose, onSalvar, api }) {
  const [form, setForm] = useState({ telefone:'', nome:'', produto_nome:'', produto_url:'', produto_img:'', produto_preco:'' })
  const [salvando, setSalvando] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [sugestoes, setSugestoes] = useState([])

  const buscarProduto = async (termo) => {
    if (!termo || termo.length < 3) return
    setBuscando(true)
    try {
      const r = await fetch(`${api}/api/fase5/portfolio?q=${encodeURIComponent(termo)}`)
      if (r.ok) {
        const d = await r.json()
        setSugestoes(d.produtos || [])
      }
    } catch {}
    setBuscando(false)
  }

  const selecionarProduto = (p) => {
    setForm(prev => ({
      ...prev,
      produto_nome:  typeof p.nome === 'object' ? (p.nome.pt || Object.values(p.nome)[0]) : p.nome,
      produto_url:   p.url || '',
      produto_img:   p.imagem || '',
      produto_preco: p.preco || '',
    }))
    setSugestoes([])
  }

  const salvar = async () => {
    if (!form.telefone || !form.produto_nome) return
    setSalvando(true)
    try {
      const r = await fetch(`${api}/api/estoque/adicionar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (r.ok) { onSalvar(); onClose() }
    } catch {}
    setSalvando(false)
  }

  const inp = {
    background: 'var(--bg-3)', border: '1px solid var(--sep)',
    borderRadius: 9, color: 'var(--label)', outline: 'none',
    padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', width: '100%',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-[480px] rounded-[18px] overflow-hidden"
        style={{ background: 'var(--bg)', border: '1px solid var(--sep)' }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--sep)', background: 'var(--bg-2)' }}>
          <h3 className="text-[16px] font-bold" style={{ color: 'var(--label)' }}>Adicionar aviso de estoque</h3>
          <button onClick={onClose} style={{ color: 'var(--label-3)' }}><X size={16}/></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Produto */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--label-3)' }}>
              Produto *
            </label>
            <div className="relative">
              <input value={form.produto_nome}
                onChange={e => { setForm(p=>({...p,produto_nome:e.target.value})); buscarProduto(e.target.value) }}
                placeholder="Nome do produto ou busque na Nuvemshop..."
                style={inp} />
              {buscando && <RefreshCw size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color:'var(--label-3)' }}/>}
              {sugestoes.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 rounded-[9px] overflow-hidden mt-1"
                  style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', maxHeight:200, overflowY:'auto' }}>
                  {sugestoes.map((p,i) => (
                    <button key={i} onClick={() => selecionarProduto(p)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--fill)]">
                      {p.imagem && <img src={p.imagem} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0"/>}
                      <div>
                        <div className="text-[12px]" style={{ color:'var(--label)' }}>
                          {typeof p.nome === 'object' ? (p.nome.pt||Object.values(p.nome)[0]) : p.nome}
                        </div>
                        <div className="text-[10px]" style={{ color:'var(--label-3)' }}>R$ {p.preco}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview do produto */}
          {(form.produto_img || form.produto_url || form.produto_preco) && (
            <div className="flex items-center gap-3 p-3 rounded-[10px]"
              style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
              {form.produto_img && <img src={form.produto_img} alt="" className="w-12 h-12 rounded-[8px] object-cover flex-shrink-0"/>}
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate" style={{ color:'var(--label)' }}>{form.produto_nome}</div>
                {form.produto_preco && <div className="text-[11px] font-bold mt-0.5" style={{ color:'var(--accent)' }}>R$ {form.produto_preco}</div>}
                {form.produto_url && <div className="text-[10px] truncate mt-0.5" style={{ color:'var(--blue)' }}>{form.produto_url}</div>}
              </div>
            </div>
          )}

          {/* Campos manuais do produto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--label-3)' }}>Preço (R$)</label>
              <input value={form.produto_preco} onChange={e => setForm(p=>({...p,produto_preco:e.target.value}))}
                placeholder="0,00" style={inp} />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--label-3)' }}>URL da imagem</label>
              <input value={form.produto_img} onChange={e => setForm(p=>({...p,produto_img:e.target.value}))}
                placeholder="https://..." style={inp} />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--label-3)' }}>Link do produto</label>
            <input value={form.produto_url} onChange={e => setForm(p=>({...p,produto_url:e.target.value}))}
              placeholder="https://sualoja.com.br/produto" style={inp} />
          </div>

          <div style={{ borderTop:'1px solid var(--sep)', paddingTop:16 }}>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--label-3)' }}>
              Telefone do cliente * <span style={{ color:'var(--label-4)', textTransform:'none', fontWeight:400 }}>(com DDI: 5511999999999)</span>
            </label>
            <input value={form.telefone} onChange={e => setForm(p=>({...p,telefone:e.target.value.replace(/\D/g,'')}))}
              placeholder="5511999999999" style={inp} />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--label-3)' }}>Nome do cliente</label>
            <input value={form.nome} onChange={e => setForm(p=>({...p,nome:e.target.value}))}
              placeholder="Ex: Maria Silva" style={inp} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold"
              style={{ background:'var(--fill)', color:'var(--label-2)', border:'1px solid var(--sep)' }}>
              Cancelar
            </button>
            <button onClick={salvar} disabled={!form.telefone||!form.produto_nome||salvando}
              className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold"
              style={{ background:'var(--accent)', color:'#000', opacity:(!form.telefone||!form.produto_nome)?0.5:1 }}>
              {salvando ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PageEstoque({ api: apiProp }) {
  const api = apiProp || BASE
  const [lista,       setLista]       = useState([])
  const [historico,   setHistorico]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('pendentes')
  const [showModal,   setShowModal]   = useState(false)
  const [notificando, setNotificando] = useState(new Set())
  const [deletando,   setDeletando]   = useState(new Set())
  const [busca,       setBusca]       = useState('')

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/estoque/`)
      if (r.ok) {
        const d = await r.json()
        const todos = d.lista || []
        setLista(todos.filter(i => !i.notificado))
        setHistorico(todos.filter(i => i.notificado))
      }
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  const notificar = async (id) => {
    setNotificando(prev => new Set([...prev, id]))
    try {
      const r = await fetch(`${api}/api/estoque/verificar/${id}`, { method: 'POST' })
      if (r.ok) {
        const d = await r.json()
        await carregar()
        if (d.mensagem_enviada) {
          console.log('Mensagem enviada:', d.mensagem_enviada.slice(0, 60))
        }
      }
    } catch {}
    setNotificando(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const deletar = async (id) => {
    setDeletando(prev => new Set([...prev, id]))
    try {
      await fetch(`${api}/api/estoque/${id}`, { method: 'DELETE' })
      await carregar()
    } catch {}
    setDeletando(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const filtrados = (tab === 'pendentes' ? lista : historico)
    .filter(i => !busca ||
      (i.produto_nome||'').toLowerCase().includes(busca.toLowerCase()) ||
      (i.nome||'').toLowerCase().includes(busca.toLowerCase()) ||
      (i.telefone||'').includes(busca))

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight" style={{ color:'var(--label)' }}>Avise-me</h2>
            <p className="text-[13px] mt-0.5" style={{ color:'var(--label-3)' }}>
              {lista.length} aguardando · {historico.length} notificados
            </p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-semibold"
            style={{ background:'var(--accent)', color:'#000' }}>
            <Plus size={14}/> Adicionar
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex p-0.5 rounded-[10px]" style={{ background:'var(--fill)' }}>
            {[['pendentes',`Aguardando (${lista.length})`],['historico',`Histórico (${historico.length})`]].map(([v,l]) => (
              <button key={v} onClick={() => setTab(v)}
                className="px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-all"
                style={{ background:tab===v?'var(--bg-2)':'transparent', color:tab===v?'var(--label)':'var(--label-3)' }}>
                {l}
              </button>
            ))}
          </div>
          {/* Busca */}
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--label-3)' }}/>
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por produto ou cliente..."
              className="w-full pl-8 pr-3 py-2 rounded-[9px] text-[12px] outline-none"
              style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading && (
          <div className="flex justify-center py-10" style={{ color:'var(--label-3)' }}>
            <RefreshCw size={16} className="animate-spin"/>
          </div>
        )}

        {!loading && filtrados.length === 0 && (
          <div className="flex flex-col items-center py-16">
            <Bell size={32} className="mb-3 opacity-20" style={{ color:'var(--label-3)' }}/>
            <p className="text-[14px] font-medium" style={{ color:'var(--label-2)' }}>
              {tab === 'pendentes' ? 'Nenhum cliente aguardando' : 'Nenhuma notificação enviada'}
            </p>
            {tab === 'pendentes' && (
              <button onClick={() => setShowModal(true)}
                className="mt-4 px-4 py-2 rounded-[10px] text-[13px] font-semibold"
                style={{ background:'var(--accent)', color:'#000' }}>
                Adicionar primeiro aviso
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 max-w-3xl">
          {filtrados.map(item => (
            <div key={item.id} className="card overflow-hidden" style={{ background:'var(--bg-2)' }}>
              <div className="flex items-start gap-4 p-4">

                {/* Imagem do produto */}
                {item.produto_img ? (
                  <img src={item.produto_img} alt={item.produto_nome}
                    className="w-16 h-16 rounded-[10px] object-cover flex-shrink-0"
                    onError={e => e.target.style.display='none'}/>
                ) : (
                  <div className="w-16 h-16 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background:'var(--fill)', border:'1px solid var(--sep)' }}>
                    <Package size={20} style={{ color:'var(--label-3)' }}/>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Nome do produto */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold truncate" style={{ color:'var(--label)' }}>
                        {item.produto_nome}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {item.produto_preco && (
                          <span className="text-[13px] font-bold" style={{ color:'var(--accent)' }}>
                            R$ {parseFloat(item.produto_preco).toFixed(2)}
                          </span>
                        )}
                        {item.produto_url && (
                          <a href={item.produto_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px]"
                            style={{ color:'var(--blue)' }}>
                            <ExternalLink size={10}/> Ver produto
                          </a>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-[6px] flex-shrink-0"
                      style={{ background: item.notificado?'rgba(0,212,170,0.1)':'rgba(245,158,11,0.1)', color: item.notificado?'var(--accent)':'var(--orange)' }}>
                      {item.notificado ? '✓ Notificado' : '⏳ Aguardando'}
                    </span>
                  </div>

                  {/* Cliente */}
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Phone size={11} style={{ color:'var(--label-4)' }}/>
                      <span className="text-[12px] font-mono" style={{ color:'var(--label-2)' }}>{item.telefone}</span>
                    </div>
                    {item.nome && (
                      <span className="text-[12px]" style={{ color:'var(--label-3)' }}>{item.nome}</span>
                    )}
                    <span className="text-[11px]" style={{ color:'var(--label-4)' }}>
                      <Clock size={10} className="inline mr-1"/>
                      {new Date(item.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                    {item.notificado && item.notificado_em && (
                      <span className="text-[11px]" style={{ color:'var(--accent)' }}>
                        Enviado: {new Date(item.notificado_em).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ações */}
              {!item.notificado && (
                <div className="flex items-center gap-2 px-4 pb-4">
                  <button onClick={() => notificar(item.id)}
                    disabled={notificando.has(item.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-[9px] text-[12px] font-semibold transition-all"
                    style={{ background:'var(--accent)', color:'#000', opacity:notificando.has(item.id)?0.7:1 }}>
                    {notificando.has(item.id)
                      ? <><RefreshCw size={12} className="animate-spin"/> Enviando...</>
                      : <><Send size={12}/> Notificar cliente</>}
                  </button>
                  <button onClick={() => deletar(item.id)}
                    disabled={deletando.has(item.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-[12px]"
                    style={{ background:'rgba(226,75,74,0.1)', color:'var(--red)', border:'1px solid rgba(226,75,74,0.2)' }}>
                    <Trash2 size={12}/> Remover
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <ModalAdicionar api={api} onClose={() => setShowModal(false)} onSalvar={carregar}/>
      )}
    </div>
  )
}
