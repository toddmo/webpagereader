WebPageReader.Speech = function () {

  /* events */
  this.OnSpeakingEnded = null;

  /* constructor */
  function constructor() {
    self.Load();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    setTimeout(loadVoices, 200);
    chrome.storage.onChanged.addListener(self.Storage_OnChange);
  }

  /* private properties */
  var self = this;
  var storage = new WebPageReader.Storage(this);

  /* public properties */
  var enabled = true;
  Object.defineProperty(this, "SpeechEnabled", {
    get: function () {
      return enabled
    },
    set: function (value) {
      value = value.toString() == "true";
      if (value == enabled) return;
      enabled = value;
    },
    enumerable: true
  });

  var voices = null;
  this.OnVoicesChanged = null;
  Object.defineProperty(this, "Voices", {
    get: function () {
      return voices;
    },
    set: function (value) {
      voices = value;
      voices.sort(voiceCompare);
      if (this.OnVoicesChanged) this.OnVoicesChanged(this);
    },
    enumerable: true
  });

  var rate = 1.0;
  Object.defineProperty(this, "Rate", {
    get: function () {
      return rate
    },
    set: function (value) {
      value = Number(value);
      if (value == rate) return;
      rate = value;
    },
    enumerable: true
  });

  var volume = 1.0;
  Object.defineProperty(this, "Volume", {
    get: function () {
      return volume
    },
    set: function (value) {
      value = Number(value);
      if (value == volume) return;
      volume = value;
    },
    enumerable: true
  });

  var voice = 'native';
  Object.defineProperty(this, "Voice", {
    get: function () {
      return voice
    },
    set: function (value) {
      if (value == voice) return;
      voice = value;
    },
    enumerable: true
  });

  /* public methods */
  this.getType = function () { return "WebPageReader.Speech" }

  this.Speak = function (text) {
    if (!enabled) return;

    var utt = new SpeechSynthesisUtterance(text);
    utt.voice = Enumerable.From(self.Voices).Single(v => v.name == voice);
    utt.rate = rate;
    utt.volume = volume;

    utt.onend = function (event) {
      setTimeout(self.OnSpeakingEnded, 0);
    };
    /*
    function _wait() {
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        self.OnSpeakingEnded();
        return;
      }
      window.setTimeout(_wait, 200);
    }*/
    window.speechSynthesis.speak(utt);
    //_wait(); // a quirk that had to be introduced because the onend event wasn't reliable
  }

  this.Stop = function () {
    var speaking = window.speechSynthesis.speaking;
    window.speechSynthesis.cancel();
    if (!speaking)
      setTimeout(self.OnSpeakingEnded, 0); // mimic speaking end event
  }

  this.Pause = function () {
    window.speechSynthesis.pause();
  }

  this.Resume = function () {
    window.speechSynthesis.resume();
  }

  this.Load = function () {
    storage.Load(storage.Types.Sync);
  }

  /* private methods */
  function loadVoices() {
    self.Voices = window.speechSynthesis.getVoices();
  }

  function voiceCompare(a, b) {
    if (a.lang < b.lang) {
      return -1;
    }
    if (a.lang > b.lang) {
      return 1;
    }
    // a must be equal to b
    return 0;
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
        case 'WebPageReader.Speech.SpeechEnabled':
          self.SpeechEnabled = storageChange.newValue;
          break;
        case 'WebPageReader.Speech.Voice':
          self.Voice = storageChange.newValue;
          break;
        case 'WebPageReader.Speech.Rate':
          self.Rate = storageChange.newValue;
          break;
        case 'WebPageReader.Speech.Volume':
          self.Volume = storageChange.newValue;
          break;
      };
        
    }
  }

  constructor();  // finally call constructor
}

