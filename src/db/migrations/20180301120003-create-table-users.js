const table = 'users'

export default {
  up: (queryInterface, Sequelize) => (
    queryInterface.createTable(table, {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        // defaultValue: Sequelize.UUIDV4,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },

      /*
       * Authentication attributes
       */

      username: {
        type: 'citext',
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      /*
       * Personal attributes
       */

      firstname: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      lastname: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: 'citext',
        allowNull: false,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      jobtitle: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      department: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      /*
       * Switches
       */

      is_admin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_confirmed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      /*
       * Timestamps
       */

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

    }).then(() => queryInterface.addIndex(table, ['is_admin']))
  ),
  down: queryInterface => (
    queryInterface.dropTable(table)
  ),
}
