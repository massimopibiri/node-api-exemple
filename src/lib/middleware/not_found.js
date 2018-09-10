import { NotAcceptableError, NotFoundError } from '../errors'

/**
 * NotFound
 *
 * Catch all to return a default 404 based on the Accept header
 *
 * @module NotFoundMiddleware
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 */

const defaultRender = res => {
  res.set('Content-Type', 'application/json')
  res.status(404)
  res.end(JSON.stringify({
    error: 'not_found',
  }))
}

export const middleware = (req, res, next) => {
  if (req.headers.accept) {
    switch (req.headers.accept.match(/^([^;]+)(;.+)?$/)[0]) {
      case 'application/vnd.api+json':
        throw new NotFoundError()

      case 'application/json':
        defaultRender(res)
        break

      default:
        throw new NotAcceptableError()
    }
  } else {
    defaultRender(res)
  }

  next()
}

export default middleware
