import { readReg, execPS } from '../helpers'
import type { OptimizationCheck, DeviceProfile } from '@/types/optimization'

export function checkFastStartup(profile: DeviceProfile): OptimizationCheck {
  const hiberboot = readReg(
    'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power',
    'HiberbootEnabled'
  )

  // If hibernate is disabled, Fast Startup can't function regardless of registry key
  const hibOut = execPS('powercfg /a 2>$null', 5000)
  const hibernateAvailable = /hibern/i.test(hibOut) && !/not available|não disponível|indisponível/i.test(hibOut)

  if (!hibernateAvailable) {
    return {
      id: 'fast-startup',
      category: 'system',
      name: 'Fast Startup',
      description: 'Hybrid shutdown mixing hibernation',
      status: 'optimal',
      currentValue: 'Inactive (Hibernate disabled — no effect)',
      impact: 'low',
      appliesToDevice: 'all',
    }
  }

  const enabled = hiberboot === '1'

  return {
    id: 'fast-startup',
    category: 'system',
    name: 'Fast Startup',
    description: 'Hybrid shutdown mixing hibernation — can cause driver state inconsistency',
    status: enabled ? 'info' : 'optimal',
    currentValue: enabled ? 'Enabled' : 'Disabled',
    recommendedValue: profile.type === 'laptop' ? 'Personal preference' : 'Disabled (single-boot gaming PC)',
    impact: 'low',
    reason: enabled ? 'Can cause issues with dual-boot systems and some hardware/driver combinations' : undefined,
    fixInstructions: enabled
      ? 'Painel de Controle → Opções de Energia → clique "Alterar configurações não disponíveis no momento" (requer admin) → desmarcar "Ligar inicialização rápida"'
      : undefined,
    appliesToDevice: 'all',
  }
}
