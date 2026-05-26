import { useState, useCallback } from 'react'
import {
  Search, RefreshCw, Copy, Check, ChevronDown, ChevronRight,
  CheckCircle, XCircle, AlertTriangle, Package, User, Truck,
  MessageSquare, CreditCard, Hash, MapPin, Phone, Mail,
  Calendar, Tag, FileText, ExternalLink, Clock, Activity,
  Database, Wifi, WifiOff, Eye, EyeOff, Info
} from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d.length===10?d+'T12:00:00':d).toLocaleDateString('pt-BR') : '—'
const fmtDT   = d => d ? new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '—'
const R = n => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`

function CopyBtn({ value, label }) {
  const [ok, setOk] = useState(false)
  const copy = () => {
    const text = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '')
    navigator.clipboard.writeText(text)
    setOk(true); setTimeout(() => setOk(false), 2000)
  }
  return (
    <button onClick={copy} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:5, border:'1px solid var(--sep)', background:'transparent', color:ok?'#22c55e':'var(--label-4)', cursor:'pointer', fontSize:10, fontWeight:ok?700:400, whiteSpace:'nowrap', flexShrink:0 }}>
      {ok ? <><Check size={9}/> Copiado</> : <><Copy size={9}/> {label||'Copiar'}</>}
    </button>
  )
}

function StatusDot({ ok, label }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, fontWeight:600 }}>
      <span style={{ width:8, height:8, borderRadius:'50%', background:ok?'#22c55e':'#ef4444', display:'inline-block', boxShadow:ok?'0 0 0 3px rgba(34,197,94,.2)':'0 0 0 3px rgba(239,68,68,.2)' }}/>
      <span style={{ color:ok?'#22c55e':'#ef4444' }}>{label}</span>
    </span>
  )
}

function Section({ title, icon:Ic, ok, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ background:'var(--bg-2)', border:`1px solid ${ok===true?'rgba(34,197,94,.3)':ok===false?'rgba(239,68,68,.3)':'var(--sep)'}`, borderRadius:12, overflow:'hidden', marginBottom:12 }}>
      <button onClick={() => setOpen(v=>!v)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
        {Ic && <Ic size={14} style={{ color:ok===true?'#22c55e':ok===false?'#ef4444':'var(--label-4)', flexShrink:0 }}/>}
        <span style={{ fontSize:12.5, fontWeight:700, color:'var(--label)', flex:1 }}>{title}</span>
        {ok === true  && <CheckCircle size={13} style={{ color:'#22c55e' }}/>}
        {ok === false && <XCircle size={13} style={{ color:'#ef4444' }}/>}
        {open ? <ChevronDown size={13} style={{ color:'var(--label-4)' }}/> : <ChevronRight size={13} style={{ color:'var(--label-4)' }}/>}
      </button>
      {open && <div style={{ padding:'4px 16px 16px', borderTop:'1px solid var(--sep)' }}>{children}</div>}
    </div>
  )
}

function Field({ label, value, mono=false, cor, copy=true, badge }) {
  if (value === null || value === undefined || value === '') value = '—'
  const isNull = value === '—'
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'7px 0', borderBottom:'1px solid var(--sep)' }}>
      <span style={{ fontSize:11.5, color:'var(--label-4)', minWidth:160, flexShrink:0, paddingTop:1 }}>{label}</span>
      <div style={{ flex:1, display:'flex', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
        <span style={{ fontSize:12.5, fontWeight:isNull?400:500, color:isNull?'var(--label-4)':cor||'var(--label)', fontFamily:mono?'monospace':'inherit', wordBreak:'break-all' }}>
          {typeof value==='object' ? JSON.stringify(value) : String(value)}
        </span>
        {badge && <span style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:99, background:`${badge.cor}18`, color:badge.cor, border:`1px solid ${badge.cor}30` }}>{badge.label}</span>}
      </div>
      {copy && !isNull && <CopyBtn value={value}/>}
    </div>
  )
}

function RawBlock({ data, label }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ marginTop:8 }}>
      <button onClick={() => setShow(v=>!v)} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:7, border:'1px solid var(--sep)', background:'var(--fill)', color:'var(--label-3)', cursor:'pointer', fontSize:11, fontWeight:500 }}>
        {show?<EyeOff size={11}/>:<Eye size={11}/>} {show?'Ocultar':'Ver'} {label||'JSON raw'}
      </button>
      {show && (
        <div style={{ position:'relative', marginTop:8 }}>
          <CopyBtn value={data} label="Copiar JSON"/>
          <pre style={{ fontSize:10.5, fontFamily:'monospace', color:'var(--label-3)', background:'var(--bg)', border:'1px solid var(--sep)', borderRadius:9, padding:'12px', marginTop:6, overflowX:'auto', maxHeight:400, whiteSpace:'pre-wrap', wordBreak:'break-all', lineHeight:1.6 }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
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
      if (d.erro && !d.pedido) { setErro(d.erro) } else { setData(d) }
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

  // Mapa de lojas conhecido
  const LOJAS = {
    205946980: 'Shopee',
    203414926: 'Mercado Livre',
    204884434: 'Nuvemshop',
    205916963: 'TikTok Shop',
    205693668: 'Nuvemshop 2',
    0:         'Loja Própria / Manual',
  }
  const canalLabel = LOJAS[p.loja_id] || `Desconhecido (ID: ${p.loja_id})`

  const SIT_MAP = { 6:'Em Aberto', 9:'Atendido', 12:'Cancelado', 15:'Verificado' }

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'22px 28px', background:'var(--bg)' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--label)', margin:'0 0 4px', letterSpacing:'-.4px' }}>Debug — Pedido Completo</h1>
        <p style={{ fontSize:12, color:'var(--label-4)', margin:0 }}>
          Inspeciona todos os dados brutos: Bling pedido + contato + rastreio + histórico + mensagens WA
        </p>
      </div>

      {/* Barra de busca */}
      <div style={{ display:'flex', gap:10, marginBottom:20, alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 14px', borderRadius:11, border:'1px solid var(--sep)', background:'var(--bg-2)', flex:1, maxWidth:420 }}>
          <Hash size={14} style={{ color:'var(--label-4)', flexShrink:0 }}/>
          <input
            value={numero}
            onChange={e => setNumero(e.target.value)}
            onKeyDown={e => e.key==='Enter' && buscar()}
            placeholder="Número do pedido (ex: 228887)"
            style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:14, color:'var(--label)', fontFamily:'monospace' }}
          />
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

      {/* Resultado */}
      {data && <>

        {/* Status geral — painel rápido */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:18 }}>
          {[
            { label:'Pedido',      ok:!!p.numero,                            val:p.numero?`#${p.numero}`:'—' },
            { label:'Canal',       ok:!!p.loja_id||p.loja_id===0,           val:canalLabel },
            { label:'Contato',     ok:!!c.id,                               val:c.id?c.nome:'Sem dados' },
            { label:'Rastreio',    ok:!!r.codigo,                           val:r.codigo||'Sem código' },
            { label:'Correios',    ok:!!r.raw_correios&&!r.erro,            val:r.raw_correios?'Consultado':'Erro/Sem dados' },
            { label:'Mensagens WA',ok:(m.total||0)>0,                       val:`${m.total||0} msgs` },
          ].map(k => (
            <div key={k.label} style={{ background:'var(--bg-2)', border:`1px solid ${k.ok?'rgba(34,197,94,.3)':'rgba(239,68,68,.25)'}`, borderRadius:11, padding:'11px 13px' }}>
              <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', marginBottom:6 }}>{k.label}</div>
              <StatusDot ok={k.ok} label={k.val.length>18?k.val.slice(0,18)+'…':k.val}/>
            </div>
          ))}
        </div>

        {/* PEDIDO */}
        <Section title={`Pedido #${p.numero} — Dados Bling`} icon={Package} ok={!!p.numero}>
          <div style={{ marginTop:8 }}>
            <Field label="Número" value={p.numero} mono/>
            <Field label="ID interno Bling" value={p.id_bling} mono/>
            <Field label="Data do pedido" value={fmtDate(p.data)}/>
            <Field label="Data de saída" value={p.data_saida?fmtDate(p.data_saida):'—'} cor={p.data_saida?'var(--label)':'var(--label-4)'}/>
            <Field label="Data prevista" value={p.data_prevista?fmtDate(p.data_prevista):'—'}/>
            <Field label="Situação ID" value={p.situacao_id} mono badge={p.situacao_id?{label:SIT_MAP[p.situacao_id]||'Desconhecida',cor:({6:'#f59e0b',9:'#4a9fff',12:'#ef4444',15:'#22c55e'})[p.situacao_id]||'#888'}:null}/>
            <Field label="Situação label" value={p.situacao_label||p.situacao_valor}/>
            <Field label="Total" value={R(p.total)} cor="var(--accent)"/>
            <Field label="Total produtos" value={R(p.total_produtos)}/>
            <Field label="Desconto" value={R(p.total_desconto)}/>
            <Field label="Loja ID" value={p.loja_id} mono badge={{ label:canalLabel, cor:{205946980:'#EE4D2D',203414926:'#f5a623',204884434:'#1B96FF',205916963:'#69C9D0',205693668:'#1B96FF',0:'#10b981'}[p.loja_id]||'#888' }}/>
            <Field label="Loja nome" value={p.loja_nome}/>
            <Field label="Loja código" value={p.loja_codigo} mono/>
            <Field label="Número na loja" value={p.numero_loja} mono/>
            <Field label="Canal" value={p.canal}/>
            <Field label="Nota fiscal ID" value={p.nota_fiscal?.id} mono/>
            <Field label="Nota fiscal Nº" value={p.nota_fiscal?.numero}/>
            <Field label="Observações" value={p.observacoes} copy={false}/>
            <Field label="Obs. internas" value={p.obs_internas} copy={false}/>
          </div>
          <div style={{ marginTop:10 }}>
            <p style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', margin:'0 0 6px' }}>Campos disponíveis no raw ({p.campos_raiz?.length})</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {(p.campos_raiz||[]).map(c => <span key={c} style={{ fontSize:10.5, padding:'2px 7px', borderRadius:5, background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-3)', fontFamily:'monospace' }}>{c}</span>)}
            </div>
          </div>
          <RawBlock data={data.raw_listagem} label="raw listagem"/>
        </Section>

        {/* ITENS */}
        <Section title={`Itens (${(data.itens||[]).length})`} icon={Package} ok={(data.itens||[]).length>0}>
          {(data.itens||[]).map((item,i) => (
            <div key={i} style={{ padding:'10px 0', borderBottom:'1px solid var(--sep)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--label)', maxWidth:340 }}>{item.descricao}</span>
                <span style={{ fontSize:14, fontWeight:700, color:'var(--accent)' }}>{R((item.valor||0)*(item.quantidade||1))}</span>
              </div>
              <div style={{ display:'flex', gap:16 }}>
                <Field label="Código SKU" value={item.codigo} mono copy/>
                <Field label="Quantidade" value={item.quantidade}/>
                <Field label="Valor unit." value={R(item.valor)}/>
                <Field label="ID produto Bling" value={item.produto_id} mono copy/>
              </div>
            </div>
          ))}
        </Section>

        {/* PAGAMENTO */}
        <Section title="Pagamento / Parcelas" icon={CreditCard} ok={(data.pagamento||[]).length>0}>
          {(data.pagamento||[]).length === 0
            ? <p style={{ fontSize:12, color:'var(--label-4)', margin:'10px 0' }}>Sem parcelas registradas</p>
            : (data.pagamento||[]).map((parc,i) => (
              <div key={i} style={{ padding:'8px 0', borderBottom:'1px solid var(--sep)' }}>
                <Field label={`Forma ID (parcela ${i+1})`} value={parc.forma_id} mono badge={{ label:parc.forma_id===1896170?'PIX':parc.forma_id===3938183?'Cartão':'Outra', cor:parc.forma_id===1896170?'#22c55e':'#4a9fff' }}/>
                <Field label="Forma descrição" value={parc.forma_desc}/>
                <Field label="Valor" value={R(parc.valor)} cor="var(--accent)"/>
                <Field label="Vencimento" value={fmtDate(parc.vencimento)}/>
                <RawBlock data={parc.raw} label="raw parcela"/>
              </div>
            ))
          }
        </Section>

        {/* CONTATO PEDIDO */}
        <Section title="Contato (resumo do pedido)" icon={User} ok={!!cp.id}>
          <Field label="ID Bling" value={cp.id} mono/>
          <Field label="Nome" value={cp.nome}/>
          <Field label="Tipo" value={cp.tipo}/>
          <RawBlock data={cp.raw} label="raw contato pedido"/>
        </Section>

        {/* CONTATO COMPLETO */}
        <Section title="Contato COMPLETO (GET /contatos/:id)" icon={User} ok={!!c.id}>
          {data.contato_completo?.erro && (
            <div style={{ display:'flex', gap:8, padding:'8px 12px', borderRadius:9, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', margin:'8px 0' }}>
              <AlertTriangle size={13} style={{ color:'#ef4444', flexShrink:0 }}/>
              <span style={{ fontSize:12, color:'#ef4444' }}>Erro: {data.contato_completo.erro}</span>
            </div>
          )}
          {c.id ? <>
            <Field label="ID" value={c.id} mono/>
            <Field label="Nome completo" value={c.nome}/>
            <Field label="Tipo" value={c.tipo} badge={{ label:c.tipo==='F'?'Pessoa Física':'Pessoa Jurídica', cor:'#7c6af7' }}/>
            <Field label="Email" value={c.email} mono/>
            <Field label="Telefone" value={c.telefone} mono cor="var(--accent)"/>
            <Field label="Celular" value={c.celular} mono cor="var(--accent)"/>
            <Field label="CPF/CNPJ" value={c.numeroDocumento||c.cpfCnpj} mono/>
            <Field label="Nascimento" value={fmtDate(c.dataNascimento)}/>
            <Field label="Situação" value={c.situacao?.id}/>
            <div style={{ marginTop:8 }}>
              <p style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', margin:'0 0 6px' }}>Endereços ({(c.enderecos||[]).length})</p>
              {(c.enderecos||[]).map((e,i) => (
                <div key={i} style={{ padding:'8px 10px', borderRadius:8, background:'var(--bg)', border:'1px solid var(--sep)', marginBottom:6, fontSize:12, lineHeight:1.8, color:'var(--label-2)' }}>
                  <div><b>{e.tipo||'Principal'}</b> — {e.endereco}, {e.numero} {e.complemento&&`— ${e.complemento}`}</div>
                  <div>{e.bairro} · {e.municipio}/{e.uf}</div>
                  <div style={{ fontFamily:'monospace', color:'var(--accent)' }}>CEP {e.cep}</div>
                </div>
              ))}
              {(c.enderecos||[]).length === 0 && <p style={{ fontSize:12, color:'var(--label-4)' }}>Sem endereços cadastrados</p>}
            </div>
            <div style={{ marginTop:8 }}>
              <p style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', margin:'0 0 6px' }}>Campos disponíveis ({data.contato_completo.campos?.length})</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {(data.contato_completo.campos||[]).map(f => <span key={f} style={{ fontSize:10.5, padding:'2px 7px', borderRadius:5, background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-3)', fontFamily:'monospace' }}>{f}</span>)}
              </div>
            </div>
            <RawBlock data={data.contato_completo.dados} label="raw contato completo"/>
          </> : <p style={{ fontSize:12, color:'var(--label-4)', margin:'10px 0' }}>Dados completos não carregados</p>}
        </Section>

        {/* TRANSPORTE */}
        <Section title="Transporte / Entrega" icon={Truck} ok={!!(t.volumes?.length>0||t.etiqueta?.logradouro)}>
          <Field label="Transportadora" value={t.transportadora}/>
          <Field label="Frete" value={R(t.frete_valor)}/>
          <Field label="Prazo entrega" value={t.prazo_entrega}/>
          <div style={{ marginTop:10 }}>
            <p style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', margin:'0 0 8px' }}>Etiqueta</p>
            <Field label="Destinatário" value={t.etiqueta?.nome}/>
            <Field label="Logradouro" value={t.etiqueta?.logradouro}/>
            <Field label="Número" value={t.etiqueta?.numero}/>
            <Field label="Complemento" value={t.etiqueta?.complemento}/>
            <Field label="Bairro" value={t.etiqueta?.bairro}/>
            <Field label="Município" value={t.etiqueta?.municipio}/>
            <Field label="UF" value={t.etiqueta?.uf}/>
            <Field label="CEP" value={t.etiqueta?.cep} mono/>
            <RawBlock data={t.etiqueta?.raw} label="raw etiqueta"/>
          </div>
          {(t.volumes||[]).map((vol,i) => (
            <div key={i} style={{ marginTop:12, padding:'10px 12px', borderRadius:9, background:'var(--bg)', border:'1px solid var(--sep)' }}>
              <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', margin:'0 0 8px' }}>Volume {i+1}</p>
              <Field label="Código rastreio" value={vol.codigo_rastreio} mono cor={vol.codigo_rastreio?'var(--accent)':'var(--label-4)'}/>
              <Field label="Serviço ID" value={vol.servico_id} mono/>
              <Field label="Serviço desc." value={vol.servico_desc}/>
              <Field label="Peso" value={vol.peso}/>
              <Field label="Quantidade" value={vol.quantidade}/>
              <Field label="Última situação" value={typeof vol.ultima_situacao==='object'?JSON.stringify(vol.ultima_situacao):vol.ultima_situacao}/>
              <RawBlock data={vol.raw} label={`raw volume ${i+1}`}/>
            </div>
          ))}
          <div style={{ marginTop:8 }}>
            <p style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', margin:'0 0 6px' }}>Campos do transporte</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {(t.campos_raiz||[]).map(f => <span key={f} style={{ fontSize:10.5, padding:'2px 7px', borderRadius:5, background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-3)', fontFamily:'monospace' }}>{f}</span>)}
            </div>
          </div>
        </Section>

        {/* RASTREIO CORREIOS */}
        <Section title="Rastreio Correios" icon={Navigation} ok={!!r.raw_correios && !r.erro}>
          <Field label="Código" value={r.codigo} mono cor="var(--accent)"/>
          {r.erro && <div style={{ padding:'8px 12px', borderRadius:9, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', margin:'8px 0' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#ef4444', margin:'0 0 4px' }}>Erro ao consultar Correios:</p>
            <p style={{ fontSize:11, color:'rgba(239,68,68,.8)', margin:0, fontFamily:'monospace' }}>{r.erro}</p>
          </div>}
          {r.raw_correios && <>
            <div style={{ marginTop:8 }}>
              <p style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--label-4)', margin:'0 0 6px' }}>Estrutura da resposta Correios</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
                {Object.keys(r.raw_correios).map(k => <span key={k} style={{ fontSize:10.5, padding:'2px 7px', borderRadius:5, background:'var(--fill)', border:'1px solid var(--sep)', color:'var(--label-3)', fontFamily:'monospace' }}>{k}</span>)}
              </div>
              {r.raw_correios?.objetos?.[0]?.eventos?.length > 0 ? (
                <>
                  <p style={{ fontSize:11, fontWeight:700, color:'#22c55e', margin:'0 0 8px' }}>✅ {r.raw_correios.objetos[0].eventos.length} eventos encontrados</p>
                  {r.raw_correios.objetos[0].eventos.map((ev,i) => (
                    <div key={i} style={{ padding:'8px 10px', borderRadius:8, background:'var(--bg)', border:'1px solid var(--sep)', marginBottom:6 }}>
                      <Field label="Status" value={ev.descricao} copy={false}/>
                      <Field label="Detalhe" value={ev.detalhe} copy={false}/>
                      <Field label="Data/hora" value={ev.dtHrCriado} mono/>
                      <Field label="Unidade" value={ev.unidade?.nome} copy={false}/>
                      <Field label="Cidade/UF" value={ev.unidade?.endereco?`${ev.unidade.endereco?.cidade||''}/${ev.unidade.endereco?.uf||''}`:'—'}/>
                    </div>
                  ))}
                </>
              ) : (
                <p style={{ fontSize:12, color:'#f59e0b', margin:'4px 0' }}>⚠️ Sem eventos no campo "objetos[0].eventos" — verifique o JSON raw</p>
              )}
            </div>
            <RawBlock data={r.raw_correios} label="raw Correios completo"/>
          </>}
          {r.codigo && (
            <a href={`https://rastreamento.correios.com.br/app/index.php?objetos=${r.codigo}`} target="_blank" rel="noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:10, padding:'7px 14px', borderRadius:9, border:'1px solid rgba(74,159,255,.3)', background:'rgba(74,159,255,.08)', color:'#4a9fff', textDecoration:'none', fontSize:12, fontWeight:600 }}>
              <ExternalLink size={12}/> Abrir no site dos Correios
            </a>
          )}
        </Section>

        {/* HISTÓRICO */}
        <Section title={`Histórico do cliente (${h.total} pedidos)`} icon={Activity} ok={h.total>0}>
          {h.erro && <div style={{ padding:'8px 12px', borderRadius:9, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', margin:'8px 0', fontSize:12, color:'#ef4444' }}>Erro: {h.erro}</div>}
          {h.total > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
              {h.pedidos.sort((a,b)=>b.numero-a.numero).map((ped,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 12px', borderRadius:9, background:'var(--bg)', border:'1px solid var(--sep)' }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--accent)', fontFamily:'monospace', flexShrink:0 }}>#{ped.numero}</span>
                  <span style={{ fontSize:11.5, color:'var(--label-4)', flexShrink:0 }}>{fmtDate(ped.data)}</span>
                  <span style={{ fontSize:11, fontWeight:700, padding:'1px 7px', borderRadius:99, background:({6:'rgba(245,158,11,.1)',9:'rgba(74,159,255,.1)',12:'rgba(239,68,68,.1)',15:'rgba(34,197,94,.1)'})[ped.situacaoId]||'var(--fill)', color:({6:'#f59e0b',9:'#4a9fff',12:'#ef4444',15:'#22c55e'})[ped.situacaoId]||'#888', flexShrink:0 }}>{ped.situacaoLabel}</span>
                  <span style={{ fontSize:11, color:'var(--label-4)', flexShrink:0 }}>Loja ID: {ped.lojaId}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--label)', marginLeft:'auto', flexShrink:0 }}>R$ {Number(ped.total||0).toFixed(2).replace('.',',')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize:12, color:'var(--label-4)', margin:'10px 0' }}>Nenhum pedido histórico (ou erro na busca por idContato)</p>
          )}
        </Section>

        {/* MENSAGENS WA */}
        <Section title={`Mensagens WhatsApp (${m.total})`} icon={MessageSquare} ok={m.total>0}>
          <Field label="Telefone buscado" value={m.tel_tentado} mono/>
          {m.erro && <div style={{ padding:'8px 12px', borderRadius:9, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', margin:'8px 0', fontSize:12, color:'#ef4444' }}>Erro: {m.erro}</div>}
          {(m.lista||[]).slice(0,10).map((msg,i) => (
            <div key={i} style={{ padding:'8px 10px', borderRadius:9, background:'var(--bg)', border:`1px solid ${msg.direcao==='entrada'?'var(--sep)':'var(--accent)25'}`, marginTop:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:10.5, fontWeight:700, color:msg.direcao==='entrada'?'var(--label-3)':'var(--accent)' }}>{msg.direcao==='entrada'?'Cliente':'Bia IA'}</span>
                <span style={{ fontSize:10, color:'var(--label-4)', fontFamily:'monospace' }}>{fmtDT(msg.criado_em)}</span>
              </div>
              <p style={{ fontSize:12, color:'var(--label-2)', margin:0, lineHeight:1.5, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{(msg.conteudo||'').slice(0,200)}{(msg.conteudo?.length||0)>200?'…':''}</p>
            </div>
          ))}
          {m.total === 0 && !m.erro && <p style={{ fontSize:12, color:'var(--label-4)', margin:'10px 0' }}>Sem mensagens encontradas para o telefone deste contato</p>}
        </Section>

        {/* Timestamp */}
        <div style={{ textAlign:'right', fontSize:11, color:'var(--label-4)', marginTop:8, fontFamily:'monospace' }}>
          Gerado em: {fmtDT(data.gerado_em)} · <CopyBtn value={data} label="Copiar JSON completo"/>
        </div>

      </>}
    </div>
  )
}
