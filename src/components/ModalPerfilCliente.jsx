import { useState, useEffect } from 'react'
import {
  X, MessageSquare, TrendingUp, Bot, User,
  Edit2, Save, CheckCircle, Clock,
} from 'lucide-react'

// ── T system ──────────────────────────────────────────────────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#7b81a0', ink4:'#3a3f5c',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)', greenBor:'rgba(0,230,118,.25)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.08)', amberBor:'rgba(255,179,0,.25)',
  red:'#ff4757',  redDim:'rgba(255,71,87,.07)',   redBor:'rgba(255,71,87,.25)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.09)',purpleBor:'rgba(167,139,250,.25)',
  blue:'#4f8ef7', blueDim:'rgba(79,142,247,.08)',  blueBor:'rgba(79,142,247,.25)',
  cyan:'#06b6d4', cyanDim:'rgba(6,182,212,.08)',   cyanBor:'rgba(6,182,212,.22)',
  orange:'#ff9f0a',
  sep:'rgba(255,255,255,.05)', sep2:'rgba(255,255,255,.08)',
  gray:'rgba(255,255,255,.04)',
}

const BASE = import.meta.env.VITE_API_URL || ''

export default function ModalPerfilCliente({ telefone, nome, onClose, api: apiProp }) {
  const api = apiProp || BASE
  const [contato,   setContato]   = useState(null)
  const [historico, setHistorico] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [editando,  setEditando]  = useState(false)
  const [nomeEdit,  setNomeEdit]  = useState(nome||'')
  const [modoIA,    setModoIA]    = useState(true)
  const [salvando,  setSalvando]  = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [rc, rh] = await Promise.all([
          fetch(`${api}/api/contatos/${telefone}`).then(r=>r.ok?r.json():null).catch(()=>null),
          fetch(`${api}/api/dashboard/historico/${telefone}`).then(r=>r.ok?r.json():null).catch(()=>null),
        ])
        if (rc) { setContato(rc); setNomeEdit(rc.nome||nome||''); setModoIA(rc.modo!=='manual') }
        if (rh) setHistorico(rh.mensagens||[])
      } catch {}
      setLoading(false)
    }
    load()
  }, [telefone, api])

  const salvar = async () => {
    setSalvando(true)
    try {
      await fetch(`${api}/api/contatos/${telefone}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ nome:nomeEdit, modo:modoIA?'auto':'manual' }),
      })
      setContato(prev=>({...prev, nome:nomeEdit, modo:modoIA?'auto':'manual'}))
      setEditando(false)
    } catch {}
    setSalvando(false)
  }

  const tags      = contato?.tags||[]
  const ltv       = parseFloat(contato?.ltv||0).toFixed(2)
  const totalMsgs = contato?.total_msgs||historico.length||0
  const msgsIA    = historico.filter(m=>m.direcao==='saida'&&m.modo==='auto').length
  const msgsHuman = historico.filter(m=>m.direcao==='saida'&&m.modo==='manual').length

  // Iniciais + cor determinística
  const init = (nomeEdit||telefone).split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const paleta = [T.purple,T.green,T.amber,T.cyan,T.blue]
  const corAvatar = paleta[(nomeEdit||telefone).charCodeAt(0)%paleta.length]

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{ position:'fixed',inset:0,zIndex:9000,
        display:'flex',alignItems:'center',justifyContent:'center',
        background:'rgba(0,0,0,.65)',backdropFilter:'blur(6px)',
        animation:'mpc-bg .2s ease' }}>
      <style>{`
        @keyframes mpc-bg { from{opacity:0} to{opacity:1} }
        @keyframes mpc-in { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
      `}</style>

      <div style={{
        width:520, maxHeight:'88vh',
        display:'flex', flexDirection:'column',
        borderRadius:20, overflow:'hidden',
        background:`linear-gradient(160deg,${T.bg2},${T.bg3})`,
        border:`1px solid ${T.sep2}`,
        boxShadow:`0 32px 80px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.06) inset`,
        animation:'mpc-in .25s cubic-bezier(.2,.8,.2,1)',
      }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'20px 22px',borderBottom:`1px solid ${T.sep}`,
          background:`linear-gradient(90deg,${corAvatar}10,${T.bg3})` }}>
          <div style={{ display:'flex',alignItems:'center',gap:13 }}>
            {/* Avatar */}
            <div style={{ width:48,height:48,borderRadius:'50%',flexShrink:0,
              background:`${corAvatar}20`,border:`2px solid ${corAvatar}50`,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:16,fontWeight:800,color:corAvatar,
              boxShadow:`0 4px 16px ${corAvatar}25` }}>
              {init}
            </div>
            <div>
              {editando ? (
                <input value={nomeEdit} onChange={e=>setNomeEdit(e.target.value)}
                  style={{ fontSize:17,fontWeight:700,background:'transparent',
                    border:'none',borderBottom:`2px solid ${T.green}`,outline:'none',
                    color:T.ink1,fontFamily:'inherit',width:240 }}/>
              ) : (
                <div style={{ fontSize:17,fontWeight:700,color:T.ink1,
                  letterSpacing:'-.02em' }}>
                  {nomeEdit||'Cliente'}
                </div>
              )}
              <div style={{ fontSize:12,fontFamily:'monospace',marginTop:3,color:T.ink4 }}>
                {telefone}
              </div>
            </div>
          </div>

          <div style={{ display:'flex',alignItems:'center',gap:7 }}>
            {editando ? (
              <button onClick={salvar} disabled={salvando}
                style={{ display:'flex',alignItems:'center',gap:6,
                  padding:'8px 16px',borderRadius:9,border:'none',cursor:'pointer',
                  background:`linear-gradient(135deg,${T.green},${T.green}cc)`,
                  color:'#000',fontSize:12,fontWeight:700,
                  boxShadow:`0 4px 14px ${T.green}35` }}>
                <Save size={13}/> {salvando?'Salvando...':'Salvar'}
              </button>
            ) : (
              <button onClick={()=>setEditando(true)}
                style={{ width:32,height:32,borderRadius:9,border:`1px solid ${T.sep2}`,
                  background:T.gray,display:'flex',alignItems:'center',justifyContent:'center',
                  color:T.ink3,cursor:'pointer',transition:'all .12s' }}
                onMouseEnter={e=>{ e.currentTarget.style.color=T.ink1; e.currentTarget.style.borderColor=T.sep2 }}
                onMouseLeave={e=>{ e.currentTarget.style.color=T.ink3 }}>
                <Edit2 size={14}/>
              </button>
            )}
            <button onClick={onClose}
              style={{ width:32,height:32,borderRadius:9,border:`1px solid ${T.sep2}`,
                background:T.gray,display:'flex',alignItems:'center',justifyContent:'center',
                color:T.ink3,cursor:'pointer',transition:'all .12s' }}
              onMouseEnter={e=>{ e.currentTarget.style.color=T.red; e.currentTarget.style.borderColor=T.redBor }}
              onMouseLeave={e=>{ e.currentTarget.style.color=T.ink3; e.currentTarget.style.borderColor=T.sep2 }}>
              <X size={14}/>
            </button>
          </div>
        </div>

        {/* ── Corpo ──────────────────────────────────────────────────── */}
        <div style={{ overflowY:'auto',flex:1,padding:'20px 22px',
          display:'flex',flexDirection:'column',gap:16 }}>
          {loading ? (
            <div style={{ display:'flex',justifyContent:'center',
              alignItems:'center',padding:'40px 0',color:T.ink4 }}>
              Carregando...
            </div>
          ) : <>

            {/* ── Modo IA / Manual ── */}
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'14px 16px',borderRadius:14,
              background:modoIA?T.greenDim:T.blueDim,
              border:`1px solid ${modoIA?T.greenBor:T.blueBor}` }}>
              <div>
                <div style={{ fontSize:13.5,fontWeight:700,color:T.ink1 }}>Modo de Atendimento</div>
                <div style={{ fontSize:11.5,color:T.ink3,marginTop:3 }}>
                  {modoIA ? 'IA responde automaticamente' : 'Atendimento humano exclusivo'}
                </div>
              </div>
              <button onClick={()=>setModoIA(v=>!v)} style={{
                position:'relative',width:48,height:26,borderRadius:13,flexShrink:0,
                border:'none',cursor:'pointer',
                background:modoIA?T.green:T.blue,
                boxShadow:modoIA?`0 0 14px ${T.green}50`:`0 0 14px ${T.blue}50`,
                transition:'background .2s' }}>
                <span style={{
                  position:'absolute',top:3,height:20,width:20,
                  background:'#fff',borderRadius:'50%',
                  boxShadow:'0 2px 6px rgba(0,0,0,.3)',
                  left:modoIA?'calc(100% - 23px)':'3px',
                  transition:'left .2s cubic-bezier(.4,0,.2,1)',
                }}/>
              </button>
            </div>

            {/* ── KPIs ── */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10 }}>
              {[
                { icon:MessageSquare, label:'Total msgs',    value:totalMsgs, cor:T.blue   },
                { icon:Bot,           label:'Resp. pela IA', value:msgsIA,    cor:T.green  },
                { icon:User,          label:'Resp. humanas', value:msgsHuman, cor:T.orange },
              ].map((k,i) => (
                <div key={i} style={{ padding:'14px 12px',borderRadius:13,textAlign:'center',
                  background:T.bg3,border:`1px solid ${T.sep}`,
                  boxShadow:`0 4px 16px rgba(0,0,0,.2)` }}>
                  <div style={{ width:30,height:30,borderRadius:9,margin:'0 auto 8px',
                    background:`${k.cor}18`,border:`1px solid ${k.cor}30`,
                    display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <k.icon size={14} style={{ color:k.cor }}/>
                  </div>
                  <div style={{ fontSize:24,fontWeight:800,color:k.cor,letterSpacing:'-.04em',
                    textShadow:`0 0 20px ${k.cor}40` }}>{k.value}</div>
                  <div style={{ fontSize:10.5,color:T.ink4,marginTop:4 }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* ── LTV ── */}
            {parseFloat(ltv) > 0 && (
              <div style={{ display:'flex',alignItems:'center',gap:12,padding:'14px 16px',
                borderRadius:14,background:T.greenDim,border:`1px solid ${T.greenBor}` }}>
                <div style={{ width:36,height:36,borderRadius:10,flexShrink:0,
                  background:T.greenDim,border:`1px solid ${T.greenBor}`,
                  display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <TrendingUp size={16} style={{ color:T.green }}/>
                </div>
                <div>
                  <div style={{ fontSize:11.5,color:T.ink3 }}>Valor total em compras</div>
                  <div style={{ fontSize:22,fontWeight:800,color:T.green,
                    letterSpacing:'-.03em',textShadow:`0 0 20px ${T.green}40` }}>
                    R$ {ltv}
                  </div>
                </div>
              </div>
            )}

            {/* ── Tags ── */}
            {tags.length > 0 && (
              <div>
                <div style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',
                  letterSpacing:'.07em',color:T.ink4,marginBottom:9 }}>Tags</div>
                <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                  {tags.map((t,i) => (
                    <span key={i} style={{ fontSize:11.5,fontWeight:600,
                      padding:'5px 12px',borderRadius:99,
                      background:T.gray,color:T.ink2,border:`1px solid ${T.sep}` }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Histórico de mensagens ── */}
            <div>
              <div style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',
                letterSpacing:'.07em',color:T.ink4,marginBottom:10 }}>
                Últimas mensagens
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:6,
                maxHeight:200,overflowY:'auto' }}>
                {historico.slice(-8).reverse().map((m,i) => {
                  const entrada = m.direcao==='entrada'
                  return (
                    <div key={i} style={{ display:'flex',
                      justifyContent:entrada?'flex-end':'flex-start' }}>
                      <div style={{ maxWidth:'84%',padding:'9px 12px',borderRadius:12,
                        background:entrada?T.blue:T.bg3,
                        border:entrada?'none':`1px solid ${T.sep}`,
                        boxShadow:entrada?`0 4px 12px ${T.blue}30`:'none' }}>
                        <div style={{ fontSize:11.5,lineHeight:1.55,
                          color:entrada?'#fff':T.ink2,
                          whiteSpace:'pre-wrap' }}>
                          {(m.mensagem||'').slice(0,100)}
                        </div>
                        <div style={{ fontSize:9.5,marginTop:4,textAlign:'right',
                          color:entrada?'rgba(255,255,255,.55)':T.ink4 }}>
                          {m.hora}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {historico.length===0&&(
                  <div style={{ textAlign:'center',padding:'16px 0',
                    color:T.ink4,fontSize:12 }}>
                    Sem mensagens no histórico
                  </div>
                )}
              </div>
            </div>
          </>}
        </div>
      </div>
    </div>
  )
}
