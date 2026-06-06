'use client'
import GlowCard from './GlowCard'
import { formatBRL, estimateResaleValue, ageInMonths, formatAge, getUpgradeTiming } from '@/lib/utils'
import { TrendingUp, Clock, Zap, ArrowUpRight, AlertTriangle, CheckCircle, type LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'
import upgradePath from '@/data/upgrade-path.json'
import type { HardwareSnapshot, PriceRecord } from '@/types'

interface ComponentAnalysis {
  label: string
  category: 'cpu' | 'gpu'
  current: string
  purchasePrice: number
  ageStr: string
  resaleValue: number
  depreciationPct: number
  monthlyDepr: number
  target: string
  targetId: string
  targetPrice: number
  livePrice: number | null
  netCost: number
  perfGain: number
  efficiency: number
  timing: ReturnType<typeof getUpgradeTiming>
}

function buildAnalysis(prices: PriceRecord[], detectedCpu?: string, detectedGpu?: string): ComponentAnalysis[] {
  const sections = [
    { label: 'CPU', category: 'cpu' as const, current: detectedCpu ?? upgradePath.cpu.current, src: upgradePath.cpu },
    { label: 'GPU', category: 'gpu' as const, current: detectedGpu ?? upgradePath.gpu.current, src: upgradePath.gpu },
  ]
  return sections.map(({ label, category, current, src }) => {
    const resale = estimateResaleValue(src.purchasePrice, src.purchaseDate, category)
    const deprPct = Math.round(((src.purchasePrice - resale) / src.purchasePrice) * 100)
    const monthlyDepr = Math.round(src.purchasePrice * (category === 'gpu' ? 0.018 : 0.012))
    const target = src.targets[0]

    // Use cheapest live price when available, fall back to estimatedPrice
    const targetPrices = prices.filter(p => p.componentId === target.id)
    const cheapest = targetPrices.length ? targetPrices.reduce((a, b) => a.price < b.price ? a : b) : null
    const livePrice = cheapest?.price ?? null
    const effectivePrice = livePrice ?? target.estimatedPrice

    const netCost = effectivePrice - resale
    const efficiency = netCost > 0 ? Math.round(netCost / target.performanceGain) : 0
    return {
      label, category, current,
      purchasePrice: src.purchasePrice,
      ageStr: formatAge(src.purchaseDate),
      resaleValue: resale,
      depreciationPct: deprPct,
      monthlyDepr,
      target: target.name,
      targetId: target.id,
      livePrice,
      targetPrice: target.estimatedPrice,
      netCost,
      perfGain: target.performanceGain,
      efficiency,
      timing: getUpgradeTiming(src.purchaseDate, category),
    }
  })
}

function TimingBadge({ timing }: { timing: ReturnType<typeof getUpgradeTiming> }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-mono font-bold px-1.5 py-0.5 rounded border', timing.color)}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', timing.dot)} />
      {timing.label}
    </span>
  )
}

function InsightCard({ icon: Icon, label, value, sub, accent = 'cyan' }: {
  icon: LucideIcon; label: string; value: string; sub?: string; accent?: 'cyan' | 'green' | 'amber'
}) {
  const c = {
    cyan:  'text-cyber-cyan border-cyber-cyan/20 bg-cyber-cyan/5',
    green: 'text-cyber-green border-cyber-green/20 bg-cyber-green/5',
    amber: 'text-cyber-amber border-cyber-amber/20 bg-cyber-amber/5',
  }[accent]
  return (
    <div className={clsx('flex-1 rounded border p-2.5', c)}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className={c.split(' ')[0]} />
        <span className="text-[10px] font-mono text-cyber-text-dim uppercase tracking-wider">{label}</span>
      </div>
      <p className={clsx('text-sm font-mono font-bold', c.split(' ')[0])}>{value}</p>
      {sub && <p className="text-[11px] font-mono text-cyber-text-dim mt-0.5">{sub}</p>}
    </div>
  )
}

export default function ComparisonTable({ hw, prices = [] }: { hw?: HardwareSnapshot; prices?: PriceRecord[] }) {
  const rows = buildAnalysis(prices, hw?.cpu.brand, hw?.gpu[0]?.name)
  const totalResale = rows.reduce((s, r) => s + r.resaleValue, 0)
  const effectiveNetTotal = rows.reduce((s, r) => s + r.netCost, 0)
  const totalMonthlyDepr = rows.reduce((s, r) => s + r.monthlyDepr, 0)
  const bestEfficiency = rows.reduce((a, b) => (a.efficiency < b.efficiency ? a : b))
  const optimalRow = rows.find(r => r.timing.label === 'OPTIMAL')

  return (
    <GlowCard accent="cyan" className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <TrendingUp size={15} className="text-cyber-cyan" />
        <span className="text-xs font-mono font-bold text-cyber-cyan tracking-widest uppercase">
          Upgrade & Depreciation
        </span>
      </div>

      {/* Main table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-separate" style={{ borderSpacing: '0 2px' }}>
          <thead>
            <tr className="text-cyber-text-dim">
              {['', 'CURRENT', 'AGE', 'TARGET', 'PRICE', 'RESALE', 'NET', 'GAIN', 'TIMING'].map(h => (
                <th key={h} className={clsx('py-1 pr-2', h === 'TIMING' ? 'text-center' : h === '' ? 'text-left' : 'text-right')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label} className="bg-cyber-bg/40 hover:bg-cyber-border/20 transition-colors">
                <td className="py-2 pr-2 font-bold text-cyber-text-dim pl-1 rounded-l">{row.label}</td>
                <td className="py-2 pr-2 text-right text-cyber-text max-w-[80px] truncate">
                  {row.current.replace('AMD ', '').replace('NVIDIA GeForce ', '')}
                </td>
                <td className="py-2 pr-2 text-right text-cyber-text-dim">
                  <span className="flex items-center justify-end gap-0.5"><Clock size={9} />{row.ageStr}</span>
                </td>
                <td className="py-2 pr-2 text-right">
                  <span className="flex items-center justify-end gap-0.5 text-cyber-cyan">
                    <ArrowUpRight size={9} />
                    {row.target.replace('AMD ', '').replace('NVIDIA GeForce ', '')}
                  </span>
                </td>
                <td className="py-2 pr-2 text-right">
                  {row.livePrice ? (
                    <span className="text-cyber-green font-bold">{formatBRL(row.livePrice)}</span>
                  ) : (
                    <span className="text-cyber-text-dim">{formatBRL(row.targetPrice)}</span>
                  )}
                </td>
                <td className="py-2 pr-2 text-right text-cyber-green">−{formatBRL(row.resaleValue)}</td>
                <td className="py-2 pr-2 text-right font-bold text-cyber-amber">{formatBRL(row.netCost)}</td>
                <td className="py-2 pr-2 text-right font-bold text-cyber-green">+{row.perfGain}%</td>
                <td className="py-2 text-center rounded-r"><TimingBadge timing={row.timing} /></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-cyber-text-dim border-t border-cyber-border">
              <td colSpan={5} className="pt-2 text-right pr-2 font-bold">TOTAL</td>
              <td className="pt-2 pr-2 text-right text-cyber-green font-bold">−{formatBRL(totalResale)}</td>
              <td className="pt-2 pr-2 text-right text-cyber-amber font-bold">{formatBRL(effectiveNetTotal)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Insight cards */}
      <div className="flex flex-wrap gap-2">
        <InsightCard icon={Zap} label="Best value" value={bestEfficiency.label}
          sub={`${formatBRL(bestEfficiency.efficiency)} per 1% gain`} accent="green" />
        {optimalRow ? (
          <InsightCard icon={CheckCircle} label="Optimal window" value={optimalRow.label}
            sub={`${optimalRow.timing.remainingValuePct}% value remaining`} accent="cyan" />
        ) : (
          <InsightCard icon={AlertTriangle} label="No ideal window" value="Wait"
            sub="High resale — hold for now" accent="amber" />
        )}
        <InsightCard icon={Clock} label="Depreciation/mo" value={`~${formatBRL(totalMonthlyDepr)}/mo`}
          sub="Combined hardware cost" accent="amber" />
      </div>
    </GlowCard>
  )
}
