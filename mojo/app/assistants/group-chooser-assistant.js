function GroupChooserAssistant(chats) {
	this.listModel = {
		items : chats
	};
}

GroupChooserAssistant.prototype.setup = function() {
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

		this.controller.setupWidget(Mojo.Menu.commandMenu, this.attributes = {
			spacerHeight : 0,
			menuClass : 'no-fade'
		}, this.menuModel);
	}

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

	this.controller.get("headerTitle").update($L("Select a group"));

	this.listElement = this.controller.get("chatsList");

	this.controller.setupWidget("chatsList", {
		itemTemplate : "group-chooser/list-entry",
		dividerFunction : this.firstLetter,
		delay : 250,
		filterFunction : this.filterList.bind(this),
		formatters : {
			icon : function(value, model) {
				if (model.picturepath) {
					var imgSize = '60:60';
					if (_appAssistant.isPre3())
						imgSize = '90:90';
					return '<div class="chat-list-icon picture icon left" style="background-image:url(/var/luna/data/extractfs' + encodeURIComponent(model.picturepath) + ':0:0:' + imgSize + ':3)"></div>';
				} else {
					return '<div class="chat-list-icon group-icon icon left"></div>';
				}
			},
			chatName : function(value, model) {
				if (value)
					return emojify(model.chatName, 18);
			}
		}
	}, this.listModel);

	/* add event handlers to listen to events from widgets */

	this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
	Mojo.Event.listen(this.listElement, Mojo.Event.listTap, this.listTapHandler);
};

GroupChooserAssistant.prototype.handleCommand = function(event) {
	if (event.type == Mojo.Event.command) {
		switch(event.command) {
			case 'goBack':
				this.controller.stageController.popScene();
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

GroupChooserAssistant.prototype.listTapHandler = function(event) {
	this.controller.stageController.popScene(event.item);
}

GroupChooserAssistant.prototype.filterList = function(filterString, listWidget, offset, count) {
	var subset = [];
	var totalSubsetSize = 0;

	var i, s;
	var someList = [];

	if (filterString !== '') {
		var len = this.listModel.items.length;

		//find the items that include the filterstring
		for ( i = 0; i < len; i++) {
			s = this.listModel.items[i];
			if (s.chatName.toUpperCase().indexOf(filterString.toUpperCase()) >= 0) {
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

GroupChooserAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	 example, key handlers that are observing the document */
}

GroupChooserAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	 this scene is popped or another scene is pushed on top */
}

GroupChooserAssistant.prototype.firstLetter = function(data) {
	// return the first letter of the position (G,C,F)
	return data.chatName.toUpperCase()[0];
}

GroupChooserAssistant.prototype.cleanup = function(event) {
	Mojo.Event.stopListening(this.listElement, Mojo.Event.listTap, this.listTapHandler);
};
