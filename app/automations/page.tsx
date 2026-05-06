'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, ShieldAlert, CheckCircle, XCircle, Clock, Terminal, History } from 'lucide-react'
import { clsx } from 'clsx'
import { btn, badge, card, text, status, logPanel } from '@/lib/styles'
import type { AutomationTask } from '@/lib/automations'
import type { RunEntry } from '@/lib/automation-history'

interface TaskState {
  lines: string[]
  status: 'idle' | 'running' | 'done' | 'error' | 'compliant' | 'executed'
  exitCode?: number
  lastRunAt?: string
  lastRunStatus?: RunEntry['status']
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const STATUS_COLOR: Record<RunEntry['status'], string> = {
  done:      status.done,
  compliant: status.done,
  executed:  status.running,
  error:     status.error,
}

export default function AutomationsPage() {
  const [tasks, setTasks]     = useState<AutomationTask[]>([])
  const [states, setStates]   = useState<Record<string, TaskState>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/automations').then((r) => r.json()),
      fetch('/api/automations/history').then((r) => r.json()),
    ])
      .then(([taskData, histData]: [{ tasks: AutomationTask[] }, { runs: RunEntry[] }]) => {
        const taskList = taskData.tasks
        const runs: RunEntry[] = histData.runs ?? []

        const lastByTask = new Map<string, RunEntry>()
        for (const r of runs) {
          const existing = lastByTask.get(r.taskId)
          if (!existing || r.endedAt > existing.endedAt) lastByTask.set(r.taskId, r)
        }

        setTasks(taskList)
        const init: Record<string, TaskState> = {}
        for (const t of taskList) {
          const last = lastByTask.get(t.id)
          init[t.id] = { lines: [], status: 'idle', lastRunAt: last?.endedAt, lastRunStatus: last?.status }
        }
        setStates(init)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [selected, states])

  async function runTask(id: string) {
    setSelected(id)
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], lines: [], status: 'running' } }))

    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!res.ok || !res.body) {
        setStates((prev) => ({
          ...prev,
          [id]: { ...prev[id], lines: [`Erro HTTP ${res.status}`], status: 'error', exitCode: -1 },
        }))
        return
      }

      const reader = res.body.getReader()
      const dec    = new TextDecoder()
      let buffer   = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += dec.decode(value, { stream: true })
        const parts = buffer.split('\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          if (!part) continue

          if (part.startsWith('__STATUS__')) {
            const s = part.slice(10).toLowerCase()
            if (s === 'compliant' || s === 'executed') {
              setStates((prev) => ({ ...prev, [id]: { ...prev[id], status: s as 'compliant' | 'executed' } }))
            }
            continue
          }

          if (part.startsWith('__EXIT__')) {
            const code = parseInt(part.slice(8), 10)
            const endedAt = new Date().toISOString()
            setStates((prev) => {
              const cur = prev[id]
              const next: TaskState['status'] =
                cur.status === 'compliant' || cur.status === 'executed'
                  ? cur.status
                  : code === 0 ? 'done' : 'error'
              const lastRunStatus: RunEntry['status'] | undefined =
                (next === 'done' || next === 'error' || next === 'compliant' || next === 'executed')
                  ? next : cur.lastRunStatus
              return { ...prev, [id]: { ...cur, status: next, exitCode: code, lastRunAt: endedAt, lastRunStatus } }
            })
            setTimeout(() => setSelected((prev) => (prev === id ? null : prev)), 3000)
          } else {
            setStates((prev) => ({
              ...prev,
              [id]: { ...prev[id], lines: [...(prev[id]?.lines ?? []), part] },
            }))
          }
        }
      }
    } catch (err) {
      setStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], lines: [`Erro: ${String(err)}`], status: 'error', exitCode: -1 },
      }))
    }
  }

  const selectedState = selected ? states[selected] : null
  const selectedTask  = selected ? tasks.find((t) => t.id === selected) : null

  return (
    <div className="min-h-screen p-3 md:p-5 max-w-[1800px] mx-auto animate-fade-in">

      {/* ── Admin warning ── */}
      <div className={clsx(badge.base, badge.sm, badge.warning, 'mb-4 w-full px-3 py-2 rounded-lg items-start gap-2')}>
        <ShieldAlert size={13} className="shrink-0 mt-0.5" />
        <span className={text.dim}>
          Tasks marked <strong className="text-cyber-amber">ADMIN</strong> require the server to be started in an Administrator terminal.
          Close the current terminal, open a new one as Administrator, and run{' '}
          <code className="bg-cyber-bg/60 px-1 rounded">npm run dev</code>.
        </span>
      </div>

      {/* ── Task grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {tasks.map((task) => {
          const state     = states[task.id]
          const isRunning = state?.status === 'running'
          const isSelected = selected === task.id

          return (
            <div
              key={task.id}
              onClick={() => setSelected(task.id)}
              className={clsx(
                card.base, 'p-3 flex flex-col gap-2 cursor-pointer transition-colors',
                isSelected ? card.active : clsx(card.default, 'hover:border-cyber-border/80'),
              )}
            >
              {/* Task header */}
              <div className="flex items-start justify-between gap-2">
                <p className={text.value}>{task.label}</p>
                <div className="flex items-center gap-1 shrink-0">
                  {task.requiresAdmin && (
                    <span className={clsx(badge.base, badge.xs, badge.warning)}>
                      <ShieldAlert size={9} />ADMIN
                    </span>
                  )}
                  <span className={clsx(badge.base, badge.xs, badge.neutral)}>
                    <Clock size={9} />
                    {task.estimatedSeconds < 60 ? `~${task.estimatedSeconds}s` : `~${Math.round(task.estimatedSeconds / 60)}min`}
                  </span>
                </div>
              </div>

              <p className={clsx(text.dim, 'flex-1')}>{task.description}</p>

              {/* Status + Run button */}
              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  {state?.status === 'done'      && <><CheckCircle size={11} className="text-cyber-green" /><span className={status.done}>DONE</span></>}
                  {state?.status === 'error'     && <><XCircle size={11} className="text-cyber-red" /><span className={status.error}>ERROR ({state.exitCode})</span></>}
                  {state?.status === 'running'   && <><div className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse" /><span className={status.running}>RUNNING…</span></>}
                  {state?.status === 'compliant' && <><CheckCircle size={11} className="text-cyber-green" /><span className={status.done}>COMPLIANT</span></>}
                  {state?.status === 'executed'  && <><CheckCircle size={11} className="text-cyber-cyan" /><span className={status.running}>EXECUTED</span></>}
                  {(!state || state.status === 'idle') && state?.lastRunAt && state.lastRunStatus && (
                    <span className={clsx('flex items-center gap-1', STATUS_COLOR[state.lastRunStatus])}>
                      <History size={10} />
                      {state.lastRunStatus.toUpperCase()} · {formatRelative(state.lastRunAt)}
                    </span>
                  )}
                </div>
                <button
                  disabled={isRunning}
                  onClick={(e) => { e.stopPropagation(); void runTask(task.id) }}
                  className={clsx(btn.base, btn.sm, isRunning ? 'text-cyber-text-dim border-cyber-border/30 cursor-not-allowed' : btn.primary)}
                >
                  <Play size={9} />RUN
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Log panel ── */}
      {selectedTask && (
        <div className={logPanel.container}>
          <div className={logPanel.header}>
            <Terminal size={12} className="text-cyber-cyan" />
            <span className={text.value}>{selectedTask.label.toUpperCase()}</span>
            <span className={clsx('text-[10px] font-mono ml-auto', {
              [status.running]: selectedState?.status === 'running',
              [status.done]:    selectedState?.status === 'done' || selectedState?.status === 'compliant',
              [status.error]:   selectedState?.status === 'error',
              [text.dim]:       !selectedState || selectedState.status === 'idle',
            })}>
              {selectedState?.status === 'running'   ? '● RUNNING'
                : selectedState?.status === 'done'     ? '● DONE · EXIT 0'
                : selectedState?.status === 'error'    ? `● ERROR · EXIT ${selectedState.exitCode}`
                : selectedState?.status === 'compliant'? '● COMPLIANT · NO ACTION'
                : selectedState?.status === 'executed' ? '● EXECUTED · EXIT 0'
                : selectedState?.lastRunAt && selectedState.lastRunStatus
                  ? `LAST: ${selectedState.lastRunStatus.toUpperCase()} · ${formatRelative(selectedState.lastRunAt)}`
                  : ''}
            </span>
          </div>
          <div ref={logRef} className={clsx(logPanel.body, 'h-64')} style={{ scrollBehavior: 'smooth' }}>
            {!selectedState?.lines.length && selectedState?.status === 'idle' && (
              <span className={text.dim}>
                {selectedState.lastRunAt
                  ? `Last run ${formatRelative(selectedState.lastRunAt)} — click RUN to check again.`
                  : 'Click RUN to start.'}
              </span>
            )}
            {selectedState?.lines.map((line, i) => (
              <div key={i} className={line.startsWith('[ERRO]') ? logPanel.lineErr : logPanel.lineOk}>
                {line || ' '}
              </div>
            ))}
            {selectedState?.status === 'running' && (
              <span className="text-cyber-cyan animate-pulse">▌</span>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
