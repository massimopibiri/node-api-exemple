/* eslint-disable no-underscore-dangle */

import mock                         from 'node-mocks-http'
import { EventEmitter }             from 'events'
import { RenderJsonApiMiddleware }  from '.'

const testRenderSuccess = (req, done) => {
  const res = mock.createResponse({
    req,
    eventEmitter: EventEmitter,
  })
  res.on('end', () => {
    const data = JSON.parse(res._getData())
    res.getHeader('Content-Type').should.equal('application/vnd.api+json')
    data.should.be.a('object')
    data.should.have.property('jsonapi')
    data.jsonapi.should.be.a('object')
    data.jsonapi.should.have.property('version')
    data.jsonapi.version.should.equal('1.0')
    data.should.have.property('data')
    data.data.should.be.a('object')
    data.data.should.have.property('test')
    data.data.test.should.equal('ok')
    done()
  })
  RenderJsonApiMiddleware(req, res, () => {
    res.render_jsonapi({ test: 'ok' })
  })
}

describe('Render API Middleware', () => {
  it('should add a render_jsonapi() method to the response object', done => {
    const req = mock.createRequest()
    const res = mock.createResponse()
    RenderJsonApiMiddleware(req, res, () => {
      res.should.have.property('render_jsonapi')
      res.render_jsonapi.should.be.a('function')
      done()
    })
  })

  describe('Based on the Accept header of the request', () => {
    it('should render if Accept includes application/vnd.api+json', done => {
      const req = mock.createRequest({
        headers: { Accept: 'application/vnd.api+json' },
      })
      testRenderSuccess(req, done)
    })
    it('should render if Accept includes application/json', done => {
      const req = mock.createRequest({
        headers: { Accept: 'application/xml, application/json' },
      })
      testRenderSuccess(req, done)
    })
    it('should render if Accept not defined', done => {
      const req = mock.createRequest()
      testRenderSuccess(req, done)
    })
    it('should throw a 406 if no header value match', done => {
      const req = mock.createRequest({
        headers: { Accept: 'application/xml' },
      })
      const res = mock.createResponse({
        req,
        eventEmitter: EventEmitter,
      })
      RenderJsonApiMiddleware(req, res, () => {
        try {
          res.render_jsonapi({ test: 'ok' })
        } catch (error) {
          error.should.have.property('status')
          error.should.have.property('code')
          error.should.have.property('title')
          error.should.have.property('detail')
          error.status.should.equal(406)
          error.code.should.equal('not_acceptable')
          done()
        }
      })
    })
  })
})
