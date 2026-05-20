import { useState, useEffect } from 'react'
import { Tag, Plus, Trash2 } from 'lucide-react'

const CORES = ['#FF453A','#FF9F0A','#FFD60A','#32D74B','#64D2FF','#0A84FF','#BF5AF2','#FF375F']

export default function PageTags({ api }) {
  const [tags, setTags] = useState([])
  const [nova, setNova] = useState('')
  const [cor, setCor] = useState(CORES[0])

  useEffect(() => {
    fetch(`${api}/api/tags`)
      .then(r => r.json())
      .then(d => setTags(d.tags || []))
      .catch(() => setTags([
        {id:1, nome:'VIP',     cor:'#FFD60A', total:12},
        {id:2, nome:'Atacado', cor:'#0A84FF', total:8},
        {id:3, nome:'Inativo', cor:'#FF453A', total:3},
      ]))
  }, [api])

  const criar = async () => {
    if (!nova.trim()) return
    try {
      const r = await fetch(`${api}/api/tags`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({nome:nova.trim(), cor})
      })
      const d = await r.json()
      setTags(t => [...t, d.tag || {id:Date.now(),nome:nova.trim(),cor,total:0}])
      setNova('')
    } catch { setTags(t => [...t, {id:Date.now(),nome:nova.trim(),cor,total:0}]); setNova('') }
  }

  const excluir = async (id) => {
    try { await fetch(`${api}/api/tags/${id}`,{method:'DELETE'}) } catch {}
    setTags(t => t.filter(t => t.id !== id))
  }

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      <h2 className="text-[22px] font-bold tracking-tight" style={{color:'var(--label)'}}>Etiquetas</h2>

      {/* Criar nova */}
      <div className="card p-4 flex items-center gap-3">
        <div className="flex gap-2 flex-shrink-0">
          {CORES.map(c => (
            <button key={c} onClick={() => setCor(c)}
              className="w-5 h-5 rounded-full transition-transform"
              style={{background:c, transform:cor===c?'scale(1.3)':'scale(1)',outline:cor===c?`2px solid ${c}`:'none',outlineOffset:2}}/>
          ))}
        </div>
        <input value={nova} onChange={e=>setNova(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&criar()}
          placeholder="Nome da etiqueta..."
          className="flex-1 px-3 py-2 rounded-[10px] text-[13px] outline-none"
          style={{background:'var(--bg-3)',border:'1px solid var(--sep)',color:'var(--label)'}}/>
        <button onClick={criar}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold flex-shrink-0"
          style={{background:'var(--accent)',color:'#000'}}>
          <Plus size={13}/> Criar
        </button>
      </div>

      {/* Lista */}
      <div className="card overflow-hidden">
        {tags.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <Tag size={32} className="mb-3 opacity-15" style={{color:'var(--label)'}}/>
            <p className="text-[13px]" style={{color:'var(--label-3)'}}>Nenhuma etiqueta criada</p>
          </div>
        ) : tags.map((t,i) => (
          <div key={t.id} className="flex items-center gap-3 px-5 py-3.5"
            style={{borderBottom:i<tags.length-1?'1px solid var(--sep)':'none'}}>
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:t.cor}}/>
            <span className="flex-1 text-[13px] font-medium" style={{color:'var(--label)'}}>{t.nome}</span>
            <span className="text-[11px]" style={{color:'var(--label-3)'}}>{t.total || 0} contatos</span>
            <button onClick={()=>excluir(t.id)} className="p-1.5 rounded-[7px] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{color:'var(--red)'}}>
              <Trash2 size={13}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
