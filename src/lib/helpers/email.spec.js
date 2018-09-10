import nock             from 'nock'
import { send }         from './email'
import { UserFactory }  from '../../../test/factories'

const params = {
  obj: 'subject',
  txt: 'txt',
  url: 'url',
}

let user

describe('Emails Helper', () => {
  beforeEach(() => (
    UserFactory.create().should.be.fulfilled.then(res => { user = res })
  ))
  after(() => nock.cleanAll())

  it('should confirm an email has been sent', () => {
    nock('https://api.sparkpost.com:443')
      .post('/api/v1/transmissions')
      .reply(200, {
        results: {
          total_rejected_recipients: 0,
          total_accepted_recipients: 1,
          id: '11668787484950529',
        },
      })

    return send('signup', user, params)
      .should.be.fulfilled.then(data => {
        data.results.total_rejected_recipients.should.equal(0)
        data.results.total_accepted_recipients.should.equal(1)
      })
  })

  it('should raise an error if the user is not instance of User', () => (
    send('signup', 'user@foobar.com', params)
      .should.be.rejected.then(error => {
        error.name.should.equal('TypeError')
        error.message.should.equal('expect user to be a User')
      })
  ))

  it('should raise an error if the action parameter is unknown', () => (
    send('dummy', user, {})
      .should.be.rejected.then(error => {
        error.message.should.equal('Email type "dummy" is invalid')
      })
  ))

  it('should handle a rejected recipient', () => {
    nock('https://api.sparkpost.com:443')
      .post('/api/v1/transmissions')
      .reply(200, {
        results: {
          total_rejected_recipients: 1,
          total_accepted_recipients: 0,
          id: '11668787484950529',
        },
      })
    send('signup', user, params)
      .should.be.fulfilled.then(data => {
        data.results.total_rejected_recipients.should.equal(1)
        data.results.total_accepted_recipients.should.equal(0)
      })
  })

  it('should raise an error if the email can not be sent', () => {
    nock('https://api.sparkpost.com:443')
      .post('/api/v1/transmissions')
      .reply(420, {
        errors: [
          {
            message: 'Exceed Sending Limit (daily)',
            code: '2102',
          },
        ],
      })
    return send('signup', user, params)
      .should.be.rejected.then(error => {
        error.errors[0].code.should.equal('2102')
      })
  })
})
