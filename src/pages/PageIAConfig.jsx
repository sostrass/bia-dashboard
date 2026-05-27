import { useState, useEffect, useRef } from 'react'
import {
  Bot, Pencil, Grid3x3, Clock, Plug, Package, ChevronLeft, ChevronRight,
  Save, CheckCircle, Plus, Trash2, Sparkles, Eye, EyeOff, RefreshCw,
  ChevronDown, ChevronRight as ChevronR, ToggleLeft, ToggleRight,
  Smile, SmilePlus, Copy, Check, ExternalLink, Lock, Zap,
  ShoppingCart, CreditCard, Truck, MessageSquare, Info, X, Edit3,
  AlertCircle, Package2, FileText
} from 'lucide-react'

// ── Constantes ───────────────────────────────────────────────────────────────
const TONS = ['Simpático','Direto','Profissional','Descontraído','Prestativo','Entusiasmado','Conciso','Formal']
const DIAS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']
const ALIASES = ['{nome_cliente}','{produto}','{valor_pix}','{valor_cartao}','{numero_pedido}','{loja}','{nome_ia}']

const CTXS = [
  { id:'saudacao', label:'Saudação inicial',    cor:'#00d4aa', icon:MessageSquare,
    desc:'Enviada na primeira interação. Use {nome_ia} e {loja}.',
    default:'Olá! Seja bem-vindo(a) à {loja}! Sou a {nome_ia}. Como posso ajudar?' },
  { id:'produto',  label:'Produto encontrado',   cor:'#a78bfa', icon:Package2,
    desc:'Exibida ao listar produtos. Use {produto}, {valor_pix}, {valor_cartao}.',
    default:'*{produto}*\n───────────\nPIX: R$ {valor_pix} | Cartão: R$ {valor_cartao}' },
  { id:'carrinho', label:'Item adicionado',       cor:'#f59e0b', icon:ShoppingCart,
    desc:'Confirmação de adição ao carrinho. Use {produto}.',
    default:'*{produto}* adicionado ao carrinho.' },
  { id:'pedido',   label:'Pedido finalizado',     cor:'#22c55e', icon:CheckCircle,
    desc:'Após criação do pedido. Use {numero_pedido}, {valor_pix}.',
    default:'*Pedido #{numero_pedido} criado!*\nPIX: R$ {valor_pix}' },
  { id:'offline',  label:'Fora do horário',       cor:'#60a5fa', icon:Clock,
    desc:'Enviada fora do horário configurado. Sem variáveis obrigatórias.',
    default:'Olá! Estamos fora do horário. Seg-sex 8h–18h.\nDeixe sua mensagem!' },
  { id:'nf_pendente',  label:'Nota Fiscal Pendente',  cor:'#f59e0b', icon:FileText,
    desc:'NF ainda não emitida. Use {nome_cliente}, {numero_pedido}.',
    default:'📄 *Nota Fiscal — Pedido #{numero_pedido}*\n\nOlá, {nome_cliente}! A nota fiscal deste pedido ainda não foi emitida.\n\n📦 Status do pedido: ✅ Pagamento confirmado\n\nPosso emitir agora para você!' },
  { id:'nf_emitida',   label:'Nota Fiscal Emitida',   cor:'#22c55e', icon:FileText,
    desc:'NF autorizada com link. Use {nome_cliente}, {numero_pedido}, {numero_nfe}, {link_nfe}.',
    default:'📄 *Nota Fiscal — Pedido #{numero_pedido}*\n\nOlá, {nome_cliente}! Aqui está o documento fiscal da sua compra.\n\n🔗 *Download da NF-e:*\n{link_nfe}\n\n📋 NF-e nº {numero_nfe}\n\n_Você pode baixar o PDF ou encaminhar para sua contabilidade pelo link acima._' },
]

const BTN_GROUPS_DEFAULT = [
  { id:'produto',   label:'Produto encontrado',   desc:'Botões após listar produto',    editavel:true,
    btns:[{label:'Adicionar ao carrinho',on:true},{label:'Ver foto',on:true},{label:'Tirar dúvida',on:true}] },
  { id:'carrinho',  label:'Resumo do carrinho',    desc:'Botões após adicionar item',    editavel:true,
    btns:[{label:'Finalizar pedido',on:true},{label:'Adicionar item',on:true},{label:'Editar carrinho',on:true}] },
  { id:'endereco',  label:'Confirmação endereço',  desc:'Botões ao confirmar endereço',  editavel:true,
    btns:[{label:'Confirmar endereço',on:true},{label:'Alterar endereço',on:true}] },
  { id:'estoque',   label:'Produto fora de estoque', desc:'Produto indisponível',        editavel:false,
    btns:[{label:'Avise-me',on:true},{label:'Ver foto',on:true},{label:'Tirar dúvida',on:true}] },
  { id:'identificacao', label:'Identificação cliente', desc:'CPF / cadastro novo',       editavel:false,
    btns:[{label:'Já tenho cadastro',on:true},{label:'Sou novo cliente',on:true}] },
  { id:'pagamento', label:'Forma de pagamento',    desc:'PIX ou Cartão',                 editavel:false,
    btns:[{label:'Pagar com PIX',on:true},{label:'Cartão de Crédito',on:true}] },
  { id:'pedido',    label:'Pós-pedido',             desc:'Após criar o pedido',           editavel:false,
    btns:[{label:'Ver meus pedidos',on:true},{label:'Continuar comprando',on:true}] },
  { id:'edicao',    label:'Editar carrinho',        desc:'Opções de edição',              editavel:false,
    btns:[{label:'Remover item',on:true},{label:'Alterar quantidade',on:true},{label:'Limpar carrinho',on:true}] },
  { id:'consultar_pedido', label:'Consultar pedido',    desc:'Como o cliente quer localizar o pedido', editavel:false,
    btns:[{label:'Tenho o número',on:true},{label:'Usar meu CPF',on:true}] },
  { id:'pedido_nao_encontrado', label:'Pedido não encontrado', desc:'Pedido não localizado pelo número ou CPF', editavel:false,
    btns:[{label:'Tentar outro número',on:true},{label:'Ver meus pedidos',on:true}] },
  { id:'multiplos_pedidos', label:'Múltiplos pedidos',  desc:'Botões gerados dinamicamente com número do pedido mais recente', editavel:false,
    btns:[{label:'Nota fiscal #N',on:true},{label:'Rastreio #N',on:true},{label:'Ver outros pedidos',on:true}] },
  { id:'pedido_entregue', label:'Pedido entregue',       desc:'Botões após confirmar entrega',          editavel:true,
    btns:[{label:'Avaliar compra',on:true},{label:'Devolver produto',on:true},{label:'Nova compra',on:true}] },
  { id:'pedido_transito', label:'Pedido em trânsito',    desc:'Pedido enviado/coletado',               editavel:true,
    btns:[{label:'Rastrear entrega',on:true},{label:'Reportar problema',on:true},{label:'Nova compra',on:true}] },
  { id:'pedido_aguardando', label:'Pedido aguardando',   desc:'Pedido sem envio ainda',                editavel:false,
    btns:[{label:'Falar sobre o pedido',on:true},{label:'Nova compra',on:true}] },
  { id:'nota_fiscal',   label:'Nota Fiscal',             desc:'Após exibir NF emitida',                editavel:false,
    btns:[{label:'Ver pedido completo',on:true},{label:'Nova compra',on:true}] },
  { id:'emitir_nf',     label:'Emitir Nota Fiscal',      desc:'NF pendente — opção de emitir',         editavel:false,
    btns:[{label:'Emitir Nota Fiscal',on:true},{label:'Ver pedido completo',on:true}] },
  { id:'carrinho_vazio', label:'Carrinho vazio',          desc:'Carrinho sem itens',                    editavel:false,
    btns:[{label:'Buscar produto',on:true},{label:'Meus pedidos',on:true}] },
  { id:'pos_ocorrencia', label:'Pós-ocorrência',          desc:'Após abrir ticket ou devolução',        editavel:false,
    btns:[{label:'Ver status do pedido',on:true},{label:'Continuar comprando',on:true}] },
  { id:'avaliacao_estrelas', label:'Avaliação — Estrelas',  desc:'Pergunta a nota de satisfação (1-5★)',  editavel:false,
    btns:[{label:'⭐',on:true},{label:'⭐⭐',on:true},{label:'⭐⭐⭐',on:true},{label:'⭐⭐⭐⭐',on:true},{label:'⭐⭐⭐⭐⭐',on:true}] },
  { id:'avaliacao_comentario', label:'Avaliação — Comentário', desc:'Após receber a nota, pergunta se quer comentar', editavel:false,
    btns:[{label:'Sim, quero comentar',on:true},{label:'Não, obrigada',on:true}] },
  { id:'busca_sem_resultado', label:'Busca sem resultado',   desc:'Produto não encontrado no catálogo',   editavel:false,
    btns:[{label:'Buscar diferente',on:true},{label:'Ver categorias',on:true}] },
  { id:'carrinho_atualizado', label:'Carrinho atualizado',   desc:'Após remover item ou alterar quantidade', editavel:false,
    btns:[{label:'Ver carrinho',on:true},{label:'Finalizar pedido',on:true},{label:'Continuar comprando',on:true}] },
]

const INTEGRACOES = [
  { id:'ia', label:'Inteligência Artificial', cor:'#a78bfa', icon:Bot,
    desc:'Chaves de API dos modelos de linguagem',
    campos:[
      { key:'geminiKey',    label:'Gemini API Key',   type:'password', placeholder:'AIzaSy...', hint:'aistudio.google.com' },
      { key:'claudeKey',    label:'Claude API Key',   type:'password', placeholder:'sk-ant-...', hint:'console.anthropic.com' },
    ]
  },
  { id:'mp', label:'Mercado Pago', cor:'#00d4aa', icon:CreditCard,
    desc:'Token para geração de PIX e links de pagamento com cartão',
    campos:[
      { key:'mpAccessToken', label:'Access Token', type:'password', placeholder:'APP_USR-...', hint:'mercadopago.com.br/developers — seção "Credenciais"' },
    ]
  },
  { id:'wa', label:'WhatsApp (Meta)', cor:'#22c55e', icon:MessageSquare,
    desc:'Credenciais da API do WhatsApp Business',
    campos:[
      { key:'whatsappToken',       label:'Access Token',     type:'password', placeholder:'EAA...' },
      { key:'whatsappPhoneId',     label:'Phone Number ID',  type:'text',     placeholder:'123456789' },
      { key:'whatsappVerifyToken', label:'Verify Token',     type:'text',     placeholder:'bia2025' },
    ]
  },
  { id:'bling', label:'Bling ERP', cor:'#f59e0b', icon:Package,
    desc:'OAuth para acesso ao catálogo, pedidos e contatos',
    campos:[
      { key:'blingClientId',     label:'Client ID',     type:'text',     placeholder:'...' },
      { key:'blingClientSecret', label:'Client Secret', type:'password', placeholder:'...' },
    ],
    oauth:true
  },
  { id:'frete', label:'Melhor Envio', cor:'#60a5fa', icon:Truck,
    desc:'Token para cotação de frete',
    campos:[
      { key:'melhorEnvioToken', label:'Bearer Token', type:'password', placeholder:'eyJ...' },
    ]
  },
  { id:'correios', label:'Correios', cor:'#fb923c', icon:Truck,
    desc:'Credenciais para serviços dos Correios',
    campos:[
      { key:'correiosUsuario',  label:'CPF/CNPJ Meu Correios', type:'text',     placeholder:'42614714000130' },
      { key:'correiosCartao',   label:'Cartão de postagem',     type:'text',     placeholder:'0076589811' },
      { key:'correiosContrato', label:'Contrato',               type:'text',     placeholder:'9912544869' },
      { key:'correiosApiKey',   label:'Código de acesso APIs',  type:'password', placeholder:'079LUEmz...' },
    ]
  },
  { id:'pix', label:'PIX (fallback)', cor:'#4a9fff', icon:CreditCard,
    desc:'Chave PIX usada quando o Mercado Pago não gera código',
    campos:[
      { key:'pixChave', label:'Chave PIX', type:'text', placeholder:'CNPJ, e-mail ou telefone' },
    ]
  },
]

// ── Nav config ───────────────────────────────────────────────────────────────
const NAV = [
  { group:'Personalidade', items:[
    { id:'identidade',  icon:Bot,         label:'Identidade',        badge:null },
    { id:'mensagensIA', icon:MessageSquare,label:'Mensagens IA',     badge:'5' },
  ]},
  { group:'Interface WA', items:[
    { id:'botoes',      icon:Grid3x3,     label:'Botões',            badge:'8' },
    { id:'horario',     icon:Clock,       label:'Horário',           badge:null },
  ]},
  { group:'Infraestrutura', items:[
    { id:'integracoes', icon:Plug,        label:'Integrações',       badge:null },
    { id:'logistica',   icon:Package,     label:'Logística',         badge:null },
  ]},
]

// ── Componentes auxiliares ────────────────────────────────────────────────────
function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  return (
    <aside style={{
      width: collapsed ? 48 : 200, flexShrink:0, display:'flex', flexDirection:'column',
      background:'var(--bg-2)', borderRight:'1px solid var(--sep)',
      transition:'width .18s cubic-bezier(.4,0,.2,1)', overflow:'hidden'
    }}>
      <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--sep)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        {!collapsed && <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-4)' }}>Config IA</span>}
        <button onClick={()=>setCollapsed(v=>!v)}
          style={{ marginLeft:'auto', padding:4, borderRadius:6, border:'none', background:'transparent', color:'var(--label-4)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {collapsed ? <ChevronRight size={13}/> : <ChevronLeft size={13}/>}
        </button>
      </div>
      <nav style={{ flex:1, overflowY:'auto', padding:'6px 0' }}>
        {NAV.map(g => (
          <div key={g.group} style={{ marginBottom:4 }}>
            {!collapsed && <div style={{ padding:'6px 12px 3px', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--label-4)' }}>{g.group}</div>}
            {g.items.map(item => {
              const Icon = item.icon; const on = active===item.id
              return (
                <button key={item.id} onClick={()=>setActive(item.id)} title={collapsed?item.label:undefined}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', gap:9, padding:collapsed?'8px 0':'7px 12px',
                    justifyContent:collapsed?'center':'flex-start', border:'none', cursor:'pointer', transition:'all .1s',
                    background:on?'var(--accent-dim)':'transparent', borderLeft:`2px solid ${on?'var(--accent)':'transparent'}`,
                    color:on?'var(--accent)':'var(--label-3)'
                  }}>
                  <Icon size={14} style={{ flexShrink:0 }}/>
                  {!collapsed && <>
                    <span style={{ fontSize:12.5, fontWeight:500, flex:1, textAlign:'left', whiteSpace:'nowrap' }}>{item.label}</span>
                    {item.badge && <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:99, background:'var(--accent-dim)', color:'var(--accent)' }}>{item.badge}</span>}
                  </>}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}

function Field({ label, hint, children, row=false }) {
  return (
    <div style={{ display:row?'flex':'block', alignItems:row?'center':'initial', gap:row?12:0 }}>
      {label && <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:row?0:6, flexShrink:0 }}>{label}</label>}
      {children}
      {hint && <p style={{ fontSize:10, color:'var(--label-4)', marginTop:4 }}>{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, type='text', placeholder, readOnly=false, mono=false }) {
  const [focused, setF] = useState(false)
  return (
    <input type={type} value={value||''} onChange={e=>onChange?.(e.target.value)}
      placeholder={placeholder} readOnly={readOnly}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{
        width:'100%', padding:'7px 10px', borderRadius:8, fontSize:12.5, outline:'none',
        fontFamily: mono ? 'monospace' : 'inherit', background:'var(--bg)',
        border:`1px solid ${focused&&!readOnly?'var(--accent)':'var(--sep)'}`,
        color:'var(--label)', boxSizing:'border-box',
        boxShadow:focused&&!readOnly?'0 0 0 3px var(--accent-dim)':'none',
        transition:'border .15s, box-shadow .15s', cursor:readOnly?'default':'auto'
      }}/>
  )
}

function SecretInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      <input type={show?'text':'password'} value={value||''} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width:'100%', padding:'7px 34px 7px 10px', borderRadius:8, fontSize:12.5, outline:'none',
          background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)', boxSizing:'border-box', fontFamily:'monospace' }}/>
      <button type="button" onClick={()=>setShow(v=>!v)}
        style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', border:'none', background:'transparent', color:'var(--label-4)', cursor:'pointer', padding:2, display:'flex' }}>
        {show?<EyeOff size={13}/>:<Eye size={13}/>}
      </button>
    </div>
  )
}

function Card({ children, style={} }) {
  return (
    <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12, padding:'16px 18px', ...style }}>
      {children}
    </div>
  )
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom:14 }}>
      <p style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-3)', margin:0 }}>{children}</p>
      {sub && <p style={{ fontSize:11, color:'var(--label-4)', marginTop:3 }}>{sub}</p>}
    </div>
  )
}

// ── Modal de edição de mensagem ───────────────────────────────────────────────
function MsgModal({ ctx, data, onClose, onChange, onGenerate, generating }) {
  const [tab, setTab] = useState('default')
  const def = data?.default ?? ctx.default
  const vars = data?.vars ?? []
  const Icon = ctx.icon

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
      <div style={{ width:540, height:'100%', background:'var(--bg-2)', display:'flex', flexDirection:'column', boxShadow:'-20px 0 60px rgba(0,0,0,.3)' }}>
        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--sep)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`${ctx.cor}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon size={16} style={{ color:ctx.cor }}/>
          </div>
          <div>
            <h3 style={{ fontSize:15, fontWeight:700, color:'var(--label)', margin:0 }}>{ctx.label}</h3>
            <p style={{ fontSize:11, color:'var(--label-4)', margin:'2px 0 0' }}>{ctx.desc}</p>
          </div>
          <button onClick={onClose} style={{ marginLeft:'auto', padding:6, borderRadius:8, border:'none', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', display:'flex' }}>
            <X size={14}/>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--sep)', padding:'0 20px', flexShrink:0 }}>
          {[['default','Mensagem padrão'],['vars','Variações A/B'],['preview','Preview WA']].map(([id,lb])=>(
            <button key={id} onClick={()=>setTab(id)} style={{
              padding:'9px 14px', fontSize:12, fontWeight:500, border:'none', background:'transparent', cursor:'pointer',
              borderBottom:`2px solid ${tab===id?ctx.cor:'transparent'}`, color:tab===id?ctx.cor:'var(--label-3)', marginBottom:-1
            }}>{lb}</button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          {tab==='default' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <textarea value={def} onChange={e=>onChange({...data,default:e.target.value})} rows={6}
                style={{ width:'100%', padding:'10px 12px', borderRadius:10, fontSize:12.5, fontFamily:'monospace', outline:'none', resize:'vertical', background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)', lineHeight:1.6, boxSizing:'border-box' }}/>
              <div>
                <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:8 }}>Variáveis disponíveis</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {ALIASES.map(a=>(
                    <code key={a} onClick={()=>onChange({...data,default:def+a})}
                      style={{ fontSize:10, padding:'3px 8px', borderRadius:6, background:'var(--fill)', color:'var(--label-3)', border:'1px solid var(--sep)', cursor:'pointer', transition:'all .1s', fontFamily:'monospace' }}>
                      {a}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab==='vars' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <p style={{ fontSize:12, color:'var(--label-3)' }}>
                  {vars.length} variação{vars.length!==1?'ões':''}. A IA escolhe aleatoriamente.
                </p>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>onGenerate(ctx.id)} disabled={generating}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, border:'1px solid rgba(0,212,170,.3)', background:'rgba(0,212,170,.08)', color:'#00d4aa', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                    {generating?<RefreshCw size={12} className="animate-spin"/>:<Sparkles size={12}/>} Gerar com IA
                  </button>
                  <button onClick={()=>onChange({...data,vars:[...vars,'']})}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', fontSize:12 }}>
                    <Plus size={12}/> Adicionar
                  </button>
                </div>
              </div>
              {vars.length===0 && (
                <div style={{ padding:'32px 16px', textAlign:'center', color:'var(--label-4)', fontSize:12, borderRadius:10, border:'1px dashed var(--sep)' }}>
                  Nenhuma variação. Clique em <strong>Adicionar</strong> ou <strong>Gerar com IA</strong>.
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {vars.map((v,i)=>(
                  <div key={i} style={{ display:'flex', gap:8 }}>
                    <textarea rows={2} value={v} onChange={e=>onChange({...data,vars:vars.map((x,xi)=>xi===i?e.target.value:x)})}
                      style={{ flex:1, padding:'8px 10px', borderRadius:8, fontSize:12, fontFamily:'monospace', outline:'none', resize:'vertical', background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)', lineHeight:1.5 }}/>
                    <button onClick={()=>onChange({...data,vars:vars.filter((_,xi)=>xi!==i)})}
                      style={{ padding:'6px 8px', borderRadius:8, border:'none', background:'rgba(239,68,68,.1)', color:'#ef4444', cursor:'pointer', alignSelf:'flex-start', display:'flex' }}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='preview' && (
            <div style={{ display:'flex', justifyContent:'center', paddingTop:20 }}>
              <div style={{ width:240 }}>
                <div style={{ borderRadius:20, overflow:'hidden', border:'2px solid var(--sep)', background:'#0b141a' }}>
                  <div style={{ background:'#202c33', padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:ctx.cor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#000' }}>M</div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, color:'#e9edef' }}>Molise</div>
                      <div style={{ fontSize:9, color:'#8696a0' }}>online</div>
                    </div>
                  </div>
                  <div style={{ padding:'12px', background:'#0b141a', minHeight:80 }}>
                    <div style={{ maxWidth:'85%', padding:'8px 12px', borderRadius:'12px 12px 12px 3px', background:'#202c33' }}>
                      <p style={{ fontSize:11, lineHeight:1.6, color:'#e9edef', margin:0, whiteSpace:'pre-wrap' }}>{def.replace(/{[^}]+}/g, v=>v)}</p>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize:10, textAlign:'center', marginTop:8, color:'var(--label-4)' }}>Preview da mensagem padrão</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Grupo de integração colapsável ───────────────────────────────────────────
function IntGroup({ integ, cfg, setC, api }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(null) // 'ok'|'error'|'loading'|null
  const Icon = integ.icon

  const checkStatus = async () => {
    setStatus('loading')
    // Simula verificação — em produção pode fazer ping ao endpoint
    setTimeout(() => setStatus(Object.values(cfg).filter(v=>v&&!String(v).startsWith('***')).length > 0 ? 'ok' : 'error'), 800)
  }

  const hasKey = integ.campos.some(c => cfg[c.key]?.length > 0)

  return (
    <div style={{ border:`1px solid ${open?'var(--brd2,var(--sep))':'var(--sep)'}`, borderRadius:12, overflow:'hidden', background:'var(--bg)' }}>
      <button onClick={()=>setOpen(v=>!v)} style={{
        width:'100%', display:'flex', alignItems:'center', gap:12, padding:'13px 16px',
        border:'none', cursor:'pointer', background:open?'var(--bg-2)':'transparent', textAlign:'left'
      }}>
        <div style={{ width:34, height:34, borderRadius:10, background:`${integ.cor}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={15} style={{ color:integ.cor }}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--label)' }}>{integ.label}</div>
          <div style={{ fontSize:11, color:'var(--label-4)' }}>{integ.desc}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          {hasKey
            ? <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'rgba(34,197,94,.1)', color:'#22c55e', border:'1px solid rgba(34,197,94,.2)' }}>Configurado</span>
            : <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'var(--fill)', color:'var(--label-4)', border:'1px solid var(--sep)' }}>Pendente</span>}
          {open ? <ChevronDown size={13} style={{ color:'var(--label-4)' }}/> : <ChevronR size={13} style={{ color:'var(--label-4)' }}/>}
        </div>
      </button>
      {open && (
        <div style={{ padding:'4px 16px 16px', borderTop:'1px solid var(--sep)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
            {integ.campos.map(campo => (
              <div key={campo.key} style={{ gridColumn: integ.campos.length===1?'1/-1':'auto' }}>
                <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:5 }}>{campo.label}</label>
                {campo.type==='password'
                  ? <SecretInput value={cfg[campo.key]} onChange={v=>setC(campo.key,v)} placeholder={campo.placeholder}/>
                  : <Input value={cfg[campo.key]} onChange={v=>setC(campo.key,v)} placeholder={campo.placeholder}/>}
                {campo.hint && <p style={{ fontSize:10, color:'var(--label-4)', marginTop:3 }}>{campo.hint}</p>}
              </div>
            ))}
          </div>
          {integ.oauth && (
            <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, background:'rgba(245,158,11,.06)', border:'1px solid rgba(245,158,11,.2)' }}>
              <AlertCircle size={13} style={{ color:'#f59e0b', flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:12, color:'var(--label-2)', margin:0 }}>O Bling usa OAuth — após salvar as credenciais, autorize o acesso.</p>
              </div>
              <a href={`${window.VITE_API_URL||''}/bling/auth`} target="_blank" rel="noopener"
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:'1px solid rgba(245,158,11,.3)', background:'rgba(245,158,11,.08)', color:'#f59e0b', fontSize:12, fontWeight:600, textDecoration:'none', flexShrink:0 }}>
                <ExternalLink size={11}/> Autorizar Bling
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── PhonePreview ──────────────────────────────────────────────────────────────
function PhonePreview({ nome, msg }) {
  return (
    <div style={{ width:185, borderRadius:22, overflow:'hidden', border:'2px solid var(--sep)', background:'#0b141a', flexShrink:0 }}>
      <div style={{ background:'#202c33', padding:'10px 12px', display:'flex', alignItems:'center', gap:9 }}>
        <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#000', flexShrink:0 }}>
          {(nome||'?')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:'#e9edef' }}>{nome||'Assistente'}</div>
          <div style={{ fontSize:9, color:'#8696a0' }}>online</div>
        </div>
      </div>
      <div style={{ padding:'10px 10px 14px', minHeight:80, background:'#0b141a', display:'flex', flexDirection:'column', gap:7 }}>
        <div style={{ padding:'7px 10px', borderRadius:'10px 10px 10px 2px', background:'#202c33', maxWidth:'85%' }}>
          <p style={{ fontSize:10, lineHeight:1.6, color:'#e9edef', margin:0, whiteSpace:'pre-wrap' }}>{(msg||'…').slice(0,120)}</p>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PageIAConfig({ api }) {
  const [active,    setActive]    = useState('identidade')
  const [collapsed, setCollapsed] = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [iaName,    setIaName]    = useState('Molise')
  const [iaPersona, setIaPersona] = useState('Você é Molise, assistente virtual da Só Strass. Seja simpática e objetiva.')
  const [tons,      setTons]      = useState(['Simpático','Profissional'])
  const [emoji,     setEmoji]     = useState(true)
  const [ctxData,   setCtxData]   = useState({})
  const [btns,      setBtns]      = useState(BTN_GROUPS_DEFAULT)
  const [schedule,  setSchedule]  = useState(DIAS.map((d,i)=>({day:d,on:i<6,start:i===5?'09:00':'08:00',end:i===5?'14:00':'18:00'})))
  const [cfg,       setCfg]       = useState({})
  const [genLoad,   setGenLoad]   = useState(null)
  const [editCtx,   setEditCtx]   = useState(null)  // modal aberto

  const setC = (k,v) => setCfg(c=>({...c,[k]:v}))

  useEffect(()=>{
    if (!api) return
    fetch(`${api}/api/ia/config`).then(r=>r.ok?r.json():null).then(d=>{
      if (!d) return
      if (d.persona||d.iaPersona) setIaPersona(d.persona||d.iaPersona)
      if (d.iaName)    setIaName(d.iaName)
      if (d.btns)      setBtns(d.btns)
      if (d.schedule)  setSchedule(d.schedule)
      if (d.tons)      setTons(d.tons)
      if (d.emoji!==undefined) setEmoji(d.emoji)
      if (d.ctxData)   setCtxData(d.ctxData)
      setCfg(prev=>({...prev,...d}))
    }).catch(()=>{})
  },[api])

  const salvar = async () => {
    setSaving(true)
    try {
      if (api) await fetch(`${api}/api/ia/config`,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({iaName,iaPersona,persona:iaPersona,tons,emoji,ctxData,btns,schedule,...cfg})})
      setSaved(true); setTimeout(()=>setSaved(false),2500)
    } catch {}
    setSaving(false)
  }

  const gerarVariacoes = async (ctxId) => {
    setGenLoad(ctxId)
    const ctxMap={saudacao:'saudação de assistente de loja de bijuterias',produto:'apresentação de produto de strass',carrinho:'confirmação de item adicionado ao carrinho',pedido:'confirmação de pedido criado',offline:'mensagem fora do horário de atendimento'}
    try {
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:500,messages:[{role:'user',content:`Gere 2 variações curtas de ${ctxMap[ctxId]||ctxId}. Responda APENAS com 2 frases separadas por ---. Sem numeração.`}]})})
      const d=await r.json()
      const parts=(d.content?.[0]?.text||'').split('---').map(s=>s.trim()).filter(Boolean)
      if (parts.length) setCtxData(prev=>({...prev,[ctxId]:{...(prev[ctxId]||{}),vars:[...(prev[ctxId]?.vars||[]),...parts]}}))
    } catch {}
    setGenLoad(null)
  }

  const saudacaoMsg = ctxData['saudacao']?.default || CTXS[0].default
  const showPreview = active==='identidade'||active==='mensagensIA'

  const PAGE = {
    identidade:  {title:'Identidade',       sub:'Nome, persona e tom da assistente'},
    mensagensIA: {title:'Mensagens IA',     sub:'Contextos e variações por evento'},
    botoes:      {title:'Botões WA',        sub:'Labels dos botões interativos WhatsApp'},
    horario:     {title:'Horário',          sub:'Janela de atendimento da IA'},
    integracoes: {title:'Integrações',      sub:'APIs, tokens e credenciais externas'},
    logistica:   {title:'Logística',        sub:'Frete e dimensões de embalagem'},
  }
  const p = PAGE[active]||{}

  return (
    <div style={{ height:'100%', display:'flex', overflow:'hidden', background:'var(--bg)', position:'relative' }}>
      <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed}/>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Header */}
        <div style={{ padding:'11px 20px', flexShrink:0, display:'flex', alignItems:'center', gap:14, borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
          <div>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--label)', margin:0 }}>{p.title}</h2>
            <p style={{ fontSize:11, color:'var(--label-4)', margin:'2px 0 0' }}>{p.sub}</p>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={salvar} disabled={saving} style={{
              display:'flex', alignItems:'center', gap:7, padding:'7px 16px', borderRadius:9,
              border:'none', cursor:'pointer', fontSize:12.5, fontWeight:700,
              background:saved?'#22c55e':'var(--accent)', color:'#000', transition:'all .2s'
            }}>
              {saved?<><CheckCircle size={13}/> Salvo</>:saving?'Salvando...':<><Save size={13}/> Salvar</>}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflow:'hidden', display:'flex' }}>
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
            <div style={{ maxWidth:640 }}>

              {/* IDENTIDADE */}
              {active==='identidade' && <>
                <Card style={{ marginBottom:16 }}>
                  <SectionTitle>Nome & Persona</SectionTitle>
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    <Field label="Nome da assistente" hint="Como a IA se apresenta — aparece no preview ao vivo">
                      <Input value={iaName} onChange={setIaName} placeholder="Molise"/>
                    </Field>
                    <Field label="Persona / System Prompt" hint="Instruções gerais de comportamento. Editado aqui salva no banco.">
                      <textarea value={iaPersona} onChange={e=>setIaPersona(e.target.value)} rows={5}
                        style={{ width:'100%', padding:'8px 10px', borderRadius:8, fontSize:12.5, outline:'none', resize:'vertical', background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)', fontFamily:'inherit', lineHeight:1.6, boxSizing:'border-box' }}/>
                    </Field>
                  </div>
                </Card>
                <Card>
                  <SectionTitle>Tom de voz & Emoji</SectionTitle>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:10 }}>Selecione até 3 tons</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {TONS.map(t=>{
                        const on=tons.includes(t)
                        return <button key={t} onClick={()=>setTons(on?tons.filter(x=>x!==t):[...tons,t].slice(0,3))} style={{ padding:'6px 14px', borderRadius:8, border:`1px solid ${on?'var(--accent)':'var(--sep)'}`, background:on?'var(--accent-dim)':'var(--fill)', color:on?'var(--accent)':'var(--label-3)', fontSize:12.5, fontWeight:500, cursor:'pointer', transition:'all .1s' }}>{t}</button>
                      })}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--sep)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      {emoji?<Smile size={16} style={{ color:'var(--accent)' }}/>:<SmilePlus size={16} style={{ color:'var(--label-4)' }}/>}
                      <div>
                        <p style={{ fontSize:13, fontWeight:500, color:'var(--label)', margin:0 }}>{emoji?'Emojis ativados':'Emojis desativados'}</p>
                        <p style={{ fontSize:11, color:'var(--label-4)', margin:0 }}>{emoji?'A IA pode usar emojis ocasionalmente':'Respostas sem emojis'}</p>
                      </div>
                    </div>
                    <button onClick={()=>setEmoji(v=>!v)} style={{ border:'none', background:'transparent', cursor:'pointer' }}>
                      {emoji?<ToggleRight size={22} style={{ color:'var(--accent)' }}/>:<ToggleLeft size={22} style={{ color:'var(--label-4)' }}/>}
                    </button>
                  </div>
                </Card>
              </>}

              {/* MENSAGENS IA */}
              {active==='mensagensIA' && <>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:10, background:'rgba(0,212,170,.06)', border:'1px solid rgba(0,212,170,.2)', marginBottom:16 }}>
                  <Sparkles size={14} style={{ color:'#00d4aa', flexShrink:0, marginTop:2 }}/>
                  <p style={{ fontSize:12, color:'var(--label-3)', lineHeight:1.6, margin:0 }}>
                    Mensagens enviadas pelo Gemini em cada contexto. Configure <strong style={{ color:'var(--label)' }}>variações A/B</strong> para que a IA rotacione automaticamente. Clique em <strong style={{ color:'var(--label)' }}>Editar</strong> para abrir o editor completo com preview.
                  </p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {CTXS.map(ctx=>{
                    const data = ctxData[ctx.id]
                    const vars = data?.vars ?? []
                    const Icon = ctx.icon
                    return (
                      <div key={ctx.id} style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12, padding:'13px 16px', display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:34, height:34, borderRadius:9, background:`${ctx.cor}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Icon size={15} style={{ color:ctx.cor }}/>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                            <span style={{ fontSize:13, fontWeight:600, color:'var(--label)' }}>{ctx.label}</span>
                            {vars.length>0 && <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:99, background:`${ctx.cor}15`, color:ctx.cor, border:`1px solid ${ctx.cor}25` }}>{vars.length} variação{vars.length!==1?'ões':''}</span>}
                          </div>
                          <p style={{ fontSize:11, color:'var(--label-4)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:360 }}>
                            {(data?.default||ctx.default).slice(0,80)}
                          </p>
                        </div>
                        <button onClick={()=>setEditCtx(ctx)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', fontSize:12, fontWeight:500, flexShrink:0 }}>
                          <Edit3 size={12}/> Editar
                        </button>
                      </div>
                    )
                  })}
                </div>
              </>}

              {/* BOTÕES WA */}
              {active==='botoes' && <>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:10, background:'rgba(74,159,255,.06)', border:'1px solid rgba(74,159,255,.2)', marginBottom:16 }}>
                  <Info size={14} style={{ color:'#4a9fff', flexShrink:0, marginTop:2 }}/>
                  <p style={{ fontSize:12, color:'var(--label-3)', lineHeight:1.6, margin:0 }}>
                    <strong style={{ color:'var(--label)' }}>Editáveis</strong>: você pode personalizar os labels (máx. 20 chars, sem emojis).
                    <strong style={{ color:'var(--label)' }}> Fixos</strong>: comportamento hardcoded no sistema — exibidos aqui para referência.
                  </p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {btns.map((grp,gi)=>(
                    <div key={gi} style={{ background:'var(--bg-2)', border:`1px solid ${grp.editavel?'var(--sep)':'var(--brd,var(--sep))'}`, borderRadius:12, overflow:'hidden' }}>
                      <div style={{ padding:'11px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid var(--sep)', background: grp.editavel?'var(--bg-2)':'var(--bg-3,var(--bg-2))' }}>
                        <div>
                          <span style={{ fontSize:13, fontWeight:600, color:'var(--label)' }}>{grp.label}</span>
                          <span style={{ fontSize:11, color:'var(--label-4)', marginLeft:10 }}>{grp.desc}</span>
                        </div>
                        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
                          {grp.editavel
                            ? <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:99, background:'rgba(0,212,170,.1)', color:'#00d4aa', border:'1px solid rgba(0,212,170,.2)' }}>Editável</span>
                            : <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:99, background:'var(--fill)', color:'var(--label-4)', border:'1px solid var(--sep)', display:'flex', alignItems:'center', gap:4 }}><Lock size={8}/> Fixo</span>}
                        </div>
                      </div>
                      <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
                        {grp.btns.map((btn,bi)=>(
                          <div key={bi} style={{ display:'flex', alignItems:'center', gap:10 }}>
                            {grp.editavel
                              ? <button onClick={()=>setBtns(bs=>bs.map((g,gi2)=>gi2!==gi?g:{...g,btns:g.btns.map((b,bi2)=>bi2!==bi?b:{...b,on:!b.on})}))} style={{ border:'none', background:'transparent', cursor:'pointer', flexShrink:0 }}>
                                  {btn.on?<ToggleRight size={20} style={{ color:'var(--accent)' }}/>:<ToggleLeft size={20} style={{ color:'var(--label-4)' }}/>}
                                </button>
                              : <div style={{ width:20, display:'flex', alignItems:'center' }}>
                                  <div style={{ width:6, height:6, borderRadius:'50%', background:btn.on?'#22c55e':'var(--label-4)' }}/>
                                </div>}
                            {grp.editavel
                              ? <><input value={btn.label} maxLength={20}
                                  onChange={e=>setBtns(bs=>bs.map((g,gi2)=>gi2!==gi?g:{...g,btns:g.btns.map((b,bi2)=>bi2!==bi?b:{...b,label:e.target.value})}))}
                                  style={{ flex:1, padding:'6px 10px', borderRadius:8, fontSize:12.5, outline:'none', background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)', fontFamily:'inherit' }}/>
                                <span style={{ fontSize:10, color:btn.label.length>20?'#ef4444':'var(--label-4)', flexShrink:0, width:32, textAlign:'right' }}>{btn.label.length}/20</span></>
                              : <span style={{ flex:1, fontSize:12.5, color:'var(--label-3)', padding:'6px 10px', borderRadius:8, background:'var(--bg-3,var(--fill))', border:'1px solid var(--sep)' }}>{btn.label}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>}

              {/* HORÁRIO */}
              {active==='horario' && (
                <Card>
                  <SectionTitle sub={'Fora desse intervalo a IA envia a mensagem offline'}>Horário de atendimento</SectionTitle>
                  {schedule.map((s,i)=>(
                    <div key={s.day} style={{ display:'flex', alignItems:'center', gap:12, paddingBlock:'9px', borderBottom:i<schedule.length-1?'1px solid var(--sep)':'none' }}>
                      <span style={{ width:72, fontSize:12.5, fontWeight:500, color:s.on?'var(--label)':'var(--label-4)' }}>{s.day}</span>
                      <input value={s.start} onChange={e=>setSchedule(sc=>sc.map((x,xi)=>xi!==i?x:{...x,start:e.target.value}))} style={{ width:70, padding:'5px 8px', borderRadius:7, fontSize:12, fontFamily:'monospace', outline:'none', background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)', textAlign:'center' }}/>
                      <span style={{ fontSize:11, color:'var(--label-4)' }}>às</span>
                      <input value={s.end} onChange={e=>setSchedule(sc=>sc.map((x,xi)=>xi!==i?x:{...x,end:e.target.value}))} style={{ width:70, padding:'5px 8px', borderRadius:7, fontSize:12, fontFamily:'monospace', outline:'none', background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)', textAlign:'center' }}/>
                      <div style={{ flex:1 }}/>
                      <button onClick={()=>setSchedule(sc=>sc.map((x,xi)=>xi!==i?x:{...x,on:!x.on}))} style={{ border:'none', background:'transparent', cursor:'pointer' }}>
                        {s.on?<ToggleRight size={20} style={{ color:'var(--accent)' }}/>:<ToggleLeft size={20} style={{ color:'var(--label-4)' }}/>}
                      </button>
                    </div>
                  ))}
                </Card>
              )}

              {/* INTEGRAÇÕES */}
              {active==='integracoes' && (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {INTEGRACOES.map(integ=>(
                    <IntGroup key={integ.id} integ={integ} cfg={cfg} setC={setC} api={api}/>
                  ))}
                </div>
              )}

              {/* LOGÍSTICA */}
              {active==='logistica' && <>
                <Card style={{ marginBottom:14 }}>
                  <SectionTitle sub={'Usadas para cotação de frete — configure a caixa padrão'}>Dimensões da embalagem padrão</SectionTitle>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {[['caixaAltura','Altura (cm)'],['caixaLargura','Largura (cm)'],['caixaComprimento','Comprimento (cm)'],['caixaPesoMinimo','Peso mínimo (kg)']].map(([k,lb])=>(
                      <Field key={k} label={lb}><Input value={cfg[k]} onChange={v=>setC(k,v)} type="number"/></Field>
                    ))}
                  </div>
                </Card>
                <Card>
                  <SectionTitle>Dados da loja</SectionTitle>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <Field label="CEP de origem" hint="CEP da sua loja"><Input value={cfg.cepOrigem} onChange={v=>setC('cepOrigem',v)} placeholder="13480000"/></Field>
                    <Field label="Nome da loja"><Input value={cfg.nomeLoja} onChange={v=>setC('nomeLoja',v)} placeholder="Só Strass"/></Field>
                    <Field label="Horário de atendimento"><Input value={cfg.horarioAtendimento} onChange={v=>setC('horarioAtendimento',v)} placeholder="08:00-18:00"/></Field>
                    <Field label="Dias de atendimento"><Input value={cfg.diasAtendimento} onChange={v=>setC('diasAtendimento',v)} placeholder="seg-sex"/></Field>
                  </div>
                </Card>
              </>}

            </div>
          </div>

          {/* Preview lateral */}
          {showPreview && (
            <div style={{ width:230, flexShrink:0, padding:'20px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:16, borderLeft:'1px solid var(--sep)', background:'var(--bg-2)', overflowY:'auto' }}>
              <PhonePreview nome={iaName} msg={saudacaoMsg}/>
              {tons.length>0 && (
                <div style={{ width:'100%' }}>
                  <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:8, textAlign:'center' }}>Tom ativo</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center' }}>
                    {tons.map(t=><span key={t} style={{ fontSize:10.5, padding:'3px 9px', borderRadius:99, background:'var(--accent-dim)', color:'var(--accent)' }}>{t}</span>)}
                  </div>
                </div>
              )}
              <div style={{ width:'100%', textAlign:'center' }}>
                <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:5 }}>Emoji</p>
                <span style={{ fontSize:12, color:emoji?'#22c55e':'var(--label-4)' }}>{emoji?'✓ Ativo':'✗ Desativado'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de edição de mensagem */}
      {editCtx && (
        <MsgModal
          ctx={editCtx}
          data={ctxData[editCtx.id]}
          onClose={()=>setEditCtx(null)}
          onChange={d=>setCtxData(p=>({...p,[editCtx.id]:d}))}
          onGenerate={gerarVariacoes}
          generating={genLoad===editCtx.id}
        />
      )}
    </div>
  )
}
