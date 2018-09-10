import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import APIError from './APIError'

export default class TokenError extends APIError {
  constructor (error) {
    if (error instanceof TokenExpiredError) {
      super(
        'expired_token',
        'The token you provided is expired.',
        `The token expired on ${new Date(error.expiredAt * 1000)}.`,
      )
    } else if (error instanceof JsonWebTokenError) {
      super(
        'invalid_token',
        'The token you provided was invalid.',
        `We were unable to validate your token, reason : ${error.message}.`,
      )
    } else {
      /* istanbul ignore next */
      super(
        'token_error',
        'The token you provided cannot be verified.',
        'We were unable to validate your token.',
      )
    }

    this.name = 'TokenError'
    if (error) this.stacktrace = error.stacktrace
    Error.captureStackTrace(this, this.constructor)

    this.status = 401
  }
}
