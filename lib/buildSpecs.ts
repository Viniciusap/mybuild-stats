import type { HardwareSnapshot } from '@/types'
import { inferRamBrand } from './utils'

export function formatBuildSpecs(hw: HardwareSnapshot): string {
  const date = new Intl.DateTimeFormat('en-US', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date())

  const cpu = hw.cpu
  const cpuLine = [
    cpu.brand,
    `${cpu.physicalCores}c/${cpu.threads}t`,
    cpu.socket,
    `base ${cpu.speed} GHz / boost ${cpu.speedMax} GHz`,
    cpu.temperature != null ? `${cpu.temperature.toFixed(1)} °C` : null,
    cpu.load != null ? `carga ${cpu.load}%` : null,
  ].filter(Boolean).join(' · ')

  const gpuLines = hw.gpu.map((g) => [
    g.name,
    `${g.vram} GB VRAM`,
    `driver ${g.driverVersion}${g.driverDate && g.driverDate !== 'N/A' ? ` (${g.driverDate})` : ''}`,
    g.temperature != null ? `${g.temperature} °C` : null,
    g.utilizationGpu != null ? `uso ${g.utilizationGpu}%` : null,
  ].filter(Boolean).join(' · ')).join('\n')

  const stick = hw.ram.sticks[0]
  const brand =
    stick?.manufacturer !== 'Unknown'
      ? stick?.manufacturer
      : (stick?.partNum ? inferRamBrand(stick.partNum) : null)
  const ramModel = [brand, stick?.partNum].filter(Boolean).join(' ')
  const ramLine = [
    `${hw.ram.total} GB ${stick?.type ?? 'DDR4'} ${stick?.speed ?? ''}MHz`,
    ramModel || null,
    hw.ram.sticks.length > 0 ? `${hw.ram.sticks.length}× ${stick?.size ?? 0} GB ${stick?.formFactor ?? 'DIMM'}` : null,
    `em uso: ${hw.ram.used} GB (${hw.ram.usedPercent}%)`,
  ].filter(Boolean).join(' — ')

  const storageLines = hw.storage.map((d) => [
    d.name,
    `${d.size} GB`,
    d.interface,
    d.type,
    d.healthStatus ? `S.M.A.R.T ${d.healthStatus}` : null,
    d.temperature != null ? `${d.temperature} °C` : null,
    `${d.percentUsed}% usado`,
  ].filter(Boolean).join(' · ')).join('\n')

  const moboLine = `${hw.mobo.manufacturer} ${hw.mobo.model}`.trim()

  const biosLine = [
    hw.bios.version,
    hw.bios.vendor !== 'N/A' ? `(${hw.bios.vendor})` : null,
    hw.bios.releaseDate ? hw.bios.releaseDate : null,
    `${hw.bios.daysSinceRelease} days ago`,
  ].filter(Boolean).join(' · ')

  const osLine = [
    hw.os.distro.replace('Microsoft ', ''),
    `build ${hw.os.build}`,
    hw.os.installDate ? `installed ${new Intl.DateTimeFormat('en-US').format(new Date(hw.os.installDate))}` : null,
    `uptime ${hw.os.uptimeHuman}`,
  ].filter(Boolean).join(' · ')

  return [
    `## MyBuild Stats — ${date}`,
    '',
    `**CPU**: ${cpuLine}`,
    `**GPU**: ${gpuLines}`,
    `**RAM**: ${ramLine}`,
    `**Storage**: ${storageLines}`,
    moboLine ? `**Mobo**: ${moboLine}` : null,
    `**BIOS**: ${biosLine}`,
    `**OS**: ${osLine}`,
  ].filter((l) => l !== null).join('\n')
}
