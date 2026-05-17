import type { Metadata } from 'next'
import './globals.css'
import '../styles/global.css'
import { ThemeToggle } from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'HeartNote',
  description: 'Postpartum cardiovascular symptom documentation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var t = localStorage.getItem('heartnote-theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
          })();
        `}} />
      </head>
      <body style={{ background: 'var(--bg)', minHeight: '100vh', position: 'relative' }}>

        {/* ── Decorative background blobs ──────────────────────── */}
        <div aria-hidden style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          {/* Top-right purple blob */}
          <div style={{
            position: 'absolute', top: '-15%', right: '-12%',
            width: 650, height: 650, borderRadius: '50%',
            background: 'radial-gradient(circle, var(--blob-purple) 0%, transparent 68%)',
            filter: 'blur(40px)',
          }} />
          {/* Bottom-left pink blob */}
          <div style={{
            position: 'absolute', bottom: '-18%', left: '-12%',
            width: 580, height: 580, borderRadius: '50%',
            background: 'radial-gradient(circle, var(--blob-pink) 0%, transparent 68%)',
            filter: 'blur(40px)',
          }} />
          {/* Center subtle purple */}
          <div style={{
            position: 'absolute', top: '38%', right: '8%',
            width: 320, height: 320, borderRadius: '50%',
            background: 'radial-gradient(circle, var(--blob-purple) 0%, transparent 70%)',
            filter: 'blur(60px)', opacity: 0.6,
          }} />
          {/* Top-left tiny pink */}
          <div style={{
            position: 'absolute', top: '12%', left: '4%',
            width: 220, height: 220, borderRadius: '50%',
            background: 'radial-gradient(circle, var(--blob-pink) 0%, transparent 70%)',
            filter: 'blur(50px)', opacity: 0.7,
          }} />
        </div>

        {/* ── Nav ─────────────────────────────────────────────── */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', height: 58, position: 'sticky', top: 0, zIndex: 50,
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderBottom: '1px solid var(--border)',
          transition: 'background 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Logo heart */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ec4899, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 14px rgba(244,114,182,0.5)',
            }}>
              <svg width="17" height="17" viewBox="0 0 28 28" fill="none">
                <path d="M14 23s-8-5.5-8-11a6 6 0 0 1 8-5.65A6 6 0 0 1 22 12C22 17.5 14 23 14 23z" fill="white" />
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)', letterSpacing: '-0.4px' }}>
              Heart<span style={{ background: 'linear-gradient(90deg, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Note</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'none' }}>
              POSTPARTUM CARE
            </span>
            <ThemeToggle />
          </div>
        </nav>

        {/* ── Page content ─────────────────────────────────────── */}
        <main style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  )
}
