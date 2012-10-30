var _userAgent = "WhatsApp/2.8.0 WP7/7.50 Device/Nokia-Lumia_900-1.0";

function AccountAssistant() {
	this.login = false;
	/* this is the creator function for your scene assistant object. It will be passed all the
	 additional parameters (after the scene name) that were passed to pushScene. The reference
	 to the scene controller (this.controller) has not be established yet, so any initialization
	 that needs the scene controller should be done in the setup function below. */

}

AccountAssistant.prototype.setup = function() {
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
	
	this.controller.setupWidget(Mojo.Menu.appMenu, this.attributesAppMenu = {
        omitDefaultItems: true
    }, this.appMenuModel = {
        visible: true,
        items : [
            Mojo.Menu.editItem,
            {label: $L("Help"), command: Mojo.Menu.helpCmd},
            {label: $L("Exit"), command: "exit"}
        ]
    });
	

	var cc = "";
	var pn = "";
	var pushN = "";
	var passw = "";
	var smsCode = "";

	var appdata = _appData.get();
	if (appdata) {
		cc = appdata.cc;
		pn = appdata.phoneNumber;
		smsCode = appdata.smsCode;
		pushN = appdata.pushName;
		passw = appdata.password;
	}

	this.controller.get("headerTitle").update($L("Account settings"));
	this.controller.get("ccLabel").update($L("CC"));
	this.controller.get("mobilePhoneLabel").update($L("Mobile Phone"));
	this.controller.get("pushNameLabel").update($L("Push name"));
	this.controller.get("passwordLabel").update($L("Password"));
	this.controller.get("smsCodeLabel").update($L("SMS code"));

	this.controller.setupWidget("textFieldCC", this.attributes = {
		hintText : $L("Country code"),
		autofocus : true,
		autoReplace : false,
		modifierState : Mojo.Widget.NumLock,
		maxLength : 3,
		charsAllow : this.onlyNum.bind(this)
	}, this.model = {
		value : cc
	});

	this.controller.setupWidget("textFieldPN", this.attributes = {
		hintText : $L("Phone number"),
		autofocus : true,
		autoReplace : false,
		modifierState : Mojo.Widget.NumLock,
		charsAllow : this.onlyNum.bind(this)
	}, this.model = {
		value : pn
	});

	this.controller.setupWidget("textFieldCode", this.attributes = {
		hintText : $L("Code number"),
		autofocus : true,
		autoReplace : false,
		modifierState : Mojo.Widget.NumLock,
		charsAllow : this.onlyNum.bind(this)
	}, this.model = {
		value : smsCode
	});

	this.controller.setupWidget("textFieldPushN", this.attributes = {
		hintText : $L("Push name"),
		autofocus : true,
		autoReplace : false
	}, this.model = {
		value : pushN
	});

	this.controller.setupWidget("textFieldPW", this.attributes = {
		hintText : $L("Password"),
		autofocus : true,
		autoReplace : false
	}, this.model = {
		value : passw,
		disabled : false
	});

	this.controller.setupWidget("codeButton", this.attributes = {
		label : $L("Get SMS code"),
		type : Mojo.Widget.activityButton
	}, this.modelCodeButton = {
		value : "",
		disabled : false
	});

	this.controller.setupWidget("registerButton", this.attributes = {
		label : $L("Register"),
		type : Mojo.Widget.activityButton
	}, this.modelRegisterButton = {
		value : "",
		disabled : false
	});

	this.controller.setupWidget("loginButton", this.attributes = {
		label : $L("Login"),
		type : Mojo.Widget.activityButton
	}, this.modelLoginButton = {
		value : "",
		disabled : false
	});

	/* add event handlers to listen to events from widgets */
	this.controller.listen('codeButton', Mojo.Event.tap, this.doCodeButton.bindAsEventListener(this));
	this.controller.listen('registerButton', Mojo.Event.tap, this.doRegisterButton.bindAsEventListener(this));
	this.controller.listen('loginButton', Mojo.Event.tap, this.doLoginButton.bindAsEventListener(this));
};

AccountAssistant.prototype.handleCommand = function(event) {
	if (event.type == Mojo.Event.command) {
		switch(event.command) {
			case 'goBack':
			this.controller.stageController.popScene();
			break;
            case Mojo.Menu.helpCmd:
                this.controller.stageController.pushScene("help");
                break;
            case "exit":
                _exitApp = true;
                Mojo.Controller.getAppController().closeStage(_mainStage);
                break;
		}
	}
}

AccountAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	 example, key handlers that are observing the document */
};

AccountAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	 this scene is popped or another scene is pushed on top */
};

AccountAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as
	 a result of being popped off the scene stack */
};

AccountAssistant.prototype.checkForm = function(action) {
	var window = this.controller.stageController.activeScene().window;

	var cc = this.controller.get('textFieldCC').mojo.getValue();
	var phone = this.controller.get('textFieldPN').mojo.getValue();
	var password = this.controller.get('textFieldPW').mojo.getValue();
	var smsCode = this.controller.get('textFieldCode').mojo.getValue();
	var pushName = this.controller.get('textFieldPushN').mojo.getValue();

	cc = cc.replace(/^0+/g,"");
	phone = phone.replace(/^0+/g, "");
	
	this.controller.get('textFieldCC').mojo.setValue(cc);
	this.controller.get('textFieldPN').mojo.setValue(phone);


	if (action == "code" || action == "register" || action == "login") {
		if (cc == "") {
			Mojo.Controller.errorDialog($L("Please insert a country code"), window);
			this.controller.get('textFieldCC').mojo.blur();
			return null;
		}

		if (phone == "") {
			Mojo.Controller.errorDialog($L("Please insert a phone number"), window);
			this.controller.get('textFieldPN').mojo.blur();
			return null;
		}
	}

	if (action == "register") {
		if (smsCode == "") {
			Mojo.Controller.errorDialog($L("Please insert a SMS code"), window);
			this.controller.get('textFieldCode').mojo.blur();
			return null;
		}
	}

	if (action == "login") {
		if (pushName == "") {
			Mojo.Controller.errorDialog($L("Please insert push name"), window);
			this.controller.get('textFieldPushN').mojo.blur();
			return null;
		}
	}

	if (action == "register" || action == "login") {
		if (password == "") {
			Mojo.Controller.errorDialog($L("Please insert a password"), window);
			this.controller.get('textFieldPW').mojo.blur();
			return null;
		}
	}

	var data = {
		cc : cc,
		phoneNumber : phone,
		pushName : pushName,
		password : password,
		userId : cc + phone,
		smsCode : smsCode,
		registered : _appData.get().registered
	};

	return data;
}

AccountAssistant.prototype.doCodeButton = function(event) {
	this.controller.get('codeButton').mojo.deactivate()
	var data = this.checkForm("code");
	if (data == null)
		return;

	var window = this.controller.stageController.activeScene().window;

	this.controller.get('codeButton').mojo.activate();
	this.enableButtons(false);

	if (_mojowhatsupPlugin.isReady) {
		_mojowhatsupPlugin.accountRequestResponse = false;
		_mojowhatsupPlugin.safePluginCall(function() {
			_plugin.sendCodeRequest(data.cc, data.phoneNumber, "sms");
		});
		this.waitAccountResponse(data, "code");
	} else {
		Mojo.Controller.errorDialog($L("Network connection not availabe yet"), window);
		this.controller.get('codeButton').mojo.deactivate();
		this.enableButtons(true);
	}
}

AccountAssistant.prototype.doRegisterButton = function(event) {
	this.controller.get('registerButton').mojo.deactivate()
	var data = this.checkForm("register");
	if (data == null)
		return;

	var window = this.controller.stageController.activeScene().window;
	this.controller.get('registerButton').mojo.activate();
	this.enableButtons(false);

	if (_mojowhatsupPlugin.isReady) {
		_mojowhatsupPlugin.accountRequestResponse = false;
		_mojowhatsupPlugin.safePluginCall(function() {
			_plugin.sendRegisterRequest(data.cc, data.phoneNumber, data.password, data.smsCode);
		});
		this.waitAccountResponse(data, "register");
	} else {
		Mojo.Controller.errorDialog($L("Network connection not availabe yet"), window);
		this.controller.get('registerButton').mojo.deactivate();
		this.enableButtons(true);
	}
}

AccountAssistant.prototype.doLoginButton = function(event) {
	this.controller.get('loginButton').mojo.deactivate()
	var data = this.checkForm("login");
	if (data == null)
		return;

	this.controller.get('loginButton').mojo.activate();
	this.enableButtons(false);

	if (_mojowhatsupPlugin.isReady) {
		_mojowhatsupPlugin.loginResult = false;
		_mojowhatsupPlugin.safePluginCall(function() {
			_plugin.testLogin(data.userId, data.password, data.pushName);
		});
		this.waitLoginResult(data);
	} else {
		var window = this.controller.stageController.activeScene().window;		
		Mojo.Controller.errorDialog($L("Network connection not availabe yet"), window);
		this.controller.get('loginButton').mojo.deactivate();
		this.enableButtons(true);
	}
}

AccountAssistant.prototype.waitLoginResult = function(data) {
	if (!_mojowhatsupPlugin.loginResult) {
		setTimeout(this.waitLoginResult.bind(this, data), 3000);
	} else {
		if (_mojowhatsupPlugin.loginResult == "true") {
			Mojo.Log.info("%j", data);
			data.registered = true;
			_appData.put(data);
			this.login = true;
			if (_mainAssistant == null)
				this.controller.stageController.swapScene("main");
			else {
				this.controller.stageController.popScenesTo("main");
				_mainAssistant.restart();
			}

		} else {
			var window = this.controller.stageController.activeScene().window;
			Mojo.Controller.errorDialog($L("Login failed"), window);
		}

		this.controller.get('loginButton').mojo.deactivate();
		this.enableButtons(true);
	}
}

AccountAssistant.prototype.waitAccountResponse = function(data, type) {
	if (!_mojowhatsupPlugin.accountRequestResponse) {
		setTimeout(this.waitAccountResponse.bind(this, data, type), 3000);
	} else {
		var window = this.controller.stageController.activeScene().window;

		if (_mojowhatsupPlugin.accountRequestResponse == "error") {
			Mojo.Controller.errorDialog($L("Request failed"), window);
		} else {
			var response = _mojowhatsupPlugin.accountRequestResponse;
			var msg = "";
			var parser = new DOMParser();
			var xmlObject = parser.parseFromString(response, "text/xml");
			var status = "";
			var result = "";
			var login = "";

			if (type == "code") {
				var node = document.evaluate("/code/response", xmlObject, null, XPathResult.ANY_TYPE, null).iterateNext();
				if (node) {
					for (var i = 0; i < node.attributes.length; i++) {
						if (node.attributes[i].nodeName == "status")
							status = node.attributes[i].nodeValue;
						else if (node.attributes[i].nodeName == "result") {
							result = node.attributes[i].nodeValue;
						}
					}
					msg = "status = " + status + "\nresult = " + result;
				}
			} else if (type == "register") {
				var node = document.evaluate("/register/response", xmlObject, null, XPathResult.ANY_TYPE, null).iterateNext();
				if (node) {
					for (var i = 0; i < node.attributes.length; i++) {
						if (node.attributes[i].nodeName == "status")
							status = node.attributes[i].nodeValue;
						else if (node.attributes[i].nodeName == "result")
							result = node.attributes[i].nodeValue;
						else if (node.attributes[i].nodeName == "login")
							login = node.attributes[i].nodeValue;
					}
					msg = $L("login") + " = " + login + "\n" + $L("status") + " = " + status + "\n" + $L("result") + " = " + result;
				}
			}
			delete parser;
			_appData.put(data);
			this.controller.showAlertDialog({
				title : $L("Request Result"),
				message : msg,
				choices : [{
					label : $L("Close"),
					type : "dismiss"
				}]
			});
		}

		if (type == "code")
			this.controller.get('codeButton').mojo.deactivate();
		else if (type == "register")
			this.controller.get('registerButton').mojo.deactivate();

		this.enableButtons(true);
	}
}

AccountAssistant.prototype.onlyNum = function(charCode) {
	if (charCode == 46 || (charCode > 47 && charCode < 58))
		return true;
	return false;
}

AccountAssistant.prototype.enableButtons = function(bool) {
	this.modelCodeButton.disabled = !bool;
	this.modelRegisterButton.disabled = !bool;
	this.modelLoginButton.disabled = !bool;

	this.controller.modelChanged(this.modelCodeButton);
	this.controller.modelChanged(this.modelRegisterButton);
	this.controller.modelChanged(this.modelLoginButton);
}

AccountAssistant.prototype.cleanup = function(event) {
	this.controller.stopListening('codeButton', Mojo.Event.tap, this.doCodeButton);
	this.controller.stopListening('registerButton', Mojo.Event.tap, this.doRegisterButton);
	this.controller.stopListening('loginButton', Mojo.Event.tap, this.doLoginButton);

	if (!this.login && this.controller.stageController.getScenes().length == 0) {
		_mojowhatsupPlugin.safePluginCall(function() {
			_plugin.exitPlugin();
		});
	}
}
