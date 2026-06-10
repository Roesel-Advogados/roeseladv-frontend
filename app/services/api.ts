const SUPA_URL = 'https://ndecnsjddwflhhhsquoq.supabase.co'
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZWNuc2pkZHdmbGhoaHNxdW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMzQ5ODEsImV4cCI6MjA5MTkxMDk4MX0.p6aQWKNBPSOpV9JjawkE4ZwPqWwsHaEvp4u-yWegasI'

const H = {
  'apikey': SUPA_KEY,
  'Authorization': `Bearer ${SUPA_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

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
  parcelas?: Parcela[]
  dias_atraso?: number
  data_envio?: string
  responsavel?: string
  cpf_cnpj?: string
  data_evento?: string
  email?: string
}

export type DemandaInput = Partial<Demanda>

export function fmtR(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function fmtN(v?: number): string {
  if (!v) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function calcDiasAtraso(dataVencimento?: string, pago?: boolean): number {
  if (pago || !dataVencimento) return 0
  try {
    const [d, m, y] = dataVencimento.split('/')
    const venc = new Date(+y, +m - 1, +d)
    const hoje = new Date()
    return Math.max(0, Math.floor((hoje.getTime() - venc.getTime()) / 86400000))
  } catch { return 0 }
}

function parseParcelas(raw: any): Parcela[] {
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : (raw || [])
    const hoje = new Date()
    return arr.map((p: any) => {
      let dias_atraso = 0
      if (!p.pago && p.vencimento) {
        try {
          const [d, m, y] = p.vencimento.split('/')
          const venc = new Date(+y, +m - 1, +d)
          dias_atraso = Math.max(0, Math.floor((hoje.getTime() - venc.getTime()) / 86400000))
        } catch { dias_atraso = 0 }
      }
      return { ...p, dias_atraso }
    })
  } catch { return [] }
}

function processRow(r: any): Demanda {
  return {
    ...r,
    parcelas: parseParcelas(r.parcelas),
    dias_atraso: calcDiasAtraso(r.data_vencimento, r.pago),
  }
}

export const api = {
  async listar(tipo: string): Promise<Demanda[]> {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/demandas?tipo=eq.${tipo}&order=atualizado_em.desc`,
      { headers: H }
    )
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    return data.map(processRow)
  },

  async buscar(id: number): Promise<Demanda> {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/demandas?id=eq.${id}`,
      { headers: H }
    )
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    return processRow(data[0])
  },

  async criar(payload: Partial<Demanda>): Promise<Demanda> {
    const body: any = {
      ...payload,
      parcelas: JSON.stringify(payload.parcelas || []),
    }
    delete body.id
    delete body.dias_atraso
    delete body.criado_em
    delete body.atualizado_em
    const res = await fetch(
      `${SUPA_URL}/rest/v1/demandas`,
      { method: 'POST', headers: H, body: JSON.stringify(body) }
    )
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    return processRow(data[0])
  },

  async atualizar(id: number, payload: Partial<Demanda>): Promise<Demanda> {
    const body: any = {
      ...payload,
      parcelas: JSON.stringify(payload.parcelas || []),
      atualizado_em: new Date().toISOString(),
    }
    delete body.id
    delete body.dias_atraso
    delete body.criado_em
    const res = await fetch(
      `${SUPA_URL}/rest/v1/demandas?id=eq.${id}`,
      { method: 'PATCH', headers: H, body: JSON.stringify(body) }
    )
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    return processRow(data[0])
  },

  async deletar(id: number): Promise<void> {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/demandas?id=eq.${id}`,
      { method: 'DELETE', headers: { ...H, 'Prefer': 'return=minimal' } }
    )
    if (!res.ok) throw new Error(await res.text())
  },
}