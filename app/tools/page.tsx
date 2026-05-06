'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw, CheckCircle, XCircle, Download, ArrowUpCircle, Terminal, Info, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { btn, badge, card, text, status, logPanel } from '@/lib/styles'

interface Tool {
  id: string
  label: string
  description: string
  category: string
  installed: boolean
  version: string | null
  link: string
  wingetId?: string
  installNote?: string
}

type ActionStatus = 'idle' | 'running' | 'done' | 'error'

interface ActionState {
  status: ActionStatus
  lines: string[]
  exitCode?: number
}

const CATEGORIES = [
  { id: 'package-managers', label: 'Package Managers' },
  { id: 'runtimes',         label: 'Runtimes' },
  { id: 'dev-tools',        label: 'Dev Tools' },
]

function ToolCard({
  tool,
  hasUpdate,
  actionState,
  onAction,
  isSelected,
  onSelect,
}: {
  tool: Tool
  hasUpdate: boolean
  actionState: ActionState | undefined
  onAction: (toolId: string, action: 'install' | 'upgrade') => void
  isSelected: boolean
  onSelect: (toolId: string) => void
}) {
  const isRunning = actionState?.status === 'running'
  const isDone    = actionState?.status === 'done'
  const isError   = actionState?.status === 'error'
  const canAct    = !!tool.wingetId
  const action: 'install' | 'upgrade' = tool.installed ? 'upgrade' : 'install'

  return (
    <div
      onClick={() => onSelect(tool.id)}
      className={clsx(
        card.base, 'p-3 flex flex-col gap-1.5 cursor-pointer transition-colors',
        isSelected ? card.active : clsx(card.default, 'hover:border-cyber-border/80'),
        !tool.installed && card.muted,
      )}
    >
      {/* Title */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <span className={clsx(text.value, 'truncate')}>{tool.label}</span>
          <a
            href={tool.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-cyber-text-dim hover:text-cyber-cyan transition-colors"
          >
            <ExternalLink size={10} />
          </a>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hasUpdate && (
            <span className={clsx(badge.base, badge.xs, badge.warning)}>UPDATE</span>
          )}
          {tool.installed
            ? <CheckCircle size={12} className="text-cyber-green" />
            : <XCircle size={12} className="text-cyber-red" />}
        </div>
      </div>

      {/* Description */}
      <p className={text.dim}>{tool.description}</p>

      {/* Version / install note */}
      <div className="mt-auto pt-0.5">
        {tool.installed && tool.version ? (
          <span className={text.accent}>
            {tool.version.startsWith('v') ? tool.version : `v${tool.version}`}
          </span>
        ) : tool.installed ? (
          <span className={text.dim}>installed</span>
        ) : tool.installNote ? (
          <span className={clsx(text.dim, 'flex items-center gap-0.5 opacity-70')}>
            <Info size={9} />{tool.installNote}
          </span>
        ) : (
          <span className="text-[10px] font-mono text-cyber-red/50">not found</span>
        )}
      </div>

      {/* Action button */}
      {canAct && (!tool.installed || hasUpdate) && (
        <button
          disabled={isRunning}
          onClick={(e) => { e.stopPropagation(); onAction(tool.id, action) }}
          className={clsx(
            btn.base, btn.sm, 'mt-1 w-full justify-center',
            isRunning ? 'text-cyber-text-dim border-cyber-border/30 cursor-not-allowed'
              : action === 'upgrade' ? btn.warning
              : btn.primary,
          )}
        >
          {isRunning ? (
            <><div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />RUNNING…</>
          ) : isDone ? (
            <><CheckCircle size={9} />DONE</>
          ) : isError ? (
            <><XCircle size={9} />FAILED</>
          ) : action === 'upgrade' ? (
            <><ArrowUpCircle size={9} />UPDATE</>
          ) : (
            <><Download size={9} />INSTALL</>
          )}
        </button>
      )}
    </div>
  )
}

function SkeletonCard() {
  return <div className={clsx(card.base, card.muted, 'p-3 h-[100px] animate-pulse')} />
}

export default function ToolsPage() {
  const [tools, setTools]                         = useState<Tool[]>([])
  const [loading, setLoading]                     = useState(true)
  const [checkingUpdates, setCheckingUpdates]     = useState(false)
  const [upgradeableIds, setUpgradeableIds]       = useState<Set<string>>(new Set())
  const [actionStates, setActionStates]           = useState<Record<string, ActionState>>({})
  const [selected, setSelected]                   = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const scan = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetch('/api/tools').then((r) => r.json()) as { tools: Tool[] }
      setTools(data.tools)
    } catch { /* keep previous data */ } finally {
      setLoading(false)
    }
  }, [])

  const checkUpdates = useCallback(async () => {
    setCheckingUpdates(true)
    try {
      const data = await fetch('/api/tools/updates').then((r) => r.json()) as { upgradeable: string[] }
      setUpgradeableIds(new Set(data.upgradeable))
    } catch { /* ignore */ } finally {
      setCheckingUpdates(false)
    }
  }, [])

  useEffect(() => { void scan() }, [scan])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [selected, actionStates])

  async function runAction(toolId: string, action: 'install' | 'upgrade') {
    setSelected(toolId)
    setActionStates((prev) => ({ ...prev, [toolId]: { status: 'running', lines: [] } }))

    try {
      const res = await fetch('/api/tools/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, action }),
      })

      if (!res.ok || !res.body) {
        setActionStates((prev) => ({
          ...prev,
          [toolId]: { status: 'error', lines: [`HTTP ${res.status}`], exitCode: -1 },
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
          if (part.startsWith('__EXIT__')) {
            const code = parseInt(part.slice(8), 10)
            setActionStates((prev) => ({
              ...prev,
              [toolId]: { ...prev[toolId], status: code === 0 ? 'done' : 'error', exitCode: code },
            }))
            if (code === 0) setTimeout(() => void scan(), 1500)
          } else {
            setActionStates((prev) => ({
              ...prev,
              [toolId]: { ...prev[toolId], lines: [...(prev[toolId]?.lines ?? []), part] },
            }))
          }
        }
      }
    } catch (err) {
      setActionStates((prev) => ({
        ...prev,
        [toolId]: { status: 'error', lines: [`Erro: ${String(err)}`], exitCode: -1 },
      }))
    }
  }

  const installedCount = tools.filter((t) => t.installed).length
  const updateCount    = tools.filter((t) => t.wingetId && upgradeableIds.has(t.wingetId.toLowerCase())).length
  const selectedTool   = selected ? tools.find((t) => t.id === selected) : null
  const selectedState  = selected ? actionStates[selected] : null

  return (
    <div className="min-h-screen p-3 md:p-5 max-w-[1800px] mx-auto animate-fade-in">

      {/* ── Header ── */}
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className={text.heading}>SYSTEM TOOLS</h2>
          {!loading && tools.length > 0 && (
            <p className={clsx(text.dim, 'mt-0.5')}>
              {installedCount}/{tools.length} installed
              {upgradeableIds.size > 0 && updateCount > 0 && (
                <span className={clsx(status.warning, 'ml-2')}>
                  · {updateCount} update{updateCount > 1 ? 's' : ''} available
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void checkUpdates()}
            disabled={checkingUpdates || loading}
            className={clsx(btn.base, btn.md, btn.warning)}
          >
            <ArrowUpCircle size={11} className={checkingUpdates ? 'animate-spin' : ''} />
            {checkingUpdates ? 'CHECKING…' : 'CHECK UPDATES'}
          </button>
          <button
            onClick={() => void scan()}
            disabled={loading}
            className={clsx(btn.base, btn.md, btn.primary)}
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            {loading ? 'SCANNING…' : 'SCAN'}
          </button>
        </div>
      </div>

      {/* ── Skeleton ── */}
      {loading && tools.length === 0 && (
        <div className="space-y-5">
          {CATEGORIES.map((cat) => (
            <div key={cat.id}>
              <div className="h-3 w-32 bg-cyber-border/20 rounded animate-pulse mb-2" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tool grid ── */}
      {tools.length > 0 && (
        <div className="space-y-5">
          {CATEGORIES.map((cat) => {
            const catTools     = tools.filter((t) => t.category === cat.id)
            const catInstalled = catTools.filter((t) => t.installed).length
            if (!catTools.length) return null
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={text.label}>{cat.label}</span>
                  <span className={clsx(text.dim, 'opacity-60')}>{catInstalled}/{catTools.length}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {catTools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      hasUpdate={!!tool.wingetId && upgradeableIds.has(tool.wingetId.toLowerCase())}
                      actionState={actionStates[tool.id]}
                      onAction={(id, action) => void runAction(id, action)}
                      isSelected={selected === tool.id}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Log panel ── */}
      {selectedTool && (
        <div className={clsx(logPanel.container, 'mt-4')}>
          <div className={logPanel.header}>
            <Terminal size={12} className="text-cyber-cyan" />
            <span className={text.value}>{selectedTool.label.toUpperCase()}</span>
            <span className={clsx('text-[10px] font-mono ml-auto', {
              [status.running]: selectedState?.status === 'running',
              [status.done]:    selectedState?.status === 'done',
              [status.error]:   selectedState?.status === 'error',
              [text.dim]:       !selectedState || selectedState.status === 'idle',
            })}>
              {selectedState?.status === 'running' ? '● RUNNING'
                : selectedState?.status === 'done'    ? '● DONE · EXIT 0'
                : selectedState?.status === 'error'   ? `● ERROR · EXIT ${selectedState.exitCode}`
                : selectedTool.version
                  ? `v${selectedTool.version.replace(/^v/, '')}`
                  : selectedTool.installed ? 'installed' : 'not installed'}
            </span>
          </div>
          <div ref={logRef} className={clsx(logPanel.body, 'h-56')} style={{ scrollBehavior: 'smooth' }}>
            {!selectedState?.lines.length && (
              <span className={text.dim}>
                {selectedTool.installed
                  ? 'Tool installed. Click UPDATE to upgrade via winget.'
                  : selectedTool.wingetId
                    ? 'Click INSTALL to install via winget.'
                    : selectedTool.installNote
                      ? `Install manually: ${selectedTool.installNote}`
                      : 'Not available via winget.'}
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
