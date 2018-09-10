import express              from 'express'
import jwt                  from 'jsonwebtoken'
import { Op, EmptyResultError } from 'sequelize'

import { User }             from '../../db/models'
import {
  ValidatorHelper,
  EmailHelper,
}                           from '../../lib/helpers'
import {
  createTokenForUser,
  verifyToken,
}                           from '../../lib/helpers/auth'
import { getEnv }           from '../../utils'
import {
  AuthError,
  TokenError,
  MissingTokenTypeError,
  RejectedTokenTypeError,
}                           from '../../lib/errors'

const router = express.Router()

/**
 * Authorize route
 *
 * Request :
 *
 *  POST /auth/authorize HTTP/1.1
 *  Content-Type: application/json
 *
 *  {
 *    "grant_type":"password",
 *    "username":"john.doe",
 *    "password": "MyS3cr3t"
 *  }
 *
 * Response :
 *
 *  HTTP/1.1 200 OK
 *  Content-Type: application/json
 *
 *  {
 *    "access_token":"eyJhbGciOiJIUzUx[...]KaoVyu865i64g",
 *    "token_type":"Bearer",
 *    "expires_in": "86400"
 *  }
 *
 */

router.post(
  '/authorize',
  ValidatorHelper().validateOauth(),
  (req, res, next) => {
    const clauses = {
      where: {
        [Op.or]: [
          { username: req.body.username },
          { email: req.body.username },
        ],
        deleted_at: null,
      },
    }
    User.findOne(clauses)
      .then(user => {
        if (!user.validatePassword(req.body.password)) {
          throw new AuthError('invalid_grant')
        }
        createTokenForUser('access', user)
          .then(token => {
            const payload = {
              access_token: token,
              token_type: 'Bearer',
              expires_in: '86400',
              id: user.id,
            }
            res.setHeader('Cache-Control', 'no-store')
            res.setHeader('Pragma', 'no-cache')
            res.json(payload)
          })
          .catch(next)
      })
      .catch(error => {
        // Returns a 400 error, even if we are not strictly Oauth 2.0, this
        // is the best http code to use here anyway :
        // https://tools.ietf.org/html/rfc6749#section-5.2
        /* istanbul ignore else */
        if (error instanceof EmptyResultError) {
          throw new AuthError('invalid_grant')
        }
        throw error
      })
      .catch(next)
  },
)

/**
 * Recover route
 *
 * Request :
 *
 *  POST /auth/recover HTTP/1.1
 *  Content-Type: application/json
 *
 *  {
 *    "email":"john.doe@gmail.com"
 *  }
 *
 * Response :
 *
 *  HTTP/1.1 204 No Content
 *
 */

router.post(
  '/recover',
  ValidatorHelper().mandatoryParameters('email'),
  ValidatorHelper().validateEmail('email'),
  (req, res, next) => {
    const clauses = { where: { email: req.body.email, deleted_at: null } }
    User.findOne(clauses).then(user => (
      createTokenForUser('reset', user, user.secret())
        .then(token => (
          EmailHelper.send('recover', user, {
            name: user.firstname,
            reset_password_url: `${getEnv('ORIGIN')}/renew/${token}`,
          })
        ))
    ))
      .then(() => res.status(204).end())
      .catch(error => {
        // A not found email returns also a 204.
        // For security purposes we are obfuscating whether an email is
        // in our database or not.
        /* istanbul ignore else */
        if (error instanceof EmptyResultError) return res.status(204).end()
        throw error
      })
      .catch(next)
  },
)

/**
 * Reset user password route
 *
 * Request :
 *
 *  POST /auth/reset HTTP/1.1
 *  Content-Type: application/json
 *  Accept: application/json
 *
 *  {
 *    "reset_token":"eyJhbGciOiJIUzUx[...]KaoVyu865i64g",
 *    "password":"Str0ngP4ssw0rd"
 *  }
 *
 * Response :
 *
 *  HTTP/1.1 204 No Content
 *
 */

router.post(
  '/reset',
  ValidatorHelper().mandatoryParameters('reset_token', 'password'),
  (req, res, next) => {
    const decoded = jwt.decode(req.body.reset_token)
    if (!decoded) throw new TokenError()
    const clauses = { where: { id: decoded.sub, deleted_at: null } }
    User.findOne(clauses)
      .then(user => {
        const tokenPayload = verifyToken(req.body.reset_token, user.secret())
        const { type } = tokenPayload
        if (!type) throw new MissingTokenTypeError()
        if (type !== 'reset') throw new RejectedTokenTypeError(type)

        return user.update({ password: req.body.password })
          .then(() => res.status(204).end())
      })
      .catch(error => {
        /* istanbul ignore else */
        if (error instanceof EmptyResultError) return res.status(404).end()
        throw error
      })
      .catch(next)
  },
)

/**
 * Confirm user email route
 *
 * Request :
 *
 *  POST /auth/confirm HTTP/1.1
 *  Content-Type: application/json
 *  Accept: application/json
 *
 *  {
 *    "confirm_token":"eyJhbGciOiJIUzUx[...]KaoVyu865i64g"
 *  }
 *
 * Response :
 *
 *  HTTP/1.1 204 No Content
 *
 */

router.post(
  '/confirm',
  ValidatorHelper().mandatoryParameters('confirm_token'),
  (req, res, next) => {
    const decoded = jwt.decode(req.body.confirm_token)
    if (!decoded) throw new TokenError()
    const clauses = { where: { id: decoded.sub, deleted_at: null } }
    User.findOne(clauses)
      .then(user => {
        const tokenData = verifyToken(req.body.confirm_token, user.confirm())
        const { type } = tokenData
        if (!type) throw new MissingTokenTypeError()
        if (type !== 'email') throw new RejectedTokenTypeError(type)

        return user.update({ is_confirmed: true })
          .then(() => res.status(204).end())
      })
      .catch(error => {
        /* istanbul ignore else */
        if (error instanceof EmptyResultError) return res.status(404).end()
        throw error
      })
      .catch(next)
  },
)
export default router
