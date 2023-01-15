/*  reading = speaking + highlighting
    the reader contains a sentence and speech
    it follows a media player pattern (play, stop, next, previous, pause, resume)
    it raises events so media ui controls can update their state
*/
class Reader extends Storable {
  constructor() {
    super()

    // commands from control panel and background (chrome commands)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.Runtime_OnMessage(this, request, sendResponse)
      return true
    })

    // settings from control panel
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.Storage_OnChange(this, changes, namespace)
      return true
    })

    this.Speech.OnSpeakingEnded = () => this.Speech_OnSpeakingEnded(this)

    // speed keys
    document.onkeydown = (ev) => {
      this.Document_Onkeydown(this, ev)
    }

    document.onmouseup = (ev) => {
      this.Document_Onmouseup(this, ev)
    }

    const thisGetActive = () => {
      this.#getActive(this)
    }
    document.addEventListener('visibilitychange', thisGetActive)
    window.addEventListener('focus', thisGetActive)
    window.addEventListener('blur', thisGetActive)
    thisGetActive()

    this.#load()
  }

  /* enumerations */
  get Intentions() {
    return {
      Normal: 1,
      Next: 2,
      Previous: 3,
      Repeat: 4,
    }
  }

  /* private properties */
  #intention = this.Intentions.Normal
  get Intention() {
    return this.#intention
  }
  set Intention(value) {
    this.#intention = value
  }

  #sentence = null
  get Sentence() {
    return this.#sentence
  }
  set Sentence(value) {
    this.#sentence = value
  }
  #retreating = false

  /* public properties */
  #speech = new WebPageReader.Speech()
  get Speech() {
    return this.#speech
  }

  //#region Session Properties
  #active = false
  get Active() {
    return this.#active
  }
  set Active(value) {
    value = value.toString() == 'true'
    if (value == this.#active) return
    this.#active = value
    if (this.#active) {
      // this.#save()
      // send state to control panel
      chrome.runtime.sendMessage({
        name: 'OnActivated',
        source: this.obj,
      })
      if (this.Sentence) this.Sentence.Highlight()
      if (this.Reading) {
        this.Start(this)
      }
    } else if (this.Reading) this.Stop(this)
  }

  #reading = false
  get Reading() {
    return this.#reading
  }
  set Reading(value) {
    value = value.toString() == 'true'
    // if (value == this.#reading) return;
    this.#reading = value
    this.#saveProperty(new WebPageReader.WindowSessionStorage(), 'Reading')
    this.#notifyPropertyChange('Reading')
    if (this.OnReadingChanged) this.OnReadingChanged(this)
  }

  #paused = false
  get Paused() {
    return this.#paused
  }
  set Paused(value) {
    value = value.toString() == 'true'
    // if (value == this.#paused) return;
    this.#paused = value
    this.#saveProperty(new WebPageReader.WindowSessionStorage(), 'Paused')
    this.#notifyPropertyChange('Paused')
    if (this.OnPausedChanged) this.OnPausedChanged(this)
  }

  #canPrevious = false
  get CanPrevious() {
    return this.#canPrevious
  }
  set CanPrevious(value) {
    value = value.toString() == 'true'
    // if (value == this.#canPrevious) return;
    this.#canPrevious = value
    this.#saveProperty(new WebPageReader.WindowSessionStorage(), 'CanPrevious')
    this.#notifyPropertyChange('CanPrevious')
    if (this.OnCanPreviousChanged) this.OnCanPreviousChanged(this)
  }

  #canNext = false
  get CanNext() {
    return this.#canNext
  }
  set CanNext(value) {
    value = value.toString() == 'true'
    // if (value == this.#canNext) return;
    this.#canNext = value
    this.#saveProperty(new WebPageReader.WindowSessionStorage(), 'CanNext')
    this.#notifyPropertyChange('CanNext')
    if (this.OnCanNextChanged) this.OnCanNextChanged(this)
  }
  //#endregion

  //#region Settings Properties
  #skipCode = true
  get SkipCode() {
    return this.#skipCode
  }
  set SkipCode(value) {
    this.#skipCode = value.toString() == 'true'
    this.#saveProperty(new WebPageReader.WindowLocalStorage(), 'SkipCode')
    if (this.Sentence) this.Sentence.SkipCode = this.SkipCode
  }

  #highlightBackColor = `dodgerblue`
  get HighlightBackColor() {
    return this.#highlightBackColor
  }
  set HighlightBackColor(value) {
    this.#highlightBackColor = value
    this.#saveProperty(
      new WebPageReader.WindowLocalStorage(),
      'HighlightBackColor'
    )
    this.#createSelectionStyle()
  }

  #highlightForeColor = `#333`
  get HighlightForeColor() {
    return this.#highlightForeColor
  }
  set HighlightForeColor(value) {
    this.#highlightForeColor = value
    this.#saveProperty(
      new WebPageReader.WindowLocalStorage(),
      'HighlightForeColor'
    )
    this.#createSelectionStyle()
  }
  //#endregion

  #createSelectionStyle() {
    var styleTag
    var id = 'highlight-style'
    styleTag = document.getElementById(id)
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.setAttribute('id', id)
      document.body.appendChild(styleTag)
    }
    styleTag.innerText = `::selection { background-color: ${this.HighlightBackColor} !important;
    color:${this.HighlightForeColor} !important}`
  }

  Start(self) {
    self.Sentence = new WebPageReader.Sentence()
    self.Sentence.SkipCode = self.SkipCode
    self.#read(self)
  }

  Stop(self) {
    self.Reading = false
    self.Paused = false
    self.CanPrevious = false
    self.CanNext = false
    self.Speech.Stop()
  }

  Repeat(self) {
    self.Intention = self.Intentions.Repeat
    self.Speech.Stop()
  }

  Pause(self) {
    self.Paused = true
    self.CanPrevious = false
    self.CanNext = false
    self.Speech.Pause()
  }

  Resume(self) {
    self.Paused = false
    self.CanPrevious = self.Sentence.CanPrevious
    self.CanNext = self.Sentence.CanNext
    self.Sentence.Highlight()
    self.Speech.Resume()
  }

  Next(self) {
    self.Intention = self.Intentions.Next
    self.Speech.Stop()
  }

  Previous(self) {
    self.Intention = self.Intentions.Previous
    self.Speech.Stop()
  }

  /* private methods */
  #advance(self) {
    if (!self.Reading || !self.Sentence) self.Start(self)
    else if (self.Reading && self.Paused) self.Resume(self)
    else if (self.Reading) self.Next(self)
    self.#retreating = false
  }

  #retreat(self) {
    if (!self.#retreating && self.Reading) {
      self.Pause(self)
    } else if (self.Reading) {
      if (self.Paused) self.Resume(self)
      self.Previous(self)
    }
    self.#retreating = true
  }

  #arrest(self) {
    if (self.Reading && !self.Paused) self.Pause(self)
    else if (self.Reading) self.Stop(self)
  }

  #louder(self) {
    self.Speech.Volume = Math.min(self.Speech.Volume + 0.1, 1.0)
  }

  #softer(self) {
    self.Speech.Volume = Math.max(self.Speech.Volume - 0.1, 0.0)
  }

  #faster(self) {
    self.Speech.Rate = Math.min(self.Speech.Rate + 0.1, 1.5)
  }

  #slower(self) {
    self.Speech.Rate = Math.max(self.Speech.Rate - 0.1, 0.0)
  }

  #higher(self) {
    self.Speech.Pitch = Math.min(self.Speech.Pitch + 0.1, 2.0)
  }

  #lower(self) {
    self.Speech.Pitch = Math.max(self.Speech.Pitch - 0.1, 0.0)
  }

  #getActive(self) {
    if (typeof chrome.runtime.id !== 'undefined') {
      chrome.runtime.sendMessage(
        chrome.runtime.id,
        'isSelected',
        function (isSelected) {
          if (!chrome.runtime.lastError) {
            //this tab is in focus or not
            self.Active = isSelected
          }
        }
      )
    }
  }

  async #load() {
    this.loadDefaults()

    // reader state is per tab
    await this.load(new ChromeSyncStorage()) // load reader / speech settings from popup (this works even w/o being logged in)
    // await this.load(new WindowLocalStorage())
    await this.load(new WindowSessionStorage()) // load reader state (buttons)
    await this.Speech.Load()

    this.loading = false
  }

  #save() {
    // so I will pick up my own state upon reload
    this.save(new WebPageReader.WindowSessionStorage())
    // so control panel can pick up my state
    return this.save(new WebPageReader.ChromeSyncStorage())
  }

  #saveProperty(storage, property) {
    this.saveProperty(storage, property)
  }

  #notifyPropertyChange(property) {
    chrome.runtime.sendMessage({
      name: 'OnPropertyChanged',
      source: this.obj,
      property: property,
      value: this[property],
    })
  }

  #read(self) {
    self.Intention = self.Intentions.Normal
    self.Reading = true
    self.CanPrevious = self.Sentence.CanPrevious
    self.CanNext = self.Sentence.CanNext
    //sentence.Visualize();
    self.Sentence.Highlight()
    self.Speech.Speak(self.Sentence.toString())
    return true
  }

  #readNext(self) {
    if (!self.Reading || !self.Active) return
    self.#retreating = false
    self.Sentence.Unhighlight()
    self.Sentence.Next()
    setTimeout(() => self.#read(self), 0)
  }

  /* event handlers */
  Document_Onmouseup(self, ev) {
    if (!self.Reading) return true
    // restart reading at new selection
    var hasSelection = window.getSelection()?.type == 'Range'
    if (hasSelection) {
      self.Stop(self)
      window.setTimeout(() => self.Start(self), 200)
    }
    return false
  }

  Document_Onkeydown(self, ev) {
    if (
      !self.Active ||
      ev.shiftKey ||
      ev.ctrlKey ||
      ev.altKey ||
      ['INPUT', 'TEXTAREA'].indexOf(ev.srcElement.nodeName) > -1 ||
      ev.srcElement.getAttribute('contenteditable') != null
    )
      return true

    switch (ev.key) {
      case 'Tab':
        if (self.Reading) {
          var el = self.Sentence.StartCharacter.TextNode.parentElement
          if (el.tagName == 'A') el.focus()
        }
        break
      case 'Enter':
        self.Repeat(self)
        break
      case 'ArrowRight':
        self.#advance(self)
        break
      case 'ArrowLeft':
        self.#retreat(self)
        break
      case 'Escape':
        self.#arrest(self)
        break
      case '+':
        self.#louder(self)
        break
      case '-':
        self.#softer(self)
        break
      case '8':
        self.#faster(self)
        break
      case '2':
        self.#slower(self)
        break
      case '9':
        self.#higher(self)
        break
      case '3':
        self.#lower(self)
        break
      default:
        //console.log(ev.key);
        return true
    }
    return false // handled; cancel keydown event
  }

  Speech_OnSpeakingEnded(self) {
    switch (self.Intention) {
      case self.Intentions.Previous:
        self.Sentence.Previous()
        setTimeout(() => self.#read(self), 200)
        break
      case self.Intentions.Next:
        self.Sentence.Next()
        setTimeout(() => self.#read(self), 200)
        break
      case self.Intentions.Repeat:
        setTimeout(() => self.#read(self), 200)
        break
      case self.Intentions.Normal:
      default:
        self.#readNext(self)
    }
  }

  // messages from control panel
  Runtime_OnMessage(self, request, sendResponse) {
    switch (request.command) {
      case 'start':
        self.Start(self)
        break
      case 'stop':
        self.Stop(self)
        break
      case 'pause':
        self.Pause(self)
        break
      case 'resume':
        self.Resume(self)
        break
      case 'repeat':
        self.Repeat(self)
        break
      case 'next':
        self.Next(self)
        break
      case 'previous':
        self.Previous(self)
        break
      case 'setting':
        switch (request.setting) {
          case 'skipcode':
            self.SkipCode = request.value
            break
          case 'autoscroll':
            self.Sentence.AutoScroll = request.value
            break
          case 'scroll-middle-adjust':
            self.Sentence.ScrollMiddleAdjust = request.value
            break
          case 'highlight-backcolor':
            self.HighlightBackColor = request.value
            break
          case 'highlight-forecolor':
            self.HighlightForeColor = request.value
            break
          case 'voice':
            self.Speech.Voice = request.value
            break
          case 'volume':
            self.Speech.Volume = request.value
            break
          case 'rate':
            self.Speech.Rate = request.value
            break
          case 'pitch':
            self.Speech.Pitch = request.value
            break
          case 'enabled':
            self.Speech.Enabled = request.value
            break
          default:
            console.log('unknown setting ' + request.setting)
        }
        break
      default:
        console.log('unknown command ' + request.command)
    }
    sendResponse({ outcome: 'success' })
  }

  /* event handlers */
  // this doesn't work b/c content and popup don't share the same storage
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
        case 'WebPageReader.Reader.SkipCode':
          self.SkipCode = storageChange.newValue
          break
        case 'WebPageReader.Reader.AutoScroll':
          self.Sentence.AutoScroll = storageChange.newValue
          break
        case 'WebPageReader.Reader.ScrollMiddleAdjust':
          self.Sentence.ScrollMiddleAdjust = storageChange.newValue
          break
        case 'WebPageReader.Reader.HighlightBackColor':
          self.HighlightBackColor = storageChange.newValue
          break
        case 'WebPageReader.Reader.HighlightForeColor':
          self.HighlightForeColor = storageChange.newValue
          break
      }
    }
  }

  static get ignore() {
    return Storable.ignore.concat(['Sentence', 'Active'])
  }
}

WebPageReader.Reader = Reader
