function AccountAssistant() {
	this.purchaseUrl = "http://www.whatsapp.com/payments/cksum_pay.php?";
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
		omitDefaultItems : true
	}, this.appMenuModel = {
		visible : true,
		items : [Mojo.Menu.editItem, {
			label : $L("Help"),
			command : Mojo.Menu.helpCmd
		}, {
			label : $L("Exit"),
			command : "exit"
		}]
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
	// this.controller.get("passwordLabel").update($L("Password"));
	this.controller.get("smsCodeLabel").update($L("Code"));

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

	// this.controller.setupWidget("textFieldPW", this.attributes = {
		// hintText : $L("Password"),
		// autofocus : true,
		// autoReplace : false
	// }, this.model = {
		// value : passw,
		// disabled : false
	// });

	this.controller.setupWidget("codeButton", this.attributes = {
		label : $L("Get SMS code"),
		type : Mojo.Widget.activityButton
	}, this.modelCodeButton = {
		value : "",
		disabled : false
	});

	this.controller.setupWidget("codeButtonVoice", this.attributes = {
		label : $L("Get voice code"),
		type : Mojo.Widget.activityButton
	}, this.modelCodeButtonVoice = {
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


	this.controller.setupWidget("deleteAccountButton", this.attributes = {
		label : $L("Delete account"),
		type : Mojo.Widget.activityButton
	}, this.modelDeleteButton = {
		value : "",
		disabled : false
	});
	
	this.controller.setupWidget("purchaseAccountButton", this.attributes = {
		label : $L("Purchase subscription"),
		type : Mojo.Widget.activityButton
	}, this.modelPurchase = {
		value : "",
		disabled : false
	});

	if (!_appData.isRegistered()) {
		this.controller.get("subscriptiongroup").hide();
	} else {
		var expire_date = _plugin.getExpirationDate();
		if (expire_date != "")
			expire_date = Mojo.Format.formatDate(new Date(expire_date * 1000), 'short');
		this.controller.get("expirationinfo").update($L("Account expiration date") + ": " + expire_date);
	}

	
	/* add event handlers to listen to events from widgets */
	this.controller.listen('codeButton', Mojo.Event.tap, this.doCodeButton.bindAsEventListener(this));
	this.controller.listen('codeButtonVoice', Mojo.Event.tap, this.doCodeButtonVoice.bindAsEventListener(this));
	this.controller.listen('registerButton', Mojo.Event.tap, this.doRegisterButton.bindAsEventListener(this));
	this.controller.listen('loginButton', Mojo.Event.tap, this.doLoginButton.bindAsEventListener(this));
	this.controller.listen('deleteAccountButton', Mojo.Event.tap, this.doDeleteAccountButton.bindAsEventListener(this));
	this.controller.listen('purchaseAccountButton', Mojo.Event.tap, this.doPurchaseButton.bindAsEventListener(this));
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
	// var password = this.controller.get('textFieldPW').mojo.getValue();
	var smsCode = this.controller.get('textFieldCode').mojo.getValue();
	var pushName = this.controller.get('textFieldPushN').mojo.getValue();

	cc = cc.replace(/^0+/g, "");
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

	// if (action == "register" || action == "login") {
		// if (password == "") {
			// Mojo.Controller.errorDialog($L("Please insert a password"), window);
			// this.controller.get('textFieldPW').mojo.blur();
			// return null;
		// }
	// }

	var data = {
		cc : cc,
		phoneNumber : phone,
		pushName : pushName,
		password : _appData.get().password,
		passwordV2: _appData.get().passwordV2,
		userId : cc + phone,
		smsCode : smsCode,
		registered : _appData.get().registered
	};

	return data;
}

AccountAssistant.prototype.doCodeButton = function(event) {
	this.doGetCode("sms");
}

AccountAssistant.prototype.doCodeButtonVoice = function(event) {
	this.doGetCode("voice");
}

AccountAssistant.prototype.doDeleteAccountButton = function(event) {
	this.controller.showAlertDialog({
		onChoose: function(value) {
			if (value == "yes") {
				this.enableButtons(false);
				var window = this.controller.stageController.activeScene().window;
				if (_mojowhatsupPlugin.isReady) {
					_mojowhatsupPlugin.deleteAccountResult = "false";
					try {
						_plugin.sendDeleteAccount();
						this.waitDeleteResponse();
						return;
					} catch (e) {
						Mojo.Controller.errorDialog($L("Account can not be deleted"), window);
					}
				} else {
					Mojo.Controller.errorDialog($L("Network connection not availabe yet"), window);
				}
			} 
			this.controller.get('deleteAccountButton').mojo.deactivate();
			this.enableButtons(true);
		}.bind(this),
		title: $L("Confirm"),
		message: $L("Deleting your account will:\n - Delete your Whatsapp account\n - Erase your message history.\n - Delete you from groups.\nContinue?"),
		choices: [
			{label: $L("Yes"), value:"yes", type:"affirmative"},
			{label: $L("No"), value:"no", type:"negative"},
		]
	});		
}

AccountAssistant.prototype.doPurchaseButton = function(event) {
	var userId = _appData.cookieData.userId;
	var chkSum = _plugin.md5String(userId + "abc");
	

	this.controller.stageController.activeScene().serviceRequest('palm://com.palm.applicationManager', {
		method : 'open',
		parameters : {
			target : this.purchaseUrl + "phone=" + userId + "&cksum=" + chkSum
		},
		onFailure : function(r) {
			Mojo.Log.error("Error calling applicationManager:open: %j", r);
		}
	});
	
	this.controller.get('purchaseAccountButton').mojo.deactivate(); 
}


AccountAssistant.prototype.doGetCode = function(method) {
	if (method == "sms")
		this.controller.get('codeButton').mojo.deactivate();
	else
		this.controller.get('codeButtonVoice').mojo.deactivate();

	var data = this.checkForm("code");
	if (data == null)
		return;

	var window = this.controller.stageController.activeScene().window;

	if (method == "sms")
		this.controller.get('codeButton').mojo.activate();
	else
		this.controller.get('codeButtonVoice').mojo.activate();
	this.enableButtons(false);

	if (_mojowhatsupPlugin.isReady) {
		_mojowhatsupPlugin.accountRequestResponse = false;
        this.controller.serviceRequest('palm://com.palm.preferences/systemProperties', {
            method : "Get",
            parameters : {
                "key" : "com.palm.properties.nduid"
            },
            onSuccess : function(response) {
                var idx = response['com.palm.properties.nduid'];
                _mojowhatsupPlugin.safePluginCall(function() {
                    _plugin.sendCodeRequest(data.cc, data.phoneNumber, idx, method);
                });
                this.waitAccountResponse(data, "code", method);
            }.bind(this)
          });
	} else {
		Mojo.Controller.errorDialog($L("Network connection not availabe yet"), window);
		if (method == "sms")
			this.controller.get('codeButton').mojo.deactivate();
		else
			this.controller.get('codeButtonVoice').mojo.deactivate();
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
        this.controller.serviceRequest('palm://com.palm.preferences/systemProperties', {
            method : "Get",
            parameters : {
                "key" : "com.palm.properties.nduid"
            },
            onSuccess : function(response) {
                var idx = response['com.palm.properties.nduid'];
                _mojowhatsupPlugin.safePluginCall(function() {
                    _plugin.sendRegisterRequest(data.cc, data.phoneNumber, idx, data.smsCode);
                });                
                this.waitAccountResponse(data, "register");
            }.bind(this)
          });		
	} else {
		Mojo.Controller.errorDialog($L("Network connection not availabe yet"), window);
		this.controller.get('registerButton').mojo.deactivate();
		this.enableButtons(true);
	}
}

AccountAssistant.prototype.doLoginButton = function(event) {
	this.controller.get('loginButton').mojo.deactivate();
	var data = this.checkForm("login");
	if (data == null)
		return;
		
	this.controller.showDialog({
    	template: 'account/password-dialog',
		assistant: new PasswordDialogAssistant(this, function(password) {
			data.password = password;
			this.controller.get('loginButton').mojo.activate();			
			this.enableButtons(false);
			if (_mojowhatsupPlugin.isReady) {
				_mojowhatsupPlugin.loginResult = false;
			
				_mojowhatsupPlugin.safePluginCall(function() {
					if (!_appData.cookieData.passwordV2) {
						data.password = _plugin.processPassword(data.password);
						data.passwordV2 = true;
					}
					_plugin.testLogin(data.userId, data.password, data.pushName);
				});
				this.waitLoginResult(data);
			} else {
				var window = this.controller.stageController.activeScene().window;
				Mojo.Controller.errorDialog($L("Network connection not availabe yet"), window);
				this.controller.get('loginButton').mojo.deactivate();
				this.enableButtons(true);
			}
		}.bind(this))
	});
}

AccountAssistant.prototype.waitDeleteResponse = function() {
	if (!_mojowhatsupPlugin.deleteAccountResult) {
		setTimeout(this.waitDeleteResponse.bind(this), 3000);
	} else {
		if (_mojowhatsupPlugin.deleteAccountResult == "ok") {
			this.controller.showAlertDialog({
				onChoose : Mojo.doNothing,
				title : $L("Information"),
				message : $L("Account deleted successfully."),
				choices : [{
					label : $L("OK"),
					value : ""
				}],
				allowHTMLMessage : true
			});
			_appAssistant.resetApp();
		} else {
			var window = this.controller.stageController.activeScene().window;
			Mojo.Controller.errorDialog($L("Account can not be deleted"), window);
		}
		this.controller.get('deleteAccountButton').mojo.deactivate();
		this.enableButtons(true);		
	}
}

AccountAssistant.prototype.waitLoginResult = function(data) {
	if (!_mojowhatsupPlugin.loginResult) {
		setTimeout(this.waitLoginResult.bind(this, data), 3000);
	} else {
		if (_mojowhatsupPlugin.loginResult == "ok") {
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
			Mojo.Controller.errorDialog($L("Login failure") + ": error status = " + _mojowhatsupPlugin.loginResult, window);
		}

		this.controller.get('loginButton').mojo.deactivate();
		this.enableButtons(true);
	}
}


AccountAssistant.prototype.waitAccountResponse = function(data, type, method) {
	if (!_mojowhatsupPlugin.accountRequestResponse) {
		setTimeout(this.waitAccountResponse.bind(this, data, type, method), 3000);
	} else {
		var window = this.controller.stageController.activeScene().window;
		this.response = null;
		if (_mojowhatsupPlugin.accountRequestResponse == "error") {
			Mojo.Controller.errorDialog($L("Request failure"), window);
		} else {
			this.response = _mojowhatsupPlugin.accountRequestResponse;
			this.response = JSON.parse(this.response);
			var msg = "";
			// var parser = new DOMParser();
			// var xmlObject = parser.parseFromString(response, "text/xml");
			// var status = "";
			// var result = "";
			// var login = "";

			if (type == "code") {
				// var node = document.evaluate("/code/response", xmlObject, null, XPathResult.ANY_TYPE, null).iterateNext();
				// if (node) {
				// for (var i = 0; i < node.attributes.length; i++) {
				// if (node.attributes[i].nodeName == "status")
				// status = node.attributes[i].nodeValue;
				// else if (node.attributes[i].nodeName == "result") {
				// result = node.attributes[i].nodeValue;
				// }
				// }
				// msg = "status = " + status + "\nresult = " + result;
				// }
			} else if (type == "register") {
				// var node = document.evaluate("/register/response", xmlObject, null, XPathResult.ANY_TYPE, null).iterateNext();
				// if (node) {
				// for (var i = 0; i < node.attributes.length; i++) {
				// if (node.attributes[i].nodeName == "status")
				// status = node.attributes[i].nodeValue;
				// else if (node.attributes[i].nodeName == "result")
				// result = node.attributes[i].nodeValue;
				// else if (node.attributes[i].nodeName == "login")
				// login = node.attributes[i].nodeValue;
				// }
				// msg = $L("login") + " = " + login + "\n" + $L("status") + " = " + status + "\n" + $L("result") + " = " + result;
				// }
			}

			if (this.response.status != 'fail') {
				if (this.response.pw) {
					data.password = this.response["pw"];
					data.passwordV2 = true;
					data.registered = true;
				}
			}
			_appData.put(data);

			for (p in this.response) {
				msg += p + " = " + this.response[p] + "\n";

			}

			// delete parser;
			this.controller.showAlertDialog({
				title : $L("Request Result"),
				message : msg,
				choices : [{
					label : $L("Close"),
					type : "dismiss",
					value : "close"
				}],
				onChoose : function(value) {
					if ((this.response.status != 'fail') && (this.response.pw)) {
                        this.login = true;
						if (_mainAssistant == null)
							this.controller.stageController.swapScene("main");
						else {
							this.controller.stageController.popScenesTo("main");
							_mainAssistant.restart();
						}
					}
				}.bind(this)
			});
		}

		if (type == "code") {
			if (method == "sms")
				this.controller.get('codeButton').mojo.deactivate();
			else
				this.controller.get('codeButtonVoice').mojo.deactivate();
		} else if (type == "register")
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
	this.modelCodeButtonVoice.disabled = !bool;
	this.modelRegisterButton.disabled = !bool;
	this.modelLoginButton.disabled = !bool;
	this.modelDeleteButton.disabled = !bool;
	this.modelPurchase.disabled = !bool;

	this.controller.modelChanged(this.modelCodeButton);
	this.controller.modelChanged(this.modelCodeButtonVoice);
	this.controller.modelChanged(this.modelRegisterButton);
	this.controller.modelChanged(this.modelLoginButton);
	this.controller.modelChanged(this.modelDeleteButton);
	this.controller.modelChanged(this.modelPurchase);
}

AccountAssistant.prototype.cleanup = function(event) {
	this.controller.stopListening('codeButton', Mojo.Event.tap, this.doCodeButton);
	this.controller.stopListening('codeButtonVoice', Mojo.Event.tap, this.doCodeButtonVoice);
	this.controller.stopListening('registerButton', Mojo.Event.tap, this.doRegisterButton);
	this.controller.stopListening('loginButton', Mojo.Event.tap, this.doLoginButton);
	this.controller.stopListening('deleteAccountButton', Mojo.Event.tap, this.doDeleteAccountButton);
	this.controller.stopListening('purchaseAccountButton', Mojo.Event.tap, this.doPurchaseButton);	

	if (!this.login && this.controller.stageController.getScenes().length == 0) {
		_mojowhatsupPlugin.safePluginCall(function() {
			_plugin.exitPlugin();
		});
	}
}
