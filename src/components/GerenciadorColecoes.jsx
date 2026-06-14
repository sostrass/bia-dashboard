import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, Search, Check, X, Loader2, Hand, Zap, Hash,
  Package, ChevronRight, Layers,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#7b81a0', ink4:'#3a3f5c',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)', greenBor:'rgba(0,230,118,.25)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.08)', amberBor:'rgba(255,179,0,.25)',
  red:'#ff4757',  redDim:'rgba(255,71,87,.07)',   redBor:'rgba(255,71,87,.25)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.09)',purpleBor:'rgba(167,139,250,.25)',
  coral:'#fb7185', coralDim:'rgba(251,113,133,.08)', coralBor:'rgba(251,113,133,.25)',
  cyan:'#06b6d4', cyanDim:'rgba(6,182,212,.08)',   cyanBor:'rgba(6,182,212,.22)',
  blue:'#4f8ef7', blueDim:'rgba(79,142,247,.08)',  blueBor:'rgba(79,142,247,.25)',
  sep:'rgba(255,255,255,.05)', sep2:'rgba(255,255,255,.08)',
}

const TIPOS = {
  manual: { label:'Seleção manual', icon:Hand,  cor:T.coral,  desc:'Escolho os produtos um a um' },
  regra:  { label:'Regra automática', icon:Zap, cor:T.amber,  desc:'Estoque baixo, recém-criados…' },
  tag:    { label:'Por tag', icon:Hash, cor:T.cyan, desc:'Produtos com marcação no nome/código' },
}

export default function GerenciadorColecoes({ onChange }) {
  const [colecoes, setColecoes] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [editando, setEditando] = useState(null)   // coleção em edição (objeto) ou 'nova'
  const [erro,     setErro]     = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/flow/colecoes`).then(r=>r.json())
      setColecoes(r.colecoes || [])
    } catch (e) { setErro('Falha ao carregar coleções') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function salvarColecao(col) {
    setErro('')
    try {
      if (col.id && col.id !== 'nova') {
        await fetch(`${API}/api/flow/colecoes/${col.id}`, {
          method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(col) })
      } else {
        await fetch(`${API}/api/flow/colecoes`, {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(col) })
      }
      setEditando(null); carregar(); onChange?.()
    } catch (e) { setErro('Falha ao salvar: ' + e.message) }
  }

  async function removerColecao(id) {
    if (!confirm('Remover esta coleção? Blocos que a usam também serão removidos.')) return
    try {
      await fetch(`${API}/api/flow/colecoes/${id}`, { method:'DELETE' })
      carregar(); onChange?.()
    } catch (e) { setErro('Falha ao remover') }
  }

  if (editando) {
    return <EditorColecao
      colecao={editando === 'nova' ? { nome:'', tipo:'manual', produtos:[], regra:{}, tag:'' } : editando}
      onSalvar={salvarColecao}
      onCancelar={()=>setEditando(null)}
    />
  }

  return (
    <div>
      {erro && <div style={{fontSize:12.5, color:T.red, marginBottom:10}}>{erro}</div>}

      <div style={{display:'flex', flexDirection:'column', gap:8, marginBottom:12}}>
        {loading ? (
          <div style={{display:'flex', alignItems:'center', gap:8, color:T.ink3, fontSize:13, padding:'8px 0'}}>
            <Loader2 size={15} className="spin"/> Carregando coleções…
          </div>
        ) : colecoes.length === 0 ? (
          <div style={{fontSize:12.5, color:T.ink3, padding:'4px 0'}}>
            Nenhuma coleção ainda. Crie coleções como "Promoção", "Novidades" ou "Destaque" para curar produtos.
          </div>
        ) : colecoes.map(col => {
          const tp = TIPOS[col.tipo] || TIPOS.manual
          const Ic = tp.icon
          return (
            <div key={col.id} style={{display:'flex', alignItems:'center', gap:11, padding:'10px 12px', background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:11}}>
              <div style={{width:30, height:30, borderRadius:8, background:`${tp.cor}18`, border:`1px solid ${tp.cor}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                <Ic size={15} color={tp.cor}/>
              </div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13.5, fontWeight:700, color:T.ink1}}>{col.nome}</div>
                <div style={{fontSize:11, color:T.ink3}}>{tp.label} · {col.produtos_count ?? 0} produtos</div>
              </div>
              <button onClick={()=>setEditando(col)} style={{background:T.bg3, border:`1px solid ${T.sep2}`, borderRadius:8, padding:'6px 12px', cursor:'pointer', color:T.ink2, fontSize:12, fontWeight:600}}>Editar</button>
              <button onClick={()=>removerColecao(col.id)} title="Remover" style={{background:'none', border:'none', cursor:'pointer', color:T.ink4, padding:5}}><Trash2 size={14}/></button>
            </div>
          )
        })}
      </div>

      <button onClick={()=>setEditando('nova')} style={{display:'flex', alignItems:'center', gap:7, background:T.coralDim, border:`1px solid ${T.coralBor}`, borderRadius:9, padding:'9px 14px', cursor:'pointer', color:T.coral, fontWeight:700, fontSize:12.5}}>
        <Plus size={15}/> Nova coleção
      </button>
    </div>
  )
}

// ── Editor de uma coleção ─────────────────────────────────────────────────────
function EditorColecao({ colecao, onSalvar, onCancelar }) {
  const [col, setCol] = useState(colecao)
  const up = (campo, val) => setCol(c => ({ ...c, [campo]: val }))

  return (
    <div style={{background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:12, padding:'16px 18px'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
        <span style={{fontSize:14, fontWeight:800, color:T.ink1}}>{col.id && col.id!=='nova' ? 'Editar coleção' : 'Nova coleção'}</span>
        <button onClick={onCancelar} style={{background:'none', border:'none', cursor:'pointer', color:T.ink3}}><X size={18}/></button>
      </div>

      {/* Nome */}
      <label style={{fontSize:12, color:T.ink3, display:'block', marginBottom:5}}>Nome da coleção (o cliente vê)</label>
      <input value={col.nome} onChange={e=>up('nome', e.target.value)} placeholder="Ex: 🔥 Promoção, Novidades, Destaque"
        style={{width:'100%', background:T.bg0, border:`1px solid ${T.sep2}`, borderRadius:9, padding:'10px 12px', color:T.ink1, fontSize:13, outline:'none', marginBottom:16}}/>

      {/* Tipo */}
      <label style={{fontSize:12, color:T.ink3, display:'block', marginBottom:7}}>Como os produtos entram nesta coleção?</label>
      <div style={{display:'flex', gap:8, marginBottom:16}}>
        {Object.entries(TIPOS).map(([id, tp]) => {
          const Ic = tp.icon; const sel = col.tipo === id
          return (
            <div key={id} onClick={()=>up('tipo', id)} style={{
              flex:1, cursor:'pointer', padding:'10px', borderRadius:10, textAlign:'center',
              background: sel ? `${tp.cor}18` : T.bg2, border:`1px solid ${sel ? tp.cor+'66' : T.sep2}`,
            }}>
              <Ic size={17} color={sel ? tp.cor : T.ink3}/>
              <div style={{fontSize:11.5, fontWeight:700, color: sel ? tp.cor : T.ink2, marginTop:5}}>{tp.label}</div>
            </div>
          )
        })}
      </div>

      {/* Configuração específica do tipo */}
      {col.tipo === 'manual' && <SeletorProdutos selecionados={col.produtos||[]} onChange={ids=>up('produtos', ids)}/>}
      {col.tipo === 'regra' && <ConfigRegra regra={col.regra||{}} onChange={r=>up('regra', r)}/>}
      {col.tipo === 'tag' && (
        <div>
          <label style={{fontSize:12, color:T.ink3, display:'block', marginBottom:5}}>Tag (texto no nome ou código do produto)</label>
          <input value={col.tag||''} onChange={e=>up('tag', e.target.value)} placeholder="Ex: PROMO, LANC, destaque"
            style={{width:'100%', background:T.bg0, border:`1px solid ${T.sep2}`, borderRadius:9, padding:'10px 12px', color:T.ink1, fontSize:13, outline:'none'}}/>
          <div style={{fontSize:11, color:T.ink4, marginTop:6}}>Produtos cujo nome ou código contém esse texto entram automaticamente.</div>
        </div>
      )}

      {/* Ações */}
      <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:18}}>
        <button onClick={onCancelar} style={{background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:9, padding:'9px 16px', cursor:'pointer', color:T.ink2, fontSize:12.5, fontWeight:600}}>Cancelar</button>
        <button onClick={()=>onSalvar(col)} disabled={!col.nome.trim()}
          style={{background: col.nome.trim()?T.coral:T.bg3, border:'none', borderRadius:9, padding:'9px 18px', cursor: col.nome.trim()?'pointer':'default', color: col.nome.trim()?'#fff':T.ink4, fontSize:12.5, fontWeight:800}}>
          Salvar coleção
        </button>
      </div>
    </div>
  )
}

// ── Config de regra automática ────────────────────────────────────────────────
function ConfigRegra({ regra, onChange }) {
  const toggle = (campo) => onChange({ ...regra, [campo]: !regra[campo] })
  return (
    <div style={{display:'flex', flexDirection:'column', gap:10}}>
      <div style={{fontSize:11.5, color:T.ink3, marginBottom:2}}>Produtos que atendem estas condições entram automaticamente:</div>
      <LinhaCheck label="Estoque baixo (últimas unidades)" desc="Produtos com 1 a 5 em estoque" on={!!regra.estoque_baixo} onClick={()=>toggle('estoque_baixo')}/>
      <LinhaCheck label="Recém-cadastrados" desc="Atualizados nos últimos 30 dias" on={!!regra.recem_criado} onClick={()=>toggle('recem_criado')}/>
    </div>
  )
}

function LinhaCheck({ label, desc, on, onClick }) {
  return (
    <div onClick={onClick} style={{display:'flex', alignItems:'center', gap:11, padding:'9px 11px', background:T.bg2, border:`1px solid ${on?T.amberBor:T.sep2}`, borderRadius:9, cursor:'pointer'}}>
      <div style={{width:19, height:19, borderRadius:5, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: on?T.amber:'transparent', border:`1.5px solid ${on?T.amber:T.ink4}`}}>
        {on && <Check size={12} color="#000"/>}
      </div>
      <div>
        <div style={{fontSize:12.5, color:T.ink1, fontWeight:600}}>{label}</div>
        <div style={{fontSize:11, color:T.ink3}}>{desc}</div>
      </div>
    </div>
  )
}

// ── Seletor de produtos (busca + multi-seleção) ──────────────────────────────
function SeletorProdutos({ selecionados, onChange }) {
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const sel = new Set((selecionados || []).map(String))

  const buscar = useCallback(async (termo) => {
    setBuscando(true)
    try {
      const r = await fetch(`${API}/api/flow/buscar-produtos?q=${encodeURIComponent(termo)}`).then(r=>r.json())
      setResultados(r.produtos || [])
    } catch {} finally { setBuscando(false) }
  }, [])

  useEffect(() => { const t = setTimeout(()=>buscar(q), 350); return ()=>clearTimeout(t) }, [q, buscar])

  function toggle(id) {
    const s = new Set(sel)
    if (s.has(String(id))) s.delete(String(id)); else s.add(String(id))
    onChange([...s])
  }

  return (
    <div>
      <div style={{fontSize:11.5, color:T.ink3, marginBottom:8}}>
        <b style={{color:T.coral}}>{sel.size}</b> produto{sel.size!==1?'s':''} selecionado{sel.size!==1?'s':''}
      </div>
      <div style={{position:'relative', marginBottom:10}}>
        <Search size={15} color={T.ink4} style={{position:'absolute', left:11, top:'50%', transform:'translateY(-50%)'}}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar produto por nome ou código…"
          style={{width:'100%', background:T.bg0, border:`1px solid ${T.sep2}`, borderRadius:9, padding:'10px 12px 10px 34px', color:T.ink1, fontSize:13, outline:'none'}}/>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:5, maxHeight:280, overflowY:'auto', paddingRight:4}}>
        {buscando ? (
          <div style={{display:'flex', alignItems:'center', gap:8, color:T.ink3, fontSize:12.5, padding:'8px 0'}}><Loader2 size={14} className="spin"/> Buscando…</div>
        ) : resultados.length === 0 ? (
          <div style={{fontSize:12, color:T.ink4, padding:'6px 0'}}>Nenhum produto encontrado.</div>
        ) : resultados.map(p => {
          const marcado = sel.has(String(p.bling_id))
          return (
            <div key={p.bling_id} onClick={()=>toggle(p.bling_id)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'8px 10px', cursor:'pointer',
              background: marcado ? T.coralDim : T.bg2, border:`1px solid ${marcado?T.coralBor:T.sep2}`, borderRadius:9,
            }}>
              <div style={{width:18, height:18, borderRadius:5, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: marcado?T.coral:'transparent', border:`1.5px solid ${marcado?T.coral:T.ink4}`}}>
                {marcado && <Check size={11} color="#fff"/>}
              </div>
              {p.imagem
                ? <img src={p.imagem} alt="" style={{width:30, height:30, borderRadius:6, objectFit:'cover', flexShrink:0}}/>
                : <div style={{width:30, height:30, borderRadius:6, background:T.bg3, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center'}}><Package size={14} color={T.ink4}/></div>}
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:12, color:T.ink1, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.nome}</div>
                <div style={{fontSize:10.5, color:T.ink3}}>{p.preco_fmt} · {p.categoria || 'sem categoria'} {p.estoque<=0 && '· esgotado'}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
