import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Copy, Check, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Search, ExternalLink } from 'lucide-react'

// ── Página de debug — mapeia campos reais do Bling ───────────────────────────
// Deploy, acesse /debug-pedidos, copie os resultados e me envie
export default function PagePedidosDebug({ api }) {
  const [debugPedido, setDebugPedido] = useState(null)
  const [debugLojas,  setDebugLojas]  = useState(null)
  const [rastreioCode, setRastreioCode] = useState('')
  const [rastreioRes,  setRastreioRes]  = useState(null)
  const [loading, setLoading] = useState({pedido:false, lojas:false, rastreio:false})
  const [copied,  setCopied]  = useState('')
  const [expanded, setExpanded] = useState({})

  const copy = (text, key) => {
    navigator.clipboard.writeText(typeof text==='object' ? JSON.stringify(text, null, 2) : String(text))
    setCopied(key); setTimeout(()=>setCopied(''), 2000)
  }

  const runDebugPedido = async () => {
    setLoading(l=>({...l,pedido:true}))
    try {
      const r = await fetch(`${api}/api/dashboard/debug/pedido`)
      setDebugPedido(await r.json())
    } catch(e) { setDebugPedido({ erro: e.message }) }
    setLoading(l=>({...l,pedido:false}))
  }

  const runDebugLojas = async () => {
    setLoading(l=>({...l,lojas:true}))
    try {
      const r = await fetch(`${api}/api/dashboard/debug/lojas`)
      setDebugLojas(await r.json())
    } catch(e) { setDebugLojas({ erro: e.message }) }
    setLoading(l=>({...l,lojas:false}))
  }

  const runRastreio = async () => {
    if (!rastreioCode.trim()) return
    setLoading(l=>({...l,rastreio:true}))
    try {
      const r = await fetch(`${api}/api/dashboard/rastreio/${rastreioCode.trim()}`)
      setRastreioRes(await r.json())
    } catch(e) { setRastreioRes({ erro: e.message }) }
    setLoading(l=>({...l,rastreio:false}))
  }

  const SCard = ({ title, children, extra }) => (
    <div style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', borderRadius:12, overflow:'hidden', marginBottom:14 }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--sep)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--fill)' }}>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--label)' }}>{title}</span>
        {extra}
      </div>
      <div style={{ padding:'14px 16px' }}>{children}</div>
    </div>
  )

  const Field = ({ k, v }) => {
    const strV = typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')
    const isObj = typeof v === 'object' && v !== null
    const exp = expanded[k]
    return (
      <div style={{ display:'flex', borderBottom:'1px solid var(--sep)', fontSize:12, minHeight:32 }}>
        <div style={{ width:220, padding:'7px 10px', background:'var(--fill)', color:'var(--label-3)', fontFamily:'monospace', fontWeight:600, flexShrink:0, display:'flex', alignItems:'flex-start', borderRight:'1px solid var(--sep)' }}>
          {k}
        </div>
        <div style={{ flex:1, padding:'7px 10px', color: v===null||v===undefined?'var(--label-4)':'var(--label)', wordBreak:'break-all', display:'flex', gap:8, alignItems:'flex-start', justifyContent:'space-between' }}>
          <div style={{ flex:1 }}>
            {isObj ? (
              <>
                <button onClick={()=>setExpanded(e=>({...e,[k]:!exp}))} style={{ fontSize:11, padding:'1px 6px', borderRadius:4, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', marginBottom:exp?6:0 }}>
                  {exp?<ChevronDown size={10}/>:<ChevronRight size={10}/>} {Array.isArray(v)?`array[${v.length}]`:'object'}
                </button>
                {exp && <pre style={{ fontSize:11, fontFamily:'monospace', color:'var(--label-3)', margin:0, whiteSpace:'pre-wrap', background:'var(--bg)', padding:8, borderRadius:7 }}>{JSON.stringify(v, null, 2)}</pre>}
              </>
            ) : (
              <span style={{ fontFamily: typeof v==='string'&&(v.startsWith('http')||v.match(/^\d{10,}$/))?'monospace':'inherit' }}>{strV}</span>
            )}
          </div>
          <button onClick={()=>copy(v??'', k)} style={{ padding:'2px 6px', borderRadius:4, border:'1px solid var(--sep)', background:'transparent', color:'var(--label-4)', cursor:'pointer', fontSize:9, flexShrink:0, display:'flex', alignItems:'center', gap:3 }}>
            {copied===k?<Check size={9} style={{color:'#22c55e'}}/>:<Copy size={9}/>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding:'22px 28px', maxWidth:1000, margin:'0 auto', height:'100%', overflowY:'auto' }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:'var(--label)', margin:0, letterSpacing:'-.3px' }}>Debug — Mapeamento Bling</h1>
        <p style={{ fontSize:12, color:'var(--label-4)', marginTop:4 }}>
          Execute os testes abaixo, copie os resultados e envie para que possamos mapear as lojas e situações reais.
        </p>
      </div>

      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:10, background:'rgba(245,158,11,.07)', border:'1px solid rgba(245,158,11,.2)', marginBottom:20 }}>
        <AlertTriangle size={14} style={{ color:'#f59e0b', flexShrink:0, marginTop:2 }}/>
        <p style={{ fontSize:12, color:'var(--label-3)', lineHeight:1.6, margin:0 }}>
          <strong style={{ color:'#f59e0b' }}>Instrução:</strong> Execute cada teste, expanda os objetos, copie e envie os resultados. Com esses dados mapeamos todas as lojas, situações reais e campos disponíveis para montar os painéis definitivos.
        </p>
      </div>

      {/* ── TEST 1: Estrutura do pedido ── */}
      <SCard title="Teste 1 — Campos do pedido (Bling raw)" extra={
        <button onClick={runDebugPedido} disabled={loading.pedido} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8, border:'none', background:'var(--accent)', color:'#000', cursor:'pointer', fontSize:12, fontWeight:700 }}>
          {loading.pedido?<RefreshCw size={12} style={{animation:'spin 1s linear infinite'}}/>:<CheckCircle size={12}/>}
          {loading.pedido?'Buscando...':'Executar'}
        </button>
      }>
        {!debugPedido && <p style={{ color:'var(--label-4)', fontSize:12 }}>Clique em "Executar" para buscar os campos reais do Bling.</p>}
        {debugPedido?.erro && (
          <div style={{ padding:'10px', borderRadius:8, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', color:'#ef4444', fontSize:12 }}>
            Erro: {debugPedido.erro}
          </div>
        )}
        {debugPedido && !debugPedido.erro && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:12, color:'var(--label-3)' }}>Total de pedidos no Bling: <strong style={{ color:'var(--accent)' }}>{debugPedido.totalBling}</strong></span>
              <button onClick={()=>copy(debugPedido,'debug-pedido-completo')} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:6, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', fontSize:11 }}>
                {copied==='debug-pedido-completo'?<Check size={10} style={{color:'#22c55e'}}/>:<Copy size={10}/>} Copiar tudo
              </button>
            </div>

            {debugPedido.rawListagem && (
              <>
                <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:8 }}>Campos do raw da listagem</p>
                <div style={{ borderRadius:9, border:'1px solid var(--sep)', overflow:'hidden', marginBottom:16 }}>
                  {Object.entries(debugPedido.rawListagem).map(([k,v])=><Field key={k} k={k} v={v}/>)}
                </div>
              </>
            )}

            {debugPedido.rawDetalhe && (
              <>
                <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:8 }}>Campos do raw do detalhe (GET /pedidos/vendas/:id)</p>
                <div style={{ borderRadius:9, border:'1px solid var(--sep)', overflow:'hidden', marginBottom:16 }}>
                  {Object.entries(debugPedido.rawDetalhe).map(([k,v])=><Field key={k} k={k} v={v}/>)}
                </div>
              </>
            )}

            <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:6 }}>Situações encontradas</p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
              {debugPedido.situacoes?.map((s,i)=>(
                <div key={i} style={{ padding:'6px 12px', borderRadius:8, background:'var(--fill)', border:'1px solid var(--sep)', fontSize:12 }}>
                  <span style={{ fontFamily:'monospace', color:'var(--accent)' }}>id:{s.id}</span>
                  <span style={{ color:'var(--label-3)', margin:'0 6px' }}>|</span>
                  <span style={{ color:'var(--label)' }}>{s.label}</span>
                  {s.valor!==s.id && <span style={{ color:'var(--label-4)', fontSize:10 }}> (valor:{s.valor})</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </SCard>

      {/* ── TEST 2: Lojas ── */}
      <SCard title="Teste 2 — Mapeamento de lojas (IDs reais)" extra={
        <button onClick={runDebugLojas} disabled={loading.lojas} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8, border:'none', background:'var(--accent)', color:'#000', cursor:'pointer', fontSize:12, fontWeight:700 }}>
          {loading.lojas?<RefreshCw size={12} style={{animation:'spin 1s linear infinite'}}/>:<CheckCircle size={12}/>}
          {loading.lojas?'Buscando...':'Executar'}
        </button>
      }>
        {!debugLojas && <p style={{ color:'var(--label-4)', fontSize:12 }}>Lê as 5 primeiras páginas de pedidos para mapear todas as lojas únicas com seus IDs reais.</p>}
        {debugLojas?.erro && (
          <div style={{ padding:'10px', borderRadius:8, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', color:'#ef4444', fontSize:12 }}>
            Erro: {debugLojas.erro}
          </div>
        )}
        {debugLojas && !debugLojas.erro && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:12, color:'var(--label-3)' }}><strong>{debugLojas.lojas?.length}</strong> lojas distintas encontradas</span>
              <button onClick={()=>copy(debugLojas,'debug-lojas-completo')} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:6, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', fontSize:11 }}>
                {copied==='debug-lojas-completo'?<Check size={10} style={{color:'#22c55e'}}/>:<Copy size={10}/>} Copiar tudo
              </button>
            </div>

            <div style={{ borderRadius:9, border:'1px solid var(--sep)', overflow:'hidden', marginBottom:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'70px 1fr 1fr 100px 80px', background:'var(--fill)', borderBottom:'1px solid var(--sep)' }}>
                {['ID Loja','Nome','Código','Canal','Pedidos'].map(h=>(
                  <div key={h} style={{ padding:'7px 10px', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)' }}>{h}</div>
                ))}
              </div>
              {debugLojas.lojas?.map((l,i)=>(
                <div key={i} style={{ display:'grid', gridTemplateColumns:'70px 1fr 1fr 100px 80px', borderBottom:i<debugLojas.lojas.length-1?'1px solid var(--sep)':'none' }}>
                  <div style={{ padding:'9px 10px', fontFamily:'monospace', fontSize:12, color:'var(--accent)' }}>{l.id||'null'}</div>
                  <div style={{ padding:'9px 10px', fontSize:12, color:'var(--label)', fontWeight:500 }}>{l.nome}</div>
                  <div style={{ padding:'9px 10px', fontSize:11, color:'var(--label-3)', fontFamily:'monospace' }}>{l.codigo||'—'}</div>
                  <div style={{ padding:'9px 10px', fontSize:11, color:'var(--label-3)' }}>{l.canal||'—'}</div>
                  <div style={{ padding:'9px 10px', fontSize:13, fontWeight:700, color:'var(--label)' }}>{l.count}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:6 }}>Situações (IDs reais)</p>
            <div style={{ borderRadius:9, border:'1px solid var(--sep)', overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'70px 1fr 80px 80px', background:'var(--fill)', borderBottom:'1px solid var(--sep)' }}>
                {['ID','Label','Valor','Pedidos'].map(h=>(
                  <div key={h} style={{ padding:'7px 10px', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)' }}>{h}</div>
                ))}
              </div>
              {debugLojas.situacoes?.map((s,i)=>(
                <div key={i} style={{ display:'grid', gridTemplateColumns:'70px 1fr 80px 80px', borderBottom:i<debugLojas.situacoes.length-1?'1px solid var(--sep)':'none' }}>
                  <div style={{ padding:'9px 10px', fontFamily:'monospace', fontSize:12, color:'var(--accent)', fontWeight:700 }}>{s.id}</div>
                  <div style={{ padding:'9px 10px', fontSize:12, color:'var(--label)', fontWeight:600 }}>{s.label||'sem label'}</div>
                  <div style={{ padding:'9px 10px', fontSize:11, color:'var(--label-3)', fontFamily:'monospace' }}>{s.valor}</div>
                  <div style={{ padding:'9px 10px', fontSize:13, fontWeight:700, color:'var(--label)' }}>{s.count}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </SCard>

      {/* ── TEST 3: Rastreio ── */}
      <SCard title="Teste 3 — Rastreio em tempo real">
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:9, border:'1px solid var(--sep)', background:'var(--bg)' }}>
            <Search size={12} style={{ color:'var(--label-4)' }}/>
            <input value={rastreioCode} onChange={e=>setRastreioCode(e.target.value)}
              placeholder="Código de rastreio (ex: BR000000000BR)"
              onKeyDown={e=>e.key==='Enter'&&runRastreio()}
              style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:12.5, color:'var(--label)', fontFamily:'monospace' }}/>
          </div>
          <button onClick={runRastreio} disabled={!rastreioCode.trim()||loading.rastreio}
            style={{ padding:'8px 18px', borderRadius:9, border:'none', background:'var(--accent)', color:'#000', cursor:'pointer', fontSize:12, fontWeight:700, flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
            {loading.rastreio?<RefreshCw size={12} style={{animation:'spin 1s linear infinite'}}/>:<CheckCircle size={12}/>}
            {loading.rastreio?'Rastreando...':'Rastrear'}
          </button>
        </div>
        {rastreioRes && (
          <div>
            {rastreioRes.erro ? (
              <div style={{ padding:'10px', borderRadius:8, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', color:'#ef4444', fontSize:12 }}>
                Erro: {rastreioRes.erro}
              </div>
            ) : rastreioRes.resultados?.length===0 ? (
              <div style={{ padding:'14px', borderRadius:9, background:'var(--fill)', border:'1px solid var(--sep)', fontSize:12, color:'var(--label-3)', textAlign:'center' }}>
                Nenhum resultado de rastreio encontrado. O objeto pode estar em processamento.
              </div>
            ) : (
              rastreioRes.resultados?.map((r,ri)=>(
                <div key={ri} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--label-4)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>Fonte: {r.fonte}</div>
                  <div style={{ padding:'8px 12px', borderRadius:8, background:'rgba(0,212,170,.08)', border:'1px solid rgba(0,212,170,.2)', marginBottom:10, fontSize:13, fontWeight:600, color:'#00d4aa' }}>
                    Status atual: {r.status}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:0, paddingLeft:14, borderLeft:'2px solid var(--sep)' }}>
                    {r.eventos?.map((e,ei)=>(
                      <div key={ei} style={{ position:'relative', paddingLeft:16, paddingBottom:14 }}>
                        <div style={{ position:'absolute', left:-8, top:4, width:14, height:14, borderRadius:'50%', background:ei===0?'var(--accent)':'var(--fill)', border:`2px solid ${ei===0?'var(--accent)':'var(--sep)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {ei===0&&<div style={{ width:5, height:5, borderRadius:'50%', background:'#000' }}/>}
                        </div>
                        <div style={{ fontSize:12, fontWeight:ei===0?600:400, color:ei===0?'var(--label)':'var(--label-3)' }}>{e.status}</div>
                        {e.local && <div style={{ fontSize:11, color:'var(--label-4)', marginTop:1 }}>{e.local}</div>}
                        <div style={{ fontSize:10, color:'var(--label-4)', marginTop:2, fontFamily:'monospace' }}>{e.data}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
            <div style={{ fontSize:10, color:'var(--label-4)', textAlign:'right', marginTop:8 }}>
              Atualizado: {rastreioRes.atualizadoEm ? new Date(rastreioRes.atualizadoEm).toLocaleString('pt-BR') : '—'}
            </div>
          </div>
        )}
      </SCard>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
