import { useState } from 'react'

interface Symptom {
  id: string
  label: string
  clinical: string
  redFlag?: boolean
}

const SYMPTOMS: Symptom[] = [
  { id: 'periorbital_edema',     label: 'Puffiness or swelling around eyes',              clinical: 'periorbital edema',             redFlag: true  },
  { id: 'facial_edema',          label: 'General face or jaw swelling',                   clinical: 'facial edema',                  redFlag: true  },
  { id: 'facial_flushing',       label: 'Face feels hot or looks flushed / red',          clinical: 'facial flushing / erythema'                    },
  { id: 'pallor',                label: 'Unusual paleness of face, lips, or gums',        clinical: 'pallor',                        redFlag: true  },
  { id: 'jaundice',              label: 'Yellowing of skin or whites of eyes',            clinical: 'jaundice / icterus',            redFlag: true  },
  { id: 'visual_changes',        label: 'Blurry vision, spots, or tunnel vision',         clinical: 'visual disturbances',           redFlag: true  },
  { id: 'facial_numbness',       label: 'Numbness or tingling in face',                   clinical: 'facial paresthesia',            redFlag: true  },
  { id: 'headache_severe',       label: 'Severe headache (not relieved by Tylenol)',      clinical: 'severe cephalgia',              redFlag: true  },
  { id: 'diaphoresis',           label: 'Sweating excessively on face/forehead',          clinical: 'diaphoresis'                                   },
  { id: 'lip_cyanosis',          label: 'Blue or purple tint to lips or fingertips',      clinical: 'cyanosis',                      redFlag: true  },
]

export interface FaceSymptomResult {
  selected: string[]
  clinicalMarkers: string[]
  hasRedFlags: boolean
}

interface FaceSymptomChecklistProps {
  onChange: (result: FaceSymptomResult) => void
}

export function FaceSymptomChecklist({ onChange }: FaceSymptomChecklistProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    const next = new Set(checked)
    next.has(id) ? next.delete(id) : next.add(id)
    setChecked(next)

    const selected = SYMPTOMS.filter(s => next.has(s.id))
    onChange({
      selected:       selected.map(s => s.label),
      clinicalMarkers: selected.map(s => s.clinical),
      hasRedFlags:    selected.some(s => s.redFlag),
    })
  }

  const redFlagCount = SYMPTOMS.filter(s => checked.has(s.id) && s.redFlag).length

  return (
    <div className="card animate-in" style={{ maxWidth: 480 }}>
      <h3 style={{ marginBottom: 4, fontSize: 18 }}>Visible Face Symptoms</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
        Check everything you notice right now — even if mild.
      </p>

      {redFlagCount > 0 && (
        <div style={{
          background: 'var(--risk-high-bg)',
          border: '1px solid var(--risk-high-border)',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: 13,
          color: 'var(--risk-high)',
          fontWeight: 600,
        }}>
          ⚠ {redFlagCount} potential red flag{redFlagCount > 1 ? 's' : ''} selected
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SYMPTOMS.map(symptom => {
          const isChecked = checked.has(symptom.id)
          return (
            <label
              key={symptom.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${isChecked ? (symptom.redFlag ? 'var(--risk-high-border)' : 'var(--risk-low-border)') : 'var(--border)'}`,
                background: isChecked ? (symptom.redFlag ? 'var(--risk-high-bg)' : 'var(--risk-low-bg)') : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(symptom.id)}
                style={{ marginTop: 2, width: 16, height: 16, accentColor: symptom.redFlag ? 'var(--risk-high)' : 'var(--risk-low)' }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {symptom.redFlag && <span style={{ color: 'var(--risk-high)', marginRight: 4 }}>⚠</span>}
                  {symptom.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Clinical: {symptom.clinical}
                </div>
              </div>
            </label>
          )
        })}
      </div>

      {checked.size === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 16 }}>
          No symptoms selected — check all that apply
        </p>
      )}
    </div>
  )
}
