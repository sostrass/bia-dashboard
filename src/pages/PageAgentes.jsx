import { useState } from 'react'
import { Bot, Brain, Zap, Shield, Clock, Check, Plus, Trash2 } from 'lucide-react'

const MODELS = [
  {id:'gemini-2.0-flash',name:'Gemini 2.0 Flash',desc:'Rápido e econômico — ideal para produção',badge:'Recomendado',level:2,c:'var(--accent)'},
  {id:'gemini-2.5-flash',name:'Gemini 2.5 Flash',desc:'Inteligente com boa velocidade',badge:'Balanceado',level:3,c:'var(--teal)'},
  {id:'gemini-2.5-pro',name:'Gemini 2.5 Pro',desc:'Máxima inteligência disponível',badge:'Premium',level:5,c:'var(--purple)'},
]
const DEF_QR = [
  {id:1,trigger:'prazo de entrega',text:'O prazo é de 5 a 10 dias úteis via Correios. Para capitais pode ser 2 a 5 dias.'},
  {id:2,trigger:'frete grátis',text:'Frete grátis para compras acima de R$ 150,00 para todo o Brasil!'},
  {id:3,trigger:'troca devolução',text:'Você tem 7 dias após o recebimento para solicitar troca ou devolução. Me informe o número do pedido!'},
]
const DEF_BH = [
  {id:'emoji',label:'Usar emojis',desc:'Inclui emojis para deixar mensagens mais amigáveis',on:true},
  {id:'proactive',label:'Perguntar se precisa de mais ajuda',desc:'Ao finalizar, sempre pergunta se pode ajudar mais',on:true},
  {id:'upsell',label:'Sugerir produtos relacionados',desc:'Sugere itens complementares ao produto consultado',on:false},
  {id:'review',label:'Solicitar avaliação após entrega',desc:'Pede nota 24h após confirmação de entrega',on:true},
  {id:'escalate',label:'Escalar para humano se insatisfeito',desc:'Notifica a equipe após 2 tentativas frustradas',on:false},
  {id:'formal',label:'Tom formal',desc:'Linguagem mais profissional e formal',on:false},
]

function Toggle({on,onChange}) {
  return (
    <button onClick={()=>onChange(!on)} className="relative w-11 h-6 rounded-full transition-all flex-shrink-0" style={{background:on?'var(--accent)':'var(--bg-4)'}}>
      <span className="absolute top-0.5 h-5 w-5 bg-white rounded-full shadow-sm transition-all duration-200" style={{left:on?'calc(100% - 22px)':'2px'}}/>
    </button>
  )
}

const SECTIONS = [
  {id:'persona',icon:Bot,label:'Persona'},
  {id:'modelo',icon:Brain,label:'Modelo IA'},
  {id:'respostas',icon:Zap,label:'Respostas Rápidas'},
  {id:'regras',icon:Shield,label:'Regras'},
  {id:'tempos',icon:Clock,label:'Tempos'},
]

export default function PageAgentes({ api }) {
  const [sec,setSec]       = useState('persona')
  const [model,setModel]   = useState('gemini-2.0-flash')
  const [temp,setTemp]     = useState(70)
  const [apiKey,setApiKey] = useState('')
  const [nome,setNome]     = useState('Bia')
  const [loja,setLoja]     = useState('Armarinhos & Bijuterias')
  const [persona,setPersona] = useState(`Você é Bia, assistente virtual especializada em acessórios de armarinho e bijuterias. Você é simpática, objetiva e resolve tudo sem precisar de humanos.

Ao atender:
- Apresente-se pelo nome na primeira mensagem
- Use linguagem leve e acolhedora
- Seja rápida e objetiva
- Nunca diga "não posso" — você sempre resolve`)
  const [qrs,setQrs]       = useState(DEF_QR)
  const [bhs,setBhs]       = useState(DEF_BH)
  const [ntrig,setNtrig]   = useState('')
  const [nrep,setNrep]     = useState('')
  const [saved,setSaved]   = useState(false)

  const save = async () => {
    try { await fetch(`${api}/api/ia/config`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({geminiKey:apiKey||undefined,modelo:model,temperatura:(temp/100).toString(),nome,loja,persona,quickReplies:qrs,behaviors:bhs})}); setSaved(true); setTimeout(()=>setSaved(false),3000) }
    catch { alert('Erro ao salvar.') }
  }

  const inp = {background:'var(--bg-3)',border:'1px solid var(--sep)',borderRadius:10,color:'var(--label)',outline:'none',padding:'9px 12px',fontSize:13,fontFamily:'inherit',transition:'border-color .15s',width:'100%'}
  const focus = e => e.target.style.borderColor='var(--accent)'
  const blur  = e => e.target.style.borderColor='var(--sep)'

  return (
    <div className="h-full flex overflow-hidden">
      {/* left nav */}
      <div className="w-[200px] flex-shrink-0 py-3" style={{background:'var(--bg-2)',borderRight:'1px solid var(--sep)'}}>
        <div className="px-4 py-2 text-[17px] font-semibold mb-2" style={{color:'var(--label)',borderBottom:'1px solid var(--sep)',paddingBottom:12}}>Agentes IA</div>
        {SECTIONS.map(s=>(
          <button key={s.id} onClick={()=>setSec(s.id)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] border-l-2 transition-all"
            style={{background:sec===s.id?'var(--accent-dim)':'transparent',borderLeftColor:sec===s.id?'var(--accent)':'transparent',color:sec===s.id?'var(--accent)':'var(--label-2)',fontWeight:sec===s.id?600:400}}>
            <s.icon size={14}/>{s.label}
          </button>
        ))}
        <div className="px-4 mt-4 pt-4" style={{borderTop:'1px solid var(--sep)'}}>
          <button onClick={save} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all" style={{background:saved?'var(--teal)':'var(--accent)',color:'#000'}}>
            {saved?<><Check size={13}/>Salvo!</>:<>Salvar Agente</>}
          </button>
        </div>
      </div>

      {/* content */}
      <div className="flex-1 overflow-y-auto scroll-hidden p-6">
        <div className="max-w-3xl mx-auto space-y-5">

          {sec==='persona' && <>
            <h2 className="text-[20px] font-bold" style={{color:'var(--label)'}}>Persona & Identidade</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4 space-y-3">
                <h3 className="text-[14px] font-semibold" style={{color:'var(--label)'}}>Identidade</h3>
                <div><label className="text-[11px] font-medium block mb-1.5" style={{color:'var(--label-3)'}}>NOME DA IA</label><input value={nome} onChange={e=>setNome(e.target.value)} style={inp} onFocus={focus} onBlur={blur}/></div>
                <div><label className="text-[11px] font-medium block mb-1.5" style={{color:'var(--label-3)'}}>NOME DA LOJA</label><input value={loja} onChange={e=>setLoja(e.target.value)} style={inp} onFocus={focus} onBlur={blur}/></div>
                <div>
                  <label className="text-[11px] font-medium block mb-1.5" style={{color:'var(--label-3)'}}>CHAVE GEMINI API</label>
                  <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="AIzaSy..." style={{...inp,fontFamily:'monospace',fontSize:11}} onFocus={focus} onBlur={blur}/>
                  <p className="text-[10px] mt-1" style={{color:apiKey.length>10?'var(--accent)':'var(--label-4)'}}>{apiKey.length>10?'✓ Chave válida':'aistudio.google.com → Get API Key'}</p>
                </div>
              </div>
              <div className="card p-4">
                <h3 className="text-[14px] font-semibold mb-3" style={{color:'var(--label)'}}>Preview do Agente</h3>
                <div className="space-y-2">
                  {[{r:'u',t:'Oi, tem linha de bordado?'},{r:'b',t:`Olá! Sou ${nome||'Bia'} da ${loja||'nossa loja'}! 😊 Sim, temos linha de bordado em várias espessuras. Qual tipo procura?`},{r:'u',t:'Nº8 branca'},{r:'b',t:'Linha Nº8 Branca — R$ 4,90/novelo. Faço o pedido pra você?'}].map((m,i)=>(
                    <div key={i} className={`flex ${m.r==='b'?'justify-start':'justify-end'}`}>
                      <div className="max-w-[85%] px-3 py-2 rounded-[14px] text-[11px] leading-relaxed"
                        style={{background:m.r==='u'?'var(--blue)':'var(--bg-3)',color:m.r==='u'?'#fff':'var(--label)',borderBottomLeftRadius:m.r==='b'?3:14,borderBottomRightRadius:m.r==='u'?3:14,border:m.r==='b'?'1px solid var(--sep)':'none'}}>
                        {m.t}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[14px] font-semibold" style={{color:'var(--label)'}}>System Prompt — Ensine a IA</h3>
                <span className="text-[11px]" style={{color:'var(--label-3)'}}>{persona.length} chars</span>
              </div>
              <p className="text-[12px] mb-3" style={{color:'var(--label-3)'}}>Escreva como a IA deve se comportar, o que deve e não deve dizer, tom de voz, etc.</p>
              <textarea value={persona} onChange={e=>setPersona(e.target.value)} rows={8} style={{...inp,fontFamily:'monospace',fontSize:11,lineHeight:1.7,resize:'none'}} onFocus={focus} onBlur={blur}/>
            </div>
          </>}

          {sec==='modelo' && <>
            <h2 className="text-[20px] font-bold" style={{color:'var(--label)'}}>Modelo de Inteligência</h2>
            <div className="space-y-3">
              {MODELS.map(m=>(
                <div key={m.id} onClick={()=>setModel(m.id)} className="card p-4 cursor-pointer transition-all" style={{border:`1px solid ${model===m.id?m.c:'var(--sep)'}`,background:model===m.id?`color-mix(in srgb, ${m.c} 8%, var(--bg-2))`:'var(--bg-2)'}}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-[15px] font-semibold" style={{color:'var(--label)'}}>{m.name}</div>
                      <div className="text-[12px] mt-0.5" style={{color:'var(--label-3)'}}>{m.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge text-[10px]" style={{background:`${m.c}18`,color:m.c}}>{m.badge}</span>
                      {model===m.id&&<span className="w-5 h-5 rounded-full flex items-center justify-center" style={{background:m.c,color:'#000'}}><Check size={11}/></span>}
                    </div>
                  </div>
                  <div className="h-1 rounded-full mt-3" style={{background:'var(--sep)'}}>
                    <div className="h-full rounded-full transition-all" style={{width:`${m.level*20}%`,background:m.c}}/>
                  </div>
                </div>
              ))}
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[15px] font-semibold" style={{color:'var(--label)'}}>Criatividade das Respostas</div>
                  <div className="text-[12px]" style={{color:'var(--label-3)'}}>Temperatura — quanto maior, mais criativo</div>
                </div>
                <span className="text-[24px] font-bold" style={{color:'var(--accent)'}}>{temp}%</span>
              </div>
              <input type="range" min={0} max={100} value={temp} onChange={e=>setTemp(parseInt(e.target.value))} className="w-full" style={{accentColor:'var(--accent)'}}/>
              <div className="flex justify-between text-[10px] mt-1" style={{color:'var(--label-3)'}}>
                <span>🎯 Preciso</span><span>⚖️ Balanceado</span><span>🎨 Criativo</span>
              </div>
            </div>
          </>}

          {sec==='respostas' && <>
            <h2 className="text-[20px] font-bold" style={{color:'var(--label)'}}>Respostas Rápidas</h2>
            <p className="text-[13px]" style={{color:'var(--label-3)'}}>A IA usará essas respostas quando detectar as palavras-chave nas mensagens dos clientes.</p>
            <div className="card p-4 space-y-3" style={{border:'1px solid var(--accent)',background:'var(--accent-dim)'}}>
              <h3 className="text-[14px] font-semibold flex items-center gap-2" style={{color:'var(--accent)'}}><Plus size={14}/>Nova Resposta Rápida</h3>
              <div><label className="text-[11px] font-medium block mb-1.5" style={{color:'var(--label-3)'}}>PALAVRA-CHAVE DO CLIENTE</label><input value={ntrig} onChange={e=>setNtrig(e.target.value)} placeholder='Ex: "prazo", "frete grátis", "cancelar"' style={inp} onFocus={focus} onBlur={blur}/></div>
              <div><label className="text-[11px] font-medium block mb-1.5" style={{color:'var(--label-3)'}}>RESPOSTA DA IA</label><textarea value={nrep} onChange={e=>setNrep(e.target.value)} rows={3} placeholder="Resposta que a IA enviará ao detectar a palavra-chave..." style={{...inp,resize:'none',lineHeight:1.6}} onFocus={focus} onBlur={blur}/></div>
              <button onClick={()=>{if(!ntrig||!nrep)return;setQrs([...qrs,{id:Date.now(),trigger:ntrig,text:nrep}]);setNtrig('');setNrep('')}} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all" style={{background:'var(--accent)',color:'#000'}}>Adicionar</button>
            </div>
            <div className="space-y-3">
              {qrs.map(r=>(
                <div key={r.id} className="card p-4 flex items-start gap-3 group">
                  <div className="flex-1">
                    <span className="badge text-[10px] font-mono mb-2 inline-block" style={{background:'rgba(191,90,242,0.12)',color:'var(--purple)'}}>🔍 "{r.trigger}"</span>
                    <p className="text-[13px] leading-relaxed" style={{color:'var(--label-2)'}}>{r.text}</p>
                  </div>
                  <button onClick={()=>setQrs(qrs.filter(x=>x.id!==r.id))} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-[8px]" style={{color:'var(--red)'}}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              ))}
            </div>
          </>}

          {sec==='regras' && <>
            <h2 className="text-[20px] font-bold" style={{color:'var(--label)'}}>Regras de Comportamento</h2>
            <p className="text-[13px]" style={{color:'var(--label-3)'}}>Ative ou desative comportamentos específicos da IA.</p>
            <div className="card overflow-hidden">
              {bhs.map((b,i)=>(
                <div key={b.id} className="flex items-center gap-4 px-5 py-4" style={{borderBottom:i<bhs.length-1?'1px solid var(--sep)':'none'}}>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium" style={{color:'var(--label)'}}>{b.label}</div>
                    <div className="text-[12px] mt-0.5" style={{color:'var(--label-3)'}}>{b.desc}</div>
                  </div>
                  <Toggle on={b.on} onChange={v=>setBhs(bhs.map(x=>x.id===b.id?{...x,on:v}:x))}/>
                </div>
              ))}
            </div>
          </>}

          {sec==='tempos' && <>
            <h2 className="text-[20px] font-bold" style={{color:'var(--label)'}}>Configurações de Tempo</h2>
            <div className="card p-5 grid grid-cols-2 gap-4">
              {[
                {l:'Delay mínimo de resposta (ms)',v:'800',d:'Simula digitação humana'},
                {l:'Timeout de sessão (min)',v:'60',d:'Limpa histórico após inatividade'},
                {l:'Lembrete pagamento pendente (h)',v:'2',d:'Reenvio automático do link'},
                {l:'Avaliação após entrega (h)',v:'24',d:'Solicita nota automaticamente'},
                {l:'Retry em caso de erro (tentativas)',v:'3',d:'Retentativas automáticas'},
                {l:'Delay entre envios em massa (ms)',v:'1500',d:'Respeita rate limit do WhatsApp'},
              ].map((f,i)=>(
                <div key={i}>
                  <label className="text-[11px] font-medium block mb-1.5" style={{color:'var(--label-3)'}}>{f.l}</label>
                  <input defaultValue={f.v} style={{...inp,fontFamily:'monospace'}} onFocus={focus} onBlur={blur}/>
                  <p className="text-[10px] mt-1" style={{color:'var(--label-4)'}}>{f.d}</p>
                </div>
              ))}
            </div>
          </>}

        </div>
      </div>
    </div>
  )
}
