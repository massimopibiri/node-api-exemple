export default class AuthError extends Error {
  constructor (code) {
    super()

    const errors = {
      invalid_request: {
        error_description: 'Some parameters are malformed or missing.',
        error_uri: 'https://tools.ietf.org/html/rfc6749#section-4.3.2',
      },
      invalid_grant: {
        error_description: 'The Auth server was not able to authenticate you.',
      },
      unsupported_grant_type: {
        error_description: 'This authentication server supports only'
          + ' the `password` grant type.',
      },
    }

    this.raw = Object.assign({ error: code }, errors[code])

    this.name = 'AuthError'
    Error.captureStackTrace(this, this.constructor)

    this.status = 400
  }
}
