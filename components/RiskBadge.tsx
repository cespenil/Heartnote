import { useEffect, useState } from 'react'

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH'

const CONFIG: Record<RiskLevel, { color: string; bg: string; border: string; label: string; pulse: boolean }> = {
  LOW: {
    color:  'var(--risk-low)',
    bg:     'var(--risk-low-bg)',
    border: 'var(--risk-low-border)',
    label:  'Low Risk',
    pulse:  false,
  },
  MODERATE: {
    color:  'var(--risk-moderate)',
    bg:     'var(--risk-moderate-bg)',
    border: 'var(--risk-moderate-border)',
    label:  'Moderate Risk',
    pulse:  true,
  },
  HIGH: {
    color:  'var(--risk-high)',
    bg:     'var(--risk-high-bg)',
    border: 'var(--risk-high-border)',
    label:  'High Risk — Seek Care',
    pulse:  true,
  },
}

interface RiskBadgeProps {
  level: RiskLevel
  size?: 'sm' | 'lg'
}

export function RiskBadge({ level, size = 'lg' }: RiskBadgeProps) {
  const [visible, setVisible] = useState(false)
  const cfg = CONFIG[level]

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [level])

  const isLg = size === 'lg'

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: isLg ? '14px 28px' : '6px 14px',
        borderRadius: 999,
        background: cfg.bg,
        border: `2px solid ${cfg.border}`,
        color: cfg.color,
        fontWeight: 700,
        fontSize: isLg ? 20 : 13,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.85)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
        animation: cfg.pulse && visible ? 'pulse-ring 1.8s infinite' : undefined,
      }}
    >
      <span style={{ fontSize: isLg ? 24 : 14 }}>
        {level === 'LOW' ? '✓' : level === 'MODERATE' ? '!' : '⚠'}
      </span>
      {cfg.label}
    </div>
  )
}
