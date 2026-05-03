import cron from 'node-cron'
import { checkAllTargetPrices } from '@/lib/prices'

let started = false

export function startScheduler() {
  if (started) return
  started = true

  const intervalHours = parseInt(process.env.PRICE_CHECK_INTERVAL_HOURS ?? '12', 10)
  const cronExpr = `0 */${intervalHours} * * *`

  console.log(`[scheduler] Price check scheduled: every ${intervalHours}h (${cronExpr})`)

  cron.schedule(cronExpr, async () => {
    console.log('[scheduler] Running scheduled price check…')
    try {
      await checkAllTargetPrices()
    } catch (err) {
      console.error('[scheduler] Price check failed:', err)
    }
  })
}
