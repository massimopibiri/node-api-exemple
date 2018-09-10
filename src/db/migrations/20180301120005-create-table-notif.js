const table = 'notifs'

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

      /**
       * basic infos
       */
      kind: {
        type: Sequelize.STRING,
        defaultValue: 'personal',
        // allowNull: false,
      },
      arg: {
        type: Sequelize.STRING,
        defaultValue: 'warning',
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'notifs',
          key: 'id',
          as: 'notifs_id',
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
