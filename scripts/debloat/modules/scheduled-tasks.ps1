# scheduled-tasks.ps1 - disable telemetry and diagnostics scheduled tasks

$ModuleMeta = @{
    Id          = 'scheduled-tasks'
    DisplayName = 'Telemetry Scheduled Tasks'
    Risk        = 'Low'
    GpoConflict = ''
    Safe        = $true
}

# Tasks that phone home: CEIP, compat appraiser, disk diagnostics, feedback
$TelemetryTasks = @(
    @{ Path = '\Microsoft\Windows\Customer Experience Improvement Program\'; Name = 'Consolidator' }
    @{ Path = '\Microsoft\Windows\Customer Experience Improvement Program\'; Name = 'KernelCeipTask' }
    @{ Path = '\Microsoft\Windows\Customer Experience Improvement Program\'; Name = 'UsbCeip' }
    @{ Path = '\Microsoft\Windows\Application Experience\';                  Name = 'Microsoft Compatibility Appraiser' }
    @{ Path = '\Microsoft\Windows\Application Experience\';                  Name = 'ProgramDataUpdater' }
    @{ Path = '\Microsoft\Windows\Application Experience\';                  Name = 'StartupAppTask' }
    @{ Path = '\Microsoft\Windows\DiskDiagnostic\';                          Name = 'Microsoft-Windows-DiskDiagnosticDataCollector' }
    @{ Path = '\Microsoft\Windows\Autochk\';                                 Name = 'Proxy' }
    @{ Path = '\Microsoft\Windows\Feedback\Siuf\';                           Name = 'DmClient' }
    @{ Path = '\Microsoft\Windows\Feedback\Siuf\';                           Name = 'DmClientOnScenarioDownload' }
)

function Invoke-Check {
    foreach ($t in $TelemetryTasks) {
        $task = Get-ScheduledTask -TaskPath $t.Path -TaskName $t.Name -ErrorAction SilentlyContinue
        if ($task -and $task.State -ne 'Disabled') { return $true }
    }
    return $false
}

function Invoke-Apply {
    $disabled = 0
    $missing  = 0
    $errors   = @()

    foreach ($t in $TelemetryTasks) {
        $task = Get-ScheduledTask -TaskPath $t.Path -TaskName $t.Name -ErrorAction SilentlyContinue
        if (-not $task)                     { $missing++; continue }
        if ($task.State -eq 'Disabled')     { continue }
        try {
            Disable-ScheduledTask -TaskPath $t.Path -TaskName $t.Name -ErrorAction Stop | Out-Null
            $disabled++
        } catch {
            $errors += $t.Name
        }
    }

    if ($errors.Count -gt 0 -and $disabled -eq 0) {
        return @{ Status = 'Failed'; Detail = "Failed: $($errors -join ', ')" }
    }

    $detail = "$disabled task(s) disabled"
    if ($missing -gt 0)       { $detail += ", $missing not present" }
    if ($errors.Count -gt 0)  { $detail += ", $($errors.Count) errors" }
    return @{ Status = 'Changed'; Detail = $detail }
}

function Invoke-Rollback {
    try {
        foreach ($t in $TelemetryTasks) {
            $task = Get-ScheduledTask -TaskPath $t.Path -TaskName $t.Name -ErrorAction SilentlyContinue
            if ($task) {
                Enable-ScheduledTask -TaskPath $t.Path -TaskName $t.Name -ErrorAction SilentlyContinue | Out-Null
            }
        }
        return $true
    } catch { return $false }
}
