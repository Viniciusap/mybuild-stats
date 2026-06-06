import { execSync } from 'child_process'
import { notApplicable, unknownCheck, execPS } from '../helpers'
import type { OptimizationCheck, DeviceProfile } from '@/types/optimization'

function checkReBAR_Nvidia(profile: DeviceProfile): OptimizationCheck {
  if (!profile.hasNvidiaSmi || !profile.nvidiaSmiPath) {
    return unknownCheck('rebar', 'Resizable BAR', 'gpu', 'nvidia-smi not found in PATH')
  }
  try {
    const output = execSync(`"${profile.nvidiaSmiPath}" -q`, {
      timeout: 15000, stdio: 'pipe', windowsHide: true,
    }).toString()

    const bar1Match = output.match(/BAR1 Memory Usage[\s\S]*?Total\s*:\s*(\d+)\s*MiB/)
    const fbMatch = output.match(/FB Memory Usage[\s\S]*?Total\s*:\s*(\d+)\s*MiB/)

    if (!bar1Match || !fbMatch) {
      return unknownCheck('rebar', 'Resizable BAR', 'gpu', 'Could not parse nvidia-smi output')
    }

    const bar1MB = parseInt(bar1Match[1])
    const vramMB = parseInt(fbMatch[1])
    const isActive = bar1MB >= vramMB * 0.95

    return {
      id: 'rebar',
      category: 'gpu',
      name: 'Resizable BAR (ReBAR)',
      description: 'Allows CPU to access full GPU VRAM directly, improving throughput',
      status: isActive ? 'optimal' : 'suboptimal',
      currentValue: `BAR1 ${bar1MB} MiB / VRAM ${vramMB} MiB`,
      recommendedValue: `BAR1 = VRAM (${vramMB} MiB)`,
      impact: 'high',
      fixInstructions: isActive ? undefined
        : 'BIOS: Above 4G Decoding → Enable + Resizable BAR Support → Enable. Requires UEFI mode (CSM disabled).',
      appliesToDevice: 'all',
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return unknownCheck('rebar', 'Resizable BAR', 'gpu', `nvidia-smi failed: ${msg}`)
  }
}

function checkReBAR_Generic(profile: DeviceProfile): OptimizationCheck {
  // For AMD/Intel: attempt PnP resource check — compare largest BAR vs reported VRAM
  try {
    const instanceId = execPS(
      `(Get-PnpDevice -Class Display -Status OK | Where-Object {$_.FriendlyName -notmatch 'Microsoft|Basic'} | Select-Object -First 1).InstanceId`
    )
    if (!instanceId) {
      return {
        id: 'rebar',
        category: 'gpu',
        name: profile.gpuVendor === 'amd' ? 'Resizable BAR (Smart Access Memory)' : 'Resizable BAR',
        description: 'Allows CPU full access to GPU VRAM',
        status: 'unknown',
        impact: 'high',
        reason: `${profile.gpuVendor.toUpperCase()} GPU — verify in BIOS`,
        fixInstructions: 'BIOS: Above 4G Decoding → Enable + Resizable BAR / Smart Access Memory → Enable',
        appliesToDevice: 'all',
      }
    }

    // Pull memory resource ranges allocated to the GPU
    const safeId = instanceId.replace(/'/g, "''")
    const resourceOut = execPS(`
      $deps = Get-WmiObject Win32_PnPAllocatedResource -ErrorAction SilentlyContinue |
        Where-Object { $_.Dependent -like '*${safeId}*' }
      $deps | ForEach-Object {
        try {
          $res = [wmi]$_.Antecedent
          if ($res.StartingAddress -ne $null) { "$($res.StartingAddress)-$($res.EndingAddress)" }
        } catch {}
      }
    `.trim(), 12000)

    if (!resourceOut) {
      return {
        id: 'rebar',
        category: 'gpu',
        name: profile.gpuVendor === 'amd' ? 'Resizable BAR (Smart Access Memory)' : 'Resizable BAR',
        description: 'Allows CPU full access to GPU VRAM',
        status: 'unknown',
        impact: 'high',
        reason: `${profile.gpuVendor.toUpperCase()} GPU — Windows resource query returned no data`,
        fixInstructions: 'BIOS: Above 4G Decoding → Enable + Resizable BAR / Smart Access Memory → Enable',
        appliesToDevice: 'all',
      }
    }

    let hasLargeBar = false
    for (const line of resourceOut.split('\n')) {
      const parts = line.trim().split('-')
      if (parts.length === 2) {
        try {
          const start = BigInt(parts[0].trim())
          const end = BigInt(parts[1].trim())
          const sizeMB = Number((end - start + BigInt(1)) / BigInt(1024 * 1024))
          if (sizeMB > 512) { hasLargeBar = true; break }
        } catch { continue }
      }
    }

    const label = profile.gpuVendor === 'amd' ? 'Resizable BAR (Smart Access Memory)' : 'Resizable BAR'
    return {
      id: 'rebar',
      category: 'gpu',
      name: label,
      description: 'Allows CPU full access to GPU VRAM, improving performance',
      status: hasLargeBar ? 'optimal' : 'suboptimal',
      currentValue: hasLargeBar ? 'Large BAR detected' : 'No large BAR detected',
      recommendedValue: 'Large BAR active',
      impact: 'high',
      reason: `${profile.gpuVendor.toUpperCase()} GPU — result approximate (confirm in BIOS)`,
      fixInstructions: hasLargeBar ? undefined
        : 'BIOS: Above 4G Decoding → Enable + Smart Access Memory / Resizable BAR → Enable',
      appliesToDevice: 'all',
    }
  } catch {
    return {
      id: 'rebar',
      category: 'gpu',
      name: 'Resizable BAR',
      description: 'Allows CPU full access to GPU VRAM',
      status: 'unknown',
      impact: 'high',
      reason: `${profile.gpuVendor.toUpperCase()} GPU — verify in BIOS`,
      fixInstructions: 'BIOS: Above 4G Decoding → Enable + Resizable BAR → Enable',
      appliesToDevice: 'all',
    }
  }
}

export function checkReBAR(profile: DeviceProfile): OptimizationCheck {
  if (profile.isVM) return notApplicable('rebar', 'Resizable BAR', 'gpu', 'Virtual machine')
  if (profile.gpuVendor === 'unknown') return unknownCheck('rebar', 'Resizable BAR', 'gpu', 'GPU vendor not detected')
  if (profile.gpuVendor === 'nvidia') return checkReBAR_Nvidia(profile)
  return checkReBAR_Generic(profile)
}
