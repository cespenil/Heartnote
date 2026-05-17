'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('heartnote-theme') ?? 'dark'
    document.documentElement.setAttribute('data-theme', saved)
    setDark(saved === 'dark')
  }, [])

  const toggle = () => {
    const next = !dark
    const theme = next ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('heartnote-theme', theme)
    setDark(next)
  }

  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 38, height: 22, borderRadius: 11, border: 'none',
        background: dark ? 'rgba(155,114,248,0.3)' : 'rgba(244,114,182,0.25)',
        cursor: 'pointer', position: 'relative', transition: 'background 0.3s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: dark ? 18 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: dark ? '#a78bfa' : '#f472b6',
        transition: 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }}>
        {dark ? '🌙' : '☀️'}
      </div>
    </button>
  )
}
