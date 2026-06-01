# xbox-services.ps1

$ModuleMeta = @{
    Id          = 'xbox-services'
    DisplayName = 'Xbox Services'
    Risk        = 'Low'
    GpoConflict = ''
    Safe        = $true
}

$XboxServices = @(
    'XblAuthManager'
    'XblGameSave'
    'XboxNetApiSvc'
    'XboxGipSvc'
    'XboxGipSvc'
)

function Invoke-Check {
    foreach ($name in $XboxServices) {
        $svc = Get-Service $name -ErrorAction SilentlyContinue
        if ($svc -and $svc.StartType -ne 'Disabled') { return $true }
    }
    return $false
}

function Invoke-Apply {
    $changed = 0
    $errors  = [System.Collections.Generic.List[string]]::new()

    foreach ($name in ($XboxServices | Select-Object -Unique)) {
        $svc = Get-Service $name -ErrorAction SilentlyContinue
        if ($null -eq $svc) { continue }
        if ($svc.StartType -eq 'Disabled') { continue }
        try {
            Stop-Service $name -Force -ErrorAction SilentlyContinue
            Set-Service  $name -StartupType Disabled -ErrorAction Stop
            $changed++
        } catch {
            $errors.Add($name)
        }
    }

    if ($changed -eq 0 -and $errors.Count -eq 0) {
        return @{ Status = 'Skipped'; Detail = 'All Xbox services already disabled' }
    }
    if ($errors.Count -gt 0 -and $changed -eq 0) {
        return @{ Status = 'Failed'; Detail = "Could not disable: $($errors -join ', ')" }
    }
    return @{ Status = 'Changed'; Detail = "Disabled $changed Xbox service(s)" }
}

function Invoke-Rollback {
    try {
        foreach ($name in ($XboxServices | Select-Object -Unique)) {
            $svc = Get-Service $name -ErrorAction SilentlyContinue
            if ($svc) { Set-Service $name -StartupType Manual -ErrorAction SilentlyContinue }
        }
        return $true
    } catch {
        return $false
    }
}
