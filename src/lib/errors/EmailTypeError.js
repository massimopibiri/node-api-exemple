import { types } from '../helpers/email'

export default class EmailTypeError extends Error {
  constructor (invalidType, ...params) {
    super(...params)

    Error.captureStackTrace(this, this.constructor)

    this.invalid_type = invalidType
    this.message = `Email type "${invalidType}" is invalid`
    this.code = 1002
    this.description = `You can only use the types ${types}`
  }
}
