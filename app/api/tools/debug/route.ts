import { spawn } from 'node:child_process'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function probeSpawn(cmd: string, args: string[]): Promise<{ out: string; err?: string }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { shell: false, windowsHide: true })
    let out = ''
    proc.stdout?.on('data', (d: Buffer) => { out += d.toString() })
    proc.stderr?.on('data', (d: Buffer) => { out += d.toString() })
    proc.on('close', (code) => resolve({ out: out.trim(), err: code ? `exit ${code}` : undefined }))
    proc.on('error', (e) => resolve({ out: '', err: e.message }))
  })
}

function probePowerShell(cmd: string): Promise<{ out: string; err?: string }> {
  return new Promise((resolve) => {
    const proc = spawn('powershell.exe', ['-NonInteractive', '-NoProfile', '-Command', cmd], { shell: false, windowsHide: true })
    let out = ''
    proc.stdout?.on('data', (d: Buffer) => { out += d.toString() })
    proc.stderr?.on('data', (d: Buffer) => { out += d.toString() })
    proc.on('close', (code) => resolve({ out: out.trim(), err: code ? `exit ${code}` : undefined }))
    proc.on('error', (e) => resolve({ out: '', err: e.message }))
  })
}

export async function GET() {
  const [nodeSpawn, npmSpawn, gitSpawn, nodePwsh, npmPwsh, gitPwsh] = await Promise.all([
    probeSpawn('node', ['--version']),
    probeSpawn('npm',  ['--version']),
    probeSpawn('git',  ['--version']),
    probePowerShell('node --version'),
    probePowerShell('npm --version'),
    probePowerShell('git --version'),
  ])

  return NextResponse.json({
    ...(process.env.NODE_ENV !== 'production' && {
      PATH_first10: process.env.PATH?.split(';').slice(0, 10),
    }),
    spawn_direct: { node: nodeSpawn, npm: npmSpawn, git: gitSpawn },
    spawn_powershell: { node: nodePwsh, npm: npmPwsh, git: gitPwsh },
  })
}
