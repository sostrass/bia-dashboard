import { useState, useEffect } from 'react'
import { Brain, Plus, RefreshCw } from 'lucide-react'

// Página legada — conteúdo gerenciado via PageAgentesMulti
export default function PageAgentes({ api }) {
  const [agentes, setAgentes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${api}/api/agentes`)
      .then(r => r.ok ? r.json() : { agentes: [] })
      .then(d => setAgentes(d.agentes || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [api])

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-bold tracking-tight" style={{color:'var(--label)'}}>Agentes</h2>
      </div>
      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw size={16} className="animate-spin" style={{color:'var(--label-3)'}}/>
        </div>
      ) : agentes.length === 0 ? (
        <div className="card flex flex-col items-center py-16">
          <Brain size={40} className="mb-4 opacity-15" style={{color:'var(--label)'}}/>
          <p className="text-[14px] font-semibold mb-1" style={{color:'var(--label-2)'}}>Nenhum agente configurado</p>
          <p className="text-[12px]" style={{color:'var(--label-3)'}}>Configure agentes na aba Multi-Agentes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agentes.map(ag => (
            <div key={ag.id} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                style={{background: ag.cor ? ag.cor + '22' : 'var(--fill)'}}>
                <span className="text-[18px]">{ag.emoji || '🤖'}</span>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold" style={{color:'var(--label)'}}>{ag.nome}</p>
                <p className="text-[11px] mt-0.5" style={{color:'var(--label-3)'}}>{ag.descricao || 'Agente de atendimento'}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${ag.ativo ? 'animate-pulse' : ''}`}
                  style={{background: ag.ativo ? '#22c55e' : 'var(--label-4)'}}/>
                <span className="text-[11px]" style={{color:'var(--label-3)'}}>
                  {ag.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
