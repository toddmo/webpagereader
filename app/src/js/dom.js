class Dom {
  /*  basic re-usable dom functions
   */

  /* private properties */
  #self = this
  #regex = new WebPageReader.Regex()

  /* public properties */
  #skipCode = true
  get SkipCode() {
    return this.#skipCode
  }
  set SkipCode(value) {
    this.#skipCode = value.toString() == 'true'
  }

  #excludedTags
  get excludedTags() {
    this.#excludedTags = [
      'script',
      'style',
      'noscript',
      'embed',
      'meta',
      'iframe',
    ]
    if (this.SkipCode)
      this.#excludedTags = this.#excludedTags.concat(['code', 'pre'])
    return this.#excludedTags
  }

  #allTextNodes = []
  get AllTextNodes() {
    return this.#allTextNodes
  }
  set AllTextNodes(value) {
    this.#allTextNodes = value
    /*
    for(var i = 0; i < allTextNodes.length; i++){
      console.log(allTextNodes[i].nodeValue);
    }
    */
  }

  #allowCaretSelection = false
  get AllowCaretSelection() {
    return this.#allowCaretSelection
  }
  set AllowCaretSelection(value) {
    this.#allowCaretSelection = value
  }

  /* public methods */
  get SelectedRange() {
    var sel
    if (window.getSelection) {
      sel = window.getSelection()
      if ((sel.type == 'Range' || this.AllowCaretSelection) && sel.rangeCount) {
        return sel.getRangeAt(0)
      }
    }
    return null
  }

  get FirstRange() {
    var self = this
    var firstNode = Enumerable.From(self.AllTextNodes).FirstOrDefault(
      self.AllTextNodes[0],
      (o) => self.#regex.NonWhitespace.test(o.nodeValue)
    )
    return this.#createRange(firstNode, 0, firstNode, 0)
  }

  // Object.prototype.nullIf = function (value) {
  //   if (this == value)
  //     return null;
  //   else return this;
  // }

  LoadAllTextNodes() {
    this.AllTextNodes = this.textNodesUnder(document.body)
  }

  SaveSelection() {
    var win = document.defaultView
    var range = win.getSelection().getRangeAt(0)
    var preSelectionRange = range.cloneRange()
    preSelectionRange.selectNodeContents(document.body)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    var start = preSelectionRange.toString().length

    return {
      start: start,
      end: start + range.toString().length,
    }
  }

  RestoreSelection(savedSel) {
    var win = document.defaultView
    var charIndex = 0,
      range = document.createRange()
    range.setStart(document.body, 0)
    range.collapse(true)
    var nodeStack = [document.body],
      node,
      foundStart = false,
      stop = false

    while (!stop && (node = nodeStack.pop())) {
      if (node.nodeType == 3) {
        var nextCharIndex = charIndex + node.length
        if (
          !foundStart &&
          savedSel.start >= charIndex &&
          savedSel.start <= nextCharIndex
        ) {
          range.setStart(node, savedSel.start - charIndex)
          foundStart = true
        }
        if (
          foundStart &&
          savedSel.end >= charIndex &&
          savedSel.end <= nextCharIndex
        ) {
          range.setEnd(node, savedSel.end - charIndex)
          stop = true
        }
        charIndex = nextCharIndex
      } else {
        var i = node.childNodes.length
        while (i--) {
          nodeStack.push(node.childNodes[i])
        }
      }
    }

    var sel = win.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }

  VisualizeRange(range, label) {
    const BeginRangeMarker = '\u25BA'
    const EndRangeMarker = '\u25C4'
    const TextNodeBoundary = '\u2551'
    const NewLineIndicator = '\u21B5'
    var msg = ''
    if (range) {
      var intersects = false
      for (t = 0; t < this.AllTextNodes.length; t++) {
        var textNode = this.AllTextNodes[t]
        var value = textNode.nodeValue.replace(/[\n]/g, NewLineIndicator)
        if (range.intersectsNode(textNode)) {
          if (!intersects) {
            if (
              !allTextNodes[t + 1] ||
              !range.intersectsNode(allTextNodes[t + 1])
            )
              // I begin and finish inside this first node
              msg += `${TextNodeBoundary}${value.substring(
                0,
                range.startOffset
              )}${BeginRangeMarker}${value.substring(
                range.startOffset,
                range.endOffset
              )}${EndRangeMarker}${value.substring(range.endOffset)}`
            // I only begin inside this first node
            else
              msg += `${TextNodeBoundary}${value.substring(
                0,
                range.startOffset
              )}${BeginRangeMarker}${value.substring(range.startOffset)}`
          } else if (
            !allTextNodes[t + 1] ||
            !range.intersectsNode(this.AllTextNodes[t + 1])
          )
            // I end in this node
            msg += `${TextNodeBoundary}${value.substring(
              0,
              range.endOffset
            )}${EndRangeMarker}${value.substring(range.endOffset)}`
          // I completely contain this node
          else msg += `${TextNodeBoundary}${value}`

          intersects = true
        } else if (intersects) {
          break
        }
      }
    } else msg = 'empty range'

    txtVisualization.value = `${msg}║`
    msg = `${label} = ${msg}║`
    console.log(msg)
  }

  IsElementInViewport(el) {
    var rect = el.getBoundingClientRect()

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight ||
          document.documentElement.clientHeight) /*or $(window).height() */ &&
      rect.right <=
        (window.innerWidth ||
          document.documentElement.clientWidth) /*or $(window).width() */
    )
  }

  PreviousTextNode(textNode) {
    if (textNode.nodeType != 3) throw 'previousTextNode: not a text node'
    var i = this.AllTextNodes.indexOf(textNode)
    if (i == -1) throw 'previousTextNode: node is not found in allTextNodes'
    else if (i === 0) return null
    else return this.AllTextNodes[i - 1]
  }

  NextTextNode(textNode) {
    if (textNode.nodeType != 3) throw 'nextTextNode: not a text node'
    var i = this.AllTextNodes.indexOf(textNode)
    if (i == -1) throw 'nextTextNode: node is not found in allTextNodes'
    else if (i == this.AllTextNodes.length - 1) return null
    else return this.AllTextNodes[i + 1]
  }

  //#region private methods
  #createRange(startNode, startIndex, endNode, endIndex) {
    var range = new Range()
    range.setStart(startNode, startIndex)
    range.setEnd(endNode, endIndex)
    return range
  }

  BlockNode(el) {
    var found = false
    do {
      el = el.parentNode
      var computedStyle
      try {
        computedStyle = window.getComputedStyle(el)
      } catch (ex) {
        continue
      }
      var display = computedStyle.getPropertyValue('display')
      switch (display) {
        case 'inline':
          break
        case 'block':
        case 'inline-block':
        case 'flex':
        case 'list-item':
          found = true
          break
      }
    } while (!found)
    return el
  }

  textNodeFilter(self, node) {
    var el = node.parentElement
    do {
      var computedStyle = window.getComputedStyle(el)
      if (
        computedStyle.display == 'none' ||
        computedStyle.visibility == 'hidden' ||
        // this IS skipping code elements like it's supposed to
        self.excludedTags.includes(el.tagName.toLowerCase()) ||
        // and empty nodes
        el.nodeValue == '' ||
        // and punctuation only nodes
        !/\w+/gi.test(node.nodeValue)
      )
        return NodeFilter.FILTER_SKIP
      el = el.parentElement
    } while (el)
    return NodeFilter.FILTER_ACCEPT
  }

  textNodesUnder(root) {
    var self = this

    var textNodes = []
    if (root.nodeType == 3) textNodes.push(root)
    else {
      var treeWalker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        (node) => this.textNodeFilter(this, node),
        false
      )
      var node
      while ((node = treeWalker.nextNode())) textNodes.push(node)
    }
    return textNodes // Array
  }
  //#endregion
}

WebPageReader.Dom = Dom
