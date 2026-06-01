# bloatware.ps1

$ModuleMeta = @{
    Id          = 'bloatware'
    DisplayName = 'Bloatware Apps'
    Risk        = 'Low'
    GpoConflict = ''
    Safe        = $true
}

# Id = package name pattern, Label = friendly display name
$BloatwareList = @(
    @{ Id = 'king.com.CandyCrushSaga';               Label = 'Candy Crush Saga'        }
    @{ Id = 'king.com.CandyCrushFriends';            Label = 'Candy Crush Friends'      }
    @{ Id = 'king.com.BubbleWitch3Saga';             Label = 'Bubble Witch 3 Saga'      }
    @{ Id = 'BytedancePte.Ltd.TikTok';               Label = 'TikTok'                   }
    @{ Id = 'Facebook.Facebook';                     Label = 'Facebook'                 }
    @{ Id = 'Facebook.Instagram';                    Label = 'Instagram'                }
    @{ Id = 'Disney.37853D22215B2';                  Label = 'Disney+'                  }
    @{ Id = 'SpotifyAB.SpotifyMusic';                Label = 'Spotify'                  }
    @{ Id = 'Microsoft.BingNews';                    Label = 'Bing News'                }
    @{ Id = 'Microsoft.BingWeather';                 Label = 'Bing Weather'             }
    @{ Id = 'Microsoft.BingFinance';                 Label = 'Bing Finance'             }
    @{ Id = 'Microsoft.BingSports';                  Label = 'Bing Sports'              }
    @{ Id = 'Microsoft.MicrosoftSolitaireCollection';Label = 'Solitaire Collection'     }
    @{ Id = 'Microsoft.MicrosoftMahjong';            Label = 'Mahjong'                  }
    @{ Id = 'Microsoft.MicrosoftJigsawPuzzles';      Label = 'Jigsaw Puzzles'           }
    @{ Id = 'Microsoft.ZuneMusic';                   Label = 'Groove Music'             }
    @{ Id = 'Microsoft.ZuneVideo';                   Label = 'Movies & TV'              }
    @{ Id = 'Microsoft.People';                      Label = 'People'                   }
    @{ Id = 'Microsoft.SkypeApp';                    Label = 'Skype'                    }
    @{ Id = 'Microsoft.Getstarted';                  Label = 'Get Started (Tips)'       }
    @{ Id = 'Microsoft.GetHelp';                     Label = 'Get Help'                 }
    @{ Id = 'Microsoft.Todos';                       Label = 'Microsoft To Do'          }
    @{ Id = 'Microsoft.PowerAutomateDesktop';        Label = 'Power Automate'           }
    @{ Id = 'MicrosoftCorporationII.MicrosoftFamily';Label = 'Microsoft Family Safety'  }
    @{ Id = 'Clipchamp.Clipchamp';                   Label = 'Clipchamp'               }
    @{ Id = 'Microsoft.MicrosoftOfficeHub';          Label = 'Office Hub'               }
    @{ Id = 'Microsoft.WindowsFeedbackHub';          Label = 'Feedback Hub'             }
    @{ Id = 'Microsoft.Xbox.TCUI';                   Label = 'Xbox TCUI'                }
    @{ Id = 'Microsoft.XboxGameOverlay';             Label = 'Xbox Game Overlay'        }
    @{ Id = 'Microsoft.XboxGamingOverlay';           Label = 'Xbox Gaming Overlay'      }
    @{ Id = 'Microsoft.XboxIdentityProvider';        Label = 'Xbox Identity Provider'   }
    @{ Id = 'Microsoft.XboxSpeechToTextOverlay';     Label = 'Xbox Speech to Text'      }
)

function Invoke-Check {
    foreach ($pkg in $BloatwareList) {
        if (Get-AppxPackage -AllUsers -Name $pkg.Id -ErrorAction SilentlyContinue) { return $true }
    }
    return $false
}

function Show-BloatwareMenu([array]$Found) {
    $selected = @{}
    foreach ($app in $Found) { $selected[$app.Id] = $true }

    while ($true) {
        Write-Host ""
        Write-Host ("  +" + ("-" * 46) + "+") -ForegroundColor Blue
        Write-Host "  |  BLOATWARE SELECTION                         |" -ForegroundColor Blue
        Write-Host ("  +" + ("-" * 46) + "+") -ForegroundColor Blue
        Write-Host ""
        Write-Host "   #   App                           Sel" -ForegroundColor DarkGray
        Write-Host ("  " + ("-" * 46)) -ForegroundColor DarkGray

        $i = 1
        foreach ($app in $Found) {
            $check    = if ($selected[$app.Id]) { 'X' } else { ' ' }
            $numStr   = $i.ToString().PadLeft(2)
            $nameStr  = $app.Label.PadRight(30)
            $rowColor = if ($selected[$app.Id]) { 'Cyan' } else { 'DarkGray' }
            Write-Host "  [$check] $numStr  " -NoNewline -ForegroundColor $rowColor
            Write-Host $nameStr -ForegroundColor White
            $i++
        }

        Write-Host ("  " + ("-" * 46)) -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "  Toggle number(s) | [A] All | [N] None | [Enter] Remove | [Q] Skip" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "  > " -NoNewline -ForegroundColor Cyan
        $rawInput = (Read-Host).Trim()

        if ($rawInput -eq '')                         { break }
        if ($rawInput -eq 'Q' -or $rawInput -eq 'q') { return $null }
        if ($rawInput -eq 'A' -or $rawInput -eq 'a') { foreach ($app in $Found) { $selected[$app.Id] = $true  }; continue }
        if ($rawInput -eq 'N' -or $rawInput -eq 'n') { foreach ($app in $Found) { $selected[$app.Id] = $false }; continue }

        foreach ($token in ($rawInput -split '\s+')) {
            $num = 0
            if ([int]::TryParse($token, [ref]$num)) {
                $idx = $num - 1
                if ($idx -ge 0 -and $idx -lt $Found.Count) {
                    $id = $Found[$idx].Id
                    $selected[$id] = -not $selected[$id]
                }
            }
        }
    }

    return @($Found | Where-Object { $selected[$_.Id] })
}

function Invoke-Apply {
    # Detect which apps are actually present
    $found = [System.Collections.Generic.List[hashtable]]::new()
    foreach ($pkg in $BloatwareList) {
        if (Get-AppxPackage -AllUsers -Name $pkg.Id -ErrorAction SilentlyContinue) {
            $found.Add($pkg)
        }
    }

    if ($found.Count -eq 0) {
        return @{ Status = 'Skipped'; Detail = 'No bloatware found' }
    }

    # Show interactive selection menu
    $toRemove = Show-BloatwareMenu $found

    if ($null -eq $toRemove -or $toRemove.Count -eq 0) {
        return @{ Status = 'Skipped'; Detail = 'No apps selected' }
    }

    $removed = [System.Collections.Generic.List[string]]::new()
    $failed  = [System.Collections.Generic.List[string]]::new()

    foreach ($pkg in $toRemove) {
        $app = Get-AppxPackage -AllUsers -Name $pkg.Id -ErrorAction SilentlyContinue
        if (-not $app) { continue }
        try {
            Get-AppxProvisionedPackage -Online |
                Where-Object { $_.DisplayName -eq $pkg.Id } |
                Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue | Out-Null

            Remove-AppxPackage -Package $app.PackageFullName -AllUsers -ErrorAction Stop
            $removed.Add($pkg.Label)
        } catch {
            try {
                Remove-AppxPackage -Package $app.PackageFullName -ErrorAction Stop
                $removed.Add($pkg.Label)
            } catch {
                $failed.Add($pkg.Label)
            }
        }
    }

    if ($removed.Count -eq 0) {
        return @{ Status = 'Failed'; Detail = "Could not remove: $($failed -join ', ')" }
    }

    $detail = "Removed $($removed.Count): $($removed -join ', ')"
    if ($failed.Count -gt 0) { $detail += " | Could not remove: $($failed -join ', ')" }

    return @{ Status = 'Changed'; Detail = $detail }
}

function Invoke-Rollback {
    return $false
}
