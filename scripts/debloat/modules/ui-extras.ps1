# ui-extras.ps1 - file extensions, hidden files, sticky keys, bing search, start menu

$ModuleMeta = @{
    Id          = 'ui-extras'
    DisplayName = 'UI Extras'
    Risk        = 'Low'
    GpoConflict = ''
    Safe        = $true
}

$UiExtrasKeys = @(
    # Show file extensions
    @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'; Name='HideFileExt';        Value=0; Label='Show file extensions' }
    # Show hidden files/folders
    @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'; Name='Hidden';             Value=1; Label='Show hidden files' }
    # Disable Aero Shake (shaking window to minimize others)
    @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'; Name='DisallowShaking';    Value=1; Label='Disable Aero Shake' }
    # Win11: taskbar alignment left (0=left, 1=center)
    @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'; Name='TaskbarAl';          Value=0; Label='Taskbar align left' }
    # Disable Bing search in Start Menu
    @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Search';            Name='BingSearchEnabled';  Value=0; Label='Disable Bing in Start' }
    @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Search';            Name='CortanaConsent';     Value=0; Label='Disable Cortana consent prompt' }
    # Win11: hide Recommended section in Start Menu
    @{ Path='HKLM:\SOFTWARE\Policies\Microsoft\Windows\Explorer';               Name='HideRecommendedSection'; Value=1; Label='Hide Start Recommended' }
    # Disable startup sound (logon)
    @{ Path='HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Authentication\LogonUI\BootAnimation'; Name='DisableStartupSound'; Value=1; Label='Disable startup sound' }
)

function Invoke-Check {
    # File extensions still hidden = not applied
    $ext = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'HideFileExt' -ErrorAction SilentlyContinue).HideFileExt
    if ($ext -ne 0) { return $true }

    # Hidden files still hidden
    $hid = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced' -Name 'Hidden' -ErrorAction SilentlyContinue).Hidden
    if ($hid -ne 1) { return $true }

    # Bing search still on
    $bing = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Search' -Name 'BingSearchEnabled' -ErrorAction SilentlyContinue).BingSearchEnabled
    if ($bing -ne 0) { return $true }

    return $false
}

function Invoke-Apply {
    $changed = 0
    $errors  = @()

    foreach ($key in $UiExtrasKeys) {
        try {
            if (-not (Test-Path $key.Path)) { New-Item -Path $key.Path -Force | Out-Null }
            Set-ItemProperty -Path $key.Path -Name $key.Name -Value $key.Value -Type DWord -Force -ErrorAction Stop
            $changed++
        } catch {
            $errors += $key.Label
        }
    }

    # Disable Sticky Keys shortcut (Shift x5 prompt) — Flags is a string value
    try {
        $skPath = 'HKCU:\Control Panel\Accessibility\StickyKeys'
        if (-not (Test-Path $skPath)) { New-Item -Path $skPath -Force | Out-Null }
        Set-ItemProperty -Path $skPath -Name 'Flags' -Value '506' -Type String -Force
        $changed++
    } catch {
        $errors += 'Sticky Keys'
    }

    # Restart Explorer to apply Explorer-related tweaks (extensions, hidden files, taskbar)
    try {
        Stop-Process -Name 'explorer' -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 1200
        Start-Process 'explorer.exe'
    } catch { <# non-fatal — user can log off/on #> }

    if ($errors.Count -gt 0 -and $changed -eq 0) {
        return @{ Status = 'Failed'; Detail = "Failed: $($errors -join ', ')" }
    }

    $detail = "$changed settings applied"
    if ($errors.Count -gt 0) { $detail += " ($($errors.Count) skipped: $($errors -join ', '))" }
    return @{ Status = 'Changed'; Detail = $detail }
}

function Invoke-Rollback {
    try {
        $adv = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'
        Set-ItemProperty $adv -Name 'HideFileExt'     -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
        Set-ItemProperty $adv -Name 'Hidden'          -Value 2 -Type DWord -Force -ErrorAction SilentlyContinue
        Set-ItemProperty $adv -Name 'DisallowShaking' -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
        Set-ItemProperty $adv -Name 'TaskbarAl'       -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
        Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Search' -Name 'BingSearchEnabled' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
        Set-ItemProperty 'HKCU:\Control Panel\Accessibility\StickyKeys' -Name 'Flags' -Value '510' -Type String -Force -ErrorAction SilentlyContinue
        Remove-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Explorer' -Name 'HideRecommendedSection' -ErrorAction SilentlyContinue
        Stop-Process -Name 'explorer' -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 1200
        Start-Process 'explorer.exe'
        return $true
    } catch { return $false }
}
