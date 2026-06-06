import { readReg } from '../helpers'
import type { OptimizationCheck, DeviceProfile } from '@/types/optimization'

export function checkGameMode(_profile: DeviceProfile): OptimizationCheck {
  const allowAutoGameMode = readReg('HKCU:\\Software\\Microsoft\\GameBar', 'AllowAutoGameMode')
  const autoGameModeEnabled = readReg('HKCU:\\Software\\Microsoft\\GameBar', 'AutoGameModeEnabled')

  // Both null = key absent = Windows default = Game Mode ON
  // '0' on either = explicitly disabled
  const disabled = allowAutoGameMode === '0' || autoGameModeEnabled === '0'

  return {
    id: 'game-mode',
    category: 'system',
    name: 'Windows Game Mode',
    description: 'Prioritizes CPU/GPU resources for the active game process',
    status: disabled ? 'suboptimal' : 'optimal',
    currentValue: disabled ? 'Disabled' : 'Enabled (default)',
    recommendedValue: 'Enabled',
    impact: 'low',
    fixInstructions: disabled
      ? 'Configurações → Jogos → Modo de jogo → Ativar'
      : undefined,
    appliesToDevice: 'all',
  }
}
