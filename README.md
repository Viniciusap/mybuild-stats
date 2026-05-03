# MyBuild Stats

A local, self-hosted hardware dashboard for Windows. Monitors your PC in real time, tracks component depreciation, watches upgrade prices, and runs system maintenance tasks — all from a cyberpunk-themed web UI.

---

## Purpose

MyBuild Stats is a personal command center for PC enthusiasts who want more than Task Manager. It reads live hardware data, helps you decide *when* to upgrade (not just *what* to upgrade to), tracks component resale value over time, and keeps your system healthy through one-click automations — no cloud, no account, no telemetry.

---

## Features

### Hardware Dashboard

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

Upload or search for a photo of your case or full build. Displayed with a cyberpunk scanline overlay and corner-bracket decoration. Replaces or removes at any time.

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

> **Admin tasks:** Start the dev server (or PM2) from an Administrator terminal. The process running `npm run dev` needs elevation — there is no UAC prompt from within the app. Tasks that fail due to insufficient privileges will show the error output in the log panel.

Each task card shows an estimated duration, an ADMIN badge where applicable, and DONE / ERROR status with exit code after completion.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 (custom cyberpunk theme) |
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
│       └── automations/        # GET task list / POST run & stream
├── components/
│   ├── ComponentDash.tsx       # CPU / GPU / RAM / Storage cards + gauges
│   ├── Gauge.tsx               # SVG 270° speedometer
│   ├── TabNav.tsx              # Dashboard / Automations navigation
│   ├── LiveClock.tsx           # Real-time ticking clock
│   ├── ComparisonTable.tsx     # Upgrade & depreciation analysis
│   ├── UpgradeRadar.tsx        # Price tracking panel
│   ├── BuildTimeline.tsx       # Chronological build log
│   ├── CaseSearchCard.tsx      # Case image search / upload
│   ├── PcPhotoCard.tsx         # PC photo upload
│   ├── ImageSearchModal.tsx    # Component image picker modal
│   ├── PriceAlertBanner.tsx    # Price alert notifications
│   ├── GlowCard.tsx            # Base card with neon glow accent
│   ├── NeonProgress.tsx        # Horizontal progress bar
│   └── StatBadge.tsx           # Online / warning / error badge
├── lib/
│   ├── hardware.ts             # systeminformation wrapper → HardwareSnapshot
│   ├── automations.ts          # Task registry (id, command, args, requiresAdmin)
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
├── types/index.ts              # Shared TypeScript interfaces
├── instrumentation.ts          # Next.js startup hook — seed data + start scheduler
└── ecosystem.config.js         # PM2 production config
```

---

## Setup

### Requirements

- Node.js 18+
- Windows 10/11 (systeminformation reads WMI data)
- winget, dism, sfc available in PATH (built into Windows 10 1809+)

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

### Running Automations that Need Admin

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
| **Theme Switcher** | Toggle between cyberpunk (default), dark-minimal, and light mode. |
| **Multi-PC Support** | Manage multiple machines from one dashboard. Switch between build profiles; each has its own `data/` directory. |
