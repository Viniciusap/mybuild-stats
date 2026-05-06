import fs from 'node:fs/promises'
import path from 'node:path'

const HISTORY_FILE = path.join(process.cwd(), 'scripts', 'automation-runs.json')
const MAX_PER_TASK = 50

export interface RunEntry {
  taskId: string
  startedAt: string
  endedAt: string
  durationMs: number
  status: 'done' | 'error' | 'compliant' | 'executed'
  exitCode: number
  lineCount: number
}

export async function appendRun(entry: RunEntry): Promise<void> {
  let data: { runs: RunEntry[] } = { runs: [] }
  try {
    const raw = await fs.readFile(HISTORY_FILE, 'utf8')
    data = JSON.parse(raw)
  } catch { /* file doesn't exist yet */ }

  data.runs.push(entry)

  const byTask = new Map<string, RunEntry[]>()
  for (const r of data.runs) {
    const arr = byTask.get(r.taskId) ?? []
    arr.push(r)
    byTask.set(r.taskId, arr)
  }

  const trimmed: RunEntry[] = []
  byTask.forEach((arr) => {
    trimmed.push(...arr.slice(-MAX_PER_TASK))
  })
  trimmed.sort((a, b) => a.startedAt.localeCompare(b.startedAt))

  await fs.writeFile(HISTORY_FILE, JSON.stringify({ runs: trimmed }, null, 2), 'utf8')
}

export async function readHistory(taskId?: string): Promise<RunEntry[]> {
  try {
    const raw = await fs.readFile(HISTORY_FILE, 'utf8')
    const data = JSON.parse(raw) as { runs: RunEntry[] }
    return taskId ? data.runs.filter(r => r.taskId === taskId) : data.runs
  } catch {
    return []
  }
}
