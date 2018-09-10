import APIError from './APIError'

export default class MalformattedAuthorizationHeaderError extends APIError {
  constructor () {
    super(
      'malformatted_authorization_header',
      'The Authorization header is malformatted and cannot be parsed.',
      'Please refer to the RFC 7235 on how to format the header,'
       + ' you need to provide a scheme to authenticate on this API.',
    )
    this.name = 'MalformattedAuthorizationHeaderError'
    // Error.captureStackTrace(this, this.constructor)

    this.status = 401
  }
}
