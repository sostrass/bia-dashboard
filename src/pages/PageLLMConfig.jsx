import { useState, useEffect } from 'react'
import { Save, RotateCcw, Zap, Shield, MessageSquare, ShoppingCart, Truck, CreditCard,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, Copy, Check, Key, TestTube2 } from 'lucide-react'

const BYPASS_FEATURES = [
  { id:'bypass_quantidade',  cat:'Carrinho',  icon:ShoppingCart, cor:'#1D9E75',
    titulo:'Seleção de produto → pergunta quantidade',
    desc:'Quando cliente seleciona produto por número, envia pergunta de quantidade direto ao WhatsApp sem passar pelo Gemini.' },
  { id:'bypass_finalizar',   cat:'Checkout',  icon:ShoppingCart, cor:'#1D9E75',
    titulo:'Finalizar pedido',
    desc:'Botão "Finalizar pedido" chama finalizar_pedido() direto via bypass — não passa pelo Gemini.' },
  { id:'bypass_cpf',         cat:'Checkout',  icon:Shield,       cor:'#1D9E75',
    titulo:'CPF/CNPJ recebido → finalizar_pedido',
    desc:'Após receber o CPF em "Já tenho cadastro", chama finalizar_pedido() via executarFerramenta direto.' },
  { id:'bypass_pix',         cat:'Pagamento', icon:CreditCard,   cor:'#e65100',
    titulo:'Pagar com PIX / Cartão',
    desc:'Escolha de forma de pagamento executa finalizar_pedido() via executarFerramenta sem consultar a IA.' },
  { id:'bypass_endereco',    cat:'Checkout',  icon:Truck,        cor:'#378ADD',
    titulo:'Confirmar endereço → calcular_frete',
    desc:'Confirmação de endereço dispara calcular_frete() direto via executarFerramenta.' },
  { id:'bypass_alterar_end', cat:'Checkout',  icon:Truck,        cor:'#378ADD',
    titulo:'Alterar endereço → solicita CEP',
    desc:'Botão "Alterar endereço" envia pedido de CEP direto ao WhatsApp e aguarda resposta.' },
  { id:'bypass_remover',     cat:'Carrinho',  icon:ShoppingCart, cor:'#534AB7',
    titulo:'Remover item / Alterar quantidade',
    desc:'Botões de edição do carrinho enviam lista numerada direto e aguardam seleção do cliente.' },
]

const MENSAGENS_PADRAO = [
  // Checkout
  { id:'msg_cpf',           cat:'Checkout',   titulo:'Solicitar CPF/CNPJ',
    campo:'msgCpf',          pad:'Por favor, informe seu *CPF ou CNPJ* para buscarmos seu cadastro. 😊',
    vars:'' },
  // Endereço
  { id:'msg_alterar_end',   cat:'Endereço',   titulo:'Solicitar novo CEP',
    campo:'msgAlterarEnd',   pad:'📮 *Qual é o novo CEP de entrega?*\n\nDigite apenas o CEP (8 dígitos) que buscaremos o endereço automaticamente.',
    vars:'' },
  { id:'msg_cep_invalido',  cat:'Endereço',   titulo:'CEP com formato inválido',
    campo:'msgCepInvalido',  pad:'Por favor, informe apenas o *CEP* com 8 dígitos (ex: 13482323).',
    vars:'' },
  { id:'msg_cep_nao_enc',   cat:'Endereço',   titulo:'CEP não encontrado',
    campo:'msgCepNaoEncontrado', pad:'⚠️ CEP *{cep}* não encontrado.\nVerifique o número e tente novamente.',
    vars:'{cep} = CEP digitado' },
  { id:'msg_erro_cep',      cat:'Endereço',   titulo:'Erro ao buscar CEP',
    campo:'msgErroCep',      pad:'⚠️ Não consegui verificar o CEP. Tente novamente.',
    vars:'' },
  // Carrinho
  { id:'msg_qtd_produto',   cat:'Carrinho',   titulo:'Perguntar quantidade (produto novo)',
    campo:'msgQtdProduto',   pad:'Quantas unidades de *{produto}* você gostaria?',
    vars:'{produto} = nome do produto' },
  { id:'msg_qtd_alterar',   cat:'Carrinho',   titulo:'Perguntar quantidade (alterar item)',
    campo:'msgQtdAlterar',   pad:'Quantas unidades de *{produto}* você deseja? (atual: {qtd_atual}x)',
    vars:'{produto} = nome | {qtd_atual} = quantidade atual' },
  { id:'msg_remover_item',  cat:'Carrinho',   titulo:'Cabeçalho: remover item',
    campo:'msgRemoverItem',  pad:'🗑️ *Qual item deseja remover?*',
    vars:'(a lista de itens é adicionada automaticamente)' },
  { id:'msg_alterar_qtd',   cat:'Carrinho',   titulo:'Cabeçalho: alterar quantidade',
    campo:'msgAlterarQtd',   pad:'✏️ *Qual item deseja alterar?*',
    vars:'(a lista de itens é adicionada automaticamente)' },
  { id:'msg_carrinho_vazio',cat:'Carrinho',   titulo:'Carrinho esvaziado',
    campo:'msgCarrinhoVazio',pad:'🗑️ Carrinho esvaziado.\n\nO que você está procurando?',
    vars:'' },
  { id:'msg_adicionar_item',cat:'Carrinho',   titulo:'"Adicionar item" — pede produto',
    campo:'msgAdicionarItem',pad:'Qual produto você está procurando?',
    vars:'' },
  { id:'msg_nova_busca',    cat:'Carrinho',   titulo:'Nova busca após limpar',
    campo:'msgNovaBusca',    pad:'O que você está procurando?',
    vars:'' },
  // Fotos
  { id:'msg_todas_fotos',   cat:'Fotos',      titulo:'Todas as fotos enviadas',
    campo:'msgTodasFotos',   pad:'Essas são todas as {n} fotos disponíveis para este produto.',
    vars:'{n} = número de fotos' },
]

function Toggle({ ativo }) {
  return (
    <div style={{ width:40, height:22, borderRadius:11, padding:2, flexShrink:0,
      background: ativo ? 'var(--accent)' : 'var(--fill)', position:'relative' }}>
      <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff',
        transform: ativo ? 'translateX(18px)' : 'translateX(0)', transition:'transform .2s',
        position:'relative' }} />
    </div>
  )
}

function BypassCard({ f }) {
  const Icon = f.icon
  return (
    <div style={{ background:'var(--bg-2)', border:`0.5px solid ${f.cor}40`,
      borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:12 }}>
      <div style={{ width:34, height:34, borderRadius:8, background:`${f.cor}15`,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={15} style={{ color: f.cor }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
          <span style={{ fontSize:13, fontWeight:500, color:'var(--label)' }}>{f.titulo}</span>
          <Toggle ativo={true} />
        </div>
        <p style={{ fontSize:11, color:'var(--label-3)', margin:0, lineHeight:1.5 }}>{f.desc}</p>
        <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background:`${f.cor}15`,
          color:f.cor, fontWeight:500, marginTop:5, display:'inline-block' }}>{f.cat}</span>
      </div>
    </div>
  )
}

export default function PageLLMConfig({ api }) {
  const [aba,       setAba]       = useState('modelo')
  const [cfg,       setCfg]       = useState({})
  const [loading,   setLoading]   = useState(true)
  const [salvando,  setSalvando]  = useState(false)
  const [salvo,     setSalvo]     = useState(false)
  const [erro,      setErro]      = useState(null)
  const [testando,  setTestando]  = useState(false)
  const [testeRes,  setTesteRes]  = useState(null)
  const [modelos,   setModelos]   = useState([])

  // Carrega config do banco
  useEffect(() => {
    if (!api) return
    Promise.all([
      fetch(`${api}/api/ia/config`).then(r => r.ok ? r.json() : {}),
      fetch(`${api}/api/ia/modelos`).then(r => r.ok ? r.json() : {}),
    ]).then(([c, m]) => {
      setCfg(c || {})
      setModelos(m?.provedores || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [api])

  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }))

  const salvar = async () => {
    setSalvando(true); setErro(null)
    try {
      const r = await fetch(`${api}/api/ia/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      })
      if (!r.ok) throw new Error(await r.text())
      setSalvo(true); setTimeout(() => setSalvo(false), 2500)
    } catch (e) {
      setErro(e.message?.slice(0, 100))
    } finally { setSalvando(false) }
  }

  const testarChave = async () => {
    setTestando(true); setTesteRes(null)
    try {
      const r = await fetch(`${api}/api/ia/test-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiKey: cfg.geminiKey }),
      })
      const d = await r.json()
      setTesteRes(d)
    } catch { setTesteRes({ ok: false, erro: 'Erro de conexão' }) }
    setTestando(false)
  }

  const inputStyle = {
    width:'100%', padding:'7px 10px', borderRadius:7, border:'0.5px solid var(--sep)',
    background:'var(--bg)', color:'var(--label)', fontSize:12, outline:'none',
    fontFamily:'inherit', boxSizing:'border-box',
  }
  const labelStyle = { fontSize:11, color:'var(--label-3)', marginBottom:4, display:'block', fontWeight:500 }
  const sectionStyle = { background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:10, padding:'16px 18px', display:'flex', flexDirection:'column', gap:12 }

  const provedorAtual = modelos.find(p => p.id === (cfg.provedor || 'google'))
  const modelosDisponiveis = provedorAtual?.modelos || []

  const abas = [
    { id:'modelo',   label:'🤖 Modelo & API' },
    { id:'params',   label:'⚙️ Parâmetros' },
    { id:'bypasses', label:'⚡ Bypasses' },
    { id:'msgs',     label:'💬 Mensagens' },
  ]

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--label-3)', fontSize:13 }}>
      Carregando configuração...
    </div>
  )

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 28px', maxWidth:800 }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:600, margin:0, color:'var(--label)' }}>Config LLM & Function Calling</h1>
          <p style={{ fontSize:13, color:'var(--label-3)', margin:'4px 0 0' }}>
            Conectado ao banco — alterações se aplicam imediatamente no ia-core
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {erro && <span style={{ fontSize:11, color:'#ef4444' }}>{erro}</span>}
          <button onClick={salvar} disabled={salvando} style={{
            display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
            borderRadius:8, border:'none',
            background: salvo ? '#1D9E75' : 'var(--accent)',
            color:'#000', fontSize:12, fontWeight:600, cursor:'pointer',
          }}>
            {salvo ? <><CheckCircle size={13}/> Salvo!</> : salvando ? 'Salvando...' : <><Save size={13}/> Salvar</>}
          </button>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display:'flex', gap:0, borderBottom:'0.5px solid var(--sep)', marginBottom:22 }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            padding:'8px 16px', fontSize:12, fontWeight:500, border:'none',
            background:'transparent', cursor:'pointer',
            borderBottom:`2px solid ${aba===a.id ? 'var(--accent)' : 'transparent'}`,
            color: aba===a.id ? 'var(--accent)' : 'var(--label-3)', marginBottom:-1,
          }}>{a.label}</button>
        ))}
      </div>

      {/* ── ABA: Modelo & API ── */}
      {aba === 'modelo' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Provedor */}
          <div style={sectionStyle}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--label)' }}>Provedor de IA</div>
            <div style={{ display:'flex', gap:10 }}>
              {[{id:'google',label:'Google Gemini',badge:'Recomendado'},{id:'anthropic',label:'Anthropic Claude',badge:''}].map(p => (
                <div key={p.id} onClick={() => set('provedor', p.id)} style={{
                  flex:1, padding:'10px 14px', borderRadius:8, cursor:'pointer',
                  border:`0.5px solid ${(cfg.provedor||'google')===p.id ? 'var(--accent)' : 'var(--sep)'}`,
                  background: (cfg.provedor||'google')===p.id ? 'var(--accent-dim)' : 'var(--bg)',
                }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--label)' }}>{p.label}</div>
                  {p.badge && <div style={{ fontSize:10, color:'var(--accent)', marginTop:2 }}>{p.badge}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Modelo */}
          <div style={sectionStyle}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--label)' }}>Modelo</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {modelosDisponiveis.length > 0 ? modelosDisponiveis.map(m => (
                <div key={m.id} onClick={() => set('modelo', m.id)} style={{
                  display:'flex', alignItems:'center', gap:12, padding:'10px 12px',
                  borderRadius:8, cursor:'pointer',
                  border:`0.5px solid ${cfg.modelo===m.id ? 'var(--accent)' : 'var(--sep)'}`,
                  background: cfg.modelo===m.id ? 'var(--accent-dim)' : 'transparent',
                }}>
                  <div style={{ width:14, height:14, borderRadius:'50%',
                    border:`2px solid ${cfg.modelo===m.id ? 'var(--accent)' : 'var(--sep)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {cfg.modelo===m.id && <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)' }}/>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:'var(--label)' }}>{m.nome}</div>
                    <div style={{ fontSize:11, color:'var(--label-3)' }}>{m.desc}</div>
                  </div>
                  <div style={{ fontSize:10, color:'var(--label-3)', textAlign:'right' }}>
                    <div>in: ${m.inputPer1M}/M tokens</div>
                    <div>out: ${m.outputPer1M}/M tokens</div>
                  </div>
                  {m.freeTier && <span style={{ fontSize:9, padding:'2px 6px', borderRadius:99, background:'#1D9E7520', color:'#1D9E75', fontWeight:600 }}>Free Tier</span>}
                </div>
              )) : (
                <input style={inputStyle} value={cfg.modelo||''} onChange={e=>set('modelo',e.target.value)} placeholder="gemini-2.5-flash"/>
              )}
            </div>
          </div>

          {/* API Keys */}
          <div style={sectionStyle}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--label)' }}>API Keys</div>
            <div>
              <label style={labelStyle}>Chave Gemini (Google)</label>
              <div style={{ display:'flex', gap:8 }}>
                <input type="password" style={{...inputStyle, flex:1}} value={cfg.geminiKey||''}
                  onChange={e=>set('geminiKey',e.target.value)} placeholder="AIzaSy..."/>
                <button onClick={testarChave} disabled={testando} style={{
                  padding:'7px 12px', borderRadius:7, border:'0.5px solid var(--sep)',
                  background:'transparent', color:'var(--label-3)', fontSize:11, cursor:'pointer',
                  display:'flex', alignItems:'center', gap:5, flexShrink:0,
                }}>
                  <TestTube2 size={12}/> {testando ? 'Testando...' : 'Testar'}
                </button>
              </div>
              {testeRes && (
                <div style={{ marginTop:6, fontSize:11, padding:'6px 10px', borderRadius:6,
                  background: testeRes.ok ? '#1D9E7515' : '#ef444415',
                  color: testeRes.ok ? '#1D9E75' : '#ef4444',
                  border: `0.5px solid ${testeRes.ok ? '#1D9E7540' : '#ef444440'}`,
                }}>
                  {testeRes.ok ? `✅ Chave válida${testeRes.resposta?' — resposta: '+testeRes.resposta:''}` : `❌ ${testeRes.erro}`}
                  {testeRes.aviso && ` ⚠️ ${testeRes.aviso}`}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Chave Claude (Anthropic)</label>
              <input type="password" style={inputStyle} value={cfg.claudeKey||''}
                onChange={e=>set('claudeKey',e.target.value)} placeholder="sk-ant-..."/>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA: Parâmetros ── */}
      {aba === 'params' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={sectionStyle}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--label)' }}>Parâmetros do modelo</div>
            <div>
              <label style={labelStyle}>Temperatura — atual: <strong style={{color:'var(--accent)'}}>{cfg.temperatura||'0.7'}</strong></label>
              <input type="range" min={0} max={1} step={0.1} value={parseFloat(cfg.temperatura)||0.7}
                onChange={e=>set('temperatura',e.target.value)}
                style={{ width:'100%', accentColor:'var(--accent)', cursor:'pointer' }}/>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--label-4)', marginTop:2 }}>
                <span>0 — mais determinístico</span><span>1 — mais criativo</span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Max tokens de saída</label>
              <input type="number" style={inputStyle} value={cfg.maxTokens||4000}
                onChange={e=>set('maxTokens',parseInt(e.target.value))} min={500} max={8000} step={500}/>
              <div style={{ fontSize:11, color:'var(--label-3)', marginTop:3 }}>Recomendado: 4000. Máximo prático: 8000.</div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--label)' }}>Resumo da configuração ativa</div>
            <pre style={{ background:'var(--bg)', borderRadius:8, padding:'12px', fontSize:11,
              color:'var(--label-2)', overflowX:'auto', margin:0, fontFamily:'monospace', lineHeight:1.7 }}>
{`Provedor:    ${cfg.provedor||'google'}
Modelo:      ${cfg.modelo||'gemini-2.5-flash'}
Temperatura: ${cfg.temperatura||'0.7'}
Max tokens:  ${cfg.maxTokens||4000}
Gemini key:  ${cfg.geminiKey ? '***'+cfg.geminiKey.slice(-4) : '(não configurada)'}
Claude key:  ${cfg.claudeKey ? '***'+cfg.claudeKey.slice(-4) : '(não configurada)'}`}
            </pre>
          </div>
        </div>
      )}

      {/* ── ABA: Bypasses ── */}
      {aba === 'bypasses' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', gap:10, padding:'10px 14px', borderRadius:8,
            background:'#1D9E7510', border:'0.5px solid #1D9E7530' }}>
            <CheckCircle size={14} style={{ color:'#1D9E75', flexShrink:0, marginTop:1 }}/>
            <div style={{ fontSize:12, color:'var(--label-2)', lineHeight:1.5 }}>
              Todos os bypasses estão <strong>sempre ativos</strong> — são hardcoded no ia-core para garantir
              consistência. Esta tela mostra o que está implementado.
              Para desativar algum bypass, é necessário editar o ia-core.js.
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {BYPASS_FEATURES.map(f => <BypassCard key={f.id} f={f}/>)}
          </div>
        </div>
      )}

      {/* ── ABA: Mensagens ── */}
      {aba === 'msgs' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ fontSize:12, color:'var(--label-3)', lineHeight:1.6 }}>
            Textos enviados diretamente pelo sistema (não pela IA) em etapas do fluxo de compra.
            Edite e clique em Salvar para aplicar no servidor.
          </div>
          {/* Agrupa por categoria */}
          {[...new Set(MENSAGENS_PADRAO.map(m=>m.cat))].map(cat => (
            <div key={cat}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em',
                color:'var(--label-4)', marginBottom:8, marginTop:4 }}>{cat}</div>
              {MENSAGENS_PADRAO.filter(m=>m.cat===cat).map(msg => (
            <div key={msg.id} style={{...sectionStyle, marginBottom:8}}>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--label)', marginBottom:2 }}>{msg.titulo}</div>
                <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99,
                  background:'var(--fill)', color:'var(--label-3)', fontWeight:500 }}>{msg.cat}</span>
              </div>
              <textarea rows={3} style={{...inputStyle, resize:'vertical', lineHeight:1.5, fontFamily:'monospace'}}
                value={cfg[msg.campo] || ''}
                placeholder={msg.pad}
                onChange={e=>set(msg.campo,e.target.value)}/>
              {msg.vars && (
                <div style={{ fontSize:10, color:'var(--label-4)', fontFamily:'monospace', marginTop:2 }}>
                  Variáveis: <span style={{ color:'var(--accent)', opacity:.8 }}>{msg.vars}</span>
                </div>
              )}
              <button onClick={()=>set(msg.campo, msg.pad)} style={{
                alignSelf:'flex-start', fontSize:11, padding:'4px 10px', borderRadius:6,
                border:'0.5px solid var(--sep)', background:'transparent',
                color:'var(--label-3)', cursor:'pointer', display:'flex', alignItems:'center', gap:4,
              }}>
                <RotateCcw size={10}/> Restaurar padrão
              </button>
            </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
