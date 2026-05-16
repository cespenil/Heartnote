interface LoadingOverlayProps {
  message?: string
  subtext?: string
  visible: boolean
}

export function LoadingOverlay({
  message = 'Generating your report…',
  subtext = 'This usually takes 5–10 seconds',
  visible,
}: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div
        className="card animate-in"
        style={{ textAlign: 'center', maxWidth: 340, width: '90%', padding: 40 }}
      >
        <Spinner />
        <p style={{ fontWeight: 700, fontSize: 18, marginTop: 20, marginBottom: 8 }}>
          {message}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {subtext}
        </p>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 48,
      height: 48,
      border: '4px solid var(--border)',
      borderTopColor: '#6d28d9',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      margin: '0 auto',
    }} />
  )
}
