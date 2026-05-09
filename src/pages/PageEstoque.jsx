// PageEstoque.jsx
import { cn } from '@/lib/utils'
import { Bell, Package } from 'lucide-react'

const ESTOQUE = [
  { id: 'p1', nome: 'Pérola ABS 8mm Branca', clientes: ['11 9xxxx-4821', '85 9xxxx-5512', '11 9xxxx-2255'], cat: 'Pérolas', c: '#b8ff57' },
  { id: 'p2', nome: 'Miçanga de Vidro Azul Transparente', clientes: ['21 9xxxx-3310', '41 9xxxx-6634'], cat: 'Miçangas', c: '#ffb547' },
  { id: 'p3', nome: 'Fio de Nylon 0.5mm Transparente', clientes: ['48 9xxxx-8831'], cat: 'Linhas/Fios', c: '#00e5b4' },
  { id: 'p4', nome: 'Zíper Invisível Nº60 Preto', clientes: ['31 9xxxx-7744', '19 9xxxx-0081', '11 9xxxx-0092'], cat: 'Zíperes', c: '#ff4d6d' },
]

export function PageEstoque({ api }) {
  const total = ESTOQUE.reduce((a, e) => a + e.clientes.length, 0)
  const avise = async (id, nome) => {
    try { await fetch(`${api}/api/estoque/verificar/${id}`, { method: 'POST' }); alert('Avisando clientes de: ' + nome) }
    catch { alert('Erro.') }
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h2 className="font-display font-bold text-xl text-white">Avise-me — Monitor de Estoque</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Clientes aguardando reposição de produtos</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { v: ESTOQUE.length, l: 'Produtos monitorados', c: '#b8ff57' },
          { v: total, l: 'Clientes na fila', c: '#ffb547' },
          { v: 'Ativo 24/7', l: 'Monitor automático via webhook', c: '#00e5b4' },
        ].map((m, i) => (
          <div key={i} className="rounded-2xl border border-border/50 p-5"
            style={{ background: `linear-gradient(135deg, ${m.c}08, rgba(10,12,20,0.9))`, border: `1px solid ${m.c}20` }}>
            <div className="font-display font-black text-3xl tracking-tight" style={{ color: m.c }}>{m.v}</div>
            <div className="text-sm text-white/70 mt-1">{m.l}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/50 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-white">Fila de Aviso</h3>
          <div className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(255,181,71,0.12)', border: '1px solid rgba(255,181,71,0.25)', color: '#ffb547' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ffb547' }} /> Monitorando
          </div>
        </div>
        <div className="divide-y divide-border/30">
          {ESTOQUE.map((e, i) => (
            <div key={i} className="px-6 py-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${e.c}15` }}>
                <Package size={18} style={{ color: e.c }} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-white mb-1">{e.nome}</div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${e.c}15`, color: e.c, border: `1px solid ${e.c}30` }}>{e.cat}</span>
                  <span className="text-[11px] text-muted-foreground">{e.clientes.length} cliente{e.clientes.length > 1 ? 's' : ''} aguardando</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {e.clientes.map(c => (
                    <span key={c} className="text-[10px] px-2 py-1 rounded-lg border border-border/50 text-muted-foreground font-mono" style={{ background: 'rgba(255,255,255,0.03)' }}>{c}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => avise(e.id, e.nome)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/50 text-[11px] font-semibold text-muted-foreground hover:text-white transition-all hover:bg-white/5 flex-shrink-0">
                <Bell size={12} /> Avisar agora
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PageEstoque
