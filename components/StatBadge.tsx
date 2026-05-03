'use client'
import { clsx } from 'clsx'

type Variant = 'online' | 'warning' | 'error' | 'idle'

const map: Record<Variant, { dot: string; text: string; label: string }> = {
  online: { dot: 'bg-cyber-green animate-pulse', text: 'text-cyber-green', label: 'ONLINE' },
  warning: { dot: 'bg-cyber-amber animate-pulse', text: 'text-cyber-amber', label: 'WARNING' },
  error: { dot: 'bg-cyber-red animate-pulse', text: 'text-cyber-red', label: 'ERROR' },
  idle: { dot: 'bg-cyber-text-dim', text: 'text-cyber-text-dim', label: 'IDLE' },
}

export default function StatBadge({
  variant = 'online',
  label,
}: {
  variant?: Variant
  label?: string
}) {
  const s = map[variant]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={clsx('h-1.5 w-1.5 rounded-full', s.dot)} />
      <span className={clsx('text-xs font-mono font-bold tracking-widest', s.text)}>
        {label ?? s.label}
      </span>
    </span>
  )
}
