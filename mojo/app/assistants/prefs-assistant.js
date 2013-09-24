function PrefsAssistant(){
    _prefsAssistant = this;
    
    this.languageChoices = [{
        label: $L("English"),
        value: "en_gb"
    }, {
        label: $L("Spanish"),
        value: "es_es"
    }, {
        label: $L("German"),
        value: "de_de"
    }, {
        label: $L("Italian"),
        value: "it_it"
    }, {
        label: $L("French"),
        value: "fr_fr"
    }, {
        label: $L("Dutch"),
        value: "nl_nl"
    }, {
        label: $L("Chinese (Simplified)"),
        value: "zh_cn"
    }, {
        label: $L("Chinese (Traditional)"),
        value: "zh_tw"
    }, {
        label: $L("Chinese (Hong Kong)"),
        value: "zh_hk"
    }, {
        label: $L("Russian"),
        value: "ru_ru"
    }];
    
    this.soundChoices = [{
        label: $L("System sound"),
        value: "system"
    }, {
        label: $L("Custom sound"),
        value: "custom"
    }, {
        label: $L("Silence"),
        value: "silence"
    }];
    
    this.timeouts = [{
        label: $L('As items arrive'),
        value: "asArrive"
    }, {
        label: '5 ' + $L('minutes'),
        value: "00:05:00"
    }, {
        label: '10 ' + $L('minutes'),
        value: "00:10:00"
    }, {
        label: '15 ' + $L('minutes'),
        value: "00:15:00"
    }, {
        label: '20 ' + $L('minutes'),
        value: "00:20:00"
    }, {
        label: '30 ' + $L('minutes'),
        value: "00:30:00"
    }, {
        label: '45 ' + $L('minutes'),
        value: "00:45:00"
    }, {
        label: '1 ' + $L('hour'),
        value: "01:00:00"
    }, {
        label: '6 ' + $L('hours'),
        value: "06:00:00"
    }, {
        label: '12 ' + $L('hours'),
        value: "12:00:00"
    }, {
        label: '24 ' + $L('hours'),
        value: "24:00:00"
    }];
    
    this.imageChoices = [{
        label: $L("Default"),
        value: "default"
    }, {
        label: $L("Custom image"),
        value: "custom"
    }, {
		label: $L("None"),
		value: "none"
	}];
	
	this.bubbleChoices = [{
        label: $L("Palm"),
        value: "classic"
    }, {
        label: $L("Whatsapp"),
        value: "modern"
    }];
    
}

PrefsAssistant.prototype.setup = function(){
    if (_chatsAssistant != null && _appAssistant.isTouchPad()) {
        var menuModel = {
            visible: true,
            items: [{
                icon: "back",
                command: "goBack"
            }]
        };
        
        this.controller.setupWidget(Mojo.Menu.commandMenu, this.attributes = {
            spacerHeight: 0,
            menuClass: 'no-fade'
        }, menuModel);
    }
    
    this.controller.get("langTitle").update($L("Language"));
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
    this.controller.get("backimageGroupTitle").update($L("Chat background"));
    this.controller.get("backimageLabel").update($L("Image path"));
    
    _appPrefs.get();
    
    this.controller.setupWidget("spinnerId", this.attributesSpinner = {
        spinnerSize: "small"
    }, this.modelSpinner = {
        spinning: false
    });
    
    this.controller.get('spinnerId').hide();
    
    this.controller.get('profilePictureTitle').update($L("Profile picture"));
    this.setPicture();
    this.controller.listen("profileImage", Mojo.Event.tap, this.profileImageHandler.bindAsEventListener(this));
    
    this.controller.setupWidget('language', {
        label: $L('Language'),
        choices: this.languageChoices,
        modelProperty: "locale"
    }, {
        locale: (_appPrefs.cookieData.language)
    });
    
    this.controller.setupWidget('personSoundSelector', {
        label: $L('Sound'),
        choices: this.soundChoices,
        modelProperty: "currentSound"
    }, {
        currentSound: _appPrefs.cookieData.personSound
    });
    
    if (_appPrefs.cookieData.personSound == "custom") {
        this.controller.get('personTonePathRow').show();
    }
    else {
        this.controller.get('personTonePathRow').hide();
    }
    this.controller.get('personTonePath').update(_appPrefs.cookieData.personToneName);
    
    this.controller.setupWidget('personVibrateToggle', {
        modelProperty: "value"
    }, {
        value: _appPrefs.cookieData.personVibrate
    });
    
    this.controller.setupWidget('personBannerToggle', {
        modelProperty: "value"
    }, {
        value: _appPrefs.cookieData.personBanner
    });
    
    this.controller.setupWidget('personBlinkToggle', {
        modelProperty: "value"
    }, {
        value: _appPrefs.cookieData.personBlink
    });
    
    this.controller.setupWidget('groupSoundToggle', {
        modelProperty: "value"
    }, {
        value: _appPrefs.cookieData.groupSound
    });
    
    this.controller.setupWidget('groupSoundSelector', {
        label: $L('Sound'),
        choices: this.soundChoices,
        modelProperty: "currentSound"
    }, {
        currentSound: _appPrefs.cookieData.groupSound
    });
    
    if (_appPrefs.cookieData.groupSound == "custom") {
        this.controller.get('groupTonePathRow').show();
    }
    else {
        this.controller.get('groupTonePathRow').hide();
    }
    this.controller.get('groupTonePath').update(_appPrefs.cookieData.groupToneName);
    
    this.controller.setupWidget('groupVibrateToggle', {
        modelProperty: "value"
    }, {
        value: _appPrefs.cookieData.groupVibrate
    });
    
    this.controller.setupWidget('groupBannerToggle', {
        modelProperty: "value"
    }, {
        value: _appPrefs.cookieData.groupBanner
    });
    
    this.controller.setupWidget('groupBlinkToggle', {
        modelProperty: "value"
    }, {
        value: _appPrefs.cookieData.groupBlink
    });
    
    this.controller.setupWidget('bgTimeoutSelector', {
        label: $L('Get messages'),
        choices: this.timeouts,
        modelProperty: 'currentTimeout'
    }, {
        currentTimeout: _appPrefs.cookieData.backgroundTimeout
    });
    
    this.controller.setupWidget('chatTextSize', {
        label: $L('Size'),
        choices: [{
            label: 14,
            value: 14
        }, {
            label: 16,
            value: 16
        }, {
            label: 18,
            value: 18
        }, {
            label: 20,
            value: 20
        }, {
            label: 22,
            value: 22
        }, {
            label: 24,
            value: 24
        }],
        modelProperty: 'currentSize'
    }, {
        currentSize: _appPrefs.cookieData.chatTextSize
    });
    
    this.controller.setupWidget('imageSize', {
        label: $L('Size'),
        choices: [{
            label: $L("No reduce"),
            value: 0
        }, {
            label: "240 x 320",
            value: 320
        }, {
            label: "480 x 640",
            value: 640
        }, {
            label: "600 x 800",
            value: 800
        }, {
            label: "768 x 1024",
            value: 1024
        }, {
            label: "1024 x 1280",
            value: 1280
        }],
        modelProperty: 'currentSize'
    }, {
        currentSize: _appPrefs.cookieData.imageResolution
    });
    
    this.controller.setupWidget('phoneType', {
        label: $L('Phone type'),
        choices: [{
            label: $L("All phone types"),
            value: "all"
        }, {
            label: $L("Only mobile"),
            value: "mobile"
        }, {
            label: $L("Mobile and work"),
            value: "mobilework"
        }],
        modelProperty: 'currentSize'
    }, {
        currentSize: _appPrefs.cookieData.phoneTypes
    });
    
	
	this.controller.setupWidget('bubbleclassSelector', {
        label: $L('Bubble class'),
        choices: this.bubbleChoices,
        modelProperty: "currentBubble"
    }, {
        currentBubble: _appPrefs.cookieData.bubbleclass
    });
    
    this.controller.setupWidget('backimageSelector', {
        label: $L('Image'),
        choices: this.imageChoices,
        modelProperty: "currentImage"
    }, {
        currentImage: _appPrefs.cookieData.backimageType
    });
    
    if (_appPrefs.cookieData.backimageType == "custom") {
        this.controller.get('backimagePathRow').show();
    }
    else {
        this.controller.get('backimagePathRow').hide();
    }
    this.controller.get('backimagePath').update(_appPrefs.cookieData.backimagePath);
    
    this.controller.listen('language', Mojo.Event.propertyChanged, this.languageHandler.bindAsEventListener(this));
    this.controller.listen('personSoundSelector', Mojo.Event.propertyChanged, this.personSoundHandler.bindAsEventListener(this));
    this.controller.listen('personTonePathRow', Mojo.Event.tap, this.personTonePathTapHandler.bindAsEventListener(this));
    this.controller.listen('personVibrateToggle', Mojo.Event.propertyChanged, this.personVibrateHandler.bindAsEventListener(this));
    this.controller.listen('personBannerToggle', Mojo.Event.propertyChanged, this.personBannerHandler.bindAsEventListener(this));
    this.controller.listen('personBlinkToggle', Mojo.Event.propertyChanged, this.personBlinkHandler.bindAsEventListener(this));
    this.controller.listen('groupSoundSelector', Mojo.Event.propertyChanged, this.groupSoundHandler.bindAsEventListener(this));
    this.controller.listen('groupTonePathRow', Mojo.Event.tap, this.groupTonePathTapHandler.bindAsEventListener(this));
    this.controller.listen('groupVibrateToggle', Mojo.Event.propertyChanged, this.groupVibrateHandler.bindAsEventListener(this));
    this.controller.listen('groupBannerToggle', Mojo.Event.propertyChanged, this.groupBannerHandler.bindAsEventListener(this));
    this.controller.listen('groupBlinkToggle', Mojo.Event.propertyChanged, this.groupBlinkHandler.bindAsEventListener(this));
    this.controller.listen('bgTimeoutSelector', Mojo.Event.propertyChanged, this.bgTimeoutHandler.bindAsEventListener(this));
    this.controller.listen('chatTextSize', Mojo.Event.propertyChanged, this.chatTextSizeHandler.bindAsEventListener(this));
    this.controller.listen('imageSize', Mojo.Event.propertyChanged, this.imageSizeHandler.bindAsEventListener(this));
    this.controller.listen('phoneType', Mojo.Event.propertyChanged, this.phoneTypeHandler.bindAsEventListener(this));
	this.controller.listen('bubbleclassSelector', Mojo.Event.propertyChanged, this.bubbleclassHandler.bindAsEventListener(this));	
    this.controller.listen('backimageSelector', Mojo.Event.propertyChanged, this.backimageHandler.bindAsEventListener(this));
    this.controller.listen('backimagePathRow', Mojo.Event.tap, this.backimagePathTapHandler.bindAsEventListener(this));
}

PrefsAssistant.prototype.setPicture = function(){
    var imgSize = '80:80';
    if (_appAssistant.isPre3()) 
        imgSize = '120:120';
    
    if (_appData.cookieData.mypicture != "") {
        this.controller.get('profileImage').update('<div class="profile-image picture" style="background-image:url(/var/luna/data/extractfs' + encodeURIComponent(_appData.cookieData.mypicture) + ':0:0:' + imgSize + ':3)"></div>');
    }
    else {
        this.controller.get('profileImage').update('<div class="profile-image person-icon"></div>');
    }
}

PrefsAssistant.prototype.updatePicture = function(path){
    if (path != "error") {
        this.setPicture();
    }
    
    this.modelSpinner.spinning = false;
    this.controller.modelChanged(this.modelSpinner);
    this.controller.get("spinnerId").hide();
}

PrefsAssistant.prototype.profileImageHandler = function(event){
    Event.stop(event);
    var items = [];
    items.push({
        label: $L("Change"),
        command: "change"
    });
    
    if (_appData.cookieData.mypicture != "") {
        items.push({
            label: $L("View"),
            command: "view"
        });
        items.push({
            label: $L("Delete"),
            command: "delete"
        });
    }
    
    this.controller.popupSubmenu({
        onChoose: this.popupImageHandler,
        placeNear: this.controller.get("profileImage"),
        items: items
    });
}

PrefsAssistant.prototype.popupImageHandler = function(command){
    switch (command) {
        case 'change':
            var params = {
                kind: "image",
                actionName: $L("Send"),
                extensions: ["jpg"],
                crop: {
                    width: 320,
                    height: 320
                },
                onSelect: function(file){
                    this.modelSpinner.spinning = true;
                    this.controller.modelChanged(this.modelSpinner);
                    this.controller.get("spinnerId").show();
                    _mojowhatsupPlugin.safePluginCall(function(){
                        var cropInfo = {
                            size: 480,
                            scale: file.cropInfo.window.scale * 1.5,
                            x: Math.floor(file.cropInfo.window.suggestedXTop * file.cropInfo.window.scale * 1.5),
                            y: Math.floor(file.cropInfo.window.suggestedYTop * file.cropInfo.window.scale * 1.5)
                        };
                        _plugin.sendSetPicture(_myJid, file.fullPath, JSON.stringify(cropInfo));
                    }
.bind(this));
                }
.bind(this)
            };
            Mojo.FilePicker.pickFile(params, this.controller.stageController);
            break;
        case 'view':
            this.controller.stageController.pushScene("imageview", {
                path: _appData.cookieData.mypicture
            });
            break;
        case 'delete':
            this.modelSpinner.spinning = true;
            this.controller.modelChanged(this.modelSpinner);
            this.controller.get("spinnerId").show();
            
            _mojowhatsupPlugin.safePluginCall(function(){
                _plugin.sendSetPicture(_myJid, "", "");
            }
.bind(this));
            break;
    }
}

PrefsAssistant.prototype.languageHandler = function(event){
    _appPrefs.put("language", event.value);
    try {
        Mojo.Locale.set(_appPrefs.cookieData.language);
    } 
    catch (e) {
        Mojo.Log.error("Error " + Object.toJSON(e));
    }
    _appAssistant.controller.getActiveStageController().activeScene().showAlertDialog({
        title: $L("Notification"),
        message: $L("It is necessary to restart the application so that this change can take effect"),
        choices: [{
            label: $L('Close application'),
            value: "close",
            type: 'affirmative'
        }],
        preventCancel: true,
        onChoose: function(value){
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

PrefsAssistant.prototype.phoneTypeHandler = function(event){
    _appPrefs.put("phoneTypes", String(event.value));
}

PrefsAssistant.prototype.imageSizeHandler = function(event){
    _appPrefs.put("imageResolution", Number(event.value));
}

PrefsAssistant.prototype.chatTextSizeHandler = function(event){
    _appPrefs.put("chatTextSize", Number(event.value));
}

PrefsAssistant.prototype.deactivate = function(event){
    if (_openChatAssistant != null) {
        _openChatAssistant.refreshList();
    }
}

PrefsAssistant.prototype.personTonePathTapHandler = function(event){
    Mojo.FilePicker.pickFile({
        onSelect: this.personTonePathSelectionHandler.bind(this),
        kinds: ["ringtone"],
        defaultKind: "ringtone",
        actionType: "open",
        filePath: _appPrefs.cookieData.personTonePath
    }, this.controller.stageController);
}

PrefsAssistant.prototype.groupTonePathTapHandler = function(event){
    Mojo.FilePicker.pickFile({
        onSelect: this.groupTonePathSelectionHandler.bind(this),
        kinds: ["ringtone"],
        defaultKind: "ringtone",
        actionType: "open",
        filePath: _appPrefs.cookieData.groupTonePath
    }, this.controller.stageController);
}

PrefsAssistant.prototype.personTonePathSelectionHandler = function(selection){
    _appPrefs.put('personTonePath', selection.fullPath);
    _appPrefs.put('personToneName', selection.name);
    this.controller.get("personTonePath").update(selection.name);
}

PrefsAssistant.prototype.groupTonePathSelectionHandler = function(selection){
    _appPrefs.put('groupTonePath', selection.fullPath);
    _appPrefs.put('groupToneName', selection.name);
    this.controller.get("groupTonePath").update(selection.name);
}

PrefsAssistant.prototype.handleCommand = function(event){
    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case 'goBack':
                this.controller.stageController.popScene();
                break;
        }
    }
}

PrefsAssistant.prototype.bgTimeoutHandler = function(event){
    _appPrefs.put("backgroundTimeout", event.value);
}

PrefsAssistant.prototype.personSoundHandler = function(event){
    _appPrefs.put('personSound', event.value);
    if (event.value == "custom") {
        this.controller.get('personTonePathRow').show();
    }
    else {
        this.controller.get('personTonePathRow').hide();
    }
}

PrefsAssistant.prototype.personVibrateHandler = function(event){
    _appPrefs.put('personVibrate', event.value);
}

PrefsAssistant.prototype.personBannerHandler = function(event){
    _appPrefs.put('personBanner', event.value);
}

PrefsAssistant.prototype.personBlinkHandler = function(event){
    _appPrefs.put('personBlink', event.value);
}

PrefsAssistant.prototype.groupSoundHandler = function(event){
    _appPrefs.put('groupSound', event.value);
    if (event.value == "custom") {
        this.controller.get('groupTonePathRow').show();
    }
    else {
        this.controller.get('groupTonePathRow').hide();
    }
}

PrefsAssistant.prototype.bubbleclassHandler = function(event){
    _appPrefs.put('bubbleclass', event.value);
}

PrefsAssistant.prototype.backimageHandler = function(event){
    _appPrefs.put('backimageType', event.value);
    if (event.value == "custom") {
		this.controller.get('backimagePath').update("");		
        this.controller.get('backimagePathRow').show();
    }
    else {
        this.controller.get('backimagePathRow').hide();
    }
}

PrefsAssistant.prototype.backimagePathTapHandler = function(event){
    var params = {
		kind: "image",
		actionName: $L("Select"),
		extensions: ["jpg"],
		onSelect: function(file){
			Mojo.Log.info("Selected image %j", file);
			_appPrefs.put('backimagePath', file.fullPath);
			this.controller.get('backimagePath').update(file.fullPath);			
		}.bind(this)
	}
    Mojo.FilePicker.pickFile(params, this.controller.stageController);
}

PrefsAssistant.prototype.groupVibrateHandler = function(event){
    _appPrefs.put('groupVibrate', event.value);
}

PrefsAssistant.prototype.groupBannerHandler = function(event){
    _appPrefs.put('groupBanner', event.value);
}

PrefsAssistant.prototype.groupBlinkHandler = function(event){
    _appPrefs.put('groupBlink', event.value);
}

PrefsAssistant.prototype.cleanup = function(){
    _prefsAssistant = null;
    
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
    this.controller.stopListening("profileImage", Mojo.Event.tap, this.profileImageHandler);
	this.controller.stopListening('bubbleclassSelector', Mojo.Event.propertyChanged, this.bubbleclassHandler);	
    this.controller.stopListening('backimageSelector', Mojo.Event.propertyChanged, this.backimageHandler);
    this.controller.stopListening('backimagePathRow', Mojo.Event.tap, this.backimagePathTapHandler);
    
}
