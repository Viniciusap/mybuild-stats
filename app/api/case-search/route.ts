import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { fetchAndCacheImage, searchDDGImages, searchSerperImages } from '@/lib/imageCache'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CONFIG_PATH = path.join(process.cwd(), 'data', 'build-config.json')
const CASE_IMAGE_PATH = path.join(process.cwd(), 'public', 'case-image.jpg')

interface BuildConfig { case: { name: string; hasImage: boolean } }

function readConfig(): BuildConfig {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as BuildConfig }
  catch { return { case: { name: '', hasImage: false } } }
}

function writeConfig(cfg: BuildConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (q) {
    const apiKey = process.env.SERPER_API_KEY
    // DDG first (no key needed), Serper if available
    const results = apiKey
      ? await searchSerperImages(`${q} PC case gaming product photo`, apiKey, 6)
      : await searchDDGImages(`${q} PC case gabinete gaming product photo`, 6)

    return NextResponse.json({
      images: results.map((r) => ({
        imageUrl: r.imageUrl,
        thumbnailUrl: r.thumbnailUrl || r.imageUrl,
        title: r.title,
      })),
    })
  }

  const config = readConfig()
  return NextResponse.json({
    name: config.case.name,
    hasImage: config.case.hasImage && fs.existsSync(CASE_IMAGE_PATH),
  })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; imageUrl?: string }
    const config = readConfig()

    if (body.name !== undefined) config.case.name = body.name

    if (body.imageUrl) {
      const ok = await fetchAndCacheImage(body.imageUrl, CASE_IMAGE_PATH)
      if (!ok) return NextResponse.json({ error: 'Download falhou' }, { status: 400 })
      config.case.hasImage = true
    }

    writeConfig(config)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/case-search POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE() {
  if (fs.existsSync(CASE_IMAGE_PATH)) fs.unlinkSync(CASE_IMAGE_PATH)
  writeConfig({ case: { name: '', hasImage: false } })
  return NextResponse.json({ ok: true })
}
