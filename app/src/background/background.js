/*
chrome.commands.onCommand.addListener(function (command) {
  console.log('Command:', command);
  doCommand(command);
});
*/

function doCommand(name) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { command: name }, function (response) {
      console.log(response.outcome);
    });
  });
}

// handle messages that come from the application
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request) {
    // this is from the reader, checking if it's the active reader
    case 'isSelected':
      chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(
        (tabs) => {
          // `tab` will either be a `tabs.Tab` instance or `undefined`.
          if (tabs.length && tabs[0].id == sender.tab.id) {
            sendResponse(true); //in focus (selected)
          } else {
            sendResponse(false);    //not in focus
          }
        }
      )
      break;
  }
  return true
});

chrome.runtime.onConnect.addListener(port => {
  console.log('connected ', port);
  if (port.name === 'hi') {
    port.onMessage.addListener(this.processMessage);
  }
});