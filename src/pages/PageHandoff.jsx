import { useState, useEffect } from 'react'
import { ArrowRight, Clock, User, CheckCircle } from 'lucide-react'

export default function PageHandoff({ api }) {
  const [fila, setFila] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${api}/api/handoff/fila`)
      .then(r => r.json())
      .then(d => setFila(d.fila || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [api])

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      <div>
        <h2 className="text-[22px] font-bold tracking-tight" style={{color:'var(--label)'}}>Handoff — Transferência Humana</h2>
        <p className="text-[13px] mt-1" style={{color:'var(--label-3)'}}>Conversas aguardando atendimento humano</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20" style={{color:'var(--label-3)'}}>Carregando...</div>
      ) : fila.length === 0 ? (
        <div className="card flex flex-col items-center py-16">
          <CheckCircle size={40} className="mb-4 opacity-20" style={{color:'var(--label)'}}/>
          <p className="text-[15px] font-semibold" style={{color:'var(--label-2)'}}>Nenhuma conversa aguardando</p>
          <p className="text-[12px] mt-1" style={{color:'var(--label-3)'}}>Todas as conversas estão sendo atendidas pela IA</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fila.map((item, i) => (
            <div key={i} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{background:'rgba(255,159,10,0.12)'}}>
                <User size={18} style={{color:'var(--orange)'}}/>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold" style={{color:'var(--label)'}}>{item.telefone || item.nome || 'Cliente'}</p>
                <p className="text-[11px] mt-0.5" style={{color:'var(--label-3)'}}>{item.motivo || 'Aguardando atendimento'}</p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]" style={{color:'var(--label-3)'}}>
                <Clock size={12}/>
                {item.tempo || '—'}
              </div>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-medium"
                style={{background:'var(--accent)',color:'#000'}}>
                <ArrowRight size={13}/> Atender
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
