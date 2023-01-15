class Speech extends Storable {
  constructor() {
    super()
    this.#debugging = false
    this.OnSpeakingEnded = null
    this.OnVoicesChanged = null
    const loadVoices = () => {
      this.loadVoices(this)
    }
    window.speechSynthesis.onvoiceschanged = loadVoices
    loadVoices()
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.Storage_OnChange(this, changes, namespace)
      return true
    })
    this.Load()
  }

  // storable
  static get ignore() {
    return Storable.ignore.concat(['Voices'])
  }

  //#region Private Properties
  #debugging // set to true to output speech
  //#endregion

  /* public properties */
  #enabled = true
  get Enabled() {
    return this.#enabled
  }
  set Enabled(value) {
    value = value.toString() == 'true'
    if (value == this.#enabled) return
    this.#enabled = value
  }

  #voices = []
  get Voices() {
    return this.#voices
  }
  set Voices(value) {
    if (!Array.isArray(value)) return
    if (value.length == 0) return
    this.#voices = value
    this.Voices.sort(this.#voiceCompare)
    if (!this.Voice && this.Voices.length) {
      var voices = Enumerable.From(this.Voices)
      var voice =
        voices.First((voice) =>
          ['en-gb', 'en-us'].includes(voice.lang.toLowerCase())
        ) ||
        voices.First((voice) => voice.name.toLowerCase().includes('english')) ||
        voices.First()
      this.Voice = voice.name
    }
    if (this.OnVoicesChanged) this.OnVoicesChanged(this)
  }

  #voice = null
  get Voice() {
    return this.#voice
  }
  set Voice(value) {
    if (value == this.#voice) return
    this.#voice = value
    // clear throat
    this.Resume()
    this.Stop()
  }

  #volume = 1.0
  get Volume() {
    return this.#volume
  }
  set Volume(value) {
    value = Number(value)
    if (value == this.#volume) return
    this.#volume = value
    this.#notifyPropertyChange('Volume')
  }

  #rate = 1.0
  get Rate() {
    return this.#rate
  }
  set Rate(value) {
    value = Number(value)
    if (value == this.#rate) return
    this.#rate = value
    this.#notifyPropertyChange('Rate')
  }

  #pitch = 1.0 // [0.0,2.0], default 1.0
  get Pitch() {
    return this.#pitch
  }
  set Pitch(value) {
    value = Number(value)
    if (value == this.#pitch) return
    this.#pitch = value
    this.#notifyPropertyChange('Pitch')
  }
  //#endregion

  /* public methods */
  #notifyPropertyChange(property) {
    if (this.#debugging)
      console.log(`speech.${property} changed to ${this[property]}`)
    chrome.runtime.sendMessage({
      name: 'OnPropertyChanged',
      source: this.obj,
      property: property,
      value: this[property],
    })
  }

  // bug where it just stops speaking
  #ResumeIntervalTimeout = 15000
  get ResumeIntervalTimeout() {
    return this.#ResumeIntervalTimeout
  }
  set ResumeIntervalTimeout(value) {
    this.#ResumeIntervalTimeout = value
  }

  #speakResumeInterval = []
  #setInterval() {
    if (this.ResumeIntervalTimeout > 0)
      this.#speakResumeInterval.push(
        setInterval(() => {
          window.speechSynthesis.pause()
          window.speechSynthesis.resume()
        }, this.ResumeIntervalTimeout)
      )
    else {
      this.#clearInterval()
    }
  }
  #clearInterval() {
    for (var interval of this.#speakResumeInterval) clearInterval(interval)
    this.#speakResumeInterval = []
  }

  Speak(text) {
    if (!this.Enabled) return false
    else if (this.Voices.length == 0) return false

    var self = this
    var utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = Enumerable.From(this.Voices).Single(
      (v) => v.name == self.Voice
    )
    utterance.pitch = this.Pitch
    utterance.rate = this.Rate
    utterance.volume = this.Volume

    utterance.onend = (event) => {
      this.#clearInterval()
      setTimeout(self.OnSpeakingEnded, 0)
    }
    utterance.onboundary = (event) => {
      console.log(`speech boundary: ${JSON.stringify(event)}`)
    }

    if (this.#debugging) {
      utterance.onerror = (event) => {
        console.log(
          `An error has occurred with the speech synthesis: ${event.error}`
        )
      }
      utterance.onpause = (event) => {
        ;`speech paused: ${JSON.stringify(event)}`
      }
    }
    // function _wait() {
    //   console.log(
    //     `speaking: ${window.speechSynthesis.speaking}. Pending: ${window.speechSynthesis.pending}`
    //   )
    //   // if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
    //   //   this.OnSpeakingEnded();
    //   //   return;
    //   // }
    //   window.setTimeout(_wait, 2000)
    // }
    if (this.#debugging) console.log(`speaking ${text}`)
    // when it cuts off mid-sentence, it still says it's speaking
    window.speechSynthesis.speak(utterance)
    this.#setInterval()

    // a quirk that had to be introduced because the onend event wasn't reliable
    // if (this.#debugging) _wait()

    return true
  }

  Stop() {
    this.#clearInterval()
    var speaking = window.speechSynthesis.speaking
    window.speechSynthesis.cancel()
    if (!speaking) setTimeout(() => this.OnSpeakingEnded, 0) // mimic speaking end event
  }

  Pause() {
    this.#clearInterval()
    window.speechSynthesis.pause()
    this.#clearInterval()
  }

  Resume() {
    window.speechSynthesis.resume()
    this.#setInterval()
  }

  async Load() {
    this.loadDefaults()

    // console.log(`speech loading `)
    await this.load(new WebPageReader.ChromeSyncStorage())
    // await this.load(new WebPageReader.WindowLocalStorage())
    this.loading = false
  }

  /* private methods */
  loadVoices(self) {
    if (window.speechSynthesis.getVoices().length)
      self.Voices = window.speechSynthesis.getVoices()
  }

  #voiceCompare(a, b) {
    if (a.lang < b.lang) {
      return -1
    }
    if (a.lang > b.lang) {
      return 1
    }
    // a must be equal to b
    return 0
  }

  /* event handlers */
  Storage_OnChange(self, changes, namespace) {
    for (var key in changes) {
      var storageChange = changes[key]
      // console.log('Storage key "%s" in namespace "%s" changed. ' +
      //   'Old value was "%s", new value is "%s".',
      //   key,
      //   namespace,
      //   storageChange.oldValue,
      //   storageChange.newValue);
      switch (key) {
        case 'WebPageReader.Speech.Enabled':
          self.Enabled = storageChange.newValue
          break
        case 'WebPageReader.Speech.Voice':
          self.Voice = storageChange.newValue
          break
        case 'WebPageReader.Speech.Rate':
          self.Rate = storageChange.newValue
          break
        case 'WebPageReader.Speech.Volume':
          self.Volume = storageChange.newValue
          break
      }
    }
  }
}

WebPageReader.Speech = Speech
