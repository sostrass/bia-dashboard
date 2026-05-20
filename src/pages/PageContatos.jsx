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