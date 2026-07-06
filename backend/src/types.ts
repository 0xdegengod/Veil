import type { Hono } from 'hono'

export type AppEnv = {
  Variables: {
    wallet: string | null
  }
}

export type AppHono = Hono<AppEnv>
