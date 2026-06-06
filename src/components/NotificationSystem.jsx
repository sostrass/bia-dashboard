import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'
import {
  AlertTriangle, CheckCircle, Info, X, Bell,
  Zap, Database, AlertCircle, MessageSquare,
  Monitor, ExternalLink, ChevronRight, Activity,
  Radio, Shield,
} from 'lucide-react'

// ── T system ──────────────────────────────────────────────────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#7b81a0', ink4:'#3a3f5c',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)', greenBor:'rgba(0,230,118,.25)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.09)', amberBor:'rgba(255,179,0,.28)',
  red:'#ff4757',  redDim:'rgba(255,71,87,.09)',   redBor:'rgba(255,71,87,.3)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.09)',purpleBor:'rgba(167,139,250,.25)',
  cyan:'#06b6d4', cyanDim:'rgba(6,182,212,.08)',   cyanBor:'rgba(6,182,212,.22)',
  sep:'rgba(255,255,255,.05)', sep2:'rgba(255,255,255,.08)',
  gray:'rgba(255,255,255,.04)',
}

// ── Tipos de notificação ───────────────────────────────────────────────────────
const TIPO_META = {
  sucesso: { cor:T.green,  dim:T.greenDim,  bor:T.greenBor,  icon:CheckCircle },
  aviso:   { cor:T.amber,  dim:T.amberDim,  bor:T.amberBor,  icon:AlertTriangle },
  critico: { cor:T.red,    dim:T.redDim,    bor:T.redBor,    icon:AlertCircle },
  info:    { cor:T.cyan,   dim:T.cyanDim,   bor:T.cyanBor,   icon:Info },
  sistema: { cor:T.purple, dim:T.purpleDim, bor:T.purpleBor, icon:Zap },
}

// ── Context ───────────────────────────────────────────────────────────────────
export const NotifCtx = createContext({ notifs:[], add:()=>{}, remove:()=>{} })
export const useNotif = () => useContext(NotifCtx)

export function NotifProvider({ children }) {
  const [notifs, setNotifs] = useState([])

  const remove = useCallback((id) => {
    setNotifs(prev => prev.filter(n => n.id !== id))
  }, [])

  const add = useCallback((notif) => {
    const id   = Date.now() + Math.random()
    const item = { id, timestamp:new Date(), ...notif }
    setNotifs(prev => [item, ...prev].slice(0, 20))
    if (notif.tipo !== 'critico' && notif.autoClose !== false) {
      setTimeout(() => remove(id), notif.duracao || 6000)
    }
    return id
  }, [remove])

  const clear = useCallback(() => setNotifs([]), [])

  return (
    <NotifCtx.Provider value={{ notifs, add, remove, clear }}>
      {children}
    </NotifCtx.Provider>
  )
}

// ── Monitor de saúde — verifica Bling, Meta API e disparos ────────────────────
export function SystemHealthMonitor({ api }) {
  const { add } = useNotif()
  const alertadoRef = useRef(new Set())

  const verificar = useCallback(async () => {
    const agora = new Date()
    try {
      // ── 1. Bling auth ────────────────────────────────────────────────────
      const r = await fetch(`${api}/api/ia/config`)
      if (r.ok) {
        const d   = await r.json()
        const cfg = d.config || {}

        const refreshExp = cfg.bling_refresh_expires_at
        if (refreshExp) {
          const dias = Math.floor((new Date(refreshExp) - agora) / 86400000)
          if (dias <= 5 && dias > 0 && !alertadoRef.current.has(`bling_refresh_${dias}`)) {
            alertadoRef.current.add(`bling_refresh_${dias}`)
            add({
              tipo:     dias <= 2 ? 'critico' : 'aviso',
              titulo:   'Autenticação Bling expirando',
              mensagem: `Token expira em ${dias} dia${dias>1?'s':''}. Reautorize antes que o sistema pare.`,
              acao:     { label:'Reautorizar agora', url:`${api}/bling/auth` },
              icone:    'bling', autoClose:false,
            })
          }
        }

        const accessExp = cfg.bling_expires_at
        if (accessExp) {
          const expirou = new Date(accessExp) < agora
          const key = 'bling_access_expired'
          if (expirou && !alertadoRef.current.has(key)) {
            alertadoRef.current.add(key)
            add({ tipo:'critico', titulo:'Bling desconectado',
              mensagem:'Token de acesso expirado. Reintegração necessária.',
              acao:{ label:'Reconectar', url:`${api}/bling/auth` },
              icone:'bling', autoClose:false })
          } else if (!expirou) { alertadoRef.current.delete(key) }
        }

        const ultimoSync = cfg.catalogo_ultimo_sync
        if (ultimoSync && (agora - new Date(ultimoSync)) / 3600000 > 25
            && !alertadoRef.current.has('catalogo_desatualizado')) {
          alertadoRef.current.add('catalogo_desatualizado')
          add({ tipo:'info', titulo:'Catálogo desatualizado',
            mensagem:`Última sync há ${Math.floor((agora-new Date(ultimoSync))/3600000)}h.`,
            acao:{ label:'Sincronizar', handler:async()=>{ await fetch(`${api}/bling/sync-catalogo`,{method:'POST'}) }},
            icone:'catalogo' })
        }
      }

      // ── 2. Monitoramento avançado — anomalias e health score ────────────
      const rm = await fetch(`${api}/api/dashboard/monitoramento`, { signal:AbortSignal.timeout(6000) })
      if (rm.ok) {
        const mon = await rm.json()

        // Anomalias detectadas
        if (mon.anomalias?.length && !alertadoRef.current.has('anomalia_detectada')) {
          alertadoRef.current.add('anomalia_detectada')
          setTimeout(() => alertadoRef.current.delete('anomalia_detectada'), 20*60*1000)
          const a = mon.anomalias[0]
          add({
            tipo:     'aviso',
            titulo:   `Anomalia: ${a.tipo === 'queda' ? 'Queda' : 'Pico'} em ${a.gatilho}`,
            mensagem: `${Math.abs(a.variacaoPct)}% ${a.tipo==='queda'?'abaixo':'acima'} da média nas últimas 4h`,
            icone:    'ia', duracao:10000,
          })
        }

        // Health Score crítico
        const hs = mon.health?.score
        if (hs !== null && hs < 40 && !alertadoRef.current.has('health_critico')) {
          alertadoRef.current.add('health_critico')
          setTimeout(() => alertadoRef.current.delete('health_critico'), 30*60*1000)
          add({
            tipo:     'critico',
            titulo:   'Health Score crítico',
            mensagem: `Score ${hs}/100 — risco de suspensão da conta WhatsApp Business.`,
            icone:    'whatsapp', autoClose:false,
          })
        }

        // Templates rejeitados em cascata
        const rejeitados = parseInt(mon.funilMeta?.rejeitados||0)
        if (rejeitados >= 3 && !alertadoRef.current.has('templates_rejeitados')) {
          alertadoRef.current.add('templates_rejeitados')
          add({
            tipo:     'aviso',
            titulo:   `${rejeitados} templates rejeitados`,
            mensagem: 'Vários templates foram rejeitados pela Meta. Revise o conteúdo.',
            acao:     { label:'Ver gatilhos', handler:()=>{} },
            icone:    'ia', duracao:12000,
          })
        }

        // Cobertura baixa
        const cob = mon.cobertura?.coberturaRate
        if (cob !== null && cob < 50 && !alertadoRef.current.has('cobertura_baixa')) {
          alertadoRef.current.add('cobertura_baixa')
          setTimeout(() => alertadoRef.current.delete('cobertura_baixa'), 60*60*1000)
          add({
            tipo:     'info',
            titulo:   `Cobertura de ${cob}%`,
            mensagem: `${mon.cobertura?.semNenhum||0} pedidos rastreados sem nenhuma notificação WhatsApp.`,
            icone:    'catalogo', duracao:8000,
          })
        }
      }
    } catch {}
  }, [api, add])

  useEffect(() => {
    verificar()
    const i = setInterval(verificar, 5 * 60 * 1000)
    return () => clearInterval(i)
  }, [verificar])

  return null
}

// ── Toast individual ───────────────────────────────────────────────────────────
function Toast({ notif, onClose }) {
  const [saindo, setSaindo]       = useState(false)
  const [progresso, setProgresso] = useState(100)
  const duracao = notif.duracao || 6000

  useEffect(() => {
    if (notif.tipo === 'critico' || notif.autoClose === false) return
    const t0 = Date.now()
    const iv = setInterval(() => {
      const p = Math.max(0, 100 - ((Date.now()-t0)/duracao)*100)
      setProgresso(p)
      if (p <= 0) clearInterval(iv)
    }, 50)
    return () => clearInterval(iv)
  }, [])

  const fechar = () => { setSaindo(true); setTimeout(onClose, 280) }
  const meta = TIPO_META[notif.tipo] || TIPO_META.info
  const Ic   = meta.icon

  const ICONES_MAP = {
    bling:    <Monitor    size={14} style={{ color:meta.cor }}/>,
    catalogo: <Database   size={14} style={{ color:meta.cor }}/>,
    ia:       <Zap        size={14} style={{ color:meta.cor }}/>,
    whatsapp: <MessageSquare size={14} style={{ color:meta.cor }}/>,
  }

  return (
    <div style={{
      position:'relative', overflow:'hidden', borderRadius:14,
      background:`linear-gradient(135deg,${meta.dim},${T.bg2})`,
      border:`1px solid ${meta.bor}`,
      boxShadow:`0 8px 32px rgba(0,0,0,.4), 0 0 0 1px ${meta.cor}08 inset`,
      maxWidth:360, backdropFilter:'blur(8px)',
      opacity: saindo ? 0 : 1,
      transform: saindo ? 'translateX(16px)' : 'translateX(0)',
      transition:'opacity .28s ease, transform .28s ease',
      animation:'notif-in .25s cubic-bezier(.2,.8,.2,1)',
    }}>
      {/* Barra de progresso */}
      {notif.tipo !== 'critico' && notif.autoClose !== false && (
        <div style={{ position:'absolute',top:0,left:0,height:2,
          background:`linear-gradient(90deg,${meta.cor},${meta.cor}80)`,
          width:`${progresso}%`, transition:'width .05s linear',
          boxShadow:`0 0 6px ${meta.cor}` }}/>
      )}

      <div style={{ display:'flex',alignItems:'flex-start',gap:12,padding:'14px 14px 14px 14px' }}>
        {/* Ícone */}
        <div style={{ width:34,height:34,borderRadius:10,flexShrink:0,
          background:`${meta.cor}18`,border:`1px solid ${meta.bor}`,
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:`0 3px 10px ${meta.cor}20` }}>
          {notif.icone && ICONES_MAP[notif.icone] ? ICONES_MAP[notif.icone] : <Ic size={15} style={{ color:meta.cor }}/>}
        </div>

        {/* Conteúdo */}
        <div style={{ flex:1,minWidth:0 }}>
          <p style={{ fontSize:13,fontWeight:700,color:T.ink1,margin:0,lineHeight:1.3,marginBottom:3 }}>
            {notif.titulo}
          </p>
          <p style={{ fontSize:11.5,color:T.ink3,margin:0,lineHeight:1.55 }}>
            {notif.mensagem}
          </p>
          {notif.acao && (
            <button onClick={()=>{ notif.acao.url?window.open(notif.acao.url,'_blank'):notif.acao.handler?.(); fechar() }}
              style={{ display:'flex',alignItems:'center',gap:4,marginTop:7,fontSize:11,
                fontWeight:700,color:meta.cor,background:'none',border:'none',cursor:'pointer',
                padding:0,transition:'gap .12s' }}
              onMouseEnter={e=>e.currentTarget.style.gap='7px'}
              onMouseLeave={e=>e.currentTarget.style.gap='4px'}>
              {notif.acao.label}
              <ChevronRight size={11}/>
            </button>
          )}
        </div>

        {/* Fechar */}
        <button onClick={fechar}
          style={{ padding:4,borderRadius:7,flexShrink:0,border:'none',cursor:'pointer',
            background:T.gray,color:T.ink4,display:'flex',
            transition:'background .12s' }}
          onMouseEnter={e=>e.currentTarget.style.background=T.sep2}
          onMouseLeave={e=>e.currentTarget.style.background=T.gray}>
          <X size={12}/>
        </button>
      </div>
    </div>
  )
}

// ── Container de toasts ────────────────────────────────────────────────────────
export function ToastContainer() {
  const { notifs, remove } = useNotif()
  const criticos = notifs.filter(n => n.tipo === 'critico')

  return (
    <>
      <style>{`
        @keyframes notif-in { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      {/* Banner crítico no topo */}
      {criticos.length > 0 && (
        <div style={{ position:'fixed',top:0,left:0,right:0,zIndex:9999 }}>
          {criticos.map(n => (
            <div key={n.id} style={{ display:'flex',alignItems:'center',gap:10,
              padding:'10px 16px',
              background:`linear-gradient(90deg,rgba(255,71,87,.95),rgba(200,30,50,.95))`,
              backdropFilter:'blur(8px)',
              borderBottom:`1px solid ${T.redBor}` }}>
              <AlertCircle size={14} style={{ color:'#fff',flexShrink:0 }}/>
              <p style={{ flex:1,fontSize:12.5,fontWeight:600,color:'#fff',margin:0 }}>
                {n.titulo} — {n.mensagem}
              </p>
              {n.acao && (
                <button onClick={()=>{ if(n.acao.url) window.open(n.acao.url,'_blank') }}
                  style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 12px',
                    borderRadius:8,border:'1px solid rgba(255,255,255,.4)',
                    background:'rgba(255,255,255,.1)',color:'#fff',cursor:'pointer',
                    fontSize:11.5,fontWeight:600,flexShrink:0,
                    transition:'background .12s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.2)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}>
                  {n.acao.label} <ExternalLink size={10}/>
                </button>
              )}
              <button onClick={()=>remove(n.id)}
                style={{ padding:5,borderRadius:6,border:'none',cursor:'pointer',
                  background:'rgba(255,255,255,.1)',color:'rgba(255,255,255,.8)',display:'flex',
                  transition:'background .12s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.2)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}>
                <X size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Toasts */}
      <div style={{ position:'fixed',top:16,right:16,zIndex:9998,
        display:'flex',flexDirection:'column',gap:8,maxWidth:360 }}>
        {notifs.filter(n=>n.tipo!=='critico').map(n=>(
          <Toast key={n.id} notif={n} onClose={()=>remove(n.id)}/>
        ))}
      </div>
    </>
  )
}

// ── Sino de notificações ──────────────────────────────────────────────────────
export function NotifBell() {
  const { notifs, remove, clear } = useNotif()
  const [aberto, setAberto] = useState(false)
  const total   = notifs.length
  const critico = notifs.some(n=>n.tipo==='critico')
  const aviso   = notifs.some(n=>n.tipo==='aviso')
  const corBadge= critico?T.red:aviso?T.amber:T.green

  return (
    <div style={{ position:'relative' }}>
      <button onClick={()=>setAberto(v=>!v)}
        style={{ position:'relative',width:32,height:32,borderRadius:9,border:'none',cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
          background:aberto?T.purpleDim:'transparent',
          color:aberto?T.purple:T.ink3,
          transition:'all .15s' }}
        onMouseEnter={e=>{ if(!aberto){ e.currentTarget.style.background=T.gray; e.currentTarget.style.color=T.ink1 }}}
        onMouseLeave={e=>{ if(!aberto){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=T.ink3 }}}>
        <Bell size={15} strokeWidth={aberto?2.5:1.8}/>
        {total > 0 && (
          <span style={{ position:'absolute',top:-2,right:-2,minWidth:16,height:16,
            borderRadius:99,background:corBadge,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:9,fontWeight:700,color:'#000',padding:'0 3px',
            boxShadow:`0 0 8px ${corBadge}60`,
            animation:critico?'notif-pulse 1.5s ease-in-out infinite':undefined }}>
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {aberto && (
        <>
          <div style={{ position:'fixed',inset:0,zIndex:400 }} onClick={()=>setAberto(false)}/>
          <div style={{
            position:'absolute',bottom:38,left:0,zIndex:401,width:300,
            borderRadius:16,overflow:'hidden',
            background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
            border:`1px solid ${T.sep2}`,
            boxShadow:`0 20px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.05) inset`,
            animation:'notif-drop .2s cubic-bezier(.2,.8,.2,1)',
          }}>
            <style>{`
              @keyframes notif-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
              @keyframes notif-drop  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
            `}</style>

            {/* Header */}
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'12px 14px',borderBottom:`1px solid ${T.sep}`,
              background:`linear-gradient(90deg,${T.bg3},${T.bg2})` }}>
              <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                <Bell size={13} style={{ color:T.ink3 }}/>
                <span style={{ fontSize:12.5,fontWeight:700,color:T.ink1 }}>Notificações</span>
                {total>0&&(
                  <span style={{ padding:'1px 7px',borderRadius:99,fontSize:9,fontWeight:700,
                    background:corBadge,color:'#000' }}>{total}</span>
                )}
              </div>
              {total>0&&(
                <button onClick={clear}
                  style={{ fontSize:10,color:T.ink4,background:'none',border:'none',cursor:'pointer' }}>
                  Limpar todas
                </button>
              )}
            </div>

            {/* Lista */}
            <div style={{ maxHeight:340,overflowY:'auto' }}>
              {total === 0 ? (
                <div style={{ display:'flex',flexDirection:'column',alignItems:'center',padding:'32px 16px',gap:8 }}>
                  <div style={{ width:40,height:40,borderRadius:12,
                    background:T.greenDim,border:`1px solid ${T.greenBor}`,
                    display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <CheckCircle size={18} style={{ color:T.green }}/>
                  </div>
                  <p style={{ fontSize:12,color:T.ink4,margin:0 }}>Tudo funcionando</p>
                </div>
              ) : (
                <div style={{ padding:'8px' }}>
                  {notifs.map(n => {
                    const m  = TIPO_META[n.tipo]||TIPO_META.info
                    const Ic = m.icon
                    const mins = Math.floor((new Date()-n.timestamp)/60000)
                    const tempo = mins<1?'agora':mins<60?`${mins}min`:`${Math.floor(mins/60)}h`
                    return (
                      <div key={n.id}
                        style={{ display:'flex',alignItems:'flex-start',gap:9,padding:'10px',
                          borderRadius:10,marginBottom:4,
                          background:T.gray,border:`0.5px solid ${m.cor}20` }}>
                        <Ic size={13} style={{ color:m.cor,flexShrink:0,marginTop:2 }}/>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ display:'flex',justifyContent:'space-between',gap:6,marginBottom:2 }}>
                            <p style={{ fontSize:11.5,fontWeight:700,color:T.ink1,margin:0,
                              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                              {n.titulo}
                            </p>
                            <span style={{ fontSize:9.5,color:T.ink4,flexShrink:0 }}>{tempo}</span>
                          </div>
                          <p style={{ fontSize:10.5,color:T.ink3,margin:0,lineHeight:1.5 }}>
                            {n.mensagem}
                          </p>
                          {n.acao&&(
                            <button onClick={()=>{ n.acao.url?window.open(n.acao.url,'_blank'):n.acao.handler?.() }}
                              style={{ fontSize:10.5,fontWeight:700,color:m.cor,
                                background:'none',border:'none',cursor:'pointer',padding:0,marginTop:4 }}>
                              {n.acao.label} →
                            </button>
                          )}
                        </div>
                        <button onClick={()=>remove(n.id)}
                          style={{ background:'none',border:'none',cursor:'pointer',
                            color:T.ink4,padding:2,display:'flex',flexShrink:0 }}>
                          <X size={11}/>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Status footer */}
            <div style={{ padding:'10px 14px',borderTop:`1px solid ${T.sep}`,
              background:`linear-gradient(90deg,${T.bg3},${T.bg2})` }}>
              <p style={{ fontSize:9,textTransform:'uppercase',letterSpacing:'.1em',
                color:T.ink4,margin:'0 0 8px' }}>Status do sistema</p>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:4 }}>
                {[
                  { n:'Gemini AI', ok:true },
                  { n:'WhatsApp',  ok:true },
                  { n:'Nuvemshop', ok:true },
                  { n:'Bling ERP', ok:!notifs.some(n=>n.icone==='bling'&&n.tipo==='critico') },
                ].map(s => (
                  <div key={s.n} style={{ display:'flex',alignItems:'center',gap:6 }}>
                    <div style={{ width:6,height:6,borderRadius:'50%',flexShrink:0,
                      background:s.ok?T.green:T.red,
                      boxShadow:s.ok?`0 0 6px ${T.green}`:undefined }}/>
                    <span style={{ fontSize:10.5,color:T.ink3 }}>{s.n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
