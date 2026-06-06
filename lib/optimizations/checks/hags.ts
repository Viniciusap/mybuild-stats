import { getOrRefreshHAGS } from '../dxdiag-cache'
import { notApplicable } from '../helpers'
import type { OptimizationCheck, DeviceProfile } from '@/types/optimization'

export function checkHAGS(profile: DeviceProfile): OptimizationCheck {
  if (profile.isVM) return notApplicable('hags', 'Hardware-Accelerated GPU Scheduling', 'gpu', 'Virtual machine')

  // Runs dxdiag sync on first call (~15s), cached for 1h after
  const hagsData = getOrRefreshHAGS()

  if (!hagsData) {
    return {
      id: 'hags',
      category: 'gpu',
      name: 'Hardware-Accelerated GPU Scheduling (HAGS)',
      description: 'Reduces GPU scheduling latency by bypassing CPU scheduler',
      status: 'unknown',
      impact: 'high',
      reason: 'dxdiag did not return HAGS data',
      appliesToDevice: 'all',
    }
  }

  const { enabled, driverSupportState } = hagsData
  const driverSupported = driverSupportState?.toLowerCase() === 'stable'

  if (!enabled) {
    return {
      id: 'hags',
      category: 'gpu',
      name: 'Hardware-Accelerated GPU Scheduling (HAGS)',
      description: 'Reduces GPU scheduling latency by bypassing CPU scheduler',
      status: 'suboptimal',
      currentValue: 'Disabled',
      recommendedValue: 'Enabled',
      impact: 'high',
      fixInstructions: 'Configurações → Sistema → Tela → Elementos gráficos → Configurações gráficas avançadas → Agendamento de GPU acelerado por hardware → Ativar → Reiniciar',
      appliesToDevice: 'all',
    }
  }

  if (!driverSupported) {
    return {
      id: 'hags',
      category: 'gpu',
      name: 'Hardware-Accelerated GPU Scheduling (HAGS)',
      description: 'Reduces GPU scheduling latency by bypassing CPU scheduler',
      status: 'suboptimal',
      currentValue: `Enabled but driver state: ${driverSupportState}`,
      recommendedValue: 'Enabled with Stable driver support',
      impact: 'medium',
      reason: `GPU driver reports DriverSupportState:${driverSupportState} — update GPU driver`,
      fixInstructions: 'Update GPU drivers to a version that supports HAGS (WDDM 2.7+)',
      appliesToDevice: 'all',
    }
  }

  return {
    id: 'hags',
    category: 'gpu',
    name: 'Hardware-Accelerated GPU Scheduling (HAGS)',
    description: 'Reduces GPU scheduling latency by bypassing CPU scheduler',
    status: 'optimal',
    currentValue: `Enabled (${driverSupportState})`,
    impact: 'high',
    appliesToDevice: 'all',
  }
}
