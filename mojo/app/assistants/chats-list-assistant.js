ChatsListAssistant.SHOW_TYPE = "seeAll";

function ChatsListAssistant(chats){
    this.listModel = {
        items: []
    };
    
    this.currentListModel = this.listModel;
    _chatsAssistant = this;
    this.contactsImported = false;
    this.chatsLoaded = false;
}

ChatsListAssistant.prototype.setup = function(){
    PalmServices.setWakeUpAlarm();
    PalmServices.setActivity();
    
    this.controller.setupWidget("spinnerId", this.attributesSpinner = {
        spinnerSize: "large"
    }, this.modelSpinner = {
        spinning: true
    });
    
    
    // Start pluginBG.
    _mojowhatsupPlugin.safePluginCall(function(){
        delete _mediaUploads;
        delete _mediaDownloads;
        _mediaUploads = new HashTable();
        _mediaDownloads = new HashTable();
        
        _myJid = _appData.cookieData.userId + "@s.whatsapp.net";
        if (!_appData.cookieData.passwordV2) {
            _appData.put("password", _plugin.processPassword(_appData.cookieData.password));
            _appData.put("passwordV2", true);
        }
        _plugin.startBG(_appData.cookieData.userId, _appData.cookieData.password, _appData.cookieData.pushName, "false");
    });
    
    _mojowhatsupPlugin.whenRunnerExecuting(function(){
        PalmServices.subscribeNetworkStatus();
    }
.bind(this));
    
    var viewModel = {
        visible: true,
        items: []
    };
    
	var titleWidth = 160;
    if (_appAssistant.isTouchPad()) {
        titleWidth = Mojo.Environment.DeviceInfo.screenWidth - 160;
    }
	
    viewModel.items = viewModel.items.concat([{
        items: [{
            label: $L("All chats"),
            command: "seeAll",
			width: titleWidth
        }, {
            icon: "icon-header broadcast",
            command: "seeBroadcasts"
        }, {
            icon: "icon-header person",
            command: "seeContacts"
        }, {
            icon: "icon-header group",
            command: "seeGroups"
        }],
        toggleCmd: ChatsListAssistant.SHOW_TYPE
    }]);
    
    this.controller.setupWidget(Mojo.Menu.viewMenu, {
        spacerHeight: 0,
        menuClass: "no-fade right"
    }, viewModel);
    
	
	var commandModel = {
        visible: true,
        items: []
    };
    
    if (_chatsAssistant != null && _appAssistant.isTouchPad()) {
        commandModel.items = commandModel.items.concat([{
            icon: "search",
            command: "search"
        }]);
    }
	
	 commandModel.items = commandModel.items.concat([{}, {}, {
            icon: "new-chat",
            command: "newChat"
        }]);
	
    this.controller.setupWidget(Mojo.Menu.commandMenu, {
        spacerHeight: 0,
        menuClass: "no-fade right"
    }, commandModel);
    
    //    this.appMenuItems = [Mojo.Menu.editItem, {
    //        label : $L("Create new group"),
    //        command : "createGroup"
    //    }];
    
    this.appMenuModel = {
        visible: true,
        items: []
    };
    
    this.appMenuModel.items = this.appMenuModel.items.concat([{
        label: $L("Create new group"),
        command: "createGroup"
    }, {
        label: $L("Delete all messages"),
        command: "deleteallmessages"
    }, {
        label: $L("New broadcast message"),
        command: "sendBroadcast"
    }, {
        label: $L("Message to multiple recipients"),
        command: "sendMultiple"
    }, {
		label: $L("My status"),
		command: "myStatus"
	}]);
    
    this.appMenuModel.items = this.appMenuModel.items.concat([{
        label: $L("Preferences"),
        command: Mojo.Menu.prefsCmd
    }, {
        label: $L("Account settings"),
        command: "accountSettings"
    }, {
        label: $L("Help"),
        command: Mojo.Menu.helpCmd
    }, {
        label: $L("Exit"),
        command: "exit"
    }]);
    
    
    this.controller.setupWidget(Mojo.Menu.appMenu, this.attributesAppMenu = {
        omitDefaultItems: true
    }, this.appMenuModel);
    
   //  this.controller.get("headerTitle").update($L("Chats"));
    
    this.listElement = this.controller.get("chatsList");
    
    this.controller.setupWidget("chatsList", {
        itemTemplate: "chats-list/list-entry",
        dividerTemplate: "chats-list/chats-list-divider",
        hasNoWidgets: true,
        deletedProperty: "deleted",
        dividerFunction: function(data){
            if (data.lastMessage.timestamp == null) 
                return $L("Without messages");
            else 
                return Mojo.Format.formatRelativeDate(new Date(data.lastMessage.timestamp), 'medium');
        },
        delay: 250,
        swipeToDelete: true,
        filterFunction: this.filterList.bind(this),
        formatters: {
            muted: function(value, model){
                if (model.muteexpiry && model.muteexpiry > (new Date().getTime() / 1000)) {
                    return "inline-block";
                }
                else {
                    return "none";
                }
            },
            key: function(value, model){
                if (value) 
                    return model.keyString();
                return "";
            },
            chatName: function(value, model){
                if (value) 
                    return emojify(model.chatName, 18);
            },
            unreadBool: function(value, model){
                if (model.chatName) {
                    if (model.isBroadcast()) 
                        return "true";
                    return (model.unread == 0 ? "false" : "true");
                }
                return "false";
            },
            unread: function(value, model){
                if (model.chatName) {
                    if (model.isBroadcast()) {
                        return model.pictureid;
                    }
                    else 
                        return (model.unread == 0 ? "" : "" + model.unread);
                }
                else {
                    return "";
                }
            },
            icon: function(value, model){
                if (model.picturepath) {
                    var imgSize = '60:60';
                    if (_appAssistant.isPre3()) 
                        imgSize = '90:90';
                    return '<div class="chat-list-icon picture icon left" style="background-image:url(/var/luna/data/extractfs' + encodeURIComponent(model.picturepath) + ':0:0:' + imgSize + ':3)"></div>';
                }
                else 
                    if (model.chatName) {
                        return '<div class="chat-list-icon ' + (model.isBroadcast() ? "broadcast-icon" : (model.isGroup ? "group-icon" : "person-icon")) + ' icon left"></div>';
                    }
            },
            time: function(value, model){
                if (model.lastMessage != null && model.lastMessage.timestamp != null) {
                    return Mojo.Format.formatDate(new Date(model.lastMessage.timestamp), {
                        time: "short"
                    });
                }
                return "";
            },
            textMessage: function(value, model){
                var msg = model.lastMessage;
                var status = model.status;
                if (status != undefined && status != null) {
                    switch (status) {
                        case 0:
                            return '<div style="color:green; font-weight:bold;">' + $L("(typing)") + '</div>';
                        case 1:
                            return '<div style="color:green; font-weight:bold;">' + $L("(online)") + '</div>';
                    }
                }
                if (msg && msg.data != null) {
                    var jidName = _appAssistant.getNameForJid(model, msg);
                    var msgFomatted = msg.formatTextMessage(false, true, 16, true);
                    var text = (jidName == null || !model.isGroup ? msgFomatted : jidName + ": " + msgFomatted);
                    return text;
                }
                return "";
            },
            statusIcon: function(value, model){
                var msg = model.lastMessage;
                var status = model.status;
                if (status != undefined && status != null) {
                    if (status == 0 || status == 1) 
                        return "none";
                }
                if (msg) {
                    return msg.statusIconStyle();
                }
            }
        }
    }, this.listModel);
    
    if (!_contactsImported) {
        _appDB.importContacts();
    }
    
    /* add event handlers to listen to events from widgets */
    
    this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
    this.listDeleteHandler = this.listDeleteHandler.bindAsEventListener(this);
	
	this.controller.listen("rowStatus",  Mojo.Event.tap, this.tapMyStatustHandler.bindAsEventListener(this));
    Mojo.Event.listen(this.listElement, Mojo.Event.listTap, this.listTapHandler);
    Mojo.Event.listen(this.listElement, Mojo.Event.listDelete, this.listDeleteHandler);
	
	this.activateHandler = this.activateWindow.bind(this);
    Mojo.Event.listen(this.controller.stageController.document, Mojo.Event.stageActivate, this.activateHandler);
    this.deactivateHandler = this.deactivateWindow.bind(this);
    Mojo.Event.listen(this.controller.stageController.document, Mojo.Event.stageDeactivate, this.deactivateHandler);

};

ChatsListAssistant.prototype.tapMyStatustHandler = function(event){
	this.controller.stageController.pushScene('mystatus');
}

ChatsListAssistant.prototype.activateWindow = function(event){
    _mojowhatsupPlugin.safePluginCall(function(){
        _plugin.sendActive(1);
    });
}

ChatsListAssistant.prototype.deactivateWindow = function(event){
    _mojowhatsupPlugin.safePluginCall(function(){
        _plugin.sendActive(0);
    });
}

ChatsListAssistant.prototype.restart = function(){
    _exitApp = false;
    _contactsImported = false;
    _appDB.importContacts();
    
    _mojowhatsupPlugin.safePluginCall(function(){
        delete _mediaUploads;
        delete _mediaDownloads;
        _mediaUploads = new HashTable();
        _mediaDownloads = new HashTable();
        
        _myJid = _appData.cookieData.userId + "@s.whatsapp.net";
        if (!_appData.cookieData.passwordV2) {
            _appData.put("password", _plugin.processPassword(_appData.cookieData.password));
            _appData.put("passwordV2", true);
        }
        _plugin.startBG(_appData.cookieData.userId, _appData.cookieData.password, _appData.cookieData.pushName, "false");
    });
    
    this.requestStatus();
    this.loadContacts();
    this.updateChats();
    this.waitForCompletion();
}

ChatsListAssistant.prototype.requestStatus = function(){
    if (_contactsImported) {
        _statusRequest = new StatusRequest();
        _statusRequest.getMyStatus();
        _statusRequest = new StatusRequest();
        _statusRequest.sync();
    }
    else {
        setTimeout(this.requestStatus.bind(this), 10);
    }
}

ChatsListAssistant.prototype.loadContacts = function(callback){
    if (_contactsImported) {
        _appDB.getAllContacts(function(contacts){
            // this.mainListModel.items[2].size = contacts.length;
            // this.mainListModel.items[2].contacts = contacts;
            // this.controller.modelChanged(this.mainListModel);
            if (callback) 
                callback(contacts);
            this.contactsImported = true;
        }
.bind(this));
    }
    else {
        setTimeout(this.loadContacts.bind(this), 10, callback);
    }
}

ChatsListAssistant.prototype.waitForCompletion = function(){
    if (_mojowhatsupPlugin.isRunnerExecuting && this.chatsLoaded && this.contactsImported) {
        this.controller.get("spinnerId").mojo.stop();
        this.controller.get("Scrim").hide();
        Updater.checkUpdate(this.controller, false, false);
    }
    else {
        setTimeout(this.waitForCompletion.bind(this), 30);
    }
}

ChatsListAssistant.prototype.ready = function(){
    this.requestStatus();
    this.loadContacts();
    this.updateChats();
    this.waitForCompletion();
    this.requestChatsStatus();
    this.requestChatPictures();
	this.updateMyStatus();
}

ChatsListAssistant.prototype.requestChatsStatus = function(){
    for (var i = 0; i < this.listModel.items.length; i++) {
        if (!this.listModel.items[i].isGroup) {
            try {
                _plugin.doStateRequest(this.listModel.items[i].jid);
            } 
            catch (e) {
                Mojo.Log.error("error requestChatsStatus: %j", e);
            }
        }
    }
}

ChatsListAssistant.prototype.requestChatPictures = function(){
    var jidList = [_myJid];
    for (var i = 0; i < this.listModel.items.length; i++) {
        jidList.push(this.listModel.items[i].jid);
    }
    try {
        _plugin.sendGetPictureIds(JSON.stringify(jidList));
    } 
    catch (e) {
        Mojo.Log.error("error requestChatPictures: %j", e);
    }
}


ChatsListAssistant.prototype.handleCommand = function(event){
    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case 'seeBroadcasts':
            case 'seeAll':
            case 'seeContacts':
            case 'seeGroups':
                ChatsListAssistant.SHOW_TYPE = event.command;
                this.filterChats();
                break;
            case 'goBack':
                this.controller.stageController.popScene();
                break;
			case 'myStatus':
				this.controller.stageController.pushScene('mystatus');
				break;
            case 'createContactChat':
                _appDB.getAllContacts(function(contacts){
                    this.controller.stageController.pushScene('contact-list', contacts, false, true);
                }
.bind(this));
                break;
            case 'newChat':
				event.command = "createContactChat";
				this.handleCommand(event);
				break;
//                this.controller.popupSubmenu({
//                    onChoose: function(command){
//                        event.command = command;
//                        this.handleCommand(event);
//                    }
//.bind(this)                    ,
//                    placeNear: event.originalEvent.target,
//                    items: [{
//                        label: $L("Contact chat"),
//                        command: "createContactChat",
//                        icon: "menu-icon-person"
//                    }, {
//                        label: $L("Group chat"),
//                        command: "createGroup",
//                        icon: "menu-icon-group"
//                    }, {
//						label: $L("Broadcast message"),
//						command: "sendBroadcast",
//						icon: "menu-icon-broadcast"
//					}]
//                });
//                break;
            case 'createGroup':
                if (Group.OWNING_GROUPS.length < _appData.get().max_groups) {
                    this.controller.stageController.pushScene('group', null, null, 'new');
                }
                else {
                    var window = this.controller.stageController.activeScene().window;
                    Mojo.Controller.errorDialog($L("You can not create more groups\n. You have reached the maximum number of owning groups") + "(" + _appData.get().max_groups + ")", window);
                }
                break;
            case 'search':
                this.listElement.mojo.open();
                break;
            case Mojo.Menu.prefsCmd:
                this.controller.stageController.pushScene("prefs");
                break;
            case "accountSettings":
                this.controller.stageController.pushScene("account");
                break;
            case "sendBroadcast":
                this.controller.stageController.pushScene("broadcast", {
                    action: "broadcast"
                });
                break;
            case "sendMultiple":
                this.controller.stageController.pushScene("broadcast", {
                    action: "multiple"
                });
                break;
            case "deleteallmessages":
                this.controller.showAlertDialog({
                    onChoose: function(value){
                        if (value == "ok") {
                            _appDB.deleteAllMessages(function(){
                                if (_chatsAssistant != null) {
                                    _chatsAssistant.updateChats();
                                }
                            }
.bind(this));
                        }
                    },
                    title: $L("Confirm"),
                    message: $L("Do you really want to delete all messages from all chats?"),
                    choices: [{
                        label: $L("OK"),
                        value: "ok",
                        type: "affirmative"
                    }, {
                        label: $L("Cancel"),
                        value: "cancel",
                        type: "negative"
                    }]
                });
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

ChatsListAssistant.prototype.listTapHandler = function(event){
    // if (event.item.isGroup)
    // this.controller.stageController.pushScene("group-chat", event.item);
    // else
    if (event.item.isBroadcast()) {
		_appDB.findGroup(event.item.jid, function(group){
			this.controller.stageController.pushScene("broadcast", {
				action: "info",
				chat: event.item,
				group: group
			});
		}
.bind(this));
	}
	else {
		_appDB.findChat(event.item.jid, function(chat) {
			this.controller.stageController.pushScene("chat", chat);	
		}.bind(this));
	}
}

ChatsListAssistant.prototype.listDeleteHandler = function(event){
    var chat = event.item;
    var f = function(){
        this.listElement.mojo.noticeRemovedItems(event.index, 0);
        _appAssistant.notifyUpdateChats(this);
    }
.bind(this);
    
    chat.deleted = true;
    
    if (chat.isBroadcast()) {
        _appDB.deleteAllMessagesFromChat(chat, function(){
            _appDB.deleteGroupAndChat({
                gjid: chat.jid
            }, chat, f);
        }
.bind(this));
    }
    else {
        _appDB.deleteChat(chat, f);
    }
}

ChatsListAssistant.prototype.filterList = function(filterString, listWidget, offset, count){
    var subset = [];
    var totalSubsetSize = 0;
    
    var i, s;
    var someList = [];
    
    if (filterString !== '') {
        var len = this.listModel.items.length;
        
        //find the items that include the filterstring
        for (i = 0; i < len; i++) {
            s = this.listModel.items[i];
            if (s.chatName.toUpperCase().indexOf(filterString.toUpperCase()) >= 0) {
                //Mojo.Log.info("Found string in title", i);
                someList.push(s);
            }
        }
    }
    else {
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
    
    this.currentListModel = {
        items: someList
    };
}

ChatsListAssistant.prototype.filterChats = function(){
    var filtered = [];
    
    for (var i = 0; i < this.listModel.items.length; i++) {
        s = this.listModel.items[i];
        var include = false;
        if (s.deleted) 
            include = false;
        else {
            switch (ChatsListAssistant.SHOW_TYPE) {
                case 'seeBroadcasts':
                    include = s.isBroadcast();
                    break;
                case 'seeAll':
                    include = true;
                    break;
                case 'seeContacts':
                    include = !s.isGroup;
                    break;
                case 'seeGroups':
                    include = s.isGroup && !s.isBroadcast();
                    break;
            }
        }
        if (include) 
            filtered.push(s);
    }
    
    var all = this.listModel.items;
    this.listModel.items = [];
    this.controller.modelChanged(this.listModel, this);
    this.listModel.items = all;
    this.listElement.mojo.noticeAddedItems(0, filtered);
    this.currentListModel = {
        items: filtered
    };
}

ChatsListAssistant.prototype.updateChats = function(){
    _appDB.getAllChatsWithMessages(function(chats){
        this.listModel.items = chats;
        this.filterChats();
        this.requestChatsStatus();
        this.requestChatPictures();
        this.chatsLoaded = true;
    }
.bind(this));
}

ChatsListAssistant.prototype.updateContactInfo = function(contactInfo){
    for (var i = 0; i < this.currentListModel.items.length; i++) {
        if (this.currentListModel.items[i].jid == contactInfo.jid) {
            this.currentListModel.items[i].status = contactInfo.status;
            this.listElement.mojo.noticeUpdatedItems(0, this.currentListModel.items);
			break;
        }
    }
}

ChatsListAssistant.prototype.activate = function(event){
    if (event == "updateStatus") 
        this.updateMyStatus();
}

ChatsListAssistant.prototype.firstLetter = function(data){
    // return the first letter of the position (G,C,F)
    return data.chatName[0];
}

ChatsListAssistant.prototype.updateMyStatus = function(){
	this.controller.get("myStatusLabel").update(/* '<div class="list-selector-triangle"></div>' + */ $L("My status"));
	this.controller.get("myStatusTitle").update(emojify(_appData.cookieData.statusMessage, 18));
}


ChatsListAssistant.prototype.cleanup = function(event){
    PalmServices.clearWakeUpAlarm();
    PalmServices.clearActivity();
    
    _chatsAssistant = null;
    Mojo.Event.stopListening(this.listElement, Mojo.Event.listTap, this.listTapHandler);
    Mojo.Event.stopListening(this.listElement, Mojo.Event.listDelete, this.listDeleteHandler);
	this.controller.stopListening("rowStatus",  Mojo.Event.tap, this.tapMyStatustHandler);
	
    _mojowhatsupPlugin.safePluginCall(function(){
        _plugin.exitPlugin();
    });
    if (!_exitApp) {
        _appAssistant.handleLaunch({
            action: "dashboard"
        });
    }
    
};
