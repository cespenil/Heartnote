'use client'

import { useState, useRef } from 'react'

type BodyRegion =
  | 'head' | 'face' | 'neck'
  | 'left-shoulder' | 'right-shoulder'
  | 'chest'
  | 'left-breast' | 'right-breast'
  | 'upper-abdomen' | 'lower-abdomen'
  | 'left-upper-arm' | 'right-upper-arm'
  | 'left-lower-arm' | 'right-lower-arm'
  | 'left-hand' | 'right-hand'
  | 'left-thigh' | 'right-thigh'
  | 'left-calf' | 'right-calf'
  | 'left-foot' | 'right-foot'
  | 'upper-back' | 'lower-back'

type Severity = 'mild' | 'moderate' | 'severe'
type View = 'front' | 'back'

export interface BodyMapEntry {
  region: BodyRegion
  symptoms: string[]
  severity: Severity
}

interface BodyMapProps {
  onChange: (entries: BodyMapEntry[]) => void
}

const GROUPS = {
  skin:       { label: 'Skin / Neutral',        fill: '#f5c4a0', stroke: '#b08050' },
  pecs:       { label: 'Pectoralis Major',       fill: '#e88898', stroke: '#b04858' },
  abs:        { label: 'Abdominals / Biceps',    fill: '#7aaa3a', stroke: '#4a7820' },
  obliques:   { label: 'Obliques / Lats',        fill: '#909828', stroke: '#5c6010' },
  deltoid:    { label: 'Deltoid / Shoulder',     fill: '#d08830', stroke: '#9a6010' },
  traps:      { label: 'Trapezius',              fill: '#c83030', stroke: '#901010' },
  quads:      { label: 'Quadriceps',             fill: '#4878c8', stroke: '#2850a0' },
  hamstrings: { label: 'Hamstrings / Glutes',    fill: '#7850b0', stroke: '#503880' },
  calves:     { label: 'Calves',                 fill: '#6858b8', stroke: '#403888' },
  bicep:      { label: 'Bicep / Upper Arm',      fill: '#38a89a', stroke: '#1e7068' },
  forearm:    { label: 'Forearm / Lower Arm',    fill: '#4aab6a', stroke: '#2a7848' },
} as const

type GroupKey = keyof typeof GROUPS

const FRONT_MAP: Record<BodyRegion, GroupKey> = {
  head: 'skin', face: 'skin', neck: 'skin',
  'left-shoulder': 'deltoid', 'right-shoulder': 'deltoid',
  chest: 'pecs', 'left-breast': 'pecs', 'right-breast': 'pecs',
  'upper-abdomen': 'abs', 'lower-abdomen': 'obliques',
  'left-upper-arm': 'bicep', 'right-upper-arm': 'bicep',
  'left-lower-arm': 'forearm', 'right-lower-arm': 'forearm',
  'left-hand': 'skin', 'right-hand': 'skin',
  'upper-back': 'traps', 'lower-back': 'obliques',
  'left-thigh': 'quads', 'right-thigh': 'quads',
  'left-calf': 'calves', 'right-calf': 'calves',
  'left-foot': 'skin', 'right-foot': 'skin',
}

const BACK_MAP: Record<BodyRegion, GroupKey> = {
  head: 'skin', face: 'skin', neck: 'skin',
  'left-shoulder': 'deltoid', 'right-shoulder': 'deltoid',
  chest: 'pecs', 'left-breast': 'pecs', 'right-breast': 'pecs',
  'upper-abdomen': 'abs', 'lower-abdomen': 'obliques',
  'left-upper-arm': 'bicep', 'right-upper-arm': 'bicep',
  'left-lower-arm': 'forearm', 'right-lower-arm': 'forearm',
  'left-hand': 'skin', 'right-hand': 'skin',
  'upper-back': 'traps', 'lower-back': 'obliques',
  'left-thigh': 'hamstrings', 'right-thigh': 'hamstrings',
  'left-calf': 'calves', 'right-calf': 'calves',
  'left-foot': 'skin', 'right-foot': 'skin',
}

const LABELS: Record<BodyRegion, string> = {
  head: 'Head', face: 'Face', neck: 'Neck',
  'left-shoulder': 'Left Shoulder', 'right-shoulder': 'Right Shoulder',
  chest: 'Chest',
  'left-breast': 'Left Breast', 'right-breast': 'Right Breast',
  'upper-abdomen': 'Upper Abdomen', 'lower-abdomen': 'Lower Abdomen',
  'left-upper-arm': 'Left Upper Arm', 'right-upper-arm': 'Right Upper Arm',
  'left-lower-arm': 'Left Lower Arm', 'right-lower-arm': 'Right Lower Arm',
  'left-hand': 'Left Hand', 'right-hand': 'Right Hand',
  'left-thigh': 'Left Thigh', 'right-thigh': 'Right Thigh',
  'left-calf': 'Left Calf', 'right-calf': 'Right Calf',
  'left-foot': 'Left Foot', 'right-foot': 'Right Foot',
  'upper-back': 'Upper Back', 'lower-back': 'Lower Back',
}

const SYMPTOMS: Record<BodyRegion, string[]> = {
  head:               ['headache', 'severe headache', 'dizziness', 'lightheadedness', 'confusion', 'vision changes', 'fainting'],
  face:               ['facial swelling', 'puffiness around eyes', 'facial numbness', 'paleness'],
  neck:               ['neck pain', 'neck stiffness', 'swollen glands', 'difficulty swallowing'],
  'left-shoulder':    ['shoulder pain', 'soreness', 'stiffness', 'limited range of motion', 'swelling'],
  'right-shoulder':   ['shoulder pain', 'soreness', 'stiffness', 'limited range of motion', 'swelling'],
  chest:              ['chest pain', 'chest tightness', 'shortness of breath', 'palpitations', 'rapid heartbeat', 'irregular heartbeat', 'pressure'],
  'left-breast':      ['breast pain', 'swelling', 'redness', 'warmth', 'lump'],
  'right-breast':     ['breast pain', 'swelling', 'redness', 'warmth', 'lump'],
  'upper-abdomen':    ['upper abdominal pain', 'nausea', 'vomiting', 'bloating'],
  'lower-abdomen':    ['cramping', 'pelvic pain', 'pressure', 'bloating'],
  'left-upper-arm':   ['arm pain', 'muscle weakness', 'aching', 'bruising', 'swelling'],
  'right-upper-arm':  ['arm pain', 'muscle weakness', 'aching', 'bruising', 'swelling'],
  'left-lower-arm':   ['forearm pain', 'numbness', 'tingling', 'weakness', 'swelling'],
  'right-lower-arm':  ['forearm pain', 'numbness', 'tingling', 'weakness', 'swelling'],
  'left-hand':        ['hand swelling', 'numbness', 'tingling', 'pain', 'weakness'],
  'right-hand':       ['hand swelling', 'numbness', 'tingling', 'pain', 'weakness'],
  'left-thigh':       ['thigh pain', 'swelling', 'warmth', 'redness', 'heaviness'],
  'right-thigh':      ['thigh pain', 'swelling', 'warmth', 'redness', 'heaviness'],
  'left-calf':        ['calf pain', 'swelling', 'warmth', 'redness', 'tenderness'],
  'right-calf':       ['calf pain', 'swelling', 'warmth', 'redness', 'tenderness'],
  'left-foot':        ['foot swelling', 'ankle swelling', 'pain', 'numbness', 'coldness'],
  'right-foot':       ['foot swelling', 'ankle swelling', 'pain', 'numbness', 'coldness'],
  'upper-back':       ['upper back pain', 'shoulder blade pain', 'muscle aches'],
  'lower-back':       ['lower back pain', 'radiating pain', 'muscle spasm'],
}

const SEV = {
  mild:     { fill: 'rgba(251,191,36,0.14)',  stroke: '#fbbf24', label: 'Mild'     },
  moderate: { fill: 'rgba(251,146,60,0.14)',  stroke: '#fb923c', label: 'Moderate' },
  severe:   { fill: 'rgba(248,113,113,0.14)', stroke: '#f87171', label: 'Severe'   },
}

const H_FILL = 'rgba(255,255,255,0.5)'
const H_STR  = '#1e293b'

type Shape =
  | { k: 'e'; cx: number; cy: number; rx: number; ry: number }
  | { k: 'd'; d: string }

interface RegionDef { region: BodyRegion; shape: Shape; views: View[] }

/* viewBox "0 0 200 455"
   head centre y=40, shoulders y=95, chest bottom y=182,
   waist y=208, hip y=248, crotch y=272, knee y=362,
   ankle y=432, foot bottom y=448                        */

const DEFS: RegionDef[] = [
  // ── Both views ─────────────────────────────────────────────
  { region: 'head',
    shape: { k:'e', cx:100, cy:42, rx:28, ry:34 },
    views: ['front','back'] },

  { region: 'neck',
    shape: { k:'d', d:'M 92,74 C 90,82 89,88 90,96 L 110,96 C 111,88 110,82 108,74 Z' },
    views: ['front','back'] },

  // Shoulders — trapezoidal caps at top of arms
  { region: 'left-shoulder',
    shape: { k:'d', d:'M 46,95 C 40,97 28,100 22,108 C 18,114 18,124 24,128 C 32,116 42,106 52,100 Z' },
    views: ['front','back'] },
  { region: 'right-shoulder',
    shape: { k:'d', d:'M 154,95 C 160,97 172,100 178,108 C 182,114 182,124 176,128 C 168,116 158,106 148,100 Z' },
    views: ['front','back'] },

  // Upper arms — wider bicep/tricep section
  { region: 'left-upper-arm',
    shape: { k:'d', d:'M 22,108 C 18,124 16,148 14,176 L 34,180 C 34,152 36,130 42,116 C 36,114 28,112 22,108 Z' },
    views: ['front','back'] },
  { region: 'right-upper-arm',
    shape: { k:'d', d:'M 178,108 C 182,124 184,148 186,176 L 166,180 C 166,152 164,130 158,116 C 164,114 172,112 178,108 Z' },
    views: ['front','back'] },

  // Lower arms — tapers to wrist
  { region: 'left-lower-arm',
    shape: { k:'d', d:'M 14,176 C 12,204 12,234 14,262 L 32,266 C 32,238 32,210 34,180 Z' },
    views: ['front','back'] },
  { region: 'right-lower-arm',
    shape: { k:'d', d:'M 186,176 C 188,204 188,234 186,262 L 168,266 C 168,238 168,210 166,180 Z' },
    views: ['front','back'] },

  // Hands
  { region: 'left-hand',
    shape: { k:'d', d:'M 12,262 C 6,264 4,274 8,283 C 10,288 18,292 26,292 C 34,292 40,287 40,280 C 40,271 36,262 30,262 Z' },
    views: ['front','back'] },
  { region: 'right-hand',
    shape: { k:'d', d:'M 188,262 C 194,264 196,274 192,283 C 190,288 182,292 174,292 C 166,292 160,287 160,280 C 160,271 164,262 170,262 Z' },
    views: ['front','back'] },

  // Thighs
  { region: 'left-thigh',
    shape: { k:'d', d:'M 50,272 C 44,292 40,322 46,362 L 90,362 C 94,324 97,292 100,272 Z' },
    views: ['front','back'] },
  { region: 'right-thigh',
    shape: { k:'d', d:'M 150,272 C 156,292 160,322 154,362 L 110,362 C 103,292 106,292 100,272 Z' },
    views: ['front','back'] },

  // Calves
  { region: 'left-calf',
    shape: { k:'d', d:'M 46,362 C 40,378 36,400 40,422 C 42,432 44,438 46,444 L 78,444 C 80,436 82,428 84,418 C 88,396 90,376 90,362 Z' },
    views: ['front','back'] },
  { region: 'right-calf',
    shape: { k:'d', d:'M 154,362 C 160,378 164,400 160,422 C 158,432 156,438 154,444 L 122,444 C 120,436 118,428 116,418 C 112,396 110,376 110,362 Z' },
    views: ['front','back'] },

  // Feet
  { region: 'left-foot',
    shape: { k:'d', d:'M 36,446 Q 40,456 60,456 Q 78,456 86,450 Q 82,442 60,442 Q 40,442 36,446 Z' },
    views: ['front','back'] },
  { region: 'right-foot',
    shape: { k:'d', d:'M 164,446 Q 160,456 140,456 Q 122,456 114,450 Q 118,442 140,442 Q 160,442 164,446 Z' },
    views: ['front','back'] },

  // ── Front only ─────────────────────────────────────────────
  { region: 'face',
    shape: { k:'e', cx:100, cy:44, rx:20, ry:24 },
    views: ['front'] },

  { region: 'chest',
    shape: { k:'d', d:'M 46,95 C 44,112 46,142 52,182 L 148,182 C 154,142 156,112 154,95 Z' },
    views: ['front'] },

  { region: 'left-breast',
    shape: { k:'e', cx:76, cy:152, rx:21, ry:18 },
    views: ['front'] },
  { region: 'right-breast',
    shape: { k:'e', cx:124, cy:152, rx:21, ry:18 },
    views: ['front'] },

  { region: 'upper-abdomen',
    shape: { k:'d', d:'M 52,182 C 57,194 60,204 62,218 L 138,218 C 140,204 143,194 148,182 Z' },
    views: ['front'] },

  { region: 'lower-abdomen',
    shape: { k:'d', d:'M 62,218 C 58,232 52,250 50,272 L 150,272 C 148,250 142,232 138,218 Z' },
    views: ['front'] },

  // ── Back only ──────────────────────────────────────────────
  { region: 'upper-back',
    shape: { k:'d', d:'M 46,95 C 42,115 44,158 50,202 L 150,202 C 156,158 158,115 154,95 Z' },
    views: ['back'] },

  { region: 'lower-back',
    shape: { k:'d', d:'M 50,202 C 44,220 38,248 46,272 L 154,272 C 162,248 156,220 150,202 Z' },
    views: ['back'] },
]

// ── Component ──────────────────────────────────────────────────
export function BodyMap({ onChange }: BodyMapProps) {
  const [view, setView]             = useState<View>('front')
  const [hovered, setHovered]       = useState<BodyRegion | null>(null)
  const [selected, setSelected]     = useState<BodyRegion | null>(null)
  const [entries, setEntries]       = useState<Map<BodyRegion, BodyMapEntry>>(new Map())
  const [pickerSyms, setPickerSyms] = useState<Set<string>>(new Set())
  const [pickerSev, setPickerSev]   = useState<Severity>('mild')
  const [customInput, setCustomInput] = useState('')
  const customRef = useRef<HTMLTextAreaElement>(null)

  const visible  = DEFS.filter(d => d.views.includes(view))
  const colorMap = view === 'front' ? FRONT_MAP : BACK_MAP
  const groupKey = (r: BodyRegion) => colorMap[r]
  const baseFill   = (r: BodyRegion) => GROUPS[groupKey(r)].fill
  const baseStroke = (r: BodyRegion) => GROUPS[groupKey(r)].stroke

  const hitFill = (r: BodyRegion) => {
    if (selected === r) return 'rgba(155,114,248,0.28)'
    if (hovered === r)  return H_FILL
    const e = entries.get(r)
    return e ? SEV[e.severity].fill : 'transparent'
  }
  const hitStroke = (r: BodyRegion) => {
    if (selected === r) return '#a78bfa'
    if (hovered === r)  return H_STR
    const e = entries.get(r)
    return e ? SEV[e.severity].stroke : 'transparent'
  }

  const openPicker = (region: BodyRegion) => {
    setSelected(region)
    const ex = entries.get(region)
    setPickerSyms(new Set(ex?.symptoms ?? []))
    setPickerSev(ex?.severity ?? 'mild')
    setCustomInput('')
  }

  const save = () => {
    if (!selected || pickerSyms.size === 0) return
    const next = new Map(entries)
    next.set(selected, { region: selected, symptoms: [...pickerSyms], severity: pickerSev })
    setEntries(next)
    onChange([...next.values()])
    setSelected(null)
  }

  const remove = () => {
    if (!selected) return
    const next = new Map(entries)
    next.delete(selected)
    setEntries(next)
    onChange([...next.values()])
    setSelected(null)
  }

  const toggleSym = (s: string) => {
    const next = new Set(pickerSyms)
    next.has(s) ? next.delete(s) : next.add(s)
    setPickerSyms(next)
  }

  const addCustom = () => {
    const trimmed = customInput.trim().toLowerCase()
    if (!trimmed) return
    const next = new Set(pickerSyms)
    next.add(trimmed)
    setPickerSyms(next)
    setCustomInput('')
    customRef.current?.focus()
  }

  const renderShape = (def: RegionDef, base: boolean) => {
    const { region, shape } = def
    const key = `${base ? 'b' : 'h'}-${region}`
    const baseProps = { fill: baseFill(region), stroke: baseStroke(region), strokeWidth: 1 }
    const hitProps  = {
      fill: hitFill(region), stroke: hitStroke(region), strokeWidth: selected === region ? 2.5 : 2,
      style: { cursor: 'pointer', transition: 'fill 0.15s, stroke 0.15s' } as React.CSSProperties,
      onMouseEnter: () => setHovered(region),
      onMouseLeave: () => setHovered(null),
      onClick: () => openPicker(region),
    }
    const props = base ? baseProps : hitProps
    if (shape.k === 'e')
      return <ellipse key={key} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...props} />
    return <path key={key} d={shape.d} {...props} />
  }

  const viewGroups = [...new Set(Object.values(colorMap))]

  // custom symptoms are those not in the preset SYMPTOMS list
  const presetSet = selected ? new Set(SYMPTOMS[selected]) : new Set<string>()
  const allSelected   = [...pickerSyms]
  const customSelected = allSelected.filter(s => !presetSet.has(s))

  return (
    <div>
      {/* Front / Back toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        {(['front', 'back'] as View[]).map(v => (
          <button
            key={v}
            className={`btn ${view === v ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setView(v); setSelected(null) }}
            style={{ textTransform: 'capitalize', padding: '6px 18px', fontSize: 13 }}
          >
            {v} view
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          tap a region to log symptoms
        </span>
      </div>

      {/* ── Main layout: [SVG] [Picker panel] ─────────────────── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* Left: SVG + Legend */}
        <div style={{ flexShrink: 0 }}>
          {/* Hover badge — fixed height so the SVG never jumps */}
          <div style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            {hovered ? (
              <span key={hovered} style={{
                padding: '3px 16px', borderRadius: 999,
                background: 'linear-gradient(135deg, var(--accent), var(--pink))',
                color: '#fff', fontSize: 12, fontWeight: 700,
                boxShadow: '0 2px 10px rgba(155,114,248,0.35)',
                animation: 'scale-in 0.18s cubic-bezier(0.34,1.56,0.64,1) both',
                display: 'inline-block',
              }}>
                {LABELS[hovered]}
              </span>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.5 }}>hover a region</span>
            )}
          </div>

          <svg viewBox="0 0 200 458" style={{ width: 185, display: 'block' }}>
            {visible.map(d => renderShape(d, true))}
            {visible.map(d => renderShape(d, false))}
          </svg>

          {/* Legend */}
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {viewGroups.map(gk => (
              <div key={gk} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <div style={{
                  width: 11, height: 11, borderRadius: 3, flexShrink: 0,
                  background: GROUPS[gk].fill,
                  border: `1.5px solid ${GROUPS[gk].stroke}`,
                }} />
                <span style={{ color: 'var(--text-muted)' }}>{GROUPS[gk].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Picker panel */}
        <div style={{ flex: 1, minWidth: 220 }}>
          {selected ? (
            <div
              key={selected}
              className="animate-in"
              style={{
                background: 'var(--surface)',
                border: '1.5px solid var(--accent)',
                borderRadius: 14,
                padding: '16px',
                boxShadow: '0 0 24px rgba(155,114,248,0.12)',
              }}
            >
              {/* Picker header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: 3,
                    background: GROUPS[groupKey(selected)].fill,
                    border: `1.5px solid ${GROUPS[groupKey(selected)].stroke}`,
                  }} />
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{LABELS[selected]}</h4>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: 'none', border: 'none', fontSize: 18, cursor: 'pointer',
                    color: 'var(--text-muted)', lineHeight: 1, padding: '2px 6px',
                    borderRadius: 6, transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >×</button>
              </div>

              {/* Preset symptoms */}
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                What are you feeling?
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {SYMPTOMS[selected].map(sym => {
                  const on = pickerSyms.has(sym)
                  const g  = GROUPS[groupKey(selected)]
                  return (
                    <button
                      key={sym}
                      onClick={() => toggleSym(sym)}
                      style={{
                        padding: '5px 11px', borderRadius: 999,
                        border: `1px solid ${on ? g.stroke : 'var(--border)'}`,
                        background: on ? g.fill : 'transparent',
                        color: 'var(--text)',
                        fontSize: 12, fontWeight: on ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        transform: on ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      {sym}
                    </button>
                  )
                })}

                {/* Custom symptoms already added shown as removable pills */}
                {customSelected.map(sym => (
                  <button
                    key={sym}
                    onClick={() => toggleSym(sym)}
                    title="Click to remove"
                    style={{
                      padding: '5px 11px', borderRadius: 999,
                      border: '1px solid var(--pink)',
                      background: 'rgba(244,114,182,0.12)',
                      color: 'var(--text)',
                      fontSize: 12, fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {sym}
                    <span style={{ fontSize: 11, opacity: 0.7, lineHeight: 1 }}>×</span>
                  </button>
                ))}
              </div>

              {/* Custom symptom input */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                  Or describe in your own words
                </p>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <textarea
                    ref={customRef}
                    value={customInput}
                    rows={2}
                    onChange={e => {
                      setCustomInput(e.target.value)
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addCustom() }
                    }}
                    placeholder={'e.g. "sharp stabbing pain when I breathe deeply, worse at night" — Shift+Enter for new line'}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: 9,
                      border: '1px solid var(--border)', fontSize: 12,
                      background: 'var(--surface-alt)', color: 'var(--text)',
                      outline: 'none', fontFamily: 'inherit',
                      transition: 'border-color 0.2s',
                      resize: 'none', overflow: 'hidden', lineHeight: 1.55,
                      minHeight: 58,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--pink)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                  <button
                    onClick={addCustom}
                    disabled={!customInput.trim()}
                    style={{
                      padding: '9px 13px', borderRadius: 9, border: 'none', fontSize: 12,
                      background: customInput.trim() ? 'linear-gradient(135deg, var(--accent), var(--pink))' : 'var(--surface)',
                      color: customInput.trim() ? '#fff' : 'var(--text-muted)',
                      cursor: customInput.trim() ? 'pointer' : 'not-allowed',
                      fontWeight: 600, transition: 'all 0.2s', whiteSpace: 'nowrap',
                      flexShrink: 0, alignSelf: 'flex-start',
                    }}
                  >
                    + Add
                  </button>
                </div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, opacity: 0.6 }}>
                  Enter to add · Shift+Enter for new line
                </p>
              </div>

              {/* Severity */}
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                How severe?
              </p>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {(['mild', 'moderate', 'severe'] as Severity[]).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setPickerSev(sev)}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 9,
                      border: `1px solid ${pickerSev === sev ? SEV[sev].stroke : 'var(--border)'}`,
                      background: pickerSev === sev ? SEV[sev].fill : 'transparent',
                      color: pickerSev === sev ? SEV[sev].stroke : 'var(--text-muted)',
                      fontWeight: pickerSev === sev ? 700 : 400,
                      fontSize: 12, cursor: 'pointer',
                      textTransform: 'capitalize', transition: 'all 0.15s',
                      transform: pickerSev === sev ? 'scale(1.04)' : 'scale(1)',
                    }}
                  >
                    {SEV[sev].label}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary"
                  onClick={save}
                  disabled={pickerSyms.size === 0}
                  style={{
                    flex: 1, fontSize: 13, padding: '10px',
                    opacity: pickerSyms.size === 0 ? 0.35 : 1,
                    cursor: pickerSyms.size === 0 ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s, transform 0.1s',
                  }}
                >
                  Save
                </button>
                {entries.has(selected) && (
                  <button
                    className="btn btn-danger"
                    onClick={remove}
                    style={{ fontSize: 13, padding: '10px 16px' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Idle placeholder */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 12, minHeight: 200,
              border: '1.5px dashed var(--border)', borderRadius: 14,
              color: 'var(--text-muted)', textAlign: 'center', padding: 24,
              transition: 'border-color 0.3s',
            }}>
              <span style={{ fontSize: 36, opacity: 0.5 }}>👈</span>
              <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 160 }}>
                Tap any region on the body to describe what you feel there
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Logged entries strip below ──────────────────────────── */}
      {entries.size > 0 && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
            Logged — {entries.size} area{entries.size > 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[...entries.values()].map(entry => (
              <div
                key={entry.region}
                onClick={() => openPicker(entry.region)}
                className="animate-in"
                style={{
                  padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                  background: SEV[entry.severity].fill,
                  border: `1px solid ${SEV[entry.severity].stroke}`,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = `0 4px 16px ${SEV[entry.severity].stroke}44`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{LABELS[entry.region]}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 999,
                  background: 'transparent',
                  border: `1px solid ${SEV[entry.severity].stroke}`,
                  color: SEV[entry.severity].stroke,
                }}>{SEV[entry.severity].label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {entry.symptoms.slice(0, 2).join(', ')}{entry.symptoms.length > 2 ? ` +${entry.symptoms.length - 2}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
