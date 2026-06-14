import { useState, useEffect, useCallback } from 'react'
import {
  ChevronUp, ChevronDown, Check, Sparkles, Tag, FolderTree, Layers,
  Eye, EyeOff, Loader2, GripVertical,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#7b81a0', ink4:'#3a3f5c',
  green:'#00e676', amber:'#ffb300', red:'#ff4757',
  purple:'#a78bfa', purpleDim:'rgba(167,139,250,.09)', purpleBor:'rgba(167,139,250,.25)',
  coral:'#fb7185', coralDim:'rgba(251,113,133,.08)', coralBor:'rgba(251,113,133,.25)',
  cyan:'#06b6d4', teal:'#22d3ee',
  blue:'#4f8ef7', blueDim:'rgba(79,142,247,.08)', blueBor:'rgba(79,142,247,.25)',
  sep:'rgba(255,255,255,.05)', sep2:'rgba(255,255,255,.08)',
}

// Tipo de bloco → ícone e cor
const TIPO_INFO = {
  colecao:   { icon:Sparkles, cor:T.coral,  label:'Coleção' },
  categoria: { icon:Tag,      cor:T.teal,   label:'Categoria' },
  grupo:     { icon:FolderTree, cor:T.blue, label:'Grupo' },
}

export default function MontadorBlocos({ cfg, cats, onChange }) {
  // blocos ativos (da config) — array ordenado
  const [blocos, setBlocos] = useState(cfg?.blocos || [])
  const [colecoes, setColecoes] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)

  // Carrega coleções para oferecer como blocos disponíveis
  const carregarColecoes = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/flow/colecoes`).then(r=>r.json())
      setColecoes(r.colecoes || [])
    } catch {}
  }, [])
  useEffect(() => { carregarColecoes() }, [carregarColecoes])
  useEffect(() => { setBlocos(cfg?.blocos || []) }, [cfg])

  // Itens disponíveis para virar bloco: coleções + categorias + grupos
  const disponiveis = [
    ...colecoes.map(c => ({ tipo:'colecao', ref:String(c.id), titulo:c.nome, sub:`${c.produtos_count||0} produtos` })),
    ...(cats||[]).map(c => ({ tipo:'categoria', ref:c.nome, titulo:(cfg?.apelidos||{})[c.nome]||c.nome, sub:`${c.disponiveis} disp.` })),
    ...((cfg?.grupos)||[]).filter(g=>(g.subcategorias||[]).length).map(g => ({ tipo:'grupo', ref:String(g.id), titulo:g.nome, sub:`${(g.subcategorias||[]).length} categorias` })),
  ]

  const noBloco = (tipo, ref) => blocos.some(b => b.tipo===tipo && String(b.ref)===String(ref))

  function adicionar(item) {
    setBlocos(bs => [...bs, { tipo:item.tipo, ref:item.ref, titulo:item.titulo, ordem:bs.length, visivel:true }])
    setOk(false)
  }
  function remover(idx) { setBlocos(bs => bs.filter((_,i)=>i!==idx)); setOk(false) }
  function mover(idx, dir) {
    setBlocos(bs => { const a=[...bs]; const j=idx+dir; if(j<0||j>=a.length)return a; [a[idx],a[j]]=[a[j],a[idx]]; return a })
    setOk(false)
  }
  function toggleVis(idx) { setBlocos(bs => bs.map((b,i)=>i===idx?{...b,visivel:!(b.visivel!==false)}:b)); setOk(false) }

  async function salvarBlocos() {
    setSalvando(true)
    try {
      await fetch(`${API}/api/flow/blocos`, {
        method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ blocos }) })
      setOk(true); setTimeout(()=>setOk(false), 2500); onChange?.()
    } catch {} finally { setSalvando(false) }
  }

  return (
    <div>
      <div style={{fontSize:11.5, color:T.ink3, marginBottom:12}}>
        A ordem aqui é a ordem que o cliente vê na vitrine. Adicione coleções, categorias e grupos, e ordene com as setas.
      </div>

      {/* Blocos ativos (ordem da vitrine) */}
      {blocos.length === 0 ? (
        <div style={{fontSize:12.5, color:T.ink3, padding:'10px 12px', background:T.bg1, border:`1px dashed ${T.sep2}`, borderRadius:10, marginBottom:14}}>
          Nenhum bloco ativo. Sem blocos, a vitrine mostra as categorias automaticamente. Adicione blocos abaixo para controlar a ordem.
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:6, marginBottom:14}}>
          {blocos.map((b, i) => {
            const info = TIPO_INFO[b.tipo] || TIPO_INFO.categoria
            const Ic = info.icon; const vis = b.visivel !== false
            return (
              <div key={`${b.tipo}:${b.ref}:${i}`} style={{
                display:'flex', alignItems:'center', gap:10, padding:'9px 11px',
                background: vis ? T.bg1 : 'transparent', border:`1px solid ${vis?T.sep2:T.sep}`, borderRadius:10, opacity: vis?1:0.55,
              }}>
                <div style={{display:'flex', flexDirection:'column'}}>
                  <ChevronUp size={13} color={i===0?T.ink4:T.ink3} style={{cursor:i===0?'default':'pointer'}} onClick={()=>mover(i,-1)}/>
                  <ChevronDown size={13} color={i===blocos.length-1?T.ink4:T.ink3} style={{cursor:i===blocos.length-1?'default':'pointer'}} onClick={()=>mover(i,1)}/>
                </div>
                <span style={{fontSize:10, fontWeight:800, color:T.ink4, width:18}}>{i+1}</span>
                <div style={{width:28, height:28, borderRadius:7, background:`${info.cor}18`, border:`1px solid ${info.cor}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  <Ic size={14} color={info.cor}/>
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:13, fontWeight:700, color:T.ink1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{b.titulo || b.ref}</div>
                  <div style={{fontSize:10.5, color:T.ink3}}>{info.label}</div>
                </div>
                <button onClick={()=>toggleVis(i)} title={vis?'Ocultar':'Mostrar'} style={{background:'none', border:'none', cursor:'pointer', color: vis?T.ink3:T.ink4, padding:4}}>
                  {vis ? <Eye size={15}/> : <EyeOff size={15}/>}
                </button>
                <button onClick={()=>remover(i)} title="Remover da vitrine" style={{background:'none', border:'none', cursor:'pointer', color:T.ink4, padding:4, fontSize:18, lineHeight:1}}>×</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Disponíveis para adicionar */}
      <div style={{fontSize:11, color:T.ink3, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8}}>Adicionar à vitrine</div>
      <div style={{display:'flex', flexWrap:'wrap', gap:7, marginBottom:16}}>
        {disponiveis.length === 0 ? (
          <div style={{fontSize:12, color:T.ink4}}>Nenhuma categoria/coleção disponível. Crie coleções ou rode o sync do catálogo.</div>
        ) : disponiveis.map(item => {
          const info = TIPO_INFO[item.tipo]; const Ic = info.icon; const jaTem = noBloco(item.tipo, item.ref)
          return (
            <button key={`${item.tipo}:${item.ref}`} onClick={()=>!jaTem && adicionar(item)} disabled={jaTem}
              style={{
                display:'flex', alignItems:'center', gap:6, padding:'7px 11px', borderRadius:999, fontSize:11.5, fontWeight:600,
                background: jaTem ? T.bg3 : `${info.cor}14`, border:`1px solid ${jaTem ? T.sep : info.cor+'3a'}`,
                color: jaTem ? T.ink4 : info.cor, cursor: jaTem ? 'default' : 'pointer',
              }}>
              {jaTem ? <Check size={12}/> : <Ic size={12}/>}
              {item.titulo}
              <span style={{fontSize:10, opacity:.7}}>· {item.sub}</span>
            </button>
          )
        })}
      </div>

      {/* Salvar blocos */}
      <div style={{display:'flex', justifyContent:'flex-end', alignItems:'center', gap:10}}>
        {ok && <span style={{fontSize:12.5, color:T.green, fontWeight:700, display:'flex', alignItems:'center', gap:5}}><Check size={14}/> Ordem salva</span>}
        <button onClick={salvarBlocos} disabled={salvando}
          style={{display:'flex', alignItems:'center', gap:7, background:T.purple, border:'none', borderRadius:9, padding:'9px 18px', cursor: salvando?'default':'pointer', color:'#fff', fontSize:12.5, fontWeight:800}}>
          {salvando ? <Loader2 size={14} className="spin"/> : <Layers size={14}/>}
          Salvar ordem da vitrine
        </button>
      </div>
    </div>
  )
}
