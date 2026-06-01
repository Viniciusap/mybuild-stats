# Runner.ps1 — module loader, pre-check, menu, apply loop

function Import-Modules([string]$ModulesDir) {
    $modules = @()
    $files = Get-ChildItem $ModulesDir -Filter '*.ps1' | Sort-Object Name
    foreach ($file in $files) {
        . $file.FullName
        $meta = Get-Variable -Name 'ModuleMeta' -ValueOnly -ErrorAction SilentlyContinue
        if ($meta) {
            $modules += @{
                Id          = $meta.Id
                DisplayName = $meta.DisplayName
                Risk        = $meta.Risk
                GpoConflict = $meta.GpoConflict
                Safe        = $meta.Safe
                CheckFn     = Get-Item Function:\Invoke-Check
                ApplyFn     = Get-Item Function:\Invoke-Apply
                RollbackFn  = Get-Item Function:\Invoke-Rollback
            }
            Remove-Variable -Name 'ModuleMeta' -Scope Global -ErrorAction SilentlyContinue
        }
    }
    return $modules
}

function Invoke-PreCheck([array]$Modules) {
    Write-SectionHeader "SYSTEM SCAN"
    Write-Host ""
    $results = @{}
    foreach ($m in $Modules) {
        $present = & $m.CheckFn
        $status  = if ($present) { 'PRESENT' } else { 'NOT FOUND' }
        Write-CheckLine $m.DisplayName $status
        $results[$m.Id] = $present
    }
    Write-Host ""
    return $results
}

function Show-ModuleMenu([array]$Modules, [hashtable]$CheckResults) {
    $selected = @{}
    foreach ($m in $Modules) {
        $selected[$m.Id] = $CheckResults[$m.Id]
    }

    while ($true) {
        Clear-Screen
        Write-SectionHeader "SELECT MODULES TO APPLY"
        Write-Host ""
        Write-Host "  #   Module                    Status" -ForegroundColor DarkGray
        Write-Divider

        $i = 1
        foreach ($m in $Modules) {
            $status = if ($CheckResults[$m.Id]) { 'PRESENT' } else { 'NOT FOUND' }
            $sel    = $selected[$m.Id]
            Write-MenuRow $i $sel $m.DisplayName $status
            $i++
        }

        Write-Divider
        Write-Host ""
        Write-Host "  Toggle: type number(s) separated by space" -ForegroundColor DarkGray
        Write-Host "  [A] Select all present   [N] Clear all   [Q] Quit   [Enter] Apply" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "  > " -NoNewline -ForegroundColor Cyan
        $input = (Read-Host).Trim()

        if ($input -eq '') { break }
        if ($input -eq 'Q' -or $input -eq 'q') { return $null }

        if ($input -eq 'A' -or $input -eq 'a') {
            foreach ($m in $Modules) {
                if ($CheckResults[$m.Id]) { $selected[$m.Id] = $true }
            }
            continue
        }

        if ($input -eq 'N' -or $input -eq 'n') {
            foreach ($m in $Modules) { $selected[$m.Id] = $false }
            continue
        }

        $tokens = $input -split '\s+'
        foreach ($token in $tokens) {
            $num = 0
            if ([int]::TryParse($token, [ref]$num)) {
                $idx = $num - 1
                if ($idx -ge 0 -and $idx -lt $Modules.Count) {
                    $m = $Modules[$idx]
                    if (-not $CheckResults[$m.Id]) {
                        Write-Host "  [!] '$($m.DisplayName)' not present on this system - skipped" -ForegroundColor Red
                        Start-Sleep -Milliseconds 900
                    } else {
                        $selected[$m.Id] = -not $selected[$m.Id]
                    }
                }
            }
        }
    }

    $chosen = @()
    foreach ($m in $Modules) {
        if ($selected[$m.Id]) { $chosen += $m }
    }
    return $chosen
}

function Confirm-Selection([array]$Selected) {
    if ($Selected.Count -eq 0) {
        Write-Host "  No modules selected." -ForegroundColor Yellow
        return $false
    }

    Clear-Screen
    Write-SectionHeader "CONFIRM SELECTION"
    Write-Host ""
    Write-Host "  The following modules will be applied:" -ForegroundColor White
    Write-Host ""
    foreach ($m in $Selected) {
        $riskColor = switch ($m.Risk) {
            'Low'    { 'Green'  }
            'Medium' { 'Yellow' }
            'High'   { 'Red'    }
            default  { 'Gray'   }
        }
        Write-Host "    > " -NoNewline -ForegroundColor DarkGray
        Write-Host $m.DisplayName.PadRight(26) -NoNewline -ForegroundColor White
        Write-Host "[Risk: $($m.Risk)]" -ForegroundColor $riskColor
        if ($m.GpoConflict) {
            Write-Host "      [!] GPO: $($m.GpoConflict)" -ForegroundColor Yellow
        }
    }

    Write-Host ""
    Write-Divider
    Write-Host ""
    Write-Host "  Proceed? " -NoNewline -ForegroundColor White
    Write-Host "[Y/N] " -NoNewline -ForegroundColor Cyan
    $answer = (Read-Host).Trim()
    return ($answer -eq 'Y' -or $answer -eq 'y')
}

function Invoke-ApplySelected([array]$Selected) {
    $log     = @{}
    $total   = $Selected.Count
    $done    = 0

    Clear-Screen
    Write-SectionHeader "APPLYING CHANGES  [$total selected]"
    Write-Host ""

    foreach ($m in $Selected) {
        Write-ProgressBar $done $total
        Write-Host "  Running: $($m.DisplayName)..." -ForegroundColor DarkGray

        try {
            $result = & $m.ApplyFn
        } catch {
            $result = @{ Status = 'Failed'; Detail = $_.Exception.Message }
        }

        $log[$m.Id] = $result
        $done++
        Write-ProgressBar $done $total
        Write-StatusLine $m.DisplayName $result.Status $result.Detail
    }

    Write-Host ""
    return $log
}

function Show-Summary([hashtable]$Log, [string]$LogPath) {
    Write-Host ""
    Write-SectionHeader "SUMMARY"
    Write-Host ""

    $changed = ($Log.Values | Where-Object { $_.Status -eq 'Changed' }).Count
    $skipped = ($Log.Values | Where-Object { $_.Status -eq 'Skipped' }).Count
    $failed  = ($Log.Values | Where-Object { $_.Status -eq 'Failed'  }).Count

    Write-Host "  Changed : " -NoNewline -ForegroundColor DarkGray
    Write-Host $changed -ForegroundColor Green
    Write-Host "  Skipped : " -NoNewline -ForegroundColor DarkGray
    Write-Host $skipped -ForegroundColor Yellow
    Write-Host "  Failed  : " -NoNewline -ForegroundColor DarkGray
    Write-Host $failed -ForegroundColor $(if ($failed -gt 0) { 'Red' } else { 'DarkGray' })
    Write-Host ""
    Write-Divider
    Write-Host ""
    Write-Host "  Log saved: " -NoNewline -ForegroundColor DarkGray
    Write-Host $LogPath -ForegroundColor Cyan
    Write-Host ""
}
