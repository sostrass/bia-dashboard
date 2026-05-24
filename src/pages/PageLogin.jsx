import { useState } from 'react'

const SENHA_KEY  = 'bia_auth_token'
const SENHA_HASH = 'bia2026'  // Trocar pela senha desejada

export function verificarAuth() {
  return localStorage.getItem(SENHA_KEY) === SENHA_HASH
}

export function logout() {
  localStorage.removeItem(SENHA_KEY)
  window.location.reload()
}

export default function PageLogin({ onLogin }) {
  const [senha,  setSenha]  = useState('')
  const [erro,   setErro]   = useState('')
  const [loading,setLoading]= useState(false)

  const entrar = () => {
    if (!senha) return
    setLoading(true)
    setTimeout(() => {
      if (senha === SENHA_HASH) {
        localStorage.setItem(SENHA_KEY, SENHA_HASH)
        onLogin()
      } else {
        setErro('Senha incorreta')
        setSenha('')
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ width:340, background:'var(--bg-2)', border:'0.5px solid var(--sep)', borderRadius:16, padding:'32px 28px' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#000' }}>S</div>
          <div>
            <div style={{ fontSize:17, fontWeight:600, color:'var(--label)' }}>Bia Dashboard</div>
            <div style={{ fontSize:12, color:'var(--label-3)' }}>Só Strass · Painel de gestão</div>
          </div>
        </div>

        {/* Form */}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:500, color:'var(--label-3)', display:'block', marginBottom:6 }}>Senha de acesso</label>
          <input
            type="password"
            value={senha}
            onChange={e => { setSenha(e.target.value); setErro('') }}
            onKeyDown={e => e.key === 'Enter' && entrar()}
            placeholder="Digite sua senha..."
            autoFocus
            style={{
              width:'100%', padding:'10px 14px', borderRadius:8,
              border:`0.5px solid ${erro ? '#EF4444' : 'var(--sep)'}`,
              background:'var(--bg)', color:'var(--label)', fontSize:14,
              outline:'none', boxSizing:'border-box',
            }}
          />
          {erro && <div style={{ fontSize:12, color:'#EF4444', marginTop:6 }}>{erro}</div>}
        </div>

        <button
          onClick={entrar}
          disabled={loading || !senha}
          style={{
            width:'100%', padding:'10px', borderRadius:8, border:'none',
            background: loading || !senha ? 'var(--fill)' : 'var(--accent)',
            color: loading || !senha ? 'var(--label-3)' : '#000',
            fontSize:14, fontWeight:600, cursor: loading || !senha ? 'default' : 'pointer',
            transition:'all .15s',
          }}
        >
          {loading ? 'Entrando...' : 'Entrar →'}
        </button>

        <div style={{ marginTop:20, fontSize:11, color:'var(--label-3)', textAlign:'center', lineHeight:1.5 }}>
          Acesso restrito ao time da Só Strass.<br />
          Em caso de problemas, contate o administrador.
        </div>
      </div>
    </div>
  )
}
