import { useState } from 'react'
import { useTheme } from '../App'

export default function Shell() {
  const { theme, toggle } = useTheme()
  const [page, setPage] = useState('home')

  return (
    <div style={{ display:'flex', height:'100%', background:'var(--bg)', color:'var(--label)' }}>
      <aside style={{ width:180, background:'var(--bg-2)', borderRight:'1px solid var(--sep)', padding:16 }}>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:16, color:'var(--label)' }}>Bia Dashboard</div>
        {['Dashboard','Pedidos','Clientes','Config IA'].map(p => (
          <button key={p} onClick={() => setPage(p)} style={{
            display:'block', width:'100%', textAlign:'left', padding:'8px 10px',
            marginBottom:4, borderRadius:6, border:'none', cursor:'pointer',
            background: page === p ? 'var(--accent-dim)' : 'transparent',
            color: page === p ? 'var(--accent)' : 'var(--label-2)',
            fontSize:13,
          }}>{p}</button>
        ))}
        <button onClick={toggle} style={{ marginTop:16, display:'block', width:'100%', textAlign:'left', padding:'8px 10px', borderRadius:6, border:'none', cursor:'pointer', background:'var(--fill)', color:'var(--label-2)', fontSize:12 }}>
          Alternar tema
        </button>
      </aside>
      <main style={{ flex:1, padding:32, overflowY:'auto' }}>
        <h1 style={{ fontSize:20, fontWeight:500, marginBottom:8, color:'var(--label)' }}>{page}</h1>
        <p style={{ color:'var(--label-3)', fontSize:13 }}>Carregando módulo...</p>
      </main>
    </div>
  )
}
