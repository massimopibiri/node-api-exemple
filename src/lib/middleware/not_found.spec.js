/* eslint-disable no-underscore-dangle */

import sinon                  from 'sinon'
import mock                   from 'node-mocks-http'
import { EventEmitter }       from 'events'
import { NotFoundMiddleware } from '.'
import {
  NotFoundError,
  NotAcceptableError,
} from '../../lib/errors'


let spy

describe('Not Found Middleware', () => {
  beforeEach(() => {
    spy = sinon.spy()
  })

  describe('Based on the Accept header', () => {
    it('should return api+json', done => {
      const req = mock.createRequest({
        headers: { Accept: 'application/vnd.api+json' },
      })
      const res = mock.createResponse({
        req,
        eventEmitter: EventEmitter,
      })

      try {
        NotFoundMiddleware(req, res, spy)
      } catch (error) {
        error.should.be.instanceOf(NotFoundError)
        spy.should.not.have.been.called
        done()
      }
      // res.on('end', () => {
      //   const data = JSON.parse(res._getData())
      //   res.getHeader('Content-Type').should.equal('application/vnd.api+json')
      //   data.should.be.a('object')
      //   data.should.have.property('errors')
      //   data.errors.should.be.a('array')
      //   data.errors[0].should.be.a('object')
      //   data.errors[0].should.have.property('status')
      //   data.errors[0].should.have.property('code')
      //   data.errors[0].should.have.property('title')
      //   data.errors[0].status.should.equal(404)
      //   data.errors[0].code.should.equal('not_found')

      //   spy.should.not.have.been.called

      //   done()
      // })

      // NotFoundMiddleware(req, res, spy)
    })

    it('should return json', done => {
      const req = mock.createRequest({
        headers: { Accept: 'application/json' },
      })
      const res = mock.createResponse({
        req,
        eventEmitter: EventEmitter,
      })

      res.on('end', () => {
        const data = JSON.parse(res._getData())
        res.getHeader('Content-Type').should.equal('application/json')
        data.should.be.a('object')
        data.should.have.property('error')
        data.error.should.equal('not_found')

        spy.should.not.have.been.called

        done()
      })

      NotFoundMiddleware(req, res, spy)
    })

    it('should raise a 406 otherwise', done => {
      const req = mock.createRequest({
        headers: { Accept: 'text/html' },
      })
      const res = mock.createResponse()

      try {
        NotFoundMiddleware(req, res, spy)
      } catch (error) {
        error.should.be.instanceOf(NotAcceptableError)
        done()
      }
    })
  })

  it('should return a default json if no Accept header is given', done => {
    const req = mock.createRequest()
    const res = mock.createResponse({
      req,
      eventEmitter: EventEmitter,
    })

    res.on('end', () => {
      const data = JSON.parse(res._getData())
      res.getHeader('Content-Type').should.equal('application/json')
      data.should.be.a('object')
      data.should.have.property('error')
      data.error.should.equal('not_found')

      spy.should.not.have.been.called

      done()
    })

    NotFoundMiddleware(req, res, spy)
  })
})
