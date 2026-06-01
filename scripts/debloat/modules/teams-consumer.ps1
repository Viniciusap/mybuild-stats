# teams-consumer.ps1 — removes personal Teams, NOT Teams Work/School

$ModuleMeta = @{
    Id          = 'teams-consumer'
    DisplayName = 'Teams (Consumer)'
    Risk        = 'Low'
    GpoConflict = ''
    Safe        = $true
}

# Personal Teams package name pattern (publisher = 8wekyb3d8bbwe = Microsoft Store)
$TeamsPattern = 'MicrosoftTeams'

function Invoke-Check {
    $app = Get-AppxPackage -AllUsers -Name "*$TeamsPattern*" -ErrorAction SilentlyContinue |
           Where-Object { $_.Name -notmatch 'MicrosoftTeams_8wekyb3d8bbwe' -or $_.Name -match 'Teams' }
    # Also check startup entry
    $startup = (Get-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run' -Name 'com.squirrel.Teams.Teams' -ErrorAction SilentlyContinue)
    return ($null -ne $app -or $null -ne $startup)
}

function Invoke-Apply {
    try {
        # Remove startup entry
        Remove-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run' `
            -Name 'com.squirrel.Teams.Teams' -ErrorAction SilentlyContinue

        # Remove AppX package (personal Teams — NOT the enterprise one)
        $apps = Get-AppxPackage -AllUsers -Name "*$TeamsPattern*" -ErrorAction SilentlyContinue
        $removed = 0
        foreach ($app in $apps) {
            # Skip Teams Work (MSTeams without the consumer marker)
            if ($app.Name -match 'MSTeams' -and $app.SignatureKind -eq 'Store') { continue }
            Remove-AppxPackage -Package $app.PackageFullName -AllUsers -ErrorAction SilentlyContinue
            $removed++
        }

        if ($removed -eq 0) {
            return @{ Status = 'Skipped'; Detail = 'Teams Consumer app not found' }
        }
        return @{ Status = 'Changed'; Detail = 'Teams Consumer removed, startup entry cleared' }
    } catch {
        return @{ Status = 'Failed'; Detail = $_.Exception.Message }
    }
}

function Invoke-Rollback {
    return $false
}
