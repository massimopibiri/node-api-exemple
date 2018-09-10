import {
  capitalize,
  isString,
  getEnv,
  sanitizeRegexString,
} from '.'

describe('Utilities', () => {
  describe('isString', () => {
    it('should detect if an object is a {string}', () => {
      isString('hello world').should.be.ok
      isString(42).should.not.be.ok
      isString(3.14).should.not.be.ok
      isString([]).should.not.be.ok
      isString({}).should.not.be.ok
      isString(Object).should.not.be.ok
    })
  })

  describe('capitalize', () => {
    it('should uppercase the first letter of a {string}', () => {
      capitalize('hello').should.equal('Hello')
      capitalize('hello world').should.equal('Hello world')
      capitalize('HELLO WORLD').should.equal('HELLO WORLD')
    })
    it('should raise a TypeError if the parameter is not a {string}', () => {
      try {
        capitalize({})
      } catch (error) {
        error.name.should.equal('TypeError')
      }
    })
  })

  describe('getEnv', () => {
    it('should get an existing environment variable', () => {
      process.env.HELLO = 'world'
      getEnv('HELLO').should.equal('world')
    })

    it('should throw an error if the environment variable is not set', () => {
      const env = 'HELLOWORLD'
      try {
        getEnv(env)
      } catch (error) {
        error.name.should.equal('Error')
        error.message.should.equal(`Missing env var ${env}`)
      }
    })
  })

  describe('sanitizeRegexString', () => {
    it('should escape special characters from a string', () => {
      const string = 'this/is[a]+test.?'
      const sanitizedString = sanitizeRegexString(string)
      sanitizedString.should.be.equal('this\\/is\\[a\\]\\+test\\.\\?')
    })

    it('should throw an error if the parameter is not a string', () => {
      try {
        sanitizeRegexString({})
      } catch (error) {
        error.name.should.equal('TypeError')
      }
    })
  })
})
