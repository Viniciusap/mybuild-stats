import { execPS, readReg } from '../helpers'
import type { OptimizationCheck, DeviceProfile } from '@/types/optimization'

export function checkVBSHVCI(_profile: DeviceProfile): OptimizationCheck {
  // Check if managed by Group Policy (enterprise) — user cannot change this
  const policyVBS = readReg('HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DeviceGuard', 'EnableVirtualizationBasedSecurity')
  if (policyVBS !== null) {
    return {
      id: 'vbs-hvci',
      category: 'system',
      name: 'VBS / Memory Integrity (HVCI)',
      description: 'Virtualization-based security — active state impacts gaming performance 5-10%',
      status: 'managed_by_policy',
      currentValue: 'Managed by organization policy',
      impact: 'high',
      reason: 'Cannot be changed — controlled by Group Policy',
      appliesToDevice: 'all',
    }
  }

  // Use Get-ComputerInfo for running state (configured ≠ running — pending reboot)
  const smartStatus = execPS(
    '(Get-ComputerInfo -Property DeviceGuardSmartStatus).DeviceGuardSmartStatus',
    10000
  )
  const isRunning = smartStatus !== '' && smartStatus.toLowerCase() !== 'off'

  return {
    id: 'vbs-hvci',
    category: 'system',
    name: 'VBS / Memory Integrity (HVCI)',
    description: 'Virtualization-based security — active state impacts gaming performance 5-10%',
    status: isRunning ? 'suboptimal' : 'optimal',
    currentValue: isRunning ? `Active (${smartStatus})` : 'Disabled',
    recommendedValue: 'Disabled for gaming',
    impact: 'high',
    fixInstructions: isRunning
      ? 'Configurações → Segurança do Windows → Segurança do dispositivo → Isolamento de núcleo → Integridade de memória → Desativar → Reiniciar'
      : undefined,
    appliesToDevice: 'all',
  }
}
