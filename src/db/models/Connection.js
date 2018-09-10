/* eslint-disable camelcase */

import { DataTypes }  from 'sequelize'
import bcrypt         from 'bcryptjs'
import { getEnv }     from '../../utils'
import Model          from '../Model'

/**
 * @typedef  Connection
 * @property {string} id
 * @property {string} user_1 The userId of the first user
 * @property {string} user_2 The userId of the second user
 * @property {string} key A unique key to encrypt the connection
 * @property {boolean} used if the document was already modified
 * @property {timestamp} created_at timestamp managed by the database
 * @property {timestamp} updated_at timestamp managed by the database
 * @property {timestamp} deleted_at timestamp managed by the database
 */

export default class Connection extends Model {
  static init (sequelize) {
    return super.init({
      sequelize,
      tableName: 'connections',
      timestamps: true,
      underscored: true,
      paranoid: true,
      hooks: this.hooks,
      rejectOnEmpty: true,
    })
  }

  static get modelAttributes () {
    return {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      /**
       * Users to connect
       */
      key: {
        type: DataTypes.STRING,
        allowNull: true,
        readOnly: true,
        restricted: true,
      },

      /**
       * Flags
       */
      used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        private: true,
        readOnly: true,
      },

      /**
       * Timestamps
       */
      created_at: {
        type: DataTypes.DATE,
        readOnly: true,
        restricted: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        readOnly: true,
        restricted: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        readOnly: true,
        restricted: true,
      },

      /*
       * Relationships
       */

      user_id: {
        type: DataTypes.STRING,
        readOnly: true,
      },
      /*
      user_2: {
        type: DataTypes.STRING,
        allowNull: true,
        private: true,
        validate: {
          len: {
            args: 3,
            msg: 'UserId must be at least 3 characters in length',
          },
        },
        search: true,
      },
      */
    }
  }

  /* eslint-disable no-param-reassign */
  static get hooks () {
    /*
    return {
      beforeCreate: connection => {
        return Connection.createKey()
        .then(
          newKey => {
            connection.key = newKey
          }
        )
        return connection
      }
    }
    */
  }

  /**
   * Create a unique key to encrypt data (for futur use)
   *
   * @returns {Promise}
   */
   /*
  static createKey () {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(1, (err, key) => (
        err ? reject(err) : resolve(key)
      ))
    })
  }
  */

  /*
   * Class methods
   */

  static associate (models) {
    const { User } = models
    // User.hasOne(Device)
    Connection.belongsTo(User)
  }
}

