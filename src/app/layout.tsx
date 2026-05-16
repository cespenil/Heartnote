import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HeartNote',
  description: 'Postpartum cardiovascular symptom documentation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          height: 56,
          borderBottom: '1px solid #e5e7eb',
          background: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#7c3aed"/>
              <path
                d="M14 20s-6-4.5-6-8.5a4 4 0 0 1 6-3.46A4 4 0 0 1 20 11.5C20 15.5 14 20 14 20z"
                fill="white"
              />
            </svg>
            <span style={{
              fontWeight: 700,
              fontSize: 18,
              color: '#111827',
              letterSpacing: '-0.3px',
            }}>
              HeartNote
            </span>
          </div>
        </nav>

        <main style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '32px 20px',
        }}>
          {children}
        </main>
      </body>
    </html>
  )
}