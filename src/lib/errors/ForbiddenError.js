import APIError from './APIError'

export default class ForbiddenError extends APIError {
  constructor (message = null) {
    super(
      'forbidden',
      'Resource Access Forbidden',
      message || 'You are not allowed to access this resource with the token'
        + ' or credentials you have provided.',
    )
    this.name = 'ForbiddenError'
    Error.captureStackTrace(this, this.constructor)

    this.status = 403
  }
}
