import jwt from 'jsonwebtoken'
import { expect } from 'chai'

import { createTokenForUser, verifyToken } from './auth'
import {
// MissingAuthorizationHeaderError,
// UnhandledAuthorizationSchemeError,
// MalformattedAuthorizationHeaderError,
  UserDeletedError,
  TokenError,
} from '../../lib/errors'
import { getEnv } from '../../utils'
import { UserFactory } from '../../../test/factories'

const testToken = (token, secret, user) => (
  jwt.verify(token, secret, (err, payload) => {
    expect(err).to.be.null
    payload.should.have.property('sub')
    payload.sub.should.equal(user.id)
    payload.should.have.property('type')
    payload.type.should.equal('access')
    payload.should.have.property('is_admin')
    payload.is_admin.should.be.false
  })
)

let user

describe('Auth Helper', () => {
  context('createTokenForUser', () => {
    beforeEach(() => (
      UserFactory.create().should.be.fulfilled.then(res => { user = res })
    ))

    it('should create a token from a `User` with default secret', () => (
      createTokenForUser('access', user, null).should.be.fulfilled
        .then(token => testToken(token, getEnv('SECRET'), user))
    ))

    it('should create a token from a `User` with a custom secret', () => {
      const secret = 'foobar'
      return createTokenForUser('access', user, secret)
        .should.be.fulfilled.then(token => testToken(token, secret, user))
    })

    it('should create a token from a `User` with custom attributes', () => {
      const attrs = { custom: 42 }
      return createTokenForUser('access', user, null, attrs)
        .should.be.fulfilled.then(token => (
          jwt.verify(token, getEnv('SECRET'), (err, payload) => {
            expect(err).to.be.null
            payload.should.have.property('custom')
            payload.custom.should.equal(42)
          })
        ))
    })

    it('should create a token from a `User` with the admin flag', () => (
      UserFactory.create({ is_admin: true }).should.be.fulfilled
        .then(admin => (
          createTokenForUser('access', admin, null)
            .should.be.fulfilled.then(token => (
              jwt.verify(token, getEnv('SECRET'), (err, payload) => {
                expect(err).to.be.null
                payload.should.have.property('is_admin')
                payload.is_admin.should.be.true
              })
            ))
        ))
    ))

    it('should raise a TypeError if a `User` is not provided', () => (
      createTokenForUser('access', {})
        .should.be.rejectedWith(TypeError).then(error => {
          error.message.should.equal('`user` param is not a User')
        })
    ))

    it('should raise a TypeError if the token type is invalid', () => (
      createTokenForUser('unknown', user)
        .should.be.rejectedWith(TypeError).then(error => {
          error.message.should.equal('Invalid token type')
        })
    ))

    it('should raise an error if a `User` is disabled', async () => {
      const attrs = { deleted_at: '1982-07-22 19:00:00' }
      const userDeleted = await UserFactory.create(attrs)
      return createTokenForUser('access', userDeleted)
        .should.be.rejectedWith(UserDeletedError)
    })
  })

  let payload
  let token

  context('verifyToken', () => {
    beforeEach(() => {
      payload = { foo: 'bar' }
      token = jwt.sign(payload, getEnv('SECRET'), { algorithm: 'HS512' })
    })

    it('should verify a valid token', () => (
      verifyToken(token).should.include(payload)
    ))

    it('should verify a valid token with a custom secret', () => {
      payload = { secret: 'foobar' }
      const secret = 'custom_secret'
      token = jwt.sign(payload, secret, { algorithm: 'HS512' })
      return verifyToken(token, secret).should.include(payload)
    })

    it('should raise if the token has been tampered with', done => {
      token = jwt.sign(payload, 'badsecret', { algorithm: 'HS512' })
      try {
        verifyToken(token)
      } catch (error) {
        error.should.be.instanceOf(TokenError)
        error.code.should.be.equal('invalid_token')
        error.status.should.be.equal(401)
        done()
      }
    })

    it('should raise if the token use an unsupported algorithm', done => {
      token = jwt.sign(payload, getEnv('SECRET'), { algorithm: 'HS256' })
      try {
        verifyToken(token)
      } catch (error) {
        error.should.be.instanceOf(TokenError)
        error.code.should.be.equal('invalid_token')
        error.status.should.be.equal(401)
        done()
      }
    })

    it('should raise if the token is expired', done => {
      payload = {
        foo: 'bar',
        type: 'access',
        iat: Math.floor(Date.now() / 1000) - 120,
      }
      token = jwt.sign(payload, getEnv('SECRET'), {
        algorithm: 'HS512',
        expiresIn: '60',
      })
      try {
        verifyToken(token)
      } catch (error) {
        error.should.be.instanceOf(TokenError)
        error.code.should.be.equal('expired_token')
        error.status.should.be.equal(401)
        done()
      }
    })

    it('should raise if the token parameter has the wrong type', done => {
      try {
        verifyToken({})
      } catch (error) {
        error.should.be.instanceOf(TypeError)
        done()
      }
    })
  })
})
