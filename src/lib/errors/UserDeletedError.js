import APIError from './APIError'

export default class UserDeletedError extends APIError {
  constructor () {
    super(
      'user_deleted',
      'The user is deleted.',
      'The user you are trying to interact with has been deleted.',
    )
    this.name = 'UserDeletedError'
    Error.captureStackTrace(this, this.constructor)

    this.status = 401
  }
}
