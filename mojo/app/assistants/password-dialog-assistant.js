function PasswordDialogAssistant(sceneAssistant, callback) {
	this.sceneAssistant = sceneAssistant;
	this.callback = callback;
	this.password = null;
}

PasswordDialogAssistant.prototype.setup = function(widget) {
	this.widget = widget;

	this.sceneAssistant.controller.get("dialogTitle").update($L("Password"));

	this.sceneAssistant.controller.setupWidget("pwTF", this.pwTFattributes = {
		hintText : $L("Password") + "...",
		autofocus : true,
		autoReplace : false
	}, this.pwTFmodel = {
		value : ""
	});

	// Setup button and event handler
	//
	this.sceneAssistant.controller.setupWidget("okButton", this.attributes = {}, this.model = {
		buttonLabel : $L("OK"),
		disabled : false
	});

	 this.cancelButtonModel = {
		 label : $L("Cancel"),
		 disabled : false
	 };
	 this.sceneAssistant.controller.setupWidget("cancelButton", {
		 type : Mojo.Widget.defaultButton
	 }, this.cancelButtonModel);

	this.sceneAssistant.controller.listen("cancelButton", Mojo.Event.tap, this.cancel.bindAsEventListener(this));
	this.sceneAssistant.controller.listen("okButton", Mojo.Event.tap, this.checkOK.bindAsEventListener(this));
};

PasswordDialogAssistant.prototype.ready = function() {
	this.sceneAssistant.controller.get('pwTF').mojo.focus();
}

PasswordDialogAssistant.prototype.cancel = function(event) {
	this.widget.mojo.close();
}

PasswordDialogAssistant.prototype.checkOK = function(event) {
	this.password = this.sceneAssistant.controller.get("pwTF").mojo.getValue();	
	if (this.password == "") {
		this.sceneAssistant.controller.get('errorMessageText').update($L("Please insert a password"));
		this.sceneAssistant.controller.get('errormessage').show();
		this.sceneAssistant.controller.get('pwTF').mojo.blur();
		return;
	}
	this.callback(this.password);
	this.widget.mojo.close();
};

PasswordDialogAssistant.prototype.cleanup = function() {
	this.sceneAssistant.controller.stopListening("okButton", Mojo.Event.tap, this.checkOK);
	this.sceneAssistant.controller.stopListening("cancelButton", Mojo.Event.tap, this.cancel);
};
