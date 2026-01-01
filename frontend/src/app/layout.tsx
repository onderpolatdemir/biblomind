import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BiblioMind - AI Book Discovery',
  description: 'Discover books through AI-powered photo recognition',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}

