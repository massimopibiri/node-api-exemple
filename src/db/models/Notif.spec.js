import bcrypt                       from 'bcryptjs'
import { expect }                   from 'chai'
import { SequelizeValidationError } from 'sequelize'
import { sequelize, Connections }   from '.'
import { ConnectionFactory }        from '../../../test/factories'

const publicAttributes = [
  'id', 'user_id', 'kind', 'arg', 'used', 'updated_at', 'updated_at',
]
const mandatoryAttributes = ['user_id']
const searchableAttributes = ['user_id']

describe('Model Connections', () => {
  it('should create a Connection', () => (
    ConnectionFactory.create().should.be.fulfilled.then(connection => {
      expect(connection).to.be.ok
      expect(connection.id).to.have.length(36)
      expect(connection.used).to.be.false
    })
  ))
})
