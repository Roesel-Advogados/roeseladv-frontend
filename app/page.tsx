'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Download } from 'lucide-react'
import { api, Demanda, DemandaInput, fmtR, fmtN } from './services/api'
import Modal from './components/Modal'

type Tipo = 'lets' | 'vix'

const ST_MAP: Record<string, string> = {
  'Em andamento':'b-ea','Em tratativa':'b-ea','Acordo realizado':'b-ac',
  'Débito quitado':'b-dq','Arquivado':'b-ar','Devolvido':'b-dv',
  'Pré-processual':'b-pp','Pendente assinatura':'b-pa',
  'Acordo em atraso':'b-aa','Sem êxito':'b-se'
}

function KPI({ l, v, s, c }: { l: string; v: string | number; s?: string; c: string }) {
  return (
    <div className="bg-white border border-[#DDE5EA] rounded-xl p-4 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: c }} />
      <p className="text-[10px] font-semibold text-[#7A919E] uppercase tracking-wide mb-2">{l}</p>
      <p className="text-[22px] font-bold text-[#1A2B38] leading-tight">{v}</p>
      {s && <p className="text-[11px] text-[#7A919E] mt-1">{s}</p>}
    </div>
  )
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
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [user, setUser] = useState('')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [conn, setConn] = useState<boolean | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.listar(tipo)
      setData(d); setConn(true)
    } catch {
      setConn(false); showToast('Erro ao carregar dados', false)
    } finally { setLoading(false) }
  }, [tipo])

  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setInterval(() => load(), 30000); return () => clearInterval(t) }, [load])

  const filtered = data.filter(r => {
    if (fEmp && r.empresa !== fEmp) return false
    if (fSt && r.status !== fSt) return false
    if (search) {
      const q = search.toLowerCase()
      if (![r.placa, r.cliente, r.terceiro, r.devedor, r.telefone, r.andamento].some(f => f?.toLowerCase().includes(q))) return false
    }
    return true
  })

  const tot = data.length
  const totVal = tipo === 'lets' ? data.reduce((s, r) => s + (r.danos || 0), 0) : data.reduce((s, r) => s + (r.saldo || 0), 0)
  const ea = data.filter(r => r.status === 'Em andamento' || r.status === 'Em tratativa').length
  const acFin = data.filter(r => r.status === 'Acordo realizado' || r.status === 'Débito quitado').length
  const acAnd = data.filter(r => /acordo.*parcela/i.test(r.andamento || '')).length
  const culpa = data.filter(r => /culpa do locat/i.test(r.andamento || '')).length
  const semEx = data.filter(r => /sem êxito/i.test(r.andamento || '')).length
  const preProc = data.filter(r => /pré processual/i.test(r.andamento || '')).length
  const notif = data.filter(r => /notificação extrajudicial/i.test(r.andamento || '')).length
  const segur = data.filter(r => /seguradora/i.test(r.andamento || '')).length
  const arq = data.filter(r => /arquivamento/i.test(r.andamento || '')).length
  const empC = {
    LETS: data.filter(r => r.empresa === 'LETS').length,
    SALUTE: data.filter(r => r.empresa === 'SALUTE').length,
    EBEC: data.filter(r => r.empresa === 'EBEC').length
  }

  const handleSave = async (d: DemandaInput) => {
    try {
      if (editing) await api.atualizar(editing.id, d)
      else await api.criar(d)
      setModal(false); setEditing(null)
      showToast(editing ? 'Demanda atualizada!' : 'Demanda criada!')
      load()
    } catch { showToast('Erro ao salvar', false) }
  }

  const handleDelete = async () => {
    if (!confirmId) return
    try {
      await api.deletar(confirmId)
      setConfirmId(null); showToast('Demanda excluída'); load()
    } catch { showToast('Erro ao excluir', false) }
  }

  const exportCSV = () => {
    const keys = ['placa','cliente','terceiro','contato','empresa','data_sinistro','danos','limite','devedor','telefone','saldo','status','fato_gerador','andamento','atualizado_por']
    const rows = [keys.join(';'), ...filtered.map(r => keys.map(k => `"${(r as any)[k] ?? ''}"`).join(';'))]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }))
    a.download = `roesel_${tipo}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const fil = 'border border-[#DDE5EA] rounded-lg px-2 py-2 text-xs outline-none bg-white focus:border-[#0097A8]'

  return (
    <div className="min-h-screen flex flex-col">

      {/* TOPBAR */}
      <header className="bg-white border-b-[3px] border-[#0097A8] px-6 py-3 flex items-center gap-4 sticky top-0 z-40 shadow-sm">
        <img src="/logo.jpg" alt="Roesel" className="h-10 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
        <nav className="flex gap-1 flex-1">
          {(['lets', 'vix'] as Tipo[]).map(t => (
            <button key={t} onClick={() => { setTipo(t); setSearch(''); setFEmp(''); setFSt('') }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tipo === t ? 'bg-[#0097A8] text-white shadow-sm' : 'text-[#7A919E] hover:bg-[#EDF1F4] hover:text-[#1A2B38]'}`}>
              {t === 'lets' ? "Let's" : 'Vix - 1'}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-xs text-[#7A919E]">
          <div className={`w-2 h-2 rounded-full ${conn === true ? 'bg-[#27AE60]' : conn === false ? 'bg-[#E74C3C]' : 'bg-gray-300'}`} />
          <span>{conn === true ? 'conectado' : conn === false ? 'erro' : 'conectando...'}</span>
          <span className="mx-1">|</span>
          <span>👤</span>
          <input className="border border-[#DDE5EA] rounded-lg px-2 py-1 text-xs outline-none focus:border-[#0097A8] w-32"
            placeholder="Seu nome..." value={user} onChange={e => setUser(e.target.value)} />
        </div>
      </header>

      <main className="flex-1 px-6 py-5">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold text-[#1A2B38]">
              {tipo === 'lets' ? "Let's — Demandas em Andamento" : 'Vix - 1 — Demandas em Andamento'}
            </h1>
            <p className="text-xs text-[#7A919E] mt-1">
              {tipo === 'lets' ? 'Processos junto a terceiros · LETS · SALUTE · EBEC' : 'Devedores locatários · Carteira de cobrança VIX'}
            </p>
          </div>
          <button onClick={() => { setEditing(null); setModal(true) }}
            className="flex items-center gap-2 bg-[#0097A8] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#007f8e] transition shadow-sm">
            <Plus size={16} /> Nova demanda
          </button>
        </div>

        {/* FEATURED */}
        <div className="bg-[#0097A8] rounded-xl p-5 flex items-center gap-6 mb-5 shadow-md relative overflow-hidden">
          <div className="absolute right-[-40px] top-[-40px] w-48 h-48 rounded-full bg-white/10" />
          <div className="text-3xl flex-shrink-0">🤝</div>
          <div className="flex-shrink-0">
            <p className="text-[10px] text-white/70 uppercase tracking-widest mb-1">Acordos fechados</p>
            <p className="text-4xl font-bold text-white leading-none">{acFin + acAnd}</p>
            <p className="text-xs text-white/60 mt-1">encerrados ou em execução</p>
          </div>
          <div className="grid grid-cols-4 gap-3 flex-1">
            {[
              { l: 'Acordo finalizado', v: acFin, s: 'quitado' },
              { l: 'Acordo em andamento', v: acAnd, s: 'parcelas em curso' },
              { l: 'Valor em tratativa', v: fmtR(totVal), s: tipo === 'lets' ? 'soma dos danos' : 'soma dos saldos' },
              { l: 'Pré-processuais', v: preProc, s: 'sugeridos ou em curso' },
            ].map(({ l, v, s }) => (
              <div key={l} className="bg-white/15 rounded-lg px-3 py-2">
                <p className="text-[10px] text-white/60 uppercase tracking-wide mb-1">{l}</p>
                <p className="text-lg font-bold text-white">{v}</p>
                <p className="text-[10px] text-white/50 mt-0.5">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <KPI l="Total de demandas" v={tot} s={tipo === 'lets' ? `LETS ${empC.LETS} · SAL ${empC.SALUTE} · EBC ${empC.EBEC}` : `${tot} devedores`} c="#0097A8" />
          <KPI l="Valor total em tratativa" v={fmtR(totVal)} s="soma dos valores" c="#E67E22" />
          <KPI l={tipo === 'lets' ? 'Em andamento' : 'Em tratativa'} v={ea} s={`${Math.round(ea / Math.max(1, tot) * 100)}% do total`} c="#2980B9" />
          <KPI l={tipo === 'lets' ? 'Encerradas' : 'Débitos quitados'} v={tipo === 'lets' ? tot - ea : data.filter(r => r.status === 'Débito quitado').length} s={tipo === 'lets' ? 'arq. + acordo' : 'pagamentos confirmados'} c="#27AE60" />
        </div>
        <div className="grid grid-cols-6 gap-3 mb-5">
          <KPI l="Culpa do locatário" v={culpa} c="#E74C3C" />
          <KPI l="Sem êxito" v={semEx} c="#E67E22" />
          <KPI l="Pré-processual" v={preProc} c="#8E44AD" />
          <KPI l="Notif. extrajudicial" v={notif} c="#0097A8" />
          <KPI l={tipo === 'lets' ? 'Com seguradora' : 'Acordo andamento'} v={tipo === 'lets' ? segur : acAnd} c="#2980B9" />
          <KPI l="Arquivamento sugerido" v={arq} c="#27AE60" />
        </div>

        {/* TABLE */}
        <div className="bg-white border border-[#DDE5EA] rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#DDE5EA] bg-[#FAFCFD] flex-wrap">
            <span className="text-[10px] font-bold text-[#7A919E] uppercase tracking-widest flex-1">Todas as demandas</span>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A919E]" />
              <input className="border border-[#DDE5EA] rounded-lg pl-8 pr-3 py-2 text-xs outline-none focus:border-[#0097A8] bg-white w-44"
                placeholder={tipo === 'lets' ? 'Placa, cliente...' : 'Buscar devedor...'}
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {tipo === 'lets' && (
              <select className={fil} value={fEmp} onChange={e => setFEmp(e.target.value)}>
                <option value="">Todas empresas</option>
                <option>LETS</option><option>SALUTE</option><option>EBEC</option>
              </select>
            )}
            <select className={fil} value={fSt} onChange={e => setFSt(e.target.value)}>
              <option value="">Todos status</option>
              {(tipo === 'lets'
                ? ['Em andamento', 'Acordo realizado', 'Arquivado', 'Devolvido']
                : ['Em tratativa', 'Débito quitado', 'Pré-processual', 'Pendente assinatura', 'Acordo em atraso', 'Arquivado', 'Sem êxito']
              ).map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold border border-[#DDE5EA] rounded-lg hover:bg-[#EDF1F4] transition">
              <Download size={13} /> CSV
            </button>
          </div>

          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#FAFCFD] border-b-2 border-[#DDE5EA]">
                  {tipo === 'lets' ? (<>
                    <th className="px-3 py-2 text-left font-bold text-[#7A919E] uppercase text-[10px] tracking-wide whitespace-nowrap">Placa</th>
                    <th className="px-3 py-2 text-left font-bold text-[#7A919E] uppercase text-[10px] tracking-wide">Cliente</th>
                    <th className="px-3 py-2 text-left font-bold text-[#7A919E] uppercase text-[10px] tracking-wide">Terceiro</th>
                    <th className="px-3 py-2 text-left font-bold text-[#7A919E] uppercase text-[10px] tracking-wide">Empresa</th>
                    <th className="px-3 py-2 text-right font-bold text-[#7A919E] uppercase text-[10px] tracking-wide">Danos</th>
                    <th className="px-3 py-2 text-right font-bold text-[#7A919E] uppercase text-[10px] tracking-wide">Limite</th>
                  </>) : (<>
                    <th className="px-3 py-2 text-left font-bold text-[#7A919E] uppercase text-[10px] tracking-wide">Devedor</th>
                    <th className="px-3 py-2 text-left font-bold text-[#7A919E] uppercase text-[10px] tracking-wide">Telefone</th>
                    <th className="px-3 py-2 text-right font-bold text-[#7A919E] uppercase text-[10px] tracking-wide">Saldo</th>
                  </>)}
                  <th className="px-3 py-2 text-left font-bold text-[#7A919E] uppercase text-[10px] tracking-wide">Status</th>
                  <th className="px-3 py-2 text-left font-bold text-[#7A919E] uppercase text-[10px] tracking-wide">Fato gerador</th>
                  <th className="px-3 py-2 text-left font-bold text-[#7A919E] uppercase text-[10px] tracking-wide">Por</th>
                  <th className="px-3 py-2 text-left font-bold text-[#7A919E] uppercase text-[10px] tracking-wide">Andamento</th>
                  <th className="px-3 py-2 text-left font-bold text-[#7A919E] uppercase text-[10px] tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="text-center py-12 text-[#7A919E]">Carregando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-[#7A919E]">Nenhuma demanda encontrada</td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="border-b border-[#DDE5EA] hover:bg-[#F0F7F9] transition">
                    {tipo === 'lets' ? (<>
                      <td className="px-3 py-2 font-mono text-[10px] text-[#7A919E]">{r.placa || '—'}</td>
                      <td className="px-3 py-2 max-w-[130px] truncate">{r.cliente || '—'}</td>
                      <td className="px-3 py-2 max-w-[110px] truncate text-[#7A919E]">{r.terceiro || '—'}</td>
                      <td className="px-3 py-2">{r.empresa ? <span className={`badge b-${r.empresa.toLowerCase()}`}>{r.empresa}</span> : '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmtN(r.danos)}</td>
                      <td className="px-3 py-2 text-right text-[#7A919E] tabular-nums">{fmtN(r.limite)}</td>
                    </>) : (<>
                      <td className="px-3 py-2 max-w-[170px] truncate">{r.devedor || '—'}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-[#7A919E]">{r.telefone || '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmtN(r.saldo)}</td>
                    </>)}
                    <td className="px-3 py-2"><span className={`badge ${ST_MAP[r.status || ''] || 'b-ea'}`}>{r.status || '—'}</span></td>
                    <td className="px-3 py-2"><span className="badge b-ft">{r.fato_gerador || 'Em tratativa'}</span></td>
                    <td className="px-3 py-2 text-[#7A919E]">{r.atualizado_por || '—'}</td>
                    <td className="px-3 py-2 max-w-[180px] truncate text-[#7A919E]" title={r.andamento || ''}>{r.andamento || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button onClick={() => { setEditing(r); setModal(true) }}
                        className="p-1.5 rounded-lg border border-[#DDE5EA] text-[#7A919E] hover:bg-[#EDF1F4] transition mr-1">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setConfirmId(r.id)}
                        className="p-1.5 rounded-lg border border-[#FDECEA] text-[#E74C3C] hover:bg-[#FDECEA] transition">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-[#DDE5EA] bg-[#FAFCFD] text-xs text-[#7A919E]">
            {filtered.length} demanda{filtered.length !== 1 ? 's' : ''} exibida{filtered.length !== 1 ? 's' : ''} de {tot} total
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#DDE5EA] px-6 py-3 flex justify-between items-center">
        <img src="/logo.jpg" alt="Roesel" className="h-7 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
        <p className="text-xs text-[#7A919E]">Roesel Advogados Associados — Sistema de Gestão de Demandas</p>
        <p className="text-xs text-[#7A919E]">© 2025</p>
      </footer>

      {/* MODAL FORM */}
      {modal && (
        <Modal tipo={tipo} demanda={editing} userName={user}
          onClose={() => { setModal(false); setEditing(null) }}
          onSave={handleSave} />
      )}

      {/* CONFIRM DELETE */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-base font-bold mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-[#7A919E] mb-5">Tem certeza? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm font-semibold border border-[#DDE5EA] rounded-lg hover:bg-[#EDF1F4] transition">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm font-semibold bg-[#E74C3C] text-white rounded-lg hover:bg-[#c0392b] transition">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-5 right-5 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg z-50 ${toast.ok ? 'bg-[#27AE60]' : 'bg-[#E74C3C]'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
