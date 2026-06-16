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
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() { try { var t = localStorage.getItem('auditrack-theme'); if (t !== 'light') { document.documentElement.classList.add('dark'); } } catch (e) { document.documentElement.classList.add('dark'); } })();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
