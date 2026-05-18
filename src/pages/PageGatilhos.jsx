import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Zap, Plus, Edit3, Trash2, Save, X, ToggleLeft, ToggleRight,
  Sparkles, RefreshCw, Image, FileText, MousePointer, Link,
  Hash, ChevronRight, CheckCircle, AlertCircle, Copy, Eye,
  Package, CreditCard, Truck, Bell, Star, MessageSquare,
  ShoppingBag, Send, Clock, ArrowRight, Settings
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Definição dos gatilhos ─────────────────────────────────────────────────────
const GATILHOS_DEF = [
  {
    id: 'pedido_criado', label: 'Pedido Criado', grupo: 'Pedidos',
    icon: ShoppingBag, cor: '#00d4aa', corBg: 'rgba(0,212,170,0.08)',
    desc: 'Disparado quando um novo pedido é gerado no Bling',
    variaveis: ['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}','{{forma_pagamento}}','{{link_pedido}}'],
  },
  {
    id: 'pedido_faturado', label: 'Pedido Faturado', grupo: 'Pedidos',
    icon: FileText, cor: '#4a9fff', corBg: 'rgba(74,159,255,0.08)',
    desc: 'Nota fiscal emitida — NF-e disponível',
    variaveis: ['{{nome_cliente}}','{{numero_pedido}}','{{numero_nfe}}','{{valor_total}}'],
  },
  {
    id: 'pedido_enviado', label: 'Pedido Enviado', grupo: 'Entrega',
    icon: Truck, cor: '#f59e0b', corBg: 'rgba(245,158,11,0.08)',
    desc: 'Pedido despachado — código de rastreio disponível',
    variaveis: ['{{nome_cliente}}','{{numero_pedido}}','{{transportadora}}','{{codigo_rastreio}}','{{link_rastreio}}','{{prazo_entrega}}'],
  },
  {
    id: 'pedido_entregue', label: 'Pedido Entregue', grupo: 'Entrega',
    icon: CheckCircle, cor: '#22c55e', corBg: 'rgba(34,197,94,0.08)',
    desc: 'Entrega confirmada pela transportadora',
    variaveis: ['{{nome_cliente}}','{{numero_pedido}}','{{data_entrega}}'],
  },
  {
    id: 'pagamento_aprovado', label: 'Pagamento Aprovado', grupo: 'Financeiro',
    icon: CreditCard, cor: '#a78bfa', corBg: 'rgba(167,139,250,0.08)',
    desc: 'PIX ou cartão confirmado',
    variaveis: ['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}','{{forma_pagamento}}'],
  },
  {
    id: 'avise_me', label: 'Produto Disponível', grupo: 'Estoque',
    icon: Bell, cor: '#fb923c', corBg: 'rgba(251,146,60,0.08)',
    desc: 'Produto que estava em falta voltou ao estoque',
    variaveis: ['{{nome_cliente}}','{{nome_produto}}','{{preco_produto}}','{{preco_pix}}','{{link_produto}}','{{foto_produto}}'],
  },
  {
    id: 'boas_vindas', label: 'Boas-vindas', grupo: 'Relacionamento',
    icon: Star, cor: '#e879f9', corBg: 'rgba(232,121,249,0.08)',
    desc: 'Primeira interação do cliente no WhatsApp',
    variaveis: ['{{nome_cliente}}','{{nome_loja}}','{{telefone_loja}}','{{site_loja}}'],
  },
  {
    id: 'abandono_carrinho', label: 'Carrinho Abandonado', grupo: 'Relacionamento',
    icon: ShoppingBag, cor: '#f87171', corBg: 'rgba(248,113,113,0.08)',
    desc: 'Cliente adicionou ao carrinho mas não finalizou',
    variaveis: ['{{nome_cliente}}','{{nome_produto}}','{{preco_produto}}','{{link_produto}}'],
  },
]

const GRUPOS = [...new Set(GATILHOS_DEF.map(g => g.grupo))]

const ALIASES_TODOS = [
  { grupo:'Cliente',   itens:['{{nome_cliente}}','{{primeiro_nome}}','{{email_cliente}}','{{telefone_cliente}}'] },
  { grupo:'Pedido',    itens:['{{numero_pedido}}','{{data_pedido}}','{{status_pedido}}','{{valor_total}}','{{forma_pagamento}}','{{link_pedido}}'] },
  { grupo:'Produto',   itens:['{{nome_produto}}','{{preco_produto}}','{{preco_pix}}','{{foto_produto}}','{{link_produto}}'] },
  { grupo:'Entrega',   itens:['{{transportadora}}','{{codigo_rastreio}}','{{link_rastreio}}','{{prazo_entrega}}'] },
  { grupo:'Loja',      itens:['{{nome_loja}}','{{telefone_loja}}','{{site_loja}}'] },
]

// ── Preview WhatsApp ───────────────────────────────────────────────────────────
const AMOSTRAS = {
  '{{nome_cliente}}':'Maria Silva', '{{primeiro_nome}}':'Maria',
  '{{numero_pedido}}':'224307', '{{valor_total}}':'R$ 47,52',
  '{{transportadora}}':'Jadlog', '{{codigo_rastreio}}':'JD123456789BR',
  '{{link_rastreio}}':'https://rastreamento.jadlog.com.br',
  '{{prazo_entrega}}':'3 dias úteis', '{{nome_produto}}':'Fio de Seda Preto',
  '{{preco_produto}}':'R$ 11,62', '{{preco_pix}}':'R$ 10,46',
  '{{link_produto}}':'https://sostrass.com.br/produto/123',
  '{{foto_produto}}':'https://cdn-sostrass-image.s3.sa-east-1.amazonaws.com/perola-furo-passante-creme.jpg',
  '{{nome_loja}}':'Só Strass', '{{forma_pagamento}}':'PIX',
}

function resolverVars(txt = '') {
  return txt.replace(/\{\{([^}]+)\}\}/g, (_, k) => AMOSTRAS[`{{${k}}}`] || `{{${k}}}`)
}

function PreviewWA({ template }) {
  if (!template) return (
    <div className="flex flex-col items-center justify-center h-full opacity-30">
      <MessageSquare size={32} style={{ color:'var(--label-3)' }}/>
      <p className="text-[12px] mt-2" style={{ color:'var(--label-3)' }}>Selecione um gatilho</p>
    </div>
  )

  const blocos = template.blocos || []
  const hora   = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
  const img    = blocos.find(b=>b.tipo==='imagem')
  const textos = blocos.filter(b=>b.tipo==='texto')
  const botoes = blocos.filter(b=>b.tipo==='botao')

  return (
    <div style={{ fontFamily:'system-ui', maxWidth:300, margin:'0 auto' }}>
      {/* Phone chrome */}
      <div className="rounded-[22px] overflow-hidden shadow-2xl"
        style={{ background:'#111b21', border:'8px solid #1c2936' }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3"
          style={{ background:'#202c33' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
            style={{ background:'#00a884' }}>S</div>
          <div>
            <p className="text-[13px] font-semibold text-white">{template.gatilhoLabel || 'Gatilho'}</p>
            <p className="text-[10px]" style={{ color:'#8696a0' }}>online</p>
          </div>
        </div>
        {/* Chat */}
        <div className="px-3 py-4 min-h-[180px]" style={{ background:'#0b141a' }}>
          <div className="rounded-[12px] rounded-tl-[3px] overflow-hidden max-w-[240px]"
            style={{ background:'#202c33' }}>
            {img?.url && (
              <div style={{ background:'#1a2733' }}>
                <img src={resolverVars(img.url)} alt="" className="w-full object-cover"
                  style={{ maxHeight:140 }} onError={e=>e.target.style.display='none'}/>
                {img.legenda && <p className="px-3 py-1 text-[11px]" style={{ color:'#8696a0' }}>{resolverVars(img.legenda)}</p>}
              </div>
            )}
            {textos.map((b,i) => (
              <p key={i} className="px-3 py-2 text-[13px] leading-relaxed" style={{ color:'#e9edef' }}
                dangerouslySetInnerHTML={{ __html: resolverVars(b.conteudo||'').replace(/\n/g,'<br/>').replace(/\*([^*]+)\*/g,'<strong>$1</strong>') }}/>
            ))}
            {botoes.length > 0 && (
              <div style={{ borderTop:'1px solid #2a3942' }}>
                {botoes.map((b,i) => (
                  <button key={i} className="w-full py-2.5 text-[13px] font-medium flex items-center justify-center gap-1.5 transition-all"
                    style={{ color:'#00a884', borderTop: i>0?'1px solid #2a3942':undefined }}>
                    {b.acao==='url' && <Link size={12}/>}
                    {b.acao==='tel' && <Send size={12}/>}
                    {resolverVars(b.texto) || 'Botão'}
                  </button>
                ))}
              </div>
            )}
            <div className="px-3 pb-2 flex justify-end">
              <span className="text-[10px]" style={{ color:'#8696a0' }}>{hora} ✓✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Editor de template ─────────────────────────────────────────────────────────
function EditorTemplate({ gatilho, template, onChange, api }) {
  const [gerando, setGerando] = useState(false)
  const textareaRef = useRef(null)

  const blocos     = template.blocos || []
  const setBlocos  = (b) => onChange({ ...template, blocos: b })
  const addBloco   = (tipo) => setBlocos([...blocos, { tipo, conteudo:'', id: Date.now() }])
  const delBloco   = (i)   => setBlocos(blocos.filter((_,j)=>j!==i))
  const updBloco   = (i,b) => setBlocos(blocos.map((x,j)=>j===i?b:x))

  const inserirVar = (alias, idx) => {
    const el = document.getElementById(`txt-${idx}`)
    if (!el) return
    const s = el.selectionStart, e = el.selectionEnd
    const novo = (blocos[idx].conteudo||'').slice(0,s) + alias + (blocos[idx].conteudo||'').slice(e)
    updBloco(idx, { ...blocos[idx], conteudo: novo })
    setTimeout(() => { el.focus(); el.setSelectionRange(s+alias.length, s+alias.length) }, 0)
  }

  const gerarIA = async () => {
    if (!gatilho) return
    setGerando(true)
    try {
      const r = await fetch(`${api}/api/templates/gerar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: gatilho.label, gatilho: gatilho.id, descricao: gatilho.desc })
      })
      const d = await r.json()
      if (d.blocos) setBlocos(d.blocos.map((b,i)=>({...b, id:Date.now()+i})))
    } catch {}
    setGerando(false)
  }

  return (
    <div className="space-y-4">
      {/* Gerar IA */}
      <button onClick={gerarIA} disabled={gerando}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[11px] text-[13px] font-semibold transition-all"
        style={{ background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
        {gerando ? <RefreshCw size={13} className="animate-spin"/> : <Sparkles size={13}/>}
        {gerando ? 'Gerando com IA...' : 'Gerar mensagem com IA'}
      </button>

      {/* Blocos */}
      <div className="space-y-3">
        {blocos.map((b, i) => (
          <div key={b.id||i} className="rounded-[12px] overflow-hidden"
            style={{ border:'1px solid var(--sep)', background:'var(--bg-3)' }}>
            <div className="flex items-center justify-between px-3 py-2"
              style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color:'var(--label-3)' }}>
                  {b.tipo === 'texto' ? '📝 Texto' : b.tipo === 'imagem' ? '🖼️ Imagem' : b.tipo === 'botao' ? '🔘 Botão' : '🔗 Link'}
                </span>
              </div>
              <button onClick={() => delBloco(i)} className="p-1 rounded-[5px]" style={{ color:'var(--label-4)' }}>
                <X size={12}/>
              </button>
            </div>
            <div className="p-3">
              {b.tipo === 'texto' && (
                <div className="space-y-2">
                  <textarea id={`txt-${i}`} value={b.conteudo||''} onChange={e=>updBloco(i,{...b,conteudo:e.target.value})}
                    rows={4} placeholder="Digite o texto... Use *negrito* para destacar"
                    className="w-full px-3 py-2.5 rounded-[9px] text-[13px] outline-none resize-none"
                    style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)', lineHeight:1.6 }}/>
                  {/* Variáveis do gatilho */}
                  <div className="flex flex-wrap gap-1.5">
                    {(gatilho?.variaveis || []).map(v => (
                      <button key={v} onClick={() => inserirVar(v, i)}
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono transition-all hover:scale-105"
                        style={{ background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {b.tipo === 'imagem' && (
                <div className="space-y-2">
                  <input value={b.url||''} onChange={e=>updBloco(i,{...b,url:e.target.value})}
                    placeholder="URL da imagem ou {{foto_produto}}"
                    className="w-full px-3 py-2 rounded-[9px] text-[12px] font-mono outline-none"
                    style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
                  <div className="flex gap-1.5 flex-wrap">
                    {['{{foto_produto}}'].map(v=>(
                      <button key={v} onClick={()=>updBloco(i,{...b,url:(b.url||'')+v})}
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono"
                        style={{ background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
                        {v}
                      </button>
                    ))}
                  </div>
                  <input value={b.legenda||''} onChange={e=>updBloco(i,{...b,legenda:e.target.value})}
                    placeholder="Legenda (opcional)"
                    className="w-full px-3 py-2 rounded-[9px] text-[12px] outline-none"
                    style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
                </div>
              )}
              {b.tipo === 'botao' && (
                <div className="space-y-2">
                  <input value={b.texto||''} onChange={e=>updBloco(i,{...b,texto:e.target.value})}
                    placeholder="Texto do botão (máx. 20 caracteres)"
                    maxLength={20}
                    className="w-full px-3 py-2 rounded-[9px] text-[13px] outline-none"
                    style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
                  <div className="grid grid-cols-3 gap-2">
                    {[['url','🔗 Link'],['reply','💬 Resposta'],['tel','📞 Ligar']].map(([v,l])=>(
                      <button key={v} onClick={()=>updBloco(i,{...b,acao:v})}
                        className="py-1.5 rounded-[8px] text-[11px] font-medium transition-all"
                        style={{
                          background: b.acao===v ? 'var(--accent-dim)' : 'var(--bg)',
                          color:      b.acao===v ? 'var(--accent)' : 'var(--label-3)',
                          border:     b.acao===v ? '1px solid var(--accent-border)' : '1px solid var(--sep)',
                        }}>{l}</button>
                    ))}
                  </div>
                  {(b.acao==='url'||b.acao==='tel') && (
                    <div className="space-y-1.5">
                      <input value={b.valor||''} onChange={e=>updBloco(i,{...b,valor:e.target.value})}
                        placeholder={b.acao==='tel'?'Número telefone':'URL destino'}
                        className="w-full px-3 py-2 rounded-[9px] text-[12px] font-mono outline-none"
                        style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
                      <div className="flex flex-wrap gap-1.5">
                        {(gatilho?.variaveis||[]).filter(v=>v.includes('link')||v.includes('url')).map(v=>(
                          <button key={v} onClick={()=>updBloco(i,{...b,valor:(b.valor||'')+v})}
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono"
                            style={{ background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Adicionar bloco */}
      <div className="grid grid-cols-4 gap-2">
        {[['texto','📝 Texto',FileText],['imagem','🖼️ Imagem',Image],['botao','🔘 Botão',MousePointer],['link','🔗 Link',Link]].map(([tipo,lb,Ic])=>(
          <button key={tipo} onClick={()=>addBloco(tipo)}
            className="flex flex-col items-center gap-1.5 py-3 rounded-[10px] text-[11px] font-medium transition-all"
            style={{ background:'var(--bg-2)', border:'1px dashed var(--sep)', color:'var(--label-3)' }}>
            <Ic size={14}/>{lb.split(' ')[1]}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function PageGatilhos({ api: apiProp }) {
  const api = apiProp || BASE
  const [templates,  setTemplates]  = useState({}) // {gatilhoId: template}
  const [loading,    setLoading]    = useState(true)
  const [selGatilho, setSelGatilho] = useState(null) // id do gatilho selecionado
  const [editando,   setEditando]   = useState(null) // template em edição
  const [salvando,   setSalvando]   = useState(false)
  const [salvoOk,    setSalvoOk]    = useState(false)
  const [grupoAberto,setGrupoAberto]= useState(GRUPOS.reduce((a,g)=>({...a,[g]:true}),{}))

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/templates`)
      if (r.ok) {
        const d = await r.json()
        const map = {}
        for (const t of d.templates || []) { if (t.gatilho) map[t.gatilho] = t }
        setTemplates(map)
      }
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  const gatilhoAtual = GATILHOS_DEF.find(g => g.id === selGatilho)
  const templateAtual = editando || templates[selGatilho] || { gatilho: selGatilho, blocos: [], ativo: true }

  const toggleAtivo = async (gatilhoId) => {
    const t = templates[gatilhoId]
    if (!t) return
    const novoAtivo = !t.ativo
    setTemplates(prev => ({ ...prev, [gatilhoId]: { ...t, ativo: novoAtivo } }))
    await fetch(`${api}/api/templates/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: novoAtivo })
    }).catch(() => {})
  }

  const salvar = async () => {
    if (!selGatilho || !editando) return
    setSalvando(true)
    try {
      const existe = templates[selGatilho]
      const url    = existe ? `${api}/api/templates/${existe.id}` : `${api}/api/templates`
      const method = existe ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editando,
          gatilho: selGatilho,
          nome: gatilhoAtual?.label || selGatilho,
          gatilhoLabel: gatilhoAtual?.label,
        })
      })
      if (r.ok) {
        setSalvoOk(true)
        setTimeout(() => setSalvoOk(false), 2000)
        await carregar()
        setEditando(null)
      }
    } catch {}
    setSalvando(false)
  }

  if (loading) return (
    <div className="h-full flex items-center justify-center" style={{ color:'var(--label-3)' }}>
      <RefreshCw size={16} className="animate-spin"/>
    </div>
  )

  return (
    <div className="h-full flex overflow-hidden" style={{ background:'var(--bg)' }}>

      {/* ── Painel esquerdo: lista de gatilhos ─────────────────────────── */}
      <div className="w-[280px] flex-shrink-0 flex flex-col overflow-hidden"
        style={{ borderRight:'1px solid var(--sep)', background:'var(--bg-2)' }}>

        {/* Header */}
        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)' }}>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-[8px] flex items-center justify-center"
              style={{ background:'var(--accent-dim)' }}>
              <Zap size={13} style={{ color:'var(--accent)' }}/>
            </div>
            <h2 className="text-[16px] font-bold" style={{ color:'var(--label)' }}>Gatilhos</h2>
          </div>
          <p className="text-[11px]" style={{ color:'var(--label-3)' }}>
            {Object.values(templates).filter(t=>t.ativo).length} ativos de {GATILHOS_DEF.length} disponíveis
          </p>
        </div>

        {/* Lista agrupada */}
        <div className="flex-1 overflow-y-auto py-2">
          {GRUPOS.map(grupo => {
            const itens = GATILHOS_DEF.filter(g => g.grupo === grupo)
            const aberto = grupoAberto[grupo]
            return (
              <div key={grupo}>
                <button
                  onClick={() => setGrupoAberto(prev => ({...prev, [grupo]: !aberto}))}
                  className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color:'var(--label-4)' }}>
                  {grupo}
                  <ChevronRight size={10} style={{ transform: aberto?'rotate(90deg)':'none', transition:'transform 0.2s' }}/>
                </button>
                {aberto && itens.map(g => {
                  const t       = templates[g.id]
                  const temConf = !!t?.blocos?.length
                  const ativo   = t?.ativo
                  const sel     = selGatilho === g.id
                  const Ic      = g.icon

                  return (
                    <button key={g.id}
                      onClick={() => { setSelGatilho(g.id); setEditando(null) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left"
                      style={{
                        background: sel ? `${g.cor}12` : 'transparent',
                        borderRight: sel ? `2px solid ${g.cor}` : '2px solid transparent',
                      }}>
                      <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
                        style={{ background: sel ? g.corBg : 'var(--fill)', border:`1px solid ${sel?g.cor+'40':'var(--sep)'}` }}>
                        <Ic size={14} style={{ color: sel ? g.cor : 'var(--label-3)' }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate"
                          style={{ color: sel ? g.cor : 'var(--label)' }}>{g.label}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {temConf ? (
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ativo ? '#22c55e' : 'var(--label-4)' }}/>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background:'var(--sep)' }}/>
                          )}
                          <span className="text-[10px]" style={{ color:'var(--label-4)' }}>
                            {temConf ? (ativo ? 'Ativo' : 'Inativo') : 'Não configurado'}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Painel central: editor ─────────────────────────────────────── */}
      {selGatilho && gatilhoAtual ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header do gatilho */}
          <div className="px-6 py-4 flex-shrink-0 flex items-center justify-between"
            style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] flex items-center justify-center"
                style={{ background:gatilhoAtual.corBg, border:`1.5px solid ${gatilhoAtual.cor}40` }}>
                <gatilhoAtual.icon size={18} style={{ color:gatilhoAtual.cor }}/>
              </div>
              <div>
                <h3 className="text-[16px] font-bold" style={{ color:'var(--label)' }}>{gatilhoAtual.label}</h3>
                <p className="text-[11px]" style={{ color:'var(--label-3)' }}>{gatilhoAtual.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Toggle ativo/inativo */}
              {templates[selGatilho] && (
                <button onClick={() => toggleAtivo(selGatilho)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-[9px] text-[12px] font-medium transition-all"
                  style={{
                    background: templates[selGatilho]?.ativo ? 'rgba(34,197,94,0.1)' : 'var(--fill)',
                    color:      templates[selGatilho]?.ativo ? '#22c55e' : 'var(--label-3)',
                    border:     templates[selGatilho]?.ativo ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--sep)',
                  }}>
                  {templates[selGatilho]?.ativo ? <ToggleRight size={15}/> : <ToggleLeft size={15}/>}
                  {templates[selGatilho]?.ativo ? 'Ativo' : 'Inativo'}
                </button>
              )}

              {/* Salvar */}
              {editando && (
                <button onClick={salvar} disabled={salvando}
                  className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all"
                  style={{ background: salvoOk ? '#22c55e' : 'var(--accent)', color:'#000' }}>
                  {salvando ? <RefreshCw size={13} className="animate-spin"/> :
                   salvoOk  ? <CheckCircle size={13}/> : <Save size={13}/>}
                  {salvando ? 'Salvando...' : salvoOk ? 'Salvo!' : 'Salvar'}
                </button>
              )}

              {!editando && (
                <button onClick={() => setEditando({ ...templateAtual })}
                  className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold"
                  style={{ background:'var(--fill)', color:'var(--label-2)', border:'1px solid var(--sep)' }}>
                  <Edit3 size={13}/>
                  {templates[selGatilho] ? 'Editar' : 'Configurar'}
                </button>
              )}
            </div>
          </div>

          {/* Corpo — editor + preview lado a lado */}
          <div className="flex-1 overflow-hidden flex">

            {/* Editor */}
            <div className="flex-1 overflow-y-auto p-6"
              style={{ borderRight:'1px solid var(--sep)' }}>

              {!editando && !templates[selGatilho] && (
                <div className="flex flex-col items-center py-16 text-center">
                  <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-4"
                    style={{ background:gatilhoAtual.corBg, border:`2px solid ${gatilhoAtual.cor}30` }}>
                    <gatilhoAtual.icon size={28} style={{ color:gatilhoAtual.cor }}/>
                  </div>
                  <h4 className="text-[16px] font-bold mb-2" style={{ color:'var(--label)' }}>
                    Gatilho não configurado
                  </h4>
                  <p className="text-[13px] mb-6 max-w-[320px]" style={{ color:'var(--label-3)' }}>
                    {gatilhoAtual.desc}. Configure a mensagem que será enviada automaticamente quando este evento ocorrer.
                  </p>
                  <button onClick={() => setEditando({ gatilho: selGatilho, blocos: [], ativo: true })}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-[11px] text-[13px] font-semibold"
                    style={{ background:'var(--accent)', color:'#000' }}>
                    <Plus size={14}/> Configurar gatilho
                  </button>
                </div>
              )}

              {!editando && templates[selGatilho] && (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center gap-3 p-4 rounded-[14px]"
                    style={{
                      background: templates[selGatilho].ativo ? 'rgba(34,197,94,0.06)' : 'var(--bg-2)',
                      border: `1px solid ${templates[selGatilho].ativo ? 'rgba(34,197,94,0.2)' : 'var(--sep)'}`,
                    }}>
                    <div className={`w-2.5 h-2.5 rounded-full ${templates[selGatilho].ativo?'animate-pulse':''}`}
                      style={{ background: templates[selGatilho].ativo ? '#22c55e' : 'var(--label-4)' }}/>
                    <p className="text-[13px] font-medium" style={{ color:'var(--label)' }}>
                      {templates[selGatilho].ativo
                        ? 'Este gatilho está ativo e enviando mensagens automaticamente'
                        : 'Este gatilho está inativo — mensagens não são enviadas'}
                    </p>
                  </div>

                  {/* Blocos configurados */}
                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold" style={{ color:'var(--label-2)' }}>
                      Mensagem configurada
                    </p>
                    {(templates[selGatilho].blocos||[]).map((b,i) => (
                      <div key={i} className="p-3 rounded-[10px]"
                        style={{ background:'var(--bg-3)', border:'1px solid var(--sep)' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                          style={{ color:'var(--label-4)' }}>
                          {b.tipo}
                        </p>
                        <p className="text-[12px]" style={{ color:'var(--label-2)' }}>
                          {b.tipo==='texto' ? (b.conteudo||'').slice(0,100) :
                           b.tipo==='imagem' ? (b.url||'').slice(0,60) :
                           b.tipo==='botao' ? `${b.texto} → ${b.acao}` : b.url}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Variáveis disponíveis */}
                  <div>
                    <p className="text-[12px] font-semibold mb-2" style={{ color:'var(--label-2)' }}>
                      Variáveis disponíveis neste gatilho
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {gatilhoAtual.variaveis.map(v => (
                        <span key={v} className="px-2 py-0.5 rounded-full text-[10px] font-mono"
                          style={{ background:'var(--fill)', color:'var(--accent)', border:'1px solid var(--sep)' }}>
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {editando && (
                <EditorTemplate
                  gatilho={gatilhoAtual}
                  template={editando}
                  onChange={setEditando}
                  api={api}/>
              )}
            </div>

            {/* Preview */}
            <div className="w-[320px] flex-shrink-0 flex flex-col overflow-hidden">
              <div className="px-4 py-3 flex-shrink-0"
                style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
                <p className="text-[11px] font-semibold" style={{ color:'var(--label-3)' }}>
                  👁️ Preview com dados de exemplo
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-5 flex items-start justify-center"
                style={{ background:'var(--bg-3)' }}>
                <PreviewWA
                  template={editando || (templates[selGatilho] ? { ...templates[selGatilho], gatilhoLabel: gatilhoAtual.label } : null)}/>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Estado vazio — nenhum gatilho selecionado */
        <div className="flex-1 flex flex-col items-center justify-center" style={{ background:'var(--bg-3)' }}>
          <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-5"
            style={{ background:'var(--fill)', border:'1px solid var(--sep)' }}>
            <Zap size={24} style={{ color:'var(--label-3)' }}/>
          </div>
          <h3 className="text-[18px] font-bold mb-2" style={{ color:'var(--label)' }}>Gatilhos de Mensagem</h3>
          <p className="text-[13px] text-center max-w-[360px]" style={{ color:'var(--label-3)' }}>
            Configure mensagens automáticas que são enviadas quando eventos específicos ocorrem — pedidos, pagamentos, entregas e muito mais.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 max-w-[400px]">
            {GATILHOS_DEF.slice(0,4).map(g => {
              const Ic = g.icon
              return (
                <button key={g.id} onClick={() => setSelGatilho(g.id)}
                  className="flex items-center gap-3 p-3 rounded-[12px] text-left transition-all"
                  style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                  <div className="w-8 h-8 rounded-[8px] flex items-center justify-center"
                    style={{ background:g.corBg }}>
                    <Ic size={14} style={{ color:g.cor }}/>
                  </div>
                  <span className="text-[12px] font-medium" style={{ color:'var(--label)' }}>{g.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
