'use client'

import useSWR from 'swr'
import { useState, useEffect, useCallback } from 'react'
import { CpuDash, GpuDash, RamDash, StorageDash } from '@/components/ComponentDash'
import UpgradeRadar from '@/components/UpgradeRadar'
import BuildTimeline from '@/components/BuildTimeline'
import ComparisonTable from '@/components/ComparisonTable'
import StatBadge from '@/components/StatBadge'
import CaseSearchCard from '@/components/CaseSearchCard'
import type { HardwareSnapshot, PriceRecord, PriceAlert, BuildEvent } from '@/types'
import { RefreshCw, Clock, Shield, Server, Copy, Check } from 'lucide-react'
import LiveClock from '@/components/LiveClock'
import { formatBuildSpecs } from '@/lib/buildSpecs'
import { clsx } from 'clsx'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface PricesData { prices: PriceRecord[]; alerts: PriceAlert[] }
interface TimelineData { events: BuildEvent[] }
type ComponentImages = Record<string, string | null>

function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded bg-cyber-border/50', className)} />
}

function SysRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-cyber-border/30 last:border-0">
      <span className="text-xs font-mono text-cyber-text-dim">{label}</span>
      <span className={clsx('text-xs font-mono font-bold', accent ?? 'text-cyber-text')}>{value}</span>
    </div>
  )
}

export default function Dashboard() {
  const [checking, setChecking] = useState(false)
  const [fetchingImages, setFetchingImages] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyBuild() {
    if (!hw) return
    const text = formatBuildSpecs(hw)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  const { data: hw, isLoading: hwLoading, mutate: refreshHw } =
    useSWR<HardwareSnapshot>('/api/hardware', fetcher, { refreshInterval: 15_000 })

  const { data: pricesData, isLoading: pricesLoading, mutate: refreshPrices } =
    useSWR<PricesData>('/api/prices', fetcher, { refreshInterval: 300_000 })

  const { data: timelineData } =
    useSWR<TimelineData>('/api/timeline', fetcher)

  const { data: componentImages, mutate: refreshComponentImages } =
    useSWR<ComponentImages>('/api/component-image', fetcher)

  // Auto-fetch missing component images on first load (background, silent)
  const autoFetchImages = useCallback(async (statuses: ComponentImages) => {
    const missing = Object.entries(statuses)
      .filter(([, v]) => v === null)
      .map(([k]) => k)
    if (missing.length === 0) return
    setFetchingImages(true)
    try {
      await Promise.allSettled(
        missing.map((id) =>
          fetch('/api/component-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          })
        )
      )
      await refreshComponentImages()
    } finally {
      setFetchingImages(false)
    }
  }, [refreshComponentImages])

  useEffect(() => {
    if (componentImages) void autoFetchImages(componentImages)
  }, [!!componentImages]) // run once when first loaded

  async function triggerPriceCheck() {
    setChecking(true)
    try {
      await fetch('/api/prices/trigger', { method: 'POST' })
      await refreshPrices()
    } finally {
      setChecking(false)
    }
  }

  const biosAge = hw?.bios?.daysSinceRelease ?? 0

  return (
    <div className="min-h-screen p-3 md:p-5 max-w-[1800px] mx-auto animate-fade-in">

      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
      <header className="flex flex-wrap items-center gap-3 mb-4 pb-3 border-b border-cyber-border">
        <div className="flex items-center gap-3">
          <Server size={18} className="text-cyber-cyan" />
          <div>
            <h1 className="text-base font-mono font-bold text-cyber-cyan neon-cyan tracking-wider leading-none">
              MYBUILD-STATS<span className="cursor-blink" />
            </h1>
            <p className="text-xs font-mono text-cyber-text-dim mt-0.5">
              AMD AM4 PLATFORM · COMMAND CENTER
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 ml-auto text-xs font-mono text-cyber-text-dim">
          {fetchingImages && (
            <span className="flex items-center gap-1 text-cyber-purple">
              <RefreshCw size={10} className="animate-spin" />
              FETCHING IMAGES…
            </span>
          )}
          {hw?.os?.uptimeHuman && (
            <span className="flex items-center gap-1">
              <Clock size={11} /> {hw.os.uptimeHuman}
            </span>
          )}
          {hw?.bios?.version && (
            <span className={clsx('flex items-center gap-1', biosAge > 365 ? 'text-cyber-amber' : '')}>
              <Shield size={11} />
              BIOS {hw.bios.version}
              {biosAge > 365 && ' ⚠'}
            </span>
          )}
          <StatBadge variant={hwLoading ? 'idle' : 'online'} />
          <button
            onClick={() => { void refreshHw(); void refreshPrices() }}
            className="flex items-center gap-1 hover:text-cyber-cyan transition-colors"
          >
            <RefreshCw size={11} className={hwLoading ? 'animate-spin' : ''} />
            REFRESH
          </button>
          <span className="hidden lg:block"><LiveClock /></span>
        </div>
      </header>

      {/* ══ MAIN GRID — component dashes + right sidebar ═════════════════════ */}
      {/*
          Mobile  (<640px) : 1 col — cards stack full width
          sm      (640px+) : 2 col dashes, sidebar below
          lg      (1024px+): sidebar appears on the right (3-col outer)
          xl+     (1280px+): everything larger, gauges auto-fill
      */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Component dashes — 2×2, 1 col on mobile */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {hwLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80" />)
          ) : hw ? (
            <>
              <CpuDash cpu={hw.cpu} imagePath={componentImages?.cpu} onImageChange={() => void refreshComponentImages()} />
              <GpuDash gpus={hw.gpu} imagePath={componentImages?.gpu} onImageChange={() => void refreshComponentImages()} />
              <RamDash ram={hw.ram} imagePath={componentImages?.ram} onImageChange={() => void refreshComponentImages()} />
              <StorageDash disks={hw.storage} imagePath={componentImages?.storage} onImageChange={() => void refreshComponentImages()} />
            </>
          ) : (
            <div className="col-span-2 flex items-center justify-center h-48 text-xs font-mono text-cyber-red">
              ERROR: failed to collect hardware data
            </div>
          )}
        </div>

        {/* Right sidebar — case search + system info */}
        <div className="flex flex-col gap-3">
          <CaseSearchCard />

          {hw && (
            <div className="rounded-lg border border-cyber-border bg-cyber-panel/80 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-mono font-bold text-cyber-text-dim tracking-widest uppercase">
                  System
                </p>
                <button
                  onClick={copyBuild}
                  title="Copiar specs completos"
                  className="flex items-center gap-1 text-[10px] font-mono text-cyber-text-dim hover:text-cyber-cyan transition-colors"
                >
                  {copied ? <Check size={11} className="text-cyber-green" /> : <Copy size={11} />}
                  {copied ? <span className="text-cyber-green">COPIED</span> : 'COPY'}
                </button>
              </div>
              <SysRow label="OS" value={hw.os.distro.replace('Microsoft ', '')} />
              <SysRow label="Build" value={hw.os.build} accent="text-cyber-cyan" />
              <SysRow label="Uptime" value={hw.os.uptimeHuman} />
              {hw.mobo.model && (
                <SysRow label="Motherboard" value={`${hw.mobo.manufacturer} ${hw.mobo.model}`.trim()} />
              )}
              <SysRow
                label="BIOS"
                value={`${hw.bios.version} (${hw.bios.vendor})`}
                accent={biosAge > 365 ? 'text-cyber-amber' : undefined}
              />
              <SysRow
                label="BIOS Age"
                value={`${hw.bios.daysSinceRelease} days`}
                accent={biosAge > 365 ? 'text-cyber-amber' : undefined}
              />
              {hw.gpu[0]?.driverDate && hw.gpu[0].driverDate !== 'N/A' && (
                <SysRow label="GPU Driver" value={hw.gpu[0].driverDate} />
              )}
            </div>
          )}
        </div>
      </section>

      {/* ══ BIOS WARNING ════════════════════════════════════════════════════ */}
      {biosAge > 365 && hw?.bios && (
        <div className="mb-4 px-3 py-2 rounded border border-cyber-amber/30 bg-cyber-amber/5 text-xs font-mono text-cyber-amber">
          ⚠ BIOS {hw.bios.version}
          {hw.mobo.model ? ` · ${hw.mobo.manufacturer} ${hw.mobo.model}` : ''} — released {hw.bios.daysSinceRelease} days ago. Check for updates on your motherboard manufacturer's website.
        </div>
      )}

      {/* ══ UPGRADE RADAR + ANALYSIS ════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {pricesLoading ? (
          <>
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </>
        ) : (
          <>
            <UpgradeRadar prices={pricesData?.prices ?? []} />
            <ComparisonTable hw={hw} />
          </>
        )}
      </section>

      {/* ══ BUILD TIMELINE ══════════════════════════════════════════════════ */}
      <section className="mb-4">
        <BuildTimeline events={timelineData?.events ?? []} />
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-cyber-border pt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-mono text-cyber-text-dim">
          MYBUILD-STATS v0.1.0 · AM4 Platform
        </span>
        <span className="text-xs font-mono text-cyber-text-dim">
          Prices: checked every 12h · Images: DuckDuckGo
        </span>
      </footer>
    </div>
  )
}
