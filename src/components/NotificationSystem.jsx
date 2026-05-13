import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'
import {
  AlertTriangle, CheckCircle, Info, X, Bell, RefreshCw,
  Zap, Database, Wifi, WifiOff, ExternalLink, ChevronRight,
  Clock, Shield, AlertCircle
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Context global de notificações ───────────────────────────────────────────
export const NotifCtx = createContext({ notifs:[], add:()=>{}, remove:()=>{} })
export const useNotif = () => useContext(NotifCtx)

export function NotifProvider({ children }) {
  const [notifs, setNotifs] = useState([])

  const add = useCallback((notif) => {
    const id = Date.now() + Math.random()
    const item = { id, timestamp: new Date(), ...notif }
    setNotifs(prev => [item, ...prev].slice(0, 20)) // máx 20
    // Auto-remove para tipos não críticos
    if (notif.tipo !== 'critico' && notif.autoClose !== false) {
      setTimeout(() => remove(id), notif.duracao || 6000)
    }
    return id
  }, [])

  const remove = useCallback((id) => {
    setNotifs(prev => prev.filter(n => n.id !== id))
  }, [])

  const clear = useCallback(() => setNotifs([]), [])

  return (
    <NotifCtx.Provider value={{ notifs, add, remove, clear }}>
      {children}
    </NotifCtx.Provider>
  )
}

// ── Monitor de saúde do sistema ───────────────────────────────────────────────
export function SystemHealthMonitor({ api }) {
  const { add } = useNotif()
  const alertadoRef = useRef(new Set())

  const verificar = useCallback(async () => {
    try {
      const r = await fetch(`${api}/api/ia/config`)
      if (!r.ok) return
      const d = await r.json()
      const cfg = d.config || {}

      const agora = new Date()

      // ── Verifica refresh_token do Bling ──────────────────────────────────
      const refreshExp = cfg.bling_refresh_expires_at
      if (refreshExp) {
        const dias = Math.floor((new Date(refreshExp) - agora) / 86400000)
        if (dias <= 5 && dias > 0 && !alertadoRef.current.has(`bling_refresh_${dias}`)) {
          alertadoRef.current.add(`bling_refresh_${dias}`)
          add({
            tipo:     dias <= 2 ? 'critico' : 'aviso',
            titulo:   'Autenticação Bling expirando',
            mensagem: `O token de autenticação do Bling expira em ${dias} dia${dias>1?'s':''}. Reautorize antes que o sistema pare.`,
            acao:     { label:'Reautorizar agora', url:`${api}/bling/auth` },
            icone:    'bling',
            autoClose: false,
          })
        }
      }

      // ── Verifica access_token expirado ───────────────────────────────────
      const accessExp = cfg.bling_expires_at
      if (accessExp) {
        const expirou = new Date(accessExp) < agora
        if (expirou && !alertadoRef.current.has('bling_access_expired')) {
          alertadoRef.current.add('bling_access_expired')
          add({
            tipo:     'critico',
            titulo:   'Bling desconectado',
            mensagem: 'Token de acesso expirado. Algumas funções estão indisponíveis.',
            acao:     { label:'Reconectar', url:`${api}/bling/auth` },
            icone:    'bling',
            autoClose: false,
          })
        } else if (!expirou && alertadoRef.current.has('bling_access_expired')) {
          alertadoRef.current.delete('bling_access_expired')
        }
      }

      // ── Verifica sync do catálogo ────────────────────────────────────────
      const ultimoSync = cfg.catalogo_ultimo_sync
      if (ultimoSync) {
        const horasDesdeSync = (agora - new Date(ultimoSync)) / 3600000
        if (horasDesdeSync > 25 && !alertadoRef.current.has('catalogo_desatualizado')) {
          alertadoRef.current.add('catalogo_desatualizado')
          add({
            tipo:     'info',
            titulo:   'Catálogo desatualizado',
            mensagem: `Última sincronização há ${Math.floor(horasDesdeSync)}h. Produtos podem estar desatualizados.`,
            acao:     { label:'Sincronizar agora', handler: async () => {
              await fetch(`${api}/bling/sync-catalogo`, { method:'POST' })
            }},
            icone:    'catalogo',
          })
        }
      }

    } catch {}
  }, [api, add])

  useEffect(() => {
    verificar()
    const i = setInterval(verificar, 5 * 60 * 1000) // a cada 5 min
    return () => clearInterval(i)
  }, [verificar])

  return null
}

// ── Toast individual ──────────────────────────────────────────────────────────
function Toast({ notif, onClose }) {
  const [saindo, setSaindo] = useState(false)
  const [progresso, setProgresso] = useState(100)
  const duracao = notif.duracao || 6000

  useEffect(() => {
    if (notif.tipo === 'critico' || notif.autoClose === false) return
    const inicio = Date.now()
    const t = setInterval(() => {
      const elapsed = Date.now() - inicio
      const pct = Math.max(0, 100 - (elapsed / duracao) * 100)
      setProgresso(pct)
      if (pct <= 0) clearInterval(t)
    }, 50)
    return () => clearInterval(t)
  }, [])

  const fechar = () => {
    setSaindo(true)
    setTimeout(onClose, 300)
  }

  const TIPOS = {
    sucesso: { cor:'#22c55e', bg:'rgba(34,197,94,0.08)',   borda:'rgba(34,197,94,0.25)',  icon:CheckCircle },
    aviso:   { cor:'#f59e0b', bg:'rgba(245,158,11,0.08)',  borda:'rgba(245,158,11,0.25)', icon:AlertTriangle },
    critico: { cor:'#ef4444', bg:'rgba(239,68,68,0.1)',    borda:'rgba(239,68,68,0.35)',  icon:AlertCircle },
    info:    { cor:'#4a9fff', bg:'rgba(74,159,255,0.08)',  borda:'rgba(74,159,255,0.25)', icon:Info },
    sistema: { cor:'#a78bfa', bg:'rgba(167,139,250,0.08)', borda:'rgba(167,139,250,0.25)',icon:Zap },
  }

  const meta = TIPOS[notif.tipo] || TIPOS.info
  const Ic   = meta.icon

  const ICONES = {
    bling:    <div className="text-[16px]">🔗</div>,
    catalogo: <Database size={15} style={{ color:meta.cor }}/>,
    ia:       <Zap size={15} style={{ color:meta.cor }}/>,
    whatsapp: <div className="text-[16px]">💬</div>,
  }

  return (
    <div className="relative overflow-hidden rounded-[14px] transition-all duration-300"
      style={{
        background:  meta.bg,
        border:      `1px solid ${meta.borda}`,
        boxShadow:   `0 4px 20px rgba(0,0,0,0.15)`,
        opacity:     saindo ? 0 : 1,
        transform:   saindo ? 'translateX(20px)' : 'translateX(0)',
        maxWidth:    360,
        backdropFilter: 'blur(8px)',
      }}>

      {/* Barra de progresso */}
      {notif.tipo !== 'critico' && notif.autoClose !== false && (
        <div className="absolute top-0 left-0 h-0.5 transition-all duration-100"
          style={{ width:`${progresso}%`, background:meta.cor, opacity:0.6 }}/>
      )}

      <div className="flex items-start gap-3 p-4">
        {/* Ícone */}
        <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background:`${meta.cor}18`, border:`1px solid ${meta.borda}` }}>
          {notif.icone && ICONES[notif.icone]
            ? ICONES[notif.icone]
            : <Ic size={15} style={{ color:meta.cor }}/>
          }
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold leading-tight mb-0.5"
            style={{ color:'var(--label)' }}>
            {notif.titulo}
          </p>
          <p className="text-[11px] leading-relaxed"
            style={{ color:'var(--label-3)' }}>
            {notif.mensagem}
          </p>

          {/* Ação */}
          {notif.acao && (
            <button
              onClick={() => {
                if (notif.acao.url) window.open(notif.acao.url, '_blank')
                if (notif.acao.handler) notif.acao.handler()
                fechar()
              }}
              className="flex items-center gap-1 mt-2 text-[11px] font-semibold transition-all hover:gap-1.5"
              style={{ color:meta.cor }}>
              {notif.acao.label}
              <ChevronRight size={11}/>
            </button>
          )}
        </div>

        {/* Fechar */}
        <button onClick={fechar}
          className="p-1 rounded-[6px] flex-shrink-0 transition-all hover:scale-110"
          style={{ color:'var(--label-4)' }}>
          <X size={13}/>
        </button>
      </div>
    </div>
  )
}

// ── Container de toasts (canto superior direito) ──────────────────────────────
export function ToastContainer() {
  const { notifs, remove } = useNotif()
  const criticos = notifs.filter(n => n.tipo === 'critico')

  return (
    <>
      {/* Banner crítico no topo (para alertas que não podem ser ignorados) */}
      {criticos.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[9999]">
          {criticos.map(n => (
            <div key={n.id}
              className="flex items-center gap-3 px-4 py-2.5 animate-pulse-slow"
              style={{ background:'rgba(239,68,68,0.95)', backdropFilter:'blur(8px)' }}>
              <AlertCircle size={14} style={{ color:'#fff', flexShrink:0 }}/>
              <p className="flex-1 text-[12px] font-medium text-white">{n.titulo} — {n.mensagem}</p>
              {n.acao && (
                <button onClick={() => { if(n.acao.url) window.open(n.acao.url,'_blank') }}
                  className="flex items-center gap-1 px-3 py-1 rounded-[7px] text-[11px] font-semibold flex-shrink-0 transition-all hover:bg-white/20"
                  style={{ border:'1px solid rgba(255,255,255,0.4)', color:'#fff' }}>
                  {n.acao.label} <ExternalLink size={10}/>
                </button>
              )}
              <button onClick={() => remove(n.id)}
                className="flex-shrink-0 p-1 rounded transition-all hover:bg-white/20"
                style={{ color:'rgba(255,255,255,0.8)' }}>
                <X size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Toasts normais */}
      <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-2"
        style={{ maxWidth:360 }}>
        {notifs.filter(n => n.tipo !== 'critico').map(n => (
          <Toast key={n.id} notif={n} onClose={() => remove(n.id)}/>
        ))}
      </div>
    </>
  )
}

// ── Sino de notificações na sidebar ──────────────────────────────────────────
export function NotifBell() {
  const { notifs, clear } = useNotif()
  const [aberto, setAberto] = useState(false)
  const total   = notifs.length
  const critico = notifs.some(n => n.tipo === 'critico')
  const aviso   = notifs.some(n => n.tipo === 'aviso')

  const corBadge = critico ? '#ef4444' : aviso ? '#f59e0b' : 'var(--accent)'

  return (
    <div className="relative">
      <button onClick={() => setAberto(v=>!v)}
        className="relative p-2 rounded-[9px] transition-all"
        style={{ background:aberto?'var(--accent-dim)':'transparent', color:aberto?'var(--accent)':'var(--label-3)' }}>
        <Bell size={16} strokeWidth={aberto?2.5:1.8}/>
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background:corBadge, animation:critico?'pulse 2s infinite':undefined }}>
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {aberto && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)}/>
          {/* Painel */}
          <div className="absolute bottom-10 left-0 z-50 w-[320px] rounded-[16px] overflow-hidden"
            style={{ background:'var(--bg-2)', border:'1px solid var(--sep)', boxShadow:'0 16px 48px rgba(0,0,0,0.25)' }}>

            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom:'1px solid var(--sep)', background:'var(--bg-3)' }}>
              <div className="flex items-center gap-2">
                <Bell size={13} style={{ color:'var(--label-2)' }}/>
                <span className="text-[12px] font-semibold" style={{ color:'var(--label)' }}>
                  Notificações
                </span>
                {total > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{ background:corBadge, color:'#fff' }}>
                    {total}
                  </span>
                )}
              </div>
              {total > 0 && (
                <button onClick={clear}
                  className="text-[10px]" style={{ color:'var(--label-4)' }}>
                  Limpar todas
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {total === 0 ? (
                <div className="flex flex-col items-center py-10">
                  <CheckCircle size={24} className="mb-2" style={{ color:'#22c55e', opacity:0.4 }}/>
                  <p className="text-[12px]" style={{ color:'var(--label-3)' }}>Tudo funcionando</p>
                </div>
              ) : (
                <div className="p-2 space-y-1.5">
                  {notifs.map(n => {
                    const TIPOS = {
                      sucesso: { cor:'#22c55e', icon:CheckCircle },
                      aviso:   { cor:'#f59e0b', icon:AlertTriangle },
                      critico: { cor:'#ef4444', icon:AlertCircle },
                      info:    { cor:'#4a9fff', icon:Info },
                      sistema: { cor:'#a78bfa', icon:Zap },
                    }
                    const meta = TIPOS[n.tipo] || TIPOS.info
                    const Ic   = meta.icon
                    const tempo = (() => {
                      const mins = Math.floor((new Date() - n.timestamp) / 60000)
                      if (mins < 1) return 'agora'
                      if (mins < 60) return `${mins}min`
                      return `${Math.floor(mins/60)}h`
                    })()

                    return (
                      <div key={n.id} className="flex items-start gap-2.5 p-3 rounded-[10px]"
                        style={{ background:'var(--bg-3)', border:`1px solid ${meta.cor}20` }}>
                        <Ic size={13} style={{ color:meta.cor, flexShrink:0, marginTop:2 }}/>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold truncate" style={{ color:'var(--label)' }}>
                              {n.titulo}
                            </p>
                            <span className="text-[9px] flex-shrink-0" style={{ color:'var(--label-4)' }}>
                              {tempo}
                            </span>
                          </div>
                          <p className="text-[10px] mt-0.5" style={{ color:'var(--label-3)' }}>
                            {n.mensagem}
                          </p>
                          {n.acao && (
                            <button onClick={() => {
                              if(n.acao.url) window.open(n.acao.url,'_blank')
                              if(n.acao.handler) n.acao.handler()
                            }}
                              className="text-[10px] font-semibold mt-1"
                              style={{ color:meta.cor }}>
                              {n.acao.label} →
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Status do sistema */}
            <div className="px-4 py-2.5" style={{ borderTop:'1px solid var(--sep)', background:'var(--bg-3)' }}>
              <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color:'var(--label-4)' }}>
                Status do sistema
              </p>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { n:'Gemini AI',  ok:true  },
                  { n:'WhatsApp',   ok:true  },
                  { n:'Nuvemshop',  ok:true  },
                  { n:'Bling ERP',  ok:!notifs.some(n=>n.icone==='bling'&&n.tipo==='critico') },
                ].map(s => (
                  <div key={s.n} className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full${s.ok?' animate-pulse':''}`}
                      style={{ background:s.ok?'#22c55e':'#ef4444' }}/>
                    <span className="text-[10px]" style={{ color:'var(--label-3)' }}>{s.n}</span>
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
