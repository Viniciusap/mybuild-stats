import { readReg } from '../helpers'
import type { OptimizationCheck, DeviceProfile } from '@/types/optimization'

export function checkMousePrecision(_profile: DeviceProfile): OptimizationCheck {
  const speed = readReg('HKCU:\\Control Panel\\Mouse', 'MouseSpeed')

  // MouseSpeed: '0' = off, '1' or '2' = acceleration enabled
  const accelerationOn = speed !== null && speed !== '0'

  return {
    id: 'mouse-precision',
    category: 'input',
    name: 'Mouse Pointer Precision',
    description: 'Mouse acceleration — adds inconsistency to aiming in FPS games',
    status: accelerationOn ? 'info' : 'optimal',  // personal preference — not suboptimal
    currentValue: accelerationOn ? `Enabled (level ${speed})` : 'Disabled',
    recommendedValue: 'Disabled for FPS / competitive gaming',
    impact: 'low',
    reason: accelerationOn
      ? 'Adds acceleration to mouse movement. Recommended off for FPS — personal preference for other genres.'
      : undefined,
    fixInstructions: accelerationOn
      ? 'Configurações → Bluetooth e dispositivos → Mouse → Configurações adicionais do mouse → Ponteiro → Desmarcar "Aumentar a precisão do ponteiro"'
      : undefined,
    appliesToDevice: 'all',
  }
}
