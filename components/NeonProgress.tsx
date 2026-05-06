'use client'
import { clsx } from 'clsx'

type Accent = 'cyan' | 'green' | 'purple' | 'amber' | 'red'

interface Props {
  value: number
  max?: number
  accent?: Accent
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md'
}

const trackMap: Record<Accent, string> = {
  cyan: 'bg-cyber-cyan',
  green: 'bg-cyber-green',
  purple: 'bg-cyber-purple',
  amber: 'bg-cyber-amber',
  red: 'bg-cyber-red',
}


function pickAccent(value: number): Accent {
  if (value < 50) return 'green'
  if (value < 80) return 'amber'
  return 'red'
}

export default function NeonProgress({
  value,
  max = 100,
  accent,
  label,
  showValue = true,
  size = 'md',
}: Props) {
  const pct = Math.min((value / max) * 100, 100)
  const resolvedAccent = accent ?? pickAccent(pct)

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-xs font-mono text-cyber-text-dim uppercase tracking-wider">
              {label}
            </span>
          )}
          {showValue && (
            <span
              className={clsx(
                'text-xs font-mono font-bold',
                {
                  'text-cyber-cyan': resolvedAccent === 'cyan',
                  'text-cyber-green': resolvedAccent === 'green',
                  'text-cyber-purple': resolvedAccent === 'purple',
                  'text-cyber-amber': resolvedAccent === 'amber',
                  'text-cyber-red': resolvedAccent === 'red',
                }
              )}
            >
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div
        className={clsx(
          'w-full rounded-full bg-cyber-border overflow-hidden',
          size === 'sm' ? 'h-1' : 'h-2'
        )}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-700',
            trackMap[resolvedAccent]
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
