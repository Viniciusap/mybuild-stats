'use client'
import GlowCard from './GlowCard'
import { formatBRL, estimateResaleValue, ageInMonths, formatAge, getUpgradeTiming } from '@/lib/utils'
import { TrendingUp, Clock, Zap, ArrowUpRight, AlertTriangle, CheckCircle, type LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'
import upgradePath from '@/data/upgrade-path.json'
import type { HardwareSnapshot } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComponentAnalysis {
  label: string
  category: 'cpu' | 'gpu' | 'ram' | 'storage'
  current: string
  purchasePrice: number
  purchaseDate: string
  ageMonths: number
  ageStr: string
  resaleValue: number
  depreciationPct: number
  monthlyDepr: number
  target: string
  targetPrice: number
  netCost: number
  perfGain: number
  efficiency: number       // R$ per 1% gain
  timing: ReturnType<typeof getUpgradeTiming>
}

// ─── Build analysis ───────────────────────────────────────────────────────────

// detectedCpu / detectedGpu: from live hardware read — overrides JSON names
function buildAnalysis(detectedCpu?: string, detectedGpu?: string): ComponentAnalysis[] {
  const sections: Array<{
    label: string
    category: 'cpu' | 'gpu'
    current: string
    src: typeof upgradePath.cpu | typeof upgradePath.gpu
  }> = [
    {
      label: 'CPU',
      category: 'cpu',
      current: detectedCpu ?? upgradePath.cpu.current,
      src: upgradePath.cpu,
    },
    {
      label: 'GPU',
      category: 'gpu',
      current: detectedGpu ?? upgradePath.gpu.current,
      src: upgradePath.gpu,
    },
  ]

  return sections.map(({ label, category, current, src }) => {
    const months = ageInMonths(src.purchaseDate)
    const resale = estimateResaleValue(src.purchasePrice, src.purchaseDate, category)
    const deprPct = Math.round(((src.purchasePrice - resale) / src.purchasePrice) * 100)
    const monthlyDepr = Math.round(src.purchasePrice * (category === 'gpu' ? 0.018 : 0.012))
    const target = src.targets[0]
    const netCost = target.estimatedPrice - resale
    const efficiency = netCost > 0 ? Math.round(netCost / target.performanceGain) : 0
    const timing = getUpgradeTiming(src.purchaseDate, category)

    return {
      label,
      category,
      current,
      purchasePrice: src.purchasePrice,
      purchaseDate: src.purchaseDate,
      ageMonths: months,
      ageStr: formatAge(src.purchaseDate),
      resaleValue: resale,
      depreciationPct: deprPct,
      monthlyDepr,
      target: target.name,
      targetPrice: target.estimatedPrice,
      netCost,
      perfGain: target.performanceGain,
      efficiency,
      timing,
    }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimingBadge({ timing }: { timing: ReturnType<typeof getUpgradeTiming> }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 text-xs font-mono font-bold px-1.5 py-0.5 rounded border',
        timing.color
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', timing.dot)} />
      {timing.label}
    </span>
  )
}

function InsightCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = 'cyan',
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  accent?: 'cyan' | 'green' | 'amber' | 'red'
}) {
  const colorMap = {
    cyan: 'text-cyber-cyan border-cyber-cyan/20 bg-cyber-cyan/5',
    green: 'text-cyber-green border-cyber-green/20 bg-cyber-green/5',
    amber: 'text-cyber-amber border-cyber-amber/20 bg-cyber-amber/5',
    red: 'text-cyber-red border-cyber-red/20 bg-cyber-red/5',
  }
  return (
    <div className={clsx('flex-1 rounded border p-2.5', colorMap[accent])}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className={colorMap[accent].split(' ')[0]} />
        <span className="text-xs font-mono text-cyber-text-dim uppercase tracking-wider">{label}</span>
      </div>
      <p className={clsx('text-sm font-mono font-bold', colorMap[accent].split(' ')[0])}>{value}</p>
      {sub && <p className="text-xs font-mono text-cyber-text-dim mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ComparisonTable({ hw }: { hw?: HardwareSnapshot }) {
  const rows = buildAnalysis(hw?.cpu.brand, hw?.gpu[0]?.name)
  const totalResale = rows.reduce((s, r) => s + r.resaleValue, 0)
  const totalUpgrade = rows.reduce((s, r) => s + r.targetPrice, 0)
  const netTotal = totalUpgrade - totalResale

  // Best efficiency (lowest R$/%)
  const bestEfficiency = rows.reduce((a, b) => (a.efficiency < b.efficiency ? a : b))
  // Most urgent timing
  const optimalRow = rows.find((r) => r.timing.label === 'OPTIMAL')
  const totalMonthlyDepr = rows.reduce((s, r) => s + r.monthlyDepr, 0)

  return (
    <GlowCard accent="cyan" className="p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp size={16} className="text-cyber-cyan" />
        <span className="text-xs font-mono font-bold text-cyber-cyan tracking-widest uppercase">
          Upgrade & Depreciation Analysis
        </span>
      </div>

      {/* ── Main comparison table ──────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-separate" style={{ borderSpacing: '0 2px' }}>
          <thead>
            <tr className="text-cyber-text-dim">
              <th className="text-left py-1 pr-2">COMPONENT</th>
              <th className="text-left py-1 pr-2">CURRENT</th>
              <th className="text-center py-1 pr-2">AGE</th>
              <th className="text-left py-1 pr-2">TARGET</th>
              <th className="text-right py-1 pr-2">PRICE</th>
              <th className="text-right py-1 pr-2">RESALE</th>
              <th className="text-right py-1 pr-2">NET COST</th>
              <th className="text-right py-1 pr-2">GAIN</th>
              <th className="text-center py-1">TIMING</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="bg-cyber-bg/40 hover:bg-cyber-border/20 transition-colors"
              >
                <td className="py-2 pr-2 font-bold text-cyber-text-dim rounded-l pl-1">
                  {row.label}
                </td>
                <td className="py-2 pr-2 text-cyber-text max-w-[80px] truncate">
                  {row.current.replace('AMD ', '').replace('NVIDIA GeForce ', '')}
                </td>
                <td className="py-2 pr-2 text-center">
                  <span className="flex items-center justify-center gap-0.5 text-cyber-text-dim">
                    <Clock size={9} />
                    {row.ageStr}
                  </span>
                </td>
                <td className="py-2 pr-2">
                  <span className="flex items-center gap-0.5 text-cyber-cyan">
                    <ArrowUpRight size={9} />
                    {row.target.replace('AMD ', '').replace('NVIDIA GeForce ', '')}
                  </span>
                </td>
                <td className="py-2 pr-2 text-right text-cyber-text">{formatBRL(row.targetPrice)}</td>
                <td className="py-2 pr-2 text-right text-cyber-green">−{formatBRL(row.resaleValue)}</td>
                <td className="py-2 pr-2 text-right font-bold text-cyber-amber">{formatBRL(row.netCost)}</td>
                <td className="py-2 pr-2 text-right font-bold text-cyber-green">+{row.perfGain}%</td>
                <td className="py-2 text-center rounded-r">
                  <TimingBadge timing={row.timing} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-cyber-border text-cyber-text-dim">
              <td colSpan={5} className="pt-2 text-right pr-2 font-bold">TOTAL</td>

              <td className="pt-2 pr-2 text-right text-cyber-green font-bold">−{formatBRL(totalResale)}</td>
              <td className="pt-2 pr-2 text-right text-cyber-amber font-bold">{formatBRL(netTotal)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Temporal analysis ─────────────────────────────────────────────── */}
      <div className="border border-cyber-border/50 rounded-lg p-3 bg-cyber-bg/30">
        <div className="flex items-center gap-1.5 mb-3">
          <Clock size={12} className="text-cyber-purple" />
          <span className="text-xs font-mono font-bold text-cyber-purple tracking-widest uppercase">
            Temporal Analysis
          </span>
        </div>

        <div className="overflow-x-auto mb-3">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-cyber-text-dim border-b border-cyber-border">
                <th className="text-left py-1 pr-3">COMPONENT</th>
                <th className="text-right py-1 pr-3">PURCHASE</th>
                <th className="text-right py-1 pr-3">DEPRECIATION</th>
                <th className="text-right py-1 pr-3">PER MONTH</th>
                <th className="text-right py-1 pr-3">R$/% GAIN</th>
                <th className="text-left py-1">RECOMMENDATION</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-cyber-border/30">
                  <td className="py-1.5 pr-3 font-bold text-cyber-text">{row.label}</td>
                  <td className="py-1.5 pr-3 text-right text-cyber-text">{formatBRL(row.purchasePrice)}</td>
                  <td className="py-1.5 pr-3 text-right text-cyber-red">−{row.depreciationPct}%</td>
                  <td className="py-1.5 pr-3 text-right text-cyber-amber">
                    ~{formatBRL(row.monthlyDepr)}/mo
                  </td>
                  <td className="py-1.5 pr-3 text-right font-bold">
                    <span
                      className={
                        row.efficiency < 25
                          ? 'text-cyber-green'
                          : row.efficiency < 60
                          ? 'text-cyber-amber'
                          : 'text-cyber-red'
                      }
                    >
                      {formatBRL(row.efficiency)}
                    </span>
                  </td>
                  <td className="py-1.5 text-cyber-text-dim">{row.timing.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Insight cards ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          <InsightCard
            icon={Zap}
            label="Best value"
            value={bestEfficiency.label}
            sub={`${formatBRL(bestEfficiency.efficiency)} per 1% gain`}
            accent="green"
          />
          {optimalRow ? (
            <InsightCard
              icon={CheckCircle}
              label="Optimal window now"
              value={optimalRow.label}
              sub={`${optimalRow.timing.remainingValuePct}% value remaining`}
              accent="cyan"
            />
          ) : (
            <InsightCard
              icon={AlertTriangle}
              label="None at ideal window"
              value="Wait"
              sub="Both have high resale value"
              accent="amber"
            />
          )}
          <InsightCard
            icon={Clock}
            label="Total depreciation/mo"
            value={`~${formatBRL(totalMonthlyDepr)}/mo`}
            sub="Cost to maintain current hardware"
            accent="amber"
          />
        </div>
      </div>

      {/* ── Depreciation mini-cards ───────────────────────────────────────── */}
      <div>
        <p className="text-xs font-mono text-cyber-text-dim mb-2 uppercase tracking-wider">
          Current Resale Estimate
        </p>
        <div className="flex flex-wrap gap-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex-1 min-w-[100px] p-2.5 rounded border border-cyber-border bg-cyber-bg/50"
            >
              <p className="text-xs text-cyber-text-dim font-mono">{row.label}</p>
              <p className="text-sm font-bold font-mono text-cyber-green">
                {formatBRL(row.resaleValue)}
              </p>
              <p className="text-xs font-mono text-cyber-text-dim">
                −{row.depreciationPct}% · {row.ageStr}
              </p>
            </div>
          ))}
        </div>
      </div>
    </GlowCard>
  )
}
