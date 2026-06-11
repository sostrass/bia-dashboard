import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Bell, RefreshCw, Send, Users, TrendingUp, Package, AlertTriangle,
  CheckCircle, Clock, Star, Zap, Brain, ChevronDown, ChevronRight,
  ExternalLink, MessageSquare, X, Search, Filter, ArrowUpRight,
  ShoppingCart, BarChart2, Activity, Eye, Copy, Check, Hash,
  AlertCircle, Layers, Tag, DollarSign, Target, Flame,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer,
  Tooltip, Cell,
} from 'recharts'

// ─── Paleta idêntica à PageGatilhos ──────────────────────────────────────────
const T = {
  bg0:'#08090f', bg1:'#0d1017', bg2:'#111520', bg3:'#161b2c', bg4:'#1c2238',
  ink1:'#eef0f6', ink2:'#b8bdd4', ink3:'#6b7294', ink4:'#3a3f5c',
  sep:'rgba(255,255,255,0.05)', sep2:'rgba(255,255,255,0.08)',
  green:'#00e676', greenDim:'rgba(0,230,118,.08)',  greenBor:'rgba(0,230,118,.25)',
  blue:'#4f8ef7',  blueDim:'rgba(79,142,247,.08)',   blueBor:'rgba(79,142,247,.25)',
  amber:'#ffb300', amberDim:'rgba(255,179,0,.08)',   amberBor:'rgba(255,179,0,.25)',
  red:'#ff4757',   redDim:'rgba(255,71,87,.08)',     redBor:'rgba(255,71,87,.25)',
  purple:'#a78bfa',purpleDim:'rgba(167,139,250,.08)',purpleBor:'rgba(167,139,250,.25)',
  cyan:'#06b6d4',  cyanDim:'rgba(6,182,212,.08)',    cyanBor:'rgba(6,182,212,.25)',
  orange:'#fb923c',orangeDim:'rgba(251,146,60,.08)', orangeBor:'rgba(251,146,60,.25)',
  pink:'#ec4899',  pinkDim:'rgba(236,72,153,.08)',   pinkBor:'rgba(236,72,153,.25)',
  gray:'rgba(255,255,255,.04)', grayBor:'rgba(255,255,255,.1)',
}

const R   = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const fmt = n => Number(n||0).toLocaleString('pt-BR')
const fmtK = n => n>=1000 ? `R$ ${(n/1000).toFixed(1).replace('.',',')}k` : R(n)
const fmtTel = t => { const d=String(t||'').replace(/\D/g,''); return d.length>=11?`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`:t }

function tempoRel(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff/60000)
  if (min<1)  return 'agora'
  if (min<60) return `${min}min`
  const h = Math.floor(min/60)
  if (h<24)   return `${h}h`
  const d = Math.floor(h/24)
  if (d===1)  return 'ontem'
  return `${d}d`
}

// ── Nível de cliente derivado de total de pedidos ─────────────────────────────
function nivelCliente(totalPedidos) {
  if (totalPedidos >= 6) return { label:'VIP',       cor:T.amber,  dim:T.amberDim,  bor:T.amberBor,  pct:92 }
  if (totalPedidos >= 3) return { label:'Frequente', cor:T.cyan,   dim:T.cyanDim,   bor:T.cyanBor,   pct:65 }
  if (totalPedidos >= 1) return { label:'Recorrente',cor:T.blue,   dim:T.blueDim,   bor:T.blueBor,   pct:40 }
  return                         { label:'Novo',      cor:T.ink4,   dim:T.gray,      bor:T.grayBor,   pct:12 }
}

// ── SparkLine — idêntico à PageGatilhos ──────────────────────────────────────
function SparkLine({ serie=[], cor=T.orange, w=72, h=26 }) {
  if (!serie || serie.length < 2) return null
  const data = serie.map((v,i)=>({i,v}))
  const gid  = `spk-${cor.replace(/[^a-z0-9]/gi,'').slice(0,8)}-${Math.random().toString(36).slice(2,5)}`
  return (
    <ResponsiveContainer width={w} height={h}>
      <AreaChart data={data} margin={{top:2,right:1,left:1,bottom:0}}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={cor} stopOpacity={0.45}/>
            <stop offset="95%" stopColor={cor} stopOpacity={0.02}/>
          </linearGradient>
          <filter id={`gf-${gid}`}><feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <Area dataKey="v" type="monotone" stroke={cor} strokeWidth={1.8}
          fill={`url(#${gid})`} fillOpacity={1} dot={false}
          activeDot={{r:3,fill:cor,strokeWidth:0}} filter={`url(#gf-${gid})`}/>
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── V-Bar de demanda acumulada (degradê por semana) ───────────────────────────
function VBarDemanda({ serie=[], cor=T.orange, maxGlobal=1 }) {
  if (!serie?.length) return null
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:2,height:32}}>
      {serie.map((v,i)=>{
        const h = Math.max(4, Math.round((v/(maxGlobal||1))*32))
        const op = 0.35 + (i/(serie.length-1||1))*0.65
        return (
          <div key={i} title={`Semana ${i+1}: ${v}`} style={{
            flex:1, height:h,
            background:`linear-gradient(180deg,${cor} 0%,${cor}20 100%)`,
            borderRadius:'2px 2px 0 0',
            boxShadow:i===serie.length-1?`0 0 8px ${cor}60`:undefined,
            opacity:op, transition:'height .3s',
          }}/>
        )
      })}
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({w='100%',h=14,r=6}) {
  return <div style={{width:w,height:h,borderRadius:r,
    background:`linear-gradient(90deg,${T.bg3} 25%,${T.bg4} 50%,${T.bg3} 75%)`,
    backgroundSize:'200% 100%',animation:'gat-shimmer 1.5s ease-in-out infinite'}}/>
}

// ── KPI Card — estilo PageGatilhos ───────────────────────────────────────────
function KpiCard({ icon:Ic, label, value, sub, cor=T.orange, spark, prefix='', suffix='' }) {
  const [disp, setDisp] = useState(0)
  const num = parseFloat(String(value).replace(/[^0-9.]/g,''))||0
  useEffect(()=>{
    let s=0, frames=0, total=20
    const tick=()=>{ frames++; s=num*(frames/total); setDisp(s>=num?num:s)
      if(frames<total) requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  },[num])
  const dispStr = num>=1000 ? fmtK(disp) : prefix+(num%1===0?Math.round(disp):disp.toFixed(1))+suffix
  return (
    <div style={{
      background:`linear-gradient(135deg,${T.bg2} 0%,${T.bg3} 100%)`,
      border:`1px solid ${T.sep2}`,borderRadius:14,overflow:'hidden',
      position:'relative',
      boxShadow:`0 8px 28px rgba(0,0,0,.28), 0 0 0 1px ${cor}10 inset`,
      transition:'transform .18s,box-shadow .18s',cursor:'default',
    }}
    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 14px 40px rgba(0,0,0,.4),0 0 32px ${cor}18`}}
    onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=`0 8px 28px rgba(0,0,0,.28),0 0 0 1px ${cor}10 inset`}}>
      <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',
        background:`radial-gradient(circle,${cor}28 0%,transparent 70%)`,pointerEvents:'none',filter:'blur(10px)'}}/>
      <div style={{height:2.5,background:`linear-gradient(90deg,${cor},${cor}40)`,boxShadow:`0 0 8px ${cor}60`}}/>
      <div style={{padding:'10px 12px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
          <div style={{width:26,height:26,borderRadius:7,
            background:`linear-gradient(135deg,${cor}25,${cor}12)`,border:`1px solid ${cor}35`,
            display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 3px 10px ${cor}20`}}>
            <Ic size={12} style={{color:cor}}/>
          </div>
          {spark && <SparkLine serie={spark} cor={cor} w={60} h={22}/>}
        </div>
        <div style={{fontSize:26,fontWeight:800,color:T.ink1,letterSpacing:'-.04em',
          lineHeight:1,textShadow:`0 0 24px ${cor}30`}}>{dispStr}</div>
        <div style={{fontSize:9.5,color:T.ink4,marginTop:4,fontWeight:500,
          textTransform:'uppercase',letterSpacing:'.07em'}}>{label}</div>
        {sub && <div style={{fontSize:9,color:T.ink3,marginTop:2}}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Avatar com iniciais ───────────────────────────────────────────────────────
function Avatar({ nome, nivel }) {
  const iniciais = (nome||'?').split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()||'').join('')
  return (
    <div style={{width:26,height:26,borderRadius:8,flexShrink:0,
      background:`linear-gradient(135deg,${nivel.cor}30,${nivel.cor}0d)`,
      border:`1px solid ${nivel.bor}`,
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:9,fontWeight:800,color:nivel.cor,
      boxShadow:`0 0 10px ${nivel.cor}18`}}>
      {iniciais}
    </div>
  )
}

// ── Chip copiável ─────────────────────────────────────────────────────────────
function CopyChip({ valor, copiar, label, cor=T.purple }) {
  const [ok,setOk]=useState(false)
  if (!valor) return null
  return (
    <button onClick={e=>{e.stopPropagation();try{navigator.clipboard.writeText(String(copiar??valor))}catch{}
      setOk(true);setTimeout(()=>setOk(false),1400)}}
      style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 7px',borderRadius:6,
        fontSize:9.5,cursor:'pointer',fontFamily:'inherit',
        background:ok?T.greenDim:`${cor}12`,border:`1px solid ${ok?T.greenBor:`${cor}28`}`,
        color:ok?T.green:cor,transition:'all .15s'}}>
      <span style={{fontFamily:'monospace',fontWeight:600}}>{String(valor)}</span>
      {ok?<Check size={9}/>:<Copy size={9} style={{opacity:.6}}/>}
    </button>
  )
}

// ── Linha da fila de clientes ─────────────────────────────────────────────────
function LinhaCliente({ item, onNotificar, onWhats, selecionado, onToggle, notificando, notificado }) {
  const nv  = nivelCliente(item.total_pedidos||0)
  const dias = item.dias_esperando||0
  const critico = dias > 21
  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'24px 1.7fr 1fr 0.65fr 0.8fr 0.85fr 110px',
      gap:0,padding:'8px 12px',
      borderBottom:`1px solid ${T.sep}`,alignItems:'center',
      background: critico ? `${T.red}06` : 'transparent',
      transition:'background .15s',
    }}
    onMouseEnter={e=>e.currentTarget.style.background=critico?`${T.red}0a`:`${T.purple}06`}
    onMouseLeave={e=>e.currentTarget.style.background=critico?`${T.red}06`:'transparent'}>

      <input type="checkbox" checked={selecionado} onChange={onToggle}
        style={{width:11,height:11,accentColor:T.purple,cursor:'pointer'}}/>

      <div style={{display:'flex',alignItems:'center',gap:7,paddingLeft:2,minWidth:0}}>
        <Avatar nome={item.nome_cliente||item.telefone} nivel={nv}/>
        <div style={{minWidth:0}}>
          <div style={{fontSize:11,fontWeight:700,color:T.ink1,
            whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
            {item.nome_cliente||'Cliente'}
          </div>
          <div style={{display:'flex',gap:3,marginTop:2,flexWrap:'wrap'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:2,padding:'1px 5px',
              borderRadius:99,fontSize:9,fontWeight:700,
              background:nv.dim,border:`1px solid ${nv.bor}`,color:nv.cor}}>
              {nv.label==='VIP'&&<Star size={7}/>}
              {nv.label}
            </span>
            {item.recompra && <span style={{display:'inline-flex',alignItems:'center',gap:2,
              padding:'1px 5px',borderRadius:99,fontSize:9,fontWeight:700,
              background:T.greenDim,border:`1px solid ${T.greenBor}`,color:T.green}}>recompra</span>}
            {item.ticket_alto && <span style={{display:'inline-flex',alignItems:'center',gap:2,
              padding:'1px 5px',borderRadius:99,fontSize:9,fontWeight:700,
              background:T.pinkDim,border:`1px solid ${T.pinkBor}`,color:T.pink}}>ticket alto</span>}
            {critico && <span style={{display:'inline-flex',alignItems:'center',gap:2,
              padding:'1px 5px',borderRadius:99,fontSize:9,fontWeight:700,
              background:T.redDim,border:`1px solid ${T.redBor}`,color:T.red}}>
              <Clock size={7}/>{dias}d
            </span>}
          </div>
        </div>
      </div>

      <div>
        <div style={{fontFamily:'monospace',fontSize:9.5,color:T.ink2}}>{fmtTel(item.telefone)}</div>
        <div style={{fontSize:8.5,color:T.ink4,marginTop:1}}>{item.total_pedidos||0} pedido{item.total_pedidos!==1?'s':''}</div>
      </div>

      <div>
        <div style={{fontSize:10,fontWeight:600,color:T.ink1}}>
          {item.criado_em ? new Date(item.criado_em).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}) : '—'}
        </div>
        <div style={{fontSize:8.5,marginTop:1,fontWeight:critico?700:400,
          color:critico?T.red:T.orange}}>
          há {dias}d
        </div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:3}}>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <div style={{flex:1,height:3,background:T.bg4,borderRadius:99,overflow:'hidden'}}>
            <div style={{width:`${nv.pct}%`,height:'100%',borderRadius:99,
              background:`linear-gradient(90deg,${nv.cor}60,${nv.cor})`,
              boxShadow:`0 0 5px ${nv.cor}40`}}/>
          </div>
          <span style={{fontSize:8,color:nv.cor,fontWeight:700,flexShrink:0}}>{nv.label.slice(0,4)}.</span>
        </div>
        <div style={{fontSize:8,color:T.ink4}}>{item.total_pedidos||0}ª compra futura</div>
      </div>

      <div>
        <div style={{fontSize:11,fontWeight:700,
          color:item.ltv>0?T.green:T.ink4,
          textShadow:item.ltv>0?`0 0 8px ${T.green}22`:undefined}}>
          {item.ltv>0?R(item.ltv):'—'}
        </div>
        <div style={{fontSize:8.5,color:T.ink4}}>
          {item.ticket_medio>0?`${R(item.ticket_medio)} / pedido`:'sem histórico'}
        </div>
      </div>

      <div style={{display:'flex',gap:3,justifyContent:'flex-end'}}>
        <button onClick={()=>onWhats(item.telefone)}
          style={{display:'flex',alignItems:'center',gap:3,padding:'3px 7px',borderRadius:6,
            fontSize:9.5,fontWeight:700,cursor:'pointer',border:`1px solid ${T.cyanBor}`,
            background:T.cyanDim,color:T.cyan,fontFamily:'inherit'}}>
          <MessageSquare size={10}/>
        </button>
        <button disabled={notificando||notificado} onClick={()=>onNotificar(item)}
          style={{display:'flex',alignItems:'center',gap:3,padding:'3px 8px',borderRadius:6,
            fontSize:9.5,fontWeight:700,cursor:notificando||notificado?'default':'pointer',
            border:`1px solid ${notificado?T.greenBor:T.orangeBor}`,
            background:notificado?T.greenDim:T.orangeDim,
            color:notificado?T.green:T.orange,fontFamily:'inherit',
            boxShadow:notificado?`0 0 8px ${T.green}25`:undefined,
            transition:'all .2s',opacity:notificando?.6:1}}>
          {notificado?<Check size={10}/>:notificando?<RefreshCw size={10} style={{animation:'spin .7s linear infinite'}}/>:<Send size={10}/>}
          {notificado?'Enviado':'Notif.'}
        </button>
      </div>
    </div>
  )
}

// ── Card de Produto ───────────────────────────────────────────────────────────
function CardProduto({ item, onAbrirFila, onDisparar, disparando, disparado }) {
  const [imgErr, setImgErr] = useState(false)
  const semEstoque  = !item.estoque || item.estoque <= 0
  const prontoDisp  = !semEstoque && !disparado
  const cor         = disparado ? T.green : prontoDisp ? T.green : T.orange
  const maxSerie    = Math.max(...(item.serie_semanal||[1]),1)

  return (
    <div style={{
      background:`linear-gradient(135deg,${T.bg2} 0%,${T.bg3} 100%)`,
      border:`1px solid ${prontoDisp||disparado ? T.greenBor : T.sep2}`,
      borderRadius:16,overflow:'hidden',
      boxShadow: prontoDisp||disparado
        ? `0 8px 28px rgba(0,0,0,.3),0 0 24px ${T.green}12`
        : '0 8px 28px rgba(0,0,0,.28)',
      transition:'transform .18s,box-shadow .18s',
    }}
    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)'}}
    onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)'}}>

      <div style={{height:2.5,background:`linear-gradient(90deg,${cor},${cor}40)`,boxShadow:`0 0 8px ${cor}60`}}/>

      {prontoDisp && !disparado && (
        <div style={{padding:'4px 12px',background:T.greenDim,borderBottom:`1px solid ${T.greenBor}`,
          display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:T.green,
            boxShadow:`0 0 8px ${T.green}`,animation:'gat-pulse 2s ease infinite'}}/>
          <span style={{fontSize:9,fontWeight:700,color:T.green}}>
            voltou ao estoque — {item.estoque} un. disponíveis
          </span>
          <span style={{fontSize:8.5,color:T.ink3,marginLeft:'auto'}}>
            detectado {tempoRel(item.estoque_detectado_em)||'recentemente'}
          </span>
        </div>
      )}

      <div style={{padding:'12px 13px'}}>
        <div style={{display:'flex',gap:11,alignItems:'flex-start'}}>
          <div style={{width:50,height:50,borderRadius:10,flexShrink:0,overflow:'hidden',
            background:T.bg3,border:`1px solid ${T.sep2}`,
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            {item.imagem_url && !imgErr
              ? <img src={item.imagem_url} alt="" onError={()=>setImgErr(true)}
                  style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : <Package size={20} style={{color:T.ink4}}/>}
          </div>

          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11.5,fontWeight:700,color:T.ink1,lineHeight:1.35,marginBottom:2,
              display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
              {item.produto_nome||item.nome}
            </div>
            <div style={{fontSize:9,color:T.ink4,marginBottom:2}}>
              cod. {item.codigo||item.produto_codigo||'—'}
            </div>
            {item.descricao_curta && (
              <div style={{fontSize:9,color:T.ink3,fontStyle:'italic',
                whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                {item.descricao_curta}
              </div>
            )}
          </div>

          <div style={{textAlign:'right',flexShrink:0}}>
            <div style={{fontSize:9,color:T.ink4,textTransform:'uppercase',letterSpacing:'.05em',fontWeight:600}}>receita potencial</div>
            <div style={{fontSize:19,fontWeight:800,letterSpacing:'-.04em',lineHeight:1,
              color:cor,textShadow:`0 0 16px ${cor}40`}}>
              {R(item.receita_potencial||0)}
            </div>
            <div style={{fontSize:8.5,color:T.ink3,marginTop:1}}>
              {item.total_clientes} × {R(item.preco||0)}
            </div>
          </div>
        </div>

        <div style={{marginTop:10}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
            <span style={{fontSize:8.5,color:T.ink4,textTransform:'uppercase',letterSpacing:'.06em',fontWeight:600}}>
              demanda acumulada
            </span>
            <span style={{fontSize:9,color:T.orange,fontWeight:700}}>
              {item.total_clientes} clientes · {Math.round(item.espera_media||0)}d espera média
            </span>
          </div>

          <VBarDemanda serie={item.serie_semanal||[1,2,3,4,item.total_clientes||1]}
            cor={semEstoque?T.orange:T.green} maxGlobal={maxSerie}/>

          <div style={{display:'flex',justifyContent:'space-between',marginTop:2}}>
            <span style={{fontSize:7.5,color:T.ink4}}>4 semanas atrás</span>
            <span style={{fontSize:7.5,color:semEstoque?T.orange:T.green,fontWeight:700}}>hoje</span>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4,marginTop:8}}>
          {[
            {l:'aguardam', v:item.total_clientes,        cor:T.orange},
            {l:'estoque',  v:semEstoque?0:item.estoque,  cor:semEstoque?T.red:T.green},
            {l:'conv. hist.',v:`${item.taxa_conversao||0}%`, cor:T.purple},
            {l:'recompras', v:item.recompras||0,          cor:T.cyan},
          ].map((f,i)=>(
            <div key={i} style={{background:T.bg3,borderRadius:6,padding:'5px 6px',
              textAlign:'center',border:`1px solid ${T.sep2}`}}>
              <div style={{fontSize:11,fontWeight:800,color:f.cor,lineHeight:1,
                textShadow:`0 0 8px ${f.cor}30`}}>{f.v}</div>
              <div style={{fontSize:7.5,color:T.ink4,marginTop:2,textTransform:'uppercase',letterSpacing:'.04em'}}>{f.l}</div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:6,marginTop:10}}>
          <button onClick={()=>onAbrirFila(item)} style={{flex:1,display:'flex',alignItems:'center',
            justifyContent:'center',gap:5,padding:'7px 10px',borderRadius:9,
            fontSize:10,fontWeight:700,cursor:'pointer',
            background:T.bg3,border:`1px solid ${T.sep2}`,color:T.ink2,fontFamily:'inherit'}}>
            <Users size={11}/>Ver {item.total_clientes} na fila
          </button>
          {prontoDisp && !disparado && (
            <button disabled={disparando} onClick={()=>onDisparar(item)}
              style={{flex:1.3,display:'flex',alignItems:'center',justifyContent:'center',gap:5,
                padding:'7px 10px',borderRadius:9,fontSize:10,fontWeight:700,cursor:'pointer',
                background:`linear-gradient(90deg,${T.green}22,${T.green}10)`,
                border:`1px solid ${T.greenBor}`,color:T.green,fontFamily:'inherit',
                boxShadow:`0 0 16px ${T.green}20`,transition:'all .15s'}}>
              {disparando?<RefreshCw size={11} style={{animation:'spin .7s linear infinite'}}/>:<Send size={11}/>}
              Disparar agora
            </button>
          )}
          {disparado && (
            <div style={{flex:1.3,display:'flex',alignItems:'center',justifyContent:'center',gap:5,
              padding:'7px 10px',borderRadius:9,fontSize:10,fontWeight:700,
              background:T.greenDim,border:`1px solid ${T.greenBor}`,color:T.green}}>
              <Check size={11}/>Notificados
            </div>
          )}
          {semEstoque && (
            <div style={{flex:1.3,display:'flex',alignItems:'center',justifyContent:'center',gap:5,
              padding:'7px 10px',borderRadius:9,fontSize:10,fontWeight:700,
              background:T.bg3,border:`1px solid ${T.sep2}`,color:T.ink4}}>
              <Clock size={11}/>Aguardando estoque
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Drawer da fila de clientes ────────────────────────────────────────────────
function DrawerFila({ produto, api, onClose }) {
  const [clientes, setClientes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [selecionados, setSel]    = useState(new Set())
  const [notificando, setNotif]   = useState(new Set())
  const [notificados, setNotifOk] = useState(new Set())
  const [busca, setBusca]         = useState('')
  const [disparandoLote, setDisLote] = useState(false)

  useEffect(()=>{
    if (!produto?.bling_id) return
    setLoading(true); setClientes([])
    fetch(`${api}/api/dashboard/avise-me/fila/${produto.bling_id}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(d?.clientes) setClientes(d.clientes) })
      .catch(()=>{}).finally(()=>setLoading(false))
  },[api,produto?.bling_id])

  const filtrados = useMemo(()=>{
    if (!busca) return clientes
    const q = busca.toLowerCase()
    return clientes.filter(c=>(c.nome_cliente||'').toLowerCase().includes(q)||c.telefone?.includes(q))
  },[clientes,busca])

  const notificarUm = async (item) => {
    const t = item.telefone
    setNotif(s=>{const n=new Set(s);n.add(t);return n})
    try {
      await fetch(`${api}/api/dashboard/avise-me/notificar`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({telefone:t,produto_id:produto.bling_id,produto_nome:produto.produto_nome})})
      setNotifOk(s=>{const n=new Set(s);n.add(t);return n})
    } catch{}
    setNotif(s=>{const n=new Set(s);n.delete(t);return n})
  }

  const notificarLote = async () => {
    setDisLote(true)
    const alvo = selecionados.size>0 ? filtrados.filter(c=>selecionados.has(c.telefone)) : filtrados
    for (const c of alvo) {
      if (!notificados.has(c.telefone)) await notificarUm(c)
    }
    setDisLote(false); setSel(new Set())
  }

  // resumo da fila
  const vips    = filtrados.filter(c=>nivelCliente(c.total_pedidos||0).label==='VIP').length
  const criticos= filtrados.filter(c=>(c.dias_esperando||0)>21).length
  const novos   = filtrados.filter(c=>!(c.total_pedidos>0)).length

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',
      zIndex:300,display:'flex',justifyContent:'flex-end',animation:'fadeIn .2s ease'}}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:740,height:'100%',background:T.bg1,
        borderLeft:`1px solid ${T.sep2}`,
        display:'flex',flexDirection:'column',
        boxShadow:'-24px 0 64px rgba(0,0,0,.6)',
        animation:'slideFromRight .3s cubic-bezier(.2,.8,.2,1)',
      }}>
        {/* Header */}
        <div style={{padding:'13px 16px',borderBottom:`1px solid ${T.sep}`,
          background:`linear-gradient(90deg,${T.bg3},${T.bg2})`}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
            <div style={{width:28,height:28,borderRadius:8,background:T.orangeDim,
              border:`1px solid ${T.orangeBor}`,display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:`0 0 12px ${T.orange}22`}}>
              <Users size={13} style={{color:T.orange}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:T.ink1,
                whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                Fila — {produto?.produto_nome||'Produto'}
              </div>
              <div style={{fontSize:9,color:T.ink4}}>
                {clientes.length} clientes · R$ {fmt(Math.round(produto?.receita_potencial||0))} receita potencial
              </div>
            </div>
            <button onClick={onClose} style={{width:26,height:26,borderRadius:7,
              background:'rgba(255,255,255,.06)',border:`1px solid ${T.sep2}`,
              color:T.ink3,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <X size={13}/>
            </button>
          </div>
          {/* Busca + disparo em lote */}
          <div style={{display:'flex',gap:7,alignItems:'center'}}>
            <div style={{flex:1,display:'flex',alignItems:'center',gap:7,padding:'5px 9px',
              background:T.bg3,border:`1px solid ${T.sep2}`,borderRadius:8}}>
              <Search size={11} style={{color:T.ink4,flexShrink:0}}/>
              <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar cliente..."
                style={{flex:1,background:'none',border:'none',outline:'none',
                  fontSize:11,color:T.ink1,fontFamily:'inherit'}}/>
            </div>
            <button disabled={disparandoLote} onClick={notificarLote}
              style={{display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:8,
                fontSize:10,fontWeight:700,cursor:'pointer',
                background:selecionados.size>0?`rgba(0,230,118,.15)`:'rgba(0,230,118,.12)',
                border:`1px solid ${T.greenBor}`,color:T.green,fontFamily:'inherit',
                boxShadow:`0 0 12px ${T.green}15`,transition:'all .15s'}}>
              {disparandoLote?<RefreshCw size={11} style={{animation:'spin .7s linear infinite'}}/>:<Send size={11}/>}
              {selecionados.size>0?`Notificar ${selecionados.size} sel.`:`Notificar todos (${filtrados.length})`}
            </button>
          </div>
        </div>

        {/* Summary pills */}
        <div style={{padding:'7px 16px',borderBottom:`1px solid ${T.sep}`,
          display:'flex',gap:6,alignItems:'center'}}>
          {vips>0 && <span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 7px',
            borderRadius:99,fontSize:9,fontWeight:700,background:T.amberDim,border:`1px solid ${T.amberBor}`,color:T.amber}}>
            <Star size={8}/>{vips} VIP</span>}
          {criticos>0 && <span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 7px',
            borderRadius:99,fontSize:9,fontWeight:700,background:T.redDim,border:`1px solid ${T.redBor}`,color:T.red}}>
            <Clock size={8}/>{criticos} crítico{criticos!==1?'s':''} +21d</span>}
          {novos>0 && <span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 7px',
            borderRadius:99,fontSize:9,fontWeight:700,background:T.gray,border:`1px solid ${T.grayBor}`,color:T.ink3}}>
            {novos} novo{novos!==1?'s':''}</span>}
          <span style={{marginLeft:'auto',fontSize:9,color:T.ink4}}>
            {notificados.size>0 && `${notificados.size} notificado${notificados.size!==1?'s':''}`}
          </span>
        </div>

        {/* Header da tabela */}
        <div style={{display:'grid',gridTemplateColumns:'24px 1.7fr 1fr 0.65fr 0.8fr 0.85fr 110px',
          gap:0,padding:'5px 12px',background:T.bg0}}>
          <input type="checkbox"
            onChange={e=>setSel(e.target.checked?new Set(filtrados.map(c=>c.telefone)):new Set())}
            style={{width:11,height:11,accentColor:T.purple,cursor:'pointer'}}/>
          {['cliente','contato','solicitado','nível','ltv · ticket','ações'].map((h,i)=>(
            <div key={i} style={{fontSize:8,color:T.ink4,textTransform:'uppercase',
              letterSpacing:'.07em',fontWeight:600,paddingLeft:i===0?8:0,
              textAlign:i===5?'right':undefined}}>
              {h}
            </div>
          ))}
        </div>

        {/* Lista */}
        <div style={{flex:1,overflowY:'auto',minHeight:0}}>
          {loading && Array.from({length:5}).map((_,i)=>(
            <div key={i} style={{padding:'10px 12px',borderBottom:`1px solid ${T.sep}`}}>
              <Skel h={12} r={4}/>
            </div>
          ))}
          {!loading && filtrados.map(item=>(
            <LinhaCliente key={item.telefone} item={item}
              selecionado={selecionados.has(item.telefone)}
              onToggle={()=>setSel(s=>{const n=new Set(s);s.has(item.telefone)?n.delete(item.telefone):n.add(item.telefone);return n})}
              notificando={notificando.has(item.telefone)}
              notificado={notificados.has(item.telefone)}
              onNotificar={notificarUm}
              onWhats={tel=>window.open(`https://wa.me/${tel.replace(/\D/g,'')}`.replace('wa.me/','wa.me/55'),'_blank')}
            />
          ))}
          {!loading && !filtrados.length && (
            <div style={{padding:'40px 20px',textAlign:'center',color:T.ink4}}>
              <Users size={28} style={{opacity:.2,marginBottom:10}}/><br/>
              <div style={{fontSize:11}}>Nenhum cliente encontrado</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// PAGE AVISE-ME PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════
export default function PageAviseMe({ api='' }) {
  const [fila, setFila]           = useState([])    // produtos com clientes esperando
  const [carregando, setCarreg]   = useState(true)
  const [status, setStatus]       = useState(null)  // saúde do job
  const [drawerProd, setDrawer]   = useState(null)
  const [disparando, setDisp]     = useState(new Set())
  const [disparados, setDispOk]   = useState(new Set())
  const [busca, setBusca]         = useState('')
  const [filtro, setFiltro]       = useState('todos')  // todos | disparo_pronto | sem_estoque
  const [verificando, setVerif]   = useState(false)
  const refreshId                 = useRef(null)

  const carregar = useCallback(async(sil=false)=>{
    if (!sil) setCarreg(true)
    try {
      const [rFila, rSt] = await Promise.all([
        fetch(`${api}/api/dashboard/avise-me/fila-agregada`).then(r=>r.ok?r.json():null),
        fetch(`${api}/api/dashboard/avise-me/status`).then(r=>r.ok?r.json():null),
      ])
      if (rFila?.fila) setFila(rFila.fila)
      if (rSt)         setStatus(rSt)
    } catch {}
    if (!sil) setCarreg(false)
  },[api])

  useEffect(()=>{ carregar(); refreshId.current=setInterval(()=>carregar(true),120000)
    return ()=>clearInterval(refreshId.current) },[carregar])

  const verificarAgora = async() => {
    setVerif(true)
    try { await fetch(`${api}/api/dashboard/avise-me/verificar`,{method:'POST'}) } catch {}
    await new Promise(r=>setTimeout(r,3000)); await carregar(true); setVerif(false)
  }

  const disparar = async(item) => {
    const k = item.bling_id
    setDisp(s=>{const n=new Set(s);n.add(k);return n})
    try {
      await fetch(`${api}/api/dashboard/avise-me/disparar/${k}`,{method:'POST'})
      setDispOk(s=>{const n=new Set(s);n.add(k);return n})
    } catch {}
    setDisp(s=>{const n=new Set(s);n.delete(k);return n})
  }

  const dispararTodos = async() => {
    const prontos = filtradosFinal.filter(p=>p.estoque>0 && !disparados.has(p.bling_id))
    for (const p of prontos) await disparar(p)
  }

  const produtosFiltrados = useMemo(()=>{
    let l = fila
    if (filtro==='disparo_pronto') l = l.filter(p=>p.estoque>0)
    if (filtro==='sem_estoque')    l = l.filter(p=>!p.estoque||p.estoque<=0)
    if (busca) {
      const q = busca.toLowerCase()
      l = l.filter(p=>(p.produto_nome||'').toLowerCase().includes(q)||(p.codigo||'').includes(q))
    }
    return l
  },[fila,filtro,busca])

  const filtradosFinal = produtosFiltrados.sort((a,b)=>(b.receita_potencial||0)-(a.receita_potencial||0))

  // KPIs agregados
  const kpis = useMemo(()=>({
    receita:        fila.reduce((a,p)=>a+(p.receita_potencial||0),0),
    totalClientes:  fila.reduce((a,p)=>a+(p.total_clientes||0),0),
    prontos:        fila.filter(p=>p.estoque>0 && !disparados.has(p.bling_id)).length,
    conversao:      Math.round(fila.reduce((a,p)=>a+(p.taxa_conversao||0),0)/Math.max(fila.length,1)),
    sparkReceita:   fila.slice(-7).map(p=>p.receita_potencial||0),
    sparkClientes:  fila.slice(-7).map(p=>p.total_clientes||0),
  }),[fila,disparados])

  const prox = status?.ultimo_ciclo
    ? Math.max(0, 120 - Math.round((Date.now()-new Date(status.ultimo_ciclo).getTime())/60000))
    : null

  return (
    <div style={{background:T.bg0,minHeight:'100vh',color:T.ink1,
      fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <style>{`
        @keyframes gat-pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes gat-glow{0%,100%{box-shadow:0 0 8px rgba(0,230,118,.2)}50%{box-shadow:0 0 20px rgba(0,230,118,.6)}}
        @keyframes gat-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes gat-fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideFromRight{from{transform:translateX(24px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:99px}
      `}</style>

      <div style={{maxWidth:1280,margin:'0 auto',padding:'16px 20px',
        display:'flex',flexDirection:'column',gap:14,animation:'gat-fadeUp .35s ease'}}>

        {/* ── Header ── */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,
              background:`linear-gradient(135deg,${T.orange}25,${T.orange}12)`,
              border:`1px solid ${T.orangeBor}`,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:`0 4px 16px ${T.orange}20`}}>
              <Bell size={16} style={{color:T.orange}}/>
            </div>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:T.ink1,letterSpacing:'-.02em'}}>Avise-me</div>
              <div style={{fontSize:9.5,color:T.ink4}}>Inteligência de demanda · reposição de estoque</div>
            </div>
            {/* Pill de status do job */}
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'3px 10px',
              borderRadius:99,background:T.greenDim,border:`1px solid ${T.greenBor}`,marginLeft:6}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:T.green,
                boxShadow:`0 0 8px ${T.green}`,animation:'gat-pulse 2s ease infinite'}}/>
              <span style={{fontSize:9,color:T.green,fontWeight:700}}>
                monitorando{prox!==null?` · próx ${prox}min`:''}
              </span>
            </div>
          </div>
          <div style={{display:'flex',gap:6}}>
            <button disabled={verificando} onClick={verificarAgora}
              style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:9,
                fontSize:10,fontWeight:700,cursor:'pointer',
                background:T.bg3,border:`1px solid ${T.sep2}`,color:T.ink2,fontFamily:'inherit'}}>
              {verificando?<RefreshCw size={11} style={{animation:'spin .7s linear infinite'}}/>:<RefreshCw size={11}/>}
              Verificar agora
            </button>
            {kpis.prontos>0 && (
              <button onClick={dispararTodos}
                style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:9,
                  fontSize:10,fontWeight:700,cursor:'pointer',
                  background:`linear-gradient(90deg,${T.green}22,${T.green}10)`,
                  border:`1px solid ${T.greenBor}`,color:T.green,fontFamily:'inherit',
                  boxShadow:`0 0 16px ${T.green}20`}}>
                <Zap size={11}/>Disparar {kpis.prontos} disponível{kpis.prontos!==1?'is':''}
              </button>
            )}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
          <KpiCard icon={DollarSign} label="Receita em espera" value={kpis.receita}
            prefix="R$ " cor={T.orange} spark={kpis.sparkReceita}
            sub="se todos os clientes comprarem"/>
          <KpiCard icon={Users}       label="Clientes na fila"  value={kpis.totalClientes} cor={T.purple} spark={kpis.sparkClientes}
            sub={`em ${fila.length} produto${fila.length!==1?'s':''}`}/>
          <KpiCard icon={Zap}         label="Prontos p/ disparar" value={kpis.prontos} cor={T.green}
            sub="produtos com estoque de volta"/>
          <KpiCard icon={Target}      label="Conversão" value={kpis.conversao} suffix="%" cor={T.cyan}
            sub="avise-me → compra efetivada"/>
        </div>

        {/* ── Filtros + busca ── */}
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          {[
            {id:'todos',         lbl:'Todos',             count:fila.length},
            {id:'disparo_pronto',lbl:'Prontos p/ disparar',count:fila.filter(p=>p.estoque>0).length},
            {id:'sem_estoque',   lbl:'Sem estoque',        count:fila.filter(p=>!p.estoque||p.estoque<=0).length},
          ].map(f=>(
            <button key={f.id} onClick={()=>setFiltro(f.id)}
              style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',
                borderRadius:99,fontSize:10,fontWeight:700,cursor:'pointer',
                border:`1px solid ${filtro===f.id?T.orangeBor:T.sep2}`,
                background:filtro===f.id?T.orangeDim:'transparent',
                color:filtro===f.id?T.orange:T.ink3,fontFamily:'inherit',transition:'all .15s'}}>
              {f.lbl}
              <span style={{fontSize:9,padding:'0 5px',borderRadius:99,
                background:filtro===f.id?`${T.orange}25`:T.bg3,
                color:filtro===f.id?T.orange:T.ink4}}>{f.count}</span>
            </button>
          ))}
          <div style={{flex:1,display:'flex',alignItems:'center',gap:7,padding:'5px 9px',
            background:T.bg2,border:`1px solid ${T.sep2}`,borderRadius:8,maxWidth:280}}>
            <Search size={11} style={{color:T.ink4,flexShrink:0}}/>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar produto..."
              style={{flex:1,background:'none',border:'none',outline:'none',
                fontSize:10.5,color:T.ink1,fontFamily:'inherit'}}/>
          </div>
        </div>

        {/* ── Grid de produtos ── */}
        {carregando ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:12}}>
            {Array.from({length:4}).map((_,i)=>(
              <div key={i} style={{background:T.bg2,border:`1px solid ${T.sep2}`,
                borderRadius:16,padding:16,display:'flex',flexDirection:'column',gap:10}}>
                <Skel h={50} r={10}/><Skel h={12}/><Skel h={32} r={8}/><Skel h={12}/>
              </div>
            ))}
          </div>
        ) : filtradosFinal.length===0 ? (
          <div style={{padding:'60px 20px',textAlign:'center',color:T.ink4}}>
            <Bell size={36} style={{opacity:.15,marginBottom:12}}/><br/>
            <div style={{fontSize:12,marginBottom:6}}>Nenhum produto com clientes na fila</div>
            <div style={{fontSize:10,color:T.ink4}}>Quando um cliente solicitar aviso de reposição, aparecerá aqui.</div>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:12}}>
            {filtradosFinal.map(item=>(
              <CardProduto key={item.bling_id||item.produto_nome} item={item}
                onAbrirFila={setDrawer}
                onDisparar={disparar}
                disparando={disparando.has(item.bling_id)}
                disparado={disparados.has(item.bling_id)}/>
            ))}
          </div>
        )}
      </div>

      {drawerProd && <DrawerFila produto={drawerProd} api={api} onClose={()=>setDrawer(null)}/>}
    </div>
  )
}
