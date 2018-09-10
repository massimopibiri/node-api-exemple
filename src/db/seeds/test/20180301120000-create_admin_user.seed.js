export default {
  up: queryInterface => (
    queryInterface.bulkInsert('users', [
      {
        firstname: 'Admin',
        lastname: 'admin',
        username: 'admin',
        is_admin: true,
        is_confirmed: true,
        email: 'admin_test@test.com',
        password_hash: 'password',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        firstname: 'Common User',
        lastname: 'user',
        username: 'user',
        is_admin: false,
        is_confirmed: true,
        email: 'user_test@test.com',
        password_hash: 'password',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], {})
  ),

  down: queryInterface => {
    queryInterface.bulkDelete('users', [
      { username: 'admin' },
      { username: 'user' },
    ])
  },
}
