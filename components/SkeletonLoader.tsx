interface SkeletonProps {
  width?: string | number
  height?: number
  style?: React.CSSProperties
}

function SkeletonLine({ width = '100%', height = 16, style }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: 6, ...style }}
    />
  )
}

export function ReportSkeleton() {
  return (
    <div className="card animate-in" style={{ maxWidth: 680 }}>
      {/* Risk badge placeholder */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div className="skeleton" style={{ width: 180, height: 48, borderRadius: 999 }} />
      </div>

      {/* Section blocks */}
      {['Subjective', 'Objective', 'Assessment', 'Plan'].map(section => (
        <div key={section} style={{ marginBottom: 28 }}>
          <SkeletonLine width={120} height={14} style={{ marginBottom: 12 }} />
          <SkeletonLine height={14} style={{ marginBottom: 8 }} />
          <SkeletonLine width="85%" height={14} style={{ marginBottom: 8 }} />
          <SkeletonLine width="70%" height={14} />
        </div>
      ))}

      {/* Button placeholder */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <div className="skeleton" style={{ width: 140, height: 40, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 120, height: 40, borderRadius: 8 }} />
      </div>
    </div>
  )
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card">
      <SkeletonLine width="40%" height={20} style={{ marginBottom: 20 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          style={{ marginBottom: 10 }}
        />
      ))}
    </div>
  )
}
