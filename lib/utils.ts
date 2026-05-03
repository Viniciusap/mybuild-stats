export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function ageInMonths(dateStr: string): number {
  const start = new Date(dateStr)
  const now = new Date()
  return (
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth())
  )
}

export function estimateResaleValue(
  purchasePrice: number,
  purchaseDate: string,
  category: 'cpu' | 'gpu' | 'ram' | 'storage'
): number {
  const months = ageInMonths(purchaseDate)
  const depreciationRates: Record<string, number> = {
    cpu: 0.012,
    gpu: 0.018,
    ram: 0.008,
    storage: 0.010,
  }
  const rate = depreciationRates[category] ?? 0.015
  const factor = Math.max(0.2, 1 - rate * months)
  return Math.round(purchasePrice * factor)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function formatAge(purchaseDate: string): string {
  const months = ageInMonths(purchaseDate)
  if (months < 1) return 'less than 1 month'
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'}`
  const y = Math.floor(months / 12)
  const m = months % 12
  const years = `${y} ${y === 1 ? 'year' : 'years'}`
  if (m === 0) return years
  return `${years} and ${m} ${m === 1 ? 'month' : 'months'}`
}

export function inferRamBrand(partNum: string): string | null {
  const p = partNum.toUpperCase()
  if (/^CM[WKTLUPVS]/.test(p)) return 'Corsair'
  if (/^F[45]-/.test(p))        return 'G.Skill'
  if (/^(HX|KF)[45]/.test(p))  return 'Kingston HyperX'
  if (/^(BL|CT)\d/.test(p))    return 'Crucial'
  if (/^MTA/.test(p))           return 'Micron'
  if (/^(HMA|M471|M425)/.test(p)) return 'Samsung'
  if (/^AD[45]/.test(p))        return 'ADATA'
  return null
}

export type UpgradeTiming = {
  label: string
  color: string
  dot: string
  desc: string
  remainingValuePct: number
}

export function getUpgradeTiming(
  purchaseDate: string,
  category: 'cpu' | 'gpu' | 'ram' | 'storage'
): UpgradeTiming {
  const depRates: Record<string, number> = {
    cpu: 0.012,
    gpu: 0.018,
    ram: 0.008,
    storage: 0.010,
  }
  const months = ageInMonths(purchaseDate)
  const rate = depRates[category] ?? 0.015
  const remaining = Math.max(0.2, 1 - rate * months)
  const pct = Math.round(remaining * 100)

  if (remaining > 0.85) {
    return { label: 'EARLY', color: 'text-cyber-red border-cyber-red/40 bg-cyber-red/10', dot: 'bg-cyber-red', desc: 'Resale value high — wait', remainingValuePct: pct }
  }
  if (remaining > 0.70) {
    return { label: 'OPTIMAL', color: 'text-cyber-green border-cyber-green/40 bg-cyber-green/10', dot: 'bg-cyber-green', desc: 'Ideal upgrade & resale window', remainingValuePct: pct }
  }
  if (remaining > 0.50) {
    return { label: 'VALID', color: 'text-cyber-amber border-cyber-amber/40 bg-cyber-amber/10', dot: 'bg-cyber-amber', desc: 'Upgrade makes sense — accelerated depreciation', remainingValuePct: pct }
  }
  return { label: 'URGENT', color: 'text-cyber-red border-cyber-red/40 bg-cyber-red/10', dot: 'bg-cyber-red', desc: 'Low value — upgrade urgent', remainingValuePct: pct }
}
