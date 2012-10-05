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
	this.controller.get("chatsGroupTitle").update($L("Messages text font"));
	this.controller.get("resizeImage").update($L("Reduce image before sending"));
	this.controller.get("phoneTypesTitle").update($L("Contacts"));
	this.controller.get("langTitle").update($L("Language"));

	this.languageChoices = [{
		label : $L("English"),
		value : "en_gb"
	}, {
		label : $L("Spanish"),
		value : "es_es"
	}, {
		label : $L("German"),
		value : "de_de"
	}, {
		label : $L("Italian"),
		value : "it_it"
	}, {
		label : $L("French"),
		value : "fr_fr"
	}, {	
		label : $L("Dutch"),
		value : "nl_nl"
	}, {
		label : $L("Chinese (Simplified)"),
		value : "zh_cn"
	}, {
		label : $L("Chinese (Traditional)"),
		value : "zh_tw"
	}, {
		label : $L("Chinese (Hong Kong)"),
		value : "zh_hk"
	}];

	this.controller.setupWidget('language', {
		label : $L('Language'),
		choices : this.languageChoices,
		modelProperty : "locale"
	}, {
		locale : (_appPrefs.cookieData.language)
	});
	this.controller.listen('language', Mojo.Event.propertyChanged, this.languageHandler.bindAsEventListener(this));

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

	this.controller.setupWidget('chatTextSize', {
		label : $L('Size'),
		choices : [{
			label : 14,
			value : 14
		}, {
			label : 16,
			value : 16
		}, {
			label : 18,
			value : 18
		}, {
			label : 20,
			value : 20
		}, {
			label : 22,
			value : 22
		}, {
			label : 24,
			value : 24
		}],
		modelProperty : 'currentSize'
	}, {
		currentSize : _appPrefs.cookieData.chatTextSize
	});
	this.controller.listen('chatTextSize', Mojo.Event.propertyChanged, this.chatTextSizeHandler.bindAsEventListener(this));

	this.controller.setupWidget('imageSize', {
		label : $L('Size'),
		choices : [{
			label : $L("No reduce"),
			value : 0
		}, {
			label : "240 x 320",
			value : 320
		}, {
			label : "480 x 640",
			value : 640
		}, {
			label : "600 x 800",
			value : 800
		}, {
			label : "768 x 1024",
			value : 1024
		}, {
			label : "1024 x 1280",
			value : 1280
		}],
		modelProperty : 'currentSize'
	}, {
		currentSize : _appPrefs.cookieData.imageResolution
	});
	this.controller.listen('imageSize', Mojo.Event.propertyChanged, this.imageSizeHandler.bindAsEventListener(this));

	this.controller.setupWidget('phoneType', {
		label : $L('Phone type'),
		choices : [{
			label : $L("All phone types"),
			value : "all"
		}, {
			label : $L("Only mobile"),
			value : "mobile"
		}, {
			label : $L("Mobile and work"),
			value : "mobilework"
		}],
		modelProperty : 'currentSize'
	}, {
		currentSize : _appPrefs.cookieData.phoneTypes
	});
	this.controller.listen('phoneType', Mojo.Event.propertyChanged, this.phoneTypeHandler.bindAsEventListener(this));
}

PrefsAssistant.prototype.languageHandler = function(event) {
	_appPrefs.put("language", event.value);
    try{
		Mojo.Locale.set(_appPrefs.cookieData.language);
    }catch(e){
        Mojo.Log.error("Error "+Object.toJSON(e));
    }	
	_appAssistant.controller.getActiveStageController().activeScene().showAlertDialog({
		title : $L("Notification"),
		message : $L("It is necessary to restart the application so that this change can take effect"),
		choices : [{
			label : $L('Close application'),
			value : "close",
			type : 'affirmative'
		}],
		preventCancel : true,
		onChoose : function(value) {
			_exitApp = true;
			if (value == 'close') {
				if (_dashboardStageController)
					_appAssistant.controller.closeStage(_notificationStage);
				if (_mainStageController)
					_appAssistant.controller.closeStage(_mainStage);
			}
		}
	});

}

PrefsAssistant.prototype.phoneTypeHandler = function(event) {
	_appPrefs.put("phoneTypes", String(event.value));
}

PrefsAssistant.prototype.imageSizeHandler = function(event) {
	_appPrefs.put("imageResolution", Number(event.value));
}

PrefsAssistant.prototype.chatTextSizeHandler = function(event) {
	_appPrefs.put("chatTextSize", Number(event.value));
}

PrefsAssistant.prototype.deactivate = function(event) {
	if (_openChatAssistant != null) {
		_openChatAssistant.refreshList();
	}
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
	this.controller.stopListening('language', Mojo.Event.propertyChanged, this.languageHandler);
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
	this.controller.stopListening('chatTextSize', Mojo.Event.propertyChanged, this.chatTextSizeHandler);
	this.controller.stopListening('imageSize', Mojo.Event.propertyChanged, this.imageSizeHandler);
	this.controller.stopListening('phoneType', Mojo.Event.propertyChanged, this.phoneTypeHandler);
}