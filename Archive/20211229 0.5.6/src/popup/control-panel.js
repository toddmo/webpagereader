WebPageReader.UI.ControlPanel = function () {

  /* private properties */
  var self = this;
  var storage = new WebPageReader.Storage(this);
  var speech = new WebPageReader.Speech(storage);
  var language = new WebPageReader.Language();

  /* constructor */
  function constructor() {
    // voice changes from Speech
    speech.OnVoicesChanged = () => {
      self.Voices = speech.Voices
    };
    load();

    // commands going to the reader
    start.onclick = () => { self.DoCommand('start'); }
    btnStop.onclick = () => { self.DoCommand('stop'); }
    pause.onclick = () => { self.DoCommand('pause'); }
    resume.onclick = () => { self.DoCommand('resume'); }
    next.onclick = () => { self.DoCommand('next'); }
    previous.onclick = () => { self.DoCommand('previous'); }

    // UI events
    lstVoices.onchange = () => {
      self.Voice = lstVoices.options[lstVoices.selectedIndex].attributes['data-name'].nodeValue;
    }
    rngRate.onchange = () => { self.Rate = rngRate.value };
    rngVolume.onchange = () => { self.Volume = rngVolume.value };

    // UI sync
    rngRate.oninput = () => {
      rngRate.title = rngRate.value;
      outRate.value = `Rate (${(rngRate.value * 100).toFixed(0)}%)`;
    };
    rngVolume.oninput = () => {
      rngVolume.title = rngVolume.value;
      outVolume.value = `Volume (${(rngVolume.value * 100).toFixed(0)}%)`;
    };

    // storage changes from reader state
    chrome.storage.onChanged.addListener(self.Storage_OnChange);

    // listen for reader to become active
    chrome.runtime.onMessage.addListener(self.Runtime_OnMessage);
  }

  /* public properties */
  var reading = false;
  Object.defineProperty(this, "Reading", {
    get: function () {
      return reading;
    },
    set: function (value) {
      reading = value.toString() == "true";
      display(start, !reading);
      btnStop.disabled = !reading;
      display(pause, reading && !paused);
    },
    enumerable: true
  });

  var paused = false;
  Object.defineProperty(this, "Paused", {
    get: function () {
      return paused;
    },
    set: function (value) {
      paused = value.toString() == "true";
      display(start, !reading);
      btnStop.disabled = !reading;
      display(pause, reading && !paused);
      display(resume, paused);
    },
    enumerable: true
  });

  var canNext = false;
  Object.defineProperty(this, "CanNext", {
    get: function () {
      return canNext;
    },
    set: function (value) {
      canNext = value.toString() == "true";
      next.disabled = !canNext;
    },
    enumerable: true
  });

  var canPrevious = false;
  Object.defineProperty(this, "CanPrevious", {
    get: function () {
      return canPrevious;
    },
    set: function (value) {
      canPrevious = value.toString() == "true";
      previous.disabled = !canPrevious;
    },
    enumerable: true
  });

  var voices = null;
  Object.defineProperty(this, "Voices", {
    get: function () {
      return voices;
    },
    set: function (value) {
      voices = value;
      loadVoices();
    }
  });

  var voice = 'native';
  Object.defineProperty(this, "Voice", {
    get: function () {
      return voice;
    },
    set: function (value) {
      voice = value;
      saveSpeechSettings('Voice');
    },
    enumerable: true
  });

  var rate = 1.0;
  Object.defineProperty(this, "Rate", {
    get: function () {
      return rate;
    },
    set: function (value) {
      rate = Number(value);
      rngRate.value = rate;
      rngRate.title = rate;
      outRate.value = `Rate (${(rate * 100).toFixed(0)}%)`;
      saveSpeechSettings('Rate');
    },
    enumerable: true
  });

  var volume = 1.0;
  Object.defineProperty(this, "Volume", {
    get: function () {
      return volume;
    },
    set: function (value) {
      volume = Number(value);
      rngVolume.value = volume;
      rngVolume.title = volume;
      outVolume.value = `Volume (${(volume * 100).toFixed(0)}%)`;
      saveSpeechSettings('Volume');
    },
    enumerable: true
  });

  var speechEnabled = true;
  Object.defineProperty(this, "SpeechEnabled", {
    get: function () {
      return speechEnabled;
    },
    set: function (value) {
      speechEnabled = value.toString() == "true";
      chkSpeechEnabled.checked = speechEnabled;
      saveSpeechSettings('SpeechEnabled');
    },
    enumerable: true
  });

  /* public methods */
  this.getType = function () { return "WebPageReader.UI.ControlPanel" }

  this.DoCommand = function (name) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: name }, function (response) {
        console.log(response.outcome);
      });
    });
  }

  /* private methods */
  function display(el, condition) {
    el.style.display = condition ? 'inline' : 'none';
  }

  function load() {
    storage.Load(storage.Types.Sync, 'WebPageReader.Reader');
    storage.Load(storage.Types.Sync, 'WebPageReader.Speech');
  }

  function loadVoices() {
    for (i = 0; i < self.Voices.length; i++) {
      if (!lang || language.LanguageName(voices[i].lang) != lang) {
        var lang = language.LanguageName(voices[i].lang) || 'Local';
        var optGroup = document.createElement('optgroup');
        optGroup.setAttribute('label', lang);
        lstVoices.appendChild(optGroup);
      }
      var option = document.createElement('option');
      option.textContent = voices[i].name;// + ' (' + voices[i].lang + ')';

      if (voices[i].name == self.Voice)
        option.setAttribute('selected', true);
      option.setAttribute('data-lang', voices[i].lang);
      option.setAttribute('data-name', voices[i].name);
      optGroup.appendChild(option);
    }
  }

  function saveSpeechSettings(setting) {
    storage.Save(storage.Types.Sync, speech, setting);
  }

  /* event handlers */
  this.Storage_OnChange = function (changes, namespace) {
    for (key in changes) {
      var storageChange = changes[key];
      console.log('Storage key "%s" in namespace "%s" changed. ' +
        'Old value was "%s", new value is "%s".',
        key,
        namespace,
        storageChange.oldValue,
        storageChange.newValue);

      switch (key) {
        case 'WebPageReader.Reader.Reading':
          self.Reading = storageChange.newValue;
          break;
        case 'WebPageReader.Reader.Paused':
          self.Paused = storageChange.newValue;
          break;
        case 'WebPageReader.Reader.CanNext':
          self.CanNext = storageChange.newValue;
          break;
        case 'WebPageReader.Reader.CanPrevious':
          self.CanPrevious = storageChange.newValue;
          break;
      };
    }
  }

  this.Runtime_OnMessage = function (request, sender, sendResponse) {
    switch (request.name) {
      case 'OnActivated':
        var reader = request.source;
        self.Reading = reader.Reading;
        self.Paused = reader.Paused;
        self.CanNext = reader.CanNext;
        self.CanPrevious = reader.CanPrevious;
        break;
    };
  }

  constructor(); // finally call the constructor
}

var controlPanel = new WebPageReader.UI.ControlPanel();
