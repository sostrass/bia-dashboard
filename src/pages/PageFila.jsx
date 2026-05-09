import { useState, useEffect, useRef } from 'react'
import { Clock, Users, Zap, CheckCircle, RefreshCw, ArrowUp } from 'lucide-react'

const PRIORIDADE_CFG = {
  1: { label: 'Urgente', color: 'var(--red)',    bg: 'var(--red-dim)'  },
  2: { label: 'Alta',    color: 'var(--orange)', bg: 'rgba(255,159,10,0.12)' },
  3: { label: 'Normal',  color: 'var(--blue)',   bg: 'var(--blue-dim)' },
  4: { label: 'Baixa',   color: 'var(--label-3)', bg: 'var(--fill)'   },
}

function Contador({ criadoEm }) {
  const [seg, setSeg] = useState(0)
  useEffect(() => {
    const calc = () => setSeg(Math.floor((Date.now() - new Date(criadoEm).getTime()) / 1000))
    calc()
    const i = setInterval(calc, 1000)
    return () => clearInterval(i)
  }, [criadoEm])

  const cor = seg < 120 ? 'var(--accent)' : seg < 300 ? 'var(--orange)' : 'var(--red)'
  const fmt = seg < 60 ? `${seg}s` : seg < 3600 ? `${Math.floor(seg/60)}m${seg%60}s` : `${Math.floor(seg/3600)}h${Math.floor((seg%3600)/60)}m`

  return (
    <span className="flex items-center gap-1 font-mono font-bold text-[13px]" style={{ color: cor }}>
      <Clock size={12} style={{ color: cor }} />
      {fmt}
    </span>
  )
}

// Dados demo
const DEMO_FILA = [
  { id:1, telefone:'11 9xxxx-0092', tipo:'devolucao', prioridade:1, nome_contato:'Ricardo P.', dados:{motivo:'Pedido defeituoso'}, status:'aguardando', criado_em: new Date(Date.now()-480000).toISOString(), tags:['devolucao:historico'] },
  { id:2, telefone:'11 9xxxx-2255', tipo:'handoff',   prioridade:1, nome_contato:'Carla R.',  dados:{motivo:'Solicitou humano'},  status:'aguardando', criado_em: new Date(Date.now()-230000).toISOString(), tags:['vip','comprador:frequente'] },
  { id:3, telefone:'31 9xxxx-7744', tipo:'pedido',    prioridade:2, nome_contato:'Ana S.',    dados:{},                           status:'aguardando', criado_em: new Date(Date.now()-95000).toISOString(),  tags:['interesse:bijuterias'] },
  { id:4, telefone:'21 9xxxx-3310', tipo:'duvida',    prioridade:3, nome_contato:'João C.',   dados:{},                           status:'aguardando', criado_em: new Date(Date.now()-45000).toISOString(),  tags:[] },
  { id:5, telefone:'85 9xxxx-5512', tipo:'duvida',    prioridade:3, nome_contato:'Lucia M.',  dados:{},                           status:'aguardando', criado_em: new Date(Date.now()-12000).toISOString(),  tags:['vip'] },
]

export default function PageFila({ api }) {
  const [fila,    setFila]    = useState(DEMO_FILA)
  const [stats,   setStats]   = useState({ aguardando: 5, em_atendimento: 1, concluidos_hoje: 23, tempo_medio_min: 1.6 })
  const [loading, setLoading] = useState(false)
  const [tab,     setTab]     = useState('aguardando')

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${api}/api/fase5/fila?status=${tab}`)
        if (r.ok) {
          const d = await r.json()
          if (d.fila?.length) setFila(d.fila)
          if (d.stats) setStats(d.stats)
        }
      } catch {}
    }
    load()
    const i = setInterval(load, 5000)
    return () => clearInterval(i)
  }, [tab, api])

  const atender = async (item) => {
    try {
      await fetch(`${api}/api/fase5/fila/${item.telefone}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'em_atendimento' })
      })
      setFila(prev => prev.filter(x => x.telefone !== item.telefone))
    } catch {}
  }

  const urgentes = fila.filter(f => f.prioridade <= 1)
  const outros   = fila.filter(f => f.prioridade > 1)

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5" style={{ background: 'var(--bg)' }}>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--label)' }}>Fila de Atendimento</h2>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-3)' }}>Organizada por prioridade e tempo de espera</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
          style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
          Atualiza automaticamente
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { v: parseInt(stats.aguardando||0),       l: 'Na fila',          c: 'var(--orange)', icon: Users },
          { v: parseInt(stats.em_atendimento||0),   l: 'Em atendimento',   c: 'var(--blue)',   icon: Zap },
          { v: parseInt(stats.concluidos_hoje||0),  l: 'Concluídos hoje',  c: 'var(--accent)', icon: CheckCircle },
          { v: `${parseFloat(stats.tempo_medio_min||0).toFixed(1)}min`, l:'Tempo médio', c:'var(--purple)', icon: Clock },
        ].map((k, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-[8px]" style={{ background: `${k.c}15` }}>
                <k.icon size={14} style={{ color: k.c }} />
              </div>
            </div>
            <div className="text-[28px] font-bold tracking-tight" style={{ color: k.c }}>{k.v}</div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--label-3)' }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-0.5 rounded-[10px] w-fit" style={{ background: 'var(--fill)' }}>
        {[['aguardando','Aguardando'],['em_atendimento','Em Atendimento'],['concluido','Concluídos']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className="px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-all"
            style={{ background: tab===v?'var(--bg-2)':'transparent', color: tab===v?'var(--label)':'var(--label-3)' }}>
            {l}
            {v==='aguardando' && fila.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: urgentes.length>0?'var(--red)':'var(--accent)', color:'#000' }}>
                {fila.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Urgentes */}
      {tab === 'aguardando' && urgentes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowUp size={14} style={{ color: 'var(--red)' }} />
            <span className="text-[12px] font-semibold" style={{ color: 'var(--red)' }}>
              Aguardando mais de 5 minutos
            </span>
          </div>
          <div className="space-y-2">
            {urgentes.map(item => <FilaItem key={item.id} item={item} onAtender={atender} />)}
          </div>
        </div>
      )}

      {/* Normal */}
      {tab === 'aguardando' && outros.length > 0 && (
        <div>
          {urgentes.length > 0 && (
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--label-3)' }}>
              Demais atendimentos
            </div>
          )}
          <div className="space-y-2">
            {outros.map(item => <FilaItem key={item.id} item={item} onAtender={atender} />)}
          </div>
        </div>
      )}

      {fila.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--label-3)' }}>
          <CheckCircle size={36} className="mb-3 opacity-30" style={{ color: 'var(--accent)' }} />
          <p className="text-[14px] font-medium" style={{ color: 'var(--label-2)' }}>
            {tab === 'aguardando' ? 'Nenhum cliente aguardando' : 'Nenhum registro'}
          </p>
          <p className="text-[12px] mt-1">
            {tab === 'aguardando' ? 'A IA está resolvendo tudo! 🤖' : ''}
          </p>
        </div>
      )}
    </div>
  )
}

function FilaItem({ item, onAtender }) {
  const pc = PRIORIDADE_CFG[item.prioridade] || PRIORIDADE_CFG[3]
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[12px] flex-shrink-0"
        style={{ background: pc.bg, color: pc.color }}>
        {(item.nome_contato||'CL').slice(0,2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[14px] font-semibold" style={{ color: 'var(--label)' }}>
            {item.nome_contato || 'Cliente'}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: pc.bg, color: pc.color }}>
            {pc.label}
          </span>
          {(item.tags||[]).includes('vip') && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,214,10,0.12)', color: 'var(--yellow)' }}>
              ⭐ VIP
            </span>
          )}
        </div>
        <div className="text-[11px] font-mono" style={{ color: 'var(--label-3)' }}>{item.telefone}</div>
        {item.dados?.motivo && (
          <div className="text-[11px] mt-1" style={{ color: 'var(--label-2)' }}>{item.dados.motivo}</div>
        )}
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <Contador criadoEm={item.criado_em} />
        <button onClick={() => onAtender(item)}
          className="px-3 py-2 rounded-[10px] text-[12px] font-semibold transition-all hover:opacity-90"
          style={{ background: 'var(--blue)', color: '#fff' }}>
          Atender
        </button>
      </div>
    </div>
  )
}
