import type { OptimizationCheck, DeviceProfile } from '@/types/optimization'

// Highest JEDEC standard speed per generation (above this = XMP/EXPO required)
const JEDEC_MAX: Record<string, number> = {
  DDR4: 2666,
  DDR5: 4800,
  unknown: 2666,
}

export function checkRAMSpeed(profile: DeviceProfile): OptimizationCheck {
  const rated = profile.ramRatedMHz
  const running = profile.ramSpeedMHz
  const gen = profile.ramGeneration
  const jedecMax = JEDEC_MAX[gen] ?? 2666

  if (!running || !rated) {
    return {
      id: 'ram-xmp',
      category: 'memory',
      name: 'RAM Speed / XMP',
      description: 'RAM running at rated XMP/EXPO speed',
      status: 'unknown',
      impact: 'medium',
      reason: 'Could not read RAM speed info',
      appliesToDevice: 'all',
    }
  }

  // Running below rated spec — XMP/EXPO definitely off
  if (running < rated) {
    return {
      id: 'ram-xmp',
      category: 'memory',
      name: 'RAM Speed / XMP',
      description: 'RAM running below rated speed — XMP/EXPO not active',
      status: 'suboptimal',
      currentValue: `${running} MHz (rated: ${rated} MHz)`,
      recommendedValue: `${rated} MHz via XMP/EXPO`,
      impact: 'high',
      fixInstructions: 'BIOS → Advanced → AI Tweaker / D.O.C.P / XMP / EXPO → Enable profile',
      appliesToDevice: 'all',
    }
  }

  // Running above JEDEC max — XMP/EXPO must be active
  if (rated > jedecMax) {
    return {
      id: 'ram-xmp',
      category: 'memory',
      name: 'RAM Speed / XMP',
      description: 'RAM running at rated XMP/EXPO speed',
      status: 'optimal',
      currentValue: `${running} MHz ${gen} (above JEDEC ${jedecMax} MHz max — XMP/EXPO active)`,
      impact: 'high',
      appliesToDevice: 'all',
    }
  }

  // Within JEDEC range — cannot confirm XMP state from Windows
  return {
    id: 'ram-xmp',
    category: 'memory',
    name: 'RAM Speed / XMP',
    description: 'RAM at JEDEC standard speed — XMP state unconfirmable from Windows',
    status: 'info',
    currentValue: `${running} MHz ${gen} (within JEDEC standard)`,
    recommendedValue: 'Verify XMP/EXPO profile is enabled in BIOS',
    impact: 'medium',
    reason: `${running} MHz is within JEDEC range — XMP may or may not be active`,
    fixInstructions: 'BIOS → Verify XMP/EXPO/DOCP profile is selected',
    appliesToDevice: 'all',
  }
}

