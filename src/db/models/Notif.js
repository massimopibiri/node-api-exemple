/* eslint-disable camelcase */

import { DataTypes }  from 'sequelize'
import bcrypt         from 'bcryptjs'
import { getEnv }     from '../../utils'
import Model          from '../Model'

/**
 * @typedef  Connection
 * @property {string} id
 * @property {string} kind personal or group or broadcast
 * @property {string} arg update, warning, news, profileUp, etc
 * @property {string} read to allow or not a second read
 * @property {timestamp} created_at timestamp managed by the database
 * @property {timestamp} updated_at timestamp managed by the database
 * @property {timestamp} deleted_at timestamp managed by the database
 */

export default class Notif extends Model {
  static init (sequelize) {
    return super.init({
      sequelize,
      tableName: 'notifs',
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
       * basic infos
       */
      kind: {
        type: DataTypes.STRING,
        defaultValue: 'personal',
        readOnly: true,
      },
      arg: {
        type: DataTypes.STRING,
        defaultValue: 'warning',
        readOnly: true,
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
    return {
      beforeCreate: notification => {
        /*
        return Connection.createKey() // ===>>> ACTUALLY DISABLED
        .then(
          newKey => {
            connection.key = newKey
          }
        )
        */
        return notification
      }
    }
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
    Notif.belongsTo(User)
  }
}

