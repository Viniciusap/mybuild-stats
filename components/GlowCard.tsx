'use client'
import { clsx } from 'clsx'

type Accent = 'cyan' | 'green' | 'purple' | 'amber' | 'red'

interface Props {
  accent?: Accent
  className?: string
  children: React.ReactNode
  glow?: boolean
}

const accentMap: Record<Accent, string> = {
  cyan: 'border-cyber-cyan/20 hover:border-cyber-cyan/40 hover:shadow-neon-cyan',
  green: 'border-cyber-green/20 hover:border-cyber-green/40 hover:shadow-neon-green',
  purple: 'border-cyber-purple/20 hover:border-cyber-purple/40 hover:shadow-neon-purple',
  amber: 'border-cyber-amber/20 hover:border-cyber-amber/40 hover:shadow-neon-amber',
  red: 'border-cyber-red/20 hover:border-cyber-red/40 hover:shadow-neon-red',
}

const glowMap: Record<Accent, string> = {
  cyan: 'shadow-neon-cyan',
  green: 'shadow-neon-green',
  purple: 'shadow-neon-purple',
  amber: 'shadow-neon-amber',
  red: 'shadow-neon-red',
}

export default function GlowCard({ accent = 'cyan', className, children, glow }: Props) {
  return (
    <div
      className={clsx(
        'relative rounded-lg border bg-cyber-panel/80 backdrop-blur-sm',
        'transition-all duration-300 shadow-panel',
        accentMap[accent],
        glow && glowMap[accent],
        className
      )}
    >
      {/* Top accent line */}
      <div
        className={clsx(
          'absolute top-0 left-4 right-4 h-px opacity-60',
          {
            'bg-cyber-cyan': accent === 'cyan',
            'bg-cyber-green': accent === 'green',
            'bg-cyber-purple': accent === 'purple',
            'bg-cyber-amber': accent === 'amber',
            'bg-cyber-red': accent === 'red',
          }
        )}
      />
      {children}
    </div>
  )
}
