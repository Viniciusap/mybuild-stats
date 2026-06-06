'use client'
import { useState } from 'react'
import { clsx } from 'clsx'
import type { OptimizationCheck, CheckStatus } from '@/types/optimization'
import OptimizationModal from './OptimizationModal'

const STATUS_CONFIG: Record<CheckStatus, { label: string; dot: string; text: string }> = {
  optimal:           { label: 'OK',     dot: 'bg-cyber-green',    text: 'text-cyber-green' },
  suboptimal:        { label: 'FIX',    dot: 'bg-cyber-red',      text: 'text-cyber-red' },
  info:              { label: 'INFO',   dot: 'bg-cyber-amber',    text: 'text-cyber-amber' },
  unknown:           { label: '?',      dot: 'bg-cyber-text-dim', text: 'text-cyber-text-dim' },
  not_applicable:    { label: 'N/A',    dot: 'bg-cyber-border',   text: 'text-cyber-text-dim' },
  error:             { label: 'ERR',    dot: 'bg-cyber-red',      text: 'text-cyber-red' },
  permission_denied: { label: 'PERM',   dot: 'bg-cyber-purple',   text: 'text-cyber-purple' },
  managed_by_policy: { label: 'POLICY', dot: 'bg-cyber-purple',   text: 'text-cyber-purple' },
}

const IMPACT_COLOR: Record<string, string> = {
  high:   'text-cyber-red',
  medium: 'text-cyber-amber',
  low:    'text-cyber-text-dim',
  info:   'text-cyber-text-dim',
}

export default function OptimizationCard({ check }: { check: OptimizationCheck }) {
  const [modalOpen, setModalOpen] = useState(false)
  const cfg = STATUS_CONFIG[check.status]
  const actionable = check.status !== 'not_applicable'

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        disabled={!actionable}
        className={clsx(
          'w-full flex items-center gap-2.5 px-3 py-2 rounded border text-left transition-all',
          actionable
            ? 'border-cyber-border bg-cyber-panel/60 hover:border-cyber-cyan/40 hover:bg-cyber-panel cursor-pointer'
            : 'border-cyber-border/30 bg-cyber-panel/20 cursor-default opacity-50',
        )}
      >
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
        <span className="flex-1 text-xs font-mono text-cyber-text truncate">{check.name}</span>

        {check.currentValue && (
          <span className="text-[11px] font-mono text-cyber-text-dim truncate max-w-[160px] hidden sm:block">
            {check.currentValue}
          </span>
        )}

        {check.impact !== 'info' && check.status !== 'not_applicable' && (
          <span className={clsx('text-[10px] font-mono uppercase shrink-0', IMPACT_COLOR[check.impact])}>
            {check.impact}
          </span>
        )}

        <span className={clsx('text-[10px] font-mono font-bold shrink-0 w-12 text-right', cfg.text)}>
          {cfg.label}
        </span>
      </button>

      <OptimizationModal
        check={modalOpen ? check : null}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
