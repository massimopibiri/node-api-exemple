const table = 'connections'

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
       * Users to connect
       */
      key: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      /*
       * Switches
       */

      used: {
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


      /*
       * Foreign keys
       */

      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        onUpdate: 'RESTRICT',
        onDelete: 'CASCADE',
        references: {
          model: 'connections',
          key: 'id',
          as: 'connections_id',
        },
      },
      /*
      user_2: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      */

    }).then(() => queryInterface.addIndex(table, ['used']))
  ),
  down: queryInterface => (
    queryInterface.dropTable(table)
  ),
}
