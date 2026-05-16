import { useEffect, useRef } from 'react'

// Predefined face regions as fractions of image size (assumes centered face)
const REGIONS: Record<string, { x: number; y: number; w: number; h: number }> = {
  forehead:    { x: 0.25, y: 0.05, w: 0.50, h: 0.18 },
  left_eye:    { x: 0.16, y: 0.27, w: 0.28, h: 0.14 },
  right_eye:   { x: 0.56, y: 0.27, w: 0.28, h: 0.14 },
  left_cheek:  { x: 0.06, y: 0.43, w: 0.34, h: 0.22 },
  right_cheek: { x: 0.60, y: 0.43, w: 0.34, h: 0.22 },
  lips:        { x: 0.28, y: 0.63, w: 0.44, h: 0.12 },
  full_face:   { x: 0.10, y: 0.06, w: 0.80, h: 0.84 },
}

// Maps Grok's clinical terms → which face region(s) to highlight
const SYMPTOM_MAP: Record<string, { regions: string[]; label: string; redFlag: boolean }> = {
  'periorbital edema':   { regions: ['left_eye', 'right_eye'],     label: 'Periorbital Edema',   redFlag: true  },
  'facial edema':        { regions: ['full_face'],                  label: 'Facial Edema',         redFlag: true  },
  'facial flushing':     { regions: ['left_cheek', 'right_cheek'], label: 'Facial Flushing',      redFlag: false },
  'pallor':              { regions: ['full_face'],                  label: 'Pallor',               redFlag: true  },
  'jaundice':            { regions: ['forehead', 'left_cheek', 'right_cheek'], label: 'Jaundice', redFlag: true  },
  'visual disturbances': { regions: ['left_eye', 'right_eye'],     label: 'Visual Disturbances',  redFlag: true  },
  'facial paresthesia':  { regions: ['full_face'],                  label: 'Facial Numbness',      redFlag: true  },
  'severe cephalgia':    { regions: ['forehead'],                   label: 'Severe Headache',      redFlag: true  },
  'diaphoresis':         { regions: ['forehead'],                   label: 'Diaphoresis',          redFlag: false },
  'cyanosis':            { regions: ['lips'],                       label: 'Cyanosis',             redFlag: true  },
}

interface FaceAnnotationProps {
  imageSrc: string        // base64 from WebcamCapture
  symptoms: string[]      // clinical marker strings from Grok e.g. ["periorbital edema", "pallor"]
}

export function FaceAnnotation({ imageSrc, symptoms }: FaceAnnotationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.src = imageSrc
    img.onload = () => {
      canvas.width  = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const W = img.width
      const H = img.height

      // Track which regions already have a label to avoid stacking
      const labeledRegions = new Set<string>()

      symptoms.forEach(symptom => {
        const key   = symptom.toLowerCase()
        const match = SYMPTOM_MAP[key]
        if (!match) return

        const color    = match.redFlag ? '#dc2626' : '#d97706'
        const colorBg  = match.redFlag ? 'rgba(220,38,38,0.18)' : 'rgba(217,119,6,0.18)'

        match.regions.forEach(regionKey => {
          const r = REGIONS[regionKey]
          if (!r) return

          const rx = r.x * W
          const ry = r.y * H
          const rw = r.w * W
          const rh = r.h * H

          // Filled highlight
          ctx.fillStyle = colorBg
          roundRect(ctx, rx, ry, rw, rh, 10)
          ctx.fill()

          // Dashed border
          ctx.strokeStyle = color
          ctx.lineWidth   = 2.5
          ctx.setLineDash([6, 4])
          roundRect(ctx, rx, ry, rw, rh, 10)
          ctx.stroke()
          ctx.setLineDash([])

          // Label — only draw once per region per symptom
          const labelKey = `${regionKey}-${key}`
          if (!labeledRegions.has(labelKey)) {
            labeledRegions.add(labelKey)
            drawLabel(ctx, match.label, rx + rw / 2, ry, color)
          }
        })
      })
    }
  }, [imageSrc, symptoms])

  if (!symptoms.length) {
    return (
      <img
        src={imageSrc}
        alt="Face capture"
        style={{ width: '100%', borderRadius: 8 }}
      />
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', borderRadius: 8, display: 'block' }}
      />
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {symptoms.map(s => {
          const match = SYMPTOM_MAP[s.toLowerCase()]
          if (!match) return null
          return (
            <span
              key={s}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 999,
                background: match.redFlag ? 'var(--risk-high-bg)' : 'var(--risk-moderate-bg)',
                color:      match.redFlag ? 'var(--risk-high)'    : 'var(--risk-moderate)',
                border:     `1px solid ${match.redFlag ? 'var(--risk-high-border)' : 'var(--risk-moderate-border)'}`,
              }}
            >
              {match.redFlag ? '⚠ ' : ''}{match.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  color: string
) {
  const padding = 6
  ctx.font = 'bold 13px system-ui, sans-serif'
  const tw = ctx.measureText(text).width
  const bw = tw + padding * 2
  const bh = 22
  const bx = cx - bw / 2
  const by = Math.max(4, y - bh - 4)

  // Badge background
  ctx.fillStyle = color
  roundRect(ctx, bx, by, bw, bh, 6)
  ctx.fill()

  // Badge text
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, bx + padding, by + bh / 2)

  // Connector line
  ctx.strokeStyle = color
  ctx.lineWidth   = 1.5
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(cx, by + bh)
  ctx.lineTo(cx, y)
  ctx.stroke()
  ctx.setLineDash([])
}
