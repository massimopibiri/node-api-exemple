import APIError from './APIError'

export default class MissingAuthorizationHeaderError extends APIError {
  constructor () {
    super(
      'missing_authorization_header',
      'Authorization header is missing, unable to authenticate',
      'An `Authorization` header with the `Bearer` scheme is required to'
        + ' authenticate the request.',
    )
    this.name = 'MissingAuthorizationHeaderError'
    // Error.captureStackTrace(this, this.constructor)

    this.status = 401
  }
}
