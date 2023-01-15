class Vocabulary extends Storable {
  constructor() {
    super()
  }

  #dictionaries = []
  get Dictionaries() {
    return this.#dictionaries
  }
  set Dictionaries(value) {
    this.#dictionaries = value
  }

  Add(dictionary) {
    this.Dictionaries.push(dictionary)
  }

  Create() {
    var text = prompt('Enter dictionary name')
    if (text === null) return
    var dictionary = new Dictionary(text)
    this.Add(dictionary)
    this.save(new WebPageReader.WindowLocalStorage())
  }

  Edit(dictionary) {
    var name = prompt(`Enter new name for ${dictionary.Name}`)
    if (name === null) return
    var existing = this.Dictionaries.find((o) => o.id == dictionary.id)
    Object.assign(existing, new Dictionary(name))
    this.save(new WebPageReader.WindowLocalStorage())
  }
}

class Dictionary extends Storable {
  constructor(name) {
    super()
    this.Name = name
  }

  #name = []
  get Name() {
    return this.#name
  }
  set Name(value) {
    this.#name = value
  }

  #words = []
  get Words() {
    return this.#words
  }
  set Words(value) {
    this.#words = value
  }

  Add(word) {
    this.Words.push(word)
  }

  Create() {
    var text = prompt('Enter vocabulary word')
    if (text === null) return
    var pronounciation = prompt('Spell out how you want it pronounced')
    if (pronounciation === null) return
    var word = new Word(text, pronounciation)
    this.Add(word)
    this.save(new WebPageReader.WindowLocalStorage())
  }

  Edit(word) {
    var text = prompt(`Enter new word for ${word.Text}`)
    if (text === null) return
    var pronounciation = prompt(
      `Spell out new pronounciation instead of ${word.Pronounciation}`
    )
    if (pronounciation === null) return
    var existing = this.Words.find((o) => o.id == word.id)
    Object.assign(existing, new Word(text, pronounciation))
    this.save(new WebPageReader.WindowLocalStorage())
  }
}

class Word extends Storable {
  constructor(text, pronounciation) {
    this.Text = text
    this.Pronounciation = pronounciation
  }

  #text
  get Text() {
    return this.#text
  }
  set Text(value) {
    this.#text = value
  }

  #pronounciation
  get Pronounciation() {
    return this.#pronounciation
  }
  set Pronounciation(value) {
    this.#pronounciation = value
  }
}

WebPageReader.Vocabulary = Vocabulary
