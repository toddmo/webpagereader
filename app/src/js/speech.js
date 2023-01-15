class Speech extends Storable {

  constructor() {
    super()
    this.OnSpeakingEnded = null;
    this.OnVoicesChanged = null;
    this.Load();
    const loadVoices = () => { this.loadVoices(this) }
    window.speechSynthesis.onvoiceschanged = loadVoices
    loadVoices()
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.Storage_OnChange(this, changes, namespace)
    });
  }

  /* public properties */
  #enabled = true;
  get Enabled() {
    return this.#enabled
  }
  set Enabled(value) {
    value = value.toString() == "true";
    if (value == this.#enabled) return;
    this.#enabled = value;
  }

  #rate = 1.0;
  get Rate() {
    return this.#rate
  }
  set Rate(value) {
    value = Number(value);
    if (value == this.#rate) return;
    this.#rate = value;
  }

  #volume = 1.0;
  get Volume() {
    return this.#volume
  }
  set Volume(value) {
    value = Number(value);
    if (value == this.#volume) return;
    this.#volume = value;
  }

  #voice = null;
  get Voice() {
    return this.#voice
  }
  set Voice(value) {
    console.log(`speech voice set to ${value}`)
    if (value == this.#voice) return;
    this.#voice = value;
    this.saveProperty(new WindowLocalStorage(), 'Voice')
  }

  #voices = []
  get Voices() {
    return this.#voices
  }
  set Voices(value) {
    if (!Array.isArray(value)) return
    if (value.length == 0) return
    this.#voices = value;
    console.log(`${this.Voices.length} Voices set on speech ${this.id}`)
    this.Voices.sort(this.#voiceCompare);
    if (this.OnVoicesChanged) {
      console.log('calling speech voices changed event')
      this.OnVoicesChanged(this);
      if (!this.Voice && this.Voices.length)
        this.Voice = Enumerable.From(this.Voices).First(v => v.name.toLowerCase().includes('english'));
    }
  }

  /* public methods */

  // bug where it just stops speaking
  #speakResumeInterval
  #setInterval() {
    this.#speakResumeInterval = setInterval(() => {
      window.speechSynthesis.pause()
      window.speechSynthesis.resume()
    }, 10000);
  }
  #clearInterval() {
    clearInterval(this.#speakResumeInterval);
  }

  Speak(text) {
    console.log(`${this.Voices.length} Voices set on speech ${this.id}`)
    if (!this.Enabled)
      return false;
    else if (this.Voices.length == 0)
      return false

    var self = this
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = Enumerable.From(this.Voices).Single(v => v.name == self.Voice);
    utterance.rate = this.Rate;
    utterance.volume = this.Volume;

    utterance.onend = (event) => {
      this.#clearInterval()
      setTimeout(this.OnSpeakingEnded, 0)
    }
    /*
    function _wait() {
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        this.OnSpeakingEnded();
        return;
      }
      window.setTimeout(_wait, 200);
    }*/
    window.speechSynthesis.speak(utterance);
    this.#setInterval()

    //_wait(); // a quirk that had to be introduced because the onend event wasn't reliable
    // console.log(`spoke ${text}`)
    return true
  }

  Stop() {
    this.#clearInterval()
    var speaking = window.speechSynthesis.speaking;
    window.speechSynthesis.cancel();
    if (!speaking)
      setTimeout(this.OnSpeakingEnded, 0); // mimic speaking end event
  }

  Pause() {
    this.#clearInterval()
    window.speechSynthesis.pause();
  }

  Resume() {
    window.speechSynthesis.resume();
    this.#setInterval()
  }

  Load() {
    console.log(`speech loading `)
    this.load(new ChromeSyncStorage())
    this.load(new WindowLocalStorage())
  }

  /* private methods */
  loadVoices(self) {
    if (window.speechSynthesis.getVoices().length)
      self.Voices = window.speechSynthesis.getVoices()
  }

  #voiceCompare(a, b) {
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
  Storage_OnChange(self, changes, namespace) {
    for (var key in changes) {
      var storageChange = changes[key];
      console.log('Storage key "%s" in namespace "%s" changed. ' +
        'Old value was "%s", new value is "%s".',
        key,
        namespace,
        storageChange.oldValue,
        storageChange.newValue);
      switch (key) {
        case 'WebPageReader.Speech.Enabled':
          self.Enabled = storageChange.newValue;
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
}

WebPageReader.Speech = Speech

