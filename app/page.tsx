'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Search, Trash2, Download, X, Upload } from 'lucide-react'
import { api, Demanda, Parcela, fmtR, fmtN } from './services/api'
import * as XLSX from 'xlsx'

type Tipo = 'lets' | 'letspf' | 'vix' | 'cobr' | 'avarias'

const USUARIOS: Record<string, string> = {
  'claudiane': 'fifi15',
  'fabiana':   '1803',
  'vix':       'Vix2026',
}
const NOMES: Record<string, string> = {
  'claudiane': 'Claudiane',
  'fabiana':   'Fabiana',
  'vix':       'Vix',
}

const ST_MAP: Record<string, { bg: string; color: string }> = {
  'Em andamento':             { bg:'#E0F5F7', color:'#0097A8' },
  'Em tratativa':             { bg:'#E0F5F7', color:'#0097A8' },
  'Acordo fechado':           { bg:'#EAF7EE', color:'#27AE60' },
  'Débito quitado':           { bg:'#EAF7EE', color:'#27AE60' },
  'Arquivado':                { bg:'#EEF0F3', color:'#6B8090' },
  'Acordo liquidado':         { bg:'#EAF7EE', color:'#27AE60' },
  'Devolvido':                { bg:'#FEF5EB', color:'#E67E22' },
  'Pré-processual':           { bg:'#FEF5EB', color:'#E67E22' },
  'Pendente assinatura':      { bg:'#F4EEF9', color:'#8E44AD' },
  'Acordo em atraso':         { bg:'#FDECEA', color:'#E74C3C' },
  'Sem êxito':                { bg:'#FDECEA', color:'#C0392B' },
  'Baixado':                  { bg:'#EEF0F3', color:'#6B8090' },
  'Descumprimento de acordo': { bg:'#FDECEA', color:'#E74C3C' },
}
const EMP_MAP: Record<string, { bg: string; color: string }> = {
  'LETS':   { bg:'#FDECEA', color:'#E74C3C' },
  'SALUTE': { bg:'#FEF5EB', color:'#E67E22' },
  'EBEC':   { bg:'#EAF3FD', color:'#2980B9' },
}
const FATOS = ['Em tratativa','Culpa do locatário','Falta de documentação','Pré-processual','Acordo finalizado','Acordo em andamento','Tratativa c/ seguradora','Notif. extrajudicial','Arquivamento sugerido','Sem êxito']
const ST_LETS = ['Em andamento','Acordo fechado','Arquivado','Devolvido','Baixado','Descumprimento de acordo']
const ST_VIX  = ['Em tratativa','Débito quitado','Pré-processual','Pendente assinatura','Acordo em atraso','Arquivado','Sem êxito']
const ST_COBR = ['Em tratativa','Acordo fechado','Acordo liquidado','Arquivado','Sem êxito']

const TABS: { id: Tipo; label: string }[] = [
  { id: 'lets',    label: "Let's" },
  { id: 'letspf',  label: "Let's PF" },
  { id: 'vix',     label: 'Vix - 1' },
  { id: 'cobr',    label: 'Vix - Cobrança' },
  { id: 'avarias', label: 'Vix - Avarias' },
]

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
  modal:   { background:'#fff', borderRadius:14, width:680, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' as const, boxShadow:'0 20px 60px rgba(0,0,0,.2)' },
  mhdr:    { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.5rem', borderBottom:'1px solid #DDE5EA', position:'sticky' as const, top:0, background:'#fff', zIndex:1 },
  mfoot:   { display:'flex', gap:8, justifyContent:'flex-end', padding:'1rem 1.5rem', borderTop:'1px solid #DDE5EA', background:'#FAFCFD', position:'sticky' as const, bottom:0 },
  fg:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 14px', padding:'1.25rem 1.5rem' },
  fi:      { width:'100%', border:'1.5px solid #DDE5EA', borderRadius:8, padding:'7px 10px', fontSize:13, fontFamily:'inherit', color:'#1A2B38', outline:'none', boxSizing:'border-box' as const },
  lb:      { display:'block', fontSize:10, fontWeight:600, color:'#7A919E', textTransform:'uppercase' as const, letterSpacing:'.05em', marginBottom:4 },
}

function maskDate(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0,2)}/${digits.slice(2)}`
  return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`
}

function toNum(v: any): number {
  return parseFloat(String(v||'0').replace(',','.')) || 0
}

function str(v: any): string {
  return v == null ? '' : String(v).trim()
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

function ParcelasEditor({ parcelas, onChange }: { parcelas: Parcela[]; onChange: (p: Parcela[]) => void }) {
  const [rawVals, setRawVals] = useState<string[]>(() => parcelas.map(p => String(p.valor||'')))

  const addParcela = () => {
    const nova: Parcela = { numero: parcelas.length + 1, valor: 0, vencimento: '', pago: false, data_pagamento: '' }
    setRawVals(prev => [...prev, ''])
    onChange([...parcelas, nova])
  }

  const removeParcela = (i: number) => {
    setRawVals(prev => prev.filter((_, idx) => idx !== i))
    onChange(parcelas.filter((_, idx) => idx !== i))
  }

  const updateParcela = (i: number, key: keyof Parcela, val: any) => {
    const updated = parcelas.map((p, idx) => {
      if (idx !== i) return p
      const novo = { ...p, [key]: val }
      if (key === 'pago' && val && !novo.data_pagamento) {
        novo.data_pagamento = new Date().toLocaleDateString('pt-BR')
      }
      return novo
    })
    onChange(updated)
  }

  const commitValor = (i: number, raw: string) => {
    const num = toNum(raw)
    setRawVals(prev => { const n=[...prev]; n[i]=String(num); return n })
    updateParcela(i, 'valor', num)
  }

  return (
    <div style={{ gridColumn:'1/-1', border:'1.5px solid #DDE5EA', borderRadius:8, overflow:'hidden' }}>
      <div style={{ background:'#FAFCFD', padding:'8px 12px', borderBottom:'1px solid #DDE5EA', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:10, fontWeight:700, color:'#7A919E', textTransform:'uppercase', letterSpacing:'.05em' }}>Parcelas do acordo ({parcelas.length})</span>
        <button onClick={addParcela} type="button" style={{ ...s.btnTeal, padding:'3px 10px', fontSize:11 }}>+ Parcela</button>
      </div>
      {parcelas.length === 0 && <p style={{ padding:'12px', fontSize:12, color:'#7A919E', margin:0 }}>Nenhuma parcela. Clique em + Parcela para adicionar.</p>}
      {parcelas.map((p, i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:'40px 1fr 1fr 80px 1fr 24px', gap:8, padding:'8px 12px', borderBottom:'1px solid #DDE5EA', alignItems:'center', background: p.pago ? '#F0FFF4' : p.dias_atraso && p.dias_atraso > 0 ? '#FFF5F5' : '#fff' }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#7A919E' }}>#{p.numero}</span>
          <div>
            <label style={{ ...s.lb, marginBottom:2 }}>Valor</label>
            <input type="text" inputMode="decimal" style={{ ...s.fi, fontSize:12 }}
              value={rawVals[i]??''} placeholder="0,00"
              onChange={e => { const n=[...rawVals]; n[i]=e.target.value; setRawVals(n) }}
              onBlur={e => commitValor(i, e.target.value)}
            />
          </div>
          <div>
            <label style={{ ...s.lb, marginBottom:2 }}>Vencimento</label>
            <input style={{ ...s.fi, fontSize:12 }} placeholder="dd/mm/aaaa"
              value={p.vencimento||''}
              onChange={e=>updateParcela(i,'vencimento', maskDate(e.target.value))}
            />
          </div>
          <div style={{ textAlign:'center' }}>
            <label style={{ ...s.lb, marginBottom:2 }}>Pago?</label>
            <input type="checkbox" checked={p.pago||false} onChange={e=>updateParcela(i,'pago',e.target.checked)} style={{ width:16, height:16, cursor:'pointer' }}/>
          </div>
          <div>
            <label style={{ ...s.lb, marginBottom:2 }}>
              {p.pago ? 'Pago em' : p.dias_atraso && p.dias_atraso > 0 ? `⚠️ ${p.dias_atraso}d atraso` : 'Situação'}
            </label>
            {p.pago
              ? <input style={{ ...s.fi, fontSize:12, background:'#F0FFF4' }} value={p.data_pagamento||''} readOnly/>
              : <span style={{ fontSize:12, color: p.dias_atraso && p.dias_atraso > 0 ? '#E74C3C' : '#27AE60', fontWeight:600 }}>
                  {p.dias_atraso && p.dias_atraso > 0 ? 'Em atraso' : 'Em dia'}
                </span>
            }
          </div>
          <button onClick={()=>removeParcela(i)} type="button" style={{ background:'none', border:'none', cursor:'pointer', color:'#E74C3C', fontSize:16, padding:0 }}>×</button>
        </div>
      ))}
    </div>
  )
}

function LoginScreen({ onLogin }: { onLogin:(nome:string)=>void }) {
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const handleLogin = () => {
    const key = login.trim().toLowerCase()
    if (USUARIOS[key] && USUARIOS[key] === senha) {
      onLogin(NOMES[key])
    } else {
      setErro('Usuário ou senha incorretos.')
      setTimeout(() => setErro(''), 3000)
    }
  }
  return (
    <div style={{ minHeight:'100vh', background:'#F2F6F8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'2.5rem 2rem', width:360, boxShadow:'0 8px 40px rgba(0,151,168,.15)', display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
        <img src="/logo.jpg" alt="Roesel" style={{ height:140, objectFit:'contain', maxWidth:320, marginBottom:8 }} onError={e=>(e.currentTarget.style.display='none')}/>
        <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={s.lb}>Usuário</label>
            <input style={{ ...s.fi, fontSize:14 }} placeholder="Digite seu usuário" value={login}
              onChange={e=>setLogin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()}/>
          </div>
          <div>
            <label style={s.lb}>Senha</label>
            <input type="password" style={{ ...s.fi, fontSize:14 }} placeholder="Digite sua senha" value={senha}
              onChange={e=>setSenha(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()}/>
          </div>
          {erro && <p style={{ fontSize:12, color:'#E74C3C', textAlign:'center', margin:0 }}>{erro}</p>}
          <button onClick={handleLogin} style={{ ...s.btnTeal, justifyContent:'center', width:'100%', padding:'.75rem', fontSize:14, borderRadius:9, marginTop:4 }}>
            Entrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [logado, setLogado] = useState(false)
  const [tipo, setTipo] = useState<Tipo>('lets')
  const [data, setData] = useState<Demanda[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fEmp, setFEmp] = useState('')
  const [fSt, setFSt] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Demanda | null>(null)
  const [form, setForm] = useState<any>({})
  const [parcelas, setParcelas] = useState<Parcela[]>([])
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [user, setUser] = useState('')
  const [toast, setToast] = useState<{ msg:string; ok:boolean } | null>(null)
  const [conn, setConn] = useState<boolean | null>(null)
  const [uploadModal, setUploadModal] = useState(false)
  const [uploadTipo, setUploadTipo] = useState<Tipo>('lets')
  const [uploadRows, setUploadRows] = useState<any[]>([])
  const [uploadFileName, setUploadFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const showToast = (msg:string, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000) }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try { const d = await api.listar(tipo); setData(d); setConn(true) }
    catch { setConn(false); if (!silent) showToast('Erro ao carregar',false) }
    finally { if (!silent) setLoading(false) }
  }, [tipo])

  useEffect(()=>{ if(logado) load() },[load, logado])
  useEffect(()=>{ if(!logado) return; const t=setInterval(()=>load(true),30000);return()=>clearInterval(t) },[load, logado])

  if (!logado) return <LoginScreen onLogin={(nome)=>{ setUser(nome); setLogado(true) }}/>

  const stList = tipo === 'lets' || tipo === 'letspf' ? ST_LETS : tipo === 'vix' ? ST_VIX : ST_COBR

  const blank = () => ({
    tipo, placa:'', cliente:'', terceiro:'', contato:'', empresa: tipo === 'lets' || tipo === 'letspf' ? 'LETS' : '',
    data_sinistro:'', danos:0, limite:0, devedor:'', telefone:'', saldo:0,
    status: tipo === 'lets' || tipo === 'letspf' ? 'Em andamento' : 'Em tratativa',
    fato_gerador:'Em tratativa', andamento:'', atualizado_por:user,
    data_vencimento:'', valor_pago:0, data_pagamento:'', pago:false,
    data_envio:'', responsavel:'', cpf_cnpj:'', data_evento:'', email:'',
  })

  const openNew = () => { setForm(blank()); setParcelas([]); setEditing(null); setModal(true) }

  const openEdit = async (id:number) => {
    try {
      const d = await api.buscar(id)
      setForm({...d, atualizado_por:user})
      setParcelas(d.parcelas||[])
      setEditing(d)
      setModal(true)
    }
    catch { showToast('Erro ao carregar',false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        atualizado_por: user,
        danos: toNum(form.danos),
        saldo: toNum(form.saldo),
        parcelas: parcelas.map((p:any) => ({ ...p, valor: toNum(p.valor) }))
      }
      if (editing) await api.atualizar(editing.id, payload)
      else await api.criar(payload)
      setModal(false)
      showToast(editing?'Atualizada!':'Criada!')
      load()
    } catch(e:any) {
      showToast('Erro ao salvar: ' + (e?.message||''), false)
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirmId) return
    try { await api.deletar(confirmId); setConfirmId(null); showToast('Excluída'); load() }
    catch { showToast('Erro ao excluir',false) }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      if (!raw.length) return
      const firstRow = raw[0]
      const hasHeader = firstRow.some((v: any) => typeof v === 'string' && isNaN(Number(v)) && v.trim() !== '')
      const dataRows = hasHeader ? raw.slice(1) : raw
      const headers = hasHeader ? firstRow : null
      const mapped = dataRows.filter((r: any[]) => r.some(v => v !== '')).map((row: any[]) => {
        if (headers) {
          const obj: any = {}
          headers.forEach((h: string, i: number) => { obj[h] = row[i] })
          return obj
        }
        return {
          _pos: true,
          cliente: row[1], devedor: row[3], terceiro: row[3],
          telefone: row[4], email: row[5], contato: row[4],
          cpf_cnpj: row[2], danos: row[11], saldo: row[12],
          data_sinistro: row[14], andamento: row[16],
        }
      })
      setUploadRows(mapped)
    }
    reader.readAsBinaryString(file)
  }

  const handleUpload = async () => {
    if (!uploadRows.length) return
    setUploading(true)
    let ok = 0, err = 0
    for (const row of uploadRows) {
      try {
        const isPosMap = row._pos
        let data_sinistro = ''
        const dtRaw = isPosMap ? row.data_sinistro : (row['data_sinistro'] ?? row['Data Sinistro'] ?? row['Dt. Vencimento'] ?? '')
        if (dtRaw instanceof Date) data_sinistro = dtRaw.toLocaleDateString('pt-BR')
        else if (dtRaw) data_sinistro = str(dtRaw)
        const payload: any = {
          tipo: uploadTipo, atualizado_por: user, parcelas: [],
          placa: str(isPosMap ? '' : (row['placa'] ?? row['Placa'] ?? '')),
          cliente: str(isPosMap ? row.cliente : (row['cliente'] ?? row['Cliente'] ?? '')),
          terceiro: str(isPosMap ? row.terceiro : (row['terceiro'] ?? row['Terceiro'] ?? row['Devedor'] ?? '')),
          contato: str(isPosMap ? row.contato : (row['contato'] ?? row['Contato'] ?? '')),
          empresa: str(isPosMap ? '' : (row['empresa'] ?? row['Empresa'] ?? '')),
          email: str(isPosMap ? row.email : (row['email'] ?? row['Email'] ?? '')),
          cpf_cnpj: str(isPosMap ? row.cpf_cnpj : (row['cpf_cnpj'] ?? row['CPF/CNPJ'] ?? row['CNPJ/CPF'] ?? '')),
          data_sinistro,
          danos: toNum(isPosMap ? row.danos : (row['danos'] ?? row['Danos'] ?? row['Vl. Título'] ?? 0)),
          saldo: toNum(isPosMap ? row.saldo : (row['saldo'] ?? row['Saldo'] ?? 0)),
          devedor: str(isPosMap ? row.devedor : (row['devedor'] ?? row['Devedor'] ?? '')),
          telefone: str(isPosMap ? row.telefone : (row['telefone'] ?? row['Telefone'] ?? '')),
          status: str(isPosMap ? 'Em tratativa' : (row['status'] ?? row['Status'] ?? (uploadTipo === 'lets' || uploadTipo === 'letspf' ? 'Em andamento' : 'Em tratativa'))),
          fato_gerador: str(isPosMap ? 'Em tratativa' : (row['fato_gerador'] ?? row['Fato Gerador'] ?? 'Em tratativa')),
          andamento: str(isPosMap ? row.andamento : (row['andamento'] ?? row['Andamento'] ?? row['Observação'] ?? '')),
          responsavel: str(isPosMap ? '' : (row['responsavel'] ?? row['Responsável'] ?? '')),
          data_envio: str(isPosMap ? '' : (row['data_envio'] ?? row['Data Envio'] ?? '')),
          data_evento: str(isPosMap ? '' : (row['data_evento'] ?? row['Data Evento'] ?? '')),
          limite: 0, data_vencimento: '', valor_pago: 0, data_pagamento: '', pago: false,
        }
        await api.criar(payload)
        ok++
      } catch { err++ }
    }
    setUploading(false)
    setUploadModal(false)
    setUploadRows([])
    setUploadFileName('')
    if (fileRef.current) fileRef.current.value = ''
    showToast(`${ok} importadas${err > 0 ? `, ${err} erros` : ''}!`, err === 0)
    if (uploadTipo === tipo) load()
  }

  const set = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}))

  const filtered = data.filter(r => {
    if (fEmp && r.empresa!==fEmp) return false
    if (fSt && r.status!==fSt) return false
    if (search) { const q=search.toLowerCase(); if(![r.placa,r.cliente,r.terceiro,r.devedor,r.telefone,r.andamento,r.cpf_cnpj,r.email].some(f=>f?.toLowerCase().includes(q))) return false }
    return true
  })

  const hoje = new Date()
  const mesAtual = `${String(hoje.getMonth()+1).padStart(2,'0')}/${hoje.getFullYear()}`
  const tot=data.length
  const totVal=data.reduce((s,r)=>s+(tipo==='lets'||tipo==='letspf'?(r.danos||0):(r.saldo||0)),0)
  const totalPagoMes=data.reduce((s,r)=>{
    const somaParcMes=(r.parcelas||[]).filter(p=>p.pago&&p.data_pagamento?.slice(3)===mesAtual).reduce((a,p)=>a+(p.valor||0),0)
    const pagoDireto=r.pago&&r.data_pagamento?.slice(3)===mesAtual?(r.valor_pago||0):0
    return s+somaParcMes+pagoDireto
  },0)
  const totalPago=data.reduce((s,r)=>{
    const somaParcelas=(r.parcelas||[]).filter(p=>p.pago).reduce((a,p)=>a+(p.valor||0),0)
    return s+(r.pago?(r.valor_pago||0):0)+somaParcelas
  },0)
  const ea=data.filter(r=>r.status==='Em andamento'||r.status==='Em tratativa').length
  const acFin=data.filter(r=>r.status==='Acordo fechado'||r.status==='Débito quitado'||r.status==='Acordo liquidado').length
  const acAnd=data.filter(r=>/acordo.*parcela/i.test(r.andamento||'')).length
  const culpa=data.filter(r=>/culpa do locat/i.test(r.andamento||'')).length
  const semEx=data.filter(r=>/sem êxito/i.test(r.andamento||'')).length
  const preProc=data.filter(r=>/pré processual/i.test(r.andamento||'')).length
  const notif=data.filter(r=>/notificação extrajudicial/i.test(r.andamento||'')).length
  const segur=data.filter(r=>/seguradora/i.test(r.andamento||'')).length
  const arq=data.filter(r=>/arquivamento/i.test(r.andamento||'')).length
  const empC={LETS:data.filter(r=>r.empresa==='LETS').length,SALUTE:data.filter(r=>r.empresa==='SALUTE').length,EBEC:data.filter(r=>r.empresa==='EBEC').length}

  const tabLabel = TABS.find(t=>t.id===tipo)?.label || ''
  const subTitle = () => {
    if (tipo==='lets') return 'Processos junto a terceiros · LETS · SALUTE · EBEC'
    if (tipo==='letspf') return "Pessoas físicas · Carteira de cobrança Let's PF"
    if (tipo==='vix') return 'Devedores locatários · Carteira de cobrança VIX'
    if (tipo==='cobr') return 'Cobrança V1 · Terceiros'
    return 'Avarias V1 · Sinistros por terceiros'
  }

  const exportCSV = () => {
    const keys=['placa','cliente','terceiro','contato','empresa','data_sinistro','danos','devedor','telefone','saldo','status','fato_gerador','andamento','atualizado_por','cpf_cnpj','email','responsavel','data_evento','data_envio']
    const rows=[keys.join(';'),...filtered.map(r=>keys.map(k=>`"${(r as any)[k]??''}"`).join(';'))]
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));a.download=`roesel_${tipo}_${new Date().toISOString().slice(0,10)}.csv`;a.click()
  }

  const showPlaca = tipo==='lets' || tipo==='avarias'
  const th = (label: string) => <th style={{padding:'8px 11px',textAlign:'left' as const,fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase' as const,whiteSpace:'nowrap' as const}}>{label}</th>

  const melhorAtraso = (r: Demanda) => {
    const parc = r.parcelas || []
    if (parc.length > 0) {
      const atrasadas = parc.filter(p => !p.pago && (p.dias_atraso||0) > 0)
      if (atrasadas.length > 0) return { dias: Math.max(...atrasadas.map(p=>p.dias_atraso||0)), parcelas: atrasadas.length }
      return null
    }
    if (!r.pago && r.dias_atraso && r.dias_atraso > 0) return { dias: r.dias_atraso, parcelas: 0 }
    return null
  }

  return (
    <div style={s.page}>
      <header style={s.topbar}>
        <img src="/logo.jpg" alt="Roesel" style={s.logo} onError={e=>(e.currentTarget.style.display='none')}/>
        <nav style={s.nav}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{setTipo(t.id);setSearch('');setFEmp('');setFSt('')}}
              style={{padding:'.45rem 1.1rem',borderRadius:7,border:'none',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit',background:tipo===t.id?'#0097A8':'transparent',color:tipo===t.id?'#fff':'#7A919E'}}>
              {t.label}
            </button>
          ))}
        </nav>
        <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'#7A919E'}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:conn===true?'#27AE60':conn===false?'#E74C3C':'#ccc'}}/>
          <span>{conn===true?'conectado':conn===false?'erro':'conectando...'}</span>
          <span style={{margin:'0 4px'}}>|</span>
          <span>👤 {user}</span>
          <button onClick={()=>setLogado(false)} style={{...s.btnOut,padding:'3px 10px',fontSize:11,color:'#E74C3C',borderColor:'#FDECEA'}}>Sair</button>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.row}>
          <div>
            <h1 style={s.h1}>{tabLabel} — Demandas em Andamento</h1>
            <p style={s.p}>{subTitle()}</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setUploadModal(true)} style={{...s.btnOut,gap:6}}><Upload size={15}/> Importar Excel</button>
            <button onClick={openNew} style={s.btnTeal}><Plus size={16}/> Nova demanda</button>
          </div>
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
            {[
              {l:'Acordo fechado',v:acFin,sv:'quitado'},
              {l:'Pago este mês',v:fmtR(totalPagoMes),sv:'recebido no mês'},
              {l:'Total já pago',v:fmtR(totalPago),sv:'soma de pagamentos'},
              {l:'Pré-processuais',v:preProc,sv:'em curso'}
            ].map(({l,v,sv})=>(
              <div key={l} style={{background:'rgba(255,255,255,.15)',borderRadius:8,padding:'.65rem .9rem'}}>
                <p style={{fontSize:10,color:'rgba(255,255,255,.6)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>{l}</p>
                <p style={{fontSize:18,fontWeight:700,color:'#fff'}}>{v}</p>
                <p style={{fontSize:10,color:'rgba(255,255,255,.5)',marginTop:1}}>{sv}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={s.g4}>
          <KPI l="Total de demandas" v={tot} sv={tipo==='lets'?`LETS ${empC.LETS} · SAL ${empC.SALUTE} · EBC ${empC.EBEC}`:`${tot} registros`} c="#0097A8"/>
          <KPI l="Valores a Receber" v={fmtR(totVal)} sv="soma dos valores" c="#E67E22"/>
          <KPI l={tipo==='lets'||tipo==='letspf'?'Em andamento':'Em tratativa'} v={ea} sv={`${Math.round(ea/Math.max(1,tot)*100)}% do total`} c="#2980B9"/>
          <KPI l="Acordos/Quitados" v={acFin} sv="pagamentos confirmados" c="#27AE60"/>
        </div>
        <div style={s.g6}>
          <KPI l="Culpa do locatário" v={culpa} c="#E74C3C"/>
          <KPI l="Sem êxito" v={semEx} c="#E67E22"/>
          <KPI l="Pré-processual" v={preProc} c="#8E44AD"/>
          <KPI l="Notif. extrajudicial" v={notif} c="#0097A8"/>
          <KPI l="Com seguradora" v={segur} c="#2980B9"/>
          <KPI l="Arquivamento sugerido" v={arq} c="#27AE60"/>
        </div>

        <div style={s.card}>
          <div style={s.toolbar}>
            <span style={{fontSize:10,fontWeight:700,color:'#7A919E',textTransform:'uppercase',letterSpacing:'.1em',flex:1}}>Todas as demandas</span>
            <div style={{position:'relative'}}>
              <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#7A919E'}}/>
              <input style={{...s.inp,paddingLeft:30,width:176}} placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            {tipo==='lets'&&<select style={s.inp} value={fEmp} onChange={e=>setFEmp(e.target.value)}><option value="">Todas empresas</option><option>LETS</option><option>SALUTE</option><option>EBEC</option></select>}
            <select style={s.inp} value={fSt} onChange={e=>setFSt(e.target.value)}>
              <option value="">Todos status</option>
              {stList.map(x=><option key={x}>{x}</option>)}
            </select>
            <button onClick={exportCSV} style={s.btnOut}><Download size={13}/> CSV</button>
          </div>
          <div style={{overflowX:'auto',maxHeight:420,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead style={{position:'sticky',top:0,zIndex:2}}>
                <tr style={{background:'#FAFCFD',borderBottom:'2px solid #DDE5EA'}}>
                  {showPlaca&&th('Placa V1')}
                  {th(tipo==='lets'?'Cliente':'Devedor')}
                  {th('CPF/CNPJ')}
                  {th(tipo==='lets'?'Terceiro':'Telefone')}
                  {th('Email')}
                  {th('Responsável')}
                  {th('Dt. Evento')}
                  {th('Dt. Envio')}
                  {tipo==='lets'&&th('Empresa')}
                  {tipo==='avarias'&&th('Placa 3º')}
                  {(tipo==='cobr'||tipo==='avarias')&&th('Fato Gerador')}
                  {th('Valores a Receber')}
                  {th('Parcelas')}
                  {th('Atraso')}
                  {th('Status')}
                  {th('Por')}
                  {th('Andamento')}
                  {user==='Claudiane'&&th('Ações')}
                </tr>
              </thead>
              <tbody>
                {loading?<tr><td colSpan={20} style={{textAlign:'center',padding:'3rem',color:'#7A919E'}}>Carregando...</td></tr>
                :filtered.length===0?<tr><td colSpan={20} style={{textAlign:'center',padding:'3rem',color:'#7A919E'}}>Nenhuma demanda encontrada</td></tr>
                :filtered.map(r=>{
                  const stStyle=ST_MAP[r.status||'']||{bg:'#E0F5F7',color:'#0097A8'}
                  const empStyle=EMP_MAP[r.empresa||'']||{bg:'#EEF0F3',color:'#6B8090'}
                  const atraso = melhorAtraso(r)
                  const parc = r.parcelas || []
                  const pagas = parc.filter(p=>p.pago).length
                  return <tr key={r.id} onClick={()=>openEdit(r.id)} style={{borderBottom:'1px solid #DDE5EA',cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.background='#F0F7F9')} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                    {showPlaca&&<td style={{padding:'7px 11px',fontFamily:'monospace',fontSize:10,color:'#7A919E'}}>{r.placa||'—'}</td>}
                    <td style={{padding:'7px 11px',maxWidth:140,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{tipo==='lets'?(r.cliente||'—'):(r.devedor||r.terceiro||'—')}</td>
                    <td style={{padding:'7px 11px',fontSize:11,color:'#7A919E',whiteSpace:'nowrap'}}>{r.cpf_cnpj||'—'}</td>
                    <td style={{padding:'7px 11px',maxWidth:120,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',color:'#7A919E'}}>{tipo==='lets'?(r.terceiro||'—'):(r.telefone||'—')}</td>
                    <td style={{padding:'7px 11px',maxWidth:140,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',color:'#7A919E',fontSize:11}}>{r.email||'—'}</td>
                    <td style={{padding:'7px 11px',maxWidth:120,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',color:'#7A919E',fontSize:11}}>{r.responsavel||'—'}</td>
                    <td style={{padding:'7px 11px',fontSize:11,color:'#7A919E',whiteSpace:'nowrap'}}>{r.data_evento||'—'}</td>
                    <td style={{padding:'7px 11px',fontSize:11,color:'#7A919E',whiteSpace:'nowrap'}}>{r.data_envio||'—'}</td>
                    {tipo==='lets'&&<td style={{padding:'7px 11px'}}>{r.empresa?<Badge label={r.empresa} bg={empStyle.bg} color={empStyle.color}/>:'—'}</td>}
                    {tipo==='avarias'&&<td style={{padding:'7px 11px',fontFamily:'monospace',fontSize:10,color:'#7A919E'}}>{r.terceiro||'—'}</td>}
                    {(tipo==='cobr'||tipo==='avarias')&&<td style={{padding:'7px 11px',maxWidth:120,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',color:'#7A919E',fontSize:11}}>{r.fato_gerador||'—'}</td>}
                    <td style={{padding:'7px 11px',textAlign:'right',fontWeight:600}}>{fmtN(tipo==='lets'||tipo==='letspf'?r.danos:r.saldo)}</td>
                    <td style={{padding:'7px 11px',textAlign:'center',fontSize:11}}>
                      {parc.length > 0
                        ? <span style={{background:'#E0F5F7',color:'#0097A8',borderRadius:6,padding:'2px 7px',fontWeight:600}}>{pagas}/{parc.length}</span>
                        : <span style={{color:'#7A919E'}}>—</span>
                      }
                    </td>
                    <td style={{padding:'7px 11px'}}>
                      {atraso
                        ? <span style={{background:'#FDECEA',color:'#E74C3C',borderRadius:6,padding:'2px 7px',fontSize:11,fontWeight:600}}>
                            {atraso.parcelas > 0 ? `${atraso.parcelas}p · ` : ''}{atraso.dias}d
                          </span>
                        : <span style={{color:'#7A919E',fontSize:11}}>—</span>
                      }
                    </td>
                    <td style={{padding:'7px 11px'}}><Badge label={r.status||'—'} bg={stStyle.bg} color={stStyle.color}/></td>
                    <td style={{padding:'7px 11px',color:'#7A919E',fontSize:11}}>{r.atualizado_por||'—'}</td>
                    <td style={{padding:'7px 11px',maxWidth:200,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',color:'#7A919E',fontSize:11}} title={r.andamento||''}>{r.andamento||'—'}</td>
                    {user==='Claudiane'&&<td style={{padding:'7px 11px',whiteSpace:'nowrap'}} onClick={e=>e.stopPropagation()}>
                      <button onClick={e=>{e.stopPropagation();setConfirmId(r.id)}} style={{padding:'4px 7px',borderRadius:6,border:'1px solid #FDECEA',background:'transparent',cursor:'pointer',color:'#E74C3C'}}><Trash2 size={13}/></button>
                    </td>}
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

      {uploadModal&&(
        <div style={{...s.overlay,alignItems:'center',paddingTop:0}}>
          <div style={{background:'#fff',borderRadius:14,width:480,padding:'1.5rem',boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h3 style={{fontSize:15,fontWeight:700,margin:0}}>Importar Excel</h3>
              <button onClick={()=>{setUploadModal(false);setUploadRows([]);setUploadFileName('')}} style={{background:'none',border:'none',cursor:'pointer',color:'#7A919E'}}><X size={20}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={s.lb}>Aba de destino</label>
                <select style={s.fi} value={uploadTipo} onChange={e=>setUploadTipo(e.target.value as Tipo)}>
                  <option value="lets">Let's</option>
                  <option value="letspf">Let's PF</option>
                  <option value="vix">Vix - 1</option>
                  <option value="cobr">Vix - Cobrança</option>
                  <option value="avarias">Vix - Avarias</option>
                </select>
              </div>
              <div>
                <label style={s.lb}>Arquivo Excel (.xlsx)</label>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange}
                  style={{...s.fi, padding:'6px 10px', cursor:'pointer'}}/>
              </div>
              {uploadRows.length > 0 && (
                <div style={{background:'#EAF7EE',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#27AE60',fontWeight:600}}>
                  ✅ {uploadRows.length} linhas detectadas em "{uploadFileName}"
                </div>
              )}
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:20}}>
              <button onClick={()=>{setUploadModal(false);setUploadRows([]);setUploadFileName('')}} style={{...s.btnOut,padding:'.5rem 1rem',fontSize:13}}>Cancelar</button>
              <button onClick={handleUpload} disabled={!uploadRows.length||uploading}
                style={{...s.btnTeal,opacity:(!uploadRows.length||uploading)?0.6:1}}>
                {uploading?'Importando...':`Importar ${uploadRows.length} registros`}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal&&(
        <div style={s.overlay} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={s.modal}>
            <div style={s.mhdr}>
              <h3 style={{fontSize:15,fontWeight:700}}>{editing?'Editar':'Nova'} demanda — {tabLabel}</h3>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#7A919E'}}><X size={20}/></button>
            </div>
            {tipo==='lets'||tipo==='letspf'?(
              <div style={s.fg}>
                <FormField lb="Cliente"><input style={s.fi} value={form.cliente||''} onChange={e=>set('cliente',e.target.value)}/></FormField>
                <FormField lb="Devedor"><input style={s.fi} value={form.devedor||''} onChange={e=>set('devedor',e.target.value)}/></FormField>
                <FormField lb="CPF/CNPJ"><input style={s.fi} value={form.cpf_cnpj||''} onChange={e=>set('cpf_cnpj',e.target.value)}/></FormField>
                <FormField lb="Telefone"><input style={s.fi} value={form.telefone||''} onChange={e=>set('telefone',e.target.value)}/></FormField>
                <FormField lb="Email"><input style={s.fi} value={form.email||''} onChange={e=>set('email',e.target.value)}/></FormField>
                <FormField lb="Responsável"><input style={s.fi} value={form.responsavel||''} onChange={e=>set('responsavel',e.target.value)}/></FormField>
                <FormField lb="Data do Evento"><input style={s.fi} value={form.data_evento||''} placeholder="dd/mm/aaaa" onChange={e=>set('data_evento', maskDate(e.target.value))}/></FormField>
                <FormField lb="Data de Envio"><input style={s.fi} value={form.data_envio||''} placeholder="dd/mm/aaaa" onChange={e=>set('data_envio', maskDate(e.target.value))}/></FormField>
                <FormField lb="Valores a Receber (R$)"><input type="text" inputMode="decimal" style={s.fi} value={form.danos||''} placeholder="0,00" onChange={e=>set('danos',e.target.value)} onBlur={e=>set('danos',toNum(e.target.value))}/></FormField>
                <FormField lb="Status"><select style={s.fi} value={form.status||''} onChange={e=>set('status',e.target.value)}>{ST_LETS.map(x=><option key={x}>{x}</option>)}</select></FormField>
                <FormField lb="Fato Gerador"><select style={s.fi} value={form.fato_gerador||''} onChange={e=>set('fato_gerador',e.target.value)}>{FATOS.map(x=><option key={x}>{x}</option>)}</select></FormField>
                <ParcelasEditor parcelas={parcelas} onChange={setParcelas}/>
                <div style={{gridColumn:'1/-1'}}><FormField lb="Andamento"><textarea style={{...s.fi,resize:'vertical',minHeight:90}} value={form.andamento||''} onChange={e=>set('andamento',e.target.value)}/></FormField></div>
              </div>
            ):tipo==='avarias'?(
              <div style={s.fg}>
                <FormField lb="Devedor"><input style={s.fi} value={form.devedor||''} onChange={e=>set('devedor',e.target.value)}/></FormField>
                <FormField lb="Telefone"><input style={s.fi} value={form.telefone||''} onChange={e=>set('telefone',e.target.value)}/></FormField>
                <FormField lb="CPF/CNPJ"><input style={s.fi} value={form.cpf_cnpj||''} onChange={e=>set('cpf_cnpj',e.target.value)}/></FormField>
                <FormField lb="Email"><input style={s.fi} value={form.email||''} onChange={e=>set('email',e.target.value)}/></FormField>
                <FormField lb="Responsável"><input style={s.fi} value={form.responsavel||''} onChange={e=>set('responsavel',e.target.value)}/></FormField>
                <FormField lb="Data do Evento"><input style={s.fi} value={form.data_evento||''} placeholder="dd/mm/aaaa" onChange={e=>set('data_evento', maskDate(e.target.value))}/></FormField>
                <FormField lb="Data de Envio"><input style={s.fi} value={form.data_envio||''} placeholder="dd/mm/aaaa" onChange={e=>set('data_envio', maskDate(e.target.value))}/></FormField>
                <FormField lb="Placa V1"><input style={s.fi} value={form.placa||''} onChange={e=>set('placa',e.target.value)}/></FormField>
                <FormField lb="Placa 3º"><input style={s.fi} value={form.terceiro||''} onChange={e=>set('terceiro',e.target.value)}/></FormField>
                <FormField lb="Valores a Receber (R$)"><input type="text" inputMode="decimal" style={s.fi} value={form.saldo||''} placeholder="0,00" onChange={e=>set('saldo',e.target.value)} onBlur={e=>set('saldo',toNum(e.target.value))}/></FormField>
                <FormField lb="Fato Gerador"><select style={s.fi} value={form.fato_gerador||''} onChange={e=>set('fato_gerador',e.target.value)}>{FATOS.map(x=><option key={x}>{x}</option>)}</select></FormField>
                <FormField lb="Status"><select style={s.fi} value={form.status||''} onChange={e=>set('status',e.target.value)}>{ST_COBR.map(x=><option key={x}>{x}</option>)}</select></FormField>
                <ParcelasEditor parcelas={parcelas} onChange={setParcelas}/>
                <div style={{gridColumn:'1/-1'}}><FormField lb="Andamento"><textarea style={{...s.fi,resize:'vertical',minHeight:90}} value={form.andamento||''} onChange={e=>set('andamento',e.target.value)}/></FormField></div>
              </div>
            ):(
              <div style={s.fg}>
                <FormField lb="Devedor"><input style={s.fi} value={form.devedor||''} onChange={e=>set('devedor',e.target.value)}/></FormField>
                <FormField lb="Telefone"><input style={s.fi} value={form.telefone||''} onChange={e=>set('telefone',e.target.value)}/></FormField>
                <FormField lb="CPF/CNPJ"><input style={s.fi} value={form.cpf_cnpj||''} onChange={e=>set('cpf_cnpj',e.target.value)}/></FormField>
                <FormField lb="Email"><input style={s.fi} value={form.email||''} onChange={e=>set('email',e.target.value)}/></FormField>
                <FormField lb="Responsável"><input style={s.fi} value={form.responsavel||''} onChange={e=>set('responsavel',e.target.value)}/></FormField>
                <FormField lb="Data do Evento"><input style={s.fi} value={form.data_evento||''} placeholder="dd/mm/aaaa" onChange={e=>set('data_evento', maskDate(e.target.value))}/></FormField>
                <FormField lb="Data de Envio"><input style={s.fi} value={form.data_envio||''} placeholder="dd/mm/aaaa" onChange={e=>set('data_envio', maskDate(e.target.value))}/></FormField>
                <FormField lb="Valores a Receber (R$)"><input type="text" inputMode="decimal" style={s.fi} value={form.saldo||''} placeholder="0,00" onChange={e=>set('saldo',e.target.value)} onBlur={e=>set('saldo',toNum(e.target.value))}/></FormField>
                <FormField lb="Status"><select style={s.fi} value={form.status||''} onChange={e=>set('status',e.target.value)}>{stList.map(x=><option key={x}>{x}</option>)}</select></FormField>
                <FormField lb="Fato Gerador"><select style={s.fi} value={form.fato_gerador||''} onChange={e=>set('fato_gerador',e.target.value)}>{FATOS.map(x=><option key={x}>{x}</option>)}</select></FormField>
                <ParcelasEditor parcelas={parcelas} onChange={setParcelas}/>
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