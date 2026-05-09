// ─── PageTransacional.jsx ─────────────────────────────────────────────────────
import { useState, useRef } from 'react'
import { RotateCcw, Save } from 'lucide-react'
export function PageTransacional({ api }) {
  const TPLS = [
    {key:'pedido_criado',label:'Pedido Criado',icon:'🛍️',event:'order/created'},
    {key:'pagamento_pendente',label:'Pagamento Pendente',icon:'⏳',event:'order/pending'},
    {key:'pagamento_confirmado',label:'Pagamento Confirmado',icon:'✅',event:'order/paid'},
    {key:'pedido_cancelado',label:'Pedido Cancelado',icon:'❌',event:'order/cancelled'},
    {key:'pedido_embalado',label:'Pedido Embalado',icon:'📦',event:'order/packed'},
    {key:'pedido_pronto_envio',label:'Pronto para Envio',icon:'🏭',event:'order/fulfilled'},
    {key:'pedido_enviado',label:'Pedido Enviado',icon:'🚚',event:'fulfillment/dispatched'},
    {key:'movimentacao',label:'Movimentação',icon:'📍',event:'fulfillment/tracking'},
    {key:'pedido_entregue',label:'Pedido Entregue',icon:'🎉',event:'fulfillment/delivered'},
    {key:'avaliar_pedido',label:'Avaliar Pedido',icon:'⭐',event:'auto/24h'},
    {key:'avise_disponivel',label:'Avise-me Disponível',icon:'🔔',event:'product/updated'},
  ]
  const DEF = {
    pedido_criado:'Olá, {{nome}}! 🛍️\nSeu pedido *#{{numero_pedido}}* foi confirmado!\n\n📦 {{produtos}}\n💰 {{total}}\n\nPague em: {{link_pagamento}}',
    pagamento_pendente:'Olá {{nome}}! ⏳\nPedido *#{{numero_pedido}}* aguarda pagamento.\n💰 {{total}}\n{{link_pagamento}}',
    pagamento_confirmado:'✅ Pagamento confirmado!\n{{nome}}, pedido *#{{numero_pedido}}* pago. Preparando para envio!',
    pedido_cancelado:'❌ Pedido *#{{numero_pedido}}* cancelado, {{nome}}.\nMotivo: {{motivo}}',
    pedido_embalado:'📦 {{nome}}, pedido *#{{numero_pedido}}* embalado! Em breve o rastreio.',
    pedido_pronto_envio:'🏭 Pedido *#{{numero_pedido}}* pronto! Transportadora: {{transportadora}}',
    pedido_enviado:'🚚 Saiu, {{nome}}!\nPedido *#{{numero_pedido}}*\n📮 Rastreio: *{{rastreio}}*\n🔗 {{url_rastreio}}\nPrazo: {{prazo}} dias úteis',
    movimentacao:'📍 Pedido *#{{numero_pedido}}* atualizado:\n{{status}} — {{descricao_status}}\n{{url_rastreio}}',
    pedido_entregue:'🎉 Entregue, {{nome}}! Pedido *#{{numero_pedido}}* chegou!',
    avaliar_pedido:'⭐ {{nome}}, como foi o pedido *#{{numero_pedido}}*?\nResponda com nota de 1 a 5!',
    avise_disponivel:'🔔 {{nome}}, *{{produto_nome}}* voltou ao estoque!\n{{link_produto}}',
  }
  const ALIASES = ['{{nome}}','{{numero_pedido}}','{{total}}','{{produtos}}','{{rastreio}}','{{url_rastreio}}','{{transportadora}}','{{prazo}}','{{link_pagamento}}','{{motivo}}','{{produto_nome}}','{{descricao_status}}','{{status}}','{{link_produto}}']
  const prev = t => t.replace(/\{\{nome\}\}/g,'Maria F.').replace(/\{\{numero_pedido\}\}/g,'#NS-8847').replace(/\{\{total\}\}/g,'R$ 89,90').replace(/\{\{produtos\}\}/g,'2x Renda Chantilly').replace(/\{\{rastreio\}\}/g,'BR123456789BR').replace(/\{\{prazo\}\}/g,'5 a 10').replace(/\{\{produto_nome\}\}/g,'Pérola ABS 8mm').replace(/\{\{link_pagamento\}\}/g,'loja.com/pagar/123').replace(/\{\{link_produto\}\}/g,'loja.com/produto/123').replace(/\{\{motivo\}\}/g,'Defeito').replace(/\{\{transportadora\}\}/g,'Correios').replace(/\{\{status\}\}/g,'Em trânsito').replace(/\{\{descricao_status\}\}/g,'Saiu de SP').replace(/\{\{url_rastreio\}\}/g,'correios.com.br')

  const [active,setActive] = useState(0)
  const [texts,setTexts]   = useState({...DEF})
  const taRef = useRef(null)
  const tpl = TPLS[active]
  const cur = texts[tpl?.key]||''
  const setCur = v => setTexts(t=>({...t,[tpl.key]:v}))
  const ins = a => {
    const ta=taRef.current; if(!ta){setCur(cur+a);return}
    const s=ta.selectionStart,e=ta.selectionEnd
    setCur(cur.slice(0,s)+a+cur.slice(e))
    setTimeout(()=>{ta.selectionStart=ta.selectionEnd=s+a.length;ta.focus()},0)
  }
  const save = async () => {
    try { await fetch(`${api}/api/transacional/templates/${tpl.key}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({texto:cur})}); alert('Salvo!') }
    catch { alert('Erro.') }
  }
  const inputStyle = { background:'var(--bg-3)', borderColor:'var(--sep)', color:'var(--label)' }
  return (
    <div className="h-full flex overflow-hidden">
      {/* list */}
      <div className="w-[210px] flex-shrink-0 overflow-y-auto scroll-hidden py-2" style={{background:'var(--bg-2)',borderRight:'1px solid var(--sep)'}}>
        <div className="px-4 py-3 text-[17px] font-semibold" style={{color:'var(--label)',borderBottom:'1px solid var(--sep)'}}>Transacionais</div>
        {TPLS.map((t,i)=>(
          <button key={t.key} onClick={()=>setActive(i)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left border-b transition-all" style={{background:i===active?'var(--accent-dim)':'transparent',borderColor:'var(--sep)',borderLeft:`3px solid ${i===active?'var(--accent)':'transparent'}`}}>
            <span className="text-base">{t.icon}</span>
            <div><div className="text-[12px] font-medium" style={{color:i===active?'var(--accent)':'var(--label)'}}>{t.label}</div><div className="text-[10px] font-mono" style={{color:'var(--label-3)'}}>{t.event}</div></div>
          </button>
        ))}
      </div>
      {/* editor */}
      <div className="flex-1 overflow-y-auto scroll-hidden p-5">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{tpl?.icon}</span>
              <div>
                <h2 className="text-[20px] font-semibold" style={{color:'var(--label)'}}>{tpl?.label}</h2>
                <p className="text-[11px] font-mono" style={{color:'var(--label-3)'}}>{tpl?.event}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setCur(DEF[tpl?.key]||'')} className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-medium border transition-all" style={{background:'var(--fill)',borderColor:'var(--sep)',color:'var(--label-2)'}}>
                <RotateCcw size={12}/> Restaurar
              </button>
              <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[12px] font-semibold transition-all" style={{background:'var(--accent)',color:'#000'}}>
                <Save size={12}/> Salvar
              </button>
            </div>
          </div>
          {/* aliases */}
          <div className="card p-4">
            <p className="text-[11px] font-medium mb-2.5" style={{color:'var(--label-3)'}}>Clique para inserir no template →</p>
            <div className="flex flex-wrap gap-2">
              {ALIASES.map(a=>(
                <button key={a} onClick={()=>ins(a)} className="px-2.5 py-1 rounded-[8px] text-[11px] font-mono border transition-all hover:border-[color:var(--accent)]" style={{background:'var(--fill)',borderColor:'var(--sep)',color:'var(--label-2)'}}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium block mb-2" style={{color:'var(--label-3)'}}>TEMPLATE</label>
              <textarea ref={taRef} value={cur} onChange={e=>setCur(e.target.value)} rows={14}
                className="w-full px-4 py-3 rounded-[12px] text-[12px] leading-relaxed font-mono resize-none outline-none border transition-colors"
                style={inputStyle}
                onFocus={e=>e.target.style.borderColor='var(--accent)'}
                onBlur={e=>e.target.style.borderColor='var(--sep)'}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium block mb-2" style={{color:'var(--label-3)'}}>PREVIEW (dados reais)</label>
              <div className="rounded-[12px] p-4 min-h-[280px]" style={{background:'var(--bg-3)',border:'1px solid var(--sep)'}}>
                <div className="inline-block px-3.5 py-2.5 rounded-[18px] rounded-tl-[4px] text-[12px] leading-relaxed whitespace-pre-line max-w-[90%]"
                  style={{background:'var(--bg-4)',color:'var(--label)',border:'1px solid var(--sep)'}}>
                  {prev(cur)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default PageTransacional
