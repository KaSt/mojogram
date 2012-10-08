Updater.URL = "https://raw.github.com/amoralico/mojowhatsup/master/lversion.json";
//"https://github.com/downloads/amoralico/mojowhatsup/lversion.json";

function Updater() {
	this.request = null;
}

Updater.checkUpdate = function(controller, showWhenNoUpdate, force) {
	var updater = new Updater();
	updater.checkUpdates(function(response) {
		Mojo.Log.error("lversion %j", response);
		if (response.newVersion) {
			if (force || ((new Date().getTime() - _lastUpdateSeen) > 3600000)) {
				_lastUpdateSeen = new Date().getTime();
				controller.stageController.pushScene("update", response);
			}
		} else if (showWhenNoUpdate) {
			controller.showAlertDialog({
				title : $L("Notification"),
				message : $L("#{appName} is up to date").interpolate({appName: Mojo.appInfo.title}),
				choices : [{
					label : $L('OK'),
					value : "accept",
					type : 'affirmative'
				}],
			});
		}
	});
	delete updater;
}

Updater.isNewVersion = function(current, last) {
	var numbersLast = last.split(".");
	var numbersCurrent = current.split(".");
	if (numbersLast.length > numbersCurrent.lenght) {
		for (var i = 1; i <= (numbersLast.length - numbersCurrent.length); i++)
			numbersCurrent.push("0");
	} else {
		for (var i = 1; i <= (numbersCurrent.length - numbersLast.length); i++)
			numbersLast.push("0");
	}

	Mojo.Log.info("current %j last %j", numbersCurrent, numbersLast);

	for (var i = 0; i < numbersLast.length; i++) {
		if (parseInt(numbersLast[i]) > parseInt(numbersCurrent[i]))
			return true;
	}

	return false;
}

Updater.prototype.checkUpdates = function(callback) {
	this.request = new XMLHttpRequest();
	this.request.open('GET', Updater.URL, true);
	this.request.onreadystatechange = function() {
		if (this.request.readyState == 4 && this.request.status == 200) {
			Mojo.Log.error("text %s", this.request.responseText);
			var json = JSON.parse(this.request.responseText);
			json.newVersion = false;
			if (Updater.isNewVersion(Mojo.appInfo.version, json.version)) {
				json.newVersion = true;
			}
			if (callback)
				callback(json);
		}
	}.bind(this);
	this.request.send();
}
