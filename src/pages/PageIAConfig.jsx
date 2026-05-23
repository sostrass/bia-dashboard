import { useState, useRef } from "react"

const ALIASES = ["{nome_cliente}","{produto}","{valor_pix}","{valor_cartao}","{numero_pedido}","{loja}","{prazo_entrega}","{nome_ia}"]

const TONS = ["Simpática","Direta","Profissional","Descontraída","Prestativa","Entusiasmada","Concisa","Formal"]

const CONTEXTS = [
  { id:"saudacao", label:"Saudação inicial", color:"#34d399",
    default:"Olá! Seja bem-vindo(a) à {loja}! ✨ Sou a {nome_ia}. Como posso te ajudar hoje?",
    vars:["Oi! Bem-vindo(a) à {loja}! 😊 Sou a {nome_ia}, estou aqui para te ajudar!"] },
  { id:"produto", label:"Produto encontrado", color:"#7c6af7",
    default:"*{produto}*\n─────────────────\nPIX: R$ {valor_pix} | Cartão: R$ {valor_cartao}\n─────────────────",
    vars:[] },
  { id:"carrinho", label:"Item adicionado ao carrinho", color:"#fb923c",
    default:"✅ *{produto}* adicionado!", vars:["Ótimo! *{produto}* está no seu carrinho 🛒"] },
  { id:"pedido", label:"Pedido finalizado", color:"#34d399",
    default:"✅ *Pedido #{numero_pedido} criado!*\n💰 PIX: R$ {valor_pix}\nAcesse o link para pagar:", vars:[] },
  { id:"offline", label:"Fora do horário", color:"#60a5fa",
    default:"Olá! 😊 No momento estamos fora do horário.\n\nNosso horário é seg-sex, 8h às 18h.\n\nDeixe sua mensagem!", vars:[] },
]

const BTN_GROUPS = [
  { label:"Produto encontrado", btns:[
    {label:"Adicionar ao carrinho",on:true},{label:"Ver foto",on:true},{label:"Tirar dúvida",on:true}
  ]},
  { label:"Resumo do carrinho", btns:[
    {label:"Finalizar pedido",on:true},{label:"Adicionar item",on:true},{label:"Editar carrinho",on:true}
  ]},
  { label:"Confirmação endereço", btns:[
    {label:"Confirmar endereço",on:true},{label:"Alterar endereço",on:true}
  ]},
]

const DIAS = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"]

function VariationEditor({ vars, setVars, context }) {
  const [loading, setLoading] = useState(false)

  const addVar = () => setVars(v => [...v, ""])
  const removeVar = (i) => setVars(v => v.filter((_,idx)=>idx!==i))
  const updateVar = (i, val) => setVars(v => v.map((x,idx)=>idx===i?val:x))

  const gerarIA = async () => {
    setLoading(true)
    try {
      const ctxMap = {
        saudacao: "mensagem de saudação de assistente virtual de loja de bijuterias chamada {nome_ia} da loja {loja}. Tom acolhedor.",
        produto: "apresentação de produto em loja de strass. Use {produto}, {valor_pix}, {valor_cartao}.",
        carrinho: "confirmação de item adicionado ao carrinho. Use {produto}. Tom positivo.",
        pedido: "confirmação de pedido criado. Use {numero_pedido}, {valor_pix}, {valor_cartao}.",
        offline: "mensagem automática fora do horário de atendimento de loja de bijuterias."
      }
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:800,
          messages:[{role:"user",content:`Gere 2 variações criativas de ${ctxMap[context]||context}. Responda APENAS com as 2 frases separadas por ---. Sem numeração.`}]
        })
      })
      const d = await r.json()
      const parts = (d.content?.[0]?.text||"").split("---").map(s=>s.trim()).filter(Boolean)
      setVars(v => [...v, ...parts])
    } catch {}
    setLoading(false)
  }

  return (
    <div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
        {vars.map((v,i) => (
          <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            <textarea
              value={v} onChange={e=>updateVar(i,e.target.value)}
              style={{flex:1,background:"#1e1e22",border:"1px solid #2a2a30",borderRadius:8,
                padding:"8px 10px",color:"#f0f0f2",fontFamily:"inherit",fontSize:12,
                lineHeight:1.5,resize:"vertical",minHeight:40,outline:"none"}}
            />
            <button onClick={()=>removeVar(i)}
              style={{width:30,height:30,background:"#26262b",border:"1px solid #2a2a30",
                borderRadius:8,color:"#f87171",cursor:"pointer",fontSize:13,flexShrink:0}}>✕</button>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={addVar}
          style={{padding:"6px 12px",background:"transparent",border:"1px solid #2a2a30",
            borderRadius:8,color:"#9090a0",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
          + Adicionar variação
        </button>
        <button onClick={gerarIA} disabled={loading}
          style={{padding:"6px 14px",background:"rgba(124,106,247,0.1)",border:"1px solid #7c6af7",
            borderRadius:8,color:"#9d8fff",fontSize:12,cursor:"pointer",fontFamily:"inherit",
            fontWeight:500,opacity:loading?0.6:1}}>
          {loading ? "Gerando..." : "✦ Gerar com IA"}
        </button>
      </div>
    </div>
  )
}

function PhonePreview({ iaName, greeting }) {
  const msg = greeting.replace("{nome_ia}", iaName).replace("{loja}", "Só Strass")
  return (
    <div style={{width:220,background:"#000",borderRadius:42,padding:10,
      boxShadow:"0 0 0 1px #333,0 0 0 3px #1a1a1a,0 20px 50px rgba(0,0,0,0.5)",flexShrink:0}}>
      <div style={{width:80,height:22,background:"#000",borderRadius:"0 0 14px 14px",margin:"0 auto 6px",
        display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
        <div style={{width:7,height:7,background:"#1a1a1a",borderRadius:"50%",border:"1px solid #2a2a2a"}}/>
        <div style={{width:36,height:3,background:"#1a1a1a",borderRadius:2}}/>
      </div>
      <div style={{background:"#ece5dd",borderRadius:32,overflow:"hidden",height:380,display:"flex",flexDirection:"column"}}>
        <div style={{background:"#1f7a5e",padding:"8px 12px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div style={{width:28,height:28,background:"#2ea57a",borderRadius:"50%",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>💎</div>
          <div>
            <div style={{color:"white",fontSize:11,fontWeight:600}}>Só Strass</div>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:9}}>online</div>
          </div>
        </div>
        <div style={{flex:1,padding:"8px 8px",display:"flex",flexDirection:"column",gap:5,overflowY:"auto"}}>
          <div style={{background:"white",borderRadius:"0 10px 10px 10px",padding:"6px 8px",
            fontSize:10,lineHeight:1.4,maxWidth:"90%",boxShadow:"0 1px 2px rgba(0,0,0,0.1)",color:"#111"}}>
            {msg}
            <div style={{fontSize:8,color:"#999",textAlign:"right",marginTop:2}}>09:41</div>
          </div>
          <div style={{background:"#d9fdd3",borderRadius:"10px 0 10px 10px",padding:"6px 8px",
            fontSize:10,lineHeight:1.4,alignSelf:"flex-end",maxWidth:"80%",
            boxShadow:"0 1px 2px rgba(0,0,0,0.1)",color:"#111"}}>
            fecho lagosta 10mm
            <div style={{fontSize:8,color:"#999",textAlign:"right",marginTop:2}}>09:42</div>
          </div>
          <div style={{background:"white",borderRadius:"0 10px 10px 10px",padding:"6px 8px",
            fontSize:10,lineHeight:1.4,maxWidth:"90%",boxShadow:"0 1px 2px rgba(0,0,0,0.1)",color:"#111"}}>
            <b>Fecho Lagosta 10mm</b><br/>PIX: R$ 45,00 | Cartão: R$ 50,00
            <div style={{display:"flex",flexDirection:"column",gap:3,marginTop:5}}>
              {["Adicionar ao carrinho","Ver foto","Tirar dúvida"].map(b=>(
                <div key={b} style={{background:"white",border:"1px solid #e0e0e0",borderRadius:6,
                  padding:"4px 8px",fontSize:9,textAlign:"center",color:"#0084ff",fontWeight:500}}>{b}</div>
              ))}
            </div>
            <div style={{fontSize:8,color:"#999",textAlign:"right",marginTop:2}}>09:42</div>
          </div>
        </div>
      </div>
    </div>
  )
}


const Section = ({title, children}) => (
  <div style={{background:"var(--color-background-secondary,#17171a)",border:"1px solid var(--color-border-tertiary,#2a2a30)",borderRadius:10,padding:"16px 18px"}}>
    <div style={{fontSize:13,fontWeight:600,marginBottom:14,color:"var(--color-text-primary)"}}>{title}</div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>{children}</div>
  </div>
)

const Field = ({label, hint, children}) => (
  <div>
    <div style={{fontSize:11,fontWeight:600,color:"var(--color-text-secondary)",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>
      {label}{hint && <span style={{fontWeight:400,textTransform:"none",marginLeft:4,color:"#606070"}}>— {hint}</span>}
    </div>
    {children}
  </div>
)

const inputStyle = {
  width:"100%",boxSizing:"border-box",background:"var(--color-background-tertiary,#101014)",
  border:"1px solid var(--color-border-secondary,#2a2a30)",borderRadius:6,
  padding:"8px 10px",fontSize:12,color:"var(--color-text-primary)",outline:"none"
}

const selStyle = {...inputStyle, cursor:"pointer"}

export default function PageIAConfig({ api }) {
  const [section, setSection] = useState("identidade")
  const [iaName, setIaName] = useState("Molise")
  const [iaPersona, setIaPersona] = useState("Você é Molise, assistente virtual da Só Strass. Simpática, direta e eficiente. Especialista em strass, bijuterias e acessórios.")
  const [tons, setTons] = useState(["Simpática","Direta","Profissional","Prestativa"])
  const [emoji, setEmoji] = useState("moderado")
  const [saved, setSaved] = useState(false)
  const [openCtx, setOpenCtx] = useState("saudacao")
  const [ctxData, setCtxData] = useState(() => {
    const d = {}
    CONTEXTS.forEach(c => { d[c.id] = { default: c.default, vars: [...c.vars] } })
    return d
  })
  const [btns, setBtns] = useState(BTN_GROUPS)
  const [schedule, setSchedule] = useState(
    DIAS.map((d,i) => ({ day:d, on: i<6, start: i===5?"09:00":"08:00", end: i===5?"14:00":"18:00" }))
  )

  const NAV = [
    { id:"identidade",    icon:"✦",  label:"Identidade" },
    { id:"mensagens",     icon:"💬", label:"Mensagens" },
    { id:"botoes",        icon:"⬡",  label:"Botões" },
    { id:"fluxos",        icon:"⟴",  label:"Fluxos" },
    { id:"horario",       icon:"◷",  label:"Horário" },
    { id:"integracoes",   icon:"🔌", label:"Integrações" },
    { id:"logistica",     icon:"📦", label:"Logística" },
  ]

  const salvar = async () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    if (!api) return
    try {
      await fetch(`${api}/api/ia/config`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ iaName, iaPersona, tons, emoji, ctxData, btns, schedule })
      })
    } catch {}
  }

  const saudacaoDefault = ctxData["saudacao"]?.default || ""

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:"#0f0f11",color:"#f0f0f2",
      fontFamily:"system-ui,sans-serif"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"12px 20px",borderBottom:"1px solid #2a2a30",background:"#17171a",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,background:"linear-gradient(135deg,#7c6af7,#a78bfa)",
            borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🤖</div>
          <div>
            <div style={{fontSize:14,fontWeight:600}}>Configuração da IA</div>
            <div style={{fontSize:11,color:"#606070"}}>Personalize o comportamento da {iaName}</div>
          </div>
        </div>
        <button onClick={salvar}
          style={{background: saved?"#34d399":"#7c6af7",color: saved?"#000":"white",
            border:"none",padding:"7px 16px",borderRadius:8,fontSize:12,fontWeight:500,
            cursor:"pointer",transition:"all 0.2s"}}>
          {saved ? "✓ Salvo!" : "Salvar alterações"}
        </button>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* Sidebar */}
        <nav style={{width:180,flexShrink:0,borderRight:"1px solid #2a2a30",
          background:"#17171a",padding:"10px 8px",display:"flex",flexDirection:"column",gap:2}}>
          {NAV.map(n => (
            <div key={n.id} onClick={()=>setSection(n.id)}
              style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,
                cursor:"pointer",fontSize:13,transition:"all 0.15s",
                background: section===n.id ? "rgba(124,106,247,0.1)" : "transparent",
                color: section===n.id ? "#9d8fff" : "#9090a0",
                fontWeight: section===n.id ? 500 : 400}}>
              <span style={{fontSize:14,width:18,textAlign:"center"}}>{n.icon}</span>
              {n.label}
            </div>
          ))}
        </nav>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:20,background:"#0f0f11"}}>

          {/* IDENTIDADE */}
          {section==="identidade" && (
            <div>
              <div style={{fontSize:17,fontWeight:600,marginBottom:4}}>Identidade da IA</div>
              <div style={{fontSize:12,color:"#9090a0",marginBottom:20}}>Configure a personalidade, nome e tom de voz do assistente.</div>

              <div style={{background:"#17171a",border:"1px solid #2a2a30",borderRadius:14,padding:18,marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                  Dados básicos
                  <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(52,211,153,0.1)",color:"#34d399"}}>Ativo</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:500,color:"#9090a0",marginBottom:5}}>Nome da assistente</div>
                    <input value={iaName} onChange={e=>setIaName(e.target.value)}
                      style={{width:"100%",background:"#1e1e22",border:"1px solid #2a2a30",borderRadius:8,
                        padding:"8px 10px",fontSize:13,color:"#f0f0f2",fontFamily:"inherit",outline:"none"}}/>
                  </div>
                  <div>
                    <div style={{fontSize:11,fontWeight:500,color:"#9090a0",marginBottom:5}}>Empresa / Marca</div>
                    <input defaultValue="Só Strass"
                      style={{width:"100%",background:"#1e1e22",border:"1px solid #2a2a30",borderRadius:8,
                        padding:"8px 10px",fontSize:13,color:"#f0f0f2",fontFamily:"inherit",outline:"none"}}/>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:500,color:"#9090a0",marginBottom:5}}>Persona</div>
                  <textarea value={iaPersona} onChange={e=>setIaPersona(e.target.value)} rows={4}
                    style={{width:"100%",background:"#1e1e22",border:"1px solid #2a2a30",borderRadius:8,
                      padding:"8px 10px",fontSize:12,color:"#f0f0f2",fontFamily:"inherit",
                      outline:"none",resize:"vertical",lineHeight:1.5}}/>
                </div>
              </div>

              <div style={{background:"#17171a",border:"1px solid #2a2a30",borderRadius:14,padding:18}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:14}}>Tom de voz</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                  {TONS.map(t => (
                    <div key={t} onClick={()=>setTons(ts=>ts.includes(t)?ts.filter(x=>x!==t):[...ts,t])}
                      style={{padding:"5px 12px",borderRadius:20,border:"1px solid",fontSize:12,cursor:"pointer",
                        transition:"all 0.15s",
                        borderColor: tons.includes(t)?"#7c6af7":"#2a2a30",
                        background: tons.includes(t)?"rgba(124,106,247,0.1)":"#1e1e22",
                        color: tons.includes(t)?"#9d8fff":"#9090a0",
                        fontWeight: tons.includes(t)?500:400}}>
                      {t}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:500,color:"#9090a0",marginBottom:5}}>Uso de emojis</div>
                  <select value={emoji} onChange={e=>setEmoji(e.target.value)}
                    style={{background:"#1e1e22",border:"1px solid #2a2a30",borderRadius:8,
                      padding:"8px 10px",fontSize:12,color:"#f0f0f2",fontFamily:"inherit",outline:"none",width:"100%"}}>
                    <option value="moderado">Moderado — apenas em momentos-chave</option>
                    <option value="minimo">Mínimo — quase nenhum</option>
                    <option value="frequente">Frequente — em toda resposta</option>
                    <option value="nenhum">Nenhum — somente texto</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* MENSAGENS */}
          {section==="mensagens" && (
            <div>
              <div style={{fontSize:17,fontWeight:600,marginBottom:4}}>Mensagens e frases</div>
              <div style={{fontSize:12,color:"#9090a0",marginBottom:14}}>Edite as frases por contexto. Adicione variações — a IA escolhe aleatoriamente.</div>

              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
                {ALIASES.map(a => (
                  <span key={a} onClick={()=>{navigator.clipboard?.writeText(a)}}
                    style={{fontFamily:"monospace",fontSize:11,padding:"3px 8px",borderRadius:6,
                      background:"#26262b",border:"1px solid #333339",color:"#60a5fa",cursor:"pointer"}}>
                    {a}
                  </span>
                ))}
              </div>

              {CONTEXTS.map(ctx => (
                <div key={ctx.id} style={{border:"1px solid #2a2a30",borderRadius:14,overflow:"hidden",marginBottom:10}}>
                  <div onClick={()=>setOpenCtx(openCtx===ctx.id?null:ctx.id)}
                    style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",
                      cursor:"pointer",background:"#17171a",userSelect:"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:ctx.color,flexShrink:0}}/>
                      <span style={{fontSize:13,fontWeight:500}}>{ctx.label}</span>
                      <span style={{fontSize:11,color:"#606070"}}>
                        {1 + (ctxData[ctx.id]?.vars.length||0)} variação{(1+(ctxData[ctx.id]?.vars.length||0))!==1?"ões":""}
                      </span>
                    </div>
                    <span style={{fontSize:11,color:"#606070",transform:openCtx===ctx.id?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▼</span>
                  </div>
                  {openCtx===ctx.id && (
                    <div style={{background:"#0f0f11",padding:"14px 16px"}}>
                      <div style={{marginBottom:10}}>
                        <div style={{fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",
                          color:"#34d399",padding:"2px 6px",background:"rgba(52,211,153,0.1)",
                          borderRadius:4,display:"inline-block",marginBottom:5}}>Padrão</div>
                        <textarea value={ctxData[ctx.id]?.default||""}
                          onChange={e=>setCtxData(d=>({...d,[ctx.id]:{...d[ctx.id],default:e.target.value}}))}
                          rows={3}
                          style={{width:"100%",background:"rgba(52,211,153,0.05)",border:"1px solid #34d399",
                            borderRadius:8,padding:"8px 10px",color:"#f0f0f2",fontFamily:"inherit",
                            fontSize:12,lineHeight:1.5,resize:"vertical",outline:"none"}}/>
                      </div>
                      <VariationEditor
                        vars={ctxData[ctx.id]?.vars||[]}
                        setVars={v=>setCtxData(d=>({...d,[ctx.id]:{...d[ctx.id],vars:v}}))}
                        context={ctx.id}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* BOTÕES */}
          {section==="botoes" && (
            <div>
              <div style={{fontSize:17,fontWeight:600,marginBottom:4}}>Botões interativos</div>
              <div style={{fontSize:12,color:"#9090a0",marginBottom:20}}>Configure os labels. Máx. 3 botões por mensagem, 20 caracteres cada.</div>
              {btns.map((group,gi) => (
                <div key={gi} style={{background:"#17171a",border:"1px solid #2a2a30",borderRadius:14,padding:18,marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:600,marginBottom:14}}>{group.label}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {group.btns.map((b,bi) => (
                      <div key={bi} style={{display:"flex",alignItems:"center",gap:10,
                        background:"#1e1e22",border:"1px solid #2a2a30",borderRadius:8,padding:"9px 12px"}}>
                        <span style={{color:"#606070",cursor:"grab"}}>⠿</span>
                        <input value={b.label} maxLength={20}
                          onChange={e=>setBtns(bg=>bg.map((g,gii)=>gii!==gi?g:{...g,btns:g.btns.map((x,bii)=>bii!==bi?x:{...x,label:e.target.value})}))}
                          style={{flex:1,background:"transparent",border:"none",fontSize:13,color:"#f0f0f2",
                            fontFamily:"inherit",outline:"none"}}/>
                        <span style={{fontSize:10,color:"#606070",fontFamily:"monospace"}}>{b.label.length}/20</span>
                        <div onClick={()=>setBtns(bg=>bg.map((g,gii)=>gii!==gi?g:{...g,btns:g.btns.map((x,bii)=>bii!==bi?x:{...x,on:!x.on})}))}
                          style={{width:28,height:16,background:b.on?"#34d399":"#26262b",
                            border:`1px solid ${b.on?"#34d399":"#2a2a30"}`,borderRadius:8,
                            position:"relative",cursor:"pointer",transition:"all 0.2s",flexShrink:0}}>
                          <div style={{position:"absolute",width:10,height:10,background:"white",borderRadius:"50%",
                            top:2,left:2,transition:"transform 0.2s",transform:b.on?"translateX(12px)":"none"}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FLUXOS */}
          {section==="fluxos" && (
            <div>
              <div style={{fontSize:17,fontWeight:600,marginBottom:4}}>Fluxos de compra</div>
              <div style={{fontSize:12,color:"#9090a0",marginBottom:20}}>Configure os textos de cada etapa do fluxo de finalização.</div>
              <div style={{background:"#17171a",border:"1px solid #2a2a30",borderRadius:14,padding:18}}>
                {[
                  {num:1,label:"Solicitação de CPF/CNPJ",id:"cpf"},
                  {num:2,label:"Confirmação de endereço",id:"endereco"},
                  {num:3,label:"Pedido criado — link PIX",id:"pix"},
                ].map((step,i,arr) => (
                  <div key={step.id} style={{display:"flex",gap:14,marginBottom:i<arr.length-1?20:0}}>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
                      <div style={{width:26,height:26,background:"rgba(124,106,247,0.1)",
                        border:"1px solid #7c6af7",borderRadius:"50%",display:"flex",
                        alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#9d8fff"}}>
                        {step.num}
                      </div>
                      {i<arr.length-1 && <div style={{flex:1,width:1,background:"#2a2a30",margin:"4px 0",minHeight:20}}/>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:500,marginBottom:8}}>{step.label}</div>
                      <VariationEditor
                        vars={ctxData[step.id]?.vars||[]}
                        setVars={v=>setCtxData(d=>({...d,[step.id]:{...d[step.id],vars:v}}))}
                        context={step.id}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HORÁRIO */}
          {section==="horario" && (
            <div>
              <div style={{fontSize:17,fontWeight:600,marginBottom:4}}>Horário de atendimento</div>
              <div style={{fontSize:12,color:"#9090a0",marginBottom:20}}>Defina quando a IA está ativa.</div>
              <div style={{background:"#17171a",border:"1px solid #2a2a30",borderRadius:14,padding:18,marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:14}}>Dias e horários</div>
                {schedule.map((s,i) => (
                  <div key={s.day} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",
                    borderBottom:i<schedule.length-1?"1px solid #1e1e22":"none"}}>
                    <div style={{width:72,fontSize:12,fontWeight:500}}>{s.day}</div>
                    <input value={s.start} onChange={e=>setSchedule(sc=>sc.map((x,xi)=>xi!==i?x:{...x,start:e.target.value}))}
                      style={{background:"#1e1e22",border:"1px solid #2a2a30",borderRadius:6,
                        padding:"4px 8px",fontSize:12,color:"#f0f0f2",fontFamily:"monospace",
                        outline:"none",width:68,textAlign:"center"}}/>
                    <span style={{fontSize:11,color:"#606070"}}>às</span>
                    <input value={s.end} onChange={e=>setSchedule(sc=>sc.map((x,xi)=>xi!==i?x:{...x,end:e.target.value}))}
                      style={{background:"#1e1e22",border:"1px solid #2a2a30",borderRadius:6,
                        padding:"4px 8px",fontSize:12,color:"#f0f0f2",fontFamily:"monospace",
                        outline:"none",width:68,textAlign:"center"}}/>
                    <div onClick={()=>setSchedule(sc=>sc.map((x,xi)=>xi!==i?x:{...x,on:!x.on}))}
                      style={{width:28,height:16,background:s.on?"#34d399":"#26262b",
                        border:`1px solid ${s.on?"#34d399":"#2a2a30"}`,borderRadius:8,
                        position:"relative",cursor:"pointer",transition:"all 0.2s",marginLeft:"auto",flexShrink:0}}>
                      <div style={{position:"absolute",width:10,height:10,background:"white",borderRadius:"50%",
                        top:2,left:2,transition:"transform 0.2s",transform:s.on?"translateX(12px)":"none"}}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{background:"#17171a",border:"1px solid #2a2a30",borderRadius:14,padding:18}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:12}}>Mensagem fora do horário</div>
                <VariationEditor
                  vars={ctxData["offline"]?.vars||[]}
                  setVars={v=>setCtxData(d=>({...d,offline:{...d.offline,vars:v}}))}
                  context="offline"
                />
              </div>
            </div>
          )}

        </div>

          {/* ── Integrações ────────────────────────────────────── */}
          {tab === "integracoes" && (
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <div style={{fontSize:13,color:"#a0a0b0",lineHeight:1.6}}>
                Configure as credenciais de integração. Os campos ficam criptografados no banco — exibidos mascarados após salvar.
              </div>

              {/* IA */}
              <Section title="🤖 Inteligência Artificial">
                <Field label="Provedor" hint="google ou anthropic">
                  <select value={cfg.provedor||"google"} onChange={e=>setCfg(c=>({...c,provedor:e.target.value}))} style={selStyle}>
                    <option value="google">Google Gemini</option>
                    <option value="anthropic">Anthropic Claude</option>
                  </select>
                </Field>
                <Field label="Modelo">
                  <input style={inputStyle} value={cfg.modelo||""} onChange={e=>setCfg(c=>({...c,modelo:e.target.value}))} placeholder="gemini-2.5-flash" />
                </Field>
                <Field label="API Key Gemini">
                  <input style={inputStyle} type="password" value={cfg.geminiKey||""} onChange={e=>setCfg(c=>({...c,geminiKey:e.target.value}))} placeholder="AIza..." />
                </Field>
                <Field label="API Key Claude">
                  <input style={inputStyle} type="password" value={cfg.claudeKey||""} onChange={e=>setCfg(c=>({...c,claudeKey:e.target.value}))} placeholder="sk-ant-..." />
                </Field>
              </Section>

              {/* Melhor Envio */}
              <Section title="🚚 Melhor Envio">
                <Field label="Token de autenticação" hint="Bearer eyJ...">
                  <input style={inputStyle} type="password" value={cfg.melhorEnvioToken||""} onChange={e=>setCfg(c=>({...c,melhorEnvioToken:e.target.value}))} placeholder="eyJ0eXAi..." />
                </Field>
              </Section>

              {/* Correios */}
              <Section title="📮 Correios">
                <Field label="Usuário Meu Correios" hint="CPF ou CNPJ">
                  <input style={inputStyle} value={cfg.correiosUsuario||""} onChange={e=>setCfg(c=>({...c,correiosUsuario:e.target.value}))} placeholder="42614714000130" />
                </Field>
                <Field label="Cartão de postagem">
                  <input style={inputStyle} value={cfg.correiosCartao||""} onChange={e=>setCfg(c=>({...c,correiosCartao:e.target.value}))} placeholder="0076589811" />
                </Field>
                <Field label="Contrato">
                  <input style={inputStyle} value={cfg.correiosContrato||""} onChange={e=>setCfg(c=>({...c,correiosContrato:e.target.value}))} placeholder="9912544869" />
                </Field>
                <Field label="Código de acesso APIs">
                  <input style={inputStyle} type="password" value={cfg.correiosApiKey||""} onChange={e=>setCfg(c=>({...c,correiosApiKey:e.target.value}))} placeholder="079LUEmz..." />
                </Field>
              </Section>

              {/* PIX */}
              <Section title="💰 Pagamento PIX (fallback)">
                <Field label="Chave PIX" hint="Usada quando Bling não gera link">
                  <input style={inputStyle} value={cfg.pixChave||""} onChange={e=>setCfg(c=>({...c,pixChave:e.target.value}))} placeholder="CNPJ, e-mail ou telefone" />
                </Field>
              </Section>
            </div>
          )}

          {/* ── Logística ────────────────────────────────────────── */}
          {tab === "logistica" && (
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <Section title="📦 Dimensões da Embalagem Padrão">
                <div style={{fontSize:12,color:"#a0a0b0",marginBottom:8}}>
                  Usadas para cotação de frete. Configure conforme a caixa padrão de envio.
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Field label="Altura (cm)">
                    <input style={inputStyle} type="number" value={cfg.caixaAltura||"8"} onChange={e=>setCfg(c=>({...c,caixaAltura:e.target.value}))} />
                  </Field>
                  <Field label="Largura (cm)">
                    <input style={inputStyle} type="number" value={cfg.caixaLargura||"26"} onChange={e=>setCfg(c=>({...c,caixaLargura:e.target.value}))} />
                  </Field>
                  <Field label="Comprimento (cm)">
                    <input style={inputStyle} type="number" value={cfg.caixaComprimento||"16"} onChange={e=>setCfg(c=>({...c,caixaComprimento:e.target.value}))} />
                  </Field>
                  <Field label="Peso mínimo (kg)">
                    <input style={inputStyle} type="number" step="0.1" value={cfg.caixaPesoMinimo||"0.3"} onChange={e=>setCfg(c=>({...c,caixaPesoMinimo:e.target.value}))} />
                  </Field>
                </div>
              </Section>

              <Section title="🏠 Loja">
                <Field label="CEP de origem" hint="CEP da sua loja para calcular fretes">
                  <input style={inputStyle} value={cfg.cepOrigem||""} onChange={e=>setCfg(c=>({...c,cepOrigem:e.target.value}))} placeholder="13480000" />
                </Field>
                <Field label="Nome da loja">
                  <input style={inputStyle} value={cfg.nomeLoja||""} onChange={e=>setCfg(c=>({...c,nomeLoja:e.target.value}))} placeholder="Só Strass" />
                </Field>
                <Field label="Horário de atendimento">
                  <input style={inputStyle} value={cfg.horarioAtendimento||""} onChange={e=>setCfg(c=>({...c,horarioAtendimento:e.target.value}))} placeholder="08:00-18:00" />
                </Field>
                <Field label="Dias de atendimento">
                  <input style={inputStyle} value={cfg.diasAtendimento||""} onChange={e=>setCfg(c=>({...c,diasAtendimento:e.target.value}))} placeholder="seg-sex" />
                </Field>
              </Section>
            </div>
          )}


        {/* Preview */}
        <div style={{width:290,flexShrink:0,borderLeft:"1px solid #2a2a30",background:"#17171a",
          display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 16px",gap:14,overflowY:"auto"}}>
          <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",
            color:"#606070",alignSelf:"flex-start"}}>Preview — WhatsApp</div>
          <PhonePreview iaName={iaName} greeting={saudacaoDefault} />
          <div style={{fontSize:11,color:"#606070",textAlign:"center",lineHeight:1.6}}>
            Edite a saudação ou o nome<br/>para ver atualizar em tempo real
          </div>
        </div>

      </div>
    </div>
  )
}
