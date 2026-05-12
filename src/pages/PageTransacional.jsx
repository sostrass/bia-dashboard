import { useState, useEffect, useCallback } from 'react'
import {
  Zap, Save, Send, RefreshCw, X, Sparkles, ToggleLeft, ToggleRight,
  CheckCircle, Plus, Image, FileText, MousePointer, Link,
  ShoppingBag, CreditCard, Truck, Bell, Star, Package, Clock,
  MessageSquare, AlertCircle
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const GATILHOS = [
  { id:'pedido_criado',      label:'Pedido Criado',         grupo:'Pedidos',       icon:ShoppingBag, cor:'#00d4aa', corBg:'rgba(0,212,170,0.1)',    desc:'Novo pedido gerado no Bling',              variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}','{{forma_pagamento}}','{{link_pedido}}'],          padrao:{ cabecalho:'🛒 Pedido Confirmado!',    imagem:'', corpo:'Olá *{{nome_cliente}}*!\n\nSeu pedido *#{{numero_pedido}}* foi criado com sucesso.\n\n💳 Total: *{{valor_total}}*\n💰 Pagamento: {{forma_pagamento}}',         rodape:'Mensagem automática — para dúvidas, responda aqui.', botoes:[{texto:'Ver pedido',    acao:'url',   valor:'{{link_pedido}}',  id:1}] }},
  { id:'pagamento_aprovado', label:'Pagamento Aprovado',    grupo:'Pedidos',       icon:CreditCard,  cor:'#4a9fff', corBg:'rgba(74,159,255,0.1)',    desc:'PIX ou cartão confirmado',                 variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}'],                                                   padrao:{ cabecalho:'✅ Pagamento Aprovado!',   imagem:'', corpo:'Olá *{{nome_cliente}}*!\n\nO pagamento do pedido *#{{numero_pedido}}* foi confirmado. 🎉\n\nJá estamos preparando seu pedido!',                       rodape:'Mensagem automática.', botoes:[] }},
  { id:'pagamento_pendente', label:'Pagamento Pendente',    grupo:'Pedidos',       icon:Clock,       cor:'#f59e0b', corBg:'rgba(245,158,11,0.1)',    desc:'Pedido aguardando pagamento',              variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{valor_total}}','{{link_pedido}}'],                                  padrao:{ cabecalho:'⏳ Pagamento Pendente',    imagem:'', corpo:'Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* aguarda pagamento.\n\nTotal: *{{valor_total}}*',                                                  rodape:'O link expira em 24 horas.', botoes:[{texto:'Pagar agora',acao:'url',valor:'{{link_pedido}}',id:1},{texto:'Preciso de ajuda',acao:'reply',valor:'Ajuda com pagamento',id:2}] }},
  { id:'pedido_enviado',     label:'Pedido Enviado',        grupo:'Entrega',       icon:Truck,       cor:'#a78bfa', corBg:'rgba(167,139,250,0.1)',   desc:'Pedido despachado com rastreio',           variaveis:['{{nome_cliente}}','{{numero_pedido}}','{{transportadora}}','{{codigo_rastreio}}','{{link_rastreio}}','{{prazo_entrega}}'], padrao:{ cabecalho:'🚚 Seu pedido foi enviado!', imagem:'', corpo:'Olá *{{nome_cliente}}*! O pedido *#{{numero_pedido}}* saiu para entrega.\n\n📦 Transportadora: {{transportadora}}\n🔍 Rastreio: *{{codigo_rastreio}}*\n📅 Prazo: *{{prazo_entrega}}*', rodape:'Continuaremos monitorando e te avisaremos quando chegar.', botoes:[{texto:'Rastrear pedido',acao:'url',valor:'{{link_rastreio}}',id:1}] }},
  { id:'pedido_entregue',    label:'Pedido Entregue',       grupo:'Entrega',       icon:Package,     cor:'#22c55e', corBg:'rgba(34,197,94,0.1)',     desc:'Entrega confirmada',                       variaveis:['{{nome_cliente}}','{{numero_pedido}}'],                                                                     padrao:{ cabecalho:'📦 Pedido entregue!',      imagem:'', corpo:'Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* foi entregue! 😊\n\nEsperamos que você goste muito!',                                              rodape:'Qualquer problema estamos à disposição.', botoes:[{texto:'Avaliar compra ⭐',acao:'reply',valor:'Quero avaliar',id:1},{texto:'Tive um problema',acao:'reply',valor:'Preciso de ajuda',id:2}] }},
  { id:'avise_me',           label:'Produto Disponível',    grupo:'Estoque',       icon:Bell,        cor:'#fb923c', corBg:'rgba(251,146,60,0.1)',    desc:'Produto voltou ao estoque (Avise-me)',     variaveis:['{{nome_cliente}}','{{nome_produto}}','{{preco_produto}}','{{preco_pix}}','{{link_produto}}','{{foto_produto}}'], padrao:{ cabecalho:'🔔 Produto disponível!',   imagem:'{{foto_produto}}', corpo:'Olá *{{nome_cliente}}*!\n\n✨ *{{nome_produto}}* voltou ao estoque!\n\n💳 Cartão: *{{preco_produto}}*\n💰 PIX: *{{preco_pix}}* (10% off)', rodape:'Estoque limitado — garanta o seu!', botoes:[{texto:'Comprar agora',acao:'url',valor:'{{link_produto}}',id:1}] }},
  { id:'boas_vindas',        label:'Boas-vindas',           grupo:'Relacionamento',icon:Star,        cor:'#e879f9', corBg:'rgba(232,121,249,0.1)',   desc:'Primeiro contato do cliente',              variaveis:['{{nome_cliente}}','{{nome_loja}}'],                                                                         padrao:{ cabecalho:'',                         imagem:'', corpo:'👋 Olá *{{nome_cliente}}*! Bem-vindo(a) à *{{nome_loja}}*!\n\nSou a Molise, sua assistente virtual. Estou aqui para ajudar com produtos, pedidos, rastreio e muito mais.\n\nComo posso te ajudar? 😊', rodape:'', botoes:[] }},
  { id:'avaliar_pedido',     label:'Avaliação Pós-venda',   grupo:'Relacionamento',icon:Star,        cor:'#f87171', corBg:'rgba(248,113,113,0.1)',   desc:'Pesquisa de satisfação',                   variaveis:['{{nome_cliente}}','{{numero_pedido}}'],                                                                     padrao:{ cabecalho:'⭐ Como foi sua experiência?', imagem:'', corpo:'Olá *{{nome_cliente}}*, seu pedido *#{{numero_pedido}}* foi entregue!\n\nSua opinião nos ajuda a melhorar sempre 🙏', rodape:'Obrigado por comprar conosco!', botoes:[{texto:'Adorei! ⭐⭐⭐⭐⭐',acao:'reply',valor:'Fiquei satisfeito',id:1},{texto:'Tive um problema',acao:'reply',valor:'Preciso de ajuda',id:2}] }},
]

const GRUPOS = [...new Set(GATILHOS.map(g=>g.grupo))]

const AMOSTRAS = {
  '{{nome_cliente}}':'Maria Silva','{{numero_pedido}}':'224307','{{valor_total}}':'R$ 47,52',
  '{{forma_pagamento}}':'PIX','{{transportadora}}':'Jadlog','{{codigo_rastreio}}':'JD123456789BR',
  '{{link_rastreio}}':'https://rastreamento.jadlog.com.br','{{prazo_entrega}}':'3 dias úteis',
  '{{nome_produto}}':'Fio de Seda Rabo de Rato Preto','{{preco_produto}}':'R$ 11,62',
  '{{preco_pix}}':'R$ 10,46','{{link_produto}}':'https://sostrass.com.br/produto',
  '{{foto_produto}}':'https://cdn-sostrass-image.s3.sa-east-1.amazonaws.com/perola-furo-passante-creme.jpg',
  '{{nome_loja}}':'Só Strass','{{link_pedido}}':'https://sostrass.com.br/pedido/224307',
}
const rv = t => (t||'').replace(/\{\{([^}]+)\}\}/g,(_,k)=>AMOSTRAS[`{{${k}}}`]||`{{${k}}}`)

function PreviewWA({ tmpl, label }) {
  const hora = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
  const vazio = !tmpl?.cabecalho && !tmpl?.corpo && !tmpl?.rodape && !(tmpl?.botoes?.length)
  return (
    <div style={{ maxWidth:300, margin:'0 auto', userSelect:'none' }}>
      <div className="rounded-[22px] overflow-hidden" style={{ background:'#111b21', border:'7px solid #1a252f', boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ background:'#1a252f', padding:'5px 14px 5px' }}>
          <div className="flex justify-between"><span style={{ fontSize:9,color:'#8696a0' }}>{hora}</span><span style={{ fontSize:9,color:'#8696a0' }}>●●●</span></div>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ background:'#202c33' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white" style={{ background:'#00a884', fontSize:12 }}>S</div>
          <div><p style={{ fontSize:13,fontWeight:700,color:'white',lineHeight:1.2 }}>Só Strass</p><p style={{ fontSize:10,color:'#8696a0' }}>mensagem automática</p></div>
        </div>
        <div className="p-3" style={{ background:'#0b141a', minHeight:100 }}>
          {vazio ? (
            <div className="flex flex-col items-center py-6" style={{ opacity:.3 }}>
              <MessageSquare size={22} style={{ color:'#8696a0' }}/>
              <p style={{ fontSize:10,color:'#8696a0',marginTop:5 }}>Configure a mensagem</p>
            </div>
          ) : (
            <div className="rounded-[12px] rounded-tl-[2px] overflow-hidden" style={{ background:'#202c33', maxWidth:265 }}>
              {tmpl?.imagem && <div style={{ background:'#1a2733' }}><img src={rv(tmpl.imagem)} alt="" style={{ width:'100%',maxHeight:130,objectFit:'cover' }} onError={e=>e.target.style.display='none'}/></div>}
              {tmpl?.cabecalho && <div className="px-3 pt-2.5 pb-0.5"><p style={{ fontSize:14,fontWeight:700,color:'#e9edef',lineHeight:1.4 }}>{rv(tmpl.cabecalho)}</p></div>}
              {tmpl?.corpo && (
                <div className="px-3 py-2">
                  <p style={{ fontSize:12,color:'#e9edef',lineHeight:1.65,whiteSpace:'pre-wrap' }}
                    dangerouslySetInnerHTML={{ __html: rv(tmpl.corpo).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br/>').replace(/\*([^*\n]+)\*/g,'<strong>$1</strong>').replace(/_([^_\n]+)_/g,'<em>$1</em>') }}/>
                </div>
              )}
              {tmpl?.rodape && <div className="px-3 pb-2"><p style={{ fontSize:10,color:'#8696a0',fontStyle:'italic' }}>{rv(tmpl.rodape)}</p></div>}
              <div className="px-3 pb-2 flex justify-end"><span style={{ fontSize:9,color:'#8696a0' }}>{hora} ✓✓</span></div>
              {tmpl?.botoes?.filter(b=>b.texto).length > 0 && (
                <div style={{ borderTop:'1px solid #2a3942' }}>
                  {tmpl.botoes.filter(b=>b.texto).map((b,i)=>(
                    <div key={i} className="flex items-center justify-center gap-1.5 py-2.5" style={{ borderTop:i>0?'1px solid #2a3942':'none', color:'#00a884', cursor:'pointer' }}>
                      {b.acao==='url'&&<Link size={10}/>}{b.acao==='tel'&&<Send size={10}/>}{b.acao==='reply'&&<MessageSquare size={10}/>}
                      <span style={{ fontSize:12,fontWeight:500 }}>{rv(b.texto)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {!vazio && <p style={{ fontSize:9,color:'var(--label-4)',textAlign:'center',marginTop:8 }}>Preview com dados de exemplo</p>}
    </div>
  )
}

function VarButton({ v, onInsert }) {
  return (
    <button onClick={()=>onInsert(v)} style={{ padding:'2px 7px',borderRadius:5,fontSize:9,fontFamily:'monospace',background:'var(--accent-dim)',color:'var(--accent)',border:'1px solid var(--accent-border)',cursor:'pointer',transition:'transform 0.1s' }}
      onMouseDown={e=>e.currentTarget.style.transform='scale(0.95)'}
      onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
      {v}
    </button>
  )
}

function CampoTexto({ fieldId, value, onChange, placeholder, rows, vars=[] }) {
  const inserir = v => {
    const el = document.getElementById(fieldId)
    if (!el) { onChange((value||'')+v); return }
    const s=el.selectionStart, e=el.selectionEnd
    onChange((value||'').slice(0,s)+v+(value||'').slice(e))
    setTimeout(()=>{ el.focus(); el.setSelectionRange(s+v.length,s+v.length) },0)
  }
  const sty = { background:'var(--bg)',border:'1px solid var(--sep)',borderRadius:10,color:'var(--label)',outline:'none',padding:'10px 14px',fontSize:13,width:'100%',fontFamily:'inherit',lineHeight:1.6 }
  return (
    <div className="space-y-2">
      {rows > 1
        ? <textarea id={fieldId} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...sty,resize:'none' }}/>
        : <input id={fieldId} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={sty}/>
      }
      {vars.length > 0 && <div className="flex flex-wrap gap-1.5">{vars.map(v=><VarButton key={v} v={v} onInsert={inserir}/>)}</div>}
    </div>
  )
}

export default function PageTransacional({ api: apiProp }) {
  const api = apiProp || BASE
  const [configs,  setConfigs]  = useState({})
  const [selId,    setSelId]    = useState('pedido_criado')
  const [form,     setForm]     = useState(null)
  const [dirty,    setDirty]    = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [salvoOk,  setSalvoOk]  = useState(false)
  const [gerando,  setGerando]  = useState(false)
  const [erroIA,   setErroIA]   = useState('')
  const [telTeste, setTelTeste] = useState('')
  const [enviandoT,setEnviandoT]= useState(false)
  const [resTeste, setResTeste] = useState(null)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/templates`)
      if (!r.ok) return
      const d = await r.json()
      const map = {}
      for (const t of d.templates||[]) {
        if (!t.gatilho) continue
        map[t.gatilho] = {
          id:        t.id,
          ativo:     t.ativo,
          cabecalho: t.blocos?.find(b=>b.tipo==='cabecalho')?.conteudo || '',
          imagem:    t.blocos?.find(b=>b.tipo==='imagem')?.url         || '',
          corpo:     t.blocos?.find(b=>b.tipo==='texto')?.conteudo     || '',
          rodape:    t.blocos?.find(b=>b.tipo==='rodape')?.conteudo    || '',
          botoes:    t.blocos?.filter(b=>b.tipo==='botao')             || [],
        }
      }
      setConfigs(map)
    } catch {}
  }, [api])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    const c = configs[selId]
    const g = GATILHOS.find(x=>x.id===selId)
    setForm(c ? { ...c } : { ...g?.padrao, ativo: false })
    setDirty(false)
    setErroIA('')
  }, [selId, configs])

  const upd = (k,v) => { setForm(f=>({...f,[k]:v})); setDirty(true) }
  const updBotao = (i,k,v) => { const bs=[...(form.botoes||[])]; bs[i]={...bs[i],[k]:v}; upd('botoes',bs) }
  const addBotao = () => { if((form.botoes||[]).length>=3)return; upd('botoes',[...(form.botoes||[]),{texto:'',acao:'reply',valor:'',id:Date.now()}]) }
  const delBotao = i => upd('botoes',(form.botoes||[]).filter((_,j)=>j!==i))

  const toggleAtivo = async gId => {
    const c = configs[gId]
    if (!c) return
    const novo = !c.ativo
    setConfigs(prev=>({...prev,[gId]:{...c,ativo:novo}}))
    if (gId===selId) setForm(f=>({...f,ativo:novo}))
    await fetch(`${api}/api/templates/${c.id}`,{ method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ativo:novo}) }).catch(()=>{})
  }

  const salvar = async () => {
    if (!form||!selId) return
    setSalvando(true)
    try {
      const blocos = []
      if (form.cabecalho) blocos.push({tipo:'cabecalho',conteudo:form.cabecalho,id:1})
      if (form.imagem)    blocos.push({tipo:'imagem',   url:form.imagem,         id:2})
      if (form.corpo)     blocos.push({tipo:'texto',    conteudo:form.corpo,     id:3})
      if (form.rodape)    blocos.push({tipo:'rodape',   conteudo:form.rodape,    id:4})
      ;(form.botoes||[]).filter(b=>b.texto).forEach((b,i)=>blocos.push({tipo:'botao',...b,id:10+i}))
      const existe = configs[selId]
      const g = GATILHOS.find(x=>x.id===selId)
      await fetch(existe?`${api}/api/templates/${existe.id}`:`${api}/api/templates`,{
        method:existe?'PATCH':'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ gatilho:selId,nome:g?.label||selId,blocos,ativo:form.ativo??true })
      })
      setSalvoOk(true); setDirty(false); await carregar()
      setTimeout(()=>setSalvoOk(false),2500)
    } catch {}
    setSalvando(false)
  }

  const gerarIA = async () => {
    const g = GATILHOS.find(x=>x.id===selId)
    if (!g) return
    setGerando(true); setErroIA('')
    try {
      const r = await fetch(`${api}/api/templates/gerar`,{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:g.label,gatilho:g.id,descricao:g.desc}) })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      if (d.blocos) {
        const cab=d.blocos.find(b=>b.tipo==='cabecalho'), txt=d.blocos.find(b=>b.tipo==='texto')
        const rod=d.blocos.find(b=>b.tipo==='rodape'),    bts=d.blocos.filter(b=>b.tipo==='botao')
        setForm(f=>({ ...f, cabecalho:cab?.conteudo||f.cabecalho, corpo:txt?.conteudo||f.corpo, rodape:rod?.conteudo||f.rodape, botoes:bts.length?bts.map((b,i)=>({...b,id:Date.now()+i})):f.botoes }))
        setDirty(true)
      } else setErroIA(d.erro||'IA não retornou dados')
    } catch (e) { setErroIA('Erro ao gerar — verifique se a GEMINI_API_KEY está configurada') }
    setGerando(false)
  }

  const testar = async () => {
    if (!telTeste.trim()||!form) return
    setEnviandoT(true); setResTeste(null)
    try {
      let msg = ''
      if (form.cabecalho) msg += `*${rv(form.cabecalho)}*\n\n`
      if (form.corpo)     msg += rv(form.corpo)
      if (form.rodape)    msg += `\n\n_${rv(form.rodape)}_`
      const r = await fetch(`${api}/api/dashboard/enviar`,{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefone:telTeste.replace(/\D/g,''),mensagem:msg}) })
      setResTeste(r.ok?'ok':'erro')
    } catch { setResTeste('erro') }
    setEnviandoT(false)
    setTimeout(()=>setResTeste(null),4000)
  }

  const gatilho = GATILHOS.find(g=>g.id===selId)
  const config  = configs[selId]
  const inp = { background:'var(--bg)',border:'1px solid var(--sep)',borderRadius:10,color:'var(--label)',outline:'none',padding:'10px 14px',fontSize:12,width:'100%',fontFamily:'monospace' }

  return (
    <div className="h-full flex overflow-hidden" style={{ background:'var(--bg)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <div className="w-[248px] flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background:'var(--bg-2)', borderRight:'1px solid var(--sep)' }}>
        <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)' }}>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 h-6 rounded-[7px] flex items-center justify-center" style={{ background:'var(--accent-dim)' }}>
              <Zap size={12} style={{ color:'var(--accent)' }}/>
            </div>
            <span className="text-[15px] font-bold" style={{ color:'var(--label)' }}>Gatilhos</span>
          </div>
          <p className="text-[10px]" style={{ color:'var(--label-4)' }}>
            {Object.values(configs).filter(c=>c.ativo).length} ativos · {GATILHOS.length} disponíveis
          </p>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {GRUPOS.map(grupo => (
            <div key={grupo}>
              <p className="px-4 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest" style={{ color:'var(--label-4)' }}>{grupo}</p>
              {GATILHOS.filter(g=>g.grupo===grupo).map(g => {
                const c=configs[g.id], sel=selId===g.id, Ic=g.icon
                return (
                  <div key={g.id} className="flex items-center px-2 transition-all"
                    style={{ background:sel?`${g.cor}10`:'transparent', borderRight:sel?`2.5px solid ${g.cor}`:'2.5px solid transparent' }}>
                    <button onClick={()=>setSelId(g.id)} className="flex-1 flex items-center gap-2.5 px-2 py-2.5 text-left min-w-0">
                      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background:sel?g.corBg:'var(--fill)', border:`1px solid ${sel?g.cor+'60':'var(--sep)'}` }}>
                        <Ic size={14} style={{ color:sel?g.cor:'var(--label-3)' }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate leading-tight" style={{ color:sel?g.cor:'var(--label)' }}>{g.label}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0${c?.ativo?' animate-pulse':''}`}
                            style={{ background:c?(c.ativo?'#22c55e':'var(--label-4)'):'var(--sep)' }}/>
                          <span className="text-[9px] truncate" style={{ color:'var(--label-4)' }}>
                            {c?(c.ativo?'Ativo':'Inativo'):'Não configurado'}
                          </span>
                        </div>
                      </div>
                    </button>
                    {c && (
                      <button onClick={()=>toggleAtivo(g.id)}
                        className="p-1.5 rounded-[8px] flex-shrink-0 transition-all"
                        title={c.ativo?'Desativar':'Ativar'}
                        style={{ color:c.ativo?'#22c55e':'var(--label-4)', background:c.ativo?'rgba(34,197,94,0.08)':'transparent' }}>
                        {c.ativo?<ToggleRight size={18} strokeWidth={2}/>:<ToggleLeft size={18} strokeWidth={1.5}/>}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Editor central ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 flex-shrink-0"
          style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
          {gatilho && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
                style={{ background:gatilho.corBg, border:`1.5px solid ${gatilho.cor}50` }}>
                <gatilho.icon size={16} style={{ color:gatilho.cor }}/>
              </div>
              <div>
                <h3 className="text-[14px] font-bold leading-tight" style={{ color:'var(--label)' }}>{gatilho.label}</h3>
                <p className="text-[11px]" style={{ color:'var(--label-3)' }}>{gatilho.desc}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            {config && (
              <button onClick={()=>toggleAtivo(selId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-semibold transition-all"
                style={{ background:form?.ativo?'rgba(34,197,94,0.1)':'var(--fill)', color:form?.ativo?'#22c55e':'var(--label-3)', border:form?.ativo?'1px solid rgba(34,197,94,0.3)':'1px solid var(--sep)' }}>
                {form?.ativo?<ToggleRight size={15} strokeWidth={2}/>:<ToggleLeft size={15} strokeWidth={1.5}/>}
                {form?.ativo?'Ativo':'Inativo'}
              </button>
            )}
            <button onClick={salvar} disabled={salvando||!dirty}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all"
              style={{ background:salvoOk?'#22c55e':dirty?'var(--accent)':'var(--fill)', color:dirty?'#000':'var(--label-4)', opacity:dirty?1:0.5 }}>
              {salvando?<RefreshCw size={13} className="animate-spin"/>:salvoOk?<CheckCircle size={13}/>:<Save size={13}/>}
              {salvoOk?'Salvo!':'Salvar'}
            </button>
          </div>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-hidden flex">
          {/* Formulário */}
          <div className="flex-1 overflow-y-auto" style={{ borderRight:'1px solid var(--sep)' }}>
            <div className="max-w-[560px] mx-auto p-6 space-y-4">

              {/* Gerar IA */}
              <button onClick={gerarIA} disabled={gerando}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] text-[13px] font-semibold transition-all"
                style={{ background:'var(--accent-dim)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
                {gerando?<RefreshCw size={13} className="animate-spin"/>:<Sparkles size={14}/>}
                {gerando?'Gerando com IA...':'✨ Gerar mensagem com IA'}
              </button>
              {erroIA && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[12px]"
                  style={{ background:'rgba(239,68,68,0.08)', color:'var(--red)', border:'1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle size={13}/> {erroIA}
                </div>
              )}

              {/* 1 — Cabeçalho */}
              <div className="rounded-[14px] overflow-hidden" style={{ border:'1px solid var(--sep)', background:'var(--bg-2)' }}>
                <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-3)' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black" style={{ background:'var(--accent)' }}>1</div>
                  <span className="text-[13px] font-semibold" style={{ color:'var(--label)' }}>Cabeçalho</span>
                  <span className="text-[10px]" style={{ color:'var(--label-4)' }}>— texto em negrito no topo (opcional)</span>
                </div>
                <div className="p-4">
                  <CampoTexto fieldId={`cab-${selId}`} value={form?.cabecalho} onChange={v=>upd('cabecalho',v)}
                    placeholder="Ex: 🛒 Pedido Confirmado! (deixe vazio para omitir)"
                    vars={gatilho?.variaveis||[]}/>
                </div>
              </div>

              {/* 1b — Imagem (avise_me ou se tiver) */}
              {(gatilho?.id==='avise_me'||form?.imagem) && (
                <div className="rounded-[14px] overflow-hidden" style={{ border:'1px solid var(--sep)', background:'var(--bg-2)' }}>
                  <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-3)' }}>
                    <div className="w-5 h-5 rounded-[5px] flex items-center justify-center" style={{ background:'var(--fill)', border:'1px solid var(--sep)' }}><Image size={10} style={{ color:'var(--label-3)' }}/></div>
                    <span className="text-[13px] font-semibold" style={{ color:'var(--label)' }}>Imagem</span>
                    <span className="text-[10px]" style={{ color:'var(--label-4)' }}>— aparece acima do texto (opcional)</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <input value={form?.imagem||''} onChange={e=>upd('imagem',e.target.value)}
                      placeholder="URL da imagem ou {{foto_produto}}" style={inp}/>
                    <div className="flex gap-1.5">
                      {['{{foto_produto}}'].map(v=>(
                        <button key={v} onClick={()=>upd('imagem',(form?.imagem||'')+v)}
                          style={{ padding:'2px 7px',borderRadius:5,fontSize:9,fontFamily:'monospace',background:'var(--accent-dim)',color:'var(--accent)',border:'1px solid var(--accent-border)' }}>{v}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2 — Corpo */}
              <div className="rounded-[14px] overflow-hidden" style={{ border:'1px solid var(--sep)', background:'var(--bg-2)' }}>
                <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-3)' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background:'var(--blue)' }}>2</div>
                  <span className="text-[13px] font-semibold" style={{ color:'var(--label)' }}>Corpo da mensagem</span>
                  <span className="text-[10px]" style={{ color:'var(--label-4)' }}>— use *negrito* e _itálico_</span>
                </div>
                <div className="p-4">
                  <CampoTexto fieldId={`corp-${selId}`} value={form?.corpo} onChange={v=>upd('corpo',v)}
                    placeholder="Texto principal da mensagem..." rows={6} vars={gatilho?.variaveis||[]}/>
                </div>
              </div>

              {/* 3 — Rodapé */}
              <div className="rounded-[14px] overflow-hidden" style={{ border:'1px solid var(--sep)', background:'var(--bg-2)' }}>
                <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-3)' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background:'var(--label-3)' }}>3</div>
                  <span className="text-[13px] font-semibold" style={{ color:'var(--label)' }}>Rodapé</span>
                  <span className="text-[10px]" style={{ color:'var(--label-4)' }}>— itálico menor, abaixo do texto</span>
                </div>
                <div className="p-4">
                  <CampoTexto fieldId={`rod-${selId}`} value={form?.rodape} onChange={v=>upd('rodape',v)}
                    placeholder="Ex: Mensagem automática — não responda. / Continuaremos monitorando..."/>
                </div>
              </div>

              {/* 4 — Botões */}
              <div className="rounded-[14px] overflow-hidden" style={{ border:'1px solid var(--sep)', background:'var(--bg-2)' }}>
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-3)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background:'#a78bfa' }}>4</div>
                    <span className="text-[13px] font-semibold" style={{ color:'var(--label)' }}>Botões de ação</span>
                    <span className="text-[10px]" style={{ color:'var(--label-4)' }}>— máx. 3</span>
                  </div>
                  {(form?.botoes||[]).length < 3 && (
                    <button onClick={addBotao} className="flex items-center gap-1 px-2.5 py-1 rounded-[7px] text-[11px] font-medium"
                      style={{ background:'var(--fill)', color:'var(--label-2)', border:'1px solid var(--sep)' }}>
                      <Plus size={10}/> Adicionar
                    </button>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  {!(form?.botoes||[]).length && <p className="text-[11px] text-center py-1" style={{ color:'var(--label-4)' }}>Nenhum botão — clique em "Adicionar"</p>}
                  {(form?.botoes||[]).map((b,i)=>(
                    <div key={b.id||i} className="rounded-[10px] p-3 space-y-2" style={{ background:'var(--bg-3)', border:'1px solid var(--sep)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color:'var(--label-3)' }}>Botão {i+1}</span>
                        <button onClick={()=>delBotao(i)} style={{ color:'var(--label-4)' }}><X size={12}/></button>
                      </div>
                      <input value={b.texto||''} onChange={e=>updBotao(i,'texto',e.target.value)}
                        placeholder="Texto do botão (máx. 20 chars)" maxLength={20}
                        style={{ background:'var(--bg)',border:'1px solid var(--sep)',borderRadius:8,color:'var(--label)',outline:'none',padding:'8px 12px',fontSize:12,width:'100%',fontFamily:'inherit' }}/>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[['url','🔗 Link'],['reply','💬 Resposta'],['tel','📞 Ligar']].map(([v,l])=>(
                          <button key={v} onClick={()=>updBotao(i,'acao',v)}
                            className="py-1.5 rounded-[8px] text-[10px] font-medium transition-all"
                            style={{ background:b.acao===v?'var(--accent-dim)':'var(--bg)', color:b.acao===v?'var(--accent)':'var(--label-3)', border:b.acao===v?'1px solid var(--accent-border)':'1px solid var(--sep)' }}>
                            {l}
                          </button>
                        ))}
                      </div>
                      {(b.acao==='url'||b.acao==='tel') && (
                        <div className="space-y-1.5">
                          <input value={b.valor||''} onChange={e=>updBotao(i,'valor',e.target.value)}
                            placeholder={b.acao==='tel'?'Número de telefone':'URL destino'}
                            style={{ background:'var(--bg)',border:'1px solid var(--sep)',borderRadius:8,color:'var(--label)',outline:'none',padding:'8px 12px',fontSize:11,width:'100%',fontFamily:'monospace' }}/>
                          <div className="flex flex-wrap gap-1">
                            {(gatilho?.variaveis||[]).filter(v=>v.includes('link')).map(v=>(
                              <button key={v} onClick={()=>updBotao(i,'valor',(b.valor||'')+v)}
                                style={{ padding:'2px 7px',borderRadius:5,fontSize:9,fontFamily:'monospace',background:'var(--accent-dim)',color:'var(--accent)',border:'1px solid var(--accent-border)' }}>{v}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Testar */}
              <div className="rounded-[14px] p-4 space-y-3" style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
                <p className="text-[12px] font-semibold" style={{ color:'var(--label-2)' }}>Testar envio</p>
                <div className="flex gap-2">
                  <input value={telTeste} onChange={e=>setTelTeste(e.target.value)} placeholder="5511999999999 (com DDI)"
                    className="flex-1 px-3 py-2 rounded-[9px] text-[12px] outline-none"
                    style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
                  <button onClick={testar} disabled={enviandoT||!telTeste.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[9px] text-[12px] font-semibold"
                    style={{ background:'var(--blue)', color:'#fff', opacity:!telTeste.trim()?0.5:1 }}>
                    {enviandoT?<RefreshCw size={12} className="animate-spin"/>:<Send size={12}/>}
                    Testar
                  </button>
                </div>
                {resTeste && <p className="text-[11px] font-medium" style={{ color:resTeste==='ok'?'#22c55e':'var(--red)' }}>{resTeste==='ok'?'✓ Enviado!':'✗ Erro ao enviar'}</p>}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="w-[296px] flex-shrink-0 flex flex-col overflow-hidden">
            <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'var(--label-3)' }}>👁 Preview ao vivo</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex items-start justify-center" style={{ background:'var(--bg-3)' }}>
              <PreviewWA tmpl={form} label={gatilho?.label}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
