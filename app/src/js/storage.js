/* Classes */
WebPageReader.Storage = class {
  constructor(object) {
    /* enumerations */
    this.Types = {
      Local: 1,
      Session: 2,
      Sync: 3
    };
    this.Object = object;
  }

  /* public methods */
  Load(storageType, objectType) {
    objectType = objectType || this.Object.getType();
    var self = this;
    for (var property in this.Object) {
      if (this.Object.hasOwnProperty(property)) {
        if (['object', 'function'].indexOf(typeof this.Object[property]) == -1) {
          var propertyName = `${objectType}.${property}`;
          var value;
          switch (storageType) {
            case this.Types.Local:
              value = localStorage.getItem(propertyName);
              if (value) {
                this.Object[property] = value;
                console.log(`loaded local ${this.Object.getType()}: ${propertyName} = ${value}`);
              }
              break;
            case this.Types.Session:
              value = sessionStorage.getItem(propertyName);
              if (value) {
                this.Object[property] = value;
                console.log(`loaded local ${this.Object.getType()}: ${propertyName} = ${value}`);
              }
              break;
            case this.Types.Sync:
              chrome.storage.sync.get(propertyName,
                function (setting) {
                  for (var settingProperty in setting) {
                    var name = settingProperty.substring(settingProperty.lastIndexOf('.') + 1);
                    var value = setting[settingProperty];
                    self.Object[name] = value;
                    console.log(`loaded sync ${self.Object.getType()}: ${settingProperty} = ${value}`);
                  }
                }
              );
              break;
          }
        }
      }
    }
  }

  Save(storageType, object, setting) {
    object = object || this.Object;
    for (var property in object) {
      if (!setting || setting == property && object.hasOwnProperty(property)) {
        if (['object', 'function'].indexOf(typeof object[property]) == -1) {
          var propertyName = `${object.getType()}.${property}`;
          var value;
          switch (storageType) {
            case this.Types.Local:
              value = this.Object[property];
              localStorage.setItem(propertyName, value);
              console.log(`saved local ${propertyName} = ${value}`);
              break;
            case this.Types.Session:
              value = this.Object[property];
              sessionStorage.setItem(propertyName, value);
              console.log(`saved local ${propertyName} = ${value}`);
              break;
            case this.Types.Sync:
              var settingObject = new Object();
              value = this.Object[property];
              settingObject[propertyName] = value;
              chrome.storage.sync.set(settingObject);
              console.log(`saved sync ${propertyName} = ${value}`);
              break;
          }
        }
      }
    }
  }
}

