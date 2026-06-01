import { useState, useEffect, useCallback } from 'react'
import {
  Check, ExternalLink, Key, RefreshCw, Brain, Plug, Database,
  Settings, Play, HelpCircle, Loader, ChevronDown, Sparkles,
  ShoppingBag, MessageSquare, CreditCard, Truck, Package, X,
} from 'lucide-react'

/* ─── REGISTRO CENTRAL ───────────────────────────────────────────────────────
   Cada token e cada ação do sistema vivem aqui. Para adicionar algo novo no
   futuro, basta acrescentar um item — a página se monta sozinha a partir disto. */

// Grupos de credenciais (campos salvos via /api/ia/config)
const GRUPOS_TOKEN = [
  { key:'gemini', nome:'Gemini AI (Google)', desc:'Motor de inteligência da Molise', cor:'#4285F4', icon:Brain,
    doc:'aistudio.google.com', testavel:true,
    campos:[ {k:'geminiKey', l:'API Key', ph:'AIzaSy...', secret:true} ] },
  { key:'claude', nome:'Claude (Anthropic)', desc:'IA alternativa (opcional)', cor:'#d97757', icon:Sparkles,
    doc:'console.anthropic.com',
    campos:[ {k:'claudeKey', l:'API Key', ph:'sk-ant-...', secret:true} ] },
  { key:'whatsapp', nome:'WhatsApp Business (Meta)', desc:'Recebe e envia mensagens', cor:'#25D366', icon:MessageSquare,
    doc:'developers.facebook.com',
    campos:[ {k:'whatsappToken', l:'Token de Acesso', ph:'EAAxxxxx', secret:true},
             {k:'whatsappPhoneId', l:'Phone Number ID', ph:'12345678901234'},
             {k:'whatsappVerifyToken', l:'Verify Token', ph:'bia2025'} ] },
  { key:'bling', nome:'Bling ERP v3', desc:'Pedidos, contatos, notas (OAuth 2.0)', cor:'#F57C00', icon:Package,
    doc:'developer.bling.com.br', oauth:true,
    campos:[ {k:'blingClientId', l:'Client ID', ph:'seu_client_id'},
             {k:'blingClientSecret', l:'Client Secret', ph:'seu_secret', secret:true} ] },
  { key:'nuvemshop', nome:'Nuvemshop', desc:'Catálogo, pedidos e checkout', cor:'#00BCB4', icon:ShoppingBag,
    doc:'tiendanube.com/developers',
    campos:[ {k:'nuvemshopToken', l:'Access Token', ph:'seu_token', secret:true},
             {k:'nuvemshopStoreId', l:'Store ID', ph:'123456'} ] },
  { key:'mp', nome:'Mercado Pago', desc:'PIX e links de pagamento', cor:'#00b1ea', icon:CreditCard,
    doc:'mercadopago.com.br/developers',
    campos:[ {k:'mpAccessToken', l:'Access Token', ph:'APP_USR-...', secret:true} ] },
  { key:'melhorenvio', nome:'Melhor Envio', desc:'Rastreio e etiquetas', cor:'#0bb07b', icon:Truck,
    doc:'melhorenvio.com.br', oauthME:true,
    campos:[ {k:'melhorEnvioToken', l:'Token', ph:'seu_token', secret:true} ] },
  { key:'correios', nome:'Correios', desc:'Rastreio oficial', cor:'#ffcb05', icon:Truck,
    doc:'cws.correios.com.br',
    campos:[ {k:'correiosUsuario', l:'Usuário (CPF/CNPJ)', ph:'meu correios'},
             {k:'correiosCartao', l:'Cartão de postagem', ph:'00000000'},
             {k:'correiosContrato', l:'Contrato', ph:'00000000'},
             {k:'correiosApiKey', l:'Código de acesso', ph:'código', secret:true} ] },
  { key:'pix', nome:'PIX (fallback)', desc:'Chave PIX para cobranças diretas', cor:'#32bcad', icon:CreditCard,
    campos:[ {k:'pixChave', l:'Chave PIX', ph:'email/cpf/aleatória', secret:true} ] },
]

// Ações do sistema (botões e toggles que chamam endpoints)
const ACOES = [
  { categoria:'Sincronização', cor:'#4a9fff', icon:RefreshCw, itens:[
    { tipo:'acao', nome:'Carga inicial de pedidos', desc:'Baixa todos os pedidos com telefone do Bling para o banco. Roda em segundo plano e retoma se cair. Use uma vez, na primeira configuração.',
      botao:'Iniciar carga', icon:Play, metodo:'POST', endpoint:'/api/pedidos-sync/iniciar', statusEndpoint:'/api/pedidos-sync/status' },
    { tipo:'acao', nome:'Sincronização incremental', desc:'Busca só os pedidos novos/alterados dos últimos dias. Rápido. Use periodicamente para manter o banco atual.',
      botao:'Sincronizar agora', icon:RefreshCw, metodo:'POST', endpoint:'/api/pedidos-sync/incremental' },
  ]},
  { categoria:'Rastreamento', cor:'#0bb07b', icon:Truck, itens:[
    { tipo:'acao', nome:'Forçar varredura de rastreio', desc:'Varre os pedidos enviados dos últimos 30 dias no Bling e carrega os códigos de rastreio na fila de monitoramento. Use depois de ativar uma transportadora ou para recuperar pedidos que ficaram de fora.',
      botao:'Forçar varredura', icon:RefreshCw, metodo:'GET', endpoint:'/bling-webhook/forcar-varredura' },
  ]},
  { categoria:'Inteligência da Molise', cor:'#a78bfa', icon:Brain, itens:[
    { tipo:'acao', nome:'Analisar clientes (RFM + sugestões)', desc:'A Molise varre o banco, calcula o perfil dos clientes (RFM) e gera as sugestões de pró-atividade. Requer pedidos sincronizados.',
      botao:'Analisar agora', icon:Sparkles, metodo:'POST', endpoint:'/api/inteligencia/analisar' },
  ]},
]

// Toggles de ativação de rastreio por transportadora (lidos/salvos do banco)
const TRANSPORTADORAS_TOGGLE = [
  { id:'melhorenvio', nome:'Melhor Envio', desc:'Agrega Jadlog, Loggi, J&T, Total Express e outras' },
  { id:'correios',    nome:'Correios',     desc:'Rastreio oficial (SEDEX, PAC)' },
  { id:'loggi',       nome:'Loggi',        desc:'Contrato direto Loggi' },
  { id:'jadlog',      nome:'Jadlog',       desc:'Contrato direto Jadlog' },
]

export default function PageConfig({ api }) {
  const API = api || ''
  const [cfg, setCfg]       = useState({})
  const [loading, setLoad]  = useState(true)
  const [salvo, setSalvo]   = useState(null)
  const [testando, setTest] = useState(null)
  const [testMsg, setTestMsg] = useState({})
  const [acaoMsg, setAcaoMsg] = useState({})
  const [aberto, setAberto] = useState({})  // grupos expandidos
  const [aba, setAba]       = useState('tokens')  // 'tokens' | 'acoes'
  const [transp, setTransp] = useState({})  // ativação das transportadoras

  // Carrega config (tokens já mascarados pelo backend)
  useEffect(()=>{
    fetch(`${API}/api/ia/config`)
      .then(r=>r.ok?r.json():{})
      .then(d=>{ setCfg(d||{}); setLoad(false) })
      .catch(()=>setLoad(false))
  },[API])

  // Carrega o estado de ativação das transportadoras
  useEffect(()=>{
    fetch(`${API}/api/pedidos-sync/rastreio-ativacao`)
      .then(r=>r.ok?r.json():{})
      .then(d=>{ const m={}; Object.keys(d||{}).forEach(k=>m[k]=d[k].ativo); setTransp(m) })
      .catch(()=>{})
  },[API])

  // Liga/desliga uma transportadora (salva no banco)
  const toggleTransp = useCallback(async(id)=>{
    const novo = {...transp, [id]:!transp[id]}
    setTransp(novo)
    try{
      await fetch(`${API}/api/pedidos-sync/rastreio-ativacao`,{
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(novo)
      })
    }catch{}
  },[API,transp])

  const setCampo = (k,v)=> setCfg(c=>({...c,[k]:v}))

  const salvarGrupo = useCallback(async(grupoKey)=>{
    setSalvo(grupoKey)
    try{
      await fetch(`${API}/api/ia/config`,{
        method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(cfg)
      })
    }catch{}
    setTimeout(()=>setSalvo(null),2500)
  },[API,cfg])

  const testarGemini = useCallback(async(grupoKey)=>{
    setTest(grupoKey); setTestMsg(m=>({...m,[grupoKey]:null}))
    try{
      const r = await fetch(`${API}/api/ia/test-key`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ geminiKey:cfg.geminiKey, modelo:cfg.modelo })
      })
      const d = await r.json()
      setTestMsg(m=>({...m,[grupoKey]: d.ok?{ok:true,txt:d.aviso||'Chave válida ✓'}:{ok:false,txt:d.erro||'Falhou'}}))
    }catch(e){ setTestMsg(m=>({...m,[grupoKey]:{ok:false,txt:'Erro de conexão'}})) }
    setTest(null)
  },[API,cfg])

  const rodarAcao = useCallback(async(item)=>{
    const key = item.endpoint
    setAcaoMsg(m=>({...m,[key]:{loading:true}}))
    try{
      const r = await fetch(`${API}${item.endpoint}`,{ method:item.metodo||'POST' })
      const d = await r.json().catch(()=>({}))
      setAcaoMsg(m=>({...m,[key]:{ok:true,txt:d.msg||'Iniciado ✓'}}))
    }catch{
      setAcaoMsg(m=>({...m,[key]:{ok:false,txt:'Falha ao executar'}}))
    }
    setTimeout(()=>setAcaoMsg(m=>({...m,[key]:null})),4000)
  },[API])

  const C = {
    bg:'var(--bg,#0a0a12)', card:'var(--bg-2,rgba(255,255,255,.02))',
    sep:'var(--sep,rgba(255,255,255,.08))', label:'var(--label,#fff)',
    label3:'var(--label-3,#9b8fa6)', label4:'var(--label-4,#6a5f73)',
    accent:'var(--accent,#b8ff57)',
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,gap:10,color:C.label3}}>
      <Loader size={18} style={{animation:'spin 1s linear infinite'}}/>Carregando configurações...
    </div>
  )

  const inputStyle = {
    width:'100%', padding:'9px 11px', borderRadius:10, border:`1px solid ${C.sep}`,
    background:'rgba(255,255,255,.03)', color:C.label, fontSize:13, fontFamily:'monospace',
    outline:'none', boxSizing:'border-box',
  }

  return (
    <div style={{height:'100%',overflowY:'auto',padding:24}}>
      {/* Cabeçalho */}
      <div style={{marginBottom:6}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Settings size={22} style={{color:C.label}}/>
          <h2 style={{fontSize:20,fontWeight:700,color:C.label,margin:0}}>Central de configuração</h2>
        </div>
        <p style={{fontSize:13,color:C.label3,marginTop:4}}>Tokens, integrações e ações do sistema — tudo em um só lugar.</p>
      </div>

      {/* Abas */}
      <div style={{display:'flex',gap:4,margin:'18px 0',borderBottom:`1px solid ${C.sep}`}}>
        {[['tokens','Tokens & Integrações',Key],['acoes','Ações do sistema',Play]].map(([id,lbl,Ic])=>(
          <button key={id} onClick={()=>setAba(id)} style={{
            display:'flex',alignItems:'center',gap:6,padding:'9px 14px',background:'none',border:'none',
            borderBottom:`2px solid ${aba===id?C.accent:'transparent'}`,color:aba===id?C.label:C.label4,
            fontSize:13,fontWeight:aba===id?600:400,cursor:'pointer',marginBottom:-1}}>
            <Ic size={14}/>{lbl}
          </button>
        ))}
      </div>

      {/* ── ABA TOKENS ── */}
      {aba==='tokens' && <>
        <div style={{borderRadius:12,padding:'12px 14px',marginBottom:16,
          background:'rgba(184,255,87,.05)',border:'1px solid rgba(184,255,87,.2)'}}>
          <p style={{fontSize:12,fontWeight:600,color:C.accent,margin:0,display:'flex',alignItems:'center',gap:6}}>
            <Check size={13}/>Salvo no banco, com segurança</p>
          <p style={{fontSize:11,color:C.label3,marginTop:5,lineHeight:1.5}}>
            Os tokens são guardados no banco e exibidos mascarados (só os últimos dígitos). Ao salvar sem alterar um
            campo mascarado, o valor real é preservado. Não precisa mexer no Railway.
          </p>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {GRUPOS_TOKEN.map(g=>{
            const Ic = g.icon, exp = aberto[g.key]
            return <div key={g.key} style={{borderRadius:14,border:`1px solid ${C.sep}`,background:C.card,overflow:'hidden'}}>
              {/* Header do grupo */}
              <div onClick={()=>setAberto(a=>({...a,[g.key]:!a[g.key]}))}
                style={{padding:'13px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
                <div style={{display:'flex',alignItems:'center',gap:11}}>
                  <div style={{width:30,height:30,borderRadius:8,background:`${g.cor}22`,
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Ic size={15} style={{color:g.cor}}/>
                  </div>
                  <div>
                    <div style={{fontSize:13.5,fontWeight:600,color:C.label}}>{g.nome}</div>
                    <div style={{fontSize:11,color:C.label4}}>{g.desc}</div>
                  </div>
                </div>
                <ChevronDown size={16} style={{color:C.label4,transform:exp?'rotate(180deg)':'none',transition:'.15s'}}/>
              </div>
              {/* Campos */}
              {exp && <div style={{padding:'4px 16px 16px',borderTop:`1px solid ${C.sep}`}}>
                <div style={{display:'grid',gridTemplateColumns:g.campos.length>1?'1fr 1fr':'1fr',gap:12,margin:'14px 0'}}>
                  {g.campos.map(f=>(
                    <div key={f.k}>
                      <label style={{fontSize:10,fontWeight:600,color:C.label4,textTransform:'uppercase',
                        letterSpacing:'.05em',display:'block',marginBottom:6}}>{f.l}</label>
                      <input type={f.secret?'password':'text'} placeholder={f.ph}
                        value={cfg[f.k]||''} onChange={e=>setCampo(f.k,e.target.value)} style={inputStyle}/>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  <button onClick={()=>salvarGrupo(g.key)} style={{
                    display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,border:'none',
                    background:salvo===g.key?'#00e5b4':C.accent,color:'#0a0a12',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                    {salvo===g.key?<><Check size={13}/>Salvo!</>:'Salvar'}
                  </button>
                  {g.testavel && <button onClick={()=>testarGemini(g.key)} disabled={testando===g.key} style={{
                    display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,
                    border:`1px solid ${C.sep}`,background:'none',color:C.label3,fontSize:12,cursor:'pointer'}}>
                    {testando===g.key?<Loader size={12} style={{animation:'spin 1s linear infinite'}}/>:<Sparkles size={12}/>}
                    Testar chave
                  </button>}
                  {g.oauth && <a href={`${API}/bling/auth`} target="_blank" rel="noopener noreferrer" style={{
                    display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,textDecoration:'none',
                    background:'rgba(245,124,0,.15)',border:'1px solid rgba(245,124,0,.3)',color:'#F57C00',fontSize:12,fontWeight:600}}>
                    <Key size={12}/>Autorizar OAuth</a>}
                  {g.oauthME && <a href={`${API}/bling-webhook/me-auth`} target="_blank" rel="noopener noreferrer" style={{
                    display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,textDecoration:'none',
                    background:'rgba(11,176,123,.15)',border:'1px solid rgba(11,176,123,.3)',color:'#0bb07b',fontSize:12,fontWeight:600}}>
                    <Key size={12}/>Autorizar</a>}
                  {g.doc && <a href={`https://${g.doc}`} target="_blank" rel="noopener noreferrer" style={{
                    display:'flex',alignItems:'center',gap:5,marginLeft:'auto',color:C.label4,fontSize:11,textDecoration:'none'}}>
                    <ExternalLink size={11}/>Docs</a>}
                </div>
                {testMsg[g.key] && <div style={{marginTop:10,fontSize:11.5,
                  color:testMsg[g.key].ok?'#00e5b4':'#ef4444'}}>{testMsg[g.key].txt}</div>}
              </div>}
            </div>
          })}
        </div>
      </>}

      {/* ── ABA AÇÕES ── */}
      {aba==='acoes' && <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:C.label4,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
            <Truck size={13} style={{color:'#0bb07b'}}/>Transportadoras monitoradas
          </div>
          <div style={{borderRadius:14,border:`1px solid ${C.sep}`,background:C.card,padding:'6px 16px'}}>
            {TRANSPORTADORAS_TOGGLE.map((t,i)=>(
              <div key={t.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderTop:i>0?`1px solid ${C.sep}`:'none'}}>
                <div>
                  <div style={{fontSize:13.5,fontWeight:500,color:C.label}}>{t.nome}</div>
                  <div style={{fontSize:11,color:C.label4}}>{t.desc}</div>
                </div>
                <button onClick={()=>toggleTransp(t.id)} style={{width:42,height:24,borderRadius:99,border:'none',cursor:'pointer',position:'relative',background:transp[t.id]?'#0bb07b':C.sep,transition:'.15s',flexShrink:0}}>
                  <div style={{position:'absolute',top:2,left:transp[t.id]?20:2,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'.15s'}}/>
                </button>
              </div>
            ))}
          </div>
          <div style={{fontSize:10.5,color:C.label4,marginTop:8,lineHeight:1.5}}>
            Ligue a transportadora para a Molise consultar o rastreio. Depois de ligar, use "Forçar varredura" abaixo para carregar os pedidos já enviados.
          </div>
        </div>
        {ACOES.map(cat=>{
          const CatIc = cat.icon
          return <div key={cat.categoria}>
            <div style={{fontSize:11,fontWeight:600,color:C.label4,textTransform:'uppercase',
              letterSpacing:'.06em',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
              <CatIc size={13} style={{color:cat.cor}}/>{cat.categoria}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {cat.itens.map(item=>{
                const ItemIc = item.icon, msg = acaoMsg[item.endpoint]
                return <div key={item.endpoint} style={{borderRadius:14,border:`1px solid ${C.sep}`,
                  background:C.card,padding:'14px 16px'}}>
                  <div style={{fontSize:14,fontWeight:600,color:C.label,marginBottom:3}}>{item.nome}</div>
                  <div style={{fontSize:12,color:C.label3,lineHeight:1.5,marginBottom:12}}>{item.desc}</div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <button onClick={()=>rodarAcao(item)} disabled={msg?.loading} style={{
                      display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,
                      border:`1px solid ${cat.cor}55`,background:`${cat.cor}22`,color:cat.cor,
                      fontSize:12.5,fontWeight:600,cursor:'pointer'}}>
                      {msg?.loading?<Loader size={13} style={{animation:'spin 1s linear infinite'}}/>:<ItemIc size={14}/>}
                      {item.botao}
                    </button>
                    {item.statusEndpoint && <button onClick={async()=>{
                      try{const r=await fetch(`${API}${item.statusEndpoint}`);const d=await r.json()
                        const tot=d.banco?.totalPedidos??'?'; const rod=d.sync?.rodando?' (rodando...)':''
                        setAcaoMsg(m=>({...m,[item.endpoint]:{ok:true,txt:`${tot} pedidos no banco${rod}`}}))
                      }catch{}
                    }} style={{padding:'8px 14px',borderRadius:10,border:`1px solid ${C.sep}`,
                      background:'none',color:C.label3,fontSize:12,cursor:'pointer'}}>Ver status</button>}
                    {msg && !msg.loading && <span style={{fontSize:11.5,
                      color:msg.ok?'#00e5b4':'#ef4444'}}>{msg.txt}</span>}
                  </div>
                </div>
              })}
            </div>
          </div>
        })}
      </div>}
    </div>
  )
}
