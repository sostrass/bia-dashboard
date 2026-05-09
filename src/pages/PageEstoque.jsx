import { useState, useEffect } from 'react'
import { Bell, Package, Plus, Trash2, RefreshCw, Send } from 'lucide-react'

export default function PageEstoque({ api }) {
  const [lista,    setLista]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [erro,     setErro]     = useState(null)
  const [showAdd,  setShowAdd]  = useState(false)
  const [form,     setForm]     = useState({ telefone:'', nome:'', produto_nome:'' })
  const [saving,   setSaving]   = useState(false)
  const [avisos,   setAvisos]   = useState({}) // { produtoId: 'sending'|'done' }

  const carregar = async () => {
    setErro(null)
    try {
      // BUG FIX: usa api prop corretamente, com fallback
      const url = api || ''
      const r = await fetch(`${url}/api/estoque/`)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      setLista(d.lista || [])
    } catch (e) {
      console.error('Erro carregar estoque:', e.message)
      setErro('Não foi possível carregar a lista. Verifique a conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [api])

  const avisar = async (produtoId, produtoNome) => {
    setAvisos(prev => ({ ...prev, [produtoId]: 'sending' }))
    try {
      const url = api || ''
      const r = await fetch(`${url}/api/estoque/verificar/${produtoId}`, { method: 'POST' })
      const d = await r.json()
      setAvisos(prev => ({ ...prev, [produtoId]: 'done' }))
      if (d.avisados > 0) {
        alert(`✅ ${d.avisados} cliente(s) avisado(s) sobre "${produtoNome}"!`)
        await carregar()
      } else {
        alert('Nenhum cliente para avisar ou produto não disponível no estoque.')
      }
    } catch {
      setAvisos(prev => ({ ...prev, [produtoId]: null }))
      alert('Erro ao enviar avisos. Verifique a conexão.')
    }
  }

  const adicionarManual = async () => {
    if (!form.telefone.trim() || !form.produto_nome.trim()) {
      alert('Telefone e produto são obrigatórios!')
      return
    }
    setSaving(true)
    try {
      const url = api || ''
      const r = await fetch(`${url}/api/estoque/adicionar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone: form.telefone.replace(/\D/g, ''),
          nome: form.nome,
          produto_nome: form.produto_nome
        })
      })
      if (!r.ok) throw new Error()
      setForm({ telefone:'', nome:'', produto_nome:'' })
      setShowAdd(false)
      await carregar()
    } catch {
      alert('Erro ao adicionar. Verifique os dados.')
    } finally {
      setSaving(false)
    }
  }

  const total = lista.reduce((a, e) => a + parseInt(e.total || 0), 0)

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
  const focus = e => e.target.style.borderColor = 'var(--accent)'
  const blur  = e => e.target.style.borderColor = 'var(--sep)'

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center gap-3" style={{ color:'var(--label-3)' }}>
        <RefreshCw size={16} className="animate-spin" />
        <span>Carregando lista de aviso...</span>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-center">
          <div className="text-[16px] font-semibold mb-2" style={{ color:'var(--label)' }}>Erro ao carregar</div>
          <div className="text-[13px] mb-4" style={{ color:'var(--label-3)' }}>{erro}</div>
          <button onClick={carregar}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold mx-auto"
            style={{ background:'var(--accent)', color:'#000' }}>
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5" style={{ background:'var(--bg)' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight" style={{ color:'var(--label)' }}>Avise-me</h2>
          <p className="text-[13px] mt-0.5" style={{ color:'var(--label-3)' }}>Clientes aguardando reposição de estoque</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={carregar}
            className="p-2 rounded-[10px] transition-all" style={{ background:'var(--fill)', color:'var(--label-3)' }}>
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all"
            style={{ background:'var(--accent)', color:'#000' }}>
            <Plus size={14} /> Adicionar manualmente
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { v: lista.length, l:'Produtos monitorados',   c:'var(--accent)' },
          { v: total,        l:'Clientes aguardando',    c:'var(--orange)' },
          { v: 'Ativo',      l:'Monitor via webhook',    c:'var(--teal)'   },
        ].map((m,i) => (
          <div key={i} className="card p-4">
            <div className="text-[28px] font-bold tracking-tight" style={{ color:m.c }}>{m.v}</div>
            <div className="text-[12px] mt-1" style={{ color:'var(--label-3)' }}>{m.l}</div>
          </div>
        ))}
      </div>

      {/* Form adicionar manualmente */}
      {showAdd && (
        <div className="card p-5 space-y-3"
          style={{ border:'1px solid var(--accent)', background:'var(--accent-dim)' }}>
          <h3 className="text-[14px] font-semibold flex items-center gap-2" style={{ color:'var(--accent)' }}>
            <Plus size={14} /> Adicionar cliente à lista de aviso
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold block mb-1.5 uppercase tracking-wider" style={{ color:'var(--label-3)' }}>
                Telefone *
              </label>
              <input value={form.telefone} onChange={e => setForm(p => ({...p, telefone:e.target.value}))}
                placeholder="11999998888" style={inp} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label className="text-[11px] font-semibold block mb-1.5 uppercase tracking-wider" style={{ color:'var(--label-3)' }}>
                Nome do cliente
              </label>
              <input value={form.nome} onChange={e => setForm(p => ({...p, nome:e.target.value}))}
                placeholder="Maria F." style={inp} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label className="text-[11px] font-semibold block mb-1.5 uppercase tracking-wider" style={{ color:'var(--label-3)' }}>
                Produto desejado *
              </label>
              <input value={form.produto_nome} onChange={e => setForm(p => ({...p, produto_nome:e.target.value}))}
                placeholder="Pérola ABS 8mm Branca" style={inp} onFocus={focus} onBlur={blur} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={adicionarManual} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold"
              style={{ background:'var(--accent)', color:'#000', opacity:saving?0.7:1 }}>
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
              Adicionar à lista
            </button>
            <button onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-[10px] text-[13px] font-medium border"
              style={{ background:'var(--fill)', borderColor:'var(--sep)', color:'var(--label-2)' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista vazia */}
      {lista.length === 0 && (
        <div className="card p-12 flex flex-col items-center text-center">
          <Package size={32} className="mb-3 opacity-30" style={{ color:'var(--accent)' }} />
          <p className="text-[14px] font-medium" style={{ color:'var(--label-2)' }}>Nenhum produto na lista de aviso</p>
          <p className="text-[12px] mt-1" style={{ color:'var(--label-3)' }}>
            Quando um cliente pedir para ser avisado via WhatsApp, aparecerá aqui automaticamente.
          </p>
          <button onClick={() => setShowAdd(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold"
            style={{ background:'var(--accent)', color:'#000' }}>
            <Plus size={13} /> Adicionar manualmente
          </button>
        </div>
      )}

      {/* Lista de produtos */}
      {lista.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom:'1px solid var(--sep)' }}>
            <h3 className="text-[15px] font-semibold" style={{ color:'var(--label)' }}>Fila de Aviso</h3>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full"
              style={{ background:'rgba(255,159,10,0.12)', color:'var(--orange)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:'var(--orange)' }} />
              Monitorando via webhook
            </div>
          </div>
          <div className="divide-y" style={{ borderColor:'var(--sep)' }}>
            {lista.map((e,i) => {
              const clientes = Array.isArray(e.clientes) ? e.clientes : []
              const avStatus = avisos[e.produto_id]
              return (
                <div key={i} className="flex items-start gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                    style={{ background:'rgba(255,159,10,0.12)' }}>
                    <Package size={18} style={{ color:'var(--orange)' }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold mb-1" style={{ color:'var(--label)' }}>
                      {e.produto_nome || e.produto_id}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background:'rgba(255,159,10,0.12)', color:'var(--orange)' }}>
                        {e.total} cliente{parseInt(e.total)!==1?'s':''} aguardando
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {clientes.map(c => (
                        <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded-[6px] border"
                          style={{ background:'var(--fill)', borderColor:'var(--sep)', color:'var(--label-3)' }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => avisar(e.produto_id, e.produto_nome)}
                    disabled={avStatus === 'sending' || avStatus === 'done'}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold flex-shrink-0 transition-all"
                    style={{
                      background: avStatus==='done' ? 'var(--accent-dim)' : 'var(--fill)',
                      borderColor: avStatus==='done' ? 'var(--accent-border)' : 'var(--sep)',
                      color: avStatus==='done' ? 'var(--accent)' : 'var(--label-2)',
                      border: '1px solid',
                      opacity: avStatus==='sending' ? 0.7 : 1,
                    }}>
                    {avStatus==='sending' ? <><RefreshCw size={12} className="animate-spin" />Enviando...</>
                     : avStatus==='done'  ? <>✓ Enviado</>
                     : <><Bell size={12} />Avisar agora</>}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
