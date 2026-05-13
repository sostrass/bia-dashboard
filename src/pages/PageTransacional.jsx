import { useState, useEffect, useCallback } from 'react'
import {
  Zap, Save, Send, RefreshCw, X, ChevronRight, Sparkles,
  ToggleLeft, ToggleRight, CheckCircle, Plus, Image,
  FileText, MousePointer, Link, Hash, ShoppingBag,
  CreditCard, Truck, Bell, Star, Package, Clock,
  MessageSquare
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Gatilhos disponíveis ───────────────────────────────────────────────────────
const GATILHOS = [
  {
    id: 'pedido_criado', label: 'Pedido Criado', grupo: 'Pedidos',
    icon: ShoppingBag, cor: '#00d4aa', corBg: 'rgba(0,212,170,0.1)',
    desc: 'Novo pedido gerado no Bling',
    variaveis: ['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}','{{forma_pagamento}}','{{link_pedido}}'],
    padrao: { blocos: [{ tipo:'texto', conteudo:'Olá *{{nome_cliente}}*! 🛒\n\nSeu pedido *#{{numero_pedido}}* foi criado com sucesso!\n\nTotal: *{{valor_total}}*\nForma de pagamento: {{forma_pagamento}}', id:1 }, { tipo:'botao', texto:'Ver pedido', acao:'url', valor:'{{link_pedido}}', id:2 }] }
  },
  {
    id: 'pagamento_aprovado', label: 'Pagamento Aprovado', grupo: 'Pedidos',
    icon: CreditCard, cor: '#4a9fff', corBg: 'rgba(74,159,255,0.1)',
    desc: 'PIX ou cartão confirmado',
    variaveis: ['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}','{{forma_pagamento}}'],
    padrao: { blocos: [{ tipo:'texto', conteudo:'✅ *Pagamento aprovado!*\n\nOlá {{nome_cliente}}, o pagamento do pedido *#{{numero_pedido}}* foi confirmado!\n\nJá estamos preparando seu pedido com carinho. 📦', id:1 }] }
  },
  {
    id: 'pagamento_pendente', label: 'Pagamento Pendente', grupo: 'Pedidos',
    icon: Clock, cor: '#f59e0b', corBg: 'rgba(245,158,11,0.1)',
    desc: 'Pedido aguardando pagamento',
    variaveis: ['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}','{{link_pedido}}'],
    padrao: { blocos: [{ tipo:'texto', conteudo:'⏳ Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* ainda aguarda pagamento.\n\nTotal: *{{valor_total}}*', id:1 }, { tipo:'botao', texto:'Pagar agora', acao:'url', valor:'{{link_pedido}}', id:2 }] }
  },
  {
    id: 'pedido_enviado', label: 'Pedido Enviado', grupo: 'Entrega',
    icon: Truck, cor: '#a78bfa', corBg: 'rgba(167,139,250,0.1)',
    desc: 'Pedido despachado com rastreio',
    variaveis: ['{{nome_cliente}}','{{numero_pedido}}','{{transportadora}}','{{codigo_rastreio}}','{{link_rastreio}}','{{prazo_entrega}}'],
    padrao: { blocos: [{ tipo:'texto', conteudo:'🚚 *Seu pedido foi enviado!*\n\nOlá {{nome_cliente}}! O pedido *#{{numero_pedido}}* saiu para entrega.\n\nTransportadora: {{transportadora}}\nRastreio: *{{codigo_rastreio}}*\nPrazo: {{prazo_entrega}}', id:1 }, { tipo:'botao', texto:'Rastrear pedido', acao:'url', valor:'{{link_rastreio}}', id:2 }] }
  },
  {
    id: 'pedido_entregue', label: 'Pedido Entregue', grupo: 'Entrega',
    icon: Package, cor: '#22c55e', corBg: 'rgba(34,197,94,0.1)',
    desc: 'Entrega confirmada',
    variaveis: ['{{nome_cliente}}','{{numero_pedido}}'],
    padrao: { blocos: [{ tipo:'texto', conteudo:'📦 *Pedido entregue!*\n\nOlá {{nome_cliente}}, seu pedido *#{{numero_pedido}}* foi entregue!\n\nEsperamos que você goste 😊 Qualquer dúvida estamos aqui!', id:1 }, { tipo:'botao', texto:'Avaliar compra ⭐', acao:'reply', valor:'Quero avaliar', id:2 }] }
  },
  {
    id: 'avise_me', label: 'Produto Disponível', grupo: 'Estoque',
    icon: Bell, cor: '#fb923c', corBg: 'rgba(251,146,60,0.1)',
    desc: 'Produto voltou ao estoque',
    variaveis: ['{{nome_cliente}}','{{nome_produto}}','{{preco_produto}}','{{preco_pix}}','{{link_produto}}','{{foto_produto}}'],
    padrao: { blocos: [{ tipo:'imagem', url:'{{foto_produto}}', legenda:'', id:1 }, { tipo:'texto', conteudo:'🔔 *{{nome_produto}}* está disponível!\n\nOlá {{nome_cliente}}, o produto que você pediu para avisar voltou ao estoque!\n\n💳 Cartão: *{{preco_produto}}*\n💰 PIX: *{{preco_pix}}* (10% off)', id:2 }, { tipo:'botao', texto:'Comprar agora', acao:'url', valor:'{{link_produto}}', id:3 }] }
  },
  {
    id: 'boas_vindas', label: 'Boas-vindas', grupo: 'Relacionamento',
    icon: Star, cor: '#e879f9', corBg: 'rgba(232,121,249,0.1)',
    desc: 'Primeiro contato do cliente',
    variaveis: ['{{nome_cliente}}','{{nome_loja}}'],
    padrao: { blocos: [{ tipo:'texto', conteudo:'👋 Olá *{{nome_cliente}}*! Bem-vindo(a) à *{{nome_loja}}*!\n\nSou a Molise, sua assistente virtual. Estou aqui para te ajudar com produtos, pedidos e muito mais.\n\nComo posso te ajudar hoje? 😊', id:1 }] }
  },
  {
    id: 'avaliar_pedido', label: 'Avaliação Pós-venda', grupo: 'Relacionamento',
    icon: Star, cor: '#f87171', corBg: 'rgba(248,113,113,0.1)',
    desc: 'Pesquisa de satisfação',
    variaveis: ['{{nome_cliente}}','{{numero_pedido}}'],
    padrao: { blocos: [{ tipo:'texto', conteudo:'⭐ Olá *{{nome_cliente}}*, como foi sua experiência?\n\nSeu pedido *#{{numero_pedido}}* foi entregue. Gostaríamos de saber o que achou!\n\nSua opinião nos ajuda a melhorar sempre 🙏', id:1 }, { tipo:'botao', texto:'Adorei! ⭐⭐⭐⭐⭐', acao:'reply', valor:'Fiquei muito satisfeito', id:2 }, { tipo:'botao', texto:'Tive um problema', acao:'reply', valor:'Preciso de ajuda', id:3 }] }
  },
]

const GRUPOS = [...new Set(GATILHOS.map(g => g.grupo))]

// Amostras para preview
const AMOSTRAS = {
  '{{nome_cliente}}':'Maria Silva', '{{numero_pedido}}':'224307',
  '{{valor_total}}':'R$ 47,52', '{{forma_pagamento}}':'PIX',
  '{{transportadora}}':'Jadlog', '{{codigo_rastreio}}':'JD123456789BR',
  '{{link_rastreio}}':'https://rastreamento.jadlog.com.br',
  '{{prazo_entrega}}':'3 dias úteis',
  '{{nome_produto}}':'Fio de Seda Rabo de Rato 1mm Preto',
  '{{preco_produto}}':'R$ 11,62', '{{preco_pix}}':'R$ 10,46',
  '{{link_produto}}':'https://sostrass.com.br/produto/123',
  '{{foto_produto}}':'https://cdn-sostrass-image.s3.sa-east-1.amazonaws.com/perola-furo-passante-creme.jpg',
  '{{nome_loja}}':'Só Strass', '{{link_pedido}}':'https://sostrass.com.br/pedido/224307',
}

const resolver = (txt='') => txt.replace(/\{\{([^}]+)\}\}/g, (_,k) => AMOSTRAS[`{{${k}}}`]||`{{${k}}}`)

// ── Preview WhatsApp ───────────────────────────────────────────────────────────
function PreviewWA({ blocos = [], label = '' }) {
  const hora = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
  const img  = blocos.find(b => b.tipo === 'imagem')
  const txts = blocos.filter(b => b.tipo === 'texto')
  const btns = blocos.filter(b => b.tipo === 'botao')

  if (!blocos.length) return (
    <div className="flex flex-col items-center justify-center h-full py-8" style={{ opacity:.3 }}>
      <MessageSquare size={28} style={{ color:'var(--label-3)' }}/>
      <p className="text-[11px] mt-2" style={{ color:'var(--label-3)' }}>Preview aparece aqui</p>
    </div>
  )

  return (
    <div style={{ maxWidth:280, margin:'0 auto', fontFamily:'system-ui' }}>
      <div className="rounded-[20px] overflow-hidden"
        style={{ background:'#111b21', border:'6px solid #1c2936', boxShadow:'0 24px 48px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ background:'#202c33' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background:'#00a884' }}>S</div>
          <div>
            <p className="text-[12px] font-semibold text-white leading-tight">{label || 'Notificação'}</p>
            <p className="text-[9px]" style={{ color:'#8696a0' }}>online</p>
          </div>
        </div>
        <div className="px-3 py-3 min-h-[100px]" style={{ background:'#0b141a' }}>
          <div className="rounded-[10px] rounded-tl-[2px] overflow-hidden max-w-[230px]"
            style={{ background:'#202c33' }}>
            {img?.url && (
              <div>
                <img src={resolver(img.url)} alt="" className="w-full object-cover"
                  style={{ maxHeight:120 }} onError={e=>e.target.style.display='none'}/>
                {img.legenda && <p className="px-2.5 py-1 text-[10px]" style={{ color:'#8696a0' }}>{resolver(img.legenda)}</p>}
              </div>
            )}
            {txts.map((b,i) => (
              <p key={i} className="px-3 py-2 text-[12px] leading-relaxed" style={{ color:'#e9edef' }}
                dangerouslySetInnerHTML={{ __html:
                  resolver(b.conteudo||'')
                    .replace(/\n/g,'<br/>')
                    .replace(/\*([^*\n]+)\*/g,'<strong>$1</strong>')
                }}/>
            ))}
            {btns.length > 0 && (
              <div style={{ borderTop:'1px solid #2a3942' }}>
                {btns.map((b,i) => (
                  <div key={i} className="flex items-center justify-center gap-1.5 py-2"
                    style={{ borderTop: i>0?'1px solid #2a3942':'none', color:'#00a884' }}>
                    {b.acao==='url'   && <Link size={10}/>}
                    {b.acao==='tel'   && <Send size={10}/>}
                    {b.acao==='reply' && <MessageSquare size={10}/>}
                    <span className="text-[11px] font-medium">{resolver(b.texto)||'Botão'}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="px-3 pb-2 flex justify-end">
              <span className="text-[9px]" style={{ color:'#8696a0' }}>{hora} ✓✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Bloco de edição ────────────────────────────────────────────────────────────
function BlocoEditor({ bloco, vars, onChange, onDelete }) {
  const inserir = (v) => {
    const el = document.getElementById(`ta-${bloco.id}`)
    if (!el) return onChange({ ...bloco, conteudo: (bloco.conteudo||'') + v })
    const s = el.selectionStart, e = el.selectionEnd
    const novo = (bloco.conteudo||'').slice(0,s) + v + (bloco.conteudo||'').slice(e)
    onChange({ ...bloco, conteudo: novo })
    setTimeout(() => { el.focus(); el.setSelectionRange(s+v.length, s+v.length) }, 0)
  }

  const inp = {
    background:'var(--bg)', border:'1px solid var(--sep)', borderRadius:9,
    color:'var(--label)', outline:'none', padding:'8px 12px', fontSize:12, width:'100%'
  }

  return (
    <div className="rounded-[12px] overflow-hidden" style={{ border:'1px solid var(--sep)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background:'var(--bg-2)', borderBottom:'1px solid var(--sep)' }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color:'var(--label-3)' }}>
          {bloco.tipo==='texto'?'📝 Texto':bloco.tipo==='imagem'?'🖼️ Imagem':bloco.tipo==='botao'?'🔘 Botão':'🔗 Link'}
        </span>
        <button onClick={onDelete} className="p-0.5 rounded-[4px]" style={{ color:'var(--label-4)' }}>
          <X size={11}/>
        </button>
      </div>
      <div className="p-3 space-y-2" style={{ background:'var(--bg-3)' }}>
        {bloco.tipo === 'texto' && <>
          <textarea id={`ta-${bloco.id}`} value={bloco.conteudo||''} rows={4}
            onChange={e => onChange({...bloco, conteudo:e.target.value})}
            placeholder="Digite o texto... Use *negrito*"
            style={{ ...inp, resize:'none', lineHeight:1.6, fontFamily:'inherit' }}/>
          <div className="flex flex-wrap gap-1">
            {vars.map(v => (
              <button key={v} onClick={() => inserir(v)}
                className="px-1.5 py-0.5 rounded-[5px] text-[9px] font-mono transition-all hover:scale-105"
                style={{ background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
                {v}
              </button>
            ))}
          </div>
        </>}

        {bloco.tipo === 'imagem' && <>
          <input value={bloco.url||''} onChange={e=>onChange({...bloco,url:e.target.value})}
            placeholder="URL da imagem ou {{foto_produto}}" style={inp}/>
          <div className="flex gap-1 flex-wrap">
            {vars.filter(v=>v.includes('foto')||v.includes('imagem')).concat(['{{foto_produto}}']).slice(0,3).map(v=>(
              <button key={v} onClick={()=>onChange({...bloco,url:(bloco.url||'')+v})}
                className="px-1.5 py-0.5 rounded-[5px] text-[9px] font-mono"
                style={{ background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
                {v}
              </button>
            ))}
          </div>
          <input value={bloco.legenda||''} onChange={e=>onChange({...bloco,legenda:e.target.value})}
            placeholder="Legenda (opcional)" style={inp}/>
        </>}

        {bloco.tipo === 'botao' && <>
          <input value={bloco.texto||''} onChange={e=>onChange({...bloco,texto:e.target.value})}
            placeholder="Texto do botão (máx. 20 chars)" maxLength={20} style={inp}/>
          <div className="grid grid-cols-3 gap-1.5">
            {[['url','🔗 Link'],['reply','💬 Resposta'],['tel','📞 Ligar']].map(([v,l])=>(
              <button key={v} onClick={()=>onChange({...bloco,acao:v})}
                className="py-1.5 rounded-[8px] text-[10px] font-medium transition-all"
                style={{
                  background: bloco.acao===v?'var(--accent-dim)':'var(--bg)',
                  color:      bloco.acao===v?'var(--accent)':'var(--label-3)',
                  border:     bloco.acao===v?'1px solid var(--accent-border)':'1px solid var(--sep)',
                }}>{l}</button>
            ))}
          </div>
          {(bloco.acao==='url'||bloco.acao==='tel') && (
            <div className="space-y-1.5">
              <input value={bloco.valor||''} onChange={e=>onChange({...bloco,valor:e.target.value})}
                placeholder={bloco.acao==='tel'?'Número':'URL destino'} style={inp}/>
              <div className="flex flex-wrap gap-1">
                {vars.filter(v=>v.includes('link')).map(v=>(
                  <button key={v} onClick={()=>onChange({...bloco,valor:(bloco.valor||'')+v})}
                    className="px-1.5 py-0.5 rounded-[5px] text-[9px] font-mono"
                    style={{ background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>}
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function PageTransacional({ api: apiProp }) {
  const api = apiProp || BASE
  const [configs,    setConfigs]    = useState({}) // {id: {ativo, blocos}}
  const [selId,      setSelId]      = useState('pedido_criado')
  const [editando,   setEditando]   = useState(null)
  const [salvando,   setSalvando]   = useState(false)
  const [salvoOk,    setSalvoOk]    = useState(false)
  const [gerando,    setGerando]    = useState(false)
  const [telTeste,   setTelTeste]   = useState('')
  const [enviandoT,  setEnviandoT]  = useState(false)
  const [resTeste,   setResTeste]   = useState(null)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/templates`)
      if (r.ok) {
        const d = await r.json()
        const map = {}
        for (const t of d.templates || []) {
          if (t.gatilho) map[t.gatilho] = { id: t.id, ativo: t.ativo, blocos: t.blocos || [] }
        }
        setConfigs(map)
      }
    } catch {}
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  const gatilho = GATILHOS.find(g => g.id === selId)
  const config  = configs[selId]
  const blocos  = editando ?? (config?.blocos || gatilho?.padrao?.blocos || [])
  const ativo   = config?.ativo ?? false

  const setBlocos = (b) => setEditando(b)
  const addBloco  = (tipo) => setBlocos([...blocos, { tipo, conteudo:'', id:Date.now() }])
  const delBloco  = (i)   => setBlocos(blocos.filter((_,j)=>j!==i))
  const updBloco  = (i,b) => setBlocos(blocos.map((x,j)=>j===i?b:x))

  const toggleAtivo = async (gId) => {
    const c = configs[gId]
    if (!c) return
    const novo = !c.ativo
    setConfigs(prev => ({ ...prev, [gId]: { ...c, ativo: novo } }))
    await fetch(`${api}/api/templates/${c.id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ativo: novo })
    }).catch(()=>{})
  }

  const salvar = async () => {
    if (!gatilho) return
    setSalvando(true)
    try {
      const existe = configs[selId]
      const url    = existe ? `${api}/api/templates/${existe.id}` : `${api}/api/templates`
      const method = existe ? 'PATCH' : 'POST'
      await fetch(url, {
        method, headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ gatilho: selId, nome: gatilho.label, blocos, ativo: config?.ativo ?? true })
      })
      setSalvoOk(true)
      setEditando(null)
      await carregar()
      setTimeout(() => setSalvoOk(false), 2000)
    } catch {}
    setSalvando(false)
  }

  const gerarIA = async () => {
    if (!gatilho) return
    setGerando(true)
    try {
      const r = await fetch(`${api}/api/templates/gerar`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ nome: gatilho.label, gatilho: gatilho.id, descricao: gatilho.desc })
      })
      const d = await r.json()
      if (d.blocos) setBlocos(d.blocos.map((b,i)=>({...b, id:Date.now()+i})))
    } catch {}
    setGerando(false)
  }

  const testar = async () => {
    if (!telTeste.trim() || !gatilho) return
    setEnviandoT(true); setResTeste(null)
    try {
      const texto = blocos.filter(b=>b.tipo==='texto')
        .map(b => resolver(b.conteudo||'')).join('\n\n')
      const r = await fetch(`${api}/api/dashboard/enviar`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ telefone: telTeste.replace(/\D/g,''), mensagem: texto })
      })
      setResTeste(r.ok ? 'ok' : 'erro')
    } catch { setResTeste('erro') }
    setEnviandoT(false)
  }

  return (
    <div className="h-full flex overflow-hidden" style={{ background:'var(--bg)' }}>

      {/* ── Painel esquerdo ────────────────────────────────────────── */}
      <div className="w-[240px] flex-shrink-0 flex flex-col"
        style={{ borderRight:'1px solid var(--sep)', background:'var(--bg-2)' }}>

        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)' }}>
          <div className="flex items-center gap-2 mb-0.5">
            <Zap size={14} style={{ color:'var(--accent)' }}/>
            <span className="text-[15px] font-bold" style={{ color:'var(--label)' }}>Gatilhos</span>
          </div>
          <p className="text-[11px]" style={{ color:'var(--label-3)' }}>
            {Object.values(configs).filter(c=>c.ativo).length} ativos · {GATILHOS.length} disponíveis
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {GRUPOS.map(grupo => {
            const itens = GATILHOS.filter(g=>g.grupo===grupo)
            return (
              <div key={grupo}>
                <p className="px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest"
                  style={{ color:'var(--label-4)' }}>{grupo}</p>
                {itens.map(g => {
                  const c   = configs[g.id]
                  const sel = selId === g.id
                  const Ic  = g.icon
                  return (
                    <div key={g.id}
                      className="flex items-center transition-all"
                      style={{
                        background: sel ? `${g.cor}12` : 'transparent',
                        borderRight: sel ? `2px solid ${g.cor}` : '2px solid transparent',
                      }}>
                      <button onClick={() => { setSelId(g.id); setEditando(null) }}
                        className="flex-1 flex items-center gap-2.5 px-4 py-2.5 text-left">
                        <div className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
                          style={{ background: sel?g.corBg:'var(--fill)', border:`1px solid ${sel?g.cor+'50':'var(--sep)'}` }}>
                          <Ic size={13} style={{ color: sel?g.cor:'var(--label-3)' }}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold truncate"
                            style={{ color: sel?g.cor:'var(--label)' }}>{g.label}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: c ? (c.ativo?'#22c55e':'var(--label-4)') : 'var(--sep)' }}/>
                            <span className="text-[9px] truncate" style={{ color:'var(--label-4)' }}>
                              {c ? (c.ativo?'Ativo':'Inativo') : 'Não configurado'}
                            </span>
                          </div>
                        </div>
                      </button>
                      {/* Toggle rápido */}
                      {c && (
                        <button onClick={() => toggleAtivo(g.id)}
                          className="p-2 flex-shrink-0 transition-all"
                          title={c.ativo?'Desativar':'Ativar'}
                          style={{ color: c.ativo ? '#22c55e' : 'var(--label-4)' }}>
                          {c.ativo ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Painel central: editor ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
          {gatilho && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[11px] flex items-center justify-center"
                style={{ background:gatilho.corBg, border:`1.5px solid ${gatilho.cor}40` }}>
                <gatilho.icon size={16} style={{ color:gatilho.cor }}/>
              </div>
              <div>
                <h3 className="text-[15px] font-bold" style={{ color:'var(--label)' }}>{gatilho.label}</h3>
                <p className="text-[11px]" style={{ color:'var(--label-3)' }}>{gatilho.desc}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {config && (
              <button onClick={() => toggleAtivo(selId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-medium transition-all"
                style={{
                  background: config.ativo?'rgba(34,197,94,0.1)':'var(--fill)',
                  color:      config.ativo?'#22c55e':'var(--label-3)',
                  border:     config.ativo?'1px solid rgba(34,197,94,0.3)':'1px solid var(--sep)',
                }}>
                {config.ativo ? <ToggleRight size={14}/> : <ToggleLeft size={14}/>}
                {config.ativo ? 'Ativo' : 'Inativo'}
              </button>
            )}
            {editando !== null && (
              <button onClick={() => setEditando(null)}
                className="px-3 py-1.5 rounded-[9px] text-[12px]"
                style={{ background:'var(--fill)', color:'var(--label-3)' }}>
                Cancelar
              </button>
            )}
            <button onClick={salvar} disabled={salvando || editando === null}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all"
              style={{
                background: salvoOk?'#22c55e': editando!==null?'var(--accent)':'var(--fill)',
                color:      editando!==null?'#000':'var(--label-3)',
                opacity:    editando===null?0.5:1,
              }}>
              {salvando?<RefreshCw size={13} className="animate-spin"/>:salvoOk?<CheckCircle size={13}/>:<Save size={13}/>}
              {salvoOk?'Salvo!':'Salvar'}
            </button>
          </div>
        </div>

        {/* Corpo: editor + preview */}
        <div className="flex-1 overflow-hidden flex">

          {/* Editor */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4"
            style={{ borderRight:'1px solid var(--sep)' }}>

            {/* Gerar IA */}
            <button onClick={gerarIA} disabled={gerando}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[11px] text-[13px] font-semibold transition-all"
              style={{ background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
              {gerando?<RefreshCw size={13} className="animate-spin"/>:<Sparkles size={13}/>}
              {gerando?'Gerando com IA...':'✨ Gerar mensagem com IA'}
            </button>

            {/* Blocos */}
            <div className="space-y-3">
              {blocos.map((b,i) => (
                <BlocoEditor key={b.id||i} bloco={b} vars={gatilho?.variaveis||[]}
                  onChange={nb=>updBloco(i,nb)} onDelete={()=>delBloco(i)}/>
              ))}
            </div>

            {/* Adicionar bloco */}
            <div className="grid grid-cols-4 gap-2">
              {[['texto','Texto',FileText],['imagem','Imagem',Image],['botao','Botão',MousePointer],['link','Link',Link]].map(([tipo,lb,Ic])=>(
                <button key={tipo} onClick={()=>addBloco(tipo)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-[9px] text-[10px] font-medium transition-all"
                  style={{ background:'var(--bg-2)', border:'1px dashed var(--sep)', color:'var(--label-3)' }}>
                  <Ic size={13}/>{lb}
                </button>
              ))}
            </div>

            {/* Teste de envio */}
            <div className="rounded-[12px] p-4 space-y-3"
              style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
              <p className="text-[12px] font-semibold" style={{ color:'var(--label-2)' }}>Testar envio</p>
              <div className="flex gap-2">
                <input value={telTeste} onChange={e=>setTelTeste(e.target.value)}
                  placeholder="5511999999999"
                  className="flex-1 px-3 py-2 rounded-[9px] text-[12px] outline-none"
                  style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
                <button onClick={testar} disabled={enviandoT||!telTeste.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-[12px] font-semibold"
                  style={{ background:'var(--blue)', color:'#fff', opacity:!telTeste.trim()?0.5:1 }}>
                  {enviandoT?<RefreshCw size={12} className="animate-spin"/>:<Send size={12}/>}
                  Testar
                </button>
              </div>
              {resTeste && (
                <p className="text-[11px] font-medium"
                  style={{ color: resTeste==='ok'?'#22c55e':'var(--red)' }}>
                  {resTeste==='ok'?'✓ Enviado com sucesso!':'✗ Erro ao enviar'}
                </p>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="w-[280px] flex-shrink-0 flex flex-col overflow-hidden">
            <div className="px-4 py-3 flex-shrink-0"
              style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color:'var(--label-3)' }}>
                Preview ao vivo
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex items-start justify-center"
              style={{ background:'var(--bg-3)' }}>
              <PreviewWA blocos={blocos} label={gatilho?.label}/>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
