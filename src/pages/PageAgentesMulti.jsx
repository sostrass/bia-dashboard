import { useState, useEffect } from 'react'
import { Bot, Users, Zap, ShoppingBag, Wrench, DollarSign,
         RefreshCw, ChevronRight, Activity, Settings } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const ICONES = {
  vendas:     ShoppingBag,
  suporte:    Wrench,
  financeiro: DollarSign,
  geral:      Bot,
}

function AgenteCard({ agente, stats, onConfig }) {
  const Icon = ICONES[agente.id] || Bot
  const s = stats?.find(x => x.id === agente.id)
  return (
    <div className="card p-5" style={{ background:'var(--bg-2)', borderLeft:`3px solid ${agente.cor||'var(--accent)'}` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[10px]" style={{ background:`${agente.cor||'var(--accent)'}15` }}>
            <Icon size={18} style={{ color:agente.cor||'var(--accent)' }}/>
          </div>
          <div>
            <div className="text-[15px] font-bold" style={{ color:'var(--label)' }}>
              {agente.emoji} {agente.nome}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color:'var(--label-3)' }}>
              {agente.descricao}
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-[22px] font-bold" style={{ color:agente.cor||'var(--accent)' }}>
            {s?.total_contatos || 0}
          </div>
          <div className="text-[10px]" style={{ color:'var(--label-4)' }}>contatos</div>
        </div>
      </div>
      {agente.palavrasChave?.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color:'var(--label-4)' }}>
            Gatilhos de roteamento
          </div>
          <div className="flex flex-wrap gap-1.5">
            {agente.palavrasChave.slice(0,8).map((p,i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background:`${agente.cor||'var(--accent)'}10`, color:agente.cor||'var(--accent)', border:`1px solid ${agente.cor||'var(--accent)'}25` }}>
                {p}
              </span>
            ))}
            {agente.palavrasChave.length > 8 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background:'var(--fill)', color:'var(--label-3)' }}>
                +{agente.palavrasChave.length - 8}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ContatoAgente({ contato, agentes, api, onMudar }) {
  const [mudando, setMudando] = useState(false)
  const agAtual = agentes.find(a => a.id === contato.agente_id) || agentes.find(a => a.id === 'geral')

  const mudar = async (novoId) => {
    setMudando(true)
    try {
      await fetch(`${api}/api/agentes/contato/${contato.telefone}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agenteId: novoId })
      })
      onMudar()
    } catch {}
    setMudando(false)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor:'var(--sep)' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
        style={{ background:`${agAtual?.cor||'var(--accent)'}15`, color:agAtual?.cor||'var(--accent)' }}>
        {(contato.nome||contato.telefone).slice(0,2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate" style={{ color:'var(--label)' }}>{contato.nome||'Sem nome'}</div>
        <div className="text-[10px] font-mono" style={{ color:'var(--label-4)' }}>{contato.telefone}</div>
      </div>
      <select value={contato.agente_id||'geral'}
        onChange={e => mudar(e.target.value)}
        disabled={mudando}
        className="text-[11px] px-2 py-1.5 rounded-[8px] outline-none"
        style={{ background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label)', cursor:'pointer' }}>
        {agentes.map(a => (
          <option key={a.id} value={a.id}>{a.emoji} {a.nome}</option>
        ))}
      </select>
    </div>
  )
}

export default function PageAgentesMulti({ api: apiProp }) {
  const api = apiProp || BASE
  const [agentes,   setAgentes]   = useState([])
  const [stats,     setStats]     = useState([])
  const [contatos,  setContatos]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('visao')

  const carregar = async () => {
    try {
      const [ra, rs, rc] = await Promise.all([
        fetch(`${api}/api/agentes`).then(r=>r.ok?r.json():null),
        fetch(`${api}/api/agentes/stats`).then(r=>r.ok?r.json():null),
        fetch(`${api}/api/contatos`).then(r=>r.ok?r.json():null),
      ])
      if (ra) setAgentes(ra.agentes||[])
      if (rs) setStats(rs.stats||[])
      if (rc) {
        // Para cada contato, busca o agente atual
        const contatosComAgente = await Promise.all(
          (rc.contatos||[]).slice(0,30).map(async c => {
            try {
              const r = await fetch(`${api}/api/agentes/contato/${c.telefone}`)
              const d = r.ok ? await r.json() : null
              return { ...c, agente_id: d?.agente?.id || 'geral' }
            } catch { return { ...c, agente_id: 'geral' } }
          })
        )
        setContatos(contatosComAgente)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { carregar() }, [api])

  const totalContatos = stats.reduce((s, a) => s + (a.total_contatos||0), 0)

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5" style={{ background:'var(--bg)' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight" style={{ color:'var(--label)' }}>Múltiplos Agentes IA</h2>
          <p className="text-[13px] mt-0.5" style={{ color:'var(--label-3)' }}>
            Roteamento inteligente por intenção · {totalContatos} contatos distribuídos
          </p>
        </div>
        <button onClick={carregar} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px]"
          style={{ background:'var(--fill)', color:'var(--label-2)', border:'1px solid var(--sep)' }}>
          <RefreshCw size={13} className={loading?'animate-spin':''}/>
          Atualizar
        </button>
      </div>

      {/* Como funciona */}
      <div className="card p-4" style={{ background:'rgba(0,212,170,0.04)', border:'1px solid rgba(0,212,170,0.15)' }}>
        <div className="flex items-start gap-3">
          <Zap size={16} style={{ color:'var(--accent)', flexShrink:0, marginTop:2 }}/>
          <div>
            <div className="text-[13px] font-semibold mb-1" style={{ color:'var(--accent)' }}>Como funciona o roteamento</div>
            <div className="text-[12px] leading-relaxed" style={{ color:'var(--label-3)' }}>
              Quando uma mensagem chega, o sistema analisa as palavras-chave e direciona automaticamente para o agente especializado. 
              Cada agente tem persona e instrução própria. O agente permanece ativo para o cliente até que a conversa mude de assunto.
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-0.5 rounded-[10px] w-fit" style={{ background:'var(--fill)' }}>
        {[['visao','Visão Geral'],['contatos','Contatos']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className="px-5 py-2 rounded-[9px] text-[13px] font-medium transition-all"
            style={{ background:tab===v?'var(--bg-2)':'transparent', color:tab===v?'var(--label)':'var(--label-3)' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Visão geral */}
      {tab === 'visao' && (
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            [0,1,2,3].map(i => (
              <div key={i} className="card p-5 h-32 animate-pulse" style={{ background:'var(--bg-2)' }}>
                <div className="h-4 rounded w-1/2 mb-3" style={{ background:'var(--sep)' }}/>
                <div className="h-8 rounded w-1/3" style={{ background:'var(--sep)' }}/>
              </div>
            ))
          ) : agentes.map(a => (
            <AgenteCard key={a.id} agente={a} stats={stats}/>
          ))}
        </div>
      )}

      {/* Contatos por agente */}
      {tab === 'contatos' && (
        <div className="card overflow-hidden" style={{ background:'var(--bg-2)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor:'var(--sep)' }}>
            <span className="text-[14px] font-semibold" style={{ color:'var(--label)' }}>
              Agente por contato
            </span>
            <span className="text-[12px]" style={{ color:'var(--label-3)' }}>
              Altere o agente de cada cliente manualmente
            </span>
          </div>
          {loading ? (
            <div className="flex justify-center py-8" style={{ color:'var(--label-3)' }}>
              <RefreshCw size={14} className="animate-spin"/>
            </div>
          ) : contatos.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px]" style={{ color:'var(--label-3)' }}>
              Nenhum contato ainda
            </div>
          ) : contatos.map(c => (
            <ContatoAgente key={c.telefone} contato={c} agentes={agentes} api={api} onMudar={carregar}/>
          ))}
        </div>
      )}
    </div>
  )
}
