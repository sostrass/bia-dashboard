import { useState, useEffect, useCallback } from 'react'
import { Truck, Store, Cloud, ShoppingCart, Shirt, ShoppingBag, Brush,
         Eraser, CircleOff, PackageX, RefreshCw, Check } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

const ICONES = {
  loja: Store, nuvemshop: Cloud, mercadolivre: ShoppingCart,
  shein: Shirt, shopee: ShoppingBag, tiktokshop: Brush,
}

export default function PageRastreioConfig() {
  const [canais, setCanais]   = useState([])
  const [carregando, setCarr] = useState(true)
  const [salvando, setSalv]   = useState(false)
  const [salvoOk, setSalvoOk] = useState(false)
  const [limpando, setLimp]   = useState('')
  const [msg, setMsg]         = useState('')

  const carregar = useCallback(async () => {
    setCarr(true)
    try {
      const r = await fetch(`${API}/api/operacao/canais`)
      const d = await r.json()
      if (d.canais) setCanais(d.canais)
    } catch {}
    setCarr(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const toggle = (id) => {
    setCanais(cs => cs.map(c => c.id === id ? { ...c, ativo: !c.ativo } : c))
  }

  const salvar = async () => {
    setSalv(true); setMsg('')
    try {
      const payload = {}
      canais.forEach(c => { payload[c.id] = c.ativo })
      const r = await fetch(`${API}/api/operacao/canais`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canais: payload }),
      })
      if (r.ok) { setSalvoOk(true); setTimeout(() => setSalvoOk(false), 2500) }
    } catch {}
    setSalv(false)
  }

  // Executa uma limpeza: primeiro preview (GET), confirma, depois POST
  const limpar = async (rota, label) => {
    setLimp(rota); setMsg('')
    try {
      const pv = await fetch(`${API}/api/operacao/${rota}`)
      const dpv = await pv.json()
      const qtd = dpv.seriam_encerrados ?? 0
      if (!qtd) { setMsg(`Nada para limpar em "${label}".`); setLimp(''); return }
      if (!window.confirm(`Encerrar ${qtd} pedido(s) — ${label}?\n\nIsso é reversível (encerra, não apaga).`)) { setLimp(''); return }
      const ex = await fetch(`${API}/api/operacao/${rota}`, { method: 'POST' })
      const dex = await ex.json()
      setMsg(`✓ ${dex.encerrados || 0} pedido(s) encerrado(s) — ${label}.`)
      await carregar()
    } catch (e) { setMsg('Erro: ' + e.message) }
    setLimp('')
  }

  const card = { background: 'var(--card, #fff)', border: '0.5px solid var(--sep, rgba(0,0,0,.1))', borderRadius: 11 }
  const proprios = ['loja', 'nuvemshop']

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px', fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Truck size={20} style={{ color: '#7c6af7' }} />
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--label, #111)' }}>Rastreio por canal</h1>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--label-3, #666)', margin: '0 0 18px' }}>
        Escolha quais canais o sistema rastreia. Marketplaces têm rastreio próprio — você decide quais acompanhar por aqui.
      </p>

      {carregando ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--label-4, #999)' }}>
          <RefreshCw size={20} className="spin" /> Carregando...
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {canais.map(c => {
              const Icon = ICONES[c.id] || Truck
              const ehProprio = proprios.includes(c.id)
              return (
                <div key={c.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', opacity: c.ativo ? 1 : 0.7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <Icon size={18} style={{ color: c.ativo ? (ehProprio ? '#1D9E75' : '#7c6af7') : '#999' }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--label, #111)' }}>{c.nome}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--label-3, #666)' }}>
                        {c.desc}{c.naFila > 0 ? ` · ${c.naFila} na fila` : ''}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => toggle(c.id)} aria-label={`${c.ativo ? 'Desativar' : 'Ativar'} ${c.nome}`}
                    style={{ position: 'relative', width: 38, height: 21, borderRadius: 99, border: 'none', cursor: 'pointer',
                             background: c.ativo ? '#1D9E75' : 'var(--sep, #ccc)', transition: 'background .15s', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', width: 16, height: 16, background: '#fff', borderRadius: '50%', top: 2.5,
                                   left: c.ativo ? 19 : 2.5, transition: 'left .15s' }} />
                  </button>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 22 }}>
            <button onClick={salvar} disabled={salvando}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9,
                       border: '0.5px solid rgba(37,211,102,.3)', background: 'rgba(37,211,102,.08)', color: '#1D9E75',
                       cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {salvoOk ? <><Check size={15} /> Salvo!</> : salvando ? 'Salvando...' : 'Salvar configuração'}
            </button>
            <span style={{ fontSize: 11, color: 'var(--label-4, #999)' }}>
              Ao desativar um canal, a varredura para de enfileirá-lo.
            </span>
          </div>

          <div style={{ borderTop: '0.5px solid var(--sep, rgba(0,0,0,.1))', paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--label, #111)', marginBottom: 10 }}>Manutenção da fila</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <BtnLimpar icon={Eraser}    label="Limpar canais desativados" onClick={() => limpar('limpar-desativados', 'canais desativados')} loading={limpando === 'limpar-desativados'} />
              <BtnLimpar icon={CircleOff} label="Limpar sem código"          onClick={() => limpar('limpar-sem-codigo', 'sem código de rastreio')} loading={limpando === 'limpar-sem-codigo'} />
              <BtnLimpar icon={PackageX}  label="Limpar marketplaces"         onClick={() => limpar('limpar-marketplace', 'marketplaces')} loading={limpando === 'limpar-marketplace'} />
            </div>
            <p style={{ fontSize: 10, color: 'var(--label-4, #999)', marginTop: 10 }}>
              As limpezas mostram um preview e pedem confirmação. Encerram os pedidos (não apagam) — é reversível.
            </p>
            {msg && <p style={{ fontSize: 12, color: msg.startsWith('✓') ? '#1D9E75' : '#e24b4a', marginTop: 8 }}>{msg}</p>}
          </div>
        </>
      )}
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function BtnLimpar({ icon: Icon, label, onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 8,
               border: '0.5px solid var(--sep, rgba(0,0,0,.15))', background: 'var(--card, #fff)',
               color: 'var(--label-2, #333)', cursor: 'pointer', fontSize: 11.5, fontWeight: 500 }}>
      <Icon size={14} /> {loading ? 'Processando...' : label}
    </button>
  )
}
