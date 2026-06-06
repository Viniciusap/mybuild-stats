export type CheckStatus =
  | 'optimal'
  | 'suboptimal'
  | 'info'
  | 'not_applicable'
  | 'unknown'
  | 'error'
  | 'permission_denied'
  | 'managed_by_policy'

export type CheckImpact = 'high' | 'medium' | 'low' | 'info'

export type CheckCategory = 'gpu' | 'cpu' | 'memory' | 'system' | 'input' | 'storage'

export interface OptimizationCheck {
  id: string
  category: CheckCategory
  name: string
  description: string
  status: CheckStatus
  currentValue?: string
  recommendedValue?: string
  impact: CheckImpact
  fixInstructions?: string
  reason?: string
  appliesToDevice: 'all' | 'desktop' | 'laptop'
}

export interface DeviceProfile {
  type: 'desktop' | 'laptop' | 'unknown'
  isVM: boolean
  isAdmin: boolean
  cpuVendor: 'amd' | 'intel' | 'unknown'
  gpuVendor: 'nvidia' | 'amd' | 'intel' | 'unknown'
  gpuName: string
  gpuVramMB: number
  gpuCount: number
  hasBattery: boolean
  isCharging: boolean
  ramGeneration: 'DDR4' | 'DDR5' | 'unknown'
  ramSpeedMHz: number
  ramRatedMHz: number
  ramSticks: number
  hasNvidiaSmi: boolean
  nvidiaSmiPath: string | null
  windowsMajor: number
  storageTypes: ('SSD' | 'HDD' | 'NVMe' | 'Unknown')[]
}

export interface OptimizationSummary {
  critical: number
  warnings: number
  info: number
  optimal: number
}

export interface DxdiagHAGS {
  enabled: boolean
  driverSupportState: string
}

export interface OptimizationsCache {
  checksTimestamp: number
  dxdiagTimestamp: number
  hags: DxdiagHAGS | null
  result: OptimizationsResult | null
}

export interface OptimizationsResult {
  profile: DeviceProfile
  checks: OptimizationCheck[]
  summary: OptimizationSummary
  cachedAt: string
}
