# privacy.ps1 - location, advertising, activity history, telemetry extras

$ModuleMeta = @{
    Id          = 'privacy'
    DisplayName = 'Privacy Settings'
    Risk        = 'Low'
    GpoConflict = 'Location/Find My Device may be required by MDM policy'
    Safe        = $true
}

$PrivacyKeys = @(
    # Advertising ID
    @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\AdvertisingInfo';              Name='Enabled';                               Value=0 }
    # Tailored experiences
    @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Privacy';                      Name='TailoredExperiencesWithDiagnosticDataEnabled'; Value=0 }
    # Online Speech Recognition
    @{ Path='HKCU:\Software\Microsoft\Speech_OneCore\Settings\OnlineSpeechPrivacy';         Name='HasAccepted';                           Value=0 }
    # Inking & Typing
    @{ Path='HKCU:\Software\Microsoft\Input\TIPC';                                          Name='Enabled';                               Value=0 }
    @{ Path='HKCU:\Software\Microsoft\InputPersonalization';                                Name='RestrictImplicitInkCollection';         Value=1 }
    @{ Path='HKCU:\Software\Microsoft\InputPersonalization';                                Name='RestrictImplicitTextCollection';        Value=1 }
    @{ Path='HKCU:\Software\Microsoft\InputPersonalization\TrainedDataStore';               Name='HarvestContacts';                       Value=0 }
    @{ Path='HKCU:\Software\Microsoft\Personalization\Settings';                            Name='AcceptedPrivacyPolicy';                 Value=0 }
    # App launch tracking
    @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced';            Name='Start_TrackProgs';                      Value=0 }
    # Activity history
    @{ Path='HKLM:\SOFTWARE\Policies\Microsoft\Windows\System';                            Name='PublishUserActivities';                 Value=0 }
    # Feedback frequency
    @{ Path='HKCU:\SOFTWARE\Microsoft\Siuf\Rules';                                         Name='NumberOfSIUFInPeriod';                  Value=0 }
    # Location services
    @{ Path='HKLM:\SOFTWARE\Policies\Microsoft\Windows\LocationAndSensors';                Name='DisableLocation';                       Value=1 }
    # Find My Device
    @{ Path='HKLM:\SOFTWARE\Policies\Microsoft\FindMyDevice';                              Name='AllowFindMyDevice';                     Value=0 }
    # Lock screen tips
    @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager';      Name='SubscribedContent-338387Enabled';       Value=0 }
    @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager';      Name='RotatingLockScreenOverlayEnabled';      Value=0 }
    # Delivery Optimization (peer sharing of updates)
    @{ Path='HKLM:\SOFTWARE\Policies\Microsoft\Windows\DeliveryOptimization';             Name='DODownloadMode';                        Value=0 }
)

function Invoke-Check {
    # Check advertising ID as representative sentinel
    $val = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\AdvertisingInfo' -Name 'Enabled' -ErrorAction SilentlyContinue).Enabled
    if ($val -ne 0) { return $true }

    $loc = (Get-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\LocationAndSensors' -Name 'DisableLocation' -ErrorAction SilentlyContinue).DisableLocation
    if ($loc -ne 1) { return $true }

    return $false
}

function Invoke-Apply {
    $changed = 0
    $errors  = @()

    foreach ($key in $PrivacyKeys) {
        try {
            if (-not (Test-Path $key.Path)) { New-Item -Path $key.Path -Force | Out-Null }
            Set-ItemProperty -Path $key.Path -Name $key.Name -Value $key.Value -Type DWord -Force -ErrorAction Stop
            $changed++
        } catch {
            $errors += $key.Name
        }
    }

    # Feedback: remove PeriodInNanoSeconds (delete key)
    Remove-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Siuf\Rules' -Name 'PeriodInNanoSeconds' -ErrorAction SilentlyContinue

    if ($errors.Count -gt 0 -and $changed -eq 0) {
        return @{ Status = 'Failed'; Detail = "Failed: $($errors -join ', ')" }
    }

    $detail = "$changed privacy settings applied"
    if ($errors.Count -gt 0) { $detail += " ($($errors.Count) skipped)" }
    return @{ Status = 'Changed'; Detail = $detail }
}

function Invoke-Rollback {
    try {
        Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\AdvertisingInfo' -Name 'Enabled' -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
        Set-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\LocationAndSensors'    -Name 'DisableLocation' -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
        return $true
    } catch { return $false }
}
