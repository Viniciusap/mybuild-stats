import { execPS } from '../helpers'
import type { OptimizationCheck, DeviceProfile } from '@/types/optimization'

export function checkRAMChannels(profile: DeviceProfile): OptimizationCheck {
  const count = profile.ramSticks

  if (count === 0) {
    return {
      id: 'ram-channels',
      category: 'memory',
      name: 'RAM Dual Channel',
      description: 'Dual channel doubles memory bandwidth',
      status: 'unknown',
      impact: 'high',
      reason: 'Could not detect RAM configuration',
      appliesToDevice: 'all',
    }
  }

  if (count === 1) {
    return {
      id: 'ram-channels',
      category: 'memory',
      name: 'RAM Dual Channel',
      description: 'Dual channel doubles memory bandwidth',
      status: 'suboptimal',
      currentValue: '1 stick — single channel',
      recommendedValue: '2 matching sticks in correct slots',
      impact: 'high',
      fixInstructions: 'Add a matching RAM stick and place both in A2+B2 slots (check motherboard manual).',
      appliesToDevice: 'all',
    }
  }

  // Read BankLabel to check channel assignment
  const out = execPS(
    'Get-WmiObject Win32_PhysicalMemory | Select Capacity,BankLabel | ConvertTo-Json -Compress',
    6000
  )

  let sticks: Array<{ Capacity: number; BankLabel: string }> = []
  try {
    const raw = JSON.parse(out)
    sticks = Array.isArray(raw) ? raw : [raw]
  } catch {
    // Fall through to size-based checks only
  }

  const sizes = sticks.map(s => s.Capacity)
  const allSameSize = sizes.length > 0 && sizes.every(s => s === sizes[0])

  if (!allSameSize && sizes.length > 0) {
    return {
      id: 'ram-channels',
      category: 'memory',
      name: 'RAM Dual Channel',
      description: 'Dual channel doubles memory bandwidth',
      status: 'suboptimal',
      currentValue: `${count} sticks, mismatched sizes (${sizes.map(s => `${Math.round(s / 1024 ** 3)}GB`).join('+')})`,
      recommendedValue: 'Matching capacity sticks for proper dual channel',
      impact: 'medium',
      reason: 'Mismatched sizes limit dual channel efficiency',
      appliesToDevice: 'all',
    }
  }

  if (count % 2 !== 0) {
    return {
      id: 'ram-channels',
      category: 'memory',
      name: 'RAM Dual Channel',
      description: 'Dual channel doubles memory bandwidth',
      status: 'info',
      currentValue: `${count} sticks (odd count)`,
      impact: 'low',
      reason: 'Odd number of sticks — one stick runs single channel',
      appliesToDevice: 'all',
    }
  }

  // Check BankLabel for channel info (not universal — only confirm if clearly labeled)
  const bankLabels = sticks.map(s => (s.BankLabel ?? '').toLowerCase())
  const hasChannelInfo = bankLabels.some(b => b.includes('channel'))

  if (hasChannelInfo) {
    const channels = new Set(
      bankLabels.map(b => { const m = b.match(/channel\s*([a-z])/i); return m?.[1] ?? b })
    )
    const isDual = channels.size >= 2
    return {
      id: 'ram-channels',
      category: 'memory',
      name: 'RAM Dual Channel',
      description: 'Dual channel doubles memory bandwidth',
      status: isDual ? 'optimal' : 'suboptimal',
      currentValue: isDual
        ? `${count} sticks, dual channel (${bankLabels.join(' / ')})`
        : `${count} sticks, same channel (${bankLabels.join(' / ')})`,
      impact: 'high',
      fixInstructions: !isDual ? 'Move sticks to A2+B2 slots (check motherboard manual)' : undefined,
      appliesToDevice: 'all',
    }
  }

  // 2+ matching sticks, no clear channel label — cannot confirm
  return {
    id: 'ram-channels',
    category: 'memory',
    name: 'RAM Dual Channel',
    description: 'Dual channel doubles memory bandwidth',
    status: 'info',
    currentValue: `${count}× ${allSameSize && sizes[0] ? `${Math.round(sizes[0] / 1024 ** 3)}GB` : 'sticks'}`,
    impact: 'high',
    reason: 'Channel configuration unclear from Windows. Verify sticks are in A2+B2 slots and confirm in CPU-Z.',
    appliesToDevice: 'all',
  }
}
