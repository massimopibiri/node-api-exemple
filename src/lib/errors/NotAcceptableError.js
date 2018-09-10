import APIError from './APIError'

export default class NotAcceptableError extends APIError {
  constructor () {
    super(
      'not_acceptable',
      'The client Accept header content-type is not handled by this API',
      'This API only handles the following Content-Types : ' +
      ' `aplication/vnd.api+json`, `aplication/json`.',
    )
    this.name = 'NotAcceptableError'
    Error.captureStackTrace(this, this.constructor)

    this.status = 406
  }
}
