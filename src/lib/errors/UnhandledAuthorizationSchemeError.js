import APIError from './APIError'

export default class UnhandledAuthorizationSchemeError extends APIError {
  constructor () {
    super(
      'unhandled_authorization_scheme',
      'The Authorization scheme used is unhandled by this API',
      'You can only use the `Bearer` scheme for authenticating on this API.',
    )
    this.name = 'UnhandledAuthorizationSchemeError'
    // Error.captureStackTrace(this, this.constructor)

    this.status = 401
  }
}
