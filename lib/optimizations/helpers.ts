import { execSync } from 'child_process'
import type { OptimizationCheck, CheckCategory } from '@/types/optimization'

export function execPS(command: string, timeoutMs = 4000): string {
  try {
    return execSync(command, {
      shell: 'powershell.exe',
      stdio: 'pipe',
      timeout: timeoutMs,
      windowsHide: true,
    }).toString().trim()
  } catch {
    return ''
  }
}

export function readReg(path: string, key: string): string | null {
  const out = execPS(
    `(Get-ItemProperty -Path '${path}' -ErrorAction SilentlyContinue).${key}`,
    5000
  )
  return out || null
}

export function notApplicable(
  id: string, name: string, category: CheckCategory, reason: string
): OptimizationCheck {
  return {
    id, name, category,
    description: '',
    status: 'not_applicable',
    impact: 'info',
    appliesToDevice: 'all',
    reason,
  }
}

export function unknownCheck(
  id: string, name: string, category: CheckCategory, reason: string
): OptimizationCheck {
  return {
    id, name, category,
    description: '',
    status: 'unknown',
    impact: 'info',
    appliesToDevice: 'all',
    reason,
  }
}

export function errorCheck(
  id: string, name: string, category: CheckCategory, reason: string
): OptimizationCheck {
  return {
    id, name, category,
    description: '',
    status: 'error',
    impact: 'info',
    appliesToDevice: 'all',
    reason,
  }
}
