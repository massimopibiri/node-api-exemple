import APIError from './APIError'

export default class BadRequestError extends APIError {
  constructor (code, errors, jsonapi = true) {
    super(
      code,
      'Some parameters are wrong or missing',
      'Please refer to the documentation.',
    )

    this.status = 400
    this.name = 'BadRequestError'

    Error.captureStackTrace(this, this.constructor)

    this.errors = Array.isArray(errors) ? errors : [errors]
    if (!jsonapi) {
      this.raw = {
        error: code,
        error_description: Array.isArray(errors) ?
          `${errors[0].param} ${errors[0].msg}` : errors,
      }
    }
  }
}
