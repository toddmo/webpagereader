var textNodes;
var textNodeCharacterIndexes;
var sentences;
var sentenceCharacterIndexes;
var sentenceIndex = 0;

// settings
var settings = { 'rate': 1, 'volume': 1, 'voice': 'native' };
var speechState = { 'speaking': false, 'paused': false };

function saveSpeechState() {
  saveSpeechStateProperty('speaking', speechState.speaking);
  saveSpeechStateProperty('paused', speechState.paused);
}

function saveSpeechStateProperty(name, value) {
  var setting = new Object();
  setting[name] = value;
  chrome.storage.local.set(setting, function () {
    speechState[name] = value;
  });
  return value;
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    //console.log(sender.tab ?      "from a content script:" + sender.tab.url :      "from the extension");

    switch (request.command) {
      case 'read':
        read();
        break;
      case 'stop':
        stop();
        break;
      case 'pause':
        pause();
        break;
      case 'resume':
        resume();
        break;
      case 'setting':
        switch (request.setting) {
          case 'voice':
            settings.voice = request.value;
            break;
          case 'rate':
            settings.rate = request.value;
            break;
          case 'volume':
            settings.volume = request.value;
            break;
          default:
            console.log('unknown setting ' + request.setting);
        }
        break;
      default:
        console.log('unknown command ' + request.command);
    }
    sendResponse({ outcome: 'success' });
  });




function read() {
  stop();
  speechState.speaking = true;
  speechState.paused = false;
  saveSpeechState();
  createMap();
  sentenceIndex = 0;
  var selectedRange = getSelectionRange();
  if (selectedRange) {
    for (t = 0; t < textNodes.length; t++) {
      if (selectedRange.startContainer == textNodes[t]) {
        for (s = 0; s < sentences.length; s++) {
          if (sentenceCharacterIndexes[s].start >= textNodeCharacterIndexes[t]) {
            sentenceIndex = s - 1;
            break;
          }
          s++;
        }
      }
      if (sentenceIndex > 0) break;
    }
  }
  readSentence();
}

function stop() {
  speechState.speaking = false;
  speechState.paused = false;
  saveSpeechState();
  window.speechSynthesis.cancel();
  unhighlight();
}

function pause() {
  speechState.speaking = false;
  speechState.paused = true;
  saveSpeechState();
  window.speechSynthesis.pause();
}

function resume() {
  speechState.speaking = true;
  speechState.paused = false;
  saveSpeechState();
  window.speechSynthesis.resume();
}

function previous() {
  stop();
  sentenceIndex--;
  readSentence();
}

function next() {
  stop();
  sentenceIndex++;
  readSentence();
}

function readSentence() {
  //createMap(); // highlighting fucks up the text node collection
  if (!sentences[sentenceIndex]) {
    stop();
    return; // done reading the page
  }
  selectSentence();
  speakSentence();
}

function speakSentence() {
  // read the sentence
  var utt = new SpeechSynthesisUtterance(sentences[sentenceIndex]);
  var voices = window.speechSynthesis.getVoices();
  for (i = 0; i < voices.length; i++) {
    if (voices[i].name == settings.voice) {
      utt.voice = voices[i];
      break;
    }
  }
  utt.rate = settings.rate;
  utt.volume = settings.volume;
  utt.onend = function () {
    if (!speechState.speaking)//it's been stopped
      return;
    sentenceIndex++;
    setTimeout(readSentence, 0);
  };
  window.speechSynthesis.speak(utt);
}

String.prototype.matches = function (regex) {
  var matchesArray = [];
  var match;
  while ((match = regex.exec(this)) !== null) {
    matchesArray.push(match[0]);
  }
  return matchesArray;
}

String.prototype.lastIndexOfRegex = function (regex, fromIndex) {
  var str = fromIndex ? this.substring(0, fromIndex) : this;
  var matchesArray = str.matches(regex);
  return matchesArray.length > 0 ? str.lastIndexOf(matchesArray[matchesArray.length - 1]) : -1;
}

function createMap() {
  var charIndex = 0;
  // make a map of all text nodes
  textNodes = textNodesUnder(document.body);
  textNodeCharacterIndexes = {};
  for (t = 0; t < textNodes.length; t++) {
    textNodeCharacterIndexes[t] = charIndex;
    charIndex += textNodes[t].nodeValue.length;
  }
  for (t = 0; t < textNodes.length; t++) {
    console.log(
      `textNode ${t} (${
      textNodeCharacterIndexes[t]},${
      Number(textNodeCharacterIndexes[t + 1] - 1)}) = ~${textNodes[t].nodeValue}~`
    );
  }
  var textNodesContent = textNodes.map(function (o) {
    return o.nodeValue;
  }).join('');

  // pull out the sentences and make a map of those using the same indexes as the text nodes
  sentences = textNodesContent.split(/[.?!]/);
  sentenceCharacterIndexes = {};
  charIndex = 0;
  for (s = 0; s < sentences.length; s++) {
    sentenceCharacterIndexes[s] = {
      start: charIndex + Math.max(sentences[s].search(/\S/), 0),
      end: charIndex + (sentences[s].lastIndexOfRegex(/\S/g) == -1 ? sentences[s].length : sentences[s].lastIndexOfRegex(/\S/g))
    };
    charIndex += sentences[s].length + 1;
  }
  for (s = 0; s < sentences.length; s++) {
    console.log(
      `sentence ${s} (${
      sentenceCharacterIndexes[s].start},${
      sentenceCharacterIndexes[s].end}) = ~${sentences[s]}~`
    );
  }

}

function textNodesUnder(root) {
  var walk = document.createTreeWalker(root,
    NodeFilter.SHOW_TEXT,
    getTextElements,
    false),
    text = [],
    node;
  while (node = walk.nextNode()) text.push(node);
  return text;
}

function getTextElements(node) {
  if (['SCRIPT', 'STYLE'].indexOf(node.parentNode.tagName) != 0 || node.nodeValue == '') //filter out script elements and empty elements 
    return NodeFilter.FILTER_ACCEPT
  else
    return NodeFilter.FILTER_SKIP
}

function selectSentence() {
  var startCharacterIndex = sentenceCharacterIndexes[sentenceIndex].start;
  var endCharacterIndex = sentenceCharacterIndexes[sentenceIndex].end;

  var startNodeIndex;
  for (t = 0; t < textNodes.length; t++) {
    if (textNodeCharacterIndexes[t] > startCharacterIndex)
      break;
    startNodeIndex = t;
  }
  var startNode = textNodes[startNodeIndex];
  console.log(
    `startnode ${
    startNodeIndex} (${
    textNodeCharacterIndexes[startNodeIndex]},${
    Number(textNodeCharacterIndexes[startNodeIndex + 1] - 1)}) = ~${
    startNode.nodeValue}~`
  );

  if (!isElementInViewport(startNode.parentNode))
    startNode.parentNode.scrollIntoView(true);

  var endNodeIndex;
  for (t = 0; t < textNodes.length; t++) {
    if (textNodeCharacterIndexes[t + 1] - 1 >= endCharacterIndex) {
      endNodeIndex = t;
      break;
    }
  }
  var endNode = textNodes[endNodeIndex];
  console.log(
    `endNode ${
    endNodeIndex} (${
    textNodeCharacterIndexes[endNodeIndex]},${
    Number(textNodeCharacterIndexes[endNodeIndex + 1] - 1)}) = ~${
    endNode.nodeValue}~`
  );

  var range = new Range();
  var startOfSentenceIndex = startCharacterIndex - textNodeCharacterIndexes[startNodeIndex];
  range.setStart(startNode, startOfSentenceIndex);
  var endOfSentenceIndex = endCharacterIndex - textNodeCharacterIndexes[endNodeIndex] + 1;
  range.setEnd(endNode, endOfSentenceIndex);

  unhighlight();
  var span = document.createElement('span');
  span.id = "sentenceHighlighter"
  span.className = 'highlight';
  //range.surroundContents(span);
  span.appendChild(range.extractContents());
  range.insertNode(span);

}

function unhighlight() {
  var who = document.getElementById('sentenceHighlighter');
  if (!who)
    return;
  var pa = who.parentNode;
  while (who.firstChild) {
    pa.insertBefore(who.firstChild, who);
  }
  pa.removeChild(who);
}

function isElementInViewport(el) {

  //special bonus for those using jQuery
  if (typeof jQuery === "function" && el instanceof jQuery) {
    el = el[0];
  }

  var rect = el.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
  );
}

function getSelectionRange() {
  var sel;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount) {
      return sel.getRangeAt(0);
    }
  } else if (document.selection) {
    return document.selection.createRange();
  }
  return null;
}

document.body.onload = function () {
  stop();
}

