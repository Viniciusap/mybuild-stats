import { spawn } from 'node:child_process'
import { NextRequest, NextResponse } from 'next/server'
import { TOOLS } from '@/app/api/tools/route'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { toolId?: string; action?: 'install' | 'upgrade' }
  const tool = TOOLS.find((t) => t.id === body.toolId)

  if (!tool?.wingetId) {
    return NextResponse.json({ error: 'Tool not found or not installable via winget' }, { status: 400 })
  }

  const action = body.action === 'upgrade' ? 'upgrade' : 'install'
  const enc = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const send = (line: string) => {
        try { controller.enqueue(enc.encode(line + '\n')) } catch { /* closed */ }
      }

      const proc = spawn(
        'winget',
        [action, '--id', tool.wingetId!, '--accept-package-agreements', '--accept-source-agreements'],
        { shell: false, windowsHide: true, env: process.env },
      )

      let stdoutBuf = ''
      let stderrBuf = ''

      proc.stdout.on('data', (chunk: Buffer) => {
        stdoutBuf += chunk.toString()
        const lines = stdoutBuf.split('\n')
        stdoutBuf = lines.pop() ?? ''
        for (const l of lines) {
          const clean = l.replace(/\x1B\[[0-9;]*m/g, '').trimEnd()
          if (clean) send(clean)
        }
      })

      proc.stderr.on('data', (chunk: Buffer) => {
        stderrBuf += chunk.toString()
        const lines = stderrBuf.split('\n')
        stderrBuf = lines.pop() ?? ''
        for (const l of lines) {
          const clean = l.replace(/\x1B\[[0-9;]*m/g, '').trimEnd()
          if (clean) send(`[ERRO] ${clean}`)
        }
      })

      proc.on('close', (code) => {
        if (stdoutBuf.trim()) send(stdoutBuf.trim())
        if (stderrBuf.trim()) send(`[ERRO] ${stderrBuf.trim()}`)
        send(`__EXIT__${code ?? 1}`)
        try { controller.close() } catch { /* closed */ }
      })

      proc.on('error', (err) => {
        send(`[ERRO] ${err.message}`)
        send('__EXIT__1')
        try { controller.close() } catch { /* closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
