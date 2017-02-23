var settings = {
	width: 400,
	height: 320
};

var electron = require("electron");
var {app, BrowserWindow} = electron;

var window;

app.on("ready", function(){
	window = new BrowserWindow({
		width: settings.width,
		height: settings.height
	});
	window.loadURL("file://" + __dirname + "/index.html");

	window.setMaximumSize(settings.width, settings.height);
	window.setMenuBarVisibility(false);
	window.setResizable(false);
	window.focus();
	window.setPosition(50, 50);
	
	/*
	var contents = window.webContents;
	var size = electron.screen.getPrimaryDisplay().workAreaSize;
	console.log(electron.screen.getPrimaryDisplay().workAreaSize);
	contents.executeJavaScript("setScreenSize(" + size.width + ", " + size.height + ")");
	*/

	//window.toggleDevTools();
});