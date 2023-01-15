WebPageReader.UI.ControlPanel = function () {

  /* private properties */
  var self = this;
  var storage = new WebPageReader.Storage();
  var speech = new WebPageReader.Speech(storage);
  var language = new WebPageReader.Language();

  /* constructor */
  function constructor() {
    speech.OnVoicesChanged = () => {
      self.Voices = speech.Voices
    };
    load();

    lstVoices.onchange = () => {
      self.Voice = lstVoices.options[lstVoices.selectedIndex].attributes['data-name'].nodeValue;
    }

    rngRate.onchange = () => { self.Rate = rngRate.value };
    rngVolume.onchange = () => { self.Volume = rngVolume.value };

    rngRate.oninput = () => {
      rngRate.title = rngRate.value;
      outRate.value = 'Rate (' + rngRate.value + ')';
    };

    rngVolume.oninput = () => {
      rngVolume.title = rngVolume.value;
      outVolume.value = 'Volume (' + rngVolume.value + ')';
    };

    start.onclick = () => { self.DoCommand('start'); }
    btnStop.onclick = () => { self.DoCommand('stop'); }
    pause.onclick = () => { self.DoCommand('pause'); }
    resume.onclick = () => { self.DoCommand('resume'); }
    next.onclick = () => { self.DoCommand('next'); }
    previous.onclick = () => { self.DoCommand('previous'); }

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
    }
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
    }
  });

  var canNext = false;
  Object.defineProperty(this, "CanNext", {
    get: function () {
      return canNext;
    },
    set: function (value) {
      canNext = value.toString() == "true";
      next.disabled = !canNext;
    }
  });

  var canPrevious = false;
  Object.defineProperty(this, "CanPrevious", {
    get: function () {
      return canPrevious;
    },
    set: function (value) {
      canPrevious = value.toString() == "true";
      previous.disabled = !canPrevious;
    }
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
      doSetting('voice', voice);
    }
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
      outRate.value = 'Rate (' + rate + ')';
      doSetting('rate', rate);
    }
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
      outVolume.value = 'Volume (' + volume + ')';
      doSetting('volume', volume);
    }
  });

  var speechEnabled = true;
  Object.defineProperty(this, "SpeechEnabled", {
    get: function () {
      return speechEnabled;
    },
    set: function (value) {
      speechEnabled = value.toString() == "true";
      chkSpeechEnabled.checked = speechEnabled;
      doSetting('enabled', speechEnabled);
    }
  });

  /* public methods */
  this.DoCommand = function (name) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: name }, function (response) {
        console.log(response.outcome);
      });
    });
  }

  /* private methods */
  function doSetting(name, value) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: 'setting', setting: name, value: value }, function (response) {
        console.log(response.outcome);
      });
    });
  }

  function display(el, condition) {
    el.style.display = condition ? 'inline' : 'none';
  }

  function load() {
    chrome.storage.sync.get('WebPageReader.Reader.Reading',
      function (setting) {
        self.Reading = setting['WebPageReader.Reader.Reading'] || false;
      }
    );

    chrome.storage.sync.get('WebPageReader.Reader.Paused',
      function (setting) {
        self.Paused = setting['WebPageReader.Reader.Paused'] || false;
      }
    );

    chrome.storage.sync.get('WebPageReader.Reader.CanNext',
      function (setting) {
        self.CanNext = setting['WebPageReader.Reader.CanNext'] || false;
      }
    );

    chrome.storage.sync.get('WebPageReader.Reader.CanPrevious',
      function (setting) {
        self.CanPrevious = setting['WebPageReader.Reader.CanPrevious'] || false;
      }
    );
    chrome.storage.sync.get('WebPageReader.Speech.Voice',
      function (setting) {
        self.Voice = setting['WebPageReader.Speech.Voice'] || 'native';
      }
    );

    chrome.storage.sync.get('WebPageReader.Speech.Rate',
      function (setting) {
        self.Rate = setting['WebPageReader.Speech.Rate'] || 1.0;
      }
    );

    chrome.storage.sync.get('WebPageReader.Speech.Volume',
      function (setting) {
        self.Volume = setting['WebPageReader.Speech.Volume'] || 1.0;
      }
    );

    chrome.storage.sync.get('WebPageReader.Speech.Enabled',
      function (setting) {
        self.SpeechEnabled = setting['WebPageReader.Speech.Enabled'] || true;
      }
    );
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

  /* event handlers */
  this.Runtime_OnMessage = function (request, sender, sendResponse) {
    //console.log(sender.tab ?      "from a content script:" + sender.tab.url :      "from the extension");

    switch (request.name) {
      case 'OnReadingChanged':
        var reader = request.source;
        self.Reading = reader.Reading;
        break;
      case 'OnPausedChanged':
        var reader = request.source;
        self.Paused = reader.Paused;
        break;
      case 'OnCanNextChanged':
        var reader = request.source;
        self.CanNext = reader.CanNext;
        break;
      case 'OnCanPreviousChanged':
        var reader = request.source;
        self.CanPrevious = reader.CanPrevious;
        break;
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
