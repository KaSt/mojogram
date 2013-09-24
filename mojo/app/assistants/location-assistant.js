function LocationAssistant() {
	this.location = null;
}

LocationAssistant.prototype.setup = function() {
	if (_chatsAssistant != null && _appAssistant.isTouchPad()) {
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

	this.controller.get("headerTitle").update($L("Location"));
	this.controller.get("longitudeLabel").update($L("Longitude"));
	this.controller.get("latitudeLabel").update($L("Latitude"));

	this.controller.setupWidget("getLocationButton", this.attributes = {
		label : $L("Get location"),
		type : Mojo.Widget.activityButton
	}, this.modelGetLocationButton = {
		value : "",
		disabled : false,
		buttonClass : "primary"
	});

	this.controller.setupWidget("sendLocationButton", this.attributes = {
		label : $L("Send location"),
		type : Mojo.Widget.defaultButton
	}, this.modelSendLocationButton = {
		value : "",
		disabled : true,
		buttonClass : "affirmative"
	});

	this.controller.listen('getLocationButton', Mojo.Event.tap, this.getLocationHandler.bindAsEventListener(this));
	this.controller.listen('sendLocationButton', Mojo.Event.tap, this.sendLocationHandler.bindAsEventListener(this));
}

LocationAssistant.prototype.sendLocationHandler = function(event) {
	this.controller.stageController.popScene(this.location);
}

LocationAssistant.prototype.getLocationHandler = function(event) {
	this.controller.serviceRequest('palm://com.palm.location', {
		method : 'getCurrentPosition',
		parameters : {},
		onSuccess : function(r) {
			Mojo.Log.info("getCurrentPosition success, results=" + JSON.stringify(r));
			this.location = {
				longitude : r.longitude,
				latitude : r.latitude
			};
			this.controller.get('longitudeValue').update(this.location.longitude);
			this.controller.get('latitudeValue').update(this.location.latitude);
			this.modelSendLocationButton.disabled = false;
			this.controller.modelChanged(this.modelSendLocationButton);
			this.controller.get('getLocationButton').mojo.deactivate();
		}.bind(this),
		onFailure : function(r) {
			var window = this.controller.stageController.activeScene().window;
			Mojo.Controller.errorDialog($L("Can not obtain the current location.\nCheck that you have localization services activated."), window);
			this.controller.get('getLocationButton').mojo.deactivate();
		}.bind(this)
	});
}

LocationAssistant.prototype.handleCommand = function(event) {
	if (event.type == Mojo.Event.command) {
		switch(event.command) {
			case 'goBack':
				this.controller.stageController.popScene();
				break;
		}
	}
}

LocationAssistant.prototype.cleanup = function() {
	this.controller.stopListening('getLocationButton', Mojo.Event.tap, this.getLocationHandler);
	this.controller.stopListening('sendLocationButton', Mojo.Event.tap, this.sendLocationHandler);
}