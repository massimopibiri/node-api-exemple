import APIError from './APIError'

export default class UnsupportedMediaTypeError extends APIError {
  constructor (type, expected) {
    super(
      'unsupported_media_type',
      `The media type ${type} is not supported by this API`,
      'The request Content-Type header is in a format not supported by'
      + ` this API. ${expected && `Please retry with ${expected}`}`,
    )
    this.name = 'UnsupportedMediaTypeError'
    Error.captureStackTrace(this, this.constructor)

    this.status = 415
  }
}
