import io         from 'socket.io-client'
import jwt        from 'jsonwebtoken'
import { expect } from 'chai'
// import server     from '.'
import socket     from './socket'
import { getEnv } from '../utils'
import { service, port } from '../../test/setup'

const host = 'localhost'

const ioOptions = {
  transports: ['websocket'],
  forceNew: true,
  reconnection: false,
}

let ws
let token

describe('WebSocket', () => {
  before(() => {
    socket.start(service)
  })
  after(() => {
    socket.stop()
  })

  beforeEach(() => { ws = io.connect(`http://${host}:${port}`, ioOptions) })
  afterEach(() => ws.close())
/*
  describe('when the user is not logged in', () => {
    it('should close the connection if no auth message is received', done => {
      ws.once('disconnect', () => done())
    })
  })

  describe('when the user is logged in', () => {
    beforeEach(() => {
      token = jwt.sign(
        { foo: 'bar' },
        getEnv('SECRET'), { algorithm: 'HS512' },
      )
    })

    it('should refuse an invalid token', done => {
      ws.on('connect', () => {
        ws.emit('authenticate', { token: 'dummy_token' })
          .on('unauthorized', error => {
            expect(error.data.type).to.equal('UnauthorizedError')
            done()
          })
      })
    })

    it('should authenticate and respond to an echo', done => {
      const message = 'test-echo'
      ws.on('connect', () => {
        ws.emit('authenticate', { token })
          .on('authenticated', () => ws.emit('echo', message))
          .on('echo-response', res => {
            expect(res).to.equal(message)
            done()
          })
      })
    })
  })
*/
})
