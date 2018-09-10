import {
  MissingAuthorizationHeaderError,
  UnhandledAuthorizationSchemeError,
  MalformattedAuthorizationHeaderError,
  MissingTokenTypeError,
  RejectedTokenTypeError,
} from '../errors'
import { verifyToken } from '../helpers/auth'

/**
 * AuthMiddleware
 *
 * Parse the request to find a token in the `Authorization` header.
 * If a token is found, add the attribute `token` containing the token payload
 * to the `request` object
 * @module AuthMiddleware
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @throws {MissingAuthorizationHeaderError}
 * @throws {UnhandledAuthorizationSchemeError}
 * @throws {MalformattedAuthorizationHeaderError}
 * @throws {InvalidTokenTypeError}
 * @throws {RejectedTokenTypeError}
 */
export default (req, res, next) => {
  const header = 'authorization'
  const scheme = 'bearer'
  const validTypes = ['access']
  const re = new RegExp(/(\S+)\s+(\S+)/, 'i')
  let payload

  if (!req.headers[header]) throw new MissingAuthorizationHeaderError()

  const matches = req.headers[header].trim().match(re)
  if (!matches) throw new MalformattedAuthorizationHeaderError()

  if (matches[1].toLowerCase() === scheme) payload = verifyToken(matches[2])
  else throw new UnhandledAuthorizationSchemeError()

  if (!payload.type) throw new MissingTokenTypeError()

  if (!validTypes.includes(payload.type)) {
    throw new RejectedTokenTypeError(payload.type)
  }

  req.token = payload
  next()
}
