class ControlPanel extends Storable {
  /* constructor */
  constructor() {
    super()

    // voice changes from Speech
    this.Speech.OnVoicesChanged = () => {
      this.Voices = this.Speech.Voices
      if (this.Voice === null) this.Voice = this.Speech.Voice
    }

    // commands going to the reader
    start.onclick = () => {
      this.DoCommand('start')
    }
    btnStop.onclick = () => {
      this.DoCommand('stop')
    }
    pause.onclick = () => {
      this.DoCommand('pause')
    }
    resume.onclick = () => {
      this.DoCommand('resume')
    }
    next.onclick = () => {
      this.DoCommand('next')
    }
    previous.onclick = () => {
      this.DoCommand('previous')
    }

    // UI events
    chkSpeechEnabled.onchange = () => {
      this.Enabled = chkSpeechEnabled.checked
    }
    chkSkipCode.onchange = () => {
      this.SkipCode = chkSkipCode.checked
    }
    lstVoices.onchange = () => {
      this.Voice =
        lstVoices.options[lstVoices.selectedIndex].attributes[
          'data-name'
        ].nodeValue
    }
    rngVolume.onchange = () => {
      this.Volume = rngVolume.value
    }
    rngRate.onchange = () => {
      this.Rate = rngRate.value
    }
    rngPitch.onchange = () => {
      this.Pitch = rngPitch.value
    }
    rngScrollMiddleAdjust.onchange = () => {
      this.ScrollMiddleAdjust = rngScrollMiddleAdjust.value
    }

    // UI sync
    rngVolume.oninput = () => {
      rngVolume.title = rngVolume.value
      outVolume.value = `Volume (${(rngVolume.value * 100).toFixed(0)}%)`
    }
    rngRate.oninput = () => {
      rngRate.title = rngRate.value
      outRate.value = `Rate (${(rngRate.value * 100).toFixed(0)}%)`
    }
    rngPitch.oninput = () => {
      rngPitch.title = rngPitch.value
      outPitch.value = `Pitch (${(rngPitch.value * 100).toFixed(0)}%)`
    }
    rngScrollMiddleAdjust.oninput = () => {
      rngScrollMiddleAdjust.title = rngScrollMiddleAdjust.value
      outScrollMiddleAdjust.value = `Scroll "Middle" Adjust (${(
        rngScrollMiddleAdjust.value * 100
      ).toFixed(0)}%)`
    }
    lstAutoScroll.onchange = () =>
      (this.AutoScroll =
        lstAutoScroll.options[lstAutoScroll.selectedIndex].value)

    cpHighlightBackColor.onchange = () => {
      this.HighlightBackColor = cpHighlightBackColor.value
    }
    cpHighlightForeColor.onchange = () => {
      this.HighlightForeColor = cpHighlightForeColor.value
    }

    // storage changes from reader state
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.Storage_OnChange(this, changes, namespace)
      return true
    })

    // listen for reader to become active
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.Runtime_OnMessage(this, request)
      return true
    })
    this.cpload()
  }

  async cpload() {
    this.loadDefaults()

    var self = this
    var localStorage = new WindowLocalStorage()
    this.type = 'Reader'
    await this.load(localStorage)
    this.type = 'Speech'
    await this.load(localStorage)

    // adjust ui
    // I'm loading, so don't save the values
    this.Reading = this.Reading
    this.Paused = this.Paused
    this.CanPrevious = this.CanPrevious
    this.CanNext = this.CanNext
    this.Volume = this.Volume
    this.Rate = this.Rate
    this.Pitch = this.Pitch
    this.Enabled = this.Enabled
    this.SkipCode = this.SkipCode
    this.AutoScroll = this.AutoScroll
    this.ScrollMiddleAdjust = this.ScrollMiddleAdjust
    this.HighlightBackColor = this.HighlightBackColor
    this.HighlightForeColor = this.HighlightForeColor

    this.loading = false

    // load the color picker component
    $(function () {
      $('#cp-HighlightBackColor').colorpicker({
        color: self.HighlightBackColor,
        container: true,
        inline: true,
      })
      $('#cp-HighlightForeColor').colorpicker({
        color: self.HighlightForeColor,
        container: true,
        inline: true,
      })
    })
  }

  /* private properties */
  #speech
  get Speech() {
    return (this.#speech = this.#speech
      ? this.#speech
      : new WebPageReader.Speech())
  }

  #language
  get Language() {
    return (this.#language = this.#language
      ? this.#language
      : new WebPageReader.Language())
  }

  /* public properties */
  #reading = false
  get Reading() {
    return this.#reading
  }
  set Reading(value) {
    this.#reading = value.toString() == 'true'
    this.#display(start, !this.#reading)
    btnStop.disabled = !this.#reading
    this.#display(pause, this.#reading && !this.Paused)
  }

  #paused = false
  get Paused() {
    return this.#paused
  }
  set Paused(value) {
    this.#paused = value.toString() == 'true'
    this.#display(start, !this.#reading)
    btnStop.disabled = !this.#reading
    this.#display(pause, this.#reading && !this.#paused)
    this.#display(resume, this.#paused)
  }

  #canPrevious = false
  get CanPrevious() {
    return this.#canPrevious
  }
  set CanPrevious(value) {
    this.#canPrevious = value.toString() == 'true'
    previous.disabled = !this.#canPrevious
  }

  #canNext = false
  get CanNext() {
    return this.#canNext
  }
  set CanNext(value) {
    this.#canNext = value.toString() == 'true'
    next.disabled = !this.#canNext
  }

  #voices = []
  get Voices() {
    return this.#voices
  }
  set Voices(value) {
    if (Array.isArray(value)) {
      this.#voices = value
      this.#loadVoices()
    }
  }

  #voice = null
  get Voice() {
    return this.#voice
  }
  set Voice(value) {
    this.#voice = value
    console.log(`setting voice to ${this.Voice}`)
    this.#saveSpeechSettings('Voice')
    this.DoCommand('setting', 'voice', this.Voice)
  }

  #volume = 1.0
  get Volume() {
    return this.#volume
  }
  set Volume(value) {
    value = Number(value)
    if (value == this.#volume) return
    this.#volume = value
    rngVolume.value = this.Volume
    rngVolume.title = this.Volume
    outVolume.value = `Volume (${(this.Volume * 100).toFixed(0)}%)`
    this.#saveSpeechSettings('Volume')
    this.DoCommand('setting', 'volume', this.Volume)
  }

  #rate = 1.0
  get Rate() {
    return this.#rate
  }
  set Rate(value) {
    value = Number(value)
    if (value == this.#rate) return
    this.#rate = value
    rngRate.value = this.Rate
    rngRate.title = this.Rate
    outRate.value = `Rate (${(this.Rate * 100).toFixed(0)}%)`
    this.#saveSpeechSettings('Rate')
    this.DoCommand('setting', 'rate', this.Rate)
  }

  #pitch = 1.0 // [0.0,2.0]
  get Pitch() {
    return this.#pitch
  }
  set Pitch(value) {
    value = Number(value)
    if (value == this.#pitch) return
    this.#pitch = value
    rngPitch.value = this.Pitch
    rngPitch.title = this.Pitch
    outPitch.value = `Pitch (${(this.Pitch * 100).toFixed(0)}%)`
    this.#saveSpeechSettings('Pitch')
    this.DoCommand('setting', 'pitch', this.Pitch)
  }

  #Enabled = true
  get Enabled() {
    return this.#Enabled
  }
  set Enabled(value) {
    this.#Enabled = value.toString() == 'true'
    chkSpeechEnabled.checked = this.Enabled
    this.#saveSpeechSettings('Enabled')
    this.DoCommand('setting', 'enabled', this.Enabled)
  }

  #skipCode = true
  get SkipCode() {
    return this.#skipCode
  }
  set SkipCode(value) {
    this.#skipCode = value.toString() == 'true'
    chkSkipCode.checked = this.#skipCode
    this.#saveReaderSettings('SkipCode')
    this.DoCommand('setting', 'skipcode', this.SkipCode)
  }

  #autoScroll = 'ScrollByPages'
  get AutoScroll() {
    return this.#autoScroll
  }
  set AutoScroll(value) {
    if (value == this.AutoScroll) return
    this.#autoScroll = value
    lstAutoScroll.value = this.AutoScroll
    this.#saveReaderSettings('AutoScroll')
    this.DoCommand('setting', 'autoscroll', this.AutoScroll)
  }

  #scrollMiddleAdjust = 0.5 // [0.0, 1.0], 0.5 is middle of screen
  get ScrollMiddleAdjust() {
    return this.#scrollMiddleAdjust
  }
  set ScrollMiddleAdjust(value) {
    value = Number(value)
    if (value == this.#scrollMiddleAdjust) return
    this.#scrollMiddleAdjust = value
    rngScrollMiddleAdjust.value = this.ScrollMiddleAdjust
    rngScrollMiddleAdjust.title = this.ScrollMiddleAdjust
    outScrollMiddleAdjust.value = `Scroll "Middle" Adjust (${(
      this.ScrollMiddleAdjust * 100
    ).toFixed(0)}%)`
    this.#saveReaderSettings('ScrollMiddleAdjust')
    this.DoCommand('setting', 'scroll-middle-adjust', this.ScrollMiddleAdjust)
  }

  #highlightBackColor = `purple`
  get HighlightBackColor() {
    return this.#highlightBackColor
  }
  set HighlightBackColor(value) {
    this.#highlightBackColor = value
    cpHighlightBackColor.style.backgroundColor = this.HighlightBackColor
    highlightPreview.style.backgroundColor = this.HighlightBackColor
    this.#saveReaderSettings('HighlightBackColor')
    this.DoCommand('setting', 'highlight-backcolor', this.HighlightBackColor)
  }

  #highlightForeColor = `#333`
  get HighlightForeColor() {
    return this.#highlightForeColor
  }
  set HighlightForeColor(value) {
    this.#highlightForeColor = value
    cpHighlightForeColor.style.color = this.HighlightForeColor
    highlightPreview.style.color = this.HighlightForeColor
    this.#saveReaderSettings('HighlightForeColor')
    this.DoCommand('setting', 'highlight-forecolor', this.HighlightForeColor)
  }

  /* public methods */
  DoCommand(command, setting, value) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          command: command,
          setting: setting,
          value: value,
        },
        (response) => console.log(response?.outcome)
      )
    })
  }

  /* private methods */
  #display(el, condition) {
    el.style.display = condition ? 'inline' : 'none'
  }

  #excludedLanguages = ['Russian']
  #loadVoices() {
    var groupLanguage
    for (var i = 0; i < this.Voices.length; i++) {
      var voiceLanguage =
        this.Language.LanguageName(this.Voices[i].lang) || 'Local'
      if (this.#excludedLanguages.includes(voiceLanguage)) continue
      if (voiceLanguage != groupLanguage) {
        groupLanguage = voiceLanguage
        var optGroup = document.createElement('optgroup')
        optGroup.setAttribute('label', groupLanguage)
        lstVoices.appendChild(optGroup)
      }
      var option = document.createElement('option')
      option.textContent = this.Voices[i].name // + ' (' + this.Voices[i].lang + ')';

      if (this.Voices[i].name == this.Voice)
        option.setAttribute('selected', true)
      option.setAttribute('data-lang', this.Voices[i].lang)
      option.setAttribute('data-name', this.Voices[i].name)
      optGroup.appendChild(option)
    }
  }

  #saveSpeechSettings(property) {
    this.type = 'Speech'
    this.saveProperty(new ChromeSyncStorage(), property)
    this.saveProperty(new WindowLocalStorage(), property)
    // this.saveProperty(new WindowSessionStorage(), property)
    // return this.saveProperty(new ChromeLocalStorage(), property)
  }

  #saveReaderSettings(property) {
    this.type = 'Reader'
    this.saveProperty(new ChromeSyncStorage(), property)
    this.saveProperty(new WindowLocalStorage(), property)
    // this.saveProperty(new WindowSessionStorage(), property)
    // return this.saveProperty(new ChromeLocalStorage(), property)
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
        case 'WebPageReader.Reader.Reading':
          self.Reading = storageChange.newValue
          break
        case 'WebPageReader.Reader.Paused':
          self.Paused = storageChange.newValue
          break
        case 'WebPageReader.Reader.CanNext':
          self.CanNext = storageChange.newValue
          break
        case 'WebPageReader.Reader.CanPrevious':
          self.CanPrevious = storageChange.newValue
          break
      }
    }
  }

  Runtime_OnMessage(self, request) {
    switch (request.name) {
      case 'OnActivated':
        var reader = request.source
        self.Reading = reader.Reading
        self.Paused = reader.Paused
        self.CanNext = reader.CanNext
        self.CanPrevious = reader.CanPrevious
        break
      case 'OnPropertyChanged':
        // reader state changes
        this[request.property] = request.value
        break
    }
  }
}

WebPageReader.UI.ControlPanel = new ControlPanel()
