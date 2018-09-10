import APIError from './APIError'

export default class MissingTokenTypeError extends APIError {
  constructor () {
    super(
      'missing_token_type',
      'The token needs an attribute type in its payload.',
      'Please refer to the API doc for valid token types.',
    )
    this.name = 'MissingTokenTypeError'
    Error.captureStackTrace(this, this.constructor)

    this.status = 401
  }
}
