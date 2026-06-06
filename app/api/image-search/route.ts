import { NextResponse } from 'next/server'
import { searchDDGImages, searchSerperImages } from '@/lib/imageCache'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  if (!q?.trim()) return NextResponse.json({ images: [] })
  if (q.length > 200) return NextResponse.json({ error: 'Query too long' }, { status: 400 })

  const apiKey = process.env.SERPER_API_KEY
  const results = apiKey
    ? await searchSerperImages(q, apiKey, 9)
    : await searchDDGImages(q, 9)

  return NextResponse.json({
    images: results.map((r) => ({
      imageUrl: r.imageUrl,
      thumbnailUrl: r.thumbnailUrl || r.imageUrl,
      title: r.title,
    })),
  })
}
