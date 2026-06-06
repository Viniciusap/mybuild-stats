import { execPS } from '../helpers'
import type { OptimizationCheck, DeviceProfile } from '@/types/optimization'

const GUID_ULTIMATE = 'e9a42b02-d5df-448d-aa00-03f14749eb61'
const GUID_HIGH     = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'
const GUID_BALANCED = '381b4222-f694-41f0-9685-ff5bb260df2e'

export function checkPowerPlan(profile: DeviceProfile): OptimizationCheck {
  const output = execPS('powercfg /getactivescheme')
  const match = output.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s+\((.+?)\)/i)

  const guid = match?.[1]?.toLowerCase() ?? ''
  const name = match?.[2] ?? 'Unknown'
  const onBattery = profile.hasBattery && !profile.isCharging
  const isAmdRyzen = profile.cpuVendor === 'amd'

  // On battery: Balanced is correct regardless of CPU
  if (onBattery) {
    const isBalanced = guid === GUID_BALANCED
    return {
      id: 'power-plan',
      category: 'system',
      name: 'Power Plan',
      description: 'Controls CPU/GPU power states and frequency scaling',
      status: isBalanced ? 'optimal' : 'info',
      currentValue: name,
      recommendedValue: 'Balanced (on battery)',
      impact: 'medium',
      reason: 'Running on battery — Balanced preserves battery life',
      appliesToDevice: 'laptop',
    }
  }

  const isHighOrUltimate = guid === GUID_ULTIMATE || guid === GUID_HIGH

  if (isHighOrUltimate) {
    return {
      id: 'power-plan',
      category: 'system',
      name: 'Power Plan',
      description: 'Controls CPU/GPU power states and frequency scaling',
      status: 'optimal',
      currentValue: name,
      // AMD Ryzen note: Balanced can match High Performance due to CPPC2/Precision Boost
      recommendedValue: isAmdRyzen
        ? 'High Performance / Ultimate Performance (Balanced also valid for Ryzen with CPPC2)'
        : 'High Performance / Ultimate Performance',
      impact: 'medium',
      appliesToDevice: 'all',
    }
  }

  return {
    id: 'power-plan',
    category: 'system',
    name: 'Power Plan',
    description: 'Controls CPU/GPU power states and frequency scaling',
    status: 'suboptimal',
    currentValue: name,
    recommendedValue: isAmdRyzen
      ? 'High Performance or Ultimate Performance (note: Balanced also performs well on Ryzen)'
      : 'High Performance or Ultimate Performance',
    impact: 'medium',
    fixInstructions: 'Painel de Controle → Opções de Energia → Selecionar "Alto desempenho" ou ativar "Desempenho Máximo"',
    appliesToDevice: 'all',
  }
}
