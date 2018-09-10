import faker    from 'faker/locale/en'
import { User } from '../../src/db/models'
import Factory  from './Factory'

class UserFactory extends Factory {
  constructor (attributes) {
    super(User, attributes)
  }

  static async randomize (attributes) {
    return Object.assign({}, {
      firstname: `${faker.name.firstName()}`,
      lastname: `${faker.name.lastName()}`,
      username: faker.internet.userName(),
      email: `${faker.random.alphaNumeric(10)}${'@test.com'}`,
      jobtitle: faker.name.jobTitle(),
      department: faker.commerce.department(),
      phone: faker.phone.phoneNumber(),
      is_admin: false,
      is_confirmed: false,
      password: 'PassW0rd',
    }, attributes)
  }
}

export default UserFactory
