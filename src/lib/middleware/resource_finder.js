import { Model, EmptyResultError }    from 'sequelize'

import { NotFoundMiddleware }         from '.'

/**
 * ResourceFinderMiddleware
 *
 * Parse the request to find an associated resource.
 * If one is found, it will be added to the `req` object.
 * Raised a 404 immediately otherwise.
 * @module ResourceFinderMiddleware
 * @function
 * @param {Object} model - Model in which to search for a resource
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 */
export default model => (req, res, next) => {
  if (!(model.prototype instanceof Model)) {
    throw TypeError('model should be an instance of `Model`')
  }

  if (req.params.id) {
    model.findById(req.params.id)
      .then(resource => {
        req.resource = resource
        next()
      })
      .catch(error => {
        /* istanbul ignore else */
        if (error instanceof EmptyResultError) {
          NotFoundMiddleware(req, res, next)
        } else throw error
      })
      .catch(next)
  } else {
    NotFoundMiddleware(req, res, next)
  }
}
