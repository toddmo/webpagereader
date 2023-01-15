WebPageReader.Reader = function () {
  /*  reading = speaking + highlighting
      the reader contains a sentence and speech
      it follows a media player pattern (play, stop, next, previous, pause, resume)
      it raises events so media ui controls can update their state
  */

  /* enumerations */
  const intentions = {
    Normal: 1,
    Next: 2,
    Previous: 3
  };

  /* constructor */
  function constructor() {
    load();

    document.addEventListener('visibilitychange', () => {
      getActive();
    });
    window.addEventListener('focus', () => {
      getActive();
    });
    window.addEventListener('blur', () => {
      getActive();
    });
    getActive();
  }

  /* private properties */
  var self = this;
  var sentence = null;
  var storage = new WebPageReader.Storage(this);
  var intention = intentions.Normal;

  /* public properties */
  var speech = new WebPageReader.Speech(storage);
  speech.OnSpeakingEnded = Speech_OnSpeakingEnded; // catch this event from speech
  Object.defineProperty(this, "Speech", {
    value: speech,
    writable: false
  });

  var active = false;
  this.OnActivated = null;
  Object.defineProperty(this, "Active", {
    get: function () {
      return active
    },
    set: function (value) {
      value = value.toString() == "true";
      if(value == active) return;
      active = value;
      if(active){
        save();
        // send state to control panel
        if (this.OnActivated) this.OnActivated(this);
      }
    }
  });

  var reading = false;
  this.OnReadingChanged = null;
  Object.defineProperty(this, "Reading", {
    get: function () {
      return reading
    },
    set: function (value) {
      reading = value.toString() == "true";
      save();
      if (this.OnReadingChanged) this.OnReadingChanged(this);
    },
    enumerable: true
  });

  var paused = false;
  this.OnPausedChanged = null;
  Object.defineProperty(this, "Paused", {
    get: function () {
      return paused
    },
    set: function (value) {
      paused = value.toString() == "true";
      save();
      if (this.OnPausedChanged) this.OnPausedChanged(this);
    },
    enumerable: true
  });

  var canNext = false;
  this.OnCanNextChanged = null;
  Object.defineProperty(this, "CanNext", {
    get: function () {
      return canNext
    },
    set: function (value) {
      canNext = value.toString() == "true";
      save();
      if (this.OnCanNextChanged) this.OnCanNextChanged(this);
    },
    enumerable: true
  });

  var canPrevious = false;
  this.OnCanPreviousChanged = null;
  Object.defineProperty(this, "CanPrevious", {
    get: function () {
      return canPrevious
    },
    set: function (value) {
      canPrevious = value.toString() == "true";
      save();
      if (this.OnCanPreviousChanged) this.OnCanPreviousChanged(this);
    },
    enumerable: true
  });

  /* public methods */
  this.getType = function () { return "WebPageReader.Reader" }

  this.Start = function () {
    sentence = new WebPageReader.Sentence();
    read();
  }

  this.Stop = function () {
    self.Reading = false;
    self.Paused = false;
    self.CanPrevious = false;
    self.CanNext = false;
    speech.Stop();
  }

  this.Pause = function () {
    self.Paused = true;
    self.CanPrevious = false;
    self.CanNext = false;
    speech.Pause();
  }

  this.Resume = function () {
    self.Paused = false;
    self.CanPrevious = sentence.CanPrevious;
    self.CanNext = sentence.CanNext;
    speech.Resume();
  }

  this.Next = function () {
    intention = intentions.Next;
    speech.Stop();
  }

  this.Previous = function () {
    intention = intentions.Previous;
    speech.Stop();
  }

  /* private methods */
  function getActive() {
    chrome.extension.sendRequest("isSelected", function (isSelected) {
      if (isSelected) {
        //this tab in focus
        self.Active = !document.hidden;
      } else {
        //not in focus
        self.Active = false;
      }
    });
  }

  function load() {
    storage.Load(storage.Types.Session); // reader state is per tab
    speech.Load(); // speech settings are global
  }

  function save() {
    storage.Save(storage.Types.Session); // so I will pick up my own state upon reload
    storage.Save(storage.Types.Sync); // so control panel can pick up my state
    speech.Save(); // only saves to sync
  }

  function read() {
    intention = intentions.Normal;
    self.Reading = true;
    self.CanPrevious = sentence.CanPrevious;
    self.CanNext = sentence.CanNext;
    sentence.Visualize();
    sentence.Highlight();
    speech.Speak(sentence.toString());
    return true;
  }

  function readNext() {
    if (!self.Reading || !self.Active) return;
    sentence.Unhighlight();
    sentence.Next();
    setTimeout(read, 0);
  }

  /* event handlers */
  function Speech_OnSpeakingEnded() {
    switch (intention) {
      case intentions.Previous:
        sentence.Previous();
        setTimeout(read, 200);
        break;
      case intentions.Next:
        sentence.Next();
        setTimeout(read, 200);
        break;
      case intentions.Normal:
      default:
        readNext();
    }
  }

  this.Runtime_OnMessage = function (request, sender, sendResponse) {
    //console.log(sender.tab ?      "from a content script:" + sender.tab.url :      "from the extension");

    switch (request.command) {
      case 'start':
        self.Start();
        break;
      case 'stop':
        self.Stop();
        break;
      case 'pause':
        self.Pause();
        break;
      case 'resume':
        self.Resume();
        break;
      case 'next':
        self.Next();
        break;
      case 'previous':
        self.Previous();
        break;
      case 'setting':
        switch (request.setting) {
          case 'voice':
            self.Speech.Voice = request.value;
            break;
          case 'rate':
            self.Speech.Rate = request.value;
            break;
          case 'volume':
            self.Speech.Volume = request.value;
            break;
          case 'enabled':
            self.Speech.Enabled = request.value;
            break;
          default:
            console.log('unknown setting ' + request.setting);
        }
        break;
      default:
        console.log('unknown command ' + request.command);
    }
    sendResponse({ outcome: 'success' });
  }

  constructor(); // finally call the constructor

};
