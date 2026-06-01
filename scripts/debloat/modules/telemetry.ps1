# telemetry.ps1

$ModuleMeta = @{
    Id          = 'telemetry'
    DisplayName = 'Telemetry Services'
    Risk        = 'Low'
    GpoConflict = ''
    Safe        = $true
}

function Invoke-Check {
    $svc = Get-Service 'DiagTrack' -ErrorAction SilentlyContinue
    return ($null -ne $svc -and $svc.StartType -ne 'Disabled')
}

function Invoke-Apply {
    try {
        Stop-Service 'DiagTrack' -Force -ErrorAction SilentlyContinue
        Set-Service  'DiagTrack' -StartupType Disabled -ErrorAction Stop

        Stop-Service 'dmwappushservice' -Force -ErrorAction SilentlyContinue
        Set-Service  'dmwappushservice' -StartupType Disabled -ErrorAction SilentlyContinue

        $regPath = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection'
        if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
        Set-ItemProperty -Path $regPath -Name 'AllowTelemetry' -Value 0 -Type DWord -Force

        return @{ Status = 'Changed'; Detail = 'DiagTrack disabled, AllowTelemetry=0' }
    } catch {
        return @{ Status = 'Failed'; Detail = $_.Exception.Message }
    }
}

function Invoke-Rollback {
    try {
        Set-Service 'DiagTrack' -StartupType Automatic -ErrorAction Stop
        Start-Service 'DiagTrack' -ErrorAction SilentlyContinue
        Remove-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection' -Name 'AllowTelemetry' -ErrorAction SilentlyContinue
        return $true
    } catch {
        return $false
    }
}
