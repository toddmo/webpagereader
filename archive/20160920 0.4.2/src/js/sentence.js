WebPageReader.Sentence = class extends Range {
  /*  Sentence understance everything about sentences
      It has a starting and ending character, and ends with a sentence terminator
      It can navigate itself around the page
  */

  constructor() {
    super();
    this.dom = new WebPageReader.Dom();
    this.regex = new WebPageReader.Regex();
    this.highlighted = false;
    this.backupHtml = '';
    this.dom.LoadAllTextNodes();
    this.AlignToRange(this.dom.GetSelectedRange() || this.dom.GetFirstRange())
    this.collapse(true);
    this.AlignEndPoints();
    this.Expand();
  }

  /* public properties */
  get CanPrevious() {
    return !this.StartCharacter.Bof;
  }

  get CanNext() {
    return !this.EndCharacter.Eof;
  }

  set Highlighted(value) {
    if (value == this.highlighted) return;
    if (value)
      this.Highlight();
    else
      this.Unhighlight();
    this.highlighted = value;
  }

  /* public methods */
  Expand() {
    this.StartCharacter.Search(this.regex.SentenceTerminator, false);
    this.StartCharacter.Search(this.regex.NonWhitespace, true);
    this.EndCharacter.Search(this.regex.SentenceTerminator, true);
    this.Align();
  }

  Next() {
    this.EndCharacter.Next();
    this.Align();
    this.collapse(false); // collapse to end
    this.AlignEndPoints();
    this.Expand();
  }

  Previous() {
    this.StartCharacter.Search(this.regex.SentenceTerminator, false);
    this.StartCharacter.Previous();
    this.Align();
    this.collapse(true); // collapse to start
    this.AlignEndPoints();
    this.Expand();
  }

  Align() {
    this.setStart(this.StartCharacter.TextNode, this.StartCharacter.Offset);
    this.setEnd(this.EndCharacter.TextNode, this.EndCharacter.Offset);
  }

  AlignToRange(range) {
    this.setStart(range.startContainer, range.startOffset);
    this.setEnd(range.endContainer, range.endOffset);
  }

  AlignEndPoints() {
    this.StartCharacter = new WebPageReader.Character(this.dom, this);
    this.EndCharacter = new WebPageReader.Character(this.dom, this);
  }

  Highlight() {
    /*
    var savedSelection = this.dom.GetSelectedRange() ? this.dom.SaveSelection() : null;
    */
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(this);
    /*
    document.designMode = 'on';
    document.execCommand("hiliteColor", false, "DodgerBlue");
    document.execCommand("foreColor", false, "White");
    selection.removeAllRanges();
    */
    if (!this.dom.IsElementInViewport(this.startContainer.parentElement))
      this.startContainer.parentElement.scrollIntoView(true);
    this.highlighted = true;

/*
    if (selection) this.dom.RestoreSelection(selection);
*/

    /*    
    var span = document.createElement('span');
    span.id = "sentenceHighlighter"
    span.className = 'highlight';
    span.appendChild(this.extractContents());
    this.insertNode(span);
    span.scrollIntoView(true);
    */
    /*
    var span = document.createElement('span');
    span.id = "sentenceHighlighter"
    span.className = 'highlight';
    span.style.position = 'absolute';
    span.style.top = (this.getBoundingClientRect().top + document.body.scrollTop ) + 'px';
    span.style.left = this.getBoundingClientRect().left.toString() + 'px';
    span.style.width = this.getBoundingClientRect().width.toString() + 'px';
    span.style.fontFamily = window.getComputedStyle(this.startContainer.parentElement, null).getPropertyValue("font-family");
    span.style.fontSize  = window.getComputedStyle(this.startContainer.parentElement, null).getPropertyValue("font-size");
    span.appendChild(this.cloneContents());
    document.body.appendChild(span);
    if(!this.dom.IsElementInViewport(span))
      span.scrollIntoView(true);
    */
    /*
    var temp = document.createElement('template');
    var documentFragment = this.cloneContents();
    temp.appendChild(documentFragment);
    var innerHtml = '';
    for(var i = 0;i<temp.childNodes.length; i++){
      innerHtml += temp.childNodes[i].nodeType == 3 ? temp.childNodes[i].nodeValue : temp.childNodes[i].outerHTML;
    }
    var html = temp.innerHTML;
    span.appendChild(documentFragment);
    document.body.appendChild(span);
    */
  }

  Unhighlight() {
    /*
    document.execCommand("undo", false, "");
    document.execCommand("undo", false, "");
    */
/*    
    var selection = window.getSelection();
    selection.removeAllRanges();
    */
    this.highlighted = false;

    /*
    var selection = this.dom.GetSelectedRange() ? this.dom.SaveSelection() : null;
    var who = document.getElementById('sentenceHighlighter');
    if (who) {
      var pa = who.parentNode;
      while (who.firstChild) {
        pa.insertBefore(who.firstChild, who);
      }
      pa.removeChild(who);
    }
    if (selection) this.dom.RestoreSelection(selection);
    */
  }

  Visualize(label) {
    const BeginRangeMarker = '\u25BA';
    const EndRangeMarker = '\u25C4';
    const TextNodeBoundary = '\u2551';
    const NewLineIndicator = '\u21B5';
    var allTextNodes = this.dom.AllTextNodes;
    var msg = '';
    var intersects = false;
    for (var t = 0; t < allTextNodes.length; t++) {
      var textNode = allTextNodes[t];
      var value = textNode.nodeValue.replace(/[\n]/g, NewLineIndicator);
      if (this.intersectsNode(textNode)) {
        if (!intersects) {
          if (!allTextNodes[t + 1] || !this.intersectsNode(allTextNodes[t + 1]))
            // I begin and finish inside this first node
            msg += `${TextNodeBoundary}${value.substring(0, this.startOffset)}${BeginRangeMarker}${value.substring(this.startOffset, this.endOffset)}${EndRangeMarker}${value.substring(this.endOffset)}`;
          else
            // I only begin inside this first node
            msg += `${TextNodeBoundary}${value.substring(0, this.startOffset)}${BeginRangeMarker}${value.substring(this.startOffset)}`;
        } else if (!allTextNodes[t + 1] || !this.intersectsNode(allTextNodes[t + 1]))
          // I end in this node
          msg += `${TextNodeBoundary}${value.substring(0, this.endOffset)}${EndRangeMarker}${value.substring(this.endOffset)}`;
        else
          // I completely contain this node
          msg += `${TextNodeBoundary}${value}`;

        intersects = true;
      } else if (intersects) {
        break;
      }
    }
    // txtVisualization.value = `${msg}║`; 
    msg = `${label} = ${msg}║`;
    console.log(msg);
  }
}
