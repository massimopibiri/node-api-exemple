class Factory {
  constructor (model, attributes = {}) {
    this.Model = model
    this.attributes = attributes
  }

  payload (filters = []) {
    const attributes = (Array.isArray(filters) && filters.length > 0) ?
      Object.keys(this.attributes)
        .filter(attr => filters.includes(attr))
        .reduce((acc, attr) => {
          acc[attr] = this.attributes[attr]
          return acc
        }, {})
      : this.attributes
    return {
      type: this.Model.getTableName(),
      attributes,
    }
  }

  insert () {
    return new this.Model(this.attributes).save()
  }

  static async generate (attributes = {}) {
    const initAttributes = await this.randomize(attributes)
    return new this(initAttributes)
  }

  static async create (attributes = {}) {
    const instance = await this.generate(attributes)
    return instance.insert()
  }

  static bulkCreate (length = 5, attributes = {}) {
    return Promise.all(Array.from({ length }, () => this.create(attributes)))
  }

  static async randomize () {
    throw new Error(`Missing randomize static method in ${this.name}`)
  }
}

export default Factory
