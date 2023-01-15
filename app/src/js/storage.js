class Storage {
  constructor() {
  }

  #type//object type
  get type() {
    return this.#type
  }
  set type(value) {
    this.#type = value
  }

  #property
  get property() {
    return this.#property
  }
  set property(value) {
    this.#property = value
  }

  get key() {
    return `WebPageReader.${this.type}.${this.property}`
  }

  get value() {
    return this.storage.getItem(this.key);
  }
  set value(value) {
    this.storage.setItem(this.key, value);
  }

  get storage() {
  }

  async load(storable) {
    this.type = storable.type
    for (var propertyName of storable.properties) {
      this.property = propertyName
      var value = await this.value
      if (typeof value !== 'undefined' && value != null)
        storable[propertyName] = value
    }
  }

  saveProperty(storable, property) {
    this.type = storable.type
    this.property = property
    if (typeof storable[property] !== 'undefined')
      this.value = storable[property]
  }

  save(storable) {
    storable.properties.forEach(property => this.saveProperty(storable, property));
  }
}

// lifetime: forever, scope: current browser
class WindowLocalStorage extends Storage {
  get storage() {
    return window.localStorage
  }
}

// lifetime: webpage, scope: current browser
class WindowSessionStorage extends Storage {
  get storage() {
    return window.sessionStorage
  }

}

// lifetime: forever, scope: all logged in browsers
class ChromeSyncStorage extends Storage {

  get storage() {
    return chrome.storage.sync
  }

  get value() {
    return (async () => {
      try {
        var setting = await this.storage.get(this.key)
        return setting[this.property];
      } catch (e) {
        return null; // fallback value;
      }
    })();
  }
  set value(value) {
    var settingObject = {};
    settingObject[this.key] = value;
    this.storage.set(settingObject);
  }

}

// lifetime: forever, scope: all logged in browsers
class ChromeLocalStorage extends Storage {

  get storage() {
    return chrome.storage.local
  }

  get value() {
    return (async () => {
      try {
        var setting = await this.storage.get(this.key)
        return setting[this.property];
      } catch (e) {
        return null; // fallback value;
      }
    })();
  }
  set value(value) {
    var settingObject = {};
    settingObject[this.key] = value;
    this.storage.set(settingObject);
  }

}

WebPageReader.WindowLocalStorage = WindowLocalStorage
WebPageReader.WindowSessionStorage = WindowSessionStorage
WebPageReader.ChromeSyncStorage = ChromeSyncStorage
WebPageReader.ChromeLocalStorage = ChromeLocalStorage




