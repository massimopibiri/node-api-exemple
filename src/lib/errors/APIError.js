export default class APIError extends Error {
  constructor (code, title, detail) {
    super()
    // Hardcoding name, else can be mangled if the code is
    // later minified/obfuscated.
    this.name = 'APIError'

    // Useful to remove the stacktrace line relative to the throwing of
    // this error. Must be included in all errors which extend it.
    Error.captureStackTrace(this, this.constructor)

    this.status = 500
    this.code = code || 'api_error'
    this.title = title || 'Fatal API Error'
    this.detail = detail || 'The API encountered a fatal error. An alert has' +
      ' been raised to our administrators.' +
      ' You can alternatively contact our support.'
  }

// render() {
//   return {
//     'status': this.status,
//     'code': this.code,
//     // 'source': %{
//     //   pointer: "/data/attributes/#{field}",
//     //   parameter: field
//     // },
//     'title': this.title,
//     'detail': this.detail
//   }
// }
}
