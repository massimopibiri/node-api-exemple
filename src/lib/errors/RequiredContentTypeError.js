import APIError from './APIError'

export default class RequiredContentTypeError extends APIError {
  constructor () {
    super(
      'required_content_type',
      'A Content-Type header is required for this method.',
      'This API requires HTTP methods with a payload body to explicitely'
      + 'define a Content-Type header with the request.',
    )
    this.name = 'RequiredContentTypeError'
    Error.captureStackTrace(this, this.constructor)

    this.status = 400
  }
}
