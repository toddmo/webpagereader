# <span style="color:orange">Web Page Reader - Release Notes</span>

<!-- 0.7.3 -->

## <span style="color:dodgerblue">Version 0.7.3</span>

### <span style="color:aquamarine">New Features</span>

- Skip list (<kbd>CTRL</kbd>+<kbd>LEFT</kbd> / <kbd>CTRL</kbd>+<kbd>RIGHT</kbd>)
- Vocabulary Control Panel - Custom dictionaries / pronounciation
- Accordian in control panel

### <span style="color:plum">Bug Fixes</span>

- opening control panel causes a resume
- volume changes from keyboard aren't stored in control panel
- pause doesn't work after previous. It should, after a certain timeout.
- repeat isn't moving forward?
- when clicking on a link while reading, it seems to count that as a new selection, but since nothing is selected, it starts reading from the top of the page
- Got into a state where left and right keys (alternately) were not working, after pausing. Only right, right got it out of this state.

<!-- 0.7.2 -->

## <span style="color:dodgerblue">Version 0.7.2</span>

### <span style="color:aquamarine">New Features</span>

- <span style="color:limegreen">✓</span> Separate control panel sections
- <span style="color:limegreen">✓</span> Scroll Middle Adjustment
- <span style="color:limegreen">✓</span> Re-locate reading location (double click on word)

### <span style="color:plum">Bug Fixes</span>

- <span style="color:limegreen">✓</span> storage issues
- <span style="color:limegreen">✓</span> tab change behavior

<!-- 0.7.1 -->

## <span style="color:dodgerblue">Version 0.7.1</span>

### <span style="color:aquamarine">New Features</span>

- <span style="color:limegreen">✓</span> Pitch Control (<kbd>9</kbd> / <kbd>3</kbd>)
- <span style="color:limegreen">✓</span> Tab to current link (<kbd>TAB</kbd>)
- <span style="color:limegreen">✓</span> Auto Scroll Options

### <span style="color:plum">Bug Fixes</span>

- <span style="color:limegreen">✓</span> reader hesitation

<!-- 0.7.0 -->

## <span style="color:dodgerblue">Version 0.7.0</span>

### <span style="color:aquamarine">New Features</span>

- <span style="color:limegreen">✓</span> Version 3 manifest
- <span style="color:limegreen">✓</span> Compliant minimum permissions
  - <span style="color:limegreen">✓</span> Mind the new permissions limits
- <span style="color:limegreen">✓</span> ES6 Classes
- <span style="color:limegreen">✓</span> Dark Mode for reader controls
- <span style="color:limegreen">✓</span> Better "sentence" detection
  - <span style="color:limegreen">✓</span> Stand alone block element text is its own "sentence" for reading purposes
- ❌ Better voices, get from Google API
  - <span style="color:limegreen">✓</span> Standard voices were good enough
- <span style="color:limegreen">✓</span> Ability to skip reading sections of code
- <span style="color:limegreen">✓</span> Control over the highlight color
- <span style="color:limegreen">✓</span> Repeat reading current sentence (<kbd>RETURN</kbd>)

### <span style="color:plum">Bug Fixes</span>

- <span style="color:limegreen">✓</span> \w*\.\w* is not a sentence demarkation. Need whitespace after the period.
- <span style="color:limegreen">✓</span> stops speaking randomly in the middle of long sentences
- 🕑 Bug Bash
  - <span style="color:limegreen">✓?</span> continues reading after pause
  - <span style="color:limegreen">✓</span> Voice not initially set
  - <span style="color:limegreen">✓</span> Speech doesn't speak at first
  - <span style="color:limegreen">✓?</span> Uncaught Error: Extension context invalidated.
