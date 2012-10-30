function ChatsListAssistant(chats) {
    this.listModel = {
        items : chats
    };

    _chatsAssistant = this;
}

ChatsListAssistant.prototype.setup = function() {
    if (_mainAssistant != null && _appAssistant.isTouchPad()) {
        var menuModel = {
            visible : true,
            items : [{
                icon : "back",
                command : "goBack"
            }, {
                icon : "search",
                command : "search"
            }]
        };

        this.controller.setupWidget(Mojo.Menu.commandMenu, this.attributes = {
            spacerHeight : 0,
            menuClass : 'no-fade'
        }, menuModel);
    }

    this.appMenuItems = [Mojo.Menu.editItem, {
        label : $L("Create new group"),
        command : "createGroup"
    }];

    this.controller.setupWidget(Mojo.Menu.appMenu, this.attributesAppMenu = {
        omitDefaultItems : true
    }, this.appMenuModel = {
        visible : true,
        items : [Mojo.Menu.editItem, {
            label : $L("Create new group"),
            command : "createGroup"
        }, {
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

    this.controller.get("headerTitle").update($L("Chats"));

    this.listElement = this.controller.get("chatsList");

    this.controller.setupWidget("chatsList", {
        itemTemplate : "chats-list/list-entry",
        dividerTemplate : "chats-list/chats-list-divider",
        hasNoWidgets : true,
        dividerFunction : function(data) {
            if (data.lastMessage.timestamp == null)
                return $L("Without messages");
            else
                return Mojo.Format.formatRelativeDate(new Date(data.lastMessage.timestamp), 'medium');
        },
        delay : 250,
        swipeToDelete : true,
        filterFunction : this.filterList.bind(this),
        formatters : {
            key : function(value, model) {
                if (value)
                    return model.keyString();
                return "";
            },
            chatName : function(value, model) {
                if (value)
                    return emojify(model.chatName, 18);
            },
            unreadBool : function(value, model) {
                return (model.unread == 0 ? "false" : "true");
            },
            unread : function(value, model) {
                return (model.unread == 0 ? "" : "" + model.unread);
            },
            icon : function(value, model) {
                if (model.picturepath) {
                	var imgSize = '60:60';
                	if (_appAssistant.isPre3())
                		imgSize = '90:90';
              		return '<div class="chat-list-icon picture icon left" style="background-image:url(/var/luna/data/extractfs' + encodeURIComponent(model.picturepath) + ':0:0:' + imgSize + ':3)"></div>';
                } else {
                	return '<div class="chat-list-icon ' + (model.isGroup ? "group-icon" : "person-icon") + ' icon left"></div>';
                }
            },
            time : function(value, model) {
                if (model.lastMessage != null && model.lastMessage.timestamp != null) {
                    return Mojo.Format.formatDate(new Date(model.lastMessage.timestamp), {
                        time : "short"
                    });
                }
                return "";
            },
            textMessage : function(value, model) {
                var msg = model.lastMessage;
                if (msg && msg.data != null) {
                    var jidName = _appAssistant.getNameForJid(model, msg);
                    var msgFomatted = msg.formatTextMessage(false, true, 16);
                    var text = (jidName == null || !model.isGroup ? msgFomatted : jidName + ": " + msgFomatted);
                    return text;
                }
                return "";
            },
            statusIcon : function(value, model) {
                var msg = model.lastMessage;
                if (msg) {
                    return msg.statusIconStyle();
                }
            }
        }
    }, this.listModel);

    /* add event handlers to listen to events from widgets */

    this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
    this.listDeleteHandler = this.listDeleteHandler.bindAsEventListener(this);

    Mojo.Event.listen(this.listElement, Mojo.Event.listTap, this.listTapHandler);
    Mojo.Event.listen(this.listElement, Mojo.Event.listDelete, this.listDeleteHandler);
};

ChatsListAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        switch(event.command) {
            case 'goBack':
                this.controller.stageController.popScene();
                break;
            case 'createGroup':
                if (Group.OWNING_GROUPS.length < _appData.get().max_groups) {
                    this.controller.stageController.pushScene('group', null, null, 'new');
                } else {
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

ChatsListAssistant.prototype.listTapHandler = function(event) {
    // if (event.item.isGroup)
    // this.controller.stageController.pushScene("group-chat", event.item);
    // else
    this.controller.stageController.pushScene("chat", event.item);
}

ChatsListAssistant.prototype.listDeleteHandler = function(event) {
    var chat = event.item;
    _appDB.deleteChat(chat, function() {
        if (this.listElement.mojo.getLength() == 0)
            this.controller.stageController.popScene("", {
                transition : Mojo.Transition.crossFade
            });
        else {
            this.listElement.mojo.noticeRemovedItems(event.index, 0);
        }
        _appAssistant.notifyUpdateChats(this);
    }.bind(this));
}

ChatsListAssistant.prototype.filterList = function(filterString, listWidget, offset, count) {
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

ChatsListAssistant.prototype.updateChats = function() {
    _appDB.getAllChatsWithMessages( function(chats) {
        this.listModel.items = [];
        this.controller.modelChanged(this.listModel, this);
        this.listModel.items = chats;
        this.listElement.mojo.noticeAddedItems(0, this.listModel.items);
    }.bind(this));
}

ChatsListAssistant.prototype.activate = function(event) {
    /* put in event handlers here that should only be in effect when this scene is active. For
     example, key handlers that are observing the document */

    if (this.listElement.mojo.getLength() == 0)
        this.controller.stageController.popScene();
}

ChatsListAssistant.prototype.deactivate = function(event) {
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
     this scene is popped or another scene is pushed on top */
}

ChatsListAssistant.prototype.firstLetter = function(data) {
    // return the first letter of the position (G,C,F)
    return data.chatName[0];
}

ChatsListAssistant.prototype.cleanup = function(event) {
    _chatsAssistant = null;
    Mojo.Event.stopListening(this.listElement, Mojo.Event.listTap, this.listTapHandler);
    Mojo.Event.stopListening(this.listElement, Mojo.Event.listDelete, this.listDeleteHandler);
};
