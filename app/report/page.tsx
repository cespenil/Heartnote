'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RiskBadge } from '@/components/RiskBadge'
import { FaceAnnotation } from '@/components/FaceAnnotation'
import { ReportSkeleton } from '@/components/SkeletonLoader'
import { exportClinicalPDF } from '@/utils/exportPdf'
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

  const safeRisk = (['LOW','MODERATE','HIGH'] as const).includes(report.risk_level as never) ? report.risk_level : 'LOW'
  const rc  = { LOW: 'var(--risk-low)',        MODERATE: 'var(--risk-moderate)',        HIGH: 'var(--risk-high)'        }[safeRisk] ?? 'var(--risk-low)'
  const rbg = { LOW: 'var(--risk-low-bg)',     MODERATE: 'var(--risk-moderate-bg)',     HIGH: 'var(--risk-high-bg)'     }[safeRisk] ?? 'var(--risk-low-bg)'
  const rb  = { LOW: 'var(--risk-low-border)', MODERATE: 'var(--risk-moderate-border)', HIGH: 'var(--risk-high-border)' }[safeRisk] ?? 'var(--risk-low-border)'
  const faceSymptoms: string[] = Array.isArray(report.faceSymptoms) ? report.faceSymptoms.map(s => String(s).toLowerCase().trim()) : []

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
          onClick={() => exportClinicalPDF(report)}
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
                  const sevKey = f.severity.toLowerCase().replace(/[\[\]\s]/g, '') as keyof typeof SEV_COLOR
                  const sev = SEV_COLOR[sevKey] ?? SEV_COLOR.urgent
                  const sevLabel = sevKey.toUpperCase()
                  return (
                    <div key={i} style={{
                      padding: '10px 14px', borderRadius: 10,
                      background: sev.bg, border: `1px solid ${sev.border}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                          padding: '2px 8px', borderRadius: 999,
                          background: sev.text, color: '#fff',
                        }}>{sevLabel}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{f.flag}</div>
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

            {/* Face scan — always shown when photo was taken */}
            {faceImage && (
              <div className="card" style={{ borderLeft: '3px solid var(--pink)' }}>
                <SectionLabel icon="🔍" text={faceSymptoms.length > 0 ? 'Face Scan — Clinical Markers Detected' : 'Face Scan'} />
                <div style={{ marginTop: 12 }}>
                  <FaceAnnotation imageSrc={faceImage} symptoms={faceSymptoms} view="patient" />
                </div>
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

        {/* ── Doctor View — Paper Document ─────────────────────── */}
        {viewMode === 'doctor' && (() => {
          const s = report.soap_note
          const pRisk = { HIGH: '#dc2626', MODERATE: '#b45309', LOW: '#047857' }[report.risk_level]
          const pRiskBg = { HIGH: '#fef2f2', MODERATE: '#fffbeb', LOW: '#f0fdf4' }[report.risk_level]
          const pRiskBorder = { HIGH: '#fecaca', MODERATE: '#fde68a', LOW: '#bbf7d0' }[report.risk_level]
          const pSev = {
            warning:  { t: '#92400e', bg: '#fffbeb', b: '#fde68a' },
            urgent:   { t: '#9a3412', bg: '#fff7ed', b: '#fed7aa' },
            emergent: { t: '#991b1b', bg: '#fef2f2', b: '#fecaca' },
          }
          const pUrg = s?.plan?.urgency
          const pUrgColor = pUrg === 'emergent' ? '#dc2626' : pUrg === 'urgent' ? '#c2410c' : '#047857'
          const pUrgBg    = pUrg === 'emergent' ? '#fef2f2' : pUrg === 'urgent' ? '#fff7ed' : '#f0fdf4'
          const pUrgBdr   = pUrg === 'emergent' ? '#fecaca' : pUrg === 'urgent' ? '#fed7aa' : '#bbf7d0'

          return (
            <div className="animate-in">
              {/* Paper shell — always white regardless of app theme */}
              <div style={{
                background: '#ffffff', color: '#111827',
                border: '1px solid #9ca3af',
                boxShadow: '0 2px 20px rgba(0,0,0,0.18)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 13, lineHeight: 1.65,
              }}>

                {/* ── Letterhead ─────────────────────────────────── */}
                <div style={{ padding: '28px 36px 22px', borderBottom: '3px double #374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                    <div>
                      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.22em', color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>
                        Clinical Communication Aid — Not a Diagnosis
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1.5px', color: '#111827', lineHeight: 1 }}>HeartNote</div>
                      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#6b7280', marginTop: 6, letterSpacing: '0.04em' }}>
                        Postpartum Cardiovascular Assessment
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#6b7280', lineHeight: 2 }}>
                      <div>{new Date(report.generated_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      <div>{new Date(report.generated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                </div>

                {/* ── Risk + Urgency bar ──────────────────────────── */}
                <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: `1.5px solid ${pRiskBorder}` }}>
                  <div style={{ flex: 1, padding: '13px 36px', background: pRiskBg, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: pRisk, textTransform: 'uppercase' }}>Risk Level</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 20, fontWeight: 900, color: pRisk, letterSpacing: '0.04em' }}>{report.risk_level}</span>
                    <span style={{ width: 1, height: 22, background: pRiskBorder }} />
                    <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.55, maxWidth: 460 }}>{report.risk_explanation_plain}</span>
                  </div>
                  {pUrg && (
                    <div style={{ padding: '13px 24px', background: pUrgBg, borderLeft: `1.5px solid ${pUrgBdr}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: '#6b7280', textTransform: 'uppercase' }}>Urgency</span>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, fontWeight: 900, color: pUrgColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{pUrg}</span>
                    </div>
                  )}
                </div>

                {/* ── Red Flags ───────────────────────────────────── */}
                {report.red_flags?.length > 0 && (
                  <div style={{ padding: '16px 36px', borderBottom: '1.5px solid #d1d5db', background: '#fef2f2' }}>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#991b1b', marginBottom: 12 }}>
                      ⚠ Red Flags — Requires Clinical Attention
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {report.red_flags.map((f, i) => {
                        const scKey = f.severity.toLowerCase().replace(/[\[\]\s]/g, '') as keyof typeof pSev
                        const sc = pSev[scKey] ?? pSev.urgent
                        const scLabel = scKey.toUpperCase()
                        return (
                          <div key={i} style={{ padding: '10px 0', borderTop: i > 0 ? '1px solid #fecaca' : 'none' }}>
                            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', color: sc.t, marginBottom: 5 }}>
                              [{scLabel}]
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 4 }}>{f.flag}</div>
                            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{f.clinical_concern}</div>
                            {f.body_region && <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#9ca3af', marginTop: 4 }}>Region: {f.body_region}</div>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ── SOAP ────────────────────────────────────────── */}
                {s && (
                  <>
                    <PaperSection letter="S" title="SUBJECTIVE">
                      <PaperRow label="Chief Complaint" value={s.subjective.chief_complaint} strong />
                      <PaperRow label="History of Present Illness" value={s.subjective.history_of_present_illness} block />
                      <PaperRow label="Onset" value={s.subjective.symptom_onset} />
                      <PaperRow label="Aggravating Factors" value={s.subjective.aggravating_factors} />
                      <PaperRow label="Relieving Factors" value={s.subjective.relieving_factors} />
                      <PaperRow label="Postpartum Context" value={s.subjective.postpartum_context} />
                      {s.subjective.associated_symptoms?.length > 0 && (
                        <PaperRow label="Associated Symptoms" value={s.subjective.associated_symptoms.join(' · ')} />
                      )}
                    </PaperSection>

                    <PaperSection letter="O" title="OBJECTIVE">
                      <PaperRow label="Reported Vitals" value={s.objective.reported_vitals} />
                      <PaperRow label="Symptom Distribution" value={s.objective.symptom_distribution} />
                      {s.objective.body_map_findings?.length > 0 && (
                        <PaperRow label="Body Map Findings">
                          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {s.objective.body_map_findings.map((f, i) => (
                              <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.65 }}>{f}</li>
                            ))}
                          </ol>
                        </PaperRow>
                      )}
                      {faceImage && (
                        <PaperRow label="Face Scan Photo" block>
                          <div style={{ marginTop: 6, maxWidth: 320 }}>
                            <FaceAnnotation imageSrc={faceImage} symptoms={faceSymptoms} />
                          </div>
                          {s.objective.face_scan_findings?.length > 0 && (
                            <ul style={{ margin: '8px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                              {s.objective.face_scan_findings.map((f, i) => (
                                <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.65 }}>{f}</li>
                              ))}
                            </ul>
                          )}
                        </PaperRow>
                      )}
                    </PaperSection>

                    <PaperSection letter="A" title="ASSESSMENT">
                      <PaperRow label="Clinical Impression" value={s.assessment.clinical_impression} block />
                      <PaperRow label="Risk Rationale" value={s.assessment.risk_rationale} />
                      {s.assessment.differential_considerations?.length > 0 && (
                        <PaperRow label="Differential Considerations">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {s.assessment.differential_considerations.map((d, i) => (
                              <div key={i} style={{ paddingLeft: 14, borderLeft: '2px solid #d1d5db' }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{i + 1}. {d.condition}</div>
                                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 1.65 }}>{d.reasoning}</div>
                              </div>
                            ))}
                          </div>
                        </PaperRow>
                      )}
                      {s.assessment.symptom_risk_analysis?.length > 0 && (
                        <PaperRow label="Symptom Risk Analysis">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {s.assessment.symptom_risk_analysis.map((sym, i) => (
                              <div key={i} style={{ paddingLeft: 14, borderLeft: '2px solid #9ca3af' }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{sym.symptom}</div>
                                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 1.65 }}>{sym.cardiovascular_significance}</div>
                                {sym.associated_conditions?.length > 0 && (
                                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#9ca3af', marginTop: 4, fontStyle: 'italic' }}>
                                    Assoc.: {sym.associated_conditions.join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </PaperRow>
                      )}
                    </PaperSection>

                    <PaperSection letter="P" title="PLAN" last>
                      {s.plan.recommended_actions?.length > 0 && (
                        <PaperRow label="Recommended Actions">
                          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {s.plan.recommended_actions.map((a, i) => (
                              <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.65 }}>{a}</li>
                            ))}
                          </ol>
                        </PaperRow>
                      )}
                      {s.plan.questions_for_provider?.length > 0 && (
                        <PaperRow label="Questions for Provider">
                          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {s.plan.questions_for_provider.map((q, i) => (
                              <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.65 }}>{q}</li>
                            ))}
                          </ul>
                        </PaperRow>
                      )}
                      {s.plan.bring_to_appointment?.length > 0 && (
                        <PaperRow label="Bring to Appointment" value={s.plan.bring_to_appointment.join(', ')} />
                      )}
                    </PaperSection>
                  </>
                )}

                {/* ── Clinical Terms ──────────────────────────────── */}
                {report.clinical_terms_used?.length > 0 && (
                  <div style={{ padding: '16px 36px', borderTop: '1.5px solid #d1d5db' }}>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 10 }}>
                      Clinical Terminology Reference
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '4px 16px 8px 0', color: '#9ca3af', fontWeight: 700, letterSpacing: '0.1em', borderBottom: '1px solid #e5e7eb' }}>CLINICAL TERM</th>
                          <th style={{ textAlign: 'left', padding: '4px 0 8px', color: '#9ca3af', fontWeight: 700, letterSpacing: '0.1em', borderBottom: '1px solid #e5e7eb' }}>PLAIN LANGUAGE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.clinical_terms_used.map((term, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '7px 16px 7px 0', color: '#111827', fontWeight: 600 }}>{term.clinical_term}</td>
                            <td style={{ padding: '7px 0', color: '#6b7280' }}>{term.lay_term}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── Disclaimer ──────────────────────────────────── */}
                <div style={{ padding: '12px 36px', borderTop: '2px solid #d1d5db', background: '#f9fafb' }}>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 8.5, fontWeight: 700, letterSpacing: '0.16em', color: '#9ca3af', textTransform: 'uppercase', marginRight: 8 }}>Disclaimer</span>
                  <span style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.7 }}>{report.disclaimer}</span>
                </div>
              </div>
            </div>
          )
        })()}

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

// ── Paper document components (Doctor View) ───────────────────

function PaperSection({ letter, title, children, last }: {
  letter: string; title: string; children: React.ReactNode; last?: boolean
}) {
  return (
    <div style={{ padding: '18px 36px', borderTop: '1.5px solid #d1d5db' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 22, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{letter}</span>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: '#374151', textTransform: 'uppercase' }}>— {title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>{children}</div>
    </div>
  )
}

function PaperRow({ label, value, block, strong, children }: {
  label: string; value?: string | null; block?: boolean; strong?: boolean; children?: React.ReactNode
}) {
  const hasValue = value?.trim() || children
  if (!hasValue) return null
  const isBlock = block || !!children
  return (
    <div style={{
      display: 'flex', flexDirection: isBlock ? 'column' : 'row',
      gap: isBlock ? 5 : 0, padding: '9px 0', borderBottom: '1px dotted #e5e7eb',
    }}>
      <div style={{
        fontFamily: 'ui-monospace, monospace', fontSize: 9.5, fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7280',
        flexShrink: 0, minWidth: isBlock ? 'auto' : 172, paddingTop: isBlock ? 0 : 3,
      }}>{label}</div>
      <div style={{ fontSize: 13, color: '#1f2937', lineHeight: 1.75, fontWeight: strong ? 600 : 400 }}>
        {children ?? value}
      </div>
    </div>
  )
}
