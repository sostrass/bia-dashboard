// PageContatos.jsx
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Search, Send, Users } from 'lucide-react'

const CAT_C = { Bijuterias: '#7c5cfc', Pérolas: '#b8ff57', 'Linhas/Fios': '#00e5b4', 'Fitas/Rendas': '#ff4d6d', Miçangas: '#ffb547', Atacado: '#38c8ff', Zíperes: '#ff4d6d', Botões: '#7c5cfc' }
const CONTACTS = [
  { tel: '11 9xxxx-4821', nome: 'Maria F.', cats: ['Bijuterias', 'Pérolas'], msgs: 12, ultima: 'Hoje 14:32' },
  { tel: '21 9xxxx-3310', nome: 'João C.', cats: ['Linhas/Fios'], msgs: 5, ultima: 'Hoje 14:18' },
  { tel: '31 9xxxx-7744', nome: 'Ana S.', cats: ['Fitas/Rendas', 'Bijuterias'], msgs: 8, ultima: 'Hoje 14:05' },
  { tel: '85 9xxxx-5512', nome: 'Lucia M.', cats: ['Pérolas', 'Miçangas'], msgs: 22, ultima: 'Hoje 13:22' },
  { tel: '48 9xxxx-8831', nome: 'Pedro T.', cats: ['Zíperes', 'Botões'], msgs: 4, ultima: 'Hoje 13:10' },
  { tel: '11 9xxxx-2255', nome: 'Carla R.', cats: ['Atacado', 'Bijuterias'], msgs: 31, ultima: 'Hoje 12:55' },
  { tel: '41 9xxxx-6634', nome: 'Felipe N.', cats: ['Miçangas'], msgs: 7, ultima: 'Ontem 15:20' },
  { tel: '19 9xxxx-0081', nome: 'Sandra L.', cats: ['Pérolas'], msgs: 18, ultima: 'Ontem 11:45' },
]

export default function PageContatos({ api }) {
  const [filter, setFilter] = useState('Todas')
  const [massaMsg, setMassaMsg] = useState('')
  const [massaCat, setMassaCat] = useState('Todas')
  const allCats = ['Todas', ...Object.keys(CAT_C)]
  const filtered = filter === 'Todas' ? CONTACTS : CONTACTS.filter(c => c.cats.includes(filter))
  const massaCount = (massaCat === 'Todas' ? CONTACTS : CONTACTS.filter(c => c.cats.includes(massaCat))).length

  const dispatch = async () => {
    if (!massaMsg.trim()) { alert('Digite uma mensagem!'); return }
    try {
      const r = await fetch(`${api}/api/contatos/enviar-massa`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categoria: massaCat === 'Todas' ? null : massaCat, mensagem: massaMsg }) })
      const d = await r.json()
      alert(`Disparando para ${d.total} contatos!`)
    } catch { alert('Erro ao disparar.') }
  }

  return (
    <div className="h-full flex overflow-hidden p-6 gap-6">
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-white">Contatos</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} contatos — Categoria: {filter}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ background: 'rgba(184,255,87,0.1)', border: '1px solid rgba(184,255,87,0.2)', color: '#b8ff57' }}>
            <Users size={12} /> {CONTACTS.length} total
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {allCats.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={cn('px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all')}
              style={filter === c ? { background: 'rgba(184,255,87,0.1)', border: '1px solid rgba(184,255,87,0.3)', color: '#b8ff57' } : { background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
              {c}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-border/50 overflow-hidden flex flex-col flex-1" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="overflow-y-auto flex-1">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Categorias</th>
                  <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Msgs</th>
                  <th className="text-left p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Último contato</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={i} className="border-b border-border/20 hover:bg-white/3 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black" style={{ background: CAT_C[c.cats[0]] || '#7c5cfc', color: '#0a0a12' }}>{c.nome.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <div className="text-sm font-semibold text-white">{c.nome}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{c.tel}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {c.cats.map(cat => (
                          <span key={cat} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${CAT_C[cat] || '#fff'}20`, color: CAT_C[cat] || 'rgba(255,255,255,0.5)', border: `1px solid ${CAT_C[cat] || '#fff'}40` }}>{cat}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-semibold text-white">{c.msgs}</td>
                    <td className="p-4 text-[11px] text-muted-foreground">{c.ultima}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Envio em massa */}
      <div className="w-72 flex-shrink-0 space-y-4">
        <div className="rounded-2xl border border-border/50 p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div>
            <h3 className="font-display font-bold text-base text-white">📢 Envio em Massa</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Segmente e dispare mensagens</p>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Categoria alvo</label>
            <select value={massaCat} onChange={e => setMassaCat(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border/50 bg-white/3 text-white text-sm focus:outline-none focus:border-lime-400/50 transition-colors">
              {allCats.map(c => <option key={c} value={c} style={{ background: '#1a1a28', color: '#fff' }}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Mensagem <span className="normal-case text-muted-foreground/60">— use {'{{nome}}'} para personalizar</span></label>
            <textarea value={massaMsg} onChange={e => setMassaMsg(e.target.value)} rows={5}
              className="w-full px-3 py-2 rounded-xl border border-border/50 bg-white/3 text-white text-[12px] leading-relaxed font-mono focus:outline-none focus:border-lime-400/50 transition-colors resize-none"
              placeholder={'Olá {{nome}}! Temos novidades...'}
              onFocus={e => e.target.style.borderColor = 'rgba(184,255,87,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
            />
          </div>
          <div className="rounded-xl p-3 border border-border/50" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-[10px] text-muted-foreground mb-1">Alcance estimado</p>
            <p className="font-display font-black text-3xl" style={{ color: '#b8ff57' }}>{massaCount} <span className="text-base font-semibold text-muted-foreground">contatos</span></p>
          </div>
          <button onClick={dispatch} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90" style={{ background: '#b8ff57', color: '#0a0a12' }}>
            <Send size={14} /> Disparar Mensagem
          </button>
          <p className="text-[10px] text-muted-foreground/50 text-center">Delay 1.5s entre envios — respeita rate limit</p>
        </div>
      </div>
    </div>
  )
}
