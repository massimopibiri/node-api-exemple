export default {
  up: queryInterface => {
    const query = 'CREATE EXTENSION IF NOT EXISTS "citext";'
    return queryInterface.sequelize.query(query)
  },
}
