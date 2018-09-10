import express        from 'express'
import morgan         from 'morgan'
import bodyParser     from 'body-parser'
import http           from 'http'
import cors           from 'cors'
import StatusMonitor  from 'express-status-monitor'

import router         from './routes'
import { getEnv }     from '../utils'

import {
  RenderJsonApiMiddleware,
  ContentTypeMiddleware,
  ErrorHandlerMiddleware,
  NotFoundMiddleware,
} from '../lib/middleware'

// Create Express server
const app = express()
const server = http.createServer(app)

// Express configuration
app.use(bodyParser.json())
app.use(bodyParser.json({ type: 'application/*+json' }))

// CORS
app.use(cors({ origin: getEnv('ORIGIN') }))

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'))

// For security purpose, remove leaked server information
app.disable('x-powered-by')

app.use(ContentTypeMiddleware(/application\/(.+\+)?json/))
app.use(RenderJsonApiMiddleware)

// Load all routes in the app
router(app)

// Provide a basic default server monitoring on /status
app.use(StatusMonitor({ websocket: server }))


// NotFound middleware must be placed after all routes to catch unresolved
// requests and right before the ErrorHandler middleware.
app.use(NotFoundMiddleware)

// Error Handling must be called last
app.use(ErrorHandlerMiddleware)

export default {
  start: (port, callback) => server.listen(port, callback),
  stop: callback => server.close(callback),
}
