/**
 * PageRastreioConfig — NIVELMAX
 * Configuração de canais de rastreio · dark theme T system
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Truck, Store, Cloud, ShoppingCart, Shirt, ShoppingBag,
  RefreshCw, Check, AlertTriangle, Zap, Package, Radio,
  Trash2, CircleOff, PackageX, Clock, Activity, Shield,
  ChevronRight, X, Info, Settings, ToggleLeft, ToggleRight,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

// ── Sistema de cores Molise ────────────────────────────────────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#7b81a0', ink4:'#3a3f5c',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)', greenBor:'rgba(0,230,118,.25)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.08)', amberBor:'rgba(255,179,0,.25)',
  red:'#ff4757',  redDim:'rgba(255,71,87,.07)',   redBor:'rgba(255,71,87,.25)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.09)',purpleBor:'rgba(167,139,250,.25)',
  cyan:'#06b6d4', cyanDim:'rgba(6,182,212,.08)',   cyanBor:'rgba(6,182,212,.22)',
  sep:'rgba(255,255,255,.05)', sep2:'rgba(255,255,255,.08)',
}

// ── Ícones e metadados de canal ───────────────────────────────────────────────
const CANAL_META = {
  loja:         { Icon:Store,        cor:'#1D9E75', lbl:'Loja Própria',  mktp:false },
  nuvemshop:    { Icon:Cloud,        cor:'#4f46e5', lbl:'Nuvemshop',     mktp:false },
  mercadolivre: { Icon:ShoppingCart, cor:'#f5a623', lbl:'Mercado Livre', mktp:true  },
  shopee:       { Icon:ShoppingBag,  cor:'#ee4d2d', lbl:'Shopee',        mktp:true  },
  shein:        { Icon:Shirt,        cor:'#000000', lbl:'Shein',         mktp:true  },
  tiktokshop:   { Icon:Activity,     cor:'#ff0050', lbl:'TikTok Shop',   mktp:true  },
}

// ── Utilitário de tempo relativo ──────────────────────────────────────────────
function tempoRel(iso) {
  if (!iso) return null
  const d = Math.floor((Date.now()-new Date(iso))/60000)
  if (d < 1)   return 'agora'
  if (d < 60)  return `${d}min`
  if (d < 1440) return `${Math.floor(d/60)}h`
  return `${Math.floor(d/1440)}d`
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PageRastreioConfig() {
  const [canais,    setCanais]  = useState([])
  const [loading,   setLoading] = useState(true)
  const [salvando,  setSalv]    = useState(false)
  const [salvoOk,   setSalvoOk] = useState(false)
  const [limpando,  setLimp]    = useState('')
  const [confirmacao,setConf]   = useState(null)  // {rota, label, quantidade}
  const [msg,       setMsg]     = useState(null)   // {texto, ok}

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/dashboard/operacao/canais`)
      const d = await r.json()
      if (d.canais) setCanais(d.canais)
    } catch(e) {
      setMsg({ texto:`Erro ao carregar: ${e.message}`, ok:false })
    }
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const toggle = (id) =>
    setCanais(cs => cs.map(c => c.id===id ? {...c, ativo:!c.ativo} : c))

  const salvar = async () => {
    setSalv(true); setMsg(null)
    try {
      const payload = {}
      canais.forEach(c => { payload[c.id] = c.ativo })
      const r = await fetch(`${API}/api/dashboard/operacao/canais`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ canais: payload }),
      })
      if (r.ok) {
        setSalvoOk(true)
        setMsg({ texto:`Configuração salva — ${canais.filter(c=>c.ativo).length} canal(is) ativo(s).`, ok:true })
        setTimeout(() => setSalvoOk(false), 3000)
      }
    } catch(e) { setMsg({ texto:`Erro: ${e.message}`, ok:false }) }
    setSalv(false)
  }

  // Preview + confirmar limpeza
  const iniciarLimpeza = async (rota, label) => {
    setLimp(rota); setMsg(null)
    try {
      const r = await fetch(`${API}/api/dashboard/operacao/${rota}`)
      const d = await r.json()
      const qtd = d.seriam_encerrados ?? 0
      if (!qtd) {
        setMsg({ texto:`Nada a limpar em "${label}".`, ok:true })
        setLimp(''); return
      }
      setConf({ rota, label, quantidade:qtd })
    } catch(e) { setMsg({ texto:`Erro: ${e.message}`, ok:false }) }
    setLimp('')
  }

  const executarLimpeza = async () => {
    if (!confirmacao) return
    const { rota, label } = confirmacao
    setConf(null); setLimp(rota)
    try {
      const r = await fetch(`${API}/api/dashboard/operacao/${rota}`, { method:'POST' })
      const d = await r.json()
      setMsg({ texto:`✓ ${d.encerrados||0} pedido(s) encerrado(s) em "${label}".`, ok:true })
      await carregar()
    } catch(e) { setMsg({ texto:`Erro: ${e.message}`, ok:false }) }
    setLimp('')
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:T.bg0, padding:'28px 20px', fontFamily:'system-ui,sans-serif' }}>
      <style>{`
        @keyframes spin   { to { transform:rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rc-card { transition:transform .18s,box-shadow .18s; }
        .rc-card:hover { transform:translateY(-1px); }
        .rc-btn:hover  { opacity:.85; }
      `}</style>

      <div style={{ maxWidth:780, margin:'0 auto' }}>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
          marginBottom:28, animation:'fadeUp .4s ease' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div style={{ width:38, height:38, borderRadius:12,
                background:'linear-gradient(135deg,rgba(167,139,250,.25),rgba(167,139,250,.1))',
                border:`1px solid ${T.purpleBor}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`0 4px 20px rgba(167,139,250,.2)` }}>
                <Truck size={18} style={{ color:T.purple }} />
              </div>
              <div>
                <h1 style={{ fontSize:18, fontWeight:700, color:T.ink1,
                  margin:0, letterSpacing:'-.025em' }}>
                  Rastreio por Canal
                </h1>
                <span style={{ fontSize:10, color:T.ink4, fontWeight:500, letterSpacing:'.06em',
                  textTransform:'uppercase' }}>
                  Configuração de monitoramento
                </span>
              </div>
            </div>
            <p style={{ fontSize:12, color:T.ink3, margin:0, maxWidth:480, lineHeight:1.6 }}>
              Canais próprios (Loja, Nuvemshop) são monitorados ativamente via Bling + transportadora.
              Marketplaces têm rastreio próprio — você decide se o sistema também acompanha.
            </p>
          </div>
          <button onClick={carregar} disabled={loading} style={{
            display:'flex', alignItems:'center', gap:6, padding:'8px 13px', borderRadius:9,
            background:T.bg3, border:`1px solid ${T.sep2}`, color:T.ink3, cursor:'pointer',
            fontSize:11.5, fontWeight:600, flexShrink:0
          }}>
            <RefreshCw size={12} style={{ animation:loading?'spin 1s linear infinite':undefined }}/>
            Atualizar
          </button>
        </div>

        {/* ── STATS RÁPIDOS ──────────────────────────────────────────── */}
        {!loading && canais.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20,
            animation:'fadeUp .4s ease .05s both' }}>
            {[
              { lbl:'Canais ativos',    val:canais.filter(c=>c.ativo).length,    cor:T.green,  Icon:Check },
              { lbl:'Na fila rastreio', val:canais.reduce((a,c)=>a+(c.naFila||0),0), cor:T.amber, Icon:Package },
              { lbl:'Marketplaces off', val:canais.filter(c=>c.mktp&&!c.ativo).length, cor:T.cyan,  Icon:Shield },
            ].map(s => (
              <div key={s.lbl} style={{
                background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
                border:`1px solid ${T.sep2}`, borderRadius:13, padding:'13px 14px',
                display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:9, flexShrink:0,
                  background:`${s.cor}18`, border:`1px solid ${s.cor}30`,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <s.Icon size={14} style={{ color:s.cor }}/>
                </div>
                <div>
                  <div style={{ fontSize:22, fontWeight:800, color:T.ink1,
                    letterSpacing:'-.03em', lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontSize:10, color:T.ink4, marginTop:2 }}>{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CARDS DE CANAL ─────────────────────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20,
          animation:'fadeUp .4s ease .1s both' }}>
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
              gap:10, padding:'48px 0', color:T.ink4 }}>
              <RefreshCw size={18} style={{ color:T.purple, animation:'spin 1s linear infinite' }}/>
              <span style={{ fontSize:13 }}>Carregando configuração...</span>
            </div>
          ) : canais.map((c, idx) => {
            const meta   = CANAL_META[c.id] || { Icon:Truck, cor:T.ink3, lbl:c.nome, mktp:false }
            const Icon   = meta.Icon
            const ultimo = tempoRel(c.ultimoRastreio)
            const temFila= (c.naFila||0) > 0

            return (
              <div key={c.id} className="rc-card" style={{
                background: c.ativo
                  ? `linear-gradient(135deg,${T.bg2} 0%,${T.bg3} 100%)`
                  : T.bg1,
                border: c.ativo
                  ? `1px solid ${meta.cor}25`
                  : `1px solid ${T.sep}`,
                borderRadius:14,
                boxShadow: c.ativo
                  ? `0 8px 32px rgba(0,0,0,.3), 0 0 0 1px ${meta.cor}10 inset`
                  : '0 4px 16px rgba(0,0,0,.2)',
                overflow:'hidden',
                animation:`fadeUp .35s ease ${idx*.06}s both`
              }}>
                {/* Barra lateral colorida */}
                <div style={{ display:'flex' }}>
                  <div style={{ width:3, flexShrink:0,
                    background: c.ativo ? meta.cor : 'transparent',
                    borderRadius:'0 2px 2px 0' }}/>

                  <div style={{ flex:1, padding:'14px 16px',
                    display:'flex', alignItems:'center', gap:13 }}>

                    {/* Ícone do canal */}
                    <div style={{
                      width:44, height:44, borderRadius:13, flexShrink:0,
                      background: c.ativo ? `${meta.cor}22` : 'rgba(255,255,255,.04)',
                      border: `1.5px solid ${c.ativo?meta.cor+'45':'rgba(255,255,255,.06)'}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow: c.ativo ? `0 4px 16px ${meta.cor}25` : undefined,
                      transition:'all .3s'
                    }}>
                      <Icon size={20} style={{ color: c.ativo ? meta.cor : T.ink4 }}/>
                    </div>

                    {/* Texto */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                        <span style={{ fontSize:14, fontWeight:700, color: c.ativo ? T.ink1 : T.ink3,
                          letterSpacing:'-.02em' }}>
                          {meta.lbl}
                        </span>
                        {/* Badge marketplace */}
                        {meta.mktp && (
                          <span style={{ fontSize:9, padding:'1.5px 7px', borderRadius:99,
                            background:'rgba(255,179,0,.1)', color:T.amber,
                            border:`1px solid ${T.amberBor}`, fontWeight:700, letterSpacing:'.05em' }}>
                            MARKETPLACE
                          </span>
                        )}
                        {/* Badge canal próprio */}
                        {!meta.mktp && (
                          <span style={{ fontSize:9, padding:'1.5px 7px', borderRadius:99,
                            background:'rgba(0,230,118,.08)', color:T.green,
                            border:`1px solid ${T.greenBor}`, fontWeight:700, letterSpacing:'.05em' }}>
                            PRÓPRIO
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize:11, color:T.ink4, lineHeight:1.5 }}>{c.desc}</div>
                      {/* Info de fila + último rastreio */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6, flexWrap:'wrap' }}>
                        {temFila && (
                          <span style={{ fontSize:10, display:'flex', alignItems:'center', gap:4,
                            color:T.amber, fontWeight:600 }}>
                            <Package size={9}/>
                            {c.naFila} na fila
                          </span>
                        )}
                        {!temFila && c.ativo && (
                          <span style={{ fontSize:10, color:T.ink4 }}>
                            Fila vazia
                          </span>
                        )}
                        {ultimo && (
                          <span style={{ fontSize:10, display:'flex', alignItems:'center', gap:4, color:T.ink4 }}>
                            <Clock size={9}/>
                            último rastreio {ultimo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, flexShrink:0 }}>
                      <button onClick={() => toggle(c.id)}
                        aria-label={`${c.ativo?'Desativar':'Ativar'} ${meta.lbl}`}
                        style={{
                          position:'relative', width:44, height:24, borderRadius:99,
                          border:'none', cursor:'pointer', flexShrink:0,
                          background: c.ativo
                            ? `linear-gradient(90deg,${meta.cor},${meta.cor}cc)`
                            : 'rgba(255,255,255,.1)',
                          boxShadow: c.ativo ? `0 0 14px ${meta.cor}40` : undefined,
                          transition:'all .25s',
                        }}>
                        <span style={{
                          position:'absolute', width:18, height:18,
                          background:'#fff', borderRadius:'50%',
                          top:3, left: c.ativo ? 23 : 3,
                          transition:'left .2s cubic-bezier(.4,0,.2,1)',
                          boxShadow:'0 2px 6px rgba(0,0,0,.3)'
                        }}/>
                      </button>
                      <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.05em',
                        color: c.ativo ? meta.cor : T.ink4,
                        textTransform:'uppercase' }}>
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── BOTÃO SALVAR ───────────────────────────────────────────── */}
        {!loading && (
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28,
            animation:'fadeUp .4s ease .2s both' }}>
            <button onClick={salvar} disabled={salvando} className="rc-btn" style={{
              display:'flex', alignItems:'center', gap:8, padding:'11px 24px',
              borderRadius:12, border:'none', cursor:'pointer', fontSize:13, fontWeight:700,
              background: salvoOk
                ? `linear-gradient(135deg,${T.green},${T.green}cc)`
                : 'linear-gradient(135deg,#5b21b6,#9333ea)',
              color:'#fff',
              boxShadow: salvoOk
                ? `0 4px 20px rgba(0,230,118,.35)`
                : '0 4px 20px rgba(147,51,234,.35)',
              transition:'all .25s',
            }}>
              {salvando
                ? <><RefreshCw size={14} style={{ animation:'spin 1s linear infinite' }}/> Salvando...</>
                : salvoOk
                ? <><Check size={14}/> Salvo!</>
                : <><Settings size={14}/> Salvar configuração</>}
            </button>
            <span style={{ fontSize:11, color:T.ink4, lineHeight:1.5 }}>
              O rastreio job lê esta config a cada ciclo de 30 min.
            </span>
          </div>
        )}

        {/* ── MSG DE FEEDBACK ────────────────────────────────────────── */}
        {msg && (
          <div style={{
            marginBottom:20, padding:'11px 14px', borderRadius:11,
            background: msg.ok ? T.greenDim : T.redDim,
            border:`1px solid ${msg.ok ? T.greenBor : T.redBor}`,
            display:'flex', alignItems:'center', gap:9, fontSize:12,
            color: msg.ok ? T.green : T.red,
            animation:'fadeUp .25s ease'
          }}>
            {msg.ok ? <Check size={14}/> : <AlertTriangle size={14}/>}
            {msg.texto}
            <button onClick={()=>setMsg(null)} style={{ marginLeft:'auto', background:'none',
              border:'none', cursor:'pointer', color:'inherit', opacity:.6, padding:0 }}>
              <X size={13}/>
            </button>
          </div>
        )}

        {/* ── MANUTENÇÃO DA FILA ─────────────────────────────────────── */}
        <div style={{
          background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
          border:`1px solid ${T.sep2}`, borderRadius:16, overflow:'hidden',
          animation:'fadeUp .4s ease .25s both'
        }}>
          {/* Header da seção */}
          <div style={{ padding:'16px 18px', borderBottom:`1px solid ${T.sep}`,
            display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:9,
              background:'rgba(255,71,87,.12)', border:`1px solid ${T.redBor}`,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={14} style={{ color:T.red }}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.ink1 }}>Manutenção da Fila</div>
              <div style={{ fontSize:10, color:T.ink4 }}>Encerrar pedidos — mostra preview antes de executar</div>
            </div>
          </div>

          {/* Ações */}
          <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { rota:'limpar-desativados', Icon:CircleOff, label:'Encerrar canais desativados',
                desc:'Remove da fila pedidos de canais que você acabou de desativar.',
                cor:T.amber },
              { rota:'limpar-sem-codigo', Icon:PackageX, label:'Encerrar sem código de rastreio',
                desc:'Remove entradas do cache sem código válido (< 5 chars).',
                cor:T.ink3 },
              { rota:'limpar-marketplace', Icon:Trash2, label:'Encerrar todos os marketplaces',
                desc:'Remove Shopee, ML, Shein, TikTok da fila de monitoramento.',
                cor:T.red },
            ].map(a => (
              <button key={a.rota}
                onClick={() => iniciarLimpeza(a.rota, a.label)}
                disabled={!!limpando}
                style={{
                  display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                  borderRadius:11, border:`1px solid ${T.sep}`,
                  background:'rgba(255,255,255,.02)',
                  color:T.ink2, cursor:'pointer', textAlign:'left', width:'100%',
                  transition:'all .15s',
                }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.05)';e.currentTarget.style.borderColor=a.cor+'40'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.02)';e.currentTarget.style.borderColor=T.sep}}>
                <div style={{ width:32, height:32, borderRadius:9, flexShrink:0,
                  background:`${a.cor}18`, border:`1px solid ${a.cor}30`,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {limpando===a.rota
                    ? <RefreshCw size={13} style={{ color:a.cor, animation:'spin 1s linear infinite' }}/>
                    : <a.Icon size={13} style={{ color:a.cor }}/>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, fontWeight:600, color:T.ink1, marginBottom:2 }}>
                    {a.label}
                  </div>
                  <div style={{ fontSize:10.5, color:T.ink4 }}>{a.desc}</div>
                </div>
                <ChevronRight size={14} style={{ color:T.ink4, flexShrink:0 }}/>
              </button>
            ))}
          </div>

          <div style={{ padding:'0 18px 14px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:6, fontSize:10, color:T.ink4, lineHeight:1.5 }}>
              <Info size={11} style={{ flexShrink:0, marginTop:1 }}/>
              Encerrar = inserir marcador no log (não apaga dados). O pedido sai da fila mas o histórico fica.
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL DE CONFIRMAÇÃO ──────────────────────────────────────── */}
      {confirmacao && (
        <>
          <div onClick={()=>setConf(null)} style={{
            position:'fixed', inset:0, zIndex:60,
            background:'rgba(0,0,0,.7)', backdropFilter:'blur(4px)',
            animation:'fadeUp .2s ease'
          }}/>
          <div style={{
            position:'fixed', top:'50%', left:'50%', zIndex:61,
            transform:'translate(-50%,-50%)',
            width:'min(420px,90vw)',
            background:`linear-gradient(135deg,${T.bg2},${T.bg3})`,
            border:`1px solid ${T.sep2}`, borderRadius:18,
            overflow:'hidden',
            boxShadow:'0 32px 80px rgba(0,0,0,.8)',
            animation:'fadeUp .3s cubic-bezier(.2,.8,.2,1)'
          }}>
            {/* Header vermelho */}
            <div style={{ padding:'18px 20px',
              background:'linear-gradient(135deg,rgba(255,71,87,.15),rgba(255,71,87,.05))',
              borderBottom:`1px solid rgba(255,71,87,.2)`,
              display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:12,
                background:T.redDim, border:`1px solid ${T.redBor}`,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <AlertTriangle size={18} style={{ color:T.red }}/>
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.ink1 }}>Confirmar encerramento</div>
                <div style={{ fontSize:10.5, color:T.ink4 }}>{confirmacao.label}</div>
              </div>
            </div>

            {/* Corpo */}
            <div style={{ padding:'18px 20px' }}>
              <p style={{ fontSize:13, color:T.ink2, lineHeight:1.65, margin:0 }}>
                Serão encerrados{' '}
                <strong style={{ color:T.red, fontSize:16 }}>
                  {confirmacao.quantidade}
                </strong>{' '}
                pedido{confirmacao.quantidade !== 1 ? 's' : ''} da fila de rastreio.
              </p>
              <p style={{ fontSize:11, color:T.ink4, lineHeight:1.6, margin:'10px 0 0' }}>
                Esta ação <strong style={{ color:T.amber }}>não apaga</strong> os dados —
                insere um marcador que remove o pedido do monitoramento automático.
                É possível reprocessar manualmente depois.
              </p>
            </div>

            {/* Botões */}
            <div style={{ padding:'0 20px 18px', display:'flex', gap:10 }}>
              <button onClick={executarLimpeza} style={{
                flex:1, padding:'11px', borderRadius:11, border:'none', cursor:'pointer',
                background:`linear-gradient(135deg,${T.red},#cc1c2c)`,
                color:'#fff', fontSize:13, fontWeight:700,
                boxShadow:`0 4px 16px ${T.red}35`
              }}>
                Encerrar {confirmacao.quantidade} pedido{confirmacao.quantidade!==1?'s':''}
              </button>
              <button onClick={()=>setConf(null)} style={{
                padding:'11px 16px', borderRadius:11, cursor:'pointer',
                background:'rgba(255,255,255,.06)', border:`1px solid ${T.sep2}`,
                color:T.ink3, fontSize:13, fontWeight:600
              }}>
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
