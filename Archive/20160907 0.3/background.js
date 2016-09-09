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
