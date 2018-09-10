/**
 * Test if an object is a String
 *
 * @param {string|object} value object to test
 *
 * @returns {boolean}
 */
export const isString = value => typeof value === 'string'

/**
 * Capitalize the first letter of a string
 *
 * This helper only capitalize the first letter of a whole string, regardless
 * of the words count.
 *
 * @param {string} str string to capitalize
 *
 * @returns {string}
 */
export const capitalize = str => {
  if (!isString(str)) throw new TypeError('parameter should be a String')

  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Enforcing environment variable existence while required
 *
 * If the environment variable does not exist, an error is thrown
 *
 * @param {string} str environment variable name
 *
 * @returns {any}
 */
export const getEnv = env => {
  if (process.env[env]) return process.env[env]
  throw new Error(`Missing env var ${env}`)
}

/**
 * Sanitize a string to be used as a regex
 *
 * It escapes all regex special characters of a string, to make it ready
 * to be raw used in a match() or similar functions.
 *
 * @param {string} string
 *
 * @returns {string}
 */
export const sanitizeRegexString = string => (
  string.replace(/[-[\]{}()*+!<=:?./\\^$|#\s,]/g, '\\$&')
)

export default {
  isString,
  capitalize,
  getEnv,
  sanitizeRegexString,
}
