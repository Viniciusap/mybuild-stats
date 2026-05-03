'use client'
import GlowCard from './GlowCard'
import { formatDate, formatBRL } from '@/lib/utils'
import type { BuildEvent } from '@/types'
import { GitBranch, Plus, Minus, ArrowUpCircle, Wrench, Cpu, type LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

const eventConfig: Record<
  BuildEvent['eventType'],
  { icon: LucideIcon; color: string; label: string }
> = {
  added: { icon: Plus, color: 'text-cyber-green border-cyber-green/40 bg-cyber-green/10', label: 'ADDED' },
  removed: { icon: Minus, color: 'text-cyber-red border-cyber-red/40 bg-cyber-red/10', label: 'REMOVED' },
  upgraded: { icon: ArrowUpCircle, color: 'text-cyber-cyan border-cyber-cyan/40 bg-cyber-cyan/10', label: 'UPGRADE' },
  repaired: { icon: Wrench, color: 'text-cyber-amber border-cyber-amber/40 bg-cyber-amber/10', label: 'REPAIR' },
  driver_update: { icon: Cpu, color: 'text-cyber-purple border-cyber-purple/40 bg-cyber-purple/10', label: 'DRIVER' },
}

function groupByYear(events: BuildEvent[]): Record<string, BuildEvent[]> {
  return events.reduce<Record<string, BuildEvent[]>>((acc, ev) => {
    const year = ev.date.split('-')[0]
    ;(acc[year] ??= []).push(ev)
    return acc
  }, {})
}

export default function BuildTimeline({ events }: { events: BuildEvent[] }) {
  const grouped = groupByYear(events)
  const years = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a))

  return (
    <GlowCard accent="purple" className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch size={16} className="text-cyber-purple" />
        <span className="text-xs font-mono font-bold text-cyber-purple tracking-widest uppercase">
          Build Timeline
        </span>
        <span className="ml-auto text-xs font-mono text-cyber-text-dim">
          {events.length} events
        </span>
      </div>

      <div className="space-y-6">
        {years.map((year) => (
          <div key={year}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono font-bold text-cyber-text-dim tracking-widest">
                {year}
              </span>
              <div className="flex-1 h-px bg-cyber-border" />
            </div>

            <div className="relative pl-4">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-cyber-border" />

              <div className="space-y-3">
                {grouped[year].map((ev, i) => {
                  const cfg = eventConfig[ev.eventType]
                  const Icon = cfg.icon
                  return (
                    <div key={ev.id ?? i} className="relative flex gap-3 items-start group">
                      <div
                        className={clsx(
                          'absolute -left-5 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                          cfg.color
                        )}
                      >
                        <Icon size={10} />
                      </div>

                      <div className="flex-1 min-w-0 ml-2">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span
                            className={clsx(
                              'text-xs font-mono px-1 py-0.5 rounded border',
                              cfg.color
                            )}
                          >
                            {cfg.label}
                          </span>
                          <span className="text-xs font-mono font-bold text-cyber-text">
                            {ev.component}
                          </span>
                          {ev.price ? (
                            <span className="text-xs font-mono text-cyber-text-dim ml-auto">
                              {formatBRL(ev.price)}
                            </span>
                          ) : null}
                        </div>
                        {ev.notes && (
                          <p className="text-xs font-mono text-cyber-text-dim leading-relaxed">
                            {ev.notes}
                          </p>
                        )}
                        <p className="text-xs font-mono text-cyber-text-dim/60 mt-0.5">
                          {formatDate(ev.date)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlowCard>
  )
}
