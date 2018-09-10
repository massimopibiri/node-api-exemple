import uuidv4                       from 'uuid/v4'
import connect                      from 'connect'
import sinon                        from 'sinon'
import { expect }                   from 'chai'
import mock                         from 'node-mocks-http'
import { ResourceFinderMiddleware } from '.'
import * as NotFound                from './not_found'
import { User }                     from '../../db/models'
import { UserFactory }              from '../../../test/factories'

describe('Resource Finder Middleware', () => {
  let req
  let res
  let spy
  let user
  let chain
  let notFoundStub

  beforeEach(() => {
    notFoundStub = sinon.stub(NotFound, 'default')
    notFoundStub.callsArg(2)

    res = mock.createResponse()
    chain = connect()
    return UserFactory.create().should.be.fulfilled
      .then(resource => { user = resource })
  })
  afterEach(() => {
    notFoundStub.restore()
  })

  it('should find a resource if it exists', done => {
    req = mock.createRequest({ params: { id: user.id } })
    ResourceFinderMiddleware(User)(req, res, () => {
      req.resource.should.be.an.instanceof(User)
      notFoundStub.should.not.have.been.called
      done()
    })
  })

  it('should call the NotFoundMiddleware if no param id given', done => {
    req = mock.createRequest()
    chain.use(ResourceFinderMiddleware(User))
    chain(req, res, () => {
      expect(req.resource).to.be.undefined
      notFoundStub.should.have.been.called
      done()
    })
  })

  it('should call the NotFoundMiddleware on EmptyResultError', done => {
    req = mock.createRequest({ params: { id: uuidv4() } })
    chain.use(ResourceFinderMiddleware(User))
    chain(req, res, () => {
      expect(req.resource).to.be.undefined
      notFoundStub.should.have.been.called
      done()
    })
  })

  it('should raise an error on any other cases', done => {
    req = mock.createRequest({ params: { id: [] } })
    try {
      ResourceFinderMiddleware(User)(req, res, spy)
    } catch (error) {
      error.should.be.an.instanceof(Error)
      notFoundStub.should.not.have.been.called
      done()
    }
  })

  it('should raise an TypeError if no model given', done => {
    req = mock.createRequest({ params: { id: user.id } })
    try {
      ResourceFinderMiddleware(Object)(req, res, spy)
    } catch (error) {
      error.should.be.an.instanceof(TypeError)
      notFoundStub.should.not.have.been.called
      done()
    }
  })
})
