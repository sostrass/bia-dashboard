import { Bell, Package } from 'lucide-react'
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