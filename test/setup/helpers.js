/* eslint no-console: 0 */

// import chai, { expect } from 'chai'
// import chaiHttp         from 'chai-http'
// import chaiAsPromised   from 'chai-as-promised'
// import chaiExclude      from 'chai-exclude'
// import chaiMatch        from 'chai-match'
// import sinon            from 'sinon'
// import sinonChai        from 'sinon-chai'
// import sinonStubPromise from 'sinon-stub-promise'
// import faker            from 'faker/locale/en'
// import prepare          from 'mocha-prepare'
// import mock             from 'node-mocks-http'

// import server                           from '../../src/server'
// import { sequelize, User }              from '../../src/db/models'
import { getEnv, isString }             from '../../src/utils'
// import { createTokenForUser }           from '../../src/lib/helpers/auth'
import errors                           from './errors'

const badRequestErrorSample = (code, attribute, value) => {
  const attrFullPath = `/data/attributes/${attribute}`
  const details = {
    malformed_email: {
      title: `${attribute} is not a valid email`,
      detail: `An error occurred, related to the attribute ${attribute}`
        + ` of value '${value}'. Please refer to the API Doc.`,
    },
    invalid_parameter: {
      title: `${attribute} has an invalid value`,
      detail: `An error occurred, related to the attribute ${attribute}`
        + ` of value '${value}'. Please refer to the API Doc.`,
    },
    invalid_attribute: {
      title: `${attribute} is not a valid attribute`,
      detail: `An error occurred, related to the attribute ${attribute}`
        + ` of value '${value}'. Please refer to the API Doc.`,
    },
    missing_parameter: {
      title: `${attribute} is a mandatory parameter`,
      detail: `An error occurred, related to the attribute ${attribute}`
        + " of value 'undefined'. Please refer to the API Doc.",
    },
    insufficient_permissions: {
      title: `${attribute} is not modifiable with your permissions level`,
      detail: `An error occurred, related to the attribute ${attribute}`
        + ` of value '${value}'. Please refer to the API Doc.`,
    },
  }

  const sample = {
    status: 400,
    code,
    source: { pointer: attrFullPath },
  }
  Object.assign(sample, details[code])

  return sample
}

const helper = {
  test: {
    /**
     * Generic http response testing function
     *
     * @param {Object} res - Express response object
     * @param {number} status - http status code
     * @param {object} [attributes] - response attributes sample to compare
     * @param {string} [type] - resource type
     */

    response: (res, status, attributes = null, type = null) => {
      res.should.have.status(status)
      res.body.should.be.a('object')

      if (type) {
        res.should.have.header('Content-Type', 'application/vnd.api+json')
        res.body.should.have.property('jsonapi')
        res.body.jsonapi.should.have.property('version')
        res.body.jsonapi.version.should.equal('1.0')
        res.body.should.have.property('data')

        const { data } = res.body
        const resource = Array.isArray(data) ? data[0] : data
        resource.should.have.property('id')
        resource.should.have.property('type')
        resource.type.should.equal(type)
        resource.should.have.property('attributes')
        if (attributes) helper.test.attributes(resource.attributes, attributes)

        if (!Array.isArray(data)) {
          const location = `${getEnv('API_URL')}/${type}/${resource.id}`
          resource.should.have.property('links')
          resource.links.should.have.property('self')
          resource.links.self.should.equal(location)
          if (status === 201) {
            res.should.have.header('Location', location)
          }
        }
      } else {
        res.should.have.header('Content-Type', /^application\/json/)
        if (attributes) helper.test.attributes(res.body, attributes)
      }
    },

    error: {
      /**
       * raw http error testing function
       *
       * @param {Object} res - Express response object
       * @param {string} status - error http status code
       * @param {object} [sample] - errors property sample to compare with
       */

      raw: (res, status, sample = null) => {
        res.get('Content-Type').should.match(/^application\/json/)
        res.should.have.status(status)
        const payload = isString(res.body) ? JSON.parse(res.body) : res.body
        payload.should.be.a('object')
        payload.should.have.property('error')
        payload.should.deep.include(sample)
      },

      /**
       * jsonapi http error testing function
       *
       * @param {Object} res - Express response object
       * @param {string} status - error http status code
       * @param {object} [sample] - errors property sample to compare with
       * @param {object} [reqBody] - original request body to compare with
       */

      jsonapi: (res, code, sample = errors[code], reqBody = null) => {
        res.get('Content-Type').should.equal('application/vnd.api+json')
        res.body.should.be.a('object')
        res.body.should.have.property('errors')
        res.body.errors.should.be.a('array')
        if (Array.isArray(sample)) {
          res.should.have.status(sample[0].status)
          res.body.should.have.deep.property('errors', sample)
        }  else {
          res.should.have.status(sample.status)
          helper.test.compare(res.body.errors[0], sample)
        }

        if (res.status === 400) {
          res.body.should.have.property('meta')
          res.body.meta.should.have.property('request')
          if (reqBody) res.body.meta.request.should.equal(reqBody)
        }
      },
    },

    /**
     * object comparison helper
     *
     * Some attributes can be excluded by setting them to `null`
     *
     * @param {object} object - object on which apply the test
     * @param {object} attributes
     */

    compare: (object, attributes) => (
      Object.entries(attributes).reduce((test, [k, v]) => (
        (v === null) ? test.excludingEvery(k) : test
      ), object.should).deep.equal(attributes)
    ),

    /**
     * jsonapi attributes testing helper
     *
     * Some attributes can be excluded by setting them to `null`
     *
     * @param {object} object - object on which apply the test
     * @param {object} attributes
     */

    attributes: (object, attributes) => {
      if (Array.isArray(attributes)) {
        return object.should.has.all.keys(attributes)
      }
      // return Object.entries(attributes).reduce((test, [k, v]) => {
      //   return (v === null) ? test.excludingEvery(k) : test
      // }, object.should).deep.equal(attributes)
      const exclude = Object.entries(attributes).reduce((acc, [k, v]) => {
        (v === null) && acc.push(k)
        return acc
      }, [])
      return object.should.excludingEvery(exclude).deep.equal(attributes)
    },
  },
}

export default { badRequestErrorSample, helper }

// let service
// let request
// const auth = {}

// prepare(done => {
//   Promise.all([
//     User.findOne({ where: { username: 'admin' } })
//       .then(user => (
//         createTokenForUser('access', user)
//           .then(token => { auth.admin = { user, token } })
//       )),
//     User.findOne({ where: { username: 'user' } })
//       .then(user => (
//         createTokenForUser('access', user)
//           .then(token => { auth.user = { user, token } })
//       )),
//   ])
//     .then(() => {
//       service = server.start()

//       request = (method, url, params) => {
//         const opts = Object.assign(
//           { auth: true, admin: false, jsonapi: true },
//           params,
//         )

//         let req = chai.request(service)[method](url)

//         if (opts.jsonapi) {
//           req = req
//             .set('Content-Type', 'application/vnd.api+json')
//             .set('Accept', 'application/vnd.api+json')
//           if (opts.payload) {
//             req = req.send({
//               jsonapi: { version: 1.0 },
//               data: opts.payload,
//             })
//           }
//         } else {
//           req = req
//             .set('Content-Type', 'application/json')
//             .set('Accept', 'application/json')
//           if (opts.payload) req = req.send(opts.payload)
//         }
//         if (opts.query) req = req.query(opts.query)

//         if (opts.auth) {
//           if (opts.admin) {
//             return req.set('Authorization', `bearer ${auth.admin.token}`)
//           }

//           if (opts.self) {
//             return createTokenForUser('access', opts.self)
//               .should.be.fulfilled.then(token => (
//                 req.set('Authorization', `bearer ${token}`)
//               ))
//           }

//           return req.set('Authorization', `bearer ${auth.user.token}`)
//         }
//         return req
//       }

//       chai.use(chaiAsPromised)
//       chai.use(chaiHttp)
//       chai.use(chaiMatch)
//       chai.use(chaiExclude)
//       chai.use(sinonChai)
//       sinonStubPromise(sinon)

//       Object.assign(global, {
//         faker,
//         chai,
//         sinon,
//         should: chai.should(),
//         mock,
//         expect,
//         getEnv,
//         helper,
//         badRequestErrorSample,
//         service,
//         req: request,
//         auth,
//       })

//       done()
//     })
//     .catch(err => {
//       console.log('mocha setup error: ', err)
//       done()
//     })
// }, done => {
//   server.stop()
//   sequelize.close()
//   done()
// })
