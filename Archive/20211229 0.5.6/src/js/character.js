/* Classes */
WebPageReader.Character = class {
  /*  the textual surface of a web page is completely tiled over with text nodes
      a character has the text node on which it sits and the character position (Offset) within that node's text
  */
  constructor(dom, range) {
    this.dom = dom;
    this.TextNode = range.startContainer;
    this.Offset = range.startOffset;
    this.Bof = false;
    this.Eof = false;
  }

  Search(regex, forward) {
    var found = false;
    var buffer = '';
    do {
      if (forward) {
        buffer += this.toString();
        found = regex.test(buffer);
        regex.lastIndex = 0;
        if (!this.Next()) return false;
      } else {
        if (!this.Previous()) return false;
        buffer = this.toString() + buffer;
        found = regex.test(buffer);
        regex.lastIndex = 0;
      }
    } while (!found);
    // roll it one character (get off the match)    
    if (forward) this.Previous();
    else this.Next();
    return true; // found it
  }

  Previous() {
    this.Bof = false;
    this.Offset--;
    if (this.Offset < 0) {
      if (!this.dom.getPreviousTextNode(this.TextNode)) {
        this.Bof = true;
        this.Offset = 0;
        return false;
      }
      this.TextNode = this.dom.getPreviousTextNode(this.TextNode);
      this.Offset = this.TextNode.nodeValue.length - 1;
    }
    return true;
  }

  Next() {
    this.Eof = false;
    this.Offset++;
    if (this.Offset > this.TextNode.nodeValue.length - 1) {
      if (!this.dom.getNextTextNode(this.TextNode)) {
        this.Eof = true;
        this.Offset = this.TextNode.nodeValue.length - 1;
        return false;
      }
      this.TextNode = this.dom.getNextTextNode(this.TextNode);
      this.Offset = 0;
    }
    return true;
  }

  toString() {
    return this.TextNode.nodeValue.substring(this.Offset, this.Offset + 1);
  }
}
