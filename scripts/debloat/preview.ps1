# preview.ps1 - visual preview of all enterprise debloat CLI screens
$ScriptDir = Split-Path $MyInvocation.MyCommand.Path -ErrorAction SilentlyContinue
if (-not $ScriptDir) { $ScriptDir = $PSScriptRoot }
if (-not $ScriptDir) { $ScriptDir = "C:\Dev\mybuild-stats\scripts\debloat" }

. (Join-Path $ScriptDir 'core\UI.ps1')

# ── SCREEN 1: Splash ──────────────────────────────────────────────────────────
Clear-Host
Write-Host ""
Write-BoxTop
Write-BoxLine "ENTERPRISE DEBLOAT TOOL  v1.0.0" Cyan
Write-BoxLine "Machine: CORP-PC-042    Build: 26200" White
Write-BoxLine "User:    jsmith" DarkGray
Write-BoxBottom
Write-Host ""
Write-Host "  [+] Running as Administrator" -ForegroundColor Green
Write-Host ""
Write-Host "  Scanning system..." -ForegroundColor DarkGray
Start-Sleep -Milliseconds 700

# ── SCREEN 2: Pre-check ───────────────────────────────────────────────────────
Write-SectionHeader "SYSTEM SCAN RESULTS"
Write-Host ""
Write-CheckLine "Telemetry Services"    "PRESENT"
Write-CheckLine "Cortana"              "PRESENT"
Write-CheckLine "OneDrive"             "PRESENT"
Write-CheckLine "Windows AI / Copilot" "PRESENT"
Write-CheckLine "Xbox Services"        "DISABLED"
Write-CheckLine "Bloatware Apps"       "PRESENT"
Write-CheckLine "Teams (Consumer)"     "NOT FOUND"
Write-CheckLine "Edge Defaults"        "PRESENT"
Write-Host ""
Start-Sleep -Milliseconds 900
Write-Host "  [Enter to continue to module selection...]" -ForegroundColor DarkGray
Start-Sleep -Milliseconds 600

# ── SCREEN 3: Module Menu ─────────────────────────────────────────────────────
Clear-Host
Write-SectionHeader "SELECT MODULES TO APPLY"
Write-Host ""
Write-Host "   #   Module                    Status" -ForegroundColor DarkGray
Write-Divider
Write-MenuRow 1 $true  "Telemetry Services"    "PRESENT"
Write-MenuRow 2 $true  "Cortana"               "PRESENT"
Write-MenuRow 3 $true  "OneDrive"              "PRESENT"
Write-MenuRow 4 $false "Windows AI / Copilot"  "PRESENT"
Write-MenuRow 5 $false "Xbox Services"         "DISABLED"
Write-MenuRow 6 $true  "Bloatware Apps"        "PRESENT"
Write-MenuRow 7 $false "Teams (Consumer)"      "NOT FOUND"
Write-MenuRow 8 $true  "Edge Defaults"         "PRESENT"
Write-Divider
Write-Host ""
Write-Host "  Toggle number(s) | [A] All present | [N] Clear | [Enter] Apply | [Q] Quit" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  > (simulated: Enter)" -ForegroundColor DarkGray
Start-Sleep -Milliseconds 900

# ── SCREEN 4: Confirm ─────────────────────────────────────────────────────────
Clear-Host
Write-SectionHeader "CONFIRM SELECTION"
Write-Host ""
Write-Host "    > Telemetry Services          " -NoNewline -ForegroundColor White
Write-Host "[Risk: Low]" -ForegroundColor Green
Write-Host "    > Cortana                     " -NoNewline -ForegroundColor White
Write-Host "[Risk: Low]" -ForegroundColor Green
Write-Host "      GPO: CortanaEnabled policy may override registry" -ForegroundColor Yellow
Write-Host "    > OneDrive                    " -NoNewline -ForegroundColor White
Write-Host "[Risk: Medium]" -ForegroundColor Yellow
Write-Host "      GPO: SharePoint Sync GPO may conflict" -ForegroundColor Yellow
Write-Host "    > Bloatware Apps              " -NoNewline -ForegroundColor White
Write-Host "[Risk: Low]" -ForegroundColor Green
Write-Host "    > Edge Defaults               " -NoNewline -ForegroundColor White
Write-Host "[Risk: Low]" -ForegroundColor Green
Write-Host "      GPO: Edge GPO policies commonly block these changes" -ForegroundColor Yellow
Write-Host ""
Write-Divider
Write-Host ""
Write-Host "  Proceed? [Y/N]  (simulated: Y)" -ForegroundColor White
Start-Sleep -Milliseconds 800

# ── SCREEN 5: Execution ───────────────────────────────────────────────────────
Clear-Host
Write-SectionHeader "APPLYING CHANGES  [5 selected]"
Write-Host ""

$steps = @(
    @{ Name="Telemetry Services"; Status="Changed"; Detail="DiagTrack disabled, AllowTelemetry=0" },
    @{ Name="Cortana";            Status="Changed"; Detail="AllowCortana=0, web search disabled"  },
    @{ Name="OneDrive";           Status="Changed"; Detail="Uninstalled. User data folder kept."  },
    @{ Name="Bloatware Apps";     Status="Changed"; Detail="Removed 12 app(s)"                   },
    @{ Name="Edge Defaults";      Status="Failed";  Detail="GPO policy locked - managed by org"   }
)

$done = 0
foreach ($step in $steps) {
    Write-ProgressBar $done $steps.Count
    Write-Host "  $($step.Name)..." -ForegroundColor DarkGray
    Start-Sleep -Milliseconds 500
    $done++
    Write-ProgressBar $done $steps.Count
    Write-StatusLine $step.Name $step.Status $step.Detail
    Start-Sleep -Milliseconds 200
}

# ── SCREEN 6: Summary ─────────────────────────────────────────────────────────
Write-Host ""
Write-SectionHeader "SUMMARY"
Write-Host ""
Write-Host "  Changed : " -NoNewline -ForegroundColor DarkGray
Write-Host "4" -ForegroundColor Green
Write-Host "  Skipped : " -NoNewline -ForegroundColor DarkGray
Write-Host "0" -ForegroundColor Yellow
Write-Host "  Failed  : " -NoNewline -ForegroundColor DarkGray
Write-Host "1" -ForegroundColor Red
Write-Host ""
Write-Divider
Write-Host ""
Write-Host "  Log: " -NoNewline -ForegroundColor DarkGray
Write-Host "C:\Debloat\logs\2026-06-01_14-23-01.json" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press any key to exit..." -ForegroundColor DarkGray
