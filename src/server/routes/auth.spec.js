import { Map }  from 'immutable'
import jwt      from 'jsonwebtoken'
import sinon    from 'sinon'
import uuidv4   from 'uuid/v4'

import {
  AuthHelper,
  EmailHelper,
}                         from '../../lib/helpers'
import { User }           from '../../db/models'
import { UserFactory }    from '../../../test/factories'
import { request as req } from '../../../test/setup'
import { helper }         from '../../../test/setup/helpers'
import { getEnv }         from '../../utils'

let user
let successRequest

describe('/auth routes', () => {
  beforeEach(() => UserFactory.create().should.be.fulfilled
    .then(res => { user = res }))

  context('POST /auth/authorize', () => {
    describe('When signing in', () => {
      before(() => {
        successRequest = opts => req('post', '/auth/authorize', opts)
          .should.be.fulfilled.then(res => {
            const sample = {
              access_token: null,
              id: user.id,
              token_type: 'Bearer',
              expires_in: '86400',
            }
            helper.test.response(res, 200, sample)
            res.should.have.header('Cache-Control', 'no-store')
            res.should.have.header('Pragma', 'no-cache')
            return new Promise((resolve, reject) => {
              const token = res.body.access_token
              jwt.verify(token, getEnv('SECRET'), (err, data) => {
                err && reject(err)
                data.should.have.property('sub')
                data.sub.should.equal(`${user.id}`)
                resolve()
              })
            })
          })
      })
      it('should succeed with a valid email', () => {
        const payload = {
          grant_type: 'password',
          username: user.email,
          password: user.password,
        }

        return successRequest({ auth: false, jsonapi: false, payload })
      })
      it('should succeed with a valid username', () => {
        const payload = {
          grant_type: 'password',
          username: user.username,
          password: user.password,
        }

        return successRequest({ auth: false, jsonapi: false, payload })
      })
    })

    it('should return 400 on invalid username', () => {
      const payload = {
        grant_type: 'password',
        username: 'john.doe',
        password: 'secret',
      }

      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/authorize', opts).should.be.rejected
        .then(error => {
          const sample = { error: 'invalid_grant' }
          helper.test.error.raw(error.response, 400, sample)
        })
    })

    it('should return 400 on invalid password', () => {
      const payload = {
        grant_type: 'password',
        username: user.username,
        password: 'secret',
      }

      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/authorize', opts).should.be.rejected
        .then(error => {
          const sample = { error: 'invalid_grant' }
          helper.test.error.raw(error.response, 400, sample)
        })
    })

    it('should return 400 on missing parameters', () => {
      const params = ['grant_type', 'username', 'password']
      const payload = Map({
        grant_type: 'password',
        username: 'john.doe@gmail.com',
        password: 'foobar',
      })

      return Promise.all(params.map(param => {
        const sample = {
          error: 'invalid_request',
          error_description: 'Some parameters are malformed or missing.',
        }

        const opts = {
          auth: false,
          jsonapi: false,
          payload: payload.delete(param),
        }
        return req('post', '/auth/authorize', opts).should.be.rejected
          .then(error => {
            helper.test.error.raw(error.response, 400, sample)
          })
      }))
    })

    it('should return 400 on invalid `grant_type`', () => {
      const payload = {
        grant_type: 'unknown',
        username: 'john.doe@gmail.com',
        password: 'foobar',
      }
      const sample = {
        error: 'unsupported_grant_type',
        error_description: 'This authentication server supports only'
          + ' the `password` grant type.',
      }

      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/authorize', opts).should.be.rejected
        .then(error => {
          helper.test.error.raw(error.response, 400, sample)
        })
    })
  })

  context('POST /auth/recover', () => {
    let sendStub
    beforeEach(() => { sendStub = sinon.stub(EmailHelper, 'send') })
    afterEach(() => { sendStub.restore() })

    it('should return 204 if a known email is provided', () => {
      const payload = { email: user.email }
      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/recover', opts).should.be.fulfilled
        .then(res => {
          res.should.have.status(204)
          sendStub.should.have.been.called
        })
    })

    it('should return 204 if an unknown email is provided (obfuscate)', () => {
      const payload = { email: 'unknown@email.com' }
      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/recover', opts).should.be.fulfilled
        .then(res => {
          res.should.have.status(204)
          sendStub.should.not.have.been.called
        })
    })

    it('should return 400 if email parameter is missing', () => {
      const payload = {}
      const sample = {
        error: 'missing_parameter',
        error_description: 'email is a mandatory parameter',
      }

      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/recover', opts).should.be.rejected
        .then(error => {
          helper.test.error.raw(error.response, 400, sample)
        })
    })

    it('should return 400 if a malformed email is provided', () => {
      const badEmail = 'badEmail.com'
      const payload = { email: badEmail }
      const sample = {
        error: 'malformed_email',
        error_description: 'email is not a valid email',
      }

      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/recover', opts).should.be.rejected
        .then(error => {
          helper.test.error.raw(error.response, 400, sample)
        })
    })
  })

  context('POST /auth/reset', () => {
    it('should return 204 and reset the password with a valid token', () => {
      const password = 'NewStr0ngPassw0rd'
      return AuthHelper
        .createTokenForUser('reset', user, user.secret()).should.be.fulfilled
        .then(token => {
          const payload = {
            reset_token: token,
            password,
          }
          user.validatePassword(password).should.be.false

          const opts = { auth: false, jsonapi: false, payload }
          return req('post', '/auth/reset', opts).should.be.fulfilled
            .then(res => {
              res.status.should.equal(204)
              const clauses = { where: { id: user.id, deleted_at: null } }
              return User.findOne(clauses).should.be.fulfilled
                .then(resource => {
                  resource.validatePassword(password).should.be.true
                })
            })
        })
    })

    it('should return 401 on missing token type', () => {
      const token = jwt.sign(
        { sub: user.id },
        user.secret(),
        { algorithm: 'HS512' },
      )

      const payload = {
        reset_token: token,
        password: 'foobar',
      }
      const sample = {
        status: 401,
        code: 'missing_token_type',
        title: 'The token needs an attribute type in its payload.',
        detail: null,
      }

      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/reset', opts).should.be.rejected
        .then(error => {
          helper.test.error.jsonapi(error.response, 401, sample)
        })
    })

    it('should return 401 on wrong token type', () => {
      const token = jwt.sign(
        { sub: user.id, type: 'access' },
        user.secret(),
        { algorithm: 'HS512' },
      )

      const payload = {
        reset_token: token,
        password: 'foobar',
      }
      const sample = {
        status: 401,
        code: 'rejected_token_type',
        title: 'The token type access has been rejected.',
        detail: null,
      }

      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/reset', opts).should.be.rejected
        .then(error => {
          helper.test.error.jsonapi(error.response, 401, sample)
        })
    })

    it('should return 401 on already used reset token', () => {
      const password = 'NewStr0ngPassw0rd'
      return AuthHelper
        .createTokenForUser('reset', user, user.secret()).should.be.fulfilled
        .then(token => {
          const payload = {
            reset_token: token,
            password,
          }
          const sample = {
            error: 'invalid_token',
          }

          user.validatePassword(password).should.be.false
          return user.update({ password }).should.fulfilled
            .then(resource => {
              resource.validatePassword(password).should.be.true

              const opts = { auth: false, jsonapi: false, payload }
              return req('post', '/auth/reset', opts).should.be.rejected
                .then(error => {
                  helper.test.error.raw(error.response, 401, sample)
                })
            })
        })
    })

    it('should return 401 on expired reset token', () => {
      const tokenPayload = {
        sub: user.id,
        type: 'reset',
        iat: Math.floor(Date.now() / 1000) - 120,
      }
      const token = jwt.sign(tokenPayload, user.secret(), {
        algorithm: 'HS512',
        expiresIn: '60',
      })
      const payload = {
        reset_token: token,
        password: 'Str0ngPassword',
      }
      const sample = {
        error: 'expired_token',
      }

      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/reset', opts).should.be.rejected
        .then(error => {
          helper.test.error.raw(error.response, 401, sample)
        })
    })

    it('should return 400 on missing attributes', () => {
      const params = ['reset_token', 'password']
      const payload = Map({
        reset_token: 'fake_token',
        password: 'foobar',
      })

      return Promise.all(params.map(param => {
        const sample = {
          error: 'missing_parameter',
          error_description: `${param} is a mandatory parameter`,
        }

        const opts = {
          auth: false,
          jsonapi: false,
          payload: payload.delete(param).toJS(),
        }
        return req('post', '/auth/reset', opts).should.be.rejected
          .then(error => {
            helper.test.error.raw(error.response, 400, sample)
          })
      }))
    })

    it('should return 401 on invalid token', () => {
      const payload = { reset_token: 'fake_token', password: 'Str0ngPassword' }
      const sample = {
        error: 'token_error',
        error_description: 'We were unable to validate your token.',
      }

      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/reset', opts).should.be.rejected
        .then(error => {
          helper.test.error.raw(error.response, 401, sample)
        })
    })

    it('should return 404 on unknown token sub id', () => {
      const tokenPayload = {
        sub: uuidv4(),
        type: 'reset',
      }
      const token = jwt.sign(tokenPayload, user.secret(), {
        algorithm: 'HS512',
      })
      const payload = { reset_token: token, password: 'Str0ngPassword' }

      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/reset', opts).should.be.rejected
        .then(error => {
          error.response.should.have.status(404)
        })
    })
  })

  context('POST /auth/confirm', () => {
    it('should return 204 and validate email with a valid token', () => (
      AuthHelper.createTokenForUser('email', user, user.confirm())
        .should.be.fulfilled.then(token => {
          const payload = { confirm_token: token }
          user.is_confirmed.should.be.false

          const opts = { auth: false, jsonapi: false, payload }
          return req('post', '/auth/confirm', opts)
            .should.be.fulfilled.then(res => {
              res.status.should.equal(204)
              const clauses = { where: { id: user.id, deleted_at: null } }
              return User.findOne(clauses).should.be.fulfilled
                .then(resource => {
                  resource.is_confirmed.should.be.true
                })
            })
        })
    ))

    it('should return 401 on missing token type', () => {
      const token = jwt.sign(
        { sub: user.id },
        user.confirm(),
        { algorithm: 'HS512' },
      )
      const payload = { confirm_token: token }
      const sample = {
        status: 401,
        code: 'missing_token_type',
        title: 'The token needs an attribute type in its payload.',
        detail: null,
      }

      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/confirm', opts).should.be.rejected
        .then(error => {
          helper.test.error.jsonapi(error.response, 401, sample)
        })
    })

    it('should return 401 on wrong token type', () => {
      const token = jwt.sign(
        { sub: user.id, type: 'wrong' },
        user.confirm(),
        { algorithm: 'HS512' },
      )
      const payload = { confirm_token: token }
      const sample = {
        status: 401,
        code: 'rejected_token_type',
        title: 'The token type wrong has been rejected.',
        detail: null,
      }

      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/confirm', opts).should.be.rejected
        .then(error => {
          helper.test.error.jsonapi(error.response, 401, sample)
        })
    })

    it('should return 401 on already used token', () => (
      AuthHelper
        .createTokenForUser('email', user, user.confirm()).should.be.fulfilled
        .then(token => {
          const payload = { confirm_token: token }
          const sample = {
            error: 'invalid_token',
          }

          user.is_confirmed.should.be.false
          return user.update({ is_confirmed: true }).should.fulfilled
            .then(resource => {
              resource.is_confirmed.should.be.true

              const opts = { auth: false, jsonapi: false, payload }
              return req('post', '/auth/confirm', opts).should.be.rejected
                .then(error => {
                  helper.test.error.raw(error.response, 401, sample)
                })
            })
        })
    ))

    it('should return 401 if the email has changed', () => (
      AuthHelper
        .createTokenForUser('email', user, user.confirm()).should.be.fulfilled
        .then(token => {
          const payload = { confirm_token: token }
          const sample = {
            error: 'invalid_token',
          }

          return user.update({ email: 'some.other@email.com' })
            .should.fulfilled.then(() => {
              const opts = { auth: false, jsonapi: false, payload }
              return req('post', '/auth/confirm', opts).should.be.rejected
                .then(error => {
                  helper.test.error.raw(error.response, 401, sample)
                })
            })
        })
    ))

    it('should return 401 on expired token', () => {
      const tokenPayload = {
        sub: user.id,
        type: 'email',
        iat: Math.floor(Date.now() / 1000) - 120,
      }
      const token = jwt.sign(tokenPayload, user.confirm(), {
        algorithm: 'HS512',
        expiresIn: '60',
      })
      const payload = { confirm_token: token }
      const sample = {
        error: 'expired_token',
      }

      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/confirm', opts).should.be.rejected
        .then(error => {
          helper.test.error.raw(error.response, 401, sample)
        })
    })

    it('should return 400 on missing attributes', () => {
      const params = ['confirm_token']
      const payload = Map({ confirm_token: 'fake_token' })

      return Promise.all(params.map(param => {
        const sample = {
          error: 'missing_parameter',
          error_description: `${param} is a mandatory parameter`,
        }

        const opts = {
          auth: false,
          jsonapi: false,
          payload: payload.delete(param).toJS(),
        }
        return req('post', '/auth/confirm', opts).should.be.rejected
          .then(error => {
            helper.test.error.raw(error.response, 400, sample)
          })
      }))
    })

    it('should return 401 on invalid token', () => {
      const payload = { confirm_token: 'fake_token' }
      const sample = {
        error: 'token_error',
        error_description: 'We were unable to validate your token.',
      }

      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/confirm', opts).should.be.rejected
        .then(error => {
          helper.test.error.raw(error.response, 401, sample)
        })
    })

    it('should return 404 on unknown token sub id', () => {
      const tokenPayload = {
        sub: uuidv4(),
        type: 'email',
      }
      const token = jwt.sign(tokenPayload, user.confirm(), {
        algorithm: 'HS512',
      })
      const payload = { confirm_token: token }

      const opts = { auth: false, jsonapi: false, payload }
      return req('post', '/auth/confirm', opts).should.be.rejected
        .then(error => {
          error.response.should.have.status(404)
        })
    })
  })
})
