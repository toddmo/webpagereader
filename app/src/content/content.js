class Content {
  constructor() {
    // don't run in frames
    if (window != window.top)
      return;

    new WebPageReader.Reader()


    // wiring up events
    /*
    reader.OnActivated = () => {
      chrome.runtime.sendMessage({
        name: 'OnActivated',
        source: reader
      });
    }
    reader.OnReadingChanged = () => {
      chrome.runtime.sendMessage({
        name: 'OnReadingChanged',
        source: reader
      });
    }
    reader.OnPausedChanged = () => {
      chrome.runtime.sendMessage({
        name: 'OnPausedChanged',
        source: reader
      });
    }
    reader.OnPausedChanged = () => {
      chrome.runtime.sendMessage({
        name: 'OnPausedChanged',
        source: reader
      });
    }
    reader.OnCanNextChanged = () => {
      chrome.runtime.sendMessage({
        name: 'OnCanNextChanged',
        source: reader
      });
    }
    reader.OnCanPreviousChanged = () => {
      chrome.runtime.sendMessage({
        name: 'OnCanPreviousChanged',
        source: reader
      });
    }
    reader.Speech.OnEnabledChanged = () => {
      chrome.runtime.sendMessage({
        name: 'OnEnabledChanged',
        source: reader
      });
    }
    reader.Speech.OnVoiceChanged = () => {
      chrome.runtime.sendMessage({
        name: 'OnVoiceChanged',
        source: reader.Speech
      });
    }
    reader.Speech.OnRateChanged = () => {
      chrome.runtime.sendMessage({
        name: 'OnRateChanged',
        source: reader.Speech
      });
    }
    reader.Speech.OnVolumeChanged = () => {
      chrome.runtime.sendMessage({
        name: 'OnVolumeChanged',
        source: reader.Speech
      });
    }
    reader.Speech.OnVoicesChanged = () => {
      chrome.runtime.sendMessage({
        name: 'OnVoicesChanged',
        source: reader.Speech
      });
    }
    */
  }
}

/*  This will be called for each window including iframes

*/
WebPageReader.Content = Content
new Content()