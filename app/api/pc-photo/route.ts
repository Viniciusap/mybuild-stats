import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PHOTO_PATH = path.join(process.cwd(), 'public', 'pc-photo.jpg')

export async function GET() {
  const exists = fs.existsSync(PHOTO_PATH)
  return NextResponse.json({ exists })
}

const MAX_PHOTO_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
    if (file.size > MAX_PHOTO_SIZE) return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 413 })
    if (!ALLOWED_MIME.includes(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 415 })

    const buffer = Buffer.from(await file.arrayBuffer())

    const publicDir = path.join(process.cwd(), 'public')
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })

    fs.writeFileSync(PHOTO_PATH, buffer)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/pc-photo POST]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    if (fs.existsSync(PHOTO_PATH)) fs.unlinkSync(PHOTO_PATH)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
