# windows-ai.ps1 — wraps existing run-remove-ai.ps1 sentinel logic

$ModuleMeta = @{
    Id          = 'windows-ai'
    DisplayName = 'Windows AI / Copilot'
    Risk        = 'Medium'
    GpoConflict = 'WindowsAI policy may re-enable on next GPO refresh'
    Safe        = $true
}

function Invoke-Check {
    # BingSearch excluded — it's web search integration, not Copilot/AI
    $appxPatterns = @('*Copilot*', '*Recall*', '*WindowsAI*')
    foreach ($p in $appxPatterns) {
        if (Get-AppxPackage -AllUsers -Name $p -ErrorAction SilentlyContinue) { return $true }
    }

    # If policies are enforced, consider compliant regardless of remaining packages
    $aiVal = (Get-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI' -Name 'DisableAIDataAnalysis' -ErrorAction SilentlyContinue).DisableAIDataAnalysis
    $cpVal = (Get-ItemProperty 'HKCU:\SOFTWARE\Policies\Microsoft\Windows\WindowsCopilot' -Name 'TurnOffWindowsCopilot' -ErrorAction SilentlyContinue).TurnOffWindowsCopilot

    if ($aiVal -eq 1 -and $cpVal -eq 1) { return $false }

    return $true
}

function Invoke-Apply {
    $scriptDir = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
    $runScript = Join-Path $scriptDir 'run-remove-ai.ps1'

    if (-not (Test-Path $runScript)) {
        # Fallback: apply minimal registry policies directly
        try {
            $aiPath = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI'
            if (-not (Test-Path $aiPath)) { New-Item -Path $aiPath -Force | Out-Null }
            Set-ItemProperty -Path $aiPath -Name 'DisableAIDataAnalysis' -Value 1 -Type DWord -Force

            $cpPath = 'HKCU:\SOFTWARE\Policies\Microsoft\Windows\WindowsCopilot'
            if (-not (Test-Path $cpPath)) { New-Item -Path $cpPath -Force | Out-Null }
            Set-ItemProperty -Path $cpPath -Name 'TurnOffWindowsCopilot' -Value 1 -Type DWord -Force

            # Remove Copilot taskbar pin
            Set-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced' `
                -Name 'ShowCopilotButton' -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue

            return @{ Status = 'Changed'; Detail = 'Copilot policies set, taskbar pin removed' }
        } catch {
            return @{ Status = 'Failed'; Detail = $_.Exception.Message }
        }
    }

    try {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $runScript -nonInteractive -AllOptions 2>&1 | Out-Null
    } catch { }

    # Always enforce policies directly — regardless of upstream script result
    try {
        $aiPath = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI'
        if (-not (Test-Path $aiPath)) { New-Item -Path $aiPath -Force | Out-Null }
        Set-ItemProperty -Path $aiPath -Name 'DisableAIDataAnalysis' -Value 1 -Type DWord -Force

        $cpPath = 'HKCU:\SOFTWARE\Policies\Microsoft\Windows\WindowsCopilot'
        if (-not (Test-Path $cpPath)) { New-Item -Path $cpPath -Force | Out-Null }
        Set-ItemProperty -Path $cpPath -Name 'TurnOffWindowsCopilot' -Value 1 -Type DWord -Force

        Set-ItemProperty 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced' `
            -Name 'ShowCopilotButton' -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue

        return @{ Status = 'Changed'; Detail = 'RemoveWindowsAI applied, policies enforced' }
    } catch {
        return @{ Status = 'Failed'; Detail = $_.Exception.Message }
    }
}

function Invoke-Rollback {
    try {
        Remove-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsAI' -Name 'DisableAIDataAnalysis' -ErrorAction SilentlyContinue
        Remove-ItemProperty -Path 'HKCU:\SOFTWARE\Policies\Microsoft\Windows\WindowsCopilot' -Name 'TurnOffWindowsCopilot' -ErrorAction SilentlyContinue
        Set-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced' `
            -Name 'ShowCopilotButton' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
        return $true
    } catch {
        return $false
    }
}
