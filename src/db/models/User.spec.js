import bcrypt                       from 'bcryptjs'
import { expect }                   from 'chai'
import { SequelizeValidationError } from 'sequelize'
import { sequelize, User }          from '.'
import { UserFactory }              from '../../../test/factories'

const publicAttributes = [
  'id', 'username', 'firstname', 'lastname', 'jobtitle', 'department', 'is_admin',
]
const mandatoryAttributes = ['username', 'password', 'email']
const searchableAttributes = ['username']

describe('Model User', () => {
  it('should create a User', () => (
    UserFactory.create().should.be.fulfilled.then(user => {
      expect(user).to.be.ok
      expect(user.id).to.have.length(36)
      expect(user.is_confirmed).to.be.false
      expect(user.is_admin).to.be.false
    })
  ))

  it('should ensure a unique case insensitive valid username', () => (
    UserFactory.create({ username: 'unique' }).should.be.fulfilled.then(() => (
      sequelize.Promise.all([
        UserFactory.create({ username: 'unique' })
          .should.be.rejectedWith(SequelizeValidationError),
        UserFactory.create({ username: 'Unique' })
          .should.be.rejectedWith(SequelizeValidationError),
        UserFactory.create({ username: 'no' })
          .should.be.rejectedWith(SequelizeValidationError),
      ])
    ))
  ))

  it('should ensure a unique case insensitive valid email', () => {
    const emails = ['wrong', 'wrong@wrong', '@wrong', '@wrong.com']
    return sequelize.Promise.all([
      sequelize.Promise.map(emails, email => (
        UserFactory.create({ email })
          .should.be.rejectedWith(SequelizeValidationError)
      )),
      UserFactory.create({ email: 'unique@mail.co' })
        .should.be.fulfilled.then(() => {
          UserFactory.create({ email: 'unique@mail.co' })
            .should.be.rejectedWith(SequelizeValidationError)
          UserFactory.create({ email: 'Unique@Mail.co' })
            .should.be.rejectedWith(SequelizeValidationError)
        }),
    ])
  })

  it('should ensure a strong password', () => {
    const passwords = ['weak', 'weaklong', 'Weaklong', 'w3aklong', 'We4kest']
    return sequelize.Promise.map(passwords, password => (
      UserFactory.create({ password })
        .should.be.rejectedWith(SequelizeValidationError)
    ))
  })

  context('Hooks', () => {
    context('beforeSave', () => {
      it('should encrypt the password', () => {
        const password = 'Test1234'
        return UserFactory.create({ password })
          .should.be.fulfilled.then(user => {
            user.password_hash.should.not.equal(password)
            bcrypt.compareSync(password, user.password_hash).should.be.true
          })
      })

      it('should unconfirm account on new email', () => (
        UserFactory.create({ is_confirmed: true }).should.be.fulfilled
          .then(user => {
            user.is_confirmed.should.be.true
            return user.update({ email: 'unconfirm@email.com' })
              .should.be.fulfilled
              .then(() => user.is_confirmed.should.be.false)
          })
      ))
    })
  })

  describe('Static methods', () => {
    it('should return public attributes', () => (
      User.publicAttributes.should.deep.equal(publicAttributes)
    ))

    it('should return mandatory attributes', () => (
      User.mandatoryAttributes.should.deep.equal(mandatoryAttributes)
    ))
    it('should return searchable attributes', () => (
      User.searchableAttributes.should.deep.equal(searchableAttributes)
    ))
  })

  describe('Class methods', () => {
    context('Password', () => {
      it('should generate a hash password', () => {
        const password = 'Hell0W0rld!'
        return User.cryptPassword(password).should.fulfilled.then(hash => {
          bcrypt.compareSync(password, hash).should.be.true
        })
      })

      it('should raised on error', () => (
        User.cryptPassword([]).should.be.rejected
      ))
    })
  })

  describe('Instance methods', () => {
    context('Password', () => {
      it('should validate a password', () => {
        const password = 'Hell0W0rld!'
        return UserFactory.create({ password })
          .should.fulfilled.then(user => {
            user.validatePassword(password).should.be.true
          })
      })
    })

    context('secret', () => {
      it('should return a secret string for the user', () => (
        UserFactory.create().should.fulfilled.then(user => {
          user.secret().should.match(/^\S+-\d+$/)
        })
      ))
    })

    context('confirm', () => {
      it('should return a confirm email string for the user', () => (
        UserFactory.create().should.fulfilled.then(user => {
          const re = new RegExp(`^${user.email}-false-\\d+$`)
          user.confirm().should.match(re)
        })
      ))
    })
  })
})
