var settings = {
	width: 400,
	height: 320
};

var {BrowserWindow} = require("electron");
var {app} = require("electron");

var window;

app.on("ready", function(){
	window = new BrowserWindow({
	  width: settings.width,
	  height:  settings.height
	});
	window.loadURL("file://" + __dirname + "/index.html");

	window.setMaximumSize(settings.width, settings.height);
	window.setMenuBarVisibility(false);
	window.setResizable(false);
	window.focus();
	window.setPosition(50, 50);

	//window.toggleDevTools();
});