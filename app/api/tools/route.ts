import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const execAsync = promisify(exec)

export interface ToolDef {
  id: string
  label: string
  description: string
  category: 'package-managers' | 'runtimes' | 'dev-tools'
  versionArgs: string[]
  link: string          // external docs/homepage for devs
  wingetId?: string     // package ID for winget install/upgrade
  installNote?: string  // shown when winget can't install
}

export const TOOLS: ToolDef[] = [
  // Package Managers
  { id: 'winget',  label: 'winget',      description: 'Windows Package Manager',      category: 'package-managers', versionArgs: ['--version'],  link: 'https://learn.microsoft.com/windows/package-manager/winget/',                                     installNote: 'Built into Windows 10+' },
  { id: 'choco',   label: 'Chocolatey',  description: 'Windows app installer',         category: 'package-managers', versionArgs: ['--version'],  link: 'https://chocolatey.org/',                   wingetId: 'Chocolatey.Chocolatey' },
  { id: 'scoop',   label: 'Scoop',       description: 'Command-line installer',        category: 'package-managers', versionArgs: ['--version'],  link: 'https://scoop.sh/',                                                                               installNote: 'irm get.scoop.sh | iex' },
  { id: 'npm',     label: 'npm',         description: 'Node package manager',          category: 'package-managers', versionArgs: ['--version'],  link: 'https://docs.npmjs.com/',                   wingetId: 'OpenJS.NodeJS',            installNote: 'Installs with Node.js' },
  { id: 'pnpm',    label: 'pnpm',        description: 'Fast npm alternative',          category: 'package-managers', versionArgs: ['--version'],  link: 'https://pnpm.io/',                          wingetId: 'pnpm.pnpm' },
  { id: 'yarn',    label: 'yarn',        description: 'Yarn package manager',          category: 'package-managers', versionArgs: ['--version'],  link: 'https://yarnpkg.com/',                      wingetId: 'Yarn.Yarn' },
  { id: 'bun',     label: 'Bun',         description: 'Fast JS runtime & pkg manager', category: 'package-managers', versionArgs: ['--version'],  link: 'https://bun.sh/',                           wingetId: 'Oven-sh.Bun' },
  { id: 'pip',     label: 'pip',         description: 'Python package installer',      category: 'package-managers', versionArgs: ['--version'],  link: 'https://pip.pypa.io/',                      wingetId: 'Python.Python.3',          installNote: 'Installs with Python' },
  { id: 'cargo',   label: 'cargo',       description: 'Rust package manager',          category: 'package-managers', versionArgs: ['--version'],  link: 'https://doc.rust-lang.org/cargo/',          wingetId: 'Rustlang.Rustup',          installNote: 'Installs with Rustup' },

  // Runtimes
  { id: 'node',    label: 'Node.js',     description: 'JavaScript runtime',            category: 'runtimes', versionArgs: ['--version'],  link: 'https://nodejs.org/',                       wingetId: 'OpenJS.NodeJS' },
  { id: 'deno',    label: 'Deno',        description: 'Secure JS/TS runtime',          category: 'runtimes', versionArgs: ['--version'],  link: 'https://deno.com/',                         wingetId: 'DenoLand.Deno' },
  { id: 'python',  label: 'Python',      description: 'Python runtime',                category: 'runtimes', versionArgs: ['--version'],  link: 'https://www.python.org/',                   wingetId: 'Python.Python.3' },
  { id: 'go',      label: 'Go',          description: 'Go language runtime',           category: 'runtimes', versionArgs: ['version'],    link: 'https://go.dev/',                           wingetId: 'GoLang.Go' },
  { id: 'dotnet',  label: '.NET',        description: '.NET runtime & SDK',            category: 'runtimes', versionArgs: ['--version'],  link: 'https://dotnet.microsoft.com/',             wingetId: 'Microsoft.DotNet.SDK.8' },
  { id: 'java',    label: 'Java',        description: 'Java runtime (JRE/JDK)',        category: 'runtimes', versionArgs: ['-version'],   link: 'https://adoptium.net/',                     wingetId: 'EclipseAdoptium.Temurin.21.JDK' },
  { id: 'rustc',   label: 'Rust',        description: 'Rust compiler',                 category: 'runtimes', versionArgs: ['--version'],  link: 'https://www.rust-lang.org/',                wingetId: 'Rustlang.Rustup',          installNote: 'Installs via Rustup' },

  // Dev Tools
  { id: 'git',       label: 'Git',        description: 'Version control',              category: 'dev-tools', versionArgs: ['--version'],               link: 'https://git-scm.com/',                              wingetId: 'Git.Git' },
  { id: 'gh',        label: 'GitHub CLI', description: 'GitHub command-line',          category: 'dev-tools', versionArgs: ['--version'],               link: 'https://cli.github.com/',                           wingetId: 'GitHub.cli' },
  { id: 'docker',    label: 'Docker',     description: 'Container platform',           category: 'dev-tools', versionArgs: ['--version'],               link: 'https://docs.docker.com/',                          wingetId: 'Docker.DockerDesktop' },
  { id: 'kubectl',   label: 'kubectl',    description: 'Kubernetes CLI',               category: 'dev-tools', versionArgs: ['version', '--client'],     link: 'https://kubernetes.io/docs/reference/kubectl/',      wingetId: 'Kubernetes.kubectl' },
  { id: 'curl',      label: 'curl',       description: 'HTTP/S client',                category: 'dev-tools', versionArgs: ['--version'],               link: 'https://curl.se/',                                                                 installNote: 'Built into Windows 10+' },
  { id: 'npx',       label: 'npx',        description: 'Node package runner',          category: 'dev-tools', versionArgs: ['--version'],               link: 'https://docs.npmjs.com/cli/commands/npx',           wingetId: 'OpenJS.NodeJS',     installNote: 'Installs with Node.js' },
  { id: 'az',        label: 'Azure CLI',  description: 'Microsoft Azure CLI',          category: 'dev-tools', versionArgs: ['--version'],               link: 'https://learn.microsoft.com/cli/azure/',            wingetId: 'Microsoft.AzureCLI' },
  { id: 'aws',       label: 'AWS CLI',    description: 'Amazon Web Services CLI',      category: 'dev-tools', versionArgs: ['--version'],               link: 'https://docs.aws.amazon.com/cli/',                  wingetId: 'Amazon.AWSCLI' },
  { id: 'terraform', label: 'Terraform',  description: 'Infrastructure as Code',       category: 'dev-tools', versionArgs: ['--version'],               link: 'https://developer.hashicorp.com/terraform/docs',    wingetId: 'Hashicorp.Terraform' },
  { id: 'make',      label: 'make',       description: 'Build automation tool',        category: 'dev-tools', versionArgs: ['--version'],               link: 'https://www.gnu.org/software/make/manual/',         wingetId: 'GnuWin32.Make' },
]

function extractVersion(output: string): string | null {
  const line = output.split('\n')[0].trim()
  const match = line.match(/(\d+\.\d+[\.\d]*)/)
  if (match) return match[1]
  if (line.length > 0) return line.slice(0, 40)
  return null
}

async function checkTool(def: ToolDef) {
  const { versionArgs, ...info } = def

  try {
    await execAsync(`where ${def.id}`, { timeout: 3000 })
  } catch {
    return { ...info, installed: false, version: null }
  }

  try {
    const { stdout, stderr } = await execAsync(
      `${def.id} ${versionArgs.join(' ')}`,
      { timeout: 5000 },
    )
    const version = extractVersion(stdout || stderr || '')
    return { ...info, installed: true, version }
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string }
    const version = extractVersion(err.stderr || err.stdout || '')
    return { ...info, installed: true, version }
  }
}

export async function GET() {
  const tools = await Promise.all(TOOLS.map(checkTool))
  return NextResponse.json({ tools })
}
