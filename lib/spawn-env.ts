// Strip app-level secrets from the env passed to child processes.
// System vars (PATH, SystemRoot, TEMP, etc.) are preserved so commands still work.
const APP_SECRETS = ['SERPER_API_KEY', 'NTFY_TOPIC', 'PRICE_CHECK_INTERVAL_HOURS']

export function safeSpawnEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  for (const key of APP_SECRETS) delete env[key]
  return env
}
