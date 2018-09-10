import { getEnv } from '../../../utils'
import { User }   from '../../models'

export default {
  up: queryInterface => (
    User.cryptPassword(getEnv('ADMIN_PASSWORD'))
      .then(password => queryInterface.bulkInsert('users', [{
        firstname: 'Admin',
        lastname: 'admin',
        username: 'admin',
        is_admin: true,
        is_confirmed: true,
        email: getEnv('ADMIN_EMAIL'),
        password_hash: password,
        created_at: new Date(),
        updated_at: new Date(),
      }], {}))
  ),

  down: queryInterface => {
    queryInterface.bulkDelete('users', [{ username: 'Admin' }], {})
  },
}
