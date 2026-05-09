import { useState } from 'react'
import { Check, ExternalLink, Sun, Moon } from 'lucide-react'

const INTEGRATIONS = [
  {key:'whatsapp',name:'WhatsApp Business API',desc:'Meta Cloud API',fields:[{k:'WHATSAPP_TOKEN',l:'Token de Acesso',ph:'EAAxxxxx',secret:true},{k:'WHATSAPP_PHONE_ID',l:'ID do Número',ph:'12345678901234'},{k:'WHATSAPP_VERIFY_TOKEN',l:'Verify Token',ph:'bia2025'}],c:'#32D74B',doc:'developers.facebook.com'},
  {key:'nuvemshop',name:'Nuvemshop',desc:'Catálogo, pedidos e checkout',fields:[{k:'NUVEMSHOP_TOKEN',l:'Access Token',ph:'seu_token',secret:true},{k:'NUVEMSHOP_STORE_ID',l:'Store ID',ph:'123456'}],c:'#0A84FF',doc:'tiendanube.com/developers'},
  {key:'bling',name:'Bling ERP v3',desc:'OAuth 2.0 — pedidos e devoluções',fields:[{k:'BLING_CLIENT_ID',l:'Client ID',ph:'seu_client_id'},{k:'BLING_CLIENT_SECRET',l:'Client Secret',ph:'seu_secret',secret:true},{k:'RAILWAY_URL',l:'URL do Servidor',ph:'https://seu-app.railway.app'}],c:'#FF9F0A',doc:'developer.bling.com.br',oauth:true},
  {key:'gemini',name:'Gemini AI',desc:'Motor de inteligência artificial',fields:[{k:'GEMINI_API_KEY',l:'API Key',ph:'AIzaSy...',secret:true},{k:'GEMINI_MODEL',l:'Modelo',ph:'gemini-2.0-flash'}],c:'#BF5AF2',doc:'aistudio.google.com'},
]

export default function PageConfig({ api, onToggleTheme, currentTheme }) {
  const [saved,setSaved] = useState(null)
  const isDark = currentTheme === 'dark'
  const inp = {background:'var(--bg-3)',border:'1px solid var(--sep)',borderRadius:10,color:'var(--label)',outline:'none',padding:'9px 12px',fontSize:12,fontFamily:'monospace',transition:'border-color .15s',width:'100%'}
  const focus = e => e.target.style.borderColor='var(--accent)'
  const blur  = e => e.target.style.borderColor='var(--sep)'
  const save  = k => { setSaved(k); setTimeout(()=>setSaved(null),3000) }

  return (
    <div className="h-full overflow-y-auto scroll-hidden p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-bold tracking-tight" style={{color:'var(--label)'}}>Configurações</h2>
        {/* Theme toggle */}
        <button onClick={onToggleTheme} className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-medium border transition-all"
          style={{background:'var(--fill)',borderColor:'var(--sep)',color:'var(--label-2)'}}>
          {isDark?<><Sun size={14}/>Modo Claro</>:<><Moon size={14}/>Modo Escuro</>}
        </button>
      </div>

      <div className="card p-4" style={{background:'var(--accent-dim)',border:'1px solid rgba(50,215,75,0.2)'}}>
        <p className="text-[13px] font-medium" style={{color:'var(--accent)'}}>💡 Dica importante</p>
        <p className="text-[12px] mt-1" style={{color:'var(--label-2)'}}>Configure as variáveis de ambiente no Railway (Settings → Variables). As alterações aqui são salvas via API.</p>
      </div>

      {INTEGRATIONS.map(int=>(
        <div key={int.key} className="card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{borderBottom:'1px solid var(--sep)'}}>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full" style={{background:int.c}}/>
              <div>
                <div className="text-[15px] font-semibold" style={{color:'var(--label)'}}>{int.name}</div>
                <div className="text-[12px]" style={{color:'var(--label-3)'}}>{int.desc}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={`https://${int.doc}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[12px] px-2.5 py-1.5 rounded-[8px] transition-all" style={{color:'var(--label-3)',background:'var(--fill)'}}>
                <ExternalLink size={11}/> Docs
              </a>
              {int.oauth && (
                <a href={`${api}/bling/auth`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[12px] px-2.5 py-1.5 rounded-[8px] font-semibold" style={{background:'rgba(255,159,10,0.12)',color:'var(--orange)'}}>
                  🔑 Autorizar OAuth
                </a>
              )}
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              {int.fields.map(f=>(
                <div key={f.k}>
                  <label className="text-[10px] font-semibold block mb-1.5 uppercase tracking-wider" style={{color:'var(--label-3)'}}>{f.l}</label>
                  <input type={f.secret?'password':'text'} placeholder={f.ph} style={inp} onFocus={focus} onBlur={blur}/>
                  <p className="text-[9px] mt-1 font-mono" style={{color:'var(--label-4)'}}>{f.k}</p>
                </div>
              ))}
            </div>
            <button onClick={()=>save(int.key)} className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all" style={{background:saved===int.key?'var(--teal)':'var(--accent)',color:'#000'}}>
              {saved===int.key?<><Check size={13}/>Salvo!</>:<>Salvar {int.name}</>}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
