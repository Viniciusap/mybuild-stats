'use client'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  accent?: 'cyan' | 'amber' | 'green' | 'red' | 'purple'
  children: React.ReactNode
  width?: 'sm' | 'md' | 'lg'
}

const ACCENT = {
  cyan:   { border: 'border-cyber-cyan/30',   text: 'text-cyber-cyan',   dot: 'bg-cyber-cyan' },
  amber:  { border: 'border-cyber-amber/30',  text: 'text-cyber-amber',  dot: 'bg-cyber-amber' },
  green:  { border: 'border-cyber-green/30',  text: 'text-cyber-green',  dot: 'bg-cyber-green' },
  red:    { border: 'border-cyber-red/30',    text: 'text-cyber-red',    dot: 'bg-cyber-red' },
  purple: { border: 'border-cyber-purple/30', text: 'text-cyber-purple', dot: 'bg-cyber-purple' },
}

const WIDTH = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl' }

export default function Modal({ open, onClose, title, subtitle, accent = 'cyan', children, width = 'md' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const a = ACCENT[accent]

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-cyber-bg/80 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={ref}
        className={clsx(
          'relative w-full rounded-lg border bg-cyber-panel shadow-panel animate-slide-up overflow-hidden',
          WIDTH[width], a.border
        )}
      >
        {/* Header */}
        <div className={clsx('flex items-center gap-2.5 px-4 py-3 border-b', a.border)}>
          <span className={clsx('w-2 h-2 rounded-full shrink-0', a.dot)} />
          <div className="flex-1 min-w-0">
            <p className={clsx('text-sm font-mono font-bold tracking-wide', a.text)}>{title}</p>
            {subtitle && <p className="text-[11px] font-mono text-cyber-text-dim mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-cyber-text-dim hover:text-cyber-text transition-colors shrink-0 p-0.5"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
