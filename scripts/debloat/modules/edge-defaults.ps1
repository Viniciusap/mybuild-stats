# edge-defaults.ps1

$ModuleMeta = @{
    Id          = 'edge-defaults'
    DisplayName = 'Edge Defaults'
    Risk        = 'Low'
    GpoConflict = 'Edge GPO policies commonly block these registry changes'
    Safe        = $true
}

function Test-GpoLocked {
    $gpoPath = 'HKLM:\SOFTWARE\Policies\Microsoft\Edge'
    if (Test-Path $gpoPath) {
        $startup = (Get-ItemProperty -Path $gpoPath -Name 'RestoreOnStartup' -ErrorAction SilentlyContinue).RestoreOnStartup
        if ($null -ne $startup) { return $true }
    }
    return $false
}

function Invoke-Check {
    # Check if Edge is in startup or news feed is enabled
    $startup = (Get-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run' -Name 'MicrosoftEdgeAutoLaunch*' -ErrorAction SilentlyContinue)
    $newsFeed = (Get-ItemProperty -Path 'HKCU:\SOFTWARE\Policies\Microsoft\Edge' -Name 'NewTabPageNewsListFeedEnabled' -ErrorAction SilentlyContinue).NewTabPageNewsListFeedEnabled

    # Edge is considered "default bloat" if it auto-launches or news feed is on
    $edgeExe = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    $autoStart = Get-ItemProperty 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run' -ErrorAction SilentlyContinue |
        Get-Member -MemberType NoteProperty | Where-Object { $_.Name -like '*Edge*' -or $_.Name -like '*msedge*' }

    return ($null -ne $autoStart -or $newsFeed -ne 0)
}

function Invoke-Apply {
    # Check GPO lock first
    if (Test-GpoLocked) {
        return @{ Status = 'Failed'; Detail = 'GPO policy locked - Edge settings managed by organization' }
    }

    $changes = [System.Collections.Generic.List[string]]::new()

    try {
        # Remove Edge from startup (auto-launch after install)
        $runPath = 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run'
        $runProps = Get-ItemProperty $runPath -ErrorAction SilentlyContinue
        if ($runProps) {
            $runProps.PSObject.Properties | Where-Object { $_.Name -match 'Edge' -or $_.Name -match 'msedge' } | ForEach-Object {
                Remove-ItemProperty -Path $runPath -Name $_.Name -ErrorAction SilentlyContinue
                $changes.Add('startup removed')
            }
        }

        # Disable new tab news feed
        $edgePolicyPath = 'HKCU:\SOFTWARE\Policies\Microsoft\Edge'
        if (-not (Test-Path $edgePolicyPath)) { New-Item -Path $edgePolicyPath -Force | Out-Null }
        Set-ItemProperty -Path $edgePolicyPath -Name 'NewTabPageNewsListFeedEnabled' -Value 0 -Type DWord -Force
        $changes.Add('news feed disabled')

        # Disable Edge first-run experience
        Set-ItemProperty -Path $edgePolicyPath -Name 'HideFirstRunExperience' -Value 1 -Type DWord -Force
        $changes.Add('first-run hidden')

        # Disable default browser prompt
        Set-ItemProperty -Path $edgePolicyPath -Name 'DefaultBrowserSettingEnabled' -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue

        if ($changes.Count -eq 0) {
            return @{ Status = 'Skipped'; Detail = 'No Edge defaults to change' }
        }
        return @{ Status = 'Changed'; Detail = ($changes -join ', ') }
    } catch {
        return @{ Status = 'Failed'; Detail = $_.Exception.Message }
    }
}

function Invoke-Rollback {
    try {
        $edgePolicyPath = 'HKCU:\SOFTWARE\Policies\Microsoft\Edge'
        Remove-ItemProperty -Path $edgePolicyPath -Name 'NewTabPageNewsListFeedEnabled' -ErrorAction SilentlyContinue
        Remove-ItemProperty -Path $edgePolicyPath -Name 'HideFirstRunExperience'        -ErrorAction SilentlyContinue
        Remove-ItemProperty -Path $edgePolicyPath -Name 'DefaultBrowserSettingEnabled'  -ErrorAction SilentlyContinue
        return $true
    } catch {
        return $false
    }
}
