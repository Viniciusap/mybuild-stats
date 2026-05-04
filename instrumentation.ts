export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('./lib/scheduler')
    const { seedBuildEvents, getLatestSnapshot } = await import('./lib/db')
    const buildTimeline = await import('./data/build-timeline.json')

    // Seed static build events on first run
    seedBuildEvents(
      (buildTimeline.default as Array<{
        date: string
        component: string
        eventType: string
        notes: string
        price?: number
      }>).map((e) => ({
        date: e.date,
        component: e.component,
        eventType: e.eventType as 'added' | 'removed' | 'upgraded' | 'repaired' | 'driver_update',
        notes: e.notes,
        price: e.price,
      }))
    )

    // Auto-snapshot on startup if no recent snapshot exists
    const latest = getLatestSnapshot()
    const isStale =
      !latest ||
      Date.now() - new Date(latest.timestamp).getTime() > 60 * 60 * 1000

    if (isStale) {
      void (async () => {
        try {
          const { collectHardwareInfo } = await import('./lib/hardware')
          const { saveSnapshot } = await import('./lib/db')
          const snapshot = await collectHardwareInfo()
          saveSnapshot(snapshot)
          console.log('[startup] Hardware snapshot saved.')
        } catch (err) {
          console.error('[startup] Snapshot failed:', err)
        }
      })()
    }

    startScheduler()
  }
}
