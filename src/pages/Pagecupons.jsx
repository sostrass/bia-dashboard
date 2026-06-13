import { useState, useEffect, useCallback } from 'react'
import {
  Ticket, Plus, X, Percent, DollarSign, Truck, Store, Tag, Package,
  Calendar, Users, Hash, TrendingUp, Trash2, Power, Copy, Check,
  Info, Eye, BarChart3, Sparkles, ShieldCheck, AlertTriangle, Wallet,
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#6b7294', ink4:'#3a3f5c',
  sep:'rgba(255,255,255,0.05)', sep2:'rgba(255,255,255,0.08)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.08)', amberBor:'rgba(255,179,0,.25)',
  blue:'#4f8ef7', blueDim:'rgba(79,142,247,.08)', blueBor:'rgba(79,142,247,.25)',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)', greenBor:'rgba(0,230,118,.25)',
  red:'#ff4757', redDim:'rgba(255,71,87,.08)', redBor:'rgba(255,71,87,.25)',
  purple:'#a78bfa', purpleDim:'rgba(167,139,250,.08)', purpleBor:'rgba(167,139,250,.25)',
  cyan:'#22d3ee', cyanDim:'rgba(34,211,238,.08)', cyanBor:'rgba(34,211,238,.25)',
  gray:'rgba(255,255,255,.04)', grayBor:'rgba(255,255,255,.1)',
}
const TIPOS = {
  percentual:   { label:'Desconto %',   icon:Percent,    color:T.blue,   desc:'Percentual sobre os produtos do carrinho.' },
  valor_fixo:   { label:'Valor fixo',   icon:DollarSign, color:T.green,  desc:'Abate um valor em reais do total dos produtos.' },
  frete_gratis: { label:'Frete grátis', icon:Truck,      color:T.purple, desc:'Cobre o custo de envio — total, até um teto ou um percentual.' },
}
const fmtBRL = v => (parseFloat(v)||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})

function Bdg({ color, dim, bor, icon:Ic, children }) {
  return <span style={{display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:999, fontSize:11, fontWeight:700, color, background:dim, border:`1px solid ${bor||'transparent'}`}}>{Ic&&<Ic size={11}/>}{children}</span>
}
// Campo com rótulo + dica auto-explicativa
function Campo({ label, hint, children }) {
  return (
    <div>
      <label style={{fontSize:11, fontWeight:800, color:T.ink2, textTransform:'uppercase', letterSpacing:0.6, display:'block', marginBottom:5}}>{label}</label>
      {children}
      {hint && <div style={{fontSize:11, color:T.ink4, marginTop:4, lineHeight:1.4}}>{hint}</div>}
    </div>
  )
}
function Seg({ value, onChange, options }) {
  return (
    <div style={{display:'inline-flex', gap:4, background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:10, padding:4}}>
      {options.map(([v,lb,Ic])=>(
        <button key={v} onClick={()=>onChange(v)}
          style={{display:'flex', alignItems:'center', gap:6, background: value===v?T.blue:'transparent', color: value===v?'#fff':T.ink3,
            border:'none', borderRadius:7, padding:'7px 13px', cursor:'pointer', fontWeight:800, fontSize:12.5}}>
          {Ic&&<Ic size={13}/>}{lb}
        </button>
      ))}
    </div>
  )
}
const inp = {width:'100%', boxSizing:'border-box', background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:10, padding:'9px 12px', color:T.ink1, fontSize:13, outline:'none'}

// ═══ EDITOR DE CUPOM (criar/editar) com PREVIEW ao vivo ═══════════════════════
function Editor({ inicial, onSalvo, onClose }) {
  const [f, setF] = useState(inicial || {
    codigo:'', descricao:'', tipo:'percentual', valor:10,
    cobertura_tipo:'teto', cobertura_valor:30,
    pedido_minimo:120, limite_mes_cliente:1, limite_total:0, acumulativo:false,
    inicio:'', fim:'',
  })
  const [erro, setErro] = useState(''); const [saving, setSaving] = useState(false)
  const set = (k,v)=>setF(p=>({...p,[k]:v}))
  // Simulação para o preview
  const [simSub, setSimSub] = useState(150)
  const [simFrete, setSimFrete] = useState(80)

  function calcular() {
    const sub = parseFloat(simSub)||0, frt = parseFloat(simFrete)||0
    if (sub < (parseFloat(f.pedido_minimo)||0)) return { bloqueado:`Pedido abaixo do mínimo de R$ ${fmtBRL(f.pedido_minimo)}` }
    let dProd=0, dFrete=0
    if (f.tipo==='percentual') dProd = sub*(parseFloat(f.valor)/100)
    if (f.tipo==='valor_fixo') dProd = Math.min(parseFloat(f.valor), sub)
    if (f.tipo==='frete_gratis') {
      if (f.cobertura_tipo==='total') dFrete = frt
      if (f.cobertura_tipo==='teto') dFrete = Math.min(frt, parseFloat(f.cobertura_valor))
      if (f.cobertura_tipo==='percentual') dFrete = frt*(parseFloat(f.cobertura_valor)/100)
    }
    return { dProd, dFrete, freteFinal: Math.max(0, frt-dFrete), totalFinal: Math.max(0, sub-dProd) + Math.max(0, frt-dFrete) }
  }
  const sim = calcular()

  async function salvar() {
    if (!f.codigo.trim()) { setErro('Informe o código do cupom'); return }
    setSaving(true); setErro('')
    try {
      const url = inicial?.id ? `${BASE}/api/cupons/${inicial.id}` : `${BASE}/api/cupons`
      const r = await fetch(url, { method: inicial?.id?'PATCH':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(f) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.erro||'Falha ao salvar')
      onSalvo?.(); onClose()
    } catch(e) { setErro(e.message) } finally { setSaving(false) }
  }

  const tipoInfo = TIPOS[f.tipo]

  return (
    <div onClick={onClose} style={{position:'fixed', inset:0, zIndex:90, background:'rgba(4,5,10,.78)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:18}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'min(900px,100%)', maxHeight:'92vh', display:'flex', flexDirection:'column', background:`linear-gradient(180deg, ${T.bg1}, ${T.bg0})`, border:`1px solid ${T.sep2}`, borderRadius:20, overflow:'hidden', boxShadow:`0 40px 120px -24px rgba(0,0,0,.9), 0 0 80px -30px ${tipoInfo.color}55`}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 22px', borderBottom:`1px solid ${T.sep}`}}>
          <span style={{fontSize:17, fontWeight:900, color:T.ink1, display:'flex', alignItems:'center', gap:9}}><Ticket size={18} color={tipoInfo.color}/>{inicial?.id?'Editar cupom':'Novo cupom'}</span>
          <button onClick={onClose} style={{background:T.gray, border:`1px solid ${T.grayBor}`, color:T.ink2, borderRadius:9, width:30, height:30, cursor:'pointer'}}><X size={15}/></button>
        </div>

        <div style={{flex:1, overflowY:'auto', padding:22, display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:20, alignItems:'start'}}>
          {/* ── Configuração ── */}
          <div style={{display:'flex', flexDirection:'column', gap:18}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              <Campo label="Código do cupom" hint="O que o cliente digita. Vira maiúsculo automaticamente.">
                <input style={inp} value={f.codigo} onChange={e=>set('codigo',e.target.value.toUpperCase())} placeholder="FRETEGRATIS50"/>
              </Campo>
              <Campo label="Descrição interna" hint="Só para você identificar. Não aparece ao cliente.">
                <input style={inp} value={f.descricao} onChange={e=>set('descricao',e.target.value)} placeholder="Campanha junho"/>
              </Campo>
            </div>

            <Campo label="Tipo de desconto" hint={tipoInfo.desc}>
              <Seg value={f.tipo} onChange={v=>set('tipo',v)} options={[['percentual','Desconto %',Percent],['valor_fixo','Valor fixo',DollarSign],['frete_gratis','Frete grátis',Truck]]}/>
            </Campo>

            {f.tipo!=='frete_gratis' && (
              <Campo label={f.tipo==='percentual'?'Percentual de desconto':'Valor do desconto (R$)'}>
                <div style={{position:'relative'}}>
                  <input style={inp} type="number" value={f.valor} onChange={e=>set('valor',e.target.value)}/>
                  <span style={{position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:T.ink3, fontWeight:800}}>{f.tipo==='percentual'?'%':'R$'}</span>
                </div>
              </Campo>
            )}

            {f.tipo==='frete_gratis' && (
              <div style={{background:T.purpleDim, border:`1px solid ${T.purpleBor}`, borderRadius:13, padding:14}}>
                <Campo label="Cobertura do frete" hint="Quanto do custo de envio o cupom cobre. 'Teto' protege sua margem: acima do limite, o cliente paga a diferença.">
                  <Seg value={f.cobertura_tipo} onChange={v=>set('cobertura_tipo',v)} options={[['total','100%'],['teto','Até R$ (teto)'],['percentual','% do frete']]}/>
                </Campo>
                {f.cobertura_tipo!=='total' && (
                  <div style={{marginTop:12}}>
                    <Campo label={f.cobertura_tipo==='teto'?'Teto de cobertura (R$)':'Percentual do frete coberto'}
                      hint={f.cobertura_tipo==='teto'?'Ex.: teto R$30 — num frete de R$80, cobrimos R$30 e o cliente paga R$50.':'Ex.: 70% — num frete de R$80, cobrimos R$56.'}>
                      <input style={inp} type="number" value={f.cobertura_valor} onChange={e=>set('cobertura_valor',e.target.value)}/>
                    </Campo>
                  </div>
                )}
              </div>
            )}

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              <Campo label="Pedido mínimo (R$)" hint="O cupom só libera acima deste valor de produtos.">
                <input style={inp} type="number" value={f.pedido_minimo} onChange={e=>set('pedido_minimo',e.target.value)}/>
              </Campo>
              <Campo label="Usos por cliente / mês" hint="0 = ilimitado. Ex.: 1 = cada cliente usa 1x por mês.">
                <input style={inp} type="number" value={f.limite_mes_cliente} onChange={e=>set('limite_mes_cliente',e.target.value)}/>
              </Campo>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              <Campo label="Limite total de usos" hint="0 = ilimitado. É o 'estoque' do cupom.">
                <input style={inp} type="number" value={f.limite_total} onChange={e=>set('limite_total',e.target.value)}/>
              </Campo>
              <Campo label="Vigência" hint="Deixe em branco para sem prazo.">
                <div style={{display:'flex', gap:6}}>
                  <input style={inp} type="date" value={f.inicio?.slice(0,10)||''} onChange={e=>set('inicio',e.target.value)}/>
                  <input style={inp} type="date" value={f.fim?.slice(0,10)||''} onChange={e=>set('fim',e.target.value)}/>
                </div>
              </Campo>
            </div>

            <label style={{display:'flex', alignItems:'center', gap:9, cursor:'pointer', fontSize:13, color:T.ink2}}>
              <input type="checkbox" checked={f.acumulativo} onChange={e=>set('acumulativo',e.target.checked)}/>
              Permitir acumular com outras promoções
              <span style={{fontSize:11, color:T.ink4}}>(o time pediu padrão: NÃO acumulável)</span>
            </label>
          </div>

          {/* ── Preview ao vivo ── */}
          <div style={{position:'sticky', top:0, display:'flex', flexDirection:'column', gap:14}}>
            <div style={{background:T.bg2, border:`1px solid ${T.sep2}`, borderRadius:14, overflow:'hidden'}}>
              <div style={{padding:'10px 14px', borderBottom:`1px solid ${T.sep}`, fontSize:11, fontWeight:800, color:T.ink2, textTransform:'uppercase', letterSpacing:0.7, display:'flex', alignItems:'center', gap:7}}>
                <Eye size={13} color={T.cyan}/>Simulador
              </div>
              <div style={{padding:14, display:'flex', flexDirection:'column', gap:10}}>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                  <Campo label="Produtos R$"><input style={inp} type="number" value={simSub} onChange={e=>setSimSub(e.target.value)}/></Campo>
                  <Campo label="Frete R$"><input style={inp} type="number" value={simFrete} onChange={e=>setSimFrete(e.target.value)}/></Campo>
                </div>
                {sim.bloqueado ? (
                  <div style={{background:T.redDim, border:`1px solid ${T.redBor}`, borderRadius:10, padding:'9px 11px', fontSize:12, color:T.red, fontWeight:700, display:'flex', gap:7, alignItems:'center'}}><AlertTriangle size={13}/>{sim.bloqueado}</div>
                ) : (
                  <div style={{display:'flex', flexDirection:'column', gap:5, fontSize:12.5, color:T.ink2}}>
                    {sim.dProd>0 && <div style={{display:'flex', justifyContent:'space-between'}}><span>Desconto produtos</span><b style={{color:T.green}}>− R$ {fmtBRL(sim.dProd)}</b></div>}
                    {sim.dFrete>0 && <div style={{display:'flex', justifyContent:'space-between'}}><span>Cobertura frete</span><b style={{color:T.green}}>− R$ {fmtBRL(sim.dFrete)}</b></div>}
                    {f.tipo==='frete_gratis' && <div style={{display:'flex', justifyContent:'space-between'}}><span>Frete que o cliente paga</span><b style={{color: sim.freteFinal>0?T.amber:T.green}}>R$ {fmtBRL(sim.freteFinal)}</b></div>}
                    <div style={{display:'flex', justifyContent:'space-between', borderTop:`1px solid ${T.sep}`, paddingTop:6, marginTop:2}}><span style={{fontWeight:800, color:T.ink1}}>Total final</span><b style={{color:T.ink1, fontSize:14}}>R$ {fmtBRL(sim.totalFinal)}</b></div>
                  </div>
                )}
              </div>
            </div>

            {/* Como a Molise explica */}
            <div style={{background:`linear-gradient(135deg, ${T.green}0e, ${T.bg2})`, border:`1px solid ${T.greenBor}`, borderRadius:14, padding:14}}>
              <div style={{fontSize:11, fontWeight:800, color:T.green, textTransform:'uppercase', letterSpacing:0.7, display:'flex', alignItems:'center', gap:7, marginBottom:8}}><Sparkles size={13}/>Como a Molise explica</div>
              <div style={{background:'rgba(0,230,118,.06)', border:`1px solid ${T.greenBor}`, borderRadius:'12px 12px 12px 3px', padding:'10px 12px', fontSize:12.5, color:T.ink1, lineHeight:1.55, whiteSpace:'pre-wrap'}}>
                {`Cupom *${f.codigo||'SEUCUPOM'}* liberado! 🎉\n\n` +
                  (f.tipo==='percentual'?`*${f.valor}% de desconto* nos produtos`
                  :f.tipo==='valor_fixo'?`*R$ ${fmtBRL(f.valor)} de desconto*`
                  :f.cobertura_tipo==='total'?`*Frete grátis* — cobrimos 100% do envio`
                  :f.cobertura_tipo==='teto'?`*Frete grátis até R$ ${fmtBRL(f.cobertura_valor)}* — acima disso você paga só a diferença`
                  :`*${f.cobertura_valor}% de desconto no frete*`) +
                  (parseFloat(f.pedido_minimo)>0?`\nVálido acima de *R$ ${fmtBRL(f.pedido_minimo)}*`:'') +
                  (parseInt(f.limite_mes_cliente)>0?`\nLimite de *${f.limite_mes_cliente}x por mês*`:'') +
                  (!f.acumulativo?`\nNão acumulável com outras promoções`:'')}
              </div>
            </div>
          </div>
        </div>

        <div style={{display:'flex', justifyContent:'flex-end', gap:9, padding:'14px 22px', borderTop:`1px solid ${T.sep}`}}>
          {erro && <span style={{flex:1, fontSize:12.5, color:T.red, alignSelf:'center'}}>{erro}</span>}
          <button onClick={onClose} style={{background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink2, borderRadius:11, padding:'10px 18px', cursor:'pointer', fontWeight:700, fontSize:13}}>Cancelar</button>
          <button onClick={salvar} disabled={saving} style={{background:`linear-gradient(135deg, ${tipoInfo.color}33, ${tipoInfo.color}22)`, border:`1px solid ${tipoInfo.color}66`, color:tipoInfo.color, borderRadius:11, padding:'10px 22px', cursor:'pointer', fontWeight:900, fontSize:13, boxShadow:`0 0 24px -10px ${tipoInfo.color}88`}}>{saving?'Salvando…':inicial?.id?'Salvar alterações':'Criar cupom'}</button>
        </div>
      </div>
    </div>
  )
}

// ═══ PÁGINA ═══════════════════════════════════════════════════════════════════
export default function PageCupons() {
  const [cupons, setCupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState(null)   // null | {} | cupom
  const [copiado, setCopiado] = useState(null)

  const carregar = useCallback(() => {
    setLoading(true)
    fetch(`${BASE}/api/cupons`).then(r=>r.json()).then(d=>{ setCupons(d.cupons||[]); setLoading(false) }).catch(()=>setLoading(false))
  }, [])
  useEffect(()=>{ carregar() }, [carregar])

  async function toggle(c) {
    await fetch(`${BASE}/api/cupons/${c.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ativo: !c.ativo }) })
    carregar()
  }
  async function excluir(c) {
    if (!confirm(`Excluir o cupom ${c.codigo}? Os usos registrados serão removidos.`)) return
    await fetch(`${BASE}/api/cupons/${c.id}`, { method:'DELETE' }); carregar()
  }

  const ativos = cupons.filter(c=>c.ativo)
  const totalUsos = cupons.reduce((s,c)=>s+parseInt(c.usos_reais||0),0)

  return (
    <div style={{minHeight:'100vh', height:'100vh', overflowY:'auto', background:T.bg0, padding:'22px 26px', fontFamily:'Inter, system-ui, sans-serif', fontSize:13}}>
      <style>{`::-webkit-scrollbar{width:8px} ::-webkit-scrollbar-thumb{background:${T.bg4};border-radius:99px}`}</style>

      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14, marginBottom:18}}>
        <div>
          <div style={{fontSize:21, fontWeight:900, color:T.ink1, letterSpacing:-0.4, display:'flex', alignItems:'center', gap:10}}><Ticket size={21} color={T.amber}/>Cupons & Campanhas</div>
          <div style={{fontSize:12.5, color:T.ink3, marginTop:3}}>Descontos e frete grátis para vender pelo WhatsApp · cobertura de frete configurável · não acumulável</div>
        </div>
        <button onClick={()=>setEditor({})} style={{display:'flex', alignItems:'center', gap:7, background:`linear-gradient(135deg, ${T.amber}26, #f9731626)`, border:`1px solid ${T.amberBor}`, color:T.amber, borderRadius:11, padding:'9px 16px', cursor:'pointer', fontWeight:900, fontSize:12.5, boxShadow:`0 0 24px -10px ${T.amber}88`}}>
          <Plus size={14}/>Novo cupom
        </button>
      </div>

      {/* KPIs */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:12, marginBottom:18}}>
        {[
          { lb:'Cupons ativos', vl:ativos.length, ic:ShieldCheck, cl:T.green },
          { lb:'Total de cupons', vl:cupons.length, ic:Ticket, cl:T.blue },
          { lb:'Usos registrados', vl:totalUsos, ic:TrendingUp, cl:T.purple },
          { lb:'Frete grátis ativos', vl:ativos.filter(c=>c.tipo==='frete_gratis').length, ic:Truck, cl:T.cyan },
        ].map((k,i)=>(
          <div key={i} style={{position:'relative', overflow:'hidden', background:T.bg1, border:`1px solid ${T.sep2}`, borderRadius:15, padding:'14px 16px'}}>
            <div style={{position:'absolute', top:-26, right:-26, width:80, height:80, borderRadius:99, background:`radial-gradient(circle, ${k.cl}22, transparent 70%)`}}/>
            <div style={{display:'flex', alignItems:'center', gap:7, fontSize:10.5, fontWeight:800, color:T.ink3, textTransform:'uppercase', letterSpacing:0.7}}><k.ic size={13} color={k.cl}/>{k.lb}</div>
            <div style={{fontSize:26, fontWeight:900, color:T.ink1, marginTop:5}}>{k.vl}</div>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:12}}>
        {loading && [1,2,3].map(i=><div key={i} style={{height:130, borderRadius:16, background:T.bg2}}/>)}
        {!loading && cupons.length===0 && (
          <div style={{gridColumn:'1/-1', textAlign:'center', padding:'60px 0', color:T.ink3}}>
            <Ticket size={36} color={T.ink4} style={{marginBottom:10}}/>
            <div>Nenhum cupom ainda. Crie o primeiro para vender pelo WhatsApp.</div>
          </div>
        )}
        {!loading && cupons.map(c => {
          const ti = TIPOS[c.tipo] || TIPOS.percentual
          return (
            <div key={c.id} style={{position:'relative', overflow:'hidden', background:T.bg1, border:`1px solid ${c.ativo?ti.color+'44':T.sep2}`, borderRadius:16, padding:16, opacity:c.ativo?1:0.6, boxShadow: c.ativo?`0 0 30px -16px ${ti.color}88`:'none'}}>
              <div style={{position:'absolute', top:0, right:0, width:90, height:90, background:`radial-gradient(circle at top right, ${ti.color}1c, transparent 65%)`}}/>
              <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10}}>
                <div>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <span style={{fontSize:16, fontWeight:900, color:T.ink1, fontFamily:'monospace', letterSpacing:0.5}}>{c.codigo}</span>
                    <button onClick={()=>{ navigator.clipboard?.writeText(c.codigo); setCopiado(c.id); setTimeout(()=>setCopiado(null),1500) }}
                      style={{background:'none', border:'none', color:T.ink4, cursor:'pointer', display:'flex'}}>{copiado===c.id?<Check size={13} color={T.green}/>:<Copy size={13}/>}</button>
                  </div>
                  {c.descricao && <div style={{fontSize:11.5, color:T.ink3, marginTop:2}}>{c.descricao}</div>}
                </div>
                <Bdg color={ti.color} dim={ti.color+'14'} bor={ti.color+'44'} icon={ti.icon}>
                  {c.tipo==='percentual'?`${c.valor}%`:c.tipo==='valor_fixo'?`R$ ${fmtBRL(c.valor)}`:'Frete'}
                </Bdg>
              </div>
              <div style={{display:'flex', flexWrap:'wrap', gap:6, marginTop:12, fontSize:11, color:T.ink3}}>
                {c.tipo==='frete_gratis' && <span>{c.cobertura_tipo==='total'?'Cobre 100%':c.cobertura_tipo==='teto'?`Cobre até R$ ${fmtBRL(c.cobertura_valor)}`:`Cobre ${c.cobertura_valor}% do frete`}</span>}
                {c.pedido_minimo>0 && <span>· mín R$ {fmtBRL(c.pedido_minimo)}</span>}
                {c.limite_mes_cliente>0 && <span>· {c.limite_mes_cliente}x/mês</span>}
                {c.limite_total>0 && <span>· {c.usos_reais}/{c.limite_total} usados</span>}
                {!c.acumulativo && <span>· não acumulável</span>}
              </div>
              <div style={{display:'flex', gap:7, marginTop:14}}>
                <button onClick={()=>setEditor(c)} style={{flex:1, background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink2, borderRadius:9, padding:'7px', cursor:'pointer', fontWeight:700, fontSize:12}}>Editar</button>
                <button onClick={()=>toggle(c)} title={c.ativo?'Pausar':'Ativar'} style={{background: c.ativo?T.amberDim:T.greenDim, border:`1px solid ${c.ativo?T.amberBor:T.greenBor}`, color: c.ativo?T.amber:T.green, borderRadius:9, padding:'7px 11px', cursor:'pointer', fontWeight:700, fontSize:12, display:'flex', alignItems:'center', gap:5}}><Power size={12}/>{c.ativo?'Pausar':'Ativar'}</button>
                <button onClick={()=>excluir(c)} style={{background:T.redDim, border:`1px solid ${T.redBor}`, color:T.red, borderRadius:9, padding:'7px 10px', cursor:'pointer', display:'flex'}}><Trash2 size={13}/></button>
              </div>
            </div>
          )
        })}
      </div>

      {editor && <Editor inicial={editor.id?editor:null} onSalvo={carregar} onClose={()=>setEditor(null)}/>}
    </div>
  )
}
