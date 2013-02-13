function UpdateAssistant(updateInfo) {
	this.updateInfo = updateInfo;
}

UpdateAssistant.prototype.setup = function() {
	if (_mainAssistant != null && _appAssistant.isTouchPad()) {
		var menuModel = {
			visible : true,
			items : [{
				icon : "back",
				command : "close"
			}]
		};

		this.controller.setupWidget(Mojo.Menu.commandMenu, this.attributes = {
			spacerHeight : 0,
			menuClass : 'no-fade'
		}, menuModel);
	}

	var menuAttr = {
		omitDefaultItems : true
	};
	var menuModel = {
		visible : true,
		items : [{
			label : $L("Back"),
			command : 'close'
		}]
	};
	this.controller.setupWidget(Mojo.Menu.appMenu, menuAttr, menuModel);

	this.controller.get("updateTitle").innerHTML = $L("Update available");

	var log = "";
	log += Mojo.View.render({
		object : {
			label : $L("New version")
		},
		template : "update/header"
	});
	log += "<b>" + Mojo.appInfo.title + " " + this.updateInfo.version + "</b><br>";	
	log += this.updateInfo.message + "<br>";
	log += Mojo.View.render({
		object : {
			label : $L("Changes")
		},
		template : "update/header"
	});
	log += "<ul>";
	for (var i = 0; i < this.updateInfo.comments.length; i++) {
		log += "<li>" + this.updateInfo.comments[i] + "</li>";
	}
	log += "</ul><br>";
	this.controller.get("info").innerHTML = log;
	this.controller.get("footer").innerHTML = Mojo.Controller.appInfo.copyright;

	this.controller.setupWidget("downloadButton", this.attributes = {
		label : $L("Download")
	}, this.modelRegisterButton = {
		value : "",
		disabled : false,
		buttonClass : "affirmative"
	});

	this.controller.setupWidget("closeButton", this.attributes = {
		label : $L("Close")
	}, this.modelRegisterButton = {
		value : "",
		disabled : false
	});

	this.controller.listen("downloadButton", Mojo.Event.tap, this.downloadButtonHandler.bindAsEventListener(this));
	this.controller.listen("closeButton", Mojo.Event.tap, this.closeButtonHandler.bindAsEventListener(this));
};

UpdateAssistant.prototype.downloadButtonHandler = function(event) {
	this.controller.serviceRequest('palm://com.palm.applicationManager', {
		method : 'open',
		parameters : {
			target : this.updateInfo.url
		},
		onFailure : function(r) {
			Mojo.Log.error("Error calling applicationManager:open: %j", r);
		}
	});
}

UpdateAssistant.prototype.closeButtonHandler = function(event) {
	this.controller.stageController.popScene();
}

UpdateAssistant.prototype.activate = function(event) {
};

UpdateAssistant.prototype.handleCommand = function(event) {
	if (event.type == Mojo.Event.command) {
		if (event.command == "close") {
			this.controller.stageController.popScene();
		}
	}
};

UpdateAssistant.prototype.deactivate = function(event) {

};

UpdateAssistant.prototype.cleanup = function(event) {
	this.controller.stopListening("downloadButton", Mojo.Event.tap, this.downloadButtonHandler);
	this.controller.stopListening("closeButton", Mojo.Event.tap, this.closeButtonHandler);
};
