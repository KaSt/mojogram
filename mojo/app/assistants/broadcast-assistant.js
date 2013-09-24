BroadcastAssistant.MAX_RECIPIENTS = 50;

/**
 *
 * @param {Object} params
 *
 * {
 * 		action: "broadcast" | "info" | "multiple" | "forward"
 *
 * 		// for "info"
 *
 * 		chat: {Object}
 * 		group: {Object}
 * 		message: {Object}
 *
 * 		// for "forward"
 *      message: {Object}
 *
 *
 * }
 */
function BroadcastAssistant(params){
    this.params = params;
    this.popupIndex = -1;
    
    
    
    this.showAttach = (this.params.action == "multiple" || this.params.action == "broadcast");
    this.showFooter = (this.params.action != "info" && this.params.action != "forward");
    this.handleTap = (this.params.action != "info");
    this.showSelectMessageGroup = (this.params.action != "info");
    this.showEmojiButton = (this.showFooter);
    this.showSendButton = (this.params.action != "info");
    
    this.title = "";
    switch (this.params.action) {
        case "broadcast":
            this.title = $L("Broadcast message");
            break;
        case "info":
            this.title = $L("Broadcast message");
            break;
        case "multiple":
            this.title = $L("Multiple recipients");
            break;
        case "forward":
            this.title = $L("Forward message");
            break;
    }
    
    
    this.listModel = {
        items: []
    };
    
    this.messageListModel = {
        items: []
    };
    
    this.selectedCount = 0;
    this.currentListModel = this.listModel;
    _broadcastAssistant = this;
}

BroadcastAssistant.prototype.setup = function(){
    this.menuModel = {
        visible: true,
        items: []
    };
    
    this.controller.setupWidget(Mojo.Menu.appMenu, this.attributesAppMenu = {
        omitDefaultItems: true
    }, this.appMenuModel = {
        visible: true,
        items: [Mojo.Menu.editItem, {
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
        }]
    });
    
    
    //    this.controller.get("headerTitle").update($L("Broadcast message"));
    //    var titleWidth = Mojo.Environment.DeviceInfo.screenWidth - 40;
    //    this.controller.get("header").style.width = titleWidth + 'px';
    
    if (this.showSelectMessageGroup) {
        this.controller.get("selectmessage").update($L("Select recipients") + (this.params.action == "broadcast" ? ". " + $L("Only recipients who have you in their contact list will recieve the message") : ""));
        this.controller.get("selectMessageGroup").style.display = "block";
    }
    
    this.listElement = this.controller.get("chatsList");
    
    if (this.params.action == "info") {
        this.messageListModel.items.push(this.params.chat.lastMessage);
    }
    else 
        if (this.params.action == "forward") {
            this.params.message.from_me = true;
            this.params.message.status = Message.STATUS_NONE;
            this.messageListModel.items.push(this.params.message);
        }
    
    this.messageListWidget = this.controller.get("messageList");
    
    this.controller.setupWidget("messageList", {
        itemTemplate: "chat/message-list-entry",
        hasNoWidgets: true,
        dividerTemplate: "broadcast/list-divider",
        dividerFunction: function(data){
            return $L("Message");
        },
        formatters: {
            bubbleclass: function(value, model){
                return _appPrefs.cookieData.bubbleclass;
            },
            imagePreview: function(value, model){
                if ("previewImage" in model) {
                    return model.previewImage();
                }
                return "";
            },
            time: function(value, model){
                if (model.timestamp) {
                    if (this.params.action == "forward") 
                        return "";
                    return Mojo.Format.formatDate(new Date(model.timestamp), {
                        time: 'short'
                    });
                }
            }
.bind(this)            ,
            msgType: function(value, model){
                if ("data" in model && model.isNotification()) 
                    return "notification";
                return (model.from_me ? "my-chat" : "their-chat");
            },
            statusIcon: function(value, model){
                if ('statusIconStyle' in model) 
                    return model.statusIconStyle();
            },
            nameVisible: function(value, model){
                return "none";
            }
.bind(this)            ,
            contactName: function(value, model){
                return "";
            }
.bind(this)            ,
            contactColor: function(value, model){
                return "";
            }
.bind(this)            ,
            data: function(value, model){
                if ("data" in model) 
                    return model.formatTextMessage(true, true, Number(_appPrefs.cookieData.chatTextSize) + 2);
            },
            textSize: function(value, model){
                return String(_appPrefs.cookieData.chatTextSize);
            }
        }
    }, this.messageListModel);
    
    this.controller.setupWidget("chatsList", {
        itemTemplate: "broadcast/list-entry",
        dividerTemplate: "broadcast/list-divider",
        dividerFunction: function(data){
            if (this.params.action == "multiple" || this.params.action == "forward") {
                return (data.isGroup ? $L("Groups") : $L("Contacts"));
            }
            return $L("recipients");
        }
.bind(this)        ,
        delay: 250,
        filterFunction: this.filterList.bind(this),
        onItemRendered: function(listWidget, itemModel, itemNode){
            try {
                if (itemModel.iswa && !itemModel.rendered) {
                    _plugin.sendGetPictureIds(JSON.stringify([itemModel.jid]));
                    itemModel.rendered = true;
                }
            } 
            catch (e) {
                Mojo.Log.error("error onItemRendered: %j", e);
            }
        },
        formatters: {
            icon: function(value, model){
                if (model.picturepath) {
                    var imgSize = '60:60';
                    if (_appAssistant.isPre3()) 
                        imgSize = '90:90';
                    return '<div class="chat-list-icon picture icon left" style="background-image:url(/var/luna/data/extractfs' + encodeURIComponent(model.picturepath) + ':0:0:' + imgSize + ':3)"></div>';
                }
                else {
                    return '<div class="chat-list-icon group-icon icon left"></div>';
                }
            },
            chatName: function(value, model){
                if (value) 
                    return emojify(model.chatName, 18);
            },
            status: function(value, model){
                if (value) {
                    if (model.status) 
                        return emojify(model.status, 18);
                    return "";
                }
            },
            selected: function(value, model){
                if (value) {
                    if (model.selected) 
                        return "block";
                    return "none";
                }
                return "none";
            }
        }
    }, this.listModel);
    
    
    this.messageTextWidget = this.controller.get("messageText");
    this.controller.setupWidget("messageText", this.attributes = {
        hintText: $L("Write your message here..."),
        autofocus: true,
        multiline: true,
        modifierState: Mojo.Widget.shiftSingle,
        enterSubmits: false,
        focusMode: Mojo.Widget.focusInsertMode,
        changeOnKeyPress: true,
        emoticons: true
    }, this.model = {
        value: ""
    });
    
    if (!this.showFooter) {
        this.controller.get("footer").style.display = "none";
    }
    
    this.menuModel = {
        visible: true,
        items: []
    };
    
    if (_chatsAssistant != null && _appAssistant.isTouchPad()) {
        this.menuModel.items.push({
            icon: "back",
            command: "goBack"
        });
    }
    
    this.menuModel.items = this.menuModel.items.concat([(this.showEmojiButton ? {
        icon: "emoticon",
        command: "emoji"
    } : {}), {}, {}, (this.showSendButton ? {
        icon: "send",
        command: "send"
    } : {})]);
    
    this.controller.setupWidget(Mojo.Menu.commandMenu, {
        spacerHeight: 0,
        menuClass: "no-fade right"
    }, this.menuModel);
    
    var titleWidth = (this.showAttach ? 200 : 260);
    
    if (_appAssistant.isTouchPad()) {
        var space = (this.showAttach ? 120 : 60);
        titleWidth = Mojo.Environment.DeviceInfo.screenWidth - space;
    }
    
    this.controller.setupWidget(Mojo.Menu.viewMenu, this.viewMenuAttributes = {
        spacerHeight: 0,
        menuClass: "no-fade"
    }, this.viewMenuModel = {
        visible: true,
        items: [{
            items: [{
                icon: "search",
                command: "search"
            }, {
                template: "chat/header-title",
                label: this.title,
                width: titleWidth
            }, (this.showAttach ? {
                icon: "attach",
                command: "attach",
            } : {})]
        }]
    });
    
    if (this.handleTap) {
        this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.listElement, Mojo.Event.listTap, this.listTapHandler);
    }
    
    if (this.params.action == "info") {
        this.listMessageTapHandler = this.listMessageTapHandler.bindAsEventListener(this);
        Mojo.Event.listen(this.messageListWidget, Mojo.Event.listTap, this.listMessageTapHandler);
    }
    
    this.ctrlKeyPressed = false;
}



BroadcastAssistant.prototype.updateSelectedCount = function(){
    switch (this.params.action) {
        case "broadcast":
        case "multiple":
        case "forward":
            this.viewMenuModel.items[0].items[1].status = this.selectedCount + "/" + BroadcastAssistant.MAX_RECIPIENTS + " " + $L("selected");
            this.controller.modelChanged(this.viewMenuModel);
            break;
        case "info":
            this.viewMenuModel.items[0].items[1].status = $L("Recipients who have received") + ": " + this.params.chat.pictureid;
            this.controller.modelChanged(this.viewMenuModel);
            break;
    }
}

BroadcastAssistant.prototype.updateBroadcastStatus = function(msg){
    if (msg) {
        this.messageListModel.items[0].status = msg.status;
        this.controller.modelChanged(this.messageListModel);
    }
    this.ready();
}


BroadcastAssistant.prototype.dividerList = function(data){
    //    if (data.isGroup) 
    //        return $L("Groups").toUpperCase();
    //    else 
    //        return $L("Contacts").toUpperCase();
    return data.chatName.toUpperCase()[0];
}

BroadcastAssistant.prototype.filterList = function(filterString, listWidget, offset, count){
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

BroadcastAssistant.prototype.updatePicture = function(jid, picturepath){
    Mojo.Log.info("Update broadcast Picture called");
    for (var i = 0; i < this.currentListModel.items.length; i++) {
        if (this.currentListModel.items[i].jid == jid) {
            this.currentListModel.items[i].picturepath = picturepath;
            this.listElement.mojo.noticeUpdatedItems(i, [this.currentListModel.items[i]]);
            return;
        }
    }
}

BroadcastAssistant.prototype.ready = function(){
    this.loadChats();
    this.updateSelectedCount();
}

BroadcastAssistant.prototype.messageTextKeydown = function(event){
    if (event && event.originalEvent.keyCode === 129) {
        this.ctrlKeyPressed = true;
    }
}

BroadcastAssistant.prototype.messageTextKeyup = function(event){
    if (event) {
        if (event.originalEvent.keyCode === 129) {
            this.ctrlKeyPressed = false;
        }
        else 
            if (Mojo.Char.isEnterKey(event.originalEvent.keyCode) && this.ctrlKeyPressed) {
                Event.stop(event);
                this.handleCommand({
                    type: Mojo.Event.command,
                    command: "send"
                });
            }
    }
}

BroadcastAssistant.prototype.listMessageTapHandler = function(event){
    this.popupIndex = event.index;
    var msg = event.item;
    var items = this.getPopupMenu(msg);
    if (items.length > 0) {
        this.controller.popupSubmenu({
            onChoose: this.popupHandler,
            placeNear: event.originalEvent.target,
            items: items
        });
    }
}

BroadcastAssistant.prototype.getPopupMenu = function(msg){
    var popupCommands = [];
    if (msg.media_wa_type != Message.WA_TYPE_UNDEFINED) {
        if (msg.media_wa_type != Message.WA_TYPE_CONTACT && msg.media_wa_type != Message.WA_TYPE_LOCATION && msg.media_wa_type != Message.WA_TYPE_SYSTEM) {
            if (msg.status == Message.STATUS_MEDIA_DOWNLOADED || (msg.from_me && msg.downloadedFile != null)) {
                popupCommands.push({
                    label: $L('Open'),
                    command: 'media-open'
                });
            }
            if (msg.from_me && (msg.status == Message.STATUS_MEDIA_UPLOADING || msg.status == Message.STATUS_NONE || msg.status == Message.STATUS_MEDIA_UPLOADERROR)) {
                popupCommands.push({
                    label: $L('Upload and send'),
                    command: 'media-upload'
                });
            }
            
            if (msg.status == Message.STATUS_MEDIA_UPLOADING) {
                popupCommands.push({
                    label: $L('Stop upload'),
                    command: 'media-stop-upload'
                });
            }
        }
        else 
            if ((msg.media_wa_type != Message.WA_TYPE_CONTACT) || !msg.from_me) {
                popupCommands.push({
                    label: $L('Open'),
                    command: 'media-open'
                });
            }
        
    }
    return popupCommands;
}

BroadcastAssistant.prototype.listTapHandler = function(event){
    var index = event.index;
    var chat = event.item;
    
    var selected = !chat.selected;
    
    if (selected) {
        if (this.selectedCount == BroadcastAssistant.MAX_RECIPIENTS) {
            this.controller.showAlertDialog({
                onChoose: function(value){
                },
                title: $L("Notification"),
                message: $L("You can only select up to #{max} recipients").interpolate({
                    max: BroadcastAssistant.MAX_RECIPIENTS
                }),
                choices: [{
                    label: $L("Back"),
                    value: "back",
                    type: "negative"
                }]
            });
            
            return;
        }
        else {
            this.selectedCount++;
        }
    }
    else {
        this.selectedCount--;
    }
    
    chat.selected = selected;
    this.updateSelectedCount();
    this.controller.get(this.listElement).mojo.noticeUpdatedItems(index, [this.currentListModel.items[index]]);
}

BroadcastAssistant.prototype.loadChats = function(){
    this.listModel.items = [];
    this.controller.modelChanged(this.listModel, this);
    
    var fContacts = function(contacts){
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].iswa) {
                var chat = new Chat(contacts[i].name, contacts[i].jid, false, false, null, null, contacts[i].picturepath, null, null);
                chat.iswa = contacts[i].iswa;
                chat.status = contacts[i].status;
                this.listModel.items.push(chat);
            }
        }
        this.listElement.mojo.noticeAddedItems(0, this.listModel.items);
        this.currentListModel = this.listModel;
    }
.bind(this);
    
    switch (this.params.action) {
        case "info":
            Mojo.Log.info("Participants = %j", this.params.group.getParticipantsArray());
            _appDB.getTheseContacts(JSON.parse(this.params.group.owner), function(contacts){
                for (var i = 0; i < contacts.length; i++) {
                    var chat = new Chat(contacts[i].name, contacts[i].jid, false, false, null, null, contacts[i].picturepath, null, null);
                    chat.iswa = contacts[i].iswa;
                    chat.status = contacts[i].status;
                    this.listModel.items.push(chat);
                    if (!this.params.group.existsParticipant(chat.jid)) {
                        chat.selected = true;
                    }
                }
                this.listElement.mojo.noticeAddedItems(0, this.listModel.items);
                this.currentListModel = this.listModel;
            }
.bind(this));
            break;
        case "broadcast":
            _appDB.getAllContacts(fContacts);
            break;
        case "multiple":
        case "forward":
            _appDB.getAllGroupChats(function(chats){
            
                this.listModel.items = chats;
                _appDB.getAllContacts(fContacts);
            }
.bind(this), true);
            break;
    }
}

BroadcastAssistant.prototype.getSelectedJids = function(){
    var chats = [];
    for (var i = 0; i < this.listModel.items.length; i++) {
        if (this.listModel.items[i].selected) 
            chats.push(this.listModel.items[i].jid);
    }
    
    return chats;
}


BroadcastAssistant.prototype.sendMultipleMessage = function(text, msg){
    var recipients = this.getSelectedJids();
    
    for (var i = 0; i < recipients.length; i++) {
        var jid = recipients[i];
        var msgSend = (msg ? msg.cloneToSend(jid) : new Message(jid, text));
        _mojowhatsupPlugin.messageForMe(msgSend, false);
        _mojowhatsupPlugin.safePluginCall(function(){
            _plugin.sendMessage(msgSend.toJSONString());
        });
    }
    
    this.controller.stageController.popScene();
}

BroadcastAssistant.prototype.sendBroadcastMessage = function(msg, mediaPath){
    var recipients = this.getSelectedJids();
    msg.remote_jid = "broadcast";
    msg.keyId = (msg.keyId.indexOf("broadcast") == 0 ? msg.keyId : "broadcast-" + msg.keyId);
    msg.wants_receipt = true;
    
    Mojo.Log.info("Message to send = ", msg.toJSONString());
    
    var msgSend = msg.cloneToSend(msg.keyId);
    msgSend.keyId = msg.keyId;
    msgSend.status = msg.status;
    msgSend.remote_resource = JSON.stringify(recipients);
    var chat = new Chat(recipients.length + " " + $L("recipients"), msg.keyId, true, 0, msgSend, null, null);
    var group = new Group(chat.jid, recipients.length, msgSend.remote_resource, "", 0, 0, "");
    group.setParticipantsArray(recipients);
    _appDB.createGroup(group, function(group){
        _appDB.createChat(chat, function(chat){
            _appDB.updateChatPicture(chat.jid, "0/" + recipients.length, "", function(){
                _mojowhatsupPlugin.messageForMe(chat.lastMessage, false);
                if (mediaPath) {
                    MediaUploader.upload(chat.lastMessage, mediaPath);
                }
                else {
                    _mojowhatsupPlugin.safePluginCall(function(){
                        _plugin.sendBroadcastMessage(JSON.stringify(recipients), msg.toJSONString());
                    });
                }
                _appAssistant.notifyUpdateBroadcast();
            }
.bind(this));
        }
.bind(this));
    }
.bind(this));
    if (mediaPath == undefined) 
        this.controller.stageController.popScene();
    
}

BroadcastAssistant.prototype.popupHandler = function(command){
    var msg = this.messageListModel.items[this.popupIndex];
    switch (command) {
        case 'media-upload':
            Media.getThumbImage(this.controller.document, msg, function(thumbBase64){
                msg.data = thumbBase64;
                MediaUploader.upload(msg, msg.downloadedFile);
            });
            break;
        case 'media-open':
            Media.openMedia(msg, this.controller.stageController);
            break;
        case 'media-stop-upload':
            MediaUploader.stopUpload(msg);
            break;
    };
    }

BroadcastAssistant.prototype.handleCommand = function(event){
    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case 'goBack':
                this.controller.stageController.popScene();
                break;
            case 'send':
                if (this.selectedCount > 0) {
                    if (this.params.action == "forward") {
                        this.sendMultipleMessage("", this.params.message);
                    }
                    else {
                        var text = this.messageTextWidget.mojo.getValue();
                        text = text.replace(/\s+$/g, "");
                        if (!text.empty()) {
                            if (this.params.action == "broadcast") {
                                var msg = new Message("broadcast", text);
                                this.sendBroadcastMessage(msg);
                            }
                            else 
                                if (this.params.action == "multiple") {
                                    this.sendMultipleMessage(text);
                                }
                        }
                    }
                }
                else {
                    this.controller.showAlertDialog({
                        onChoose: function(value){
                        },
                        title: $L("Notification"),
                        message: $L("You must select at least one recipient"),
                        choices: [{
                            label: $L("Back"),
                            value: "back",
                            type: "affirmative"
                        }]
                    });
                }
                break;
            case 'emoji':
                Event.stop(event);
                this.controller.stageController.pushScene("emoji-dialog");
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
            case "search":
                this.listElement.mojo.open();
                break;
            case "attach":
                if (this.selectedCount == 0) {
                    this.controller.showAlertDialog({
                        onChoose: function(value){
                        },
                        title: $L("Notification"),
                        message: $L("You must select at least one recipient"),
                        choices: [{
                            label: $L("Back"),
                            value: "back",
                            type: "affirmative"
                        }]
                    });
                }
                else {
                    this.controller.popupSubmenu({
                        onChoose: function(command){
                            event.command = command;
                            this.handleCommand(event);
                        }
.bind(this)                        ,
                        placeNear: event.originalEvent.target,
                        items: [{
                            label: $L("image"),
                            command: "sendImage",
                            icon: "preview-icon image-default"
                        }, {
                            label: $L("audio"),
                            command: "sendAudio",
                            icon: "preview-icon audio-default"
                        }, {
                            label: $L("video"),
                            command: "sendVideo",
                            icon: "preview-icon video-default"
                        }, {
                            label: $L("location"),
                            command: "sendLocation",
                            icon: "preview-icon location-default"
                        }, {
                            label: $L("vcard"),
                            command: "sendContact",
                            icon: "preview-icon contact-default"
                        }]
                    });
                }
                break;
            case 'sendImage':
                Event.stop(event);
                this.sendFileHandler(Message.WA_TYPE_IMAGE);
                break;
            case 'sendAudio':
                Event.stop(event);
                this.sendFileHandler(Message.WA_TYPE_AUDIO);
                break;
            case 'sendVideo':
                Event.stop(event);
                this.sendFileHandler(Message.WA_TYPE_VIDEO);
                break;
            case 'sendLocation':
                Event.stop(event);
                this.controller.stageController.pushScene("location");
                break;
            case 'sendContact':
                this.controller.stageController.pushScene({
                    appId: 'com.palm.app.contacts',
                    name: 'list'
                }, {
                    mode: 'picker',
                    message: $L("Select a contact")
                });
                break;
        }
    }
    else 
        if (event.type == Mojo.Event.forward) {
            this.handleCommand({
                type: Mojo.Event.command,
                command: "send"
            });
        }
}

BroadcastAssistant.prototype.activate = function(event){
    this.keyDownHandler = this.messageTextKeydown.bindAsEventListener(this);
    this.keyUpHandler = this.messageTextKeyup.bindAsEventListener(this);
    Mojo.Event.listen(this.controller.document, Mojo.Event.keydown, this.keyDownHandler, true);
    Mojo.Event.listen(this.controller.document, Mojo.Event.keyup, this.keyUpHandler, true);
    
    if (event && "selectedEmoji" in event) {
        if (event.selectedEmoji != null) {
            var message = this.messageTextWidget.mojo.getValue();
            var cursorPosition = {
                selectionStart: 0,
                selectionEnd: 0
            };
            if (message.length > 0) {
                cursorPosition = this.messageTextWidget.mojo.getCursorPosition();
            }
            var emojiText = convertUnicodeCodePointsToString(['0x' + event.selectedEmoji]);
            var text = message.substr(0, cursorPosition.selectionStart);
            text += emojiText;
            var newCursorPosition = text.length;
            this.messageTextWidget.mojo.setCursorPosition(newCursorPosition, newCursorPosition);
            text += message.substr(cursorPosition.selectionEnd);
            
            this.messageTextWidget.mojo.setValue(text);
        }
    }
    else 
        if (event && "longitude" in event) {
            var msg = new Message(this.params.action, "");
            msg.media_wa_type = Message.WA_TYPE_LOCATION;
            msg.longitude = event.longitude;
            msg.latitude = event.latitude;
            
            if (this.params.action == "multiple") 
                this.sendMultipleMessage("", msg);
            else 
                if (this.params.action == "broadcast") 
                    this.sendBroadcastMessage(msg);
        }
        else 
            if (event && "_id" in event) {
                var msg = new Message(this.params.action, "");
                msg.media_wa_type = Message.WA_TYPE_CONTACT;
                var vcardData = Media.fromPersonToVcard(event);
                msg.media_name = vcardData.name;
                msg.data = vcardData.vcard;
                if (this.params.action == "multiple") 
                    this.sendMultipleMessage("", msg);
                else 
                    if (this.params.action == "broadcast") 
                        this.sendBroadcastMessage(msg);
            }
    
    this.messageTextWidget.mojo.focus();
}

BroadcastAssistant.prototype.sendFileHandler = function(fileType){
    var params = null;
    
    switch (fileType) {
        case Message.WA_TYPE_IMAGE:
            params = {
                kind: "image",
                actionName: $L("Send"),
                extensions: ["jpg", "bmp", "gif", "png"],
                onSelect: function(file){
                    var msg = new Message(this.params.action, "");
                    msg.media_wa_type = Message.WA_TYPE_IMAGE;
                    this.uploadFileMedia(file, msg);
                }
.bind(this)
            };
            break;
        case Message.WA_TYPE_AUDIO:
            params = {
                kind: "audio",
                actionName: "Send",
                extensions: ["mp3", "wav"],
                onSelect: function(file){
                    var msg = new Message(this.params.action, "");
                    msg.media_wa_type = Message.WA_TYPE_AUDIO;
                    this.uploadFileMedia(file, msg);
                }
.bind(this)
            };
            break;
        case Message.WA_TYPE_VIDEO:
            params = {
                kind: "video",
                actionName: "Send",
                extensions: ["mpg", "avi", "mp4", "3gp"],
                onSelect: function(file){
                    var msg = new Message(this.params.action, "");
                    msg.media_wa_type = Message.WA_TYPE_VIDEO;
                    this.uploadFileMedia(file, msg);
                }
.bind(this)
            };
            
            break;
    }
    
    Mojo.FilePicker.pickFile(params, this.controller.stageController);
};

BroadcastAssistant.prototype.uploadFileMedia = function(file, msg){
    msg.downloadedFile = file.fullPath;
    setTimeout(function(){
        Media.getThumbImage(this.controller.document, msg, function(base64){
            msg.data = base64;
            if (this.params.action == "multiple") {
                var recipients = this.getSelectedJids();
                for (var i = 0; i < recipients.length; i++) {
                    var jid = recipients[i];
                    var msgSend = msg.cloneToSend(jid);
                    msgSend.status = Message.STATUS_MEDIA_UPLOADING;
                    msgSend.downloadedFile = file.fullPath;
                    _mojowhatsupPlugin.messageForMe(msgSend, false);
                    MediaUploader.upload(msgSend, file.fullPath);
                }
            }
            else 
                if (this.params.action == "broadcast" || this.params.action == "info") {
                    msg.status = Message.STATUS_MEDIA_UPLOADING;
                    msg.downloadedFile = file.fullPath;
                    this.sendBroadcastMessage(msg, file.fullPath);
                }
            this.controller.stageController.popScene();
        }
.bind(this));
    }
.bind(this), 1000);
}


BroadcastAssistant.prototype.deactivate = function(event){
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
     this scene is popped or another scene is pushed on top */
    Mojo.Event.stopListening(this.controller.document, Mojo.Event.keyup, this.keyUpHandler, true);
    Mojo.Event.stopListening(this.controller.document, Mojo.Event.keydown, this.keyDownHandler, true);
}

BroadcastAssistant.prototype.cleanup = function(event){
    _broadcastAssistant = null;
    if (this.handleTap) {
        Mojo.Event.stopListening(this.listElement, Mojo.Event.listTap, this.listTapHandler);
    }
    
    if (this.showAttach) {
        Mojo.Event.stopListening(this.messageListWidget, Mojo.Event.listTap, this.listMessageTapHandler);
    }
}
