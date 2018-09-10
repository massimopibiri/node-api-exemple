import { Model as SequelizeModel, DataTypes } from 'sequelize'
// import { scalarTypeMap } from './graph/scalars'
import { capitalize } from '../utils'

/**
 * @typedef Model
 */
class Model extends SequelizeModel {
  static propsCache = {}

  static init (options) {
    this.lazyLoadProperties()
    return super.init(this.modelAttributes, options)
  }

  static lazyLoadProperties () {
    const props = [
      'publicAttributes', 'mandatoryAttributes',
      'searchableAttributes', 'editableAttributes', 'ownerAttributes',
      // 'graphSchema',
    ]

    props.forEach(property => this.getClassProperty(property))
  }

  static getClassProperty (property) {
    if (this.propsCache[this.name] === undefined) {
      this.propsCache[this.name] = {}
    }
    if (this.propsCache[this.name][property] === undefined) {
      const yieldMethod = `yield${capitalize(property)}`
      if (this[yieldMethod] === undefined) {
        throw new Error(`unknown yield property method '${yieldMethod}'`)
      }
      this.propsCache[this.name][property] = this[yieldMethod]()
    }
    return this.propsCache[this.name][property]
  }


  static get modelAttributes () {
    throw new Error('attributes not defined')
  }

  /**
   * Attributes loaders
   */

  /**
   * public displayable attributes
   *
   * @returns {Array} - public attributes
   */
  static get publicAttributes () {
    return this.getClassProperty('publicAttributes')
  }

  static yieldPublicAttributes () {
    return Object.keys(this.modelAttributes)
      .filter(attribute => {
        const props = this.modelAttributes[attribute]
        return !props.private
          && !props.restricted
          && props.type !== DataTypes.VIRTUAL
      })
  }

  /**
   * Filter owner attributes
   *
   * @returns {Array} - owner attributes
   */
  static get ownerAttributes () {
    return this.getClassProperty('ownerAttributes')
  }

  static yieldOwnerAttributes () {
    return Object.keys(this.modelAttributes)
      .filter(attribute => {
        const props = this.modelAttributes[attribute]

        return !props.restricted
          && props.type !== DataTypes.VIRTUAL
      })
  }


  /**
   * Filter mandatories attributes for form requests
   *
   * @returns {Array} - mandatories attributes
   */
  static get mandatoryAttributes () {
    return this.getClassProperty('mandatoryAttributes')
  }

  static yieldMandatoryAttributes () {
    return Object.keys(this.modelAttributes).filter(attribute => {
      const { allowNull = true, ...props } = this.modelAttributes[attribute]

      return ((!allowNull && !('defaultValue' in props)) && !props.readOnly)
        || props.type === DataTypes.VIRTUAL
    })
  }

  /**
   * Filter searchable attributes for search requests
   *
   * @returns {Array} - searchable attributes
   */
  static get searchableAttributes () {
    return this.getClassProperty('searchableAttributes')
  }

  static yieldSearchableAttributes () {
    return Object.keys(this.modelAttributes)
      .filter(attribute => this.modelAttributes[attribute].search)
  }

  /**
   * Filter editable attributes for form requests
   *
   * @returns {Array} - editable attributes
   */
  static get editableAttributes () {
    return this.getClassProperty('editableAttributes')
  }

  static yieldEditableAttributes () {
    return Object.keys(this.modelAttributes).filter(attribute => {
      const { readOnly, restricted, type } = this.modelAttributes[attribute]
      return !readOnly && !restricted && type !== DataTypes.UUID
    })
  }

  /**
   * graphQL schema string based on sequelize model attributes definition
   *
   * @returns {String} - a valid graphQL schema part string
   */
  // static get graphSchema () {
  //   return this.getClassProperty('graphSchema')
  // }

  // static yieldGraphSchema () {
  //   let enumDef = ''

  //   const attributes = this.publicAttributes
  //     .reduce((result, field) => {
  //       const { type, values, graphName } = this.modelAttributes[field]
  //       const mandatory = this.mandatoryAttributes.includes(field) ? '!' : ''
  //       const fieldName = field.replace(/_id$/, '')
  //       const attributeName = graphName || fieldName
  //       let scalarType

  //       switch (type.key) {
  //         case 'ENUM': {
  //           scalarType = field.split('_').reduce((pascalString, word) => (
  //             `${pascalString}${capitalize(word)}`
  //           ), this.name)

  //           const elems = values.reduce((str, val) => `${str}  ${val}\n`, '')
  //           enumDef = `${enumDef}enum ${scalarType} {\n${elems}}\n\n`
  //           break
  //         }
  //         case 'UUID': {
  //           if (field !== 'id') {
  //             const { graphType } = this.modelAttributes[field]
  //             scalarType = graphType || capitalize(fieldName)
  //             break
  //           }
  //         }
  //         // fallthrough
  //         default: {
  //           const dbType = ((typeof type === 'string') ? type : type.key)
  //             .toLowerCase()
  //           if (!(dbType in scalarTypeMap)) {
  //             throw new Error(`DataType '${dbType}' has no matching scalar`)
  //           }

  //           scalarType = scalarTypeMap[dbType]
  //         }
  //       }

  //       return `${result}  ${attributeName}: ${scalarType}${mandatory}\n`
  //     }, '')

  //   return `${enumDef}type ${this.name} {\n${attributes}}\n`
  // }
}

export default Model
