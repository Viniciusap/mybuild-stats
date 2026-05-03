import si from 'systeminformation'
import type { HardwareSnapshot, CpuInfo, GpuInfo, RamInfo, StorageInfo, MoboInfo, BiosInfo, OsInfo } from '@/types'

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (d > 0) parts.push(`${d} ${d === 1 ? 'day' : 'days'}`)
  if (h > 0) parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`)
  if (m > 0) parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`)
  if (parts.length === 0) return 'less than 1 minute'
  if (parts.length === 1) return parts[0]
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1]
}

function daysBetween(dateStr: string): number {
  try {
    const ms = Date.now() - new Date(dateStr).getTime()
    return Math.floor(ms / 86400000)
  } catch {
    return 0
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeGet<T>(obj: unknown, key: string, fallback: T): T {
  if (obj && typeof obj === 'object' && key in (obj as object)) {
    return (obj as Record<string, unknown>)[key] as T ?? fallback
  }
  return fallback
}

export async function collectHardwareInfo(): Promise<HardwareSnapshot> {
  const [
    cpuData,
    cpuTempData,
    cpuLoadData,
    graphicsData,
    memData,
    memLayoutData,
    diskLayoutData,
    fsData,
    moboData,
    biosData,
    osData,
    timeData,
  ] = await Promise.all([
    si.cpu(),
    si.cpuTemperature().catch(() => ({ main: null, cores: [] })),
    si.currentLoad().catch(() => ({ currentLoad: null })),
    si.graphics().catch(() => ({ controllers: [], displays: [] })),
    si.mem(),
    si.memLayout(),
    si.diskLayout().catch(() => []),
    si.fsSize().catch(() => []),
    si.baseboard().catch(() => ({ manufacturer: '', model: '', version: '' })),
    si.bios(),
    si.osInfo(),
    si.time(),
  ])

  const cpu: CpuInfo = {
    brand: cpuData.brand,
    manufacturer: cpuData.manufacturer,
    cores: cpuData.cores,
    physicalCores: cpuData.physicalCores,
    threads: cpuData.cores,
    speed: cpuData.speed,
    speedMax: cpuData.speedMax ?? cpuData.speed,
    socket: cpuData.socket ?? 'AM4',
    temperature: safeGet<number | null>(cpuTempData, 'main', null),
    load:
      cpuLoadData.currentLoad != null
        ? Math.round(cpuLoadData.currentLoad)
        : null,
  }

  const gpu: GpuInfo[] = (graphicsData.controllers ?? [])
    .filter(
      (g) =>
        (g.vendor ?? '') !== 'Microsoft' &&
        !g.model.toLowerCase().includes('displaylink')
    )
    .map((g) => ({
      name: g.model,
      vram: Math.round((g.vram ?? 0) / 1024),
      driverVersion: safeGet<string>(g, 'driverVersion', 'N/A'),
      driverDate: safeGet<string>(g, 'driverDate', 'N/A'),
      temperature: safeGet<number | null>(g, 'temperatureGpu', null),
      utilizationGpu: safeGet<number | null>(g, 'utilizationGpu', null),
      utilizationMemory: safeGet<number | null>(g, 'utilizationMemory', null),
    }))

  const ram: RamInfo = {
    total: Math.round(memData.total / 1024 ** 3),
    used: Math.round(memData.used / 1024 ** 3),
    free: Math.round(memData.free / 1024 ** 3),
    usedPercent: Math.round((memData.used / memData.total) * 100),
    sticks: memLayoutData.map((s) => ({
      size: Math.round((s.size ?? 0) / 1024 ** 3),
      speed: s.clockSpeed ?? 0,
      manufacturer: s.manufacturer?.trim() || 'Unknown',
      partNum: (s.partNum ?? '').trim(),
      formFactor: (s.formFactor ?? '').trim(),
      type: s.type ?? 'DDR4',
      slot: s.bank ?? safeGet<string>(s, 'deviceLocator', 'N/A'),
    })),
  }

  const fsMap = new Map<string, number>()
  for (const f of fsData) {
    fsMap.set((f.mount ?? '').toUpperCase(), Math.round(f.use ?? 0))
  }

  const storage: StorageInfo[] = diskLayoutData.map((d) => ({
    name: d.name ?? 'Unknown',
    type: d.type ?? 'NVMe',
    size: Math.round((d.size ?? 0) / 1024 ** 3),
    interface: d.interfaceType ?? 'N/A',
    temperature: safeGet<number | null>(d, 'temperature', null),
    healthStatus: safeGet<string | null>(d, 'smartStatus', null),
    percentUsed: fsMap.get('C:') ?? fsMap.get('/') ?? 0,
  }))

  const mobo: MoboInfo = {
    manufacturer: moboData.manufacturer?.trim() ?? '',
    model: moboData.model?.trim() ?? '',
    version: moboData.version?.trim() ?? '',
  }

  const biosRelease = biosData.releaseDate ?? ''
  const bios: BiosInfo = {
    vendor: biosData.vendor ?? 'AMI',
    version: biosData.version ?? 'N/A',
    releaseDate: biosRelease,
    daysSinceRelease: biosRelease ? daysBetween(biosRelease) : 0,
  }

  const uptime = timeData.uptime ?? 0
  const os: OsInfo = {
    platform: osData.platform ?? 'Windows',
    distro: osData.distro ?? 'Windows 11',
    release: osData.release ?? 'N/A',
    build: osData.build ?? 'N/A',
    installDate: safeGet<string | null>(osData, 'installDate', null),
    uptime,
    uptimeHuman: formatUptime(uptime),
  }

  return {
    timestamp: new Date().toISOString(),
    cpu,
    gpu,
    ram,
    storage,
    mobo,
    bios,
    os,
  }
}

export function detectHardwareChanges(
  current: HardwareSnapshot,
  previous: HardwareSnapshot
): boolean {
  return (
    current.cpu.brand !== previous.cpu.brand ||
    current.gpu[0]?.name !== previous.gpu[0]?.name ||
    current.ram.total !== previous.ram.total ||
    current.storage[0]?.name !== previous.storage[0]?.name ||
    current.bios.version !== previous.bios.version ||
    current.gpu[0]?.driverVersion !== previous.gpu[0]?.driverVersion
  )
}
