import { useState, useRef, useEffect, useCallback, useMemo } from 'react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Status de atendimento ─────────────────────────────────────────────────────
const STATUS = [
  { id:'pendente',     label:'Pendente',     cor:'#f59e0b', bg:'rgba(245,158,11,0.1)'  },
  { id:'em_andamento', label:'Em andamento', cor:'#4a9fff', bg:'rgba(74,159,255,0.1)'  },
  { id:'resolvido',    label:'Resolvido',    cor:'#00d4aa', bg:'rgba(0,212,170,0.1)'   },
  { id:'encerrado',    label:'Encerrado',    cor:'#94a3b8', bg:'rgba(148,163,184,0.1)' },
  { id:'gatilhos',     label:'Gatilhos',     cor:'#a78bfa', bg:'rgba(167,139,250,0.1)' },
]

const REACOES = ['👍','❤️','😂','😮','😢','🙏']

// ── Tema via CSS vars ─────────────────────────────────────────────────────────
const V = {
  bg:     'var(--bg, #ffffff)',
  bg2:    'var(--bg-2, #f8f9fa)',
  bg3:    'var(--bg-3, #f0f2f5)',
  label:  'var(--label, #111827)',
  label2: 'var(--label-2, #374151)',
  label3: 'var(--label-3, #6b7280)',
  label4: 'var(--label-4, #9ca3af)',
  sep:    'var(--sep, #e5e7eb)',
  fill:   'var(--fill, #f3f4f6)',
  accent: 'var(--accent, #059669)',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtR    = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmtTel  = t => { const n=(t||'').replace(/\D/g,'').replace(/^55/,''); return n.length===11?`(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`:t }
const iniciais = n => (n||'?').split(' ').slice(0,2).map(p=>p[0]||'').join('').toUpperCase()||'?'
const CORES   = ['#059669','#3b82f6','#8b5cf6','#f59e0b','#06b6d4','#ec4899','#10b981']
const corAvatar = tel => { let h=0; for(const c of (tel||'')) h=(h*31+c.charCodeAt(0))%CORES.length; return CORES[h] }

// ── Ícones SVG (funções componente — funciona em qualquer contexto React) ───────
const IcoSend     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
const IcoSmile    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
const IcoImage    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const IcoVideo    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
const IcoMic      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
const IcoBulb     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.3A7 7 0 0 1 5 9a7 7 0 0 1 7-7z"/><line x1="9" y1="21" x2="15" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
const IcoPkg      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
const IcoSearch   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IcoRefresh  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-.96-7.3"/></svg>
const IcoChevL    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
const IcoChevR    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
const IcoUser     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoBot      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V3"/><circle cx="12" cy="3" r="1"/><path d="M8 15h.01"/><path d="M16 15h.01"/><path d="M9 19h6"/></svg>
const IcoZap      = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const IcoTag      = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
const IcoTruck    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
const IcoX        = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoLock     = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const IcoClip     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
const IcoExtL     = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
const IcoCart     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ nome, telefone, size = 36 }) {
  const cor = corAvatar(telefone || nome || '')
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0, background:`${cor}18`, color:cor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:Math.round(size*0.33), fontWeight:700, border:`1.5px solid ${cor}30` }}>
      {iniciais(nome || telefone || '?')}
    </div>
  )
}

// ── Bolha de mensagem ─────────────────────────────────────────────────────────
function Bolha({ msg, mostrarGatilhos }) {
  const [hover,  setHover]  = useState(false)
  const [reacao, setReacao] = useState(null)
  const [picker, setPicker] = useState(false)

  const entrada   = msg.direcao === 'entrada'
  const isGatilho = msg.modo === 'transacional'
  const isManual  = msg.modo === 'manual'
  const texto     = (msg.conteudo || '').replace(/\[ENVIAR_IMAGEM:[^\]]*\]/g, '').trim()

  // Se gatilho e o filtro não mostra gatilhos, oculta
  if (isGatilho && !mostrarGatilhos) return null

  const bgMsg   = entrada ? V.bg3 : isGatilho ? '#f5f0ff' : isManual ? '#eff6ff' : '#ecfdf5'
  const bordMsg = entrada ? V.sep : isGatilho ? '#c4b5fd' : isManual ? '#93c5fd' : '#6ee7b7'
  const corLabel = isGatilho ? '#7c3aed' : isManual ? '#2563eb' : '#059669'
  const labelRem = entrada ? null : isGatilho ? 'Gatilho' : isManual ? 'Atendente' : 'Bia'

  return (
    <div
      style={{ display:'flex', flexDirection:'column', alignItems:entrada?'flex-start':'flex-end', marginBottom:6, position:'relative' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPicker(false) }}
    >
      {labelRem && (
        <span style={{ fontSize:9, fontWeight:700, color:corLabel, marginBottom:2, marginRight:4, display:'flex', alignItems:'center', gap:3 }}>
          {isGatilho && <span style={{ color:corLabel }}><IcoZap /></span>}
          {labelRem}
        </span>
      )}
      <div style={{ display:'flex', alignItems:'flex-end', gap:6, flexDirection:entrada?'row':'row-reverse' }}>
        {entrada
          ? <Avatar nome={null} telefone={msg.telefone || ''} size={22} />
          : <div style={{ width:22, height:22, borderRadius:'50%', background:`${corLabel}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {isGatilho ? <span style={{ color:corLabel }}><IcoZap /></span> : isManual ? <span style={{ color:corLabel }}><IcoUser /></span> : <span style={{ color:corLabel }}><IcoBot /></span>}
            </div>
        }

        <div style={{ maxWidth:'70%', background:bgMsg, border:`1px solid ${bordMsg}`, borderRadius:entrada?'2px 12px 12px 12px':'12px 2px 12px 12px', padding:'8px 12px', position:'relative' }}>
          {texto && (
            <div style={{ fontSize:13, color:V.label, lineHeight:1.55, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
              {texto}
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:4, marginTop:3 }}>
            <span style={{ fontSize:9, color:V.label4 }}>
              {new Date(msg.criado_em).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
            </span>
          </div>
          {reacao && (
            <div onClick={() => setReacao(null)} style={{ position:'absolute', bottom:-10, right:6, background:V.bg, border:`1px solid ${V.sep}`, borderRadius:10, padding:'1px 5px', fontSize:12, cursor:'pointer' }}>
              {reacao}
            </div>
          )}
        </div>

        {hover && (
          <div style={{ position:'relative' }}>
            <button onClick={() => setPicker(v => !v)} style={{ width:22, height:22, borderRadius:'50%', border:`1px solid ${V.sep}`, background:V.bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:V.label4 }}>
              😊
            </button>
            {picker && (
              <div style={{ position:'absolute', bottom:28, [entrada?'left':'right']:0, display:'flex', gap:3, background:V.bg, border:`1px solid ${V.sep}`, borderRadius:16, padding:'5px 8px', boxShadow:'0 4px 12px rgba(0,0,0,0.12)', zIndex:50, whiteSpace:'nowrap' }}>
                {REACOES.map(r => (
                  <button key={r} onClick={() => { setReacao(r); setPicker(false) }} style={{ fontSize:16, background:'transparent', border:'none', cursor:'pointer', padding:2 }}>
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Separador de data ─────────────────────────────────────────────────────────
function DateSep({ data }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, margin:'14px 0' }}>
      <div style={{ flex:1, height:1, background:V.sep }} />
      <span style={{ fontSize:10, color:V.label4, fontWeight:600, background:V.bg2, padding:'2px 10px', borderRadius:10, border:`1px solid ${V.sep}` }}>
        {new Date(data).toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'short' })}
      </span>
      <div style={{ flex:1, height:1, background:V.sep }} />
    </div>
  )
}

// ── Sidebar colapsável com filtros ────────────────────────────────────────────
function Sidebar({ statusSel, setStatusSel, contadores, expandida, setExpandida }) {
  return (
    <div style={{ width:expandida?196:52, flexShrink:0, transition:'width 0.2s', borderRight:`1px solid ${V.sep}`, background:V.bg2, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <button onClick={() => setExpandida(v => !v)} style={{ padding:'11px 0', display:'flex', alignItems:'center', justifyContent:expandida?'flex-end':'center', paddingRight:expandida?12:0, border:'none', background:'transparent', cursor:'pointer', borderBottom:`1px solid ${V.sep}`, flexShrink:0, color:V.label4 }}>
        {expandida ? <IcoChevL /> : <IcoChevR />}
      </button>
      <div style={{ flex:1, padding:'6px 0', overflowY:'auto' }}>
        {STATUS.map((s, i) => {
          const ativo = statusSel === s.id
          const cnt   = contadores[s.id] || 0
          return (
            <div key={s.id}>
              {i === 4 && <div style={{ height:1, background:V.sep, margin:'4px 8px' }} />}
              <button title={s.label} onClick={() => setStatusSel(s.id)} style={{ width:'100%', padding:expandida?'9px 14px':'9px 0', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:expandida?10:0, justifyContent:expandida?'flex-start':'center', background:ativo?s.bg:'transparent', borderLeft:ativo?`3px solid ${s.cor}`:'3px solid transparent', transition:'all 0.12s' }}>
                <span style={{ width:10, height:10, borderRadius:'50%', background:ativo?s.cor:V.label4, flexShrink:0, display:'inline-block' }} />
                {expandida && (
                  <>
                    <span style={{ fontSize:12.5, fontWeight:ativo?600:400, color:ativo?s.cor:V.label2, flex:1, textAlign:'left', whiteSpace:'nowrap' }}>{s.label}</span>
                    {cnt > 0 && <span style={{ fontSize:10, fontWeight:700, minWidth:18, textAlign:'center', padding:'1px 5px', borderRadius:9, background:ativo?`${s.cor}22`:V.fill, color:ativo?s.cor:V.label4 }}>{cnt > 99 ? '99+' : cnt}</span>}
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
      {!expandida && (
        <div style={{ writingMode:'vertical-lr', transform:'rotate(180deg)', fontSize:9, color:V.label4, textAlign:'center', padding:'8px 0', letterSpacing:'0.05em' }}>
          {STATUS.find(s => s.id === statusSel)?.label}
        </div>
      )}
    </div>
  )
}

// ── Painel Lateral Direito: Perfil / Pedidos / Catálogo ───────────────────────
function PainelInfo({ conv, api }) {
  const [aba,      setAba]      = useState('perfil')
  const [perfil,   setPerfil]   = useState(null)
  const [pedidos,  setPedidos]  = useState([])
  const [loadPed,  setLoadPed]  = useState(false)
  const [produtos, setProdutos] = useState([])
  const [busca,    setBusca]    = useState('')
  const [loadP,    setLoadP]    = useState(false)
  const [enviando, setEnviando] = useState(null)

  useEffect(() => {
    if (!conv?.telefone) return
    let mounted = true

    // Carrega perfil
    fetch(`${api}/api/contatos/${conv.telefone}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (mounted && d) setPerfil(d) })
      .catch(() => {})

    // Carrega pedidos
    setLoadPed(true)
    fetch(`${api}/api/contatos/${conv.telefone}/pedidos`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (mounted) {
          // Aceita { pedidos: [...] } ou array direto
          const lista = Array.isArray(d) ? d : d?.pedidos || []
          setPedidos(lista)
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadPed(false) })

    return () => { mounted = false }
  }, [conv?.telefone, api])

  const buscarProdutos = async () => {
    if (!busca.trim()) return
    setLoadP(true); setProdutos([])
    try {
      const r = await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(busca)}`)
      if (r.ok) { const d = await r.json(); setProdutos(d.produtos || []) }
    } catch {}
    setLoadP(false)
  }

  // Envia produto para o cliente via WhatsApp
  const enviarProduto = async (prod) => {
    setEnviando(prod.id || prod.nome)
    const precoNum = parseFloat(prod.preco || prod.precoVenda || 0)
    const pix = (precoNum * 0.9).toFixed(2).replace('.', ',')
    const msg = `*${prod.nome || prod.descricao}*\n💳 Cartão: ${fmtR(precoNum)} | 💰 PIX: R$ ${pix}\n${prod.disponivel !== false ? '✅ Disponível em estoque' : '⚠️ Indisponível'}`
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: conv.telefone, mensagem: msg })
      })
    } catch {}
    setEnviando(null)
  }

  // Envia resumo do pedido para o cliente
  const enviarPedido = async (p) => {
    setEnviando('ped_' + (p.numero || p.id))
    const rastreio = p.rastreio && p.rastreio !== '—' ? `\n📦 Rastreio: ${p.rastreio}` : ''
    const msg = `📋 *Pedido #${p.numero || p.id}*\nData: ${p.data || '—'}\nStatus: ${p.situacao || p.status || '—'}\nValor: ${p.total || '—'}${rastreio}`
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: conv.telefone, mensagem: msg })
      })
    } catch {}
    setEnviando(null)
  }

  const ABAS = [
    { id:'perfil',   label:'Perfil'   },
    { id:'pedidos',  label:'Pedidos'  },
    { id:'catalogo', label:'Catálogo' },
  ]

  const mapSit = s => {
    if (!s) return '—'
    const id = typeof s === 'object' ? s?.id || s?.valor : s
    return { 6:'Aberto', 9:'Atendido', 12:'Cancelado', 14:'Faturado', 15:'Verificado' }[id] || String(id || s)
  }

  return (
    <div style={{ width:262, flexShrink:0, borderLeft:`1px solid ${V.sep}`, display:'flex', flexDirection:'column', background:V.bg2, overflow:'hidden' }}>
      {/* Mini header */}
      <div style={{ padding:'10px 12px', borderBottom:`1px solid ${V.sep}`, display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
        <Avatar nome={conv.nome} telefone={conv.telefone} size={30} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:600, color:V.label, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{conv.nome || fmtTel(conv.telefone)}</div>
          <div style={{ fontSize:10, color:V.label4 }}>{fmtTel(conv.telefone)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${V.sep}`, flexShrink:0 }}>
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{ flex:1, padding:'7px 0', border:'none', cursor:'pointer', background:aba===a.id?V.bg:'transparent', borderBottom:aba===a.id?`2px solid ${V.accent}`:'2px solid transparent', fontSize:11, fontWeight:aba===a.id?600:400, color:aba===a.id?V.accent:V.label4, transition:'all 0.15s' }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={{ flex:1, overflowY:'auto', padding:'10px 12px' }}>

        {/* ABA: Perfil */}
        {aba === 'perfil' && (
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {perfil ? [
              { label:'Nome',        value: perfil.nome },
              { label:'Telefone',    value: fmtTel(perfil.telefone || conv.telefone) },
              { label:'E-mail',      value: perfil.email },
              { label:'Cidade',      value: perfil.cidade },
              { label:'Documento',   value: perfil.cpf_cnpj || perfil.cpf || perfil.cnpj },
              { label:'Total gasto', value: perfil.total_gasto ? fmtR(perfil.total_gasto) : null },
            ].filter(i => i.value).map((item, i) => (
              <div key={i}>
                <div style={{ fontSize:9, color:V.label4, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>{item.label}</div>
                <div style={{ fontSize:12, fontWeight:500, color:V.label }}>{item.value}</div>
              </div>
            )) : (
              <div style={{ fontSize:11, color:V.label4, textAlign:'center', padding:16 }}>Sem cadastro vinculado</div>
            )}
          </div>
        )}

        {/* ABA: Pedidos */}
        {aba === 'pedidos' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {loadPed ? (
              <div style={{ textAlign:'center', padding:16, fontSize:11, color:V.label4 }}>Carregando...</div>
            ) : pedidos.length === 0 ? (
              <div style={{ textAlign:'center', padding:16 }}>
                <div style={{ fontSize:22, marginBottom:6 }}>📋</div>
                <div style={{ fontSize:11, color:V.label4 }}>Nenhum pedido encontrado</div>
                <div style={{ fontSize:10, color:V.label4, marginTop:4 }}>CPF/CNPJ pode não estar vinculado</div>
              </div>
            ) : (
              pedidos.map((p, i) => {
                const sit    = mapSit(p.situacao || p.status)
                const sitCor = { Atendido:'#00d4aa', Verificado:'#00d4aa', Aberto:'#f59e0b', Cancelado:'#ef4444', Faturado:'#4a9fff' }[sit] || V.label3
                const pedId  = 'ped_' + (p.numero || p.id)
                return (
                  <div key={i} style={{ background:V.bg, borderRadius:10, padding:'10px 12px', border:`1px solid ${V.sep}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:V.label }}>#{p.numero || p.id}</span>
                      <span style={{ fontSize:9, color:V.label4 }}>{p.data}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, background:`${sitCor}18`, color:sitCor, fontWeight:600 }}>{sit}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:V.accent }}>{p.total}</span>
                    </div>
                    {p.rastreio && p.rastreio !== '—' && (
                      <div style={{ fontSize:10, color:'#4a9fff', marginBottom:6, display:'flex', alignItems:'center', gap:3 }}>
                        <IcoTruck /> {p.rastreio}
                      </div>
                    )}
                    {/* Botão enviar pedido ao cliente */}
                    <button onClick={() => enviarPedido(p)} disabled={enviando === pedId} style={{ width:'100%', padding:'5px 0', borderRadius:7, border:`1px solid ${V.accent}`, background: enviando === pedId ? V.fill : 'transparent', color:V.accent, cursor:'pointer', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'all 0.15s' }}>
                      <IcoSend /> {enviando === pedId ? 'Enviando...' : 'Enviar ao cliente'}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ABA: Catálogo */}
        {aba === 'catalogo' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', gap:5 }}>
              <input value={busca} onChange={e => setBusca(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscarProdutos()} placeholder="Buscar produto..." style={{ flex:1, padding:'6px 9px', borderRadius:8, border:`1px solid ${V.sep}`, background:V.bg, outline:'none', fontSize:11.5, color:V.label }} />
              <button onClick={buscarProdutos} style={{ padding:'6px 10px', borderRadius:8, border:'none', background:V.accent, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>{loadP ? '…' : '↵'}</button>
            </div>
            {produtos.length === 0
              ? <div style={{ fontSize:10, color:V.label4, textAlign:'center', padding:'16px 0' }}>Digite e pressione Enter para buscar</div>
              : produtos.map((p, i) => (
                <div key={i} style={{ background:V.bg, borderRadius:8, padding:'9px 11px', border:`1px solid ${V.sep}` }}>
                  <div style={{ fontSize:11.5, fontWeight:600, color:V.label, marginBottom:4, lineHeight:1.3 }}>{p.nome || p.descricao}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:V.accent }}>{fmtR(p.preco || p.precoVenda || 0)}</span>
                    <span style={{ fontSize:9, padding:'2px 6px', borderRadius:5, background: p.disponivel !== false ? '#ecfdf5' : '#fef2f2', color: p.disponivel !== false ? '#059669' : '#dc2626', border:`1px solid ${p.disponivel !== false ? '#6ee7b7' : '#fca5a5'}` }}>
                      {p.disponivel !== false ? '✓ Disponível' : '✗ Indisponível'}
                    </span>
                  </div>
                  <button onClick={() => enviarProduto(p)} disabled={enviando === (p.id || p.nome)} style={{ width:'100%', padding:'5px 0', borderRadius:6, border:`1px solid ${V.accent}`, background: enviando === (p.id || p.nome) ? V.fill : 'transparent', color:V.accent, cursor:'pointer', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    <IcoSend /> {enviando === (p.id || p.nome) ? 'Enviando…' : 'Enviar ao cliente'}
                  </button>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}

// ── Barra de envio completa ───────────────────────────────────────────────────
function BarraEnvio({ modoManual, telefone, api, onEnviou }) {
  const [texto,     setTexto]     = useState('')
  const [sending,   setSending]   = useState(false)
  const [sugestoes, setSugestoes] = useState([])
  const [loadSug,   setLoadSug]   = useState(false)
  const [anotacao,  setAnotacao]  = useState(false)
  const [emoji,     setEmoji]     = useState(false)
  const inputRef = useRef(null)
  const imgRef   = useRef(null)
  const vidRef   = useRef(null)

  const EMOJIS = ['😊','👍','🙏','❤️','✅','📦','💰','🚀','😅','🎉','💬','⏳']

  const buscarSugestoes = useCallback(async () => {
    if (!telefone) return
    setLoadSug(true)
    try {
      const r = await fetch(`${api}/api/sugestoes/${telefone}`)
      if (r.ok) {
        const d = await r.json()
        const lista = d.sugestoes || d.suggestions || []
        if (lista.length > 0) {
          setSugestoes(lista)
        } else {
          // Fallback local quando endpoint não retorna sugestões
          setSugestoes([
            'Olá! Em que posso te ajudar hoje? 😊',
            'Pode me contar mais detalhes sobre o que precisa?',
            'Vou verificar isso para você agora mesmo! ⚡',
          ])
        }
      }
    } catch {
      // Fallback em caso de erro de rede
      setSugestoes([
        'Olá! Em que posso te ajudar hoje? 😊',
        'Pode me contar mais sobre o que precisa?',
      ])
    }
    setLoadSug(false)
  }, [telefone, api])

  useEffect(() => {
    if (modoManual && telefone) buscarSugestoes()
    else setSugestoes([])
  }, [modoManual, telefone])

  const enviar = async (msg) => {
    const txt = (msg || texto).trim()
    if (!txt || sending) return
    setTexto(''); setSugestoes([])
    setSending(true)
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone, mensagem: txt })
      })
      onEnviou?.()
    } catch {}
    setSending(false)
    inputRef.current?.focus()
  }

  const enviarArquivo = (file, tipo) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]
      try {
        await fetch(`${api}/api/dashboard/mensagem`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telefone, tipo, midia_base64: base64, midia_nome: file.name })
        })
        onEnviou?.()
      } catch {}
    }
    reader.readAsDataURL(file)
  }

  if (!modoManual) return (
    <div style={{ padding:'10px 14px', borderTop:`1px solid ${V.sep}`, background:V.bg2, display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11, color:V.label4 }}>
      <span>IA respondendo automaticamente</span>
    </div>
  )

  const toolBtn = (content, label, onClick, active = false, accentColor = null) => (
    <button title={label} onClick={onClick} style={{ width:28, height:28, borderRadius:7, border:`1px solid ${accentColor ? accentColor + '40' : V.sep}`, background: active ? (accentColor || V.accent) + '15' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: active ? (accentColor || V.accent) : V.label4, transition:'all 0.12s' }}>
      {content}
    </button>
  )

  return (
    <div style={{ borderTop:`1px solid ${V.sep}`, background:V.bg2, flexShrink:0 }}>
      {/* Tabs resposta / anotação */}
      <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${V.sep}` }}>
        {[{ id:false, label:'Resposta Pública' }, { id:true, label:'Anotação Interna' }].map(a => (
          <button key={String(a.id)} onClick={() => setAnotacao(a.id)} style={{ padding:'7px 12px', border:'none', cursor:'pointer', background:'transparent', fontSize:11.5, fontWeight:anotacao === a.id ? 700 : 400, color:anotacao === a.id ? V.label : V.label4, borderBottom:anotacao === a.id ? `2px solid ${V.accent}` : '2px solid transparent', display:'flex', alignItems:'center', gap:4 }}>
            {a.id && <span style={{ color:'#7c3aed' }}><IcoLock /></span>}
            {a.label}
          </button>
        ))}
      </div>

      {/* Sugestões da IA */}
      {sugestoes.length > 0 && (
        <div style={{ padding:'6px 12px', display:'flex', gap:5, flexWrap:'wrap', alignItems:'center', borderBottom:`1px solid ${V.sep}` }}>
          <span style={{ color:'#f59e0b' }}><IcoBulb /></span>
          {sugestoes.slice(0, 3).map((s, i) => (
            <button key={i} onClick={() => enviar(s)} style={{ fontSize:10.5, padding:'3px 9px', borderRadius:12, border:`1px solid rgba(245,158,11,0.35)`, background:'rgba(245,158,11,0.08)', color:V.label2, cursor:'pointer', maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {s}
            </button>
          ))}
          <button onClick={buscarSugestoes} style={{ marginLeft:'auto', fontSize:10, color:V.label4, background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center' }}>
            {loadSug ? '…' : <IcoRefresh />}
          </button>
        </div>
      )}

      {/* Picker de emoji */}
      {emoji && (
        <div style={{ padding:'8px 12px', borderBottom:`1px solid ${V.sep}`, display:'flex', gap:6, flexWrap:'wrap' }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => { setTexto(t => t + e); setEmoji(false); inputRef.current?.focus() }} style={{ fontSize:18, background:'transparent', border:'none', cursor:'pointer', padding:2 }}>
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Nota interna */}
      {anotacao && (
        <div style={{ fontSize:10, color:'#7c3aed', fontWeight:600, margin:'6px 12px 0', padding:'3px 8px', background:'#f5f0ff', borderRadius:5, display:'inline-flex', alignItems:'center', gap:4 }}>
          <IcoLock /> Anotação interna — não enviada ao cliente
        </div>
      )}

      {/* Campo de texto */}
      <div style={{ padding:'8px 12px' }}>
        <textarea ref={inputRef} value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }} placeholder={anotacao ? 'Escreva uma anotação interna...' : 'Escreva uma mensagem...'} rows={2} style={{ width:'100%', border:'none', background:'transparent', outline:'none', fontSize:13, color:V.label, resize:'none', lineHeight:1.55, maxHeight:100, overflow:'auto', fontFamily:'inherit' }} />
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px 8px' }}>
        {toolBtn(<IcoSmile />, 'Emoji', () => setEmoji(v => !v), emoji)}
        <label title="Enviar imagem" style={{ width:28, height:28, borderRadius:7, border:`1px solid ${V.sep}`, background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:V.label4 }}>
          <IcoImage />
          <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { if (e.target.files[0]) enviarArquivo(e.target.files[0], 'image'); e.target.value = '' }} />
        </label>
        <label title="Enviar vídeo" style={{ width:28, height:28, borderRadius:7, border:`1px solid ${V.sep}`, background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:V.label4 }}>
          <IcoVideo />
          <input ref={vidRef} type="file" accept="video/*" style={{ display:'none' }} onChange={e => { if (e.target.files[0]) enviarArquivo(e.target.files[0], 'video'); e.target.value = '' }} />
        </label>
        {toolBtn(<IcoMic />, 'Áudio', () => {})}
        {toolBtn(<IcoBulb />, 'Sugestão IA', buscarSugestoes, false, '#f59e0b')}

        <div style={{ flex:1 }} />

        <button onClick={() => enviar()} disabled={sending || !texto.trim()} style={{ padding:'6px 16px', borderRadius:8, border:'none', background: texto.trim() && !sending ? V.accent : V.fill, color: texto.trim() && !sending ? '#fff' : V.label4, cursor: texto.trim() ? 'pointer' : 'default', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, transition:'all 0.15s' }}>
          {sending ? '…' : <><IcoSend /> Enviar</>}
        </button>
      </div>
    </div>
  )
}

// ── Chat principal ────────────────────────────────────────────────────────────
function Chat({ telefone, nome, totalMsgs, hora, api, status, onStatusChange, modoManual, onToggleModo }) {
  const [msgs,           setMsgs]           = useState([])
  const [loading,        setLoading]         = useState(true)
  const [hasMore,        setHasMore]         = useState(false)
  const [offset,         setOffset]          = useState(0)
  const [mostrarGatilhos,setMostrarGatilhos] = useState(false)
  const bottomRef = useRef(null)
  const prevLen   = useRef(0)
  const fetching  = useRef(false)
  const pollingRef = useRef(null)

  const carregar = useCallback(async (off = 0, sil = false) => {
    if (!telefone || fetching.current) return
    fetching.current = true
    if (!sil) setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/historico/${telefone}?limit=60&offset=${off}`)
      if (r.ok) {
        const d    = await r.json()
        const novas = d.mensagens || []
        if (off === 0) setMsgs(novas)
        else setMsgs(prev => [...novas, ...prev])
        setHasMore(d.hasMore || false)
        setOffset(off === 0 ? novas.length : off + novas.length)
      }
    } catch {}
    if (!sil) setLoading(false)
    fetching.current = false
  }, [telefone, api])

  useEffect(() => {
    setMsgs([]); setOffset(0); prevLen.current = 0
    carregar(0)
    pollingRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') carregar(0, true)
    }, 8000)
    return () => clearInterval(pollingRef.current)
  }, [telefone])

  useEffect(() => {
    if (msgs.length > prevLen.current) {
      bottomRef.current?.scrollIntoView({ behavior: prevLen.current === 0 ? 'instant' : 'smooth' })
    }
    prevLen.current = msgs.length
  }, [msgs])

  const grupos = useMemo(() => {
    const g = []; let d = null
    for (const m of msgs) {
      const dt = new Date(m.criado_em).toDateString()
      if (dt !== d) { g.push({ tipo:'sep', data:m.criado_em }); d = dt }
      g.push({ tipo:'msg', msg:m })
    }
    return g
  }, [msgs])

  const stCfg = STATUS.find(s => s.id === status) || STATUS[0]

  // Conta gatilhos na conversa
  const nGatilhos = msgs.filter(m => m.modo === 'transacional').length

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, background:V.bg }}>
      {/* Header */}
      <div style={{ padding:'10px 16px', borderBottom:`1px solid ${V.sep}`, background:V.bg2, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <Avatar nome={nome} telefone={telefone} size={36} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:600, color:V.label }}>{nome || fmtTel(telefone)}</div>
          <div style={{ fontSize:10, color:V.label4 }}>{totalMsgs} msgs · {hora}</div>
        </div>

        {/* Toggle IA/Manual */}
        <button onClick={onToggleModo} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:8, border:`1px solid ${modoManual ? '#93c5fd' : V.sep}`, background:modoManual ? '#eff6ff' : V.fill, color:modoManual ? '#2563eb' : V.label3, cursor:'pointer', fontSize:11, fontWeight:600, flexShrink:0 }}>
          {modoManual ? <><IcoBot /> Devolver à IA</> : <><IcoUser /> Assumir</>}
        </button>

        {/* Botões de status */}
        <div style={{ display:'flex', gap:3 }}>
          {STATUS.filter(s => s.id !== 'gatilhos').map(s => (
            <button key={s.id} onClick={() => onStatusChange(telefone, s.id)} title={s.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'5px 8px', borderRadius:8, border:'none', cursor:'pointer', background:status === s.id ? s.bg : 'transparent', color:status === s.id ? s.cor : V.label4, outline:status === s.id ? `1.5px solid ${s.cor}50` : 'none', minWidth:46, transition:'all 0.12s' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:status === s.id ? s.cor : V.label4, display:'inline-block' }} />
              <span style={{ fontSize:9, fontWeight:600 }}>{s.label}</span>
            </button>
          ))}
        </div>

        <button onClick={() => carregar(0)} style={{ padding:5, border:`1px solid ${V.sep}`, borderRadius:6, background:'transparent', cursor:'pointer', color:V.label4 }}>
          <IcoRefresh />
        </button>
      </div>

      {/* Barra do catálogo — ACIMA das mensagens (Versão A) */}
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'#534AB708', borderBottom:`1px solid #534AB720`, flexShrink:0 }}>
        <span style={{ color:'#534AB7', flexShrink:0 }}><IcoPkg /></span>
        <span style={{ fontSize:10, fontWeight:600, color:'#534AB7', flexShrink:0 }}>Catálogo</span>
        <CatalogoBarra telefone={telefone} api={api} />
      </div>

      {/* Filtro gatilhos */}
      {nGatilhos > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 12px', background:'#a78bfa08', borderBottom:`1px solid #a78bfa20`, flexShrink:0 }}>
          <span style={{ fontSize:10, color:'#7c3aed', display:'flex', alignItems:'center', gap:3 }}><IcoZap /> {nGatilhos} gatilho{nGatilhos > 1 ? 's' : ''} nesta conversa</span>
          <button onClick={() => setMostrarGatilhos(v => !v)} style={{ fontSize:10, padding:'1px 8px', borderRadius:99, border:`1px solid #a78bfa50`, background:mostrarGatilhos ? '#a78bfa18' : 'transparent', color:'#7c3aed', cursor:'pointer', fontWeight:500 }}>
            {mostrarGatilhos ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      )}

      {/* Mensagens */}
      <div style={{ flex:1, overflow:'auto', padding:'12px 16px', background:V.bg }}>
        {hasMore && (
          <div style={{ textAlign:'center', padding:'4px 0' }}>
            <button onClick={() => carregar(offset)} style={{ fontSize:10, color:V.accent, background:'transparent', border:`1px solid ${V.sep}`, borderRadius:6, padding:'3px 10px', cursor:'pointer' }}>
              Carregar anteriores
            </button>
          </div>
        )}
        {loading && msgs.length === 0
          ? <div style={{ textAlign:'center', padding:40, color:V.label4, fontSize:12 }}>Carregando...</div>
          : grupos.length === 0
          ? <div style={{ textAlign:'center', padding:40, color:V.label4, fontSize:12 }}>Nenhuma mensagem</div>
          : grupos.map((g, i) =>
              g.tipo === 'sep'
                ? <DateSep key={`s${i}`} data={g.data} />
                : <Bolha key={g.msg.id || i} msg={{ ...g.msg, telefone }} mostrarGatilhos={mostrarGatilhos} />
            )
        }
        <div ref={bottomRef} />
      </div>

      <BarraEnvio modoManual={modoManual} telefone={telefone} api={api} onEnviou={() => carregar(0, true)} />
    </div>
  )
}

// ── Barra de catálogo embutida acima das mensagens ────────────────────────────
function CatalogoBarra({ telefone, api }) {
  const [busca,    setBusca]    = useState('')
  const [produtos, setProdutos] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [aberto,   setAberto]   = useState(false)
  const [enviando, setEnviando] = useState(null)

  const buscar = async () => {
    if (!busca.trim()) return
    setLoading(true); setAberto(true)
    try {
      const r = await fetch(`${api}/api/dashboard/catalogo?q=${encodeURIComponent(busca)}`)
      if (r.ok) { const d = await r.json(); setProdutos(d.produtos || []) }
    } catch {}
    setLoading(false)
  }

  const enviar = async (prod) => {
    setEnviando(prod.id || prod.nome)
    const precoNum = parseFloat(prod.preco || prod.precoVenda || 0)
    const pix = (precoNum * 0.9).toFixed(2).replace('.', ',')
    const msg = `*${prod.nome || prod.descricao}*\n💳 Cartão: ${fmtR(precoNum)} | 💰 PIX: R$ ${pix}\n${prod.disponivel !== false ? '✅ Disponível em estoque' : '⚠️ Indisponível'}`
    try {
      await fetch(`${api}/api/dashboard/mensagem`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone, mensagem: msg })
      })
    } catch {}
    setEnviando(null); setAberto(false); setBusca('')
  }

  return (
    <div style={{ flex:1, position:'relative' }}>
      <div style={{ display:'flex', gap:5 }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:5, padding:'3px 8px', borderRadius:7, background:V.bg, border:`1px solid #534AB730` }}>
          <span style={{ color:'#534AB780' }}><IcoSearch /></span>
          <input value={busca} onChange={e => setBusca(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscar()} placeholder="Buscar produto para enviar ao cliente..." style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:11, color:V.label }} />
          {busca && <button onClick={() => { setBusca(''); setAberto(false); setProdutos([]) }} style={{ background:'transparent', border:'none', cursor:'pointer', color:V.label4, display:'flex', alignItems:'center' }}><IcoX /></button>}
        </div>
        <button onClick={buscar} style={{ padding:'3px 10px', borderRadius:7, border:'none', background:'#534AB7', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:600 }}>
          Buscar
        </button>
      </div>

      {/* Dropdown de resultados */}
      {aberto && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100, marginTop:3, background:V.bg2, border:`1px solid ${V.sep}`, borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.15)', maxHeight:240, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:'12px 14px', fontSize:11, color:V.label4 }}>Buscando...</div>
          ) : produtos.length === 0 ? (
            <div style={{ padding:'12px 14px', fontSize:11, color:V.label4 }}>Nenhum produto encontrado</div>
          ) : produtos.slice(0, 8).map((p, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderBottom:`1px solid ${V.sep}`, cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = V.bg3}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:500, color:V.label, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.nome || p.descricao}</div>
                <div style={{ fontSize:10, color:V.label4 }}>{p.codigo || ''} · {fmtR(p.preco || p.precoVenda || 0)}</div>
              </div>
              <button onClick={() => enviar(p)} disabled={enviando === (p.id || p.nome)} style={{ padding:'3px 10px', borderRadius:6, border:`1px solid ${V.accent}`, background:'transparent', color:V.accent, cursor:'pointer', fontSize:10, fontWeight:600, flexShrink:0 }}>
                {enviando === (p.id || p.nome) ? '…' : 'Enviar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PageConversas({ api: apiProp }) {
  const api = apiProp || BASE

  const [convs,     setConvs]     = useState([])
  const [selTel,    setSelTel]    = useState(null)
  const [statusSel, setStatusSel] = useState(() => sessionStorage.getItem('bia_conv_status') || 'pendente')
  const [statusMap, setStatusMap] = useState({})
  const [modoMap,   setModoMap]   = useState({})
  const [busca,     setBusca]     = useState('')
  const [loading,   setLoading]   = useState(true)
  const [sidebar,   setSidebar]   = useState(() => sessionStorage.getItem('bia_sidebar') === 'true')

  useEffect(() => { sessionStorage.setItem('bia_conv_status', statusSel) }, [statusSel])
  useEffect(() => { sessionStorage.setItem('bia_sidebar', String(sidebar)) }, [sidebar])

  const getStatus = tel => statusMap[tel] || 'pendente'
  const getModo   = tel => modoMap[tel]   || false

  const carregar = useCallback(async (sil = false) => {
    if (!sil) setLoading(true)
    try {
      const r = await fetch(`${api}/api/dashboard/conversas?aba=todas`)
      if (r.ok) {
        const d    = await r.json()
        const novas = d.conversas || []
        setConvs(prev => {
          const map = new Map(prev.map(c => [c.telefone, c]))
          return novas.map(c => ({ ...map.get(c.telefone), ...c }))
        })
        // Popula statusMap com valores do banco sem sobrescrever locais
        setStatusMap(prev => {
          const novo = { ...prev }
          novas.forEach(c => {
            if (!novo[c.telefone] && c.status_atendimento) {
              novo[c.telefone] = c.status_atendimento
            }
          })
          return novo
        })
      }
    } catch {}
    if (!sil) setLoading(false)
  }, [api])

  useEffect(() => {
    carregar()
    const i = setInterval(() => {
      if (document.visibilityState === 'visible') carregar(true)
    }, 15000)
    return () => clearInterval(i)
  }, [carregar])

  // ── Salva status no servidor e atualiza local ─────────────────────────────
  const setConvStatus = useCallback((tel, st) => {
    // Atualiza imediatamente no estado local
    setStatusMap(prev => ({ ...prev, [tel]: st }))

    // Persiste no servidor — tenta PATCH no status do atendimento
    fetch(`${api}/api/dashboard/status/${tel}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: st })
    }).catch(() => {})

    // Também tenta salvar no contatos
    fetch(`${api}/api/contatos/${tel}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: st })
    }).catch(() => {})
  }, [api])

  const toggleModo = useCallback(tel => {
    setModoMap(prev => ({ ...prev, [tel]: !prev[tel] }))
  }, [])

  const contadores = useMemo(() => {
    const c = {}
    STATUS.forEach(s => { c[s.id] = convs.filter(cv => getStatus(cv.telefone) === s.id).length })
    c['gatilhos'] = convs.filter(c => c.modo === 'transacional').length
    return c
  }, [convs, statusMap])

  const filtradas = useMemo(() => convs
    .filter(c => {
      if (statusSel === 'gatilhos') return c.modo === 'transacional'
      return getStatus(c.telefone) === statusSel
    })
    .filter(c => !busca ||
      (c.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
      c.telefone.includes(busca) ||
      (c.ultima_msg || '').toLowerCase().includes(busca.toLowerCase())
    ), [convs, statusSel, statusMap, busca])

  const selConv = convs.find(c => c.telefone === selTel)
  const stCfg   = STATUS.find(s => s.id === statusSel) || STATUS[0]

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden', background:V.bg }}>
      {/* Sidebar de filtros */}
      <Sidebar statusSel={statusSel} setStatusSel={setStatusSel} contadores={contadores} expandida={sidebar} setExpandida={setSidebar} />

      {/* Lista de conversas */}
      <div style={{ width:280, flexShrink:0, display:'flex', flexDirection:'column', borderRight:`1px solid ${V.sep}`, background:V.bg }}>
        <div style={{ padding:'10px 12px', borderBottom:`1px solid ${V.sep}`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:stCfg.cor, display:'inline-block' }} />
              <span style={{ fontSize:13, fontWeight:600, color:V.label }}>{stCfg.label}</span>
              <span style={{ fontSize:10, color:V.label4, background:V.fill, padding:'1px 6px', borderRadius:8 }}>{filtradas.length}</span>
            </div>
            <button onClick={() => carregar()} style={{ padding:4, border:'none', background:'transparent', cursor:'pointer', color:V.label4 }}>
              <IcoRefresh />
            </button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:V.fill, borderRadius:8, padding:'6px 9px', border:`1px solid ${V.sep}` }}>
            <span style={{ color:V.label4 }}><IcoSearch /></span>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:11.5, color:V.label }} />
          </div>
        </div>

        <div style={{ flex:1, overflow:'auto' }}>
          {loading
            ? Array.from({ length:5 }).map((_, i) => (
                <div key={i} style={{ padding:'10px 12px', borderBottom:`1px solid ${V.sep}` }}>
                  <div style={{ height:10, width:'55%', borderRadius:4, background:V.sep, marginBottom:5 }} />
                  <div style={{ height:8, width:'75%', borderRadius:4, background:V.sep }} />
                </div>
              ))
            : filtradas.length === 0
              ? <div style={{ padding:24, textAlign:'center', fontSize:12, color:V.label4 }}>
                  {statusSel === 'pendente' ? 'Novas conversas aparecem aqui'
                   : statusSel === 'gatilhos' ? 'Disparos automáticos aqui'
                   : 'Mude o status de uma conversa para ver aqui'}
                </div>
              : filtradas.map(c => {
                  const ativo   = selTel === c.telefone
                  const st      = STATUS.find(s => s.id === getStatus(c.telefone)) || STATUS[0]
                  return (
                    <div key={c.telefone} onClick={() => setSelTel(c.telefone)}
                      style={{ display:'flex', gap:9, padding:'10px 12px', cursor:'pointer', borderBottom:`1px solid ${V.sep}`, borderLeft:ativo?`3px solid ${V.accent}`:'3px solid transparent', background:ativo?`${V.accent}08`:'transparent', transition:'background 0.1s' }}
                      onMouseEnter={e => { if (!ativo) e.currentTarget.style.background = V.fill }}
                      onMouseLeave={e => { if (!ativo) e.currentTarget.style.background = 'transparent' }}>
                      <Avatar nome={c.nome} telefone={c.telefone} size={34} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:V.label, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130 }}>{c.nome || fmtTel(c.telefone)}</span>
                          <span style={{ fontSize:9, color:V.label4, flexShrink:0 }}>{c.hora}</span>
                        </div>
                        <div style={{ fontSize:10.5, color:V.label3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>
                          {c.ultima_direcao === 'saida' ? '↩ ' : ''}{c.ultima_msg || '—'}
                        </div>
                        <div style={{ display:'flex', gap:3 }}>
                          {c.agente && <span style={{ fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:4, background:'#ecfdf5', color:'#059669', border:'1px solid #6ee7b7' }}>IA</span>}
                          <span style={{ fontSize:8, fontWeight:600, padding:'1px 5px', borderRadius:4, background:st.bg, color:st.cor }}>{st.label}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
          }
        </div>
      </div>

      {/* Chat + Painel */}
      {selTel ? (
        <>
          <Chat
            key={selTel}
            telefone={selTel}
            nome={selConv?.nome}
            totalMsgs={selConv?.total_msgs}
            hora={selConv?.hora}
            api={api}
            status={getStatus(selTel)}
            onStatusChange={setConvStatus}
            modoManual={getModo(selTel)}
            onToggleModo={() => toggleModo(selTel)}
          />
          {selConv && <PainelInfo conv={selConv} api={api} />}
        </>
      ) : (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:V.label4, background:V.bg }}>
          <div style={{ fontSize:36, opacity:.12 }}>💬</div>
          <div style={{ fontSize:14, fontWeight:500, color:V.label3 }}>Selecione uma conversa</div>
          <div style={{ fontSize:11, color:V.label4 }}>{filtradas.length} em {stCfg.label.toLowerCase()}</div>
        </div>
      )}
    </div>
  )
}
