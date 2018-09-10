/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
/* eslint-disable no-console */

import fs                     from 'fs'
import path                   from 'path'
import Sequelize              from 'sequelize'
import { capitalize, getEnv } from '../../utils'

const basename = path.basename(module.filename)

let db = getEnv('DATABASE_URL')
/* istanbul ignore next */
if (getEnv('NODE_ENV') === 'test') db = `${getEnv('DATABASE_URL')}_test`

/* istanbul ignore next */
const sequelizeOptions = {
  operatorsAliases: false,
  dialect: 'psql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
}

export const sequelize = new Sequelize(db, sequelizeOptions)

const models = Object.assign(
  {},
  ...fs.readdirSync(__dirname)
    .filter(file => file !== basename && !file.match(/\.(spec|test)\.js$/))
    .map(file => {
      const model = require(path.join(__dirname, file)).init(sequelize)
      module.exports[capitalize(model.name)] = model
      return { [capitalize(model.name)]: model }
    }),
)

Object.keys(models).forEach(model => {
  /* istanbul ignore next */
  (typeof models[model].associate === 'function') &&
    models[model].associate(exports)
})

export default sequelize
