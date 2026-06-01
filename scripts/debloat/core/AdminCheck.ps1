# AdminCheck.ps1 — detect elevation, re-launch if needed

function Assert-Admin {
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]'Administrator'
    )
    if (-not $isAdmin) {
        Write-Host ""
        Write-Host "  [!] Administrator rights required." -ForegroundColor Red
        Write-Host "      Re-launching as Administrator..." -ForegroundColor Yellow
        Write-Host ""
        $script = $MyInvocation.ScriptName
        if (-not $script) { $script = $PSCommandPath }
        Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$script`""
        exit
    }
    return $true
}

function Get-PSVersion {
    return $PSVersionTable.PSVersion.Major
}

function Assert-PS5 {
    if ((Get-PSVersion) -ge 7) {
        Write-Host ""
        Write-Host "  [!] This script requires Windows PowerShell 5.1 (powershell.exe)." -ForegroundColor Red
        Write-Host "      Run with: powershell.exe -ExecutionPolicy Bypass -File enterprise.ps1" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
}
