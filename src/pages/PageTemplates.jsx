import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Plus, Trash2, Save, X, Sparkles, Image, FileText, Play,
  Toggle3, MousePointer, Link, Phone, Reply, Eye, EyeOff,
  ChevronDown, ChevronUp, RefreshCw, Copy, CheckCircle,
  AlertCircle, Zap, ToggleLeft, ToggleRight, GripVertical,
  MessageSquare, Send, Code, Hash
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Alias disponíveis ──────────────────────────────────────────────────────────
const ALIASES = [
  { grupo: 'Cliente',    itens: ['{{nome_cliente}}','{{primeiro_nome}}','{{email_cliente}}','{{telefone_cliente}}'] },
  { grupo: 'Pedido',     itens: ['{{numero_pedido}}','{{data_pedido}}','{{status_pedido}}','{{valor_total}}','{{forma_pagamento}}'] },
  { grupo: 'Produto',    itens: ['{{nome_produto}}','{{preco_produto}}','{{preco_pix}}','{{preco_cartao}}','{{foto_produto}}','{{link_produto}}'] },
  { grupo: 'Entrega',    itens: ['{{transportadora}}','{{codigo_rastreio}}','{{link_rastreio}}','{{prazo_entrega}}','{{status_entrega}}'] },
  { grupo: 'Loja',       itens: ['{{nome_loja}}','{{telefone_loja}}','{{site_loja}}','{{endereco_loja}}'] },
]

const GATILHOS = [
  { id:'pedido_criado',      label:'Pedido criado',          icon:'🛍️', desc:'Quando um pedido é gerado no Bling' },
  { id:'pedido_faturado',    label:'Pedido faturado',         icon:'📄', desc:'Quando a NF-e é emitida' },
  { id:'pedido_enviado',     label:'Pedido enviado',          icon:'📦', desc:'Quando o pedido é despachado' },
  { id:'pedido_entregue',    label:'Pedido entregue',         icon:'✅', desc:'Quando a entrega é confirmada' },
  { id:'pagamento_aprovado', label:'Pagamento aprovado',      icon:'💰', desc:'Quando o PIX ou cartão é confirmado' },
  { id:'avise_me',           label:'Produto disponível',      icon:'🔔', desc:'Quando produto volta ao estoque' },
  { id:'boas_vindas',        label:'Boas-vindas',             icon:'👋', desc:'Primeira mensagem do cliente' },
  { id:'manual',             label:'Envio manual',            icon:'✉️',  desc:'Disparado manualmente pelo atendente' },
]

const TIPOS_BLOCO = [
  { id:'texto',  label:'Texto',   icon: FileText  },
  { id:'imagem', label:'Imagem',  icon: Image     },
  { id:'botao',  label:'Botão',   icon: MousePointer },
  { id:'link',   label:'Link',    icon: Link      },
]

function TagAlias({ onInsert }) {
  const [aberto, setAberto] = useState(false)
  const [busca,  setBusca]  = useState('')
  const todos = ALIASES.flatMap(g => g.itens)
  const filtrados = busca
    ? todos.filter(a => a.includes(busca.replace(/[{}]/g,'')))
    : null

  return (
    <div className="relative">
      <button onClick={() => setAberto(v=>!v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold transition-all"
        style={{ background:'var(--fill)', color:'var(--label-2)', border:'1px solid var(--sep)' }}>
        <Hash size={11}/> Variável
      </button>
      {aberto && (
        <div className="absolute bottom-full mb-2 left-0 w-[280px] rounded-[14px] shadow-xl overflow-hidden z-50"
          style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
          <div className="p-2" style={{ borderBottom:'1px solid var(--sep)' }}>
            <input value={busca} onChange={e=>setBusca(e.target.value)}
              placeholder="Buscar variável..."
              className="w-full px-2.5 py-1.5 rounded-[7px] text-[12px] outline-none"
              style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
          </div>
          <div className="max-h-[240px] overflow-y-auto p-2 space-y-2">
            {(filtrados ? [{ grupo:'Resultados', itens:filtrados }] : ALIASES).map(g => (
              <div key={g.grupo}>
                <div className="text-[10px] font-semibold px-2 py-1 uppercase tracking-wider"
                  style={{ color:'var(--label-4)' }}>{g.grupo}</div>
                {g.itens.map(a => (
                  <button key={a} onClick={() => { onInsert(a); setAberto(false); setBusca('') }}
                    className="w-full text-left px-2.5 py-1.5 rounded-[7px] text-[11px] font-mono hover:bg-[var(--fill)] transition-all"
                    style={{ color:'var(--accent)' }}>
                    {a}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BlocoTexto({ bloco, onChange, onDelete }) {
  const ref = useRef(null)
  const inserirAlias = (alias) => {
    const el = ref.current
    if (!el) return
    const s = el.selectionStart, e = el.selectionEnd
    const novo = bloco.conteudo.slice(0,s) + alias + bloco.conteudo.slice(e)
    onChange({ ...bloco, conteudo: novo })
    setTimeout(() => { el.focus(); el.setSelectionRange(s+alias.length, s+alias.length) }, 0)
  }

  // Highlight aliases no preview
  const renderizado = bloco.conteudo.replace(
    /\{\{([^}]+)\}\}/g,
    '<span style="background:var(--accent-dim);color:var(--accent);padding:0 3px;border-radius:4px;font-family:monospace;font-size:11px">{{$1}}</span>'
  )

  return (
    <div className="space-y-2">
      <textarea ref={ref}
        value={bloco.conteudo}
        onChange={e => onChange({ ...bloco, conteudo: e.target.value })}
        rows={4}
        placeholder="Digite o texto da mensagem... Use {{variável}} para personalizar"
        className="w-full px-3 py-2.5 rounded-[10px] text-[13px] outline-none resize-none"
        style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)', lineHeight:1.6 }}/>
      <div className="flex items-center justify-between">
        <TagAlias onInsert={inserirAlias}/>
        <div className="flex items-center gap-1.5">
          <select value={bloco.bold ? 'bold' : 'normal'}
            onChange={e => onChange({ ...bloco, bold: e.target.value==='bold' })}
            className="px-2 py-1 rounded-[7px] text-[11px] outline-none"
            style={{ background:'var(--fill)', color:'var(--label-2)', border:'1px solid var(--sep)' }}>
            <option value="normal">Normal</option>
            <option value="bold">Negrito</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function BlocoImagem({ bloco, onChange }) {
  return (
    <div className="space-y-2">
      <input value={bloco.url || ''} onChange={e => onChange({...bloco, url: e.target.value})}
        placeholder="URL da imagem ou {{foto_produto}}"
        className="w-full px-3 py-2 rounded-[10px] text-[12px] outline-none font-mono"
        style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
      <div className="flex gap-2 items-center">
        <TagAlias onInsert={v => onChange({...bloco, url: (bloco.url||'')+v})}/>
        {bloco.url && (
          <div className="flex-1 rounded-[8px] overflow-hidden"
            style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', height:40 }}>
            <img src={bloco.url} alt="" className="h-full object-contain w-full"
              onError={e => e.target.style.display='none'}/>
          </div>
        )}
      </div>
      <input value={bloco.legenda || ''} onChange={e => onChange({...bloco, legenda: e.target.value})}
        placeholder="Legenda (opcional)"
        className="w-full px-3 py-2 rounded-[10px] text-[12px] outline-none"
        style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
    </div>
  )
}

function BlocoBotao({ bloco, onChange }) {
  return (
    <div className="space-y-2">
      <input value={bloco.texto || ''} onChange={e => onChange({...bloco, texto: e.target.value})}
        placeholder="Texto do botão"
        className="w-full px-3 py-2 rounded-[10px] text-[13px] outline-none"
        style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
      <select value={bloco.acao || 'url'} onChange={e => onChange({...bloco, acao: e.target.value})}
        className="w-full px-3 py-2 rounded-[10px] text-[12px] outline-none"
        style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}>
        <option value="url">Abrir link</option>
        <option value="tel">Ligar</option>
        <option value="reply">Resposta rápida</option>
      </select>
      <input value={bloco.valor || ''} onChange={e => onChange({...bloco, valor: e.target.value})}
        placeholder={bloco.acao==='tel'?'Número de telefone':bloco.acao==='reply'?'Texto da resposta':'URL do link'}
        className="w-full px-3 py-2 rounded-[10px] text-[12px] outline-none font-mono"
        style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
    </div>
  )
}

function Bloco({ bloco, idx, total, onChange, onDelete, onMove }) {
  const [aberto, setAberto] = useState(true)
  const iconeTipo = TIPOS_BLOCO.find(t=>t.id===bloco.tipo)
  const Icone = iconeTipo?.icon || FileText

  return (
    <div className="rounded-[14px] overflow-hidden transition-all"
      style={{ border:'1px solid var(--sep)', background:'var(--bg-2)' }}>
      {/* Header do bloco */}
      <div className="flex items-center gap-2 px-3 py-2.5"
        style={{ borderBottom: aberto ? '1px solid var(--sep)' : 'none', background:'var(--bg-3)' }}>
        <div className="p-1 cursor-grab" style={{ color:'var(--label-4)' }}>
          <GripVertical size={13}/>
        </div>
        <div className="w-6 h-6 rounded-[6px] flex items-center justify-center"
          style={{ background:'var(--accent-dim)' }}>
          <Icone size={12} style={{ color:'var(--accent)' }}/>
        </div>
        <span className="flex-1 text-[12px] font-medium" style={{ color:'var(--label-2)' }}>
          {iconeTipo?.label}
          {bloco.tipo==='texto' && bloco.conteudo && (
            <span className="ml-2 font-normal" style={{ color:'var(--label-4)' }}>
              — {bloco.conteudo.slice(0,40).replace(/\n/g,' ')}{bloco.conteudo.length>40?'…':''}
            </span>
          )}
        </span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => onMove(idx,-1)} disabled={idx===0}
            className="p-1 rounded-[5px] disabled:opacity-20" style={{ color:'var(--label-3)' }}>
            <ChevronUp size={12}/>
          </button>
          <button onClick={() => onMove(idx,1)} disabled={idx===total-1}
            className="p-1 rounded-[5px] disabled:opacity-20" style={{ color:'var(--label-3)' }}>
            <ChevronDown size={12}/>
          </button>
          <button onClick={() => setAberto(v=>!v)} className="p-1 rounded-[5px]" style={{ color:'var(--label-3)' }}>
            {aberto ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
          </button>
          <button onClick={onDelete} className="p-1 rounded-[5px]" style={{ color:'var(--label-3)' }}>
            <X size={12}/>
          </button>
        </div>
      </div>
      {/* Conteúdo do bloco */}
      {aberto && (
        <div className="p-3">
          {bloco.tipo === 'texto'  && <BlocoTexto  bloco={bloco} onChange={onChange} onDelete={onDelete}/>}
          {bloco.tipo === 'imagem' && <BlocoImagem bloco={bloco} onChange={onChange}/>}
          {bloco.tipo === 'botao'  && <BlocoBotao  bloco={bloco} onChange={onChange}/>}
          {bloco.tipo === 'link'   && (
            <div className="space-y-2">
              <input value={bloco.url||''} onChange={e=>onChange({...bloco,url:e.target.value})}
                placeholder="URL (ex: {{link_produto}} ou https://...)"
                className="w-full px-3 py-2 rounded-[10px] text-[12px] font-mono outline-none"
                style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PreviewWhatsApp({ blocos, nome }) {
  const hora = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
  const amostras = {
    '{{nome_cliente}}':'Maria',     '{{primeiro_nome}}':'Maria',
    '{{numero_pedido}}':'224307',   '{{valor_total}}':'R$ 47,52',
    '{{status_pedido}}':'Enviado',  '{{codigo_rastreio}}':'BR123456789BR',
    '{{nome_produto}}':'Fio de Seda Preto', '{{preco_produto}}':'R$ 11,62',
    '{{preco_pix}}':'R$ 10,46',    '{{preco_cartao}}':'R$ 11,62',
    '{{link_produto}}':'https://loja.com/produto/123',
    '{{link_rastreio}}':'https://rastreamento.correios.com.br',
    '{{transportadora}}':'Correios', '{{prazo_entrega}}':'5 dias úteis',
    '{{nome_loja}}':'Sostrass',     '{{foto_produto}}':'https://via.placeholder.com/300x200',
  }
  const resolver = (txt='') => txt.replace(/\{\{([^}]+)\}\}/g, (_,k) => amostras[`{{${k}}}`]||`{{${k}}}`)

  return (
    <div className="rounded-[18px] overflow-hidden"
      style={{ background:'#0a1929', maxWidth:320, margin:'0 auto' }}>
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2"
        style={{ background:'#075E54' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold"
            style={{ background:'#128C7E' }}>S</div>
          <div>
            <div className="text-[13px] font-semibold text-white">{nome||'Template'}</div>
            <div className="text-[10px]" style={{ color:'#a8d5cf' }}>online</div>
          </div>
        </div>
        <div className="text-[11px]" style={{ color:'#a8d5cf' }}>{hora}</div>
      </div>
      {/* Mensagem */}
      <div className="p-3" style={{ background:'#0d1b2a', minHeight:120 }}>
        <div className="rounded-[12px] rounded-tl-[4px] p-3 max-w-[260px]"
          style={{ background:'#1f2c34' }}>
          {blocos.map((b, i) => (
            <div key={i} className="mb-2 last:mb-0">
              {b.tipo === 'texto' && (
                <p className="text-[13px] leading-relaxed" style={{ color:'#e9edef' }}
                  dangerouslySetInnerHTML={{ __html: resolver(b.conteudo||'').replace(/\n/g,'<br/>').replace(/\*([^*]+)\*/g,'<strong>$1</strong>') }}/>
              )}
              {b.tipo === 'imagem' && b.url && (
                <div className="rounded-[8px] overflow-hidden mb-1">
                  <img src={resolver(b.url)} alt="" className="w-full object-cover"
                    style={{ maxHeight:150 }} onError={e=>e.target.style.display='none'}/>
                  {b.legenda && <p className="text-[11px] px-1 pt-1" style={{ color:'#8696a0' }}>{resolver(b.legenda)}</p>}
                </div>
              )}
              {b.tipo === 'botao' && (
                <div className="mt-2 pt-2" style={{ borderTop:'1px solid #2a3942' }}>
                  <button className="w-full py-2 text-[13px] font-medium rounded-[6px] transition-all"
                    style={{ color:'#00a884', background:'transparent' }}>
                    {resolver(b.texto)||'Botão'}
                  </button>
                </div>
              )}
              {b.tipo === 'link' && (
                <p className="text-[12px]" style={{ color:'#53bdeb', textDecoration:'underline' }}>
                  {resolver(b.url)||'https://...'}
                </p>
              )}
            </div>
          ))}
          <div className="flex justify-end mt-1">
            <span className="text-[10px]" style={{ color:'#8696a0' }}>{hora} ✓✓</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalTemplate({ template, onSave, onClose, api }) {
  const isNovo = !template?.id
  const [form, setForm] = useState({
    nome:      template?.nome     || '',
    gatilho:   template?.gatilho  || '',
    blocos:    template?.blocos   || [{ tipo:'texto', conteudo:'', id: Date.now() }],
    ativo:     template?.ativo    !== false,
    descricao: template?.descricao|| '',
  })
  const [aba,     setAba]     = useState('editor') // editor | preview | codigo
  const [salvando,setSalvando]= useState(false)
  const [gerando, setGerando] = useState(false)
  const [erro,    setErro]    = useState('')

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const addBloco = (tipo) => set('blocos', [...form.blocos, { tipo, conteudo:'', id:Date.now() }])
  const delBloco = (i)    => set('blocos', form.blocos.filter((_,j)=>j!==i))
  const updBloco = (i,b)  => set('blocos', form.blocos.map((x,j)=>j===i?b:x))
  const moveBloco= (i,d)  => {
    const arr = [...form.blocos], t = i+d
    if (t<0||t>=arr.length) return
    ;[arr[i],arr[t]]=[arr[t],arr[i]]; set('blocos',arr)
  }

  const gerarComIA = async () => {
    if (!form.gatilho && !form.nome) { setErro('Informe o nome ou gatilho'); return }
    setGerando(true); setErro('')
    try {
      const r = await fetch(`${api}/api/templates/gerar`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ nome:form.nome, gatilho:form.gatilho, descricao:form.descricao })
      })
      const d = await r.json()
      if (d.blocos) set('blocos', d.blocos)
    } catch { setErro('Erro ao gerar template') }
    setGerando(false)
  }

  const salvar = async () => {
    if (!form.nome.trim())    { setErro('Nome obrigatório'); return }
    if (!form.blocos.length)  { setErro('Adicione pelo menos um bloco'); return }
    setSalvando(true); setErro('')
    try {
      const url    = isNovo ? `${api}/api/templates` : `${api}/api/templates/${template.id}`
      const method = isNovo ? 'POST' : 'PATCH'
      const r = await fetch(url, {
        method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(form)
      })
      if (!r.ok) throw new Error('Erro ao salvar')
      onSave()
    } catch (e) { setErro(e.message) }
    setSalvando(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'stretch', justifyContent:'flex-end' }}>
      <div className="flex flex-col h-full w-full max-w-[900px]"
        style={{ background:'var(--bg)', borderLeft:'1px solid var(--sep)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
              style={{ background:'var(--accent-dim)' }}>
              <MessageSquare size={15} style={{ color:'var(--accent)' }}/>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold" style={{ color:'var(--label)' }}>
                {isNovo ? 'Novo Template HSM' : 'Editar Template'}
              </h3>
              <p className="text-[11px]" style={{ color:'var(--label-3)' }}>
                Mensagem estruturada para WhatsApp Business
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 rounded-[8px]" style={{ color:'var(--label-3)' }}>
              <X size={16}/>
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-1 px-6 pt-3 flex-shrink-0">
          {[['editor','Editor'],['preview','Preview'],['codigo','Variáveis']].map(([id,lb])=>(
            <button key={id} onClick={()=>setAba(id)}
              className="px-4 py-2 rounded-[9px] text-[12px] font-medium transition-all"
              style={{
                background: aba===id ? 'var(--accent-dim)' : 'transparent',
                color:      aba===id ? 'var(--accent)' : 'var(--label-3)',
                border:     aba===id ? '1px solid var(--accent-border)' : '1px solid transparent',
              }}>
              {lb}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-hidden flex">

          {/* Editor */}
          {aba === 'editor' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Nome + Gatilho */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium" style={{ color:'var(--label-2)' }}>Nome do template</label>
                  <input value={form.nome} onChange={e=>set('nome',e.target.value)}
                    placeholder="Ex: Pedido Confirmado"
                    className="w-full px-3 py-2.5 rounded-[10px] text-[13px] outline-none"
                    style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium" style={{ color:'var(--label-2)' }}>Gatilho de disparo</label>
                  <select value={form.gatilho} onChange={e=>set('gatilho',e.target.value)}
                    className="w-full px-3 py-2.5 rounded-[10px] text-[13px] outline-none"
                    style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', color:'var(--label)' }}>
                    <option value="">Selecione o gatilho...</option>
                    {GATILHOS.map(g=>(
                      <option key={g.id} value={g.id}>{g.icon} {g.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium" style={{ color:'var(--label-2)' }}>Descrição</label>
                <input value={form.descricao} onChange={e=>set('descricao',e.target.value)}
                  placeholder="Para que serve este template?"
                  className="w-full px-3 py-2.5 rounded-[10px] text-[13px] outline-none"
                  style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
              </div>

              {/* Gerar com IA */}
              <button onClick={gerarComIA} disabled={gerando}
                className="w-full py-2.5 rounded-[10px] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
                {gerando ? <RefreshCw size={13} className="animate-spin"/> : <Sparkles size={13}/>}
                {gerando ? 'Gerando template com IA...' : '✨ Gerar conteúdo com IA'}
              </button>

              {/* Blocos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium" style={{ color:'var(--label-2)' }}>
                    Blocos da mensagem
                  </label>
                  <span className="text-[11px]" style={{ color:'var(--label-4)' }}>
                    {form.blocos.length} bloco(s)
                  </span>
                </div>

                {form.blocos.map((b,i) => (
                  <Bloco key={b.id||i} bloco={b} idx={i} total={form.blocos.length}
                    onChange={nb=>updBloco(i,nb)}
                    onDelete={()=>delBloco(i)}
                    onMove={(_, d)=>moveBloco(i,d)}/>
                ))}

                {/* Adicionar bloco */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {TIPOS_BLOCO.map(t => {
                    const Ic = t.icon
                    return (
                      <button key={t.id} onClick={() => addBloco(t.id)}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-[10px] text-[11px] font-medium transition-all group"
                        style={{ background:'var(--bg-2)', border:'1px dashed var(--sep)', color:'var(--label-3)' }}>
                        <Ic size={15} className="group-hover:scale-110 transition-transform"/>
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {erro && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-[9px] text-[12px]"
                  style={{ background:'rgba(239,68,68,0.1)', color:'var(--red)' }}>
                  <AlertCircle size={13}/> {erro}
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {aba === 'preview' && (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
              <p className="text-[12px] mb-6 text-center" style={{ color:'var(--label-3)' }}>
                Preview com dados de exemplo. Variáveis são substituídas automaticamente.
              </p>
              <PreviewWhatsApp blocos={form.blocos} nome={form.nome}/>
              <div className="mt-6 rounded-[12px] p-3 w-full max-w-[320px]"
                style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                <p className="text-[11px] font-semibold mb-2" style={{ color:'var(--label-2)' }}>Gatilho</p>
                {form.gatilho ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[15px]">{GATILHOS.find(g=>g.id===form.gatilho)?.icon}</span>
                    <div>
                      <p className="text-[12px] font-medium" style={{ color:'var(--label)' }}>
                        {GATILHOS.find(g=>g.id===form.gatilho)?.label}
                      </p>
                      <p className="text-[11px]" style={{ color:'var(--label-3)' }}>
                        {GATILHOS.find(g=>g.id===form.gatilho)?.desc}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px]" style={{ color:'var(--label-4)' }}>Nenhum gatilho selecionado</p>
                )}
              </div>
            </div>
          )}

          {/* Variáveis */}
          {aba === 'codigo' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-[13px]" style={{ color:'var(--label-2)' }}>
                Use estas variáveis nos blocos de texto. Elas são substituídas automaticamente com dados reais no momento do envio.
              </p>
              {ALIASES.map(g => (
                <div key={g.grupo} className="rounded-[12px] overflow-hidden"
                  style={{ border:'1px solid var(--sep)' }}>
                  <div className="px-4 py-2.5 flex items-center gap-2"
                    style={{ background:'var(--bg-2)', borderBottom:'1px solid var(--sep)' }}>
                    <span className="text-[12px] font-semibold" style={{ color:'var(--label)' }}>{g.grupo}</span>
                  </div>
                  <div className="p-2 grid grid-cols-2 gap-1">
                    {g.itens.map(a => (
                      <div key={a} className="flex items-center justify-between px-2.5 py-1.5 rounded-[7px]"
                        style={{ background:'var(--bg-3)' }}>
                        <code className="text-[11px]" style={{ color:'var(--accent)' }}>{a}</code>
                        <button onClick={() => navigator.clipboard?.writeText(a)}
                          className="p-1 rounded-[5px]" style={{ color:'var(--label-4)' }}>
                          <Copy size={10}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderTop:'1px solid var(--sep)', background:'var(--bg-2)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => set('ativo', !form.ativo)}
              className="flex items-center gap-2 text-[12px] font-medium"
              style={{ color: form.ativo ? 'var(--accent)' : 'var(--label-3)' }}>
              {form.ativo ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
              {form.ativo ? 'Ativo' : 'Inativo'}
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px]"
              style={{ background:'var(--fill)', color:'var(--label-2)' }}>
              Cancelar
            </button>
            <button onClick={salvar} disabled={salvando}
              className="px-5 py-2 rounded-[10px] text-[13px] font-semibold flex items-center gap-2"
              style={{ background:'var(--accent)', color:'#000' }}>
              {salvando ? <RefreshCw size={13} className="animate-spin"/> : <Save size={13}/>}
              {salvando ? 'Salvando...' : 'Salvar Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PageTemplates({ api: apiProp }) {
  const api = apiProp || BASE
  const [templates, setTemplates]  = useState([])
  const [loading,   setLoading]    = useState(true)
  const [modal,     setModal]      = useState(null)
  const [confirmar, setConfirmar]  = useState(null)
  const [busca,     setBusca]      = useState('')
  const [filtroGat, setFiltroGat]  = useState('')

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/templates`)
      if (r.ok) { const d = await r.json(); setTemplates(d.templates||[]) }
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  const toggleAtivo = async (t) => {
    setTemplates(prev => prev.map(x => x.id===t.id ? {...x, ativo:!x.ativo} : x))
    await fetch(`${api}/api/templates/${t.id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ativo:!t.ativo })
    }).catch(()=>{})
  }

  const deletar = async (t) => {
    await fetch(`${api}/api/templates/${t.id}`, { method:'DELETE' }).catch(()=>{})
    setConfirmar(null); carregar()
  }

  const filtrados = templates.filter(t =>
    (!busca || t.nome.toLowerCase().includes(busca.toLowerCase())) &&
    (!filtroGat || t.gatilho === filtroGat)
  )

  const gatilhosUsados = [...new Set(templates.map(t=>t.gatilho).filter(Boolean))]

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background:'var(--bg)' }}>

      {/* Header */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[22px] font-bold" style={{ color:'var(--label)' }}>Templates HSM</h2>
            <p className="text-[13px] mt-0.5" style={{ color:'var(--label-3)' }}>
              {templates.filter(t=>t.ativo).length} ativos · {templates.length} total
            </p>
          </div>
          <button onClick={() => setModal('novo')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[11px] text-[13px] font-semibold"
            style={{ background:'var(--accent)', color:'#000' }}>
            <Plus size={14}/> Novo Template
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <input value={busca} onChange={e=>setBusca(e.target.value)}
            placeholder="Buscar template..."
            className="flex-1 px-3 py-2 rounded-[9px] text-[12px] outline-none"
            style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
          <select value={filtroGat} onChange={e=>setFiltroGat(e.target.value)}
            className="px-3 py-2 rounded-[9px] text-[12px] outline-none"
            style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}>
            <option value="">Todos os gatilhos</option>
            {GATILHOS.filter(g=>gatilhosUsados.includes(g.id)).map(g=>(
              <option key={g.id} value={g.id}>{g.icon} {g.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex justify-center py-12" style={{ color:'var(--label-3)' }}>
            <RefreshCw size={16} className="animate-spin"/>
          </div>
        )}

        {!loading && filtrados.length === 0 && (
          <div className="flex flex-col items-center py-16">
            <MessageSquare size={32} className="mb-3 opacity-20" style={{ color:'var(--label)' }}/>
            <p className="text-[15px] font-medium" style={{ color:'var(--label-2)' }}>
              {templates.length === 0 ? 'Nenhum template criado' : 'Nenhum resultado'}
            </p>
            <p className="text-[13px] mt-1 mb-4" style={{ color:'var(--label-3)' }}>
              {templates.length === 0 ? 'Crie templates para automatizar mensagens' : 'Tente outro filtro'}
            </p>
            {templates.length === 0 && (
              <button onClick={()=>setModal('novo')}
                className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold"
                style={{ background:'var(--accent)', color:'#000' }}>
                <Plus size={13}/> Criar primeiro template
              </button>
            )}
          </div>
        )}

        <div className="grid gap-3">
          {filtrados.map(t => {
            const gatilho = GATILHOS.find(g=>g.id===t.gatilho)
            const textoBlocos = t.blocos?.filter(b=>b.tipo==='texto').map(b=>b.conteudo).join(' ')
            return (
              <div key={t.id}
                className="rounded-[16px] p-4 flex items-start gap-4 transition-all"
                style={{
                  background: 'var(--bg-2)', border:'1px solid var(--sep)',
                  borderLeft: `3px solid ${t.ativo ? 'var(--accent)' : 'var(--sep)'}`,
                  opacity: t.ativo ? 1 : 0.6,
                }}>

                {/* Ícone */}
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 text-[18px]"
                  style={{ background: t.ativo ? 'var(--accent-dim)' : 'var(--fill)' }}>
                  {gatilho?.icon || '📄'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-semibold" style={{ color:'var(--label)' }}>{t.nome}</span>
                    {!t.ativo && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background:'var(--fill)', color:'var(--label-3)' }}>Inativo</span>
                    )}
                  </div>

                  {gatilho && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Zap size={10} style={{ color:'var(--label-3)' }}/>
                      <span className="text-[11px]" style={{ color:'var(--label-3)' }}>
                        {gatilho.label} — {gatilho.desc}
                      </span>
                    </div>
                  )}

                  {textoBlocos && (
                    <p className="text-[12px] truncate" style={{ color:'var(--label-3)' }}>
                      {textoBlocos.slice(0,100)}…
                    </p>
                  )}

                  {/* Blocos badge */}
                  <div className="flex gap-1.5 mt-2">
                    {['texto','imagem','botao','link'].map(tipo => {
                      const n = t.blocos?.filter(b=>b.tipo===tipo).length || 0
                      if (!n) return null
                      const Ic = TIPOS_BLOCO.find(x=>x.id===tipo)?.icon || FileText
                      return (
                        <span key={tipo} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                          style={{ background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)' }}>
                          <Ic size={9}/> {n}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setModal(t)} title="Editar"
                    className="p-2 rounded-[8px]" style={{ color:'var(--label-3)' }}>
                    <Eye size={15}/>
                  </button>
                  <button onClick={() => toggleAtivo(t)} title={t.ativo?'Desativar':'Ativar'}
                    className="p-2 rounded-[8px]"
                    style={{ color: t.ativo ? 'var(--accent)' : 'var(--label-3)' }}>
                    {t.ativo ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                  </button>
                  <button onClick={() => setConfirmar(t)} title="Deletar"
                    className="p-2 rounded-[8px]" style={{ color:'var(--label-3)' }}>
                    <Trash2 size={15}/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal editor */}
      {modal && (
        <ModalTemplate
          template={modal==='novo' ? null : modal}
          api={api}
          onSave={() => { setModal(null); carregar() }}
          onClose={() => setModal(null)}/>
      )}

      {/* Confirmar deletar */}
      {confirmar && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="rounded-[16px] p-6 w-full max-w-[360px] space-y-4"
            style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
            <p className="text-[14px] font-semibold" style={{ color:'var(--label)' }}>
              Deletar "{confirmar.nome}"?
            </p>
            <p className="text-[12px]" style={{ color:'var(--label-2)' }}>
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmar(null)} className="flex-1 py-2.5 rounded-[10px] text-[13px]"
                style={{ background:'var(--fill)', color:'var(--label-2)' }}>Cancelar</button>
              <button onClick={()=>deletar(confirmar)} className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold"
                style={{ background:'rgba(239,68,68,0.15)', color:'var(--red)' }}>Deletar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
