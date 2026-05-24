import { useState, useEffect, useCallback } from 'react'
import {
  AlertCircle, CheckCircle, Clock, RefreshCw, Plus, X,
  Send, User, ChevronDown, MessageSquare, Truck, Package,
  CreditCard, Tag, Filter, Search, ToggleLeft, ToggleRight,
  ArrowRight, Circle, XCircle, Zap, Edit3, Save
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const STATUS = {
  aberta:       { label:'Aberta',       cor:'#f59e0b', bg:'rgba(245,158,11,0.1)',   icon:Circle },
  em_andamento: { label:'Em andamento', cor:'#4a9fff', bg:'rgba(74,159,255,0.1)',   icon:RefreshCw },
  resolvida:    { label:'Resolvida',    cor:'#22c55e', bg:'rgba(34,197,94,0.1)',    icon:CheckCircle },
  encerrada:    { label:'Encerrada',    cor:'#6b7280', bg:'rgba(107,114,128,0.1)', icon:XCircle },
}

const PRIORIDADE = {
  baixa:   { label:'Baixa',   cor:'#6b7280', bg:'rgba(107,114,128,0.08)' },
  normal:  { label:'Normal',  cor:'#4a9fff', bg:'rgba(74,159,255,0.08)' },
  alta:    { label:'Alta',    cor:'#f59e0b', bg:'rgba(245,158,11,0.08)' },
  urgente: { label:'Urgente', cor:'#ef4444', bg:'rgba(239,68,68,0.08)' },
}

const TIPO = {
  entrega:  { label:'Entrega',      icon:Truck,       cor:'#a78bfa' },
  pagamento:{ label:'Pagamento',    icon:CreditCard,  cor:'#4a9fff' },
  produto:  { label:'Produto',      icon:Package,     cor:'#fb923c' },
  outro:    { label:'Outro',        icon:Tag,         cor:'#6b7280' },
}

function BadgeStatus({ status }) {
  const m = STATUS[status] || STATUS.aberta
  const Ic = m.icon
  return (
    <span className=\"flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium\"
      style={{ background:m.bg, color:m.cor }}>
      <Ic size={9}/> {m.label}
    </span>
  )
}

function BadgePrioridade({ prioridade }) {
  const m = PRIORIDADE[prioridade] || PRIORIDADE.normal
  return (
    <span className=\"px-2 py-0.5 rounded-full text-[10px] font-semibold\"
      style={{ background:m.bg, color:m.cor }}>
      {m.label}
    </span>
  )
}

// \\u2500\\u2500 Modal de detalhe/resposta \\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500
function ModalOcorrencia({ oc, api, onClose, onUpdate }) {
  const [status,    setStatus]    = useState(oc.status)
  const [prioridade,setPrioridade]= useState(oc.prioridade)
  const [atrib,     setAtrib]     = useState(oc.atribuidoA||'')
  const [resposta,  setResposta]  = useState('')
  const [nota,      setNota]      = useState('')
  const [salvando,  setSalvando]  = useState(false)
  const [enviando,  setEnviando]  = useState(false)
  const [ok,        setOk]        = useState('')

  const tipoMeta = TIPO[oc.tipo] || TIPO.outro
  const TipoIc   = tipoMeta.icon

  const salvarStatus = async () => {
    setSalvando(true)
    try {
      await fetch(`${api}/api/ocorrencias/${oc.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ status, prioridade, atribuidoA:atrib, nota: nota||undefined })
      })
      setOk('Status salvo!'); setNota('')
      setTimeout(()=>{ setOk(''); onUpdate() }, 1500)
    } catch {}
    setSalvando(false)
  }

  const enviarResposta = async () => {
    if (!resposta.trim()) return
    setEnviando(true)
    try {
      await fetch(`${api}/api/ocorrencias/${oc.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          respostaCliente: resposta,
          status: status === 'aberta' ? 'em_andamento' : status,
          nota: `Resposta enviada ao cliente: \"${resposta.slice(0,60)}...\"`
        })
      })
      setOk('Mensagem enviada!'); setResposta('')
      setTimeout(()=>{ setOk(''); onUpdate() }, 2000)
    } catch {}
    setEnviando(false)
  }

  const inp = { background:'var(--bg)', border:'1px solid var(--sep)', borderRadius:9, color:'var(--label)', outline:'none', padding:'9px 12px', fontSize:13, width:'100%', fontFamily:'inherit' }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'stretch',justifyContent:'flex-end' }}>
      <div className=\"flex flex-col h-full w-full max-w-[560px]\"
        style={{ background:'var(--bg)', borderLeft:'1px solid var(--sep)' }}>

        {/* Header */}
        <div className=\"flex items-center justify-between px-5 py-4 flex-shrink-0\"
          style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
          <div className=\"flex items-center gap-3\">
            <div className=\"w-9 h-9 rounded-[10px] flex items-center justify-center\"
              style={{ background:`${tipoMeta.cor}15` }}>
              <TipoIc size={15} style={{ color:tipoMeta.cor }}/>
            </div>
            <div>
              <h3 className=\"text-[14px] font-bold\" style={{ color:'var(--label)' }}>
                Ocorr\\u00eancia #{oc.id}
              </h3>
              <p className=\"text-[11px]\" style={{ color:'var(--label-3)' }}>
                {oc.nomeCliente || oc.telefone}
                {oc.numeroPedido && ` \\u00b7 Pedido #${oc.numeroPedido}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className=\"p-2 rounded-[8px]\" style={{ color:'var(--label-3)' }}>
            <X size={16}/>
          </button>
        </div>

        <div className=\"flex-1 overflow-y-auto p-5 space-y-4\">

          {/* Descri\\u00e7\\u00e3o */}
          {oc.descricao && (
            <div className=\"rounded-[12px] p-4\"
              style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
              <p className=\"text-[11px] font-semibold mb-1\" style={{ color:'var(--label-3)' }}>RELATO DO CLIENTE</p>
              <p className=\"text-[13px] leading-relaxed\" style={{ color:'var(--label)' }}>{oc.descricao}</p>
            </div>
          )}

          {/* Controles de status */}
          <div className=\"rounded-[12px] overflow-hidden\" style={{ border:'1px solid var(--sep)' }}>
            <div className=\"px-4 py-2.5\" style={{ background:'var(--bg-3)', borderBottom:'1px solid var(--sep)' }}>
              <p className=\"text-[11px] font-semibold\" style={{ color:'var(--label-2)' }}>Gerenciar ocorr\\u00eancia</p>
            </div>
            <div className=\"p-4 space-y-3\" style={{ background:'var(--bg-2)' }}>
              <div className=\"grid grid-cols-2 gap-3\">
                <div>
                  <label className=\"text-[10px] font-medium block mb-1\" style={{ color:'var(--label-3)' }}>Status</label>
                  <select value={status} onChange={e=>setStatus(e.target.value)}
                    className=\"w-full px-2.5 py-2 rounded-[8px] text-[12px] outline-none\"
                    style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }}>
                    {Object.entries(STATUS).map(([id,m])=>(
                      <option key={id} value={id}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className=\"text-[10px] font-medium block mb-1\" style={{ color:'var(--label-3)' }}>Prioridade</label>
                  <select value={prioridade} onChange={e=>setPrioridade(e.target.value)}
                    className=\"w-full px-2.5 py-2 rounded-[8px] text-[12px] outline-none\"
                    style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }}>
                    {Object.entries(PRIORIDADE).map(([id,m])=>(
                      <option key={id} value={id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className=\"text-[10px] font-medium block mb-1\" style={{ color:'var(--label-3)' }}>Atribu\\u00eddo a</label>
                <input value={atrib} onChange={e=>setAtrib(e.target.value)}
                  placeholder=\"Nome do atendente respons\\u00e1vel\" style={{ ...inp, fontSize:12 }}/>
              </div>
              <div>
                <label className=\"text-[10px] font-medium block mb-1\" style={{ color:'var(--label-3)' }}>Nota interna (n\\u00e3o vai ao cliente)</label>
                <input value={nota} onChange={e=>setNota(e.target.value)}
                  placeholder=\"Ex: Verificado com transportadora, aguardando retorno...\" style={{ ...inp, fontSize:12 }}/>
              </div>
              <button onClick={salvarStatus} disabled={salvando}
                className=\"w-full py-2 rounded-[9px] text-[12px] font-semibold flex items-center justify-center gap-2 transition-all\"
                style={{ background:'var(--accent)', color:'#000' }}>
                {salvando?<RefreshCw size={12} className=\"animate-spin\"/>:<Save size={12}/>}
                {ok || 'Salvar altera\\u00e7\\u00f5es'}
              </button>
            </div>
          </div>

          {/* Resposta ao cliente */}
          <div className=\"rounded-[12px] overflow-hidden\" style={{ border:'1px solid var(--sep)' }}>
            <div className=\"px-4 py-2.5 flex items-center gap-2\"
              style={{ background:'var(--bg-3)', borderBottom:'1px solid var(--sep)' }}>
              <MessageSquare size={12} style={{ color:'#25D366' }}/>
              <p className=\"text-[11px] font-semibold\" style={{ color:'var(--label-2)' }}>Responder ao cliente via WhatsApp</p>
            </div>
            <div className=\"p-4 space-y-2\" style={{ background:'var(--bg-2)' }}>
              <textarea value={resposta} onChange={e=>setResposta(e.target.value)}
                rows={4} placeholder={`Ol\\u00e1 ${oc.nomeCliente?.split(' ')[0]||''},\\
\\
Verificamos sua ocorr\\u00eancia e...`}
                style={{ ...inp, resize:'none', lineHeight:1.6 }}/>
              <button onClick={enviarResposta} disabled={enviando||!resposta.trim()}
                className=\"w-full py-2 rounded-[9px] text-[12px] font-semibold flex items-center justify-center gap-2 transition-all\"
                style={{ background:'#25D366', color:'#fff', opacity:!resposta.trim()?0.5:1 }}>
                {enviando?<RefreshCw size={12} className=\"animate-spin\"/>:<Send size={12}/>}
                {ok==='Mensagem enviada!'?'\\u2713 Enviado!':'Enviar pelo WhatsApp'}
              </button>
            </div>
          </div>

          {/* Hist\\u00f3rico */}
          {oc.historico?.length > 0 && (
            <div className=\"rounded-[12px] overflow-hidden\" style={{ border:'1px solid var(--sep)' }}>
              <div className=\"px-4 py-2.5\" style={{ background:'var(--bg-3)', borderBottom:'1px solid var(--sep)' }}>
                <p className=\"text-[11px] font-semibold\" style={{ color:'var(--label-2)' }}>Hist\\u00f3rico</p>
              </div>
              <div className=\"p-3 space-y-2\" style={{ background:'var(--bg-2)' }}>
                {[...oc.historico].reverse().map((h,i)=>(
                  <div key={i} className=\"flex gap-2.5\">
                    <div className=\"w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0\" style={{ background:'var(--accent)' }}/>
                    <div>
                      <p className=\"text-[11px]\" style={{ color:'var(--label)' }}>{h.nota}</p>
                      <p className=\"text-[9px]\" style={{ color:'var(--label-4)' }}>
                        {h.por} \\u00b7 {new Date(h.em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// \\u2500\\u2500 Modal novo \\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500
function ModalNovo({ api, onClose, onSave }) {
  const [form, setForm] = useState({ telefone:'', nomeCliente:'', numeroPedido:'', tipo:'entrega', descricao:'', prioridade:'normal' })
  const [salvando, setSalvando] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const inp = { background:'var(--bg)', border:'1px solid var(--sep)', borderRadius:9, color:'var(--label)', outline:'none', padding:'9px 12px', fontSize:13, width:'100%', fontFamily:'inherit' }

  const salvar = async () => {
    if (!form.telefone.trim()) return
    setSalvando(true)
    try {
      await fetch(`${api}/api/ocorrencias`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form)
      })
      onSave()
    } catch {}
    setSalvando(false)
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div className=\"w-full max-w-[440px] rounded-[18px] overflow-hidden\"
        style={{ background:'var(--bg-2)', border:'1px solid var(--sep)' }}>
        <div className=\"flex items-center justify-between px-5 py-4\"
          style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-3)' }}>
          <h3 className=\"text-[14px] font-bold\" style={{ color:'var(--label)' }}>Nova Ocorr\\u00eancia</h3>
          <button onClick={onClose} style={{ color:'var(--label-3)' }}><X size={16}/></button>
        </div>
        <div className=\"p-5 space-y-3\">
          <div className=\"grid grid-cols-2 gap-3\">
            <div>
              <label className=\"text-[10px] font-medium block mb-1\" style={{ color:'var(--label-3)' }}>Telefone *</label>
              <input value={form.telefone} onChange={e=>set('telefone',e.target.value)}
                placeholder=\"5511999999999\" style={{ ...inp, fontSize:12 }}/>
            </div>
            <div>
              <label className=\"text-[10px] font-medium block mb-1\" style={{ color:'var(--label-3)' }}>Pedido #</label>
              <input value={form.numeroPedido} onChange={e=>set('numeroPedido',e.target.value)}
                placeholder=\"224928\" style={{ ...inp, fontSize:12 }}/>
            </div>
          </div>
          <div>
            <label className=\"text-[10px] font-medium block mb-1\" style={{ color:'var(--label-3)' }}>Nome do cliente</label>
            <input value={form.nomeCliente} onChange={e=>set('nomeCliente',e.target.value)}
              placeholder=\"Nome completo\" style={{ ...inp, fontSize:12 }}/>
          </div>
          <div className=\"grid grid-cols-2 gap-3\">
            <div>
              <label className=\"text-[10px] font-medium block mb-1\" style={{ color:'var(--label-3)' }}>Tipo</label>
              <select value={form.tipo} onChange={e=>set('tipo',e.target.value)}
                className=\"w-full px-2.5 py-2 rounded-[8px] text-[12px] outline-none\"
                style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }}>
                {Object.entries(TIPO).map(([id,m])=><option key={id} value={id}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className=\"text-[10px] font-medium block mb-1\" style={{ color:'var(--label-3)' }}>Prioridade</label>
              <select value={form.prioridade} onChange={e=>set('prioridade',e.target.value)}
                className=\"w-full px-2.5 py-2 rounded-[8px] text-[12px] outline-none\"
                style={{ background:'var(--bg)', border:'1px solid var(--sep)', color:'var(--label)' }}>
                {Object.entries(PRIORIDADE).map(([id,m])=><option key={id} value={id}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className=\"text-[10px] font-medium block mb-1\" style={{ color:'var(--label-3)' }}>Descri\\u00e7\\u00e3o do problema</label>
            <textarea value={form.descricao} onChange={e=>set('descricao',e.target.value)}
              rows={3} placeholder=\"Descreva o problema relatado pelo cliente...\"
              style={{ ...inp, resize:'none', lineHeight:1.6 }}/>
          </div>
          <div className=\"flex gap-3 pt-1\">
            <button onClick={onClose} className=\"flex-1 py-2.5 rounded-[10px] text-[13px]\"
              style={{ background:'var(--fill)', color:'var(--label-2)' }}>Cancelar</button>
            <button onClick={salvar} disabled={salvando||!form.telefone.trim()}
              className=\"flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold\"
              style={{ background:'var(--accent)', color:'#000', opacity:!form.telefone.trim()?0.5:1 }}>
              {salvando?'Criando...' :'Criar ocorr\\u00eancia'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// \\u2500\\u2500 P\\u00e1gina principal \\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500
export default function PageOcorrencias({ api: apiProp }) {
  const api = apiProp || BASE
  const [ocorrencias, setOcorrencias] = useState([])
  const [stats,       setStats]       = useState({})
  const [loading,     setLoading]     = useState(true)
  const [detalhe,     setDetalhe]     = useState(null)
  const [novo,        setNovo]        = useState(false)
  const [filtroStatus,setFiltroStatus]= useState('todos')
  const [filtroTipo,  setFiltroTipo]  = useState('todos')
  const [filtroPri,   setFiltroPri]   = useState('todos')
  const [busca,       setBusca]       = useState('')

  const carregar = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filtroStatus !== 'todos') params.set('status', filtroStatus)
      if (filtroTipo   !== 'todos') params.set('tipo',   filtroTipo)
      if (filtroPri    !== 'todos') params.set('prioridade', filtroPri)
      const r = await fetch(`${api}/api/ocorrencias?${params}`)
      if (r.ok) {
        const d = await r.json()
        setOcorrencias(d.ocorrencias || [])
        setStats(d.stats || {})
      }
    } catch {}
    setLoading(false)
  }, [api, filtroStatus, filtroTipo, filtroPri])

  useEffect(() => { setLoading(true); carregar() }, [carregar])

  const filtradas = ocorrencias.filter(o => {
    if (!busca) return true
    const b = busca.toLowerCase()
    return (o.nomeCliente||'').toLowerCase().includes(b) ||
           (o.numeroPedido||'').includes(b) ||
           (o.telefone||'').includes(b) ||
           (o.descricao||'').toLowerCase().includes(b)
  })

  const urgentes = parseInt(stats.urgentes)||0

  return (
    <div className=\"h-full flex flex-col overflow-hidden\" style={{ background:'var(--bg)' }}>

      {/* Header */}
      <div className=\"px-6 py-4 flex-shrink-0\" style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-2)' }}>
        <div className=\"flex items-center justify-between mb-3\">
          <div className=\"flex items-center gap-3\">
            <div>
              <h2 className=\"text-[20px] font-bold\" style={{ color:'var(--label)' }}>Ocorr\\u00eancias</h2>
              <div className=\"flex items-center gap-3 mt-0.5\">
                <span className=\"text-[12px]\" style={{ color:'var(--label-3)' }}>
                  {parseInt(stats.abertas)||0} abertas \\u00b7 {parseInt(stats.em_andamento)||0} em andamento
                </span>
                {urgentes > 0 && (
                  <span className=\"flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold animate-pulse\"
                    style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444' }}>
                    <Zap size={9}/> {urgentes} urgente{urgentes>1?'s':''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className=\"flex items-center gap-2\">
            <button onClick={()=>{ setLoading(true); carregar() }}
              className=\"p-2 rounded-[9px]\" style={{ background:'var(--fill)', color:'var(--label-3)' }}>
              <RefreshCw size={14} className={loading?'animate-spin':''}/>
            </button>
            <button onClick={()=>setNovo(true)}
              className=\"flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold\"
              style={{ background:'var(--accent)', color:'#000' }}>
              <Plus size={14}/> Nova ocorr\\u00eancia
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className=\"flex gap-2\">
          <div className=\"relative flex-1\">
            <Search size={12} className=\"absolute left-3 top-1/2 -translate-y-1/2\" style={{ color:'var(--label-4)' }}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)}
              placeholder=\"Buscar por nome, pedido, telefone...\"
              className=\"w-full pl-8 pr-3 py-2 rounded-[9px] text-[12px] outline-none\"
              style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}/>
          </div>
          {[
            { val:filtroStatus, set:setFiltroStatus, opts:[['todos','Todos status'],...Object.entries(STATUS).map(([id,m])=>[id,m.label])] },
            { val:filtroPri,    set:setFiltroPri,    opts:[['todos','Todas prioridades'],...Object.entries(PRIORIDADE).map(([id,m])=>[id,m.label])] },
            { val:filtroTipo,   set:setFiltroTipo,   opts:[['todos','Todos tipos'],...Object.entries(TIPO).map(([id,m])=>[id,m.label])] },
          ].map((f,i)=>(
            <select key={i} value={f.val} onChange={e=>f.set(e.target.value)}
              className=\"px-2.5 py-2 rounded-[9px] text-[11px] outline-none\"
              style={{ background:'var(--bg-3)', border:'1px solid var(--sep)', color:'var(--label)' }}>
              {f.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className=\"flex-1 overflow-y-auto p-4\">
        {loading && (
          <div className=\"flex justify-center py-12\" style={{ color:'var(--label-3)' }}>
            <RefreshCw size={16} className=\"animate-spin\"/>
          </div>
        )}

        {!loading && filtradas.length === 0 && (
          <div className=\"flex flex-col items-center py-20\">
            <CheckCircle size={36} className=\"mb-3 opacity-10\" style={{ color:'#22c55e' }}/>
            <p className=\"text-[15px] font-medium\" style={{ color:'var(--label-2)' }}>
              {ocorrencias.length === 0 ? 'Nenhuma ocorr\\u00eancia registrada' : 'Nenhum resultado'}
            </p>
            <p className=\"text-[13px] mt-1\" style={{ color:'var(--label-3)' }}>
              {ocorrencias.length === 0 ? '\\u00d3timo sinal! \\ud83c\\udf89' : 'Tente outro filtro'}
            </p>
          </div>
        )}

        <div className=\"space-y-2 max-w-[900px]\">
          {filtradas.map(oc => {
            const smeta  = STATUS[oc.status]   || STATUS.aberta
            const pmeta  = PRIORIDADE[oc.prioridade] || PRIORIDADE.normal
            const tmeta  = TIPO[oc.tipo]       || TIPO.outro
            const TipoIc = tmeta.icon
            const data   = new Date(oc.criadoEm)
            const agora  = new Date()
            const horas  = Math.floor((agora-data)/3600000)
            const tempoLabel = horas < 1 ? 'Agora' : horas < 24 ? `${horas}h atr\\u00e1s` : `${Math.floor(horas/24)}d atr\\u00e1s`
            const urgente = oc.prioridade === 'urgente' && !['resolvida','encerrada'].includes(oc.status)

            return (
              <button key={oc.id} onClick={()=>setDetalhe(oc)}
                className=\"w-full text-left rounded-[14px] p-4 transition-all flex items-center gap-4\"
                style={{
                  background:'var(--bg-2)', border:`1px solid ${urgente?'rgba(239,68,68,0.3)':'var(--sep)'}`,
                  borderLeft:`3px solid ${smeta.cor}`,
                }}>

                {/* \\u00cdcone tipo */}
                <div className=\"w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0\"
                  style={{ background:`${tmeta.cor}12` }}>
                  <TipoIc size={15} style={{ color:tmeta.cor }}/>
                </div>

                {/* Info principal */}
                <div className=\"flex-1 min-w-0\">
                  <div className=\"flex items-center gap-2 mb-0.5\">
                    <span className=\"text-[13px] font-semibold\" style={{ color:'var(--label)' }}>
                      {oc.nomeCliente || oc.telefone}
                    </span>
                    {oc.numeroPedido && (
                      <span className=\"text-[10px]\" style={{ color:'var(--label-3)' }}>\\u00b7 #{oc.numeroPedido}</span>
                    )}
                    {urgente && (
                      <span className=\"text-[9px] px-1.5 py-0.5 rounded-full animate-pulse\"
                        style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444' }}>urgente</span>
                    )}
                  </div>
                  <p className=\"text-[11px] truncate\" style={{ color:'var(--label-3)' }}>
                    {oc.descricao || 'Sem descri\\u00e7\\u00e3o'}
                  </p>
                  {oc.atribuidoA && (
                    <p className=\"text-[10px] mt-0.5 flex items-center gap-1\" style={{ color:'var(--label-4)' }}>
                      <User size={9}/> {oc.atribuidoA}
                    </p>
                  )}
                </div>

                {/* Badges + tempo */}
                <div className=\"flex flex-col items-end gap-1.5 flex-shrink-0\">
                  <BadgeStatus status={oc.status}/>
                  <BadgePrioridade prioridade={oc.prioridade}/>
                  <span className=\"text-[9px]\" style={{ color:'var(--label-4)' }}>{tempoLabel}</span>
                </div>

                <ArrowRight size={14} style={{ color:'var(--label-4)', flexShrink:0 }}/>
              </button>
            )
          })}
        </div>
      </div>

      {/* Modais */}
      {detalhe && (
        <ModalOcorrencia oc={detalhe} api={api}
          onClose={()=>setDetalhe(null)}
          onUpdate={()=>{ carregar(); setDetalhe(null) }}/>
      )}
      {novo && (
        <ModalNovo api={api}
          onClose={()=>setNovo(false)}
          onSave={()=>{ setNovo(false); carregar() }}/>
      )}
    </div>
  )
}