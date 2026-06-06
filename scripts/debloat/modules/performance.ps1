# performance.ps1 - power plan, hibernate, SysMain, GameDVR

$ModuleMeta = @{
    Id          = 'performance'
    DisplayName = 'Performance Tweaks'
    Risk        = 'Low'
    GpoConflict = 'Power plan may be managed by MDM/GPO in corporate environments'
    Safe        = $true
}

function Invoke-Check {
    # Active plan is not Ultimate Performance
    $active = (powercfg /getactivescheme 2>$null | Out-String)
    if ($active -notmatch 'Ultimate Performance') { return $true }

    # Hibernate still enabled
    $hib = (Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Power' -Name 'HibernateEnabled' -ErrorAction SilentlyContinue).HibernateEnabled
    if ($hib -ne 0) { return $true }

    # SysMain still running
    $svc = Get-Service 'SysMain' -ErrorAction SilentlyContinue
    if ($svc -and $svc.StartType -ne 'Disabled') { return $true }

    # GameDVR still enabled
    $dvr = (Get-ItemProperty 'HKCU:\System\GameConfigStore' -Name 'GameDVR_Enabled' -ErrorAction SilentlyContinue).GameDVR_Enabled
    if ($dvr -ne 0) { return $true }

    return $false
}

function Invoke-Apply {
    $applied = @()
    $errors  = @()

    # ── Ultimate Performance power plan ───────────────────────────────────────
    try {
        $list = powercfg /list 2>$null | Out-String
        $guidMatch = [regex]'\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b'

        if ($list -match 'Ultimate Performance') {
            # Already exists — find its GUID and activate
            $line = ($list -split "`n" | Where-Object { $_ -match 'Ultimate Performance' } | Select-Object -First 1)
            $guid = $guidMatch.Match($line).Groups[1].Value
        } else {
            # Duplicate the hidden scheme to make it available
            $out  = (powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 2>&1 | Out-String)
            $guid = $guidMatch.Match($out).Groups[1].Value
        }

        if ($guid) {
            powercfg -setactive $guid 2>$null | Out-Null
            $applied += 'Power plan: Ultimate Performance'
        } else {
            $errors += 'Power plan (GUID not found)'
        }
    } catch {
        $errors += "Power plan: $($_.Exception.Message)"
    }

    # ── Disable hibernate ─────────────────────────────────────────────────────
    try {
        powercfg /h off 2>$null | Out-Null
        $applied += 'Hibernate: disabled'
    } catch {
        $errors += 'Hibernate'
    }

    # ── Disable SysMain (Superfetch) ──────────────────────────────────────────
    try {
        $svc = Get-Service 'SysMain' -ErrorAction SilentlyContinue
        if ($svc -and $svc.StartType -ne 'Disabled') {
            Stop-Service 'SysMain' -Force -ErrorAction SilentlyContinue
            Set-Service  'SysMain' -StartupType Disabled -ErrorAction Stop
            $applied += 'SysMain: disabled'
        }
    } catch {
        $errors += "SysMain: $($_.Exception.Message)"
    }

    # ── Disable GameDVR / Game Bar ────────────────────────────────────────────
    try {
        $gcsPath = 'HKCU:\System\GameConfigStore'
        if (-not (Test-Path $gcsPath)) { New-Item -Path $gcsPath -Force | Out-Null }
        Set-ItemProperty $gcsPath -Name 'GameDVR_Enabled'          -Value 0 -Type DWord -Force
        Set-ItemProperty $gcsPath -Name 'GameDVR_FSEBehaviorMode'  -Value 2 -Type DWord -Force -ErrorAction SilentlyContinue

        $gdvPath = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\GameDVR'
        if (-not (Test-Path $gdvPath)) { New-Item -Path $gdvPath -Force | Out-Null }
        Set-ItemProperty $gdvPath -Name 'AllowGameDVR' -Value 0 -Type DWord -Force

        $applied += 'GameDVR: disabled'
    } catch {
        $errors += "GameDVR: $($_.Exception.Message)"
    }

    if ($errors.Count -gt 0 -and $applied.Count -eq 0) {
        return @{ Status = 'Failed'; Detail = ($errors -join '; ') }
    }

    $detail = $applied -join ', '
    if ($errors.Count -gt 0) { $detail += " | errors: $($errors -join ', ')" }
    return @{ Status = 'Changed'; Detail = $detail }
}

function Invoke-Rollback {
    try {
        # Restore Balanced plan
        powercfg -setactive 381b4222-f694-41f0-9685-ff5bb260df2e 2>$null | Out-Null
        # Re-enable hibernate
        powercfg /h on 2>$null | Out-Null
        # Re-enable SysMain
        Set-Service 'SysMain' -StartupType Automatic -ErrorAction SilentlyContinue
        Start-Service 'SysMain' -ErrorAction SilentlyContinue
        # Re-enable GameDVR
        Set-ItemProperty 'HKCU:\System\GameConfigStore' -Name 'GameDVR_Enabled' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
        Remove-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\GameDVR' -Name 'AllowGameDVR' -ErrorAction SilentlyContinue
        return $true
    } catch { return $false }
}
