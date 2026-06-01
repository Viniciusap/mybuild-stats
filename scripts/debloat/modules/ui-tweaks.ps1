# ui-tweaks.ps1 - context menu, taskbar, snap layouts, search, ads, DVR

$ModuleMeta = @{
    Id          = 'ui-tweaks'
    DisplayName = 'UI / Taskbar Tweaks'
    Risk        = 'Low'
    GpoConflict = ''
    Safe        = $true
}

function Invoke-Check {
    # Check Win10 context menu (CLSID key present = Win10 style active)
    $ctxMenu = Test-Path 'HKCU:\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32'

    # Check Chat/Teams taskbar icon
    $chat = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'TaskbarMn' -ErrorAction SilentlyContinue).TaskbarMn

    # Check widgets
    $widgets = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'TaskbarDa' -ErrorAction SilentlyContinue).TaskbarDa

    # Check Snap Layouts
    $snap = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'EnableSnapBar' -ErrorAction SilentlyContinue).EnableSnapBar

    # Check search highlights
    $searchHL = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\SearchSettings' -Name 'IsDynamicSearchBoxEnabled' -ErrorAction SilentlyContinue).IsDynamicSearchBoxEnabled

    # PRESENT = any tweak not yet applied
    return (-not $ctxMenu -or $chat -ne 0 -or $widgets -ne 0 -or $snap -ne 0 -or $searchHL -ne 0)
}

function Invoke-Apply {
    $applied = @()
    $errors  = @()

    $tweaks = @(
        # Win10 classic context menu
        @{ Path='HKCU:\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32'; Name='(Default)'; Value=''; Type='String'; Label='Context menu (Win10 style)' }

        # Chat / Teams taskbar (Win11)
        @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'; Name='TaskbarMn'; Value=0; Type='DWord'; Label='Chat taskbar icon' }
        # Meet Now (Win10)
        @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer'; Name='HideSCAMeetNow'; Value=1; Type='DWord'; Label='Meet Now taskbar' }

        # Widgets taskbar button
        @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'; Name='TaskbarDa'; Value=0; Type='DWord'; Label='Widgets taskbar button' }

        # Snap Layouts (hover maximize button)
        @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'; Name='EnableSnapBar';         Value=0; Type='DWord'; Label='Snap Layouts' }
        @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'; Name='EnableSnapAssistFlyout'; Value=0; Type='DWord'; Label='Snap Assist flyout' }

        # Search highlights (dynamic branded content)
        @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\SearchSettings'; Name='IsDynamicSearchBoxEnabled'; Value=0; Type='DWord'; Label='Search highlights' }

        # Microsoft 365 ads in Settings
        @{ Path='HKLM:\SOFTWARE\Policies\Microsoft\Windows\CloudContent'; Name='DisableConsumerAccountStateContent'; Value=1; Type='DWord'; Label='365 ads in Settings' }

        # Settings Home page
        @{ Path='HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer'; Name='SettingsPageVisibility'; Value='hide:home'; Type='String'; Label='Settings Home page' }

        # Game DVR / Xbox DVR
        @{ Path='HKCU:\System\GameConfigStore';                               Name='GameDVR_Enabled';   Value=0; Type='DWord'; Label='Game DVR' }
        @{ Path='HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\GameDVR';   Name='AppCaptureEnabled'; Value=0; Type='DWord'; Label='App Capture' }
        @{ Path='HKLM:\SOFTWARE\Policies\Microsoft\Windows\GameDVR';         Name='AllowGameDVR';      Value=0; Type='DWord'; Label='Game DVR policy' }

        # Task View button
        @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'; Name='ShowTaskViewButton'; Value=0; Type='DWord'; Label='Task View button' }
    )

    foreach ($tweak in $tweaks) {
        try {
            if (-not (Test-Path $tweak.Path)) { New-Item -Path $tweak.Path -Force | Out-Null }
            if ($tweak.Type -eq 'String') {
                Set-ItemProperty -Path $tweak.Path -Name $tweak.Name -Value $tweak.Value -Type String -Force -ErrorAction Stop
            } else {
                Set-ItemProperty -Path $tweak.Path -Name $tweak.Name -Value $tweak.Value -Type DWord -Force -ErrorAction Stop
            }
            $applied += $tweak.Label
        } catch {
            $errors += $tweak.Label
        }
    }

    if ($applied.Count -eq 0) {
        return @{ Status = 'Failed'; Detail = "All tweaks failed" }
    }

    $detail = "Applied $($applied.Count) tweaks"
    if ($errors.Count -gt 0) { $detail += " ($($errors.Count) skipped)" }
    return @{ Status = 'Changed'; Detail = $detail }
}

function Invoke-Rollback {
    try {
        # Restore Win11 context menu
        Remove-Item 'HKCU:\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}' -Recurse -Force -ErrorAction SilentlyContinue
        # Re-show chat
        Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'TaskbarMn' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
        # Re-show widgets
        Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'TaskbarDa' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
        return $true
    } catch { return $false }
}
