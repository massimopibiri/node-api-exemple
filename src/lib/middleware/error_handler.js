/* eslint-disable no-console */

import { ValidationError }      from 'sequelize'
import { APIError, TokenError } from '../errors'

/**
 * ErrorHandlerMiddleware
 *
 * Catch any thrown error and format it to send a response compliant
 * with the JSONAPI.org specifications
 * MUST be called last.
 *
 * @module ErrorHandlerMiddleware
 * @function
 * @param {Error} err - Instance of `Error` object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export default (err, req, res, next) => {
  let errors
  let formattedError = err
  // console.log(err)

  // Handling raw errors - Not JSONAPI
  if (err.raw) {
    res.status(err.status).json(JSON.stringify(err.raw))
  } else if (err instanceof TokenError) {
    res.status(err.status).json(JSON.stringify({
      error: err.code,
      error_description: err.detail,
    }))
  } else {
    // Handling Sequelize 400-like errors
    if (err instanceof ValidationError) {
      formattedError.status = 400
      errors = err.errors.map(error => (
        {
          status: 400,
          code: `db_${error.type.replace(/\s/g, '_').toLowerCase()}`,
          title: `${error.path} ${error.type.toLowerCase()}`,
          detail: error.message.toLowerCase(),
          source: {
            pointer: `/data/attributes/${error.path}`,
          },
        }
      ))
    } else if (Array.isArray(err.errors)) {
      // Handling standard 400-like errors
      errors = err.errors.map(error => {
        if (error.param) {
          const pointer = `/${error.param.replace(/\./g, '/')}`
          const attr = error.param.replace(/data\.attributes\./, '')
          return {
            status: err.status,
            code: err.code,
            title: `${attr} ${error.msg}`,
            source: { pointer },
            detail: `An error occurred, related to the attribute ${attr}`
              + ` of value '${error.value}'. Please refer to the API Doc.`,
          }
        }
        return error
      })
    } else {
      // If the error is not an APIError or extended from it,
      // we instanciate a default one to be returned
      if (!err.status) {
        /* istanbul ignore next */
        process.env.NODE_ENV !== 'production' && console.log(err)
        formattedError = new APIError()
        formattedError.stacktrace = err.stacktrace
      }

      errors = [{
        status: formattedError.status,
        code: formattedError.code,
        title: formattedError.title,
        detail: formattedError.detail,
      }]
    }

    const payload = {
      jsonapi: {
        version: '1.0',
      },
      errors,
    }
    if (err.status === 400) payload.meta = { request: req.body }

    res.set('Content-Type', 'application/vnd.api+json')
    res.status(err.status || 500).end(JSON.stringify(payload))
  }

  next()
}
