function LoginAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the
	 additional parameters (after the scene name) that were passed to pushScene. The reference
	 to the scene controller (this.controller) has not be established yet, so any initialization
	 that needs the scene controller should be done in the setup function below. */

}

LoginAssistant.prototype.setup = function() {
	
	/* this function is for setup tasks that have to happen when the scene is first created */

	/* use Mojo.View.render to render view templates and add them to the scene, if needed */

	/* setup widgets here */

	/* update the app info using values from our app */
	var cc = "";
	var pn = "";
	var pushN = "";
	var passw = "";

	var appdata = _appData.get();
	if (appdata) {
		cc = appdata.cc;
		pn = appdata.phoneNumber;
		pushN = appdata.pushName;
		passw = appdata.password;
	}

    this.controller.get("ccLabel").update($L("CC"));
    this.controller.get("mobilePhoneLabel").update($L("Mobile Phone"));
    this.controller.get("pushNameLabel").update($L("Push name"));
    this.controller.get("passwordLabel").update($L("Password"));

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
		maxLength : 9,
		charsAllow : this.onlyNum.bind(this)
	}, this.model = {
		value : pn
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
		value : passw
	});

	this.controller.setupWidget("connectButton", this.attributes = {
		label : $L("Connect"),
		type : Mojo.Widget.activityButton
	}, this.model = {
		value : "",
		disabled : false
	});

	/* add event handlers to listen to events from widgets */
	this.controller.listen(this.controller.get('connectButton'), Mojo.Event.tap, this.doConnectButton.bind(this));
};

LoginAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	 example, key handlers that are observing the document */
};

LoginAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	 this scene is popped or another scene is pushed on top */
};

LoginAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as
	 a result of being popped off the scene stack */
};

LoginAssistant.prototype.doConnectButton = function(event) {
	this.controller.get('connectButton').mojo.deactivate()
	// TDODO: intentar conectar

	var window =  this.controller.stageController.activeScene().window; 
	// Guardar valores nuevos en cookie
	var cc = this.controller.get('textFieldCC').mojo.getValue();
	var phone = this.controller.get('textFieldPN').mojo.getValue();
	var pushName = this.controller.get('textFieldPushN').mojo.getValue();
	var password = this.controller.get('textFieldPW').mojo.getValue();

	if (cc == "") {
		Mojo.Controller.errorDialog($L("Please insert a country code"), window);
		this.controller.get('textFieldCC').mojo.blur();
		return;
	}

	if (phone == "") {
		Mojo.Controller.errorDialog($L("Please insert a phone number"), window);
		this.controller.get('textFieldPN').mojo.blur();
		return;
	}

	if (password == "") {
		Mojo.Controller.errorDialog($L("Please insert a password"), window);
		this.controller.get('textFieldPW').mojo.blur();
		return;
	}
	var data = {
		cc : cc,
		phoneNumber : phone,
		pushName : pushName,
		password : password,
		userId : cc + phone
	};

	// some awesome code doing awesome things means the spinner is spinning
	this.controller.get('connectButton').mojo.activate();


	if (_mojowhatsupPlugin.isReady || !_networkConnected) {
		_mojowhatsupPlugin.loginResult = false;
		_mojowhatsupPlugin.safePluginCall(function() {
			_plugin.testLogin(data.userId, data.password, data.pushName);
		});
		this.waitLoginResult(data);
	} else {
		Mojo.Controller.errorDialog($L("Network connection not availabe yet"), window);
		this.controller.get('connectButton').mojo.deactivate();
	}
}

LoginAssistant.prototype.waitLoginResult = function(data) {
	if (!_mojowhatsupPlugin.loginResult) {
		setTimeout(this.waitLoginResult.bind(this, data), 3000);
	} else {
		if (_mojowhatsupPlugin.loginResult == "true") {
			Mojo.Log.info("%j", data);
			_appData.put(data);
			this.controller.stageController.swapScene("chats-list");
		} else {
			var window = this.controller.stageController.activeScene().window;
			Mojo.Controller.errorDialog($L("Login failure"), window);
		}

		// the awesome code is finished doing awesome things, so stop the spinner
		this.controller.get('connectButton').mojo.deactivate();
	}
}

LoginAssistant.prototype.onlyNum = function(charCode) {
	if (charCode == 46 || (charCode > 47 && charCode < 58))
		return true;
	return false;
}
