import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_METHODS = new Set(['POST', 'DELETE', 'PUT', 'PATCH'])

const PROTECTED_PREFIXES = [
  '/api/automations',
  '/api/prices/trigger',
  '/api/pc-photo',
  '/api/component-image',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const method = req.method
  const requestId = crypto.randomUUID()

  console.log(`[${new Date().toISOString()}] ${method} ${pathname} (${requestId})`)

  const secret = process.env.API_SECRET
  if (
    secret &&
    PROTECTED_METHODS.has(method) &&
    PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  ) {
    const key = req.headers.get('x-api-key')
    if (key !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const res = NextResponse.next()
  res.headers.set('X-Request-Id', requestId)
  return res
}

export const config = {
  matcher: '/api/:path*',
}
