# UI.ps1 - box-drawing, color helpers, progress bar (ASCII-safe for PS5.1)

function Write-BoxTop {
    Write-Host ("  +" + ("-" * 46) + "+") -ForegroundColor Blue
}
function Write-BoxBottom {
    Write-Host ("  +" + ("-" * 46) + "+") -ForegroundColor Blue
}
function Write-BoxLine([string]$Text, [string]$Color = 'White') {
    $padded = $Text.PadRight(45)
    Write-Host "  | " -NoNewline -ForegroundColor Blue
    Write-Host $padded -NoNewline -ForegroundColor $Color
    Write-Host "|" -ForegroundColor Blue
}

function Write-Header([string]$Title) {
    Write-Host ""
    Write-BoxTop
    Write-BoxLine $Title Cyan
    Write-BoxBottom
    Write-Host ""
}

function Write-SectionHeader([string]$Title) {
    Write-Host ""
    Write-BoxTop
    Write-BoxLine $Title Yellow
    Write-BoxBottom
}

function Write-CheckLine([string]$Name, [string]$Status) {
    $color = switch ($Status) {
        'PRESENT'       { 'Green'    }
        'NOT FOUND'     { 'Red'      }
        'DISABLED'      { 'Yellow'   }
        'ALREADY CLEAN' { 'DarkGray' }
        default         { 'Gray'     }
    }
    $badge = ("[" + $Status + "]").PadRight(14)
    Write-Host "  " -NoNewline
    Write-Host $badge -NoNewline -ForegroundColor $color
    Write-Host $Name -ForegroundColor White
}

function Write-StatusLine([string]$Name, [string]$Status, [string]$Detail = '') {
    $icon = switch ($Status) {
        'Changed' { '[+]' }
        'Skipped' { '[~]' }
        'Failed'  { '[!]' }
        default   { '[ ]' }
    }
    $color = switch ($Status) {
        'Changed' { 'Green'  }
        'Skipped' { 'Yellow' }
        'Failed'  { 'Red'    }
        default   { 'Gray'   }
    }
    Write-Host "  $icon " -NoNewline -ForegroundColor $color
    Write-Host $Name.PadRight(22) -NoNewline -ForegroundColor White
    if ($Detail) {
        Write-Host " -> $Detail" -ForegroundColor DarkGray
    } else {
        Write-Host ""
    }
}

function Write-ProgressBar([int]$Done, [int]$Total) {
    $barLen = 32
    $filled = if ($Total -gt 0) { [int](($Done / $Total) * $barLen) } else { 0 }
    $empty  = $barLen - $filled
    $pct    = if ($Total -gt 0) { [int](($Done / $Total) * 100) } else { 0 }
    $bar    = ("#" * $filled) + ("-" * $empty)
    Write-Host "  [" -NoNewline -ForegroundColor DarkGray
    Write-Host $bar -NoNewline -ForegroundColor Blue
    Write-Host "] " -NoNewline -ForegroundColor DarkGray
    Write-Host "$pct%" -ForegroundColor Cyan
}

function Write-MenuRow([int]$Num, [bool]$Selected, [string]$Name, [string]$Status) {
    $check   = if ($Selected) { 'X' } else { ' ' }
    $numStr  = $Num.ToString().PadLeft(2)
    $nameStr = $Name.PadRight(24)
    $statusColor = switch ($Status) {
        'PRESENT'       { 'Green'    }
        'NOT FOUND'     { 'Red'      }
        'DISABLED'      { 'Yellow'   }
        'ALREADY CLEAN' { 'DarkGray' }
        default         { 'Gray'     }
    }
    $rowColor = if ($Selected) { 'Cyan' } else { 'DarkGray' }
    Write-Host "  [$check] $numStr  " -NoNewline -ForegroundColor $rowColor
    Write-Host $nameStr -NoNewline -ForegroundColor White
    Write-Host $Status -ForegroundColor $statusColor
}

function Write-Divider {
    Write-Host ("  " + ("-" * 46)) -ForegroundColor DarkGray
}

function Clear-Screen {
    Clear-Host
}
