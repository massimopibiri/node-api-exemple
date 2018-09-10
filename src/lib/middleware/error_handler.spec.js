/* eslint-disable no-underscore-dangle */

import mock                       from 'node-mocks-http'
import { EventEmitter }           from 'events'
import { ValidationError }        from 'sequelize'
import { ErrorHandlerMiddleware } from '.'
import {
  APIError,
  BadRequestError,
  NotAcceptableError,
} from '../errors'

class MockError extends APIError {
  constructor (status, code, title, errors) {
    super(code, title)
    this.status = status
    this.errors = errors
  }
}

class MockRawError extends Error {
  constructor (code) {
    super()
    this.status = 400
    this.raw = { error: code }
  }
}

class MockValidationError extends ValidationError {
  constructor () {
    super()
    this.errors = [
      {
        message: 'email must be unique',
        type: 'unique violation',
        path: 'email',
        value: 'Esther.Steuber@yahoo.com',
        origin: 'DB',
        instance: [{}],
        validatorKey: 'not_unique',
        validatorName: null,
        validatorArgs: [],
      },
    ]
  }
}

class MockBadRequestError extends BadRequestError {
  constructor (status, code, title, errors) {
    super(code, title)
    this.status = status
    this.errors = errors
  }
}


const testErrorHandler = (err, done, status, code, sample = null) => {
  const body = { dummy: 42 }
  const req = mock.createRequest({
    body,
  })
  const res = mock.createResponse({
    req,
    eventEmitter: EventEmitter,
  })
  res.on('end', () => {
    const data = JSON.parse(res._getData())
    res.getHeader('Content-Type').should.equal('application/vnd.api+json')
    data.should.be.a('object')
    data.should.have.property('errors')
    data.errors.should.be.a('array')

    if (sample) {
      data.should.have.deep.property('errors', sample)
    } else {
      data.errors[0].should.be.a('object')
      data.errors[0].should.have.property('status')
      data.errors[0].should.have.property('code')
      data.errors[0].should.have.property('title')
      data.errors[0].should.have.property('detail')
      data.errors[0].status.should.equal(status)
      data.errors[0].code.should.equal(code)
    }

    if (res.status === 400) {
      data.should.have.property('meta')
      data.meta.should.have.property('request')
      data.meta.request.should.equal(body)
    }

    done()
  })
  ErrorHandlerMiddleware(err, req, res, () => {})
}

describe('Error Handler Middleware', () => {
  it('should handle an APIError object', done => {
    const err = new APIError()
    testErrorHandler(err, done, 500, 'api_error')
  })

  it('should handle an error inheriting from APIError object', done => {
    const err = new NotAcceptableError()
    testErrorHandler(err, done, 406, 'not_acceptable')
  })
  // IT GIVES AN ERROR !!!
  it('should handle any error not inheriting from APIError object', done => {
    const err = new Error()
    testErrorHandler(err, done, 500, 'api_error')
  })

  it('should handle an error with multiple causes like a 400', done => {
    const status = 400
    const code = 'missing_parameter'
    const title = 'test_title'
    const errors = [
      { param: 'data.attributes.foo', msg: 'is a mandatory parameter' },
      { param: 'bar', msg: 'is a mandatory parameter' },
    ]
    const sample = [
      {
        status,
        code,
        title: 'foo is a mandatory parameter',
        source: { pointer: '/data/attributes/foo' },
        detail: 'An error occurred, related to the attribute foo' +
        ' of value \'undefined\'. Please refer to the API Doc.',
      },
      {
        status,
        code,
        title: 'bar is a mandatory parameter',
        source: { pointer: '/bar' },
        detail: 'An error occurred, related to the attribute bar' +
          ' of value \'undefined\'. Please refer to the API Doc.',
      },
    ]
    const err = new MockError(status, code, title, errors)
    testErrorHandler(err, done, status, code, sample)
  })

  it('should handle malformed BadRequestError', done => {
    const status = 400
    const code = 'missing_parameter'
    const title = 'test_title'
    const error = new MockError(status, code, title)
    const errors = [error]
    const err = new MockBadRequestError(status, code, title, errors)
    testErrorHandler(err, done, status, code)
  })

  it('should handle an error from Sequelize', done => {
    const sample = [
      {
        status: 400,
        code: 'db_unique_violation',
        title: 'email unique violation',
        source: { pointer: '/data/attributes/email' },
        detail: 'email must be unique',
      },
    ]
    const err = new MockValidationError()
    testErrorHandler(err, done, 400, 'db_unique_violation', sample)
  })

  it('should handle raw errors without jsonapi', () => {
    const sample = { error: 'code_error' }
    const err = new MockRawError('code_error')
    const req = mock.createRequest()
    const res = mock.createResponse({
      req,
      eventEmitter: EventEmitter,
    })

    res.on('end', () => {
      const data = JSON.parse(res._getData())
      res.getHeader('Content-Type').should.match(/^application\/json/)
      data.should.have.deep.equal(JSON.stringify(sample))
    })
    ErrorHandlerMiddleware(err, req, res, () => {})
  })
})
