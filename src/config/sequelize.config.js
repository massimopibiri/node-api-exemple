export default {
  [process.env.NODE_ENV]: {
    operatorsAliases: false,
    url: process.env.DATABASE_URL,
    dialect: 'psql',
  },
  // Override the test environment
  test: {
    operatorsAliases: false,
    url: `${process.env.DATABASE_URL}_test`,
    dialect: 'psql',
  },
}
