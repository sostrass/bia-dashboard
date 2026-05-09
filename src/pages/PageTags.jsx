import { useState, useEffect } from 'react'
import { Tag, Users, Send, RefreshCw, Plus, X } from 'lucide-react'

const TAG_CORES = {
  'interesse:': '#BF5AF2',
  'comprador:': '#32D74B',
  'ticket:':    '#FFD60A',
  'avaliacao:': '#FF9F0A',
  'devolucao:': '#FF453A',
  'pagamento:': '#0A84FF',
  'carrinho:':  '#5AC8FA',
  'avise:':     '#FF9F0A',
  'vip':        '#FFD60A',
}

function tagCor(tag) {
  for (const [prefix, cor] of Object.entries(TAG_CORES)) {
    if (tag.startsWith(prefix) || tag === prefix.replace(':','')) return cor
  }
  return '#636366'
}

function TagBadge({ tag, onRemove }) {
  const cor = tagCor(tag)
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: `${cor}18`, color: cor, border: `1px solid ${cor}35` }}>
      {tag}
      {onRemove && (
        <button onClick={() => onRemove(tag)}
          className="hover:opacity-70 transition-opacity">
          <X size={10} />
        </button>
      )}
    </span>
  )
}

export default function PageTags({ api }) {
  const [tags,      setTags]      = useState([])
  const [selTag,    setSelTag]    = useState(null)
  const [contatos,  setContatos]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [massaMsg,  setMassaMsg]  = useState('')
  const [sending,   setSending]   = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${api}/api/fase5/tags`)
        if (r.ok) {
          const d = await r.json()
          setTags(d.tags || [])
        }
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [api])

  const carregarContatos = async (tag) => {
    setSelTag(tag)
    try {
      const r = await fetch(`${api}/api/fase5/tags/${encodeURIComponent(tag)}/contatos`)
      if (r.ok) {
        const d = await r.json()
        setContatos(d.contatos || [])
      }
    } catch {}
  }

  const dispararMassa = async () => {
    if (!massaMsg.trim() || !selTag) return
    setSending(true)
    try {
      const r = await fetch(`${api}/api/contatos/enviar-massa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: selTag, mensagem: massaMsg })
      })
      const d = await r.json()
      alert(`Disparando para ${d.total} contatos com a tag "${selTag}"!`)
      setMassaMsg('')
    } catch { alert('Erro ao disparar.') }
    setSending(false)
  }

  const inp = { background:'var(--bg-3)', border:'1px solid var(--sep)', borderRadius:10, color:'var(--label)', outline:'none', padding:'9px 12px', fontSize:13, fontFamily:'inherit', transition:'border-color .15s', width:'100%' }
  const focus = e => e.target.style.borderColor = 'var(--accent)'
  const blur  = e => e.target.style.borderColor = 'var(--sep)'

  if (loading) return (
    <div className="h-full flex items-center justify-center gap-3" style={{ color: 'var(--label-3)' }}>
      <RefreshCw size={16} className="animate-spin" /> Carregando tags...
    </div>
  )

  return (
    <div className="h-full flex overflow-hidden">

      {/* Tags sidebar */}
      <div className="w-[240px] flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--sep)' }}>
        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--sep)' }}>
          <h2 className="text-[17px] font-semibold" style={{ color: 'var(--label)' }}>Tags Automáticas</h2>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--label-3)' }}>Geradas pela IA automaticamente</p>
        </div>
        <div className="overflow-y-auto flex-1 py-2">
          {tags.length === 0 && (
            <div className="px-4 py-8 text-center" style={{ color: 'var(--label-3)' }}>
              <Tag size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-[12px]">Nenhuma tag ainda</p>
              <p className="text-[11px] mt-1">Tags aparecem conforme os clientes interagem</p>
            </div>
          )}
          {/* Tags demo se não tiver dados reais */}
          {tags.length === 0 && [
            { tag: 'interesse:bijuterias', total: 24 },
            { tag: 'interesse:perolas', total: 18 },
            { tag: 'comprador:frequente', total: 12 },
            { tag: 'comprador:novo', total: 31 },
            { tag: 'vip', total: 7 },
            { tag: 'ticket:alto', total: 9 },
            { tag: 'avaliacao:positiva', total: 45 },
            { tag: 'interesse:atacado', total: 6 },
            { tag: 'devolucao:historico', total: 4 },
            { tag: 'avise:estoque', total: 11 },
          ].map(t => (
            <button key={t.tag} onClick={() => carregarContatos(t.tag)}
              className="w-full flex items-center justify-between px-4 py-2.5 border-l-2 transition-all text-left"
              style={{
                borderLeftColor: selTag === t.tag ? tagCor(t.tag) : 'transparent',
                background: selTag === t.tag ? `${tagCor(t.tag)}10` : 'transparent',
              }}>
              <TagBadge tag={t.tag} />
              <span className="text-[11px] font-semibold" style={{ color: 'var(--label-3)' }}>{t.total}</span>
            </button>
          ))}
          {tags.map(t => (
            <button key={t.tag} onClick={() => carregarContatos(t.tag)}
              className="w-full flex items-center justify-between px-4 py-2.5 border-l-2 transition-all text-left"
              style={{
                borderLeftColor: selTag === t.tag ? tagCor(t.tag) : 'transparent',
                background: selTag === t.tag ? `${tagCor(t.tag)}10` : 'transparent',
              }}>
              <TagBadge tag={t.tag} />
              <span className="text-[11px] font-semibold" style={{ color: 'var(--label-3)' }}>{t.total}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ background: 'var(--bg)' }}>
        {!selTag ? (
          <div className="h-full flex flex-col items-center justify-center" style={{ color: 'var(--label-3)' }}>
            <Tag size={32} className="mb-3 opacity-30" />
            <p className="text-[14px] font-medium" style={{ color: 'var(--label-2)' }}>Selecione uma tag para ver os contatos</p>
            <p className="text-[12px] mt-1">As tags são aplicadas automaticamente pela IA durante as conversas</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TagBadge tag={selTag} />
                <div>
                  <h2 className="text-[18px] font-bold" style={{ color: 'var(--label)' }}>
                    {contatos.length || '–'} contatos
                  </h2>
                  <p className="text-[12px]" style={{ color: 'var(--label-3)' }}>com a tag "{selTag}"</p>
                </div>
              </div>
            </div>

            {/* Envio em massa segmentado */}
            <div className="card p-5 space-y-3"
              style={{ border: `1px solid ${tagCor(selTag)}30`, background: `${tagCor(selTag)}06` }}>
              <h3 className="text-[14px] font-semibold flex items-center gap-2" style={{ color: tagCor(selTag) }}>
                <Send size={14} /> Disparar para este segmento
              </h3>
              <textarea value={massaMsg} onChange={e => setMassaMsg(e.target.value)} rows={3}
                placeholder={`Mensagem para clientes com tag "${selTag}"...\nUse {{nome}} para personalizar`}
                style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
                onFocus={focus} onBlur={blur} />
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: 'var(--label-3)' }}>
                  {contatos.length || '–'} destinatários · Delay 1.5s entre envios
                </span>
                <button onClick={dispararMassa} disabled={!massaMsg.trim() || sending}
                  className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all"
                  style={{ background: tagCor(selTag), color: '#000', opacity: (!massaMsg.trim() || sending) ? 0.5 : 1 }}>
                  {sending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  Disparar
                </button>
              </div>
            </div>

            {/* Lista de contatos */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--sep)' }}>
                <span className="text-[13px] font-semibold" style={{ color: 'var(--label)' }}>Contatos neste segmento</span>
              </div>
              {(contatos.length ? contatos : [
                { telefone:'11 9xxxx-4821', nome:'Maria F.', tags:['interesse:bijuterias','comprador:frequente'], ltv:'289,90', total_msgs:12 },
                { telefone:'85 9xxxx-5512', nome:'Lucia M.',  tags:['interesse:bijuterias','vip'],                ltv:'621,00', total_msgs:22 },
                { telefone:'11 9xxxx-2255', nome:'Carla R.',  tags:['interesse:bijuterias','interesse:atacado'],  ltv:'380,00', total_msgs:31 },
              ]).map((c, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3 transition-all"
                  style={{ borderBottom: '1px solid var(--sep)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--fill)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{ background: tagCor(selTag), color: '#000' }}>
                    {(c.nome||'CL').slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold" style={{ color: 'var(--label)' }}>{c.nome || 'Cliente'}</div>
                    <div className="text-[11px] font-mono" style={{ color: 'var(--label-3)' }}>{c.telefone}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-w-[200px] justify-end">
                    {(c.tags || []).slice(0,3).map(t => <TagBadge key={t} tag={t} />)}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>R$ {c.ltv || '0,00'}</div>
                    <div className="text-[10px]" style={{ color: 'var(--label-3)' }}>{c.total_msgs || 0} msgs</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
