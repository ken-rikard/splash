export interface ScraperConfig {
  schedule: string
  scheduleTimezone: string
  retry: {
    retries: number
    minTimeout: number
    maxTimeout: number
    factor: number
  }
  staleWindowMinutes: number
}

export function defaultConfig(): ScraperConfig {
  return {
    schedule: process.env.SCRAPE_SCHEDULE || '*/15 * * * *',
    scheduleTimezone: process.env.SCRAPE_SCHEDULE_TZ || 'UTC',
    retry: {
      retries: parseInt(process.env.SCRAPE_RETRIES ?? '3', 10),
      minTimeout: parseInt(process.env.SCRAPE_RETRY_MIN_TIMEOUT ?? '2000', 10),
      maxTimeout: parseInt(process.env.SCRAPE_RETRY_MAX_TIMEOUT ?? '60000', 10),
      factor: 2,
    },
    staleWindowMinutes: parseInt(process.env.SCRAPE_STALE_WINDOW_MINUTES ?? '30', 10),
  }
}

export function nveApiKey(): string | undefined {
  return process.env.NVE_API_KEY
}
