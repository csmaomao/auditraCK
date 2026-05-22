import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AudiTRACK — AUSG Asset Reservation Tracker',
  description: 'Internal asset reservation tracker for the AUSG Auditor',
  icons: {
    icon: '/branding/ausg-logo.png',
    shortcut: '/branding/ausg-logo.png',
    apple: '/branding/ausg-logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // 'dark' class enables Tailwind dark mode globally
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
