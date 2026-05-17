'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { WebcamCapture } from '@/components/WebcamCapture'
import { BodyMap } from '@/components/BodyMap'
import { FaceAnnotation } from '@/components/FaceAnnotation'
import { ReportSkeleton } from '@/components/SkeletonLoader'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import type { BodyMapEntry } from '@/components/BodyMap'

type Step = 'intro' | 'describe' | 'context' | 'bodymap' | 'face' | 'generating'

const PRIOR_CONDITIONS = [
  'Hypertension', 'Diabetes', 'Preeclampsia (prior pregnancy)',
  'Heart disease', 'Anxiety / depression', 'Thyroid disorder',
]

const STEP_INFO: Partial<Record<Step, { num: number; label: string }>> = {
  describe: { num: 1, label: 'How you feel'     },
  context:  { num: 2, label: 'Your situation'   },
  bodymap:  { num: 3, label: 'Body map'          },
  face:     { num: 4, label: 'Face scan'         },
}
const TOTAL = 4

export default function Home() {
  const router = useRouter()
  const [step, setStep]                       = useState<Step>('intro')
  const [voiceInput, setVoiceInput]           = useState('')
  const [daysPostpartum, setDaysPostpartum]   = useState('')
  const [priorConditions, setPriorConditions] = useState<string[]>([])
  const [bodyEntries, setBodyEntries]         = useState<BodyMapEntry[]>([])
  const [capturedImage, setCapturedImage]     = useState<string | null>(null)
  const [error, setError]                     = useState<string | null>(null)
  const [isListening, setIsListening]         = useState(false)
  const recognitionRef                        = useRef<any>(null)

  const hasSpeechSupport = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const r = new SR()
    r.continuous = true
    r.interimResults = false
    r.lang = 'en-US'
    r.onresult = (e: any) => {
      const text = Array.from(e.results as any[])
        .filter((res: any) => res.isFinal)
        .map((res: any) => res[0].transcript)
        .join(' ')
      if (text) setVoiceInput(prev => prev + (prev.trim() ? ' ' : '') + text)
    }
    r.onerror = () => setIsListening(false)
    r.onend   = () => setIsListening(false)
    r.start()
    recognitionRef.current = r
    setIsListening(true)
  }

  const toggleCondition = (c: string) =>
    setPriorConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const generateReport = async (skipFace: boolean) => {
    console.log('🚀 [generateReport] Starting...', { skipFace, voiceWords: voiceInput.trim().split(/\s+/).length, bodyRegions: bodyEntries.map(e => e.region), hasFaceImage: !!capturedImage })
    setStep('generating')
    setError(null)
    const timeout = setTimeout(() => {
      console.warn('⏰ [generateReport] 30s timeout hit')
      setError('This is taking longer than expected — please try again.')
      setStep('describe')
    }, 30_000)
    try {
      const hasImage = !!capturedImage && !skipFace
      const body = {
        voice_input: voiceInput.trim(),
        body_map: bodyEntries,
        face_scan: { facial_edema: false, periorbital_edema: false, pallor: false, facial_asymmetry: false, scan_available: hasImage },
        ...(hasImage && { face_image_base64: capturedImage!.replace(/^data:image\/\w+;base64,/, '') }),
        ...(daysPostpartum && { days_postpartum: parseInt(daysPostpartum) }),
        prior_conditions: priorConditions,
      }
      console.log('📤 [generateReport] Sending to /api/generate-report', { hasImage, bodyMapCount: bodyEntries.length, priorConditions })
      const res = await fetch('/api/generate-report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      clearTimeout(timeout)
      console.log('📥 [generateReport] Response status:', res.status, res.statusText)
      if (!res.ok) {
        const err = await res.json()
        console.error('❌ [generateReport] API error response:', err)
        throw new Error(err.error || 'Failed to generate report.')
      }
      const data = await res.json()
      console.log('✅ [generateReport] Success:', { risk_level: data.risk_level, red_flags: data.red_flags?.length ?? 0 })
      sessionStorage.setItem('heartnote_report', JSON.stringify(data))
      if (hasImage && capturedImage) sessionStorage.setItem('heartnote_face_image', capturedImage)
      else sessionStorage.removeItem('heartnote_face_image')
      console.log('➡️ [generateReport] Navigating to /report')
      router.push('/report')
    } catch (e) {
      clearTimeout(timeout)
      console.error('💥 [generateReport] Caught error:', e)
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setStep('describe')
    }
  }

  const restart = () => {
    setStep('intro'); setVoiceInput(''); setDaysPostpartum(''); setPriorConditions([])
    setBodyEntries([]); setCapturedImage(null); setError(null)
  }

  // ── 1. Intro ──────────────────────────────────────────────────
  if (step === 'intro') return (
    <Screen>
      <div className="animate-in" style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px',
      }}>
        {/* Heart */}
        <div style={{
          width: 130, height: 130, borderRadius: '50%', marginBottom: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(circle at 40% 38%, rgba(244,114,182,0.22), rgba(139,92,246,0.12))',
          border: '1px solid rgba(244,114,182,0.22)',
          animation: 'glow-pulse 3.2s ease-in-out infinite',
        }}>
          <svg width="66" height="62" viewBox="0 0 66 62" fill="none"
            style={{ animation: 'heartbeat 2.4s ease-in-out infinite', filter: 'drop-shadow(0 4px 18px rgba(244,114,182,0.45))' }}>
            <path d="M33 57C33 57 4 38 4 19C4 10.2 11 4 19.5 4C24.5 4 29 6.5 33 11C37 6.5 41.5 4 46.5 4C55 4 62 10.2 62 19C62 38 33 57 33 57Z" fill="url(#hg)" />
            <ellipse cx="22" cy="15" rx="7" ry="4.5" fill="rgba(255,255,255,0.32)" transform="rotate(-25 22 15)" />
            <circle cx="17" cy="21" r="2" fill="rgba(255,255,255,0.18)" />
            <defs>
              <linearGradient id="hg" x1="4" y1="4" x2="62" y2="57" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fda4d4" /><stop offset="45%" stopColor="#ec4899" /><stop offset="100%" stopColor="#9333ea" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 style={{
          fontSize: 54, fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: 16,
          background: 'linear-gradient(130deg, var(--text) 35%, #c084fc 70%, #f472b6 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>HeartNote</h1>

        <p style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 480, lineHeight: 1.7, marginBottom: 10 }}>
          A safe space to document how you&apos;re feeling after delivery — and get a clinical summary to share with your doctor.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.7, marginBottom: 40, opacity: 0.7 }}>
          Takes about 3 minutes. Your data is never stored.
        </p>

        <div className="stagger" style={{ display: 'flex', gap: 8, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['💬','Describe symptoms'],['🫀','Body map'],['📷','Face scan'],['📄','AI report']].map(([icon, label]) => (
            <span key={label} className="lift" style={{
              padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500,
              background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'default',
            }}><span>{icon}</span>{label}</span>
          ))}
        </div>

        <button className="btn btn-primary" style={{ fontSize: 16, padding: '15px 52px', borderRadius: 14 }}
          onClick={() => setStep('describe')}>
          Get Started
        </button>
        <p style={{ marginTop: 18, fontSize: 12, color: 'var(--text-muted)', opacity: 0.55 }}>
          Not a substitute for medical advice · Emergency? Call 911
        </p>
      </div>
    </Screen>
  )

  // ── 2. Describe ───────────────────────────────────────────────
  if (step === 'describe') return (
    <Screen
      progress={{ num: 1, total: TOTAL, label: STEP_INFO.describe!.label }}
      footer={
        <NavBar
          onBack={() => setStep('intro')}
          onNext={() => setStep('context')}
          nextDisabled={voiceInput.trim().length === 0}
          nextLabel="Continue"
        />
      }
    >
      <div className="animate-in-left" style={{ maxWidth: 1060, margin: '0 auto', padding: '48px 24px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <StepHeading
            eyebrow="Step 1 of 4"
            title="How are you feeling today?"
            subtitle="Describe your symptoms in your own words — as much or as little as you'd like."
          />

          {error && <ErrorBanner message={error} />}

          <div style={{ position: 'relative' }}>
            <textarea
              value={voiceInput}
              onChange={e => setVoiceInput(e.target.value)}
              placeholder="For example: I've had a throbbing headache for two days, my ankles are swollen, and I feel short of breath when I walk up the stairs..."
              rows={8}
              autoFocus
              style={{
                width: '100%', padding: '18px', paddingRight: 58, borderRadius: 14,
                border: '1.5px solid var(--border)', fontSize: 16, lineHeight: 1.7,
                resize: 'none', fontFamily: 'inherit', color: 'var(--text)',
                background: 'var(--surface)', outline: 'none',
                transition: 'border-color 0.2s', boxShadow: 'var(--shadow)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
            {/* Mic button */}
            <button
              onClick={toggleListening}
              disabled={!hasSpeechSupport}
              title={!hasSpeechSupport ? 'Speech input not supported in this browser' : isListening ? 'Stop recording' : 'Start voice input'}
              style={{
                position: 'absolute', top: 12, right: 12,
                width: 38, height: 38, borderRadius: '50%', border: 'none',
                background: isListening
                  ? 'linear-gradient(135deg, #f87171, #ef4444)'
                  : 'var(--surface)',
                border: `1px solid ${isListening ? 'transparent' : 'var(--border)'}`,
                color: isListening ? '#fff' : hasSpeechSupport ? 'var(--text-muted)' : 'var(--border)',
                cursor: hasSpeechSupport ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                animation: isListening ? 'pulse-ring 1.5s ease-in-out infinite' : 'none',
                flexShrink: 0,
              } as React.CSSProperties}
            >
              {isListening ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-2 4v6a2 2 0 0 0 4 0V5a2 2 0 0 0-4 0zM7 11a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.92V21h-2v-3.08A7 7 0 0 1 5 11z" />
                </svg>
              )}
            </button>
          </div>
          <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {isListening
              ? <><span style={{ color: '#f87171', fontWeight: 600 }}>● Recording…</span> speak now, click the mic to stop</>
              : voiceInput.trim().length === 0
                ? 'Please describe at least one symptom to continue.'
                : `✓ ${voiceInput.trim().split(/\s+/).length} words — looks good!`}
          </p>
        </div>

        <div className="side-col">
          <SideCard icon="💡" title="What to mention" items={[
            { label: 'When it started', desc: 'Onset date or how many days ago' },
            { label: 'Intensity', desc: 'Rate 1–10, or mild / severe' },
            { label: 'Triggers', desc: 'What makes it better or worse' },
            { label: 'Pattern', desc: 'Constant, comes and goes, or only at rest' },
          ]} delay={120} />
          <SideCard icon="🚨" title="Urgent symptoms" style={{ marginTop: 12 }} items={[
            { label: 'Chest pain or pressure' },
            { label: 'Sudden shortness of breath' },
            { label: 'Severe headache or vision changes' },
            { label: 'Call 911 immediately for these', isWarning: true },
          ]} delay={200} />
        </div>
      </div>
    </Screen>
  )

  // ── 3. Context ────────────────────────────────────────────────
  if (step === 'context') return (
    <Screen
      progress={{ num: 2, total: TOTAL, label: STEP_INFO.context!.label }}
      footer={<NavBar onBack={() => setStep('describe')} onNext={() => setStep('bodymap')} nextLabel="Continue" />}
    >
      <div className="animate-in-right" style={{ maxWidth: 1060, margin: '0 auto', padding: '48px 24px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <StepHeading
            eyebrow="Step 2 of 4"
            title="A little about your situation"
            subtitle="This helps the AI understand your postpartum context. All fields are optional."
          />

          {/* Days postpartum */}
          <div className="card animate-in" style={{ marginBottom: 20, borderLeft: '3px solid var(--pink)', animationDelay: '80ms' }}>
            <Label icon="📅" text="How many days ago did you deliver?" />
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="number" min={0} value={daysPostpartum}
                onChange={e => setDaysPostpartum(e.target.value)}
                placeholder="e.g. 14"
                style={{
                  width: 110, padding: '12px 14px', borderRadius: 10, fontSize: 18, fontWeight: 600,
                  border: '1.5px solid var(--border)', fontFamily: 'inherit',
                  color: 'var(--text)', background: 'var(--surface)', outline: 'none', textAlign: 'center',
                }}
              />
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>days postpartum</span>
            </div>
          </div>

          {/* Prior conditions */}
          <div className="card animate-in" style={{ borderLeft: '3px solid var(--accent)', animationDelay: '160ms' }}>
            <Label icon="🩺" text="Do you have any of these prior conditions?" />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 16 }}>Select all that apply</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PRIOR_CONDITIONS.map(c => {
                const on = priorConditions.includes(c)
                return (
                  <button key={c} onClick={() => toggleCondition(c)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', borderRadius: 10, textAlign: 'left',
                    border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                    background: on ? 'rgba(155,114,248,0.12)' : 'var(--surface)',
                    color: 'var(--text)', cursor: 'pointer',
                    transition: 'all 0.18s, transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
                    fontSize: 14,
                    transform: on ? 'translateX(4px)' : 'translateX(0)',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      border: `2px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                      background: on ? 'var(--accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {on && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                    </div>
                    {c}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="side-col">
          <SideCard icon="📊" title="Why timing matters" items={[
            { label: 'Weeks 1–2', desc: 'Highest risk for hemorrhage and infection' },
            { label: 'Weeks 2–6', desc: 'Peak cardiovascular risk window' },
            { label: 'After 6 weeks', desc: 'Risk declines but monitoring still important' },
          ]} delay={120} />
          <SideCard icon="🩺" title="Prior conditions" style={{ marginTop: 12 }} items={[
            { label: 'Compound risk', desc: 'Pre-existing hypertension or diabetes significantly raises postpartum cardiovascular risk' },
            { label: 'Preeclampsia history', desc: 'Raises lifetime heart disease risk — worth tracking at every visit' },
          ]} delay={200} />
        </div>
      </div>
    </Screen>
  )

  // ── 4. Body map ───────────────────────────────────────────────
  if (step === 'bodymap') return (
    <Screen
      progress={{ num: 3, total: TOTAL, label: STEP_INFO.bodymap!.label }}
      footer={<NavBar onBack={() => setStep('context')} onNext={() => setStep('face')} nextLabel="Continue" />}
    >
      <div className="animate-in-left" style={{ maxWidth: 1060, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <StepHeading
            eyebrow="Step 3 of 4"
            title="Where are you experiencing symptoms?"
            subtitle="Tap any area on the body to describe what you feel there. You can mark multiple areas."
          />
          <div className="card" style={{ borderLeft: '3px solid var(--pink)' }}>
            <BodyMap onChange={setBodyEntries} />
          </div>
          {bodyEntries.length > 0 && (
            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--risk-low)', fontWeight: 600 }}>
              ✓ {bodyEntries.length} area{bodyEntries.length > 1 ? 's' : ''} marked
            </p>
          )}
        </div>

        <div className="side-col">
          <SideCard icon="🫀" title="Postpartum hotspots" items={[
            { label: 'Chest', desc: 'Palpitations, tightness, or shortness of breath can signal cardiac stress' },
            { label: 'Lower legs', desc: 'Warmth, redness, or swelling may indicate a blood clot (DVT)' },
            { label: 'Head & face', desc: 'Severe headache or facial swelling can indicate high blood pressure' },
            { label: 'Abdomen', desc: 'Pelvic pain or unusual cramping warrants monitoring' },
          ]} delay={80} />
          <SideCard icon="✏️" title="Tips" style={{ marginTop: 12 }} items={[
            { label: 'Be thorough', desc: 'Mark every area you have concerns about, even minor ones' },
            { label: 'Use custom input', desc: 'If your symptom isn\'t listed, type it yourself in the picker' },
            { label: 'Switch views', desc: 'Use Front / Back toggle for back pain or shoulder issues' },
          ]} delay={160} />
        </div>
      </div>
    </Screen>
  )

  // ── 5. Face scan ──────────────────────────────────────────────
  if (step === 'face') return (
    <Screen
      progress={{ num: 4, total: TOTAL, label: STEP_INFO.face!.label }}
      footer={
        <NavBar
          onBack={() => setStep('bodymap')}
          onNext={() => generateReport(false)}
          nextDisabled={!capturedImage}
          nextLabel="Generate My Report"
          skipLabel="Skip — generate without photo"
          onSkip={() => generateReport(true)}
        />
      }
    >
      <div className="animate-in-right" style={{ maxWidth: 1060, margin: '0 auto', padding: '48px 24px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <StepHeading
            eyebrow="Step 4 of 4"
            title="Optional: Face scan"
            subtitle="A quick photo lets our AI check for visible signs like swelling or paleness. Your photo is never saved or stored."
          />

          <div className="card" style={{ borderLeft: '3px solid var(--pink)' }}>
            {!capturedImage ? (
              <WebcamCapture onCapture={img => setCapturedImage(img)} />
            ) : (
              <div>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--risk-low)' }}>
                    ✓ Photo captured — running face analysis…
                  </div>
                  <button
                    onClick={() => setCapturedImage(null)}
                    style={{
                      background: 'none', border: '1px solid var(--border)', borderRadius: 8,
                      color: 'var(--text-muted)', fontSize: 12, padding: '4px 10px', cursor: 'pointer',
                    }}
                  >
                    Retake
                  </button>
                </div>
                <FaceAnnotation imageSrc={capturedImage} symptoms={[]} />
              </div>
            )}
          </div>
        </div>

        <div className="side-col">
          <SideCard icon="🔍" title="What AI looks for" items={[
            { label: 'Periorbital edema', desc: 'Puffiness or swelling under and around the eyes' },
            { label: 'Pallor', desc: 'Unusual paleness that may suggest low blood pressure or anemia' },
            { label: 'Facial asymmetry', desc: 'One-sided drooping or weakness can be a neurological sign' },
            { label: 'Skin tone changes', desc: 'Unusual flushing or mottling of the face' },
          ]} delay={80} />
          <SideCard icon="🔒" title="Your privacy" style={{ marginTop: 12 }} items={[
            { label: 'Never stored', desc: 'Your photo is processed in memory and discarded immediately — never saved to any server' },
            { label: 'Optional', desc: 'The report is just as complete if you skip the photo' },
          ]} delay={160} />
        </div>
      </div>
    </Screen>
  )

  // ── 6. Generating ─────────────────────────────────────────────
  if (step === 'generating') return (
    <Screen>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <LoadingOverlay visible message="Analyzing your symptoms…" subtext="This usually takes 10–20 seconds." />
        <div style={{ maxWidth: 560, width: '100%' }}>
          <ReportSkeleton />
        </div>
      </div>
    </Screen>
  )

  return null
}

// ── Layout shell ──────────────────────────────────────────────

function Screen({ children, progress, footer }: {
  children: React.ReactNode
  progress?: { num: number; total: number; label: string }
  footer?: React.ReactNode
}) {
  return (
    <div style={{ height: 'calc(100vh - 58px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {progress && (
        <div style={{
          flexShrink: 0, padding: '18px 28px 0',
          background: 'transparent',
        }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            {/* Step label row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{progress.label}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', opacity: 0.6 }}>{progress.num} / {progress.total}</span>
            </div>
            {/* Progress track */}
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, transition: 'width 0.4s ease',
                width: `${(progress.num / progress.total) * 100}%`,
                background: 'linear-gradient(90deg, var(--accent), var(--pink))',
                boxShadow: '0 0 10px var(--pink-glow)',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Scrollable content area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>

      {/* Fixed bottom nav */}
      {footer && (
        <div style={{
          flexShrink: 0, padding: '14px 28px',
          borderTop: '1px solid var(--border)',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            {footer}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared components ─────────────────────────────────────────

function NavBar({ onBack, onNext, nextDisabled, nextLabel, skipLabel, onSkip }: {
  onBack: () => void
  onNext: () => void
  nextDisabled?: boolean
  nextLabel?: string
  skipLabel?: string
  onSkip?: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
      <button className="btn btn-secondary" onClick={onBack} style={{ fontSize: 14 }}>← Back</button>
      <div style={{ flex: 1 }} />
      {skipLabel && onSkip && (
        <button onClick={onSkip} style={{
          background: 'none', border: 'none', fontSize: 13, color: 'var(--text-muted)',
          cursor: 'pointer', textDecoration: 'underline', padding: '4px 0',
        }}>{skipLabel}</button>
      )}
      <button
        className="btn btn-primary"
        onClick={onNext}
        disabled={nextDisabled}
        style={{ fontSize: 14, opacity: nextDisabled ? 0.35 : 1, cursor: nextDisabled ? 'not-allowed' : 'pointer' }}
      >
        {nextLabel ?? 'Continue'} →
      </button>
    </div>
  )
}

function StepHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 8, letterSpacing: '0.04em' }}>{eyebrow}</p>
      <h2 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', marginBottom: 10, lineHeight: 1.2, letterSpacing: '-0.5px' }}>{title}</h2>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.65 }}>{subtitle}</p>
    </div>
  )
}

function Label({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        width: 30, height: 30, borderRadius: 8,
        background: 'rgba(155,114,248,0.12)', border: '1px solid rgba(155,114,248,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0,
      }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{text}</span>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 10, marginBottom: 20,
      background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)',
      color: 'var(--risk-high)', fontSize: 14,
    }}>{message}</div>
  )
}

function SideCard({ icon, title, items, delay = 0, style }: {
  icon: string
  title: string
  items: { label: string; desc?: string; isWarning?: boolean }[]
  delay?: number
  style?: React.CSSProperties
}) {
  return (
    <div className="card animate-in" style={{
      borderLeft: '3px solid rgba(155,114,248,0.35)',
      animationDelay: `${delay}ms`,
      ...style,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <span style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: 'rgba(155,114,248,0.12)', border: '1px solid rgba(155,114,248,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
        }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            paddingLeft: 10,
            borderLeft: `2px solid ${item.isWarning ? 'var(--risk-high)' : 'var(--border)'}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: item.isWarning ? 'var(--risk-high)' : 'var(--text)', lineHeight: 1.4 }}>
              {item.label}
            </div>
            {item.desc && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>{item.desc}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
