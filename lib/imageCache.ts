import fs from 'fs'
import path from 'path'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// ─── DuckDuckGo image search (no API key required) ───────────────────────────

async function getDDGToken(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) }
    )
    const html = await res.text()
    // vqd token appears in several formats depending on DDG version
    const m =
      html.match(/vqd=(["\'])([^"']+)\1/) ||
      html.match(/"vqd"\s*:\s*"([^"]+)"/) ||
      html.match(/vqd=([\d-]+)/)
    return m ? (m[2] ?? m[1]) : null
  } catch {
    return null
  }
}

export async function searchDDGImages(
  query: string,
  num = 6
): Promise<Array<{ imageUrl: string; thumbnailUrl: string; title: string }>> {
  try {
    const vqd = await getDDGToken(query)
    if (!vqd) return []

    const params = new URLSearchParams({
      l: 'wt-wt',
      o: 'json',
      q: query,
      vqd,
      p: '-1',
      f: ',,,,,',
    })

    const res = await fetch(`https://duckduckgo.com/i.js?${params}`, {
      headers: {
        'User-Agent': UA,
        Referer: 'https://duckduckgo.com/',
        Accept: 'application/json, text/javascript',
      },
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) return []

    const data = (await res.json()) as {
      results?: Array<{ image: string; thumbnail: string; title: string }>
    }
    return (data.results ?? [])
      .slice(0, num)
      .filter((r) => r.image)
      .map((r) => ({
        imageUrl: r.image,
        thumbnailUrl: r.thumbnail || r.image,
        title: r.title || query,
      }))
  } catch {
    return []
  }
}

// ─── Serper fallback (if API key is configured) ───────────────────────────────

export async function fetchAndCacheImage(url: string, localPath: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) return false

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('image') && !contentType.includes('octet-stream')) return false

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 2048) return false // too small — likely not a real image

    const dir = path.dirname(localPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(localPath, buffer)
    return true
  } catch {
    return false
  }
}

export async function searchSerperImages(
  query: string,
  apiKey: string,
  num = 6
): Promise<Array<{ imageUrl: string; thumbnailUrl: string; title: string; source: string }>> {
  try {
    const res = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, gl: 'br', hl: 'pt-br', num }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as {
      images?: Array<{ imageUrl: string; thumbnailUrl: string; title: string; source: string }>
    }
    return data.images ?? []
  } catch {
    return []
  }
}
