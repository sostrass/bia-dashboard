import { useState, useRef, useEffect } from 'react'
import { RotateCcw, Save, Plus, Trash2, Eye, EyeOff, ChevronRight } from 'lucide-react'

// Templates simples (texto livre)
const TPLS_SIMPLES = [
  { key:'pedido_criado',        label:'Pedido Criado',         icon:'🛍️', event:'order/created'  },
  { key:'pagamento_pendente',   label:'Pagamento Pendente',    icon:'⏳', event:'order/pending'  },
  { key:'pagamento_confirmado', label:'Pagamento Confirmado',  icon:'✅', event:'order/paid'     },
  { key:'pedido_cancelado',     label:'Pedido Cancelado',      icon:'❌', event:'order/cancelled'},
  { key:'pedido_embalado',      label:'Pedido Embalado',       icon:'📦', event:'order/packed'   },
  { key:'pedido_enviado',       label:'Pedido Enviado',        icon:'🚚', event:'fulfillment'    },
  { key:'pedido_entregue',      label:'Pedido Entregue',       icon:'🎉', event:'delivered'      },
  { key:'avaliar_pedido',       label:'Avaliar Pedido',        icon:'⭐', event:'auto/24h'       },
  { key:'avise_disponivel',     label:'Avise-me Disponível',   icon:'🔔', event:'product/updated'},
]

// Templates Meta estruturados (Cabeçalho + Corpo + Rodapé + Botões)
const TPLS_META = [
  {
    id: 'pedido_confirmado_meta',
    nome: 'Pedido Confirmado',
    status: 'APPROVED',
    categoria: 'TRANSACTIONAL',
    header: { tipo: 'TEXT', valor: 'Pedido Confirmado! 🛍️' },
    body: 'Olá *{{1}}*!\n\nSeu pedido *{{2}}* foi confirmado.\n💰 Valor: *{{3}}*\n\nRealize o pagamento pelo link:',
    footer: 'Armarinhos & Bijuterias',
    botoes: [
      { tipo: 'URL',         label: 'Pagar Agora',       valor: '{{4}}' },
      { tipo: 'QUICK_REPLY', label: 'Falar Conosco',     valor: 'CONTATO' },
    ],
    variaveis: ['nome', 'numero_pedido', 'total', 'link_pagamento'],
  },
  {
    id: 'pedido_enviado_meta',
    nome: 'Pedido Enviado',
    status: 'APPROVED',
    categoria: 'TRANSACTIONAL',
    header: { tipo: 'TEXT', valor: 'Seu pedido saiu! 🚚' },
    body: 'Boa notícia, *{{1}}*!\n\nSeu pedido *{{2}}* foi despachado.\n📮 Rastreio: *{{3}}*\n📅 Prazo: *{{4}}* dias úteis',
    footer: 'Armarinhos & Bijuterias',
    botoes: [
      { tipo: 'URL',         label: 'Rastrear Pedido', valor: '{{5}}' },
    ],
    variaveis: ['nome', 'numero_pedido', 'rastreio', 'prazo', 'url_rastreio'],
  },
  {
    id: 'pedido_entregue_meta',
    nome: 'Pedido Entregue',
    status: 'APPROVED',
    categoria: 'TRANSACTIONAL',
    header: { tipo: 'TEXT', valor: 'Pedido Entregue! 🎉' },
    body: 'Que ótimo, *{{1}}*!\n\nSeu pedido *{{2}}* foi entregue.\nComo foi sua experiência?',
    footer: 'Armarinhos & Bijuterias',
    botoes: [
      { tipo: 'QUICK_REPLY', label: '⭐⭐⭐⭐⭐ Excelente' },
      { tipo: 'QUICK_REPLY', label: '😕 Tive um problema' },
    ],
    variaveis: ['nome', 'numero_pedido'],
  },
  {
    id: 'avise_disponivel_meta',
    nome: 'Produto Disponível',
    status: 'APPROVED',
    categoria: 'MARKETING',
    header: { tipo: 'TEXT', valor: 'Produto Disponível! 🔔' },
    body: 'Olá *{{1}}*!\n\nVocê pediu para ser avisado: *{{2}}* voltou ao estoque!',
    footer: 'Armarinhos & Bijuterias',
    botoes: [
      { tipo: 'URL',         label: 'Comprar Agora',         valor: '{{3}}' },
      { tipo: 'QUICK_REPLY', label: 'Não tenho mais interesse' },
    ],
    variaveis: ['nome', 'produto_nome', 'link_produto'],
  },
]

const DEF_SIMPLES = {
  pedido_criado:        'Olá, {{nome}}! 🛍️\nSeu pedido *#{{numero_pedido}}* foi confirmado!\n\n📦 {{produtos}}\n💰 {{total}}\n\nPague em: {{link_pagamento}}',
  pagamento_pendente:   'Olá {{nome}}! ⏳\nPedido *#{{numero_pedido}}* aguarda pagamento.\n💰 {{total}}\n{{link_pagamento}}',
  pagamento_confirmado: '✅ Pagamento confirmado!\n{{nome}}, pedido *#{{numero_pedido}}* pago. Preparando para envio!',
  pedido_cancelado:     '❌ Pedido *#{{numero_pedido}}* cancelado, {{nome}}.\nMotivo: {{motivo}}',
  pedido_embalado:      '📦 {{nome}}, pedido *#{{numero_pedido}}* embalado! Em breve o rastreio.',
  pedido_enviado:       '🚚 Saiu, {{nome}}!\nPedido *#{{numero_pedido}}*\n📮 Rastreio: *{{rastreio}}*\n🔗 {{url_rastreio}}\nPrazo: {{prazo}} dias úteis',
  pedido_entregue:      '🎉 Entregue, {{nome}}! Pedido *#{{numero_pedido}}* chegou!',
  avaliar_pedido:       '⭐ {{nome}}, como foi o pedido *#{{numero_pedido}}*?\nResponda com nota de 1 a 5!',
  avise_disponivel:     '🔔 {{nome}}, *{{produto_nome}}* voltou ao estoque!\n{{link_produto}}',
}

const ALIASES = ['{{nome}}','{{numero_pedido}}','{{total}}','{{produtos}}','{{rastreio}}','{{url_rastreio}}','{{transportadora}}','{{prazo}}','{{link_pagamento}}','{{motivo}}','{{produto_nome}}','{{descricao_status}}','{{link_produto}}']

function prev(txt) {
  return (txt||'').replace(/\{\{nome\}\}/g,'Maria F.').replace(/\{\{numero_pedido\}\}/g,'#NS-8847').replace(/\{\{total\}\}/g,'R$ 89,90').replace(/\{\{produtos\}\}/g,'2x Renda Chantilly').replace(/\{\{rastreio\}\}/g,'BR123456789BR').replace(/\{\{prazo\}\}/g,'5 a 10').replace(/\{\{produto_nome\}\}/g,'Pérola ABS 8mm').replace(/\{\{link_pagamento\}\}/g,'loja.com/pagar/123').replace(/\{\{link_produto\}\}/g,'loja.com/produto/123').replace(/\{\{motivo\}\}/g,'Defeito').replace(/\{\{transportadora\}\}/g,'Correios').replace(/\{\{descricao_status\}\}/g,'Saiu de SP').replace(/\{\{url_rastreio\}\}/g,'correios.com.br')
}

// ── Preview de template Meta estruturado ────────────────────────────────────
function MetaTemplatePreview({ tpl }) {
  if (!tpl) return null
  const previewBody = tpl.body
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\{\{(\d+)\}\}/g, (_, n) => {
      const demos = { '1':'Maria F.', '2':'#NS-8847', '3':'R$ 89,90', '4':'loja.com/pagar', '5':'correios.com.br' }
      return demos[n] || `[var${n}]`
    })

  return (
    <div className="rounded-[16px] overflow-hidden max-w-[280px]"
      style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', boxShadow:'0 4px 20px rgba(0,0,0,0.15)' }}>
      {/* Device header */}
      <div className="px-3 py-2 flex items-center gap-2"
        style={{ background:'#128C7E', borderBottom:'none' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
          style={{ background:'rgba(255,255,255,0.2)', color:'#fff' }}>B</div>
        <div>
          <div className="text-[12px] font-semibold text-white">Bia — Loja</div>
          <div className="text-[9px] text-green-200">Negócio verificado ✓</div>
        </div>
      </div>
      {/* Bubble */}
      <div className="p-3">
        <div className="rounded-[12px] rounded-tl-[3px] overflow-hidden"
          style={{ background: 'var(--bg-2)', border:'1px solid var(--sep)' }}>
          {/* Header */}
          {tpl.header?.valor && (
            <div className="px-3 py-2 text-[12px] font-bold" style={{ color:'var(--label)', borderBottom:'1px solid var(--sep)' }}>
              {tpl.header.valor}
            </div>
          )}
          {/* Body */}
          <div className="px-3 py-2.5 text-[12px] leading-relaxed whitespace-pre-line" style={{ color:'var(--label)' }}>
            {previewBody}
          </div>
          {/* Footer */}
          {tpl.footer && (
            <div className="px-3 py-1.5 text-[10px]" style={{ color:'var(--label-3)', borderTop:'1px solid var(--sep)' }}>
              {tpl.footer}
            </div>
          )}
          {/* Botões */}
          {tpl.botoes?.length > 0 && (
            <div style={{ borderTop:'1px solid var(--sep)' }}>
              {tpl.botoes.map((b, i) => (
                <div key={i} className="flex items-center justify-center gap-1 py-2.5 text-[12px] font-medium"
                  style={{ color:b.tipo==='URL'?'var(--blue)':'var(--label-2)', borderTop: i>0?'1px solid var(--sep)':'none' }}>
                  {b.tipo==='URL' ? '🔗 ' : '↩ '}
                  {b.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PageTransacional({ api }) {
  const [modo,    setModo]    = useState('simples') // 'simples' | 'meta'
  const [active,  setActive]  = useState(0)
  const [texts,   setTexts]   = useState({...DEF_SIMPLES})
  const [selMeta, setSelMeta] = useState(0)
  const taRef = useRef(null)

  const tpl    = TPLS_SIMPLES[active]
  const cur    = texts[tpl?.key] || ''
  const setCur = v => setTexts(t=>({...t,[tpl.key]:v}))

  const ins = a => {
    const ta=taRef.current; if(!ta){setCur(cur+a);return}
    const s=ta.selectionStart,e=ta.selectionEnd
    setCur(cur.slice(0,s)+a+cur.slice(e))
    setTimeout(()=>{ta.selectionStart=ta.selectionEnd=s+a.length;ta.focus()},0)
  }

  const save = async () => {
    try {
      await fetch(`${api}/api/transacional/templates/${tpl.key}`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ texto: cur })
      })
      alert('Template salvo!')
    } catch { alert('Erro ao salvar.') }
  }

  const inp = { background:'var(--bg-3)', border:'1px solid var(--sep)', borderRadius:10, color:'var(--label)', outline:'none', padding:'9px 12px', fontSize:12, fontFamily:'inherit', transition:'border-color .15s', width:'100%' }
  const focus = e => e.target.style.borderColor = 'var(--accent)'
  const blur  = e => e.target.style.borderColor = 'var(--sep)'

  return (
    <div className="h-full flex overflow-hidden">

      {/* Sidebar */}
      <div className="w-[220px] flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background:'var(--bg-2)', borderRight:'1px solid var(--sep)' }}>

        <div className="px-4 py-4" style={{ borderBottom:'1px solid var(--sep)' }}>
          <div className="text-[17px] font-semibold mb-3" style={{ color:'var(--label)' }}>Transacionais</div>
          {/* Toggle modo */}
          <div className="flex gap-1 p-0.5 rounded-[10px]" style={{ background:'var(--fill)' }}>
            {[['simples','Texto Livre'],['meta','Meta Estruturado']].map(([v,l])=>(
              <button key={v} onClick={()=>setModo(v)}
                className="flex-1 py-1.5 rounded-[8px] text-[10px] font-medium transition-all"
                style={{ background:modo===v?'var(--bg-2)':'transparent', color:modo===v?'var(--label)':'var(--label-3)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 py-1">
          {modo === 'simples' && TPLS_SIMPLES.map((t,i)=>(
            <button key={t.key} onClick={()=>setActive(i)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left border-l-2 transition-all"
              style={{ borderLeftColor:i===active?'var(--accent)':'transparent', background:i===active?'var(--accent-dim)':'transparent' }}>
              <span className="text-base">{t.icon}</span>
              <div>
                <div className="text-[12px] font-medium" style={{ color:i===active?'var(--accent)':'var(--label)' }}>{t.label}</div>
                <div className="text-[9px] font-mono" style={{ color:'var(--label-3)' }}>{t.event}</div>
              </div>
            </button>
          ))}
          {modo === 'meta' && TPLS_META.map((t,i)=>(
            <button key={t.id} onClick={()=>setSelMeta(i)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left border-l-2 transition-all"
              style={{ borderLeftColor:i===selMeta?'var(--accent)':'transparent', background:i===selMeta?'var(--accent-dim)':'transparent' }}>
              <div className="flex-1">
                <div className="text-[12px] font-medium" style={{ color:i===selMeta?'var(--accent)':'var(--label)' }}>{t.nome}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{ background:t.status==='APPROVED'?'rgba(50,215,75,0.1)':'rgba(255,159,10,0.1)', color:t.status==='APPROVED'?'var(--accent)':'var(--orange)' }}>
                    {t.status}
                  </span>
                  <span className="text-[9px]" style={{ color:'var(--label-3)' }}>{t.categoria}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-6" style={{ background:'var(--bg)' }}>
        <div className="max-w-4xl mx-auto">

          {/* ── MODO SIMPLES ── */}
          {modo === 'simples' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tpl?.icon}</span>
                  <div>
                    <h2 className="text-[20px] font-bold tracking-tight" style={{ color:'var(--label)' }}>{tpl?.label}</h2>
                    <p className="text-[11px] font-mono" style={{ color:'var(--label-3)' }}>{tpl?.event}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>setCur(DEF_SIMPLES[tpl?.key]||'')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-medium border transition-all"
                    style={{ background:'var(--fill)', borderColor:'var(--sep)', color:'var(--label-2)' }}>
                    <RotateCcw size={12}/> Restaurar
                  </button>
                  <button onClick={save}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[12px] font-semibold"
                    style={{ background:'var(--accent)', color:'#000' }}>
                    <Save size={12}/> Salvar
                  </button>
                </div>
              </div>

              {/* Aliases */}
              <div className="card p-4">
                <p className="text-[11px] font-medium mb-2.5" style={{ color:'var(--label-3)' }}>Clique para inserir no template</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALIASES.map(a=>(
                    <button key={a} onClick={()=>ins(a)}
                      className="px-2 py-1 rounded-[6px] text-[10px] font-mono border transition-all"
                      style={{ background:'var(--fill)', borderColor:'var(--sep)', color:'var(--label-2)' }}
                      onMouseEnter={e=>{e.target.style.borderColor='var(--accent)';e.target.style.color='var(--accent)'}}
                      onMouseLeave={e=>{e.target.style.borderColor='var(--sep)';e.target.style.color='var(--label-2)'}}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold block mb-2 uppercase tracking-wider" style={{ color:'var(--label-3)' }}>Template</label>
                  <textarea ref={taRef} value={cur} onChange={e=>setCur(e.target.value)} rows={14}
                    className="w-full rounded-[12px] text-[12px] leading-relaxed font-mono resize-none outline-none border transition-colors"
                    style={{ ...inp, padding:'12px 14px', lineHeight:1.75 }}
                    onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-2 uppercase tracking-wider" style={{ color:'var(--label-3)' }}>Preview (dados reais)</label>
                  <div className="rounded-[12px] p-4 min-h-[280px]" style={{ background:'var(--bg-3)', border:'1px solid var(--sep)' }}>
                    <div className="inline-block px-3.5 py-2.5 rounded-[18px] rounded-tl-[4px] text-[12px] leading-relaxed whitespace-pre-line max-w-[90%]"
                      style={{ background:'var(--bg-2)', color:'var(--label)', border:'1px solid var(--sep)' }}>
                      {prev(cur)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MODO META ESTRUTURADO ── */}
          {modo === 'meta' && (() => {
            const t = TPLS_META[selMeta]
            if (!t) return null
            return (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[20px] font-bold tracking-tight" style={{ color:'var(--label)' }}>{t.nome}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                        style={{ background:t.status==='APPROVED'?'rgba(50,215,75,0.12)':'rgba(255,159,10,0.12)', color:t.status==='APPROVED'?'var(--accent)':'var(--orange)' }}>
                        {t.status === 'APPROVED' ? '✓ Aprovado pela Meta' : '⏳ Em análise'}
                      </span>
                      <span className="text-[11px]" style={{ color:'var(--label-3)' }}>{t.categoria}</span>
                    </div>
                  </div>
                  <div className="text-[11px] px-3 py-1.5 rounded-[8px]" style={{ background:'var(--fill)', color:'var(--label-2)' }}>
                    Configurado no Meta Business
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {/* Estrutura */}
                  <div className="space-y-3">
                    {/* Cabeçalho */}
                    <div className="card p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color:'var(--label-3)' }}>
                        Cabeçalho — {t.header?.tipo}
                      </div>
                      <div className="text-[13px] font-semibold" style={{ color:'var(--label)' }}>{t.header?.valor}</div>
                    </div>

                    {/* Corpo */}
                    <div className="card p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color:'var(--label-3)' }}>Corpo</div>
                      <div className="text-[12px] font-mono leading-relaxed whitespace-pre-line" style={{ color:'var(--label-2)' }}>{t.body}</div>
                      <div className="mt-3 pt-3 flex flex-wrap gap-1.5" style={{ borderTop:'1px solid var(--sep)' }}>
                        {t.variaveis.map((v,i)=>(
                          <span key={v} className="text-[10px] px-2 py-0.5 rounded font-mono"
                            style={{ background:'rgba(10,132,255,0.1)', color:'var(--blue)' }}>
                            {`{{${i+1}}}`} = {v}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Rodapé */}
                    <div className="card p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color:'var(--label-3)' }}>Rodapé</div>
                      <div className="text-[12px]" style={{ color:'var(--label-2)' }}>{t.footer}</div>
                    </div>

                    {/* Botões */}
                    <div className="card p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color:'var(--label-3)' }}>
                        Botões ({t.botoes.length})
                      </div>
                      <div className="space-y-2">
                        {t.botoes.map((b,i)=>(
                          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-[8px]"
                            style={{ background:'var(--fill)', border:'1px solid var(--sep)' }}>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded"
                              style={{ background:b.tipo==='URL'?'rgba(10,132,255,0.12)':'rgba(50,215,75,0.12)', color:b.tipo==='URL'?'var(--blue)':'var(--accent)' }}>
                              {b.tipo}
                            </span>
                            <span className="text-[12px]" style={{ color:'var(--label)' }}>{b.label}</span>
                            {b.valor && <span className="text-[10px] font-mono ml-auto" style={{ color:'var(--label-3)' }}>{b.valor}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preview WhatsApp real */}
                  <div>
                    <label className="text-[11px] font-semibold block mb-3 uppercase tracking-wider" style={{ color:'var(--label-3)' }}>
                      Preview — Como aparece no WhatsApp
                    </label>
                    <div className="rounded-[20px] p-4" style={{ background:'#ECE5DD' }}>
                      <MetaTemplatePreview tpl={t} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
