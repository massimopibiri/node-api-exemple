export default {
  up: queryInterface => (
    queryInterface.bulkInsert('connections', [
      {
        key: 'sdjfkqjshdiuhhbdfgbkjqhkezfjqhkehqekzhfkjqsehrkq',
        used: false,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {})
  ),

  down: queryInterface => {
    /*
    queryInterface.bulkDelete('connections', [
      { user_id: 'bbbbbbbbbbbb' },
    ])
    */
  },
}
