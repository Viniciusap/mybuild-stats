import { buildDeviceProfile } from '@/lib/device-profile'
import { ensureDxdiagFresh, readCacheJson, writeCacheJson } from './dxdiag-cache'
import { checkHAGS } from './checks/hags'
import { checkReBAR } from './checks/rebar'
import { checkPowerPlan } from './checks/power-plan'
import { checkVBSHVCI } from './checks/vbs-hvci'
import { checkRAMSpeed } from './checks/ram-speed'
import { checkRAMChannels } from './checks/ram-channels'
import { checkCPUBoost } from './checks/cpu-boost'
import { checkMousePrecision } from './checks/mouse-precision'
import { checkTRIM } from './checks/trim'
import { checkFastStartup } from './checks/fast-startup'
import { checkGPUMSIMode } from './checks/gpu-msi-mode'
import { checkGameMode } from './checks/game-mode'
import type { OptimizationCheck, OptimizationSummary, OptimizationsResult } from '@/types/optimization'

const CHECKS_TTL = 5 * 60 * 1000  // fast checks refresh every 5 min

function summarize(checks: OptimizationCheck[]): OptimizationSummary {
  return {
    critical: checks.filter(c => c.status === 'suboptimal' && c.impact === 'high').length,
    warnings: checks.filter(c => c.status === 'suboptimal' && (c.impact === 'medium' || c.impact === 'low')).length,
    info: checks.filter(c => c.status === 'info').length,
    optimal: checks.filter(c => c.status === 'optimal').length,
  }
}

export async function runOptimizationChecks(forceRefresh = false): Promise<OptimizationsResult> {
  const cache = readCacheJson()
  const checksStale = Date.now() - cache.checksTimestamp > CHECKS_TTL

  if (!forceRefresh && !checksStale && cache.result) {
    // Ensure dxdiag stays fresh in background without blocking return
    ensureDxdiagFresh()
    return cache.result
  }

  // Kick off dxdiag refresh if stale (async — doesn't block check results)
  ensureDxdiagFresh()

  const profile = await buildDeviceProfile()

  const checks = await Promise.all([
    Promise.resolve(checkHAGS(profile)),
    Promise.resolve(checkReBAR(profile)),
    Promise.resolve(checkPowerPlan(profile)),
    Promise.resolve(checkVBSHVCI(profile)),
    Promise.resolve(checkRAMSpeed(profile)),
    Promise.resolve(checkRAMChannels(profile)),
    Promise.resolve(checkCPUBoost(profile)),
    Promise.resolve(checkMousePrecision(profile)),
    Promise.resolve(checkTRIM(profile)),
    Promise.resolve(checkFastStartup(profile)),
    Promise.resolve(checkGPUMSIMode(profile)),
    Promise.resolve(checkGameMode(profile)),
  ])

  const result: OptimizationsResult = {
    profile,
    checks,
    summary: summarize(checks),
    cachedAt: new Date().toISOString(),
  }

  writeCacheJson({ checksTimestamp: Date.now(), result })

  return result
}
