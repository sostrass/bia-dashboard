import { useState, useCallback } from 'react'
import {
  Search, RefreshCw, Copy, Check, ChevronDown, ChevronRight,
  CheckCircle, XCircle, AlertTriangle, Package, User, Truck,
  MessageSquare, CreditCard, Hash, MapPin, Phone, Mail,
  Calendar, Tag, FileText, ExternalLink, Clock, Activity,
  Layers, Eye, EyeOff
} from 'lucide-react'

const fmtDate = d => d ? new Date(d.length===10?d+'T12:00:00':d).toLocaleDateString('pt-BR') : '—'
const fmtDT   = d => d ? new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '—'
const R = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const R2 = n => `R$ ${Number(n||0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}`

const SIT_COR = {6:'#f59e0b',9:'#4a9fff',12:'#ef4444',15:'#22c55e'}
const SIT_LAB = {6:'Em Aberto',9:'Atendido',12:'Cancelado',15:'Verificado'}
const LOJAS   = {205946980:'Shopee',203414926:'Mercado Livre',204884434:'Nuvemshop',205916963:'TikTok Shop',205693668:'Nuvemshop 2',0:'Loja Propria'}

function Row({ label, value, mono, cor }) {
  const [copied, setCopied] = useState(false)
  const v = (value === null || value === undefined || value === '') ? '—' : String(value)
  const isNull = v === '—'
  const copy = () => {
    navigator.clipboard.writeText(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? ''))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'7px 0', borderBottom:'1px solid var(--sep)' }}>
      <span style={{ fontSize:11, color:'var(--label-4)', minWidth:180, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:12.5, fontWeight:isNull?400:500, color:isNull?'var(--label-4)':cor||'var(--label)', fontFamily:mono?'monospace':'inherit', flex:1, wordBreak:'break-all' }}>
        {typeof value === 'object' && value !== null ? JSON.stringify(value) : v}
      </span>
      {!isNull && <button onClick={copy} style={{ padding:'1px 7px', borderRadius:5, border:'1px solid var(--sep)', background:'transparent', color:copied?'#22c55e':'var(--label-4)', cursor:'pointer', fontSize:10, flexShrink:0, whiteSpace:'nowrap' }}>
        {copied ? <Check size={9}/> : <Copy size={9}/>}
      </button>}
    </div>
  )
}

function Block({ title, children, color }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ background:'var(--bg-2)', border:`1px solid ${color||'var(--sep)'}`, borderRadius:12, overflow:'hidden', marginBottom:12 }}>
      <button onClick={() => setOpen(v => !v)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--label)', flex:1 }}>{title}</span>
        {open ? <ChevronDown size={13} style={{ color:'var(--label-4)' }}/> : <ChevronRight size={13} style={{ color:'var(--label-4)' }}/>}
      </button>
      {open && <div style={{ padding:'4px 16px 16px', borderTop:'1px solid var(--sep)' }}>{children}</div>}
    </div>
  )
}

function JsonView({ data, label }) {
  const [show, setShow] = useState(false)
  if (!data) return null
  return (
    <div style={{ marginTop:8 }}>
      <button onClick={() => setShow(v => !v)} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:7, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', fontSize:11 }}>
        {show ? <EyeOff size={11}/> : <Eye size={11}/>} {show ? 'Ocultar' : 'Ver'} {label || 'JSON raw'}
      </button>
      {show && <pre style={{ fontSize:10.5, fontFamily:'monospace', color:'var(--label-3)', background:'var(--bg)', border:'1px solid var(--sep)', borderRadius:9, padding:'12px', marginTop:6, overflowX:'auto', maxHeight:360, whiteSpace:'pre-wrap', wordBreak:'break-all', lineHeight:1.6 }}>
        {JSON.stringify(data, null, 2)}
      </pre>}
    </div>
  )
}

export default function PageDebugPedido({ api }) {
  const [numero, setNumero] = useState('228887')
  const [data,   setData]   = useState(null)
  const [loading,setLoad]   = useState(false)
  const [erro,   setErro]   = useState(null)

  const buscar = useCallback(async () => {
    if (!numero.trim()) return
    setLoad(true); setErro(null); setData(null)
    try {
      const r = await fetch(`${api}/api/dashboard/debug/pedido-raw/${numero.trim()}`)
      const d = await r.json()
      if (d.erro && !d.pedido) setErro(d.erro)
      else setData(d)
    } catch(e) { setErro(e.message) }
    setLoad(false)
  }, [api, numero])

  const p  = data?.pedido || {}
  const c  = data?.contato_completo?.dados || {}
  const cp = data?.contato_pedido || {}
  const t  = data?.transporte || {}
  const r  = data?.rastreio || {}
  const h  = data?.historico_cliente || {}
  const m  = data?.mensagens_wa || {}

  const ok6 = { border:'1px solid rgba(34,197,94,.3)' }
  const ok4 = { border:'1px solid rgba(239,68,68,.25)' }

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'22px 28px', background:'var(--bg)' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      <h1 style={{ fontSize:22, fontWeight:800, color:'var(--label)', margin:'0 0 4px', letterSpacing:'-.4px' }}>Debug — Pedido #{numero}</h1>
      <p style={{ fontSize:12, color:'var(--label-4)', margin:'0 0 20px' }}>Inspeciona todos os dados: Bling pedido + contato + rastreio + historico + mensagens WA</p>

      {/* Busca */}
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 14px', borderRadius:11, border:'1px solid var(--sep)', background:'var(--bg-2)', flex:1, maxWidth:400 }}>
          <Hash size={14} style={{ color:'var(--label-4)', flexShrink:0 }}/>
          <input value={numero} onChange={e => setNumero(e.target.value)} onKeyDown={e => e.key==='Enter' && buscar()}
            placeholder="Numero do pedido (ex: 228887)"
            style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:14, color:'var(--label)', fontFamily:'monospace' }}/>
        </div>
        <button onClick={buscar} disabled={loading} style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 22px', borderRadius:11, border:'none', background:'var(--accent)', color:'#000', cursor:loading?'not-allowed':'pointer', fontSize:13, fontWeight:700 }}>
          {loading ? <RefreshCw size={14} style={{animation:'spin 1s linear infinite'}}/> : <Search size={14}/>}
          {loading ? 'Buscando...' : 'Inspecionar'}
        </button>
      </div>

      {/* Erro */}
      {erro && (
        <div style={{ display:'flex', gap:10, padding:'12px 16px', borderRadius:11, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.25)', marginBottom:16 }}>
          <XCircle size={16} style={{ color:'#ef4444', flexShrink:0 }}/>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:'#ef4444', margin:'0 0 4px' }}>Erro ao buscar pedido</p>
            <p style={{ fontSize:12, color:'rgba(239,68,68,.8)', margin:0, fontFamily:'monospace' }}>{erro}</p>
          </div>
        </div>
      )}

      {data && <>

        {/* Status geral */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8, marginBottom:18 }}>
          {[
            { l:'Pedido',       ok:!!p.numero,                         v:p.numero?`#${p.numero}`:'Nao encontrado' },
            { l:'Canal',        ok:!!p.loja_id||p.loja_id===0,        v:LOJAS[p.loja_id]||`ID ${p.loja_id}` },
            { l:'Contato',      ok:!!c.id,                            v:c.id?c.nome?.split(' ')[0]||'OK':'Sem dados' },
            { l:'Rastreio',     ok:!!r.codigo,                        v:r.codigo||'Sem codigo' },
            { l:'Correios',     ok:!!r.raw_correios&&!r.erro,         v:r.raw_correios?'Consultado':'Falhou' },
            { l:'Msgs WA',      ok:(m.total||0)>0,                    v:`${m.total||0} msgs` },
          ].map(k => (
            <div key={k.l} style={{ background:'var(--bg-2)', border:`1px solid ${k.ok?'rgba(34,197,94,.3)':'rgba(239,68,68,.25)'}`, borderRadius:11, padding:'10px 12px' }}>
              <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--label-4)', marginBottom:5 }}>{k.l}</div>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:k.ok?'#22c55e':'#ef4444', flexShrink:0, display:'inline-block' }}/>
                <span style={{ fontSize:11.5, fontWeight:600, color:k.ok?'#22c55e':'#ef4444' }}>{k.v.length>16?k.v.slice(0,16)+'…':k.v}</span>
              </div>
            </div>
          ))}
        </div>

        {/* PEDIDO */}
        <Block title={`Pedido #${p.numero} — Bling`} color={p.numero?'rgba(34,197,94,.3)':'rgba(239,68,68,.25)'}>
          <div style={{ marginTop:8 }}>
            <Row label="Numero" value={p.numero} mono/>
            <Row label="ID Bling" value={p.id_bling} mono/>
            <Row label="Data" value={fmtDate(p.data)}/>
            <Row label="Data saida" value={p.data_saida?fmtDate(p.data_saida):'Nao preenchido'} cor={p.data_saida?'var(--label)':'#f59e0b'}/>
            <Row label="Data prevista" value={p.data_prevista?fmtDate(p.data_prevista):'—'}/>
            <Row label="Situacao ID" value={p.situacao_id} mono/>
            <Row label="Situacao label" value={SIT_LAB[p.situacao_id]||p.situacao_label||'—'} cor={SIT_COR[p.situacao_id]}/>
            <Row label="Total" value={R(p.total)} cor="var(--accent)"/>
            <Row label="Total produtos" value={R(p.total_produtos)}/>
            <Row label="Desconto" value={R(p.total_desconto)}/>
            <Row label="Loja ID" value={p.loja_id} mono/>
            <Row label="Loja mapeada" value={LOJAS[p.loja_id]||`Desconhecida (ID:${p.loja_id})`}/>
            <Row label="Numero na loja" value={p.numero_loja} mono/>
            <Row label="Canal" value={p.canal}/>
            <Row label="NF ID" value={p.nota_fiscal?.id} mono/>
            <Row label="NF Numero" value={p.nota_fiscal?.numero}/>
            <Row label="Observacoes" value={p.observacoes}/>
          </div>
          <div style={{ marginTop:10 }}>
            <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', margin:'0 0 6px' }}>Campos disponiveis ({p.campos_raiz?.length})</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {(p.campos_raiz||[]).map(cf => <span key={cf} style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-3)', fontFamily:'monospace' }}>{cf}</span>)}
            </div>
          </div>
          <JsonView data={data.raw_listagem} label="raw listagem Bling"/>
        </Block>

        {/* ITENS */}
        <Block title={`Itens (${(data.itens||[]).length})`}>
          {(data.itens||[]).map((item, i) => (
            <div key={i} style={{ padding:'10px 0', borderBottom:'1px solid var(--sep)' }}>
              <p style={{ fontSize:13, fontWeight:600, color:'var(--label)', margin:'0 0 8px' }}>{item.descricao}</p>
              <Row label="Codigo SKU" value={item.codigo} mono/>
              <Row label="Quantidade" value={item.quantidade}/>
              <Row label="Valor unit" value={R(item.valor)}/>
              <Row label="Total item" value={R((item.valor||0)*(item.quantidade||1))} cor="var(--accent)"/>
              <Row label="ID produto Bling" value={item.produto_id} mono/>
            </div>
          ))}
        </Block>

        {/* PAGAMENTO */}
        <Block title="Pagamento / Parcelas">
          {(data.pagamento||[]).length === 0
            ? <p style={{ fontSize:12, color:'var(--label-4)', margin:'10px 0' }}>Sem parcelas</p>
            : (data.pagamento||[]).map((parc, i) => (
              <div key={i} style={{ padding:'8px 0', borderBottom:'1px solid var(--sep)' }}>
                <Row label={`Forma ID (parcela ${i+1})`} value={parc.forma_id} mono/>
                <Row label="Forma descricao" value={parc.forma_desc}/>
                <Row label="PIX? (id=1896170)" value={parc.forma_id===1896170?'SIM — PIX':'NAO'} cor={parc.forma_id===1896170?'#22c55e':'var(--label)'}/>
                <Row label="Cartao? (id=3938183)" value={parc.forma_id===3938183?'SIM — CARTAO':'NAO'} cor={parc.forma_id===3938183?'#4a9fff':'var(--label)'}/>
                <Row label="Valor" value={R(parc.valor)} cor="var(--accent)"/>
                <Row label="Vencimento" value={fmtDate(parc.vencimento)}/>
                <JsonView data={parc.raw} label="raw parcela"/>
              </div>
            ))
          }
        </Block>

        {/* CONTATO PEDIDO */}
        <Block title="Contato (resumo do pedido)">
          <Row label="ID" value={cp.id} mono/>
          <Row label="Nome" value={cp.nome}/>
          <Row label="Tipo" value={cp.tipo}/>
          <JsonView data={cp.raw} label="raw contato pedido"/>
        </Block>

        {/* CONTATO COMPLETO */}
        <Block title="Contato COMPLETO (GET /contatos/:id)" color={c.id?'rgba(34,197,94,.3)':'rgba(239,68,68,.25)'}>
          {data.contato_completo?.erro && (
            <div style={{ padding:'8px 12px', borderRadius:9, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', margin:'8px 0', fontSize:12, color:'#ef4444' }}>
              Erro: {data.contato_completo.erro}
            </div>
          )}
          <Row label="ID" value={c.id} mono/>
          <Row label="Nome" value={c.nome}/>
          <Row label="Email" value={c.email} mono/>
          <Row label="Telefone" value={c.telefone} mono cor="var(--accent)"/>
          <Row label="Celular" value={c.celular} mono cor="var(--accent)"/>
          <Row label="CPF/CNPJ" value={c.numeroDocumento||c.cpfCnpj} mono/>
          <Row label="Tipo pessoa" value={c.tipo}/>
          <Row label="Nascimento" value={fmtDate(c.dataNascimento)}/>
          {(c.enderecos||[]).length > 0 && (
            <div style={{ marginTop:10 }}>
              <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', margin:'0 0 8px' }}>Enderecos ({c.enderecos.length})</p>
              {c.enderecos.map((e, i) => (
                <div key={i} style={{ padding:'8px 10px', borderRadius:8, background:'var(--bg)', border:'1px solid var(--sep)', marginBottom:6, fontSize:12.5, lineHeight:1.9, color:'var(--label-2)' }}>
                  <div><b>{e.tipo||'Principal'}</b></div>
                  <div>{e.endereco||e.logradouro}, {e.numero} {e.complemento?`— ${e.complemento}`:''}</div>
                  <div>{e.bairro} · {e.municipio}/{e.uf}</div>
                  <div style={{ fontFamily:'monospace', color:'var(--accent)' }}>CEP {e.cep}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop:8 }}>
            <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', margin:'0 0 6px' }}>Campos disponiveis ({data.contato_completo?.campos?.length||0})</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {(data.contato_completo?.campos||[]).map(cf => <span key={cf} style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-3)', fontFamily:'monospace' }}>{cf}</span>)}
            </div>
          </div>
          <JsonView data={data.contato_completo?.dados} label="raw contato completo"/>
        </Block>

        {/* TRANSPORTE */}
        <Block title="Transporte / Entrega">
          <Row label="Transportadora" value={t.transportadora}/>
          <Row label="Frete" value={R(t.frete_valor)}/>
          <Row label="Etiqueta — Nome" value={t.etiqueta?.nome}/>
          <Row label="Etiqueta — Logradouro" value={t.etiqueta?.logradouro}/>
          <Row label="Etiqueta — Numero" value={t.etiqueta?.numero}/>
          <Row label="Etiqueta — Bairro" value={t.etiqueta?.bairro}/>
          <Row label="Etiqueta — Municipio/UF" value={t.etiqueta?.municipio&&t.etiqueta?.uf?`${t.etiqueta.municipio}/${t.etiqueta.uf}`:'—'}/>
          <Row label="Etiqueta — CEP" value={t.etiqueta?.cep} mono/>
          <Row label="Campos transporte" value={(t.campos_raiz||[]).join(', ')}/>
          {(t.volumes||[]).map((vol, i) => (
            <div key={i} style={{ marginTop:12, padding:'10px 12px', borderRadius:9, background:'var(--bg)', border:`1px solid ${vol.codigo_rastreio?'rgba(34,197,94,.3)':'var(--sep)'}` }}>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--label-4)', margin:'0 0 8px', textTransform:'uppercase', letterSpacing:'.06em' }}>Volume {i+1}</p>
              <Row label="Codigo rastreio" value={vol.codigo_rastreio} mono cor={vol.codigo_rastreio?'var(--accent)':'var(--label-4)'}/>
              <Row label="Servico" value={vol.servico_desc}/>
              <Row label="Peso" value={vol.peso}/>
              <Row label="Ultima situacao" value={typeof vol.ultima_situacao==='object'?JSON.stringify(vol.ultima_situacao):vol.ultima_situacao}/>
              <JsonView data={vol.raw} label={`raw volume ${i+1}`}/>
            </div>
          ))}
          <JsonView data={t.etiqueta?.raw} label="raw etiqueta"/>
        </Block>

        {/* RASTREIO */}
        <Block title="Rastreio Correios" color={r.raw_correios&&!r.erro?'rgba(34,197,94,.3)':'rgba(239,68,68,.25)'}>
          <Row label="Codigo" value={r.codigo} mono cor="var(--accent)"/>
          {r.erro && <div style={{ padding:'8px 12px', borderRadius:9, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', margin:'8px 0', fontSize:12, color:'#ef4444', fontFamily:'monospace' }}>{r.erro}</div>}
          {r.raw_correios && (
            <div style={{ marginTop:8 }}>
              <p style={{ fontSize:11, color:r.raw_correios?.objetos?.[0]?.eventos?.length>0?'#22c55e':'#f59e0b', fontWeight:700, margin:'0 0 8px' }}>
                {r.raw_correios?.objetos?.[0]?.eventos?.length>0
                  ? `${r.raw_correios.objetos[0].eventos.length} eventos encontrados`
                  : 'Sem eventos no objetos[0].eventos'}
              </p>
              {(r.raw_correios?.objetos?.[0]?.eventos||[]).map((ev, i) => (
                <div key={i} style={{ padding:'8px 10px', borderRadius:8, background:'var(--bg)', border:'1px solid var(--sep)', marginBottom:6 }}>
                  <Row label="Status" value={ev.descricao}/>
                  <Row label="Detalhe" value={ev.detalhe}/>
                  <Row label="Data/hora" value={ev.dtHrCriado} mono/>
                  <Row label="Unidade" value={ev.unidade?.nome}/>
                  <Row label="Cidade/UF" value={ev.unidade?.endereco?`${ev.unidade.endereco.cidade||''}/${ev.unidade.endereco.uf||''}`:'—'}/>
                </div>
              ))}
            </div>
          )}
          {r.codigo && <a href={`https://rastreamento.correios.com.br/app/index.php?objetos=${r.codigo}`} target="_blank" rel="noreferrer"
            style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:10, padding:'7px 14px', borderRadius:9, border:'1px solid rgba(74,159,255,.3)', background:'rgba(74,159,255,.08)', color:'#4a9fff', textDecoration:'none', fontSize:12, fontWeight:600 }}>
            <ExternalLink size={12}/> Abrir no site dos Correios
          </a>}
          <JsonView data={r.raw_correios} label="raw Correios completo"/>
        </Block>

        {/* HISTORICO */}
        <Block title={`Historico do cliente (${h.total||0} pedidos)`} color={h.total>0?'rgba(34,197,94,.3)':undefined}>
          {h.erro && <div style={{ padding:'8px 12px', borderRadius:9, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', margin:'8px 0', fontSize:12, color:'#ef4444' }}>Erro: {h.erro}</div>}
          <Row label="Total pedidos encontrados" value={h.total||0} cor="var(--accent)"/>
          <Row label="Eh primeira compra" value={h.total===0?'SIM — primeira compra':'NAO — tem historico'} cor={h.total===0?'#f59e0b':'#22c55e'}/>
          {(h.pedidos||[]).sort((a,b)=>b.numero-a.numero).map((ped,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 12px', borderRadius:9, background:'var(--bg)', border:'1px solid var(--sep)', marginTop:6 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--accent)', fontFamily:'monospace', flexShrink:0 }}>#{ped.numero}</span>
              <span style={{ fontSize:11, color:'var(--label-4)', flexShrink:0 }}>{fmtDate(ped.data)}</span>
              <span style={{ fontSize:11, fontWeight:700, padding:'1px 7px', borderRadius:99, background:`${SIT_COR[ped.situacaoId]||'#888'}15`, color:SIT_COR[ped.situacaoId]||'#888', flexShrink:0 }}>{ped.situacaoLabel}</span>
              <span style={{ fontSize:11, color:'var(--label-4)', flexShrink:0 }}>Loja ID: {ped.lojaId}</span>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--label)', marginLeft:'auto', flexShrink:0 }}>R$ {Number(ped.total||0).toFixed(2).replace('.',',')}</span>
            </div>
          ))}
        </Block>

        {/* MENSAGENS WA */}
        <Block title={`Mensagens WhatsApp (${m.total||0})`} color={m.total>0?'rgba(34,197,94,.3)':undefined}>
          <Row label="Telefone buscado" value={m.tel_tentado} mono/>
          {m.erro && <div style={{ padding:'8px 12px', borderRadius:9, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', margin:'8px 0', fontSize:12, color:'#ef4444' }}>Erro: {m.erro}</div>}
          {(m.lista||[]).slice(0,10).map((msg,i) => (
            <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginTop:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:msg.direcao==='entrada'?'var(--fill)':'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:9, fontWeight:700, color:msg.direcao==='entrada'?'var(--label-4)':'var(--accent)' }}>{msg.direcao==='entrada'?'CLI':'BIA'}</span>
              </div>
              <div style={{ flex:1, background:'var(--bg)', borderRadius:10, padding:'9px 12px', border:`1px solid ${msg.direcao==='entrada'?'var(--sep)':'var(--accent)30'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:msg.direcao==='entrada'?'var(--label-3)':'var(--accent)' }}>{msg.direcao==='entrada'?'Cliente':'Bia IA'}</span>
                  <span style={{ fontSize:10, color:'var(--label-4)', fontFamily:'monospace' }}>{fmtDT(msg.criado_em)}</span>
                </div>
                <p style={{ fontSize:12, color:'var(--label-2)', margin:0, lineHeight:1.5, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{(msg.conteudo||'').slice(0,300)}</p>
              </div>
            </div>
          ))}
          {m.total===0&&!m.erro&&<p style={{ fontSize:12, color:'var(--label-4)', margin:'10px 0' }}>Sem mensagens — verifique o telefone do contato</p>}
        </Block>

        <div style={{ textAlign:'right', fontSize:11, color:'var(--label-4)', marginTop:8, fontFamily:'monospace' }}>
          Gerado em: {fmtDT(data.gerado_em)}
        </div>

      </>}
    </div>
  )
}
