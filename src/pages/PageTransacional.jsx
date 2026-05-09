// PageTransacional.jsx
import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Save, RotateCcw, Send } from 'lucide-react'

const TEMPLATES = [
  { key: 'pedido_criado', label: 'Pedido Criado', icon: '🛍️', event: 'order/created' },
  { key: 'pagamento_pendente', label: 'Pagamento Pendente', icon: '⏳', event: 'order/pending' },
  { key: 'pagamento_confirmado', label: 'Pagamento Confirmado', icon: '✅', event: 'order/paid' },
  { key: 'pedido_cancelado', label: 'Pedido Cancelado', icon: '❌', event: 'order/cancelled' },
  { key: 'pedido_embalado', label: 'Pedido Embalado', icon: '📦', event: 'order/packed' },
  { key: 'pedido_pronto_envio', label: 'Pronto para Envio', icon: '🏭', event: 'order/fulfilled' },
  { key: 'pedido_enviado', label: 'Pedido Enviado', icon: '🚚', event: 'fulfillment/dispatched' },
  { key: 'movimentacao', label: 'Movimentação', icon: '📍', event: 'fulfillment/tracking' },
  { key: 'pedido_entregue', label: 'Pedido Entregue', icon: '🎉', event: 'fulfillment/delivered' },
  { key: 'avaliar_pedido', label: 'Avaliar Pedido', icon: '⭐', event: 'auto/24h_after_delivery' },
  { key: 'avise_disponivel', label: 'Avise-me Disponível', icon: '🔔', event: 'product/updated' },
]

const DEF = {
  pedido_criado: 'Olá, {{nome}}! 🛍️\n\nSeu pedido *#{{numero_pedido}}* foi confirmado!\n\n📦 Itens: {{produtos}}\n💰 Total: {{total}}\n\nPague em: {{link_pagamento}}',
  pagamento_pendente: 'Olá {{nome}}! ⏳\n\nSeu pedido *#{{numero_pedido}}* aguarda pagamento.\n\n💰 Valor: {{total}}\n🔗 {{link_pagamento}}',
  pagamento_confirmado: '✅ Pagamento confirmado!\n\nObrigado {{nome}}! Seu pedido *#{{numero_pedido}}* de {{total}} foi pago.\n\n🚀 Estamos preparando para envio!',
  pedido_cancelado: '❌ Olá {{nome}}, seu pedido *#{{numero_pedido}}* foi cancelado.\n\nMotivo: {{motivo}}\n\nQualquer dúvida é só chamar!',
  pedido_embalado: '📦 Boas notícias {{nome}}!\n\nSeu pedido *#{{numero_pedido}}* foi embalado e aguarda a transportadora.\n\nEm breve você recebe o código de rastreio!',
  pedido_pronto_envio: '🏭 {{nome}}, seu pedido *#{{numero_pedido}}* está pronto!\n\nTransportadora: {{transportadora}}\nAguardando coleta — te aviso quando sair! 📦',
  pedido_enviado: '🚚 Saiu para entrega {{nome}}!\n\nPedido *#{{numero_pedido}}* a caminho!\n\n📮 Rastreio: *{{rastreio}}*\n🔗 {{url_rastreio}}\n\nPrazo: {{prazo}} dias úteis',
  movimentacao: '📍 Atualização do pedido *#{{numero_pedido}}*\n\n{{nome}}, há novidades:\n\n🔄 {{status}}\n📍 {{descricao_status}}\n\n🔗 {{url_rastreio}}',
  pedido_entregue: '🎉 Entregue {{nome}}!\n\nSeu pedido *#{{numero_pedido}}* chegou!\n\nEsperamos que você adore seus produtos. 💛',
  avaliar_pedido: '⭐ Como foi, {{nome}}?\n\nRecebeu o pedido *#{{numero_pedido}}*?\n\nNos conte sua experiência! Responda com nota de 1 a 5 ⭐',
  avise_disponivel: '🔔 {{nome}}, boa notícia!\n\n*{{produto_nome}}* voltou ao estoque!\n\n{{link_produto}}\n\nCorra antes que esgote! 😊',
}

const ALIASES = ['{{nome}}', '{{numero_pedido}}', '{{total}}', '{{produtos}}', '{{rastreio}}', '{{url_rastreio}}', '{{transportadora}}', '{{prazo}}', '{{link_pagamento}}', '{{motivo}}', '{{produto_nome}}', '{{descricao_status}}', '{{status}}', '{{loja_nome}}', '{{link_produto}}']

function preview(txt) {
  return (txt || '').replace(/\{\{nome\}\}/g, 'Maria F.').replace(/\{\{numero_pedido\}\}/g, '#NS-8847').replace(/\{\{total\}\}/g, 'R$ 89,90').replace(/\{\{produtos\}\}/g, '2x Renda Chantilly').replace(/\{\{rastreio\}\}/g, 'BR123456789BR').replace(/\{\{prazo\}\}/g, '5 a 10').replace(/\{\{produto_nome\}\}/g, 'Pérola ABS 8mm').replace(/\{\{link_pagamento\}\}/g, 'loja.com/pagar/123').replace(/\{\{link_produto\}\}/g, 'loja.com/produto/123').replace(/\{\{motivo\}\}/g, 'Defeito').replace(/\{\{transportadora\}\}/g, 'Correios').replace(/\{\{status\}\}/g, 'Em trânsito').replace(/\{\{descricao_status\}\}/g, 'Pacote saiu de SP').replace(/\{\{url_rastreio\}\}/g, 'correios.com.br/rastreio').replace(/\{\{loja_nome\}\}/g, 'Armarinhos & Bijuterias')
}

export default function PageTransacional({ api }) {
  const [active, setActive] = useState(0)
  const [texts, setTexts] = useState({ ...DEF })
  const tpl = TEMPLATES[active]
  const cur = texts[tpl?.key] || ''
  const setCur = v => setTexts(t => ({ ...t, [tpl.key]: v }))
  const taRef = useRef(null)
  const ins = a => {
    const ta = taRef.current
    if (!ta) { setCur(cur + a); return }
    const s = ta.selectionStart, e = ta.selectionEnd
    setCur(cur.slice(0, s) + a + cur.slice(e))
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + a.length; ta.focus() }, 0)
  }
  const save = async () => {
    try { await fetch(`${api}/api/transacional/templates/${tpl.key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto: cur }) }); alert('Template salvo!') }
    catch { alert('Erro ao salvar.') }
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* List */}
      <div className="w-56 flex-shrink-0 border-r border-border/50 flex flex-col" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="p-4 border-b border-border/50">
          <h2 className="font-display font-bold text-base text-white">Transacionais</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">11 eventos Nuvemshop</p>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {TEMPLATES.map((t, i) => (
            <button key={t.key} onClick={() => setActive(i)}
              className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-all mb-0.5 border', i === active ? '' : 'border-transparent hover:bg-white/5 text-muted-foreground hover:text-white')}
              style={i === active ? { background: 'rgba(184,255,87,0.08)', border: '1px solid rgba(184,255,87,0.2)', color: '#b8ff57' } : {}}>
              <span className="text-base">{t.icon}</span>
              <span className="font-medium text-[12px]">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{tpl?.icon}</span>
              <div>
                <h2 className="font-display font-bold text-lg text-white">{tpl?.label}</h2>
                <p className="text-[11px] text-muted-foreground font-mono">{tpl?.event}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCur(DEF[tpl?.key] || '')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/50 text-[12px] font-semibold text-muted-foreground hover:text-white transition-all hover:bg-white/5">
                <RotateCcw size={12} /> Restaurar
              </button>
              <button onClick={save}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:opacity-90"
                style={{ background: '#b8ff57', color: '#0a0a12' }}>
                <Save size={12} /> Salvar
              </button>
            </div>
          </div>

          {/* Aliases */}
          <div className="rounded-2xl border border-border/50 p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Clique para inserir alias no template</p>
            <div className="flex flex-wrap gap-2">
              {ALIASES.map(a => (
                <button key={a} onClick={() => ins(a)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono border border-border/50 text-muted-foreground hover:text-white transition-all hover:border-lime-400/30 hover:bg-lime-400/5"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Template</label>
              <textarea ref={taRef} value={cur} onChange={e => setCur(e.target.value)} rows={14}
                className="w-full px-4 py-3 rounded-2xl border border-border/50 bg-white/3 text-white text-[12px] leading-relaxed font-mono focus:outline-none focus:border-lime-400/50 transition-colors resize-none"
                onFocus={e => e.target.style.borderColor = 'rgba(184,255,87,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Preview — dados reais</label>
              <div className="rounded-2xl border border-border/50 p-4 min-h-[280px]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="inline-block max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-sm text-[12px] leading-relaxed whitespace-pre-line"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}>
                  {preview(cur)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
