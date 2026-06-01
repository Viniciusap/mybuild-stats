#Requires -Version 5.1
<#
.SYNOPSIS
    Enterprise Debloat CLI — interactive module-based Windows debloat tool for IT admins.
.EXAMPLE
    powershell.exe -ExecutionPolicy Bypass -File enterprise.ps1
.EXAMPLE
    powershell.exe -ExecutionPolicy Bypass -File enterprise.ps1 -NonInteractive -All
#>
[CmdletBinding()]
param(
    [switch]$NonInteractive,
    [switch]$All,
    [string]$Modules   # comma-separated module IDs, e.g. "telemetry,cortana,bloatware"
)

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force -ErrorAction SilentlyContinue
$ErrorActionPreference = 'SilentlyContinue'

$ScriptDir  = $PSScriptRoot
$CoreDir    = Join-Path $ScriptDir 'core'
$ModulesDir = Join-Path $ScriptDir 'modules'

# ── Load core ─────────────────────────────────────────────────────────────────
. (Join-Path $CoreDir 'AdminCheck.ps1')
. (Join-Path $CoreDir 'UI.ps1')
. (Join-Path $CoreDir 'Logger.ps1')
. (Join-Path $CoreDir 'Runner.ps1')

Assert-PS5
Assert-Admin

# ── Splash ────────────────────────────────────────────────────────────────────
Clear-Screen
Write-Host ""
Write-BoxTop
Write-BoxLine "ENTERPRISE DEBLOAT TOOL  v1.0.0" Cyan
Write-BoxLine "Machine: $($env:COMPUTERNAME)  Build: $([System.Environment]::OSVersion.Version.Build)" White
Write-BoxLine "User: $($env:USERNAME)" DarkGray
Write-BoxBottom
Write-Host ""
Write-Host "  " -NoNewline
Write-Host "[+]" -NoNewline -ForegroundColor Green
Write-Host " Running as Administrator" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Scanning system..." -ForegroundColor DarkGray
Start-Sleep -Milliseconds 300

# ── Load modules ──────────────────────────────────────────────────────────────
# Each module dot-sources to define Invoke-Check/Apply/Rollback + $ModuleMeta.
# We capture ScriptBlock immediately after each load (before next module overwrites).
$modules = [System.Collections.Generic.List[PSCustomObject]]::new()
$moduleFiles = Get-ChildItem $ModulesDir -Filter '*.ps1' | Sort-Object Name

foreach ($file in $moduleFiles) {
    try {
        . $file.FullName

        if (-not (Get-Variable -Name 'ModuleMeta' -ErrorAction SilentlyContinue)) { continue }
        $meta = $ModuleMeta
        if (-not $meta) { continue }

        # Capture ScriptBlocks NOW before next module overwrites the function names
        $checkFnItem    = Get-Item Function:\Invoke-Check    -ErrorAction SilentlyContinue
        $applyFnItem    = Get-Item Function:\Invoke-Apply    -ErrorAction SilentlyContinue
        $rollbackFnItem = Get-Item Function:\Invoke-Rollback -ErrorAction SilentlyContinue

        $checkSB    = if ($checkFnItem)    { $checkFnItem.ScriptBlock    } else { $null }
        $applySB    = if ($applyFnItem)    { $applyFnItem.ScriptBlock    } else { $null }
        $rollbackSB = if ($rollbackFnItem) { $rollbackFnItem.ScriptBlock } else { $null }

        if (-not $checkSB -or -not $applySB) { continue }

        $modules.Add([PSCustomObject]@{
            Id          = $meta.Id
            DisplayName = $meta.DisplayName
            Risk        = $meta.Risk
            GpoConflict = $meta.GpoConflict
            Safe        = $meta.Safe
            CheckSB     = $checkSB
            ApplySB     = $applySB
            RollbackSB  = $rollbackSB
        })

        Remove-Variable 'ModuleMeta' -ErrorAction SilentlyContinue
    } catch {
        Write-Host "  [!] Failed to load $($file.Name): $_" -ForegroundColor Red
    }
}

if ($modules.Count -eq 0) {
    Write-Host "  [!] No modules found in: $ModulesDir" -ForegroundColor Red
    exit 1
}

# ── Pre-check ─────────────────────────────────────────────────────────────────
$checkResults = @{}
Write-Host ""
Write-SectionHeader "SYSTEM SCAN RESULTS"
Write-Host ""
foreach ($m in $modules) {
    $present = & $m.CheckSB
    $status  = if ($present) { 'PRESENT' } else { 'NOT FOUND' }
    Write-CheckLine $m.DisplayName $status
    $checkResults[$m.Id] = [bool]$present
}
Write-Host ""

# ── Non-interactive mode ───────────────────────────────────────────────────────
if ($NonInteractive) {
    if ($Modules) {
        $ids = $Modules -split ',' | ForEach-Object { $_.Trim() }
        $selected = @($modules | Where-Object { $ids -contains $_.Id -and $checkResults[$_.Id] })
    } elseif ($All) {
        $selected = @($modules | Where-Object { $checkResults[$_.Id] })
    } else {
        Write-Host "  [!] Use -All or -Modules 'id1,id2' with -NonInteractive." -ForegroundColor Yellow
        exit 0
    }
    $confirmed = $true
} else {
    Write-Host "  Press Enter to continue to module selection..." -ForegroundColor DarkGray
    $null = Read-Host

    # ── Interactive menu ───────────────────────────────────────────────────────
    $selectedIds = @{}
    foreach ($m in $modules) { $selectedIds[$m.Id] = $checkResults[$m.Id] }

    while ($true) {
        Clear-Screen
        Write-SectionHeader "SELECT MODULES TO APPLY"
        Write-Host ""
        Write-Host "  " -NoNewline
        Write-Host "#   Module                    Status" -ForegroundColor DarkGray
        Write-Divider

        $i = 1
        foreach ($m in $modules) {
            $status = if ($checkResults[$m.Id]) { 'PRESENT' } else { 'NOT FOUND' }
            Write-MenuRow $i $selectedIds[$m.Id] $m.DisplayName $status
            $i++
        }

        Write-Divider
        Write-Host ""
        Write-Host "  Toggle number(s) | [A] All present | [N] Clear | [Enter] Apply | [Q] Quit" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "  > " -NoNewline -ForegroundColor Cyan
        $rawInput = (Read-Host).Trim()

        if ($rawInput -eq '')                           { break }
        if ($rawInput -eq 'Q' -or $rawInput -eq 'q')   { Write-Host "  Aborted." -ForegroundColor Yellow; exit 0 }

        if ($rawInput -eq 'A' -or $rawInput -eq 'a') {
            foreach ($m in $modules) { if ($checkResults[$m.Id]) { $selectedIds[$m.Id] = $true } }
            continue
        }
        if ($rawInput -eq 'N' -or $rawInput -eq 'n') {
            foreach ($m in $modules) { $selectedIds[$m.Id] = $false }
            continue
        }

        foreach ($token in ($rawInput -split '\s+')) {
            $num = 0
            if ([int]::TryParse($token, [ref]$num)) {
                $idx = $num - 1
                if ($idx -ge 0 -and $idx -lt $modules.Count) {
                    $m = $modules[$idx]
                    if (-not $checkResults[$m.Id]) {
                        Write-Host "  [!] '$($m.DisplayName)' not present on this system" -ForegroundColor Red
                        Start-Sleep -Milliseconds 800
                    } else {
                        $selectedIds[$m.Id] = -not $selectedIds[$m.Id]
                    }
                }
            }
        }
    }

    $selected = @($modules | Where-Object { $selectedIds[$_.Id] })

    # ── Confirm ────────────────────────────────────────────────────────────────
    if ($selected.Count -eq 0) {
        Write-Host "  No modules selected." -ForegroundColor Yellow
        exit 0
    }

    Clear-Screen
    Write-SectionHeader "CONFIRM SELECTION"
    Write-Host ""
    foreach ($m in $selected) {
        $riskColor = switch ($m.Risk) { 'Low' { 'Green' } 'Medium' { 'Yellow' } 'High' { 'Red' } default { 'Gray' } }
        Write-Host "    > " -NoNewline -ForegroundColor DarkGray
        Write-Host $m.DisplayName.PadRight(26) -NoNewline -ForegroundColor White
        Write-Host "[Risk: $($m.Risk)]" -ForegroundColor $riskColor
        if ($m.GpoConflict) {
            Write-Host "      [!] GPO: $($m.GpoConflict)" -ForegroundColor Yellow
        }
    }
    Write-Host ""
    Write-Divider
    Write-Host ""
    Write-Host "  Proceed? [Y/N] " -NoNewline -ForegroundColor White
    $answer = (Read-Host).Trim()
    if ($answer -ne 'Y' -and $answer -ne 'y') {
        Write-Host "  Cancelled." -ForegroundColor Yellow
        exit 0
    }
    $confirmed = $true
}

# ── Apply ─────────────────────────────────────────────────────────────────────
$log   = @{}
$total = $selected.Count
$done  = 0

Clear-Screen
Write-SectionHeader "APPLYING CHANGES  [$total selected]"
Write-Host ""

foreach ($m in $selected) {
    Write-ProgressBar $done $total
    Write-Host "  " -NoNewline
    Write-Host $m.DisplayName -ForegroundColor DarkGray

    try {
        $result = & $m.ApplySB
    } catch {
        $result = @{ Status = 'Failed'; Detail = $_.Exception.Message }
    }

    $log[$m.Id] = $result
    $done++
    Write-ProgressBar $done $total
    Write-StatusLine $m.DisplayName $result.Status $result.Detail
}

# ── Save log ──────────────────────────────────────────────────────────────────
$logPath = Write-RunLog $log $env:COMPUTERNAME $env:USERNAME

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-SectionHeader "SUMMARY"
Write-Host ""

$changed = @($log.Values | Where-Object { $_.Status -eq 'Changed' }).Count
$skipped = @($log.Values | Where-Object { $_.Status -eq 'Skipped' }).Count
$failed  = @($log.Values | Where-Object { $_.Status -eq 'Failed'  }).Count

Write-Host "  Changed : " -NoNewline -ForegroundColor DarkGray; Write-Host $changed -ForegroundColor Green
Write-Host "  Skipped : " -NoNewline -ForegroundColor DarkGray; Write-Host $skipped -ForegroundColor Yellow
Write-Host "  Failed  : " -NoNewline -ForegroundColor DarkGray
Write-Host $failed -ForegroundColor $(if ($failed -gt 0) { 'Red' } else { 'DarkGray' })
Write-Host ""
Write-Divider
Write-Host ""
Write-Host "  Log: " -NoNewline -ForegroundColor DarkGray
Write-Host $logPath -ForegroundColor Cyan
Write-Host ""

# ── Reusable command ──────────────────────────────────────────────────────────
if (-not $NonInteractive -and $selected.Count -gt 0) {
    $moduleIds  = ($selected | ForEach-Object { $_.Id }) -join ','
    $launchUrl  = 'https://raw.githubusercontent.com/Viniciusap/mybuild-stats/master/scripts/debloat/launcher.ps1'
    $tmpFile    = 'C:\Windows\Temp\debloat.ps1'
    $reuse = "powershell -ExecutionPolicy Bypass -Command `"iwr '$launchUrl' -OutFile '$tmpFile' -UseBasicParsing; & '$tmpFile' -NonInteractive -Modules '$moduleIds'`""

    Write-Host ""
    Write-BoxTop
    Write-BoxLine "REUSABLE COMMAND" Cyan
    Write-BoxLine "Paste on other machines - no cloning needed:" DarkGray
    Write-BoxBottom
    Write-Host ""
    Write-Host "  " -NoNewline
    Write-Host $reuse -ForegroundColor Yellow
    Write-Host ""
    Write-Divider
    Write-Host ""
}

if (-not $NonInteractive) {
    Write-Host "  Press Enter to exit..." -ForegroundColor DarkGray
    $null = Read-Host
}
