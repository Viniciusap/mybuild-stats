'use client'
import { useState } from 'react'
import GlowCard from './GlowCard'
import NeonProgress from './NeonProgress'
import UpgradeDetailModal from './UpgradeDetailModal'
import { formatBRL } from '@/lib/utils'
import type { UpgradeTarget, PriceRecord } from '@/types'
import { Radar, TrendingDown, Search, Loader2, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import upgradePath from '@/data/upgrade-path.json'

interface Props {
  prices: PriceRecord[]
  onTriggerCheck?: () => void
  checking?: boolean
}

function TargetRow({
  target,
  prices,
  onClick,
}: {
  target: UpgradeTarget
  prices: PriceRecord[]
  onClick: () => void
}) {
  const targetPrices = prices.filter(p => p.componentId === target.id)
  const cheapest = targetPrices.length ? targetPrices.reduce((a, b) => (a.price < b.price ? a : b)) : null
  const progress = cheapest ? Math.round(((target.estimatedPrice - cheapest.price) / target.estimatedPrice) * 100) : 0
  const belowTrigger = cheapest ? cheapest.price <= target.triggerPrice : false
  const hasDiscount = progress >= 10

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left rounded border p-2.5 transition-all hover:border-cyber-cyan/40 hover:bg-cyber-panel/60 group',
        belowTrigger ? 'border-cyber-amber/40 bg-cyber-amber/5' : 'border-cyber-border bg-cyber-bg/40'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="text-xs font-mono font-bold text-cyber-text truncate group-hover:text-cyber-cyan transition-colors">
            {target.name}
          </p>
          <p className="text-[11px] font-mono text-cyber-text-dim truncate">{target.notes}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="text-right">
            {cheapest ? (
              <>
                <p className={clsx('text-xs font-mono font-bold', belowTrigger ? 'text-cyber-amber' : 'text-cyber-cyan')}>
                  {formatBRL(cheapest.price)}
                </p>
                <p className="text-[10px] font-mono text-cyber-text-dim">{cheapest.store}</p>
              </>
            ) : (
              <p className="text-[10px] font-mono text-cyber-text-dim">—</p>
            )}
          </div>
          <ChevronRight size={12} className="text-cyber-text-dim group-hover:text-cyber-cyan transition-colors mt-0.5" />
        </div>
      </div>

      <div className="flex justify-between text-[10px] font-mono text-cyber-text-dim mb-1">
        <span>Trigger: {formatBRL(target.triggerPrice)}</span>
        <span>Ref: {formatBRL(target.estimatedPrice)}</span>
      </div>

      <NeonProgress
        value={cheapest ? Math.max(0, cheapest.price) : target.estimatedPrice}
        max={target.estimatedPrice}
        accent={belowTrigger ? 'amber' : hasDiscount ? 'green' : 'cyan'}
        showValue={false}
        size="sm"
      />

      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-cyber-green/10 text-cyber-green">
          +{target.performanceGain}% PERF
        </span>
        {hasDiscount && cheapest && (
          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-cyber-amber/10 text-cyber-amber">
            <TrendingDown size={9} className="inline mr-0.5" />{progress}% OFF
          </span>
        )}
        {belowTrigger && (
          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-cyber-amber/20 text-cyber-amber font-bold">
            ★ COMPRAR
          </span>
        )}
      </div>
    </button>
  )
}

export default function UpgradeRadar({ prices, onTriggerCheck, checking }: Props) {
  const [selectedTarget, setSelectedTarget] = useState<UpgradeTarget | null>(null)

  const allTargets = [
    ...upgradePath.cpu.targets,
    ...upgradePath.gpu.targets,
    ...upgradePath.ram.targets,
    ...upgradePath.storage.targets,
  ] as UpgradeTarget[]

  const hasAnyPrice = prices.length > 0

  return (
    <>
      <GlowCard accent="amber" className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Radar size={15} className="text-cyber-amber" />
          <span className="text-xs font-mono font-bold text-cyber-amber tracking-widest uppercase">
            Upgrade Radar
          </span>
          <span className="ml-auto text-[11px] font-mono text-cyber-text-dim">
            {allTargets.length} targets
          </span>
          {onTriggerCheck && (
            <button
              onClick={onTriggerCheck}
              disabled={checking}
              className="flex items-center gap-1 text-[10px] font-mono text-cyber-text-dim hover:text-cyber-amber transition-colors disabled:opacity-50"
            >
              {checking
                ? <><Loader2 size={10} className="animate-spin" /> BUSCANDO…</>
                : <><Search size={10} /> BUSCAR</>
              }
            </button>
          )}
        </div>

        {!hasAnyPrice ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <Search size={20} className="text-cyber-text-dim opacity-40" />
            <p className="text-xs font-mono text-cyber-text-dim">Sem dados de preço</p>
            <p className="text-[11px] font-mono text-cyber-text-dim opacity-60">
              Clique em BUSCAR para verificar preços via DuckDuckGo
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {allTargets.map(target => (
              <TargetRow
                key={target.id}
                target={target}
                prices={prices}
                onClick={() => setSelectedTarget(target)}
              />
            ))}
          </div>
        )}
      </GlowCard>

      <UpgradeDetailModal
        target={selectedTarget}
        prices={prices}
        onClose={() => setSelectedTarget(null)}
      />
    </>
  )
}
