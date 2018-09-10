import APIError from './APIError'

export default class UnauthorizedError extends APIError {
  constructor (message = '') {
    super(
      'unauthorized',
      'You did not provide valid authentication credentials',
      message,
    )
    this.name = 'UnauthorizedError'
    Error.captureStackTrace(this, this.constructor)

    this.status = 401
  }
}
