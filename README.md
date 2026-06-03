# MyBuild Stats

Two tools for the serious Windows user — pick your path:

| | [🎮 Gamer Dashboard](#-gamer-dashboard) | [🏢 Enterprise Debloat](#-enterprise-debloat) |
|---|---|---|
| **What** | Self-hosted web dashboard for your PC build | PowerShell debloat CLI for Windows |
| **Who** | PC enthusiasts, gamers, builders | IT admins, power users |
| **How** | `npm run dev` → open localhost:3000 | One PowerShell one-liner |
| **Requires** | Node.js 18+, Windows 10/11 | Windows 10/11, PowerShell 5.1 |
| **Features** | Hardware gauges, upgrade tracking, price alerts, maintenance automations, dev tools manager | Interactive menu or silent CLI, 10 modules, audit log, GPO-safe |

---

## Contents

- [🎮 Gamer Dashboard](#-gamer-dashboard)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Setup](#setup)
  - [Configuration](#configuration-per-pc)
- [🏢 Enterprise Debloat](#-enterprise-debloat)
  - [Quick Start](#quick-start)
  - [Module List](#full-module-list)
  - [Enterprise / IT Admin](#enterprise--it-admin)
  - [Architecture](#architecture)
- [Roadmap](#roadmap)

---

---

## 🎮 Gamer Dashboard

**[Live Demo](https://viniciusap.github.io/mybuild-stats/)** — static preview with mock data.

Local, self-hosted hardware command center for Windows. Monitors your PC in real time, tracks component depreciation, watches upgrade prices, runs maintenance tasks, and manages dev tools — all from a clean dark-mode web UI.

### Features

#### Hardware Dashboard

Real-time gauges for every major component, auto-refreshed every 15 seconds.

| Component | Metrics |
|-----------|---------|
| **CPU** | Load %, temperature, base/boost clock, cores/threads, socket |
| **GPU** | Utilization %, temperature, VRAM usage, driver version & date |
| **RAM** | Used/free GB, usage %, stick count, speed, type, part number, brand |
| **Storage** | Capacity used %, S.M.A.R.T health status, interface, temperature |

Each card shows:
- **Speedometer gauge** — color shifts green → amber → red as values approach warning/critical thresholds.
- **Hover tooltip** on the gauge — shows exact value, max, warn/critical thresholds, and current zone (OK / WARNING / CRITICAL).
- **Component image** — auto-fetched from DuckDuckGo on first load; click to open the image search modal and pick a different one.
- **Age badge** — how long you have owned the component, derived from `data/upgrade-path.json`.
- **Footer stats** — quick-read key values without reading the gauge.

### System Info Card

Sidebar card showing OS, Windows build, uptime, motherboard, BIOS version, BIOS age, and GPU driver date.

- **Copy Build** button — copies a full markdown-formatted hardware spec sheet to the clipboard, suitable for pasting in forums or support tickets.
- **BIOS age warning** — amber highlight and banner if BIOS was released more than 365 days ago.

### Case / PC Photo

Upload or search for a photo of your case or full build.

- **SEARCH MODEL tab** — queries DuckDuckGo Images by case model name; pick from a 3×3 grid.
- **UPLOAD PHOTO tab** — drag-and-drop or file picker; accepts JPG, PNG, WEBP up to 10 MB.

### Live Clock

Real-time clock in the header, ticking every second. Format: `MM/DD/YYYY HH:MM:SS`.

---

### Upgrade Radar

Price-tracking panel for your configured upgrade targets. Displays the cheapest found price per target, a progress bar relative to the reference price, and a discount badge when the price drops ≥10% below reference.

- A **TRIGGER** badge fires when the price falls below your configured trigger price.
- Supported stores: KaBuM, Pichau, Terabyte (requires a [Serper.dev](https://serper.dev) API key).
- Prices are checked automatically every 12 hours via `node-cron`. You can also force a check manually from the header.

### Upgrade & Depreciation Analysis

Side-by-side comparison of your current CPU and GPU against their configured upgrade targets.

**Comparison table columns:**
- Current component detected from live hardware
- Age (months owned)
- Upgrade target name
- Target price · Estimated resale value · Net cost (target − resale)
- Performance gain %
- Upgrade timing badge

**Temporal analysis table columns:**
- Original purchase price · Depreciation % · Monthly depreciation (R$) · R$ per 1% performance gain · Recommendation

**Insight cards:**
- Best value — which component gives the most performance per R$ spent on upgrade
- Optimal window — which component is currently in the ideal resale-value band
- Total depreciation per month — ongoing cost of keeping current hardware

**Timing badges:** EARLY · OPTIMAL · VALID · URGENT — based on remaining resale value vs. original price.

### Build Timeline

Chronological log of build events grouped by year. Event types:

| Type | Description |
|------|-------------|
| ADDED | New component installed |
| REMOVED | Component removed from the build |
| UPGRADE | Component replaced with a newer model |
| REPAIR | Component repaired or RMA'd |
| DRIVER | Driver update logged |

Each event shows date, component name, optional price paid, and notes. Seeded from `data/build-timeline.json`.

---

### Automations Tab

One-click Windows maintenance tasks with live log streaming. Output appears line-by-line as the process runs.

| Task | Command | Admin Required |
|------|---------|---------------|
| **Flush DNS Cache** | `ipconfig /flushdns` | No |
| **Clean TEMP Folder** | PowerShell — clears `%TEMP%` and `C:\Windows\Temp` | No |
| **Check Drivers** | PowerShell + `Get-WindowsDriver` — lists all drivers, flags those older than 365 days | No |
| **Upgrade All Packages** | `winget upgrade --all` | **Yes** |
| **DISM — Restore Health** | `dism /Online /Cleanup-Image /RestoreHealth` | **Yes** |
| **SFC — Scan System Files** | `sfc /scannow` | **Yes** |
| **Remove Windows AI** | Wrapper script — pre-checks system state, then runs `RemoveWindowsAi.ps1 -nonInteractive -AllOptions` if needed | **Yes** |

> **Admin tasks:** Start the dev server (or PM2) from an Administrator terminal. The process running `npm run dev` needs elevation — there is no UAC prompt from within the app.

Each task card shows:
- Estimated duration and ADMIN badge where applicable
- **Status badge** after completion: DONE · ERROR · COMPLIANT · EXECUTED
- **Last run** — time elapsed since the previous run (e.g. `COMPLIANT · 2h ago`), loaded from persistent history on every page visit
- Log panel auto-closes 3 seconds after the task finishes

**Run history** is persisted to `scripts/automation-runs.json` (per machine, not versioned). A ring buffer keeps the last 50 runs per task.

#### Remove Windows AI — idempotent pre-check

Before running the upstream script, a wrapper (`scripts/run-remove-ai.ps1`) queries the system:

1. AppX packages (`*Copilot*`, `*Recall*`, `*BingSearch*`, `*WindowsAI*`)
2. Registry policies (`HKLM\…\WindowsAI`, `HKCU\…\WindowsCopilot`)
3. Scheduled task `RemoveAI-UpdateCleanupChecker`

If all checks pass → status **COMPLIANT** (no action taken, ~5s). If any artifact is detected → runs the full removal script → status **EXECUTED**. Source: [zoicware/RemoveWindowsAI](https://github.com/zoicware/RemoveWindowsAI).

---

### Tools Tab

Detect, install, and update developer tools on the machine. Powered by Windows `where` command and `winget`.

**26 tools** across 3 categories:

| Category | Tools |
|----------|-------|
| Package Managers | winget, Chocolatey, Scoop, npm, pnpm, yarn, Bun, pip, cargo |
| Runtimes | Node.js, Deno, Python, Go, .NET, Java, Rust |
| Dev Tools | Git, GitHub CLI, Docker, kubectl, curl, npx, Azure CLI, AWS CLI, Terraform, make |

Each tool card shows:
- Installed / not installed status with version number
- **External link** — opens the tool's official docs or homepage in a new tab
- **UPDATE badge** — when `winget` detects a newer version is available
- **INSTALL button** (uninstalled tools with a winget ID) — streams `winget install` output live
- **UPDATE button** (installed tools with an update available) — streams `winget upgrade` output live
- Manual install note for tools not available via winget (e.g. Scoop: `irm get.scoop.sh | iex`)

**Header actions:**
- **SCAN** — re-detects all tools in parallel via `where <tool>` + `<tool> --version`
- **CHECK UPDATES** — runs `winget upgrade --include-unknown` and flags outdated tools

> Installing tools may require the server to be running as Administrator, depending on the tool.

---

---

## 🏢 Enterprise Debloat

Standalone PowerShell debloat CLI in `scripts/debloat/`. No installation, no cloning — runs from any Windows machine with a single one-liner. Scans the system first and only acts on what's actually present.

### Quick Start

Paste in any PowerShell window (UAC prompt appears automatically):

```powershell
powershell -ExecutionPolicy Bypass -Command "iwr 'https://raw.githubusercontent.com/Viniciusap/mybuild-stats/master/scripts/debloat/launcher.ps1' -OutFile 'C:\Windows\Temp\debloat.ps1' -UseBasicParsing; & 'C:\Windows\Temp\debloat.ps1'"
```

Downloads the scripts to `%TEMP%`, runs, cleans up. No install, no cloning required.

#### What you see

```
  +----------------------------------------------+
  | ENTERPRISE DEBLOAT TOOL  v1.0.0              |
  | Machine: YOUR-PC  Build: 26100               |
  +----------------------------------------------+

  [+] Running as Administrator

  Scanning system...
  10 modules loaded

  SYSTEM SCAN RESULTS
  [PRESENT   ]  Bloatware Apps
  [PRESENT   ]  Telemetry Services
  [NOT FOUND ]  OneDrive
  [NOT FOUND ]  Cortana
  ...

  SELECT MODULES TO APPLY
  [X]  1  Bloatware Apps          PRESENT
  [X]  2  Telemetry Services      PRESENT
  [ ]  3  OneDrive                NOT FOUND
  ...

  Toggle: numbers | [A] All present | [N] Clear | [Enter] Apply | [Q] Quit
```

Select modules by typing their numbers, press Enter to apply. A **reusable command** is printed at the end — copy it to run the same selection silently on other machines.

#### Preview mode (no writes)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\debloat\preview.ps1
```

---

### Silent / IT Admin Mode

Silent, scriptable deployment. Idempotent — safe to run repeatedly or push via GPO.

#### Enterprise / IT Admin — Local run

```powershell
# Interactive (same as Gamer Path — with GPO warnings per module)
powershell.exe -ExecutionPolicy Bypass -File scripts\debloat\enterprise.ps1

# Apply all present modules silently
powershell.exe -ExecutionPolicy Bypass -File scripts\debloat\enterprise.ps1 -NonInteractive -All

# Apply specific modules silently
powershell.exe -ExecutionPolicy Bypass -File scripts\debloat\enterprise.ps1 -NonInteractive -Modules "telemetry,cortana,bloatware"
```

#### One-liner (no cloning)

```powershell
# Interactive
powershell -ExecutionPolicy Bypass -Command "iwr 'https://raw.githubusercontent.com/Viniciusap/mybuild-stats/master/scripts/debloat/launcher.ps1' -OutFile 'C:\Windows\Temp\debloat.ps1' -UseBasicParsing; & 'C:\Windows\Temp\debloat.ps1'"

# Non-interactive, all present modules
powershell -ExecutionPolicy Bypass -Command "iwr '...\launcher.ps1' -OutFile 'C:\Windows\Temp\debloat.ps1' -UseBasicParsing; & 'C:\Windows\Temp\debloat.ps1' -NonInteractive -All"

# Non-interactive, specific modules
powershell -ExecutionPolicy Bypass -Command "iwr '...\launcher.ps1' -OutFile 'C:\Windows\Temp\debloat.ps1' -UseBasicParsing; & 'C:\Windows\Temp\debloat.ps1' -NonInteractive -Modules 'telemetry,cortana,bloatware'"
```

Replace `'...\launcher.ps1'` with the full raw GitHub URL shown above.

#### GPO Startup Script

Apply to all domain machines at login:

```
Computer Configuration → Windows Settings → Scripts → Startup
Script: powershell.exe
Arguments: -NoProfile -ExecutionPolicy Bypass -File \\server\share\scripts\debloat\enterprise.ps1 -NonInteractive -All
```

Or via a network share with the launcher:

```
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '\\server\share\scripts\debloat\launcher.ps1' -NonInteractive -All"
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `-NonInteractive` | Switch | Skip menus — requires `-All` or `-Modules` |
| `-All` | Switch | Apply all modules where system scan returns PRESENT |
| `-Modules` | String | Comma-separated module IDs to apply, e.g. `"telemetry,cortana"` |

### Full Module List

| ID | Module | Description | Risk | GPO Conflict |
|----|--------|-------------|------|-------------|
| `bloatware` | Bloatware Apps | Interactive sub-menu — removes only apps detected on the machine from a list of 33 consumer apps | Low | — |
| `telemetry` | Telemetry Services | Disables `DiagTrack`, `dmwappushservice`, sets `AllowTelemetry=0` | Low | — |
| `cortana` | Cortana | Sets `AllowCortana=0`, disables web search, removes Cortana AppX | Low | CortanaEnabled GPO |
| `onedrive` | OneDrive | Runs the built-in uninstaller, removes startup entry, blocks re-install via policy | Medium | SharePoint Sync GPO |
| `windows-ai` | Windows AI / Copilot | Removes Copilot/Recall/WindowsAI packages, enforces `DisableAIDataAnalysis=1` and `TurnOffWindowsCopilot=1` | Medium | WindowsAI GPO |
| `xbox-services` | Xbox Services | Sets `XblAuthManager`, `XblGameSave`, `XboxNetApiSvc`, `XboxGipSvc` to Disabled | Low | — |
| `teams-consumer` | Teams (Consumer) | Removes personal Teams AppX (preserves Teams Work/School), clears startup entry | Low | — |
| `edge-defaults` | Edge Defaults | Removes Edge from startup, disables news feed and first-run page | Low | Edge GPO policies |
| `privacy` | Privacy Settings | 16 registry keys: advertising ID, online speech, inking, activity history, location, Find My Device, delivery optimization | Low | Location/FindMyDevice MDM |
| `ui-tweaks` | UI / Taskbar Tweaks | Win10 context menu, widgets, Chat icon, Snap Layouts, search highlights, 365 ads, Game DVR, Task View | Low | — |

#### Audit log

Every run saves a JSON log to `C:\Debloat\logs\YYYY-MM-DD_HH-MM-SS.json`:

```json
{
  "machine": "CORP-PC-01",
  "user": "jdoe",
  "timestamp": "2026-06-03T14:22:01",
  "results": {
    "telemetry":  { "Status": "Changed", "Detail": "DiagTrack disabled, AllowTelemetry=0" },
    "cortana":    { "Status": "Changed", "Detail": "AllowCortana=0, web search disabled" },
    "bloatware":  { "Status": "Skipped", "Detail": "No bloatware found" }
  }
}
```

Status values: `Changed` · `Skipped` · `Failed`

#### Reusable command

After an interactive run, the tool prints a ready-to-use command with the exact modules you selected:

```
powershell -ExecutionPolicy Bypass -Command "iwr '...\launcher.ps1' -OutFile 'C:\Windows\Temp\debloat.ps1' -UseBasicParsing; & 'C:\Windows\Temp\debloat.ps1' -NonInteractive -Modules 'telemetry,cortana,bloatware'"
```

Copy and run on other machines without going through the menu again.

### Architecture

```
scripts/debloat/
├── enterprise.ps1       ← entry point (-NonInteractive, -All, -Modules)
├── launcher.ps1         ← downloads repo zip + runs enterprise.ps1 (no git required)
├── preview.ps1          ← dry run — shows what would change, no writes
├── core/
│   ├── AdminCheck.ps1   ← auto-elevates to Admin via UAC
│   ├── UI.ps1           ← ASCII box drawing, progress bar, color helpers
│   ├── Logger.ps1       ← writes JSON run log to C:\Debloat\logs\
│   └── Runner.ps1       ← menu, pre-check, apply loop helpers
└── modules/
    ├── bloatware.ps1
    ├── cortana.ps1
    ├── edge-defaults.ps1
    ├── onedrive.ps1
    ├── privacy.ps1
    ├── teams-consumer.ps1
    ├── telemetry.ps1
    ├── ui-tweaks.ps1
    ├── windows-ai.ps1
    └── xbox-services.ps1
```

Each module exports three functions (`Invoke-Check` / `Invoke-Apply` / `Invoke-Rollback`) and a `$ModuleMeta` hashtable. Adding a new module is a single `.ps1` file drop — no changes to `enterprise.ps1` needed.

---

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 (custom dark slate theme) |
| Hardware reads | `systeminformation` 5 |
| Data fetching (client) | SWR 2 |
| Scheduling | `node-cron` 3 |
| Icons | `lucide-react` |
| Image search | DuckDuckGo Images (no API key required) |
| Price search | Serper.dev Google Shopping (optional) |
| Storage | JSON files in `data/` (no native build tools required) |
| Process manager | PM2 (optional, for production) |

---

## Project Structure

```
mybuild-stats/
├── app/
│   ├── layout.tsx              # Root layout — TabNav + global styles
│   ├── page.tsx                # Main dashboard page
│   ├── automations/
│   │   └── page.tsx            # Automations tab
│   ├── tools/
│   │   └── page.tsx            # Tools tab — detect / install / update dev tools
│   └── api/
│       ├── hardware/           # GET — live hardware snapshot
│       ├── snapshot/           # POST — save snapshot to JSON
│       ├── prices/             # GET — cached price records + alerts
│       ├── prices/trigger/     # POST — force price check
│       ├── timeline/           # GET — build events
│       ├── component-image/    # GET status / POST fetch & cache image
│       ├── case-search/        # GET config / POST save / DELETE clear
│       ├── image-search/       # GET — DuckDuckGo image search proxy
│       ├── pc-photo/           # POST upload / DELETE clear
│       ├── automations/        # GET task list / POST run & stream
│       ├── automations/history/ # GET run history (?taskId=)
│       ├── tools/              # GET — detect installed tools + versions
│       ├── tools/updates/      # GET — winget upgrade parse → upgradeable IDs
│       └── tools/install/      # POST — stream winget install/upgrade
├── components/
│   ├── ComponentDash.tsx       # CPU / GPU / RAM / Storage cards + gauges
│   ├── Gauge.tsx               # SVG 270° speedometer
│   ├── TabNav.tsx              # Dashboard / Automations / Tools navigation
│   ├── LiveClock.tsx           # Real-time ticking clock
│   ├── ComparisonTable.tsx     # Upgrade & depreciation analysis
│   ├── UpgradeRadar.tsx        # Price tracking panel
│   ├── BuildTimeline.tsx       # Chronological build log
│   ├── CaseSearchCard.tsx      # Case image search / upload
│   ├── PcPhotoCard.tsx         # PC photo upload
│   ├── ImageSearchModal.tsx    # Component image picker modal
│   ├── PriceAlertBanner.tsx    # Price alert notifications
│   ├── GlowCard.tsx            # Base card with accent border
│   ├── NeonProgress.tsx        # Horizontal progress bar
│   └── StatBadge.tsx           # Online / warning / error badge
├── lib/
│   ├── styles.ts               # Shared Tailwind class constants (btn, badge, card, text, …)
│   ├── hardware.ts             # systeminformation wrapper → HardwareSnapshot
│   ├── automations.ts          # Task registry (id, command, args, requiresAdmin)
│   ├── automation-history.ts   # appendRun / readHistory — ring-buffer JSON persistence
│   ├── buildSpecs.ts           # formatBuildSpecs() — clipboard markdown
│   ├── prices.ts               # Serper.dev integration + price alert logic
│   ├── scheduler.ts            # node-cron 12h price check schedule
│   ├── db.ts                   # JSON file read/write helpers
│   ├── imageCache.ts           # DuckDuckGo search + image download/cache
│   └── utils.ts                # formatAge, formatBRL, getUpgradeTiming, inferRamBrand, …
├── data/
│   ├── upgrade-path.json       # ✏️  Edit per PC — purchase dates, prices, upgrade targets
│   ├── build-timeline.json     # ✏️  Edit per PC — build history events
│   ├── build-config.json       # Case name + hasImage flag (auto-managed)
│   ├── snapshots.json          # Hardware snapshots (auto-managed)
│   └── events.json             # Timeline events (auto-managed)
├── scripts/
│   ├── RemoveWindowsAi.ps1     # Bundled upstream script (zoicware/RemoveWindowsAI)
│   ├── run-remove-ai.ps1       # Idempotent wrapper — pre-check → COMPLIANT or EXECUTED
│   ├── automation-runs.json    # Run history, per machine (gitignored)
│   └── debloat/                # → see Debloat Scripts section
├── types/index.ts              # Shared TypeScript interfaces
├── instrumentation.ts          # Next.js startup hook — seed data + start scheduler
└── ecosystem.config.js         # PM2 production config
```

---

## Setup

### Requirements

- Node.js 18+
- Windows 10/11 (systeminformation reads WMI data)
- winget available in PATH (built into Windows 10 1809+)

### Install & Run

```bash
git clone <repo>
cd mybuild-stats

npm install

# Optional: add Serper.dev key for price tracking
cp .env.local.example .env.local
# Edit .env.local → SERPER_API_KEY=your_key_here

npm run dev
```

Open `http://localhost:3000`.

### Production (PM2)

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

### Running Tasks that Need Admin

Open a new terminal as Administrator before starting the server:

```
Right-click Windows Terminal → "Run as administrator"
cd C:\path\to\mybuild-stats
npm run dev
```

---

## Configuration (per PC)

Only two files need editing when moving to a new machine:

### `data/upgrade-path.json`

```jsonc
{
  "cpu": {
    "current": "AMD Ryzen 7 5700X",
    "purchaseDate": "2023-04-15",   // ISO date
    "purchasePrice": 1200,          // in BRL
    "socket": "AM4",
    "targets": [
      {
        "id": "ryzen-9-5900x",
        "name": "AMD Ryzen 9 5900X",
        "category": "cpu",
        "triggerPrice": 900,        // buy alert threshold
        "estimatedPrice": 1100,     // current market reference
        "performanceGain": 28,      // % vs current
        "stores": ["KaBuM", "Pichau"],
        "searchQuery": "AMD Ryzen 9 5900X",
        "notes": "12c/24t — AM4 ceiling"
      }
    ]
  },
  "gpu": { ... },
  "ram": { ... },
  "storage": { ... }
}
```

### `data/build-timeline.json`

```jsonc
[
  {
    "date": "2023-04-15",
    "component": "Ryzen 7 5700X",
    "eventType": "added",           // added | removed | upgraded | repaired | driver_update
    "notes": "Primary build",
    "price": 1200
  }
]
```

All other data (hardware reads, images, snapshots, prices) is handled automatically.

---

## Portability

Everything hardware-related is detected dynamically via `systeminformation` — CPU brand, GPU name, RAM part numbers, SSD model, motherboard, BIOS. Component image search queries are built from detected names, not hardcoded strings. The dashboard works on any Windows PC without code changes; only `data/upgrade-path.json` needs updating with your purchase history and upgrade targets.

---

## Roadmap

Planned features — roughly priority-ordered.

### Hardware & Monitoring

| Feature | Description |
|---------|-------------|
| **Temperature History Charts** | Line chart of CPU/GPU/SSD temps over time, sourced from periodic snapshots. Visualize thermals across sessions. |
| **Fan Speed Gauges** | Read RPM for all fans detected by `systeminformation`. Gauge + min/max history. |
| **Network Monitor** | Real-time bandwidth (upload/download Mbps), active adapters, ping to a configured host. |
| **Power Draw Estimator** | Estimate total system TDP from detected components + load %. Show monthly electricity cost in BRL. |
| **Component Health Score** | Composite 0–100 score per component: combines S.M.A.R.T status, temp zone, age, and driver freshness. Color-coded badge on each card. |

### Upgrade & Price Tracking

| Feature | Description |
|---------|-------------|
| **Price History Charts** | Line chart of price-over-time per upgrade target. See if a component is trending up or down. |
| **Amazon / Mercado Livre support** | Add stores beyond KaBuM / Pichau / Terabyte. Pluggable store adapters. |
| **Resale Value Estimator** | Pull used market prices from OLX / Mercado Livre to auto-fill resale value in the depreciation table. |
| **Upgrade Budget Planner** | Input monthly savings → auto-calculate how many months until you can afford each upgrade target at current prices. |

### Automations & System

| Feature | Description |
|---------|-------------|
| **Startup Programs Manager** | List all startup entries (registry + Task Scheduler). Toggle enable/disable per entry. |
| **Disk Cleanup Advisor** | Scan for largest folders, old Windows Update caches, duplicate files. One-click delete with size preview. |
| **Scheduled Automation Runs** | Set automations (DNS flush, TEMP clean, winget upgrade) to run on a cron schedule — not just manually. |
| **Windows Event Log Viewer** | Surface recent critical/error events from Event Viewer directly in the dashboard. |

### UX & Export

| Feature | Description |
|---------|-------------|
| **Performance Snapshot Diff** | Compare two snapshots side-by-side — see how temps or load changed between sessions. |
| **Export to PDF** | Generate a printable build report: specs, depreciation table, upgrade recommendations. |
| **Notification Center** | In-app notification feed for price alerts, temp warnings, and automation completions. Browser push notification support. |
| **Multi-PC Support** | Manage multiple machines from one dashboard. Switch between build profiles; each has its own `data/` directory. |
