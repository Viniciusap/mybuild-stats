import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'node:child_process'
import { AUTOMATION_TASKS } from '@/lib/automations'
import { appendRun, type RunEntry } from '@/lib/automation-history'
import { safeSpawnEnv } from '@/lib/spawn-env'

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
  const startedAt = new Date().toISOString()

  const stream = new ReadableStream({
    start(controller) {
      const proc = spawn(task.command, task.args, {
        shell: false,
        windowsHide: true,
        env: safeSpawnEnv(),
      })

      const send = (line: string) => {
        try {
          controller.enqueue(enc.encode(line + '\n'))
        } catch { /* stream closed */ }
      }

      let stdoutBuf = ''
      let stderrBuf = ''
      let lineCount = 0
      let finalStatus: RunEntry['status'] | null = null

      proc.stdout.on('data', (chunk: Buffer) => {
        stdoutBuf += chunk.toString('utf8')
        const lines = stdoutBuf.split(/\r?\n/)
        stdoutBuf = lines.pop() ?? ''
        for (const l of lines) {
          lineCount++
          if (l === '__STATUS__COMPLIANT') finalStatus = 'compliant'
          else if (l === '__STATUS__EXECUTED') finalStatus = 'executed'
          send(l)
        }
      })

      proc.stderr.on('data', (chunk: Buffer) => {
        stderrBuf += chunk.toString('utf8')
        const lines = stderrBuf.split(/\r?\n/)
        stderrBuf = lines.pop() ?? ''
        for (const l of lines) {
          lineCount++
          send(`[ERRO] ${l}`)
        }
      })

      proc.on('close', (code) => {
        if (stdoutBuf) { lineCount++; send(stdoutBuf) }
        if (stderrBuf) { lineCount++; send(`[ERRO] ${stderrBuf}`) }

        const exitCode = code ?? -1
        const endedAt = new Date().toISOString()
        const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime()

        const status: RunEntry['status'] =
          finalStatus ?? (exitCode === 0 ? 'done' : 'error')

        void appendRun({ taskId: task.id, startedAt, endedAt, durationMs, status, exitCode, lineCount })

        send(`__EXIT__${exitCode}`)
        try { controller.close() } catch { /* already closed */ }
      })

      proc.on('error', (err) => {
        const endedAt = new Date().toISOString()
        const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime()
        void appendRun({ taskId: task.id, startedAt, endedAt, durationMs, status: 'error', exitCode: -1, lineCount })

        console.error('[api/automations] spawn error:', err.message)
        send(`[ERRO] Falha ao iniciar processo`)
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
