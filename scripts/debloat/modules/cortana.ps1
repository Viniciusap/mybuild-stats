# cortana.ps1

$ModuleMeta = @{
    Id          = 'cortana'
    DisplayName = 'Cortana'
    Risk        = 'Low'
    GpoConflict = 'CortanaEnabled policy may override registry'
    Safe        = $true
}

function Invoke-Check {
    $regVal = (Get-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Search' -Name 'AllowCortana' -ErrorAction SilentlyContinue).AllowCortana
    $app    = Get-AppxPackage -AllUsers -Name '*Microsoft.549981C3F5F10*' -ErrorAction SilentlyContinue
    return ($regVal -ne 0 -or $null -ne $app)
}

function Invoke-Apply {
    try {
        $regPath = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Search'
        if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
        Set-ItemProperty -Path $regPath -Name 'AllowCortana'       -Value 0 -Type DWord -Force
        Set-ItemProperty -Path $regPath -Name 'DisableWebSearch'    -Value 1 -Type DWord -Force
        Set-ItemProperty -Path $regPath -Name 'ConnectedSearchUseWeb' -Value 0 -Type DWord -Force

        $app = Get-AppxPackage -AllUsers -Name '*Microsoft.549981C3F5F10*' -ErrorAction SilentlyContinue
        if ($app) {
            Remove-AppxPackage -Package $app.PackageFullName -ErrorAction SilentlyContinue
        }

        return @{ Status = 'Changed'; Detail = 'AllowCortana=0, web search disabled' }
    } catch {
        return @{ Status = 'Failed'; Detail = $_.Exception.Message }
    }
}

function Invoke-Rollback {
    try {
        $regPath = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Search'
        Remove-ItemProperty -Path $regPath -Name 'AllowCortana'        -ErrorAction SilentlyContinue
        Remove-ItemProperty -Path $regPath -Name 'DisableWebSearch'     -ErrorAction SilentlyContinue
        Remove-ItemProperty -Path $regPath -Name 'ConnectedSearchUseWeb' -ErrorAction SilentlyContinue
        return $true
    } catch {
        return $false
    }
}
