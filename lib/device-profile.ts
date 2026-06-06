import si from 'systeminformation'
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { DeviceProfile } from '@/types/optimization'

const CACHE_PATH = join(process.cwd(), 'data', 'optimizations-cache.json')
const PROFILE_TTL = 30 * 60 * 1000  // 30 min — hardware doesn't change mid-session

function spawnPS(cmd: string, timeoutMs = 3000): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn('powershell.exe', [
      '-NonInteractive', '-NoProfile', '-Command', cmd,
    ], { shell: false, windowsHide: true })
    let out = ''
    const timer = setTimeout(() => { proc.kill(); resolve('') }, timeoutMs)
    proc.stdout?.on('data', (d: Buffer) => { out += d.toString() })
    proc.on('close', () => { clearTimeout(timer); resolve(out.trim()) })
    proc.on('error', () => { clearTimeout(timer); resolve('') })
  })
}

function readCache(): Record<string, unknown> {
  try { return JSON.parse(readFileSync(CACHE_PATH, 'utf-8')) } catch { return {} }
}

function detectGPUVendor(vendor: string, model: string): DeviceProfile['gpuVendor'] {
  const v = (vendor + ' ' + model).toLowerCase()
  if (v.includes('nvidia')) return 'nvidia'
  if (v.includes('amd') || v.includes('advanced micro') || v.includes('radeon')) return 'amd'
  if (v.includes('intel')) return 'intel'
  return 'unknown'
}

function detectCPUVendor(manufacturer: string, brand: string): DeviceProfile['cpuVendor'] {
  const n = (manufacturer + ' ' + brand).toLowerCase()
  if (n.includes('amd')) return 'amd'
  if (n.includes('intel')) return 'intel'
  return 'unknown'
}

async function findNvidiaSmi(): Promise<string | null> {
  const candidates = [
    'nvidia-smi',
    'C:\\Windows\\System32\\nvidia-smi.exe',
    'C:\\Program Files\\NVIDIA Corporation\\NVSMI\\nvidia-smi.exe',
  ]
  for (const c of candidates) {
    const ok = await new Promise<boolean>((resolve) => {
      const proc = spawn(c, ['--version'], { shell: false, windowsHide: true })
      proc.on('close', (code) => resolve(code === 0))
      proc.on('error', () => resolve(false))
    })
    if (ok) return c
  }
  return null
}

async function checkIsAdmin(): Promise<boolean> {
  const out = await spawnPS(
    '([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)',
    2000
  )
  return out.toLowerCase() === 'true'
}

async function checkIsVM(): Promise<boolean> {
  const mfr = await spawnPS(
    "(Get-ItemProperty 'HKLM:\\HARDWARE\\DESCRIPTION\\System\\BIOS' -ErrorAction SilentlyContinue).SystemManufacturer",
    2000
  )
  return /virtual|vmware|qemu|hyper-v|virtualbox|xen|kvm/i.test(mfr)
}

function getWindowsMajor(osRelease: string): number {
  const major = parseInt(osRelease?.split('.')[0] ?? '0')
  return isNaN(major) ? 0 : major
}

async function getStorageTypes(): Promise<DeviceProfile['storageTypes']> {
  const out = await spawnPS('(Get-PhysicalDisk).MediaType -join ","', 3000)
  if (!out) return ['Unknown']
  return out.split(',').map(t => {
    t = t.trim()
    if (t === 'SSD') return 'SSD'
    if (t === 'HDD') return 'HDD'
    if (t === 'NVMe') return 'NVMe'
    return 'Unknown'
  }) as DeviceProfile['storageTypes']
}

async function getRamInfo(): Promise<{ generation: DeviceProfile['ramGeneration']; speedMHz: number; ratedMHz: number; sticks: number }> {
  const out = await spawnPS(
    'Get-WmiObject Win32_PhysicalMemory | Select SMBIOSMemoryType,ConfiguredClockSpeed,Speed | ConvertTo-Json -Compress',
    4000
  )
  if (!out) return { generation: 'unknown', speedMHz: 0, ratedMHz: 0, sticks: 0 }
  try {
    const raw = JSON.parse(out)
    const arr = Array.isArray(raw) ? raw : [raw]
    const first = arr[0] ?? {}
    const smbios: number = first.SMBIOSMemoryType ?? 0
    return {
      generation: smbios === 26 ? 'DDR4' : smbios === 34 ? 'DDR5' : 'unknown',
      speedMHz: first.ConfiguredClockSpeed ?? 0,
      ratedMHz: first.Speed ?? 0,
      sticks: arr.length,
    }
  } catch {
    return { generation: 'unknown', speedMHz: 0, ratedMHz: 0, sticks: 0 }
  }
}

export async function buildDeviceProfile(): Promise<DeviceProfile> {
  const cache = readCache()
  const profileAge = Date.now() - ((cache.profileTimestamp as number) ?? 0)
  if (profileAge < PROFILE_TTL && cache.profile) {
    return cache.profile as DeviceProfile
  }

  const [battery, graphics, cpu, os] = await Promise.all([
    si.battery().catch(() => ({ hasBattery: false, isCharging: false })),
    si.graphics().catch(() => ({ controllers: [] as si.Systeminformation.GraphicsControllerData[] })),
    si.cpu().catch(() => ({ manufacturer: '', brand: '' })),
    si.osInfo().catch(() => ({ release: '0', kernel: '' })),
  ])

  const primaryGPU = [...(graphics.controllers ?? [])]
    .filter(g => !g.model.toLowerCase().includes('microsoft basic'))
    .sort((a, b) => (b.vram ?? 0) - (a.vram ?? 0))[0] ?? {}

  const gpuVendor = detectGPUVendor(primaryGPU.vendor ?? '', primaryGPU.model ?? '')
  const cpuVendor = detectCPUVendor(cpu.manufacturer ?? '', cpu.brand ?? '')

  // All PS probes run truly in parallel — no thread blocking
  const [isVM, isAdmin, storageTypes, ramInfo, nvidiaSmiPath] = await Promise.all([
    checkIsVM(),
    checkIsAdmin(),
    getStorageTypes(),
    getRamInfo(),
    gpuVendor === 'nvidia' ? findNvidiaSmi() : Promise.resolve(null),
  ])

  const profile: DeviceProfile = {
    type: battery.hasBattery ? 'laptop' : 'desktop',
    isVM,
    isAdmin,
    cpuVendor,
    gpuVendor,
    gpuName: primaryGPU.model ?? 'Unknown',
    gpuVramMB: primaryGPU.vram ?? 0,
    gpuCount: (graphics.controllers ?? []).filter(g => !g.model.toLowerCase().includes('microsoft basic')).length,
    hasBattery: battery.hasBattery ?? false,
    isCharging: (battery as { isCharging?: boolean }).isCharging ?? false,
    ramGeneration: ramInfo.generation,
    ramSpeedMHz: ramInfo.speedMHz,
    ramRatedMHz: ramInfo.ratedMHz,
    ramSticks: ramInfo.sticks,
    hasNvidiaSmi: nvidiaSmiPath !== null,
    nvidiaSmiPath,
    windowsMajor: getWindowsMajor(os.release ?? ''),
    storageTypes,
  }

  writeFileSync(CACHE_PATH, JSON.stringify({ ...cache, profile, profileTimestamp: Date.now() }, null, 2))
  return profile
}
