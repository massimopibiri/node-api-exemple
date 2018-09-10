import mock   from 'node-mocks-http'
import sinon  from 'sinon'

import { ContentTypeMiddleware }  from '.'
import {
  UnsupportedMediaTypeError,
  RequiredContentTypeError,
} from '../../lib/errors'

let req
let res
let spy

describe('Content Type Middleware', () => {
  context('For each http methods with a payload body', () => {
    ['POST', 'PUT', 'PATCH'].forEach(method => {
      context(method, () => {
        beforeEach(() => {
          req = mock.createRequest({
            url: '/',
            method,
            params: { foo: 'bar' },
            headers: { 'Content-Type': 'application/json' },
          })
          res = mock.createResponse()
          spy = sinon.spy()
        })

        it('should accept an exact matching string', done => {
          ContentTypeMiddleware('application/json')(req, res, spy)
          spy.should.have.been.calledOnce
          done()
        })

        it('should accept a partial matching string', done => {
          ContentTypeMiddleware('application')(req, res, spy)
          ContentTypeMiddleware('json')(req, res, spy)
          spy.should.have.been.calledTwice
          done()
        })

        it('should accept a regex', done => {
          ContentTypeMiddleware(/application\/(.+\+)?json/)(req, res, spy)
          spy.should.have.been.calledOnce
          done()
        })

        it('should accept an array', done => {
          ContentTypeMiddleware(['xml', /.*\/(.+\+)?json/])(req, res, spy)
          spy.should.have.been.calledOnce
          done()
        })

        it('should raise a 415 if Content-Type is unsupported', done => {
          try {
            ContentTypeMiddleware('application/xml')(req, res, spy)
          } catch (error) {
            error.should.be.instanceOf(UnsupportedMediaTypeError)
            done()
          }
        })

        it('should require a Content-Type header', done => {
          req.headers = {}
          try {
            ContentTypeMiddleware('application/json')(req, res, spy)
          } catch (error) {
            error.should.be.instanceOf(RequiredContentTypeError)
            done()
          }
        })
      })
    })
  })

  context('For each http methods without a required payload body', () => {
    ['HEADER', 'GET', 'OPTIONS', 'DELETE'].forEach(method => {
      beforeEach(() => {
        req.method = method
        spy = sinon.spy()
      })

      context(method, () => {
        it('should pass without checking the Content-Type', done => {
          ContentTypeMiddleware('xml')(req, res, spy)
          spy.should.have.been.calledOnce
          done()
        })
      })
    })
  })
})
