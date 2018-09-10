/* eslint-disable no-console */

import chai             from 'chai'
import chaiHttp         from 'chai-http'
import chaiAsPromised   from 'chai-as-promised'
import chaiExclude      from 'chai-exclude'
import chaiMatch        from 'chai-match'
import sinon            from 'sinon'
import sinonChai        from 'sinon-chai'
import sinonStubPromise from 'sinon-stub-promise'
import faker            from 'faker/locale/en'
import prepare          from 'mocha-prepare'

import server                           from '../../src/server'
import { sequelize, User }              from '../../src/db/models'
import { createTokenForUser }           from '../../src/lib/helpers/auth'

chai.use(chaiAsPromised)
chai.use(chaiHttp)
chai.use(chaiMatch)
chai.use(chaiExclude)
chai.use(sinonChai)
chai.should()
sinonStubPromise(sinon)

const port = 9888
const service = server.start(port)
const auth = {}

const request = (method, url, params) => {
  const opts = Object.assign(
    { auth: true, admin: false, jsonapi: true },
    params,
  )

  let req = chai.request(service)[method](url)

  if (opts.jsonapi) {
    req = req
      .set('Content-Type', 'application/vnd.api+json')
      .set('Accept', 'application/vnd.api+json')
    if (opts.payload) {
      req = req.send({
        jsonapi: { version: 1.0 },
        data: opts.payload,
      })
    }
  } else {
    req = req
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
    if (opts.payload) req = req.send(opts.payload)
  }
  if (opts.query) req = req.query(opts.query)

  if (opts.auth) {
    if (opts.admin) {
      return req.set('Authorization', `bearer ${auth.admin.token}`)
    }

    if (opts.self) {
      return createTokenForUser('access', opts.self)
        .should.be.fulfilled.then(token => (
          req.set('Authorization', `bearer ${token}`)
        ))
    }

    return req.set('Authorization', `bearer ${auth.user.token}`)
  }
  return req
}

prepare(async done => {
  try {
    const admin = await User.findOne({ where: { username: 'admin' } })
    const adminToken = await createTokenForUser('access', admin)
    auth.admin = { user: admin, token: adminToken }

    const user = await User.findOne({ where: { username: 'user' } })
    const userToken = await createTokenForUser('access', user)
    auth.user = { user, token: userToken }
  } catch (error) {
    console.log(`mocha setup error : ${error}`)
  }
  done()
}, done => {
  server.stop()
  sequelize.close()
  done()
})

export default {
  service,
  port,
  faker,
  chai,
  sinon,
  request,
  auth,
}
