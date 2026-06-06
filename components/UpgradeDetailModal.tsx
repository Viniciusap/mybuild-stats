'use client'
import Modal from './Modal'
import { formatBRL } from '@/lib/utils'
import { ExternalLink, TrendingDown, ShoppingCart, Star, AlertTriangle, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'
import type { UpgradeTarget, PriceRecord } from '@/types'

interface Props {
  target: UpgradeTarget | null
  prices: PriceRecord[]
  onClose: () => void
}

export default function UpgradeDetailModal({ target, prices, onClose }: Props) {
  if (!target) return null

  const targetPrices = prices
    .filter(p => p.componentId === target.id)
    .sort((a, b) => a.price - b.price)

  const cheapest = targetPrices[0] ?? null
  const hasData = targetPrices.length > 0

  const discountPct = cheapest
    ? Math.round(((target.estimatedPrice - cheapest.price) / target.estimatedPrice) * 100)
    : 0

  const belowTrigger = cheapest ? cheapest.price <= target.triggerPrice : false

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title={target.name}
      subtitle={target.notes}
      accent={belowTrigger ? 'amber' : 'cyan'}
      width="md"
    >
      <div className="space-y-4">

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded border border-cyber-green/30 bg-cyber-green/5 text-cyber-green">
            <TrendingDown size={11} />
            +{target.performanceGain}% performance
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded border border-cyber-border/40 bg-cyber-bg/50 text-cyber-text-dim">
            Trigger: {formatBRL(target.triggerPrice)}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded border border-cyber-border/40 bg-cyber-bg/50 text-cyber-text-dim">
            Ref: {formatBRL(target.estimatedPrice)}
          </span>
          {belowTrigger && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded border border-cyber-amber/30 bg-cyber-amber/5 text-cyber-amber font-bold">
              <Star size={11} />
              ABAIXO DO TRIGGER!
            </span>
          )}
        </div>

        {/* Price alert */}
        {hasData && discountPct >= 10 && (
          <div className={clsx(
            'flex items-center gap-2 px-3 py-2.5 rounded border',
            belowTrigger
              ? 'border-cyber-amber/30 bg-cyber-amber/5'
              : 'border-cyber-green/30 bg-cyber-green/5'
          )}>
            <CheckCircle size={14} className={belowTrigger ? 'text-cyber-amber' : 'text-cyber-green'} />
            <p className={clsx('text-[11px] font-mono font-bold', belowTrigger ? 'text-cyber-amber' : 'text-cyber-green')}>
              Melhor preço {discountPct}% abaixo da referência
              {belowTrigger ? ' — abaixo do trigger, momento de comprar!' : ''}
            </p>
          </div>
        )}

        {/* Store prices */}
        <div>
          <p className="text-[10px] font-mono text-cyber-cyan font-bold tracking-widest uppercase mb-2">
            {hasData
              ? `Preços encontrados (${targetPrices.length} ${targetPrices.length === 1 ? 'loja' : 'lojas'})`
              : 'Preços'}
          </p>

          {!hasData ? (
            <div className="flex flex-col items-center py-6 gap-2 text-center rounded border border-cyber-border/30 bg-cyber-bg/20">
              <ShoppingCart size={18} className="text-cyber-text-dim opacity-40" />
              <p className="text-xs font-mono text-cyber-text-dim">Sem dados de preço</p>
              <p className="text-[11px] font-mono text-cyber-text-dim opacity-60">
                Clique em BUSCAR no Upgrade Radar para verificar preços
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {targetPrices.map((record, i) => {
                const isCheapest = i === 0
                const recordDiscount = Math.round(((target.estimatedPrice - record.price) / target.estimatedPrice) * 100)
                const recordBelowTrigger = record.price <= target.triggerPrice

                return (
                  <div
                    key={`${record.store}-${i}`}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded border transition-colors',
                      recordBelowTrigger
                        ? 'border-cyber-amber/40 bg-cyber-amber/5'
                        : isCheapest
                          ? 'border-cyber-green/30 bg-cyber-green/5'
                          : 'border-cyber-border/40 bg-cyber-bg/30'
                    )}
                  >
                    {/* Rank */}
                    <span className={clsx(
                      'text-[10px] font-mono font-bold w-5 text-center shrink-0',
                      isCheapest ? 'text-cyber-green' : 'text-cyber-text-dim'
                    )}>
                      #{i + 1}
                    </span>

                    {/* Store */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-bold text-cyber-text">{record.store}</p>
                      {record.timestamp && (
                        <p className="text-[10px] font-mono text-cyber-text-dim">
                          Verificado {new Date(record.timestamp).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>

                    {/* Price + discount */}
                    <div className="text-right shrink-0">
                      <p className={clsx('text-sm font-mono font-bold',
                        recordBelowTrigger ? 'text-cyber-amber' : isCheapest ? 'text-cyber-green' : 'text-cyber-text'
                      )}>
                        {formatBRL(record.price)}
                      </p>
                      {recordDiscount > 0 && (
                        <p className="text-[10px] font-mono text-cyber-green">
                          {recordDiscount}% OFF
                        </p>
                      )}
                      {recordDiscount < 0 && (
                        <p className="text-[10px] font-mono text-cyber-red">
                          +{Math.abs(recordDiscount)}% acima ref.
                        </p>
                      )}
                    </div>

                    {/* Link */}
                    {record.url && (
                      <a
                        href={record.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] font-mono text-cyber-text-dim hover:text-cyber-cyan transition-colors shrink-0 border border-cyber-border/40 rounded px-2 py-1 hover:border-cyber-cyan/40"
                      >
                        VER <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* No discount warning */}
        {hasData && discountPct < 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded border border-cyber-red/20 bg-cyber-red/5">
            <AlertTriangle size={12} className="text-cyber-red shrink-0" />
            <p className="text-[11px] font-mono text-cyber-red">
              Preço atual acima da referência — aguarde promoção
            </p>
          </div>
        )}

        {/* Ref note */}
        <p className="text-[10px] font-mono text-cyber-text-dim opacity-60">
          Preços verificados diretamente nas lojas. Confirme antes de comprar.
        </p>
      </div>
    </Modal>
  )
}
