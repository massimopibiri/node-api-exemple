import APIError from './APIError'

export default class RejectedTokenTypeError extends APIError {
  constructor (type = '') {
    super(
      'rejected_token_type',
      `The token type ${type} has been rejected.`,
      'The token provided is valid but its type does not grant you access ' +
        'to this resource or functionality.',
    )
    this.name = 'RejectedTokenTypeError'
    Error.captureStackTrace(this, this.constructor)

    this.status = 401
  }
}
