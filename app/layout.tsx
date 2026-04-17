import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Roesel Advogados — Sistema de Demandas',
  description: 'Gestão de demandas Roesel Advogados Associados',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
