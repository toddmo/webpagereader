class Regex {
  /* public properties */
  #REGEX_SENTENCE_TERMINATOR = /[.?!]\s+/g;
  get SentenceTerminator() {
    return this.#REGEX_SENTENCE_TERMINATOR
  }

  #REGEX_NON_WHITESPACE = /\S/g;
  get NonWhitespace() {
    return this.#REGEX_NON_WHITESPACE
  }
}

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


WebPageReader.Regex = Regex
