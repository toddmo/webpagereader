class Storable {
  constructor() {

  }

  #id = generateUUID()
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
  set type(value) { // for control panel to pretend it's something it's not
    this.#type = value
  }

  get properties() {
    return this.constructor.properties
  }

  get obj() {
    var self = this
    return this.properties.reduce(
      (acc, cur) => {
        acc[cur] = self[cur]
        return acc
      },
      {})
  }

  load(storage) {
    storage.load(this)
  }

  save(storage) {
    storage.save(this)
  }

  saveProperty(storage, property) {
    storage.saveProperty(this, property)
  }

  static get ignore() {
    return [
      'type'
    ]
  }

  static get properties() {
    var prototype = this.prototype
    var ignore = this.ignore
    return Object.getOwnPropertyNames(prototype)
      .map(propertyName => {
        return {
          name: propertyName,
          descriptor: Object.getOwnPropertyDescriptor(prototype, propertyName)
        }
      })
      .filter(property => {
        return property.descriptor?.set &&
          prototype.hasOwnProperty(property.name) &&
          !ignore.includes(property.name)
      })
      .map(property => property.name)
  }


}