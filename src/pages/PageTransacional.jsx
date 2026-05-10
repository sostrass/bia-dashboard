import { useState, useEffect } from 'react'
import { Plus, Save, Trash2, Send, RefreshCw, Edit2, X, ChevronRight } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const VARIAVEIS = ['{nome}','{numero_pedido}','{total}','{rastreio}','{produto}','{link}','{prazo}']

const TIPOS_TEMPLATE = [
  { id: 'pedido_criado',      label: 'Pedido Criado',          emoji: '🛒' },
  { id: 'pagamento_confirmado',label: 'Pagamento Confirmado',  emoji: '✅' },
  { id: 'pagamento_pendente', label: 'Pagamento Pendente',     emoji: '⏳' },
  { id: 'pedido_enviado',     label: 'Pedido Enviado',         emoji: '🚚' },
  { id: 'pedido_entregue',    label: 'Pedido Entregue',        emoji: '📦' },
  { id: 'avise_disponivel',   label: 'Produto Disponível',     emoji: '🔔' },
  { id: 'avaliar_pedido',     label: 'Avaliação Pós-entrega',  emoji: '⭐' },
  { id: 'texto_livre',        label: 'Texto Livre',            emoji: '✏️' },
]

const DEFAULT_TEMPLATES = {
  pedido_criado:       { cabecalho: '🛒 Pedido Confirmado', corpo: 'Olá {nome}! Seu pedido #{numero_pedido} foi criado com sucesso.\n\nTotal: {total}\nLink de pagamento: {link}', rodape: 'Armarinhos & Bijuterias', botoes: ['Ver pedido', 'Falar com atendente'] },
  pagamento_confirmado:{ cabecalho: '✅ Pagamento Aprovado', corpo: 'Ótima notícia, {nome}! Seu pagamento do pedido #{numero_pedido} foi aprovado.\n\nJá estamos preparando seu pedido!', rodape: 'Armarinhos & Bijuterias', botoes: ['Acompanhar pedido'] },
  pagamento_pendente:  { cabecalho: '⏳ Pagamento Pendente', corpo: 'Olá {nome}, seu pedido #{numero_pedido} está aguardando pagamento.\n\nTotal: {total}\n\nConclua pelo link: {link}', rodape: 'Armarinhos & Bijuterias', botoes: ['Pagar agora', 'Preciso de ajuda'] },
  pedido_enviado:      { cabecalho: '🚚 Pedido Enviado!', corpo: 'Seu pedido #{numero_pedido} foi enviado, {nome}!\n\nCódigo de rastreio: {rastreio}\nPrazo estimado: {prazo} dias úteis', rodape: 'Armarinhos & Bijuterias', botoes: ['Rastrear pedido'] },
  pedido_entregue:     { cabecalho: '📦 Pedido Entregue!', corpo: 'Seu pedido #{numero_pedido} foi entregue, {nome}! Esperamos que você goste 😊', rodape: 'Armarinhos & Bijuterias', botoes: ['Avaliar compra', 'Precisei de troca'] },
  avise_disponivel:    { cabecalho: '🔔 Produto Disponível!', corpo: 'Boa notícia, {nome}! O produto *{produto}* que você solicitou voltou ao estoque!\n\nCorre antes de esgotar 👇', rodape: 'Armarinhos & Bijuterias', botoes: ['Comprar agora'] },
  avaliar_pedido:      { cabecalho: '⭐ Como foi sua compra?', corpo: 'Olá {nome}! Seu pedido #{numero_pedido} foi entregue. O que achou?\n\nSua opinião é muito importante para nós!', rodape: 'Armarinhos & Bijuterias', botoes: ['Adorei! ⭐⭐⭐⭐⭐', 'Tive um problema'] },
  texto_livre:         { cabecalho: '', corpo: '', rodape: '', botoes: [] },
}

export default function PageTransacional({ api: apiProp }) {
  const api = apiProp || BASE
  const [tipoSel, setTipoSel] = useState('pedido_criado')
  const [templates, setTemplates] = useState({ ...DEFAULT_TEMPLATES })
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [salvo,    setSalvo]    = useState(false)

  // Teste de envio
  const [telTeste, setTelTeste] = useState('')
  const [enviandoTeste, setEnviandoTeste] = useState(false)
  const [resultTeste, setResultTeste] = useState(null)

  const t = templates[tipoSel] || { cabecalho: '', corpo: '', rodape: '', botoes: [] }

  const atualizar = (campo, valor) => {
    setTemplates(prev => ({ ...prev, [tipoSel]: { ...prev[tipoSel], [campo]: valor } }))
    setEditando(true)
  }

  const atualizarBotao = (i, valor) => {
    const botoes = [...(t.botoes || [])]
    botoes[i] = valor
    atualizar('botoes', botoes)
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      await fetch(`${api}/api/transacional/templates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipoSel, template: t })
      })
      setSalvo(true)
      setEditando(false)
      setTimeout(() => setSalvo(false), 2000)
    } catch {}
    setSalvando(false)
  }

  const testarEnvio = async () => {
    if (!telTeste.trim()) return
    setEnviandoTeste(true)
    setResultTeste(null)
    try {
      let msg = ''
      if (t.cabecalho) msg += `*${t.cabecalho}*\n\n`
      msg += t.corpo || ''
      if (t.rodape) msg += `\n\n_${t.rodape}_`
      if (t.botoes?.length) msg += '\n\n' + t.botoes.map((b, i) => `${i+1}. ${b}`).join('\n')

      // Substitui variáveis por exemplos
      msg = msg.replace(/{nome}/g, 'Teste')
               .replace(/{numero_pedido}/g, '12345')
               .replace(/{total}/g, 'R$ 150,00')
               .replace(/{rastreio}/g, 'BR123456789')
               .replace(/{link}/g, 'https://loja.com/pagamento')
               .replace(/{prazo}/g, '5 a 10')
               .replace(/{produto}/g, 'Pérola 8mm')

      const r = await fetch(`${api}/api/dashboard/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: telTeste.replace(/\D/g, ''), mensagem: msg })
      })
      setResultTeste(r.ok ? 'ok' : 'erro')
    } catch {
      setResultTeste('erro')
    }
    setEnviandoTeste(false)
  }

  const inserirVariavel = (campo, variavel) => {
    atualizar(campo, (t[campo] || '') + variavel)
  }

  const inp = {
    background: 'var(--bg-3)', border: '1px solid var(--sep)', borderRadius: 10,
    color: 'var(--label)', outline: 'none', padding: '9px 12px', fontSize: 13,
    fontFamily: 'inherit', width: '100%',
  }

  return (
    <div className="h-full flex overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Lista de tipos */}
      <div className="w-[220px] flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--sep)' }}>
        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--sep)' }}>
          <div className="text-[16px] font-semibold" style={{ color: 'var(--label)' }}>Transacionais</div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--label-3)' }}>Templates de mensagem</div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {TIPOS_TEMPLATE.map(tipo => (
            <button key={tipo.id} onClick={() => { setTipoSel(tipo.id); setEditando(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-l-2"
              style={{
                background: tipoSel === tipo.id ? 'var(--accent-dim)' : 'transparent',
                borderLeftColor: tipoSel === tipo.id ? 'var(--accent)' : 'transparent',
                color: tipoSel === tipo.id ? 'var(--accent)' : 'var(--label-2)',
              }}>
              <span className="text-[16px]">{tipo.emoji}</span>
              <span className="text-[13px] font-medium leading-tight">{tipo.label}</span>
              {tipoSel === tipo.id && <ChevronRight size={13} className="ml-auto" style={{ color: 'var(--accent)' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-5">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-bold tracking-tight" style={{ color: 'var(--label)' }}>
                {TIPOS_TEMPLATE.find(t => t.id === tipoSel)?.label}
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--label-3)' }}>
                Cabeçalho → Corpo → Rodapé → Botões
              </p>
            </div>
            {editando && (
              <button onClick={salvar} disabled={salvando}
                className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold"
                style={{ background: salvo ? 'var(--accent-dim)' : 'var(--accent)', color: salvo ? 'var(--accent)' : '#000' }}>
                {salvando ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                {salvo ? 'Salvo!' : 'Salvar'}
              </button>
            )}
          </div>

          {/* Variáveis disponíveis */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px]" style={{ color: 'var(--label-3)' }}>Variáveis:</span>
            {VARIAVEIS.map(v => (
              <button key={v} onClick={() => inserirVariavel('corpo', v)}
                className="text-[10px] font-mono px-2 py-0.5 rounded-[6px] transition-all"
                style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(10,132,255,0.2)' }}>
                {v}
              </button>
            ))}
          </div>

          {/* Cabeçalho */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: 'var(--accent)', color: '#000' }}>1</div>
              <span className="text-[14px] font-semibold" style={{ color: 'var(--label)' }}>Cabeçalho</span>
            </div>
            <input value={t.cabecalho || ''} onChange={e => atualizar('cabecalho', e.target.value)}
              placeholder="Título em negrito (opcional)" style={inp} />
          </div>

          {/* Corpo */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: 'var(--blue)', color: '#fff' }}>2</div>
              <span className="text-[14px] font-semibold" style={{ color: 'var(--label)' }}>Corpo</span>
            </div>
            <textarea value={t.corpo || ''} onChange={e => atualizar('corpo', e.target.value)}
              rows={6} placeholder="Conteúdo principal da mensagem..."
              style={{ ...inp, resize: 'none', lineHeight: 1.6 }} />
            <p className="text-[10px]" style={{ color: 'var(--label-3)' }}>
              Use *texto* para negrito e _texto_ para itálico
            </p>
          </div>

          {/* Rodapé */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: 'var(--label-3)', color: '#fff' }}>3</div>
              <span className="text-[14px] font-semibold" style={{ color: 'var(--label)' }}>Rodapé</span>
            </div>
            <input value={t.rodape || ''} onChange={e => atualizar('rodape', e.target.value)}
              placeholder="Texto em itálico menor (opcional)" style={inp} />
          </div>

          {/* Botões */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: 'var(--purple)', color: '#fff' }}>4</div>
              <span className="text-[14px] font-semibold" style={{ color: 'var(--label)' }}>Botões de resposta rápida</span>
            </div>
            <div className="space-y-2">
              {(t.botoes || []).map((b, i) => (
                <div key={i} className="flex gap-2">
                  <input value={b} onChange={e => atualizarBotao(i, e.target.value)}
                    placeholder={`Botão ${i+1}`} style={{ ...inp, flex: 1 }} />
                  <button onClick={() => atualizar('botoes', t.botoes.filter((_, j) => j !== i))}
                    className="px-3 py-2 rounded-[10px]" style={{ background: 'var(--fill)', color: 'var(--red)' }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
              {(t.botoes || []).length < 3 && (
                <button onClick={() => atualizar('botoes', [...(t.botoes||[]), ''])}
                  className="text-[12px] px-3 py-1.5 rounded-[8px] w-full"
                  style={{ background: 'var(--fill)', color: 'var(--label-2)', border: '1px dashed var(--sep)' }}>
                  + Adicionar botão (máx. 3)
                </button>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="card p-5">
            <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--label)' }}>Preview da Mensagem</h3>
            <div className="p-4 rounded-[14px] text-[13px] space-y-1"
              style={{ background: 'var(--bg-3)', border: '1px solid var(--sep)' }}>
              {t.cabecalho && <div className="font-bold" style={{ color: 'var(--label)' }}>{t.cabecalho}</div>}
              {t.cabecalho && <div className="h-1" />}
              <div className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--label)' }}>
                {(t.corpo || '').replace(/{nome}/g,'João').replace(/{numero_pedido}/g,'12345').replace(/{total}/g,'R$ 150,00').replace(/{rastreio}/g,'BR123').replace(/{link}/g,'loja.com/pagamento').replace(/{prazo}/g,'5 a 10').replace(/{produto}/g,'Pérola 8mm')}
              </div>
              {t.rodape && <>
                <div className="h-1" />
                <div className="text-[11px] italic" style={{ color: 'var(--label-3)' }}>{t.rodape}</div>
              </>}
              {(t.botoes||[]).filter(Boolean).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--sep)' }}>
                  {t.botoes.filter(Boolean).map((b, i) => (
                    <span key={i} className="text-[11px] px-3 py-1 rounded-full"
                      style={{ background: 'var(--fill)', color: 'var(--blue)', border: '1px solid var(--sep)' }}>
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Teste de envio */}
          <div className="card p-5 space-y-3">
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--label)' }}>Testar Envio</h3>
            <div className="flex gap-2">
              <input value={telTeste} onChange={e => setTelTeste(e.target.value)}
                placeholder="55119999999999" style={{ ...inp, flex: 1 }} />
              <button onClick={testarEnvio} disabled={enviandoTeste || !telTeste.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold"
                style={{ background: 'var(--blue)', color: '#fff', opacity: !telTeste.trim() ? 0.5 : 1 }}>
                {enviandoTeste ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                Testar
              </button>
            </div>
            {resultTeste && (
              <div className="text-[12px] font-medium" style={{ color: resultTeste === 'ok' ? 'var(--accent)' : 'var(--red)' }}>
                {resultTeste === 'ok' ? '✓ Mensagem enviada com sucesso!' : '✗ Erro ao enviar — verifique o número'}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
