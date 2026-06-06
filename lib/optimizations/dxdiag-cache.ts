import { spawnSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import type { OptimizationsCache, DxdiagHAGS } from '@/types/optimization'
import { safeSpawnEnv } from '@/lib/spawn-env'

const CACHE_PATH = join(process.cwd(), 'data', 'optimizations-cache.json')
const DXDIAG_TTL = 60 * 60 * 1000  // 1 hour

export function readCacheJson(): OptimizationsCache {
  try {
    return JSON.parse(readFileSync(CACHE_PATH, 'utf-8')) as OptimizationsCache
  } catch {
    return { checksTimestamp: 0, dxdiagTimestamp: 0, hags: null, result: null }
  }
}

export function writeCacheJson(partial: Partial<OptimizationsCache>): void {
  const existing = readCacheJson()
  writeFileSync(CACHE_PATH, JSON.stringify({ ...existing, ...partial }, null, 2))
}

export function isDxdiagStale(): boolean {
  return Date.now() - readCacheJson().dxdiagTimestamp > DXDIAG_TTL
}

function parseDxdiag(text: string): DxdiagHAGS | null {
  // dxdiag /t always outputs in English regardless of system locale
  const match = text.match(/Hardware Scheduling:.*?DriverSupportState:(\w+).*?Enabled:(\w+)/i)
  if (!match) return null
  return {
    enabled: match[2].toLowerCase() === 'true',
    driverSupportState: match[1],
  }
}

// Run dxdiag via a temp PS1 script file using spawnSync (no shell quoting issues)
// Blocks for ~20-40s on first call, then cached for 1 hour
export function runDxdiagSync(): DxdiagHAGS | null {
  const tmp = tmpdir()
  // Forward slashes — PowerShell accepts both and avoids backslash escaping
  const outFile = join(tmp, 'dxdiag_mybuild.txt').split('\\').join('/')
  const scriptFile = join(tmp, 'run_dxdiag.ps1')

  const script = [
    `$out = "${outFile}"`,
    `$dx = if (Test-Path 'C:/Windows/System32/dxdiag.exe') { 'C:/Windows/System32/dxdiag.exe' } else { 'dxdiag' }`,
    `Start-Process $dx -ArgumentList "/t",$out -Wait -NoNewWindow`,
    `if (Test-Path $out) { (Get-Content $out | Select-String "Hardware Scheduling" | Select-Object -First 1).Line; Remove-Item $out -Force -ErrorAction SilentlyContinue } else { Write-Output "FILE_NOT_FOUND" }`,
  ].join('\n')

  try {
    console.log('[dxdiag] writing script to:', scriptFile)
    writeFileSync(scriptFile, script, 'utf-8')
    console.log('[dxdiag] script written, exists:', existsSync(scriptFile))

    const r = spawnSync('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptFile,
    ], { timeout: 90000, encoding: 'utf-8', windowsHide: true, env: safeSpawnEnv() })

    if (existsSync(scriptFile)) unlinkSync(scriptFile)

    const output = (r.stdout ?? '').trim()
    console.log('[dxdiag] status:', r.status, '| error:', r.error?.message, '| stdout:', output.slice(0, 100), '| stderr:', (r.stderr ?? '').slice(0, 200))

    if (!output || output === 'FILE_NOT_FOUND') return null
    return parseDxdiag(output)
  } catch (e) {
    console.error('[dxdiag] exception:', e)
    try { if (existsSync(scriptFile)) unlinkSync(scriptFile) } catch { /* ignore */ }
    return null
  }
}

export function getOrRefreshHAGS(): DxdiagHAGS | null {
  const cache = readCacheJson()

  if (!isDxdiagStale() && cache.hags != null) {
    return cache.hags
  }

  const hags = runDxdiagSync()
  writeCacheJson({ dxdiagTimestamp: Date.now(), hags })
  return hags
}

// No-op kept for compatibility — sync approach replaces async background
export function ensureDxdiagFresh(): void {}
export function refreshDxdiagAsync(): void {}
