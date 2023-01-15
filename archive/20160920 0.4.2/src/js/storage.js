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
  Load(type) {
    var self = this;
    for (var property in this.Object) {
      if (this.Object.hasOwnProperty(property)) {
        if (['object', 'function'].indexOf(typeof this.Object[property]) == -1) {
          var propertyName = `${this.Object.getType()}.${property}`;
          var value;
          switch (type) {
            case this.Types.Local:
              value = localStorage.getItem(propertyName);
              if (value) {
                this.Object[property] = value;
                console.log(`loaded local ${propertyName} = ${value}`);
              }
              break;
            case this.Types.Session:
              value = sessionStorage.getItem(propertyName);
              if (value) {
                this.Object[property] = value;
                console.log(`loaded local ${propertyName} = ${value}`);
              }
              break;
            case this.Types.Sync:
              chrome.storage.sync.get(propertyName,
                function (setting) {
                  for (var settingProperty in setting) {
                    var name = settingProperty.substring(settingProperty.lastIndexOf('.') + 1);
                    var value = setting[settingProperty];
                    self.Object[name] = value;
                    console.log(`loaded sync ${settingProperty} = ${value}`);
                  }
                }
              );
              break;
          }
        }
      }
    }
  }

  Save(type) {
    for (var property in this.Object) {
      if (this.Object.hasOwnProperty(property)) {
        if (['object', 'function'].indexOf(typeof this.Object[property]) == -1) {
          var propertyName = `${this.Object.getType()}.${property}`;
          var value;
          switch (type) {
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
              var setting = new Object();
              setting[propertyName] = this.Object[property];
              chrome.storage.sync.set(setting, function () {
                var value = setting[propertyName];
                console.log(`saved sync ${propertyName} = ${value}`);
              });
              break;
          }
        }
      }
    }
  }
}

