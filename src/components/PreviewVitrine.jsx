import { ChevronLeft, Phone, MoreHorizontal, X, ShoppingCart, Search, ChevronRight, Plus, Minus, Bell } from 'lucide-react'

// Cores reais do WhatsApp (não o tema do dashboard)
const WA = {
  fundo:'#0b141a', header:'#202c33', verde:'#00a884', verdeBtn:'#075E54', verdeClaro:'#25d366',
  card:'#ffffff', cardInk:'#111b21', cardInk2:'#54656f', cardInk3:'#8696a0',
  bolha:'#005c4b', sep:'rgba(255,255,255,.06)',
}

// ── Moldura do iPhone com as telas do Flow dentro ─────────────────────────────
export default function PreviewVitrine({ cfg, grupos, tela='vitrine' }) {
  const hora = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
  const pix = (preco) => (preco*(1-(cfg?.desconto_pix||0)/100))

  return (
    <div style={{width:'100%', display:'flex', flexDirection:'column', alignItems:'center', userSelect:'none', position:'relative', paddingTop:4}}>
      {/* botões laterais */}
      <div style={{position:'absolute',left:10,top:72,width:3,height:26,borderRadius:'3px 0 0 3px',background:'linear-gradient(180deg,#1f2d38,#0d1820)'}}/>
      <div style={{position:'absolute',left:10,top:105,width:3,height:26,borderRadius:'3px 0 0 3px',background:'linear-gradient(180deg,#1f2d38,#0d1820)'}}/>
      <div style={{position:'absolute',right:10,top:90,width:3,height:48,borderRadius:'0 3px 3px 0',background:'linear-gradient(180deg,#1f2d38,#0d1820)'}}/>

      {/* moldura */}
      <div style={{
        width:280, borderRadius:46, padding:'8px 7px',
        background:'linear-gradient(160deg,#1f2d38 0%,#0d1820 50%,#111c26 100%)',
        border:'1px solid rgba(255,255,255,.1)',
        boxShadow:['0 0 0 1px rgba(0,0,0,.95)','0 0 0 8px #0c1a22','0 0 0 9px rgba(255,255,255,.05)','0 24px 60px rgba(0,0,0,.85)','inset 0 1px 0 rgba(255,255,255,.07)'].join(','),
      }}>
        <div style={{borderRadius:38, overflow:'hidden', background:WA.fundo}}>
          {/* status bar */}
          <div style={{background:'#111b21', padding:'12px 18px 5px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative'}}>
            <span style={{fontSize:10, color:'#aab8c2', fontWeight:700}}>{hora}</span>
            <div style={{position:'absolute', left:'50%', top:6, transform:'translateX(-50%)', width:76, height:22, borderRadius:99, background:'#000', border:'1px solid rgba(255,255,255,.07)'}}/>
            <div style={{display:'flex', gap:4, alignItems:'center'}}>
              <div style={{display:'flex', alignItems:'flex-end', gap:1}}>
                {[3,5,7,9].map((h,i)=><div key={i} style={{width:2,height:h,borderRadius:1,background:i<3?'#aab8c2':'rgba(170,184,194,.25)'}}/>)}
              </div>
              <div style={{width:16,height:8,borderRadius:2,border:'1.2px solid rgba(170,184,194,.5)',padding:1,display:'flex',alignItems:'center'}}>
                <div style={{width:'72%',height:'100%',borderRadius:1,background:'#aab8c2'}}/>
              </div>
            </div>
          </div>

          {tela === 'vitrine'  && <TelaVitrine cfg={cfg} grupos={grupos}/>}
          {tela === 'detalhe'  && <TelaDetalhe cfg={cfg} pix={pix}/>}
          {tela === 'carrinho' && <TelaCarrinho cfg={cfg} pix={pix}/>}
        </div>
      </div>

      {/* legenda da tela */}
      <div style={{marginTop:14, fontSize:11, color:'#7b81a0', display:'flex', gap:6, alignItems:'center'}}>
        <Smartphone/> Pré-visualização ao vivo · {tela}
      </div>
    </div>
  )
}

function Smartphone() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
}

// Header do "Flow" (modal dentro do WhatsApp)
function FlowHeader({ titulo, fechar=true }) {
  return (
    <div style={{background:WA.header, padding:'10px 12px', display:'flex', alignItems:'center', gap:9, borderBottom:`1px solid ${WA.sep}`}}>
      {fechar ? <X size={16} style={{color:'#e9edef'}}/> : <ChevronLeft size={16} style={{color:'#e9edef'}}/>}
      <span style={{flex:1, fontSize:12.5, fontWeight:700, color:'#e9edef'}}>{titulo}</span>
      <ShoppingCart size={15} style={{color:'#aab8c2'}}/>
    </div>
  )
}

// ── TELA 1: Vitrine (grupos → categorias) ─────────────────────────────────────
function TelaVitrine({ cfg, grupos }) {
  const apelido = (nome) => (cfg?.apelidos||{})[nome] || nome
  const temGrupos = (grupos||[]).length > 0

  return (
    <div>
      <FlowHeader titulo="Nossa loja" fechar/>
      <div style={{background:WA.fundo, minHeight:300, maxHeight:380, overflowY:'auto', padding:'12px 10px'}}>
        {/* saudação */}
        <div style={{background:WA.header, borderRadius:11, padding:'10px 12px', marginBottom:11}}>
          <div style={{color:'#e9edef', fontSize:12.5, fontWeight:600}}>{cfg?.saudacao || 'Confira nossos produtos ✨'}</div>
        </div>

        {temGrupos ? (
          (grupos||[]).map(g => (
            <div key={g.id} style={{marginBottom:13}}>
              <div style={{fontSize:11, color:WA.cardInk3, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6, paddingLeft:2}}>{g.nome}</div>
              <div style={{display:'flex', flexDirection:'column', gap:5}}>
                {(g.subcategorias||[]).slice(0,4).map(sub => (
                  <div key={sub} style={{background:WA.card, borderRadius:9, padding:'9px 11px', display:'flex', alignItems:'center', gap:9}}>
                    <div style={{width:30, height:30, borderRadius:7, background:'#f0e6d8', flexShrink:0}}/>
                    <span style={{flex:1, fontSize:12, fontWeight:600, color:WA.cardInk}}>{apelido(sub)}</span>
                    <ChevronRight size={14} style={{color:WA.cardInk3}}/>
                  </div>
                ))}
                {(g.subcategorias||[]).length === 0 && (
                  <div style={{fontSize:10.5, color:WA.cardInk3, padding:'6px 2px', fontStyle:'italic'}}>Sem categorias neste grupo</div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:6}}>
            <div style={{fontSize:10.5, color:WA.cardInk3, marginBottom:3, paddingLeft:2}}>Categorias</div>
            {['Correntes de Strass','Zircônias','Pingentes'].map(c => (
              <div key={c} style={{background:WA.card, borderRadius:9, padding:'9px 11px', display:'flex', alignItems:'center', gap:9}}>
                <div style={{width:30, height:30, borderRadius:7, background:'#f0e6d8', flexShrink:0}}/>
                <span style={{flex:1, fontSize:12, fontWeight:600, color:WA.cardInk}}>{apelido(c)}</span>
                <ChevronRight size={14} style={{color:WA.cardInk3}}/>
              </div>
            ))}
            <div style={{fontSize:10, color:WA.cardInk3, textAlign:'center', marginTop:8, fontStyle:'italic'}}>Crie grupos para organizar em 2 níveis</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── TELA 2: Detalhe do produto ────────────────────────────────────────────────
function TelaDetalhe({ cfg, pix }) {
  const preco = 15.00
  return (
    <div>
      <FlowHeader titulo="Detalhes do produto" fechar={false}/>
      <div style={{background:WA.fundo, minHeight:300, maxHeight:380, overflowY:'auto', padding:'12px 10px'}}>
        <div style={{background:WA.card, borderRadius:11, overflow:'hidden'}}>
          <div style={{height:120, background:'#f0e6d8', display:'flex', alignItems:'center', justifyContent:'center', position:'relative'}}>
            <div style={{width:50,height:50,borderRadius:'50%',background:'#d88a4a44'}}/>
            <div style={{position:'absolute', bottom:6, right:6, display:'flex', gap:3}}>
              {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:'50%',background:i===0?WA.verdeBtn:'#d1d7db'}}/>)}
            </div>
          </div>
          <div style={{padding:'11px 13px'}}>
            <div style={{fontSize:13.5, fontWeight:600, color:WA.cardInk}}>Fio Cristal Laranjão 6mm</div>
            <div style={{fontSize:15, fontWeight:700, color:WA.verdeBtn, margin:'4px 0'}}>
              R$ {preco.toFixed(2).replace('.',',')}
              {cfg?.mostrar_pix && <span style={{fontSize:10.5, color:WA.cardInk3, fontWeight:500, marginLeft:6}}>PIX R$ {pix(preco).toFixed(2).replace('.',',')}</span>}
            </div>
            <div style={{fontSize:11, color:WA.cardInk2, lineHeight:1.5, marginBottom:11}}>Fio de cristal facetado, tom laranjão. Pacote com aprox. 70 unidades.</div>

            <div style={{fontSize:10.5, color:WA.cardInk3, fontWeight:700, marginBottom:5}}>TAMANHO</div>
            <div style={{display:'flex', gap:5, marginBottom:11}}>
              {['6mm','8mm','10mm'].map((t,i)=>(
                <span key={t} style={{border:`1px solid ${i===0?WA.verdeBtn:'#d1d7db'}`, color:i===0?WA.verdeBtn:WA.cardInk2, background:i===0?'#e7f4f0':'#fff', borderRadius:7, padding:'5px 11px', fontSize:11.5, fontWeight:i===0?700:500}}>{t}</span>
              ))}
            </div>

            <div style={{fontSize:10.5, color:WA.cardInk3, fontWeight:700, marginBottom:5}}>QUANTIDADE</div>
            <div style={{display:'flex', alignItems:'center', gap:13, marginBottom:13}}>
              <div style={{width:30,height:30,border:'1px solid #d1d7db',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}><Minus size={13} style={{color:WA.cardInk2}}/></div>
              <span style={{fontSize:14, fontWeight:700, color:WA.cardInk}}>2</span>
              <div style={{width:30,height:30,border:`1px solid ${WA.verdeBtn}`,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}><Plus size={13} style={{color:WA.verdeBtn}}/></div>
            </div>

            <button style={{width:'100%', background:WA.verdeBtn, border:'none', color:'#fff', borderRadius:9, padding:'10px', fontSize:12.5, fontWeight:700}}>{cfg?.texto_botao_add || 'Adicionar e continuar'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TELA 3: Carrinho ──────────────────────────────────────────────────────────
function TelaCarrinho({ cfg, pix }) {
  const itens = [
    { nome:'Cristal Laranjão Leitoso 6mm', qt:2, preco:30.00 },
    { nome:'Cristal Laranjão Transp. 6mm', qt:1, preco:15.00 },
  ]
  const total = itens.reduce((s,i)=>s+i.preco,0)
  return (
    <div>
      <FlowHeader titulo="Seu carrinho" fechar={false}/>
      <div style={{background:WA.fundo, minHeight:300, maxHeight:380, overflowY:'auto', padding:'12px 10px', display:'flex', flexDirection:'column'}}>
        {itens.map((it,i)=>(
          <div key={i} style={{background:WA.card, borderRadius:10, padding:'9px 11px', marginBottom:7, display:'flex', gap:9, alignItems:'center'}}>
            <div style={{width:38,height:38,borderRadius:7,background:'#f0e6d8',flexShrink:0}}/>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:11.5, fontWeight:600, color:WA.cardInk, lineHeight:1.3}}>{it.nome}</div>
              <div style={{fontSize:10.5, color:WA.cardInk3}}>{it.qt} un · R$ {it.preco.toFixed(2).replace('.',',')}</div>
            </div>
          </div>
        ))}

        <div style={{background:WA.header, borderRadius:10, padding:'10px 12px', marginTop:3}}>
          <div style={{display:'flex', justifyContent:'space-between', color:'#e9edef', fontSize:12.5}}><span>Total</span><span style={{fontWeight:700}}>R$ {total.toFixed(2).replace('.',',')}</span></div>
          {cfg?.mostrar_pix && <div style={{display:'flex', justifyContent:'space-between', color:'#9fd8c8', fontSize:10.5, marginTop:2}}><span>no PIX ({cfg.desconto_pix}% off)</span><span>R$ {pix(total).toFixed(2).replace('.',',')}</span></div>}
        </div>

        <div style={{flex:1}}/>
        <button style={{width:'100%', background:WA.verdeClaro, border:'none', color:'#063', borderRadius:9, padding:'11px', fontSize:12.5, fontWeight:700, marginTop:11}}>{cfg?.texto_botao_carrinho || 'Enviar carrinho'}</button>
      </div>
    </div>
  )
}
