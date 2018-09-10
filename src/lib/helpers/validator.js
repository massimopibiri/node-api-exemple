/* eslint-disable func-names */
import { body, check, validationResult }  from 'express-validator/check'
import { BadRequestError, AuthError }     from '../errors'

const ValidatorHelper = () => {
  const helper = {}
  helper.memberPath = ''
  helper.context = 'raw'

  Object.defineProperty(helper, 'jsonapi', {
    get: () => {
      helper.memberPath = 'data.attributes'
      helper.context = 'jsonapi'
      return helper
    },
  })

  Object.defineProperty(helper, 'api', {
    get: () => (helper.context === 'jsonapi'),
  })

  /**
   * Check for missing parameters
   *
   * @param {Array.<string>} parameters
   *
   * @throws {BadRequestError}
   *
   * @returns {Array.<middleware>} an array of middleware to use in a chain
   *
   */

  helper.mandatoryParameters = function (...parameters) {
    const checks = parameters.map(parameter => {
      const member = `${this.memberPath}.${parameter}`
      return body(member).exists().withMessage('is a mandatory parameter')
    })
    // console.log('mandatory params', parameters);

    return checks.concat((req, res, next) => {
      const errors = validationResult(req)
      // console.log('mandatory error', errors.array());
      if (!errors.isEmpty()) {
        throw new BadRequestError(
          'missing_parameter',
          errors.array(),
          this.api,
        )
      }
      next()
    })
  }

  /**
   * Exclude parameters
   *
   * @param {Array.<string>} parameters
   *
   * @throws {BadRequestError}
   *
   * @returns {Array.<middleware>} an array of middleware to use in a chain
   *
   */

  helper.excludeParameters = function (parameters) {
    const checks = (Array.isArray(parameters) ? parameters : [parameters])
      .map(parameter => {
        const member = `${this.memberPath}.${parameter}`
        return body(member).not().exists()
          .withMessage('is not a valid attribute')
      })

    return checks.concat((req, res, next) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new BadRequestError(
          'invalid_attribute',
          errors.array(),
          this.api,
        )
      }
      next()
    })
  }

  /**
   * Allowed parameters
   *
   * @param {Array.<string>} params list of allowed parameters
   *
   * @throws {BadRequestError}
   *
   * @returns {Array.<middleware>} an array of middleware to use in a chain
   *
   */

  helper.allowedParameters = function (params) {
    const allowedParams = Array.isArray(params) ? params : [params]

    return [
      check(this.api ? `${this.memberPath}.*` : '*')
        .custom((value, { _req, _location, path }) => {
          const attr = this.api ? path.substr(path.lastIndexOf('.') + 1) : path
          return allowedParams.includes(attr)
        })
        .withMessage('is not a valid attribute'),
      (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new BadRequestError(
            'invalid_attribute',
            errors.array(),
            this.api,
          )
        }
        next()
      },
    ]
  }

  /**
   * Check for valid values on a parameter
   *
   * @param {string} parameter
   * @param {Array.<string>|string} values
   *
   * @throws {BadRequestError}
   *
   * @returns {Array.<middleware>} - an array of middleware to use in a chain
   *
   */

  helper.validateParameter = function (parameter, values) {
    const validValues = Array.isArray(values) ? values : [values]
    const member = `${this.memberPath}.${parameter}`

    return [
      body(member).isIn(validValues).withMessage('has an invalid value'),
      (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new BadRequestError(
            'invalid_parameter',
            errors.array(),
            this.api,
          )
        }
        next()
      },
    ]
  }

  /**
   * Check for a parameter to be a valid email
   *
   * @param {string} email the parameter to test
   *
   * @throws {BadRequestError}
   *
   * @returns {Array.<middleware>} an array of middleware to use in a chain
   *
   */

  helper.validateEmail = function (email) {
    const member = `${this.memberPath}.${email}`

    return [
      body(member).isEmail().withMessage('is not a valid email'),
      (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new BadRequestError(
            'malformed_email',
            errors.array(),
            this.api,
          )
        }
        next()
      },
    ]
  }

  /**
   * Validate the resource type when a jsonapi resource object is provided
   *
   * @param {string} type
   *
   * @throws {BadRequestError}
   *
   * @returns {Array.<middleware>} an array of middleware to use in a chain
   *
   */

  helper.validateResourceType = function (type) {
    const methods = ['POST', 'PUT', 'PATCH']
    return [
      body('data.type').exists().withMessage('is mandatory'),
      body('data.type').equals(type).withMessage(`must be of type ${type}`),
      body('data.attributes').exists().withMessage('is mandatory'),
      (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty() && methods.includes(req.method)) {
          const error = errors.array()[0]
          const code = `${error.value ? 'invalid' : 'missing'}_resource_type`
          throw new BadRequestError(code, errors.array()[0], this.api)
        }
        next()
      },
    ]
  }

  /**
   * Validate an Oauth Authorization request
   *
   * @throws {AuthError}
   *
   * @returns {Array.<middleware>} an array of middleware to use in a chain
   *
   */

  helper.validateOauth = function () {
    const parameters = ['grant_type', 'username', 'password']
    return parameters.map(parameter => body(parameter).exists()).concat([
      (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) throw new AuthError('invalid_request')
        next()
      },
      body('grant_type').isIn(['password']),
      (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) throw new AuthError('unsupported_grant_type')
        next()
      },
    ])
  }

  return helper
}

export default ValidatorHelper
