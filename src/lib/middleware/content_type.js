import {
  UnsupportedMediaTypeError,
  RequiredContentTypeError,
} from '../errors'
import { isString, sanitizeRegexString } from '../../utils'

/**
 * ContentTypeMiddleware
 *
 * Ensure Content-Type and Accept request headers value are compliant with
 * this API.
 * Could be used at any level of the routing structure.
 *
 * @module ContentTypeMiddleware
 * @function
 * @param {string|Array.<string>} types - types to match
 * @param {string} [defaultType] - a default suggestion if the test fails
 *
 * @throws {UnsupportedMediaTypeError}
 *
 * @returns {function} - Express middleware function
 */
export default (types, defaultType) => (req, res, next) => {
  const contentTypes = Array.isArray(types) ? types : [types]

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const reqType = req.get('Content-Type')
    if (!reqType) throw new RequiredContentTypeError()

    const supportedType = contentTypes.reduce((match, type) => {
      const re = isString(type) ? sanitizeRegexString(type) : type
      return reqType.match(re) ? true : match
    }, false)
    if (!supportedType) {
      throw new UnsupportedMediaTypeError(reqType, defaultType)
    }
  }

  next()
}
