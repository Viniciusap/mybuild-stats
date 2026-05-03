export interface CpuInfo {
  brand: string
  manufacturer: string
  cores: number
  physicalCores: number
  threads: number
  speed: number
  speedMax: number
  temperature: number | null
  load: number | null
  socket: string
}

export interface GpuInfo {
  name: string
  vram: number
  driverVersion: string
  driverDate: string
  temperature: number | null
  utilizationGpu: number | null
  utilizationMemory: number | null
}

export interface RamStick {
  size: number
  speed: number
  manufacturer: string
  partNum: string
  formFactor: string
  type: string
  slot: string
}

export interface RamInfo {
  total: number
  used: number
  free: number
  usedPercent: number
  sticks: RamStick[]
}

export interface StorageInfo {
  name: string
  type: string
  size: number
  interface: string
  temperature: number | null
  healthStatus: string | null
  percentUsed: number
}

export interface MoboInfo {
  manufacturer: string
  model: string
  version: string
}

export interface BiosInfo {
  vendor: string
  version: string
  releaseDate: string
  daysSinceRelease: number
}

export interface OsInfo {
  platform: string
  distro: string
  release: string
  build: string
  installDate: string | null
  uptime: number
  uptimeHuman: string
}

export interface HardwareSnapshot {
  id?: number
  timestamp: string
  cpu: CpuInfo
  gpu: GpuInfo[]
  ram: RamInfo
  storage: StorageInfo[]
  mobo: MoboInfo
  bios: BiosInfo
  os: OsInfo
}

export interface UpgradeTarget {
  id: string
  name: string
  category: 'cpu' | 'gpu' | 'ram' | 'storage'
  triggerPrice: number
  estimatedPrice: number
  performanceGain: number
  stores: string[]
  searchQuery: string
  notes: string
}

export interface UpgradePath {
  cpu: {
    current: string
    socket: string
    targets: UpgradeTarget[]
  }
  gpu: {
    current: string
    targets: UpgradeTarget[]
  }
  ram: {
    current: string
    targets: UpgradeTarget[]
  }
  storage: {
    current: string
    targets: UpgradeTarget[]
  }
}

export interface PriceRecord {
  id?: number
  componentId: string
  componentName: string
  store: string
  price: number
  url: string | null
  timestamp: string
}

export interface PriceAlert {
  target: UpgradeTarget
  currentPrice: number
  store: string
  url: string | null
  discountPercent: number
  isBelowTrigger: boolean
}

export interface BuildEvent {
  id?: number
  date: string
  component: string
  eventType: 'added' | 'removed' | 'upgraded' | 'repaired' | 'driver_update'
  notes: string
  price?: number
}

export interface DepreciationEstimate {
  component: string
  purchasePrice: number
  ageMonths: number
  estimatedResaleValue: number
  depreciationPercent: number
}
