'use client'
import { X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Demanda, DemandaInput } from '../services/api'

const FATOS = ['Em tratativa','Culpa do locatário','Falta de documentação','Pré-processual',
  'Acordo finalizado','Acordo em andamento','Tratativa c/ seguradora',
  'Notif. extrajudicial','Arquivamento sugerido','Sem êxito']
const ST_LETS = ['Em andamento','Acordo realizado','Arquivado','Devolvido']
const ST_VIX  = ['Em tratativa','Débito quitado','Pré-processual','Pendente assinatura','Acordo em atraso','Arquivado','Sem êxito']

interface Props {
  tipo: 'lets' | 'vix'
  demanda?: Demanda | null
  userName: string
  onClose: () => void
  onSave: (data: DemandaInput) => Promise<void>
}

export default function Modal({ tipo, demanda, userName, onClose, onSave }: Props) {
  const blank = {
    tipo, placa:'', cliente:'', terceiro:'', contato:'', empresa:'LETS',
    data_sinistro:'', danos:0, limite:0, devedor:'', telefone:'', saldo:0,
    status: tipo==='lets'?'Em andamento':'Em tratativa',
    fato_gerador:'Em tratativa', andamento:'', atualizado_por: userName
  }
  const [form, setForm] = useState<DemandaInput>(blank)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (demanda) setForm({ ...demanda, atualizado_por: userName })
    else setForm({ ...blank, atualizado_por: userName })
  }, [demanda])

  const fi = 'w-full border border-[#DDE5EA] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0097A8] focus:ring-2 focus:ring-[#0097A8]/10 bg-white transition'
  const lb = 'block text-[10px] font-semibold text-[#7A919E] uppercase tracking-wide mb-1'
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try { await onSave({ ...form, atualizado_por: userName || 'Usuário' }) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-14 px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5EA] sticky top-0 bg-white z-10">
          <h3 className="text-base font-semibold text-[#1A2B38]">
            {demanda ? 'Editar' : 'Nova'} demanda — {tipo === 'lets' ? "Let's" : 'Vix - 1'}
          </h3>
          <button onClick={onClose} className="text-[#7A919E] hover:text-[#E74C3C] transition">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          {tipo === 'lets' ? (
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lb}>Placa</label><input className={fi} value={form.placa||''} onChange={e=>set('placa',e.target.value)}/></div>
              <div><label className={lb}>Empresa</label>
                <select className={fi} value={form.empresa||'LETS'} onChange={e=>set('empresa',e.target.value)}>
                  <option>LETS</option><option>SALUTE</option><option>EBEC</option>
                </select>
              </div>
              <div><label className={lb}>Cliente</label><input className={fi} value={form.cliente||''} onChange={e=>set('cliente',e.target.value)}/></div>
              <div><label className={lb}>Data sinistro</label><input className={fi} value={form.data_sinistro||''} onChange={e=>set('data_sinistro',e.target.value)}/></div>
              <div><label className={lb}>Terceiro</label><input className={fi} value={form.terceiro||''} onChange={e=>set('terceiro',e.target.value)}/></div>
              <div><label className={lb}>Contato</label><input className={fi} value={form.contato||''} onChange={e=>set('contato',e.target.value)}/></div>
              <div><label className={lb}>Danos (R$)</label><input type="number" step="0.01" className={fi} value={form.danos||0} onChange={e=>set('danos',parseFloat(e.target.value)||0)}/></div>
              <div><label className={lb}>Limite (R$)</label><input type="number" step="0.01" className={fi} value={form.limite||0} onChange={e=>set('limite',parseFloat(e.target.value)||0)}/></div>
              <div><label className={lb}>Status</label>
                <select className={fi} value={form.status||''} onChange={e=>set('status',e.target.value)}>
                  {ST_LETS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className={lb}>Fato gerador</label>
                <select className={fi} value={form.fato_gerador||''} onChange={e=>set('fato_gerador',e.target.value)}>
                  {FATOS.map(f=><option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="col-span-2"><label className={lb}>Andamento</label>
                <textarea className={fi} rows={4} value={form.andamento||''} onChange={e=>set('andamento',e.target.value)}/>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lb}>Devedor</label><input className={fi} value={form.devedor||''} onChange={e=>set('devedor',e.target.value)}/></div>
              <div><label className={lb}>Telefone</label><input className={fi} value={form.telefone||''} onChange={e=>set('telefone',e.target.value)}/></div>
              <div><label className={lb}>Saldo (R$)</label><input type="number" step="0.01" className={fi} value={form.saldo||0} onChange={e=>set('saldo',parseFloat(e.target.value)||0)}/></div>
              <div><label className={lb}>Status</label>
                <select className={fi} value={form.status||''} onChange={e=>set('status',e.target.value)}>
                  {ST_VIX.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2"><label className={lb}>Fato gerador</label>
                <select className={fi} value={form.fato_gerador||''} onChange={e=>set('fato_gerador',e.target.value)}>
                  {FATOS.map(f=><option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="col-span-2"><label className={lb}>Andamento</label>
                <textarea className={fi} rows={4} value={form.andamento||''} onChange={e=>set('andamento',e.target.value)}/>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end px-6 py-4 border-t border-[#DDE5EA] bg-[#FAFCFD] sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold border border-[#DDE5EA] rounded-lg hover:bg-[#EDF1F4] transition">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-semibold bg-[#0097A8] text-white rounded-lg hover:bg-[#007f8e] transition disabled:opacity-60">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
