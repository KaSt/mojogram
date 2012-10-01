var colorPalette = ["SlateBlue", "Olive", "red", "green", "brown", "orange", "blue", "DeepPink", "brown", "black", "yellow", "purple", "gold", "violet", "DarkCyan", "Tomato", "Fuchsia", "Indigo"];

function ChatAssistant(chat) {
    this.INCREMENT_LOAD = 25;
    this.messagesToLoad = this.INCREMENT_LOAD;
    this.colorIndex = 0;
    this.chat = chat;
    this.nameDisplayHash = new HashTable();
    this.messageListModel = {
        items : []
    };
    this.timerTyping = null;
    _openChatAssistant = this;
}

ChatAssistant.prototype.setup = function() {

    this.appMenuItems = [Mojo.Menu.editItem, {
        label : $L("Send image"),
        command : "sendImage"
    }, {
        label : $L("Send audio"),
        command : "sendAudio"
    }, {
        label : $L("Send video"),
        command : "sendVideo"
    }, {
        label : $L("Send location"),
        command : "sendLocation"
    }, {
        label : $L("Send contact"),
        command : "sendContact"
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
    }];

    if (this.chat.isGroup) {
        this.appMenuItems.splice(6, 0, {
            label : $L("Group properties"),
            command : "groupProperties"
        });
    }

    this.controller.setupWidget(Mojo.Menu.appMenu, {
        omitDefaultItems : true
    }, {
        visible : true,
        items : this.appMenuItems
    });

    this.buttonMoreWidget = this.controller.get("moreMessages");
    this.controller.setupWidget("moreMessages", {
        type : Mojo.Widget.activityButton
    }, this.moreMessagesModel = {
        label : $L("Show previous messages"),
        buttonClass : "secondary",
        disabled : true
    });

    this.messageListWidget = this.controller.get("messageList");

    this.controller.setupWidget("messageList", {
        itemTemplate : "chat/message-list-entry",
        dividerTemplate : "chat/message-list-divider",
        dividerFunction : this.messageDateTime,
        swipeToDelete : true,
        hasNoWidgets : true,
        formatters : {
            imagePreview : function(value, model) {
                if ("previewImage" in model) {
                    return model.previewImage();
                }
                return "";
            },
            time : function(value, model) {
                return Mojo.Format.formatDate(new Date(model.timestamp), {
                    time : 'short'
                });
            },
            msgType : function(value, model) {
                if ("data" in model && model.isNotification())
                    return "notification";
                return (model.from_me ? "my-chat" : "their-chat");
            },
            statusIcon : function(value, model) {
                if ('statusIconStyle' in model)
                    return model.statusIconStyle();
            },
            nameVisible : function(value, model) {
                if ("data" in model && model.isNotification())
                    return "none";
                return (this.chat.isGroup && model.notifyname != null ? "inline-block" : "none");
            }.bind(this),
            contactName : function(value, model) {
                var info = this.nameDisplayHash.getItem(model.remote_resource);
                if (info === undefined) {
                    return model.notifyname;
                }
                return info.name;
            }.bind(this),
            contactColor : function(value, model) {
                var info = this.nameDisplayHash.getItem(model.remote_resource);
                if (info === undefined) {
                    return "blue";
                }
                return info.color;
            }.bind(this),
            data : function(value, model) {
                if ("data" in model)
                    return model.formatTextMessage(true, true, Number(_appPrefs.cookieData.chatTextSize) + 2);
            },
            textSize : function(value, model) {
            	return String(_appPrefs.cookieData.chatTextSize);
            }
        }
    }, this.messageListModel);

    this.messageTextWidget = this.controller.get("messageText");
    this.controller.setupWidget("messageText", this.attributes = {
        hintText : $L("Write your message here..."),
        autofocus : true,
        multiline : true,
        modifierState : Mojo.Widget.shiftSingle,
        enterSubmits : false,
        focusMode : Mojo.Widget.focusInsertMode,
        changeOnKeyPress : true,
        emoticons : true
    }, this.model = {
        value : String((_chatTextClipboard.getItem(this.chat.jid) !== undefined ? _chatTextClipboard.getItem(this.chat.jid) : ""))
    });

    this.menuModel = {
        visible : true,
        items : []
    };

    if (_mainAssistant != null && _appAssistant.isTouchPad()) {
        this.menuModel.items.push({
            icon : "back",
            command : "goBack"
        });

        this.controller.get("emoticon-Button").addClassName("touchpad");
    }

    this.menuModel.items = this.menuModel.items.concat([{
        icon : "emoticon",
        command : "emoji"
    }, {}, {}, {}, {
        icon : "send",
        command : "send"
    }]);

    this.controller.setupWidget(Mojo.Menu.commandMenu, {
        spacerHeight : 0,
        menuClass : "no-fade right"
    }, this.menuModel);

    this.controller.get('header').update(emojify(this.chat.chatName, 18));

    this.loadMessages(this.messagesToLoad);

    if (this.chat.unread > 0) {
        this.chat.unread = 0;
        _appDB.updateChat(this.chat, function(c) {
            _appAssistant.notifyUpdateChats(this);
        });
    }

    if (!this.chat.isGroup) {
        _mojowhatsupPlugin.whenRunnerExecuting( function() {
            _mojowhatsupPlugin.safePluginCall( function() {
                _plugin.doStateRequest(this.chat.jid);
            }.bind(this));
        }.bind(this));
    }

    this.keyPressHandler = this.keyPressHandler.bindAsEventListener(this);
    this.textChangedHandler = this.textChangedHandler.bindAsEventListener(this);
    this.listDeleteHandler = this.listDeleteHandler.bindAsEventListener(this);
    this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
    this.moreMessagesHandler = this.moreMessagesHandler.bindAsEventListener(this);

    Mojo.Event.listen(this.buttonMoreWidget, Mojo.Event.tap, this.moreMessagesHandler);
    Mojo.Event.listen(this.messageListWidget, Mojo.Event.listDelete, this.listDeleteHandler);
    Mojo.Event.listen(this.messageListWidget, Mojo.Event.listTap, this.listTapHandler);
    Mojo.Event.listen(this.messageTextWidget, Mojo.Event.propertyChange, this.textChangedHandler);
    
    this.ctrlKeyPressed = false;
}

ChatAssistant.prototype.messageTextKeydown = function(event) {
	if (event && event.originalEvent.keyCode ===129) {
		this.ctrlKeyPressed = true;
	}
}

ChatAssistant.prototype.messageTextKeyup = function(event) {
	if (event) {
		if (event.originalEvent.keyCode ===129) {
			this.ctrlKeyPressed = false;
		} else if (Mojo.Char.isEnterKey(event.originalEvent.keyCode ) && this.ctrlKeyPressed) {
        	this.handleCommand({
            	type : Mojo.Event.command,
            	command : "send"
        	});
			Event.stop(event);
		}
	}	
}

ChatAssistant.prototype.textChangedHandler = function(event) {
    if (!this.chat.isGroup) {
        if (this.timerTyping == null) {
            _mojowhatsupPlugin.safePluginCall( function() {
                _plugin.sendTyping(this.chat.jid, 1);
            }.bind(this));
        } else {
            clearTimeout(this.timerTyping);
        }
        this.timerTyping = setTimeout( function() {
            _mojowhatsupPlugin.safePluginCall( function() {
                _plugin.sendTyping(this.chat.jid, 0);
            }.bind(this));
            this.timerTyping = null;
        }.bind(this), 2000);
    }

    _chatTextClipboard.setItem(this.chat.jid, String(this.messageTextWidget.mojo.getValue()));
}

ChatAssistant.prototype.moreMessagesHandler = function(event) {
    this.buttonMoreWidget.mojo.activate();
    this.messagesToLoad += this.INCREMENT_LOAD;
    this.loadMessages(this.messagesToLoad);
}

ChatAssistant.prototype.listDeleteHandler = function(event) {
    var msg = event.item;

    _appDB.deleteMessage(msg, function() {
        if (msg.mediaDownloader != null) {
            if (msg.mediaDownloader.downloading)
                msg.mediaDownloader.stopDownload();
            msg.mediaDownloader.removeDownloader();
        }
        if (msg.mediaUploader != null) {
            if (msg.mediaUploader.uploading)
                msg.mediaUploader.stopUpload();
            msg.mediaUploader.removeUploader();
        }

        this.messageListModel.items.splice(event.index, 1);
        this.messageListWidget.mojo.noticeRemovedItems(event.index, 0);
    }.bind(this));
}

ChatAssistant.prototype.listTapHandler = function(event) {
    this.popupIndex = event.index;
    var msg = event.item;
    this.controller.popupSubmenu({
        onChoose : this.popupHandler,
        placeNear : event.originalEvent.target,
        items : this.getPopupMenu(msg)
    });
}

ChatAssistant.prototype.getPopupMenu = function(msg) {
    var popupCommands = [];
    if (msg.media_wa_type != Message.WA_TYPE_UNDEFINED) {
        if (msg.media_wa_type != Message.WA_TYPE_CONTACT && msg.media_wa_type != Message.WA_TYPE_LOCATION && msg.media_wa_type != Message.WA_TYPE_SYSTEM) {
            if (msg.status == Message.STATUS_MEDIA_DOWNLOADED || (msg.from_me && msg.downloadedFile != null)) {
                popupCommands.push({
                    label : $L('Open'),
                    command : 'media-open'
                });
            }
            if (msg.from_me && (msg.status == Message.STATUS_MEDIA_UPLOADING || msg.status == Message.STATUS_NONE)) {
                popupCommands.push({
                    label : $L('Upload and send'),
                    command : 'media-upload'
                });
            }

            if (msg.status == Message.STATUS_MEDIA_UPLOADING) {
                popupCommands.push({
                    label : $L('Stop upload'),
                    command : 'media-stop-upload'
                });
            }

            if (!msg.from_me) {
                popupCommands.push({
                    label : $L('Download'),
                    command : 'media-download'
                });
            }

            if (msg.status == Message.STATUS_MEDIA_DOWNLOADING) {
                popupCommands.push({
                    label : $L('Stop download'),
                    command : 'media-stop-download'
                });
            }
        } else {
            popupCommands.push({
                label : $L('Open'),
                command : 'media-open'
            });
        }

    } else {
        popupCommands.push({
            label : $L('Copy message text'),
            command : 'copy-text'
        });
    }

    return popupCommands;
}

ChatAssistant.prototype.popupHandler = function(command) {
    var msg = this.messageListModel.items[this.popupIndex];
    switch (command) {
        case 'media-upload':
            Media.getThumbImage(this.controller.document, msg, function(thumbBase64) {
                msg.data = thumbBase64;
                MediaUploader.upload(msg, msg.downloadedFile, this.controller);
            });
            break;
        case 'media-download':
            MediaDownloader.download(msg);
            break;
        case 'media-open':
            Media.openMedia(msg, this.controller.stageController);
            break;
        case 'media-stop-download':
            MediaDownloader.stopDownload(msg);
            break;
        case 'media-stop-upload':
            MediaUploader.stopUpload(msg);
            break;
        case 'copy-text':
            this.controller.stageController.setClipboard(msg.data, false);
            break;
    };
}

ChatAssistant.prototype.updateChat = function() {
    _appDB.findChat(this.chat.jid, function(chat) {
        this.chat = chat;
        this.controller.get('header').update(emojify(this.chat.chatName, 18));
    }.bind(this));
}

ChatAssistant.prototype.keyPressHandler = function(event) {
    if (event.originalEvent.keyCode == Mojo.Char.enter) {
        this.handleCommand({
            type : Mojo.Event.command,
            command : "send"
        });
    }
}

ChatAssistant.prototype.updateMessageStatus = function(message) {
    var key = message.keyString();
    for (var i = 0; i < this.messageListModel.items.length; i++) {
        var msg = this.messageListModel.items[i];
        if (msg.keyString() == key) {
            msg.status = message.status;
            this.messageListWidget.mojo.noticeUpdatedItems(i, [msg]);
            break;
        }
    }
}

ChatAssistant.prototype.updateContactInfo = function(contactInfo) {
    if (this.chat.isGroup)
        return;

    var stateString = "";
    switch (contactInfo.status) {
        case 0:
            stateString = $L("(typing)");
            break;
        case 1:
            stateString = $L("(online)");
            break;
        case 2:
        default:
            if (contactInfo.lastSeen == 0)
                stateString = "";
            else {
                var time = "";
                if ((new Date().getTime() - contactInfo.lastSeen) < (24 * 60 * 60 * 1000)) {
                    time = Mojo.Format.formatDate(new Date(contactInfo.lastSeen), {
                        time : 'short'
                    });
                }
                stateString = "(" + Mojo.Format.formatRelativeDate(new Date(contactInfo.lastSeen), 'medium') + (time == "" ? "" : " " + time) + ")";
            }
            break;
    }

    this.controller.get('header').update(stateString + " " + this.chat.chatName);
}

ChatAssistant.prototype.loadMessages = function(numrows) {
    _appDB.getFirstMessages(this.chat, numrows, function(messages) {
        if (messages.length < this.messagesToLoad) {
            this.moreMessagesModel.disabled = true;
            this.moreMessagesModel.label = $L("No more messages");
        } else {
            this.moreMessagesModel.disabled = false;
        }
        this.controller.modelChanged(this.moreMessagesModel);

        this.messageListModel.items = [];
        this.controller.modelChanged(this.messageListModel);

        Mojo.Log.info("Loaded messages = ", JSON.stringify(messages.length));

        for (var i = 0; i < messages.length; i++) {
            this.setDisplayInfo(messages[i]);
            messages[i].mediaDownloader = MediaDownloader.existsDownloader(messages[i]);
            messages[i].mediaUploader = MediaUploader.existsUploader(messages[i]);
        }

        this.messageListModel.items = messages;

        this.messageListWidget.mojo.noticeAddedItems(0, this.messageListModel.items);
        if (this.messageListModel.items.length <= this.INCREMENT_LOAD) {
            this.controller.getSceneScroller().mojo.revealBottom();
        } else {
            this.messageListWidget.mojo.revealItem(this.messageListModel.items.length - (this.messagesToLoad - this.INCREMENT_LOAD), false);
        }
        this.buttonMoreWidget.mojo.deactivate();
    }.bind(this));
}

ChatAssistant.prototype.messageDateTime = function(data) {
    return Mojo.Format.formatRelativeDate(new Date(data.timestamp), 'medium');
}

ChatAssistant.prototype.nextNameColor = function() {
    var color = colorPalette[this.colorIndex];
    this.colorIndex++;
    if (this.colorIndex == colorPalette.length)
        this.colorIndex = 0;
    return color;
}

ChatAssistant.prototype.setDisplayInfo = function(msg) {
    if (this.chat.isGroup && !msg.from_me) {
        if (this.nameDisplayHash.getItem(msg.remote_resource) === undefined) {
            var color = this.nextNameColor();
            this.nameDisplayHash.setItem(msg.remote_resource, {
                "name" : _appAssistant.getNameForJid(this.chat, msg),
                "color" : color
            });
        }
    }
}

ChatAssistant.prototype.updateNewMessage = function(msg) {
    this.messageListModel.items.push(msg);
    Mojo.Log.info("List length: " + this.messageListModel.items.length);
    this.setDisplayInfo(msg);
    this.messageListWidget.mojo.noticeAddedItems(this.messageListModel.items.length - 1, [msg]);
    this.controller.getSceneScroller().mojo.revealBottom();
    // this.messageListWidget.mojo.revealItem(this.messageListModel.items.length - 1, false);
}

ChatAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        switch(event.command) {
            case 'goBack':
                this.controller.stageController.popScene();
                break;
            case 'send':
                var text = this.messageTextWidget.mojo.getValue();
                text.replace(/^\s+/, "").replace(/\s+$/, "");
                if (!text.empty()) {
                    var msg = new Message(this.chat.jid, text);
                    Mojo.Log.info("Message to send = ", msg.toJSONString());
                    _mojowhatsupPlugin.messageForMe(msg, false);
                    _mojowhatsupPlugin.safePluginCall(function() {
                        _plugin.sendMessage(msg.toJSONString());
                    });
                    this.messageTextWidget.mojo.setValue("");
                    _chatTextClipboard.removeItem(this.chat.jid);
                }
                break;
            case 'emoji':
                Event.stop(event);
                this.controller.stageController.pushScene("emoji-dialog");
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
                    appId : 'com.palm.app.contacts',
                    name : 'list'
                }, {
                    mode : 'picker',
                    message : $L("Select a contact")
                });
                break;
            case 'groupProperties':
                _appDB.findGroup(this.chat.jid, function(group) {
                    var mode = "info";
                    if (group.owner == _myJid) {
                        mode = "edit";
                    }
                    this.controller.stageController.pushScene('group', group, this.chat, mode);
                }.bind(this));
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

ChatAssistant.prototype.sendFileHandler = function(fileType) {
    var params = null;
    var msg = new Message(this.chat.jid, "");

    switch (fileType) {
        case Message.WA_TYPE_IMAGE:
            params = {
                kind : "image",
                actionName : $L("Send"),
                extensions : ["jpg", "bmp", "gif", "png"],
                onSelect : function(file) {
                    msg.media_wa_type = Message.WA_TYPE_IMAGE;
                    this.uploadFileMedia(file, msg);
                }.bind(this)
            };
            break;
        case  Message.WA_TYPE_AUDIO:
            params = {
                kind : "audio",
                actionName : "Send",
                extensions : ["mp3", "wav"],
                onSelect : function(file) {
                    msg.media_wa_type = Message.WA_TYPE_AUDIO;
                    this.uploadFileMedia(file, msg);
                }.bind(this)
            };
            break;
        case  Message.WA_TYPE_VIDEO:
            params = {
                kind : "video",
                actionName : "Send",
                extensions : ["mpg", "avi", "mp4", "3gp"],
                onSelect : function(file) {
                    msg.media_wa_type = Message.WA_TYPE_VIDEO
                    this.uploadFileMedia(file, msg);
                }.bind(this)
            };

            break;
    }

    Mojo.FilePicker.pickFile(params, this.controller.stageController);
};

ChatAssistant.prototype.uploadFileMedia = function(file, msg) {
    msg.status = Message.STATUS_MEDIA_UPLOADING;
    msg.downloadedFile = file.fullPath;
    msg.timestamp = msg.timestamp * 1000;

    _appDB.saveMessage(msg, function(msg) {
        this.chat.lastMessage = msg;
        _appDB.updateChat(this.chat, function(updated) {
            _appAssistant.notifyUpdateChats(undefined);
            setTimeout( function() {
                this.updateNewMessage(msg);
                Media.getThumbImage(this.controller.document, msg, function(thumbBase64) {
                    msg.data = thumbBase64;
                    MediaUploader.upload(msg, file.fullPath, this.controller);
                });
            }.bind(this), 1000);
        }.bind(this));
    }.bind(this));
}

ChatAssistant.prototype.activate = function(event) {
    this.keyDownHandler = this.messageTextKeydown.bindAsEventListener(this);
    this.keyUpHandler = this.messageTextKeyup.bindAsEventListener(this);
 	Mojo.Event.listen(this.controller.document, Mojo.Event.keydown, this.keyDownHandler, true);
 	Mojo.Event.listen(this.controller.document, Mojo.Event.keyup,this.keyUpHandler, true);
	
    if (event && "selectedEmoji" in event) {
        if (event.selectedEmoji != null) {
            var text = this.messageTextWidget.mojo.getValue();
            this.messageTextWidget.mojo.setValue(text + convertUnicodeCodePointsToString(['0xE' + event.selectedEmoji]));
        }
    } else if (event && "longitude" in event) {
        var msg = new Message(this.chat.jid, "");
        msg.media_wa_type = Message.WA_TYPE_LOCATION;
        msg.longitude = event.longitude;
        msg.latitude = event.latitude;
        _mojowhatsupPlugin.messageForMe(msg, false);
        _mojowhatsupPlugin.safePluginCall(function() {
            _plugin.sendMessage(msg.toJSONString());
        });
    } else if (event && "_id" in event) {
        var msg = new Message(this.chat.jid, "");
        msg.media_wa_type = Message.WA_TYPE_CONTACT;
        var vcardData = Media.fromPersonToVcard(event);
        msg.media_name = vcardData.name;
        msg.data = vcardData.vcard;
        _mojowhatsupPlugin.messageForMe(msg, false);
        _mojowhatsupPlugin.safePluginCall(function() {
            _plugin.sendMessage(msg.toJSONString());
        });
    }
    this.messageTextWidget.mojo.focus();
}

ChatAssistant.prototype.refreshList = function(event) {
	this.controller.modelChanged(this.messageListModel);	
	this.controller.getSceneScroller().mojo.revealBottom();	
}

ChatAssistant.prototype.deactivate = function(event) {
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
     this scene is popped or another scene is pushed on top */
    Mojo.Event.stopListening(this.controller.document, Mojo.Event.keyup, this.keyUpHandler, true);
    Mojo.Event.stopListening(this.controller.document, Mojo.Event.keydown, this.keyDownHandler, true);
}

ChatAssistant.prototype.cleanup = function(event) {
    _openChatAssistant = null;
    Mojo.Event.stopListening(this.buttonMoreWidget, Mojo.Event.tap, this.moreMessagesHandler);
    Mojo.Event.stopListening(this.messageListWidget, Mojo.Event.listDelete, this.listDeleteHandler);
    Mojo.Event.stopListening(this.messageListWidget, Mojo.Event.listTap, this.listTapHandler);
    Mojo.Event.stopListening(this.messageTextWidget, Mojo.Event.propertyChange, this.textChangedHandler);
    
    delete this.namesHash;
    this.namesHash = null;
}
