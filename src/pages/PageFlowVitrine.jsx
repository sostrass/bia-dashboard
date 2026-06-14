import { useState, useEffect, useCallback } from 'react'
import {
  LayoutGrid, Save, Eye, EyeOff, GripVertical, Check, Power,
  Tag, MessageSquare, Settings, AlertCircle, Loader2, Smartphone,
  ChevronUp, ChevronDown, Sparkles, RefreshCw,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#7b81a0', ink4:'#3a3f5c',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)', greenBor:'rgba(0,230,118,.25)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.08)', amberBor:'rgba(255,179,0,.25)',
  red:'#ff4757',  redDim:'rgba(255,71,87,.07)',   redBor:'rgba(255,71,87,.25)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.09)',purpleBor:'rgba(167,139,250,.25)',
  cyan:'#06b6d4', cyanDim:'rgba(6,182,212,.08)',   cyanBor:'rgba(6,182,212,.22)',
  blue:'#4f8ef7', blueDim:'rgba(79,142,247,.08)',  blueBor:'rgba(79,142,247,.25)',
  sep:'rgba(255,255,255,.05)', sep2:'rgba(255,255,255,.08)',
}

// ── Toggle reutilizável ───────────────────────────────────────────────────────
function Toggle({ on, onClick, cor=T.green }) {
  return (
    <div onClick={onClick} style={{
      width:44, height:26, borderRadius:999, cursor:'pointer', flexShrink:0,
      background: on ? cor : T.bg4, border:`1px solid ${on?cor:T.sep2}`,
      transition:'all .15s', position:'relative',
    }}>
      <div style={{
        position:'absolute', top:2, left: on?20:2, width:20, height:20, borderRadius:'50%',
        background:'#fff', transition:'left .15s',
      }}/>
    </div>
  )
}

// ── Linha de comportamento (label + toggle) ──────────────────────────────────
function LinhaToggle({ label, desc, on, onToggle, cor }) {
  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'11px 0'}}>
      <div style={{minWidth:0}}>
        <div style={{fontSize:13.5, color:T.ink1, fontWeight:600}}>{label}</div>
        {desc && <div style={{fontSize:11.5, color:T.ink3, marginTop:2}}>{desc}</div>}
      </div>
      <Toggle on={on} onClick={onToggle} cor={cor}/>
    </div>
  )
}

// ── Campo de texto ────────────────────────────────────────────────────────────
function CampoTexto({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{fontSize:12, color:T.ink3, display:'block', marginBottom:5}}>{label}</label>
      <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{
          width:'100%', background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:10,
          padding:'10px 12px', color:T.ink1, fontSize:13, outline:'none',
        }}/>
    </div>
  )
}

export default function PageFlowVitrine() {
  const [cfg,        setCfg]        = useState(null)
  const [cats,       setCats]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [salvando,   setSalvando]   = useState(false)
  const [erro,       setErro]       = useState('')
  const [ok,         setOk]         = useState(false)
  const [dirty,      setDirty]      = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true); setErro('')
    try {
      const [rc, rcat] = await Promise.all([
        fetch(`${API}/api/flow/config`).then(r=>r.json()),
        fetch(`${API}/api/flow/categorias-disponiveis`).then(r=>r.json()),
      ])
      setCfg(rc.config || {})
      setCats(rcat.categorias || [])
    } catch (e) { setErro('Falha ao carregar configuração: ' + e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function up(campo, valor) { setCfg(c => ({ ...c, [campo]: valor })); setDirty(true); setOk(false) }

  function toggleCat(nome) {
    setCats(cs => cs.map(c => c.nome===nome ? { ...c, visivel: !c.visivel } : c))
    setDirty(true); setOk(false)
  }
  function moverCat(idx, dir) {
    setCats(cs => {
      const arr = [...cs]
      const j = idx + dir
      if (j < 0 || j >= arr.length) return arr
      ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
      return arr
    })
    setDirty(true); setOk(false)
  }

  async function salvar() {
    setSalvando(true); setErro(''); setOk(false)
    try {
      // monta o array de categorias com ordem + visibilidade
      const categorias = cats.map((c, i) => ({ nome: c.nome, visivel: c.visivel, ordem: i }))
      const body = { ...cfg, categorias }
      const r = await fetch(`${API}/api/flow/config`, {
        method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro || 'Falha ao salvar')
      setCfg(d.config); setDirty(false); setOk(true)
      setTimeout(()=>setOk(false), 2500)
    } catch (e) { setErro(e.message) }
    finally { setSalvando(false) }
  }

  if (loading) return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:T.ink3, gap:10}}>
      <Loader2 size={20} className="spin"/> Carregando painel da vitrine…
    </div>
  )

  const visiveis = cats.filter(c=>c.visivel).length

  return (
    <div style={{maxWidth:760, margin:'0 auto', padding:'8px 4px 80px'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 1s linear infinite}`}</style>

      {/* Header */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22}}>
        <div style={{display:'flex', alignItems:'center', gap:13}}>
          <div style={{width:44, height:44, borderRadius:12, background:T.blueDim, border:`1px solid ${T.blueBor}`, display:'flex', alignItems:'center', justifyContent:'center'}}>
            <LayoutGrid size={22} color={T.blue}/>
          </div>
          <div>
            <div style={{fontSize:18, fontWeight:800, color:T.ink1}}>Vitrine no WhatsApp</div>
            <div style={{fontSize:12.5, color:T.ink3}}>Controle da vitrine interativa (Flow)</div>
          </div>
        </div>
        <button onClick={carregar} title="Recarregar"
          style={{background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:10, padding:'9px 11px', cursor:'pointer', color:T.ink3, display:'flex', alignItems:'center', gap:6}}>
          <RefreshCw size={14}/>
        </button>
      </div>

      {erro && (
        <div style={{display:'flex', alignItems:'center', gap:8, padding:'11px 14px', background:T.redDim, border:`1px solid ${T.redBor}`, borderRadius:11, marginBottom:16, color:T.red, fontSize:13}}>
          <AlertCircle size={16}/> {erro}
        </div>
      )}

      {/* Liga/desliga — destaque */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', background: cfg.ativo?T.greenDim:T.bg2, border:`1px solid ${cfg.ativo?T.greenBor:T.sep2}`, borderRadius:14, marginBottom:16}}>
        <div style={{display:'flex', alignItems:'center', gap:13}}>
          <Power size={20} color={cfg.ativo?T.green:T.ink4}/>
          <div>
            <div style={{fontSize:14.5, fontWeight:800, color:T.ink1}}>{cfg.ativo ? 'Vitrine ativa' : 'Vitrine desativada'}</div>
            <div style={{fontSize:12, color:T.ink3, marginTop:2}}>{cfg.ativo ? 'A Molise pode abrir a vitrine nas conversas' : 'A vitrine não será oferecida aos clientes'}</div>
          </div>
        </div>
        <Toggle on={cfg.ativo} onClick={()=>up('ativo', !cfg.ativo)} cor={T.green}/>
      </div>

      {/* Categorias */}
      <Secao icon={Tag} cor={T.amber} titulo="Categorias na vitrine" sub={`${visiveis} de ${cats.length} visíveis · arraste a ordem com as setas`}>
        {cats.length === 0 ? (
          <div style={{fontSize:13, color:T.ink3, padding:'8px 0'}}>
            Nenhuma categoria encontrada. Rode o sync do catálogo primeiro.
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:6, maxHeight:340, overflowY:'auto', paddingRight:4}}>
            {cats.map((c, i) => (
              <div key={c.nome} style={{
                display:'flex', alignItems:'center', gap:10, padding:'9px 11px',
                background: c.visivel ? T.bg1 : 'transparent',
                border:`1px solid ${c.visivel?T.sep2:T.sep}`, borderRadius:10,
                opacity: c.visivel ? 1 : 0.5,
              }}>
                <div style={{display:'flex', flexDirection:'column', gap:1}}>
                  <ChevronUp size={13} color={i===0?T.ink4:T.ink3} style={{cursor:i===0?'default':'pointer'}} onClick={()=>moverCat(i,-1)}/>
                  <ChevronDown size={13} color={i===cats.length-1?T.ink4:T.ink3} style={{cursor:i===cats.length-1?'default':'pointer'}} onClick={()=>moverCat(i,1)}/>
                </div>
                <div onClick={()=>toggleCat(c.nome)} style={{cursor:'pointer', width:20, height:20, borderRadius:5, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: c.visivel?T.green:'transparent', border:`1.5px solid ${c.visivel?T.green:T.ink4}`}}>
                  {c.visivel && <Check size={13} color="#000"/>}
                </div>
                <span style={{flex:1, fontSize:13, color:T.ink1, fontWeight:600}}>{c.nome}</span>
                <span style={{fontSize:11, color:T.ink3}}>{c.disponiveis} disp.</span>
                <span style={{fontSize:11, color:T.ink4}}>· {c.itens} total</span>
              </div>
            ))}
          </div>
        )}
      </Secao>

      {/* Textos */}
      <Secao icon={MessageSquare} cor={T.cyan} titulo="Textos da vitrine" sub="Como a Molise apresenta a vitrine ao cliente">
        <div style={{display:'flex', flexDirection:'column', gap:13}}>
          <CampoTexto label="Saudação do topo da vitrine" value={cfg.saudacao} onChange={v=>up('saudacao',v)} placeholder="Confira nossos produtos ✨"/>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <CampoTexto label="Botão adicionar produto" value={cfg.texto_botao_add} onChange={v=>up('texto_botao_add',v)} placeholder="Adicionar e continuar"/>
            <CampoTexto label="Botão enviar carrinho" value={cfg.texto_botao_carrinho} onChange={v=>up('texto_botao_carrinho',v)} placeholder="Enviar carrinho"/>
          </div>
        </div>
      </Secao>

      {/* Comportamento */}
      <Secao icon={Settings} cor={T.purple} titulo="Comportamento" sub="Regras de exibição e interação">
        <div style={{display:'flex', flexDirection:'column', divideY:1}}>
          <LinhaToggle label="Mostrar preço PIX" desc={`Exibe o valor com ${cfg.desconto_pix}% de desconto à vista`} on={cfg.mostrar_pix} onToggle={()=>up('mostrar_pix',!cfg.mostrar_pix)} cor={T.green}/>
          <Sep/>
          <LinhaToggle label="Adicionar vários produtos" desc="Cliente monta o carrinho antes de voltar à conversa" on={cfg.multi_add} onToggle={()=>up('multi_add',!cfg.multi_add)} cor={T.green}/>
          <Sep/>
          <LinhaToggle label='Botão "avise-me" sem estoque' desc="Produtos zerados ganham botão de notificação" on={cfg.botao_avise_me} onToggle={()=>up('botao_avise_me',!cfg.botao_avise_me)} cor={T.amber}/>
          <Sep/>
          <LinhaToggle label="Ocultar produtos sem estoque" desc="Se ligado, zerados não aparecem na vitrine" on={cfg.ocultar_sem_estoque} onToggle={()=>up('ocultar_sem_estoque',!cfg.ocultar_sem_estoque)} cor={T.red}/>
          <Sep/>
          <LinhaToggle label="Abertura automática pela Molise" desc="A Molise abre a vitrine ao detectar intenção de navegar" on={cfg.abertura_automatica} onToggle={()=>up('abertura_automatica',!cfg.abertura_automatica)} cor={T.blue}/>
        </div>

        {/* sliders numéricos */}
        <div style={{marginTop:16, paddingTop:14, borderTop:`1px solid ${T.sep}`, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
          <div>
            <label style={{fontSize:12, color:T.ink3, display:'block', marginBottom:6}}>Desconto PIX: <b style={{color:T.green}}>{cfg.desconto_pix}%</b></label>
            <input type="range" min={0} max={30} value={cfg.desconto_pix} onChange={e=>up('desconto_pix', parseInt(e.target.value))} style={{width:'100%'}}/>
          </div>
          <div>
            <label style={{fontSize:12, color:T.ink3, display:'block', marginBottom:6}}>Máx. produtos/categoria: <b style={{color:T.cyan}}>{cfg.max_produtos_categoria}</b></label>
            <input type="range" min={5} max={50} value={cfg.max_produtos_categoria} onChange={e=>up('max_produtos_categoria', parseInt(e.target.value))} style={{width:'100%'}}/>
          </div>
        </div>
      </Secao>

      {/* Nota sobre limites */}
      <div style={{display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', background:T.blueDim, border:`1px solid ${T.blueBor}`, borderRadius:11, marginTop:4}}>
        <Smartphone size={17} color={T.blue} style={{flexShrink:0, marginTop:1}}/>
        <span style={{fontSize:11.5, color:T.ink2, lineHeight:1.55}}>
          O <b>layout visual</b> das telas (posição das fotos, campos) é editado no Flow Builder da Meta — exige republicação. Aqui você controla <b>conteúdo, categorias e regras</b>, que valem em tempo real sem reaprovação.
        </span>
      </div>

      {/* Barra de salvar (fixa no fim do conteúdo) */}
      <div style={{position:'sticky', bottom:16, marginTop:24, display:'flex', justifyContent:'flex-end', gap:12, alignItems:'center'}}>
        {ok && <span style={{fontSize:13, color:T.green, fontWeight:700, display:'flex', alignItems:'center', gap:6}}><Check size={15}/> Salvo!</span>}
        {dirty && !ok && <span style={{fontSize:12.5, color:T.amber}}>Alterações não salvas</span>}
        <button onClick={salvar} disabled={salvando || !dirty}
          style={{
            display:'flex', alignItems:'center', gap:8, padding:'12px 22px', borderRadius:12, border:'none',
            background: dirty ? T.green : T.bg3, color: dirty ? '#000' : T.ink4,
            fontWeight:900, fontSize:13.5, cursor: dirty&&!salvando ? 'pointer' : 'default',
            boxShadow: dirty ? `0 8px 24px -10px ${T.green}99` : 'none',
          }}>
          {salvando ? <Loader2 size={15} className="spin"/> : <Save size={15}/>}
          {salvando ? 'Salvando…' : 'Salvar configuração'}
        </button>
      </div>
    </div>
  )
}

// ── Seção genérica (card com header) ──────────────────────────────────────────
function Secao({ icon:Ic, cor, titulo, sub, children }) {
  return (
    <div style={{background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:14, padding:'16px 18px', marginBottom:16}}>
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
        <div style={{width:32, height:32, borderRadius:9, background:`${cor}18`, border:`1px solid ${cor}40`, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <Ic size={16} color={cor}/>
        </div>
        <div>
          <div style={{fontSize:14, fontWeight:800, color:T.ink1}}>{titulo}</div>
          {sub && <div style={{fontSize:11.5, color:T.ink3, marginTop:1}}>{sub}</div>}
        </div>
      </div>
      {children}
    </div>
  )
}

function Sep() { return <div style={{height:1, background:T.sep}}/> }
