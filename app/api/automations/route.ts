import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'node:child_process'
import { AUTOMATION_TASKS } from '@/lib/automations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ tasks: AUTOMATION_TASKS.map(({ id, label, description, requiresAdmin, estimatedSeconds }) => ({ id, label, description, requiresAdmin, estimatedSeconds })) })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { id?: string }
  const task = AUTOMATION_TASKS.find((t) => t.id === body.id)

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const enc = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const proc = spawn(task.command, task.args, {
        shell: false,
        windowsHide: true,
        env: process.env,
      })

      const send = (line: string) => {
        try {
          controller.enqueue(enc.encode(line + '\n'))
        } catch { /* stream closed */ }
      }

      let stdoutBuf = ''
      let stderrBuf = ''

      proc.stdout.on('data', (chunk: Buffer) => {
        stdoutBuf += chunk.toString('utf8')
        const lines = stdoutBuf.split(/\r?\n/)
        stdoutBuf = lines.pop() ?? ''
        for (const l of lines) send(l)
      })

      proc.stderr.on('data', (chunk: Buffer) => {
        stderrBuf += chunk.toString('utf8')
        const lines = stderrBuf.split(/\r?\n/)
        stderrBuf = lines.pop() ?? ''
        for (const l of lines) send(`[ERRO] ${l}`)
      })

      proc.on('close', (code) => {
        if (stdoutBuf) send(stdoutBuf)
        if (stderrBuf) send(`[ERRO] ${stderrBuf}`)
        send(`__EXIT__${code ?? -1}`)
        try { controller.close() } catch { /* already closed */ }
      })

      proc.on('error', (err) => {
        send(`[ERRO] Falha ao iniciar processo: ${err.message}`)
        send(`__EXIT__-1`)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
