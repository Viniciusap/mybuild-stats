import { execPS } from '../helpers'
import type { OptimizationCheck, DeviceProfile } from '@/types/optimization'

export function checkGPUMSIMode(profile: DeviceProfile): OptimizationCheck {
  if (profile.isVM) {
    return {
      id: 'gpu-msi',
      category: 'gpu',
      name: 'GPU MSI Mode',
      description: 'Message Signaled Interrupts reduce GPU interrupt latency',
      status: 'not_applicable',
      impact: 'info',
      reason: 'Virtual machine',
      appliesToDevice: 'all',
    }
  }

  const msiValue = execPS(`
    $gpu = Get-PnpDevice -Class Display -Status OK -ErrorAction SilentlyContinue |
      Where-Object {$_.FriendlyName -notmatch 'Microsoft|Basic'} |
      Select-Object -First 1
    if ($gpu) {
      $path = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\$($gpu.InstanceId)\\Device Parameters\\Interrupt Management\\MessageSignaledInterruptProperties"
      if (Test-Path $path) {
        (Get-ItemProperty $path -ErrorAction SilentlyContinue).MSISupported
      } else { 'no_path' }
    } else { 'no_device' }
  `.trim(), 10000)

  if (!msiValue || msiValue === 'no_device') {
    return {
      id: 'gpu-msi',
      category: 'gpu',
      name: 'GPU MSI Mode',
      description: 'Message Signaled Interrupts reduce GPU interrupt latency',
      status: 'unknown',
      impact: 'medium',
      reason: 'GPU PnP device not found',
      appliesToDevice: 'all',
    }
  }

  if (msiValue === 'no_path') {
    // Path absent = MSI managed by driver default (usually enabled on modern GPUs)
    return {
      id: 'gpu-msi',
      category: 'gpu',
      name: 'GPU MSI Mode',
      description: 'Message Signaled Interrupts reduce GPU interrupt latency',
      status: 'info',
      currentValue: 'Driver default (likely enabled on modern GPU)',
      impact: 'medium',
      reason: 'MSI registry path absent — modern drivers enable MSI by default',
      appliesToDevice: 'all',
    }
  }

  const enabled = msiValue.trim() === '1'

  return {
    id: 'gpu-msi',
    category: 'gpu',
    name: 'GPU MSI Mode',
    description: 'Message Signaled Interrupts reduce GPU interrupt latency',
    status: enabled ? 'optimal' : 'suboptimal',
    currentValue: enabled ? 'Enabled' : 'Disabled',
    recommendedValue: 'Enabled',
    impact: 'medium',
    fixInstructions: !enabled
      ? 'Use MSI Utility v3 to enable MSI mode for the GPU (requires admin + reboot)'
      : undefined,
    appliesToDevice: 'all',
  }
}
