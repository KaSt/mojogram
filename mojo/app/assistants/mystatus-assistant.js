function MystatusAssistant() {
    this.statusChoices = [{
        label : $L("Available"),
        value : $L("Available")
    }, {
        label : $L("Busy"),
        value : $L("Busy")
    }, {
        label : $L("At school"),
        value : $L("At school")
    }, {
        label : $L("At the movies"),
        value : $L("At the movies")
    }, {
        label : $L("At work"),
        value : $L("At work")
    }, {
        label : $L("Battery about to die"),
        value : $L("Battery about to die")
    }, {
        label : $L("In a meeting"),
        value : $L("In a meeting")
    }, {
        label : $L("At the gym"),
        value : $L("At the gym")
    }, {
        label : $L("Sleeping"),
        value : $L("Sleeping")
    }, {
        label : $L("Custom"),
        value : "_custom_"
    }];

}

MystatusAssistant.prototype.setup = function() {
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
    this.controller.get('headerTitle').update($L("My status"));
    this.controller.get('statusListTitle').update($L("Select your status"));
    
    this.currentStatus = null;
    for (var i = 0; i < this.statusChoices.length; i++) {
        if (this.statusChoices[i].value == _appData.cookieData.statusMessage) {
            this.currentStatus = _appData.cookieData.statusMessage;
            break;
        }
    }
    if (this.currentStatus == null)
        this.currentStatus = "_custom_";

    if (this.currentStatus == "_custom_")
        this.controller.get("customStatus").show();
    else
        this.controller.get("customStatus").hide();

    this.controller.setupWidget("defaultStatusList", {
        label : $L("status"),
        choices : this.statusChoices,
        modelProperty : "status",
        multiline : "true"
    }, {
        status : this.currentStatus
    });

    this.controller.listen('defaultStatusList', Mojo.Event.propertyChanged, this.tapDefaultListHandler.bindAsEventListener(this));

    this.setCurrentStatusTitle(_appData.cookieData.statusMessage);
    this.controller.setupWidget('textFieldStatus', this.attributesTF = {
        hintText : $L("Write here your status") + " ...",
        autofocus : true,
        multiline : false,
        modifierState : Mojo.Widget.shiftSingle,
        enterSubmits : true,
        focusMode : Mojo.Widget.focusAppendMode,
        maxLength : _appData.cookieData.maxStatus,
        changeOnKeyPress : true
    }, this.modelTF = {
        value : _appData.cookieData.statusMessage
    });
    this.controller.listen('textFieldStatus', Mojo.Event.propertyChanged, this.statusChangedHandler.bindAsEventListener(this));
    this.controller.listen('emojiButton', Mojo.Event.tap, this.emojiButtonHandler.bindAsEventListener(this));

    this.controller.setupWidget("saveChangesButton", {
        label : $L("Send changes")
    }, {
        value : "",
        buttonClass : "affirmative",
        disabled : false
    });
    this.controller.listen('saveChangesButton', Mojo.Event.tap, this.saveChangesHandler.bindAsEventListener(this));
}

MystatusAssistant.prototype.saveChangesHandler = function(event) {
    var status = this.currentStatus;
    Mojo.Log.error("status current %s", status);
    this.controller.get('error_message').hide();

    if (status == "_custom_") {
        status = this.controller.get("textFieldStatus").mojo.getValue();
        status = status.replace(/^\s+/g, "").replace(/\s+$/g, "");
        Mojo.Log.error("status current %s", status);
        if (status == "") {
            this.controller.get('errorMessageText').update($L("Empty status. Please enter your status."));
            this.controller.get('error_message').show();
            this.controller.get("textFieldStatus").mojo.focus();            
            return;
        }
    }
    try {
        _plugin.sendStatusUpdate(status);
        _appData.put("statusMessage", status);
         this.controller.stageController.popScene("updateStatus");
    } catch (ex) {
        Mojo.Log.error("error status %j", ex);
        this.controller.get('errorMessageText').update($L("Status cannot be changed. Try again."));
        this.controller.get('error_message').show();
    }
}

MystatusAssistant.prototype.tapDefaultListHandler = function(event) {
    this.currentStatus = event.value;
    this.controller.get('error_message').hide();

    if (event.value == "_custom_") {
        this.controller.get("customStatus").show();
        this.controller.get("textFieldStatus").mojo.setValue(_appData.cookieData.statusMessage);
        this.controller.get("textFieldStatus").mojo.focus();
    } else {
        this.controller.get("customStatus").hide();
    }
}

MystatusAssistant.prototype.activate = function(param) {
    if (param && "selectedEmoji" in param) {
        if (param.selectedEmoji != null) {
            var text = this.controller.get('textFieldStatus').mojo.getValue();
            this.controller.get('textFieldStatus').mojo.setValue(text + convertUnicodeCodePointsToString(['0x' + param.selectedEmoji]));
        }
        this.controller.get('textFieldStatus').mojo.focus();
    }
}

MystatusAssistant.prototype.statusChangedHandler = function(event) {
    var text = this.controller.get('textFieldStatus').mojo.getValue();
    this.setCurrentStatusTitle(text);
}

MystatusAssistant.prototype.setCurrentStatusTitle = function(subject) {
    var left = (_appData.cookieData.maxStatus - subject.length);
    this.controller.get('currentStatusTitle').update($L("Your current status") + " (" + $L("#{left} remaining").interpolate({
        left : left
    }) + ")");
}

MystatusAssistant.prototype.emojiButtonHandler = function(event) {
    var text = this.controller.get('textFieldStatus').mojo.getValue();
    if (text.length < _appData.cookieData.maxStatus)
        this.controller.stageController.pushScene("emoji-dialog");
    else {
        Event.stop(event);
        this.controller.get('textFieldStatus').mojo.focus();
    }
}

MystatusAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        switch(event.command) {
            case 'goBack':
                this.controller.stageController.popScene();
                break;
        }
    }
}

MystatusAssistant.prototype.cleanup = function() {
    this.controller.stopListening('textFieldStatus', Mojo.Event.propertyChanged, this.statusChangedHandler);
    this.controller.stopListening('emojiButton', Mojo.Event.tap, this.emojiButtonHandler);
    this.controller.stopListening('saveChangesButton', Mojo.Event.tap, this.saveChangesHandler);
    this.controller.stopListening('defaultStatusList', Mojo.Event.propertyChanged, this.tapDefaultListHandler);
}