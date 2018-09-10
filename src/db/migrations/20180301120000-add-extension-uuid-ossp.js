export default {
  up: queryInterface => {
    const query = 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    return queryInterface.sequelize.query(query)
  },
}
