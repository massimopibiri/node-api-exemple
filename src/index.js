/* eslint no-console: 0 */

import server   from './server'
import { name } from '../package'

const PORT = process.env.PORT || 3000

server.start(PORT, () => console.log(`${name} listening on port ${PORT}`))
