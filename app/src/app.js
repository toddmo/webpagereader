/* Namespace */
class WebPageReaderNameSpace {
    constructor() {
        this.UI = {}
        // this.UI.ControlPanel = ControlPanel

        // fetch(chrome.runtime.getURL('../manifest.json'))
        //   .then((response) => response.json()) //assuming file contains json
        //   .then((json) => this.#version = JSON.parse(json).manifest_version);
    }

    #version = '0.0.0'
    get Version() {
        return this.#version
    }

}

var WebPageReader = WebPageReader || new WebPageReaderNameSpace()
