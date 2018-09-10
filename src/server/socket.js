import sio        from 'socket.io'
import sioJWT     from 'socketio-jwt'
import { getEnv } from '../utils'

/* istanbul ignore next */
const timeout = process.env.NODE_ENV === 'test' ? 2000 : 15000
/*
const authorize = sioJWT.authorize({
  secret: getEnv('SECRET'),
  handshake: false, // For Security purposes
  callback: false,
  timeout,
})
*/
let websocket

export default {
  start: server => {
    websocket = sio(server)

    // add authorization for jwt-passport when first connection -> https://github.com/auth0/socketio-jwt
    /* istanbul ignore next */
    websocket.use(sioJWT.authorize({
      secret: getEnv('SECRET'),
      handshake: true,
    }))

    websocket.on('connection', (socket) => {
      // HERE THE CALLS

      // message in case of disconnection
      socket.on('disconnect', ()=> {
        console.log('user disconnected')
      })

      // to sotisfy the automatic test
      socket.on('echo', message => {
        socket.emit('echo-response', message)
      })
    })
  },

  stop: () => {
    websocket.close()
  },
}
