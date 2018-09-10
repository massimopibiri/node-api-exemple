import jwt                from 'jsonwebtoken'
import mock               from 'node-mocks-http'

import { AuthMiddleware } from '.'
import { getEnv }         from '../../utils'
import {
  MissingAuthorizationHeaderError,
  UnhandledAuthorizationSchemeError,
  MalformattedAuthorizationHeaderError,
  RejectedTokenTypeError,
  MissingTokenTypeError,
} from '../errors'

describe('Auth Middleware', () => {
  it('should add a `token` property to the express request object', done => {
    const payload = { foo: 'bar', type: 'access' }
    const token = jwt.sign(payload, getEnv('SECRET'), { algorithm: 'HS512' })
    const req = mock.createRequest({
      headers: { Authorization: `Bearer ${token}` },
    })
    const res = mock.createResponse()
    AuthMiddleware(req, res, () => {
      req.token.should.deep.include(payload)
      done()
    })
  })

  it('should reject a token with a type not `access`', done => {
    const payload = { foo: 'bar', type: 'email' }
    const token = jwt.sign(payload, getEnv('SECRET'), { algorithm: 'HS512' })
    const req = mock.createRequest({
      headers: { Authorization: `Bearer ${token}` },
    })
    const res = mock.createResponse()
    try {
      AuthMiddleware(req, res, () => {})
    } catch (error) {
      error.should.be.instanceOf(RejectedTokenTypeError)
    } finally {
      done()
    }
  })

  it('should reject a token without type', done => {
    const payload = { foo: 'bar' }
    const token = jwt.sign(payload, getEnv('SECRET'), { algorithm: 'HS512' })
    const req = mock.createRequest({
      headers: { Authorization: `Bearer ${token}` },
    })
    const res = mock.createResponse()
    try {
      AuthMiddleware(req, res, () => {})
    } catch (error) {
      error.should.be.instanceOf(MissingTokenTypeError)
      done()
    }
  })

  it('should raise a 401 if the header is missing', done => {
    const req = mock.createRequest()
    const res = mock.createResponse()
    try {
      AuthMiddleware(req, res, () => {})
    } catch (error) {
      error.should.be.instanceOf(MissingAuthorizationHeaderError)
      done()
    }
  })

  it('should raise a 401 if the header is malformatted', done => {
    const req = mock.createRequest({
      headers: { Authorization: 'secret' },
    })
    const res = mock.createResponse()
    try {
      AuthMiddleware(req, res, () => {})
    } catch (error) {
      error.should.be.instanceOf(MalformattedAuthorizationHeaderError)
      done()
    }
  })

  it('should raise a 401 if the scheme is not `bearer`', done => {
    const req = mock.createRequest({
      headers: { Authorization: 'basic credentials' },
    })
    const res = mock.createResponse()
    try {
      AuthMiddleware(req, res, () => {})
    } catch (error) {
      error.should.be.instanceOf(UnhandledAuthorizationSchemeError)
      done()
    }
  })
})
