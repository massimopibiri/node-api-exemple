import { request } from '../../test/setup'

describe('Server', () => {
  it('responds "ok" to /status', () => (
    request('get', '/status').should.be.fulfilled.then(res => {
      res.should.have.status(200)
      // res.should.have.header('Content-Type', 'application/vnd.api+json')
      res.should.not.have.header('X-Powered-By')
      // res.body.should.deep.includes({'server': 'ok'})
    })
  ))

  it('replies 404 on unknown page with json format', () => (
    request('get', '/foo/bar', { jsonapi: false })
      .should.be.rejected.then(error => {
        error.response.should.have.status(404)
        error.response.should.have.header('Content-Type', /^application\/json/)
        error.response.body.should.deep.equal({ error: 'not_found' })
      })
  ))
})
