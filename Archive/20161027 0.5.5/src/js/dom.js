WebPageReader.Dom = function () {
  /*  basic re-usable dom functions
  */

  /* public properties */
  var allTextNodes = [];
  Object.defineProperty(this, "AllTextNodes", {
    get: function () {
      return allTextNodes
    },
    set: function (value) {
      allTextNodes = value;
      /*
      for(var i = 0; i < allTextNodes.length; i++){
        console.log(allTextNodes[i].nodeValue);
      }
      */
    }
  });

  var allowCaretSelection = false;
  Object.defineProperty(this, "AllowCaretSelection", {
    get: function () {
      return allowCaretSelection
    },
    set: function (value) {
      allowCaretSelection = value
    }
  });

  /* private properties */
  var self = this;
  var regex = new WebPageReader.Regex();

  /* public methods */
  this.GetSelectedRange = function () {
    var sel;
    if (window.getSelection) {
      sel = window.getSelection();
      if ((sel.type == "Range" || allowCaretSelection) && sel.rangeCount) {
        return sel.getRangeAt(0);
      }
    }
    return null;
  }

  this.GetFirstRange = function () {
    var firstNode = Enumerable.From(allTextNodes).FirstOrDefault(allTextNodes[0], o => regex.NonWhitespace.test(o.nodeValue));
    return createRange(firstNode, 0, firstNode, 0);
  }

  // Object.prototype.nullIf = function (value) {
  //   if (this == value)
  //     return null;
  //   else return this;
  // }

  this.LoadAllTextNodes = function () {
    this.AllTextNodes = textNodesUnder(document.body);
  }

  this.SaveSelection = function () {
    var win = document.defaultView;
    var range = win.getSelection().getRangeAt(0);
    var preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(document.body);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    var start = preSelectionRange.toString().length;

    return {
      start: start,
      end: start + range.toString().length
    };
  }

  this.RestoreSelection = function (savedSel) {
    var win = document.defaultView;
    var charIndex = 0,
      range = document.createRange();
    range.setStart(document.body, 0);
    range.collapse(true);
    var nodeStack = [document.body],
      node, foundStart = false,
      stop = false;

    while (!stop && (node = nodeStack.pop())) {
      if (node.nodeType == 3) {
        var nextCharIndex = charIndex + node.length;
        if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
          range.setStart(node, savedSel.start - charIndex);
          foundStart = true;
        }
        if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
          range.setEnd(node, savedSel.end - charIndex);
          stop = true;
        }
        charIndex = nextCharIndex;
      } else {
        var i = node.childNodes.length;
        while (i--) {
          nodeStack.push(node.childNodes[i]);
        }
      }
    }

    var sel = win.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  this.VisualizeRange = function (range, label) {
    const BeginRangeMarker = '\u25BA';
    const EndRangeMarker = '\u25C4';
    const TextNodeBoundary = '\u2551';
    const NewLineIndicator = '\u21B5';
    var msg = '';
    if (range) {
      var intersects = false;
      for (t = 0; t < this.AllTextNodes.length; t++) {
        var textNode = this.AllTextNodes[t];
        var value = textNode.nodeValue.replace(/[\n]/g, NewLineIndicator);
        if (range.intersectsNode(textNode)) {
          if (!intersects) {
            if (!allTextNodes[t + 1] || !range.intersectsNode(allTextNodes[t + 1]))
              // I begin and finish inside this first node
              msg += `${TextNodeBoundary}${value.substring(0, range.startOffset)}${BeginRangeMarker}${value.substring(range.startOffset, range.endOffset)}${EndRangeMarker}${value.substring(range.endOffset)}`;
            else
              // I only begin inside this first node
              msg += `${TextNodeBoundary}${value.substring(0, range.startOffset)}${BeginRangeMarker}${value.substring(range.startOffset)}`;
          } else if (!allTextNodes[t + 1] || !range.intersectsNode(this.AllTextNodes[t + 1]))
            // I end in this node
            msg += `${TextNodeBoundary}${value.substring(0, range.endOffset)}${EndRangeMarker}${value.substring(range.endOffset)}`;
          else
            // I completely contain this node
            msg += `${TextNodeBoundary}${value}`;

          intersects = true;
        } else if (intersects) {
          break;
        }
      }
    } else
      msg = 'empty range';

    txtVisualization.value = `${msg}║`;
    msg = `${label} = ${msg}║`;
    console.log(msg);
  }

  this.IsElementInViewport = function (el) {

    var rect = el.getBoundingClientRect();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
  }

  /* private methods */
  function createRange(startNode, startIndex, endNode, endIndex) {
    var range = new Range();
    range.setStart(startNode, startIndex);
    range.setEnd(endNode, endIndex);
    return range;
  }

  this.getNextTextNode = function (textNode) {
    if (textNode.nodeType != 3) throw 'nextTextNode: not a text node';
    var i = allTextNodes.indexOf(textNode);
    if (i == -1)
      throw 'nextTextNode: node is not found in allTextNodes';
    else if (i == allTextNodes.length - 1)
      return null;
    else
      return allTextNodes[i + 1];
  }

  this.getPreviousTextNode = function (textNode) {
    if (textNode.nodeType != 3) throw 'previousTextNode: not a text node';
    var i = allTextNodes.indexOf(textNode);
    if (i == -1)
      throw 'previousTextNode: node is not found in allTextNodes';
    else if (i === 0)
      return null;
    else
      return allTextNodes[i - 1];
  }

  function textNodesUnder(root) {
    var textNodes = [];
    if (root.nodeType == 3)
      textNodes.push(root);
    else {
      var treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, getTextElements, false);
      var node;
      while (node = treeWalker.nextNode())
        textNodes.push(node);
    }
    return textNodes; // Array
  }

  function getTextElements(node) {
    if (['SCRIPT', 'STYLE'].indexOf(node.parentNode.tagName) !== 0 && node.nodeValue !== '') //filter out script elements and empty elements 
      return NodeFilter.FILTER_ACCEPT
    else
      return NodeFilter.FILTER_SKIP
  }

};
