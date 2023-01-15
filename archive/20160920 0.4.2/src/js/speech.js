WebPageReader.Speech = function () {

  /* events */
  this.OnSpeakingEnded = null;

  /* constructor */
  function constructor(){
    load();
  }

  /* private properties */
  var self = this;
  var storage = new WebPageReader.Storage(this);

  /* public properties */
  var enabled = true;
  this.OnEnabledChanged = null;
  Object.defineProperty(this, "Enabled", {
    get: function () {
      return enabled
    },
    set: function (value) {
      value = value.toString() == "true";
      if(value == enabled) return;
      enabled = value;
      this.Save();
      if (this.OnEnabledChanged) this.OnEnabledChanged(this);
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
  this.OnRateChanged = null;
  Object.defineProperty(this, "Rate", {
    get: function () {
      return rate
    },
    set: function (value) {
      value = Number(value);
      if(value == rate) return;
      rate = value;
      this.Save();
      if (this.OnRateChanged) this.OnRateChanged(this);
    },
    enumerable: true
  });

  var volume = 1.0;
  this.OnVolumeChanged = null;
  Object.defineProperty(this, "Volume", {
    get: function () {
      return volume
    },
    set: function (value) {
      value = Number(value);
      if(value == volume) return;
      volume = value;
      this.Save();
      if (this.OnVolumeChanged) this.OnVolumeChanged(this);
    },
    enumerable: true
  });

  var voice = 'native';
  this.OnVoiceChanged = null;
  Object.defineProperty(this, "Voice", {
    get: function () {
      return voice
    },
    set: function (value) {
      if(value == voice) return;
      voice = value;
      this.Save();
      if (this.OnVoiceChanged) this.OnVoiceChanged(this);
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
    
    utt.onend = function(event){
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
    if(!speaking)
      setTimeout(self.OnSpeakingEnded, 0); // mimic speaking end event
  }

  this.Pause = function () {
    window.speechSynthesis.pause();
  }

  this.Resume = function () {
    window.speechSynthesis.resume();
  }

  this.Save = function () {
    storage.Save(storage.Types.Sync);
  }

  this.Load = function () {
    storage.Load(storage.Types.Sync);
  }

  /* private methods */
  function load(){
    self.Load();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    setTimeout(loadVoices, 200);
  }

  function loadVoices(){
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

  constructor();  // finally call constructor
}

