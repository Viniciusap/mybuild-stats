'use client'
import GlowCard from './GlowCard'
import NeonProgress from './NeonProgress'
import { formatBRL } from '@/lib/utils'
import type { UpgradeTarget, PriceRecord } from '@/types'
import { Radar, TrendingDown, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import upgradePath from '@/data/upgrade-path.json'

interface Props {
  prices: PriceRecord[]
}

function TargetRow({
  target,
  prices,
}: {
  target: UpgradeTarget
  prices: PriceRecord[]
}) {
  const targetPrices = prices.filter((p) => p.componentId === target.id)
  const cheapest = targetPrices.length
    ? targetPrices.reduce((a, b) => (a.price < b.price ? a : b))
    : null

  const progress = cheapest
    ? Math.round(((target.estimatedPrice - cheapest.price) / target.estimatedPrice) * 100)
    : 0

  const belowTrigger = cheapest ? cheapest.price <= target.triggerPrice : false
  const hasDiscount = progress >= 10

  return (
    <div
      className={clsx(
        'rounded-md border p-3 transition-all',
        belowTrigger
          ? 'border-cyber-amber/40 bg-cyber-amber/5'
          : 'border-cyber-border bg-cyber-bg/40'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-mono font-bold text-cyber-text">{target.name}</p>
          <p className="text-xs font-mono text-cyber-text-dim">{target.notes}</p>
        </div>
        <div className="text-right shrink-0">
          {cheapest ? (
            <>
              <p
                className={clsx(
                  'text-sm font-mono font-bold',
                  belowTrigger ? 'text-cyber-amber' : 'text-cyber-cyan'
                )}
              >
                {formatBRL(cheapest.price)}
              </p>
              <p className="text-xs font-mono text-cyber-text-dim">{cheapest.store}</p>
            </>
          ) : (
            <p className="text-xs font-mono text-cyber-text-dim italic">no data</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs font-mono text-cyber-text-dim">
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
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <span
            className={clsx(
              'text-xs font-mono px-1.5 py-0.5 rounded',
              `bg-cyber-green/10 text-cyber-green`
            )}
          >
            +{target.performanceGain}% PERF
          </span>
          {hasDiscount && cheapest && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-cyber-amber/10 text-cyber-amber">
              <TrendingDown size={10} className="inline mr-0.5" />
              {progress}% OFF
            </span>
          )}
        </div>
        {cheapest?.url && (
          <a
            href={cheapest.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-cyber-text-dim hover:text-cyber-cyan flex items-center gap-1 transition-colors"
          >
            VER <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  )
}

export default function UpgradeRadar({ prices }: Props) {
  const allTargets = [
    ...upgradePath.cpu.targets,
    ...upgradePath.gpu.targets,
    ...upgradePath.ram.targets,
    ...upgradePath.storage.targets,
  ] as UpgradeTarget[]

  return (
    <GlowCard accent="amber" className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Radar size={16} className="text-cyber-amber" />
        <span className="text-xs font-mono font-bold text-cyber-amber tracking-widest uppercase">
          Upgrade Radar
        </span>
        <span className="ml-auto text-xs font-mono text-cyber-text-dim">
          {allTargets.length} targets
        </span>
      </div>

      <div className="space-y-3">
        {allTargets.map((target) => (
          <TargetRow key={target.id} target={target} prices={prices} />
        ))}
      </div>
    </GlowCard>
  )
}
