WebPageReader.Regex = function () {
  /* regex common functions
  */

  /* constants */
  const REGEX_SENTENCE_TERMINATOR = /[.?!]/g;
  const REGEX_NON_WHITESPACE = /\S/g;

  /* public properties */
  Object.defineProperty(this, "SentenceTerminator", {
    value: REGEX_SENTENCE_TERMINATOR,
    writable: false
  });

  Object.defineProperty(this, "NonWhitespace", {
    value: REGEX_NON_WHITESPACE,
    writable: false
  });

  /* extension methods */
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

};
