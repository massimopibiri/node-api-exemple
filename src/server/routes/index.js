import Auth from './auth'
import Users from './users'

const router = app => {
  app.use('/auth', Auth)
  app.use('/users', Users)
}

export default router
