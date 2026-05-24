import { useState, useEffect, useCallback } from 'react'
import { Save, RotateCcw, Zap, Shield, MessageSquare, ShoppingCart, Truck, CreditCard, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react'

const API_KEY_LOCAL = 'bia_llm_config'

const BYPASS_FEATURES = [
  {
    id: 'bypass_finalizar',
    categoria: 'Checkout',
    icon: ShoppingCart,
    titulo: 'Finalizar pedido',
    desc: 'Botão "Finalizar pedido" ativa o fluxo de checkout sem passar pelo Gemini',
    cor: '#1D9E75',
    ativo: true,
  },
  {
    id: 'bypass_cadastro',
    categoria: 'Checkout',
    icon: Shield,
    titulo: 'Já tenho cadastro / Sou novo cliente',
    desc: 'Botões de identificação do cliente vão direto para a função sem consultar a IA',
    cor: '#1D9E75',
    ativo: true,
  },
  {
    id: 'bypass_endereco',
    categoria: 'Checkout',
    icon: Truck,
    titulo: 'Confirmar / Alterar endereço',
    desc: 'Confirmação de endereço dispara calcular_frete diretamente',
    cor: '#1D9E75',
    ativo: true,
  },
  {
    id: 'bypass_frete',
    categoria: 'Checkout',
    icon: Truck,
    titulo: 'Seleção de frete (menu)',
    desc: 'Item selecionado no menu de frete vai direto para o ESTADO 1 sem Gemini',
    cor: '#1D9E75',
    ativo: true,
  },
  {
    id: 'bypass_pagamento',
    categoria: 'Pagamento',
    icon: CreditCard,
    titulo: 'Pagar com PIX / Cartão de Crédito',
    desc: 'Escolha de forma de pagamento executa finalizar_pedido diretamente via executarFerramenta',
    cor: '#e65100',
    ativo: true,
  },
  {
    id: 'bypass_numero_end',
    categoria: 'Endereço',
    icon: Truck,
    titulo: 'Número e complemento do endereço',
    desc: 'Após informar o CEP, o número/complemento chama finalizar_pedido via bypass direto',
    cor: '#378ADD',
    ativo: true,
  },
  {
    id: 'bypass_carrinho_edit',
    categoria: 'Carrinho',
    icon: ShoppingCart,
    titulo: 'Editar carrinho',
    desc: 'Botões de edição do carrinho (Remover, Alterar quantidade, Limpar) vão direto para a função',
    cor: '#534AB7',
    ativo: true,
  },
]

const MENSAGENS_PADRAO = [
  {
    id: 'msg_saudacao',
    categoria: 'Atendimento',
    titulo: 'Saudação inicial',
    desc: 'Primeira mensagem enviada quando o cliente inicia conversa',
    valor_padrao: 'Olá! Seja bem-vindo(a) à {loja}. Como posso te ajudar? 😊',
  },
  {
    id: 'msg_cpf',
    categoria: 'Checkout',
    titulo: 'Solicitação de CPF/CNPJ',
    desc: 'Mensagem enviada ao clicar em "Já tenho cadastro"',
    valor_padrao: 'Por favor, informe seu CPF ou CNPJ para buscarmos seu cadastro. 😊',
  },
  {
    id: 'msg_alterar_end',
    categoria: 'Endereço',
    titulo: 'Solicitar novo CEP',
    desc: 'Mensagem enviada ao clicar em "Alterar endereço"',
    valor_padrao: '📮 Qual é o novo CEP de entrega?\nDigite apenas o CEP (8 dígitos) que buscaremos o endereço automaticamente.',
  },
  {
    id: 'msg_numero_end',
    categoria: 'Endereço',
    titulo: 'Solicitar número/complemento',
    desc: 'Mensagem enviada após encontrar o endereço pelo CEP',
    valor_padrao: 'Qual o número e complemento (se houver)?\nExemplo: 90 · Apto 12',
  },
  {
    id: 'msg_pix_instrucao',
    categoria: 'Pagamento',
    titulo: 'Instrução de pagamento PIX',
    desc: 'Texto exibido com o código PIX copia e cola (o código é enviado em mensagem separada)',
    valor_padrao: '📲 Pague com PIX:\n_Toque no botão abaixo para copiar o código e cole no seu banco._\n⏰ _Válido por 24h. Confirmaremos o pagamento automaticamente._ ✅',
  },
  {
    id: 'msg_confirmacao_pedido',
    categoria: 'Pagamento',
    titulo: 'Confirmação de pagamento (MP Webhook)',
    desc: 'Mensagem enviada quando o Mercado Pago confirma o pagamento automaticamente',
    valor_padrao: '⚡ *Pagamento confirmado!*\n\n✅ Recebemos seu pagamento via {metodo}.\n\n📦 *Pedido #{numero_pedido}* está confirmado e será preparado em breve!\n\n_Obrigada pela compra na Só Strass! 🥰_',
  },
]

function Toggle({ ativo, onChange }) {
  return (
    <button onClick={() => onChange(!ativo)} style={{
      width:40, height:22, borderRadius:11, border:'none', cursor:'pointer', padding:2,
      background: ativo ? 'var(--accent)' : 'var(--fill)',
      transition:'background .2s', position:'relative', flexShrink:0,
    }}>
      <div style={{
        width:18, height:18, borderRadius:'50%', background:'#fff',
        transform: ativo ? 'translateX(18px)' : 'translateX(0)',
        transition:'transform .2s', position:'relative',
      }} />
    </button>
  )
}

function BypassCard({ feature, ativo, onChange }) {
  const Icon = feature.icon
  return (
    <div style={{
      background:'var(--bg-2)', border:`0.5px solid ${ativo ? feature.cor+'40' : 'var(--sep)'}`,
      borderRadius:10, padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:12,
      transition:'border-color .2s',
    }}>
      <div style={{ width:36, height:36, borderRadius:8, background:`${feature.cor}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={16} style={{ color: ativo ? feature.cor : 'var(--label-3)' }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <span style={{ fontSize:13, fontWeight:500, color: ativo ? 'var(--label)' : 'var(--label-3)' }}>{feature.titulo}</span>
          <Toggle ativo={ativo} onChange={onChange} />
        </div>
        <p style={{ fontSize:11, color:'var(--label-3)', margin:0, lineHeight:1.5 }}>{feature.desc}</p>
        <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background:`${feature.cor}15`, color:feature.cor, fontWeight:500, marginTop:6, display:'inline-block' }}>
          {feature.categoria}
        </span>
      </div>
    </div>
  )
}

function MsgCard({ msg, valor, onChange }) {
  const [expandido, setExpandido] = useState(false)
  const [copiado,   setCopiado]   = useState(false)

  const copiar = () => {
    navigator.clipboard.writeText(valor || msg.valor_padrao)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:10, overflow:'hidden' }}>
      <div onClick={() => setExpandido(e => !e)} style={{ padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:500, color:'var(--label)' }}>{msg.titulo}</div>
          <div style={{ fontSize:11, color:'var(--label-3)', marginTop:2 }}>{msg.desc}</div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0, marginLeft:12 }}>
          <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background:'var(--fill)', color:'var(--label-3)', fontWeight:500 }}>{msg.categoria}</span>
          {expandido ? <ChevronUp size={14} style={{ color:'var(--label-3)' }} /> : <ChevronDown size={14} style={{ color:'var(--label-3)' }} />}
        </div>
      </div>
      {expandido && (
        <div style={{ padding:'0 16px 14px', borderTop:'0.5px solid var(--sep)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, paddingTop:12 }}>
            <span style={{ fontSize:11, color:'var(--label-3)' }}>Mensagem atual</span>
            <button onClick={copiar} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--label-3)', background:'transparent', border:'none', cursor:'pointer', padding:'2px 6px' }}>
              {copiado ? <><Check size={11} style={{ color:'var(--accent)' }} /> Copiado</> : <><Copy size={11} /> Copiar</>}
            </button>
          </div>
          <textarea
            value={valor || msg.valor_padrao}
            onChange={e => onChange(msg.id, e.target.value)}
            rows={4}
            style={{
              width:'100%', padding:'10px 12px', borderRadius:8, border:'0.5px solid var(--sep)',
              background:'var(--bg)', color:'var(--label)', fontSize:12, fontFamily:'var(--font-mono, monospace)',
              resize:'vertical', outline:'none', lineHeight:1.5, boxSizing:'border-box',
            }}
          />
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <button onClick={() => onChange(msg.id, msg.valor_padrao)} style={{
              fontSize:11, padding:'4px 10px', borderRadius:6, border:'0.5px solid var(--sep)',
              background:'transparent', color:'var(--label-3)', cursor:'pointer',
              display:'flex', alignItems:'center', gap:4,
            }}>
              <RotateCcw size={10} /> Restaurar padrão
            </button>
          </div>
          <div style={{ marginTop:8, fontSize:11, color:'var(--label-3)' }}>
            Variáveis: <code style={{ background:'var(--fill)', padding:'1px 4px', borderRadius:3 }}>{'{loja}'}</code>{' '}
            <code style={{ background:'var(--fill)', padding:'1px 4px', borderRadius:3 }}>{'{nome_cliente}'}</code>{' '}
            <code style={{ background:'var(--fill)', padding:'1px 4px', borderRadius:3 }}>{'{numero_pedido}'}</code>{' '}
            <code style={{ background:'var(--fill)', padding:'1px 4px', borderRadius:3 }}>{'{metodo}'}</code>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PageLLMConfig({ api }) {
  const [aba,      setAba]      = useState('bypasses')
  const [bypasses, setBypasses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bia_bypasses') || '{}') } catch { return {} }
  })
  const [mensagens, setMensagens] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bia_mensagens') || '{}') } catch { return {} }
  })
  const [salvo,    setSalvo]    = useState(false)
  const [modelo,   setModelo]   = useState('gemini-2.5-flash')
  const [maxIter,  setMaxIter]  = useState(8)
  const [temperat, setTemperat] = useState(0.7)

  const getBypass = id => bypasses[id] !== undefined ? bypasses[id] : BYPASS_FEATURES.find(f => f.id === id)?.ativo ?? true
  const setBypass = (id, val) => setBypasses(b => ({ ...b, [id]: val }))
  const getMensagem = id => mensagens[id]
  const setMensagem = (id, val) => setMensagens(m => ({ ...m, [id]: val }))

  const salvar = () => {
    localStorage.setItem('bia_bypasses', JSON.stringify(bypasses))
    localStorage.setItem('bia_mensagens', JSON.stringify(mensagens))
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
  }

  const resetar = () => {
    setBypasses({})
    setMensagens({})
    localStorage.removeItem('bia_bypasses')
    localStorage.removeItem('bia_mensagens')
  }

  const grupos = [...new Set(BYPASS_FEATURES.map(f => f.categoria))]

  const abas = [
    { id:'bypasses', label:'Bypasses & Fluxo' },
    { id:'mensagens', label:'Mensagens padrão' },
    { id:'modelo',   label:'Modelo & Parâmetros' },
  ]

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 28px', maxWidth:860 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:500, margin:0, color:'var(--label)' }}>Config LLM & Function Calling</h1>
          <p style={{ fontSize:13, color:'var(--label-3)', margin:'3px 0 0' }}>Controle os bypasses, mensagens padrão e parâmetros do modelo</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={resetar} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'0.5px solid var(--sep)', background:'transparent', color:'var(--label-3)', fontSize:12, cursor:'pointer' }}>
            <RotateCcw size={12} /> Resetar
          </button>
          <button onClick={salvar} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', background: salvo?'#1D9E75':'var(--accent)', color:'#000', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            {salvo ? <><CheckCircle size={12} /> Salvo!</> : <><Save size={12} /> Salvar</>}
          </button>
        </div>
      </div>

      {/* Aviso */}
      <div style={{ display:'flex', gap:10, padding:'10px 14px', borderRadius:8, background:'#EF9F2715', border:'0.5px solid #EF9F2740', marginBottom:20 }}>
        <AlertCircle size={14} style={{ color:'#EF9F27', flexShrink:0, marginTop:1 }} />
        <div style={{ fontSize:12, color:'var(--label-2)', lineHeight:1.5 }}>
          As configurações de bypass e mensagens ficam salvas localmente. Para aplicar no servidor, atualize os valores diretamente no <code style={{ background:'var(--fill)', padding:'1px 4px', borderRadius:3 }}>ia-core.js</code> correspondente.
        </div>
      </div>

      {/* Abas */}
      <div style={{ display:'flex', gap:0, borderBottom:'0.5px solid var(--sep)', marginBottom:20 }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            padding:'8px 16px', fontSize:13, fontWeight:500, border:'none', background:'transparent',
            cursor:'pointer', borderBottom:`2px solid ${aba===a.id?'var(--accent)':'transparent'}`,
            color: aba===a.id?'var(--accent)':'var(--label-3)', marginBottom:-1,
          }}>{a.label}</button>
        ))}
      </div>

      {/* Bypasses */}
      {aba === 'bypasses' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {grupos.map(grupo => (
            <div key={grupo}>
              <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--label-3)', marginBottom:10 }}>
                {grupo}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {BYPASS_FEATURES.filter(f => f.categoria === grupo).map(feature => (
                  <BypassCard key={feature.id} feature={feature} ativo={getBypass(feature.id)} onChange={val => setBypass(feature.id, val)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mensagens */}
      {aba === 'mensagens' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {MENSAGENS_PADRAO.map(msg => (
            <MsgCard key={msg.id} msg={msg} valor={getMensagem(msg.id)} onChange={setMensagem} />
          ))}
        </div>
      )}

      {/* Modelo */}
      {aba === 'modelo' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:10, padding:'16px 18px' }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--label)', marginBottom:14 }}>Modelo de linguagem</div>
            {[
              { id:'gemini-2.5-flash', label:'Gemini 2.5 Flash', desc:'Rápido e eficiente — recomendado para produção', badge:'Atual' },
              { id:'gemini-2.5-pro',   label:'Gemini 2.5 Pro',   desc:'Mais inteligente, mais lento e caro', badge:'Premium' },
              { id:'gemini-2.0-flash', label:'Gemini 2.0 Flash', desc:'Versão anterior, mais estável', badge:'' },
            ].map(m => (
              <div key={m.id} onClick={() => setModelo(m.id)} style={{
                display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:8,
                border:`0.5px solid ${modelo===m.id?'var(--accent)':'var(--sep)'}`,
                background: modelo===m.id?'var(--accent-dim)':'transparent',
                cursor:'pointer', marginBottom:6,
              }}>
                <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${modelo===m.id?'var(--accent)':'var(--sep)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {modelo===m.id && <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)' }} />}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--label)' }}>{m.label}</div>
                  <div style={{ fontSize:11, color:'var(--label-3)' }}>{m.desc}</div>
                </div>
                {m.badge && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background: m.badge==='Atual'?'#1D9E7520':'var(--fill)', color: m.badge==='Atual'?'#1D9E75':'var(--label-3)', fontWeight:500 }}>{m.badge}</span>}
              </div>
            ))}
          </div>

          <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:10, padding:'16px 18px' }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--label)', marginBottom:14 }}>Parâmetros</div>
            {[
              { label:'Máx. iterações (MAX_ITER)', value:maxIter, min:3, max:15, step:1, set:setMaxIter, desc:'Número máximo de chamadas ao modelo por mensagem' },
              { label:'Temperatura', value:temperat, min:0, max:1, step:0.1, set:setTemperat, desc:'0 = mais determinístico · 1 = mais criativo' },
            ].map(p => (
              <div key={p.label} style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:500, color:'var(--label)' }}>{p.label}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--accent)' }}>{p.value}</span>
                </div>
                <input type="range" min={p.min} max={p.max} step={p.step} value={p.value}
                  onChange={e => p.set(Number(e.target.value))}
                  style={{ width:'100%', accentColor:'var(--accent)', cursor:'pointer' }} />
                <div style={{ fontSize:11, color:'var(--label-3)', marginTop:4 }}>{p.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:10, padding:'16px 18px' }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--label)', marginBottom:4 }}>Configuração atual no servidor</div>
            <div style={{ fontSize:11, color:'var(--label-3)', marginBottom:12 }}>Variáveis de ambiente no Railway</div>
            <pre style={{ background:'var(--bg)', borderRadius:8, padding:'12px', fontSize:11, color:'var(--label-2)', overflowX:'auto', margin:0, fontFamily:'monospace', lineHeight:1.6 }}>
{`GEMINI_MODEL     = ${modelo}
MAX_ITER         = ${maxIter}
MP_ACCESS_TOKEN  = APP_USR-****
BACKEND_URL      = https://whatsapp-sostrass.up.railway.app
PIX_CHAVE        = 42614714000130`}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
