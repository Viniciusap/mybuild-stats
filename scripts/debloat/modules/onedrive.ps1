# onedrive.ps1

$ModuleMeta = @{
    Id          = 'onedrive'
    DisplayName = 'OneDrive'
    Risk        = 'Medium'
    GpoConflict = 'SharePoint Sync GPO may conflict'
    Safe        = $false
}

function Invoke-Check {
    $path = "$env:LOCALAPPDATA\Microsoft\OneDrive\OneDrive.exe"
    $reg  = (Get-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run' -Name 'OneDrive' -ErrorAction SilentlyContinue).OneDrive
    return (Test-Path $path) -or ($null -ne $reg)
}

function Invoke-Apply {
    try {
        # Kill process
        Stop-Process -Name 'OneDrive' -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 1500

        # Remove startup entry
        Remove-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run' -Name 'OneDrive' -ErrorAction SilentlyContinue

        # Run uninstaller
        $uninstaller = "$env:SYSTEMROOT\SysWOW64\OneDriveSetup.exe"
        if (-not (Test-Path $uninstaller)) {
            $uninstaller = "$env:SYSTEMROOT\System32\OneDriveSetup.exe"
        }
        if (Test-Path $uninstaller) {
            $proc = Start-Process $uninstaller -ArgumentList '/uninstall' -Wait -PassThru -ErrorAction Stop
            if ($proc.ExitCode -ne 0) {
                return @{ Status = 'Failed'; Detail = "Uninstaller exit code $($proc.ExitCode)" }
            }
        }

        # Prevent future re-install via policy
        $regPath = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\OneDrive'
        if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
        Set-ItemProperty -Path $regPath -Name 'DisableFileSyncNGSC' -Value 1 -Type DWord -Force

        return @{ Status = 'Changed'; Detail = 'Uninstalled. User data folder kept.' }
    } catch {
        return @{ Status = 'Failed'; Detail = $_.Exception.Message }
    }
}

function Invoke-Rollback {
    # Cannot reinstall silently — user must reinstall manually
    return $false
}
