import { useState, useEffect } from 'react'
import { X, Phone, Tag, MessageSquare, ShoppingBag, TrendingUp, Bot, User, Clock, Edit2, Save } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

export default function ModalPerfilCliente({ telefone, nome, onClose, api: apiProp }) {
  const api = apiProp || BASE
  const [contato,  setContato]  = useState(null)
  const [historico, setHistorico] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [editando, setEditando] = useState(false)
  const [nomeEdit, setNomeEdit] = useState(nome || '')
  const [modoIA,   setModoIA]   = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [rc, rh] = await Promise.all([
          fetch(`${api}/api/contatos/${telefone}`).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`${api}/api/dashboard/historico/${telefone}`).then(r => r.ok ? r.json() : null).catch(() => null),
        ])
        if (rc) {
          setContato(rc)
          setNomeEdit(rc.nome || nome || '')
          setModoIA(rc.modo !== 'manual')
        }
        if (rh) setHistorico(rh.mensagens || [])
      } catch {}
      setLoading(false)
    }
    load()
  }, [telefone, api])

  const salvar = async () => {
    setSalvando(true)
    try {
      await fetch(`${api}/api/contatos/${telefone}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeEdit, modo: modoIA ? 'auto' : 'manual' })
      })
      setContato(prev => ({ ...prev, nome: nomeEdit, modo: modoIA ? 'auto' : 'manual' }))
      setEditando(false)
    } catch {}
    setSalvando(false)
  }

  const tags = contato?.tags || []
  const ltv  = parseFloat(contato?.ltv || 0).toFixed(2)
  const totalMsgs = contato?.total_msgs || historico.length || 0
  const msgsIA = historico.filter(m => m.direcao === 'saida' && m.modo === 'auto').length
  const msgsHumano = historico.filter(m => m.direcao === 'saida' && m.modo === 'manual').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="w-[520px] max-h-[85vh] flex flex-col rounded-[20px] overflow-hidden"
        style={{ background: 'var(--bg)', border: '1px solid var(--sep)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--sep)', background: 'var(--bg-2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold"
              style={{ background: 'var(--accent)', color: '#000' }}>
              {(nomeEdit || telefone).slice(0, 2).toUpperCase()}
            </div>
            <div>
              {editando ? (
                <input value={nomeEdit} onChange={e => setNomeEdit(e.target.value)}
                  className="text-[17px] font-semibold bg-transparent outline-none border-b"
                  style={{ color: 'var(--label)', borderColor: 'var(--accent)' }} />
              ) : (
                <div className="text-[17px] font-semibold" style={{ color: 'var(--label)' }}>
                  {nomeEdit || 'Cliente'}
                </div>
              )}
              <div className="text-[12px] font-mono mt-0.5" style={{ color: 'var(--label-3)' }}>{telefone}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editando ? (
              <button onClick={salvar} disabled={salvando}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold"
                style={{ background: 'var(--accent)', color: '#000' }}>
                <Save size={12} /> Salvar
              </button>
            ) : (
              <button onClick={() => setEditando(true)}
                className="p-2 rounded-[8px]" style={{ color: 'var(--label-3)', background: 'var(--fill)' }}>
                <Edit2 size={14} />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-[8px]"
              style={{ color: 'var(--label-3)', background: 'var(--fill)' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {loading ? (
            <div className="flex justify-center py-8" style={{ color: 'var(--label-3)' }}>
              Carregando...
            </div>
          ) : <>

            {/* Flag IA / Manual */}
            <div className="flex items-center justify-between p-4 rounded-[12px]"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--sep)' }}>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: 'var(--label)' }}>
                  Modo de Atendimento
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: 'var(--label-3)' }}>
                  {modoIA ? 'IA responde automaticamente' : 'Atendimento humano exclusivo'}
                </div>
              </div>
              <button onClick={() => setModoIA(v => !v)}
                className="relative flex-shrink-0"
                style={{ width: 48, height: 26, borderRadius: 13, background: modoIA ? 'var(--accent)' : 'var(--blue)', transition: 'background .2s' }}>
                <span className="absolute top-0.5 h-[22px] w-[22px] bg-white rounded-full shadow transition-all duration-200"
                  style={{ left: modoIA ? 'calc(100% - 24px)' : '2px' }} />
              </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: MessageSquare, label: 'Total msgs',    value: totalMsgs,          color: 'var(--blue)'   },
                { icon: Bot,           label: 'Resp. pela IA', value: msgsIA,              color: 'var(--accent)' },
                { icon: User,          label: 'Resp. humanas', value: msgsHumano,          color: 'var(--orange)' },
              ].map((k, i) => (
                <div key={i} className="p-3 rounded-[12px] text-center"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--sep)' }}>
                  <k.icon size={14} className="mx-auto mb-1.5" style={{ color: k.color }} />
                  <div className="text-[20px] font-bold" style={{ color: k.color }}>{k.value}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--label-3)' }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* LTV */}
            {parseFloat(ltv) > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-[12px]"
                style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
                <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
                <div>
                  <div className="text-[12px]" style={{ color: 'var(--label-3)' }}>Valor total em compras</div>
                  <div className="text-[18px] font-bold" style={{ color: 'var(--accent)' }}>R$ {ltv}</div>
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--label-3)' }}>Tags</div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t, i) => (
                    <span key={i} className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                      style={{ background: 'var(--fill)', color: 'var(--label-2)', border: '1px solid var(--sep)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Últimas mensagens */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--label-3)' }}>
                Últimas mensagens
              </div>
              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {historico.slice(-8).reverse().map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.direcao === 'entrada' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%] px-3 py-2 rounded-[10px] text-[11px]"
                      style={{
                        background: m.direcao === 'entrada' ? 'var(--blue)' : 'var(--bg-3)',
                        color: m.direcao === 'entrada' ? '#fff' : 'var(--label)',
                        border: m.direcao !== 'entrada' ? '1px solid var(--sep)' : 'none',
                      }}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{(m.mensagem || '').slice(0, 100)}</div>
                      <div className="text-[9px] mt-1 opacity-60 text-right">{m.hora}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>}
        </div>
      </div>
    </div>
  )
}
