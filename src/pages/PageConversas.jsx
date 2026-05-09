// PageConversas.jsx
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Search, Filter } from 'lucide-react'

const CONVS = [
  { id: 1, name: 'Maria F.', ph: '11 9xxxx-4821', prev: 'Colar com defeito, quero devolver', tipo: 'dev', status: 'ok', hora: '14:32', av: 'MF' },
  { id: 2, name: 'João C.', ph: '21 9xxxx-3310', prev: 'Linha de bordado nº8 em estoque?', tipo: 'duv', status: 'ok', hora: '14:18', av: 'JC' },
  { id: 3, name: 'Ana S.', ph: '31 9xxxx-7744', prev: 'Prazo de entrega para MG?', tipo: 'duv', status: 'live', hora: '14:05', av: 'AS' },
  { id: 4, name: 'Ricardo P.', ph: '11 9xxxx-0092', prev: 'Pedido chegou com defeito', tipo: 'dev', status: 'live', hora: '13:47', av: 'RP' },
  { id: 5, name: 'Lucia M.', ph: '85 9xxxx-5512', prev: '3 metros de renda chantilly', tipo: 'ped', status: 'ok', hora: '13:22', av: 'LM' },
  { id: 6, name: 'Pedro T.', ph: '48 9xxxx-8831', prev: 'Zíper invisível nº60?', tipo: 'duv', status: 'ok', hora: '13:10', av: 'PT' },
  { id: 7, name: 'Carla R.', ph: '11 9xxxx-2255', prev: 'Pedido atacado 50 unidades', tipo: 'ped', status: 'ok', hora: '12:55', av: 'CR' },
]
const CHAT = [
  { r: 'u', t: 'Oi! Colar chegou com defeito, quero devolver', h: '14:18' },
  { r: 'b', t: 'Olá Maria! 😊 Vou resolver agora. Me informa o número do pedido?', h: '14:18', tag: '✦ Gemini AI' },
  { r: 'u', t: 'Pedido #NS-8847', h: '14:19' },
  { r: 'b', t: 'Encontrei! 🔍\n#NS-8847 — Colar Dourado\n12/01/2025 | R$ 89,90\n\nDentro de 7 dias = reembolso ou troca. O que prefere?', h: '14:20', tag: '✦ Nuvemshop + Bling' },
  { r: 'u', t: 'Reembolso completo', h: '14:21' },
  { r: 'b', t: 'AUTORIZAÇÃO DE DEVOLUÇÃO\nNº RMA-2025-4471\nMaria F. | R$ 89,90\nAprovado — 5 dias úteis\n\nEtiqueta enviada por e-mail! 📬', h: '14:32', tag: '✦ RMA gerado' },
  { r: 'u', t: 'Muito rápido! Obrigada! 🙏', h: '14:33' },
]
const AV_C = { MF: '#7c5cfc', JC: '#38c8ff', AS: '#ff4d6d', RP: '#ffb547', LM: '#00e5b4', PT: '#b8ff57', CR: '#ff4d6d' }
const TIPO = { dev: ['Devolução', 'rgba(255,77,109,0.12)', 'rgba(255,77,109,0.3)', '#ff8fa3'], ped: ['Pedido', 'rgba(124,92,252,0.12)', 'rgba(124,92,252,0.3)', '#a480ff'], duv: ['Dúvida', 'rgba(0,229,180,0.1)', 'rgba(0,229,180,0.25)', '#5ef0d0'] }

export default function PageConversas() {
  const [sel, setSel] = useState(CONVS[0])
  const [tab, setTab] = useState('todas')
  const filtered = tab === 'todas' ? CONVS : CONVS.filter(c => c.tipo === { dev: 'dev', ped: 'ped', duv: 'duv' }[tab])

  return (
    <div className="h-full flex overflow-hidden">
      {/* List */}
      <div className="w-72 flex-shrink-0 border-r border-border/50 flex flex-col" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="p-4 border-b border-border/50">
          <h2 className="font-display font-bold text-base text-white mb-3">Conversas</h2>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Buscar cliente..." className="w-full pl-8 pr-3 py-2 rounded-xl border border-border/50 bg-white/3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-lime-400/50 transition-colors" />
          </div>
          <div className="flex gap-1 mt-3">
            {[['todas', 'Todas'], ['dev', 'Devol.'], ['ped', 'Pedidos'], ['duv', 'Dúvidas']].map(([v, l]) => (
              <button key={v} onClick={() => setTab(v)}
                className={cn('flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all', tab === v ? 'text-white' : 'text-muted-foreground hover:text-white')}
                style={tab === v ? { background: 'rgba(184,255,87,0.15)', color: '#b8ff57' } : {}}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.map(c => {
            const [tl, tbg, tbd, tc] = TIPO[c.tipo]
            const isActive = sel?.id === c.id
            return (
              <div key={c.id} onClick={() => setSel(c)}
                className={cn('flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-border/30 transition-all border-l-2', isActive ? '' : 'border-l-transparent hover:bg-white/3')}
                style={isActive ? { background: 'rgba(184,255,87,0.04)', borderLeftColor: '#b8ff57' } : {}}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background: AV_C[c.av], color: '#0a0a12' }}>{c.av}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-semibold text-white truncate">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{c.hora}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">{c.prev}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: tbg, border: `1px solid ${tbd}`, color: tc }}>{tl}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {sel && <>
          <div className="px-5 py-3.5 border-b border-border/50 flex items-center gap-3 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black" style={{ background: AV_C[sel.av], color: '#0a0a12' }}>{sel.av}</div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-white">{sel.name}</div>
              <div className="text-[11px] text-muted-foreground">{sel.ph}</div>
            </div>
            {(() => { const [tl, tbg, tbd, tc] = TIPO[sel.tipo]; return <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: tbg, border: `1px solid ${tbd}`, color: tc }}>{tl}</span> })()}
            {sel.status === 'ok'
              ? <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(184,255,87,0.12)', border: '1px solid rgba(184,255,87,0.25)', color: '#b8ff57' }}>✓ Resolvido</span>
              : <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: 'rgba(255,181,71,0.12)', border: '1px solid rgba(255,181,71,0.25)', color: '#ffb547' }}><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ffb547' }} />Ao vivo</span>
            }
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {CHAT.map((m, i) => (
              <div key={i} className={cn('flex', m.r === 'b' ? 'justify-start' : 'justify-end')}>
                <div className="max-w-[75%]">
                  {m.tag && <div className="text-[9px] font-bold mb-1 ml-1" style={{ color: '#7c5cfc', fontFamily: 'JetBrains Mono, monospace' }}>{m.tag}</div>}
                  <div className={cn('px-4 py-2.5 rounded-2xl text-[12px] leading-relaxed whitespace-pre-line', m.r === 'b' ? 'rounded-tl-sm' : 'rounded-tr-sm text-white')}
                    style={m.r === 'b' ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' } : { background: 'linear-gradient(135deg, #7c5cfc, #5b3fd4)' }}>
                    {m.t}
                  </div>
                  <div className={cn('text-[10px] text-muted-foreground/50 mt-1', m.r === 'b' ? 'ml-1' : 'text-right mr-1')}>{m.h}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border/50 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.01)' }}>
            <div className="px-4 py-2.5 rounded-xl border border-border/50 text-[12px] text-muted-foreground/50" style={{ background: 'rgba(255,255,255,0.02)' }}>🤖 Atendimento gerenciado pela IA — nenhuma ação necessária</div>
          </div>
        </>}
      </div>
    </div>
  )
}
