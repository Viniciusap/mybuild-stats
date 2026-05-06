import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const execAsync = promisify(exec)

function parseUpgradeableIds(output: string): string[] {
  const lines = output.split(/\r?\n/)

  let headerIdx = -1
  let idStart = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes('Id') && line.includes('Version') && line.includes('Available')) {
      headerIdx = i
      idStart = line.indexOf('Id')
      break
    }
  }

  if (headerIdx === -1 || idStart < 0) return []

  const ids: string[] = []

  for (let i = headerIdx + 2; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    // summary line ("N upgrade(s) available")
    if (/^\d+\s+\w+/.test(line.trim())) break
    // separator
    if (line.trim().startsWith('-')) continue
    // extract the token at the Id column position
    if (line.length <= idStart) continue
    const match = line.slice(idStart).match(/^(\S+)/)
    if (match) ids.push(match[1].toLowerCase())
  }

  return ids
}

export async function GET() {
  try {
    const { stdout } = await execAsync('winget upgrade --include-unknown', { timeout: 30000 })
    return NextResponse.json({ upgradeable: parseUpgradeableIds(stdout) })
  } catch (e) {
    const err = e as { stdout?: string }
    if (err.stdout) {
      return NextResponse.json({ upgradeable: parseUpgradeableIds(err.stdout) })
    }
    return NextResponse.json({ upgradeable: [], error: 'winget unavailable' })
  }
}
