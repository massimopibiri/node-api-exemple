import APIError from './APIError'

export default class ConflictError extends APIError {
  constructor (code) {
    super(
      code,
      'The request could not be completed due to a conflict with the current'
        + ' state of the target resource',
      'Check your request and the state of the resource before resubmitting.',
    )

    this.status = 409
    this.name = 'ConflictError'

    Error.captureStackTrace(this, this.constructor)
  }
}
