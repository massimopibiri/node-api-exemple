import faker from 'faker/locale/en'
import { Connection } from '../../src/db/models'
import Factory from './Factory'
import UserFactory from './UserFactory'

class ConnectionFactory extends Factory {
  constructor (attributes) {
    super(Connection, attributes)
  }

  static async randomize (attributes) {
    // create the users
    const user_1 = await UserFactory.create()
    const user_2 = await UserFactory.create()
    return Object.assign({}, {
      user_1: user_1.id,
      user_2: user_2.id,
      key: faker.random.alphaNumeric(10),
      used: false,
    }, attributes)
  }
}

export default ConnectionFactory
