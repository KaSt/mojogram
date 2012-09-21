function PrefsAssistant() {
}

PrefsAssistant.prototype.setup = function() {
	if (_mainAssistant != null && _appAssistant.isTouchPad()) {
		var menuModel = {
			visible : true,
			items : [{
				icon : "back",
				command : "goBack"
			}]
		};

		this.controller.setupWidget(Mojo.Menu.commandMenu, this.attributes = {
			spacerHeight : 0,
			menuClass : 'no-fade'
		}, menuModel);
	}

	this.controller.get("headerTitle").update($L("Preferences"));
	this.controller.get("personGroupTitle").update($L("Persons notifications"));
	this.controller.get("groupGroupTitle").update($L("Groups notifications"));
	this.controller.get("bgGroupTitle").update($L("Background"));
	this.controller.get("personVibrateLabel").update($L("Vibrate"));
	this.controller.get("groupVibrateLabel").update($L("Vibrate"));
	this.controller.get("personBannerLabel").update($L("Show banner"));
	this.controller.get("groupBannerLabel").update($L("Show banner"));
	this.controller.get("personBlinkLabel").update($L("Light bar"));
	this.controller.get("groupBlinkLabel").update($L("Light bar"));
	this.controller.get("personToneLabel").update($L("Tone"));
	this.controller.get("groupToneLabel").update($L("Tone"));

	this.soundChoices = [{
		label : $L("System sound"),
		value : "system"
	}, {
		label : $L("Custom sound"),
		value : "custom"
	}, {
		label : $L("Silence"),
		value : "silence"
	}];

	this.controller.setupWidget('personSoundSelector', {
		label : $L('Sound'),
		choices : this.soundChoices,
		modelProperty : "currentSound"
	}, {
		currentSound : _appPrefs.cookieData.personSound
	});
	this.controller.listen('personSoundSelector', Mojo.Event.propertyChanged, this.personSoundHandler.bindAsEventListener(this));

	if (_appPrefs.cookieData.personSound == "custom") {
		this.controller.get('personTonePathRow').show();
	} else {
		this.controller.get('personTonePathRow').hide();
	}
	this.controller.get('personTonePath').update(_appPrefs.cookieData.personToneName);
	this.controller.listen('personTonePathRow', Mojo.Event.tap, this.personTonePathTapHandler.bindAsEventListener(this));

	this.controller.setupWidget('personVibrateToggle', {
		modelProperty : "value"
	}, {
		value : _appPrefs.cookieData.personVibrate
	});
	this.controller.listen('personVibrateToggle', Mojo.Event.propertyChanged, this.personVibrateHandler.bindAsEventListener(this));

	this.controller.setupWidget('personBannerToggle', {
		modelProperty : "value"
	}, {
		value : _appPrefs.cookieData.personBanner
	});
	this.controller.listen('personBannerToggle', Mojo.Event.propertyChanged, this.personBannerHandler.bindAsEventListener(this));

	this.controller.setupWidget('personBlinkToggle', {
		modelProperty : "value"
	}, {
		value : _appPrefs.cookieData.personBlink
	});
	this.controller.listen('personBlinkToggle', Mojo.Event.propertyChanged, this.personBlinkHandler.bindAsEventListener(this));

	this.controller.setupWidget('groupSoundToggle', {
		modelProperty : "value"
	}, {
		value : _appPrefs.cookieData.groupSound
	});

	this.controller.setupWidget('groupSoundSelector', {
		label : $L('Sound'),
		choices : this.soundChoices,
		modelProperty : "currentSound"
	}, {
		currentSound : _appPrefs.cookieData.groupSound
	});

	this.controller.listen('groupSoundSelector', Mojo.Event.propertyChanged, this.groupSoundHandler.bindAsEventListener(this));

	if (_appPrefs.cookieData.groupSound == "custom") {
		this.controller.get('groupTonePathRow').show();
	} else {
		this.controller.get('groupTonePathRow').hide();
	}
	this.controller.get('groupTonePath').update(_appPrefs.cookieData.groupToneName);
	this.controller.listen('groupTonePathRow', Mojo.Event.tap, this.groupTonePathTapHandler.bindAsEventListener(this));

	this.controller.setupWidget('groupVibrateToggle', {
		modelProperty : "value"
	}, {
		value : _appPrefs.cookieData.groupVibrate
	});
	this.controller.listen('groupVibrateToggle', Mojo.Event.propertyChanged, this.groupVibrateHandler.bindAsEventListener(this));

	this.controller.setupWidget('groupBannerToggle', {
		modelProperty : "value"
	}, {
		value : _appPrefs.cookieData.groupBanner
	});
	this.controller.listen('groupBannerToggle', Mojo.Event.propertyChanged, this.groupBannerHandler.bindAsEventListener(this));

	this.controller.setupWidget('groupBlinkToggle', {
		modelProperty : "value"
	}, {
		value : _appPrefs.cookieData.groupBlink
	});
	this.controller.listen('groupBlinkToggle', Mojo.Event.propertyChanged, this.groupBlinkHandler.bindAsEventListener(this));

	this.timeouts = [{
		label : $L('As items arrive'),
		value : "asArrive"
	}, {
		label : '5 ' + $L('minutes'),
		value : "00:05:00"
	}, {
		label : '10 ' + $L('minutes'),
		value : "00:10:00"
	}, {
		label : '15 ' + $L('minutes'),
		value : "00:15:00"
	}, {
		label : '20 ' + $L('minutes'),
		value : "00:20:00"
	}, {
		label : '30 ' + $L('minutes'),
		value : "00:30:00"
	}, {
		label : '45 ' + $L('minutes'),
		value : "00:45:00"
	}, {
		label : '1 ' + $L('hour'),
		value : "01:00:00"
	}, {
		label : '6 ' + $L('hours'),
		value : "06:00:00"
	}, {
		label : '12 ' + $L('hours'),
		value : "12:00:00"
	}, {
		label : '24 ' + $L('hours'),
		value : "24:00:00"
	}];

	this.controller.setupWidget('bgTimeoutSelector', {
		label : $L('Get messages'),
		choices : this.timeouts,
		modelProperty : 'currentTimeout'
	}, {
		currentTimeout : _appPrefs.cookieData.backgroundTimeout
	});
	this.controller.listen('bgTimeoutSelector', Mojo.Event.propertyChanged, this.bgTimeoutHandler.bindAsEventListener(this));
}

PrefsAssistant.prototype.personTonePathTapHandler = function(event) {
	Mojo.FilePicker.pickFile({
		onSelect : this.personTonePathSelectionHandler.bind(this),
		kinds : ["ringtone"],
		defaultKind : "ringtone",
		actionType : "open",
		filePath : _appPrefs.cookieData.personTonePath
	}, this.controller.stageController);
}

PrefsAssistant.prototype.groupTonePathTapHandler = function(event) {
	Mojo.FilePicker.pickFile({
		onSelect : this.groupTonePathSelectionHandler.bind(this),
		kinds : ["ringtone"],
		defaultKind : "ringtone",
		actionType : "open",
		filePath : _appPrefs.cookieData.groupTonePath
	}, this.controller.stageController);
}

PrefsAssistant.prototype.personTonePathSelectionHandler = function(selection) {
	_appPrefs.put('personTonePath', selection.fullPath);
	_appPrefs.put('personToneName', selection.name);
	this.controller.get("personTonePath").update(selection.name);
}

PrefsAssistant.prototype.groupTonePathSelectionHandler = function(selection) {
	_appPrefs.put('groupTonePath', selection.fullPath);
	_appPrefs.put('groupToneName', selection.name);
	this.controller.get("groupTonePath").update(selection.name);
}

PrefsAssistant.prototype.handleCommand = function(event) {
	if (event.type == Mojo.Event.command) {
		switch(event.command) {
			case 'goBack':
				this.controller.stageController.popScene();
				break;
		}
	}
}

PrefsAssistant.prototype.bgTimeoutHandler = function(event) {
	_appPrefs.put("backgroundTimeout", event.value);
}

PrefsAssistant.prototype.personSoundHandler = function(event) {
	_appPrefs.put('personSound', event.value);
	if (event.value == "custom") {
		this.controller.get('personTonePathRow').show();
	} else {
		this.controller.get('personTonePathRow').hide();
	}
}

PrefsAssistant.prototype.personVibrateHandler = function(event) {
	_appPrefs.put('personVibrate', event.value);
}

PrefsAssistant.prototype.personBannerHandler = function(event) {
	_appPrefs.put('personBanner', event.value);
}

PrefsAssistant.prototype.personBlinkHandler = function(event) {
	_appPrefs.put('personBlink', event.value);
}

PrefsAssistant.prototype.groupSoundHandler = function(event) {
	_appPrefs.put('groupSound', event.value);
	if (event.value == "custom") {
		this.controller.get('groupTonePathRow').show();
	} else {
		this.controller.get('groupTonePathRow').hide();
	}
}

PrefsAssistant.prototype.groupVibrateHandler = function(event) {
	_appPrefs.put('groupVibrate', event.value);
}

PrefsAssistant.prototype.groupBannerHandler = function(event) {
	_appPrefs.put('groupBanner', event.value);
}

PrefsAssistant.prototype.groupBlinkHandler = function(event) {
	_appPrefs.put('groupBlink', event.value);
}

PrefsAssistant.prototype.cleanup = function() {
	this.controller.stopListening('personSoundSelector', Mojo.Event.propertyChanged, this.personSoundHandler);
	this.controller.stopListening('personVibrateToggle', Mojo.Event.propertyChanged, this.personVibrateHandler);
	this.controller.stopListening('groupSoundSelector', Mojo.Event.propertyChanged, this.groupSoundHandler);
	this.controller.stopListening('groupVibrateToggle', Mojo.Event.propertyChanged, this.groupVibrateHandler);
	this.controller.stopListening('groupBannerToggle', Mojo.Event.propertyChanged, this.groupBannerHandler);
	this.controller.stopListening('personBannerToggle', Mojo.Event.propertyChanged, this.personBannerHandler);
	this.controller.stopListening('personBlinkToggle', Mojo.Event.propertyChanged, this.personBlinkHandler);
	this.controller.stopListening('groupBlinkToggle', Mojo.Event.propertyChanged, this.groupBlinkHandler);
	this.controller.stopListening('bgTimeoutSelector', Mojo.Event.propertyChanged, this.bgTimeoutHandler);
	this.controller.stopListening('bgTimeoutSelector', Mojo.Event.propertyChanged, this.bgTimeoutHandler);
	this.controller.stopListening('personTonePathRow', Mojo.Event.tap, this.personTonePathTapHandler);
	this.controller.stopListening('groupTonePathRow', Mojo.Event.tap, this.groupTonePathTapHandler);
	
}