import express                          from 'express'
import Sequelize, { EmptyResultError }  from 'sequelize'
import moment                           from 'moment'
import { Entropy }                      from 'entropy-string'

import { User }             from '../../db/models'
import {
  ValidatorHelper,
  // AuthHelper,
  // EmailHelper,
}                           from '../../lib/helpers'
import { getEnv }           from '../../utils'
import {
  AuthMiddleware,
  ContentTypeMiddleware,
  ResourceFinderMiddleware,
  NotFoundMiddleware,
}                           from '../../lib/middleware'
import {
  // BadRequestError,
  ForbiddenError,
}                           from '../../lib/errors'

const router = express.Router()
const { Op } = Sequelize
const type = 'users'
const Model = User

router.use(ContentTypeMiddleware('application/vnd.api+json'))

const location = user => `${getEnv('API_URL')}/${type}/${user.id}`

const payload = (user, self = false) => {
  const attributes = (self ? User.ownerAttributes : User.publicAttributes)
    .reduce((acc, attribute) => (
      { ...acc, [attribute]: user.get(attribute) }
    ), {})

  return {
    type,
    id: user.id,
    attributes,
    links: {
      self: location(user),
    },
  }
}

const UserAvailableMiddleware = (req, res, next) => {
  /* istanbul ignore else */
  if (req.resource) {
    req.resource.deleted_at && NotFoundMiddleware(req, res, next)
  } else {
    throw TypeError('missing req.resource')
  }
  next()
}

const ForbiddenMiddleware = (req, res, next) => {
  if (req.token.sub !== req.resource.id && !req.token.is_admin) {
    throw new ForbiddenError()
  }
  next()
}

const sanitize = attributes => Object.entries(attributes)
  .reduce((attrs, [key, value]) => ({
    [key]: value === '' ? null : value,
    ...attrs,
  }), {})

/**
 * List of users
 */
router.get(
  '/',
  AuthMiddleware,
  (req, res, next) => {
    const { sort, filter, page = {}, update } = req.query
    const { limit = 20, cursor, timestamp } = page
    const where = { deleted_at: null }
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'

    filter && Object.keys(filter).forEach(attr => {
      if (Model.searchableAttributes.includes(attr)) where[attr] = filter[attr]
    })

    if (update) {
      const date = moment(update, 'x').utc().format(dateFormat)
      where.updated_at = { [Op.gte]: date }
    }

    if (timestamp) {
      const date = moment(timestamp, 'x').utc().format(dateFormat)
      where.updated_at = { [Op.lte]: date }
    }

    const order = sort ? sort.split(',').reduce((acc, param) => {
      const attribute = param.match(/[^-].*$/)[0]
      if (Object.keys(Model.attributes).includes(attribute)) {
        acc.push([attribute, param.charAt() === '-' ? 'DESC' : 'ASC'])
        if (cursor && cursor[attribute]) {
          const operator = param.charAt() === '-' ? Op.lt : Op.gt
          where[attribute] = { [operator]: cursor[attribute] }
        }
      }
      return acc
    }, []) : []

    Model.findAll({
      limit,
      where,
      order,
      // logging: console.log
    }).then(results => {
      res.status(200)
        .render_jsonapi(results.map(resource => payload(resource)))
    }).catch(error => {
      /* istanbul ignore else */
      if (error instanceof EmptyResultError) {
        res.status(200).render_jsonapi([])
      } else throw error
    }).catch(next)
  },
)

/**
 * Create user
 */
router.post(
  '/',
  ValidatorHelper().jsonapi
    .mandatoryParameters('username', 'email'),
  ValidatorHelper().jsonapi.validateEmail('email'),
  ValidatorHelper().jsonapi.validateResourceType('users'),
  async (req, res, next) => {
    let user
    const attributes = sanitize(req.body.data.attributes)
    if (attributes.password === undefined) {
      const entropy = new Entropy()
      attributes.password = entropy.string()
    }

    try {
      user = await User.create(attributes)
      // const token = await AuthHelper
      //   .createTokenForUser('email', user, user.confirm())
      // const data = {
      //   name: user.fullname,
      //   confirm_email_url: `${getEnv('ORIGIN')}/confirm/${token}`,
      // }
      // await EmailHelper.send('signup', user, data)
    } catch (error) {
      return next(error)
    }

    return res.status(201)
      .location(location(user))
      .render_jsonapi(payload(user, true))
    // User.create(attributes).then(user => {
    //   AuthHelper.createTokenForUser('email', user, user.confirm())
    //     .then(token => {
    //       const url = `${getEnv('ORIGIN')}/confirm/${token}`
    //       const data = {
    //         name: user.fullname,
    //         confirm_email_url: url,
    //       }
    //       return EmailHelper.send('signup', user, data).then(() => {
    //         res.status(201)
    //           .location(location(user))
    //           .render_jsonapi(payload(user, true))
    //       })
    //         .catch(next)
    //     })
    // }).catch(error => {
    //   console.log('caught error in route', error);
    //   const params = { where: { username: attributes.username }, force: true }
    //   User.destroy(params).then(() => {
    //     console.log('user destroyed after error');
    //   })
    //   throw error
    // }).catch(next)
  },
)

/**
 * Read user
 */
router.get(
  '/:id',
  ResourceFinderMiddleware(User),
  UserAvailableMiddleware,
  AuthMiddleware,
  (req, res) => {
    const self = req.token.sub === req.resource.id
    res.status(200).render_jsonapi(payload(req.resource, self))
  },
)

/**
 * Update user
 */
router.patch(
  '/:id',
  ResourceFinderMiddleware(User),
  UserAvailableMiddleware,
  AuthMiddleware,
  ForbiddenMiddleware,
  ValidatorHelper().jsonapi.validateResourceType('users'),
  ValidatorHelper().jsonapi.allowedParameters(User.editableAttributes),
  // (req, res, next) => {
  //   !req.token.is_admin &&
  //   Object.keys(req.body.data.attributes).forEach(attribute => {
  //     if (!User.ownerAttributes.includes(attribute)) {
  //       throw new BadRequestError('insufficient_permissions', [{
  //         location: 'body',
  //         param: `data.attributes.${attribute}`,
  //         value: true,
  //         msg: 'is not modifiable with your permissions level',
  //       }])
  //     }
  //   })
  //   next()
  // },
  (req, res, next) => {
    // const attributes = User.editableAttributes
    //   .filter(attr => Object.keys(req.body.data.attributes).includes(attr))
    //   .reduce((data, key) =>
    //     ({ ...data, [key]: req.body.data.attributes[key] }), {})
    const { attributes } = req.body.data

    return req.resource.update(attributes)
      .then(() => res.status(204).end())
      .catch(next)
  },
)

/**
 * Disable user
 */
router.delete(
  '/:id',
  ResourceFinderMiddleware(User),
  UserAvailableMiddleware,
  AuthMiddleware,
  ForbiddenMiddleware,
  (req, res, next) => (
    req.resource.update({ deleted_at: Date.now() })
      .then(() => res.status(204).end())
      .catch(next)
  ),
)

export default router
