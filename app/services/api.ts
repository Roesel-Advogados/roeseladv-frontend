const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Parcela {
  numero: number
  valor: number
  vencimento: string
  pago: boolean
  data_pagamento?: string
  dias_atraso?: number
}

export interface Demanda {
  id: number
  tipo: string
  placa?: string
  cliente?: string
  terceiro?: string
  contato?: string
  empresa?: string
  data_sinistro?: string
  danos?: number
  limite?: number
  devedor?: string
  telefone?: string
  saldo?: number
  status?: string
  fato_gerador?: string
  andamento?: string
  atualizado_por?: string
  criado_em?: string
  atualizado_em?: string
  data_vencimento?: string
  valor_pago?: number
  data_pagamento?: string
  pago?: boolean
  dias_atraso?: number
  parcelas?: Parcela[]
}

export type DemandaInput = Omit<Demanda, 'id' | 'criado_em' | 'atualizado_em' | 'dias_atraso'>

export const api = {
  async listar(tipo: string): Promise<Demanda[]> {
    const res = await fetch(`${API}/api/demandas?tipo=${tipo}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Erro ao carregar')
    return res.json()
  },
  async buscar(id: number): Promise<Demanda> {
    const res = await fetch(`${API}/api/demandas/${id}`)
    if (!res.ok) throw new Error('Não encontrado')
    return res.json()
  },
  async criar(data: DemandaInput): Promise<Demanda> {
    const res = await fetch(`${API}/api/demandas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({...data, parcelas: JSON.stringify(data.parcelas || [])})
    })
    if (!res.ok) throw new Error('Erro ao criar')
    return res.json()
  },
  async atualizar(id: number, data: DemandaInput): Promise<Demanda> {
    const res = await fetch(`${API}/api/demandas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({...data, parcelas: JSON.stringify(data.parcelas || [])})
    })
    if (!res.ok) throw new Error('Erro ao atualizar')
    return res.json()
  },
  async deletar(id: number): Promise<void> {
    const res = await fetch(`${API}/api/demandas/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Erro ao deletar')
  }
}

export const fmtR = (v?: number) => {
  if (!v || v <= 0) return '—'
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(2).replace('.', ',')}M`
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace('.', ',')}k`
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export const fmtN = (v?: number) =>
  v && v > 0 ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'