'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Download, X } from 'lucide-react'
import { api, Demanda, DemandaInput, fmtR, fmtN } from './services/api'

type Tipo = 'lets' | 'vix'

const ST_MAP: Record<string, { bg: string; color: string }> = {
  'Em andamento':      { bg:'#E0F5F7', color:'#0097A8' },
  'Em tratativa':      { bg:'#E0F5F7', color:'#0097A8' },
  'Acordo realizado':  { bg:'#EAF7EE', color:'#27AE60' },
  'Débito quitado':    { bg:'#EAF7EE', color:'#27AE60' },
  'Arquivado':         { bg:'#EEF0F3', color:'#6B8090' },
  'Devolvido':         { bg:'#FEF5EB', color:'#E67E22' },
  'Pré-processual':    { bg:'#FEF5EB', color:'#E67E22' },
  'Pendente assinatura':{ bg:'#F4EEF9', color:'#8E44AD' },
  'Acordo em atraso':  { bg:'#FDECEA', color:'#E74C3C' },
  'Sem êxito':         { bg:'#FDECEA', color:'#C0392B' },
}
const EMP_MAP: Record<string, { bg: string; color: string }> = {
  'LETS':   { bg:'#FDECEA', color:'#E74C3C' },
  'SALUTE': { bg:'#FEF5EB', color:'#E67E22' },
  'EBEC':   { bg:'#EAF3FD', color:'#2980B9' },
}
const FATOS = ['Em tratativa','Culpa do locatário','Falta de documentação','Pré-processual','Acordo finalizado','Acordo em andamento','Tratativa c/ seguradora','Notif. extrajudicial','Arquivamento sugerido','Sem êxito']
const ST_LETS = ['Em andamento','Acordo realizado','Arquivado','Devolvido']
const ST_VIX  = ['Em tratativa','Débito quitado','Pré-processual','Pendente assinatura','Acordo em atraso','Arquivado','Sem êxito']

const s = {
  page:    { minHeight:'100vh', display:'flex', flexDirection:'column' as const, fontFamily:"'DM Sans',sans-serif", background:'#F2F6F8', color:'#1A2B38' },
  topbar:  { background:'#fff', borderBottom:'3px solid #0097A8', padding:'.7rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem', position:'sticky' as const, top:0, zIndex:40, boxShadow:'0 2px 10px rgba(0,151,168,.1)' },
  logo:    { height:70, objectFit:'contain' as const, maxWidth:240 },
  nav:     { display:'flex', gap:4, flex:1 },
  main:    { flex:1, padding:'1.25rem 1.5rem' },
  row:     { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' },
  h1:      { fontSize:20, fontWeight:600, color:'#1A2B38' },
  p:       { fontSize:12, color:'#7A919E', marginTop:2 },
  btnTeal: { display:'flex', alignItems:'center', gap:8, background:'#0097A8', color:'#fff', border:'none', padding:'.5rem 1rem', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' },
  btnOut:  { display:'flex', alignItems:'center', gap:6, background:'transparent', color:'#1A2B38', border:'1.5px solid #DDE5EA', padding:'.4rem .8rem', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' },
  btnRed:  { background:'#E74C3C', color:'#fff', border:'none', padding:'.5rem 1rem', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' },
  feat:    { background:'#0097A8', borderRadius:12, padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'1.5rem', marginBottom:'1.25rem', boxShadow:'0 4px 16px rgba(0,151,168,.22)', position:'relative' as const, overflow:'hidden' },
  g4:      { display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10, marginBottom:8 },
  g6:      { display:'grid', gridTemplateColumns:'repeat(6,minmax(0,1fr))', gap:10, marginBottom:'1.25rem' },
  kpi:     { background:'#fff', border:'1px solid #DDE5EA', borderRadius:10, padding:'1rem', position:'relative' as const, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.04)' },
  card:    { background:'#fff', border:'1px solid #DDE5EA', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.04)', marginBottom:'1.25rem' },
  toolbar: { display:'flex', alignItems:'center', gap:8, padding:'.8rem 1.1rem', borderBottom:'1px solid #DDE5EA', background:'#FAFCFD', flexWrap:'wrap' as const },
  badge:   { display:'inline-flex', alignItems:'center', padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:600, whiteSpace:'nowrap' as const },
  inp:     { border:'1.5px solid #DDE5EA', borderRadius:7, padding:'5px 10px', fontSize:12, fontFamily:'inherit', outline:'none', background:'#fff', color:'#1A2B38' },
  footer:  { background:'#fff', borderTop:'1px solid #DDE5EA', padding:'.65rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' },
  overlay: { position:'fixed' as const, inset:0, background:'rgba(0,0,0,.4)', zIndex:50, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:56 },
  modal:   { background:'#fff', borderRadius:14, width:640, maxWidth:'95vw', maxHeight:'88vh', overflowY:'auto' as const, boxShadow:'0 20px 60px rgba(0,0,0,.2)' },
  mhdr:    { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.5rem', borderBottom:'1px solid #DDE5EA', position:'sticky' as const, top:0, background:'#fff', zIndex:1 },
  mfoot:   { display:'flex', gap:8, justifyContent:'flex-end', padding:'1rem 1.5rem', borderTop:'1px solid #DDE5EA', background:'#FAFCFD', position:'sticky' as const, bottom:0 },
  fg:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 14px', padding:'1.25rem 1.5rem' },
  fi:      { width:'100%', border:'1.5px solid #DDE5EA', borderRadius:8, padding:'7px 10px', fontSize:13, fontFamily:'inherit', color:'#1A2B38', outline:'none', boxSizing:'border-box' as const },
  lb:      { display:'block', fontSize:10, fontWeight:600, color:'#7A919E', textTransform:'uppercase' as const, letterSpacing:'.05em', marginBottom:4 },
}

function KPI({ l, v, sv, c }: { l:string; v:string|number; sv?:string; c:string }) {
  return (
    <div style={s.kpi}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, borderRadius:'10px 10px 0 0', background:c }}/>
      <p style={{ fontSize:10, fontWeight:600, color:'#7A919E', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{l}</p>
      <p style={{ fontSize:22, fontWeight:700, color:'#1A2B38', lineHeight:1.1 }}>{v}</p>
      {sv && <p style={{ fontSize:11, color:'#7A919E', marginTop:4 }}>{sv}</p>}
    </div>
  )
}

function Badge({ label, bg, color }: { label:string; bg:string; color:string }) {
  return <span style={{ ...s.badge, background:bg, color }}>{label}</span>
}

function FormField({ lb: label, children }: { lb:string; children:React.ReactNode }) {
  return <div><label style={s.lb}>{label}</label>{children}</div>
}

export default function Home() {
  const [tipo, setTipo] = useState<Tipo>('lets')
  const [data, setData] = useState<Demanda[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fEmp, setFEmp] = useState('')
  const [fSt, setFSt] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Demanda | null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [user, setUser] = useState('')
  const [toast, setToast] = useState<{ msg:string; ok:boolean } | null>(null)
  const [conn, setConn] = useState<boolean | null>(null)

  const showToast = (msg:string, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000) }

  const load = useCallback(async () => {
    setLoading(true)
    try { const d = await api.listar(tipo); setData(d); setConn(true) }
    catch { setConn(false); showToast('Erro ao carregar',false) }
    finally { setLoading(false) }
  }, [tipo])

  useEffect(()=>{load()},[load])
  useEffect(()=>{const t=setInterval(()=>load(),30000);return()=>clearInterval(t)},[load])

  const blank = () => ({ tipo, placa:'', cliente:'', terceiro:'', contato:'', empresa:'LETS', data_sinistro:'', danos:0, limite:0, devedor:'', telefone:'', saldo:0, status:tipo==='lets'?'Em andamento':'Em tratativa', fato_gerador:'Em tratativa', andamento:'', atualizado_por:user })

  const openNew = () => { setForm(blank()); setEditing(null); setModal(true) }
  const openEdit = async (id:number) => {
    try { const d = await api.buscar(id); setForm({...d,atualizado_por:user}); setEditing(d); setModal(true) }
    catch { showToast('Erro ao carregar',false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) await api.atualizar(editing.id, {...form,atualizado_por:user||'Usuário'})
      else await api.criar({...form,atualizado_por:user||'Usuário'})
      setModal(false); showToast(editing?'Atualizada!':'Criada!'); load()
    } catch { showToast('Erro ao salvar',false) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirmId) return
    try { await api.deletar(confirmId); setConfirmId(null); showToast('Excluída'); load() }
    catch { showToast('Erro ao excluir',false) }
  }

  const set = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}))

  const filtered = data.filter(r => {
    if (fEmp && r.empresa!==fEmp) return false
    if (fSt && r.status!==fSt) return false
    if (search) { const q=search.toLowerCase(); if(![r.placa,r.cliente,r.terceiro,r.devedor,r.telefone,r.andamento].some(f=>f?.toLowerCase().includes(q))) return false }
    return true
  })

  const tot=data.length
  const totVal=tipo==='lets'?data.reduce((s,r)=>s+(r.danos||0),0):data.reduce((s,r)=>s+(r.saldo||0),0)
  const ea=data.filter(r=>r.status==='Em andamento'||r.status==='Em tratativa').length
  const acFin=data.filter(r=>r.status==='Acordo realizado'||r.status==='Débito quitado').length
  const acAnd=data.filter(r=>/acordo.*parcela/i.test(r.andamento||'')).length
  const culpa=data.filter(r=>/culpa do locat/i.test(r.andamento||'')).length
  const semEx=data.filter(r=>/sem êxito/i.test(r.andamento||'')).length
  const preProc=data.filter(r=>/pré processual/i.test(r.andamento||'')).length
  const notif=data.filter(r=>/notificação extrajudicial/i.test(r.andamento||'')).length
  const segur=data.filter(r=>/seguradora/i.test(r.andamento||'')).length
  const arq=data.filter(r=>/arquivamento/i.test(r.andamento||'')).length
  const empC={LETS:data.filter(r=>r.empresa==='LETS').length,SALUTE:data.filter(r=>r.empresa==='SALUTE').length,EBEC:data.filter(r=>r.empresa==='EBEC').length}

  const exportCSV = () => {
    const keys=['placa','cliente','terceiro','contato','empresa','data_sinistro','danos','limite','devedor','telefone','saldo','status','fato_gerador','andamento','atualizado_por']
    const rows=[keys.join(';'),...filtered.map(r=>keys.map(k=>`"${(r as any)[k]??''}"`).join(';'))]
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));a.download=`roesel_${tipo}_${new Date().toISOString().slice(0,10)}.csv`;a.click()
  }

  return (
    <div style={s.page}>
      <header style={s.topbar}>
        <img src="/logo.jpg" alt="Roesel" style={s.logo} onError={e=>(e.currentTarget.style.display='none')}/>
        <nav style={s.nav}>
          {(['lets','vix'] as Tipo[]).map(t=>(
            <button key={t} onClick={()=>{setTipo(t);setSearch('');setFEmp('');setFSt('')}}
              style={{padding:'.45rem 1.1rem',borderRadius:7,border:'none',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit',background:tipo===t?'#0097A8':'transparent',color:tipo===t?'#fff':'#7A919E'}}>
              {t==='lets'?"Let's":'Vix - 1'}
            </button>
          ))}
        </nav>
        <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'#7A919E'}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:conn===true?'#27AE60':conn===false?'#E74C3C':'#ccc'}}/>
          <span>{conn===true?'conectado':conn===false?'erro':'conectando...'}</span>
          <span style={{margin:'0 4px'}}>|</span>
          <span>👤</span>
          <input style={{...s.inp,width:130}} placeholder="Seu nome..." value={user} onChange={e=>setUser(e.target.value)}/>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.row}>
          <div>
            <h1 style={s.h1}>{tipo==='lets'?"Let's — Demandas em Andamento":'Vix - 1 — Demandas em Andamento'}</h1>
            <p style={s.p}>{tipo==='lets'?'Processos junto a terceiros · LETS · SALUTE · EBEC':'Devedores locatários · Carteira de cobrança VIX'}</p>
          </div>
          <button onClick={openNew} style={s.btnTeal}><Plus size={16}/> Nova demanda</button>
        </div>

        <div style={s.feat}>
          <div style={{position:'absolute',right:-40,top:-40,width:192,height:192,borderRadius:'50%',background:'rgba(255,255,255,.1)'}}/>
          <div style={{fontSize:28,flexShrink:0}}>🤝</div>
          <div style={{flexShrink:0}}>
            <p style={{fontSize:10,color:'rgba(255,255,255,.7)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:3}}>Acordos fechados</p>
            <p style={{fontSize:36,fontWeight:700,color:'#fff',lineHeight:1}}>{acFin+acAnd}</p>
            <p style={{fontSize:11,color:'rgba(255,255,255,.6)',marginTop:4}}>encerrados ou em execução</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,flex:1}}>
            {[{l:'Acordo finalizado',v:acFin,sv:'quitado'},{l:'Acordo em andamento',v:acAnd,sv:'parcelas'},{l:'Valor em tratativa',v:fmtR(totVal),sv:tipo==='lets'?'danos':'saldos'},{l:'Pré-processuais',v:preProc,sv:'em curso'}].map(({l,v,sv})=>(
              <div key={l} style={{background:'rgba(255,255,255,.15)',borderRadius:8,padding:'.65rem .9rem'}}>
                <p style={{fontSize:10,color:'rgba(255,255,255,.6)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>{l}</p>
                <p style={{fontSize:18,fontWeight:700,color:'#fff'}}>{v}</p>
                <p style={{fontSize:10,color:'rgba(255,255,255,.5)',marginTop:1}}>{sv}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={s.g4}>
          <KPI l="Total de demandas" v={tot} sv={tipo==='lets'?`LETS ${empC.LETS} · SAL ${empC.SALUTE} · EBC ${empC.EBEC}`:`${tot} devedores`} c="#0097A8"/>
          <KPI l="Valor total em tratativa" v={fmtR(totVal)} sv="soma dos valores" c="#E67E22"/>
          <KPI l={tipo==='lets'?'Em andamento':'Em tratativa'} v={ea} sv={`${Math.round(ea/Math.max(1,tot)*100)}% do total`} c="#2980B9"/>
          <KPI l={tipo==='lets'?'Encerradas':'Débitos quitados'} v={tipo==='lets'?tot-ea:data.filter(r=>r.status==='Débito quitado').length} sv={tipo==='lets'?'arq. + acordo':'confirmados'} c="#27AE60"/>
        </div>
        <div style={s.g6}>
          <KPI l="Culpa do locatário" v={culpa} c="#E74C3C"/>
          <KPI l="Sem êxito" v={semEx} c="#E67E22"/>
          <KPI l="Pré-processual" v={preProc} c="#8E44AD"/>
          <KPI l="Notif. extrajudicial" v={notif} c="#0097A8"/>
          <KPI l={tipo==='lets'?'Com seguradora':'Acordo andamento'} v={tipo==='lets'?segur:acAnd} c="#2980B9"/>
          <KPI l="Arquivamento sugerido" v={arq} c="#27AE60"/>
        </div>

        <div style={s.card}>
          <div style={s.toolbar}>
            <span style={{fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase',letterSpacing:'.1em',flex:1}}>Todas as demandas</span>
            <div style={{position:'relative'}}>
              <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#7A919E'}}/>
              <input style={{...s.inp,paddingLeft:30,width:176}} placeholder={tipo==='lets'?'Placa, cliente...':'Buscar devedor...'} value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            {tipo==='lets'&&<select style={s.inp} value={fEmp} onChange={e=>setFEmp(e.target.value)}><option value="">Todas empresas</option><option>LETS</option><option>SALUTE</option><option>EBEC</option></select>}
            <select style={s.inp} value={fSt} onChange={e=>setFSt(e.target.value)}>
              <option value="">Todos status</option>
              {(tipo==='lets'?ST_LETS:ST_VIX).map(x=><option key={x}>{x}</option>)}
            </select>
            <button onClick={exportCSV} style={s.btnOut}><Download size={13}/> CSV</button>
          </div>
          <div style={{overflowX:'auto',maxHeight:420,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead style={{position:'sticky',top:0,zIndex:2}}>
                <tr style={{background:'#FAFCFD',borderBottom:'2px solid #DDE5EA'}}>
                  {tipo==='lets'?<>
                    <th style={{padding:'8px 11px',textAlign:'left',fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase',whiteSpace:'nowrap'}}>Placa</th>
                    <th style={{padding:'8px 11px',textAlign:'left',fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase'}}>Cliente</th>
                    <th style={{padding:'8px 11px',textAlign:'left',fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase'}}>Terceiro</th>
                    <th style={{padding:'8px 11px',textAlign:'left',fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase'}}>Empresa</th>
                    <th style={{padding:'8px 11px',textAlign:'right',fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase'}}>Danos</th>
                    <th style={{padding:'8px 11px',textAlign:'right',fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase'}}>Limite</th>
                  </>:<>
                    <th style={{padding:'8px 11px',textAlign:'left',fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase'}}>Devedor</th>
                    <th style={{padding:'8px 11px',textAlign:'left',fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase'}}>Telefone</th>
                    <th style={{padding:'8px 11px',textAlign:'right',fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase'}}>Saldo</th>
                  </>}
                  <th style={{padding:'8px 11px',textAlign:'left',fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase'}}>Status</th>
                  <th style={{padding:'8px 11px',textAlign:'left',fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase'}}>Fato gerador</th>
                  <th style={{padding:'8px 11px',textAlign:'left',fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase'}}>Por</th>
                  <th style={{padding:'8px 11px',textAlign:'left',fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase'}}>Andamento</th>
                  <th style={{padding:'8px 11px',textAlign:'left',fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase'}}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading?<tr><td colSpan={10} style={{textAlign:'center',padding:'3rem',color:'#7A919E'}}>Carregando...</td></tr>
                :filtered.length===0?<tr><td colSpan={10} style={{textAlign:'center',padding:'3rem',color:'#7A919E'}}>Nenhuma demanda encontrada</td></tr>
                :filtered.map(r=>{
                  const stStyle=ST_MAP[r.status||'']||{bg:'#E0F5F7',color:'#0097A8'}
                  const empStyle=EMP_MAP[r.empresa||'']||{bg:'#EEF0F3',color:'#6B8090'}
                  return <tr key={r.id} style={{borderBottom:'1px solid #DDE5EA'}} onMouseEnter={e=>(e.currentTarget.style.background='#F0F7F9')} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                    {tipo==='lets'?<>
                      <td style={{padding:'7px 11px',fontFamily:'monospace',fontSize:10,color:'#7A919E'}}>{r.placa||'—'}</td>
                      <td style={{padding:'7px 11px',maxWidth:130,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{r.cliente||'—'}</td>
                      <td style={{padding:'7px 11px',maxWidth:110,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',color:'#7A919E'}}>{r.terceiro||'—'}</td>
                      <td style={{padding:'7px 11px'}}>{r.empresa?<Badge label={r.empresa} bg={empStyle.bg} color={empStyle.color}/>:'—'}</td>
                      <td style={{padding:'7px 11px',textAlign:'right',fontWeight:600}}>{fmtN(r.danos)}</td>
                      <td style={{padding:'7px 11px',textAlign:'right',color:'#7A919E'}}>{fmtN(r.limite)}</td>
                    </>:<>
                      <td style={{padding:'7px 11px',maxWidth:170,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{r.devedor||'—'}</td>
                      <td style={{padding:'7px 11px',fontFamily:'monospace',fontSize:10,color:'#7A919E'}}>{r.telefone||'—'}</td>
                      <td style={{padding:'7px 11px',textAlign:'right',fontWeight:600}}>{fmtN(r.saldo)}</td>
                    </>}
                    <td style={{padding:'7px 11px'}}><Badge label={r.status||'—'} bg={stStyle.bg} color={stStyle.color}/></td>
                    <td style={{padding:'7px 11px'}}><Badge label={r.fato_gerador||'Em tratativa'} bg="#E0F5F7" color="#0097A8"/></td>
                    <td style={{padding:'7px 11px',color:'#7A919E',fontSize:11}}>{r.atualizado_por||'—'}</td>
                    <td style={{padding:'7px 11px',maxWidth:180,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',color:'#7A919E',fontSize:11}} title={r.andamento||''}>{r.andamento||'—'}</td>
                    <td style={{padding:'7px 11px',whiteSpace:'nowrap'}}>
                      <button onClick={()=>openEdit(r.id)} style={{padding:'4px 7px',borderRadius:6,border:'1px solid #DDE5EA',background:'transparent',cursor:'pointer',color:'#7A919E',marginRight:4}}><Pencil size={13}/></button>
                      <button onClick={()=>setConfirmId(r.id)} style={{padding:'4px 7px',borderRadius:6,border:'1px solid #FDECEA',background:'transparent',cursor:'pointer',color:'#E74C3C'}}><Trash2 size={13}/></button>
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
          <div style={{padding:'.5rem 1.1rem',borderTop:'1px solid #DDE5EA',fontSize:11,color:'#7A919E',background:'#FAFCFD'}}>
            {filtered.length} demanda{filtered.length!==1?'s':''} exibida{filtered.length!==1?'s':''} de {tot} total
          </div>
        </div>
      </main>

      <footer style={s.footer}>
        <img src="/logo.jpg" alt="Roesel" style={{...s.logo,height:28}} onError={e=>(e.currentTarget.style.display='none')}/>
        <p style={{fontSize:11,color:'#7A919E'}}>Roesel Advogados Associados — Sistema de Gestão de Demandas</p>
        <p style={{fontSize:11,color:'#7A919E'}}>© 2025</p>
      </footer>

      {modal&&(
        <div style={s.overlay} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={s.modal}>
            <div style={s.mhdr}>
              <h3 style={{fontSize:15,fontWeight:700}}>{editing?'Editar':'Nova'} demanda — {tipo==='lets'?"Let's":'Vix - 1'}</h3>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#7A919E'}}><X size={20}/></button>
            </div>
            {tipo==='lets'?(
              <div style={s.fg}>
                <FormField lb="Placa"><input style={s.fi} value={form.placa||''} onChange={e=>set('placa',e.target.value)}/></FormField>
                <FormField lb="Empresa"><select style={s.fi} value={form.empresa||'LETS'} onChange={e=>set('empresa',e.target.value)}><option>LETS</option><option>SALUTE</option><option>EBEC</option></select></FormField>
                <FormField lb="Cliente"><input style={s.fi} value={form.cliente||''} onChange={e=>set('cliente',e.target.value)}/></FormField>
                <FormField lb="Data sinistro"><input style={s.fi} value={form.data_sinistro||''} onChange={e=>set('data_sinistro',e.target.value)}/></FormField>
                <FormField lb="Terceiro"><input style={s.fi} value={form.terceiro||''} onChange={e=>set('terceiro',e.target.value)}/></FormField>
                <FormField lb="Contato"><input style={s.fi} value={form.contato||''} onChange={e=>set('contato',e.target.value)}/></FormField>
                <FormField lb="Danos (R$)"><input type="number" step="0.01" style={s.fi} value={form.danos||0} onChange={e=>set('danos',parseFloat(e.target.value)||0)}/></FormField>
                <FormField lb="Limite (R$)"><input type="number" step="0.01" style={s.fi} value={form.limite||0} onChange={e=>set('limite',parseFloat(e.target.value)||0)}/></FormField>
                <FormField lb="Status"><select style={s.fi} value={form.status||''} onChange={e=>set('status',e.target.value)}>{ST_LETS.map(x=><option key={x}>{x}</option>)}</select></FormField>
                <FormField lb="Fato gerador"><select style={s.fi} value={form.fato_gerador||''} onChange={e=>set('fato_gerador',e.target.value)}>{FATOS.map(x=><option key={x}>{x}</option>)}</select></FormField>
                <div style={{gridColumn:'1/-1'}}><FormField lb="Andamento"><textarea style={{...s.fi,resize:'vertical',minHeight:90}} value={form.andamento||''} onChange={e=>set('andamento',e.target.value)}/></FormField></div>
              </div>
            ):(
              <div style={s.fg}>
                <FormField lb="Devedor"><input style={s.fi} value={form.devedor||''} onChange={e=>set('devedor',e.target.value)}/></FormField>
                <FormField lb="Telefone"><input style={s.fi} value={form.telefone||''} onChange={e=>set('telefone',e.target.value)}/></FormField>
                <FormField lb="Saldo (R$)"><input type="number" step="0.01" style={s.fi} value={form.saldo||0} onChange={e=>set('saldo',parseFloat(e.target.value)||0)}/></FormField>
                <FormField lb="Status"><select style={s.fi} value={form.status||''} onChange={e=>set('status',e.target.value)}>{ST_VIX.map(x=><option key={x}>{x}</option>)}</select></FormField>
                <div style={{gridColumn:'1/-1'}}><FormField lb="Fato gerador"><select style={s.fi} value={form.fato_gerador||''} onChange={e=>set('fato_gerador',e.target.value)}>{FATOS.map(x=><option key={x}>{x}</option>)}</select></FormField></div>
                <div style={{gridColumn:'1/-1'}}><FormField lb="Andamento"><textarea style={{...s.fi,resize:'vertical',minHeight:90}} value={form.andamento||''} onChange={e=>set('andamento',e.target.value)}/></FormField></div>
              </div>
            )}
            <div style={s.mfoot}>
              <button onClick={()=>setModal(false)} style={{...s.btnOut,padding:'.5rem 1rem',fontSize:13}}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{...s.btnTeal,opacity:saving?0.6:1}}>{saving?'Salvando...':'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {confirmId&&(
        <div style={{...s.overlay,alignItems:'center',paddingTop:0}}>
          <div style={{background:'#fff',borderRadius:14,width:360,padding:'1.5rem',boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:8}}>Confirmar exclusão</h3>
            <p style={{fontSize:13,color:'#7A919E',marginBottom:20}}>Tem certeza? Esta ação não pode ser desfeita.</p>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setConfirmId(null)} style={{...s.btnOut,padding:'.5rem 1rem',fontSize:13}}>Cancelar</button>
              <button onClick={handleDelete} style={s.btnRed}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {toast&&(
        <div style={{position:'fixed',bottom:20,right:20,padding:'.75rem 1.25rem',borderRadius:10,fontSize:13,fontWeight:500,color:'#fff',background:toast.ok?'#27AE60':'#E74C3C',boxShadow:'0 4px 16px rgba(0,0,0,.2)',zIndex:100}}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}