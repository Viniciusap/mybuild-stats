export interface AutomationTask {
  id: string
  label: string
  description: string
  command: string
  args: string[]
  requiresAdmin: boolean
  estimatedSeconds: number
}

export const AUTOMATION_TASKS: AutomationTask[] = [
  {
    id: 'flush-dns',
    label: 'Flush DNS Cache',
    description: 'Resets the Windows DNS resolution cache.',
    command: 'ipconfig',
    args: ['/flushdns'],
    requiresAdmin: false,
    estimatedSeconds: 3,
  },
  {
    id: 'clean-temp',
    label: 'Clean TEMP Folder',
    description: 'Removes temporary files from %TEMP% and C:\\Windows\\Temp.',
    command: 'powershell',
    args: [
      '-NoProfile', '-NonInteractive', '-Command',
      [
        'Write-Output "Cleaning %TEMP%...";',
        'Get-ChildItem -Path $env:TEMP -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue;',
        'Write-Output "Cleaning C:\\Windows\\Temp...";',
        'Get-ChildItem -Path "C:\\Windows\\Temp" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue;',
        'Write-Output "Done."',
      ].join(' '),
    ],
    requiresAdmin: false,
    estimatedSeconds: 15,
  },
  {
    id: 'drivers-check',
    label: 'Check Drivers',
    description: 'Lists installed drivers and flags those older than 365 days.',
    command: 'powershell',
    args: [
      '-NoProfile', '-NonInteractive', '-Command',
      [
        '$today = Get-Date;',
        '$drivers = Get-WindowsDriver -Online -All -ErrorAction SilentlyContinue;',
        'if (-not $drivers) {',
        '  pnputil /enum-drivers;',
        '} else {',
        '  $drivers | Sort-Object Date -Descending | ForEach-Object {',
        '    $age = ($today - $_.Date).Days;',
        '    $flag = if ($age -gt 365) { "[OUTDATED $age days]" } else { "[OK $age days]" };',
        '    Write-Output "$flag  $($_.OriginalFileName)  $($_.DriverDescription)  $($_.Date.ToString(\'yyyy-MM-dd\'))";',
        '  }',
        '}',
      ].join(' '),
    ],
    requiresAdmin: false,
    estimatedSeconds: 20,
  },
  {
    id: 'winget-upgrade',
    label: 'Upgrade All Packages (winget)',
    description: 'Updates all installed packages via winget.',
    command: 'winget',
    args: ['upgrade', '--all', '--accept-source-agreements', '--accept-package-agreements'],
    requiresAdmin: true,
    estimatedSeconds: 120,
  },
  {
    id: 'dism-restorehealth',
    label: 'DISM — Restore Health',
    description: 'Checks and repairs the Windows image (may take 10+ minutes).',
    command: 'dism',
    args: ['/Online', '/Cleanup-Image', '/RestoreHealth'],
    requiresAdmin: true,
    estimatedSeconds: 600,
  },
  {
    id: 'sfc-scan',
    label: 'SFC — Scan System Files',
    description: 'Verifies integrity of Windows system files.',
    command: 'sfc',
    args: ['/scannow'],
    requiresAdmin: true,
    estimatedSeconds: 180,
  },
]
