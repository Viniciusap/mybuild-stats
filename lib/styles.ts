/**
 * Shared Tailwind class constants for common UI patterns.
 * Import specific objects and compose with clsx() as needed.
 */

// ── Buttons ─────────────────────────────────────────────────────────────────

export const btn = {
  base: 'inline-flex items-center gap-1.5 rounded border font-mono font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  // sizes
  sm: 'px-2.5 py-1 text-[11px]',
  md: 'px-3 py-1.5 text-xs',
  // variants
  primary: 'text-cyber-cyan  border-cyber-cyan/40  hover:bg-cyber-cyan/10  hover:border-cyber-cyan/60',
  warning: 'text-cyber-amber border-cyber-amber/40 hover:bg-cyber-amber/10 hover:border-cyber-amber/60',
  danger:  'text-cyber-red   border-cyber-red/40   hover:bg-cyber-red/10   hover:border-cyber-red/60',
  ghost:   'text-cyber-text-dim border-transparent hover:text-cyber-text hover:border-cyber-border/40',
} as const

// ── Badges ───────────────────────────────────────────────────────────────────

export const badge = {
  base: 'inline-flex items-center gap-1 font-mono font-bold rounded leading-none',
  // sizes
  xs: 'text-[9px]  px-1   py-0.5',
  sm: 'text-[10px] px-1.5 py-0.5',
  // variants
  success: 'text-cyber-green border border-cyber-green/30 bg-cyber-green/10',
  error:   'text-cyber-red   border border-cyber-red/30   bg-cyber-red/10',
  warning: 'text-cyber-amber border border-cyber-amber/30 bg-cyber-amber/10',
  info:    'text-cyber-cyan  border border-cyber-cyan/30  bg-cyber-cyan/10',
  neutral: 'text-cyber-text-dim border border-cyber-border/40',
} as const

// ── Cards ────────────────────────────────────────────────────────────────────

export const card = {
  base:    'rounded-lg border bg-cyber-panel/80',
  default: 'border-cyber-border',
  active:  'border-cyber-cyan/50',
  muted:   'border-cyber-border/30 opacity-50',
} as const

// ── Typography ───────────────────────────────────────────────────────────────

export const text = {
  // section/page headings
  heading:  'text-sm font-mono font-bold text-cyber-cyan tracking-widest',
  // small uppercase labels (category headers, column labels)
  label:    'text-[10px] font-mono font-bold text-cyber-text-dim tracking-widest uppercase',
  // muted descriptive text
  dim:      'text-[11px] font-mono text-cyber-text-dim',
  // monospace value display
  value:    'text-xs font-mono font-bold text-cyber-text',
  // accent value (highlighted number/version)
  accent:   'text-xs font-mono font-bold text-cyber-cyan',
} as const

// ── Status indicators ────────────────────────────────────────────────────────

export const status = {
  running:   'text-cyber-cyan animate-pulse',
  done:      'text-cyber-green',
  error:     'text-cyber-red',
  compliant: 'text-cyber-green',
  executed:  'text-cyber-cyan',
  idle:      'text-cyber-text-dim',
  warning:   'text-cyber-amber',
} as const

// ── Log / Terminal panel ─────────────────────────────────────────────────────

export const logPanel = {
  container: 'rounded-lg border border-cyber-border bg-cyber-bg overflow-hidden',
  header:    'flex items-center gap-2 px-3 py-2 border-b border-cyber-border bg-cyber-panel/60',
  body:      'overflow-y-auto p-3 text-[11px] font-mono leading-relaxed',
  lineOk:    'text-cyber-text',
  lineErr:   'text-cyber-red',
} as const
