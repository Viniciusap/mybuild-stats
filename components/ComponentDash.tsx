'use client'
import { useState } from 'react'
import GlowCard from './GlowCard'
import Gauge from './Gauge'
import NeonProgress from './NeonProgress'
import StatBadge from './StatBadge'
import ImageSearchModal from './ImageSearchModal'
import {
  AmdLogo, NvidiaLogo, CorsairLogo,
  GenericChipIcon, GpuIcon, RamIcon, SsdIcon,
} from './BrandLogo'
import type { CpuInfo, GpuInfo, RamInfo, StorageInfo } from '@/types'
import { formatAge, inferRamBrand } from '@/lib/utils'
import upgradePath from '@/data/upgrade-path.json'
import { Clock, Camera } from 'lucide-react'

// ─── Layout constants — change here to resize all cards uniformly ─────────────
const BODY_HEIGHT = 260  // px
const IMAGE_WIDTH  = '50%'
const GAUGE_WIDTH  = '50%'

// ─── CardHeader ───────────────────────────────────────────────────────────────

function CardHeader({
  logo, name, description, purchaseDate,
}: {
  logo: React.ReactNode
  name: string
  description: string
  purchaseDate: string
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-cyber-border shrink-0">
      <div className="shrink-0 opacity-90">{logo}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-bold text-cyber-text truncate leading-snug">{name}</p>
        <p className="text-[11px] font-mono text-cyber-text-dim truncate">{description}</p>
      </div>
      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-cyber-amber border border-cyber-amber/30 bg-cyber-amber/10 px-1.5 py-0.5 rounded leading-none shrink-0">
        <Clock size={9} />
        {formatAge(purchaseDate)}
      </span>
    </div>
  )
}

// ─── CardFooter ───────────────────────────────────────────────────────────────

function CardFooter({
  status, items,
}: {
  status: 'online' | 'warning' | 'error'
  items: Array<{ label: string; value: string }>
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 border-t border-cyber-border shrink-0 flex-wrap">
      <StatBadge variant={status} />
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="w-px h-3 bg-cyber-border/60 shrink-0" />
          <span className="text-[11px] font-mono text-cyber-text-dim">
            {item.label}:{' '}
            <span className="font-bold text-cyber-text">{item.value}</span>
          </span>
        </span>
      ))}
    </div>
  )
}

// ─── ImagePanel ───────────────────────────────────────────────────────────────

function ImagePanel({
  imagePath, fallback, onClick,
}: {
  imagePath?: string | null
  fallback: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      className="relative overflow-hidden shrink-0 cursor-pointer group/img"
      style={{ width: IMAGE_WIDTH, height: '100%', background: '#08101a' }}
      onClick={onClick}
    >
      {imagePath ? (
        <img
          src={imagePath}
          alt="componente"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.72) brightness(0.92)' }}
          onError={(e) => { ;(e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center opacity-50">
          {fallback}
        </div>
      )}

      {/* Right fade */}
      <div
        className="absolute inset-y-0 right-0 w-12 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to right, transparent, #0d1520ee)' }}
      />
      {/* Top/bottom vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to bottom, #0d152033 0%, transparent 25%, transparent 75%, #0d152033 100%)' }}
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 bg-cyber-bg/75 opacity-0 group-hover/img:opacity-100 transition-opacity">
        <Camera size={20} className="text-cyber-cyan" />
        <span className="text-xs font-mono font-bold text-cyber-cyan tracking-wider">TROCAR</span>
      </div>
    </div>
  )
}

// ─── GaugeSlot ────────────────────────────────────────────────────────────────

function gaugeZone(pct: number, warnAt: number, critAt: number): { label: string; color: string } {
  if (pct >= critAt) return { label: 'CRITICAL', color: 'text-cyber-red' }
  if (pct >= warnAt) return { label: 'WARNING', color: 'text-cyber-amber' }
  return { label: 'OK', color: 'text-cyber-green' }
}

function GaugeSlot({
  value, max = 100, unit = '%', label, warnAt = 0.6, critAt = 0.82,
}: {
  value: number; max?: number; unit?: string; label: string
  warnAt?: number; critAt?: number
}) {
  const pct = Math.min(Math.max(value / max, 0), 1)
  const zone = gaugeZone(pct, warnAt, critAt)
  const fmt = (v: number) => Number.isInteger(v) ? v.toString() : v.toFixed(1)

  return (
    <div className="group/gauge relative flex-1 flex flex-col overflow-hidden">
      <p className="text-[9px] font-mono text-cyber-text-dim text-center pt-1.5 tracking-widest uppercase shrink-0">
        {label}
      </p>
      <div className="flex-1 flex items-center justify-center overflow-hidden px-1 pb-1 min-h-0">
        <Gauge
          value={value} max={max} unit={unit}
          label="" warnAt={warnAt} critAt={critAt}
          className="h-full w-full"
        />
      </div>

      {/* Hover tooltip */}
      <div className="absolute top-1 right-1 z-30 pointer-events-none opacity-0 group-hover/gauge:opacity-100 transition-opacity">
        <div className="bg-cyber-bg/95 border border-cyber-border rounded px-2 py-1.5 text-[10px] font-mono space-y-0.5 shadow-lg">
          <div className="text-cyber-text font-bold">{fmt(value)} {unit}</div>
          <div className="text-cyber-text-dim">Max: {max}{unit}</div>
          <div className="text-cyber-text-dim">Aviso: ≥{fmt(warnAt * max)}{unit}</div>
          <div className="text-cyber-text-dim">Crítico: ≥{fmt(critAt * max)}{unit}</div>
          <div className={`font-bold ${zone.color}`}>{zone.label}</div>
        </div>
      </div>
    </div>
  )
}

// ─── ComponentCard — base shared by every dash ────────────────────────────────
//
//  Extend the dashboard by creating a new function that calls <ComponentCard>
//  with the appropriate props. No layout code needed in the new component.

interface ComponentCardProps {
  accent: 'cyan' | 'green' | 'purple' | 'amber' | 'red'
  // Header
  logo: React.ReactNode
  name: string
  description: string
  purchaseDate: string
  // Image
  imagePath?: string | null
  imageFallback: React.ReactNode
  onImageClick?: () => void
  // Gauges (right 50%)
  gaugeSlot: React.ReactNode
  // Footer
  status: 'online' | 'warning' | 'error'
  footerItems: Array<{ label: string; value: string }>
  // Modal (rendered as sibling, outside card)
  modal?: React.ReactNode
}

function ComponentCard({
  accent, logo, name, description, purchaseDate,
  imagePath, imageFallback, onImageClick,
  gaugeSlot,
  status, footerItems,
  modal,
}: ComponentCardProps) {
  return (
    <>
      <GlowCard accent={accent} className="overflow-hidden flex flex-col">
        <CardHeader
          logo={logo}
          name={name}
          description={description}
          purchaseDate={purchaseDate}
        />

        {/* Fixed-height body */}
        <div className="flex" style={{ height: `${BODY_HEIGHT}px` }}>
          <ImagePanel
            imagePath={imagePath}
            fallback={imageFallback}
            onClick={onImageClick}
          />
          {/* Gauge column */}
          <div className="flex flex-col" style={{ width: GAUGE_WIDTH }}>
            {gaugeSlot}
          </div>
        </div>

        <CardFooter status={status} items={footerItems} />
      </GlowCard>

      {modal}
    </>
  )
}

// ─── CPU ─────────────────────────────────────────────────────────────────────

export function CpuDash({ cpu, imagePath, onImageChange }: {
  cpu: CpuInfo; imagePath?: string | null; onImageChange?: () => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const isAmd = cpu.manufacturer.toLowerCase().includes('amd')
  const load = cpu.load ?? 0
  const temp = cpu.temperature ?? 0

  return (
    <ComponentCard
      accent="cyan"
      logo={isAmd ? <AmdLogo size={26} /> : <GenericChipIcon size={26} color="#00d4ff" />}
      name={cpu.brand.replace(/\s+\d+-Core Processor\s*$/, '').trim()}
      description={`${cpu.physicalCores} cores / ${cpu.threads} threads · ${cpu.socket} · boost ${cpu.speedMax} GHz`}
      purchaseDate={upgradePath.cpu.purchaseDate}
      imagePath={imagePath}
      imageFallback={<GenericChipIcon size={80} color="#00d4ff" />}
      onImageClick={() => setModalOpen(true)}
      gaugeSlot={
        <>
          <GaugeSlot value={load} unit="%" label="Load" warnAt={0.65} critAt={0.85} />
          <div className="h-px bg-cyber-border/40 shrink-0" />
          <GaugeSlot value={temp} max={95} unit="°C" label="Temperature" warnAt={0.65} critAt={0.82} />
        </>
      }
      status={load > 90 ? 'warning' : 'online'}
      footerItems={[
        { label: 'Base', value: `${cpu.speed} GHz` },
        { label: 'Boost', value: `${cpu.speedMax} GHz` },
        ...(temp > 0 ? [{ label: 'Temp', value: `${temp.toFixed(1)} °C` }] : []),

      ]}
      modal={
        <ImageSearchModal
          isOpen={modalOpen}
          title={cpu.brand.replace(/\s+\d+-Core Processor\s*$/, '').trim()}
          componentId="cpu"
          defaultQuery={`${cpu.brand} processor product photo`}
          onClose={() => setModalOpen(false)}
          onSaved={() => { onImageChange?.(); setModalOpen(false) }}
        />
      }
    />
  )
}

// ─── GPU ─────────────────────────────────────────────────────────────────────

export function GpuDash({ gpus, imagePath, onImageChange }: {
  gpus: GpuInfo[]; imagePath?: string | null; onImageChange?: () => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const gpu = gpus[0]
  if (!gpu) return null

  const isNvidia = gpu.name.toLowerCase().includes('nvidia') || gpu.name.toLowerCase().includes('rtx') || gpu.name.toLowerCase().includes('gtx')
  const gpuLoad = gpu.utilizationGpu ?? 0
  const gpuTemp = gpu.temperature ?? 0

  return (
    <ComponentCard
      accent="green"
      logo={isNvidia ? <NvidiaLogo size={26} /> : <GpuIcon size={26} color="#00ff87" />}
      name={gpu.name.replace('NVIDIA GeForce ', '').replace('AMD Radeon ', '')}
      description={`${gpu.vram} GB VRAM · Driver ${gpu.driverVersion}`}
      purchaseDate={upgradePath.gpu.purchaseDate}
      imagePath={imagePath}
      imageFallback={<GpuIcon size={80} color="#00ff87" />}
      onImageClick={() => setModalOpen(true)}
      gaugeSlot={
        <>
          <GaugeSlot value={gpuLoad} unit="%" label="Load" warnAt={0.7} critAt={0.9} />
          <div className="h-px bg-cyber-border/40 shrink-0" />
          <GaugeSlot value={gpuTemp} max={90} unit="°C" label="Temperature" warnAt={0.67} critAt={0.83} />
        </>
      }
      status={gpuTemp > 85 ? 'warning' : 'online'}
      footerItems={[
        { label: 'VRAM', value: `${gpu.vram} GB` },
        ...(gpu.utilizationMemory !== null
          ? [{ label: 'VRAM Use', value: `${gpu.utilizationMemory}%` }]
          : []),
        ...(gpuTemp > 0 ? [{ label: 'Temp', value: `${gpuTemp} °C` }] : []),
      ]}
      modal={
        <ImageSearchModal
          isOpen={modalOpen}
          title={gpu.name.replace('NVIDIA GeForce ', '').replace('AMD Radeon ', '')}
          componentId="gpu"
          defaultQuery={`${gpu.name} graphics card product photo`}
          onClose={() => setModalOpen(false)}
          onSaved={() => { onImageChange?.(); setModalOpen(false) }}
        />
      }
    />
  )
}

// ─── RAM ─────────────────────────────────────────────────────────────────────

export function RamDash({ ram, imagePath, onImageChange }: {
  ram: RamInfo; imagePath?: string | null; onImageChange?: () => void
}) {
  const [modalOpen, setModalOpen] = useState(false)

  const stick = ram.sticks[0]
  const detectedBrand =
    stick?.manufacturer !== 'Unknown'
      ? stick?.manufacturer
      : (stick?.partNum ? inferRamBrand(stick.partNum) : null)
  const partNum = stick?.partNum || null
  const formFactor = stick?.formFactor || null

  // Build a rich search query if we have model info
  const imageQuery = [
    detectedBrand,
    partNum,
    `DDR4 ${stick?.speed ?? 3200}MHz`,
    `${stick?.size ?? 16}GB`,
    'RAM memory module product photo',
  ].filter(Boolean).join(' ')

  // Description: show brand + model if available, otherwise generic specs
  const brandLine = [detectedBrand, partNum].filter(Boolean).join(' · ')
  const specsLine = `${ram.sticks.length}× ${stick?.size ?? 0} GB · ${stick?.speed ?? 0} MHz · ${stick?.type ?? 'DDR4'}`
  const description = brandLine ? `${brandLine} · ${specsLine}` : specsLine

  const footerItems: Array<{ label: string; value: string }> = [
    { label: 'Used', value: `${ram.used} GB` },
    { label: 'Free', value: `${ram.free} GB` },
    ...(detectedBrand ? [{ label: 'Brand', value: detectedBrand }] : []),
    ...(partNum ? [{ label: 'Model', value: partNum }] : []),
    ...(formFactor ? [{ label: 'Format', value: formFactor }] : []),
  ]

  return (
    <ComponentCard
      accent="purple"
      logo={<RamIcon size={26} color="#bf00ff" />}
      name={detectedBrand ? `${detectedBrand} ${ram.total} GB ${stick?.type ?? 'DDR4'}` : `${ram.total} GB ${stick?.type ?? 'DDR4'}`}
      description={description}
      purchaseDate={upgradePath.ram.purchaseDate}
      imagePath={imagePath}
      imageFallback={<RamIcon size={80} color="#bf00ff" />}
      onImageClick={() => setModalOpen(true)}
      gaugeSlot={
        <GaugeSlot value={ram.usedPercent} unit="%" label="Memory Use" warnAt={0.75} critAt={0.9} />
      }
      status={ram.usedPercent > 90 ? 'warning' : 'online'}
      footerItems={footerItems}
      modal={
        <ImageSearchModal
          isOpen={modalOpen}
          title={[detectedBrand, partNum, `${ram.total} GB DDR4`].filter(Boolean).join(' · ')}
          componentId="ram"
          defaultQuery={imageQuery}
          onClose={() => setModalOpen(false)}
          onSaved={() => { onImageChange?.(); setModalOpen(false) }}
        />
      }
    />
  )
}

// ─── SSD ─────────────────────────────────────────────────────────────────────

export function StorageDash({ disks, imagePath, onImageChange }: {
  disks: StorageInfo[]; imagePath?: string | null; onImageChange?: () => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const disk = disks[0]
  if (!disk) return null

  const healthOk =
    !disk.healthStatus ||
    disk.healthStatus.toLowerCase().includes('ok') ||
    disk.healthStatus.toLowerCase().includes('pass') ||
    disk.healthStatus.toLowerCase().includes('good')

  const isCorsair = disk.name.toLowerCase().includes('corsair')

  return (
    <ComponentCard
      accent={healthOk ? 'cyan' : 'red'}
      logo={isCorsair ? <CorsairLogo size={26} /> : <SsdIcon size={26} color="#00d4ff" />}
      name={disk.name}
      description={`${disk.size} GB · ${disk.interface} · ${disk.type}`}
      purchaseDate={upgradePath.storage.purchaseDate}
      imagePath={imagePath}
      imageFallback={<SsdIcon size={80} color="#00d4ff" />}
      onImageClick={() => setModalOpen(true)}
      gaugeSlot={
        <GaugeSlot value={disk.percentUsed} unit="%" label="Capacity Used" warnAt={0.75} critAt={0.9} />
      }
      status={healthOk ? 'online' : 'error'}
      footerItems={[
        ...(disk.healthStatus ? [{ label: 'S.M.A.R.T', value: disk.healthStatus }] : []),
        { label: 'Interface', value: disk.interface },

        ...(disk.temperature != null ? [{ label: 'Temp', value: `${disk.temperature} °C` }] : []),
      ]}
      modal={
        <ImageSearchModal
          isOpen={modalOpen}
          title={disk.name}
          componentId="storage"
          defaultQuery={`${disk.name} NVMe SSD product photo`}
          onClose={() => setModalOpen(false)}
          onSaved={() => { onImageChange?.(); setModalOpen(false) }}
        />
      }
    />
  )
}
