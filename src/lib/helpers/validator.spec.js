/* eslint-disable no-underscore-dangle */

import connect              from 'connect'
import mock                 from 'node-mocks-http'
import { expect }           from 'chai'
import { ValidatorHelper }  from '../../lib/helpers'
import { BadRequestError }  from '../../lib/errors'

describe('Validator Helper', () => {
  const contexts = {
    raw: ValidatorHelper(),
    jsonapi: ValidatorHelper().jsonapi,
  }

  const attributes = {
    email: 'valid@email.com',
    notEmail: 'invalid_email.com',
    param1: 'param1',
    param2: 'param2',
  }

  Object.keys(contexts).forEach(contextType => {
    context(`${contextType} parameters`, () => {
      const validator = contexts[contextType]
      let req
      let res
      let chain

      beforeEach(() => {
        req = contextType === 'raw' ? mock.createRequest({
          body: attributes,
        }) : mock.createRequest({
          body: {
            data: {
              attributes,
            },
          },
        })
        res = mock.createResponse()
        chain = connect()
      })

      context('method mandatoryParameters', () => {
        it('should ensure parameters are present', done => {
          validator
            .mandatoryParameters('param1', 'param2')
            .forEach(middleware => chain.use(middleware))
          chain(req, res, error => {
            expect(error).to.be.undefined
            req._validationErrors.should.be.an('array').that.is.empty
            done()
          })
        })

        it('should check for parameters and raise if missing', done => {
          validator
            .mandatoryParameters('param3', 'param4')
            .forEach(middleware => chain.use(middleware))
          chain(req, res, error => {
            error.should.be.instanceOf(BadRequestError)
            error.code.should.equal('missing_parameter')
            done()
          })
        })
      })

      context('method excludeParameters', () => {
        it('should ensure parameters are not present', done => {
          validator
            .excludeParameters(['param1', 'param2'])
            .forEach(middleware => chain.use(middleware))
          chain(req, res, error => {
            error.should.be.instanceOf(BadRequestError)
            error.code.should.equal('invalid_attribute')
            done()
          })
        })

        it('should pass if parameters are missing', done => {
          validator
            .excludeParameters(['param3', 'param4'])
            .forEach(middleware => chain.use(middleware))
          chain(req, res, error => {
            expect(error).to.be.undefined
            req._validationErrors.should.be.an('array').that.is.empty
            done()
          })
        })
      })

      context('method allowedParameters', () => {
        it('should raise if parameters are not allowed', done => {
          validator
            .allowedParameters(['param3', 'param4'])
            .forEach(middleware => chain.use(middleware))
          chain(req, res, error => {
            error.should.be.instanceOf(BadRequestError)
            error.code.should.equal('invalid_attribute')
            done()
          })
        })

        it('should pass if parameters are allowed', done => {
          validator
            .allowedParameters(['email', 'notEmail', 'param1', 'param2'])
            .forEach(middleware => chain.use(middleware))
          chain(req, res, error => {
            expect(error).to.be.undefined
            req._validationErrors.should.be.an('array').that.is.empty
            done()
          })
        })
      })

      context('method validateParameter', () => {
        it('should ensure a parameter has the right value', done => {
          validator
            .validateParameter('param1', 'param1')
            .forEach(middleware => chain.use(middleware))
          chain(req, res, error => {
            expect(error).to.be.undefined
            req._validationErrors.should.be.an('array').that.is.empty
            done()
          })
        })

        it('should ensure a parameter has the right value in array', done => {
          const values = ['foo', 'bar', 'param1']
          validator
            .validateParameter('param1', values)
            .forEach(middleware => chain.use(middleware))
          chain(req, res, error => {
            expect(error).to.be.undefined
            req._validationErrors.should.be.an('array').that.is.empty
            done()
          })
        })

        it('should raise if a parameter has an invalid value', done => {
          const values = ['foo', 'bar', 'ber']
          validator
            .validateParameter('param1', values)
            .forEach(middleware => chain.use(middleware))
          chain(req, res, error => {
            error.should.be.instanceOf(BadRequestError)
            error.code.should.equal('invalid_parameter')
            done()
          })
        })
      })

      context('method validateEmail', () => {
        it('should ensure a parameter is a valid email', done => {
          validator
            .validateEmail('email')
            .forEach(middleware => chain.use(middleware))
          chain(req, res, error => {
            expect(error).to.be.undefined
            req._validationErrors.should.be.an('array').that.is.empty
            done()
          })
        })

        it('should raise if a parameter is not an email', done => {
          validator
            .validateEmail('notEmail')
            .forEach(middleware => chain.use(middleware))
          chain(req, res, error => {
            error.should.be.instanceOf(BadRequestError)
            error.code.should.equal('malformed_email')
            done()
          })
        })
      })
    })
  })

  context('method validateResourceType', () => {
    const testedMethods = ['POST', 'PUT', 'PATCH']
    const ignoredMethods = ['HEADER', 'GET', 'DELETE']

    const testMethod = (method, hook) => {
      const chain = connect()
      const res = mock.createResponse()
      const req = mock.createRequest({
        method,
        body: {
          data: {
            type: 'foobar',
            attributes: {},
          },
        },
      })

      hook && hook(req)

      return new Promise((resolve, reject) => {
        ValidatorHelper().jsonapi
          .validateResourceType('foobar')
          .forEach(middleware => chain.use(middleware))
        chain(req, res, error => { error ? reject(error) : resolve() })
      })
    }


    it('should ensure the right resource type is provided', () => (
      Promise.all(testedMethods.map(method =>
        testMethod(method).should.be.fulfilled))
    ))

    it('should not check on bodyless methods', () => {
      const hook = req => { req.body.data.type = 'foo' }

      return Promise.all(ignoredMethods.map(method =>
        testMethod(method, hook).should.be.fulfilled))
    })

    it('should raise if the type is missing', () => {
      const hook = req => { delete req.body.data.type }

      return Promise.all(testedMethods.map(method => (
        testMethod(method, hook).should.be.rejectedWith(BadRequestError)
          .then(error => {
            error.code.should.equal('missing_resource_type')
          })
      )))
    })

    it('should raise if the wrong type is provided', () => {
      const hook = req => { req.body.data.type = 'foo' }

      return Promise.all(testedMethods.map(method => (
        testMethod(method, hook).should.be.rejectedWith(BadRequestError)
          .then(error => {
            error.code.should.equal('invalid_resource_type')
          })
      )))
    })
  })

  context('method validateOauth', () => {
    it('should pass a valid Oauth authentication request')
    it('should raise on missing parameters')
    it('should raise on invalid grant_type')
  })
})
