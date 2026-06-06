'use client'
import Modal from './Modal'
import { clsx } from 'clsx'
import { CheckCircle, XCircle, AlertTriangle, HelpCircle, ShieldOff, Lock, Info } from 'lucide-react'
import type { OptimizationCheck, CheckStatus } from '@/types/optimization'

const STATUS_LABEL: Record<CheckStatus, { label: string; icon: React.ReactNode; color: string }> = {
  optimal:           { label: 'Otimizado',         icon: <CheckCircle size={14} />,  color: 'text-cyber-green' },
  suboptimal:        { label: 'Requer atenção',    icon: <XCircle size={14} />,     color: 'text-cyber-red' },
  info:              { label: 'Informação',        icon: <Info size={14} />,        color: 'text-cyber-amber' },
  unknown:           { label: 'Desconhecido',      icon: <HelpCircle size={14} />,  color: 'text-cyber-text-dim' },
  not_applicable:    { label: 'Não aplicável',     icon: <ShieldOff size={14} />,   color: 'text-cyber-text-dim' },
  error:             { label: 'Erro',              icon: <XCircle size={14} />,     color: 'text-cyber-red' },
  permission_denied: { label: 'Sem permissão',     icon: <Lock size={14} />,        color: 'text-cyber-purple' },
  managed_by_policy: { label: 'Gerenciado (GPO)', icon: <Lock size={14} />,        color: 'text-cyber-purple' },
}

const IMPACT_LABEL: Record<string, { label: string; color: string }> = {
  high:   { label: 'Alto impacto', color: 'text-cyber-red' },
  medium: { label: 'Médio impacto', color: 'text-cyber-amber' },
  low:    { label: 'Baixo impacto', color: 'text-cyber-text-dim' },
  info:   { label: 'Informativo', color: 'text-cyber-text-dim' },
}

const ACCENT_MAP: Record<CheckStatus, 'cyan' | 'amber' | 'green' | 'red' | 'purple'> = {
  optimal:           'green',
  suboptimal:        'red',
  info:              'amber',
  unknown:           'cyan',
  not_applicable:    'cyan',
  error:             'red',
  permission_denied: 'purple',
  managed_by_policy: 'purple',
}

// Split "Settings → Display → Graphics → Enable X → Reboot" into steps
function parseSteps(instructions: string): string[] {
  return instructions
    .split(/→|;|\n/)
    .map(s => s.trim())
    .filter(Boolean)
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-cyber-border/20 last:border-0">
      <span className="text-[11px] font-mono text-cyber-text-dim w-28 shrink-0 pt-0.5">{label}</span>
      <span className={clsx('text-[11px] font-mono flex-1', valueClass ?? 'text-cyber-text')}>{value}</span>
    </div>
  )
}

interface Props {
  check: OptimizationCheck | null
  onClose: () => void
}

export default function OptimizationModal({ check, onClose }: Props) {
  if (!check) return null

  const st = STATUS_LABEL[check.status]
  const imp = IMPACT_LABEL[check.impact]
  const steps = check.fixInstructions ? parseSteps(check.fixInstructions) : []
  const accent = ACCENT_MAP[check.status]

  return (
    <Modal
      open={!!check}
      onClose={onClose}
      title={check.name}
      subtitle={check.description}
      accent={accent}
      width="md"
    >
      <div className="space-y-4">

        {/* Status + impact */}
        <div className="flex flex-wrap gap-2">
          <div className={clsx('flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1.5 rounded border', {
            'border-cyber-green/30 bg-cyber-green/5 text-cyber-green':  accent === 'green',
            'border-cyber-red/30 bg-cyber-red/5 text-cyber-red':        accent === 'red',
            'border-cyber-amber/30 bg-cyber-amber/5 text-cyber-amber':  accent === 'amber',
            'border-cyber-purple/30 bg-cyber-purple/5 text-cyber-purple': accent === 'purple',
            'border-cyber-border bg-cyber-bg text-cyber-text-dim':      accent === 'cyan',
          })}>
            {st.icon}
            {st.label}
          </div>
          <div className={clsx('flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded border border-cyber-border/50 bg-cyber-bg/50', imp.color)}>
            <AlertTriangle size={12} />
            {imp.label}
          </div>
        </div>

        {/* Current / Recommended */}
        <div className="rounded border border-cyber-border/40 bg-cyber-bg/30 overflow-hidden">
          {check.currentValue && (
            <Row label="Estado atual" value={check.currentValue} />
          )}
          {check.recommendedValue && (
            <Row label="Recomendado" value={check.recommendedValue} valueClass="text-cyber-green" />
          )}
          {check.reason && (
            <Row label="Observação" value={check.reason} valueClass="text-cyber-amber" />
          )}
        </div>

        {/* Fix steps */}
        {steps.length > 0 && (
          <div>
            <p className="text-[10px] font-mono text-cyber-cyan font-bold tracking-widest uppercase mb-2">
              Como corrigir
            </p>
            <ol className="space-y-2">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-[10px] font-mono font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[11px] font-mono text-cyber-text leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* No fix needed */}
        {check.status === 'optimal' && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded border border-cyber-green/20 bg-cyber-green/5">
            <CheckCircle size={14} className="text-cyber-green shrink-0" />
            <p className="text-[11px] font-mono text-cyber-green">Nenhuma ação necessária. Configuração otimizada.</p>
          </div>
        )}

        {check.status === 'not_applicable' && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded border border-cyber-border/30 bg-cyber-bg/30">
            <ShieldOff size={14} className="text-cyber-text-dim shrink-0" />
            <p className="text-[11px] font-mono text-cyber-text-dim">Check não aplicável para este hardware/sistema.</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
