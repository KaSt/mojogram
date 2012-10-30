function ContactListAssistant(contacts, picker) {
	this.picker = picker;
	this.listModel = {
		items : contacts
	};
	_contactsAssistant = this;
	/* this is the creator function for your scene assistant object. It will be passed all the
	 additional parameters (after the scene name) that were passed to pushScene. The reference
	 to the scene controller (this.controller) has not be established yet, so any initialization
	 that needs the scene controller should be done in the setup function below. */
}

ContactListAssistant.prototype.setup = function() {
	this.menuModel = {
		visible : true,
		items : []
	};
	if (_mainAssistant != null && _appAssistant.isTouchPad()) {
		this.menuModel.items = [{
			icon : "back",
			command : "goBack"
		}, {
			icon : "search",
			command : "search"
		}];
	}

	this.menuModel.items.push({});
	this.menuModel.items.push({
		icon : "refresh",
		command : "refresh"
	});

	this.controller.setupWidget(Mojo.Menu.commandMenu, this.attributes = {
		spacerHeight : 0,
		menuClass : 'no-fade'
	}, this.menuModel);

	this.controller.setupWidget(Mojo.Menu.appMenu, this.attributesAppMenu = {
		omitDefaultItems : true
	}, this.appMenuModel = {
		visible : true,
		items : [Mojo.Menu.editItem, {
			label : $L("Preferences"),
			command : Mojo.Menu.prefsCmd
		}, {
			label : $L("Account settings"),
			command : "accountSettings"
		}, {
			label : $L("Help"),
			command : Mojo.Menu.helpCmd
		}, {
			label : $L("Exit"),
			command : "exit"
		}]
	});

	this.controller.get("headerTitle").update($L("Contacts") + " (" + this.listModel.items.length + ")");

	this.listElement = this.controller.get("contactList");

	this.controller.setupWidget("contactList", {
		itemTemplate : "contact-list/list-entry",
		dividerFunction : this.firstLetter,
		delay : 250,
		filterFunction : this.filterList.bind(this),
		formatters : {
			status : function(value, model) {
				if (value)
					return emojify(model.status, 18);
			},
			icon : function(value, model) {
				if (model.picturepath) {
					var imgSize = '60:60';
					if (_appAssistant.isPre3())
						imgSize = '80:80';
					return '<div class="contact-list-icon picture icon left" style="background-image:url(/var/luna/data/extractfs' + encodeURIComponent(model.picturepath) + ':0:0:' + imgSize + ':3)"></div>';
				} else {
					return '<div class="contact-list-icon person-icon icon left"></div>';
				}
			},
		}

	}, this.listModel);

	/* add event handlers to listen to events from widgets */

	if (((new Date()).getTime() - _appData.get().lastStatusRequest) > 86400000) {
		this.importAndRequestStatus();
	}

	this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
	Mojo.Event.listen(this.listElement, Mojo.Event.listTap, this.listTapHandler);
};


ContactListAssistant.prototype.updateContactPicture = function(jid, picturepath) {
	for (var i = 0; i < this.listModel.items.length; i++) {
		if (this.listModel.items[i].jid == jid) {
			this.listModel.items[i].picturepath = picturepath;
			this.listElement.mojo.noticeUpdatedItems(i, [this.listModel.items[i]]);
			return;
		}
	}
}

ContactListAssistant.prototype.handleCommand = function(event) {
	if (event.type == Mojo.Event.command) {
		switch(event.command) {
			case 'goBack':
				this.controller.stageController.popScene();
				break;
			case 'refresh':
				this.importAndRequestStatus();
				break;
			case "search":
				this.listElement.mojo.open();
				break;
			case Mojo.Menu.prefsCmd:
				this.controller.stageController.pushScene("prefs");
				break;
			case "accountSettings":
				this.controller.stageController.pushScene("account");
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

ContactListAssistant.prototype.importAndRequestStatus = function() {
	this.importAndLoadContacts();
	if (_mainAssistant != null) {
		_mainAssistant.requestStatus();
	}
}

ContactListAssistant.prototype.importAndLoadContacts = function() {
	_contactsImported = false;
	_appDB.importContacts();
	this.loadContacts();
}

ContactListAssistant.prototype.loadContacts = function() {
	if (_mainAssistant != null) {
		_mainAssistant.loadContacts( function(contacts) {
			Mojo.Log.info("contactos %d", contacts.length);
			this.listModel.items = contacts;
			this.controller.get("headerTitle").update($L("Contacts") + " (" + this.listModel.items.length + ")");
			this.controller.modelChanged(this.listModel);
		}.bind(this));
	}
}

ContactListAssistant.prototype.listTapHandler = function(event) {
	if (this.picker) {
		this.controller.stageController.popScene(event.item);
	} else {
		_appDB.findOrCreateChat(event.item.jid, function(chat) {
			Mojo.Log.info("chat found: " + JSON.stringify(chat));
			// this.controller.stageController.swapScene("chats-list", []);
			this.controller.stageController.pushScene("chat", chat);
			setTimeout(_appAssistant.notifyUpdateChats.bind(_appAssistant), 500);
		}.bind(this));
	}
}

ContactListAssistant.prototype.filterList = function(filterString, listWidget, offset, count) {
	var subset = [];
	var totalSubsetSize = 0;

	var i, s;
	var someList = [];

	if (filterString !== '') {
		var len = this.listModel.items.length;

		//find the items that include the filterstring
		for ( i = 0; i < len; i++) {
			s = this.listModel.items[i];
			if (s.name.toUpperCase().indexOf(filterString.toUpperCase()) >= 0) {
				//Mojo.Log.info("Found string in title", i);
				someList.push(s);
			}
		}
	} else {
		Mojo.Log.info("No filter string");
		someList = this.listModel.items;
	}

	// pare down list results to the part requested by widget (starting at offset & thru count)
	var cursor = 0;
	var subset = [];
	var totalSubsetSize = 0;
	while (true) {
		if (cursor >= someList.length) {
			break;
		}
		if (subset.length < count && totalSubsetSize >= offset) {
			subset.push(someList[cursor]);
		}
		totalSubsetSize++;
		cursor++;
	}

	// use noticeUpdatedItems to update the list
	// then update the list length
	// and the FilterList widget's FilterField count (displayed in the upper right corner)
	this.listElement.mojo.noticeUpdatedItems(offset, subset);
	this.listElement.mojo.setLength(totalSubsetSize);
	this.listElement.mojo.setCount(totalSubsetSize);
}

ContactListAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	 example, key handlers that are observing the document */
}

ContactListAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	 this scene is popped or another scene is pushed on top */
}

ContactListAssistant.prototype.firstLetter = function(data) {
	// return the first letter of the position (G,C,F)
	return data.name[0];
}

ContactListAssistant.prototype.cleanup = function(event) {
	Mojo.Event.stopListening(this.listElement, Mojo.Event.listTap, this.listTapHandler);
	_contactsAssistant = null;
};
