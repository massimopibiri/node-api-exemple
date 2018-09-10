import jwt                    from 'jsonwebtoken'
import { User }               from '../../db/models'
import { getEnv, isString }   from '../../utils'
import { UserDeletedError, TokenError }  from '../errors'

/**
 * @typedef   Token
 * @property  {string} type the token type ('access', 'reset', 'email')
 * @property  {string} user The user id bound to the token
 */

const algorithm = 'HS512'
const expiresIn = '1d'
const tokenTypes = ['access', 'reset', 'email']

/**
 * Generate a JWT for a given User instance
 *
 * @param {('access'|'email'|'reset')} type Token type to generate.
 * @param {User} user User object to use for generating the token
 * @param {string} [secret] the secret string to encode the token with
 * @param {object} [attrs] additional specific payload attributes
 *
 * @returns {Promise<string|Error>}
 */

export const createTokenForUser = (type, user, secret, attrs) => (
  new Promise((resolve, reject) => {
    (user instanceof User) || reject(TypeError('`user` param is not a User'))
    tokenTypes.includes(type) || reject(TypeError('Invalid token type'))
    user.deleted_at && reject(new UserDeletedError())
    const payload = Object.assign({
      sub: user.id,
      is_admin: user.is_admin,
      type,
    }, attrs)
    const token = jwt.sign(payload, secret || getEnv('SECRET'), {
      algorithm,
      expiresIn,
    })
    resolve(token)
  })
)

/**
 * Verify a given token
 *
 * TODO: should improve security, managing refresh token, revocation and all
 *
 * @param {string} token
 * @param {string} [secret] - If the token has been encoded with a custom
 *  secret, it needs to be used during verification
 *
 * @throws {TypeError}
 *
 * @returns {Token} a token payload object
 */

export const verifyToken = (token, secret = getEnv('SECRET')) => {
  if (!isString(token)) throw new TypeError('`token` must be a token string')
  return jwt.verify(
    token,
    secret,
    { algorithms: [algorithm] },
    (err, payload) => {
      if (err) throw new TokenError(err)
      return payload
    },
  )
}

export default { createTokenForUser, verifyToken }
