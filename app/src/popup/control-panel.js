class ControlPanel extends Storable {

  /* constructor */
  constructor() {
    super()
    // load the color picker component
    $(function () {
      $('#cp-component').colorpicker(
        {
          color: '#ffaa00',
          container: true,
          inline: true
        }
      );
    });

    // voice changes from Speech
    this.Speech.OnVoicesChanged = () => {
      this.Voices = this.Speech.Voices
    };

    // load settings for options
    var localStorage = new WindowLocalStorage()
    this.type = 'Reader'
    this.load(localStorage)
    this.type = 'Speech'
    this.load(localStorage)

    // adjust ui
    this.Reading = this.Reading
    this.Paused = this.Paused
    this.CanPrevious = this.CanPrevious
    this.CanNext = this.CanNext
    this.Rate = this.Rate
    this.Volume = this.Volume
    this.SpeechEnabled = this.SpeechEnabled
    this.SkipCode = this.SkipCode
    this.HighlightBackColor = this.HighlightBackColor
    this.HighlightForeColor = this.HighlightForeColor

    // commands going to the reader
    start.onclick = () => { this.DoCommand('start'); }
    btnStop.onclick = () => { this.DoCommand('stop'); }
    pause.onclick = () => { this.DoCommand('pause'); }
    resume.onclick = () => { this.DoCommand('resume'); }
    next.onclick = () => { this.DoCommand('next'); }
    previous.onclick = () => { this.DoCommand('previous'); }

    // UI events
    chkSpeechEnabled.onchange = () => {
      this.SpeechEnabled = chkSpeechEnabled.checked
    }
    chkSkipCode.onchange = () => {
      this.SkipCode = chkSkipCode.checked
    }
    lstVoices.onchange = () => {
      console.log(`lstVoices.onchange ${lstVoices.selectedIndex}`)
      this.Voice = lstVoices.options[lstVoices.selectedIndex].attributes['data-name'].nodeValue;
    }
    rngRate.onchange = () => { this.Rate = rngRate.value };
    rngVolume.onchange = () => { this.Volume = rngVolume.value };

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
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.Storage_OnChange(this, changes, namespace)
    });

    // listen for reader to become active
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.Runtime_OnMessage(this, request)
    });
  }

  /* private properties */
  #speech = new WebPageReader.Speech();
  get Speech() {
    return this.#speech
  }

  #language = new WebPageReader.Language();
  get Language() {
    return this.#language
  }

  /* public properties */
  #reading = false;
  get Reading() {
    return this.#reading;
  }
  set Reading(value) {
    this.#reading = value.toString() == "true";
    this.#display(start, !this.#reading);
    btnStop.disabled = !this.#reading;
    this.#display(pause, this.#reading && !this.Paused);
  }

  #paused = false;
  get Paused() {
    return this.#paused;
  }
  set Paused(value) {
    this.#paused = value.toString() == "true";
    this.#display(start, !this.#reading);
    btnStop.disabled = !this.#reading;
    this.#display(pause, this.#reading && !this.#paused);
    this.#display(resume, this.#paused);
  }

  #canPrevious = false;
  get CanPrevious() {
    return this.#canPrevious;
  }
  set CanPrevious(value) {
    this.#canPrevious = value.toString() == "true";
    previous.disabled = !this.#canPrevious;
  }

  #canNext = false;
  get CanNext() {
    return this.#canNext;
  }
  set CanNext(value) {
    this.#canNext = value.toString() == "true";
    next.disabled = !this.#canNext;
  }

  #voices = [];
  get Voices() {
    return this.#voices;
  }
  set Voices(value) {
    if (Array.isArray(value)) {
      this.#voices = value;
      console.log('control panel voices received' + this.Voices.length)
      this.#loadVoices();
    }
    else
      console.log(`control panel voices bad value ${value} received`)
  }

  #voice = 'native';
  get Voice() {
    return this.#voice;
  }
  set Voice(value) {
    console.log(`setting voice to ${value}`)
    console.trace()
    this.#voice = value;
    this.#saveSpeechSettings('Voice');
  }

  #rate = 1.0;
  get Rate() {
    return this.#rate;
  }
  set Rate(value) {
    this.#rate = Number(value);
    rngRate.value = this.#rate
    rngRate.title = this.#rate
    outRate.value = `Rate (${(this.#rate * 100).toFixed(0)}%)`;
    this.#saveSpeechSettings('Rate');
  }

  #volume = 1.0;
  get Volume() {
    return this.#volume;
  }
  set Volume(value) {
    this.#volume = Number(value);
    rngVolume.value = this.#volume
    rngVolume.title = this.#volume
    outVolume.value = `Volume (${(this.#volume * 100).toFixed(0)}%)`;
    this.#saveSpeechSettings('Volume');
  }

  #Enabled = true;
  get Enabled() {
    return this.#Enabled;
  }
  set Enabled(value) {
    this.#Enabled = value.toString() == "true";
    chkSpeechEnabled.checked = this.#Enabled;
    this.#saveSpeechSettings('Enabled');
  }

  #skipCode = true;
  get SkipCode() {
    return this.#skipCode;
  }
  set SkipCode(value) {
    this.#skipCode = value.toString() == "true";
    chkSkipCode.checked = this.#skipCode;
    this.#saveReaderSettings('SkipCode');
  }

  #highlightBackColor = `rgba(255,255,0,0.4)`
  get HighlightBackColor() {
    return this.#highlightBackColor
  }
  set HighlightBackColor(value) {
    this.#highlightBackColor = value
    this.#saveReaderSettings('HighlightBackColor');    
  }

  #highlightForeColor = `#333`
  get HighlightForeColor() {
    return this.#highlightForeColor
  }
  set HighlightForeColor(value) {
    this.#highlightForeColor = value
    this.#saveReaderSettings('HighlightForeColor');    
  }

  /* public methods */
  DoCommand(name) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { command: name }, function (response) {
        console.log(response?.outcome);
      });
    });
  }

  /* private methods */
  #display(el, condition) {
    el.style.display = condition ? 'inline' : 'none';
  }


  #loadVoices() {
    for (var i = 0; i < this.Voices.length; i++) {
      if (!lang || this.#language.LanguageName(this.Voices[i].lang) != lang) {
        var lang = this.#language.LanguageName(this.Voices[i].lang) || 'Local';
        var optGroup = document.createElement('optgroup');
        optGroup.setAttribute('label', lang);
        lstVoices.appendChild(optGroup);
      }
      var option = document.createElement('option');
      option.textContent = this.Voices[i].name;// + ' (' + this.Voices[i].lang + ')';

      if (this.Voices[i].name == this.Voice)
        option.setAttribute('selected', true);
      option.setAttribute('data-lang', this.Voices[i].lang);
      option.setAttribute('data-name', this.Voices[i].name);
      optGroup.appendChild(option);
    }
  }

  #saveSpeechSettings(property) {
    this.type = 'Speech'
    this.saveProperty(new ChromeSyncStorage(), property)
    this.saveProperty(new WindowLocalStorage(), property)
    this.saveProperty(new WindowSessionStorage(), property)
    this.saveProperty(new ChromeLocalStorage(), property)
  }

  #saveReaderSettings(property) {
    this.type = 'Reader'
    this.saveProperty(new ChromeSyncStorage(), property)
    this.saveProperty(new WindowLocalStorage(), property)
    this.saveProperty(new WindowSessionStorage(), property)
    this.saveProperty(new ChromeLocalStorage(), property)
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

  Runtime_OnMessage(self, request) {
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

}

WebPageReader.UI.ControlPanel = new ControlPanel();