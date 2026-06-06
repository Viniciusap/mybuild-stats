import type { UpgradeTarget, PriceRecord, PriceAlert } from '@/types'
import upgradePath from '@/data/upgrade-path.json'
import { savePriceRecord, getLatestPrices } from '@/lib/db'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface KabumProduct {
  name: string
  price: number
  available: boolean
  code: string
}

const STORES: Record<string, { name: string; searchUrl: (q: string) => string; directFetch: boolean }> = {
  'kabum.com.br': {
    name: 'KaBuM',
    searchUrl: q => `https://www.kabum.com.br/busca/${toSlug(q)}`,
    directFetch: true,
  },
  'pichau.com.br': {
    name: 'Pichau',
    searchUrl: q => `https://www.pichau.com.br/?q=${encodeURIComponent(q)}`,
    directFetch: false,  // 403 Cloudflare
  },
  'terabyteshop.com.br': {
    name: 'Terabyte Shop',
    searchUrl: q => `https://www.terabyteshop.com.br/busca?str=${encodeURIComponent(q)}`,
    directFetch: false,  // 403 Cloudflare
  },
}

// ─── Slug / text helpers ──────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 -]/g, ' ')
    .trim().replace(/\s+/g, '-')
}

function normalizeStr(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

// Split into meaningful tokens (skip stopwords + single chars)
function toTokens(name: string): string[] {
  const SKIP = new Set(['de', 'da', 'do', 'em', 'e', 'a', 'o', 'com', 'para', 'the', 'and', 'of'])
  return normalizeStr(name).split(' ').filter(t => t.length >= 2 && !SKIP.has(t))
}

// Match a single token against a normalised product name string.
// Rule:
//   - Token must not be preceded by an alphanumeric character (word start).
//   - If token ends with a LETTER → also require no alphanumeric after it
//     (prevents "5900x" matching "5900xt", "rtx" matching "rtx5070").
//   - If token ends with a DIGIT  → allow alphanumeric suffix
//     (allows "gen4" to match "gen4x4", "ddr4" to match "ddr4cl16").
function tokenInName(token: string, normProduct: string): boolean {
  const endsLetter = /[a-z]$/.test(token)
  const pattern = endsLetter
    ? `(?<![a-z0-9])${token}(?![a-z0-9])`
    : `(?<![a-z0-9])${token}`
  return new RegExp(pattern).test(normProduct)
}

// Tokens containing digits are model/spec identifiers — they MUST match exactly.
// Pure-word tokens (brand, category) need 75% match.
function isRequiredToken(token: string): boolean {
  return /\d/.test(token)
}

// ─── KaBuM __NEXT_DATA__ fetcher ─────────────────────────────────────────────

async function fetchKabumProducts(searchQuery: string): Promise<KabumProduct[]> {
  const url = `https://www.kabum.com.br/busca/${toSlug(searchQuery)}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'pt-BR,pt;q=0.9' },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return []
    const html = await res.text()

    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!m) return []

    const nextData = JSON.parse(m[1])
    const products: KabumProduct[] = nextData?.props?.pageProps?.data?.catalogServer?.data ?? []
    return products.filter(p => p.available && p.price > 0)
  } catch {
    return []
  }
}

// Find best-matching products and return the cheapest.
// Rules:
//   - All required tokens (containing digits) MUST match — no exceptions.
//   - At least 75% of optional tokens (pure words) must match.
function findCheapestMatch(targetName: string, products: KabumProduct[]): KabumProduct | null {
  const tokens = toTokens(targetName)
  const required = tokens.filter(isRequiredToken)
  const optional = tokens.filter(t => !isRequiredToken(t))

  const matches = products
    .filter(p => p.available && p.price > 0)
    .filter(p => {
      const norm = normalizeStr(p.name)
      if (!required.every(t => tokenInName(t, norm))) return false
      if (optional.length === 0) return true
      return optional.filter(t => tokenInName(t, norm)).length / optional.length >= 0.75
    })
    .sort((a, b) => a.price - b.price)

  if (matches.length === 0) return null

  const best = matches[0]
  console.log(`[prices] "${targetName}" → "${best.name.slice(0, 60)}" R$${best.price} (${matches.length} match(es))`)
  return best
}

// ─── Per-target fetch ─────────────────────────────────────────────────────────

async function fetchPricesForTarget(target: UpgradeTarget): Promise<PriceRecord[]> {
  const records: PriceRecord[] = []
  const now = new Date().toISOString()

  for (const [domain, store] of Object.entries(STORES)) {
    if (!store.directFetch) {
      console.log(`[prices] ${target.name} @ ${store.name}: skipped (WAF blocked)`)
      await new Promise(r => setTimeout(r, 300))
      continue
    }

    const products = await fetchKabumProducts(target.searchQuery)

    if (products.length === 0) {
      console.log(`[prices] ${target.name} @ ${store.name}: no products returned`)
      await new Promise(r => setTimeout(r, 1500))
      continue
    }

    const match = findCheapestMatch(target.name, products)

    if (match) {
      records.push({
        componentId: target.id,
        componentName: target.name,
        store: store.name,
        price: match.price,
        url: store.searchUrl(target.searchQuery),
        timestamp: now,
      })
    } else {
      console.log(`[prices] ${target.name} @ ${store.name}: no match (${products.length} products checked)`)
    }

    await new Promise(r => setTimeout(r, 2000))
  }

  return records
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function checkAllTargetPrices(): Promise<void> {
  const allTargets = [
    ...upgradePath.cpu.targets,
    ...upgradePath.gpu.targets,
    ...upgradePath.ram.targets,
    ...upgradePath.storage.targets,
  ] as UpgradeTarget[]

  console.log(`[prices] Checking ${allTargets.length} targets via KaBuM __NEXT_DATA__…`)

  for (const target of allTargets) {
    const records = await fetchPricesForTarget(target)
    for (const record of records) savePriceRecord(record)
    console.log(`[prices] ${target.name}: ${records.length} price(s) saved`)
    await new Promise(r => setTimeout(r, 1500))
  }

  console.log('[prices] Done.')
}

export function buildPriceAlerts(): PriceAlert[] {
  const allTargets = [
    ...upgradePath.cpu.targets,
    ...upgradePath.gpu.targets,
    ...upgradePath.ram.targets,
    ...upgradePath.storage.targets,
  ] as UpgradeTarget[]

  const latestPrices = getLatestPrices()
  const alerts: PriceAlert[] = []

  for (const target of allTargets) {
    const prices = latestPrices.filter(p => p.componentId === target.id)
    if (prices.length === 0) continue

    const cheapest = prices.reduce((a, b) => (a.price < b.price ? a : b))
    const discountPercent = Math.round(
      ((target.estimatedPrice - cheapest.price) / target.estimatedPrice) * 100
    )
    const isBelowTrigger = cheapest.price <= target.triggerPrice

    if (discountPercent >= 10 || isBelowTrigger) {
      alerts.push({
        target,
        currentPrice: cheapest.price,
        store: cheapest.store,
        url: cheapest.url,
        discountPercent,
        isBelowTrigger,
      })
    }
  }

  return alerts.sort((a, b) => b.discountPercent - a.discountPercent)
}
