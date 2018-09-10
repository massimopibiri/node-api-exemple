import APIError from './APIError'

export default class NotFoundError extends APIError {
  constructor (message = null) {
    super(
      'not_found',
      'Resource Not Found',
      message || 'The resource you are trying to reach does not exist or'
        + ' has been disabled or deleted from our services.',
    )
    this.name = 'NotFoundError'
    Error.captureStackTrace(this, this.constructor)

    this.status = 404
  }
}
