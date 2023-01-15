class Storable {
  constructor() {
    this.loading = true
  }

  get defaults() {
    return {
      HighlightBackColor: 'dodgerblue',
      HighlightForeColor: '#ddd',
      SkipCode: true,
      Enabled: true,
      Rate: 1.0,
      Volume: 1.0,
    }
  }

  #loading = true
  get loading() {
    return this.#loading
  }
  set loading(value) {
    this.#loading = value
  }

  #id = generateUUID().split('-').pop()
  get id() {
    return this.#id
  }

  get prototype() {
    return this.constructor
  }

  #type
  get type() {
    return this.#type || this.prototype.name
  }
  set type(value) {
    // for control panel to pretend it's something it's not
    this.#type = value
  }

  get properties() {
    return this.constructor.properties
  }

  get obj() {
    var self = this
    return this.properties.reduce((acc, cur) => {
      acc[cur] = self[cur]
      return acc
    }, {})
  }

  loadDefaults() {
    var properties = this.properties
    for (var property in this.defaults) {
      if (properties.includes(property))
        this[property] = this.defaults[property]
    }
  }

  async load(storage) {
    await storage.load(this)
  }

  save(storage) {
    if (this.loading) return false
    storage.save(this)
    return true
  }

  saveProperty(storage, property) {
    if (this.loading) return false
    storage.saveProperty(this, property)
    return true
  }

  static get ignore() {
    return ['type']
  }

  static get properties() {
    var prototype = this.prototype
    var ignore = this.ignore
    return Object.getOwnPropertyNames(prototype)
      .map((propertyName) => {
        return {
          name: propertyName,
          descriptor: Object.getOwnPropertyDescriptor(prototype, propertyName),
        }
      })
      .filter((property) => {
        return (
          property.descriptor?.set &&
          prototype.hasOwnProperty(property.name) &&
          !ignore.includes(property.name)
        )
      })
      .map((property) => property.name)
  }
}
