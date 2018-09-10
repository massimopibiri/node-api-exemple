import { NotAcceptableError } from '../errors'
/**
 * RenderApiMiddleware
 *
 * Add a `render_jsonapi()` method to the Express response object
 *
 * @module RenderApiMiddleware
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @throws {NotAcceptableError}
 */
export default (req, res, next) => {
  res.render_jsonapi = payload => {
    const render = () => {
      res.type('application/vnd.api+json')
      // Using directly .end() function here since we don't want express
      // to assume nor modify anything in the response like it does with
      // the .send() function, especially messing up with the headers.
      res.end(JSON.stringify({
        jsonapi: {
          version: '1.0',
        },
        data: payload,
      }))
    }
    res.format({
      'application/vnd.api+json': render,
      'application/json': render,
      default: () => { throw new NotAcceptableError() },
    })
  }

  next()
}
