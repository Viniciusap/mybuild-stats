import { execPS } from '../helpers'
import type { OptimizationCheck, DeviceProfile } from '@/types/optimization'

export function checkTRIM(profile: DeviceProfile): OptimizationCheck {
  const hasSSD = profile.storageTypes.some(t => t === 'SSD' || t === 'NVMe')

  if (!hasSSD) {
    return {
      id: 'trim',
      category: 'storage',
      name: 'TRIM (SSD)',
      description: 'TRIM allows OS to inform SSD which blocks are no longer needed',
      status: 'not_applicable',
      impact: 'info',
      reason: 'No SSD detected — TRIM only applies to SSDs',
      appliesToDevice: 'all',
    }
  }

  const output = execPS('fsutil behavior query DisableDeleteNotify')
  // "NTFS DisableDeleteNotify = 0" → TRIM enabled (good)
  const ntfsMatch = output.match(/NTFS DisableDeleteNotify\s*=\s*(\d)/)
  const ntfsValue = ntfsMatch ? parseInt(ntfsMatch[1]) : -1

  if (ntfsValue === -1) {
    return {
      id: 'trim',
      category: 'storage',
      name: 'TRIM (SSD)',
      description: 'Prevents SSD performance degradation over time',
      status: 'unknown',
      impact: 'medium',
      reason: 'Could not read TRIM state',
      appliesToDevice: 'all',
    }
  }

  const trimEnabled = ntfsValue === 0

  return {
    id: 'trim',
    category: 'storage',
    name: 'TRIM (SSD)',
    description: 'Prevents SSD performance degradation over time',
    status: trimEnabled ? 'optimal' : 'suboptimal',
    currentValue: trimEnabled ? 'Enabled' : 'Disabled',
    recommendedValue: 'Enabled',
    impact: 'medium',
    fixInstructions: !trimEnabled
      ? 'Run as administrator: fsutil behavior set disabledeletenotify 0'
      : undefined,
    appliesToDevice: 'all',
  }
}
