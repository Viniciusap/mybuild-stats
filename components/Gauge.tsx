'use client'

const CX = 100
const CY = 95
const R = 70
const START_DEG = 135
const SWEEP_DEG = 270

function deg2rad(d: number) {
  return (d * Math.PI) / 180
}

function arcPoint(angleDeg: number, radius = R) {
  const rad = deg2rad(angleDeg)
  return {
    x: +(CX + radius * Math.cos(rad)).toFixed(3),
    y: +(CY + radius * Math.sin(rad)).toFixed(3),
  }
}

function describeArc(startDeg: number, sweepDeg: number, radius = R) {
  if (sweepDeg <= 0) return ''
  const clampedSweep = Math.min(sweepDeg, SWEEP_DEG - 0.001)
  const start = arcPoint(startDeg, radius)
  const end = arcPoint(startDeg + clampedSweep, radius)
  const largeArc = clampedSweep > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

const TICKS = Array.from({ length: 9 }, (_, i) => {
  const pct = i / 8
  const angle = START_DEG + SWEEP_DEG * pct
  const isMajor = i === 0 || i === 4 || i === 8
  return {
    outer: arcPoint(angle, R),
    inner: arcPoint(angle, isMajor ? R - 14 : R - 8),
    isMajor,
  }
})

const BG_PATH = describeArc(START_DEG, SWEEP_DEG)

function resolveColor(pct: number, warnAt: number, critAt: number): string {
  if (pct >= critAt) return '#ff3355'
  if (pct >= warnAt) return '#ffaa00'
  return '#00ff87'
}

interface GaugeProps {
  value: number
  max?: number
  unit?: string
  label?: string
  color?: string
  warnAt?: number
  critAt?: number
  /** Applied to the wrapper div — controls sizing. e.g. `w-40`, `h-full w-full`. */
  className?: string
  needle?: boolean
}

export default function Gauge({
  value,
  max = 100,
  unit = '%',
  label,
  color,
  warnAt = 0.6,
  critAt = 0.82,
  className = 'w-40',
  needle = true,
}: GaugeProps) {
  const raw = Number.isFinite(value) ? value : 0
  const pct = Math.min(Math.max(raw / max, 0), 1)
  const c = color ?? resolveColor(pct, warnAt, critAt)

  const valuePath = describeArc(START_DEG, SWEEP_DEG * pct)
  const needleDeg = START_DEG + SWEEP_DEG * pct

  const displayValue =
    max === 100
      ? Math.round(raw).toString()
      : raw < 10
      ? raw.toFixed(1)
      : Math.round(raw).toString()

  return (
    <div className={className}>
    <svg
      viewBox="0 0 200 165"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }}
    >
      <defs>
        <filter id={`g${c.replace('#', '')}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background track */}
      <path d={BG_PATH} fill="none" stroke="#1a2a3a" strokeWidth="10" strokeLinecap="round" />

      {/* Value arc — glow layers */}
      {valuePath && (
        <>
          <path d={valuePath} fill="none" stroke={c} strokeWidth="22" strokeLinecap="round" opacity="0.10" />
          <path d={valuePath} fill="none" stroke={c} strokeWidth="14" strokeLinecap="round" opacity="0.18" />
          <path
            d={valuePath}
            fill="none"
            stroke={c}
            strokeWidth="6"
            strokeLinecap="round"
            filter={`url(#g${c.replace('#', '')})`}
          />
        </>
      )}

      {/* Tick marks */}
      {TICKS.map((t, i) => (
        <line
          key={i}
          x1={t.outer.x} y1={t.outer.y}
          x2={t.inner.x} y2={t.inner.y}
          stroke={t.isMajor ? '#2a3a4a' : '#182230'}
          strokeWidth={t.isMajor ? 2 : 1}
          strokeLinecap="round"
        />
      ))}

      {/* Needle */}
      {needle && (
        <g transform={`rotate(${needleDeg}, ${CX}, ${CY})`}>
          <polygon
            points={`${CX},${CY - 4} ${CX + 58},${CY} ${CX},${CY + 4} ${CX - 10},${CY}`}
            fill={c}
            opacity="0.2"
          />
          <polygon
            points={`${CX},${CY - 2.5} ${CX + 58},${CY} ${CX},${CY + 2.5} ${CX - 8},${CY}`}
            fill={c}
            opacity="0.9"
          />
        </g>
      )}

      {/* Center pivot */}
      <circle cx={CX} cy={CY} r="10" fill="#0d1520" stroke={c} strokeWidth="1.5" opacity="0.6" />
      <circle cx={CX} cy={CY} r="5" fill={c} opacity="0.9" />
      <circle cx={CX} cy={CY} r="2.5" fill="#060a0f" />

      {/* ── Value — bigger font for readability at any scale ── */}
      <text
        x={CX} y={CY - 18}
        textAnchor="middle"
        fill="white"
        fontSize="34"
        fontFamily="monospace"
        fontWeight="bold"
        letterSpacing="-1"
      >
        {displayValue}
      </text>

      {/* Unit */}
      <text
        x={CX} y={CY - 2}
        textAnchor="middle"
        fill={c}
        fontSize="13"
        fontFamily="monospace"
        opacity="0.85"
      >
        {unit}
      </text>

      {/* Label */}
      {label && (
        <text
          x={CX} y="158"
          textAnchor="middle"
          fill="#607080"
          fontSize="10"
          fontFamily="monospace"
          letterSpacing="2"
        >
          {label.toUpperCase()}
        </text>
      )}

      {/* Min / Max marks */}
      <text x="30" y="152" textAnchor="middle" fill="#2a3a4a" fontSize="9" fontFamily="monospace">0</text>
      <text x="170" y="152" textAnchor="middle" fill="#2a3a4a" fontSize="9" fontFamily="monospace">{max}</text>
    </svg>
    </div>
  )
}
