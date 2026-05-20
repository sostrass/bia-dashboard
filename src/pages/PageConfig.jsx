import { useState } from 'react'
import { Check, ExternalLink } from 'lucide-react'

const integrations = [
  { key: 'whatsapp', name: 'WhatsApp Business API', desc: 'Meta Cloud API \u2014 recebe e envia mensagens', fields: [{ k: 'WHATSAPP_TOKEN', l: 'Token de Acesso', ph: 'EAAxxxxx' }, { k: 'WHATSAPP_PHONE_ID', l: 'ID do N\u00famero', ph: '12345678901234' }, { k: 'WHATSAPP_VERIFY_TOKEN', l: 'Verify Token', ph: 'bia2025' }], color: '#25D366', doc: 'developers.facebook.com' },
  { key: 'nuvemshop', name: 'Nuvemshop', desc: 'Cat\u00e1logo, pedidos e checkout nativo', fields: [{ k: 'NUVEMSHOP_TOKEN', l: 'Access Token', ph: 'seu_token' }, { k: 'NUVEMSHOP_STORE_ID', l: 'Store ID', ph: '123456' }], color: '#00BCB4', doc: 'tiendanube.com/developers' },
  { key: 'bling', name: 'Bling ERP v3', desc: 'OAuth 2.0 \u2014 pedidos, contatos e devolu\u00e7\u00f5es', fields: [{ k: 'BLING_CLIENT_ID', l: 'Client ID', ph: 'seu_client_id' }, { k: 'BLING_CLIENT_SECRET', l: 'Client Secret', ph: 'seu_secret' }, { k: 'RAILWAY_URL', l: 'URL do Servidor', ph: 'https://seu-app.railway.app' }], color: '#F57C00', doc: 'developer.bling.com.br', oauth: true },
  { key: 'gemini', name: 'Gemini AI (Google)', desc: 'Motor de intelig\u00eancia artificial', fields: [{ k: 'GEMINI_API_KEY', l: 'API Key', ph: 'AIzaSy...' }, { k: 'GEMINI_MODEL', l: 'Modelo', ph: 'gemini-2.5-flash' }], color: '#4285F4', doc: 'aistudio.google.com' },
]

export default function PageConfig({ api, onToggleTheme, currentTheme }) {
  const [saved, setSaved] = useState(null)

  const save = async (key) => {
    setSaved(key)
    setTimeout(() => setSaved(null), 3000)
  }

  const inputClass = "w-full px-3 py-2 rounded-xl border border-border/50 bg-white/3 text-white text-sm font-mono focus:outline-none focus:border-lime-400/50 transition-colors placeholder:text-muted-foreground/40"

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h2 className="font-display font-bold text-xl text-white">Configura\u00e7\u00f5es</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie as integra\u00e7\u00f5es e credenciais do sistema</p>
      </div>

      {/* Important note */}
      <div className="rounded-2xl p-4 border" style={{ background: 'rgba(184,255,87,0.05)', border: '1px solid rgba(184,255,87,0.2)' }}>
        <p className="text-[12px] font-semibold" style={{ color: '#b8ff57' }}>\ud83d\udca1 Dica importante</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          As vari\u00e1veis de ambiente devem ser configuradas no painel do Railway (Settings \u2192 Variables). As altera\u00e7\u00f5es feitas aqui s\u00e3o salvas via API e requerem que o servidor esteja online.
        </p>
      </div>

      <div className="space-y-4">
        {integrations.map(int => (
          <div key={int.key} className="rounded-2xl border border-border/50 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: int.color }} />
                <div>
                  <h3 className="font-display font-bold text-sm text-white">{int.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{int.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`https://${int.doc}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-white transition-colors">
                  <ExternalLink size={11} /> Docs
                </a>
                {int.oauth && (
                  <a href={`${api}/bling/auth`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                    style={{ background: 'rgba(245,124,0,0.15)', border: '1px solid rgba(245,124,0,0.3)', color: '#F57C00' }}>
                    \ud83d\udd11 Autorizar OAuth
                  </a>
                )}
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {int.fields.map(f => (
                  <div key={f.k}>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{f.l}</label>
                    <input type={f.k.includes('SECRET') || f.k.includes('KEY') || f.k.includes('TOKEN') ? 'password' : 'text'}
                      placeholder={f.ph} className={inputClass}
                      onFocus={e => e.target.style.borderColor = 'rgba(184,255,87,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                    />
                    <p className="text-[9px] text-muted-foreground/50 mt-1 font-mono">{f.k}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => save(int.key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:opacity-90"
                style={{ background: saved === int.key ? '#00e5b4' : '#b8ff57', color: '#0a0a12' }}>
                {saved === int.key ? <><Check size={12} /> Salvo!</> : <>Salvar {int.name}</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}