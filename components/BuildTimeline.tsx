'use client'
import { useState } from 'react'
import GlowCard from './GlowCard'
import { formatDate, formatBRL } from '@/lib/utils'
import type { BuildEvent } from '@/types'
import { GitBranch, Plus, Minus, ArrowUpCircle, Wrench, Cpu, X, RefreshCw, type LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

const eventConfig: Record<
  BuildEvent['eventType'],
  { icon: LucideIcon; color: string; label: string }
> = {
  added:        { icon: Plus,          color: 'text-cyber-green  border-cyber-green/40  bg-cyber-green/10',  label: 'ADDED'  },
  removed:      { icon: Minus,         color: 'text-cyber-red    border-cyber-red/40    bg-cyber-red/10',    label: 'REMOVED' },
  upgraded:     { icon: ArrowUpCircle, color: 'text-cyber-cyan   border-cyber-cyan/40   bg-cyber-cyan/10',   label: 'UPGRADE' },
  repaired:     { icon: Wrench,        color: 'text-cyber-amber  border-cyber-amber/40  bg-cyber-amber/10',  label: 'REPAIR' },
  driver_update:{ icon: Cpu,           color: 'text-cyber-purple border-cyber-purple/40 bg-cyber-purple/10', label: 'DRIVER' },
}

const EVENT_TYPES = [
  { value: 'added',         label: 'Added' },
  { value: 'upgraded',      label: 'Upgrade' },
  { value: 'removed',       label: 'Removed' },
  { value: 'repaired',      label: 'Repair' },
  { value: 'driver_update', label: 'Driver update' },
] as const

function groupByYear(events: BuildEvent[]): Record<string, BuildEvent[]> {
  return events.reduce<Record<string, BuildEvent[]>>((acc, ev) => {
    const year = ev.date.split('-')[0]
    ;(acc[year] ??= []).push(ev)
    return acc
  }, {})
}

const emptyForm = () => ({
  date: new Date().toISOString().split('T')[0],
  component: '',
  eventType: 'added' as BuildEvent['eventType'],
  notes: '',
  price: '',
})

interface Props {
  events: BuildEvent[]
  onEventAdded?: () => void
}

export default function BuildTimeline({ events, onEventAdded }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)

  function set<K extends keyof ReturnType<typeof emptyForm>>(key: K, val: ReturnType<typeof emptyForm>[K]) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  function openForm() { setForm(emptyForm()); setShowForm(true) }
  function closeForm() { setShowForm(false) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.component.trim()) return
    setSubmitting(true)
    try {
      await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date,
          component: form.component.trim(),
          eventType: form.eventType,
          notes: form.notes.trim(),
          ...(form.price ? { price: parseFloat(form.price) } : {}),
        }),
      })
      closeForm()
      onEventAdded?.()
    } finally {
      setSubmitting(false)
    }
  }

  const grouped = groupByYear(events)
  const years = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a))

  const inputCls = clsx(
    'w-full bg-cyber-bg border border-cyber-border rounded px-2.5 py-1.5',
    'text-xs font-mono text-cyber-text placeholder-cyber-text-dim',
    'focus:outline-none focus:border-cyber-purple transition-colors'
  )

  return (
    <GlowCard accent="purple" className="p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <GitBranch size={16} className="text-cyber-purple" />
        <span className="text-xs font-mono font-bold text-cyber-purple tracking-widest uppercase">
          Build Timeline
        </span>
        <span className="ml-auto text-xs font-mono text-cyber-text-dim">
          {events.length} events
        </span>
        <button
          onClick={showForm ? closeForm : openForm}
          className={clsx(
            'flex items-center gap-1 px-2 py-1 rounded border text-xs font-mono font-bold transition-colors',
            showForm
              ? 'border-cyber-border text-cyber-text-dim hover:text-cyber-red hover:border-cyber-red/40'
              : 'border-cyber-purple/40 text-cyber-purple hover:bg-cyber-purple/10'
          )}
        >
          {showForm ? <><X size={11} /> CANCEL</> : <><Plus size={11} /> ADD EVENT</>}
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mb-5 rounded-lg border border-cyber-purple/30 bg-cyber-purple/5 p-3 flex flex-col gap-2"
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-cyber-text-dim uppercase tracking-wider">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-cyber-text-dim uppercase tracking-wider">Type</label>
              <select
                value={form.eventType}
                onChange={(e) => set('eventType', e.target.value as BuildEvent['eventType'])}
                className={inputCls}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-cyber-text-dim uppercase tracking-wider">Component</label>
            <input
              type="text"
              required
              placeholder="Ex: AMD Ryzen 9 5900X"
              value={form.component}
              onChange={(e) => set('component', e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-cyber-text-dim uppercase tracking-wider">Notes</label>
            <input
              type="text"
              placeholder="Optional — any relevant details"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1 w-40">
              <label className="text-[10px] font-mono text-cyber-text-dim uppercase tracking-wider">Price (R$) — optional</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !form.component.trim()}
              className={clsx(
                'ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded border text-xs font-mono font-bold transition-colors',
                'border-cyber-purple text-cyber-purple hover:bg-cyber-purple/15',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              {submitting && <RefreshCw size={11} className="animate-spin" />}
              SAVE EVENT
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {events.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-60">
          <GitBranch size={28} className="text-cyber-text-dim" />
          <p className="text-xs font-mono text-cyber-text-dim text-center">No events yet.</p>
          <button
            onClick={openForm}
            className="text-xs font-mono text-cyber-purple border border-cyber-purple/40 px-3 py-1.5 rounded hover:bg-cyber-purple/10 transition-colors"
          >
            Log your first build event
          </button>
        </div>
      )}

      {/* Timeline */}
      {events.length > 0 && (
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
                            <span className={clsx('text-xs font-mono px-1 py-0.5 rounded border', cfg.color)}>
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
      )}
    </GlowCard>
  )
}
