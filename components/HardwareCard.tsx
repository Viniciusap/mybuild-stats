'use client'
import GlowCard from './GlowCard'
import NeonProgress from './NeonProgress'
import type { CpuInfo, GpuInfo, RamInfo, StorageInfo } from '@/types'
import { Cpu, MonitorPlay, MemoryStick, HardDrive, Thermometer } from 'lucide-react'
import { clsx } from 'clsx'

function TempTag({ value }: { value: number | null }) {
  if (value === null) return null
  const hot = value > 80
  const warm = value > 65
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-0.5 text-xs font-mono px-1.5 py-0.5 rounded',
        hot
          ? 'text-cyber-red bg-cyber-red/10'
          : warm
          ? 'text-cyber-amber bg-cyber-amber/10'
          : 'text-cyber-green bg-cyber-green/10'
      )}
    >
      <Thermometer size={10} />
      {value}°C
    </span>
  )
}

export function CpuCard({ cpu }: { cpu: CpuInfo }) {
  return (
    <GlowCard accent="cyan" className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-cyber-cyan" />
          <span className="text-xs font-mono font-bold text-cyber-cyan tracking-widest uppercase">
            CPU
          </span>
        </div>
        <TempTag value={cpu.temperature} />
      </div>
      <div className="mb-1">
        <p className="text-sm font-mono font-bold text-cyber-text leading-tight">
          {cpu.brand}
        </p>
        <p className="text-xs font-mono text-cyber-text-dim mt-0.5">
          {cpu.physicalCores}C / {cpu.threads}T — Socket {cpu.socket}
        </p>
      </div>
      <div className="flex items-center gap-3 my-2 py-2 border-y border-cyber-border">
        <div className="text-center">
          <p className="text-xs text-cyber-text-dim font-mono">BASE</p>
          <p className="text-sm font-mono font-bold text-cyber-cyan">{cpu.speed}GHz</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-cyber-text-dim font-mono">BOOST</p>
          <p className="text-sm font-mono font-bold text-cyber-cyan">{cpu.speedMax}GHz</p>
        </div>
        <div className="flex-1">
          {cpu.load !== null && (
            <NeonProgress value={cpu.load} accent="cyan" label="LOAD" size="sm" />
          )}
        </div>
      </div>
    </GlowCard>
  )
}

export function GpuCard({ gpus }: { gpus: GpuInfo[] }) {
  const gpu = gpus[0]
  if (!gpu) return null
  return (
    <GlowCard accent="green" className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MonitorPlay size={16} className="text-cyber-green" />
          <span className="text-xs font-mono font-bold text-cyber-green tracking-widest uppercase">
            GPU
          </span>
        </div>
        <TempTag value={gpu.temperature} />
      </div>
      <p className="text-sm font-mono font-bold text-cyber-text leading-tight mb-0.5">
        {gpu.name}
      </p>
      <p className="text-xs font-mono text-cyber-text-dim mb-2">
        VRAM: {gpu.vram}GB &nbsp;·&nbsp; Driver: {gpu.driverVersion}
      </p>
      <div className="space-y-1.5">
        {gpu.utilizationGpu !== null && (
          <NeonProgress value={gpu.utilizationGpu} accent="green" label="GPU LOAD" size="sm" />
        )}
        {gpu.utilizationMemory !== null && (
          <NeonProgress value={gpu.utilizationMemory} accent="cyan" label="VRAM" size="sm" />
        )}
      </div>
    </GlowCard>
  )
}

export function RamCard({ ram }: { ram: RamInfo }) {
  return (
    <GlowCard accent="purple" className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <MemoryStick size={16} className="text-cyber-purple" />
        <span className="text-xs font-mono font-bold text-cyber-purple tracking-widest uppercase">
          RAM
        </span>
      </div>
      <p className="text-sm font-mono font-bold text-cyber-text mb-0.5">
        {ram.total}GB DDR4
      </p>
      <p className="text-xs font-mono text-cyber-text-dim mb-2">
        {ram.sticks.length}× sticks — {ram.sticks[0]?.speed ?? '?'}MHz
      </p>
      <NeonProgress value={ram.usedPercent} label="USED" size="sm" />
      <div className="flex justify-between mt-1">
        <span className="text-xs font-mono text-cyber-text-dim">{ram.used}GB used</span>
        <span className="text-xs font-mono text-cyber-text-dim">{ram.free}GB free</span>
      </div>
    </GlowCard>
  )
}

export function StorageCard({ disks }: { disks: StorageInfo[] }) {
  const disk = disks[0]
  if (!disk) return null
  const healthOk = !disk.healthStatus || disk.healthStatus.toLowerCase().includes('ok') || disk.healthStatus.toLowerCase().includes('pass')
  return (
    <GlowCard accent={healthOk ? 'cyan' : 'red'} className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <HardDrive size={16} className="text-cyber-cyan" />
          <span className="text-xs font-mono font-bold text-cyber-cyan tracking-widest uppercase">
            SSD
          </span>
        </div>
        {disk.healthStatus && (
          <span
            className={clsx(
              'text-xs font-mono px-1.5 py-0.5 rounded',
              healthOk
                ? 'text-cyber-green bg-cyber-green/10'
                : 'text-cyber-red bg-cyber-red/10'
            )}
          >
            {disk.healthStatus.toUpperCase()}
          </span>
        )}
      </div>
      <p className="text-sm font-mono font-bold text-cyber-text leading-tight mb-0.5">
        {disk.name}
      </p>
      <p className="text-xs font-mono text-cyber-text-dim mb-2">
        {disk.size}GB &nbsp;·&nbsp; {disk.interface} &nbsp;·&nbsp; {disk.type}
      </p>
      {disk.percentUsed > 0 && (
        <NeonProgress value={disk.percentUsed} label="CAPACITY" size="sm" />
      )}
      <TempTag value={disk.temperature} />
    </GlowCard>
  )
}
