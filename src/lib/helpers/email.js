import SparkPost          from 'sparkpost'
import { EmailTypeError } from '../errors'
import { getEnv }         from '../../utils'
import { User }           from '../../db/models'

const apiKey = getEnv('SPARKPOST_API_KEY')
const sparkPostClient = new SparkPost(apiKey)

export const types = ['signup', 'contact', 'recover']

/**
 * Send a transactional email through SparkPost API
 *
 * @param {string} type Email type (sparkpost template id) to send with
 * @param {User} user a User object to send the email to
 * @param {object} data an object with substitution data for the template
 *
 * @throws {EmailTypeError} If a template type is not defined
 * @throws {Error} If a User instance is not passed
 *
 * @returns {Promise} the Promise from SparkPost().transmission.send()
 */
export const send = (type, user, data) => (
  new Promise((resolve, reject) => {
    types.includes(type) || reject(new EmailTypeError(type))
    user instanceof User || reject(new TypeError('expect user to be a User'))

    sparkPostClient.transmissions.send({
      options: {
        sandbox: false,
      },
      content: {
        template_id: type,
      },
      substitution_data: data,
      recipients: [
        { address: user.email },
      ],
    })
      .then(res => resolve(res))
      .catch(error => reject(error))
  })
)

export default { types, send }
