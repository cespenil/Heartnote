'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RiskBadge } from '@/components/RiskBadge'
import { FaceAnnotation } from '@/components/FaceAnnotation'
import { ReportSkeleton } from '@/components/SkeletonLoader'
import { exportReportAsPDF } from '@/utils/exportPdf'
import type { ReportResponse, FaceSymptom } from '@/lib/schema'

type ViewMode = 'patient' | 'doctor'

const SEV_COLOR = {
  warning:  { text: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.28)'  },
  urgent:   { text: '#fb923c', bg: 'rgba(251,146,60,0.10)',  border: 'rgba(251,146,60,0.28)'  },
  emergent: { text: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.28)' },
}

export default function ReportPage() {
  const router = useRouter()
  const [report, setReport]           = useState<ReportResponse | null>(null)
  const [faceImage, setFaceImage]     = useState<string | null>(null)
  const [viewMode, setViewMode]       = useState<ViewMode>('patient')
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('heartnote_report')
      if (!raw) { router.replace('/'); return }
      setReport(JSON.parse(raw) as ReportResponse)
      const img = sessionStorage.getItem('heartnote_face_image')
      if (img) setFaceImage(img)
    } catch {
      router.replace('/')
    } finally {
      setLoading(false)
    }
  }, [router])

  const startNew = () => {
    sessionStorage.removeItem('heartnote_report')
    sessionStorage.removeItem('heartnote_face_image')
    router.push('/')
  }

  if (loading || !report) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
        <ReportSkeleton />
      </div>
    )
  }

  const rc  = { LOW: 'var(--risk-low)',        MODERATE: 'var(--risk-moderate)',        HIGH: 'var(--risk-high)'        }[report.risk_level]
  const rbg = { LOW: 'var(--risk-low-bg)',     MODERATE: 'var(--risk-moderate-bg)',     HIGH: 'var(--risk-high-bg)'     }[report.risk_level]
  const rb  = { LOW: 'var(--risk-low-border)', MODERATE: 'var(--risk-moderate-border)', HIGH: 'var(--risk-high-border)' }[report.risk_level]
  const faceSymptoms: FaceSymptom[] = Array.isArray(report.faceSymptoms) ? report.faceSymptoms as unknown as FaceSymptom[] : []

  return (
    <div style={{ minHeight: 'calc(100vh - 58px)', paddingBottom: 40 }}>
      {/* ── Sticky footer action bar ─────────────────────────── */}
      <div style={{
        position: 'sticky', top: 58, zIndex: 40,
        background: 'var(--nav-bg)', backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border)',
        padding: '10px 28px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {/* Patient / Doctor toggle */}
        <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 10, padding: 3, gap: 2 }}>
          {(['patient', 'doctor'] as ViewMode[]).map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: viewMode === m ? 'linear-gradient(135deg, var(--accent), var(--pink))' : 'transparent',
              color: viewMode === m ? '#fff' : 'var(--text-muted)',
              fontWeight: viewMode === m ? 700 : 400, fontSize: 13,
              transition: 'all 0.2s', textTransform: 'capitalize',
            }}>
              {m === 'patient' ? '👤 Patient View' : '🩺 Doctor View'}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <button
          className="btn btn-secondary"
          onClick={startNew}
          style={{ fontSize: 13 }}
        >
          ← New Assessment
        </button>
        <button
          className="btn btn-primary"
          onClick={() => exportReportAsPDF({ elementId: 'report-root', filename: 'heartnote-report.pdf' })}
          style={{ fontSize: 13 }}
        >
          Export PDF
        </button>
      </div>

      {/* ── Report content ────────────────────────────────────── */}
      <div id="report-root" className="animate-in" style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>

        {/* Risk header */}
        <div className="animate-scale-in" style={{
          textAlign: 'center', padding: '32px 24px', borderRadius: 20, marginBottom: 28,
          background: rbg, border: `1.5px solid ${rb}`, backdropFilter: 'blur(20px)',
        }}>
          <RiskBadge level={report.risk_level} size="lg" />
          <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.75, color: 'var(--text)', maxWidth: 500, margin: '14px auto 0' }}>
            {report.risk_explanation_plain}
          </p>
        </div>

        {/* Red flags — always shown when present, regardless of view */}
        {report.red_flags?.length > 0 && (
          <div className="animate-in" style={{ marginBottom: 24, animationDelay: '60ms' }}>
            <div style={{
              padding: '18px 20px', borderRadius: 16,
              background: 'var(--risk-high-bg)', border: '1.5px solid var(--risk-high-border)',
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--risk-high)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚠</span> Red Flags — seek care promptly
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {report.red_flags.map((f, i) => {
                  const sev = SEV_COLOR[f.severity] ?? SEV_COLOR.warning
                  return (
                    <div key={i} style={{
                      padding: '10px 14px', borderRadius: 10,
                      background: sev.bg, border: `1px solid ${sev.border}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                          padding: '2px 8px', borderRadius: 999,
                          background: sev.bg, border: `1px solid ${sev.border}`,
                          color: sev.text, textTransform: 'uppercase',
                        }}>{f.severity}</span>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{f.flag}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>{f.clinical_concern}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Patient View ─────────────────────────────────────── */}
        {viewMode === 'patient' && (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Summary */}
            <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
              <SectionLabel icon="📋" text="Summary" />
              <p style={{ fontSize: 14, lineHeight: 1.85, color: 'var(--text-muted)', marginTop: 10 }}>{report.patient_summary}</p>
            </div>

            {/* What to do now */}
            <div className="card" style={{ borderLeft: '3px solid var(--pink)' }}>
              <SectionLabel icon="✅" text="What to do now" />
              <ol style={{ paddingLeft: 0, listStyle: 'none', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {report.what_to_do_now.map((action, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.65 }}>
                    <span style={{
                      minWidth: 26, height: 26, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent), var(--pink))',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, flexShrink: 0, marginTop: 1,
                    }}>{i + 1}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{action}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Warning signs */}
            {report.warning_signs_to_watch?.length > 0 && (
              <div style={{
                padding: '18px 20px', borderRadius: 16,
                background: 'var(--risk-moderate-bg)', border: '1px solid var(--risk-moderate-border)',
              }}>
                <SectionLabel icon="👀" text="Watch for these warning signs" />
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {report.warning_signs_to_watch.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                      <span style={{ color: 'var(--risk-moderate)', fontWeight: 700 }}>•</span>{s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Face scan findings */}
            {faceImage && faceSymptoms.length > 0 && (
              <div className="card" style={{ borderLeft: '3px solid var(--pink)' }}>
                <SectionLabel icon="🔍" text="Face Scan Findings" />
                <div style={{ marginTop: 12 }}>
                  <FaceAnnotation imageSrc={faceImage} symptoms={faceSymptoms} />
                </div>
              </div>
            )}
            {faceImage && faceSymptoms.length === 0 && (
              <div className="card" style={{ borderLeft: '3px solid var(--border)' }}>
                <SectionLabel icon="📷" text="Face Scan" />
                <p style={{ marginTop: 10, fontSize: 14, color: 'var(--text-muted)' }}>
                  No visible facial symptoms were detected.
                </p>
              </div>
            )}

            {/* Symptom explanations */}
            {report.symptom_plain_explanations?.length > 0 && (
              <div className="card" style={{ borderLeft: '3px solid #a78bfa' }}>
                <SectionLabel icon="💡" text="Understanding your symptoms" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
                  {report.symptom_plain_explanations.map((s, i) => (
                    <div key={i} style={{ paddingLeft: 14, borderLeft: `2px solid ${rc}` }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{s.symptom}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.6 }}>{s.plain_explanation}</div>
                      {s.why_it_matters && (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic', lineHeight: 1.5, opacity: 0.8 }}>
                          Why it matters: {s.why_it_matters}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Doctor View ──────────────────────────────────────── */}
        {viewMode === 'doctor' && (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div style={{
              padding: '12px 16px', borderRadius: 12,
              background: 'rgba(155,114,248,0.08)', border: '1px solid rgba(155,114,248,0.2)',
              fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
            }}>
              🩺 Clinical view — intended to be shared with your healthcare provider
            </div>

            {/* SOAP Note */}
            {report.soap_note && (
              <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
                <SectionLabel icon="📄" text="SOAP Note" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 18 }}>
                  {[
                    {
                      label: 'Subjective',
                      content: [
                        report.soap_note.subjective.chief_complaint,
                        report.soap_note.subjective.history_of_present_illness,
                      ].filter(Boolean).join('\n\n'),
                    },
                    {
                      label: 'Objective',
                      content: [
                        ...(report.soap_note.objective.body_map_findings ?? []),
                        ...(report.soap_note.objective.face_scan_findings ?? []),
                      ].join('\n'),
                    },
                    {
                      label: 'Assessment',
                      content: [
                        report.soap_note.assessment.clinical_impression,
                        report.soap_note.assessment.risk_rationale,
                      ].filter(Boolean).join('\n\n'),
                    },
                    {
                      label: 'Plan',
                      content: (report.soap_note.plan.recommended_actions ?? []).join('\n'),
                    },
                  ].filter(s => s.content).map(({ label, content }) => (
                    <div key={label} style={{
                      padding: '14px 16px', borderRadius: 12,
                      background: 'var(--surface-alt)', border: '1px solid var(--border)',
                    }}>
                      <div style={{
                        fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 8,
                      }}>{label}</div>
                      <div style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                        {content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clinical terms glossary */}
            {report.clinical_terms_used?.length > 0 && (
              <div className="card" style={{ borderLeft: '3px solid #a78bfa' }}>
                <SectionLabel icon="📖" text="Clinical terms used" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                  {report.clinical_terms_used.map((term, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline', fontSize: 14 }}>
                      <span style={{ color: 'var(--text)', fontWeight: 600, minWidth: 140 }}>{term.clinical_term}</span>
                      <span style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>— {term.lay_term}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw risk data */}
            <div className="card" style={{ borderLeft: '3px solid var(--pink)' }}>
              <SectionLabel icon="📊" text="Risk assessment" />
              <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75 }}>
                <strong style={{ color: 'var(--text)' }}>Level: </strong>{report.risk_level}<br />
                {report.risk_explanation_plain}
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{
          marginTop: 24, padding: '14px 18px', borderRadius: 12,
          background: 'var(--surface)', border: '1px solid var(--border)',
          fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.65,
        }}>
          <strong style={{ color: 'var(--text)' }}>Disclaimer: </strong>{report.disclaimer}
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', opacity: 0.5 }}>
          Generated {new Date(report.generated_at).toLocaleString()}
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: 'rgba(155,114,248,0.12)', border: '1px solid rgba(155,114,248,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
      }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{text}</span>
    </div>
  )
}
