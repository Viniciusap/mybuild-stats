# Logger.ps1 — JSON run log writer

$LogDir = "C:\Debloat\logs"

function Write-RunLog([hashtable]$Results, [string]$MachineName, [string]$UserName) {
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }

    $entry = @{
        timestamp = (Get-Date -Format 'o')
        machine   = $MachineName
        user      = $UserName
        os        = (Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue).Caption
        results   = $Results
    }

    $timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
    $path = Join-Path $LogDir "$timestamp.json"
    $entry | ConvertTo-Json -Depth 5 | Set-Content -Path $path -Encoding UTF8
    return $path
}

function Get-LastRunLog {
    if (-not (Test-Path $LogDir)) { return $null }
    $logs = Get-ChildItem $LogDir -Filter '*.json' | Sort-Object LastWriteTime -Descending
    if ($logs.Count -eq 0) { return $null }
    return $logs[0].FullName
}
