import uuidv4 from 'uuid/v4'
// import sinon  from 'sinon'
import { expect } from 'chai'

import { request as req } from '../../../test/setup'
import {
  helper,
  badRequestErrorSample,
}                         from '../../../test/setup/helpers'
import { User }           from '../../db/models'
// import { EmailHelper }    from '../../lib/helpers'
import { UserFactory }    from '../../../test/factories'

const publicAttributes = [
  'id', 'username', 'firstname', 'lastname', 'jobtitle', 'department', 'is_admin',
]
const ownerAttributes = publicAttributes.concat([
  'is_confirmed', 'phone', 'email',
])

const basePath = '/users'
// const type = 'users'
// let resource
let user

describe('/users routes', () => {
  context('POST /users', () => {
    it('should return 201 and create a user', async () => {
      // const sendStub = sinon.stub(EmailHelper, 'send')
      // sendStub.returnsPromise().resolves({})
      const newUser = await UserFactory.generate()
      const opts = { auth: false, payload: newUser.payload() }

      return req('post', '/users/', opts).should.be.fulfilled
        .then(res => {
          const { attributes } = newUser
          const sample = ownerAttributes.reduce((acc, key) =>
            ({ [key]: attributes[key], ...acc }), { id: res.body.data.id })
          // sendStub.should.have.been.called
          // sendStub.restore()
          return helper.test.response(res, 201, sample, 'users')
        })
    })

    it('should return 201 and create a user without password', async () => {
      // const sendStub = sinon.stub(EmailHelper, 'send')
      // sendStub.returnsPromise().resolves({})
      const resource = await UserFactory.generate()
      delete resource.attributes.password
      const opts = { auth: false, payload: resource.payload() }
      return req('post', '/users/', opts).should.be.fulfilled
        .then(res => {
          const { attributes } = resource
          const sample = ownerAttributes.reduce((acc, key) =>
            ({ [key]: attributes[key], ...acc }), { id: res.body.data.id })
          // sendStub.should.have.been.called
          // sendStub.restore()
          return helper.test.response(res, 201, sample, 'users')
        })
    })

    it('should return 400 on duplicate attributes', () => {
      const duplicateValues = {
        email: 'duplicate.test@email.com',
        username: 'duplicate.test',
      }

      return Promise.all(Object.keys(duplicateValues).map(duplicate => {
        const sample = [{
          status: 400,
          code: 'db_unique_violation',
          title: `${duplicate} unique violation`,
          detail: `${duplicate} must be unique`,
          source: { pointer: `/data/attributes/${duplicate}` },
        }]
        const attributes = { [duplicate]: duplicateValues[duplicate] }

        return UserFactory.create(attributes).should.be.fulfilled
          .then(() => UserFactory.generate(attributes).should.be.fulfilled
            .then(resource => {
              const opts = { auth: false, payload: resource.payload() }
              return req('post', '/users/', opts).should.be.rejected
                .then(error => {
                  helper.test.error.jsonapi(error.response, 400, sample)
                })
            }))
      }))
    })

    it('should return 400 on missing attributes', () => (
      Promise.all(User.mandatoryAttributes
        .filter(attribute => attribute !== 'password')
        .map(async attribute => {
          const resource = await UserFactory.generate()
          const payload = { ...resource.payload() }
          delete payload.attributes[attribute]
          const sample = badRequestErrorSample('missing_parameter', attribute)

          return req('post', '/users/', { payload })
            .should.be.rejected.then(error => {
              helper.test.error.jsonapi(error.response, 400, [sample])
            })
        }))
    ))

    it('should return 400 on invalid attributes', () => {
      const invalidValues = {
        username: 'fo',
        password: 'weaksecret',
        firstname: 'f',
        lastname: 'f',
      }

      return Promise.all(Object.keys(invalidValues).map(async attribute => {
        const attributes = { [attribute]: invalidValues[attribute] }
        const resource = await UserFactory.generate(attributes)
        const sample = {
          code: 'db_validation_error',
          title: `${attribute} validation error`,
          detail: null,
          status: 400,
          source: { pointer: `/data/attributes/${attribute}` },
        }

        return req('post', '/users/', { payload: resource.payload() })
          .should.be.rejected.then(error => {
            helper.test.error.jsonapi(error.response, 400, sample)
          })
      }))
    })

    it('should return 400 on invalid email format', () => {
      const email = 'bad_email.com'
      return UserFactory.generate({ email }).should.be.fulfilled
        .then(resource => {
          const sample = badRequestErrorSample(
            'malformed_email',
            'email',
            email,
          )

          const opts = { auth: false, payload: resource.payload() }
          return req('post', '/users/', opts).should.be.rejected
            .then(error => {
              helper.test.error.jsonapi(error.response, 400, [sample])
            })
        })
    })
  })

  context('GET /users/:id', () => {
    beforeEach(() => (
      UserFactory.create().should.be.fulfilled.then(res => { user = res })
    ))

    it('should return a user with its public attributes', () => {
      const attributes = user.get()
      const sample = publicAttributes.reduce((res, key) =>
        ({ [key]: attributes[key], ...res }), {})

      return req('get', `/users/${user.id}`).should.be.fulfilled.then(res => {
        helper.test.response(res, 200, sample, 'users')
      })
    })

    it('should return a user own profile with full attributes', () => {
      const attributes = user.get()
      const sample = ownerAttributes.reduce((res, key) =>
        ({ [key]: attributes[key], ...res }), {})

      const opts = { self: user }
      return req('get', `/users/${user.id}`, opts).should.be.fulfilled
        .then(res => helper.test.response(res, 200, sample, 'users'))
    })

    it('should return 404 if the user id does not exist', () => {
      const errcode = 'not_found'
      return req('get', `/users/${uuidv4()}`)
        .catch(err => {
          helper.test.error.jsonapi(err.response, errcode)
        })
    })

    it('should return 404 if the user is deleted', () => {
      const errcode = 'not_found'
      const attributes = { deleted_at: '1982-07-22 19:00:00' }
      return UserFactory.create(attributes).should.be.fulfilled
        .then(resource => (
          req('get', `/users/${resource.id}`)
            .catch(err => helper.test.error.jsonapi(err.response, errcode))
        ))
    })

    it('should return a 401 if missing Authorization header', () => {
      const errcode = 'missing_authorization_header'
      return req('get', `/users/${user.id}`, { auth: false })
        .catch(err => helper.test.error.jsonapi(err.response, errcode))
    })
  })

  context('GET /users', () => {
    beforeEach(() => User.destroy({ where: {} }))

    it('should return a list of users with their public attributes', () => (
      UserFactory.bulkCreate(30, { lastname: 'testlist' }).then(() => (
        req('get', '/users/').should.be.fulfilled.then(res => {
          res.body.data.length.should.equal(20)
          helper.test.response(res, 200, publicAttributes, 'users')
        })
      ))
    ))

    it('should filter results based on criterias', () => (
      UserFactory.bulkCreate(10).then(() => (
        UserFactory.create({ username: 'filtertest' }).then(() => {
          const opts = { query: { filter: { username: 'filtertest' } } }
          return req('get', '/users/', opts).should.be.fulfilled.then(res => {
            res.body.data.length.should.equal(1)
            helper.test.response(res, 200, publicAttributes, 'users')
            res.body.data[0].attributes.username.should.equal('filtertest')
          })
        })
      ))
    ))

    it('should limit the number of results returned', () => (
      UserFactory.bulkCreate(10).then(() => {
        const opts = { query: { page: { limit: 3 } } }
        return req('get', '/users/', opts).should.be.fulfilled.then(res => {
          res.body.data.length.should.equal(3)
          helper.test.response(res, 200, publicAttributes, 'users')
        })
      })
    ))

    it('should handle empty results', () => (
      UserFactory.bulkCreate(10).then(() => {
        const opts = { query: { filter: { username: 'emptyresulttest' } } }
        return req('get', '/users/', opts).should.be.fulfilled.then(res => {
          res.status.should.equal(200)
          res.body.data.should.be.an('array').that.is.empty
        })
      })
    ))

    it('should return only updated results since last query', () => (
      UserFactory.bulkCreate(10).then(() => {
        const timestamp = Date.now()
        return UserFactory.bulkCreate(6).then(() => {
          const opts = { query: { update: timestamp } }
          return req('get', '/users/', opts).should.be.fulfilled.then(res => {
            res.body.data.length.should.equal(6)
            helper.test.response(res, 200, publicAttributes, 'users')
          })
        })
      })
    ))

    it('should return only none-deleted users', () => {
      const attributes = { title: 'test_deleted' }
      return Promise.all([
        UserFactory.bulkCreate(4, { ...attributes, deleted_at: '1980-09-13 18:00:00' }),
        UserFactory.bulkCreate(2, attributes),
      ]).then(() => {
        const opts = { query: { filter: attributes } }
        return req('get', basePath, opts).should.be.fulfilled.then(res => {
          res.body.data.length.should.equal(2)
          helper.test.response(res, 200, publicAttributes, 'users')
        })
      })
    })

    it('should paginate query', () => (
      Promise.all(Array.from({ length: 10 }, (_, i) =>
        UserFactory.create({ username: `user_${i}` }))).then(() => {
        const timestamp = Date.now()
        const opts = { query: { page: { limit: 3 }, sort: '-username' } }
        return req('get', basePath, opts).should.be.fulfilled.then(res => {
          res.body.data.length.should.equal(3)
          res.body.data[0].attributes.username.should.equal('user_9')
          res.body.data[1].attributes.username.should.equal('user_8')
          res.body.data[2].attributes.username.should.equal('user_7')
          helper.test.response(res, 200, publicAttributes, 'users')
          const firstPage = res.body.data
          return Promise.all([
            User.update(
              { username: 'user_5bis' },
              { where: { id: firstPage[0].id } },
            ),
            User.update(
              { deleted_at: Date.now() },
              { where: { id: firstPage[1].id } },
            ),
            UserFactory.create({ username: 'user_10' }),
            UserFactory.create({ username: 'user_5ter' }),
          ]).then(() => {
            const cursor = {
              username: firstPage[2].attributes.username,
            }
            const page = { timestamp, cursor, limit: 3 }
            const opts2 = { query: { page, sort: '-username' } }
            return req('get', basePath, opts2).should.be.fulfilled
              .then(res2 => {
                res2.body.data.length.should.equal(3)
                res2.body.data[0].attributes.username.should.equal('user_6')
                res2.body.data[1].attributes.username.should.equal('user_5')
                res2.body.data[2].attributes.username.should.equal('user_4')
              })
          })
        })
      })
    ))
  })

  context('PATCH /users/:id', () => {
    beforeEach(() => (
      UserFactory.create().should.be.fulfilled.then(res => { user = res })
    ))

    it('should update its own attributes', () => {
      const attributes = {
        username: 'updated_username',
        firstname: 'updated name',
        lastname: 'updated name',
        phone: '0123456789',
      }
      return Promise.all(Object.keys(attributes).map(attr => (
        UserFactory.create().should.be.fulfilled
          .then(resource => {
            const payload = {
              id: resource.id,
              type: 'users',
              attributes: {
                [attr]: attributes[attr],
              },
            }
            const opts = { self: resource, payload }

            return req('patch', `/users/${resource.id}`, opts)
              .should.be.fulfilled.then(res => {
                res.status.should.equal(204)
                return User.findById(resource.id).should.be.fulfilled
                  .then(updatedUser => {
                    updatedUser[attr].should.equal(attributes[attr])
                  })
              })
          })
      )))
    })

    it('should reject on restricted attributes', () => {
      const attributes = {
        // password: 'fooBar1234',
        password_hash: 'foobar',
        is_admin: true,
        is_confirmed: true,
        deleted_at: '2001-01-01 12:00:00',
        created_at: '2000-01-01 12:00:00',
      }

      return Promise.all(Object.keys(attributes).map(attr => {
        const payload = {
          id: user.id,
          type: 'users',
          attributes: {
            [attr]: attributes[attr],
          },
        }
        const opts = { self: user, payload }

        return req('patch', `/users/${user.id}`, opts)
          .should.be.rejected.then(async error => {
            const sample = [
              badRequestErrorSample(
                'invalid_attribute',
                attr,
                attributes[attr],
              ),
            ]
            helper.test.error.jsonapi(error.response, 400, sample)
            const resource = await User.findById(user.id)

            return (attr !== 'password')
              && expect(resource.get(attr)).to.not.equal(attributes[attr])
          })
      }))
    })

    it('should update attributes with an admin right', () => {
      const attributes = {
        username: 'updated_username2',
        firstname: 'updated name',
        lastname: 'updated name',
        phone: '098334477585',
      }
      return Promise.all(Object.keys(attributes).map(attr => {
        const payload = {
          id: user.id,
          type: 'users',
          attributes: {
            [attr]: attributes[attr],
          },
        }
        const opts = { admin: true, payload }

        return req('patch', `/users/${user.id}`, opts).should.be.fulfilled
          .then(res => {
            res.status.should.equal(204)
            User.findById(user.id).should.be.fulfilled.then(resource => {
              resource[attr].should.equal(attributes[attr])
            })
          })
      }))
    })

    it('should reject access with a 403 to any other users', () => (
      req('patch', `/users/${user.id}`)
        .catch(err => helper.test.error.jsonapi(err.response, 'forbidden'))
    ))

    it('should return 404 if the user id does not exist', () => {
      const errcode = 'not_found'
      return req('patch', `/users/${uuidv4()}`)
        .catch(err => {
          helper.test.error.jsonapi(err.response, errcode)
        })
    })

    it('should return 404 if the user is deleted', () => {
      const errcode = 'not_found'
      const attributes = { deleted_at: '2000-01-01 12:00:00' }
      return UserFactory.create(attributes).should.be.fulfilled
        .then(resource => (
          req('patch', `/users/${resource.id}`)
            .catch(err => helper.test.error.jsonapi(err.response, errcode))
        ))
    })

    it('should return a 401 if missing Authorization header', () => {
      const errcode = 'missing_authorization_header'
      return req('patch', `/users/${user.id}`, { auth: false })
        .catch(err => helper.test.error.jsonapi(err.response, errcode))
    })
  })

  context('DELETE /users/:id', () => {
    it('should be able to deactivate its own account', () => (
      UserFactory.create().should.be.fulfilled.then(resource => (
        req('delete', `/users/${resource.id}`, { self: resource })
          .should.be.fulfilled.then(res => res.should.have.status(204))
      ))

      // test the user token has been invalidated right away
      // test if the user in the database is deleted
    ))

    it('should be able to deactivate a user with an admin right', () => (
      UserFactory.create().should.be.fulfilled.then(resource => (
        req('delete', `/users/${resource.id}`, { admin: true })
          .should.be.fulfilled.then(res => res.should.have.status(204))
      ))

      // test the user token has been invalidated right away
      // test if the user in the database is deleted
    ))

    it('should return a 401 if missing Authorization header', () => {
      const errcode = 'missing_authorization_header'
      return UserFactory.create().should.be.fulfilled.then(resource => (
        req('delete', `/users/${resource.id}`, { auth: false })
          .catch(err => helper.test.error.jsonapi(err.response, errcode))
      ))
    })

    it('should reject access with a 403 to any other users', () => (
      UserFactory.create().should.be.fulfilled.then(resource => (
        req('delete', `/users/${resource.id}`)
          .catch(err => helper.test.error.jsonapi(err.response, 'forbidden'))
      ))
    ))

    it('should return 404 if the user id does not exist', () => (
      req('delete', `/users/${uuidv4()}`)
        .catch(err => helper.test.error.jsonapi(err.response, 'not_found'))
    ))

    it('should return 404 if the user is already disabled', () => {
      const attrs = { deleted_at: '2000-01-01 12:00:00' }
      return UserFactory.create(attrs).should.be.fulfilled.then(resource => (
        req('delete', `/users/${resource.id}`)
          .catch(err => helper.test.error.jsonapi(err.response, 'not_found'))
      ))
    })
  })
})
