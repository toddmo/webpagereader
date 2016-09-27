chrome.commands.onCommand.addListener(function (command) {
  console.log('Command:', command);
  doCommand(command);
});

function doCommand(name) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { command: name }, function (response) {
      console.log(response.outcome);
    });
  });
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if(request == "isSelected") {
        chrome.tabs.getSelected(null, function(tab){
            if(tab.id == sender.tab.id) {
                sendResponse(true); //in focus (selected)
            } else {
                sendResponse(false);    //not in focus
            }
        });
    }
});