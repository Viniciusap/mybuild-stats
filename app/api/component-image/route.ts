import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { fetchAndCacheImage, searchDDGImages, searchSerperImages } from '@/lib/imageCache'
import { getLatestSnapshot } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const IMAGE_DIR = path.join(process.cwd(), 'public', 'component-images')
const COMPONENT_IDS = ['cpu', 'gpu', 'ram', 'storage']

// Build search queries from DETECTED hardware — works on any PC
function buildQueries(): Record<string, string> {
  const snap = getLatestSnapshot()
  const stick = snap?.ram.sticks[0]
  return {
    cpu: `${snap?.cpu.brand ?? 'processor'} processor product photo`,
    gpu: `${snap?.gpu[0]?.name ?? 'graphics card'} graphics card product photo`,
    ram: [stick?.partNum, stick?.type, stick?.speed ? `${stick.speed}MHz` : null, 'RAM memory module product photo']
      .filter(Boolean).join(' '),
    storage: `${snap?.storage[0]?.name ?? 'NVMe SSD'} SSD product photo`,
  }
}

function imgPath(id: string) { return path.join(IMAGE_DIR, `${id}.jpg`) }
function imgUrl(id: string) { return `/component-images/${id}.jpg` }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    const exists = fs.existsSync(imgPath(id))
    return NextResponse.json({ exists, path: exists ? imgUrl(id) : null })
  }

  const statuses: Record<string, string | null> = {}
  for (const key of COMPONENT_IDS) {
    statuses[key] = fs.existsSync(imgPath(key)) ? imgUrl(key) : null
  }
  return NextResponse.json(statuses)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { id: string; query?: string; imageUrl?: string }
    const { id, query, imageUrl } = body

    if (!COMPONENT_IDS.includes(id)) {
      return NextResponse.json({ error: 'Componente desconhecido' }, { status: 400 })
    }

    if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true })

    // Direct URL from user selection (modal)
    if (imageUrl) {
      const ok = await fetchAndCacheImage(imageUrl, imgPath(id))
      if (ok) return NextResponse.json({ ok: true, path: imgUrl(id) })
      return NextResponse.json({ error: 'Download da imagem falhou' }, { status: 400 })
    }

    // Auto-search using detected hardware names
    const searchQuery = query ?? buildQueries()[id] ?? id
    const apiKey = process.env.SERPER_API_KEY
    const results = apiKey
      ? await searchSerperImages(searchQuery, apiKey, 8)
      : await searchDDGImages(searchQuery, 8)

    for (const img of results) {
      if (!img.imageUrl) continue
      const ok = await fetchAndCacheImage(img.imageUrl, imgPath(id))
      if (ok) return NextResponse.json({ ok: true, path: imgUrl(id) })
    }

    return NextResponse.json({ error: 'No image available for download' }, { status: 404 })
  } catch (err) {
    console.error('[api/component-image]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (id) {
    const p = imgPath(id)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  } else {
    for (const key of COMPONENT_IDS) {
      const p = imgPath(key)
      if (fs.existsSync(p)) fs.unlinkSync(p)
    }
  }
  return NextResponse.json({ ok: true })
}
