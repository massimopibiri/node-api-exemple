/* eslint-disable camelcase */

import Sequelize, { DataTypes }  from 'sequelize'
import bcrypt         from 'bcryptjs'
import { getEnv }     from '../../utils'
import Model          from '../Model'

/**
 * @typedef  User
 * @property {string} id
 * @property {string} username The username used for loging in
 * @property {string} password_hash The password crypted with bcrypt
 * @property {string} firstname The firstname of the user
 * @property {string} lastname The lastname of the user
 * @property {string} email The email of the user
 * @property {boolean} is_admin boolean giving the user admin rights
 * @property {boolean} is_confirmed boolean indicating if the email is real
 * @property {timestamp} created_at timestamp managed by the database
 * @property {timestamp} updated_at timestamp managed by the database
 * @property {timestamp} deleted_at timestamp managed by the database
 */

export default class User extends Model {
  static init (sequelize) {
    return super.init({
      sequelize,
      tableName: 'users',
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
       * Authentication attributes
       */
      username: {
        type: 'citext',
        allowNull: false,
        unique: true,
        validate: {
          len: {
            args: 3,
            msg: 'Username must be at least 3 characters in length',
          },
        },
        search: true,
      },
      password_hash: {
        type: DataTypes.STRING,
        restricted: true,
      },
      password: {
        type: DataTypes.VIRTUAL,
        validate: {
          len: {
            args: 8,
            msg: 'Password must be at least 8 characters long',
          },
          is: {
            args: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
            msg: 'Password must include at least one number, one lowercase' +
              ' letter and one uppercase letter.',
          },
        },
      },

      /**
       * Personal attributes
       */
      firstname: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: 2,
            msg: 'Name must be at least 2 characters in length',
          },
        },
      },
      lastname: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: 2,
            msg: 'Name must be at least 2 characters in length',
          },
        },
      },
      email: {
        type: 'citext',
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: 'Email address must be valid',
          },
        },
        private: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
          // isNumeric: true,
          // len: {
          //   args: 9,
          //   msg: 'Phone must be at least 9 characters in length',
          // },
        },
        private: true,
      },
      jobtitle: {
        type: DataTypes.STRING,
        allowNull: true,
        // validate: {
        //   len: {
        //     args: 2,
        //     msg: 'Jobtitle must be at least 2 characters in length',
        //   },
        // },
      },
      department: {
        type: DataTypes.STRING,
        allowNull: true,
        // validate: {
        //   len: {
        //     args: 2,
        //     msg: 'Department must be at least 2 characters in length',
        //   },
        // },
      },

      /**
       * Flags
       */
      is_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        readOnly: true,
      },
      is_confirmed: {
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

    }
  }

  /* Disable eslint param reassign rule in hooks due to sequelize bad design */
  /* eslint-disable no-param-reassign */
  static get hooks () {
    return {
      beforeSave: user => {
        if (user.changed('password')) {
          return User.cryptPassword(user.password)
            .then(hash => { user.password_hash = hash })
        }
        if (user.changed('email')) {
          user.is_confirmed = false
        }
        return user
      },
    }
  }

  /**
   * Instance methods
   */

  /**
   * Verify a password
   *
   * Check a given string with the instance's hash password
   *
   * @param {string} password A string to compare
   *
   * @returns {boolean}
   */
  validatePassword (password) {
    return bcrypt.compareSync(password, this.password_hash)
  }

  /**
   * Generate a unique hash from the user
   *
   * Uses the user password and created date to generate a unique secret hash.
   * Could be used for encoding token or other server side security purposes.
   *
   * @returns {string} hash
   */
  secret () {
    const timestamp = new Date(this.created_at).getTime()
    return `${this.password_hash}-${timestamp}`
  }

  /**
   * Generate a confirm token for the user
   *
   * Uses the user email and created date to generate a unique confirm hash.
   *
   * @returns {string} hash
   */
  confirm () {
    const timestamp = new Date(this.created_at).getTime()
    return `${this.email}-${this.is_confirmed}-${timestamp}`
  }


  /**
   * Encrypt a password
   *
   * @param {string} password A string to encrypt
   *
   * @returns {Promise}
   */
  static cryptPassword (password) {
    /* istanbul ignore next */
    const rounds = getEnv('NODE_ENV') !== 'production' ? 2 : 13

    return new Promise((resolve, reject) => {
      bcrypt.hash(password, rounds, (err, hash) => (
        err ? reject(err) : resolve(hash)
      ))
    })
  }

  /**
   * Class methods
   */

  static associate (models) {
    const { Connection, Notif } = models
    User.hasMany(Connection, {as: 'Connections'})
    User.hasMany(Notif, {as: 'Notifs'})
  }
}
