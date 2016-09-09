// reading variables
var textNodes;
var textNode;
var textNodeIndex = 0;
var sentences;
var sentenceIndex = 0;
var sentencesLength;

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
  var root = document.getSelection() && document.getSelection().anchorNode ? document.getSelection().anchorNode : document.body;
  readElement(root);
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

function readElement(root) {
  textNodes = textNodesUnder(document.body);
  textNodeIndex = 1;
  for (i = 0; i < textNodes.length; i++) {
    if (textNodes[i] == root)
      textNodeIndex = i;
  }
  readTextNode();
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
  if (['SCRIPT','STYLE'].indexOf(parent.tagName) == 0 && !/^\s+$/.test(node.nodeValue)) //filter out script elements and whitespace-only elements 
    return NodeFilter.FILTER_ACCEPT
  else
    return NodeFilter.FILTER_SKIP
}

function readTextNode() {
  textNode = textNodes[textNodeIndex];
  if (!isElementInViewport(textNode.parentNode))
    textNode.parentNode.scrollIntoView(true);
  sentenceIndex = 0;
  //console.log(textNode.nodeValue);
  readNode();
}

var currentSentenceSpan;

function readNode() {
  sentenceIndex = textNode.nodeValue.indexOf('.', sentenceIndex);
  var after = textNode.splitText(sentenceIndex + 1);
  if (textNode.nodeValue == '') {
    if (sentenceIndex != -1) {
      textNode = after;
      setTimeout(readNode, 0);
    } else {
      textNodeIndex++;
      setTimeout(readTextNode, 0);
    }
    return;
  }
  //console.log('nodevalue = ' + textNode.nodeValue);

  // highlight the sentence
  currentSentenceSpan = document.createElement('span');
  currentSentenceSpan.appendChild(document.createTextNode(textNode.nodeValue));
  currentSentenceSpan.className = 'highlighted';
  if (after.parentNode)
    after.parentNode.replaceChild(currentSentenceSpan, textNode);

  // read the sentence
  var utt = new SpeechSynthesisUtterance(textNode.nodeValue);
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
    unhighlight();

    if (!speechState.speaking)
      return;

    if (sentenceIndex != -1) {
      textNode = after;
      setTimeout(readNode, 0);
    } else {
      textNodeIndex++;
      setTimeout(readTextNode, 0);
    }

  };

  window.speechSynthesis.speak(utt);
}

function unhighlight() {
  // unhighlight the sentence
  if (currentSentenceSpan)
    currentSentenceSpan.className = '';
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

document.body.onload = function () {
  stop();
}

