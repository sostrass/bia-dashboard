import { useState } from 'react'
import { Send, Users } from 'lucide-react'

const CAT_C = {Bijuterias:'#BF5AF2',P\u00e9rolas:'#FFD60A','Linhas/Fios':'#32D74B','Fitas/Rendas':'#FF453A',Mi\u00e7angas:'#FF9F0A',Atacado:'#0A84FF',Z\u00edperes:'#FF453A',Bot\u00f5es:'#BF5AF2'}
const CONTACTS = [
  {tel:'11 9xxxx-4821',nome:'Maria F.',cats:['Bijuterias','P\u00e9rolas'],msgs:12,ultima:'Hoje 14:32'},
  {tel:'21 9xxxx-3310',nome:'Jo\u00e3o C.',cats:['Linhas/Fios'],msgs:5,ultima:'Hoje 14:18'},
  {tel:'31 9xxxx-7744',nome:'Ana S.',cats:['Fitas/Rendas','Bijuterias'],msgs:8,ultima:'Hoje 14:05'},
  {tel:'85 9xxxx-5512',nome:'Lucia M.',cats:['P\u00e9rolas','Mi\u00e7angas'],msgs:22,ultima:'Hoje 13:22'},
  {tel:'48 9xxxx-8831',nome:'Pedro T.',cats:['Z\u00edperes','Bot\u00f5es'],msgs:4,ultima:'Hoje 13:10'},
  {tel:'11 9xxxx-2255',nome:'Carla R.',cats:['Atacado','Bijuterias'],msgs:31,ultima:'Hoje 12:55'},
  {tel:'41 9xxxx-6634',nome:'Felipe N.',cats:['Mi\u00e7angas'],msgs:7,ultima:'Ontem 15:20'},
  {tel:'19 9xxxx-0081',nome:'Sandra L.',cats:['P\u00e9rolas'],msgs:18,ultima:'Ontem 11:45'},
]

export default function PageContatos({ api }) {
  const [filter,setFilter]=useState('Todas')
  const [massaMsg,setMassaMsg]=useState('')
  const [massaCat,setMassaCat]=useState('Todas')
  const allCats=['Todas',...Object.keys(CAT_C)]
  const filtered=filter==='Todas'?CONTACTS:CONTACTS.filter(c=>c.cats.includes(filter))
  const massaCount=(massaCat==='Todas'?CONTACTS:CONTACTS.filter(c=>c.cats.includes(massaCat))).length
  const dispatch=async()=>{
    if(!massaMsg.trim()){alert('Digite uma mensagem!');return}
    try{const r=await fetch(`${api}/api/contatos/enviar-massa`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({categoria:massaCat==='Todas'?null:massaCat,mensagem:massaMsg})});const d=await r.json();alert(`Disparando para ${d.total} contatos!`)}
    catch{alert('Erro ao disparar.')}
  }
  const inp = {background:'var(--bg-3)',border:'1px solid var(--sep)',color:'var(--label)',borderRadius:10,outline:'none',transition:'border-color .15s',fontFamily:'inherit'}

  return (
    <div className="h-full flex overflow-hidden p-5 gap-5">
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-bold tracking-tight" style={{color:'var(--label)'}}>Contatos</h2>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold" style={{background:'var(--fill)',color:'var(--label-2)'}}>
            <Users size={12}/> {CONTACTS.length} total
          </span>
        </div>
        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {allCats.map(c=>(
            <button key={c} onClick={()=>setFilter(c)}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all"
              style={{background:filter===c?'var(--accent-dim)':'transparent',borderColor:filter===c?'var(--accent)':'var(--sep)',color:filter===c?'var(--accent)':'var(--label-3)'}}>
              {c}
            </button>
          ))}
        </div>
        {/* Table */}
        <div className="card overflow-hidden flex flex-col flex-1">
          <table className="w-full">
            <thead>
              <tr style={{borderBottom:'1px solid var(--sep)'}}>
                {['Cliente','Categorias','Mensagens','\u00daltimo contato'].map(h=>(
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{color:'var(--label-3)'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c,i)=>(
                <tr key={i} className="transition-all" style={{borderBottom:'1px solid var(--sep)'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--fill)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{background:CAT_C[c.cats[0]]||'#636366',color:'#000'}}>{c.nome.slice(0,2).toUpperCase()}</div>
                      <div>
                        <div className="text-[13px] font-semibold" style={{color:'var(--label)'}}>{c.nome}</div>
                        <div className="text-[11px] font-mono" style={{color:'var(--label-3)'}}>{c.tel}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {c.cats.map(cat=>(
                        <span key={cat} className="badge text-[10px]" style={{background:`${CAT_C[cat]||'#fff'}18`,color:CAT_C[cat]||'var(--label-2)'}}>{cat}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[13px] font-semibold" style={{color:'var(--label)'}}>{c.msgs}</td>
                  <td className="px-5 py-3 text-[12px]" style={{color:'var(--label-3)'}}>{c.ultima}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Massa panel */}
      <div className="w-72 flex-shrink-0 card p-5 flex flex-col gap-4 overflow-y-auto scroll-hidden">
        <div>
          <h3 className="text-[17px] font-semibold" style={{color:'var(--label)'}}>Envio em Massa</h3>
          <p className="text-[12px] mt-0.5" style={{color:'var(--label-3)'}}>Segmente e dispare mensagens</p>
        </div>
        <div>
          <label className="text-[11px] font-medium block mb-1.5" style={{color:'var(--label-3)'}}>CATEGORIA</label>
          <select value={massaCat} onChange={e=>setMassaCat(e.target.value)} className="w-full px-3 py-2 text-[13px]" style={{...inp,fontSize:13}}>
            {allCats.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium block mb-1.5" style={{color:'var(--label-3)'}}>MENSAGEM <span className="normal-case font-normal">\u2014 use {'{{nome}}'}</span></label>
          <textarea value={massaMsg} onChange={e=>setMassaMsg(e.target.value)} rows={6}
            className="w-full px-3 py-2 text-[13px] resize-none"
            style={{...inp,lineHeight:1.6}}
            placeholder={'Ol\u00e1 {{nome}}! Temos uma novidade pra voc\u00ea\u2026'}
            onFocus={e=>e.target.style.borderColor='var(--accent)'}
            onBlur={e=>e.target.style.borderColor='var(--sep)'}
          />
        </div>
        <div className="rounded-[12px] p-3" style={{background:'var(--bg-3)',border:'1px solid var(--sep)'}}>
          <p className="text-[11px]" style={{color:'var(--label-3)'}}>Alcance estimado</p>
          <p className="text-[28px] font-bold tracking-tight" style={{color:'var(--accent)'}}>{massaCount} <span className="text-[13px] font-normal" style={{color:'var(--label-3)'}}>contatos</span></p>
        </div>
        <div className="flex-1"/>
        <button onClick={dispatch} className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] font-semibold text-[14px] transition-all" style={{background:'var(--accent)',color:'#000'}}>
          <Send size={15}/> Disparar
        </button>
        <p className="text-[10px] text-center" style={{color:'var(--label-4)'}}>Delay 1.5s entre envios</p>
      </div>
    </div>
  )
}
",
      "path": "/home/claude/bia-v2/src/pages/PageContatos.jsx"
    },
    "message": "PageContatos.jsx",
    "integration_name": null,
    "integration_icon_url": null,
    "icon_name": "file",
    "context": null,
    "display_content": {
      "type": "json_block",
      "json_block": "{"language": "javascript", "code": "import { useState } from 'react'\
import { Send, Users } from 'lucide-react'\
\
const CAT_C = {Bijuterias:'#BF5AF2',P\\u00e9rolas:'#FFD60A','Linhas/Fios':'#32D74B','Fitas/Rendas':'#FF453A',Mi\\u00e7angas:'#FF9F0A',Atacado:'#0A84FF',Z\\u00edperes:'#FF453A',Bot\\u00f5es:'#BF5AF2'}\
const CONTACTS = [\
  {tel:'11 9xxxx-4821',nome:'Maria F.',cats:['Bijuterias','P\\u00e9rolas'],msgs:12,ultima:'Hoje 14:32'},\
  {tel:'21 9xxxx-3310',nome:'Jo\\u00e3o C.',cats:['Linhas/Fios'],msgs:5,ultima:'Hoje 14:18'},\
  {tel:'31 9xxxx-7744',nome:'Ana S.',cats:['Fitas/Rendas','Bijuterias'],msgs:8,ultima:'Hoje 14:05'},\
  {tel:'85 9xxxx-5512',nome:'Lucia M.',cats:['P\\u00e9rolas','Mi\\u00e7angas'],msgs:22,ultima:'Hoje 13:22'},\
  {tel:'48 9xxxx-8831',nome:'Pedro T.',cats:['Z\\u00edperes','Bot\\u00f5es'],msgs:4,ultima:'Hoje 13:10'},\
  {tel:'11 9xxxx-2255',nome:'Carla R.',cats:['Atacado','Bijuterias'],msgs:31,ultima:'Hoje 12:55'},\
  {tel:'41 9xxxx-6634',nome:'Felipe N.',cats:['Mi\\u00e7angas'],msgs:7,ultima:'Ontem 15:20'},\
  {tel:'19 9xxxx-0081',nome:'Sandra L.',cats:['P\\u00e9rolas'],msgs:18,ultima:'Ontem 11:45'},\
]\
\
export default function PageContatos({ api }) {\
  const [filter,setFilter]=useState('Todas')\
  const [massaMsg,setMassaMsg]=useState('')\
  const [massaCat,setMassaCat]=useState('Todas')\
  const allCats=['Todas',...Object.keys(CAT_C)]\
  const filtered=filter==='Todas'?CONTACTS:CONTACTS.filter(c=>c.cats.includes(filter))\
  const massaCount=(massaCat==='Todas'?CONTACTS:CONTACTS.filter(c=>c.cats.includes(massaCat))).length\
  const dispatch=async()=>{\
    if(!massaMsg.trim()){alert('Digite uma mensagem!');return}\
    try{const r=await fetch(`${api}/api/contatos/enviar-massa`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({categoria:massaCat==='Todas'?null:massaCat,mensagem:massaMsg})});const d=await r.json();alert(`Disparando para ${d.total} contatos!`)}\
    catch{alert('Erro ao disparar.')}\
  }\
  const inp = {background:'var(--bg-3)',border:'1px solid var(--sep)',color:'var(--label)',borderRadius:10,outline:'none',transition:'border-color .15s',fontFamily:'inherit'}\
\
  return (\
    <div className=\\"h-full flex overflow-hidden p-5 gap-5\\">\
      <div className=\\"flex-1 flex flex-col gap-4 overflow-hidden\\">\
        <div className=\\"flex items-center justify-between\\">\
          <h2 className=\\"text-[22px] font-bold tracking-tight\\" style={{color:'var(--label)'}}>Contatos</h2>\
          <span className=\\"flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold\\" style={{background:'var(--fill)',color:'var(--label-2)'}}>\
            <Users size={12}/> {CONTACTS.length} total\
          </span>\
        </div>\
        {/* Category pills */}\
        <div className=\\"flex flex-wrap gap-2\\">\
          {allCats.map(c=>(\
            <button key={c} onClick={()=>setFilter(c)}\
              className=\\"px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all\\"\
              style={{background:filter===c?'var(--accent-dim)':'transparent',borderColor:filter===c?'var(--accent)':'var(--sep)',color:filter===c?'var(--accent)':'var(--label-3)'}}>\
              {c}\
            </button>\
          ))}\
        </div>\
        {/* Table */}\
        <div className=\\"card overflow-hidden flex flex-col flex-1\\">\
          <table className=\\"w-full\\">\
            <thead>\
              <tr style={{borderBottom:'1px solid var(--sep)'}}>\
                {['Cliente','Categorias','Mensagens','\\u00daltimo contato'].map(h=>(\
                  <th key={h} className=\\"text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider\\" style={{color:'var(--label-3)'}}>{h}</th>\
                ))}\
              </tr>\
            </thead>\
            <tbody>\
              {filtered.map((c,i)=>(\
                <tr key={i} className=\\"transition-all\\" style={{borderBottom:'1px solid var(--sep)'}}\
                  onMouseEnter={e=>e.currentTarget.style.background='var(--fill)'}\
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>\
                  <td className=\\"px-5 py-3\\">\
                    <div className=\\"flex items-center gap-3\\">\
                      <div className=\\"w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0\\" style={{background:CAT_C[c.cats[0]]||'#636366',color:'#000'}}>{c.nome.slice(0,2).toUpperCase()}</div>\
                      <div>\
                        <div className=\\"text-[13px] font-semibold\\" style={{color:'var(--label)'}}>{c.nome}</div>\
                        <div className=\\"text-[11px] font-mono\\" style={{color:'var(--label-3)'}}>{c.tel}</div>\
                      </div>\
                    </div>\
                  </td>\
                  <td className=\\"px-5 py-3\\">\
                    <div className=\\"flex flex-wrap gap-1.5\\">\
                      {c.cats.map(cat=>(\
                        <span key={cat} className=\\"badge text-[10px]\\" style={{background:`${CAT_C[cat]||'#fff'}18`,color:CAT_C[cat]||'var(--label-2)'}}>{cat}</span>\
                      ))}\
                    </div>\
                  </td>\
                  <td className=\\"px-5 py-3 text-[13px] font-semibold\\" style={{color:'var(--label)'}}>{c.msgs}</td>\
                  <td className=\\"px-5 py-3 text-[12px]\\" style={{color:'var(--label-3)'}}>{c.ultima}</td>\
                </tr>\
              ))}\
            </tbody>\
          </table>\
        </div>\
      </div>\
      {/* Massa panel */}\
      <div className=\\"w-72 flex-shrink-0 card p-5 flex flex-col gap-4 overflow-y-auto scroll-hidden\\">\
        <div>\
          <h3 className=\\"text-[17px] font-semibold\\" style={{color:'var(--label)'}}>Envio em Massa</h3>\
          <p className=\\"text-[12px] mt-0.5\\" style={{color:'var(--label-3)'}}>Segmente e dispare mensagens</p>\
        </div>\
        <div>\
          <label className=\\"text-[11px] font-medium block mb-1.5\\" style={{color:'var(--label-3)'}}>CATEGORIA</label>\
          <select value={massaCat} onChange={e=>setMassaCat(e.target.value)} className=\\"w-full px-3 py-2 text-[13px]\\" style={{...inp,fontSize:13}}>\
            {allCats.map(c=><option key={c} value={c}>{c}</option>)}\
          </select>\
        </div>\
        <div>\
          <label className=\\"text-[11px] font-medium block mb-1.5\\" style={{color:'var(--label-3)'}}>MENSAGEM <span className=\\"normal-case font-normal\\">\\u2014 use {'{{nome}}'}</span></label>\
          <textarea value={massaMsg} onChange={e=>setMassaMsg(e.target.value)} rows={6}\
            className=\\"w-full px-3 py-2 text-[13px] resize-none\\"\
            style={{...inp,lineHeight:1.6}}\
            placeholder={'Ol\\u00e1 {{nome}}! Temos uma novidade pra voc\\u00ea\\u2026'}\
            onFocus={e=>e.target.style.borderColor='var(--accent)'}\
            onBlur={e=>e.target.style.borderColor='var(--sep)'}\
          />\
        </div>\
        <div className=\\"rounded-[12px] p-3\\" style={{background:'var(--bg-3)',border:'1px solid var(--sep)'}}>\
          <p className=\\"text-[11px]\\" style={{color:'var(--label-3)'}}>Alcance estimado</p>\
          <p className=\\"text-[28px] font-bold tracking-tight\\" style={{color:'var(--accent)'}}>{massaCount} <span className=\\"text-[13px] font-normal\\" style={{color:'var(--label-3)'}}>contatos</span></p>\
        </div>\
        <div className=\\"flex-1\\"/>\
        <button onClick={dispatch} className=\\"w-full flex items-center justify-center gap-2 py-3 rounded-[12px] font-semibold text-[14px] transition-all\\" style={{background:'var(--accent)',color:'#000'}}>\
          <Send size={15}/> Disparar\
        </button>\
        <p className=\\"text-[10px] text-center\\" style={{color:'var(--label-4)'}}>Delay 1.5s entre envios</p>\
      </div>\
    </div>\
  )\
}\
", "filename": "/home/claude/bia-v2/src/pages/PageContatos.jsx"}"
    },
    "approval_options": null,
    "approval_key": null,
    "is_mcp_app": null,
    "mcp_server_url": null
  },
  {
    "start_timestamp": null,
    "stop_timestamp": null,
    "flags": null,
    "type": "tool_result",
    "tool_use_id": "toolu_01UAg4dH3Yr2TnWw5g1TEexS",
    "name": "create_file",
    "content": [
      {
        "type": "text",
        "text": "File created successfully: /home/claude/bia-v2/src/pages/PageContatos.jsx",
        "uuid": "7a4e94fe-760c-499a-b5ca-e5504a5816f3"
      }
    ],
    "is_error": false,
    "structured_content": null,
    "meta": null,
    "message": null,
    "integration_name": null,
    "mcp_server_url": null,
    "integration_icon_url": null,
    "icon_name": "file",
    "display_content": {
      "type": "text",
      "text": "File created successfully: /home/claude/bia-v2/src/pages/PageContatos.jsx"
    }
  },
  {
    "start_timestamp": "2026-05-09T05:54:01.207132Z",
    "stop_timestamp": "2026-05-09T05:54:22.201703Z",
    "flags": null,
    "type": "tool_use",
    "id": "toolu_018Xz4r62r2WpLT4YKqFVVBG",
    "name": "create_file",
    "input": {
      "description": "PageEstoque.jsx",
      "file_text": "import { Bell, Package } from 'lucide-react'
const ESTOQUE = [
  {id:'p1',nome:'P\u00e9rola ABS 8mm Branca',clientes:['11 9xxxx-4821','85 9xxxx-5512','11 9xxxx-2255'],cat:'P\u00e9rolas',c:'#FFD60A'},
  {id:'p2',nome:'Mi\u00e7anga de Vidro Azul Transparente',clientes:['21 9xxxx-3310','41 9xxxx-6634'],cat:'Mi\u00e7angas',c:'#FF9F0A'},
  {id:'p3',nome:'Fio de Nylon 0.5mm Transparente',clientes:['48 9xxxx-8831'],cat:'Linhas/Fios',c:'#32D74B'},
  {id:'p4',nome:'Z\u00edper Invis\u00edvel N\u00ba60 Preto',clientes:['31 9xxxx-7744','19 9xxxx-0081','11 9xxxx-0092'],cat:'Z\u00edperes',c:'#FF453A'},
]
export default function PageEstoque({ api }) {
  const total = ESTOQUE.reduce((a,e)=>a+e.clientes.length,0)
  const avise = async (id,nome) => {
    try{await fetch(`${api}/api/estoque/verificar/${id}`,{method:'POST'});alert('Avisando clientes de: '+nome)}
    catch{alert('Erro.')}
  }
  return (
    <div className="h-full overflow-y-auto scroll-hidden p-5 space-y-5">
      <h2 className="text-[22px] font-bold tracking-tight" style={{color:'var(--label)'}}>Avise-me \u2014 Monitor de Estoque</h2>
      <div className="grid grid-cols-3 gap-4">
        {[{v:ESTOQUE.length,l:'Produtos monitorados',c:'var(--accent)'},{v:total,l:'Clientes aguardando',c:'var(--orange)'},{v:'Ativo 24/7',l:'Via webhook Nuvemshop',c:'var(--teal)'}].map((m,i)=>(
          <div key={i} className="card p-4">
            <div className="text-[28px] font-bold tracking-tight" style={{color:m.c}}>{m.v}</div>
            <div className="text-[12px] mt-1" style={{color:'var(--label-3)'}}>{m.l}</div>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{borderBottom:'1px solid var(--sep)'}}>
          <h3 className="text-[17px] font-semibold" style={{color:'var(--label)'}}>Fila de Aviso</h3>
          <span className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full" style={{background:'rgba(255,159,10,0.12)',color:'var(--orange)'}}>
            <span className="w-1.5 h-1.5 rounded-full" style={{background:'var(--orange)'}}/>Monitorando
          </span>
        </div>
        {ESTOQUE.map((e,i)=>(
          <div key={i} className="flex items-start gap-4 px-5 py-4" style={{borderBottom:'1px solid var(--sep)'}}>
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{background:`${e.c}18`}}>
              <Package size={18} style={{color:e.c}}/>
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold mb-1" style={{color:'var(--label)'}}>{e.nome}</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge text-[10px]" style={{background:`${e.c}18`,color:e.c}}>{e.cat}</span>
                <span className="text-[11px]" style={{color:'var(--label-3)'}}>{e.clientes.length} cliente{e.clientes.length>1?'s':''} aguardando</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {e.clientes.map(c=>(
                  <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded-[6px]" style={{background:'var(--fill)',color:'var(--label-3)',border:'1px solid var(--sep)'}}>{c}</span>
                ))}
              </div>
            </div>
            <button onClick={()=>avise(e.id,e.nome)} className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-medium border transition-all flex-shrink-0" style={{background:'var(--fill)',borderColor:'var(--sep)',color:'var(--label-2)'}}>
              <Bell size={12}/> Avisar agora
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}