'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { ChevronDown, ChevronUp, RefreshCw, Zap, Monitor, Laptop } from 'lucide-react'
import { clsx } from 'clsx'
import OptimizationCard from './OptimizationCard'
import type { OptimizationsResult, OptimizationCheck, CheckCategory } from '@/types/optimization'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const CATEGORIES: { key: CheckCategory; label: string }[] = [
  { key: 'gpu',     label: 'GPU' },
  { key: 'cpu',     label: 'CPU' },
  { key: 'memory',  label: 'Memory' },
  { key: 'storage', label: 'Storage' },
  { key: 'system',  label: 'System' },
  { key: 'input',   label: 'Input' },
]

function SummaryBadge({ count, label, color }: { count: number; label: string; color: string }) {
  if (count === 0) return null
  return (
    <span className={clsx('text-[11px] font-mono font-bold', color)}>
      {count} {label}
    </span>
  )
}

function CategorySection({ label, checks }: { label: string; checks: OptimizationCheck[] }) {
  const visible = checks.filter(c => c.status !== 'not_applicable')
  if (visible.length === 0) return null
  return (
    <div>
      <p className="text-[10px] font-mono text-cyber-text-dim tracking-widest uppercase mb-1.5 px-0.5">
        {label}
      </p>
      <div className="space-y-1">
        {visible.map(c => <OptimizationCard key={c.id} check={c} />)}
      </div>
    </div>
  )
}

export default function OptimizationsPanel() {
  const [open, setOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filterIssues, setFilterIssues] = useState(false)

  const { data, isLoading, mutate } = useSWR<OptimizationsResult>(
    '/api/optimizations',
    fetcher,
    { refreshInterval: 5 * 60 * 1000, revalidateOnFocus: false }  // 5 min — checks are cached server-side
  )

  async function forceRefresh() {
    setRefreshing(true)
    try {
      await fetch('/api/optimizations', { method: 'POST' })
      await mutate()
    } finally {
      setRefreshing(false)
    }
  }

  const summary = data?.summary
  const profile = data?.profile
  const hasIssues = (summary?.critical ?? 0) + (summary?.warnings ?? 0) > 0

  const checks = filterIssues
    ? (data?.checks ?? []).filter(c => c.status === 'suboptimal' || c.status === 'info')
    : (data?.checks ?? [])

  const deviceLabel = profile?.type === 'laptop'
    ? `${profile.gpuVendor.toUpperCase()} Laptop`
    : profile?.type === 'desktop'
      ? `${profile.gpuVendor.toUpperCase()} Desktop`
      : 'Unknown Device'

  const DeviceIcon = profile?.type === 'laptop' ? Laptop : Monitor

  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-panel/80">
      {/* Panel header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-cyber-border/10 transition-colors rounded-lg"
      >
        <Zap size={13} className="text-cyber-cyan shrink-0" />

        <span className="text-xs font-mono font-bold text-cyber-text tracking-wider">
          SYSTEM OPTIMIZATIONS
        </span>

        {profile && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-cyber-text-dim">
            <DeviceIcon size={10} />
            {deviceLabel}
          </span>
        )}

        {/* Summary pills */}
        <div className="flex items-center gap-2 ml-auto">
          {isLoading ? (
            <span className="text-[11px] font-mono text-cyber-text-dim animate-pulse">checking…</span>
          ) : summary ? (
            <>
              <SummaryBadge count={summary.critical} label="critical" color="text-cyber-red" />
              <SummaryBadge count={summary.warnings}  label="warnings" color="text-cyber-amber" />
              {!hasIssues && (
                <span className="text-[11px] font-mono text-cyber-green">All optimized ✓</span>
              )}
            </>
          ) : null}
        </div>

        {open ? <ChevronUp size={13} className="text-cyber-text-dim shrink-0" /> : <ChevronDown size={13} className="text-cyber-text-dim shrink-0" />}
      </button>

      {/* Panel body */}
      {open && (
        <div className="border-t border-cyber-border px-3 pb-3 pt-2.5 animate-fade-in">
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setFilterIssues(f => !f)}
              className={clsx(
                'text-[10px] font-mono px-2 py-0.5 rounded border transition-colors',
                filterIssues
                  ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/10'
                  : 'border-cyber-border text-cyber-text-dim hover:border-cyber-cyan/50',
              )}
            >
              {filterIssues ? 'SHOW ALL' : 'ISSUES ONLY'}
            </button>

            {data?.cachedAt && (
              <span className="text-[10px] font-mono text-cyber-text-dim ml-auto">
                checked {new Date(data.cachedAt).toLocaleTimeString()}
              </span>
            )}

            <button
              onClick={forceRefresh}
              disabled={refreshing}
              className="flex items-center gap-1 text-[10px] font-mono text-cyber-text-dim hover:text-cyber-cyan transition-colors"
            >
              <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
              REFRESH
            </button>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 rounded bg-cyber-border/30 animate-pulse" />
              ))}
            </div>
          )}

          {/* Checks grouped by category */}
          {!isLoading && data && (
            <div className="space-y-4">
              {CATEGORIES.map(cat => (
                <CategorySection
                  key={cat.key}
                  label={cat.label}
                  checks={checks.filter(c => c.category === cat.key)}
                />
              ))}
            </div>
          )}

          {/* Error state */}
          {!isLoading && !data && (
            <p className="text-xs font-mono text-cyber-red">
              ERROR: failed to load optimization checks
            </p>
          )}
        </div>
      )}
    </div>
  )
}
