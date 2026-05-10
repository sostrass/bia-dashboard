import { useState, useEffect } from 'react'
import { Save, RefreshCw, CheckCircle, XCircle, Zap, Info } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const MODELOS = [
  { id: 'gemini-2.5-flash-lite', nome: 'Gemini 2.5 Flash-Lite', custo: 'R$ 0,00056/msg', nivel: 'Econômico',  cor: '#32D74B' },
  { id: 'gemini-2.5-flash',      nome: 'Gemini 2.5 Flash',      custo: 'R$ 0,0017/msg',  nivel: 'Balanceado', cor: '#0A84FF' },
  { id: 'gemini-2.5-pro',        nome: 'Gemini 2.5 Pro',        custo: 'R$ 0,007/msg',   nivel: 'Máximo',     cor: '#BF5AF2' },
]

export default function PageAgentes({ api: apiProp }) {
  const apiBase = apiProp || BASE

  const [config, setConfig] = useState({
    geminiKey: '', modelo: 'gemini-2.5-flash',
    temperatura: '0.7', persona: '', maxTokens: 800,
  })
  const [geminiKeyInput, setGeminiKeyInput] = useState('')
  const [saving, setSaving]   = useState(false)
  const [testing, setTesting] = useState(false)
  const [keyStatus, setKeyStatus] = useState(null)
  const [keyMsg, setKeyMsg]   = useState('')
  const [saved, setSaved]     = useState(false)
  const [erro, setErro]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${apiBase}/api/ia/config`)
      .then(r => r.json())
      .then(d => { setConfig(prev => ({ ...prev, ...d })); setLoading(false) })
      .catch(e => { setErro(`Erro ao carregar: ${e.message}`); setLoading(false) })
  }, [apiBase])

  const salvar = async () => {
    setSaving(true); setErro(null)
    try {
      const payload = { ...config }
      if (geminiKeyInput.trim()) payload.geminiKey = geminiKeyInput.trim()
      else delete payload.geminiKey

      const r = await fetch(`${apiBase}/api/ia/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.erro || `HTTP ${r.status}`) }
      setSaved(true); setTimeout(() => setSaved(false), 3000)
      setGeminiKeyInput('')
      // Recarrega para confirmar que salvou
      const r2 = await fetch(`${apiBase}/api/ia/config`)
      if (r2.ok) { const d2 = await r2.json(); setConfig(prev => ({ ...prev, ...d2 })) }
    } catch (e) {
      setErro(`Erro ao salvar: ${e.message}`)
    } finally { setSaving(false) }
  }

  const testarChave = async () => {
    setTesting(true); setKeyStatus(null)
    try {
      const body = {}
      if (geminiKeyInput.trim()) body.geminiKey = geminiKeyInput.trim()
      const r = await fetch(`${apiBase}/api/ia/test-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const d = await r.json()
      setKeyStatus(d.ok ? 'ok' : 'erro')
      setKeyMsg(d.ok ? (d.aviso || 'Chave válida!') : (d.erro || 'Chave inválida.'))
    } catch (e) {
      setKeyStatus('erro'); setKeyMsg(`Erro: ${e.message}`)
    } finally { setTesting(false) }
  }

  const inp = {
    background: 'var(--bg-3)', border: '1px solid var(--sep)',
    borderRadius: 10, color: 'var(--label)', outline: 'none',
    padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', width: '100%',
  }

  if (loading) return (
    <div className="h-full flex items-center justify-center gap-3" style={{ color: 'var(--label-3)' }}>
      <RefreshCw size={16} className="animate-spin" /> Carregando configurações...
    </div>
  )

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--label)' }}>Configurações da IA</h2>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-3)' }}>Modelo Gemini, persona e parâmetros</p>
        </div>
        <button onClick={salvar} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[13px] font-semibold"
          style={{ background: saved ? 'var(--accent-dim)' : 'var(--accent)', color: saved ? 'var(--accent)' : '#000', opacity: saving ? 0.7 : 1 }}>
          {saving ? <RefreshCw size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar configurações'}
        </button>
      </div>

      {erro && (
        <div className="p-4 rounded-[12px] text-[13px]" style={{ background: 'rgba(255,69,58,0.1)', color: 'var(--red)', border: '1px solid rgba(255,69,58,0.2)' }}>
          {erro}
        </div>
      )}

      {/* Chave API */}
      <div className="card p-5 space-y-4">
        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--label)' }}>Chave de API Gemini</h3>
        {config.geminiKey && (
          <div className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-[8px]"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            <CheckCircle size={13} /> Chave salva: {config.geminiKey}
          </div>
        )}
        <div>
          <label className="text-[11px] font-semibold block mb-1.5 uppercase tracking-wider" style={{ color: 'var(--label-3)' }}>
            {config.geminiKey ? 'Nova chave (deixe vazio para manter a atual)' : 'Chave Gemini API'}
          </label>
          <input type="password" value={geminiKeyInput}
            onChange={e => { setGeminiKeyInput(e.target.value); setKeyStatus(null) }}
            placeholder="AIzaSy..." style={inp} />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={testarChave} disabled={testing}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold border"
            style={{ background: 'var(--fill)', borderColor: 'var(--sep)', color: 'var(--label-2)' }}>
            {testing ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
            Testar chave
          </button>
          {keyStatus && (
            <span className="flex items-center gap-1.5 text-[12px]"
              style={{ color: keyStatus === 'ok' ? 'var(--accent)' : 'var(--red)' }}>
              {keyStatus === 'ok' ? <CheckCircle size={13} /> : <XCircle size={13} />}
              {keyMsg}
            </span>
          )}
        </div>
        <div className="flex items-start gap-2 p-3 rounded-[10px] text-[12px]"
          style={{ background: 'var(--fill)', color: 'var(--label-3)' }}>
          <Info size={13} className="mt-0.5 flex-shrink-0" />
          Obtenha sua chave em{' '}
          <a href="https://aistudio.google.com" target="_blank" className="underline ml-1" style={{ color: 'var(--blue)' }}>
            aistudio.google.com
          </a>
        </div>
      </div>

      {/* Modelo */}
      <div className="card p-5 space-y-4">
        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--label)' }}>Modelo de IA</h3>
        <div className="grid grid-cols-3 gap-3">
          {MODELOS.map(m => (
            <button key={m.id} onClick={() => setConfig(p => ({ ...p, modelo: m.id }))}
              className="p-4 rounded-[12px] border text-left transition-all"
              style={{ border: `1px solid ${config.modelo === m.id ? m.cor : 'var(--sep)'}`, background: config.modelo === m.id ? `${m.cor}12` : 'var(--fill)' }}>
              <div className="text-[11px] font-bold mb-1" style={{ color: m.cor }}>{m.nivel}</div>
              <div className="text-[12px] font-semibold mb-1" style={{ color: 'var(--label)' }}>{m.nome}</div>
              <div className="text-[11px]" style={{ color: 'var(--label-3)' }}>{m.custo}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Persona */}
      <div className="card p-5 space-y-3">
        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--label)' }}>Persona</h3>
        <textarea value={config.persona || ''} rows={5}
          onChange={e => setConfig(p => ({ ...p, persona: e.target.value }))}
          placeholder="Você é Bia, assistente virtual da Armarinhos. Seja simpática, objetiva e ajude com pedidos, dúvidas e devoluções..."
          style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
      </div>

      {/* Temperatura */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold" style={{ color: 'var(--label)' }}>Temperatura</h3>
          <span className="text-[13px] font-mono font-bold" style={{ color: 'var(--accent)' }}>{config.temperatura}</span>
        </div>
        <input type="range" min="0" max="1" step="0.1" className="w-full"
          value={config.temperatura || 0.7}
          onChange={e => setConfig(p => ({ ...p, temperatura: e.target.value }))} />
        <div className="flex justify-between text-[11px]" style={{ color: 'var(--label-3)' }}>
          <span>Preciso</span><span>Criativo</span>
        </div>
      </div>

      {/* Comprimento */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold" style={{ color: 'var(--label)' }}>Comprimento das respostas</h3>
          <span className="text-[13px] font-mono font-bold" style={{ color: 'var(--accent)' }}>{config.maxTokens} tokens</span>
        </div>
        <input type="range" min="100" max="2000" step="100" className="w-full"
          value={config.maxTokens || 800}
          onChange={e => setConfig(p => ({ ...p, maxTokens: parseInt(e.target.value) }))} />
        <div className="flex justify-between text-[11px]" style={{ color: 'var(--label-3)' }}>
          <span>Curta (100)</span><span>Média (800)</span><span>Longa (2000)</span>
        </div>
      </div>
    </div>
  )
}
