[CmdletBinding()]
param()

$ErrorActionPreference = 'SilentlyContinue'

# ── 1. Pre-check ───────────────────────────────────────────────────────────────
$artifacts = [System.Collections.Generic.List[string]]::new()

$appxPatterns = @('*Copilot*', '*Recall*', '*BingSearch*', '*WindowsAI*')
foreach ($p in $appxPatterns) {
    if (Get-AppxPackage -AllUsers -Name $p) {
        $artifacts.Add("appx:$p")
    }
}

$policyChecks = @(
    @{ Path = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI';      Name = 'DisableAIDataAnalysis';     Expected = 1 }
    @{ Path = 'HKCU:\SOFTWARE\Policies\Microsoft\Windows\WindowsCopilot'; Name = 'TurnOffWindowsCopilot';     Expected = 1 }
)
$missingPolicies = [System.Collections.Generic.List[string]]::new()
foreach ($c in $policyChecks) {
    $val = (Get-ItemProperty -Path $c.Path -Name $c.Name -ErrorAction SilentlyContinue).$($c.Name)
    if ($val -ne $c.Expected) {
        $missingPolicies.Add("$($c.Path)\$($c.Name)")
    }
}

$reapplyTask = Get-ScheduledTask -TaskName 'RemoveAI-UpdateCleanupChecker' -ErrorAction SilentlyContinue

# ── 2. Decide ──────────────────────────────────────────────────────────────────
$isCompliant = ($artifacts.Count -eq 0) -and ($missingPolicies.Count -eq 0) -and ($null -ne $reapplyTask)

if ($isCompliant) {
    Write-Output 'Pre-check: system already clean.'
    Write-Output "  AppX ($($appxPatterns -join ', ')): none present"
    Write-Output '  Policies: all set'
    Write-Output "  Reapply task: $($reapplyTask.TaskName) [$(($reapplyTask.State).ToString())]"
    Write-Output '__STATUS__COMPLIANT'
    exit 0
}

Write-Output 'Pre-check: AI artifacts detected.'
if ($artifacts.Count -gt 0) {
    Write-Output "  AppX present:     $($artifacts -join ', ')"
}
if ($missingPolicies.Count -gt 0) {
    Write-Output "  Policies missing: $($missingPolicies -join ', ')"
}
if ($null -eq $reapplyTask) {
    Write-Output '  Reapply task:     not installed'
}
Write-Output ''
Write-Output '__STATUS__EXECUTING'
Write-Output ''

# ── 3. Run upstream script ─────────────────────────────────────────────────────
$ErrorActionPreference = 'Continue'
& "$PSScriptRoot\RemoveWindowsAi.ps1" -nonInteractive -AllOptions -backupMode
$rc = $LASTEXITCODE

if ($rc -eq 0) {
    Write-Output ''
    Write-Output '__STATUS__EXECUTED'
}
exit $rc
