import { execPS } from '../helpers'
import type { OptimizationCheck, DeviceProfile } from '@/types/optimization'

const BOOST_MODES: Record<number, string> = {
  0: 'Disabled',
  1: 'Enabled',
  2: 'Aggressive',
  3: 'Efficient Aggressive',
  4: 'Efficient Enabled',
}

export function checkCPUBoost(_profile: DeviceProfile): OptimizationCheck {
  // Get active scheme GUID dynamically (avoids hardcoded GUIDs that break on OEM plans)
  const schemeOut = execPS('powercfg /getactivescheme')
  const guidMatch = schemeOut.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  const guid = guidMatch?.[1]

  if (!guid) {
    return {
      id: 'cpu-boost',
      category: 'cpu',
      name: 'CPU Boost / Turbo',
      description: 'CPU frequency boost above base clock for peak single-thread performance',
      status: 'unknown',
      impact: 'high',
      reason: 'Could not detect active power plan',
      appliesToDevice: 'all',
    }
  }

  const boostOut = execPS(
    `powercfg /query ${guid} SUB_PROCESSOR PERFBOOSTMODE 2>$null | Select-String 'Current AC Power Setting Index'`,
    8000
  )

  if (!boostOut) {
    // Ultimate Performance plan has boost enabled by default — confirm by GUID
    const isUltimate = guid.toLowerCase() === 'e9a42b02-d5df-448d-aa00-03f14749eb61'
    return {
      id: 'cpu-boost',
      category: 'cpu',
      name: 'CPU Boost / Turbo',
      description: 'CPU frequency boost above base clock for peak single-thread performance',
      status: isUltimate ? 'optimal' : 'unknown',
      currentValue: isUltimate ? 'Enabled (Ultimate Performance plan)' : 'Unknown',
      impact: 'high',
      reason: isUltimate ? undefined : 'Could not query boost mode from active power plan',
      appliesToDevice: 'all',
    }
  }

  const valMatch = boostOut.match(/0x([0-9a-f]+)/i)
  const value = valMatch ? parseInt(valMatch[1], 16) : -1
  const boostEnabled = value > 0
  const modeLabel = BOOST_MODES[value] ?? `Mode ${value}`

  return {
    id: 'cpu-boost',
    category: 'cpu',
    name: 'CPU Boost / Turbo',
    description: 'CPU frequency boost above base clock for peak single-thread performance',
    status: boostEnabled ? 'optimal' : 'suboptimal',
    currentValue: modeLabel,
    recommendedValue: 'Enabled or Aggressive',
    impact: 'high',
    fixInstructions: !boostEnabled
      ? 'Painel de Controle → Opções de Energia → Alterar configurações do plano → Configurações avançadas → Gerenciamento de energia do processador → Modo de aumento → Habilitado'
      : undefined,
    appliesToDevice: 'all',
  }
}
