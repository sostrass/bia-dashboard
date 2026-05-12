import { useState, useEffect, useCallback } from 'react'
import { Clock, AlertCircle, RefreshCw, MessageSquare, User, CheckCircle } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

function formatarEspera(min) {
  const m = Math.round(min || 0)
  if (m < 1)  return 'Agora'
  if (m < 60) return `${m}min`
  return `${Math.floor(m/60)}h ${m%60}min`
}

function corEspera(min) {
  if (min < 5)  return 'var(--accent)'
  if (min < 15) return 'var(--orange)'
  return 'var(--red)'
}

export default function PageFila({ api: apiProp, onAtender }) {
  const api = apiProp || BASE
  const [fila,    setFila]    = useState([])
  const [loading, setLoading] = useState(true)
  const [tick,    setTick]    = useState(0)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/dashboard/fila`)
      if (r.ok) {
        const d = await r.json()
        setFila(d.fila || [])
      }
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(() => {
    carregar()
    const i = setInterval(() => { carregar(); setTick(t=>t+1) }, 10000)
    return () => clearInterval(i)
  }, [carregar])

  const urgentes = fila.filter(f => (f.minutos_espera||0) >= 10)
  const normais  = fila.filter(f => (f.minutos_espera||0) < 10)

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background:'var(--bg)' }}>
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-bold" style={{ color:'var(--label)' }}>Fila de Atendimento</h2>
            <p className="text-[13px] mt-0.5" style={{ color:'var(--label-3)' }}>
              {fila.length} aguardando · atualiza a cada 10s
            </p>
          </div>
          <button onClick={carregar} className="p-2 rounded-[9px]" style={{ background:'var(--fill)' }}>
            <RefreshCw size={14} style={{ color:'var(--label-3)' }} className={loading?'animate-spin':''} />
          </button>
        </div>

        {urgentes.length > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-[10px] text-[12px]"
            style={{ background:'rgba(226,75,74,0.08)', border:'1px solid rgba(226,75,74,0.2)', color:'var(--red)' }}>
            <AlertCircle size={14} />
            {urgentes.length} cliente(s) aguardando há mais de 10 minutos!
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && (
          <div className="flex justify-center py-10" style={{ color:'var(--label-3)' }}>
            <RefreshCw size={16} className="animate-spin" />
          </div>
        )}

        {!loading && fila.length === 0 && (
          <div className="flex flex-col items-center py-16">
            <CheckCircle size={32} className="mb-3 opacity-20" style={{ color:'var(--accent)' }} />
            <p className="text-[15px] font-medium" style={{ color:'var(--label-2)' }}>Fila vazia!</p>
            <p className="text-[13px] mt-1" style={{ color:'var(--label-3)' }}>Todos os clientes foram atendidos</p>
          </div>
        )}

        {[...urgentes, ...normais].map((item, i) => {
          const min = item.minutos_espera || 0
          const cor = corEspera(min)
          const iniciais = (item.nome || item.telefone || '??').slice(0,2).toUpperCase()
          return (
            <div key={item.telefone} className="card p-4 flex items-start gap-4"
              style={{ background:'var(--bg-2)', borderLeft:`3px solid ${cor}` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] flex-shrink-0"
                style={{ background:`${cor}15`, color:cor }}>
                {iniciais}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[14px] font-semibold" style={{ color:'var(--label)' }}>
                    {item.nome || 'Cliente'}
                  </span>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold" style={{ color:cor }}>
                    <Clock size={12} />
                    {formatarEspera(min)}
                  </div>
                </div>
                <p className="text-[12px] mb-3 truncate" style={{ color:'var(--label-3)' }}>
                  {item.ultima_mensagem_cliente || 'Sem mensagem'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono" style={{ color:'var(--label-4)' }}>
                    {item.telefone}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background:'rgba(74,159,255,0.1)', color:'var(--blue)' }}>
                    {item.msgs_cliente} msg(s)
                  </span>
                </div>
              </div>
              <button
                onClick={() => onAtender?.(item)}
                className="px-4 py-2 rounded-[10px] text-[13px] font-semibold flex-shrink-0"
                style={{ background:'var(--accent)', color:'#000' }}>
                Atender
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
