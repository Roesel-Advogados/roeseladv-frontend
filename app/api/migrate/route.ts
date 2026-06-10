import { NextResponse } from 'next/server'

const RENDER = 'https://roeseladv-backend.onrender.com'
const SUPA_URL = 'https://ndecnsjddwflhhhsquoq.supabase.co'
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZWNuc2pkZHdmbGhoaHNxdW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMzQ5ODEsImV4cCI6MjA5MTkxMDk4MX0.p6aQWKNBPSOpV9JjawkE4ZwPqWwsHaEvp4u-yWegasI'

const TIPOS = ['lets','letspf','vix','cobr','avarias','autocarga']

export async function GET() {
  let total = 0, errors = 0, details: any[] = []

  for (const tipo of TIPOS) {
    try {
      const res = await fetch(`${RENDER}/api/demandas?tipo=${tipo}`, { cache:'no-store' })
      if (!res.ok) { details.push({ tipo, erro: 'Render falhou' }); continue }
      const rows = await res.json()

      for (const row of rows) {
        const { id, dias_atraso, ...rest } = row
        const payload = {
          ...rest,
          parcelas: JSON.stringify(rest.parcelas || []),
          devedor: rest.devedor || '',
          telefone: rest.telefone || '',
          data_vencimento: rest.data_vencimento || '',
          data_pagamento: rest.data_pagamento || '',
          data_envio: rest.data_envio || '',
          responsavel: rest.responsavel || '',
          cpf_cnpj: rest.cpf_cnpj || '',
          data_evento: rest.data_evento || '',
          email: rest.email || '',
        }

        const r = await fetch(`${SUPA_URL}/rest/v1/demandas`, {
          method: 'POST',
          headers: {
            'apikey': SUPA_KEY,
            'Authorization': `Bearer ${SUPA_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(payload)
        })

        if (r.ok) { total++ }
        else { errors++; const t = await r.text(); details.push({ tipo, erro: t.slice(0,100) }) }
      }
    } catch(e: any) {
      details.push({ tipo, erro: e.message })
    }
  }

  return NextResponse.json({ total, errors, details })
}