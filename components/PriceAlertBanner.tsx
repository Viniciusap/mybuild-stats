'use client'
import { BellRing, ExternalLink, TrendingDown } from 'lucide-react'
import { formatBRL } from '@/lib/utils'
import type { PriceAlert } from '@/types'
import { clsx } from 'clsx'

interface Props {
  alerts: PriceAlert[]
  onTriggerCheck?: () => void
  checking?: boolean
}

export default function PriceAlertBanner({ alerts, onTriggerCheck, checking }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-cyber-border bg-cyber-panel/50">
        <BellRing size={14} className="text-cyber-text-dim" />
        <span className="text-xs font-mono text-cyber-text-dim">
          No opportunities detected. Prices within expected range.
        </span>
        {onTriggerCheck && (
          <button
            onClick={onTriggerCheck}
            disabled={checking}
            className="ml-auto text-xs font-mono text-cyber-cyan hover:text-cyber-text transition-colors disabled:opacity-40"
          >
            {checking ? 'CHECKING…' : 'CHECK NOW'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={`${alert.target.id}-${alert.store}`}
          className={clsx(
            'flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg border',
            'animate-slide-up',
            alert.isBelowTrigger
              ? 'border-cyber-amber/50 bg-cyber-amber/8 shadow-neon-amber'
              : 'border-cyber-green/30 bg-cyber-green/5'
          )}
        >
          <BellRing
            size={14}
            className={alert.isBelowTrigger ? 'text-cyber-amber animate-pulse' : 'text-cyber-green'}
          />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-mono font-bold text-cyber-text">
              {alert.target.name}
            </span>
            <span className="text-xs font-mono text-cyber-text-dim ml-2">
              via {alert.store}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={clsx(
                'text-sm font-mono font-bold',
                alert.isBelowTrigger ? 'text-cyber-amber' : 'text-cyber-green'
              )}
            >
              {formatBRL(alert.currentPrice)}
            </span>
            <span
              className={clsx(
                'text-xs font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5',
                alert.isBelowTrigger
                  ? 'bg-cyber-amber/20 text-cyber-amber'
                  : 'bg-cyber-green/20 text-cyber-green'
              )}
            >
              <TrendingDown size={10} />
              {alert.discountPercent}% OFF
            </span>
            {alert.isBelowTrigger && (
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-cyber-red/20 text-cyber-red font-bold animate-pulse">
                TRIGGER!
              </span>
            )}
            {alert.url && (
              <a
                href={alert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyber-text-dim hover:text-cyber-cyan transition-colors"
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      ))}
      {onTriggerCheck && (
        <div className="flex justify-end">
          <button
            onClick={onTriggerCheck}
            disabled={checking}
            className="text-xs font-mono text-cyber-text-dim hover:text-cyber-cyan transition-colors disabled:opacity-40"
          >
            {checking ? 'CHECKING…' : 'FORCE CHECK'}
          </button>
        </div>
      )}
    </div>
  )
}
