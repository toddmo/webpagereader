var settings = {'rate': 1, 'volume': 1, 'voice': 'native'};
var speechState = {'speaking': false, 'paused': false};

function getSettings() {

    getSetting('voice');
    getSetting('rate');
    getSetting('volume');

    setTimeout(function () {
        if (speechSynthesis.onvoiceschanged !== undefined)
            speechSynthesis.onvoiceschanged = loadVoiceList;
        doSetting('voice', settings.voice);

        document.getElementById('rate').value = settings.rate;
        document.getElementById('rateOutput').value = 'Rate (' + document.getElementById('rate').value + ')';
        document.getElementById('rate').title = document.getElementById('rate').value;
        doSetting('rate', settings.rate);

        document.getElementById('volume').value = settings.volume;
        document.getElementById('volumeOutput').value = 'Volume (' + document.getElementById('volume').value + ')';
        document.getElementById('volume').title = document.getElementById('volume').value;
        doSetting('volume', settings.volume);
    }, 100);

}

function getSetting(name) {
    chrome.storage.sync.get(name,
        function (setting) {
            settings[name] = setting[name] || settings[name];
        }
    );
}

function getSpeechState() {
    speechState.speaking = false;
    speechState.paused = false;
    getSpeechStateProperty('speaking');
    getSpeechStateProperty('paused');

    setTimeout(function () {
        setButtonVisibility();
    }, 0);

}

function getSpeechStateProperty(name) {
    chrome.storage.local.get(name,
        function (setting) {
            speechState[name] = setting[name];
        }
    );
}

function setButtonVisibility() {
    document.getElementById('read').disabled = speechState.speaking || speechState.paused;
    document.getElementById('stop').disabled = !speechState.speaking && !speechState.paused;
    document.getElementById('pause').disabled = !speechState.speaking;
    document.getElementById('resume').disabled = !speechState.paused;
}

function read() {
    doCommand('read');
    speechState.speaking = true;
    speechState.paused = false;
    setButtonVisibility();
}

function stop() {
    doCommand('stop');
    speechState.speaking = false;
    speechState.paused = false;
    setButtonVisibility();
}

function pause() {
    doCommand('pause');
    speechState.speaking = false;
    speechState.paused = true;
    setButtonVisibility();
}

function resume() {
    doCommand('resume');
    speechState.speaking = true;
    speechState.paused = false;
    setButtonVisibility();
}

function setVoice() {
    saveSetting('voice', voiceList.options[voiceList.selectedIndex].attributes['data-name'].nodeValue);
    doSetting('voice', voiceList.options[voiceList.selectedIndex].attributes['data-name'].nodeValue);
}

function setRate() {
    saveSetting('rate', document.getElementById('rate').value);
    doSetting('rate', Number(document.getElementById('rate').value));
}

function setVolume() {
    saveSetting('volume', document.getElementById('volume').value);
    doSetting('volume', Number(document.getElementById('volume').value));
}

function doCommand(name) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { command: name }, function (response) {
            console.log(response.outcome);
        });
    });
}

function saveSetting(name, value) {
    var setting = new Object();
    setting[name] = value;
    chrome.storage.sync.set(setting, function () {
        settings[name] = value;
    });
    return value;
}

function doSetting(name, value) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { command: 'setting', setting: name, value: value }, function (response) {
            console.log(response.outcome);
        });
    });
}

function loadVoiceList() {
    var voices = window.speechSynthesis.getVoices();
    voices.sort(voiceCompare);
    var lang = 'Local';
    var optGroup;
    for (i = 0; i < voices.length; i++) {
        if (getLanguageName(voices[i].lang) != lang) {
            lang = getLanguageName(voices[i].lang) || 'Local';
            optGroup = document.createElement('optgroup');
            optGroup.setAttribute('label', lang);
            voiceList.appendChild(optGroup);
        }
        var option = document.createElement('option');
        option.textContent = voices[i].name;// + ' (' + voices[i].lang + ')';

        if (voices[i].name == settings.voice)
            option.setAttribute('selected', true);
        option.setAttribute('data-lang', voices[i].lang);
        option.setAttribute('data-name', voices[i].name);
        optGroup.appendChild(option);
    }
    voiceList.onchange = setVoice;
}

function getLanguageName(key) {
    key = key.slice(0, 2);
    var lang = isoLangs[key];
    return lang ? lang.name : undefined;
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

var voiceList = document.getElementById('voices');

document.getElementById('rate').onchange = setRate;
document.getElementById('volume').onchange = setVolume;

document.getElementById('rate').oninput = function () {
    rateOutput.value = 'Rate (' + rate.value + ')';
    rate.title = rate.value;
};
document.getElementById('volume').oninput = function () {
    volumeOutput.value = 'Volume (' + volume.value + ')';
    volume.title = volume.value;
};

document.getElementById('read').onclick = read;
document.getElementById('stop').onclick = stop;
document.getElementById('pause').onclick = pause;
document.getElementById('resume').onclick = resume;

getSpeechState();

getSettings();

setButtonVisibility();

