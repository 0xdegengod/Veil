import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './env.ts'
import { sessionContext, requireSession } from './middleware/session.ts'
import { auth } from './routes/auth.ts'
import { registerDashboardRoutes } from './routes/dashboard.ts'
import { registerExpenseRoutes } from './routes/expenses.ts'
import { groups } from './routes/groups.ts'
import { invites, publicInvites } from './routes/invites.ts'
import { notifications } from './routes/notifications.ts'
import { profiles } from './routes/profiles.ts'
import type { AppEnv } from './types.ts'

const app = new Hono<AppEnv>()

app.use('*', logger())
app.use('*', sessionContext)
app.use(
  '*',
  cors({
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

app.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/auth', auth)
app.route('/invites', publicInvites)

const protectedApp = new Hono<AppEnv>()
protectedApp.use('*', requireSession)
protectedApp.route('/profiles', profiles)
protectedApp.route('/groups', groups)
protectedApp.route('/invites', invites)
protectedApp.route('/notifications', notifications)
registerExpenseRoutes(protectedApp)
registerDashboardRoutes(protectedApp)

app.route('/', protectedApp)

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Veil backend listening on http://localhost:${info.port}`)
})
