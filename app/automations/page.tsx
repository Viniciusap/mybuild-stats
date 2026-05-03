'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, ShieldAlert, CheckCircle, XCircle, Clock, Terminal } from 'lucide-react'
import { clsx } from 'clsx'
import type { AutomationTask } from '@/lib/automations'

interface TaskState {
  lines: string[]
  status: 'idle' | 'running' | 'done' | 'error'
  exitCode?: number
}

function AdminBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-cyber-amber border border-cyber-amber/30 bg-cyber-amber/10 px-1.5 py-0.5 rounded leading-none">
      <ShieldAlert size={9} />
      ADMIN
    </span>
  )
}

function EstimatedBadge({ seconds }: { seconds: number }) {
  const label = seconds < 60 ? `~${seconds}s` : `~${Math.round(seconds / 60)}min`
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-cyber-text-dim border border-cyber-border/40 px-1.5 py-0.5 rounded leading-none">
      <Clock size={9} />
      {label}
    </span>
  )
}

export default function AutomationsPage() {
  const [tasks, setTasks] = useState<AutomationTask[]>([])
  const [states, setStates] = useState<Record<string, TaskState>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/automations')
      .then((r) => r.json())
      .then((d: { tasks: AutomationTask[] }) => {
        setTasks(d.tasks)
        const init: Record<string, TaskState> = {}
        for (const t of d.tasks) init[t.id] = { lines: [], status: 'idle' }
        setStates(init)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [selected, states])

  async function runTask(id: string) {
    setSelected(id)
    setStates((prev) => ({ ...prev, [id]: { lines: [], status: 'running' } }))

    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!res.ok || !res.body) {
        setStates((prev) => ({
          ...prev,
          [id]: { lines: [`Erro HTTP ${res.status}`], status: 'error', exitCode: -1 },
        }))
        return
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += dec.decode(value, { stream: true })
        const parts = buffer.split('\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          if (!part) continue
          if (part.startsWith('__EXIT__')) {
            const code = parseInt(part.slice(8), 10)
            setStates((prev) => ({
              ...prev,
              [id]: { ...prev[id], status: code === 0 ? 'done' : 'error', exitCode: code },
            }))
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
        [id]: { lines: [`Erro: ${String(err)}`], status: 'error', exitCode: -1 },
      }))
    }
  }

  const selectedState = selected ? states[selected] : null
  const selectedTask = selected ? tasks.find((t) => t.id === selected) : null

  return (
    <div className="min-h-screen p-3 md:p-5 max-w-[1800px] mx-auto animate-fade-in">

      {/* ══ ADMIN WARNING ══ */}
      <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded border border-cyber-amber/30 bg-cyber-amber/5 text-xs font-mono text-cyber-amber">
        <ShieldAlert size={13} className="shrink-0 mt-0.5" />
        <span>
          Tasks marked <strong>ADMIN</strong> require the server to be started in an Administrator terminal.
          Close the current terminal, open a new one as Administrator, and run <code className="bg-cyber-bg/60 px-1 rounded">npm run dev</code>.
        </span>
      </div>

      {/* ══ TASK GRID ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {tasks.map((task) => {
          const state = states[task.id]
          const isRunning = state?.status === 'running'
          const isDone = state?.status === 'done'
          const isError = state?.status === 'error'
          const isSelected = selected === task.id

          return (
            <div
              key={task.id}
              className={clsx(
                'rounded-lg border bg-cyber-panel/80 p-3 flex flex-col gap-2 cursor-pointer transition-colors',
                isSelected ? 'border-cyber-cyan/60' : 'border-cyber-border hover:border-cyber-border/80',
              )}
              onClick={() => setSelected(task.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-mono font-bold text-cyber-text leading-snug">{task.label}</p>
                <div className="flex items-center gap-1 shrink-0">
                  {task.requiresAdmin && <AdminBadge />}
                  <EstimatedBadge seconds={task.estimatedSeconds} />
                </div>
              </div>

              <p className="text-[11px] font-mono text-cyber-text-dim flex-1">{task.description}</p>

              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  {isDone && <><CheckCircle size={11} className="text-cyber-green" /><span className="text-cyber-green">DONE</span></>}
                  {isError && <><XCircle size={11} className="text-cyber-red" /><span className="text-cyber-red">ERROR ({state.exitCode})</span></>}
                  {isRunning && <><div className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse" /><span className="text-cyber-cyan">RUNNING…</span></>}
                </div>
                <button
                  disabled={isRunning}
                  onClick={(e) => { e.stopPropagation(); void runTask(task.id) }}
                  className={clsx(
                    'flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-bold rounded border transition-colors',
                    isRunning
                      ? 'text-cyber-text-dim border-cyber-border/30 cursor-not-allowed'
                      : 'text-cyber-cyan border-cyber-cyan/40 hover:bg-cyber-cyan/10 hover:border-cyber-cyan/70',
                  )}
                >
                  <Play size={9} />
                  RUN
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ══ LOG PANEL ══ */}
      {selectedTask && (
        <div className="rounded-lg border border-cyber-border bg-cyber-bg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-cyber-border bg-cyber-panel/60">
            <Terminal size={12} className="text-cyber-cyan" />
            <span className="text-xs font-mono font-bold text-cyber-text tracking-wider">{selectedTask.label.toUpperCase()}</span>
            {selectedState?.status === 'running' && (
              <span className="text-[10px] font-mono text-cyber-cyan animate-pulse ml-auto">● RUNNING</span>
            )}
            {selectedState?.status === 'done' && (
              <span className="text-[10px] font-mono text-cyber-green ml-auto">● DONE · EXIT 0</span>
            )}
            {selectedState?.status === 'error' && (
              <span className="text-[10px] font-mono text-cyber-red ml-auto">● ERROR · EXIT {selectedState.exitCode}</span>
            )}
          </div>
          <div
            ref={logRef}
            className="h-64 overflow-y-auto p-3 text-[11px] font-mono leading-relaxed"
            style={{ scrollBehavior: 'smooth' }}
          >
            {(!selectedState?.lines.length && selectedState?.status === 'idle') && (
              <span className="text-cyber-text-dim">Click RUN to start.</span>
            )}
            {selectedState?.lines.map((line, i) => (
              <div
                key={i}
                className={clsx(
                  line.startsWith('[ERRO]') ? 'text-cyber-red' : 'text-cyber-text',
                )}
              >
                {line || ' '}
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
