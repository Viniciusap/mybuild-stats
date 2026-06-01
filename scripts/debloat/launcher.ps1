#Requires -Version 5.1
# launcher.ps1 - Enterprise Debloat one-liner launcher
# Downloads the debloat scripts from GitHub and runs them locally.
# No cloning required.
#
# INTERACTIVE (shows menu):
#   powershell -ExecutionPolicy Bypass -Command "iwr 'https://raw.githubusercontent.com/Viniciusap/mybuild-stats/master/scripts/debloat/launcher.ps1' -OutFile \"$env:TEMP\debloat.ps1\" -UseBasicParsing; & \"$env:TEMP\debloat.ps1\""
#
# NON-INTERACTIVE (specific modules, no menu):
#   ... & "$env:TEMP\debloat.ps1" -NonInteractive -Modules 'telemetry,cortana,bloatware'

[CmdletBinding()]
param(
    [switch]$NonInteractive,
    [switch]$All,
    [string]$Modules
)

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force -ErrorAction SilentlyContinue
$ErrorActionPreference = 'SilentlyContinue'
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

$RepoZipUrl = 'https://github.com/Viniciusap/mybuild-stats/archive/refs/heads/master.zip'
$ZipPath    = Join-Path $env:TEMP 'debloat-repo.zip'
$ExtractTo  = $env:TEMP
$ExtractDir = Join-Path $env:TEMP 'mybuild-stats-master'
$ScriptPath = Join-Path $ExtractDir 'scripts\debloat\enterprise.ps1'

Write-Host ""
Write-Host "  Enterprise Debloat Launcher" -ForegroundColor Cyan
Write-Host "  Downloading scripts..." -ForegroundColor DarkGray
Write-Host ""

try {
    Invoke-WebRequest -Uri $RepoZipUrl -OutFile $ZipPath -UseBasicParsing -ErrorAction Stop
} catch {
    Write-Host "  [!] Download failed: $_" -ForegroundColor Red
    exit 1
}

if (Test-Path $ExtractDir) { Remove-Item $ExtractDir -Recurse -Force -ErrorAction SilentlyContinue }
Expand-Archive -Path $ZipPath -DestinationPath $ExtractTo -Force
Remove-Item $ZipPath -Force -ErrorAction SilentlyContinue

if (-not (Test-Path $ScriptPath)) {
    Write-Host "  [!] enterprise.ps1 not found after extraction." -ForegroundColor Red
    exit 1
}

# Build argument list
$passArgs = @()
if ($NonInteractive) { $passArgs += '-NonInteractive' }
if ($All)            { $passArgs += '-All' }
if ($Modules)        { $passArgs += '-Modules'; $passArgs += $Modules }

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ScriptPath @passArgs

# Cleanup temp files
Remove-Item $ExtractDir -Recurse -Force -ErrorAction SilentlyContinue
