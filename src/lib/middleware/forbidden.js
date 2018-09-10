import { ForbiddenError } from '../errors'

/**
 * ForbiddenMiddleware
 *
 * Check wether the session user is the owner or an admin
 * to grand access to the resource.
 * Raised a 403 otherwise.
 * @module ForbiddenMiddleware
 * @function
 * @param {String} ownerKey - Resource attribute to compare the session id with
 * @returns {Function} - Middleware function
 */
export default ownerKey => (req, res, next) => {
  if (req.token.sub !== req.resource[ownerKey] && !req.token.is_admin) {
    throw new ForbiddenError()
  }

  next()
}
