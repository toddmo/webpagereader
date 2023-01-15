/*  the textual surface of a web page is completely tiled over with text nodes
    a character has the text node on which it sits and the character position (Offset) within that node's text
    @Offset is the character offset within the text node
*/
class Character {
  constructor(dom, range) {
    this.dom = dom;
    this.TextNode = range.startContainer;
    this.Offset = range.startOffset;
    this.Bof = false;
    this.Eof = false;
  }

  #textNode
  get TextNode() {
    return this.#textNode
  }
  set TextNode(value) {
    this.#textNode = value
    this.BlockNode = this.TextNode.parentNode.closest(`*:not([style*='inline'])`)
  }

  Search(regex, forward) {
    var initialBlockNode = this.BlockNode
    var found = false;
    var buffer = '';
    do {
      if (forward) {
        buffer += this.toString();
        found = regex.test(buffer) || this.BlockNode != initialBlockNode;
        regex.lastIndex = 0;
        if (!this.Next()) return false;
      } else {
        if (!this.Previous()) return false;
        buffer = this.toString() + buffer;
        found = regex.test(buffer) || this.BlockNode != initialBlockNode
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
      if (!this.dom.PreviousTextNode(this.TextNode)) {
        this.Bof = true;
        this.Offset = 0;
        return false;
      }
      this.TextNode = this.dom.PreviousTextNode(this.TextNode);
      this.Offset = this.TextNode.nodeValue.length - 1;
    }
    return true;
  }

  Next() {
    this.Eof = false;
    this.Offset++;
    // if I crossed into the next text node
    if (this.Offset > this.TextNode.nodeValue.length - 1) {
      // go to the next text node
      var nextTextNode = this.dom.NextTextNode(this.TextNode)
      // if there's not a next text node
      if (!nextTextNode) {
        this.Eof = true;
        this.Offset = this.TextNode.nodeValue.length - 1;
        return false;
      }
      this.TextNode = nextTextNode
      this.Offset = 0;
    }
    return true;
  }

  toString() {
    return this.TextNode.nodeValue.substring(this.Offset, this.Offset + 1);
  }
}

WebPageReader.Character = Character

